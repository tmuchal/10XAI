/* Harness Theater: film kit (16:9, 1280×720 logical).
 *
 * Clean-vector storybook theater in the style of the series' reference cut: red velvet curtains
 * with gold tassels, a pastel sky with clouds and hills, a plank stage with footlights, audience
 * hamsters in the corners, a washi-taped chapter label, a source pill, and a navy stitched
 * subtitle bar (white English over yellow Korean).
 *
 * Cast: Noa (a round caramel hamster in black sunglasses and a gold scarf), Uchu (a small red
 * bean with a green face and antenna balls), the hamster crew (the 10XAI agents, colored
 * bandanas + props) and the party-hat audience.
 *
 * Every function returns SVG markup. Everything that moves takes the time t (seconds), so a
 * frame is a pure function of t and the film can be rendered frame by frame.
 */
(function (root) {
  const W = 1280, H = 720, FLOOR = 598, STAND = 548;   // characters stand on STAND, above the subtitle bar
  const INK = '#4a2e1f';
  const HAND = "Gaegu, 'Gowun Dodum', sans-serif";
  const C = {
    fur: '#eba35c', fur2: '#d98a45', cream: '#fde6c6', pink: '#f6a6ae', blush: '#f59aa0',
    glass: '#17171d', scarf: '#f5c53b', scarf2: '#d9a51f', red: '#e0352b', red2: '#b5261f',
    green: '#56b04c', green2: '#8fd07a', navy: '#26386b', yellow: '#ffd84d', paper: '#fff8e8',
    paper2: '#fdf0d2', curtain: '#c8262c', curtain2: '#9a1b22', gold: '#e9b73f', gold2: '#b8862a',
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const n = (v) => +(+v).toFixed(1);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const k = (t, a, d) => clamp((t - a) / (d || 1), 0, 1);                 // progress of a window
  const ease = (p) => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const back = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const pop = (p) => p <= 0 ? 0 : p >= 1 ? 1 : back(p);                    // overshoot 0→1
  const bob = (t, f, a) => Math.sin(t * Math.PI * 2 * (f || 1)) * (a || 1);
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  const tw = (s, z) => { let w = 0; for (const ch of String(s).replace(/\*/g, '')) w += /[ᄀ-￿]/.test(ch) ? z * .95 : (ch === ' ' ? z * .32 : z * .52); return w; };

  function T(x, y, s, z, o) {
    o = o || {};
    return `<text x="${n(x)}" y="${n(y)}" font-size="${n(z)}" text-anchor="${o.a || 'middle'}" fill="${o.f || INK}" font-family="${o.font || HAND}" font-weight="${o.w || 700}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.r ? ` transform="rotate(${o.r} ${n(x)} ${n(y)})"` : ''}${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 5}" paint-order="stroke" stroke-linejoin="round"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}>${esc(s)}</text>`;
  }
  /* *highlight* spans inside a line */
  function R(x, y, s, z, f, hi, o) {
    o = o || {};
    const spans = String(s).split('*').map((p, i) => i % 2 ? `<tspan fill="${hi}">${esc(p)}</tspan>` : esc(p)).join('');
    return `<text x="${n(x)}" y="${n(y)}" font-size="${n(z)}" text-anchor="${o.a || 'middle'}" fill="${f}" font-family="${HAND}" font-weight="700"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${spans}</text>`;
  }
  const at = (x, y, s, inner, extra) => `<g transform="translate(${n(x)},${n(y)}) scale(${n(s * 1000) / 1000})"${extra || ''}>${inner}</g>`;

  /* ---------------- set ---------------- */
  function cloud(x, y, s) {
    return at(x, y, s, `<path d="M-60,10 Q-66,-12 -44,-16 Q-40,-38 -14,-32 Q0,-52 24,-36 Q48,-40 50,-16 Q70,-12 62,10 Z" fill="#ffffff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-30,2 Q-8,8 20,2" fill="none" stroke="#bcd7ee" stroke-width="3" stroke-linecap="round"/>`);
  }
  function sparkle(x, y, s, c) {
    return at(x, y, s, `<path d="M0,-10 Q2,-2 10,0 Q2,2 0,10 Q-2,2 -10,0 Q-2,-2 0,-10 Z" fill="${c || '#fff4c2'}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`);
  }
  function backdrop(t, o) {
    o = o || {};
    let g = `<defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdf1c9"/><stop offset=".45" stop-color="#fbe6c8"/><stop offset=".75" stop-color="#f6d9dc"/><stop offset="1" stop-color="#dfe3f3"/></linearGradient>
      <radialGradient id="sun" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#fffbe6" stop-opacity=".95"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></radialGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8b27a"/><stop offset="1" stop-color="#d9955c"/></linearGradient></defs>`;
    g += `<rect width="${W}" height="${H}" fill="url(#sky)"/><rect width="${W}" height="${H}" fill="url(#sun)"/>`;
    // soft watercolor blooms
    g += `<ellipse cx="300" cy="300" rx="260" ry="120" fill="#fbd3c6" opacity=".35"/><ellipse cx="980" cy="360" rx="280" ry="130" fill="#d8e7f6" opacity=".45"/><ellipse cx="640" cy="180" rx="300" ry="110" fill="#fff6d6" opacity=".6"/>`;
    // drifting clouds
    const cl = [[190, 150, .9, 3], [1010, 120, 1.05, 2.2], [760, 250, .7, 2.6], [360, 300, .6, 1.8], [1120, 330, .75, 2]];
    cl.forEach(([x, y, s, sp]) => { const dx = ((t * sp) % 60) - 30; g += cloud(x + dx, y, s); });
    [[250, 360], [470, 210], [880, 180], [1060, 420], [640, 110], [150, 460]].forEach(([x, y], i) => { g += sparkle(x, y, .8 + .25 * Math.sin(t * 2 + i), i % 2 ? '#fff' : '#fff4c2'); });
    // hills
    g += `<path d="M0,560 Q180,520 360,548 Q520,570 700,536 Q880,506 1060,540 Q1180,560 1280,532 L1280,${FLOOR} L0,${FLOOR} Z" fill="#cfe6bf" stroke="#9fc28f" stroke-width="2"/><path d="M0,580 Q220,556 460,576 Q700,592 940,566 Q1120,552 1280,572 L1280,${FLOOR} L0,${FLOOR} Z" fill="#bcdcab" opacity=".9"/>`;
    // floor
    g += `<rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="url(#floor)"/><line x1="0" y1="${FLOOR}" x2="${W}" y2="${FLOOR}" stroke="${INK}" stroke-width="3"/>`;
    for (let i = -12; i <= 12; i++) g += `<line x1="${640 + i * 56}" y1="${FLOOR}" x2="${640 + i * 78}" y2="${H}" stroke="#c07f48" stroke-width="1.6" opacity=".55"/>`;
    g += `<line x1="0" y1="${FLOOR + 38}" x2="${W}" y2="${FLOOR + 38}" stroke="#c07f48" stroke-width="1.4" opacity=".4"/><line x1="0" y1="${FLOOR + 84}" x2="${W}" y2="${FLOOR + 84}" stroke="#c07f48" stroke-width="1.4" opacity=".35"/>`;
    if (o.tint) g += `<rect width="${W}" height="${H}" fill="${o.tint[0]}" opacity="${o.tint[1]}"/>`;
    if (o.vignette) g += `<defs><radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#2b1a3a" stop-opacity="0"/><stop offset="1" stop-color="#2b1a3a" stop-opacity=".5"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vig)"/>`;
    if (o.spot) g += `<polygon points="${o.spot - 40},0 ${o.spot + 40},0 ${o.spot + 190},${FLOOR + 20} ${o.spot - 190},${FLOOR + 20}" fill="#fffbe0" opacity=".55"/><ellipse cx="${o.spot}" cy="${FLOOR + 14}" rx="180" ry="18" fill="#fffbe0" opacity=".7"/><ellipse cx="${o.spot}" cy="${STAND + 8}" rx="140" ry="16" fill="#fffbe0" opacity=".7"/>`;
    return g;
  }
  function curtains(t) {
    const sway = Math.sin(t * .9) * 2;
    const half = (flip) => {
      let p = `<path d="M0,0 L118,0 C${100 + sway},120 ${92 + sway},250 108,352 C92,440 74,600 86,${H} L0,${H} Z" fill="${C.curtain}" stroke="${INK}" stroke-width="3"/>`;
      for (const [x, c] of [[26, C.curtain2], [58, C.curtain2], [88, '#e0484a']]) p += `<path d="M${x},0 C${x - 4 + sway},140 ${x + 2},260 ${x + 6},350 C${x - 4},450 ${x - 8},600 ${x - 6},${H}" fill="none" stroke="${c}" stroke-width="${c === '#e0484a' ? 5 : 3}" opacity=".75"/>`;
      p += `<path d="M84,344 Q112,336 124,350 Q112,368 84,360 Z" fill="${C.gold}" stroke="${INK}" stroke-width="2.4"/><path d="M118,352 L126,392" stroke="${C.gold2}" stroke-width="3"/><path d="M120,390 L132,390 L130,412 L122,412 Z" fill="${C.gold}" stroke="${INK}" stroke-width="2"/>`;
      return flip ? `<g transform="translate(${W},0) scale(-1,1)">${p}</g>` : p;
    };
    let v = `M0,0 L${W},0 L${W},30`;
    for (let x = W; x > 0; x -= 80) v += ` Q${x - 40},72 ${x - 80},30`;
    v += ' Z';
    let g = half(false) + half(true) + `<path d="${v}" fill="${C.curtain}" stroke="${INK}" stroke-width="3"/><path d="M0,10 L${W},10" stroke="${C.gold}" stroke-width="5"/>`;
    for (let x = 40; x < W; x += 80) g += `<line x1="${x}" y1="42" x2="${x}" y2="56" stroke="${C.gold2}" stroke-width="2"/><path d="M${x - 6},54 L${x + 6},54 L${x + 4},70 L${x - 4},70 Z" fill="${C.gold}" stroke="${INK}" stroke-width="1.8"/>`;
    // footlights
    for (let x = 60; x < W; x += 110) g += `<path d="M${x - 22},${H} Q${x - 22},${H - 16} ${x},${H - 16} Q${x + 22},${H - 16} ${x + 22},${H} Z" fill="#ffe9a8" stroke="${INK}" stroke-width="2"/><ellipse cx="${x}" cy="${H - 20}" rx="30" ry="8" fill="#fff6c8" opacity=".5"/>`;
    return g;
  }
  function audience(t) {
    const spots = [[34, 612, .55, 0], [92, 640, .6, .3], [1188, 640, .6, .6], [1246, 612, .55, .9]];
    return spots.map(([x, y, s, ph]) => crew(x, y + Math.abs(Math.sin((t + ph) * 3)) * -4, s, { eyes: 'happy', hat: true, bandana: null })).join('');
  }

  /* ---------------- characters ---------------- */
  /* Noa: feet at (x, y). o: pose 'idle'|'wave'|'point'|'cheer'|'stamp'|'shrug'|'think', mood 'smile'|'grin'|'o'|'flat', glasses true|'up', sq (squash), flip, hat */
  function noa(x, y, s, o) {
    o = o || {};
    const sq = o.sq || 0, sx = 1 + sq * .08, sy = 1 - sq * .08;
    let g = '';
    // feet
    g += `<ellipse cx="-24" cy="-4" rx="16" ry="7" fill="${C.fur2}" stroke="${INK}" stroke-width="2.6"/><ellipse cx="24" cy="-4" rx="16" ry="7" fill="${C.fur2}" stroke="${INK}" stroke-width="2.6"/>`;
    // ears
    g += `<circle cx="-40" cy="-114" r="17" fill="${C.fur}" stroke="${INK}" stroke-width="3"/><circle cx="-40" cy="-114" r="9" fill="${C.pink}"/><circle cx="40" cy="-114" r="17" fill="${C.fur}" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="-114" r="9" fill="${C.pink}"/>`;
    // body (one round potato)
    g += `<path d="M-66,-58 C-68,-108 -36,-128 0,-128 C36,-128 68,-108 66,-58 C66,-18 40,-4 0,-4 C-40,-4 -66,-18 -66,-58 Z" fill="${C.fur}" stroke="${INK}" stroke-width="3.2"/>`;
    g += `<path d="M-6,-128 q4,-8 10,-2" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
    g += `<ellipse cx="0" cy="-34" rx="40" ry="26" fill="${C.cream}"/>`;
    // side fur tufts
    g += `<path d="M-66,-62 l-8,4 l7,3 M66,-62 l8,4 l-7,3" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    // muzzle, cheeks, blush
    g += `<ellipse cx="0" cy="-66" rx="26" ry="16" fill="${C.cream}"/><ellipse cx="-36" cy="-66" rx="10" ry="6" fill="${C.blush}" opacity=".7"/><ellipse cx="36" cy="-66" rx="10" ry="6" fill="${C.blush}" opacity=".7"/>`;
    g += `<path d="M-28,-70 l-22,-4 M-28,-65 l-23,2 M-28,-60 l-20,6 M28,-70 l22,-4 M28,-65 l23,2 M28,-60 l20,6" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
    g += `<ellipse cx="0" cy="-72" rx="6" ry="4.4" fill="#ea7c86" stroke="${INK}" stroke-width="1.8"/>`;
    const m = o.mood || 'smile';
    if (m === 'grin') g += `<path d="M-12,-64 Q0,-46 12,-64 Z" fill="#8a2f2a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><rect x="-5" y="-64" width="10" height="6" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
    else if (m === 'o') g += `<ellipse cx="0" cy="-57" rx="6" ry="7.5" fill="#8a2f2a" stroke="${INK}" stroke-width="2"/>`;
    else if (m === 'flat') g += `<path d="M-7,-62 L7,-62" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><rect x="-4" y="-61.5" width="8" height="5" fill="#fff" stroke="${INK}" stroke-width="1.1"/>`;
    else g += `<path d="M-9,-65 q4.5,5 9,0 q4.5,5 9,0" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linecap="round"/><rect x="-4" y="-62" width="8" height="6" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
    // sunglasses
    if (o.glasses === 'up') {
      g += `<circle cx="-18" cy="-86" r="5.5" fill="${INK}"/><circle cx="18" cy="-86" r="5.5" fill="${INK}"/><circle cx="-16.5" cy="-88" r="1.8" fill="#fff"/><circle cx="19.5" cy="-88" r="1.8" fill="#fff"/>`;
      g += `<g transform="translate(0,-26) rotate(-5)"><rect x="-42" y="-94" width="36" height="17" rx="5" fill="${C.glass}" stroke="${INK}" stroke-width="2"/><rect x="6" y="-94" width="36" height="17" rx="5" fill="${C.glass}" stroke="${INK}" stroke-width="2"/><path d="M-6,-87 L6,-87" stroke="${INK}" stroke-width="3"/></g>`;
    } else if (o.glasses !== false) {
      g += `<path d="M-60,-88 L-44,-89 M44,-89 L60,-88" stroke="${C.glass}" stroke-width="3.4" stroke-linecap="round"/><path d="M-44,-96 L-6,-96 L-8,-82 Q-10,-76 -18,-76 L-36,-76 Q-44,-76 -44,-84 Z" fill="${C.glass}" stroke="${INK}" stroke-width="2"/><path d="M6,-96 L44,-96 L44,-84 Q44,-76 36,-76 L18,-76 Q10,-76 8,-82 Z" fill="${C.glass}" stroke="${INK}" stroke-width="2"/><path d="M-6,-92 Q0,-95 6,-92" fill="none" stroke="${C.glass}" stroke-width="3.4"/><path d="M-36,-92 l8,-2 M-30,-84 l14,-8 M14,-92 l8,-2 M20,-84 l14,-8" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`;
    }
    // scarf
    if (o.scarf !== false) g += `<path d="M-52,-40 Q0,-24 52,-40 L50,-28 Q0,-12 -50,-28 Z" fill="${C.scarf}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M18,-24 L30,4 L20,6 L12,-20 Z" fill="${C.scarf}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M22,3 l-1,5 M26,2 l0,5" stroke="${C.scarf2}" stroke-width="2"/>`;
    // paws per pose
    const P = { idle: [[-36, -30], [36, -30]], wave: [[-36, -30], [74, -110]], point: [[-36, -30], [88, -70]], cheer: [[-84, -100], [84, -100]], stamp: [[-36, -30], [58, -132]], shrug: [[-78, -64], [78, -64]], think: [[-36, -30], [14, -54]] }[o.pose || 'idle'];
    P.forEach(([px, py]) => { g += `<ellipse cx="${px}" cy="${py}" rx="12" ry="10" fill="${C.fur}" stroke="${INK}" stroke-width="2.6"/><path d="M${px - 5},${py - 4} l0,4 M${px},${py - 5} l0,4 M${px + 5},${py - 4} l0,4" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`; });
    if (o.hat) g += partyHat(20, -122);
    if (o.extra) g += o.extra;
    const fl = o.flip ? -1 : 1;
    return `<g transform="translate(${n(x)},${n(y)}) scale(${n(fl * s * sx * 1000) / 1000},${n(s * sy * 1000) / 1000})">${g}</g>`;
  }
  function partyHat(x, y) {
    return `<g transform="translate(${x},${y}) rotate(12)"><path d="M-14,4 L0,-36 L14,4 Z" fill="#f7b3c8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-9,-8 L9,-12 M-5,-20 L5,-23" stroke="#ffffff" stroke-width="3"/><circle cx="0" cy="-37" r="5" fill="${C.yellow}" stroke="${INK}" stroke-width="1.8"/></g>`;
  }
  /* Crew hamster: an agent or an audience member. o: eyes 'happy'|'dot'|'focus'|'dizzy', bandana color, prop, label, hat, mood */
  function crew(x, y, s, o) {
    o = o || {};
    let g = `<ellipse cx="-16" cy="-3" rx="11" ry="5" fill="${C.fur2}" stroke="${INK}" stroke-width="2.4"/><ellipse cx="16" cy="-3" rx="11" ry="5" fill="${C.fur2}" stroke="${INK}" stroke-width="2.4"/>`;
    g += `<circle cx="-28" cy="-82" r="12" fill="${C.fur}" stroke="${INK}" stroke-width="2.6"/><circle cx="-28" cy="-82" r="6" fill="${C.pink}"/><circle cx="28" cy="-82" r="12" fill="${C.fur}" stroke="${INK}" stroke-width="2.6"/><circle cx="28" cy="-82" r="6" fill="${C.pink}"/>`;
    g += `<path d="M-46,-42 C-48,-78 -26,-92 0,-92 C26,-92 48,-78 46,-42 C46,-14 28,-3 0,-3 C-28,-3 -46,-14 -46,-42 Z" fill="${C.fur}" stroke="${INK}" stroke-width="2.8"/><ellipse cx="0" cy="-24" rx="28" ry="17" fill="${C.cream}"/>`;
    g += `<ellipse cx="0" cy="-47" rx="18" ry="11" fill="${C.cream}"/><ellipse cx="-26" cy="-48" rx="7" ry="4" fill="${C.blush}" opacity=".7"/><ellipse cx="26" cy="-48" rx="7" ry="4" fill="${C.blush}" opacity=".7"/>`;
    g += `<path d="M-20,-50 l-15,-3 M-20,-46 l-15,2 M20,-50 l15,-3 M20,-46 l15,2" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="0" cy="-52" rx="4.2" ry="3" fill="#ea7c86" stroke="${INK}" stroke-width="1.4"/>`;
    const e = o.eyes || 'dot';
    if (e === 'happy') g += `<path d="M-20,-60 q6,-7 12,0 M8,-60 q6,-7 12,0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    else if (e === 'focus') g += `<path d="M-21,-66 l10,3 M21,-66 l-10,3" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><circle cx="-14" cy="-60" r="3.6" fill="${INK}"/><circle cx="14" cy="-60" r="3.6" fill="${INK}"/>`;
    else if (e === 'dizzy') g += `<path d="M-18,-64 l7,7 M-11,-64 l-7,7 M11,-64 l7,7 M18,-64 l-7,7" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
    else g += `<circle cx="-14" cy="-60" r="4" fill="${INK}"/><circle cx="14" cy="-60" r="4" fill="${INK}"/><circle cx="-12.8" cy="-61.4" r="1.3" fill="#fff"/><circle cx="15.2" cy="-61.4" r="1.3" fill="#fff"/>`;
    g += o.mood === 'o' ? `<ellipse cx="0" cy="-42" rx="4" ry="5" fill="#8a2f2a" stroke="${INK}" stroke-width="1.6"/>` : `<path d="M-6,-45 q3,3.5 6,0 q3,3.5 6,0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><rect x="-3" y="-43" width="6" height="4.5" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
    if (o.bandana) g += `<path d="M-42,-70 Q0,-86 42,-70 L41,-62 Q0,-78 -41,-62 Z" fill="${o.bandana}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M40,-68 l12,-8 l2,12 Z" fill="${o.bandana}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    const paws = o.paws || [[-26, -22], [26, -22]];
    paws.forEach(([px, py]) => { g += `<ellipse cx="${px}" cy="${py}" rx="9" ry="7.5" fill="${C.fur}" stroke="${INK}" stroke-width="2.2"/>`; });
    if (o.prop) g += prop(o.prop, paws[1][0], paws[1][1]);
    if (o.hat) g += partyHat(14, -88);
    if (o.crown) g += `<path d="M-16,-90 L-16,-106 L-8,-98 L0,-110 L8,-98 L16,-106 L16,-90 Z" fill="${C.yellow}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    let out = `<g transform="translate(${n(x)},${n(y)}) scale(${n((o.flip ? -s : s) * 1000) / 1000},${n(s * 1000) / 1000})">${g}</g>`;
    if (o.label) { const lw = tw(o.label, 15 * s) + 18 * s; out += `<rect x="${n(x - lw / 2)}" y="${n(y + 6 * s)}" width="${n(lw)}" height="${n(22 * s)}" rx="${n(11 * s)}" fill="${o.bandana || '#fff'}" stroke="${INK}" stroke-width="2"/>` + T(x, y + 22 * s, o.label, 15 * s, { f: '#fff', stroke: INK, sw: 3 }); }
    return out;
  }
  function prop(kind, x, y) {
    if (kind === 'scissors') return `<g transform="translate(${x + 10},${y - 18}) rotate(-30)"><circle cx="-6" cy="12" r="5" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="6" cy="12" r="5" fill="none" stroke="${INK}" stroke-width="2.4"/><path d="M-3,8 L4,-14 M3,8 L-4,-14" stroke="#9aa0ad" stroke-width="3.2" stroke-linecap="round"/></g>`;
    if (kind === 'pencil') return `<g transform="translate(${x + 8},${y - 16}) rotate(35)"><rect x="-4" y="-18" width="8" height="26" fill="${C.yellow}" stroke="${INK}" stroke-width="2"/><path d="M-4,8 L0,16 L4,8 Z" fill="#f3cda4" stroke="${INK}" stroke-width="1.8"/><rect x="-4" y="-23" width="8" height="5" fill="#f7a8c0" stroke="${INK}" stroke-width="1.6"/></g>`;
    if (kind === 'mag') return `<g transform="translate(${x + 14},${y - 18})"><line x1="-8" y1="10" x2="0" y2="0" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="8" cy="-8" r="11" fill="#dff2f6" fill-opacity=".8" stroke="${INK}" stroke-width="2.6"/></g>`;
    if (kind === 'watch') return `<g transform="translate(${x + 12},${y - 14})"><circle r="11" fill="#fff" stroke="${INK}" stroke-width="2.4"/><line x1="0" y1="0" x2="5" y2="-6" stroke="${C.red}" stroke-width="2.4" stroke-linecap="round"/><rect x="-2.5" y="-16" width="5" height="4" fill="#9aa0ad"/></g>`;
    if (kind === 'baton') return `<g transform="translate(${x + 6},${y - 10})"><line x1="0" y1="0" x2="18" y2="-26" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>${star(20, -29, 6, C.yellow)}</g>`;
    if (kind === 'box') return `<g transform="translate(${x + 14},${y - 16})"><rect x="-11" y="-10" width="22" height="18" fill="#e2b577" stroke="${INK}" stroke-width="2"/><rect x="-2" y="-10" width="4" height="18" fill="${C.red}"/></g>`;
    if (kind === 'stamp') return `<g transform="translate(${x},${y - 14})"><circle cx="0" cy="-16" r="7" fill="#8a5a2b" stroke="${INK}" stroke-width="2"/><rect x="-5" y="-12" width="10" height="14" fill="#8a5a2b" stroke="${INK}" stroke-width="2"/><rect x="-14" y="0" width="28" height="9" rx="2" fill="${C.red}" stroke="${INK}" stroke-width="2"/></g>`;
    return '';
  }
  /* Uchu: feet at (x, y). o: mood 'smile'|'shock'|'grin'|'squint', arms 'down'|'up'|'cheeks', sweat, flip */
  function uchu(x, y, s, o) {
    o = o || {};
    const m = o.mood || 'smile';
    let g = `<ellipse cx="-12" cy="-4" rx="11" ry="6" fill="${C.red2}" stroke="${INK}" stroke-width="2.4"/><ellipse cx="12" cy="-4" rx="11" ry="6" fill="${C.red2}" stroke="${INK}" stroke-width="2.4"/>`;
    g += `<path d="M-30,-10 Q-36,-44 -22,-66 L22,-66 Q36,-44 30,-10 Q0,-2 -30,-10 Z" fill="${C.red}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><path d="M-18,-58 Q-24,-40 -20,-22" fill="none" stroke="#ff7a6e" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
    const A = { down: [[-34, -28], [34, -28]], up: [[-40, -86], [40, -86]], cheeks: [[-24, -78], [24, -78]] }[o.arms || 'down'];
    A.forEach(([ax, ay], i) => { const sx = i ? 20 : -20; g += `<path d="M${sx},-54 L${ax},${ay}" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M${sx},-54 L${ax},${ay}" stroke="${C.red}" stroke-width="8.5" stroke-linecap="round"/>`; });
    // antennae
    g += `<path d="M-10,-108 Q-14,-122 -18,-132 M10,-108 Q14,-122 18,-132" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M-10,-108 Q-14,-122 -18,-132 M10,-108 Q14,-122 18,-132" fill="none" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/><circle cx="-18" cy="-134" r="6" fill="${C.red}" stroke="${INK}" stroke-width="2.2"/><circle cx="18" cy="-134" r="6" fill="${C.red}" stroke="${INK}" stroke-width="2.2"/>`;
    // hood, ear pods, face
    g += `<circle cx="-32" cy="-84" r="10" fill="${C.red}" stroke="${INK}" stroke-width="2.4"/><circle cx="32" cy="-84" r="10" fill="${C.red}" stroke="${INK}" stroke-width="2.4"/><circle cx="0" cy="-84" r="32" fill="${C.red}" stroke="${INK}" stroke-width="2.8"/><path d="M-20,-106 Q-8,-114 6,-113" fill="none" stroke="#ff7a6e" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
    g += `<circle cx="0" cy="-81" r="21" fill="${C.green}" stroke="${INK}" stroke-width="2.4"/><ellipse cx="-9" cy="-80" rx="3" ry="9" fill="${C.green2}" opacity=".7"/><ellipse cx="10" cy="-81" rx="3" ry="8" fill="${C.green2}" opacity=".6"/>`;
    if (m === 'squint') g += `<path d="M-13,-88 l5,-3 l5,3 M3,-88 l5,-3 l5,3" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    else { const r = m === 'shock' ? 7.5 : 6.4; g += `<circle cx="-8" cy="-87" r="${r}" fill="#fff" stroke="${INK}" stroke-width="1.8"/><circle cx="8" cy="-87" r="${r}" fill="#fff" stroke="${INK}" stroke-width="1.8"/><circle cx="-7" cy="-86" r="${m === 'shock' ? 2.6 : 3.2}" fill="${INK}"/><circle cx="9" cy="-86" r="${m === 'shock' ? 2.6 : 3.2}" fill="${INK}"/>`; }
    if (m === 'shock') g += `<ellipse cx="0" cy="-70" rx="6.5" ry="8" fill="#8a1f1f" stroke="${INK}" stroke-width="2"/><ellipse cx="0" cy="-66" rx="4" ry="2.6" fill="#f07f86"/>`;
    else if (m === 'grin') g += `<path d="M-9,-74 Q0,-62 9,-74 Z" fill="#8a1f1f" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
    else g += `<path d="M-6,-73 Q0,-67 6,-73" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    if (o.sweat) g += `<path d="M24,-104 C28,-98 28,-93 24,-93 C20,-93 20,-98 24,-104 Z" fill="#9ad3ee" stroke="${INK}" stroke-width="1.4"/>`;
    if (o.bang) g += T(40, -118, '!!', 30, { f: C.red, stroke: '#fff', sw: 4, r: 12 });
    if (o.crown) g += `<path d="M-18,-142 L-18,-160 L-9,-151 L0,-165 L9,-151 L18,-160 L18,-142 Z" fill="${C.yellow}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const fl = o.flip ? -1 : 1;
    return `<g transform="translate(${n(x)},${n(y)}) scale(${n(fl * s * 1000) / 1000},${n(s * 1000) / 1000})">${g}</g>`;
  }

  /* ---------------- UI and props ---------------- */
  function chapterTag(no, title, p) {
    const s = pop(p), w = Math.max(250, tw(title, 30) + 48);
    return `<g transform="translate(126,84) rotate(-2) scale(${n(s * 1000) / 1000})" opacity="${n(Math.min(1, p * 3))}"><rect x="4" y="5" width="${n(w)}" height="74" rx="6" fill="${INK}" opacity=".18"/><rect width="${n(w)}" height="74" rx="6" fill="${C.paper}" stroke="${INK}" stroke-width="2.6"/><rect x="14" y="-8" width="46" height="16" fill="#9fd3f5" opacity=".75" transform="rotate(-4 36 0)"/><rect x="${n(w - 64)}" y="-8" width="46" height="16" fill="#f7b5c8" opacity=".75" transform="rotate(5 ${n(w - 40)} 0)"/>${T(22, 25, 'CHAPTER ' + String(no).padStart(2, '0'), 13, { a: 'start', f: '#d2443a', ls: 3 })}${T(22, 60, title, 30, { a: 'start' })}</g>`;
  }
  function source(text, p) {
    const w = tw(text, 15) + 30;
    return `<g opacity="${n(Math.min(1, p * 2))}"><rect x="${n(1150 - w)}" y="86" width="${n(w)}" height="30" rx="15" fill="${C.paper}" stroke="${INK}" stroke-width="2"/>${T(1150 - w / 2, 106, text, 15, { f: '#6b4a36' })}</g>`;
  }
  function subtitle(en, ko, p) {
    if (!en && !ko) return '';
    const z = 23, lines = wrap(en, 58);
    const w = Math.min(980, Math.max(...lines.map((l) => tw(l, z)), tw(ko, z)) + 70);
    const h = 22 + lines.length * 30 + 32, y = H - h - 16, x = W / 2 - w / 2, dy = (1 - ease(Math.min(1, p * 4))) * 10;
    let g = `<g transform="translate(0,${n(dy)})" opacity="${n(Math.min(1, p * 5))}"><rect x="${n(x + 3)}" y="${n(y + 5)}" width="${n(w)}" height="${n(h)}" rx="18" fill="#101a38" opacity=".35"/><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="18" fill="${C.navy}" stroke="#16224a" stroke-width="2.5"/><rect x="${n(x + 7)}" y="${n(y + 7)}" width="${n(w - 14)}" height="${n(h - 14)}" rx="13" fill="none" stroke="#7f93c9" stroke-width="1.6" stroke-dasharray="6 5"/>`;
    lines.forEach((l, i) => { g += R(W / 2, y + 36 + i * 30, l, z, '#ffffff', '#ffd84d', { ls: .6 }); });
    g += R(W / 2, y + 36 + lines.length * 30 + 2, ko, z, C.yellow, '#ffffff', { ls: .6 });
    return g + '</g>';
  }
  function wrap(s, max) {
    if (!s) return [];
    const plain = String(s).replace(/\*/g, '');
    if (plain.length <= max) return [String(s)];
    // two balanced lines: break at the space closest to the middle of the visible text
    const words = String(s).split(' ');
    let best = 1, bestD = 1e9, acc = 0;
    for (let i = 0; i < words.length - 1; i++) { acc += words[i].replace(/\*/g, '').length + 1; const d = Math.abs(acc - plain.length / 2); if (d < bestD) { bestD = d; best = i + 1; } }
    return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }
  function panel(x, y, w, h, o) {
    o = o || {};
    let g = `<rect x="${x + 5}" y="${y + 6}" width="${w}" height="${h}" rx="12" fill="${INK}" opacity=".16"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${o.fill || C.paper}" stroke="${INK}" stroke-width="2.6"/>`;
    if (o.head) g += `<path d="M${x},${y + 12} Q${x},${y} ${x + 12},${y} L${x + w - 12},${y} Q${x + w},${y} ${x + w},${y + 12} L${x + w},${y + 34} L${x},${y + 34} Z" fill="${o.headFill || C.paper2}" stroke="${INK}" stroke-width="2.6"/>` + T(x + 16, y + 24, o.head, 17, { a: 'start', f: '#6b4a36' });
    return g;
  }
  function bubble(x, y, text, o) {
    o = o || {};
    const z = o.z || 22, w = tw(text, z) + 34, h = z + 22, tx = o.tail ? o.tail[0] : x, ty = o.tail ? o.tail[1] : y + h / 2 + 16;
    return `<g><path d="M${n(x - 10)},${n(y + h / 2 - 4)} L${n(tx)},${n(ty)} L${n(x + 12)},${n(y + h / 2 - 4)} Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2)}" fill="#fff" stroke="${INK}" stroke-width="2.4"/><rect x="${n(x - 12)}" y="${n(y + h / 2 - 5)}" width="24" height="5" fill="#fff"/>${R(x, y + z * .36, text, z, o.f || INK, o.hi || C.red)}</g>`;
  }
  function card(x, y, w, h, text, o) {
    o = o || {};
    const kind = o.kind || 'orig';
    const stripe = o.stripe || { orig: '#5b8def', gap: '#b9b2a8', risk: C.red, ok: '#2fb67a' }[kind];
    let g = `<rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="7" fill="${INK}" opacity=".16"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${kind === 'gap' ? '#f1eee8' : '#fffdf7'}" stroke="${kind === 'risk' ? C.red2 : INK}" stroke-width="${kind === 'risk' ? 2.8 : 2}"${kind === 'gap' ? ' stroke-dasharray="6 4"' : ''}/><rect x="${x}" y="${y}" width="7" height="${h}" rx="3" fill="${stripe}"/>`;
    g += T(x + 16, y + h / 2 + (o.z || 15) * .36, text, o.z || 15, { a: 'start', f: kind === 'gap' ? '#7a736b' : INK });
    if (o.badge) { const bw = tw(o.badge, 13) + 14; g += `<rect x="${n(x + w - bw + 6)}" y="${y - 10}" width="${n(bw)}" height="20" rx="10" fill="${o.badgeFill || (kind === 'risk' ? C.red : kind === 'ok' ? '#2fb67a' : '#f0a92a')}" stroke="${INK}" stroke-width="1.8"/>` + T(x + w - bw / 2 + 6, y + 5, o.badge, 13, { f: '#fff' }); }
    return g;
  }
  function kanban(x, y, w, h, cols, o) {
    o = o || {};
    const pad = 12, cw = (w - pad * (cols.length + 1)) / cols.length;
    let g = panel(x, y, w, h, { head: o.head });
    const top = y + (o.head ? 44 : pad);
    cols.forEach(([title, color, light], i) => {
      const cx = x + pad + i * (cw + pad);
      g += `<rect x="${n(cx)}" y="${n(top)}" width="${n(cw)}" height="${n(y + h - pad - top)}" rx="9" fill="${light}" stroke="${color}" stroke-width="2"/><rect x="${n(cx)}" y="${n(top)}" width="${n(cw)}" height="28" rx="9" fill="${color}"/>` + T(cx + cw / 2, top + 20, title, 16, { f: '#fff' });
      if (o.glow === i) g += `<rect x="${n(cx - 4)}" y="${n(top - 4)}" width="${n(cw + 8)}" height="${n(y + h - pad - top + 8)}" rx="12" fill="none" stroke="${color}" stroke-width="4" opacity=".6"/>`;
    });
    return { svg: g, colX: (i) => x + pad + i * (cw + pad), colW: cw, top: top + 36 };
  }
  const KCOLS = [['분해 Decomposed', '#5b8def', '#dbe7ff'], ['검증 Verifying', '#f0a92a', '#ffefcc'], ['게이트 Gate', '#e0352b', '#ffd9d3'], ['검증완료 Verified', '#2fb67a', '#d3f2e3']];
  function meter(x, y, v, o) {
    o = o || {};
    const Hh = o.H || 190, Wd = 34, bot = y + Hh, hot = v >= 70, fc = hot ? C.red : '#2fb67a', lvl = (Hh - 24) * v / 100;
    let g = `<rect x="${x - 56}" y="${y - 46}" width="112" height="32" rx="7" fill="${C.paper}" stroke="${INK}" stroke-width="2.4"/>${T(x, y - 23, o.label || 'RISK', 20)}`;
    g += `<rect x="${x - Wd / 2}" y="${y}" width="${Wd}" height="${Hh}" rx="${Wd / 2}" fill="#fff" stroke="${INK}" stroke-width="2.6"/><rect x="${x - Wd / 2 + 7}" y="${n(bot - lvl - 6)}" width="${Wd - 14}" height="${n(lvl + 10)}" rx="6" fill="${fc}"/>`;
    for (let i = 0; i <= 10; i++) { const yy = bot - 12 - (Hh - 24) * i / 10; g += `<line x1="${x + Wd / 2 - 10}" y1="${n(yy)}" x2="${x + Wd / 2 - 3}" y2="${n(yy)}" stroke="${INK}" stroke-width="1.8"/>`; }
    const y70 = bot - 12 - (Hh - 24) * .7;
    g += `<line x1="${x - Wd / 2 - 16}" y1="${n(y70)}" x2="${x + Wd / 2 + 16}" y2="${n(y70)}" stroke="${C.red}" stroke-width="3" stroke-dasharray="6 5"/>${T(x + Wd / 2 + 32, y70 + 6, '70', 18, { f: C.red })}`;
    g += `<circle cx="${x}" cy="${bot + 26}" r="32" fill="${fc}" stroke="${INK}" stroke-width="2.6"/>${T(x, bot + 35, String(Math.round(v)), 26, { f: '#fff', stroke: INK, sw: 4 })}`;
    return g;
  }
  function gate(x, y, ang, len) {
    len = len || 220; let s = ''; for (let i = 12; i < len - 6; i += 26) s += `<rect x="${i}" y="-9" width="13" height="18" fill="${C.red}"/>`;
    return `<rect x="${x - 13}" y="${y - 118}" width="26" height="118" fill="#7b64b8" stroke="${INK}" stroke-width="2.6"/><rect x="${x - 26}" y="${y - 12}" width="52" height="12" fill="#4a5078" stroke="${INK}" stroke-width="2.2"/><g transform="translate(${x},${y - 98}) rotate(${n(-ang)})"><rect x="0" y="-9" width="${len}" height="18" rx="7" fill="#fff"/>${s}<rect x="0" y="-9" width="${len}" height="18" rx="7" fill="none" stroke="${INK}" stroke-width="2.6"/></g><circle cx="${x}" cy="${y - 98}" r="11" fill="${C.yellow}" stroke="${INK}" stroke-width="2.2"/>`;
  }
  function stampMark(x, y, text, p, rot) {
    if (p <= 0) return '';
    const s = 1.6 - .6 * ease(Math.min(1, p * 3)), w = tw(text, 30) + 30;
    return `<g transform="translate(${x},${y}) rotate(${rot || -10}) scale(${n(s * 1000) / 1000})" opacity="${n(Math.min(1, p * 4))}"><rect x="${n(-w / 2)}" y="-26" width="${n(w)}" height="52" rx="8" fill="none" stroke="${C.red}" stroke-width="4"/><rect x="${n(-w / 2 + 6)}" y="-20" width="${n(w - 12)}" height="40" rx="5" fill="none" stroke="${C.red}" stroke-width="1.6"/>${T(0, 10, text, 30, { f: C.red })}</g>`;
  }
  function star(x, y, r, f) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push(n(x + rr * Math.cos(a)) + ',' + n(y + rr * Math.sin(a))); } return `<polygon points="${p.join(' ')}" fill="${f || C.yellow}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`; }
  function burst(x, y, r, text, o) {
    o = o || {}; const p = [];
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rr = i % 2 ? r * .74 : r; p.push(n(x + rr * Math.cos(a)) + ',' + n(y + rr * Math.sin(a))); }
    return `<polygon points="${p.join(' ')}" fill="${o.fill || C.yellow}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` + T(x, y + (o.z || r * .4) * .36, text, o.z || r * .4, { f: o.f || INK, r: o.r });
  }
  function confetti(t, t0, count, seed, area) {
    if (t < t0) return '';
    const r = rng(seed), cs = ['#f062a8', C.yellow, '#2fb67a', '#5b8def', '#f08a3e', '#a86af2'];
    let g = '';
    for (let i = 0; i < count; i++) {
      const x0 = area[0] + r() * (area[2] - area[0]), sp = 60 + r() * 90, ph = r() * 6, y = area[1] + ((t - t0) * sp + r() * 200) % (area[3] - area[1]);
      g += `<rect x="${n(x0 + Math.sin((t + ph) * 2) * 14)}" y="${n(y)}" width="10" height="5" rx="1" fill="${cs[i % cs.length]}" transform="rotate(${n((t * 120 + ph * 60) % 360)} ${n(x0)} ${n(y)})"/>`;
    }
    return g;
  }
  function browser(x, y, w, h, url, inner) {
    return `<rect x="${x + 5}" y="${y + 6}" width="${w}" height="${h}" rx="12" fill="${INK}" opacity=".16"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fff" stroke="${INK}" stroke-width="2.6"/><path d="M${x},${y + 12} Q${x},${y} ${x + 12},${y} L${x + w - 12},${y} Q${x + w},${y} ${x + w},${y + 12} L${x + w},${y + 30} L${x},${y + 30} Z" fill="${C.paper2}" stroke="${INK}" stroke-width="2.6"/><circle cx="${x + 16}" cy="${y + 15}" r="5" fill="#f06a5a"/><circle cx="${x + 32}" cy="${y + 15}" r="5" fill="${C.yellow}"/><circle cx="${x + 48}" cy="${y + 15}" r="5" fill="#2fb67a"/><rect x="${x + 64}" y="${y + 6}" width="${Math.min(300, w - 90)}" height="18" rx="9" fill="#fff" stroke="${INK}" stroke-width="1.4"/>${T(x + 76, y + 19, url, 12, { a: 'start', font: "'IBM Plex Mono', monospace", w: 500, f: '#6b4a36' })}<g transform="translate(${x},${y + 30})">${inner || ''}</g>`;
  }
  function chip(x, y, text, color, o) {
    o = o || {}; const z = o.z || 18, w = tw(text, z) + 28;
    return `<rect x="${n(x - w / 2)}" y="${n(y - z)}" width="${n(w)}" height="${n(z * 1.7)}" rx="${n(z * .85)}" fill="${color}" stroke="${INK}" stroke-width="2.2"/>` + T(x, y + z * .18, text, z, { f: o.f || '#fff', stroke: o.f ? null : INK, sw: 3 });
  }
  function arrow(x1, y1, x2, y2, o) {
    o = o || {}; const a = Math.atan2(y2 - y1, x2 - x1);
    return `<path d="M${x1},${y1} L${n(x2 - 14 * Math.cos(a))},${n(y2 - 14 * Math.sin(a))}" stroke="${o.c || INK}" stroke-width="${o.w || 3.4}" ${o.dash === false ? '' : 'stroke-dasharray="10 7"'} stroke-linecap="round" fill="none"/><path d="M${n(x2 - 18 * Math.cos(a - .5))},${n(y2 - 18 * Math.sin(a - .5))} L${x2},${y2} L${n(x2 - 18 * Math.cos(a + .5))},${n(y2 - 18 * Math.sin(a + .5))}" fill="none" stroke="${o.c || INK}" stroke-width="${o.w || 3.4}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  root.Kit = { W, H, FLOOR, STAND, INK, C, HAND, esc, n, clamp, k, ease, back, pop, bob, rng, tw, T, R, at, cloud, sparkle, backdrop, curtains, audience, noa, crew, uchu, partyHat, prop, chapterTag, source, subtitle, wrap, panel, bubble, card, kanban, KCOLS, meter, gate, stampMark, star, burst, confetti, browser, chip, arrow };
})(window);
