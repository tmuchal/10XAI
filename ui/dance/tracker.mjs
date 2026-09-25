// Dance Lab — multi-person tracker.
// Gives every member a stable id across frames so each can be analyzed and
// "fancammed" on their own. Matching uses predicted position (constant
// velocity), body scale and an outfit colour signature; a member who vanishes
// (occlusion, formation change) is re-identified by colour for a few seconds.
import { J, bodyScale } from "./analyze.mjs";

const hip = (f) => [(f.p[2 * J.lh] + f.p[2 * J.rh]) / 2, (f.p[2 * J.lh + 1] + f.p[2 * J.rh + 1]) / 2];
const colorDist = (a, b) => (a && b ? a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0) / a.length : 0.15);

export function createTracker({ keepSec = 1.2, reidSec = 5 } = {}) {
  let nextId = 1;
  const tracks = [];
  return {
    // dets: [{ f: compact frame, col?: number[] }] → [{ id, f }]
    update(t, dets) {
      const obs = dets.map((d) => ({ ...d, c: hip(d.f), s: bodyScale(d.f) }));
      const pairs = [];
      for (const tr of tracks) {
        const dt = t - tr.t;
        if (dt <= 0 || dt > reidSec) continue;
        const k = Math.min(dt, 0.4);
        const pred = [tr.c[0] + tr.v[0] * k, tr.c[1] + tr.v[1] * k];
        obs.forEach((o, j) => {
          const scale = (tr.s + o.s) / 2;
          const d = Math.hypot(pred[0] - o.c[0], pred[1] - o.c[1]) / scale;
          const sd = Math.abs(Math.log(o.s / tr.s));
          const cd = colorDist(tr.col, o.col);
          let cost;
          if (dt <= keepSec) { if (d > 1.6 + dt * 3) return; cost = d + 3 * sd + 4 * cd; }
          else { if (cd > 0.12 || sd > 0.5) return; cost = 1.5 + 8 * cd + 0.2 * d; } // re-identify after a disappearance
          pairs.push({ tr, j, cost });
        });
      }
      pairs.sort((a, b) => a.cost - b.cost);
      const usedT = new Set(), usedO = new Set(), out = [];
      for (const p of pairs) {
        if (usedT.has(p.tr) || usedO.has(p.j)) continue;
        usedT.add(p.tr); usedO.add(p.j);
        const o = obs[p.j], tr = p.tr, dt = Math.max(1e-3, t - tr.t);
        const v = [(o.c[0] - tr.c[0]) / dt, (o.c[1] - tr.c[1]) / dt];
        tr.v = dt < 0.5 ? [0.6 * tr.v[0] + 0.4 * v[0], 0.6 * tr.v[1] + 0.4 * v[1]] : [0, 0];
        tr.c = o.c; tr.s = 0.8 * tr.s + 0.2 * o.s; tr.t = t;
        if (o.col) tr.col = tr.col ? tr.col.map((x, i) => 0.9 * x + 0.1 * o.col[i]) : o.col;
        out.push({ id: tr.id, f: o.f, col: o.col });
      }
      obs.forEach((o, j) => {
        if (usedO.has(j)) return;
        const tr = { id: nextId++, c: o.c, v: [0, 0], s: o.s, t, col: o.col || null };
        tracks.push(tr);
        out.push({ id: tr.id, f: o.f, col: o.col });
      });
      return out;
    },
  };
}

/**
 * samples: [{ t, people: [{ id, p, v }] }] → members sorted left→right:
 *   [{ id: 1.., frames: [{t,p,v}|{t,p:null}], coverage }]
 * Tracks seen in < minCoverage of samples (passers-by, flicker) are dropped.
 */
export function buildMembers(samples, { minCoverage = 0.2, max = 9, aspect = 16 / 9 } = {}) {
  const byId = new Map();
  samples.forEach((s, i) => s.people.forEach((p) => {
    if (!byId.has(p.id)) byId.set(p.id, new Array(samples.length).fill(null));
    byId.get(p.id)[i] = p;
  }));
  const arrs = stitch([...byId.values()], samples);
  const list = [];
  for (const arr of arrs) {
    const seen = arr.filter(Boolean);
    const coverage = seen.length / Math.max(1, samples.length);
    if (coverage < minCoverage) continue;
    const meanX = seen.reduce((a, p) => a + hip(p)[0], 0) / seen.length;
    const size = seen.reduce((a, p) => a + bodyScale(p), 0) / seen.length;
    list.push({ coverage, meanX, size, frames: arr.map((p, i) => (p ? { t: samples[i].t, p: p.p, v: p.v } : { t: samples[i].t, p: null, v: null })) });
  }
  // Keep the most present / biggest, then order left→right like a line-up.
  list.sort((a, b) => b.coverage * b.size - a.coverage * a.size);
  const kept = list.slice(0, max).sort((a, b) => a.meanX - b.meanX);
  // "Main" dancer: present, big, and central (a fancam's usual subject).
  const mainScore = (m) => m.coverage * m.size * (1 - Math.min(0.8, Math.abs(m.meanX - aspect / 2) / aspect));
  const main = kept.slice().sort((a, b) => mainScore(b) - mainScore(a))[0];
  return kept.map((m, i) => ({ id: i + 1, coverage: Math.round(m.coverage * 100) / 100, main: m === main, frames: m.frames }));
}

// Re-join fragments of the same person (lost behind another member, then
// re-detected under a new id): time-disjoint, close in space, similar outfit.
function stitch(arrs, samples) {
  const segs = arrs.map((arr) => {
    const idx = arr.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
    const cols = idx.map((i) => arr[i].col).filter(Boolean);
    const col = cols.length ? cols[0].map((_, k) => cols.reduce((a, c) => a + c[k], 0) / cols.length) : null;
    return { arr, first: idx[0], last: idx[idx.length - 1], col, alive: true };
  });
  let merged = true;
  while (merged) {
    merged = false;
    let best = null;
    for (const a of segs) {
      if (!a.alive) continue;
      for (const b of segs) {
        if (!b.alive || a === b || b.first <= a.last) continue;
        const gap = samples[b.first].t - samples[a.last].t;
        if (gap > 2.5) continue;
        const pa = a.arr[a.last], pb = b.arr[b.first];
        const scale = (bodyScale(pa) + bodyScale(pb)) / 2;
        const d = Math.hypot(hip(pa)[0] - hip(pb)[0], hip(pa)[1] - hip(pb)[1]) / scale;
        const cd = a.col && b.col ? colorDist(a.col, b.col) : 0.05;
        if (d > 1 + 2 * gap || cd > 0.12 || Math.abs(Math.log(bodyScale(pb) / bodyScale(pa))) > 0.4) continue;
        const cost = d + 10 * cd + gap;
        if (!best || cost < best.cost) best = { a, b, cost };
      }
    }
    if (best) {
      const { a, b } = best;
      for (let i = b.first; i <= b.last; i++) if (b.arr[i]) a.arr[i] = b.arr[i];
      a.last = b.last; b.alive = false; merged = true;
    }
  }
  return segs.filter((s) => s.alive).map((s) => s.arr);
}
