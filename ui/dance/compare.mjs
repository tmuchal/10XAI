// Dance Lab — "my cover vs the idol".
// Aligns a learner's cover video to the reference (by the song's audio when
// both have it, else by motion), then compares pose, timing and style, and
// turns the gaps into strengths / weaknesses / priority fixes.
import { J, AXES, frameAt, matchWithTiming, comparePoses } from "./analyze.mjs";

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// Motion envelope: mean joint speed resampled at `fps` (for motion alignment).
export function motionEnvelope(frames, fps = 10) {
  const known = frames.filter((f) => f.p);
  if (known.length < 4) return { env: new Float32Array(0), fps, t0: 0 };
  const t0 = known[0].t, t1 = known[known.length - 1].t;
  const n = Math.floor((t1 - t0) * fps);
  const env = new Float32Array(Math.max(0, n));
  const joints = ["lw", "rw", "le", "re", "lk", "rk", "la", "ra"].map((k) => J[k]);
  for (let i = 0; i < n; i++) {
    const a = frameAt(frames, t0 + i / fps), b = frameAt(frames, t0 + (i + 1) / fps);
    if (!a || !b) continue;
    let s = 0;
    for (const j of joints) s += Math.hypot(b.p[2 * j] - a.p[2 * j], b.p[2 * j + 1] - a.p[2 * j + 1]);
    env[i] = s;
  }
  return { env, fps, t0 };
}

/**
 * Best shift between two envelopes sampled at the same fps.
 * Returns shift in seconds such that  timeInA = timeInB + shift  (+ the t0s),
 * and a confidence (peak normalized cross-correlation, 0..1).
 */
export function alignEnvelopes(a, b, { maxLagSec = 30 } = {}) {
  const fps = a.fps;
  const za = zscore(a.env), zb = zscore(b.env);
  const maxLag = Math.min(Math.round(maxLagSec * fps), za.length + zb.length);
  let best = 0, bestC = -Infinity;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    // Compare a[i] with b[i - lag]
    let s = 0, n = 0;
    const i0 = Math.max(0, lag), i1 = Math.min(za.length, zb.length + lag);
    for (let i = i0; i < i1; i++) { s += za[i] * zb[i - lag]; n++; }
    // Need a real overlap (≥ 3 s and ≥ half the shorter recording) — tiny overlaps correlate by chance.
    if (n < fps * 3 || n < 0.5 * Math.min(za.length, zb.length)) continue;
    const c = s / n;
    if (c > bestC) { bestC = c; best = lag; }
  }
  return { shift: best / fps + (a.t0 || 0) - (b.t0 || 0), confidence: Math.max(0, Math.min(1, bestC)) };
}
function zscore(x) {
  const m = mean(Array.from(x)), sd = Math.sqrt(mean(Array.from(x, (v) => (v - m) ** 2))) || 1;
  return Float32Array.from(x, (v) => (v - m) / sd);
}

const AXIS_NAME = Object.fromEntries(AXES.map((a) => [a.key, a.label]));
const DRILL_FOR = { power: "full-out-8s", sharpness: "hit-freeze", flow: "waves", groove: "bounce", extension: "lines", footwork: "step-ladder", levels: "level-changes", rhythm: "count-clap" };
const PART = { leftArm: "left arm", rightArm: "right arm", leftLeg: "left leg", rightLeg: "right leg", torso: "torso" };

/**
 * compareCover({ ref, cover, shift, phrases })
 *   ref / cover: { frames, analysis }   (analysis from analyzePose)
 *   shift: seconds so that refTime = coverTime + shift
 *   phrases: optional [{ start, end, label }] in reference time (count sheet)
 */
export function compareCover({ ref, cover, shift = 0, phrases = null, step = 0.1 }) {
  const cf = cover.frames.filter((f) => f.p).map((f) => ({ ...f, t: Math.round((f.t + shift) * 1000) / 1000 }));
  if (cf.length < 20) return { ok: false, reason: "Not enough of you was tracked in the cover video — film full-body, one person, steady camera." };
  const t0 = Math.max(cf[0].t, ref.frames.find((f) => f.p)?.t ?? 0), t1 = Math.min(cf[cf.length - 1].t, [...ref.frames].reverse().find((f) => f.p)?.t ?? 0);
  if (t1 - t0 < 3) return { ok: false, reason: "The cover and the reference overlap by less than 3 s after syncing — is it the same song/part?" };
  // Mirror: covers are often filmed selfie-flipped. Pick whichever matches better.
  const probe = (mirror) => { const s = []; for (let t = t0; t <= t1; t += 0.5) { const a = frameAt(cf, t), b = frameAt(ref.frames, t); if (a && b) s.push(comparePoses(a, b, { mirror }).score); } return mean(s); };
  const mirror = probe(true) > probe(false) + 2;
  const rows = [];
  for (let t = t0; t <= t1; t += step) {
    const u = frameAt(cf, t);
    if (!u) continue;
    const m = matchWithTiming(u, ref.frames, t, { mirror, window: 0.4 });
    if (m) rows.push({ t, score: m.score, parts: m.parts, lag: m.bestScore >= 55 ? m.lagMs : null });
  }
  if (rows.length < 10) return { ok: false, reason: "Too few comparable moments after syncing." };
  const match = Math.round(mean(rows.map((r) => r.score)));
  const parts = Object.fromEntries(Object.keys(rows[0].parts).map((k) => [k, Math.round(mean(rows.map((r) => r.parts[k])))]));
  const lag = median(rows.map((r) => r.lag).filter((x) => x != null));
  const spans = (phrases && phrases.length ? phrases : chunk(t0, t1, 4)).map((p) => {
    const rs = rows.filter((r) => r.t >= p.start && r.t < p.end);
    if (rs.length < 5) return null;
    const lg = median(rs.map((r) => r.lag).filter((x) => x != null));
    return { start: p.start, end: p.end, label: p.label || "", match: Math.round(mean(rs.map((r) => r.score))), lagMs: lg };
  }).filter(Boolean);

  // Style comparison on the same axes.
  const A = ref.analysis, B = cover.analysis;
  const axes = B && B.ok ? AXES.map((a) => ({ key: a.key, label: a.label, idol: A.axes[a.key], you: B.axes[a.key], delta: B.axes[a.key] - A.axes[a.key] })) : [];
  const styleMatch = axes.length ? Math.max(0, Math.round(100 - 1.4 * mean(axes.map((x) => Math.abs(x.delta))))) : null;
  const ra = A.raw, rb = B && B.ok ? B.raw : null;
  const metric = (label, a, b, fmt, better) => (a == null || b == null ? null : { label, idol: fmt(a), you: fmt(b), deltaPct: a ? Math.round(((b - a) / Math.abs(a)) * 100) : 0, better });
  const metrics = rb ? [
    metric("Energy (limb speed)", ra.energy, rb.energy, (x) => `${x} TL/s`, "higher"),
    metric("Sharp stops", ra.hitRatio, rb.hitRatio, (x) => `${Math.round(x * 100)}%`, "higher"),
    metric("Stop time after a hit", ra.stopTime, rb.stopTime, (x) => `${Math.round(x * 1000)} ms`, "lower"),
    metric("Arm reach", ra.extension, rb.extension, (x) => `${Math.round(x * 100)}%`, "higher"),
    metric("Bounce", ra.bounceAmp, rb.bounceAmp, (x) => `${x} TL`, "match"),
    metric("Knee angle", ra.kneeAngle, rb.kneeAngle, (x) => `${x}°`, "match"),
    metric("Time in motion", ra.continuity, rb.continuity, (x) => `${Math.round(x * 100)}%`, "match"),
    metric("Energy last ⅓ vs first ⅓", ra.stamina, rb.stamina, (x) => `${Math.round(x * 100)}%`, "higher"),
  ].filter(Boolean) : [];

  // Strengths: signature traits you already match, strong body parts, best phrases, timing.
  const strengths = [], weaknesses = [];
  for (const x of axes) {
    if (x.idol >= 55 && x.delta >= -8 && x.delta <= 15) strengths.push({ kind: "style", title: `${x.label} matches the idol`, evidence: `${x.label} ${x.you} vs ${x.idol} — this signature trait is already there.` });
    else if (x.idol >= 50 && x.delta > 15) strengths.push({ kind: "style", title: `More ${x.label.toLowerCase()} than the idol`, evidence: `${x.label} ${x.you} vs ${x.idol} — a strength, but dial it to ${x.idol} if you want the exact feel.` });
  }
  for (const [k, v] of Object.entries(parts)) if (v >= 80) strengths.push({ kind: "body", title: `Clean ${PART[k]}`, evidence: `${PART[k]} matches ${v}/100 on average.` });
  const bestPh = spans.slice().sort((a, b) => b.match - a.match)[0];
  if (bestPh && bestPh.match >= 70) strengths.push({ kind: "phrase", title: `Best part: ${bestPh.label ? "phrase " + bestPh.label + " " : ""}${fmt(bestPh.start)}–${fmt(bestPh.end)}`, evidence: `${bestPh.match}/100 pose match there.` });
  if (lag != null && Math.abs(lag) < 70) strengths.push({ kind: "timing", title: "On the count", evidence: `Median timing offset ${lag} ms.` });

  // Weaknesses: biggest style gaps weighted by how much the trait matters to this dance.
  axes.filter((x) => x.delta <= -15).sort((a, b) => a.delta * (a.idol / 100) - b.delta * (b.idol / 100)).slice(0, 3).forEach((x) => {
    weaknesses.push({ kind: "style", axis: x.key, drill: DRILL_FOR[x.key], title: `${x.label} gap: ${x.you} vs ${x.idol}`, evidence: gapEvidence(x.key, ra, rb) });
  });
  axes.filter((x) => x.delta >= 25 && x.idol < 50).slice(0, 1).forEach((x) => weaknesses.push({ kind: "style", axis: x.key, title: `Too much ${x.label.toLowerCase()} for this song`, evidence: `${x.you} vs ${x.idol} — it reads as a different style; tone it down to match.` }));
  const worstPart = Object.entries(parts).sort((a, b) => a[1] - b[1])[0];
  if (worstPart && worstPart[1] < 70) weaknesses.push({ kind: "body", title: `Your ${PART[worstPart[0]]} is off`, evidence: `${PART[worstPart[0]]} matches ${worstPart[1]}/100 — check its angles against the count sheet.`, part: worstPart[0] });
  if (lag != null && Math.abs(lag) >= 70) weaknesses.push({ kind: "timing", drill: "count-clap", title: lag > 0 ? `Dragging ${lag} ms behind` : `Rushing ${-lag} ms ahead`, evidence: lag > 0 ? "Start each move earlier: the pose must land ON the count, not begin there." : "Let the music lead — hold each pose until the count." });
  spans.filter((p) => p.match < 60).sort((a, b) => a.match - b.match).slice(0, 2).forEach((p) => weaknesses.push({ kind: "phrase", title: `Weakest part: ${p.label ? "phrase " + p.label + " " : ""}${fmt(p.start)}–${fmt(p.end)}`, evidence: `${p.match}/100 match${p.lagMs != null && Math.abs(p.lagMs) >= 70 ? `, ${p.lagMs > 0 ? "late" : "early"} by ${Math.abs(p.lagMs)} ms` : ""}.`, start: p.start, end: p.end }));
  if (rb && ra.stamina != null && rb.stamina != null && rb.stamina < ra.stamina - 0.15) weaknesses.push({ kind: "stamina", drill: "full-out-8s", title: "You fade toward the end", evidence: `Your last-third energy is ${Math.round(rb.stamina * 100)}% of your first third (idol: ${Math.round(ra.stamina * 100)}%).` });

  const fixes = weaknesses.filter((w) => w.drill || w.start != null).slice(0, 3);
  const grade = match >= 85 ? "S" : match >= 75 ? "A" : match >= 65 ? "B" : match >= 50 ? "C" : "D";
  return { ok: true, shift: Math.round(shift * 1000) / 1000, mirror, overlapSec: Math.round((t1 - t0) * 10) / 10, match, grade, styleMatch, parts, lagMs: lag, spans, axes, metrics, strengths, weaknesses, fixes, timeline: rows.map((r) => [Math.round(r.t * 10) / 10, r.score]) };
}

function chunk(t0, t1, len) { const out = []; for (let t = t0; t < t1; t += len) out.push({ start: t, end: Math.min(t1, t + len) }); return out; }
function fmt(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, "0")}`; }
function gapEvidence(axis, a, b) {
  const p = (x) => Math.round(x * 100) + "%";
  switch (axis) {
    case "sharpness": return b.stopTime != null && a.stopTime != null ? `Your stops take ${Math.round(b.stopTime * 1000)} ms vs ${Math.round(a.stopTime * 1000)} ms; ${p(b.hitRatio)} of your accents stop sharply vs ${p(a.hitRatio)}.` : `${p(b.hitRatio)} of your accents stop sharply vs ${p(a.hitRatio)}.`;
    case "power": return `Your limb speed averages ${b.energy} TL/s vs ${a.energy} (peaks ${b.peakEnergy} vs ${a.peakEnergy}).`;
    case "flow": return `You keep moving ${p(b.continuity)} of the time vs ${p(a.continuity)}.`;
    case "groove": return `Your bounce is ${b.bounceAmp} vs ${a.bounceAmp} torso-lengths; knees ${b.kneeAngle}° vs ${a.kneeAngle}°.`;
    case "extension": return `Your arms reach ${p(b.extension)} of full length vs ${p(a.extension)}.`;
    case "footwork": return `You travel ${b.travelPerMin} vs ${a.travelPerMin} torso-lengths/min.`;
    case "levels": return `Your hip-height range is ${b.levelRange} vs ${a.levelRange} torso-lengths.`;
    case "rhythm": return b.onBeat != null && a.onBeat != null ? `${p(b.onBeat)} of your accents are on the beat vs ${p(a.onBeat)}.` : "Your accents don't lock to the pulse as consistently.";
    default: return "";
  }
}
