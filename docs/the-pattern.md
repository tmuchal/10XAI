# The Harness Pattern

This is why the harness has the shape it does. There are five core ideas, and each one is a constraint meant to prevent a bigger failure down the line.

## 1. Kanban-first: every instruction becomes a task before any work

When a person says "fix the login bug", "add a coupon field", or "the build is failing", the orchestrator's first action is to write a kanban task. It records the original instruction verbatim in `description`, creates a short `subject`, assigns the agent and `runner`, and moves the card to `in_progress`. Only then does the work begin.

Why:

- **It eliminates invisible work.** Two agents, or a person and an agent, never quietly grab the same job. One card, one owner, one status.
- **Routing is made explicit.** The agent and `runner` (`claude` / `codex` / `both` / `reviewer:*`) are recorded on the card rather than guessed at.
- **A trail is left behind.** `createdAt` / `startedAt` / `completedAt`, the report path, and the cross-validation verdict all stay on the card.
- **The standup builds itself.** The activity log is the work record.

The only exception is **incident response**. If there is, or is about to be, production impact and the fix is small and obviously reversible, you may handle it first. But within one hour you must register a post-hoc task tagged with `metadata.source = "incident-response"`, recording what you did and the follow-up work. Refactors, docs, features, and ordinary bugs are not exceptions.

The implementation reference is `agents/orchestrator.md`, and the board is `server/kanban.cjs`.

## 2. Cross-validation: choose the verification level deliberately

Every task has a `runner`. There are three, in order of cost and rigor.

- **single-model** (`claude` or `codex`) — mechanical, deterministic work such as running tests, API polling, or state transitions. Cases where a second opinion would only add latency.
- **`reviewer:codex`** or **`reviewer:claude`** — the executing model works in a separate git worktree and leaves a verdict. A different model takes that report and finds what was missed. This is the default for implementation work. If a blocking flag is present, the verdict is lowered to `needs_human`.
- **`both`** — Claude and Codex handle the same spec independently and the orchestrator diffs the results. On agreement it auto-merges; on disagreement it moves to the "needs human" column. Use this for schema migrations, access-control/RLS-style policy, work that could corrupt or leak data, and money paths. **Disagreement is the safety mechanism.** It means the system does not ship anything where two independent interpretations failed to converge.

The orchestrator can promote a single-model task to `both` when the severity is at or above the threshold (`CROSS_VALIDATION_THRESHOLD`). There is also a daily budget for the second model (`DAILY_CODEX_BUDGET`). When the budget is exhausted, `codex` / `both` / `reviewer:codex` fall back to Claude alone, and Claude follows `MODEL_FALLBACK_CHAIN` depending on load. The implementation is in `lib/runner/`.

## 3. Selvedge boundaries: each agent owns a non-overlapping area

Each agent declares an `owns:` glob. The orchestrator uses these globs to decide "who owns this file?", and each agent moves only within its own area. The `frontend-agent` does not touch the server, and the `backend-agent` does not touch components. The `deploy-gate-agent` does not edit application code; it only runs commands.

Shared surfaces such as shared types, the dependency manifest, and migrations are exactly where a cross-check is needed. This is precisely where `runner: both` has meaning. Clean boundaries make routing automatable and let you trace responsibility when something goes wrong.

## 4. Human-approval gates: some things are never auto-merged

A hard gate is a door an agent cannot bypass. Only a person can explicitly pass through it. This harness has two default hard gates.

- **Pre-deploy gate** (`lib/gate/index.cjs`, `hooks/pre-push.sample`) — on `git push`, it runs the build/test commands fail-fast. On failure it blocks the push and auto-creates a "needs human" task with the log attached. The only bypasses are `git push --no-verify` or `KANBAN_GATE_BYPASS=1 git push`; the latter is recorded in `data/runs/overrides.jsonl` and reviewed at standup.
- **Cross-validation disagreement** (`runner: both`) — if the two models' results differ, the task goes to "needs human" along with the diff. It does not auto-merge. A person decides.

The principle is simple. For work that is hard to reverse or externally visible — deploys, destructive migrations, money movement, moderation actions — a person signs off last. The agent does the work; the person owns the decision to ship.

## 5. Incident playbooks: a scannable runbook, not prose

A playbook (`playbooks/*.html`) is a one-page runbook for a single incident type. It states what the trigger is, how to diagnose it, what the decision tree is, when to escalate, and what to do afterward.

Because it is read in a moment of pressure, it must be short and easy to scan. A task links the relevant playbook, and the monitor agent routes an anomaly into a task with a playbook attached. Start from `playbooks/_TEMPLATE.html` and create one for each incident you actually care about. If it runs past a single screen, it isn't a playbook—it's documentation.
