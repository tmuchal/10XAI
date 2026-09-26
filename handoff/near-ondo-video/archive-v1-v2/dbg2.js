const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/p30.html'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    window.__cut.seek(17.6);
    const t = [...document.querySelectorAll('#s6 text')].find(x => x.textContent === 'RALLY');
    let g = t; const chain = [];
    while (g && g.id !== 's6'){ chain.push((g.getAttribute('transform')||'') + ' | ' + (g.getAttribute('style')||'')); g = g.parentNode; }
    return {vis: getComputedStyle(document.getElementById('s6')).visibility, chain};
  });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
