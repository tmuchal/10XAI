// 10XAI Sports — YouTube match-video intake.
//
// What we do automatically (safe):
//   · parse the video id from any YouTube URL form
//   · fetch title/channel via YouTube's official oEmbed endpoint
//   · guess sport, teams and final score from the title
//   · parse a transcript/commentary the user pastes (commentary.cjs)
//
// What we never do automatically (gated):
//   · downloading the video or its captions with yt-dlp. YouTube's Terms of
//     Service prohibit downloading content without permission from YouTube or
//     the rights holder, and league highlight uploads are copyrighted broadcast
//     footage. These steps are emitted as risk ≥ 70 cards that stop at the gate
//     and only run when a human explicitly approves (approve: true).

const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseVideoId(input) {
  const s = String(input || "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let u;
  try { u = new URL(s); } catch { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") return (u.pathname.slice(1).match(/^[\w-]{11}/) || [null])[0];
  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
    if (m) return m[1];
  }
  return null;
}

function fetchJson(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { "User-Agent": "10XAI-sports" }, timeout: timeoutMs }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve(res.statusCode === 200 ? JSON.parse(d) : null); } catch { resolve(null); } });
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(null));
  });
}

async function fetchMetadata(videoId) {
  const url = "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + videoId);
  const j = await fetchJson(url);
  return j ? { title: j.title || "", channel: j.author_name || "", thumbnail: j.thumbnail_url || "" } : null;
}

const BASKETBALL_RE = /\b(nba|wnba|kbl|wkbl|euroleague|fiba|ncaa\s*basketball|basketball|hoops)\b|농구/i;
const SOCCER_RE = /\b(premier league|epl|la ?liga|serie a|bundesliga|ligue 1|champions league|ucl|uefa|fifa|mls|k ?league|world cup|fa cup|football|soccer)\b|축구|K리그/i;

// "Arsenal vs Chelsea | Highlights", "Lakers 112-108 Celtics", "토트넘 vs 맨시티 하이라이트"
function parseTitle(title) {
  const t = String(title || "").replace(/\s*[|｜].*$/, "").replace(/\((?:[^)]*)\)|\[(?:[^\]]*)\]/g, " ").trim();
  const out = { sport: BASKETBALL_RE.test(title) ? "basketball" : SOCCER_RE.test(title) ? "soccer" : null, home: null, away: null, score: null };
  const clean = (x) => x.replace(/\b(highlights?|full match|extended|recap|game)\b|하이라이트|풀경기|경기/gi, "").replace(/\s+/g, " ").replace(/[-:,.]+$/, "").trim();
  let m = t.match(/^(.+?)\s+(\d{1,3})\s*[-–:]\s*(\d{1,3})\s+(.+)$/);
  if (m) {
    out.home = clean(m[1]); out.away = clean(m[4]); out.score = { home: +m[2], away: +m[3] };
    if (!out.sport) out.sport = out.score.home + out.score.away > 20 ? "basketball" : "soccer";
    return out;
  }
  m = t.match(/^(.+?)\s+(?:vs\.?|v\.?|대)\s+(.+)$/i);
  if (m) { out.home = clean(m[1]); out.away = clean(m[2]); }
  return out;
}

function hasYtDlp() { try { return spawnSync("yt-dlp", ["--version"], { stdio: "ignore" }).status === 0; } catch { return false; } }

// The ordered acquisition plan for a video, as board cards. Risky steps carry
// risk ≥ 70 so the gate holds them (lib/model/card.cjs → RISK_GATE_THRESHOLD).
function acquisitionPlan(videoId, meta) {
  const title = (meta && meta.title) || videoId;
  return [
    { key: "metadata", subject: `Fetch metadata (oEmbed) — ${title}`, risk: { score: 5, flags: [] },
      description: "Official YouTube oEmbed endpoint: title, channel, thumbnail. No download." },
    { key: "transcript-paste", subject: "Paste match commentary / transcript", risk: { score: 10, flags: [] },
      description: "Open the video's 'Show transcript' panel and paste it into POST /api/sports/commentary. Parsed locally into events." },
    { key: "event-log", subject: "Log or import match events (CSV/JSON)", risk: { score: 5, flags: [] },
      description: "Hand-tagged or tracker-exported events (t,team,player,type,outcome) — the highest-quality input for player ratings." },
    { key: "captions-download", subject: "Download auto-captions with yt-dlp", risk: { score: 72, flags: ["policy: YouTube ToS prohibits downloading without permission"] },
      description: "yt-dlp --skip-download --write-auto-subs. Only with rights-holder permission or your own upload. Requires manual approval." },
    { key: "video-download", subject: "Download video for computer-vision player tracking", risk: { score: 85, flags: ["policy: YouTube ToS + broadcast copyright", "large download"] },
      description: "yt-dlp full video → workspace/sports/<id>/ for an external tracker (e.g. YOLO + ByteTrack). Requires manual approval and rights." },
  ];
}

// Gated: runs yt-dlp only when approve === true. Output stays under workspace/sports/<id>/.
function download(videoId, { approve, kind = "captions", workspace }) {
  if (approve !== true) return { ok: false, gated: true, reason: "risky step — needs explicit human approval (approve: true)" };
  if (!parseVideoId(videoId)) return { ok: false, reason: "invalid video id" };
  if (!hasYtDlp()) return { ok: false, reason: "yt-dlp is not installed" };
  const dir = path.join(workspace, "sports", videoId);
  fs.mkdirSync(dir, { recursive: true });
  const args = kind === "video"
    ? ["-f", "mp4", "-o", path.join(dir, "%(id)s.%(ext)s"), "https://www.youtube.com/watch?v=" + videoId]
    : ["--skip-download", "--write-auto-subs", "--sub-format", "vtt", "-o", path.join(dir, "%(id)s"), "https://www.youtube.com/watch?v=" + videoId];
  const r = spawnSync("yt-dlp", args, { encoding: "utf-8", timeout: 10 * 60 * 1000 });
  return { ok: r.status === 0, dir, exitCode: r.status, stderr: (r.stderr || "").slice(-2000) };
}

// WebVTT/SRT → plain text lines (keeps the first timestamp of each cue).
function captionsToText(vtt) {
  const lines = []; let ts = null; let last = "";
  for (const raw of String(vtt).split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(/^(\d{1,2}:)?(\d{1,2}):(\d{2})[.,]\d{3}\s+-->/);
    if (m) { ts = line.split(/\s+-->/)[0].replace(/[.,]\d{3}$/, ""); continue; }
    if (!line || /^(WEBVTT|NOTE|Kind:|Language:|\d+)$/.test(line) || /^(WEBVTT|Kind:|Language:)/.test(line)) continue;
    const text = line.replace(/<[^>]+>/g, "").trim();
    if (text && text !== last) { lines.push(ts ? `${ts} ${text}` : text); last = text; }
  }
  return lines.join("\n");
}

module.exports = { parseVideoId, fetchMetadata, parseTitle, acquisitionPlan, download, captionsToText, hasYtDlp };
