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

10XAI runs entirely on your machine. The board is an always-on local daemon; verify & execute run through your local **Claude CLI** on your own subscription — **no API key to wire up.**

```bash
git clone https://github.com/tmuchal/10XAI.git
cd 10XAI
cp config.example.js config.js && cp .env.example .env
npm start
```

Open **http://localhost:8080**, paste a link into the Hero input, and watch the board fill. Verified outputs accumulate in a local **Library**.

> Requires Node ≥ 20 and the `claude` CLI on your PATH. `npm install` is only needed for the optional Slack/Telegram mirror — the core board, ingest, verify, and gate run with zero dependencies.

---

## Architecture — we didn't build a tool, we re-aimed a harness

10XAI is built on a battle-tested multi-agent **Kanban harness** that already ships the hard infrastructure: task CRUD, free-form metadata, live SSE updates, a status machine with human review/approval, git-worktree isolation (= our sandbox), budget/cost tracking, and skill export.

So we only had to build **three new things**:

1. **Decompose entry** — ingest API → content/repo → cards (`agents/decompose-agent.md`, `agents/gapfill-agent.md`)
2. **Sandbox measurement adapter** — real cost/time/success (`lib/runner/`)
3. **Export exit** — verified board → SKILL.md / JSON / CLI + reports

Everything else is reused as-is: storage, metadata, live updates, the gate, human approval, sandbox isolation, cost tracking, agent routing.

**The re-aim, in one line:** change the *input* from "my work" to "someone else's builder content," and change the *verification target* from "code safety" to "content reproducibility & cost gap."

```
agents/      five-stage verification pipeline (decompose → gapfill → verify → measure → export)
server/      local kanban daemon (SSE, task CRUD, gate)  ·  http://localhost:8080
ui/          the product board — Hero ingest, 4 columns, claim-vs-measured cards
lib/         runner adapters · sandbox isolation · risk/gate · detectors
docs/        product spec & build plan (10xai-build-plan, ux-spec, genspark-brief)
```

---

## Channels & roadmap

**Now:** X (Twitter), LinkedIn, GitHub repos.
**Next:** YouTube scripts, Medium, newsletters — same pipeline, just a new input parser.

- **Phase 1 (done):** Ingest → decompose → verify → gate, with a fully re-designed product UI.
- **Phase 2:** Sandbox measurement adapter (real cost/time), claim-vs-measured detail in every card.
- **Phase 3:** Export to runnable modules + 5 report types (reproducibility / cost-gap / security / failed-steps / summary); landing page; multi-channel demos.

---

**Builders sell the 10X dream. 10XAI hands you the receipts — verified, measured, and runnable — before you waste a weekend.**

MIT License.
