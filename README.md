# Lofi: Thaw & Build

A 3D action game made for the **CLAY Hackathon**. You play Lofi, a small white yeti with a blue scarf, who wakes a frozen valley of drifting ice arches and floating islands. Sludge imps, golems and the Grime Titan have fouled the streams. Smash them, purify each stream, then take the Titan down at the largest source.

Everything is procedural: no external art, audio files or models. Geometry, toon materials, ink outlines, the sky, water and sound are all generated in code with three.js. The look targets Moebius linework and flat pastel fields crossed with Roger Dean's floating islands and sweeping arches. See ART_BIBLE.md and the concept paintings in art/.

## How it relates to Lofi lore and the hackathon

Lofi is the hero of the Lofi universe: a gentle yeti whose job is to thaw and rebuild, not to conquer. Purifying a stream (clean turquoise water spreading through the sludge, ice crystals blooming) is the game's "thaw", and the water litres you clean are the score. For the CLAY Hackathon the entire game is built from code: characters are nested-joint procedural rigs with keyframed animation, the world is generated terrain plus ribbon arches, and the combat feel (hit-stop, shake, shattered-ice slam) is tuned in game.js.

## Run it

```
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve dist/
```

Extras: chars.html is a character viewer (?only=lofi|imp|golem|boss&state=attack). Debug URL flags: ?go=1 skips the title, ?bot=1 lets an autopilot play, ?boss=1 jumps to the boss, ?fast=N speeds up simulation, ?q=low starts in low quality, ?fly=x,y,z,yawDeg,pitchDeg&hide=1 puts the camera anywhere.

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

- src/world.js, post.js, style.js: terrain, sky, water, arches, islands, ink post pass, toon materials
- src/char_*.js, characters.js: rigs and animation for Lofi, imp, golem and the boss
- src/game.js, hud.js, audio.js: input, camera, combat, waves, upgrades, HUD, synthesized audio
