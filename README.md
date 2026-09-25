# 10XAI

### Builder content, into verified modules.

**Social promises 10X. 10XAI measures what actually ships.**

Paste any AI-builder post — an X thread, a LinkedIn post, a YouTube script, or a GitHub repo URL — and 10XAI decomposes it into a Kanban board, fills in the steps the author silently skipped, and measures **security, cost, and reproducibility**. The output isn't an opinion. It's an evidence pile: **what was *claimed* vs. what actually *works*.**

> *"Build a full SaaS with one prompt, free!"* → 10XAI board: `⚠72 risk` · *claimed free → measured $0.40 + broad OAuth scope over your repos.*

---

## The problem

X, LinkedIn, YouTube and newsletters are flooded with *"I built a full SaaS with one prompt"* / *"automate $10k/mo with this"* content. These posts cherry-pick, hide costs behind bait paywalls, and silently skip the hard parts — env setup, secrets, security, real runtime. A reader who follows along loses hours, or money, discovering the gap the hard way.

**10XAI hands you the receipts before you waste a weekend.**

---

## How it works

Paste a link. Watch it get taken apart — and verified.

```
  Ingest  ─►  Decompose  ─►  Verify  ─►  Run & Export
   (link)      (cards)      (risk+gate)   (modules+reports)
```

1. **Ingest** — Paste an **X** post, **LinkedIn** post, or **GitHub repo** URL. 10XAI fetches the text, follows links to the related repo, and pulls its README / skills.
2. **Decompose** — An AI agent breaks the content into ordered task cards ("the steps you'd actually have to do"), extracting each author *claim* (cost, time, "free").
3. **Verify** — Each card is judged for technical validity, security/policy risk, and claim exaggeration. A 0–100 risk score and badges are attached. High-risk cards stop at a **gate** for human approval.
4. **Run & Export** — Verified cards execute in a sandbox to measure real cost/time/success, then export as a runnable module (SKILL.md / JSON / CLI) + reports.

The interface is a **Kanban board** with four columns:

```
Decomposed  →  Verifying  →  Gate / Review  →  Verified
  (blue)        (amber)         (red)            (green)
```

---

## Claim vs. Measured — the gap is the product

Three things 10XAI surfaces that the original post hides:

| Mechanism | What it does | Example output |
|---|---|---|
| **Gap-fill (gray cards)** | Inserts the prerequisite steps the author silently skipped | `(missing) .env setup + key security` |
| **Risk scoring + gate** | 0–100 security/policy risk per step; ≥70 is halted at the gate | `⚠72 — CLI executes arbitrary shell commands, no sandbox` |
| **Claim-vs-Measured** | Runs the step in a sandbox and records real cost/time/success | `claimed 5 min · free → measured 12 min · $0.40 ▲` |

**Real verification examples (from live runs):**

- *"Free trial"* → reality: requires **broad OAuth scope over your GitHub/GitLab repos** (risk 62).
- *"Deploy from chat"* → reality: hands an AI agent **irreversible, high-privilege actions with production credentials** (risk 74).
- *"One prompt, full app"* → a hidden card appears: **"Upgrade to a paid plan when you hit the free token limit."**

---

## Live proof (verified end-to-end)

- **Input:** `github.com/OpenHands/OpenHands` → decomposed into **7 cards in ~30s** → **6 gated** with specific risk reasons (shell execution, broad OAuth, missing sandbox specs).
- **Input:** `github.com/stackblitz/bolt.new` → **8 cards**, including an auto-surfaced **"upgrade to paid plan"** hidden-cost card.

---

## Run it locally

10XAI runs entirely on your machine — a Kanban server at `localhost:8080` driven by the multi-agent pipeline. Verification and execution go through your local Claude CLI on your own subscription, so there's no hosted backend and no API key.

```bash
git clone https://github.com/tmuchal/10XAI.git
cd 10XAI
cp config.example.js config.js
cp .env.example .env
npm start
```

Then open **http://localhost:8080**, paste a tweet / LinkedIn post / GitHub repo URL into the input at the top, and click **Decompose**. The board fills with cards; verified, measured modules accumulate in `library/`.

> Requirements: Node ≥ 20 and the `claude` CLI on your PATH (it provides verification/execution auth). No `npm install` is needed for the core board — it runs dependency-free.

### What you get when you paste a link

Pasting `github.com/OpenHands/OpenHands` decomposes the content into ordered cards on the board:

```
[ Verifying ]  Install the OpenHands SDK as your agentic engine
[ Verifying ]  Run the OpenHands CLI as your starting point
[ Gate ]       Run agents on your laptop with the Local GUI      ⚠ risk: arbitrary shell execution
[ Pending ]    Try OpenHands Cloud free with the Minimax model   claim: "free" → check OAuth scope
```

Each verified module is exported with real measurements, e.g. from a `nutlope/llamacoder` run:

```
# nutlope/llamacoder — verified execution module
1. Clone the LlamaCoder repository        measured: 0.3 min · $0    · 97% success
2. Sign up and get a Together AI API key  measured: 5 min   · $0    · 92% success
   ...
```

The gap between the author's claim and the measured reality is the output.

---

## Architecture

10XAI runs as a local Kanban server driving a multi-agent verification pipeline. Paste a link and the content flows through five stages, each handled by its own agents:

1. **Decompose** — turn the post into ordered task cards and extract each author claim (`agents/decompose-agent.md`)
2. **Gap-fill** — surface the prerequisite steps the author skipped, as gray cards (`agents/gapfill-agent.md`)
3. **Verify** — score security / policy / reproducibility risk per card; high-risk cards stop at the gate (`agents/verify-agent.md`, `agents/verify-orchestrator.md`)
4. **Execute & measure** — run verified cards in an isolated git-worktree sandbox and record real cost, time, and success (`agents/exec-orchestrator.md`, `agents/exec-runner.md`, `lib/runner/`)
5. **Export** — package the verified board into a runnable module — SKILL.md / JSON / CLI — and accumulate it in the Library (`agents/deploy-agent.md`)

```
agents/   verification pipeline — decompose → gap-fill → verify → execute → export
server/   local Kanban server: REST API, live SSE updates, the review gate · http://localhost:8080
ui/       the board — paste-to-ingest hero, four stage columns, claim-vs-measured cards
lib/      agent runners, isolated git-worktree sandboxes, risk scoring & gate, cost tracking
```

---

## Channels & roadmap

**Now:** X (Twitter), LinkedIn, GitHub repos.
**Next:** YouTube scripts, Medium, newsletters — same pipeline, just a new input parser.

- **Phase 1 (done):** Ingest → decompose → verify → gate, with a full product UI.
- **Phase 2:** Sandbox measurement adapter (real cost/time), claim-vs-measured detail in every card.
- **Phase 3:** Export to runnable modules + 5 report types (reproducibility / cost-gap / security / failed-steps / summary); landing page; multi-channel demos.

---

**Builders sell the 10X dream. 10XAI hands you the receipts — verified, measured, and runnable — before you waste a weekend.**

Licensed under MIT — free to use, modify, and redistribute.

---

## Sports module: scout the opponent, pick the XI, win it from the bench

10XAI applies its claim-vs-measured approach to football (soccer) and basketball. It breaks down every player on the opponent's side: what kind of player they are, what they do well and badly, whether they're playing well *right now*, and where they're vulnerable. It then turns that into a game plan: the XI, the formation, and which substitution to make at which minute and score to raise the chance of winning. Every claim carries the number behind it, and the predictions are backtested against real results.

```bash
# real matches: free StatsBomb open data (every pass, shot + xG, duel, sub, location)
npm run sports -- import-statsbomb --competition 43 --season 106        # FIFA World Cup 2022
npm start                                                               # → http://localhost:8080/sports.html

npm run sports -- scout    --team France --us Argentina                 # opponent report + ranked recommendations
npm run sports -- profile  --team France --player "Kylian Mbappé"
npm run sports -- gameplan --us Argentina --them France --objective win
npm run sports -- subs     --us Argentina --them France --minute 70 --score 0-1
npm run sports -- backtest --sport soccer
npm run sports -- demo                                                  # fictional league with known "true" skills
```

**Getting match data**

| Source | How | Quality |
|---|---|---|
| **StatsBomb open data** | `import-statsbomb` or the 📥 Data tab: World Cups, Euros and some league seasons, free for non-commercial use with attribution | Professional event data with xG and locations |
| **Video tagging** (`/sports-tagger.html`) | Watch the YouTube match in an embedded player (no download). One keypress logs an action at the synced match clock; one click on the pitch adds its location. Handles substitutions. Saves straight into analysis. | As good as the tagger. This is how analysts work from video |
| Event CSV/JSON | `import`: `t,team,player,type,outcome,x,y,xg` | Output from any tracker or spreadsheet |
| YouTube commentary | Transcript → events (EN/KR rules, or the `claude` CLI) | Headline actions only |

Downloading YouTube video or captions breaks YouTube's ToS without the rights holder's permission, so those steps are risk ≥ 70 cards that **stop at the gate**. The tagger uses the official embed instead.

**What you get**

| Layer | What it measures |
|---|---|
| **Player profile** | Ratings 1–99 **vs. the same position line**: passing, progression, shooting (xG), creativity, dribbling, defending (possession-adjusted), 1v1 duels, aerial, pressing, goalkeeping (goals prevented vs. xG), discipline. Each strength and weakness shows its stat. Plus: archetype (e.g. *Dribbling winger*, *Deep-lying playmaker*, *Stopper*), per-match ratings (6.5 = an average game), form (last 3 vs. season), pitch zone, late-game fatigue, and **how to play against them**. |
| **Scouting report** | Style vs. every team in the data (possession, directness, pressing height, shot quality, aerial…); where they attack and **which flank concedes xG** (credited to the build-up flank, not the shot spot); who gets dribbled past; goals by 15-min period; dependency on one player; key threats; weak links; **ranked recommendations**, each with the triggering number. |
| **Match plan** | Best XI and formation for your objective (league points / knockout win / avoid defeat) against *this* opponent, with an attacking boost toward their leaky flank. Pre-planned subs for 60'/70' × level/behind/ahead. What they are likely to target in you. |
| **Live subs** | Minute + score + who's on → every single and double change scored on the objective, with the win/loss probability change and the reason (measured fatigue, attack/defence delta, the incoming player's profile). Says "hold" when nothing helps. |

**How it's built**: per-event valuation (xG-based, possession-adjusted) → player attack/defence contributions → lineup-adjusted Poisson on top of results-based Elo → live match state (current score + remaining time). Fatigue is each player's **drop in success rate on passes and duels after 60 minutes on the pitch**, shrunk toward the position average.

**Measured, not claimed**

Real data, FIFA World Cup 2022 (64 matches; 54 predicted walk-forward, each from earlier data only):

| | Accuracy (H/D/A) | Brier |
|---|---|---|
| Model | **50.0%** | **0.635** |
| Same model, lineups ignored | 48.1% | 0.640 |
| No-skill baseline | 20.4% | 0.691 |

Scouting France *before* the 2022 final, using only their earlier matches, flagged Messi as carrying 37% of Argentina's chance creation, and Argentina as a side that concedes late (50% of goals conceded after 75', vs. 24% for the rest of the tournament). France scored at 80' and 81'. It did **not** foresee Argentina's first-half success down France's right: France's conceded xG was split evenly across flanks.

Synthetic league with hidden "true" skills (`test/sports.test.cjs`):

| Check | Result |
|---|---|
| Attribute rating vs. true skill (correlation, 4 leagues) | passing 0.96 · pressing 0.93 · aerial 0.89 · defending 0.87 · dribbling 0.84 · shooting 0.79 · duels 0.70 |
| Weaker defensive flank identified | 22 / 32 teams (r = 0.56) |
| Measured fatigue vs. true stamina | r ≈ 0.2–0.3: a real but weak signal, so it's shrunk and capped |
| Lineup-awareness in the backtest | No gain in simulation, where a rotation shifts true goals by ~7% (undetectable in 112 matches). Small gain on real World Cup data. Lineup effects are therefore damped (±25% max). |

**Limits:**
- Automatic player tracking from raw video (computer vision) is not included; events come from tagging, StatsBomb, or a tracker's CSV.
- Recommendations are leads to check on video, not orders. Reports say when a team has too few matches ("low confidence").
- Basketball has ratings, prediction and backtest, but not the scouting and tactics layer yet.
