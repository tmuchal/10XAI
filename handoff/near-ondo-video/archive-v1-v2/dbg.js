const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  await p.goto('file://' + process.cwd() + '/preview.html');
  await p.waitForTimeout(500);
  await p.click('#startSilent'); await p.click('#playBtn');
  await p.evaluate(() => { const s = document.querySelector('#scrub'); s.value = 74; s.dispatchEvent(new Event('input')); });
  const r = await p.evaluate(() => {
    const texts = [...document.querySelectorAll('#s6 text')].filter(t => t.textContent === 'TOO LATE');
    const g = texts[0].parentNode; return { inner: g.getAttribute('transform'), style: g.getAttribute('style'), outer: g.parentNode.getAttribute('transform') };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
