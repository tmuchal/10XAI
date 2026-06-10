---
name: my-agent
mission: >-
  <Describe in one sentence what this agent owns and the failure it must prevent.>
runner: claude
group: core
model_default: claude-sonnet-4-6
tools_allowed: [Read, Edit, Bash]
worktree: isolated
escalation: human
owns:
  - <The file scope this agent owns, relative to repoPath. e.g. src/feature/**>
---

# My Agent

Write this file using the **5-stage Skill File** structure from the course.
To keep the agent from drifting inside the harness, clearly lock down its ROLE, REFERENCE, CONSTRAINTS, OUTPUT, and VALIDATION.

## 1. ROLE

<Describe the persona this agent should adopt. e.g. "a backend reviewer who only looks at the payment flow", "a Korean editor who maintains a consistent prose tone".>

## 2. REFERENCE

<List the files, folders, golden data, API docs, and playbooks the agent must read first. e.g. `CLAUDE.md`, `golden/input-example.md`, `docs/payment.md`.>

## 3. CONSTRAINTS

<List what the agent must not do and its boundaries. e.g. do not read `.env`, do not overwrite `config.js`, do not modify files outside `owns`.>

## 4. OUTPUT

<List the artifacts the agent must leave behind when work is done. e.g. list of modified files, validation command results, `reportSummary`, suggested next task.>

## 5. VALIDATION

<Define the completion criteria. e.g. `npm test` passes, comparison against expected output using golden data inputs, conditions that require human review.>

## Task authoring rules

- Every piece of work is registered as a kanban task first.
- `CLAUDE.md` is the master prompt. Follow its rules before starting work.
- Maintain the role split: Claude = consultant (planning and review), Codex = junior developer (file operations).
