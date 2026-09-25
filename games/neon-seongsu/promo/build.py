#!/usr/bin/env python3
"""One command to rebuild the NEON SEONGSU promo.

  python3 promo/build.py                         every stage (skips Blender frames / captures that already exist)
  python3 promo/build.py --only capture,assemble re-capture gameplay and re-encode (after game changes)
  python3 promo/build.py --only render --shots C re-render one Blender shot
  python3 promo/build.py --force                 redo cached work (TTS, captures, frames)

Stages, in order:
  fonts     download fonts from google/fonts (raw.githubusercontent.com) into assets/fonts/
  tts       kokoro-onnx narration -> build/vo/*.wav + build/timeline.json (the master clock)
  music     numpy synthwave score + ducked mix with the VO -> build/audio/mix.wav
  render    Blender (bpy, Cycles CPU) shots A-D -> build/blender/<shot>/%05d.png
  capture   Playwright + window.NS gameplay capture -> build/gameplay/<scene>/%05d.png
  assemble  compositing, subtitles, encode -> out/neon-seongsu-promo.mp4, out/poster.png, out/subtitles.srt
"""
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
STAGES = ['fonts', 'tts', 'music', 'render', 'capture', 'assemble']


def sh(cmd):
    print('\n$', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True, cwd=HERE)


def main():
    a = sys.argv[1:]
    only = a[a.index('--only') + 1].split(',') if '--only' in a else STAGES
    shots = a[a.index('--shots') + 1].split(',') if '--shots' in a else ['A', 'B', 'C', 'D']
    force = '--force' in a
    bad = [s for s in only if s not in STAGES]
    if bad:
        raise SystemExit(f'unknown stage(s) {bad}; choose from {STAGES}')
    t0 = time.time()
    py = sys.executable
    for st in STAGES:
        if st not in only:
            continue
        ts = time.time()
        if st == 'fonts':
            from common import ensure_fonts
            ensure_fonts()
        elif st == 'tts':
            sh([py, 'tts.py'] + (['--force'] if force else []))
        elif st == 'music':
            sh([py, 'music.py'])
        elif st == 'render':
            for s in shots:
                sh([py, 'blender_shots.py', s] + (['--force'] if force else []))
        elif st == 'capture':
            sh(['node', 'capture.mjs'] + (['--force'] if force else []))
        elif st == 'assemble':
            sh([py, 'assemble.py'])
        print(f'[build] {st} done in {time.time() - ts:.0f}s', flush=True)
    print(f'[build] all done in {(time.time() - t0) / 60:.1f} min')


if __name__ == '__main__':
    main()
