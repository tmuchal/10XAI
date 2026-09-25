"""Stage 1: narration. Synthesizes the 13 lines with kokoro-onnx and builds build/timeline.json.

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


def build_timeline(durs):
    t = 0.0
    lines = []
    for i, (ln, (d, spans)) in enumerate(zip(LINES, durs)):
        t += GAP_BEFORE[i]
        lines.append(dict(n=i + 1, en=ln['en'], ko=ln['ko'], start=round(t, 3), end=round(t + d, 3),
                          parts=[[round(t + a, 3), round(t + b, 3)] for a, b in spans],
                          wav=os.path.join(VO_DIR, f'{i + 1:02d}.wav')))
        t += d
    total = t + TAIL
    L = {l['n']: l for l in lines}
    s = lambda n: L[n]['start']
    e = lambda n: L[n]['end']

    segs = []

    def add(kind, name, t0, t1, **kw):
        segs.append(dict(kind=kind, name=name, start=round(t0, 3), end=round(t1, 3), **kw))

    P = lambda n, k: L[n]['parts'][k]
    add('blender', 'A_aerial', 0.0, s(2) - 0.35)
    add('blender', 'B_brick', s(2) - 0.35, s(3) - 0.25)
    add('mograph', 'money', s(3) - 0.25, s(4) - 0.4, beats=[p[0] for p in L[3]['parts']])
    add('mograph', 'year2077', s(4) - 0.4, P(4, 1)[0] - 0.25)
    add('blender', 'C_tower', P(4, 1)[0] - 0.25, s(6) - 0.3)
    add('mograph', 'card_seojin', s(6) - 0.3, s(7) - 0.3)
    mid = e(7) + 0.15
    q = (s(8) - 0.3 - mid) / 2
    add('mograph', 'card_taeo', s(7) - 0.3, mid)
    add('mograph', 'card_mira', mid, mid + q)
    add('mograph', 'card_cha', mid + q, s(8) - 0.3)
    add('gameplay', 'switch', s(8) - 0.3, s(9) - 0.25, line=8)
    cuts = [s(9) - 0.25, P(9, 1)[0] - 0.25, P(9, 2)[0] - 0.25, s(10) - 0.25]
    add('gameplay', 'drive', cuts[0], cuts[1], line=9, callout='car')
    rob_at = cuts[1] + (cuts[2] - cuts[1]) * 0.62
    add('gameplay', 'chase', cuts[1], rob_at, line=9, callout='stars')
    add('gameplay', 'combat', rob_at, cuts[2], line=9)
    add('gameplay', 'drones', cuts[2], cuts[3], line=9, callout='emp')
    m10 = (s(10) + e(10)) / 2 + 0.3
    add('gameplay', 'forest', s(10) - 0.25, m10, line=10)
    add('gameplay', 'race', m10, s(11) - 0.25, line=10)
    add('gameplay', 'phone', s(11) - 0.25, s(12) - 0.25, line=11)
    add('gameplay', 'heist', s(12) - 0.25, e(12) + 0.6, line=12)
    add('blender', 'D_logo', e(12) + 0.6, total)
    for sg in segs:
        sg['frames'] = int(round((sg['end'] - sg['start']) * FPS))
    # logo lights on 1.6s into the logo shot: the music hit lands there
    hit = segs[-1]['start'] + 1.6
    tl = dict(fps=FPS, total=round(total, 3), frames=int(round(total * FPS)), voice=VOICE, speed=SPEED,
              lines=lines, segments=segs, hit=round(hit, 3))
    json.dump(tl, open(TIMELINE, 'w'), indent=1, ensure_ascii=False)
    print(f'timeline: {total:.2f}s, {len(segs)} segments, hit at {hit:.2f}s')
    for sg in segs:
        print(f"  {sg['kind']:8s} {sg['name']:12s} {sg['start']:6.2f}-{sg['end']:6.2f}  {sg['frames']} fr")
    return tl


def main(force=False):
    build_timeline(synth(force))


if __name__ == '__main__':
    main('--force' in sys.argv)
