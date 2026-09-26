const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{ width:1280, height:720 } });
  await p.goto('file://' + process.cwd() + '/rec_near3.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  await p.evaluate(() => { window.__freeze = true; });
  const cues = await p.evaluate(() => window.VIDEO.cues.map(c => ({id:c.id, ch:c.ch, card:!!c.card, t0:c.t0, t1:c.t1, en:c.en, ko:c.ko, who:c.who || 'uchay', src:c.src || ''})));
  for (const c of cues){
    const t = c.card ? c.t0 + 1.1 : c.t0 + Math.min(c.t1 - c.t0 - .4, Math.max(2.2, (c.t1 - c.t0)*.75));
    await p.evaluate(tt => window.__v.render(tt, false), t);
    await p.screenshot({ path:`sb/${c.id}.jpg`, type:'jpeg', quality:70, clip:{x:0, y:0, width:1280, height:720} });
  }
  require('fs').writeFileSync('sb/cues.json', JSON.stringify(cues));
  await b.close();
})();
