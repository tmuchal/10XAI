
const { chromium } = require('playwright');
const V = JSON.parse(require('fs').readFileSync(process.env.VJSON));
(async () => {
  const [from, to] = [Number(process.argv[2]), Number(process.argv[3])];
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{ width:1280, height:720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/' + process.env.REC); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__freeze = true; });
  for (let k = from; k < to; k++){
    const t = k/30, talk = V.some(v => t >= v.t && t <= v.t + v.dur);
    await p.evaluate(([t, talk]) => window.__v.render(t, talk), [t, talk]);
    await p.screenshot({ path:process.env.OUT + '/f' + String(k).padStart(5, '0') + '.jpg', type:'jpeg', quality:88, clip:{x:0, y:0, width:1280, height:720} });
  }
  console.log('done', from, to, JSON.stringify(errs)); await b.close();
})();
