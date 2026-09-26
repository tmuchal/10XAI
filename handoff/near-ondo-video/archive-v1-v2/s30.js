const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 960, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/' + (process.argv[2] || 'p30.html'));
  await p.waitForTimeout(700);
  await p.evaluate(() => document.getElementById('startOv').hidden = true);
  const ts = (process.argv[3] || '1.2,2.6,3.2,4.2,7.2,8.4,10.2,12.0,14.2,15.6,17.6,19.4,21.8,23.6,26.0,28.6').split(',').map(Number);
  let i = 0;
  for (const t of ts) {
    await p.evaluate(tt => window.__cut.seek(tt), t);
    await p.waitForTimeout(120);
    await (await p.$('.stagewrap')).screenshot({ path: `f${String(i++).padStart(2,'0')}.png` });
  }
  console.log(ts.length, JSON.stringify(errs));
  await b.close();
})();
