#!/usr/bin/env node
/* Render the 30-second Harness Theater Reel to an MP4 animatic (1080×1920, animated on twos: 12 fps drawn, 24 fps file).
 *
 * Usage (from the repo root):
 *   NODE_PATH=$(npm root -g) node docs/video/tools/render-reel.cjs [--fps 12] [--out-fps 24] [--src reels.html] [--out docs/video/renders/reel-30s.mp4]
 *
 * Needs Playwright (Chromium) and an ffmpeg binary: FFMPEG env var, `ffmpeg` on PATH,
 * or `pip install imageio-ffmpeg`. Loads docs/video/reels.html, reads window.REEL
 * ({shots, frames}), then films every frame: the per-shot camera move (push / pull / pan),
 * a 3-frame "boil" of the ink outlines, a snap-in for subtitles and hook text, and a
 * white flash on beat changes. Frames go to a temp dir, then ffmpeg encodes H.264 with a
 * silent AAC track (add the VO and music in your editor).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const SRC = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('--fps', 12);          // drawn on twos: film at 12 fps, encode at 24
const OUT_FPS = +arg('--out-fps', 24);
const OUT = path.resolve(arg('--out', path.join(SRC, 'renders', 'reel-30s.mp4')));
const PAGE = path.resolve(arg('--src', path.join(SRC, 'reels.html')));
const FONTS = 'https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Gowun+Dodum&family=IBM+Plex+Mono:wght@400;500&display=swap';
const skeleton = (body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>reel</title></head><body>${body}</body></html>`;

function ffmpegBin() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch {}
  try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())']).toString().trim(); } catch {}
  throw new Error('No ffmpeg found. Set FFMPEG, install ffmpeg, or pip install imageio-ffmpeg.');
}
async function routeFonts(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    try { await route.fulfill({ response: await route.fetch() }); } catch { await route.abort(); }
  });
}
const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

(async () => {
  const ff = ffmpegBin();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
  const frameDir = path.join(tmp, 'frames');
  fs.mkdirSync(frameDir);
  for (const f of ['theater.js', 'player.js', 'series.css']) fs.copyFileSync(path.join(SRC, f), path.join(tmp, f));
  fs.writeFileSync(path.join(tmp, 'index.html'), skeleton(fs.readFileSync(PAGE, 'utf8')));
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: 'localhost,127.0.0.1' } } : {});
  try {
    const src = await browser.newPage();
    await routeFonts(src);
    await src.goto('file://' + path.join(tmp, 'index.html'), { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await src.waitForFunction(() => window.REEL && window.REEL.frames.length, null, { timeout: 30000 });
    const { shots, frames } = await src.evaluate(() => window.REEL);
    await src.close();

    const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
    await routeFonts(page);
    fs.writeFileSync(path.join(tmp, 'stage.html'), skeleton(`<link rel="stylesheet" href="${FONTS}"><style>html,body{margin:0;background:#fff4dc;overflow:hidden}#s svg{display:block;width:540px;height:960px}#flash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none}</style><script src="theater.js"></script><script>Theater.install()</script><div id="s"></div><div id="flash"></div>`));
    await page.goto('file://' + path.join(tmp, 'stage.html'), { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);

    let n = 0;
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i], count = Math.round(s.dur * FPS), beatChange = i > 0 && shots[i - 1].beat !== s.beat;
      await page.evaluate((svg) => {
        document.getElementById('s').innerHTML = svg;
        const root = document.querySelector('#s svg'), kids = [...root.children], ci = kids.findIndex((k) => k.classList && k.classList.contains('cam'));
        window.__cam = kids[ci];
        window.__over = kids.slice(ci + 1, -1);            // hook text + subtitle strip (grain layer excluded)
        window.__ink = [...root.querySelectorAll('g[filter="url(#ink)"]')];
      }, frames[i]);
      await page.evaluate(() => document.fonts.ready);
      for (let f = 0; f < count; f++) {
        const t = count > 1 ? f / (count - 1) : 1, e = ease(t);
        let cam = 'none';
        if (s.k === 'push') cam = `scale(${1 + .08 * e})`;
        else if (s.k === 'pull') cam = `scale(${1.08 - .08 * e})`;
        else if (s.k === 'pan') cam = `scale(1.06) translateX(${14 - 28 * e}px)`;
        if (f < 3 && (s.k === 'push' || beatChange)) cam = `scale(${1.05 - .05 * (f / 3)}) ` + (cam === 'none' ? '' : cam);   // snap-in punch
        const pop = Math.min(1, f / 3);
        await page.evaluate(([cam, boil, pop, flash]) => {
          window.__cam.style.transformBox = 'view-box'; window.__cam.style.transformOrigin = '50% 50%'; window.__cam.style.transform = cam;
          window.__ink.forEach((g) => g.setAttribute('filter', boil));
          window.__over.forEach((el) => { el.style.transformBox = 'view-box'; el.style.transformOrigin = '50% 75%'; el.style.transform = `translateY(${(1 - pop) * 14}px) scale(${.94 + .06 * pop})`; el.style.opacity = String(.25 + .75 * pop); });
          document.getElementById('flash').style.opacity = String(flash);
        }, [cam, ['url(#ink)', 'url(#ink2)', 'url(#ink3)'][n % 3], pop, beatChange && f < 2 ? .55 - f * .25 : 0]);
        await page.screenshot({ path: path.join(frameDir, `f${String(n).padStart(5, '0')}.png`) });
        n++;
      }
      console.log(`${s.id} · ${count} frames`);
    }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    execFileSync(ff, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frameDir, 'f%05d.png'),
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-shortest',
      '-r', String(OUT_FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', '-c:a', 'aac', OUT]);
    console.log(`wrote ${path.relative(process.cwd(), OUT)} (${n} frames, ${(n / FPS).toFixed(1)} s)`);
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
