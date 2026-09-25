// Dance Lab — MediaPipe Pose Landmarker wrapper (browser only).
// Everything runs locally in the browser; frames never leave the machine.
import { fromMediaPipe, MP_INDEX } from "./analyze.mjs";

const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODELS = {
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  heavy: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
};

let visionMod = null, fileset = null;
export async function createLandmarker({ model = "full", numPoses = 4, delegate = "GPU" } = {}) {
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
 * Sample the video at `fps` and return pose frames.
 *   onProgress(fraction, frame) per sample; signal.aborted stops early.
 *   onSlowGpu() → Promise<landmarker>: called once if GPU inference is slower
 *   than 250 ms/frame (software GL); should return a CPU landmarker.
 * Uses playback + requestVideoFrameCallback when available (no per-frame
 * seeking; playback speed adapts to inference speed), else seeks frame by frame.
 */
export async function extractPoses(video, landmarker, { fps = 15, start = 0, end = null, onProgress, signal, onSlowGpu } = {}) {
  const stop = Math.min(end ?? video.duration, video.duration);
  const aspect = video.videoWidth / video.videoHeight;
  const frames = [];
  let prev = null, ts = 0, lm = landmarker, detMs = [], swapped = false, lastSeen = -Infinity;

  const detect = async (t) => {
    const a = performance.now();
    ts = Math.max(ts + 1, Math.round(performance.now()));
    const res = lm.detectForVideo(video, ts);
    detMs.push(performance.now() - a);
    const poses = res.landmarks || [];
    let pick = poses.length ? pickPerson(poses, aspect, prev) : null;
    // Our dancer briefly lost (occluded, spinning) → skip the frame rather than
    // jump to another member; re-acquire whoever is central after 1 s.
    if (pick && prev && pick.d > 0.3 && t - lastSeen < 1.0) pick = null;
    if (pick) lastSeen = t;
    const f = pick ? { ...fromMediaPipe(pick.lm, aspect, t), n: poses.length } : { t: Math.round(t * 1000) / 1000, p: null, v: null, n: 0 };
    if (pick) prev = pick.c;
    frames.push(f);
    onProgress && onProgress(Math.min(1, (t - start) / (stop - start)), f);
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
    return { frames, aspect };
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
  return { frames, aspect };
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
