const { chromium } = require(process.env.NODE_PATH ? 'playwright' : '/usr/local/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(800);
  // grab storyboard thumbnails area & poses in one full-page shot
  await p.screenshot({ path: 'full.png', fullPage: true });
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
