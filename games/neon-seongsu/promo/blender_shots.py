"""Stage 3: procedural Blender shots (bpy 4.2 as a Python module, Cycles on CPU).

  python3 blender_shots.py A|B|C|D [--frames N] [--res 960x540] [--samples 12] [--only 1,80,160] [--force]

Frames go to build/blender/<shot>/%05d.png (1-based). Existing frames are skipped, so a run can be resumed.
Everything is animated from Python per frame (no simulation caches), so any frame can be rendered alone.
"""
import math
import os
import random
import sys
import time

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import BUILD, FPS, font, load_timeline  # noqa: E402

BHS = font('BlackHanSans-Regular.ttf')

# --------------------------------------------------------------------------- helpers


def srgb(c):
    """0-255 sRGB tuple -> linear RGBA."""
    def f(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (f(c[0]), f(c[1]), f(c[2]), 1.0)


MAG = srgb((255, 46, 136))
CYAN = srgb((41, 231, 255))
AMBER = srgb((255, 179, 71))
GREEN = srgb((0, 168, 77))
RED = srgb((255, 40, 50))
BLUE = srgb((40, 90, 255))
WARM = srgb((255, 190, 120))
WHITE = (1, 1, 1, 1)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = FPS
    return sc


def setup_render(sc, res, samples, mist=(15, 260), fog=(0.02, 0.022, 0.045), fog_amt=0.55, exposure=0.0):
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.05
    cy.use_denoising = True
    try:
        cy.denoiser = 'OPENIMAGEDENOISE'
    except TypeError:
        pass
    cy.max_bounces = 4
    cy.diffuse_bounces = 1
    cy.glossy_bounces = 2
    cy.transmission_bounces = 2
    cy.transparent_max_bounces = 6
    cy.volume_bounces = 0
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.blur_glossy = 1.0
    cy.sample_clamp_indirect = 6.0
    cy.use_light_tree = False
    cy.denoising_prefilter = 'FAST'
    # emissive meshes are not importance-sampled as lights (thousands of neon triangles make that slow);
    # they still light the scene through BSDF sampling + the denoiser.
    for m in bpy.data.materials:
        m.cycles.emission_sampling = 'NONE'
    sc.render.use_persistent_data = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = exposure
    w = bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (fog[0] * 0.25, fog[1] * 0.25, fog[2] * 0.25, 1)
    bg.inputs[1].default_value = 1.0
    w.mist_settings.start = mist[0]
    w.mist_settings.depth = mist[1]
    w.mist_settings.falloff = 'QUADRATIC'
    # compositor: mist-based fog (cheap stand-in for volumetrics)
    sc.view_layers[0].use_pass_mist = True
    sc.use_nodes = True
    nt = sc.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    rl = nt.nodes.new('CompositorNodeRLayers')
    mul = nt.nodes.new('CompositorNodeMath')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = fog_amt
    mix = nt.nodes.new('CompositorNodeMixRGB')
    mix.blend_type = 'MIX'
    mix.inputs[2].default_value = (fog[0], fog[1], fog[2], 1)
    comp = nt.nodes.new('CompositorNodeComposite')
    nt.links.new(rl.outputs['Mist'], mul.inputs[0])
    nt.links.new(mul.outputs[0], mix.inputs[0])
    nt.links.new(rl.outputs['Image'], mix.inputs[1])
    nt.links.new(mix.outputs[0], comp.inputs[0])


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_obj(name, verts, faces, mat=None, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    if mat:
        me.materials.append(mat)
    return link(ob)


def box_geo(sx, sy, sz, cx=0, cy=0, z0=0, top_scale=1.0):
    hx, hy = sx / 2, sy / 2
    tx, ty = hx * top_scale, hy * top_scale
    v = [(cx - hx, cy - hy, z0), (cx + hx, cy - hy, z0), (cx + hx, cy + hy, z0), (cx - hx, cy + hy, z0),
         (cx - tx, cy - ty, z0 + sz), (cx + tx, cy - ty, z0 + sz), (cx + tx, cy + ty, z0 + sz), (cx - tx, cy + ty, z0 + sz)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return v, f


def box(name, size, loc=(0, 0, 0), mat=None, base=True, top_scale=1.0):
    """Box with origin at base-centre (base=True) or centre."""
    sx, sy, sz = size
    v, f = box_geo(sx, sy, sz, 0, 0, 0 if base else -sz / 2, top_scale)
    return mesh_obj(name, v, f, mat, loc)


def multi_box_obj(name, boxes, mat):
    """Many boxes merged into one mesh: boxes = [(sx,sy,sz,cx,cy,z0), ...]."""
    V, F = [], []
    for b in boxes:
        v, f = box_geo(*b)
        o = len(V)
        V += v
        F += [tuple(i + o for i in ff) for ff in f]
    return mesh_obj(name, V, F, mat)


def nodes_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    return m, nt, out


def mat_emit(name, color, strength, transparent=0.0):
    m, nt, out = nodes_mat(name)
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs[0].default_value = color
    em.inputs[1].default_value = strength
    if transparent > 0:
        tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        mx = nt.nodes.new('ShaderNodeMixShader')
        mx.inputs[0].default_value = transparent
        nt.links.new(em.outputs[0], mx.inputs[1])
        nt.links.new(tr.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], out.inputs[0])
    else:
        nt.links.new(em.outputs[0], out.inputs[0])
    m['strength_socket'] = 1
    return m


def set_emit(m, strength):
    for n in m.node_tree.nodes:
        if n.type == 'EMISSION':
            n.inputs[1].default_value = strength
        elif n.type == 'BSDF_PRINCIPLED':
            n.inputs['Emission Strength'].default_value = strength


def mat_pbr(name, color, rough=0.5, metal=0.0, emit=None, emit_strength=0.0, coat=0.0):
    m, nt, out = nodes_mat(name)
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = color
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = emit
        p.inputs['Emission Strength'].default_value = emit_strength
    nt.links.new(p.outputs[0], out.inputs[0])
    return m


def mat_wet_ground(name, base=(0.012, 0.012, 0.016, 1), scale=0.08, dry=0.45, wet=0.04):
    """Dark asphalt with noise puddles: puddles are near-mirror, the rest rough."""
    m, nt, out = nodes_mat(name)
    N = nt.nodes
    tc = N.new('ShaderNodeTexCoord')
    noise = N.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = scale
    noise.inputs['Detail'].default_value = 6
    noise.inputs['Roughness'].default_value = 0.6
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.42
    ramp.color_ramp.elements[1].position = 0.58
    maprough = N.new('ShaderNodeMapRange')
    maprough.inputs['To Min'].default_value = wet
    maprough.inputs['To Max'].default_value = dry
    fine = N.new('ShaderNodeTexNoise')
    fine.inputs['Scale'].default_value = 3.0
    bump = N.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.08
    p = N.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = base
    p.inputs['Specular IOR Level'].default_value = 0.6
    L = nt.links.new
    L(tc.outputs['Object'], noise.inputs['Vector'])
    L(noise.outputs['Fac'], ramp.inputs['Fac'])
    L(ramp.outputs['Color'], maprough.inputs['Value'])
    L(maprough.outputs['Result'], p.inputs['Roughness'])
    L(tc.outputs['Object'], fine.inputs['Vector'])
    L(fine.outputs['Fac'], bump.inputs['Height'])
    L(bump.outputs['Normal'], p.inputs['Normal'])
    L(p.outputs[0], out.inputs[0])
    return m


def mat_windows(name, wall=(0.018, 0.018, 0.024, 1), floor_h=3.2, col_w=2.4, lit=0.45, strength=1.5,
                palette=((1.0, 0.62, 0.32), (0.55, 0.78, 1.0), (1.0, 0.25, 0.55)), store=True):
    """Facade shader: emissive window grid from object coords, random per window/object, no roof windows,
    plus a coloured storefront band at street level."""
    m, nt, out = nodes_mat(name)
    N = nt.nodes
    L = nt.links.new
    tc = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ')
    L(tc.outputs['Object'], sep.inputs[0])
    geo = N.new('ShaderNodeNewGeometry')
    nsep = N.new('ShaderNodeSeparateXYZ')
    L(geo.outputs['Normal'], nsep.inputs[0])

    def math(op, a, b=None, val=None):
        n = N.new('ShaderNodeMath')
        n.operation = op
        for i, x in enumerate((a, b)):
            if x is None:
                continue
            if isinstance(x, (int, float)):
                n.inputs[i].default_value = x
            else:
                L(x, n.inputs[i])
        return n.outputs[0]

    u = math('ADD', sep.outputs['X'], sep.outputs['Y'])
    uu = math('DIVIDE', u, col_w)
    zz = math('DIVIDE', sep.outputs['Z'], floor_h)
    fx = math('FRACT', uu)
    fz = math('FRACT', zz)
    wx = math('MULTIPLY', math('GREATER_THAN', fx, 0.25), math('LESS_THAN', fx, 0.75))
    wz = math('MULTIPLY', math('GREATER_THAN', fz, 0.28), math('LESS_THAN', fz, 0.78))
    win = math('MULTIPLY', wx, wz)
    vertical = math('SUBTRACT', 1.0, math('ABSOLUTE', nsep.outputs['Z']))
    vertical = math('GREATER_THAN', vertical, 0.5)
    above = math('GREATER_THAN', sep.outputs['Z'], 4.5)
    # per-window random
    comb = N.new('ShaderNodeCombineXYZ')
    L(math('FLOOR', uu), comb.inputs[0])
    L(math('FLOOR', zz), comb.inputs[1])
    oi = N.new('ShaderNodeObjectInfo')
    L(math('MULTIPLY', oi.outputs['Random'], 97.0), comb.inputs[2])
    wn = N.new('ShaderNodeTexWhiteNoise')
    wn.noise_dimensions = '3D'
    L(comb.outputs[0], wn.inputs['Vector'])
    on = math('LESS_THAN', wn.outputs['Value'], lit)
    mask = math('MULTIPLY', math('MULTIPLY', win, on), math('MULTIPLY', vertical, above))
    # window colour from palette via ramp on second noise channel
    sepc = N.new('ShaderNodeSeparateColor')
    L(wn.outputs['Color'], sepc.inputs[0])
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    els[0].position = 0.0
    els[0].color = (*palette[0], 1)
    els[1].position = 0.6
    els[1].color = (*palette[1], 1)
    if len(palette) > 2:
        e = els.new(0.88)
        e.color = (*palette[2], 1)
    L(sepc.outputs['Green'], ramp.inputs['Fac'])
    bright = math('ADD', math('MULTIPLY', sepc.outputs['Blue'], 0.8), 0.4)
    total = math('MULTIPLY', mask, bright)
    mixc = N.new('ShaderNodeMix')
    mixc.data_type = 'RGBA'
    L(total, mixc.inputs['Factor'])
    mixc.inputs['A'].default_value = (0, 0, 0, 1)
    L(ramp.outputs['Color'], mixc.inputs['B'])
    col_out = mixc.outputs['Result']
    if store:
        # storefront band 0.6..3.4 m in a saturated neon colour chosen per object
        band = math('MULTIPLY', math('GREATER_THAN', sep.outputs['Z'], 0.6), math('LESS_THAN', sep.outputs['Z'], 3.4))
        band = math('MULTIPLY', band, vertical)
        band = math('MULTIPLY', band, math('GREATER_THAN', oi.outputs['Random'], 0.3))
        sramp = N.new('ShaderNodeValToRGB')
        sramp.color_ramp.interpolation = 'CONSTANT'
        se = sramp.color_ramp.elements
        se[0].position = 0.0
        se[0].color = MAG
        se[1].position = 0.3
        se[1].color = CYAN
        e = se.new(0.55)
        e.color = AMBER
        e = se.new(0.75)
        e.color = (0.25, 1.0, 0.55, 1)
        e = se.new(0.9)
        e.color = (0.7, 0.4, 1.0, 1)
        L(math('FRACT', math('MULTIPLY', oi.outputs['Random'], 7.13)), sramp.inputs['Fac'])
        bmix = N.new('ShaderNodeMix')
        bmix.data_type = 'RGBA'
        L(band, bmix.inputs['Factor'])
        L(col_out, bmix.inputs['A'])
        bcol = N.new('ShaderNodeMix')
        bcol.data_type = 'RGBA'
        bcol.blend_type = 'MULTIPLY'
        bcol.inputs['Factor'].default_value = 1.0
        L(sramp.outputs['Color'], bcol.inputs['A'])
        bcol.inputs['B'].default_value = (2.2, 2.2, 2.2, 1)
        L(bcol.outputs['Result'], bmix.inputs['B'])
        col_out = bmix.outputs['Result']
    p = N.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = wall
    p.inputs['Roughness'].default_value = 0.55
    p.inputs['Emission Strength'].default_value = strength
    L(col_out, p.inputs['Emission Color'])
    L(p.outputs[0], out.inputs[0])
    return m


def text_obj(name, body, size=1.0, extrude=0.0, bevel=0.0, mat=None, loc=(0, 0, 0), rot=(math.pi / 2, 0, 0),
             align='CENTER', valign='CENTER', fontfile=BHS, spacing=1.0, line_spacing=1.0):
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body = body
    cu.font = bpy.data.fonts.load(fontfile, check_existing=True)
    cu.size = size
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.align_x = align
    cu.align_y = valign
    cu.space_character = spacing
    cu.space_line = line_spacing
    ob = bpy.data.objects.new(name, cu)
    ob.location = loc
    ob.rotation_euler = rot
    if mat:
        cu.materials.append(mat)
    return link(ob)


def neon_tube(src, name, radius, mat):
    """Convert a text object to a 3D curve outline with a round bevel: a neon tube."""
    bpy.context.view_layer.objects.active = None
    dg = bpy.context.evaluated_depsgraph_get()
    cu = src.data.copy()
    cu.extrude = 0
    cu.bevel_depth = 0
    tmp = bpy.data.objects.new(name + '_tmp', cu)
    link(tmp)
    tmp.matrix_world = src.matrix_world
    for o in bpy.context.selected_objects:
        o.select_set(False)
    tmp.select_set(True)
    bpy.context.view_layer.objects.active = tmp
    bpy.ops.object.convert(target='CURVE')
    tube = bpy.context.view_layer.objects.active
    tube.name = name
    tube.data.dimensions = '3D'
    tube.data.bevel_depth = radius
    tube.data.bevel_resolution = 2
    tube.data.materials.clear()
    tube.data.materials.append(mat)
    return tube


def camera(lens=35, clip=(0.1, 3000)):
    cd = bpy.data.cameras.new('Cam')
    cd.lens = lens
    cd.clip_start, cd.clip_end = clip
    ob = link(bpy.data.objects.new('Cam', cd))
    bpy.context.scene.camera = ob
    return ob


def look(cam, pos, target, roll=0.0):
    cam.location = Vector(pos)
    d = Vector(target) - Vector(pos)
    q = d.to_track_quat('-Z', 'Y')
    e = q.to_euler()
    e.rotate_axis('Z', roll)
    cam.rotation_euler = e


def light(kind, loc, energy, color=(1, 1, 1), size=0.5, rot=(0, 0, 0), name='L'):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind in ('POINT', 'SPOT'):
        ld.shadow_soft_size = size
    if kind == 'AREA':
        ld.size = size
    ob = link(bpy.data.objects.new(name, ld))
    ob.location = loc
    ob.rotation_euler = rot
    return ob


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease_io(t):
    t = max(0.0, min(1.0, t))
    return 0.5 - 0.5 * math.cos(math.pi * t)


def catmull(pts, t):
    """Catmull-Rom through pts, t in [0,1]."""
    n = len(pts) - 1
    x = max(0.0, min(0.9999, t)) * n
    i = int(x)
    u = x - i
    p0 = Vector(pts[max(0, i - 1)])
    p1 = Vector(pts[i])
    p2 = Vector(pts[min(n, i + 1)])
    p3 = Vector(pts[min(n, i + 2)])
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)


class Rain:
    """Rain streaks as one mesh whose vertices are rewritten each frame (deterministic, resumable)."""

    def __init__(self, n, center, extent, zrange, length=1.1, width=0.025, speed=26.0, strength=0.9, seed=3,
                 wind=(1.5, 0.8)):
        rnd = random.Random(seed)
        self.drops = [(rnd.uniform(-extent[0], extent[0]), rnd.uniform(-extent[1], extent[1]), rnd.uniform(0, 1),
                       rnd.uniform(0.85, 1.15)) for _ in range(n)]
        self.center = Vector(center)
        self.z0, self.z1 = zrange
        self.len, self.w, self.speed, self.wind = length, width, speed, wind
        verts = [(0, 0, 0)] * (8 * n)
        faces = []
        for i in range(n):
            o = 8 * i
            faces += [(o, o + 1, o + 2, o + 3), (o + 4, o + 5, o + 6, o + 7)]
        mat = mat_emit('rain', (0.7, 0.8, 1.0, 1), strength, transparent=0.35)
        self.obj = mesh_obj('Rain', verts, faces, mat)
        self.obj.visible_shadow = False
        self.obj.visible_diffuse = False
        self.obj.visible_glossy = False

    def update(self, t, center=None):
        c = Vector(center) if center is not None else self.center
        H = self.z1 - self.z0
        co = []
        wx, wy = self.wind
        nx, ny = wx / self.speed, wy / self.speed
        for x, y, ph, sp in self.drops:
            z = self.z1 - ((ph * H + t * self.speed * sp) % H)
            X, Y, Z = c.x + x + wx * (z / self.speed), c.y + y + wy * (z / self.speed), z
            L = self.len * sp
            w = self.w
            tx, ty = X + nx * L, Y + ny * L
            co += [(X - w, Y, Z), (X + w, Y, Z), (tx + w, ty, Z + L), (tx - w, ty, Z + L),
                   (X, Y - w, Z), (X, Y + w, Z), (tx, ty + w, Z + L), (tx, ty - w, Z + L)]
        flat = [v for p in co for v in p]
        self.obj.data.vertices.foreach_set('co', flat)
        self.obj.data.update()


# --------------------------------------------------------------------------- city kit

SIGN_WORDS = ['성수', '카페', '노래방', '24시', '수제화', '편의점', '치킨', '약국', 'PC방', '호프', '분식', '당구장',
              'BAR', 'OMNI', '네온', '사진관', '팝업', '로스터리']


def make_city(rnd, half=180, block=44, street=13, avenue_y=0.0, avenue_w=22, hmin=8, hmax=46,
              tall_center=(0, 0), skip=None, signs=True, sign_density=0.35):
    wmat = mat_windows('facade')
    wmat2 = mat_windows('facade2', wall=(0.03, 0.028, 0.032, 1), lit=0.3, strength=1.2,
                        palette=((1.0, 0.7, 0.4), (0.9, 0.9, 1.0), (0.3, 1.0, 0.9)))
    neon_cols = [MAG, CYAN, AMBER, GREEN, (1, 0.3, 0.2, 1), (0.6, 0.35, 1.0, 1)]
    neon_mats = [mat_emit(f'neon{i}', c, 9.0) for i, c in enumerate(neon_cols)]
    back = mat_pbr('signback', (0.01, 0.01, 0.012, 1), 0.4)
    buildings = []
    xs = list(range(-half, half, block))
    for bx in xs:
        for by in xs:
            cx0, cy0 = bx + street / 2, by + street / 2
            size = block - street
            sizey = size
            # widen the avenue that carries the viaduct (it runs along a street at y=avenue_y)
            widen = (avenue_w - street) / 2
            if 0 <= cy0 - avenue_y < street:
                cy0 += widen
                sizey -= widen
            elif 0 <= avenue_y - (cy0 + size) < street:
                sizey -= widen
            if skip and skip(cx0 + size / 2, cy0 + sizey / 2):
                continue
            lots = rnd.choice([1, 2, 2, 3, 4])
            b2 = sizey / 2
            if lots == 1:
                parts = [(cx0, cy0, size, sizey)]
            elif lots == 2:
                a = rnd.uniform(0.4, 0.6) * size
                parts = [(cx0, cy0, a - 1, sizey), (cx0 + a, cy0, size - a, sizey)]
            elif lots == 3:
                a = size / 2
                parts = [(cx0, cy0, a - 1, sizey), (cx0 + a, cy0, size - a, b2 - 1), (cx0 + a, cy0 + b2, size - a, sizey - b2)]
            else:
                a = size / 2
                parts = [(cx0, cy0, a - 1, b2 - 1), (cx0 + a, cy0, size - a, b2 - 1), (cx0, cy0 + b2, a - 1, sizey - b2),
                         (cx0 + a, cy0 + b2, size - a, sizey - b2)]
            for (px, py, sx, sy) in parts:
                d = math.hypot(px + sx / 2 - tall_center[0], py + sy / 2 - tall_center[1])
                k = max(0.15, 1 - d / (half * 1.2))
                h = rnd.uniform(hmin, hmin + (hmax - hmin) * k)
                if rnd.random() < 0.07:
                    h *= 1.7
                ts = 1.0 if rnd.random() < 0.8 else 0.85
                ob = box(f'bld', (sx, sy, h), (px + sx / 2, py + sy / 2, 0), wmat if rnd.random() < 0.7 else wmat2,
                         top_scale=ts)
                buildings.append((ob, px, py, sx, sy, h))
                # rooftop clutter
                if rnd.random() < 0.5:
                    box('roof', (rnd.uniform(2, 5), rnd.uniform(2, 5), rnd.uniform(1, 3)),
                        (px + sx / 2 + rnd.uniform(-2, 2), py + sy / 2 + rnd.uniform(-2, 2), h), back)
                if not signs:
                    continue
                # blade signs (vertical Korean signs) and flat signs on street faces
                for face in ('S', 'N', 'W', 'E'):
                    if rnd.random() > sign_density:
                        continue
                    word = rnd.choice(SIGN_WORDS)
                    nm = rnd.choice(neon_mats)
                    z = rnd.uniform(4.5, min(h - 2, 16))
                    if face in ('S', 'N'):
                        fx = px + rnd.uniform(1.5, sx - 1.5)
                        fy = py - 0.2 if face == 'S' else py + sy + 0.2
                        blade = rnd.random() < 0.6
                        rz = 0 if face == 'S' else math.pi
                        out = -1 if face == 'S' else 1
                    else:
                        fy = py + rnd.uniform(1.5, sy - 1.5)
                        fx = px - 0.2 if face == 'W' else px + sx + 0.2
                        blade = rnd.random() < 0.6
                        rz = -math.pi / 2 if face == 'W' else math.pi / 2
                        out = -1 if face == 'W' else 1
                    if blade:
                        # vertical sign sticking out perpendicular to the facade
                        body = '\n'.join(word) if not word.isascii() else word
                        n = len(word) if not word.isascii() else 1
                        hgt = 1.85 * n + 0.8
                        off = 1.5 * out
                        if face in ('S', 'N'):
                            loc = (fx, fy + off, z)
                            brz = math.pi / 2
                        else:
                            loc = (fx + off, fy, z)
                            brz = 0
                        b = box('blade', (2.2, 0.35, hgt), (loc[0], loc[1], loc[2] - hgt / 2), back)
                        b.rotation_euler = (0, 0, brz)
                        for side in (1, -1):
                            t = text_obj('sgn', body, 1.6 if n > 1 else 1.0, mat=nm, line_spacing=0.95)
                            t.parent = b
                            t.location = (0, -0.19 * side, hgt / 2)
                            t.rotation_euler = (math.pi / 2, 0, 0 if side == 1 else math.pi)
                        # neon frame edges
                        edge = box('bladeedge', (2.28, 0.1, hgt + 0.06), (0, 0, -0.03), nm)
                        edge.parent = b
                        edge.location = (0, 0, -0.03)
                    else:
                        t = text_obj('sgn', word, rnd.uniform(2.4, 4.0), mat=nm)
                        t.location = (fx, fy, z)
                        t.rotation_euler = (math.pi / 2, 0, rz)
    return buildings


def street_lights(rnd, half, block, street, z=6.5, energy=600, color=(1.0, 0.62, 0.3), every=2, avenue_y=None):
    n = 0
    for bx in range(-half, half, block):
        for by in range(-half, half, block):
            if (bx // block + by // block) % every:
                continue
            light('POINT', (bx + street * 0.2, by + street * 0.5, z), energy, color, 0.3, name='lamp')
            n += 1
    return n


def viaduct(length=420, y=0.0, z=9.0, width=9.0):
    conc = mat_pbr('concrete', (0.05, 0.05, 0.055, 1), 0.7)
    deck = box('deck', (length, width, 1.6), (0, y, z), conc)
    rail = multi_box_obj('parapet', [(length, 0.3, 1.1, 0, y - width / 2 + 0.15, z + 1.6),
                                     (length, 0.3, 1.1, 0, y + width / 2 - 0.15, z + 1.6)], conc)
    pil = []
    for x in range(-length // 2, length // 2 + 1, 26):
        pil.append((2.2, 3.4, z, x, y, 0))
        pil.append((2.4, width, 0.8, x, y, z - 0.8))
    multi_box_obj('pillars', pil, conc)
    g = mat_emit('line2glow', GREEN, 6.0)
    multi_box_obj('greenline', [(length, 0.08, 0.14, 0, y - width / 2 - 0.05, z + 0.3),
                                (length, 0.08, 0.14, 0, y + width / 2 + 0.05, z + 0.3)], g)
    # a few station-ish lights under the deck
    for x in range(-length // 2 + 13, length // 2, 52):
        light('POINT', (x, y, z - 1.2), 350, (0.6, 1.0, 0.75), 0.4, name='deckL')
    return z + 1.6


def train(n_cars=6, car_len=18.5, y=0.0, z=10.6):
    body = mat_pbr('trainbody', (0.55, 0.57, 0.6, 1), 0.28, 0.8)
    stripe = mat_emit('trainstripe', GREEN, 10.0)
    win = mat_emit('trainwin', (1.0, 0.95, 0.85, 1), 7.0)
    head = mat_emit('headlight', (1, 1, 0.95, 1), 60)
    parts = []
    for i in range(n_cars):
        cx = -i * (car_len + 0.8)
        b = box('car', (car_len, 3.1, 3.5), (cx, y, z), body)
        s = box('stripe', (car_len + 0.02, 3.16, 0.35), (0, 0, 0.9), stripe)
        s.parent = b
        w = box('win', (car_len - 2, 3.14, 0.8), (0, 0, 1.9), win)
        w.parent = b
        parts.append(b)
    h = box('head', (0.2, 2.2, 0.35), (car_len / 2 + 0.05, 0, 0.8), head)
    h.parent = parts[0]
    return parts


def cars_on_streets(rnd, n, half, block, street, avenue_y=0.0):
    red = mat_emit('tail', (1, 0.05, 0.03, 1), 25)
    whi = mat_emit('headl', (1, 0.95, 0.85, 1), 40)
    dark = mat_pbr('carbody', (0.02, 0.02, 0.025, 1), 0.2, 0.6)
    cars = []
    for i in range(n):
        horiz = rnd.random() < 0.6
        lane = rnd.choice(range(-half, half, block)) + street / 2 + rnd.choice([-2.2, 2.2])
        if horiz and rnd.random() < 0.5:
            lane = avenue_y + rnd.choice([-7, -4, 4, 7])
        direction = 1 if (lane > 0) == (rnd.random() < 0.5) else -1
        b = box('ccar', (4.4, 1.9, 1.3), (0, 0, 0.3), dark)
        for sgn, m in ((1, whi), (-1, red)):
            for side in (-0.65, 0.65):
                l = box('cl', (0.1, 0.4, 0.18), (sgn * 2.22, side, 0.55), m)
                l.parent = b
        cars.append(dict(ob=b, horiz=horiz, lane=lane, dir=direction, off=rnd.uniform(-half, half),
                         speed=rnd.uniform(9, 16)))
    return cars


def update_cars(cars, t, half):
    for c in cars:
        s = ((c['off'] + c['dir'] * c['speed'] * t + half) % (2 * half)) - half
        if c['horiz']:
            c['ob'].location = (s, c['lane'], 0.3)
            c['ob'].rotation_euler = (0, 0, 0 if c['dir'] > 0 else math.pi)
        else:
            c['ob'].location = (c['lane'], s, 0.3)
            c['ob'].rotation_euler = (0, 0, math.pi / 2 if c['dir'] > 0 else -math.pi / 2)


def ground(size=900, mat=None):
    v = [(-size, -size, 0), (size, -size, 0), (size, size, 0), (-size, size, 0)]
    return mesh_obj('ground', v, [(0, 1, 2, 3)], mat or mat_wet_ground('wet'))


def omni_tower(loc=(0, 0, 0), h=330, w=34, ring_z=0.66, detail=True):
    """Tall dark tower with emissive edge lines, a magenta holo ring and red aviation lights."""
    x0, y0, z0 = loc
    m, nt, out = nodes_mat('towerglass')
    N = nt.nodes
    Lk = nt.links.new
    tc = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ')
    Lk(tc.outputs['Object'], sep.inputs[0])
    mth = []

    def math_(op, a, b):
        n = N.new('ShaderNodeMath')
        n.operation = op
        for i, x in enumerate((a, b)):
            if isinstance(x, (int, float)):
                n.inputs[i].default_value = x
            else:
                Lk(x, n.inputs[i])
        return n.outputs[0]
    u = math_('ADD', sep.outputs['X'], sep.outputs['Y'])
    lines_v = math_('LESS_THAN', math_('FRACT', math_('DIVIDE', u, 4.0), 0), 0.05)
    lines_h = math_('LESS_THAN', math_('FRACT', math_('DIVIDE', sep.outputs['Z'], 22.0), 0), 0.012)
    msk = math_('MAXIMUM', math_('MULTIPLY', lines_v, 0.35), lines_h)
    p = N.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = (0.01, 0.011, 0.016, 1)
    p.inputs['Metallic'].default_value = 0.85
    p.inputs['Roughness'].default_value = 0.16
    p.inputs['Emission Color'].default_value = (0.55, 0.85, 1.0, 1)
    Lk(math_('MULTIPLY', msk, 2.5), p.inputs['Emission Strength'])
    Lk(p.outputs[0], out.inputs[0])
    tower = box('omni', (w, w, h * 0.82), (x0, y0, z0), m, top_scale=0.72)
    crown = box('crown', (w * 0.72, w * 0.72, h * 0.14), (x0, y0, z0 + h * 0.82), m, top_scale=0.45)
    spire = box('spire', (1.2, 1.2, h * 0.1), (x0, y0, z0 + h * 0.96), mat_pbr('spire', (0.05, 0.05, 0.06, 1), 0.3, 1))
    red = mat_emit('aviation', (1, 0.05, 0.05, 1), 80)
    avi = []
    for k, zz in enumerate([h * 0.82, h * 0.96, h * 1.06]):
        s = bpy.data.meshes.new('avi')
        o = box('avi', (1.1, 1.1, 1.1), (x0, y0, z0 + zz + 0.5), red, base=False)
        avi.append(o)
    # OMNI letters on the crown
    wl = mat_emit('omniword', (1.0, 0.85, 0.95, 1), 14)
    hw = w * 0.72 / 2 * 0.86
    for ang in range(4):
        a = ang * math.pi / 2
        dx, dy = math.sin(a), -math.cos(a)
        t = text_obj('OMNIw', 'OMNI', 8.5, mat=wl, loc=(x0 + dx * (hw + 0.3), y0 + dy * (hw + 0.3), z0 + h * 0.86),
                     rot=(math.pi / 2 - 0.0, 0, a))
    # holo rings
    ringmat = mat_emit('ring', MAG, 12)
    ringmat2 = mat_emit('ring2', CYAN, 8)
    holo = mat_emit('holo', MAG, 1.4, transparent=0.8)
    rings = []
    for k, (r, zz, mm, th) in enumerate([(w * 1.25, h * ring_z, ringmat, 0.7), (w * 1.05, h * ring_z + 14, ringmat2, 0.4)]):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=th, major_segments=96, minor_segments=8,
                                         location=(x0, y0, z0 + zz))
        ob = bpy.context.object
        ob.data.materials.append(mm)
        rings.append(ob)
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=w * 1.25, depth=9, location=(x0, y0, z0 + h * ring_z + 4.5),
                                        end_fill_type='NOTHING')
    band = bpy.context.object
    band.data.materials.append(holo)
    band.visible_shadow = False
    rings.append(band)
    return dict(tower=tower, rings=rings, avi=avi, h=h)


def drones_make(n, rnd, center, rmin, rmax, zmin, zmax, size=2.4):
    body = mat_pbr('dronebody', (0.03, 0.03, 0.035, 1), 0.35, 0.7)
    red = mat_emit('dred', RED, 70)
    blue = mat_emit('dblue', BLUE, 70)
    arr = []
    for i in range(n):
        b = box('drone', (size, size, size * 0.3), (0, 0, 0), body, base=False)
        lr = box('dl', (size * 0.28,) * 3, (size * 0.55, 0, 0), red, base=False)
        lb = box('dl', (size * 0.28,) * 3, (-size * 0.55, 0, 0), blue, base=False)
        lr.parent = b
        lb.parent = b
        arr.append(dict(ob=b, lr=lr, lb=lb, r=rnd.uniform(rmin, rmax), z=rnd.uniform(zmin, zmax),
                        ph=rnd.uniform(0, 2 * math.pi), w=rnd.choice([-1, 1]) * rnd.uniform(0.12, 0.3),
                        bob=rnd.uniform(0, 6), blink=rnd.uniform(0, 1)))
    return arr


def drones_update(arr, t, center):
    cx, cy = center[0], center[1]
    for d in arr:
        a = d['ph'] + d['w'] * t
        d['ob'].location = (cx + d['r'] * math.cos(a), cy + d['r'] * math.sin(a), d['z'] + 2.5 * math.sin(t * 0.9 + d['bob']))
        d['ob'].rotation_euler = (0.1 * math.sin(t + d['bob']), 0.12, a + math.pi / 2)
        on = ((t * 1.6 + d['blink']) % 1.0) < 0.55
        s = 1.0 if on else 0.35
        d['lr'].scale = (s, s, s)
        d['lb'].scale = ((1.35 - s),) * 3


# --------------------------------------------------------------------------- shots


def shot_A(sc, nfr):
    """Aerial flythrough of a neon block at night in rain, Line 2 train on the viaduct."""
    rnd = random.Random(7)
    half, block, street = 176, 44, 13
    ground()
    make_city(rnd, half, block, street, avenue_y=0.0, avenue_w=24, hmin=7, hmax=44, tall_center=(60, 0), sign_density=0.5)
    street_lights(rnd, half, block, street, energy=700)
    deck_top = viaduct(460, 0.0, 9.0)
    tr = train(6, y=0.0, z=deck_top)
    cars = cars_on_streets(rnd, 34, half, block, street)
    tw = omni_tower((265, 30, 0), h=320, ring_z=0.45)
    rain = Rain(2400, (0, 0, 0), (40, 40), (0, 70), length=1.6, width=0.02, speed=30, strength=0.25)
    cam = camera(24, clip=(0.5, 3000))
    # fill light: faint cool moonlight + magenta sky glow from the tower
    light('SUN', (0, 0, 50), 0.12, (0.5, 0.6, 1.0), rot=(0.9, 0.2, 0.6), name='moon')
    light('POINT', (265, 30, 150), 250000, (1.0, 0.25, 0.55), 30, name='towerglow')
    path = [(-215, -120, 105), (-170, -62, 70), (-128, -14, 42), (-85, -4, 28), (-30, -2.5, 24)]
    tgt = [(-90, 8, 0), (-40, 6, 4), (20, 4, 10), (120, 8, 26), (265, 24, 82)]

    def frame(f):
        t = (f - 1) / FPS
        u = ease_io(0.08 + 0.92 * (f - 1) / max(1, nfr - 1)) if nfr > 1 else 0
        u = (f - 1) / max(1, nfr - 1)
        u = 0.5 * u + 0.5 * ease_io(u)
        p = catmull(path, u)
        look(cam, p, catmull(tgt, u), roll=math.radians(-4 + 6 * u))
        x = -118 + 19 * t
        for i, c in enumerate(tr):
            c.location = (x - i * 19.3, 0.0, deck_top)
        update_cars(cars, t, half)
        for i, r in enumerate(tw['rings'][:2]):
            r.rotation_euler = (0.03 * math.sin(t + i), 0.03 * math.cos(t), t * (0.2 if i == 0 else -0.3))
        rain.update(t, center=(p.x + 45, p.y + 12, 0))
    return frame, dict(mist=(30, 380), fog=(0.03, 0.018, 0.05), fog_amt=0.65)


def mat_brick(name, scale=1.0, warm=1.0):
    m, nt, out = nodes_mat(name)
    N = nt.nodes
    L = nt.links.new
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    L(tc.outputs['Object'], mp.inputs['Vector'])
    # facade uses (x+y, z): brick courses run horizontally on both facade orientations
    sep = N.new('ShaderNodeSeparateXYZ')
    L(mp.outputs['Vector'], sep.inputs[0])
    add = N.new('ShaderNodeMath')
    add.operation = 'ADD'
    L(sep.outputs['X'], add.inputs[0])
    L(sep.outputs['Y'], add.inputs[1])
    comb = N.new('ShaderNodeCombineXYZ')
    L(add.outputs[0], comb.inputs[0])
    L(sep.outputs['Z'], comb.inputs[1])
    br = N.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = 0.011
    br.inputs['Mortar Smooth'].default_value = 0.2
    br.inputs['Bias'].default_value = 0.0
    br.inputs['Brick Width'].default_value = 0.24
    br.inputs['Row Height'].default_value = 0.075
    br.inputs['Color1'].default_value = (0.24 * warm, 0.055, 0.03, 1)
    br.inputs['Color2'].default_value = (0.15 * warm, 0.035, 0.022, 1)
    br.inputs['Mortar'].default_value = (0.09, 0.08, 0.07, 1)
    br.offset = 0.5
    L(comb.outputs[0], br.inputs['Vector'])
    noise = N.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 1.5
    L(tc.outputs['Object'], noise.inputs['Vector'])
    mixc = N.new('ShaderNodeMix')
    mixc.data_type = 'RGBA'
    mixc.blend_type = 'MULTIPLY'
    mixc.inputs['Factor'].default_value = 0.55
    L(br.outputs['Color'], mixc.inputs['A'])
    L(noise.outputs['Color'], mixc.inputs['B'])
    bump = N.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.45
    bump.invert = True
    L(br.outputs['Fac'], bump.inputs['Height'])
    rr = N.new('ShaderNodeMapRange')
    rr.inputs['To Min'].default_value = 0.35
    rr.inputs['To Max'].default_value = 0.8
    L(br.outputs['Fac'], rr.inputs['Value'])
    p = N.new('ShaderNodeBsdfPrincipled')
    L(mixc.outputs['Result'], p.inputs['Base Color'])
    L(rr.outputs['Result'], p.inputs['Roughness'])
    L(bump.outputs['Normal'], p.inputs['Normal'])
    p.inputs['Coat Weight'].default_value = 0.25  # rain-wet sheen
    p.inputs['Coat Roughness'].default_value = 0.2
    L(p.outputs[0], out.inputs[0])
    return m


def shoe_outline():
    """2D boot silhouette (x forward, y up) for the workshop sign."""
    return [(-0.55, 0.0), (0.55, 0.0), (0.62, 0.1), (0.55, 0.2), (0.2, 0.28), (0.02, 0.33), (-0.05, 0.62),
            (-0.3, 0.64), (-0.33, 0.25), (-0.52, 0.22), (-0.6, 0.1)]


def shot_B(sc, nfr):
    """Red-brick workshop alley: low brick buildings, warm windows, hanging shoe-workshop sign."""
    rnd = random.Random(11)
    ground(mat=mat_wet_ground('wetB', base=(0.02, 0.016, 0.014, 1), scale=0.25, dry=0.35, wet=0.03))
    brick = mat_brick('brick', 1.0)
    brick2 = mat_brick('brick2', 1.0, warm=1.25)
    frame_m = mat_pbr('wframe', (0.02, 0.018, 0.016, 1), 0.5, 0.3)
    wglow = mat_emit('wglow', srgb((255, 150, 70)), 1.1)
    wglow2 = mat_emit('wglow2', srgb((255, 120, 50)), 0.6)
    dark_win = mat_pbr('darkwin', (0.01, 0.01, 0.012, 1), 0.08, 0.0)
    metal = mat_pbr('metal', (0.2, 0.2, 0.2, 1), 0.35, 1.0)
    street_w = 8.0
    mull = []
    # buildings on both sides along +y
    for side in (-1, 1):
        y = -30.0
        while y < 120:
            wdt = rnd.uniform(8, 14)
            h = rnd.choice([6.5, 6.8, 9.8, 10.2, 13.0])
            dep = 12
            x = side * (street_w / 2 + dep / 2)
            b = box('brickbld', (dep, wdt - 0.3, h), (x, y + wdt / 2, 0), brick if rnd.random() < 0.6 else brick2)
            # windows per floor
            floors = int(h // 3.2)
            face_x = side * (street_w / 2) - side * 0.02
            for fl in range(floors):
                zc = 1.9 + fl * 3.2 if fl else 1.6
                nwin = max(1, int(wdt // 3.4))
                for k in range(nwin):
                    yc = y + (k + 0.5) * wdt / nwin
                    ww = min(2.2, wdt / nwin - 0.9) if fl else min(3.0, wdt / nwin - 0.6)
                    wh = 1.6 if fl else 2.4
                    lit = rnd.random() < (0.75 if fl == 0 else 0.5)
                    m = (wglow if rnd.random() < 0.6 else wglow2) if lit else dark_win
                    win = box('win', (0.1, ww, wh), (face_x - side * 0.03, yc, zc - wh / 2), m)
                    mx = face_x - side * 0.12
                    nv = 2 if ww > 1.6 else 1
                    for kk in range(1, nv + 1):
                        mull.append((0.06, 0.07, wh, mx, yc - ww / 2 + kk * ww / (nv + 1), zc - wh / 2))
                    mull.append((0.06, ww, 0.07, mx, yc, zc - wh / 2 + wh * (0.62 if fl else 0.72)))
                    fr = box('wfr', (0.14, ww + 0.25, 0.14), (face_x + side * 0.0, yc, zc - wh / 2 - 0.14), frame_m)
                    if lit and fl == 0 and rnd.random() < 0.6:
                        light('AREA', (face_x - side * 0.6, yc, zc), 18, (1.0, 0.62, 0.32), size=1.6,
                              rot=(0, -side * math.pi / 2, 0), name='winL')
            # rooftop edge / cornice
            box('cornice', (dep + 0.3, wdt - 0.1, 0.35), (x, y + wdt / 2, h), frame_m)
            # AC units and pipes
            if rnd.random() < 0.6:
                box('ac', (0.7, 1.0, 0.7), (face_x - side * 0.35, y + rnd.uniform(1.5, wdt - 1.5), rnd.uniform(3.8, h - 1)), metal)
            y += wdt
    multi_box_obj('mullions', mull, frame_m)
    # utility wires across the alley
    wire = mat_pbr('wire', (0.01, 0.01, 0.01, 1), 0.6)
    for k in range(7):
        yy = 6 + k * 13 + rnd.uniform(-3, 3)
        bpy.ops.curve.primitive_bezier_curve_add(location=(0, 0, 0))
        c = bpy.context.object
        sp = c.data.splines[0]
        z1, z2 = rnd.uniform(6, 8), rnd.uniform(6, 8)
        sp.bezier_points[0].co = (-street_w / 2, yy, z1)
        sp.bezier_points[0].handle_left = (-street_w / 2 - 1, yy, z1)
        sp.bezier_points[0].handle_right = (-1.0, yy + 0.3, z1 - 1.3)
        sp.bezier_points[1].co = (street_w / 2, yy + rnd.uniform(-2, 2), z2)
        sp.bezier_points[1].handle_left = (1.0, yy + 0.3, z2 - 1.3)
        sp.bezier_points[1].handle_right = (street_w / 2 + 1, yy, z2)
        c.data.bevel_depth = 0.018
        c.data.materials.append(wire)
    # the hanging shoe-workshop sign (left side)
    sy = 16.0
    sx = -street_w / 2
    arm = box('arm', (2.4, 0.08, 0.08), (sx + 1.2, sy, 4.9), metal, base=False)
    for dx in (0.45, 1.95):
        box('chain', (0.03, 0.03, 0.5), (sx + dx, sy, 4.4), metal)
    board_m = mat_pbr('board', (0.05, 0.03, 0.02, 1), 0.45)
    board = box('board', (2.0, 0.12, 1.1), (sx + 1.2, sy, 3.3), board_m)
    amber_neon = mat_emit('amberneon', AMBER, 16)
    for side in (1, -1):
        t = text_obj('shoesign', '수제화', 0.46, mat=amber_neon, loc=(0, -0.08 * side, 0.72),
                     rot=(math.pi / 2, 0, 0 if side == 1 else math.pi))
        t.parent = board
        t2 = text_obj('shoesign2', 'HANDMADE SHOES', 0.14, mat=amber_neon, loc=(0, -0.08 * side, 0.3),
                      rot=(math.pi / 2, 0, 0 if side == 1 else math.pi), fontfile=font('IBMPlexMono-SemiBold.ttf'))
        t2.parent = board
    # boot silhouette neon above the board
    pts = shoe_outline()
    verts = [(sx + 1.2 + p[0] * 1.3, sy, 4.05 + p[1] * 0.9) for p in pts]
    bpy.ops.curve.primitive_bezier_curve_add()
    c = bpy.context.object
    c.data.splines.clear()
    spl = c.data.splines.new('POLY')
    spl.points.add(len(verts) - 1)
    for i, v in enumerate(verts):
        spl.points[i].co = (*v, 1)
    spl.use_cyclic_u = True
    c.data.dimensions = '3D'
    c.data.bevel_depth = 0.03
    c.data.materials.append(amber_neon)
    light('POINT', (sx + 1.2, sy - 0.8, 3.6), 60, (1.0, 0.7, 0.35), 0.3, name='signL')
    # other small signs further down the alley
    neon2 = [mat_emit('n_c', CYAN, 10), mat_emit('n_m', MAG, 10), mat_emit('n_a', AMBER, 10)]
    for k, (word, yy, sd) in enumerate([('구두 수선', 34, 1), ('가죽', 48, -1), ('공방', 62, 1), ('BLACK ROASTERY', 78, -1),
                                          ('성수', 96, 1)]):
        t = text_obj('asign', word, 0.7, mat=neon2[k % 3],
                     loc=(sd * (street_w / 2 - 0.08), yy, rnd.uniform(3.6, 5.0)),
                     rot=(math.pi / 2, 0, -sd * math.pi / 2), fontfile=BHS if word != 'BLACK ROASTERY' else font('IBMPlexMono-SemiBold.ttf'))
    # warm street lamps
    for k in range(6):
        yy = 4 + k * 18
        sd = -1 if k % 2 else 1
        box('pole', (0.12, 0.12, 5.5), (sd * (street_w / 2 - 0.4), yy, 0), metal)
        box('lampbulb', (0.35, 0.35, 0.2), (sd * (street_w / 2 - 0.9), yy, 5.3), mat_emit('bulb', WARM, 12), base=False)
        light('POINT', (sd * (street_w / 2 - 0.9), yy, 5.1), 160, (1.0, 0.6, 0.3), 0.25, name='lamp')
    # far end glow (the neon future pushing in)
    # OMNI Tower far away at the end of the alley: the future pushing in
    omni_tower((10, 950, 0), h=400, ring_z=0.28)
    rain = Rain(1500, (0, 0, 0), (7, 30), (0, 14), length=0.6, width=0.006, speed=18, strength=0.18, wind=(0.4, 0.2))
    cam = camera(32)
    light('SUN', (0, 0, 20), 0.08, (0.6, 0.7, 1.0), rot=(0.6, 0.3, 0.4), name='moon')

    def frame(f):
        t = (f - 1) / FPS
        u = (f - 1) / max(1, nfr - 1)
        u = 0.6 * u + 0.4 * ease_io(u)
        p = Vector((0.9 - 1.4 * u, -8 + 10 * u, 1.55 + 0.35 * u))
        tg = Vector((-1.2 + 0.4 * u, 22 + 6 * u, 3.2 - 0.3 * u))
        look(cam, p, tg, roll=math.radians(1.5 - 2.5 * u))
        rain.update(t, center=(p.x, p.y + 18, 0))
        board.rotation_euler = (0, 0.04 * math.sin(t * 1.3), 0)
    return frame, dict(mist=(8, 120), fog=(0.04, 0.025, 0.028), fog_amt=0.45, exposure=-0.4)


def shot_C(sc, nfr):
    """OMNI Tower hero shot: very tall dark tower, magenta holo ring, drone swarm. Slow push-in."""
    rnd = random.Random(21)
    ground()
    half, block, street = 220, 44, 13
    make_city(rnd, half, block, street, avenue_y=-1000, hmin=6, hmax=30, tall_center=(0, 0),
              skip=lambda x, y: math.hypot(x, y) < 55 or (abs(x) < 45 and y < -40), sign_density=0.25)
    street_lights(rnd, half, block, street, energy=500)
    tw = omni_tower((0, 0, 0), h=340, ring_z=0.62)
    # plaza lights at the tower foot
    plaza = mat_emit('plaza', CYAN, 6)
    box('plazaring', (60, 60, 0.05), (0, 0, 0), mat_pbr('plazafloor', (0.02, 0.02, 0.03, 1), 0.1, 0.5))
    for a in range(12):
        ang = a * math.pi / 6
        box('plazal', (0.4, 0.4, 3), (38 * math.cos(ang), 38 * math.sin(ang), 0), plaza)
    drones = drones_make(70, rnd, (0, 0), 32, 100, 40, 280, size=5.0)
    near = drones_make(8, random.Random(5), (0, 0), 0, 0, 0, 0, size=2.0)
    # searchlight beams from the crown
    beam = mat_emit('beam', (0.8, 0.9, 1.0, 1), 0.3, transparent=0.95)
    beams = []
    for k in range(3):
        bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=26, radius2=0.8, depth=260, end_fill_type='NOTHING')
        b = bpy.context.object
        b.data.materials.append(beam)
        b.visible_shadow = False
        beams.append(b)
    rain = Rain(1600, (0, 0, 0), (40, 40), (0, 60), length=1.5, width=0.02, speed=30, strength=0.16)
    light('POINT', (0, 0, 210), 180000, (1.0, 0.2, 0.5), 20, name='ringglow')
    light('SUN', (0, 0, 50), 0.1, (0.5, 0.6, 1.0), rot=(0.9, 0.2, 0.6), name='moon')
    cam = camera(22, clip=(0.1, 5000))

    def frame(f):
        t = (f - 1) / FPS
        u = (f - 1) / max(1, nfr - 1)
        u = 0.55 * u + 0.45 * ease_io(u)
        p = Vector((-70 + 40 * u, -320 + 110 * u, 22 + 16 * u))
        tg = Vector((0, 0, 100 + 28 * u))
        look(cam, p, tg, roll=math.radians(-3 + 4 * u))
        for i, r in enumerate(tw['rings']):
            if i < 2:
                r.rotation_euler = (0.06 * math.sin(t * 0.7 + i), 0.05 * math.cos(t * 0.5 + i), t * (0.15 if i == 0 else -0.25))
        drones_update(drones, t, (0, 0))
        # a handful of drones cross close to camera for scale
        for k, d in enumerate(near):
            a = t * 0.35 + k * 0.8
            fx = p.x + 30 + 22 * math.cos(a) + k * 6
            d['ob'].location = (fx, p.y + 45 + k * 9, p.z + 8 + 10 * math.sin(a * 1.3 + k))
            d['ob'].rotation_euler = (0, 0.1, a)
            on = ((t * 1.6 + k * 0.13) % 1.0) < 0.55
            d['lr'].scale = (1.0 if on else 0.35,) * 3
        for k, b in enumerate(beams):
            ang = t * 0.35 + k * 2.1
            tilt = 0.55 + 0.1 * math.sin(t * 0.6 + k)
            b.location = (0, 0, 300)
            b.rotation_euler = (math.pi + tilt * math.cos(ang), tilt * math.sin(ang), 0)
            b.location = Vector((0, 0, 300)) + Vector((math.sin(tilt * math.sin(ang)) * 130, -math.sin(tilt * math.cos(ang)) * 130, -130 * math.cos(tilt)))
        rain.update(t, center=(p.x + 20, p.y + 28, 0))
    return frame, dict(mist=(40, 700), fog=(0.018, 0.011, 0.034), fog_amt=0.75)


def shot_D(sc, nfr):
    """3D logo reveal: extruded 네온 성수 with neon tubes + NEON SEONGSU over wet ground, flicker-on + light sweep."""
    ground(mat=mat_wet_ground('wetD', base=(0.01, 0.01, 0.014, 1), scale=0.35, dry=0.3, wet=0.02))
    body = mat_pbr('logobody', (0.015, 0.012, 0.02, 1), 0.22, 0.6, coat=0.6)
    tube_mag = mat_emit('tube_mag', MAG, 0)
    tube_cy = mat_emit('tube_cy', CYAN, 0)
    face_mag = mat_emit('face_mag', srgb((120, 10, 60)), 0)
    face_cy = mat_emit('face_cy', srgb((10, 90, 110)), 0)
    sub_m = mat_emit('sub', (0.85, 0.95, 1.0, 1), 0)
    size = 2.25
    y0 = 0.0
    zc = 2.05
    words = [('네온', -2.28, tube_mag, face_mag), ('성수', 2.28, tube_cy, face_cy)]
    tubes = []
    for w, x, tm, fm in words:
        b = text_obj('logo_' + w, w, size, extrude=0.22, mat=body, loc=(x, y0 + 0.22, zc))
        f = text_obj('logoface_' + w, w, size, mat=fm, loc=(x, y0 - 0.005, zc))
        tb = neon_tube(f, 'tube_' + w, 0.032, tm)
        tb.location.y -= 0.03
        tubes.append(tb)
    sub = text_obj('subtitle', 'N E O N   S E O N G S U', 0.42, mat=sub_m, loc=(0, -0.05, 0.62),
                   fontfile=BHS)
    line_m = mat_emit('rule', MAG, 0)
    rule_l = box('rule_l', (2.3, 0.03, 0.03), (-3.4, -0.05, 0.62), line_m, base=False)
    rule_r = box('rule_r', (2.3, 0.03, 0.03), (3.4, -0.05, 0.62), line_m, base=False)
    # back wall of distant bokeh lights
    rnd = random.Random(4)
    cols = [MAG, CYAN, AMBER, GREEN, WARM]
    bk = [mat_emit(f'bk{i}', c, 8) for i, c in enumerate(cols)]
    for i in range(120):
        s = rnd.uniform(0.12, 0.3)
        box('bokeh', (s, s, s), (rnd.uniform(-50, 50), rnd.uniform(30, 70), rnd.uniform(0.5, 14)), rnd.choice(bk), base=False)
    # silhouettes of buildings behind
    wm = mat_windows('facadeD', lit=0.25, strength=0.7, col_w=1.6, floor_h=2.6, store=False)
    for i in range(22):
        x = -90 + i * 8.5 + rnd.uniform(-2, 2)
        box('bgb', (8, 8, rnd.uniform(14, 45)), (x, rnd.uniform(75, 95), 0), wm)
    # sweep light
    sweep = light('AREA', (-9, -3, 3), 0, (1.0, 1.0, 1.0), size=0.5, rot=(math.radians(80), 0, 0), name='sweep')
    sweep.data.shape = 'RECTANGLE'
    sweep.data.size = 0.4
    sweep.data.size_y = 5.0
    key_mag = light('AREA', (-5, -4, 0.3), 0, (1.0, 0.2, 0.55), size=3, rot=(math.radians(80), 0, math.radians(-40)))
    key_cy = light('AREA', (5, -4, 0.3), 0, (0.2, 0.9, 1.0), size=3, rot=(math.radians(80), 0, math.radians(40)))
    rain = Rain(900, (0, 0, 0), (9, 9), (0, 9), length=0.45, width=0.006, speed=14, strength=0.14, wind=(0.3, 0.1))
    cam = camera(35)
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 1.4
    cam.data.dof.focus_distance = 11.0
    rng = random.Random(9)
    fl_a = [rng.random() for _ in range(400)]
    fl_b = [rng.random() for _ in range(400)]
    HIT = 1.6

    def flick(t, start, arr, f):
        if t < start:
            return 0.0
        if t >= HIT:
            # steady with rare hum dips
            return 0.55 if arr[f % 400] < 0.025 else 1.0
        return 1.0 if arr[f % 400] < (t - start) / (HIT - start) * 0.9 + 0.1 else 0.0

    def frame(f):
        t = (f - 1) / FPS
        u = min(1.0, t / 6.0)
        u = ease_io(u)
        p = Vector((-0.8 + 0.8 * u, -13.2 + 2.2 * u, 1.0 + 0.3 * u))
        look(cam, p, (0, 0, 1.55 + 0.1 * u), roll=math.radians(-1.0 + 1.0 * u))
        cam.data.dof.focus_distance = (Vector((0, 0, 1.6)) - p).length
        a = flick(t, 0.35, fl_a, f)
        b = flick(t, 0.8, fl_b, f + 37)
        set_emit(tube_mag, 4.2 * a)
        set_emit(face_mag, 0.5 * a)
        set_emit(tube_cy, 3.6 * b)
        set_emit(face_cy, 0.5 * b)
        k_sub = ease(max(0.0, (t - 2.3) / 0.8))
        set_emit(sub_m, 3 * k_sub)
        set_emit(line_m, 8 * ease(max(0.0, (t - 2.0) / 0.6)))
        rule_l.scale = (max(0.001, ease((t - 2.0) / 0.6)), 1, 1)
        rule_r.scale = (max(0.001, ease((t - 2.0) / 0.6)), 1, 1)
        key_mag.data.energy = 120 * a
        key_cy.data.energy = 120 * b
        # light sweep across the letters right after the hit
        s = (t - (HIT + 0.3)) / 1.6
        if 0 <= s <= 1:
            sweep.data.energy = 900 * math.sin(math.pi * s)
            sweep.location = (-9 + 18 * ease_io(s), -2.2, 2.4)
        else:
            sweep.data.energy = 0
        rain.update(t, center=(p.x, p.y + 6, 0))
    return frame, dict(mist=(12, 110), fog=(0.03, 0.02, 0.05), fog_amt=0.55, exposure=0.0)


SHOTS = dict(A=('A_aerial', shot_A), B=('B_brick', shot_B), C=('C_tower', shot_C), D=('D_logo', shot_D))
# the logo shot renders this many seconds; the assembler holds the last frame for the remainder
D_RENDER_SEC = 4.8


def frames_for(key):
    name = SHOTS[key][0]
    tl = load_timeline()
    seg = [s for s in tl['segments'] if s['name'] == name][0]
    n = seg['frames']
    if key == 'D':
        n = min(n, int(D_RENDER_SEC * FPS))
    return n


def main():
    args = sys.argv[1:]
    key = args[0]
    opts = dict(zip(args[1::2], args[2::2])) if len(args) > 1 else {}
    force = '--force' in args
    if force:
        args.remove('--force')
        opts = dict(zip(args[1::2], args[2::2]))
    res = tuple(int(v) for v in opts.get('--res', '960x540').split('x'))
    samples = int(opts.get('--samples', dict(A=4, B=5, C=4, D=6)[key]))
    name, fn = SHOTS[key]
    nfr = int(opts.get('--frames', frames_for(key)))
    outdir = opts.get('--out', os.path.join(BUILD, 'blender', name))
    os.makedirs(outdir, exist_ok=True)
    only = [int(x) for x in opts['--only'].split(',')] if '--only' in opts else list(range(1, nfr + 1))
    only = [f for f in only if force or not os.path.exists(os.path.join(outdir, f'{f:05d}.png'))]
    print(f'shot {key} {name}: {nfr} frames total, {len(only)} to render at {res} x {samples} spp')
    if not only:
        return
    sc = reset()
    frame, look_opts = fn(sc, nfr)
    exp = look_opts.pop('exposure', 0.0)
    setup_render(sc, res, samples, exposure=exp, **look_opts)
    sc.frame_start, sc.frame_end = 1, nfr
    t0 = time.time()
    for i, f in enumerate(only):
        sc.frame_set(f)
        frame(f)
        sc.render.filepath = os.path.join(outdir, f'{f:05d}.png')
        bpy.ops.render.render(write_still=True)
        el = time.time() - t0
        print(f'[{key}] frame {f} done ({i + 1}/{len(only)}) {el / (i + 1):.2f}s/fr, eta {(len(only) - i - 1) * el / (i + 1) / 60:.1f} min',
              flush=True)


if __name__ == '__main__':
    main()
