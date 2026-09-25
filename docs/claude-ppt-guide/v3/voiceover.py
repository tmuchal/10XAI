"""English voiceover for the 30 s briefing (Kokoro TTS, offline). Writes L1..L5_am_puck.wav.
Model files: kokoro-v1.0.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0).
Usage: python3 voiceover.py <model_dir>"""
import sys, soundfile as sf
from kokoro_onnx import Kokoro
d = sys.argv[1].rstrip("/") + "/"
k = Kokoro(d + "kokoro-v1.0.onnx", d + "voices-v1.0.bin")
LINES = [
    ("Hey, I'm Uchu. Here's Q3, in thirty seconds.", 1.1),
    ("Six straight quarters of growth. Q3 hit forty-eight point two billion won, up eighteen percent.", 1.1),
    ("September was our best month, and week thirty-nine set a record. Online drove ninety-three percent of the growth.", 1.1),
    ("Next: an online-only launch in October, partner renewals in November. Q4 forecast: fifty-one billion, beating the annual target.", 1.12),
    ("So, one decision today: approve the one-point-two-billion-won prepayment.", 1.1),
]
for i, (text, speed) in enumerate(LINES, 1):
    s, sr = k.create(text, voice="am_puck", speed=speed, lang="en-us")
    sf.write(f"L{i}_am_puck.wav", s, sr); print(i, round(len(s) / sr, 2))
