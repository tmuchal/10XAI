"""Stage 7: assembly. Composes every segment on the narration timeline, burns in bilingual subtitles,
adds glitch transitions / bloom / grain / vignette / letterbox, muxes the audio mix and encodes the mp4.

  python3 assemble.py                 full encode -> out/neon-seongsu-promo.mp4, out/poster.png, out/subtitles.srt
  python3 assemble.py --stills 3,40.5 write single composited frames (seconds) to build/stills/ for checking
  python3 assemble.py --workers 3     number of compositor processes (default: CPU count)
"""
import math
import os
import random
import subprocess
import sys
import time
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import mograph as M
from common import BUILD, FPS, H, OUT, W, ffmpeg, load_timeline

TL = None
LETTERBOX = 132  # 2.39:1 bars during the Blender shots
OUT_MP4 = os.path.join(OUT, 'neon-seongsu-promo.mp4')


def tl():
    global TL
    if TL is None:
        TL = load_timeline()
    return TL


def seg_at(t):
    segs = tl()['segments']
    for s in segs:
        if s['start'] <= t < s['end']:
            return s
    return segs[-1] if t >= segs[-1]['start'] else segs[0]


# ------------------------------------------------------------------ frame sources

@lru_cache(maxsize=16)
def frame_list(kind, name):
    d = os.path.join(BUILD, 'blender' if kind == 'blender' else 'gameplay', name)
    if not os.path.isdir(d):
        return d, []
    return d, sorted(f for f in os.listdir(d) if f.endswith('.png'))


GRADE = {  # per-shot colour grade: channel gains + shadow lift (r, g, b)
    'A_aerial': ((1.0, 0.97, 1.08), (6, 3, 12)),
    'B_brick': ((1.08, 0.98, 0.9), (8, 4, 2)),
    'C_tower': ((1.04, 0.95, 1.08), (8, 2, 12)),
    'D_logo': ((1.0, 1.0, 1.0), (3, 2, 6)),
}


def bloom(img, thr=150, k1=0.55, k2=0.45):
    """Cheap two-scale bloom on a PIL RGB image."""
    small = img.resize((img.width // 4, img.height // 4), Image.BILINEAR)
    a = np.asarray(small).astype(np.int32)
    br = np.clip((a - thr) * 255 // (255 - thr), 0, 255).astype(np.uint8)
    b = Image.fromarray(br)
    b1 = np.asarray(b.filter(ImageFilter.GaussianBlur(3)).resize(img.size, Image.BILINEAR)).astype(np.float32)
    b2 = np.asarray(b.filter(ImageFilter.GaussianBlur(12)).resize(img.size, Image.BILINEAR)).astype(np.float32)
    return b1 * k1 + b2 * k2


def blender_frame(seg, lf):
    d, fs = frame_list('blender', seg['name'])
    if not fs:
        im = Image.new('RGB', (W, H), (10, 8, 16))
        ImageDraw.Draw(im).text((80, 80), f"[missing render {seg['name']}]", fill=(255, 80, 80), font=M.MONO(40))
        return im
    f = fs[min(lf, len(fs) - 1)]
    im = Image.open(os.path.join(d, f)).convert('RGB')
    gain, lift = GRADE.get(seg['name'], ((1, 1, 1), (0, 0, 0)))
    a = np.asarray(im).astype(np.float32)
    a = a * np.array(gain, np.float32) + np.array(lift, np.float32) * (1 - a / 255.0)
    a += bloom(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), thr=140 if seg['name'] != 'B_brick' else 170)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    return im


def gameplay_frame(seg, lf, t_local):
    d, fs = frame_list('gameplay', seg['name'])
    if not fs:
        d, fs = frame_list('gameplay', 'drive')
    if not fs:
        im = Image.new('RGB', (W, H), (10, 8, 16))
        ImageDraw.Draw(im).text((80, 80), f"[missing capture {seg['name']}]", fill=(255, 80, 80), font=M.MONO(40))
        return im
    im = Image.open(os.path.join(d, fs[min(lf, len(fs) - 1)])).convert('RGB')
    # slow push-in so the top-down footage breathes
    dur = seg['end'] - seg['start']
    z = 1.0 + 0.045 * (t_local / max(0.1, dur))
    if z > 1.001:
        cw, ch = W / z, H / z
        x0, y0 = (W - cw) / 2, (H - ch) / 2
        im = im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
    return im


def base_frame(t, letterbox=True):
    seg = seg_at(t)
    tl_ = t - seg['start']
    dur = seg['end'] - seg['start']
    lf = int(math.floor(tl_ * FPS + 1e-6))
    k = seg['kind']
    if k == 'blender':
        im = blender_frame(seg, lf).convert('RGBA')
        im = M.paste(im, M.rain_layer(t, 0.45 if seg['name'] != 'D_logo' else 0.3), (0, 0), anchor='lt')
        if seg['name'] == 'D_logo':
            # CTA after the voice-over has finished
            l13 = tl()['lines'][-1]
            a = M.ease_out((t - (l13['end'] + 0.6)) / 0.5)
            if a > 0:
                cta = M.cta_static()
                im = M.paste(im, cta, (W / 2, 906 + (1 - a) * 30), alpha=a)
        im = im.convert('RGB')
        if letterbox:
            d = ImageDraw.Draw(im)
            d.rectangle((0, 0, W, LETTERBOX), fill=(0, 0, 0))
            d.rectangle((0, H - LETTERBOX, W, H), fill=(0, 0, 0))
        return im, seg
    if k == 'gameplay':
        im = gameplay_frame(seg, lf, tl_).convert('RGBA')
        if seg.get('callout'):
            im = M.callout(im, seg['callout'], tl_, dur)
        elif seg['name'] in M.LOCATIONS:
            im = M.location_tag(im, seg['name'], tl_, dur)
        lab = M.footage_label()
        im = M.paste(im, lab, (W / 2, 34), alpha=0.85)
        return im.convert('RGB'), seg
    # mograph
    n = seg['name']
    if n.startswith('card_'):
        return M.card_frame(n, tl_, dur), seg
    if n == 'money':
        beats = [b - seg['start'] for b in seg['beats']]
        return M.money_frame(tl_, dur, beats), seg
    if n == 'year2077':
        return M.y2077_frame(tl_, dur), seg
    raise ValueError(n)


# ------------------------------------------------------------------ post effects

def glitch(a, s, seed):
    """RGB split + slice offsets + colour bars. a: HxWx3 uint8, s in 0..1."""
    r = random.Random(seed)
    out = a.copy()
    dx = int(10 + 36 * s)
    out[..., 0] = np.roll(a[..., 0], dx, axis=1)
    out[..., 2] = np.roll(a[..., 2], -dx, axis=1)
    for _ in range(int(4 + 10 * s)):
        y0 = r.randrange(0, H - 20)
        hh = r.randrange(8, int(20 + 90 * s))
        sh = r.randint(-int(160 * s) - 10, int(160 * s) + 10)
        out[y0:y0 + hh] = np.roll(out[y0:y0 + hh], sh, axis=1)
    for _ in range(int(2 + 4 * s)):
        y0 = r.randrange(0, H - 6)
        c = r.choice([(255, 46, 136), (41, 231, 255), (255, 255, 255)])
        x0 = r.randrange(0, W // 2)
        out[y0:y0 + r.randrange(2, 7), x0:x0 + r.randrange(200, W // 2)] = c
    return out


@lru_cache(maxsize=1)
def vignette():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    return np.clip(1.0 - 0.38 * np.clip(d - 0.55, 0, None) ** 1.6, 0, 1)[..., None]


@lru_cache(maxsize=1)
def grains():
    rng = np.random.default_rng(7)
    g = []
    for _ in range(8):
        n = rng.normal(0, 5.0, (H // 2, W // 2)).astype(np.float32)
        g.append(np.repeat(np.repeat(n, 2, 0), 2, 1)[..., None])
    return g


@lru_cache(maxsize=32)
def subtitle_img(n):
    ln = tl()['lines'][n - 1]
    fe, fk = M.PSL(42), M.PR(34)
    maxw = 1560
    words = ln['en'].split()
    rows, cur = [], ''
    for w_ in words:
        cand = (cur + ' ' + w_).strip()
        if M.text_size(fe, cand)[0] > maxw and cur:
            rows.append(cur)
            cur = w_
        else:
            cur = cand
    rows.append(cur)
    ko_rows = [ln['ko']]
    if M.text_size(fk, ln['ko'])[0] > maxw:
        parts = ln['ko'].split(' ')
        h_ = len(parts) // 2
        ko_rows = [' '.join(parts[:h_]), ' '.join(parts[h_:])]
    lh_e, lh_k = 54, 46
    bw = max([M.text_size(fe, r)[0] for r in rows] + [M.text_size(fk, r)[0] for r in ko_rows]) + 72
    bh = len(rows) * lh_e + len(ko_rows) * lh_k + 34
    pad = 24
    im = Image.new('RGBA', (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
    box = Image.new('RGBA', im.size, (0, 0, 0, 0))
    ImageDraw.Draw(box).rounded_rectangle((pad, pad, pad + bw, pad + bh), 14, fill=(4, 4, 10, 168))
    im = Image.alpha_composite(im, box.filter(ImageFilter.GaussianBlur(7)))
    d = ImageDraw.Draw(im)
    y = pad + 14
    for r in rows:
        d.text((im.width / 2 + 2, y + 2), r, font=fe, fill=(0, 0, 0, 200), anchor='mt')
        d.text((im.width / 2, y), r, font=fe, fill=(255, 255, 255, 255), anchor='mt')
        y += lh_e
    y += 4
    for r in ko_rows:
        d.text((im.width / 2 + 2, y + 2), r, font=fk, fill=(0, 0, 0, 200), anchor='mt')
        d.text((im.width / 2, y), r, font=fk, fill=(208, 206, 222, 255), anchor='mt')
        y += lh_k
    return im


def subtitle_alpha(ln, t):
    a = M.clamp01((t - (ln['start'] - 0.12)) / 0.2)
    b = M.clamp01(((ln['end'] + 0.4) - t) / 0.25)
    return min(a, b)


def cut_times():
    segs = tl()['segments']
    return [(s['start'], s['name']) for s in segs[1:]]


def render(i, subtitles=True, post=True, letterbox=True):
    t = i / FPS
    im, seg = base_frame(t, letterbox)
    a = np.asarray(im).copy()
    # transitions
    for tc, name in cut_times():
        dt = t - tc
        if name == 'D_logo':
            # dip to black into the logo shot
            if -0.3 < dt < 0.35:
                k = M.clamp01(abs(dt) / (0.3 if dt < 0 else 0.35))
                a = (a.astype(np.float32) * k).astype(np.uint8)
            continue
        if abs(dt) < 4.5 / FPS:
            s = 1 - abs(dt) / (4.5 / FPS)
            a = glitch(a, s, i)
            if abs(dt) < 1 / FPS:
                a = np.clip(a.astype(np.int16) + 40, 0, 255).astype(np.uint8)
    if subtitles:
        pil = Image.fromarray(a).convert('RGBA')
        for ln in tl()['lines']:
            al = subtitle_alpha(ln, t)
            if al > 0:
                s_im = subtitle_img(ln['n'])
                # the in-game phone sits bottom-right in the 'phone' scene: keep the subtitle clear of it
                cx = W / 2 - 200 if seg['name'] == 'phone' else W / 2
                pil = M.paste(pil, s_im, (cx, H - 44 - s_im.height / 2), alpha=al)
        a = np.asarray(pil.convert('RGB'))
    if post:
        f = a.astype(np.float32) * vignette() + grains()[i % 8]
        # global fades
        total = tl()['total']
        k = min(M.clamp01(t / 1.0), M.clamp01((total - t) / 1.4))
        a = np.clip(f * k, 0, 255).astype(np.uint8)
    return a


def worker(i):
    return render(i).tobytes()


def write_srt():
    def ts(x):
        ms = int(round(x * 1000))
        return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
    rows = []
    for ln in tl()['lines']:
        rows.append(f"{ln['n']}\n{ts(ln['start'] - 0.1)} --> {ts(ln['end'] + 0.4)}\n{ln['en']}\n{ln['ko']}\n")
    with open(os.path.join(OUT, 'subtitles.srt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(rows))


def poster():
    d = [s for s in tl()['segments'] if s['name'] == 'D_logo'][0]
    t = min(d['end'] - 0.1, tl()['hit'] + 2.6)
    a = render(int(t * FPS), subtitles=False, letterbox=False)
    Image.fromarray(a).resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, 'poster.png'))


def encode(workers):
    os.makedirs(OUT, exist_ok=True)
    n = tl()['frames']
    audio = os.path.join(BUILD, 'audio', 'mix.wav')
    tmp = OUT_MP4 + '.part.mp4'
    cmd = [ffmpeg(), '-y', '-loglevel', 'error', '-stats',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-i', audio,
           '-map', '0:v', '-map', '1:a',
           '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '3300k', '-bufsize', '6600k',
           '-pix_fmt', 'yuv420p', '-profile:v', 'high',
           '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
           '-movflags', '+faststart', '-shortest', tmp]
    print('encoding', n, 'frames with', workers, 'workers')
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    with Pool(workers) as pool:
        for k, buf in enumerate(pool.imap(worker, range(n), chunksize=4)):
            p.stdin.write(buf)
            if k % 150 == 0:
                el = time.time() - t0
                print(f'  frame {k}/{n}  {el / (k + 1):.2f}s/fr  eta {(n - k) * el / (k + 1) / 60:.1f} min', flush=True)
    p.stdin.close()
    if p.wait() != 0:
        raise SystemExit('ffmpeg failed')
    os.replace(tmp, OUT_MP4)
    print('wrote', OUT_MP4, f'{os.path.getsize(OUT_MP4) / 1e6:.1f} MB')


def main():
    args = sys.argv[1:]
    os.makedirs(OUT, exist_ok=True)
    if '--stills' in args:
        ts = [float(x) for x in args[args.index('--stills') + 1].split(',')]
        d = os.path.join(BUILD, 'stills')
        os.makedirs(d, exist_ok=True)
        for t in ts:
            Image.fromarray(render(int(round(t * FPS)))).save(os.path.join(d, f'{t:06.2f}.png'))
            print('still', t)
        return
    workers = int(args[args.index('--workers') + 1]) if '--workers' in args else os.cpu_count()
    write_srt()
    poster()
    encode(workers)


if __name__ == '__main__':
    main()
