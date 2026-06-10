# Student Distribution — Week 3+ Tool for the 6-Week AI Harness Bootcamp

> This document defines how to distribute and update `agent-kanban-harness` for students.
> This package is a standalone tool and does not integrate with any other CLI package.

## Coursework Terminology

- **Harness** = the reins that keep the AI in check = the bundle of design + files + procedures
- **Golden data** = one bundle of ideal input (input-example) + one or two ideal outputs (output-example)
- **Skill File, 5 sections** = ROLE, REFERENCE, CONSTRAINTS, OUTPUT, VALIDATION
- **3 pillars** = context / instruction system / evaluation loop
- **CLAUDE.md** = the master prompt
- **Claude = consultant (planning and review), Codex = junior developer (file work)**

## Distribution Goals

Starting in week 3, each student installs this harness alongside their own project. The harness does not include the student repo's code directly; instead, it drives the project pointed to by `config.js -> repoPath` through kanban tasks, agents, golden data, and the evaluation loop.

There are three core goals.

1. **Pin the context** — fix the project background and work boundaries with `CLAUDE.md`, `config.js`, `agents/*.md`, and `golden/`.
2. **Pin the instruction system** — register every piece of work as a kanban task first, and let the orchestrator route it to a specialist agent.
3. **Pin the evaluation loop** — choose one of single-model / review / cross-validation to make the verification level explicit for each task.

## Recommended Installation Flow

### npx method (default)

```bash
cd ~/Projects
npx agent-kanban-harness init my-todo-app
```

A single `init` is all it takes. This command does the following, in order.

1. Scaffolds the harness files into the `my-todo-app/` directory. This name is both the project name and the `boardDir` isolation key.
2. **Automatically registers the first kanban task (`#1`), "Set up this board by talking with Claude Code".**
3. **Automatically starts the local kanban server** and opens the `http://localhost:8080` board in the default browser.

The student does not need to run `npm install` or `npm start` separately. To stop the server, press `Ctrl+C` in the terminal; to restart it, run `npx agent-kanban-harness start`.

To scaffold only, without starting the server, add `--no-start` (for CI and inspection).

```bash
npx agent-kanban-harness init my-todo-app --no-start
```

### GitHub Template method

1. Click **Use this template** at `github.com/Zakedu/agent-kanban-harness`.
2. Create a new repo under your own GitHub account.
3. Clone it locally.
4. Paste the installation prompt from the top of the README into Claude Code.

Since this creates the student's own repo under their GitHub account, they can then learn the git workflow firsthand through `commit` and `update`.

## Right After Installation — See It with Your Own Eyes

Once the server is up, the student sees the harness they just installed directly on the board.

- **Board task `#1`** — the "Set up this board by talking with Claude Code" card sits in `pending`. Move this card to `in_progress` and run `setup --guided` together with Claude Code.
- **Harness overview panel** — the overview panel on the board screen shows the project name, `repoPath`, `goal`, agent list, golden data path, evaluation loop level, and kanban port at a glance. The **reconfigure button** lets you re-run `setup`.
- **Version banner** — when the instructor ships a new version, an update banner appears at the top of the board.

The five things `setup --guided` asks:

1. The absolute path of the project this harness will drive (repoPath)
2. The golden data location (the `golden/` folder; if you have none, leave it empty and register it later)
3. Agent composition (select the specialist agents you need; if any are missing, write them yourself from `_TEMPLATE.md`)
4. The evaluation loop level (single-model / review / cross-validation)
5. The goal of this project (`goal`) — the one target task chosen in week 1, and what you intend to achieve after six weeks

Once `setup` finishes, `config.js` is filled in and `agents/*.md` are set up to fit your project. You can confirm the result again in the harness overview panel.

## What Stays in the Student Repo

| File/Folder | Role |
|---|---|
| `CLAUDE.md` | The master prompt. The reference for Kanban-First and the harness operating rules |
| `config.js` | Local settings. Stores repoPath, goal, goldenDir, evaluationLevel, and the agent matrix. Gitignored |
| `agents/*.md` | Specialist agent definitions written in the 5-section Skill File format |
| `golden/` | Golden data. The default location for `input-example.md` and `output-example.md` |
| `ui/` | The kanban board and the harness overview panel |
| `playbooks/` | Procedure documents that turn recurring failures or operational situations into tasks |
| `skills/` | Short, reusable task skills for Claude Code |

## Customization Areas

The areas students may change themselves, and how to reconfigure them, are listed below.

| Item | Where to change it | Reconfigurable via `setup --guided`? |
|---|---|---|
| `repoPath` | `config.js` or `setup --guided` question 1 | Yes |
| `goal` | The `goal` field in `config.js` or `setup --guided` question 5 | Yes |
| Golden data | `config.js → goldenDir`, and `input-example.md` / `output-example.md` in the default `golden/` folder | Path: yes; file contents: managed manually |
| `agents/*.md` | The `agents/` folder. Copy `_TEMPLATE.md` and write it in the 5-section Skill File format | Yes, but overwriting existing files requires `--force` |
| Evaluation loop | `config.js → evaluationLevel`, and the `runner` of each agent/task | Yes |
| hooks | `hooks/pre-push.sample`, `hooks/launchd.plist.template` | No. Install/modify manually |
| skills | `skills/*.md` | No. Add/modify manually |
| `deployCommands` | `config.js → deployCommands` | Yes, based on scan results. Review the specific commands yourself |
| `CLAUDE.md` | The root `CLAUDE.md`, or resource editing in the board UI | No. Edit manually |

## Update Policy

To protect the student's local work, updates run only when explicitly invoked.

```bash
npx agent-kanban-harness update --diff
npx agent-kanban-harness update
```

- Synced: `agents/`, `playbooks/`, `skills/`, `ui/`
- Never overwritten: `config.js`, `.env`, kanban tasks, `*.local.md`
- `update --diff` changes no files; it only shows what changed in the instructor's version.
- If the student has modified an agent, check with `--diff` first, then manually merge only the parts you need.

## Operating Rules

Every piece of work becomes a kanban task first. Work done through conversation with Claude Code is no exception. Do not start without a card.

The default work sequence:

1. Register the task
2. The orchestrator assigns the agent and evaluation loop
3. The specialist agent does the work
4. Verify with golden data or an execution command
5. Record the result in `reportSummary` and mark it complete

This rule gives the student the sense not that "the AI handled it on its own", but that "the harness kept the AI in check and ran it by the book".
