// OWNER: character agent. Procedural 3D rigged characters (nested-joint skeletons) with looping animation.
// Every factory returns {root:THREE.Group, radius, update(dt,state), setState(name), onImpact, joints} with states below. Characters face +z.
// Lofi states: idle, run, attack (slam, one-shot -> idle), dash, hit (one-shot), celebrate; plus Lofi.setMoveSpeed(v) to blend idle/run.
// Enemies: idle, walk, attack, hit (one-shot), death (holds, .dead true). Boss also: roar, stomp. .impact is true briefly when a strike lands.
export { makeLofi } from './char_lofi.js';
export { makeImp, makeGolem, makeBoss } from './char_enemies.js';
