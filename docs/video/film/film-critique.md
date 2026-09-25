# Harness Theater: creative director's review

Reviewed: `renders/film.mp4` (149.8 s), frames every 2 s, plus frames around every scene start (14.6/15.3/16.5/17.5, 46.8–49.5, 67.8–70.5, 87.4–90, 112.4–115, 137–139.5) and full-size stills at 2, 13.5, 38, 44, 53, 60, 66, 80, 97, 107, 111, 124, 132.5, 135 and 147 s. Compared against the reference sheets `ref/sheet_1.png`, `full_a.png` and `full_b.png`.

**Verdict:** The skeleton is right. The script is well sourced and starts with a real pain ("every post sounds like a different person"). The ending lands on "automation stays consistent", and every reference element is present. The execution undercuts it. The camera pushes content under the screen-space chrome. Noa gets pushed behind the curtains during three of the best beats. The subtitle bar covers every character standing at center stage. Five chapters open with the same drape-close and chapter card on an empty stage. The automation chapter, which is the whole point, is the most cluttered and least demonstrated scene. It plays like a well-illustrated lecture with a cute host, not a show.

---

## Scorecard

| Axis | Score | Reason |
|---|---|---|
| Hook | 5 | 0.8 s of empty stage, then a static question. Uchu is half-covered by the subtitle bar, and the "톤 ≠ / 사실 ≠ / 실수 ≠" stamps land on the price text and turn it into mush ("$1실99" at 9 s). |
| Content depth & accuracy | 7 | Guides/sensors, computational vs. judge sensors (Böckeler), OpenAI's ~1M lines with no hand-written code, Palantir objects/links/actions and the Anthropic orchestrator-worker pattern are all correct and cited. The board chapter is thin (3 cards). "Gates" sits under a Böckeler source pill, but gates are 10XAI's own addition. |
| Through-line to automation + consistency | 6 | The bookends work: "different person every post" pays off as "same facts, same voice, same cast". The middle chapters never call back to the three cold-open posts. The final chapter asserts consistency instead of showing it, and its thumbnails show a *different-looking* hamster (purple hoodie, red cap), which contradicts "same cast". |
| Immersion & cinematic feel ×1.5 | 4 | The camera zooms (1.08–1.14) push nodes and panels under the chapter tag and source pill. Five identical drape transitions. The backdrop and lighting never change. No depth: no foreground props or set flats. |
| Fantastical & fun ×1.5 | 5 | The gags are good on paper: seatbelt, BONK, CAUGHT, crowned "Power!", glasses-up "Not vibes." Half of them are cropped or covered. Uchu's quips follow the same "question, Noa retort" pattern at the end of every chapter. |
| Professional polish ×1.5 | 3 | At least 12 visible collisions or crops (listed per scene below), one wrong visual fact (the sandbox dome sits over the Claude *verifier*), a floating crown, and orphan words in subtitles. |
| Character (Noa size, Uchu) | 5 | Base size is right: `NOA=.82` makes Noa about 105 px tall at 720p, close to the reference. But Noa is parked at x=222 in the same idle/point pose in 5 of 7 scenes. The camera enlarges and crops Noa (auto, board), and Noa is 1.4× the crew in Ch.4. Uchu is covered by the subtitle in cold and board. |
| Style match to reference | 7 | Theater, pastel sky, washi-taped chapter tag, source pill and navy bilingual bar are all there. Two differences: the reference keeps characters *above* the subtitle bar on the hill line, and it uses richer hand-drawn "object" props (wheel, browser, photo booth). Here the props are mostly generic panels and chips. |
| Subtitles (EN+KR) | 6 | Size is legible (23 px at 720, about 34 px at 1080) and the colors match the reference. But orphan words ("8.1.", "column.", "speed.", "different person?"), the bar sits on the floor line and hides feet and bodies, and a few Korean lines are stiff (see Subtitles below). |
| Pacing | 5 | Noa speaks 28 of 36 lines with 0.3 s gaps: wall-to-wall narration. There are 5 × 2.0 s silent chapter leads, and 4.4 s of "ONTOLOGY" title over an empty stage. The goal chapter gets 24.7 s (16 %) while Ch.1 gets 32 s. |

**Overall weighted score: 5.1 / 10**
(5+7+6+5+7+6+5 = 41; (4+5+3)×1.5 = 18; 59 / 11.5 = 5.13)

---

## Global, systemic problems (fix these first; they touch every scene)

1. **Characters stand where the subtitle bar sits.** Characters stand at `FLOOR - 4` (594) and crew at `FLOOR - 16`. The 2-line subtitle bar spans y 590–704, and a 3-line bar is taller, so anyone between x≈300 and x≈980 loses their feet or body (Uchu at 2, 13.5 and 80 s; crew labels at 97 s). The reference stands characters on the hill line, about 60 px above the bar.
2. **The camera moves world content under the screen-space chrome.** The chapter tag (x 126–410, y 76–160) and source pill (y 86–116) are drawn outside the camera group, but zooms of 1.08–1.14 push world y 190–250 up into them. Examples: the 1,000,000 counter under the source pill (44 s); the Claim and Source nodes under the chapter tag (60 and 66 s); the orchestrator's face under DISAGREE (111 s).
3. **Noa is inside the camera group,** so every push to the right shoves Noa behind the left curtain: board 80 s, auto 132–135 s (the glasses-up gag is lost), crew 107+ s (Noa delivers "You're the gate, Uchu" off-screen).
4. **Every chapter transition is identical:** drape close, then 2.0 s of silent card on an empty stage, then the card flies to the tag. That is 10 s of dead air and the biggest "lecture" signal.

---

## Per-scene table

| Scene | Score | Main problem | Exact fix |
|---|---|---|---|
| **cold** (0–15.1) | 6 | Soft open: empty stage for 0.8 s, posts pop in one by one. Uchu (x=560) is hidden behind the subtitle. The stamps sit directly on the big price text (`stampMark(x, y+30…)`), so "$9.99" plus "사실 ≠" is unreadable. | `S.cold`: set post `t` to `.05/.3/.55` (not `c[0]+.3/.9/1.5`), and add 6 background mini-posts falling like confetti: `postCard` at scale .35, `y = -120 + ((lt*140 + i*97) % 700)`, opacity .5. Move the stamp to `stampMark(x + 70, y - 58, …)` with rotation `-18+i*10`, and fade the post's `big` text to opacity .35 once stamped. Move Uchu to `x=430` and put all characters on the new `STAND` line (see Top fix 1). Change the `lerp(1380,1000…)` Noa slide-in to end at 1010 and add `sq: .3` on arrival for a landing squash. |
| **harness** (15.1–47.1) | 5 | Crowded composition at the edges: the Guides panel is clipped by the left curtain and under the chapter tag (38 s); the Sensors header is under the source pill. The 1M counter at `g(640,116)` collides with the chapter tag and source pill ("lines of code" is hidden). The crossed straps over MODEL read as a "banned ✗" sign, not a seatbelt. The "HUMAN ✓" stamp appears 1.4 s into "waits for a human" with no human present, so it contradicts the line. | Guides panel `g(300,300)` → `g(330,330)`; Sensors `g(1000,214)` → `g(975,262)`; judge `g(1000,400)` → `g(975,440)`; remap the arrows to match. Camera: `[1.12,470,320]` → `[1.06,500,350]`, `[1.12,840,310]` → `[1.06,800,350]`. Seatbelt: replace the two crossed paths with one diagonal strap `M560,220 L720,380` plus the buckle at (640,300). Gate: delete `stampMark(830,532,'HUMAN ✓', c[4]+1.4)` and add a pulsing chip `'⏳ WAITING · 사람 대기'` at (830,530), `opacity .6+.4*sin(lt*6)`. Counter: at `c[6]`, fade Guides, Sensors and Judge to 0 (`1-k(lt,c[6],.4)`), and pop the counter at `g(640, 470, 1.15)`, below the ring and above the bar. Put "Humans steer. Agents execute." at y=545. |
| **ontology** (47.1–68.1) | 4 | 4.4 s of the "ONTOLOGY" word over an empty stage (nodes pop only at `c[1]+2.4` ≈ 8.1 s). The cam `[1.12,860,390]` puts Source and Claim under the chapter tag and Noa off-screen for the whole payoff. The CAUGHT stamp at the fixed (880,420) misses the claim card. The sensor sweep is a pale vertical bar that reads as a render glitch. Uchu at x=1160 is half behind the right curtain. | Fill the dead time with a callback: at `c[0]+1.2` fly the three cold-open `postCard`s in at scale .5 to (640,330). At `c[1]+2.0` they "burst" (burst plus pop sfx), and each node animates from (640,330) to its `N` position instead of popping in place. Lower the nodes: `N` y values `250,190,270,190,260` → `300,250,330,250,300`. Camera for the `c[2]` phase: `[1.12,860,390]` → `[1.04,720,380]`. Stamp: `stampMark(cx, cy-46, 'CAUGHT', …)` so it rides the card. Replace the sweep rect with a green scan line that has a `sparkle` head moving along the claim→evidence link path. Uchu `x=1160` → `1050`. |
| **board** (68.1–87.7) | 4 | The core product is shown as an almost empty board: 3 cards, 3 empty columns. Card moves are off by one word: the card leaves Decomposed *on* "Decomposed" (`c[2]+.2`) and reaches Verified on "Gate". It passes the Gate with no approval, which contradicts the harness chapter. Uchu at x=640 is fully under the subtitle (only the antennae show). Noa is behind the left curtain (cam `[1.1,700,320]`). | Seed 9 cards: 3 per column in cols 0–2 and 2 in col 3. Reuse the cold-open posts as cards: `'post · "FREE!!"'`, `'post · "$9.99"'`, `'post · "$0.40"'`. Moves: `[[c[2]+1.0,1],[c[2]+1.8,2],[c[2]+3.2,3]]`, and between 1.8 and 3.2 the card sits in Gate with a red pulse. Uchu walks to `x=870` and presses an APPROVE chip at `c[2]+2.8`. In `script.json` change that cue's sfx to `["whoosh",1.0],["whoosh",1.8],["stamp",2.8],["tada",3.2]`. For a "live" feel, make 2 background cards drift col 1→2 on `(lt*.25)%1` loops, with a tiny crew-head cursor (`member(...,.35)`) dragging each. Camera: `[1.1,700,320]` → `[1.04,640,330]`. |
| **crew** (87.7–112.7) | 5 | Wrong visual fact: the third sandbox dome (`[540, .8]`) covers the Claude *verifier*, not a runner. The "git worktree" labels collide with the crew name chips. Name chips (Claude/Codex) sit under the subtitle bar. Noa at x=215 overlaps the Decompose hamster, and Noa is 1.4× the crew's size. The cam `[1.12,920,400]` throws Noa off-screen while Noa is speaking. The Power! crown floats above Uchu's head, half under the APPROVE pill. | `team` x values → `330,445,560,675,800,925`, and rename the 6th slot `deploy` → a second `runner` (keep deploy for the curtain). Domes only at `[[800,0],[925,.3]]`. Move the dome label to `T(x, y - h - 12, …)` (above the dome). Remove the Claude dome. Crew y: `FLOOR-16` → `STAND-12`. Add `crown` to `uchu()` in kit.js, drawn in local coords at `(0,-150)` so it scales with Uchu, and delete the loose crown path in `S.crew`. APPROVE chip: `(1110,420)` → `(1110,330)`. Camera during `c[4]..`: `[1.12,920,400]` → `[1.04,760,370]`. Sandbox gag at `c[3]+2.2`: the runner inside dome 1 knocks over a `card(..,'rm -rf')`, a `burst(800,470,34,'CRASH')` stays inside the dome, and the dome flashes. That shows *why* the sandbox matters. |
| **auto** (112.7–137.5) | 4 | The chapter the creator cares most about is the weakest. (a) The critic panel `g(640,260)` covers the machine and the Reel thumbnail. (b) The three "same …" chips at y=530 overlap each other and Noa, and the subtitle bar and left curtain crop them. (c) Thumbnails `hero_hamster.jpg` and `reel_cover.jpg` show a purple-hoodie, red-cap hamster, so "same cast" is visibly false. (d) Cam `[1.08,720,300]` puts Noa behind the curtain exactly when the glasses flip up on "Not vibes": the best gag in the film is invisible. (e) Consistency is only claimed; nothing shows it. | (a) At `c[3]`, fade the machine to 0 (`1-k(lt,c[3],.4)`) and shrink the outputs into a row: `x 820/960/1100, y 210, scale .72`. Critic panel → `g(470,330)`. (b) Chips: `x = 440 + i*260`, `y = 470`, `z=15`. (c) Replace the three `imgFrame` images with inline mini-renders from the kit: reel = 9:16 `panel` + `noa(…,.35)` + chip "IT SAID FREE"; long = mini `curtains()` scaled .18 with Noa and Uchu; card news = square panel with title plus `noa(…,.25)`. Now all three show *this* Noa, and "same cast" is literally true. (d) Handled by screen-space Noa (Top fix 2); also cam `[1.08,720,300]` → `[1.02,680,340]`. (e) Add the "change a fact once" demo (Top fix 3). |
| **curtain** (137.5–149.8) | 7 | The strongest scene: full cast, marquee, confetti. The GitHub chip `(640,440)` sits on Noa's party hat. The medallion recap reuses the cold-open layout almost 1:1 with no escalation. Noa's 'cheer' paws at (±70,−118) merge with the ears and read as no pose. | GitHub chip → `(640,118)` (no chapter tag in this scene, so the space is free). Noa cheer paws in kit: `cheer: [[-84,-100],[84,-100]]`. On "Encore!" (`c[2]`), have the cast bow: every `member` and `noa` gets `sq:.35` for 0.4 s. At `c[2]+.6` add `drapes` closing to 0.6, then reopening to a single bow. Change the medallion labels to the new words ("규칙 / 진실 / 속도") with a gold ring, so the recap reads as a payoff and not a repeat. |

---

## Subtitles

- **Orphans.** `wrap(en, 58)` greedy-fills the first line. Replace it with a balanced 2-line split: if the plain text is over 58 chars, break at the space closest to `len/2`. This fixes "…from 5.4 to / 8.1.", "Nothing skips a / column.", "Crew for the / speed.", "sound like a / different person?".
- **Bar vs. characters:** see Top fix 1. Keep the bar where it is (it matches the reference) and raise the characters.
- **Korean edits in script.json:**
  - harness #2 `*가이드*는 행동 전에: 브랜드 규칙, 미션, 쓸 수 있는 도구.` → `*가이드*는 행동 전에 들어가요. 브랜드 규칙, 미션, 허용된 도구.`
  - harness #3 `…길이, 금지어, 죽은 링크.` → `…길이, 금지어, 깨진 링크.` ("죽은 링크" is a literal translation)
  - harness #7 `OpenAI는 이렇게 백만 줄을 냈어요.` → `OpenAI는 이렇게 코드 백만 줄을 만들었어요.` ("줄을 냈어요" is not idiomatic). EN: "…shipped a million lines *in five months* this way" (keeps the claim bounded to what the source says).
  - board #3 `분해, 검증, 게이트, 완료.` → `분해, 검증, 게이트, 검증 완료.`, and `KCOLS` `'완료 Verified'` → `'검증완료 Verified'` ("완료" alone means "done", which is not the same as "verified").
  - board #4 `*진실은 하나*` → `*진실의 원천은 하나*`, so it matches "one source of truth".
- Source pill for Ch.1: `출처 · OpenAI 2026 · Böckeler, martinfowler.com` → add `· gate = 10XAI`, so the gate is not credited to Böckeler.

## Pacing (from timeline.js)

- `timing.chapterLead` 2.0 → **1.1**, and let the cast stay on stage during the card. Saves about 4.5 s of dead air.
- `timing.gap` 0.3 is too tight for 28 consecutive Noa lines. Keep 0.3 inside a thought, but add `"hold": 0.6` after each chapter's key reveal: harness #5 (gates), ontology #3, board #3, crew #3, auto #3 (after the "same …" line). This gives the visuals room to land.
- Rebalance: auto 24.7 s → about 34 s (with Top fix 3). Trim harness from 32 s by merging harness #3 and #4 into one line: "*Sensors* check after: code checks length and links; a judge model asks, is this true, and is this us?" Saves about 4 s.

---

## TOP 8 FIXES (ranked by score gain)

1. **Put the cast on a stand line above the subtitle bar.** In kit.js add `const STAND = 540;` and export it. In film.js replace every `FLOOR - 4` in `noa(...)` and `uchu(...)` with `STAND`, and every `FLOOR - 16` for crew with `STAND - 12`. Also shift the floor-anchored props up 56 px: the `gate(600, FLOOR-4…)` → `gate(600, STAND…)`, the dome `y`, and the orchestrator's spotlight polygon bottom. Result: Uchu is no longer hidden in cold and board, crew labels become readable, and it matches the reference's hill-line staging. *(Polish +2, Character +1, Style +1.)*

2. **Render Noa in screen space, outside the camera.** Scenes return `noa: {x, pose, mood, glasses, scale}` instead of adding `noa()` to `s`. In `frame()`, draw `noa(res.noa.x ?? 200, STAND, res.noa.scale ?? .78, res.noa)` *after* the camera group and before `audience()`. Set the default `x=200` (clear of the curtain's inner edge at about 118 plus the audience hamster), and use `NOA=.78`. Noa can then never be cropped or zoomed to 1.12×, the glasses-up "Not vibes" gag becomes visible, and "the hamster is too big" cannot come back through camera zoom. *(Fun +1, Character +2, Polish +1.)*

3. **Make the automation chapter *demonstrate* consistency.** In script.json, insert after auto cue #3:
   `{ "spk": "uchu", "en": "Wait — the tool takes twelve minutes, not five!", "ko": "잠깐, 5분이 아니라 12분 걸리는데?", "sfx": [["boing",0.0]] }`
   `{ "spk": "noa", "en": "Fix it once, in the ontology. Watch all three change.", "ko": "온톨로지에서 한 번만 고치면, 셋 다 바뀌어요.", "sfx": [["stamp",1.2],["ding",2.0],["ding",2.2],["ding",2.4]] }`
   In `S.auto`, at the new cue +1.2, show a `card('claim · "5 min"')` on the machine that gets struck through and restamped `"12 min"`. At +2.0/2.2/2.4 each of the three mini-renders (see the auto row) swaps its caption text "5 min" → "12 min" with a green flash ring. This is the thesis in one image: *one source of truth → consistent outputs*. *(Through-line +2, Content +1, Fun +1.)*

4. **Keep the camera out of the chrome.** In `frame()`, after `camAt`, clamp: `z = Math.min(z, 1.06); cy = Math.min(cy, 172 + 190 / z);` and in every scene keep world content at y ≥ 200 (move the `N` nodes, the harness counter and the crew chips as listed above). Also reduce the per-scene cams to at most 1.06, as in the table. Ends the tag/pill collisions at 38, 44, 60, 66 and 111 s. *(Polish +1.5, Immersion +1.)*

5. **Vary the five chapter transitions and cut the dead leads.** `chapterLead` 2.0 → 1.1. In `frame()`, use `drapes()` only when `i === 1` (the show starts) or `i === scenes.length - 1` (the finale). For the Ch.2–5 entrances, use a "scenery flat" wipe instead: a 1280-wide painted `panel` with washi tape drops from `y=-720` to 0 and back up over 0.9 s (`ease`), carrying the chapter card, while Noa (screen space) stays on stage and turns with `flip:true`. Put a whoosh at `lead-.9`. Five identical silences become one continuous show. *(Immersion +1.5, Pacing +1.)*

6. **Fix the auto-scene layout collisions and the off-model thumbnails.** Replace the `imgFrame` hrefs with the inline kit mini-renders (reel, long, card, all drawing this `noa()`). At `c[3]` fade the machine out, shrink the outputs to the row at y=210, and move the critic panel to `g(470,330)`. Chips at `x=440+i*260, y=470, z=15`. Cam `[1.08,720,300]` → `[1.02,680,340]`. *(Polish +1, Through-line +1.)*

7. **Rebuild the board beat as the product hero shot.** Seed 9 cards, including the three cold-open posts as cards. Retime the moves to `c[2]+1.0 / +1.8 / +3.2` with a red-pulse wait in Gate. Uchu walks to x=870 and presses APPROVE at `c[2]+2.8`, with the cue sfx `["stamp",2.8],["tada",3.2]`. Add two looping background card drifts with tiny crew cursors, and a live-counter chip "agents 6 · humans 1". This gives the harness chapter's "risky waits for a human" rule a visual payoff and makes the board feel alive. *(Content +1, Immersion +0.5, Fun +0.5.)*

8. **Give Uchu the questions, and break the "quip at the end" formula.** Convert three Noa rhetorical openers into Uchu set-ups: board #1 → Uchu: "So where does all this *live*?" / "그럼 이게 다 어디 사는데?", and Noa answers "On one *Kanban board*." Add ontology #0 as Uchu: "Onto-what? Is that a dinosaur?" / "온톨... 뭐? 공룡이야?", and Noa: "A dictionary your robots can't argue with." / "로봇이 말대꾸 못 하는 사전이에요." Crew: move Uchu's "Can I be on the crew?" before the sandbox line, so the gag lands mid-scene rather than as the scene's last line. Noa's share drops from 28/36 to about 25/38 lines, the rhythm stops being "lecture, then punchline", and the fun spreads across each scene. *(Fun +1, Pacing +1, Hook-to-body carry-over.)*

**Expected result with all 8 applied:** about 7.5/10 (Immersion 6.5, Fun 7, Polish 7, Through-line 8, Character 7.5).

---

# Round 2: film v3 (151.5 s)

Re-reviewed the same way as Round 1:
- Frames every 2 s: 7 contact sheets.
- Transitions: 24 frames around every scene start (13.9–16.3, 43.8–46.0, 64.6–66.8, 83.8–86.0, 108.7–111.0, 139.1–141.0).
- Full-size stills at 5, 40, 50, 62, 74, 78, 96, 104, 126, 128, 136, 149 s, plus quarter-size checks at 0.4, 55, 106.5, 138.6 s.
- Pacing from the regenerated timeline.js.

**Verdict:** A real step up. The structural faults are gone:
- Every character now stands above the subtitle bar.
- Noa is never cropped.
- The camera never pushes content under the chapter tag or source pill.
- The glasses-up "Not vibes" gag, the dinosaur line, the crash inside the sandbox dome and the crowned Uchu all read.
- The fix-once demo finally *shows* consistency.

It is not an 8 yet, for four reasons:
1. **One story bug undoes the thesis.** The board's hero card is `post · "FREE!!"`, the claim the ontology chapter just stamped CAUGHT / NO EVIDENCE. Uchu then approves it into Verified with a ✓ (78 s).
2. **The four chapter flats are the same painted sunburst.** They are drawn *over* Noa, so the "host stays on stage" intent is lost.
3. **Every scene uses the same blocking:** Noa at x=190 on the left, a panel in the center, Uchu at x≈1110 on the right. The same light throughout.
4. **A handful of small collisions remain.**

## Scorecard, v2 → v3

| Axis | v2 | v3 | Reason (v3) |
|---|---|---|---|
| Hook | 5 | **6** | The drapes open on Uchu, background posts rain down, and the stamps now sit on post corners and are readable. It still opens on a question over three static cards; no single striking image in the first 2 s. |
| Content depth & accuracy | 7 | **7** | The board is now a real board (9 cards, gate wait, live cursors). The crew adds the contained crash, and "gate = 10XAI" is credited. But the FREE!! card, flagged NO EVIDENCE in Ch.2, is approved and marked ✓ Verified in Ch.3, which is a logic error in the core safety contract. The ✓12 / ✗71 verifier chips are unlabeled numbers. |
| Through-line to automation + consistency | 6 | **7** | Posts become nodes, then board cards, then the reel ("IT SAID FREE"), and the fix-once demo updates all three outputs. That is exactly the through-line. The FREE!! approval breaks it mid-way. |
| Immersion & cinematic feel ×1.5 | 4 | **5.5** | No more crops. Flats are more theatrical than drapes. Still identical flats ×4, the same backdrop and light in every chapter, and the same left–center–right blocking in 6 of 7 scenes. |
| Fantastical & fun ×1.5 | 5 | **6.5** | The gags now land visibly. The dinosaur gag is only a text bubble ("공룡?!"), and nothing fantastical *happens*: no transformation, no set piece. |
| Professional polish ×1.5 | 3 | **6.5** | There are 7 remaining defects, listed under Fix 5. The worst: the GitHub chip sits on Noa's party hat, "LIVE · agents 6 · humans 1" runs past the board edge, and the "5분/12분" badges cover the output titles. |
| Character (Noa size, Uchu) | 5 | **7** | Noa is right-sized (.78, screen space), always visible, and has the landing squash, the glasses-up gag and the bow. But Noa is parked at x=190 in the same point/idle pose for 5 chapters. Uchu has real agency now: approves, gets crowned, asks the questions. |
| Style match to reference | 7 | **7.5** | Characters now stand on the hill line as in the reference. Props are still mostly panels and chips next to the reference's hand-drawn object props. |
| Subtitles (EN+KR) | 6 | **7.5** | Balanced wrap removes the orphans, and the Korean edits landed. Remaining: the `KCOLS` column still reads "완료 Verified" (the script says "검증 완료"). "the tool takes twelve minutes" has no clear referent in either language. |
| Pacing | 5 | **6.5** | Silent leads are down from 2.0 s to 1.1 s. Automation is now 30.4 s (20 %). Uchu opens 3 chapters. Noa still speaks 26 of 39 lines, mostly with 0.3 s gaps, so the middle of each chapter is still monologue. |

**Overall weighted score: 6.6 / 10** (v2: 5.1)
(6+7+7+7+7.5+7.5+6.5 = 48.5; (5.5+6.5+6.5)×1.5 = 27.75; 76.25 / 11.5 = 6.63)

## Per-scene, v3

| Scene | v2 → v3 | Remaining problem |
|---|---|---|
| cold | 6 → 6.5 | Clean and readable. The open is still a question over static cards; the three hero posts pop in rather than slam in. |
| harness | 5 → 7 | Layout fixed and seatbelt readable. "Humans steer. Agents execute." at y≈540 is low contrast against the hills. |
| ontology | 4 → 7 | Posts become nodes, and CAUGHT rides the card. The scan sparkle parks on the Claim node and covers "주장" (62 s). The dinosaur gag is text-only. |
| board | 4 → 6 | Contradiction: FREE!! is approved into Verified. The LIVE label overflows the board frame. "완료". Noa's raised paw overlaps the board's left edge (x≈250). |
| crew | 5 → 7 | Good. The unlabeled ✓12 / ✗71 chips confuse; the white mini-cards on the dispatch arcs fly across the orchestrator's face. |
| auto | 4 → 7 | The demo works. The badges cover "IT SAID FREE" and "공짜라며?". The orange wires are drawn over the reel frame. The outputs are small (104×184) for the film's payoff. "5분" vs. "5 min" mix. |
| curtain | 7 → 7.5 | The bow and closing drapes work. The GitHub chip (640,400) still sits on Noa's party hat. |

## TOP 6 FIXES (v3 → 8+)

1. **Fix the FREE!! approval.** This is a logic bug in the product's core safety contract. In `S.board`:
   - Make the hero card that walks the columns the evidence-backed one. Change the seed row `[0, 1, 'post · "$9.99"', …]` to `[0, 1, 'post · "FREE!!"', '#f7b3c8', c[1] + 2.6]`. In the hero `card(...)` call, change the text `'post · "FREE!!"'` → `'post · "$9.99"'` and the stripe → `'#9aa7c2'`.
   - Then, at `c[2]+1.8`, move the FREE!! seed card from col 0 into Gate row 1 (lerp `cx(0)` → `cx(2)`, `rowY(1)`). Give it `kind:'risk', badge:'NO EVIDENCE'`.
   - At `c[2]+3.0`, right after Uchu approves $9.99, stamp it with `stampMark(cx(2)+cw/2, rowY(1)+17, 'REJECT', k(lt, c[2]+3.0, .5), -12)`, then drop it off the board: `y += 260*ease(k(lt,c[2]+3.4,.6))`, rotate `+35°`, fade.
   - Add `["stamp",3.0]` to board cue #3 sfx.

   Result: the human approves the good card *and* blocks the bad one. The gate contract and the ontology callback now agree.

2. **Keep Noa in front of the flats, and make each flat different.** In `frame()`, move `if (res.noa) …noa(...)` to *after* `chapterFlat(...)`, so the host stays on stage while the scenery flies. In `chapterFlat`, take a per-chapter motif and tint:
   - `const FLAT = { 1: ['#fbe8c9', buckleRow], 2: ['#e6effb', bookPages], 3: ['#e7f6ec', columnStripes], 4: ['#fbe3ea', crewSilhouettes], 5: ['#efe6fb', filmStrip] }`.
   - Draw the motif at opacity .35 behind the card instead of the 14 identical sun rays. Reuse `icoBuckle`, `icoBoard` and `icoCrew` scaled ×4 for 1, 3 and 4. Draw the pages and the film strip as simple paths.
   - Put `whoosh` at `lead-.9` for the drop and a soft `pop` when the flat lands.

3. **Break the identical blocking and light: one staging idea per chapter.**
   - `K.backdrop(t, {tint})`: add a full-frame `rect` overlay. Board: `#2b2f5a` at .16 (the board "glows" at dusk, and the LIVE dot pulses brighter). Crew: `spot: 640` so the orchestrator is under a spotlight, plus an edge vignette. Auto: warm `#ffcf7a` at .10.
   - Move Noa: ontology `x` lerps 190 → 360 at `c[4]` to point at CAUGHT. Auto `x` 190 → 330 at `c[4]` to "turn the dial" on the claim card (add `pose:'stamp'`).
   - Uchu entrances: in ontology, Uchu pops up from *behind* the PUBLISH box (y from STAND+80 → STAND, masked by the box) instead of standing at x=1110. In the automation scene, Uchu slides in on the conveyor.
   - Add a conveyor for the automation scene: a treaded belt `rect` from (560, STAND-6) to (1160, STAND-6), with moving tread lines `x = (lt*120 + i*40) % 600`, carrying the three outputs in at their `t0` instead of popping them.

   This is the biggest remaining lever on Immersion (×1.5).

4. **Make the automation payoff legible and bigger.**
   - In `output()`, move the `5분/12분` badge from the top-right corner to a tag *under* each frame (`y = h/2 + 22`). Use the claim's unit language in both places: `'5 min'` / `'12 min'`, or change the claim card to `'claim · 설치 시간: 5분'`. Pick one.
   - Draw all three orange wires in a first loop and the outputs in a second loop, so no wire crosses a frame.
   - During `c[4] … c[5]`, scale the outputs `1.0 → 1.25` (`lerp(sc, 1.25, ease(k(lt, c[4], .5)))`) and dim the machine to .5, so the three changing frames are the hero of the shot.
   - Start each green propagation line at the claim card `(470, 204)` and end it at the badge.
   - script.json auto #4: `"Wait, setup takes *twelve* minutes, not five!"` / `"잠깐, 세팅은 5분이 아니라 *12분*인데?"`.

5. **Polish sweep (7 items):**
   - (a) Curtain: GitHub chip `popAt(lt, c[1]+1.2, 640, 400, …)` → `(640, 104)`. The gap between the valance and the marquee is free.
   - (b) Board: LIVE label → `T(1004, 194, 'LIVE · agents 6 · humans 1', 14, { a: 'end', … })`, and the dot at `1004 - tw(label,14) - 14`.
   - (c) kit.js `KCOLS[3][0]` `'완료 Verified'` → `'검증완료 Verified'`.
   - (d) Board: shift the kanban from `kanban(260,170,…)` to `kanban(290,170,730,300,…)`, so Noa's paw at x≈250 clears it.
   - (e) Harness: "Humans steer. Agents execute." → `{ f: '#26386b', stroke: '#fff', sw: 5 }`, size 26.
   - (f) Ontology: stop the scan sparkle at the Evidence node edge, then hide it (`if (scan >= 1) skip`). Draw it before the nodes, so it passes *under* "주장".
   - (g) Crew: verifier chips `'✓ 12'` / `'✗ 71'` → `'✓ risk 12'` / `'✗ risk 71'`. Start the dispatch arcs at `O[1]+90` (below the desk), so the mini-cards never cross the orchestrator's face.

6. **Pull more of the explanation out of Noa's mouth and into the cast.**
   - Crew: give each specialist a hop-synced speech `bubble` when it acts, e.g. decompose `'✂ split!'` at `c[1]+.6`, gapfill `'+ .env!'` at `c[1]+2.4`, Claude `'risk 12'` and Codex `'risk 71!?'` at `c[2]+2.0`. Shorten crew #2 to `"Decompose splits. Gap-fill fills what the author skipped."`, so the visuals carry it.
   - Ontology: at "Onto-what? Is that a dinosaur?", pop a tiny dino silhouette in a thought bubble over Uchu (`bubble` plus a 6-point path) that Noa's line "pops" (`burst('POP')` at `c[1]+.3`).
   - Raise `timing.gap` from 0.3 to 0.4, and add `"hold": 0.5` to board #3 and auto #5, so each reveal lands before the next line.
   - Hook: move the three hero `postCard`s to slam in (scale 1.6 → 1 with a `stamp` sfx) at 0.9 / 1.2 / 1.5 s, *before* Uchu's line starts at 0.6 + 0.9. Set `timing.lead` 0.6 → 1.5 for the cold scene only, so the first image is the chaos, not the question.

**Projected score with all 6 applied:** about 8.0–8.3. Immersion 7, Fun 7.5, Polish 8, Through-line 8.5, Content 8.

---

# Round 3: film v4 (155.6 s)

Reviewed the same way as before:
- Frames every 2 s: 7 contact sheets.
- Transitions: 18 frames at each scene boundary −0.5 / 0 / +0.5 s (15.6–16.7, 46.3–47.3, 67.7–68.7, 87.2–88.2, 112.3–113.4, 143.4–144.5).
- The board's reject beat frame by frame: 79.5, 79.9, 80.2, 80.5, 80.8, 81.0 s.
- Full-size stills at 1.2, 48, 78, 79.5, 81, 91, 108, 123, 131, 141 s.
- Pacing from the regenerated timeline.js.

**Verdict:** The film has crossed from "illustrated lecture" to "a show". The story logic is now sound:
- FREE!! is caught in Ch.2 and rejected at the gate in Ch.3, while "$9.99" is approved.
- The fix-once demo updates all three outputs.

The chapter flats each have their own motif, and Noa stays on stage in front of them. The dino thought bubble, the crew speech bubbles and the "posts slam in first" open all read.

It is still not an 8. Several of the round 2 fixes landed *technically* but at such low strength that they barely register on screen:
- **Dusk tint on the board:** alpha .14 reads as a slight grey cast, not a lighting change.
- **Crew spotlight:** barely visible against the pastel sky.
- **Output enlargement:** it is `1 + .1*big`, not the 1.25 asked for, so the three outputs look the same size at 123 s and 131 s.
- **REJECT beat:** it lasts about 0.5 s on screen, fires at the same moment "$9.99" jumps to Verified, and FREE!! sits on top of `asset · card` (hiding it) while it waits.

There are also new collisions. Noa's automation walk puts Noa into the gear and the "same facts" chip (131 s), and Uchu at x=1160 is half behind the right curtain (141 s). Every chapter change still hard-cuts to an empty stage for a few frames before the flat drops (46.3, 67.7, 112.3 s).

## Scorecard, v3 → v4

| Axis | v3 | v4 | Reason (v4) |
|---|---|---|---|
| Hook | 6 | **6.5** | FREE!! slams in on an empty stage before any words, which is better. But one post at 1.2 s is not yet "chaos". The strongest image (three clashing posts plus stamps) arrives at 7–9 s. |
| Content depth & accuracy | 7 | **8** | The gate contract now reads correctly: evidence-less claim rejected, good card approved, `risk 12 / 71` labelled. The citations are right. |
| Through-line to automation + consistency | 7 | **8** | FREE!! is traceable from cold open → node → CAUGHT → REJECT, and "IT SAID FREE" still ends up in the Ch.5 reel. Minor issue: the reel still carries "IT SAID FREE" after the pipeline rejected FREE!!. See Fix 5. |
| Immersion & cinematic feel ×1.5 | 5.5 | **6.5** | The flats with motifs and continuous Noa are a real gain. The lighting changes are too faint to register. There is a hard cut before every flat. The blocking is still left–center–right in 5 of 7 scenes. |
| Fantastical & fun ×1.5 | 6.5 | **7** | Dino bubble, crew barks ("✂ split!", "risk 71?!"), the crash in the dome, and glasses-up all land. Nothing *transforms*, and the finale is a static line-up. |
| Professional polish ×1.5 | 6.5 | **7** | The round 2 sweep items are fixed. New issues: Noa collides with the gear and chips (131 s); Uchu is cropped by the curtain (141 s); FREE!! covers `asset · card` (79.5 s). The dispatch mini-cards still pile up on the orchestrator's desk and on DISAGREE (108 s). The green fix line in auto is a short stub that ends in empty air (131 s). |
| Character (Noa size, Uchu) | 7 | **7.5** | Noa's size is right and stays consistent, and Noa moves in ontology and auto. Uchu pops up from behind PUBLISH, approves, and is crowned. Noa's automation walk lands badly. |
| Style match to reference | 7.5 | **7.5** | Unchanged: faithful theater, pastel, tag, pill, navy bar. |
| Subtitles (EN+KR) | 7.5 | **7.5** | Clean and balanced. "setup" fixes the referent. No new issues. |
| Pacing | 6.5 | **7** | The 0.4 s gap helps, and posts now come before words. The reject beat is buried under a simultaneous move. Noa's 26/39 share is unchanged. |

**Overall weighted score: 7.2 / 10** (v2 5.1 → v3 6.6 → v4 7.2)
(6.5+8+8+7.5+7.5+7.5+7 = 52; (6.5+7+7)×1.5 = 30.75; 82.75 / 11.5 = 7.20)

Under 8, so here are the Top fixes. None of them is structural; they are all about strength and timing.

## TOP 6 FIXES (v4 → 8+)

1. **Cover the scene cut with the incoming flat** (removes the empty-stage pop at every chapter change). In `frame()`, after computing `sc` and `lt`:
   ```js
   const nx = scenes[i + 1];
   if (nx && nx.chapter && lt > sc.dur - .35) s += chapterFlat(nx.chapter, lt - sc.dur, 1e9);  // pre-drop
   ```
   In `chapterFlat`, change `down = ease(k(lt, 0, .35))` → `down = ease(k(lt, -.35, .35))`, so the flat is already fully down at the new scene's `lt=0`. Passing `lead=1e9` keeps `up=0` during the pre-drop. Draw it *before* the `noa(...)` call so Noa stays in front. Add `["whoosh", -0.35]` for the drop, or move the existing whoosh 0.35 s earlier.

2. **Give the REJECT its own beat and stop it hiding `asset · card`.** In `S.board`:
   - FREE!! waits in Gate row 2, not row 1: `rowY(1)` → `rowY(2)` in both the card `y` and the `stampMark` `y`.
   - Retime so the reject lands *after* the approval: stamp at `c[2]+3.9` (was 3.0), drop at `c[2]+4.4` over `.9` s (was 3.4 over .7). While it falls, add `burst(cx(2)+cw/2, rowY(2)+60, 30, 'NOPE', {z:13, fill:'#ffd0c8'})`, and pop a chip `'근거 없음 → 발행 불가'` at `(cx(2)+cw/2, rowY(2)+90)` for 1.2 s.
   - The fall must leave the board visibly: let `y` go to `+420` and keep `opacity` at 1 until `drop>.7`.
   - In script.json board #3, append the sfx `["stamp",3.9],["boing",4.4]`, and set `"hold": 0.8` so the beat has room before board #4.

3. **Make the lighting changes actually visible.** kit.js `backdrop`:
   - Board: tint `['#2b2f5a', .14]` → `['#2b2f5a', .30]`, plus a soft blue glow behind the board: `<ellipse cx="640" cy="330" rx="460" ry="220" fill="#bcd3ff" opacity=".35"/>` drawn under the kanban.
   - Crew: vignette outer stop `.32` → `.5`. Spotlight polygon `opacity .35` → `.55`, and add a floor pool `<ellipse cx="640" cy="${STAND+8}" rx="140" ry="16" fill="#fffbe0" opacity=".7"/>`.
   - Auto: `['#ffcf7a', .1]` → `['#ffcf7a', .18]`.

   Each chapter should read as a different lighting cue at thumbnail size.

4. **Fix the automation-scene collisions and make the fix read.**
   - (a) Noa's walk: `lerp(190, 300, …)` → `lerp(190, 250, …)`, and move the chips to `g(500, 470 + i*36, …)`, so Noa (right edge ≈ 290 with the 'stamp' paw) clears the gear at x≈350 and the chips.
   - (b) Uchu: `uchu(1160, STAND, .78, …)` → `uchu(1120, STAND, .78, …)`, and nudge the card-news output `x2` from 1110 → 1080 so the two don't touch.
   - (c) Draw the claim card *outside* the dimmed machine group: move the `if (lt > c[3]) { … card('claim · setup…') … }` block out of `m`, emit it as `s += g(470, 204, …)` after the machine, and give it a pulsing green ring while `fix` runs. The one fact being fixed must not be dimmed.
   - (d) Enlarge: `lerp(sc, .62, row) * (1 + .1 * big)` → `* (1 + .3 * big)`.
   - (e) Green propagation paths: end at the badge, not in empty air. Use `${lerp(x, x2, row) + 360*slide},${y + (kind === 'reel' ? 110 : kind === 'long' ? 80 : 90)}`, which matches each output's badge y.

5. **Close the FREE!! loop in the outputs.** The reel says "IT SAID FREE" after the pipeline rejected FREE!!. Make that a feature: in `output('reel')`, render the caption as `'IT SAID FREE'` with a red strike-through line, plus a small green `'✓ evidence'` tag under it. Card news: `'공짜라며?'` → `'공짜? 근거 확인 ✓'`. It is one line each, and it turns a continuity nit into the payoff of the FREE!! thread.

6. **Declutter the crew dispatch and add one fantastical moment.**
   - Dispatch: while `c[2]+1.8 < lt < c[3]` (the DISAGREE beat), draw the mini-card loop at opacity `.25`. Start the arcs at `O[1] + 130` (below the desk front) instead of `+100`, so they never overlap DISAGREE or the verifier chips.
   - Finale (`S.curtain`): on "Encore!" (`c[2]`), the three medallions fly down and orbit Noa once (`x = 640 + 150*cos(a)`, `y = STAND - 170 + 40*sin(a)`, `a = 2π*k(lt, c[2], 1.2) + i*2.09`), then burst into confetti. It costs about 12 lines and gives the film a closing image instead of a static line-up.

**Projected score with all 6 applied:**

| Axis | Projected |
|---|---|
| Immersion | 7.5 |
| Fun | 7.5 |
| Polish | 8.5 |
| Pacing | 7.5 |
| Hook | 6.5 |
| Content | 8.5 |
| Through-line | 8.5 |
| Character | 8 |
| Style | 7.5 |
| Subtitles | 7.5 |

That gives 89.25 / 11.5 = **about 7.8 on its own**. Fixes 1–6 alone do not reach 8. Two more changes are needed:

- **Hook +1:** in `S.cold`, let all three hero posts slam in at 0.3 / 0.6 / 0.9 s with their stamps, before Uchu's line (`timing.lead` 1.5 for cold is enough room). Hook 6.5 → 7.5.
- **Immersion +0.5:** break the left–center–right blocking in at least one chapter. In `S.board`, put Noa *behind* the board at x=640, popping up over its top edge (return `noa: { x: 640, behind: true, … }`; in `frame()`, when `res.noa.behind` is set, draw `noa(o.x, 190, …)` *before* the camera group, so the board, which is inside the camera group, covers Noa's lower body) on "One source of truth". Immersion 7.5 → 8.

With both, the total is 91.75 / 11.5 = **about 8.0**. Apply Fixes 1–6 and these two changes as one batch.

---

# Round 4: film v5 (155.8 s, commit 283ec64)

Reviewed the same way as before:
- Frames every 2 s: 7 contact sheets.
- Transitions: 18 frames around every scene boundary at −0.2 / 0 / +0.3 s (15.8–16.3, 46.1–46.6, 67.5–68.0, 87.2–87.7, 112.3–112.8, 143.4–144.0).
- Full-size stills at 0.5, 80.6, 81.6, 84.3, 85.5, 131, 153 s: the open, the reject beat, Noa's pop-up, the fix-once demo and the finale orbit.
- The source checked at the lines cited below.

**Verdict:** The pre-drop flats make the chapter changes seamless, and there is no more empty-stage flash. The lighting cues now read at thumbnail size: the board at dusk, the crew under a spotlight, the automation scene warm. Noa popping up behind the board is the first time the film breaks its left–center–right blocking, and it is charming. The FREE!! thread now pays off end to end: cold open → CAUGHT → REJECT / NOPE → "~~IT SAID FREE~~ ✓ evidence" in the reel. The medallion orbit gives the finale a closing image.

It is close, but **not yet 8**, because the fixes introduced a new layer of small but visible defects:

1. **The slam-in hook is hidden by the opening drapes.** `dr = 1 - k(lt, .05, .8)` means the drapes still cover the left third at 0.5 s, and the first post (FREE!!, at 0.3 s) slams in behind the curtain (full frame at 0.5 s).
2. **Noa's pop-up is washed out.** The board glow `<ellipse … fill="#bcd3ff" opacity=".35">` (film.js:194) is inside the camera group, which is drawn *over* the behind-board Noa (film.js:418). Noa appears pale blue-grey at 85.5 s.
3. **The live cursors duplicate cards.** The dragged copies (`'script · reel'`, `'post · "$0.40"'`, film.js:~234) are drawn while the seeded originals stay in place. At 84.3 and 85.5 s the board shows two "$0.40" cards side by side and two overlapping "script · reel" cards. That contradicts "one source of truth".
4. **The FREE!! fall piles up on APPROVE and Uchu.** At 81.6 s the card, the NO EVIDENCE badge and the REJECT stamp land on the APPROVE pill and Uchu's elbow in one illegible stack. The "근거 없음 → 발행 불가" chip sits at the bottom of the *Verifying* column, so it reads as belonging to the wrong column.
5. **The previous scene's chrome sits on top of the pre-drop flat.** `K.source(...)` and `chapterTag` are drawn after the pre-drop (film.js:420–424), so "출처 · OpenAI…", the Palantir pill and the Anthropic pill float over the incoming flat for 0.35 s (46.1, 67.5, 112.3 s).
6. **Card-news labels run into the subtitle bar.** Moving the card news to (1010, 452) at ×1.2 puts its "5 min" badge and "Card news" label at y≈585–635, overlapping the top edge of the subtitle bar (131 s). Uchu at 1120 now touches the card's right edge.
7. **The claim fix swaps too early.** The card text switches to "12 min" at `fix > .5` while the strike line is still drawing, so for ~0.2 s the new value is struck out (131 s).

## Scorecard, v4 → v5

| Axis | v4 | v5 | Reason (v5) |
|---|---|---|---|
| Hook | 6.5 | **7** | Three posts slam in before any words, which is right. But the first slam happens behind the opening drapes. |
| Content depth & accuracy | 8 | **8.5** | Gate contract, reject reason ("근거 없음 → 발행 불가") and evidence tag are all explicit and correct. |
| Through-line to automation + consistency | 8 | **8.5** | The FREE!! thread closes in the Ch.5 outputs, and the fix-once demo is legible. |
| Immersion & cinematic feel ×1.5 | 6.5 | **7.5** | Seamless flats, visible lighting cues, one real staging break. Harness, ontology and auto still use the same left–center–right blocking and a static camera. |
| Fantastical & fun ×1.5 | 7 | **7.5** | NOPE burst, pop-up Noa, medallion orbit. The harness chapter (the seatbelt) is still the least playful. |
| Professional polish ×1.5 | 7 | **7.5** | Several v4 defects are fixed, but seven new ones (listed above) appear, and 3, 4 and 6 are visible at normal viewing speed. |
| Character (Noa size, Uchu) | 7.5 | **8** | Noa's size stays consistent, the pop-up and the orbit centerpiece work, and Uchu is the human in the loop throughout. |
| Style match to reference | 7.5 | **7.5** | Unchanged and faithful. |
| Subtitles (EN+KR) | 7.5 | **7.5** | Clean. No regressions. |
| Pacing | 7 | **7.5** | The reject beat now has its own time plus the .8 hold. The transitions no longer stall. |

**Overall weighted score: 7.7 / 10** (v2 5.1 → v3 6.6 → v4 7.2 → v5 7.7)
(7+8.5+8.5+8+7.5+7.5+7.5 = 54.5; (7.5+7.5+7.5)×1.5 = 33.75; 88.25 / 11.5 = 7.67)

## TOP FIXES (v5 → 8)

Fixes 1–5 are polish and each is a few lines; together they take Polish to 8.5 and Hook to 7.5. That reaches about 7.85, so Fix 6 (two staging beats) is needed to clear 8.

1. **Stop covering the chrome and dimming Noa** (defects 2 and 5):
   - Board glow: remove the ellipse from `res.s` (film.js:194) and return it as `res.under = '<ellipse …>'`. In `frame()`, draw `if (res.under) s += res.under;` *before* the behind-board Noa (line 418). Because it is now outside the camera, apply the same camera transform: wrap it in `<g transform="translate(640,360) scale(z) translate(-cx,-cy)">`.
   - Pre-drop order: in `frame()`, compute `const pre = nx && nx.chapter && lt > sc.dur - .35;`. Gate the chapter tag with `&& !pre`. Change the source line to `if (sc.source) s += K.source(sc.source, k(lt, lead, .5) * (1 - k(lt, sc.dur - .35, .12)));`.

2. **Remove the duplicate cards on the live board** (defect 3). In the `seed.forEach` in `S.board`, skip the two originals once the cursors start:
   ```js
   seed.forEach(([col, row, t, stripe, t0]) => { if (lt > c[3] && ((col === 1 && row === 1) || (col === 0 && row === 2))) return; s += popAt(...); });
   ```
   Also make the cursor loop land and stay: replace `% 1` with `Math.min(1, …)` on the first pass, so each card moves once and parks instead of teleporting back to its start column every ~2.9 s.

3. **Make the reject readable** (defect 4). In the FREE!! block:
   - Drift the fall left and away from APPROVE and Uchu: `x = lerp(cx(0), cx(2), mv) - 150 * drop` and `y = … + 300 * drop`, with rotation `-35 * drop`. The card now falls through the empty space under the Gate/Verifying columns (x≈560–700).
   - Fade from `drop > .45`: `opacity = 1 - k(drop, .45, .55)`. Apply the same offset to the `stampMark`.
   - Move the "근거 없음 → 발행 불가" chip above the Gate column header: `(cx(2) + cw/2, 150)`. That area is free since "One source of truth" moved below the board.

4. **Show the slam** (defect 1). In `frame()`, change `if (i === 0) dr = 1 - k(lt, .05, .8);` → `dr = 1 - k(lt, 0, .35);`. In `S.cold`, change the post slam times from `.3/.6/.9` → `.45/.75/1.05`, and shift the three cold `["stamp", …]` sfx by +0.15 s to match. Keep `timing.lead` at 1.5 for cold.

5. **Automation-scene clearances** (defects 6 and 7):
   - Card news `y2`/`y`: `452` → `420`. Uchu `1120` → `1135`.
   - Claim fix: draw the strike across "5 min" over `fix ∈ [0, .6]`, and swap the text only at `fix >= 1`. Use `fix = k(lt, c[4] + 1.2, .6)` and `const txt = fix >= 1 ? '12 min' : '5 min'`, with the strike shown while `fix < 1`. Pop the new card with `pop(k(lt, c[4] + 1.8, .3))`.
   - Finale orbit: raise the orbit center from `STAND - 170` → `STAND - 200`, so the Harness medallion label clears Noa's party hat.

6. **Two staging beats for Immersion and Fun, 7.5 → 8 each:**
   - **Harness, "So… a seatbelt for robots?" (c[4]):** Uchu walks from x=300 to the orb (`uchu(lerp(300, 560, ease(k(lt, c[4], .8))), …)`) and pulls the strap across. Draw the diagonal strap with `stroke-dasharray` growing `0 → 230` over `k(lt, c[4] + .6, .4)`, add `burst(700, 260, 30, 'CLICK!')` at `c[4] + 1.0`, and give the orb a squash (`scale(1.08, .92)` for 0.2 s). Add `["stamp", 1.0]` to that cue. Right now the strap simply appears.
   - **Auto, "Watch all three change":** one deliberate camera push. In `S.auto`, add `if (lt > c[4] + 1.6 && lt < c[5]) cam = [1.06, 900, 330];`, so the camera eases toward the three outputs as they flip to 12 min. `camAt` clamps `cx` to 640 ± (z−1)·600, which is 676 at z=1.06, so the push is mostly a zoom with a slight drift right. That is enough. If more drift is wanted, allow it for this beat only with a `res.camFree` flag that skips the `cx` clamp; `cy` stays clamped. It pulls back to `[1.02, 640, 330]` for the critic panel. Because Noa is in screen space and the camera is clamped, nothing crops.

**Projected score with Fixes 1–6:** Hook 7.5, Immersion 8, Fun 8, Polish 8.5, everything else unchanged. That gives 55 + 36.75 = 91.75 / 11.5 = **about 8.0**.
