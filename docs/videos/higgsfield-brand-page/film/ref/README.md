# Reference screenshot

Put a **full-page screenshot** of your site here as `film/ref/page.png` (1440px wide works best).
The film (`film/index.html`) shows it in every "REFERENCE · 제가 만든 페이지" window (`refWindow` in `film/core.js`).
Without it, an example mockup is shown.

`window.READY` waits until the image has loaded and decoded (or failed to load), so every render worker
decides mock vs. real page before its first frame. Commit `page.png` with the film so a render never depends
on the network.

Re-render after adding it (see the folder README):

```bash
source tools/env.sh
node tools/snap.cjs film/index.html /tmp/refcheck 60.5 61.3 62.2   # spot-check the reference windows
node tools/render-parallel.cjs film/index.html theater-final.mp4 30 4 audio/final.wav   # full render
```
