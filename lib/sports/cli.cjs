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
//
//   soccer scouting & tactics:
//   import-statsbomb --competition 43 --season 106 [--team France] [--dir local/open-data/data]
//   profile  --team T [--player "Name"]            archetype, strengths/weaknesses, form, fatigue, how to play against
//   scout    --team THEM [--us US]                 opponent report + ranked recommendations
//   lineup   --us US --them THEM [--venue home|away|neutral] [--objective points|win|avoid_loss] [--formation 4-3-3] [--out "A,B"]
//   subs     --us US --them THEM --minute 65 --score 0-1 [--on "A,B,…"] [--bench "C,D"] [--objective win]
//   gameplan --us US --them THEM [--venue …] [--objective …]
const fs = require("fs");
const store = require("./store.cjs");
const { parseEventsCsv } = require("./events.cjs");
const { computeRatings } = require("./ratings.cjs");
const { predictMatch, backtest } = require("./predict.cjs");
const yt = require("./youtube.cjs");
const { extractEvents } = require("./commentary.cjs");
const { buildProfiles } = require("./profile.cjs");
const { scoutTeam } = require("./scout.cjs");
const tactics = require("./tactics.cjs");
const statsbomb = require("./importers/statsbomb.cjs");
const list = (x) => (typeof x === "string" ? x.split(",").map((v) => v.trim()).filter(Boolean) : undefined);

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
      if (b.lineupBlind) out(`lineups ignored  brier ${b.lineupBlind.brier}  logloss ${b.lineupBlind.logLoss}  accuracy ${pctS(b.lineupBlind.accuracy)}`);
      return;
    }
    case "import-statsbomb": {
      let n = 0;
      await statsbomb.importSeason({ competitionId: +f.competition, seasonId: +f.season, team: f.team, dir: f.dir, limit: f.limit ? +f.limit : undefined,
        onMatch: (m) => { store.saveMatch(m); n++; out(`  ${m.date} ${m.home} ${m.score.home}-${m.score.away} ${m.away} (${m.events.length} events)`); } });
      return out(`imported ${n} matches. ${statsbomb.ATTRIBUTION}`);
    }
    case "profile": {
      let ps = buildProfiles(store.listMatches("soccer"), { team: f.team });
      if (f.player) ps = ps.filter((p) => p.player === f.player);
      for (const p of ps.slice(0, +(f.top || 30))) {
        out(`\n${p.player} · ${p.position || "?"} · ${p.team} · ${p.minutes}' in ${p.matches} matches`);
        out(`  ${p.verdict}`);
        if (p.zone) out(`  zone: ${p.zone.summary}`);
        for (const x of p.strengths) out(`  + ${x.attribute} ${x.value}: ${x.evidence}`);
        for (const x of p.weaknesses) out(`  − ${x.attribute} ${x.value}: ${x.evidence}`);
        if (p.fatigue) out(`  late game: ${p.fatigue.label}, ${p.fatigue.summary}`);
        out(`  last matches: ${p.matchRatings.slice(-5).map((m) => `${m.rating ?? "–"} vs ${m.opponent}`).join(" · ")}`);
        for (const t of p.howToPlayAgainst) out(`  ▸ ${t}`);
      }
      return;
    }
    case "scout": {
      const R = scoutTeam(store.listMatches("soccer"), f.team, { us: f.us });
      out(`SCOUTING REPORT: ${R.team}   ${R.record.W}W ${R.record.D}D ${R.record.L}L in ${R.matches} (confidence: ${R.confidence})`);
      out(`per match: ${R.perMatch.goalsFor}–${R.perMatch.goalsAgainst} goals, xG ${R.perMatch.xgFor}–${R.perMatch.xgAgainst}${R.formation ? `, usual shape ${R.formation.shape}` : ""}`);
      if (R.style.length) out(`style: ${R.style.map((x) => x.trait).join(" · ")}`);
      if (R.defense.concededByFlank) out(`xG conceded by their flank: left ${pctS(R.defense.concededByFlank.L)} · central ${pctS(R.defense.concededByFlank.C)} · right ${pctS(R.defense.concededByFlank.R)}`);
      out("\nKEY THREATS"); for (const k of R.keyThreats) out(`  ${k.player} (${k.position}, ${k.overall}): ${k.verdict}`);
      out("\nWEAK LINKS"); for (const w of R.weakLinks) out(`  ${w.player} (${w.position}): ${w.reasons.map((r) => `${r.what}: ${r.evidence}`).join(" · ")}`);
      out("\nRECOMMENDATIONS"); R.recommendations.forEach((r, i) => out(`  ${i + 1}. ${r.title}\n     ${r.detail}`));
      if (R.attribution) out(`\n${R.attribution}`);
      return;
    }
    case "lineup": {
      const L = tactics.bestLineup(store.listMatches("soccer"), { us: f.us, them: f.them, venue: f.venue, objective: f.objective, formation: f.formation, unavailable: list(f.out) || [] });
      const ev = (e) => `W ${pctS(e.win)} D ${pctS(e.draw)} L ${pctS(e.loss)} · xG ${e.xgFor}–${e.xgAgainst} · objective ${e.value}`;
      out(`${L.us} vs ${L.them} (${L.venue}, objective: ${L.objective})`);
      out(`recommended ${L.recommended.formation}: ${ev(L.recommended.eval)}`);
      out(`  ${L.recommended.xi.map((p) => `${p.player} (${p.position}${p.channel ? " " + p.channel : ""})`).join(", ")}`);
      out(`usual XI: ${ev(L.usual.eval)}   gain ${L.gain >= 0 ? "+" : ""}${L.gain}`);
      if (L.changesFromUsual.in.length) out(`changes: in ${L.changesFromUsual.in.join(", ")} · out ${L.changesFromUsual.out.join(", ")}`);
      for (const a of L.alternatives) out(`alt ${a.formation}: ${ev(a.eval)}`);
      for (const n of L.notes) out("note: " + n);
      return;
    }
    case "subs": {
      const [su, st] = String(f.score || "0-0").split("-").map(Number);
      const on = list(f.on), bench = list(f.bench);
      const P = tactics.planSubstitutions(store.listMatches("soccer"), { us: f.us, them: f.them, minute: +f.minute, score: { us: su, them: st },
        onPitch: on ? on.map((player) => ({ player, on: 0 })) : undefined, bench, venue: f.venue, objective: f.objective, subsLeft: f.subsLeft ? +f.subsLeft : 5 });
      out(`${P.minute}' ${P.us} ${su}-${st} ${P.them} (${P.state}): now W ${pctS(P.current.win)} D ${pctS(P.current.draw)} L ${pctS(P.current.loss)}`);
      out(P.advice);
      for (const o of P.options.slice(0, 5)) out(`  ${o.gain >= 0 ? "+" : ""}${o.gain}  ${o.subs.map((x) => `${x.in} for ${x.out}`).join(" & ")}  (win ${o.winProbChange >= 0 ? "+" : ""}${pctS(o.winProbChange)})\n       ${o.subs.map((x) => x.why).join(" | ")}`);
      out(`most tired: ${P.fatigue.map((x) => `${x.player} ${pctS(x.condition)}`).join(", ")}`);
      return;
    }
    case "gameplan": {
      const G = tactics.gamePlan(store.listMatches("soccer"), { us: f.us, them: f.them, venue: f.venue, objective: f.objective, formation: f.formation, unavailable: list(f.out) || [] });
      out(`GAME PLAN: ${G.us} vs ${G.them}`);
      out(`forecast with usual XI: W ${pctS(G.prediction.usualXI.win)} D ${pctS(G.prediction.usualXI.draw)} L ${pctS(G.prediction.usualXI.loss)} → recommended XI: W ${pctS(G.prediction.recommendedXI.win)} D ${pctS(G.prediction.recommendedXI.draw)} L ${pctS(G.prediction.recommendedXI.loss)}`);
      out(`XI (${G.lineup.recommended.formation}): ${G.lineup.recommended.xi.map((p) => p.player).join(", ")}`);
      out(`\nthem: ${G.opponent.style.join(" · ") || "no stand-out style traits"}`);
      G.recommendations.forEach((r, i) => out(`  ${i + 1}. ${r.title}: ${r.detail}`));
      out("\nwhat they may exploit in you:"); for (const v of G.ourVulnerabilities) out(`  - ${v.title}`);
      out("\nsubstitution plan:"); for (const x of G.substitutionPlan) out(`  ${x.minute}' ${x.state.padEnd(12)} ${x.sub ? `${x.sub.in} for ${x.sub.out} (+${x.gain})` : "hold"}`);
      return;
    }
    default:
      out(fs.readFileSync(__filename, "utf-8").split("\n").slice(1, 19).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  }
}

main().catch((e) => { console.error("error: " + e.message); process.exit(1); });
