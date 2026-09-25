"""Shot A — fly-through (film t=0.0-2.4s, 72 frames, opaque 1920x1080 JPG).
Camera starts nose-to-nose with red velvet house-curtain folds, the curtains whip apart
(anticipation tug, overshoot), camera flies through the gap into the bright puppet stage
where Noa hops round to face camera, waves, and the sunglasses glint.
Ends framing the proscenium like the 2D stage so the HTML can crossfade.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from toonlib import *

N = 72
FILM = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'film'))
frames, out_dir = frames_arg(N)
out_dir = out_dir or '/tmp/blender-shots/flythrough'   # PNG master; finalize.py converts to JPG

reset((1920, 1080), transparent=False, samples=5, world="#fbeed3")

VEL = toon('velvet', "#c8372d", shadow="#8f2320", hi="#e25a48", thresh=0.47, hi_at=0.9, paper=0.09)
VEL2 = toon('velvet2', "#b52f28", shadow="#7e1c1b", hi="#d44a3c", thresh=0.47, hi_at=0.9, paper=0.09)
GOLDM = toon('gold', GOLD, shadow="#b9801f", hi="#fff0a8", thresh=0.4, hi_at=0.82, paper=0.05)
WOOD = toon('wood', "#c98d5a", paper=0.1)
OL = 0.035

# ---------------------------------------------------------------- floor (planks)
m, nt, outn = None, None, None
floor_m = bpy.data.materials.new('floor'); floor_m.use_nodes = True
nt = floor_m.node_tree; nt.nodes.clear(); Nn, Ln = nt.nodes, nt.links
o = Nn.new('ShaderNodeOutputMaterial'); tc = Nn.new('ShaderNodeTexCoord')
sep = Nn.new('ShaderNodeSeparateXYZ'); Ln.new(tc.outputs['Object'], sep.inputs[0])
mul = Nn.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 1.6
Ln.new(sep.outputs['X'], mul.inputs[0])
fr = Nn.new('ShaderNodeMath'); fr.operation = 'FRACT'; Ln.new(mul.outputs[0], fr.inputs[0])
fl = Nn.new('ShaderNodeMath'); fl.operation = 'FLOOR'; Ln.new(mul.outputs[0], fl.inputs[0])
md = Nn.new('ShaderNodeMath'); md.operation = 'PINGPONG'; md.inputs[1].default_value = 1.0
Ln.new(fl.outputs[0], md.inputs[0])
rp = Nn.new('ShaderNodeValToRGB'); rp.color_ramp.interpolation = 'CONSTANT'
rp.color_ramp.elements[0].color = lin("#d49a63"); rp.color_ramp.elements[1].position = 0.5
rp.color_ramp.elements[1].color = lin("#c78853")
Ln.new(md.outputs[0], rp.inputs[0])
ln = Nn.new('ShaderNodeMath'); ln.operation = 'LESS_THAN'; ln.inputs[1].default_value = 0.035
Ln.new(fr.outputs[0], ln.inputs[0])
mx = Nn.new('ShaderNodeMix'); mx.data_type = 'RGBA'
Ln.new(ln.outputs[0], mx.inputs['Factor']); Ln.new(rp.outputs['Color'], mx.inputs[6])
mx.inputs[7].default_value = lin("#8a5a3a")
nz = Nn.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 2.0
mp = Nn.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (6, 0.4, 1)
Ln.new(tc.outputs['Object'], mp.inputs[0]); Ln.new(mp.outputs[0], nz.inputs['Vector'])
mr = Nn.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.9; mr.inputs['To Max'].default_value = 1.06
Ln.new(nz.outputs['Fac'], mr.inputs[0])
mm = Nn.new('ShaderNodeMix'); mm.data_type = 'RGBA'; mm.blend_type = 'MULTIPLY'; mm.inputs['Factor'].default_value = 1
Ln.new(mx.outputs[2], mm.inputs[6]); Ln.new(mr.outputs[0], mm.inputs[7])
em = Nn.new('ShaderNodeEmission'); Ln.new(mm.outputs[2], em.inputs[0]); Ln.new(em.outputs[0], o.inputs[0])
box('floor', (18, 8.0, 0.2), (0, 1.8, -0.1), floor_m)
box('apron', (18, 0.25, 3.0), (0, -2.35, -1.5), toon('apronm', "#a8683f", paper=0.08), None, OL)
box('pit', (30, 12, 0.2), (0, -8.5, -3.0), toon('pitm', "#e7c9a0", paper=0.06))

# ---------------------------------------------------------------- backdrop: sunburst
bd = bpy.data.materials.new('sunburst'); bd.use_nodes = True
nt = bd.node_tree; nt.nodes.clear(); Nn, Ln = nt.nodes, nt.links
o = Nn.new('ShaderNodeOutputMaterial'); tc = Nn.new('ShaderNodeTexCoord')
sep = Nn.new('ShaderNodeSeparateXYZ'); Ln.new(tc.outputs['Object'], sep.inputs[0])
zc = Nn.new('ShaderNodeMath'); zc.operation = 'SUBTRACT'; zc.inputs[1].default_value = 2.9
Ln.new(sep.outputs['Z'], zc.inputs[0])
at = Nn.new('ShaderNodeMath'); at.operation = 'ARCTAN2'
Ln.new(zc.outputs[0], at.inputs[0]); Ln.new(sep.outputs['X'], at.inputs[1])
k = Nn.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = 22 / (2 * math.pi)
Ln.new(at.outputs[0], k.inputs[0])
fr = Nn.new('ShaderNodeMath'); fr.operation = 'FRACT'; Ln.new(k.outputs[0], fr.inputs[0])
rp = Nn.new('ShaderNodeValToRGB'); rp.color_ramp.interpolation = 'CONSTANT'
rp.color_ramp.elements[0].color = lin("#fdf2d2"); rp.color_ramp.elements[1].position = 0.5
rp.color_ramp.elements[1].color = lin("#f9dfa4")
Ln.new(fr.outputs[0], rp.inputs[0])
# radial glow toward the centre
vl = Nn.new('ShaderNodeCombineXYZ'); Ln.new(sep.outputs['X'], vl.inputs[0]); Ln.new(zc.outputs[0], vl.inputs[2])
ln_ = Nn.new('ShaderNodeVectorMath'); ln_.operation = 'LENGTH'; Ln.new(vl.outputs[0], ln_.inputs[0])
gr = Nn.new('ShaderNodeMapRange'); gr.inputs['From Min'].default_value = 0.5; gr.inputs['From Max'].default_value = 4.5
gr.inputs['To Min'].default_value = 1.0; gr.inputs['To Max'].default_value = 0.0
Ln.new(ln_.outputs[1], gr.inputs[0])
mx = Nn.new('ShaderNodeMix'); mx.data_type = 'RGBA'
Ln.new(gr.outputs[0], mx.inputs['Factor']); Ln.new(rp.outputs['Color'], mx.inputs[6])
mx.inputs[7].default_value = lin("#fff8e4")
em = Nn.new('ShaderNodeEmission'); Ln.new(mx.outputs[2], em.inputs[0]); Ln.new(em.outputs[0], o.inputs[0])
box('backdrop', (18, 0.1, 10), (0, 5.0, 4.0), bd)

# painted flats: hills + clouds + sun (theatre cut-outs)
def hill(name, x0, x1, base, top, bumps, color, y, ph=0.0):
    pts = [(x0, base)]
    n = 60
    for i in range(n + 1):
        u = i / n; x = x0 + (x1 - x0) * u
        pts.append((x, top + 0.35 * math.sin(u * math.pi * bumps + ph) * math.sin(u * math.pi)))
    pts.append((x1, base))
    return cutout(name, pts, 0.06, toon(name + 'm', color, paper=0.08), None, (0, y, 0), 0.03)


hill('hillb', -8, 8, -0.2, 1.35, 3, "#bfe3b4", 4.4, 0.6)
hill('hillf', -8, 8, -0.2, 0.75, 2, "#9fd3a3", 3.8, 2.1)
cw = toon('cloudm', "#ffffff", shadow="#e8eef4", paper=0.04)
for i, (cx, cz, s) in enumerate(((-3.6, 4.1, 1.0), (3.4, 4.6, 0.8), (1.2, 5.6, 0.6), (-1.8, 5.4, 0.5))):
    pts = cloud_pts([(-0.55 * s, 0, 0.42 * s), (0, 0.18 * s, 0.55 * s), (0.6 * s, 0, 0.4 * s), (0.05 * s, -0.12 * s, 0.4 * s)])
    c = cutout('cloud%d' % i, pts, 0.08, cw, None, (cx, 4.2 - 0.3 * i, cz), 0.03)
    polyline('string%d' % i, [(cx, 4.2 - 0.3 * i, cz + 0.4 * s), (cx, 4.2 - 0.3 * i, cz + 2.2), (cx, 4.2 - 0.3 * i, 9)], 0.012)
sun = cylinder('sun', 0.7, 0.06, (0, 4.6, 2.9), toon('sunm', "#ffd257", hi="#fff1a8", paper=0.05), None, 0.03,
               rot=(math.pi / 2, 0, 0), seg=48)
SUN = sun

# ---------------------------------------------------------------- proscenium
OPEN_W, OPEN_H, PY = 4.3, 4.6, -1.9
wall_m = toon('wall', "#d2493b", shadow="#a8322a", paper=0.08)
box('wallL', (6, 0.4, 12), (-OPEN_W - 3, PY, 3.0), wall_m, None, OL)
box('wallR', (6, 0.4, 12), (OPEN_W + 3, PY, 3.0), wall_m, None, OL)
box('wallT', (20, 0.4, 5), (0, PY, OPEN_H + 2.5), wall_m, None, OL)
for sx in (-1, 1):
    box('trimV', (0.22, 0.3, OPEN_H + 0.2), (sx * (OPEN_W + 0.11), PY - 0.2, OPEN_H / 2 - 0.1), GOLDM, None, OL * 0.8,
        bevel=0.05)
box('trimT', (2 * OPEN_W + 0.44, 0.3, 0.22), (0, PY - 0.2, OPEN_H + 0.11), GOLDM, None, OL * 0.8, bevel=0.05)
# crest
cylinder('crest', 0.42, 0.18, (0, PY - 0.3, OPEN_H + 0.45), GOLDM, None, OL, rot=(math.pi / 2, 0, 0), seg=40)
star_mesh('creststar', 0.28, 0.11, 5, toon('crs', "#fff3c4", paper=0.0), None, (0, PY - 0.42, OPEN_H + 0.45))

# valance with scallops + gold trim
VAL_TOP, VAL_BOT, SC_W = OPEN_H - 0.02, OPEN_H - 0.8, 1.075


def val_fn(u, v):
    x = -OPEN_W + 2 * OPEN_W * u
    zb = VAL_BOT - 0.28 * abs(math.sin(math.pi * x / SC_W + math.pi / 2)) + 0.28
    z = lerp(zb, VAL_TOP, v)
    return (x, PY - 0.02 + 0.05 * math.sin(x * 9.0) * (1 - v * 0.5), z)


grid_obj('valance', 240, 8, val_fn, VEL2, None, thick=0.08, outline=OL)
trim = [val_fn(i / 240, 0.0) for i in range(241)]
trim = [(x, y - 0.07, z + 0.03) for x, y, z in trim]
polyline('valtrim', trim[::3], 0.05, GOLDM)
for i in range(9):
    x = -OPEN_W + SC_W * (i + 0.5) - 0.0
    if abs(x) > OPEN_W: continue
    zb = val_fn((x + OPEN_W) / (2 * OPEN_W), 0)[2]
    sphere('tassel%d' % i, 0.09, (x, PY - 0.1, zb - 0.1), (1, 1, 1.3), GOLDM, None, OL * 0.7, 16)


# tied side curtains
def side_fn(sx):
    Wd, H, zt = 1.9, OPEN_H - 0.4, 1.55

    def fn(u, v):
        z = v * H
        if z > zt:
            c = 0.18 + 0.82 * ((z - zt) / (H - zt)) ** 1.3
        else:
            c = 0.18 + 0.32 * ((zt - z) / zt) ** 1.2
        xo = sx * OPEN_W
        x = xo - sx * Wd * u * c
        A = 0.07 / max(0.25, c) ** 0.5
        y = PY + 0.45 + A * math.sin(u * math.pi * 12) + 0.03 * math.sin(u * 37)
        return (x, y, z)
    return fn


for sx in (-1, 1):
    grid_obj('side%d' % sx, 90, 30, side_fn(sx), VEL, None, thick=0.04, outline=OL)
    torus('tie%d' % sx, 0.3, 0.06, (sx * (OPEN_W - 0.28), PY + 0.45, 1.55), (1, 0.7, 1.4), GOLDM, None, OL * 0.8,
          rot=(0, 0, 0))
    sphere('tieball%d' % sx, 0.11, (sx * (OPEN_W - 0.62), PY + 0.3, 1.4), (1, 1, 1.4), GOLDM, None, OL * 0.8, 16)
    polyline('tierope%d' % sx, [(sx * (OPEN_W - 0.5), PY + 0.3, 1.55), (sx * (OPEN_W - 0.62), PY + 0.28, 1.2),
                                (sx * (OPEN_W - 0.6), PY + 0.28, 1.0)], 0.03, GOLDM)

# apron trim + footlights
box('aprontrim', (18, 0.3, 0.1), (0, -2.3, -0.05), GOLDM, None, OL * 0.7)
FOOT = []
for i in range(-6, 7):
    FOOT.append(sphere('foot%d' % i, 0.13, (i * 0.72, -2.25, 0.02), (1, 0.8, 0.7),
                       toon('footm', "#ffe27a", hi="#fffbe0", paper=0.02), None, OL * 0.7, 20))
    cylinder('footb%d' % i, 0.16, 0.08, (i * 0.72, -2.25, -0.02), GOLDM, None, OL * 0.6, seg=24)
for sx in (-1, 1):
    polyline('suneye%d' % sx, [(sx * 0.22 - 0.1, 4.52, 3.0), (sx * 0.22, 4.52, 3.1), (sx * 0.22 + 0.1, 4.52, 3.0)], 0.025)
    sphere('suncheek%d' % sx, 0.1, (sx * 0.38, 4.53, 2.8), (1, 0.3, 0.7), flat('sunblush', "#f7a08a", alpha=0.8), None)
polyline('sunsmile', [(-0.14, 4.52, 2.72), (0, 4.52, 2.62), (0.14, 4.52, 2.72)], 0.025)

# floor light pool
pool = cylinder('pool', 1.8, 0.002, (0, -0.3, 0.004), flat('poolm', "#fff4c8", alpha=0.55), None)
pool.scale = (1.25, 0.6, 1)

# ---------------------------------------------------------------- house curtain (parts)
HY, HW, HH = -11.2, 5.2, 9.0


def house_fn(sx, p, sway):
    def fn(u, v):
        z = -1.5 + v * HH
        pz = clamp(p * 1.18 - 0.18 * (1 - v))            # bottom lags the top
        c = lerp(1.0, 0.09, out(pz))
        xo = sx * (HW + 0.05)
        xr = xo - sx * HW * u                              # rest (u=1 -> centre seam)
        x = xo + (xr - xo) * c + sx * 0.0 + sway * (1 - v) ** 2 * sx
        A = 0.14 * (1 + 1.6 * pz)
        ph = u * math.pi * 22
        y = HY + A * (math.sin(ph) + 0.25 * math.sin(2.3 * ph + 1)) + (0.03 if sx > 0 else 0)
        return (x, y, z)
    return fn


houseL, updL = grid_obj('houseL', 160, 16, house_fn(-1, 0, 0), VEL, None, thick=0.05, outline=OL * 0.7)
houseR, updR = grid_obj('houseR', 160, 16, house_fn(1, 0, 0), VEL2, None, thick=0.05, outline=OL * 0.7)

# ---------------------------------------------------------------- Noa
NOA = hamster('noa', glasses=True, ol=0.024)
cam = camera((0, -12.0, 1.8), (0, 0, 1.5), lens=30)


def setup(f):
    t = f / 30.0
    # curtain: tiny inward tug (anticipation) then fast part with overshoot
    tug = -0.05 * math.sin(math.pi * seg(t, 0.12, 0.42))
    p = tug + ease(seg(t, 0.42, 1.5))
    sway = 0.45 * spring(t - 1.5, 1.6, 3.0)
    updL(house_fn(-1, max(0.0, p), sway)); updR(house_fn(1, max(0.0, p), sway))
    # camera: creep, then rush through the gap, settle with a soft overshoot
    k = ease(seg(t, 0.3, 2.05))
    y = lerp(-12.05, -10.0, k) + 0.1 * spring(t - 2.05, 1.2, 4.0)
    z = lerp(1.65, 2.05, k)
    look = (lerp(0.15, 0.0, k), 0.0, lerp(1.55, 1.75, k))
    aim(cam, (lerp(0.25, 0.0, k), y, z), look, roll=lerp(0.06, 0.0, out(seg(t, 0.2, 2.0))))
    cam.data.lens = lerp(26, 30, k)
    # Noa: facing the backdrop, turns with a hop at 1.0s, lands, waves, glint
    a = seg(t, 0.95, 1.12); air = seg(t, 1.12, 1.48)
    turn = lerp(math.pi * 0.85, 0.0, out(air)) if t > 1.12 else math.pi * 0.85 + 0.15 * math.sin(t * 3)
    zj = 0.75 * math.sin(math.pi * air) if 0 < air < 1 else 0.0
    if t < 0.95:
        sq = 1.0 + 0.03 * math.sin(t * 9)
    elif t < 1.12:
        sq = 1.0 - 0.28 * math.sin(math.pi / 2 * a)
    elif t < 1.48:
        sq = 1.0 + 0.18 * math.sin(math.pi * air)
    else:
        sq = 1.0 - 0.25 * math.exp(-9 * (t - 1.48)) * math.cos(2 * math.pi * 3 * (t - 1.48))
    wave = seg(t, 1.45, 1.7)
    armR = lerp(0.2, 2.55, back(wave)) + (0.35 * math.sin((t - 1.6) * 16) if t > 1.6 else 0)
    armL = lerp(0.1, 0.9, out(seg(t, 1.12, 1.4))) - 0.5 * out(seg(t, 1.6, 1.9))
    pose(NOA, f, loc=(0, -0.3, zj), turn=turn, squash=sq, armR=armR, armL=armL,
         head_tilt=0.12 * math.sin(math.pi * seg(t, 1.5, 2.4)), lean=0.05 * spring(t - 1.48, 2, 4))
    NOA['shadow'].scale = (1 - 0.35 * math.sin(math.pi * air) if 0 < air < 1 else 1, 0.55, 1)
    g = seg(t, 1.62, 2.05)
    gs = math.sin(math.pi * g) * 1.1
    NOA['glint'].scale = (gs, gs, gs)
    NOA['glint'].rotation_euler = (0, g * 1.6, 0)
    SUN.scale = (1 + 0.04 * math.sin(t * 6),) * 3


render_frames(out_dir, frames, setup)
