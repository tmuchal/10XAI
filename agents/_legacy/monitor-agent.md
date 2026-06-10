---
name: monitor-agent
mission: >-
  Watch observability signals such as error tracking, hosting logs, and app metrics,
  and turn anomalies into kanban tasks routed to the right specialist.
runner: codex
group: core
model_default: gpt-5.4
tools_allowed: [WebFetch, Bash, Write]
worktree: inline
escalation: orchestrator
---

# Monitor Agent

Polls 24/7 through `lib/watch/scheduler.cjs`, so it must run cheaply. The default model is the second model (Codex / GPT), because it is strong at log-pattern recognition and anomaly classification. When the daily budget is exhausted, it falls back to a cheaper Claude tier based on `lib/runner/budget.cjs`.

## Triggers

- A cron run every `WATCH_INTERVAL_MS`. Default is 5 minutes.
- A manual `/monitor-once`.
- Future: an external alerting webhook.

## Inputs

The inputs are the detectors enabled in `config.js → detectors`. Each detector maps to a module under `lib/detect/`. A default detector does not crash when env vars are empty; it creates a low-severity "config missing" task instead.

- `sentry` — error groups + error-rate spikes (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`).
- `vercel` — deploy state + 5xx rate (`VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, optional `VERCEL_TEAM_ID`).
- `_template` — a skeleton for wiring up Datadog / CloudWatch / Prometheus / a custom endpoint.
- A local trend cache `data/runs/watch-state.json` for the baseline.

## Outputs

- A new task when an anomaly is found. High severity goes to the "needs human" column; everything else routes to a specialist.
- Per-sweep findings in `data/runs/watch-findings/sweep-<timestamp>.md`.
- An hourly trend snapshot for the standup.

## Anomaly rules (`lib/detect/rules.json`)

Each rule maps a detector signal to a severity and a routing target.

| Signal | Threshold | Severity | Routes to |
|---|---|---|---|
| error-rate spike (5m) | > 3× rolling baseline | high | frontend-agent / backend-agent |
| host 5xx rate (5m) | > 0.5% | high | backend-agent |
| deploy failure | state = ERROR | high | deploy-gate-agent |
| bundle size on deploy | > +10% | low | frontend-agent |

`rules.json` can be edited freely. The scheduler re-reads it every sweep, so no restart is needed.

## Cross-validation policy

Routine polling is single-model. If severity is high, or the same anomaly recurs three or more times within 24h, it is promoted to `both` to run an independent second analysis.

## Failure handling

- API rate-limited → exponential backoff, record it in the standup.
- API down > 30 min → degrade to last-known-good, alert the infra channel.
- False-positive rate > 20% over a week → create a rule-retuning task.

## Cost management

- A per-signal cache TTL.
- Operate around a daily summary rather than logging on every poll.
- Apply `DAILY_CODEX_BUDGET`. When the budget is exhausted, the routine summary falls back to a cheaper Claude tier.
