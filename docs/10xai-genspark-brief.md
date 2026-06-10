# 10XAI — 5-Page Document Brief (for Genspark)

> **Purpose:** Source brief to generate a polished 5-page document / pitch deck in English.
> **Product:** 10XAI — *"Builder content, into verified modules."*
> **One-liner:** Paste any AI-builder post; 10XAI decomposes it into a Kanban board, fills the steps the author skipped, and measures security, cost, and reproducibility — exposing the gap between what was *claimed* and what actually *works*.
> **Tone:** Calm, measured, no hype. We speak in numbers ("claimed 5 min → measured 12 min"). The voice is the opposite of the content we audit.
> **Brand:** Light theme · Indigo `#6366F1` (brand/CTA) · Emerald `#059669` (verified). Stage colors: Decomposed=Blue, Verifying=Amber, Gate=Red, Verified=Green.

---

## PAGE 1 — The Problem & The Promise

**Headline:** *Social promises 10X. We measure what actually ships.*

**The problem**
- X, LinkedIn, YouTube and newsletters are flooded with "I built a full SaaS with one prompt" / "automate $10k/mo with this" content.
- These posts cherry-pick, hide costs behind bait paywalls, and silently skip the hard steps (env setup, secrets, security, real runtime).
- A reader who follows along loses hours — or money — discovering the gap the hard way.

**The promise of 10XAI**
- Paste the content (or a GitHub repo URL) → get an honest, measured breakdown in minutes.
- Every claim is decomposed, the omitted steps are surfaced, and the real cost / time / security risk is measured.
- The output is not an opinion — it's an evidence pile: **claim vs. measured**, side by side.

**Suggested visuals:** Split screen — left: a hype tweet ("build a SaaS in one prompt, free!"); right: the 10XAI board showing a red `⚠72` risk badge and "claimed free → measured $0.40 + broad OAuth scope."

---

## PAGE 2 — How It Works (The User Flow)

**Headline:** *Paste a link. Watch it get taken apart — and verified.*

**The flow (4 steps, shown as a pipeline)**
1. **Ingest** — Paste an **X** post, **LinkedIn** post, or **GitHub repo** URL. 10XAI fetches the text, follows links to the related GitHub repo, and pulls its README / skills.
2. **Decompose** — An AI agent breaks the content into ordered task cards ("the steps you'd actually have to do"), extracting each author *claim* (cost, time, "free").
3. **Verify** — Each card is judged for technical validity, security/policy risk, and claim exaggeration. A 0–100 risk score and badges are attached. High-risk cards stop at a **gate** for human approval.
4. **Run & Export** — Verified cards execute in a sandbox to measure real cost/time/success, then export as a runnable module (SKILL.md / JSON / CLI) + reports.

**The interface is a Kanban board with 4 columns:**
`Decomposed → Verifying → Gate / Review → Verified`

**Suggested visuals:** Horizontal pipeline diagram (Ingest → Decompose → Verify → Run/Export) above a 4-column Kanban board mock with cards flowing left to right.

---

## PAGE 3 — The Verification Engine (Why It's Trustworthy)

**Headline:** *Claim vs. Measured. The gap is the product.*

**Three things 10XAI surfaces that the original post hides:**

| Mechanism | What it does | Example output |
|---|---|---|
| **Gap-fill (gray cards)** | Inserts the prerequisite steps the author silently skipped | "(missing) .env setup + key security" |
| **Risk scoring + gate** | 0–100 security/policy risk per step; ≥70 is halted at the gate | `⚠72 — CLI executes arbitrary shell commands, no sandbox` |
| **Claim-vs-Measured** | Runs the step in a sandbox and records real cost/time/success | `claimed 5 min · free → measured 12 min · $0.40 ▲` |

**Real verification examples (from live runs):**
- *"Free trial"* claim → reality: requires **broad OAuth scope over your GitHub/GitLab repos** (risk 62).
- *"Deploy from chat"* → reality: hands an AI agent **irreversible, high-privilege actions with production credentials** (risk 74).
- *"One prompt, full app"* → a hidden card appears: **"Upgrade to a paid plan when you hit the free token limit."**

**Suggested visuals:** A single card "exploded" view — title, channel chip, risk gauge bar (red), and a claim→measured row with the worse value highlighted.

---

## PAGE 4 — Architecture (Why We Could Build It Fast)

**Headline:** *We didn't build a tool. We re-aimed a harness.*

**The insight**
10XAI is built on an existing multi-agent **Kanban harness** that already has all the hard infrastructure: task CRUD, free-form metadata, live SSE updates, a status machine with human review/approval, git-worktree isolation (= our sandbox), budget/cost tracking, and skill export.

**So we only had to build three new things:**
1. The **decompose entry** (ingest API → content/repo → cards)
2. The **sandbox measurement adapter** (real cost/time/success)
3. The **export exit** (verified board → SKILL.md / JSON / CLI + reports)

**Everything else is reused as-is:** storage, metadata, live updates, the gate, human approval, sandbox isolation, cost tracking, agent routing.

**Runs locally, no API key:** The board runs at `localhost:8080` (always-on daemon). Verify & execute run via the local Claude CLI on the user's subscription. Outputs accumulate in a Library.

**The re-aim, in one line:** change the *input* from "my work" to "someone else's builder content," and change the *verification target* from "code safety" to "content reproducibility & cost gap."

**Suggested visuals:** A diagram with a large "reused infrastructure" block (grayed) and three bright indigo blocks bolted on: Ingest · Sandbox · Export.

---

## PAGE 5 — Proof, Channels & Roadmap

**Headline:** *It already runs. Here's the evidence.*

**Live proof (verified end-to-end):**
- **Input:** `github.com/OpenHands/OpenHands` → decomposed into **7 cards in ~30s**, all in English.
- **Verify:** all 7 judged; **6 gated** with specific risk reasons (shell execution, broad OAuth, missing sandbox specs).
- **Input:** `github.com/stackblitz/bolt.new` → **8 cards**, including an auto-surfaced **"upgrade to paid plan"** hidden-cost card.

**Supported channels (POC → expansion):**
- **Now:** X (Twitter), LinkedIn, GitHub repos.
- **Next:** YouTube scripts, Medium, newsletters — same pipeline, just a new input parser.

**Roadmap**
- **Phase 1 (done):** Ingest → decompose → verify → gate, with a fully re-designed product UI.
- **Phase 2:** Sandbox measurement adapter (real cost/time), claim-vs-measured detail in every card.
- **Phase 3:** Export to runnable modules + 5 report types (reproducibility / cost-gap / security / failed-steps / summary); landing page; multi-channel demos.

**The pitch close:** *Builders sell the 10X dream. 10XAI hands you the receipts — verified, measured, and runnable — before you waste a weekend.*

**Suggested visuals:** A results strip with two real screenshots (OpenHands gated board, bolt.new "upgrade to paid" card) + a channel-icon row (X, in, GitHub now; YouTube, Medium, newsletter next).

---

### Design notes for Genspark
- **Palette:** Background light/white. Primary accent Indigo `#6366F1`. "Verified/pass" Emerald `#059669`. Risk red `#DC2626`, amber `#F59E0B` for mid-risk.
- **Typography:** Clean sans for body; a mono face (SF Mono / JetBrains Mono feel) for the `10X` logo mark, numbers, and code/claim values.
- **Motif:** Kanban cards, risk gauges, and "claimed → measured ▲" rows are the recurring visual language. Keep it data-dense but calm — no hype gradients.
- **Logo:** `10X` in indigo + `AI` in text color, numbers in mono.
