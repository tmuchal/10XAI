#!/usr/bin/env python3
"""Build the sound-effects layer and the final mix for the Higgsfield brand-page film.

Reads  tools/sfx-cues.json   [{t, type, gain?, pan?, ...}]  (times in film seconds)
       audio/mix.wav         narration + ducked music (from tools/build-narration.py)
       audio/narration.wav   voice only (drives the SFX ducking)
       film/captions.js      spoken lines (to protect key spoken numbers)
Writes audio/sfx.wav         the SFX bus alone, at the level it has in the final mix
       audio/final.wav       mix.wav + SFX bus, loudness-normalized, 48 kHz stereo, exactly 192.0 s

Every sound is synthesized here (numpy/scipy, fixed seeds), so the build is offline and reproducible.
Usage:  /tmp/tts/venv/bin/python tools/build-sfx.py [--sfx-lufs -21] [--target-lufs -16] [--tp -1] [--duck-db -6]
        [--report]  (only print the cue report, write nothing)

Cue fields
  t      start time (s). Impacts (pop, stamp, ding, ...) put their transient at t; sweeps start at t.
  type   see SYNTH below.  gain  dB (default 0).  pan  -1 (left) .. 1 (right).
  dur, pitch (semitones), n, step, rate, dir, kind, ...  per-type options (see each synth).
  note   free text: what happens on screen at that moment.
"""
import argparse, json, os, re, sys

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import maximum_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
DURATION = 192.0
D5, A5, D6 = 587.33, 880.0, 1174.66     # D major, like the music bed (96 bpm, I-V-vi-IV)
MAJ = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16]  # scale steps from A (A B C# D E F# G# A ...) - used by pop_run


# ============================================================================ helpers
def T(d): return np.arange(int(round(d * SR))) / SR
def st(p): return 2.0 ** (p / 12.0)
def sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output="sos")
def filt(x, kind, f, order=2): return signal.sosfilt(sos(kind, f, order), x)
def expdec(t, tau): return np.exp(-t / tau)
def att(t, a): return np.clip(t / max(a, 1e-4), 0, 1)
def fade_out(x, d=0.01):
    n = min(len(x), int(d * SR))
    if n > 1: x[-n:] *= np.linspace(1, 0, n)
    return x
def osc(freq_curve):
    """sine with a time-varying frequency (array, Hz)"""
    return np.sin(2 * np.pi * np.cumsum(freq_curve) / SR)
def saw(freq_curve, harmonics=24):
    ph = 2 * np.pi * np.cumsum(freq_curve) / SR
    fmax = np.max(freq_curve)
    y = np.zeros_like(ph)
    for k in range(1, harmonics + 1):
        if k * fmax > SR * 0.45: break
        y += np.sin(k * ph) / k
    return y
def place(buf, x, i0):
    if i0 >= len(buf): return
    if i0 < 0: x = x[-i0:]; i0 = 0
    x = x[: len(buf) - i0]
    buf[i0:i0 + len(x)] += x

BANK = np.geomspace(120, 12000, 22)
def swept_noise(n, fc, width_oct, rng):
    """Noise through a bank of fixed band-passes, cross-faded along the centre curve fc (Hz per sample).
    Click-free 'moving filter' without per-sample filtering."""
    nz = rng.standard_normal(n)
    lf = np.log2(np.maximum(fc, 20))
    out = np.zeros(n)
    for f in BANK:
        w = np.exp(-0.5 * ((np.log2(f) - lf) / width_oct) ** 2)
        if w.max() < 1e-3: continue
        out += w * filt(nz, "band", [f / 1.25, min(f * 1.25, SR * 0.49)])
    return out
def grains(n, rate, rng, dur_ms=(1, 3), band=(2500, 9000), density=None):
    """sparse papery micro-clicks; density: optional per-sample multiplier (0..1)"""
    y = np.zeros(n)
    k = rng.poisson(rate * n / SR)
    pos = rng.integers(0, n, k)
    if density is not None:
        keep = rng.random(k) < density[pos]; pos = pos[keep]
    for p in pos:
        L = int(rng.uniform(*dur_ms) * SR / 1000)
        g = rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 3)) * rng.uniform(0.2, 1.0)
        place(y, g, p)
    return filt(y, "band", list(band))
def norm(x, peak=0.5):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


# ============================================================================ synths
# each returns mono (n,) or stereo (2, n) float arrays, roughly peak-normalized; levels are set in LEVEL.
def s_whoosh(c, rng):
    d = c.get("dur", 0.5); t = T(d); u = t / d
    fc = 350 * (1 + 7 * np.sin(np.pi * u ** 0.8) ** 2)                 # rises then falls
    y = swept_noise(len(t), fc, 0.55, rng)
    env = np.sin(np.pi * np.clip(u, 0, 1) ** 0.75) ** 2
    return norm(y * env)

def s_curtain(c, rng):
    """long fabric sweep: slow low-mid noise sweep + stereo rustle"""
    d = c.get("dur", 0.95); t = T(d); u = t / d
    fc = (260 + 900 * u) if c.get("open") else (1100 - 780 * u)
    body = swept_noise(len(t), fc, 0.9, rng)
    env = np.sin(np.pi * u) ** 1.2
    out = []
    for ch in range(2):
        am = np.abs(filt(rng.standard_normal(len(t)), "low", 45)) ** 1.5         # fabric flutter
        rust = filt(rng.standard_normal(len(t)), "band", [2200, 9000]) * am / (am.max() + 1e-9)
        rust += 0.6 * grains(len(t), 260, rng, (1, 2.5), (2500, 10000))
        out.append(body * env + 0.35 * norm(rust) * env)
    return norm(np.array(out))

def s_swipe(c, rng):
    """paper swipe: bright band noise, fast attack, crinkle grains"""
    d = c.get("dur", 0.3); t = T(d); u = t / d
    fc = 1800 + 4200 * u
    y = swept_noise(len(t), fc, 0.6, rng) * (att(t, 0.02) * (1 - u) ** 1.3)
    y += 0.5 * norm(grains(len(t), 900, rng, (0.6, 1.8), (3000, 11000), density=(1 - u))) * 0.3
    return norm(y)

def s_pop(c, rng):
    """soft pop: sine blip with a pitch drop + tiny mouth click"""
    f0 = A5 * st(c.get("pitch", 0)); t = T(0.14)
    f = f0 * (0.72 + 0.95 * np.exp(-t / 0.022))
    y = osc(f) * att(t, 0.0015) * expdec(t, 0.035) + 0.25 * osc(2 * f) * expdec(t, 0.015)
    click = filt(rng.standard_normal(len(t)), "low", 3000) * expdec(t, 0.0015) * 0.3
    return norm(fade_out(y + click))

def s_pop_run(c, rng):
    n, step, base = c.get("n", 3), c.get("step", 0.12), c.get("base", 0)
    y = np.zeros(int((n * step + 0.2) * SR))
    for k in range(n):
        p = s_pop({"pitch": MAJ[(base + k) % len(MAJ)] if base + k < len(MAJ) else MAJ[-1]}, rng) * (0.85 + 0.15 * rng.random())
        place(y, p, int(k * step * SR))
    return norm(y)

def s_stamp(c, rng):
    """stamp thud: low sine drop + noise transient + wooden knock + paper slap"""
    big, soft = c.get("big"), c.get("soft")
    t = T(0.6 if big else 0.42)
    sub = osc(95 * (0.5 + 0.5 * np.exp(-t / 0.05))) * att(t, 0.002) * expdec(t, 0.12 if big else 0.08)
    trans = filt(rng.standard_normal(len(t)), "low", 1800) * expdec(t, 0.012)
    knock = osc(np.full(len(t), 210.0)) * expdec(t, 0.035) + 0.5 * osc(np.full(len(t), 455.0)) * expdec(t, 0.02)
    slap = filt(rng.standard_normal(len(t)), "high", 2500) * expdec(t, 0.006)
    y = 1.0 * sub + 0.7 * trans + 0.45 * knock + (0.15 if soft else 0.4) * slap
    if big:   # a little room boom
        y += 0.35 * filt(rng.standard_normal(len(t)), "low", 300) * expdec(t, 0.18) * att(t, 0.01)
    return norm(fade_out(y))

def s_thud(c, rng):
    t = T(0.35)
    sub = osc(120 * (0.55 + 0.45 * np.exp(-t / 0.04))) * att(t, 0.003) * expdec(t, 0.07)
    trans = filt(rng.standard_normal(len(t)), "low", 900) * expdec(t, 0.015)
    return norm(fade_out(sub + 0.6 * trans))

def s_clunk(c, rng):
    """wooden sign / curtain meeting: knock-heavy thud with a rope creak"""
    t = T(0.5)
    knock = sum(a * osc(np.full(len(t), f)) * expdec(t, tau) for f, a, tau in ((180, 1, .06), (395, .6, .035), (730, .3, .02)))
    sub = osc(70 * (0.6 + 0.4 * np.exp(-t / 0.05))) * expdec(t, 0.09)
    trans = filt(rng.standard_normal(len(t)), "band", [300, 2500]) * expdec(t, 0.01)
    cr = osc(260 + 60 * np.sin(2 * np.pi * 3 * t)) * (np.abs(np.sin(2 * np.pi * 38 * t)) ** 6) * att(t - 0.05, 0.05) * expdec(t, 0.12) * 0.12
    return norm(fade_out(knock * att(t, 0.001) + 0.7 * sub + 0.5 * trans + cr))

def s_boing(c, rng):
    """cartoon boing: rising, wobbling jaw-harp tone"""
    d = c.get("dur", 0.55); t = T(d)
    f0 = 170 * st(c.get("pitch", 0))
    f = f0 * (1 + 0.7 * (1 - np.exp(-t / 0.09))) * (1 + 0.16 * np.exp(-t / (0.35 * d)) * np.sin(2 * np.pi * 11 * t))
    y = saw(f, 10)
    y = filt(y, "low", 2600)
    y = y * att(t, 0.004) * expdec(t, 0.45 * d)
    return norm(fade_out(y))

def s_coin(c, rng):
    """coin clink: two strikes of inharmonic partials"""
    t = T(0.55); f0 = 2350 * st(c.get("pitch", 0))
    def hit(f):
        return sum(a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6)) * expdec(t, tau)
                   for r, a, tau in ((1, 1, .22), (1.53, .6, .16), (2.24, .45, .1), (2.91, .3, .07), (3.72, .2, .05)))
    y = hit(f0) + 0.03 * rng.standard_normal(len(t)) * expdec(t, 0.002)
    y2 = np.zeros_like(y); place(y2, 0.55 * hit(f0 * 1.035)[: len(t) - int(0.065 * SR)], int(0.065 * SR))
    return norm(fade_out((y + y2) * att(t, 0.0008)))

def bell(t, f0, taus=(1.1, .7, .45, .3, .2), amp=(1, .5, .4, .25, .15)):
    ratios = (1, 2.0, 2.76, 4.07, 5.4)
    return sum(a * np.sin(2 * np.pi * f0 * r * t) * expdec(t, tau) for r, a, tau in zip(ratios, amp, taus))

def s_ding(c, rng):
    """bright bell ding (counter bell / cash-register bell); short=True for a tiny check-mark ding"""
    short = c.get("short")
    t = T(0.5 if short else 1.4); f0 = D6 * st(c.get("pitch", 0))
    taus = (.18, .12, .08, .05, .04) if short else (1.1, .7, .45, .3, .2)
    y = bell(t, f0, taus) * att(t, 0.001)
    y += 0.2 * filt(rng.standard_normal(len(t)), "high", 4000) * expdec(t, 0.003)
    return norm(fade_out(y))

def s_kaching(c, rng):
    """cash register: drawer ratchet + 'ka' + two bells + coin shimmer"""
    t = T(1.5); y = np.zeros(len(t))
    for k in range(7):
        L = int(0.012 * SR); g = filt(rng.standard_normal(L), "band", [1800, 5000]) * np.exp(-np.arange(L) / (L / 4))
        place(y, 0.35 * g, int(k * 0.017 * SR))
    ka = filt(rng.standard_normal(len(t)), "band", [900, 6000]) * expdec(t, 0.03)
    place(y, 0.6 * ka[: int(0.2 * SR)], int(0.12 * SR))
    place(y, bell(t, D6 * st(12))[: len(t) - int(0.14 * SR)], int(0.14 * SR))
    place(y, 0.7 * bell(t, A5 * st(12))[: len(t) - int(0.2 * SR)], int(0.2 * SR))
    for k in range(4):
        place(y, 0.25 * s_coin({"pitch": 5 + 2 * k}, rng)[: int(0.4 * SR)], int((0.16 + 0.07 * k) * SR))
    return norm(fade_out(y))

def s_flash(c, rng):
    """camera flash: shutter click + charging whine"""
    t = T(0.7)
    y = np.zeros(len(t))
    for dt in (0.0, 0.032):
        L = int(0.01 * SR); g = filt(rng.standard_normal(L), "band", [1200, 7000]) * np.exp(-np.arange(L) / (L / 5))
        place(y, g, int(dt * SR))
    whine = osc(1800 * (7000 / 1800) ** (t / 0.6)) * att(t - 0.04, 0.05) * np.clip((0.7 - t) / 0.25, 0, 1) * 0.12
    return norm(fade_out(y + whine))

def s_shutter(c, rng):
    d, n = c.get("dur", 1.7), c.get("n", 12)
    y = np.zeros(int((d + 0.05) * SR))
    for k in range(n):
        L = int(0.008 * SR); g = filt(rng.standard_normal(L), "band", [1500, 7000]) * np.exp(-np.arange(L) / (L / 5))
        place(y, g * rng.uniform(0.6, 1.0), int((k * d / n + rng.normal(0, 0.004)) * SR))
    return norm(y)

def tick(rng, f=3200, a=1.0):
    t = T(0.025)
    y = filt(rng.standard_normal(len(t)), "band", [1800, 6000]) * expdec(t, 0.0015) + 0.6 * np.sin(2 * np.pi * f * t) * expdec(t, 0.005)
    return a * y

def s_ticks(c, rng):
    d, rate = c.get("dur", 1.0), c.get("rate", 14)
    y = np.zeros(int((d + 0.05) * SR)); k = 0
    while k / rate < d:
        place(y, tick(rng, 3000 + 400 * (k % 2), 0.7 + 0.3 * rng.random()), int(k / rate * SR)); k += 1
    return norm(y)

def s_wheel(c, rng):
    """prize-wheel ticks: pointer hits a peg every `peg` degrees while the wheel eases out (cubic)"""
    d, deg, peg = c.get("dur", 1.1), c.get("deg", 810), c.get("peg", 22.5)
    y = np.zeros(int((d + 0.1) * SR)); nt = int(deg // peg)
    for k in range(1, nt + 1):
        frac = k * peg / deg                      # 1-(1-p)^3 = frac
        p = 1 - (1 - frac) ** (1 / 3)
        a = 0.55 + 0.45 * p                        # later ticks ring a little louder (slower = more distinct)
        place(y, tick(rng, 2600 + 300 * (k % 2), a) + 0.0, int(p * d * SR))
    place(y, 0.8 * s_clack({}, rng)[: int(0.1 * SR)], int(d * SR) - 1)   # the pointer settles
    return norm(y)

def s_drumroll(c, rng):
    d = c.get("dur", 1.0); t = T(d); y = np.zeros(len(t) + int(0.05 * SR))
    k = 0; rate = 26
    while k / rate < d:
        tt = k / rate; L = int(0.04 * SR); tl = np.arange(L) / SR
        hit = filt(rng.standard_normal(L), "band", [900, 7000]) * np.exp(-tl / 0.02) + 0.5 * np.sin(2 * np.pi * 190 * tl) * np.exp(-tl / 0.015)
        place(y, hit * (0.3 + 0.7 * (tt / d) ** 1.4) * (1.0 if k % 2 else 0.8), int(tt * SR)); k += 1
    return norm(y)

def s_horn(c, rng):
    """party horn: buzzy saw + square with vibrato, pitch scoop, nasal formant"""
    d = c.get("dur", 0.35); t = T(d); f0 = 440 * st(c.get("pitch", 0))
    f = f0 * (0.86 + 0.14 * att(t, 0.04)) * (1 + 0.02 * np.sin(2 * np.pi * 7 * t))
    y = saw(f, 30) + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    y = filt(y, "band", [500, 4200]) + 0.8 * filt(y, "band", [1000, 1600])
    y *= att(t, 0.02) * np.clip((d - t) / 0.05, 0, 1) * (1 + 0.15 * np.sin(2 * np.pi * 31 * t))
    return norm(y)

def s_rocket(c, rng):
    d = c.get("dur", 1.0); t = T(d)
    fizz = filt(rng.standard_normal(len(t)), "band", [500, 5000]) * (0.6 + 0.4 * np.abs(filt(rng.standard_normal(len(t)), "low", 30)))
    crack = grains(len(t), 400, rng, (0.5, 1.5), (2000, 9000))
    whistle = osc(700 * (2.1 ** (t / d)) * (1 + 0.01 * rng.standard_normal(len(t)))) * 0.25
    env = att(t, 0.08) * np.clip((d - t) / 0.35, 0, 1)
    y = (norm(fizz) + 0.5 * norm(crack) + whistle) * env
    pan = np.linspace(-0.6, 0.4, len(t))                               # travels left -> right
    return norm(np.array([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)]))

def s_keys(c, rng):
    """keyboard taps: click + small thock, ~12 keys/s with human jitter"""
    d = c.get("dur", 1.0); y = np.zeros((2, int((d + 0.06) * SR))); tt = 0.0
    while tt < d:
        L = int(0.03 * SR); tl = np.arange(L) / SR
        f = rng.uniform(330, 520) if rng.random() > 0.12 else 180
        k = filt(rng.standard_normal(L), "band", [2500, 9000]) * np.exp(-tl / 0.0012) + 0.5 * np.sin(2 * np.pi * f * tl) * np.exp(-tl / 0.008)
        p = rng.uniform(-0.3, 0.3)
        place(y[0], k * np.cos((p + 1) * np.pi / 4) * rng.uniform(0.6, 1), int(tt * SR))
        place(y[1], k * np.sin((p + 1) * np.pi / 4) * rng.uniform(0.6, 1), int(tt * SR))
        tt += rng.uniform(0.055, 0.12)
    return norm(y)

def s_confetti(c, rng):
    """confetti: cannon puff + crackle of paper bits drifting down (stereo scatter)"""
    d = c.get("dur", 1.3); t = T(d)
    puff = filt(rng.standard_normal(len(t)), "low", 1500) * expdec(t, 0.025) + 0.5 * osc(160 * (0.5 + 0.5 * np.exp(-t / 0.03))) * expdec(t, 0.04)
    dens = np.exp(-t / (0.35 * d))
    out = [0.7 * norm(puff) + norm(grains(len(t), 700, rng, (0.5, 2), (2500, 11000), density=dens)) * 0.8 for _ in range(2)]
    return norm(np.array(out))

def s_crowd(c, rng):
    """small studio audience 'ooh' / 'aww': 12 detuned voices through vowel formants, plus breath (kept subtle)"""
    kind = c.get("kind", "ooh"); d = c.get("dur", 1.1); t = T(d); u = t / d
    F = {"ooh": [(330, 1.0, 90), (820, .5, 120), (2300, .12, 200)], "aww": [(680, 1.0, 110), (1060, .6, 130), (2600, .12, 220)]}[kind]
    contour = (1 + 0.18 * np.sin(np.pi * u) - 0.1 * u) if kind == "ooh" else (1.12 - 0.25 * u)
    out = np.zeros((2, len(t)))
    for v in range(12):
        f0 = rng.uniform(115, 290)
        f = f0 * contour * (1 + 0.012 * np.sin(2 * np.pi * rng.uniform(4, 6.5) * t + rng.uniform(0, 6)))
        src = saw(f, 40) + 0.3 * rng.standard_normal(len(t))
        y = sum(a * signal.sosfilt(signal.butter(2, [fc - bw, fc + bw], "band", fs=SR, output="sos"), src) for fc, a, bw in F)
        on = rng.uniform(0, 0.15)
        env = att(t - on, 0.18) * np.clip((d - t) / (0.35 * d), 0, 1)
        p = rng.uniform(-0.8, 0.8)
        out[0] += y * env * np.cos((p + 1) * np.pi / 4); out[1] += y * env * np.sin((p + 1) * np.pi / 4)
    return norm(filt(out, "low", 3200))

def s_osting(c, rng):
    """Uchu's 'O!' shock sting: a short brass-like stab with a pitch scoop and a filter blat"""
    d = 0.42; t = T(d); p0 = c.get("pitch", 0)
    y = np.zeros(len(t))
    for m, a in ((69, 1.0), (73, 0.7), (76, 0.6), (57, 0.5)):          # A major (V of D) + low A
        f = 440 * 2 ** ((m - 69 + p0) / 12) * (0.94 + 0.06 * att(t, 0.045)) * (1 + 0.004 * rng.standard_normal())
        y += a * (saw(f * 0.997, 30) + saw(f * 1.003, 30))
    cutoff_env = 500 + 3500 * att(t, 0.03) * expdec(t, 0.12)
    # time-varying low-pass via 4 cross-faded fixed low-passes
    cuts = [600, 1200, 2400, 4000]
    lp = [filt(y, "low", fc) for fc in cuts]
    w = np.array([np.exp(-0.5 * ((np.log2(cutoff_env) - np.log2(fc)) / 0.5) ** 2) for fc in cuts])
    y = (w * np.array(lp)).sum(0) / (w.sum(0) + 1e-9)
    y *= att(t, 0.012) * np.where(t < 0.14, 1, expdec(t - 0.14, 0.09))
    return norm(fade_out(y))

def s_sparkle(c, rng):
    t = T(0.7); y = np.zeros(len(t))
    for k, m in enumerate((86, 90, 93, 98)):                            # D6 F#6 A6 D7 (+12)
        f = 440 * 2 ** ((m + 12 - 69) / 12)
        g = np.sin(2 * np.pi * f * t) * expdec(t, 0.12) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * expdec(t, 0.05)
        place(y, (0.9 - 0.12 * k) * g[: len(t) - int(k * 0.035 * SR)], int(k * 0.035 * SR))
    return norm(fade_out(y))

def s_clack(c, rng):
    """wood clack (clapper board, padlock snap)"""
    t = T(0.12)
    y = np.sin(2 * np.pi * 1150 * t) * expdec(t, 0.012) + 0.6 * np.sin(2 * np.pi * 2750 * t) * expdec(t, 0.007)
    y += filt(rng.standard_normal(len(t)), "band", [1500, 8000]) * expdec(t, 0.002)
    return norm(fade_out(y))

def s_bonk(c, rng):
    t = T(0.3)
    f = 620 * (0.62 + 0.38 * np.exp(-t / 0.02))
    y = osc(f) * expdec(t, 0.07) + 0.4 * osc(f * 1.52) * expdec(t, 0.035)
    y += 0.5 * filt(rng.standard_normal(len(t)), "low", 2500) * expdec(t, 0.004)
    return norm(fade_out(y * att(t, 0.0008)))

def s_button(c, rng):
    """plastic push button: press click + release click (big=True: chunky arcade button)"""
    big = c.get("big"); t = T(0.25); y = np.zeros(len(t))
    for dt, a in ((0.0, 1.0), (0.085 if big else 0.07, 0.55)):
        L = int(0.02 * SR); tl = np.arange(L) / SR
        k = filt(rng.standard_normal(L), "band", [1500, 7000]) * np.exp(-tl / 0.0015) + 0.7 * np.sin(2 * np.pi * (520 if big else 950) * tl) * np.exp(-tl / (0.02 if big else 0.008))
        place(y, a * k, int(dt * SR))
    if big: y += 0.6 * s_thud({}, rng)[: len(t)] * 0.6
    return norm(y)

def s_whistle(c, rng):
    """slide whistle up/down"""
    d = c.get("dur", 0.5); t = T(d); u = t / d
    lo, hi = 520, 1760
    f = lo * (hi / lo) ** (u if c.get("dir", "up") == "up" else 1 - u) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))
    y = osc(f) + 0.08 * osc(2 * f) + 0.05 * filt(rng.standard_normal(len(t)), "band", [1500, 5000])
    return norm(y * att(t, 0.03) * np.clip((d - t) / 0.06, 0, 1))

def s_scribble(c, rng):
    d = c.get("dur", 0.6); t = T(d)
    strokes = np.abs(np.sin(2 * np.pi * 6.5 * t + 0.5 * np.sin(2 * np.pi * 1.3 * t))) ** 0.7
    y = filt(rng.standard_normal(len(t)), "band", [1800, 6500]) * strokes * (0.7 + 0.3 * np.abs(filt(rng.standard_normal(len(t)), "low", 12)))
    return norm(y * att(t, 0.02) * np.clip((d - t) / 0.05, 0, 1))

def s_shaker(c, rng):
    d = c.get("dur", 0.6); y = np.zeros(int((d + 0.06) * SR)); k = 0
    while k / 12 < d:
        L = int(0.05 * SR); tl = np.arange(L) / SR
        h = filt(rng.standard_normal(L), "band", [3500, 11000]) * np.exp(-tl / (0.012 if k % 2 else 0.02))
        place(y, h * (1 if k % 2 == 0 else 0.6), int(k / 12 * SR)); k += 1
    return norm(y)

def s_gulp(c, rng):
    """cheek-pouch gulp: two quick 'blup's"""
    t = T(0.3); y = np.zeros(len(t))
    for dt, f0 in ((0.0, 420), (0.09, 300)):
        L = int(0.08 * SR); tl = np.arange(L) / SR
        f = f0 * (1.4 - 0.8 * tl / tl[-1])
        g = osc(f) * np.sin(np.pi * tl / tl[-1]) ** 0.6
        place(y, g, int(dt * SR))
    return norm(filt(y, "low", 2200))

def s_applause(c, rng):
    d = c.get("dur", 2.0); t = T(d); out = np.zeros((2, len(t) + int(0.03 * SR)))
    env_rate = att(t, 0.25) * np.clip((d - t) / (0.5 * d), 0, 1)
    n = int(90 * d)
    for _ in range(n):
        tt = rng.uniform(0, d)
        if rng.random() > env_rate[min(int(tt * SR), len(t) - 1)]: continue
        L = int(rng.uniform(0.006, 0.014) * SR); tl = np.arange(L) / SR
        cl = filt(rng.standard_normal(L), "band", [rng.uniform(700, 1200), rng.uniform(2500, 4500)]) * np.exp(-tl / (L / SR / 4))
        p = rng.uniform(-0.9, 0.9)
        place(out[0], cl * np.cos((p + 1) * np.pi / 4), int(tt * SR)); place(out[1], cl * np.sin((p + 1) * np.pi / 4), int(tt * SR))
    return norm(out)

SYNTH = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}

# per-type base level (dB) so that cue `gain` values are comparable across types
# (calibrated from each synth's measured momentary loudness: gain 0 = a headline hit, about 3-6 LU under the program)
LEVEL = {"whoosh": -7, "curtain": -13, "swipe": -9, "pop": -4, "pop_run": -9, "stamp": 1, "thud": -3, "clunk": 0, "boing": -5,
         "coin": -7, "ding": -10, "kaching": -10, "flash": -3, "shutter": 2, "ticks": 2, "wheel": -1, "drumroll": -1,
         "horn": -4, "rocket": -9, "keys": 3, "confetti": -3, "crowd": -7, "osting": -2, "sparkle": -9, "clack": 6,
         "bonk": -2, "button": 7, "whistle": -16, "scribble": -6, "shaker": 0, "gulp": -8, "applause": 2}


# ============================================================================ loudness (ITU-R BS.1770-4)
def k_weight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=-1), axis=-1)

def lufs(x):
    """integrated loudness of (ch, n) at 48 kHz"""
    x = np.atleast_2d(x); y = k_weight(x)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([(y[:, i:i + blk] ** 2).mean(1).sum() for i in range(0, y.shape[1] - blk + 1, hop)])
    lk = -0.691 + 10 * np.log10(ms + 1e-20)
    g = ms[lk > -70]
    if not len(g): return -np.inf
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    g2 = ms[(lk > -70) & (lk > rel)]
    return -0.691 + 10 * np.log10(g2.mean())

def short_term_max(x):
    y = k_weight(np.atleast_2d(x)); blk, hop = int(3 * SR), int(0.1 * SR)
    return max(-0.691 + 10 * np.log10((y[:, i:i + blk] ** 2).mean(1).sum() + 1e-20) for i in range(0, y.shape[1] - blk + 1, hop))

def true_peak(x):
    return max(np.abs(signal.resample_poly(ch, 4, 1)).max() for ch in np.atleast_2d(x))

def db(v): return 20 * np.log10(max(v, 1e-12))


def limit(x, ceiling, look=0.004, release=0.08):
    """look-ahead true-peak limiter at 1 ms control rate (gain never exceeds what the 4x-oversampled peak needs)"""
    n = x.shape[1]; B = SR // 1000
    up = np.max(np.abs(np.array([signal.resample_poly(ch, 4, 1) for ch in x])), axis=0)
    nb = int(np.ceil(n / B)); pk = np.zeros(nb)
    upb = np.pad(up, (0, nb * B * 4 - len(up)))
    pk = upb.reshape(nb, B * 4).max(1)
    req = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    L = int(look * 1000)
    req = -maximum_filter1d(-req, size=2 * L + 3, origin=0)          # min over +/- look-ahead (+1 block for interpolation)
    g = np.empty(nb); cur = 1.0; r = 1 - np.exp(-1 / (release * 1000))
    for i in range(nb):                                               # instant attack (already look-ahead), smooth release
        cur = req[i] if req[i] < cur else cur + (min(1.0, req[i]) - cur) * r
        g[i] = cur
    gs = np.interp(np.arange(n), np.arange(nb) * B + B / 2, g)
    return x * gs, 1 - g.min()


# ============================================================================ build
def speech_env(voice):
    fr = int(0.02 * SR)
    lvl = np.sqrt(np.convolve(voice ** 2, np.ones(fr) / fr, "same"))
    gate = (lvl > 10 ** (-45 / 20)).astype(float)
    a_, r_ = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
    sm = np.maximum(signal.lfilter([1 - r_], [1, -r_], gate), signal.lfilter([1 - a_], [1, -a_], gate))
    return np.clip(sm, 0, 1), gate

KEY_NUMBERS = ["fifty milliseconds", "three seconds", "53%", "85%", "Five reviews", "270%", "91%", "72%",
               "Twenty-plus photos", "three to five minutes", "2.7 million", "4.5 million", "one point"]

def protect_windows():
    """estimated time spans of key spoken numbers (char-proportional position inside each caption line)"""
    js = open(os.path.join(ROOT, "film", "captions.js"), encoding="utf-8").read()
    caps = [json.loads(l.strip().rstrip(",")) for l in js.splitlines() if l.strip().startswith("{")]
    wins = []
    for c in caps:
        dur = c["end"] - 0.3 - c["start"]; L = len(c["en"])
        for k in KEY_NUMBERS:
            i = c["en"].find(k)
            if i >= 0:
                a = c["start"] + dur * i / L; b = c["start"] + dur * (i + len(k)) / L
                wins.append((a - 0.3, b + 0.3, k))
    return wins

def pan2(y, pan):
    if y.ndim == 2:                         # stereo source: balance
        l, r = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2), np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        return np.array([y[0] * min(1, l), y[1] * min(1, r)])
    return np.array([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)])

def room(x, rng):
    """small bright room so the SFX sit in the same space as the music's reverb"""
    Lr = int(0.45 * SR); tr = np.arange(Lr) / SR; n = x.shape[1]
    out = x.copy()
    for c in range(2):
        ir = rng.standard_normal(Lr) * np.exp(-tr * 9.0); ir[: int(0.008 * SR)] = 0
        ir = filt(ir, "band", [300, 9000]); ir /= np.sqrt((ir ** 2).sum())
        out[c] += 0.16 * signal.fftconvolve(x[c], ir)[:n]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sfx-lufs", type=float, default=-21.0, help="integrated loudness of the SFX bus in the final mix")
    ap.add_argument("--target-lufs", type=float, default=-16.0)
    ap.add_argument("--tp", type=float, default=-1.0, help="true-peak ceiling, dBTP")
    ap.add_argument("--duck-db", type=float, default=-6.0, help="SFX ducking while the narrator speaks")
    ap.add_argument("--protect-db", type=float, default=-6.0, help="extra cut for long SFX over key spoken numbers")
    ap.add_argument("--report", action="store_true", help="print the cue report only")
    args = ap.parse_args()

    cues = json.load(open(os.path.join(HERE, "sfx-cues.json"), encoding="utf-8"))
    n = int(round(DURATION * SR))
    mix, sr = sf.read(os.path.join(ROOT, "audio", "mix.wav"), dtype="float64", always_2d=True)
    voice, sr2 = sf.read(os.path.join(ROOT, "audio", "narration.wav"), dtype="float64")
    assert sr == sr2 == SR and len(mix) == n and len(voice) == n, "mix/narration must be 48 kHz, 192.0 s (run build-narration.py)"
    mix = mix.T
    duck_sm, gate = speech_env(voice)
    duck = 1 - (1 - 10 ** (args.duck_db / 20)) * duck_sm
    wins = protect_windows()

    bus = np.zeros((2, n)); rendered, notes = [], []
    for i, c in enumerate(cues):
        typ = c["type"]
        if typ not in SYNTH: sys.exit(f"cue {i} @ {c['t']}: unknown type {typ!r} (known: {', '.join(sorted(SYNTH))})")
        rng = np.random.default_rng(1000 + i)
        y = pan2(np.asarray(SYNTH[typ](c, rng), dtype=np.float64), c.get("pan", 0.0))
        i0 = int(round(c["t"] * SR)); dur = y.shape[1] / SR
        # long SFX (> 0.35 s of real energy) that overlap an estimated key spoken number get an extra cut
        # "active" length: 10 ms RMS envelope within 12 dB of its maximum (a bell's quiet tail doesn't count)
        fr = int(0.01 * SR); e = np.sqrt(np.convolve((y ** 2).sum(0), np.ones(fr) / fr, "same"))
        act = np.flatnonzero(e > e.max() * 10 ** (-12 / 20)); edur = (act[-1] - act[0]) / SR if len(act) else 0
        g_db = LEVEL[typ] + c.get("gain", 0.0)
        hit = [w for w in wins if c["t"] < w[1] and c["t"] + edur > w[0]]
        if hit and edur > 0.35:
            g_db += args.protect_db; notes.append(f"  protect {c['t']:7.2f} {typ:<9} ({edur:.2f}s) over '{hit[0][2]}' -> {args.protect_db:+.0f} dB")
        elif hit:
            notes.append(f"  short   {c['t']:7.2f} {typ:<9} ({edur:.2f}s) near '{hit[0][2]}' (kept)")
        y = y * 10 ** (g_db / 20)
        y = y[:, : n - i0]
        place(bus[0], y[0], i0); place(bus[1], y[1], i0)
        rendered.append((i0, y))

    bus = room(bus, np.random.default_rng(99)) * duck[None, :]
    if not np.isfinite(bus).all(): sys.exit("NaN/inf in SFX bus")

    # levels: SFX bus to --sfx-lufs (after the final gain), final to --target-lufs, true peak <= --tp
    L_mix = lufs(mix)
    g_final = 10 ** ((args.target_lufs - L_mix) / 20)
    g_sfx = 10 ** ((args.sfx_lufs - lufs(bus)) / 20)
    for _ in range(3):
        final = g_final * mix + g_sfx * bus
        final, gr = limit(final, 10 ** ((args.tp - 0.15) / 20))
        L_f = lufs(final)
        g_final *= 10 ** ((args.target_lufs - L_f) / 20)
        g_sfx *= 10 ** ((args.target_lufs - L_f) / 20)
    final = g_final * mix + g_sfx * bus
    final, gr = limit(final, 10 ** ((args.tp - 0.15) / 20))
    sfx_out = g_sfx * bus

    # ------------------------------------------------------------------ report
    L_f, L_s, tp_f, tp_s = lufs(final), lufs(sfx_out), true_peak(final), true_peak(sfx_out)
    print(f"{len(cues)} cues, {len(set(c['type'] for c in cues))} types")
    print(f"mix.wav        {L_mix:6.2f} LUFS  TP {db(true_peak(mix)):6.2f} dBTP")
    print(f"SFX bus        {L_s:6.2f} LUFS  TP {db(tp_s):6.2f} dBTP  (short-term max {short_term_max(sfx_out):6.2f} LUFS; "
          f"{L_s - L_f:+.1f} LU vs final)")
    print(f"final.wav      {L_f:6.2f} LUFS  TP {db(tp_f):6.2f} dBTP  sample peak {db(np.abs(final).max()):6.2f} dBFS  "
          f"limiter max GR {-db(1 - gr):.2f} dB  {final.shape[1] / SR:.3f} s  finite={np.isfinite(final).all()}")
    sp = gate > 0.5
    print(f"SFX ducked {args.duck_db:+.0f} dB while narration is active ({100 * sp.mean():.0f}% of the film)")
    print("key-number protection:"); print("\n".join(notes) if notes else "  (none)")
    loud = []
    for (a, y), c in zip(rendered, cues):
        own = g_sfx * y * duck[None, a:a + y.shape[1]]                 # this cue's contribution in the final mix
        kw = k_weight(own); blk = int(0.4 * SR); hop = int(0.05 * SR)
        mom = max(-0.691 + 10 * np.log10((kw[:, i:i + blk] ** 2).mean(1).sum() + 1e-20) for i in range(0, max(1, kw.shape[1] - blk + 1), hop)) \
            if kw.shape[1] >= blk else -0.691 + 10 * np.log10((kw ** 2).sum(1).sum() / blk + 1e-20)
        loud.append((mom, db(np.abs(own).max()), c))
    loud.sort(key=lambda z: -z[0])
    print("20 loudest SFX moments (the cue's own contribution: momentary loudness, 400 ms / sample peak):")
    for m, pk, c in loud[:20]:
        print(f"  {c['t']:7.2f}s  {m:6.1f} LUFS-M  {pk:6.1f} dBFS  {c['type']:<9} {c.get('note', '')}")
    print(f"  (for scale: the final mix averages {L_f:.1f} LUFS; quietest cue {loud[-1][0]:.1f} LUFS-M @ {loud[-1][2]['t']}s {loud[-1][2]['type']})")
    if args.report: return

    out = os.path.join(ROOT, "audio")
    sf.write(os.path.join(out, "sfx.wav"), np.clip(sfx_out, -1, 1).T, SR, subtype="PCM_16")
    sf.write(os.path.join(out, "final.wav"), np.clip(final, -1, 1).T, SR, subtype="PCM_16")
    print(f"wrote audio/sfx.wav, audio/final.wav ({n / SR:.3f} s, 48 kHz stereo)")


if __name__ == "__main__":
    main()
