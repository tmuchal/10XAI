// ---------------------------------------------------------------- 07 · Curtain call (184–192)
// The cast lines up, a title banner swings down, recap chips pop, the URL lights up on a
// marquee, confetti falls (deterministic), and everyone takes a bow before the curtains close.
const C07_INK = "#2b2320";
const c07_card = (bg = "#fffaf0", r = 16) => `background:${bg};border:3px solid ${C07_INK};border-radius:${r}px;box-shadow:7px 8px 0 rgba(43,35,32,.22)`;
const c07_abs = (css, html, parent) => el("div", "position:absolute;" + css, html, parent);
const c07_h = (i, k) => { const x = Math.sin(i * 91.345 + k * 47.853) * 24634.6345; return x - Math.floor(x); };
const c07_kick = (tau, a = 3, w = 6) => tau <= 0 ? 0 : Math.exp(-a * tau) * Math.sin(w * tau);
// bow: squash the body down/forward, arms swing to the front, eyes closed
function c07_bow(n, b) {
  if (b <= 0) return;
  n.P.b.setAttribute("transform", `translate(100 200) scale(${1 + .06 * b} ${1 - .24 * b}) skewX(${-4 * b}) translate(-100 -200)`);
  n.P.al.setAttribute("transform", `rotate(${-55 * b} 56 160)`); n.P.ar.setAttribute("transform", `rotate(${55 * b} 144 160)`);
  if (b > .4) { n.P.e1.setAttribute("d", "M70 105 Q80 112 90 105"); n.P.e2.setAttribute("d", "M110 105 Q120 112 130 105"); n.P.e1.setAttribute("fill", "none"); n.P.e2.setAttribute("fill", "none"); }
}

scene(184, 192, (R, s) => {
  s.caps = [[184.2, "다음 페이지의 주인공은, 당신의 브랜드", "The next hero is your brand"]];
  const INK = C07_INK; R.style.wordBreak = "keep-all";
  // warm spotlight behind the cast
  const spot = c07_abs("left:160px;top:380px;width:1600px;height:600px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,236,170,.95),rgba(255,236,170,0));z-index:0", "", R);
  // hanging title banner
  const ban = c07_abs("left:260px;top:0;width:1400px;height:300px;transform-origin:700px -60px;z-index:5", `
    <svg width="1400" height="80" style="position:absolute;left:0;top:-60px;overflow:visible"><path d="M160 0 L240 80 M1240 0 L1160 80" stroke="${INK}" stroke-width="4"/></svg>
    <div style="position:absolute;left:40px;top:36px;width:1320px;padding:12px 0 16px;text-align:center;${c07_card("#fbe3b0", 20)};white-space:nowrap">
      <div style="font-size:28px;letter-spacing:6px;color:#c8372d">CLAUDE × HIGGSFIELD · CURTAIN CALL</div>
      <div style="font-size:90px;line-height:1.05;margin-top:2px">사람을 붙잡는 브랜드 페이지</div>
      <div style="font-size:38px;color:#6b5d52">Brand pages that hold people</div></div>`, R);
  // recap chips
  const CH = [["업종 무관", "#fbe0c0"], ["고객이 주인공", "#f8d3df"], ["Soul ID 일관성", "#e3f2f8"], ["3초 · 스크롤 · 영상", "#fff3c4"], ["전문성 + 유머", "#d8ecd3"], ["버튼 → 매출", "#fde6ec"]];
  const chipRow = c07_abs("left:100px;top:272px;width:1720px;display:flex;justify-content:center;gap:14px;z-index:6", "", R);
  const chips = CH.map(([c, bg], i) => el("div", `padding:4px 18px 6px;font-size:34px;white-space:nowrap;${c07_card(bg, 999)};box-shadow:4px 5px 0 rgba(43,35,32,.22)`, c, chipRow));
  // URL marquee with light bulbs
  const MW = 1160, MH = 128, bl = [];
  for (let x = 40; x <= MW - 40; x += 72) { bl.push([x, 8]); bl.push([x, MH - 8]); }
  for (let y = 40; y <= MH - 40; y += 48) { bl.push([8, y]); bl.push([MW - 8, y]); }
  const mq = c07_abs(`left:${960 - MW / 2}px;top:350px;width:${MW}px;height:${MH}px;${c07_card("#c8372d", 22)};z-index:6`, `
    <div style="position:absolute;left:20px;top:18px;right:20px;bottom:18px;border-radius:14px;background:#fffaf0;border:3px solid ${INK};display:flex;align-items:center;justify-content:center;font-size:70px;white-space:nowrap">
      <span>noainostory</span><span style="color:#d4623a">.higgsfield.app</span></div>
    ${bl.map(k => `<div class="bulb" style="position:absolute;left:${k[0] - 7}px;top:${k[1] - 7}px;width:14px;height:14px;border-radius:50%;border:2px solid ${INK}"></div>`).join("")}`, R);
  const bulbs = [...mq.querySelectorAll(".bulb")];
  // cast: Noa in the middle, extras either side
  const noa = makeNoa(416); R.appendChild(noa);
  const EX = [[220, -1, 120], [470, -1, 340], [1194, 1, 1330], [1444, 1, 1540]]
    .map(([x, from, side]) => { const n = makeNoa(256, { party: true, scarf: null }); R.appendChild(n); return { n, x, from, side }; });
  const puff = c07_abs("left:0;top:0;width:0;height:0;z-index:35", Array.from({ length: 8 }, (_, i) => `<div style="position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;background:#fffaf0;border:3px solid ${INK}"></div>`).join(""), R);
  const puffs = [...puff.children];
  const spark = c07_abs("left:0;top:0;width:60px;height:60px;z-index:34", `<svg width="60" height="60" viewBox="-30 -30 60 60"><path d="M0 -28 L7 -7 L28 0 L7 7 L0 28 L-7 7 L-28 0 L-7 -7 Z" fill="#f7d774" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`, R);
  const bub = makeBubble(R);
  // flowers tossed onto the stage
  const roses = [0, 1, 2].map(i => c07_abs("left:0;top:0;width:60px;height:60px;z-index:32", `<svg width="60" height="60" viewBox="-30 -30 60 60">
    <path d="M0 4 L0 28" stroke="#3f8a4a" stroke-width="5" stroke-linecap="round"/><path d="M0 16 Q12 10 16 16 Q8 22 0 18" fill="#6fb36a" stroke="${INK}" stroke-width="2.5"/>
    <circle r="13" fill="#e0435b" stroke="${INK}" stroke-width="3"/><path d="M-6 -2 Q0 -10 6 -2 Q0 4 -6 -2" fill="none" stroke="${INK}" stroke-width="2"/></svg>`, R));
  // confetti
  const CC = ["#f2c14e", "#f08aa0", "#7cc3e0", "#9bd48a", "#d4623a", "#b9a0e8"];
  const conf = Array.from({ length: 80 }, (_, i) => {
    const w = 12 + 10 * c07_h(i, 1), h = 8 + 8 * c07_h(i, 2);
    const e = c07_abs(`left:0;top:0;width:${w}px;height:${h}px;background:${CC[i % 6]};border:2px solid ${INK};border-radius:${i % 3 === 0 ? 50 : 3}%;z-index:36`, "", R);
    return { e, x0: 130 + 1660 * c07_h(i, 3), t0: 185.3 + 3.2 * c07_h(i, 4), v: 150 + 130 * c07_h(i, 5), sw: 20 + 40 * c07_h(i, 6), ph: 6.28 * c07_h(i, 7), rs: 200 + 400 * c07_h(i, 8) };
  });

  return t => {
    // title banner swings down on its ropes
    const bd = seg(t, 184.4, 184.95), sw = c07_kick(t - 184.95, 1.6, 5.5);
    ban.style.transform = `translateY(${-420 * (1 - out(bd))}px) rotate(${6 * sw}deg)`;
    chips.forEach((c, i) => { const p = back(seg(t, 185.3 + i * .14, 185.7 + i * .14));
      c.style.opacity = clamp(p * 2); c.style.transform = `translateY(${-40 * (1 - p)}px) scale(${0.5 + 0.5 * p}) rotate(${(i % 2 ? 2.5 : -2.5) * (0.6 + 0.4 * Math.sin(t * 2 + i))}deg)`; });
    const mp = back(seg(t, 186.2, 186.7));
    mq.style.opacity = clamp(mp * 2); mq.style.transform = `scale(${0.4 + 0.6 * mp}) rotate(${-1.5 + 0.5 * Math.sin(t * 1.7)}deg)`;
    const lit = Math.floor(t * 6);
    bulbs.forEach((b, i) => { const on = t > 186.6 && (i + lit) % 3 !== 0;
      b.style.background = on ? "#fff3a0" : "#8a5a2b"; b.style.boxShadow = on ? "0 0 14px 4px rgba(255,230,120,.9)" : "none"; });
    spot.style.opacity = seg(t, 184.6, 185.6) * (0.75 + 0.25 * seg(t, 189.5, 191));
    // cast: walk in, line up, bow twice
    const bowAt = (tt, d) => { const a = seg(t, tt, tt + .35), z = seg(t, tt + .35 + d, tt + .75 + d); return ease(a) * (1 - ease(z)); };
    const nIn = out(seg(t, 184.5, 185.2));
    // Noa: wave, lower the sunglasses + wink, then poof away so the 3D bow owns centre stage (187–190), then pop back
    const gone = seg(t, 186.85, 187.1) * (1 - seg(t, 190.05, 190.3)), back2 = back(seg(t, 190.05, 190.45));
    const winkP = seg(t, 185.9, 186.15) * (1 - seg(t, 186.6, 186.8));
    poseNoa(noa, t, { x: 752, y: 466 + 460 * (1 - nIn), s: t > 190 ? Math.max(.01, back2) : Math.max(.01, 1 - gone), talk: t > 186.1 && t < 186.7,
      wave: (t > 185.3 && t < 185.9) || t > 190.4, hop: t > 185.2 && t < 185.9 ? (t - 185.2) / .7 : 0, blink: winkP < .5, op: gone >= 1 && t < 190.05 ? 0 : nIn });
    if (noa.P.sg) noa.P.sg.setAttribute("transform", `translate(0 ${24 * ease(winkP)}) rotate(${-5 * winkP} 100 98)`);
    if (winkP > .5) { noa.P.eye.style.display = ""; noa.P.e1.setAttribute("d", "M71 90 Q80 84 89 90"); noa.P.e1.setAttribute("fill", "none");
      noa.P.p1.style.display = ""; noa.P.p1.setAttribute("cx", 80); noa.P.p1.setAttribute("cy", 98); noa.P.p1.setAttribute("r", 7);
      noa.P.p2.style.display = "none"; noa.P.e2.setAttribute("d", "M110 99 Q120 106 130 99"); noa.P.e2.setAttribute("fill", "none"); }
    const sp = seg(t, 186.2, 186.7);
    spark.style.opacity = sp > 0 && sp < 1 ? Math.sin(sp * Math.PI) : 0; spark.style.transform = `translate(${1010}px, ${650}px) scale(${0.6 + 1.2 * sp}) rotate(${sp * 180}deg)`;
    const pf = t > 186.85 && t < 187.45 ? seg(t, 186.85, 187.45) : t > 190.05 && t < 190.65 ? seg(t, 190.05, 190.65) : -1;
    puffs.forEach((e, i) => { const a = i / 8 * 6.283, d = 60 + 200 * out(clamp(pf));
      e.style.opacity = pf < 0 ? 0 : 1 - pf; e.style.transform = `translate(${960 + Math.cos(a) * d}px, ${690 + Math.sin(a) * d * .6}px) scale(${1.8 - 1.2 * clamp(pf)})`; });
    EX.forEach(({ n, x, from, side }, i) => {
      const a = 184.7 + i * .15, w = ease(seg(t, a, a + 1.1)), walking = t > a && t < a + 1.1;
      const st = ease(seg(t, 186.9 + i * .05, 187.4 + i * .05));
      const xx = lerp(lerp(x + from * 700, x, w), side, st);
      const bw = Math.max(bowAt(188.0 + (i < 2 ? (1 - i) : i - 2) * .09 + .05, .45), bowAt(189.55 + .06 * i, .5));
      poseNoa(n, t + i * .3, { x: xx, y: 626, s: 1, look: -from * .5, flip: from > 0 && walking, hop: walking ? ((t - a) * 3.2) % 1 : (t > 186.9 && t < 187.5 ? (t - 186.9) / .6 : 0), wave: t > 190.2 && i % 2 === 0, op: seg(t, a, a + .2) });
      c07_bow(n, bw);
    });
    sayBubble(bub, t, 185.95, 186.85, "고마워요! 😎", 1130, 470);
    // roses land at the cast's feet
    roses.forEach((r, i) => {
      const a = 188.3 + i * .22, p = seg(t, a, a + .7), tx = [300, 1500, 1680][i], sx = [700, 1200, 1300][i];
      const x = lerp(sx, tx, p), y = lerp(960, 850, p) - 360 * 4 * p * (1 - p);
      r.style.opacity = t > a ? 1 : 0; r.style.transform = `translate(${x - 30}px, ${y - 30}px) rotate(${(1 - p) * 540 + [20, -30, 60][i]}deg)`;
    });
    // confetti: falls, sways, flips (deterministic)
    conf.forEach(c => {
      const tau = t - c.t0; if (tau < 0) { c.e.style.opacity = 0; return; }
      const y = 30 + tau * c.v, x = c.x0 + c.sw * Math.sin(tau * 3 + c.ph);
      c.e.style.opacity = y > 880 ? 0 : 1;
      c.e.style.transform = `translate(${x}px, ${y}px) rotate(${tau * c.rs}deg) scaleX(${Math.cos(tau * 7 + c.ph).toFixed(3)})`;
    });
  };
});
