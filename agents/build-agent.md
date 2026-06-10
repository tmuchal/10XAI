---
name: build-agent
role: "Build & compile"
color: "#8b5cf6"
mission: >-
  Builds and compiles the project (build/tsc, etc.). On failure, escalates to repair-agent.
runner: claude
group: domain
model_default: sonnet
tools_allowed: [Read, Bash, Write]
worktree: isolated
escalation: human
owns: []
---

# build-agent

Execute sub-agent. Builds/compiles the project.
