#!/usr/bin/env node
// 10XAI Sports CLI.  npm run sports -- <command>
//
//   demo [seed]                                   seed data/sports with a synthetic (fictional) soccer + basketball league
//   import <file.json|file.csv> [--sport s --home A --away B --date D]
//   commentary <transcript.txt> --sport s --home A --away B --roster roster.json [--date D] [--save] [--extractor heuristic|claude]
//   youtube <url>                                 metadata + title guess + gated acquisition plan
//   players --sport s [--team T] [--top N]
//   predict --sport s --home A --away B [--lineups lineups.json]
//   backtest --sport s
const fs = require("fs");
const store = require("./store.cjs");
const { parseEventsCsv } = require("./events.cjs");
const { computeRatings } = require("./ratings.cjs");
const { predictMatch, backtest } = require("./predict.cjs");
const yt = require("./youtube.cjs");
const { extractEvents } = require("./commentary.cjs");

function flags(argv) {
  const pos = [], f = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { const k = argv[i].slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true; f[k] = v; }
    else pos.push(argv[i]);
  }
  return { pos, f };
}
const out = (x) => console.log(typeof x === "string" ? x : JSON.stringify(x, null, 2));
const pctS = (p) => (p * 100).toFixed(1) + "%";

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, f } = flags(rest);
  switch (cmd) {
    case "demo": {
      const { generateLeague } = require("../../examples/sports/generate.cjs");
      let n = 0;
      for (const sport of ["soccer", "basketball"]) for (const m of generateLeague(sport, +(pos[0] || 42)).matches) { store.saveMatch(m); n++; }
      return out(`seeded ${n} synthetic matches (fictional teams) into ${store.root()}`);
    }
    case "import": {
      const text = fs.readFileSync(pos[0], "utf-8");
      const raws = pos[0].endsWith(".csv")
        ? [{ sport: f.sport, home: f.home, away: f.away, date: f.date, events: parseEventsCsv(text) }]
        : [].concat(JSON.parse(text));
      for (const raw of raws) { const { match, warnings } = store.saveMatch(raw); out(`saved ${match.id} (${match.events.length} events)` + (warnings.length ? `\n  warnings: ${warnings.slice(0, 5).join("; ")}` : "")); }
      return;
    }
    case "commentary": {
      const text = fs.readFileSync(pos[0], "utf-8");
      const roster = f.roster ? JSON.parse(fs.readFileSync(f.roster, "utf-8")) : {};
      const ex = await extractEvents(text, { sport: f.sport, roster, home: f.home, away: f.away, extractor: f.extractor || "auto" });
      const raw = { sport: f.sport, home: f.home, away: f.away, date: f.date, events: ex.events, source: { kind: "commentary", extractor: ex.extractor },
        lineups: { home: (roster.home || []).map((player) => ({ player })), away: (roster.away || []).map((player) => ({ player })) } };
      if (f.save) { const { match } = store.saveMatch(raw); out(`saved ${match.id}`); }
      return out({ extractor: ex.extractor, coverage: ex.coverage, events: ex.events });
    }
    case "youtube": {
      const id = yt.parseVideoId(pos[0]);
      if (!id) throw new Error("not a YouTube URL");
      const meta = await yt.fetchMetadata(id);
      return out({ videoId: id, metadata: meta, guess: yt.parseTitle(meta && meta.title), plan: yt.acquisitionPlan(id, meta).map((s) => `${s.risk.score >= 70 ? "⛔ GATED" : "✓"} [risk ${s.risk.score}] ${s.subject}`) });
    }
    case "players": {
      const sport = f.sport || "soccer";
      let rows = computeRatings(store.listMatches(sport), { sport, halfLifeDays: f.halfLife ? +f.halfLife : undefined });
      if (f.team) rows = rows.filter((r) => r.team === f.team);
      for (const r of rows.slice(0, +(f.top || 20))) {
        const attrs = Object.entries(r.attributes).filter(([, v]) => v != null).map(([k, v]) => `${k} ${v}`).join(" · ");
        out(`${String(r.overall).padStart(2)}  ${r.player.padEnd(18)} ${r.team.padEnd(18)} ${String(r.minutes).padStart(5)}m  ${attrs}${r.sample === "small" ? "  (small sample)" : ""}`);
      }
      return;
    }
    case "predict": {
      const lineups = f.lineups ? JSON.parse(fs.readFileSync(f.lineups, "utf-8")) : undefined;
      const p = predictMatch(store.listMatches(f.sport), { sport: f.sport, home: f.home, away: f.away, lineups, neutral: !!f.neutral });
      out(`${p.home} vs ${p.away}  (Elo diff ${p.eloDiff >= 0 ? "+" : ""}${p.eloDiff})`);
      out(Object.entries(p.probabilities).map(([k, v]) => `${k} ${pctS(v)}`).join("  ·  "));
      if (p.expectedGoals) out(`xG ${p.expectedGoals.home} – ${p.expectedGoals.away}   likely: ${p.likelyScores.map((s) => `${s.score} (${pctS(s.p)})`).join(", ")}`);
      if (p.spread != null) out(`spread ${p.spread > 0 ? p.home : p.away} by ${Math.abs(p.spread)}   projected ${p.expectedPoints.home}–${p.expectedPoints.away}`);
      for (const s of ["home", "away"]) out(`${p.teams[s].team}: key players ${p.teams[s].keyPlayers.map((k) => `${k.player} (${k.overall})`).join(", ")}`);
      out("biggest matchup edges: " + p.matchups.slice(0, 4).map((m) => `${m.attribute} ${m.edge > 0 ? "+" : ""}${m.edge}`).join(", "));
      for (const n of p.notes) out("note: " + n);
      return;
    }
    case "backtest": {
      const b = backtest(store.listMatches(f.sport), f.sport);
      if (!b.n) return out(b.note);
      out(`${f.sport}: ${b.n} matches predicted walk-forward (warmup ${b.warmup})`);
      out(`model     brier ${b.model.brier}  logloss ${b.model.logLoss}  accuracy ${pctS(b.model.accuracy)}`);
      out(`baseline  brier ${b.baseline.brier}  logloss ${b.baseline.logLoss}  accuracy ${pctS(b.baseline.accuracy)}`);
      return;
    }
    default:
      out(fs.readFileSync(__filename, "utf-8").split("\n").slice(1, 11).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  }
}

main().catch((e) => { console.error("error: " + e.message); process.exit(1); });
