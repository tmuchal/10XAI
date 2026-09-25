// Bakes the static watercolor art once (the expensive SVG filters run here, not per frame).
// Usage: source tools/env.sh && node film/assets/make-assets.cjs
// Outputs: film/assets/backdrop.jpg (1920x1080 painted stage backdrop), film/assets/grain.png (paper grain tile).
const { chromium } = require("playwright"); const path = require("path");
const OUT = __dirname;
// deterministic pseudo-random
let S = 7; const rnd = () => (S = (S * 16807) % 2147483647) / 2147483647;
const blob = (cx, cy, rx, ry, n = 14) => {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, k = 0.82 + rnd() * 0.3;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    d += (i ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + "Z";
};
const wash = (d, col, op = .5, f = "wc") => `<path d="${d}" fill="${col}" fill-opacity="${op}" filter="url(#${f})"/>`;
const INK = "#2b2320";
// hand-drawn cloud outline
const cloud = (x, y, s) => { const C = [[0, 0, 30], [40, -22, 38], [86, -8, 32], [120, 6, 24], [60, 12, 30], [20, 14, 24]].map(([a, b, r]) => [x + a * s, y + b * s, r * s]);
  const cs = (st) => C.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${st}/>`).join("");
  return `<g filter="url(#rough)"><g fill="#fff" stroke="${INK}" stroke-opacity=".5" stroke-width="7">${cs("")}</g><g fill="#fffdf6">${cs("")}</g>
    <path d="M${x + 10 * s} ${y + 4 * s} q${20 * s} ${10 * s} ${50 * s} ${4 * s}" fill="none" stroke="#bfe0f2" stroke-width="${5 * s}" stroke-linecap="round" opacity=".7"/></g>`; };
const sparkle = (x, y, s, c) => `<path d="M${x} ${y - 14 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 14 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 14 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 14 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 14 * s}Z" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width="2.5" stroke-linejoin="round"/>`;
function hills(base, amp, col, seed) {
  let d = `M-40 1100 L-40 ${base}`;
  for (let x = -40; x <= 1960; x += 40) d += ` L${x} ${(base - amp * Math.sin(x / 300 + seed) - amp * .45 * Math.sin(x / 130 + seed * 2)).toFixed(1)}`;
  return `<path d="${d} L1960 1100Z" fill="${col}" stroke="${INK}" stroke-opacity=".45" stroke-width="3.5" filter="url(#rough)"/>`;
}
const backdrop = () => `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>
  <filter id="wc" x="-30%" y="-30%" width="160%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves="3" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="90" xChannelSelector="R" yChannelSelector="G" result="shape"/>
    <feGaussianBlur in="shape" stdDeviation="10" result="soft"/>
    <feComposite in="shape" in2="soft" operator="arithmetic" k2="1.6" k3="-1.2" result="rim"/>
    <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="9" result="gr"/>
    <feColorMatrix in="gr" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.25" result="gra"/>
    <feComposite in="soft" in2="gra" operator="in" result="body"/>
    <feMerge><feMergeNode in="body"/><feMergeNode in="rim"/></feMerge>
  </filter>
  <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="5"/>
    <feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="4" seed="11"/>
    <feColorMatrix values="0 0 0 0 .86  0 0 0 0 .66  0 0 0 0 .42  0 0 0 .5 -.12"/></filter>
  <radialGradient id="sun" cx="50%" cy="44%" r="46%"><stop offset="0" stop-color="#fff7cf"/><stop offset=".55" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="50%" cy="46%" r="75%"><stop offset=".55" stop-color="#ffb888" stop-opacity="0"/><stop offset="1" stop-color="#f59a6a" stop-opacity=".42"/></radialGradient>
</defs>
<rect width="1920" height="1080" fill="#fdf3dc"/>
${wash(blob(420, 170, 620, 260), "#8fcff0", .55)}
${wash(blob(1560, 150, 560, 230), "#bfe6f7", .5)}
${wash(blob(1500, 420, 460, 300), "#ffc3a0", .45)}
${wash(blob(330, 560, 420, 300), "#ffd98a", .45)}
${wash(blob(960, 470, 560, 380), "#fff0a8", .55)}
${wash(blob(1640, 760, 420, 240), "#d6c6f5", .45)}
${wash(blob(250, 820, 460, 220), "#b9e8c9", .5)}
${wash(blob(1000, 60, 380, 120), "#ffd1dc", .4)}
<rect width="1920" height="1080" fill="url(#sun)"/>
<g opacity=".11">${Array.from({ length: 36 }, (_, i) => { const a0 = i * 10 * Math.PI / 180, a1 = a0 + 4 * Math.PI / 180, R = 1500;
  return `<path d="M960 470 L${960 + R * Math.cos(a0)} ${470 + R * Math.sin(a0)} L${960 + R * Math.cos(a1)} ${470 + R * Math.sin(a1)}Z" fill="#ffffff"/>`; }).join("")}</g>
${hills(830, 38, "#cdebc4", 1.2)}
${hills(875, 26, "#a9dbb4", 3.1)}
${cloud(250, 250, 1.2)}${cloud(1450, 190, 1.4)}${cloud(1680, 330, .8)}${cloud(620, 130, .75)}
${sparkle(1240, 120, 1.1, "#ffe07a")}${sparkle(470, 420, .8, "#ffc9d6")}${sparkle(1750, 560, .9, "#bfe6f7")}${sparkle(160, 470, .7, "#ffe07a")}${sparkle(1330, 640, .6, "#d6c6f5")}
<rect width="1920" height="1080" filter="url(#paper)" opacity=".55"/>
<rect width="1920" height="1080" fill="url(#vig)"/>
</svg>`;
const grain = () => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="2" stitchTiles="stitch"/>
<feColorMatrix values="0 0 0 0 .42  0 0 0 0 .30  0 0 0 0 .18  0 0 0 -1.6 1.02"/></filter>
<filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".05 .4" numOctaves="2" seed="8" stitchTiles="stitch"/>
<feColorMatrix values="0 0 0 0 .5  0 0 0 0 .36  0 0 0 0 .22  0 0 0 -2.2 1.2"/></filter>
<rect width="400" height="400" filter="url(#g)"/><rect width="400" height="400" filter="url(#f)" opacity=".5"/></svg>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.setContent(`<body style="margin:0">${backdrop()}</body>`); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, "backdrop.jpg"), type: "jpeg", quality: 92 });
  await p.setViewportSize({ width: 400, height: 400 });
  await p.setContent(`<body style="margin:0;background:transparent">${grain()}</body>`);
  await p.screenshot({ path: path.join(OUT, "grain.png"), omitBackground: true });
  await b.close(); console.log("assets ok");
})();
