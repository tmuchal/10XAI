# Reference page (the creator's real site)

Every "REFERENCE · 제가 만든 페이지" window in the film (`refWindow` in `film/core.js`) shows `film/ref/page.png` when it
exists, and the example mock (`brandPage()`) when it does not. With `layout.js` next to it, the reference beats also
**aim at the real page's elements**. Without it they use the hand-tuned fractions, and the output is pixel-identical to before.

| Beat | Role | What moves |
|---|---|---|
| ch00 reveal (3.7–4.6 s) | `hook` | the window settles on the hook section |
| ch01 "the page I actually built" (34.8–39.6 authored) | `proof` | slow scroll to the proof section |
| ch02 Hook / Proof / Action (60.4–62.4 authored) | `hook`, `proof`, `action` | the page scrolls to each section; the labels and the dashed arrow land on each role's element |

## Capture the real site (one command)

```bash
cd docs/videos/higgsfield-brand-page
source tools/env.sh && node tools/capture-ref.cjs https://noainostory.higgsfield.app/ && node tools/compare-ref.cjs
```

`capture-ref.cjs` opens the site at 1440×900. It waits for network idle and web fonts, then wheel-scrolls through the
whole page so scroll-triggered animations and lazy media fire. Back at the top, it freezes animations and takes the
screenshot. If text is still invisible there (reveals that re-hide off screen), it switches automatically to a stitched
capture: overlapping viewport tiles, keeping each tile's middle band. Force a mode with `--mode full|stitch`.

It writes:

| File | |
|---|---|
| `page.png` | full-page screenshot, 1440 px wide (the film shows this) |
| `page-mobile.png` | 390 px wide screenshot, for reference only (`--no-mobile` skips it) |
| `layout.json` | page size, sections (tag/id/class, box, first heading, text sample), h1–h3, CTAs (text, href, box, style), images/videos, palette (pixels + computed styles), fonts |
| `roles.json` | **hand-editable** role map; best guess on the first run, never overwritten afterwards (`--reguess` forces it) |
| `layout.js` | `window.REF_LAYOUT` = layout + resolved roles. `core.js` loads it synchronously (works over `file://`) |

`compare-ref.cjs` re-links `roles.json` into `layout.js` and prints the resolved roles. It then writes `compare.png`:
the mock, the real page with the role boxes drawn on it (dashed = section, solid = element), and a difference overlay.
It also prints how the palette and fonts differ between the mock and the real page.

## Adjust roles.json

The best guess: **hook** = the first section with an `h1`. **proof** = the section with the most review, number or
portfolio words (후기, 리뷰, 사례, 포트폴리오, 고객, review, testimonial, …, plus `+317%`, `120건`, `★`). **action** and **cta** = the last
prominent button outside the nav bar. Check `compare.png`; if a box sits on the wrong thing, edit a role:

```json
{
  "hook":   { "section": 0 },
  "proof":  { "text": "후기" },
  "action": { "selector": "#contact" },
  "cta":    { "cta": -1 }
}
```

- `{"section": i}`: index into `layout.json` → `sections` (negative counts from the end). The element is the section's first heading.
- `{"selector": "#id" | ".class" | "tag" | "section.hero"}`: matched against the captured sections, then headings, then CTAs.
- `{"text": "후기"}`: the first heading, then CTA, then section whose text contains it.
- `{"cta": -1 | "문의"}`: a CTA by index (negative = from the end) or by text; its section is the one that contains it.
- Add `"el": { … }` to any role to override only the element that the labels and arrow target.

Then run `node tools/compare-ref.cjs` again, or `node tools/capture-ref.cjs --link`, which works offline and only rewrites `layout.js`.

## Check and commit

```bash
node tools/snap.cjs film/index.html /tmp/refcheck 4.6 38.8 60.8 61.6 62.6   # ch00 / ch01 / ch02 reference beats
```

Commit `page.png`, `layout.json`, `layout.js` and `roles.json` together, so a render never depends on the network
(`window.READY` waits for `page.png` to decode). The folder's `.gitignore` currently ignores these files: that rule
kept the stand-in test capture out of git, so remove the `film/ref/…` lines when you commit the real capture.
`page-mobile.png` and `compare.png` are optional.
