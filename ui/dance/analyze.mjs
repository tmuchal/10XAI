// Dance Lab — pose-sequence analysis engine.
// Pure JS (browser + node). Input: pose frames sampled from a video.
// Output: raw measurements, 0–100 style axes, style archetype, strengths,
// trade-offs, sections ("killing part" candidates), and feel cues.
//
// Frame format:  { t: seconds, p: [x0,y0, x1,y1, …] | null, v: [vis0, vis1, …] }
// Coordinates are in image-height units (x already multiplied by width/height),
// y grows downward. Joint order is JOINTS below.

export const JOINTS = ["nose", "ls", "rs", "le", "re", "lw", "rw", "lh", "rh", "lk", "rk", "la", "ra"];
export const MP_INDEX = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]; // MediaPipe BlazePose ids
export const J = Object.fromEntries(JOINTS.map((n, i) => [n, i]));
export const BONES = [["ls", "rs"], ["ls", "le"], ["le", "lw"], ["rs", "re"], ["re", "rw"], ["ls", "lh"], ["rs", "rh"],
  ["lh", "rh"], ["lh", "lk"], ["lk", "la"], ["rh", "rk"], ["rk", "ra"]];

const LIMBS = ["lw", "rw", "le", "re", "lk", "rk", "la", "ra", "nose"].map((n) => J[n]);
const UPPER = ["lw", "rw", "le", "re"].map((n) => J[n]);
const LOWER = ["lk", "rk", "la", "ra"].map((n) => J[n]);
const LEFT = ["lw", "le", "lk", "la"].map((n) => J[n]);
const RIGHT = ["rw", "re", "rk", "ra"].map((n) => J[n]);

// ── small math helpers ───────────────────────────────────────────────────────
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
function quantile(a, q) {
  if (!a.length) return 0;
  const s = Float64Array.from(a).sort();
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
const median = (a) => quantile(a, 0.5);
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))); };
const round = (x, d = 2) => (x == null || !isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
// Linear map of a raw value onto 0–100 between a "low" and a "high" reference.
const score = (x, lo, hi) => Math.round(100 * clamp((x - lo) / (hi - lo)));

function pt(f, j) { return [f.p[2 * j], f.p[2 * j + 1]]; }
function mid(f, a, b) { return [(f.p[2 * a] + f.p[2 * b]) / 2, (f.p[2 * a + 1] + f.p[2 * b + 1]) / 2]; }
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function angleAt(a, b, c) { // interior angle at b, degrees
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const d = Math.hypot(...v1) * Math.hypot(...v2);
  if (!d) return 180;
  return (Math.acos(clamp((v1[0] * v2[0] + v1[1] * v2[1]) / d, -1, 1)) * 180) / Math.PI;
}
function torso(f) { return dist(mid(f, J.ls, J.rs), mid(f, J.lh, J.rh)); }
// Body scale that survives bending (torso foreshortens, shoulders don't) and
// turning sideways (shoulders narrow, torso doesn't). ≈ torso length when upright.
function bodyScale(f) { return Math.max(torso(f), 1.4 * dist(pt(f, J.ls), pt(f, J.rs))); }

// Convert one MediaPipe pose (33 normalized landmarks) into our compact frame.
export function fromMediaPipe(landmarks, aspect, t) {
  const p = [], v = [];
  for (const i of MP_INDEX) {
    const l = landmarks[i];
    p.push(round(l.x * aspect, 4), round(l.y, 4));
    v.push(round(l.visibility ?? 1, 2));
  }
  return { t: round(t, 3), p, v };
}

// ── 1. preprocessing: validity, camera-cut segmentation, smoothing ───────────
export function segmentFrames(frames, { minVis = 0.5, minSegSec = 1.0 } = {}) {
  const valid = frames.filter((f) => f && f.p && f.p.length === JOINTS.length * 2 &&
    mean([J.ls, J.rs, J.lh, J.rh].map((j) => (f.v ? f.v[j] : 1))) >= minVis && torso(f) > 0.02);
  const segs = [];
  let cur = [];
  let cuts = 0;
  for (let i = 0; i < valid.length; i++) {
    const f = valid[i], prev = cur[cur.length - 1];
    let brk = false;
    if (prev) {
      const dt = f.t - prev.t;
      const s0 = bodyScale(prev), s1 = bodyScale(f);
      const jump = dist(mid(prev, J.lh, J.rh), mid(f, J.lh, J.rh)) / ((s0 + s1) / 2);
      const zoom = Math.max(s0, s1) / Math.min(s0, s1);
      if (dt <= 0 || dt > 0.5) brk = true; // gap or loop restart
      else if (jump > 1.2 || zoom > 1.35) { brk = true; cuts++; } // camera cut / zoom / person switch
    }
    if (brk) { segs.push(cur); cur = []; }
    cur.push(f);
  }
  if (cur.length) segs.push(cur);
  const kept = segs.filter((s) => s.length >= 3 && s[s.length - 1].t - s[0].t >= minSegSec);
  return { segments: kept.map(smoothSegment), cuts, validFrames: valid.length };
}

function smoothSegment(seg) {
  const n = seg.length;
  const out = seg.map((f) => ({ t: f.t, p: f.p.slice(), v: f.v }));
  for (let i = 1; i < n - 1; i++) {
    for (let k = 0; k < seg[i].p.length; k++) out[i].p[k] = (seg[i - 1].p[k] + 2 * seg[i].p[k] + seg[i + 1].p[k]) / 4;
  }
  const scale = median(seg.map(bodyScale));
  return { frames: out, scale };
}

// ── 2. per-frame signals ────────────────────────────────────────────────────
function signalsFor(seg) {
  const { frames, scale } = seg;
  const rows = [];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    const dt = b.t - a.t;
    const sp = new Array(JOINTS.length);
    for (let j = 0; j < JOINTS.length; j++) sp[j] = dist(pt(a, j), pt(b, j)) / scale / dt;
    const hipA = mid(a, J.lh, J.rh), hipB = mid(b, J.lh, J.rh);
    const shA = mid(a, J.ls, J.rs), shB = mid(b, J.ls, J.rs);
    const chestRel = dist([shA[0] - hipA[0], shA[1] - hipA[1]], [shB[0] - hipB[0], shB[1] - hipB[1]]) / scale / dt;
    const ext = (s, e, w) => dist(pt(b, s), pt(b, w)) / Math.max(1e-6, dist(pt(b, s), pt(b, e)) + dist(pt(b, e), pt(b, w)));
    const xs = [], ys = [];
    for (let j = 0; j < JOINTS.length; j++) { xs.push(b.p[2 * j]); ys.push(b.p[2 * j + 1]); }
    rows.push({
      t: (a.t + b.t) / 2, dt,
      e: mean(LIMBS.map((j) => sp[j])),
      up: mean(UPPER.map((j) => sp[j])),
      lo: mean(LOWER.map((j) => sp[j])),
      l: mean(LEFT.map((j) => sp[j])),
      r: mean(RIGHT.map((j) => sp[j])),
      hipSpeed: dist(hipA, hipB) / scale / dt,
      hipY: hipB[1] / scale,
      chestRel,
      armExt: Math.max(ext(J.ls, J.le, J.lw), ext(J.rs, J.re, J.rw)),
      knee: (angleAt(pt(b, J.lh), pt(b, J.lk), pt(b, J.la)) + angleAt(pt(b, J.rh), pt(b, J.rk), pt(b, J.ra))) / 2,
      spread: ((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))) / (scale * scale),
      footSpeed: (sp[J.la] + sp[J.ra]) / 2,
    });
  }
  return rows;
}

// Accent peaks in the energy signal of one segment + whether each ends in a sharp stop ("hit").
function findAccents(rows) {
  const e = rows.map((r) => r.e);
  const med = median(e);
  const out = [];
  let lastT = -Infinity;
  for (let i = 1; i < rows.length - 1; i++) {
    if (!(e[i] >= e[i - 1] && e[i] > e[i + 1])) continue;
    if (e[i] < Math.max(0.3, med * 1.25)) continue;
    if (rows[i].t - lastT < 0.18) continue;
    let stop = null;
    for (let k = i + 1; k < rows.length && rows[k].t - rows[i].t <= 0.3; k++) {
      if (e[k] <= 0.45 * e[i]) { stop = rows[k].t - rows[i].t; break; }
    }
    const hit = stop != null && stop <= 0.25;
    // A hit "lands" when the move arrives (speed collapses) — that moment is what sits on the beat.
    out.push({ t: hit ? rows[i].t + stop * 0.6 : rows[i].t, peakT: rows[i].t, e: e[i], hit, stop });
    lastT = rows[i].t;
  }
  return out;
}

function detrend(values, times, win = 1.0) {
  return values.map((v, i) => {
    const ns = [];
    for (let k = i; k >= 0 && times[i] - times[k] <= win / 2; k--) ns.push(values[k]);
    for (let k = i + 1; k < values.length && times[k] - times[i] <= win / 2; k++) ns.push(values[k]);
    return v - mean(ns);
  });
}

// Motion tempo from the energy signal (for videos without usable audio).
function motionTempo(allRows) {
  if (allRows.length < 30) return { bpm: null, strength: 0 };
  const dt = median(allRows.map((r) => r.dt));
  const fps = 1 / dt;
  const e = allRows.map((r) => r.e);
  const m = mean(e);
  const x = e.map((v) => v - m);
  const en = x.reduce((s, v) => s + v * v, 0);
  if (!en) return { bpm: null, strength: 0 };
  let best = null, bestS = -Infinity, bestAc = 0;
  for (let lag = Math.max(2, Math.ceil(fps * 60 / 180 - 1e-6)); lag <= Math.floor(fps * 60 / 70 + 1e-6) && lag < x.length; lag++) {
    let s = 0;
    for (let i = 0; i + lag < x.length; i++) s += x[i] * x[i + lag];
    const ac = s / en;
    const bpm = 60 * fps / lag;
    const sc = ac * Math.exp(-0.5 * Math.pow(Math.log2(bpm / 115) / 0.9, 2));
    if (sc > bestS) { bestS = sc; best = bpm; bestAc = ac; }
  }
  return { bpm: best, strength: clamp(bestAc) };
}

// ── 3. the analysis ─────────────────────────────────────────────────────────
export const AXES = [
  { key: "power", label: "Power" },
  { key: "sharpness", label: "Sharpness" },
  { key: "flow", label: "Flow" },
  { key: "groove", label: "Groove" },
  { key: "extension", label: "Lines" },
  { key: "footwork", label: "Footwork" },
  { key: "levels", label: "Levels" },
  { key: "rhythm", label: "Rhythm" },
];

export const ARCHETYPES = [
  { id: "hard-hitting", name: "Hard-hitting performance", tagline: "Big, powerful hits that land like punches — the boy-group hip-hop performance style.",
    w: { power: 1, sharpness: 1, footwork: 0.4, levels: 0.5, flow: -0.6 } },
  { id: "knife-sync", name: "Knife-sync precision (칼군무)", tagline: "Crisp stops, exact counts, every angle locked — built to look identical across a whole group.",
    w: { sharpness: 1, rhythm: 1, extension: 0.4, flow: -0.7, groove: -0.2 } },
  { id: "smooth-groove", name: "Smooth groove", tagline: "Relaxed bounce and continuous flow; the body rides the beat rather than hitting it.",
    w: { groove: 1, flow: 1, sharpness: -0.6, power: -0.2 } },
  { id: "elegant-lines", name: "Elegant lines", tagline: "Long extensions and controlled flow — shapes and silhouettes over impact.",
    w: { extension: 1, flow: 0.9, power: -0.4, footwork: -0.3 } },
  { id: "bouncy-cute", name: "Bouncy & bright", tagline: "Springy on-beat bounce with light, compact arm work.",
    w: { groove: 1, rhythm: 0.6, extension: -0.5, levels: -0.3, power: -0.2 } },
  { id: "dynamic-footwork", name: "Dynamic footwork", tagline: "Travel, steps and level changes carry the choreography — lower body leads.",
    w: { footwork: 1, levels: 0.8, power: 0.5 } },
  { id: "sleek-attitude", name: "Sleek & sharp attitude", tagline: "Sharp lines with controlled power — the girl-crush performance look.",
    w: { sharpness: 0.8, extension: 0.8, power: 0.5, groove: -0.4 } },
];

/**
 * analyzePose(frames, { beats, bpm })
 *   beats: optional array of beat times (seconds) from audio.
 */
export function analyzePose(frames, opts = {}) {
  const { segments, cuts, validFrames } = segmentFrames(frames);
  const total = frames.length;
  const rows = [], accents = [], levels = [];
  for (const s of segments) {
    const r = signalsFor(s);
    if (r.length < 3) continue;
    const ys = r.map((x) => x.hipY);
    levels.push({ range: quantile(ys, 0.95) - quantile(ys, 0.05), dur: r[r.length - 1].t - r[0].t });
    const hy = detrend(r.map((x) => x.hipY), r.map((x) => x.t));
    r.forEach((x, i) => { x.bounce = hy[i]; });
    rows.push(...r);
    accents.push(...findAccents(r));
  }
  const usedSec = rows.reduce((s, r) => s + r.dt, 0);
  const quality = {
    frames: total,
    usable: validFrames,
    usablePct: total ? Math.round((100 * validFrames) / total) : 0,
    cuts,
    segments: segments.length,
    analyzedSec: round(usedSec, 1),
    maxPeople: Math.max(0, ...frames.map((f) => (f && f.n) || (f && f.p ? 1 : 0))),
  };
  if (rows.length < 10) return { ok: false, reason: "Not enough trackable frames — try a fixed-camera dance-practice video with the dancer fully in frame.", quality };

  const E = rows.map((r) => r.e);
  const energy = mean(E);
  const peakEnergy = quantile(E, 0.95);
  const hits = accents.filter((a) => a.hit);
  const hitRatio = accents.length ? hits.length / accents.length : 0;
  const stopTime = hits.length ? mean(hits.map((h) => h.stop)) : null;
  const minutes = usedSec / 60;
  const hitsPerMin = minutes ? hits.length / minutes : 0;
  const continuity = mean(E.map((x) => (x > 0.4 * energy ? 1 : 0)));

  // Holds: runs of near-stillness lasting ≥ 0.3 s.
  let holdSec = 0, run = 0;
  for (const r of rows) {
    if (r.e < 0.25 * energy) run += r.dt; else { if (run >= 0.3) holdSec += run; run = 0; }
  }
  if (run >= 0.3) holdSec += run;
  const holdRatio = holdSec / usedSec;

  const bounceAmp = std(rows.map((r) => r.bounce));
  // Level range is measured inside each camera segment, then duration-weighted.
  const levelRange = levels.reduce((s, l) => s + l.range * l.dur, 0) / Math.max(1e-6, levels.reduce((s, l) => s + l.dur, 0));
  const travelPerMin = rows.reduce((s, r) => s + r.hipSpeed * r.dt, 0) / Math.max(minutes, 1e-6);
  const footSpeed = mean(rows.map((r) => r.footSpeed));
  const extension = quantile(rows.map((r) => r.armExt), 0.75);
  const spread = median(rows.map((r) => r.spread));
  const upSum = rows.reduce((s, r) => s + r.up, 0), loSum = rows.reduce((s, r) => s + r.lo, 0);
  const upperShare = upSum / Math.max(1e-6, upSum + loSum);
  const lSum = rows.reduce((s, r) => s + r.l, 0), rSum = rows.reduce((s, r) => s + r.r, 0);
  const rightShare = rSum / Math.max(1e-6, lSum + rSum);
  // Symmetry over 1 s windows, so alternating left/right choreography counts as balanced.
  const symWin = [];
  for (let i = 0; i < rows.length;) {
    let l = 0, r = 0; const t0 = rows[i].t;
    while (i < rows.length && rows[i].t - t0 < 1) { l += rows[i].l; r += rows[i].r; i++; }
    if (l + r > 0) symWin.push(1 - Math.abs(l - r) / (l + r));
  }
  const symmetry = mean(symWin);
  const isolation = mean(rows.map((r) => r.chestRel)) / Math.max(1e-6, mean(rows.map((r) => r.chestRel + r.hipSpeed)));
  const kneeAngle = mean(rows.map((r) => r.knee));
  const third = Math.floor(rows.length / 3);
  const stamina = third > 5 ? mean(E.slice(-third)) / Math.max(1e-6, mean(E.slice(0, third))) : null;

  // Rhythm: audio beats if we have them, else motion periodicity.
  const beats = (opts.beats || []).filter((b) => b >= rows[0].t - 1 && b <= rows[rows.length - 1].t + 1);
  let bpm = opts.bpm || null, bpmSource = bpm ? "audio" : null, onBeat = null, chance = null, beatOffsetMs = null, bounceOnBeat = null;
  const mt = motionTempo(rows);
  if (!bpm && mt.bpm && mt.strength >= 0.1) { bpm = mt.bpm; bpmSource = "motion"; }
  if (beats.length >= 8 && accents.length >= 4) {
    const period = median(beats.slice(1).map((b, i) => b - beats[i]));
    const sampleDt = median(rows.map((r) => r.dt));
    const tol = Math.max(0.07, 0.75 * sampleDt);
    const offs = accents.map((a) => nearestOffset(beats, a.t));
    onBeat = mean(offs.map((o) => (Math.abs(o) <= tol ? 1 : 0)));
    chance = clamp((2 * tol) / period);
    beatOffsetMs = Math.round(1000 * median(offs));
    // Bounce direction: is the hip low (y large) on the beat?
    const atBeat = beats.map((b) => nearestRow(rows, b)).filter(Boolean);
    bounceOnBeat = mean(atBeat.map((r) => r.bounce)) / Math.max(1e-6, bounceAmp);
  }
  // With audio: best of "accents land on beats" and "bounce is phase-locked to beats"
  // (flowing styles have few accents but still ride the beat with the body).
  const rhythmScore = onBeat != null
    ? Math.max(score((onBeat - chance) / Math.max(1e-6, 1 - chance), 0.05, 0.6), bounceOnBeat != null ? score(Math.abs(bounceOnBeat), 0.2, 1.1) : 0)
    : score(mt.strength, 0.05, 0.45);

  const raw = {
    energy: round(energy), peakEnergy: round(peakEnergy), accentsPerMin: round(accents.length / Math.max(minutes, 1e-6), 1),
    hitsPerMin: round(hitsPerMin, 1), hitRatio: round(hitRatio), stopTime: round(stopTime, 3), continuity: round(continuity),
    holdRatio: round(holdRatio), bounceAmp: round(bounceAmp, 3), levelRange: round(levelRange, 2),
    travelPerMin: round(travelPerMin, 1), footSpeed: round(footSpeed), extension: round(extension), spread: round(spread, 1),
    upperShare: round(upperShare), rightShare: round(rightShare), symmetry: round(symmetry), isolation: round(isolation),
    kneeAngle: round(kneeAngle, 0), stamina: round(stamina), bpm: round(bpm, 1), bpmSource, onBeat: round(onBeat),
    onBeatChance: round(chance), beatOffsetMs, bounceOnBeat: round(bounceOnBeat), rhythmStrength: round(mt.strength),
  };

  const axes = {
    power: Math.round(0.6 * score(energy, 0.5, 2.5) + 0.4 * score(peakEnergy, 1.5, 6)),
    sharpness: Math.round(0.55 * score(hitRatio, 0.15, 0.75) + 0.25 * score(hitsPerMin, 10, 90) + 0.2 * (stopTime != null ? score(0.26 - stopTime, 0, 0.18) : 0)),
    flow: Math.round(0.6 * score(continuity, 0.45, 0.95) + 0.4 * score(1 - hitRatio, 0.2, 0.85)),
    groove: Math.round(0.7 * score(bounceAmp, 0.01, 0.08) + 0.3 * score(180 - kneeAngle, 5, 35)),
    extension: Math.round(0.65 * score(extension, 0.7, 0.97) + 0.35 * score(spread, 3, 9)),
    footwork: Math.round(0.5 * score(travelPerMin, 5, 60) + 0.5 * score(footSpeed, 0.3, 2.2)),
    levels: score(levelRange, 0.1, 0.8),
    rhythm: rhythmScore,
  };

  const archetype = pickArchetype(axes);
  const sections = buildSections(rows, accents, beats, bpm);
  const result = {
    ok: true, quality, raw, axes, archetype, sections,
    accents: accents.map((a) => ({ t: a.t, hit: a.hit })),
    energyCurve: downsampleCurve(rows, 240),
  };
  result.strengths = strengthsOf(result);
  result.tradeoffs = tradeoffsOf(result);
  result.cues = feelCues(result);
  return result;
}

function nearestOffset(sorted, t) {
  let lo = 0, hi = sorted.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (sorted[m] < t) lo = m; else hi = m; }
  const a = t - sorted[lo], b = t - sorted[hi];
  return Math.abs(a) < Math.abs(b) ? a : b;
}
function nearestRow(rows, t) {
  let lo = 0, hi = rows.length - 1;
  if (t < rows[0].t - 0.1 || t > rows[hi].t + 0.1) return null;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rows[m].t < t) lo = m; else hi = m; }
  const r = Math.abs(rows[lo].t - t) < Math.abs(rows[hi].t - t) ? rows[lo] : rows[hi];
  return Math.abs(r.t - t) <= 0.1 ? r : null;
}
function downsampleCurve(rows, n) {
  if (rows.length <= n) return rows.map((r) => [round(r.t, 2), round(r.e, 2)]);
  const out = [], step = rows.length / n;
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * step), b = Math.floor((i + 1) * step);
    const sl = rows.slice(a, Math.max(a + 1, b));
    out.push([round(sl[0].t, 2), round(mean(sl.map((r) => r.e)), 2)]);
  }
  return out;
}

export function pickArchetype(axes) {
  const vals = AXES.map((a) => axes[a.key]);
  const m = mean(vals);
  const centered = Object.fromEntries(AXES.map((a) => [a.key, (axes[a.key] - m) / 50]));
  const ranked = ARCHETYPES.map((A) => {
    let s = 0, n = 0;
    for (const [k, w] of Object.entries(A.w)) { s += w * centered[k]; n += Math.abs(w); }
    return { id: A.id, name: A.name, tagline: A.tagline, fit: s / n };
  }).sort((a, b) => b.fit - a.fit);
  return { primary: ranked[0], secondary: ranked[1], ranked };
}

// Split into phrases (8 beats when we have a beat grid, else 4 s) and label them.
function buildSections(rows, accents, beats, bpm) {
  const t0 = rows[0].t, t1 = rows[rows.length - 1].t;
  const len = beats.length >= 16 ? null : bpm ? (8 * 60) / bpm : 4;
  const bounds = [];
  if (!len) { for (let i = 0; i < beats.length; i += 8) bounds.push(beats[i]); bounds.push(Math.max(t1, beats[beats.length - 1])); }
  else for (let t = t0; t < t1; t += len) bounds.push(t);
  if (bounds[bounds.length - 1] < t1) bounds.push(t1);
  const wins = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i], b = bounds[i + 1];
    const rs = rows.filter((r) => r.t >= a && r.t < b);
    if (rs.length < 3) continue;
    const ac = accents.filter((x) => x.t >= a && x.t < b);
    const up = mean(rs.map((r) => r.up)), lo = mean(rs.map((r) => r.lo));
    wins.push({ start: round(a, 2), end: round(b, 2), energy: round(mean(rs.map((r) => r.e))), hits: ac.filter((x) => x.hit).length,
      focus: up > lo * 1.4 ? "upper body" : lo > up * 0.9 ? "legs & footwork" : "full body" });
  }
  if (!wins.length) return [];
  const es = wins.map((w) => w.energy);
  const hiQ = quantile(es, 0.75), loQ = quantile(es, 0.25), medE = median(es);
  wins.forEach((w, i) => {
    w.label = w.energy >= hiQ && w.energy > medE * 1.08 ? "peak" : w.energy <= loQ && w.energy < medE * 0.92 ? "calm"
      : i > 0 && w.energy > wins[i - 1].energy * 1.15 ? "build" : "groove";
  });
  // Killing-part candidates: the two highest-energy phrases that aren't neighbours.
  const order = wins.map((w, i) => i).sort((a, b) => wins[b].energy - wins[a].energy);
  const picked = [];
  for (const i of order) {
    if (wins[i].energy < medE * 1.05) break; // flat energy → no standout phrase
    if (picked.every((p) => Math.abs(p - i) > 1)) picked.push(i);
    if (picked.length === 2) break;
  }
  picked.forEach((i, rank) => { wins[i].killing = rank + 1; });
  return wins;
}

const pct = (x) => Math.round(100 * x) + "%";
const AXIS_EVIDENCE = {
  power: (r) => `Average limb speed ${r.energy} torso-lengths/s, peaks at ${r.peakEnergy}.`,
  sharpness: (r) => `${pct(r.hitRatio)} of accents end in a sharp stop (${r.hitsPerMin}/min)` + (r.stopTime != null ? `, stopping in ${Math.round(r.stopTime * 1000)} ms on average.` : "."),
  flow: (r) => `Keeps moving ${pct(r.continuity)} of the time; motion rarely breaks.`,
  groove: (r) => `Hip bounce of ${r.bounceAmp} torso-lengths with an average knee angle of ${r.kneeAngle}°.`,
  extension: (r) => `Arms reach ${pct(r.extension)} of full extension on big moves; silhouette covers ${r.spread}× torso².`,
  footwork: (r) => `Travels ${r.travelPerMin} torso-lengths/min; feet average ${r.footSpeed} TL/s.`,
  levels: (r) => `Hip height changes by ${r.levelRange} torso-lengths between high and low moments.`,
  rhythm: (r) => r.onBeat != null
    ? `${pct(r.onBeat)} of accents land within the beat window (chance level ${pct(r.onBeatChance)})` +
      (r.bounceOnBeat != null ? `; bounce phase-lock ${Math.abs(r.bounceOnBeat)}.` : ".")
    : r.bpm ? `Motion repeats with a pulse (periodicity ${r.rhythmStrength}) at ~${Math.round(r.bpm)} BPM; no audio beat to check against.`
      : `No steady pulse in the motion (periodicity ${r.rhythmStrength}) and no audio beat to check against.`,
};
const AXIS_STRENGTH = {
  power: "Explosive energy", sharpness: "Clean, sharp hits", flow: "Seamless flow", groove: "Deep groove & bounce",
  extension: "Long, finished lines", footwork: "Active footwork & travel", levels: "Big level changes", rhythm: "Tight musicality",
};
const AXIS_LOW = {
  power: "Low-intensity delivery — energy is conserved rather than projected.",
  sharpness: "Accents blur into each other; few hard stops.",
  flow: "Motion is choppy — many stops and restarts between moves.",
  groove: "Stays upright with little bounce; the body doesn't ride the beat.",
  extension: "Arm work stays compact; lines are rarely fully extended.",
  footwork: "Mostly stationary — the lower body anchors while the upper body performs.",
  levels: "Stays at one height; no drops or floor work.",
  rhythm: "Accents don't consistently lock to the beat.",
};

function strengthsOf(res) {
  const ranked = AXES.map((a) => ({ key: a.key, v: res.axes[a.key] })).sort((a, b) => b.v - a.v);
  let top = ranked.filter((a) => a.v >= 65).slice(0, 4);
  if (top.length < 2) top = ranked.slice(0, 2);
  const out = top.map((a) => ({ axis: a.key, score: a.v, title: AXIS_STRENGTH[a.key], evidence: AXIS_EVIDENCE[a.key](res.raw) }));
  const r = res.raw;
  if (r.symmetry >= 0.85) out.push({ axis: "balance", title: "Balanced both sides", evidence: `Left/right limbs share the work evenly (symmetry ${pct(r.symmetry)}).` });
  if (r.stamina != null && r.stamina >= 1.05) out.push({ axis: "stamina", title: "Builds to the end", evidence: `Energy in the last third is ${pct(r.stamina - 1)} higher than the first.` });
  return out;
}

function tradeoffsOf(res) {
  const r = res.raw, out = [];
  AXES.map((a) => ({ key: a.key, v: res.axes[a.key] })).sort((a, b) => a.v - b.v).filter((a) => a.v <= 35).slice(0, 3)
    .forEach((a) => out.push({ axis: a.key, score: a.v, title: AXIS_LOW[a.key], evidence: AXIS_EVIDENCE[a.key](r) }));
  if (r.stamina != null && r.stamina < 0.85) out.push({ axis: "stamina", title: "Energy fades late", evidence: `Last third is ${pct(1 - r.stamina)} lower in energy than the first third.` });
  if (r.symmetry < 0.75) out.push({ axis: "balance", title: `${r.rightShare > 0.5 ? "Right" : "Left"} side dominates`, evidence: `${pct(Math.max(r.rightShare, 1 - r.rightShare))} of limb motion comes from one side — practise the other side separately.` });
  if (r.beatOffsetMs != null && Math.abs(r.beatOffsetMs) >= 70 && res.axes.sharpness >= 40) out.push({ axis: "timing", title: r.beatOffsetMs < 0 ? "Hits ahead of the beat" : "Hits behind the beat", evidence: `Median accent offset ${r.beatOffsetMs} ms (can also be audio/video sync in the upload).` });
  if (res.quality.cuts >= 3) out.push({ axis: "quality", title: "Many cuts / tracking switches", evidence: `${res.quality.cuts} discontinuities (camera cuts, or tracking jumping between members); measurements are split around them. Prefer a fixed-cam dance practice video.` });
  return out;
}

// Concrete, measurable cues for reproducing the feel.
function feelCues(res) {
  const r = res.raw, a = res.axes, cues = [];
  const stance = r.kneeAngle <= 150 ? "a low, deep" : r.kneeAngle <= 165 ? "an athletic, slightly bent" : "a tall, nearly straight";
  cues.push({ title: "Stance", cue: `Keep ${stance} stance — average knee angle ${r.kneeAngle}°. Check it in the mirror on the first count of every 8.` });
  if (r.bounceOnBeat != null && Math.abs(r.bounceOnBeat) > 0.2) {
    cues.push({ title: "Bounce direction", cue: r.bounceOnBeat > 0 ? "Down-bounce: the hips drop ON the beat and recover on the &." : "Up-bounce: the body rises ON the beat and sinks on the &." });
  } else if (a.groove >= 50) cues.push({ title: "Bounce", cue: `Constant small bounce (~${r.bounceAmp} torso-lengths) — keep the knees soft the whole time.` });
  if (r.stopTime != null && a.sharpness >= 45) cues.push({ title: "Stops", cue: `Freeze within ${Math.round(r.stopTime * 1000)} ms after each hit — move fast, then lock. Speed without the stop reads as sloppy.` });
  else if (a.flow >= 55) cues.push({ title: "Connect", cue: "Let every move finish into the start of the next; no dead stops between counts." });
  cues.push({ title: "Arms", cue: `Reach ${Math.round(r.extension * 100)}% of full arm length on the big shapes${r.extension >= 0.9 ? " — finish every line to the fingertips" : " — keep the elbows soft and the shapes compact"}.` });
  cues.push({ title: "Where the energy lives", cue: `${Math.round(r.upperShare * 100)}% of limb motion is upper body${r.upperShare >= 0.6 ? " — sell it with arms, shoulders and chest; feet stay simple" : r.upperShare <= 0.45 ? " — the legs drive this one; get the footwork clean before styling the arms" : " — upper and lower body share the load"}.` });
  if (r.isolation >= 0.45) cues.push({ title: "Isolation", cue: `Chest moves independently of the hips (isolation ${Math.round(r.isolation * 100)}%) — drill chest pops and rolls separately.` });
  return cues;
}

// ── 4. practice-mode comparison ─────────────────────────────────────────────
const SEGS = [["ls", "le", "leftArm"], ["le", "lw", "leftArm"], ["rs", "re", "rightArm"], ["re", "rw", "rightArm"],
  ["lh", "lk", "leftLeg"], ["lk", "la", "leftLeg"], ["rh", "rk", "rightLeg"], ["rk", "ra", "rightLeg"],
  ["ls", "rs", "torso"], ["lh", "rh", "torso"]];
const MIRROR = Object.fromEntries(JOINTS.map((n) => [n, n[0] === "l" ? "r" + n.slice(1) : n[0] === "r" ? "l" + n.slice(1) : n]));
const MIRROR_PART = { leftArm: "rightArm", rightArm: "leftArm", leftLeg: "rightLeg", rightLeg: "leftLeg", torso: "torso" };

function dirs(f, mirror) {
  return SEGS.map(([a, b, part]) => {
    const A = mirror ? MIRROR[a] : a, B = mirror ? MIRROR[b] : b;
    let dx = f.p[2 * J[B]] - f.p[2 * J[A]];
    const dy = f.p[2 * J[B] + 1] - f.p[2 * J[A] + 1];
    if (mirror) dx = -dx;
    const n = Math.hypot(dx, dy) || 1;
    return { d: [dx / n, dy / n], part: mirror ? MIRROR_PART[part] : part };
  });
}

// Pose match 0–100 between a user frame and a reference frame (limb directions,
// so body size / position / distance from camera don't matter).
// mirror=true when the user is facing the reference like a mirror.
export function comparePoses(user, ref, { mirror = true } = {}) {
  const u = dirs(user, false), r = dirs(ref, mirror);
  const parts = {};
  let tot = 0;
  for (let i = 0; i < u.length; i++) {
    const cos = clamp(u[i].d[0] * r[i].d[0] + u[i].d[1] * r[i].d[1], -1, 1);
    const deg = (Math.acos(cos) * 180) / Math.PI;
    const s = clamp(1 - deg / 90);
    tot += s;
    (parts[u[i].part] ||= []).push(s);
  }
  return {
    score: Math.round((100 * tot) / u.length),
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(100 * mean(v))])),
  };
}

export function frameAt(frames, t) {
  let lo = 0, hi = frames.length - 1;
  if (hi < 0) return null;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (frames[m].t < t) lo = m; else hi = m; }
  const f = Math.abs(frames[lo].t - t) <= Math.abs(frames[hi].t - t) ? frames[lo] : frames[hi];
  return f && f.p && Math.abs(f.t - t) < 0.25 ? f : null;
}

// Best match within ±window seconds — tells the user if they are early or late.
export function matchWithTiming(user, refFrames, t, { mirror = true, window = 0.4 } = {}) {
  let best = null;
  const step = 1 / 15;
  for (let off = -window; off <= window + 1e-9; off += step) {
    const f = frameAt(refFrames, t + off);
    if (!f) continue;
    const c = comparePoses(user, f, { mirror });
    // Slight preference for zero offset so ties don't drift.
    const adj = c.score - Math.abs(off) * 4;
    if (!best || adj > best.adj) best = { ...c, adj, offset: off };
  }
  const now = frameAt(refFrames, t);
  const onTime = now ? comparePoses(user, now, { mirror }) : null;
  return best ? { score: onTime ? onTime.score : best.score, parts: onTime ? onTime.parts : best.parts, bestScore: best.score, lagMs: Math.round(-best.offset * 1000) } : null;
}

export function summarizeFrame(f) { return f && f.p ? { t: f.t, torso: torso(f) } : null; }
export const _internals = { segmentFrames, signalsFor, findAccents, motionTempo, quantile, median };
