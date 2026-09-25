"""toonlib — shared helpers for the 10XAI explainer's Blender shots.

Look: bright hand-drawn watercolor puppet theater.
  * Emission-only "fake light" toon shading (N.L against a fixed key direction,
    constant colour ramp) -> no light sampling, no noise, ~2 s/frame at 1080p on 4 CPU cores.
  * Ink outlines via inverted hull (Solidify, flipped normals, backfacing -> transparent).
  * Paper/watercolor mottling from a 4D noise whose W steps at 8 fps (matches the 2D "line boil").
Every shot script drives animation analytically per frame (pure functions of the frame
number), so renders are fully deterministic.
"""
import bpy, bmesh, math, os, time
from mathutils import Vector, Euler

INK = "#2b2320"
FUR = "#e9a257"
CREAM = "#f7d9a8"
PINK = "#f2a0a8"
BLUSH = "#f48f9e"
SCARF = "#f2c14e"
RED = "#c8372d"
GOLD = "#e7b53c"
PAPER = "#fbf1dc"

# key light direction (world): upper-left-front, camera looks down +Y
LIGHT = Vector((-0.55, -0.65, 0.75)).normalized()
_NOISE_NODES = []
_OUTLINE_MODS = []   # (modifier, base_thickness)


def lin(h):
    """sRGB hex -> linear RGBA tuple."""
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)


def mix_hex(a, b, t):
    a = a.lstrip('#'); b = b.lstrip('#')
    ca = [int(a[i:i + 2], 16) for i in (0, 2, 4)]
    cb = [int(b[i:i + 2], 16) for i in (0, 2, 4)]
    return '#' + ''.join('%02x' % round(x + (y - x) * t) for x, y in zip(ca, cb))


def shade(h, k=0.8, warm="#b0473a"):
    """Shadow tone: darker + pushed toward a warm red (watercolor shadows, never grey)."""
    return mix_hex(mix_hex(h, '#000000', 1 - k), warm, 0.16)


# ------------------------------------------------------------------ scene
def reset(res=(1920, 1080), transparent=False, samples=8, world=PAPER):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _NOISE_NODES.clear(); _OUTLINE_MODS.clear()
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = samples
    s.cycles.use_adaptive_sampling = False
    s.cycles.use_denoising = False
    s.cycles.max_bounces = 0
    s.cycles.diffuse_bounces = 0
    s.cycles.glossy_bounces = 0
    s.cycles.transmission_bounces = 0
    s.cycles.transparent_max_bounces = 10
    s.cycles.filter_width = 1.2
    s.render.resolution_x, s.render.resolution_y = res
    s.render.resolution_percentage = 100
    s.render.film_transparent = transparent
    s.render.use_persistent_data = True
    s.render.fps = 30
    s.view_settings.view_transform = 'Standard'
    s.view_settings.look = 'None'
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    s.render.image_settings.compression = 60
    w = bpy.data.worlds.new('W'); s.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = lin(world); bg.inputs[1].default_value = 1.0
    return s


def camera(loc, look, lens=35):
    cd = bpy.data.cameras.new('Cam'); cd.lens = lens
    cd.clip_start = 0.05; cd.clip_end = 200
    co = bpy.data.objects.new('Cam', cd)
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co
    aim(co, loc, look)
    return co


def aim(cam, loc, look, roll=0.0):
    cam.location = Vector(loc)
    d = Vector(look) - Vector(loc)
    q = d.to_track_quat('-Z', 'Y')
    cam.rotation_euler = q.to_euler()
    if roll:
        cam.rotation_euler.rotate_axis('Z', roll)


def link(ob, parent=None):
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def empty(name, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    return link(e, parent)


# ------------------------------------------------------------------ materials
def _base(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    return m, nt, out


def toon(name, color, shadow=None, hi=None, patch=None, paper=0.07, thresh=0.42, hi_at=0.93,
         alpha=1.0):
    """Fake-lit toon emission. patch=(dir(obj-space normal), threshold, hex) paints a
    region (belly / muzzle) by object-space normal."""
    m, nt, out = _base(name)
    N, L = nt.nodes, nt.links
    geo = N.new('ShaderNodeNewGeometry')
    dot = N.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    dot.inputs[1].default_value = LIGHT
    L.new(geo.outputs['Normal'], dot.inputs[0])
    mad = N.new('ShaderNodeMath'); mad.operation = 'MULTIPLY_ADD'
    mad.inputs[1].default_value = 0.5; mad.inputs[2].default_value = 0.5
    L.new(dot.outputs['Value'], mad.inputs[0])

    def ramp(base_hex):
        r = N.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
        e = r.color_ramp.elements
        e[0].position = 0.0; e[0].color = lin(shadow if (shadow and base_hex == color) else shade(base_hex))
        e[1].position = thresh; e[1].color = lin(base_hex)
        if hi is not False:
            h = e.new(hi_at); h.color = lin(hi if (hi and base_hex == color) else mix_hex(base_hex, '#fffaf0', 0.28))
        L.new(mad.outputs[0], r.inputs[0])
        return r

    col = ramp(color).outputs['Color']
    if patch:
        pdir, pth, phex = patch
        tc = N.new('ShaderNodeTexCoord')
        pd = N.new('ShaderNodeVectorMath'); pd.operation = 'DOT_PRODUCT'
        pd.inputs[1].default_value = Vector(pdir).normalized()
        L.new(tc.outputs['Normal'], pd.inputs[0])
        gt = N.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = pth
        L.new(pd.outputs['Value'], gt.inputs[0])
        mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'
        L.new(gt.outputs[0], mx.inputs['Factor'])
        L.new(col, mx.inputs[6]); L.new(ramp(phex).outputs['Color'], mx.inputs[7])
        col = mx.outputs[2]
    if paper:
        tc2 = N.new('ShaderNodeTexCoord')
        nz = N.new('ShaderNodeTexNoise'); nz.noise_dimensions = '4D'
        nz.inputs['Scale'].default_value = 3.5; nz.inputs['Detail'].default_value = 3
        L.new(tc2.outputs['Object'], nz.inputs['Vector'])
        _NOISE_NODES.append(nz)
        mp = N.new('ShaderNodeMapRange')
        mp.inputs['To Min'].default_value = 1 - paper; mp.inputs['To Max'].default_value = 1 + paper * 0.6
        L.new(nz.outputs['Fac'], mp.inputs['Value'])
        mm = N.new('ShaderNodeMix'); mm.data_type = 'RGBA'; mm.blend_type = 'MULTIPLY'
        mm.inputs['Factor'].default_value = 1.0
        L.new(col, mm.inputs[6]); L.new(mp.outputs[0], mm.inputs[7])
        col = mm.outputs[2]
    em = N.new('ShaderNodeEmission'); L.new(col, em.inputs['Color'])
    if alpha < 1:
        tr = N.new('ShaderNodeBsdfTransparent'); ms = N.new('ShaderNodeMixShader')
        ms.inputs[0].default_value = alpha
        L.new(tr.outputs[0], ms.inputs[1]); L.new(em.outputs[0], ms.inputs[2])
        L.new(ms.outputs[0], out.inputs[0])
    else:
        L.new(em.outputs[0], out.inputs[0])
    return m


def flat(name, color, alpha=1.0, strength=1.0):
    m, nt, out = _base(name)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value = lin(color)
    em.inputs[1].default_value = strength
    if alpha >= 1:
        nt.links.new(em.outputs[0], out.inputs[0]); return m
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); ms = nt.nodes.new('ShaderNodeMixShader')
    ms.name = 'AlphaMix'
    ms.inputs[0].default_value = alpha
    nt.links.new(tr.outputs[0], ms.inputs[1]); nt.links.new(em.outputs[0], ms.inputs[2])
    nt.links.new(ms.outputs[0], out.inputs[0])
    return m


_INK_MAT = None


def ink_mat():
    global _INK_MAT
    if _INK_MAT and _INK_MAT.name in bpy.data.materials:
        return _INK_MAT
    m, nt, out = _base('Ink')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value = lin(INK)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    ms = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(geo.outputs['Backfacing'], ms.inputs[0])
    nt.links.new(em.outputs[0], ms.inputs[1]); nt.links.new(tr.outputs[0], ms.inputs[2])
    nt.links.new(ms.outputs[0], out.inputs[0])
    _INK_MAT = m
    return m


def set_alpha(mat, a):
    n = mat.node_tree.nodes.get('AlphaMix')
    if n: n.inputs[0].default_value = a


# ------------------------------------------------------------------ geometry
def mesh_obj(name, bm, mat=None, parent=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if smooth:
        me.shade_smooth() if hasattr(me, 'shade_smooth') else None
        for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    link(ob, parent)
    if mat: me.materials.append(mat)
    return ob


def sphere(name, r, loc=(0, 0, 0), scale=(1, 1, 1), mat=None, parent=None, outline=0.0, seg=32, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    bmesh.ops.scale(bm, vec=scale, verts=bm.verts)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Euler(rot).to_matrix(), verts=bm.verts)
    ob = mesh_obj(name, bm, mat, parent)
    ob.location = loc
    if outline: add_outline(ob, outline)
    return ob


def box(name, size, loc=(0, 0, 0), mat=None, parent=None, outline=0.0, bevel=0.0, rot=(0, 0, 0), smooth=False):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    ob = mesh_obj(name, bm, mat, parent, smooth=smooth)
    ob.location = loc; ob.rotation_euler = rot
    if bevel:
        b = ob.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = 3
        b.limit_method = 'NONE'
        if smooth: pass
    if outline: add_outline(ob, outline)
    return ob


def cylinder(name, r, depth, loc=(0, 0, 0), mat=None, parent=None, outline=0.0, rot=(0, 0, 0), seg=40, r2=None,
             smooth_sides=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r,
                          radius2=r if r2 is None else r2, depth=depth)
    ob = mesh_obj(name, bm, mat, parent, smooth=False)
    if smooth_sides:
        for p in ob.data.polygons:
            p.use_smooth = abs(p.normal.z) < 0.9
    ob.location = loc; ob.rotation_euler = rot
    if outline: add_outline(ob, outline)
    return ob


def torus(name, R, r, loc=(0, 0, 0), scale=(1, 1, 1), mat=None, parent=None, outline=0.0, rot=(0, 0, 0)):
    bm = bmesh.new()
    segs, rs = 48, 16
    verts = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        ring = []
        for j in range(rs):
            b = 2 * math.pi * j / rs
            x = (R + r * math.cos(b)) * math.cos(a)
            y = (R + r * math.cos(b)) * math.sin(a)
            z = r * math.sin(b)
            ring.append(bm.verts.new((x * scale[0], y * scale[1], z * scale[2])))
        verts.append(ring)
    for i in range(segs):
        for j in range(rs):
            a, b = verts[i][j], verts[(i + 1) % segs][j]
            c, d = verts[(i + 1) % segs][(j + 1) % rs], verts[i][(j + 1) % rs]
            bm.faces.new((a, b, c, d))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_obj(name, bm, mat, parent)
    ob.location = loc; ob.rotation_euler = rot
    if outline: add_outline(ob, outline)
    return ob


def polyline(name, pts, radius, mat=None, parent=None, loc=(0, 0, 0)):
    """Ink stroke (bevelled poly curve) through pts."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = radius; cu.bevel_resolution = 3; cu.use_fill_caps = True
    sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts): p.co = (c[0], c[1], c[2], 1)
    sp.use_endpoint_u = True; sp.order_u = min(3, len(pts))
    ob = bpy.data.objects.new(name, cu); link(ob, parent); ob.location = loc
    cu.materials.append(mat or flat('stroke', INK))
    return ob


def star_mesh(name, r_out, r_in, n=4, mat=None, parent=None, loc=(0, 0, 0), thick=0.0):
    """Flat star sprite in XZ plane (faces -Y / the camera)."""
    bm = bmesh.new()
    c = bm.verts.new((0, 0, 0)); ring = []
    for i in range(2 * n):
        a = math.pi / 2 + math.pi * i / n
        rr = r_out if i % 2 == 0 else r_in
        ring.append(bm.verts.new((rr * math.cos(a), 0, rr * math.sin(a))))
    for i in range(2 * n):
        bm.faces.new((c, ring[i], ring[(i + 1) % (2 * n)]))
    ob = mesh_obj(name, bm, mat, parent, smooth=False); ob.location = loc
    return ob


def add_outline(ob, thickness):
    ink = ink_mat()
    if ink.name not in [m.name for m in ob.data.materials if m]:
        if len(ob.data.materials) == 0:
            ob.data.materials.append(ink)
        ob.data.materials.append(ink)
    mod = ob.modifiers.new('outline', 'SOLIDIFY')
    mod.thickness = thickness; mod.offset = 1.0
    mod.use_flip_normals = True; mod.use_rim = False
    mod.material_offset = len(ob.data.materials) - 1
    mod.use_even_offset = False
    _OUTLINE_MODS.append((mod, thickness))
    return mod


def boil(frame):
    """Hand-drawn wobble: re-seed paper noise + jitter outline width at 8 fps."""
    step = math.floor(frame / 30 * 8 + 1e-6)
    for nz in _NOISE_NODES:
        nz.inputs['W'].default_value = step * 0.37
    for i, (mod, th) in enumerate(_OUTLINE_MODS):
        j = math.sin(step * 12.9898 + i * 78.233) * 43758.5453
        j = j - math.floor(j)
        mod.thickness = th * (0.88 + 0.24 * j)


# ------------------------------------------------------------------ easing
def clamp(v, a=0.0, b=1.0): return max(a, min(b, v))
def seg(t, a, b): return clamp((t - a) / (b - a))
def lerp(a, b, t): return a + (b - a) * t
def ease(x): return 4 * x * x * x if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def out(x): return 1 - (1 - x) ** 3
def back(x, c=1.9): return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
def spring(t, freq=3.0, decay=5.0):
    """Damped oscillation after an event (t in seconds, 0 before)."""
    return 0.0 if t <= 0 else math.exp(-decay * t) * math.sin(2 * math.pi * freq * t)
def hsh(i, j=0, k=0):
    s = math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453
    return s - math.floor(s)


# ------------------------------------------------------------------ hamster
def hamster(name, glasses=True, hat=False, hat_color="#f39bb6", fur=FUR, ol=0.022):
    """Chubby hamster. Origin at floor centre, facing -Y (toward camera).
    Returns dict of animatable empties/objects:
      root (position/turn/squash), upper (bow pivot at waist), head, armL/armR (shoulder pivots),
      glasses (slide down), eyeL/eyeR (open eyes under the glasses), wink (closed arc),
      glint (star sprite on lens)."""
    R = {}
    root = empty(name, (0, 0, 0)); R['root'] = root
    furm = toon(name + '_fur', fur, patch=((0, -1, -0.3), 0.66, CREAM))
    headm = toon(name + '_head', fur, patch=((0, -1, -0.5), 0.84, CREAM))
    pinkm = toon(name + '_pink', PINK, paper=0.04)
    blushm = flat(name + '_blush', BLUSH, alpha=0.75)
    inkm = flat(name + '_inkf', INK)
    footm = toon(name + '_foot', "#f3b2a0", paper=0.03)
    # feet + tail (not bowing)
    for sx in (-1, 1):
        sphere(name + '_foot', 0.15, (0.24 * sx, -0.3, 0.06), (1, 1.25, 0.55), footm, root, ol * 0.8, 20)
    sphere(name + '_tail', 0.08, (0, 0.55, 0.32), (1, 1, 1), furm, root, ol * 0.7, 16)
    # blob shadow (flat offset shadow, like the 2D)
    sh = cylinder(name + '_shadow', 0.62, 0.002, (0.1, 0.05, 0.003), flat(name + '_sh', INK, alpha=0.2), root)
    sh.scale = (1, 0.55, 1); R['shadow'] = sh
    upper = empty(name + '_upper', (0, 0, 0.35), root); R['upper'] = upper
    # body blob (origin of upper is waist height)
    sphere(name + '_body', 0.6, (0, 0, 0.22), (1.0, 0.9, 0.9), furm, upper, ol)
    head = empty(name + '_headp', (0, -0.05, 0.7), upper); R['head'] = head
    sphere(name + '_headm', 0.5, (0, 0, 0.08), (1.02, 0.95, 0.92), headm, head, ol)
    # cheek pouches
    for sx in (-1, 1):
        sphere(name + '_pouch', 0.26, (0.36 * sx, -0.14, -0.02), (1, 0.9, 0.85), headm, head, ol)
        sphere(name + '_blsh', 0.1, (0.4 * sx, -0.36, -0.02), (1, 0.35, 0.7), blushm, head, 0, 16)
        # ears
        e = sphere(name + '_ear', 0.15, (0.3 * sx, 0.04, 0.46), (1, 0.45, 1), furm, head, ol * 0.8, 20,
                   rot=(0, 0.35 * sx, 0))
        sphere(name + '_earin', 0.095, (0.3 * sx, -0.03, 0.45), (1, 0.3, 1), pinkm, head, 0, 16,
               rot=(0, 0.35 * sx, 0))
    sphere(name + '_nose', 0.065, (0, -0.505, 0.02), (1.2, 0.8, 0.85), pinkm, head, ol * 0.6, 16)
    polyline(name + '_mouth', [(-0.09, -0.47, -0.08), (-0.045, -0.495, -0.12), (0, -0.495, -0.08),
                               (0.045, -0.495, -0.12), (0.09, -0.47, -0.08)], 0.012, inkm, head)
    # eyes: open (glossy dot) and closed arcs
    R['eyes_open'] = []; R['eyes_closed'] = []
    for sx in (-1, 1):
        eo = sphere(name + '_eye', 0.065, (0.18 * sx, -0.44, 0.13), (0.85, 0.5, 1.1), inkm, head, 0, 16)
        eh = sphere(name + '_eyehi', 0.022, (0.18 * sx - 0.022, -0.48, 0.165), (1, 0.5, 1), flat('w', '#ffffff'), head, 0, 8)
        R['eyes_open'].append(eo); R['eyes_open'].append(eh)
        ec = polyline(name + '_arc', [(-0.075, 0, -0.03), (0, -0.01, 0.045), (0.075, 0, -0.03)], 0.016, inkm, head,
                      loc=(0.18 * sx, -0.455, 0.12))
        R['eyes_closed'].append(ec)
    for o in R['eyes_open']: o.hide_render = True
    # sunglasses
    if glasses:
        g = empty(name + '_glasses', (0, 0, 0), head); R['glasses'] = g
        gm = toon(name + '_lens', "#23201f", shadow="#141212", hi="#4a4444", paper=0.0, thresh=0.3, hi_at=0.8)
        for sx in (-1, 1):
            lens = box(name + '_lensb', (0.3, 0.07, 0.2), (0.19 * sx, -0.5, 0.14), gm, g, ol * 0.8, bevel=0.06,
                       rot=(0, 0.1 * sx, -0.28 * sx))
            # top brow bar (wayfarer)
            box(name + '_brow', (0.32, 0.075, 0.06), (0.19 * sx, -0.505, 0.235), gm, g, 0, bevel=0.025,
                rot=(0, 0.1 * sx, -0.28 * sx))
            # highlight streak
            hl = box(name + '_hl', (0.05, 0.01, 0.15), (0.19 * sx - 0.06, -0.545, 0.15),
                     flat('hl', '#ffffff'), g, 0, rot=(0, 0.6, -0.28 * sx))
            box(name + '_hl2', (0.02, 0.01, 0.08), (0.19 * sx + 0.0, -0.548, 0.13),
                flat('hl', '#ffffff'), g, 0, rot=(0, 0.6, -0.28 * sx))
            box(name + '_temple', (0.03, 0.34, 0.04), (0.39 * sx, -0.32, 0.2), gm, g, 0,
                rot=(0, 0, -0.35 * sx))
        box(name + '_bridge', (0.1, 0.05, 0.04), (0, -0.53, 0.2), gm, g, 0)
        glint = star_mesh(name + '_glint', 0.22, 0.045, 4, flat('glint', '#fffbe8', strength=1.0), g,
                          (0.13, -0.62, 0.22))
        glint.scale = (0, 0, 0); R['glint'] = glint
        for o in R['eyes_closed']: o.hide_render = True
    # scarf
    sc = toon(name + '_scarf', SCARF)
    torus(name + '_scarfr', 0.47, 0.12, (0, -0.03, 0.52), (1, 0.92, 0.7), sc, upper, ol)
    tail = empty(name + '_scarftp', (0.3, -0.42, 0.5), upper)
    box(name + '_scarft', (0.14, 0.06, 0.32), (0, -0.02, -0.15), sc, tail, ol * 0.9, bevel=0.03)
    polyline(name + '_fringe', [(-0.05, -0.06, -0.31), (0.0, -0.06, -0.33), (0.05, -0.06, -0.31)], 0.008, inkm, tail)
    R['scarf_tail'] = tail
    # arms (pivot at shoulder, arm hangs -Z)
    for sx, key in ((-1, 'armL'), (1, 'armR')):
        p = empty(name + '_' + key, (0.5 * sx, -0.18, 0.3), upper); R[key] = p
        sphere(name + '_arm', 0.1, (0.03 * sx, -0.02, -0.14), (1, 1, 1.75), furm, p, ol * 0.9, 20)
        sphere(name + '_paw', 0.075, (0.04 * sx, -0.05, -0.29), (1, 1, 1), footm, p, ol * 0.8, 16)
    if hat:
        hm = toon(name + '_hat', hat_color)
        h = empty(name + '_hatp', (0.12, 0.02, 0.5), head); h.rotation_euler = (0, 0.3, 0)
        cylinder(name + '_hatc', 0.2, 0.46, (0, 0, 0.2), hm, h, ol * 0.9, seg=32, r2=0.0)
        sphere(name + '_pom', 0.075, (0, 0, 0.46), (1, 1, 1), toon(name + '_pomm', SCARF), h, ol * 0.8, 16)
        # stripe
        torus(name + '_hats', 0.13, 0.03, (0, 0, 0.12), (1, 1, 1), toon(name + '_hatst', "#fff4e0"), h, 0)
    return R


def pose(R, frame=0, loc=(0, 0, 0), turn=0.0, squash=1.0, lean=0.0, bow=0.0, armL=0.0, armR=0.0,
         head_tilt=0.0, head_turn=0.0, armL_out=0.0, armR_out=0.0):
    """squash: <1 flattens, >1 stretches (volume preserving). arm angles in radians (raise sideways)."""
    r = R['root']
    r.location = loc
    r.rotation_euler = (0, lean, turn)
    s = max(0.3, squash)
    r.scale = (1 / math.sqrt(s), 1 / math.sqrt(s), s)
    R['upper'].rotation_euler = (bow, 0, 0)
    R['head'].rotation_euler = (0, head_tilt, head_turn)
    R['armL'].rotation_euler = (armL_out, armL, 0)
    R['armR'].rotation_euler = (armR_out, -armR, 0)
    # scarf tail flutter
    R['scarf_tail'].rotation_euler = (0.25 + 0.12 * math.sin(frame * 0.35), 0.1, 0.35 + 0.12 * math.sin(frame * 0.23))


# ------------------------------------------------------------------ render loop
def render_frames(outdir, frames, setup_frame, start=1):
    os.makedirs(outdir, exist_ok=True)
    s = bpy.context.scene
    t0 = time.time()
    for i, f in enumerate(frames):
        s.frame_set(1)
        setup_frame(f)
        boil(f)
        s.render.filepath = os.path.join(outdir, '%04d.png' % (f + start))
        bpy.ops.render.render(write_still=True)
    dt = time.time() - t0
    print('RENDERED %d frames in %.1fs (%.2fs/frame) -> %s' % (len(frames), dt, dt / max(1, len(frames)), outdir),
          flush=True)
    return dt


def frames_arg(default_n):
    """CLI: python shot.py [--frames a:b] [--out DIR]"""
    import sys
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    rng = list(range(default_n)); out_dir = None
    for i, a in enumerate(argv):
        if a == '--frames':
            spec = argv[i + 1]
            if ':' in spec:
                a0, b0 = spec.split(':'); rng = list(range(int(a0), int(b0)))
            else:
                rng = [int(x) for x in spec.split(',')]
        if a == '--out':
            out_dir = argv[i + 1]
    return rng, out_dir


# ------------------------------------------------------------------ sheets / cutouts
def grid_obj(name, nx, nz, fn, mat, parent=None, thick=0.0, outline=0.0, smooth=True):
    """Parametric sheet: fn(u, v) -> (x, y, z) with u,v in [0,1]. Returns (obj, update(fn))."""
    bm = bmesh.new()
    vs = [[bm.verts.new(fn(i / nx, j / nz)) for i in range(nx + 1)] for j in range(nz + 1)]
    for j in range(nz):
        for i in range(nx):
            bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    ob = mesh_obj(name, bm, mat, parent, smooth=smooth)
    if thick:
        m = ob.modifiers.new('thick', 'SOLIDIFY'); m.thickness = thick; m.offset = 0; m.use_rim = True
    if outline: add_outline(ob, outline)

    def update(fn2):
        co = []
        for j in range(nz + 1):
            for i in range(nx + 1):
                co.extend(fn2(i / nx, j / nz))
        ob.data.vertices.foreach_set('co', co)
        ob.data.update()
    return ob, update


def cutout(name, pts2d, depth, mat, parent=None, loc=(0, 0, 0), outline=0.0, rot=(0, 0, 0)):
    """Extruded flat polygon in the XZ plane (a theatre 'flat'), faces -Y."""
    bm = bmesh.new()
    front = [bm.verts.new((x, -depth / 2, z)) for x, z in pts2d]
    back_ = [bm.verts.new((x, depth / 2, z)) for x, z in pts2d]
    f = bm.faces.new(front)
    bm.faces.new(list(reversed(back_)))
    n = len(pts2d)
    for i in range(n):
        bm.faces.new((front[i], back_[i], back_[(i + 1) % n], front[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_obj(name, bm, mat, parent, smooth=False)
    ob.location = loc; ob.rotation_euler = rot
    if outline: add_outline(ob, outline)
    return ob


def cloud_pts(circles, n=120):
    """Star-shaped outline of a union of circles [(cx, cz, r)] around their centroid."""
    cx = sum(c[0] for c in circles) / len(circles); cz = sum(c[1] for c in circles) / len(circles)
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        dx, dz = math.cos(a), math.sin(a)
        best = 0
        for (x, z, r) in circles:
            ox, oz = cx - x, cz - z
            bq = ox * dx + oz * dz; c = ox * ox + oz * oz - r * r
            disc = bq * bq - c
            if disc >= 0:
                best = max(best, -bq + math.sqrt(disc))
        pts.append((cx + dx * best, cz + dz * best))
    return pts
