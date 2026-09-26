const { chromium } = require('playwright');
const V = JSON.parse(require('fs').readFileSync(process.env.VJSON || 'audio/voice.json'));
(async () => {
  const [from, to, fps] = [Number(process.argv[2]), Number(process.argv[3]), 30];
  const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport:{ width:1280, height:720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/' + (process.env.REC || 'rec.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  await p.evaluate(() => { window.__freeze = true; });
  for (let k = from; k < to; k++){
    const t = k/fps, c = Math.min(t, Number(process.env.CMAX || 30));
    const talk = V.some(v => t >= v.t && t <= v.t + v.dur);
    await p.evaluate(([c, talk]) => window.__cut.render(c, talk), [c, talk]);
    await p.screenshot({ path:(process.env.OUT || 'frames') + '/f' + String(k).padStart(4,'0') + '.jpg', type:'jpeg', quality:90, clip:{x:0,y:0,width:1280,height:720} });
  }
  console.log('done', from, to, JSON.stringify(errs));
  await b.close();
})();
