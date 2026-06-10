# agent-kanban-harness

A **week-3+ tool for the 6-week AI harness intensive**. From week 1-2 onward, it's a standalone kanban harness for learning evaluation systems, automation, and operations alongside your student project.

## New here?

This package isn't your app code itself — it's a student harness that sits alongside it and ties your AI work together with cards, agents, and verification steps.
You start using it in week 3. Write down the **one target task** you picked in week 1 as your `goal`, then spend the 6 weeks completing the automation of that task.
To install, just paste the single install-prompt block below into Claude Code or the Codex CLI.
The name you pass to `init` isn't just a folder name — it's the **project name**, and it doubles as this board's `boardDir` isolation key.
Lowercase letters and hyphens are recommended. Example: `npx agent-kanban-harness init my-todo-app`
Once the board comes up, start `setup --guided` from the first card, `#1`.

## Install prompt (Claude Code / Codex)

Paste the prompt below verbatim into Claude Code or the Codex CLI.

```text
This repo is agent-kanban-harness. It is a week-3+ tool for the 6-week AI harness intensive.
First, read the README and CLAUDE.md. All responses visible to the user must be in Korean.

Installation steps:
1. If the board doesn't exist yet: run npx agent-kanban-harness init my-todo-app.
   Here, my-todo-app is the project name and the boardDir isolation key.
2. Always run the local kanban server in the background — if you run it in the foreground,
   the server shuts down when the command ends:
     npx agent-kanban-harness start
3. Once the server is up, give the user the board URL at http://localhost:8080.
4. Move the board's first task (#1) "Set up this board" to in_progress, and
   use setup --guided to define the following five things together with the user:
   - the absolute path of the project this harness will drive (repoPath)
   - the location of golden data (golden/ folder; leave empty if none)
   - the agent configuration (the specialist agents you need)
   - the evaluation loop level (single-model / review / cross-validation)
   - goal: the one target task you picked in week 1. What you'll achieve after 6 weeks.

■ Absolute rule — applies throughout this session
After this install, no matter what you ask me to do (writing code, creating files,
setting up agents, refactoring, anything), I first register a kanban
task (card) by POSTing to http://localhost:8080/api/tasks and move it to
in_progress before starting any work.
When the work is done, I leave a reportSummary and move it to completed.
I never start without a card. "It's simple" or "they asked me to just do it" are not exceptions.
This is this board's absolute rule, and it applies to every instruction during this session.

A harness = the reins that keep the AI in check = a bundle of design + files + procedures.
CLAUDE.md is the master prompt.
Operate with Claude as the consultant (planning/review) and Codex as the junior developer (file work).
```

## Student install workflow

The recommended flow is **GitHub Template → your own repo → commit → update**.

1. Click **Use this template** on GitHub → create a new repo under your account
2. Clone it locally, then run the Claude Code install prompt
3. Review the `setup --guided` results and make your first commit
4. When a new instructor version ships, run `npx agent-kanban-harness update --diff` and apply only the changes you need

The core features (board, init, setup, gate) work without installing any dependencies. You only need to run `npm install` once in the board folder when you want to use the Slack/Telegram mirror.

The existing npx install path is still supported.

## What this tool does

`agent-kanban-harness` is a template for running multiple AI workers — like Claude + Codex — on a kanban board. A human instruction first becomes a task, then the orchestrator decides on the specialist agent and the verification level. Work runs in an isolated git worktree, a pre-deploy gate blocks build/test failures, and a 24h watch loop turns monitoring anomalies into tasks.

This harness does not include any app code inside the application repo. It **drives the project from alongside it**, the project pointed to by `config.js → repoPath`.

## Installation

### A. GitHub Template method

1. On **[github.com/Zakedu/agent-kanban-harness](https://github.com/Zakedu/agent-kanban-harness)**, click **Use this template** → **Create a new repository**.
2. Clone the new repo, then proceed to [Quick start](#quick-start).

```bash
gh repo create my-todo-app --template Zakedu/agent-kanban-harness --private --clone
cd my-todo-app
```

### B. npx CLI method

```bash
npx agent-kanban-harness init my-todo-app
```

`my-todo-app` is the project name. This name creates the `./my-todo-app` board directory, and the same value is used as the `boardDir` isolation key. Lowercase letters and hyphens are recommended.

A single `init` scaffolds the board, registers the first kanban task (`#1`), and starts the local kanban server, opening the board at `http://localhost:8080`. From there, run `setup` together with Claude Code from board task `#1`.

To scaffold only, without starting the server, add `--no-start`.

```bash
npx agent-kanban-harness init my-todo-app --no-start
```

Commands you can run directly from the package:

```bash
npx agent-kanban-harness start          # start the kanban server
npx agent-kanban-harness watch          # run the 24h watch scheduler
npx agent-kanban-harness gate           # run the pre-deploy gate
npx agent-kanban-harness setup --guided # generate config.js + agents/*.md
npx agent-kanban-harness doctor         # check CLI/config/privacy readiness
npx agent-kanban-harness whoami         # check the Telegram chat id
npx agent-kanban-harness --version
```

### npm publish (maintainer only)

```bash
# bump version first
npm version patch   # or minor / major

npm publish --access public
```

`npm publish` requires being logged in via `npm login` and having push access to `Zakedu/agent-kanban-harness`. The files that actually go into the tarball are determined by the `files` field in `package.json`.

## Architecture

```
                                  ┌─────────────────────────────┐
   you / Slack / API ──────────▶  │  kanban server (REST + SSE) │  ◀── browser dashboard
                                  │  server/kanban.cjs · ui/    │
                                  └──────────────┬──────────────┘
                                                 │ tasks
                                       ┌─────────▼─────────┐
                                       │   orchestrator    │  routes by owns globs,
                                       │  agents/orch...md │  sets runner, manages state transitions
                                       └─────────┬─────────┘
                       ┌─────────────────────────┼─────────────────────────┐
              ┌────────▼───────┐  ┌──────────────▼─────┐  ┌────────────────▼──────┐  ┌───────────▼────────┐
              │ frontend-agent │  │   backend-agent    │  │  deploy-gate-agent    │  │   monitor-agent    │
              │  pages, UI,    │  │  API, DB, migra-   │  │  build/test gate      │  │  Sentry / Vercel   │
              │  routing, i18n │  │  tions, authz      │  │  before deploy        │  │  / custom signals  │
              └────────────────┘  └────────────────────┘  └───────────┬───────────┘  └─────────┬──────────┘
                       │                    │                         │                        │
                  reviewer:codex       runner: both              hard gate                  anomalies → tasks
                  (Claude implements,  (Claude + Codex run      (hooks/pre-push.sample)   (lib/watch + lib/detect)
                   Codex reviews)       independently, then diff)
                       └────────────────────┴──── lib/runner (claude/codex/both/reviewer adapters, git worktrees, budget) ────┘

   incident? ──▶ playbooks/*.html  (trigger → diagnose → decision tree → escalate → aftermath)
```

- **kanban server** (`server/kanban.cjs` + `ui/`) — a 4-column board (pending / in_progress / in_review / completed), REST API, SSE live updates, an agent registry backed by `agents/*.md`, and an optional Slack bot.
- **orchestrator** (`agents/orchestrator.md`) — turns every instruction into a task, picks the agent/runner based on `owns` globs and severity, and manages state transitions. It never edits app code directly.
- **specialist agents** (`agents/frontend-agent.md`, `backend-agent.md`, `deploy-gate-agent.md`, `monitor-agent.md`, `reviewer-codex.md`) — divide up the areas of the repo and declare a default `runner`. Copy `_TEMPLATE.md` for additional roles.
- **playbooks** (`playbooks/*.html`) — one-page runbooks for quickly making sense of an incident.
- **watch + detect** (`lib/watch/scheduler.cjs`, `lib/detect/*`) — run the `sentry`, `vercel`, and custom detectors and surface findings as tasks.
- **runner** (`lib/runner/*`) — runs the `claude` / `codex` CLIs in isolated worktrees and compares `runner: both` results.
- **gate** (`lib/gate/index.cjs`) — runs `config.js → deployCommands` fail-fast and, on failure, creates a human-review task.

## Quick start

**A. npx**

```bash
npx agent-kanban-harness init my-todo-app
```

`init` creates a board directory named after the project, registers the first task (`#1`), then starts the server. To scaffold only, without starting the server, add `--no-start`.

To go straight into the interview during scaffold:

```bash
npx agent-kanban-harness init my-todo-app --guided --repo /absolute/path/to/app
```

`setup --guided` detects the local `claude` and `codex` CLIs. When available, it proposes an agent matrix based on a sanitized repo summary containing only package scripts, common directories, and file paths. It does not send `.env`, task history, logs, source file contents, or prior Claude/Codex conversations. If no CLI is present, it uses a deterministic frontend/backend/QA/deploy/docs agent configuration.

**B. GitHub Template** — On GitHub, click **Use this template** → **Create a new repository**, then clone. Best suited for team work or long-term operation.

**C. Clone directly**

```bash
git clone https://github.com/Zakedu/agent-kanban-harness.git
cd agent-kanban-harness
cp config.example.js config.js && cp .env.example .env
npm start
```

Run `npm install` once in the board folder only when you want to use the Slack/Telegram mirror. The board/init/setup/gate core works without installing any dependencies.

Open `http://localhost:8080` in your browser. Create a task via the UI or `POST /api/tasks` and watch it appear on the board.

```bash
curl -X POST http://localhost:8080/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"subject":"Try it"}'
```

Run the gate and watch once:

```bash
npm run gate
npm run watch:once
```

## Adapting it to your project

The full procedure is in **[docs/adapting-to-your-project.md](docs/adapting-to-your-project.md)**. Here's the summary.

1. **`config.js`** — set `repoPath` to the absolute path of your app repo, and write your one week-1 target task in `goal`. Put your build/test chain in `deployCommands`, and set `buildOutputDir`.
2. **`agents/`** — align the `owns:` globs in `frontend-agent.md` / `backend-agent.md` with your actual directories. Copy `_TEMPLATE.md` if you need more roles.
3. **`lib/detect/`** — enable the `sentry` / `vercel` / custom detectors in `config.js → detectors`. Leave it empty if you have no monitoring.
4. **`agents/deploy-gate-agent.md` + `lib/gate/`** — the gate runs `config.js → deployCommands`. The key here is reviewing the config rather than changing code.
5. **`playbooks/`** — copy `_TEMPLATE.html` for each incident type you actually expect to see often and create a one-page runbook.
6. **`hooks/`** — install `pre-push.sample` into your app repo's `.git/hooks/pre-push`, and register the 24h watch via `launchd.plist.template` or cron.
7. Optional: connect a Slack bot or a Telegram ops-thread mirror.

## Ops thread (Telegram mirror) — optional

On the right side of the kanban dashboard there's an **ops thread** chat panel. If you configure Telegram, it mirrors both ways, so you can keep your 24h ops conversation going even from your phone. The kanban board remains the source of truth.

```
[ kanban dashboard ]                            [ your Telegram DM ]
  ops thread panel ◀──── /api/ops-thread ────▶   sendMessage / getUpdates
       │                       │                          │
       └── you type ───────────┘                          │
                               └── operator replies ──────┘
       task created / completed → 📋 / ✅ posted to both sides
```

Setup:

1. On Telegram, send `/newbot` to `@BotFather` and get a token.
2. Send any DM to your new bot from your own account.
3. Put the token and chat id in `.env`.

```bash
TELEGRAM_BOT_TOKEN=replace_with_botfather_token
TELEGRAM_CHAT_ID=    # leave empty at first
```

4. After `npm start`, check from another terminal.

```bash
curl http://localhost:8080/api/telegram/whoami
# → { "ok": true, "chats": [ { "id": 6131488858, "type": "private", ... } ] }
```

5. Put the `id` into `TELEGRAM_CHAT_ID` and restart the server.

If you don't use Telegram, just leave the env values empty. The panel keeps working as a local kanban chat. To allow multiple people, set `TELEGRAM_ALLOWED_CHAT_IDS=id1,id2`.

## Resource management API

The kanban dashboard reads and edits harness resources directly. Every `PUT` refuses to save empty content, and filenames are treated only as a basename within the corresponding resource directory.

- `GET  /api/agents` — list of `agents/*.md` frontmatter
- `GET  /api/agents/:name/full` — agent frontmatter + body
- `PUT  /api/agents/:name { meta?, body, changeNote? }` — save agent markdown
- `GET  /api/hooks` — list of `hooks/` files with sample/template distinction
- `GET  /api/hooks/:name/full` — hook file contents
- `PUT  /api/hooks/:name { content }` — save hook file
- `GET  /api/skills` — list of `skills/*.md` frontmatter
- `GET  /api/skills/:name/full` — skill frontmatter + body
- `PUT  /api/skills/:name { content }` — save skill markdown
- `GET  /api/claude-md` — root `CLAUDE.md` contents
- `PUT  /api/claude-md { content }` — save root `CLAUDE.md`
- `GET  /api/ops-thread?since=<id>` — read the thread
- `POST /api/ops-thread/append { role, text, taskId? }` — an agent records to the thread
- `POST /api/ops-thread/send { text }` — operator sends a message (includes the Telegram mirror)
- `GET  /api/telegram/status` — `{ configured, polling, chatId }`
- `GET  /api/telegram/whoami` — debug endpoint for checking the chat id

To create a file when a card is completed, add `metadata.resourceAction` to the task. Supported values are `{ kind: "hook-create"|"skill-create"|"agent-create", name, template? }`. If file creation fails on `PUT /api/tasks/:id { status: "completed" }`, the card moves back to `in_review` and the failure reason is recorded in `metadata.resourceActionError`.

## Kanban-first protocol

Every user instruction becomes a kanban task before any work starts. Leave the original instruction in `description`, decide on the agent and `runner`, and only then move it to `in_progress` before starting work. On completion, leave a `reportPath` and `reportSummary`.

The only exception is **incident response**. For a one-line, obviously-reversible hotfix in a situation that is impacting — or about to impact — production, you can act immediately, but you must register a post-hoc `metadata.source = "incident-response"` task within an hour. Ordinary bugs, features, docs, and refactors are not exceptions.

For the detailed rationale and state machine, see **[docs/the-pattern.md](docs/the-pattern.md)**.

## Multi-agent cross-validation

For each task, you choose the verification level via `runner`.

- **single-model** (`claude` / `codex`) — mechanical work like running tests, API polling, and state transitions.
- **`reviewer:codex`** — Claude implements and Codex reviews the result. The default for implementation work.
- **`both`** — Claude and Codex independently handle the same spec and the orchestrator diffs them. Used for work with a high risk of data corruption or leakage, like schema migrations, access control, and money paths. The disagreement itself is the safety net.

For the detailed criteria, see the Cross-validation section of **[docs/the-pattern.md](docs/the-pattern.md)**.

## Example: Generic SaaS

A hypothetical B2B SaaS example is in **[docs/example-saas.md](docs/example-saas.md)**. It shows how to divide front end, API, database migrations, payments, deploy gates, and monitoring into agent ownership boundaries. It does not include any real company data, task history, production URLs, or customer information.

## CLI reference

The `agent-kanban-harness` bin also runs as `npx agent-kanban-harness <cmd>`.

| Command | Description |
|---|---|
| `init <project-name>` | Create a `./<project-name>` board using the project name (lowercase letters/hyphens recommended). This value becomes the `boardDir` isolation key. |
| `init <project-name> --guided` | Create the board, then generate `config.js` and `agents/*.md` via a local interview |
| `setup --guided` | Run a repo scan + Claude/Codex-assisted agent setup from the current checkout |
| `doctor` | Check `claude`/`codex` availability, local config, gitignore, and private runtime file risks |
| `start [--port N]` | Run `server/kanban.cjs`. Prefers the local checkout server. |
| `watch [--once]` | Run `lib/watch/scheduler.cjs` |
| `gate` | Run `lib/gate/index.cjs` |
| `whoami` | Call `/api/telegram/whoami` on the running server |
| `--version` / `--help` | Version / help |

## License / status

MIT. Current status: extracted into a domain-agnostic template + npm CLI, with the main pieces wired together. Before relying on it in production, verify the gate, runner, and detector behavior directly in your own repo.
