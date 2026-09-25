// 10XAI Sports — opponent scouting report (soccer).
//
// Everything is measured against the other teams in the loaded data (z-scores),
// and every recommendation carries the number that triggered it, so the report
// reads "their right side concedes 47% of their xG" — never "they look shaky".
const { buildProfiles } = require("./profile.cjs");
const { xgOf, isProgressive } = require("./ratings.cjs");

const { MIRROR, FLANK, buildUpChannel, sortedEvents } = require("./channels.cjs");
const BINS = ["0-15", "16-30", "31-45", "46-60", "61-75", "76-90+"];
const binOf = (t) => Math.min(5, Math.floor(Math.max(0, t / 60 - 0.001) / 15));
const r2 = (x) => Math.round(x * 100) / 100;
const pctS = (x) => Math.round(x * 100) + "%";

function emptyTeamStats() {
  return { matches: 0, W: 0, D: 0, L: 0, gf: 0, ga: 0, xgf: 0, xga: 0, shots: 0, shotsAgainst: 0, passes: 0, passOk: 0, prog: 0,
    pressures: 0, highPress: 0, dribbles: 0, keyPasses: 0, aerialAtt: 0, aerialOk: 0, fouls: 0, turnovers: 0, defActions: 0,
    xgByChannel: { L: 0, C: 0, R: 0 }, concededByFlank: { L: 0, C: 0, R: 0 }, locatedXgf: 0, locatedXga: 0,
    goalsForBins: [0, 0, 0, 0, 0, 0], goalsAgainstBins: [0, 0, 0, 0, 0, 0], formations: {} };
}

function teamStats(ms) {
  const T = new Map();
  const get = (t) => { let s = T.get(t); if (!s) { s = emptyTeamStats(); T.set(t, s); } return s; };
  for (const m of ms) {
    if (!m.score) continue;
    for (const side of ["home", "away"]) {
      const s = get(m[side]); const os = side === "home" ? "away" : "home";
      s.matches++; s.gf += m.score[side]; s.ga += m.score[os];
      s[m.score[side] > m.score[os] ? "W" : m.score[side] < m.score[os] ? "L" : "D"]++;
      const lines = { DF: 0, MF: 0, FW: 0 };
      for (const p of m.lineups[side]) if (p.starter !== false && lines[p.position] != null) lines[p.position]++;
      if (lines.DF + lines.MF + lines.FW === 10) { const f = `${lines.DF}-${lines.MF}-${lines.FW}`; s.formations[f] = (s.formations[f] || 0) + 1; }
    }
    const evs = sortedEvents(m);
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      const s = get(m[e.team]); const o = get(m[e.team === "home" ? "away" : "home"]);
      switch (e.type) {
        case "pass": s.passes++; if (e.outcome === "success") { s.passOk++; if (isProgressive(e)) s.prog++; } break;
        case "pressure": s.pressures++; if (typeof e.x === "number" && e.x >= 60) s.highPress++; break;
        case "dribble": s.dribbles++; break;
        case "key_pass": s.keyPasses++; break;
        case "aerial": s.aerialAtt++; if (e.outcome === "success") s.aerialOk++; break;
        case "foul": s.fouls++; break;
        case "turnover": s.turnovers++; break;
        case "tackle": case "interception": case "block": case "recovery": s.defActions++; break;
        case "shot": {
          const xg = xgOf(e);
          s.shots++; s.xgf += xg; o.shotsAgainst++; o.xga += xg;
          const ch = buildUpChannel(evs, i);
          if (ch) { s.xgByChannel[ch] += xg; s.locatedXgf += xg; o.concededByFlank[MIRROR[ch]] += xg; o.locatedXga += xg; }
          if (e.outcome === "goal" && e.t != null) { s.goalsForBins[binOf(e.t)]++; o.goalsAgainstBins[binOf(e.t)]++; }
          break;
        }
      }
    }
  }
  return T;
}

const METRICS = {
  passes: { label: "passes per match", f: (s) => s.passes / s.matches },
  passPct: { label: "pass completion", f: (s) => (s.passes ? s.passOk / s.passes : null), pct: true },
  directness: { label: "progressive share of completed passes", f: (s) => (s.passOk ? s.prog / s.passOk : null), pct: true },
  pressures: { label: "pressures per match", f: (s) => s.pressures / s.matches },
  highPress: { label: "share of pressures in the attacking 40%", f: (s) => (s.pressures ? s.highPress / s.pressures : null), pct: true },
  dribbles: { label: "dribbles per match", f: (s) => s.dribbles / s.matches },
  shots: { label: "shots per match", f: (s) => s.shots / s.matches },
  xgPerShot: { label: "xG per shot", f: (s) => (s.shots ? s.xgf / s.shots : null) },
  xgf: { label: "xG for per match", f: (s) => s.xgf / s.matches },
  xga: { label: "xG against per match", f: (s) => s.xga / s.matches },
  aerialPct: { label: "aerial duels won", f: (s) => (s.aerialAtt >= 10 ? s.aerialOk / s.aerialAtt : null), pct: true },
  fouls: { label: "fouls per match", f: (s) => s.fouls / s.matches },
  turnovers: { label: "turnovers per match", f: (s) => s.turnovers / s.matches },
};

function leagueContext(T) {
  const ctx = {};
  for (const [k, def] of Object.entries(METRICS)) {
    const xs = [...T.values()].map(def.f).filter((v) => v != null && Number.isFinite(v));
    const mean = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    const sd = xs.length ? Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length) : 0;
    ctx[k] = { mean, sd, n: xs.length };
  }
  return ctx;
}

const fmt = (k, v) => (v == null ? "—" : METRICS[k].pct ? pctS(v) : r2(v));

// Full scouting report on `team`. opts.us = your team's name (tailors the advice).
function scoutTeam(matches, team, opts = {}) {
  const ms = matches.filter((m) => m.sport === "soccer");
  if (!ms.some((m) => m.home === team || m.away === team)) throw new Error(`no soccer matches for "${team}"`);
  const T = teamStats(ms);
  const s = T.get(team);
  const ctx = leagueContext(T);
  const metrics = {};
  for (const [k, def] of Object.entries(METRICS)) {
    const v = def.f(s); const c = ctx[k];
    metrics[k] = { label: def.label, value: v == null ? null : r2(v), league: r2(c.mean), z: v == null || c.sd < 1e-9 || c.n < 4 ? null : r2((v - c.mean) / c.sd), display: fmt(k, v), leagueDisplay: fmt(k, c.mean) };
  }
  const z = (k) => metrics[k].z;

  const style = [];
  const trait = (k, hiText, loText) => { const v = z(k); if (v == null) return; if (v >= 0.8 && hiText) style.push({ trait: hiText, metric: k, z: v }); if (v <= -0.8 && loText) style.push({ trait: loText, metric: k, z: v }); };
  trait("passes", "Possession-based", "Low possession / reactive");
  trait("directness", "Direct: goes forward quickly", "Patient build-up");
  trait("pressures", "Intense pressing", "Passive without the ball");
  trait("highPress", "Presses high up the pitch", "Drops into a low block");
  trait("dribbles", "Dribble-heavy", null);
  trait("xgPerShot", "Works the ball into high-quality chances", "Settles for low-quality shots");
  trait("shots", "High shot volume", "Few shots");
  trait("xga", "Leaky: concedes lots of xG", "Tight defence: concedes little xG");
  trait("aerialPct", "Strong in the air", "Weak in the air");
  trait("fouls", "Fouls a lot", null);

  const profiles = buildProfiles(ms, { team, halfLifeDays: opts.halfLifeDays });
  const pOpp = opts.us ? buildProfiles(ms, { team: opts.us, halfLifeDays: opts.halfLifeDays }) : [];
  const regular = profiles.filter((p) => p.starts >= Math.max(1, s.matches * 0.4));

  // attack: channels + dependency
  const chanShare = s.locatedXgf >= 2 ? Object.fromEntries(Object.entries(s.xgByChannel).map(([k, v]) => [k, r2(v / s.locatedXgf)])) : null;
  const chanceValue = (p) => (p.stats.xg || 0) + 0.1 * (p.stats.key_pass || 0);
  const totalCV = profiles.reduce((a, p) => a + chanceValue(p), 0);
  const creators = profiles.map((p) => ({ player: p.player, position: p.position, share: totalCV ? r2(chanceValue(p) / totalCV) : 0, xg: r2(p.stats.xg || 0), keyPasses: p.stats.key_pass || 0, goals: p.stats.goal || 0 }))
    .sort((a, b) => b.share - a.share).slice(0, 5);

  // defence: flank leaks + who gets beaten
  const concededShare = s.locatedXga >= 2 ? Object.fromEntries(Object.entries(s.concededByFlank).map(([k, v]) => [k, r2(v / s.locatedXga)])) : null;
  const beaten = profiles.filter((p) => p.position !== "GK" && p.minutes >= 90)
    .map((p) => ({ player: p.player, position: p.position, channel: p.zone ? p.zone.channel : null, dribbledPastPer90: r2((p.stats.dribbled_past || 0) / p.minutes * 90), duels: p.attributes.duels }))
    .sort((a, b) => b.dribbledPastPer90 - a.dribbledPastPer90).slice(0, 4);

  // timing
  const gaTot = s.goalsAgainstBins.reduce((a, b) => a + b, 0), gfTot = s.goalsForBins.reduce((a, b) => a + b, 0);
  let lgLate = 0, lgTot = 0; for (const t of T.values()) { lgLate += t.goalsAgainstBins[5]; lgTot += t.goalsAgainstBins.reduce((a, b) => a + b, 0); }
  const timing = { bins: BINS, goalsFor: s.goalsForBins, goalsAgainst: s.goalsAgainstBins,
    lateConcededShare: gaTot ? r2(s.goalsAgainstBins[5] / gaTot) : null, lateScoredShare: gfTot ? r2(s.goalsForBins[5] / gfTot) : null,
    leagueLateShare: lgTot ? r2(lgLate / lgTot) : null };

  const keyThreats = [...profiles].filter((p) => p.minutes >= 90).sort((a, b) => (b.overall + (b.form.trend || 0) * 5) - (a.overall + (a.form.trend || 0) * 5)).slice(0, 3).map(slimProfile);

  const weakLinks = [];
  for (const p of regular) {
    const reasons = [];
    for (const w of p.weaknesses) {
      if (p.position === "GK" && w.attribute !== "goalkeeping") continue;
      // judge each line only on its own duties (a winger isn't a weak link for not tackling)
      const duties = { DF: ["defending", "duels", "aerial", "passing"], MF: ["duels", "passing"] }[p.position] || [];
      if (duties.includes(w.attribute)) reasons.push({ what: `${w.attribute} ${w.value}`, evidence: w.evidence, weight: 50 - w.value });
      if (p.position === "GK" && w.attribute === "goalkeeping") reasons.push({ what: `goalkeeping ${w.value}`, evidence: w.evidence, weight: 50 - w.value });
    }
    if (p.fatigue && p.fatigue.label === "fades late") reasons.push({ what: "fades late", evidence: p.fatigue.summary, weight: 10 });
    if (p.form.label === "out of form") reasons.push({ what: "out of form", evidence: `last ${3}: ${p.form.recent}/10 vs season ${p.form.season}/10`, weight: 8 });
    if (reasons.length) weakLinks.push({ player: p.player, position: p.position, zone: p.zone ? p.zone.summary : null, channel: p.zone ? p.zone.channel : null,
      reasons: reasons.sort((a, b) => b.weight - a.weight), severity: reasons.reduce((a, r) => a + r.weight, 0), howToExploit: p.howToExploit });
  }
  weakLinks.sort((a, b) => b.severity - a.severity);

  const formation = Object.entries(s.formations).sort((a, b) => b[1] - a[1])[0];
  const report = {
    team, matches: s.matches, record: { W: s.W, D: s.D, L: s.L },
    perMatch: { goalsFor: r2(s.gf / s.matches), goalsAgainst: r2(s.ga / s.matches), xgFor: r2(s.xgf / s.matches), xgAgainst: r2(s.xga / s.matches) },
    formation: formation ? { shape: formation[0], used: formation[1] } : null,
    style, metrics, attack: { channels: chanShare, creators, dependency: creators[0] || null },
    defense: { concededByFlank: concededShare, beaten, aerialPct: metrics.aerialPct.display },
    timing, keyThreats, weakLinks: weakLinks.slice(0, 5),
    confidence: s.matches >= 5 ? "ok" : s.matches >= 3 ? "low" : "very low",
    attribution: ms.some((m) => m.source && m.source.attribution) ? ms.find((m) => m.source && m.source.attribution).source.attribution : undefined,
  };
  report.recommendations = recommend(report, profiles, pOpp);
  return report;
}

function slimProfile(p) {
  return { player: p.player, position: p.position, overall: p.overall, archetypes: p.archetypes, verdict: p.verdict, form: p.form,
    strengths: p.strengths, weaknesses: p.weaknesses, zone: p.zone ? p.zone.summary : null, howToPlayAgainst: p.howToPlayAgainst,
    last5: p.matchRatings.slice(-5).map((m) => m.rating) };
}

// Ranked, evidence-backed recommendations. `ours` = profiles of your squad (optional).
function recommend(R, profiles, ours) {
  const recs = [];
  const add = (priority, title, detail, evidence) => recs.push({ priority: Math.round(priority), title, detail, evidence });
  const best = (attr, filter = () => true, n = 2) => ours.filter((p) => p.attributes[attr] != null && p.minutes >= 90 && filter(p))
    .sort((a, b) => b.attributes[attr] - a.attributes[attr]).slice(0, n).map((p) => `${p.player} (${attr} ${p.attributes[attr]})`);
  const m = R.metrics;

  if (R.defense.concededByFlank) {
    const [flank, share] = Object.entries(R.defense.concededByFlank).filter(([k]) => k !== "C").sort((a, b) => b[1] - a[1])[0];
    if (share >= 0.4) {
      const defender = R.weakLinks.find((w) => w.channel === flank && w.position === "DF");
      const ourSide = MIRROR[flank];
      const attackers = best("dribbling", (p) => p.zone && p.zone.channel === ourSide && p.position !== "GK");
      add(60 + (share - 0.33) * 200, `Attack down their ${FLANK[flank]} side`,
        `${pctS(share)} of the xG they concede comes down their ${FLANK[flank]} flank (an even split is 33%).` +
        (defender ? ` Weak link there: ${defender.player} (${defender.reasons[0].what}).` : "") +
        (attackers.length ? ` Overload it through your ${FLANK[ourSide]} side: ${attackers.join(", ")}.` : ""),
        { concededByFlank: R.defense.concededByFlank });
    }
  }
  const dep = R.attack.dependency;
  if (dep && dep.share >= 0.25) {
    const kt = R.keyThreats.find((k) => k.player === dep.player);
    add(55 + dep.share * 100, `Neutralise ${dep.player}`, `${pctS(dep.share)} of their chance creation (xG + key passes) runs through this player: ${dep.xg} xG, ${dep.keyPasses} key passes, ${dep.goals} goals. ` +
      (kt && kt.howToPlayAgainst.length ? kt.howToPlayAgainst[0] : ""), { dependency: dep });
  }
  const top = R.keyThreats[0];
  if (top && top.howToPlayAgainst.length && !(dep && dep.share >= 0.25 && dep.player === top.player)) {
    add(50, `Plan for ${top.player} (${top.position}, ${top.overall})`, `${top.verdict}. ${top.zone ? `Operates ${top.zone}. ` : ""}${top.howToPlayAgainst[0]}`, { threat: top.player });
  }
  if ((m.pressures.z ?? 0) >= 0.8 || (m.highPress.z ?? 0) >= 0.8) {
    const outlets = best("progression", (p) => p.position === "DF" || p.position === "GK" || p.position === "MF");
    add(45 + 10 * Math.max(m.pressures.z || 0, m.highPress.z || 0), "Beat the press with quick vertical passing",
      `They make ${m.pressures.display} pressures a match (league ${m.pressures.leagueDisplay}), ${m.highPress.display} of them high up the pitch. Bypass the first line with early vertical passes and third-man runs, and use the space behind their press.` +
      (outlets.length ? ` Route build-up through ${outlets.join(", ")}.` : ""), { pressures: m.pressures, highPress: m.highPress });
  } else if ((m.pressures.z ?? 0) <= -0.8) {
    add(35, "They sit off: keep the ball and overload", `Only ${m.pressures.display} pressures a match (league ${m.pressures.leagueDisplay}). Build patiently and draw them out. Overload one side, then switch play.`, { pressures: m.pressures });
  }
  if ((m.passes.z ?? 0) >= 0.8) {
    add(40, "Compact mid-block, then counter", `They build through possession (${m.passes.display} passes a match, league ${m.passes.leagueDisplay}) but turn it over ${m.turnovers.display} times a match. Stay compact centrally and break fast into the space behind their full-backs.`, { passes: m.passes, turnovers: m.turnovers });
  }
  if ((m.directness.z ?? 0) >= 0.8) {
    const aerial = best("aerial", (p) => p.position === "DF");
    add(38, "Win the first and second balls", `They play forward quickly (${m.directness.display} of completed passes are progressive, league ${m.directness.leagueDisplay}). Defend the first contact and crowd the landing zone.` + (aerial.length ? ` Aerial leaders: ${aerial.join(", ")}.` : ""), { directness: m.directness });
  }
  if ((m.aerialPct.z ?? 0) <= -0.8) {
    add(42, "Go aerial: crosses and set pieces", `They win only ${m.aerialPct.display} of aerial duels (league ${m.aerialPct.leagueDisplay}).`, { aerialPct: m.aerialPct });
  }
  const t = R.timing;
  if (t.lateConcededShare != null && t.leagueLateShare != null && t.lateConcededShare >= Math.max(0.3, t.leagueLateShare + 0.1) && t.goalsAgainst.reduce((a, b) => a + b, 0) >= 3) {
    add(44, "They crack late: save your attacking subs for 60–75'", `${pctS(t.lateConcededShare)} of the goals they concede come after 75' (league ${pctS(t.leagueLateShare)}). Keep the pace high and send on fresh attackers for the last 20 minutes.`, { timing: t });
  }
  if (t.lateScoredShare != null && t.leagueLateShare != null && t.lateScoredShare >= Math.max(0.3, t.leagueLateShare + 0.1) && t.goalsFor.reduce((a, b) => a + b, 0) >= 3) {
    add(36, "They finish strong: protect a lead actively", `${pctS(t.lateScoredShare)} of their goals come after 75'. Don't drop too deep late. Bring on fresh defensive legs around 70'.`, { timing: t });
  }
  if ((m.xgPerShot.z ?? 0) >= 0.8) add(37, "Protect the box and the cut-back zone", `They generate ${m.xgPerShot.display} xG per shot (league ${m.xgPerShot.leagueDisplay}): few speculative efforts, lots of clear chances. Keep bodies between the ball and the penalty spot.`, { xgPerShot: m.xgPerShot });
  else if ((m.xgPerShot.z ?? 0) <= -0.8 && (m.shots.z ?? 0) >= 0) add(30, "Let them shoot from distance", `Only ${m.xgPerShot.display} xG per shot (league ${m.xgPerShot.leagueDisplay}). Hold the box rather than diving into blocks outside it.`, { xgPerShot: m.xgPerShot });
  if ((m.fouls.z ?? 0) >= 0.8) add(30, "Draw fouls in dangerous areas", `They commit ${m.fouls.display} fouls a match (league ${m.fouls.leagueDisplay}). Run at them around the box and prepare set pieces.`, { fouls: m.fouls });
  for (const w of R.weakLinks.slice(0, 3)) {
    // skip a tip that just restates the first reason (e.g. "out of form")
    const tip = (w.howToExploit || []).find((t) => !t.toLowerCase().startsWith(w.reasons[0].what.split(" ")[0].toLowerCase())) || "";
    add(30 + Math.min(25, w.severity / 2), `Target ${w.player} (${w.position}${w.zone ? `, ${w.zone}` : ""})`, `${w.reasons.map((r) => `${r.what}: ${r.evidence}`).join(" · ")}. ${tip}`, { weakLink: w.player });
  }
  if (R.confidence !== "ok") add(99, `Low confidence: only ${R.matches} matches of ${R.team}`, "Treat the patterns below as leads to check on video, not conclusions.", { matches: R.matches });
  return recs.sort((a, b) => b.priority - a.priority);
}

module.exports = { scoutTeam, teamStats, leagueContext, METRICS };
