// Compare the film's brand-page mock (brandPage() in film/core.js) with the captured real page.
//   source tools/env.sh && node tools/compare-ref.cjs [--out film/ref]
// Needs film/ref/page.png + layout.json (tools/capture-ref.cjs). It:
//   1. re-links roles.json -> layout.js (so edits to roles.json take effect; prints the resolved roles)
//   2. renders the mock at 1440 px wide, straight from core.js
//   3. writes compare.png: [mock | real page with the hook/proof/action/cta boxes | difference overlay]
//   4. prints the palette (pixels + computed styles) and font differences, to update or retire the mock
const path = require("path"), fs = require("fs");
const lib = require("./ref-lib.cjs");
const argv = process.argv.slice(2), oi = argv.indexOf("--out");
const OUT = path.resolve(oi >= 0 ? argv[oi + 1] : lib.REF_DIR);
const FILM = path.join(__dirname, "..", "film", "index.html");
const COL = 480, ROLE_COL = { hook: "#e8a317", proof: "#e0607e", action: "#2f9e5a", cta: "#3e6fd8" };

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => Math.round(Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i])));
const fam = f => String(f || "").split(",")[0].replace(/["']/g, "").trim();

(async () => {
  for (const f of ["page.png", "layout.json"]) if (!fs.existsSync(path.join(OUT, f))) {
    console.error(`missing ${path.join(OUT, f)}: run node tools/capture-ref.cjs <url> first`); process.exit(1); }
  const roles = lib.link(OUT);
  console.log("roles (roles.json -> layout.js):"); lib.printRoles(roles);
  const L = lib.readJSON(path.join(OUT, "layout.json")), realPng = fs.readFileSync(path.join(OUT, "page.png"));

  const { chromium } = require("playwright");
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  // the mock, as the film builds it (fonts, CSS vars and the watercolour films come from index.html + core.js)
  await p.goto("file://" + FILM + "?render"); await p.evaluate(() => window.READY || null);
  await p.evaluate(() => {
    document.getElementById("stage").remove();
    const s = document.createElement("style");
    s.textContent = "html,body{width:1440px!important;height:auto!important;overflow:visible!important;background:#fff!important}";
    document.head.appendChild(s);
    const pg = brandPage(); pg.style.position = "relative"; pg.update(10); document.body.appendChild(pg); window.__mock = pg;
  });
  await p.evaluate(() => document.fonts.ready);
  const mockH = await p.evaluate(() => window.__mock.offsetHeight);
  const mockPng = await p.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 1440, height: mockH } });
  const mockL = await p.evaluate(lib.extractLayout);
  mockL.style.pixels = await lib.pixelPalette(p, mockPng);

  // compare.png
  const sheet = await b.newPage({ viewport: { width: COL * 3 + 80, height: 800 }, deviceScaleFactor: 1 });
  await sheet.setContent("<body style='margin:0;background:#fff'></body>");
  const b64 = await sheet.evaluate(async ({ mock, real, L, roles, COL, ROLE_COL }) => {
    const load = async s => { const i = new Image(); i.src = "data:image/png;base64," + s; await i.decode(); return i; };
    const [m, r] = [await load(mock), await load(real)];
    const k = COL / 1440, mh = m.naturalHeight * COL / m.naturalWidth, rh = r.naturalHeight * COL / r.naturalWidth;
    const top = 56, H = Math.ceil(Math.max(mh, rh)) + top + 20, W = COL * 3 + 80;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, W, H);
    g.font = "bold 20px sans-serif"; g.fillStyle = "#222";
    const x0 = 20, x1 = 40 + COL, x2 = 60 + COL * 2;
    g.fillText("mock (brandPage)", x0, 34); g.fillText("real: " + (L.url || "").replace(/^https?:\/\//, "").slice(0, 34), x1, 34); g.fillText("difference", x2, 34);
    g.drawImage(m, x0, top, COL, mh); g.drawImage(r, x1, top, COL, rh);
    // role boxes on the real page (section dashed, element solid)
    const rk = COL / L.page.w;
    Object.entries(roles).forEach(([name, ro]) => {
      g.strokeStyle = ROLE_COL[name] || "#000"; g.lineWidth = 2;
      g.setLineDash([6, 4]); g.strokeRect(x1 + ro.section[0] * rk, top + ro.section[1] * rk, ro.section[2] * rk, ro.section[3] * rk);
      g.setLineDash([]); g.lineWidth = 3; g.strokeRect(x1 + ro.el[0] * rk - 2, top + ro.el[1] * rk - 2, ro.el[2] * rk + 4, ro.el[3] * rk + 4);
      g.fillStyle = ROLE_COL[name] || "#000"; g.font = "bold 13px sans-serif";
      const ly = top + ro.el[1] * rk - 6 + (name === "cta" ? ro.el[3] * rk + 22 : 0);
      g.fillText(name, x1 + ro.el[0] * rk + (name === "cta" ? 40 : 0), Math.max(top + 12, ly));
    });
    // difference: both at the same width, top-aligned
    g.drawImage(m, x2, top, COL, mh); g.globalCompositeOperation = "difference"; g.drawImage(r, x2, top, COL, rh); g.globalCompositeOperation = "source-over";
    return c.toDataURL("image/png").split(",")[1];
  }, { mock: mockPng.toString("base64"), real: realPng.toString("base64"), L, roles, COL, ROLE_COL });
  fs.writeFileSync(path.join(OUT, "compare.png"), Buffer.from(b64, "base64"));
  await b.close();

  // report
  const row = (label, a, bb) => console.log(`  ${label.padEnd(14)} ${String(a).padEnd(40)} ${bb}`);
  console.log(`\npage             ${"mock".padEnd(40)} real`);
  row("size", `1440 x ${mockH}`, `${L.page.w} x ${L.page.h}`);
  row("sections", mockL.sections.length, `${L.sections.length} (${L.sectionMode})`);
  row("CTAs", mockL.ctas.length + " (the mock uses divs)", L.ctas.length);
  const list = a => a.slice(0, 5).map(c => `${c.v} ${Math.round(c.share * 100)}%`).join("  ");
  console.log("\npalette (share of area / text)");
  row("pixels", "", ""); console.log("    mock " + list(mockL.style.pixels)); console.log("    real " + list(L.style.pixels));
  row("text colour", "", ""); console.log("    mock " + list(mockL.style.text)); console.log("    real " + list(L.style.text));
  row("buttons", "", ""); console.log("    mock (div buttons: see --terra #d4623a)"); console.log("    real " + (list(L.style.buttons) || "(none filled)"));
  console.log("\nreal colours with no close mock colour (RGB distance > 48) -> candidates for the mock or retire it:");
  const mockCols = [...mockL.style.pixels, ...mockL.style.text, ...mockL.style.bg].map(c => c.v.slice(0, 7)).concat(["#d4623a"]);
  const miss = [...L.style.pixels, ...L.style.text, ...L.style.buttons].map(c => c.v.slice(0, 7)).filter((v, i, a) => a.indexOf(v) === i)
    .map(v => { const n = mockCols.reduce((best, m) => dist(v, m) < dist(v, best) ? m : best, mockCols[0]); return [v, n, dist(v, n)]; })
    .filter(x => x[2] > 48);
  if (!miss.length) console.log("  none: the mock's palette already covers the real page");
  miss.forEach(([v, n, d]) => console.log(`  ${v}  (nearest mock ${n}, distance ${d})`));
  console.log("\nfonts (share of text)");
  console.log("  mock " + mockL.style.fonts.map(f => `${fam(f.v)} ${Math.round(f.share * 100)}%`).join(", "));
  console.log("  real " + L.style.fonts.map(f => `${fam(f.v)} ${Math.round(f.share * 100)}%`).join(", "));
  if (L.style.loadedFonts.length) console.log("  real web fonts loaded: " + L.style.loadedFonts.slice(0, 8).join(", "));
  const newF = [...new Set(L.style.fonts.map(f => fam(f.v)))].filter(f => !mockL.style.fonts.some(m => fam(m.v) === f));
  if (newF.length) console.log("  not in the mock: " + newF.join(", "));
  console.log("\nheadings (real): " + L.headings.slice(0, 6).map(h => `h${h.level} "${h.text.slice(0, 24)}"`).join(" · "));
  console.log(`\nwrote ${path.relative(process.cwd(), path.join(OUT, "compare.png"))} and layout.js. With page.png + layout.js present the film shows the real page;` +
    " the mock in core.js is only the no-capture fallback.");
})().catch(e => { console.error("compare-ref failed:", e.message); process.exit(1); });
