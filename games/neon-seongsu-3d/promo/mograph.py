"""Motion graphics for the DEAD RAIN trailer, drawn with Pillow + numpy.

Pure functions of (segment-local time, duration) -> RGBA 1920x1080 layers, so any frame can be rendered
in any worker process: the 2D logo card (open + close), kinetic callouts, labels, CTA, subtitles.
"""
import math
import os
import random
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from common import AMBER, BLOOD, CYAN, H, INK, MAG, TOXIC, W, font

WHITE = (255, 255, 255)


# ------------------------------------------------------------------ small helpers

@lru_cache(maxsize=64)
def F(name, size):
    return ImageFont.truetype(font(name), size)


def BH(size):
    return F('BlackHanSans-Regular.ttf', size)


def PS(size):
    return F('IBMPlexSansKR-SemiBold.ttf', size)


@lru_cache(maxsize=16)
def PSL(size):
    """IBM Plex Sans (Latin, variable) at SemiBold: has accented glyphs (é) that the KR cut lacks."""
    f = ImageFont.truetype(font('IBMPlexSans-Var.ttf'), size)
    try:
        f.set_variation_by_name('SemiBold')
    except Exception:
        pass
    return f


def PR(size):
    return F('IBMPlexSansKR-Regular.ttf', size)


def MONO(size):
    return F('IBMPlexMono-SemiBold.ttf', size)


def clamp01(x):
    return max(0.0, min(1.0, x))


def ease_out(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_io(x):
    x = clamp01(x)
    return 0.5 - 0.5 * math.cos(math.pi * x)


def back_out(x, s=1.7):
    x = clamp01(x)
    x -= 1
    return x * x * ((s + 1) * x + s) + 1


def tint(c, k):
    return tuple(int(max(0, min(255, v * k))) for v in c)


def has_hangul(s):
    return any('\uac00' <= ch <= '\ud7a3' or '\u3131' <= ch <= '\u318e' for ch in s)


_DUMMY = ImageDraw.Draw(Image.new('L', (4, 4)))


def text_size(fnt, s):
    b = _DUMMY.multiline_textbbox((0, 0), s, font=fnt, spacing=int(fnt.size * 0.25))
    return b[2] - b[0], b[3] - b[1], b


def text_layer(s, fnt, fill, pad=40, shadow=None, stroke=0, stroke_fill=None):
    """RGBA image tightly around the (multi-line) text plus pad. shadow=(dx,dy,color) draws the GTA-style hard
    offset. Mono (Latin-only) fonts fall back to IBM Plex Sans KR when the string has Hangul."""
    if has_hangul(s) and 'Mono' in os.path.basename(fnt.path):
        fnt = PS(fnt.size)
    w, h, b = text_size(fnt, s)
    sx, sy = (abs(shadow[0]), abs(shadow[1])) if shadow else (0, 0)
    im = Image.new('RGBA', (w + 2 * pad + sx, h + 2 * pad + sy), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ox, oy = pad - b[0], pad - b[1]
    sp = int(fnt.size * 0.25)
    if shadow:
        d.multiline_text((ox + shadow[0], oy + shadow[1]), s, font=fnt, fill=shadow[2], stroke_width=stroke,
                         stroke_fill=shadow[2], spacing=sp)
    d.multiline_text((ox, oy), s, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill or fill, spacing=sp)
    return im


def skew(im, k=-0.14):
    """Horizontal shear (the game's skewX(-8deg) look)."""
    w, h = im.size
    extra = int(abs(k) * h)
    return im.transform((w + extra, h), Image.AFFINE, (1, k, -extra if k < 0 else 0, 0, 1, 0), resample=Image.BICUBIC)


def glow(im, color, radii=((6, 0.9), (22, 0.7), (60, 0.45))):
    """Neon glow of an RGBA layer: blurred copies of its alpha in `color`, added under the sharp layer."""
    a = im.split()[-1]
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    for r, k in radii:
        g = a.filter(ImageFilter.GaussianBlur(r)).point(lambda v, k=k: int(min(255, v * k * 1.6)))
        layer = Image.new('RGBA', im.size, color + (0,))
        layer.putalpha(g)
        out = Image.alpha_composite(out, layer)
    return Image.alpha_composite(out, im)


def neon_word(s, fnt, color, pad=90, core=0.55):
    """Neon sign text: glow in color, core tinted toward white."""
    corec = tuple(int(c + (255 - c) * core) for c in color)
    t = text_layer(s, fnt, corec + (255,), pad=pad)
    return glow(t, color)


def paste(dst, src, xy, alpha=1.0, anchor='mm'):
    """Alpha-composite src (RGBA) onto dst (RGBA) at xy with anchor 'mm' (centre) or 'lt'."""
    if alpha <= 0.003:
        return dst
    if alpha < 1:
        a = src.split()[-1].point(lambda v: int(v * alpha))
        src = src.copy()
        src.putalpha(a)
    x, y = xy
    if anchor == 'mm':
        x, y = int(x - src.width / 2), int(y - src.height / 2)
    elif anchor == 'lm':
        x, y = int(x), int(y - src.height / 2)
    else:
        x, y = int(x), int(y)
    if x >= dst.width or y >= dst.height or x + src.width <= 0 or y + src.height <= 0:
        return dst
    dst.alpha_composite(src, (max(0, x), max(0, y)),
                        (max(0, -x), max(0, -y)))
    return dst


def scaled(im, k):
    if abs(k - 1) < 1e-3:
        return im
    return im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.BICUBIC)


@lru_cache(maxsize=4)
def halftone(w, h, cell=14, color=(255, 255, 255), direction=(1, 0.4)):
    """Halftone dot field whose dot size grows along `direction`."""
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    dx, dy = direction
    n = math.hypot(dx, dy)
    dx, dy = dx / n, dy / n
    for y in range(0, h + cell, cell):
        off = (y // cell) % 2 * cell / 2
        for x in range(0, w + cell, cell):
            px = x + off
            u = ((px / w - 0.5) * dx + (y / h - 0.5) * dy) + 0.5
            r = cell * 0.48 * clamp01(u) ** 1.4
            if r > 0.6:
                d.ellipse((px - r, y - r, px + r, y + r), fill=255)
    return im


@lru_cache(maxsize=2)
def scanlines(w, h, step=4, dark=0.82):
    a = np.ones((h, w), np.float32)
    a[::step] = dark
    return a


class RainFX:
    """2D rain streak overlay (deterministic per frame)."""

    def __init__(self, n=160, seed=1, speed=2400, length=(40, 110), alpha=(40, 110), slant=0.18):
        r = random.Random(seed)
        self.d = [(r.uniform(-200, W + 200), r.uniform(0, H), r.uniform(0.6, 1.4), r.uniform(*length),
                   r.uniform(*alpha)) for _ in range(n)]
        self.speed, self.slant = speed, slant

    def layer(self, t, strength=1.0):
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        dr = ImageDraw.Draw(im)
        for x, y, sp, ln, a in self.d:
            yy = (y + t * self.speed * sp) % (H + 200) - 100
            xx = x + yy * self.slant
            dr.line((xx, yy, xx - ln * self.slant, yy - ln), fill=(200, 220, 255, int(a * strength)), width=2)
        return im


RAIN = None


def rain_layer(t, strength=1.0):
    global RAIN
    if RAIN is None:
        RAIN = RainFX()
    return RAIN.layer(t, strength)




# ------------------------------------------------------------------ logo card

@lru_cache(maxsize=1)
def logo_layers():
    """(neon 네온 성수, DEAD RAIN slab, drip mask, tagline) as RGBA layers."""
    ko = neon_word('네온 성수', BH(250), TOXIC, pad=110, core=0.5)
    en_txt = text_layer('DEAD RAIN', BH(178), MAG + (255,), pad=150, shadow=(10, 10, (0, 0, 0, 255)))
    en = glow(skew(en_txt, -0.12), MAG, ((10, 0.6), (34, 0.45), (80, 0.25)))
    tag = text_layer('QUARANTINE ZONE 7  ·  격리구역 7', MONO(30), (200, 255, 214, 230), pad=10)
    return ko, en, tag


@lru_cache(maxsize=1)
def drips():
    r = random.Random(9)
    return [(r.uniform(-360, 360), r.uniform(0.5, 1.0), r.uniform(30, 120), r.uniform(4, 8), r.uniform(0, 1.6))
            for _ in range(9)]


def flicker(t, seed=3):
    """Neon tube start-up: off, stutters, then on with a faint hum."""
    if t < 0:
        return 0.0
    pattern = [(0.0, 1), (0.06, 0), (0.12, 1), (0.16, 0.15), (0.26, 1), (0.30, 0.3), (0.34, 1)]
    v = 0.0
    for t0, val in pattern:
        if t >= t0:
            v = val
    hum = 0.94 + 0.06 * math.sin(t * 47 + seed) * math.sin(t * 13)
    return v * hum


def logo_frame(bg, t, slam, cta_at=None, tag=True):
    """bg: RGBA backdrop. slam: local time the logo slams in. Returns RGBA."""
    ko, en, tagl = logo_layers()
    im = bg
    u = t - slam
    if u < -1.4:
        return im
    # pre-slam: faint green tube glow building up
    cx, cy = W / 2, 420
    push = 1.0 + 0.035 * clamp01(max(0.0, u) / 9.0)
    f = flicker(u)
    if u < 0:
        f = 0.12 * clamp01((u + 1.4) / 1.4) * (0.6 + 0.4 * math.sin(t * 60))
    if f > 0.01:
        im = paste(im, scaled(ko, push), (cx, cy), alpha=f)
    # DEAD RAIN slams 0.12s after the hit, scale overshoot
    v = u - 0.12
    if v >= 0:
        k = 1.0 + 0.6 * (1 - back_out(v / 0.28, 2.2)) if v < 0.28 else 1.0
        e = scaled(en, k * push)
        ex, ey = cx - 22, 640
        im = paste(im, e, (ex, ey), alpha=clamp01(v / 0.06))
        # blood-rain drips falling from the slab
        dl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(dl)
        for dx, sp, ln, wd, delay in drips():
            g = clamp01((v - 0.3 - delay) / 2.4) * sp
            if g <= 0:
                continue
            x = ex + dx * push
            y0 = ey + 70
            y1 = y0 + ln * g
            d.polygon([(x - wd / 2, y0), (x + wd / 2, y0), (x + wd * 0.2, y1), (x - wd * 0.2, y1)], fill=BLOOD + (230,))
            d.ellipse((x - wd * 0.8, y1 - wd * 0.8, x + wd * 0.8, y1 + wd * 0.9), fill=BLOOD + (240,))
        im = Image.alpha_composite(im, glow(dl, BLOOD, ((6, 0.5),)))
    if tag and u > 0.7:
        a = ease_out((u - 0.7) / 0.5)
        im = paste(im, tagl, (cx, 250 + (1 - a) * 16), alpha=a * 0.9)
    if cta_at is not None and t > cta_at:
        a = ease_out((t - cta_at) / 0.5)
        im = paste(im, cta_static(), (cx, 900 + (1 - a) * 30), alpha=a)
    return im


# ------------------------------------------------------------------ callouts

CALLOUTS = {
    'fixer': ('FIXER CONTRACTS', '해결사 의뢰', AMBER),
    'car': ('STEAL ANY CAR', '차를 훔쳐라', CYAN),
    'build': ('BUILD · DEFEND', '쉘터를 지켜라', TOXIC),
}


@lru_cache(maxsize=8)
def callout_static(kind):
    en, ko, col = CALLOUTS[kind]
    big = skew(text_layer(en, BH(132), col + (255,), pad=80, shadow=(8, 8, (0, 0, 0, 255))))
    big = glow(big, col, ((14, 0.5), (40, 0.3)))
    small = skew(text_layer(ko, PS(54), WHITE + (255,), pad=16, shadow=(4, 4, (0, 0, 0, 255))))
    return big, small


def callout(im, kind, t, dur):
    """Kinetic type: slam in from the left with skew + overshoot, hold, whip out."""
    dur = min(dur, 2.6)
    if t > dur:
        return im
    big, small = callout_static(kind)
    a_in = back_out(t / 0.32)
    out = clamp01((t - (dur - 0.22)) / 0.22)
    x = 110 + (a_in - 1) * 900 + out * -1500 + 18 * t
    y = 250
    band = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bw = int((big.width + 260) * ease_out(t / 0.25) * (1 - out))
    if bw > 0:
        ImageDraw.Draw(band).polygon([(0, y + 20), (bw, y + 20), (bw - 90, y + big.height + small.height + 10),
                                      (0, y + big.height + small.height + 10)], fill=(5, 5, 12, 165))
        im = Image.alpha_composite(im, band.filter(ImageFilter.GaussianBlur(4)))
    im = paste(im, big, (x, y), alpha=clamp01(t / 0.08), anchor='lt')
    a2 = ease_out((t - 0.18) / 0.25)
    im = paste(im, small, (x + 30 + (1 - a2) * -200 + out * -1500, y + big.height - 20), alpha=a2, anchor='lt')
    return im


@lru_cache(maxsize=1)
def footage_label():
    t = text_layer('IN-GAME FOOTAGE  ·  실제 게임 화면', MONO(21), (225, 225, 238, 255), pad=8)
    box = Image.new('RGBA', (t.width + 16, t.height + 4), (0, 0, 0, 0))
    ImageDraw.Draw(box).rounded_rectangle((4, 6, box.width - 5, box.height - 7), 6, fill=(0, 0, 0, 120))
    box.alpha_composite(t, (8, 2))
    return box


@lru_cache(maxsize=1)
def cta_static():
    t = text_layer('▶  PLAY FREE IN YOUR BROWSER  ·  브라우저에서 무료 플레이', PS(36), (8, 20, 10, 255), pad=0)
    pill = Image.new('RGBA', (t.width + 80, t.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rectangle((0, 0, pill.width - 1, pill.height - 1), fill=TOXIC + (255,))
    pill.alpha_composite(t, (40, 20 - t.getbbox()[1] + 2))
    shadow = Image.new('RGBA', (pill.width + 8, pill.height + 8), (0, 0, 0, 0))
    shadow.alpha_composite(Image.new('RGBA', pill.size, (0, 0, 0, 255)), (8, 8))
    shadow.alpha_composite(pill, (0, 0))
    return glow(skew(shadow, -0.14), TOXIC, ((18, 0.35),))
