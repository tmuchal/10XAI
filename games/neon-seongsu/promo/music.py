"""Stage 2: original dark synthwave score synthesized in numpy (no samples, no copyrighted music),
plus the final audio mix (music ducked under the narration, SFX hits on the cuts).

  python3 music.py          -> build/audio/music.wav and build/audio/mix.wav
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

from common import BUILD, load_timeline

SR = 44100
BPM = 100.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
AUD = os.path.join(BUILD, 'audio')
rng = np.random.default_rng(2077)


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

CHORDS = [  # (bass root, pad voicing, arp tones) Am F C G
    (45, [57, 60, 64, 69], [69, 72, 76, 81]),
    (41, [57, 60, 65, 69], [65, 69, 72, 77]),
    (48, [55, 60, 64, 67], [67, 72, 76, 79]),
    (43, [55, 59, 62, 67], [67, 71, 74, 79]),
]


def compose(tl):
    total = tl['total'] + 0.5
    N = int(total * SR)
    seg = {s['name']: s for s in tl['segments']}
    t_brick = seg['B_brick']['start']
    t_money = seg['money']['start']
    t_2077 = seg['year2077']['start']
    t_drop = seg['C_tower']['start']
    t_game = seg['switch']['start']
    t_logo = seg['D_logo']['start']
    hit = tl['hit']
    # grid anchored so the logo hit lands on a downbeat
    grid0 = hit - np.ceil(hit / BAR) * BAR
    stems = {k: np.zeros((N, 2)) for k in ('drums', 'bass', 'pad', 'arp', 'fx')}

    def bars():
        b = grid0
        k = 0
        while b < total:
            yield k, b
            b += BAR
            k += 1

    def q(t):
        """Nearest bar line at or after t - half a bar."""
        k = np.ceil((t - grid0 - BAR * 0.5) / BAR)
        return grid0 + k * BAR

    drop_bar = q(t_drop)
    game_bar = q(t_game)
    money_bar = q(t_money)
    stop = hit - BAR  # drums stop one bar before the hit; riser fills it
    K, S, HC, HO = kick(), snare(), hat(), hat(True)
    for k, b in bars():
        ch = CHORDS[k % 4]
        if b + BAR < 0:
            continue
        # pad all the way (dark, warmer during the brick section)
        if b < hit - BAR * 0.25:
            fc = 1100 if b < t_drop else 2200
            place(stems['pad'], pad_chord(ch[1], BAR + 0.9, fc), b, 0.55 if b < drop_bar else 0.45)
        # bass
        if money_bar <= b < stop:
            full = b >= drop_bar
            for i in range(8):
                m = ch[0] + (12 if (full and i % 2) else 0)
                place(stems['bass'], bass_note(m, BEAT / 2 * 0.92, 900 if full else 380), b + i * BEAT / 2,
                      0.55 if full else 0.4)
        # arp: 16ths, lowpassed early, echoes
        if b < stop:
            for i in range(16):
                tone = ch[2][[0, 1, 2, 3, 2, 1, 3, 2][i % 8]] + (12 if (b >= game_bar and i % 4 == 3) else 0)
                bright = 900 if b < t_brick else (1600 if b < drop_bar else 3800)
                g = 0.12 if b < drop_bar else 0.16
                place(stems['arp'], pluck(tone, 0.2, bright), b + i * BEAT / 4, g, pan=0.3 * np.sin(i))
        # drums
        if money_bar <= b < stop:
            for i in range(4):
                bt = b + i * BEAT
                if b >= drop_bar or i % 2 == 0:
                    place(stems['drums'], K, bt, 0.9)
                if b >= drop_bar and i % 2 == 1:
                    place(stems['drums'], S, bt, 0.5)
            nh = 16 if b >= game_bar else 8
            for i in range(nh):
                if b < drop_bar and i % 2 == 0:
                    continue
                place(stems['drums'], HC, b + i * BAR / nh, 0.16 if i % 2 else 0.1, pan=0.25)
            if b >= drop_bar:
                place(stems['drums'], HO, b + 3.5 * BEAT, 0.12, pan=-0.2)
            # snare fill into the game section and into the riser
            if abs((b + BAR) - game_bar) < 1e-6 or abs((b + BAR) - stop) < 1e-6:
                for i in range(8):
                    place(stems['drums'], S, b + 2 * BEAT + i * BEAT / 4, 0.18 + 0.05 * i)
    # hits and transitions on the exact cut times
    place(stems['fx'], braam(3.4), t_2077 + 0.05, 0.55)
    place(stems['fx'], boom(3.0), t_drop, 0.8)
    place(stems['fx'], crash(3.0), drop_bar, 0.4)
    for sg in tl['segments'][1:]:
        if sg['name'] in ('C_tower', 'D_logo', 'year2077'):
            continue
        if sg['kind'] == 'gameplay':
            place(stems['fx'], glitch(), sg['start'] - 0.02, 0.5)
        place(stems['fx'], whoosh(0.8), sg['start'] - 0.55, 0.35, pan=rng.uniform(-0.4, 0.4))
    place(stems['fx'], boom(2.0), t_game, 0.5)
    rl = hit - stop
    place(stems['fx'], riser(rl), stop, 0.6)
    # the logo hit
    place(stems['fx'], boom(4.5), hit, 1.0)
    place(stems['fx'], crash(5.0), hit, 0.6)
    stab = pad_chord([45, 57, 60, 64, 69, 76], 7.0, 3000)
    place(stems['pad'], stab * np.linspace(1, 0.25, len(stab)), hit, 0.9)
    place(stems['bass'], bass_note(33, 5.5, 200) * np.exp(-np.arange(int(5.5 * SR)) / SR * 0.7), hit, 0.7)
    # a slow arp echo over the logo
    for i in range(12):
        place(stems['arp'], pluck([69, 76, 72, 81][i % 4], 0.3, 2200), hit + 1.2 + i * BEAT / 2, 0.1 * (1 - i / 14))
    # rain ambience bed
    rain = lp(hp(rng.standard_normal((N, 2)), 400), 5000) * 0.05
    stems['fx'] += rain
    # process
    stems['arp'] = delay(stems['arp'], BEAT * 0.75, 0.4, 0.4)
    stems['pad'] = reverb(stems['pad'], 0.35)
    stems['arp'] = reverb(stems['arp'], 0.25)
    stems['drums'][:, :] = reverb(stems['drums'], 0.12)
    stems['fx'] = reverb(stems['fx'], 0.2)
    mix = stems['drums'] * 0.9 + stems['bass'] * 0.9 + stems['pad'] * 0.8 + stems['arp'] * 0.9 + stems['fx'] * 0.9
    # fade in / out
    fi = int(1.5 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(3.0 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.6) * 0.85
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
