// 10XAI Sports — lineup model (soccer).
//
// Turns "who is on the pitch" into expected goals for and against.
//
//   off90 / def90 = the player's event-value impact per 90 (same valuation table as
//   the ratings), split into on-ball attacking actions (shots/xG, key passes,
//   passing, progression, dribbles, turnovers) and defensive actions (tackles,
//   interceptions, blocks, clearances, recoveries, pressures, aerials, being
//   dribbled past; keepers: goals prevented vs xG, shrunk hard — it's noisy).
//
// A lineup's attack/defense = Σ over players × minutes/90. The *difference* from
// the team's usual XI scales the Elo baseline, damped and capped, because a single
// rotation rarely moves true team strength by more than a few percent:
//   λ_for     ×= exp(K_ATT × (att_lineup − att_usual) + K_DEF × (def_them_usual − def_them))
//   λ_against ×= exp(K_ATT × (att_them − att_them_usual) + K_DEF × (def_usual − def_lineup))
// capped to [0.8, 1.25]. `backtest --lineup-blind` measures whether this helps.
//
// Fatigue: the drop in each player's success rate on contested actions (passes,
// dribbles, tackles, aerials) after 60' on the pitch, shrunk toward the position
// average. It is a better fatigue signal than impact volume, which barely moves
// when a player tires. It scales that player's contribution once past 60':
//   fade = clamp(1 + FADE_SLOPE × Δsuccess, 0.6, 1.1)
//
const { aggregate, LATE_MINUTE, soccerEventValue, SOCCER_VALUE, padjWeights, padjOf } = require("./ratings.cjs");
const { buildUpChannel, sortedEvents } = require("./channels.cjs");

const K_ATT = 0.12;         // goals per unit of lineup attacking impact (per match)
const K_DEF = 0.12;
const MULT_CAP = [0.8, 1.25];
const PRIOR_MIN = 270;
const GK_PRIOR_MIN = 900;
const FADE_PRIOR_ACTIONS = 60;
const FADE_SLOPE = 4;
const LATE_PRIOR_MIN = 120;
const FLANK_WEIGHT = 0.5;   // how strongly an opponent's weak flank boosts attackers on it

const r3 = (x) => Math.round(x * 1000) / 1000;

const DEF_TYPES = new Set(["tackle", "interception", "clearance", "block", "recovery", "pressure", "aerial", "dribbled_past", "save"]);

// Split each player's impact into attacking / defensive parts, over all matches.
function impactSplit(ms) {
  const out = new Map();
  const get = (p) => { let r = out.get(p); if (!r) { r = { off: 0, def: 0 }; out.set(p, r); } return r; };
  for (const m of ms) {
    const pw = padjWeights(m);
    for (const e of m.events) {
    const v = soccerEventValue(e) * padjOf(e, pw);
    if (!v) continue;
    if (DEF_TYPES.has(e.type)) get(e.player).def += v; else get(e.player).off += v;
    }
  }
  return out;
}

// Channel (L/C/R) and third per player from located events (≥ 15 of them), one pass.
function zonesFor(matches) {
  const acc = new Map();
  for (const m of matches) for (const e of m.events) {
    if (typeof e.x !== "number" || typeof e.y !== "number") continue;
    let a = acc.get(e.player); if (!a) { a = { n: 0, sx: 0, sy: 0, L: 0, C: 0, R: 0 }; acc.set(e.player, a); }
    a.n++; a.sx += e.x; a.sy += e.y; a[e.y < 33.3 ? "L" : e.y > 66.7 ? "R" : "C"]++;
  }
  const out = new Map();
  for (const [player, a] of acc) {
    if (a.n < 15) continue;
    const x = a.sx / a.n, y = a.sy / a.n;
    out.set(player, { x: Math.round(x), y: Math.round(y), channel: y < 38 ? "L" : y > 62 ? "R" : "C", third: x < 33.3 ? "defensive" : x > 55 ? "attacking" : "middle",
      channelShare: { L: r3(a.L / a.n), C: r3(a.C / a.n), R: r3(a.R / a.n) }, events: a.n });
  }
  return out;
}
function zoneOf(matches, player) { return zonesFor(matches).get(player) || null; }

// Per-player model inputs for every soccer player in `matches`.
function buildPlayerModel(matches, opts = {}) {
  const ms = matches.filter((m) => m.sport === "soccer");
  const agg = [...aggregate(ms, opts).values()].filter((p) => p.counts.minutes > 0);
  const split = impactSplit(ms);
  const offOf = (p) => (split.get(p.player) || { off: 0 }).off;
  // keepers' shot-stopping lives in counts (xG faced − goals conceded); weight it like the ratings do
  const defOf = (p) => (split.get(p.player) || { def: 0 }).def + (p.counts.sot_faced ? SOCCER_VALUE.gk_goal_prevented * (p.counts.xg_faced - p.counts.ga) : 0);
  const byPos = {};
  for (const p of agg) { const g = p.position || "all"; (byPos[g] = byPos[g] || []).push(p); }
  const prior = {};
  for (const [g, ps] of Object.entries(byPos)) {
    const mins = ps.reduce((a, p) => a + p.counts.minutes, 0) || 1;
    const early = ps.reduce((a, p) => a + p.early.impact, 0) / Math.max(1, ps.reduce((a, p) => a + p.early.minutes, 0)) * 90;
    const late = ps.reduce((a, p) => a + p.late.impact, 0) / Math.max(1, ps.reduce((a, p) => a + p.late.minutes, 0)) * 90;
    const sum = (k) => ps.reduce((a, p) => a + p.succ[k], 0);
    prior[g] = { off: ps.reduce((a, p) => a + offOf(p), 0) / mins * 90, def: ps.reduce((a, p) => a + defOf(p), 0) / mins * 90,
      early, lateDelta: ps.some((p) => p.late.minutes > 0) ? late - early : 0,
      succDelta: sum("ln") && sum("en") ? sum("lo") / sum("ln") - sum("eo") / sum("en") : 0 };
  }
  const zones = opts.zones === false ? new Map() : zonesFor(ms);
  const model = new Map();
  for (const p of agg) {
    const pr = prior[p.position || "all"], m = p.counts.minutes;
    const off90 = (offOf(p) + pr.off * PRIOR_MIN / 90) / (m + PRIOR_MIN) * 90;
    const dPrior = p.position === "GK" ? GK_PRIOR_MIN : PRIOR_MIN;
    const def90 = (defOf(p) + pr.def * dPrior / 90) / (m + dPrior) * 90;
    const earlyRate = (p.early.impact + pr.early * PRIOR_MIN / 90) / (p.early.minutes + PRIOR_MIN) * 90;
    const lateRaw = p.late.minutes ? p.late.impact / p.late.minutes * 90 : earlyRate;
    const lateDelta = (p.late.minutes * (lateRaw - earlyRate) + LATE_PRIOR_MIN * pr.lateDelta) / (p.late.minutes + LATE_PRIOR_MIN);
    const sc = p.succ;
    const earlySucc = sc.en ? sc.eo / sc.en : null;
    const lateSucc = earlySucc == null ? null : (sc.lo + (earlySucc + pr.succDelta) * FADE_PRIOR_ACTIONS) / (sc.ln + FADE_PRIOR_ACTIONS);
    const succDelta = lateSucc == null ? pr.succDelta : lateSucc - earlySucc;
    // keepers: no fatigue model (few contested actions, and they're rarely subbed for it)
    const fade = p.position === "GK" ? 1 : Math.max(0.6, Math.min(1.1, 1 + FADE_SLOPE * succDelta));
    model.set(p.player, { player: p.player, team: p.team, position: p.position, minutes: Math.round(m), starts: p.starts, matches: p.matches,
      off90: r3(off90), def90: r3(def90), earlyRate: r3(earlyRate), lateDelta: r3(lateDelta), lateMinutes: Math.round(p.late.minutes),
      fade: r3(fade), popLateDelta: r3(pr.lateDelta), zone: zones.get(p.player) || null,
      success: { early: earlySucc == null ? null : r3(earlySucc), lateRaw: sc.ln ? r3(sc.lo / sc.ln) : null, lateActions: Math.round(sc.ln), delta: r3(succDelta), popDelta: r3(pr.succDelta) } });
  }
  return model;
}

// Fatigue multiplier for a player at minute t who came on at `on`.
function fatigueAt(pm, on, t) {
  const played = t - (on || 0);
  if (played <= LATE_MINUTE) return 1;
  return 1 - (1 - pm.fade) * Math.min(1, (played - LATE_MINUTE) / 30);
}

// Attack/defense sums for a lineup. entries: [{ player, minutes?, on? }].
// opts.at (minute) applies fatigue; opts.flankBoost {L,C,R} boosts attackers by channel.
function lineupStrength(entries, model, opts = {}) {
  let att = 0, def = 0; const missing = [];
  for (const e of entries) {
    const pm = model.get(e.player);
    if (!pm) { missing.push(e.player); continue; }
    const share = (e.minutes != null ? e.minutes : 90) / 90;
    const f = opts.at != null ? fatigueAt(pm, e.on, opts.at) : 1;
    const boost = opts.flankBoost && pm.zone ? opts.flankBoost[pm.zone.channel] || 1 : 1;
    att += pm.off90 * share * f * boost; def += pm.def90 * share * f;
  }
  return { att, def, missing };
}

// The team's usual XI: its 11 most-used players (≥1 GK), each as a 90-minute share.
function usualLineup(team, model) {
  const ps = [...model.values()].filter((p) => p.team === team).sort((a, b) => b.minutes - a.minutes);
  const gk = ps.find((p) => p.position === "GK");
  const out = gk ? [gk] : [];
  for (const p of ps) { if (out.length >= 11) break; if (p !== gk && p.position !== "GK") out.push(p); }
  return out.map((p) => ({ player: p.player, minutes: 90 }));
}

// How much more (or less) xG the opponent concedes through each attacking channel
// than an even 1/3 split, as a boost for our attackers in that channel.
// share/boost are keyed by the ATTACKER's channel (their right-back faces our L).
function flankBoostAgainst(opponent, matches) {
  const conceded = { L: 0, C: 0, R: 0 }; let tot = 0;
  for (const m of matches) {
    if (m.sport !== "soccer" || (m.home !== opponent && m.away !== opponent)) continue;
    const oppSide = m.home === opponent ? "away" : "home";
    const evs = sortedEvents(m);
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (e.team !== oppSide || e.type !== "shot") continue;
      const ch = buildUpChannel(evs, i);
      if (!ch) continue;
      // keyed by the *attacker's* channel, so boost[k] applies to our players in channel k
      const xg = typeof e.xg === "number" ? e.xg : 0.1;
      conceded[ch] += xg; tot += xg;
    }
  }
  if (tot < 3) return null; // not enough located shots to say anything
  const boost = {};
  for (const k of ["L", "C", "R"]) boost[k] = r3(1 + FLANK_WEIGHT * (3 * conceded[k] / tot - 1));
  return { boost, share: { L: r3(conceded.L / tot), C: r3(conceded.C / tot), R: r3(conceded.R / tot) }, xg: r3(tot) };
}

// Multipliers on (λ_for, λ_against) for `lineup` relative to the team's usual XI.
function lineupMultipliers(team, lineup, oppTeam, oppLineup, model, opts = {}) {
  const us = lineupStrength(lineup || usualLineup(team, model), model, { at: opts.at, flankBoost: opts.flankBoost });
  const usU = lineupStrength(usualLineup(team, model), model);
  const them = lineupStrength(oppLineup || usualLineup(oppTeam, model), model, { at: opts.oppAt });
  const themU = lineupStrength(usualLineup(oppTeam, model), model);
  const clampM = (x) => Math.max(MULT_CAP[0], Math.min(MULT_CAP[1], x));
  return {
    forMult: clampM(Math.exp(K_ATT * (us.att - usU.att) + K_DEF * (themU.def - them.def))),
    againstMult: clampM(Math.exp(K_ATT * (them.att - themU.att) + K_DEF * (usU.def - us.def))),
    us, them, missing: [...us.missing, ...them.missing],
  };
}

module.exports = { zonesFor, buildPlayerModel, lineupStrength, usualLineup, lineupMultipliers, flankBoostAgainst, fatigueAt, zoneOf, K_ATT, K_DEF };
