// Shared character toolkit: ellipsoid blobs with ink outline, fur tufts, glow cracks, keyframes, pose blending, humanoid skeleton.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, toon, outline } from './style.js';

export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const E = {
  s: t => .5 - .5 * Math.cos(Math.PI * t), l: t => t, i: t => t * t * t, o: t => 1 - Math.pow(1 - t, 3),
  b: t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
// keys: [[time,value,ease?]...]; ease applies to the segment ending at that key.
export function kf(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return a[1] + (b[1] - a[1]) * E[b[2] || 's']((t - a[0]) / (b[0] - a[0])); }
  }
  return keys[keys.length - 1][1];
}
export const seq = (table, t) => { const p = {}; for (const k in table) p[k] = kf(table[k], t); return p; };
export const add = (a, b) => { const p = { ...a }; for (const k in b) p[k] = (p[k] || 0) + b[k]; return p; };
export function mix(a, b, w) { const p = {}; for (const k in a) p[k] = (a[k]) * (1 - w) + (b[k] || 0) * w; for (const k in b) if (!(k in a)) p[k] = b[k] * w; return p; }

// ellipsoid with analytic normals so the inverted-hull outline stays even
export const LUMP = { amt: 0, seed: 1 };
const lumpN = (x, y, z, s) => { x *= 2.2; y *= 2.2; z *= 2.2; const a = Math.sin(x * 5.1 + s) * Math.sin(y * 4.3 + s * 1.7) + Math.sin(z * 6.2 - s) * Math.sin(x * 3.7 + z * 2.9 + s * .6), b = Math.sin(x * 11 + y * 9 + s * 2) * Math.sin(z * 10 - y * 7 + s); return .5 + .3 * a + .22 * b; };
export function blobGeo(rx, ry, rz, seg = 18) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * .75)), p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * rx, y = p.getY(i) * ry, z = p.getZ(i) * rz;
    if (LUMP.amt) { const q = 1 + LUMP.amt * lumpN(p.getX(i), p.getY(i), p.getZ(i), LUMP.seed); x *= q; y *= q; z *= q; }
    p.setXYZ(i, x, y, z);
    const v = new THREE.Vector3(x / (rx * rx), y / (ry * ry), z / (rz * rz)).normalize(); n.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
export function blob(rx, ry, rz, mat, th = .03, seg = 18) {
  const m = new THREE.Mesh(blobGeo(rx, ry, rz, seg), mat); m.userData.dims = [rx, ry, rz];
  if (th) outline(m, th); return m;
}
export function rboxGeo(w, h, d, r = .05, seg = 3) {
  const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2), p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), q = new THREE.Vector3();
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i)); q.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
    const dir = v.clone().sub(q).normalize(); v.copy(q).addScaledVector(dir, r); p.setXYZ(i, v.x, v.y, v.z); n.setXYZ(i, dir.x, dir.y, dir.z);
  }
  return g;
}
export function rbox(w, h, d, mat, r = .05, th = .025) { const m = new THREE.Mesh(rboxGeo(w, h, d, Math.min(r, w / 2, h / 2, d / 2)), mat); if (th) outline(m, th); return m; }
export function cyl(rt, rb, h, mat, th = .025, seg = 12) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); if (th) outline(m, th); return m; }
export function cone(r, h, mat, th = .02, seg = 6) { const g = new THREE.ConeGeometry(r, h, seg); g.translate(0, h / 2, 0); const m = new THREE.Mesh(g, mat); if (th) outline(m, th); return m; }
export function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent && parent.add(g); return g; }

export const surf = (d, az, el, o = 1) => new THREE.Vector3(d[0] * Math.cos(el) * Math.sin(az) * o, d[1] * Math.sin(el) * o, d[2] * Math.cos(el) * Math.cos(az) * o);
export const surfN = (d, v) => new THREE.Vector3(v.x / (d[0] * d[0]), v.y / (d[1] * d[1]), v.z / (d[2] * d[2])).normalize();

// merged cone tufts over an ellipsoid; base darker than tip for fur depth
export function tufts(d, n, len, rad, seed, { down = .5, base = 0xb9cdee, tip = 0xffffff, skip, jitter = .4, lenVar = .5, droop = .45 } = {}) {
  const R = rng(seed), geos = [], ln = [], up = new THREE.Vector3(0, 1, 0), cb = new THREE.Color(base), ct = new THREE.Color(tip);
  for (let i = 0, tries = 0; i < n && tries < n * 6; tries++) {
    const az = R() * TAU, el = Math.asin(R() * 2 - 1), p = surf(d, az, el), nr = surfN(d, p);
    if (skip && skip(nr, p)) continue; i++;
    const dir = nr.clone().add(new THREE.Vector3(0, -down, 0)).add(new THREE.Vector3(R() - .5, R() - .5, R() - .5).multiplyScalar(jitter)).normalize();
    const L = len * (1 - lenVar + R() * lenVar * 2), w = rad * (.7 + R() * .6), g = new THREE.CylinderGeometry(w * .22, w, L, 5, 3); g.translate(0, L / 2, 0);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), m = new THREE.Matrix4().compose(p.clone().addScaledVector(nr, -len * .25), new THREE.Quaternion().setFromUnitVectors(up, dir).multiply(new THREE.Quaternion().setFromAxisAngle(up, R() * TAU)), new THREE.Vector3(1.5, 1, .8)), v = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) { const t = clamp(pos.getY(k) / L), c = cb.clone().lerp(ct, t); col.set([c.r, c.g, c.b], k * 3); v.fromBufferAttribute(pos, k).applyMatrix4(m); v.y -= t * t * L * droop; pos.setXYZ(k, v.x, v.y, v.z); }
    ln.push(pos.getX(18), pos.getY(18), pos.getZ(18), pos.getX(0), pos.getY(0), pos.getZ(0));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    geos.push(g.toNonIndexed());
  }
  const out = geos.length ? mergeGeometries(geos) : new THREE.BufferGeometry(); out.userData.lines = new Float32Array(ln); return out;
}
export const furMat = (c = 0xffffff) => toon(c, { vertexColors: true, emissive: PALETTE.furShadow, emissiveIntensity: .32 });

// glowing crack lines crawling over an ellipsoid surface
export function cracks(d, count, seed, rad = .03, steps = 7, step = .24, mat, off = 1.012) {
  const R = rng(seed), geos = [];
  for (let c = 0; c < count; c++) {
    let az = R() * TAU, el = (R() - .5) * 1.8, dir = R() * TAU; const pts = [];
    for (let s = 0; s < steps; s++) { pts.push(surf(d, az, el, off)); dir += (R() - .5) * 1.6; az += Math.cos(dir) * step; el = clamp(el + Math.sin(dir) * step, -1.35, 1.35); }
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps * 2, rad * (.6 + R() * .8), 4, false));
  }
  return new THREE.Mesh(mergeGeometries(geos), mat);
}

// hanging drips + falling droplets; all driven by time so they loop
export function makeDrips(parent, specs, mat, seed = 7, scale = 1) {
  const R = rng(seed), items = [];
  for (const s of specs) {
    const holder = s.node || parent, cn = cone(.075 * scale, 1, mat, .012 * scale, 6); cn.geometry = cn.geometry.clone(); cn.geometry.rotateX(Math.PI);
    const bulb = blob(.095 * scale, .11 * scale, .095 * scale, mat, .012 * scale, 8), drop = blob(.07 * scale, .09 * scale, .07 * scale, mat, .01 * scale, 8);
    cn.position.set(...s.p); bulb.position.set(...s.p); drop.position.set(...s.p);
    holder.add(cn, bulb, drop); items.push({ cn, bulb, drop, p: s.p, len: (s.len || .3) * scale, off: R(), per: 1.6 + R() * 1.4, fall: (s.fall || 1) * scale });
  }
  return { update(t, wet = 1) {
    for (const it of items) {
      const u = (t / it.per + it.off) % 1, form = smooth(0, .55, u), len = it.len * (.35 + .65 * form) * wet;
      it.cn.scale.set(1, len, 1); it.bulb.position.y = it.p[1] - len; it.bulb.scale.setScalar(form * wet * (u > .86 ? 1 - smooth(.86, .9, u) : 1) + 1e-3);
      const f = smooth(.86, 1, u); it.drop.visible = f > 0 && wet > .05; it.drop.position.y = it.p[1] - len - f * f * it.fall * 1.4; it.drop.scale.setScalar(1 - f * .6 + 1e-3);
    }
  } };
}

// generic pose applier + one-shot/loop state machine with blending
export class Animator {
  constructor(rig, defs, poseFn, blend = .15) { this.rig = rig; this.defs = defs; this.poseFn = poseFn; this.blend = blend; this.state = 'idle'; this.t = 0; this.prev = 'idle'; this.pt = 0; this.bt = 1; this.targets = new Map(); this.pose = {}; this.ctx = { phase: 0, w: 0 }; this.done = false; this.fired = false; this.onImpact = null; }
  setState(n, force) {
    if (!this.defs[n]) n = this.defs.alias?.[n] || 'idle';
    const d = this.defs[n];
    if (!force && n === this.state && (d.loop || (!this.done && this.t < d.dur))) return;
    this.prev = this.state; this.pt = this.t; this.bt = 0; this.state = n; this.t = 0; this.done = false; this.fired = false;
  }
  update(dt) {
    const d = this.defs[this.state]; this.t += dt; this.pt += dt; this.bt = Math.min(1, this.bt + dt / this.blend);
    if (d.impact != null && !this.fired && this.t >= d.impact) { this.fired = true; this.onImpact && this.onImpact(this.state); }
    if (!d.loop && this.t >= d.dur) { if (d.hold) { this.t = d.dur; this.done = true; } else { this.setState(d.next || 'idle'); } }
    let pose = this.poseFn(this.state, this.t, this.ctx);
    if (this.bt < 1) pose = mix(this.poseFn(this.prev, this.pt, this.ctx), pose, E.s(this.bt));
    this.pose = pose; this.apply(pose);
  }
  apply(pose) {
    for (const k in pose) {
      if (this.targets.has(k) || k.indexOf('.') < 0) continue;
      const [n, pr] = k.split('.'), node = this.rig[n]; if (!node) continue;
      this.targets.set(k, { node, pr, rest: pr.length === 1 ? node.position[pr] : 0 });
    }
    for (const [k, g] of this.targets) {
      const v = pose[k] || 0, pr = g.pr;
      if (pr[0] === 'r') g.node.rotation[pr[1]] = v; else if (pr[0] === 's') g.node.scale[pr[1]] = 1 + v; else g.node.position[pr] = g.rest + v;
    }
  }
}

// Humanoid skeleton of nested joints. Names: hips torso head armL/R elbL/R handL/R legL/R kneeL/R footL/R. +z forward. L = +x.
export function humanoid(c) {
  const root = new THREE.Group(), j = { root }, parts = {}, th = c.th ?? .03, S = c.skin || c.mat;
  const hips = j.hips = grp(root, 0, c.hipsY, 0);
  parts.pelvis = blob(...c.pelvis, c.mat, th); parts.pelvis.position.y = c.pelvisY ?? .05; hips.add(parts.pelvis);
  const torso = j.torso = grp(hips, 0, c.torsoY, 0);
  parts.torso = blob(...c.torso.dims, c.mat, th); parts.torso.position.y = c.torso.cy; torso.add(parts.torso);
  const head = j.head = grp(torso, 0, c.head.y, c.head.z || 0);
  parts.head = blob(...c.head.dims, c.mat, th); parts.head.position.y = c.head.cy; head.add(parts.head);
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const a = c.arm, sh = j['arm' + n] = grp(torso, s * a.x, a.y, 0);
    const up = parts['upper' + n] = blob(a.upper[0], a.upper[1] * .62, a.upper[0] * (a.depth || 1), c.mat, th); up.position.y = -a.upper[1] / 2; sh.add(up);
    const el = j['elb' + n] = grp(sh, 0, -a.upper[1], 0);
    const fo = parts['fore' + n] = blob(a.fore[0], a.fore[1] * .62, a.fore[0] * (a.depth || 1), c.mat, th); fo.position.y = -a.fore[1] / 2; el.add(fo);
    const hd = j['hand' + n] = grp(el, 0, -a.fore[1], 0);
    const hm = parts['hand' + n] = blob(...a.hand, a.handMat || S, th); hm.position.y = -a.hand[1] * .5; hd.add(hm);
    const l = c.leg, lg = j['leg' + n] = grp(hips, s * l.x, 0, 0);
    const tg = parts['thigh' + n] = blob(l.thigh[0], l.thigh[1] * .62, l.thigh[0] * (l.depth || 1), c.mat, th); tg.position.y = -l.thigh[1] / 2; lg.add(tg);
    const kn = j['knee' + n] = grp(lg, 0, -l.thigh[1], 0);
    const sk = parts['shin' + n] = blob(l.shin[0], l.shin[1] * .62, l.shin[0] * (l.depth || 1), c.mat, th); sk.position.y = -l.shin[1] / 2; kn.add(sk);
    const ft = j['foot' + n] = grp(kn, 0, -l.shin[1], 0);
    const fm = parts['foot' + n] = blob(...l.foot, c.footMat || S, th); fm.position.set(0, -l.foot[1] * .45, l.foot[2] * .35); ft.add(fm);
  }
  return { root, j, parts };
}
export function groundRig(root, hips) { root.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(root); hips.position.y -= b.min.y; root.updateMatrixWorld(true); return b; }

// gait helper shared by all biped characters. returns additive deltas
export function gait(ph, g) {
  const s = Math.sin(ph), c = Math.cos(ph), c2 = Math.cos(ph + Math.PI);
  const kb = a => g.knee * Math.pow(Math.max(0, a), 1.2) + g.kneeBase;
  return {
    'legL.rx': -g.leg * s, 'legR.rx': g.leg * s, 'kneeL.rx': kb(c), 'kneeR.rx': kb(c2),
    'footL.rx': -.3 * kb(c) + .3 * g.leg * s, 'footR.rx': -.3 * kb(c2) - .3 * g.leg * s,
    'armL.rx': g.arm * s, 'armR.rx': -g.arm * s, 'elbL.rx': -g.elb - g.elbV * (.5 + .5 * c2), 'elbR.rx': -g.elb - g.elbV * (.5 + .5 * c),
    'hips.y': g.bob * Math.cos(2 * ph), 'hips.ry': -g.twist * s * .6, 'torso.ry': g.twist * s, 'hips.rz': g.sway * s * .5, 'torso.rz': -g.sway * s,
    'hips.x': g.shift * Math.sin(ph), 'torso.rx': g.lean + g.leanV * Math.cos(2 * ph), 'head.rx': -g.lean * .7 + g.headV * Math.cos(2 * ph + .7), 'head.ry': -g.twist * s * .8, 'head.rz': g.sway * s * .6,
  };
}

export function emissiveFlash(mats, amt, color = 0xffffff) { for (const m of mats) { if (!m.userData.e0) m.userData.e0 = [m.emissive.getHex(), m.emissiveIntensity]; if (amt > 0) { m.emissive.set(color); m.emissiveIntensity = amt; } else { m.emissive.setHex(m.userData.e0[0]); m.emissiveIntensity = m.userData.e0[1]; } } }

// shared normalized one-shot tables (u = 0..1). k scales the body drop.
const T = (...a) => a;
export function slam(u, k = 1) {
  return seq({
    'armL.rx': T([0, 0], [.28, -2.9], [.4, -3.05], [.5, -.7, 'i'], [.62, -.3, 'o'], [.82, -.08], [1, 0]),
    'armR.rx': T([0, 0], [.28, -2.9], [.4, -3.05], [.5, -.7, 'i'], [.62, -.3, 'o'], [.82, -.08], [1, 0]),
    'armL.rz': T([0, 0], [.28, -.3], [.5, .08, 'i'], [.7, 0], [1, 0]), 'armR.rz': T([0, 0], [.28, .3], [.5, -.08, 'i'], [.7, 0], [1, 0]),
    'elbL.rx': T([0, 0], [.28, -.5], [.5, -.05, 'i'], [.62, -.3], [1, 0]), 'elbR.rx': T([0, 0], [.28, -.5], [.5, -.05, 'i'], [.62, -.3], [1, 0]),
    'torso.rx': T([0, 0], [.28, -.4], [.4, -.46], [.5, .6, 'i'], [.62, .45], [.82, .1], [1, 0]),
    'head.rx': T([0, 0], [.28, -.3], [.5, .35, 'i'], [.8, .05], [1, 0]),
    'hips.y': T([0, 0], [.28, .1 * k], [.4, .14 * k], [.5, -.3 * k, 'i'], [.65, -.2 * k], [.85, -.04 * k], [1, 0]),
    'hips.z': T([0, 0], [.28, -.08 * k], [.5, .28 * k, 'i'], [.65, .2 * k], [1, 0]),
    'hips.sy': T([0, 0], [.4, 0], [.5, -.1, 'i'], [.62, .03], [1, 0]),
    'legL.rx': T([0, 0], [.28, .25], [.5, -.6, 'i'], [.7, -.35], [1, 0]), 'legR.rx': T([0, 0], [.28, .4], [.5, .3, 'i'], [.7, .15], [1, 0]),
    'kneeL.rx': T([0, 0], [.28, .1], [.5, 1.0, 'i'], [.7, .6], [1, 0]), 'kneeR.rx': T([0, 0], [.28, .1], [.5, .8, 'i'], [.7, .5], [1, 0]),
    'footL.rx': T([0, 0], [.5, .3], [1, 0]), 'footR.rx': T([0, 0], [.5, -.2], [1, 0]),
    'jaw.rx': T([0, 0], [.4, .6], [.5, .3], [.8, 0]),
    'tail.rx': T([0, 0], [.3, -.3], [.5, .4], [1, 0]),
  }, u);
}
export function hit(u, k = 1) {
  return seq({
    'torso.rx': T([0, 0], [.14, -.45 * k, 'o'], [.4, -.3 * k], [1, 0]), 'head.rx': T([0, 0], [.14, -.6 * k, 'o'], [.4, -.2 * k], [1, 0]),
    'head.ry': T([0, 0], [.14, .3], [.3, -.2], [.6, .08], [1, 0]), 'head.rz': T([0, 0], [.14, .2], [.4, -.1], [1, 0]),
    'armL.rz': T([0, 0], [.14, .8 * k, 'o'], [.6, .2], [1, 0]), 'armR.rz': T([0, 0], [.14, -.8 * k, 'o'], [.6, -.2], [1, 0]),
    'armL.rx': T([0, 0], [.14, -.5], [1, 0]), 'armR.rx': T([0, 0], [.14, -.5], [1, 0]),
    'hips.z': T([0, 0], [.14, -.15 * k, 'o'], [1, 0]), 'hips.y': T([0, 0], [.1, -.1 * k], [.4, .02], [1, 0]),
    'hips.sy': T([0, 0], [.1, -.12], [.3, .05], [.6, 0], [1, 0]), 'hips.sx': T([0, 0], [.1, .08], [.3, -.03], [1, 0]),
    'kneeL.rx': T([0, 0], [.14, .4], [1, 0]), 'kneeR.rx': T([0, 0], [.14, .4], [1, 0]),
    'eyeL.sy': T([0, 0], [.1, -.8], [.55, -.6], [1, 0]), 'eyeR.sy': T([0, 0], [.1, -.8], [.55, -.6], [1, 0]),
  }, u);
}


export function addRim(mat, color, power = 2.5, k = 1) {
  const u = { rimC: { value: new THREE.Color(color) }, rimP: { value: power }, rimK: { value: k } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = 'uniform vec3 rimC;uniform float rimP;uniform float rimK;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\n float rimF = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), rimP) * rimK; gl_FragColor.rgb += rimC * rimF;');
  }; mat.needsUpdate = true; return mat;
}
