// Lofi the Yeti (official design): tall lanky yeti in soft shaggy white fur, big blue Pepe-style frog face, blue fists and bare blue feet. Faces +z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, toon, outline } from './style.js';
import { Animator, blob, grp, humanoid, groundRig, furMat, gait, add, mix, hit, seq, smooth, clamp, lerp, emissiveFlash, addRim, rng, surf, surfN, TAU } from './char_core.js';

const GAIT = { leg: .62, knee: 1.15, kneeBase: .1, arm: .5, elb: .5, elbV: .28, bob: .05, twist: .2, sway: .07, shift: .03, lean: .14, leanV: .03, headV: .05 };
const DEFS = { idle: { loop: true }, run: { loop: true }, dash: { loop: true }, celebrate: { loop: true }, attack: { dur: 1.05, impact: .48, next: 'idle' }, strike: { dur: .4, impact: .17, next: 'idle' }, hit: { dur: .55, next: 'idle' }, death: { dur: 1.3, hold: true }, alias: { walk: 'run', slam: 'attack', cheer: 'celebrate', die: 'death', idle: 'idle' } };
const KF = (...a) => a;
const SKIN = 0x6c9bdc, SKIN_D = 0x4d76ba, SKIN_L = 0x8fb6ea, FUR_SHADE = 0xc4c9dc, FUR_MID = 0xe0e4f0;

// ---- shaggy fur locks ------------------------------------------------
// a lock: wide at the root, tapering to a fine point, drooping as it falls. +Y is the length axis.
function lockGeo(len, rad, flat, seed) {
  const R = rng(seed), N = 8, pts = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const r = Math.pow(1 - s, .72) * (.74 + .36 * Math.sin(Math.PI * Math.min(1, s * 1.5)));
    pts.push(new THREE.Vector2(Math.max(r * rad, .0004), s * len));
  }
  const g = new THREE.LatheGeometry(pts, 6);
  g.scale(1, 1, flat);
  const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const t = clamp(p.getY(i) / len);
    p.setY(i, p.getY(i) - t * t * len * .32);
    p.setX(i, p.getX(i) + t * t * len * (R() - .5) * .2);
    col.setHex(FUR_SHADE).lerp(new THREE.Color(FUR_MID), smooth(0, .45, t)).lerp(new THREE.Color(0xffffff), smooth(.4, .95, t));
    c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.computeVertexNormals();
  return g;
}

// fringe rows of locks around an ellipsoid shell. never outlined: they are fur, not rock.
function locks(d, rings, len, seed, { out = .5, down = 1.45, flat = .5, thick = .19, skip, tone = 1, lenVar = .42, droopSeed = 0 } = {}) {
  const R = rng(seed + droopSeed), geos = [], up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), m = new THREE.Matrix4();
  for (let ri = 0; ri < rings.length; ri++) {
    const { el = 0, n = 8, lm = 1 } = rings[ri];
    for (let i = 0; i < n; i++) {
      const az = (i + (R() - .5) * .55) / n * TAU, e = el + (R() - .5) * .16;
      const p = surf(d, az, e, .94), nr = surfN(d, p);
      if (skip && skip(nr, p)) continue;
      const L = len * lm * (1 - lenVar + R() * lenVar * 2), W = L * thick * (1 + (R() - .5) * .35);
      const dir = nr.clone().multiplyScalar(out * (1 + (R() - .4) * .6)).add(new THREE.Vector3(0, -down, 0)).add(new THREE.Vector3((R() - .5) * .3, 0, (R() - .5) * .3)).normalize();
      const g = lockGeo(L, W, flat + (R() - .5) * .1, seed * 131 + ri * 17 + i);
      const k = clamp(.1 + .55 * Math.max(0, -nr.y) + .38 * Math.abs(nr.x)) * tone;
      const col = g.attributes.color, tmp = new THREE.Color();
      for (let vi = 0; vi < col.count; vi++) { tmp.fromBufferAttribute(col, vi).lerp(new THREE.Color(FUR_SHADE), k * .7); col.setXYZ(vi, tmp.r, tmp.g, tmp.b); }
      q.setFromUnitVectors(up, dir).multiply(new THREE.Quaternion().setFromAxisAngle(up, R() * TAU));
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      g.applyMatrix4(m);
      geos.push(g);
    }
  }
  return geos.length ? mergeGeometries(geos) : new THREE.BufferGeometry();
}

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
const base = { 'armL.rz': .12, 'armR.rz': -.12, 'elbL.rx': -.16, 'elbR.rx': -.16, 'armL.rx': 0, 'torso.rx': .07, 'head.rx': .05, 'mouth.smile': -.45 };

export function makeLofi() {
  const furC = toon(0xf4f5fb, { emissive: 0xe8ebf6, emissiveIntensity: .45 }); addRim(furC, 0x8ae6ff, 2.6, .5);
  const skin = toon(SKIN, { emissive: 0x2c4f94, emissiveIntensity: .22 }); addRim(skin, 0x9cc4ff, 2.4, .4);
  const skinM = toon(SKIN_D, { emissive: 0x24406f, emissiveIntensity: .2 }), skinL = toon(SKIN_L, { emissive: 0x40649f, emissiveIntensity: .2 });
  const tuftM = furMat(); tuftM.polygonOffset = true; tuftM.polygonOffsetFactor = 1.5; tuftM.polygonOffsetUnits = 1.5; tuftM.emissive.set(0xe6e9f6); tuftM.emissiveIntensity = .34;

  const { root: body, j, parts } = humanoid({
    hipsY: .94, pelvis: [.185, .155, .16], pelvisY: .05, torsoY: .02, torso: { dims: [.195, .315, .16], cy: .29 },
    head: { y: .63, z: .075, cy: .27, dims: [.245, .235, .215] },
    arm: { x: .315, y: .485, upper: [.105, .35], fore: [.095, .33], hand: [.15, .14, .135] },
    leg: { x: .155, thigh: [.118, .38], shin: [.105, .40], foot: [.128, .075, .29] }, mat: furC, skin, th: .018,
  });
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); rig.add(body);
  body.rotation.x = .035;

  // ---------------- body shell: one soft continuous mass ----------------
  // extra masses that fill the joints so the silhouette never breaks into parts
  const shell = (host, d, x = 0, y = 0, z = 0, mat = furC) => { const m = blob(...d, mat, .016, 16); m.position.set(x, y, z); host.add(m); return m; };
  shell(j.torso, [.205, .135, .165], 0, .40);         // chest / shoulders
  shell(j.torso, [.10, .11, .095], 0, .545);         // neck
  for (const n of ['L', 'R']) {
    const s = n === 'L' ? 1 : -1;
    shell(j['arm' + n], [.125, .125, .125], 0, -.03);  // shoulder cap
    shell(j['elb' + n], [.105, .10, .10], 0, .01);     // elbow
    shell(j['knee' + n], [.118, .115, .115], 0, .01);  // knee
    shell(j['leg' + n], [.135, .13, .13], 0, -.02);    // hip
  }

  // ---------------- fur: fringe rows of drooping locks ----------------
  const fur = [];
  const sway = (g, k, ph) => { fur.push({ g, k, ph, a: 0, av: 0, b: 0, bv: 0 }); return g; };
  const D = p => p.userData.dims, S = (p, k = 1.02) => D(p).map(v => v * k);
  const coat = (host, d, rings, len, seed, o) => { const m = new THREE.Mesh(locks(d, rings, len, seed, o), tuftM); host.add(m); return m; };

  coat(parts.torso, S(parts.torso), [{ el: -1.05, n: 10, lm: 1.15 }, { el: -.45, n: 6 }, { el: .2, n: 5, lm: .8 }], .30, 1,
    { out: .45, skip: nr => (nr.z > .75 && Math.abs(nr.x) < .5 && nr.y > -.4) || (Math.abs(nr.x) > .72 && nr.y > -.3) });
  coat(parts.pelvis, S(parts.pelvis), [{ el: -1.0, n: 10, lm: 1.2 }, { el: -.35, n: 7 }], .32, 2, { out: .5 });
  coat(parts.head, S(parts.head, 1.0), [{ el: -.9, n: 6, lm: 1.1 }, { el: -.2, n: 6, lm: .9 }], .17, 3,
    { out: .45, skip: nr => nr.z > .45 && Math.abs(nr.x) < .9 && nr.y < .5 });
  for (const n of ['L', 'R']) {
    const s = n === 'L' ? 0 : 60;
    coat(parts['upper' + n], S(parts['upper' + n]), [{ el: -.75, n: 4, lm: 1.1 }, { el: 0, n: 3, lm: .85 }], .24, 4 + s, { out: .5, skip: nr => nr.x * (n === 'L' ? 1 : -1) < -.35 });
    coat(parts['fore' + n], S(parts['fore' + n]), [{ el: -.8, n: 5, lm: 1.15 }, { el: -.1, n: 3 }], .22, 5 + s, { out: .45, down: 1.7, skip: nr => nr.x * (n === 'L' ? 1 : -1) < -.35 });
    coat(parts['thigh' + n], S(parts['thigh' + n]), [{ el: -.75, n: 5, lm: 1.1 }, { el: 0, n: 4, lm: .85 }], .26, 6 + s, { out: .5 });
    coat(parts['shin' + n], S(parts['shin' + n]), [{ el: -.8, n: 5, lm: 1.1 }, { el: -.1, n: 3 }], .24, 7 + s, { out: .45, down: 1.7 });
    // wrist + ankle cuffs hang and swing
    const wr = sway(grp(j['elb' + n], 0, -.42, 0), 1.1, s + 3), an = sway(grp(j['knee' + n], 0, -.46, 0), .8, s + 5);
    coat(wr, [.105, .05, .095], [{ el: -.35, n: 6, lm: 1.1 }, { el: .5, n: 4 }], .19, 44 + s, { out: .75, down: 1.9 });
    coat(an, [.115, .05, .10], [{ el: -.35, n: 6, lm: 1.1 }, { el: .5, n: 4 }], .18, 54 + s, { out: .7, down: 2.0, skip: nr => nr.y < -.5 });
  }
  // hip skirt, chest mane, big shoulder ruff, head crest
  const skirt = sway(grp(j.hips, 0, .10, 0), .7, 3);
  coat(skirt, [.21, .08, .19], [{ el: -.4, n: 11, lm: 1.2 }, { el: .3, n: 6, lm: .8 }], .34, 70, { out: .6, down: 1.9 });
  const chest = sway(grp(j.torso, 0, .32, 0), .6, 4);
  coat(chest, [.23, .09, .19], [{ el: -.45, n: 9, lm: 1.1 }], .30, 71, { out: .55, down: 1.9, skip: nr => nr.z < -.4 });
  const ruff = sway(grp(j.torso, 0, .48, 0), 1.0, 6);
  coat(ruff, [.29, .11, .25], [{ el: -.35, n: 12, lm: 1.15 }, { el: .35, n: 8, lm: .85 }], .30, 73, { out: .85, down: 1.5, skip: nr => nr.z > .7 && Math.abs(nr.x) < .45 });
  const crest = sway(grp(j.head, 0, .215, -.03), 1.5, 5);
  coat(crest, [.20, .075, .17], [{ el: .35, n: 7, lm: 1.1 }, { el: .9, n: 5, lm: .8 }], .26, 72, { out: .5, down: -.55, skip: nr => nr.y < .1 || (nr.z > .6 && nr.y < .5) });

  // ---------------- hands, feet ----------------
  const ink = new THREE.MeshBasicMaterial({ color: PALETTE.ink }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const n of ['L', 'R']) {
    const s = n === 'L' ? 1 : -1;
    for (let i = 0; i < 4; i++) { const f = blob(.038, .05, .042, skinM, .008, 8); f.position.set(s * (i - 1.5) * -.06, -.055, .10); f.rotation.x = -.35; j['hand' + n].add(f); }
    const th = blob(.045, .075, .045, skinM, .009, 8); th.position.set(s * .125, -.035, .045); th.rotation.z = s * -.55; j['hand' + n].add(th);
    for (let i = 0; i < 4; i++) { const t = blob(.042 - Math.abs(i - 1.5) * .004, .038, .055, skinM, .008, 8); t.position.set(s * (i - 1.5) * -.062, -.035, .155); parts['foot' + n].add(t); }
  }

  // ---------------- face ----------------
  const head = parts.head, dH = D(parts.head);
  const mask = blob(.205, .17, .125, skin, .012, 18); mask.position.set(0, -.025, .10); head.add(mask);
  const brow = blob(.18, .045, .045, skinL, .007, 14); brow.position.set(0, .11, .15); brow.rotation.x = -.3; head.add(brow);
  const bridge = blob(.035, .075, .03, skin, .005, 10); bridge.position.set(0, .045, .195); head.add(bridge);
  const eyes = {}, lids = {};
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R', ex = s * .087, ey = .025;
    const ring = blob(.062, .066, .026, skinM, .005, 12); ring.position.set(ex, ey, .19); ring.rotation.z = s * .08; head.add(ring);
    const e = eyes[n] = grp(head, ex, ey, .2), ball = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), ink); ball.scale.set(.047, .052, .022); e.add(ball);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), white); gl.scale.set(.017, .018, .011); gl.position.set(.013 * s, .017, .013); e.add(gl);
    const gl2 = gl.clone(); gl2.scale.set(.007, .007, .005); gl2.position.set(-.015 * s, -.013, .014); e.add(gl2); j['eye' + n] = e;
    // heavy droopy upper lid, sitting over the top third of the eye
    const lid = lids[n] = grp(head, ex, ey, .205), lm = blob(.06, .04, .024, skin, .005, 12); lm.position.y = .036; lid.add(lm); lid.userData.y0 = ey;
  }
  const mouth = j.mouth = grp(head, 0, -.108, .195);
  const lipLine = new THREE.Mesh(new THREE.TorusGeometry(.108, .019, 6, 24, Math.PI), ink); lipLine.scale.set(1, .22, 1); lipLine.rotation.z = Math.PI; mouth.add(lipLine);
  const open = j.mouthOpen = blob(.09, .058, .02, new THREE.MeshBasicMaterial({ color: 0x1a1030 }), 0, 12); open.position.set(0, .014, -.004); mouth.add(open);
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(.12, .016, .01), white); teeth.position.set(0, .032, .012); open.add(teeth);
  for (const s of [1, -1]) { const nr = blob(.017, .011, .013, skinM, .003, 6); nr.position.set(s * .026, -.055, .205); head.add(nr); }
  const chin = blob(.105, .045, .05, skin, .007, 10); chin.position.set(0, -.16, .155); head.add(chin);

  const groundBox = groundRig(body, j.hips);
  const mats = [furC, skin, tuftM, skinM, skinL];
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
        j['eye' + n].scale.set(1, Math.max(.06, 1 - .8 * shut), 1);
        // heavy droopy upper lid: hangs lower as the character frowns or blinks
        lids[n].position.y = .012 - .062 * shut - .012 * Math.max(0, ang - .3);
        lids[n].scale.y = 1 + .6 * shut;
        lids[n].rotation.z = s * (.06 + .3 * Math.max(0, ang - .35));
      }
      const o = an.pose['mouth.open'] || 0; j.mouthOpen.scale.set(1, Math.max(.001, o * 1.4), 1); j.mouthOpen.visible = o > .02; teeth.visible = an.state === 'attack' || an.state === 'strike';
      mouth.position.y = -.105; mouth.scale.y = clamp(1 + ang * .5, .4, 1.8); mouth.rotation.z = 0;
      lipLine.scale.y = .3 * (ang < 0 ? -1 : 1) * (1 + Math.abs(ang) * .6);
      emissiveFlash(mats, an.state === 'hit' ? Math.max(0, 1 - an.t / .22) * .7 : 0, 0xff9a90);
    },
  };
  return self;
}
