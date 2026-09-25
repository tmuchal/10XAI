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
