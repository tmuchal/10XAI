"""Stage 1: narration. Synthesizes the 9 Dead Rain lines with kokoro-onnx and builds build/timeline.json.

The timeline is the master clock: every other stage reads line times and segment windows from it.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

from common import (BUILD, FPS, GAP_BEFORE, LINES, MODELS, TAIL, TIMELINE, ensure_models)

VOICE = os.environ.get('NS_VOICE', 'am_michael')
SPEED = float(os.environ.get('NS_SPEED', '0.9'))
SR = 24000
VO_DIR = os.path.join(BUILD, 'vo')


def trim(x, thr=0.004, pad=0.06):
    a = np.abs(x)
    idx = np.where(a > thr)[0]
    if len(idx) == 0:
        return x
    s = max(0, idx[0] - int(pad * SR))
    e = min(len(x), idx[-1] + int(pad * SR))
    y = x[s:e].copy()
    f = int(0.01 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def synth(force=False):
    """Returns per line (duration, [(part_start, part_end), ...]) relative to the line start."""
    os.makedirs(VO_DIR, exist_ok=True)
    ensure_models()
    kok = None
    info = []
    for i, ln in enumerate(LINES):
        path = os.path.join(VO_DIR, f'{i + 1:02d}.wav')
        meta = os.path.join(VO_DIR, f'{i + 1:02d}.json')
        parts = ln.get('parts') or [ln.get('tts', ln['en'])]
        key = dict(parts=parts, gap=ln.get('part_gap', 0), voice=VOICE, speed=SPEED)
        m = json.load(open(meta)) if os.path.exists(meta) else {}
        if not force and os.path.exists(path) and m.get('key') == key:
            x, _ = sf.read(path)
            spans = m['spans']
        else:
            if kok is None:
                from kokoro_onnx import Kokoro
                kok = Kokoro(os.path.join(MODELS, 'kokoro-v1.0.onnx'), os.path.join(MODELS, 'voices-v1.0.bin'))
            chunks, spans, t = [], [], 0.0
            for j, txt in enumerate(parts):
                y, sr = kok.create(txt, voice=VOICE, speed=SPEED, lang='en-us', sentence_pause=0.38)
                assert sr == SR
                y = trim(np.asarray(y, dtype=np.float32))
                if j:
                    g = np.zeros(int(key['gap'] * SR), np.float32)
                    chunks.append(g)
                    t += len(g) / SR
                chunks.append(y)
                spans.append([round(t, 3), round(t + len(y) / SR, 3)])
                t += len(y) / SR
            x = np.concatenate(chunks)
            x = x / max(1e-6, np.max(np.abs(x))) * 0.89
            sf.write(path, x, SR)
            json.dump(dict(key=key, spans=spans), open(meta, 'w'))
        info.append((len(x) / SR, spans))
        print(f'line {i + 1:2d}: {info[-1][0]:5.2f}s  {ln["en"]}')
    return info


from timeline import build_timeline  # noqa: E402


def main(force=False):
    build_timeline(synth(force))


if __name__ == '__main__':
    main('--force' in sys.argv)
