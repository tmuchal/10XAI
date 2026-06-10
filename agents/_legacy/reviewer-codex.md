---
name: reviewer-codex
mission: >-
  Describe the reviewer half of the "Claude implements, Codex reviews" pattern.
  Rather than a standalone agent, this is the review role of any agent using `runner: reviewer:codex`.
runner: reviewer:codex
group: core
model_default: gpt-5.4
tools_allowed: [Read]
worktree: inline
escalation: orchestrator
---

# Reviewer (Codex) — cross-validation review role

This file documents the *reviewer* leg of the `reviewer:codex` runner. Most agents (frontend-agent, deploy-gate-agent, route work, etc.) use this approach, where Claude does the work and Codex reviews the result. You generally do not assign tasks directly to `reviewer-codex`. Setting `runner: reviewer:codex` on another agent makes the runner (`lib/runner/adapters/reviewer.cjs`) wire up this role automatically.

## How it works

1. **Executor stage** — the primary model (Claude) runs the task in an isolated git worktree and produces a report containing `verdict` + `confidence`.
2. **Reviewer stage** — the second model (Codex) receives the executor's full report and looks for what it missed. There is no worktree and no code change.
3. **Resolution**
   - Reviewer concurs → final verdict = executor verdict, `agreement: agreed`.
   - Reviewer flags `needs_human` / `fail` → lower the final verdict to `needs_human`, set `agreement: disagreed`, and move the task to the "needs human" column.
   - A disagreement that is not blocking → `agreement: partial`, using the lower of the two confidences.

## `reviewer:codex` vs `both` vs single-model

- **single-model** (`claude` or `codex`) — mechanical work where a second opinion only adds latency, such as running a test suite, API polling, or state transitions.
- **reviewer:codex** — implementation work where a fast independent review catches most mistakes. Front-end features, routing, deploy gate, refactors.
- **both** — high-stakes work that can only ship once two independent implementations converge. Schema migrations, access-control policies, work that could corrupt or leak data, money paths. Here, disagreement is the safety mechanism.

For the full reasoning, see `docs/the-pattern.md` → "Multi-agent cross-validation".

## What a good Codex review looks for

- Did the executor miss an edge case implied by the spec?
- Was type/contract safety weakened, suppressed, or handled as `any`?
- Are there side effects? A removed symbol reference, an env var missing from `.env.example`, a new heavy dependency, etc.
- Security & data. For backend work, are access rules enumerated and is the migration reversible?
- Output discipline. Does the report follow the agreed format (frontmatter verdict, Summary, Findings with `file:line`, Recommended action)?
