#!/usr/bin/env python3
"""One-time converter: absolute cue times -> chapter anchors {"ch", "at"} (film/timeline.js).

  python3 tools/anchor-cues.py            convert tools/narration.json ("at") and tools/sfx-cues.json ("t") in place
  python3 tools/anchor-cues.py --check    only verify that every cue resolves (no writes)

Rule: a cue in [B - 1.0, B) (a curtain lead-in) is anchored to the chapter that starts at B, with a negative
local time; every other cue goes to the chapter that contains it. The conversion asserts that resolving each
anchor through the timeline reproduces the old absolute time exactly (float ==), so the audio is unchanged.
Already-anchored cues are left alone, so re-running is a no-op.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import timeline

HERE = os.path.dirname(os.path.abspath(__file__))
LEAD = 1.0


def anchor(T, t):
    chs = T["chapters"]
    for c in chs[1:]:
        if c["start"] - LEAD <= t < c["start"]:
            return c
    for c in chs:
        if c["start"] <= t < c["end"]:
            return c
    if t == chs[-1]["end"]:
        return chs[-1]
    raise ValueError(f"time {t} outside the film [0, {T['total']}]")


def local(start, t):
    for nd in (6, 5, 4, 3, 9, 12):
        lt = round(t - start, nd)
        if start + lt == t:
            return lt
    lt = t - start
    assert start + lt == t, f"cannot anchor {t} exactly to start {start}"
    return lt


def convert(T, cues, key):
    out, n = [], 0
    for c in cues:
        if "ch" in c:
            out.append(c); continue
        t = c[key]; ch = anchor(T, t); lt = local(ch["start"], t)
        new = {"ch": ch["id"], "at": lt}
        new.update((k, v) for k, v in c.items() if k != key)
        assert timeline.resolve(T, new) == t, (t, new)
        out.append(new); n += 1
    return out, n


def main():
    check = "--check" in sys.argv
    T = timeline.load()
    npath, spath = os.path.join(HERE, "narration.json"), os.path.join(HERE, "sfx-cues.json")
    narr = json.load(open(npath, encoding="utf-8"))
    sfx = json.load(open(spath, encoding="utf-8"))
    if check:
        for c in narr["cues"]: timeline.resolve(T, c)
        for c in sfx: timeline.resolve(T, c, "t")
        print(f"ok: {len(narr['cues'])} narration + {len(sfx)} sfx cues resolve (film {T['total']} s)")
        return
    old_n = [c["at"] for c in narr["cues"]] if all("ch" not in c for c in narr["cues"]) else None
    narr["cues"], k1 = convert(T, narr["cues"], "at")
    sfx, k2 = convert(T, sfx, "t")
    # the timeline now owns duration / boundaries / curtain timing
    dropped = [k for k in ("duration", "boundaries", "curtain") if narr.pop(k, None) is not None]
    json.dump(narr, open(npath, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    open(spath, "w", encoding="utf-8").write("[\n" + ",\n".join("  " + json.dumps(c, ensure_ascii=False) for c in sfx) + "\n]\n")
    if old_n is not None:
        assert [timeline.resolve(T, c) for c in narr["cues"]] == old_n
    print(f"anchored {k1} narration cues, {k2} sfx cues; dropped {dropped or 'nothing'} from narration.json")


if __name__ == "__main__":
    main()
