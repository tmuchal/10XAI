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

## How it runs

10XAI is implemented as a **local application** — a Kanban server at `localhost:8080` driven by the multi-agent pipeline. Verification and execution run through the local Claude CLI on your own subscription, so there's no hosted backend and no API key. Untrusted content is decomposed, risk-scored, and executed inside an isolated sandbox on your own machine, and verified modules accumulate in a local Library.

This repository is a **product overview**, not a distributable build.

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
