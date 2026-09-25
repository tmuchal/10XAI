// Dance Lab — choreography structure: beat grid → 8-count phrases → key pose per
// count (with a plain-language description) → repeated-phrase detection.
// Output is a count sheet a dancer can learn from ("A B A C …"), plus how
// precisely the dancer repeats each phrase.
import { J, bodyScale, torso, frameAt } from "./analyze.mjs";

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const deg = (r) => (r * 180) / Math.PI;
const P = (f, j) => [f.p[2 * j], f.p[2 * j + 1]];
const hip = (f) => [(f.p[2 * J.lh] + f.p[2 * J.rh]) / 2, (f.p[2 * J.lh + 1] + f.p[2 * J.rh + 1]) / 2];
const sh = (f) => [(f.p[2 * J.ls] + f.p[2 * J.rs]) / 2, (f.p[2 * J.ls + 1] + f.p[2 * J.rs + 1]) / 2];
function angleAt(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const d = Math.hypot(...v1) * Math.hypot(...v2);
  return d ? deg(Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d)))) : 180;
}

// ── beat grid ───────────────────────────────────────────────────────────────
// Audio beats when available; otherwise a grid at the motion tempo, phased so
// the dancer's hits land on it.
export function beatGrid({ beats = [], bpm = null, accents = [], t0, t1 }) {
  if (beats.length >= 8) return beats.filter((b) => b >= t0 - 0.05 && b <= t1 + 0.05);
  if (!bpm) return [];
  const src = accents.filter((a) => a.hit).length >= 4 ? accents.filter((a) => a.hit) : accents;
  // Fine tempo search (±8 %): the period at which hit times line up best
  // (phase concentration of t mod period).
  const conc = (per) => { let sx = 0, sy = 0; for (const a of src) { const ph = (2 * Math.PI * a.t) / per; sx += Math.cos(ph); sy += Math.sin(ph); } return [Math.hypot(sx, sy) / Math.max(1, src.length), Math.atan2(sy, sx)]; };
  let per = 60 / bpm, bestR = -1, bestAng = 0;
  if (src.length >= 6) {
    const base = per;
    for (let k = -160; k <= 160; k++) {
      const p = base * (1 + k * 0.0005);
      const [R, ang] = conc(p);
      if (R > bestR) { bestR = R; per = p; bestAng = ang; }
    }
  } else bestAng = conc(per)[1];
  let phase = (((bestAng / (2 * Math.PI)) * per) % per + per) % per;
  // Motion tempo is coarse (frame-quantized); a few % error drifts a whole song
  // off the grid. Refine: least-squares fit t = phase + per·n to the hits.
  let P = per;
  for (let it = 0; it < 4 && src.length >= 6; it++) {
    const pts = src.map((a) => [Math.round((a.t - phase) / P), a.t]).filter(([n, t]) => Math.abs(t - (phase + n * P)) < P * 0.3);
    if (pts.length < 6) break;
    const mn = mean(pts.map((x) => x[0])), mt = mean(pts.map((x) => x[1]));
    const cov = pts.reduce((s, [n, t]) => s + (n - mn) * (t - mt), 0), vn = pts.reduce((s, [n]) => s + (n - mn) ** 2, 0);
    if (!vn) break;
    const np = cov / vn;
    if (!(np > P * 0.9 && np < P * 1.1)) break;
    P = np; phase = mt - P * mn;
  }
  const out = [];
  for (let t = Math.ceil((t0 - phase) / P) * P + phase; t <= t1; t += P) out.push(Math.round(t * 1000) / 1000);
  return out;
}

// Which beat is count "1"? Choreography accents cluster on 1 and 5.
function downbeatOffset(grid, accents, t0, t1) {
  const per = grid.length > 1 ? (grid[grid.length - 1] - grid[0]) / (grid.length - 1) : 0.5;
  // Beats at the clip edges can't show an accent (no motion before/after) — ignore them.
  const strength = grid.map((b) => (b < t0 + per || b > t1 - per ? NaN : accents.filter((a) => Math.abs(a.t - b) <= per * 0.25).reduce((s, a) => s + (a.hit ? 1 : 0.5), 0)));
  // Contrast score: accents on counts 1/5 vs the other counts (means, so a
  // missing first beat doesn't bias it). Ties → earliest start.
  let best = 0, bestS = -Infinity;
  for (let k = 0; k < 8; k++) {
    const on = [], one = [], off = [];
    grid.forEach((_, i) => { if (Number.isNaN(strength[i])) return; const r = (((i - k) % 8) + 8) % 8; (r === 0 ? one : r === 4 ? on : off).push(strength[i]); });
    const s = 1.5 * mean(one) + mean(on) - 2.5 * mean(off) - k * 0.001;
    if (s > bestS + 1e-9) { bestS = s; best = k; }
  }
  return best;
}

// ── pose description ────────────────────────────────────────────────────────
// Plain words for a key pose. Sides are the DANCER's left/right.
// kneeBase: the dancer's usual knee angle — leg bends are only mentioned when
// they stand out from that baseline (a constant bounce isn't news on every count).
export const kneeAngle = (f) => (angleAt(P(f, J.lh), P(f, J.lk), P(f, J.la)) + angleAt(P(f, J.rh), P(f, J.rk), P(f, J.ra))) / 2;
export function describePose(f, { kneeBase = 170 } = {}) {
  const s = bodyScale(f), out = [];
  const down = [0, 1];
  const arm = (side) => {
    const S = P(f, J[side + "s"]), E = P(f, J[side + "e"]), W = P(f, J[side + "w"]);
    const ua = [E[0] - S[0], E[1] - S[1]];
    const lift = deg(Math.acos(Math.max(-1, Math.min(1, (ua[0] * down[0] + ua[1] * down[1]) / (Math.hypot(...ua) || 1)))));
    const bend = 180 - angleAt(S, E, W);
    const otherS = P(f, J[(side === "l" ? "r" : "l") + "s"]);
    const across = side === "l" ? W[0] < otherS[0] : W[0] > otherS[0]; // wrist past the other shoulder
    const head = P(f, J.nose);
    let pos = lift < 35 ? "down" : lift < 70 ? "low" : lift < 115 ? "out to the side" : lift < 150 ? "up diagonal" : "overhead";
    if (W[1] < head[1] - 0.2 * s && lift < 150) pos = "hand above head";
    if (across) pos = "across the body";
    return { pos, bent: bend > 70 };
  };
  const L = arm("l"), R = arm("r");
  if (L.pos === R.pos && L.pos !== "down") out.push(`Both arms ${L.pos}${L.bent && R.bent ? ", bent" : ""}`);
  else {
    if (L.pos !== "down") out.push(`L arm ${L.pos}${L.bent ? " (bent)" : ""}`);
    if (R.pos !== "down") out.push(`R arm ${R.pos}${R.bent ? " (bent)" : ""}`);
    if (L.pos === "down" && R.pos === "down") out.push("Arms down");
  }
  const hipW = Math.hypot(...[0, 1].map((k) => f.p[2 * J.lh + k] - f.p[2 * J.rh + k])) || s * 0.4;
  const feet = Math.abs(f.p[2 * J.la] - f.p[2 * J.ra]) / hipW;
  const knee = kneeAngle(f);
  const lift = (f.p[2 * J.ra + 1] - f.p[2 * J.la + 1]) / s; // + = left ankle higher
  const legs = [];
  if (Math.abs(lift) > 0.3) legs.push(`${lift > 0 ? "L" : "R"} leg lifted`);
  else legs.push(feet < 1.3 ? "feet together" : feet > 2.6 ? "wide stance" : "hip-width stance");
  if (knee < Math.min(135, kneeBase - 12)) legs.push("deep squat"); else if (knee < Math.min(160, kneeBase - 10)) legs.push("knees bent");
  out.push(legs.join(", "));
  const tv = [sh(f)[0] - hip(f)[0], sh(f)[1] - hip(f)[1]];
  const lean = deg(Math.atan2(tv[0], -tv[1]));
  if (torso(f) < 0.72 * s) out.push("body bent forward");
  else if (Math.abs(lean) > 18) out.push(`lean to the ${lean > 0 ? "dancer's left" : "dancer's right"}`);
  return out;
}

// ── phrase similarity ───────────────────────────────────────────────────────
// Limb directions, weighted by how much each segment moves in this clip: a
// static stance shouldn't make two different phrases look alike.
const SEGS = [["ls", "le"], ["le", "lw"], ["rs", "re"], ["re", "rw"], ["lh", "lk"], ["lk", "la"], ["rh", "rk"], ["rk", "ra"], ["ls", "rs"], ["lh", "rh"], ["lh", "ls"], ["rh", "rs"]];
const SWAP = (n) => (n[0] === "l" ? "r" + n.slice(1) : n[0] === "r" ? "l" + n.slice(1) : n);
function vecs(f, mirror) {
  return SEGS.map(([a, b]) => {
    const A = mirror ? SWAP(a) : a, B = mirror ? SWAP(b) : b;
    let dx = f.p[2 * J[B]] - f.p[2 * J[A]];
    const dy = f.p[2 * J[B] + 1] - f.p[2 * J[A] + 1];
    if (mirror) dx = -dx;
    const n = Math.hypot(dx, dy) || 1;
    return [dx / n, dy / n];
  });
}
function segWeights(samples) {
  const vs = samples.filter(Boolean).map((f) => vecs(f, false));
  return SEGS.map((_, k) => {
    const m = [mean(vs.map((v) => v[k][0])), mean(vs.map((v) => v[k][1]))];
    return Math.max(0.03, 1 - Math.hypot(m[0], m[1])); // circular variance
  });
}
function poseSim(a, b, mirror, w) {
  const u = vecs(a, false), v = vecs(b, mirror);
  let s = 0, n = 0;
  for (let k = 0; k < u.length; k++) {
    const cos = Math.max(-1, Math.min(1, u[k][0] * v[k][0] + u[k][1] * v[k][1]));
    s += w[k] * Math.max(0, 1 - deg(Math.acos(cos)) / 90); n += w[k];
  }
  return (100 * s) / n;
}
// Mean pose match over the phrase, allowing a ±1-sample shift (timing slop).
function phraseSim(a, b, mirror, w) {
  let best = 0;
  for (const shift of [-1, 0, 1]) {
    const sc = [];
    for (let i = 0; i < a.length; i++) {
      const x = a[i], y = b[i + shift];
      if (x && y) sc.push(poseSim(x, y, mirror, w));
    }
    if (sc.length >= a.length * 0.6) best = Math.max(best, mean(sc));
  }
  return best;
}

/**
 * analyzeChoreo(frames, { beats, bpm, accents })
 *  → { grid, bpm, phrases: [{ index, start, end, label, mirrored, counts: [{ n, t, p, desc, hit, andHit, travel }] }],
 *      clusters: [{ label, occurrences, precision }], learnOrder, sequence }
 */
export function analyzeChoreo(frames, { beats = [], bpm = null, accents = [], threshold = 80 } = {}) {
  const known = frames.filter((f) => f.p);
  if (known.length < 10) return null;
  const t0 = known[0].t, t1 = known[known.length - 1].t;
  const grid = beatGrid({ beats, bpm, accents, t0, t1 });
  if (grid.length < 8) return null;
  const per = (grid[grid.length - 1] - grid[0]) / (grid.length - 1);
  // Pose at every half beat, computed once and shared by all offset candidates.
  const half = [];
  for (let j = 0; j < 2 * grid.length; j++) half.push(frameAt(frames, grid[0] + (j + 0.5) * (per / 2)));
  const w = segWeights(half);
  const knees = half.filter(Boolean).map(kneeAngle).sort((a, b) => a - b);
  const kneeBase = knees.length ? knees[Math.floor(knees.length * 0.6)] : 170;
  const letter = (k) => String.fromCharCode(65 + (k % 26)) + (k >= 26 ? Math.floor(k / 26) : "");
  const cluster = (k) => {
    const phs = [], clusters = [];
    for (let i = k; i + 4 <= grid.length; i += 8) {
      const samples = half.slice(2 * i, 2 * i + 16);
      while (samples.length < 16) samples.push(null);
      const ph = { index: phs.length, beat: i, samples };
      phs.push(ph);
      if (i + 8 > grid.length || samples.filter(Boolean).length < 8) { ph.label = "?"; continue; }
      let best = null;
      for (const c of clusters) {
        const rep = phs[c.occurrences[0]];
        const same = phraseSim(samples, rep.samples, false, w), mir = phraseSim(samples, rep.samples, true, w);
        const sim = Math.max(same, mir);
        if (sim >= threshold && (!best || sim > best.sim)) best = { c, sim, mirrored: mir > same + 3 };
      }
      if (best) { best.c.occurrences.push(ph.index); ph.label = best.c.label; ph.mirrored = best.mirrored; ph.sim = Math.round(best.sim); }
      else { const c = { label: letter(clusters.length), occurrences: [ph.index] }; clusters.push(c); ph.label = c.label; ph.mirrored = false; }
    }
    const lab = phs.filter((p) => p.label !== "?").length;
    const sims = phs.filter((p) => p.sim != null).map((p) => p.sim);
    return { phs, clusters, repetition: lab ? (lab - clusters.length) / lab : 0, tightness: sims.length ? mean(sims) : 0 };
  };
  // Count "1" = the offset where phrases repeat best (choreography is built in
  // 8-counts); accent contrast on 1/5 breaks ties.
  const accentK = downbeatOffset(grid, accents, t0, t1);
  // Count "1" = the offset where 8-count phrases line up with their repeats
  // best: mean best-match similarity of each phrase to any other phrase.
  const repeatability = (k) => {
    const phs = [];
    for (let i = k; i + 8 <= grid.length; i += 8) { const sm = half.slice(2 * i, 2 * i + 16); if (sm.filter(Boolean).length >= 8) phs.push(sm); }
    if (phs.length < 2) return 0;
    const best = phs.map(() => 0);
    for (let x = 0; x < phs.length; x++) for (let y = x + 1; y < phs.length; y++) {
      const v = Math.max(phraseSim(phs[x], phs[y], false, w), phraseSim(phs[x], phs[y], true, w));
      if (v > best[x]) best[x] = v;
      if (v > best[y]) best[y] = v;
    }
    return mean(best);
  };
  let pick = null;
  for (let k = 0; k < 8; k++) {
    const score = repeatability(k) + (k === accentK ? 0.5 : 0) - k * 0.001;
    if (globalThis.__CHOREO_DEBUG) console.log("k", k, score.toFixed(2), k === accentK);
    if (!pick || score > pick.score) pick = { k, score };
  }
  pick = { ...cluster(pick.k), k: pick.k };
  const k0 = pick.k, clusters = pick.clusters;
  const phrases = pick.phs.map((ph) => {
    const i = ph.beat, counts = [];
    for (let c = 0; c < 8 && i + c < grid.length; c++) {
      const t = grid[i + c];
      const f = frameAt(frames, t);
      const next = frameAt(frames, t + per);
      const hitNear = accents.find((a) => Math.abs(a.t - t) <= per * 0.25);
      const andHit = accents.some((a) => a.hit && Math.abs(a.t - (t + per / 2)) <= per * 0.2);
      let travel = null;
      if (f && next) {
        const d = [hip(next)[0] - hip(f)[0], bodyScale(next) / bodyScale(f)];
        if (Math.abs(d[0]) / bodyScale(f) > 0.35) travel = d[0] > 0 ? "travel to screen-right" : "travel to screen-left";
        else if (d[1] > 1.12) travel = "step forward"; else if (d[1] < 0.89) travel = "step back";
      }
      counts.push({ n: c + 1, t: Math.round(t * 100) / 100, p: f ? f.p : null, desc: f ? describePose(f, { kneeBase }) : [], hit: !!(hitNear && hitNear.hit), accent: !!hitNear, andHit, travel });
    }
    // Anything true on ≥ 6 of 8 counts is the phrase's baseline, not a move.
    const freq = new Map();
    counts.forEach((k) => new Set(k.desc).forEach((d) => freq.set(d, (freq.get(d) || 0) + 1)));
    const common = [...freq].filter(([, n]) => n >= Math.max(3, Math.ceil(counts.length * 0.75))).map(([d]) => d);
    for (const k of counts) { k.desc = k.desc.filter((d) => !common.includes(d)); if (!k.desc.length) k.desc = ["(same)"]; }
    const start = grid[i], end = i + 8 < grid.length ? grid[i + 8] : grid[grid.length - 1] + per;
    return { common, index: ph.index, start: Math.round(start * 100) / 100, end: Math.round(end * 100) / 100, label: ph.label, mirrored: !!ph.mirrored, sim: ph.sim, counts, samples: ph.samples };
  });
  // Precision: how identically the dancer repeats each phrase (mean pairwise match).
  for (const c of clusters) {
    const occ = c.occurrences.map((i) => phrases[i]);
    const sims = [];
    for (let a = 0; a < occ.length; a++) for (let b = a + 1; b < occ.length; b++) sims.push(phraseSim(occ[a].samples, occ[b].samples, !!(occ[a].mirrored ^ occ[b].mirrored), w));
    c.precision = sims.length ? Math.round(mean(sims)) : null;
    c.times = occ.map((p) => ({ start: p.start, end: p.end, mirrored: !!p.mirrored }));
  }
  const labeled = phrases.filter((p) => p.label !== "?").length || 1;
  const order = clusters.slice().sort((a, b) => b.occurrences.length - a.occurrences.length);
  let covered = 0;
  const learnOrder = order.map((c) => { covered += c.occurrences.length; return { label: c.label, repeats: c.occurrences.length, coverage: Math.round((100 * covered) / labeled) }; });
  for (const p of phrases) delete p.samples;
  return {
    grid, bpm: Math.round((60 / per) * 10) / 10, gridSource: beats.length >= 8 ? "audio" : "motion", downbeat: k0,
    phrases, clusters, learnOrder,
    sequence: phrases.map((p) => p.label + (p.mirrored ? "′" : "")),
    uniquePhrases: clusters.length,
  };
}
