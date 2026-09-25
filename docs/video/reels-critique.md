# Reel critique: "It said FREE. We measured." (30 s storyboard)

Reviewed: `docs/video/reels.html` (12 shots, SHOTS array), `theater.js`, `SERIES.md`. All 12 frames plus the 3 hook alternatives were rendered at 540×960 with Playwright and viewed one by one. Google Fonts did not load, so the fallback sans is a little wider than Gaegu. Width problems noted below are borderline and may shrink with Gaegu, but they are still worth fixing.

## Verdict in one paragraph

It is bright, clean and on-brand, and the chalkboard reveal (R11) is a strong payoff. But the hook opens on the wrong payoff: it shows RISK 72, while the headline says "FREE" and the real contradiction is cost. The hamster is missing from the first second. The Kanban board, meant to be the show's mission control, appears in only 2 of 12 frames, and one of those is ghosted at 55% opacity. The idea falls apart at "harness": R08's reins-and-bells metaphor plus feedforward/feedback jargon will lose a Korean non-developer. Four Korean lines break the 16-character rule. The ending is overcrowded.

## Scores

| # | Criterion | Score | Justification |
|---|---|---|---|
| 1 | Hook (0–3 s) | **5/10** | It is payoff-first in form, but the payoff shown (RISK 72) doesn't answer the headline "FREE". There's no hamster or board in second 1, and the viewer must read 3 headlines and 3 subtitles in 3 s. |
| 2 | Pacing and visual change | **7/10** | Three 1 s micro-shots meet the 3-in-3 rule, and every later shot is 2.5–3.5 s. But R06–R10 are five static tableaux on the same curtain stage, so the rhythm flattens mid-video. |
| 3 | Clarity (ontology + harness) | **4/10** | "Ontology = name tags on every card" (R07) lands. "Harness" (R08) is two abstract metaphors plus jargon. The gate (R09) and sandbox (R10) are never labeled as parts of the harness, so the viewer can't assemble the concept. |
| 4 | Kanban multi-agent centrality | **3/10** | The board appears only in R03 (ghosted, behind a glyph) and R05. R06, R07, R08 and R10 show cards floating in space. Agents never visibly move a card between columns. |
| 5 | Hamster appeal and "hip" factor | **6/10** | The character design is good (shades, backwards cap, 10X chain, hoodie). But he is absent in R01 and R04–R07, tiny in R08 (scale 0.52), unreadable doing finger-guns in R09, and his hoodie turns pink in R12. |
| 6 | English VO | **5/10** | 62 words in 30 s averages 2.1 wps, which is fine, but R02 ("Risk score: seventy-two") is about 4 wps in 1 s. The lines read like slide titles ("Harness: reins guide. Bells catch."), and the jokes are on screen only, never in the voice. |
| 7 | Korean subtitles | **6/10** | Mostly native 반말/음슴체 with good ~햄 restraint (2×). But R04 (17), R05 (17), R08 (18) and R12 (21) exceed 16 characters. R08 is incomprehensible. R11 highlights 0원 against EN *free*, a token mismatch. The key terms 온톨로지 and 하네스 are not highlighted. R05's "에이전트들이" is translationese. |
| 8 | Composition | **6/10** | Bright, legible and uncluttered in R02, R04, R07 and R11. Subtitle strips run to x 488–497 on R04, R06, R07, R08 and R10, into the icon column (the safe limit is 480). R08 and R12 are crowded, while R09 and R10 have dead empty middles. The curtains eat about 80 px on each side. |
| 9 | Fun and uniqueness | **6/10** | Good seeds: "trust me bro", the rewind, the P(doom) pump homage, the hamster wheel, and paw prints on the glass. But the gags are small on-screen text ("pew pew", "tap tap", "thud") instead of big staged beats, and there is no deadpan hamster reaction on the reveal. |
| 10 | Loop and ending | **7/10** | "Paste the next…" → "It said FREE." plus the Hype Box re-entering from the right is a smart loop. It is undercut by R12 clutter (11 elements), and the Korean "다음 글 ㄱㄱ" → "공짜라며?" only half-connects. |

**Overall (weighted: hook ×2, clarity ×1.5, Korean ×1.5, others ×1):**
(5×2 + 7 + 4×1.5 + 3 + 6 + 5 + 6×1.5 + 6 + 6 + 7) / 12 = 65 / 12 = **5.4 / 10 — Grade C**

Solid craft, weak argument. It is watchable, but a non-developer will leave remembering "a hamster and a red number", not "ontology + harness on an agent Kanban".

### Numeric checks

| Shot | dur | EN words | wps | EN chars | KO chars (incl. spaces) | Strip right edge (px, limit 480) |
|---|---|---|---|---|---|---|
| R01 | 1.0 | 3 | 3.0 | 13 | 5 | 368 |
| R02 | 1.0 | 3 (≈5 spoken) | **4–5** | 15 | 11 | 380 |
| R03 | 1.0 | 2 | 2.0 | 13 | 7 | 371 |
| R04 | 2.5 | 7 | 2.8 | 34 | **17** | **488** |
| R05 | 3.0 | 7 | 2.3 | 33 | **17** | 482 |
| R06 | 2.5 | 6 | 2.4 | 35 | 16 | **497** |
| R07 | 3.0 | 6 | 2.0 | 35 | 15 | **497** |
| R08 | 3.0 | 5 | 1.7 | 34 | **18** | **494** |
| R09 | 3.0 | 7 | 2.3 | 33 | 14 | 482 |
| R10 | 3.0 | 7 | 2.3 | 35 | 16 | **494** |
| R11 | 3.5 | 4 (≈6 spoken) | 1.7 | 31 | 16 | 478 |
| R12 | 3.5 | 5 (≈7 spoken) | 2.0 | 30 | **21** | 474 |

Doc inconsistencies:
- `SERIES.md` says the Reel is "this one: 45 s", but the storyboard is 30 s.
- The SHOTS comment says EN ≤ 33 characters, while the page's notes say ≤ 36. Five lines break the 33 limit.
- The "Korean subtitle style" panel says every line is ≤ 16 characters. Four are not.

## Per-shot table

| id | score | Main problem | Concrete fix |
|---|---|---|---|
| R01 | 5 | The payoff shown (RISK 72 on a card) doesn't answer "FREE". There's no hamster or board, and the headline duplicates the subtitle word for word. | Remake (see REMAKE #2). Show a deadpan hamster holding a "~~FREE~~ → $0.40" sign in front of the Kanban board. One-word hook "FREE?". EN/KO unchanged: "It said *FREE*." / "*공짜*라며?". 1.0 s. |
| R02 | 4 | It repeats R01's "72", and the VO is unspeakable in 1 s. | Remake (see REMAKE #2). The agent squad sprints across the board: "We measured." / "직접 재봤햄". 1.0 s. Move the RISK meter to R09. |
| R03 | 5 | The REWIND headline, the ◀◀ glyph and the subtitle all say the same thing. The board is ghosted and noisy. The "−0:27" timecode is meaningless. | Drop the `hook()` headline and keep the glyph. Draw the board at full opacity with cards on reverse arcs. EN "Rewind." / KO "처음부터 까봄" (keep). Delete the timecode. 1.0 s. |
| R04 | 7 | Clear and funny ("trust me bro"), but the VO is slide-speak at 2.8 wps, the KO is 17 characters, and the bubble tail is a 120 px spike. | EN "*Free*. 5 min. 1 prompt. Sure." (deadpan "Sure." is the joke). KO "*공짜*에 5분 컷이래" (10). Shorten the bubble tail to `[394, 520]`. 2.5 s. |
| R05 | 7 | The best board frame, but agents stand below an empty board instead of acting on it. KO is 17 characters, and "에이전트들이 나눠 감" is translationese. | KO "붙여넣자 *에이전트* 팀 출동" (14). Aim the three arrows up into the Decomposed and Verifying columns, not down at the floor. Put a card in each catcher's target column (`kb(..., [[{t:'post',k:'amber'}],[{t:'cut'},{t:'check'}],[],[]])`). 3.0 s. |
| R06 | 6 | Nice gray gap cards, but they float in space instead of sitting in the Decomposed column. | Draw `kb(60,130,420,380, [[5 cards incl. 2 gap],[],[],[]], {hl:0, cardH:34})` with the same 5 cards inside column 1, and Decompose and Gap-fill beside it. Keep "+2 skipped steps". KO keep. EN "Cut into cards. Fill the gaps." (30). 2.5 s. |
| R07 | 7 | The clearest concept frame, but "objects · links · actions" is Palantir jargon and there's no board. Key terms aren't highlighted. | Delete the mono jargon line. Behind the card, draw a ghosted board at 0.5 opacity so the card visibly "lifts out" of a column. EN "*Ontology*: every card gets tags." KO "*온톨로지* = 카드마다 이름표". 3.0 s. |
| R08 | 3 | The weakest shot. Reins + bells + feedforward/feedback + LLM judge + tools_allowed (clipped by the scroll) in 3 s. The hamster is tiny, and KO is 18 characters and meaningless (고삐로 끌고 종으로 잡음). | Remake as two 2.0 s shots, R08a + R08b (see REMAKE #1). 4.0 s total. |
| R09 | 5 | The red card is hidden behind the barrier. "HUMAN ONLY" and "pew pew" float unanchored. Finger-guns are unreadable, and the middle is empty. | Remake (see REMAKE #5). The meter and the gate share the frame. The card is pinned above the barrier. The hamster raises the stamp. 3.0 s. |
| R10 | 4 | No numbers. The seed reads as a black leaf, "time" and "cost" are bare labels, there's no board, and "own git worktree" is jargon. | Remake (see REMAKE #3). The board sits on top, with a card dropping into the sandbox, a coin and stopwatch with rolling counters, and no Repair. 3.0 s. |
| R11 | 8 | The strong payoff. The KO highlight token mismatches (0원 vs *free*), the seed floats on the curtain edge, and 3.5 s is long for a second showing of this payoff. | KO "*공짜*라며? 실측 *$0.40*" (14), which calls back R01. Delete `seed(440,480,.6)`. Add a 4-frame deadpan hamster blink before the glasses go up. 3.5 → 3.0 s. |
| R12 | 5 | 11 elements (loop icon, JSON, CLI, package, deploy, Hype Box, mic, thud, tap tap, 2 paws, confetti). KO is 21 characters, the hoodie turns pink, and "thud" is hidden behind the hamster. | Remake (see REMAKE #4). The board flips to Verified, then the SKILL.md package, the mic drop and the Hype Box barging in. KO loops into "공짜라며?". 3.5 → 3.0 s. |

## REMAKE LIST (ranked)

New running order (total **30.0 s**):
R01 1.0 · R02 1.0 · R03 1.0 · R04 2.5 · R05 3.0 · R06 2.5 · R07 3.0 · **R08a 2.0 · R08b 2.0** · R09 3.0 · R10 3.0 · R11 3.0 · R12 3.0 = 30.0

Local helpers referenced below already exist in `reels.html`: `kb`, `hook`, `pill`, `rubber`, `stampMark`, `scrollProp`, `scaleAt`, `paw`, `hype`, `sparkles`, `rays`. Numbers on screen stay marked as placeholders.

### 1. R08 → R08a + R08b: make "harness" graspable (the clarity killer)

Why: "Harness" is half the thesis. A seatbelt is a metaphor every Korean understands, and 하네스 is literally the climbing or dog harness. After that, one shot shows what the belt does in plain words. The board stays on screen in both shots.

**R08a**, dur **2.0**
- en: `*Harness* = seatbelts for agents.` (31 visible characters, 5 words, 2.5 wps)
- ko: `*하네스* = AI 안전벨트` (13)
- hook: `hook(['HARNESS'], { y: 164, z: 56, f: '#7fdcb5' })`
- draw:
  - `kb(60, 210, 420, 200, [[{t:'post',k:'amber'}],[{t:'step'}],[{t:'key',k:'risk'}],[{t:'ok',k:'ok'}]])`
  - `Th.agent('decompose', 140, FY, 70, { harness: true, mood: 'cool' })`, `Th.agent('verify', 270, FY, 70, { harness: true, mood: 'alert' })`, `Th.agent('runner', 400, FY, 70, { harness: true, mood: 'happy' })`
  - One sagging strap joining the three belt buckles: `G('<path d="M105,648 Q270,676 435,648" fill="none" stroke="#6b3f22" stroke-width="7" stroke-linecap="round"/>')`
  - `Th.burst(270, 470, 42, 'CLICK!', { fill: '#ffd23f', z: 20, r: -8 })`
  - `Th.doc(270, 470, .55, { m: 'grin', ra: [40, -60] })` perched on the board's bottom edge, tugging the strap (the Blender pose is "yank").
- Sound: three seatbelt clicks on the beat.

**R08b**, dur **2.0**
- en: `Rules steer. Tests catch. *DING!*` (31)
- ko: `규칙이 끌고 *테스트*가 잡음` (14)
- no hook
- draw:
  - `kb(90, 140, 360, 230, [[{t:'post',k:'amber'}],[{t:'step'},{t:'step'}],[],[{t:'ok',k:'ok'}]], { hl: 1 })`
  - Left, GUIDES in plain words: `scrollProp(90, 420, 130, 84, [['RULES', 24], ['1 card', 18], ['at a time', 18]])`, then `Th.arrow(155, 415, 170, 372, { c: '#b07a10' })` up into the board, then `Th.doc(150, FY, .75, { m: 'grin', ra: [36, -110] })` pointing at the scroll.
  - Right, SENSORS: `Th.sign(375, 440, 110, ['TESTS'], { z: 22, fill: '#d9f4ee' })`, `Th.fence(305, 450, FY)`, and a red card bouncing off the fence: `G('<g transform="rotate(-18 370 560)">' + Th.card(320, 540, 100, 34, 'bug', { kind: 'risk', small: true }) + '</g>')` with `Th.motion(430, 540, 3, 30, 1)`.
  - `T(390, 612, 'DING!', 34, { f: '#e5533f', stroke: '#fff', sw: 5, r: -8 })`
- Drop from the old R08: feedforward/feedback, LLM judge, tools_allowed, the wheel. Move the hamster wheel to the long-form video.

### 2. R01 + R02: payoff-first means the *cost* payoff, with the hamster and the board

Why: the headline promises a verdict on "FREE". Show the verdict ($0.40) and the character at frame 1, and the agent squad at second 2. That is the reason to stay: *how did a hamster and a robot team measure this?* RISK 72 moves to R09, where it belongs.

**R01**, dur **1.0**
- en: `It said *FREE*.` · ko: `*공짜*라며?` (unchanged, already strong)
- hook: `hook(['FREE?'], { y: 176, z: 88 })`. Use one word so the viewer reads one word.
- st: `{ floorY: 640, bg: rays('#ff5a4a', .22, 270, 520) }`
- draw:
  - `kb(60, 250, 420, 190, [[{t:'viral post',k:'amber'}],[{t:'step'}],[{t:'API key',k:'risk',b:'72'}],[{t:'step',k:'ok'}]], { hl: 2 })`, the home set from frame 1.
  - `Th.doc(340, FY, 1.3, { m: 'flat', la: [-70, -120] })`: a big, deadpan hamster.
  - A held sign: `Th.sign(170, 450, 170, ['FREE', '$0.40'], { z: 40, z2: 44, f2: '#e5533f', fill: '#fffdf5', stick: Th.hand(340, FY, 1.3, [-70, -120]) })`, plus a strike-through `G('<line x1="112" y1="480" x2="228" y2="488" stroke="#e5533f" stroke-width="6" stroke-linecap="round"/>')`. $0.40 is a placeholder.
  - `sparkles([[430, 250, 12, '#ffd23f'], [110, 250, 9, '#fff']])`
- Sound: the R12 mic thud lands here as the loop point, then the beat drops.

**R02**, dur **1.0**
- en: `We measured.` (2 words) · ko: `직접 재봤햄` (6; ~햄 #1)
- no hook
- st: `{ floorY: 640, spots: [270] }`
- draw:
  - `kb(50, 130, 440, 260, [[{t:'post',k:'amber'}],[{t:'step'},{t:'step'}],[{t:'API key',k:'risk',b:'72'}],[{t:'step',k:'ok'},{t:'step',k:'ok'}]])`
  - Four agents in a running line: `Th.agent('decompose', 110, FY, 62, { carry: 'cut', noLabel: true })`, `Th.agent('verify', 215, FY, 62, { carry: '72', carryKind: 'risk', noLabel: true })`, `Th.agent('runner', 320, FY, 62, { carry: 'ok', carryKind: 'ok', noLabel: true })`, `Th.agent('deploy', 425, FY, 62, { noLabel: true })`
  - `Th.motion(x - 45, 610, 3, 30, -1)` behind each agent.
  - `scaleAt(Th.stopwatch(400, 450), 400, 450, 1.5)` mid-sweep.
- R03 (kept) then rewinds. Three different frames in three seconds: hamster verdict, then agent squad, then ◀◀.

### 3. R10: sandbox on the board, with numbers ticking

Why: "Timed" with no time on screen is a broken promise. The seed reads as a black leaf, and the board is missing.

- **R10**, dur **3.0**
- en: `Safe cards run sandboxed. Timed.` (32) · ko: `안전한 건 *샌드박스*서 돌렸햄` (15; ~햄 #2)
- no hook
- draw:
  - `kb(60, 130, 420, 170, [[],[{t:'step 3'}],[{t:'key',k:'risk',b:'hold'}],[{t:'step 1',k:'ok'},{t:'step 2',k:'ok'}]], { hl: 3, cardH: 26 })`
  - `Th.arrow(200, 300, 225, 540, { c: '#2fbf8a' })`: the Verifying card drops into the tray.
  - `Th.sandbox(270, FY, 400)` plus a glass lid `G('<rect x="95" y="585" width="350" height="10" rx="5" fill="#dff3ff" fill-opacity=".7" stroke="' + INK + '" stroke-width="2.5"/>')`
  - `Th.agent('runner', 230, 652, 72, { carry: 'step 3', carryKind: 'ok' })` + `Th.motion(180, 590, 3, 48, -1)`
  - Cost: `scaleAt(Th.coin(140, 420), 140, 420, 1.8)` + `pill(140, 490, '$0.1…', '#fffdf5')`
  - Time: `scaleAt(Th.stopwatch(400, 420), 400, 420, 1.8)` + `pill(400, 490, '0:07…', '#fffdf5')`
  - Rolling counters (placeholder) that don't spoil R11.
  - `pill(270, 350, 'own sandbox ✓', '#b8f0d6')`
- Cut: Repair, the seed, the hanging SANDBOX sign, and the "own git worktree" text (move it to the description).

### 4. R12: declutter the ending and make the Korean loop too

Why: 11 elements fight in the final 3 s, the KO line is 21 characters, and the costume changes color.

- **R12**, dur **3.0**
- en: `Ship *SKILL.md*. Next *free* post?` (32) → flows into "It said *FREE*."
- ko: `다음 *공짜* 글, 재볼까?` (13) → flows into "*공짜*라며?"
- hook: `hook(['NEXT POST?'], { y: 170, z: 58 }) + paw(118, 330, 1.8, -12)` (one paw only, for the fourth-wall glass tap)
- draw:
  - `kb(60, 230, 420, 190, [[],[],[{t:'API key',k:'risk',b:'hold'}],[{t:'step 1',k:'ok'},{t:'step 2',k:'ok'},{t:'SKILL.md',k:'ok'}]], { hl: 3 })`: the board has flipped to Verified.
  - `Th.pkg(170, 600, 90, 'SKILL.md')` + `Th.agent('deploy', 250, FY, 50, { mood: 'star', noLabel: true })`
  - `Th.doc(340, FY, 1.1, { m: 'grin', ra: [50, -40] })` in the default purple hoodie (delete `hoodie: '#f062a8'`).
  - A falling mic below the right paw at (400, 610), rotated 35°. Move `T(430, 560, 'thud', 22, { f: INK, r: -12 })` so it isn't hidden.
  - `hype(470, FY, 70, { carry: 'FREE!!', carryKind: 'amber' })` half off-frame right, with `Th.motion(510, 570, 3, 30, 1)`. It barges in as the loop cue into R01's "FREE?".
  - `Th.confetti(12, 33, [90, 190, 450, 300])`
- Cut: loopIcon, the JSON and CLI pills (put them in the caption), "tap tap", the second paw.

### 5. R09: the gate plus the meter, so the rule is visible

Why: the viewer currently can't see the card being held, and the 70 threshold is only written text. Moving the meter here gives "70" a visual. It also frees the hook from explaining risk.

- **R09**, dur **3.0**
- en: `Over *70*? It waits for a human.` (30) · ko: `*70점* 넘으면 사람 도장 필수` (16)
- hook: `hook(['GATE'], { y: 164, z: 58, f: '#ff6b57' })`
- draw:
  - `kb(60, 200, 420, 140, [[],[{t:'step'}],[{t:'API key',k:'risk',b:'72'}],[{t:'step',k:'ok'}]], { hl: 2, cardH: 26 })`
  - `Th.meter(120, 420, 72, { H: 120 })` on the left, redlined past the dashed 70.
  - `Th.gate(200, FY, false, 230)` (barrier at y 568, x 200–430).
  - The card pinned *above* the barrier: `G('<g transform="rotate(-6 335 510)">' + Th.card(250, 488, 170, 46, 'API key', { kind: 'risk', badge: 'RISK 72', z: 20, small: true }) + '</g>')`
  - `Th.box(330, FY, 80, Object.assign({}, Th.PAL.red, { mood: 'worried', arms: 'down' }))` stuck behind the barrier.
  - `Th.doc(420, FY, .9, { m: 'flat', ra: [30, -130] })`, then `rubber(...Th.hand(420, FY, .9, [30, -130]), 'OK?')`: the stamp raised, not yet down.
  - `stampMark(330, 400, 'HUMAN ONLY', -10)`
- Cut: "pew pew", the finger-gun rectangles, the hanging sign.
- Optional: put a small corner `pill(420, 130, 'HARNESS ③', '#d9f4ee')` here and `'HARNESS ④'` on R10, so the gate and sandbox are visibly part of the harness from R08a/b.

## Minor fixes

- Keep every EN subtitle at 33 visible characters or fewer so the strip stays at x ≤ 480, clear of the icon column.
- ~햄 count after the remake: R02 "재봤햄" and R10 "돌렸햄". That's 2, within the 2–4 rule.
- Highlight pairs after the remake: FREE/공짜 (R01, R04, R11, R12), 72 (R09 card), 70/70점 (R09), $0.40 (R11), SKILL.md (EN R12 only; the KO loop line uses 공짜 instead), 하네스/Harness (R08a), 온톨로지/Ontology (R07), 테스트 (R08b), 샌드박스 (R10).
- Fix `SERIES.md` "this one: 45 s" to 30 s, and align the SHOTS comment (≤33) with the notes panel (≤36).
