const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(500);
  await p.click('#startSilent'); await p.click('#playBtn');
  for (const [t, f] of [[8.0,'h1.png'],[32.95,'h2.png']]) {
    await p.evaluate(tt => { const s = document.querySelector('#scrub'); s.value = tt; s.dispatchEvent(new Event('input')); }, t);
    await p.waitForTimeout(300);
    await (await p.$('.stagewrap')).screenshot({ path: f });
  }
  await (await p.$('#poses')).screenshot({ path: 'poses.png' });
  console.log(JSON.stringify(errs));
  await b.close();
})();
