// Lofi the Yeti (official design): tall lanky yeti in soft shaggy white fur, big blue Pepe-style frog face, blue fists and bare blue feet. Faces +z.
// Fur is shell-based: the smooth body shell is re-drawn in five offset copies whose fragment shader discards noise,
// so the whole body frays into fuzz instead of wearing stick-on strips.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, toon, outline, gradient } from './style.js';
import { Animator, blob, blobGeo, grp, humanoid, groundRig, furMat, gait, add, mix, hit, seq, smooth, clamp, lerp, emissiveFlash, addRim, rng, surf, surfN, TAU } from './char_core.js';

const GAIT = { leg: .62, knee: 1.15, kneeBase: .1, arm: .5, elb: .5, elbV: .28, bob: .05, twist: .2, sway: .07, shift: .03, lean: .14, leanV: .03, headV: .05 };
const DEFS = { idle: { loop: true }, run: { loop: true }, dash: { loop: true }, celebrate: { loop: true }, attack: { dur: 1.05, impact: .48, next: 'idle' }, strike: { dur: .4, impact: .17, next: 'idle' }, hit: { dur: .55, next: 'idle' }, death: { dur: 1.3, hold: true }, alias: { walk: 'run', slam: 'attack', cheer: 'celebrate', die: 'death', idle: 'idle' } };
const KF = (...a) => a;
const SKIN = 0x6c9bdc, SKIN_D = 0x4d76ba, SKIN_L = 0x8fb6ea, FUR_SHADE = 0xbfc4da, FUR_MID = 0xdde1ee;

// ---- shell fur ---------------------------------------------------------------
// one material per fur layer: push the shell out along its normals, then fray it with smooth 3D value noise.
function furLayer(off, dens, color, cutZ = 0) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
  m.customProgramCacheKey = () => 'lofifur' + off + cutZ;
  m.onBeforeCompile = sh => {
    sh.uniforms.uOff = { value: off };
    sh.uniforms.uDens = { value: dens };
    sh.uniforms.uFreq = { value: 22 };
    sh.uniforms.uCutZ = { value: cutZ };
    sh.vertexShader = 'uniform float uOff;\nvarying vec3 vF;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed = vec3( position ) * ( 1.0 + uOff * 0.55 ) + normal * uOff; transformed.y -= uOff * 0.5; vF = position;');
    sh.fragmentShader = `uniform float uDens;
uniform float uFreq;
uniform float uCutZ;
varying vec3 vF;
float fHash(vec3 p){ p = fract(p * 0.3183099 + vec3(.11, .27, .39)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fHash(i), fHash(i + vec3(1,0,0)), f.x), mix(fHash(i + vec3(0,1,0)), fHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(fHash(i + vec3(0,0,1)), fHash(i + vec3(1,0,1)), f.x), mix(fHash(i + vec3(0,1,1)), fHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
` + sh.fragmentShader.replace('void main() {', `void main() {
  if (uCutZ > 0.0 && vF.z > uCutZ && vF.y > 0.02 && vF.y < 0.56) discard;
  float nz = fNoise(vF * uFreq) * 0.7 + fNoise(vF * uFreq * 2.4) * 0.3;
  if (nz < uDens) discard;`);
  };
  return m;
}

// a chunky tapered cap that follows the body contour: fat rounded base, blunt point
function capGeo(len, rad, bend, flat = .78) {
  const pts = [], N = 6;
  for (let i = 0; i <= N; i++) {
    const s = i / N, r = Math.pow(1 - s, .55) * (1 + .22 * Math.sin(Math.PI * s * 1.15));
    pts.push(new THREE.Vector2(Math.max(r * rad, .001), s * len));
  }
  const g = new THREE.LatheGeometry(pts, 7);
  g.scale(1, 1, flat);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const t = clamp(v.y / len);
    p.setXYZ(i, v.x + t * t * bend * len, v.y - t * t * len * .22, v.z + t * t * bend * len * .6);
  }
  g.computeVertexNormals();
  return g;
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
  const furC = toon(0xfbfbff, { emissive: 0xeef0f8, emissiveIntensity: .4 }); addRim(furC, 0x8ae6ff, 2.6, .4);
  const skin = toon(SKIN, { emissive: 0x2c4f94, emissiveIntensity: .22 }); addRim(skin, 0x9cc4ff, 2.4, .4);
  const skinM = toon(SKIN_D, { emissive: 0x24406f, emissiveIntensity: .2 }), skinL = toon(SKIN_L, { emissive: 0x40649f, emissiveIntensity: .2 });
  const capM = furMat(); capM.emissive.set(0xeef0f8); capM.emissiveIntensity = .35;
  // five fur shells, greyer and denser inside, whiter and hairier outside
  const layers = [[.014, .07, 0xf1f3fa], [.030, .18, 0xf7f8fd], [.048, .3, 0xfcfcff], [.068, .42, 0xffffff], [.090, .55, 0xffffff]]
    .map(([off, dens, c]) => furLayer(off, dens, c));
  const headLayers = [[.014, .07, 0xf1f3fa], [.030, .18, 0xf7f8fd], [.048, .3, 0xfcfcff], [.068, .42, 0xffffff], [.090, .55, 0xffffff]]
    .map(([off, dens, c]) => furLayer(off, dens, c, .07));

  const { root: body, j, parts } = humanoid({
    hipsY: .94, pelvis: [.185, .155, .16], pelvisY: .05, torsoY: .02, torso: { dims: [.195, .315, .16], cy: .29 },
    head: { y: .63, z: .075, cy: .27, dims: [.245, .235, .215] },
    arm: { x: .25, y: .485, upper: [.115, .35], fore: [.10, .33], hand: [.15, .14, .135] },
    leg: { x: .155, thigh: [.118, .38], shin: [.105, .40], foot: [.128, .075, .29] }, mat: furC, skin, th: 0,
  });
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); rig.add(body);
  body.rotation.x = .035;

  // ---------------- shell: one smooth merged mass per joint, fur shells on top ----------------
  const fur = [];
  const sway = (g, k, ph) => { fur.push({ g, k, ph, a: 0, av: 0, b: 0, bv: 0 }); return g; };
  const shellOf = (list) => mergeGeometries(list.map(([d, x = 0, y = 0, z = 0]) => blobGeo(d[0], d[1], d[2], 18).translate(x, y, z)));
  const part = (host, list, L = layers) => {
    const g = shellOf(list), m = new THREE.Mesh(g, furC);
    outline(m, .017, PALETTE.ink); host.add(m);
    for (const f of L) host.add(new THREE.Mesh(g, f));
    return m;
  };
  const D = p => p.userData.dims;
  part(j.torso, [[D(parts.torso), 0, .29], [[.225, .14, .175], 0, .40], [[.105, .12, .10], 0, .55], [[.19, .13, .17], 0, .13]]);
  part(j.hips, [[D(parts.pelvis), 0, .05], [[.17, .13, .15], 0, -.03]]);
  part(j.head, [[D(parts.head), 0, .27], [[.13, .13, .13], 0, .07]], headLayers);
  for (const n of ['L', 'R']) {
    part(j['arm' + n], [[[.118, .16, .118], 0, -.03], [D(parts['upper' + n]), 0, -.175]]);
    part(j['elb' + n], [[[.105, .105, .105], 0, .01], [D(parts['fore' + n]), 0, -.14]]);
    part(j['leg' + n], [[[.135, .14, .135], 0, -.02], [D(parts['thigh' + n]), 0, -.19]]);
    part(j['knee' + n], [[[.115, .115, .115], 0, .01], [D(parts['shin' + n]), 0, -.2]]);
  }

  // the joint blobs are replaced by the merged shells above
  for (const k of ['pelvis', 'torso', 'head', 'upperL', 'upperR', 'foreL', 'foreR', 'thighL', 'thighR', 'shinL', 'shinR']) if (parts[k]) parts[k].visible = false;

  // ---------------- chunky caps: shape, not texture ----------------
  const clumps = (host, spec, seed) => {
    const R = rng(seed), geos = [], up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), m = new THREE.Matrix4();
    for (const c of spec) {
      const g = capGeo(c.len, c.rad, c.bend ?? .2);
      q.setFromUnitVectors(up, new THREE.Vector3(...c.dir).normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(up, (R() - .5) * .6));
      m.compose(new THREE.Vector3(...c.pos), q, new THREE.Vector3(1, 1, 1));
      g.applyMatrix4(m); geos.push(g);
    }
    if (!geos.length) return null;
    const mesh = new THREE.Mesh(mergeGeometries(geos), capM); host.add(mesh); return mesh;
  };
  const ring = (n, rad, y, len, tilt, seed) => {
    const R = rng(seed), out = [];
    for (let i = 0; i < n; i++) {
      const a = (i + (R() - .5) * .3) / n * TAU, dx = Math.sin(a), dz = Math.cos(a);
      out.push({ pos: [dx * rad * (1 + (R() - .5) * .12), y + (R() - .5) * .05, dz * rad * (1 + (R() - .5) * .12)], dir: [dx * .75, -tilt - R() * .35, dz * .75], len: len * (.78 + R() * .5), rad: len * .2 * (.85 + R() * .4), bend: .3 });
    }
    return out;
  };
  clumps(grp(j.head, 0, .30, -.03), [
    { pos: [0, .16, .02], dir: [0, 1, -.35], len: .30, rad: .08, bend: -.35 },
    { pos: [-.09, .14, -.01], dir: [-.3, 1, -.5], len: .25, rad: .07, bend: -.3 },
    { pos: [.09, .14, -.01], dir: [.3, 1, -.5], len: .25, rad: .07, bend: -.3 },
    { pos: [-.16, .07, -.06], dir: [-.6, .8, -.6], len: .2, rad: .06, bend: -.2 },
    { pos: [.16, .07, -.06], dir: [.6, .8, -.6], len: .2, rad: .06, bend: -.2 },
  ], 11);
  const ruff = sway(grp(j.torso, 0, .50, 0), 1.0, 6);
  clumps(ruff, ring(11, .26, -.02, .30, .85, 21), 21);
  const chest = sway(grp(j.torso, 0, .26, .04), .6, 4);
  clumps(chest, [{ pos: [-.10, -.02, .17], dir: [.2, -1, .35], len: .26, rad: .08, bend: .3 }, { pos: [.10, -.02, .17], dir: [-.2, -1, .35], len: .26, rad: .08, bend: .3 }, { pos: [0, .0, .19], dir: [0, -1, .3], len: .3, rad: .09, bend: .25 }], 31);
  const hem = sway(grp(j.hips, 0, .06, 0), .7, 3);
  clumps(hem, ring(10, .19, -.03, .32, 1.6, 41), 41);
  for (const n of ['L', 'R']) {
    const s = n === 'L' ? 0 : 90;
    clumps(j['elb' + n], [{ pos: [0, -.02, 0], dir: [0, -1, -.3], len: .16, rad: .055, bend: .3 }, { pos: [0, -.02, .06], dir: [0, -1, .25], len: .14, rad: .05, bend: .3 }], 51 + s);
    clumps(j['knee' + n], [{ pos: [0, -.01, .04], dir: [0, -1, .2], len: .17, rad: .055, bend: .3 }, { pos: [0, -.01, -.04], dir: [0, -1, -.25], len: .15, rad: .05, bend: .3 }], 61 + s);
    const wr = sway(grp(j['elb' + n], 0, -.52, 0), 1.1, s + 3), an = sway(grp(j['knee' + n], 0, -.55, 0), .8, s + 5);
    clumps(wr, ring(6, .085, 0, .19, 2.2, 71 + s), 71 + s);
    clumps(an, ring(6, .09, 0, .18, 2.4, 81 + s), 81 + s);
  }

  // ---------------- hands, feet ----------------
  const ink = new THREE.MeshBasicMaterial({ color: PALETTE.ink }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const n of ['L', 'R']) {
    const s = n === 'L' ? 1 : -1;
    for (let i = 0; i < 4; i++) { const f = blob(.038, .05, .042, skinM, .008, 8); f.position.set(s * (i - 1.5) * -.06, -.055, .10); f.rotation.x = -.35; j['hand' + n].add(f); }
    const th = blob(.045, .075, .045, skinM, .009, 8); th.position.set(s * .125, -.035, .045); th.rotation.z = s * -.55; j['hand' + n].add(th);
    for (let i = 0; i < 4; i++) { const t = blob(.042 - Math.abs(i - 1.5) * .004, .038, .055, skinM, .008, 8); t.position.set(s * (i - 1.5) * -.062, -.035, .155); parts['foot' + n].add(t); }
  }

  // ---------------- face: a cap cut from the head itself, never a floating disc ----------------
  const head = grp(j.head);
  const RH = [.25, .24, .22];
  const cap = new THREE.SphereGeometry(1, 26, 18, 0, TAU, 0, Math.PI * .42);
  cap.rotateX(Math.PI / 2);
  const face = new THREE.Mesh(cap, skin); face.scale.set(RH[0], RH[1], RH[2]);
  face.position.set(0, .27, .012); face.rotation.x = -.06; head.add(face);
  const onF = (x, y, o = 0) => Math.sqrt(Math.max(0, 1 - (x / RH[0]) ** 2 - (y / RH[1]) ** 2)) * RH[2] + o;
  const at = (x, y, o, z) => new THREE.Vector3(x, y + .27, z ?? onF(x, y, o));
  // brow ridge running around the top of the face plate
  const brow = new THREE.Mesh(new THREE.TorusGeometry(RH[0] * .78, .038, 6, 20, Math.PI * .95), skinL);
  brow.position.set(0, .27 - .02, .075); brow.rotation.set(-.15, 0, Math.PI * .02); brow.scale.set(1, .82, .55); head.add(brow);
  const eyes = {}, lids = {};
  for (const s of [1, -1]) {
    const n = s > 0 ? 'L' : 'R', ex = s * .092, ey = .038;
    const p = at(ex, ey, .004), ring = blob(.066, .07, .022, skinM, .005, 12); ring.position.copy(p); ring.rotation.z = s * .06; head.add(ring);
    const e = eyes[n] = grp(head, p.x, p.y, p.z + .004), ball = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), ink); ball.scale.set(.05, .055, .022); e.add(ball);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), white); gl.scale.set(.017, .018, .01); gl.position.set(.013 * s, .017, .012); e.add(gl);
    const gl2 = gl.clone(); gl2.scale.set(.007, .007, .005); gl2.position.set(-.015 * s, -.013, .013); e.add(gl2); j['eye' + n] = e;
    const lid = lids[n] = grp(head, p.x, p.y, p.z + .006), lm = blob(.058, .04, .02, skin, .004, 12); lm.position.y = .034; lid.add(lm); lid.userData.y0 = ey;
  }
  const mp = at(0, -.088, .012);
  const mouth = j.mouth = grp(head, mp.x, mp.y, mp.z);
  const lipLine = new THREE.Mesh(new THREE.TorusGeometry(.105, .018, 6, 24, Math.PI), ink); lipLine.scale.set(1, .2, 1); lipLine.rotation.z = Math.PI; mouth.add(lipLine);
  const open = j.mouthOpen = blob(.09, .058, .02, new THREE.MeshBasicMaterial({ color: 0x1a1030 }), 0, 12); open.position.set(0, .012, -.01); mouth.add(open);
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(.12, .016, .01), white); teeth.position.set(0, .03, .008); open.add(teeth);
  for (const s of [1, -1]) { const np = at(s * .028, -.045, .006), nr = blob(.017, .011, .012, skinM, .003, 6); nr.position.copy(np); head.add(nr); }

  const groundBox = groundRig(body, j.hips);
  const mats = [furC, skin, capM, skinM, skinL];
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
        lids[n].position.y = lids[n].userData.y0 + .27 - .062 * shut - .012 * Math.max(0, ang - .3);
        lids[n].scale.y = 1 + .6 * shut;
        lids[n].rotation.z = s * (.06 + .3 * Math.max(0, ang - .35));
      }
      const o = an.pose['mouth.open'] || 0; j.mouthOpen.scale.set(1, Math.max(.001, o * 1.4), 1); j.mouthOpen.visible = o > .02; teeth.visible = an.state === 'attack' || an.state === 'strike';
      mouth.scale.y = clamp(1 + ang * .5, .4, 1.8);
      lipLine.scale.y = .2 * (ang < 0 ? -1 : 1) * (1 + Math.abs(ang) * .6);
      emissiveFlash(mats, an.state === 'hit' ? Math.max(0, 1 - an.t / .22) * .7 : 0, 0xff9a90);
    },
  };
  return self;
}
