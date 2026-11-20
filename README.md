# Lofi: Thaw & Build

A 3D action game made for the **CLAY Hackathon**. You play Lofi, a small white yeti with a blue scarf, who wakes a frozen valley of drifting ice arches and floating islands. Sludge imps, golems and the Grime Titan have fouled the streams. Smash them, purify each stream, then take the Titan down at the largest source.

Everything is procedural: no external art, audio files or models. Geometry, toon materials, ink outlines, the night sky (moon, aurora), water and sound are all generated in code with three.js.

**Brand look:** deep navy night, electric-blue and violet ice, neon-green sludge with magenta/violet enemies, and a sci-fi cockpit HUD with pixel type (see art/concept2-*.png). Lofi follows the official character art (art/official-lofi.png): a tall lanky white yeti with pale-grey side shading, blue frog-like face, blue fists and bare feet. art/final2-*.png are current screenshots; art/final2-lofi-vs-official.png compares the model with the reference.

## How it relates to Lofi lore and the hackathon

Lofi is the hero of the Lofi universe: a gentle yeti whose job is to thaw and rebuild, not to conquer. Purifying a stream (clean turquoise water spreading through the sludge, ice crystals blooming) is the game's "thaw", and the water litres you clean are the score. For the CLAY Hackathon the entire game is built from code: characters are nested-joint procedural rigs with keyframed animation, the world is generated terrain plus ribbon arches, and the combat feel (hit-stop, shake, shattered-ice slam) is tuned in game.js.

## Maps (multi-map progression)

Three maps, unlocked in order and remembered in localStorage:

1. **Glacier Valley** — frozen arches, sludge streams, boss: the Grime Titan.
2. **Neon Server City** — purple box towers, a lit monolith, floating UI panels, toxic data-spill rivers, boss: the Corrupted Mainframe.
3. **Funfair Frostpark** (final) — giant Ferris wheel, striped tents, archery targets on floating cliffs, rancid slushie rivers, boss: the Grime Ringmaster.

Every map has its own terrain function (`heightAt`), sky shader, palette, props, 3–4 sludge streams, enemy mix and difficulty scaling, and its own boss tint and attack variation (the mainframe blinks and fires a twin beam; the ringmaster chain-stomps and summons extra imps). Clearing a map's boss opens a MAP CLEAR screen: XP, level and boons carry into the next map. The title screen has a map select showing every map's thumbnail; locked maps unlock when the previous one is cleared.

Each map is a config in `src/maps/` (`glacier.js`, `server.js`, `funfair.js`) consumed by `createWorld(scene, mapId)` in `src/world.js`, which builds everything under one group and exposes `dispose()`; switching maps tears the old world down before the next is built. Shared geometry builders live in `src/propkit.js` and noise in `src/mapkit.js`.

Screenshots: art/maps-title.png (title with map select), art/maps-glacier.png, art/maps-server.png, art/maps-funfair.png.

## Run it

```
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve dist/
```

Extras: chars.html is a character viewer (?only=lofi|imp|golem|boss&state=attack). Debug URL flags: ?go=1 skips the title, ?bot=1 lets an autopilot play, ?boss=1 jumps to the boss, ?autokill=N kills the boss after N seconds and ?weak=1 drops boss HP for quick progression tests, ?map=1|2|3 picks the map, ?fast=N speeds up simulation, ?q=low starts in low quality, ?fly=x,y,z,yawDeg,pitchDeg&hide=1 puts the camera anywhere.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Mouse (click to capture) or arrow keys | Look |
| Left mouse | 3-hit combo (the third hit is a heavy slam) |
| Q or right mouse | Ice slam: shatters ice in a radius and freezes enemies |
| Space | Dash (invulnerable) |
| 1 / 2 / 3 | Pick a boon on level-up |
| P | Toggle quality (high: post ink pass + 1.5x pixel ratio, low: 1x, no post) |

## Structure

- src/world.js, src/maps/*, src/mapkit.js, src/propkit.js: map-config driven worlds (terrain, sky, water, arches, islands, props) with teardown
- src/post.js, style.js: ink post pass, toon/outline/hatch materials
- src/progress.js: map unlocks in localStorage
- src/char_*.js, characters.js: rigs and animation for Lofi, imp, golem and the boss
- src/game.js, hud.js, audio.js: input, camera, combat, waves, upgrades, HUD, synthesized audio
