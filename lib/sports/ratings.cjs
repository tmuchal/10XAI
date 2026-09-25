// 10XAI Sports — per-player skill ratings from match events.
//
// Scale: 1–99, where 50 = the average player *in the same position line* in the
// loaded data and each 15 points = one standard deviation. "78 dribbling" on a
// full-back means ~1.9 SD above the other defenders here — not a vibe.
// Small samples are shrunk toward the population (empirical Bayes), so a
// 20-minute cameo can't top the chart.
//
//   soccer attributes: passing · progression · shooting · creativity · dribbling · defending ·
//                      duels (1v1) · aerial · pressing · goalkeeping · discipline
//   soccer overall:    z-score of event-value impact per 90 within the position line
//   basketball:        scoring · efficiency (TS%) · playmaking · rebounding · defense · ball_security
//                      overall = z-score of Hollinger Game Score per 36

// Event values for soccer impact — a transparent stand-in for xT/VAEP. Every
// number in the output traces back to this table (tune it here).
const SOCCER_VALUE = {
  xg: 0.7, goal: 0.3,                       // shots: 70% chance quality, 30% finishing
  assist: 0.2, key_pass: 0.1,
  pass_ok: 0.005, pass_fail: -0.02, prog_pass: 0.03, carry: 0.02,
  dribble_ok: 0.04, dribble_fail: -0.02,
  tackle_ok: 0.05, tackle_fail: -0.02, interception: 0.05, clearance: 0.02, block: 0.03, recovery: 0.02,
  pressure: 0.004, aerial_ok: 0.015, aerial_fail: -0.015, dribbled_past: -0.04,
  gk_goal_prevented: 0.8,                   // per unit of (xG faced on target − goals conceded)
  foul: -0.02, turnover: -0.04, yellow: -0.05, red: -0.5,
};
// xG estimate when the source has none (manual tagging / commentary).
const EST_XG = { goal: 0.3, on_target: 0.15, off_target: 0.05, blocked: 0.04 };
const PROGRESSIVE = 25;           // pass/carry gaining ≥ 25% of pitch length
const LATE_MINUTE = 60;
const SUCCESS_TYPES = new Set(["pass", "dribble", "tackle", "aerial"]);

const PRIOR_MINUTES = { soccer: 270, basketball: 108 };
const PER = { soccer: 90, basketball: 36 };
const DAY_MS = 86400000;
const POS_MIN_GROUP = 6;
const MIN_AERIALS = 8;            // fewer aerial duels than this → no aerial rating          // below this many players, a position line falls back to "all"

const xgOf = (e) => (typeof e.xg === "number" ? e.xg : EST_XG[e.outcome] || 0.05);
const isProgressive = (e) => typeof e.endX === "number" && typeof e.x === "number" && e.endX - e.x >= PROGRESSIVE;

function emptyCounts(sport) {
  return sport === "soccer"
    ? { minutes: 0, pass_att: 0, pass_ok: 0, prog_pass: 0, carry: 0, key_pass: 0, assist: 0, shots: 0, shot_on: 0, shot_off: 0, shot_blocked: 0, goal: 0, xg: 0,
        dribble_att: 0, dribble_ok: 0, tackle_att: 0, tackle_ok: 0, interception: 0, clearance: 0, block: 0, recovery: 0, pressure: 0,
        aerial_att: 0, aerial_ok: 0, dribbled_past: 0, save: 0, sot_faced: 0, xg_faced: 0, ga: 0, def_padj: 0, pressure_padj: 0,
        foul: 0, turnover: 0, yellow: 0, red: 0, impact: 0 }
    : { minutes: 0, fg2a: 0, fg2m: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 };
}

// Soccer: value of one event for its actor (the impact contribution).
function soccerEventValue(e) {
  const V = SOCCER_VALUE;
  switch (e.type) {
    case "shot": return V.xg * xgOf(e) + (e.outcome === "goal" ? V.goal : 0);
    case "assist": return V.assist;
    case "key_pass": return V.key_pass;
    case "pass": return (e.outcome === "success" ? V.pass_ok + (isProgressive(e) ? V.prog_pass : 0) : V.pass_fail);
    case "carry": return isProgressive(e) || e.endX == null ? V.carry : 0;
    case "dribble": return e.outcome === "success" ? V.dribble_ok : V.dribble_fail;
    case "tackle": return e.outcome === "success" ? V.tackle_ok : V.tackle_fail;
    case "interception": return V.interception;
    case "clearance": return V.clearance;
    case "block": return V.block;
    case "recovery": return V.recovery;
    case "pressure": return V.pressure;
    case "aerial": return e.outcome === "success" ? V.aerial_ok : V.aerial_fail;
    case "dribbled_past": return V.dribbled_past;
    case "foul": return V.foul;
    case "turnover": return V.turnover;
    case "card": return e.outcome === "red" ? V.red : V.yellow;
    default: return 0;
  }
}

function countEvent(c, e) {
  switch (e.type) {
    case "pass": c.pass_att++; if (e.outcome === "success") { c.pass_ok++; if (isProgressive(e)) c.prog_pass++; } break;
    case "carry": c.carry++; break;
    case "key_pass": c.key_pass++; break;
    case "assist": if ("ast" in c) c.ast++; else c.assist++; break;
    case "shot":
      c.shots++; c.xg += xgOf(e);
      if (e.outcome === "goal") { c.goal++; c.shot_on++; }
      else if (e.outcome === "on_target") c.shot_on++;
      else if (e.outcome === "blocked") c.shot_blocked++;
      else c.shot_off++;
      break;
    case "dribble": c.dribble_att++; if (e.outcome === "success") c.dribble_ok++; break;
    case "tackle": c.tackle_att++; if (e.outcome === "success") c.tackle_ok++; break;
    case "interception": c.interception++; break;
    case "clearance": c.clearance++; break;
    case "block": if ("blk" in c) c.blk++; else c.block++; break;
    case "recovery": c.recovery++; break;
    case "pressure": c.pressure++; break;
    case "aerial": c.aerial_att++; if (e.outcome === "success") c.aerial_ok++; break;
    case "dribbled_past": c.dribbled_past++; break;
    case "save": c.save++; break;
    case "foul": if ("pf" in c) c.pf++; else c.foul++; break;
    case "turnover": if ("tov" in c) c.tov++; else c.turnover++; break;
    case "card": if (e.outcome === "red") c.red++; else c.yellow++; break;
    case "fg2": c.fg2a++; if (e.outcome === "made") c.fg2m++; break;
    case "fg3": c.fg3a++; if (e.outcome === "made") c.fg3m++; break;
    case "ft": c.fta++; if (e.outcome === "made") c.ftm++; break;
    case "rebound": if (e.outcome === "offensive") c.orb++; else c.drb++; break;
    case "steal": c.stl++; break;
  }
}

function recencyWeight(date, asOf, halfLifeDays) {
  if (!halfLifeDays || !date || !asOf) return 1;
  const age = (Date.parse(asOf) - Date.parse(date)) / DAY_MS;
  return age <= 0 ? 1 : Math.pow(0.5, age / halfLifeDays);
}

// Possession adjustment (PAdj). A defender on a team that has the ball 70% of the
// time gets few chances to tackle, so raw counts undersell them. Defensive actions
// are scaled by 0.5 / (opponent's share of passes), clamped to [0.6, 1.8].
const PADJ_TYPES = new Set(["tackle", "interception", "clearance", "block", "recovery", "pressure", "aerial", "dribbled_past"]);
function padjWeights(m) {
  if (m.sport !== "soccer") return { home: 1, away: 1 };
  const passes = { home: 0, away: 0 };
  for (const e of m.events) if (e.type === "pass") passes[e.team]++;
  const tot = passes.home + passes.away;
  if (tot < 100) return { home: 1, away: 1 };
  const w = (side) => Math.max(0.6, Math.min(1.8, 0.5 / (passes[side === "home" ? "away" : "home"] / tot)));
  return { home: w("home"), away: w("away") };
}
const padjOf = (e, w) => (PADJ_TYPES.has(e.type) ? w[e.team] : 1);

// Minutes a lineup entry spent before / after LATE_MINUTE.
function windowMinutes(p) {
  const on = p.on != null ? p.on : 0;
  const off = p.off != null ? p.off : on + p.minutes;
  return { on, off, early: Math.max(0, Math.min(off, LATE_MINUTE) - on), late: Math.max(0, off - Math.max(on, LATE_MINUTE)) };
}

// Per-match, per-player records: counts + impact (split early/late for soccer).
function matchRecords(m) {
  const per = new Map();
  for (const side of ["home", "away"]) for (const p of m.lineups[side]) {
    const c = emptyCounts(m.sport); c.minutes = p.minutes;
    per.set(p.player, { player: p.player, side, team: m[side], opponent: m[side === "home" ? "away" : "home"], position: p.position || null,
      starter: p.starter, win: windowMinutes(p), c, impactEarly: 0, impactLate: 0, succ: { eo: 0, en: 0, lo: 0, ln: 0 } });
  }
  const pw = padjWeights(m);
  for (const e of m.events) {
    const rec = per.get(e.player);
    if (!rec) continue;
    countEvent(rec.c, e);
    if (m.sport === "soccer" && PADJ_TYPES.has(e.type)) {
      const w = pw[e.team];
      if (e.type === "pressure") rec.c.pressure_padj += w;
      else if (e.type === "tackle" ? e.outcome === "success" : ["interception", "block"].includes(e.type)) rec.c.def_padj += w;
      else if (e.type === "clearance" || e.type === "recovery") rec.c.def_padj += 0.5 * w;
    }
    if (m.sport === "soccer") {
      // fatigue signal: success rate of contested actions before / after 60' *on the pitch*
      if (SUCCESS_TYPES.has(e.type) && e.t != null) {
        const late = e.t / 60 - rec.win.on > LATE_MINUTE, ok = e.outcome === "success" ? 1 : 0;
        if (late) { rec.succ.lo += ok; rec.succ.ln++; } else { rec.succ.eo += ok; rec.succ.en++; }
      }
      const v = soccerEventValue(e) * padjOf(e, pw);
      rec.c.impact += v;
      if (e.t != null && e.t >= LATE_MINUTE * 60) rec.impactLate += v; else rec.impactEarly += v;
    }
  }
  if (m.sport === "soccer") {
    // goalkeepers: credit/debit every on-target shot they faced while on the pitch
    const gks = [...per.values()].filter((r) => r.position === "GK");
    for (const e of m.events) {
      if (e.type !== "shot" || (e.outcome !== "on_target" && e.outcome !== "goal")) continue;
      const tMin = e.t != null ? e.t / 60 : null;
      const gk = gks.find((g) => g.side !== e.team && (tMin == null || (tMin >= g.win.on && tMin <= g.win.off)));
      if (!gk) continue;
      const xg = xgOf(e);
      gk.c.sot_faced++; gk.c.xg_faced += xg;
      const v = SOCCER_VALUE.gk_goal_prevented * ((e.outcome === "goal" ? 0 : 1) * xg - (e.outcome === "goal" ? 1 - xg : 0));
      if (e.outcome === "goal") gk.c.ga++;
      gk.c.impact += v;
      if (e.t != null && e.t >= LATE_MINUTE * 60) gk.impactLate += v; else gk.impactEarly += v;
    }
  }
  return per;
}

function latestDate(matches) { let d = null; for (const m of matches) if (m.date && (!d || m.date > d)) d = m.date; return d; }

// Aggregate weighted stats per player across matches, keeping the per-match log.
function aggregate(matches, opts = {}) {
  const players = new Map();
  const asOf = opts.asOf || latestDate(matches);
  for (const m of [...matches].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))) {
    const w = recencyWeight(m.date, asOf, opts.halfLifeDays);
    for (const rec of matchRecords(m).values()) {
      const key = `${m.sport}:${rec.player}`;
      let agg = players.get(key);
      if (!agg) {
        agg = { player: rec.player, sport: m.sport, team: rec.team, lastDate: null, matches: 0, starts: 0, counts: emptyCounts(m.sport),
          early: { minutes: 0, impact: 0 }, late: { minutes: 0, impact: 0 }, succ: { eo: 0, en: 0, lo: 0, ln: 0 }, posMinutes: {}, log: [] };
        players.set(key, agg);
      }
      for (const k of Object.keys(rec.c)) agg.counts[k] += rec.c[k] * w;
      agg.early.minutes += rec.win.early * w; agg.early.impact += rec.impactEarly * w;
      agg.late.minutes += rec.win.late * w; agg.late.impact += rec.impactLate * w;
      for (const k of ["eo", "en", "lo", "ln"]) agg.succ[k] += rec.succ[k] * w;
      if (rec.position) agg.posMinutes[rec.position] = (agg.posMinutes[rec.position] || 0) + rec.c.minutes;
      agg.matches++; if (rec.starter !== false) agg.starts++;
      if (!agg.lastDate || (m.date && m.date >= agg.lastDate)) { agg.lastDate = m.date; agg.team = rec.team; }
      agg.log.push({ matchId: m.id, date: m.date, opponent: rec.opponent, side: rec.side, minutes: rec.c.minutes, starter: rec.starter,
        impact: m.sport === "soccer" ? rec.c.impact : bballRaw(rec.c).gmsc, counts: rec.c,
        result: m.score ? resultFor(m, rec.side) : null });
    }
  }
  for (const p of players.values()) {
    const pm = Object.entries(p.posMinutes).sort((a, b) => b[1] - a[1]);
    p.position = pm.length ? pm[0][0] : null;
  }
  return players;
}

function resultFor(m, side) {
  const us = m.score[side], them = m.score[side === "home" ? "away" : "home"];
  return { us, them, outcome: us > them ? "W" : us < them ? "L" : "D" };
}

function perMin(sum, minutes, prior, priorMin, per) { return ((sum + (prior * priorMin) / per) / (minutes + priorMin)) * per; }
function pct(ok, att, prior, k) { return (ok + prior * k) / (att + k); }

function soccerRaw(c) {
  return {
    impact: c.impact,
    progression: c.prog_pass + c.carry,
    threat: SOCCER_VALUE.xg * c.xg + SOCCER_VALUE.goal * c.goal,
    creation: c.key_pass + 2 * c.assist,
    dribbles: c.dribble_ok,
    defensive: c.def_padj,          // possession-adjusted tackles won + interceptions + blocks + ½(clearances + recoveries)
    beaten: c.dribbled_past,
    pressing: c.pressure_padj,
    saves: c.save,
    gk_prevented: c.xg_faced - c.ga,
    mistakes: c.foul + c.turnover + 2 * c.yellow + 8 * c.red,
  };
}

function bballRaw(c) {
  const pts = 2 * c.fg2m + 3 * c.fg3m + c.ftm;
  const fga = c.fg2a + c.fg3a, fgm = c.fg2m + c.fg3m;
  const gmsc = pts + 0.4 * fgm - 0.7 * fga - 0.4 * (c.fta - c.ftm) + 0.7 * c.orb + 0.3 * c.drb + c.stl + 0.7 * c.ast + 0.7 * c.blk - 0.4 * c.pf - c.tov;
  return { gmsc, pts, reb: c.orb + c.drb, ast: c.ast, stocks: c.stl + c.blk, tov: c.tov, tsDen: 2 * (fga + 0.44 * c.fta) };
}

function meanSd(xs) {
  if (!xs.length) return { mean: 0, sd: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return { mean, sd: Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length) };
}
// null when the metric has no spread in this dataset (e.g. no fouls logged at all) —
// a flat "50" for everyone would look like a measurement when it isn't one.
const toScale = (x, d, invert) => (!d || d.sd < 1e-9 ? null : Math.max(1, Math.min(99, Math.round(50 + 15 * ((invert ? d.mean - x : x - d.mean) / d.sd)))));
const avgScale = (...xs) => { const v = xs.filter((x) => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
const r2 = (x) => Math.round(x * 100) / 100;

const SOCCER_ATTRS_BY_POS = {
  GK: ["goalkeeping", "passing", "progression"],
  default: ["passing", "progression", "shooting", "creativity", "dribbling", "defending", "duels", "aerial", "pressing", "discipline"],
};

// Compute ratings for every player in `matches` (one sport at a time).
function computeRatings(matches, opts = {}) {
  const sport = opts.sport || (matches[0] && matches[0].sport);
  const ms = matches.filter((m) => m.sport === sport);
  const agg = [...aggregate(ms, opts).values()].filter((p) => p.counts.minutes > 0);
  if (!agg.length) return [];
  const per = PER[sport], priorMin = PRIOR_MINUTES[sport];
  const raws = agg.map((p) => (sport === "soccer" ? soccerRaw(p.counts) : bballRaw(p.counts)));
  const keys = Object.keys(raws[0]).filter((k) => k !== "tsDen");

  // shrinkage targets and z-score distributions are per position line (soccer)
  const groupOf = (p) => (sport === "soccer" && p.position ? p.position : "all");
  const groups = {};
  agg.forEach((p, i) => { (groups[groupOf(p)] = groups[groupOf(p)] || []).push(i); });
  for (const g of Object.keys(groups)) if (g !== "all" && groups[g].length < POS_MIN_GROUP) { (groups.all = groups.all || []).push(...groups[g]); delete groups[g]; }
  const groupIdx = new Array(agg.length);
  for (const [g, idx] of Object.entries(groups)) for (const i of idx) groupIdx[i] = g;

  const sumOver = (idx, f) => idx.reduce((a, i) => a + f(i), 0);
  const priors = {};
  for (const [g, idx] of Object.entries(groups)) {
    const mins = sumOver(idx, (i) => agg[i].counts.minutes) || 1;
    const pr = {};
    for (const k of keys) pr[k] = (sumOver(idx, (i) => raws[i][k]) / mins) * per;
    if (sport === "soccer") {
      const c = (k) => sumOver(idx, (i) => agg[i].counts[k]);
      pr.pass_pct = c("pass_att") ? c("pass_ok") / c("pass_att") : 0.78;
      pr.dribble_pct = c("dribble_att") ? c("dribble_ok") / c("dribble_att") : 0.5;
      pr.tackle_pct = c("tackle_att") ? c("tackle_ok") / c("tackle_att") : 0.6;
      pr.aerial_pct = c("aerial_att") ? c("aerial_ok") / c("aerial_att") : 0.5;
      pr.save_pct = c("sot_faced") ? 1 - c("ga") / c("sot_faced") : 0.7;
    } else {
      const den = sumOver(idx, (i) => raws[i].tsDen);
      pr.ts = den ? sumOver(idx, (i) => raws[i].pts) / den : 0.55;
    }
    priors[g] = pr;
  }

  const shrunk = agg.map((p, i) => {
    const r = raws[i], c = p.counts, m = c.minutes, pr = priors[groupIdx[i]];
    const rates = {};
    for (const k of keys) rates[k] = perMin(r[k], m, pr[k], priorMin, per);
    if (sport === "soccer") {
      rates.pass_pct = pct(c.pass_ok, c.pass_att, pr.pass_pct, 30);
      rates.dribble_pct = pct(c.dribble_ok, c.dribble_att, pr.dribble_pct, 8);
      rates.tackle_pct = pct(c.tackle_ok, c.tackle_att, pr.tackle_pct, 8);
      rates.aerial_pct = pct(c.aerial_ok, c.aerial_att, pr.aerial_pct, 8);
      rates.save_pct = pct(c.sot_faced - c.ga, c.sot_faced, pr.save_pct, 10);
    } else {
      rates.ts = (r.pts + pr.ts * 20) / (r.tsDen + 20);
    }
    return rates;
  });

  const dist = {};
  for (const [g, idx] of Object.entries(groups)) {
    dist[g] = {};
    for (const k of Object.keys(shrunk[0])) dist[g][k] = meanSd(idx.map((i) => shrunk[i][k]));
  }
  const allIdx = agg.map((_, i) => i);
  const distAll = {}; for (const k of Object.keys(shrunk[0])) distAll[k] = meanSd(allIdx.map((i) => shrunk[i][k]));

  return agg.map((p, i) => {
    const s = shrunk[i], c = p.counts, d = dist[groupIdx[i]];
    let attributes, overall, impact;
    if (sport === "soccer") {
      const all = {
        passing: toScale(s.pass_pct, d.pass_pct),
        progression: toScale(s.progression, d.progression),
        shooting: toScale(s.threat, d.threat),
        creativity: toScale(s.creation, d.creation),
        dribbling: avgScale(toScale(s.dribbles, d.dribbles), toScale(s.dribble_pct, d.dribble_pct)),
        defending: toScale(s.defensive, d.defensive),
        duels: avgScale(toScale(s.tackle_pct, d.tackle_pct), toScale(s.beaten, d.beaten, true)),
        aerial: c.aerial_att >= MIN_AERIALS ? toScale(s.aerial_pct, d.aerial_pct) : null,
        pressing: toScale(s.pressing, d.pressing),
        goalkeeping: p.position === "GK" ? avgScale(toScale(s.save_pct, d.save_pct), toScale(s.gk_prevented, d.gk_prevented)) : null,
        discipline: toScale(s.mistakes, d.mistakes, true),
      };
      attributes = {};
      for (const k of SOCCER_ATTRS_BY_POS[p.position === "GK" ? "GK" : "default"]) attributes[k] = all[k];
      overall = toScale(s.impact, d.impact) ?? 50;
      impact = { per90: r2(s.impact), label: "event-value impact per 90" };
    } else {
      attributes = {
        scoring: toScale(s.pts, d.pts), efficiency: toScale(s.ts, d.ts), playmaking: toScale(s.ast, d.ast),
        rebounding: toScale(s.reb, d.reb), defense: toScale(s.stocks, d.stocks), ball_security: toScale(s.tov, d.tov, true),
      };
      overall = toScale(s.gmsc, d.gmsc) ?? 50;
      impact = { per36: r2(s.gmsc), label: "Game Score per 36" };
    }
    const stats = {};
    for (const [k, v] of Object.entries(c)) stats[k] = r2(v);
    return { player: p.player, team: p.team, sport, position: p.position, matches: p.matches, starts: p.starts, minutes: Math.round(c.minutes),
      overall, overallAll: sport === "soccer" ? toScale(s.impact, distAll.impact) ?? 50 : overall, impact, attributes, stats,
      sample: c.minutes < priorMin ? "small" : "ok", _agg: p };
  }).sort((a, b) => b.overall - a.overall);
}

// Strip internal fields for API output.
function publicRating(r) { const { _agg, ...rest } = r; return rest; }

module.exports = { padjWeights, padjOf, computeRatings, publicRating, aggregate, matchRecords, soccerEventValue, xgOf, isProgressive, SOCCER_VALUE, LATE_MINUTE, recencyWeight, bballRaw };
