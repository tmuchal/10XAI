const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(1200);
  const thumbs = await p.$$('.thumb');
  // stitch: screenshot the board section only
  await (await p.$('#board')).screenshot({ path: 'board.png' });
  console.log('thumbs', thumbs.length, 'errors:', JSON.stringify(errs));
  await b.close();
})();
