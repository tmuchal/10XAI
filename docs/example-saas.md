# Example: Generic SaaS Setup

This example is intentionally fictional. It shows only the shape of the agent setup, without exposing any real project name, user data, production task history, or domain-specific operating notes.

## Product Shape

Assume a small B2B SaaS product.

- A React or Next.js front end.
- Node, serverless functions, or a light API layer.
- A SQL database with migrations.
- Stripe or another payment provider.
- A deploy target such as Vercel, Fly.io, or Render.
- Optionally Sentry or log-based monitoring.

The harness runs alongside the app repo. It does not include the app code. What the harness owns is the kanban board, agent definitions, playbooks, local runner reports, and gate scripts.

## Config

```js
module.exports = {
  projectName: "Example SaaS",
  goal: "After 6 weeks — complete 1 automation that auto-generates the weekly report",
  repoPath: "/absolute/path/to/example-saas",
  kanbanPort: 8080,
  boardDir: "example-saas",
  deployCommands: [
    { name: "01-typecheck", cmd: "npm", args: ["run", "typecheck"] },
    { name: "02-test", cmd: "npm", args: ["test"] },
    { name: "03-build", cmd: "npm", args: ["run", "build"] }
  ],
  buildOutputDir: "dist",
  detectors: []
};
```

`setup --guided` scans package scripts and common directories, then auto-generates a similar file.

## Agent Matrix

Start with a small, non-overlapping set.

- `orchestrator`: turns operator requests into tasks and routes them.
- `frontend-agent`: owns UI, routes, browser behavior, and client state.
- `backend-agent`: owns API, auth, database, migrations, and shared server code.
- `qa-agent`: owns test creation, regression checks, and verification evidence.
- `deploy-gate-agent`: owns the release gate and failed-deploy triage.
- `docs-agent`: owns runbooks, handoff notes, and onboarding docs.

Recommended runner defaults:

- Frontend implementation: `reviewer:codex`
- Backend/data/auth changes: `both`
- QA and mechanical checks: `codex`
- Documentation: `claude`
- Release gate: `reviewer:codex`

## High-Risk Boundaries

Set explicit boundaries before running an agent.

- Payment and billing code requires review.
- Auth and permission changes require `both`.
- Migrations require `both` plus a rollback note.
- Production deploys require a gate pass.
- Human-impacting automated decisions are allowed only as detection-and-escalation.

## Playbooks

Create a one-page playbook for each incident that actually exists in your product.

- Build failure.
- E2E regression.
- Error-rate spike.
- Payment webhook failure.
- Database migration rollback.
- Customer-impacting login failure.

In the public template, keep the playbooks fictional too. Real provider IDs, customer names, Slack channels, on-call names, and production URLs belong in local private config.

## Public Repository Privacy Rules

Put only the pattern in a public repository, never the company.

- Include `config.example.js`, not `config.js`.
- Include `.env.example`, not `.env`.
- Include fake playbooks, not real incident logs.
- Include agent templates, not production task history.
- Include sanitized examples, not app-specific customer, payment, auth, or analytics data.
