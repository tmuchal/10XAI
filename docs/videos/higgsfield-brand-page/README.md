# Brand Page Theater (film)

A deterministic HTML film: `film/index.html` draws any frame with `window.render(t)`; opened normally, it autoplays.

| Path | What |
|---|---|
| `film/timeline.js` | **The timeline.** Chapter order, durations, sign/label text, curtain constants, `{ch, at}` anchors, 3D shot anchors. Everything else derives from it. |
| `film/core.js` | Helpers, `scene()` / `chapter()`, `refWindow()` |
| `film/chapters/<id>.js` | One scene per chapter, written on its own authored clock |
| `film/boot.js` | Stage FX (curtains, sign, extras, confetti), 3D inserts, `window.render` / `READY` / `DURATION` |
| `film/assets/3d/` | Blender sequences + `manifest.js` (from `tools/blender/finalize.py`) |
| `film/ref/` | Optional `page.png` reference screenshot (see `film/ref/README.md`) |
| `tools/` | Narration/music (`build-narration.py`), SFX + final mix (`build-sfx.py`), renderers, lint (see `tools/README.md`) |

## Build order

```bash
cd docs/videos/higgsfield-brand-page
source tools/env.sh                                    # NODE_PATH (playwright) + FFMPEG
node tools/check-globals.cjs                           # global-scope lint: must print 0 error(s)
/tmp/tts/venv/bin/python tools/build-narration.py      # audio/{narration,music,mix}.wav + film/captions.js
/tmp/tts/venv/bin/python tools/build-sfx.py            # audio/{sfx,final}.wav
node tools/snap.cjs film/index.html /tmp/snaps 12 61.3 120   # spot-check frames
node tools/render-parallel.cjs film/index.html theater-final.mp4 30 4 audio/final.wav
```

## Where the times live

- **Chapter windows**: only in `film/timeline.js`. A chapter's film start is the sum of the durations before it.
- **Inside a chapter**: every literal is on the chapter's *authored* clock (`authoredAt`). `scene(a, b, …)` finds its
  chapter from the file name, and the scene receives `t - shift` (`shift = film start - authoredAt`) in `update`,
  `caps`, `cite` and `uchuHook`. Chapters that existed before the timeline keep `authoredAt` = their original start
  (ch04 is written in 106..134 seconds even if it plays later); new chapters use `authoredAt: 0`.
- **Narration and SFX cues** (`tools/narration.json`, `tools/sfx-cues.json`): `{ "ch": "ch04", "at": 1.0 }` =
  1 s after ch04 starts on the film clock. A curtain lead-in uses a negative `at` on the chapter it opens.
- **3D shots**: `TIMELINE.shots3d` (`{name, ch, at}`); frame counts and sizes come from `assets/3d/manifest.js`.
- **Chapter numbers**: `"label": "auto"` numbers chapters in order ("CHAPTER 01", …); the title card and the hanging
  sign both read it, so inserting a chapter renumbers everything after it.
- Chapters must not read film-global timing (`DURATION`, `TIMELINE`, `BOUNDS`, `SHOTS3D`, `CAPTIONS`, `SC`);
  `tools/check-globals.cjs` enforces it, along with unique top-level names (prefix chapter globals with `c<id>_`).

## Add a chapter

Example: a 20 s chapter `ch03s` between ch03 and ch04.

1. `film/chapters/ch03s.js`, wrapped in `(() => { … })();` like the others, on a local clock:
   `scene(0, 20, (R, s) => { const head = chapter(R, "", "제목"); …; return t => { /* t = 0..20 */ }; });`
   Top-level helpers are prefixed `c03s_`.
2. `film/timeline.js`: insert `{ "id": "ch03s", "dur": 20, "authoredAt": 0, "label": "auto", "sign": ["한국어", "English"] }`
   after ch03. ch04–ch07, their SFX/narration cues, the extras' cheer window, `coinfunnel` and `curtaincall` all move
   by 20 s automatically; labels renumber (ch04 becomes "CHAPTER 05").
3. `film/index.html`: add `<script src="chapters/ch03s.js"></script>` after `ch03.js`.
4. Cues for the new chapter: add `{ "ch": "ch03s", "at": … }` rows to `tools/narration.json` and `tools/sfx-cues.json`.
   The boundary at ch03s's start needs its own curtain sweep (copy ch04's `{"ch": "ch04", "at": -0.78, "type": "curtain", …}`
   row as `"ch": "ch03s"`); music swells/whooshes/chimes per boundary are generated from the timeline.
5. `node tools/check-globals.cjs`, then rebuild narration + SFX, then snap the new chapter and its two boundaries.
