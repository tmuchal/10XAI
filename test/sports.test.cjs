const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const { normalizeMatch, parseEventsCsv } = require("../lib/sports/events.cjs");
const { computeRatings } = require("../lib/sports/ratings.cjs");
const { predictMatch, backtest } = require("../lib/sports/predict.cjs");
const { heuristicExtract } = require("../lib/sports/commentary.cjs");
const yt = require("../lib/sports/youtube.cjs");
const { generateLeague } = require("../examples/sports/generate.cjs");

const league = (sport, seed = 7) => { const L = generateLeague(sport, seed); return { ...L, matches: L.matches.map((m) => normalizeMatch(m).match) }; };
function corr(xs, ys) {
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let n = 0, a = 0, b = 0;
  for (let i = 0; i < xs.length; i++) { n += (xs[i] - mx) * (ys[i] - my); a += (xs[i] - mx) ** 2; b += (ys[i] - my) ** 2; }
  return n / Math.sqrt(a * b);
}

test("normalizeMatch: goal sugar, team resolution, score derivation, bad events dropped", () => {
  const { match, warnings } = normalizeMatch({
    sport: "soccer", home: "Reds", away: "Blues", date: "2026-03-01",
    events: [
      { team: "Reds", player: "A", type: "goal" },
      { team: "away", player: "B", type: "shot", outcome: "saved" },
      { team: "Greens", player: "C", type: "pass" },
      { team: "home", player: "A", type: "moonwalk" },
    ],
  });
  assert.deepEqual(match.events[0], { t: null, team: "home", player: "A", type: "shot", outcome: "goal" });
  assert.equal(match.events[1].outcome, "on_target");
  assert.equal(match.events.length, 2);
  assert.deepEqual(match.score, { home: 1, away: 0 });
  assert.equal(match.lineups.home[0].inferred, true);
  assert.equal(warnings.filter((w) => /dropped/.test(w)).length, 2);
});

test("parseEventsCsv handles quotes", () => {
  const rows = parseEventsCsv('t,team,player,type,outcome\n12:30,home,"Kim, Min-jae",tackle,won\n');
  assert.equal(rows[0].player, "Kim, Min-jae");
  const { match } = normalizeMatch({ sport: "soccer", home: "H", away: "A", events: rows });
  assert.equal(match.events[0].t, 750);
  assert.equal(match.events[0].outcome, "success");
});

test("ratings recover hidden player skills (soccer)", () => {
  const L = league("soccer");
  const truth = new Map(); L.teams.forEach((t) => t.players.forEach((p) => truth.set(p.player, p.skill)));
  const rows = computeRatings(L.matches, { sport: "soccer" });
  for (const [attr, key, min] of [["passing", "pass", 0.8], ["dribbling", "dribble", 0.5], ["defending", "defend", 0.35]]) {
    const rs = rows.filter((r) => r.attributes[attr] != null);
    const c = corr(rs.map((r) => r.attributes[attr]), rs.map((r) => truth.get(r.player)[key]));
    assert.ok(c > min, `${attr} correlation ${c.toFixed(2)} should exceed ${min}`);
  }
  for (const r of rows) for (const v of Object.values(r.attributes)) if (v != null) assert.ok(v >= 1 && v <= 99);
});

test("ratings recover hidden player skills (basketball)", () => {
  const L = league("basketball");
  const truth = new Map(); L.teams.forEach((t) => t.players.forEach((p) => truth.set(p.player, p.skill)));
  const rows = computeRatings(L.matches, { sport: "basketball" });
  const c = corr(rows.map((r) => r.attributes.rebounding), rows.map((r) => truth.get(r.player).rebound));
  assert.ok(c > 0.6, `rebounding correlation ${c.toFixed(2)}`);
});

test("soccer prediction: probabilities sum to 1 and a stronger lineup raises win chance", () => {
  const L = league("soccer");
  const [h, a] = [L.teams[0], L.teams[1]];
  const base = predictMatch(L.matches, { sport: "soccer", home: h.name, away: a.name });
  const s = base.probabilities.home + base.probabilities.draw + base.probabilities.away;
  assert.ok(Math.abs(s - 1) < 0.005);
  assert.equal(base.likelyScores.length, 5);
  // swap the home side's most productive forward for the weakest bench forward → lower home win probability
  const LM = require("../lib/sports/lineup-model.cjs");
  const model = LM.buildPlayerModel(L.matches);
  const usual = LM.usualLineup(h.name, model);
  const fws = [...model.values()].filter((p) => p.team === h.name && p.position === "FW").sort((x, y) => y.off90 - x.off90);
  const star = fws[0].player, sub = fws[fws.length - 1].player;
  assert.ok(usual.some((p) => p.player === star) && !usual.some((p) => p.player === sub));
  const weakened = predictMatch(L.matches, { sport: "soccer", home: h.name, away: a.name,
    lineups: { home: usual.map((p) => (p.player === star ? { player: sub, minutes: 90 } : p)) } });
  assert.ok(weakened.lineupEffect.homeGoalsMult < 1);
  assert.ok(weakened.probabilities.home < base.probabilities.home);
});

test("backtest: model beats the no-skill baseline on both sports", () => {
  for (const sport of ["soccer", "basketball"]) {
    const L = league(sport, 11);
    const b = backtest(L.matches, sport);
    assert.ok(b.n > 50);
    assert.ok(b.model.brier < b.baseline.brier, `${sport} brier ${b.model.brier} vs baseline ${b.baseline.brier}`);
  }
});

test("heuristic commentary extraction (English + Korean, soccer)", () => {
  const roster = { home: ["Son Heung-min", "James Maddison", "Guglielmo Vicario"], away: ["Erling Haaland", "Kevin De Bruyne", "Ederson"] };
  const text = [
    "12:04 Maddison slides it through for Son Heung-min who scores! What a finish.",
    "30:15 Haaland shoots, but Vicario saves.",
    "41:00 De Bruyne is booked.",
    "55:20 손흥민 드리블로 제치고 슈팅, 빗나갑니다.",
  ].join("\n");
  const r = heuristicExtract(text, { sport: "soccer", roster: { ...roster, home: [...roster.home, "손흥민"] } });
  const find = (type, player) => r.events.find((e) => e.type === type && e.player === player);
  assert.equal(find("shot", "Son Heung-min").outcome, "goal");
  assert.ok(find("assist", "James Maddison"));
  assert.equal(find("shot", "Erling Haaland").outcome, "on_target");
  assert.equal(find("save", "Guglielmo Vicario").team, "home");
  assert.equal(find("card", "Kevin De Bruyne").outcome, "yellow");
  assert.equal(find("dribble", "손흥민").outcome, "success");
  assert.equal(find("shot", "손흥민").outcome, "off_target");
  assert.equal(find("shot", "Son Heung-min").t, "12:04");
});

test("heuristic commentary extraction (basketball)", () => {
  const roster = { home: ["Stephen Curry", "Draymond Green"], away: ["LeBron James", "Anthony Davis"] };
  const text = "Green finds Curry for three... bang! Davis with the block. LeBron James misses the layup, Davis grabs the offensive rebound. Curry makes both free throws.";
  const r = heuristicExtract(text, { sport: "basketball", roster });
  const ev = (type, player) => r.events.filter((e) => e.type === type && e.player === player);
  assert.equal(ev("fg3", "Stephen Curry")[0].outcome, "made");
  assert.equal(ev("assist", "Draymond Green").length, 1);
  assert.equal(ev("block", "Anthony Davis").length, 1);
  assert.equal(ev("fg2", "LeBron James")[0].outcome, "missed");
  assert.equal(ev("rebound", "Anthony Davis")[0].outcome, "offensive");
  assert.equal(ev("ft", "Stephen Curry").length, 2);
});

test("youtube: id parsing, title parsing, and risky steps are gated", () => {
  for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"])
    assert.equal(yt.parseVideoId(u), "dQw4w9WgXcQ");
  assert.equal(yt.parseVideoId("https://example.com/watch?v=dQw4w9WgXcQ"), null);
  assert.deepEqual(yt.parseTitle("Lakers 112-108 Celtics | NBA Highlights"), { sport: "basketball", home: "Lakers", away: "Celtics", score: { home: 112, away: 108 } });
  const t = yt.parseTitle("Tottenham vs Man City | Premier League Highlights");
  assert.equal(t.sport, "soccer"); assert.equal(t.home, "Tottenham"); assert.equal(t.away, "Man City");
  const plan = yt.acquisitionPlan("dQw4w9WgXcQ", null);
  assert.ok(plan.filter((s) => /download/i.test(s.key)).every((s) => s.risk.score >= 70));
  const r = yt.download("dQw4w9WgXcQ", { workspace: os.tmpdir() });
  assert.equal(r.gated, true);
});

test("routes: store → players → predict → backtest over HTTP", async () => {
  process.env.SPORTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sports-"));
  const { createRoutes } = require("../lib/sports/routes.cjs");
  const created = [];
  const handle = createRoutes({ createTask: (t) => { created.push(t); return { id: String(created.length) }; } });
  const server = http.createServer(async (req, res) => { if (!(await handle(req, res))) { res.writeHead(404); res.end(); } });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, p, body) => { const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json() }; };
  try {
    const L = generateLeague("basketball", 3, { teams: 4, rounds: 2 });
    for (const m of L.matches) assert.equal((await call("POST", "/api/sports/matches", m)).status, 201);
    const list = await call("GET", "/api/sports/matches?sport=basketball");
    assert.equal(list.json.length, L.matches.length);
    const players = await call("GET", `/api/sports/players?sport=basketball&team=${encodeURIComponent(L.teams[0].name)}`);
    assert.equal(players.json.length, 8);
    const pred = await call("POST", "/api/sports/predict", { sport: "basketball", home: L.teams[0].name, away: L.teams[1].name });
    assert.ok(pred.json.probabilities.home > 0 && pred.json.probabilities.home < 1);
    const bt = await call("GET", "/api/sports/backtest?sport=basketball");
    assert.ok(bt.json.n > 0);
    const dl = await call("POST", "/api/sports/youtube/download", { videoId: "dQw4w9WgXcQ" });
    assert.equal(dl.status, 403);
    const bad = await call("POST", "/api/sports/predict", { sport: "cricket", home: "a", away: "b" });
    assert.equal(bad.status, 400);
  } finally { server.close(); }
});

// ── scouting & tactics ────────────────────────────────────────────────────────
const sb = require("../lib/sports/importers/statsbomb.cjs");
const { buildUpChannel } = require("../lib/sports/channels.cjs");
const { teamStats, scoutTeam } = require("../lib/sports/scout.cjs");
const { buildProfiles } = require("../lib/sports/profile.cjs");
const LMod = require("../lib/sports/lineup-model.cjs");
const tactics = require("../lib/sports/tactics.cjs");
const { matchState } = require("../lib/sports/predict.cjs");

test("statsbomb: lineups, subs, goals with xG, assists, nicknames, no shootout", () => {
  const P = (id, name) => ({ id, name });
  const xi = (team, names) => ({ type: { name: "Starting XI" }, period: 1, minute: 0, second: 0, team: { name: team },
    tactics: { lineup: names.map(([n, pos]) => ({ player: P(1, n), position: { name: pos } })) } });
  const ev = (o) => Object.assign({ period: 1, second: 0 }, o);
  const events = [
    xi("Reds", [["Keeper Full Name", "Goalkeeper"], ["Back Full Name", "Left Back"], ["Striker Full Name", "Center Forward"]]),
    xi("Blues", [["Blue Keeper", "Goalkeeper"], ["Blue Mid", "Center Midfield"]]),
    ev({ type: { name: "Pass" }, minute: 10, team: { name: "Reds" }, player: P(2, "Back Full Name"), position: { name: "Left Back" }, location: [60, 5], pass: { end_location: [100, 30], goal_assist: true, recipient: P(3, "Striker Full Name") } }),
    ev({ type: { name: "Shot" }, minute: 10, second: 3, team: { name: "Reds" }, player: P(3, "Striker Full Name"), position: { name: "Center Forward" }, location: [108, 40], shot: { statsbomb_xg: 0.41, outcome: { name: "Goal" } } }),
    ev({ type: { name: "Substitution" }, minute: 70, team: { name: "Blues" }, player: P(4, "Blue Mid"), position: { name: "Center Midfield" }, substitution: { replacement: P(5, "Blue Sub") } }),
    ev({ type: { name: "Shot" }, period: 5, minute: 121, team: { name: "Blues" }, player: P(5, "Blue Sub"), location: [108, 40], shot: { type: { name: "Penalty" }, statsbomb_xg: 0.78, outcome: { name: "Goal" } } }),
  ];
  const info = { match_id: 1, match_date: "2024-01-01", home_team: { home_team_name: "Reds" }, away_team: { away_team_name: "Blues" }, home_score: 1, away_score: 0 };
  const lineupsFile = [{ lineup: [{ player_name: "Striker Full Name", player_nickname: "Striker" }] }];
  const { match } = normalizeMatch(sb.toMatch(events, info, lineupsFile));
  assert.deepEqual(match.score, { home: 1, away: 0 });
  const goal = match.events.find((e) => e.type === "shot");
  assert.equal(goal.player, "Striker"); assert.equal(goal.outcome, "goal"); assert.equal(goal.xg, 0.41);
  assert.ok(match.events.some((e) => e.type === "assist" && e.player === "Back Full Name"));
  assert.ok(!match.events.some((e) => e.player === "Blue Sub" && e.type === "shot"), "shootout penalties are excluded");
  const sub = match.lineups.away.find((p) => p.player === "Blue Sub");
  assert.equal(sub.on, 70); assert.equal(sub.starter, false);
  assert.equal(match.lineups.away.find((p) => p.player === "Blue Mid").off, 70);
  assert.equal(match.lineups.home.find((p) => p.player === "Back Full Name").position, "DF");
});

test("build-up channel: a central shot after a wide cross is credited to that flank", () => {
  const evs = [{ t: 100, team: "home", type: "pass", x: 85, y: 92 }, { t: 104, team: "home", type: "shot", x: 92, y: 50 }];
  assert.equal(buildUpChannel(evs, 1), "R");
  const stale = [{ t: 60, team: "home", type: "pass", x: 85, y: 92 }, { t: 104, team: "home", type: "shot", x: 92, y: 50 }];
  assert.equal(buildUpChannel(stale, 1), "C");
});

test("scouting finds the weaker defensive flank (simulated ground truth)", () => {
  const xs = [], ys = [];
  for (const seed of [42, 7]) {
    const L = league("soccer", seed);
    const T = teamStats(L.matches);
    for (const t of L.teams) {
      const w = {};
      for (const f of ["L", "R"]) { const ps = t.players.filter((p) => p.role === "starter" && p.side === f && (p.position === "DF" || p.position === "MF")); w[f] = ps.reduce((a, p) => a + p.skill.defend, 0) / ps.length; }
      const s = T.get(t.name);
      xs.push(w.L - w.R); ys.push((s.concededByFlank.R - s.concededByFlank.L) / s.locatedXga);
    }
  }
  const c = corr(xs, ys);
  assert.ok(c > 0.4, `flank correlation ${c.toFixed(2)}`);
});

test("scouting report: evidence-backed recommendations and profiles", () => {
  const L = league("soccer", 42);
  const R = scoutTeam(L.matches, L.teams[0].name, { us: L.teams[1].name });
  assert.ok(R.recommendations.length >= 2);
  for (const r of R.recommendations) assert.ok(/\d/.test(r.detail), `recommendation without a number: ${r.title}`);
  assert.equal(R.keyThreats.length, 3);
  const ps = buildProfiles(L.matches, { team: L.teams[0].name });
  for (const p of ps) { assert.ok(p.archetypes.length >= 1); assert.ok(p.verdict); assert.ok(Array.isArray(p.howToPlayAgainst)); }
});

test("fatigue: measured fade tracks the hidden stamina of simulated players", () => {
  const xs = [], ys = [];
  for (const seed of [7, 11]) {
    const L = league("soccer", seed);
    const truth = new Map(); L.teams.forEach((t) => t.players.forEach((p) => truth.set(p.player, p)));
    for (const p of LMod.buildPlayerModel(L.matches).values()) if (p.position !== "GK" && p.success.lateActions >= 20) { xs.push(p.fade); ys.push(-truth.get(p.player).fade); }
  }
  const c = corr(xs, ys);
  assert.ok(c > 0.1, `fade correlation ${c.toFixed(2)}`);
});

test("match state: live score + remaining time", () => {
  const done = matchState(1.5, 1.2, { home: 2, away: 0 }, 0);
  assert.equal(done.probabilities.home, 1);
  const late = matchState(1.5, 1.2, { home: 0, away: 1 }, 0.1);
  assert.ok(late.probabilities.away > 0.7);
});

test("best XI respects the formation and unavailable players", () => {
  const L = league("soccer", 42);
  const us = L.teams[0].name, them = L.teams[1].name;
  const model = LMod.buildPlayerModel(L.matches);
  const star = [...model.values()].filter((p) => p.team === us && p.position === "FW").sort((a, b) => b.off90 - a.off90)[0].player;
  const r = tactics.bestLineup(L.matches, { us, them, formation: "4-4-2", unavailable: [star] });
  const xi = r.recommended.xi;
  assert.equal(xi.length, 11);
  const n = (l) => xi.filter((p) => p.position === l).length;
  assert.deepEqual([n("GK"), n("DF"), n("MF"), n("FW")], [1, 4, 4, 2]);
  assert.ok(!xi.some((p) => p.player === star));
  const s = r.recommended.eval; assert.ok(Math.abs(s.win + s.draw + s.loss - 1) < 0.01);
});

test("substitution planner: trailing late, the attacking option raises our xG; advice never lowers the objective", () => {
  const L = league("soccer", 42);
  const us = L.teams[0].name, them = L.teams[1].name;
  const P = tactics.planSubstitutions(L.matches, { us, them, minute: 80, score: { us: 0, them: 1 } });
  assert.equal(P.state, "trailing");
  assert.ok(P.posture.attack.eval.xgFor >= P.current.xgFor);
  if (P.recommendation) assert.ok(P.recommendation.gain > 0);
  for (const o of P.options) assert.ok(o.subs.every((s) => s.why.length > 0));
  assert.throws(() => tactics.planSubstitutions(L.matches, { us, them: us, minute: 60 }));
});
