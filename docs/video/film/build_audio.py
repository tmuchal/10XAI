"""Build the Harness Theater film soundtrack and timeline.

Reads film/script.json and produces:
  film/timeline.js   window.TL = { total, scenes: [{ id, chapter, source, start, dur, cues: [...] }] }
  film/build/mix.wav 48 kHz stereo: narration + ukulele bed (ducked under voice) + sound effects

Narration is synthesized offline with Kokoro (kokoro-onnx). Point KOKORO_DIR at a folder holding
kokoro-v1.0.int8.onnx and voices-v1.0.bin (from github.com/thewh1teagle/kokoro-onnx releases).
Music and sound effects are synthesized here (Karplus-Strong plucks, sines, noise); no samples.

Usage:  KOKORO_DIR=/tmp/kokoro python3 docs/video/film/build_audio.py
"""
import json
import math
import os
import random

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
SR = 48000
rnd = random.Random(7)


def tts_all(script):
    from kokoro_onnx import Kokoro
    kdir = os.environ.get("KOKORO_DIR", "/tmp/kokoro")
    k = Kokoro(os.path.join(kdir, "kokoro-v1.0.int8.onnx"), os.path.join(kdir, "voices-v1.0.bin"))
    os.makedirs(os.path.join(BUILD, "vo"), exist_ok=True)
    out = []
    for si, sc in enumerate(script["scenes"]):
        for ci, cue in enumerate(sc["cues"]):
            v = script["voices"][cue["spk"]]
            text = cue["en"].replace("*", "")
            path = os.path.join(BUILD, "vo", f"{si:02d}_{ci:02d}_{cue['spk']}.wav")
            key = f"{v['voice']}|{v.get('speed', 1)}|{v.get('pitch', 1)}|{text}"
            meta = path + ".txt"
            if not (os.path.exists(path) and os.path.exists(meta) and open(meta).read() == key):
                s, sr = k.create(text, voice=v["voice"], speed=v.get("speed", 1.0), lang="en-us")
                s = np.asarray(s, dtype=np.float32)
                s = resample(s, sr, SR / v.get("pitch", 1.0))   # pitch > 1 raises the voice (and speeds it up)
                s = trim(s)
                sf.write(path, s, SR)
                open(meta, "w").write(key)
            out.append(sf.read(path, dtype="float32")[0])
    return out


def resample(x, sr_in, sr_out):
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def trim(x, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a, b = max(0, idx[0] - int(0.03 * SR)), min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]


# ------------------------------------------------------------------ synthesis
def pluck(freq, dur=1.4, amp=0.5, bright=0.5):
    N = max(2, int(SR / freq))
    buf = (np.random.default_rng(int(freq * 13)).uniform(-1, 1, N) * amp).astype(np.float32)
    n = int(dur * SR)
    out = np.zeros(n, dtype=np.float32)
    decay = 0.996
    b = buf.copy()
    for i in range(n):
        j = i % N
        v = b[j]
        out[i] = v
        b[j] = decay * (bright * v + (1 - bright) * 0.5 * (v + b[(j + 1) % N]))
    return out


_pluck_cache = {}


def cached_pluck(freq, dur=1.3):
    key = (round(freq, 2), dur)
    if key not in _pluck_cache:
        _pluck_cache[key] = pluck(freq, dur, 0.5, 0.0)
    return _pluck_cache[key]


def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def sine(freq, dur, amp=1.0):
    t = np.arange(int(dur * SR)) / SR
    f = np.interp(t, [0, dur], freq) if isinstance(freq, (list, tuple)) else np.full_like(t, freq)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * amp).astype(np.float32)


def noise(dur, amp=1.0):
    return (np.random.default_rng(3).uniform(-1, 1, int(dur * SR)) * amp).astype(np.float32)


def sfx(name):
    if name == "pop":
        x = sine([520, 1180], 0.09); return x * env(len(x), 0.002, 0.03) * 0.55
    if name == "whoosh":
        x = noise(0.45); x = np.convolve(x, np.ones(12) / 12, mode="same")
        t = np.linspace(0, 1, len(x)); return x * np.sin(np.pi * t) ** 2 * 0.5
    if name == "stamp":
        x = sine([140, 60], 0.3) * env(int(0.3 * SR), 0.002, 0.08)
        c = noise(0.04) * env(int(0.04 * SR), 0.001, 0.01)
        x[:len(c)] += c; return x * 0.9
    if name == "ding":
        n = int(1.2 * SR); x = np.zeros(n, dtype=np.float32)
        for f, a in ((1318.5, 1), (2637, .4), (3955, .15)):
            x += sine(f, 1.2, a) * env(n, 0.002, 0.35)
        return x * 0.28
    if name == "tada":
        n = int(1.4 * SR); x = np.zeros(n, dtype=np.float32)
        for i, f in enumerate((523.3, 659.3, 784.0, 1046.5)):
            p = cached_pluck(f, 1.2); o = int(i * 0.07 * SR); x[o:o + len(p)] += p[:n - o] * 0.5
        return x * 0.8
    if name == "boing":
        t = np.arange(int(0.45 * SR)) / SR
        f = 330 - 160 * t / 0.45 + 25 * np.sin(2 * np.pi * 18 * t)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32)
        return x * env(len(x), 0.004, 0.18) * 0.45
    if name == "pump":
        x = sine([700, 1250], 0.14) * env(int(0.14 * SR), 0.01, 0.06) * 0.28
        x += noise(0.14, 0.08) * env(int(0.14 * SR), 0.005, 0.04); return x
    if name == "alarm":
        return np.concatenate([sine(f, 0.13, 0.22) for f in (880, 660, 880, 660)])
    if name == "tick":
        x = sine(2200, 0.02) * env(int(0.02 * SR), 0.0005, 0.004); return x * 0.5
    if name == "coin":
        a = sine(988, 0.07, 0.25); b = sine(1319, 0.25, 0.25) * env(int(0.25 * SR), 0.002, 0.1)
        return np.concatenate([a, b])
    return np.zeros(1, dtype=np.float32)


def music(total):
    """Island-strum ukulele loop C–G–Am–F at 100 bpm with a soft bass."""
    bpm, beat = 100, 60 / 100
    chords = [(392.0, 261.6, 329.6, 523.3), (392.0, 293.7, 392.0, 493.9), (440.0, 261.6, 329.6, 440.0), (440.0, 261.6, 349.2, 440.0)]
    bass = [130.8, 98.0, 110.0, 87.3]
    pattern = [(0.0, "D", 1.0), (1.0, "D", .8), (1.5, "U", .55), (2.5, "U", .55), (3.0, "D", .8), (3.5, "U", .5)]
    n = int((total + 1) * SR)
    out = np.zeros(n, dtype=np.float32)
    bar = 0
    while bar * 4 * beat < total + 1:
        ci = bar % 4
        t0 = bar * 4 * beat
        for off, d, amp in pattern:
            notes = chords[ci] if d == "D" else chords[ci][::-1]
            for j, f in enumerate(notes):
                p = cached_pluck(f)
                s = int((t0 + off * beat + j * 0.012) * SR)
                if s >= n:
                    continue
                e = min(n, s + len(p)); out[s:e] += p[:e - s] * amp * 0.16
        for b_off in (0, 2):
            s = int((t0 + b_off * beat) * SR)
            if s < n:
                x = sine(bass[ci], 0.5, 0.22) * env(int(0.5 * SR), 0.01, 0.25)
                e = min(n, s + len(x)); out[s:e] += x[:e - s]
        bar += 1
    fade = int(1.5 * SR)
    out[:fade] *= np.linspace(0, 1, fade); out[-fade:] *= np.linspace(1, 0, fade)
    return out


# ------------------------------------------------------------------ build
def main():
    script = json.load(open(os.path.join(HERE, "script.json")))
    tm = script["timing"]
    vos = tts_all(script)
    scenes, t, vi, events = [], 0.0, 0, []
    for sc in script["scenes"]:
        start = t
        t += tm["lead"]
        cues = []
        for cue in sc["cues"]:
            v = vos[vi]; vi += 1
            dur = len(v) / SR
            cues.append({"spk": cue["spk"], "en": cue["en"], "ko": cue["ko"], "start": round(t - start, 3), "dur": round(dur, 3)})
            events.append(("vo", t, v))
            for name, off in cue.get("sfx", []):
                events.append(("sfx", t + off, sfx(name)))
            t += dur + tm["gap"] + cue.get("hold", 0)
        t += tm["tail"]
        scenes.append({"id": sc["id"], "chapter": sc["chapter"], "source": sc["source"], "start": round(start, 3), "dur": round(t - start, 3), "cues": cues})
    total = t
    n = int((total + 0.5) * SR)
    voice = np.zeros(n, dtype=np.float32)
    fx = np.zeros(n, dtype=np.float32)
    for kind, at, x in events:
        s = int(at * SR); e = min(n, s + len(x))
        (voice if kind == "vo" else fx)[s:e] += x[:e - s]
    # duck the music under the voice
    m = music(total)[:n]
    if len(m) < n:
        m = np.pad(m, (0, n - len(m)))
    win = int(0.05 * SR)
    lvl = np.convolve(np.abs(voice), np.ones(win) / win, mode="same")
    duck = np.where(lvl > 0.01, 0.35, 1.0).astype(np.float32)
    duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
    mix = voice * 1.0 + fx * 0.8 + m * duck * 0.9
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    os.makedirs(BUILD, exist_ok=True)
    sf.write(os.path.join(BUILD, "mix.wav"), np.stack([mix, mix], axis=1), SR, subtype="PCM_16")
    with open(os.path.join(HERE, "timeline.js"), "w") as f:
        f.write("/* Generated by build_audio.py from script.json. Do not edit by hand. */\n")
        f.write("window.TL = " + json.dumps({"total": round(total, 3), "scenes": scenes}, ensure_ascii=False, indent=1) + ";\n")
    print(f"total {total:.2f}s · {len(vos)} lines · scenes: " + ", ".join(f"{s['id']} {s['dur']:.1f}s" for s in scenes))


if __name__ == "__main__":
    main()
