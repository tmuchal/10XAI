// 10XAI Sports — match store. One JSON file per match under data/sports/matches/
// (data/ is gitignored). Override the root with SPORTS_DATA_DIR (tests).
const fs = require("fs");
const path = require("path");
const { normalizeMatch } = require("./events.cjs");

function root() { return process.env.SPORTS_DATA_DIR || path.join(__dirname, "..", "..", "data", "sports"); }
function dir() { const d = path.join(root(), "matches"); fs.mkdirSync(d, { recursive: true }); return d; }
const fileFor = (id) => path.join(dir(), String(id).replace(/[^\w.-]+/g, "_") + ".json");

function saveMatch(raw) {
  const { match, warnings } = normalizeMatch(raw);
  const f = fileFor(match.id);
  const tmp = f + ".tmp." + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(match, null, 2));
  fs.renameSync(tmp, f);
  return { match, warnings };
}

function listMatches(sport) {
  const out = [];
  for (const f of fs.readdirSync(dir())) {
    if (!f.endsWith(".json")) continue;
    try { const m = JSON.parse(fs.readFileSync(path.join(dir(), f), "utf-8")); if (!sport || m.sport === sport) out.push(m); } catch {}
  }
  return out.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function getMatch(id) { try { return JSON.parse(fs.readFileSync(fileFor(id), "utf-8")); } catch { return null; } }
function deleteMatch(id) { try { fs.unlinkSync(fileFor(id)); return true; } catch { return false; } }

module.exports = { saveMatch, listMatches, getMatch, deleteMatch, root };
