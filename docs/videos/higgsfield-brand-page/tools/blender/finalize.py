"""Post-process the rendered shots and write film/assets/3d/manifest.json.
  * flythrough: PNG master (/tmp/blender-shots/flythrough) -> high-quality JPG (opaque).
  * RGBA shots: re-save PNGs with optimize=True (lossless) in place.
Run with the venv python (needs Pillow):  /tmp/bpyenv/bin/python tools/blender/finalize.py
"""
import json, os
from PIL import Image

FILM = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'film'))
OUT = os.path.join(FILM, 'assets', '3d')

SHOTS = [
    # name, start (film s), alpha, ext, placement suggestion in the 1920x1080 stage, note
    dict(name='flythrough', start=0.0, alpha=False, ext='jpg', x=0, y=0, w=1920, h=1080,
         note='t=0-2.4 opener: through the red curtains to Noa waving; last frame frames the proscenium for a crossfade'),
    dict(name='photobooth', start=86.5, alpha=True, ext='png', x=1120, y=170, w=740, h=740,
         note='Soul ID beat: booth pops in, 3 flashes, photo strip chugs out'),
    dict(name='coinfunnel', start=163.0, alpha=True, ext='png', x=590, y=140, w=740, h=740,
         note='Revenue: coins whirl down the funnel, bounce into a pile, hero coin leaps at camera'),
    dict(name='curtaincall', start=187.0, alpha=True, ext='png', x=0, y=0, w=1920, h=1080,
         note='Curtain call: ta-da, rippling bow, Noa tips shades + winks, confetti (transparent bg)'),
]


def main():
    manifest = []
    for s in SHOTS:
        d = os.path.join(OUT, s['name'])
        os.makedirs(d, exist_ok=True)
        if s['name'] == 'flythrough':
            src = '/tmp/blender-shots/flythrough'
            if os.path.isdir(src):
                for f in sorted(os.listdir(src)):
                    if f.endswith('.png'):
                        Image.open(os.path.join(src, f)).convert('RGB').save(
                            os.path.join(d, f[:-4] + '.jpg'), quality=90, subsampling=0, optimize=True)
        else:
            for f in sorted(os.listdir(d)):
                if f.endswith('.png'):
                    p = os.path.join(d, f); im = Image.open(p); im.load(); im.save(p, optimize=True)
        files = sorted(f for f in os.listdir(d) if f.endswith('.' + s['ext']))
        if not files:
            print('missing', s['name']); continue
        w, h = Image.open(os.path.join(d, files[0])).size
        size = sum(os.path.getsize(os.path.join(d, f)) for f in files)
        manifest.append(dict(name=s['name'], start=s['start'], frames=len(files), fps=30, alpha=s['alpha'],
                             ext=s['ext'], x=s['x'], y=s['y'], w=s['w'], h=s['h'], src_w=w, src_h=h,
                             duration=round(len(files) / 30, 3), note=s['note']))
        print('%-12s %3d frames  %4dx%-4d  %.1f MB' % (s['name'], len(files), w, h, size / 1e6))
    with open(os.path.join(OUT, 'manifest.json'), 'w') as fh:
        json.dump(manifest, fh, indent=2)
    print('wrote', os.path.join(OUT, 'manifest.json'))


if __name__ == '__main__':
    main()
