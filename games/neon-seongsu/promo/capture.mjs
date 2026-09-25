// Stage 6: deterministic gameplay capture with Playwright.
//
//   node promo/capture.mjs [--scenes drive,chase] [--force] [--width 1920 --height 1080]
//
// Reads build/timeline.json for the gameplay segments and their frame counts, opens the game from
// file://, and for each scene calls window.NS.scene(name) then NS.advance(1/30) + one screenshot per
// frame into build/gameplay/<scene>/%05d.png. If the game has no window.NS (older build), it falls
// back to a real-time capture: click #btnStart, drive with the keyboard, screenshot every ~33 ms.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.resolve(HERE, '..', 'index.html');
const BUILD = path.join(HERE, 'build');
const FONTS = path.join(HERE, 'assets', 'fonts');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* fall through to the global install */ }
  const root = execSync('npm root -g').toString().trim();
  return require(path.join(root, 'playwright'));
}

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FORCE = args.includes('--force');
const WIDTH = +opt('--width', 1920), HEIGHT = +opt('--height', 1080);
const FPS = 30;

const tl = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
// frames needed per scene (+ margin so the assembler can trim)
const need = {};
for (const s of tl.segments) if (s.kind === 'gameplay') need[s.name] = Math.max(need[s.name] || 0, s.frames + 12);
// seconds to simulate (without screenshots) before recording, so each clip opens on action
const PREROLL = { title: 0.0, drive: 0.4, chase: 0.6, drones: 0.8, switch: 0.0, phone: 0.0, rob: 0.2, heist: 0.5, race: 0.6, forest: 0.3 };
let scenes = Object.keys(need);
if (opt('--scenes')) scenes = opt('--scenes').split(',');
if (opt('--frames')) for (const k of scenes) need[k] = +opt('--frames');

// Serve the Google Fonts the game asks for from the local TTFs (fonts.googleapis.com may be blocked,
// and the capture must show real Black Han Sans / IBM Plex, not a fallback).
const FONT_CSS = `
@font-face{font-family:'Black Han Sans';src:url(https://fonts.gstatic.com/local/BlackHanSans-Regular.ttf)}
@font-face{font-family:'IBM Plex Sans KR';font-weight:400;src:url(https://fonts.gstatic.com/local/IBMPlexSansKR-Regular.ttf)}
@font-face{font-family:'IBM Plex Sans KR';font-weight:600;src:url(https://fonts.gstatic.com/local/IBMPlexSansKR-SemiBold.ttf)}
@font-face{font-family:'IBM Plex Mono';font-weight:500;src:url(https://fonts.gstatic.com/local/IBMPlexMono-Medium.ttf)}
@font-face{font-family:'IBM Plex Mono';font-weight:600;src:url(https://fonts.gstatic.com/local/IBMPlexMono-SemiBold.ttf)}`;

async function setupRoutes(page) {
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS }));
  await page.route('https://fonts.gstatic.com/**', r => {
    const f = path.join(FONTS, path.basename(new URL(r.request().url()).pathname));
    if (fs.existsSync(f)) return r.fulfill({ status: 200, contentType: 'font/ttf', body: fs.readFileSync(f) });
    return r.fulfill({ status: 404, body: '' });
  });
}

async function launch(pw) {
  const o = { headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-vsync'] };
  try { return await pw.chromium.launch(o); } catch (e) {
    console.log('default chromium failed, trying /opt/pw-browsers/chromium:', e.message.split('\n')[0]);
    const cands = ['/opt/pw-browsers/chromium', ...fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`)];
    for (const c of cands) {
      try { if (fs.existsSync(c) && fs.statSync(c).isFile()) return await pw.chromium.launch({ ...o, executablePath: c }); } catch (e2) { /* next */ }
    }
    throw e;
  }
}

function outDir(scene) {
  const d = path.join(BUILD, 'gameplay', scene);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function done(scene, n) {
  const d = path.join(BUILD, 'gameplay', scene);
  return fs.existsSync(path.join(d, String(n).padStart(5, '0') + '.png')) && fs.existsSync(path.join(d, 'DONE'));
}

async function captureNS(page, scene, use, n) {
  const d = outDir(scene);
  for (const f of fs.readdirSync(d)) fs.unlinkSync(path.join(d, f));
  const ok = await page.evaluate(s => window.NS.scene(s), use);
  const pre = PREROLL[use] || 0;
  if (pre > 0) await page.evaluate(p => window.NS.advance(p), pre);
  const t0 = Date.now();
  for (let i = 1; i <= n; i++) {
    await page.evaluate(() => window.NS.advance(1 / 30));
    await page.screenshot({ path: path.join(d, String(i).padStart(5, '0') + '.png'), type: 'png' });
    if (i % 60 === 0) console.log(`  ${scene}: ${i}/${n} (${((Date.now() - t0) / i).toFixed(0)} ms/frame)`);
  }
  fs.writeFileSync(path.join(d, 'DONE'), `ns ${n} ${ok}\n`);
}

// ---- fallback: real-time capture of the plain game --------------------------------------------
async function captureRealtime(page, scene, n) {
  const d = outDir(scene);
  for (const f of fs.readdirSync(d)) fs.unlinkSync(path.join(d, f));
  const btn = await page.$('#btnStart');
  if (btn && await btn.isVisible()) await btn.click();
  await page.waitForTimeout(600);
  const k = page.keyboard;
  await k.press('KeyF'); // hop into the parked car next to the spawn point
  await page.waitForTimeout(300);
  await k.down('KeyW');
  const t0 = Date.now();
  let steer = null;
  for (let i = 1; i <= n; i++) {
    const t = (Date.now() - t0) / 1000;
    const want = Math.sin(t * 0.9 + scene.length) > 0.55 ? 'KeyD' : Math.sin(t * 0.9 + scene.length) < -0.7 ? 'KeyA' : null;
    if (want !== steer) { if (steer) await k.up(steer); if (want) await k.down(want); steer = want; }
    if (scene === 'drones' && i % 45 === 0) await k.press('KeyQ');
    const next = t0 + i * (1000 / FPS);
    await page.screenshot({ path: path.join(d, String(i).padStart(5, '0') + '.png'), type: 'png' });
    const wait = next - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
  }
  if (steer) await k.up(steer);
  await k.up('KeyW');
  fs.writeFileSync(path.join(d, 'DONE'), `realtime ${n}\n`);
}

const pw = loadPlaywright();
const browser = await launch(pw);
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
let page = await ctx.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
await setupRoutes(page);
const url = 'file://' + GAME;
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(800);
const hasNS = await page.evaluate(() => !!(window.NS && window.NS.scene && window.NS.advance));
const available = hasNS ? await page.evaluate(() => window.NS.scenes || []) : [];
console.log(`game: ${url}\nNS API: ${hasNS ? 'yes, scenes=' + available.join(',') : 'NO -> real-time fallback'}`);
for (const scene of scenes) {
  const n = need[scene] || 150;
  if (!FORCE && done(scene, n)) { console.log(`skip ${scene} (${n} frames exist)`); continue; }
  const use = hasNS && available.includes(scene) ? scene : 'drive';
  if (use !== scene) console.log(`scene ${scene} not in NS.scenes, degrading to drive`);
  console.log(`capture ${scene} (${use}) ${n} frames`);
  if (hasNS) await captureNS(page, scene, use, n);
  else {
    // fresh page per scene so every take starts from the title screen
    await page.close();
    page = await ctx.newPage();
    await setupRoutes(page);
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    await captureRealtime(page, scene, n);
  }
}
await browser.close();
console.log('capture done');
