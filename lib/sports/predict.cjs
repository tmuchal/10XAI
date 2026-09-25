// 10XAI Sports — team strength + match prediction + walk-forward backtest.
//
// Team strength = results-based Elo  +  lineup adjustment from player ratings.
//   · Elo captures "who actually wins" (margin-aware, home advantage).
//   · The lineup adjustment captures "who is actually playing": if the expected
//     XI / five is stronger or weaker than the team's usual minutes-weighted
//     roster, the Elo is shifted by LINEUP_ELO_PER_POINT per rating point.
//
// Soccer:     Elo diff → expected goals per side → independent Poisson → P(H/D/A) + scorelines
// Basketball: Elo diff → win probability (logistic) + point spread (diff/28, 538-style)
//
// Every prediction can be backtested walk-forward (only data before kickoff is
// used), reporting Brier / log-loss / accuracy against naive baselines.

const { computeRatings } = require("./ratings.cjs");
const LM = require("./lineup-model.cjs");

const PARAMS = {
  soccer: { k: 20, hfa: 60, init: 1500, lineupEloPerPoint: 6, goalK: 0.0011, baseGoals: 1.35, maxGoals: 10 },
  basketball: { k: 20, hfa: 100, init: 1500, lineupEloPerPoint: 8, spreadDiv: 28, basePts: 110 },
};

const expectScore = (d) => 1 / (1 + Math.pow(10, -d / 400));

function byDate(a, b) { return String(a.date || "").localeCompare(String(b.date || "")); }

function buildElo(matches, sport) {
  const P = PARAMS[sport];
  const elo = new Map();
  const get = (t) => (elo.has(t) ? elo.get(t) : P.init);
  const played = new Map();
  for (const m of matches.filter((x) => x.sport === sport && x.score).sort(byDate)) {
    const rh = get(m.home), ra = get(m.away);
    const d = rh + P.hfa - ra;
    const e = expectScore(d);
    const diff = m.score.home - m.score.away;
    const s = diff > 0 ? 1 : diff < 0 ? 0 : 0.5;
    let mult;
    if (sport === "soccer") mult = Math.log(Math.abs(diff) + 1) + (diff === 0 ? 1 : 0);
    else { const wd = diff > 0 ? d : -d; mult = Math.pow(Math.abs(diff) + 3, 0.8) / (7.5 + 0.006 * wd); }
    const delta = P.k * mult * (s - e);
    elo.set(m.home, rh + delta); elo.set(m.away, ra - delta);
    played.set(m.home, (played.get(m.home) || 0) + 1); played.set(m.away, (played.get(m.away) || 0) + 1);
  }
  return { elo, get, played };
}

// Minutes-weighted mean overall of a list of { player, minutes } against a ratings index.
function lineupStrength(lineup, index) {
  let w = 0, s = 0; const missing = [];
  for (const p of lineup) {
    const r = index.get(p.player);
    if (!r) { missing.push(p.player); continue; }
    const mins = p.minutes || 1;
    s += r.overall * mins; w += mins;
  }
  return { mean: w ? s / w : null, missing };
}

// The team's "usual" roster: everyone who played for it, weighted by minutes.
function usualStrength(team, ratings) {
  const rows = ratings.filter((r) => r.team === team);
  return lineupStrength(rows.map((r) => ({ player: r.player, minutes: r.minutes })), new Map(rows.map((r) => [r.player, r])));
}

function attributeEdges(homeLineup, awayLineup, index) {
  const avg = (lineup) => {
    const acc = {}; const w = {};
    for (const p of lineup) {
      const r = index.get(p.player); if (!r) continue;
      for (const [k, v] of Object.entries(r.attributes)) {
        if (v == null) continue;
        acc[k] = (acc[k] || 0) + v * (p.minutes || 1); w[k] = (w[k] || 0) + (p.minutes || 1);
      }
    }
    const out = {}; for (const k of Object.keys(acc)) out[k] = Math.round(acc[k] / w[k]); return out;
  };
  const h = avg(homeLineup), a = avg(awayLineup);
  return Object.keys(h).filter((k) => k in a).map((k) => ({ attribute: k, home: h[k], away: a[k], edge: h[k] - a[k] }))
    .sort((x, y) => Math.abs(y.edge) - Math.abs(x.edge));
}

function poisson(k, l) { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; }

function avgGoals(matches, sport) {
  const ms = matches.filter((m) => m.sport === sport && m.score);
  if (!ms.length) return null;
  return ms.reduce((a, m) => a + m.score.home + m.score.away, 0) / ms.length / 2;
}

// Predict one fixture from history. fixture = { sport, home, away, lineups?: { home:[...], away:[...] }, neutral? }
function predictMatch(history, fixture, opts = {}) {
  const sport = fixture.sport;
  const P = PARAMS[sport];
  if (!P) throw new Error("unsupported sport: " + sport);
  if (!fixture.home || !fixture.away || fixture.home === fixture.away) throw new Error("home and away must be two different teams");
  const ms = history.filter((m) => m.sport === sport);
  const { get, played } = buildElo(ms, sport);
  const ratings = opts.ratings || computeRatings(ms, { sport, halfLifeDays: opts.halfLifeDays });
  const index = new Map(ratings.map((r) => [r.player, r]));

  const side = (s) => {
    const team = fixture[s];
    const lineup = fixture.lineups && Array.isArray(fixture.lineups[s]) && fixture.lineups[s].length
      ? fixture.lineups[s].map((p) => (typeof p === "string" ? { player: p, minutes: sport === "soccer" ? 90 : 34 } : p)) : null;
    const usual = usualStrength(team, ratings);
    let adj = 0, lineupMean = null, missing = [];
    if (sport !== "soccer" && lineup && usual.mean != null) {
      const ls = lineupStrength(lineup, index);
      lineupMean = ls.mean; missing = ls.missing;
      if (ls.mean != null) adj = (ls.mean - usual.mean) * P.lineupEloPerPoint;
    }
    const roster = lineup || ratings.filter((r) => r.team === team).map((r) => ({ player: r.player, minutes: r.minutes }));
    const keyPlayers = roster.map((p) => index.get(p.player)).filter(Boolean).sort((a, b) => b.overall - a.overall).slice(0, 3)
      .map((r) => ({ player: r.player, overall: r.overall, attributes: r.attributes }));
    return { team, elo: Math.round(get(team)), matchesPlayed: played.get(team) || 0, lineupAdj: Math.round(adj),
      usualStrength: usual.mean != null ? Math.round(usual.mean) : null, lineupStrength: lineupMean != null ? Math.round(lineupMean) : null,
      unratedPlayers: missing, keyPlayers, roster };
  };
  const h = side("home"), a = side("away");
  const hfa = fixture.neutral ? 0 : P.hfa;
  const d = h.elo + h.lineupAdj + hfa - (a.elo + a.lineupAdj);

  const out = { sport, home: h.team, away: a.team, eloDiff: Math.round(d), teams: { home: strip(h), away: strip(a) },
    matchups: attributeEdges(h.roster, a.roster, index).slice(0, 6), notes: [] };

  if (sport === "soccer") {
    const { lh, la, lineup } = soccerLambdas(ms, fixture, h, a, hfa, opts);
    const st = matchState(lh, la, { home: 0, away: 0 }, 1);
    out.probabilities = st.probabilities;
    out.expectedGoals = { home: r2(lh), away: r2(la) };
    out.likelyScores = st.likelyScores;
    if (lineup) out.lineupEffect = lineup;
  } else {
    const pH = expectScore(d);
    const spread = d / P.spreadDiv;
    const avgPts = avgGoals(ms, sport) || P.basePts;
    out.probabilities = { home: r3(pH), away: r3(1 - pH) };
    out.spread = r2(spread);
    out.expectedPoints = { home: Math.round(avgPts + spread / 2), away: Math.round(avgPts - spread / 2) };
  }
  const pick = Object.entries(out.probabilities).sort((x, y) => y[1] - x[1])[0];
  out.pick = { outcome: pick[0], team: pick[0] === "home" ? h.team : pick[0] === "away" ? a.team : null, p: pick[1] };
  if (h.matchesPlayed < 3 || a.matchesPlayed < 3) out.notes.push("fewer than 3 results for a team — Elo is close to its prior; low confidence");
  if (h.unratedPlayers.length || a.unratedPlayers.length) out.notes.push("some lineup players have no event data and were ignored in the lineup adjustment");
  return out;
}

// Expected goals for a soccer fixture: Elo sets the baseline; the lineup model
// (who actually plays, and against which flank) scales it.
function soccerLambdas(ms, fixture, h, a, hfa, opts = {}) {
  const P = PARAMS.soccer;
  const eloD = h.elo + hfa - a.elo;
  const base = avgGoals(ms, "soccer") || P.baseGoals;
  let lh = base * Math.exp(P.goalK * eloD), la = base * Math.exp(-P.goalK * eloD);
  if (opts.lineupAware === false) return { lh, la };
  const model = opts.model || LM.buildPlayerModel(ms, { zones: false });
  const L = fixture.lineups || {};
  const norm = (x) => (Array.isArray(x) && x.length ? x.map((p) => (typeof p === "string" ? { player: p, minutes: 90 } : p)) : null);
  const hl = norm(L.home), al = norm(L.away);
  if (!hl && !al) return { lh, la };
  const mu = LM.lineupMultipliers(h.team, hl, a.team, al, model);
  lh *= mu.forMult; la *= mu.againstMult;
  return { lh, la, lineup: { homeGoalsMult: r3(mu.forMult), awayGoalsMult: r3(mu.againstMult), unmodelled: mu.missing } };
}

// Outcome distribution from a live state: current score + expected goals for the
// remaining fraction of the match (1 = full match). Independent Poisson.
function matchState(lh, la, score, remaining) {
  const P = PARAMS.soccer;
  const rh = lh * remaining, ra = la * remaining;
  let pH = 0, pD = 0, pA = 0; const grid = [];
  for (let i = 0; i <= P.maxGoals; i++) for (let j = 0; j <= P.maxGoals; j++) {
    const p = poisson(i, rh) * poisson(j, ra);
    const fh = score.home + i, fa = score.away + j;
    if (fh > fa) pH += p; else if (fh === fa) pD += p; else pA += p;
    grid.push({ score: `${fh}-${fa}`, p });
  }
  const tot = pH + pD + pA;
  return { probabilities: { home: r3(pH / tot), draw: r3(pD / tot), away: r3(pA / tot) },
    likelyScores: grid.sort((x, y) => y.p - x.p).slice(0, 5).map((g) => ({ score: g.score, p: r3(g.p / tot) })), raw: { pH: pH / tot, pD: pD / tot, pA: pA / tot } };
}

function strip(s) { const { roster, ...rest } = s; return rest; }
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;

// Walk-forward backtest: for each completed match (after `warmup`), predict it
// using only earlier matches, then score the prediction against what happened.
function backtest(matches, sport, opts = {}) {
  const ms = matches.filter((m) => m.sport === sport && m.score && m.date).sort(byDate);
  const warmup = opts.warmup != null ? opts.warmup : Math.min(10, Math.floor(ms.length / 3));
  const rows = [];
  for (let i = warmup; i < ms.length; i++) {
    const m = ms[i];
    const hist = ms.filter((x) => x.date < m.date);
    if (!hist.length) continue;
    // Only the starting XI is known before kickoff — never leak the subs.
    const starters = {};
    for (const side of ["home", "away"]) starters[side] = m.lineups[side].filter((p) => p.starter !== false).map((p) => ({ player: p.player, minutes: sport === "soccer" ? 90 : p.minutes }));
    const pred = predictMatch(hist, { sport, home: m.home, away: m.away, lineups: starters }, opts);
    const diff = m.score.home - m.score.away;
    const actual = diff > 0 ? "home" : diff < 0 ? "away" : sport === "soccer" ? "draw" : "home";
    rows.push({ id: m.id, date: m.date, home: m.home, away: m.away, score: `${m.score.home}-${m.score.away}`, actual, pick: pred.pick.outcome, probabilities: pred.probabilities });
  }
  if (!rows.length) return { sport, n: 0, note: "not enough completed, dated matches to backtest" };

  const classes = sport === "soccer" ? ["home", "draw", "away"] : ["home", "away"];
  // Baseline: base rates of each outcome among the warmup matches (what a "no-skill" forecaster knows).
  const base = {}; const warm = ms.slice(0, Math.max(1, warmup));
  for (const c of classes) base[c] = 0;
  for (const m of warm) { const d = m.score.home - m.score.away; base[d > 0 ? "home" : d < 0 ? "away" : sport === "soccer" ? "draw" : "home"]++; }
  for (const c of classes) base[c] = (base[c] + 1) / (warm.length + classes.length);

  const score = (probOf) => {
    let brier = 0, ll = 0, hit = 0;
    for (const r of rows) {
      const p = probOf(r);
      for (const c of classes) brier += ((p[c] || 0) - (r.actual === c ? 1 : 0)) ** 2;
      ll += -Math.log(Math.max(1e-6, p[r.actual] || 0));
      const top = classes.reduce((a, c) => ((p[c] || 0) > (p[a] || 0) ? c : a), classes[0]);
      if (top === r.actual) hit++;
    }
    return { brier: r3(brier / rows.length), logLoss: r3(ll / rows.length), accuracy: r3(hit / rows.length) };
  };
  const model = score((r) => r.probabilities);
  const baseline = score(() => base);
  // Soccer: also score the same walk-forward with lineups ignored, so the value
  // of lineup-awareness is measured rather than assumed.
  let lineupBlind;
  if (sport === "soccer" && opts.compareLineups !== false && opts.lineupAware !== false) {
    const blind = backtest(matches, sport, { ...opts, lineupAware: false, compareLineups: false, includeRows: true });
    const byId = new Map(blind.rows.map((r) => [r.id, r.probabilities]));
    lineupBlind = score((r) => byId.get(r.id) || r.probabilities);
  }
  return { sport, n: rows.length, warmup, model, baseline, lineupBlind,
    skill: { brierImprovement: r3(baseline.brier - model.brier), accuracyLift: r3(model.accuracy - baseline.accuracy) },
    rows: opts.includeRows ? rows : undefined };
}

module.exports = { predictMatch, backtest, buildElo, matchState, soccerLambdas, PARAMS, expectScore };
