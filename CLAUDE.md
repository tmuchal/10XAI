# 10XAI — Operating Rules

**10XAI verifies whether the AI workflows, prompts, and skills flooding social media actually work.** Paste any post — a tweet, a LinkedIn post, a YouTube script, a newsletter, or a GitHub repo URL — and 10XAI decomposes it into a Kanban board, fills in the steps the author skipped, flags security / terms-of-service / policy risks, then runs it in an isolated sandbox to measure real cost, time, and reproducibility. The result is a verified, execution-ready module (CLI, SKILL.md, or JSON): safe steps run automatically, risky steps require manual approval.

It runs locally as a Kanban server at `http://localhost:8080`. Verify and execute go through the local `claude` CLI on your own subscription — no API key. Outputs accumulate in `workspace/` and `library/`.

## Response language
Write user-facing responses, instructions, and reports in English.

## Layout

| Path | Purpose |
|---|---|
| `server/kanban.cjs` | Kanban server + REST API + live SSE. `npm start`. |
| `ui/` | The board UI — paste-to-ingest hero, four stage columns, claim-vs-measured cards. |
| `agents/*.md` | Pipeline agent definitions. Frontmatter (`name`, `mission`, `runner`, `owns`, …) + body. Copy `_TEMPLATE.md` for a new agent. |
| `lib/runner/*` | Agent runner. `claude` / `codex` / `both` / `reviewer:*` adapters, isolated git-worktree sandboxes, budget/cost tracking. |
| `lib/gate/index.cjs` | The gate that holds risky cards for manual approval. |
| `lib/config.cjs` | Config loader. Reads `config.js` or `config.example.js`, `.env`, and env overrides. |
| `lib/model/card.cjs` | Task/card model. |
| `config.example.js` / `config.js` | Config. Copy the example to `config.js`; `config.js` is gitignored. |
| `.env.example` / `.env` | Optional tokens (Slack, etc.). Never commit `.env`. |

## The verification pipeline

Content flows left to right through the board: **Decomposed → Verifying → Gate / Review → Verified.** Each stage is owned by its agents:

1. **Decompose** (`agents/decompose-agent.md`) — content → ordered task cards; extract each author claim (cost, time, "free").
2. **Gap-fill** (`agents/gapfill-agent.md`) — insert the prerequisite steps the author skipped, as gray cards.
3. **Verify** (`agents/verify-agent.md`, `agents/verify-orchestrator.md`) — score security / policy / reproducibility risk per card. High-risk cards stop at the gate.
4. **Execute & measure** (`agents/exec-orchestrator.md`, `agents/exec-runner.md`, `agents/router-agent.md`, `agents/tool-runner.md`, `agents/env-agent.md`, `agents/build-agent.md`, `agents/secrets-agent.md`, `agents/integration-agent.md`, `agents/repair-agent.md`) — run verified cards in an isolated sandbox; record real cost, time, success in `metadata.measured`.
5. **Export** (`agents/deploy-agent.md`) — package the verified board into a runnable module (SKILL.md / JSON / CLI) and add it to the Library.

## Server & config

- Start: `npm start` or `node server/kanban.cjs`. Default port 8080 (`PORT` env or `config.js → kanbanPort`).
- API base: `http://localhost:8080/api/`.
- Config resolution: `config.js` → `config.example.js` fallback → env overrides. The repo-root `.env` is loaded automatically.

## Task lifecycle & API

States: `pending` → `in_progress` → `in_review` → `completed`. Card `metadata` is a free-form shallow merge — stages add fields (`kind`, `claim`, `measured`, `risk`, `badges`, `gate`) with no schema migration.

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/tasks` | — | List all tasks |
| POST | `/api/tasks` | `{ subject, description, agent?, priority?, metadata? }` | Create |
| PUT | `/api/tasks/:id` | `{ status?, metadata?, … }` | Update |
| DELETE | `/api/tasks/:id` | — | Delete |
| GET | `/api/agents` | — | Agent registry (from `agents/*.md` frontmatter) |
| GET | `/events` | — | SSE stream of board updates |

## The gate

Risky cards (security / policy / high risk score) stop at the **Gate / Review** column and require explicit human approval before they execute. Safe cards run automatically. This is the core safety contract of the product — never auto-run a card the verify stage flagged as risky.

## Absolute rules

1. Never auto-execute a card the verify stage flagged as risky — it waits at the gate for a human.
2. Run untrusted content only in the isolated git-worktree sandbox, never against the host.
3. Do not store plaintext secrets in logs or committed files. Use `.env`.
4. Do not commit `.env` or `config.js`. Both are gitignored.
5. Report claims in numbers — claimed vs. measured — not opinions.
