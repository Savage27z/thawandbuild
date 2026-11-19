import * as THREE from 'three';
import { makeLofi, makeImp, makeGolem, makeBoss } from './characters.js';
import { PALETTE } from './style.js';
const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcfe6ee); scene.fog = new THREE.Fog(0xe8d8d0, 30, 70);
const cam = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .1, 200);
scene.add(new THREE.HemisphereLight(0xdff2ff, 0xc98a8a, 1.5)); const sun = new THREE.DirectionalLight(0xfff0dd, 2.2); sun.position.set(-5, 9, 7); scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshToonMaterial({ color: 0xdff2f7 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const chars = { lofi: makeLofi(), imp: makeImp(), golem: makeGolem(), boss: makeBoss() };
const xs = { lofi: -6.2, imp: -3.4, golem: -.2, boss: 6.5 };
for (const k in chars) { chars[k].root.position.x = xs[k]; chars[k].root.rotation.y = q.has('rot') ? +q.get('rot') * Math.PI / 180 : .35; scene.add(chars[k].root); }
const only = q.get('only'); if (only) for (const k in chars) { chars[k].root.visible = k === only; if (k === only) { chars[k].root.position.x = 0; } }
const states = { lofi: ['idle', 'run', 'attack', 'dash', 'hit', 'celebrate'], imp: ['idle', 'walk', 'attack', 'hit', 'death'], golem: ['idle', 'walk', 'attack', 'hit', 'death'], boss: ['idle', 'walk', 'attack', 'hit', 'death', 'roar', 'stomp'] };
const ui = document.getElementById('ui'); const cur = {};
function set(k, s) { cur[k] = s; chars[k].setState(s); }
for (const k in states) { const d = document.createElement('div'); d.append(k + ': '); for (const s of states[k]) { const b = document.createElement('button'); b.textContent = s; b.onclick = () => set(k, s); d.append(b); } ui.append(d); }
if (q.has('hideui')) ui.style.display = 'none';
const S = q.get('state'); if (S) for (const k in chars) { if (S === 'attack' || states[k].includes(S)) set(k, S); }
const speed = q.get('speed'); if (speed != null) chars.lofi.setMoveSpeed(+speed);
let frozen = q.has('freeze'), t = 0; const look = new THREE.Vector3(...(q.get('look') || (only ? '0,1.6,0' : '0,2.2,0')).split(',').map(Number)); const cp = (q.get('cam') || (only ? (only === 'boss' ? '0,4,20' : '2,2.5,7') : '0,4.5,19')).split(',').map(Number);
cam.position.set(...cp); cam.lookAt(look);
const step = dt => { for (const k in chars) chars[k].update(dt, cur[k]); t += dt; };
window.demo = { chars, set, step, scene, cam, advance(sec, h = 1 / 60) { for (let i = 0; i < Math.round(sec / h); i++) step(h); renderer.render(scene, cam); }, render() { renderer.render(scene, cam); } };
if (q.get('t')) window.demo.advance(+q.get('t'));
if (q.get('sheet')) {
  const n = +q.get('sheet'), dur = +q.get('dur') || 1, cols = Math.min(n, +q.get('cols') || 4), rows = Math.ceil(n / cols), w = innerWidth / cols, h = innerHeight / rows;
  renderer.setScissorTest(true); cam.aspect = w / h; cam.updateProjectionMatrix(); frozen = true;
  for (let i = 0; i < n; i++) { const x = (i % cols) * w, y = innerHeight - (Math.floor(i / cols) + 1) * h; renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.render(scene, cam); for (let k = 0; k < 20; k++) step(dur / n / 20); }
}
let last = performance.now(); renderer.setAnimationLoop(() => { if (q.get('sheet')) return; const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; if (!frozen) step(dt); renderer.render(scene, cam); });
