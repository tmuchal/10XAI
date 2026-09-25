"""Generates a quiet, royalty-free ambient bed (pads + soft plucks) for the guide video.
Usage: python3 make-music.py <seconds> <out.wav>"""
import sys, wave
import numpy as np

SR = 44100
dur = float(sys.argv[1]); out = sys.argv[2]
n = int(SR * dur); t = np.arange(n) / SR
mix = np.zeros(n)

def note(f): return 440.0 * 2 ** ((f - 69) / 12)
# Cmaj7 - Am7 - Fmaj7 - G6, 4 s per chord
chords = [[48, 55, 64, 71], [45, 52, 60, 67], [41, 53, 57, 64], [43, 50, 59, 64]]
bar = 4.0
for k in range(int(dur // bar) + 1):
    ch = chords[k % 4]; s0 = int(k * bar * SR); s1 = min(n, int((k + 1.25) * bar * SR))
    if s0 >= n: break
    tt = np.arange(s1 - s0) / SR
    env = np.minimum(1, tt / 1.2) * np.minimum(1, np.maximum(0, (bar * 1.25 - tt) / 1.4))
    for m in ch:
        f = note(m)
        mix[s0:s1] += 0.05 * env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 1.003 * tt) + 0.12 * np.sin(2 * np.pi * 2 * f * tt))
    # soft pluck arpeggio, 8th notes
    arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12]
    for j in range(8):
        p0 = s0 + int(j * 0.5 * SR); L = int(0.9 * SR)
        if p0 + L > n: break
        tp = np.arange(L) / SR; f = note(arp[j % 4])
        mix[p0:p0 + L] += 0.035 * np.exp(-tp * 5) * np.sin(2 * np.pi * f * tp)

# simple feedback-delay "room"
d = int(0.28 * SR); wet = mix.copy()
for i in range(1, 4): wet[d * i:] += mix[:-d * i] * (0.35 ** i)
fade = np.minimum(1, np.minimum(t / 2.0, (dur - t) / 3.0))
y = wet * fade
y = y / np.max(np.abs(y)) * 0.32
pcm = (y * 32767).astype(np.int16)
st = np.stack([pcm, pcm], axis=1)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print("wrote", out)
