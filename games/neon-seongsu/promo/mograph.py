"""Stage 4: motion graphics drawn with Pillow + numpy (GTA loading-screen style).

Every function here is pure: (segment-local time, duration) -> RGB/RGBA PIL image at 1920x1080,
so the assembler can render any frame in any worker process.
"""
import math
import os
import random
from functools import lru_cache

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

from common import AMBER, BUILD, CYAN, FPS, H, INK, LINE2, MAG, NIGHT, RED, W, font

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


def blender_still(name, idx=-1, dim=1.0, blur=0):
    """A frame from a rendered Blender shot (for card backdrops). Falls back to None when not rendered."""
    d = os.path.join(BUILD, 'blender', name)
    if not os.path.isdir(d):
        return None
    fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    if not fs:
        return None
    im = Image.open(os.path.join(d, fs[idx if abs(idx) <= len(fs) else -1])).convert('RGB').resize((W, H), Image.BICUBIC)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    if dim != 1.0:
        im = Image.eval(im, lambda v: int(v * dim))
    return im


@lru_cache(maxsize=8)
def backdrop(name, idx, dim, blur):
    im = blender_still(name, idx, dim, blur)
    if im is None:
        # gradient night sky fallback
        a = np.zeros((H, W, 3), np.float32)
        yy = np.linspace(0, 1, H)[:, None]
        a[:] = (np.array(NIGHT) * (1 - yy[..., None]) + np.array((40, 12, 38)) * yy[..., None])
        im = Image.fromarray(a.astype(np.uint8))
    return im


# ------------------------------------------------------------------ procedural portraits

PORTRAITS = {
    'seojin': dict(color=CYAN, skin=(96, 84, 100), hair='bob', hair_col=(14, 14, 20), acc='visor', coat=(18, 20, 28)),
    'taeo': dict(color=AMBER, skin=(112, 88, 76), hair='quiff', hair_col=(20, 16, 14), acc='scarf', coat=(46, 28, 20)),
    'mira': dict(color=MAG, skin=(104, 88, 96), hair='silver', hair_col=(198, 196, 212), acc='coat', coat=(26, 20, 30)),
    'cha': dict(color=RED, skin=(100, 90, 92), hair='slick', hair_col=(22, 22, 26), acc='halo', coat=(222, 222, 232)),
}


@lru_cache(maxsize=8)
def portrait(kind, height=900):
    """Stylized geometric head-and-shoulders silhouette, drawn at 2x and downsampled. No likeness of anyone."""
    P = PORTRAITS[kind]
    S = 2
    w, h = 900 * S, 1000 * S
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    col = P['color']
    cx = w // 2
    # --- shoulders / torso
    sh_top = int(h * 0.64)
    torso = [(cx - 380 * S, h), (cx - 360 * S, sh_top + 90 * S), (cx - 250 * S, sh_top), (cx - 90 * S, sh_top - 30 * S),
             (cx + 90 * S, sh_top - 30 * S), (cx + 250 * S, sh_top), (cx + 360 * S, sh_top + 90 * S), (cx + 380 * S, h)]
    rim = [(x + 10 * S, y - 6 * S) for x, y in torso]
    d.polygon(rim, fill=col + (255,))
    d.polygon(torso, fill=P['coat'] + (255,))
    # neck
    d.rectangle((cx - 62 * S, int(h * 0.50), cx + 62 * S, sh_top), fill=tint(P['skin'], 0.7) + (255,))
    # head
    hx0, hy0, hx1, hy1 = cx - 150 * S, int(h * 0.19), cx + 150 * S, int(h * 0.56)
    d.ellipse((hx0 + 12 * S, hy0 - 6 * S, hx1 + 12 * S, hy1 - 6 * S), fill=col + (255,))  # rim light
    d.ellipse((hx0, hy0, hx1, hy1), fill=P['skin'] + (255,))
    # jaw shade (cel shading on the far side)
    d.chord((hx0, hy0, hx1, hy1), 100, 260, fill=tint(P['skin'], 0.72) + (255,))
    hc = P['hair_col'] + (255,)
    if P['hair'] == 'bob':
        d.chord((hx0 - 22 * S, hy0 - 30 * S, hx1 + 22 * S, hy1 - 60 * S), 180, 360, fill=hc)
        d.polygon([(hx0 - 22 * S, (hy0 + hy1) // 2 - 70 * S), (hx0 + 30 * S, (hy0 + hy1) // 2 - 70 * S),
                   (hx0 + 40 * S, hy1 - 40 * S), (hx0 - 10 * S, hy1 - 10 * S)], fill=hc)
        d.polygon([(hx1 + 22 * S, (hy0 + hy1) // 2 - 70 * S), (hx1 - 30 * S, (hy0 + hy1) // 2 - 70 * S),
                   (hx1 - 40 * S, hy1 - 40 * S), (hx1 + 10 * S, hy1 - 10 * S)], fill=hc)
        # fringe
        d.polygon([(hx0, hy0 + 90 * S), (cx + 120 * S, hy0 + 40 * S), (hx1, hy0 + 110 * S), (hx1, hy0 + 40 * S),
                   (hx0, hy0 + 40 * S)], fill=hc)
    elif P['hair'] == 'quiff':
        pts = [(hx0 - 10 * S, hy0 + 150 * S), (hx0 - 20 * S, hy0 + 30 * S), (hx0 + 40 * S, hy0 - 40 * S),
               (cx - 40 * S, hy0 - 70 * S), (cx + 30 * S, hy0 - 95 * S), (cx + 60 * S, hy0 - 50 * S),
               (hx1 + 20 * S, hy0 - 30 * S), (hx1 + 10 * S, hy0 + 60 * S), (hx1 - 10 * S, hy0 + 150 * S),
               (hx1 - 60 * S, hy0 + 70 * S), (cx, hy0 + 55 * S), (hx0 + 50 * S, hy0 + 80 * S)]
        d.polygon(pts, fill=hc)
    elif P['hair'] == 'silver':
        d.chord((hx0 - 36 * S, hy0 - 36 * S, hx1 + 36 * S, hy1 - 20 * S), 170, 370, fill=hc)
        d.rectangle((hx0 - 36 * S, (hy0 + hy1) // 2 - 40 * S, hx0 + 20 * S, hy1 + 10 * S), fill=hc)
        d.rectangle((hx1 - 20 * S, (hy0 + hy1) // 2 - 40 * S, hx1 + 36 * S, hy1 + 10 * S), fill=hc)
        d.polygon([(hx0, hy0 + 120 * S), (cx - 20 * S, hy0 + 60 * S), (hx1, hy0 + 90 * S), (hx1, hy0), (hx0, hy0)], fill=hc)
        # darker underside strand for depth
        d.rectangle((hx0 - 36 * S, hy1 - 20 * S, hx0 + 20 * S, hy1 + 10 * S), fill=tint(P['hair_col'], 0.7) + (255,))
    elif P['hair'] == 'slick':
        d.chord((hx0 - 8 * S, hy0 - 14 * S, hx1 + 8 * S, hy1 - 110 * S), 180, 360, fill=hc)
        d.polygon([(hx0 - 8 * S, hy0 + 110 * S), (hx0 + 10 * S, hy0 + 40 * S), (hx0 + 60 * S, hy0 + 30 * S)], fill=hc)
        for k in range(4):  # comb lines
            y = hy0 + (10 + 18 * k) * S
            d.arc((hx0 + 20 * S, y, hx1 - 20 * S, y + 160 * S), 200, 340, fill=(60, 60, 70, 255), width=3 * S)
    # accessories
    eye_y = int(hy0 + (hy1 - hy0) * 0.47)
    if P['acc'] == 'visor':
        vis = Image.new('RGBA', im.size, (0, 0, 0, 0))
        vd = ImageDraw.Draw(vis)
        vd.rounded_rectangle((hx0 - 6 * S, eye_y - 32 * S, hx1 + 16 * S, eye_y + 28 * S), 26 * S, fill=col + (255,))
        vd.rounded_rectangle((hx0 + 10 * S, eye_y - 18 * S, hx1, eye_y + 12 * S), 16 * S, fill=(230, 255, 255, 255))
        im = Image.alpha_composite(im, glow(vis, col, ((10 * S, 0.9), (40 * S, 0.5))))
        d = ImageDraw.Draw(im)
        # high collar of the rain shell with cyan piping
        d.polygon([(cx - 140 * S, sh_top - 40 * S), (cx - 70 * S, int(h * 0.52)), (cx, sh_top - 10 * S)], fill=(10, 12, 18, 255))
        d.polygon([(cx + 140 * S, sh_top - 40 * S), (cx + 70 * S, int(h * 0.52)), (cx, sh_top - 10 * S)], fill=(10, 12, 18, 255))
        d.line([(cx - 250 * S, sh_top + 10 * S), (cx - 120 * S, h)], fill=col + (255,), width=6 * S)
        d.line([(cx + 250 * S, sh_top + 10 * S), (cx + 120 * S, h)], fill=col + (255,), width=6 * S)
    elif P['acc'] == 'scarf':
        # simple eye line
        d.line([(cx - 95 * S, eye_y), (cx - 35 * S, eye_y + 4 * S)], fill=(20, 16, 16, 255), width=10 * S)
        d.line([(cx + 35 * S, eye_y + 4 * S), (cx + 95 * S, eye_y)], fill=(20, 16, 16, 255), width=10 * S)
        # leather jacket lapels
        d.polygon([(cx - 250 * S, sh_top), (cx - 60 * S, sh_top + 40 * S), (cx - 150 * S, h)], fill=(30, 18, 12, 255))
        d.polygon([(cx + 250 * S, sh_top), (cx + 60 * S, sh_top + 40 * S), (cx + 150 * S, h)], fill=(30, 18, 12, 255))
        d.line([(cx - 250 * S, sh_top), (cx - 150 * S, h)], fill=(120, 70, 40, 255), width=4 * S)
        # amber scarf wraps + hanging end
        sc = Image.new('RGBA', im.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sc)
        for k, yy in enumerate((int(h * 0.55), int(h * 0.6))):
            sd.rounded_rectangle((cx - 150 * S + k * 10 * S, yy, cx + 150 * S - k * 10 * S, yy + 70 * S), 34 * S,
                                 fill=tint(col, 0.95 - 0.2 * k) + (255,))
        sd.polygon([(cx + 40 * S, int(h * 0.62)), (cx + 120 * S, int(h * 0.62)), (cx + 150 * S, int(h * 0.86)),
                    (cx + 70 * S, int(h * 0.88))], fill=tint(col, 0.75) + (255,))
        for k in range(5):  # fringe stripes
            sd.line([(cx + 75 * S + k * 16 * S, int(h * 0.87)), (cx + 80 * S + k * 16 * S, int(h * 0.9))], fill=tint(col, 0.6) + (255,), width=5 * S)
        im = Image.alpha_composite(im, sc)
        d = ImageDraw.Draw(im)
    elif P['acc'] == 'coat':
        d.line([(cx - 95 * S, eye_y), (cx - 35 * S, eye_y)], fill=(25, 20, 26, 255), width=8 * S)
        d.line([(cx + 35 * S, eye_y), (cx + 95 * S, eye_y)], fill=(25, 20, 26, 255), width=8 * S)
        d.polygon([(cx - 260 * S, sh_top - 10 * S), (cx - 40 * S, sh_top + 60 * S), (cx - 110 * S, h)], fill=(40, 30, 44, 255))
        d.polygon([(cx + 260 * S, sh_top - 10 * S), (cx + 40 * S, sh_top + 60 * S), (cx + 110 * S, h)], fill=(40, 30, 44, 255))
        e = Image.new('RGBA', im.size, (0, 0, 0, 0))
        ImageDraw.Draw(e).ellipse((hx0 - 10 * S, eye_y + 70 * S, hx0 + 16 * S, eye_y + 96 * S), fill=col + (255,))
        im = Image.alpha_composite(im, glow(e, col, ((8 * S, 0.9), (24 * S, 0.5))))
        d = ImageDraw.Draw(im)
    elif P['acc'] == 'halo':
        d.line([(cx - 95 * S, eye_y), (cx - 35 * S, eye_y - 6 * S)], fill=(20, 20, 24, 255), width=8 * S)
        d.line([(cx + 35 * S, eye_y - 6 * S), (cx + 95 * S, eye_y)], fill=(20, 20, 24, 255), width=8 * S)
        # white suit lapels + dark shirt + tie
        d.polygon([(cx - 90 * S, sh_top - 30 * S), (cx + 90 * S, sh_top - 30 * S), (cx + 40 * S, h), (cx - 40 * S, h)], fill=(20, 20, 26, 255))
        d.polygon([(cx - 18 * S, sh_top), (cx + 18 * S, sh_top), (cx + 26 * S, h), (cx - 26 * S, h)], fill=(120, 20, 30, 255))
        d.polygon([(cx - 250 * S, sh_top), (cx - 90 * S, sh_top - 30 * S), (cx - 40 * S, sh_top + 250 * S)], fill=(190, 190, 204, 255))
        d.polygon([(cx + 250 * S, sh_top), (cx + 90 * S, sh_top - 30 * S), (cx + 40 * S, sh_top + 250 * S)], fill=(190, 190, 204, 255))
        halo = Image.new('RGBA', im.size, (0, 0, 0, 0))
        ImageDraw.Draw(halo).ellipse((cx - 190 * S, hy0 - 110 * S, cx + 190 * S, hy0 - 10 * S), outline=MAG + (255,), width=12 * S)
        im = Image.alpha_composite(glow(halo, MAG, ((12 * S, 0.9), (40 * S, 0.6))), im)
        im = Image.alpha_composite(im, halo)
        d = ImageDraw.Draw(im)
    # halftone shading on the shadow side, clipped to the silhouette
    a = im.split()[-1]
    ht = halftone(w // 2, h // 2, 12, direction=(-1, 0.3)).resize((w, h), Image.NEAREST)
    shade = Image.new('RGBA', im.size, (0, 0, 0, 0))
    shade.putalpha(ImageChops.multiply(ht, a).point(lambda v: int(v * 0.45)))
    im = Image.alpha_composite(im, shade)
    im = im.resize((int(w / S * height / 1000), height), Image.LANCZOS)
    return im


# ------------------------------------------------------------------ character cards

CARDS = {
    'card_seojin': dict(who='seojin', color=CYAN, ko='한서진', en='HAN SEO-JIN', num='01', tag='PLAYABLE  ·  RUNNER 01',
                        role='Ex-OMNI drone engineer. Hacker. EMP specialist.', role_ko='전 OMNI 드론 엔지니어 · 해커 · EMP 전문가',
                        quote='“I built their eyes.\n I know where they blink.”', bg=('A_aerial', -1)),
    'card_taeo': dict(who='taeo', color=AMBER, ko='강태오', en='KANG TAE-O', num='02', tag='PLAYABLE  ·  RUNNER 02',
                      role="Shoemaker's son. Getaway driver.", role_ko='구두장이의 아들 · 도주 전문 드라이버',
                      quote='“My father made shoes for this street.\n I just drive on it.”', bg=('B_brick', -1)),
    'card_mira': dict(who='mira', color=MAG, ko='윤미라', en='YOON MI-RA', num='03', tag='THE FIXER',
                      role='Runs Black Roastery. Moves the jobs.', role_ko='블랙 로스터리 사장 · 픽서',
                      quote='“Nothing in Seongsu moves\n without passing my counter.”', bg=('B_brick', 120)),
    'card_cha': dict(who='cha', color=RED, ko='차도현', en='CHA DO-HYUN', num='04', tag='CEO  ·  OMNI DYNAMICS',
                     role='The man who bought Seongsu.', role_ko='OMNI 다이내믹스 코리아 CEO',
                     quote='“Seongsu was a factory. I made it a product.”', bg=('C_tower', -1)),
}


@lru_cache(maxsize=8)
def card_static(name):
    """Pre-rendered layers for a card: backdrop, colour panel, text blocks."""
    c = CARDS[name]
    col = c['color']
    bg = backdrop(c['bg'][0], c['bg'][1], 0.42, 6).convert('RGBA')
    # diagonal colour panel (left) with gradient + halftone
    panel = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g = np.zeros((H, W, 4), np.float32)
    xx = np.linspace(0, 1, W)[None, :]
    yy = np.linspace(0, 1, H)[:, None]
    k = 0.55 - 0.45 * xx - 0.15 * yy
    g[..., 0] = col[0] * k
    g[..., 1] = col[1] * k
    g[..., 2] = col[2] * k
    g[..., 3] = 235
    panel = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), 'RGBA')
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (1060, 0), (800, H), (0, H)], fill=255)
    ht = halftone(W, H, 16, direction=(1, -0.5))
    htl = Image.new('RGBA', (W, H), tint(col, 1.0) + (0,))
    htl.putalpha(ImageChops.multiply(ht, mask).point(lambda v: int(v * 0.28)))
    panel.putalpha(mask)
    panel = Image.alpha_composite(panel, htl)
    # edge stripe
    edge = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ed = ImageDraw.Draw(edge)
    ed.polygon([(1060, 0), (1082, 0), (822, H), (800, H)], fill=col + (255,))
    ed.polygon([(1110, 0), (1118, 0), (858, H), (850, H)], fill=col + (150,))
    edge = glow(edge, col, ((10, 0.8), (30, 0.4)))
    # big faint number
    num = text_layer(c['num'], BH(520), col + (38,), pad=10)
    # text block
    name_ko = skew(text_layer(c['ko'], BH(190), WHITE + (255,), pad=30, shadow=(8, 8, (0, 0, 0, 255))))
    name_en = skew(text_layer(c['en'], BH(84), col + (255,), pad=24, shadow=(5, 5, (0, 0, 0, 255))))
    tag = text_layer(c['tag'], MONO(30), col + (255,), pad=10)
    role = text_layer(c['role'], PSL(36), INK + (255,), pad=10)
    role_ko = text_layer(c['role_ko'], PR(34), (190, 186, 210, 255), pad=10)
    quote = text_layer(c['quote'], MONO(30), (230, 230, 240, 255), pad=10)
    por = portrait(c['who'])
    return dict(bg=bg, panel=panel, edge=edge, num=num, name_ko=name_ko, name_en=name_en, tag=tag, role=role,
                role_ko=role_ko, quote=quote, portrait=por, col=col)


def card_frame(name, t, dur):
    s = card_static(name)
    quick = dur < 2.5
    sp = 1.6 if quick else 1.0  # quick cards animate faster
    im = s['bg'].copy()
    # slow backdrop drift
    im = paste(im, rain_layer(t, 0.6), (0, 0), anchor='lt')
    # panel wipe in from the left
    wi = ease_out(t * sp / 0.35)
    ox = int((wi - 1) * 1150)
    im = paste(im, s['panel'], (ox, 0), anchor='lt')
    im = paste(im, s['num'], (60 + ox * 0.5 - 20 * t, 40), anchor='lt')
    im = paste(im, s['edge'], (ox, 0), anchor='lt')
    # portrait: slides in and drifts (parallax)
    pi = ease_out((t * sp - 0.08) / 0.5)
    px = 120 + (pi - 1) * 380 + 18 * t
    im = paste(im, s['portrait'], (px, H - s['portrait'].height + 30), alpha=pi, anchor='lt')
    # text block on the right
    x0 = 1010
    a = ease_out((t * sp - 0.15) / 0.25)
    im = paste(im, s['tag'], (x0 + 40 + (1 - a) * 60, 200), alpha=a, anchor='lt')
    a = clamp01((t * sp - 0.22) / 0.18)
    k = 1.0 + 0.35 * (1 - back_out((t * sp - 0.22) / 0.3))
    ko = scaled(s['name_ko'], k)
    im = paste(im, ko, (x0 + ko.width / 2 - 10, 250 + ko.height / 2), alpha=a)
    a = ease_out((t * sp - 0.34) / 0.25)
    im = paste(im, s['name_en'], (x0 + (1 - a) * 80, 452), alpha=a, anchor='lt')
    a = ease_out((t * sp - 0.5) / 0.3)
    im = paste(im, s['role'], (x0 + 30, 590 + (1 - a) * 20), alpha=a, anchor='lt')
    im = paste(im, s['role_ko'], (x0 + 30, 648 + (1 - a) * 20), alpha=a, anchor='lt')
    if not quick:
        # quote types on
        q = s['quote']
        frac = clamp01((t - 0.9) / 1.4)
        if frac > 0:
            qq = q.crop((0, 0, max(1, int(q.width * frac)), q.height))
            im = paste(im, qq, (x0 + 30, 730), alpha=1.0, anchor='lt')
    # colour accent bar under the name
    d = ImageDraw.Draw(im)
    bw = int(520 * ease_out((t * sp - 0.3) / 0.4))
    if bw > 0:
        d.rectangle((x0 + 30, 572, x0 + 30 + bw, 577), fill=s['col'] + (255,))
    return im.convert('RGB')


# ------------------------------------------------------------------ "cafés / pop-ups / money"

@lru_cache(maxsize=1)
def money_static():
    signs = [
        (neon_word('CAFE', BH(170), CYAN), neon_word('카페', BH(90), CYAN), (520, 330)),
        (neon_word('POP-UP', BH(170), MAG), neon_word('팝업', BH(90), MAG), (1390, 470)),
        (neon_word('₩ MONEY', BH(210), AMBER), neon_word('돈', BH(110), AMBER), (960, 690)),
    ]
    stickers = [text_layer(s, BH(46), (20, 10, 10, 255), pad=18) for s in ('SOLD OUT', '임대', 'OPEN', '신상 팝업', 'RENT ↑', '폐업')]
    return signs, stickers


def money_frame(t, dur, beats):
    """beats: segment-local times of "cafés", "pop-ups", "money"."""
    bg = backdrop('B_brick', -1, 0.34, 3)
    # slow push-in on the last brick frame
    z = 1.0 + 0.06 * t / dur
    bw, bh = int(W * z), int(H * z)
    im = bg.resize((bw, bh), Image.BICUBIC).crop(((bw - W) // 2, (bh - H) // 2, (bw - W) // 2 + W, (bh - H) // 2 + H)).convert('RGBA')
    im = paste(im, rain_layer(t, 0.7), (0, 0), anchor='lt')
    signs, stickers = money_static()
    rnd = random.Random(int(t * FPS) // 2)
    # rising rent line graph across the frame
    pts = []
    grow = clamp01((t - beats[0] + 0.3) / (dur - beats[0]))
    gr = random.Random(77)
    y = 900
    for i in range(0, 41):
        x = 120 + i * 42
        y -= gr.uniform(-4, 22) * (1 + i / 30)
        pts.append((x, y))
    n = max(2, int(len(pts) * grow))
    line = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(line)
    ld.line(pts[:n], fill=(255, 77, 94, 255), width=6, joint='curve')
    ld.ellipse((pts[n - 1][0] - 10, pts[n - 1][1] - 10, pts[n - 1][0] + 10, pts[n - 1][1] + 10), fill=(255, 200, 200, 255))
    line = glow(line, RED, ((6, 0.8), (20, 0.4)))
    im = paste(im, line, (0, 0), alpha=0.85, anchor='lt')
    lab = text_layer('RENT  임대료', MONO(30), (255, 120, 130, 255), pad=6)
    im = paste(im, lab, (pts[n - 1][0] + 20, pts[n - 1][1] - 40), alpha=clamp01(grow * 4), anchor='lt')
    # stickers slapped on after the second beat
    sr = random.Random(5)
    for i, st in enumerate(stickers):
        ts = beats[1] + 0.25 + i * 0.35
        if t < ts:
            continue
        k = 1.0 + 0.5 * (1 - ease_out((t - ts) / 0.15))
        bgc = [AMBER, WHITE, CYAN, MAG, (255, 90, 90), WHITE][i]
        s = Image.new('RGBA', (st.width + 10, st.height + 10), (0, 0, 0, 0))
        ImageDraw.Draw(s).rectangle((5, 5, st.width + 5, st.height + 5), fill=bgc + (255,))
        s.alpha_composite(st, (5, 5))
        s = s.rotate(sr.uniform(-12, 12), expand=True, resample=Image.BICUBIC)
        pos = [(260, 700), (1650, 250), (330, 150), (1600, 820), (1180, 190), (760, 900)][i]
        im = paste(im, scaled(s, k), pos, alpha=0.95)
    for i, (big, small, (x, y)) in enumerate(signs):
        tb = beats[i] - 0.05
        if t < tb:
            continue
        lt = t - tb
        # flicker-on for the first 0.3 s, then steady with a rare dip
        on = 1.0
        if lt < 0.3:
            on = 1.0 if rnd.random() < 0.3 + lt * 2.3 else 0.15
        elif rnd.random() < 0.03:
            on = 0.6
        k = 1.0 + 0.25 * (1 - back_out(lt / 0.35))
        im = paste(im, scaled(big, k), (x, y), alpha=on)
        im = paste(im, small, (x, y + big.height * 0.36), alpha=on * clamp01((lt - 0.15) / 0.2))
    return im.convert('RGB')


# ------------------------------------------------------------------ 2077

@lru_cache(maxsize=1)
def y2077_static():
    big = text_layer('2077', BH(420), WHITE + (255,), pad=60)
    sub = text_layer('영구 장마  ·  THE ENDLESS RAIN', MONO(38), MAG + (255,), pad=10)
    return big, sub


def y2077_frame(t, dur):
    big, sub = y2077_static()
    base = np.zeros((H, W, 3), np.float32)
    yy = np.linspace(0, 1, H)[:, None, None]
    base[:] = np.array(NIGHT) * (1 - yy) + np.array((30, 8, 30)) * yy
    # lightning flash at the start
    fl = max(0.0, 1 - t / 0.25) * 0.8 + (0.4 if 0.34 < t < 0.4 else 0)
    base += fl * 120
    im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert('RGBA')
    im = paste(im, rain_layer(t, 1.2), (0, 0), anchor='lt')
    k = 1.08 - 0.08 * ease_out(t / dur)
    b = scaled(big, k)
    # chromatic split that settles
    sp = int(18 * max(0.0, 1 - t / 0.6)) + (6 if int(t * FPS) % 17 == 0 else 0)
    r = b.copy()
    r.putalpha(b.split()[-1].point(lambda v: int(v * 0.7)))
    for dx, c in ((-sp, (255, 46, 136)), (sp, (41, 231, 255))):
        layer = Image.new('RGBA', b.size, c + (0,))
        layer.putalpha(b.split()[-1].point(lambda v: int(v * 0.8)))
        im = paste(im, layer, (W / 2 + dx, H / 2 - 40))
    im = paste(im, glow(b, MAG, ((20, 0.5), (60, 0.35))), (W / 2, H / 2 - 40))
    im = paste(im, sub, (W / 2, H / 2 + 200), alpha=ease_out((t - 0.4) / 0.4))
    return im.convert('RGB')


# ------------------------------------------------------------------ gameplay callouts

CALLOUTS = {
    'car': ('STEAL ANY CAR', '어떤 차든 훔쳐라', AMBER),
    'stars': ('5-STAR MANHUNT', '★★★★★  별 다섯 개 추격', RED),
    'emp': ('EMP PULSE', '펄스 한 번으로 도시를 해킹', MAG),
}
LOCATIONS = {
    'switch': ('TWO RUNNERS', 'TAB  ·  언제든 캐릭터 전환'),
    'forest': ('서울숲', 'SEOUL FOREST'),
    'race': ('한강', 'HAN RIVER  ·  체크포인트 레이스'),
    'phone': ('성수그램', 'SEONGSUGRAM  ·  동네가 보고 있다'),
    'heist': ('OMNI 타워', 'THE HEIST  ·  뚝섬 선착장까지'),
}


@lru_cache(maxsize=8)
def callout_static(kind):
    en, ko, col = CALLOUTS[kind]
    big = skew(text_layer(en, BH(150), col + (255,), pad=30, shadow=(8, 8, (0, 0, 0, 255))))
    big = glow(big, col, ((14, 0.5), (40, 0.3)))
    small = skew(text_layer(ko, PS(52), WHITE + (255,), pad=16, shadow=(4, 4, (0, 0, 0, 255))))
    return big, small


def callout(im, kind, t, dur):
    """Kinetic type: slam in from the left with skew + overshoot, hold, whip out."""
    big, small = callout_static(kind)
    a_in = back_out(t / 0.32)
    out = clamp01((t - (dur - 0.22)) / 0.22)
    x = 120 + (a_in - 1) * 900 + out * -1400 + 20 * t
    y = 360
    band = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bw = int((big.width + 260) * ease_out(t / 0.25) * (1 - out))
    if bw > 0:
        ImageDraw.Draw(band).polygon([(0, y + 20), (bw, y + 20), (bw - 90, y + big.height + small.height + 10),
                                      (0, y + big.height + small.height + 10)], fill=(5, 5, 12, 150))
        im = Image.alpha_composite(im, band.filter(ImageFilter.GaussianBlur(4)))
    im = paste(im, big, (x, y), alpha=clamp01(t / 0.08), anchor='lt')
    a2 = ease_out((t - 0.18) / 0.25)
    im = paste(im, small, (x + 30 + (1 - a2) * -200 + out * -1400, y + big.height - 20), alpha=a2, anchor='lt')
    return im


@lru_cache(maxsize=8)
def location_static(scene):
    ko, en = LOCATIONS[scene]
    big = text_layer(ko, BH(96), INK + (255,), pad=24, shadow=(5, 5, (0, 0, 0, 255)))
    big = glow(big, MAG, ((16, 0.5), (36, 0.25)))
    small = text_layer(en, MONO(30), MAG + (255,), pad=8, shadow=(2, 2, (0, 0, 0, 255)))
    return big, small


def location_tag(im, scene, t, dur):
    """GTA-style location name, top-right like the game's zone banner (clear of the subtitle area)."""
    big, small = location_static(scene)
    a = ease_out((t - 0.15) / 0.35) * (1 - clamp01((t - (dur - 0.3)) / 0.3))
    x = W - 70
    im = paste(im, small, (x - small.width, 232), alpha=a, anchor='lt')
    im = paste(im, big, (x - big.width + 10 + (1 - a) * 40, 280), alpha=a, anchor='lt')
    return im


@lru_cache(maxsize=1)
def footage_label():
    return text_layer('IN-GAME FOOTAGE  ·  실제 게임 화면', MONO(22), (220, 220, 235, 200), pad=8)


# ------------------------------------------------------------------ end-card CTA

@lru_cache(maxsize=1)
def cta_static():
    t = text_layer('▶  PLAY FREE IN YOUR BROWSER  ·  브라우저에서 무료 플레이', PS(36), (20, 8, 0, 255), pad=0)
    pill = Image.new('RGBA', (t.width + 80, t.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rectangle((0, 0, pill.width - 1, pill.height - 1), fill=AMBER + (255,))
    pill.alpha_composite(t, (40, 20 - t.getbbox()[1] + 2))
    shadow = Image.new('RGBA', (pill.width + 8, pill.height + 8), (0, 0, 0, 0))
    shadow.alpha_composite(Image.new('RGBA', pill.size, (0, 0, 0, 255)), (8, 8))
    shadow.alpha_composite(pill, (0, 0))
    return skew(shadow, -0.14)
