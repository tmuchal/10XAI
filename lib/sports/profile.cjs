// 10XAI Sports — player scouting profiles (soccer).
//
// For each player: what kind of player they are (archetype), what they do well
// and badly (attributes vs. the same position line, each with the stat behind
// it), whether they're playing well *right now* (per-match ratings and form),
// where on the pitch they operate, whether they fade late — and how to play
// against them.
const { computeRatings, LATE_MINUTE } = require("./ratings.cjs");
const LM = require("./lineup-model.cjs");

const MIN_RATED_MINUTES = 20;     // appearances shorter than this get no match rating
const STRENGTH = 62, WEAKNESS = 38;
const FORM_WINDOW = 3;
const FORM_THRESHOLD = 0.75;

const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;
const pctS = (x) => Math.round(x * 100) + "%";
const per90 = (x, min) => (min > 0 ? x / min * 90 : 0);
const CHANNEL = { L: "left", C: "central", R: "right" };

// Match ratings on a 10-point scale: 6.5 = an average game for that position line,
// ±1.0 per standard deviation of per-90 impact in that match.
function matchRatingScale(ratings) {
  const byPos = {};
  for (const r of ratings) for (const g of r._agg.log) {
    if (g.minutes < MIN_RATED_MINUTES) continue;
    const k = r.position || "all";
    (byPos[k] = byPos[k] || []).push(per90(g.impact, Math.max(g.minutes, 45)));
  }
  const dist = {};
  for (const [k, xs] of Object.entries(byPos)) {
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length) || 1;
    dist[k] = { mean, sd };
  }
  return (r, g) => {
    if (g.minutes < MIN_RATED_MINUTES) return null;
    const d = dist[r.position || "all"] || dist.all || { mean: 0, sd: 1 };
    // short cameos are scored per 45 minutes minimum so one lucky action can't produce a 10
    return Math.max(3, Math.min(10, r1(6.5 + (per90(g.impact, Math.max(g.minutes, 45)) - d.mean) / d.sd)));
  };
}

function formOf(matchRatings) {
  const rated = matchRatings.filter((m) => m.rating != null);
  if (rated.length < FORM_WINDOW + 1) return { label: "not enough matches", recent: null, season: null, trend: null, n: rated.length };
  const season = rated.reduce((a, m) => a + m.rating, 0) / rated.length;
  const recent = rated.slice(-FORM_WINDOW).reduce((a, m) => a + m.rating, 0) / FORM_WINDOW;
  const trend = recent - season;
  // ±0.75: a 3-match average of ~1-point-noisy ratings needs this much to mean anything
  const label = trend >= FORM_THRESHOLD ? "in form" : trend <= -FORM_THRESHOLD ? "out of form" : "steady";
  return { label, recent: r1(recent), season: r1(season), trend: r1(trend), n: rated.length };
}

// The stat behind each attribute — so every "strong at X" is checkable.
function evidence(attr, st, min) {
  const p = (k) => r2(per90(st[k] || 0, min));
  switch (attr) {
    case "passing": return `${st.pass_att ? pctS(st.pass_ok / st.pass_att) : "—"} pass completion (${p("pass_att")} passes/90)`;
    case "progression": return `${r2(per90((st.prog_pass || 0) + (st.carry || 0), min))} progressive passes + carries /90`;
    case "shooting": return `${p("xg")} xG/90 · ${st.goal} goals from ${r2(st.xg)} xG (${st.shots} shots)`;
    case "creativity": return `${p("key_pass")} key passes/90 · ${st.assist} assists`;
    case "dribbling": return `${p("dribble_ok")} successful dribbles/90${st.dribble_att ? ` (${pctS(st.dribble_ok / st.dribble_att)})` : ""}`;
    case "defending": return `${r2(per90(st.def_padj || 0, min))} possession-adjusted defensive actions /90 (${r2(per90(st.tackle_ok + st.interception + st.block, min))} raw tackles won + interceptions + blocks)`;
    case "duels": return `${st.tackle_att ? pctS(st.tackle_ok / st.tackle_att) : "—"} tackles won · dribbled past ${p("dribbled_past")}/90`;
    case "aerial": return `${st.aerial_att ? pctS(st.aerial_ok / st.aerial_att) : "—"} aerial duels won (${st.aerial_att})`;
    case "pressing": return `${p("pressure")} pressures/90 (${p("pressure_padj")} possession-adjusted)`;
    case "goalkeeping": return `${st.sot_faced ? pctS(1 - st.ga / st.sot_faced) : "—"} of shots on target saved · ${r2(st.xg_faced - st.ga)} goals prevented vs xG`;
    case "discipline": return `${p("foul")} fouls + ${p("turnover")} turnovers /90 · ${st.yellow} yellow, ${st.red} red`;
    default: return "";
  }
}

function archetypes(pos, a, zone) {
  const t = [];
  const hi = (k, v = 65) => a[k] != null && a[k] >= v;
  const wide = zone && zone.channel !== "C";
  if (pos === "GK") {
    if (hi("goalkeeping")) t.push("Shot-stopper");
    if (hi("progression") || hi("passing")) t.push("Sweeper-keeper / distributor");
  } else if (pos === "FW") {
    if (hi("shooting") && !hi("dribbling")) t.push("Finisher");
    if (hi("dribbling")) t.push(wide ? "Dribbling winger" : "Dribbling forward");
    if (hi("creativity")) t.push("Creative forward");
    if (hi("aerial")) t.push("Target forward");
    if (hi("pressing")) t.push("Pressing forward");
  } else if (pos === "MF") {
    if (hi("progression", 62) && hi("passing", 60)) t.push("Deep-lying playmaker");
    if (hi("creativity")) t.push("Creative playmaker");
    if (hi("defending") || (hi("pressing") && hi("duels", 58))) t.push("Ball-winner");
    if (hi("dribbling")) t.push("Ball-carrier");
    if (hi("shooting")) t.push("Goal-threat midfielder");
  } else if (pos === "DF") {
    if (hi("aerial") && hi("defending", 58)) t.push("Stopper");
    if (hi("progression")) t.push("Ball-playing defender");
    if (wide && (hi("creativity", 60) || hi("dribbling", 60))) t.push("Attacking full-back");
    if (hi("defending") && !t.includes("Stopper")) t.push("Defensive anchor");
  }
  if (!t.length) {
    const vals = Object.values(a).filter((v) => v != null);
    t.push(vals.length && Math.max(...vals) < 58 && Math.min(...vals) > 42 ? "All-rounder" : "Role player");
  }
  return t.slice(0, 2);
}

// Concrete counter-advice, each tied to the finding that triggered it.
// Returns { threat: [...], exploit: [...] }: how to contain what they do well,
// and how to exploit what they do badly.
function counterPlan(p) {
  const tips = [], exploit = [];
  const a = p.attributes, z = p.zone, side = z ? `${CHANNEL[z.channel]} channel` : "that zone";
  const has = (s) => p.archetypes.includes(s);
  if (has("Dribbling winger") || has("Dribbling forward")) tips.push(`Don't dive in against the dribbling (${a.dribbling}): show the ball-carrier onto the weaker foot and double up in the ${side}.`);
  if (has("Finisher") || (a.shooting != null && a.shooting >= 70 && p.position === "FW")) tips.push(`Deny service into the box: this player turns chances into goals (shooting ${a.shooting}). Keep a centre-back touch-tight and block crossing lanes.`);
  if (has("Deep-lying playmaker") || has("Creative playmaker")) tips.push(`Press on the first touch, or man-mark, to cut the supply line (progression ${a.progression ?? "—"}, creativity ${a.creativity ?? "—"}).`);
  if (has("Ball-winner")) tips.push(`Move the ball quickly past this ball-winner: one or two touches, and avoid dribbling through that zone (defending ${a.defending}).`);
  if (has("Target forward")) tips.push(`Contest every first ball (aerial ${a.aerial}). Stop the cross at source and attack the second balls.`);
  if (p.position === "DF" && a.shooting != null && a.shooting >= 70) tips.push(`A goal threat from defence (shooting ${a.shooting}): track the late runs into the box and mark at set pieces.`);
  if (has("Attacking full-back")) tips.push(`Counter into the space left behind in the ${side} when this full-back pushes up.`);
  if (a.duels != null && a.duels <= WEAKNESS) exploit.push(`Attack this player 1v1: weak in duels (${a.duels}), ${evidence("duels", p.stats, p.minutes)}.`);
  if (a.aerial != null && a.aerial <= WEAKNESS) exploit.push(`Aim crosses and set pieces at this player: weak in the air (${a.aerial}).`);
  if (a.passing != null && a.passing <= WEAKNESS && p.position !== "FW") exploit.push(`Press this player on the ball: loose passing (${a.passing}). Force them to play out.`);
  if (a.discipline != null && a.discipline <= WEAKNESS) exploit.push(`Run at this player to draw fouls or cards (discipline ${a.discipline}).`);
  if (p.fatigue && p.fatigue.label === "fades late") exploit.push(`Impact drops after ${LATE_MINUTE}' (${p.fatigue.summary}). Target this player with fresh legs from the bench.`);
  if (p.form.label === "out of form") exploit.push(`Out of form (last ${FORM_WINDOW}: ${p.form.recent} vs season ${p.form.season}). Test this player early.`);
  if (p.position === "DF" && a.defending != null && a.defending <= WEAKNESS) exploit.push(`Run at this defender: low defensive output even after adjusting for possession (${a.defending}).`);
  if (p.position === "GK" && a.goalkeeping != null && a.goalkeeping <= WEAKNESS) exploit.push(`Shoot on sight: this keeper saves fewer shots than expected (${evidence("goalkeeping", p.stats, p.minutes)}).`);
  return { threat: tips.slice(0, 3), exploit: exploit.slice(0, 3) };
}

// Build profiles for players (optionally one team) from all matches.
function buildProfiles(matches, opts = {}) {
  const ms = matches.filter((m) => m.sport === "soccer");
  const ratings = computeRatings(ms, { sport: "soccer", halfLifeDays: opts.halfLifeDays });
  const model = opts.model || LM.buildPlayerModel(ms);
  const scale = matchRatingScale(ratings);
  const rows = opts.team ? ratings.filter((r) => r.team === opts.team) : ratings;
  return rows.map((r) => {
    const pm = model.get(r.player);
    const log = r._agg.log.map((g) => ({ date: g.date, opponent: g.opponent, minutes: Math.round(g.minutes), starter: g.starter,
      rating: scale(r, g), result: g.result ? `${g.result.outcome} ${g.result.us}-${g.result.them}` : null,
      goals: g.counts.goal || 0, assists: g.counts.assist || 0, xg: r2(g.counts.xg || 0) }));
    const form = formOf(log);
    let fatigue = null;
    if (pm && pm.success && pm.success.lateActions >= 20 && r.position !== "GK") {
      const sc = pm.success, rel = pm.fade - 1; // same factor the substitution planner uses
      fatigue = { factor: pm.fade, relative: r2(rel), lateActions: sc.lateActions,
        // judged against the typical late drop for the position, and only on a real sample
        label: sc.lateActions >= 40 && sc.delta - sc.popDelta <= -0.025 ? "fades late" : sc.lateActions >= 40 && sc.delta - sc.popDelta >= 0.02 ? "stronger late" : "holds up",
        summary: `success on passes/duels ${pctS(sc.early)} → ${pctS(sc.lateRaw)} after ${LATE_MINUTE}' on the pitch (${sc.lateActions} late actions; typical change for the position ${sc.popDelta >= 0 ? "+" : ""}${Math.round(sc.popDelta * 1000) / 10} pts)` };
    }
    const attrs = Object.entries(r.attributes).filter(([, v]) => v != null);
    const strengths = attrs.filter(([, v]) => v >= STRENGTH).sort((x, y) => y[1] - x[1]).slice(0, 3)
      .map(([k, v]) => ({ attribute: k, value: v, evidence: evidence(k, r.stats, r.minutes) }));
    const weaknesses = attrs.filter(([, v]) => v <= WEAKNESS).sort((x, y) => x[1] - y[1]).slice(0, 3)
      .map(([k, v]) => ({ attribute: k, value: v, evidence: evidence(k, r.stats, r.minutes) }));
    const zone = pm ? pm.zone : null;
    const p = { player: r.player, team: r.team, position: r.position, matches: r.matches, starts: r.starts, minutes: r.minutes,
      overall: r.overall, overallAll: r.overallAll, impactPer90: r.impact.per90, attributes: r.attributes, stats: r.stats, sample: r.sample,
      archetypes: archetypes(r.position, r.attributes, zone), strengths, weaknesses, form, matchRatings: log, fatigue,
      zone: zone ? { ...zone, summary: `mostly ${CHANNEL[zone.channel]} channel, ${zone.third} third` } : null,
      model: pm ? { off90: pm.off90, def90: pm.def90 } : null };
    p.verdict = verdictOf(p);
    const plan = counterPlan(p);
    p.howToPlayAgainst = [...plan.threat, ...plan.exploit].slice(0, 4);
    p.howToExploit = plan.exploit;
    return p;
  });
}

// One-line answer to "is this player good, and playing well right now?"
function verdictOf(p) {
  const level = p.overall >= 70 ? "elite for the position here" : p.overall >= 58 ? "above average" : p.overall >= 43 ? "average" : "below average";
  const form = p.form.label === "not enough matches" ? "too few matches to judge form" : `${p.form.label} (last ${FORM_WINDOW}: ${p.form.recent}/10 vs season ${p.form.season}/10)`;
  return `${p.archetypes.join(" / ")} · ${level} (${p.overall}) · ${form}${p.sample === "small" ? " · small sample, treat with caution" : ""}`;
}

module.exports = { buildProfiles, evidence, archetypes };
