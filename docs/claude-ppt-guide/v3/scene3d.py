"""Blender (4.0, Eevee) scene builder + frame renderer for the 30 s "Hammy" Q3 briefing.

Usage (headless):
  blender -b -P scene3d.py -- <shot> <start_frame> <end_frame> <out_dir> [--test]
Shots:
  hero   full-frame 3D intro: Hammy on a glossy stage, camera push-in           (1920x1080)
  chart  full-frame 3D glass-bar chart of 7 quarters, Hammy points at the bars  (1920x1080)
  road   full-frame 3D milestone road, camera flies along it                    (1920x1080)
  sprite Hammy alone on transparent film, used over the 2D dashboard scenes     (720x720)
Frames are global timeline frames (30 fps). Lip sync reads timeline.json (mouth envelope).
Label anchors for the HTML overlay are projected to screen space and written to <out_dir>/anchors.json.
"""
import bpy, sys, json, math, os
from mathutils import Vector, Euler
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:]
SHOT, F0, F1, OUT = argv[0], int(argv[1]), int(argv[2]), argv[3]
TEST = "--test" in argv
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(os.environ.get("TIMELINE_DIR", HERE), "timeline.json")))
MOUTH = TL["mouth"]
FPS = 30

# ---------------------------------------------------------------- scene setup
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
ee = sc.eevee
ee.taa_render_samples = int(os.environ.get("SAMPLES", "12"))
ee.use_bloom = True; ee.bloom_intensity = 0.06; ee.bloom_threshold = 0.9; ee.bloom_radius = 5.5
ee.use_ssr = True; ee.use_ssr_halfres = False; ee.ssr_thickness = 0.4
ee.use_gtao = True; ee.gtao_distance = 0.6
ee.use_soft_shadows = False; ee.shadow_cube_size = "512"; ee.shadow_cascade_size = "1024"
sc.render.fps = FPS
try:
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Punchy"
except Exception:
    sc.view_settings.view_transform = "Filmic"
sc.render.image_settings.file_format = "PNG"
if SHOT in ("sprite", "uchu"):
    sc.render.resolution_x = sc.render.resolution_y = 720 if SHOT == "sprite" else 600
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = "RGBA"
else:
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    sc.render.resolution_percentage = int(os.environ.get("RES_PCT", "67"))  # 1280x720 plates, upscaled in the compositor
    sc.render.image_settings.color_mode = "RGB"
if TEST:
    sc.render.resolution_percentage = 50

world = bpy.data.worlds.new("W"); sc.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.006, 0.007, 0.012, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

def hexc(h, a=1.0):
    h = h.lstrip("#"); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (a,)

def mat(name, color, rough=0.5, metal=0.0, sheen=0.0, emit=None, estr=0.0, coat=0.0, sss=0.0, bump=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = hexc(color)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if sheen: p.inputs["Sheen Weight"].default_value = sheen; p.inputs["Sheen Roughness"].default_value = 0.35
    if coat: p.inputs["Coat Weight"].default_value = coat; p.inputs["Coat Roughness"].default_value = 0.03
    if sss: p.inputs["Subsurface Weight"].default_value = sss; p.inputs["Subsurface Radius"].default_value = (0.35, 0.2, 0.12)
    if emit: p.inputs["Emission Color"].default_value = hexc(emit); p.inputs["Emission Strength"].default_value = estr
    if bump:
        tex = nt.nodes.new("ShaderNodeTexNoise"); tex.inputs["Scale"].default_value = 90; tex.inputs["Detail"].default_value = 6
        bn = nt.nodes.new("ShaderNodeBump"); bn.inputs["Strength"].default_value = bump; bn.inputs["Distance"].default_value = 0.02
        nt.links.new(tex.outputs["Fac"], bn.inputs["Height"]); nt.links.new(bn.outputs["Normal"], p.inputs["Normal"])
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha; m.blend_method = "BLEND"; m.shadow_method = "HASHED"
    return m

def sphere(name, loc, scale, material, parent=None, r=1.0, seg=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.shade_smooth()
    o.data.materials.append(material)
    if parent: set_parent(o, parent)
    return o

def empty(name, loc, parent=None):
    o = bpy.data.objects.new(name, None); sc.collection.objects.link(o); o.location = loc
    if parent: set_parent(o, parent)
    return o

def set_parent(o, p):
    bpy.context.view_layer.update()
    mw = o.matrix_world.copy(); o.parent = p; o.matrix_world = mw

# ---------------------------------------------------------------- Hammy (hip hamster analyst)
FUR = mat("fur", "#D98A34", rough=0.62, sheen=1.0, sss=0.08, bump=0.25)
CREAM = mat("cream", "#F6E4C8", rough=0.65, sheen=0.8, sss=0.1, bump=0.2)
PINK = mat("pink", "#F0A39C", rough=0.45, sss=0.2)
EYE = mat("eye", "#0B0B10", rough=0.06, coat=1.0)
SPEC = mat("spec", "#FFFFFF", emit="#FFFFFF", estr=6.0)
MOUTHM = mat("mouth", "#3B1216", rough=0.6)
CAP = mat("cap", "#6D5BFF", rough=0.45, sheen=0.3)
LIME = mat("lime", "#C6F432", rough=0.35, emit="#C6F432", estr=0.6)
GOLD = mat("gold", "#F2C14E", rough=0.18, metal=1.0)
WHITE = mat("white", "#F4F5F7", rough=0.3, coat=0.5)

def build_hammy(origin=(0, 0, 0), s=1.0):
    root = empty("Hammy", origin)
    root.scale = (s, s, s)
    body = sphere("body", (0, 0, 1.0), (1.0, 0.92, 1.0), FUR, root)
    sphere("belly", (0, -0.52, 0.95), (0.62, 0.42, 0.72), CREAM, root)
    for sx in (-1, 1):
        sphere(f"foot{sx}", (0.42 * sx, -0.55, 0.08), (0.2, 0.28, 0.1), PINK, root)
    sphere("tail", (0, 0.92, 0.55), (0.12, 0.12, 0.12), FUR, root)
    # chain + headphones sit on the "neck"
    bpy.ops.mesh.primitive_torus_add(major_radius=0.74, minor_radius=0.05, location=(0, -0.36, 1.32), rotation=(math.radians(22), 0, 0))
    ch = bpy.context.object; ch.data.materials.append(GOLD); bpy.ops.object.shade_smooth(); set_parent(ch, root)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.05, location=(0, -1.04, 1.02), rotation=(math.radians(96), 0, 0))
    pd = bpy.context.object; pd.data.materials.append(GOLD); set_parent(pd, root)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.84, minor_radius=0.08, location=(0, -0.22, 1.5), rotation=(math.radians(14), 0, 0))
    hp = bpy.context.object; hp.data.materials.append(WHITE); bpy.ops.object.shade_smooth(); set_parent(hp, root)
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.18, location=(0.84 * sx, -0.5, 1.42), rotation=(0, math.radians(90), math.radians(-28 * sx)))
        cup = bpy.context.object; cup.data.materials.append(WHITE); bpy.ops.object.shade_smooth(); set_parent(cup, root)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.035, location=(0.93 * sx, -0.54, 1.42), rotation=(0, math.radians(90), math.radians(-28 * sx)))
        ring = bpy.context.object; ring.data.materials.append(LIME); set_parent(ring, root)
    # head rig
    head = empty("head", (0, -0.2, 1.7), root)
    sphere("skull", (0, -0.22, 1.98), (1.02, 0.94, 0.9), FUR, head, r=0.78)
    sphere("muzzle", (0, -0.86, 1.8), (0.46, 0.3, 0.33), CREAM, head)
    for sx in (-1, 1):
        sphere(f"cheek{sx}", (0.4 * sx, -0.78, 1.74), (0.3, 0.26, 0.26), CREAM, head)
        eye = sphere(f"eye{sx}", (0.32 * sx, -0.86, 2.1), (0.13, 0.1, 0.15), EYE, head)
        sphere(f"spec{sx}", (0.32 * sx - 0.04, -0.965, 2.15), (0.028, 0.02, 0.028), SPEC, eye)
        ear = sphere(f"ear{sx}", (0.56 * sx, -0.12, 2.6), (0.24, 0.1, 0.24), FUR, head)
        sphere(f"earIn{sx}", (0.56 * sx, -0.2, 2.6), (0.15, 0.05, 0.16), PINK, ear)
        sphere(f"brow{sx}", (0.32 * sx, -0.9, 2.3), (0.1, 0.03, 0.025), mat(f"brow{sx}", "#7A4A1C", rough=0.7), head)
    sphere("nose", (0, -1.14, 1.9), (0.075, 0.06, 0.055), PINK, head)
    mouth = sphere("mouthO", (0, -1.12, 1.64), (0.085, 0.04, 0.05), MOUTHM, head)
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.022 * sx, -1.15, 1.672))
        tooth = bpy.context.object; tooth.scale = (0.036, 0.012, 0.05); tooth.data.materials.append(WHITE); set_parent(tooth, mouth)
    # backwards snapback
    sphere("capCrown", (0, -0.18, 2.43), (0.66, 0.66, 0.4), CAP, head)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=0.05, location=(0, 0.5, 2.36), rotation=(math.radians(-14), 0, 0))
    brim = bpy.context.object; brim.scale = (1.0, 1.25, 1.0); brim.data.materials.append(CAP); bpy.ops.object.shade_smooth(); set_parent(brim, head)
    sphere("capBtn", (0, -0.18, 2.82), (0.07, 0.07, 0.05), LIME, head)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.64, minor_radius=0.035, location=(0, -0.2, 2.3))
    band = bpy.context.object; band.scale = (1.0, 1.0, 0.6); band.data.materials.append(LIME); set_parent(band, head)
    # arms on shoulder pivots
    arms = {}
    for sx in (-1, 1):
        pv = empty(f"shoulder{sx}", (0.66 * sx, -0.42, 1.38), root)
        sphere(f"arm{sx}", (0.66 * sx, -0.42, 1.1), (0.15, 0.15, 0.32), FUR, pv)
        sphere(f"paw{sx}", (0.66 * sx, -0.42, 0.78), (0.13, 0.12, 0.13), PINK, pv)
        arms[sx] = pv
    bpy.context.view_layer.update()
    return dict(root=root, head=head, body=body, mouth=mouth, arms=arms, mouth_z=mouth.location.z,
                brow_z=[bpy.data.objects["brow-1"].location.z, bpy.data.objects["brow1"].location.z],
                eyes=[bpy.data.objects["eye-1"], bpy.data.objects["eye1"]],
                brows=[bpy.data.objects["brow-1"], bpy.data.objects["brow1"]])

# gesture timeline (global seconds). arm -1 = screen-left, +1 = screen-right.
# kinds: wave, point (angle deg: + raises arm outward), open (both arms), rest
GEST = [
    (0.35, 2.4, "wave", 1),
    (5.2, 8.6, "point", 1),        # chart: points right toward the bars
    (10.4, 12.6, "point", -1),     # dashboard: points left at the panels
    (13.8, 16.0, "point", -1),
    (19.0, 22.0, "point", -1),
    (25.5, 27.2, "open", 0),
    (27.6, 29.6, "point", -1),
]

def lerp(a, b, t): return a + (b - a) * t
def smooth(x): x = max(0, min(1, x)); return x * x * (3 - 2 * x)

def pose_hammy(H, f):
    t = f / FPS
    m = MOUTH[min(f, len(MOUTH) - 1)]
    H["mouth"].scale = (0.085 + 0.02 * m, 0.04, 0.03 + 0.1 * m)
    H["mouth"].location.z = H["mouth_z"] - 0.035 * m
    # blink every ~3.2 s
    bl = 1.0 if (t % 3.2) > 0.12 else 0.12
    for e in H["eyes"]: e.scale.z = 0.15 * bl
    # head: idle bob + speech emphasis + tiny look-around
    H["head"].rotation_euler = Euler((math.radians(3 * math.sin(t * 2.1) - 5 * m), math.radians(2.5 * math.sin(t * 1.3)), math.radians(6 * math.sin(t * 0.7))))
    for b, z in zip(H["brows"], H["brow_z"]): b.location.z = z + 0.04 * m
    H["body"].scale = (1.0, 0.92, 1.0 + 0.012 * math.sin(t * 2.6))
    # arms
    rot = {-1: [-15, 12], 1: [-15, -12]}  # [x (forward), y (outward)] rest
    for (a, b, kind, side) in GEST:
        if a - 0.35 <= t <= b + 0.35:
            w = min(smooth((t - (a - 0.35)) / 0.35), smooth(((b + 0.35) - t) / 0.35))
            if kind == "wave":
                tgt = {side: [-25, -side * (135 + 16 * math.sin(t * 13))]}
            elif kind == "point":
                tgt = {side: [-35, -side * 95]}
            elif kind == "open":
                tgt = {-1: [-40, 60], 1: [-40, -60]}
            for sd, (rx, ry) in tgt.items():
                rot[sd] = [lerp(rot[sd][0], rx, w), lerp(rot[sd][1], ry, w)]
    for sd, pv in H["arms"].items():
        pv.rotation_euler = Euler((math.radians(rot[sd][0]), math.radians(rot[sd][1]), 0))

# ---------------------------------------------------------------- Uchu (red space-suit CFO, green face paint)
SUIT = mat("suit", "#E0242B", rough=0.32, coat=0.4)
SUITD = mat("suitD", "#B5161D", rough=0.4, coat=0.3)
FACE = mat("face", "#4E9B34", rough=0.55, sss=0.15, bump=0.12)
STRIPE = mat("stripe", "#BFE3A6", rough=0.6)
SCLERA = mat("sclera", "#F7F4EE", rough=0.2, coat=0.6)
IRIS = mat("iris", "#6B3F22", rough=0.2)
LIP = mat("lip", "#D86B6B", rough=0.45, sss=0.2)
MAW = mat("maw", "#5A0C16", rough=0.7)
TONGUE = mat("tongue", "#E3867F", rough=0.5, sss=0.3)
BROWG = mat("browg", "#2C5A1E", rough=0.7)

def curve_tube(name, pts, radius, material, parent):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = radius; cu.bevel_resolution = 6
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(pts) - 1)
    for bp, co in zip(sp.bezier_points, pts): bp.co = co; bp.handle_left_type = bp.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, cu); sc.collection.objects.link(o); o.data.materials.append(material); set_parent(o, parent)
    return o

def build_uchu(origin=(0, 0, 0), s=1.0):
    root = empty("Uchu", origin); root.scale = (s, s, s)
    sphere("usuit", (0, 0, 1.0), (0.95, 0.85, 1.05), SUIT, root)
    for sx in (-1, 1): sphere(f"uboot{sx}", (0.4 * sx, -0.3, 0.1), (0.3, 0.38, 0.14), SUITD, root)
    head = empty("uhead", (0, -0.1, 2.0), root)
    sphere("uhood", (0, 0, 2.4), (1.02, 0.95, 1.08), SUIT, head)
    sphere("uface", (0, -0.62, 2.32), (0.72, 0.42, 0.9), FACE, head)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.78, minor_radius=0.085, location=(0, -0.84, 2.32), rotation=(math.radians(90), 0, 0))
    rim = bpy.context.object; rim.scale = (0.98, 1.22, 1); rim.data.materials.append(SUIT); bpy.ops.object.shade_smooth(); set_parent(rim, head)
    for sx in (-1, 1):
        sphere(f"upod{sx}", (1.0 * sx, -0.05, 2.35), (0.26, 0.42, 0.42), SUIT, head)
        sphere(f"ustripe{sx}", (0.28 * sx, -0.99, 2.18), (0.07, 0.02, 0.2), STRIPE, head)
        sphere(f"usclera{sx}", (0.25 * sx, -0.95, 2.52), (0.15, 0.08, 0.14), SCLERA, head)
        sphere(f"uiris{sx}", (0.25 * sx, -1.02, 2.52), (0.07, 0.03, 0.07), IRIS, head)
        sphere(f"upupil{sx}", (0.25 * sx, -1.045, 2.52), (0.035, 0.015, 0.035), EYE, head)
        sphere(f"uspec{sx}", (0.25 * sx - 0.03, -1.06, 2.56), (0.015, 0.01, 0.015), SPEC, head)
        sphere(f"ubrow{sx}", (0.26 * sx, -0.98, 2.74), (0.14, 0.03, 0.03), BROWG, head)
        ant = empty(f"uant{sx}", (0.32 * sx, -0.1, 3.3), head)
        curve_tube(f"uantc{sx}", [(0.32 * sx, -0.1, 3.3), (0.55 * sx, -0.1, 3.8), (0.95 * sx, -0.25, 4.1)], 0.06, SUIT, ant)
        sphere(f"uantb{sx}", (0.95 * sx, -0.25, 4.1), (0.14, 0.14, 0.14), SUIT, ant)
    sphere("unose", (0, -1.04, 2.3), (0.08, 0.06, 0.07), FACE, head)
    mouth = empty("umouth", (0, -1.0, 1.98), head)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.045, location=(0, -1.0, 1.98), rotation=(math.radians(90), 0, 0))
    lip = bpy.context.object; lip.scale = (0.95, 1.3, 1); lip.data.materials.append(LIP); bpy.ops.object.shade_smooth(); set_parent(lip, mouth)
    sphere("umaw", (0, -0.97, 1.98), (0.14, 0.05, 0.18), MAW, mouth)
    sphere("utongue", (0, -0.99, 1.88), (0.1, 0.04, 0.06), TONGUE, mouth)
    arms = {}
    for sx in (-1, 1):
        pv = empty(f"ushoulder{sx}", (0.72 * sx, -0.3, 1.45), root)
        sphere(f"uarm{sx}", (0.72 * sx, -0.3, 1.12), (0.17, 0.17, 0.34), SUIT, pv)
        sphere(f"uhand{sx}", (0.72 * sx, -0.3, 0.8), (0.15, 0.14, 0.15), SUITD, pv)
        arms[sx] = pv
    bpy.context.view_layer.update()
    return dict(root=root, head=head, mouth=mouth, arms=arms,
                ants=[bpy.data.objects["uant-1"], bpy.data.objects["uant1"]],
                brows=[bpy.data.objects["ubrow-1"], bpy.data.objects["ubrow1"]],
                brow_z=[bpy.data.objects["ubrow-1"].location.z, bpy.data.objects["ubrow1"].location.z],
                sclera=[bpy.data.objects["usclera-1"], bpy.data.objects["usclera1"]])

# Uchu appears in three reaction beats (global seconds); arms fly up on each beat
UCHU_BEATS = [(6.2, 9.5), (13.2, 16.4), (27.4, 30.0)]
def pose_uchu(U, f):
    t = f / FPS
    beat = next(((a, b) for a, b in UCHU_BEATS if a - 0.3 <= t <= b), None)
    k = smooth((t - beat[0]) / 0.35) if beat else 0.0
    # shocked "O" mouth pulses, head trembles, antennae wobble with a spring
    U["mouth"].scale = (1.0 + 0.1 * math.sin(t * 9), 1.0, 1.0 + 0.25 * k + 0.12 * math.sin(t * 7))
    U["head"].rotation_euler = Euler((math.radians(-6 * k + 1.5 * math.sin(t * 2)), 0, math.radians(3 * math.sin(t * 23) * k + 4 * math.sin(t * 0.9))))
    for i, a in enumerate(U["ants"]):
        a.rotation_euler = Euler((math.radians(10 * math.sin(t * 7 + i)), math.radians((12 + 10 * k) * math.sin(t * 5.5 + i * 1.7)), 0))
    for b, z in zip(U["brows"], U["brow_z"]): b.location.z = z + 0.08 * k
    bl = 1.0 if (t % 2.7) > 0.1 or k > 0.5 else 0.15
    for sc_ in U["sclera"]: sc_.scale.z = 0.14 * bl
    for sd, pv in U["arms"].items():  # hands up in surprise
        pv.rotation_euler = Euler((math.radians(-20 - 30 * k), math.radians(-sd * (15 + 120 * k)), 0))

# ---------------------------------------------------------------- lights
def area(name, loc, target, color, power, size, spec=0.15):
    ld = bpy.data.lights.new(name, "AREA"); ld.color = hexc(color)[:3]; ld.energy = power; ld.size = size; ld.specular_factor = spec
    o = bpy.data.objects.new(name, ld); sc.collection.objects.link(o); o.location = loc
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o

def rig_lights(center=(0, 0, 1.5)):
    area("key", (-4, -6, 6), center, "#FFF1E0", 900, 4, spec=0.5)
    area("fill", (5, -5, 3), center, "#BFD4FF", 250, 5)
    area("rimV", (-4.5, 4, 4), center, "#7C5CFF", 1400, 3)
    area("rimC", (4.5, 4, 3.5), center, "#22D3EE", 1100, 3)

def glossy_floor(size=80):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    fl = bpy.context.object
    fl.data.materials.append(mat("floor", "#0A0C13", rough=0.18, coat=0.6))
    return fl

def neon_grid(size=80, cuts=60, color="#1E2A6B", strength=1.2):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=cuts, y_subdivisions=cuts, size=size, location=(0, 0, 0.004))
    g = bpy.context.object
    w = g.modifiers.new("wire", "WIREFRAME"); w.thickness = 0.018; w.use_even_offset = False
    g.data.materials.append(mat("grid", color, emit=color, estr=strength))
    return g

def emission_mat(name, c1, c2, strength, axis="Z", lo=0.0, hi=1.0, alpha=1.0):
    """Vertical gradient emission (object space) for glowing glass bars / panels."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = lo; mr.inputs["From Max"].default_value = hi
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = hexc(c1); ramp.color_ramp.elements[1].color = hexc(c2)
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = strength
    gl = nt.nodes.new("ShaderNodeBsdfPrincipled"); gl.inputs["Base Color"].default_value = hexc("#0B1020"); gl.inputs["Roughness"].default_value = 0.05
    gl.inputs["Coat Weight"].default_value = 1.0
    mix = nt.nodes.new("ShaderNodeMixShader"); mix.inputs[0].default_value = 0.75
    nt.links.new(tc.outputs["Generated"], sep.inputs[0]); nt.links.new(sep.outputs[axis], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    nt.links.new(gl.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
    if alpha < 1:
        tr = nt.nodes.new("ShaderNodeBsdfTransparent"); mx2 = nt.nodes.new("ShaderNodeMixShader"); mx2.inputs[0].default_value = alpha
        nt.links.new(tr.outputs[0], mx2.inputs[1]); nt.links.new(mix.outputs[0], mx2.inputs[2]); nt.links.new(mx2.outputs[0], out.inputs[0])
        m.blend_method = "BLEND"; m.shadow_method = "NONE"
    else:
        nt.links.new(mix.outputs[0], out.inputs[0])
    return m

def camera(loc, target, lens=50):
    cd = bpy.data.cameras.new("cam"); cd.lens = lens; cd.dof.use_dof = False
    c = bpy.data.objects.new("cam", cd); sc.collection.objects.link(c); sc.camera = c
    aim = empty("aim", target); tc = c.constraints.new("TRACK_TO"); tc.target = aim; tc.track_axis = "TRACK_NEGATIVE_Z"; tc.up_axis = "UP_Y"
    c.location = loc
    return c, aim

anchors = {}
def project(cam, name, co, f):
    v = world_to_camera_view(sc, cam, Vector(co))
    anchors.setdefault(name, {})[f] = [round(v.x, 4), round(1 - v.y, 4), round(v.z, 3)]

# ---------------------------------------------------------------- shots
H = None
if SHOT == "sprite":
    H = build_hammy()
    rig_lights()
    cam, aim = camera((0, -8.2, 1.75), (0, 0, 1.5), lens=50)
    def per_frame(f): pose_hammy(H, f)

elif SHOT == "uchu":
    U = build_uchu()
    rig_lights((0, 0, 2.0))
    cam, aim = camera((0, -8.4, 2.4), (0, 0, 2.15), lens=50)
    def per_frame(f): pose_uchu(U, f)

elif SHOT == "hero":
    glossy_floor()
    H = build_hammy((0, 0, 0))
    rig_lights()
    # cyclorama light panels behind
    for i, (x, c) in enumerate([(-5.5, "#7C5CFF"), (-2.2, "#3B82F6"), (2.2, "#22D3EE"), (5.5, "#C6F432")]):
        bpy.ops.mesh.primitive_cube_add(location=(x, 7 + abs(x) * 0.3, 3.2))
        p = bpy.context.object; p.scale = (0.08, 0.08, 3.2)
        p.data.materials.append(mat(f"bar{i}", c, emit=c, estr=9.0))
    cam, aim = camera((0, -17, 3.6), (0, 0, 1.6), lens=45)
    def per_frame(f):
        t = f / FPS; p = smooth(t / 3.2)
        cam.location = (lerp(-2.5, 0.6, p), lerp(-17, -8.4, p), lerp(3.6, 2.1, p))
        aim.location = (0, 0, lerp(1.2, 1.7, p))
        pose_hammy(H, f)
        project(cam, "hammyHead", (0, -0.4, 3.0), f)

elif SHOT == "chart":
    glossy_floor(); neon_grid(60, 48)
    vals = [368, 385, 408, 410, 412, 447, 482]
    names = ["25.1Q", "25.2Q", "25.3Q", "25.4Q", "26.1Q", "26.2Q", "26.3Q"]
    H = build_hammy((-1.6, -0.4, 0), s=0.72)
    H["root"].rotation_euler = (0, 0, math.radians(-22))
    rig_lights((1.5, 0, 1.5))
    bars = []
    for i, v in enumerate(vals):
        x = 0.6 + i * 1.25; h = v / 482 * 4.6
        if i == 6: c1, c2 = "#2A3A10", "#C6F432"
        elif i >= 4: c1, c2 = "#0B2B45", "#22D3EE"
        else: c1, c2 = "#16123A", "#7C5CFF"
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 0))
        b = bpy.context.object; b.scale = (0.78, 0.78, 0.001)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=False)
        b.data.materials.append(emission_mat(f"q{i}", c1, c2, 2.2 if i == 6 else 1.2))
        bev = b.modifiers.new("bev", "BEVEL"); bev.width = 0.03; bev.segments = 3
        bars.append((b, x, h, i))
        # thin glowing cap on top
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 0))
        cp = bpy.context.object; cp.scale = (0.8, 0.8, 0.03); cp.data.materials.append(mat(f"cap{i}", c2, emit=c2, estr=6))
        bars[-1] = (b, x, h, i, cp)
    cam, aim = camera((-4.0, -13.0, 2.4), (2.5, 0, 1.8), lens=35)
    T0 = 3.2
    def per_frame(f):
        t = f / FPS; lt = t - T0; p = smooth(lt / 6.3)
        cam.location = (lerp(-4.2, 3.2, p), lerp(-13.2, -12.2, p), lerp(2.2, 3.8, p))
        aim.location = (lerp(2.0, 4.4, p), 0, lerp(1.7, 2.2, p))
        for (b, x, h, i, cp) in bars:
            g = smooth((lt - 0.25 - i * 0.32) / 0.7)
            over = 1 + 0.06 * math.sin(math.pi * min(1, max(0, (lt - 0.25 - i * 0.32) / 0.9))) if g > 0 else 1
            hh = max(0.002, h * g * over)
            b.scale = (0.78, 0.78, hh); b.location.z = hh / 2
            cp.location = (x, 0, hh + 0.015); cp.hide_render = g <= 0.01
            project(cam, f"bar{i}", (x, 0, h * g + 0.35), f)
            project(cam, f"base{i}", (x, -0.6, 0), f)
        pose_hammy(H, f)
        project(cam, "hammyHead", (-1.6, -0.4, 2.3), f)

elif SHOT == "road":
    glossy_floor(200); neon_grid(140, 90)
    rig_lights((0, 10, 1))
    # glowing S-curve road: flat ribbon mesh sampled from a bezier through the control points
    from mathutils.geometry import interpolate_bezier
    pts = [Vector(p) for p in [(0, -12, 0.02), (1.8, 4, 0.02), (-1.8, 17, 0.02), (1.4, 29, 0.02), (0, 46, 0.02)]]
    hl = [p - Vector((0, 4, 0)) for p in pts]; hr = [p + Vector((0, 4, 0)) for p in pts]
    center = []
    for a in range(len(pts) - 1):
        seg = interpolate_bezier(pts[a], hr[a], hl[a + 1], pts[a + 1], 40)
        center += seg[:-1] if a < len(pts) - 2 else seg
    verts, faces = [], []
    for k, c in enumerate(center):
        d = (center[min(k + 1, len(center) - 1)] - center[max(k - 1, 0)]).normalized()
        n = Vector((-d.y, d.x, 0)) * 0.7
        verts += [tuple(c + n), tuple(c - n)]
        if k: faces.append((2 * k - 2, 2 * k - 1, 2 * k + 1, 2 * k))
    me = bpy.data.meshes.new("road"); me.from_pydata(verts, [], faces)
    road = bpy.data.objects.new("road", me); sc.collection.objects.link(road)
    road.data.materials.append(emission_mat("roadm", "#3B82F6", "#7C5CFF", 1.8, axis="Y"))
    def road_x(y):
        for c0, c1 in zip(center, center[1:]):
            if c0.y <= y <= c1.y: return c0.x + (c1.x - c0.x) * (y - c0.y) / max(1e-6, c1.y - c0.y)
        return center[0].x if y < center[0].y else center[-1].x
    # milestone gates: glowing rings standing on the road
    ms = [(6.5, "#22D3EE"), (17.5, "#7C5CFF"), (28.5, "#3B82F6"), (40.0, "#C6F432")]
    gates = []
    for i, (y, c) in enumerate(ms):
        x = road_x(y)
        bpy.ops.mesh.primitive_torus_add(major_radius=1.6, minor_radius=0.07, location=(x, y, 1.7), rotation=(math.radians(90), 0, 0))
        g = bpy.context.object; g.data.materials.append(mat(f"gate{i}", c, emit=c, estr=12)); gates.append((g, x, y))
        bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.08, location=(x, y, 0.05))
        pad = bpy.context.object; pad.data.materials.append(mat(f"pad{i}", c, emit=c, estr=3))
    # scattered data "pylons" beside the road for parallax
    import random; random.seed(4)
    for k in range(38):
        y = random.uniform(-4, 46); side = random.choice([-1, 1]); x = road_x(y) + side * random.uniform(3.2, 9)
        h = random.uniform(0.4, 3.5)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, h / 2)); p = bpy.context.object; p.scale = (0.35, 0.35, h)
        p.data.materials.append(emission_mat(f"py{k}", "#0B1020", random.choice(["#3B82F6", "#7C5CFF", "#22D3EE"]), 0.8))
    cam, aim = camera((0, -9, 2.4), (0, 2, 1.2), lens=32)
    T0 = 16.45
    def per_frame(f):
        t = f / FPS; lt = t - T0; p = smooth(lt / 8.85) * 0.82 + lt / 8.85 * 0.18
        y = lerp(-9, 31, p)
        cam.location = (road_x(y) + 0.35 * math.sin(lt * 0.6), y, 2.1 + 0.4 * math.sin(lt * 0.5))
        aim.location = (road_x(y + 9), y + 9, 1.3)
        for i, (g, x, gy) in enumerate(gates):
            project(cam, f"gate{i}", (x, gy, 3.6), f)

os.makedirs(OUT, exist_ok=True)
def anchors_needed(f):  # label anchors must be recomputed even for frames we skip rendering
    return SHOT in ("hero", "chart", "road")
STEP = int(os.environ.get("STEP", "1"))  # 2 = render "on twos" (character sprite)
for f in range(F0, F1 + 1, STEP):
    done_already = os.path.exists(os.path.join(OUT, f"{f:04d}.png"))
    sc.frame_set(f)
    per_frame(f)
    if done_already:
        continue  # resume: frame already rendered (anchors were still recomputed above)
    sc.render.filepath = os.path.join(OUT, f"{f:04d}.png")
    bpy.ops.render.render(write_still=True)
    if f % 30 == 0: print(f"[{SHOT}] frame {f}", flush=True)
if anchors:
    path = os.path.join(OUT, "anchors.json")
    old = json.load(open(path)) if os.path.exists(path) else {}
    for k, v in anchors.items(): old.setdefault(k, {}).update({str(a): b for a, b in v.items()})
    json.dump(old, open(path, "w"))
print("done", SHOT, F0, F1)
