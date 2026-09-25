// 10XAI Sports — per-player skill ratings from match events.
//
// Every attribute is reported on a 1–99 scale where 50 = the average player in
// the loaded data and each 15 points = one standard deviation (z-score), so a
// "78 dribbling" means ~1.9 SD above this dataset's mean — not a vibe.
//
// Small samples are shrunk toward the population mean (empirical Bayes), so a
// player with one lucky 20-minute cameo does not top the chart.
//
//   soccer:     passing · shooting · dribbling · creativity · defending · goalkeeping · discipline
//               overall = z-score of event-value impact per 90
//   basketball: scoring · efficiency (TS%) · playmaking · rebounding · defense · ball_security
//               overall = z-score of Hollinger Game Score per 36

// Event values for soccer impact (a lightweight, transparent stand-in for
// xT/VAEP — tune here, every number in the output traces back to this table).
const SOCCER_VALUE = {
  goal: 1.0, shot_on: 0.08, shot_off: 0.02, shot_blocked: 0.01,
  assist: 0.6, key_pass: 0.12, pass_ok: 0.005, pass_fail: -0.02,
  dribble_ok: 0.04, dribble_fail: -0.03, tackle_ok: 0.05, tackle_fail: -0.02,
  interception: 0.05, clearance: 0.02, save: 0.1, foul: -0.02, turnover: -0.04,
  yellow: -0.05, red: -0.5,
};

const PRIOR_MINUTES = { soccer: 270, basketball: 108 }; // ≈3 full games of shrinkage
const PER = { soccer: 90, basketball: 36 };
const DAY_MS = 86400000;

function emptyCounts(sport) {
  return sport === "soccer"
    ? { minutes: 0, pass_att: 0, pass_ok: 0, key_pass: 0, assist: 0, shots: 0, shot_on: 0, shot_off: 0, shot_blocked: 0, goal: 0,
        dribble_att: 0, dribble_ok: 0, tackle_att: 0, tackle_ok: 0, interception: 0, clearance: 0, save: 0, foul: 0, turnover: 0, yellow: 0, red: 0 }
    : { minutes: 0, fg2a: 0, fg2m: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 };
}

function countEvent(c, e) {
  switch (e.type) {
    case "pass": c.pass_att++; if (e.outcome === "success") c.pass_ok++; break;
    case "key_pass": c.key_pass++; break;
    case "assist": if ("ast" in c) c.ast++; else c.assist++; break;
    case "shot":
      c.shots++;
      if (e.outcome === "goal") { c.goal++; c.shot_on++; }
      else if (e.outcome === "on_target") c.shot_on++;
      else if (e.outcome === "blocked") c.shot_blocked++;
      else c.shot_off++;
      break;
    case "dribble": c.dribble_att++; if (e.outcome === "success") c.dribble_ok++; break;
    case "tackle": c.tackle_att++; if (e.outcome === "success") c.tackle_ok++; break;
    case "interception": c.interception++; break;
    case "clearance": c.clearance++; break;
    case "save": c.save++; break;
    case "foul": if ("pf" in c) c.pf++; else c.foul++; break;
    case "turnover": if ("tov" in c) c.tov++; else c.turnover++; break;
    case "card": if (e.outcome === "red") c.red++; else c.yellow++; break;
    case "fg2": c.fg2a++; if (e.outcome === "made") c.fg2m++; break;
    case "fg3": c.fg3a++; if (e.outcome === "made") c.fg3m++; break;
    case "ft": c.fta++; if (e.outcome === "made") c.ftm++; break;
    case "rebound": if (e.outcome === "offensive") c.orb++; else c.drb++; break;
    case "steal": c.stl++; break;
    case "block": c.blk++; break;
  }
}

// Weight for recency: exponential decay with the given half-life (days).
function recencyWeight(date, asOf, halfLifeDays) {
  if (!halfLifeDays || !date || !asOf) return 1;
  const age = (Date.parse(asOf) - Date.parse(date)) / DAY_MS;
  return age <= 0 ? 1 : Math.pow(0.5, age / halfLifeDays);
}

// Aggregate weighted counting stats per player across matches.
function aggregate(matches, opts = {}) {
  const players = new Map();
  const asOf = opts.asOf || latestDate(matches);
  for (const m of matches) {
    const w = recencyWeight(m.date, asOf, opts.halfLifeDays);
    const per = new Map();
    for (const side of ["home", "away"]) {
      for (const p of m.lineups[side]) {
        const c = emptyCounts(m.sport); c.minutes = p.minutes;
        per.set(p.player, { team: m[side], c });
      }
    }
    for (const e of m.events) {
      const rec = per.get(e.player);
      if (rec) countEvent(rec.c, e);
    }
    for (const [player, { team, c }] of per) {
      const key = `${m.sport}:${player}`;
      let agg = players.get(key);
      if (!agg) { agg = { player, sport: m.sport, team, lastDate: null, matches: 0, counts: emptyCounts(m.sport) }; players.set(key, agg); }
      for (const k of Object.keys(c)) agg.counts[k] += c[k] * w;
      agg.matches++;
      if (!agg.lastDate || (m.date && m.date >= agg.lastDate)) { agg.lastDate = m.date; agg.team = team; }
    }
  }
  return players;
}

function latestDate(matches) {
  let d = null;
  for (const m of matches) if (m.date && (!d || m.date > d)) d = m.date;
  return d;
}

// Rate shrinkage helpers ----------------------------------------------------
function perMin(sum, minutes, prior, priorMin, per) { return ((sum + (prior * priorMin) / per) / (minutes + priorMin)) * per; }
function pct(ok, att, prior, k) { return (ok + prior * k) / (att + k); }

function soccerRaw(c) {
  return {
    impact: c.goal * SOCCER_VALUE.goal + (c.shot_on - c.goal) * SOCCER_VALUE.shot_on + c.shot_off * SOCCER_VALUE.shot_off
      + c.shot_blocked * SOCCER_VALUE.shot_blocked + c.assist * SOCCER_VALUE.assist + c.key_pass * SOCCER_VALUE.key_pass
      + c.pass_ok * SOCCER_VALUE.pass_ok + (c.pass_att - c.pass_ok) * SOCCER_VALUE.pass_fail
      + c.dribble_ok * SOCCER_VALUE.dribble_ok + (c.dribble_att - c.dribble_ok) * SOCCER_VALUE.dribble_fail
      + c.tackle_ok * SOCCER_VALUE.tackle_ok + (c.tackle_att - c.tackle_ok) * SOCCER_VALUE.tackle_fail
      + c.interception * SOCCER_VALUE.interception + c.clearance * SOCCER_VALUE.clearance + c.save * SOCCER_VALUE.save
      + c.foul * SOCCER_VALUE.foul + c.turnover * SOCCER_VALUE.turnover + c.yellow * SOCCER_VALUE.yellow + c.red * SOCCER_VALUE.red,
    threat: c.goal + 0.3 * c.shot_on,
    creation: c.key_pass + 2 * c.assist,
    dribbles: c.dribble_ok,
    defensive: c.tackle_ok + c.interception + 0.5 * c.clearance,
    saves: c.save,
    mistakes: c.foul + c.turnover + 2 * c.yellow + 8 * c.red,
  };
}

function bballRaw(c) {
  const pts = 2 * c.fg2m + 3 * c.fg3m + c.ftm;
  const fga = c.fg2a + c.fg3a, fgm = c.fg2m + c.fg3m;
  // Hollinger Game Score
  const gmsc = pts + 0.4 * fgm - 0.7 * fga - 0.4 * (c.fta - c.ftm) + 0.7 * c.orb + 0.3 * c.drb + c.stl + 0.7 * c.ast + 0.7 * c.blk - 0.4 * c.pf - c.tov;
  return { gmsc, pts, reb: c.orb + c.drb, ast: c.ast, stocks: c.stl + c.blk, tov: c.tov, tsDen: 2 * (fga + 0.44 * c.fta) };
}

function meanSd(xs) {
  if (!xs.length) return { mean: 0, sd: 1 };
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
  return { mean, sd: Math.sqrt(v) };
}
// null when the metric has no spread in this dataset (e.g. no fouls logged at all) —
// a flat "50" for everyone would look like a measurement when it isn't one.
const toScale = (x, { mean, sd }, invert) => (sd < 1e-9 ? null : Math.max(1, Math.min(99, Math.round(50 + 15 * ((invert ? mean - x : x - mean) / sd)))));
const avgScale = (a, b) => (a == null ? b : b == null ? a : Math.round((a + b) / 2));
const r2 = (x) => Math.round(x * 100) / 100;

// Compute ratings for every player in `matches` (one sport at a time).
function computeRatings(matches, opts = {}) {
  const sport = opts.sport || (matches[0] && matches[0].sport);
  const ms = matches.filter((m) => m.sport === sport);
  const agg = [...aggregate(ms, opts).values()].filter((p) => p.counts.minutes > 0);
  if (!agg.length) return [];
  const per = PER[sport], priorMin = PRIOR_MINUTES[sport];
  const totalMin = agg.reduce((a, p) => a + p.counts.minutes, 0);

  const raws = agg.map((p) => (sport === "soccer" ? soccerRaw(p.counts) : bballRaw(p.counts)));
  const keys = Object.keys(raws[0]).filter((k) => k !== "tsDen");
  // population per-minute means (the shrinkage target)
  const popRate = {};
  for (const k of keys) popRate[k] = (raws.reduce((a, r) => a + r[k], 0) / totalMin) * per;

  const sum = (k) => agg.reduce((a, p) => a + p.counts[k], 0);
  const popPass = sport === "soccer" ? sum("pass_ok") / Math.max(1, sum("pass_att")) : 0;
  const popDrib = sport === "soccer" ? sum("dribble_ok") / Math.max(1, sum("dribble_att")) : 0;
  let popTs = 0;
  if (sport === "basketball") {
    const den = raws.reduce((a, r) => a + r.tsDen, 0);
    popTs = den ? raws.reduce((a, r) => a + r.pts, 0) / den : 0.55;
  }

  const shrunk = agg.map((p, i) => {
    const r = raws[i], c = p.counts, m = c.minutes;
    const rates = {};
    for (const k of keys) rates[k] = perMin(r[k], m, popRate[k], priorMin, per);
    if (sport === "soccer") {
      rates.pass_pct = pct(c.pass_ok, c.pass_att, popPass || 0.78, 30);
      rates.dribble_pct = pct(c.dribble_ok, c.dribble_att, popDrib || 0.5, 8);
    } else {
      rates.ts = r.tsDen || popTs ? (r.pts + popTs * 20) / (r.tsDen + 20) : popTs; // ~20 shot-equivalents of prior
    }
    return rates;
  });

  const dist = {};
  for (const k of Object.keys(shrunk[0])) dist[k] = meanSd(shrunk.map((s) => s[k]));

  return agg.map((p, i) => {
    const s = shrunk[i], c = p.counts;
    let attributes, overall, impact;
    if (sport === "soccer") {
      attributes = {
        passing: toScale(s.pass_pct, dist.pass_pct),
        shooting: toScale(s.threat, dist.threat),
        dribbling: avgScale(toScale(s.dribbles, dist.dribbles), toScale(s.dribble_pct, dist.dribble_pct)),
        creativity: toScale(s.creation, dist.creation),
        defending: toScale(s.defensive, dist.defensive),
        goalkeeping: c.save > 0 ? toScale(s.saves, dist.saves) : null,
        discipline: toScale(s.mistakes, dist.mistakes, true),
      };
      overall = toScale(s.impact, dist.impact) ?? 50;
      impact = { per90: r2(s.impact), label: "event-value impact per 90" };
    } else {
      attributes = {
        scoring: toScale(s.pts, dist.pts),
        efficiency: toScale(s.ts, dist.ts),
        playmaking: toScale(s.ast, dist.ast),
        rebounding: toScale(s.reb, dist.reb),
        defense: toScale(s.stocks, dist.stocks),
        ball_security: toScale(s.tov, dist.tov, true),
      };
      overall = toScale(s.gmsc, dist.gmsc) ?? 50;
      impact = { per36: r2(s.gmsc), label: "Game Score per 36" };
    }
    const stats = {};
    for (const [k, v] of Object.entries(c)) stats[k] = r2(v);
    return { player: p.player, team: p.team, sport, matches: p.matches, minutes: Math.round(c.minutes), overall, impact, attributes, stats,
      sample: c.minutes < priorMin ? "small" : "ok" };
  }).sort((a, b) => b.overall - a.overall);
}

module.exports = { computeRatings, aggregate, SOCCER_VALUE, recencyWeight };
