# Adapting agent-kanban-harness to Your Project

This harness ships as a generic template. To drive your front-end / back-end repo, you only need to change a few files. It isn't tied to any particular framework; the examples below just show common stacks, but the overall structure is the same.

Prerequisites: Node ≥ 20, an application git repo, and ideally the `claude` or `codex` CLI on your PATH so the runner can execute real work. Even without the CLI, the runner falls back to a deterministic stub verdict, so you can still practice.

---

## Step 1 — `config.js`: specify the repo, goal, and stack

```bash
cp config.example.js config.js     # config.js is gitignored
cp .env.example .env               # fill in tokens; .env is gitignored
```

Items to set in `config.js`:

- `projectName` — the name shown in the board UI and on Slack.
- `goal` — the **one target task** chosen in week 1. Write down what you intend to achieve after six weeks.
- `repoPath` — the **absolute path** of the application repo. Gate commands and runner worktrees execute here.
- `kanbanPort` — defaults to 8080. The `PORT` env var takes precedence if set.
- `deployCommands` — the build/test chain the gate runs in order. It is fail-fast.

```js
// Node / Vite
[{ name:"01-typecheck", cmd:"npx", args:["tsc","--noEmit"] },
 { name:"02-build",     cmd:"npm", args:["run","build"] }]

// Rust
[{ name:"build", cmd:"cargo", args:["build","--release"] },
 { name:"test",  cmd:"cargo", args:["test"] }]

// Go
[{ name:"vet",  cmd:"go", args:["vet","./..."] },
 { name:"test", cmd:"go", args:["test","./..."] }]

// Python
[{ name:"lint",  cmd:"ruff", args:["check","."] },
 { name:"test",  cmd:"pytest", args:["-q"] }]
```

If you have E2E tests, add a stage such as a Playwright golden-path spec.

- `buildOutputDir` — the build output directory used to check bundle-size regression (`dist`, `build`, `.next`, etc.). Set `null` to skip.

---

## Step 2 — `agents/`: match ownership to your actual directories

In the frontmatter of `agents/frontend-agent.md` and `agents/backend-agent.md`, align the `owns:` globs with where your code actually lives. The orchestrator uses these globs to decide "this task touches this file" → "this agent owns it".

```text
# frontend-agent owns examples
Next.js / CRA:  app/**, src/app/**, components/**, pages/**, styles/**, public/**
Vite + React:   src/**, src/components/**, src/pages/**, src/styles/**, src/locales/**
SvelteKit:      src/routes/**, src/lib/components/**, static/**

# backend-agent owns examples
Node API:       server/**, api/**, src/server/**, src/api/**
Rails:          app/controllers/**, app/models/**, db/migrate/**
Go services:    internal/**, cmd/**
Supabase:       supabase/functions/**, supabase/migrations/**
```

Keep ownership **non-overlapping** where possible. If you need more roles, copy `agents/_TEMPLATE.md` to `agents/<name>.md`, fill in the frontmatter's `name`, `mission`, `runner`, and `owns`, then add it to `config.js → agents`.

`orchestrator.md`, `deploy-gate-agent.md`, `monitor-agent.md`, and `reviewer-codex.md` can mostly stay generic. Just trim any sentences that don't fit your project.

---

## Step 3 — `lib/detect/`: wire up monitoring or leave it empty

`config.js → detectors` is the list of detectors run by the 24h watch loop. Provided by default:

- **`sentry`** — error groups and error-rate spikes. Requires `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, and `SENTRY_PROJECT_SLUG` in `.env`.
- **`vercel`** — deploy state. Requires `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` in `.env`, plus `VERCEL_TEAM_ID` for team accounts.

If an env var is empty, it does not crash; it creates a low-severity "config missing" task instead.

To use Datadog, CloudWatch, Prometheus, `/healthz`, or a custom metrics API, copy `lib/detect/_template.cjs` to `lib/detect/<name>.cjs` and implement `run(ruleSet, state)`. Register it in the detector map at the top of `lib/watch/scheduler.cjs`, add a rule block to `lib/detect/rules.json`, then enable it in `config.js → detectors`.

If you have no monitoring, just leave `detectors` empty. Everything else still works.

---

## Step 4 — `agents/deploy-gate-agent.md` + `lib/gate/`: pin the build/test commands

The gate runs `config.js → deployCommands` without changing any code. Just review whether the description in `agents/deploy-gate-agent.md` matches your stack. Gate stages run serially and fail-fast, and the log for a failed stage is saved to `data/runs/gate-<ts>/<stage>.log`. On failure, a "needs human" task is created automatically.

---

## Step 5 — `playbooks/`: create one page per real incident

Start from `playbooks/_TEMPLATE.html`. Replace the default examples (`build-fail`, `e2e-regression`, `sentry-spike`, `deploy-rollback`), and add situations that actually exist in your system, such as payment webhook failure, queue backlog, or a third-party outage.

A playbook is read under pressure, so keep it to one page. The monitor agent routes an anomaly into a task, and that task links the relevant playbook.

---

## Step 6 — `hooks/`: install the pre-push gate and watch schedule

**Pre-push gate** — install it in the application repo pointed to by `config.js → repoPath`.

```bash
ln -sf /abs/path/to/agent-kanban-harness/hooks/pre-push.sample /abs/path/to/your-app/.git/hooks/pre-push
chmod +x /abs/path/to/agent-kanban-harness/hooks/pre-push.sample
export AGENT_KANBAN_HARNESS_DIR=/abs/path/to/agent-kanban-harness   # so the hook can find the harness
```

Now `git push` runs the gate. A person can bypass it with `KANBAN_GATE_BYPASS=1 git push`, and that is recorded in `data/runs/overrides.jsonl`.

**24h watch**

- macOS: replace the three `__PLACEHOLDER__` values in `hooks/launchd.plist.template`, copy it to `~/Library/LaunchAgents/`, then `launchctl load`.
- Linux / cron: register the cron line from the comment at the top of the template (`*/5 * * * * … scheduler.cjs --once`).

---

## Step 7 (optional) — Slack reporting

Create a Slack app (bot + app token, Socket Mode) and put `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `SLACK_CHANNEL_ID` in `.env`. `SLACK_COMMAND` defaults to `/kanban`.

Once connected, the board posts start / progress / done updates and the slash commands (`/kanban board`, `/kanban list`, `/kanban add`, `/kanban ask`, `/kanban exec`, `/kanban stop`) work. Leave it empty and only Slack is disabled; everything else keeps working.

---

## Running

```bash
npm install
npm start          # → http://localhost:8080
```

If you aren't using the Slack/Telegram mirror, the core board, init, setup, and gate work even without `npm install`.

Open the board and create a task through the UI or with `POST /api/tasks`. Run `npm run gate`, and use `npm run watch:once` to run a single watch sweep. If you're curious why it's built this way, see `docs/the-pattern.md`; for a full example, see `docs/example-saas.md`.
