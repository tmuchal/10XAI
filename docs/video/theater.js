/* Harness Theater — shared drawing kit for the 10XAI video series.
 *
 * Every scene is plain SVG markup built from these helpers, in a bright
 * watercolor-theater style: sunburst backdrop, red curtains, wooden stage,
 * boxy ^ ^ agent characters, and the host Dr. Harness: a hip hamster in sunglasses, snapback and gold chain.
 *
 *   Theater.install()                     // once per page: fonts' fallbacks + <defs>
 *   Theater.scene({ w, h, st, draw, en, ko, subY, hook })  → "<svg …>…</svg>"
 *
 * Canvas sizes used by the series (logical units, exported at 2×):
 *   16:9 long-form   960 × 540
 *    9:16 reels      540 × 960
 *    4:5 card news   540 × 675
 */
(function (root) {
  const INK = '#3a2418';
  const FONT = "Gaegu, 'Gowun Dodum', sans-serif";
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = (v) => +(+v).toFixed(1);
  const T = (x, y, s, z, o) => { o = o || {}; z = z || 20; return `<text x="${n(x)}" y="${n(y)}" font-size="${n(z)}" text-anchor="${o.a || 'middle'}" fill="${o.f || INK}" font-family="${o.font || FONT}" font-weight="${o.w || 700}"${o.r ? ` transform="rotate(${o.r} ${n(x)} ${n(y)})"` : ''}${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 6}" paint-order="stroke" stroke-linejoin="round"` : ''}>${esc(s)}</text>`; };
  const G = (s, extra) => `<g filter="url(#ink)"${extra || ''}>${s}</g>`; // #ink uses a 20% margin; keep text inside its shape
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function shade(hex, amt) { // amt −1..1 : darken..lighten
    const c = parseInt(hex.slice(1), 16); let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    const f = (v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  const textW = (s, z) => { let w = 0; for (const ch of String(s).replace(/\*/g, '')) w += /[ᄀ-￿]/.test(ch) ? z * .96 : (ch === ' ' ? z * .3 : z * .52); return w; };

  /* ---------- defs ---------- */
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <filter id="ink" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="ink2" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="ink3" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="17" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="wash" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="fuzz" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.25  0 0 0 0 0.14  0 0 0 0.14 0"/></filter>
  <radialGradient id="sun" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="#fffdf0"/><stop offset=".45" stop-color="#ffecb8"/><stop offset="1" stop-color="#ffcfb0"/></radialGradient>
  <radialGradient id="sheet" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#ffe7bf"/></radialGradient>
  </defs></svg>`;
  function install() { if (!document.getElementById('ink')) document.body.insertAdjacentHTML('afterbegin', DEFS); }

  /* ---------- set ---------- */
  let clipN = 0;
  function stage(o) {
    o = o || {}; const w = o.w || 960, h = o.h || 540, fy = o.floorY || Math.round(h * (w < h ? .7 : .793)), cid = 'bd' + (++clipN);
    let g = `<defs><clipPath id="${cid}"><rect x="0" y="0" width="${w}" height="${fy + 2}"/></clipPath></defs><rect width="${w}" height="${h}" fill="#fff4dc"/>`;
    g += `<g clip-path="url(#${cid})"><g filter="url(#wash)"><rect x="-20" y="-30" width="${w + 40}" height="${fy + 60}" fill="url(#sun)"/>`;
    const cx = w / 2, cy = h * .28, R = Math.max(w, h) * 1.2;
    for (let i = 0; i < 18; i++) { const a0 = i / 18 * Math.PI * 2, a1 = a0 + Math.PI / 18;
      g += `<polygon points="${n(cx)},${n(cy)} ${n(cx + R * Math.cos(a0))},${n(cy + R * Math.sin(a0))} ${n(cx + R * Math.cos(a1))},${n(cy + R * Math.sin(a1))}" fill="${i % 2 ? '#ffc4b0' : '#fff3b8'}" opacity="${i % 2 ? .32 : .6}"/>`; }
    g += `<ellipse cx="${n(w * .24)}" cy="${n(h * .2)}" rx="${n(w * .18)}" ry="${n(h * .17)}" fill="#ffb3c1" opacity=".22" filter="url(#soft)"/><ellipse cx="${n(w * .8)}" cy="${n(h * .55)}" rx="${n(w * .2)}" ry="${n(h * .18)}" fill="#bfe8e0" opacity=".3" filter="url(#soft)"/><ellipse cx="${n(w * .58)}" cy="${n(h * .1)}" rx="${n(w * .15)}" ry="${n(h * .1)}" fill="#fffef4" opacity=".7" filter="url(#soft)"/>`;
    g += `</g>`;
    if (o.bg) g += o.bg;
    if (o.night) g += `<rect width="${w}" height="${fy}" fill="#3b4f8f" opacity=".42"/>`;
    g += `</g>`;
    g += `<polygon points="0,${fy} ${w},${fy} ${w},${h} 0,${h}" fill="#eaa865"/>`;
    for (let i = -9; i <= 9; i++) g += `<line x1="${n(cx + i * w / 15)}" y1="${fy}" x2="${n(cx + i * w / 12)}" y2="${h}" stroke="#c98543" stroke-width="2" opacity=".5"/>`;
    g += `<line x1="0" y1="${n(fy + (h - fy) * .45)}" x2="${w}" y2="${n(fy + (h - fy) * .45)}" stroke="#c98543" stroke-width="1.5" opacity=".35"/><line x1="0" y1="${fy}" x2="${w}" y2="${fy}" stroke="${INK}" stroke-width="3"/>`;
    if (o.night) g += `<rect y="${fy}" width="${w}" height="${h - fy}" fill="#3b4f8f" opacity=".25"/>`;
    if (o.spots) o.spots.forEach((x) => { g += `<polygon points="${x - 26},0 ${x + 26},0 ${x + w * .13},${fy + 34} ${x - w * .13},${fy + 34}" fill="#fffbe0" opacity=".38"/><ellipse cx="${x}" cy="${fy + 34}" rx="${n(w * .13)}" ry="16" fill="#fffbe0" opacity=".45"/>`; });
    return g;
  }
  function curtains(o) {
    o = o || {}; const w = o.w || 960, h = o.h || 540;
    const kx = w >= h ? w / 960 : w / 960 * 1.25, ky = h / 540, vs = 'vector-effect="non-scaling-stroke"';
    const half = `<g transform="scale(${n(kx * 1000) / 1000},${n(ky * 1000) / 1000})"><path d="M0,0 L118,0 C96,90 88,180 102,262 C84,330 62,430 74,540 L0,540 Z" fill="#e0473c" stroke="${INK}" stroke-width="3" ${vs}/>
      <path d="M34,0 C28,110 38,210 46,262 C34,350 28,450 30,540" fill="none" stroke="#a82b25" stroke-width="3" opacity=".75" ${vs}/>
      <path d="M76,0 C66,110 68,200 80,262 C62,340 52,440 54,540" fill="none" stroke="#a82b25" stroke-width="3" opacity=".75" ${vs}/>
      <path d="M12,0 L14,540" stroke="#ff8a7a" stroke-width="7" opacity=".35" ${vs}/></g>
      <rect x="${n(72 * kx)}" y="${n(261 * ky - 9)}" width="${n(Math.max(34, 48 * kx))}" height="18" rx="9" fill="#ffc23d" stroke="${INK}" stroke-width="2.5"/>`;
    const vh = Math.max(18, 18 * Math.min(kx, ky) * 1.1), step = 64;
    let v = `M0,0 L${w},0 L${w},${n(vh)}`; for (let x = w; x > 0; x -= step) v += ` Q${n(x - step / 2)},${n(vh + 28)} ${n(Math.max(0, x - step))},${n(vh)}`; v += ' Z';
    return G(`${half}<g transform="translate(${w},0) scale(-1,1)">${half}</g><path d="${v}" fill="#c9362f" stroke="${INK}" stroke-width="3"/>`);
  }
  /* Bilingual subtitle: English line (ink) over Korean line (vermilion) on a paper strip.
     Wrap key tokens in *asterisks* to highlight them in both lines (e.g. 'Risk *72*', '위험도 *72점*'). */
  function sub2(en, ko, o) {
    o = o || {}; if (!en && !ko) return ''; const w = o.w || 960, h = o.h || 540;
    const z1 = o.z1 || (w < h ? 24 : 26), z2 = o.z2 || (w < h ? 21 : 22);
    const bw = Math.min(w - 28, Math.max(textW(en || '', z1), textW(ko || '', z2)) + 44);
    const bh = (en ? z1 * 1.2 : 0) + (ko ? z2 * 1.25 : 0) + 18, y = o.y != null ? o.y : h - bh - 16, x = o.cx != null ? o.cx : w / 2;
    let g = `<rect x="${n(x - bw / 2 + 4)}" y="${n(y + 5)}" width="${n(bw)}" height="${n(bh)}" rx="12" fill="${INK}" opacity=".9"/><rect x="${n(x - bw / 2)}" y="${n(y)}" width="${n(bw)}" height="${n(bh)}" rx="12" fill="#fffdf5" stroke="${INK}" stroke-width="3"/>`;
    let yy = y + 9;
    if (en) { yy += z1; g += rich(x, yy - 2, en, z1, '#23243a', o.hi || '#e0357a'); }
    if (ko) { yy += z2 * 1.2; g += rich(x, yy - 4, ko, z2, '#d4432f', o.hiKo || '#1f8a6e'); }
    return g;
  }
  /* Text with *key words* highlighted (color + slightly larger), used by subtitles. */
  function rich(x, y, s, z, f, hi) {
    const parts = String(s).split('*');
    const spans = parts.map((p, i) => i % 2 ? `<tspan fill="${hi}" font-size="${n(z * 1.12)}">${esc(p)}</tspan>` : esc(p)).join('');
    return `<text x="${n(x)}" y="${n(y)}" font-size="${n(z)}" text-anchor="middle" fill="${f}" font-family="${FONT}" font-weight="700">${spans}</text>`;
  }
  /* Big hook headline (reels / card news): thick ink outline, yellow fill. */
  function hook(lines, o) {
    o = o || {}; const w = o.w || 540, z = o.z || 46, y = o.y || 110, f = o.f || '#ffd23f';
    return lines.map((l, i) => T(w / 2, y + i * z * 1.08, l, z, { f, stroke: INK, sw: o.sw || 9, r: o.r })).join('');
  }

  /* ---------- characters ---------- */
  function face(x, top, s, h, m, sw, blush) {
    const ey = top + h * .36, dx = s * .18, er = s * .065, my = top + h * .56;
    const st = `fill="none" stroke="${INK}" stroke-width="${n(sw)}" stroke-linecap="round" stroke-linejoin="round"`;
    const up = (c) => `<path d="M${n(c - er)},${n(ey + er * .55)} L${n(c)},${n(ey - er * .6)} L${n(c + er)},${n(ey + er * .55)}" ${st}/>`;
    const dot = (c) => `<circle cx="${n(c)}" cy="${n(ey)}" r="${n(s * .036)}" fill="${INK}"/>`;
    const smile = `<path d="M${n(x - s * .08)},${n(my)} Q${n(x)},${n(my + s * .1)} ${n(x + s * .08)},${n(my)}" ${st}/>`;
    const oh = `<ellipse cx="${n(x)}" cy="${n(my + s * .03)}" rx="${n(s * .035)}" ry="${n(s * .045)}" ${st}/>`;
    let g = '';
    if (m === 'happy') g = up(x - dx) + up(x + dx) + smile;
    else if (m === 'worried') { const sx = x + s * .4, sy = top + h * .1; g = dot(x - dx) + dot(x + dx) + `<path d="M${n(x - s * .1)},${n(my + s * .04)} q${n(s * .05)},${n(-s * .05)} ${n(s * .1)},0 t${n(s * .1)},0" ${st}/><path d="M${n(sx)},${n(sy)} C${n(sx + s * .05)},${n(sy + s * .07)} ${n(sx + s * .04)},${n(sy + s * .12)} ${n(sx)},${n(sy + s * .12)} C${n(sx - s * .04)},${n(sy + s * .12)} ${n(sx - s * .05)},${n(sy + s * .07)} ${n(sx)},${n(sy)} Z" fill="#9ad3ee" stroke="${INK}" stroke-width="1.8"/>`; }
    else if (m === 'dizzy') { for (const c of [x - dx, x + dx]) g += `<path d="M${n(c - er)},${n(ey - er)} L${n(c + er)},${n(ey + er)} M${n(c + er)},${n(ey - er)} L${n(c - er)},${n(ey + er)}" ${st}/>`; g += oh; }
    else if (m === 'alert') { for (const c of [x - dx, x + dx]) g += `<circle cx="${n(c)}" cy="${n(ey)}" r="${n(s * .075)}" fill="#fffaf0" stroke="${INK}" stroke-width="${n(sw * .8)}"/><circle cx="${n(c + s * .015)}" cy="${n(ey + s * .01)}" r="${n(s * .032)}" fill="${INK}"/>`; g += oh; }
    else if (m === 'sleep') { for (const c of [x - dx, x + dx]) g += `<path d="M${n(c - er)},${n(ey)} Q${n(c)},${n(ey + er * .9)} ${n(c + er)},${n(ey)}" ${st}/>`; g += `<path d="M${n(x - s * .03)},${n(my + s * .03)} L${n(x + s * .03)},${n(my + s * .03)}" ${st}/>`; }
    else if (m === 'cool') { g = `<path d="M${n(x - s * .34)},${n(ey - s * .04)} L${n(x + s * .34)},${n(ey - s * .04)}" stroke="${INK}" stroke-width="${n(sw)}"/>`; for (const c of [x - dx, x + dx]) g += `<rect x="${n(c - s * .11)}" y="${n(ey - s * .06)}" width="${n(s * .22)}" height="${n(s * .13)}" rx="${n(s * .04)}" fill="#1d1c26"/><path d="M${n(c - s * .07)},${n(ey - s * .03)} l${n(s * .04)},0" stroke="#fffaf0" stroke-width="2"/>`; g += `<path d="M${n(x - s * .13)},${n(my - s * .01)} Q${n(x)},${n(my + s * .15)} ${n(x + s * .13)},${n(my - s * .01)} Z" fill="#fffaf0" stroke="${INK}" stroke-width="${n(sw * .9)}" stroke-linejoin="round"/>`; }
    else if (m === 'sheepish') { g = up(x - dx) + up(x + dx) + `<path d="M${n(x - s * .06)},${n(my + s * .03)} L${n(x + s * .06)},${n(my + s * .03)}" ${st}/>`; blush = true; }
    else if (m === 'star') { for (const c of [x - dx, x + dx]) g += star(c, ey, s * .075, '#ffd23f'); g += `<path d="M${n(x - s * .1)},${n(my - s * .01)} Q${n(x)},${n(my + s * .14)} ${n(x + s * .1)},${n(my - s * .01)} Z" fill="#c9362f" stroke="${INK}" stroke-width="${n(sw * .8)}"/>`; blush = true; }
    if (blush) g += `<ellipse cx="${n(x - s * .29)}" cy="${n(my)}" rx="${n(s * .065)}" ry="${n(s * .035)}" fill="#f07f86" opacity=".65"/><ellipse cx="${n(x + s * .29)}" cy="${n(my)}" rx="${n(s * .065)}" ry="${n(s * .035)}" fill="#f07f86" opacity=".65"/>`;
    return g;
  }
  function box(x, fy, s, o) {
    o = o || {}; s = s || 80;
    const h = s * .66, lh = s * .16, top = fy - lh - h, L = x - s / 2;
    const c = o.c || '#f08a3e', hi = o.hi || shade(c, .38), lc = o.lc || shade(c, -.2), sw = Math.max(2.4, s * .034);
    let g = '';
    for (const p of [-.4, -.27, .17, .3]) g += `<rect x="${n(x + p * s)}" y="${n(fy - lh - 3)}" width="${n(s * .09)}" height="${n(lh + 3)}" fill="${lc}" stroke="${INK}" stroke-width="${n(sw)}"/>`;
    if (o.arms !== 'none') { const u = o.arms === 'down' ? -1 : 1, ay = top + h * .42;
      g += `<path d="M${n(L + 3)},${n(ay)} l${n(-s * .15)},${n(-s * .13 * u)} l${n(s * .07)},${n(s * .2 * u)} z" fill="${c}" stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"/>`;
      g += `<path d="M${n(L + s - 3)},${n(ay)} l${n(s * .15)},${n(-s * .13 * u)} l${n(-s * .07)},${n(s * .2 * u)} z" fill="${c}" stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"/>`; }
    g += `<rect x="${n(L)}" y="${n(top)}" width="${n(s)}" height="${n(h)}" rx="${n(s * .05)}" fill="${c}" stroke="${INK}" stroke-width="${n(sw * 1.15)}"${o.dash ? ' stroke-dasharray="9 6"' : ''}/>`;
    g += `<rect x="${n(L + s * .09)}" y="${n(top + h * .1)}" width="${n(s * .46)}" height="${n(h * .3)}" rx="${n(s * .06)}" fill="${hi}" opacity=".6"/>`;
    if (o.harness) { const by = top + h * .74; g += `<rect x="${n(L - 2)}" y="${n(by)}" width="${n(s + 4)}" height="${n(s * .09)}" fill="#6b3f22" stroke="${INK}" stroke-width="${n(sw * .8)}"/><rect x="${n(x - s * .07)}" y="${n(by - s * .02)}" width="${n(s * .14)}" height="${n(s * .13)}" rx="2" fill="#ffd23f" stroke="${INK}" stroke-width="${n(sw * .8)}"/>`; }
    g += face(x, top, s, h, o.mood || 'happy', sw, o.blush);
    if (o.label) g += T(x, top + h * .92, o.label, s * .14, { f: '#fffaf0' });
    if (o.tag) { const tw = String(o.tag).length * s * .095 + s * .2, th = s * .21, ty = top + h * .7; g += `<rect x="${n(x - tw / 2)}" y="${n(ty)}" width="${n(tw)}" height="${n(th)}" rx="3" fill="#fffaf0" stroke="${INK}" stroke-width="2"/>` + T(x, ty + th * .76, o.tag, s * .16); }
    if (o.hat) { const hx = x + s * .2; g += `<path d="M${n(hx - s * .12)},${n(top + sw)} L${n(hx)},${n(top - s * .33)} L${n(hx + s * .12)},${n(top + sw)} Z" fill="${o.hat === true ? '#f7a8c0' : o.hat}" stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"/><path d="M${n(hx - s * .07)},${n(top - s * .1)} L${n(hx + s * .075)},${n(top - s * .12)}" stroke="#fffaf0" stroke-width="${n(sw)}"/><circle cx="${n(hx)}" cy="${n(top - s * .34)}" r="${n(s * .045)}" fill="#ffd23f" stroke="${INK}" stroke-width="${n(sw * .7)}"/>`; }
    if (o.crown) { const cx0 = x - s * .15, cw = s * .3, ct = top - s * .2; g += `<path d="M${n(cx0)},${n(top + 2)} L${n(cx0)},${n(ct)} L${n(cx0 + cw * .25)},${n(ct + s * .09)} L${n(cx0 + cw * .5)},${n(ct - s * .03)} L${n(cx0 + cw * .75)},${n(ct + s * .09)} L${n(cx0 + cw)},${n(ct)} L${n(cx0 + cw)},${n(top + 2)} Z" fill="#ffd23f" stroke="${INK}" stroke-width="${n(sw)}" stroke-linejoin="round"/>`; }
    if (o.mag) { const d = o.mag === 'l' ? -1 : 1, lx = x + d * s * .78, ly = top - s * .06, lr = s * .19;
      g += `<line x1="${n(x + d * s * .6)}" y1="${n(top + h * .22)}" x2="${n(lx - d * lr * .7)}" y2="${n(ly + lr * .7)}" stroke="${INK}" stroke-width="${n(s * .07)}" stroke-linecap="round"/><circle cx="${n(lx)}" cy="${n(ly)}" r="${n(lr)}" fill="#d9f1f4" fill-opacity=".75" stroke="${INK}" stroke-width="${n(sw * 1.2)}"/><path d="M${n(lx - lr * .5)},${n(ly - lr * .2)} Q${n(lx - lr * .4)},${n(ly - lr * .55)} ${n(lx - lr * .05)},${n(ly - lr * .6)}" stroke="#fffaf0" stroke-width="${n(sw)}" fill="none" stroke-linecap="round"/>`; }
    if (o.carry) { const cw = s * .7, ch = s * .42, cy = top - ch - s * .08; g += card(x - cw / 2, cy, cw, ch, o.carry, { kind: o.carryKind, small: true }); }
    if (o.extra) g += o.extra;
    return G(g, o.rot ? ` transform="rotate(${o.rot} ${n(x)} ${n(fy - s * .4)})"` : '');
  }
  const PAL = {
    orange: { c: '#f08a3e' }, gold: { c: '#f2c14e', hi: '#fff0a8', lc: '#c99a2a' }, red: { c: '#e5533f' }, teal: { c: '#39b3b0' },
    gray: { c: '#bdb7ae', dash: true }, blue: { c: '#4f8ef7' }, amber: { c: '#f7a928' }, green: { c: '#2fbf8a' }, pink: { c: '#f062a8' }, purple: { c: '#a86af2' }, rose: { c: '#f25a6e' }
  };
  /* 10XAI agents as characters. Colors match agents/*.md frontmatter. */
  const AGENTS = {
    orchestrator: { name: 'Orchestrator', ko: '오케스트레이터', c: '#f25a6e', prop: 'baton', crown: true },
    decompose: { name: 'Decompose', ko: '분해', c: '#4f8ef7', prop: 'scissors' },
    gapfill: { name: 'Gap-fill', ko: '빈칸 채우기', c: '#f7a928', prop: 'pencil' },
    verify: { name: 'Verify', ko: '검증', c: '#e5533f', prop: 'mag' },
    router: { name: 'Router', ko: '라우터', c: '#8b6cf2', prop: 'sign' },
    runner: { name: 'Exec runner', ko: '실행', c: '#2fbf8a', prop: 'watch' },
    repair: { name: 'Repair', ko: '수리', c: '#f062a8', prop: 'wrench' },
    deploy: { name: 'Deploy', ko: '배포', c: '#a86af2', prop: 'package' }
  };
  function agent(role, x, fy, s, o) {
    o = o || {}; const a = AGENTS[role]; s = s || 80; const h = s * .66, top = fy - s * .16 - h, px = x + s * .66, py = top + s * .05;
    let p = '';
    if (a.prop === 'scissors') p = `<g transform="rotate(-30 ${n(px)} ${n(py)})"><ellipse cx="${n(px - s * .08)}" cy="${n(py + s * .12)}" rx="${n(s * .06)}" ry="${n(s * .05)}" fill="none" stroke="${INK}" stroke-width="3"/><ellipse cx="${n(px + s * .08)}" cy="${n(py + s * .12)}" rx="${n(s * .06)}" ry="${n(s * .05)}" fill="none" stroke="${INK}" stroke-width="3"/><path d="M${n(px - s * .05)},${n(py + s * .07)} L${n(px + s * .04)},${n(py - s * .16)} M${n(px + s * .05)},${n(py + s * .07)} L${n(px - s * .04)},${n(py - s * .16)}" stroke="#9aa0ad" stroke-width="${n(s * .045)}" stroke-linecap="round"/></g>`;
    else if (a.prop === 'pencil') p = `<g transform="rotate(35 ${n(px)} ${n(py)})"><rect x="${n(px - s * .04)}" y="${n(py - s * .2)}" width="${n(s * .08)}" height="${n(s * .3)}" fill="#ffd23f" stroke="${INK}" stroke-width="2.5"/><path d="M${n(px - s * .04)},${n(py + s * .1)} L${n(px)},${n(py + s * .18)} L${n(px + s * .04)},${n(py + s * .1)} Z" fill="#f3cda4" stroke="${INK}" stroke-width="2"/><rect x="${n(px - s * .04)}" y="${n(py - s * .25)}" width="${n(s * .08)}" height="${n(s * .06)}" fill="#f7a8c0" stroke="${INK}" stroke-width="2"/></g>`;
    else if (a.prop === 'baton') p = `<line x1="${n(x + s * .6)}" y1="${n(top + s * .12)}" x2="${n(px + s * .16)}" y2="${n(py - s * .2)}" stroke="${INK}" stroke-width="${n(s * .04)}" stroke-linecap="round"/>` + star(px + s * .18, py - s * .24, s * .07, '#ffd23f');
    else if (a.prop === 'sign') p = `<line x1="${n(px)}" y1="${n(py + s * .15)}" x2="${n(px)}" y2="${n(py - s * .22)}" stroke="#8a5a2b" stroke-width="${n(s * .05)}"/><path d="M${n(px - s * .02)},${n(py - s * .24)} h${n(s * .2)} l${n(s * .06)},${n(s * .05)} l${n(-s * .06)},${n(s * .05)} h${n(-s * .2)} Z" fill="#fffaf0" stroke="${INK}" stroke-width="2.5"/>`;
    else if (a.prop === 'watch') p = `<circle cx="${n(px)}" cy="${n(py)}" r="${n(s * .12)}" fill="#fffaf0" stroke="${INK}" stroke-width="3"/><line x1="${n(px)}" y1="${n(py)}" x2="${n(px + s * .05)}" y2="${n(py - s * .07)}" stroke="#e5533f" stroke-width="3" stroke-linecap="round"/><rect x="${n(px - s * .025)}" y="${n(py - s * .17)}" width="${n(s * .05)}" height="${n(s * .05)}" fill="#9aa0ad" stroke="${INK}" stroke-width="1.5"/>`;
    else if (a.prop === 'wrench') p = `<g transform="rotate(40 ${n(px)} ${n(py)})"><rect x="${n(px - s * .03)}" y="${n(py - s * .12)}" width="${n(s * .06)}" height="${n(s * .3)}" rx="3" fill="#9aa0ad" stroke="${INK}" stroke-width="2.5"/><path d="M${n(px - s * .08)},${n(py - s * .12)} a${n(s * .08)},${n(s * .08)} 0 1 1 ${n(s * .16)},0 l${n(-s * .05)},0 l0,${n(-s * .05)} l${n(-s * .06)},0 l0,${n(s * .05)} Z" fill="#9aa0ad" stroke="${INK}" stroke-width="2.5"/></g>`;
    else if (a.prop === 'package') p = `<rect x="${n(px - s * .12)}" y="${n(py - s * .12)}" width="${n(s * .24)}" height="${n(s * .2)}" fill="#e2b577" stroke="${INK}" stroke-width="2.5"/><rect x="${n(px - s * .02)}" y="${n(py - s * .12)}" width="${n(s * .04)}" height="${n(s * .2)}" fill="#e5533f"/>`;
    const opts = Object.assign({ c: a.c, crown: a.crown, mag: a.prop === 'mag' ? 'r' : undefined, extra: a.prop === 'mag' ? '' : p, label: o.noLabel ? undefined : a.name }, o);
    return box(x, fy, s, opts);
  }
  /* Dr. Harness: a hip golden hamster. Black sunglasses, backwards snapback, gold "10X" chain,
     oversized hoodie, chunky sneakers.
     Options: m ('smile'|'o'|'grin'|'flat'), la/ra (paw positions), q, bang, flip, eyes (sunglasses pushed up). */
  function doc(x, fy, sc, o) {
    o = o || {}; sc = sc || 1;
    const la = o.la || [-34, -46], ra = o.ra || [34, -46], FUR = '#f0a64a', CREAM = '#fff1d6', PINK = '#f7a1a8';
    const HOOD = o.hoodie || '#7c5cff', HOOD2 = shade(HOOD, -.18), HOOD3 = shade(HOOD, .25), CAP = o.cap || '#e5533f', GOLD = '#ffc23d';
    let g = '';
    // hood behind the head + hoodie body
    g += `<ellipse cx="0" cy="-88" rx="30" ry="12" fill="${HOOD2}" stroke="${INK}" stroke-width="2.5"/>`;
    g += `<path d="M-33,-12 Q-46,-54 -28,-88 L28,-88 Q46,-54 33,-12 Q0,-4 -33,-12 Z" fill="${HOOD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    g += `<path d="M-18,-40 Q-18,-30 -10,-28 L10,-28 Q18,-30 18,-40 Z" fill="${HOOD3}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M-30,-15 Q0,-8 30,-15" fill="none" stroke="${HOOD2}" stroke-width="4"/>`;
    g += `<path d="M-7,-86 L-9,-62 M7,-86 L9,-62" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/><circle cx="-9" cy="-61" r="2.4" fill="#ffffff" stroke="${INK}" stroke-width="1"/><circle cx="9" cy="-61" r="2.4" fill="#ffffff" stroke="${INK}" stroke-width="1"/>`;
    // sneakers
    for (const sx of [-1, 1]) g += `<g transform="translate(${sx * 14},0)"><path d="M-15,-2 L-15,-9 Q-15,-17 -6,-17 L4,-17 Q14,-15 15,-7 L15,-2 Z" fill="#ffffff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><rect x="-16" y="-5" width="32" height="5" rx="2" fill="#e8e3dc" stroke="${INK}" stroke-width="2"/><path d="M-8,-11 Q0,-7 8,-12" fill="none" stroke="${CAP}" stroke-width="3" stroke-linecap="round"/></g>`;
    // gold chain + pendant
    g += `<path d="M-19,-87 Q-12,-66 0,-64 Q12,-66 19,-87" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/><path d="M-19,-87 Q-12,-66 0,-64 Q12,-66 19,-87" fill="none" stroke="${GOLD}" stroke-width="3.2" stroke-dasharray="3 1.6" stroke-linecap="round"/>`;
    g += `<rect x="-12" y="-66" width="24" height="15" rx="4" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><text x="0" y="-54.5" font-size="10.5" text-anchor="middle" fill="${INK}" font-family="${FONT}" font-weight="700"${o.flip ? ' transform="scale(-1,1)"' : ''}>10X</text>`;
    // sleeves + paws
    for (const [sx, a] of [[-24, la], [24, ra]]) g += `<path d="M${sx},-78 L${a[0]},${a[1]}" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M${sx},-78 L${a[0]},${a[1]}" stroke="${HOOD}" stroke-width="10" stroke-linecap="round"/><circle cx="${a[0]}" cy="${a[1]}" r="6.5" fill="${PINK}" stroke="${INK}" stroke-width="2"/>`;
    // backwards cap brim peeks out behind the head
    g += `<path d="M14,-146 Q34,-160 46,-150 Q40,-142 22,-140 Z" fill="${shade(CAP, -.2)}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
    // head
    g += `<ellipse cx="0" cy="-110" rx="35" ry="31" fill="${FUR}" stroke="${INK}" stroke-width="3"/>`;
    g += `<ellipse cx="-23" cy="-100" rx="14" ry="12" fill="${CREAM}" stroke="${INK}" stroke-width="2"/><ellipse cx="23" cy="-100" rx="14" ry="12" fill="${CREAM}" stroke="${INK}" stroke-width="2"/><ellipse cx="0" cy="-99" rx="14" ry="11" fill="${CREAM}"/><ellipse cx="-24" cy="-97" rx="6" ry="3.5" fill="#f07f86" opacity=".6"/><ellipse cx="24" cy="-97" rx="6" ry="3.5" fill="#f07f86" opacity=".6"/>`;
    g += `<path d="M-30,-101 l-14,-3 M-30,-97 l-15,2 M30,-101 l14,-3 M30,-97 l15,2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
    g += `<ellipse cx="0" cy="-106" rx="4.5" ry="3.2" fill="#e8747c" stroke="${INK}" stroke-width="1.5"/>`;
    // snapback dome (worn backwards: the strap opening sits on the forehead)
    g += `<path d="M-31,-121 Q-32,-152 0,-153 Q32,-152 31,-121 Q0,-129 -31,-121 Z" fill="${CAP}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><path d="M0,-153 L0,-125" stroke="${shade(CAP, -.25)}" stroke-width="1.6"/><circle cx="0" cy="-153" r="3" fill="${shade(CAP, -.25)}" stroke="${INK}" stroke-width="1.5"/>`;
    g += `<path d="M-9,-123 Q0,-134 9,-123 Z" fill="${FUR}" stroke="${INK}" stroke-width="2"/><rect x="-7" y="-127" width="14" height="3.4" rx="1.5" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/>`;
    // ears poke out below the cap
    g += `<circle cx="-32" cy="-128" r="10" fill="${FUR}" stroke="${INK}" stroke-width="2.5"/><circle cx="-32" cy="-128" r="5" fill="${PINK}"/><circle cx="32" cy="-128" r="10" fill="${FUR}" stroke="${INK}" stroke-width="2.5"/><circle cx="32" cy="-128" r="5" fill="${PINK}"/>`;
    const m = o.m || 'smile';
    if (m === 'o') g += `<ellipse cx="0" cy="-95" rx="4" ry="5" fill="#8a2f2a" stroke="${INK}" stroke-width="1.8"/><rect x="-3" y="-100" width="6" height="4" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
    else if (m === 'grin') g += `<path d="M-10,-100 Q0,-85 10,-100 Z" fill="#8a2f2a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><rect x="-3.5" y="-100" width="7" height="5" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
    else if (m === 'flat') g += `<path d="M-5,-99 L5,-99" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    else g += `<path d="M-7,-101 q3.5,4 7,0 q3.5,4 7,0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M4,-101 q5,1 8,-3" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (o.eyes) {
      g += `<circle cx="-12" cy="-112" r="5.5" fill="${INK}"/><circle cx="12" cy="-112" r="5.5" fill="${INK}"/><circle cx="-10.5" cy="-114" r="1.8" fill="#fff"/><circle cx="13.5" cy="-114" r="1.8" fill="#fff"/>`;
      g += `<g transform="translate(0,-12) rotate(-6)"><rect x="-27" y="-128" width="23" height="14" rx="5" fill="#15151c" stroke="${INK}" stroke-width="2"/><rect x="4" y="-128" width="23" height="14" rx="5" fill="#15151c" stroke="${INK}" stroke-width="2"/><path d="M-4,-122 L4,-122" stroke="${INK}" stroke-width="2.5"/></g>`;
    } else {
      g += `<path d="M-36,-114 L-27,-115 M27,-115 L36,-114" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><rect x="-28" y="-121" width="24" height="15" rx="6" fill="#15151c" stroke="${INK}" stroke-width="2.2"/><rect x="4" y="-121" width="24" height="15" rx="6" fill="#15151c" stroke="${INK}" stroke-width="2.2"/><path d="M-4,-115 Q0,-118 4,-115" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M-24,-117 l7,0 M8,-117 l7,0" stroke="#9fb4ff" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`;
    }
    if (o.q) g += `<text x="38" y="-156" font-size="38" fill="#3b7fd0" font-family="${FONT}" font-weight="700" transform="rotate(14 38 -156)">?</text><text x="52" y="-178" font-size="22" fill="#3b7fd0" font-family="${FONT}" font-weight="700">?</text>`;
    if (o.bang) g += `<text x="38" y="-156" font-size="40" fill="#e5533f" font-family="${FONT}" font-weight="700" transform="rotate(10 38 -156)">!</text>`;
    return G(`<g transform="translate(${x},${fy}) scale(${o.flip ? -sc : sc},${sc})">${g}</g>`);
  }
  /* Uchu (우츄): the viewer who believes every viral post. Red hooded suit with round ear pods,
     antenna stalks holding fuzzy red "uchu" lettering, a green watercolor face, and a big shocked O mouth.
     Options: m ('shock'|'smile'|'grin'|'squint'), la/ra (mitten positions), bang, sweat, flip, label. */
  function uchu(x, fy, sc, o) {
    o = o || {}; sc = sc || 1;
    const RED = '#e8322b', RED2 = '#b8211c', RED3 = '#ff6a5c', GRN = '#5fae3a', GRN2 = '#9ad06a', GRN3 = '#3f8a26';
    const la = o.la || [-40, -44], ra = o.ra || [40, -44];
    let g = `<ellipse cx="-17" cy="-5" rx="17" ry="7" fill="${RED2}" stroke="${INK}" stroke-width="2.5"/><ellipse cx="17" cy="-5" rx="17" ry="7" fill="${RED2}" stroke="${INK}" stroke-width="2.5"/>`;
    g += `<path d="M-40,-8 Q-50,-58 -30,-96 L30,-96 Q50,-58 40,-8 Q0,0 -40,-8 Z" fill="${RED}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-26,-84 Q-34,-56 -28,-30" fill="none" stroke="${RED3}" stroke-width="6" stroke-linecap="round" opacity=".7"/>`;
    for (const [sx, a] of [[-26, la], [26, ra]]) g += `<path d="M${sx},-80 L${a[0]},${a[1]}" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M${sx},-80 L${a[0]},${a[1]}" stroke="${RED}" stroke-width="11" stroke-linecap="round"/><circle cx="${a[0]}" cy="${a[1]}" r="8" fill="${RED2}" stroke="${INK}" stroke-width="2"/>`;
    // antenna stalks + fuzzy lettering
    g += `<path d="M-15,-168 Q-22,-184 -26,-198 M15,-168 Q22,-184 26,-198" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M-15,-168 Q-22,-184 -26,-198 M15,-168 Q22,-184 26,-198" fill="none" stroke="${RED}" stroke-width="4.5" stroke-linecap="round"/>`;
    g += `<g filter="url(#fuzz)"><text x="0" y="-198" font-size="46" text-anchor="middle" font-family="${FONT}" font-weight="700" fill="${RED}" stroke="${RED2}" stroke-width="5" paint-order="stroke" stroke-linejoin="round"${o.flip ? ' transform="scale(-1,1)"' : ''}>uchu</text></g>`;
    // hood + ear pods
    g += `<circle cx="-45" cy="-126" r="16" fill="${RED}" stroke="${INK}" stroke-width="2.8"/><circle cx="-47" cy="-130" r="6" fill="${RED3}" opacity=".7"/><circle cx="45" cy="-126" r="16" fill="${RED}" stroke="${INK}" stroke-width="2.8"/><circle cx="43" cy="-130" r="6" fill="${RED3}" opacity=".7"/>`;
    g += `<circle cx="0" cy="-128" r="45" fill="${RED}" stroke="${INK}" stroke-width="3"/><path d="M-28,-160 Q-14,-172 4,-172" fill="none" stroke="${RED3}" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
    // green face with watercolor streaks
    g += `<ellipse cx="0" cy="-122" rx="31" ry="35" fill="${GRN}" stroke="${INK}" stroke-width="2.8"/><ellipse cx="-15" cy="-124" rx="5" ry="15" fill="${GRN2}" opacity=".75"/><ellipse cx="15" cy="-126" rx="5" ry="13" fill="${GRN2}" opacity=".7"/><ellipse cx="-4" cy="-146" rx="12" ry="4" fill="${GRN2}" opacity=".5"/><ellipse cx="10" cy="-98" rx="8" ry="4" fill="${GRN3}" opacity=".45"/><ellipse cx="-20" cy="-104" rx="4" ry="6" fill="${GRN3}" opacity=".4"/>`;
    const m = o.m || 'shock';
    if (m === 'squint') g += `<path d="M-18,-136 l7,-4 l7,4 M4,-136 l7,-4 l7,4" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    else for (const ex of [-11, 11]) g += `<ellipse cx="${ex}" cy="-136" rx="7.5" ry="6.5" fill="#ffffff" stroke="${INK}" stroke-width="2"/><circle cx="${ex + (o.look || 0)}" cy="-135.5" r="3.8" fill="#7a4a2a"/><circle cx="${ex + (o.look || 0)}" cy="-135.5" r="1.8" fill="${INK}"/><circle cx="${ex + 1.4 + (o.look || 0)}" cy="-137" r="1" fill="#fff"/>`;
    if (m === 'shock') g += `<path d="M-20,-146 q5,-5 11,-2 M9,-148 q6,-3 11,2" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    g += `<circle cx="-3" cy="-121" r="1.8" fill="${INK}"/><circle cx="3" cy="-121" r="1.8" fill="${INK}"/>`;
    if (m === 'shock') g += `<ellipse cx="0" cy="-104" rx="10.5" ry="13.5" fill="#8a1f1f" stroke="${INK}" stroke-width="2.4"/><ellipse cx="0" cy="-97" rx="6.5" ry="4.5" fill="#f07f86"/><rect x="-6" y="-116" width="12" height="3" rx="1.5" fill="#fff"/>`;
    else if (m === 'grin') g += `<path d="M-12,-110 Q0,-94 12,-110 Z" fill="#8a1f1f" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><rect x="-7" y="-110" width="14" height="3.5" rx="1.5" fill="#fff"/>`;
    else g += `<path d="M-9,-108 Q0,-100 9,-108" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    if (o.sweat) g += `<path d="M28,-150 C33,-143 33,-137 28,-137 C23,-137 23,-143 28,-150 Z" fill="#9ad3ee" stroke="${INK}" stroke-width="1.6"/>`;
    if (o.bang) g += `<text x="46" y="-170" font-size="44" fill="#e5533f" font-family="${FONT}" font-weight="700" transform="rotate(12 46 -170)" stroke="#fff" stroke-width="4" paint-order="stroke">!!</text>`;
    let out = G(`<g transform="translate(${x},${fy}) scale(${o.flip ? -sc : sc},${sc})">${g}</g>`);
    if (o.label) out += T(x, fy + 22 * sc, o.label, 16 * sc, { f: '#fff', stroke: INK, sw: 4 });
    return out;
  }
  const hand = (x, fy, sc, a, flip) => [x + a[0] * sc * (flip ? -1 : 1), fy + a[1] * sc];

  /* ---------- props ---------- */
  function card(x, y, w, h, text, o) {
    o = o || {}; const k = o.kind || 'orig';
    const stripe = { orig: '#4f8ef7', gap: '#bdb7ae', risk: '#e5533f', ok: '#2fbf8a', amber: '#f7a928' }[k] || '#4f8ef7';
    const z = o.z || Math.max(11, Math.min(h * .34, 18));
    let g = `<rect x="${n(x + 3)}" y="${n(y + 4)}" width="${n(w)}" height="${n(h)}" rx="5" fill="${INK}" opacity=".18"/><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="5" fill="${k === 'gap' ? '#f1efe9' : '#fffdf6'}" stroke="${k === 'risk' ? '#c9362f' : INK}" stroke-width="${k === 'risk' ? 3 : 2}"${k === 'gap' ? ' stroke-dasharray="6 4"' : ''}/><rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(5, w * .06))}" height="${n(h)}" rx="3" fill="${stripe}"/>`;
    if (text) g += T(x + w * .08 + 6, y + h / 2 + z * .35, text, z, { a: 'start', f: k === 'gap' ? '#6f6a63' : INK, font: "Gaegu, 'Gowun Dodum', sans-serif" });
    if (o.badge) { const bw = textW(o.badge, 13) + 12; g += `<rect x="${n(x + w - bw - 5)}" y="${n(y - 9)}" width="${n(bw)}" height="18" rx="9" fill="${k === 'risk' ? '#e5533f' : k === 'ok' ? '#2fbf8a' : '#f7a928'}" stroke="${INK}" stroke-width="1.8"/>` + T(x + w - bw / 2 - 5, y + 4.5, o.badge, 13, { f: '#fff' }); }
    return o.small ? g : G(g);
  }
  /* Kanban board prop. cols: [[title, color, [cards…]], …]; card = {t, k, b} */
  function kanban(x, y, w, h, cols, o) {
    o = o || {}; const pad = 12, cw = (w - pad * (cols.length + 1)) / cols.length;
    let g = `<rect x="${x + 5}" y="${y + 7}" width="${w}" height="${h}" rx="12" fill="${INK}" opacity=".2"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fffaf0" stroke="${INK}" stroke-width="3"/>`;
    if (o.title) g += T(x + w / 2, y + 26, o.title, 20, { f: '#6b3f22' });
    const top0 = y + (o.title ? 38 : pad);
    cols.forEach(([t, c, cards], i) => {
      const cx = x + pad + i * (cw + pad), hl = o.hl === undefined || o.hl === i;
      g += `<rect x="${n(cx)}" y="${n(top0)}" width="${n(cw)}" height="${n(y + h - pad - top0)}" rx="8" fill="${c}" opacity="${hl ? .32 : .14}" stroke="${c}" stroke-width="2"/><rect x="${n(cx)}" y="${n(top0)}" width="${n(cw)}" height="26" rx="8" fill="${c}"/>` + T(cx + cw / 2, top0 + 19, t, Math.min(17, cw / 7), { f: '#fff' });
      const ch = o.cardH || 30;
      (cards || []).forEach((cd, j) => { g += card(cx + 6, top0 + 36 + j * (ch + 10), cw - 12, ch, cd.t, { kind: cd.k, badge: cd.b, small: true }); });
    });
    return G(g);
  }
  const COLS = [['Decomposed', '#4f8ef7'], ['Verifying', '#f7a928'], ['Gate / Review', '#e5533f'], ['Verified', '#2fbf8a']];
  function sign(x, y, w, lines, o) {
    o = o || {}; const z = o.z || 26, lh = z * 1.2, h = lines.length * lh + 22;
    let g = '';
    if (o.hang) g += `<line x1="${n(x - w / 2 + 16)}" y1="${y}" x2="${n(x - w / 2 + 16)}" y2="0" stroke="${INK}" stroke-width="2"/><line x1="${n(x + w / 2 - 16)}" y1="${y}" x2="${n(x + w / 2 - 16)}" y2="0" stroke="${INK}" stroke-width="2"/>`;
    if (o.stick) g += `<line x1="${x}" y1="${n(y + h - 4)}" x2="${o.stick[0]}" y2="${o.stick[1]}" stroke="#8a5a2b" stroke-width="9" stroke-linecap="round"/>`;
    g += `<rect x="${n(x - w / 2)}" y="${y}" width="${w}" height="${n(h)}" rx="7" fill="${o.fill || '#fffdf5'}" stroke="${INK}" stroke-width="3"/>`;
    lines.forEach((l, i) => g += T(x, y + 11 + z + i * lh, l, i === 1 && o.z2 ? o.z2 : z, { f: i === 1 && o.f2 ? o.f2 : o.f }));
    return G(g, o.r ? ` transform="rotate(${o.r} ${x} ${n(y + h / 2)})"` : '');
  }
  function bubble(x, y, w, lines, tail, o) {
    o = o || {}; const z = o.z || 24, lh = z * 1.15, h = lines.length * lh + 22;
    let g = `<polygon points="${x - 14},${n(y + h - 6)} ${x + 14},${n(y + h - 6)} ${tail[0]},${tail[1]}" fill="#ffffff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    g += `<rect x="${n(x - w / 2)}" y="${y}" width="${w}" height="${n(h)}" rx="${n(Math.min(h / 2, 26))}" fill="#ffffff" stroke="${INK}" stroke-width="3"/><polygon points="${x - 11},${n(y + h - 4)} ${x + 11},${n(y + h - 4)} ${x},${n(y + h + 2)}" fill="#ffffff"/>`;
    lines.forEach((l, i) => g += T(x, y + 11 + z * .95 + i * lh, l, i === 1 && o.z2 ? o.z2 : z, { f: i === 1 && o.f2 ? o.f2 : o.f }));
    return G(g);
  }
  function meter(x, y, v, o) {
    o = o || {}; const H = o.H || 200, W = 36, r = 34, bot = y + H, hot = v >= 70, fc = hot ? '#e5533f' : '#2fbf8a', lvl = (H - 24) * v / 100;
    let g = `<rect x="${x - 62}" y="${y - 50}" width="124" height="36" rx="5" fill="#fff0c8" stroke="${INK}" stroke-width="3"/>${T(x, y - 24, o.label || 'RISK', 24)}`;
    g += `<rect x="${x - W / 2}" y="${y}" width="${W}" height="${H}" rx="${W / 2}" fill="#ffffff" stroke="${INK}" stroke-width="3"/><rect x="${x - W / 2 + 7}" y="${n(bot - lvl - 6)}" width="${W - 14}" height="${n(lvl + 10)}" rx="6" fill="${fc}"/>`;
    for (let i = 0; i <= 10; i++) { const yy = bot - 12 - (H - 24) * i / 10; g += `<line x1="${x + W / 2 - 11}" y1="${n(yy)}" x2="${x + W / 2 - 3}" y2="${n(yy)}" stroke="${INK}" stroke-width="2"/>`; }
    const y70 = bot - 12 - (H - 24) * .7;
    g += `<line x1="${x - W / 2 - 18}" y1="${n(y70)}" x2="${x + W / 2 + 18}" y2="${n(y70)}" stroke="#c9362f" stroke-width="3" stroke-dasharray="6 5"/>${T(x + W / 2 + 36, y70 + 7, '70', 20, { f: '#c9362f' })}`;
    g += `<circle cx="${x}" cy="${bot + r - 8}" r="${r}" fill="${fc}" stroke="${INK}" stroke-width="3"/>${T(x, bot + r + 1, String(v), 28, { f: '#fff', stroke: INK, sw: 4 })}`;
    return G(g);
  }
  function pump(x, by, pushed, to) {
    const hy = pushed ? by - 176 : by - 222; let g = '';
    if (to) g += `<path d="M${x + 24},${by - 22} C${x + 90},${by + 6} ${to[0] - 80},${to[1] + 50} ${to[0]},${to[1]}" fill="none" stroke="#2c2e47" stroke-width="8" stroke-linecap="round"/>`;
    g += `<rect x="${x - 72}" y="${by - 14}" width="144" height="14" rx="3" fill="#4a5078" stroke="${INK}" stroke-width="2.5"/><line x1="${x}" y1="${by - 150}" x2="${x}" y2="${hy}" stroke="#9aa0ad" stroke-width="7"/>`;
    g += `<rect x="${x - 24}" y="${by - 152}" width="48" height="140" rx="12" fill="#39b3b0" stroke="${INK}" stroke-width="3"/><rect x="${x - 14}" y="${by - 140}" width="10" height="110" rx="5" fill="#a5e6e3" opacity=".7"/><rect x="${x - 26}" y="${by - 160}" width="52" height="14" rx="4" fill="#4a5078" stroke="${INK}" stroke-width="2.5"/>`;
    g += `<rect x="${x - 46}" y="${hy - 12}" width="92" height="14" rx="7" fill="#4a5078" stroke="${INK}" stroke-width="2.5"/>`;
    return G(g);
  }
  function machine(x, fy, label) {
    let g = `<polygon points="${x - 105},${fy - 262} ${x + 105},${fy - 262} ${x + 42},${fy - 200} ${x - 42},${fy - 200}" fill="#dfe5ee" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    g += `<polygon points="${x + 113},${fy - 84} ${x + 190},${fy - 34} ${x + 190},${fy - 10} ${x + 113},${fy - 56}" fill="#8fc1dd" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    g += `<rect x="${x - 115}" y="${fy - 204}" width="230" height="198" rx="10" fill="#9fd0ea" stroke="${INK}" stroke-width="3"/><rect x="${x - 100}" y="${fy - 192}" width="70" height="120" rx="8" fill="#d2ecf8" opacity=".7"/>`;
    g += `<rect x="${x - 72}" y="${fy - 180}" width="144" height="46" rx="6" fill="#fffdf5" stroke="${INK}" stroke-width="3"/>` + T(x, fy - 146, label || '10XAI', 34);
    [-60, 0, 60].forEach((dx, i) => { g += `<circle cx="${x + dx}" cy="${fy - 88}" r="18" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/><line x1="${x + dx}" y1="${fy - 88}" x2="${x + dx + [10, -6, 12][i]}" y2="${fy - 88 - [8, 12, -4][i]}" stroke="#e5533f" stroke-width="3" stroke-linecap="round"/>`; });
    g += `<circle cx="${x + 92}" cy="${fy - 190}" r="7" fill="#e5533f" stroke="${INK}" stroke-width="2"/><rect x="${x - 100}" y="${fy - 8}" width="30" height="10" fill="${INK}"/><rect x="${x + 70}" y="${fy - 8}" width="30" height="10" fill="${INK}"/>`;
    return G(g);
  }
  function gate(x, fy, open, len) {
    len = len || 220; let s = ''; for (let i = 12; i < len - 6; i += 26) s += `<rect x="${i}" y="-9" width="13" height="18" fill="#e5533f"/>`;
    let g = `<rect x="${x - 14}" y="${fy - 120}" width="28" height="120" fill="#6d5aa8" stroke="${INK}" stroke-width="3"/><rect x="${x - 26}" y="${fy - 12}" width="52" height="12" fill="#4a5078" stroke="${INK}" stroke-width="2.5"/>`;
    g += `<g transform="translate(${x},${fy - 100}) rotate(${open ? -72 : 0})"><rect x="0" y="-9" width="${len}" height="18" rx="7" fill="#ffffff"/>${s}<rect x="0" y="-9" width="${len}" height="18" rx="7" fill="none" stroke="${INK}" stroke-width="3"/></g><circle cx="${x}" cy="${fy - 100}" r="11" fill="#ffc23d" stroke="${INK}" stroke-width="2.5"/>`;
    return G(g);
  }
  function sandbox(x, fy, w) {
    w = w || 360; const d = 70, r = rng(w * 7); let dots = '';
    for (let i = 0; i < 40; i++) { const px = x - w / 2 + 50 + r() * (w - 100), py = fy - d + 14 + r() * (d - 18); dots += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(1.5 + r() * 2)}" fill="#e0b565"/>`; }
    return G(`<polygon points="${x - w / 2},${fy} ${x + w / 2},${fy} ${x + w / 2 - 40},${fy - d} ${x - w / 2 + 40},${fy - d}" fill="#c98a52" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><polygon points="${x - w / 2 + 18},${fy - 6} ${x + w / 2 - 18},${fy - 6} ${x + w / 2 - 50},${fy - d + 10} ${x - w / 2 + 50},${fy - d + 10}" fill="#ffe09a"/>${dots}<rect x="${x - w / 2}" y="${fy}" width="${w}" height="16" fill="#ad6f3b" stroke="${INK}" stroke-width="3"/>`);
  }
  function fence(x1, x2, fy, ding) {
    let g = '';
    for (const yy of [fy - 62, fy - 32]) g += `<line x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><line x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}" stroke="#fff3dc" stroke-width="7" stroke-linecap="round"/>`;
    for (let px = x1; px <= x2; px += 85) g += `<rect x="${px - 7}" y="${fy - 84}" width="14" height="84" rx="3" fill="#fff3dc" stroke="${INK}" stroke-width="2.5"/>`;
    for (let bx = x1 + 42; bx < x2; bx += 85) { const hit = ding && Math.abs(bx - ding) < 43, rot = hit ? -22 : 0;
      g += `<g transform="rotate(${rot} ${bx} ${fy - 56})"><line x1="${bx}" y1="${fy - 56}" x2="${bx}" y2="${fy - 48}" stroke="${INK}" stroke-width="2"/><path d="M${bx - 10},${fy - 30} Q${bx - 10},${fy - 50} ${bx},${fy - 50} Q${bx + 10},${fy - 50} ${bx + 10},${fy - 30} Z" fill="#ffd23f" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${bx}" cy="${fy - 28}" r="3.5" fill="${INK}"/></g>`;
      if (hit) g += `<path d="M${bx - 30},${fy - 70} l-14,-10 M${bx + 26},${fy - 74} l12,-14 M${bx + 32},${fy - 44} l18,-2 M${bx - 34},${fy - 42} l-16,2" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` + T(bx + 8, fy - 94, 'DING!', 30, { f: '#e5533f', r: -8, stroke: '#fff', sw: 5 }); }
    return G(g);
  }
  function door(x, fy, locked) {
    let g = `<rect x="${x - 70}" y="${fy - 215}" width="140" height="36" rx="5" fill="#fffdf5" stroke="${INK}" stroke-width="3"/>` + T(x, fy - 189, 'PUBLISH', 22);
    g += `<rect x="${x - 56}" y="${fy - 172}" width="112" height="172" fill="#8f5b3a" stroke="${INK}" stroke-width="3"/><rect x="${x - 44}" y="${fy - 160}" width="88" height="160" fill="#c07d4c" stroke="${INK}" stroke-width="2.5"/><rect x="${x - 32}" y="${fy - 146}" width="64" height="52" fill="none" stroke="#8f5b3a" stroke-width="3"/><rect x="${x - 32}" y="${fy - 80}" width="64" height="62" fill="none" stroke="#8f5b3a" stroke-width="3"/><circle cx="${x + 30}" cy="${fy - 88}" r="5" fill="#ffc23d" stroke="${INK}" stroke-width="2"/>`;
    if (locked) { const px = x + 30, py = fy - 78; g += `<path d="M${px - 9},${py} v-10 a9,9 0 0 1 18,0 v10" fill="none" stroke="#9aa0ad" stroke-width="6"/><rect x="${px - 14}" y="${py}" width="28" height="24" rx="4" fill="#ffc23d" stroke="${INK}" stroke-width="2.5"/><circle cx="${px}" cy="${py + 10}" r="3" fill="${INK}"/><rect x="${px - 1.5}" y="${py + 10}" width="3" height="8" fill="${INK}"/>`; }
    return G(g);
  }
  function rope(x1, y1, x2, y2, label, sag) {
    sag = sag === undefined ? 30 : sag; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag * 2;
    let g = `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="#e2bd86" stroke-width="2" stroke-dasharray="4 7"/>`;
    if (label) g += T(mx, (y1 + y2) / 2 + sag + (sag < 0 ? -10 : 24), label, 19, { f: '#6b3f22' });
    return G(g);
  }
  function board(x, y, w, h, rows, legs) {
    let g = legs === false ? '' : `<line x1="${x + 34}" y1="${y + h}" x2="${x + 14}" y2="${y + h + 150}" stroke="#8f5b3a" stroke-width="8"/><line x1="${x + w - 34}" y1="${y + h}" x2="${x + w - 14}" y2="${y + h + 150}" stroke="#8f5b3a" stroke-width="8"/>`;
    g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#8f5b3a" stroke="${INK}" stroke-width="3"/><rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="3" fill="#2f5a4a"/>`;
    rows.forEach(([t, c, z], i) => g += T(x + 26, y + 48 + i * 40, t, z || 26, { a: 'start', f: c }));
    return G(g);
  }
  function banner(y, text, o) {
    o = o || {}; const w = o.w || 960, z = o.z || 46, hw = Math.min(w * .3, Math.max(textW(text, z) / 2 + 40, 120)), x1 = w / 2 - hw, x2 = w / 2 + hw, h = z * 1.65;
    let g = `<polygon points="${x1 - 70},${y + 20} ${x1 + 12},${y + 20} ${x1 + 12},${y + h + 20} ${x1 - 70},${y + h + 20} ${x1 - 46},${y + 20 + h / 2}" fill="#e8ad2f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><polygon points="${x2 + 70},${y + 20} ${x2 - 12},${y + 20} ${x2 - 12},${y + h + 20} ${x2 + 70},${y + h + 20} ${x2 + 46},${y + 20 + h / 2}" fill="#e8ad2f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    g += `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="${h}" fill="${o.fill || '#ffd23f'}" stroke="${INK}" stroke-width="3"/><polygon points="${x1},${y + h} ${x1 + 12},${y + h + 20} ${x1 + 12},${y + h}" fill="#9c7418"/><polygon points="${x2},${y + h} ${x2 - 12},${y + h + 20} ${x2 - 12},${y + h}" fill="#9c7418"/>`;
    g += T(w / 2, y + h / 2 + z * .36, text, z);
    return G(g);
  }
  function pkg(x, fy, s, label) {
    const h = s * .8, top = fy - h;
    return G(`<rect x="${n(x - s / 2)}" y="${n(top)}" width="${s}" height="${n(h)}" rx="4" fill="#e2b577" stroke="${INK}" stroke-width="3"/><rect x="${n(x - s * .06)}" y="${n(top)}" width="${n(s * .12)}" height="${n(h)}" fill="#e5533f"/><rect x="${n(x - s / 2)}" y="${n(top + h * .28)}" width="${s}" height="${n(s * .1)}" fill="#e5533f"/><ellipse cx="${n(x - s * .13)}" cy="${n(top - 7)}" rx="${n(s * .13)}" ry="${n(s * .07)}" fill="#e5533f" stroke="${INK}" stroke-width="2.5"/><ellipse cx="${n(x + s * .13)}" cy="${n(top - 7)}" rx="${n(s * .13)}" ry="${n(s * .07)}" fill="#e5533f" stroke="${INK}" stroke-width="2.5"/><rect x="${n(x - s * .36)}" y="${n(top + h * .55)}" width="${n(s * .72)}" height="${n(s * .22)}" rx="3" fill="#fffdf5" stroke="${INK}" stroke-width="2"/>` + T(x, top + h * .55 + s * .16, label, s * .15));
  }
  /* A flat laptop/browser mock for "screen recording" beats. inner is SVG in local coords (0..w, 0..h-28). */
  function browser(x, y, w, h, url, inner) {
    return `<g><rect x="${x + 6}" y="${y + 8}" width="${w}" height="${h}" rx="12" fill="${INK}" opacity=".22"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#ffffff" stroke="${INK}" stroke-width="3"/><rect x="${x}" y="${y}" width="${w}" height="28" rx="12" fill="#ffe9c4" stroke="${INK}" stroke-width="3"/><rect x="${x}" y="${y + 16}" width="${w}" height="12" fill="#ffe9c4"/><line x1="${x}" y1="${y + 28}" x2="${x + w}" y2="${y + 28}" stroke="${INK}" stroke-width="3"/><circle cx="${x + 16}" cy="${y + 14}" r="5" fill="#e5533f"/><circle cx="${x + 32}" cy="${y + 14}" r="5" fill="#ffc23d"/><circle cx="${x + 48}" cy="${y + 14}" r="5" fill="#2fbf8a"/><rect x="${x + 66}" y="${y + 6}" width="${Math.min(260, w - 90)}" height="16" rx="8" fill="#fffdf5" stroke="${INK}" stroke-width="1.5"/>${T(x + 76, y + 18, url || 'localhost:8080', 12, { a: 'start', font: "'IBM Plex Mono', monospace", w: 500, f: '#6b3f22' })}<g transform="translate(${x},${y + 28})">${inner || ''}</g></g>`;
  }
  function star(x, y, r, f) { f = f || '#ffd23f'; const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push(n(x + rr * Math.cos(a)) + ',' + n(y + rr * Math.sin(a))); } return `<polygon points="${p.join(' ')}" fill="${f}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`; }
  function burst(x, y, r, text, o) { o = o || {}; const p = []; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rr = i % 2 ? r * .72 : r; p.push(n(x + rr * Math.cos(a)) + ',' + n(y + rr * Math.sin(a))); } return G(`<polygon points="${p.join(' ')}" fill="${o.fill || '#ffd23f'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + T(x, y + (o.z || r * .38) * .36, text, o.z || r * .38, { f: o.f || INK, r: o.r })); }
  function motion(x, y, k, len, dir) { dir = dir || -1; let g = ''; for (let i = 0; i < k; i++) g += `<line x1="${x}" y1="${y + i * 14}" x2="${x + dir * len * (1 - i * .15)}" y2="${y + i * 14}" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`; return G(g); }
  function confetti(k, seed, area) { const r = rng(seed), cs = ['#f062a8', '#ffd23f', '#2fbf8a', '#4f8ef7', '#f08a3e', '#a86af2']; let g = ''; for (let i = 0; i < k; i++) { const x = area[0] + r() * (area[2] - area[0]), y = area[1] + r() * (area[3] - area[1]); g += `<rect x="${n(x)}" y="${n(y)}" width="11" height="5" rx="1" fill="${cs[i % cs.length]}" transform="rotate(${n(r() * 180)} ${n(x)} ${n(y)})"/>`; } return g; }
  function dice(x, y, s, rot) { const d = [[.3, .3], [.7, .7], [.5, .5], [.3, .7], [.7, .3]]; return G(`<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="${s * .18}" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/>${d.map(([a, b]) => `<circle cx="${n(x - s / 2 + a * s)}" cy="${n(y - s / 2 + b * s)}" r="${n(s * .08)}" fill="${INK}"/>`).join('')}</g>`); }
  function bomb(x, y) { return G(`<circle cx="${x}" cy="${y}" r="24" fill="#2b2b33" stroke="${INK}" stroke-width="3"/><rect x="${x - 8}" y="${y - 32}" width="16" height="10" fill="#555a66" stroke="${INK}" stroke-width="2"/><path d="M${x},${y - 32} q8,-18 22,-16" fill="none" stroke="#8a5a2b" stroke-width="3"/><circle cx="${x - 8}" cy="${y - 8}" r="5" fill="#fffaf0" opacity=".45"/>` + star(x + 24, y - 50, 11, '#ffd23f') + T(x, y + 8, 'prod', 15, { f: '#ffd23f' })); }
  function stopwatch(x, y) { return G(`<rect x="${x - 6}" y="${y - 36}" width="12" height="10" fill="#9aa0ad" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="27" fill="#ffffff" stroke="${INK}" stroke-width="3"/><line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y - 14}" stroke="#e5533f" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="3" fill="${INK}"/>`); }
  function coin(x, y) { return G(`<circle cx="${x}" cy="${y}" r="22" fill="#ffd23f" stroke="${INK}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#c99a2a" stroke-width="2"/>` + T(x, y + 8, '$', 22)); }
  function arrow(x1, y1, x2, y2, o) { o = o || {}; const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 18 * Math.cos(a), hy = y2 - 18 * Math.sin(a); return G(`<path d="M${x1},${y1} L${n(hx)},${n(hy)}" stroke="${o.c || INK}" stroke-width="${o.w || 4}" ${o.dash === false ? '' : 'stroke-dasharray="12 9"'} stroke-linecap="round"/><path d="M${n(x2 - 20 * Math.cos(a - .5))},${n(y2 - 20 * Math.sin(a - .5))} L${x2},${y2} L${n(x2 - 20 * Math.cos(a + .5))},${n(y2 - 20 * Math.sin(a + .5))}" fill="none" stroke="${o.c || INK}" stroke-width="${o.w || 4}" stroke-linecap="round" stroke-linejoin="round"/>`); }
  function phone(x, y, w, h, inner) { return `<g><rect x="${x + 5}" y="${y + 7}" width="${w}" height="${h}" rx="${w * .12}" fill="${INK}" opacity=".22"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * .12}" fill="#2c2e47" stroke="${INK}" stroke-width="3"/><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="${w * .09}" fill="#fffdf5"/><g transform="translate(${x + 6},${y + 6})">${inner || ''}</g><rect x="${x + w / 2 - 16}" y="${y + 10}" width="32" height="6" rx="3" fill="#2c2e47"/></g>`; }

  /* ---------- compose ---------- */
  function scene(o) {
    const w = o.w || 960, h = o.h || 540;
    const st = Object.assign({ w, h }, o.st || {});
    const body = (o.noStage ? `<rect width="${w}" height="${h}" fill="${o.bgColor || '#fff4dc'}"/>` : stage(st)) + (o.draw ? o.draw() : '') + (o.noCurtains || o.noStage ? '' : curtains({ w, h }));
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label || o.en || '')}" xmlns="http://www.w3.org/2000/svg"><g class="cam">${body}</g>${o.hook || ''}${sub2(o.en, o.ko, { w, h, y: o.subY, z1: o.z1, z2: o.z2, cx: o.subX })}<rect width="${w}" height="${h}" filter="url(#grain)" opacity=".5" style="mix-blend-mode:multiply" pointer-events="none"/></svg>`;
  }

  root.Theater = { INK, FONT, esc, n, T, G, rich, rng, shade, textW, install, stage, curtains, sub2, hook, face, box, PAL, AGENTS, agent, doc, uchu, hand, card, kanban, COLS, sign, bubble, meter, pump, machine, gate, sandbox, fence, door, rope, board, banner, pkg, browser, star, burst, motion, confetti, dice, bomb, stopwatch, coin, arrow, phone, scene };
})(window);
