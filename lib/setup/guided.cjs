/**
 * Guided setup for a public agent-kanban-harness instance.
 *
 * This intentionally sends only a structure summary to Claude/Codex: package
 * scripts, top-level directories, and common config filenames. It never reads
 * source file contents, .env, task history, logs, or local conversation state.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { spawnSync, execSync } = require("child_process");

const RUNNERS = new Set(["claude", "codex", "both", "reviewer:codex", "reviewer:claude"]);
const EVALUATION_LEVELS = new Set(["single-model", "review", "cross-validation"]);
const DEFAULT_GLOBS = {
  frontend: ["src/**", "app/**", "pages/**", "components/**", "styles/**", "public/**"],
  backend: ["server/**", "api/**", "routes/**", "db/**", "migrations/**", "functions/**", "lib/**"],
  test: ["test/**", "tests/**", "e2e/**", "playwright.config.*", "**/*.spec.*", "**/*.test.*"],
  docs: ["docs/**", "README.md", "*.md"],
  deploy: [".github/**", "Dockerfile", "docker-compose*.yml", "vercel.json", "netlify.toml", "fly.toml", "railway.json"],
};

function q(s) { return JSON.stringify(String(s)); }
function safeName(s, fallback = "agent") {
  const out = String(s || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return out || fallback;
}
function which(cmd) {
  try { return execSync(`command -v ${cmd}`, { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return ""; }
}
function exists(root, rel) { return fs.existsSync(path.join(root, rel)); }
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { return null; }
}
function listTop(root) {
  try {
    return fs.readdirSync(root, { withFileTypes: true })
      .filter((d) => !d.name.startsWith(".") && d.name !== "node_modules")
      .slice(0, 80)
      .map((d) => d.name + (d.isDirectory() ? "/" : ""));
  } catch { return []; }
}
function listGitFiles(root) {
  try {
    const out = execSync("git ls-files", { cwd: root, encoding: "utf-8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] });
    return out.split(/\r?\n/).filter(Boolean).slice(0, 500);
  } catch {
    return [];
  }
}
function detectPackageManager(root) {
  if (exists(root, "pnpm-lock.yaml")) return "pnpm";
  if (exists(root, "yarn.lock")) return "yarn";
  if (exists(root, "package-lock.json")) return "npm";
  if (exists(root, "bun.lockb") || exists(root, "bun.lock")) return "bun";
  return "npm";
}
function scriptCmd(pm, script) {
  if (pm === "pnpm") return { name: script, cmd: "pnpm", args: ["run", script] };
  if (pm === "yarn") return { name: script, cmd: "yarn", args: [script] };
  if (pm === "bun") return { name: script, cmd: "bun", args: ["run", script] };
  return { name: script, cmd: "npm", args: ["run", script] };
}
function inferDeployCommands(scan) {
  const scripts = scan.packageScripts || {};
  const order = ["lint", "typecheck", "test", "build"];
  return order.filter((s) => scripts[s]).map((s, i) => ({ ...scriptCmd(scan.packageManager, s), name: `${String(i + 1).padStart(2, "0")}-${s}` }));
}
function inferBuildOutputDir(scan) {
  if (scan.keyFiles.includes("next.config.js") || scan.keyFiles.includes("next.config.mjs")) return ".next";
  if (scan.topLevel.includes("dist/")) return "dist";
  if (scan.topLevel.includes("build/")) return "build";
  if (scan.topLevel.includes(".next/")) return ".next";
  return null;
}
function scanRepo(repoPath) {
  const root = path.resolve(repoPath);
  const pkg = readJson(path.join(root, "package.json")) || {};
  const files = listGitFiles(root);
  const topLevel = listTop(root);
  const keyFiles = [
    "package.json", "pnpm-lock.yaml", "yarn.lock", "package-lock.json", "bun.lockb",
    "next.config.js", "next.config.mjs", "vite.config.ts", "vite.config.js",
    "tsconfig.json", "pyproject.toml", "Cargo.toml", "go.mod", "Dockerfile",
    "vercel.json", "netlify.toml", ".github/workflows",
  ].filter((rel) => exists(root, rel));
  const packageManager = detectPackageManager(root);
  const commonDirs = {
    frontend: ["src", "app", "pages", "components", "styles", "public"].filter((d) => exists(root, d)),
    backend: ["server", "api", "routes", "db", "migrations", "functions", "supabase", "lib"].filter((d) => exists(root, d)),
    tests: ["test", "tests", "e2e", "__tests__"].filter((d) => exists(root, d)),
    docs: ["docs", "manual", "playbooks"].filter((d) => exists(root, d)),
    deploy: [".github", "infra", "ops"].filter((d) => exists(root, d)),
  };
  return {
    repoName: path.basename(root),
    repoPath: root,
    packageManager,
    packageScripts: pkg.scripts || {},
    topLevel,
    keyFiles,
    commonDirs,
    sampleFiles: files.filter((f) => !f.includes(".env") && !f.includes("secret") && !f.includes("credential")).slice(0, 120),
  };
}

function defaultPlan(answers, scan) {
  const agents = [
    {
      name: "orchestrator",
      group: "core",
      mission: "Turn operator requests into explicit kanban tasks, route them to the right specialist, and keep the task state machine honest.",
      runner: "claude",
      model_default: "claude-sonnet-4-6",
      owns: [],
      triggers: ["Any new operator request or unassigned task."],
      inputs: ["config.js", "agents/*.md", "kanban tasks", "repo structure summary"],
      outputs: ["routed task with agent, priority, and metadata.runner"],
      crossValidation: "Use specialist runners for implementation and verification; the orchestrator itself does not edit application code.",
      failureHandling: "If ownership is ambiguous, create a needs-human task with the competing owners listed.",
    },
  ];
  if (scan.commonDirs.frontend.length) agents.push({
    name: "frontend-agent",
    group: "core",
    mission: "Keep user-facing UI, routing, and client-side state changes coherent and reviewable.",
    runner: "reviewer:codex",
    model_default: "claude-sonnet-4-6",
    owns: DEFAULT_GLOBS.frontend,
    triggers: ["Tasks touching UI, routes, styles, client state, or browser behavior."],
    inputs: ["UI source files", "routes", "component tests", "screenshots when available"],
    outputs: ["code changes plus a verification note with touched files and UI risk"],
    crossValidation: "Claude implements; Codex reviews for regressions and missing edge cases.",
    failureHandling: "If UI behavior cannot be verified locally, move the task to in_review with exact missing checks.",
  });
  if (scan.commonDirs.backend.length) agents.push({
    name: "backend-agent",
    group: "core",
    mission: "Protect API, data, auth, and server-side contracts from unsafe or unverified changes.",
    runner: "both",
    model_default: "both",
    owns: DEFAULT_GLOBS.backend,
    triggers: ["Tasks touching APIs, database/schema, server functions, auth, or shared libraries."],
    inputs: ["server code", "schema/migration files", "contract tests", "logs supplied by the operator"],
    outputs: ["implementation report, migration notes, and contract verification commands"],
    crossValidation: "Claude and Codex work independently; disagreement stays in_review for a human decision.",
    failureHandling: "Never mark completed when write paths or migrations were not exercised.",
  });
  if (scan.commonDirs.tests.length || Object.keys(scan.packageScripts).some((s) => /test|e2e|playwright|vitest|jest/i.test(s))) agents.push({
    name: "qa-agent",
    group: "core",
    mission: "Turn risky changes into runnable checks and keep test evidence attached to tasks.",
    runner: "codex",
    model_default: "gpt-5.4",
    owns: DEFAULT_GLOBS.test,
    triggers: ["Regression reports, flaky tests, missing coverage, or release-gate failures."],
    inputs: ["test files", "test command output", "changed file list"],
    outputs: ["focused test changes or a concise verification report"],
    crossValidation: "Use reviewer:codex or both when the test itself encodes business-critical behavior.",
    failureHandling: "If a test cannot run, report the exact command and blocker.",
  });
  agents.push({
    name: "deploy-gate-agent",
    group: "core",
    mission: "Block releases until configured build, test, and smoke commands pass from the target repo.",
    runner: "reviewer:codex",
    model_default: "claude-sonnet-4-6",
    owns: DEFAULT_GLOBS.deploy,
    triggers: ["Pre-push hook, release request, deployment failure, or gate failure."],
    inputs: ["config.js deployCommands", "CI/deploy config", "gate output"],
    outputs: ["pass/fail release verdict with failing command and next action"],
    crossValidation: "Codex reviews release-risk reasoning before human-visible pass claims.",
    failureHandling: "Gate failure creates or updates an in_review task and does not deploy.",
  });
  if (scan.commonDirs.docs.length) agents.push({
    name: "docs-agent",
    group: "core",
    mission: "Keep project instructions, runbooks, and handoff documents accurate after code or process changes.",
    runner: "claude",
    model_default: "claude-sonnet-4-6",
    owns: DEFAULT_GLOBS.docs,
    triggers: ["New workflows, architecture changes, onboarding changes, or repeated operator questions."],
    inputs: ["README", "docs", "playbooks", "task reports"],
    outputs: ["doc patch or handoff note"],
    crossValidation: "Use Codex review for docs that encode release or security procedure.",
    failureHandling: "If source-of-truth is unclear, leave an explicit open question instead of inventing procedure.",
  });
  return {
    projectName: answers.projectName || scan.repoName,
    repoPath: scan.repoPath,
    goldenDir: answers.goldenDir || "golden/",
    evaluationLevel: normalizeEvaluationLevel(answers.evaluationLevel),
    boardDir: safeName(answers.boardDir || scan.repoName || "kanban"),
    kanbanPort: Number(answers.port || 8080),
    goal: typeof answers.goal === "string" ? answers.goal : "",
    deployCommands: inferDeployCommands(scan),
    buildOutputDir: inferBuildOutputDir(scan),
    agents,
  };
}
function normalizeEvaluationLevel(value) {
  const v = String(value || "").trim().toLowerCase();
  if (EVALUATION_LEVELS.has(v)) return v;
  if (v === "single" || v === "single model" || v === "1") return "single-model";
  if (v === "cross" || v === "cross validation" || v === "3") return "cross-validation";
  if (v === "2") return "review";
  return "review";
}
function applyEvaluationLevel(plan) {
  const level = normalizeEvaluationLevel(plan.evaluationLevel);
  const agents = plan.agents.map((agent) => {
    if (agent.name === "orchestrator") return { ...agent, runner: "claude" };
    if (level === "single-model") return { ...agent, runner: agent.runner === "codex" ? "codex" : "claude" };
    if (level === "cross-validation") return { ...agent, runner: "both" };
    if (agent.runner === "both") return agent;
    return { ...agent, runner: "reviewer:codex" };
  });
  return { ...plan, evaluationLevel: level, agents };
}
function applyAgentSelection(plan, selection) {
  const raw = String(selection || "").trim();
  if (!raw || /^default|all$/i.test(raw)) return { plan, custom: [] };
  const wanted = raw.split(/[,，\s]+/).map((s) => safeName(s)).filter(Boolean);
  const byName = new Map(plan.agents.map((a) => [a.name, a]));
  const agents = [byName.get("orchestrator") || plan.agents[0]].filter(Boolean);
  const custom = [];
  for (const name of wanted) {
    if (name === "orchestrator") continue;
    if (byName.has(name)) agents.push(byName.get(name));
    else {
      custom.push(name);
      agents.push(normalizeAgent({
        name,
        group: "domain",
        mission: `Carry out work in the ${name} area following the 5 stages of the Skill File.`,
        runner: plan.evaluationLevel === "cross-validation" ? "both" : plan.evaluationLevel === "single-model" ? "claude" : "reviewer:codex",
        owns: [],
        triggers: ["This specialist agent is assigned on a kanban task."],
        inputs: ["CLAUDE.md", "config.js", "golden/"],
        outputs: ["list of changed files, verification results, reportSummary"],
        crossValidation: "Follows the evaluation-loop level setting.",
        failureHandling: "If the role is incomplete, copy agents/_TEMPLATE.md and fill in the 5 stages of the Skill File.",
      }, agents.length));
    }
  }
  return { plan: { ...plan, agents }, custom };
}

function buildQuestionPrompt(scan) {
  return [
    "You are configuring a local kanban multi-agent harness for a user's project.",
    "Do not ask for secrets. Do not ask for source code. Use only this sanitized repo summary.",
    "",
    "Return JSON only:",
    "{ \"questions\": [\"short question 1\", \"short question 2\", \"short question 3\"] }",
    "",
    "Repo summary:",
    JSON.stringify(sanitizeScan(scan), null, 2),
  ].join("\n");
}
function buildPlanPrompt(scan, answers, extraAnswers) {
  return [
    "Create a safe agent-kanban-harness configuration plan for this project.",
    "Use only the sanitized repo summary and the operator answers. Do not include secrets, local user names, or private data.",
    "Return JSON only with this shape:",
    "{ \"projectName\": string, \"goal\": string, \"boardDir\": string, \"kanbanPort\": number, \"deployCommands\": [{\"name\": string, \"cmd\": string, \"args\": string[]}], \"buildOutputDir\": string|null, \"agents\": [{\"name\": string, \"group\": \"core|domain\", \"mission\": string, \"runner\": \"claude|codex|both|reviewer:codex|reviewer:claude\", \"model_default\": string, \"owns\": string[], \"triggers\": string[], \"inputs\": string[], \"outputs\": string[], \"crossValidation\": string, \"failureHandling\": string}] }",
    "",
    "Repo summary:",
    JSON.stringify(sanitizeScan(scan), null, 2),
    "",
    "Base answers:",
    JSON.stringify(answers, null, 2),
    "",
    "Assistant interview answers:",
    JSON.stringify(extraAnswers, null, 2),
  ].join("\n");
}
function sanitizeScan(scan) {
  return {
    repoName: scan.repoName,
    packageManager: scan.packageManager,
    packageScripts: scan.packageScripts,
    topLevel: scan.topLevel,
    keyFiles: scan.keyFiles,
    commonDirs: scan.commonDirs,
    sampleFiles: scan.sampleFiles,
  };
}
function callAssistant(kind, prompt, cwd) {
  if (kind === "none") return "";
  const chosen = kind === "auto" ? (which("claude") ? "claude" : which("codex") ? "codex" : "none") : kind;
  if (chosen === "none") return "";
  let r;
  if (chosen === "claude") {
    r = spawnSync("claude", ["-p", "--output-format", "text", "--model", "sonnet", "--no-session-persistence"], {
      cwd, input: prompt, encoding: "utf-8", timeout: 180000, env: { ...process.env, FORCE_COLOR: "0" },
    });
  } else if (chosen === "codex") {
    r = spawnSync("codex", ["exec", "-"], {
      cwd, input: prompt, encoding: "utf-8", timeout: 180000, env: { ...process.env, FORCE_COLOR: "0" },
    });
  } else {
    return "";
  }
  if (r.error || r.status !== 0) return "";
  return r.stdout || "";
}
function parseJsonLoose(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const first = text.indexOf("{"), last = text.lastIndexOf("}");
  if (first >= 0 && last > first) { try { return JSON.parse(text.slice(first, last + 1)); } catch {} }
  return null;
}
function normalizePlan(raw, fallback, scan) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = { ...fallback };
  if (typeof src.projectName === "string" && src.projectName.trim()) out.projectName = src.projectName.trim();
  if (typeof src.goal === "string") out.goal = src.goal.trim();
  if (typeof src.boardDir === "string" && src.boardDir.trim()) out.boardDir = safeName(src.boardDir, fallback.boardDir);
  if (Number.isFinite(Number(src.kanbanPort))) out.kanbanPort = Number(src.kanbanPort);
  if (Array.isArray(src.deployCommands)) out.deployCommands = src.deployCommands.filter(validCommand).slice(0, 8);
  if (src.buildOutputDir === null || typeof src.buildOutputDir === "string") out.buildOutputDir = src.buildOutputDir || null;
  if (Array.isArray(src.agents) && src.agents.length) {
    const agents = src.agents.map((a, i) => normalizeAgent(a, i)).filter(Boolean);
    if (agents.length && !agents.some((a) => a.name === "orchestrator")) agents.unshift(fallback.agents[0]);
    if (agents.length) out.agents = agents;
  }
  if (!out.deployCommands.length) out.deployCommands = inferDeployCommands(scan);
  return out;
}
function validCommand(c) {
  return c && typeof c.name === "string" && typeof c.cmd === "string" && Array.isArray(c.args) && c.args.every((a) => typeof a === "string");
}
function normalizeAgent(a, i) {
  if (!a || typeof a !== "object") return null;
  const name = safeName(a.name, `agent-${i + 1}`);
  const runner = RUNNERS.has(a.runner) ? a.runner : "claude";
  const owns = Array.isArray(a.owns) ? a.owns.filter((g) => typeof g === "string" && g.trim() && !g.includes("..")).slice(0, 20) : [];
  return {
    name,
    group: a.group === "domain" ? "domain" : "core",
    mission: String(a.mission || `Own ${name} tasks.`).trim(),
    runner,
    model_default: String(a.model_default || (runner.includes("codex") ? "gpt-5.4" : "claude-sonnet-4-6")).trim(),
    owns,
    triggers: asLines(a.triggers),
    inputs: asLines(a.inputs),
    outputs: asLines(a.outputs),
    crossValidation: String(a.crossValidation || "Use the configured runner policy; escalate disagreements to in_review.").trim(),
    failureHandling: String(a.failureHandling || "If blocked, record the exact command, file, or decision needed and move to in_review.").trim(),
  };
}
function asLines(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).slice(0, 10);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return ["Operator-created kanban task."];
}

async function runGuidedSetup(opts = {}) {
  const cwd = path.resolve(opts.cwd || process.cwd());
  const cli = { claude: !!which("claude"), codex: !!which("codex") };
  const yes = !!opts.yes;
  console.log("");
  console.log("AI Harness 6-Week Completion Cohort, Week 3+ — setup --guided");
  console.log("Harness = the rein that keeps the AI in check = a bundle of design + files + procedure.");
  console.log("Decide just the following 5 things and the board is ready to drive your project.");
  console.log("");
  const repoPath = path.resolve(opts.repoPath || (yes ? cwd : await ask("1) Absolute path of the project this harness will drive (repoPath)", cwd)));
  if (!fs.existsSync(repoPath) || !fs.statSync(repoPath).isDirectory()) throw new Error(`repo path not found: ${repoPath}`);
  const scan = scanRepo(repoPath);
  const answers = {
    projectName: scan.repoName,
    boardDir: safeName(scan.repoName),
    port: "8080",
    goldenDir: yes ? "golden/" : await ask("2) Golden data location (golden/ folder; leave empty if none - register later)", "golden/"),
    evaluationLevel: "review",
    goal: "",
  };
  const assistant = opts.assistant || "auto";
  let selection = "default";
  const initialFallback = defaultPlan(answers, scan);
  if (!yes) {
    const names = initialFallback.agents.filter((a) => a.name !== "orchestrator").map((a) => a.name).join(", ");
    selection = await ask("3) Agent setup (choose the specialist agent names you need, comma-separated; if missing, write your own with _TEMPLATE)", names || "frontend-agent, backend-agent, deploy-gate-agent");
    answers.evaluationLevel = await ask("4) Evaluation-loop level (single-model / review / cross-validation)", "review");
    answers.goal = await ask("5) The project goal — what will you achieve after 6 weeks", "After 6 weeks — complete 1 automation that auto-generates the weekly report");
  }
  console.log("");
  console.log(`Repo scan: ${scan.repoName} · ${scan.packageManager} · scripts=${Object.keys(scan.packageScripts).join(", ") || "none"}`);
  console.log(`Local CLIs: Claude=${cli.claude ? "found" : "missing"} · Codex=${cli.codex ? "found" : "missing"}`);
  console.log(`Assistant mode: ${assistant}`);

  const fallback = defaultPlan(answers, scan);
  let plan = fallback;
  if (assistant !== "none" && (cli.claude || cli.codex)) {
    const raw = parseJsonLoose(callAssistant(assistant, buildPlanPrompt(scan, answers, { agentSelection: selection }), repoPath));
    plan = normalizePlan(raw, fallback, scan);
  }
  plan.goldenDir = answers.goldenDir || "golden/";
  plan.goal = typeof answers.goal === "string" ? answers.goal : (plan.goal || "");
  plan.evaluationLevel = normalizeEvaluationLevel(answers.evaluationLevel);
  plan = applyEvaluationLevel(plan);
  const selected = applyAgentSelection(plan, selection);
  plan = selected.plan;

  writePlan(cwd, plan, scan, { force: !!opts.force, dryRun: !!opts.dryRun });
  console.log("");
  console.log(`✓ guided setup ${opts.dryRun ? "planned" : "wrote"} ${plan.agents.length} agents for ${plan.projectName}`);
  console.log(`  config.js → repoPath=${repoPath}`);
  console.log(`  goal → ${plan.goal || "(empty)"}`);
  console.log(`  golden data → ${plan.goldenDir || "(register later)"}`);
  console.log(`  evaluation loop → ${plan.evaluationLevel}`);
  console.log(`  runners: ${[...new Set(plan.agents.map((a) => a.runner))].join(", ")}`);
  if (selected.custom.length) console.log(`  needs manual completion: ${selected.custom.join(", ")} — fill in with the 5 stages of the Skill File in agents/_TEMPLATE.md.`);
  console.log("");
  console.log("Next:");
  console.log(`  npm start  # → http://localhost:${plan.kanbanPort}`);
  console.log("  npx agent-kanban-harness doctor");
  console.log("  # The core (board, init, setup, gate) works without npm install");
  console.log("  # Run npm install once in the board folder only when using the Slack/Telegram mirror");
}

function renderConfig(plan) {
  const agents = plan.agents.map((a) => ({
    name: a.name,
    def: `agents/${a.name}.md`,
    runner: a.runner,
    ...(a.owns && a.owns.length ? { owns: a.owns } : {}),
  }));
  return `/**
 * Local agent-kanban-harness config generated by guided setup.
 *
 * This file is intentionally gitignored. Keep local paths and private
 * operational choices here; publish only config.example.js.
 */
module.exports = {
  projectName: ${q(plan.projectName)},
  goal: ${q(plan.goal || "")},
  repoPath: ${q(plan.repoPath)},
  goldenDir: ${q(plan.goldenDir || "golden/")},
  evaluationLevel: ${q(normalizeEvaluationLevel(plan.evaluationLevel))},
  kanbanPort: ${Number(plan.kanbanPort) || 8080},
  boardDir: ${q(plan.boardDir || "kanban")},
  deployCommands: ${JSON.stringify(plan.deployCommands || [], null, 2).replace(/^/gm, "  ").trim()},
  buildOutputDir: ${plan.buildOutputDir ? q(plan.buildOutputDir) : "null"},
  agents: ${JSON.stringify(agents, null, 2).replace(/^/gm, "  ").trim()},
  detectors: [],
  slack: { command: "/kanban" },
  telegram: { pollEnabled: true, pollIntervalMs: 1500 },
};
`;
}
function renderAgent(agent) {
  return `---
name: ${agent.name}
group: ${agent.group || "core"}
mission: >-
  ${agent.mission}
runner: ${agent.runner}
model_default: ${agent.model_default}
tools_allowed: [Read, Edit, Bash]
worktree: isolated
escalation: human
${agent.owns && agent.owns.length ? `owns:\n${agent.owns.map((g) => `  - ${g}`).join("\n")}` : "owns: []"}
---

# ${titleCase(agent.name)}

${agent.mission}

## Triggers
${agent.triggers.map((x) => `- ${x}`).join("\n")}

## Inputs
${agent.inputs.map((x) => `- ${x}`).join("\n")}

## Outputs
${agent.outputs.map((x) => `- ${x}`).join("\n")}

## Cross-validation policy
${agent.crossValidation}

## Failure handling
${agent.failureHandling}

## Hard rules
- Work only inside this agent's ownership unless the task explicitly routes a handoff.
- Do not commit or print secrets, .env values, private task history, or personal paths.
- Finish with exact files changed and verification commands run.
`;
}
function titleCase(slug) {
  return slug.split(/[-_]/).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
}
// The Kanban-First rule block planted in the target repo (repoPath). Claude Code / Codex
// read the CLAUDE.md of the working directory as automatic context, so the rule must also
// live at the work location to prevent the "rule not picked up when working outside the
// harness" problem.
const REPO_RULE_BEGIN = "<!-- agent-kanban-harness:kanban-rule:begin -->";
const REPO_RULE_END = "<!-- agent-kanban-harness:kanban-rule:end -->";

function renderRepoRule(plan) {
  const port = Number(plan.kanbanPort) || 8080;
  return `${REPO_RULE_BEGIN}
# agent-kanban-harness — Absolute Operating Rules for This Repository

This repository is the target project driven by the agent-kanban-harness kanban
board (http://localhost:${port}). When working in this repository with Claude Code /
Codex, follow the rules below without exception.

## Every task starts with a kanban card — no exceptions

**Every task** carried out in this repository (writing code, creating files,
refactoring, setting up agents, or anything else) must be registered as a task
(card) on the kanban board before it starts.

1. On receiving a user instruction, first \`POST http://localhost:${port}/api/tasks\` —
   \`{ subject, description, agent, priority }\`. Record the instruction verbatim in description.
2. Start the actual work only after moving the task to \`in_progress\`.
3. When the work is done, record \`reportSummary\` and move it to \`completed\`.

Work started without a card is a rule violation. "It's simple" or "the user asked
me to do it right away" are not exceptions. The kanban card is the very starting
point of the work.
Harness = the rein that keeps the AI in check — this rule is the first knot in that rein.
${REPO_RULE_END}`;
}

// Plant the rule block into the CLAUDE.md at repoPath (idempotent). Skip if it
// equals the harness directory (cwd) — the harness's own CLAUDE.md is managed separately.
function writeRepoRule(repoPath, cwd, plan, dryRun) {
  if (path.resolve(repoPath) === path.resolve(cwd)) return;
  const target = path.join(repoPath, "CLAUDE.md");
  if (dryRun) { console.log(`[dry-run] would write Kanban-First rule into ${target}`); return; }
  const block = renderRepoRule(plan);
  let next;
  if (fs.existsSync(target)) {
    const cur = fs.readFileSync(target, "utf-8");
    const b = cur.indexOf(REPO_RULE_BEGIN);
    const e = cur.indexOf(REPO_RULE_END);
    if (b !== -1 && e !== -1) {
      next = cur.slice(0, b) + block + cur.slice(e + REPO_RULE_END.length);
    } else {
      next = block + "\n\n" + cur;
    }
  } else {
    next = block + "\n";
  }
  fs.writeFileSync(target, next);
  console.log(`✓ Planted the Kanban-First rule into the work repo: ${target}`);
}

function writePlan(cwd, plan, scan, opts = {}) {
  const agentsDir = path.join(cwd, "agents");
  const configPath = path.join(cwd, "config.js");
  if (!opts.force && fs.existsSync(configPath) && !opts.dryRun) {
    throw new Error("config.js already exists. Re-run with --force to overwrite.");
  }
  const files = [
    { path: configPath, body: renderConfig({ ...plan, repoPath: scan.repoPath }) },
    ...plan.agents.map((a) => ({ path: path.join(agentsDir, `${a.name}.md`), body: renderAgent(a) })),
  ];
  if (opts.dryRun) {
    for (const f of files) console.log(`[dry-run] would write ${f.path}`);
    writeRepoRule(scan.repoPath, cwd, plan, true);
    return;
  }
  fs.mkdirSync(agentsDir, { recursive: true });
  for (const f of files) fs.writeFileSync(f.path, f.body);
  writeRepoRule(scan.repoPath, cwd, plan, false);
}
async function ask(question, def) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const suffix = def ? ` (${def})` : "";
  const answer = await new Promise((resolve) => rl.question(`${question}${suffix}: `, resolve));
  rl.close();
  return answer.trim() || def;
}

async function runDoctor(opts = {}) {
  const cwd = path.resolve(opts.cwd || process.cwd());
  const checks = [];
  const add = (ok, name, detail) => checks.push({ ok, name, detail });
  add(!!which("node"), "node on PATH", process.version);
  add(!!which("claude"), "claude CLI on PATH", which("claude") || "not found");
  add(!!which("codex"), "codex CLI on PATH", which("codex") || "not found");
  add(fs.existsSync(path.join(cwd, "config.js")), "config.js exists", path.join(cwd, "config.js"));
  add(fs.existsSync(path.join(cwd, "agents")), "agents directory exists", path.join(cwd, "agents"));
  const gitignore = fs.existsSync(path.join(cwd, ".gitignore")) ? fs.readFileSync(path.join(cwd, ".gitignore"), "utf-8") : "";
  add(gitignore.includes(".env"), ".env is gitignored", ".gitignore contains .env");
  add(gitignore.includes("config.js"), "config.js is gitignored", ".gitignore contains config.js");
  const suspect = scanPublicRisk(cwd);
  add(!suspect.length, "no obvious private files in project root", suspect.length ? suspect.join(", ") : "ok");
  for (const c of checks) console.log(`${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? " — " + c.detail : ""}`);
  return checks.every((c) => c.ok);
}
function scanPublicRisk(cwd) {
  const names = [".env", ".dashboard-out", "snapshot.json", "ops-thread.jsonl", "activity.jsonl"];
  return names.filter((n) => fs.existsSync(path.join(cwd, n)));
}

module.exports = { runGuidedSetup, runDoctor, scanRepo, defaultPlan };
