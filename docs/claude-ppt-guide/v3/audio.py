"""Assemble VO on the 30 s timeline, derive a 30 fps mouth envelope, synthesize a music bed + whooshes."""
import json, numpy as np, soundfile as sf
SR, DUR, FPS = 48000, 30.0, 30
starts = [0.30, 3.33, 9.69, 16.60, 25.45]
N = int(SR * DUR)
vo = np.zeros(N)
spans = []
for i, st in enumerate(starts):
    s, sr = sf.read(f"L{i+1}_am_puck.wav")
    s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)  # 24k -> 48k
    a = int(st * SR); vo[a:a + len(s)] += s[:N - a]
    spans.append([st, round(st + len(s) / SR, 3)])
vo /= np.max(np.abs(vo)) / 0.9

# mouth envelope per frame (RMS, smoothed, normalized)
hop = SR // FPS
rms = np.array([np.sqrt(np.mean(vo[i*hop:(i+1)*hop] ** 2)) for i in range(int(DUR * FPS))])
rms = np.convolve(rms, [0.25, 0.5, 0.25], mode="same")
env = np.clip(rms / np.percentile(rms[rms > 0.01], 90), 0, 1)
json.dump({"fps": FPS, "mouth": [round(float(x), 3) for x in env], "lines": spans}, open("timeline.json", "w"))

# music bed: 112 bpm, sub kick, closed hats, warm minor-7 pads, soft pluck arp
t = np.arange(N) / SR
bpm = 112; beat = 60 / bpm
mus = np.zeros(N)
def note(m): return 440 * 2 ** ((m - 69) / 12)
chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am7 Fmaj7 Cmaj7 G7
bar = 4 * beat
for b in range(int(DUR / bar) + 1):
    ch = chords[b % 4]; a = int(b * bar * SR); L = min(N - a, int(bar * SR * 1.1))
    if L <= 0: break
    tt = np.arange(L) / SR; envp = np.minimum(1, tt / 0.4) * np.exp(-tt * 0.25)
    for m in ch:
        f = note(m); mus[a:a+L] += 0.022 * envp * (np.sin(2*np.pi*f*tt) + 0.5*np.sin(2*np.pi*f*1.004*tt) + 0.2*np.sin(2*np.pi*2*f*tt))
    for j in range(8):
        p = a + int(j * beat / 2 * SR); L2 = int(0.25 * SR)
        if p + L2 > N: break
        tp = np.arange(L2) / SR; f = note(ch[(j * 3) % 4] + 12)
        mus[p:p+L2] += 0.02 * np.exp(-tp * 14) * np.sign(np.sin(2*np.pi*f*tp)) * 0.6
rng = np.random.default_rng(3)
for k in range(int(DUR / beat)):
    p = int(k * beat * SR)
    if k >= 4:  # kick enters after the hook
        L = int(0.35 * SR); tp = np.arange(L) / SR
        if p + L < N: mus[p:p+L] += 0.33 * np.sin(2*np.pi*(45 + 90*np.exp(-tp*30))*tp) * np.exp(-tp*9)
    for h in (0.5,):
        q = int((k + h) * beat * SR); L = int(0.05 * SR)
        if q + L < N: mus[q:q+L] += 0.05 * rng.normal(0, 1, L) * np.exp(-np.arange(L) / SR * 90)
# whooshes at scene cuts
for c in [3.2, 9.55, 16.45, 25.3]:
    L = int(0.7 * SR); a = int((c - 0.45) * SR); tp = np.arange(L) / SR
    nz = rng.normal(0, 1, L); nz = np.convolve(nz, np.ones(12) / 12, mode="same")
    mus[a:a+L] += 0.22 * nz * np.sin(np.pi * tp / 0.7) ** 2
# riser into the final ask + soft impact
a = int(24.6 * SR); L = int(0.7 * SR); tp = np.arange(L) / SR
mus[a:a+L] += 0.05 * np.sin(2*np.pi*(200 + 900*tp**2)*tp) * (tp / 0.7)
# duck music under voice
venv = np.convolve(np.abs(vo), np.ones(SR // 10) / (SR // 10), mode="same")
duck = 1 - 0.55 * np.clip(venv / 0.08, 0, 1)
fade = np.minimum(1, np.minimum(t / 0.3, (DUR - t) / 1.2))
mix = vo * 1.0 + mus * duck * fade * 1.1
mix /= np.max(np.abs(mix)) / 0.95
sf.write("mix.wav", np.stack([mix, mix], 1), SR)
print(spans)
