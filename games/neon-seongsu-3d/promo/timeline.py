"""The master clock. Turns VO line durations into line times and the shot list (build/timeline.json).

Every gameplay shot names the NS3 scene it is captured from; capture.mjs holds the per-shot camera moves.
"""
import json
import os

from common import FPS, GAP_BEFORE, LINES, TAIL, TIMELINE, BUILD

VO_DIR = os.path.join(BUILD, 'vo')
MARGIN = 6  # extra captured frames per shot so the assembler never runs out


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
    P = lambda n, k: L[n]['parts'][k][0]

    segs = []

    def add(kind, name, t1, **kw):
        t0 = segs[-1]['end'] if segs else 0.0
        segs.append(dict(kind=kind, name=name, start=round(t0, 3), end=round(t1, 3), **kw))

    # shot list: (kind, shot id, end time, extras). Gameplay shots carry the NS3 scene name.
    add('logo', 'logo_open', s(1) - 0.7)
    add('gameplay', 'S01_title', s(2) - 0.35, scene='title', letterbox=True)
    add('gameplay', 'S02_omni', e(2) + 0.25, scene='omni', letterbox=True)
    add('gameplay', 'S03_horde', P(3, 1) - 0.25, scene='horde')
    add('gameplay', 'S04_raiders', s(4) - 0.3, scene='raiders')
    add('gameplay', 'S05_street', e(4) + 0.5, scene='street')
    add('gameplay', 'S06_lineup', s(5) - 0.3, scene='lineup', letterbox=True)
    add('gameplay', 'S07_fixer', s(6) - 0.3, scene='shelter', callout='fixer')
    add('gameplay', 'S08_drive', s(7) - 0.3, scene='drive', callout='car')
    add('gameplay', 'S09_build', P(7, 1) - 0.25, scene='build', callout='build', sub_lift=0)
    add('gameplay', 'S10_wave', e(7) + 0.7, scene='wave')
    add('gameplay', 'S11_drive2', s(8) - 0.3, scene='drive', letterbox=True)
    add('gameplay', 'S12_viaduct', P(8, 1) - 0.2, scene='horde', letterbox=True)
    add('gameplay', 'S13_forest', P(8, 2) - 0.2, scene='forest')
    add('gameplay', 'S14_tower', e(8) + 0.6, scene='omni', letterbox=True)
    add('gameplay', 'S15_wave2', s(9) - 0.35, scene='wave')
    add('logo', 'logo_close', total)
    for sg in segs:
        sg['frames'] = int(round((sg['end'] - sg['start']) * FPS))
        if sg['kind'] == 'gameplay':
            sg['capture'] = sg['frames'] + MARGIN
    hit = s(9) + 0.05  # logo slam lands as the VO says the title
    tl = dict(fps=FPS, total=round(total, 3), frames=int(round(total * FPS)), lines=lines, segments=segs,
              hit=round(hit, 3))
    json.dump(tl, open(TIMELINE, 'w'), indent=1, ensure_ascii=False)
    gp = sum(sg.get('capture', 0) for sg in segs)
    print(f'timeline: {total:.2f}s, {len(segs)} segments, {gp} gameplay frames to capture, hit at {hit:.2f}s')
    for sg in segs:
        print(f"  {sg['kind']:8s} {sg['name']:13s} {sg.get('scene', ''):8s} {sg['start']:6.2f}-{sg['end']:6.2f}  {sg['frames']} fr")
    return tl
