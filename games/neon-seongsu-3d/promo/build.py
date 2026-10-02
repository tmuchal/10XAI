#!/usr/bin/env python3
"""One command to rebuild the NEON SEONGSU: DEAD RAIN trailer.

  python3 promo/build.py                          every stage (skips gameplay shots already captured)
  python3 promo/build.py --only snapshot,capture  re-snapshot the game and re-capture (after game changes)
  python3 promo/build.py --only assemble          re-composite and re-encode only
  python3 promo/build.py --force                  redo cached work (TTS, captures)

Stages, in order:
  snapshot  copy ../index.html, ../js, ../vendor -> build/game/ (the frozen copy that gets captured)
  assets    fonts + Kokoro models (hard-linked from ../../neon-seongsu/promo when present, else downloaded)
  tts       kokoro-onnx narration (am_michael, 0.9) -> build/vo/*.wav + build/timeline.json (master clock)
  music     numpy dark synth score + ducked VO mix -> build/audio/mix.wav
  capture   Playwright + SwiftShader + window.NS3 -> build/gameplay/<shot>/%05d.jpg (1280x720, 3 workers)
  assemble  compositing, logo cards, subtitles, two-pass encode -> out/dead-rain-trailer.mp4, poster.jpg, subtitles.srt
"""
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
STAGES = ['snapshot', 'assets', 'tts', 'music', 'capture', 'assemble']


def sh(cmd):
    print('\n$', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True, cwd=HERE)


def snapshot():
    from common import GAME_SRC, SNAP
    if os.path.isdir(SNAP):
        shutil.rmtree(SNAP)
    os.makedirs(SNAP)
    shutil.copy(os.path.join(GAME_SRC, 'index.html'), SNAP)
    for d in ('js', 'vendor'):
        shutil.copytree(os.path.join(GAME_SRC, d), os.path.join(SNAP, d))
    print('snapshot ->', SNAP)


def main():
    a = sys.argv[1:]
    only = a[a.index('--only') + 1].split(',') if '--only' in a else STAGES
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
        if st == 'snapshot':
            snapshot()
        elif st == 'assets':
            from common import ensure_fonts, ensure_models
            ensure_fonts()
            ensure_models()
        elif st == 'tts':
            sh([py, 'tts.py'] + (['--force'] if force else []))
        elif st == 'music':
            sh([py, 'music.py'])
        elif st == 'capture':
            sh(['node', 'capture.mjs'] + (['--force'] if force else []))
        elif st == 'assemble':
            sh([py, 'assemble.py'])
        print(f'[build] {st} done in {time.time() - ts:.0f}s', flush=True)
    print(f'[build] all done in {(time.time() - t0) / 60:.1f} min')


if __name__ == '__main__':
    main()
