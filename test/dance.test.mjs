// Dance Lab tests: beat tracking, pose analysis, practice comparison, server routes.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { detectBeats } from "../ui/dance/beat.mjs";
import { analyzePose, comparePoses, matchWithTiming, J } from "../ui/dance/analyze.mjs";
import { buildPracticePlan } from "../ui/dance/drills.mjs";
import { generateDance } from "../ui/dance/synth.mjs";

function clickTrack(bpm, seconds, sr = 22050) {
  const x = new Float32Array(seconds * sr);
  const period = 60 / bpm;
  for (let b = 0; b * period < seconds; b++) {
    const start = Math.floor(b * period * sr);
    for (let i = 0; i < 400 && start + i < x.length; i++) x[start + i] += Math.sin(i * 0.9) * Math.exp(-i / 80) * (b % 4 === 0 ? 1 : 0.6);
  }
  for (let i = 0; i < x.length; i++) x[i] += (Math.random() - 0.5) * 0.01;
  return { x, sr };
}

test("beat tracker finds the tempo and beat grid of a click track", () => {
  for (const bpm of [96, 128, 140]) {
    const { x, sr } = clickTrack(bpm, 20);
    const r = detectBeats(x, sr);
    assert.ok(Math.abs(r.bpm - bpm) < 2.5, `bpm ${r.bpm} vs ${bpm}`);
    const gaps = r.beats.slice(1).map((b, i) => b - r.beats[i]);
    const med = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
    assert.ok(Math.abs(med - 60 / bpm) < 0.03, `beat gap ${med}`);
    // beats sit on the clicks (within ~30 ms)
    const period = 60 / bpm;
    const offs = r.beats.slice(2, -2).map((b) => Math.abs(b - Math.round(b / period) * period));
    assert.ok(offs.every((o) => o < 0.035), "beats aligned with clicks");
  }
});

test("sharp and smooth dancers get opposite profiles", () => {
  const sharp = generateDance({ style: "sharp", bpm: 120 });
  const smooth = generateDance({ style: "smooth", bpm: 120 });
  const a = analyzePose(sharp.frames, { beats: sharp.beats, bpm: 120 });
  const b = analyzePose(smooth.frames, { beats: smooth.beats, bpm: 120 });
  assert.ok(a.ok && b.ok);
  assert.ok(a.axes.sharpness - b.axes.sharpness >= 40, `sharpness ${a.axes.sharpness} vs ${b.axes.sharpness}`);
  assert.ok(b.axes.flow - a.axes.flow >= 40, `flow ${b.axes.flow} vs ${a.axes.flow}`);
  assert.ok(b.axes.groove > a.axes.groove);
  assert.ok(a.axes.rhythm >= 70, "sharp hits land on the beat");
  assert.equal(a.archetype.primary.id, "knife-sync");
  assert.equal(b.archetype.primary.id, "smooth-groove");
  assert.ok(a.raw.bounceOnBeat > 0.2, "sharp dancer: down-bounce");
  assert.ok(b.raw.bounceOnBeat < -0.2, "smooth dancer: up-bounce");
  assert.ok(a.raw.stopTime > 0.05 && a.raw.stopTime < 0.2);
  assert.ok(a.strengths.length >= 2 && a.cues.length >= 4);
});

test("tempo falls back to motion when there is no audio", () => {
  const d = generateDance({ style: "sharp", bpm: 120, duration: 40 });
  const r = analyzePose(d.frames);
  assert.equal(r.raw.bpmSource, "motion");
  // 120 or a harmonic-adjacent reading, never wildly off
  assert.ok(Math.abs(r.raw.bpm - 120) < 12, `motion bpm ${r.raw.bpm}`);
});

test("camera cuts split the analysis instead of creating fake speed spikes", () => {
  const d = generateDance({ style: "sharp", duration: 20 });
  const zoomed = d.frames.filter((f) => f.t >= 10).map((f) => ({ ...f, p: f.p.map((v, i) => (i % 2 ? v * 1.8 - 0.4 : v * 1.8 - 0.8)) }));
  const frames = [...d.frames.filter((f) => f.t < 10), ...zoomed];
  const cut = analyzePose(frames, { beats: d.beats, bpm: 120 });
  const clean = analyzePose(d.frames, { beats: d.beats, bpm: 120 });
  assert.ok(cut.ok);
  assert.equal(cut.quality.cuts, 1);
  assert.ok(Math.abs(cut.raw.peakEnergy - clean.raw.peakEnergy) / clean.raw.peakEnergy < 0.2, "no spike from the cut");
});

test("missing or empty tracking is reported, not crashed", () => {
  assert.equal(analyzePose([]).ok, false);
  assert.equal(analyzePose(Array.from({ length: 50 }, (_, i) => ({ t: i / 15, p: null }))).ok, false);
});

test("pose comparison: identical = 100, mirror-aware, timing lag detected", () => {
  const d = generateDance({ style: "sharp", duration: 12 });
  const f = d.frames[40];
  assert.equal(comparePoses(f, f, { mirror: false }).score, 100);
  // Mirror image of the pose: flip x and swap left/right joint labels.
  const flip = { ...f, p: f.p.slice() };
  const other = (n) => (n[0] === "l" ? "r" : n[0] === "r" ? "l" : "") + (n === "nose" ? "nose" : n.slice(1));
  for (const n of Object.keys(J)) { flip.p[2 * J[n]] = 2 - f.p[2 * J[other(n)]]; flip.p[2 * J[n] + 1] = f.p[2 * J[other(n)] + 1]; }
  assert.equal(comparePoses(flip, f, { mirror: true }).score, 100);
  // User performs the pose from 0.2 s earlier in the reference → 200 ms behind.
  const t = d.frames[100].t;
  const user = d.frames.find((x) => Math.abs(x.t - (t - 0.2)) < 0.01);
  const m = matchWithTiming(user, d.frames, t, { mirror: false });
  assert.ok(Math.abs(m.lagMs - 200) <= 70, `lag ${m.lagMs}`);
});

test("practice plan: tempo ladder, signature drills, killing parts", () => {
  const d = generateDance({ style: "sharp", bpm: 124, duration: 40 });
  const a = analyzePose(d.frames, { beats: d.beats, bpm: 124 });
  const p = buildPracticePlan(a);
  assert.deepEqual(p.ladder.map((l) => l.bpm), [62, 93, 112, 124]);
  assert.ok(p.drills.length >= 3);
  assert.ok(p.drills.every((x) => x.how.length && x.target));
  assert.ok(p.signature.includes("sharpness"));
  assert.ok(p.sessionMinutes > 20);
});

test("server routes: page, assets, reports, input validation", async () => {
  const require = createRequire(import.meta.url);
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), "dance-"));
  const handle = require("../server/dance.cjs")({ root, workspace: ws });
  const srv = http.createServer(async (req, res) => { if (!(await handle(req, res))) { res.writeHead(418); res.end(); } });
  await new Promise((r) => srv.listen(0, r));
  const base = "http://127.0.0.1:" + srv.address().port;
  try {
    let r = await fetch(base + "/dance");
    assert.equal(r.status, 200);
    assert.match(await r.text(), /Dance Lab/);
    r = await fetch(base + "/dance/analyze.mjs");
    assert.equal(r.headers.get("content-type"), "text/javascript");
    assert.equal((await fetch(base + "/dance/..%2F..%2Fpackage.json")).status, 404);
    assert.equal((await fetch(base + "/api/tasks")).status, 418, "non-dance routes fall through");
    assert.equal((await fetch(base + "/api/dance/meta?url=https://example.com")).status, 400);
    r = await fetch(base + "/api/dance/fetch", { method: "POST", body: JSON.stringify({ url: "https://youtu.be/dQw4w9WgXcQ" }) });
    assert.equal(r.status, 400, "needs personal-study acknowledgement");
    r = await fetch(base + "/api/dance/fetch", { method: "POST", body: JSON.stringify({ url: "https://youtu.be/x; rm -rf /", ack: true }) });
    assert.equal(r.status, 400, "rejects non-YouTube ids");
    const d = generateDance({ duration: 10 });
    const analysis = analyzePose(d.frames, { beats: d.beats, bpm: d.bpm });
    r = await fetch(base + "/api/dance/reports", { method: "POST", body: JSON.stringify({ source: { title: "t" }, analysis, frames: d.frames, beats: d.beats }) });
    const { id } = await r.json();
    assert.match(id, /^[a-f0-9]{12}$/);
    const list = await (await fetch(base + "/api/dance/reports")).json();
    assert.equal(list[0].id, id);
    const doc = await (await fetch(base + "/api/dance/reports/" + id)).json();
    assert.equal(doc.frames.length, d.frames.length);
  } finally {
    srv.close();
    fs.rmSync(ws, { recursive: true, force: true });
  }
});

test("tracker keeps member identities through a position swap", async () => {
  const { generateGroup } = await import("../ui/dance/synth.mjs");
  const { createTracker, buildMembers } = await import("../ui/dance/tracker.mjs");
  const g = generateGroup({ duration: 30 });
  const tr = createTracker();
  const samples = g.samples.map((s) => ({ t: s.t, people: tr.update(s.t, s.dets.map((f) => ({ f }))).map(({ id, f }) => ({ id, p: f.p, v: f.v })) }));
  const members = buildMembers(samples);
  assert.equal(members.length, 4);
  // Each tracked member must be the same synthetic dancer from start to end.
  for (const m of members) {
    const src = g.members.map((gm) => m.frames.filter((f, i) => f.p && f.p[0] === gm.frames[i].p[0]).length);
    assert.equal(Math.max(...src), m.frames.filter((f) => f.p).length, `member ${m.id} switched identity`);
  }
});

test("fancam crop follows one member, stays in frame, and is smooth", async () => {
  const { generateGroup } = await import("../ui/dance/synth.mjs");
  const { cropPath } = await import("../ui/dance/fancam.mjs");
  const g = generateGroup({ duration: 30 });
  const m = g.members[1]; // travels across the stage
  const path = cropPath(m.frames, { outAspect: 9 / 16, videoAspect: 16 / 9 });
  assert.equal(path.length, m.frames.length);
  for (const [i, c] of path.entries()) {
    const w = c.h * 9 / 16;
    assert.ok(c.cx - w / 2 >= -1e-9 && c.cx + w / 2 <= 16 / 9 + 1e-9 && c.cy - c.h / 2 >= -1e-9 && c.cy + c.h / 2 <= 1 + 1e-9, "crop inside frame");
    const hx = (m.frames[i].p[2 * 7] + m.frames[i].p[2 * 8]) / 2;
    assert.ok(Math.abs(hx - c.cx) < w / 2, "member stays in the crop");
  }
  const jumps = path.slice(1).map((c, i) => Math.abs(c.cx - path[i].cx));
  assert.ok(Math.max(...jumps) < 0.05, "no camera jerks");
});

test("group sync finds the late member and the off-choreo member", async () => {
  const { generateGroup } = await import("../ui/dance/synth.mjs");
  const { groupSync } = await import("../ui/dance/analyze.mjs");
  const g = generateGroup({ duration: 30 });
  const r = groupSync(g.members.map((m, i) => ({ id: i + 1, frames: m.frames })));
  assert.ok(r.perMember[2].lagMs >= 60, `B late: ${r.perMember[2].lagMs}`);
  assert.ok(r.perMember[4].sync < r.perMember[1].sync - 10, "D dances something else");
  assert.ok(r.perMember[1].sync > r.perMember[4].sync && r.overall > 0);
});

test("fragmented tracks of one dancer are stitched back together", async () => {
  const { generateDance } = await import("../ui/dance/synth.mjs");
  const { buildMembers } = await import("../ui/dance/tracker.mjs");
  const d = generateDance({ duration: 20 });
  // Same dancer, three ids (lost behind someone twice), plus a passer-by for 15% of the time.
  const samples = d.frames.map((f, i) => ({ t: f.t, people: [
    ...(i % 100 > 90 ? [] : [{ id: i < 100 ? 1 : i < 200 ? 2 : 3, p: f.p, v: f.v, col: [0.8, 0.2, 0.3, 0.1, 0.1, 0.1] }]),
    ...(i < 45 ? [{ id: 9, p: f.p.map((x, k) => (k % 2 ? x : x - 0.6)), v: f.v, col: [0.2, 0.2, 0.9, 0.5, 0.5, 0.5] }] : []),
  ] }));
  const ms = buildMembers(samples);
  assert.equal(ms.length, 1);
  assert.ok(ms[0].coverage > 0.85 && ms[0].main);
});

test("trend catalog validates and trend fit ranks the right style", async () => {
  const { BUNDLED, validateTrends, rankTrends } = await import("../ui/dance/trends.mjs");
  const { trendPlan } = await import("../ui/dance/drills.mjs");
  const clean = validateTrends(BUNDLED);
  assert.equal(clean.trends.length, BUNDLED.trends.length);
  assert.throws(() => validateTrends({ trends: [{ name: "x", profile: { power: 50 } }] }), /profile/);
  const dirty = validateTrends({ trends: [{ id: "A B<script>", name: "n", profile: { power: 500, flow: -3, groove: "70", bogus: 9 }, examples: [{ artist: "a", song: "s", source: "javascript:alert(1)" }] }] });
  assert.equal(dirty.trends[0].id, "a-b-script-");
  assert.deepEqual(dirty.trends[0].profile, { power: 100, flow: 0, groove: 70 });
  assert.equal(dirty.trends[0].examples[0].source, "");
  // A smooth, groovy, flowing dancer should not rank "Predator drop & freeze" first.
  const d = generateDance({ style: "smooth" });
  const a = analyzePose(d.frames, { beats: d.beats, bpm: d.bpm });
  const rk = rankTrends(a.axes, BUNDLED);
  assert.notEqual(rk[0].id, "drop-freeze");
  assert.ok(rk[0].fit >= rk[rk.length - 1].fit);
  const tp = trendPlan(a, rk.find((x) => x.id === "drop-freeze"));
  assert.ok(tp.drills.length >= 2 && tp.gaps.some((g) => g.axis === "sharpness" && g.delta > 0));
});

test("count sheet: 8-count phrases, repeated and mirrored phrases detected", async () => {
  const { analyzeChoreo } = await import("../ui/dance/choreo.mjs");
  const d = generateDance({ style: "sharp", bpm: 120, duration: 32, structure: "ABAaBC" });
  const a = analyzePose(d.frames, { beats: d.beats, bpm: 120 });
  const c = analyzeChoreo(d.frames, { beats: d.beats, bpm: 120, accents: a.accents });
  assert.equal(c.downbeat, 0);
  assert.deepEqual(c.sequence.slice(0, 6), ["A", "B", "A", "A′", "B", "C"]);
  assert.equal(c.uniquePhrases, 3);
  assert.equal(c.learnOrder[0].label, "A");
  assert.ok(c.clusters.find((x) => x.label === "A").precision >= 90, "synthetic dancer repeats precisely");
  const cnt = c.phrases[0].counts;
  assert.equal(cnt.length, 8);
  assert.ok(cnt.every((x) => x.desc.length >= 1 && x.p));
  assert.ok(c.phrases[0].common.length >= 1, "shared stance factored out");
});

test("pose descriptions name the obvious shapes", async () => {
  const { describePose } = await import("../ui/dance/choreo.mjs");
  const { J } = await import("../ui/dance/analyze.mjs");
  const base = generateDance({ duration: 1 }).frames[0];
  const pose = (fn) => { const f = { ...base, p: base.p.slice() }; fn(f.p); return f; };
  const set = (p, n, x, y) => { p[2 * J[n]] = x; p[2 * J[n] + 1] = y; };
  const up = pose((p) => { for (const s of ["l", "r"]) { const sx = p[2 * J[s + "s"]], sy = p[2 * J[s + "s"] + 1]; set(p, s + "e", sx, sy - 0.08); set(p, s + "w", sx, sy - 0.155); } });
  assert.match(describePose(up).join(" | "), /Both arms (overhead|hand above head)/);
  const t = pose((p) => { for (const [s, g] of [["l", 1], ["r", -1]]) { const sx = p[2 * J[s + "s"]], sy = p[2 * J[s + "s"] + 1]; set(p, s + "e", sx + g * 0.08, sy); set(p, s + "w", sx + g * 0.155, sy); } });
  assert.match(describePose(t).join(" | "), /Both arms out to the side/);
});

test("cover vs idol: sync by motion, find dragging + softer hits; perfect copy scores ~100", async () => {
  const { compareCover, motionEnvelope, alignEnvelopes } = await import("../ui/dance/compare.mjs");
  const { frameAt } = await import("../ui/dance/analyze.mjs");
  const ref = generateDance({ style: "sharp", bpm: 120, duration: 30, structure: "ABAC" });
  const refA = analyzePose(ref.frames, { beats: ref.beats, bpm: 120 });
  // The learner: 150 ms late and mushy (half of each pose blended with 180 ms earlier), filmed starting 2 s into the song.
  const cover = [];
  for (let t = 2; t < 30; t += 1 / 15) {
    const a = frameAt(ref.frames, t - 0.15), b = frameAt(ref.frames, t - 0.33);
    if (!a || !b) continue;
    cover.push({ t: Math.round((t - 2) * 1000) / 1000, p: a.p.map((x, i) => 0.5 * x + 0.5 * b.p[i]), v: a.v });
  }
  const covA = analyzePose(cover, {});
  const al = alignEnvelopes(motionEnvelope(ref.frames), motionEnvelope(cover));
  assert.ok(Math.abs(al.shift - 2) < 0.45, `motion sync shift ${al.shift}`);
  // With the true (audio) sync, the lag must show up as dragging.
  const r = compareCover({ ref: { frames: ref.frames, analysis: refA }, cover: { frames: cover, analysis: covA }, shift: 2 });
  assert.ok(r.ok);
  assert.ok(r.lagMs >= 100, `lag ${r.lagMs}`);
  assert.ok(r.weaknesses.some((w) => /Dragging/.test(w.title)));
  assert.ok(r.weaknesses.some((w) => w.axis === "sharpness"), JSON.stringify(r.axes));
  assert.ok(r.fixes.length >= 1);
  const same = compareCover({ ref: { frames: ref.frames, analysis: refA }, cover: { frames: ref.frames, analysis: refA }, shift: 0 });
  assert.ok(same.match >= 95 && same.grade === "S" && !same.weaknesses.length);
  assert.ok(same.strengths.length >= 3);
});
