# 한반도 대전략 (Korean Peninsula Grand Strategy)

A turn-based strategy game in the style of Civilization. It assumes a war has broken out and plays it out across Northeast Asia, centered on the Korean Peninsula. It is a standalone browser game with no build step and no server.

## Run

Open `index.html` in a browser. You can also serve the folder:

```bash
npx serve games/korea-war-sim   # or: python3 -m http.server -d games/korea-war-sim
```

## What's in it

- **Map**: 54 × 43 hex grid (one hex ≈ 54 km) generated from simplified coastlines, the Military Demarcation Line, and major mountain ranges (Taebaek, Sobaek, Nangnim, Sikhote-Alin, the Japanese Alps and others). Terrain types are plains, forest, hills and mountains.
- **Powers**: South Korea, North Korea, China, Japan and Russia are playable. The US is an AI-only offshore power that reinforces through allied bases and withdraws when war weariness gets too high.
- **Cities**: 63 real cities with population, industry, ports, capitals and US bases. Territory follows city control, and occupied land is hatched.
- **Units**: infantry, mechanized infantry, armor, artillery, air defense, special forces, fighter wings, drones, destroyers and submarines, drawn with NATO-style symbols. One land unit per hex, zones of control, amphibious embarkation, veterancy, entrenchment and flanking.
- **Combat**: damage depends on the strength ratio, modified by HP, terrain, fortification, supply, fuel, morale (stability) and tech. Artillery and ships fire at range. Air strikes face AA, SAM and fighter interception. Submarines are stealthy.
- **Economy**: budget, manpower and fuel each month. Port blockades cut income and oil imports. A research slider controls tech spending, and cities can build forts, factories and SAM networks.
- **Missiles**: ballistic strikes launched from your cities. Interception odds come from missile-defense tech, SAM networks, AA brigades and Aegis destroyers.
- **Tech**: 14 technologies across five branches (army, air force, navy, missiles, economy).
- **Diplomacy**: war and peace, alliances with defensive calls to arms, aid, relation spending and cyber attacks. The AI offers peace or alliances when it wants them.
- **Stability and surrender**: war weariness, lost cities, blockades and fuel shortages lower stability. Losing the capital while stability is low forces a surrender. If South or North Korea surrenders to the other, the winner absorbs the whole peninsula (unification).
- **Scenarios**: *2027 한반도 위기* (a North Korean invasion; China intervenes if the North collapses), *동북아 블록 대전* (Korea, the US and Japan against North Korea, China and Russia), and *고립무원* (every nation for itself with no US).
- **Victory**: unify the peninsula (as South or North Korea), hold half of all cities, force every enemy to surrender, or have the highest score when the turn limit is reached.

The game autosaves to `localStorage` every turn.

## Code

| File | Role |
|---|---|
| `js/data.js` | Geography, nations, units, techs, scenarios, events |
| `js/engine.js` | World generation, movement, combat, economy, diplomacy, victory |
| `js/ai.js` | Computer players: recruiting, missiles, diplomacy, and operational moves using distance maps |
| `js/ui.js` | Canvas renderer, input (mouse, touch, keyboard), panels, turn flow |
