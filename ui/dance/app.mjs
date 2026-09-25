// Dance Lab — page controller.
import { analyzePose, groupSync, comparePoses, bodyScale, AXES, BONES, J, frameAt, matchWithTiming } from "./analyze.mjs";
import { analyzeChoreo } from "./choreo.mjs";
import { compareCover, motionEnvelope, alignEnvelopes } from "./compare.mjs";
import { buildPracticePlan, trendPlan, fmtTime, DRILL_BY_ID } from "./drills.mjs";
import { BUNDLED, rankTrends, youtubeSearch } from "./trends.mjs";
import { detectBeatsFromMedia, onsetFromMedia } from "./beat.mjs";
import { generateGroup } from "./synth.mjs";
import { buildMembers } from "./tracker.mjs";
import { cropPath, cropAt, toCrop, drawCrop, recordFancam } from "./fancam.mjs";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cssVar = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ── state ───────────────────────────────────────────────────────────────────
const S = {
  source: null,        // { kind: 'file'|'youtube'|'demo'|'saved', title, url, ytId, src, file }
  frames: [], beats: [], bpm: null, aspect: 16 / 9,
  analysis: null, plan: null, reportId: null,
  player: null,        // HTMLVideoElement or SkeletonClock
  loop: null, rate: 1, mirror: false, skeleton: true,
  busy: null,          // AbortController while analyzing
  tools: { ytdlp: false, claude: false },
  members: [],         // [{ id, name, color, coverage, frames, analysis, plan, paths }]
  sel: null,           // selected member id
  sync: null,          // groupSync result
  view: "full",        // 'full' | 'fancam'
  fanAspect: 9 / 16,
  trends: BUNDLED,     // trend catalog (server copy replaces it)
  target: "",          // targeted trend id ("" = closest)
};
const COLORS = ["#79D86C", "#F472B6", "#7FB5FF", "#FBBF24", "#A78BFA", "#FB923C", "#2DD4BF", "#F87171", "#E5E7EB"];
const selMember = () => S.members.find((m) => m.id === S.sel) || null;

// A clock that behaves like a <video> for skeleton-only playback
// (demo dancer, or a saved report whose video file isn't available).
class SkeletonClock {
  constructor(duration) { this.duration = duration; this._t = 0; this.paused = true; this.playbackRate = 1; this._last = 0; }
  get currentTime() { if (!this.paused) { const now = performance.now(); this._t += ((now - this._last) / 1000) * this.playbackRate; this._last = now; if (this._t >= this.duration) { this._t = this.duration; this.paused = true; } } return this._t; }
  set currentTime(v) { this._t = Math.max(0, Math.min(this.duration, v)); this._last = performance.now(); }
  play() { if (this._t >= this.duration) this._t = 0; this._last = performance.now(); this.paused = false; return Promise.resolve(); }
  pause() { void this.currentTime; this.paused = true; }
}

// ── status / chips ──────────────────────────────────────────────────────────
function setStatus(msg, err = false) { $("status").textContent = msg || ""; $("status").classList.toggle("err", !!err); }
function chip(id, text, cls) { const c = $(id); c.textContent = text; c.className = "chip" + (cls ? " " + cls : ""); }

async function loadTools() {
  try {
    S.tools = await (await fetch("/api/dance/status")).json();
  } catch {}
  chip("chip-yt", S.tools.ytdlp ? `yt-dlp: ready (${S.tools.ytdlpSource})` : S.tools.canInstallYtdlp ? "yt-dlp: installs on first fetch" : "yt-dlp: not installed", S.tools.ytdlp ? "ok" : "warn");
  chip("chip-coach", S.tools.claude ? "AI coach: claude CLI" : "AI coach: offline", S.tools.claude ? "ok" : "warn");
  $("fetch-note").textContent = S.tools.ytdlp ? (S.tools.ffmpeg ? "" : "No ffmpeg: the best single-file format is used (often 360p — fine for pose tracking).")
    : S.tools.canInstallYtdlp ? "First fetch installs the official yt-dlp build into workspace/dance/bin (SHA-256 checked)." : "yt-dlp isn't available for this platform — upload a clip instead.";
  $("fetch-go").textContent = S.tools.ytdlp ? "Fetch & analyze" : "Install yt-dlp, fetch & analyze";
  updateFetchBtn();
}
const canFetch = () => S.tools.ytdlp || S.tools.canInstallYtdlp;
function updateFetchBtn() { $("fetch-go").disabled = !($("ack").checked && canFetch()); }

// ── theme ───────────────────────────────────────────────────────────────────
function applyTheme(t) { document.body.dataset.theme = t; $("theme-tog").textContent = t === "dark" ? "☾" : "☀"; store.set("dance-theme", t); drawTimeline(); }
$("theme-tog").onclick = () => applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
applyTheme(store.get("dance-theme") || "dark");

// ── sources ─────────────────────────────────────────────────────────────────
function resetAnalysis() {
  S.frames = []; S.beats = []; S.bpm = null; S.analysis = null; S.plan = null; S.reportId = null; S.loop = null;
  S.members = []; S.sel = null; S.sync = null;
  renderAll();
}

function useVideo(src, meta) {
  const v = $("vid");
  $("yt").classList.add("hidden"); $("yt").src = "about:blank";
  v.classList.remove("hidden");
  v.src = src;
  v.playbackRate = S.rate;
  S.player = v;
  $("empty").classList.add("hidden");
  $("fetch").classList.remove("on");
  $("play").disabled = false;
  $("analyze").disabled = false;
  v.onloadedmetadata = () => { S.aspect = v.videoWidth / v.videoHeight || 16 / 9; setStageAspect(S.aspect); $("opt-end").placeholder = Math.floor(v.duration) + ""; };
  v.onerror = () => setStatus("This browser can't decode that video. Try an MP4 (H.264) file.", true);
  badge(meta.title || "");
}

// Shorts are 9:16 — size the stage to the video so it isn't a thin strip.
function setStageAspect(a) { const st = $("stage"); st.style.setProperty("--stage-ar", String(a)); st.style.setProperty("--stage-arn", String(a)); }
function badge(text) { const b = $("stage-badge"); b.textContent = text; b.classList.toggle("hidden", !text); }

$("file").onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  resetAnalysis();
  const prevYt = S.source && S.source.kind === "youtube" ? S.source : null;
  S.source = { kind: "file", title: prevYt ? prevYt.title : f.name, file: f, url: prevYt ? prevYt.url : null, ytId: prevYt ? prevYt.ytId : null };
  useVideo(URL.createObjectURL(f), S.source);
  setStatus(`Loaded ${f.name} (${(f.size / 1e6).toFixed(1)} MB). Press “Analyze dance”.`);
  e.target.value = "";
};

$("load-url").onclick = loadUrl;
$("url").onkeydown = (e) => { if (e.key === "Enter") loadUrl(); };
async function loadUrl() {
  const url = $("url").value.trim();
  if (!url) return;
  setStatus("Looking up the video…");
  let meta;
  try {
    const r = await fetch("/api/dance/meta?url=" + encodeURIComponent(url));
    meta = await r.json();
    if (!r.ok) throw new Error(meta.error || "lookup failed");
  } catch (e) { setStatus(String(e.message || e), true); return; }
  resetAnalysis();
  S.source = { kind: "youtube", title: meta.title || "YouTube video " + meta.id, author: meta.author, url, ytId: meta.id };
  // Already analyzed this Short? Open the saved report instantly.
  try {
    const list = await (await fetch("/api/dance/reports")).json();
    const hit = list.find((r) => r.ytId === meta.id);
    if (hit) { setStatus("Already analyzed — opening the saved report."); return openReport(hit.id); }
  } catch {}
  if (meta.cached) { useVideo(meta.src, S.source); setStatus("Using your locally fetched copy — analyzing…"); autoAnalyze(); return; }
  // Watch-only embed until the frames are available locally.
  $("vid").classList.add("hidden"); $("vid").removeAttribute("src");
  const yt = $("yt");
  yt.classList.remove("hidden");
  yt.src = `https://www.youtube-nocookie.com/embed/${meta.id}?rel=0`;
  $("empty").classList.add("hidden");
  $("fetch").classList.add("on");
  $("fetch-title").innerHTML = `<b>${esc(S.source.title)}</b>${meta.author ? " · " + esc(meta.author) : ""}<br><span style="color:var(--text-3)">Embedded players can't be read frame-by-frame. To analyze, fetch a local copy or upload a clip.</span>`;
  updateFetchBtn();
  $("play").disabled = true; $("analyze").disabled = true;
  S.player = null;
  badge("");
  setStatus("");
}
$("ack").onchange = updateFetchBtn;
// One click: (install yt-dlp) → fetch → analyze → report.
$("fetch-go").onclick = async () => {
  if (!S.source || !S.source.ytId) return;
  $("fetch-go").disabled = true;
  try {
    if (!S.tools.ytdlp) {
      setStatus("Installing the official yt-dlp build (checksum-verified)…");
      const ir = await fetch("/api/dance/tools/ytdlp/install", { method: "POST" });
      const ij = await ir.json();
      if (!ir.ok) throw new Error(ij.error || "yt-dlp install failed");
      await loadTools();
    }
    setStatus("Fetching the video with yt-dlp (720p max)…");
    const r = await fetch("/api/dance/fetch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: S.source.url, ack: true }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "fetch failed");
    useVideo(j.src, S.source);
    setStatus("Fetched — analyzing…");
    autoAnalyze();
  } catch (e) { setStatus(String(e.message || e), true); updateFetchBtn(); }
};
function autoAnalyze() {
  const v = $("vid");
  const go = () => { showTab("report"); $("analyze").click(); };
  if (v.readyState >= 1) go(); else v.addEventListener("loadedmetadata", go, { once: true });
}

$("demo").onclick = () => {
  resetAnalysis();
  const g = generateGroup({ bpm: 124, duration: 40 });
  S.source = { kind: "demo", title: "Demo group · 4 members · 124 BPM" };
  useSkeletonPlayer(g.duration);
  S.beats = g.beats; S.bpm = g.bpm; S.aspect = 16 / 9;
  finishMembers(g.members.map((m, i) => ({ id: i + 1, coverage: 1, frames: m.frames })), false);
  setStatus("Demo group loaded: member 2 dances ~120 ms late and member 4 dances a different routine — see the Members tab. Switch to 🎥 Fancam to follow one member.");
};

function useSkeletonPlayer(duration) {
  $("vid").classList.add("hidden"); $("vid").pause && $("vid").pause();
  $("yt").classList.add("hidden"); $("yt").src = "about:blank";
  $("fetch").classList.remove("on");
  $("empty").classList.add("hidden");
  S.player = new SkeletonClock(duration);
  setStageAspect(16 / 9);
  S.player.playbackRate = S.rate;
  $("play").disabled = false;
  $("analyze").disabled = true;
  badge(S.source ? S.source.title : "");
}

// ── analysis ────────────────────────────────────────────────────────────────
let landmarkerP = null, landmarkerKey = "";
async function getLandmarker(delegate = "GPU") {
  const model = $("opt-model").value;
  const key = model + "/" + delegate;
  if (!landmarkerP || (landmarkerKey !== key && !(delegate === "GPU" && landmarkerKey === model + "/CPU"))) {
    chip("chip-pose", "Pose engine: loading…", "warn");
    const { createLandmarker } = await import("./pose.mjs");
    landmarkerP = createLandmarker({ model, delegate });
    landmarkerKey = key;
  }
  try { const lm = await landmarkerP; chip("chip-pose", `Pose engine: ${lm.model} · ${lm.delegate}`, "ok"); return lm; }
  catch (e) { landmarkerP = null; chip("chip-pose", "Pose engine: failed", "warn"); throw new Error("Couldn't load MediaPipe from the CDN: " + (e.message || e)); }
}

$("analyze").onclick = async () => {
  if (!(S.player instanceof HTMLVideoElement)) return;
  const v = S.player;
  const ctrl = new AbortController();
  S.busy = ctrl;
  $("analyze").disabled = true; $("cancel").classList.remove("hidden");
  S.frames = []; S.analysis = null;
  try {
    setStatus("Loading pose model…");
    const [lm] = await Promise.all([getLandmarker(), v.readyState >= 1 ? null : new Promise((r) => v.addEventListener("loadedmetadata", r, { once: true }))]);
    const fps = +$("opt-fps").value;
    const start = Math.max(0, +$("opt-start").value || 0);
    const end = $("opt-end").value ? Math.min(v.duration, +$("opt-end").value) : v.duration;
    if (!(end > start + 2)) throw new Error("Pick a range of at least a few seconds.");
    // Beat tracking in parallel (audio decode) — optional, analysis still works without it.
    const beatsP = detectBeatsFromMedia(S.source.file || v.currentSrc).catch(() => null);
    setStatus(`Tracking every member at ${fps} fps… (~${Math.round((end - start) * fps)} frames)`);
    const t0 = performance.now();
    const { extractPoses } = await import("./pose.mjs");
    let n = 0;
    const { samples, aspect } = await extractPoses(v, lm, {
      fps, start, end, signal: ctrl.signal,
      onSlowGpu: () => { setStatus("GPU inference is slow here — switching the pose model to CPU…"); return getLandmarker("CPU"); },
      onProgress: (fr, sample) => {
        $("prog").style.width = Math.round(fr * 100) + "%";
        S.live = sample;
        const eta = ((performance.now() - t0) / 1000) * (1 - fr) / Math.max(fr, 1e-3);
        if (++n % 10 === 0) setStatus(`Tracking… ${Math.round(fr * 100)}% · ${sample.people.length} in frame · ~${Math.round(eta)} s left`);
      },
    });
    S.live = null;
    S.aspect = aspect;
    const members = buildMembers(samples, { aspect });
    if (!members.length) throw new Error("No dancer was tracked for long enough — try a clearer video or a different range.");
    setStatus("Detecting beats…");
    const beat = await beatsP;
    S.beats = beat && beat.beats.length ? beat.beats : [];
    S.bpm = beat && beat.bpm && beat.confidence >= 0.1 ? beat.bpm : null;
    if (!S.bpm) S.beats = [];
    finishMembers(members, !ctrl.signal.aborted || samples.length > 30);
  } catch (e) {
    setStatus(String(e.message || e), true);
  } finally {
    S.busy = null;
    $("analyze").disabled = false; $("cancel").classList.add("hidden");
  }
};
$("cancel").onclick = () => S.busy && S.busy.abort();

// Analyze every member, the group sync, then show the best-covered member.
async function finishMembers(members, save) {
  S.members = members.map((m, i) => {
    const analysis = analyzePose(m.frames, { beats: S.beats, bpm: S.bpm });
    return { ...m, name: m.name || `Member ${m.id}`, color: COLORS[i % COLORS.length], analysis, plan: analysis.ok ? buildPracticePlan(analysis) : null, paths: {} };
  });
  S.sync = groupSync(S.members.filter((m) => m.analysis.ok));
  const ok = S.members.filter((m) => m.analysis.ok);
  if (!ok.length) { renderAll(); setStatus(S.members[0].analysis.reason, true); return; }
  const best = ok.find((m) => m.main) || ok.slice().sort((a, b) => b.coverage - a.coverage)[0];
  selectMember(S.sel && ok.some((m) => m.id === S.sel) ? S.sel : best.id);
  $("prog").style.width = "100%";
  const q = best.analysis.quality;
  setStatus(`Done — ${S.members.length} member${S.members.length > 1 ? "s" : ""} tracked` + (S.sync ? `, group sync ${S.sync.overall}/100` : "") + `. ${q.analyzedSec}s analyzed for ${best.name}.` + (S.bpm ? ` Audio tempo ${S.bpm} BPM.` : " No usable audio beat; tempo estimated from motion."));
  if (save) {
    try {
      const r = await fetch("/api/dance/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        source: { kind: S.source.kind, title: S.source.title, url: S.source.url || null, ytId: S.source.ytId || null, aspect: S.aspect },
        beats: S.beats, analysis: S.analysis, plan: S.plan,
        members: S.members.map((m) => ({ id: m.id, name: m.name, coverage: m.coverage, main: m.main, frames: m.frames })),
      }) });
      const j = await r.json();
      if (j.id) { S.reportId = j.id; history.replaceState(null, "", "#r=" + j.id); loadRecent(); }
    } catch {}
  }
}

function selectMember(id) {
  const m = S.members.find((x) => x.id === id);
  if (!m) return;
  S.sel = id;
  S.frames = m.frames;
  S.analysis = m.analysis.ok ? m.analysis : null;
  S.plan = m.plan;
  S.loop = null;
  $("coach-out").innerHTML = "";
  renderAll();
  if (!m.analysis.ok) setStatus(`${m.name}: ${m.analysis.reason}`, true);
}

function renameMember(id) {
  const m = S.members.find((x) => x.id === id);
  if (!m) return;
  const name = prompt("Member name", m.name);
  if (name && name.trim()) { m.name = name.trim().slice(0, 24); renderAll(); }
}

async function openReport(id) {
  try {
    const r = await fetch("/api/dance/reports/" + id);
    if (!r.ok) throw new Error("Report not found");
    const doc = await r.json();
    resetAnalysis();
    S.source = { kind: "saved", title: doc.source.title, url: doc.source.url, ytId: doc.source.ytId };
    const members = doc.members || [{ id: 1, coverage: 1, frames: doc.frames }];
    S.beats = doc.beats || []; S.aspect = doc.source.aspect || 16 / 9;
    S.bpm = doc.analysis && doc.analysis.raw.bpmSource === "audio" ? doc.analysis.raw.bpm : null;
    S.reportId = id;
    let hasVideo = false;
    if (doc.source.ytId) {
      const m = await (await fetch("/api/dance/meta?url=" + encodeURIComponent("https://youtu.be/" + doc.source.ytId))).json().catch(() => ({}));
      if (m.cached) { useVideo(m.src, S.source); hasVideo = true; }
    }
    const f0 = members[0].frames;
    if (!hasVideo) useSkeletonPlayer(f0.length ? f0[f0.length - 1].t : 0);
    if (S.player) S.player.currentTime = f0.length ? f0[0].t : 0;
    await finishMembers(members, false);
    history.replaceState(null, "", "#r=" + id);
    setStatus(hasVideo ? "Saved analysis loaded." : "Saved analysis loaded (skeleton playback — upload the video again to see it underneath).");
  } catch (e) { setStatus(String(e.message || e), true); }
}

async function loadRecent() {
  try {
    const list = await (await fetch("/api/dance/reports")).json();
    const box = $("recent");
    if (!list.length) { box.innerHTML = '<span style="color:var(--text-4)">None yet.</span>'; return; }
    box.innerHTML = list.slice(0, 12).map((r) => `<button data-id="${esc(r.id)}"><b>${esc(r.title || r.id)}</b><span>${esc(r.archetype || "")}${r.bpm ? " · " + Math.round(r.bpm) + " BPM" : ""} · ${esc((r.createdAt || "").slice(0, 10))}</span></button>`).join("");
    box.querySelectorAll("button").forEach((b) => (b.onclick = () => openReport(b.dataset.id)));
  } catch {}
}

// ── rendering: breakdown ────────────────────────────────────────────────────
function renderAll() {
  const has = !!S.analysis;
  $("bd-empty").classList.toggle("hidden", has); $("bd").innerHTML = has ? breakdownHTML(S.analysis) : "";
  $("plan-empty").classList.toggle("hidden", has); $("plan").innerHTML = has ? planHTML(S.plan) : "";
  $("pr-empty").classList.toggle("hidden", has); $("pr").classList.toggle("hidden", !has);
  $("coach-empty").classList.toggle("hidden", has); $("coach").classList.toggle("hidden", !has);
  $("timeline-card").classList.toggle("hidden", !has);
  if (!has) $("coach-out").innerHTML = "";
  renderMembers();
  renderReport();
  if ($("pane-sheet").classList.contains("on")) renderCountSheet();
  else { $("cs").innerHTML = ""; $("cs-empty").classList.remove("hidden"); }
  wirePlan();
  document.querySelectorAll("#bd [data-trend]").forEach((b) => (b.onclick = () => setTarget(S.target === b.dataset.trend ? "" : b.dataset.trend)));
  drawTimeline();
  updateLoopChip();
}

function radarSVG(axes) {
  const n = AXES.length, cx = 110, cy = 110, R = 78;
  const pt = (i, r) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  let g = "";
  for (const lvl of [0.25, 0.5, 0.75, 1]) g += `<polygon points="${AXES.map((_, i) => pt(i, R * lvl).join(",")).join(" ")}" fill="none" stroke="var(--border-2)" stroke-width="1"/>`;
  AXES.forEach((a, i) => {
    const [x, y] = pt(i, R); const [lx, ly] = pt(i, R + 18);
    g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--border-2)"/>`;
    g += `<text x="${lx}" y="${ly}" font-size="10" font-weight="600" fill="var(--text-3)" text-anchor="middle" dominant-baseline="middle">${a.label}</text>`;
  });
  const poly = AXES.map((a, i) => pt(i, (R * Math.max(4, axes[a.key])) / 100).join(",")).join(" ");
  g += `<polygon points="${poly}" fill="var(--accent-bg)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
  AXES.forEach((a, i) => { const [x, y] = pt(i, (R * Math.max(4, axes[a.key])) / 100); g += `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)"><title>${a.label}: ${axes[a.key]}</title></circle>`; });
  return `<svg viewBox="0 0 220 220" role="img" aria-label="Style radar">${g}</svg>`;
}

function stat(k, n, unit, s) { return `<div class="stat"><div class="k">${k}</div><div class="n">${n ?? "–"}${unit ? `<small>${unit}</small>` : ""}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`; }
const pct = (x) => (x == null ? "–" : Math.round(x * 100));

function breakdownHTML(a) {
  const r = a.raw, arc = a.archetype;
  const axesHTML = AXES.map((x) => `<div class="axis"><span class="lbl">${x.label}</span><span class="track"><i style="width:${a.axes[x.key]}%"></i></span><span class="v">${a.axes[x.key]}</span></div>`).join("");
  const stats = [
    stat("Tempo", r.bpm ? Math.round(r.bpm) : "–", "BPM", r.bpmSource === "audio" ? "from audio" : r.bpmSource ? "from motion" : ""),
    stat("Energy", r.energy, "TL/s", `peak ${r.peakEnergy}`),
    stat("Hits", r.hitsPerMin, "/min", `${pct(r.hitRatio)}% of accents`),
    stat("Stop time", r.stopTime != null ? Math.round(r.stopTime * 1000) : "–", "ms", "after each hit"),
    stat("Flow", pct(r.continuity), "%", "time in motion"),
    stat("Arm reach", pct(r.extension), "%", "of full length"),
    stat("Knee angle", r.kneeAngle, "°", "180° = straight"),
    stat("Bounce", r.bounceAmp, "TL", r.bounceOnBeat == null ? "" : r.bounceOnBeat > 0.2 ? "down on the beat" : r.bounceOnBeat < -0.2 ? "up on the beat" : "not beat-locked"),
    stat("Upper body", pct(r.upperShare), "%", "of limb motion"),
    stat("Symmetry", pct(r.symmetry), "%", r.rightShare > 0.55 ? "right-leaning" : r.rightShare < 0.45 ? "left-leaning" : "balanced"),
    stat("Stamina", r.stamina != null ? pct(r.stamina) : "–", "%", "last ⅓ vs first ⅓"),
    stat("On beat", r.onBeat != null ? pct(r.onBeat) : "–", "%", r.onBeatChance != null ? `chance ${pct(r.onBeatChance)}%` : "needs audio"),
  ].join("");
  const li = (xs, minus) => xs.length ? xs.map((x) => `<div class="item${minus ? " minus" : ""}"><b>${esc(x.title)}</b><span>${esc(x.evidence)}</span></div>`).join("") : `<div class="item${minus ? " minus" : ""}"><span>Nothing stands out.</span></div>`;
  const q = a.quality;
  return `
    <div class="arch">
      <div class="radar">${radarSVG(a.axes)}</div>
      <div class="txt">
        <div class="kicker">Style profile</div>
        <h2>${esc(arc.primary.name)}</h2>
        <div class="tag">${esc(arc.primary.tagline)}</div>
        <div class="second">Also reads as: <b>${esc(arc.secondary.name)}</b></div>
      </div>
    </div>
    <div class="axes">${axesHTML}</div>
    ${trendFitHTML(a)}
    <div class="stats">${stats}</div>
    <div class="two">
      <div><div class="sub">What makes it work</div><div class="list">${li(a.strengths)}</div></div>
      <div><div class="sub">Trade-offs & watch-outs</div><div class="list">${li(a.tradeoffs, true)}</div></div>
    </div>
    <div class="footnote">Tracking: ${q.usablePct}% of ${q.frames} frames usable · ${q.cuts} camera cut(s) or tracking switch(es) · ${q.analyzedSec}s analyzed${q.maxPeople > 1 ? ` · up to ${q.maxPeople} people in frame (following the most central dancer)` : ""}.
    TL = torso-lengths (≈ 50 cm), so numbers are comparable across camera distances. Scores map raw values onto fixed reference ranges; the raw values are the evidence.</div>`;
}

// ── trends ──────────────────────────────────────────────────────────────────
const AXIS_SHORT = { power: "Power", sharpness: "Sharp", flow: "Flow", groove: "Groove", extension: "Lines", footwork: "Feet", levels: "Levels", rhythm: "Rhythm" };
async function loadTrends() {
  try { const r = await fetch("/api/dance/trends"); if (r.ok) S.trends = await r.json(); } catch {}
  renderTrends();
}
function trendRank(analysis) { return analysis && analysis.ok !== false && analysis.axes ? rankTrends(analysis.axes, S.trends) : []; }
function targetFit(analysis) {
  const rk = trendRank(analysis);
  return (S.target && rk.find((x) => x.id === S.target)) || rk[0] || null;
}
function renderTrends() {
  const T = S.trends;
  $("trends-asof").innerHTML = `as of ${esc(T.asOf)} · ${T.origin === "researched" ? "researched by claude" : "bundled snapshot"}${T.note ? ` · <span title="${esc(T.note)}">ⓘ</span>` : ""}`;
  const sel = $("trend-target");
  sel.innerHTML = '<option value="">closest trend (auto)</option>' + T.trends.map((t) => `<option value="${esc(t.id)}"${t.id === S.target ? " selected" : ""}>${esc(t.name)}${t.nameKo ? " · " + esc(t.nameKo) : ""}</option>`).join("");
  $("trend-cards").innerHTML = T.trends.map((t) => {
    const prof = Object.entries(t.profile).map(([k, v]) => `<div>${AXIS_SHORT[k] || k} ${v}<i><b style="width:${v}%"></b></i></div>`).join("");
    const ex = (t.examples || []).map((e) => `<div class="ex">🎵 <b>${esc(e.artist)}</b> – ${esc(e.song)} <span class="stag${e.status === "confirmed release" ? " ok" : ""}">${e.status === "confirmed release" ? "confirmed" : "reported"}</span>${e.date ? ` · ${esc(e.date)}` : ""} · <a href="${youtubeSearch(`${e.artist} ${e.song} dance practice`)}" target="_blank" rel="noopener">▶ practice video</a>${e.source ? ` · <a href="${esc(e.source)}" target="_blank" rel="noopener">src</a>` : ""}</div>`).join("");
    return `<div class="tcard${t.id === S.target ? " on" : ""}" data-id="${esc(t.id)}">
      <div><div class="nm">${esc(t.name)}</div>${t.nameKo ? `<div class="ko">${esc(t.nameKo)}</div>` : ""}</div>
      <div class="sum" title="${esc(t.summary)}">${esc(t.summary)}</div>
      ${t.pointMove ? `<div class="pm">✦ ${esc(t.pointMove)}</div>` : ""}
      <div class="prof">${prof}</div>
      ${ex}
      <div class="acts"><button class="btn sm" data-target="${esc(t.id)}">${t.id === S.target ? "✓ Targeted" : "🎯 Target this"}</button>
      <a class="btn sm" href="${youtubeSearch(`kpop ${t.name} dance challenge 2026`)}" target="_blank" rel="noopener">▶ Examples</a></div>
    </div>`;
  }).join("");
  $("trend-cards").querySelectorAll("[data-target]").forEach((b) => (b.onclick = () => setTarget(S.target === b.dataset.target ? "" : b.dataset.target)));
  $("recent-cb").innerHTML = (T.recent || []).length ? "Recent comebacks to analyze: " + T.recent.map((r) => `<a href="${youtubeSearch(`${r.artist} ${r.song} dance practice`)}" target="_blank" rel="noopener" title="Search the dance practice video on YouTube, then paste its link above">${esc(r.artist)} – ${esc(r.song)}${r.date ? ` <span style="color:var(--text-4)">${esc(r.date.slice(5) || r.date)}</span>` : ""}</a>`).join("") : "";
}
function setTarget(id) {
  S.target = id;
  store.set("dance-target", id);
  renderTrends();
  renderAll();
}
$("trend-target").onchange = (e) => setTarget(e.target.value);
$("trends-refresh").onclick = async () => {
  const b = $("trends-refresh");
  b.disabled = true; b.textContent = "↻ Researching… (1–3 min)";
  try {
    const r = await fetch("/api/dance/trends/refresh", { method: "POST" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "refresh failed");
    S.trends = j; renderTrends(); renderAll();
    setStatus(`Trends refreshed (${j.trends.length} styles, as of ${j.asOf}).`);
  } catch (e) { setStatus(String(e.message || e), true); }
  finally { b.disabled = false; b.textContent = "↻ Refresh trends"; }
};

function trendFitHTML(a) {
  const rk = trendRank(a);
  if (!rk.length) return "";
  const tf = targetFit(a);
  const rows = rk.slice(0, 3);
  if (S.target && !rows.some((x) => x.id === S.target)) rows.push(rk.find((x) => x.id === S.target));
  const gaps = tf.gaps.length ? tf.gaps.slice(0, 4).map((g) => `<span>${AXIS_SHORT[g.axis]} ${g.have}→${g.want} (${g.delta > 0 ? "+" : ""}${g.delta})</span>`).join("") : "Already on-profile — polish the point move and timing.";
  return `<div class="block"><h4>Trend fit · K-pop ${esc(S.trends.asOf)}</h4>
    <div class="tfit">${rows.map((x) => `<div class="row${x.id === tf.id ? " tgt" : ""}"><span class="nm" title="${esc(x.trend.nameKo || "")}">${esc(x.trend.name)}</span><span class="track"><i style="width:${x.fit}%"></i></span><span class="num">${x.fit}%</span><button class="btn sm" data-trend="${esc(x.id)}">${x.id === S.target ? "✓" : "🎯"}</button></div>`).join("")}</div>
    <div class="gaps"><b>${S.target ? "To hit your target" : "To lean into the closest trend"} (${esc(tf.trend.name)}):</b> ${gaps}</div></div>`;
}

// ── count sheet (choreography structure) ────────────────────────────────────
function memberChoreo(m) {
  if (!m || !m.analysis || !m.analysis.ok) return null;
  if (m.choreo === undefined) m.choreo = analyzeChoreo(m.frames, { beats: S.beats, bpm: m.analysis.raw.bpm, accents: m.analysis.accents });
  return m.choreo;
}
const PHRASE_COLORS = ["#79D86C", "#F472B6", "#7FB5FF", "#FBBF24", "#A78BFA", "#FB923C", "#2DD4BF", "#F87171"];
const phraseColor = (label) => (label === "?" ? "var(--surface-3)" : PHRASE_COLORS[(label.charCodeAt(0) - 65) % PHRASE_COLORS.length]);
function miniFigure(p, { hit, mirror }) {
  if (!p) return '<svg viewBox="0 0 60 76" class="fig"></svg>';
  const xs = [], ys = [];
  for (let j = 0; j < 13; j++) { xs.push(p[2 * j]); ys.push(p[2 * j + 1]); }
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sc = Math.min(48 / Math.max(1e-3, x1 - x0), 58 / Math.max(1e-3, y1 - y0));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const X = (x) => (30 + (mirror ? -1 : 1) * (x - cx) * sc).toFixed(1), Y = (y) => (40 + (y - cy) * sc).toFixed(1);
  const col = hit ? "var(--pink)" : "var(--accent)";
  let g = BONES.map(([a, b]) => `<line x1="${X(p[2 * J[a]])}" y1="${Y(p[2 * J[a] + 1])}" x2="${X(p[2 * J[b]])}" y2="${Y(p[2 * J[b] + 1])}"/>`).join("");
  const nx = X(p[2 * J.nose]), ny = Y(p[2 * J.nose + 1]);
  const smx = X((p[2 * J.ls] + p[2 * J.rs]) / 2), smy = Y((p[2 * J.ls + 1] + p[2 * J.rs + 1]) / 2);
  g += `<line x1="${smx}" y1="${smy}" x2="${nx}" y2="${ny}"/><circle cx="${nx}" cy="${ny}" r="4.5" fill="none"/>`;
  return `<svg viewBox="0 0 60 76" class="fig" stroke="${col}" stroke-width="2.6" stroke-linecap="round">${g}</svg>`;
}
function renderCountSheet() {
  const box = $("cs"), m = selMember();
  const c = S.analysis ? memberChoreo(m) : null;
  $("cs-empty").classList.toggle("hidden", !!c);
  $("cs-empty").textContent = S.analysis && !c ? "Not enough beat-aligned motion to build a count sheet for this member (needs ≥ 8 beats with tracking)." : "Analyze a video to get an automatic 8-count sheet: the key pose on every count, and which phrases repeat.";
  if (!c) { box.innerHTML = ""; return; }
  const seq = c.phrases.map((p) => `<button class="pblk" style="--pc:${phraseColor(p.label)}" data-loop="${p.start},${p.end}" title="${fmtTime(p.start)}–${fmtTime(p.end)}${p.mirrored ? " · mirrored" : ""}${p.sim ? " · match " + p.sim : ""}">${p.label}${p.mirrored ? "′" : ""}</button>`).join("");
  const learn = c.learnOrder.map((l) => `<b style="color:${phraseColor(l.label)}">${l.label}</b> ×${l.repeats} <span class="num" style="color:var(--text-4)">→ ${l.coverage}%</span>`).join(" · ");
  const cards = c.learnOrder.map((l) => {
    const cl = c.clusters.find((x) => x.label === l.label);
    const first = c.phrases[cl.occurrences[0]];
    const occ = cl.times.map((o) => `<button class="btn sm" data-loop="${o.start},${o.end}">${fmtTime(o.start)}${o.mirrored ? " ′" : ""}</button>`).join("");
    const cells = first.counts.map((k) => `<button class="cnt${k.hit ? " hit" : ""}" data-seek="${k.t}" title="${esc(k.desc.join(" · "))}">
        <div class="n">${k.n}${k.andHit ? '<span class="and">&</span>' : ""}</div>
        ${miniFigure(k.p, { hit: k.hit, mirror: S.mirror })}
        <div class="d">${k.desc.map(esc).join("<br>")}</div>
        ${k.hit ? '<div class="bdg">HIT</div>' : ""}${k.travel ? `<div class="tv">${esc(k.travel)}</div>` : ""}
      </button>`).join("");
    return `<div class="phrase" style="--pc:${phraseColor(l.label)}">
      <div class="ph-hd"><span class="ph-l">${l.label}</span><b>Phrase ${l.label}</b><span class="stag">×${cl.occurrences.length}</span>${cl.precision != null ? `<span class="stag ok" title="How identically the dancer repeats this phrase">precision ${cl.precision}</span>` : ""}
        <span class="ph-occ">${occ}</span>
        <button class="btn sm primary" data-drill="${first.start},${first.end}">Loop at 0.5x</button></div>
      ${first.common && first.common.length ? `<div class="footnote" style="margin:0 0 6px">Throughout: ${first.common.map(esc).join(" · ")}</div>` : ""}
      <div class="cells">${cells}</div></div>`;
  }).join("");
  box.innerHTML = `
    <div class="cs-sum">
      <div class="k">Structure · ${c.phrases.length} × 8-count · ${c.bpm} BPM (${c.gridSource === "audio" ? "audio beat grid" : "motion-fitted grid"})</div>
      <div class="pseq">${seq}</div>
      <div class="learn">Learn in this order: ${learn}</div>
    </div>
    <div class="footnote" style="margin:8px 0 12px">Key pose on every count, sides are the dancer's own (${S.mirror ? "figures shown mirrored to match ⇋ Mirror" : "figures as seen on screen"}). ′ = the same phrase done to the other side. Click a count to jump there; click a phrase block to loop it.</div>
    ${cards}`;
  box.querySelectorAll("[data-loop]").forEach((el) => (el.onclick = () => { const [a, b] = el.dataset.loop.split(",").map(Number); setLoop(a, b); }));
  box.querySelectorAll("[data-drill]").forEach((el) => (el.onclick = () => { const [a, b] = el.dataset.drill.split(",").map(Number); setRate(0.5); setLoop(a, b); }));
  box.querySelectorAll("[data-seek]").forEach((el) => (el.onclick = () => { if (S.player) { S.player.pause(); S.player.currentTime = +el.dataset.seek; } }));
}

// ── rendering: members ──────────────────────────────────────────────────────
function syncLabel(x) {
  return x >= 80 ? "칼군무 — razor-sharp unison" : x >= 68 ? "Tight unison" : x >= 55 ? "Loose unison / some solo parts" : "Mostly different parts per member";
}
function renderMembers() {
  const bar = $("members-bar"), ms = S.members;
  $("members-row").classList.toggle("hidden", !ms.length);
  $("export").disabled = !(S.player instanceof HTMLVideoElement && selMember());
  $("export").title = S.player instanceof HTMLVideoElement ? "Record the selected member's fancam as a video file" : "Needs the video (not available for the demo / skeleton playback)";
  bar.innerHTML = ms.map((m) => `<button class="mchip${m.id === S.sel ? " on" : ""}" data-id="${m.id}" style="--mc:${m.color}" title="Click to focus · double-click to rename"><i></i>${esc(m.name)}<span>${m.analysis.ok ? Math.round(m.coverage * 100) + "%" : "–"}</span></button>`).join("");
  bar.querySelectorAll(".mchip").forEach((b) => { b.onclick = () => selectMember(+b.dataset.id); b.ondblclick = () => renameMember(+b.dataset.id); });
  const has = ms.some((m) => m.analysis.ok);
  $("mem-empty").classList.toggle("hidden", has);
  $("mem").innerHTML = has ? membersHTML() : "";
  $("mem").querySelectorAll("[data-sel]").forEach((el) => (el.onclick = () => selectMember(+el.dataset.sel)));
  $("mem").querySelectorAll("[data-fancam]").forEach((el) => (el.onclick = () => { selectMember(+el.dataset.fancam); $("view").querySelector('[data-v="9:16"]').click(); }));
}
function membersHTML() {
  const ok = S.members.filter((m) => m.analysis.ok), sy = S.sync;
  const cols = [["power", "Power"], ["sharpness", "Sharp"], ["flow", "Flow"], ["groove", "Groove"], ["extension", "Lines"], ["footwork", "Feet"], ["rhythm", "Rhythm"]];
  const best = Object.fromEntries(cols.map(([k]) => [k, Math.max(...ok.map((m) => m.analysis.axes[k]))]));
  const syncOf = (m) => (sy && sy.perMember[m.id]) || {};
  const bestSync = Math.max(...ok.map((m) => syncOf(m).sync ?? -1));
  const rows = S.members.map((m) => {
    const a = m.analysis;
    if (!a.ok) return `<tr><td><span class="dot" style="background:${m.color}"></span>${esc(m.name)}</td><td colspan="${cols.length + 5}" style="color:var(--text-4)">${esc(a.reason)}</td></tr>`;
    const ps = syncOf(m);
    const lag = ps.lagMs == null ? "–" : Math.abs(ps.lagMs) < 40 ? "on time" : ps.lagMs > 0 ? `${ps.lagMs} ms late` : `${-ps.lagMs} ms early`;
    return `<tr class="${m.id === S.sel ? "sel" : ""}">
      <td><button class="link" data-sel="${m.id}"><span class="dot" style="background:${m.color}"></span>${esc(m.name)}</button></td>
      <td class="num">${Math.round(m.coverage * 100)}%</td>
      <td style="white-space:nowrap">${esc(a.archetype.primary.name.replace(/ \(.+\)/, ""))}</td>
      ${cols.map(([k]) => `<td class="num${a.axes[k] === best[k] && ok.length > 1 ? " best" : ""}">${a.axes[k]}</td>`).join("")}
      <td class="num${ps.sync === bestSync && ok.length > 1 ? " best" : ""}">${ps.sync ?? "–"}</td>
      <td class="num ${ps.lagMs != null && Math.abs(ps.lagMs) >= 80 ? "bad" : ""}">${lag}</td>
      <td style="white-space:nowrap">${(() => { const f = targetFit(a); return f ? `${esc(f.trend.name)} <b class="num">${f.fit}%</b>` : "–"; })()}</td>
      <td><button class="btn sm" data-fancam="${m.id}">🎥</button></td></tr>`;
  }).join("");
  const top = (label, fn, fmt) => {
    const c = ok.map((m) => [m, fn(m)]).filter(([, v]) => v != null).sort((a, b) => b[1] - a[1])[0];
    return c ? `<div class="stat"><div class="k">${label}</div><div class="n" style="color:${c[0].color};font-size:14px">${esc(c[0].name)}</div><div class="s">${fmt(c[1], c[0])}</div></div>` : "";
  };
  const stand = ok.length > 1 ? `<div class="stats">
    ${top("Sharpest hits", (m) => m.analysis.axes.sharpness, (v, m) => `${Math.round(m.analysis.raw.hitRatio * 100)}% sharp stops`)}
    ${top("Most power", (m) => m.analysis.raw.energy, (v) => `${v} TL/s`)}
    ${top("Longest lines", (m) => m.analysis.raw.extension, (v) => `${Math.round(v * 100)}% arm reach`)}
    ${top("Deepest groove", (m) => m.analysis.raw.bounceAmp, (v) => `${v} TL bounce`)}
    ${top("Most on the beat", (m) => m.analysis.axes.rhythm, (v) => `rhythm ${v}/100`)}
    ${sy ? top("Most in sync", (m) => syncOf(m).sync, (v) => `${v}/100 vs group`) : ""}
    ${sy ? top("Furthest off the count", (m) => (syncOf(m).lagMs == null ? null : Math.abs(syncOf(m).lagMs)), (v, m) => `${syncOf(m).lagMs > 0 ? "late" : "early"} by ${v} ms`) : ""}
  </div>` : "";
  let syncHTML = "";
  if (sy) {
    const X = (i) => (i / Math.max(1, sy.timeline.length - 1)) * 1000;
    const sm = sy.timeline.map((_, i) => { const w = sy.timeline.slice(Math.max(0, i - 5), i + 6); return [0, w.reduce((a, x) => a + x[1], 0) / w.length]; });
    const pts = sm.map(([, v], i) => `${X(i).toFixed(1)},${(58 - (v / 100) * 54).toFixed(1)}`).join(" ");
    syncHTML = `<div class="syncbox">
      <div><div class="k">Group sync</div><div class="big" style="font-size:36px">${sy.overall}<small>/100</small></div><div class="s">${syncLabel(sy.overall)} · in unison ${Math.round(sy.unison * 100)}% of the time</div></div>
      <svg viewBox="0 0 1000 60" preserveAspectRatio="none"><line x1="0" x2="1000" y1="${58 - 0.75 * 54}" y2="${58 - 0.75 * 54}" stroke="var(--border-2)" stroke-dasharray="4 4"/><polyline points="${pts}" fill="none" stroke="var(--pink)" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>
    </div>`;
  }
  return `${syncHTML}${stand}
    <div class="block"><h4>Member comparison</h4><div class="tblwrap"><table class="tbl mem"><thead><tr><th>Member</th><th class="num">Seen</th><th>Style</th>${cols.map(([, l]) => `<th class="num">${l}</th>`).join("")}<th class="num">Sync</th><th class="num">Timing</th><th>Trend fit</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="footnote">Click a member to switch every tab (Breakdown, Practice plan, Practice mode, AI coach) to them; 🎥 opens their fancam. Sync = average pose match with the other members (100 = identical); timing = median offset against the others. Members are numbered left→right; double-click a chip above the stage to rename.</div></div>`;
}

// ── rendering: plan ─────────────────────────────────────────────────────────
function planHTML(p) {
  const a = S.analysis;
  const cues = a.cues.map((c) => `<div class="cue"><b>${esc(c.title)}</b><span>${esc(c.cue)}</span></div>`).join("");
  const ladder = p.ladder.map((l) => `<div class="rung" data-rate="${l.speed}"><div class="x">${l.speed}x</div><div class="b">${l.bpm ? l.bpm + " BPM" : "—"}</div></div>`).join("");
  const focus = p.focus.length
    ? p.focus.map((s) => `<button class="btn sm" data-loop="${s.start},${s.end}">★${s.killing} ${fmtTime(s.start)}–${fmtTime(s.end)} · ${esc(s.focus)} · ${s.hits} hits</button>`).join("")
    : `<span style="color:var(--text-3);font-size:12px">Energy is even across the clip — loop each 8-count in order.</span>`;
  const drills = p.drills.map((d) => `<div class="drill"><div class="top"><b>${esc(d.name)}</b><span>${d.minutes} min</span></div><div class="why">${esc(d.why)}</div><ol>${d.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ol><div class="target">🎯 ${esc(d.target)}</div></div>`).join("");
  const session = p.session.map((b) => `<tr><td><b>${esc(b.block)}</b></td><td>${esc(b.detail)}</td><td class="num">${b.minutes} min</td></tr>`).join("");
  const weeks = p.weeks.map((w) => `<tr><td><b>Week ${w.week}</b><br><span style="color:var(--text-3)">${esc(w.goal)}</span></td><td colspan="2">${esc(w.detail)}</td></tr>`).join("");
  const tf = targetFit(a);
  const tp = tf ? trendPlan(a, tf) : null;
  const trendBlock = tp ? `<div class="block" style="margin-top:0"><h4>🎯 Trend target · ${esc(tp.trend.name)}${tp.trend.nameKo ? " · " + esc(tp.trend.nameKo) : ""} · fit ${tp.fit}%</h4>
      <div style="font-size:12px;color:var(--text-2);margin-bottom:8px">${esc(tp.trend.summary)}${tp.trend.pointMove ? ` <b>Point move:</b> ${esc(tp.trend.pointMove)}` : ""}</div>
      ${tp.gaps.length ? `<div class="gaps" style="margin-bottom:8px">${tp.gaps.map((g) => `<span>${AXIS_SHORT[g.axis]} ${g.have}→${g.want}</span>`).join("")}</div>` : ""}
      ${tp.cues.length ? `<div class="cues" style="margin-bottom:10px">${tp.cues.map((c) => `<div class="cue"><b>Trend cue</b><span>${esc(c)}</span></div>`).join("")}</div>` : ""}
      <div class="drills">${tp.drills.map((d) => `<div class="drill"><div class="top"><b>${esc(d.name)}</b><span>${d.minutes} min</span></div><div class="why">${esc(d.why)}</div><ol>${d.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ol><div class="target">🎯 ${esc(d.target)}</div></div>`).join("")}</div></div>` : "";
  return `${trendBlock}
    <div class="block"${tp ? "" : ' style="margin-top:0"'}><h4>How to get this feel</h4><div class="cues">${cues}</div></div>
    <div class="block"><h4>Tempo ladder ${p.bpm ? `· ${Math.round(p.bpm)} BPM (${p.bpmSource})` : ""}</h4><div class="ladder">${ladder}</div>
      <div class="footnote" style="margin-top:6px">Click a rung to set the playback speed. Move up only when your Practice-mode match score is ≥ 70.</div></div>
    <div class="block"><h4>Start here — killing-part candidates</h4><div class="focus">${focus}</div></div>
    <div class="block"><h4>Signature drills</h4><div class="drills">${drills}</div></div>
    <div class="block"><h4>One session · ${p.sessionMinutes} min</h4><table class="tbl"><tbody>${session}</tbody></table></div>
    <div class="block"><h4>3-week progression</h4><table class="tbl"><tbody>${weeks}</tbody></table></div>`;
}

function wirePlan() {
  document.querySelectorAll("#plan .rung").forEach((el) => (el.onclick = () => setRate(+el.dataset.rate)));
  document.querySelectorAll("#plan [data-loop]").forEach((el) => (el.onclick = () => { const [a, b] = el.dataset.loop.split(",").map(Number); setLoop(a, b); }));
}

// ── player controls ─────────────────────────────────────────────────────────
function setRate(r) {
  S.rate = r;
  if (S.player) S.player.playbackRate = r;
  document.querySelectorAll("#rate button").forEach((b) => b.classList.toggle("on", +b.dataset.r === r));
}
document.querySelectorAll("#rate button").forEach((b) => (b.onclick = () => setRate(+b.dataset.r)));
$("mirror").onclick = () => { S.mirror = !S.mirror; $("mirror").classList.toggle("on", S.mirror); $("flip").classList.toggle("mirrored", S.mirror); if ($("pane-sheet").classList.contains("on")) renderCountSheet(); };
$("skel").onclick = () => { S.skeleton = !S.skeleton; $("skel").classList.toggle("on", S.skeleton); };
$("play").onclick = () => { if (!S.player) return; S.player.paused ? S.player.play() : S.player.pause(); };
function setLoop(a, b) {
  S.loop = { start: a, end: b };
  if (S.player) { S.player.currentTime = a; S.player.play(); }
  updateLoopChip();
  drawTimeline();
}
function updateLoopChip() { const c = $("loopchip"); c.classList.toggle("on", !!S.loop); c.textContent = S.loop ? `⟲ ${fmtTime(S.loop.start)}–${fmtTime(S.loop.end)} ✕` : ""; }
$("loopchip").onclick = () => { S.loop = null; updateLoopChip(); drawTimeline(); };
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input,select,textarea")) return;
  if (e.code === "Space" && S.player) { e.preventDefault(); $("play").click(); }
});

// ── timeline ────────────────────────────────────────────────────────────────
function tlRange() {
  const a = S.analysis;
  if (!a || !a.energyCurve.length) return [0, 1];
  const t0 = Math.min(a.energyCurve[0][0], a.sections[0] ? a.sections[0].start : Infinity);
  const t1 = Math.max(a.energyCurve[a.energyCurve.length - 1][0], a.sections.length ? a.sections[a.sections.length - 1].end : 0);
  return [t0, Math.max(t1, t0 + 1)];
}
function drawTimeline() {
  const svg = $("timeline");
  const a = S.analysis;
  if (!a) { svg.innerHTML = ""; return; }
  const [t0, t1] = tlRange();
  const X = (t) => ((t - t0) / (t1 - t0)) * 1000;
  const maxE = Math.max(...a.energyCurve.map((p) => p[1]), 0.1);
  const col = { peak: "var(--pink)", build: "var(--amber)", groove: "var(--blue)", calm: "var(--surface-3)" };
  let g = "";
  for (const s of a.sections) {
    g += `<rect class="sec" data-a="${s.start}" data-b="${s.end}" x="${X(s.start) + 1}" y="72" width="${Math.max(2, X(s.end) - X(s.start) - 2)}" height="18" rx="3" fill="${col[s.label]}" opacity="0.85"><title>${fmtTime(s.start)}–${fmtTime(s.end)} · ${s.label} · energy ${s.energy} · ${s.hits} hits · ${s.focus}</title></rect>`;
    if (s.killing) g += `<text x="${(X(s.start) + X(s.end)) / 2}" y="85" font-size="11" font-weight="800" text-anchor="middle" fill="#fff" pointer-events="none">★${s.killing}</text>`;
  }
  for (const b of S.beats) if (b >= t0 && b <= t1) g += `<line x1="${X(b)}" x2="${X(b)}" y1="64" y2="68" stroke="var(--text-4)" stroke-width="1"/>`;
  const pts = a.energyCurve.map(([t, e]) => `${X(t).toFixed(1)},${(60 - (e / maxE) * 54).toFixed(1)}`);
  g += `<polyline points="${pts.join(" ")}" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
  for (const ac of a.accents) if (ac.hit) g += `<circle cx="${X(ac.t)}" cy="4" r="1.6" fill="var(--pink)"/>`;
  if (S.loop) g += `<rect x="${X(S.loop.start)}" y="0" width="${X(S.loop.end) - X(S.loop.start)}" height="92" fill="var(--pink-bg)" pointer-events="none"/>`;
  g += `<line id="playhead" x1="0" x2="0" y1="0" y2="96" stroke="var(--text)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
  svg.innerHTML = g;
  svg.querySelectorAll(".sec").forEach((r) => (r.onclick = (e) => { e.stopPropagation(); setLoop(+r.dataset.a, +r.dataset.b); }));
  svg.onclick = (e) => {
    if (!S.player) return;
    const box = svg.getBoundingClientRect();
    const t = t0 + ((e.clientX - box.left) / box.width) * (t1 - t0);
    if (S.loop && (t < S.loop.start || t > S.loop.end)) { S.loop = null; updateLoopChip(); drawTimeline(); }
    S.player.currentTime = t;
  };
}

// ── render loop: skeleton overlay, time, loop ───────────────────────────────
const overlay = $("overlay");
// map(x, y) → canvas px for a point in video units.
function drawSkeleton(ctx, f, map, style) {
  const P = (j) => map(f.p[2 * j], f.p[2 * j + 1]);
  ctx.lineCap = "round";
  ctx.globalAlpha = style.alpha ?? 1;
  ctx.strokeStyle = style.color; ctx.lineWidth = style.width;
  ctx.shadowColor = style.glow || "transparent"; ctx.shadowBlur = style.glow ? 12 : 0;
  for (const [a, b] of BONES) { const A = P(J[a]), B = P(J[b]); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
  const head = P(J.nose), ls = P(J.ls), rs = P(J.rs), sh = [(ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2];
  ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(head[0], head[1]); ctx.stroke();
  ctx.fillStyle = style.joint || style.color;
  for (let j = 0; j < 13; j++) { const q = P(j); ctx.beginPath(); ctx.arc(q[0], q[1], style.width * 0.9, 0, 7); ctx.fill(); }
  const hr = Math.max(style.width * 2.6, Math.hypot(ls[0] - rs[0], ls[1] - rs[1]) * 0.35);
  ctx.beginPath(); ctx.arc(head[0], head[1], hr, 0, 7); ctx.stroke();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  if (style.label) {
    ctx.save();
    ctx.translate(head[0], head[1] - hr - 8);
    if (S.mirror) ctx.scale(-1, 1); // text stays readable when the stage is mirrored
    ctx.font = "700 11px Pretendard, sans-serif"; ctx.textAlign = "center";
    const w = ctx.measureText(style.label).width + 10;
    ctx.fillStyle = "rgba(10,15,22,0.8)"; ctx.fillRect(-w / 2, -13, w, 16);
    ctx.fillStyle = style.color; ctx.fillText(style.label, 0, 0);
    ctx.restore();
  }
}
function fitRect(W, H, aspect) {
  const w = Math.min(W, H * aspect), h = w / aspect;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}
const fullMap = (rect, aspect) => (x, y) => [rect.x + (x / aspect) * rect.w, rect.y + y * rect.h];
function memberPath(m) {
  const key = S.fanAspect.toFixed(3);
  return (m.paths[key] ||= cropPath(m.frames, { outAspect: S.fanAspect, videoAspect: S.aspect }));
}
function skelStyle(m, selected, big) {
  return selected
    ? { color: m.color, width: big ? 5 : 3.5, glow: m.color, joint: "#fff", label: S.members.length > 1 ? m.name : null }
    : { color: m.color, width: big ? 3 : 2, alpha: 0.55, label: m.name };
}
function frameLoop() {
  const p = S.player;
  const dpr = window.devicePixelRatio || 1;
  const W = overlay.clientWidth, H = overlay.clientHeight;
  if (overlay.width !== Math.round(W * dpr) || overlay.height !== Math.round(H * dpr)) { overlay.width = Math.round(W * dpr); overlay.height = Math.round(H * dpr); }
  const ctx = overlay.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const isVideo = p instanceof HTMLVideoElement;
  const m = selMember();
  const fancam = S.view === "fancam" && m;
  $("vid").classList.toggle("ghost", !!(fancam && isVideo));
  if (p) {
    let t = p.currentTime;
    if (S.loop && (t >= S.loop.end || t < S.loop.start - 0.5)) { p.currentTime = S.loop.start; t = S.loop.start; }
    const skeletonOnly = !isVideo;
    if (skeletonOnly || fancam) { ctx.fillStyle = "#0b0f15"; ctx.fillRect(0, 0, W, H); }
    if (fancam) {
      const crop = cropAt(memberPath(m), t);
      const rect = fitRect(W, H, S.fanAspect);
      ctx.fillStyle = "#121a25"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      if (crop) {
        if (isVideo && p.readyState >= 2) drawCrop(ctx, p, crop, S.fanAspect, rect);
        const map = toCrop(crop, S.fanAspect, rect);
        ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
        if (skeletonOnly) {
          for (const o of S.members) { if (o === m) continue; const f = frameAt(o.frames, t); if (f) drawSkeleton(ctx, f, map, { ...skelStyle(o, false, true), label: null, alpha: 0.25 }); }
        }
        if (S.skeleton || skeletonOnly) { const f = frameAt(m.frames, t); if (f) drawSkeleton(ctx, f, map, { ...skelStyle(m, true, true), label: null }); }
        ctx.restore();
        // Minimap: whole stage with the virtual camera box.
        const mmW = Math.min(170, (W - rect.w) / 2 - 16 > 90 ? (W - rect.w) / 2 - 16 : 120), mm = { x: W - mmW - 10, y: 10, w: mmW, h: mmW / S.aspect };
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#000"; ctx.fillRect(mm.x - 2, mm.y - 2, mm.w + 4, mm.h + 4);
        if (isVideo && p.readyState >= 2) ctx.drawImage(p, mm.x, mm.y, mm.w, mm.h);
        const mmap = fullMap(mm, S.aspect);
        for (const o of S.members) { const f = frameAt(o.frames, t); if (f) drawSkeleton(ctx, f, mmap, { color: o.color, width: 1, alpha: o === m ? 1 : 0.5 }); }
        const cw = crop.h * S.fanAspect, a = mmap(crop.cx - cw / 2, crop.cy - crop.h / 2), b = mmap(crop.cx + cw / 2, crop.cy + crop.h / 2);
        ctx.strokeStyle = m.color; ctx.lineWidth = 1.5; ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        ctx.globalAlpha = 1;
      }
    } else {
      const rect = fitRect(W, H, S.aspect), map = fullMap(rect, S.aspect);
      if (skeletonOnly) {
        ctx.strokeStyle = "rgba(121,216,108,0.18)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rect.x, rect.y + rect.h * 0.78); ctx.lineTo(rect.x + rect.w, rect.y + rect.h * 0.78); ctx.stroke();
        const nb = S.beats.length ? Math.min(...S.beats.map((b) => Math.abs(b - t))) : 1;
        if (nb < 0.06) { ctx.fillStyle = "rgba(244,114,182,0.08)"; ctx.fillRect(0, 0, W, H); }
      }
      if (S.live) {
        for (const pp of S.live.people) drawSkeleton(ctx, pp, map, { color: COLORS[(pp.id - 1) % COLORS.length], width: 2.5, label: "#" + pp.id });
      } else if ((S.skeleton || skeletonOnly) && S.members.length) {
        for (const o of S.members) { if (o === m) continue; const f = frameAt(o.frames, t); if (f) drawSkeleton(ctx, f, map, skelStyle(o, false, skeletonOnly)); }
        if (m) { const f = frameAt(m.frames, t); if (f) drawSkeleton(ctx, f, map, skelStyle(m, true, skeletonOnly)); }
      }
    }
    $("time").textContent = `${fmtTime(t)} / ${fmtTime(p.duration || 0)}`;
    $("play").textContent = p.paused ? "▶ Play" : "❚❚ Pause";
    const ph = $("playhead");
    if (ph && S.analysis) { const [t0, t1] = tlRange(); const x = ((t - t0) / (t1 - t0)) * 1000; ph.setAttribute("x1", x); ph.setAttribute("x2", x); }
    if (skeletonOnly && !p.paused && S.source && S.source.kind === "demo") metronome(t);
  }
  requestAnimationFrame(frameLoop);
}
requestAnimationFrame(frameLoop);

// Click a dancer on the stage (full view) to select them.
$("stage").addEventListener("click", (e) => {
  if (S.view !== "full" || S.members.length < 2 || !S.player) return;
  const box = overlay.getBoundingClientRect();
  let x = e.clientX - box.left; const y = e.clientY - box.top;
  if (S.mirror) x = box.width - x;
  const rect = fitRect(box.width, box.height, S.aspect);
  const ux = ((x - rect.x) / rect.w) * S.aspect, uy = (y - rect.y) / rect.h;
  const t = S.player.currentTime;
  let best = null, bd = Infinity;
  for (const m of S.members) {
    const f = frameAt(m.frames, t);
    if (!f) continue;
    const hx = (f.p[2 * J.lh] + f.p[2 * J.rh]) / 2, hy = (f.p[2 * J.ls + 1] + f.p[2 * J.lh + 1]) / 2;
    const d = Math.hypot(hx - ux, hy - uy);
    if (d < bd) { bd = d; best = m; }
  }
  if (best && bd < 0.25) selectMember(best.id);
});

// ── fancam view + export ────────────────────────────────────────────────────
document.querySelectorAll("#view button").forEach((b) => (b.onclick = () => {
  const v = b.dataset.v;
  S.view = v === "full" ? "full" : "fancam";
  if (v !== "full") S.fanAspect = v === "9:16" ? 9 / 16 : 16 / 9;
  document.querySelectorAll("#view button").forEach((x) => x.classList.toggle("on", x === b));
}));

let exporting = null;
$("export").onclick = async () => {
  if (exporting) { exporting.abort(); return; }
  const m = selMember(), v = S.player;
  if (!m || !(v instanceof HTMLVideoElement)) return;
  const known = m.frames.filter((f) => f.p);
  const start = known[0].t, end = known[known.length - 1].t;
  const outAspect = S.fanAspect;
  const path = memberPath(m);
  exporting = new AbortController();
  $("export").textContent = "■ Stop export";
  setStatus(`Recording ${m.name}'s fancam in real time (${Math.round(end - start)} s)…`);
  try {
    const blob = await recordFancam(v, {
      outAspect, start, end, signal: exporting.signal,
      onProgress: (fr) => { $("prog").style.width = Math.round(fr * 100) + "%"; },
      draw: (ctx, t, W, H) => {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        const crop = cropAt(path, t);
        if (crop) drawCrop(ctx, v, crop, outAspect, { x: 0, y: 0, w: W, h: H });
        ctx.font = `700 ${Math.round(H / 40)}px Pretendard, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.textAlign = "left";
        ctx.fillText(`${m.name} FOCUS`, Math.round(W / 30), H - Math.round(H / 30));
      },
    });
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(S.source.title || "dance").replace(/[^\w가-힣-]+/g, "_").slice(0, 40)}_${m.name.replace(/\s+/g, "_")}_fancam.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setStatus(`Fancam saved: ${a.download} (${(blob.size / 1e6).toFixed(1)} MB). Zoomed crops are upscaled — a 1080p+ source looks best.`);
  } catch (e) {
    setStatus("Export failed: " + (e.message || e), true);
  } finally {
    exporting = null;
    $("export").textContent = "⬇ Export fancam";
  }
};

// Soft click on each beat for the demo dancer.
let audioCtx = null, lastBeatIdx = -1;
function metronome(t) {
  const idx = S.beats.findIndex((b) => b > t) - 1;
  if (idx < 0 || idx === lastBeatIdx) return;
  lastBeatIdx = idx;
  try {
    audioCtx ||= new AudioContext();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = idx % 4 === 0 ? 1400 : 1000;
    g.gain.setValueAtTime(0.08, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.07);
  } catch {}
}

// ── tabs ────────────────────────────────────────────────────────────────────
function showTab(name) { const t = document.querySelector(`.tab[data-tab="${name}"]`); if (t) t.click(); }
document.querySelectorAll(".tab").forEach((t) => (t.onclick = () => {
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === t));
  document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("on", p.id === "pane-" + t.dataset.tab));
  if (t.dataset.tab === "sheet") { $("cs-empty").textContent = "Building the count sheet…"; setTimeout(renderCountSheet, 30); }
}));

// ── practice mode ───────────────────────────────────────────────────────────
const P = { stopCam: null, stopLive: null, lm: null, session: null, lastUi: 0, lastUser: null, ghost: true, step: null };
$("ghost").onclick = () => { P.ghost = !P.ghost; $("ghost").classList.toggle("on", P.ghost); };

// Reference pose drawn onto the learner's own body (same hips, same size).
function drawGhost(ctx, uf, ref, map, mirror) {
  const hp = (f) => [(f.p[2 * J.lh] + f.p[2 * J.rh]) / 2, (f.p[2 * J.lh + 1] + f.p[2 * J.rh + 1]) / 2];
  const uc = hp(uf), rc = hp(ref), k = bodyScale(uf) / bodyScale(ref);
  const g = { p: ref.p.slice() };
  const other = (n) => (n[0] === "l" ? "r" + n.slice(1) : n[0] === "r" ? "l" + n.slice(1) : n);
  for (const n of Object.keys(J)) {
    const src = mirror ? J[other(n)] : J[n];
    const dx = (ref.p[2 * src] - rc[0]) * k, dy = (ref.p[2 * src + 1] - rc[1]) * k;
    g.p[2 * J[n]] = uc[0] + (mirror ? -dx : dx); g.p[2 * J[n] + 1] = uc[1] + dy;
  }
  drawSkeleton(ctx, g, map, { color: "rgba(121,216,108,0.9)", width: 6, alpha: 0.45 });
}

// Step mode: freeze on each count's key pose until the learner matches it.
function stepTimes() {
  const c = memberChoreo(selMember());
  let ts = c ? c.phrases.flatMap((p) => p.counts.map((k) => k.t)) : (S.beats.length ? S.beats : []);
  if (S.loop) ts = ts.filter((t) => t >= S.loop.start - 0.01 && t < S.loop.end);
  return ts;
}
$("step").onclick = () => {
  if (P.step) { P.step = null; $("step").classList.remove("on"); $("step-info").textContent = ""; return; }
  const times = stepTimes();
  if (times.length < 2 || !S.player) { $("step-info").textContent = "Step mode needs a beat grid — analyze a video with a steady beat first."; return; }
  const now = S.player.currentTime;
  let i = times.findIndex((t) => t >= now - 0.05); if (i < 0) i = 0;
  P.step = { times, i, heldSince: 0, until: null };
  S.player.pause(); S.player.currentTime = times[i];
  $("step").classList.add("on");
};
function stepTick(uf, mirror) {
  const st = P.step, pl = S.player;
  if (st.until != null) {
    if (pl.currentTime >= st.until - 0.02 || pl.paused) { pl.pause(); pl.currentTime = st.until; st.until = null; }
    return;
  }
  const ref = frameAt(S.frames, st.times[st.i]);
  const sc = ref ? comparePoses(uf, ref, { mirror }).score : 0;
  const now = performance.now();
  const need = 70;
  if (sc >= need) { st.heldSince ||= now; } else st.heldSince = 0;
  const c = memberChoreo(selMember());
  const ph = c && c.phrases.find((p) => p.counts.some((k) => Math.abs(k.t - st.times[st.i]) < 0.01));
  const cnt = ph && ph.counts.find((k) => Math.abs(k.t - st.times[st.i]) < 0.01);
  $("step-info").innerHTML = `👣 ${ph ? `Phrase <b>${ph.label}</b> · count <b>${cnt.n}</b>` : `Pose ${st.i + 1}/${st.times.length}`} — match <b class="${cls(sc)}">${sc}</b>/${need} ${cnt ? `<span style="color:var(--text-3)">(${esc(cnt.desc.join(" · "))})</span>` : ""}`;
  if (st.heldSince && now - st.heldSince > 350) {
    st.heldSince = 0;
    if (st.i + 1 >= st.times.length) { st.i = 0; pl.currentTime = st.times[0]; $("step-info").innerHTML = "🎉 Section complete — step mode restarted from the top. Turn it off to run it in time."; return; }
    st.i++;
    st.until = st.times[st.i];
    pl.play();
  }
}
const PART_LABEL = { leftArm: "Left arm", rightArm: "Right arm", leftLeg: "Left leg", rightLeg: "Right leg", torso: "Torso" };
const cls = (s) => (s >= 75 ? "good" : s >= 55 ? "mid" : "bad");

$("cam-start").onclick = async () => {
  if (P.stopCam) { stopCamera(); return; }
  try {
    $("live-lag").textContent = "Starting camera and pose model…";
    const { createLandmarker, openWebcam, runLive } = await import("./pose.mjs");
    P.lm ||= await createLandmarker({ model: "lite", numPoses: 1 });
    P.stopCam = await openWebcam($("cam"));
    P.stopLive = runLive($("cam"), P.lm, onUserFrame);
    $("cam-start").textContent = "📷 Stop camera";
    $("sess-start").disabled = false;
    $("live-lag").textContent = "Camera on. Step back until your whole body is visible, then start a session.";
  } catch (e) {
    $("live-lag").textContent = "Camera unavailable: " + (e.message || e);
  }
};
function stopCamera() {
  P.stopLive && P.stopLive(); P.stopCam && P.stopCam();
  P.stopLive = P.stopCam = null;
  $("cam-start").textContent = "📷 Start camera";
  $("sess-start").disabled = true;
  if (P.session) endSession();
}

function onUserFrame(uf) {
  const c = $("cam-overlay");
  const W = c.clientWidth, H = c.clientHeight, dpr = window.devicePixelRatio || 1;
  if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const cam = $("cam");
  const aspect = cam.videoWidth / cam.videoHeight || 16 / 9;
  if (!uf) return;
  const map = fullMap(fitRect(W, H, aspect), aspect);
  if (S.player && S.frames.length && P.ghost) {
    const ref = frameAt(S.frames, P.step ? P.step.times[P.step.i] : S.player.currentTime);
    if (ref) drawGhost(ctx, uf, ref, map, !S.mirror);
  }
  drawSkeleton(ctx, uf, map, { color: "rgba(244,114,182,0.95)", width: 3, joint: "#fff" });
  if (!S.player || !S.frames.length) return;
  if (P.step) { stepTick(uf, !S.mirror); return; }
  const t = S.player.currentTime;
  // Displayed mirrored → learner copies the same anatomical side → compare un-mirrored.
  const m = matchWithTiming(uf, S.frames, t, { mirror: !S.mirror });
  const now = performance.now();
  if (m && now - P.lastUi > 120) {
    P.lastUi = now;
    $("live-score").innerHTML = `<span class="${cls(m.score)}">${m.score}</span><small>/100</small>`;
    $("live-parts").innerHTML = Object.entries(m.parts).map(([k, v]) => `<div class="axis"><span class="lbl">${PART_LABEL[k]}</span><span class="track"><i style="width:${v}%;background:var(--${v >= 75 ? "accent" : v >= 55 ? "amber" : "red"})"></i></span><span class="v">${v}</span></div>`).join("");
    $("live-lag").textContent = m.bestScore < 50 ? "Find the pose — no close match nearby." : Math.abs(m.lagMs) < 90 ? "On time ✓" : m.lagMs > 0 ? `About ${m.lagMs} ms behind — anticipate the next count.` : `About ${-m.lagMs} ms ahead — let the music lead.`;
  }
  const sess = P.session;
  if (sess && m && !S.player.paused) {
    sess.scores.push(m.score);
    for (const [k, v] of Object.entries(m.parts)) (sess.parts[k] ||= []).push(v);
    if (m.bestScore >= 50) sess.lags.push(m.lagMs);
    sess.frames.push({ ...uf, t: Math.round(t * 1000) / 1000 });
    sess.byTime.push([t, m.score, m.bestScore >= 50 ? m.lagMs : null]);
  }
}

$("sess-start").onclick = () => {
  P.session = { scores: [], parts: {}, lags: [], frames: [], byTime: [], rate: S.rate, startedAt: Date.now() };
  $("sess-start").disabled = true; $("sess-stop").disabled = false;
  $("summary").innerHTML = "";
  if (S.player && S.player.paused) S.player.play();
};
$("sess-stop").onclick = () => endSession();

function endSession() {
  const s = P.session;
  P.session = null;
  $("sess-stop").disabled = true; $("sess-start").disabled = !P.stopCam;
  if (S.player) S.player.pause();
  if (!s || s.scores.length < 20) { $("summary").innerHTML = '<div class="footnote">Session too short to score — dance at least ~10 seconds.</div>'; return; }
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const med = (xs) => { const a = [...xs].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const partAvg = Object.entries(s.parts).map(([k, v]) => [k, Math.round(avg(v))]).sort((a, b) => a[1] - b[1]);
  const lag = s.lags.length ? med(s.lags) : null;
  // Per phrase: match + timing (median lag → rushing / dragging).
  const ch = memberChoreo(selMember());
  const spans = ch ? ch.phrases.map((p) => ({ start: p.start, end: p.end, name: `${p.label}${p.mirrored ? "′" : ""}`, kind: `phrase ${p.label}` }))
    : (S.analysis.sections || []).map((sec) => ({ start: sec.start, end: sec.end, name: sec.killing ? "★" : "", kind: sec.label }));
  const secRows = spans.map((sp) => {
    const rows = s.byTime.filter(([t]) => t >= sp.start && t < sp.end);
    if (rows.length < 5) return "";
    const sc = avg(rows.map((r) => r[1]));
    const lags = rows.map((r) => r[2]).filter((x) => x != null);
    const lg = lags.length >= 3 ? med(lags) : null;
    const timing = lg == null ? "–" : Math.abs(lg) < 70 ? "on time" : lg > 0 ? `dragging ${lg} ms` : `rushing ${-lg} ms`;
    return `<tr><td>${fmtTime(sp.start)}–${fmtTime(sp.end)} <b>${esc(sp.name)}</b></td><td>${esc(sp.kind)}</td><td class="num ${cls(sc)}">${Math.round(sc)}</td><td class="num ${lg != null && Math.abs(lg) >= 70 ? "bad" : ""}">${timing}</td></tr>`;
  }).join("");
  const you = analyzePose(s.frames, {});
  const ref = S.analysis.raw;
  const cmp = (label, rv, yv, unit, fmt = (x) => x) => {
    if (rv == null || yv == null) return "";
    const d = rv ? Math.round(((yv - rv) / Math.abs(rv)) * 100) : 0;
    return `<tr><td>${label}</td><td class="num">${fmt(rv)}${unit}</td><td class="num">${fmt(yv)}${unit}</td><td class="num ${Math.abs(d) <= 15 ? "good" : Math.abs(d) <= 35 ? "mid" : "bad"}">${d > 0 ? "+" : ""}${d}%</td></tr>`;
  };
  const yr = you.ok ? you.raw : null;
  const cmpRows = yr ? [
    cmp("Energy", ref.energy, yr.energy, " TL/s"),
    cmp("Hit ratio", ref.hitRatio, yr.hitRatio, "%", (x) => Math.round(x * 100)),
    cmp("Stop time", ref.stopTime, yr.stopTime, " ms", (x) => Math.round(x * 1000)),
    cmp("Arm reach", ref.extension, yr.extension, "%", (x) => Math.round(x * 100)),
    cmp("Bounce", ref.bounceAmp, yr.bounceAmp, " TL"),
    cmp("Knee angle", ref.kneeAngle, yr.kneeAngle, "°"),
    cmp("Flow", ref.continuity, yr.continuity, "%", (x) => Math.round(x * 100)),
  ].join("") : "";
  const worst = partAvg[0];
  $("summary").innerHTML = `
    <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-2);margin-bottom:8px">Session result · ${s.rate}x · ${Math.round((Date.now() - s.startedAt) / 1000)} s</h4>
    <div class="stats" style="margin-top:0">
      ${stat("Match", Math.round(avg(s.scores)), "/100", "average pose match")}
      ${stat("Timing", lag == null ? "–" : Math.abs(lag), lag == null ? "" : "ms", lag == null ? "" : Math.abs(lag) < 90 ? "on time" : lag > 0 ? "behind the dancer" : "ahead of the dancer")}
      ${stat("Weakest", PART_LABEL[worst[0]], "", worst[1] + "/100")}
    </div>
    ${yr ? `<div class="block"><h4>Reference vs you</h4><table class="tbl"><thead><tr><th>Measure</th><th class="num">Reference</th><th class="num">You</th><th class="num">Δ</th></tr></thead><tbody>${cmpRows}</tbody></table>
      <div class="footnote">Your speeds are measured in reference-time, so practising at ${s.rate}x is compared fairly. Within ±15% = green.</div></div>` : ""}
    ${secRows ? `<div class="block"><h4>By phrase</h4><table class="tbl"><thead><tr><th>Phrase</th><th>Type</th><th class="num">Match</th><th class="num">Timing</th></tr></thead><tbody>${secRows}</tbody></table></div>` : ""}
    <div class="footnote">Next: ${Math.round(avg(s.scores)) >= 70 ? (s.rate < 1 ? `you're ready for the next rung of the tempo ladder.` : "you're matching at full speed — record a full run.") : `stay at ${s.rate}x and drill the ${PART_LABEL[worst[0]].toLowerCase()}.`}</div>`;
}

// ── AI coach ────────────────────────────────────────────────────────────────
function mdToHtml(md) {
  const lines = esc(md).split("\n");
  let html = "", list = null;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  for (const ln of lines) {
    const ul = ln.match(/^\s*[-*]\s+(.*)/), ol = ln.match(/^\s*\d+\.\s+(.*)/), h = ln.match(/^(#{1,4})\s+(.*)/);
    const want = ul ? "ul" : ol ? "ol" : null;
    if (list && want !== list) { html += `</${list}>`; list = null; }
    if (h) html += `<h3>${inline(h[2])}</h3>`;
    else if (want) { if (!list) { html += `<${want}>`; list = want; } html += `<li>${inline((ul || ol)[1])}</li>`; }
    else if (ln.trim()) html += `<p>${inline(ln)}</p>`;
  }
  if (list) html += `</${list}>`;
  return html;
}
$("coach-go").onclick = async () => {
  if (!S.analysis) return;
  if (!S.tools.claude) { $("coach-out").innerHTML = '<p class="bad">The local <code>claude</code> CLI isn\'t available to the server. The Breakdown and Practice plan tabs are computed without it.</p>'; return; }
  $("coach-go").disabled = true;
  $("coach-out").innerHTML = '<p style="color:var(--text-3)">Writing your brief…</p>';
  try {
    const r = await fetch("/api/dance/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      lang: $("coach-lang").value,
      report: { source: { title: S.source && S.source.title }, member: selMember() && selMember().name, cover: (() => { const cv = selMember() && S.covers[selMember().id]; const x = cv && cv.result; return x && x.ok ? { grade: x.grade, poseMatch: x.match, styleMatch: x.styleMatch, lagMs: x.lagMs, strengths: x.strengths.map((w) => w.title + ": " + w.evidence), weaknesses: x.weaknesses.map((w) => w.title + ": " + w.evidence) } : null; })(), trendFit: trendRank(S.analysis).slice(0, 3).map((x) => ({ trend: x.trend.name, fit: x.fit, gaps: x.gaps })), trendTarget: S.target || null, structure: (() => { const c = memberChoreo(selMember()); return c ? { sequence: c.sequence.join(" "), learnOrder: c.learnOrder, precision: c.clusters.map((x) => ({ phrase: x.label, repeats: x.occurrences.length, precision: x.precision, at: x.times.map((o) => o.start) })) } : null; })(), groupSync: S.sync && selMember() ? { overall: S.sync.overall, member: S.sync.perMember[S.sel] } : null, ...S.analysis, plan: S.plan },
    }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "coach failed");
    $("coach-out").innerHTML = mdToHtml(j.text);
  } catch (e) { $("coach-out").innerHTML = `<p class="bad">${esc(e.message || e)}</p>`; }
  finally { $("coach-go").disabled = false; }
};

// ── report (the service output) ─────────────────────────────────────────────
const LEARN = {
  power: ["Project full energy", "Commit every move at full size and speed"],
  sharpness: ["Hit & freeze stops", "Move fast, then lock the pose dead still"],
  flow: ["Seamless transitions", "Finish each move into the next — no dead stops"],
  groove: ["Bounce & groove", "Keep the knees soft and ride the beat with the body"],
  extension: ["Finished lines", "Reach through the fingertips on every big shape"],
  footwork: ["Fast, clean footwork", "Learn the feet first; the arms come after"],
  levels: ["Level changes", "Drop and rise on the count, landing quietly"],
  rhythm: ["Musicality", "Land accents exactly on the beat"],
};
S.covers = {};
function renderReport() {
  const a = S.analysis, m = selMember();
  $("rp-empty").classList.toggle("hidden", !!a);
  if (!a) { $("rp").innerHTML = ""; return; }
  const r = a.raw, name = m ? m.name : "the dancer", multi = S.members.length > 1;
  const tf = targetFit(a);
  const ps = S.sync && m ? S.sync.perMember[m.id] : null;
  const thumb = S.source && S.source.ytId ? `<img src="https://i.ytimg.com/vi/${esc(S.source.ytId)}/hqdefault.jpg" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph'}))">` : '<div class="ph"></div>';
  const kpi = (v, l) => (v == null || v === "" ? "" : `<span class="kpi"><b>${v}</b>${l}</span>`);
  const sig = (S.plan && S.plan.signature) || [];
  const learnCards = sig.map((k) => {
    const [title, how] = LEARN[k] || [k, ""];
    const st = a.strengths.find((x) => x.axis === k);
    const dr = S.plan.drills.find((d) => d.axis === k);
    return `<div class="lc"><b>${esc(title)}</b> <span class="stag ok">${esc(AXIS_SHORT[k] || k)} ${a.axes[k]}</span>
      <div class="ev">${esc(how)}. ${esc(st ? st.evidence : "")}</div>
      ${dr ? `<div class="dr">Drill: ${esc(dr.name)} — ${esc(dr.target)}</div>` : ""}</div>`;
  }).join("");
  const li = (xs, minus) => xs.length ? xs.map((x) => `<div class="item${minus ? " minus" : ""}"><b>${esc(x.title)}</b><span>${esc(x.evidence)}</span></div>`).join("") : `<div class="item${minus ? " minus" : ""}"><span>Nothing stands out.</span></div>`;
  const c = m ? m.choreo : null;
  const route = c ? `<div class="pseq">${c.phrases.map((p) => `<button class="pblk" style="--pc:${phraseColor(p.label)}" data-loop="${p.start},${p.end}">${p.label}${p.mirrored ? "′" : ""}</button>`).join("")}</div>
      <div class="learn">Learn in this order: ${c.learnOrder.map((l) => `<b style="color:${phraseColor(l.label)}">${l.label}</b> ×${l.repeats} → ${l.coverage}%`).join(" · ")}</div>`
    : c === null ? '<div class="footnote">No steady beat grid — the learning route needs a clear pulse.</div>' : '<div class="footnote" id="rp-route-wait">Building the learning route…</div>';
  const cv = m ? S.covers[m.id] : null;
  $("rp").innerHTML = `
    <div class="rp-hero">${thumb}<div>
      <div class="kicker" style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.08em">Dance report${multi ? ` · ${esc(name)}` : ""}</div>
      <h2>${esc((S.source && S.source.title) || "Dance video")}</h2>
      <div class="meta">${esc(a.archetype.primary.name)} — ${esc(a.archetype.primary.tagline)}</div>
      <div class="rp-kpis">${kpi(r.bpm ? Math.round(r.bpm) : null, "BPM")}${kpi(r.hitsPerMin, "hits/min")}${kpi(r.stopTime != null ? Math.round(r.stopTime * 1000) : null, "ms stops")}${kpi(Math.round(r.extension * 100), "% reach")}${tf ? kpi(tf.fit + "%", " " + esc(tf.trend.name)) : ""}${ps && ps.sync != null ? kpi(ps.sync, "/100 group sync") : ""}</div>
    </div></div>
    <div class="controls" style="justify-content:flex-end;margin-top:8px"><button class="btn sm" id="rp-dl">⬇ Download report</button></div>
    <div class="block"><h4>What you can learn from ${esc(name)}</h4><div class="learn-cards">${learnCards}</div>
      <div class="cues" style="margin-top:10px">${a.cues.slice(0, 3).map((q) => `<div class="cue"><b>${esc(q.title)}</b><span>${esc(q.cue)}</span></div>`).join("")}</div></div>
    <div class="two"><div><div class="sub">${esc(name)}'s strengths</div><div class="list">${li(a.strengths)}</div></div>
      <div><div class="sub">Weak spots — don't copy these</div><div class="list">${li(a.tradeoffs, true)}</div></div></div>
    <div class="block"><h4>Learning route</h4>${route}</div>
    <div class="block"><h4>Your cover vs ${esc(name)}</h4>
      <div class="cover-box">
        <div class="controls" style="margin:0">
          <button class="btn primary sm" id="cv-upload">⬆ Upload my cover</button>
          <button class="btn sm" id="cv-record" title="Plays the idol's video (or the looped phrase) and records you with the webcam — perfectly synced">⏺ Record my cover</button>
          <button class="btn sm" id="cv-demo" title="A synthetic learner: late and with softer hits">✨ Demo cover</button>
          <span class="footnote" style="margin:0">Film full-body, one person, same song. It's synced automatically (by the music, or by motion).</span>
        </div>
        <div id="cv-stage"></div>
        <div class="status" id="cv-status"></div>
        <div id="cv-result">${cv ? coverHTML(cv, name) : ""}</div>
      </div></div>`;
  $("rp").querySelectorAll("[data-loop]").forEach((el) => (el.onclick = () => { const [x, y] = el.dataset.loop.split(",").map(Number); setLoop(x, y); }));
  $("rp").querySelectorAll("[data-fix]").forEach((el) => (el.onclick = () => { const [x, y] = el.dataset.fix.split(",").map(Number); setRate(0.5); setLoop(x, y); showTab("practice"); }));
  $("rp-dl").onclick = downloadReport;
  $("cv-upload").onclick = () => $("cover-file").click();
  $("cv-record").onclick = recordCover;
  $("cv-demo").onclick = demoCover;
  if (m && m.choreo === undefined) setTimeout(() => { memberChoreo(m); if (S.analysis === a) renderReport(); }, 50);
}

function coverHTML(cv, name) {
  const x = cv.result;
  if (!x.ok) return `<div class="status err">${esc(x.reason)}</div>`;
  const gcol = x.grade === "S" || x.grade === "A" ? "var(--accent)" : x.grade === "B" ? "var(--amber)" : "var(--red)";
  const lag = x.lagMs == null ? "–" : Math.abs(x.lagMs) < 70 ? "on time" : x.lagMs > 0 ? `dragging ${x.lagMs} ms` : `rushing ${-x.lagMs} ms`;
  const li = (xs, minus) => xs.length ? xs.map((w) => `<div class="item${minus ? " minus" : ""}"><b>${esc(w.title)}</b><span>${esc(w.evidence)}</span></div>`).join("") : `<div class="item${minus ? " minus" : ""}"><span>${minus ? "No major gaps found." : "Keep going — strengths appear as your match improves."}</span></div>`;
  const fixes = x.fixes.map((f, i) => {
    const d = f.drill && DRILL_BY_ID[f.drill];
    const loop = f.start != null ? `${f.start},${f.end}` : (S.plan && S.plan.focus[0] ? `${S.plan.focus[0].start},${S.plan.focus[0].end}` : null);
    return `<div class="drill"><div class="top"><b>${i + 1}. ${esc(f.title)}</b></div><div class="why">${esc(f.evidence)}</div>
      ${d ? `<ol>${(typeof d.how === "function" ? d.how(S.analysis.raw) : d.how).map((h) => `<li>${esc(h)}</li>`).join("")}</ol><div class="target">🎯 ${esc(d.name)}: ${esc(d.target(S.analysis.raw))}</div>` : ""}
      ${loop ? `<button class="btn sm" style="margin-top:6px" data-fix="${loop}">Practice this part at 0.5x →</button>` : ""}</div>`;
  }).join("");
  const axes = x.axes.map((a) => `<div class="vs"><span>${esc(a.label)}</span><span class="bar" title="${esc(name)} ${a.idol}"><i class="idol" style="width:${a.idol}%"></i></span><span class="bar" title="You ${a.you}"><i style="width:${a.you}%"></i></span><span class="num ${a.delta <= -15 ? "bad" : a.delta >= -8 ? "good" : "mid"}">${a.delta > 0 ? "+" : ""}${a.delta}</span></div>`).join("");
  const metrics = x.metrics.map((mt) => `<tr><td>${esc(mt.label)}</td><td class="num">${esc(mt.idol)}</td><td class="num">${esc(mt.you)}</td><td class="num">${mt.deltaPct > 0 ? "+" : ""}${mt.deltaPct}%</td></tr>`).join("");
  const spans = x.spans.map((sp) => `<button class="pblk" style="--pc:${sp.match >= 75 ? "var(--accent)" : sp.match >= 55 ? "var(--amber)" : "var(--red)"};min-width:44px" data-fix="${sp.start},${sp.end}" title="${fmtTime(sp.start)}–${fmtTime(sp.end)}${sp.lagMs != null ? ` · ${sp.lagMs} ms` : ""}">${sp.label || fmtTime(sp.start)} ${sp.match}</button>`).join("");
  return `<div class="gradebox" style="margin-top:10px">
      <div class="grade" style="color:${gcol}">${x.grade}</div>
      <div class="rp-kpis" style="margin:0">${`<span class="kpi"><b>${x.match}</b>/100 pose match</span>`}${x.styleMatch != null ? `<span class="kpi"><b>${x.styleMatch}</b>/100 style match</span>` : ""}<span class="kpi"><b>${esc(lag)}</b></span><span class="kpi">${esc(cv.method)} · ${x.overlapSec}s compared${x.mirror ? " · mirrored" : ""}</span></div></div>
    ${/motion|demo/.test(cv.method) ? '<div class="footnote">Synced by motion: a constant delay is absorbed by the sync, so timing here is relative — use a cover with the song\'s audio (or ⏺ Record) for absolute timing. The rhythm score still uses the song\'s beat grid.</div>' : ""}
    <div class="two"><div><div class="sub">Your strengths</div><div class="list">${li(x.strengths)}</div></div>
      <div><div class="sub">Your weaknesses</div><div class="list">${li(x.weaknesses, true)}</div></div></div>
    ${fixes ? `<div class="block"><h4>Fix these first</h4><div class="drills">${fixes}</div></div>` : ""}
    <div class="block"><h4>Style: ${esc(name)} <span style="color:var(--pink)">■</span> vs you <span style="color:var(--accent)">■</span></h4><div style="display:grid;gap:5px">${axes}</div></div>
    ${metrics ? `<div class="block"><h4>Measured</h4><table class="tbl"><thead><tr><th>Measure</th><th class="num">${esc(name)}</th><th class="num">You</th><th class="num">Δ</th></tr></thead><tbody>${metrics}</tbody></table></div>` : ""}
    ${spans ? `<div class="block"><h4>Match by phrase</h4><div class="pseq">${spans}</div></div>` : ""}`;
}

// ── cover pipeline: upload / record / demo → track → sync → compare ─────────
function coverStatus(msg, err) { const el = $("cv-status"); if (el) { el.textContent = msg || ""; el.classList.toggle("err", !!err); } }
async function trackCover(src) {
  const v = $("cover-vid");
  const stage = $("cv-stage");
  if (stage) { stage.appendChild(v); v.classList.remove("hidden"); v.style.cssText = "max-height:220px;max-width:100%;border-radius:10px;margin-top:10px;background:#000"; }
  v.srcObject = null; v.src = src; v.muted = true;
  await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error("Can't decode this video — try an MP4.")); });
  const lm = await getLandmarker();
  const { extractPoses } = await import("./pose.mjs");
  if (S.player && !S.player.paused) S.player.pause();
  const { samples, aspect } = await extractPoses(v, lm, { fps: 15, onSlowGpu: () => getLandmarker("CPU"), onProgress: (fr) => coverStatus(`Tracking you… ${Math.round(fr * 100)}%`) });
  const ms = buildMembers(samples, { aspect, minCoverage: 0.15 });
  const me = ms.find((x) => x.main) || ms[0];
  if (!me) throw new Error("No one was tracked in the cover — film full-body with good light.");
  return me.frames;
}
async function finishCover(frames, { shift, method, coverSrc }) {
  const m = selMember();
  let sh = shift, how = method;
  if (sh == null) {
    let audio = null;
    try {
      const refSrc = S.source && (S.source.file || (S.player instanceof HTMLVideoElement ? S.player.currentSrc : null));
      if (refSrc && coverSrc) { coverStatus("Syncing by the music…"); const [ea, eb] = await Promise.all([onsetFromMedia(refSrc), onsetFromMedia(coverSrc)]); audio = alignEnvelopes(ea, eb, { maxLagSec: 90 }); }
    } catch {}
    if (audio && audio.confidence >= 0.25) { sh = audio.shift; how = `synced by music (${Math.round(audio.confidence * 100)}%)`; }
    else { const mo = alignEnvelopes(motionEnvelope(S.frames), motionEnvelope(frames), { maxLagSec: 90 }); sh = mo.shift; how = `synced by motion (${Math.round(mo.confidence * 100)}%)`; }
  }
  coverStatus("Comparing…");
  // Same song ⇒ same beat grid: score the cover's rhythm against the idol's beats (shifted into cover time).
  const beats = S.beats.map((b) => b - sh).filter((b) => b >= 0);
  const analysis = analyzePose(frames, beats.length >= 8 ? { beats, bpm: S.bpm } : {});
  const ch = memberChoreo(m);
  const result = compareCover({ ref: { frames: S.frames, analysis: S.analysis }, cover: { frames, analysis }, shift: sh, phrases: ch ? ch.phrases.map((p) => ({ start: p.start, end: p.end, label: p.label + (p.mirrored ? "′" : "") })) : null });
  S.covers[m.id] = { result, method: how, at: Date.now() };
  renderReport();
  coverStatus(result.ok ? `Done — offset ${sh >= 0 ? "+" : ""}${sh.toFixed(2)} s.` : "", !result.ok);
}
$("cover-file").onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f || !S.analysis) return;
  try { const url = URL.createObjectURL(f); const frames = await trackCover(url); await finishCover(frames, { coverSrc: f }); }
  catch (err) { coverStatus(String(err.message || err), true); }
};
async function recordCover() {
  if (!S.player || !S.analysis) return;
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { coverStatus("Camera unavailable: " + (e.message || e), true); return; }
  const v = $("cover-vid"), stage = $("cv-stage");
  stage.appendChild(v); v.classList.remove("hidden"); v.style.cssText = "max-height:220px;max-width:100%;border-radius:10px;margin-top:10px;transform:scaleX(-1)";
  v.srcObject = stream; v.muted = true; await v.play();
  const known = S.frames.filter((f) => f.p);
  const start = S.loop ? S.loop.start : known[0].t, end = S.loop ? S.loop.end : known[known.length - 1].t;
  for (const n of [3, 2, 1]) { coverStatus(`Get in position… ${n}`); await new Promise((r) => setTimeout(r, 1000)); }
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  const rec = new MediaRecorder(stream, { mimeType: types.find((t) => MediaRecorder.isTypeSupported(t)) || "" });
  const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  S.player.pause(); S.player.currentTime = start;
  await S.player.play();
  rec.start(250);
  const refStart = S.player.currentTime;
  const btn = $("cv-record"); btn.textContent = "■ Stop recording";
  let stopped = false; btn.onclick = () => { stopped = true; };
  await new Promise((r) => { const tick = () => (stopped || S.player.paused || S.player.currentTime >= end ? r() : (coverStatus(`Recording… ${fmtTime(S.player.currentTime)} / ${fmtTime(end)}`), requestAnimationFrame(tick))); tick(); });
  S.player.pause();
  const done = new Promise((r) => (rec.onstop = r)); rec.stop(); await done;
  stream.getTracks().forEach((t) => t.stop()); v.srcObject = null; v.style.transform = "";
  try {
    const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
    const frames = await trackCover(URL.createObjectURL(blob));
    await finishCover(frames, { shift: refStart, method: "synced by recording" });
  } catch (err) { coverStatus(String(err.message || err), true); }
}
// A synthetic learner for the demo: 150 ms late with softer hits, starting 2 s in.
function demoCover() {
  if (!S.analysis) return;
  const known = S.frames.filter((f) => f.p);
  const t0 = known[0].t + 2, t1 = known[known.length - 1].t;
  const frames = [];
  for (let t = t0; t < t1; t += 1 / 15) {
    const a = frameAt(S.frames, t - 0.15), b = frameAt(S.frames, t - 0.33);
    if (a && b) frames.push({ t: Math.round((t - t0) * 1000) / 1000, p: a.p.map((x, i) => 0.5 * x + 0.5 * b.p[i]), v: a.v });
  }
  finishCover(frames, { method: "demo" }).catch((e) => coverStatus(String(e.message || e), true));
}

function downloadReport() {
  const clone = $("rp").cloneNode(true);
  clone.querySelectorAll("button:not(.pblk), .cover-box > .controls, video, #cv-stage, #cv-status").forEach((el) => el.remove());
  const css = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
  const title = `${(S.source && S.source.title) || "Dance"} — Dance Lab report`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body data-theme="${document.body.dataset.theme}"><main style="max-width:920px;margin:24px auto;padding:0 16px">${clone.innerHTML}<p class="footnote">Generated by 10XAI Dance Lab · ${new Date().toISOString().slice(0, 10)}</p></main></body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = title.replace(/[^\w가-힣-]+/g, "_").slice(0, 60) + ".html";
  document.body.appendChild(a); a.click(); a.remove();
}

// ── boot ────────────────────────────────────────────────────────────────────
S.target = store.get("dance-target") || "";
loadTools();
loadTrends();
loadRecent();
renderAll();
const m = location.hash.match(/r=([a-f0-9]{12})/);
if (m) openReport(m[1]);
