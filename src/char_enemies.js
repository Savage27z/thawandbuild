// Sludge enemies: imp, golem, boss Grime Titan. Joint-hierarchy rigs, glowing cracks, drips, looping + one-shot animation.
import * as THREE from 'three';
import { PALETTE, toon, hatch } from './style.js';
import { Animator, blob, rbox, cyl, cone, grp, humanoid, groundRig, gait, add, slam, hit, seq, smooth, clamp, lerp, cracks, makeDrips, emissiveFlash, rng, addRim, LUMP, surf, surfN, TAU } from './char_core.js';

const T = (...a) => a;
let auraTex = null;
const glowTex = () => { if (auraTex) return auraTex; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); auraTex = new THREE.CanvasTexture(c); return auraTex; };
const halo = (color, size, opacity, blend = THREE.AdditiveBlending) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: blend, depthWrite: false, fog: false })); s.scale.setScalar(size); s.renderOrder = 3; return s; };
const spikesOn = (part, n, len, mat, seed, up = false) => {
  const R = rng(seed), d = part.userData.dims, Y = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) { const az = up ? Math.PI + (R() - .5) * 2.4 : R() * TAU, el = up ? .2 + R() * .9 : (R() - .5) * 1.8, p = surf(d, az, el, .96), nr = surfN(d, p), sp = cone(len * .22 * (.7 + R() * .6), len * (.6 + R() * .8), mat, .02, 5); sp.position.copy(p); sp.quaternion.setFromUnitVectors(Y, nr.clone().add(new THREE.Vector3(0, .25, 0)).normalize()); part.add(sp); }
};
const idleD = (t, P) => {
  const b = Math.sin(TAU * t / P.breathT), b2 = Math.sin(TAU * t / P.breathT - .8), s2 = Math.sin(TAU * t / (P.breathT * 2));
  return { 'torso.sy': P.br * b, 'torso.sx': -P.br * .5 * b, 'torso.rx': P.br * 2 * b, 'hips.y': -P.br * .4 * b, 'hips.x': P.br * 1.5 * s2, 'head.rx': P.br * 3 * b2, 'head.ry': .16 * s2, 'head.rz': .04 * s2,
    'armL.rz': P.br * 3 * b2, 'armR.rz': -P.br * 3 * b2, 'armL.rx': P.br * 2 * b2, 'armR.rx': P.br * 1.5 * b2, 'jaw.rx': .06 * (.5 + .5 * b), 'tail1.ry': P.tail * Math.sin(TAU * t / P.breathT), 'tail2.ry': P.tail * Math.sin(TAU * t / P.breathT - .7), 'tail3.ry': P.tail * Math.sin(TAU * t / P.breathT - 1.4) };
};
const walkD = (ph, P) => ({ ...gait(ph, P.gait), 'tail1.ry': P.tail * 2 * Math.sin(ph), 'tail2.ry': P.tail * 2 * Math.sin(ph - .8), 'tail3.ry': P.tail * 2 * Math.sin(ph - 1.6), 'jaw.rx': .08 + .05 * Math.sin(2 * ph) });
const deathD = (u, P) => seq({
  'torso.rx': T([0, 0], [.3, .35], [.7, .8, 'i'], [1, .9]), 'hips.y': T([0, 0], [.25, -.1 * P.H], [.7, -.8 * P.H, 'i'], [1, -.78 * P.H]),
  'hips.sy': T([0, 0], [.3, -.05], [.75, -.62, 'i'], [1, -.75]), 'hips.sx': T([0, 0], [.3, 0], [1, .55]), 'hips.sz': T([0, 0], [.3, 0], [1, .55]),
  'legL.rx': T([0, 0], [.7, -1.0], [1, -1.1]), 'legR.rx': T([0, 0], [.7, -.6], [1, -.7]), 'kneeL.rx': T([0, 0], [.7, 1.4], [1, 1.6]), 'kneeR.rx': T([0, 0], [.7, 1.2], [1, 1.4]),
  'armL.rz': T([0, 0], [.4, .6], [1, .9]), 'armR.rz': T([0, 0], [.4, -.6], [1, -.9]), 'armL.rx': T([0, 0], [.3, -.5], [1, .3]), 'armR.rx': T([0, 0], [.3, -.5], [1, .4]),
  'head.rx': T([0, 0], [.5, .4], [1, .9]), 'jaw.rx': T([0, 0], [.2, .7, 'o'], [1, .5]), 'dim': T([0, 0], [.5, .7], [1, 1]), 'puddle': T([0, 0], [.3, 0], [1, 1, 'o']), 'wet': T([0, 1], [.5, 1], [1, 0]),
}, u);
const swipe = u => seq({
  'armR.rx': T([0, 0], [.3, 1.0], [.45, -2.0, 'i'], [.65, -1.3], [1, 0]), 'armL.rx': T([0, 0], [.3, .6], [.45, -1.6, 'i'], [.7, -1], [1, 0]),
  'hips.z': T([0, 0], [.3, -.1], [.45, .4, 'i'], [.7, .25], [1, 0]), 'hips.y': T([0, 0], [.3, -.08], [.45, .06], [.7, 0], [1, 0]),
  'torso.rx': T([0, 0], [.3, -.3], [.45, .55, 'i'], [1, 0]), 'head.rx': T([0, 0], [.3, -.4], [.45, .4, 'i'], [1, 0]), 'jaw.rx': T([0, 0], [.25, .1], [.45, .9, 'o'], [.8, .2], [1, 0]),
  'legL.rx': T([0, 0], [.3, .3], [.45, -.5], [1, 0]), 'legR.rx': T([0, 0], [.3, .4], [.45, -.1], [1, 0]), 'kneeL.rx': T([0, 0], [.3, .8], [.45, .5], [1, 0]), 'kneeR.rx': T([0, 0], [.3, .8], [.45, .5], [1, 0]),
}, u);
const roarD = (t, k) => {
  const env = smooth(.9, 1.1, t) * (1 - smooth(1.8, 2.2, t));
  return { ...seq({
    'torso.rx': T([0, 0], [.5, .45], [.75, .5], [1.0, -.55, 'o'], [1.9, -.5], [2.2, 0]), 'head.rx': T([0, 0], [.5, .4], [1.0, -.8, 'o'], [1.9, -.7], [2.2, 0]), 'jaw.rx': T([0, 0], [.5, 0], [.9, 1.0, 'o'], [1.9, 1.0], [2.2, 0]),
    'armL.rz': T([0, 0], [.5, -.2], [1, .7, 'o'], [1.9, .65], [2.2, 0]), 'armR.rz': T([0, 0], [.5, .2], [1, -.7, 'o'], [1.9, -.65], [2.2, 0]),
    'armL.rx': T([0, 0], [.5, .3], [1, -.5], [1.9, -.4], [2.2, 0]), 'armR.rx': T([0, 0], [.5, .3], [1, -.5], [1.9, -.4], [2.2, 0]), 'elbL.rx': T([0, 0], [1, -.5], [2.2, 0]), 'elbR.rx': T([0, 0], [1, -.5], [2.2, 0]),
    'hips.y': T([0, 0], [.5, -.25 * k], [1, .05 * k], [1.9, .05 * k], [2.2, 0]), 'surge': T([0, 0], [.9, 1], [1.9, 1], [2.2, 0]),
  }, t), 'hips.x': .05 * k * Math.sin(t * 47) * env, 'torso.rz': .03 * Math.sin(t * 39) * env, 'head.rz': .05 * Math.sin(t * 53) * env };
};
const stompD = (t, k) => ({ ...seq({
  'legR.rx': T([0, 0], [.55, -1.1], [.7, -1.15], [.78, -.1, 'i'], [1.1, -.05], [1.7, 0]), 'kneeR.rx': T([0, 0], [.55, 1.5], [.78, .1, 'i'], [1.7, 0]), 'footR.rx': T([0, 0], [.55, .6], [.78, 0]),
  'hips.x': T([0, 0], [.55, .3 * k], [.78, .1 * k], [1.7, 0]), 'torso.rx': T([0, 0], [.55, -.15], [.78, .35, 'i'], [1.1, .1], [1.7, 0]), 'hips.y': T([0, 0], [.55, .15 * k], [.78, -.35 * k, 'i'], [.95, -.1 * k], [1.7, 0]),
  'armL.rx': T([0, 0], [.55, -.6], [.78, .4, 'i'], [1.7, 0]), 'armR.rx': T([0, 0], [.55, -.6], [.78, .4, 'i'], [1.7, 0]), 'armL.rz': T([0, 0], [.55, .4], [.78, .1], [1.7, 0]), 'armR.rz': T([0, 0], [.55, -.4], [.78, -.1], [1.7, 0]),
  'head.rx': T([0, 0], [.55, -.25], [.78, .25, 'i'], [1.7, 0]), 'surge': T([0, 0], [.7, .2], [.8, 1, 'o'], [1.2, 0]),
}, t), 'hips.sy': -.05 * Math.sin((t - .78) * 22) * Math.exp(-(t - .78) * 3.5) * (t > .78 ? 1 : 0) });

function creature(C) {
  const mk = c => hatch(addRim(toon(c, { emissive: C.emissive, emissiveIntensity: C.emissiveI ?? .6 }), C.rim, C.rimP || 2, C.rimK || 1.7), { strength: .45, scale: 5, tint: C.hatch || 0x2a1a44, t1: .35, t2: .6 });
  const mat = mk(C.color), skin = mk(C.skinColor ?? C.color);
  LUMP.amt = C.lump || 0; LUMP.seed = C.lumpSeed || 1;
  const { root: body, j, parts } = humanoid({ ...C.rig, mat, skin });
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); rig.add(body); rig.scale.setScalar(C.scale || 1);
  const glow = new THREE.MeshBasicMaterial({ color: C.glow }), dimCol = new THREE.Color(C.glow).multiplyScalar(.35), brCol = new THREE.Color(C.glow).lerp(new THREE.Color(0xffb060), C.hot || .2);
  C.cracks.forEach(([k, n, r, st, sp], i) => parts[k].add(cracks(parts[k].userData.dims, n, i * 13 + 5, r, st || 7, sp || .24, glow, 1.012 + (C.lump || 0) * .9)));
  const extra = C.decor({ j, parts, mat, skin, glow, body, rig });
  LUMP.amt = 0;
  if (C.spikes) C.spikes.forEach(([k, n, len, up], i) => spikesOn(parts[k], n, len, mat, 31 + i, up));
  body.traverse(o => { if (o.isMesh && o.material.isMeshBasicMaterial && o.material.side === THREE.BackSide) o.material.color.set(C.outline); });
  const aura = halo(C.auraColor, C.aura, C.auraO ?? .4, THREE.NormalBlending); aura.position.y = C.auraY; root.add(aura);
  const drips = makeDrips(body, C.drips(j, parts), mat, 11, C.dripScale || 1);
  groundRig(body, j.hips); C.P.H = j.hips.position.y;
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), toon(PALETTE.sludge, { emissive: 0x3a1856, emissiveIntensity: .5 })); puddle.rotation.x = -Math.PI / 2; puddle.position.y = .02; puddle.visible = false; root.add(puddle);
  const P = C.P, defs = { idle: { loop: true }, walk: { loop: true }, attack: { dur: P.atkDur, impact: P.atkDur * P.atkU, next: 'idle' }, hit: { dur: .55, next: 'idle' }, death: { dur: P.deathDur, hold: true }, alias: { run: 'walk', move: 'walk' } };
  if (C.boss) { defs.roar = { dur: 2.2, impact: .9, next: 'idle' }; defs.stomp = { dur: 1.7, impact: .78, next: 'idle' }; }
  const baseP = { 'armL.rz': P.armOut, 'armR.rz': -P.armOut, 'elbL.rx': -P.elb, 'elbR.rx': -P.elb, 'torso.rx': P.hunch, 'head.rx': -P.hunch * .7, ...P.base };
  const an = new Animator(j, defs, (st, t, ctx) => {
    let d;
    if (st === 'idle') d = idleD(t, P); else if (st === 'walk') d = walkD(ctx.phase, P);
    else if (st === 'attack') d = P.slam ? slam(t / P.atkDur, P.drop) : swipe(t / P.atkDur);
    else if (st === 'hit') d = hit(t / .55, P.hitK); else if (st === 'death') d = deathD(t / P.deathDur, P);
    else if (st === 'roar') d = roarD(t, P.drop); else d = stompD(t, P.drop);
    return add(baseP, d);
  }, .18);
  const mats = [mat, skin], time = { v: 0 };
  const self = {
    root, radius: C.radius, joints: j, onImpact: null, get state() { return an.state; }, get dead() { return an.state === 'death' && an.done; }, get animTime() { return an.t; },
    get impact() { const d = defs[an.state]; return d.impact != null && an.t >= d.impact && an.t < d.impact + .14; },
    setState(n) { an.setState(n); },
    update(dt, state) {
      if (state) an.setState(state);
      dt = Math.min(dt, .05); time.v += dt; an.onImpact = s => self.onImpact && self.onImpact(s);
      if (an.state === 'walk') an.ctx.phase += dt * P.rate;
      an.update(dt);
      const po = an.pose, dim = po.dim || 0, surge = po.surge || 0;
      glow.color.copy(dimCol).lerp(brCol, clamp((.6 + .25 * Math.sin(time.v * 3) + surge * .5) * (1 - dim) + (an.state === 'hit' ? .3 : 0)));
      const pu = po.puddle || 0; puddle.visible = pu > .01; puddle.scale.setScalar(Math.max(.01, pu * C.puddle));
      drips.update(time.v, 'wet' in po ? clamp(po.wet) : 1);
      extra && extra.update && extra.update(time.v, po, an);
      aura.material.opacity = (C.auraO ?? .4) * (.8 + .2 * Math.sin(time.v * 2.4)) * (1 - dim);
      emissiveFlash(mats, an.state === 'hit' ? Math.max(0, 1 - an.t / .2) * .9 : 0, 0xffd0ff);
    },
  };
  return self;
}

const SLUDGE = 0x3a2058, SLUDGE_E = 0x1d0a33;
function eye(parent, x, y, z, w, h, mat, pupil) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mat); e.scale.set(w, h, w * .5); e.position.set(x, y, z); parent.add(e);
  if (pupil) { const p = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1a0a24 })); p.scale.set(w * .22, h * .8, w * .25); p.position.set(0, 0, .75); e.add(p); }
  return e;
}
function teeth(parent, n, x0, x1, y, z, size, mat, flip) {
  for (let i = 0; i < n; i++) { const t = cone(size, size * 2.2, mat, 0, 4); t.position.set(lerp(x0, x1, n > 1 ? i / (n - 1) : .5), y, z); if (flip) t.rotation.x = Math.PI; t.rotation.z = (Math.random() - .5) * .3; parent.add(t); }
}

export function makeImp() {
  const bone = toon(0xe8dca0), eyeM = new THREE.MeshBasicMaterial({ color: 0xffd93a });
  return creature({
    color: SLUDGE, emissive: SLUDGE_E, glow: 0xd04bff, rim: 0xc070ff, rimP: 3.2, rimK: .8, outline: 0x7a56b8, lump: .12, lumpSeed: 3, aura: 1.7, auraY: .5, auraColor: 0x8a30e0, auraO: .16, hatch: 0x3a2060, spikes: [['torso', 5, .16, true]], scale: 1, radius: .4, puddle: .55, dripScale: .55,
    rig: { hipsY: .28, pelvis: [.2, .17, .17], pelvisY: .04, torsoY: .04, torso: { dims: [.25, .27, .21], cy: .22 }, head: { y: .5, cy: .17, dims: [.33, .27, .27], z: .04 }, arm: { x: .27, y: .38, upper: [.06, .3], fore: [.055, .3], hand: [.07, .08, .07] }, leg: { x: .1, thigh: [.07, .17], shin: [.06, .17], foot: [.08, .04, .13] }, th: .02 },
    cracks: [['torso', 3, .014], ['head', 2, .012], ['pelvis', 1, .012], ['upperL', 1, .01], ['upperR', 1, .01]],
    P: { breathT: 1.1, br: .03, tail: .35, armOut: .35, elb: .4, hunch: .3, base: { 'armL.rx': -.25, 'armR.rx': -.25 }, rate: 11, atkDur: .85, atkU: .45, hitK: 1.6, deathDur: .9, H: .28, drop: 1, slam: false,
      gait: { leg: .9, knee: 1.2, kneeBase: .12, arm: .8, elb: .5, elbV: .3, bob: .055, twist: .3, sway: .09, shift: .03, lean: .1, leanV: .06, headV: .09 } },
    decor({ j, parts, mat, skin }) {
      const head = parts.head;
      eye(head, .105, .04, .225, .085, .1, eyeM, true); eye(head, -.105, .04, .225, .085, .1, eyeM, true);
      for (const s of [1, -1]) { const h = halo(0xffc820, .34, .7); h.position.set(s * .105, .04, .27); head.add(h); }
      for (const s of [1, -1]) { const br = blob(.09, .025, .05, mat, .01, 8); br.position.set(s * .1, .14, .22); br.rotation.z = s * -.45; head.add(br); const ear = cone(.07, .34, mat, .014, 6); ear.position.set(s * .29, .07, -.02); ear.rotation.z = -s * 1.15; ear.rotation.x = -.35; head.add(ear); }
      const cap = cone(.09, .22, mat, .014, 6); cap.position.set(0, .25, -.02); cap.rotation.x = -.5; head.add(cap);
      const cav = blob(.12, .055, .05, new THREE.MeshBasicMaterial({ color: 0x1a0830 }), 0, 10); cav.position.set(0, -.1, .21); head.add(cav);
      const jaw = j.jaw = grp(head, 0, -.07, .1); const jb = blob(.13, .04, .11, mat, .014, 10); jb.position.set(0, -.02, .09); jaw.add(jb);
      teeth(head, 4, -.1, .1, -.075, .235, .018, bone, true); teeth(jaw, 4, -.09, .09, .0, .185, .016, bone, false);
      for (const n of ['L', 'R']) for (let i = 0; i < 3; i++) { const c = cone(.018, .1, bone, .008, 5); c.position.set((i - 1) * .035, -.1, .03); c.rotation.x = Math.PI - .5; j['hand' + n].add(c); }
      let p = grp(j.hips, 0, .02, -.14); for (let i = 1; i <= 3; i++) { const s = j['tail' + i] = grp(p, 0, i === 1 ? 0 : 0, i === 1 ? 0 : -.1); const m = blob(.05 - i * .01, .045 - i * .008, .07, mat, .014, 8); m.position.z = -.05; s.add(m); p = s; }
      j.tail1.rotation.x = .5;
    },
    drips: (j, parts) => [{ node: j.handL, p: [0, -.1, .02], len: .22 }, { node: j.handR, p: [0, -.1, .02], len: .2 }, { node: parts.head, p: [.05, -.2, .1], len: .15 }, { node: parts.torso, p: [-.1, -.2, .12], len: .2 }],
  });
}

export function makeGolem() {
  const bone = toon(0xe8dca0), eyeM = new THREE.MeshBasicMaterial({ color: 0xff7bff });
  return creature({
    color: SLUDGE, emissive: SLUDGE_E, glow: 0xd04bff, rim: 0xc080ff, rimP: 3.2, rimK: .8, outline: 0x7a56b8, lump: .17, lumpSeed: 5, aura: 5.5, auraY: 1.2, auraColor: 0x8a30e0, auraO: .3, hatch: 0x3a2060, spikes: [['upperL', 5, .5], ['upperR', 5, .5], ['torso', 9, .5, true], ['foreL', 3, .35], ['foreR', 3, .35]], scale: .95, radius: 1.2, puddle: 1.9, dripScale: 1.15,
    rig: { hipsY: 1.3, pelvis: [.65, .4, .5], pelvisY: .1, torsoY: .12, torso: { dims: [1.0, .95, .78], cy: .85 }, head: { y: 1.8, cy: .1, dims: [.4, .34, .36], z: .35 }, arm: { x: 1.08, y: 1.35, upper: [.36, .95], fore: [.44, .95], hand: [.42, .46, .42] }, leg: { x: .45, thigh: [.36, .7], shin: [.32, .6], foot: [.42, .18, .58] }, th: .045 },
    cracks: [['torso', 8, .035, 8, .2], ['pelvis', 2, .03], ['head', 2, .02], ['upperL', 3, .03], ['upperR', 3, .03], ['foreL', 3, .035], ['foreR', 3, .035], ['thighL', 2, .03], ['thighR', 2, .03], ['shinL', 1, .03], ['shinR', 1, .03]],
    P: { breathT: 2.6, br: .018, tail: 0, armOut: .22, elb: .18, hunch: .32, base: {}, rate: 4.4, atkDur: 1.35, atkU: .5, hitK: 1, deathDur: 1.5, H: 1.3, drop: 1.3, slam: true,
      gait: { leg: .55, knee: .85, kneeBase: .08, arm: .45, elb: .15, elbV: .12, bob: .07, twist: .2, sway: .08, shift: .06, lean: .06, leanV: .03, headV: .04 } },
    decor({ j, parts, mat, skin, body }) {
      const head = parts.head;
      for (const s of [1, -1]) eye(head, s * .13, .03, .3, .09, .055, eyeM, false);
      const brow = blob(.3, .06, .16, mat, .02, 10); brow.position.set(0, .13, .22); brow.rotation.x = .2; head.add(brow);
      const mouth = blob(.17, .04, .05, new THREE.MeshBasicMaterial({ color: 0x1a0830 }), 0, 8); mouth.position.set(0, -.12, .34); head.add(mouth);
      const sh = [[.78, 1.62, -.05, .5, .4, .46], [-.8, 1.55, -.08, .46, .36, .42], [0, 1.5, -.5, .62, .5, .45], [.4, 1.78, -.3, .3, .26, .3]];
      for (const [x, y, z, a, b, c] of sh) { const l = blob(a, b, c, mat, .04, 12); l.position.set(x, y, z); j.torso.add(l); }
      const log = cyl(.08, .1, 1.1, toon(0x6b4a3c), .03, 8); log.position.set(.35, 2.0, -.55); log.rotation.set(.3, 0, -.8); j.torso.add(log);
      for (const n of ['L', 'R']) for (let i = 0; i < 4; i++) { const f = blob(.075, .2, .075, skin, .025, 8); f.position.set((i - 1.5) * .1, -.4, .06); f.rotation.x = -.15; j['hand' + n].add(f); }
      const crown = []; for (const [x, z] of [[-.3, .2], [.3, .15], [0, -.1]]) { const sp = cone(.1, .35, mat, .025, 5); sp.position.set(x, .28, z); sp.rotation.z = x * .8; head.add(sp); crown.push(sp); }
    },
    drips: (j, parts) => [{ node: parts.foreL, p: [.15, -.5, .1], len: .6, fall: 1.2 }, { node: parts.foreR, p: [-.1, -.55, .15], len: .5 }, { node: parts.upperL, p: [.1, -.5, .2], len: .45 }, { node: parts.upperR, p: [-.15, -.45, .2], len: .5 }, { node: parts.torso, p: [.3, -.8, .45], len: .55, fall: 1.6 }, { node: parts.torso, p: [-.4, -.82, .4], len: .45, fall: 1.6 }, { node: parts.pelvis, p: [.2, -.35, .38], len: .4 }, { node: parts.head, p: [0, -.3, .3], len: .3 }],
  });
}

export function makeBoss() {
  const bone = toon(0xe0d2b0), eyeM = new THREE.MeshBasicMaterial({ color: 0xff3355 }), rust = toon(0x7a5442, { emissive: 0x2a1218, emissiveIntensity: .5 }), steel = toon(0x59525e, { emissive: 0x1a1226, emissiveIntensity: .5 }), band = toon(0x2d2830);
  return creature({
    boss: true, color: 0x2e1c24, emissive: 0x1a0a12, glow: PALETTE.boss, rim: 0xff6a58, rimP: 3.0, rimK: 1.4, outline: 0xd0707a, lump: .14, lumpSeed: 9, aura: 12, auraY: 3.2, auraColor: 0xd01838, auraO: .26, hatch: 0x401820, spikes: [['upperL', 6, .8], ['upperR', 6, .8], ['foreL', 4, .6], ['foreR', 4, .6], ['torso', 10, .8, true], ['pelvis', 4, .5]], scale: 1.8, radius: 4.4, puddle: 4, dripScale: 2.2, skinColor: 0x3d2830,
    rig: { hipsY: 2.15, pelvis: [1.1, .7, .85], pelvisY: .2, torsoY: .3, torso: { dims: [1.85, 1.5, 1.35], cy: 1.2 }, head: { y: 2.65, cy: .1, dims: [.72, .56, .62], z: .75 }, arm: { x: 2.1, y: 2.1, upper: [.7, 1.7], fore: [.85, 1.8], hand: [.85, .9, .8], depth: 1 }, leg: { x: .85, thigh: [.7, 1.2], shin: [.62, 1.1], foot: [.75, .3, 1.0] }, th: .08 },
    cracks: [['torso', 16, .055, 9, .22], ['pelvis', 3, .05], ['head', 3, .035], ['upperL', 4, .05], ['upperR', 4, .05], ['foreL', 4, .055], ['foreR', 4, .055], ['thighL', 3, .05], ['thighR', 3, .05], ['shinL', 2, .05], ['shinR', 2, .05]],
    P: { breathT: 3.4, br: .014, tail: 0, armOut: .3, elb: .25, hunch: .3, base: {}, rate: 3.0, atkDur: 1.9, atkU: .5, hitK: .55, deathDur: 2.4, H: 2.15, drop: 2, slam: true,
      gait: { leg: .45, knee: .7, kneeBase: .06, arm: .35, elb: .1, elbV: .1, bob: .12, twist: .16, sway: .07, shift: .12, lean: .04, leanV: .03, headV: .03 } },
    decor({ j, parts, mat, skin, glow }) {
      const head = parts.head, torso = j.torso, puffs = [];
      for (const s of [1, -1]) { eye(head, s * .24, .12, .55, .13, .07, eyeM, false); const br = blob(.24, .07, .15, mat, .04, 8); br.position.set(s * .22, .27, .5); br.rotation.z = s * -.4; head.add(br); const horn = cone(.12, .6, mat, .035, 6); horn.position.set(s * .5, .35, -.05); horn.rotation.z = -s * .6; head.add(horn); }
      const cav = blob(.4, .17, .1, new THREE.MeshBasicMaterial({ color: 0x300814 }), 0, 10); cav.position.set(0, -.17, .5); head.add(cav);
      const jaw = j.jaw = grp(head, 0, -.18, .2); const jb = blob(.42, .13, .36, mat, .05, 10); jb.position.set(0, -.08, .25); jaw.add(jb);
      teeth(head, 7, -.34, .34, -.14, .56, .045, bone, true); teeth(jaw, 6, -.3, .3, -.03, .52, .05, bone, false);
      const core = blob(.5, .6, .16, glow, 0, 12); core.position.set(0, .35, 1.2); core.rotation.x = -.1; parts.torso.add(core);
      const hot = blob(.26, .34, .2, new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), 0, 12); hot.position.set(0, .38, 1.24); parts.torso.add(hot);
      const coreHalo = halo(0xff3050, 3.4, .75); coreHalo.position.set(0, .38, 1.5); parts.torso.add(coreHalo);
      const coreHalo2 = halo(0xffd080, 1.5, .8); coreHalo2.position.set(0, .38, 1.55); parts.torso.add(coreHalo2);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, sh = cone(.05, .9 + (i % 2) * .5, glow, 0, 4); sh.position.set(Math.cos(a) * .3, .38 + Math.sin(a) * .36, 1.2); sh.lookAt(sh.position.x * 3, .38 + Math.sin(a) * 2, 3); sh.rotateX(Math.PI / 2); parts.torso.add(sh); }
      const hump = blob(1.5, 1.0, 1.0, mat, .07, 14); hump.position.set(0, 2.2, -.65); torso.add(hump);
      for (const [x, y, z, a, b, c] of [[1.5, 2.15, .05, .75, .6, .7], [-1.55, 2.1, 0, .7, .55, .65], [.9, 2.7, -.55, .6, .5, .55], [-.8, 2.75, -.7, .55, .45, .5]]) { const l = blob(a, b, c, mat, .06, 12); l.position.set(x, y, z); torso.add(l); }
      for (const [x, z, h, r] of [[.7, -1.0, 2.1, .2], [-.4, -1.15, 1.6, .17], [-1.1, -.7, 1.2, .15]]) {
        const st = cyl(r, r * 1.15, h, steel, .05, 10); st.position.set(x, 2.5 + h / 2, z); torso.add(st); const rim = cyl(r * 1.3, r * 1.3, .12, band, .03, 10); rim.position.set(x, 2.5 + h, z); torso.add(rim);
        for (let i = 0; i < 3; i++) { const p = blob(.28, .28, .28, new THREE.MeshToonMaterial({ color: 0x7b6a86, gradientMap: mat.gradientMap }), 0, 8); p.userData = { x, z, y: 2.5 + h, off: i / 3, r }; torso.add(p); puffs.push(p); }
      }
      const pipe = (pts, r, m = steel) => { const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .15), 24, r, 8), m); torso.add(t); const o = new THREE.Mesh(t.geometry, new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.BackSide })); o.material.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed=position+normal*0.05;'); }; t.add(o); };
      pipe([[.2, 2.4, -.9], [.3, 3.0, -1.0], [-.3, 3.4, -.9], [-.5, 3.9, -.8]], .12); pipe([[1.2, 1.9, -.9], [1.6, 2.6, -1.1], [1.1, 3.2, -1.0], [.8, 3.4, -.95]], .11, rust); pipe([[-1.2, 2.2, -.9], [-1.6, 2.9, -1.0], [-1.2, 3.3, -.8]], .1, rust);
      for (const [x, y, z, rz, rx] of [[1.2, 3.1, -.5, -.4, .3], [-.2, 3.5, -.1, .5, -.2], [-1.4, 2.9, -.3, .3, .1]]) {
        const b = cyl(.36, .36, .7, rust, .05, 12); b.position.set(x, y, z); b.rotation.set(rx, 0, rz); torso.add(b);
        for (const dy of [-.22, .22]) { const r = cyl(.385, .385, .07, band, .02, 12); r.position.y = dy; b.add(r); }
        const lid = cyl(.3, .3, .02, glow, 0, 10); lid.position.y = .36; b.add(lid);
      }
      for (const [k, n] of [['L', 0], ['R', 1]]) for (let i = 0; i < 4; i++) { const f = blob(.1, .4, .1, skin, .04, 8); f.position.set((i - 1.5) * .2, -.7, .15); f.rotation.x = -.25; j['hand' + k].add(f); const cl = cone(.07, .3, bone, .02, 5); cl.position.set((i - 1.5) * .2, -1.08, .24); cl.rotation.x = Math.PI - .35; j['hand' + k].add(cl); }
      return { update(t) { const pu = .5 + .5 * Math.sin(t * 3.1); coreHalo.scale.setScalar(3 + 1.2 * pu); coreHalo.material.opacity = .55 + .3 * pu; hot.scale.setScalar(.9 + .25 * pu); for (const p of puffs) { const u = (t * .22 + p.userData.off + p.userData.x) % 1; p.position.set(p.userData.x + u * .5 + Math.sin(u * 6 + p.userData.x) * .1, p.userData.y + .2 + u * 1.8, p.userData.z - u * .3); p.scale.setScalar(.35 + u * .9 * (1 - u * u)); } } };
    },
    drips: (j, parts) => [{ node: parts.foreL, p: [.2, -.9, .15], len: 1.2, fall: 2 }, { node: parts.foreR, p: [-.2, -.95, .2], len: 1.0, fall: 2 }, { node: parts.upperL, p: [.2, -.8, .4], len: .8 }, { node: parts.upperR, p: [-.25, -.85, .4], len: .9 }, { node: parts.torso, p: [.7, -1.1, 1.0], len: .9, fall: 2.6 }, { node: parts.torso, p: [-.8, -1.1, .9], len: .8, fall: 2.6 }, { node: parts.pelvis, p: [.3, -.55, .75], len: .7, fall: 2 }, { node: parts.head, p: [.2, -.5, .5], len: .5 }, { node: parts.thighL, p: [.3, -.7, .45], len: .6 }],
  });
}
