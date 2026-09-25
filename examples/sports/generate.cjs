#!/usr/bin/env node
// Synthetic league generator for demos and tests — FICTIONAL teams and players.
//
// Each player has hidden "true" skills; matches are simulated from them. Because
// the ground truth is known, this is how we check that the ratings recover real
// skill and that predictions beat a no-skill baseline (see test/sports.test.cjs).
//
//   node examples/sports/generate.cjs soccer 42 > soccer.json
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const FIRST = ["Alex", "Ben", "Carlos", "Dani", "Eli", "Femi", "Gabe", "Hugo", "Ivan", "Jae", "Kai", "Luca", "Milo", "Noah", "Omar", "Paulo", "Quinn", "Rafa", "Sami", "Theo", "Umar", "Vic", "Wes", "Yuki", "Zane"];
const LAST = ["Adler", "Brandt", "Costa", "Doyle", "Eriksen", "Ferro", "Galli", "Holm", "Ibarra", "Jansen", "Kowal", "Lindqvist", "Moreau", "Novak", "Okafor", "Petit", "Quiroga", "Rossi", "Sato", "Tamm", "Urban", "Vidal", "Weber", "Yilmaz", "Zoric"];
const CITIES = ["Northbay", "Eastvale", "Redhill", "Stonebridge", "Lakemont", "Westford", "Kingsport", "Ashdown"];

function poissonDraw(r, l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
function pickW(r, items, w) { const tot = w.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; }

function makeTeams(r, sport, nTeams) {
  const used = new Set();
  const name = () => { let n; do n = FIRST[Math.floor(r() * FIRST.length)] + " " + LAST[Math.floor(r() * LAST.length)]; while (used.has(n)); used.add(n); return n; };
  return CITIES.slice(0, nTeams).map((city, ti) => {
    const quality = (r() - 0.5) * 1.2; // team-level talent spread
    const size = sport === "soccer" ? 11 : 8;
    const players = Array.from({ length: size }, (_, i) => {
      const s = () => Math.max(0.05, Math.min(0.95, 0.5 + quality * 0.35 + (r() - 0.5) * 0.5));
      const role = sport === "soccer" ? (i === 0 ? "GK" : i <= 4 ? "DF" : i <= 8 ? "MF" : "FW") : i < 5 ? "starter" : "bench";
      return { player: name(), role, skill: { pass: s(), shoot: s(), dribble: s(), defend: s(), rebound: s() } };
    });
    return { name: city + (sport === "soccer" ? " FC" : " Hawks".replace("Hawks", ["Hawks", "Bears", "Owls", "Foxes", "Wolves", "Stags", "Rams", "Kites"][ti])), players };
  });
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function simSoccer(r, home, away, date, id) {
  const events = [];
  const side = (t, s, opp) => {
    const outfield = t.players.filter((p) => p.role !== "GK");
    const atk = avg(outfield.map((p) => (p.skill.shoot + p.skill.pass + p.skill.dribble) / 3));
    const def = avg(opp.players.filter((p) => p.role !== "GK").map((p) => p.skill.defend));
    const gk = opp.players.find((p) => p.role === "GK");
    const shots = poissonDraw(r, 11 * Math.exp(1.6 * (atk - def)) * (s === "home" ? 1.1 : 1));
    for (const p of outfield) {
      const n = 25 + Math.floor(r() * 20);
      for (let i = 0; i < n; i++) events.push({ team: s, player: p.player, type: "pass", outcome: r() < 0.62 + 0.3 * p.skill.pass ? "success" : "fail" });
      const nd = poissonDraw(r, p.role === "FW" || p.role === "MF" ? 2 * p.skill.dribble + 0.3 : 0.4);
      for (let i = 0; i < nd; i++) events.push({ team: s, player: p.player, type: "dribble", outcome: r() < 0.25 + 0.6 * p.skill.dribble ? "success" : "fail" });
    }
    for (const p of opp.players.filter((q) => q.role !== "GK")) {
      const nt = poissonDraw(r, (p.role === "DF" ? 3 : p.role === "MF" ? 2 : 0.6) * (0.5 + p.skill.defend));
      for (let i = 0; i < nt; i++) events.push({ team: s === "home" ? "away" : "home", player: p.player, type: "tackle", outcome: r() < 0.3 + 0.6 * p.skill.defend ? "success" : "fail" });
      const ni = poissonDraw(r, (p.role === "DF" ? 1.5 : 0.8) * p.skill.defend);
      for (let i = 0; i < ni; i++) events.push({ team: s === "home" ? "away" : "home", player: p.player, type: "interception" });
    }
    for (let i = 0; i < shots; i++) {
      const shooter = pickW(r, outfield, outfield.map((p) => (p.role === "FW" ? 4 : p.role === "MF" ? 2 : 0.5) * (0.3 + p.skill.shoot)));
      const creator = pickW(r, outfield.filter((p) => p !== shooter), outfield.filter((p) => p !== shooter).map((p) => 0.2 + p.skill.pass));
      const onT = r() < 0.2 + 0.4 * shooter.skill.shoot;
      const goal = onT && r() < 0.2 + 0.35 * shooter.skill.shoot - 0.25 * (gk.skill.defend - 0.5);
      if (r() < 0.4) events.push({ team: s, player: creator.player, type: "key_pass" });
      events.push({ team: s, player: shooter.player, type: "shot", outcome: goal ? "goal" : onT ? "on_target" : "off_target" });
      if (goal && r() < 0.7) events.push({ team: s, player: creator.player, type: "assist" });
      if (onT && !goal) events.push({ team: s === "home" ? "away" : "home", player: gk.player, type: "save" });
    }
  };
  side(home, "home", away); side(away, "away", home);
  const lineups = { home: home.players.map((p) => ({ player: p.player, minutes: 90 })), away: away.players.map((p) => ({ player: p.player, minutes: 90 })) };
  return { id, sport: "soccer", date, home: home.name, away: away.name, lineups, events, source: { kind: "synthetic" } };
}

function simBasketball(r, home, away, date, id) {
  const events = [];
  const mins = (p) => (p.role === "starter" ? 34 : 14);
  const side = (t, s, opp) => {
    const oppDef = avg(opp.players.map((p) => p.skill.defend));
    const possessions = 96 + Math.floor(r() * 8);
    const os = s === "home" ? "away" : "home";
    for (let i = 0; i < possessions; i++) {
      const handler = pickW(r, t.players, t.players.map((p) => mins(p) * (0.3 + p.skill.shoot)));
      const defender = pickW(r, opp.players, opp.players.map((p) => mins(p) * (0.2 + p.skill.defend)));
      if (r() < 0.16 - 0.06 * (handler.skill.pass - 0.5)) {
        events.push({ team: s, player: handler.player, type: "turnover" });
        if (r() < 0.5) events.push({ team: os, player: defender.player, type: "steal" });
        continue;
      }
      const three = r() < 0.38;
      let pMake = (three ? 0.25 : 0.42) + 0.25 * handler.skill.shoot - 0.2 * (oppDef - 0.5) + (s === "home" ? 0.015 : 0);
      if (r() < 0.06 * (0.5 + defender.skill.defend)) { events.push({ team: os, player: defender.player, type: "block" }); pMake = 0; }
      const made = r() < pMake;
      events.push({ team: s, player: handler.player, type: three ? "fg3" : "fg2", outcome: made ? "made" : "missed" });
      if (made) {
        const pass = t.players.filter((p) => p !== handler);
        if (r() < 0.6) events.push({ team: s, player: pickW(r, pass, pass.map((p) => mins(p) * (0.1 + p.skill.pass))).player, type: "assist" });
        continue;
      }
      if (r() < 0.12) { for (let k = 0; k < 2; k++) events.push({ team: s, player: handler.player, type: "ft", outcome: r() < 0.6 + 0.3 * handler.skill.shoot ? "made" : "missed" }); continue; }
      const offReb = r() < 0.25;
      const pool = offReb ? t.players : opp.players;
      const reb = pickW(r, pool, pool.map((p) => mins(p) * (0.1 + p.skill.rebound)));
      events.push({ team: offReb ? s : os, player: reb.player, type: "rebound", outcome: offReb ? "offensive" : "defensive" });
    }
  };
  side(home, "home", away); side(away, "away", home);
  const lineups = { home: home.players.map((p) => ({ player: p.player, minutes: mins(p) })), away: away.players.map((p) => ({ player: p.player, minutes: mins(p) })) };
  return { id, sport: "basketball", date, home: home.name, away: away.name, lineups, events, source: { kind: "synthetic" } };
}

function generateLeague(sport, seed = 42, opts = {}) {
  const r = rng(seed);
  const teams = makeTeams(r, sport, opts.teams || 8);
  const rounds = opts.rounds || 2;
  const matches = [];
  let day = Date.parse("2026-01-03");
  let n = 0;
  for (let rd = 0; rd < rounds; rd++) {
    for (let i = 0; i < teams.length; i++) for (let j = 0; j < teams.length; j++) {
      if (i === j) continue;
      const date = new Date(day + n * 86400000 * (sport === "soccer" ? 1 : 0.5)).toISOString().slice(0, 10);
      const id = `${sport}-${seed}-${++n}`;
      matches.push(sport === "soccer" ? simSoccer(r, teams[i], teams[j], date, id) : simBasketball(r, teams[i], teams[j], date, id));
    }
  }
  return { teams, matches };
}

module.exports = { generateLeague };

if (require.main === module) {
  const [sport = "soccer", seed = "42"] = process.argv.slice(2);
  process.stdout.write(JSON.stringify(generateLeague(sport, +seed).matches));
}
