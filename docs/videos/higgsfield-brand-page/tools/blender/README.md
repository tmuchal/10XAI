# Blender 3D shots

Four short toon-shaded Blender inserts for the 192 s explainer, rendered headless with the
`bpy` wheel from PyPI. There's no GPU and no display: the shots use Cycles on the CPU.

| Shot | Script | Film time | Frames | Output |
|---|---|---|---|---|
| A fly-through | `shot_a_flythrough.py` | 0.0–2.4 s | 72 | 1920×1080 JPG, opaque |
| B photo booth | `shot_b_photobooth.py` | 86.5–89.5 s | 90 | 1080×1080 PNG, RGBA |
| C coin funnel | `shot_c_coinfunnel.py` | 163–166 s | 90 | 1080×1080 PNG, RGBA |
| D curtain call | `shot_d_curtaincall.py` | 187–190 s | 90 | 1920×1080 PNG, RGBA |

Output goes to `film/assets/3d/<shot>/0001.*`, and the manifest to `film/assets/3d/manifest.json`.
`film/seq.js` plays the sequences inside the HTML timeline.

## Setup (once)

```bash
python3 -m venv /tmp/bpyenv
/tmp/bpyenv/bin/pip install bpy==4.2.0 pillow     # bpy 4.2 has a cp311 wheel (Python 3.11)
/tmp/bpyenv/bin/python -c "import bpy; print(bpy.app.version_string)"   # -> 4.2.0
```

## Render

```bash
cd docs/videos/higgsfield-brand-page
tools/blender/render_all.sh            # all shots (a b c d), then finalize.py
tools/blender/render_all.sh b          # only the photo booth (then re-run finalize)
# a subset of frames for look-dev (0-based frame numbers, written to a scratch dir):
/tmp/bpyenv/bin/python tools/blender/shot_c_coinfunnel.py -- --frames 0,30,60,89 --out /tmp/look
/tmp/bpyenv/bin/python tools/blender/finalize.py      # PNG masters -> film/assets/3d + manifest.json
```

The shot scripts write PNG masters to `/tmp/blender-shots/<shot>/`. `finalize.py` then:
- converts the fly-through to JPG at quality 90
- turns the RGBA shots into 256-colour palette PNGs, which are about 10× smaller and look the same
- writes `manifest.json`

## How the look works (`toonlib.py`)

- **Emission-only toon shading.** Each material computes `N·L` against a fixed key direction and runs it through a constant colour ramp: warm shadow, base, and a small highlight. It only emits, so there are no lights to sample and no noise. The only reason for samples is anti-aliasing (5–6 spp, no denoiser). The view transform is `Standard`, so the hex palette comes out exactly.
- **Ink outlines** use an inverted hull: a Solidify modifier with flipped normals and a material offset to an `Ink` material. That material uses `Backfacing` to choose between transparent and ink `#2b2320`.
- **Watercolor paper.** A 4D noise multiplies each colour by about ±7%. Its W value changes at 8 fps, and the outline width jitters by ±12% at the same rate. This matches the 2D "line boil".
- **Deterministic animation.** Every transform is a pure function of the frame number (easing, springs, `hsh()` noise), with no physics and no randomness. Any frame can be re-rendered on its own.
- **Performance.** Emission sampling is off on every material, the light tree is off, and all bounces are 0.
- **Rig.** `hamster()` builds Noa (sunglasses with a glint star, yellow scarf) and the party-hat extras. It exposes pivots for squash and stretch, bow, arm waves, head tilt, lowering the glasses, and the wink eyes.

## Render times

Measured on 4 CPU cores with bpy 4.2.0 and Cycles CPU:

| Shot | Sampling | Time per frame | Time for the shot |
|---|---|---|---|
| A (1080p, the heaviest set) | 5 spp | ≈5–6 s | 6–7 min |
| B | 6 spp | ≈1.5 s | ≈2.3 min |
| C | 6 spp | ≈1.6 s | ≈2.4 min |
| D | 6 spp | ≈2.3 s | ≈3.4 min |

The total is about 15 minutes, plus about 1 minute for `finalize.py`.

EEVEE and Workbench don't work in the headless `bpy` wheel, because there's no GPU or OpenGL context. The render fails silently. Use Cycles.
