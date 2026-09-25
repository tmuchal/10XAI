// Screenshot given timestamps: node tools/snap.cjs <page.html> <outDir> t1 t2 ...
// Also reports page errors. Env: NODE_PATH must resolve "playwright".
const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs");
(async () => {
  const [html, dir, ...ts] = process.argv.slice(2); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on("pageerror", e => console.log("PAGEERROR", e.message));
  await p.goto("file://" + path.resolve(html) + "?render"); await p.evaluate(() => window.READY || null);
  for (const t of ts) { await p.evaluate(t => window.render(t), +t); await p.screenshot({ path: path.join(dir, `t${t}.png`) }); }
  await b.close(); console.log("ok", ts.length);
})();
