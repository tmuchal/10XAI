// Gameplay capture: headless Chromium (WebGL via SwiftShader) + the game's deterministic window.NS3 API.
//
//   node capture.mjs                     capture every gameplay shot in build/timeline.json (3 workers)
//   node capture.mjs --shots S07_fixer   only these shots
//   node capture.mjs --test              3 sample frames per shot into build/test/ (fast framing check)
//   node capture.mjs --force --workers 2 --quality high
//
// Captures ONLY the frozen snapshot in build/game/ (copied from ../index.html, ../js, ../vendor by
// build.py --only snapshot), never the live game. Frames: build/gameplay/<shot>/%05d.jpg at 1280x720 + a DONE marker.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, 'build');
const GAME = path.join(BUILD, 'game', 'index.html');
const FONTS = path.join(HERE, 'assets', 'fonts');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FORCE = args.includes('--force'), TEST = args.includes('--test');
const WIDTH = +opt('--width', 1280), HEIGHT = +opt('--height', 720);
const WORKERS = +opt('--workers', 3), QUALITY = opt('--quality', 'high');

// Per-shot direction. setup runs once after NS3.scene(); cam(u) runs before every frame (u = 0..1).
// Everything here only drives globals of the page (CAM, PL, GAME, $), the game files stay untouched.
const SHOTS = {
  S01_title: { pre: 0.5, hud: false,
    setup: `S.x0=PL.x;S.z0=PL.z;S.y0=PL.yaw;`,
    cam: `CAM.yaw=S.y0-0.42+0.62*e;CAM.pitch=-0.06+0.1*e;PL.x=S.x0+Math.sin(S.y0)*5*e;PL.z=S.z0+Math.cos(S.y0)*5*e;` },
  S02_omni: { pre: 0.5, hud: false,
    setup: `PL.h.root.visible=false;S.y0=PL.yaw;PL.x+=Math.cos(S.y0)*2.5-Math.sin(S.y0)*3;PL.z+=-Math.sin(S.y0)*2.5-Math.cos(S.y0)*3;`,
    cam: `CAM.yaw=S.y0-0.1+0.25*e;CAM.pitch=0.02-0.42*e;` },
  S03_horde: { pre: 0.6 },
  S04_raiders: { pre: 0.3, setup: `PL.z+=10;` },
  S05_street: { pre: 0.2, setup: `S.y0=CAM.yaw;`, cam: `CAM.yaw=S.y0+0.5-0.5*e;CAM.pitch=0.16-0.04*e;` },
  S06_lineup: { pre: 0.4, hud: false,
    setup: `PL.h.root.visible=false;S.x0=PL.x;S.z0=PL.z;`,
    cam: `PL.x=S.x0-2+4*u;PL.z=S.z0;CAM.yaw=0.22-0.44*u;CAM.pitch=0.1;PL.h.root.visible=false;` },
  S07_fixer: { pre: 0.2,
    setup: `const m=LOC.shelter;PL.x=m.x-5.2;PL.z=m.z+1.2;S.want=Math.atan2((m.x-9)-PL.x,(m.z+3.4)-PL.z);PL.yaw=S.want;S.open=false;`,
    cam: `CAM.yaw=S.want+0.35-0.3*e;CAM.pitch=0.2;PL.yaw=S.want;if(u>0.58&&!S.open){S.open=true;openBoard();GAME.paused=false;}` },
  S08_drive: { pre: 0.8, cam: `CAM.lastLook=GAME.t;CAM.pitch=0.17;` },
  S09_build: { pre: 0.3, setup: `S.y0=CAM.yaw;`, cam: `CAM.yaw=S.y0-0.25+0.5*e;` },
  S10_wave: { pre: 1.6 },
  S11_drive2: { pre: 2.2, hud: false, cam: `CAM.lastLook=GAME.t;if(PL.inCar){CAM.yaw=PL.inCar.yaw+0.9-0.6*e;}CAM.pitch=0.08;` },
  S12_viaduct: { pre: 1.8, hud: false },
  S13_forest: { pre: 0.6, setup: `const n=ACT.nests[0];if(n){PL.yaw=Math.atan2(n.g.position.x-PL.x,n.g.position.z-PL.z);CAM.yaw=PL.yaw;}S.y0=CAM.yaw;`, cam: `CAM.yaw=S.y0;CAM.pitch=0.1;` },
  S14_tower: { pre: 0.3, setup: `S.y0=PL.yaw;PL.x+=Math.cos(S.y0)*2.5;PL.z+=-Math.sin(S.y0)*2.5;`, cam: `KEYS.KeyW=true;CAM.yaw=S.y0;CAM.pitch=-0.12-0.3*e;` },
  S15_wave2: { pre: 3.2 },
};

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* global install */ }
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const FONT_CSS = `
@font-face{font-family:'Black Han Sans';src:url(https://fonts.gstatic.com/local/BlackHanSans-Regular.ttf)}
@font-face{font-family:'IBM Plex Sans KR';font-weight:400;src:url(https://fonts.gstatic.com/local/IBMPlexSansKR-Regular.ttf)}
@font-face{font-family:'IBM Plex Sans KR';font-weight:600;src:url(https://fonts.gstatic.com/local/IBMPlexSansKR-SemiBold.ttf)}
@font-face{font-family:'IBM Plex Mono';font-weight:500;src:url(https://fonts.gstatic.com/local/IBMPlexMono-Medium.ttf)}
@font-face{font-family:'IBM Plex Mono';font-weight:600;src:url(https://fonts.gstatic.com/local/IBMPlexMono-SemiBold.ttf)}`;
// capture-only CSS: dialog boxes/hints/toasts would sit under the trailer subtitles; build bar moves up.
const CAPTURE_CSS = `#msg,#hint,#toasts{display:none!important}#buildBar{bottom:150px!important}`;
// seeded Math.random so a re-run gives the same footage
const SEED_JS = `(()=>{let a=20771234;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();`;

async function openGame(browser) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.addInitScript(SEED_JS);
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS }));
  await page.route('https://fonts.gstatic.com/**', r => {
    const f = path.join(FONTS, path.basename(new URL(r.request().url()).pathname));
    return fs.existsSync(f) ? r.fulfill({ status: 200, contentType: 'font/ttf', body: fs.readFileSync(f) }) : r.fulfill({ status: 404, body: '' });
  });
  await page.goto('file://' + GAME, { waitUntil: 'load', timeout: 60000 });
  await page.addStyleTag({ content: CAPTURE_CSS });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.evaluate(q => NS3.init(q), QUALITY);
  return page;
}

async function shoot(page, seg, dir, frames) {
  const sh = SHOTS[seg.name] || {};
  await page.evaluate(([scene, hud, setup, pre]) => {
    // reset input left over from an earlier auto-fire shot on this page (RMB = aim zoom)
    MOUSE.rmb = MOUSE.lmb = false; for (const k in KEYS) KEYS[k] = false; CAM.aim = 0;
    NS3.scene(scene);
    window.__S = {};
    // eslint-disable-next-line no-new-func
    new Function('S', setup || '')(window.__S);
    if (pre > 0) NS3.advance(pre);
    if (hud === false) $('hud').hidden = true;
  }, [seg.scene, sh.hud, sh.setup, sh.pre || 0]);
  const n = seg.capture;
  let last = 0;
  const t0 = Date.now();
  for (const i of frames) {
    const steps = i - last; last = i;
    await page.evaluate(([cam, i, n, steps, hud]) => {
      const S = window.__S, u = (i - 1) / Math.max(1, n - 1), e = u * u * (3 - 2 * u);
      const f = new Function('S', 'u', 'e', cam || '');
      // in --test mode we jump several frames: tick the sim, render once
      for (let k = 0; k < steps; k++) { f(S, u, e); if (k < steps - 1) for (let j = 0; j < 2; j++) tick(1 / 60); }
      NS3.advance(1 / 30);
      if (hud === false) $('hud').hidden = true;
      const c = document.querySelector('canvas'), g = c.getContext('webgl2') || c.getContext('webgl');
      g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4)); // wait for the GPU before the screenshot
    }, [sh.cam, i, n, steps, sh.hud]);
    await page.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 94 });
    if (i % 30 === 0) console.log(`  ${seg.name}: ${i}/${n} (${((Date.now() - t0) / frames.indexOf(i) / 1000).toFixed(2)} s/frame)`);
  }
}

const tl = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
let segs = tl.segments.filter(s => s.kind === 'gameplay');
if (opt('--shots')) { const want = opt('--shots').split(','); segs = segs.filter(s => want.includes(s.name)); }
const doneFile = s => path.join(BUILD, 'gameplay', s.name, 'DONE');
if (!TEST && !FORCE) segs = segs.filter(s => {
  const ok = fs.existsSync(doneFile(s)) && fs.readFileSync(doneFile(s), 'utf8').trim() === String(s.capture);
  if (ok) console.log(`skip ${s.name} (done)`);
  return !ok;
});
// longest shots first, spread over the workers
segs.sort((a, b) => b.capture - a.capture);
const queues = Array.from({ length: WORKERS }, () => ({ load: 0, segs: [] }));
for (const s of segs) { const q = queues.reduce((a, b) => (a.load <= b.load ? a : b)); q.segs.push(s); q.load += TEST ? 1 : s.capture; }

const pw = loadPlaywright();
const launchArgs = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
async function launch() {
  for (const exe of ['/opt/pw-browsers/chromium', undefined]) {
    try { return await pw.chromium.launch({ headless: true, args: launchArgs, ...(exe && fs.existsSync(exe) ? { executablePath: exe } : {}) }); }
    catch (e) { console.log('launch failed', exe, e.message.split('\n')[0]); }
  }
  throw new Error('no chromium');
}

const T0 = Date.now();
await Promise.all(queues.filter(q => q.segs.length).map(async (q, w) => {
  const browser = await launch();
  const page = await openGame(browser);
  for (const seg of q.segs) {
    const dir = path.join(BUILD, TEST ? 'test' : 'gameplay', seg.name);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    const n = seg.capture;
    const frames = TEST ? [1, Math.round(n / 2), n] : Array.from({ length: n }, (_, i) => i + 1);
    console.log(`[w${w}] ${seg.name} <- NS3.scene('${seg.scene}') ${TEST ? 'test' : n + ' frames'}`);
    await shoot(page, seg, dir, frames);
    if (!TEST) fs.writeFileSync(path.join(dir, 'DONE'), String(n));
    console.log(`[w${w}] ${seg.name} done, ${((Date.now() - T0) / 60000).toFixed(1)} min elapsed`);
  }
  await browser.close();
}));
console.log('capture done in', ((Date.now() - T0) / 60000).toFixed(1), 'min');
