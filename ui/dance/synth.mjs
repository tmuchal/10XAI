// Dance Lab — procedural demo dancer.
// Generates pose frames (same format as analyze.mjs) for a "sharp" or "smooth"
// routine on a known beat grid. Used by the in-app demo and by the tests.

import { J, JOINTS } from "./analyze.mjs";

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}
const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

// Arm shapes: [shoulder angle from straight down (rad, + = outward/up), elbow bend (rad)]
const SHAPES = [[0.2, 0.3], [1.57, 0], [2.8, 0.1], [0.9, 1.6], [2.2, -1.2], [0.5, 2.4], [3.0, 0], [1.2, -0.4]];

export function generateDance({ style = "sharp", bpm = 120, duration = 32, fps = 15, seed = 7, aspect = 16 / 9 } = {}) {
  const rand = rng(seed);
  const beat = 60 / bpm;
  const nBeats = Math.ceil(duration / beat) + 2;
  // One target shape per beat for each arm, and a foot position per 4 beats.
  const plan = [];
  for (let b = 0; b < nBeats; b++) {
    const L = SHAPES[Math.floor(rand() * SHAPES.length)];
    const R = rand() < 0.5 ? L : SHAPES[Math.floor(rand() * SHAPES.length)];
    plan.push({ L, R, step: Math.floor(b / 4) % 2 ? 1 : -1 });
  }
  const cx = aspect / 2, T = 0.18;
  const frames = [];
  for (let i = 0; i * (1 / fps) < duration; i++) {
    const t = i / fps;
    const bi = Math.floor(t / beat), ph = (t - bi * beat) / beat;
    const SNAP = 0.11; // sharp style: start moving 110 ms early so the shape lands ON the beat
    let aL, aR, hipDrop, travel, sway;
    if (style === "sharp") {
      const tau = t + SNAP, bj = Math.floor(tau / beat);
      const prev = plan[Math.max(0, bj - 1)], cur = plan[bj];
      const k = ease((tau - bj * beat) / SNAP); // snap into the new shape, then hold
      aL = prev.L.map((v, j) => v + (cur.L[j] - v) * k);
      aR = prev.R.map((v, j) => v + (cur.R[j] - v) * k);
      hipDrop = 0.035 * Math.exp(-Math.pow(ph * beat / 0.07, 2)) + 0.035 * Math.exp(-Math.pow((1 - ph) * beat / 0.07, 2)); // down on the beat
      const prevStep = prev.step * 0.06, curStep = cur.step * 0.06;
      travel = prevStep + (curStep - prevStep) * k;
      sway = 0;
    } else {
      const w = (2 * Math.PI) / (beat * 4);
      aL = [1.4 + 1.1 * Math.sin(w * t), 0.8 + 0.7 * Math.sin(w * t * 0.5 + 1)];
      aR = [1.4 + 1.1 * Math.sin(w * t + Math.PI), 0.8 + 0.7 * Math.sin(w * t * 0.5 + 2)];
      hipDrop = 0.05 * (0.5 - 0.5 * Math.cos(2 * Math.PI * ph)); // highest ON the beat (up-bounce)
      travel = 0.08 * Math.sin((2 * Math.PI * t) / (beat * 8));
      sway = 0.03 * Math.sin((2 * Math.PI * t) / (beat * 2));
    }
    const hip = [cx + travel + sway, 0.55 + hipDrop];
    const sh = [hip[0] + sway * 0.4, hip[1] - T];
    const p = new Array(JOINTS.length * 2);
    const set = (name, x, y) => { p[2 * J[name]] = x; p[2 * J[name] + 1] = y; };
    set("nose", sh[0], sh[1] - 0.07);
    set("ls", sh[0] + 0.05, sh[1]); set("rs", sh[0] - 0.05, sh[1]);
    set("lh", hip[0] + 0.035, hip[1]); set("rh", hip[0] - 0.035, hip[1]);
    for (const [side, sgn, a] of [["l", 1, aL], ["r", -1, aR]]) {
      const sx = p[2 * J[side + "s"]], sy = p[2 * J[side + "s"] + 1];
      const ex = sx + 0.08 * sgn * Math.sin(a[0]), ey = sy + 0.08 * Math.cos(a[0]);
      set(side + "e", ex, ey);
      set(side + "w", ex + 0.075 * sgn * Math.sin(a[0] + a[1]), ey + 0.075 * Math.cos(a[0] + a[1]));
      // Feet planted (they follow the travel), knees absorb the hip drop.
      const hx = p[2 * J[side + "h"]], hy = p[2 * J[side + "h"] + 1];
      const ax = cx + travel + sgn * 0.06, ay = 0.55 + 0.2;
      const bend = Math.sqrt(Math.max(0, 0.1 * 0.1 - Math.pow((ay - hy) / 2, 2)));
      set(side + "k", (hx + ax) / 2 + sgn * bend * 0.8, (hy + ay) / 2);
      set(side + "a", ax, ay);
    }
    for (let k = 0; k < p.length; k++) p[k] = Math.round((p[k] + (rand() - 0.5) * 0.002) * 10000) / 10000;
    frames.push({ t: Math.round(t * 1000) / 1000, p, v: JOINTS.map(() => 0.99), n: 1 });
  }
  const beats = [];
  for (let b = 0; b * beat <= duration; b++) beats.push(Math.round(b * beat * 1000) / 1000);
  return { frames, beats, bpm, duration, style };
}
