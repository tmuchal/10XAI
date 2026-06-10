# agent-kanban-harness — Operating Rules

This repo is a **kanban board + multi-agent (Claude + Codex) ops/dev harness**. It consists of a kanban server with a REST API, an orchestrator and specialist agents, incident playbooks, a 24h watch/detect loop, a subagent runner, and a pre-deploy gate. It runs alongside the application repo (`config.js → repoPath`) and drives that repo. The application code is not included in this repo.

## Response language — MUST FOLLOW
**Whatever agent CLI you work with (Claude Code, Codex, etc.), write every
user-facing response, instruction, question, and report in English.** Code comments
and git commit messages may be in English as well; output addressed to people defaults to English.

## Layout

| Path | Purpose |
|---|---|
| `server/kanban.cjs` | Kanban dashboard + REST API + SSE. `npm start`. |
| `ui/` | dashboard HTML + token CSS. |
| `agents/*.md` | Agent definitions. frontmatter (`name`, `mission`, `runner`, `owns`, …) + body. Copy `_TEMPLATE.md` for a new agent. |
| `playbooks/*.html` | One-page incident runbooks. Start a new runbook from `_TEMPLATE.html`. |
| `lib/config.cjs` | Config loader. Reads `config.js` or `config.example.js`, `.env`, and env overrides. |
| `lib/watch/scheduler.cjs` | 24h watch loop. Runs detectors and turns findings into tasks. |
| `lib/detect/*` | Monitoring detectors (`sentry`, `vercel`, `_template`) + `rules.json`. |
| `lib/runner/*` | Subagent runner. `claude` / `codex` / `both` / `reviewer:*` adapters, git worktrees, budget. |
| `lib/gate/index.cjs` | Pre-deploy gate. Runs `config.js → deployCommands` fail-fast. |
| `hooks/` | `pre-push.sample` (installs the gate as a git hook), `launchd.plist.template` (24h daemon, includes a cron line in the comment). |
| `skills/` | Reusable Claude Code skill stubs. `/standup`, `/triage`, `/gate`, `/archive`. |
| `docs/` | `the-pattern.md` (why), `adapting-to-your-project.md` (how), `example-saas.md` (worked case study). |
| `config.example.js` / `config.js` | Per-project config. Copy the example to `config.js`; `config.js` is gitignored. |
| `.env.example` / `.env` | Tokens (Slack / Sentry / Vercel / Telegram / …). Never commit `.env`. |

## Ops Thread (Telegram mirror)

The right-side panel of the dashboard is an append-only thread shared by the operator and the agents. If `.env` contains `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, it mirrors bidirectionally with a Telegram chat. Outbound uses `sendMessage`; inbound uses long-poll `getUpdates`.

On task create/start/complete, the kanban server also posts `📋 #N` / `▶️ #N` / `✅ #N` messages to both sides. Agents record progress via `POST /api/ops-thread/append` (role: `claude` / `agent` / `system`). The operator replies via the panel input or a Telegram reply. If token/chatId are absent, only the mirror is disabled and the panel still works as a local thread. Follow the "Ops Thread (Telegram mirror)" section of the README for setup.

## Server & config

- Start: `npm start` or `node server/kanban.cjs`. The default port is 8080 (`PORT` env or `config.js → kanbanPort`).
- API base: `http://localhost:8080/api/`.
- Config resolution: `config.js` → `config.example.js` fallback → env overrides. The `.env` at the repo root is loaded automatically (so tokens are visible under launchd / cron too).

## Kanban-first instruction protocol — MUST FOLLOW

Every user instruction becomes a kanban task **before** any work starts. This is the orchestrator's first duty (`agents/orchestrator.md`), and it applies to every agent.

Mandatory user clause: every task carried out on this board must first be
registered as a kanban card (task) before it starts. Work done through a
conversation with Claude Code or Codex becomes a card too, without exception.
Never start without a card. This rule is identical to the CLAUDE.md rule block
that `setup --guided` plants in the target repo (`config.js → repoPath`). The
harness is the rein that keeps the AI in check — a bundle of design + files +
procedure — and the kanban card is the first link by which that rein actually works.

1. On receiving an instruction, `POST /api/tasks` — `{ subject, description, agent, metadata.runner, priority }`. Record the verbatim instruction in `description`.
2. Set `agent` / `metadata.runner` / `priority` according to the routing rules in `agents/orchestrator.md`.
3. Start work only after moving the task to `in_progress`.
4. On completion, record `reportPath` + `reportSummary` and move it to `completed`.
5. Report start / key progress / completion via `POST /api/tasks/{id}/slack`, not a raw webhook.

**Exception — incident response**: a production-impacting incident or a 1-line, obviously-reversible hotfix may be handled immediately. But within one hour, create a post-hoc task tagged `metadata.source = "incident-response"` and record what was done and the follow-up actions. All other refactors, docs, features, and ordinary bugs follow step 1 onward. See `docs/the-pattern.md` → "Kanban-first".

**Exception — bootstrap**: the bootstrap commands that stand up the harness itself
— `init`, `setup`, `start`, `update`, `doctor` — are not subject to prior task
registration, since the board does not yet exist or was just created. The seed
task `#1` "Set up this board" that `init` registers fills that role instead. All
work after bootstrap follows step 1 onward.

## Task lifecycle & API

States: `pending` → `in_progress` → `in_review` → `completed`. Only the orchestrator performs status transitions. `completed` requires `reportPath` + `reportSummary`.

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/tasks` | — | List all tasks |
| POST | `/api/tasks` | `{ subject, description, agent?, priority?, metadata? }` | Create |
| PUT | `/api/tasks/:id` | `{ status?, reportPath?, reportSummary?, metadata?, ... }` | Update |
| DELETE | `/api/tasks/:id` | — | Delete |
| POST | `/api/tasks/:id/slack` | `{ text }` | Post a note to Slack for this task |
| GET | `/api/agents` | — | Agent registry (from `agents/*.md` frontmatter) |
| GET | `/api/agents/:name/full` | — | One agent's full definition |
| GET | `/api/activity?since=&limit=` | — | Activity log |
| GET | `/events` | — | SSE stream of board updates |

## Multi-agent cross-validation

- `runner: claude` / `codex` — single model. For deterministic, mechanical work.
- `runner: reviewer:codex` — Claude implements and Codex reviews. The default for implementation work.
- `runner: both` — Claude + Codex run independently, then diff. Disagreements move to the "needs human" column. Use for high-stakes work like migrations, access-control, and money paths. The disagreement is the safeguard.
- Auto-promote: if severity ≥ `CROSS_VALIDATION_THRESHOLD`, a single-model task may be promoted to `both`.
- The second model's daily cap is `DAILY_CODEX_BUDGET`; the fallback chain is `MODEL_FALLBACK_CHAIN`.

For details, see `docs/the-pattern.md` → "Cross-validation".

## Selvedge boundaries

Each agent declares an `owns:` glob relative to `config.js → repoPath`. Agents stay within their own area and the orchestrator routes by ownership. Shared surfaces like shared types, dependency manifests, and migrations need cross-checking, and that is where `runner: both` becomes meaningful. Keep `owns:` globs non-overlapping where possible.

## Pre-deploy gate

`lib/gate/index.cjs` runs `config.js → deployCommands` serially and fail-fast from `config.js → repoPath`, and optionally performs a bundle-size inspection. `hooks/pre-push.sample` runs the gate on `git push`. On failure, it blocks the push and auto-creates a "needs human" task. The only bypasses are `git push --no-verify` or `KANBAN_GATE_BYPASS=1 git push`; the latter is recorded in `data/runs/overrides.jsonl` and reviewed at standup.

## Absolute rules

1. Do not ship without passing the gate or an auditable override.
2. Do not force-push the main branch.
3. Do not commit `.env` or `config.js`. Keep both gitignored.
4. Do not cross a selvedge boundary. An agent edits only the area it `owns`.
5. Do not store plaintext secrets in `data/`, logs, or committed files. Use `.env`.
6. Register a user instruction as a kanban task first. The only exception is incident-response.
7. Do not auto-merge a `runner: both` disagreement. A human decides.
