// StatsBomb open-data → 10XAI match.
//
// StatsBomb publishes free, event-level data for full competitions (World Cups,
// Euros, some league seasons) at github.com/statsbomb/open-data. Every pass, shot
// (with xG), duel, pressure, and substitution has player, minute, and pitch
// location — the same thing a video-tagging analyst produces, so it plugs into
// ratings / scouting / tactics unchanged.
//
// License: free for non-commercial use with attribution ("Data: StatsBomb").
// We never commit their files; they're fetched on demand into data/sports/.
const https = require("https");
const fs = require("fs");
const path = require("path");
const { normPosition } = require("../events.cjs");

const BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data";
const ATTRIBUTION = "Data: StatsBomb open data (github.com/statsbomb/open-data)";

// StatsBomb pitch is 120 × 80, each team attacking toward x = 120.
const nx = (x) => Math.round((x / 120) * 1000) / 10;
const ny = (y) => Math.round((y / 80) * 1000) / 10;
const PROGRESSIVE = 25; // ≥ 25% of pitch length toward goal (≈ 26 m)

function mapEvent(e, side) {
  const out = [];
  const base = { t: e.minute * 60 + e.second, team: side, player: e.player && e.player.name };
  if (!base.player) return out;
  const loc = e.location ? { x: nx(e.location[0]), y: ny(e.location[1]) } : {};
  const push = (o) => out.push(Object.assign({}, base, loc, o));
  const type = e.type && e.type.name;
  switch (type) {
    case "Pass": {
      const p = e.pass || {};
      if (p.type && /Throw-in|Goal Kick|Corner|Kick Off/.test(p.type.name) && !p.goal_assist && !p.shot_assist) {
        // set-piece restarts still count toward passing, but not as open-play progression
        push({ type: "pass", outcome: p.outcome ? "fail" : "success" });
        break;
      }
      const end = p.end_location ? { endX: nx(p.end_location[0]), endY: ny(p.end_location[1]) } : {};
      push(Object.assign({ type: "pass", outcome: p.outcome ? "fail" : "success" }, end));
      if (p.goal_assist) push({ type: "assist" });
      if (p.shot_assist || p.goal_assist) push({ type: "key_pass" });
      if (p.aerial_won) push({ type: "aerial", outcome: "success" });
      break;
    }
    case "Carry": {
      const c = e.carry || {};
      if (c.end_location && e.location && nx(c.end_location[0]) - nx(e.location[0]) >= PROGRESSIVE)
        push({ type: "carry", endX: nx(c.end_location[0]), endY: ny(c.end_location[1]) });
      break;
    }
    case "Shot": {
      const s = e.shot || {};
      if (s.type && s.type.name === "Penalty" && e.period === 5) break;
      const o = s.outcome ? s.outcome.name : "";
      const outcome = o === "Goal" ? "goal" : /Saved/.test(o) ? "on_target" : o === "Blocked" ? "blocked" : "off_target";
      push({ type: "shot", outcome, xg: typeof s.statsbomb_xg === "number" ? Math.round(s.statsbomb_xg * 1000) / 1000 : undefined });
      if (s.aerial_won) push({ type: "aerial", outcome: "success" });
      break;
    }
    case "Dribble": push({ type: "dribble", outcome: e.dribble && e.dribble.outcome && e.dribble.outcome.name === "Complete" ? "success" : "fail" }); break;
    case "Dribbled Past": push({ type: "dribbled_past" }); break;
    case "Duel": {
      const d = e.duel || {};
      const dt = d.type ? d.type.name : "";
      if (dt === "Tackle") push({ type: "tackle", outcome: d.outcome && /Won|Success/.test(d.outcome.name) ? "success" : "fail" });
      else if (dt === "Aerial Lost") push({ type: "aerial", outcome: "fail" });
      break;
    }
    case "Interception": {
      const o = e.interception && e.interception.outcome ? e.interception.outcome.name : "";
      if (/Won|Success/.test(o)) push({ type: "interception" });
      break;
    }
    case "Clearance": push({ type: "clearance" }); if (e.clearance && e.clearance.aerial_won) push({ type: "aerial", outcome: "success" }); break;
    case "Block": push({ type: "block" }); break;
    case "Ball Recovery": if (!(e.ball_recovery && e.ball_recovery.recovery_failure)) push({ type: "recovery" }); break;
    case "Pressure": push({ type: "pressure" }); break;
    case "Goal Keeper": {
      const g = e.goalkeeper || {};
      if (g.type && /Shot Saved|Penalty Saved/.test(g.type.name) && e.period !== 5) push({ type: "save" });
      break;
    }
    case "Foul Committed": {
      push({ type: "foul" });
      const c = e.foul_committed && e.foul_committed.card;
      if (c) push({ type: "card", outcome: /Red/.test(c.name) ? "red" : "yellow" });
      break;
    }
    case "Bad Behaviour": {
      const c = e.bad_behaviour && e.bad_behaviour.card;
      if (c) push({ type: "card", outcome: /Red/.test(c.name) ? "red" : "yellow" });
      break;
    }
    case "Miscontrol": case "Dispossessed": push({ type: "turnover" }); break;
  }
  for (const ev of out) if (ev.xg === undefined) delete ev.xg;
  return out;
}

// StatsBomb events carry full legal names ("Lionel Andrés Messi Cuccittini"); the
// lineups file has the name people actually use ("Lionel Messi"). Map to that.
function nicknameMap(lineups) {
  const m = new Map();
  for (const team of lineups || []) for (const p of team.lineup || []) if (p.player_nickname) m.set(p.player_name, p.player_nickname);
  return m;
}
function renamePlayers(events, names) {
  if (!names || !names.size) return events;
  const fix = (o) => { if (o && o.name && names.has(o.name)) o.name = names.get(o.name); };
  for (const e of events) {
    fix(e.player);
    if (e.pass) fix(e.pass.recipient);
    if (e.substitution) fix(e.substitution.replacement);
    if (e.tactics) for (const l of e.tactics.lineup || []) fix(l.player);
  }
  return events;
}

// events: StatsBomb event array; info: the matches.json entry for this match;
// lineups (optional): the lineups file, used for common player names.
function toMatch(events, info, sbLineups) {
  events = renamePlayers(events, nicknameMap(sbLineups));
  const home = info.home_team.home_team_name, away = info.away_team.away_team_name;
  const sideOf = (team) => (team === home ? "home" : team === away ? "away" : null);
  const regular = events.filter((e) => e.period <= 4);
  const endMinute = Math.max(90, ...regular.map((e) => e.minute + e.second / 60));
  const lineups = { home: new Map(), away: new Map() };

  for (const e of events) {
    const side = e.team && sideOf(e.team.name);
    if (!side) continue;
    if (e.type.name === "Starting XI") {
      for (const l of e.tactics.lineup) lineups[side].set(l.player.name, { player: l.player.name, role: l.position.name, position: normPosition(l.position.name), on: 0, off: null, starter: true });
    } else if (e.type.name === "Substitution" && e.period <= 4) {
      const t = e.minute + e.second / 60;
      const out = lineups[side].get(e.player.name); if (out) out.off = t;
      const inName = e.substitution.replacement.name;
      lineups[side].set(inName, { player: inName, role: e.position ? e.position.name : null, position: normPosition(e.position && e.position.name), on: t, off: null, starter: false });
    } else if ((e.type.name === "Bad Behaviour" || e.type.name === "Foul Committed") && e.period <= 4) {
      const card = (e.bad_behaviour || e.foul_committed || {}).card;
      if (card && /Red|Second Yellow/.test(card.name)) { const p = lineups[side].get(e.player.name); if (p) p.off = e.minute + e.second / 60; }
    } else if (e.type.name === "Player Off" && e.period <= 4) {
      const p = lineups[side].get(e.player && e.player.name); if (p && p.off == null) p.off = e.minute + e.second / 60;
    }
  }
  // most frequent position a player actually played (subs inherit the replaced role)
  const posCount = new Map();
  for (const e of regular) if (e.player && e.position) {
    const k = e.player.name; const m = posCount.get(k) || {}; m[e.position.name] = (m[e.position.name] || 0) + 1; posCount.set(k, m);
  }
  const lineupOut = {};
  for (const side of ["home", "away"]) {
    lineupOut[side] = [...lineups[side].values()].map((p) => {
      const pc = posCount.get(p.player);
      if (pc) { const role = Object.entries(pc).sort((a, b) => b[1] - a[1])[0][0]; p.role = role; p.position = normPosition(role) || p.position; }
      const off = p.off == null ? endMinute : p.off;
      return { player: p.player, position: p.position, role: p.role, starter: p.starter, on: Math.round(p.on), off: Math.round(off), minutes: Math.round(Math.max(0, off - p.on)) };
    }).filter((p) => p.minutes > 0 || p.starter);
  }
  const evs = [];
  for (const e of regular) { const side = e.team && sideOf(e.team.name); if (side) evs.push(...mapEvent(e, side)); }
  return {
    id: "sb-" + info.match_id, sport: "soccer", date: info.match_date, home, away,
    score: { home: info.home_score, away: info.away_score },
    competition: info.competition ? info.competition.competition_name : undefined,
    stage: info.competition_stage ? info.competition_stage.name : undefined,
    source: { kind: "statsbomb", matchId: info.match_id, attribution: ATTRIBUTION },
    lineups: lineupOut, events: evs,
  };
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "10XAI-sports" } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} for ${url}`)); }
      let d = ""; res.setEncoding("utf8"); res.on("data", (c) => (d += c)); res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

// source: { dir } to read a local open-data checkout, else fetched from GitHub.
async function loadJson(rel, source = {}) {
  if (source.dir) return JSON.parse(fs.readFileSync(path.join(source.dir, rel), "utf-8"));
  return getJson(`${BASE}/${rel}`);
}

// Import every match of a competition-season (optionally only those involving `team`).
async function importSeason({ competitionId, seasonId, team, matchIds, dir, onMatch, limit }) {
  const infos = await loadJson(`matches/${competitionId}/${seasonId}.json`, { dir });
  let pick = infos.filter((m) => (!team || m.home_team.home_team_name === team || m.away_team.away_team_name === team)
    && (!matchIds || matchIds.includes(m.match_id)));
  if (team && !pick.length) throw new Error(`no matches for "${team}" in competition ${competitionId}/${seasonId}`);
  pick = pick.sort((a, b) => a.match_date.localeCompare(b.match_date));
  if (limit) pick = pick.slice(-limit);
  const out = [];
  for (const info of pick) {
    const events = await loadJson(`events/${info.match_id}.json`, { dir });
    let lineups = null;
    try { lineups = await loadJson(`lineups/${info.match_id}.json`, { dir }); } catch { /* names stay as in events */ }
    const m = toMatch(events, info, lineups);
    out.push(m);
    if (onMatch) onMatch(m);
  }
  return out;
}

async function listCompetitions(dir) {
  const c = await loadJson("competitions.json", { dir });
  return c.map((x) => ({ competitionId: x.competition_id, seasonId: x.season_id, name: x.competition_name, season: x.season_name, gender: x.competition_gender }));
}

module.exports = { toMatch, mapEvent, importSeason, listCompetitions, ATTRIBUTION };
