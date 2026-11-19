// Lofi the Yeti: furry toon yeti on a nested-joint skeleton, with a spring-chain scarf. Faces +z.
import * as THREE from 'three';
import { PALETTE, toon } from './style.js';
import { Animator, blob, rbox, cyl, grp, humanoid, groundRig, tufts, furMat, gait, add, mix, slam, hit, seq, surf, smooth, clamp, lerp, rng, emissiveFlash, addRim, TAU } from './char_core.js';

const GAIT = { leg: .85, knee: 1.1, kneeBase: .12, arm: .9, elb: 1.0, elbV: .35, bob: .09, twist: .22, sway: .05, shift: .02, lean: .3, leanV: .04, headV: .05 };
const DEFS = { idle: { loop: true }, run: { loop: true }, dash: { loop: true }, celebrate: { loop: true }, attack: { dur: 1.05, impact: .48, next: 'idle' }, strike: { dur: .4, impact: .17, next: 'idle' }, hit: { dur: .55, next: 'idle' }, alias: { walk: 'run', slam: 'attack', cheer: 'celebrate', idle: 'idle' } };
const KF = (...a) => a;
const strike = (u, alt) => {
  const A = alt ? 'R' : 'L', B = alt ? 'L' : 'R', k = alt ? -1 : 1;
  return seq({ ['arm' + A + '.rx']: KF([0, 0], [.25, .8], [.45, -1.9, 'i'], [.7, -1.1], [1, 0]), ['elb' + A + '.rx']: KF([0, 0], [.25, -1.3], [.45, -.1, 'i'], [1, 0]), ['arm' + B + '.rx']: KF([0, 0], [.25, -.6], [.5, .4], [1, 0]),
    'torso.ry': KF([0, 0], [.25, -.5 * k], [.45, .6 * k, 'i'], [1, 0]), 'torso.rx': KF([0, 0], [.25, -.1], [.45, .35, 'i'], [1, 0]), 'hips.z': KF([0, 0], [.25, -.06], [.45, .22, 'i'], [.7, .1], [1, 0]), 'hips.y': KF([0, 0], [.45, -.08], [1, 0]),
    'head.rx': KF([0, 0], [.25, -.2], [.45, .25, 'i'], [1, 0]), 'legL.rx': KF([0, 0], [.25, .25 * k], [.45, -.45 * k], [1, 0]), 'legR.rx': KF([0, 0], [.25, -.25 * k], [.45, .45 * k], [1, 0]), 'kneeL.rx': KF([0, 0], [.45, .4], [1, 0]), 'kneeR.rx': KF([0, 0], [.45, .4], [1, 0]) }, u);
};
const base = { 'armL.rz': .12, 'armR.rz': -.12, 'elbL.rx': -.12, 'elbR.rx': -.12, 'armL.rx': 0 };

export function makeLofi() {
  const fur = toon(PALETTE.fur, { emissive: PALETTE.furShadow, emissiveIntensity: .3 }); addRim(fur, 0x6fa0e0, 2.4, .7);
  const skin = toon(PALETTE.face, { emissive: 0x4a78a8, emissiveIntensity: .22 });
  const tuftM = furMat(); tuftM.polygonOffset = true; tuftM.polygonOffsetFactor = 2; tuftM.polygonOffsetUnits = 2;
  const { root: body, j, parts } = humanoid({
    hipsY: .8, pelvis: [.46, .3, .4], pelvisY: .08, torsoY: .05, torso: { dims: [.66, .68, .56], cy: .5 }, head: { y: 1.2, cy: .32, dims: [.58, .52, .52] },
    arm: { x: .64, y: .85, upper: [.25, .5], fore: [.24, .45], hand: [.18, .19, .18] }, leg: { x: .26, thigh: [.25, .4], shin: [.22, .36], foot: [.22, .1, .32] }, mat: fur, skin, th: .028,
  });
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); rig.add(body); rig.scale.setScalar(.85);

  // fur tufts per part
  const inkLines = new THREE.LineBasicMaterial({ color: 0x4f6fa6, transparent: true, opacity: .85 });
  const T = (part, n, len, rad, seed, o) => { const tg = tufts(part.userData.dims, Math.round(n * 1.1), len * .7, rad * 1.05, seed, { base: 0xdbe6fa, down: .6, lenVar: .35, jitter: .25, ...o }); part.add(new THREE.Mesh(tg, tuftM)); const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(tg.userData.lines, 3)); part.add(new THREE.LineSegments(lg, inkLines)); };
  T(parts.torso, 150, .22, .085, 1); T(parts.pelvis, 40, .17, .08, 2); T(parts.head, 90, .19, .08, 3, { down: .3, skip: n => n.z > .45 && n.y < .62 && Math.abs(n.x) < .75 });
  for (const n of ['L', 'R']) { T(parts['upper' + n], 40, .18, .075, n === 'L' ? 4 : 14); T(parts['fore' + n], 40, .17, .07, n === 'L' ? 5 : 15, { down: .8 }); T(parts['thigh' + n], 30, .17, .08, n === 'L' ? 6 : 16); T(parts['shin' + n], 30, .16, .07, n === 'L' ? 7 : 17, { down: .8 }); }
  const fingerM = skin;
  for (const n of ['L', 'R']) {
    for (let i = 0; i < 3; i++) { const f = blob(.045, .075, .045, fingerM, .015, 8); f.position.set((i - 1) * .06, -.15, .06); f.rotation.x = -.3; j['hand' + n].add(f); }
    const th = blob(.045, .07, .045, fingerM, .015, 8); th.position.set((n === 'L' ? 1 : -1) * .11, -.04, .08); th.rotation.z = (n === 'L' ? -1 : 1) * .6; th.rotation.x = -.4; j['hand' + n].add(th);
    for (let i = 0; i < 3; i++) { const t = blob(.05, .04, .05, skin, .014, 8); t.position.set((i - 1) * .07, .0, .14); parts['foot' + n].add(t); }
    T(parts['foot' + n], 8, .08, .045, n === 'L' ? 8 : 18);
  }

  // face
  const ink = new THREE.MeshBasicMaterial({ color: PALETTE.ink }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const head = parts.head, patch = blob(.38, .34, .14, skin, .018, 16); patch.position.set(0, -.03, .42); head.add(patch);
  const eyes = {};
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const e = eyes[n] = grp(head, s * .17, .1, .525); const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), ink); ball.scale.set(.065, .085, .03); e.add(ball);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), white); gl.scale.set(.02, .024, .012); gl.position.set(.016, .026, .026); e.add(gl); j['eye' + n] = e;
    const brow = blob(.13, .035, .07, fur, .012, 10); brow.position.set(s * .17, .25, .48); brow.rotation.z = s * -.18; brow.rotation.x = -.1; head.add(brow); j['brow' + n] = brow;
    const ear = blob(.1, .1, .08, fur, .02, 10); ear.position.set(s * .57, .06, -.02); head.add(ear);
    const ch = blob(.09, .07, .05, new THREE.MeshToonMaterial({ color: 0xb5d9f2, gradientMap: skin.gradientMap }), 0, 8); ch.position.set(s * .29, -.1, .49); head.add(ch);
  }
  const nose = blob(.075, .052, .05, toon(0x7fa8d4), .014, 10); nose.position.set(0, -.03, .555); head.add(nose);
  const mouth = j.mouth = grp(head, 0, -.14, .535);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.1, .017, 6, 18, Math.PI), ink); smile.rotation.z = Math.PI; mouth.add(smile);
  const open = j.mouthOpen = blob(.1, .085, .03, new THREE.MeshBasicMaterial({ color: 0x3a1d3a }), 0, 12); open.position.set(0, -.02, -.012); mouth.add(open);
  const tongue = blob(.05, .03, .02, new THREE.MeshBasicMaterial({ color: 0xf08a9a }), 0, 8); tongue.position.set(0, -.045, .014); open.add(tongue);
  for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.ConeGeometry(.018, .045, 4), white); f.position.set(s * .075, -.025, .005); f.rotation.x = Math.PI; mouth.add(f); }

  // backpack
  const brown = toon(0x7a5a45), tan = toon(0xc88a5a), rope = toon(0xd9bf8f), dark = toon(0x4d3a30);
  const pack = j.pack = grp(j.torso, 0, .62, -.5); pack.scale.setScalar(.75);
  const pb = rbox(.74, .82, .34, brown, .09); pb.position.z = -.17; pack.add(pb);
  const flap = rbox(.7, .22, .38, brown, .06); flap.position.set(0, .3, -.17); pack.add(flap);
  const pocket = rbox(.5, .3, .12, dark, .05); pocket.position.set(0, -.18, -.38); pack.add(pocket);
  const buckle = rbox(.08, .1, .04, tan, .015, .012); buckle.position.set(0, .12, -.37); pack.add(buckle);
  const roll = cyl(.19, .19, .86, tan, .028, 14); roll.rotation.z = Math.PI / 2; roll.position.set(0, .56, -.16); pack.add(roll);
  for (const x of [-.22, .22]) { const b = cyl(.2, .2, .06, dark, .012, 14); b.rotation.z = Math.PI / 2; b.position.set(x, .56, -.16); pack.add(b); }
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.17, .028, 6, 16), rope.clone()); r.rotation.y = Math.PI / 2; r.position.set(.4, -.1 + i * .075, -.17); pack.add(r); }
  const bottle = cyl(.07, .07, .26, toon(0xa8cfee), .015, 8); bottle.position.set(-.41, -.12, -.14); pack.add(bottle);
  for (const s of [1, -1]) {
    const pts = [[.78, -.25], [.62, .45], [1.25, .9], [.62, .52], [.42, 0], [.4, -.4]].map(([az, el]) => surf(parts.torso.userData.dims, s * az, el, 1.04));
    parts.torso.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .042, 5), brown));
  }

  // scarf: neck ring, front drape, multi-segment trailing chain
  const scarfM = toon(PALETTE.scarf, { emissive: 0x24478a, emissiveIntensity: .3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.43, .14, 10, 26), scarfM); ring.rotation.x = Math.PI / 2 + .12; ring.scale.set(1.05, .95, 1); ring.position.set(0, 1.1, .03); j.torso.add(ring);
  const knot = blob(.15, .13, .12, scarfM, .02, 12); knot.position.set(.2, 1.0, .42); j.torso.add(knot);
  const drape = j.drape = grp(j.torso, .2, .98, .45); const dm = rbox(.26, .42, .07, scarfM, .03); dm.position.set(.01, -.2, .03); drape.add(dm); drape.rotation.set(-.1, 0, .12);
  const N = 10, segs = [], chainRoot = grp(j.torso, -.46, 1.06, -.22); let par = chainRoot;
  for (let i = 0; i < N; i++) {
    const s = grp(par, 0, 0, i ? -.17 : 0), w = .36 * (1 - i * .05), m = rbox(w, .09, .19, scarfM, .03, .022); m.position.z = -.09; s.add(m);
    if (i === N - 1) { const tipL = rbox(w * .45, .06, .14, scarfM, .02, .02); tipL.position.set(w * .27, 0, -.2); s.add(tipL); const tipR = tipL.clone(); tipR.position.x = -w * .27; s.add(tipR); }
    s.rotation.x = i ? -.12 : -1.3; segs.push(s); par = s;
  }
  const sim = segs.map((_, i) => ({ a: i ? -.12 : -1.3, av: 0, y: 0, yv: 0 }));

  const groundBox = groundRig(body, j.hips);
  const mats = [fur, skin, tuftM, scarfM];
  const an = new Animator(j, DEFS, pose, .16);
  const st = { speed: null, blink: 0, nextBlink: 1.5, blinkT: -1, time: 0, pos: new THREE.Vector3(), vx: 0, vz: 0, turn: 0, yaw: 0, hy: 0, vyH: 0, init: false, pk: 0, pkv: 0 };

  function idleD(t) {
    const b = Math.sin(TAU * t / 3.2), b2 = Math.sin(TAU * t / 3.2 - .7), s6 = Math.sin(TAU * t / 6.4);
    return { 'torso.sy': .016 * b, 'torso.sx': -.01 * b, 'torso.rx': .02 * b, 'hips.y': -.012 * b, 'hips.x': .02 * s6, 'hips.rz': .015 * s6, 'head.rx': .035 * b2, 'head.ry': .14 * s6, 'head.rz': .03 * Math.sin(TAU * t / 6.4 + 1),
      'armL.rz': .035 * b2, 'armR.rz': -.035 * b2, 'armL.rx': .03 * b2, 'armR.rx': -.02 * b2, 'elbL.rx': -.04 * b2, 'elbR.rx': -.05 * b2, 'legL.rx': .02 * s6, 'legR.rx': -.02 * s6, 'mouth.sy': .04 * b2 };
  }
  function pose(state, t, ctx) {
    let d;
    if (state === 'idle' || state === 'run') d = mix(idleD(state === 'idle' ? t : 0), gait(ctx.phase, GAIT), ctx.w);
    else if (state === 'dash') {
      const g = gait(ctx.phase, { ...GAIT, leg: 1.1, knee: 1.5, kneeBase: .25, lean: .8, leanV: .03, arm: .2, elb: .25, elbV: .1, bob: .03, twist: .12, sway: .02, headV: .02 }), a = Math.sin(ctx.phase);
      d = { ...g, 'armL.rx': 1.5 + .15 * a, 'armR.rx': 1.5 - .15 * a, 'armL.rz': .35, 'armR.rz': -.35, 'elbL.rx': -.25, 'elbR.rx': -.25, 'hips.y': -.14, 'hips.sz': .1, 'hips.sy': -.08, 'head.rx': -.5, 'mouth.open': .5 };
    } else if (state === 'attack') d = { ...slam(t / DEFS.attack.dur, 1), 'mouth.open': kfo(t / DEFS.attack.dur) };
    else if (state === 'strike') d = { ...strike(t / DEFS.strike.dur, ctx.alt), 'mouth.open': .35 * smooth(.3, .45, t / DEFS.strike.dur) };
    else if (state === 'hit') d = hit(t / DEFS.hit.dur, 1);
    else {
      const w = TAU * t / .7, hop = .5 - .5 * Math.cos(w), arm = Math.sin(TAU * t / 1.4);
      d = { 'hips.y': .26 * hop, 'hips.sy': -.09 * (1 - hop) + .05 * hop, 'hips.sx': .03 * (1 - hop), 'torso.rx': -.08 - .05 * hop, 'head.rx': -.18 + .06 * Math.cos(w), 'head.rz': .12 * arm, 'head.ry': .2 * arm,
        'armR.rx': -2.5 + .12 * Math.sin(w), 'armR.rz': -.3, 'elbR.rx': -.55, 'armL.rx': -.7 + .7 * arm, 'armL.rz': .5 + .3 * Math.cos(w), 'elbL.rx': -.7 + .3 * Math.sin(w), 'legL.rx': -.5 * hop, 'legR.rx': -.15 * hop, 'kneeL.rx': .15 + .7 * hop, 'kneeR.rx': .15 + .7 * hop, 'footL.rx': .3 * hop, 'mouth.open': .85, 'mouth.sy': .2 };
    }
    return add(base, d);
  }
  const kfo = u => smooth(.3, .45, u) * (1 - smooth(.55, .8, u)) * .7;

  function updateScarf(dt, ctx) {
    const wind = clamp(Math.max(ctx.w, clamp(Math.hypot(st.vx, st.vz) / 7), an.state === 'dash' ? 1.3 : 0, an.state === 'celebrate' ? .3 : 0), 0, 1.4);
    const steps = Math.max(1, Math.ceil(dt / .012)), h = dt / steps;
    for (let s = 0; s < steps; s++) for (let i = 0; i < N; i++) {
      const q = sim[i], f = i / N;
      const tp = (i === 0 ? lerp(-1.3, -.15, Math.min(wind, 1)) : lerp(-.12, -.01, Math.min(wind, 1))) + wind * (.05 + .03 * i) * Math.sin(st.time * 8 - i * .7);
      const ty = clamp(-st.turn * .1 - st.vx * .05, -.6, .6) * (.5 + f) + wind * .16 * f * Math.cos(st.time * 6.3 - i * .8) + .04 * Math.sin(st.time * 1.3 + i * .5);
      const ext = -st.vyH * (.5 + f * .3) - (an.state === 'celebrate' ? 0 : 0);
      q.av += (62 * (tp - q.a) - 8 * q.av + ext) * h; q.a += q.av * h; q.yv += (50 * (ty - q.y) - 7 * q.yv) * h; q.y += q.yv * h;
    }
    segs.forEach((s, i) => s.rotation.set(sim[i].a, sim[i].y, i ? 0 : Math.min(wind, 1) * 1.3));
    drape.rotation.set(-.1 - sim[1].a * .12 - .12 * wind, 0, .12 + sim[2].y * .3);
  }

  const self = {
    root, radius: .6, joints: j, onImpact: null,
    get state() { return an.state; }, get animTime() { return an.t; }, get impact() { const d = DEFS[an.state]; return d.impact != null && an.t > d.impact && an.t < d.impact + .14; },
    timeScale: 1,
    flip() { an.ctx.alt = !an.ctx.alt; },
    setMoveSpeed(v) { st.speed = v; },
    setState(n, force) { an.setState(n, force); },
    update(dt, state) {
      if (state) an.setState(state);
      dt = Math.min(dt * self.timeScale, .05); st.time += dt;
      const ctx = an.ctx, sp = st.speed;
      const tgt = an.state === 'run' ? (sp == null ? 1 : Math.max(.7, smooth(.2, 2, sp))) : an.state === 'idle' ? (sp == null ? 0 : smooth(.2, 2.2, sp)) : 0;
      ctx.w += (tgt - ctx.w) * (1 - Math.exp(-dt * 9));
      ctx.phase += dt * (an.state === 'dash' ? 17 : clamp(8 + (sp == null ? 4 : sp) * .8, 8, 15)) * (an.state === 'dash' || ctx.w > .05 ? 1 : 0);
      if (ctx.phase > 1e4) ctx.phase %= TAU;
      if (dt > 0) {
        const p = root.position, dx = p.x - st.pos.x, dz = p.z - st.pos.z, ok = st.init && Math.hypot(dx, dz) < 1.5, hd = root.rotation.y, a = 1 - Math.exp(-dt * 12);
        const lx = ok ? (dx * Math.cos(hd) - dz * Math.sin(hd)) / dt : 0, lz = ok ? (dx * Math.sin(hd) + dz * Math.cos(hd)) / dt : 0;
        st.vx += (lx - st.vx) * a; st.vz += (lz - st.vz) * a;
        let dy = hd - st.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); st.turn += ((ok ? dy / dt : 0) - st.turn) * a; st.turn = clamp(st.turn, -8, 8);
        st.pos.copy(p); st.yaw = hd; st.init = true;
      }
      an.update(dt);
      const hy = an.pose['hips.y'] || 0; st.vyH += (clamp((hy - st.hy) / Math.max(dt, 1e-3), -4, 4) - st.vyH) * (1 - Math.exp(-dt * 20)); st.hy = hy;
      updateScarf(dt, ctx);
      // pack lag spring
      st.pkv += (40 * (-st.vyH * .08 - an.pose['torso.rx'] * .25 - st.pk) - 6 * st.pkv) * dt; st.pk += st.pkv * dt; pack.rotation.x = st.pk;
      // blink + face
      st.nextBlink -= dt; if (st.nextBlink <= 0) { st.blinkT = 0; st.nextBlink = 2.4 + Math.random() * 3 - (Math.random() < .25 ? 2.2 : 0); }
      if (st.blinkT >= 0) { st.blinkT += dt; const u = st.blinkT / .16; st.blink = u < 1 ? Math.sin(Math.PI * u) : 0; if (u >= 1) st.blinkT = -1; }
      for (const n of ['L', 'R']) j['eye' + n].scale.set(1, Math.max(.06, (1 + (an.pose['eye' + n + '.sy'] || 0)) * (1 - .94 * st.blink)), 1);
      const o = an.pose['mouth.open'] || 0; j.mouthOpen.scale.set(1, Math.max(.001, o), 1); j.mouthOpen.visible = o > .02; j.mouth.scale.y = 1 + (an.pose['mouth.sy'] || 0);
      emissiveFlash(mats, an.state === 'hit' ? Math.max(0, 1 - an.t / .22) * .75 : 0, 0xff9a90);
    },
  };
  return self;
}
