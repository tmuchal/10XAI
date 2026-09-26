const { chromium } = require('playwright');
(async () => {
  const [page, ids, out] = [process.argv[2], process.argv[3].split(','), process.argv[4] || 'chk'];
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{ width:1280, height:720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + process.cwd() + '/' + page); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  await p.evaluate(() => { window.__freeze = true; });
  const cues = await p.evaluate(() => window.VIDEO.cues.map(c => ({id:c.id, t0:c.t0, t1:c.t1})));
  let k = 0;
  for (const spec of ids){
    const [id, off] = spec.split('+'); const c = cues.find(q => q.id === id);
    const t = off === 'end' ? c.t1 - .5 : c.t0 + Number(off || 2.5);
    await p.evaluate(tt => window.__v.render(tt, true), t);
    await (await p.$('#stage3')).screenshot({ path:`${out}${String(k++).padStart(2,'0')}.png` });
  }
  console.log('dur', await p.evaluate(() => window.__v.dur), JSON.stringify(errs.filter(e => !/ERR_|net::/.test(e))));
  await b.close();
})();
