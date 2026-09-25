"""Shot D — curtain call (film ~t=187-190s, 90 frames, RGBA 1920x1080).
Noa + four party-hat hamsters: "ta-da" stretch, a rippling bow (Noa first, the line follows),
bounce back up; Noa tips the sunglasses down and winks while the line cheers.
Deterministic confetti rains the whole time.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from toonlib import *

N = 90
FILM = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'film'))
frames, out_dir = frames_arg(N)
out_dir = out_dir or os.path.join(FILM, 'assets', '3d', 'curtaincall')

reset((1920, 1080), transparent=True, samples=6)

CAST = []
HATS = ["#f39bb6", "#f7a8c8", "#f39bb6", "#f7a8c8"]
xs = [-3.1, -1.6, 1.6, 3.1]
for i, x in enumerate(xs):
    R = hamster('ex%d' % i, glasses=False, hat=True, hat_color=HATS[i], ol=0.022)
    CAST.append(dict(R=R, x=x, y=0.35 + 0.12 * abs(x) / 3.1, delay=0.06 + 0.05 * abs(x), noa=False, i=i + 1))
NOA = hamster('noa', glasses=True, ol=0.024)
CAST.append(dict(R=NOA, x=0.0, y=-0.1, delay=0.0, noa=True, i=0))
WINKSTAR = star_mesh('winkstar', 0.14, 0.035, 4, flat('ws', "#fff3b0"), NOA['head'], (0.34, -0.55, 0.3))
WINKSTAR.scale = (0, 0, 0)

# confetti
CONF_COLS = ["#e0574a", "#f2c14e", "#f39bb6", "#8fd3c1", "#7fb4e8", "#e9a257", "#b9a0e6"]
cmats = [toon('cf%d' % i, c, paper=0.0, hi=False, thresh=0.5) for i, c in enumerate(CONF_COLS)]
CONF = []
for i in range(170):
    shape = i % 3
    if shape == 0:
        o = box('cf', (0.16, 0.012, 0.08), (0, 0, 0), cmats[i % len(cmats)], None, 0)
    elif shape == 1:
        o = cylinder('cf', 0.055, 0.012, (0, 0, 0), cmats[(i * 3) % len(cmats)], None, 0, seg=12)
    else:
        o = star_mesh('cf', 0.08, 0.035, 5, cmats[(i * 5) % len(cmats)], None)
    CONF.append(dict(o=o, x=(hsh(i, 1) - 0.5) * 12, y=-1.0 + hsh(i, 2) * 3.0, t0=-1.6 + hsh(i, 3) * 3.6,
                     v=1.9 + hsh(i, 4) * 1.2, ph=hsh(i, 5) * 6.28, w=3 + hsh(i, 6) * 5, sway=0.2 + hsh(i, 7) * 0.35))

cam = camera((0, -9.5, 2.2), (0, 0, 1.15), lens=36)


def actor(c, t, f):
    R = c['R']; d = c['delay']; tt = t - d
    # 1) ta-da: squash (anticipation) -> stretch with arms up
    sq = 1.0; armL = armR = 0.25; bow = 0.0; zj = 0.0; tilt = 0.0
    if tt < 0.18:
        sq = 1 - 0.18 * math.sin(math.pi / 2 * seg(tt, 0.0, 0.18))
    elif tt < 0.5:
        k = seg(tt, 0.18, 0.5)
        sq = lerp(0.82, 1.12, back(k, 2.5)); armL = armR = lerp(0.25, 2.5, back(k))
        zj = 0.25 * math.sin(math.pi * k)
    elif tt < 0.75:                                   # arms come in, lean into the bow
        k = seg(tt, 0.5, 0.75)
        sq = lerp(1.12, 1.0, k); armL = armR = lerp(2.5, 0.6, ease(k)); bow = lerp(0, 0.2, k)
    elif tt < 1.35:                                   # the bow (with a small hold wobble)
        k = seg(tt, 0.75, 0.98)
        bow = lerp(0.2, 0.85, back(k, 1.4)) + 0.03 * math.sin((tt - 0.98) * 12) * (tt > 0.98)
        armL = armR = lerp(0.6, 0.15, k); sq = 1 - 0.06 * k
    elif tt < 1.75:                                   # spring back up
        k = seg(tt, 1.35, 1.6)
        bow = lerp(0.85, 0.0, back(k, 2.2)) if k < 1 else -0.12 * spring(tt - 1.6, 2.5, 6) * 3
        sq = lerp(0.94, 1.08, out(k)) - (0.08 * seg(tt, 1.6, 1.75))
        armL = armR = 0.3
    else:
        k = tt - 1.75
        sq = 1.0 + 0.04 * math.sin(k * 10) * math.exp(-2 * k)
        if not c['noa']:                              # extras cheer: hop hop, paws up
            ph = (k * 2.4 + c['i'] * 0.25) % 1.0
            zj = 0.32 * max(0.0, math.sin(math.pi * min(1.0, ph / 0.6)))
            sq = 1 + 0.12 * math.sin(math.pi * min(1.0, ph / 0.6)) if ph < 0.6 else 1 - 0.15 * math.sin(math.pi * (ph - 0.6) / 0.4)
            armL = armR = 2.4 + 0.3 * math.sin(k * 14 + c['i'])
            tilt = 0.12 * math.sin(k * 6 + c['i'])
        else:
            armL = 0.3
            armR = lerp(0.3, 2.3, back(seg(tt, 1.75, 2.0)))    # paw up to the shades
            armR = lerp(armR, 0.9, out(seg(tt, 2.25, 2.5)))
            tilt = lerp(0.0, 0.16, out(seg(tt, 2.05, 2.3)))
    pose(R, f, loc=(c['x'], c['y'], zj), squash=sq, armL=armL, armR=armR, bow=bow, head_tilt=tilt,
         turn=-c['x'] * 0.05)
    if R.get('shadow'):
        s = 1 - 0.35 * clamp(zj / 0.35)
        R['shadow'].scale = (s, 0.55 * s, 1)
    if c['noa']:
        # tip the shades down the nose, reveal a wink
        g = back(seg(tt, 1.95, 2.2), 2.0) - 0.0
        R['glasses'].location = (0, -0.05 * g, -0.13 * g)
        R['glasses'].rotation_euler = (0.25 * g, 0, 0)
        show = g > 0.45
        eo = R['eyes_open']; ec = R['eyes_closed']
        eo[0].hide_render = eo[1].hide_render = not show     # left eye open (+ highlight)
        ec[1].hide_render = not show                        # right eye winks
        w = seg(tt, 2.2, 2.6)
        ws = math.sin(math.pi * w) * 1.2
        WINKSTAR.scale = (ws, ws, ws); WINKSTAR.rotation_euler = (0, w * 2.5, 0)


def setup(f):
    t = f / 30.0
    for c in CAST:
        actor(c, t, f)
    for i, c in enumerate(CONF):
        tt = t - c['t0']
        z = 6.2 - c['v'] * tt
        o = c['o']
        if tt < 0 or z < -0.3:
            o.location = (0, 0, -50); continue
        o.location = (c['x'] + c['sway'] * math.sin(tt * 3 + c['ph']), c['y'], z)
        o.rotation_euler = (tt * c['w'] + c['ph'], tt * c['w'] * 0.7, math.sin(tt * 2 + c['ph']))


render_frames(out_dir, frames, setup)
