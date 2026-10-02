"""Assembly: composes every segment on the narration timeline (2D logo cards + 1280x720 gameplay captures
upscaled to 1080p), burns in bilingual subtitles, adds glitch cuts / letterbox / grade / grain, muxes the
audio mix and encodes out/dead-rain-trailer.mp4 with a two-pass bitrate so it stays under the size cap.

  python3 assemble.py                  full render + encode -> out/dead-rain-trailer.mp4, poster.jpg, subtitles.srt
  python3 assemble.py --stills 3,40.5  single composited frames (seconds) -> build/stills/ for checking
  python3 assemble.py --encode-only    re-run only the two-pass encode from build/master.mkv
  python3 assemble.py --workers 3
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
LETTERBOX = 138  # 2.39:1 bars on beauty shots
OUT_MP4 = os.path.join(OUT, 'dead-rain-trailer.mp4')
MASTER = os.path.join(BUILD, 'master.mkv')
MAX_MB = 27.0      # hard cap is 28 MB; keep a margin
AUDIO_KBPS = 160


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


def seg_named(n):
    return [s for s in tl()['segments'] if s['name'] == n][0]


@lru_cache(maxsize=32)
def frame_list(name):
    d = os.path.join(BUILD, 'gameplay', name)
    if not os.path.isdir(d):
        return d, []
    return d, sorted(f for f in os.listdir(d) if f.endswith('.jpg'))


def grade(img, hud):
    """Upscale 1280x720 -> 1080p, light teal/magenta grade, extra soft bloom on beauty shots."""
    im = img.resize((W, H), Image.BICUBIC)
    a = np.asarray(im).astype(np.float32)
    lum = a.mean(axis=2, keepdims=True) / 255.0
    shadow = (1 - lum) ** 2
    a = a * np.array([1.03, 0.98, 1.06], np.float32) + shadow * np.array([2, 4, 10], np.float32)
    a = (a - 128) * 1.06 + 128
    if not hud:
        small = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR)
        s = np.asarray(small).astype(np.int32)
        br = Image.fromarray(np.clip((s - 150) * 255 // 105, 0, 255).astype(np.uint8))
        a += np.asarray(br.filter(ImageFilter.GaussianBlur(10)).resize((W, H), Image.BILINEAR)).astype(np.float32) * 0.35
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def gameplay_frame(seg, lf, t_local):
    d, fs = frame_list(seg['name'])
    if not fs:
        im = Image.new('RGB', (W, H), (10, 8, 16))
        ImageDraw.Draw(im).text((80, 80), f"[missing capture {seg['name']}]", fill=(255, 80, 80), font=M.MONO(40))
        return im
    src = Image.open(os.path.join(d, fs[min(lf, len(fs) - 1)])).convert('RGB')
    beauty = bool(seg.get('letterbox'))
    im = grade(src, hud=not beauty)
    if beauty:
        # slow push-in on HUD-off beauty shots
        dur = seg['end'] - seg['start']
        z = 1.0 + 0.05 * (t_local / max(0.1, dur))
        cw, ch = W / z, H / z
        x0, y0 = (W - cw) / 2, (H - ch) / 2
        im = im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
    return im


@lru_cache(maxsize=2)
def logo_backdrop(kind):
    """Dark, blurred city plate behind the logo, from the first/last frame of a beauty shot."""
    name, idx = ('S01_title', 0) if kind == 'logo_open' else ('S14_tower', -1)
    d, fs = frame_list(name)
    if not fs:
        return np.zeros((H, W, 3), np.float32)
    im = Image.open(os.path.join(d, fs[idx])).convert('RGB').resize((W, H), Image.BICUBIC)
    im = im.filter(ImageFilter.GaussianBlur(9))
    return np.asarray(im).astype(np.float32) * 0.32


def logo_bg(seg, t_local, t):
    a = logo_backdrop(seg['name'])
    k = M.clamp01(t_local / 1.0) if seg['name'] == 'logo_open' else 1.0
    im = Image.fromarray(np.clip(a * (0.35 + 0.65 * k), 0, 255).astype(np.uint8)).convert('RGBA')
    return M.paste(im, M.rain_layer(t, 0.5), (0, 0), anchor='lt')


def base_frame(t):
    seg = seg_at(t)
    tl_ = t - seg['start']
    dur = seg['end'] - seg['start']
    lf = int(math.floor(tl_ * FPS + 1e-6))
    if seg['kind'] == 'logo':
        bg = logo_bg(seg, tl_, t)
        if seg['name'] == 'logo_open':
            im = M.logo_frame(bg, tl_, 1.25)
        else:
            l9 = tl()['lines'][-1]
            im = M.logo_frame(bg, tl_, tl()['hit'] - seg['start'], cta_at=l9['end'] + 0.5 - seg['start'])
        return im.convert('RGB'), seg
    im = gameplay_frame(seg, lf, tl_).convert('RGBA')
    if seg.get('callout'):
        im = M.callout(im, seg['callout'], tl_, dur)
    lab = M.footage_label()
    y = LETTERBOX / 2 if seg.get('letterbox') else 34
    im = M.paste(im, lab, (W / 2, y), alpha=0.9)
    im = im.convert('RGB')
    if seg.get('letterbox'):
        d = ImageDraw.Draw(im)
        # the bars ease in over the first 0.25 s of the shot
        b = int(LETTERBOX * M.ease_out(tl_ / 0.25)) if seg['start'] > 7.5 else LETTERBOX
        d.rectangle((0, 0, W, b), fill=(0, 0, 0))
        d.rectangle((0, H - b, W, H), fill=(0, 0, 0))
        lab_im = M.footage_label()
        pil = M.paste(im.convert('RGBA'), lab_im, (W / 2, b / 2), alpha=0.9)
        im = pil.convert('RGB')
    return im, seg


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
    for _ in range(4):
        n = rng.normal(0, 2.6, (H // 3, W // 3)).astype(np.float32)
        g.append(np.repeat(np.repeat(n, 3, 0), 3, 1)[..., None])
    return g


@lru_cache(maxsize=32)
def subtitle_img(n):
    ln = tl()['lines'][n - 1]
    fe, fk = M.PSL(42), M.PR(34)
    maxw = 1200
    words = ln['en'].split()

    def wrap(limit):
        rows, cur = [], ''
        for w_ in words:
            cand = (cur + ' ' + w_).strip()
            if M.text_size(fe, cand)[0] > limit and cur:
                rows.append(cur)
                cur = w_
            else:
                cur = cand
        rows.append(cur)
        return rows
    rows = wrap(maxw)
    if len(rows) == 2:  # balance the two rows so no single word dangles
        best = min(range(1, len(words)), key=lambda k: max(M.text_size(fe, ' '.join(words[:k]))[0],
                                                           M.text_size(fe, ' '.join(words[k:]))[0]))
        rows = [' '.join(words[:best]), ' '.join(words[best:])]
    ko_rows = [ln['ko']]
    if M.text_size(fk, ln['ko'])[0] > maxw + 60:
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
    return [(s['start'], s['name']) for s in tl()['segments'][1:]]


def render(i, subtitles=True, post=True):
    t = i / FPS
    im, seg = base_frame(t)
    a = np.asarray(im).copy()
    for tc, name in cut_times():
        dt = t - tc
        if name == 'logo_close':
            # dip to black into the closing logo
            if -0.3 < dt < 0.3:
                k = M.clamp01(abs(dt) / 0.3)
                a = (a.astype(np.float32) * k).astype(np.uint8)
            continue
        if abs(dt) < 4.5 / FPS:
            s = 1 - abs(dt) / (4.5 / FPS)
            a = glitch(a, s, i)
            if abs(dt) < 1 / FPS:
                a = np.clip(a.astype(np.int16) + 40, 0, 255).astype(np.uint8)
    # logo slams: a short glitch burst + flash
    for hit in (1.25, tl()['hit']):
        dt = t - hit
        if 0 <= dt < 0.2:
            a = glitch(a, 1 - dt / 0.2, i + 99)
            if dt < 2 / FPS:
                a = np.clip(a.astype(np.int16) + 70, 0, 255).astype(np.uint8)
    if subtitles:
        pil = Image.fromarray(a).convert('RGBA')
        for ln in tl()['lines']:
            al = subtitle_alpha(ln, t)
            if al > 0:
                s_im = subtitle_img(ln['n'])
                pil = M.paste(pil, s_im, (W / 2, H - 30 - s_im.height / 2), alpha=al)
        a = np.asarray(pil.convert('RGB'))
    if post:
        f = a.astype(np.float32) * vignette() + grains()[(i // 2) % 4]
        total = tl()['total']
        k = min(M.clamp01(t / 0.6), M.clamp01((total - t) / 1.4))
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
    t = tl()['hit'] + 2.6
    a = render(int(t * FPS), subtitles=False)
    Image.fromarray(a).save(os.path.join(OUT, 'poster.jpg'), quality=90)


def render_master(workers):
    """Every composited frame -> a near-lossless intermediate (so the two-pass encode can read it twice)."""
    n = tl()['frames']
    audio = os.path.join(BUILD, 'audio', 'mix.wav')
    tmp = MASTER + '.part.mkv'
    cmd = [ffmpeg(), '-y', '-loglevel', 'error',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', audio,
           '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10',
           '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le', '-shortest', tmp]
    print('rendering', n, 'frames with', workers, 'workers')
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
    os.replace(tmp, MASTER)


def encode():
    """Two-pass H.264 at the bitrate that fits MAX_MB, AAC audio, +faststart."""
    dur = tl()['total']
    vk = int(MAX_MB * 8e3 / dur - AUDIO_KBPS - 40)
    print(f'two-pass encode at {vk} kb/s video')
    log = os.path.join(BUILD, 'x264pass')
    common = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-maxrate', f'{int(vk * 1.6)}k',
              '-bufsize', f'{vk * 3}k', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', str(FPS),
              '-x264-params', 'aq-mode=3', '-passlogfile', log]
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', MASTER] + common +
                   ['-pass', '1', '-an', '-f', 'mp4', os.devnull], check=True)
    tmp = OUT_MP4 + '.part.mp4'
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', MASTER] + common +
                   ['-pass', '2', '-c:a', 'aac', '-b:a', f'{AUDIO_KBPS}k', '-ar', '48000',
                    '-movflags', '+faststart', tmp], check=True)
    os.replace(tmp, OUT_MP4)
    mb = os.path.getsize(OUT_MP4) / 1e6
    print('wrote', OUT_MP4, f'{mb:.1f} MB')
    if mb >= 28:
        raise SystemExit('output over 28 MB, lower MAX_MB')


def main():
    args = sys.argv[1:]
    os.makedirs(OUT, exist_ok=True)
    if '--stills' in args:
        ts = [float(x) for x in args[args.index('--stills') + 1].split(',')]
        d = os.path.join(BUILD, 'stills')
        os.makedirs(d, exist_ok=True)
        for t in ts:
            Image.fromarray(render(int(round(t * FPS)))).save(os.path.join(d, f'{t:06.2f}.jpg'), quality=90)
            print('still', t)
        return
    workers = int(args[args.index('--workers') + 1]) if '--workers' in args else os.cpu_count()
    write_srt()
    if '--encode-only' not in args:
        poster()
        render_master(workers)
    encode()


if __name__ == '__main__':
    main()
