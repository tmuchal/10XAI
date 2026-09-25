# Brand Page Theater: architecture review and refactor plan

This is a read-only review of `docs/videos/higgsfield-brand-page/` at `HEAD` (657bc19), plus the working tree on 2026-09-25. All paths are relative to that folder. Line numbers may drift slightly because `ch03.js`, `core.js` and the narration files were being edited in parallel.

## Executive summary

- **Inserting a 20 s chapter today means editing about 1,400 time literals by hand.** Chapters use absolute film seconds throughout: ch01 through ch07 contain 93 to 344 decimal literals of 10 or more each, and none use a local clock. On top of that, the times are duplicated in 9 other places: `core.js:41`, `boot.js:40-42,247,258-263`, `assets/3d/manifest.json`, `tools/blender/finalize.py:15-21`, `tools/narration.json` (duration, boundaries, 38 `at`), `tools/sfx-cues.json` (184 `t`) and `tools/build-sfx.py:31`. Regex-shifting "numbers ≥ 106" is unsafe because those same numbers are also pixel sizes.
- **Fix: one timeline file, `film/timeline.js`, plus a time-warp shim in `scene()`.** Each chapter keeps its authored clock and only its offset moves. This inserts the chapter with zero edits to ch04–ch07. After that, cues and 3D shots are anchored as `{ch, at}`, and every build script reads the same file.
- **The reference-page path is broken and non-deterministic.** `refWindow` loads `ref/page.png` relative to `film/`, so it looks in `film/ref/page.png` (`core.js:389`). But `ref/README.md` tells the user to drop the file in the project-root `ref/`. The swap from mock to real also happens in an async `onload` that `READY` does not await (`core.js:388`), so each render worker could show the mock or the real page. The labels are page-height fractions (`core.js:39`), not element positions.
- **Rendering is limited by screen capture, not by our JS.** Measured on this box, one process spends ~4–7 ms in `render(t)` and ~125 ms in `page.screenshot` (jpeg q93). The next speed-up comes from CDP capture (`Page.captureScreenshot` with `optimizeForSpeed`), not from optimizing the scenes.
- **The repo is heavy and hard to rebuild.** This folder tracks ~140 MB: five preview MP4s (~88 MB), 3D frame sequences (~40 MB) and two m4a files. There is no single rebuild command, the docs name two different venvs, and body/mono text uses system fonts that are not bundled. Legacy v1/v2 files (explainer, immersive, stage-film, restyle.py, render.cjs) are still tracked.

## Findings

| # | Sev | Area | Finding | Fix |
|---|---|---|---|---|
| 1 | High | Timeline | Absolute times are hard-coded in 8 chapters (e.g. `ch04.js:62-76` `scene(106,134…)`, `WIPES=[112.5,119,125]`), and the boundaries are duplicated in `boot.js:40`, `narration.json` and the `build-sfx.py:31` `DURATION`. | `film/timeline.js` + scene shim (design A) |
| 2 | High | Timeline | Chapter numbering is hard-coded. The sign builds `CHAPTER 0${bi+1}` and uses `FIN` when `bi===6` (`boot.js:242`). `SIGNS` is a fixed array of 7 (`boot.js:41`). Each chapter title card also hard-codes its label (e.g. `ch04.js:67` `"CHAPTER 04"`). After the insert, the sign would read "CHAPTER 05" while the card reads "CHAPTER 04". | Put labels and signs in the timeline; `chapter()` takes the label from the timeline |
| 3 | High | Timeline | Chapter-specific windows are hard-coded in boot: the extras' cheer window `t>163&&t<176` (`boot.js:247`) and the 3D starts (`boot.js:258-263`). | Anchor them as `{ch:"ch06", at:3..16}` |
| 4 | High | Ref | `img.src="ref/page.png"` resolves to `film/ref/page.png` (`core.js:389`), but the docs say `ref/page.png` at the project root (`ref/README.md:3`). Today it logs two `ERR_FILE_NOT_FOUND` errors per page load (measured). | Use `../ref/page.png`, or load it through `ref/layout.js` |
| 5 | High | Determinism | The real-page swap runs in `img.onload` (`core.js:388`), which is not in `window.READY` (`boot.js:328`). Frames near a worker's start can show the mock, then switch to the real page mid-film. | Push `img.decode()` into `READY` and decide `win.real` before the first render |
| 6 | Med | Ref | `REF_MARKS` are fractions of page height (`core.js:39`). ch02 computes label and arrow y from `REF_MARKS[i][0]*H` (`ch02.js:355,388,404`). They will not land on the real page's sections. | Position marks from `layout.json` by section key (design B) |
| 7 | Med | Globals | All scripts are classic scripts sharing one global lexical scope. A top-level `const` in a new chapter named `CX`, `J`, `NS`, `SCN`, `NB`, `EXTRAS`, `render`, `out`, `type`, `back`, `pop`, `seg`, `el`, `fmt`, `dust`, `confetti`, `uid`, `SC` or `REFS` throws `Identifier … has already been declared` when `boot.js` loads, and the film renders blank. Also, `function render` (`boot.js:12`) is overwritten by `window.render=` (`boot.js:333`); this works only because `baseRender` captures it first. | Wrap `boot.js` in an IIFE that exports `render`, `READY` and `DURATION`; wrap each chapter in an IIFE; add a `check-globals` tool |
| 8 | Med | Duplication | Every chapter re-implements the same helpers: `c0X_rnd`/`c03_hash`/`c06_h` (same as `hash`), `_settle`, `_kick`, `_card`, `_abs`, `_strips`, `_INK` (`ch00.js:9-11`, `ch05.js:4-17`, `ch06.js:5-17`, `ch07.js:4-8`). | Move the shared helpers to `core.js`, keeping per-chapter seeds |
| 9 | Med | Determinism | Body and mono text use system fonts: "Noto Sans CJK KR", "Noto Serif CJK KR" and "DejaVu Sans Mono" (`index.html:13-15`). Only Gaegu is bundled (`index.html:51-54`), so renders differ between machines. `fmt` uses ICU `toLocaleString("ko-KR")` (`core.js:120`). | Bundle the woff2 subsets in `fonts/` and load them in `READY` |
| 10 | Med | Perf | ~95% of each frame is capture. Measured: `render()` 6.9 ms including the round-trip (4.2 ms inside the page), screenshot 125 ms. `mainNoa()` forces a layout every frame (`boot.js:207`, `getBoundingClientRect`). | CDP capture (plan P1); cache the Noa rect per scene |
| 11 | Med | Sync | The 3D manifest is duplicated by hand in `boot.js:258-263`, with a "keep in sync" comment (`boot.js:257`). Shot starts are hard-coded in `finalize.py:15-21`. Frame counts match today (72/90/90/90 on disk = manifest = SHOTS3D). | `finalize.py` writes `manifest.js`; starts come from the timeline |
| 12 | Med | Repro | There is no top-level build. The docs use two venvs (`/tmp/kokoro-venv` vs `/tmp/tts/venv`, `tools/README.md`). Python and Playwright versions are unpinned (only `bpy==4.2.0` is pinned). `make-assets.cjs` also writes an unused `grain.png` (`make-assets.cjs:83`, `#grain{display:none}` `index.html:93`). | `Makefile` / `tools/build-all.sh` + `requirements.txt` (plan C3) |
| 13 | Low | Captions | The narration guard uses `boundary − 0.6` (`build-narration.py:97`), but the curtain starts closing at `B − 0.75` (`boot.js:105`). The end-of-film limit works out to 191.9 s, but the final curtain starts at 190.7 (`boot.js:106`). Only one caption overlaps a curtain today: 35.90–39.29 runs 0.04 s into the ch02 close. All 8 captions that start at B+1.0 are dimmed by `(1-cc)` until B+1.25 (`boot.js:218`). | Derive the guard from the same curtain constants in the timeline |
| 14 | Low | Dead data | Every chapter's `s.caps` array is ignored once `window.CAPTIONS` exists (`boot.js:25-31`), so they are stale duplicates of the narration. Also unused: `#prog`, `#fx` and `#grain` (`index.html:118,133,136`). | Delete them, or keep `s.caps` only as a documented fallback |
| 15 | Low | Cues | No SFX or narration cue falls outside [0, 192]. The sfx sheet notes that its times were "read at commit 15c18e5" (`tools/README.md`), so it is kept in sync by hand. | Use `{ch, at}` anchors (A.3) |
| 16 | Low | Repo | This folder tracks ~140 MB: `theater-{final,v3,v2}-preview.mp4` (23 + 21 + 21 MB), `immersive.mp4` 16 MB, `explainer.mp4` 6.7 MB, `3d/` 40 MB (the flythrough JPGs alone are 25 MB, ~350 KB each), and `audio/{final,mix}.m4a` at 4.7 MB each. The git object store is 480 MB of loose objects. | See the cleanup list |

## A. Timeline refactor

### A.1 Single source of truth: `film/timeline.js`

Loaded first in `index.html`, before `core.js`. It is a JS file because `file://` pages cannot `fetch()` JSON (`boot.js:256`). The Python tools read the JSON between the markers.

```js
// film/timeline.js: THE timeline. Edit durations here; everything else is computed.
window.TIMELINE = /*JSON*/{
  "fps": 30, "fade": 0.6,
  "curtain": { "closeLead": 0.75, "openLag": 1.25, "endClose": 1.3 },
  "chapters": [
    { "id": "ch00", "dur": 10, "authoredAt": 0,   "label": null,         "sign": null },
    { "id": "ch01", "dur": 30, "authoredAt": 10,  "label": "CHAPTER 01", "sign": ["누구를 위한 페이지?", "Who is it for?"] },
    { "id": "ch02", "dur": 32, "authoredAt": 40,  "label": "CHAPTER 02", "sign": ["전체 흐름 잡기", "Shaping the flow"] },
    { "id": "ch03", "dur": 34, "authoredAt": 72,  "label": "CHAPTER 03", "sign": ["캐릭터 일관성", "One consistent character"] },
    { "id": "ch03s","dur": 20, "authoredAt": 0,   "label": "CHAPTER 04", "sign": ["Seedance 2.5 프롬프트", "Prompting Seedance 2.5"] },
    { "id": "ch04", "dur": 28, "authoredAt": 106, "label": "CHAPTER 05", "sign": ["몰입감 만들기", "Building immersion"] },
    { "id": "ch05", "dur": 26, "authoredAt": 134, "label": "CHAPTER 06", "sign": ["전문성 × 유머", "Expertise × humor"] },
    { "id": "ch06", "dur": 24, "authoredAt": 160, "label": "CHAPTER 07", "sign": ["결국, 매출로", "Turning it into sales"] },
    { "id": "ch07", "dur": 8,  "authoredAt": 184, "label": "FIN",        "sign": ["커튼콜", "Curtain call"] }
  ],
  "anchors": { "extrasCheer": { "ch": "ch06", "at": 3, "until": 16 } },
  "shots3d": [
    { "name": "flythrough",  "ch": "ch00", "at": 0 },
    { "name": "photobooth",  "ch": "ch03", "at": 14.5 },
    { "name": "coinfunnel",  "ch": "ch06", "at": 3.0 },
    { "name": "curtaincall", "ch": "ch07", "at": 3.0 }
  ]
}/*END*/;
(T => {
  let s = 0;
  T.chapters.forEach((c, i) => { c.index = i; c.start = s; s += c.dur; c.end = s; c.shift = c.start - c.authoredAt; });
  T.total = s;
  T.byId = Object.fromEntries(T.chapters.map(c => [c.id, c]));
  T.at = (ch, lt) => T.byId[ch].start + lt;                  // {ch, at} -> film seconds
  T.bounds = T.chapters.slice(1).map(c => c.start);          // replaces boot.js BOUNDS
})(window.TIMELINE);
```

Python side (shared by `build-narration.py`, `build-sfx.py` and `finalize.py`) in `tools/timeline.py`:

```python
def load():
    src = open(os.path.join(ROOT, "film", "timeline.js"), encoding="utf-8").read()
    T = json.loads(src.split("/*JSON*/", 1)[1].split("/*END*/", 1)[0])
    s = 0
    for c in T["chapters"]:
        c["start"] = s; s += c["dur"]; c["end"] = s
    T["total"] = s; T["byId"] = {c["id"]: c for c in T["chapters"]}
    T["at"] = lambda ch, lt: T["byId"][ch]["start"] + lt
    return T
```

### A.2 Time-warp shim (no edits to chapter bodies)

`scene()` finds its chapter from the script filename and records the offset between the authored clock and the film clock. The render loop hands each scene its authored time. ch04–ch07 keep every literal (`106.2`, `WIPES`, …), and the new chapter is authored in local time (`authoredAt: 0` → `scene(0, 20, …)`).

```js
// core.js (replaces core.js:403-409)
function scene(a, b, build) {
  const id = ((document.currentScript && document.currentScript.src) || "").match(/(ch[\w]+)\.js/)?.[1];
  const C = id && TIMELINE.byId[id];
  if (C && Math.abs((b - a) - C.dur) > 1e-6) console.warn(`scene ${id}: authored ${b - a}s ≠ timeline ${C.dur}s`);
  const shift = C ? C.shift : 0;
  const root = el("div", "", "", $("scenes")); root.className = "scene";
  const s = { id, a: a + shift, b: C ? C.end : b + shift, a0: a, shift, root, caps: [], cite: [] };
  s.update = build(root, s) || (() => {});
  SC.push(s);
  return s;
}
function chapter(root, k, t) { /* k ignored when the timeline has a label */ const id = SC.length; … }
// boot.js render(): pass the authored clock; caps/cite are authored times too
//   s.update(t - s.shift);
//   s.cite.forEach(c => { if (t - s.shift >= c[0]) cite = c[1]; });
// boot.js boilScene: seed with s.a0 (not s.a) so the jitter stays identical after the shift
//   jiggle(e, t, …, i + s.a0)
```

`uchuHook` (`core.js:585`) wraps `s.update`, so its hook automatically receives the authored `t`. `shakeCam` and `window.SHAKE` then see authored time too, so the shake pattern is unchanged. The stage FX in `boot.js` stay on film time and read `TIMELINE.bounds`, `TIMELINE.total`, `TIMELINE.fade`, the chapter `sign`/`label` fields, and `TIMELINE.anchors.extrasCheer`. `core.js:41` becomes `const DURATION = TIMELINE.total, FADE = TIMELINE.fade;`.

**The catch:** a chapter that reads film-global state (`window.CAPTIONS`, `DURATION`, another scene's time) would see mixed clocks. Today none do: I grepped for `DURATION|BOUNDS|SHOTS3D|SC[` in `chapters/` and found no hits. Keep it that way, and add a check in the globals lint.

### A.3 Cues and 3D anchored to chapters

- **narration.json / sfx-cues.json:** replace `"at": 107.0` with `"ch": "ch04", "at": 1.0`, and drop `duration`/`boundaries` from `narration.json` (they come from the timeline). Curtain lead-in cues use a negative local time on the *next* chapter (e.g. whoosh `{"ch":"ch04","at":-0.75}`). Run a one-time converter, `tools/anchor-cues.py`. Rule: a cue in `[B−1.0, B)` goes to the chapter starting at `B`; everything else goes to the chapter containing it. Round-trip check: resolving the anchors must reproduce the old absolute times exactly.
- **build-narration.py:** `B = T.bounds + [T.total]`, and `limit = B − curtain.closeLead` (fixes finding 13). **build-sfx.py:** `DURATION = T["total"]` (replacing `:31` and the assertion at `:533`).
- **3D:** `finalize.py` stops writing `start` and emits `film/assets/3d/manifest.js` (`window.SHOTS3D_MANIFEST = [...]`, with frames, ext, alpha and size). `boot.js` builds `SHOTS3D` as `manifest ⨝ TIMELINE.shots3d` with `start = TIMELINE.at(ch, at)`. The comment at `boot.js:257` goes away. For the insert, only `coinfunnel` (163 → 183) and `curtaincall` (187 → 207) move; `photobooth` is inside ch03 and does not.
- **Music:** 20 s at 96 bpm is exactly 32 beats (8 bars). If the music bed is a pure function of film time, everything after the insert lands on the same bar phase. That makes a strong check: `final.wav[126:]` should nearly match the old `final.wav[106:]`.

### A.4 How painful the insert is

| Approach | Files touched | Risk |
|---|---|---|
| Hand-shift literals | 4 chapters (~660 literals) + boot + 2 JSON + finalize + build-sfx | Very high: silent desync, pixel literals caught by regex |
| Shim (A.2) + cue shift (A.3) | `timeline.js`, `core.js` (scene), `boot.js` (~15 lines), 2 build scripts, 2 JSON (converter), `index.html` (1 script tag) | Low: every step can be checked with golden frames |

## B. Real reference capture and alignment

### B.1 `tools/capture-ref.cjs`

The creator's site is itself an immersive, scroll-animated page, so a single full-page screenshot would catch animations in their pre-scroll state. The script scrolls step by step first, then freezes animations.

```js
// node tools/capture-ref.cjs [url=https://noainostory.higgsfield.app] [outDir=ref]
const { chromium } = require("playwright"); const fs = require("fs"), path = require("path");
(async () => {
  const [url = "https://noainostory.higgsfield.app", out = "ref"] = process.argv.slice(2);
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: "networkidle" });
  for (let y = 0, H = await p.evaluate(() => document.documentElement.scrollHeight); y < H; y += 600) {   // trigger lazy/scroll reveals
    await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(250);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.addStyleTag({ content: "*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent}" });
  await p.screenshot({ path: path.join(out, "hero.png") });                          // first viewport (video poster frame)
  await p.screenshot({ path: path.join(out, "page.png"), fullPage: true });
  const layout = await p.evaluate(() => {
    const box = e => { const r = e.getBoundingClientRect(); return [r.left, r.top + scrollY, r.width, r.height].map(Math.round); };
    const txt = e => (e.innerText || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const cs = e => { const s = getComputedStyle(e); return { bg: s.backgroundColor, fg: s.color, font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, radius: s.borderRadius }; };
    const secs = [...document.querySelectorAll("header, section, footer, main > div")].filter(e => e.offsetHeight > 120);
    return {
      page: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, title: document.title },
      sections: secs.map((e, i) => ({ key: e.id || `s${i}`, tag: e.tagName.toLowerCase(), box: box(e),
        heading: txt(e.querySelector("h1,h2,h3") || e), style: cs(e) })),
      headings: [...document.querySelectorAll("h1,h2,h3")].map(e => ({ level: +e.tagName[1], text: txt(e), box: box(e), style: cs(e) })),
      ctas: [...document.querySelectorAll("a[href], button")].filter(e => e.offsetWidth > 60 && e.offsetHeight > 30)
        .map(e => ({ text: txt(e), href: e.getAttribute("href"), box: box(e), style: cs(e) })),
    };
  });
  layout.url = url; layout.capturedAt = new Date().toISOString(); layout.viewport = { w: 1440, h: 900 };
  // role hints (hand-editable afterwards): hook = first section, action = last CTA, proof = section with most numbers
  fs.writeFileSync(path.join(out, "layout.json"), JSON.stringify(layout, null, 1));
  fs.writeFileSync(path.join(out, "layout.js"), "// generated by tools/capture-ref.cjs\nwindow.REF_LAYOUT = " + JSON.stringify(layout) + ";\n");
  await b.close();
})();
```

Add a hand-edited `ref/roles.json` next to `layout.json`, for example `{ "hook": "s0", "proof": "testimonials", "action": {"cta": -1} }`. This keeps the semantic choice out of the generated file. Commit `page.png` (or put it in LFS) together with `layout.*`, so a render never depends on the network.

### B.2 How the film consumes it

- `index.html` gets `<script src="../ref/layout.js" onerror="…"></script>` before `core.js`, and `refWindow` uses `../ref/page.png`. With no layout file, the mock stays as an explicit fallback.
- In `refWindow` (`core.js:381-399`), decide `real` synchronously from `window.REF_LAYOUT`. Push `img.decode()` into `window.__pending` and `READY` (fixes findings 4 and 5). Add a geometry API so no chapter ever needs page fractions again:

```js
win.pageH = real ? REF_LAYOUT.page.h * k : mock.fullH * k;          // window px
win.rectOf = key => {                                                // key: section key | "cta:-1" | role name
  const r = resolveRole(key);                                        // via ref/roles.json, falls back to the mock's data-key
  return { x: r.box[0] * k, y: r.box[1] * k - win.off, w: r.box[2] * k, h: r.box[3] * k };   // relative to the view
};
win.scrollToKey = (key, align = .22, p = 1, t) => { … sets win.off so rectOf(key).y == align*viewH, eased by p … };
```

- `REF_MARKS` (`core.js:39`) becomes `[["hook","훅 · Hook"],["proof","증거 · Proof"],["action","행동 · Action"]]`. In ch02, `ch02.js:352-357,388,404` replace `REF_MARKS[i][0]*H - off` with `ref.rectOf(role).y`, and circles and arrows target the centre of the rect. `ch00.js:165` and `ch01.js:317` switch to `scrollToKey`.
- The mock gets the same keys: `brandPage()` sections carry `data-key` attributes, and `rectOf` measures them once with `offsetTop`. Both paths then share one API.

### B.3 Compare step: `tools/ref-compare.cjs`

1. Render `brandPage()` alone at 1440 wide from a harness page that loads `core.js`, and screenshot it as `ref/mock.png`. Run the same DOM extraction on it to get `ref/mock-layout.json`.
2. Output `ref/compare.png`: mock | real side by side, scaled to the same width, with section boxes outlined and labelled by key.
3. Output a text report: section count and heights, heading text, the top 6 colours by pixel area (real vs `:root` tokens in `index.html:7-9` and the mock's inline colours, as ΔE), font families, and CTA radius and colour.
4. Decision rule: if more than 2 sections differ or the palette ΔE is above 10, rebuild `brandPage()` from `layout.json` as a wireframe (boxes, headings, CTA pills in the captured colours), or retire it and keep only a "reference unavailable" card. Either way, the film never shows invented copy as the creator's site. Today the mock displays made-up content such as `BRAND FILM · SEOUL` and `이야기가 브랜드가 되는 곳` (`core.js:342-377`).

## C. Other topics

**Risky globals.** From `core.js`: `$ clamp seg ease out back type lerp hash boilStep wobble el pop popIn jiggle wipe countStamp makeBurst shakeCam fmt PAL INK uid ridge filmCloud makeFilm NOA makeNoa poseNoa makeBubble sayBubble brandPage REFS refWindow SC scene chapter UCHU makeUchu poseUchu uchuHook REF_URL REF_MARKS DURATION FADE`. From `boot.js`: `capKo capEn capBox capKey showCap render BOUNDS SIGNS J DECOR_DEFS DECOR_READY rasterize NS NB NYS TIE_Y CX curtKey backOut curtainC innerX drawCurtains EXTRAS CONF confetti DUST dust BOIL_SEL boilScene mainNoa stageFx SHOTS3D SCN toScene INK3D INSERTS FLY ALL3D warm3d fx3d baseRender`. On `window`: `SHAKE __pending READY CAPTIONS SEQ render DURATION`.

The worst are the 1–3 letter names and common words (`J`, `NS`, `CX`, `SCN`, `NB`, `out`, `type`, `back`, `pop`, `el`, `fmt`, `uid`). Because chapters load before `boot.js`, a clash crashes `boot.js`, not the chapter. `tools/check-globals.cjs` would load every script into one `vm` context in `index.html` order, report duplicate lexical declarations, and fail on any new top-level name in `chapters/*.js` without a `cNN_`/`CNN_` prefix.

**Determinism.** No `Math.random` or `Date` calls; `performance.now` appears only in the preview loop (`boot.js:336`). Caches are keyed (`curtKey`, `capKey`, `sign.dataset.bi`, seq `cur`), so a worker can start at any frame. The remaining risks are findings 5 and 9 and `boilScene` caching its element list on the first visible frame (`boot.js:201`). `tools/determinism-check.cjs` would render about 20 timestamps both cold (a new page per t) and in sequence, then compare PNG hashes. This is also the golden-frame harness the plan uses.

**Render performance** (current ~5.5 fps per process under parallel load; ~7.6 fps alone). (P1) Replace `page.screenshot` with a CDP session: `Page.captureScreenshot({format:"jpeg", quality:90, optimizeForSpeed:true, fromSurface:true})`. Measure on 300 frames, then consider `HeadlessExperimental.beginFrame` with chrome-headless-shell. (P2) Compute `mainNoa()` from pose data instead of `getBoundingClientRect`. (P3) Set the worker count to cores − 1 and add `--frames a:b` to re-render only a changed chapter plus concat, which the timeline makes easy.

**Assets in git.** The largest tracked files are the five MP4s (88 MB), `3d/flythrough/*.jpg` (72 × ~350 KB = 25 MB), `3d/curtaincall` 6.1 MB, `3d/photobooth` 5.5 MB, `audio/final.m4a` and `audio/mix.m4a` (4.7 MB each), `fonts/gaegu-korean-700` (0.47 MB). Deleting them does not shrink history, so a `git filter-repo` pass is a separate decision for the owner.

## D. Cleanup list

| Action | Items |
|---|---|
| Delete (superseded v1/v2, not referenced by `film/` or `tools/`) | `explainer.html`, `explainer.mp4`, `render.cjs` (renders explainer), `immersive-film.html`, `immersive.mp4`, `stage-film.html`, `restyle.py` (builds stage-film), `theater-v2-preview.mp4`, `theater-v3-preview.mp4`, `audio/mix.m4a` (superseded by `final.m4a`; no references) |
| Move to `docs/archive/` or rewrite | `script.md`, `immersive-script.md` (both describe the old renders and commands, e.g. `immersive-script.md:73`) |
| Gitignore / LFS | `*.mp4` in this folder (publish previews as release assets); `film/assets/3d/**` through LFS, or re-encode the flythrough at q85; `tools/__pycache__/` (already ignored by pattern); `ref/page.png` through LFS |
| Dead code | `#grain`, `#prog`, `#fx` (`index.html:93,118,133,136`); the `grain.png` output of `make-assets.cjs:70-83`; per-chapter `s.caps` once narration is the only caption source; duplicated `c0X_` helpers (finding 8) |
| Fix stale docs | `ref/README.md` (points at immersive-film + render.cjs); `core.js:3-6` (render.cjs, ref path); `tools/blender/README.md` (hard-coded "192 s" and start times); `tools/README.md` (two venv paths, "times read at 15c18e5") |
| Add docs | A top-level `README.md` for the film: preview (`open film/index.html`), pipeline order, where the times live (the timeline), how to add a chapter, and the golden-frame check |

## E. Ordered implementation plan

Each step is small, lands on its own, and has a pass/fail check. Steps 1–6 must not change any output pixel or audio sample.

1. **Golden harness.** Add `tools/golden.cjs` (built on `snap.cjs`): ~40 timestamps (each chapter's start + 0.5, middle, B ± 0.3, and the 3D shot middles), with hashes written to the scratch dir, plus `determinism-check.cjs`. *Check:* two runs give identical hashes, and cold equals sequential.
2. **Add `film/timeline.js`** with today's 8 chapters (`authoredAt = start`), loaded first. Change `DURATION`, `FADE`, `BOUNDS`, `SIGNS`, the FIN index, the cheer window and the SHOTS3D starts to read from it (`core.js:41`, `boot.js:40-42,242,247,258-263`). *Check:* golden frames identical.
3. **Scene shim** (A.2): `scene()` shift, render passes `t − s.shift`, caps and cite use the authored clock, `boilScene` seeds with `a0`. *Check:* golden frames identical (shift is 0); a test page with an artificial 5 s gap shows `frame(t+5) == old frame(t)` for ch04 and later.
4. **Globals:** wrap `boot.js` in an IIFE, add `check-globals.cjs`, and remove `function render` shadowing. *Check:* golden frames identical; the lint passes; a deliberate `const CX` in a scratch chapter is caught.
5. **Tools read the timeline:** add `tools/timeline.py`; `build-narration.py` and `build-sfx.py` drop their constants. *Check:* `--check` reports and `captions.js` are byte-identical; `final.wav` is bit-identical (the README says the SFX build is bit-identical).
6. **Anchor the cues:** run `anchor-cues.py` on `narration.json` and `sfx-cues.json` (after the other agent's edits land), and make `finalize.py` write `manifest.js`. *Check:* the resolved absolute times equal the old ones (the converter asserts this), and the audio is bit-identical again.
7. **Insert a placeholder chapter:** `chapters/ch03s.js` is an empty 20 s scene with a title card. Add it to the timeline and `index.html` and renumber the labels. *Check:* total = 212; golden frames for t ≥ 106 match old t − 20 except for the sign and title text; `final.wav[126:]` ≈ old `[106:]`; `coinfunnel` starts at 183 and `curtaincall` at 207.
8. **Author the Seedance 2.5 chapter** in local time, add its narration and SFX cues as `{ch:"ch03s", at}`, and rebuild the audio. *Check:* no `OVER curtain` in `build-narration --check`; snaps at 107, 116, 125.
9. **Ref path and determinism fix** (findings 4 and 5): use `../ref/page.png`, add the decode to `READY`. *Check:* no 404 in `snap.cjs`; cold equals sequential with a test `page.png`.
10. **`capture-ref.cjs`** (B.1) → `ref/page.png`, `layout.json`, `layout.js`, `roles.json`. *Check:* the section count is greater than 0; `layout.page.h` equals the `page.png` height.
11. **Geometry API** (B.2): `rectOf` / `scrollToKey`, `REF_MARKS` by role, and the ch00, ch01 and ch02 call sites. *Check:* an overlay snap at 60.5, 61.3 and 62.2 shows each mark within 20 px of its section top.
12. **`ref-compare.cjs`** (B.3), then decide whether to rebuild or retire the mock. *Check:* `ref/compare.png` and the ΔE report exist; the decision is written in `ref/README.md`.
13. **Perf P1** (CDP capture). *Check:* fps before and after on 300 frames; golden frames identical within the JPEG tolerance.
14. **Reproducibility:** `requirements.txt` (kokoro-onnx, numpy, scipy, soundfile, pinned), one venv path, and a `Makefile` with the targets `assets → ref → narration → sfx → 3d (optional, cached) → render → mux`. Each target depends on `film/timeline.js` and its inputs. *Check:* `make -n` on a clean checkout lists the whole chain, and `make render` reproduces `theater-final.mp4` frame hashes.
15. **Cleanup** (section D) and bundled CJK/mono fonts. *Check:* golden frames re-baselined once for the font change; the size of the tracked folder is reported before and after.
