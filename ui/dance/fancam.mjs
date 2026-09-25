// Dance Lab — virtual fancam (직캠): a smoothed crop that follows one member.
// Coordinates are image-height units (x spans 0..videoAspect), like analyze.mjs.
import { J, bodyScale } from "./analyze.mjs";

function smooth(xs, times, win) {
  return xs.map((_, i) => {
    let s = 0, n = 0;
    for (let k = i; k >= 0 && times[i] - times[k] <= win / 2; k--) { s += xs[k]; n++; }
    for (let k = i + 1; k < xs.length && times[k] - times[i] <= win / 2; k++) { s += xs[k]; n++; }
    return s / n;
  });
}

/**
 * Crop path for one member: [{ t, cx, cy, h }] with crop width = h * outAspect.
 * Framing is full-body with headroom, like a fan filming one idol with a long lens.
 * Position is smoothed over ~0.6 s and zoom over ~1.5 s (a steady operator),
 * gaps are interpolated, and the crop is kept inside the video frame.
 */
export function cropPath(frames, { outAspect = 9 / 16, videoAspect = 16 / 9, tightness = 1 } = {}) {
  const raw = frames.map((f) => {
    if (!f.p) return null;
    const ys = [], xs = [];
    for (let j = 0; j < 13; j++) { xs.push(f.p[2 * j]); ys.push(f.p[2 * j + 1]); }
    const s = bodyScale(f);
    const top = Math.min(...ys) - 0.55 * s, bottom = Math.max(...ys) + 0.2 * s;
    const left = Math.min(...xs) - 0.25 * s, right = Math.max(...xs) + 0.25 * s;
    const hBody = (bottom - top) * 1.12 / tightness;
    const h = Math.max(hBody, ((right - left) * 1.1) / outAspect / tightness, 0.12);
    return { cx: (left + right) / 2, cy: (top + bottom) / 2, h };
  });
  const known = raw.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);
  if (!known.length) return [];
  // Interpolate gaps; hold at the ends.
  const filled = raw.map((r, i) => {
    if (r) return r;
    const a = known.filter((k) => k < i).pop(), b = known.find((k) => k > i);
    if (a == null) return raw[b];
    if (b == null) return raw[a];
    const u = (frames[i].t - frames[a].t) / (frames[b].t - frames[a].t);
    return { cx: raw[a].cx + (raw[b].cx - raw[a].cx) * u, cy: raw[a].cy + (raw[b].cy - raw[a].cy) * u, h: raw[a].h + (raw[b].h - raw[a].h) * u };
  });
  const times = frames.map((f) => f.t);
  // Zoom follows the *largest* recent body height so jumps/arms-up don't make it pump.
  const hMax = filled.map((r, i) => { let m = r.h; for (let k = i; k >= 0 && times[i] - times[k] <= 0.8; k--) m = Math.max(m, filled[k].h); for (let k = i; k < filled.length && times[k] - times[i] <= 0.8; k++) m = Math.max(m, filled[k].h); return m; });
  const H = smooth(hMax, times, 1.5), X = smooth(filled.map((r) => r.cx), times, 0.6), Y = smooth(filled.map((r) => r.cy), times, 0.9);
  return frames.map((f, i) => {
    let h = Math.min(H[i], 1, videoAspect / outAspect);
    const w = h * outAspect;
    const cx = Math.min(Math.max(X[i], w / 2), videoAspect - w / 2);
    const cy = Math.min(Math.max(Y[i], h / 2), 1 - h / 2);
    return { t: f.t, cx, cy, h };
  });
}

export function cropAt(path, t) {
  if (!path.length) return null;
  let lo = 0, hi = path.length - 1;
  if (t <= path[0].t) return path[0];
  if (t >= path[hi].t) return path[hi];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path[m].t < t) lo = m; else hi = m; }
  const a = path[lo], b = path[hi], u = (t - a.t) / Math.max(1e-6, b.t - a.t);
  return { t, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, h: a.h + (b.h - a.h) * u };
}

// Map a point in video units into a crop drawn at rect {x,y,w,h}.
export function toCrop(crop, outAspect, rect) {
  const w = crop.h * outAspect, x0 = crop.cx - w / 2, y0 = crop.cy - crop.h / 2;
  return (x, y) => [rect.x + ((x - x0) / w) * rect.w, rect.y + ((y - y0) / crop.h) * rect.h];
}

// Draw the cropped video into rect (browser).
export function drawCrop(ctx, video, crop, outAspect, rect) {
  const px = video.videoHeight;
  const w = crop.h * outAspect;
  ctx.drawImage(video, (crop.cx - w / 2) * px, (crop.cy - crop.h / 2) * px, w * px, crop.h * px, rect.x, rect.y, rect.w, rect.h);
}

/**
 * Record a fancam of one member as a video file (browser, real time).
 * draw(ctx, t, W, H) paints one output frame; returns a Blob.
 */
export async function recordFancam(video, { draw, outAspect, start, end, onProgress, signal }) {
  const W = outAspect < 1 ? 720 : 1280, H = Math.round(W / outAspect);
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const tracks = [...canvas.captureStream(30).getVideoTracks()];
  const cap = video.captureStream ? video.captureStream() : video.mozCaptureStream ? video.mozCaptureStream() : null;
  if (cap) tracks.push(...cap.getAudioTracks());
  const types = ["video/mp4;codecs=avc1,mp4a", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  const mimeType = types.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
  const rec = new MediaRecorder(new MediaStream(tracks), { mimeType, videoBitsPerSecond: 6e6 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const was = { muted: video.muted, rate: video.playbackRate, loop: video.loop };
  video.pause(); video.muted = false; video.playbackRate = 1; video.loop = false;
  await new Promise((r) => { video.addEventListener("seeked", r, { once: true }); video.currentTime = start; });
  draw(ctx, start, W, H);
  rec.start(250);
  await new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; video.pause(); resolve(); } };
    const tick = (_n, meta) => {
      const t = meta ? meta.mediaTime : video.currentTime;
      if ((signal && signal.aborted) || t >= end || video.ended) return finish();
      draw(ctx, t, W, H);
      onProgress && onProgress((t - start) / (end - start));
      video.requestVideoFrameCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(() => tick());
    };
    video.addEventListener("ended", finish, { once: true });
    video.play().then(() => (video.requestVideoFrameCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(() => tick()))).catch(finish);
  });
  const stopped = new Promise((r) => (rec.onstop = r));
  rec.stop();
  await stopped;
  video.muted = was.muted; video.playbackRate = was.rate; video.loop = was.loop;
  return new Blob(chunks, { type: (mimeType || "video/webm").split(";")[0] });
}
