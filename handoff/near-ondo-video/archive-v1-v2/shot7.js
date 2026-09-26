const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(500);
  await p.click('#startSilent'); await p.click('#playBtn');
  const shots = [[16.6,'a.png'],[31.8,'b.png'],[53.2,'c.png'],[73.6,'d.png'],[85.8,'e.png'],[95.9,'f.png']];
  for (const [t, f] of shots) {
    await p.evaluate(tt => { const s = document.querySelector('#scrub'); s.value = tt; s.dispatchEvent(new Event('input')); }, t);
    await p.waitForTimeout(250);
    await (await p.$('.stagewrap')).screenshot({ path: f });
  }
  console.log(JSON.stringify(errs));
  await b.close();
})();
