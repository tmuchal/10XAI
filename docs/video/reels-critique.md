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

---

# Round 2: re-score of the remade Reel (13 shots, with Uchu)

I re-rendered all 13 frames at 540×960 with Playwright and viewed each one. Every hard limit was checked in code against the live `REEL` data and the rendered subtitle rects. The runtime sums to **30.0 s**. The only console error is the blocked Google Fonts request, so the fallback font is in use and it is slightly wider than Gaegu.

## Hard-limit audit

| Shot | dur | EN (visible) | EN chars | KO | KO chars (incl. spaces) | Strip x (limit 30–480) | Strip y bottom (limit 765) | EN↔KO highlights |
|---|---|---|---|---|---|---|---|---|
| R01 | 1.0 | It said FREE. | 13 | \*공짜\*라며?! | 6 | 164–347 | 757 | FREE↔공짜 ✓ |
| R02 | 1.0 | We measured. | 12 | 직접 재봤햄 | 6 | 167–343 | 757 | none ✓ |
| R03 | 1.0 | Rewind. | 7 | 처음부터 까봄 | 7 | 172–338 | 757 | none ✓ |
| R04 | 2.5 | Free. 5 min. 1 prompt. Sure. | 28 | \*공짜\*에 5분 컷이래 | 10 | 85–425 | 757 | Free↔공짜 ✓ |
| R05 | 3.0 | Paste it in. The agents split it. | 33 | 붙여넣자 \*에이전트\* 팀 출동 | 14 | 59–451 | 757 | agents↔에이전트 ✓ |
| R06 | 2.5 | Cut into cards. Fill the gaps. | 30 | 카드로 쪼개고 빠진 단계 채움 | 16 (at limit) | 74–437 | 757 | none ✓ |
| R07 | 3.0 | Ontology: every card gets tags. | 31 | \*온톨로지\* = 카드마다 이름표 | 15 | 65–445 | 757 | Ontology↔온톨로지 ✓ |
| R08a | 2.0 | Harness = seatbelts for agents. | 31 | \*하네스\* = AI 안전벨트 | 13 | 65–445 | 757 | Harness↔하네스 ✓ |
| R08b | 2.0 | Rules steer. Tests catch. DING! | 31 | 규칙이 끌고 \*테스트\*가 잡음 | 14 | 65–445 | 757 | Tests↔테스트 ✓ |
| R09 | 3.0 | Over 70? It waits for a human. | 30 | \*70점\* 넘으면 사람 도장 필수 | 16 (at limit) | 76–434 | 757 | 70↔70점 ✓ |
| R10 | 3.0 | Safe cards run sandboxed. Timed. | 32 | 안전한 건 \*샌드박스\*서 돌렸햄 | 15 | 60–450 | 757 | sandboxed↔샌드박스 ✓ |
| R11 | 3.0 | Claimed: free. Measured: $0.40. | 31 | \*공짜\*라며? 실측 \*$0.40\* | 14 | 63–447 | 757 | free↔공짜, $0.40↔$0.40 ✓ |
| R12 | 3.0 | Ship SKILL.md. Next free post? | 30 | 다음 \*공짜\* 글, 재볼까? | 13 | 71–439 | 757 | **SKILL.md ↔ (missing) ✗**, free↔공짜 ✓ |

- **Korean characters:** 13/13 lines are 16 or fewer. Two sit exactly at 16.
- **Strips:** 13/13 are inside x 30–480 and above y 765. The subtitle is now centered at x 255 at 22/20 px, so it clears the icon column.
- **Highlights:** 12/13 match. R12 highlights *SKILL.md* in English but has no Korean counterpart.
- **~햄:** used 2× (R02 재봤햄, R10 돌렸햄), within the 2–4 rule. Register is consistent 반말/음슴체 throughout.
- **Speech rate:** no line goes over 2.5 words/s. The busiest are R04 (6 words in 2.5 s, split into four clipped sentences on purpose) and R08b (5 words in 2 s).

## Scorecard (old → new)

| # | Criterion | Old | New | One-line justification |
|---|---|---|---|---|
| 1 | Hook (0–3 s) | 5 | **8** | R01 now shows the cost payoff (~~FREE~~ → $0.40), with the hamster, Uchu's shock and the board, under a one-word headline. It loses points because R02's agents stand still (no lean, no bounce, no labels), so second 2 doesn't read as "measuring". |
| 2 | Pacing and visual change | 7 | **7** | 13 cuts with a shot change every 1–3 s. But 9 of 13 frames use the same template: board in the top half, cast in a row on the floor. That flattens things in 2D, and in Blender it only works if the camera moves vary. |
| 3 | Clarity (ontology + harness) | 4 | **7** | Tags = ontology lands. Harness = seatbelt is said out loud, and ②③④ tie the gate and sandbox to it. But R08a never *looks* like a seatbelt (it reads as a rope or leash), and there is no ①, so the numbering starts mid-count. |
| 4 | Kanban centrality | 3 | **8** | The board is in 12/13 frames. Cards visibly go up into columns (R05) and drop into the sandbox (R10), and the Verified column fills up by R12. Across shots it still mostly acts as a backdrop rather than the stage. |
| 5 | Hamster appeal and "hip" | 6 | **7** | The R01 deadpan, glasses pushed up in R11 and the mic drop in R12 all land. He is still tiny in R04 (about 0.55 scale) and floating in mid-air in R08a, and in R09 the rubber stamp covers his sunglasses and face. |
| 6 | English VO | 5 | **7** | Every line is speakable, and "Sure." and "DING!" add deadpan. It still leans on slide grammar ("Harness = …", "Ontology: …", "Claimed: … Measured: …"). |
| 7 | Korean subtitles | 6 | **8** | All within 16 characters, native tone, ~햄 used sparingly, and "5분 컷" and "사람 도장 필수" read like real Shorts captions. It loses a point for the R12 highlight mismatch and two lines sitting right at the limit. |
| 8 | Composition | 6 | **7** | Every strip is safe and bright. But the R05 PASTE! burst covers the "Decomposed" header and the "check" card, the R07 ghost board muddies the tags and leaves stray motion lines at (120–150, 315–340), "72" appears three times in R09, and the "at a time" line on the R08b scroll is cut off by the roller. |
| 9 | Fun and uniqueness | 6 | **7** | Uchu is a real foil, and it is a good running gag that he never learns (shocked in R01, shocked again in R11, grinning at the next FREE!! in R12). But he is missing from R04, the one beat that is literally "viewer falls for the post", and his shock pose is identical in R01 and R11. |
| 10 | Loop and ending | 7 | **8** | R12 (Uchu with FREE!!, the thud, "다음 공짜 글, 재볼까?") flows into R01 ("공짜라며?!", Uchu gasping). But Uchu jumps from the right side of the frame (x 412) to the left (x 140) across the cut, which breaks the seamless loop. |

**Overall (weighted: hook ×2, clarity ×1.5, Korean ×1.5, rest ×1):**
(8×2 + 7 + 7×1.5 + 8 + 7 + 7 + 8×1.5 + 7 + 7 + 8) / 12 = 89.5 / 12 = **7.5 / 10 — Grade B−** (up from 5.4, C)

The argument is now right. What's left is execution detail: one passive shot, one metaphor that isn't drawn, and three crowded frames.

Uchu is visually distinctive (red hood with antennae, a green face, fuzzy "uchu" lettering). Before the Blender build, confirm it is original IP and doesn't closely resemble an existing mascot.

## Per-shot table (old → new)

| id | old | new | Main problem (one line) | Concrete fix |
|---|---|---|---|---|
| R01 | 5 | **8** | The hamster's paw doesn't visibly grip the sign stick, and Uchu is on the left while R12 ends with him on the right. | Mirror the cast: `Th.uchu(400, FY, 1, {m:'shock', bang:true, flip:true, …})` and move the hamster to x 150 with the sign at x 290, so Uchu stays on the right across the loop cut. |
| R02 | 4 | **6** | The agents stand still. There's no motion, no labels, and the stopwatch floats alone. | See REMAKE #3. |
| R03 | 5 | **7** | Clean. The dizzy Hype Box on the right is leftover cast that the story no longer needs. | Replace `hype(385, …)` with `Th.uchu(390, FY, .8, {m:'squint'})` being pulled backwards, and add `Th.motion(440, 600, 3, 40, 1)`. That keeps Uchu on the right. |
| R04 | 7 | **7** | Uchu, the believer, is absent from the believer beat. The hamster is too small to sell "Sure." | See REMAKE #2. |
| R05 | 7 | **7** | The PASTE! burst covers the Decomposed header and the "check" card. `POST /api/ingest` is dev jargon to a Korean viewer. | Move the burst to `Th.burst(150, 300, 36, 'PASTE!', {…})` over the empty lower half of column 1, and delete the `/api/ingest` label (it's in the description). |
| R06 | 6 | **8** | Works. The confetti is random noise under the board. | Delete `Th.confetti(...)`. |
| R07 | 7 | **7** | The ghost board fights the tags, stray motion lines float at (120–150, 315–340), and the Router is tiny. | Drop the ghost board's opacity to .25 or blur it, delete the stray `Th.motion`, and scale Router to 80. |
| R08a | 3 (old R08) | **6** | The "seatbelt" is drawn as a rope. The hamster floats in mid-air at y 470. CLICK! is detached from any buckle. There's no HARNESS ①. | See REMAKE #1. |
| R08b | — | **7** | Clear, but the "at a time" line is cut off by the scroll roller, the rule arrow is tiny, and DING! sits on top of the fence rails. | `scrollProp(90, 412, 140, 96, …)`, arrow `Th.arrow(160, 408, 175, 382, {c:'#b07a10', w:6})`, DING at `T(400, 520, …)`. |
| R09 | 5 | **6** | The rubber stamp covers the hamster's face. "72" appears three times (board, badge, bulb). There are 9 text items. | See REMAKE #4. |
| R10 | 4 | **8** | Clean and legible, and the rolling counters work. The runner's card overlaps the glass lid. | Lift the carried card by using `carry` at scale 64, or draw the lid before the agent. |
| R11 | 8 | **8** | Strong reveal. Uchu's shock is a copy of R01. | Give Uchu `m:'squint'` plus `sweat:true` (a "wait… really?" beat) so his arc is shocked → doubtful → back to believing in R12. |
| R12 | 5 | **7** | The KO line lacks the SKILL.md highlight, the paw print reads as a mark *on the board*, not on the glass, and Uchu's side conflicts with R01. | See REMAKE #5. |

## REMAKE LIST (Round 2)

Durations are unchanged: R01 1 · R02 1 · R03 1 · R04 2.5 · R05 3 · R06 2.5 · R07 3 · R08a 2 · R08b 2 · R09 3 · R10 3 · R11 3 · R12 3 = **30.0 s**.

### 1. R08a: draw the seatbelt, ground the hamster (clarity ×1.5)
- en: `*Harness* = seatbelts for agents.` (keep) · ko: `*하네스* = AI 안전벨트` (keep, 13) · dur **2.0**
- draw:
  - Keep `kb(60, 210, 420, 200, …)`.
  - Delete both rope paths and the floating `Th.doc(270, 470, …)`.
  - For each agent at x ∈ {140, 270, 400} (s 70, body y 611–657), add a diagonal seatbelt:
    `G('<path d="M'+(x-30)+',613 L'+(x+30)+',655" stroke="#6b3f22" stroke-width="9" stroke-linecap="round"/><rect x="'+(x-8)+'" y="628" width="16" height="12" rx="3" fill="#ffd23f" stroke="'+INK+'" stroke-width="2.5"/>')`
  - Hamster perched *on* the board's top edge: `Th.doc(440, 212, .5, { m: 'grin', la: [-40, -70] })` + `Th.arrow(420, 225, 290, 600, { c: '#6b3f22' })` (he "pulls" the buckle).
  - `Th.burst(270, 572, 34, 'CLICK!', { fill: '#ffd23f', z: 16, r: -8 })` on the middle buckle.
  - `pill(400, 432, 'HARNESS ①', '#d9f4ee')`, so ②③④ have a start.

### 2. R04: put Uchu in the believer beat
- en: `*Free*. 5 min. 1 prompt. Sure.` (keep) · ko: `*공짜*에 5분 컷이래` (keep, 10) · dur **2.5**
- draw:
  - Phone moves up 30 px: `Th.phone(96, 206, 230, 340, inner)`.
  - Delete `hype(...)` and the boop bubble. The post itself is the Hype.
  - `Th.uchu(400, FY, .85, { m: 'grin', la: [-40, -110], ra: [40, -110] })`, both mittens up and cheering.
  - `Th.bubble(400, 440, 110, ['공짜!!'], [400, 520], { z: 26 })`
  - Hamster larger and deadpan: `Th.doc(215, FY, .75, { m: 'flat' })`, then `T(282, 578, 'sure.', 26, { f: '#6b4a36', r: -8 })`.

### 3. R02: make the squad *run*
- en: `We measured.` · ko: `직접 재봤햄` (keep) · dur **1.0**
- draw:
  - Keep the board.
  - For agent i at x ∈ {110, 215, 320, 425}: `Th.agent(r, x, FY - (i % 2) * 16, 62, { noLabel: true, mood: 'happy', rot: -12, … })` with `Th.motion(x - 40, 598 - (i % 2) * 16, 3, 55, -1)`. The lean and bounce read as sprinting.
  - Move the stopwatch to the middle of the gap: `scaleAt(Th.stopwatch(270, 470), 270, 470, 1.8)`, plus `pill(270, 530, '0:00…', '#fffdf5')`.
  - `Th.arrow(150, 580, 430, 580, { c: '#2fbf8a' })` across the floor as a direction cue.

### 4. R09: unmask the hamster and cut the 72s
- en/ko keep (`Over *70*? It waits for a human.` / `*70점* 넘으면 사람 도장 필수`, 16) · dur **3.0**
- draw:
  - Hamster raises the stamp *overhead*: `Th.doc(420, FY, .9, { m: 'flat', la: [-20, -190] })`, then `rubber(...Th.hand(420, FY, .9, [-20, -190]), 'OK?')`. The stamp sits at about y 440–510, above the head.
  - Pinned card with no badge, shortened so it clears the stamp: `Th.card(212, 488, 150, 46, 'API key', { kind: 'risk', z: 20, small: true })`. 72 now lives on the meter bulb and the board card only.
  - `stampMark(250, 420, 'HUMAN ONLY', -10)`
  - Keep the meter, gate, red box and `HARNESS ③`.

### 5. R12: finish the loop
- en: `Ship SKILL.md. Next *free* post?`. Remove the asterisks from SKILL.md. SKILL.md stays on screen (package and Verified card), but only *free* is highlighted.
- ko: `다음 *공짜* 글, 재볼까?` (keep, 13). Highlights now match (free↔공짜).
- Why not add SKILL.md to the Korean line: every variant that carries both tokens runs over 16 characters. For example, `*SKILL.md* 완성. 다음 *공짜*?` is 19. The 공짜 token matters more because it drives the loop into "공짜라며?!".
- dur **3.0**
- draw:
  - Put the paw on the glass, not the board: move `paw(118, 330, 1.8, -12)` to `paw(150, 470, 2.2, -12)` so it sits over the stage and hamster zone, below the board and in front of everything. Add a white smudge: `<ellipse cx="150" cy="485" rx="46" ry="30" fill="#fff" opacity=".35"/>`.
  - Uchu stays at x 412 (the right side). With REMAKE R01's mirror fix, he is on the right in both frames, so the cut is seamless.

---

# Round 3: re-score after the Round 2 fixes

I re-rendered all 13 frames at 540×960 and viewed each one. Hard limits were checked in code against the raw `SHOTS` strings and the rendered subtitle rects. Fonts fell back again because Google Fonts was blocked, so the fallback is slightly wider than Gaegu.

## Hard-limit audit

| Check | Result |
|---|---|
| Runtime | **30.0 s** (13 shots) ✓ |
| KO ≤ 16 characters incl. spaces | 13/13 ✓ (R06 and R09 at exactly 16) |
| Subtitle strip inside x 30–480 | 13/13 ✓ (widest 59–451) |
| Strip above y 765 | 13/13 ✓ (bottom 757) |
| EN↔KO highlight pairs | **13/13 ✓**. R12 is now `Ship SKILL.md. Next *free* post?` ↔ `다음 *공짜* 글, 재볼까?` |
| ~햄 count | 2 (R02, R10) ✓ |
| Words per second | max 2.4 ✓ |
| EN ≤ 33 characters | 13/13 ✓ |

## Scorecard (Round 1 → Round 2 → Round 3)

| # | Criterion (weight) | R1 | R2 | R3 | Round 3 justification |
|---|---|---|---|---|---|
| 1 | Hook ×2 | 5 | 8 | **9** | The three seconds are now verdict (~~FREE~~ → $0.40, deadpan hamster, shocked Uchu) → squad sprinting on a direction arrow with a running clock → rewind with both leads on screen. One flaw: Uchu's "!!" butts against the sign and reads as "FREE!!". |
| 2 | Pacing ×1 | 7 | 7 | **8** | The R05 low angle, R06 close-up and R08b split screen break the board-on-top template. R09, R10 and R12 still share it. |
| 3 | Clarity ×1.5 | 4 | 7 | **8** | The seatbelts are now drawn, and HARNESS ①→④ runs as a series. A non-developer can follow "tags = ontology, safety kit = harness". The R07 `kind: step` chip is the one jargon holdout. |
| 4 | Kanban ×1 | 3 | 8 | **8** | The board is in 12/13 frames. The R06 single-column close-up makes the board the stage for once. The rest still use it as a backdrop. |
| 5 | Hamster ×1 | 6 | 7 | **7** | The face is freed in R09, and the R01, R11 and R12 beats are strong. But he is a 0.5-scale figure in the corner of R08a, still small in R04, and passive in R08b. |
| 6 | English VO ×1 | 5 | 7 | **7** | The lines are unchanged since Round 2. They're speakable but slide-shaped ("Harness = …", "Claimed: … Measured: …"). |
| 7 | Korean ×1.5 | 6 | 8 | **9** | Every limit is met, every highlight pairs up, and the tone is native (5분 컷, 사람 도장 필수, 재볼까?). |
| 8 | Composition ×1 | 6 | 7 | **7** | Every strip is safe. Three frames still collide on key information: the R09 HUMAN ONLY stamp covers the meter's **70** threshold label, the R08a belts cross the agents' faces, and the R01 "!!" merges with the sign. |
| 9 | Fun ×1 | 6 | 7 | **8** | Uchu now has an arc: shocked (R01) → cheering "공짜!!" (R04) → doubtful sweat (R11) → hooked again (R12). Add the heroic Orchestrator low angle and the mic drop. |
| 10 | Loop ×1 | 7 | 8 | **9** | Uchu stays on the right across the cut, R12's FREE!! card flows into R01's FREE?, the thud carries over, and the KO line loops ("재볼까?" → "공짜라며?!"). |

**Overall:** (9×2 + 8 + 8×1.5 + 8 + 7 + 7 + 9×1.5 + 7 + 8 + 9) / 12 = 97.5 / 12 = **8.1 / 10 — Grade B+**
Round 1: 5.4 (C) → Round 2: 7.5 (B−) → **Round 3: 8.1 (B+)**

**The Reel passes the 8.0 bar. It is ready to go to the Blender build.** The items below are polish, not blockers.

## Per-shot table (R1 → R2 → R3)

| id | R1 | R2 | R3 | Remaining issue |
|---|---|---|---|---|
| R01 | 5 | 8 | **8** | Uchu's "!!" merges with the sign ("FREE!!"). The "uchu" lettering touches the right curtain tie-back. |
| R02 | 4 | 6 | **8** | Reads as a sprint now. |
| R03 | 5 | 7 | **8** | Both leads are on screen. Uchu is static during a rewind; he could be sliding back. |
| R04 | 7 | 7 | **8** | Uchu cheering "공짜!!" lands. The hamster is still small. |
| R05 | 7 | 7 | **8** | The low angle is a real upgrade. The three working agents are small and far back. |
| R06 | 6 | 8 | **9** | The best frame. It is legible, the board is the stage, and the gap cards read instantly. |
| R07 | 7 | 7 | **7** | Unchanged concept frame. The `kind: step` chip is jargon, and the ghost board is still faintly visible. |
| R08a | 3 | 6 | **7** | Seatbelts read now, but they cross the faces. The hamster is a tiny corner figure, and the pull-line crosses the Verified card. |
| R08b | — | 7 | **8** | The split screen works. |
| R09 | 5 | 6 | **7** | The face is fixed, but the HUMAN ONLY stamp covers the meter's "70", which is the rule the shot is about. The RISK label box is half under the left curtain. |
| R10 | 4 | 8 | **8** | Clean. |
| R11 | 8 | 8 | **9** | Uchu's doubtful beat gives the reveal a reaction. |
| R12 | 5 | 7 | **8** | Highlights match and the loop works. |

## Optional polish (non-blocking, durations unchanged, 30.0 s)

1. **R09:** move `stampMark(250, 420, …)` to `stampMark(305, 428, 'HUMAN ONLY', -8)` so the dashed-70 label at (174, 468) is visible. Shift `Th.meter` from x 120 to x 130 so the RISK box clears the curtain.
2. **R08a:**
   - Turn the diagonal belts into lap belts below the face: for each agent, `M(x-35),648 L(x+35),652` with the buckle at `(x-8, 642)`.
   - Enlarge the hamster to `Th.doc(440, 212, .65, …)`.
   - Route the pull-line outside the board: from (440, 212) around x 470 down to the buckle.
3. **R01:** set `bang: false` on `Th.uchu` (the O mouth already sells the shock), or move the sign 20 px left.
4. **English VO punch-up (highlights stay matched):**
   - R08a: `*Harness*? Seatbelts for agents.` (30)
   - R11: `Said *free*. Cost *$0.40*.` (23), which pairs with `*공짜*라며? 실측 *$0.40*`
5. **R07:** replace the `kind: step` pill with a `type: step` label, or remove it.
