# 10XAI — Spec Section 5 "Work Actually To Be Done" (board-structure mapping)

> A rewrite of Section 5 — originally written against a generic kanban harness — pinned to the **actual files, functions, and lines of this board (agent-kanban-harness)** received via `init`.
> Product definition: paste AI builder content (tweets/LinkedIn/YouTube/newsletters) → decompose into a kanban board → fill in omitted steps (gray cards) → measure security/cost/reproducibility → export as verified execution modules. **POC = X (Twitter) first.**

---

## 0. Data Model Extension — the root of all work

A task is one `~/.claude/tasks/10XAI/<id>.json` file = one card. Key point: **`metadata` is a free-form shallow-merge, so it accepts new fields as-is with no schema validation** (`server/kanban.cjs:403` `Object.assign({}, task.metadata, data.metadata)`). In other words, fields can be added with no migration.

`metadata` fields to add (all new, no validation needed):

| Field | Meaning | Stage that writes it |
|---|---|---|
| `metadata.kind` | `"original"` \| `"gapfill"` | decompose/gapfill. Gray card = `gapfill` |
| `metadata.sourceChannel` | `"x"` \| `"linkedin"` \| ... | input channel (POC=x) |
| `metadata.claim` | `{ cost, timeMin, free }` — the author's claimed values | decompose |
| `metadata.measured` | `{ cost, timeMin, exitCode, failed }` — measured values | measure |
| `metadata.risk` | `{ score:0..100, flags:["secret-exposure",...] }` | verify |
| `metadata.badges` | `["security","cost-gap","unreproducible"]` | verify |
| `metadata.gate` | `{ status:"open"\|"blocked"\|"passed", reason }` | move gate |
| `metadata.runner` | (existing) `claude`/`codex`/`both`/sandbox adapter | measure |

> Almost no code change — `createTask` (`kanban.cjs:330`) / `updateTask` (`:373`) already preserve arbitrary metadata. The SSE broadcast (`:818`, `:1589` file watch) also passes metadata straight through to the UI. **Only the UI render needs to read these fields.**

---

## 1. Five-Agent Pipeline → restructure `agents/*.md`

Replace the existing 5 agents (frontend/backend/deploy-gate/monitor/reviewer) with **5 stages of a content-verification pipeline**. The agent definition format stays the same (`agents/_TEMPLATE.md:1-8` frontmatter: `name/mission/runner/group/model_default/tools_allowed/worktree/escalation/owns`). Routing is handled by the orchestrator (`agents/orchestrator.md:51-57`).

| # | New agent file | Role | runner | Mapped existing mechanism |
|---|---|---|---|---|
| 1 | `agents/decompose-agent.md` | pasted content → decompose into N cards, extract `claim` | `claude` | New. Input trigger = §4 ingest API |
| 2 | `agents/gapfill-agent.md` | steps the author omitted → insert **gray cards** (`kind:"gapfill"`) | `claude` | adapts the detector pattern (`lib/detect/_template.cjs:33`) |
| 3 | `agents/verify-agent.md` | security/policy risk score + badge assignment | `reviewer:codex` | detector alert schema (`source/signal/severity/routesTo/evidence`, `_template.cjs:15-25`) |
| 4 | `agents/measure-agent.md` | sandbox execution → measure cost/time, record `measured` | `sandbox` (new adapter) | runner adapter (`lib/runner/index.cjs:30`) + worktree isolation |
| 5 | `agents/export-agent.md` | 5 reports + SKILL.md/JSON module export | `claude` | skill format (`skills/*.md`) + §5 |

Write the 5 by copying `agents/_TEMPLATE.md`. Delete `frontend/backend/deploy-gate/monitor/reviewer-codex.md` or deactivate them with `group: legacy`. Replace the orchestrator routing rules (`orchestrator.md:51-57`) with "sequential progression through content stages."

---

## 2. Card Move Gate — insert into `updateTask`

**There is currently no gate on state transitions at all.** `updateTask` (`kanban.cjs:386-431`) accepts any status string as-is (`:386` `if (data.status !== undefined && data.status !== task.status)`). This is the exact insertion point.

Design:
- Insert the gate check **immediately before** `task.status = data.status` at `kanban.cjs:388`.
- Safe transition (low risk) → auto-pass.
- Risky transition (`metadata.risk.score ≥ THRESHOLD` or a security flag) → force status back to `in_review` and record `metadata.gate = {status:"blocked", reason}`. Same as an existing pattern: quarantining to `in_review` on executor failure (`:418`, `:1169`).
- Human approval **reuses** the existing `POST /api/tasks/:id/review` (`:1702`, `approve`→completed `:1720` / `reject`→pending `:1725`) as-is. No new approval UI needed.

The gate decision logic borrows the `runStage` (`:37`) / `finalize` (`:81`) structure from `lib/gate/index.cjs` — except it evaluates "transition rules" instead of deploy commands. The auto-creation of a human-review card on failure (`notifyFailure:135`) can be reused too.

---

## 3. Gapfill · Verify · Measure — insert 3 actions into the card processing flow

All three actions are performed by the §1 agents, and the results are written into the §0 metadata. The UI reads them and renders (not §4 — the UI lives here).

### 3a. Gapfill → gray card
- gapfill-agent creates a missing step via `POST /api/tasks` with `metadata.kind:"gapfill"` and `parentId` = the original card.
- **UI render**: in `ui/kanban.html` `taskCardHTML()` (`:660-674`), if `t.metadata.kind==="gapfill"`, give `.tc` a `data-type="gapfill"` → CSS renders it gray/striped (using `tokens.css`'s `--st-idle-bg/fg`). The insertion point is the card div creation (`:668`).

### 3b. Verify → badges + risk score
- verify-agent records `metadata.risk` / `metadata.badges`.
- **UI render**: in the `.tc-meta` block of `taskCardHTML()` (`:671`), inject risk/cost/security badges after the runner badge. Reuse the existing badge CSS pattern (`.tc-pri` / `.tc-tag` / `.tc-rn`, `:182-216`). Add only the new class `.tc-badge`.

### 3c. Measure → sandbox execution
- **New runner adapter** `lib/runner/adapters/sandbox.cjs`. Same interface as the existing adapters: `async run(task, opts) → { runner, verdict, confidence, reportPath, duration_ms, summary }` (cf. `adapters/claude.cjs:93`).
- Isolation = use the existing git worktree (`lib/runner/worktree-manager.cjs:24` `createWorktree`) as the sandbox as-is. Time = `duration_ms` is already measured. Cost = extend the token/call aggregation pattern in `budget.cjs:20-35`.
- Add `case "sandbox"` to the `index.cjs:30` `runTask` dispatcher (`:35-47` routing block).
- Record the result in `metadata.measured` → the `claim` vs. `measured` gap surfaces on the card.

> Card assignment is already handled by the board (orchestrator routing + auto-pickup `config.autoPickup`). **Just connect** it.

---

## 4. Input Entry (IN) — paste content → trigger decomposition

Spec: "paste one chunk of text → a static decomposition board draft within a minute."

- **UI**: add a **large textarea + channel selector (X/LinkedIn...) + "Decompose" button** to the existing "+ New card" modal (`ui/kanban.html` `openNewTaskModal()` `:692` / `createNewTask()` `:711`). Or a dedicated paste panel in the header.
- **New API** `POST /api/ingest { content, channel }` (add to the router in `kanban.cjs`; cf. the existing route pattern `:1664`). Behavior: run decompose-agent → create N cards → they immediately appear on the board via SSE (`broadcast :818`).
- **Two-stage flow**: ① static decomposition (instant, gray cards + first-pass risk flags) → ② background dynamic verification (verify+measure fill in `measured` per card). Reuse the watch scheduler (`lib/watch/scheduler.cjs`) as the background runner.

---

## 5. Output Entry (OUT) — export the verified board as modules

The spec's three final deliverables: ① a visualized board ② 5 reports ③ execution modules (CLI · SKILL.md · JSON).

- **New skill** `skills/export.md` (format: same frontmatter as `skills/gate.md:1-6`).
- **New API** `POST /api/export/:format` (`format` = `skill|json|cli`). Reads the verified board and produces:
  - `SKILL.md` — frontmatter + per-stage body. **Hardcode the "safe section = auto-execute, risky section = manual gate" structure into the module** (serialize the §2 gate metadata).
  - `JSON` — cards + full claim/measured/risk.
  - `CLI` — an executable script.
- Reuse the existing skill-create mechanism (`metadata.resourceAction:{kind:"skill-create"}`, file creation on completion `kanban.cjs:404`) to drop the export results into `skills/`.
- **5 reports**: reproducibility / cost-gap / security / failed-cards / summary. Borrow the report.md generation pattern from `lib/gate/finalize` (`:81`), output to `data/runs/`. The `/standup` skill (`skills/standup.md`) already has a report aggregation pattern.

---

## 6. 3-Day Hackathon Mapping (per the spec)

| Day | Goal | What to touch on this board |
|---|---|---|
| **D1** | Decompose + board display | §0 metadata, §1 decompose/gapfill agents, §4 ingest API + paste UI, §3a gray card render |
| **D2** | Verify + measure + gate | §3b badges/risk (verify-agent), §3c sandbox adapter (wire up just 1~2 tools), §2 move gate, claim-vs-measured detail on card click (modal `openTaskModal :733`) |
| **D3** | Demo + extensibility + landing | preprocess 3~4 X cases, run 1 LinkedIn post through the same pipeline (proving channel extension), §5 export, landing page |

---

## 7. New vs. Reused Summary

**Newly written**: `agents/{decompose,gapfill,verify,measure,export}-agent.md`, `lib/runner/adapters/sandbox.cjs`, `skills/export.md`, `POST /api/ingest`, `POST /api/export/:format`, UI paste panel + badge/gray-card CSS.

**Reused (nearly as-is)**: task storage/CRUD (`kanban.cjs`), free metadata extension, SSE live updates, status machine + review approval, worktree isolation = sandbox, budget cost tracking, detector alert schema, gate report generation, skill-create file output, orchestrator routing, ops-thread/Telegram mirror.

**Key insight**: this harness **already has all** the infrastructure to "bundle AI work products into cards, verify them, block them with gates, measure them, and export them as modules." 10XAI is a **re-aim** effort that changes the input from "my own work instructions" to "someone else's builder content," and changes the verification target from "code safety" to "content reproducibility · cost gap." The only new things to build are 3: the decomposition entry, the measurement adapter, and the export exit.
