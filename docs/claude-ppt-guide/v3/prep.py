"""Collect Blender-projected label anchors into anchors.js for briefing.html.
Usage: python3 prep.py <render_dir>"""
import json, os, sys
d = sys.argv[1]
out = {}
for shot in ("hero", "chart", "road"):
    p = os.path.join(d, f"r_{shot}", "anchors.json")
    if os.path.exists(p): out[shot] = json.load(open(p))
open(os.path.join(d, "anchors.js"), "w").write("window.ANCH = " + json.dumps(out) + ";")
print({k: list(v.keys()) for k, v in out.items()})
