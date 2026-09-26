const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(500);
  await p.click('#startSilent'); await p.click('#playBtn'); // pause
  for (const [t, f] of [[4.6,'burst.png'],[32.9,'cube2.png']]) {
    await p.evaluate(tt => { const s = document.querySelector('#scrub'); s.value = tt; s.dispatchEvent(new Event('input')); }, t);
    await p.waitForTimeout(300);
    await (await p.$('.stagewrap')).screenshot({ path: f });
  }
  console.log('webgl:', await p.evaluate(() => !!document.getElementById('gl').getContext('webgl2') || 'ctx-in-use'), JSON.stringify(errs));
  await b.close();
})();
