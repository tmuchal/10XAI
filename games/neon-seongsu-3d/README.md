# 네온 성수: 데드 레인 (Neon Seongsu: Dead Rain)

A 3D third-person open-world game in the browser (Three.js r128, vendored in `vendor/`, no build step). It's set in the same Seongsu-dong as the 2D game in `../neon-seongsu/`, rebuilt in 3D and three years into an outbreak.

**Play:** open `index.html` in a desktop browser with WebGL. Click to lock the mouse. Graphics presets are on the title screen and in the pause menu: High adds real-time wet-street reflections, Medium and Low are for weaker GPUs.

## Setting
In 2076, OMNI Dynamics' **Project TTUK** spread "pacifying" spores through its drone mesh. The spores mutated, and Seongsu became **Quarantine Zone 7**: neon-infected zombies are drawn to light, and raider gangs split up the streets. Fixer **Yoon Mi-ra** runs the last shelter, Black Roastery, in a red-brick warehouse.

## What's in it
- **The city in 3D:** Line 2 viaduct with running trains and the Seongsu/Ttukseom stations, OMNI Tower with holo rings, red-brick warehouses, Seoul Forest, the Han River and the Seongsu Bridge silhouette. Horizontal and vertical Korean neon signs (a 2048² atlas), lit storefronts, rain, fog, bloom and wet-street reflections.
- **Combat:** P-77 pistol, SMG, shotgun and a monoblade. Headshots, hitmarkers, recoil and reloads. **Neuro-boost** (Z) slows the world while you move at full speed.
- **Zombies:** walkers, runners, brutes and exploding neon-infected. They follow you through the street grid with a flow field and hear gunshots and car alarms. They're fiercer at night, and spore nests in Seoul Forest keep breeding more.
- **Raiders:** they hold camps under Seongsu station and at the Ttukseom pier, patrol in armed trucks, and shoot both you and the zombies.
- **Cars:** about 95 abandoned cars, many of them locked. Hold E to hotwire one, which sets off the alarm. Pull raiders out of their trucks. Run over the infected. Cars take damage, catch fire and explode, and there's a radio.
- **Shelter building:** press B in the yard to place barricades, spike traps, auto-turrets, UV lights that slow the infected, generators, a bed (sleep and save) and a workbench (craft weapons, upgrades, ammo, vests, engine tuning). **Blood Rain** waves attack the shelter core at night.
- **Fixer contracts:** 8 story missions (rescue Old Kang, free Tae-o and steal the VOLT GT, defend a wave, take down Boss Hwang, burn the Ttukseom nests, pull the TTUK core from OMNI Tower), plus repeatable contracts: supply runs, bounties, nest burns, vehicle recovery and survivor rescues. Rescued people add shelter income. Cutscenes are bilingual (Korean and English).
- **HUD:** rotating minimap, objective marker, damage direction, day/night cycle, wave status and the build bar. Touch controls are included.

## Controls
WASD move / drive · mouse look (click to lock) · LMB fire / place · RMB aim · Shift sprint · Space jump / handbrake · R reload / rotate piece · 1–4 weapons · Q quick slash · E interact (hold to hotwire) · F enter/exit car · B build · Z neuro-boost · V flashlight · M map · Esc pause

## Code
| File | Contents |
|---|---|
| `js/world.js` | Tile map (1 tile = 4 m), merged building geometry, facade textures, sign atlas, ground texture, viaduct, trains, lamps, trees |
| `js/actors.js` | Procedural humans, particles and tracers, hitscan, damage, pickups |
| `js/ai.js` | Zombie, raider, ally and nest AI; population spawner |
| `js/vehicles.js` | Car models, arcade physics, lane AI, run-over, explosions |
| `js/shelter.js` | Build system, turrets, traps, UV lights, waves |
| `js/data.js` | Characters, portraits, weapons, story, contracts |
| `js/main.js` | Renderer and bloom, camera, player, missions, UI, audio, save, `window.NS3` capture API |
