// Dance Lab — MediaPipe Pose Landmarker wrapper (browser only).
// Everything runs locally in the browser; frames never leave the machine.
import { fromMediaPipe, MP_INDEX, J } from "./analyze.mjs";
import { createTracker } from "./tracker.mjs";

const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODELS = {
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  heavy: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
};

let visionMod = null, fileset = null;
export async function createLandmarker({ model = "full", numPoses = 6, delegate = "GPU" } = {}) {
  visionMod ||= await import(`${VISION}/vision_bundle.mjs`);
  fileset ||= await visionMod.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
  const opts = (d) => ({
    baseOptions: { modelAssetPath: MODELS[model] || MODELS.full, delegate: d },
    runningMode: "VIDEO", numPoses,
    minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
  let lm;
  try { lm = await visionMod.PoseLandmarker.createFromOptions(fileset, opts(delegate)); lm.delegate = delegate; }
  catch { lm = await visionMod.PoseLandmarker.createFromOptions(fileset, opts("CPU")); lm.delegate = "CPU"; }
  lm.model = model;
  return lm;
}

// Choose the dancer to follow: the biggest, most central person on the first
// frame, then whoever stays closest to the previous choice (member tracking).
function pickPerson(poses, aspect, prev) {
  let best = null, bestScore = -Infinity;
  for (const lm of poses) {
    const pts = MP_INDEX.map((i) => lm[i]);
    const ys = pts.map((p) => p.y);
    const size = (Math.max(...ys) - Math.min(...ys));
    const cx = (lm[23].x + lm[24].x) / 2 * aspect, cy = (lm[23].y + lm[24].y) / 2;
    let s = size;
    if (prev) s -= 3 * Math.hypot(cx - prev[0], cy - prev[1]);
    else s -= 0.5 * Math.abs(cx - aspect / 2);
    if (s > bestScore) { bestScore = s; best = { lm, c: [cx, cy], d: prev ? Math.hypot(cx - prev[0], cy - prev[1]) : 0 }; }
  }
  return best;
}

function seek(video, t) {
  return new Promise((resolve) => {
    const done = () => { video.removeEventListener("seeked", done); resolve(); };
    video.addEventListener("seeked", done);
    video.currentTime = t;
  });
}

/**
 * Sample the video at `fps` and track every dancer: returns { samples: [{ t, people: [{id,p,v}] }], aspect }.
 *   onProgress(fraction, sample) per sample; signal.aborted stops early.
 *   onSlowGpu() → Promise<landmarker>: called once if GPU inference is slower
 *   than 250 ms/frame (software GL); should return a CPU landmarker.
 * Uses playback + requestVideoFrameCallback when available (no per-frame
 * seeking; playback speed adapts to inference speed), else seeks frame by frame.
 */
export async function extractPoses(video, landmarker, { fps = 15, start = 0, end = null, onProgress, signal, onSlowGpu } = {}) {
  const stop = Math.min(end ?? video.duration, video.duration);
  const aspect = video.videoWidth / video.videoHeight;
  let ts = 0, lm = landmarker, detMs = [], swapped = false;

  const tracker = createTracker();
  const samples = [];
  const colorCanvas = document.createElement("canvas");
  const CW = 160, CH = Math.round(CW / aspect);
  colorCanvas.width = CW; colorCanvas.height = CH;
  const cctx = colorCanvas.getContext("2d", { willReadFrequently: true });
  // Outfit colour signature: mean RGB of the torso box and the thigh box.
  const signature = (img, f) => {
    const box = (a, b) => {
      const xs = a.map((j) => f.p[2 * j] / aspect * CW), ys = b.map((j) => f.p[2 * j + 1] * CH);
      let x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(CW - 1, Math.ceil(Math.max(...xs)));
      let y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(CH - 1, Math.ceil(Math.max(...ys)));
      const dx = Math.floor((x1 - x0) * 0.2), dy = Math.floor((y1 - y0) * 0.15);
      x0 += dx; x1 -= dx; y0 += dy; y1 -= dy;
      let r = 0, g = 0, bl = 0, n = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = 4 * (y * CW + x); r += img[k]; g += img[k + 1]; bl += img[k + 2]; n++; }
      return n ? [r / n / 255, g / n / 255, bl / n / 255] : [0.5, 0.5, 0.5];
    };
    return [...box([J.ls, J.rs, J.lh, J.rh], [J.ls, J.rs, J.lh, J.rh]), ...box([J.lh, J.rh, J.lk, J.rk], [J.lh, J.rh, J.lk, J.rk])];
  };

  const detect = async (t) => {
    const a = performance.now();
    ts = Math.max(ts + 1, Math.round(performance.now()));
    const res = lm.detectForVideo(video, ts);
    detMs.push(performance.now() - a);
    const poses = (res.landmarks || []).map((l) => fromMediaPipe(l, aspect, t));
    let img = null;
    if (poses.length > 1) { cctx.drawImage(video, 0, 0, CW, CH); img = cctx.getImageData(0, 0, CW, CH).data; }
    const people = tracker.update(t, poses.map((f) => ({ f, col: img ? signature(img, f) : null })))
      .map(({ id, f, col }) => ({ id, p: f.p, v: f.v, ...(col ? { col: col.map((x) => Math.round(x * 100) / 100) } : {}) }));
    const sample = { t: Math.round(t * 1000) / 1000, people };
    samples.push(sample);
    onProgress && onProgress(Math.min(1, (t - start) / (stop - start)), sample);
    if (!swapped && onSlowGpu && lm.delegate === "GPU" && detMs.length === 4 && detMs.slice(1).reduce((x, y) => x + y, 0) / 3 > 250) {
      swapped = true;
      lm = await onSlowGpu();
      ts = 0;
    }
  };
  const avgDet = () => { const r = detMs.slice(-8); return r.length ? r.reduce((x, y) => x + y, 0) / r.length : 30; };

  if (!("requestVideoFrameCallback" in HTMLVideoElement.prototype)) {
    video.pause();
    for (let t = start; t < stop; t += 1 / fps) {
      if (signal && signal.aborted) break;
      await seek(video, t);
      await detect(t);
    }
    return { samples, aspect };
  }

  const was = { muted: video.muted, rate: video.playbackRate, loop: video.loop };
  video.pause();
  video.muted = true; video.loop = false;
  await seek(video, start);
  // Warm up + benchmark on the paused first frame so playback speed starts right
  // (the first GPU call compiles shaders and can take seconds).
  const bench = async () => {
    ts = Math.max(ts + 1, Math.round(performance.now())); lm.detectForVideo(video, ts);
    const ms = [];
    for (let i = 0; i < 3; i++) { const a = performance.now(); ts = Math.max(ts + 1, Math.round(performance.now())); lm.detectForVideo(video, ts); ms.push(performance.now() - a); }
    return ms;
  };
  detMs = await bench();
  if (onSlowGpu && lm.delegate === "GPU" && detMs.reduce((x, y) => x + y, 0) / 3 > 250) {
    swapped = true;
    lm = await onSlowGpu();
    ts = 0;
    detMs = await bench();
  }
  let next = start;
  await new Promise((resolve) => {
    let busy = false, done = false;
    const finish = () => { if (done) return; done = true; video.pause(); resolve(); };
    const onFrame = async (_now, meta) => {
      if (done) return;
      const t = meta.mediaTime;
      if ((signal && signal.aborted) || t >= stop || video.ended) return finish();
      if (!busy && t + 1e-3 >= next) {
        busy = true;
        await detect(t);
        busy = false;
        next = Math.max(next + 1 / fps, t + 0.5 / fps);
        // Keep ~1.2x headroom: inference time per sampled frame must fit in the gap between samples.
        video.playbackRate = Math.max(0.0625, Math.min(2, 0.8 / ((avgDet() / 1000) * fps)));
      }
      video.requestVideoFrameCallback(onFrame);
    };
    video.addEventListener("ended", finish, { once: true });
    video.requestVideoFrameCallback(onFrame);
    video.playbackRate = Math.max(0.0625, Math.min(2, 0.8 / ((avgDet() / 1000) * fps)));
    video.play().catch(finish);
  });
  video.muted = was.muted; video.playbackRate = was.rate; video.loop = was.loop;
  return { samples, aspect };
}

export async function openWebcam(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 960 }, height: { ideal: 540 }, facingMode: "user" }, audio: false });
  videoEl.srcObject = stream;
  await videoEl.play();
  return () => stream.getTracks().forEach((tr) => tr.stop());
}

// Live loop on the webcam: calls onFrame(frame) roughly every animation frame.
export function runLive(videoEl, landmarker, onFrame) {
  let alive = true, last = -1;
  const tick = () => {
    if (!alive) return;
    if (videoEl.readyState >= 2 && videoEl.currentTime !== last) {
      last = videoEl.currentTime;
      const aspect = videoEl.videoWidth / videoEl.videoHeight;
      const res = landmarker.detectForVideo(videoEl, performance.now());
      const poses = res.landmarks || [];
      const pick = poses.length ? pickPerson(poses, aspect, null) : null;
      onFrame(pick ? fromMediaPipe(pick.lm, aspect, 0) : null);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => { alive = false; };
}
