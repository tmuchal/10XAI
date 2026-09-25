#!/usr/bin/env python3
"""Build the narration, captions and music mix for the Higgsfield brand-page film.

Reads tools/narration.json and writes:
  audio/narration.wav   voice only, 48 kHz mono, exactly <duration> s
  audio/music.wav       synthesized music bed, 48 kHz stereo
  audio/mix.wav         voice + ducked music, 48 kHz stereo, exactly <duration> s
  film/captions.js      window.CAPTIONS = [{ start, end, en, ko }]

TTS: Kokoro-82M (q8 ONNX) through the `kokoro-onnx` Python package, fully offline.
The model comes from the npm package `kokoro-q8-shards`, the voice styles from the
npm package `kokoro-js` (voices/*.bin). `--setup` fetches both with `npm pack`.

Usage (see tools/README.md):
  python3 -m venv /tmp/kokoro-venv && /tmp/kokoro-venv/bin/pip install kokoro-onnx soundfile numpy scipy
  /tmp/kokoro-venv/bin/python tools/build-narration.py --setup     # once
  /tmp/kokoro-venv/bin/python tools/build-narration.py             # build everything
Options: --check (timing report only), --music-db, --duck-db. Lines are cached in $KOKORO_CACHE/lines.
"""
import argparse, hashlib, json, os, subprocess, sys, tarfile, glob, re

import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.environ.get("KOKORO_CACHE", "/tmp/kokoro-cache")
MODEL = os.path.join(CACHE, "kokoro-q8.onnx")
VOICES = os.path.join(CACHE, "voices-v1.0.bin")
MODEL_SHA = "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478"
SR = 48000
GAP = 0.30          # min silence between two lines
TAIL = 0.30         # caption stays this long after speech ends
MAX_DRIFT = 1.2     # warn if a line starts later than this after its beat anchor


# ----------------------------------------------------------------------------- setup
def setup():
    os.makedirs(CACHE, exist_ok=True)
    for pkg in ("kokoro-q8-shards@1.0.0", "kokoro-js@1.2.1"):
        subprocess.run(["npm", "pack", pkg, "--silent"], cwd=CACHE, check=True)
    with tarfile.open(os.path.join(CACHE, "kokoro-q8-shards-1.0.0.tgz")) as t:
        parts = sorted((m for m in t.getmembers() if re.search(r"part\d\.bin$", m.name)), key=lambda m: m.name)
        with open(MODEL, "wb") as out:
            for m in parts:
                out.write(t.extractfile(m).read())
    sha = hashlib.sha256(open(MODEL, "rb").read()).hexdigest()
    if sha != MODEL_SHA:
        sys.exit(f"model checksum mismatch: {sha}")
    voices = {}
    with tarfile.open(os.path.join(CACHE, "kokoro-js-1.2.1.tgz")) as t:
        for m in t.getmembers():
            if m.name.startswith("package/voices/") and m.name.endswith(".bin"):
                a = np.frombuffer(t.extractfile(m).read(), dtype=np.float32)
                voices[os.path.basename(m.name)[:-4]] = a.reshape(-1, 1, 256)
    with open(VOICES, "wb") as f:
        np.savez(f, **voices)
    print(f"setup ok: {MODEL} ({sha[:12]}), {len(voices)} voices -> {VOICES}")


# ----------------------------------------------------------------------------- TTS
_kokoro = None
def tts(text, voice, speed):
    """Synthesize one line (cached). Returns float32 mono at 48 kHz, silence-trimmed."""
    key = hashlib.sha1(f"{MODEL_SHA}|{voice}|{speed}|{text}".encode()).hexdigest()[:16]
    path = os.path.join(CACHE, "lines", key + ".wav")
    if not os.path.exists(path):
        global _kokoro
        if _kokoro is None:
            if not os.path.exists(MODEL):
                sys.exit("Kokoro model missing: run with --setup first")
            from kokoro_onnx import Kokoro
            _kokoro = Kokoro(MODEL, VOICES)
        wav, sr = _kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        sf.write(path, signal.resample_poly(wav, SR, sr).astype(np.float32), SR, subtype="FLOAT")
    x, _ = sf.read(path, dtype="float32")
    # trim leading/trailing silence (-45 dB of peak), keep 40 ms / 80 ms pads
    env = np.abs(x) > np.abs(x).max() * 10 ** (-45 / 20)
    idx = np.flatnonzero(env)
    a, b = max(idx[0] - int(0.04 * SR), 0), min(idx[-1] + int(0.08 * SR), len(x))
    x = x[a:b].copy()
    f = int(0.01 * SR)
    x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    return x


def layout(cfg, lines):
    """Place lines on the timeline; returns list of (start, dur) and a list of problems."""
    B = cfg["boundaries"] + [cfg["duration"] + cfg["curtain"][0] - 0.1]
    close = cfg["curtain"][0]
    placed, problems, prev_end = [], [], 0.0
    for cue, x in zip(cfg["cues"], lines):
        dur = len(x) / SR
        start = max(cue["at"], prev_end + GAP)
        limit = next(b for b in B if b > cue["at"]) - close  # curtain starts closing
        if start - cue["at"] > MAX_DRIFT:
            problems.append(f"drift {start - cue['at']:.2f}s  @{cue['at']}: {cue['en']}")
        if start + dur + TAIL > limit:
            problems.append(f"OVER curtain by {start + dur + TAIL - limit:.2f}s  @{cue['at']}: {cue['en']}")
        placed.append((start, dur))
        prev_end = start + dur
    return placed, problems


# ----------------------------------------------------------------------------- music
def adsr_note(n, a=0.005, rel=0.05):
    e = np.ones(n, np.float32)
    na, nr = max(int(a * SR), 1), max(int(rel * SR), 1)
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr)
    return e


def marimba(freq, dur=1.4, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 2.6)
         + 0.28 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t * 9)
         + 0.07 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t * 20))
    return (vel * y * adsr_note(n, 0.003, 0.08)).astype(np.float32)


def pluck(freq, dur=1.3, vel=1.0, rng=None):
    """Karplus-Strong string (ukulele-ish), vectorised with lfilter."""
    N = max(int(SR / freq), 2)
    n = int(dur * SR)
    exc = np.zeros(n); burst = rng.uniform(-1, 1, N)
    exc[:N] = signal.lfilter([0.5, 0.5], [1], burst)       # soften the pick
    a = np.zeros(N + 2); a[0] = 1; a[N] = a[N + 1] = -0.5 * 0.996
    y = signal.lfilter([1], a, exc)
    y = signal.lfilter([0.6], [1, -0.4], y)                 # gentle low-pass
    return (vel * y * adsr_note(n, 0.002, 0.1)).astype(np.float32)


def add(buf, x, t, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1]: return
    x = x[: buf.shape[1] - i]
    buf[0, i:i + len(x)] += x * np.cos((pan + 1) * np.pi / 4)
    buf[1, i:i + len(x)] += x * np.sin((pan + 1) * np.pi / 4)


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)


def music(cfg):
    D = cfg["duration"]; n = int(D * SR)
    rng = np.random.default_rng(7)
    buf = np.zeros((2, n), np.float32)
    beat = 60 / 96; bar = 4 * beat
    # I – V – vi – IV in D major (one chord per bar), MIDI chord tones
    prog = [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62]]
    bass = [38, 33, 35, 31]
    arp = [0, 1, 2, 1, 0 + 12, 2, 1, 2]                    # 8th-note pattern (index into chord, +12 = octave)
    nbars = int(np.ceil(D / bar))
    for b in range(nbars):
        t0 = b * bar
        ch = prog[b % 4]
        intro = t0 < 8.0
        # marimba arpeggio (sparser in the intro)
        for k, p in enumerate(arp):
            if intro and k % 2: continue
            m = ch[p % 12 if p < 12 else p - 12] + (12 if p >= 12 else 0) + 12
            vel = (0.55 if k % 2 else 0.8) * (0.85 + 0.15 * rng.random())
            add(buf, marimba(hz(m), vel=vel), t0 + k * beat / 2 + rng.normal(0, 0.004), pan=0.35 * np.sin(k))
        # ukulele-ish strums on beats 2 and 4
        if not intro:
            for bt in (1, 3):
                for s, m in enumerate(ch + [ch[0] + 12]):
                    add(buf, pluck(hz(m + 12), vel=0.22, rng=rng), t0 + bt * beat + s * 0.014, pan=-0.3)
        # soft bass: root on beat 1, fifth on beat 3
        for bt, m in ((0, bass[b % 4]), (2, bass[b % 4] + 7)):
            L = int(beat * 1.8 * SR); t = np.arange(L) / SR
            y = (np.sin(2 * np.pi * hz(m + 12) * t) + 0.2 * np.sin(4 * np.pi * hz(m + 12) * t)) * np.exp(-t * 1.6)
            add(buf, (0.45 * y * adsr_note(L, 0.02, 0.1)).astype(np.float32), t0 + bt * beat)
        # warm pad (detuned sines, slow attack)
        L = int(bar * SR) + int(0.4 * SR); t = np.arange(L) / SR
        y = sum(np.sin(2 * np.pi * hz(m) * t * d) for m in ch for d in (0.998, 1.002)) / 6
        add(buf, (0.18 * y * adsr_note(L, 0.6, 0.6)).astype(np.float32), t0)
        # shaker: very soft high-passed noise on off-beats
        if not intro:
            for k in range(8):
                L = int(0.06 * SR)
                y = signal.lfilter(*signal.butter(2, 6000, "high", fs=SR), rng.normal(0, 1, L)) * np.exp(-np.arange(L) / SR * 60)
                add(buf, (0.05 * (1.3 if k % 2 else 0.7) * y).astype(np.float32), t0 + k * beat / 2 + beat / 4, pan=0.5)

    # chapter swells: rising filtered noise into the curtain + a whoosh + a bright chime when it opens
    hp = signal.butter(2, [400, 5000], "band", fs=SR)
    for B in cfg["boundaries"]:
        L = int(1.8 * SR); t = np.arange(L) / SR
        noise = signal.lfilter(*hp, rng.normal(0, 1, L))
        swell = noise * (t / t[-1]) ** 2 * 0.10
        add(buf, swell.astype(np.float32), B - 2.2, pan=-0.2)
        L = int(1.2 * SR); t = np.arange(L) / SR                     # whoosh: swept band-pass noise
        nz = rng.normal(0, 1, L); out = np.zeros(L)
        for j in range(0, L, 2400):
            fc = 300 + 3500 * np.sin(np.pi * j / L)
            seg_ = nz[j:j + 2400]
            out[j:j + len(seg_)] = signal.lfilter(*signal.butter(2, [fc * 0.7, fc * 1.3], "band", fs=SR), seg_)
        add(buf, (0.16 * out * np.sin(np.pi * t / t[-1]) ** 2).astype(np.float32), B - 0.7, pan=0.2)
        for k, m in enumerate([74, 78, 81, 86]):                      # chime arpeggio as curtain opens
            add(buf, marimba(hz(m + 12), dur=1.6, vel=0.35), B + 0.9 + k * 0.07, pan=-0.4 + k * 0.25)

    # simple stereo reverb
    Lr = int(1.6 * SR); tr = np.arange(Lr) / SR
    for c in range(2):
        ir = rng.normal(0, 1, Lr) * np.exp(-tr * 3.2); ir[0] = 0
        buf[c] += 0.12 * signal.fftconvolve(buf[c], ir / np.sqrt((ir ** 2).sum()))[:n]

    # master envelope: fade in/out, small lift around chapter changes
    t = np.arange(n) / SR
    env = np.clip(t / 2.0, 0, 1) * np.clip((D - t) / 4.0, 0, 1)
    for B in cfg["boundaries"]:
        env *= 1 + 0.35 * np.exp(-((t - B) / 1.2) ** 2)
    buf *= env
    return buf


# ----------------------------------------------------------------------------- mix
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--setup", action="store_true")
    ap.add_argument("--check", action="store_true", help="only print the timing report")
    ap.add_argument("--music-db", type=float, default=-18.0, help="music level vs speech (dB, before ducking)")
    ap.add_argument("--duck-db", type=float, default=-5.0)
    args = ap.parse_args()
    if args.setup:
        return setup()

    cfg = json.load(open(os.path.join(HERE, "narration.json"), encoding="utf-8"))
    D = cfg["duration"]; n = int(round(D * SR))
    lines = []
    for i, c in enumerate(cfg["cues"]):
        sp = c.get("speed", cfg["speed"])
        assert sp <= 1.1, "speed-up capped at 1.1x"
        lines.append(tts(c.get("say", c["en"]), c.get("voice", cfg["voice"]), sp))
        print(f"  [{i + 1:2d}/{len(cfg['cues'])}] {len(lines[-1]) / SR:5.2f}s  {c['en']}", flush=True)
    placed, problems = layout(cfg, lines)
    speech = sum(d for _, d in placed)
    print(f"\n{len(placed)} lines, {speech:.1f}s of speech ({100 * speech / D:.0f}% of {D}s)")
    for p in problems: print("  !", p)
    if args.check: return
    if any(p.startswith("OVER") for p in problems):
        sys.exit("some lines run into a curtain: shorten them in tools/narration.json")

    # narration track (voice normalized so active speech RMS = -19 dBFS)
    voice = np.zeros(n, np.float32)
    for (s, _), x in zip(placed, lines):
        i = int(round(s * SR)); voice[i:i + len(x)] += x[: n - i]
    active = np.concatenate(lines)
    g = 10 ** ((-19 - rms_db(active)) / 20)
    voice *= g
    voice = np.clip(voice, -0.98, 0.98)

    mus = music(cfg)
    # music level relative to speech, then ducking under the voice
    mus *= 10 ** ((-19 + args.music_db - rms_db(mus[:, int(10 * SR):int(180 * SR)].mean(0))) / 20)
    fr = int(0.02 * SR)
    lvl = np.sqrt(np.convolve(voice ** 2, np.ones(fr) / fr, "same"))
    gate = (lvl > 10 ** (-45 / 20)).astype(np.float32)
    # attack 80 ms / release 450 ms smoothing
    sm = np.zeros_like(gate); a_, r_ = np.exp(-1 / (0.08 * SR)), np.exp(-1 / (0.45 * SR))
    sm = signal.lfilter([1 - r_], [1, -r_], gate)          # release-shaped
    sm = np.maximum(sm, signal.lfilter([1 - a_], [1, -a_], gate))
    duck = 1 - (1 - 10 ** (args.duck_db / 20)) * np.clip(sm, 0, 1)
    mixed = mus * duck + voice[None, :]
    peak = np.abs(mixed).max()
    if peak > 0.89: mixed *= 0.89 / peak
    mus_out = mus / max(np.abs(mus).max() / 0.7, 1)

    out = os.path.join(ROOT, "audio"); os.makedirs(out, exist_ok=True)
    sf.write(os.path.join(out, "narration.wav"), voice[:n], SR, subtype="PCM_16")
    sf.write(os.path.join(out, "music.wav"), mus_out[:, :n].T, SR, subtype="PCM_16")
    sf.write(os.path.join(out, "mix.wav"), mixed[:, :n].T, SR, subtype="PCM_16")

    caps = []
    for k, ((s, d), c) in enumerate(zip(placed, cfg["cues"])):
        end = s + d + TAIL
        if k + 1 < len(placed): end = min(end, placed[k + 1][0] - 0.05)
        caps.append({"start": round(s - 0.05, 2), "end": round(end, 2), "en": c["en"], "ko": c["ko"]})
    js = ("// Generated by tools/build-narration.py from tools/narration.json. Do not edit by hand.\n"
          "// Spoken English (Kokoro-82M, voice %s) + Korean subtitle. Times in seconds; audio: audio/mix.wav\n"
          "window.CAPTIONS = [\n%s\n];\n") % (cfg["voice"], ",\n".join("  " + json.dumps(c, ensure_ascii=False) for c in caps))
    open(os.path.join(ROOT, "film", "captions.js"), "w", encoding="utf-8").write(js)
    print(f"wrote audio/narration.wav, audio/music.wav, audio/mix.wav ({n / SR:.3f}s), film/captions.js ({len(caps)} cues)")


if __name__ == "__main__":
    main()
