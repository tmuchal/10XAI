"""Shot B — photo booth (film ~t=86.5-89.5s, 90 frames, RGBA 1080x1080).
Booth pops in, Noa strikes three poses — FLASH, FLASH, FLASH — then a strip of three
photos chugs out of the slot and flutters (the Soul ID "20+ photos" beat).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from toonlib import *

N = 90
FILM = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'film'))
frames, out_dir = frames_arg(N)
out_dir = out_dir or os.path.join(FILM, 'assets', '3d', 'photobooth')

reset((1080, 1080), transparent=True, samples=6)
OL = 0.03
TEAL = toon('teal', "#5fbfae", paper=0.08)
TEAL2 = toon('teal2', "#4aa99a", paper=0.08)
CREAMM = toon('creamm', "#fff1d6", paper=0.06)
REDM = toon('redm', RED, shadow="#8f2320", hi="#e25a48", paper=0.07)
GOLDM = toon('gold', GOLD, shadow="#b9801f", hi="#fff0a8", paper=0.05)
INKF = flat('inkf', INK)

rig = empty('booth')           # pop-in + shake
W, D, H = 2.3, 1.6, 3.1
box('back', (W, 0.15, H), (0, D / 2, H / 2), toon('inside', "#fde6c4", paper=0.08), rig, OL)
for sx in (-1, 1):
    box('side', (0.2, D, H), (sx * (W / 2 - 0.1), 0, H / 2), TEAL, rig, OL, bevel=0.03)
box('roof', (W + 0.2, D + 0.2, 0.2), (0, 0, H + 0.1), TEAL2, rig, OL, bevel=0.04)
box('base', (W + 0.1, D + 0.1, 0.25), (0, 0, 0.125), TEAL2, rig, OL, bevel=0.04)
box('front_low', (W, 0.14, 1.05), (0, -D / 2 + 0.07, 0.25 + 0.525), TEAL, rig, OL, bevel=0.03)
box('lintel', (W, 0.14, 0.5), (0, -D / 2 + 0.07, H - 0.25), TEAL, rig, OL, bevel=0.03)
# polka dots on the inside back wall
dotm = flat('dot', "#f7cf8f")
for i in range(5):
    for j in range(4):
        x = -0.85 + i * 0.42 + (0.21 if j % 2 else 0); z = 1.4 + j * 0.38
        if abs(x) < 1.0:
            c = cylinder('pd', 0.07, 0.01, (x, D / 2 - 0.08, z), dotm, rig, 0, rot=(math.pi / 2, 0, 0), seg=16)
# slot on the front panel
box('slotplate', (0.7, 0.05, 0.16), (0.55, -D / 2 - 0.01, 0.55), toon('slotp', "#e9e1cf"), rig, OL * 0.7, bevel=0.02)
box('slot', (0.52, 0.06, 0.05), (0.55, -D / 2 - 0.02, 0.55), INKF, rig, 0)
# stripes on the lower panel
for i in range(3):
    box('stripe', (W - 0.02, 0.02, 0.07), (0, -D / 2 - 0.005, 0.9 + i * 0.16),
        toon('strp', "#fff1d6" if i % 2 == 0 else "#f2c14e", paper=0.03), rig, 0)
# half curtain (left, tied)
def cur_fn(u, v):
    z = 1.3 + v * (H - 1.8)
    c = 0.25 + 0.75 * v ** 1.6
    x = -W / 2 + 0.2 + 0.9 * u * c
    return (x, -D / 2 + 0.2 + 0.05 * math.sin(u * math.pi * 10) / max(c, .3) ** .5, z)
grid_obj('curtain', 40, 12, cur_fn, REDM, rig, thick=0.03, outline=OL * 0.8)
sphere('curtie', 0.09, (-W / 2 + 0.35, -D / 2 + 0.18, 1.45), (1, 1, 1), GOLDM, rig, OL * 0.7, 16)
# sign with bulbs
box('sign', (1.9, 0.18, 0.62), (0, -D / 2 + 0.05, H + 0.55), CREAMM, rig, OL, bevel=0.06)
cu = bpy.data.curves.new('txt', 'FONT'); cu.body = 'PHOTO'; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
cu.size = 0.42; cu.extrude = 0.03; cu.bevel_depth = 0.008
tx = bpy.data.objects.new('txt', cu); link(tx, rig); tx.location = (0, -D / 2 - 0.08, H + 0.53)
tx.rotation_euler = (math.pi / 2, 0, 0); cu.materials.append(REDM)
BULB_ON = toon('bon', "#ffe066", hi="#fffbe0", paper=0.0)
BULB_OFF = toon('boff', "#e0b04a", paper=0.0)
BULBS = []
for i in range(12):
    a = i / 12
    if i < 5:   x, z = -0.85 + 1.7 * i / 4, H + 0.83
    elif i < 6: x, z = 0.95, H + 0.55
    elif i < 11: x, z = 0.85 - 1.7 * (i - 6) / 4, H + 0.27
    else:       x, z = -0.95, H + 0.55
    BULBS.append(sphere('bulb%d' % i, 0.055, (x, -D / 2 - 0.06, z), (1, 1, 1), BULB_ON, rig, OL * 0.5, 12))
# flash unit on top of the lintel
fl = empty('flashunit', (0.0, -D / 2 - 0.05, H - 0.28), rig)
box('fbox', (0.9, 0.3, 0.36), (0, 0, 0), toon('fb', "#3a3230", hi="#5a4f4a", paper=0.0), fl, OL, bevel=0.05)
FLASHWIN_ON = flat('fwon', "#ffffff"); FLASHWIN_OFF = toon('fwoff', "#cfe6f0", paper=0.0)
FW = box('fwin', (0.5, 0.05, 0.18), (-0.12, -0.16, 0.02), FLASHWIN_OFF, fl, OL * 0.6, bevel=0.03)
cylinder('lens', 0.1, 0.06, (0.3, -0.17, 0.0), toon('lensm', "#1f1b1a", hi="#6a8aa0", paper=0.0), fl, OL * 0.6,
         rot=(math.pi / 2, 0, 0), seg=24)

# stool + Noa
cylinder('stool', 0.32, 0.5, (0, 0.1, 0.5), toon('stoolm', "#c98d5a"), rig, OL)
NOA = hamster('noa', glasses=True, ol=0.024)
NOA['root'].parent = rig
NOA['shadow'].hide_render = True

# photo strip: 3 frames; hangs from the slot, grows downward
strip = empty('strip', (0.55, -D / 2 - 0.05, 0.55), rig)
SL = 1.55
paper_m = toon('stripm', "#fffaf0", shadow="#efe3cc", paper=0.03)
cardS = empty('cardS', (0, 0, 0), strip)
box('stripcard', (0.46, 0.012, SL), (0, 0, -SL / 2), paper_m, cardS, OL * 0.6)
photosE = empty('photosE', (0, 0, 0), strip)
PH = []
bgs = ["#f7b2c4", "#9fd8c8", "#ffd873"]
for k in range(3):
    zc = -0.28 - k * 0.5
    ph = empty('photo%d' % k, (0, -0.012, zc + SL), photosE); PH.append((ph, SL + zc))
    box('pbg', (0.38, 0.004, 0.4), (0, 0, 0), flat('pbg%d' % k, bgs[k]), ph, 0)
    sphere('ph_head', 0.12, (0, -0.006, -0.03 + 0.02 * k), (1.1, 0.1, 0.95), flat('phf', FUR), ph, 0.006, 16)
    for sx in (-1, 1):
        sphere('ph_ear', 0.04, (sx * 0.09, -0.006, 0.07 + 0.02 * k), (1, 0.1, 1), flat('phf', FUR), ph, 0.004, 12)
    box('ph_gl', (0.2, 0.004, 0.05), (0, -0.02, 0.0 + 0.02 * k), INKF, ph, 0)
    sphere('ph_arm', 0.035, ((-0.13, 0.13, 0.0)[k], -0.01, (0.08, 0.08, 0.14)[k]), (1, .1, 1.6), flat('phf', FUR), ph, 0.004, 12)
STRIP = strip

# flash pop sprites (in front of everything)
STAR = star_mesh('flashstar', 1.7, 0.28, 4, flat('fs', "#ffffff", alpha=0.95), None, (0, -D / 2 - 0.6, H - 0.3))
STAR2 = star_mesh('flashstar2', 1.1, 0.2, 4, flat('fs2', "#fffbe6", alpha=0.9), None, (0, -D / 2 - 0.62, H - 0.3))
HALO_M = flat('halo', "#ffffff", alpha=0.0)
HALO = cylinder('halo', 4.5, 0.01, (0, -3.2, 1.8), HALO_M, None, 0, rot=(math.pi / 2, 0, 0), seg=48)

cam = camera((2.2, -7.6, 2.4), (0.15, 0, 1.75), lens=40)
FLASHES = (0.62, 1.22, 1.82)


def setup(f):
    t = f / 30.0
    # booth pop-in + wiggle, and a hop on each flash
    pop = back(seg(t, 0.0, 0.32), 2.2)
    shake = sum(spring(t - fa, 4.0, 7.0) for fa in FLASHES)
    rig.scale = (max(1e-3, pop * (1 - 0.03 * shake)), max(1e-3, pop), max(1e-3, pop * (1 + 0.05 * shake)))
    rig.rotation_euler = (0, 0.03 * spring(t - 0.1, 2.0, 5.0), 0)
    # Noa poses (anticipation dip before each flash)
    armL = armR = 0.25; sq = 1.0; tilt = 0.0; lean = 0.0; zj = 0.0; turn = 0.0
    if t < 0.62:
        k = seg(t, 0.3, 0.55); armR = lerp(0.25, 2.6, back(k)); tilt = -0.15 * k
        sq = 1 - 0.1 * math.sin(math.pi * seg(t, 0.45, 0.62))
    elif t < 1.22:
        k = seg(t, 0.8, 1.1)
        armR = lerp(2.6, 2.9, k); armL = lerp(0.25, 2.9, back(k)); tilt = lerp(-0.15, 0.0, k)
        hop = seg(t, 0.95, 1.22); zj = 0.35 * math.sin(math.pi * hop); sq = 1 + 0.12 * math.sin(math.pi * hop)
    elif t < 1.82:
        k = seg(t, 1.35, 1.65)
        armR = lerp(2.9, 1.3, out(k)); armL = lerp(2.9, 0.4, out(k)); tilt = lerp(0.0, 0.3, back(k))
        lean = lerp(0, 0.18, back(k)); turn = lerp(0, -0.25, out(k))
    else:
        k = seg(t, 1.9, 2.3)
        armR = lerp(1.3, 0.3, out(k)); armL = 0.4; tilt = lerp(0.3, 0.0, out(k)); lean = lerp(0.18, 0, out(k))
        turn = lerp(-0.25, 0.35, out(seg(t, 2.1, 2.6)))   # looks down at the strip
    sq *= 1 - 0.08 * sum(math.exp(-12 * max(0, t - fa)) * (t > fa) for fa in FLASHES)
    pose(NOA, f, loc=(0, 0.1, 0.72 + zj), turn=turn, squash=sq, armL=armL, armR=armR, head_tilt=tilt, lean=lean)
    # flashes
    fl_amt = 0.0
    for fa in FLASHES:
        d = t - fa
        if 0 <= d < 0.3: fl_amt = max(fl_amt, math.exp(-10 * d))
    FW.material_slots[0].material = FLASHWIN_ON if fl_amt > 0.2 else FLASHWIN_OFF
    s = fl_amt
    STAR.scale = (s * 1.2,) * 3; STAR.rotation_euler = (0, t * 2, 0)
    STAR2.scale = (s,) * 3; STAR2.rotation_euler = (0, 0.78 + t * 2, 0)
    set_alpha(HALO_M, 0.6 * fl_amt)
    HALO.hide_render = fl_amt < 0.02
    STAR.hide_render = STAR2.hide_render = fl_amt < 0.02
    # bulbs chase
    for i, b in enumerate(BULBS):
        b.material_slots[0].material = BULB_ON if (i + int(t * 10)) % 3 else BULB_OFF
    # strip: chug out in three steps, overshoot, then flutter
    steps = [(2.0, 2.18), (2.24, 2.42), (2.48, 2.7)]
    L = 0.0
    for a, b in steps:
        L += (1 / 3) * back(seg(t, a, b), 1.6)
    L = clamp(L, 0, 1.05)
    cardS.scale = (1, 1, max(1e-3, L))
    d = L * SL
    photosE.location = (0, 0, -d)
    for ph, e in PH:
        vis = (-d + e + 0.2) < 0.02
        for c in ph.children_recursive: c.hide_render = not vis
    sw = 0.1 * math.sin((t - 2.0) * 9) * math.exp(-1.5 * max(0, t - 2.7)) if t > 2.0 else 0
    STRIP.rotation_euler = (-0.25 * L - 0.1 * spring(t - 2.7, 2.5, 3), sw, 0)
    STRIP.hide_render = t < 2.0


render_frames(out_dir, frames, setup)
