// 10XAI Sports — match tactics: best XI, formation choice, in-game substitutions,
// and a pre-match game plan against a specific opponent (soccer).
//
// Everything is scored on one objective computed from the lineup model:
//   points     3·P(win) + P(draw)        (league)
//   win        P(win) + ½·P(draw)         (knockout: a draw goes to extra time / pens)
//   avoid_loss P(win) + P(draw)
// A recommendation is only made if it moves that objective; the move is reported
// in the same units, so "sub X for Y" comes with "+0.07 expected points".
const { buildElo, matchState, PARAMS } = require("./predict.cjs");
const LM = require("./lineup-model.cjs");
const { buildProfiles } = require("./profile.cjs");
const { scoutTeam } = require("./scout.cjs");

const STOPPAGE = 4;
const FORMATIONS = { "4-3-3": [4, 3, 3], "4-4-2": [4, 4, 2], "4-2-3-1": [4, 5, 1], "3-5-2": [3, 5, 2], "3-4-3": [3, 4, 3], "5-3-2": [5, 3, 2], "4-5-1": [4, 5, 1] };
const r3 = (x) => Math.round(x * 1000) / 1000;

function objectiveOf(p, objective) {
  if (objective === "win") return p.pW + 0.5 * p.pD;
  if (objective === "avoid_loss") return p.pW + p.pD;
  return 3 * p.pW + p.pD;
}

// Shared context: Elo baseline, player model, flank boost, profiles.
function context(matches, us, them, opts = {}) {
  const ms = matches.filter((m) => m.sport === "soccer");
  for (const t of [us, them]) if (!ms.some((m) => m.home === t || m.away === t)) throw new Error(`no soccer matches for "${t}"`);
  if (us === them) throw new Error("pick two different teams");
  const P = PARAMS.soccer;
  const { get } = buildElo(ms, "soccer");
  const hfa = opts.venue === "home" ? P.hfa : opts.venue === "away" ? -P.hfa : 0;
  const d = get(us) + hfa - get(them);
  const goals = ms.filter((m) => m.score);
  const base = goals.length ? goals.reduce((a, m) => a + m.score.home + m.score.away, 0) / goals.length / 2 : P.baseGoals;
  const model = LM.buildPlayerModel(ms);
  const flank = LM.flankBoostAgainst(them, ms);
  return { ms, us, them, model, flank, objective: opts.objective || "points",
    baseUs: base * Math.exp(P.goalK * d), baseThem: base * Math.exp(-P.goalK * d), elo: { us: Math.round(get(us)), them: Math.round(get(them)) } };
}

// Evaluate a lineup (entries: { player, on? }) at `minute` with `score`.
function evaluate(ctx, lineup, { minute = 0, score = { us: 0, them: 0 }, oppLineup = null } = {}) {
  const at = minute > 0 ? minute : undefined;
  const entries = lineup.map((p) => ({ player: p.player, minutes: 90, on: p.on || 0 }));
  const mu = LM.lineupMultipliers(ctx.us, entries, ctx.them, oppLineup, ctx.model, { at, oppAt: at, flankBoost: ctx.flank ? ctx.flank.boost : null });
  const lu = ctx.baseUs * mu.forMult, lt = ctx.baseThem * mu.againstMult;
  const remaining = Math.max(0, (90 + STOPPAGE - minute) / (90 + STOPPAGE));
  const st = matchState(lu, lt, { home: score.us, away: score.them }, remaining);
  const p = { pW: st.raw.pH, pD: st.raw.pD, pL: st.raw.pA };
  return { ...p, value: objectiveOf(p, ctx.objective), xgUs: lu * remaining, xgThem: lt * remaining, att: mu.us.att, def: mu.us.def, unmodelled: mu.missing };
}

const lineOf = (ctx, name) => (ctx.model.get(name) || {}).position || null;
const squadOf = (ctx, exclude = []) => [...ctx.model.values()].filter((p) => p.team === ctx.us && !exclude.includes(p.player));
const fmtEval = (e) => ({ win: r3(e.pW), draw: r3(e.pD), loss: r3(e.pL), value: r3(e.value), xgFor: r3(e.xgUs), xgAgainst: r3(e.xgThem) });

// Best XI for a formation via greedy seed + swap local search on the objective.
function bestXIFor(ctx, shape, squad) {
  const [nDF, nMF, nFW] = shape;
  const byLine = (l) => squad.filter((p) => p.position === l);
  const seedVal = (p) => p.off90 * (ctx.flank && p.zone ? ctx.flank.boost[p.zone.channel] || 1 : 1) + p.def90;
  const need = { GK: 1, DF: nDF, MF: nMF, FW: nFW };
  for (const [l, n] of Object.entries(need)) if (byLine(l).length < n) return null;
  let xi = [];
  for (const [l, n] of Object.entries(need)) xi.push(...byLine(l).sort((a, b) => seedVal(b) - seedVal(a)).slice(0, n));
  const wideOk = (lineup) => {
    // a back four/five needs someone who plays on each flank, when the squad has one
    const dfs = lineup.filter((p) => p.position === "DF");
    if (dfs.length < 4) return true;
    for (const ch of ["L", "R"]) if (squad.some((p) => p.position === "DF" && p.zone && p.zone.channel === ch) && !dfs.some((p) => p.zone && p.zone.channel === ch)) return false;
    return true;
  };
  const score = (lineup) => (wideOk(lineup) ? evaluate(ctx, lineup.map((p) => ({ player: p.player }))).value : -Infinity);
  let cur = score(xi);
  if (cur === -Infinity) {
    // repair flank coverage before optimising
    for (const ch of ["L", "R"]) {
      const cand = byLine("DF").filter((p) => p.zone && p.zone.channel === ch && !xi.includes(p)).sort((a, b) => seedVal(b) - seedVal(a))[0];
      if (cand && !xi.some((p) => p.position === "DF" && p.zone && p.zone.channel === ch)) {
        const drop = xi.filter((p) => p.position === "DF" && (!p.zone || p.zone.channel === "C")).sort((a, b) => seedVal(a) - seedVal(b))[0];
        if (drop) xi = xi.map((p) => (p === drop ? cand : p));
      }
    }
    cur = score(xi);
  }
  for (let iter = 0; iter < 25; iter++) {
    let best = null;
    for (let i = 0; i < xi.length; i++) for (const c of squad) {
      if (xi.includes(c) || c.position !== xi[i].position) continue;
      const trial = xi.slice(); trial[i] = c;
      const v = score(trial);
      if (v > cur + 1e-6 && (!best || v > best.v)) best = { trial, v };
    }
    if (!best) break;
    xi = best.trial; cur = best.v;
  }
  return { xi, value: cur };
}

function bestLineup(matches, { us, them, venue, objective, formation, unavailable = [] }) {
  const ctx = context(matches, us, them, { venue, objective });
  const squad = squadOf(ctx, unavailable);
  const usual = LM.usualLineup(us, ctx.model);
  const usualEval = evaluate(ctx, usual);
  const shapes = formation ? { [formation]: FORMATIONS[formation] } : FORMATIONS;
  if (formation && !FORMATIONS[formation]) throw new Error(`unknown formation ${formation}; use one of ${Object.keys(FORMATIONS).join(", ")}`);
  const results = [];
  const seen = new Set();
  for (const [name, shape] of Object.entries(shapes)) {
    const key = shape.join("-"); if (seen.has(key)) continue; seen.add(key);
    const r = bestXIFor(ctx, shape, squad);
    if (!r || r.value === -Infinity) continue;
    const ev = evaluate(ctx, r.xi.map((p) => ({ player: p.player })));
    results.push({ formation: name, xi: r.xi.map((p) => ({ player: p.player, position: p.position, channel: p.zone ? p.zone.channel : null, off90: p.off90, def90: p.def90 })), eval: fmtEval(ev) });
  }
  if (!results.length) throw new Error("squad has too few players with known positions to fill a formation");
  results.sort((a, b) => b.eval.value - a.eval.value);
  const best = results[0];
  const usualNames = new Set(usual.map((p) => p.player));
  return {
    us, them, objective: ctx.objective, venue: venue || "neutral", elo: ctx.elo,
    recommended: best, alternatives: results.slice(1, 4).map((r) => ({ formation: r.formation, eval: r.eval })),
    usual: { xi: usual.map((p) => ({ player: p.player, position: lineOf(ctx, p.player) })), eval: fmtEval(usualEval) },
    changesFromUsual: { in: best.xi.filter((p) => !usualNames.has(p.player)).map((p) => p.player), out: usual.filter((p) => !best.xi.some((x) => x.player === p.player)).map((p) => p.player) },
    gain: r3(best.eval.value - usualEval.value),
    flank: ctx.flank,
    notes: lineupNotes(ctx),
  };
}

function lineupNotes(ctx) {
  const n = [`Lineup effects are damped (±25% max on expected goals): a single change rarely moves the result much. Treat small gains (< 0.03) as a tie.`];
  if (ctx.flank) {
    const [f, s] = Object.entries(ctx.flank.share).filter(([k]) => k !== "C").sort((a, b) => b[1] - a[1])[0];
    n.push(`${ctx.them} concede ${Math.round(s * 100)}% of their xG through attacks down their ${f === "L" ? "right" : "left"} side, so your ${f === "L" ? "left" : "right"}-sided attackers get a boost.`);
  }
  return n;
}

// In-game substitution planner.
function planSubstitutions(matches, { us, them, minute, score = { us: 0, them: 0 }, onPitch, bench, subsLeft = 5, venue, objective, maxCombo = 2, profiles, ctx: given }) {
  const ctx = given || context(matches, us, them, { venue, objective });
  if (!Array.isArray(onPitch) || !onPitch.length) onPitch = LM.usualLineup(us, ctx.model).map((p) => ({ player: p.player, on: 0 }));
  onPitch = onPitch.map((p) => (typeof p === "string" ? { player: p, on: 0 } : { player: p.player, on: p.on || 0 }));
  if (!Array.isArray(bench) || !bench.length) bench = squadOf(ctx).map((p) => p.player).filter((n) => !onPitch.some((p) => p.player === n));
  bench = bench.map((b) => (typeof b === "string" ? b : b.player));
  const base = evaluate(ctx, onPitch, { minute, score });
  const prof = new Map((profiles || buildProfiles(ctx.ms, { team: us, model: ctx.model })).map((p) => [p.player, p]));

  const outs = onPitch.filter((p) => lineOf(ctx, p.player) !== "GK");
  const ins = bench.filter((b) => lineOf(ctx, b) && lineOf(ctx, b) !== "GK");
  const apply = (swaps) => onPitch.filter((p) => !swaps.some((s) => s.out === p.player)).concat(swaps.map((s) => ({ player: s.in, on: minute })));
  const singles = [];
  for (const o of outs) for (const i of ins) {
    const ev = evaluate(ctx, apply([{ out: o.player, in: i }]), { minute, score });
    singles.push({ swaps: [{ out: o.player, in: i }], ev });
  }
  singles.sort((a, b) => b.ev.value - a.ev.value);
  let options = singles.slice(0, 12);
  if (maxCombo >= 2 && subsLeft >= 2) {
    const top = singles.slice(0, 10);
    for (let a = 0; a < top.length; a++) for (let b = a + 1; b < top.length; b++) {
      const s1 = top[a].swaps[0], s2 = top[b].swaps[0];
      if (s1.out === s2.out || s1.in === s2.in) continue;
      options.push({ swaps: [s1, s2], ev: evaluate(ctx, apply([s1, s2]), { minute, score }) });
    }
  }
  options.sort((a, b) => b.ev.value - a.ev.value);
  // the same set of changes can come from different pairings — keep one
  const seenSets = new Set();
  options = options.filter((o) => { const k = o.swaps.map((s) => s.out).sort().join("|") + ">" + o.swaps.map((s) => s.in).sort().join("|"); if (seenSets.has(k)) return false; seenSets.add(k); return true; });
  const fatigueNow = (name, on) => { const pm = ctx.model.get(name); return pm ? LM.fatigueAt(pm, on, minute) : 1; };
  const explain = (sw) => {
    const outP = ctx.model.get(sw.out), inP = ctx.model.get(sw.in), o = onPitch.find((p) => p.player === sw.out);
    const bits = [];
    const f = fatigueNow(sw.out, o ? o.on : 0);
    if (f < 0.97) bits.push(`${sw.out} is running at ~${Math.round(f * 100)}% (measured late-game drop)`);
    if (outP && inP) {
      const dOff = inP.off90 - outP.off90 * f, dDef = inP.def90 - outP.def90 * f;
      const shape = dOff - dDef > 0.05 ? "more attacking" : dDef - dOff > 0.05 ? "more defensive" : "like-for-like";
      bits.push(`${outP.position}→${inP.position}, ${shape}: attack ${dOff >= 0 ? "+" : ""}${r3(dOff)}, defence ${dDef >= 0 ? "+" : ""}${r3(dDef)} (impact/90)`);
    }
    const pi = prof.get(sw.in);
    if (pi) bits.push(`${sw.in}: ${pi.archetypes.join(" / ")}, ${pi.form.label}`);
    return bits.join("; ");
  };
  const fmtOpt = (o) => ({ subs: o.swaps.map((s) => ({ ...s, why: explain(s) })), eval: fmtEval(o.ev), gain: r3(o.ev.value - base.value),
    winProbChange: r3(o.ev.pW - base.pW), lossProbChange: r3(o.ev.pL - base.pL) });
  const ranked = options.filter((o) => o.swaps.length <= subsLeft).slice(0, 6).map(fmtOpt);
  const mostAttacking = [...singles].sort((a, b) => b.ev.xgUs - a.ev.xgUs)[0];
  const mostDefensive = [...singles].sort((a, b) => a.ev.xgThem - b.ev.xgThem)[0];
  const diff = score.us - score.them;
  const state = diff > 0 ? "leading" : diff < 0 ? "trailing" : "level";
  const bestGain = ranked.length ? ranked[0].gain : 0;
  return {
    us, them, minute, score, state, objective: ctx.objective,
    current: fmtEval(base),
    recommendation: bestGain >= 0.01 ? ranked[0] : null,
    advice: bestGain >= 0.01 ? `Make the change now: ${ranked[0].subs.map((s) => `${s.in} for ${s.out}`).join(", ")} (${ctx.objective === "points" ? "expected points" : "objective"} +${bestGain}).`
      : "Hold: no available change improves the expected outcome by a meaningful margin right now.",
    options: ranked,
    posture: {
      attack: mostAttacking ? fmtOpt(mostAttacking) : null,
      defend: mostDefensive ? fmtOpt(mostDefensive) : null,
      note: state === "trailing" ? "Chasing the game: the objective already rewards extra xG over conceding risk." : state === "leading" ? "Protecting a lead: the objective already weighs conceding more heavily." : "Level: balanced changes usually win out.",
    },
    fatigue: onPitch.map((p) => ({ player: p.player, condition: r3(fatigueNow(p.player, p.on)) })).sort((a, b) => a.condition - b.condition).slice(0, 5),
  };
}

// Pre-match plan: scouting summary + best XI + scenario substitution plan.
function gamePlan(matches, { us, them, venue, objective, formation, unavailable = [] }) {
  const lineup = bestLineup(matches, { us, them, venue, objective, formation, unavailable });
  const scout = scoutTeam(matches, them, { us });
  const self = scoutTeam(matches, us, { us: them });
  const xi = lineup.recommended.xi.map((p) => ({ player: p.player, on: 0 }));
  const ctx = context(matches, us, them, { venue, objective });
  const bench = squadOf(ctx, unavailable).map((p) => p.player).filter((n) => !xi.some((x) => x.player === n));
  const profiles = buildProfiles(ctx.ms, { team: us, model: ctx.model });
  const scenarios = [];
  for (const minute of [60, 70]) for (const [label, sc] of [["level", { us: 0, them: 0 }], ["behind by 1", { us: 0, them: 1 }], ["ahead by 1", { us: 1, them: 0 }]]) {
    const p = planSubstitutions(matches, { us, them, minute, score: sc, onPitch: xi, bench, venue, objective, maxCombo: 1, profiles, ctx });
    scenarios.push({ minute, state: label, current: p.current, sub: p.recommendation ? p.recommendation.subs[0] : null, gain: p.recommendation ? p.recommendation.gain : 0 });
  }
  return {
    us, them, venue: venue || "neutral", objective: objective || "points",
    prediction: { usualXI: lineup.usual.eval, recommendedXI: lineup.recommended.eval },
    lineup,
    opponent: { style: scout.style.map((s) => s.trait), formation: scout.formation, keyThreats: scout.keyThreats, weakLinks: scout.weakLinks.slice(0, 3), confidence: scout.confidence },
    recommendations: scout.recommendations.slice(0, 7),
    ourVulnerabilities: self.recommendations.filter((r) => !/^Low confidence/.test(r.title)).slice(0, 4)
      .map((r) => ({ title: r.title.replace(/^Target /, "Protect ").replace(/^Attack down their/, "Cover your").replace(/^Neutralise /, "They will try to stop "), detail: r.detail })),
    substitutionPlan: scenarios,
    attribution: scout.attribution,
  };
}

module.exports = { bestLineup, planSubstitutions, gamePlan, evaluate, context, FORMATIONS };
