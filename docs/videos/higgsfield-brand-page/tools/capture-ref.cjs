// Capture the creator's real site as the film's reference page.
//   source tools/env.sh && node tools/capture-ref.cjs [url] [--out film/ref] [--mode auto|full|stitch] [--no-mobile]
//   node tools/capture-ref.cjs --link        re-resolve roles.json -> layout.js only (no browser, no network)
// Default url: https://noainostory.higgsfield.app/
//
// 1. opens the page at 1440x900 (deviceScaleFactor 1), waits for network idle + fonts
// 2. scrolls through it slowly (wheel steps, so scroll- and wheel-driven reveals and lazy media fire), back to top
// 3. freezes animations/transitions/videos, then a full-page screenshot -> page.png. Mode "auto" first counts text
//    that is still invisible (reveal-on-scroll that re-hides off screen); if it finds some, it switches to "stitch":
//    one viewport tile per 900 px, each shot after scrolling there, stitched into page.png (fixed/sticky bars are
//    kept only in the first tile).
// 4. extracts the DOM layout at scroll 0 -> layout.json; writes roles.json (best guess) if there is none yet;
//    resolves roles -> layout.js (window.REF_LAYOUT). Optional 390 px wide page-mobile.png.
const path = require("path"), fs = require("fs");
const lib = require("./ref-lib.cjs");

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--out", "--mode"].includes(argv[i - 1])));
const URL = pos[0] || "https://noainostory.higgsfield.app/";
const OUT = path.resolve(opt("--out", lib.REF_DIR)), MODE = opt("--mode", "auto");
const VW = 1440, VH = 900, STEP = 320;

const FREEZE = `*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important;
  scroll-behavior:auto!important}html{scroll-behavior:auto!important}`;

async function settle(p, ms = 15000) {
  await p.waitForLoadState("networkidle", { timeout: ms }).catch(() => console.log("  (network never went idle; continuing)"));
  await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
}

// wheel down in small steps until the bottom stops moving (smooth-scroll libraries lag behind the wheel)
async function scrollThrough(p) {
  await p.mouse.move(VW / 2, VH / 2);
  let last = -1, still = 0;
  for (let i = 0; i < 400 && still < 4; i++) {
    await p.mouse.wheel(0, STEP); await p.waitForTimeout(140);
    const y = await p.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 2 ? -2 : scrollY);
    if (y === -2 || y === last) still++; else still = 0; last = y;
  }
  await p.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach(i => { i.loading = "eager"; }));
  await p.evaluate(() => Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); }))));
  await settle(p, 8000);
  await p.waitForTimeout(600);
}

async function toTop(p) {
  for (let i = 0; i < 60 && await p.evaluate(() => scrollY) > 0; i++) { await p.mouse.wheel(0, -2000); await p.waitForTimeout(60); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(700);
}

const freeze = p => p.evaluate(css => {
  const s = document.createElement("style"); s.id = "__capfreeze"; s.textContent = css; document.head.appendChild(s);
  document.querySelectorAll("video").forEach(v => { try { v.pause(); } catch (e) {} });
  document.getAnimations && document.getAnimations().forEach(a => { try { a.pause(); } catch (e) {} });
}, FREEZE);

// text that should be visible but is not (opacity ~0 or pushed off by a reveal transform), below the first screen
const hiddenText = p => p.evaluate(() => [...document.querySelectorAll("h1,h2,h3,p,li,a,button")].filter(e => {
  const r = e.getBoundingClientRect(); if (r.top + scrollY < innerHeight || !e.textContent.trim() || r.width === 0) return false;
  let o = 1; for (let q = e; q && q !== document.body; q = q.parentElement) o *= +getComputedStyle(q).opacity;
  return o < 0.1 && getComputedStyle(e).visibility !== "hidden";
}).length);

async function stitch(p, out) {
  const H = await p.evaluate(() => document.documentElement.scrollHeight), tiles = [];
  for (let y = 0; y < H; y += VH) {
    await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(500);
    const sy = await p.evaluate(() => scrollY);                         // last tile: the browser clamps scrollY
    tiles.push({ y: sy, png: (await p.screenshot()).toString("base64") });
    if (y === 0) await p.evaluate(() => [...document.querySelectorAll("body *")].forEach(e => {   // bars once only
      const ps = getComputedStyle(e).position; if (ps === "fixed" || ps === "sticky") e.style.visibility = "hidden"; }));
  }
  await p.evaluate(() => [...document.querySelectorAll("body *")].forEach(e => { if (e.style.visibility === "hidden") e.style.visibility = ""; }));
  const b64 = await p.evaluate(async ({ tiles, W, H }) => {
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    for (const t of tiles) { const i = new Image(); i.src = "data:image/png;base64," + t.png; await i.decode(); g.drawImage(i, 0, t.y); }
    return c.toDataURL("image/png").split(",")[1];
  }, { tiles, W: VW, H });
  fs.writeFileSync(out, Buffer.from(b64, "base64"));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (argv.includes("--link")) { console.log("roles (re-linked):"); lib.printRoles(lib.link(OUT)); return; }
  const { chromium } = require("playwright");
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, locale: "ko-KR", reducedMotion: "no-preference" });
  const p = await ctx.newPage();
  p.on("pageerror", e => console.log("  pageerror:", e.message.slice(0, 120)));
  console.log(`capture ${URL} -> ${path.relative(process.cwd(), OUT) || "."}`);
  const t0 = Date.now();
  const res = await p.goto(URL, { waitUntil: "load", timeout: 60000 });
  if (!res || !res.ok()) console.log(`  warning: HTTP ${res ? res.status() : "no response"}`);
  await settle(p);
  await scrollThrough(p);
  await toTop(p);
  await freeze(p); await p.waitForTimeout(300);
  const hidden = await hiddenText(p);
  const mode = MODE === "auto" ? (hidden > 3 ? "stitch" : "full") : MODE;
  const pagePng = path.join(OUT, "page.png");
  if (mode === "stitch") await stitch(p, pagePng);
  else await p.screenshot({ path: pagePng, fullPage: true });
  console.log(`  page.png  (${mode}${MODE === "auto" ? `, ${hidden} hidden text blocks at top` : ""})`);

  const layout = await p.evaluate(lib.extractLayout);
  layout.url = URL; layout.capturedAt = new Date().toISOString(); layout.viewport = { w: VW, h: VH }; layout.mode = mode;
  const png = fs.readFileSync(pagePng);
  layout.page.png = { w: png.readUInt32BE(16), h: png.readUInt32BE(20) };
  if (layout.page.png.w !== layout.page.w) console.log(`  note: page.png is ${layout.page.png.w} px wide, layout ${layout.page.w} (film scales by width)`);
  layout.page.h = layout.page.png.h;   // the film scrolls the image, so its height is authoritative
  const tool = await ctx.newPage(); layout.style.pixels = await lib.pixelPalette(tool, png); await tool.close();
  fs.writeFileSync(path.join(OUT, "layout.json"), JSON.stringify(layout, null, 1));
  console.log(`  layout.json  ${layout.page.w}x${layout.page.h}, ${layout.sections.length} sections (${layout.sectionMode}), ` +
    `${layout.headings.length} headings, ${layout.ctas.length} CTAs, ${layout.media.length} media`);

  const rf = path.join(OUT, "roles.json");
  if (!fs.existsSync(rf) || argv.includes("--reguess")) {
    fs.writeFileSync(rf, JSON.stringify({ _help: lib.ROLES_HELP, ...lib.guessRoles(layout) }, null, 2) + "\n");
    console.log("  roles.json  (best guess; edit it, then node tools/compare-ref.cjs)");
  } else console.log("  roles.json  kept (hand-edited; --reguess to overwrite)");
  lib.printRoles(lib.link(OUT));
  console.log("  layout.js");

  if (!argv.includes("--no-mobile")) {
    const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "ko-KR" });
    const mp = await m.newPage();
    try {
      await mp.goto(URL, { waitUntil: "load", timeout: 60000 }); await settle(mp, 10000);
      for (let y = 0, H = await mp.evaluate(() => document.documentElement.scrollHeight); y < H; y += 400) { await mp.evaluate(y => scrollTo(0, y), y); await mp.waitForTimeout(120); }
      await mp.evaluate(() => scrollTo(0, 0)); await mp.waitForTimeout(500); await freeze(mp);
      await mp.screenshot({ path: path.join(OUT, "page-mobile.png"), fullPage: true }); console.log("  page-mobile.png");
    } catch (e) { console.log("  mobile capture failed:", e.message.slice(0, 100)); }
    await m.close();
  }
  await b.close();
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})().catch(e => { console.error("capture-ref failed:", e.message); process.exit(1); });
