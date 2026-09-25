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

// Soccer squads: 16 players with a line (GK/DF/MF/FW), a flank (L/C/R), hidden
// skills, and a hidden stamina "fade" (share of quality lost by 90' after 60').
const SOCCER_SQUAD = [["GK", "C"], ["GK", "C"], ["DF", "L"], ["DF", "C"], ["DF", "C"], ["DF", "R"], ["DF", "C"],
  ["MF", "L"], ["MF", "C"], ["MF", "R"], ["MF", "C"], ["MF", "C"], ["FW", "L"], ["FW", "C"], ["FW", "R"], ["FW", "C"]];
// 4-3-3 slots → squad indexes (first choice, backup)
const XI_SLOTS = [[0, 1], [2, 6], [3, 6], [4, 6], [5, 6], [7, 10], [8, 11], [9, 10], [12, 15], [13, 15], [14, 15]];

function makeTeams(r, sport, nTeams) {
  const used = new Set();
  const name = () => { let n; do n = FIRST[Math.floor(r() * FIRST.length)] + " " + LAST[Math.floor(r() * LAST.length)]; while (used.has(n)); used.add(n); return n; };
  return CITIES.slice(0, nTeams).map((city, ti) => {
    const quality = (r() - 0.5) * 1.2; // team-level talent spread
    const s = (bias = 0) => Math.max(0.05, Math.min(0.95, 0.5 + quality * 0.35 + bias + (r() - 0.5) * 0.5));
    if (sport === "soccer") {
      // backups are weaker on average, like real squads (index 1 = backup GK)
      const players = SOCCER_SQUAD.map(([position, side], i) => {
        const bench = i === 1 || [6, 10, 11, 15].includes(i);
        const b = bench ? -0.12 : 0;
        return { player: name(), position, side, role: bench ? "bench" : "starter",
          skill: { pass: s(b), shoot: s(b), dribble: s(b), defend: s(b), aerial: s(b), press: s(b) }, fade: r() * 0.45 };
      });
      return { name: city + " FC", players };
    }
    const players = Array.from({ length: 8 }, (_, i) => ({ player: name(), role: i < 5 ? "starter" : "bench", skill: { pass: s(), shoot: s(), dribble: s(), defend: s(), rebound: s() } }));
    return { name: city + " " + ["Hawks", "Bears", "Owls", "Foxes", "Wolves", "Stags", "Rams", "Kites"][ti], players };
  });
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const FLANK_Y = { L: [5, 33], C: [33, 67], R: [67, 95] };
const LINE_X = { GK: [2, 12], DF: [15, 50], MF: [35, 75], FW: [60, 95] };
const MIRROR = { L: "R", C: "C", R: "L" };   // my left flank attacks their right

// Effective skill at minute t: starters and subs lose quality after 60 minutes on the pitch.
function eff(p, k, t) { const played = t - p.on; const f = played > 60 ? p.fade * Math.min(1, (played - 60) / 30) : 0; return p.skill[k] * (1 - f); }

function simSoccer(r, home, away, date, id) {
  const events = [];
  const pickXI = (team) => XI_SLOTS.map(([a, b]) => (r() < 0.85 ? team.players[a] : team.players[b]));
  const state = {};
  for (const [s, team] of [["home", home], ["away", away]]) {
    const xi = pickXI(team);
    const bench = team.players.filter((p) => !xi.includes(p));
    state[s] = { team, lineup: xi.map((p) => ({ ...p, on: 0, off: 90, starter: true })), bench,
      subAt: [60 + Math.floor(r() * 10), 68 + Math.floor(r() * 10), 76 + Math.floor(r() * 8)] };
  }
  const loc = (p) => { const [x0, x1] = LINE_X[p.position], [y0, y1] = FLANK_Y[p.side]; return { x: Math.round(x0 + r() * (x1 - x0)), y: Math.round(y0 + r() * (y1 - y0)) }; };
  const onPitch = (s, t) => state[s].lineup.filter((p) => p.on <= t && p.off > t);

  for (let block = 0; block < 18; block++) {          // 5-minute blocks
    const t0 = block * 5;
    for (const s of ["home", "away"]) {
      // substitutions: replace the on-pitch outfielder of the same line who has faded most
      for (const at of state[s].subAt) {
        if (at < t0 || at >= t0 + 5) continue;
        const cands = state[s].bench.filter((b) => b.position !== "GK");
        if (!cands.length) continue;
        const inP = cands[Math.floor(r() * cands.length)];
        const outs = onPitch(s, at).filter((p) => p.position === inP.position);
        if (!outs.length) continue;
        const out = outs.sort((a, b) => (1 - eff(a, "pass", at) / a.skill.pass) - (1 - eff(b, "pass", at) / b.skill.pass)).pop();
        out.off = at;
        state[s].bench = state[s].bench.filter((b) => b !== inP);
        state[s].lineup.push({ ...inP, side: out.side, on: at, off: 90, starter: false });
      }
    }
    for (const s of ["home", "away"]) {
      const os = s === "home" ? "away" : "home";
      const t = t0 + 2.5;
      const mine = onPitch(s, t), theirs = onPitch(os, t);
      const outfield = mine.filter((p) => p.position !== "GK");
      const theirDef = theirs.filter((p) => p.position !== "GK");
      const gk = theirs.find((p) => p.position === "GK");
      const ts = () => Math.round((t0 + r() * 5) * 60);
      const facing = (p) => { const f = theirDef.filter((d) => d.side === MIRROR[p.side] && d.position !== "FW"); return f.length ? f[Math.floor(r() * f.length)] : theirDef[0]; };
      for (const p of outfield) {
        const n = 2 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const l = loc(p); const ok = r() < 0.62 + 0.3 * eff(p, "pass", t);
          const endX = clamp(l.x + Math.round(-10 + r() * (15 + 30 * eff(p, "pass", t))), 0, 100);
          events.push({ t: ts(), team: s, player: p.player, type: "pass", outcome: ok ? "success" : "fail", ...l, endX, endY: clamp(l.y + Math.round((r() - 0.5) * 30), 0, 100) });
        }
        if (r() < (p.position === "DF" ? 0.08 : 0.25) * (0.3 + eff(p, "dribble", t))) {
          const d = facing(p); const ok = r() < 0.25 + 0.6 * eff(p, "dribble", t) - 0.3 * (eff(d, "defend", t) - 0.5);
          events.push({ t: ts(), team: s, player: p.player, type: "dribble", outcome: ok ? "success" : "fail", ...loc(p) });
          if (ok) events.push({ t: ts(), team: os, player: d.player, type: "dribbled_past" });
          else events.push({ t: ts(), team: os, player: d.player, type: "tackle", outcome: "success" });
        }
        if (r() < 0.35 * eff(p, "press", t)) events.push({ t: ts(), team: s, player: p.player, type: "pressure", ...loc(p) });
        if ((p.position === "DF" || p.position === "FW") && r() < 0.2) events.push({ t: ts(), team: s, player: p.player, type: "aerial", outcome: r() < 0.2 + 0.6 * eff(p, "aerial", t) ? "success" : "fail" });
        if (p.position !== "FW" && r() < 0.18 * (0.5 + eff(p, "defend", t))) events.push({ t: ts(), team: s, player: p.player, type: "interception", ...loc(p) });
        if (p.position !== "FW" && r() < 0.15 * (0.5 + eff(p, "defend", t))) events.push({ t: ts(), team: s, player: p.player, type: "tackle", outcome: r() < 0.3 + 0.6 * eff(p, "defend", t) ? "success" : "fail" });
      }
      const atk = avg(outfield.map((p) => (eff(p, "shoot", t) + eff(p, "pass", t) + eff(p, "dribble", t)) / 3));
      const def = avg(theirDef.map((p) => eff(p, "defend", t)));
      const shots = poissonDraw(r, (9 / 18) * Math.exp(1.6 * (atk - def)) * (s === "home" ? 1.1 : 1));
      for (let i = 0; i < shots; i++) {
        const shooter = pickW(r, outfield, outfield.map((p) => (p.position === "FW" ? 4 : p.position === "MF" ? 2 : 0.5) * (0.3 + eff(p, "shoot", t)) * (1.5 - eff(facing(p), "defend", t))));
        const others = outfield.filter((p) => p !== shooter);
        const creator = pickW(r, others, others.map((p) => 0.2 + eff(p, "pass", t)));
        const d = facing(shooter);
        const xg = clamp(0.04 + 0.2 * eff(shooter, "shoot", t) + 0.1 * (0.5 - eff(d, "defend", t)) + (r() < 0.1 ? 0.35 : 0) * r(), 0.02, 0.9);
        const onT = r() < 0.25 + 0.4 * eff(shooter, "shoot", t);
        const goal = onT && r() < Math.min(0.95, xg / 0.55 - 0.3 * (gk.skill.defend - 0.5));
        const tt = ts(); const [y0, y1] = FLANK_Y[shooter.side];
        if (r() < 0.45) events.push({ t: tt, team: s, player: creator.player, type: "key_pass" });
        events.push({ t: tt, team: s, player: shooter.player, type: "shot", outcome: goal ? "goal" : onT ? "on_target" : "off_target",
          x: Math.round(80 + r() * 17), y: Math.round(y0 + r() * (y1 - y0)), xg: Math.round(xg * 1000) / 1000 });
        if (goal && r() < 0.7) events.push({ t: tt, team: s, player: creator.player, type: "assist" });
        if (onT && !goal) events.push({ t: tt, team: os, player: gk.player, type: "save" });
      }
    }
  }
  const lineups = {};
  for (const s of ["home", "away"]) lineups[s] = state[s].lineup.map((p) => ({ player: p.player, position: p.position, role: p.side, on: p.on, off: p.off, starter: p.starter }));
  events.sort((a, b) => a.t - b.t);
  const score = { home: 0, away: 0 };
  for (const e of events) if (e.type === "shot" && e.outcome === "goal") score[e.team]++;
  return { id, sport: "soccer", date, home: home.name, away: away.name, score, lineups, events, source: { kind: "synthetic" } };
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
