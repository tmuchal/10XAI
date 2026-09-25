/**
 * 10XAI Dance Lab — server routes.
 *
 * Pose estimation runs in the browser; this module only serves the page,
 * optionally fetches a YouTube video for local study (yt-dlp, opt-in), stores
 * reports under workspace/dance/, and asks the local `claude` CLI for a coach brief.
 *
 *   GET  /dance                     → ui/dance/index.html (+ /dance/*.mjs assets)
 *   GET  /api/dance/status          → { ytdlp, ytdlpSource, canInstallYtdlp, ffmpeg, claude }
 *   POST /api/dance/tools/ytdlp/install → install the official yt-dlp build (SHA-256 verified) into workspace/dance/bin
 *   GET  /api/dance/meta?url=…      → YouTube oEmbed metadata
 *   POST /api/dance/fetch           → { url, ack:true } → downloads to workspace/dance/videos
 *   GET  /api/dance/video/:id       → range-served local video
 *   GET  /api/dance/reports         → saved analyses (summary)
 *   GET  /api/dance/reports/:id     → one saved analysis
 *   POST /api/dance/reports         → save an analysis
 *   POST /api/dance/coach           → { report, lang } → Markdown brief
 *   GET  /api/dance/trends          → K-pop trend catalog (researched copy or bundled snapshot)
 *   POST /api/dance/trends/refresh  → re-research trends with the claude CLI (WebSearch)
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const { spawn, execFileSync } = require("child_process");

module.exports = function createDanceRoutes({ root, workspace }) {
  const UI_DIR = path.join(root, "ui", "dance");
  const DATA = path.join(workspace, "dance");
  const VIDEOS = path.join(DATA, "videos");
  const REPORTS = path.join(DATA, "reports");
  const MIME = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };
  const which = (bin) => { try { execFileSync("which", [bin], { stdio: "ignore", timeout: 4000 }); return true; } catch { return false; } };
  const tools = { claude: !process.env.CLAUDECODE && which("claude"), ffmpeg: which("ffmpeg") };
  // yt-dlp: a system install, or the official standalone build installed on
  // request into workspace/dance/bin (SHA-256 checked against the release sums).
  const BIN = path.join(DATA, "bin");
  const YTDLP_ASSET = { "linux-x64": "yt-dlp_linux", "linux-arm64": "yt-dlp_linux_aarch64", "darwin-x64": "yt-dlp_macos", "darwin-arm64": "yt-dlp_macos", "win32-x64": "yt-dlp.exe", "win32-arm64": "yt-dlp_arm64.exe" }[process.platform + "-" + process.arch] || null;
  const localYtdlp = path.join(BIN, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
  const systemYtdlp = which("yt-dlp");
  const ytdlpCmd = () => (systemYtdlp ? "yt-dlp" : fs.existsSync(localYtdlp) ? localYtdlp : null);
  const status = () => ({ ...tools, ytdlp: !!ytdlpCmd(), ytdlpSource: systemYtdlp ? "system" : fs.existsSync(localYtdlp) ? "local" : null, canInstallYtdlp: !!YTDLP_ASSET });

  function getBuffer(url, limit = 80 * 1024 * 1024, hops = 0) {
    return new Promise((resolve, reject) => {
      const r = https.get(url, { headers: { "User-Agent": "10XAI-dance" } }, (resp) => {
        if ([301, 302, 303, 307, 308].includes(resp.statusCode) && resp.headers.location && hops < 6) { resp.resume(); return resolve(getBuffer(new URL(resp.headers.location, url).toString(), limit, hops + 1)); }
        if (resp.statusCode !== 200) { resp.resume(); return reject(new Error(`GET ${url} → ${resp.statusCode}`)); }
        const chunks = []; let size = 0;
        resp.on("data", (c) => { size += c.length; if (size > limit) { resp.destroy(); reject(new Error("download too large")); } else chunks.push(c); });
        resp.on("end", () => resolve(Buffer.concat(chunks)));
        resp.on("error", reject);
      });
      r.on("error", reject);
      r.setTimeout(60000, () => r.destroy(new Error("timeout")));
    });
  }
  let installing = null;
  function installYtdlp() {
    if (installing) return installing;
    installing = (async () => {
      if (!YTDLP_ASSET) throw new Error(`No standalone yt-dlp build for ${process.platform}/${process.arch} — install it with pipx install yt-dlp.`);
      const base = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/";
      const sums = (await getBuffer(base + "SHA2-256SUMS", 1e6)).toString("utf-8");
      const line = sums.split("\n").find((l) => l.trim().endsWith("  " + YTDLP_ASSET));
      if (!line) throw new Error("Release checksum not found for " + YTDLP_ASSET);
      const want = line.split(/\s+/)[0].toLowerCase();
      const bin = await getBuffer(base + YTDLP_ASSET);
      const got = crypto.createHash("sha256").update(bin).digest("hex");
      if (got !== want) throw new Error("Checksum mismatch — refusing to install the downloaded yt-dlp.");
      fs.mkdirSync(BIN, { recursive: true });
      fs.writeFileSync(localYtdlp + ".tmp", bin, { mode: 0o755 });
      fs.renameSync(localYtdlp + ".tmp", localYtdlp);
      const version = execFileSync(localYtdlp, ["--version"], { timeout: 30000 }).toString().trim();
      return { ok: true, version, sha256: got, asset: YTDLP_ASSET };
    })().finally(() => { installing = null; });
    return installing;
  }
  const fetching = new Map(); // videoId → Promise

  const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  const readBody = (req, limit = 20 * 1024 * 1024) => new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
  const youtubeId = (url) => {
    const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const getJson = (url) => new Promise((resolve) => {
    const r = https.get(url, { headers: { "User-Agent": "10XAI-dance" } }, (resp) => {
      let d = ""; resp.on("data", (c) => (d += c)); resp.on("end", () => { try { resolve(resp.statusCode === 200 ? JSON.parse(d) : null); } catch { resolve(null); } });
    });
    r.on("error", () => resolve(null)); r.setTimeout(8000, () => { r.destroy(); resolve(null); });
  });

  function serveFile(res, file) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(fs.readFileSync(file));
    return true;
  }

  function serveVideo(req, res, file) {
    const stat = fs.statSync(file);
    const range = req.headers.range && req.headers.range.match(/bytes=(\d*)-(\d*)/);
    if (range) {
      const start = range[1] ? parseInt(range[1], 10) : 0;
      const end = range[2] ? Math.min(parseInt(range[2], 10), stat.size - 1) : stat.size - 1;
      if (start >= stat.size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); res.end(); return; }
      res.writeHead(206, { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Length": stat.size });
      fs.createReadStream(file).pipe(res);
    }
  }

  function download(id) {
    if (fetching.has(id)) return fetching.get(id);
    fs.mkdirSync(VIDEOS, { recursive: true });
    const out = path.join(VIDEOS, id + ".mp4");
    const p = new Promise((resolve, reject) => {
      if (fs.existsSync(out)) return resolve(out);
      // No shell: the id is validated to [A-Za-z0-9_-]{11} and passed as an argv entry.
      // Shorts are vertical: sort by resolution (short side ≤ 720) rather than height.
      // Without ffmpeg only single-file (progressive) formats can be used.
      const fmt = tools.ffmpeg ? ["-f", "bv*+ba/b", "-S", "res:720,ext:mp4:m4a", "--merge-output-format", "mp4"] : ["-f", "b", "-S", "res:720,ext:mp4"];
      const cmd = ytdlpCmd();
      if (!cmd) return reject(new Error("yt-dlp is not installed."));
      const proc = spawn(cmd, [...fmt, "--no-playlist", "-o", out, "https://www.youtube.com/watch?v=" + id], { stdio: ["ignore", "ignore", "pipe"] });
      let err = "";
      proc.stderr.on("data", (d) => { err = (err + d).slice(-2000); });
      const timer = setTimeout(() => proc.kill("SIGKILL"), 10 * 60 * 1000);
      proc.on("error", (e) => { clearTimeout(timer); reject(e); });
      proc.on("close", (code) => { clearTimeout(timer); code === 0 && fs.existsSync(out) ? resolve(out) : reject(new Error(err.trim().split("\n").pop() || "yt-dlp exited " + code)); });
    }).finally(() => fetching.delete(id));
    fetching.set(id, p);
    return p;
  }

  // Trend catalog: a claude-researched copy in workspace wins over the bundled snapshot.
  const TRENDS_FILE = path.join(DATA, "trends.json");
  let trendsMod = null;
  const loadTrendsMod = async () => (trendsMod ||= await import(require("url").pathToFileURL(path.join(UI_DIR, "trends.mjs")).href));
  let refreshing = null;
  function refreshTrends() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      const mod = await loadTrendsMod();
      let prompt = "";
      try { prompt = fs.readFileSync(path.join(root, "agents", "dance-trend-agent.md"), "utf-8").replace(/^---[\s\S]*?---\s*/, ""); } catch {}
      prompt += "\n\nToday is " + new Date().toISOString().slice(0, 10) + ". Allowed axis keys: " + mod.AXIS_KEYS.join(", ") +
        ". Allowed drill ids: hit-freeze, accent-map, full-out-8s, plie-drops, waves, slow-motion, bounce, groove-walk, lines, step-ladder, level-changes, count-clap, weak-side, chest-iso." +
        "\nCurrent catalog for reference (update, don't just copy):\n```json\n" + JSON.stringify(mod.BUNDLED) + "\n```";
      const out = await new Promise((resolve, reject) => {
        const env = Object.assign({}, process.env); delete env.ANTHROPIC_API_KEY;
        const proc = spawn("claude", ["-p", "--model", "sonnet", "--no-session-persistence", "--allowedTools", "WebSearch,WebFetch"], { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] });
        let o = "", e = "";
        const timer = setTimeout(() => proc.kill(), 6 * 60 * 1000);
        proc.stdout.on("data", (d) => (o += d)); proc.stderr.on("data", (d) => (e += d));
        proc.on("error", (err) => { clearTimeout(timer); reject(err); });
        proc.on("close", (code) => { clearTimeout(timer); o.trim() ? resolve(o) : reject(new Error(e.trim().slice(-300) || "claude exited " + code)); });
        proc.stdin.end(prompt);
      });
      const m = out.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = (m ? m[1] : out).trim();
      const obj = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      const clean = mod.validateTrends({ ...obj, origin: "researched" });
      fs.mkdirSync(DATA, { recursive: true });
      fs.writeFileSync(TRENDS_FILE, JSON.stringify(clean, null, 2));
      return clean;
    })().finally(() => { refreshing = null; });
    return refreshing;
  }

  function coach(report, lang) {
    return new Promise((resolve, reject) => {
      let prompt = "";
      try { prompt = fs.readFileSync(path.join(root, "agents", "dance-coach-agent.md"), "utf-8").replace(/^---[\s\S]*?---\s*/, ""); } catch {}
      const slim = { ...report };
      delete slim.frames; delete slim.energyCurve; delete slim.accents;
      prompt += "\n\n## Report\n```json\n" + JSON.stringify(slim) + "\n```\n\n" +
        (lang === "ko" ? "[OUTPUT LANGUAGE] Write the whole brief in natural Korean (dance terms like 칼군무, 킬링파트 are welcome)." : "[OUTPUT LANGUAGE] Write the whole brief in English.");
      const env = Object.assign({}, process.env); delete env.ANTHROPIC_API_KEY;
      const proc = spawn("claude", ["-p", "--model", "sonnet", "--no-session-persistence"], { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] });
      let out = "", err = "";
      const timer = setTimeout(() => proc.kill(), 180000);
      proc.stdout.on("data", (d) => (out += d));
      proc.stderr.on("data", (d) => (err += d));
      proc.on("error", (e) => { clearTimeout(timer); reject(e); });
      proc.on("close", (code) => { clearTimeout(timer); out.trim() ? resolve(out.trim()) : reject(new Error(err.trim().slice(-400) || "claude exited " + code)); });
      proc.stdin.end(prompt);
    });
  }

  // Returns true when the request was handled.
  return async function handle(req, res) {
    const url = new URL(req.url, "http://localhost");
    const p = url.pathname;
    if (!(p === "/dance" || p.startsWith("/dance/") || p.startsWith("/api/dance/"))) return false;
    try {
      if (req.method === "GET" && (p === "/dance" || p === "/dance/")) return serveFile(res, path.join(UI_DIR, "index.html")) || (json(res, 404, { error: "missing ui" }), true);
      if (req.method === "GET" && p.startsWith("/dance/")) {
        const rel = p.slice("/dance/".length);
        if (!/^[\w.-]+$/.test(rel)) return json(res, 404, { error: "not found" }), true;
        return serveFile(res, path.join(UI_DIR, rel)) || (json(res, 404, { error: "not found" }), true);
      }
      if (req.method === "GET" && p === "/api/dance/status") return json(res, 200, status()), true;
      if (req.method === "POST" && p === "/api/dance/tools/ytdlp/install") {
        if (ytdlpCmd()) return json(res, 200, { ok: true, already: true, ...status() }), true;
        const r = await installYtdlp();
        return json(res, 200, { ...r, ...status() }), true;
      }
      if (req.method === "GET" && p === "/api/dance/trends") {
        const mod = await loadTrendsMod();
        try { return json(res, 200, mod.validateTrends(JSON.parse(fs.readFileSync(TRENDS_FILE, "utf-8")))), true; }
        catch { return json(res, 200, mod.BUNDLED), true; }
      }
      if (req.method === "POST" && p === "/api/dance/trends/refresh") {
        if (!tools.claude) return json(res, 501, { error: "Refreshing trends needs the local claude CLI (it researches the web). Showing the bundled snapshot." }), true;
        return json(res, 200, await refreshTrends()), true;
      }
      if (req.method === "GET" && p === "/api/dance/meta") {
        const id = youtubeId(url.searchParams.get("url"));
        if (!id) return json(res, 400, { error: "Not a YouTube URL" }), true;
        const meta = await getJson("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id));
        const cached = fs.existsSync(path.join(VIDEOS, id + ".mp4"));
        return json(res, 200, { id, title: meta && meta.title, author: meta && meta.author_name, thumbnail: meta ? meta.thumbnail_url : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, cached, src: cached ? "/api/dance/video/" + id : null }), true;
      }
      if (req.method === "POST" && p === "/api/dance/fetch") {
        const body = await readBody(req);
        const id = youtubeId(body.url);
        if (!id) return json(res, 400, { error: "Not a YouTube URL" }), true;
        if (!body.ack) return json(res, 400, { error: "Confirm personal-study use first." }), true;
        if (!ytdlpCmd() && !fs.existsSync(path.join(VIDEOS, id + ".mp4"))) return json(res, 501, { error: "yt-dlp is not installed — use “Install yt-dlp” (official build, checksum-verified) or upload a video file instead.", needInstall: true }), true;
        await download(id);
        return json(res, 200, { id, src: "/api/dance/video/" + id }), true;
      }
      const vid = p.match(/^\/api\/dance\/video\/([A-Za-z0-9_-]{11})$/);
      if (req.method === "GET" && vid) {
        const file = path.join(VIDEOS, vid[1] + ".mp4");
        if (!fs.existsSync(file)) return json(res, 404, { error: "not downloaded" }), true;
        return serveVideo(req, res, file), true;
      }
      if (req.method === "GET" && p === "/api/dance/reports") {
        fs.mkdirSync(REPORTS, { recursive: true });
        const list = fs.readdirSync(REPORTS).filter((f) => f.endsWith(".json")).map((f) => {
          try {
            const r = JSON.parse(fs.readFileSync(path.join(REPORTS, f), "utf-8"));
            return { id: r.id, title: r.source && r.source.title, ytId: r.source && r.source.ytId, createdAt: r.createdAt, archetype: r.analysis && r.analysis.archetype && r.analysis.archetype.primary.name, bpm: r.analysis && r.analysis.raw && r.analysis.raw.bpm };
          } catch { return null; }
        }).filter(Boolean).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return json(res, 200, list), true;
      }
      const rep = p.match(/^\/api\/dance\/reports\/([a-f0-9]{12})$/);
      if (req.method === "GET" && rep) {
        const file = path.join(REPORTS, rep[1] + ".json");
        return serveFile(res, file) || (json(res, 404, { error: "not found" }), true);
      }
      if (req.method === "POST" && p === "/api/dance/reports") {
        const body = await readBody(req);
        if (!body || !body.analysis || !(Array.isArray(body.frames) || Array.isArray(body.members))) return json(res, 400, { error: "analysis and frames/members required" }), true;
        fs.mkdirSync(REPORTS, { recursive: true });
        const id = crypto.randomBytes(6).toString("hex");
        const doc = { id, createdAt: new Date().toISOString(), source: body.source || {}, beats: body.beats || [], analysis: body.analysis, plan: body.plan || null, ...(Array.isArray(body.members) ? { members: body.members } : { frames: body.frames }) };
        fs.writeFileSync(path.join(REPORTS, id + ".json"), JSON.stringify(doc));
        return json(res, 200, { id }), true;
      }
      if (req.method === "POST" && p === "/api/dance/coach") {
        if (!tools.claude) return json(res, 501, { error: "The local claude CLI is not available — the rule-based breakdown and plan still work." }), true;
        const body = await readBody(req);
        if (!body.report) return json(res, 400, { error: "report required" }), true;
        const text = await coach(body.report, body.lang === "ko" ? "ko" : "en");
        return json(res, 200, { text }), true;
      }
      return json(res, 404, { error: "not found" }), true;
    } catch (e) {
      json(res, 500, { error: String((e && e.message) || e) });
      return true;
    }
  };
};
