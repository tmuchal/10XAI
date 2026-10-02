"""Stage 2: original dark, heavy synth score for DEAD RAIN synthesized in numpy (no samples, no copyrighted music),
plus the final audio mix (music ducked under the narration, SFX hits on the cuts).

  python3 music.py          -> build/audio/music.wav and build/audio/mix.wav
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

from common import BUILD, load_timeline

SR = 44100
BPM = 92.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
AUD = os.path.join(BUILD, 'audio')
rng = np.random.default_rng(76)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def saw(freq, n, phase=0.0):
    t = np.arange(n) / SR
    ph = (phase + freq * t) % 1.0
    return 2 * ph - 1


def square(freq, n, duty=0.5):
    t = np.arange(n) / SR
    return np.where((freq * t) % 1.0 < duty, 1.0, -1.0)


def lp(x, fc, order=2):
    sos = butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = butter(order, fc, 'high', fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], 'band', fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def sweep_lp(x, fc_curve, block=512):
    """Time-varying 2-pole lowpass: cutoff per block from fc_curve (same length as x)."""
    y = np.zeros_like(x)
    zi = np.zeros((1, 2))
    for i in range(0, len(x), block):
        fc = float(np.clip(fc_curve[min(i, len(fc_curve) - 1)], 40, SR * 0.45))
        sos = butter(2, fc, 'low', fs=SR, output='sos')
        y[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return y


def env(n, a=0.005, d=0.1, s=0.0, r=0.05, hold=None):
    """ADSR over n samples (hold = sustain length in s, default the whole note)."""
    e = np.zeros(n)
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    H = n - A - D - R if hold is None else int(hold * SR)
    H = max(0, H)
    seg = [np.linspace(0, 1, max(1, A), endpoint=False), np.linspace(1, s, max(1, D), endpoint=False),
           np.full(H, s), np.linspace(s, 0, max(1, R))]
    c = np.concatenate(seg)[:n]
    e[:len(c)] = c
    return e


def reverb_ir(sec=2.4, decay=3.0, stereo=True):
    n = int(sec * SR)
    t = np.arange(n) / SR
    chans = []
    for _ in range(2 if stereo else 1):
        noise = rng.standard_normal(n) * np.exp(-decay * t)
        noise = lp(noise, 6000)
        noise[:int(0.012 * SR)] = 0
        chans.append(noise / np.sqrt(np.sum(noise ** 2)))
    return np.stack(chans, 1)


IR = None


def reverb(x, wet=0.3):
    global IR
    if IR is None:
        IR = reverb_ir()
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    y = np.stack([fftconvolve(x[:, c], IR[:, c])[:len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 2.2


def delay(x, t=BEAT * 0.75, fb=0.38, mix=0.35):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    d = int(t * SR)
    y = x.copy()
    tap = x.copy()
    for k in range(1, 6):
        tap = np.roll(tap, d, axis=0) * fb
        tap[:d] = 0
        # ping-pong: alternate channels
        if k % 2:
            y[:, 0] += tap[:, 0] * mix
        else:
            y[:, 1] += tap[:, 1] * mix
    return y


def place(buf, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(buf):
        return
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l, x * r], 1) * np.sqrt(2)
    if i < 0:
        x = x[-i:]
        i = 0
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[:j - i] * gain


# ------------------------------------------------------------------ instruments

def kick():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    x[:200] += rng.standard_normal(200) * np.linspace(0.6, 0, 200)
    return np.tanh(x * 1.6)


def snare():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 900, 7000) * np.exp(-t * 14)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 22)
    return (nz * 0.9 + tone * 0.6)


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * (14 if open_ else 70))


def pluck(m, dur=0.22, bright=3500):
    n = int(dur * SR)
    x = saw(mtof(m), n) * 0.6 + square(mtof(m) * 1.004, n, 0.3) * 0.4
    x = lp(x, bright)
    return x * env(n, 0.002, dur * 0.9, 0.0, 0.02)


def pad_chord(notes, dur, fc=1800):
    n = int(dur * SR)
    x = np.zeros(n)
    for m in notes:
        for det in (-0.11, -0.04, 0.03, 0.09):
            x += saw(mtof(m) * 2 ** (det / 12), n, phase=rng.random())
    x = lp(x / (len(notes) * 4), fc, 2)
    return x * env(n, 0.6, 0.3, 0.8, 0.8)


def bass_note(m, dur, fc=420):
    n = int(dur * SR)
    x = saw(mtof(m), n) + 0.5 * saw(mtof(m) * 1.006, n)
    x = lp(x, fc, 4) + 0.35 * np.sin(2 * np.pi * mtof(m) * np.arange(n) / SR)
    return np.tanh(x * 1.4) * env(n, 0.004, 0.2, 0.7, 0.05)


def braam(dur=3.2):
    """Low brassy cinematic hit for "It's 2077"."""
    n = int(dur * SR)
    x = np.zeros(n)
    for m in (33, 40, 45, 45.1, 52):
        x += saw(mtof(m), n, rng.random())
    t = np.arange(n) / SR
    fc = 180 + 2200 * np.exp(-t * 2.2) * (1 - np.exp(-t * 30))
    x = sweep_lp(x / 5, fc)
    return np.tanh(x * 2.5) * env(n, 0.02, 0.4, 0.6, 1.8)


def boom(dur=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 32 + 80 * np.exp(-t * 9)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    nz = lp(rng.standard_normal(n), 900) * np.exp(-t * 5) * 0.5
    return np.tanh((x + nz) * 1.8)


def crash(dur=3.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 3000) * np.exp(-t * 1.4) * 0.5


def whoosh(dur=0.9, rev=False):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    fc = 300 + 5000 * (t / dur) ** 2
    y = sweep_lp(x, fc)
    e = np.sin(np.pi * t / dur) ** 2
    y = y * e
    return y[::-1] if rev else y


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    y = sweep_lp(x, 200 + 9000 * (t / dur) ** 3) * (t / dur) ** 2
    tone = saw(1, n)  # placeholder phase
    f = 110 * 2 ** (2 * t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 2 * 0.3
    return y + tone


def glitch():
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    x = square(1200 + 600 * rng.random(), n, 0.3) * (rng.random(n) > 0.5)
    return bp(x, 800, 6000) * np.exp(-t * 18) * 0.5


# ------------------------------------------------------------------ score

CHORDS = [  # D minor, phrygian-ish: Dm Bb Gm A  (bass root, pad voicing, arp tones)
    (38, [50, 53, 57, 62], [62, 65, 69, 74]),
    (34, [50, 53, 58, 62], [58, 62, 65, 70]),
    (31, [50, 55, 58, 62], [55, 62, 67, 70]),
    (33, [49, 52, 57, 61], [57, 61, 64, 69]),
]


def dist_bass(m, dur, fc=520):
    """Heavier, grittier bass than the 2D promo: detuned saws + sub, folded through tanh."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = saw(mtof(m), n) + saw(mtof(m) * 1.008, n, 0.3) + 0.6 * square(mtof(m) / 2, n, 0.5)
    x = lp(np.tanh(x * 2.2), fc, 4) + 0.55 * np.sin(2 * np.pi * mtof(m) / 2 * t)
    return np.tanh(x * 1.6) * env(n, 0.003, 0.15, 0.75, 0.04)


def drone(dur, root=26):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(saw(mtof(root + o), n, rng.random()) for o in (0, 0.07, 12, 19))
    x = sweep_lp(x / 4, 120 + 260 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 7.0)))
    return x * env(n, 2.0, 0.5, 1.0, 2.0)


def compose(tl):
    total = tl['total'] + 0.5
    N = int(total * SR)
    seg = {s['name']: s for s in tl['segments']}
    L = {l['n']: l for l in tl['lines']}
    t_open_hit = 1.25                       # opening logo slams in
    t_drop = seg['S03_horde']['start']      # action starts
    t_fixer = seg['S07_fixer']['start']     # second act: features
    hit = tl['hit']
    grid0 = hit - np.ceil(hit / BAR) * BAR
    stems = {k: np.zeros((N, 2)) for k in ('drums', 'bass', 'pad', 'arp', 'fx')}

    def q(t):
        k = np.ceil((t - grid0 - BAR * 0.5) / BAR)
        return grid0 + k * BAR

    drop_bar = q(t_drop)
    fix_bar = q(t_fixer)
    stop = hit - BAR
    K, S, HC, HO = kick(), snare(), hat(), hat(True)
    b, k = grid0, 0
    while b < total:
        ch = CHORDS[k % 4]
        if b + BAR > 0 and b < hit - BAR * 0.25:
            place(stems['pad'], pad_chord(ch[1], BAR + 0.9, 700 if b < drop_bar else 1500), b,
                  0.5 if b < drop_bar else 0.42)
        if b + BAR > 0 and b < stop:
            # bass: pulsing 8ths after the drop, long notes before
            if b >= drop_bar:
                for i in range(8):
                    m = ch[0] + (12 if (b >= fix_bar and i % 4 == 3) else 0)
                    place(stems['bass'], dist_bass(m, BEAT / 2 * 0.9, 650 if b < fix_bar else 900),
                          b + i * BEAT / 2, 0.5)
            elif b >= q(L[2]['start']) - BAR:
                place(stems['bass'], dist_bass(ch[0], BAR * 0.95, 260), b, 0.42)
            # arp
            for i in range(16):
                if b < drop_bar and i % 2:
                    continue
                tone = ch[2][[0, 2, 1, 3, 2, 1, 3, 0][i % 8]]
                bright = 800 if b < drop_bar else 2600
                place(stems['arp'], pluck(tone, 0.18, bright), b + i * BEAT / 4,
                      0.09 if b < drop_bar else 0.12, pan=0.35 * np.sin(i * 1.3))
            # drums: half-time heavy groove after the drop
            if b >= drop_bar:
                for i in range(4):
                    bt = b + i * BEAT
                    if i in (0, 2) or (b >= fix_bar and i == 3):
                        place(stems['drums'], K, bt, 1.0)
                    if i == 2 or (b >= fix_bar and i == 2):
                        place(stems['drums'], S, bt, 0.62)
                    if b >= fix_bar and i == 1:
                        place(stems['drums'], K, bt + BEAT / 2, 0.8)
                for i in range(16 if b >= fix_bar else 8):
                    nh = 16 if b >= fix_bar else 8
                    place(stems['drums'], HC, b + i * BAR / nh, 0.13 if i % 2 else 0.08, pan=0.25)
                place(stems['drums'], HO, b + 3.5 * BEAT, 0.1, pan=-0.2)
                if abs((b + BAR) - stop) < 1e-6 or abs((b + BAR) - fix_bar) < 1e-6:
                    for i in range(8):
                        place(stems['drums'], S, b + 2 * BEAT + i * BEAT / 4, 0.16 + 0.06 * i)
            elif b >= q(L[1]['start']):
                place(stems['drums'], K, b, 0.55)  # heartbeat kick in the intro
                place(stems['drums'], K, b + BEAT * 0.75, 0.3)
        b += BAR
        k += 1
    # dread drone under the whole intro
    place(stems['pad'], drone(drop_bar + 2.0), 0.0, 0.5)
    # opening logo slam
    place(stems['fx'], braam(3.6), t_open_hit, 0.7)
    place(stems['fx'], boom(3.5), t_open_hit, 0.8)
    place(stems['fx'], riser(1.2), t_open_hit - 1.2, 0.35)
    # drop
    place(stems['fx'], riser(BAR), drop_bar - BAR, 0.45)
    place(stems['fx'], boom(3.0), drop_bar, 0.85)
    place(stems['fx'], crash(3.0), drop_bar, 0.4)
    place(stems['fx'], braam(2.8), fix_bar, 0.4)
    for sg in tl['segments'][1:]:
        if sg['kind'] == 'gameplay':
            place(stems['fx'], glitch(), sg['start'] - 0.02, 0.45)
        if sg['name'] in ('S03_horde', 'logo_close'):
            continue
        place(stems['fx'], whoosh(0.7), sg['start'] - 0.45, 0.25, pan=rng.uniform(-0.4, 0.4))
    place(stems['fx'], riser(hit - stop), stop, 0.65)
    # the logo hit: boom + braam + crash + low stab
    place(stems['fx'], boom(5.0), hit, 1.1)
    place(stems['fx'], braam(4.5), hit, 0.75)
    place(stems['fx'], crash(5.0), hit, 0.55)
    stab = pad_chord([38, 50, 53, 57, 62, 69], 7.5, 2400)
    place(stems['pad'], stab * np.linspace(1, 0.2, len(stab)), hit, 0.85)
    place(stems['bass'], dist_bass(26, 6.0, 220) * np.exp(-np.arange(int(6.0 * SR)) / SR * 0.6), hit, 0.75)
    for i in range(12):
        place(stems['arp'], pluck([62, 69, 65, 74][i % 4], 0.3, 1800), hit + 1.4 + i * BEAT / 2, 0.08 * (1 - i / 14))
    rain = lp(hp(rng.standard_normal((N, 2)), 400), 5000) * 0.06
    stems['fx'] += rain
    stems['arp'] = delay(stems['arp'], BEAT * 0.75, 0.42, 0.4)
    stems['pad'] = reverb(stems['pad'], 0.4)
    stems['arp'] = reverb(stems['arp'], 0.3)
    stems['drums'][:, :] = reverb(stems['drums'], 0.14)
    stems['fx'] = reverb(stems['fx'], 0.22)
    mix = stems['drums'] * 0.95 + stems['bass'] * 0.9 + stems['pad'] * 0.8 + stems['arp'] * 0.8 + stems['fx'] * 0.9
    fi = int(0.4 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(3.0 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.8) * 0.85
    return mix[:int(tl['total'] * SR)], stems


def vo_track(tl, N):
    vo = np.zeros((N, 2))
    for ln in tl['lines']:
        x, sr = sf.read(ln['wav'])
        if x.ndim > 1:
            x = x.mean(1)
        x = resample_poly(x, SR, sr)
        # light "trailer" treatment: low shelf warmth via gentle lowpass blend + small room
        x = 0.8 * x + 0.35 * lp(x, 250)
        place(vo, x, ln['start'], 1.0)
    vo = reverb(vo, 0.08)
    return vo


def duck_env(tl, N, depth_db=-10.0, attack=0.12, release=0.45):
    g = np.ones(N)
    lo = 10 ** (depth_db / 20)
    for ln in tl['lines']:
        a, b = int((ln['start'] - attack) * SR), int((ln['end'] + 0.05) * SR)
        g[max(0, a):b] = lo
    # smooth (attack/release) with a one-pole in both directions via cumulative filtering
    k = int(release * SR)
    ker = np.exp(-np.arange(k) / (k / 4))
    ker /= ker.sum()
    return np.clip(np.convolve(g, ker, mode='same'), lo, 1.0)


def main():
    tl = load_timeline()
    os.makedirs(AUD, exist_ok=True)
    music, stems = compose(tl)
    N = len(music)
    sf.write(os.path.join(AUD, 'music.wav'), music.astype(np.float32), SR)
    vo = vo_track(tl, N)
    g = duck_env(tl, N)
    mix = music * g[:, None] * 0.62 + vo * 0.95
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.93
    sf.write(os.path.join(AUD, 'vo.wav'), vo.astype(np.float32), SR)
    sf.write(os.path.join(AUD, 'mix.wav'), mix.astype(np.float32), SR)
    rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    print(f'music {N / SR:.2f}s, mix rms {rms(mix):.1f} dBFS, music rms {rms(music):.1f}, vo rms {rms(vo):.1f}')


if __name__ == '__main__':
    main()
