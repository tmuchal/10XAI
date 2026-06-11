/**
 * 10XAI — configuration.
 *
 * Read by:
 *   - server/kanban.cjs   (port, projectName, slack)
 *   - lib/runner/*        (the verify/execute agent pipeline + git-worktree sandbox)
 */
module.exports = {
  // Display name for the board UI.
  projectName: "10XAI",

  // Where content modules are cloned, sandboxed, and stored. Defaults to this
  // repo — verified runs land in workspace/ and library/. No setup needed.
  repoPath: ".",

  // Port for the kanban dashboard. Env var PORT overrides this.
  kanbanPort: 8080,

  // Sub-directory under the tasks dir that holds THIS board's task JSON files.
  // If unset, the server uses this harness directory name (for `init my-board`,
  // tasks live under <tasksDir>/my-board/<id>.json). Final fallback is "kanban".
  // The tasks dir is ~/.claude/tasks by default, or KANBAN_TASKS_DIR if set
  // (handy for tests / running boards off a throwaway dir).
  //
  // IMPORTANT — when several boards share one tasks dir: give each board a
  // *distinct* boardDir. The kanban server reads / writes / fs.watches ONLY its
  // own boardDir; it never scans sibling dirs or Claude-Code session UUID dirs.
  // (This is the fix for the multi-board file-watch amplification + duplicate-id
  // runaway: one board's write must not wake every other board.)
  // boardDir: "my-board",

  // Meta-board aggregate read mode (optional). Set to an array of board-dir
  // names under the tasks dir — e.g. ["kanban","camp-lms"] — and this board
  // *displays* the tasks from all of them together (deduped by id; if the same
  // id appears in two dirs, the one from the dir listed first wins). This is
  // read-only for display: writes (create / update / delete) still go to this
  // board's own boardDir only. An `_orchestrator`-style meta board that wants to
  // see every area's tasks in one view sets this to the area board-dir names.
  // null / unset ⇒ ordinary single-board mode (only boardDir is read).
  // aggregateDirs: ["kanban", "camp-lms"],

  // The verification → execution agent pipeline. Each stage maps to an
  // agents/*.md definition (full registry is auto-loaded from agents/ frontmatter).
  agents: [
    { name: "decompose-agent",      def: "agents/decompose-agent.md",      runner: "claude" },
    { name: "gapfill-agent",        def: "agents/gapfill-agent.md",        runner: "claude" },
    { name: "verify-agent",         def: "agents/verify-agent.md",         runner: "reviewer:codex" },
    { name: "verify-orchestrator",  def: "agents/verify-orchestrator.md",  runner: "claude" },
    { name: "router-agent",         def: "agents/router-agent.md",         runner: "claude" },
    { name: "exec-orchestrator",    def: "agents/exec-orchestrator.md",    runner: "claude" },
    { name: "exec-runner",          def: "agents/exec-runner.md",          runner: "claude" },
    { name: "tool-runner",          def: "agents/tool-runner.md",          runner: "claude" },
    { name: "env-agent",            def: "agents/env-agent.md",            runner: "claude" },
    { name: "build-agent",          def: "agents/build-agent.md",          runner: "claude" },
    { name: "secrets-agent",        def: "agents/secrets-agent.md",        runner: "claude" },
    { name: "integration-agent",    def: "agents/integration-agent.md",    runner: "claude" },
    { name: "repair-agent",         def: "agents/repair-agent.md",         runner: "claude" },
    { name: "deploy-agent",         def: "agents/deploy-agent.md",         runner: "claude" },
  ],

  // Auto-pickup (optional — content-line boards). When `autoPickup: true`, the
  // kanban server runs a 20s loop that grabs the highest-priority pending task
  // and flips it to in_progress (which fires the auto-executor) — one at a time,
  // skipped while a task is already executing. `area` (e.g. "01", "02a") scopes
  // the loop to tasks whose `metadata.area` or `project` matches; null ⇒ no
  // filter. Leave both unset on boards that should not self-feed work.
  // area: "01",
  // autoPickup: true,

  // Orchestration-only boards: never auto-execute (no spawn-on-in_progress, no
  // auto-pickup) — work is started deliberately, not fire-and-forget. Leave unset
  // (false) on normal boards.
  // manualOnly: true,

  // ── In_review tasks: declare what to review + the post-review action ──────────
  // When a task goes to `in_review`, give it `metadata.review` so the board UI can
  // show *what* needs checking and *what decision* is wanted (instead of just sitting
  // there). The operator acts via `POST /api/tasks/:id/review`:
  //   metadata.review = {
  //     what: "Check whether it is intentional that the answer keys for these 3 items are all B — OK if intended, rearrange if coincidental",
  //     kind: "approve"            // ✅ approve (→completed) / ↩️ reject (→pending)
  //         | "choose"             // choose among options: options:[{id,label,final?:bool}]  (final ⇒ completed, else pending)
  //         | "feedback",          // (free-form feedback is always allowed regardless of kind — leaves a comment only, does not change state)
  //     options: [ { id: "a", label: "Proceed as is", final: true }, { id: "b", label: "Reject to 01 — rearrange" } ],
  //   }
  // (runtime fields the endpoint writes: decision, decidedBy, decidedAt, rejectReason, feedback:[{ts,by,text}])

  // Slack reporting (optional). Tokens come from .env, not here.
  slack: {
    command: "/kanban",
  },
};
