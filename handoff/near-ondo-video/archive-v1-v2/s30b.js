const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1100,height:900}});
const errs=[]; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + process.cwd() + '/p30.html'); await p.waitForTimeout(600);
await (await p.$('.score-wrap')).screenshot({path:'score.png'}); console.log(JSON.stringify(errs)); await b.close(); })();
