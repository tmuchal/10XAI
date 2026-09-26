const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1600,height:1400}});
await p.goto('file://' + process.cwd() + '/g30.html'); await p.waitForTimeout(300);
await p.screenshot({path:'g30.png', fullPage:true}); await b.close(); })();
