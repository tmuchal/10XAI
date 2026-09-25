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
  n.P.al.setAttribute("transform", `rotate(${-55 * b} 46 118)`); n.P.ar.setAttribute("transform", `rotate(${55 * b} 154 118)`);
  if (b > .4) { n.P.e1.setAttribute("d", "M70 105 Q80 112 90 105"); n.P.e2.setAttribute("d", "M110 105 Q120 112 130 105"); n.P.e1.setAttribute("fill", "none"); n.P.e2.setAttribute("fill", "none"); }
}

scene(184, 192, (R, s) => {
  s.caps = [[184.2, "다음 페이지의 주인공은, 당신의 브랜드", "The next hero is your brand"]];
  const INK = C07_INK;
  // warm spotlight behind the cast
  const spot = c07_abs("left:360px;top:420px;width:1200px;height:520px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,236,170,.95),rgba(255,236,170,0));z-index:0", "", R);
  // hanging title banner
  const ban = c07_abs("left:410px;top:0;width:1100px;height:300px;transform-origin:550px -60px;z-index:5", `
    <svg width="1100" height="80" style="position:absolute;left:0;top:-60px;overflow:visible"><path d="M120 0 L200 80 M980 0 L900 80" stroke="${INK}" stroke-width="4"/></svg>
    <div style="position:absolute;left:40px;top:40px;width:1020px;padding:16px 0 20px;text-align:center;${c07_card("#fbe3b0", 20)};white-space:nowrap">
      <div style="font-size:26px;letter-spacing:6px;color:#c8372d">CLAUDE × HIGGSFIELD · CURTAIN CALL</div>
      <div style="font-size:68px;line-height:1.1;margin-top:4px">사람을 붙잡는 브랜드 페이지</div>
      <div style="font-size:34px;color:#6b5d52">Brand pages that hold people</div></div>`, R);
  // recap chips
  const CH = [["업종 무관", "#fbe0c0"], ["고객이 주인공", "#f8d3df"], ["Soul ID 일관성", "#e3f2f8"], ["3초 · 스크롤 · 영상", "#fff3c4"], ["전문성 + 유머", "#d8ecd3"], ["버튼 → 매출", "#fde6ec"]];
  const chipRow = c07_abs("left:120px;top:318px;width:1680px;display:flex;justify-content:center;gap:14px;z-index:6", "", R);
  const chips = CH.map(([c, bg], i) => el("div", `padding:6px 18px 8px;font-size:30px;white-space:nowrap;${c07_card(bg, 999)};box-shadow:4px 5px 0 rgba(43,35,32,.22)`, c, chipRow));
  // URL marquee with light bulbs
  const NB = 26;
  const mq = c07_abs(`left:510px;top:410px;width:900px;height:110px;${c07_card("#c8372d", 22)};z-index:6`, `
    <div style="position:absolute;left:18px;top:14px;right:18px;bottom:14px;border-radius:14px;background:#fffaf0;border:3px solid ${INK};display:flex;align-items:center;justify-content:center;font-size:54px;white-space:nowrap">
      <span>noainostory</span><span style="color:#d4623a">.higgsfield.app</span></div>
    ${Array.from({ length: NB }, (_, i) => { const k = i < 11 ? [40 + i * 82, 7] : i < 13 ? [893, 30 + (i - 11) * 50] : i < 24 ? [860 - (i - 13) * 82, 103] : [7, 80 - (i - 24) * 50];
      return `<div class="bulb" style="position:absolute;left:${k[0] - 6}px;top:${k[1] - 6}px;width:12px;height:12px;border-radius:50%;border:2px solid ${INK}"></div>`; }).join("")}`, R);
  const bulbs = [...mq.querySelectorAll(".bulb")];
  // cast: Noa in the middle, extras either side
  const noa = makeNoa(260); R.appendChild(noa);
  const EX = [[{ party: true, scarf: null }, 380, -1], [{ glasses: true }, 590, -1], [{ party: true, scarf: null }, 1170, 1], [{ spiky: true }, 1380, 1]]
    .map(([v, x, from]) => { const n = makeNoa(160, v); R.appendChild(n); return { n, x, from }; });
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
    const bowN = Math.max(bowAt(188.0, .45), bowAt(189.55, .5));
    poseNoa(noa, t, { x: 830, y: 622 + 300 * (1 - nIn), s: 1, talk: t > 186.9 && t < 187.9, wave: t > 185.3 && t < 186.8, hop: t > 185.2 && t < 185.9 ? (t - 185.2) / .7 : 0, op: nIn });
    c07_bow(noa, bowN);
    EX.forEach(({ n, x, from }, i) => {
      const a = 184.7 + i * .15, w = ease(seg(t, a, a + 1.1)), walking = t > a && t < a + 1.1;
      const xx = lerp(x + from * 700, x, w);
      const bw = Math.max(bowAt(188.0 + (i < 2 ? (1 - i) : i - 2) * .09 + .05, .45), bowAt(189.55 + .06 * i, .5));
      poseNoa(n, t + i * .3, { x: xx, y: 722, s: 1, look: -from * .5, flip: from > 0 && walking, hop: walking ? ((t - a) * 3.2) % 1 : (t > 186.8 && t < 187.6 ? (t - 186.8) / .8 : 0), wave: t > 190.2 && i % 2 === 0, op: seg(t, a, a + .2) });
      c07_bow(n, bw);
    });
    sayBubble(bub, t, 186.9, 188.0, "고마워요! 🙇", 1070, 600);
    // roses land at the cast's feet
    roses.forEach((r, i) => {
      const a = 188.3 + i * .22, p = seg(t, a, a + .7), tx = [770, 1130, 1150][i], sx = [300, 1650, 1500][i];
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
