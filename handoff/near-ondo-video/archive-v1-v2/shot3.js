const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 820 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(600);
  await p.click('#startSilent');
  await p.evaluate(() => { document.querySelector('#scrub').value = 30.5; document.querySelector('#scrub').dispatchEvent(new Event('input')); });
  await p.click('#playBtn'); await p.click('#playBtn');
  await p.waitForTimeout(1200);
  await (await p.$('.player')).screenshot({ path: 'jury.png' });
  console.log('jury visible:', await p.isVisible('#jury'), 'errors:', JSON.stringify(errs));
  await b.close();
})();
