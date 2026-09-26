const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1100,height:900}});
const errs=[]; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + process.cwd() + '/p_near-case.html'); await p.waitForTimeout(600);
await (await p.$('#poses')).screenshot({path:'poses.png'}); console.log(JSON.stringify(errs)); await b.close(); })();
