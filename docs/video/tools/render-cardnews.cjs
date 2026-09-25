#!/usr/bin/env node
/* Render the Harness Theater card-news carousel to PNG.
 *
 * Usage (from the repo root):
 *   NODE_PATH=$(npm root -g) node docs/video/tools/render-cardnews.cjs
 *
 * Needs Playwright with Chromium (npm i -g playwright && npx playwright install chromium).
 * Loads docs/video/cardnews.html inside a minimal HTML skeleton (the page ships without
 * <html>/<head>/<body>), reads window.CARD_SLIDES, then screenshots each slide alone on a
 * 540×675 page at deviceScaleFactor 2 → docs/video/cardnews/slide-01.png … slide-10.png
 * (1080×1350 each). Fonts come from Google Fonts; the script reports whether they loaded.
 * If HTTPS_PROXY is set, Chromium is launched with that proxy; font requests are fetched Node-side.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const SRC = path.resolve(__dirname, '..');
const OUT = path.join(SRC, 'cardnews');
const FONTS = 'https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Gowun+Dodum&family=IBM+Plex+Mono:wght@400;500&display=swap';
const FONT_CHECKS = ['700 20px Gaegu', '400 20px "Gowun Dodum"', '500 20px "IBM Plex Mono"'];
const FAMILIES = ['Gaegu', 'Gowun Dodum', 'IBM Plex Mono'];

const skeleton = (body, title) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body>${body}</body></html>`;

async function waitFonts(page) {
  return page.evaluate(async ([checks, fams]) => {
    await Promise.all(checks.map((c) => document.fonts.load(c, 'Aa가나').catch(() => null)));
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 400));
    // document.fonts.check() is true when no face is registered at all, so count loaded faces instead.
    const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, ''));
    return fams.map((f) => [f, loaded.includes(f)]);
  }, [FONT_CHECKS, FAMILIES]);
}

// Fetch Google Fonts on the Node side (route.fetch honours NODE_EXTRA_CA_CERTS and the proxy),
// so fonts load even where Chromium's own cert store lacks a corporate or sandbox proxy CA.
async function routeFonts(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    try { await route.fulfill({ response: await route.fetch() }); } catch (e) { console.warn('font fetch:', e.message); await route.abort(); }
  });
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cardnews-'));
  for (const f of ['theater.js', 'series.css']) fs.copyFileSync(path.join(SRC, f), path.join(tmp, f));
  fs.writeFileSync(path.join(tmp, 'index.html'), skeleton(fs.readFileSync(path.join(SRC, 'cardnews.html'), 'utf8'), 'Harness Theater Cards'));
  fs.mkdirSync(OUT, { recursive: true });

  // Chromium ignores HTTPS_PROXY unless told; pass it through so Google Fonts can load behind a proxy.
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: 'localhost,127.0.0.1' } } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await routeFonts(page);
    await page.goto('file://' + path.join(tmp, 'index.html'), { waitUntil: 'load', timeout: 60000 }).catch((e) => console.warn('page load:', e.message));
    await page.waitForFunction(() => Array.isArray(window.CARD_SLIDES) && window.CARD_SLIDES.length === 10, null, { timeout: 30000 });
    const slides = await page.evaluate(() => window.CARD_SLIDES);
    await page.close();

    const shot = await browser.newPage({ viewport: { width: 540, height: 675 }, deviceScaleFactor: 2 });
    await routeFonts(shot);
    let fontReport = null;
    for (let i = 0; i < slides.length; i++) {
      const body = `<link rel="stylesheet" href="${FONTS}"><style>html,body{margin:0;padding:0;background:#fff4dc;overflow:hidden}svg.slide{display:block;width:540px;height:675px}</style>`
        + `<script src="theater.js"></script><script>Theater.install()</script>`
        + slides[i].replace('<svg ', '<svg class="slide" width="540" height="675" ');
      const file = path.join(tmp, `slide-${i + 1}.html`);
      fs.writeFileSync(file, skeleton(body, `slide ${i + 1}`));
      await shot.goto('file://' + file, { waitUntil: 'load', timeout: 60000 }).catch((e) => console.warn(`slide ${i + 1} load:`, e.message));
      const fr = await waitFonts(shot);
      if (!fontReport) fontReport = fr;
      const out = path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.png`);
      await shot.screenshot({ path: out, clip: { x: 0, y: 0, width: 540, height: 675 } });
      console.log('wrote', path.relative(process.cwd(), out));
    }
    console.log('fonts:', fontReport.map(([c, ok]) => `${c} ${ok ? 'loaded' : 'FALLBACK'}`).join(' · '));
    if (fontReport.some(([, ok]) => !ok)) console.log('Some web fonts did not load. Re-run on a machine that can reach fonts.googleapis.com for final PNGs.');
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
