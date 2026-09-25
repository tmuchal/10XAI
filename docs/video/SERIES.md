# Harness Theater: series guide

One idea, three formats: an **Instagram Reel / YouTube Short**, a **YouTube long-form video**, and a **card-news carousel**. All three share one cast, one set, one voice, and one drawing kit (`theater.js`).

## The one idea

> Viral AI workflows promise "free, 5 minutes, one prompt." 10XAI pastes the post onto a **Kanban board run by a team of AI agents**. The **ontology** gives every card typed fields (claim, measured, risk, gate). The **harness** (guides, sensors, a human gate, and a sandbox) checks those fields. The result is numbers, not opinions: *claimed vs. measured*.

Hook line for the whole series: **"It said FREE. We measured."**

## Language and subtitles

- **Voice-over is in English.** Dr. Harness is the narrator: warm, quick, a little deadpan. Keep Fireship-style density: one joke or punchline roughly every 20 seconds.
- **Every line has a combined subtitle** drawn with `Theater.sub2(en, ko)`: the English line in ink on top, the Korean line in vermilion below at about 85% of the English size, on a white paper strip. Keep English to 42 characters or fewer per subtitle, and write natural Korean, not literal translation.
- Box characters speak in "boop" gibberish. Their meaning goes in the subtitles.

## Look: bright, flashy, playful

- The watercolor-theater set comes from `theater.js`: a bright sunburst backdrop, red curtains, and a honey-wood floor. **No dark grades** except the one night gag (`st:{night:true}`), and it stays light.
- Use saturated accent colors that match the 10XAI agent colors (see the cast). Hook headlines use `Theater.hook()`: yellow fill with a thick ink outline.
- Page chrome comes from `series.css`: bright paper, a striped circus valance header, and chunky ink borders with offset shadows.
- Fonts: Gaegu (hand, EN+KR), Gowun Dodum (body), IBM Plex Mono (timecodes).

## Cast (drawn with `theater.js`)

| Character | Call | Role |
|---|---|---|
| Dr. Harness | `doc(x, floorY, scale, {m, ra, la, q, bang})` | Host and narrator. Lab coat, spiky hair, round glasses. |
| Orchestrator | `agent('orchestrator', …)` | Crowned rose box with a baton. Fans work out to the others. (`verify-orchestrator`, `exec-orchestrator`) |
| Decompose | `agent('decompose', …)` | Blue, scissors. Cuts the post into ordered cards. |
| Gap-fill | `agent('gapfill', …)` | Amber, pencil. Adds the gray, dashed cards for steps the author skipped. |
| Verify | `agent('verify', …)` | Red, magnifier. Scores risk 0–100 and flags security, ToS and policy issues. It runs as Claude + Codex (`runner: both`). |
| Router | `agent('router', …)` | Purple, signpost. Assigns each card a type. |
| Exec runner | `agent('runner', …)` | Green, stopwatch. Runs safe cards in the sandbox and measures them. |
| Repair | `agent('repair', …)` | Pink, wrench. Runs the fix loop on failures. |
| Deploy | `agent('deploy', …)` | Purple, package. Exports SKILL.md / JSON / CLI to the library. |
| Hype Box | `box(x, fy, s, Object.assign({mood:'cool'}, Theater.PAL.gold))` | The viral post. Gold, sunglasses. |

Moods: `happy`, `worried`, `dizzy`, `alert`, `sleep`, `cool`, `sheepish`, `star`. Options: `hat`, `crown`, `tag`, `label`, `carry` (holds a card overhead), `harness`, `mag`, `rot`, `arms:'down'`.

## Home set: the multi-agent Kanban board

The Kanban board appears in **every format**. It's the show's "mission control": `Theater.kanban(x, y, w, h, cols)` with `Theater.COLS` (Decomposed → Verifying → Gate / Review → Verified). Agents walk in front of it carrying cards (`carry`). Screen-recording beats of the real app use `Theater.browser(x, y, w, h, 'localhost:8080', inner)` with a kanban inside.

## Recurring gags (props in `theater.js`)

- **RISK meter + pump:** the "P(doom)" homage. `meter(x, y, value)` and `pump(x, baseY, pushed, [hoseX, hoseY])`. Red at 70 and above.
- **Gate barrier + stamp:** `gate(x, fy, open)`. It lifts only after Dr. Harness stamps "APPROVED."
- **Sandbox:** `sandbox(x, fy, w)`, the git worktree.
- **PUBLISH door:** `door(x, fy, locked)` is padlocked when a Claim box has no Evidence rope (`rope`).
- **Chalkboard:** `board(...)` shows claimed vs. measured.
- **Bell fence:** `fence(...)` stands for the computational sensors.

## Facts we may state (source them on screen or in the description)

- *Agent = Model + Harness.* The term was popularized by Mitchell Hashimoto (Feb 2026).
- OpenAI reports building a product of about 1M lines of code with **0 hand-written lines**, about 1,500 merged PRs and 3 engineers, in roughly a tenth of the usual time ("Harness engineering", Feb 2026). Say "OpenAI reports."
- Böckeler / Thoughtworks (martinfowler.com): **guides** (feedforward) and **sensors** (feedback). Sensors are computational (tests, rules) or inferential (an LLM judge).
- Anthropic, "Effective harnesses for long-running agents" (Nov 2025): an initializer agent, a progress file, one feature at a time.
- Anthropic's multi-agent research system (a lead agent plus parallel subagents) scored **90.2% better** than a single agent on Anthropic's internal eval. Say "Anthropic reports."
- Palantir's ontology primitives are **objects, links, and actions**, and agents act only through actions.
- 10XAI specifics:
  - Cards are gated at `RISK_GATE_THRESHOLD = 70`, and hard flags (secret, credential, api key, prod, payment, delete, `rm -rf`) always gate.
  - Card metadata is `kind`, `claim`, `measured`, `risk`, `badges`, `gate`.
  - The API includes `POST /api/ingest`, `/api/verify/run` and `/api/execute/run`.
  - Each run gets its own isolated git worktree, and verify runs on Claude + Codex.
- **Never use:** "88% of agent projects fail" or "only 5% reach production." Neither has a primary source.
- **Measured numbers on screen are placeholders** until the creator's dry run. The README examples are OpenHands → 7 cards, about 30 s, 6 gated; bolt.new → 8 cards including an "upgrade to paid" card; $0.40 and 12 min are illustrative. Mark them "placeholder" in the notes.

## Format specs (from research)

| | Instagram Reel / YouTube Short | YouTube long-form | Card news |
|---|---|---|---|
| Canvas | 1080×1920 (logical 540×960) | 1920×1080 (logical 960×540) | 1080×1350 4:5 (logical 540×675) |
| Length | 30–60 s (this one: 45 s) | 12–16 min (this one: about 14 min) | 8–10 slides (this one: 10) |
| Safe zone | Text in y 220–1530 px, x 60–960 px (logical y 110–765, x 30–480). Keep clear of the right-hand icon column and the bottom UI. | Standard title safe | Key content in the central 1010 px (the grid crops to 3:4). At least 60 px sides and 80 px top/bottom. |
| Hook | First 1 s: claim or contradiction. Show the payoff frame first. 3+ visual changes in the first 3 s. | Cold open under 30 s. One open loop by 2:00. Re-hook every 2–3 min. | Cover: 15 Korean characters or fewer, English headline, mascot. |
| Pace | Visual change every 2–4 s. Loopable ending. | Chapters. Switch between animation and screen recording every 30–60 s. | One idea per slide. Swipe cue. Page counter. |
| End | Loop back to the opening line | Recap + CTA + end screen | Save/share CTA slide |

## Research references

- Retention and hooks: OpusClip (Shorts hook formulas, caption practices), Nielsen Visual Attention (3+ scene changes in 3 s → +58% completion), Meta (65% of 3-s viewers reach 10 s), vidIQ / prepublish (long-form retention benchmarks: 40–50% average view percentage on 10–15 min videos; one open loop in the first 2 min).
- Style references: Kurzgesagt (bright flat characters, one idea per scene), Fireship (density and punchlines), ByteByteGo (step-by-step flow diagrams), 3Blue1Brown (one persistent visual, built up), Vibe Kanban's "mission control" explainer (agents moving cards), and 조코딩 (practical Korean follow-along).
- Card news: 뉴닉 (mascot-led explainer voice), 고구마팜 (the cover as a "thumbnail"), 캐릿 (casual tone), Ruben Hassid / Brij Kishore Pandey (big type, one tip per slide; overview map).
- Specs: Instagram grid 3:4 crop update (2025), carousels up to 20 slides, safe-zone guides (outfy, kreatli, veeso).
