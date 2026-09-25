// 10XAI Sports — commentary / transcript → match events.
//
// Two extractors, same output shape ({ t, team, player, type, outcome, confidence }):
//
//   heuristic  — local keyword rules (English + Korean) over a known roster. Fast,
//                free, deterministic, but only sees what the commentator says out
//                loud: goals, shots, big saves, threes, dunks. Passing volume is
//                invisible to it — attribute ratings built from commentary alone
//                are biased toward "headline" actions. The coverage report says so.
//   claude     — the local `claude` CLI with agents/sports-extract-agent.md. Handles
//                phrasing the rules miss. Falls back to heuristic if the CLI is absent.
//
// Actor rule: each action keyword is credited to the nearest roster player
// mentioned *before* it in the sentence ("Saka crosses for Havertz who scores" →
// goal: Havertz, key pass: Saka), else the nearest one after it.

const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

const RULES = {
  soccer: [
    { type: "shot", outcome: "goal", re: /\b(goal|scores?|scored|finds the net|nets|buries it|slots (?:it )?home)\b|골|득점/gi },
    { type: "assist", re: /\b(assist(?:ed)?|sets? up|set up by|cross(?:es)? for|squares? (?:it )?for|lays? it on|slides? (?:it )?through for|through ball for|picks out|finds)\b|도움|어시스트/gi, needsGoal: true },
    { type: "shot", re: /\b(shoots?|shot|strike|effort|volley|header|curls? (?:one|it)|fires?)\b|슈팅|슛/gi, skipIfGoal: true },
    { type: "save", re: /\b(saves?|denies|denied|parr(?:y|ies)|tips? it (?:over|round)|keeps it out)\b|선방|막아/gi },
    { type: "key_pass", re: /\b(through ball|key pass|slides? (?:it )?through|picks out|threads?)\b|킬패스|스루패스/gi, skipIfGoal: true },
    { type: "dribble", re: /\b(dribbles?|skips past|beats (?:his|her) (?:man|marker)|takes on|jinks|nutmegs?)\b|드리블|제치/gi },
    { type: "tackle", outcome: "success", re: /\b(tackles?|wins the ball|won the ball)\b|태클/gi },
    { type: "interception", re: /\b(intercepts?|interception|cuts (?:it )?out|reads the pass)\b|가로채|인터셉트/gi },
    { type: "clearance", re: /\b(clears?|cleared|clearance|hacks it away)\b|걷어/gi },
    { type: "card", outcome: "red", re: /\b(red card|sent off|dismissed)\b|퇴장/gi },
    { type: "card", outcome: "yellow", re: /\b(yellow card|booked|booking)\b|경고/gi },
    { type: "foul", re: /\b(fouls?|fouled by|brings? down|clips)\b|파울/gi },
    { type: "turnover", re: /\b(gives it away|loses possession|dispossessed|misplaced pass)\b|볼을 빼앗/gi },
  ],
  basketball: [
    { type: "fg3", re: /\b(three|3-pointer|three-pointer|from downtown|from deep|triple|trey)\b|3점/gi },
    { type: "fg2", re: /\b(lay-?up|dunks?|slams?|jumper|jump shot|floater|hook shot|mid-range|fadeaway|putback|finger roll|and-one)\b|레이업|덩크|점프슛|골밑/gi },
    { type: "ft", re: /\b(free throws?|foul shots?|from the line)\b|자유투/gi },
    { type: "rebound", re: /\b(rebounds?|boards?|putback)\b|리바운드/gi },
    { type: "assist", re: /\b(assists?|dishes|finds|feeds|kicks? (?:it )?out to|lobs? (?:it )?to|alley-?oop to)\b|어시스트|도움/gi },
    { type: "steal", re: /\b(steals?|picks (?:his|her) pocket|picks (?:it )?off|poke[sd]? (?:it )?away)\b|스틸/gi },
    { type: "block", re: /\b(blocks?|blocked|swats?|swatted|rejects?|rejected|stuffs?)\b|블록|블락/gi },
    { type: "turnover", re: /\b(turnovers?|travels?|traveling|throws it away|loses it|offensive foul|shot clock violation)\b|턴오버|실책/gi },
    { type: "foul", re: /\b(fouls?|fouled)\b(?! shots?)|파울/gi },
  ],
};

const MISS_RE = /\b(miss(?:es|ed)?|no good|off the rim|rims? out|clanks?|short|wide|over the bar|off target|blocked)\b|실패|놓[쳤치]|빗나/i;
const SAVED_RE = /\b(saved|saves?|keeper|parried|denied|on target)\b|선방|막/i;
const BLOCKED_RE = /\bblocked\b|블록/i;
const DRIBBLE_FAIL_RE = /\b(dispossessed|loses it|tackled|crowded out)\b|빼앗/i;
const OFF_REB_RE = /\b(offensive (?:rebound|board)|putback|second chance)\b|공격 리바운드/i;
const TS_RE = /^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*[-–]?\s*/;

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
const isLatin = (s) => /^[\x00-\x7FÀ-ɏ\s'.-]+$/.test(s);

// roster: { home: [name,...], away: [name,...] } — returns [{ player, team, re }]
function buildMatchers(roster) {
  const all = [];
  for (const side of ["home", "away"]) for (const name of roster[side] || []) all.push({ player: String(name).trim(), team: side });
  const lastCount = {};
  for (const p of all) { const parts = p.player.split(/\s+/); if (parts.length > 1) { const l = parts[parts.length - 1].toLowerCase(); lastCount[l] = (lastCount[l] || 0) + 1; } }
  return all.map((p) => {
    const aliases = [p.player];
    const parts = p.player.split(/\s+/);
    if (parts.length > 1) { const last = parts[parts.length - 1]; if (last.length >= 3 && lastCount[last.toLowerCase()] === 1) aliases.push(last); }
    const src = aliases.map((a) => (isLatin(a) ? `\\b${escapeRe(a)}\\b` : escapeRe(a))).join("|");
    return { ...p, re: new RegExp(src, "gi") };
  });
}

function mentionsIn(sentence, matchers) {
  const out = [];
  for (const m of matchers) {
    m.re.lastIndex = 0; let x;
    while ((x = m.re.exec(sentence))) out.push({ player: m.player, team: m.team, pos: x.index, end: x.index + x[0].length });
  }
  return out.sort((a, b) => a.pos - b.pos);
}

function actorFor(pos, mentions, exclude) {
  const cands = mentions.filter((m) => m.player !== exclude && m.end <= pos);
  if (cands.length) return cands[cands.length - 1];
  return mentions.find((m) => m.player !== exclude && m.pos >= pos) || null;
}

function splitSentences(text) {
  const out = [];
  let t = null;
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(TS_RE);
    if (m) t = m[1];
    const body = m ? line.slice(m[0].length) : line;
    for (const s of body.split(/(?<=[.!?。])\s+/)) if (s.trim()) out.push({ t, text: s.trim() });
  }
  return out;
}

function heuristicExtract(text, { sport, roster }) {
  const rules = RULES[sport];
  if (!rules) throw new Error("unsupported sport: " + sport);
  const matchers = buildMatchers(roster || {});
  if (!matchers.length) throw new Error("heuristic extraction needs a roster ({ home:[names], away:[names] })");
  const sentences = splitSentences(text);
  const events = []; let matched = 0;
  for (const { t, text: s } of sentences) {
    const mentions = mentionsIn(s, matchers);
    if (!mentions.length) continue;
    const hasGoal = sport === "soccer" && rules[0].re.test(s); rules[0].re.lastIndex = 0;
    const before = events.length;
    let scorer = null;
    for (const rule of rules) {
      if (rule.needsGoal && !hasGoal) continue;
      if (rule.skipIfGoal && hasGoal) continue;
      rule.re.lastIndex = 0;
      const x = rule.re.exec(s);
      if (!x) continue;
      // assists go to someone other than the scorer
      const actor = actorFor(x.index, mentions, rule.type === "assist" ? scorer : null);
      if (!actor) continue;
      const ev = { t, team: actor.team, player: actor.player, type: rule.type, confidence: 0.6, text: s.slice(0, 160) };
      if (rule.outcome) ev.outcome = rule.outcome;
      else if (rule.type === "shot") { ev.outcome = BLOCKED_RE.test(s) ? "blocked" : SAVED_RE.test(s) ? "on_target" : "off_target"; if (!MISS_RE.test(s) && !SAVED_RE.test(s)) ev.confidence = 0.45; }
      else if (rule.type === "dribble") ev.outcome = DRIBBLE_FAIL_RE.test(s) ? "fail" : "success";
      else if (rule.type === "fg2" || rule.type === "fg3") ev.outcome = MISS_RE.test(s) ? "missed" : "made";
      else if (rule.type === "rebound") ev.outcome = OFF_REB_RE.test(s) ? "offensive" : "defensive";
      if (rule.type === "save") {
        // the keeper is on the other side from whoever shot
        const shooter = events.slice(before).find((e) => e.type === "shot");
        const keeper = shooter ? mentions.find((m) => m.team !== shooter.team) : actor;
        if (!keeper) continue;
        ev.team = keeper.team; ev.player = keeper.player;
      }
      if (rule.type === "ft") {
        const n = /\b(both|two|2 of 2|pair)\b|둘 다|2개/i.test(s) ? 2 : /\b(splits|1 of 2|one of two)\b/i.test(s) ? -1 : 1;
        if (n === -1) { events.push({ ...ev, outcome: "made" }, { ...ev, outcome: "missed" }); continue; }
        for (let i = 0; i < n; i++) events.push({ ...ev, outcome: MISS_RE.test(s) ? "missed" : "made" });
        continue;
      }
      if (ev.type === "shot" && ev.outcome === "goal") scorer = ev.player;
      events.push(ev);
    }
    if (events.length > before) matched++;
  }
  return { events, coverage: coverage(sentences.length, matched, events, sport), extractor: "heuristic" };
}

function coverage(sentences, matched, events, sport) {
  const byType = {};
  for (const e of events) byType[e.type] = (byType[e.type] || 0) + 1;
  const notes = [];
  if (sport === "soccer" && !(byType.pass > 0)) notes.push("no pass events — commentary rarely narrates routine passes; passing ratings fall back to the population prior");
  return { sentences, sentencesWithEvents: matched, events: events.length, byType, notes };
}

function agentPrompt() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "..", "..", "agents", "sports-extract-agent.md"), "utf-8");
    const m = raw.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
    return (m ? m[1] : raw).trim();
  } catch { return "Extract match events from the commentary as a JSON array."; }
}

function claudeAvailable() { try { execSync("which claude", { stdio: "ignore" }); return true; } catch { return false; } }

function runClaude(prompt, timeoutMs) {
  return new Promise((resolve) => {
    const env = Object.assign({}, process.env); delete env.CLAUDECODE;
    const proc = spawn("claude", ["-p", "--model", "sonnet", "--no-session-persistence"], { env, stdio: ["pipe", "pipe", "pipe"] });
    let out = ""; const timer = setTimeout(() => proc.kill("SIGTERM"), timeoutMs);
    proc.stdout.on("data", (d) => (out += d));
    proc.on("close", (code) => { clearTimeout(timer); resolve(code === 0 ? out : null); });
    proc.on("error", () => { clearTimeout(timer); resolve(null); });
    proc.stdin.end(prompt);
  });
}

function parseJsonArray(text) {
  if (!text) return null;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) s = fence[1];
  const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

async function extractEvents(text, { sport, roster, home, away, extractor = "auto", timeoutMs = 180000 }) {
  const wantClaude = extractor === "claude" || (extractor === "auto" && claudeAvailable());
  if (wantClaude) {
    const prompt = [agentPrompt(), "", "## Match", JSON.stringify({ sport, home, away, roster }, null, 2), "", "## Commentary", String(text).slice(0, 60000)].join("\n");
    const arr = parseJsonArray(await runClaude(prompt, timeoutMs));
    if (Array.isArray(arr)) {
      const events = arr.filter((e) => e && e.player && e.type).map((e) => ({ ...e, confidence: typeof e.confidence === "number" ? e.confidence : 0.7 }));
      return { events, coverage: coverage(splitSentences(text).length, null, events, sport), extractor: "claude" };
    }
    if (extractor === "claude") throw new Error("claude extraction failed or returned no JSON array");
  }
  return heuristicExtract(text, { sport, roster });
}

module.exports = { heuristicExtract, extractEvents, splitSentences, RULES };
