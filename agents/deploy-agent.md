---
name: deploy-agent
role: "Export module · deploy to library"
color: "#a855f7"
mission: >-
  Exports the executed/measured board as a SKILL.md / JSON / CLI module and accumulates it in the Library.
runner: claude
group: domain
model_default: sonnet
tools_allowed: [Read, Bash, Write]
worktree: isolated
escalation: human
owns: []
---

# deploy-agent

Execute sub-agent. Exports verified modules to the Library.
