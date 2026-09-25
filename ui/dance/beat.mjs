// Dance Lab — audio tempo + beat tracking.
// Pure JS (browser + node): spectral-flux onset envelope → tempo by
// autocorrelation → beat times by dynamic programming (Ellis 2007).

const HOP = 256;
const WIN = 1024;

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

// Mono PCM → onset strength envelope (one value per hop).
export function onsetEnvelope(samples, sampleRate) {
  // Work at ~11 kHz: plenty for rhythm, 4x cheaper.
  const factor = Math.max(1, Math.floor(sampleRate / 11025));
  const n = Math.floor(samples.length / factor);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k < factor; k++) s += samples[i * factor + k];
    x[i] = s / factor;
  }
  const sr = sampleRate / factor;
  const frames = Math.max(0, Math.floor((n - WIN) / HOP));
  const bins = WIN / 2;
  const hann = new Float32Array(WIN);
  for (let i = 0; i < WIN; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / WIN);
  let prev = new Float32Array(bins);
  const env = new Float32Array(frames);
  const re = new Float64Array(WIN), im = new Float64Array(WIN);
  for (let f = 0; f < frames; f++) {
    const off = f * HOP;
    for (let i = 0; i < WIN; i++) { re[i] = x[off + i] * hann[i]; im[i] = 0; }
    fft(re, im);
    const cur = new Float32Array(bins);
    let flux = 0;
    for (let b = 1; b < bins; b++) {
      cur[b] = Math.log1p(100 * Math.hypot(re[b], im[b]));
      const d = cur[b] - prev[b];
      if (d > 0) flux += d;
    }
    env[f] = f === 0 ? 0 : flux;
    prev = cur;
  }
  // Remove slow loudness trend (~0.5 s moving mean) and half-wave rectify.
  const fps = sr / HOP;
  const w = Math.max(1, Math.round(fps * 0.25));
  const out = new Float32Array(frames);
  let acc = 0;
  const pre = new Float64Array(frames + 1);
  for (let i = 0; i < frames; i++) { acc += env[i]; pre[i + 1] = acc; }
  let peak = 0;
  for (let i = 0; i < frames; i++) {
    const a = Math.max(0, i - w), b = Math.min(frames, i + w + 1);
    const v = env[i] - (pre[b] - pre[a]) / (b - a);
    out[i] = v > 0 ? v : 0;
    if (out[i] > peak) peak = out[i];
  }
  if (peak > 0) for (let i = 0; i < frames; i++) out[i] /= peak;
  // Flux peaks once an onset is well inside the Hann window; this is the
  // measured lag between an onset and its flux peak (≈ 0.7 × window).
  return { env: out, fps, offset: (0.7 * WIN) / sr };
}

// Tempo from an evenly sampled accent envelope. Returns { bpm, period (samples), strength 0..1 }.
export function estimateTempo(env, fps, { minBpm = 70, maxBpm = 180, preferBpm = 115 } = {}) {
  const n = env.length;
  if (n < fps * 3) return { bpm: null, period: null, strength: 0 };
  let mean = 0;
  for (let i = 0; i < n; i++) mean += env[i];
  mean /= n;
  const x = new Float32Array(n);
  let energy = 0;
  for (let i = 0; i < n; i++) { x[i] = env[i] - mean; energy += x[i] * x[i]; }
  if (energy <= 0) return { bpm: null, period: null, strength: 0 };
  const minLag = Math.max(2, Math.floor(fps * 60 / maxBpm));
  const maxLag = Math.min(n - 1, Math.ceil(fps * 60 / minBpm));
  const ac = new Float32Array(maxLag + 2);
  for (let lag = 1; lag <= maxLag + 1 && lag < n; lag++) {
    let s = 0;
    for (let i = 0; i + lag < n; i++) s += x[i] * x[i + lag];
    ac[lag] = s / energy;
  }
  let best = -1, bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = 60 * fps / lag;
    // Log-Gaussian tempo prior keeps us from locking onto half/double time.
    const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / preferBpm) / 0.9, 2));
    // Reinforce with the double-period peak (true beats repeat every 2 periods too).
    const dbl = 2 * lag < ac.length ? ac[2 * lag] : 0;
    const score = (ac[lag] + 0.5 * Math.max(0, dbl)) * prior;
    if (score > bestScore) { bestScore = score; best = lag; }
  }
  if (best < 0) return { bpm: null, period: null, strength: 0 };
  // Parabolic refinement of the peak.
  let period = best;
  const y0 = ac[best - 1], y1 = ac[best], y2 = ac[best + 1];
  const den = y0 - 2 * y1 + y2;
  if (den < 0) period = best + 0.5 * (y0 - y2) / den;
  return { bpm: 60 * fps / period, period, strength: Math.max(0, Math.min(1, ac[best])) };
}

// Beat times (seconds) given an envelope and a period (in envelope samples).
export function trackBeats(env, fps, period, tightness = 100, offset = 0) {
  const n = env.length;
  if (!period || n === 0) return [];
  const score = new Float64Array(n);
  const back = new Int32Array(n).fill(-1);
  const lo = Math.round(period / 2), hi = Math.round(period * 2);
  for (let i = 0; i < n; i++) {
    let best = 0, arg = -1;
    for (let p = i - hi; p <= i - lo; p++) {
      if (p < 0) continue;
      const r = Math.log((i - p) / period);
      const s = score[p] - tightness * r * r;
      if (arg < 0 || s > best) { best = s; arg = p; }
    }
    score[i] = env[i] + (arg >= 0 ? Math.max(0, best) : 0);
    back[i] = arg >= 0 && best > 0 ? arg : -1;
  }
  // Start the backtrace from the best-scoring frame in the final period.
  let i = n - 1, bestEnd = -Infinity;
  for (let k = Math.max(0, n - Math.round(period)); k < n; k++) if (score[k] > bestEnd) { bestEnd = score[k]; i = k; }
  const beats = [];
  while (i >= 0) { beats.push(i / fps + offset); i = back[i]; }
  return beats.reverse();
}

export function detectBeats(samples, sampleRate) {
  const { env, fps, offset } = onsetEnvelope(samples, sampleRate);
  const tempo = estimateTempo(env, fps);
  if (!tempo.bpm) return { bpm: null, beats: [], confidence: 0 };
  const beats = trackBeats(env, fps, tempo.period, 100, offset);
  return { bpm: Math.round(tempo.bpm * 10) / 10, beats, confidence: Math.round(tempo.strength * 100) / 100 };
}

async function decodeMono(src) {
  const buf = src instanceof Blob ? await src.arrayBuffer() : await (await fetch(src)).arrayBuffer();
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const mono = new Float32Array(audio.length);
    for (let c = 0; c < audio.numberOfChannels; c++) { const ch = audio.getChannelData(c); for (let i = 0; i < audio.length; i++) mono[i] += ch[i] / audio.numberOfChannels; }
    return { mono, sampleRate: audio.sampleRate };
  } finally { ctx.close && ctx.close(); }
}

// Onset envelope resampled to `fps` (for syncing two recordings of the same song).
export function resampleEnvelope(env, fps, target = 20) {
  const n = Math.floor((env.length / fps) * target);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i / target) * fps), b = Math.max(a + 1, Math.floor(((i + 1) / target) * fps));
    let m = 0; for (let k = a; k < b && k < env.length; k++) m = Math.max(m, env[k]);
    out[i] = m;
  }
  return out;
}
export async function onsetFromMedia(src, target = 20) {
  const { mono, sampleRate } = await decodeMono(src);
  const { env, fps, offset } = onsetEnvelope(mono, sampleRate);
  return { env: resampleEnvelope(env, fps, target), fps: target, t0: offset };
}

// Browser helper: decode a video/audio Blob or URL and detect beats.
export async function detectBeatsFromMedia(src) {
  const buf = src instanceof Blob ? await src.arrayBuffer() : await (await fetch(src)).arrayBuffer();
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const len = audio.length;
    const mono = new Float32Array(len);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const ch = audio.getChannelData(c);
      for (let i = 0; i < len; i++) mono[i] += ch[i] / audio.numberOfChannels;
    }
    return detectBeats(mono, audio.sampleRate);
  } finally { ctx.close && ctx.close(); }
}
