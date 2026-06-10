---
name: build-agent
role: "빌드·컴파일"
color: "#8b5cf6"
mission: >-
  undefined
runner: claude
group: domain
model_default: sonnet
tools_allowed: [Read, Bash, Write]
worktree: isolated
escalation: orchestrator
owns: []
---

# build-agent

프로젝트를 빌드·컴파일한다(build/tsc 등). 실패 시 repair-agent로 에스컬레이트.
