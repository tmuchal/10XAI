// seq.js — plays the pre-rendered Blender image sequences (film/assets/3d/<name>/0001.png …)
// inside the deterministic HTML timeline.
//
// USAGE (boot.js / a chapter):
//   <script src="seq.js"></script>                      // before boot.js
//   const M = await fetch('assets/3d/manifest.json').then(r => r.json());   // or inline the array
//   const fly = SEQ.attach(stageEl, M.find(e => e.name === 'flythrough'), { fadeOut: .35 });
//   // inside window.render(t):
//   fly.update(t);                                      // t = film seconds
//   await Promise.all(window.__pending || []);          // renderer waits for decoded frames
//
//   SEQ.attach(parentEl, entry, opts) -> player
//     entry: manifest row {name, start, frames, fps, alpha, ext, x, y, w, h}
//     opts (all optional):
//       base     : folder that holds <name>/ (default 'assets/3d/')
//       start    : override entry.start (film seconds)
//       x,y,w,h  : override placement (px in the 1920×1080 stage)
//       fadeIn   : seconds of opacity ramp at the start   (default 0)
//       fadeOut  : seconds of opacity ramp at the end     (default 0)
//       holdLast : seconds to keep showing the last frame after the sequence ends (default 0)
//       rate     : playback speed multiplier (default 1)
//       z        : z-index (default 5)
//       className: extra class on the <img>
//   player.update(t)  -> sets the right frame (hidden outside its window); pushes img.decode()
//                        into window.__pending whenever the frame changes.
//   player.el         -> the <img>
//   player.preload()  -> warms the browser cache for every frame (returns a Promise)
//   player.frameAt(t) -> frame index (0-based) or -1 when not visible
(function () {
  const pad = n => String(n).padStart(4, '0');
  function attach(parentEl, entry, opts = {}) {
    if (!entry) throw new Error('SEQ.attach: missing manifest entry');
    const base = opts.base || 'assets/3d/';
    const ext = entry.ext || 'png';
    const fps = entry.fps || 30, frames = entry.frames;
    const start = opts.start != null ? opts.start : entry.start;
    const rate = opts.rate || 1;
    const dur = frames / fps / rate;
    const hold = opts.holdLast || 0;
    const fadeIn = opts.fadeIn || 0, fadeOut = opts.fadeOut || 0;
    const X = opts.x != null ? opts.x : entry.x, Y = opts.y != null ? opts.y : entry.y;
    const W = opts.w != null ? opts.w : entry.w, H = opts.h != null ? opts.h : entry.h;
    const url = i => `${base}${entry.name}/${pad(i + 1)}.${ext}`;

    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'sync';
    img.className = 'seq3d' + (opts.className ? ' ' + opts.className : '');
    Object.assign(img.style, {
      position: 'absolute', left: X + 'px', top: Y + 'px', width: W + 'px', height: H + 'px',
      display: 'none', pointerEvents: 'none', zIndex: String(opts.z != null ? opts.z : 5),
      objectFit: 'contain', willChange: 'opacity',
    });
    parentEl.appendChild(img);

    let cur = -1;
    const frameAt = t => {
      const lt = t - start;
      if (lt < 0 || lt >= dur + hold) return -1;
      return Math.min(frames - 1, Math.floor(lt * fps * rate + 1e-6));
    };
    function update(t) {
      const i = frameAt(t);
      if (i < 0) { img.style.display = 'none'; return; }
      const lt = t - start, end = dur + hold;
      let op = 1;
      if (fadeIn > 0) op = Math.min(op, lt / fadeIn);
      if (fadeOut > 0) op = Math.min(op, (end - lt) / fadeOut);
      img.style.opacity = String(Math.max(0, Math.min(1, op)));
      img.style.display = 'block';
      if (i !== cur) {
        cur = i;
        img.src = url(i);
        const pend = (window.__pending = window.__pending || []);
        if (img.decode) pend.push(img.decode().catch(() => {}));
      }
    }
    // preload(): fetch every frame into the memory cache (encoded bytes only; the per-frame
    // img.decode() in update() does the actual decode, so a 90-frame 1080p shot costs ~its file size,
    // not 90 decoded bitmaps). Refs are kept until release() so the cache entries stay warm.
    let cache = null, cacheP = null;
    function preload() {
      if (cacheP) return cacheP;
      cache = [];
      const ps = [];
      for (let i = 0; i < frames; i++) {
        const im = new Image(); cache.push(im);
        ps.push(new Promise(res => { im.onload = im.onerror = res; }));
        im.src = url(i);
      }
      return (cacheP = Promise.all(ps));
    }
    function release() { cache = null; cacheP = null; }
    // decodeFirst(): decode frame 0 (used by READY so the first visible frame is never blank)
    function decodeFirst() { const im = new Image(); im.src = url(0); return im.decode ? im.decode().catch(() => {}) : Promise.resolve(); }
    return { el: img, update, preload, release, decodeFirst, frameAt, entry, start, duration: dur, get warm() { return !!cacheP; } };
  }
  window.SEQ = { attach };
})();
