#!/usr/bin/env node
/* Render the Harness Theater film to MP4 (1920×1080, animated on twos: 12 fps drawn, 24 fps file).
 *
 * Usage (from the repo root), after building the soundtrack and timeline:
 *   KOKORO_DIR=/path/to/kokoro python3 docs/video/film/build_audio.py
 *   NODE_PATH=$(npm root -g) node docs/video/tools/render-film.cjs [--fps 12] [--scale 1.5] [--from 0] [--to END] [--out docs/video/renders/film.mp4]
 *
 * Loads docs/video/film/film.html, waits for Google Fonts (fetched Node-side so a proxy CA works),
 * films FILM.frame(t) frame by frame, then muxes film/build/mix.wav with ffmpeg
 * (FFMPEG env, ffmpeg on PATH, or `pip install imageio-ffmpeg`).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const SRC = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('--fps', 12), SCALE = +arg('--scale', 1.5);
const OUT = path.resolve(arg('--out', path.join(SRC, 'renders', 'film.mp4')));

function ffmpegBin() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch {}
  return execFileSync('python3', ['-c', 'import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())']).toString().trim();
}

(async () => {
  const ff = ffmpegBin();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'film-'));
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: 'localhost,127.0.0.1' } } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: SCALE });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, async (r) => { try { await r.fulfill({ response: await r.fetch() }); } catch { await r.abort(); } });
    await page.goto('file://' + path.join(SRC, 'film', 'film.html'), { waitUntil: 'load', timeout: 90000 }).catch(() => {});
    await page.waitForFunction(() => window.FILM, null, { timeout: 60000 });
    await page.addStyleTag({ content: '.bar{display:none!important}#stage svg{max-width:none!important;width:1280px!important;height:720px!important}' });
    const fonts = await page.evaluate(async () => { await document.fonts.ready; await Promise.all(['700 20px Gaegu'].map((f) => document.fonts.load(f, 'Aa가'))); return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).join(','); });
    console.log('fonts:', fonts || 'FALLBACK');
    const total = await page.evaluate(() => FILM.total);
    const from = +arg('--from', 0), to = Math.min(total, +arg('--to', total));
    const count = Math.ceil((to - from) * FPS);
    for (let i = 0; i < count; i++) {
      await page.evaluate((t) => { document.getElementById('stage').innerHTML = FILM.frame(t); }, from + i / FPS);
      await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(5, '0')}.png`), clip: { x: 0, y: 0, width: 1280, height: 720 } });
      if (i % 120 === 0) console.log(`frame ${i}/${count}`);
    }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const audio = path.join(SRC, 'film', 'build', 'mix.wav');
    const args = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.png')];
    if (fs.existsSync(audio)) args.push('-ss', String(from), '-t', String(to - from), '-i', audio);
    args.push('-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium', '-movflags', '+faststart');
    if (fs.existsSync(audio)) args.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
    args.push(OUT);
    execFileSync(ff, args);
    console.log(`wrote ${path.relative(process.cwd(), OUT)} (${count} frames, ${(count / FPS).toFixed(1)} s)`);
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
