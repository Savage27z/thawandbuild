// Lofi the Yeti (official design): tall lanky humanoid in shaggy white fur, blue frog face, blue fists and bare feet. Faces +z.
import * as THREE from 'three';
import { PALETTE, toon, outline } from './style.js';
import { Animator, blob, grp, humanoid, groundRig, tufts, furMat, gait, add, mix, hit, seq, smooth, clamp, lerp, emissiveFlash, addRim, TAU } from './char_core.js';

const GAIT = { leg: .62, knee: 1.15, kneeBase: .1, arm: .5, elb: .5, elbV: .28, bob: .05, twist: .2, sway: .07, shift: .03, lean: .14, leanV: .03, headV: .05 };
const DEFS = { idle: { loop: true }, run: { loop: true }, dash: { loop: true }, celebrate: { loop: true }, attack: { dur: 1.05, impact: .48, next: 'idle' }, strike: { dur: .4, impact: .17, next: 'idle' }, hit: { dur: .55, next: 'idle' }, death: { dur: 1.3, hold: true }, alias: { walk: 'run', slam: 'attack', cheer: 'celebrate', die: 'death', idle: 'idle' } };
const KF = (...a) => a;
const SKIN = 0x5f8fd0, SKIN_D = 0x4a74b4, FUR_SHADE = 0xaeb4cc;

const strike = (u, alt) => {
  const A = alt ? 'R' : 'L', B = alt ? 'L' : 'R', k = alt ? -1 : 1;
  return seq({ ['arm' + A + '.rx']: KF([0, 0], [.25, .7], [.45, -1.55, 'i'], [.7, -.9], [1, 0]), ['elb' + A + '.rx']: KF([0, 0], [.25, -1.5], [.45, -.12, 'i'], [1, 0]), ['arm' + B + '.rx']: KF([0, 0], [.25, -.5], [.5, .35], [1, 0]),
    'torso.ry': KF([0, 0], [.25, -.5 * k], [.45, .6 * k, 'i'], [1, 0]), 'torso.rx': KF([0, 0], [.25, -.08], [.45, .4, 'i'], [1, 0]), 'hips.z': KF([0, 0], [.25, -.05], [.45, .2, 'i'], [.7, .1], [1, 0]), 'hips.y': KF([0, 0], [.45, -.12], [1, 0]),
    'head.rx': KF([0, 0], [.25, -.2], [.45, .25, 'i'], [1, 0]), 'legL.rx': KF([0, 0], [.25, .2 * k], [.45, -.5 * k], [1, 0]), 'legR.rx': KF([0, 0], [.25, -.2 * k], [.45, .5 * k], [1, 0]), 'kneeL.rx': KF([0, 0], [.45, .5], [1, 0]), 'kneeR.rx': KF([0, 0], [.45, .5], [1, 0]) }, u);
};
const slam = u => seq({
  'armL.rx': KF([0, 0], [.28, -2.9], [.4, -3.05], [.46, -.55, 'i'], [.6, -.35, 'o'], [.82, -.08], [1, 0]),
  'armR.rx': KF([0, 0], [.28, -2.9], [.4, -3.05], [.46, -.55, 'i'], [.6, -.35, 'o'], [.82, -.08], [1, 0]),
  'armL.rz': KF([0, 0], [.28, -.25], [.46, .1, 'i'], [.7, 0], [1, 0]), 'armR.rz': KF([0, 0], [.28, .25], [.46, -.1, 'i'], [.7, 0], [1, 0]),
  'elbL.rx': KF([0, 0], [.28, -.4], [.46, -.05, 'i'], [.6, -.2], [1, 0]), 'elbR.rx': KF([0, 0], [.28, -.4], [.46, -.05, 'i'], [.6, -.2], [1, 0]),
  'torso.rx': KF([0, 0], [.28, -.35], [.4, -.4], [.46, .85, 'i'], [.6, .6], [.82, .12], [1, 0]),
  'head.rx': KF([0, 0], [.28, -.3], [.46, .3, 'i'], [.8, .05], [1, 0]),
  'hips.y': KF([0, 0], [.28, .08], [.4, .1], [.46, -.42, 'i'], [.62, -.3], [.85, -.05], [1, 0]),
  'hips.z': KF([0, 0], [.28, -.08], [.46, .3, 'i'], [.62, .2], [1, 0]),
  'hips.sy': KF([0, 0], [.4, 0], [.46, -.06, 'i'], [.6, .02], [1, 0]),
  'legL.rx': KF([0, 0], [.28, .2], [.46, -.9, 'i'], [.7, -.5], [1, 0]), 'legR.rx': KF([0, 0], [.28, .35], [.46, .35, 'i'], [.7, .2], [1, 0]),
  'kneeL.rx': KF([0, 0], [.28, .15], [.46, 1.3, 'i'], [.7, .8], [1, 0]), 'kneeR.rx': KF([0, 0], [.28, .15], [.46, 1.0, 'i'], [.7, .6], [1, 0]),
  'footL.rx': KF([0, 0], [.46, .4], [1, 0]), 'footR.rx': KF([0, 0], [.46, -.2], [1, 0]),
  'mouth.smile': KF([0, 0], [.3, -.8], [.46, -1.2], [.8, -.3], [1, 0]),
}, u);
const death = u => seq({
  'hips.y': KF([0, 0], [.35, -.35, 'o'], [.7, -.62, 'i'], [1, -.66]), 'hips.z': KF([0, 0], [.5, .05], [1, .3]),
  'legL.rx': KF([0, 0], [.4, -1.0], [1, -1.15]), 'legR.rx': KF([0, 0], [.4, -.8], [1, -.95]), 'kneeL.rx': KF([0, 0], [.4, 2.0], [1, 2.3]), 'kneeR.rx': KF([0, 0], [.4, 1.9], [1, 2.2]),
  'torso.rx': KF([0, 0], [.3, -.3], [.7, 1.0, 'i'], [1, 1.3]), 'head.rx': KF([0, 0], [.3, -.4], [.7, .5], [1, .7]), 'head.rz': KF([0, 0], [1, .2]),
  'armL.rx': KF([0, 0], [.3, -.8], [.8, .5], [1, .4]), 'armR.rx': KF([0, 0], [.3, -.8], [.8, .3], [1, .5]), 'armL.rz': KF([0, 0], [1, .35]), 'armR.rz': KF([0, 0], [1, -.35]),
  'elbL.rx': KF([0, 0], [1, -.3]), 'elbR.rx': KF([0, 0], [1, -.3]), 'mouth.open': KF([0, 0], [.3, .5], [1, .2]), 'eyeL.sy': KF([0, 0], [.4, -.4], [1, -.8]), 'eyeR.sy': KF([0, 0], [.4, -.4], [1, -.8]), 'mouth.smile': KF([0, 0], [1, -.6]),
}, u);
const base = { 'armL.rz': .1, 'armR.rz': -.1, 'elbL.rx': -.14, 'elbR.rx': -.14, 'armL.rx': 0, 'torso.rx': .05, 'head.rx': .06, 'mouth.smile': -.45 };

export function makeLofi() {
  const furC = toon(0xf6f8ff, { emissive: 0x9aa2c4, emissiveIntensity: .24 }); addRim(furC, 0xc0cce8, 2.6, .35);
  const skin = toon(SKIN, { emissive: 0x2c4f94, emissiveIntensity: .3 }); addRim(skin, 0x9cc4ff, 2.4, .45);
  const tuftM = furMat(); tuftM.polygonOffset = true; tuftM.polygonOffsetFactor = 2; tuftM.polygonOffsetUnits = 2; tuftM.emissive.set(0x8c94b8); tuftM.emissiveIntensity = .3;
  const { root: body, j, parts } = humanoid({
    hipsY: 1, pelvis: [.25, .17, .2], pelvisY: .04, torsoY: .05, torso: { dims: [.34, .42, .24], cy: .37 }, head: { y: .82, z: .03, cy: .21, dims: [.26, .28, .24] },
    arm: { x: .39, y: .66, upper: [.125, .56], fore: [.115, .54], hand: [.15, .16, .135] }, leg: { x: .16, thigh: [.15, .58], shin: [.125, .56], foot: [.13, .06, .26] }, mat: furC, skin, th: .022,
  });
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); rig.add(body);

  const fur = [];
  const clump = (host, d, n, len, rad, seed, o) => {
    const tg = tufts(d, n, len, rad, seed, { base: FUR_SHADE, down: 2, lenVar: .35, jitter: .1, droop: .35, ...o }), m = new THREE.Mesh(tg, tuftM);
    outline(m, .008, PALETTE.ink); host.add(m); return m;
  };
  const sway = (g, k, ph) => { fur.push({ g, k, ph, a: 0, av: 0, b: 0, bv: 0 }); return g; };
  const T = (part, n, len, rad, seed, o) => clump(part, part.userData.dims, n, len, rad, seed, o);
  T(parts.torso, 26, .15, .11, 1, { skip: nr => Math.abs(nr.x) < .5 }); T(parts.pelvis, 10, .18, .09, 2);
  T(parts.head, 12, .14, .08, 3, { down: .5, skip: nr => nr.z > .45 && nr.y < .7 && Math.abs(nr.x) < .85 });
  for (const n of ['L', 'R']) {
    const s = n === 'L' ? 0 : 20;
    T(parts['upper' + n], 7, .15, .1, 4 + s, { skip: nr => nr.z > .5 }); T(parts['fore' + n], 6, .24, .085, 5 + s, { down: 2.6 });
    T(parts['thigh' + n], 7, .15, .1, 6 + s, { skip: nr => nr.z > .5 }); T(parts['shin' + n], 6, .26, .085, 7 + s, { down: 2.6 });
    const fr = sway(grp(j['elb' + n], 0, -.3, 0), 1, s); clump(fr, [.1, .05, .1], 6, .13, .07, 40 + s, { down: 5, skip: nr => nr.y > .2 });
    const fr2 = sway(grp(j['knee' + n], 0, -.3, 0), .7, s + 1); clump(fr2, [.1, .05, .1], 6, .13, .07, 50 + s, { down: 5, skip: nr => nr.y > .2 });
    const man = sway(grp(j.torso, (n === 'L' ? 1 : -1) * .22, .76, 0), .8, s + 2); clump(man, [.14, .08, .13], 4, .15, .08, 60 + s, { down: 5, skip: nr => nr.y < -.2 });
  }
  const skirt = sway(grp(j.hips, 0, .02, 0), .6, 3); clump(skirt, [.25, .05, .21], 12, .27, .09, 70, { down: 4.5, skip: nr => nr.y > .2 });
  const chestM = sway(grp(j.torso, 0, .2, .02), .5, 4); clump(chestM, [.3, .05, .2], 12, .26, .09, 71, { down: 4.5, skip: nr => nr.y > .2 });
  const crest = sway(grp(j.head, 0, .44, -.02), 1.6, 5); clump(crest, [.19, .06, .17], 9, .26, .07, 72, { down: -.6, droop: .6, tip: 0xffffff, skip: nr => nr.y < -.1 });
  const ruff = sway(grp(j.head, 0, .03, 0), 1, 6); clump(ruff, [.25, .06, .22], 10, .16, .07, 73, { down: 3, skip: nr => nr.z > .5 && Math.abs(nr.x) < .7 });

  const ink = new THREE.MeshBasicMaterial({ color: PALETTE.ink }), white = new THREE.MeshBasicMaterial({ color: 0xffffff }), skinFlat = toon(SKIN_D, { emissive: 0x28467f, emissiveIntensity: .3 });
  for (const n of ['L', 'R']) {
    const s = n === 'L' ? 1 : -1;
    for (let i = 0; i < 4; i++) { const f = blob(.032, .05, .035, skin, .011, 8); f.position.set(s * (i - 1.5) * -.055, -.12, .12); f.rotation.x = -.5; j['hand' + n].add(f); }
    const th = blob(.035, .055, .035, skin, .011, 8); th.position.set(s * .14, -.06, .08); th.rotation.z = s * -.7; j['hand' + n].add(th);
    for (let i = 0; i < 5; i++) { const t = blob(.03 - Math.abs(i - 2) * .002, .03, .036, skin, .01, 8); t.position.set(s * (i - 2) * -.048, -.015, .23 - Math.abs(i - 2) * .014); parts['foot' + n].add(t); }
  }

  const head = parts.head, mask = blob(.235, .16, .1, skin, .014, 14); mask.position.set(0, -.02, .22); head.add(mask);
  const eyes = {}, lids = {};
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R', ring = blob(.088, .084, .035, skinFlat, .008, 10); ring.position.set(s * .1, .06, .295); head.add(ring);
    const e = eyes[n] = grp(head, s * .1, .06, .312), ball = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), ink); ball.scale.set(.062, .068, .03); e.add(ball);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), white); gl.scale.set(.016, .02, .01); gl.position.set(.018 * s, .02, .022); e.add(gl);
    const gl2 = gl.clone(); gl2.scale.set(.008, .008, .006); gl2.position.set(-.014 * s, -.018, .024); e.add(gl2); j['eye' + n] = e;
    const lid = lids[n] = grp(head, s * .1, .06, .318), lm = blob(.074, .04, .03, skinFlat, .008, 10); lm.position.y = .038; lid.add(lm); lid.userData.y0 = .06;
  }
  const lip = blob(.15, .05, .05, toon(0x7ba2dd, { emissive: 0x3a62a8, emissiveIntensity: .25 }), 0, 12); lip.position.set(0, -.15, .24); head.add(lip);
  const nostril = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 6), ink); nostril.scale.set(.007, .005, .004); for (const s of [1, -1]) { const q = nostril.clone(); q.position.set(s * .02, -.015, .322); head.add(q); }
  const mouth = j.mouth = grp(head, 0, -.085, .318), arc = new THREE.Mesh(new THREE.TorusGeometry(.19, .012, 6, 24, Math.PI), ink); arc.scale.set(1, .38, 1); arc.position.y = -.0; mouth.add(arc);
  const open = j.mouthOpen = blob(.16, .08, .02, new THREE.MeshBasicMaterial({ color: 0x1a1030 }), 0, 12); open.position.set(0, -.02, -.01); mouth.add(open);
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(.24, .02, .01), white); teeth.position.set(0, .022, .014); open.add(teeth);

  const groundBox = groundRig(body, j.hips);
  const mats = [furC, skin, tuftM, skinFlat];
  const an = new Animator(j, DEFS, pose, .16);
  const st = { speed: null, nextBlink: 1.5, blinkT: -1, blink: 0, time: 0, pos: new THREE.Vector3(), vx: 0, vz: 0, turn: 0, yaw: 0, hy: 0, vyH: 0, init: false };
  rig.scale.setScalar(2.2 / (groundBox.max.y - groundBox.min.y + .02));

  function idleD(t) {
    const b = Math.sin(TAU * t / 3.4), b2 = Math.sin(TAU * t / 3.4 - .7), s6 = Math.sin(TAU * t / 6.8);
    return { 'torso.sy': .012 * b, 'torso.rx': .03 * b, 'hips.y': -.01 * b, 'hips.x': .025 * s6, 'hips.rz': .025 * s6, 'torso.rz': -.03 * s6, 'head.rx': .04 * b2, 'head.ry': .16 * s6, 'head.rz': .04 * Math.sin(TAU * t / 6.8 + 1),
      'armL.rz': .03 * b2, 'armR.rz': -.03 * b2, 'armL.rx': .04 * b2, 'armR.rx': -.03 * b2, 'elbL.rx': -.05 * b2, 'elbR.rx': -.06 * b2, 'legL.rx': .02 * s6, 'legR.rx': -.02 * s6, 'mouth.smile': .06 * b2 };
  }
  const kfo = u => smooth(.3, .45, u) * (1 - smooth(.55, .8, u)) * .5;
  function pose(state, t, ctx) {
    let d;
    if (state === 'idle' || state === 'run') d = mix(idleD(state === 'idle' ? t : 0), gait(ctx.phase, GAIT), ctx.w);
    else if (state === 'dash') {
      const g = gait(ctx.phase, { ...GAIT, leg: .85, knee: 1.5, kneeBase: .3, lean: .75, leanV: .03, arm: .2, elb: .25, elbV: .1, bob: .03, twist: .12, sway: .02, headV: .02 }), a = Math.sin(ctx.phase);
      d = { ...g, 'armL.rx': 1.5 + .15 * a, 'armR.rx': 1.5 - .15 * a, 'armL.rz': .3, 'armR.rz': -.3, 'elbL.rx': -.25, 'elbR.rx': -.25, 'hips.y': -.16, 'head.rx': -.5, 'mouth.open': .4, 'mouth.smile': -.9 };
    } else if (state === 'attack') d = { ...slam(t / DEFS.attack.dur), 'mouth.open': kfo(t / DEFS.attack.dur), 'teeth': 1 };
    else if (state === 'strike') d = { ...strike(t / DEFS.strike.dur, ctx.alt), 'mouth.open': .3 * smooth(.3, .45, t / DEFS.strike.dur), 'mouth.smile': -.6 * smooth(.2, .4, t / DEFS.strike.dur) };
    else if (state === 'hit') d = { ...hit(t / DEFS.hit.dur, 1), 'mouth.open': .45 * (1 - smooth(.1, .5, t / DEFS.hit.dur)) * smooth(0, .1, t / DEFS.hit.dur), 'mouth.smile': -.7 };
    else if (state === 'death') d = death(clamp(t / DEFS.death.dur));
    else {
      const w = TAU * t / .75, hop = .5 - .5 * Math.cos(w), arm = Math.sin(TAU * t / 1.5);
      d = { 'hips.y': .2 * hop, 'hips.sy': -.05 * (1 - hop) + .03 * hop, 'torso.rx': -.1 - .05 * hop, 'head.rx': -.2 + .06 * Math.cos(w), 'head.rz': .12 * arm, 'head.ry': .2 * arm,
        'armR.rx': -2.8 + .12 * Math.sin(w), 'armR.rz': -.2, 'elbR.rx': -.35, 'armL.rx': -.7 + .7 * arm, 'armL.rz': .5 + .3 * Math.cos(w), 'elbL.rx': -.6 + .3 * Math.sin(w), 'legL.rx': -.4 * hop, 'legR.rx': -.12 * hop, 'kneeL.rx': .15 + .6 * hop, 'kneeR.rx': .15 + .6 * hop, 'footL.rx': .3 * hop, 'mouth.open': .6, 'mouth.smile': 1.6 };
    }
    return add(base, d);
  }

  function updateFur(dt, ctx) {
    const wind = clamp(Math.max(ctx.w, clamp(Math.hypot(st.vx, st.vz) / 7), an.state === 'dash' ? 1.3 : 0), 0, 1.4), h = Math.min(dt, .016), steps = Math.max(1, Math.ceil(dt / h)), sh = dt / steps;
    const dx = clamp(-st.vz * .035 - st.vyH * .1 - an.pose['torso.rx'] * .2, -.7, .7), dz = clamp(-st.vx * .03 - st.turn * .03, -.6, .6);
    for (const f of fur) for (let s = 0; s < steps; s++) {
      const tx = dx * f.k + wind * .12 * f.k * Math.sin(st.time * 9 + f.ph), tz = dz * f.k + (.04 + wind * .06) * Math.sin(st.time * 2.1 + f.ph * 1.7);
      f.av += (70 * (tx - f.a) - 7 * f.av) * sh; f.a += f.av * sh; f.bv += (70 * (tz - f.b) - 7 * f.bv) * sh; f.b += f.bv * sh;
    }
    for (const f of fur) f.g.rotation.set(f.a, 0, f.b);
  }

  const self = {
    root, radius: .6, joints: j, onImpact: null,
    get state() { return an.state; }, get animTime() { return an.t; }, get impact() { const d = DEFS[an.state]; return d.impact != null && an.t > d.impact && an.t < d.impact + .14; },
    get dead() { return an.state === 'death' && an.done; },
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
      ctx.phase += dt * (an.state === 'dash' ? 15 : clamp(6.5 + (sp == null ? 4 : sp) * .7, 6.5, 12.5)) * (an.state === 'dash' || ctx.w > .05 ? 1 : 0);
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
      updateFur(dt, ctx);
      st.nextBlink -= dt; if (st.nextBlink <= 0) { st.blinkT = 0; st.nextBlink = 2.6 + Math.random() * 3 - (Math.random() < .25 ? 2.2 : 0); }
      if (st.blinkT >= 0) { st.blinkT += dt; const u = st.blinkT / .16; st.blink = u < 1 ? Math.sin(Math.PI * u) : 0; if (u >= 1) st.blinkT = -1; }
      const ang = clamp(-(an.pose['mouth.smile'] || 0), -1, 1);
      for (const n of ['L', 'R']) {
        const s = n === 'L' ? 1 : -1, shut = clamp(st.blink - (an.pose['eye' + n + '.sy'] || 0), 0, 1);
        j['eye' + n].scale.set(1, Math.max(.08, 1 - .85 * shut), 1);
        lids[n].position.y = .06 - .045 * shut; lids[n].scale.y = 1 + .5 * shut; lids[n].rotation.z = s * -(.14 + .25 * Math.max(0, ang - .4));
      }
      const o = an.pose['mouth.open'] || 0; j.mouthOpen.scale.set(1, Math.max(.001, o * 1.4), 1); j.mouthOpen.visible = o > .02; teeth.visible = an.state === 'attack' || an.state === 'strike';
      mouth.scale.y = (Math.abs(ang) < .12 ? .12 * (ang < 0 ? -1 : 1) : ang) * 1; mouth.scale.y = Math.sign(mouth.scale.y || 1) * Math.max(.12, Math.abs(mouth.scale.y));
      mouth.position.y = -.085; mouth.rotation.z = 0;
      emissiveFlash(mats, an.state === 'hit' ? Math.max(0, 1 - an.t / .22) * .75 : 0, 0xff9a90);
    },
  };
  return self;
}
