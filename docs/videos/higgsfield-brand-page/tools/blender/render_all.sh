#!/usr/bin/env bash
# Render every Blender shot + write the manifest. Usage: tools/blender/render_all.sh [a b c d]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PY="${BPY_PYTHON:-/tmp/bpyenv/bin/python}"
SHOTS="${*:-a b c d}"
for s in $SHOTS; do
  case $s in
    a) f=shot_a_flythrough.py ;; b) f=shot_b_photobooth.py ;;
    c) f=shot_c_coinfunnel.py ;; d) f=shot_d_curtaincall.py ;;
  esac
  start=$(date +%s)
  "$PY" "$HERE/$f" 2>&1 | grep -E "RENDERED|Error|Traceback" || true
  echo "shot $s wall time: $(( $(date +%s) - start ))s"
done
"$PY" "$HERE/finalize.py"
