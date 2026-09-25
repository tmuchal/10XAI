"""Shot C — coin funnel (film ~t=163-166s, 90 frames, RGBA 1080x1080).
Shiny ink-rimmed gold coins rain into a striped circus funnel, whirl down the cone,
drop out of the spout and bounce into a pile; the last coin leaps at camera,
spins and lands face-on with a glint.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from toonlib import *

N = 90
FILM = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'film'))
frames, out_dir = frames_arg(N)
out_dir = out_dir or os.path.join(FILM, 'assets', '3d', 'coinfunnel')

reset((1080, 1080), transparent=True, samples=6)
OL = 0.03
GOLDC = toon('coin', "#f2c14e", shadow="#c98a22", hi="#fff1a6", thresh=0.36, hi_at=0.8, paper=0.03)
GOLDE = toon('coinemb', "#ffd966", shadow="#d99a2b", hi="#fff8d0", thresh=0.36, hi_at=0.8, paper=0.0)
CREAMF = toon('funnelc', "#fff4e0", paper=0.06)
REDF = toon('funnelr', "#e0574a", shadow="#a8322a", paper=0.06)
GOLDM = toon('gold', GOLD, shadow="#b9801f", hi="#fff0a8", paper=0.05)

# ------------------------------------------------ funnel (lathe, circus stripes)
PROF = [(1.55, 3.3), (1.45, 3.15), (0.95, 2.55), (0.5, 2.0), (0.27, 1.62), (0.24, 1.35), (0.25, 1.12)]


def prof(v):
    x = v * (len(PROF) - 1); i = min(int(x), len(PROF) - 2); f = x - i
    return lerp(PROF[i][0], PROF[i + 1][0], f), lerp(PROF[i][1], PROF[i + 1][1], f)


FUN_Z = 0.0
NU = 96


def fun_fn(u, v):
    r, z = prof(v); a = 2 * math.pi * u
    wob = 1 + 0.015 * math.sin(a * 5 + 1.3)
    return (r * wob * math.cos(a), r * wob * math.sin(a), z)


funnel = empty('funnelrig', (0, 0, 0))
fo, _ = grid_obj('funnel', NU, 24, fun_fn, CREAMF, funnel, thick=0.05)
fo.data.materials.append(REDF)
for p in fo.data.polygons:
    i = p.index % NU
    p.material_index = (i // (NU // 16)) % 2
add_outline(fo, OL)
torus('rim', 1.52, 0.07, (0, 0, 3.3), (1, 1, 1), GOLDM, funnel, OL * 0.8)
torus('spoutrim', 0.26, 0.045, (0, 0, 1.12), (1, 1, 1), GOLDM, funnel, OL * 0.7)


def cone_z(r):
    # invert profile (monotone for r in [0.27, 1.45])
    for i in range(len(PROF) - 1):
        (r0, z0), (r1, z1) = PROF[i], PROF[i + 1]
        if min(r0, r1) <= r <= max(r0, r1) and r0 != r1:
            return lerp(z0, z1, (r - r0) / (r1 - r0))
    return PROF[-1][1]


# ------------------------------------------------ coins
def make_coin(name, r=0.3, d=0.08):
    root = empty(name)
    cylinder(name + '_b', r, d, (0, 0, 0), GOLDC, root, OL * 0.8, seg=40)
    for sz in (1, -1):
        st = star_mesh(name + '_st', r * 0.55, r * 0.24, 5, GOLDE, root, (0, 0, sz * (d / 2 + 0.004)))
        st.rotation_euler = (sz * math.pi / 2, 0, 0)
        torus(name + '_ring', r * 0.78, 0.012, (0, 0, sz * (d / 2 + 0.002)), (1, 1, 0.3),
              toon('ringm', "#d99a2b", paper=0.0), root, 0)
    return root


NC = 16
COINS = []
for i in range(NC):
    c = make_coin('coin%d' % i)
    sh = cylinder('csh%d' % i, 0.3, 0.002, (0, 0, 0.002), flat('csh', INK, alpha=0.16), None)
    sh.scale = (1, 0.55, 1)
    t0 = 0.05 + i * 0.105
    a0 = hsh(i, 1) * 2 * math.pi
    # rest spot in the pile
    ang = hsh(i, 2) * 2 * math.pi; rad = 0.25 + 0.95 * hsh(i, 3) ** 0.7
    rest = (rad * math.cos(ang) * 1.25, -0.2 + rad * math.sin(ang) * 0.6, 0.04 + 0.075 * (1 - rad) * 2.2)
    COINS.append(dict(o=c, sh=sh, t0=t0, a0=a0, rest=rest, spin=hsh(i, 4) * 6 + 4,
                      x0=(hsh(i, 5) - 0.5) * 2.4, y0=(hsh(i, 6) - 0.5) * 1.2))
HERO = make_coin('hero', 0.34, 0.09)
GLINT = star_mesh('glint', 0.5, 0.08, 4, flat('gl', "#fffbe8"), HERO, (0.12, 0, 0.12))
GLINT.rotation_euler = (math.pi / 2, 0, 0)
FALL, SPIRAL, DROP = 0.32, 0.62, 0.5


def coin_state(c, t):
    """Returns (pos, rot, visible, on_ground) at time t."""
    d = t - c['t0']
    if d < 0:
        return None
    ent_r = 1.2
    ent = Vector((ent_r * math.cos(c['a0']), ent_r * math.sin(c['a0']), cone_z(ent_r) + 0.12))
    if d < FALL:                          # rain in from above, tumbling
        k = d / FALL
        p0 = Vector((c['x0'], c['y0'], 5.6))
        p = p0.lerp(ent, k * k)
        return p, (k * c['spin'], k * 3.0, 0), False
    d -= FALL
    if d < SPIRAL:                        # whirl down the cone
        k = d / SPIRAL
        r = lerp(ent_r, 0.2, ease(k) * 0.4 + k * 0.6)
        a = c['a0'] + (1 - (1 - k) ** 2) * 3.2 * math.pi
        z = cone_z(max(r, 0.27)) + 0.1 if r > 0.27 else lerp(cone_z(0.27) + 0.1, 1.3, (0.27 - r) / 0.07)
        p = Vector((r * math.cos(a), r * math.sin(a), z))
        # coin rolls on edge along the wall
        return p, (math.pi / 2 - 0.5, 0, a + math.pi / 2), False
    d -= SPIRAL
    # drop from spout then bounce toward rest spot
    rest = Vector(c['rest'])
    start = Vector((0, 0, 1.05))
    T1 = 0.28                              # first fall
    if d < T1:
        k = d / T1
        p = start.lerp(Vector((rest.x * 0.55, rest.y * 0.55, rest.z)), k)
        p.z = lerp(1.05, rest.z, k * k)
        return p, (d * 14, d * 9, 0), True
    d -= T1
    bounces = [(0.26, 0.38), (0.16, 0.14), (0.1, 0.05)]
    frac = 0.55
    for i, (T, h) in enumerate(bounces):
        if d < T:
            k = d / T
            f0 = frac; f1 = frac + (1 - frac) * 0.6
            q = rest * 1.0
            p = Vector((lerp(rest.x * f0, rest.x * f1, k), lerp(rest.y * f0, rest.y * f1, k), rest.z + h * 4 * k * (1 - k)))
            return p, (math.pi * (1 - k) * (1 if i % 2 else -1) * 0.5, 0, 0), True
        d -= T; frac = frac + (1 - frac) * 0.6
    wob = 0.18 * math.exp(-5 * d) * math.sin(d * 30)
    return rest, (wob, wob * 0.5, c['spin']), True


cam = camera((0, -8.6, 5.4), (0, 0, 1.55), lens=44)


def setup(f):
    t = f / 30.0
    # funnel pops in, then jiggles as coins hit it
    pop = back(seg(t, 0.0, 0.3), 2.0)
    hits = sum(spring(t - (c['t0'] + FALL), 3.5, 6.0) * 0.4 for c in COINS)
    funnel.scale = (max(1e-3, pop * (1 + 0.03 * hits)), max(1e-3, pop * (1 + 0.03 * hits)), max(1e-3, pop * (1 - 0.04 * hits)))
    for c in COINS:
        st = coin_state(c, t)
        if st is None:
            c['o'].location = (0, 0, -50); c['sh'].hide_render = True
            continue
        p, rot, ground = st
        c['o'].location = p; c['o'].rotation_euler = rot
        c['sh'].hide_render = not ground
        c['sh'].location = (p.x + 0.05, p.y + 0.04, 0.002)
        s = 1 - 0.4 * clamp(p.z / 1.2)
        c['sh'].scale = (s, 0.55 * s, 1)
    # hero coin: shoots out of the spout at 2.05s, leaps at camera spinning, lands face-on
    k = seg(t, 2.02, 2.75)
    if t < 2.02:
        HERO.location = (0, 0, -50)
    else:
        e = out(k)
        cp = cam.location
        target = Vector((0, 0, 1.05)).lerp(Vector(cp), 0.74)
        target.z -= 0.25
        p = Vector((0, 0, 1.05)).lerp(target, e)
        p.z += 1.0 * math.sin(math.pi * min(1, k * 1.1)) * (1 - e * 0.6)
        HERO.location = p
        spin = (1 - e) * 5 * math.pi
        # face the camera at the end (coin axis -> towards camera)
        d = (Vector(cp) - p).normalized()
        base = d.to_track_quat('Z', 'Y').to_euler()
        HERO.rotation_euler = base
        HERO.rotation_euler.rotate_axis('X', spin)
        wob = 0.25 * spring(t - 2.75, 2.5, 4.0)
        HERO.rotation_euler.rotate_axis('Y', wob)
        sc = 1 + 0.15 * spring(t - 2.75, 3.0, 5.0)
        HERO.scale = (sc, sc, sc)
    g = seg(t, 2.72, 3.0)
    gs = math.sin(math.pi * g) * 1.0
    GLINT.scale = (gs, gs, gs)
    GLINT.rotation_euler = (math.pi / 2, g * 2.0, 0)
    GLINT.location = (0.12, -0.12, 0.06)


render_frames(out_dir, frames, setup)
