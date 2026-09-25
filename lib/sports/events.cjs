// 10XAI Sports — match/event schema + normalization.
//
// A match is the unit everything else consumes (ratings, Elo, backtest):
//
//   {
//     id, sport: "soccer" | "basketball", date: "YYYY-MM-DD",
//     home: "Team A", away: "Team B",
//     score: { home, away } | null,          // derived from events when omitted
//     source: { youtube?: "<videoId>", title?, kind?: "manual"|"commentary"|"tracking" },
//     lineups: { home: [{ player, minutes }], away: [...] },
//     events:  [{ t, team: "home"|"away", player, type, outcome? }]
//   }
//
// Events come from any of: a hand-logged sheet (CSV/JSON), commentary parsed out
// of a YouTube transcript (commentary.cjs), or a computer-vision tracker's output
// mapped onto the same types. Unknown types are dropped and reported, never guessed.

const SOCCER_TYPES = ["pass", "key_pass", "assist", "shot", "dribble", "tackle", "interception", "clearance", "save", "foul", "turnover", "card"];
const BASKETBALL_TYPES = ["fg2", "fg3", "ft", "rebound", "assist", "steal", "block", "turnover", "foul"];
const TYPES = { soccer: SOCCER_TYPES, basketball: BASKETBALL_TYPES };

// Default minutes for a player who shows up in events but not in a lineup.
const DEFAULT_MINUTES = { soccer: 90, basketball: 24 };

// Outcome vocabulary per type. The first entry is the default when omitted.
const OUTCOMES = {
  pass: ["success", "fail"],
  dribble: ["success", "fail"],
  tackle: ["success", "fail"],
  shot: ["off_target", "on_target", "blocked", "goal"],
  card: ["yellow", "red"],
  fg2: ["made", "missed"],
  fg3: ["made", "missed"],
  ft: ["made", "missed"],
  rebound: ["defensive", "offensive"],
};

const OUTCOME_ALIASES = {
  ok: "success", won: "success", complete: "success", completed: "success", true: "success",
  failed: "fail", lost: "fail", incomplete: "fail", false: "fail",
  saved: "on_target", on: "on_target", target: "on_target", off: "off_target", wide: "off_target", miss: "off_target",
  scored: "goal", make: "made", hit: "made", good: "made", missed: "missed", "no good": "missed",
  off_reb: "offensive", oreb: "offensive", o: "offensive", def_reb: "defensive", dreb: "defensive", d: "defensive",
};

function parseTime(t) {
  if (t == null || t === "") return null;
  if (typeof t === "number") return t;
  const parts = String(t).trim().split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function normOutcome(type, outcome) {
  const allowed = OUTCOMES[type];
  if (!allowed) return outcome == null || outcome === "" ? null : String(outcome);
  if (outcome == null || outcome === "") return allowed[0];
  let o = String(outcome).trim().toLowerCase().replace(/[\s-]+/g, "_");
  o = OUTCOME_ALIASES[o] || OUTCOME_ALIASES[o.replace(/_/g, " ")] || o;
  // shot with "made"/"missed" style outcomes from mixed sources
  if (type === "shot" && o === "missed") o = "off_target";
  return allowed.includes(o) ? o : null;
}

function sideOf(team, home, away) {
  if (team == null) return null;
  const s = String(team).trim();
  if (s === "home" || s === home) return "home";
  if (s === "away" || s === away) return "away";
  const low = s.toLowerCase();
  if (low === String(home).toLowerCase()) return "home";
  if (low === String(away).toLowerCase()) return "away";
  return null;
}

// Normalize a raw match. Returns { match, warnings }. Throws only on a match that
// can't be identified at all (no sport / teams).
function normalizeMatch(raw) {
  if (!raw || typeof raw !== "object") throw new Error("match must be an object");
  const sport = String(raw.sport || "").toLowerCase();
  if (!TYPES[sport]) throw new Error(`sport must be one of ${Object.keys(TYPES).join(", ")}`);
  const home = String(raw.home || "").trim();
  const away = String(raw.away || "").trim();
  if (!home || !away) throw new Error("home and away team names are required");
  if (home === away) throw new Error("home and away must differ");

  const warnings = [];
  const types = TYPES[sport];
  const events = [];
  (Array.isArray(raw.events) ? raw.events : []).forEach((e, i) => {
    let type = String((e && e.type) || "").trim().toLowerCase();
    let outcome = e && e.outcome;
    // "goal" is sugar for a shot that went in — keeps shots/goals from double-counting.
    if (sport === "soccer" && type === "goal") { type = "shot"; outcome = "goal"; }
    if (sport === "basketball" && (type === "3pt" || type === "three")) type = "fg3";
    if (sport === "basketball" && (type === "2pt" || type === "fg")) type = "fg2";
    if (!types.includes(type)) { warnings.push(`event ${i}: unknown ${sport} type "${e && e.type}" dropped`); return; }
    const side = sideOf(e.team, home, away);
    if (!side) { warnings.push(`event ${i}: team "${e.team}" is neither home nor away — dropped`); return; }
    const player = String(e.player || "").trim();
    if (!player) { warnings.push(`event ${i}: no player — dropped`); return; }
    const o = normOutcome(type, outcome);
    if (OUTCOMES[type] && o == null) { warnings.push(`event ${i}: outcome "${outcome}" invalid for ${type} — dropped`); return; }
    const ev = { t: parseTime(e.t), team: side, player, type };
    if (o != null) ev.outcome = o;
    if (typeof e.confidence === "number") ev.confidence = e.confidence;
    events.push(ev);
  });

  // Lineups: explicit, else inferred from who appears in events.
  const lineups = { home: [], away: [] };
  for (const side of ["home", "away"]) {
    const given = raw.lineups && Array.isArray(raw.lineups[side]) ? raw.lineups[side] : null;
    if (given) {
      for (const p of given) {
        const name = typeof p === "string" ? p : p && p.player;
        if (!name) continue;
        const minutes = typeof p === "object" && typeof p.minutes === "number" ? p.minutes : DEFAULT_MINUTES[sport];
        lineups[side].push({ player: String(name).trim(), minutes });
      }
    }
    const known = new Set(lineups[side].map((p) => p.player));
    for (const ev of events) {
      if (ev.team === side && !known.has(ev.player)) {
        known.add(ev.player);
        lineups[side].push({ player: ev.player, minutes: DEFAULT_MINUTES[sport], inferred: true });
      }
    }
  }

  let score = raw.score && typeof raw.score.home === "number" && typeof raw.score.away === "number"
    ? { home: raw.score.home, away: raw.score.away } : null;
  const derived = scoreFromEvents(sport, events);
  if (!score && (derived.home || derived.away)) { score = derived; warnings.push("score derived from events"); }

  const date = raw.date ? String(raw.date).slice(0, 10) : null;
  const id = String(raw.id || `${date || "undated"}-${slug(home)}-${slug(away)}`);
  const source = Object.assign({ kind: "manual" }, raw.source || {});
  return { match: { id, sport, date, home, away, score, source, lineups, events }, warnings };
}

function scoreFromEvents(sport, events) {
  const s = { home: 0, away: 0 };
  for (const e of events) {
    if (sport === "soccer" && e.type === "shot" && e.outcome === "goal") s[e.team] += 1;
    if (sport === "basketball" && e.outcome === "made") s[e.team] += e.type === "fg3" ? 3 : e.type === "fg2" ? 2 : 1;
  }
  return s;
}

function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, ""); }

// Minimal CSV → events. Header row required; supports quoted fields.
// Columns: t,team,player,type,outcome
function parseEventsCsv(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const cells = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells.map((c) => c.trim()));
  }
  if (!rows.length) return [];
  const header = rows.shift().map((h) => h.toLowerCase());
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] === undefined ? "" : r[i]])));
}

module.exports = { TYPES, OUTCOMES, DEFAULT_MINUTES, normalizeMatch, parseEventsCsv, parseTime, scoreFromEvents };
