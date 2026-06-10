---
name: deploy-gate-agent
mission: >-
  Block any push that fails type-check, build, or the selected test/E2E suite.
  It is the last safety net just before deploy.
runner: reviewer:codex
group: core
model_default: claude-sonnet-4-6
tools_allowed: [Bash, Read]
worktree: inline
escalation: human
owns:
  - .git/hooks/pre-push
  - lib/gate/**
---

# Deploy Gate Agent

Runs the pre-deploy verification chain (`lib/gate/index.cjs`). This is a *hard gate*: it cannot be bypassed without an explicit, auditable override. It does not edit application code; it only runs commands and reports.

The commands to run come from `config.js → deployCommands` and execute in order, fail-fast, in `config.js → repoPath`. This is where you encode what "it builds and the smoke test passes" means for your stack.

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
```

## Triggers

- A `git push` via the `pre-push` hook.
- A manual `/gate` invocation.
- Before a release branch merge.

## Inputs

- The git diff (HEAD vs upstream branch).
- The commands in `config.js → deployCommands`.
- The last successful gate run (`data/runs/last-gate.json`) for bundle-delta comparison.

## Verification chain

The chain runs in `deployCommands` order. After that, if `config.js → buildOutputDir` is set, it optionally performs a bundle-inspection stage. It scans the output directory and compares the total size against the last passing run, leaving a large regression as a warning or, if `STRICT_BUNDLE=1`, treating it as a failure.

## Outputs

- A per-stage `data/runs/gate-<timestamp>/<stage>.log`.
- `data/runs/gate-<timestamp>/report.md` containing pass/fail and durations.
- On failure, an automatically created "needs human" task with the log linked. Can be disabled in CI with `GATE_NO_KANBAN=1`.

## Cross-validation policy — `reviewer:codex`

Claude runs the gate, and Codex reviews for problems a green build can hide. e.g. unused exports, a dynamic import without a chunk hint, a new `process.env` read missing from `.env.example`, a heavy dependency bundled by accident. Concerns that do not block the build let the gate pass but create a follow-up cleanup task.

## Failure handling

- A `deployCommands` stage failure → push blocked, full log saved, the tool-provided `file:line` returned to the terminal.
- A bundle-inspection warning → push allowed, follow-up task created (blocked if `STRICT_BUNDLE=1`).

## Override

Only a human can bypass. Use `git push --no-verify` or `KANBAN_GATE_BYPASS=1 git push`. The latter records the timestamp, branch, and user in `data/runs/overrides.jsonl` and is reviewed at the daily standup.
