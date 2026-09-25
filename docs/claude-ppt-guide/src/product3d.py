"""Stand-in 'product photo' renders for the Higgsfield scene (Blender 4.0, Eevee).
Swap these for real Higgsfield outputs when the connector is available.
Usage:
  blender -b -P product3d.py -- stills <out_dir>      # 4 colorway stills, 800x800
  blender -b -P product3d.py -- spin <out_dir>        # 48-frame turntable, 540x540 (the '5-second product video')
"""
import bpy, sys, os, math
from mathutils import Vector

mode, out = sys.argv[sys.argv.index("--") + 1:][:2]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
ee = sc.eevee
ee.taa_render_samples = 24; ee.use_gtao = True; ee.gtao_distance = 0.4; ee.use_soft_shadows = True; ee.use_ssr = True
try:
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Base Contrast"
except Exception:
    pass
sc.render.resolution_x = sc.render.resolution_y = 800 if mode == "stills" else 540
world = bpy.data.worlds.new("W"); sc.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[1].default_value = 0.35

def srgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1,)

def mat(name, col, rough, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = srgb(col); p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal; p.inputs["Coat Weight"].default_value = coat
    return m

# seamless backdrop (floor curving into wall)
bpy.ops.mesh.primitive_plane_add(size=1)
bd = bpy.context.object; me = bd.data
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT")
verts, faces = [], []
prof = [(0, -6 + i * 0.3, 0) for i in range(20)] + [(0, 0 + 2 * math.sin(a / 12 * math.pi / 2), 2 - 2 * math.cos(a / 12 * math.pi / 2)) for a in range(1, 13)] + [(0, 2, 2 + i * 0.5) for i in range(1, 10)]
for x in (-8, 8):
    for p in prof: verts.append((x, p[1], p[2]))
n = len(prof)
for i in range(n - 1): faces.append((i, i + 1, n + i + 1, n + i))
me.from_pydata(verts, [], faces); bpy.ops.object.shade_smooth()
BACK = mat("backdrop", "#F4D9CF", 0.85); bd.data.materials.append(BACK)

# tumbler: body, lid, rim band
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.62, depth=2.3, location=(0, 0, 1.15))
body = bpy.context.object; bpy.ops.object.shade_smooth()
bev = body.modifiers.new("b", "BEVEL"); bev.width = 0.06; bev.segments = 6
BODY = mat("body", "#F7F5F2", 0.42, coat=0.2); body.data.materials.append(BODY)
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.64, depth=0.36, location=(0, 0, 2.48))
lid = bpy.context.object; bpy.ops.object.shade_smooth(); lb = lid.modifiers.new("b", "BEVEL"); lb.width = 0.05; lb.segments = 5
lid.data.materials.append(mat("lid", "#2B2B30", 0.3, coat=0.5))
bpy.ops.mesh.primitive_torus_add(major_radius=0.63, minor_radius=0.025, location=(0, 0, 2.28))
bpy.context.object.data.materials.append(mat("band", "#C9A36A", 0.25, metal=1.0))
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.12, depth=0.08, location=(0.3, 0, 2.7))
bpy.context.object.data.materials.append(mat("sip", "#2B2B30", 0.3))

def area(loc, power, size, col="#FFFFFF"):
    ld = bpy.data.lights.new("a", "AREA"); ld.energy = power; ld.size = size; ld.color = srgb(col)[:3]
    o = bpy.data.objects.new("a", ld); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 1.2)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
area((-3.5, -3.5, 4.5), 700, 4, "#FFF3E6"); area((4, -2, 3), 250, 5, "#E6F0FF"); area((0, 3, 5), 300, 3)

cd = bpy.data.cameras.new("c"); cd.lens = 70; cd.dof.use_dof = True; cd.dof.focus_distance = 8.6; cd.dof.aperture_fstop = 2.8
cam = bpy.data.objects.new("c", cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -8.2, 2.3); cam.rotation_euler = (math.radians(86), 0, 0)

if mode == "stills":
    for i, (bg, bodyc) in enumerate([("#F4D9CF", "#F7F5F2"), ("#CFE3F4", "#F7F5F2"), ("#DDEFD5", "#2E3A34"), ("#F6E7C4", "#E9785B")]):
        BACK.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb(bg)
        BODY.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb(bodyc)
        sc.render.filepath = os.path.join(out, f"product_{i + 1}.png"); bpy.ops.render.render(write_still=True)
else:
    pivot = bpy.data.objects.new("pv", None); sc.collection.objects.link(pivot)
    for o in (body, lid) + tuple(o for o in sc.objects if o.name.startswith(("Torus", "Cylinder"))):
        o.parent = pivot
    for f in range(48):
        pivot.rotation_euler = (0, 0, f / 48 * 2 * math.pi)
        cam.location = (0, -8.2 + 0.6 * f / 47, 2.3 + 0.2 * f / 47)
        sc.render.filepath = os.path.join(out, f"spin_{f:02d}.png"); bpy.ops.render.render(write_still=True)
print("done", mode)
