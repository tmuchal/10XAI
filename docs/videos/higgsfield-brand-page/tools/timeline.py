"""Read film/timeline.js (the single source of truth for chapter order, durations and anchors) from Python.

    import timeline; T = timeline.load()
    T["total"]              film length in seconds (sum of chapter durations)
    T["bounds"]             film seconds of every chapter change (chapters[1:] starts)
    T["byId"]["ch04"]       {"id", "dur", "authoredAt", "label", "sign", "start", "end", "shift"}
    timeline.at(T, "ch04", 1.0)            {ch, at} anchor -> film seconds
    timeline.resolve(T, cue, key)          cue {"ch", "at"} -> film seconds (cue[key] if it is not anchored)
    T["curtain"]            curtain constants (closeLead, closedAt, openAt, openLag, endClose, endClosed)
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "film", "timeline.js")


def load(path=PATH):
    src = open(path, encoding="utf-8").read()
    m = re.search(r"/\*JSON\*/\s*(\{.*\})\s*/\*END\*/", src, re.S)
    if not m:
        raise ValueError(f"{path}: no /*JSON*/{{...}}/*END*/ block")
    T = json.loads(m.group(1))
    s = n = 0
    for i, c in enumerate(T["chapters"]):
        c["index"] = i; c["start"] = s; s += c["dur"]; c["end"] = s; c["shift"] = c["start"] - c["authoredAt"]
        if c.get("label") == "auto":
            n += 1; c["label"] = "CHAPTER %02d" % n
    T["total"] = s
    T["byId"] = {c["id"]: c for c in T["chapters"]}
    T["bounds"] = [c["start"] for c in T["chapters"][1:]]
    return T


def at(T, ch, lt):
    if ch not in T["byId"]:
        raise KeyError(f"timeline: unknown chapter {ch!r} (known: {', '.join(T['byId'])})")
    return T["byId"][ch]["start"] + lt


def resolve(T, cue, key="at"):
    """Film time of a cue anchored as {"ch": id, "at": local seconds}. Un-anchored cues keep cue[key]."""
    return at(T, cue["ch"], cue["at"]) if "ch" in cue else cue[key]


def shot_start(T, name):
    x = next(e for e in T["shots3d"] if e["name"] == name)
    return at(T, x["ch"], x["at"])
