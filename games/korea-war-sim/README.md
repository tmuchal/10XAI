# 한반도 대전략 (Korean Peninsula Grand Strategy)

A turn-based world strategy game in the style of Civilization. It assumes a war has broken out. You become the absolute ruler of one country and fight the rest of the world, using real weapon systems, domestic politics and nuclear weapons. It is a standalone browser game with no build step and no server.

## Run

Open `index.html` in a browser. You can also serve the folder:

```bash
python3 -m http.server -d games/korea-war-sim   # then open http://localhost:8000
```

## What's in it

- **World map**: a 360 × 203 hex grid covering the whole world. Each hex is 1° of longitude (about 89 km at Seoul's latitude). The map wraps east–west. Coastlines, inland seas, the Korean Military Demarcation Line, mountain ranges, deserts, jungles and tundra are generated from simplified geographic data.
- **Nations**: 25 playable major powers and about 85 minor states. Borders are seeded by 396 real cities plus border anchors, and territory follows city control. Occupied Ukrainian cities, Chinese outposts in the South China Sea, US bases (Pyeongtaek, Okinawa, Guam, Ramstein, Diego Garcia…) and the Falklands are included.
- **Dictator politics** (권력 tab):
  - Five power blocs (the military, the security services, the party/court/clergy, big business and the people), each with a loyalty score. How much each bloc matters depends on the regime: democracy, authoritarian, one-party, monarchy, theocracy or junta.
  - Stability converges on the weighted average of those loyalties.
  - 21 decrees: propaganda, a personality cult, martial law (which cancels elections), a lifetime rule amendment, purges, nationalization, mobilization, secret police, election rigging, a nuclear program and energy blackmail.
  - Crises: coups, uprisings, elections and assassination attempts. Losing one of these ends the game.
- **Cabinet and slush fund** (권력 tab): six ministers or generals, each with skill, loyalty, ambition and a trait (loyal, ambitious, corrupt, hawk, technocrat and others). The titles depend on the country, for example 총참모장 and 국가보위상 in North Korea or FSB 국장 in Russia. Their skill affects combat, espionage, unrest, income and diplomacy. Ambitious ministers plot, and you can reshuffle, purge or bribe them. You can embezzle from the budget into a foreign account, which lets you bribe factions and ministers and escape into exile when a coup comes, at the risk of a scandal.
- **Production**: carriers, SSBNs, destroyers, submarines, bombers and amphibious ships take 2–4 months to build. Older units can be refitted to the newest design. Attacks inside friendly artillery or MLRS range get +10% fire support.
- **Monthly briefing**: a report each turn covering the budget change, cities won and lost, threatened cities, regime risk and major world events. The 전황 tab has trend charts with hover values and a table view.
- **Weapons** (병기 tab):
  - About 220 real systems assigned per country, each with specs and a quality factor. Examples: K2 흑표, T-14, M1E3, F-35A, KF-21, J-20, Su-57, B-21, Type 055, Burke Flight III, KSS-III, Virginia, Ford-class carriers, THAAD, S-400 and Iron Dome.
  - 18 unit classes, including SSN, SSBN, carriers that hold 4 air wings, amphibious ships, long-range SAM/BMD, MLRS and marines.
  - About 50 missiles with real ranges in km, Mach numbers, evasion, nuclear yields and anti-ship variants. Examples: 현무-4/5, 화성-18, DF-17/21D/41, 이스칸데르, 킨잘, 사르마트, Trident II, Tomahawk, Dark Eagle, Agni-V and Fattah.
- **Nuclear war**: layered interception, detonation radius by yield, fallout, allied retaliation under extended deterrence, and AI doctrines (escalate-to-de-escalate for Russia, North Korea and Pakistan). A doomsday clock starts at 89 seconds. Reaching midnight means nuclear winter, and everyone loses.
- **World order**: reputation, sanctions (weighted by economy, doubled by the dollar), UN Security Council resolutions with P5 vetoes, and NATO Article 5 plus other alliance calls to arms. A grand coalition forms against a player who grows too strong.
  - Espionage: sabotage, tech theft, disinformation, assassination, coups and proxy uprisings.
  - Diplomacy: ultimatums that turn states into protectorates, arms-import deals and cyber attacks.
- **War**:
  - Combat factors: terrain, entrenchment, flanking, supply, fuel, morale, veterancy, AA/SAM/fighter interception and stealth.
  - Movement: rail at half cost inside friendly territory, plus strategic deployment by rail, sealift or airlift that takes several turns.
  - Seasons and ports: Russian winter attrition and port blockades.
- **National flavor**: 39 national traits (빨리빨리, 선군정치, 주체, 동장군, 평화헌법, 모사드, 아이언 돔, 오커스…) and country-specific events such as the Wagner-style mutiny, 촛불, Yasukuni, OPEC+, TSMC and hijab protests.
- **Scenarios**: 독재자의 길 (sandbox), 2027 한반도 위기, 제3차 세계대전 and 세계를 적으로 (everyone against you).
- **Victory**: unify Korea (as South or North Korea), control 35% of the world's cities, take every great power's capital, win your wars, or have the top score when the turn limit is reached. After a victory you can keep ruling.

- **Mobile-game UI**:
  - The map fills the screen, with resource pills on top and a six-tab dock at the bottom (권력 · 경제 · 병기 · 연구 · 외교 · 전황).
  - Tapping a unit or city opens a context card with large action buttons. Tapping an enemy first shows an attack preview (odds, expected losses) and needs a confirm tap.
  - Menus open as a draggable bottom sheet on phones and as a right-hand drawer on desktop.
  - Floating buttons handle next idle unit and end turn.
  - Long-press shows a tile tooltip.
  - A three-step start flow (scenario, nation, leader) is followed by a one-time tutorial.

The game autosaves to `localStorage` every turn.

## Advisor dialogue (집무실)

Decisions are presented as conversations in the leader's war office (`js/council.js`) rather than plain pop-ups.

- **Scenes.** Coups, uprisings, elections, assassination attempts, cabinet plots, slush-fund scandals, national events, peace or alliance offers and the monthly briefing each open a visual-novel scene. The scene has a painted office backdrop, the portrait of the minister who would bring the news, and a dialogue box with a name plate and typewriter text. Tap to advance. The choices then appear as large stacked buttons with the same effect previews as before, marked with which advisor recommended each one. Every rule and number is unchanged: the scene returns the same choice index the old modal did.
- **Who speaks.** The reporting minister depends on the situation:
  - Coup: intelligence chief, then the chief of staff and the defence minister.
  - Uprising: interior minister.
  - Election: interior, then foreign and intelligence.
  - Plot: intelligence chief, or interior if the plotter is the intelligence chief.
  - Scandal: foreign minister, and the economy minister pleads his own case.
  - Offers: foreign minister.
  - National events: each event maps to a post, for example 국채 → economy and 촛불 → interior.

  The advisor who most disagrees then argues back. Each minister's lines follow his trait (a hawk urges force, a technocrat quotes the budget, a corrupt minister hints at side deals, an ambitious one is suspiciously agreeable) and his loyalty. A disloyal minister turns curt or sarcastic, and a plotting intelligence chief under-reports the plots.
- **Briefing.** The briefing is a three-voice exchange: the finance minister reports the budget, the military chief reports the front and the intelligence chief reports threats. The full report stays one tap away (보고서), and the trend charts remain in the 전황 tab.
- **Fast play.** Use **넘기기 ▸▸** or Esc to skip straight to the choices. Tapping while text is typing completes the line. The number keys 1–9 pick a choice. **간단히** in a scene, or the menu setting 결정 연출, switches back to the old compact modal. The menu setting 대사 표시 turns off the typewriter. Reduced-motion users get instant text.
- **Talking to advisors.** The 참모와 대화 button (권력 tab, and inside any scene) opens a free conversation with any minister.
  - When the artifact runtime grants Claude sampling, you can type freely. The minister answers in character, grounded in a compact summary of the game state, and his last line carries a hidden emotion and loyalty tag. The tag changes his portrait and nudges his loyalty by at most ±3 per minister per month.
  - You get 5 messages per minister per month. The last 12 turns per minister are saved in `G.advisor`.
  - Without AI, each minister offers scripted questions answered from live game data: 전선 상황은?, 예산은?, 쿠데타 위험은?, 다음 목표는?, plus one question specific to his post.
- **Portraits** come from the shared `js/art.js` (`ART.portrait`). Each minister gets a deterministic look based on post, regime, culture and trait. A simple built-in silhouette is used if `ART` is missing.

## Code

| File | Role |
|---|---|
| `js/world.js` | Hex grid, coastlines, ridges and terrain regions, sea labels, border anchors |
| `js/nations.js` | Major and minor nations, traits, cities, starting forces |
| `js/weapons.js` | Unit classes, national designs, missiles, tech tree |
| `js/politics.js` | Regimes, factions, decrees, espionage ops, political and national events |
| `js/engine.js` | World generation, movement, combat, missiles and nukes, economy, politics, diplomacy, victory |
| `js/ai.js` | Computer players: bounded pathfinding, operations, deployment, missiles, nuclear doctrine |
| `js/ui.js` | Canvas renderer (tactical hexes and a political overview when zoomed out), input, panels, turn flow |
| `js/art.js` | Shared portrait/background painter (`ART`), copied from `games/story-sim` |
| `js/council.js` | War-office dialogue scenes, minister looks and lines, advisor chat (AI or scripted) |
