// 10XAI Sports — REST routes, mounted by server/kanban.cjs under /api/sports/.
//
//   GET    /api/sports/matches?sport=            list stored matches (summary)
//   POST   /api/sports/matches                   store a match (JSON; optional "csv" events)
//   GET    /api/sports/matches/:id               one match
//   DELETE /api/sports/matches/:id
//   POST   /api/sports/youtube                   { url, board? } → metadata, title guess, gated acquisition plan
//   POST   /api/sports/youtube/download          { videoId, kind: captions|video, approve } — gated
//   POST   /api/sports/commentary                { text, sport, home, away, roster, date?, score?, url?, extractor?, save? }
//   GET    /api/sports/players?sport=&team=&halfLife=
//   POST   /api/sports/predict                   { sport, home, away, lineups?, neutral? }
//   GET    /api/sports/backtest?sport=
//   POST   /api/sports/demo                      seed a synthetic (fictional) league for trying the UI
//   GET    /api/sports/teams?sport=              teams with match counts
//   GET    /api/sports/profiles?team=&player=    soccer scouting profiles (archetype, strengths, form, fatigue, zone)
//   GET    /api/sports/scout?team=&us=           opponent scouting report + recommendations
//   POST   /api/sports/lineup                    { us, them, venue?, objective?, formation?, unavailable? } best XI + formation
//   POST   /api/sports/subs                      { us, them, minute, score:{us,them}, onPitch?, bench?, subsLeft?, venue?, objective? }
//   POST   /api/sports/gameplan                  { us, them, venue?, objective?, formation?, unavailable? }
//   GET    /api/sports/statsbomb/competitions    free StatsBomb open-data competitions
//   POST   /api/sports/statsbomb/import          { competitionId, seasonId, team?, matchIds? }
const path = require("path");
const store = require("./store.cjs");
const { normalizeMatch, parseEventsCsv } = require("./events.cjs");
const { computeRatings, publicRating } = require("./ratings.cjs");
const { buildProfiles } = require("./profile.cjs");
const { scoutTeam } = require("./scout.cjs");
const tactics = require("./tactics.cjs");
const statsbomb = require("./importers/statsbomb.cjs");
const { predictMatch, backtest } = require("./predict.cjs");
const yt = require("./youtube.cjs");
const { extractEvents } = require("./commentary.cjs");

const MAX_BODY = 5 * 1024 * 1024;

function readJson(req) {
  return new Promise((resolve, reject) => {
    let d = ""; let n = 0;
    req.on("data", (c) => { n += c.length; if (n > MAX_BODY) { reject(new Error("body too large")); req.destroy(); } else d += c; });
    req.on("end", () => { try { resolve(d ? JSON.parse(d) : {}); } catch { reject(new Error("invalid JSON body")); } });
    req.on("error", reject);
  });
}
function send(res, code, obj) { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); }
const summary = (m) => ({ id: m.id, sport: m.sport, date: m.date, home: m.home, away: m.away, score: m.score, events: m.events.length, source: m.source });

function createRoutes(ctx = {}) {
  const workspace = ctx.workspace || path.join(__dirname, "..", "..", "workspace");

  return async function handle(req, res) {
    const u = new URL(req.url, "http://localhost");
    const p = u.pathname;
    if (!p.startsWith("/api/sports/")) return false;
    const q = u.searchParams;
    try {
      if (p === "/api/sports/matches" && req.method === "GET") { send(res, 200, store.listMatches(q.get("sport")).map(summary)); return true; }
      if (p === "/api/sports/matches" && req.method === "POST") {
        const body = await readJson(req);
        const raw = Object.assign({}, body);
        if (typeof body.csv === "string") raw.events = (raw.events || []).concat(parseEventsCsv(body.csv));
        delete raw.csv;
        const { match, warnings } = store.saveMatch(raw);
        send(res, 201, { match: summary(match), warnings }); return true;
      }
      const idm = p.match(/^\/api\/sports\/matches\/([^/]+)$/);
      if (idm && req.method === "GET") { const m = store.getMatch(decodeURIComponent(idm[1])); send(res, m ? 200 : 404, m || { error: "not found" }); return true; }
      if (idm && req.method === "DELETE") { send(res, 200, { ok: store.deleteMatch(decodeURIComponent(idm[1])) }); return true; }

      if (p === "/api/sports/youtube" && req.method === "POST") {
        const body = await readJson(req);
        const videoId = yt.parseVideoId(body.url);
        if (!videoId) { send(res, 400, { error: "not a YouTube URL or video id" }); return true; }
        const metadata = await yt.fetchMetadata(videoId);
        const guess = yt.parseTitle(metadata && metadata.title);
        const plan = yt.acquisitionPlan(videoId, metadata);
        let cards = [];
        if (body.board && typeof ctx.createTask === "function") {
          cards = plan.map((step) => {
            const blocked = step.risk.score >= 70;
            return ctx.createTask({
              subject: step.subject, description: step.description, agent: "sports-extract-agent",
              status: blocked ? "in_review" : "pending", priority: blocked ? "high" : "medium",
              metadata: { kind: "original", sourceChannel: "youtube", sports: { videoId, step: step.key }, risk: step.risk,
                badges: blocked ? ["policy"] : [], gate: blocked ? { status: "blocked", reason: step.risk.flags.join("; ") } : { status: "open" } },
            }).id;
          });
        }
        send(res, 200, { videoId, metadata, guess, plan, cards, ytDlp: yt.hasYtDlp() }); return true;
      }
      if (p === "/api/sports/youtube/download" && req.method === "POST") {
        const body = await readJson(req);
        const r = yt.download(body.videoId, { approve: body.approve, kind: body.kind === "video" ? "video" : "captions", workspace });
        send(res, r.gated ? 403 : r.ok ? 200 : 400, r); return true;
      }

      if (p === "/api/sports/commentary" && req.method === "POST") {
        const body = await readJson(req);
        if (!body.text) { send(res, 400, { error: "text (the commentary / transcript) is required" }); return true; }
        const roster = body.roster || {};
        const ex = await extractEvents(body.text, { sport: body.sport, roster, home: body.home, away: body.away, extractor: body.extractor || "auto" });
        const lineups = {}; for (const s of ["home", "away"]) if (Array.isArray(roster[s])) lineups[s] = roster[s].map((player) => ({ player }));
        const raw = { id: body.id, sport: body.sport, date: body.date, home: body.home, away: body.away, score: body.score, lineups, events: ex.events,
          source: { kind: "commentary", extractor: ex.extractor, youtube: yt.parseVideoId(body.url) || undefined } };
        const { match, warnings } = body.save ? store.saveMatch(raw) : normalizeMatch(raw);
        send(res, 200, { match: body.save ? summary(match) : match, saved: !!body.save, coverage: ex.coverage, extractor: ex.extractor, warnings }); return true;
      }

      if (p === "/api/sports/players" && req.method === "GET") {
        const sport = q.get("sport") || "soccer";
        let rows = computeRatings(store.listMatches(sport), { sport, halfLifeDays: +q.get("halfLife") || undefined });
        if (q.get("team")) rows = rows.filter((r) => r.team === q.get("team"));
        send(res, 200, rows.map(publicRating)); return true;
      }
      if (p === "/api/sports/predict" && req.method === "POST") {
        const body = await readJson(req);
        if (!body.sport || !body.home || !body.away) { send(res, 400, { error: "sport, home and away are required" }); return true; }
        send(res, 200, predictMatch(store.listMatches(body.sport), body, { halfLifeDays: body.halfLifeDays })); return true;
      }
      if (p === "/api/sports/backtest" && req.method === "GET") {
        const sport = q.get("sport") || "soccer";
        send(res, 200, backtest(store.listMatches(sport), sport, { includeRows: q.get("rows") === "1" })); return true;
      }
      if (p === "/api/sports/teams" && req.method === "GET") {
        const counts = new Map();
        for (const m of store.listMatches(q.get("sport") || "soccer")) for (const t of [m.home, m.away]) counts.set(t, (counts.get(t) || 0) + 1);
        send(res, 200, [...counts].map(([team, matches]) => ({ team, matches })).sort((a, b) => b.matches - a.matches || a.team.localeCompare(b.team))); return true;
      }
      if (p === "/api/sports/profiles" && req.method === "GET") {
        let rows = buildProfiles(store.listMatches("soccer"), { team: q.get("team") || undefined });
        if (q.get("player")) rows = rows.filter((r) => r.player === q.get("player"));
        send(res, 200, rows); return true;
      }
      if (p === "/api/sports/scout" && req.method === "GET") {
        if (!q.get("team")) { send(res, 400, { error: "team is required" }); return true; }
        send(res, 200, scoutTeam(store.listMatches("soccer"), q.get("team"), { us: q.get("us") || undefined })); return true;
      }
      if (["/api/sports/lineup", "/api/sports/subs", "/api/sports/gameplan"].includes(p) && req.method === "POST") {
        const body = await readJson(req);
        if (!body.us || !body.them) { send(res, 400, { error: "us and them are required" }); return true; }
        const ms = store.listMatches("soccer");
        const fn = p.endsWith("lineup") ? tactics.bestLineup : p.endsWith("subs") ? tactics.planSubstitutions : tactics.gamePlan;
        if (p.endsWith("subs") && typeof body.minute !== "number") { send(res, 400, { error: "minute is required" }); return true; }
        send(res, 200, fn(ms, body)); return true;
      }
      if (p === "/api/sports/statsbomb/competitions" && req.method === "GET") {
        send(res, 200, (await statsbomb.listCompetitions()).map((c) => ({ ...c, attribution: statsbomb.ATTRIBUTION }))); return true;
      }
      if (p === "/api/sports/statsbomb/import" && req.method === "POST") {
        const body = await readJson(req);
        if (body.competitionId == null || body.seasonId == null) { send(res, 400, { error: "competitionId and seasonId are required" }); return true; }
        const saved = [];
        await statsbomb.importSeason({ competitionId: body.competitionId, seasonId: body.seasonId, team: body.team, matchIds: body.matchIds,
          limit: Math.min(+body.limit || 80, 400), onMatch: (m) => saved.push(summary(store.saveMatch(m).match)) });
        send(res, 201, { imported: saved.length, matches: saved, attribution: statsbomb.ATTRIBUTION }); return true;
      }
      if (p === "/api/sports/demo" && req.method === "POST") {
        const { generateLeague } = require("../../examples/sports/generate.cjs");
        let n = 0;
        for (const sport of ["soccer", "basketball"]) for (const m of generateLeague(sport, 42).matches) { store.saveMatch(m); n++; }
        send(res, 201, { ok: true, matches: n }); return true;
      }
      send(res, 404, { error: "unknown sports route" }); return true;
    } catch (e) {
      send(res, 400, { error: e.message }); return true;
    }
  };
}

module.exports = { createRoutes };
