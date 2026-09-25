"""Harness Theater: Blender 3D set and hero renders for the 10XAI video series.

Builds a bright toy-theater stage in 3D (sunburst backdrop, red curtains, wooden
floor), the host Dr. Harness (a hamster scientist in sunglasses), the 10XAI agent
characters, a 3D multi-agent Kanban board, the RISK meter, the gate, and the
hamster-wheel-powered 10XAI machine. Renders with Cycles plus Freestyle ink lines
so the 3D matches the hand-drawn storyboard look.

Usage (Blender 4.2, either inside Blender or with the `bpy` module):
    python3 docs/video/blender/harness_theater.py                  # all shots
    python3 docs/video/blender/harness_theater.py hero_kanban      # one shot
    python3 docs/video/blender/harness_theater.py mission_control --samples 12   # 4 s animated clip (MP4)
    python3 docs/video/blender/harness_theater.py --samples 16 --scale 50   # quick preview
    blender -b -P docs/video/blender/harness_theater.py -- hero_gate

Output: docs/video/renders/<shot>.png and renders/<anim>.mp4
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "renders"))

INK = "#3a2418"
C = {
    "fur": "#f0a64a", "fur2": "#d9832e", "cream": "#fff1d6", "pink": "#f7a1a8", "coat": "#ffffff",
    "glass": "#15151c", "teal": "#39b3b0", "curtain": "#e0473c", "gold": "#ffc23d", "wood": "#eaa865",
    "orchestrator": "#f25a6e", "decompose": "#4f8ef7", "gapfill": "#f7a928", "verify": "#e5533f",
    "router": "#8b6cf2", "runner": "#2fbf8a", "repair": "#f062a8", "deploy": "#a86af2", "hype": "#f2c14e",
    "red": "#e5533f", "green": "#2fbf8a", "white": "#fffdf6", "paper": "#fff6e6", "gray": "#bdb7ae",
}
COLS = [("Decomposed", "#4f8ef7"), ("Verifying", "#f7a928"), ("Gate / Review", "#e5533f"), ("Verified", "#2fbf8a")]


# ---------------------------------------------------------------- basics
def rgb(h, a=1.0):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), a)


_mats = {}


def mat(hexcol, rough=0.55, emit=0.0, metal=0.0, name=None):
    key = (hexcol, rough, emit, metal)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name or f"m_{hexcol}")
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = rgb(hexcol)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emit:
        p.inputs["Emission Color"].default_value = rgb(hexcol)
        p.inputs["Emission Strength"].default_value = emit
    _mats[key] = m
    return m


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def put(ob, parent=None, material=None):
    if material is not None:
        ob.data.materials.clear()
        ob.data.materials.append(material)
    if parent is not None:
        ob.parent = parent
    return ob


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), scale=1.0):
    e = bpy.data.objects.new(name, None)
    e.location, e.rotation_euler, e.scale = loc, rot, (scale, scale, scale)
    return link(e)


def sphere(loc, r, m, parent=None, scale=(1, 1, 1), seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    ob = bpy.context.object
    ob.scale = scale
    bpy.ops.object.shade_smooth()
    return put(ob, parent, m)


def cube(loc, size, m, parent=None, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.scale = size
    if bevel:
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        mod = ob.modifiers.new("bevel", "BEVEL")
        mod.width, mod.segments = bevel, 4
        bpy.ops.object.shade_smooth()
    return put(ob, parent, m)


def cyl(loc, r, depth, m, parent=None, rot=(0, 0, 0), verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    bpy.ops.object.shade_smooth()
    return put(ob, parent, m)


def cone(loc, r1, r2, depth, m, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    bpy.ops.object.shade_smooth()
    return put(ob, parent, m)


def torus(loc, R, r, m, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=64, minor_segments=16, location=loc, rotation=rot)
    ob = bpy.context.object
    bpy.ops.object.shade_smooth()
    return put(ob, parent, m)


def tube(points, r, m, parent=None, name="tube"):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions, cu.bevel_depth, cu.bevel_resolution, cu.use_fill_caps = "3D", r, 3, True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    ob = link(bpy.data.objects.new(name, cu))
    ob.data.materials.append(m)
    if parent is not None:
        ob.parent = parent
    return ob


def arc(cx, cy, cz, rx, rz, a0, a1, n=12):
    return [(cx + rx * math.cos(a), cy, cz + rz * math.sin(a)) for a in (a0 + (a1 - a0) * i / n for i in range(n + 1))]


def text(body, loc, size, m, parent=None, extrude=0.02, align="CENTER", rot=(math.pi / 2, 0, 0)):
    cu = bpy.data.curves.new("txt", "FONT")
    cu.body, cu.size, cu.extrude, cu.align_x, cu.align_y = body, size, extrude, align, "CENTER"
    cu.bevel_depth = extrude * 0.25
    ob = link(bpy.data.objects.new("txt", cu))
    ob.location, ob.rotation_euler = loc, rot
    ob.data.materials.append(m)
    if parent is not None:
        ob.parent = parent
    return ob


# ---------------------------------------------------------------- set
def world_and_render(w, h, samples, scale):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, scale
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = -0.35
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = "ABSOLUTE"
    sc.render.line_thickness = 2.2 * max(w, h) / 1920 * scale / 100
    fs = sc.view_layers[0].freestyle_settings
    fs.crease_angle = math.radians(120)
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("ink")
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("ink")
    ls.select_by_visibility, ls.select_silhouette, ls.select_border, ls.select_crease = True, True, True, True
    ls.linestyle.color = rgb(INK)[:3]
    ls.linestyle.thickness = 2.2
    wd = bpy.data.worlds.new("world")
    sc.world = wd
    wd.use_nodes = True
    bg = wd.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = rgb("#ffe9c4")
    bg.inputs["Strength"].default_value = 0.45


def sunburst_material():
    m = bpy.data.materials.new("sunburst")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.35
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (0, -0.25, 0)
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "RADIAL"
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    els = ramp.color_ramp.elements
    n = 22
    els[0].position, els[0].color = 0.0, rgb("#ffe27a")
    els[1].position, els[1].color = 1.0 / n, rgb("#ffb3a0")
    for i in range(2, n):
        e = els.new(i / n)
        e.color = rgb("#ffe27a" if i % 2 == 0 else "#ffb3a0")
    sph = nt.nodes.new("ShaderNodeTexGradient")
    sph.gradient_type = "SPHERICAL"
    mp2 = nt.nodes.new("ShaderNodeMapping")
    mp2.inputs["Location"].default_value = (0, -0.45, 0)
    mp2.inputs["Scale"].default_value = (1.8, 1.8, 1.8)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["B"].default_value = rgb("#fff6d8")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.2
    mix2 = nt.nodes.new("ShaderNodeMix")
    mix2.data_type, mix2.blend_type = "RGBA", "OVERLAY"
    mix2.inputs["Factor"].default_value = 0.12
    L = nt.links.new
    L(tc.outputs["Object"], mp.inputs["Vector"])
    L(mp.outputs["Vector"], grad.inputs["Vector"])
    L(grad.outputs["Fac"], ramp.inputs["Fac"])
    L(tc.outputs["Object"], mp2.inputs["Vector"])
    L(mp2.outputs["Vector"], sph.inputs["Vector"])
    L(sph.outputs["Fac"], mix.inputs["Factor"])
    L(ramp.outputs["Color"], mix.inputs["A"])
    L(mix.outputs["Result"], mix2.inputs["A"])
    L(noise.outputs["Color"], mix2.inputs["B"])
    L(mix2.outputs["Result"], em.inputs["Color"])
    L(em.outputs["Emission"], out.inputs["Surface"])
    return m


def stripes_material(c1, c2, scale=6.0, name="stripes", axis="X"):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Roughness"].default_value = 0.5
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.bands_direction = axis
    wave.inputs["Scale"].default_value = scale
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].color = rgb(c1)
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = rgb(c2)
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    return m


def curtain_mesh(name, x0, x1, z0, z1, y, folds, amp, m):
    nx, nz = 60, 24
    verts, faces = [], []
    for j in range(nz + 1):
        z = z0 + (z1 - z0) * j / nz
        for i in range(nx + 1):
            u = i / nx
            x = x0 + (x1 - x0) * u
            verts.append((x, y + amp * math.sin(u * folds * 2 * math.pi), z))
    for j in range(nz):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    for poly in me.polygons:
        poly.use_smooth = True
    ob = link(bpy.data.objects.new(name, me))
    ob.data.materials.append(m)
    sol = ob.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = 0.04
    return ob


def stage(width=16.0, curtains=True, backdrop=True, valance_z=7.2):
    floor = cube((0, -5.5, -0.25), (width + 8, 20, 0.5), None)
    fm = stripes_material("#eaa865", "#e39c57", scale=5.0, name="planks")
    floor.data.materials.append(fm)
    if backdrop:
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 4.2, 5.0), rotation=(math.pi / 2, 0, 0))
        bd = bpy.context.object
        bd.scale = (width * 1.6, 20, 1)
        bd.data.materials.append(sunburst_material())
        bd.visible_shadow = False
    if curtains:
        cm = mat(C["curtain"], 0.75)
        half = width / 2
        curtain_mesh("curtainL", -half - 3.5, -half + 1.2, -0.1, 16, 2.6, 5, 0.18, cm)
        curtain_mesh("curtainR", half - 1.2, half + 3.5, -0.1, 16, 2.6, 5, 0.18, cm)
        curtain_mesh("valance", -half - 4, half + 4, valance_z, valance_z + 9, 2.3, 26, 0.12, mat("#c9362f", 0.75))
        for sx in (-1, 1):
            torus((sx * (half - 0.9), 2.3, 3.3), 0.32, 0.09, mat(C["gold"], 0.35), rot=(math.pi / 2, 0, 0))


def lights():
    bpy.ops.object.light_add(type="SUN", location=(4, -6, 10))
    sun = bpy.context.object
    sun.data.energy, sun.data.angle = 2.2, math.radians(12)
    sun.data.color = (1.0, 0.95, 0.86)
    sun.rotation_euler = (math.radians(50), math.radians(12), math.radians(25))
    bpy.ops.object.light_add(type="AREA", location=(-5, -8, 5))
    a = bpy.context.object
    a.data.energy, a.data.size = 500, 8
    a.data.color = (1.0, 0.92, 0.95)
    a.rotation_euler = (math.radians(65), 0, math.radians(-30))
    bpy.ops.object.light_add(type="AREA", location=(6, -6, 3))
    b = bpy.context.object
    b.data.energy, b.data.size = 260, 6
    b.data.color = (0.9, 1.0, 0.98)
    b.rotation_euler = (math.radians(70), 0, math.radians(40))


def camera(loc, target, lens=35, dof=None):
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = lens
    cam = link(bpy.data.objects.new("cam", cam_data))
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    if dof:
        cam_data.dof.use_dof = True
        cam_data.dof.focus_distance = d.length if dof is True else dof[0]
        cam_data.dof.aperture_fstop = 2.8 if dof is True else dof[1]
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------- characters
def hamster(loc, scale=1.0, rot_z=0.0, pose="idle", mouth="smile", glasses="on", hoodie="#7c5cff", cap="#e5533f"):
    """Dr. Harness: a hip golden hamster (sunglasses, backwards snapback, gold 10X chain, hoodie, sneakers).
    Stands on z=0 in local space, faces -Y, about 2.2 units tall."""
    root = empty("hamster", loc, (0, 0, rot_z), scale)
    fur, cream, pink = mat(C["fur"], 0.8), mat(C["cream"], 0.8), mat(C["pink"], 0.6)
    hood, hood2 = mat(hoodie, 0.7), mat("#5a3fe0" if hoodie == "#7c5cff" else hoodie, 0.75)
    ink, glass = mat(INK, 0.5), mat(C["glass"], 0.08, metal=0.2)
    gold = mat("#ffc23d", 0.25, metal=0.85)
    capm, capd = mat(cap, 0.55), mat("#b8372a", 0.6)
    # sneakers
    for sx in (-1, 1):
        cube((sx * 0.25, -0.12, 0.1), (0.3, 0.46, 0.2), mat("#ffffff", 0.45), root, bevel=0.07)
        cube((sx * 0.25, -0.12, 0.02), (0.32, 0.5, 0.05), mat("#e0dbd3", 0.6), root, bevel=0.02)
        tube([(sx * 0.25 - 0.1, -0.36, 0.13), (sx * 0.25, -0.35, 0.09), (sx * 0.25 + 0.1, -0.33, 0.15)], 0.02, capm, root)
    # hoodie body, pocket, hood, drawstrings
    sphere((0, 0, 0.7), 0.64, hood, root, scale=(1.02, 0.88, 1.06))
    sphere((0, -0.47, 0.5), 0.3, mat("#9c85ff", 0.7), root, scale=(1.1, 0.35, 0.55))
    torus((0, 0.02, 1.17), 0.36, 0.13, hood2, root, rot=(math.radians(-15), 0, 0))
    for sx in (-1, 1):
        tube([(sx * 0.1, -0.5, 1.12), (sx * 0.12, -0.6, 0.85)], 0.018, mat("#ffffff", 0.4), root)
        sphere((sx * 0.12, -0.6, 0.83), 0.03, mat("#ffffff", 0.4), root)
    # gold chain + 10X pendant
    torus((0, -0.1, 1.12), 0.36, 0.035, gold, root, rot=(math.radians(-58), 0, 0))
    cube((0, -0.6, 0.93), (0.3, 0.05, 0.2), gold, root, bevel=0.03)
    text("10X", (0, -0.635, 0.93), 0.13, ink, root, extrude=0.008)
    # arms (sleeves + paws)
    shoulder = {-1: (-0.5, -0.05, 1.05), 1: (0.5, -0.05, 1.05)}
    paws = {"idle": {-1: (-0.64, -0.25, 0.58), 1: (0.64, -0.25, 0.58)},
            "wave": {-1: (-0.64, -0.25, 0.58), 1: (0.85, -0.3, 1.75)},
            "point": {-1: (-0.64, -0.25, 0.58), 1: (1.15, -0.45, 1.25)},
            "stamp": {-1: (-0.64, -0.25, 0.58), 1: (0.7, -0.45, 1.9)},
            "cheer": {-1: (-0.9, -0.25, 1.8), 1: (0.9, -0.25, 1.8)},
            "run": {-1: (-0.5, -0.55, 0.95), 1: (0.5, -0.6, 1.1)},
            "guns": {-1: (-0.95, -0.55, 1.1), 1: (0.95, -0.55, 1.1)}}[pose]
    for sx in (-1, 1):
        a, b = Vector(shoulder[sx]), Vector(paws[sx])
        tube([tuple(a), tuple(a.lerp(b, 0.5)), tuple(b)], 0.13, hood, root)
        sphere(tuple(b), 0.12, pink, root)
        if pose == "guns":
            tube([tuple(b), tuple(b + Vector((sx * 0.02, -0.22, 0.02)))], 0.035, pink, root)
    # head
    sphere((0, -0.05, 1.58), 0.52, fur, root, scale=(1.08, 0.95, 0.9))
    for sx in (-1, 1):
        sphere((sx * 0.5, 0.0, 1.86), 0.16, fur, root, scale=(1, 0.55, 1))
        sphere((sx * 0.5, -0.07, 1.86), 0.09, pink, root, scale=(1, 0.4, 1))
        sphere((sx * 0.3, -0.36, 1.43), 0.24, cream, root, scale=(1, 0.8, 0.85))
        sphere((sx * 0.33, -0.55, 1.41), 0.07, mat("#f07f86", 0.7), root, scale=(1, 0.3, 0.6))
        for dz, dx in ((0.03, 0.34), (-0.04, 0.36)):
            tube([(sx * 0.36, -0.52, 1.43 + dz), (sx * (0.36 + dx), -0.5, 1.43 + dz * 3)], 0.008, ink, root)
    sphere((0, -0.5, 1.43), 0.2, cream, root, scale=(1, 0.7, 0.75))
    sphere((0, -0.64, 1.5), 0.06, mat("#e8747c", 0.4), root, scale=(1.2, 0.8, 0.8))
    if mouth == "grin":
        sphere((0, -0.63, 1.36), 0.08, mat("#8a2f2a", 0.6), root, scale=(1.3, 0.5, 0.8))
        cube((0, -0.68, 1.39), (0.07, 0.02, 0.06), mat("#ffffff", 0.3), root)
    elif mouth == "o":
        sphere((0, -0.63, 1.35), 0.06, mat("#8a2f2a", 0.6), root, scale=(1, 0.5, 1.2))
    else:
        tube(arc(-0.045, -0.66, 1.41, 0.045, 0.03, math.pi, 2 * math.pi, 8) + arc(0.045, -0.66, 1.41, 0.045, 0.03, math.pi, 2 * math.pi, 8)[1:], 0.012, ink, root)
        tube([(0.09, -0.65, 1.41), (0.15, -0.63, 1.45)], 0.012, ink, root)
    # backwards snapback: dome + brim pointing back + strap opening on the forehead
    sphere((0, 0.0, 1.97), 0.48, capm, root, scale=(1.08, 1.0, 0.5))
    cube((0.1, 0.5, 2.02), (0.55, 0.5, 0.05), capd, root, bevel=0.03, rot=(math.radians(-12), 0, math.radians(8)))
    sphere((0, 0.0, 2.22), 0.05, capd, root)
    cube((0, -0.49, 1.93), (0.22, 0.04, 0.06), mat("#ffffff", 0.4), root, bevel=0.01)
    # sunglasses
    gz = 1.64 if glasses == "on" else 1.98
    gy = -0.6 if glasses == "on" else -0.45
    if glasses == "up":
        for sx in (-1, 1):
            sphere((sx * 0.17, -0.55, 1.64), 0.07, ink, root)
            sphere((sx * 0.17 + 0.03, -0.61, 1.67), 0.02, mat("#ffffff", 0.2, emit=1.0), root)
    for sx in (-1, 1):
        cube((sx * 0.19, gy, gz), (0.3, 0.06, 0.19), glass, root, bevel=0.05)
        tube([(sx * 0.33, gy + 0.02, gz + 0.03), (sx * 0.5, -0.1, gz + 0.05)], 0.015, glass, root)
        cube((sx * 0.13, gy - 0.035, gz + 0.04), (0.1, 0.005, 0.02), mat("#cfe0ff", 0.2, emit=0.6), root)
    tube([(-0.05, gy, gz + 0.02), (0, gy - 0.01, gz + 0.04), (0.05, gy, gz + 0.02)], 0.02, glass, root)
    return root


def face(root, w, d, zc, mood="happy"):
    ink = mat(INK, 0.5)
    y = -d / 2 - 0.012
    ex, er = w * 0.18, w * 0.07
    if mood in ("happy", "star"):
        for sx in (-1, 1):
            tube([(sx * ex - er, y, zc + 0.02), (sx * ex, y, zc + er + 0.02), (sx * ex + er, y, zc + 0.02)], 0.018, ink, root)
        tube(arc(0, y, zc - 0.1, w * 0.08, w * 0.06, math.pi, 2 * math.pi), 0.018, ink, root)
    elif mood == "worried":
        for sx in (-1, 1):
            sphere((sx * ex, y, zc + 0.03), 0.04, ink, root, scale=(1, 0.4, 1))
        tube([(-w * 0.1, y, zc - 0.12), (-w * 0.05, y, zc - 0.08), (0, y, zc - 0.12), (w * 0.05, y, zc - 0.08), (w * 0.1, y, zc - 0.12)], 0.016, ink, root)
        sphere((w * 0.4, y - 0.02, zc + 0.2), 0.05, mat("#9ad3ee", 0.2), root, scale=(0.8, 0.5, 1.2))
    elif mood == "alert":
        for sx in (-1, 1):
            sphere((sx * ex, y + 0.02, zc + 0.03), 0.08, mat("#ffffff", 0.3), root, scale=(1, 0.4, 1))
            sphere((sx * ex, y - 0.02, zc + 0.02), 0.035, ink, root, scale=(1, 0.4, 1))
        sphere((0, y, zc - 0.13), 0.035, ink, root, scale=(1, 0.4, 1.3))


def agent(loc, color, size=1.0, mood="happy", label=None, carry=None, carry_color=None, hat=None, crown=False, rot_z=0.0, prop=None):
    root = empty("agent", loc, (0, 0, rot_z), size)
    w, d, h = 1.0, 0.8, 0.66
    body = mat(color, 0.45)
    dark = mat(color, 0.6)
    for x in (-0.36, -0.2, 0.2, 0.36):
        cube((x, 0, 0.1), (0.1, 0.12, 0.2), dark, root)
    cube((0, 0, 0.2 + h / 2), (w, d, h), body, root, bevel=0.06)
    for sx in (-1, 1):
        cone((sx * 0.58, 0, 0.58), 0.09, 0.0, 0.26, body, root, rot=(0, sx * math.radians(-55), 0))
    face(root, w, d, 0.2 + h * 0.62, mood)
    if label:
        text(label, (0, -d / 2 - 0.02, 0.29), 0.11, mat("#ffffff", 0.4, emit=0.3), root, extrude=0.005)
    if hat:
        cone((0.22, 0, 0.2 + h + 0.2), 0.14, 0.0, 0.42, mat(hat, 0.5), root)
        sphere((0.22, 0, 0.2 + h + 0.43), 0.05, mat(C["gold"], 0.4), root)
    if crown:
        cyl((0, 0, 0.2 + h + 0.1), 0.2, 0.16, mat(C["gold"], 0.25, metal=0.4), root, verts=5)
    if carry:
        card((0, -0.05, 0.2 + h + 0.42), (0.9, 0.05, 0.5), carry, carry_color or "#4f8ef7", root, rot=(0, 0, 0))
    if prop == "mag":
        tube([(0.55, -0.1, 0.62), (0.75, -0.2, 0.95)], 0.03, mat(INK), root)
        torus((0.85, -0.25, 1.1), 0.17, 0.03, mat(INK), root, rot=(math.pi / 2, 0, 0))
        cyl((0.85, -0.25, 1.1), 0.16, 0.01, mat("#d9f1f4", 0.05), root, rot=(math.pi / 2, 0, 0))
    elif prop == "watch":
        cyl((0.8, -0.2, 0.95), 0.16, 0.06, mat("#ffffff", 0.4), root, rot=(math.pi / 2, 0, 0))
        tube([(0.8, -0.25, 0.95), (0.86, -0.25, 1.04)], 0.012, mat(C["red"]), root)
    elif prop == "baton":
        tube([(0.55, -0.1, 0.62), (0.9, -0.2, 1.15)], 0.02, mat(INK), root)
        sphere((0.92, -0.2, 1.18), 0.06, mat(C["gold"], 0.3, emit=0.5), root)
    elif prop == "scissors":
        for s in (-1, 1):
            tube([(0.7, -0.2, 0.7), (0.78 + s * 0.08, -0.2, 1.05)], 0.025, mat("#9aa0ad", 0.2, metal=0.8), root)
            torus((0.7 + s * 0.06, -0.2, 0.62), 0.05, 0.015, mat(INK), root, rot=(math.pi / 2, 0, 0))
    return root


def card(loc, size, label, stripe, parent=None, rot=(0, 0, 0), kind="orig", badge=None):
    root = empty("card", loc, rot)
    if parent is not None:
        root.parent = parent
    w, d, h = size
    base = mat("#f1efe9" if kind == "gap" else C["white"], 0.5)
    cube((0, 0, 0), (w, d, h), base, root, bevel=0.015)
    cube((-w / 2 + 0.05, -d / 2 - 0.004, 0), (0.07, 0.01, h * 0.92), mat(stripe, 0.4), root)
    if label:
        text(label, (0.03, -d / 2 - 0.012, -0.01), min(h * 0.38, 0.2), mat(INK, 0.5), root, extrude=0.004)
    if badge:
        cyl((w / 2 - 0.08, -d / 2 - 0.02, h / 2), 0.13, 0.03, mat(C["red"] if kind == "risk" else C["green"], 0.4), root, rot=(math.pi / 2, 0, 0))
        text(badge, (w / 2 - 0.08, -d / 2 - 0.04, h / 2), 0.11, mat("#ffffff", 0.4, emit=0.4), root, extrude=0.004)
    return root


def kanban(loc, width=7.0, height=3.4, cards=None, scale=1.0, hl=None):
    root = empty("kanban", loc, (0, 0, 0), scale)
    cube((0, 0.1, 0), (width, 0.14, height), mat("#fffaf0", 0.6), root, bevel=0.05)
    cw = (width - 0.5) / 4
    for i, (t, c) in enumerate(COLS):
        x = -width / 2 + 0.25 + cw * i + cw / 2
        glow = 0.0 if hl is None or hl != i else 0.25
        light = {"#4f8ef7": "#cfe0ff", "#f7a928": "#ffe5b3", "#e5533f": "#ffd0c8", "#2fbf8a": "#c9f1df"}[c]
        cube((x, 0.0, -0.15), (cw - 0.12, 0.05, height - 0.55), mat(light, 0.7, emit=glow), root)
        cube((x, -0.03, height / 2 - 0.3), (cw - 0.12, 0.07, 0.38), mat(c, 0.45), root, bevel=0.03)
        text(t, (x, -0.08, height / 2 - 0.3), 0.2, mat("#ffffff", 0.4, emit=0.3), root, extrude=0.006)
        for j, cd in enumerate((cards or {}).get(i, [])):
            label, kind, badge = (cd + (None, None))[:3] if isinstance(cd, tuple) else (cd, "orig", None)
            stripe = {"orig": c, "gap": C["gray"], "risk": C["red"], "ok": C["green"]}[kind or "orig"]
            card((x, -0.06, height / 2 - 0.85 - j * 0.5), (cw - 0.35, 0.04, 0.38), label, stripe, root, kind=kind or "orig", badge=badge)
    return root


def meter(loc, value, scale=1.0):
    root = empty("meter", loc, (0, 0, 0), scale)
    H = 2.4
    hot = value >= 70
    fc = mat(C["red"] if hot else C["green"], 0.35, emit=0.15)
    cube((0, 0.05, H + 0.75), (1.3, 0.1, 0.42), mat("#fff0c8", 0.6), root, bevel=0.03)
    text("RISK", (0, -0.02, H + 0.75), 0.28, mat(INK, 0.5), root, extrude=0.01)
    cyl((0, 0, H / 2 + 0.35), 0.2, H, mat("#ffffff", 0.3), root)
    lvl = (H - 0.2) * value / 100
    cyl((0, -0.02, 0.45 + lvl / 2), 0.13, lvl, fc, root)
    z70 = 0.45 + (H - 0.2) * 0.7
    cube((0, -0.05, z70), (0.7, 0.04, 0.035), mat(C["red"], 0.4, emit=0.4), root)
    text("70", (0.55, -0.06, z70), 0.18, mat(C["red"], 0.4), root, extrude=0.008)
    for i in range(11):
        z = 0.45 + (H - 0.2) * i / 10
        cube((0.16, -0.18, z), (0.08, 0.02, 0.02), mat(INK), root)
    sphere((0, 0, 0.3), 0.42, fc, root)
    text(str(value), (0, -0.44, 0.28), 0.34, mat("#ffffff", 0.3, emit=0.5), root, extrude=0.02)
    return root


def pump(loc, to=None, pushed=True):
    root = empty("pump", loc)
    cube((0, 0, 0.06), (1.4, 0.5, 0.12), mat("#4a5078", 0.5), root, bevel=0.03)
    cyl((0, 0, 0.85), 0.24, 1.4, mat(C["teal"], 0.35), root)
    hz = 1.8 if pushed else 2.3
    cyl((0, 0, (1.55 + hz) / 2), 0.04, hz - 1.55, mat("#9aa0ad", 0.2, metal=0.8), root)
    cyl((0, 0, hz), 0.07, 0.95, mat("#4a5078", 0.5), root, rot=(0, math.pi / 2, 0))
    if to:
        p0 = Vector(loc) + Vector((0.3, 0, 0.2))
        p1 = Vector(to)
        pts = [tuple(p0.lerp(p1, t) + Vector((0, -0.6 * math.sin(math.pi * t), -0.2 * math.sin(math.pi * t)))) for t in [i / 16 for i in range(17)]]
        tube(pts, 0.07, mat("#2c2e47", 0.5))
    return root


def gate(loc, open_=False, length=3.0):
    root = empty("gate", loc)
    cyl((0, 0, 0.75), 0.16, 1.5, mat("#6d5aa8", 0.5), root)
    cube((0, 0, 0.08), (0.6, 0.6, 0.16), mat("#4a5078", 0.5), root)
    ang = math.radians(72) if open_ else 0
    bar = cyl((length / 2 * math.cos(ang), 0, 1.3 + length / 2 * math.sin(ang)), 0.1, length, stripes_material("#ffffff", C["red"], 1.1, "gatebar", "Z"), root, rot=(0, math.pi / 2 - ang, 0))
    sphere((0, 0, 1.3), 0.17, mat(C["gold"], 0.3), root)
    return root


def machine(loc, label="10XAI", scale=1.0):
    root = empty("machine", loc, (0, 0, 0), scale)
    cube((0, 0, 1.15), (2.4, 1.6, 2.1), mat("#9fd0ea", 0.45), root, bevel=0.1)
    cone((0, 0, 2.6), 0.4, 1.2, 0.9, mat("#dfe5ee", 0.4), root)
    cube((0, -0.82, 1.65), (1.5, 0.06, 0.5), mat("#fffdf5", 0.5), root, bevel=0.03)
    text(label, (0, -0.87, 1.65), 0.38, mat(INK, 0.5), root, extrude=0.02)
    for i, x in enumerate((-0.6, 0, 0.6)):
        cyl((x, -0.82, 0.85), 0.2, 0.06, mat("#ffffff", 0.4), root, rot=(math.pi / 2, 0, 0))
        tube([(x, -0.87, 0.85), (x + [0.1, -0.06, 0.12][i], -0.87, 0.85 + [0.1, 0.13, -0.04][i])], 0.02, mat(C["red"]), root)
    sphere((0.95, -0.4, 2.25), 0.1, mat(C["red"], 0.3, emit=2.0), root)
    cube((1.55, -0.2, 0.55), (1.0, 0.8, 0.1), mat("#8fc1dd", 0.45), root, rot=(0, math.radians(25), 0))
    return root


def wheel(loc, radius=1.4, spin=0.0):
    root = empty("wheel", loc, (0, 0, 0))
    m = mat("#ff8fb8", 0.35)
    for y in (-0.45, 0.45):
        torus((0, y, 0), radius, 0.06, m, root, rot=(math.pi / 2, 0, 0))
    for i in range(24):
        a = spin + i * 2 * math.pi / 24
        cyl((radius * math.cos(a), 0, radius * math.sin(a)), 0.03, 0.9, mat("#ffd23f", 0.35), root, rot=(math.pi / 2, 0, 0), verts=12)
    for i in range(6):
        a = spin + i * math.pi / 3
        cyl((radius / 2 * math.cos(a), 0.45, radius / 2 * math.sin(a)), 0.025, radius, m, root, rot=(0, math.pi / 2 - a, 0), verts=12)
    cyl((0, 0.55, 0), 0.12, 0.25, mat("#4a5078"), root, rot=(math.pi / 2, 0, 0))
    cube((0, 0.7, -radius / 2 - 0.1), (0.2, 0.2, radius + 0.4), mat("#4a5078", 0.5), root)
    cube((0, 0.7, -radius - 0.3), (1.6, 0.9, 0.12), mat("#4a5078", 0.5), root)
    return root


def confetti(n, box_min, box_max, seed=7):
    rnd = random.Random(seed)
    cols = ["#f062a8", "#ffd23f", "#2fbf8a", "#4f8ef7", "#f08a3e", "#a86af2", "#ffffff"]
    for i in range(n):
        loc = tuple(rnd.uniform(a, b) for a, b in zip(box_min, box_max))
        cube(loc, (0.14, 0.01, 0.07), mat(cols[i % len(cols)], 0.5, emit=0.2), rot=(rnd.uniform(0, 3), rnd.uniform(0, 3), rnd.uniform(0, 3)))


def seed_coin(loc, scale=1.0):
    root = empty("seed", loc, (0, 0, math.radians(-20)), scale)
    sphere((0, 0, 0), 0.3, stripes_material("#3a3a44", "#f4efe2", 14, "seedstripes", "Z"), root, scale=(0.6, 0.35, 1.0))
    return root


def title3d(body, loc, size, color="#ffd23f", rot=(math.pi / 2, 0, 0), extrude=0.12):
    return text(body, loc, size, mat(color, 0.35, emit=0.15), extrude=extrude, rot=rot)


# ---------------------------------------------------------------- shots
def shot_hero_kanban():
    """Mission control: the multi-agent Kanban board with the whole crew."""
    stage()
    kanban((0, 2.2, 3.0), width=9.0, height=4.0, cards={0: ["Clone repo", ("Add .env keys", "gap")], 1: ["Install SDK", "Run CLI"], 2: [("Run shell", "risk", "72")], 3: [("Export", "ok", "OK")]}, hl=2)
    agent((-4.7, -0.6, 0), C["decompose"], 1.3, "happy", "Decompose", prop="scissors", rot_z=0.25)
    agent((-2.8, -1.4, 0), C["gapfill"], 1.25, "happy", "Gap-fill", carry="Add .env", carry_color=C["gray"], rot_z=0.15)
    agent((-0.9, -0.7, 0), C["verify"], 1.35, "alert", "Verify", prop="mag")
    agent((1.1, -1.5, 0), C["runner"], 1.3, "happy", "Runner", carry="Export", carry_color=C["green"], prop="watch", rot_z=-0.1)
    agent((3.0, -0.5, 0), C["orchestrator"], 1.5, "happy", "Orchestrator", crown=True, prop="baton", rot_z=-0.2)
    hamster((5.2, -1.4, 0), 1.45, math.radians(-25), "guns", "grin")
    confetti(60, (-6, -2, 5.2), (6, 1.5, 6.8), seed=3)
    lights()
    camera((0.4, -11.2, 3.0), (0.3, 0, 2.3), lens=28, dof=True)


def shot_hero_hamster():
    """Thumbnail-style close-up: Dr. Harness, sunglasses, RISK meter behind."""
    stage()
    kanban((-2.2, 2.4, 3.4), cards={0: ["Clone repo"], 2: [("Run shell", "risk", "72")]}, hl=2, scale=0.85)
    meter((2.6, 1.2, 0), 72, 1.0)
    hamster((0.2, -1.6, 0), 1.9, math.radians(-8), "wave", "grin")
    title3d("IT SAID FREE.", (-2.9, -0.4, 5.3), 0.72, rot=(math.radians(90), 0, math.radians(-4)))
    confetti(40, (-5, -3, 3.8), (5, 0, 6.5), seed=11)
    lights()
    camera((0.3, -10.5, 2.9), (0.2, 0, 2.6), lens=32, dof=(9.2, 3.5))


def shot_hero_gate():
    """The human gate: risky card-box stopped at the barrier, RISK 72, hamster stamping."""
    stage()
    kanban((0, 3.0, 4.2), cards={2: [("Run shell", "risk", "72"), ("rm -rf", "risk", "91")]}, hl=2, scale=0.8)
    gate((-0.8, -0.6, 0), open_=False, length=3.0)
    agent((3.2, -0.9, 0), C["verify"], 1.35, "worried", "risk 72", rot_z=-0.25)
    meter((5.6, 0.8, 0), 72)
    pump((4.4, 0.3, 0), to=(5.3, 0.6, 0.35))
    hamster((-3.4, -1.1, 0), 1.35, math.radians(20), "stamp", "o")
    cube((-2.45, -1.75, 2.75), (0.5, 0.35, 0.18), mat(C["red"], 0.4), rot=(0, 0, math.radians(20)))
    cyl((-2.45, -1.75, 2.98), 0.07, 0.3, mat("#8a5a2b", 0.5))
    title3d("GATE  ·  risk ≥ 70", (-0.2, -0.4, 5.5), 0.5, color="#ffffff")
    lights()
    camera((0.8, -13, 3.0), (0.6, 0, 2.2), lens=32, dof=True)


def shot_hero_wheel():
    """The harness metaphor: a hamster wheel powering the 10XAI machine."""
    stage()
    wheel((-2.4, 0.2, 1.75), 1.45, spin=0.3)
    hamster((-2.4, -0.1, 0.33), 0.95, 0, "run", "grin")
    machine((2.2, 0.4, 0), scale=1.15)
    tube([(-0.95, 0.3, 1.75), (0.2, 0.2, 2.2), (0.8, 0.2, 2.0)], 0.06, mat("#2c2e47", 0.5))
    for i, (x, z, r) in enumerate([(4.4, 1.3, -0.6), (5.2, 0.9, 0.4), (5.8, 0.35, -0.2)]):
        card((x, -0.6, z), (0.9, 0.05, 0.5), ["Decompose", "Verify", "Export"][i], [C["decompose"], C["verify"], C["runner"]][i], rot=(0, r, 0))
    title3d("AGENT = MODEL + HARNESS", (0, -0.5, 5.6), 0.5, color="#ffd23f")
    seed_coin((4.6, -1.8, 0.35), 1.0)
    seed_coin((5.2, -2.1, 0.3), 0.8)
    lights()
    camera((-0.6, -12.5, 3.4), (0.2, 0, 2.2), lens=30, dof=True)


def shot_reel_cover():
    """9:16 cover: hamster + RISK meter + hook text."""
    stage(width=8.0, valance_z=10.4)
    meter((1.5, 0.8, 0), 72, 1.1)
    hamster((-0.8, -1.2, 0), 1.6, math.radians(10), "cheer", "grin")
    title3d("IT SAID", (0, -0.2, 7.6), 0.95)
    title3d("\"FREE\"", (0, -0.2, 6.5), 1.15)
    confetti(50, (-3, -2.5, 4.0), (3, 0.5, 8.5), seed=5)
    lights()
    camera((0, -12.5, 4.0), (0, 0, 3.6), lens=30, dof=(11.5, 4))


def shot_card_cover():
    """4:5 card-news cover: hamster with sunglasses pushed up, board behind."""
    stage(width=9.0, valance_z=9.6)
    kanban((0, 2.4, 3.6), cards={0: ["Clone repo"], 1: ["Install SDK"], 2: [("Run shell", "risk", "72")], 3: [("Export", "ok", "OK")]}, scale=0.75, hl=2)
    hamster((0, -1.3, 0), 1.7, 0, "wave", "o", glasses="up")
    agent((-2.6, -0.9, 0), C["verify"], 0.9, "worried", "risk 72", rot_z=0.3)
    agent((2.6, -0.9, 0), C["hype"], 0.9, "star", "FREE!", rot_z=-0.3)
    lights()
    camera((0, -11.5, 3.2), (0, 0, 2.8), lens=32, dof=(10.5, 4))


SHOTS = {
    "hero_kanban": (shot_hero_kanban, 1920, 1080),
    "hero_hamster": (shot_hero_hamster, 1920, 1080),
    "hero_gate": (shot_hero_gate, 1920, 1080),
    "hero_wheel": (shot_hero_wheel, 1920, 1080),
    "reel_cover": (shot_reel_cover, 1080, 1920),
    "card_cover": (shot_card_cover, 1080, 1350),
}


# ---------------------------------------------------------------- animation
def kf(ob, frame, loc=None, rot=None, scale=None):
    if loc is not None:
        ob.location = loc
        ob.keyframe_insert("location", frame=frame)
    if rot is not None:
        ob.rotation_euler = rot
        ob.keyframe_insert("rotation_euler", frame=frame)
    if scale is not None:
        ob.scale = (scale, scale, scale)
        ob.keyframe_insert("scale", frame=frame)


def col_x(i, width=9.0):
    cw = (width - 0.5) / 4
    return -width / 2 + 0.25 + cw * i + cw / 2


def fly(ob, f0, f1, a, b, lift=1.4, toward=-1.6, spin=0.0):
    """Arc a card from a to b between frames f0..f1 (a mid key pulled up and toward camera)."""
    a, b = Vector(a), Vector(b)
    mid = (a + b) / 2 + Vector((0, toward, lift))
    kf(ob, f0, loc=tuple(a), rot=(0, 0, 0))
    kf(ob, (f0 + f1) // 2, loc=tuple(mid), rot=(0, spin, 0))
    kf(ob, f1, loc=tuple(b), rot=(0, 0, 0))


def anim_mission_control():
    """4 s: dolly in on the board; cards fly across columns; a risky card bounces off the gate column."""
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end, sc.render.fps = 1, 96, 24
    stage()
    kanban((0, 2.2, 3.0), width=9.0, height=4.0, cards={0: ["Clone repo"], 3: [("Export", "ok", "OK")]}, hl=2)
    top = 3.0 + 2.0 - 0.85
    y = 2.1
    c1 = card((col_x(0), y, top - 0.5), (1.78, 0.04, 0.38), "Install SDK", C["decompose"])
    fly(c1, 8, 30, (col_x(0), y, top - 0.5), (col_x(1), y, top), spin=6.28)
    fly(c1, 50, 72, (col_x(1), y, top), (col_x(3), y, top - 0.5), lift=1.8, spin=-6.28)
    c2 = card((col_x(0), y, top - 1.0), (1.78, 0.04, 0.38), "Run shell", C["red"], kind="risk", badge="72")
    fly(c2, 24, 46, (col_x(0), y, top - 1.0), (col_x(2), y, top), lift=2.0, spin=6.28)
    for f, dx in ((52, 0.12), (55, -0.12), (58, 0.08), (61, -0.05), (64, 0)):
        kf(c2, f, loc=(col_x(2) + dx, y, top), rot=(0, dx * 2, 0))
    c3 = card((col_x(0), y, top - 1.5), (1.78, 0.04, 0.38), "Add .env keys", C["gray"], kind="gap")
    fly(c3, 60, 84, (col_x(0), y, top - 1.5), (col_x(1), y, top - 0.5), spin=6.28)
    crew = [
        agent((-4.7, -0.6, 0), C["decompose"], 1.3, "happy", "Decompose", prop="scissors", rot_z=0.25),
        agent((-2.8, -1.4, 0), C["gapfill"], 1.25, "happy", "Gap-fill", rot_z=0.15),
        agent((-0.9, -0.7, 0), C["verify"], 1.35, "alert", "Verify", prop="mag"),
        agent((1.1, -1.5, 0), C["runner"], 1.3, "happy", "Runner", prop="watch", rot_z=-0.1),
        agent((3.0, -0.5, 0), C["orchestrator"], 1.5, "happy", "Orchestrator", crown=True, prop="baton", rot_z=-0.2),
    ]
    for k, a in enumerate(crew):
        base = tuple(a.location)
        for f in range(1, 97, 6):
            hop = 0.28 if (f // 6 + k) % 3 == 0 else 0.0
            kf(a, f, loc=(base[0], base[1], hop))
    ham = hamster((5.2, -1.4, 0), 1.45, math.radians(-25), "point", "grin")
    for f in range(1, 97, 8):
        kf(ham, f, rot=(0, math.radians(3 if (f // 8) % 2 else -3), math.radians(-25)))
    confetti(40, (-6, -2, 5.2), (6, 1.5, 6.8), seed=3)
    lights()
    cam = camera((0.0, -15.0, 3.8), (0.2, 0, 2.6), lens=30)
    kf(cam, 1, loc=(-0.8, -15.0, 3.8))
    kf(cam, 96, loc=(0.6, -11.0, 3.0))
    for fc in (cam.animation_data.action.fcurves if cam.animation_data else []):
        for kp in fc.keyframe_points:
            kp.interpolation = "SINE"
            kp.easing = "EASE_IN_OUT"


ANIMS = {"mission_control": (anim_mission_control, 1280, 720)}


def render_anim(name, samples, scale):
    fn, w, h = ANIMS[name]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    world_and_render(w, h, samples, scale)
    fn()
    sc = bpy.context.scene
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    os.makedirs(OUT, exist_ok=True)
    sc.render.filepath = os.path.join(OUT, f"{name}.mp4")
    bpy.ops.render.render(animation=True)
    print("rendered", name)


def render(name, samples, scale):
    fn, w, h = SHOTS[name]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    world_and_render(w, h, samples, scale)
    fn()
    os.makedirs(OUT, exist_ok=True)
    bpy.context.scene.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", name)


def main(argv):
    samples, scale, names = 48, 100, []
    it = iter(argv)
    for a in it:
        if a == "--samples":
            samples = int(next(it))
        elif a == "--scale":
            scale = int(next(it))
        else:
            names.append(a)
    for n in names or list(SHOTS):
        if n in ANIMS:
            render_anim(n, samples, scale)
        else:
            render(n, samples, scale)


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    main(args)
