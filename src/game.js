// OWNER: gameplay agent. Input, third-person camera, combat, enemy AI, waves, HUD, stream purification, win/lose.
// Uses makeX from characters.js and world API from world.js. Exports createGame({scene,camera,renderer,world}) -> {update(dt,t)}.
import * as THREE from 'three';
import { makeLofi, makeImp, makeGolem, makeBoss } from './characters.js';
import { PALETTE, toon } from './style.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';

const V3 = THREE.Vector3, clamp = THREE.MathUtils.clamp, rnd = (a, b) => a + Math.random() * (b - a);
const angLerp = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };
const WAVES = 3;
const CFG = {
  imp: { make: makeImp, hp: 18, speed: 6.2, dmg: 7, xp: 5, water: 10, rad: .45, atkRange: 1.7, windup: .4, rec: .8, size: 1.1, ph: [0x7a2fa8, .9] },
  golem: { make: makeGolem, hp: 90, speed: 2.9, dmg: 20, xp: 26, water: 45, rad: 1.1, atkRange: 3.6, windup: 1.0, rec: 1.3, size: 3, ph: [0x3a2150, 1.8] },
  boss: { make: makeBoss, hp: 650, speed: 3.4, dmg: 30, xp: 400, water: 400, rad: 2.6, atkRange: 9, windup: 1.4, rec: 1.4, size: 6, ph: [0x2a1638, 3.2] },
};
const UPGRADES = [
  { icon: '\u2744', name: 'Frostbite Fists', desc: '+25% damage', f: s => s.dmg *= 1.25 },
  { icon: '\u2665', name: 'Yeti Hide', desc: '+30 max HP and heal 40', f: (s, p) => { p.maxHp += 30; p.hp = Math.min(p.maxHp, p.hp + 40); } },
  { icon: '\u00bb', name: 'Gale Strides', desc: '+12% move speed', f: s => s.speed *= 1.12 },
  { icon: '\u25ce', name: 'Glacial Quake', desc: 'Slam radius +25%, cooldown -15%', f: s => { s.slamR *= 1.25; s.slamCd *= .85; } },
  { icon: '\u2193', name: 'Snow Dancer', desc: 'Dash cooldown -30%', f: s => s.dashCd *= .7 },
  { icon: '\u2735', name: 'Thaw Siphon', desc: 'Heal 2 HP per kill', f: s => s.siphon += 2 },
  { icon: '\u2694', name: 'Swift Claws', desc: '+20% attack speed', f: s => s.atkSpd *= 1.2 },
  { icon: '\u2733', name: 'Permafrost', desc: 'Slam freezes +1.5s and deals +25%', f: s => { s.freeze += 1.5; s.slamDmg *= 1.25; } },
];

export function createGame({ scene, camera, renderer, world } = {}) {
  const hud = createHud(), audio = createAudio();
  const heightAt = (x, z) => (world && world.heightAt ? world.heightAt(x, z) : 0) || 0;
  const bounds = (world && world.bounds) || 120;
  const dom = renderer && renderer.domElement;

  let streams = world && world.streams && world.streams.length ? world.streams : null, fallbackMarkers = null;
  if (!streams) {
    streams = [{ x: 46, z: -22, radius: 12, clean: false }, { x: -52, z: 34, radius: 14, clean: false }, { x: 8, z: -72, radius: 18, clean: false }];
    fallbackMarkers = streams.map(s => { const m = new THREE.Mesh(new THREE.CircleGeometry(s.radius, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: PALETTE.sludge })); m.position.set(s.x, heightAt(s.x, s.z) + .08, s.z); scene.add(m); return m; });
  }
  const SS = streams.map((s, i) => ({ i, s, wave: 0, alive: 0, delay: 0, active: false, done: false, volume: Math.round(s.radius * s.radius * 2.2) }));
  const setClean = (i, c) => { streams[i].clean = c; if (world && world.setStreamClean) world.setStreamClean(i, c); if (fallbackMarkers) fallbackMarkers[i].material.color.set(c ? PALETTE.water : PALETTE.sludge); };

  const S = { mode: 'title', t: 0, kills: 0, water: 0, waterShown: 0, hitstop: 0, trauma: 0, bossSpawned: false, bossDead: false, time: 0, levelPending: 0, endT: 0 };
  const stats = { dmg: 1, speed: 1, slamR: 1, slamCd: 1, dashCd: 1, siphon: 0, atkSpd: 1, freeze: 1.6, slamDmg: 1 };
  const cam = { yaw: 0.6, pitch: .3, dist: 11, pos: new V3(), look: new V3(), fov: 55, init: false };

  const fillPlaceholder = (ch, color, h, r) => {
    if (ch.root.children.length) return;
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 10), toon(color)); m.position.y = h / 2 + r; ch.root.add(m);
    const e = new THREE.Mesh(new THREE.BoxGeometry(r * 1.2, r * .3, r * .4), new THREE.MeshBasicMaterial({ color: 0xffd23a })); e.position.set(0, h + r * .8, r * .8); ch.root.add(e);
  };
  const lofi = makeLofi(); fillPlaceholder(lofi, PALETTE.fur, 1.1, .6); scene.add(lofi.root);
  let lofiState = '';
  const lofiSet = (n, force) => { if (lofiState !== n || force) { lofiState = n; if (n !== 'attack' && n !== 'strike') lofi.timeScale = 1; lofi.setState(n, force); } };
  const p = { pos: new V3(0, 0, 0), vel: new V3(), face: 0, hp: 100, maxHp: 100, xp: 0, level: 1, inv: 0, dashT: 0, dashCd: 0, slamCd: 0, atkT: 0, atkDur: .4, combo: 0, comboT: 0, hitDone: true, buf: 0, slamT: 0, slamDone: true, hurtT: 0, dashDir: new V3(), radius: lofi.radius || .6, melee: 0 };
  const xpNeed = () => 24 + 16 * (p.level - 1);
  const dirF = f => new V3(Math.sin(f), 0, Math.cos(f));

  const keys = {}, mouse = { 0: false, 2: false };
  addEventListener('keydown', e => { if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); if (!e.repeat) keys[e.code] = true; audio.resume(); if (e.code === 'KeyQ') slamBuf = .3; if (e.code === 'Space') dashBuf = .25; });
  addEventListener('keyup', e => { keys[e.code] = false; });
  let slamBuf = 0, dashBuf = 0;
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('mousedown', e => {
    audio.resume();
    if (S.mode !== 'play') return;
    if (dom && document.pointerLockElement !== dom && !(e.target instanceof HTMLButtonElement)) dom.requestPointerLock && dom.requestPointerLock()?.catch?.(() => {});
    if (e.button === 0) { p.buf = .3; mouse[0] = true; } else if (e.button === 2) slamBuf = .3;
  });
  addEventListener('mouseup', e => { mouse[e.button] = false; });
  addEventListener('mousemove', e => {
    if (document.pointerLockElement !== dom || S.mode !== 'play') return;
    cam.yaw -= e.movementX * .0026; cam.pitch = clamp(cam.pitch + e.movementY * .0020, .12, 1.2);
  });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  const geo = { spike: new THREE.ConeGeometry(.5, 2.4, 5).translate(0, 1.2, 0), ring: new THREE.RingGeometry(.9, 1, 64).rotateX(-Math.PI / 2), glow: new THREE.RingGeometry(.55, 1, 40).rotateX(-Math.PI / 2), disc: new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), plane: new THREE.PlaneGeometry(1, 1), arc: new THREE.RingGeometry(1.5, 2.9, 28, 1, -Math.PI / 2 - .95, 1.9).rotateX(-Math.PI / 2) };
  const spikeMat = new THREE.MeshBasicMaterial({ color: 0xeafcff }), spikeInk = new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.BackSide });
  const spikeMatDark = new THREE.MeshBasicMaterial({ color: 0x5a1f2e }), spikeMatSlud = new THREE.MeshBasicMaterial({ color: 0x3a2150 });
  const fx = [];
  const addFx = (obj, life, fn, fnEnd) => { scene.add(obj); fx.push({ obj, life, t: 0, fn, fnEnd }); };

  const PN = 900, pGeo = new THREE.IcosahedronGeometry(1, 0), pMesh = new THREE.InstancedMesh(pGeo, new THREE.MeshBasicMaterial(), PN);
  pMesh.frustumCulled = false; pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(pMesh);
  const parts = Array.from({ length: PN }, () => ({ life: 0, pos: new V3(), vel: new V3(), size: 0, max: 1, g: 0 })), tmpM = new THREE.Matrix4(), tmpC = new THREE.Color(), zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
  let pi = 0;
  for (let i = 0; i < PN; i++) { pMesh.setMatrixAt(i, zeroM); pMesh.setColorAt(i, tmpC.set(0xffffff)); }
  const burst = (pos, n, color, speed, size, life, up = 3, g = 14) => {
    for (let k = 0; k < n; k++) {
      const q = parts[pi]; pMesh.setColorAt(pi, tmpC.set(Array.isArray(color) ? color[(Math.random() * color.length) | 0] : color)); pi = (pi + 1) % PN;
      const a = Math.random() * 6.283, s = rnd(.3, 1) * speed;
      q.pos.copy(pos); q.vel.set(Math.cos(a) * s, rnd(0, 1) * up + 1, Math.sin(a) * s); q.size = rnd(.5, 1) * size; q.life = q.max = rnd(.6, 1) * life; q.g = g;
    }
    pMesh.instanceColor.needsUpdate = true;
  };

  const dumm = new THREE.Object3D(), crackMat = new THREE.LineBasicMaterial({ color: 0x1b1f33, transparent: true }), crackGlow = new THREE.LineBasicMaterial({ color: 0xeafcff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const shock = (x, z, R, o = {}) => {
    const g = new THREE.Group(), y = heightAt(x, z), col = o.color || 0xbff4ff; g.position.set(x, y + .25, z);
    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo.ring, ringMat); ring.renderOrder = 4; g.add(ring);
    const ring2 = new THREE.Mesh(geo.disc, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false })); ring2.renderOrder = 3; g.add(ring2);
    const nS = Math.round(R * 13), mat = o.mat || spikeMat, im = new THREE.InstancedMesh(geo.spike, mat, nS), ik = new THREE.InstancedMesh(geo.spike, spikeInk, nS);
    im.frustumCulled = ik.frustumCulled = false;
    const sp = Array.from({ length: nS }, (_, k) => {
      const outer = k < nS * .55, r = outer ? R * rnd(.8, 1.02) : R * Math.pow(Math.random(), .8) * .8, a = Math.random() * 6.283, hero = k % 11 === 0;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: heightAt(x + Math.cos(a) * r, z + Math.sin(a) * r) - y - .25, rx: Math.sin(a) * rnd(.15, .55), rz: -Math.cos(a) * rnd(.15, .55), ry: rnd(0, 6.28), sc: rnd(.35, .95) * (o.spike || 1) * (outer ? 1 : .75) * (hero ? 1.5 : 1) * Math.min(1.1, .5 + R / 16), d: r / R * .3 + rnd(0, .08) };
    });
    g.add(im, ik);
    const L = [], Lh = [];
    for (let k = 0; k < Math.round(R * 3.2); k++) {
      let a = Math.random() * 6.283, r = R * rnd(.05, .2), px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; const end = R * rnd(.6, 1.05);
      while (r < end) { r += R * rnd(.07, .15); a += rnd(-.22, .22); const nx = x + Math.cos(a) * r, nz = z + Math.sin(a) * r; L.push(px, heightAt(px, pz) + .12, pz, nx, heightAt(nx, nz) + .12, nz); px = nx; pz = nz; }
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    const lines = new THREE.LineSegments(lg, crackMat), lines2 = new THREE.LineSegments(lg, crackGlow); scene.add(lines, lines2);
    addFx(g, o.life || 1.0, (t) => {
      const e = 1 - Math.pow(1 - clamp(t / .35, 0, 1), 3), sink = clamp((t - .6) / .4, 0, 1);
      ring.scale.setScalar(Math.max(.01, R * e)); ring2.scale.setScalar(Math.max(.01, R * e)); ringMat.opacity = Math.max(0, 1 - t / .5); ring2.material.opacity = Math.max(0, .35 - t / 1.2);
      crackMat.opacity = Math.max(0, 1 - t / 1.1); crackGlow.opacity = Math.max(0, .9 - t / .5);
      for (let k = 0; k < nS; k++) {
        const u = sp[k], a = clamp((t - u.d) / .1, 0, 1), cf = clamp((Math.hypot(camera.position.x - g.position.x - u.x, camera.position.z - g.position.z - u.z) - 2) / 5, .15, 1), h = a * (1 - sink) * u.sc * cf, w = Math.min(1, h * 1.3) * u.sc * .8;
        dumm.position.set(u.x, u.y, u.z); dumm.rotation.set(u.rx, u.ry, u.rz); dumm.scale.set(w, h, w); dumm.updateMatrix(); im.setMatrixAt(k, dumm.matrix);
        dumm.scale.set(w * 1.22, h * 1.07, w * 1.22); dumm.updateMatrix(); ik.setMatrixAt(k, dumm.matrix);
      }
      im.instanceMatrix.needsUpdate = ik.instanceMatrix.needsUpdate = true;
    }, () => { ringMat.dispose(); ring2.material.dispose(); im.dispose(); ik.dispose(); scene.remove(lines, lines2); lg.dispose(); });
  };

  const arcMat = () => new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const slashFx = (pos, face, wide) => {
    const m = arcMat(), a = new THREE.Mesh(geo.arc, m), g = new THREE.Group(); g.add(a); g.position.copy(pos).setY(pos.y + 1.4); g.rotation.set(0, face, wide ? 0 : (Math.random() < .5 ? .5 : -.5) * .6);
    g.scale.setScalar(wide ? 1.4 : 1);
    addFx(g, .25, (t) => { const k = t / .25; m.opacity = .9 * (1 - k); g.scale.setScalar((wide ? 1.4 : 1) * (1 + k * .25)); }, () => m.dispose());
  };
  const mkTele = (kind, w, h) => {
    const g = new THREE.Group(), edge = new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: .9, depthTest: false, depthWrite: false, side: THREE.DoubleSide }), fill = new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: .34, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    let f;
    if (kind === 'circle') { const e = new THREE.Mesh(geo.ring, edge); e.scale.setScalar(w); g.add(e); const base = new THREE.Mesh(geo.disc, new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: .12, depthTest: false, depthWrite: false })); base.scale.setScalar(w); g.add(base); f = new THREE.Mesh(geo.disc, fill); g.add(f); g.userData.set = k => f.scale.setScalar(Math.max(.01, w * k)); g.userData.extra = base.material; }
    else { const gg = new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2).translate(0, 0, h / 2); const e = new THREE.LineSegments(new THREE.EdgesGeometry(gg), new THREE.LineBasicMaterial({ color: 0xff3355 })); g.add(e); f = new THREE.Mesh(gg, fill); g.add(f); g.userData.set = k => f.scale.set(1, 1, Math.max(.01, k)); g.userData.extra = e.material; }
    g.traverse(o => { o.renderOrder = 6; });
    g.userData.dispose = () => { scene.remove(g); edge.dispose(); fill.dispose(); g.userData.extra.dispose(); };
    scene.add(g); return g;
  };

  const barBg = new THREE.MeshBasicMaterial({ color: PALETTE.ink, depthTest: false, transparent: true }), barFg = new THREE.MeshBasicMaterial({ color: 0xff8d7a, depthTest: false, transparent: true });
  const iceGeo = new THREE.IcosahedronGeometry(1, 1), iceMat = new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: .45, depthWrite: false });
  const iceInk = new THREE.MeshBasicMaterial({ color: 0x4aa8d8, transparent: true, opacity: .8, wireframe: true });
  const glowMats = { imp: new THREE.MeshBasicMaterial({ color: 0xd04bff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }), golem: new THREE.MeshBasicMaterial({ color: 0xb34bff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }), boss: new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }) };
  const enemies = [], projs = [];
  const nameOf = { imp: 'idle', golem: 'idle', boss: 'idle' };

  function spawnEnemy(type, x, z, si = -1, instant) {
    const c = CFG[type], ch = c.make(); fillPlaceholder(ch, c.ph[0], c.ph[1], c.rad); scene.add(ch.root);
    const e = { type, cfg: c, ch, si, hp: c.hp * (type === 'boss' ? 1 : 1 + (p.level - 1) * .06), pos: new V3(x, heightAt(x, z), z), kv: new V3(), face: 0, st: 'spawn', t: instant ? 0 : .7, freeze: 0, dead: false, deadT: 0, punch: 0, cd: rnd(.2, 1), tele: null, atk: '', radius: ch.radius || c.rad, hitDone: false, name: '', phase2: false, spawnT: instant ? 1 : 0, boss: type === 'boss' };
    e.max = e.hp;
    const bar = new THREE.Group(), bg = new THREE.Mesh(geo.plane, barBg), fg = new THREE.Mesh(geo.plane, barFg); bg.scale.set(1.3, .2, 1); fg.position.z = .001; bar.add(bg, fg); bar.renderOrder = 10; bg.renderOrder = 10; fg.renderOrder = 11; bar.visible = false; e.bar = bar; e.fg = fg; scene.add(bar);
    const glow = new THREE.Mesh(geo.glow, glowMats[type]); glow.renderOrder = 2; e.glow = glow; scene.add(glow);
    const ice = new THREE.Mesh(iceGeo, iceMat); ice.visible = false; ice.scale.set(e.radius * 1.5, c.size * .55, e.radius * 1.5); ice.position.y = c.size * .5; ch.root.add(ice); e.ice = ice;
    if (si >= 0) SS[si].alive++;
    ch.root.position.copy(e.pos); ch.root.scale.setScalar(instant ? 1 : .01);
    burst(e.pos, type === 'boss' ? 40 : 10, [0x2a1638, 0x7a2fa8, PALETTE.sludgeGlow], 4, .25, .8, 5);
    enemies.push(e); if (!instant) audio.spawn(); return e;
  }
  const setEn = (e, n) => { if (e.name !== n) { e.name = n; e.ch.setState(n); } };
  const aliveCount = () => enemies.filter(e => !e.dead).length;

  function hurtEnemy(e, amt, dir, kb, freeze = 0, o = {}) {
    if (e.dead) return;
    if (e.freeze > 0) { amt *= 1.5; if (!o.noShatter) burst(e.pos.clone().setY(e.pos.y + e.cfg.size * .5), 6, [0xeafcff, 0xbff4ff], 5, .22, .5); }
    amt *= stats.dmg * (o.noScale ? 1 / stats.dmg : 1); e.hp -= amt;
    e.punch = 1; e.kv.addScaledVector(dir, kb * (e.boss ? .08 : e.type === 'golem' ? .55 : 1));
    if (freeze) e.freeze = Math.max(e.freeze, e.boss ? Math.min(1.2, freeze * .4) : freeze);
    const sp = e.pos.clone().setY(e.pos.y + e.cfg.size * .55);
    burst(sp, e.boss ? 10 : 8, [0x2a1638, PALETTE.sludgeGlow, 0xeafcff], 6, .2, .5, 4);
    audio.hit(kb > 8); S.hitstop = Math.max(S.hitstop, e.boss ? .045 : .06); S.trauma = Math.min(1, S.trauma + .18);
    e.bar.visible = true;
    const sv = new V3().copy(sp).project(camera); if (sv.z < 1) hud.dmg((sv.x * .5 + .5) * innerWidth, (-sv.y * .5 + .5) * innerHeight, Math.round(amt), amt > 25);
    if (e.hp <= 0) killEnemy(e);
    else if (!e.boss && e.st !== 'spawn') { e.name = ''; setEn(e, 'hit'); if (e.st === 'windup') { e.st = 'chase'; if (e.tele) { e.tele.userData.dispose(); e.tele = null; } } }
  }
  function killEnemy(e) {
    e.dead = true; e.deadT = 0; setEn(e, 'death'); e.bar.visible = false; e.glow.visible = false; if (e.tele) { e.tele.userData.dispose(); e.tele = null; } e.ice.visible = false;
    S.kills++; S.water += e.cfg.water; audio.kill(); audio.xp();
    burst(e.pos.clone().setY(e.pos.y + e.cfg.size * .5), e.boss ? 90 : e.type === 'golem' ? 36 : 18, [0x2a1638, 0x7a2fa8, PALETTE.sludgeGlow, 0x5a1f2e], e.boss ? 14 : 8, e.boss ? .5 : .3, .9, 6);
    if (e.si >= 0) SS[e.si].alive--;
    if (stats.siphon) p.hp = Math.min(p.maxHp, p.hp + stats.siphon);
    p.xp += e.cfg.xp;
    S.hitstop = Math.max(S.hitstop, e.boss ? .35 : e.type === 'golem' ? .12 : .05); S.trauma = Math.min(1, S.trauma + (e.boss ? .9 : e.type === 'golem' ? .45 : .12));
    if (e.boss) { S.bossDead = true; win(); }
    while (!e.boss && p.xp >= xpNeed()) { p.xp -= xpNeed(); p.level++; S.levelPending++; p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .25); }
  }

  function hurtPlayer(amt, from, kb = 6) {
    if (p.inv > 0 || p.dashT > 0 || S.mode !== 'play') return;
    p.hp -= amt; p.inv = .7; p.hurtT = .3; audio.hurt(); hud.hurt(); S.trauma = Math.min(1, S.trauma + .45); S.hitstop = Math.max(S.hitstop, .05);
    if (from) { const d = p.pos.clone().sub(from).setY(0).normalize(); p.vel.addScaledVector(d, kb); }
    burst(p.pos.clone().setY(p.pos.y + 1.2), 12, [0xeafcff, 0xff8d7a], 5, .18, .5, 4);
    if (p.hp <= 0) { p.hp = 0; S.mode = 'lose'; S.endT = 1.2; lofiSet('hit', true); audio.lose(); document.exitPointerLock && document.exitPointerLock(); }
  }
  function win() {
    const tryWin = () => { if (S.mode === 'lose' || S.mode === 'win') return; if (S.mode !== 'play') return void setTimeout(tryWin, 300); S.mode = 'win'; lofiSet('celebrate'); audio.win(); audio.setIntensity(0); document.exitPointerLock && document.exitPointerLock(); hud.showEnd(true, endLines()); }; setTimeout(tryWin, 2200);
    hud.toast('GRIME TITAN FALLS', 'THE SOURCE RUNS CLEAR', 3);
  }
  const endLines = () => ['WATER CLEANED ' + Math.round(S.water).toLocaleString('en-US') + ' L', 'SLUDGE SLAIN ' + S.kills + ' / LEVEL ' + p.level, 'TIME ' + Math.floor(S.time / 60) + ':' + String(Math.floor(S.time % 60)).padStart(2, '0')];

  function playerAction(dt, mv) {
    const near = (range, arc) => { let b = null, bd = 1e9; for (const e of enemies) { if (e.dead) continue; const d = e.pos.distanceTo(p.pos); if (d < range && d < bd) { bd = d; b = e; } } return b; };
    const aimAssist = () => { const e = near(7); if (e) p.face = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z); };
    p.dashCd -= dt; p.slamCd -= dt; p.inv -= dt; p.hurtT -= dt; p.comboT -= dt; p.buf -= dt; slamBuf -= dt; dashBuf -= dt;
    if (mouse[0]) p.buf = Math.max(p.buf, .1);
    if (keys.Space === true && false) dashBuf = 0;
    const busy = p.atkT > 0 || p.slamT > 0;
    if (dashBuf > 0 && p.dashCd <= 0 && p.slamT <= 0) {
      dashBuf = 0; p.dashT = .22; p.dashCd = .75 * stats.dashCd; p.atkT = 0;
      p.dashDir.copy(mv.lengthSq() > .01 ? mv : dirF(p.face)); p.face = Math.atan2(p.dashDir.x, p.dashDir.z);
      audio.dash(); lofiSet('dash', true); burst(p.pos.clone().setY(p.pos.y + .6), 14, [0xeafcff, 0xbff4ff], 3, .18, .5, 1);
    }
    if (p.dashT > 0) { p.dashT -= dt; p.vel.copy(p.dashDir).multiplyScalar(25); if (Math.random() < .6) burst(p.pos.clone().setY(p.pos.y + .5), 1, 0xeafcff, 1, .22, .4, .5, 2); return; }
    if (slamBuf > 0 && p.slamCd <= 0 && p.slamT <= 0) {
      slamBuf = 0; p.slamT = .62; p.slamDone = false; p.atkT = 0; p.slamCd = 5 * stats.slamCd; aimAssist(); lofi.timeScale = 1.7; lofiSet('attack', true);
    }
    if (p.slamT > 0) {
      p.slamT -= dt; p.vel.multiplyScalar(Math.exp(-10 * dt));
      if (!p.slamDone && p.slamT < .34) {
        p.slamDone = true; const R = 8.5 * stats.slamR;
        shock(p.pos.x, p.pos.z, R); audio.slam(); S.trauma = Math.min(1, S.trauma + .8); S.hitstop = Math.max(S.hitstop, .09);
        burst(p.pos.clone().setY(p.pos.y + .3), 60, [0xeafcff, 0xbff4ff, 0xffffff, 0xc98a5e, 0x8fd0ee], 15, .15, 1.0, 9); burst(p.pos.clone().setY(p.pos.y + .3), 20, [0xeafcff, 0x4aa8d8], 7, .3, .9, 14, 20);
        for (const e of enemies) { if (e.dead) continue; const d = e.pos.clone().sub(p.pos).setY(0), l = d.length(); if (l < R + e.radius) hurtEnemy(e, 28 * stats.slamDmg / 1, l > .01 ? d.divideScalar(l) : new V3(0, 0, 1), 14 * (1 - l / (R + 1) * .5), stats.freeze, { noScale: false }); }
      }
      return;
    }
    if (p.atkT > 0) {
      p.atkT -= dt; const prog = 1 - p.atkT / p.atkDur;
      if (!p.hitDone && prog > .35) {
        p.hitDone = true; const last = p.combo === 2, range = last ? 4.6 : 3.8, cosA = last ? Math.cos(1.2) : Math.cos(.95), f = dirF(p.face); let hit = false;
        for (const e of enemies) { if (e.dead) continue; const d = e.pos.clone().sub(p.pos).setY(0), l = d.length(); if (l > range + e.radius) continue; if (l > .01 && d.dot(f) / l < cosA && l > e.radius + .6) continue; hit = true; hurtEnemy(e, last ? 22 : 13, l > .01 ? d.divideScalar(l) : f, last ? 11 : 4); }
        slashFx(p.pos, p.face, last); audio.swing(p.combo); if (!hit) S.trauma = Math.min(1, S.trauma + .03);
      }
      if (prog < .4) p.vel.addScaledVector(dirF(p.face), 22 * dt * (p.combo === 2 ? 1.3 : 1));
    }
    if (p.buf > 0 && (p.atkT <= .08 * p.atkDur) ) {
      p.buf = 0; p.combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0; p.atkDur = (p.combo === 2 ? .55 : .36) / stats.atkSpd; p.atkT = p.atkDur; p.comboT = p.atkDur + .45; p.hitDone = false; aimAssist();
      if (p.combo === 2) { lofi.timeScale = 1.05 / p.atkDur; lofiSet('attack', true); } else { lofi.timeScale = .4 / p.atkDur; lofi.flip(); lofiSet('strike', true); }
    }
  }

  function updateEnemy(e, dt) {
    const c = e.cfg;
    e.punch = Math.max(0, e.punch - dt * 6);
    if (e.dead) {
      e.deadT += dt; const k = clamp(1 - (e.deadT - .9) / .5, .001, 1); e.ch.root.scale.setScalar(k);
      if (e.deadT > 1.4) { scene.remove(e.ch.root); scene.remove(e.bar); scene.remove(e.glow); e.ch.root.traverse(o => { if (o.isMesh && o === e.ice) return; }); e.gone = true; }
      e.ch.update(dt, e.name); return;
    }
    if (e.st === 'spawn') {
      e.t -= dt; e.spawnT = 1 - Math.max(0, e.t) / .7; e.ch.root.scale.setScalar(Math.max(.01, e.spawnT)); e.ch.update(dt, 'idle'); if (e.t <= 0) { e.st = 'chase'; e.ch.root.scale.setScalar(1); } return;
    }
    e.kv.multiplyScalar(Math.exp(-7 * dt)); e.pos.addScaledVector(e.kv, dt);
    if (e.freeze > 0) {
      e.freeze -= dt; e.ice.visible = true; e.ice.rotation.y += dt * 0; setEn(e, 'idle'); e.ch.update(dt * .0, 'idle');
      if (e.freeze <= 0) { e.ice.visible = false; shock(e.pos.x, e.pos.z, 1.6, { life: .5 }); burst(e.pos.clone().setY(e.pos.y + 1), 10, [0xeafcff, 0xbff4ff], 5, .2, .5); }
      if (e.tele) { e.tele.userData.dispose(); e.tele = null; e.st = 'chase'; }
      finishEnemy(e, 0); return;
    }
    e.ice.visible = false;
    const to = p.pos.clone().sub(e.pos).setY(0), dist = to.length(), dir = dist > .01 ? to.clone().divideScalar(dist) : new V3(0, 0, 1);
    const tf = Math.atan2(dir.x, dir.z);
    if (e.boss && !e.phase2 && e.hp < e.max * .5) { e.phase2 = true; hud.toast('THE TITAN ENRAGES', '', 2); audio.roar(); S.trauma = 1; e.st = 'recover'; e.t = 1.2; setEn(e, 'roar'); }
    const spd = c.speed * (e.phase2 ? 1.3 : 1);
    if (e.st === 'chase') {
      e.face = angLerp(e.face, tf, 1 - Math.exp(-8 * dt)); setEn(e, 'walk');
      const want = e.boss ? 7 : c.atkRange * .8;
      if (dist > want) e.pos.addScaledVector(dir, spd * dt);
      e.cd -= dt;
      if (e.cd <= 0 && (e.boss ? dist < 22 : dist < c.atkRange)) beginAttack(e, dist, dir);
    } else if (e.st === 'windup') {
      e.t -= dt; const k = 1 - e.t / e.dur;
      if (e.atk !== 'wave' && e.type !== 'boss' || k < .5) e.face = angLerp(e.face, tf, 1 - Math.exp(-6 * dt));
      if (e.atk === 'wave') e.face = angLerp(e.face, tf, 1 - Math.exp(-4 * dt) * (k < .7 ? 1 : 0) + (k < .7 ? 0 : 0));
      if (e.tele) { e.tele.userData.set(k); if (e.atk === 'wave') { e.tele.position.set(e.pos.x, heightAt(e.pos.x, e.pos.z) + .4, e.pos.z); e.tele.rotation.y = e.face; } }
      if (e.type === 'imp' && k > .5) e.pos.addScaledVector(dirF(e.face), 3 * dt);
      if (e.t <= 0) fireAttack(e, dir, dist);
    } else if (e.st === 'recover') { e.t -= dt; if (e.t <= 0) { e.st = 'chase'; e.cd = e.boss ? (e.phase2 ? .7 : 1.4) : rnd(.1, .6); } }
    const sep = new V3();
    for (const o of enemies) { if (o === e || o.dead) continue; const d = e.pos.clone().sub(o.pos).setY(0), l = d.length(), m = e.radius + o.radius; if (l < m && l > .001) sep.addScaledVector(d, (m - l) / l); }
    e.pos.addScaledVector(sep, Math.min(1, dt * 8));
    const pd = e.pos.clone().sub(p.pos).setY(0), pl = pd.length(), pm = e.radius + p.radius * .8;
    if (pl < pm && pl > .001) e.pos.addScaledVector(pd, (pm - pl) / pl * .5), p.pos.addScaledVector(pd, -(pm - pl) / pl * .25);
    finishEnemy(e, dt);
  }
  function finishEnemy(e, dt) {
    const r = Math.hypot(e.pos.x, e.pos.z), lim = bounds * .97; if (r > lim) { e.pos.x *= lim / r; e.pos.z *= lim / r; }
    e.pos.y = heightAt(e.pos.x, e.pos.z); e.glow.position.set(e.pos.x, e.pos.y + .2, e.pos.z); e.glow.scale.setScalar(e.radius * 2.2 * (e.st === 'spawn' ? e.spawnT : 1)); e.glow.rotation.y += .02; e.ch.root.position.copy(e.pos); e.ch.root.rotation.y = e.face;
    const k = e.punch; e.ch.root.scale.set(1 + k * .18, 1 - k * .14, 1 + k * .18);
    if (e.freeze <= 0) e.ch.update(dt * (e.st === 'windup' ? e.ts : 1), e.name);
    if (e.bar.visible) { e.bar.position.set(e.pos.x, e.pos.y + e.cfg.size * 1.15 + .5, e.pos.z); e.bar.quaternion.copy(camera.quaternion); const w = 1.3 * clamp(e.hp / e.max, 0, 1); e.fg.scale.set(Math.max(.001, w - .1), .1, 1); e.fg.position.x = -(1.3 - w) / 2 - .0; }
  }
  function beginAttack(e, dist, dir) {
    const c = e.cfg; e.st = 'windup'; e.hitDone = false; e.dur = e.t = c.windup * (e.phase2 ? .8 : 1);
    if (e.type === 'imp') { e.atk = 'bite'; e.ts = .383 / e.dur; setEn(e, 'attack'); return; }
    if (e.type === 'golem') { e.atk = 'smash'; e.ts = .675 / e.dur; e.name = ''; setEn(e, 'attack'); e.tele = mkTele('circle', 3.7); const f = dirF(e.face); e.tele.position.set(e.pos.x + f.x * 2, heightAt(e.pos.x + f.x * 2, e.pos.z + f.z * 2) + .4, e.pos.z + f.z * 2); e.atkPos = new V3(e.pos.x + f.x * 2, 0, e.pos.z + f.z * 2); audio.warn(); return; }
    const r = Math.random(), imps = enemies.filter(o => !o.dead && o.type === 'imp').length;
    if (dist < 11 && r < .5) { e.atk = 'stomp'; e.dur = e.t = 1.5 * (e.phase2 ? .75 : 1); e.name = ''; setEn(e, 'stomp'); e.tele = mkTele('circle', 10); e.tele.position.set(e.pos.x, heightAt(e.pos.x, e.pos.z) + .4, e.pos.z); }
    else if (r < .8 || imps > 7) { e.atk = 'wave'; e.dur = e.t = 1.1 * (e.phase2 ? .75 : 1); e.name = ''; setEn(e, 'roar'); e.tele = mkTele('rect', 5.5, 30); e.tele.position.set(e.pos.x, heightAt(e.pos.x, e.pos.z) + .4, e.pos.z); }
    else { e.atk = 'summon'; e.dur = e.t = 1.0; e.name = ''; setEn(e, 'roar'); audio.roar(); }
    e.ts = ({ stomp: .78, wave: .9, summon: .9 }[e.atk] || 1) / e.dur; audio.warn(); e.cd = 0;
  }
  function fireAttack(e, dir, dist) {
    const c = e.cfg; if (e.tele) { e.tele.userData.dispose(); e.tele = null; }
    e.st = 'recover'; e.t = c.rec * (e.phase2 ? .7 : 1);
    if (e.atk === 'bite') { if (dist < c.atkRange + .5) hurtPlayer(c.dmg, e.pos, 7); setEn(e, 'walk'); e.name = 'walk'; return; }
    if (e.atk === 'smash') { shock(e.atkPos.x, e.atkPos.z, 3.7, { color: 0xd9a5ff, mat: spikeMatSlud, spike: .7, life: .8 }); S.trauma = Math.min(1, S.trauma + .35); audio.stomp(); if (Math.hypot(p.pos.x - e.atkPos.x, p.pos.z - e.atkPos.z) < 3.7 + p.radius * .5) hurtPlayer(c.dmg, e.atkPos, 9); e.name = ''; setEn(e, 'idle'); return; }
    if (e.atk === 'stomp') { shock(e.pos.x, e.pos.z, 10, { color: 0xff5a77, mat: spikeMatDark, spike: 1.3, life: 1.1 }); S.trauma = 1; audio.stomp(); S.hitstop = .08; if (dist < 10 + p.radius * .5) hurtPlayer(c.dmg, e.pos, 14); e.t = 1.4; return; }
    if (e.atk === 'wave') {
      const f = dirF(e.face), g = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.4, .8), new THREE.MeshBasicMaterial({ color: 0xff5a6a, transparent: true, opacity: .55, depthWrite: false })); g.position.set(e.pos.x + f.x * 3, 0, e.pos.z + f.z * 3); g.rotation.y = e.face; scene.add(g); projs.push({ m: g, dir: f, t: 0, hit: false, dmg: 24 }); audio.stomp(); S.trauma = Math.min(1, S.trauma + .4); return;
    }
    if (e.atk === 'summon') { for (let k = 0; k < (e.phase2 ? 5 : 3); k++) { const a = rnd(0, 6.283); spawnEnemy('imp', e.pos.x + Math.cos(a) * 6, e.pos.z + Math.sin(a) * 6, e.si); } S.trauma = .5; e.t = 1.2; }
  }

  const spawnPoint = (s, rmin, rmax) => {
    let best = null, bh = 1e9;
    for (let k = 0; k < 16; k++) { const a = rnd(0, 6.283), r = s.radius * rnd(rmin, rmax), x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r, h = Math.hypot(x - p.pos.x, z - p.pos.z) < 6 ? 1e8 : heightAt(x, z); if (h < bh) { bh = h; best = [x, z]; } }
    return best;
  };
  function updateStreams(dt) {
    let nearest = null, nd = 1e9;
    for (const q of SS) {
      const s = q.s; if (q.done) continue;
      const d = Math.hypot(p.pos.x - s.x, p.pos.z - s.z);
      if (d < nd) { nd = d; nearest = q; }
      if (!q.active) { if (d < s.radius + 6) { q.active = true; q.wave = 0; q.delay = .8; hud.toast('SLUDGE STIRS', 'CLEAR THE WAVES TO PURIFY THE STREAM', 2.4); audio.roar(); } continue; }
      if (q.alive > 0) continue;
      if (q.wave >= WAVES) { purify(q); continue; }
      if ((q.delay -= dt) > 0) continue;
      q.wave++; q.delay = 2;
      const nImp = 4 + q.wave * 2 + Math.round(s.radius / 10), nGol = q.wave - 1;
      for (let k = 0; k < nImp; k++) { const [x, z] = spawnPoint(s, .6, 1.1); spawnEnemy('imp', x, z, q.i); }
      for (let k = 0; k < nGol; k++) { const [x, z] = spawnPoint(s, .3, .9); spawnEnemy('golem', x, z, q.i); }
      hud.toast('WAVE ' + q.wave + ' / ' + WAVES, '', 1.8);
    }
    return nearest;
  }
  function purify(q) {
    q.done = true; q.active = false; setClean(q.i, true); const s = q.s;
    S.water += q.volume; audio.purify();
    const c = new V3(s.x, heightAt(s.x, s.z) + .3, s.z);
    shock(s.x, s.z, s.radius * 1.5, { color: 0x38e8d8, spike: 1.4, life: 1.6 }); burst(c, 120, [0x38c2c0, 0xbff4ff, 0xeafcff, 0x7ee8e0], s.radius * .9, .35, 1.4, 14, 8);
    S.trauma = Math.min(1, S.trauma + .5); p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .3);
    const left = SS.filter(o => !o.done).length;
    hud.toast('STREAM PURIFIED', left ? left + ' MORE TO THAW' : 'THE SOURCE AWAKENS', 3);
    if (!left) setTimeout(spawnBoss, 3500);
  }
  function spawnBoss() {
    if (S.bossSpawned) return; S.bossSpawned = true;
    const big = SS.reduce((a, b) => (b.s.radius > a.s.radius ? b : a));
    const a = Math.atan2(p.pos.z - big.s.z, p.pos.x - big.s.x);
    const e = spawnEnemy('boss', big.s.x + Math.cos(a) * big.s.radius * .5, big.s.z + Math.sin(a) * big.s.radius * .5, -1); e.bar.visible = false;
    hud.toast('THE GRIME TITAN RISES', 'AT THE LARGEST SOURCE', 3.4); audio.roar(); S.trauma = 1;
  }

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 70, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc36b, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  scene.add(beacon);

  function applyUpgrade() {
    if (S.levelPending <= 0) return false;
    S.levelPending--; S.mode = 'levelup'; audio.levelup(); audio.setMusicDuck(true); document.exitPointerLock && document.exitPointerLock();
    const pool = UPGRADES.slice().sort(() => Math.random() - .5).slice(0, 3);
    hud.showLevelUp(pool, u => { u.f(stats, p); S.mode = 'play'; audio.setMusicDuck(false); if (!applyUpgrade() && dom && dom.requestPointerLock) dom.requestPointerLock()?.catch?.(() => {}); });
    return true;
  }

  const ocV2 = new V3(), cPos2 = new V3(), shake = new V3(), tmp = new V3(), tgtV = new V3(), wantV = new V3(), dV = new V3(), ocV = new V3(), cPos = new V3();
  const colliders = (world && world.colliders) || [];
  const camHit = (from, to, margin) => {
    dV.copy(to).sub(from); const L = dV.length(); if (L < 1e-4) return 1; dV.divideScalar(L); let best = L;
    const test = (cx, cy, cz, r) => {
      ocV.set(from.x - cx, from.y - cy, from.z - cz); const R = r + margin, c = ocV.lengthSq() - R * R; if (c < 0) return;
      const b = ocV.dot(dV), disc = b * b - c; if (disc <= 0) return; const t = -b - Math.sqrt(disc); if (t > 0 && t < best) best = t;
    };
    for (const c of colliders) test(c.x, c.y, c.z, c.r);
    for (const e of enemies) if (!e.dead && e.boss) test(e.pos.x, e.pos.y + e.cfg.size * .55, e.pos.z, e.radius * (e.boss ? 1.25 : 1.1));
    return best / L;
  };
  function updateCamera(dt) {
    const turn = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0); cam.yaw += turn * 2.2 * dt; cam.pitch = clamp(cam.pitch + ((keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)) * 1.2 * dt, .12, 1.2);
    if (S.mode === 'title') cam.yaw += dt * .12;
    const D = cam.dist * (S.bossSpawned && !S.bossDead ? 1.6 : 1) + (S.mode === 'title' ? 3 : 0), right = tmp.set(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
    tgtV.copy(p.pos); tgtV.y += S.bossSpawned && !S.bossDead ? 5 : 3.1; tgtV.addScaledVector(right, 1.6); tgtV.x -= Math.sin(cam.yaw) * 1.5; tgtV.z -= Math.cos(cam.yaw) * 1.5;
    const dirAt = pitch => wantV.set(Math.sin(cam.yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(cam.yaw) * Math.cos(pitch));
    const clear = pitch => { dirAt(pitch); for (let i = 3; i <= 16; i++) { const u = i / 16 * D; if (tgtV.y + wantV.y * u < heightAt(tgtV.x + wantV.x * u, tgtV.z + wantV.z * u) + 1.2) return false; } return true; };
    let ep = cam.pitch; while (ep < 1.35 && !clear(ep)) ep += .06;
    cam.eff = cam.eff === undefined ? ep : cam.eff + (ep - cam.eff) * (1 - Math.exp(-7 * dt));
    dirAt(cam.eff); cPos.copy(tgtV).addScaledVector(wantV, D);
    const head = ocV2.copy(p.pos); head.y += 2; const far = cPos2.copy(head).addScaledVector(wantV, D); const f = Math.max(camHit(head, far, .9), 3.2 / D), dEff = D * Math.min(1, f);
    cam.curD = cam.curD === undefined ? dEff : (dEff < cam.curD ? cam.curD + (dEff - cam.curD) * (1 - Math.exp(-22 * dt)) : cam.curD + (dEff - cam.curD) * (1 - Math.exp(-2.2 * dt)));
    const want = cPos.copy(tgtV).addScaledVector(wantV, cam.curD); want.y = Math.max(want.y, heightAt(want.x, want.z) + 1.0);
    if (!cam.init) { cam.pos.copy(want); cam.look.copy(tgtV); cam.init = true; }
    cam.pos.lerp(want, 1 - Math.exp(-12 * dt)); cam.look.lerp(tgtV, 1 - Math.exp(-14 * dt));
    for (const e of enemies) { if (e.dead) continue; const cy = e.pos.y + e.cfg.size * .55, R = e.radius * (e.boss ? 1.25 : 1.1) + .6; ocV.set(cam.pos.x - e.pos.x, cam.pos.y - cy, cam.pos.z - e.pos.z); const l = ocV.length(); if (l < R && l > 1e-3) cam.pos.addScaledVector(ocV, (R - l) / l); }
    S.trauma = Math.max(0, S.trauma - dt * 1.6); const sh = S.trauma * S.trauma * .45;
    shake.set(rnd(-1, 1) * sh, rnd(-1, 1) * sh, rnd(-1, 1) * sh);
    camera.position.copy(cam.pos).add(shake); camera.lookAt(cam.look.x + shake.x * .5, cam.look.y + shake.y * .5, cam.look.z);
    const fov = 58 + (p.dashT > 0 ? 9 : 0) + S.trauma * 3; cam.fov += (fov - cam.fov) * (1 - Math.exp(-10 * dt));
    if (Math.abs(camera.fov - cam.fov) > .05) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
  }

  function start() { audio.resume(); S.mode = 'play'; if (dom && dom.requestPointerLock) dom.requestPointerLock()?.catch?.(() => {}); hud.toast('THE ICE CRACKS', 'FIND THE SLUDGE STREAMS (FOLLOW THE AMBER BEACON)', 4); audio.setIntensity(0); }
  hud.showTitle(start);
  const qs = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const bot = qs.has('bot');
  if (qs.has('tp')) { const s = streams[+qs.get('tp')]; p.pos.set(s.x + 3, heightAt(s.x + 3, s.z + 18), s.z + 18); cam.yaw = Math.PI; }
  if (qs.has('go') || bot) setTimeout(() => { document.querySelector('#go').click(); if (qs.has('boss')) { SS.forEach(q => { q.done = true; setClean(q.i, true); }); spawnBoss(); } }, 400);
  function runBot(dt) {
    let tg = null, bd = 1e9; for (const e of enemies) { if (e.dead) continue; const d = e.pos.distanceTo(p.pos); if (d < bd) { bd = d; tg = e; } }
    const goal = tg && bd < 40 ? tg.pos : S.nearest ? new V3(S.nearest.s.x, 0, S.nearest.s.z) : null; keys.KeyW = keys.KeyA = keys.KeyS = keys.KeyD = false;
    if (goal && !(tg && bd < 3)) { const d = goal.clone().sub(p.pos).setY(0); cam.yaw = Math.atan2(-d.x, -d.z); keys.KeyW = true; }
    else if (tg) { const d = tg.pos.clone().sub(p.pos); cam.yaw = Math.atan2(-d.x, -d.z); }
    mouse[0] = !!tg && bd < 5; if (tg && bd < 9 && enemies.filter(e => !e.dead && e.pos.distanceTo(p.pos) < 7).length >= 3) slamBuf = .3;
    if (tg && bd < 6 && Math.random() < .01) dashBuf = .2; p.hp = Math.max(p.hp, 30);
  }
  p.pos.set(0, heightAt(0, 0), 0);
  { let seed = 7, rn = () => (seed = (seed * 16807) % 2147483647) / 2147483647, bs = 1e9, bp = [0, 0];
    for (let i = 0; i < 500; i++) { const a = rn() * 6.283, r = rn() * 50, x = Math.cos(a) * r, z = Math.sin(a) * r, h = heightAt(x, z); if (h < 2.5) continue; const sl = Math.max(Math.abs(heightAt(x + 3, z) - h), Math.abs(heightAt(x - 3, z) - h), Math.abs(heightAt(x, z + 3) - h), Math.abs(heightAt(x, z - 3) - h)) + Math.abs(h - 6) * .15; if (sl < bs) { bs = sl; bp = [x, z]; } }
    p.pos.set(bp[0], heightAt(bp[0], bp[1]), bp[1]); }
  { const s0 = streams.reduce((a, b) => (Math.hypot(b.x, b.z) < Math.hypot(a.x, a.z) ? b : a)); cam.yaw = Math.atan2(p.pos.x - s0.x, p.pos.z - s0.z); p.face = Math.atan2(s0.x - p.pos.x, s0.z - p.pos.z); }

  function step(dtRaw, t) {
    S.t = t; let dt = dtRaw;
    if (S.hitstop > 0) { S.hitstop -= dtRaw; dt *= .06; }
    const play = S.mode === 'play';
    const mv = new V3();
    if (play) {
      if (bot) runBot(dt);
      const f = new V3(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw)), r = new V3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
      if (keys.KeyW) mv.add(f); if (keys.KeyS) mv.sub(f); if (keys.KeyD) mv.add(r); if (keys.KeyA) mv.sub(r);
      if (mv.lengthSq() > 0) mv.normalize();
      S.time += dtRaw;
      playerAction(dt, mv);
      if (p.dashT <= 0) {
        const busy = p.slamT > 0, atk = p.atkT > 0, sp = 9.5 * stats.speed * (atk ? .45 : 1);
        if (!busy) { const target = mv.clone().multiplyScalar(sp), l = p.vel.clone().sub(target), acc = mv.lengthSq() > 0 ? 55 : 40; const m = Math.min(1, acc * dt / Math.max(l.length(), .001)); p.vel.x -= l.x * m; p.vel.z -= l.z * m; }
        if (mv.lengthSq() > 0 && !atk && !busy) p.face = angLerp(p.face, Math.atan2(mv.x, mv.z), 1 - Math.exp(-14 * dt));
      }
      p.pos.addScaledVector(p.vel, dt);
      const r2 = Math.hypot(p.pos.x, p.pos.z), lim = bounds * .96; if (r2 > lim) { p.pos.x *= lim / r2; p.pos.z *= lim / r2; }
      for (const c of colliders) { if (!c.solid) continue; const dx = p.pos.x - c.x, dz = p.pos.z - c.z, l = Math.hypot(dx, dz), R = c.r * .8 + p.radius * .6; if (l < R && l > 1e-3 && Math.abs(p.pos.y + 1 - c.y) < c.r * 1.5) { p.pos.x += dx / l * (R - l); p.pos.z += dz / l * (R - l); } }
      p.pos.y = heightAt(p.pos.x, p.pos.z);
      const near = updateStreams(dt);
      for (const e of enemies) updateEnemy(e, dt);
      for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].gone) enemies.splice(i, 1);
      for (let i = projs.length - 1; i >= 0; i--) {
        const q = projs[i]; q.t += dt; q.m.position.addScaledVector(q.dir, 17 * dt); q.m.position.y = heightAt(q.m.position.x, q.m.position.z) + .9; q.m.scale.y = 1 + Math.sin(q.t * 30) * .15;
        const d = p.pos.clone().sub(q.m.position).setY(0), lat = d.dot(new V3(q.dir.z, 0, -q.dir.x)), fw = d.dot(q.dir);
        if (!q.hit && Math.abs(lat) < 3.1 && Math.abs(fw) < 1.3) { q.hit = true; hurtPlayer(q.dmg, q.m.position, 10); }
        if (Math.random() < .5) burst(q.m.position, 1, [0xff3355, 0x5a1f2e], 2, .3, .5, 2);
        if (q.t > 1.9) { scene.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); projs.splice(i, 1); }
      }
      if (S.levelPending > 0) applyUpgrade();
      S.nearest = near;
      audio.setIntensity(clamp(aliveCount() / 10, 0, 1));
    } else if (S.mode === 'levelup' && bot) { const c = document.querySelector('.card'); if (c && (S.pick = (S.pick || 0) + dtRaw) > .3) { S.pick = 0; c.click(); } }
    else if (S.mode === 'win' || S.mode === 'lose') {
      for (const e of enemies) updateEnemy(e, dt);
      p.vel.multiplyScalar(Math.exp(-6 * dt)); p.pos.addScaledVector(p.vel, dt); p.pos.y = heightAt(p.pos.x, p.pos.z);
      if (S.mode === 'lose' && (S.endT -= dtRaw) <= 0 && S.endT > -5) { S.endT = -10; hud.showEnd(false, endLines()); }
    }
    lofi.root.position.copy(p.pos); lofi.root.rotation.y = p.face;
    if (play || S.mode === 'title') {
      if (p.dashT > 0) lofiSet('dash'); else if (p.slamT > 0 || p.atkT > 0) { /* attack anim is driven by the action start */ } else if (p.hurtT > 0 && p.hurtT > .2) lofiSet('hit'); else lofiSet(p.vel.lengthSq() > 4 ? 'run' : 'idle');
    }
    lofi.setMoveSpeed(Math.hypot(p.vel.x, p.vel.z));
    lofi.root.rotation.order = 'YXZ'; lofi.root.rotation.x = S.mode === 'lose' ? -clamp((1.2 - S.endT) / .6, 0, 1) * 1.45 : 0;
    lofi.update(dt, lofiState);
    if (p.inv > 0 && play) lofi.root.visible = p.dashT > 0 || Math.floor(p.inv * 24) % 2 === 0 || p.inv > .45; else lofi.root.visible = true;

    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dtRaw; f.fn(f.t, dtRaw); if (f.t > f.life) { scene.remove(f.obj); f.obj.traverse(o => { if (o.userData && o.userData.sc) { } }); if (f.fnEnd) f.fnEnd(); fx.splice(i, 1); } }
    for (let i = 0; i < PN; i++) {
      const q = parts[i]; if (q.life <= 0) continue; q.life -= dtRaw;
      if (q.life <= 0) { pMesh.setMatrixAt(i, zeroM); continue; }
      q.vel.y -= q.g * dtRaw; q.pos.addScaledVector(q.vel, dtRaw); const gy = heightAt(q.pos.x, q.pos.z); if (q.pos.y < gy) { q.pos.y = gy; q.vel.y *= -.3; q.vel.x *= .6; q.vel.z *= .6; }
      const s = q.size * Math.min(1, q.life / q.max * 2.2) * clamp((camera.position.distanceTo(q.pos) - 1.2) / 3, 0, 1); tmpM.makeScale(s, s, s); tmpM.setPosition(q.pos); pMesh.setMatrixAt(i, tmpM);
    }
    pMesh.instanceMatrix.needsUpdate = true;

    updateCamera(dtRaw);
    const tgtB = S.bossSpawned && !S.bossDead ? enemies.find(e => e.boss && !e.dead) : S.nearest;
    const tp = tgtB ? (tgtB.pos || { x: tgtB.s.x, z: tgtB.s.z }) : null;
    const tx = tgtB ? (tgtB.pos ? tgtB.pos.x : tgtB.s.x) : 0, tz = tgtB ? (tgtB.pos ? tgtB.pos.z : tgtB.s.z) : 0;
    beacon.visible = !!tgtB && play && Math.hypot(tx - p.pos.x, tz - p.pos.z) > (tgtB.s ? tgtB.s.radius + 20 : 25);
    if (beacon.visible) beacon.position.set(tx, heightAt(tx, tz) + 35, tz);
    S.waterShown += (S.water - S.waterShown) * (1 - Math.exp(-5 * dtRaw));
    const boss = enemies.find(e => e.boss && !e.dead);
    const active = SS.find(q => q.active);
    const left = SS.filter(q => !q.done).length;
    const objective = S.mode === 'title' ? '' : boss ? 'DEFEAT THE GRIME TITAN' : S.bossSpawned ? 'THE SOURCE IS CLEAR' : active ? 'WAVE ' + Math.max(1, active.wave) + '/' + WAVES + ' - SLAY THE SLUDGE' : 'PURIFY THE STREAMS (' + (SS.length - left) + '/' + SS.length + ')';
    hud.update({
      hp: p.hp, maxHp: p.maxHp, xp: p.xp, xpNeed: xpNeed(), level: p.level, water: S.waterShown, objective,
      streams: SS.map(q => ({ clean: q.done, active: q.active, x: q.s.x, z: q.s.z, radius: q.s.radius })),
      enemies: enemies.filter(e => !e.dead).map(e => ({ x: e.pos.x, z: e.pos.z, boss: e.boss })),
      target: tgtB ? { x: tx, z: tz } : null, px: p.pos.x, pz: p.pos.z, yaw: cam.yaw, face: p.face,
      boss: boss ? { hp: boss.hp, max: boss.max } : null,
      cd: { melee: p.atkT > 0 ? p.atkT / p.atkDur : 0, slam: clamp(p.slamCd / (5 * stats.slamCd), 0, 1), dash: clamp(p.dashCd / (.75 * stats.dashCd), 0, 1) },
    }, dtRaw);
  }
  const fast = +qs.get('fast') || 1, update = (dt, t) => { for (let i = 0; i < fast; i++) step(fast > 1 ? .05 : dt, t); };
  return { update, start, debug: { p, S, SS, enemies, stats, spawnEnemy, spawnBoss, purify, hud, audio, cam, teleport(x, z) { p.pos.set(x, heightAt(x, z), z); } } };
}
