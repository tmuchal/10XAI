"""Paints the watercolor stage backdrop (warm sunburst wash + blooms + paper grain).
Usage: python3 make-backdrop.py <out.png>"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
rng = np.random.default_rng(7)
out = sys.argv[1]

base = Image.new("RGB", (W, H), (253, 240, 210))

def wash(color, blobs, blur, alpha):
    layer = Image.new("RGBA", (W, H), color + (0,))
    d = ImageDraw.Draw(layer)
    for (x, y, r) in blobs:
        d.ellipse([x - r, y - r, x + r, y + r], fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(blur))

cx, cy = W * 0.52, H * 0.18
# sunburst rays: alternating soft peach / pink wedges from the top center
ray_layers = {c: Image.new("RGBA", (W, H), c + (0,)) for c in [(246, 168, 150), (252, 206, 128)]}
n = 16
for i in range(n):
    a0 = 2 * np.pi * i / n + rng.uniform(-0.04, 0.04)
    a1 = a0 + 2 * np.pi / n * rng.uniform(0.45, 0.6)
    R = 2600
    col = (246, 168, 150) if i % 2 else (252, 206, 128)
    d = ImageDraw.Draw(ray_layers[col])
    d.polygon([(cx, cy), (cx + R * np.cos(a0), cy + R * np.sin(a0)), (cx + R * np.cos(a1), cy + R * np.sin(a1))], fill=col + (95,))
for rays in ray_layers.values():
    rays = rays.filter(ImageFilter.GaussianBlur(9))
    base.paste(rays, (0, 0), rays)

# warm yellow core + scattered blooms
core = wash((255, 214, 102), [(cx + rng.normal(0, 60), cy + rng.normal(0, 40), rng.uniform(140, 260)) for _ in range(9)], 60, 200)
base.paste(core, (0, 0), core)
for color, count, rr, a in [((250, 190, 120), 26, (60, 190), 60), ((240, 150, 150), 18, (50, 150), 45), ((255, 225, 150), 24, (40, 140), 70)]:
    b = wash(color, [(rng.uniform(0, W), rng.uniform(0, H * 0.8), rng.uniform(*rr)) for _ in range(count)], 45, a)
    base.paste(b, (0, 0), b)

# pigment edges: darker rims where blotches dried
arr = np.asarray(base).astype(np.float32)
noise = rng.normal(0, 1, (H // 6, W // 6)).astype(np.float32)
noise = np.asarray(Image.fromarray(((noise - noise.min()) / np.ptp(noise) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
arr *= (0.93 + 0.1 * noise)[..., None]
# paper grain
grain = rng.normal(0, 3.5, (H, W)).astype(np.float32)
arr += grain[..., None]
# soft vignette
yy, xx = np.mgrid[0:H, 0:W]
v = 1 - 0.07 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H * 0.45) / (H * 0.7)) ** 2)
arr *= v[..., None]
Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(out)
print("wrote", out)
