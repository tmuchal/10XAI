// ---------------------------------------------------------------- 04 · Immersion (106–134)
// Local helpers (prefix c04_). Bright paper + ink look; only t drives motion.
const c04_INK = "#2b2320", c04_SH = "7px 8px 0 rgba(43,35,32,.22)";
const c04_hash = (i, k = 0) => { const s = Math.sin(i * 91.7 + k * 257.3) * 43758.5453; return s - Math.floor(s); };
const c04_hill = (base, amp, k) => {
  let d = `M0 470 L0 ${base}`;
  for (let x = 0; x <= 1600; x += 20) d += ` L${x} ${(base + amp * Math.sin(2 * Math.PI * x * k / 800 + k)).toFixed(1)}`;
  return d + " L1600 470 Z";
};
let c04_uid = 0;
// bright landscape; update(t, sp, {sunY, hillX}) lets code "drive" the sun and hills
function c04_scape(p) {
  const id = "c04g" + c04_uid++;
  const e = el("div", "position:absolute;inset:0;overflow:hidden");
  const cloud = `<path d="M0 40 Q-6 14 22 14 Q30 -8 58 2 Q80 -10 96 12 Q122 12 116 40 Z" fill="#fff" stroke="${c04_INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  e.innerHTML = `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style="display:block">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.s[0]}"/><stop offset="1" stop-color="${p.s[1]}"/></linearGradient></defs>
    <rect width="800" height="450" fill="url(#${id})"/>
    <g class="sun"><g class="ry">${Array.from({ length: 10 }, (_, i) => `<path d="M0 -60 L0 -80" transform="rotate(${i * 36})" stroke="${c04_INK}" stroke-width="4" stroke-linecap="round"/>`).join("")}</g>
      <circle r="44" fill="${p.sun}" stroke="${c04_INK}" stroke-width="4"/></g>
    <g class="cl">${cloud}<g transform="translate(330 50) scale(.7)">${cloud}</g></g>
    <path class="h0" d="${c04_hill(250, 16, 2)}" fill="${p.h[0]}" stroke="${c04_INK}" stroke-width="4"/>
    <path class="h1" d="${c04_hill(305, 20, 1)}" fill="${p.h[1]}" stroke="${c04_INK}" stroke-width="4"/>
    <path class="h2" d="${c04_hill(372, 12, 3)}" fill="${p.h[2]}" stroke="${c04_INK}" stroke-width="4"/>
  </svg>`;
  const q = s => e.querySelector(s);
  const P = { sun: q(".sun"), ry: q(".ry"), cl: q(".cl"), h: [q(".h0"), q(".h1"), q(".h2")] };
  e.update = (t, sp = 1, o = {}) => {
    const s = t * sp, sy = o.sunY || 0, hx = o.hillX || 0;
    P.sun.setAttribute("transform", `translate(${o.sunX || 600} ${110 + sy + 6 * Math.sin(s * .8)})`);
    P.ry.setAttribute("transform", `rotate(${s * 18})`);
    P.cl.setAttribute("transform", `translate(${((s * 16) % 1000) - 150} 44)`);
    [8, 18, 34].forEach((v, i) => P.h[i].setAttribute("transform", `translate(${-(((s * v) + hx * [.4, .7, 1][i]) % 800 + 800) % 800} 0)`));
  };
  e.update(0);
  return e;
}
const c04_SUNSET = { s: ["#ffc9ae", "#fff0c9"], sun: "#fff3a8", h: ["#f6b196", "#ec9180", "#d77a70"] };
const c04_PARK = { s: ["#cdeefa", "#fff6d8"], sun: "#ffe07a", h: ["#bfe3a6", "#94d07c", "#6fba5e"] };
const c04_LILAC = { s: ["#e2dbff", "#fff1e2"], sun: "#ffd98a", h: ["#cdbff3", "#ad9ee6", "#8f80d6"] };
function c04_box(parent, x, y, w, h, bg, extra = "") {
  const b = el("div", `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${bg};border:4px solid ${c04_INK};border-radius:18px;box-shadow:${c04_SH};${extra}`, "", parent);
  b.className = "abs"; return b;
}
function c04_slam(s, t, a, rot) {
  const p = seg(t, a, a + .28);
  s.style.opacity = p > 0 ? 1 : 0;
  s.style.transform = `rotate(${rot}deg) scale(${2.4 - 1.4 * out(p)})`;
}
function c04_popIn(node, t, a, d = .45, from = .5) {
  const p = back(seg(t, a, a + d));
  node.style.opacity = clamp(p * 2);
  node.style.transform = `scale(${from + (1 - from) * p})`;
  return p;
}
const c04_person = (c) => `<svg width="44" height="62" viewBox="0 0 44 62" overflow="visible"><rect x="6" y="26" width="32" height="32" rx="12" fill="${c}" stroke="${c04_INK}" stroke-width="3.5"/>
  <circle cx="22" cy="16" r="13" fill="#f6d7b8" stroke="${c04_INK}" stroke-width="3.5"/><circle cx="17" cy="16" r="2" fill="${c04_INK}"/><circle cx="27" cy="16" r="2" fill="${c04_INK}"/></svg>`;

const c04_SPLASH = (c) => `<svg width="100%" height="100%" viewBox="-110 -100 220 200" overflow="visible"><path d="M0 -70 C30 -84 44 -40 72 -44 C100 -36 74 -2 90 22 C104 52 54 50 42 76 C26 100 -8 70 -30 82 C-62 96 -72 50 -88 30 C-104 4 -70 -10 -82 -42 C-92 -76 -40 -60 0 -70Z" fill="${c}" stroke="#2b2320" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="-96" cy="-66" r="9" fill="${c}" stroke="#2b2320" stroke-width="3"/><circle cx="104" cy="-58" r="7" fill="${c}" stroke="#2b2320" stroke-width="3"/><circle cx="92" cy="74" r="10" fill="${c}" stroke="#2b2320" stroke-width="3"/><circle cx="-80" cy="84" r="6" fill="${c}" stroke="#2b2320" stroke-width="3"/></svg>`;
function c04_splat(node, t, a) { const p = back(seg(t, a, a + .3)); node.style.opacity = clamp(p * 3); node.style.transform = `scale(${p}) rotate(${-12 + 12 * p}deg)`; }
scene(106, 134, (R, s) => {
  s.caps = [[106.2, "① 3초 안에 떠야 한다", "1. Load in under 3 seconds"],
            [112.5, "② 스크롤할 때마다 무언가 움직인다", "2. Something moves with every scroll"],
            [119, "③ 히어로엔 영상", "3. Put video in the hero"],
            [125, "④ 부드러운 애니메이션은 Opus에게 코드로", "4. Ask Opus to write the animation code"]];
  s.cite = [[106, "Google mobile speed research"], [119, "Wyzowl Video Marketing Statistics 2026"], [125, "Anthropic · Introducing Claude Opus 5"]];
  chapter(R, "CHAPTER 04", "몰입감 만들기");
  R.style.wordBreak = "keep-all";
  const beat = () => { const b = el("div", "left:0;top:0;width:1920px;height:1080px", "", R); b.className = "abs"; return b; };
  const BA = beat(), BB = beat(), BC = beat(), BD = beat();
  // paper-strip wipe that sweeps between beats
  const WIPES = [112.5, 119, 125];
  const band = el("div", `left:0;top:150px;width:170px;height:800px;z-index:45;border-left:5px solid ${c04_INK};border-right:5px solid ${c04_INK};
    background:repeating-linear-gradient(0deg,#f7d774 0 26px,#f2c14e 26px 52px)`, "", R); band.className = "abs";
  const wipeX = t => { for (const T of WIPES) { const p = seg(t, T - .35, T + .3); if (p > 0 && p < 1) return [lerp(-120, 2040, ease(p)), T]; } return null; };

  // ============ A · load race (106.2–112.5)
  const track = c04_box(BA, 130, 228, 880, 400, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:24px;top:10px;font-size:38px;color:${c04_INK}`, "로딩 레이스", track);
  const watch = el("div", "position:absolute;left:600px;top:8px;display:flex;align-items:center;gap:10px", `<svg width="64" height="70" viewBox="0 0 64 70"><rect x="26" y="0" width="12" height="10" rx="3" fill="#f7d774" stroke="${c04_INK}" stroke-width="3"/>
    <circle cx="32" cy="40" r="26" fill="#fff" stroke="${c04_INK}" stroke-width="4"/><path class="wh" d="M32 40 V20" stroke="#c8372d" stroke-width="4" stroke-linecap="round"/></svg>
    <div class="wt mono" style="font-size:40px;color:${c04_INK};width:150px">0.0s</div>`, track);
  const wHand = watch.querySelector(".wh"), wTx = watch.querySelector(".wt");
  el("div", `position:absolute;left:760px;top:80px;width:30px;height:300px;border-left:3px solid ${c04_INK};border-right:3px solid ${c04_INK};
    background:repeating-conic-gradient(#c8372d 0 25%,#fff 0 50%) 0 0/30px 30px`, "", track);
  const LANES = [["1초", 1, "#d8eef7"], ["3초", 3, "#fbe3b0"], ["5초", 5, "#e4f2d6"]];
  const lanes = LANES.map(([lb, dur, bg], i) => {
    const y = 90 + i * 100;
    el("div", `position:absolute;left:18px;top:${y}px;width:760px;height:84px;border-radius:14px;background:${bg};border:3px solid ${c04_INK}`, "", track);
    el("div", `position:absolute;left:30px;top:${y + 14}px;font-size:44px;color:${c04_INK}`, lb, track);
    el("div", `position:absolute;left:110px;top:${y + 41}px;width:640px;border-top:3px dashed rgba(43,35,32,.35)`, "", track);
    const r = el("div", `position:absolute;left:0;top:${y + 6}px;width:110px;height:74px;z-index:3`, "", track);
    const done = el("div", `position:absolute;left:560px;top:${y + 16}px;padding:2px 14px;border:3px solid ${c04_INK};border-radius:10px;background:#fff;font-size:32px;z-index:4;white-space:nowrap`, "", track);
    return { r, dur, done, y };
  });
  lanes[0].r.innerHTML = `<svg width="110" height="74" viewBox="0 0 110 74" overflow="visible"><g class="fl"><path d="M14 37 L-26 26 L-14 37 L-26 48Z" fill="#f2a24e" stroke="${c04_INK}" stroke-width="3" stroke-linejoin="round"/><path d="M14 37 L-8 31 L-2 37 L-8 43Z" fill="#f7d774"/></g>
    <path d="M30 22 L14 10 L20 30Z M30 52 L14 64 L20 44Z" fill="#c8372d" stroke="${c04_INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 24 H70 Q100 26 106 37 Q100 48 70 50 H14Z" fill="#fff" stroke="${c04_INK}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="70" cy="37" r="8" fill="#9fd3f0" stroke="${c04_INK}" stroke-width="3"/></svg>`;
  const flame = lanes[0].r.querySelector(".fl");
  const runNoa = makeNoa(66); lanes[1].r.appendChild(runNoa);
  lanes[2].r.innerHTML = `<svg width="110" height="74" viewBox="0 0 110 74" overflow="visible"><path d="M8 66 Q6 54 24 54 H84 Q98 54 100 40 L104 26" fill="none" stroke="${c04_INK}" stroke-width="4"/>
    <path d="M8 66 H90 Q104 62 102 42 Q98 30 94 40 Q92 54 70 54 H24 Q8 54 8 66Z" fill="#bfe3a6" stroke="${c04_INK}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="48" cy="36" r="24" fill="#f2a7a0" stroke="${c04_INK}" stroke-width="4"/><path d="M48 36 m0 -12 a12 12 0 1 1 -12 12 a7 7 0 1 1 7 -7" fill="none" stroke="${c04_INK}" stroke-width="3.5"/>
    <path d="M100 30 L96 14 M104 30 L110 16" stroke="${c04_INK}" stroke-width="3"/><circle cx="96" cy="12" r="3" fill="${c04_INK}"/><circle cx="111" cy="14" r="3" fill="${c04_INK}"/></svg>`;
  // visitors walking out the door
  const room = c04_box(BA, 1050, 228, 740, 400, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:24px;top:10px;font-size:38px;color:${c04_INK}`, "내 페이지 방문자", room);
  const pct = el("div", `position:absolute;left:470px;top:6px;font-size:54px;color:#c8372d;white-space:nowrap`, "", room);
  el("div", `position:absolute;left:0;right:0;top:330px;bottom:0;background:#e9dcc0;border-top:4px solid ${c04_INK}`, "", room);
  el("div", `position:absolute;left:600px;top:110px;width:110px;height:224px;border:5px solid ${c04_INK};border-bottom:0;border-radius:10px 10px 0 0;background:#bfe3a6`, "", room);
  el("div", `position:absolute;left:612px;top:80px;padding:0 10px;border:3px solid ${c04_INK};border-radius:8px;background:#c8372d;color:#fff;font-size:22px`, "출구", room);
  const door = el("div", `position:absolute;left:605px;top:115px;width:100px;height:219px;background:#e0a64f;border:4px solid ${c04_INK};transform-origin:0 50%`, `<div style="position:absolute;right:12px;top:100px;width:14px;height:14px;border-radius:50%;background:#f7d774;border:3px solid ${c04_INK}"></div>`, room);
  const COLS = ["#9fd3f0", "#f2a7a0", "#bfe3a6", "#f7d774", "#cdbff3"];
  const order = Array.from({ length: 20 }, (_, i) => i).sort((a, b) => c04_hash(a, 3) - c04_hash(b, 3));
  const ppl = Array.from({ length: 20 }, (_, i) => {
    const d = el("div", "position:absolute;left:0;top:0", c04_person(COLS[i % 5]), room);
    d.x0 = 40 + (i % 7) * 76 + (Math.floor(i / 7) % 2) * 34; d.y0 = 110 + Math.floor(i / 7) * 74;
    const k = order.indexOf(i); d.leave = k < 11 ? 108.45 + k * .1 : 0;
    return d;
  });
  const BIG = [["+32%", 32, "+", "로딩 1초 → 3초", "이탈 확률이 이만큼 올라요"], ["53%", 53, "", "3초 넘으면 떠나요", "모바일 방문자 · Google"]].map(([, v, pre, k1, k2], i) => {
    const c = c04_box(BA, 430, 250, 1060, 460, i ? "#fbd9d3" : "#fff4d0", "z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:visible");
    c.innerHTML = `<div class="sp" style="position:absolute;left:230px;top:4px;width:600px;height:290px"></div>
      <div class="n" style="position:relative;font-size:210px;line-height:1;color:#c8372d;text-shadow:6px 6px 0 #fff">0%</div>
      <div style="position:relative;margin-top:26px;font-size:50px;color:${c04_INK}">${k1}</div>
      <div style="position:relative;margin-top:6px;font-size:30px;color:#6b5d52">${k2}</div>`;
    c.sp = c.querySelector(".sp"); c.sp.innerHTML = c04_SPLASH(i ? "#f7d774" : "#fbd35a"); c.n = c.querySelector(".n"); c.v = v; c.pre = pre;
    return c;
  });
  // hamster wheel: Noa powers the loading, sunglasses fly off at 5 s
  const wheel = el("div", "left:1500px;top:600px;width:280px;height:280px", `<svg width="280" height="280" viewBox="-140 -140 280 280" overflow="visible">
    <path d="M-70 120 L0 0 L70 120" fill="none" stroke="${c04_INK}" stroke-width="10" stroke-linecap="round"/><path d="M-70 120 L0 0 L70 120" fill="none" stroke="#e0a64f" stroke-width="5" stroke-linecap="round"/>
    <circle r="118" fill="rgba(255,250,240,.55)" stroke="${c04_INK}" stroke-width="7"/>
    <g class="sp">${Array.from({ length: 12 }, (_, k) => `<path d="M0 0 L0 -112" transform="rotate(${k * 30})" stroke="${c04_INK}" stroke-width="3" opacity=".55"/>`).join("")}
      <circle r="106" fill="none" stroke="#c8372d" stroke-width="6" stroke-dasharray="14 12"/></g>
    <circle r="12" fill="#f7d774" stroke="${c04_INK}" stroke-width="4"/></svg>`, BA); wheel.className = "abs";
  const wSp = wheel.querySelector(".sp");
  const tapNoa = makeNoa(120); BA.appendChild(tapNoa);
  const tapSg = tapNoa.querySelector(".sg");
  const shades = el("div", "left:0;top:0;z-index:38", `<svg width="90" height="34" viewBox="60 82 80 34"><g fill="#211c1b" stroke="${c04_INK}" stroke-width="3.5" stroke-linejoin="round"><path d="M66 86 H95 Q99 86 98 92 L96 103 Q94 110 87 110 H75 Q68 110 67 103 L64 92 Q63 86 66 86Z"/><path d="M104 86 H133 Q137 86 136 92 L134 103 Q132 110 125 110 H113 Q106 110 105 103 L102 92 Q101 86 104 86Z"/></g><path d="M97 91 Q101 87 105 91" stroke="${c04_INK}" stroke-width="4" fill="none"/></svg>`, BA); shades.className = "abs";
  const whoosh = el("div", `left:1560px;top:586px;font-size:36px;color:#c8372d;z-index:38;white-space:nowrap`, "5초…!!", BA); whoosh.className = "abs";
  const tapB = makeBubble(BA);

  // ============ B · scroll → something moves (112.5–119)
  const PX = 740, PY = 176, PW = 440, PH = 710, SW = 398, SH = 668;
  const phone = c04_box(BB, PX, PY, PW, PH, "#fffaf0", "border-width:5px;border-radius:52px;padding:18px");
  el("div", `position:absolute;left:170px;top:6px;width:90px;height:12px;border-radius:6px;background:#f2c14e;border:3px solid ${c04_INK};z-index:5`, "", phone);
  const scr = el("div", `position:relative;width:${SW}px;height:${SH}px;border-radius:34px;overflow:hidden;border:3px solid ${c04_INK};background:#fff6d8`, "", phone);
  const L = {};
  L.sky = el("div", `position:absolute;left:0;top:0;width:${SW}px;height:700px;background:linear-gradient(#bfe6f5,#fff3d6)`, "", scr);
  L.sun = el("div", `position:absolute;left:250px;top:0;width:100px;height:100px;border-radius:50%;background:#ffd65a;border:4px solid ${c04_INK}`, "", scr);
  L.far = el("div", `position:absolute;left:-40px;top:0;width:${SW + 80}px;height:260px`, `<svg width="${SW + 80}" height="260" viewBox="0 0 424 260"><path d="M0 60 Q70 0 140 50 T280 40 T424 50 V260 H0Z" fill="#cdbff3" stroke="${c04_INK}" stroke-width="4"/></svg>`, scr);
  L.near = el("div", `position:absolute;left:-40px;top:0;width:${SW + 80}px;height:260px`, `<svg width="${SW + 80}" height="260" viewBox="0 0 424 260"><path d="M0 70 Q90 10 190 60 T424 40 V260 H0Z" fill="#94d07c" stroke="${c04_INK}" stroke-width="4"/></svg>`, scr);
  L.words = ["이야기가", "브랜드가", "되는 곳"].map((w, i) => el("div", `position:absolute;left:${24 + i * 22}px;top:0;font-size:54px;color:${c04_INK};white-space:nowrap;text-shadow:3px 3px 0 #fff`, w, scr));
  L.sec = el("div", `position:absolute;left:0;top:0;width:${SW}px;height:900px;background:#fffaf0;border-top:4px solid ${c04_INK}`, "", scr);
  el("div", `position:absolute;left:22px;top:22px;font-size:30px;color:${c04_INK}`, "작업 사례", L.sec);
  L.cards = [0, 1, 2].map(i => {
    const c = el("div", `position:absolute;left:${24 + (i % 2) * 180}px;top:${74 + Math.floor(i / 2) * 176}px;width:168px;height:158px;border:4px solid ${c04_INK};border-radius:14px;overflow:hidden;background:#fff`, "", L.sec);
    const sc = c04_scape([c04_PARK, c04_SUNSET, c04_LILAC][i]); sc.style.height = "96px"; sc.style.bottom = "auto"; c.appendChild(sc);
    el("div", `position:absolute;left:10px;bottom:6px;font-size:26px;color:${c04_INK}`, ["필름", "제품", "캠페인"][i], c);
    c.sc = sc; return c;
  });
  L.cta = el("div", `position:absolute;left:24px;top:448px;width:350px;padding:12px 0;text-align:center;border:4px solid ${c04_INK};border-radius:999px;background:#c8372d;color:#fff;font-size:32px`, "문의하기", L.sec);
  L.noa = makeNoa(110); L.sec.appendChild(L.noa);
  const thumbF = el("div", "left:0;top:0;z-index:36", `<svg width="90" height="120" viewBox="0 0 90 120" overflow="visible"><path d="M30 118 V48 Q30 34 42 34 Q54 34 54 48 V62 Q66 56 74 66 Q86 64 88 78 V100 Q86 118 70 118Z" fill="#f6d7b8" stroke="${c04_INK}" stroke-width="4" stroke-linejoin="round"/><path d="M42 36 Q42 8 42 8" stroke="${c04_INK}" stroke-width="0"/></svg>`, BB); thumbF.className = "abs";
  const TICKS = [[114.0, 180], [115.3, 520], [116.6, 600]];
  const scrollAt = t => TICKS.reduce((S, [a, v], i) => lerp(S, v, back(seg(t, a, a + .7))), 0);
  // left: what each scroll triggers
  const lh = el("div", `left:200px;top:280px;width:500px;font-size:54px;color:${c04_INK};line-height:1.15`, "스크롤 1번 =<br><span style='color:#c8372d'>움직임 1개</span>", BB); lh.className = "abs";
  const cntB = c04_box(BB, 200, 480, 330, 150, "#fff4d0", "display:flex;align-items:center;justify-content:center;font-size:40px;color:#2b2320;transform-origin:50% 50%");
  const spH = el("div", `left:1250px;top:250px;font-size:36px;color:${c04_INK}`, "레이어마다 다른 속도", BB); spH.className = "abs";
  const SPEEDS = [["하늘", .15, "#bfe6f5"], ["산", .8, "#94d07c"], ["글자", 1, "#fff"]];
  const spRows = SPEEDS.map(([n, v, c], i) => {
    const r = el("div", `left:1250px;top:${320 + i * 100}px;width:480px;height:84px`, `<div style="position:absolute;left:0;top:10px;width:64px;height:64px;border-radius:14px;border:4px solid ${c04_INK};background:${c}"></div>
      <div style="position:absolute;left:82px;top:14px;font-size:38px;color:${c04_INK}">${n}</div>
      <div class="ar" style="position:absolute;left:190px;top:26px;height:32px;width:0;border-radius:16px;border:4px solid ${c04_INK};background:${c}"></div>`, BB);
    r.className = "abs"; r.ar = r.querySelector(".ar"); r.v = v; return r;
  });
  const lookNoa = makeNoa(150); BB.appendChild(lookNoa);

  // ============ C · video in the hero (119–125)
  const vid = c04_box(BC, 130, 222, 930, 590, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:0;right:0;top:0;height:54px;background:#f6d9a0;border-bottom:4px solid ${c04_INK};display:flex;align-items:center;gap:10px;padding:0 18px;z-index:5`,
    `${["#ff8a7a", "#f7d774", "#94d07c"].map(c => `<div style="width:18px;height:18px;border-radius:50%;border:3px solid ${c04_INK};background:${c}"></div>`).join("")}
     <div style="margin-left:12px;flex:1;height:34px;border-radius:10px;border:3px solid ${c04_INK};background:#fffaf0;font-size:22px;padding:0 14px;display:flex;align-items:center" class="mono">noainostory.higgsfield.app</div>`, vid);
  const vwrap = el("div", "position:absolute;left:0;right:0;top:58px;bottom:0;overflow:hidden", "", vid);
  const vsc = c04_scape(c04_SUNSET); vwrap.appendChild(vsc);
  const vNoa = makeNoa(190); vwrap.appendChild(vNoa);
  const vHead = el("div", `position:absolute;left:34px;top:34px;padding:8px 22px 12px;border:4px solid ${c04_INK};border-radius:14px;background:#fffaf0;font-size:48px;color:${c04_INK};z-index:34;box-shadow:5px 6px 0 rgba(43,35,32,.2)`, "이야기가 브랜드가 되는 곳", vwrap);
  const play = el("div", `position:absolute;left:390px;top:180px;width:150px;height:150px;border-radius:50%;background:#c8372d;border:5px solid ${c04_INK};z-index:36;box-shadow:6px 7px 0 rgba(43,35,32,.25);display:grid;place-items:center`,
    `<svg width="60" height="70" viewBox="0 0 60 70"><path d="M10 6 L56 35 L10 64Z" fill="#fff" stroke="${c04_INK}" stroke-width="4" stroke-linejoin="round"/></svg>`, vwrap);
  const pbar = el("div", `position:absolute;left:28px;right:28px;bottom:22px;height:22px;border-radius:11px;border:3px solid ${c04_INK};background:#fffaf0;z-index:35;overflow:hidden`, `<div class="pb" style="height:100%;width:0;background:#c8372d"></div>`, vwrap);
  const pb = pbar.querySelector(".pb");
  const rec = el("div", `position:absolute;right:26px;top:36px;padding:2px 14px;border:3px solid ${c04_INK};border-radius:10px;background:#fff;font-size:30px;color:#c8372d;z-index:35`, "● 재생 중", vwrap);
  const cursor = el("div", "left:0;top:0;z-index:46", `<svg width="60" height="70" viewBox="0 0 60 70"><path d="M6 4 L6 56 L20 44 L30 66 L40 61 L30 40 L48 40Z" fill="#fff" stroke="${c04_INK}" stroke-width="4" stroke-linejoin="round"/></svg>`, BC); cursor.className = "abs";
    const ring = el("div", "left:1180px;top:230px;width:320px;height:320px", `<svg width="320" height="320" viewBox="0 0 320 320" style="position:relative">
    <circle cx="160" cy="160" r="128" fill="#fffaf0" stroke="${c04_INK}" stroke-width="5"/>
    <circle cx="160" cy="160" r="110" fill="none" stroke="#f1e4c8" stroke-width="30"/>
    <circle class="arc" cx="160" cy="160" r="110" fill="none" stroke="#c8372d" stroke-width="30" stroke-dasharray="691" stroke-dashoffset="691" transform="rotate(-90 160 160)" stroke-linecap="round"/>
    <circle cx="160" cy="160" r="94" fill="none" stroke="${c04_INK}" stroke-width="3"/><circle cx="160" cy="160" r="126" fill="none" stroke="${c04_INK}" stroke-width="3"/></svg>
    <div class="n" style="position:absolute;left:0;right:0;top:108px;text-align:center;font-size:90px;color:#c8372d;line-height:1">0%</div>`, BC); ring.className = "abs";
  const ringSp = el("div", "position:absolute;left:-60px;top:-50px;width:440px;height:420px", c04_SPLASH("#fbd35a")); ring.insertBefore(ringSp, ring.firstChild);
  const arc = ring.querySelector(".arc"), ringN = ring.querySelector(".n");
  const ringL = el("div", `position:absolute;left:-190px;top:372px;width:700px;text-align:center;font-size:40px;color:${c04_INK};line-height:1.25`, "영상 보고 구매를 결심했다<br><span style='font-size:26px;color:#6b5d52'>Wyzowl · 2026</span>", ring);
  const crowd = Array.from({ length: 20 }, (_, i) => {
    const d = el("div", `left:${1150 + (i % 10) * 62}px;top:${720 + Math.floor(i / 10) * 72}px`, c04_person("#e9dcc0") + `<div class="bag" style="position:absolute;left:30px;top:30px;width:22px;height:24px;border:3px solid ${c04_INK};border-radius:4px;background:#f7d774;opacity:0"></div>`, BC);
    d.className = "abs"; d.body = d.querySelector("rect"); d.bag = d.querySelector(".bag"); return d;
  });

  // ============ D · Opus writes the animation (125–134)
  const ed = c04_box(BD, 130, 212, 780, 560, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:0;right:0;top:0;height:56px;background:#d8eef7;border-bottom:4px solid ${c04_INK};display:flex;align-items:center;gap:12px;padding:0 18px`,
    `<div style="padding:2px 16px;border:3px solid ${c04_INK};border-radius:10px 10px 0 0;background:#fffaf0;font-size:24px" class="mono">hero.js</div>
     <div style="margin-left:auto;padding:2px 14px;border:3px solid ${c04_INK};border-radius:999px;background:#f7d774;font-size:24px">✎ Claude Opus</div>`, ed);
  const CODE = [["// Claude Opus가 쓴 애니메이션", 125.5, null],
                ['tl.from(".title", { y: 60 })', 126.3, "title"],
                ['tl.to(".sun", { y: -120 })', 127.2, "sun"],
                ['tl.to(".hills", { x: -300 })', 128.1, "hills"],
                ['tl.from(".cta", { scale: 0, ease: "back" })', 129.0, "cta"],
                ["tl.play()  // ▶", 129.9, "play"]];
  const codeLines = CODE.map((c, i) => {
    const row = el("div", `position:absolute;left:0;right:0;top:${84 + i * 76}px;height:64px;display:flex;align-items:center`, `<div class="mono" style="width:62px;text-align:right;padding-right:14px;font-size:23px;color:#b0a79a">${i + 1}</div>
      <div class="tx mono" style="font-size:23px;white-space:pre;color:${c04_INK}"></div><div class="run" style="margin-left:12px;padding:0 10px;border:3px solid ${c04_INK};border-radius:8px;background:#bfe3a6;font-size:22px;opacity:0">▶ run</div>`, ed);
    row.tx = row.querySelector(".tx"); row.run = row.querySelector(".run"); return row;
  });
  const hl = el("div", `position:absolute;left:8px;right:8px;top:0;height:64px;border-radius:10px;background:rgba(247,215,116,.45)`, "", ed);
  ed.insertBefore(hl, codeLines[0]);
  const colorize = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/(\/\/.*)$/, "<span style='color:#8a7f70'>$1</span>")
    .replace(/(&quot;|")([^"]*)(")/g, "<span style='color:#c8372d'>$1$2$3</span>")
    .replace(/\b(tl)\b/g, "<span style='color:#3e8fb8'>$1</span>")
    .replace(/\b(from|to|play)\b(?=\()/g, "<span style='color:#7a5cc4'>$1</span>");
  const pv = c04_box(BD, 960, 212, 830, 560, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:0;right:0;top:0;height:56px;background:#f6d9a0;border-bottom:4px solid ${c04_INK};display:flex;align-items:center;gap:10px;padding:0 18px;z-index:5`,
    `${["#ff8a7a", "#f7d774", "#94d07c"].map(c => `<div style="width:18px;height:18px;border-radius:50%;border:3px solid ${c04_INK};background:${c}"></div>`).join("")}<div style="margin-left:14px;font-size:26px">미리보기 · PREVIEW</div>`, pv);
  const pvw = el("div", "position:absolute;left:0;right:0;top:60px;bottom:0;overflow:hidden", "", pv);
  const psc = c04_scape(c04_PARK); pvw.appendChild(psc);
  const pT = el("div", `position:absolute;left:40px;top:60px;padding:8px 24px 12px;border:4px solid ${c04_INK};border-radius:14px;background:#fffaf0;font-size:60px;color:${c04_INK};z-index:34;box-shadow:5px 6px 0 rgba(43,35,32,.2)`, "부드럽게, 재밌게", pvw);
  const pC = el("div", `position:absolute;left:44px;top:220px;padding:12px 30px;border:4px solid ${c04_INK};border-radius:999px;background:#c8372d;color:#fff;font-size:34px;z-index:34;box-shadow:5px 6px 0 rgba(43,35,32,.25)`, "지금 시작하기 →", pvw);
  const pNoa = makeNoa(130); pvw.appendChild(pNoa);
  const sparks = [0, 1, 2, 3, 4].map(i => { const d = el("div", `position:absolute;left:0;top:0;font-size:40px;color:#f2a24e;z-index:36`, "✦", pvw); return d; });
  const badge = el("div", `left:1230px;top:650px;z-index:37;padding:6px 20px 8px;border:5px solid #3e8fb8;border-radius:14px;background:rgba(255,250,240,.95);color:#3e8fb8;font-size:32px;white-space:nowrap`, "Claude가 코드로 만든 움직임", BD); badge.className = "abs";
  const proud = makeNoa(190); BD.appendChild(proud);
  const pb2 = makeBubble(BD);

  const c04_plate = R.querySelector(".chap"), c04_W = el("div", "position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:960px 470px");
  [...R.children].forEach(c => { if (c !== c04_plate) c04_W.appendChild(c); }); R.appendChild(c04_W);
  return t => {
    const c04_m = getComputedStyle($("scenes")).transform.match(/matrix\(([^,]+)/), c04_k = c04_m ? +c04_m[1] : .82;
    c04_W.style.transform = `scale(${Math.min(1, .85 / c04_k)})`;
    // ---- wipes: clip outgoing / incoming beats around the moving band
    const W = wipeX(t);
    band.style.opacity = W ? 1 : 0;
    if (W) band.style.transform = `translateX(${W[0] - 85}px) skewX(-10deg)`;
    const win = [[106, 112.5], [112.5, 119], [119, 125], [125, 134]];
    [BA, BB, BC, BD].forEach((B, k) => {
      const [a, b] = win[k];
      let clip = "none", vis = t >= a - .4 && t < b + .35;
      if (W && W[1] === a) clip = `inset(0 ${1920 - W[0]}px 0 0)`;       // incoming: revealed left of band
      else if (W && W[1] === b) clip = `inset(0 0 0 ${W[0]}px)`;         // outgoing: hidden left of band
      else if (t < a || t >= b) vis = false;
      B.style.display = vis ? "block" : "none"; B.style.clipPath = clip;
    });

    // ---- A: race
    if (t < 113) {
      const el0 = clamp((t - 106.8) / .55, 0, 5);
      wTx.textContent = el0.toFixed(1) + "s";
      wHand.setAttribute("transform", `rotate(${el0 * 72} 32 40)`);
      const tIn = back(seg(t, 106.2, 106.7)); track.style.opacity = clamp(tIn * 2); track.style.transform = `translateY(${80 * (1 - tIn)}px)`;
      const rIn = back(seg(t, 106.4, 106.9)); room.style.opacity = clamp(rIn * 2); room.style.transform = `translateY(${80 * (1 - rIn)}px)`;
      lanes.forEach((ln, i) => {
        const p = seg(el0, 0, ln.dur);
        const e = i === 0 ? out(p) : p;
        ln.r.style.transform = `translateX(${110 + 560 * e}px) translateY(${i === 0 ? 2 * Math.sin(t * 40) : 0}px)`;
        const fin = seg(t, 106.8 + ln.dur * .55, 107.1 + ln.dur * .55);
        ln.done.textContent = ["1.0s ✓", "3.0s …", "5.0s zzz"][i];
        ln.done.style.color = ["#2f9e5a", "#e0a64f", "#c8372d"][i];
        ln.done.style.left = "440px";
        ln.done.style.opacity = fin > 0 ? 1 : 0; ln.done.style.transform = `scale(${back(fin)})`;
      });
      flame.setAttribute("transform", `translate(14 37) scale(${1 + .25 * Math.sin(t * 50)} 1) translate(-14 -37)`);
      const rp = seg(el0, 0, 3);
      poseNoa(runNoa, t, { x: 20, y: -4, s: 1, look: 1, hop: rp > 0 && rp < 1 ? (t * 3.2) % 1 * .25 : 0 });
      // visitors
      let left = 0;
      ppl.forEach((d, i) => {
        let x = d.x0, y = d.y0, op = 1;
        if (d.leave) {
          const w = seg(t, d.leave, d.leave + .7);
          if (w > 0) left++;
          x = lerp(d.x0, 640, ease(seg(w, 0, .7))) + 140 * seg(w, .7, 1); y = lerp(d.y0, 262, ease(seg(w, 0, .7)));
          op = 1 - seg(w, .8, 1);
          y -= w > 0 && w < 1 ? Math.abs(Math.sin(t * 14 + i)) * 8 : 0;
        }
        const impatient = t > 108 && !d.leave ? Math.abs(Math.sin(t * 8 + i)) * 4 : 0;
        d.style.opacity = op; d.style.transform = `translate(${x}px, ${y - impatient}px)`;
      });
      const pv53 = Math.round(53 * seg(t, 108.45, 109.9));
      pct.innerHTML = `이탈 ${pv53}%`;
      pct.style.opacity = seg(t, 108.3, 108.5);
      const dO = seg(t, 108.25, 108.5) * (1 - seg(t, 110, 110.3));
      door.style.transform = `perspective(400px) rotateY(${-70 * dO}deg)`;
      // big numbers, one at a time, centre stage
      const dim = ease(seg(t, 109.6, 109.9));
      [track, room].forEach(e => { e.style.opacity = +e.style.opacity * (1 - .7 * dim); e.style.filter = dim > 0 ? `blur(${2 * dim}px)` : "none"; });
      BIG.forEach((c, i) => {
        const a = [109.75, 111.0][i], z = [110.85, 113][i];
        const pin = back(seg(t, a, a + .35)), gone = ease(seg(t, z, z + .3));
        c.style.display = t > a && t < z + .3 ? "flex" : "none";
        c.style.opacity = clamp(pin * 2) * (1 - gone);
        c.style.transform = `translate(${-900 * gone}px, ${200 * (1 - pin)}px) scale(${.5 + .5 * pin}) rotate(${(i ? 1.5 : -1.5) * pin - 12 * gone}deg)`;
        const k = ease(seg(t, a + .1, a + .6)), sl = seg(t, a + .6, a + .85);
        c.n.textContent = c.pre + Math.round(c.v * k) + "%";
        c.n.style.transform = `scale(${1 + .35 * Math.sin(Math.PI * sl)}) rotate(${-4 * Math.sin(Math.PI * sl)}deg)`;
        c04_splat(c.sp, t, a + .6);
      });
      const tap = t > 107.6 && t < 112.3;
      const wt = el0, fly = seg(t, 109.55, 110.3);
      wSp.setAttribute("transform", `rotate(${90 * wt * wt + 120 * wt})`);
      wheel.style.opacity = seg(t, 106.4, 106.8);
      poseNoa(tapNoa, t, { x: 1580, y: 690 + 4 * Math.sin(t * 30) * (t > 107 ? 1 : 0), s: 1, look: 1, mood: t > 109.55 ? "shock" : t > 108.3 ? "pout" : "happy", hop: t > 106.9 && t < 109.6 ? ((t * (3 + wt)) % 1) * .18 : 0, op: seg(t, 106.5, 106.9) });
      tapNoa.style.transform += ` rotate(${Math.min(18, wt * 4)}deg)`;
      if (tapSg) tapSg.style.opacity = t > 109.55 ? 0 : 1;
      shades.style.opacity = fly > 0 && fly < 1 ? 1 : 0;
      shades.style.transform = `translate(${1595 + 190 * fly}px, ${745 - 260 * Math.sin(Math.PI * fly * .8) + 60 * fly}px) rotate(${fly * 720}deg)`;
      const wh = back(seg(t, 109.55, 109.85)); whoosh.style.opacity = clamp(wh * 2) * (1 - seg(t, 110.6, 110.9)); whoosh.style.transform = `scale(${wh}) rotate(-8deg)`;
      sayBubble(tapB, t, 107.6, 109.4, "더 빨리…!", 1360, 600);
    }

    // ---- B: phone
    if (t > 112 && t < 119.5) {
      const pIn = back(seg(t, 112.5, 113.1));
      phone.style.transform = `translateY(${300 * (1 - pIn)}px) rotate(${-2 * (1 - pIn) + .6 * Math.sin(t * 1.3)}deg)`;
      const S = scrollAt(t), S0 = scrollAt(t - .06), vel = (S - S0) / .06;
      L.sky.style.transform = `translateY(${-S * .15}px)`;
      L.sun.style.transform = `translateY(${260 - S * .35 - 120 * ease(seg(t, 114.0, 114.8))}px)`;
      L.far.style.transform = `translateY(${320 - S * .5}px)`;
      L.near.style.transform = `translateY(${420 - S * .85}px)`;
      L.words.forEach((w, i) => {
        const p = back(seg(t, 113.1 + i * .22, 113.5 + i * .22));
        w.style.opacity = clamp(p * 2);
        w.style.transform = `translate(${-60 * (1 - p)}px, ${300 + i * 58 - S * (1 - i * .14)}px) rotate(${-4 * (1 - p)}deg)`;
      });
      L.sec.style.transform = `translateY(${SH - S * 1}px)`;
      L.cards.forEach((c, i) => {
        const p = back(seg(t, 115.45 + i * .18, 115.9 + i * .18));
        c.style.opacity = clamp(p * 2); c.style.transform = `translateY(${50 * (1 - p)}px) scale(${.5 + .5 * p}) rotate(${(i - 1) * 4 * (1 - p)}deg)`;
        c.sc.update(t + i, .8);
      });
      const cb = seg(t, 116.8, 118.6);
      L.cta.style.transform = `translateY(${-Math.abs(Math.sin(cb * Math.PI * 4)) * 22 * (1 - cb * .5)}px) scale(${1 + .08 * Math.sin(cb * Math.PI * 4)})`;
      L.cta.style.opacity = seg(t, 116.6, 116.9);
      poseNoa(L.noa, t, { x: 220, y: 256, s: 1, wave: t > 116.9, look: 1, op: seg(t, 116.7, 117) });
      // thumb swipes on each tick
      const tk = TICKS.map(([a]) => seg(t, a - .25, a + .5)).find(p => p > 0 && p < 1) || 0;
      thumbF.style.opacity = clamp(seg(t, 113.4, 113.7)) * (1 - seg(t, 118.4, 118.7));
      thumbF.style.transform = `translate(${PX + 300}px, ${PY + 500 - 170 * Math.sin(Math.PI * tk) - 60 * tk}px) rotate(${-10 + 10 * tk}deg)`;
      const lIn = back(seg(t, 112.7, 113.2)); lh.style.opacity = clamp(lIn * 2); lh.style.transform = `translateX(${-120 * (1 - lIn)}px)`;
      const nT = TICKS.filter(([a]) => t >= a + .1).length, lastA = nT ? TICKS[nT - 1][0] + .1 : 0, bump = nT ? seg(t, lastA, lastA + .35) : 0;
      cntB.innerHTML = `움직임 <span style="font-size:96px;color:#c8372d;margin-left:14px">${nT}</span>`;
      const cIn = back(seg(t, 113.3, 113.7));
      cntB.style.opacity = clamp(cIn * 2); cntB.style.transform = `scale(${cIn * (1 + .25 * Math.sin(Math.PI * bump))}) rotate(-2deg)`;
      const hIn = back(seg(t, 112.9, 113.4)); spH.style.opacity = clamp(hIn * 2); spH.style.transform = `translateX(${120 * (1 - hIn)}px)`;
      spRows.forEach((r, i) => {
        const p = back(seg(t, 113.2 + i * .1, 113.6 + i * .1));
        r.style.opacity = clamp(p * 2); r.style.transform = `translateX(${160 * (1 - p)}px)`;
        r.ar.style.width = Math.min(280, 30 + 120 * r.v + Math.abs(vel) * r.v * .35) + "px";
      });
      poseNoa(lookNoa, t, { x: 1560, y: 690, s: 1, look: -1, wave: t > 116.8 && t < 118.2, mood: vel > 200 ? "shock" : "happy", op: seg(t, 113, 113.4) });
    }

    // ---- C: hero video
    if (t > 118.5 && t < 125.5) {
      const vIn = back(seg(t, 119, 119.5)); vid.style.opacity = clamp(vIn * 2); vid.style.transform = `translateY(${120 * (1 - vIn)}px) rotate(${-1 + 1 * vIn}deg)`;
      const press = seg(t, 119.85, 120.0), rel = seg(t, 120.0, 120.35), playing = t > 120.05;
      play.style.transform = `scale(${(1 - .15 * press + .15 * rel) * (1 - ease(seg(t, 120.2, 120.5)))})`;
      play.style.opacity = 1 - seg(t, 120.35, 120.5);
      const pt = playing ? t - 120.05 : 0;
      vsc.update(119 + pt * 1.4, 1, { sunY: -30 * Math.sin(pt * .5) });
      vsc.style.filter = playing ? "none" : "saturate(.45) brightness(1.05)";
      poseNoa(vNoa, t, { x: 560 + 40 * Math.sin(pt * 1.2), y: 290, s: 1, wave: playing, hop: playing ? (pt * 1.6) % 1 * .5 : 0, look: -1 });
      const hp = back(seg(t, 120.3, 120.8)); vHead.style.opacity = playing ? clamp(hp * 2) : .0; vHead.style.transform = `translateX(${-200 * (1 - hp)}px)`;
      pb.style.width = 100 * seg(t, 120.05, 124.7) + "%";
      rec.style.opacity = playing && Math.floor(t * 2.5) % 2 === 0 ? 1 : playing ? .5 : 0;
      const cm = ease(seg(t, 119.35, 119.85)), cOut = seg(t, 120.3, 120.6);
      cursor.style.opacity = seg(t, 119.3, 119.4) * (1 - cOut);
      cursor.style.transform = `translate(${lerp(820, 600, cm) + 30 * cOut}px, ${lerp(760, 540, cm) + 30 * cOut}px) scale(${1 - .15 * press + .15 * rel})`;
      const rIn = back(seg(t, 120.3, 120.75)), home = ease(seg(t, 122.5, 123.0));
      ring.style.opacity = clamp(rIn * 2);
      ring.style.transform = `translate(${lerp(-380, 0, home)}px, ${lerp(20, 0, home)}px) scale(${(.4 + .6 * rIn) * lerp(1.5, 1, home)}) rotate(${-20 * (1 - rIn)}deg)`;
      ring.style.zIndex = 40;
      vid.style.opacity = +vid.style.opacity * (1 - .7 * ease(seg(t, 120.3, 120.6)) * (1 - home));
      const cp = ease(seg(t, 120.6, 121.6)), n = Math.round(85 * cp);
      arc.setAttribute("stroke-dashoffset", 691 * (1 - .85 * cp));
      ringN.textContent = n + "%";
      ringN.style.transform = `scale(${1 + .15 * Math.sin(Math.PI * seg(t, 121.6, 121.9))}) rotate(${-5 * Math.sin(Math.PI * seg(t, 121.6, 121.9))}deg)`;
      c04_splat(ringSp, t, 121.6);
      const lIn = back(seg(t, 121.7, 122.1)); ringL.style.opacity = clamp(lIn * 2); ringL.style.transform = `translateY(${30 * (1 - lIn)}px)`;
      crowd.forEach((d, i) => {
        const on = i < Math.round(17 * seg(t, 123.0, 124.2)), a = 123.0 + (i / 17) * 1.2;
        const pIn = back(seg(t, 122.8 + i * .02, 123.2 + i * .02));
        d.style.opacity = clamp(pIn * 2);
        d.style.transform = `translateY(${-(on ? 12 * Math.sin(Math.PI * seg(t, a, a + .3)) : 0) + 30 * (1 - pIn)}px)`;
        d.body.setAttribute("fill", on && i < 17 ? ["#9fd3f0", "#f2a7a0", "#bfe3a6", "#f7d774", "#cdbff3"][i % 5] : "#e9dcc0");
        d.bag.style.opacity = on && i < 17 ? 1 : 0;
      });
    }

    // ---- D: code → motion
    if (t > 124.5) {
      const eIn = back(seg(t, 125, 125.5)); ed.style.opacity = clamp(eIn * 2); ed.style.transform = `translateX(${-160 * (1 - eIn)}px)`;
      const vIn = back(seg(t, 125.15, 125.65)); pv.style.opacity = clamp(vIn * 2); pv.style.transform = `translateX(${160 * (1 - vIn)}px)`;
      let cur = -1;
      codeLines.forEach((row, i) => {
        const [src, a] = CODE[i], p = seg(t, a, a + .7);
        const shown = type(src, p);
        const caret = p > 0 && (p < 1 || (i === CODE.length - 1 || t < CODE[i + 1][1])) && Math.floor(t * 3) % 2 === 0 ? "<span style='color:#c8372d'>▍</span>" : "";
        row.tx.innerHTML = colorize(shown) + caret;
        if (t >= a) cur = i;
        const r = seg(t, a + .7, a + .95);
        row.run.style.opacity = i > 0 && r > 0 ? 1 - seg(t, a + 1.6, a + 1.9) : 0;
        row.run.style.transform = `scale(${back(r)})`;
      });
      hl.style.opacity = cur >= 0 ? 1 : 0; hl.style.transform = `translateY(${84 + Math.max(0, cur) * 76}px)`;
      const fx = k => ease(seg(t, CODE[k][1] + .7, CODE[k][1] + 1.3)), fb = k => back(seg(t, CODE[k][1] + .7, CODE[k][1] + 1.2));
      const tP = fb(1), sunP = fx(2), hP = fx(3), cP = fb(4), playT = Math.max(0, t - (CODE[5][1] + .7));
      pT.style.opacity = clamp(tP * 2); pT.style.transform = `translateY(${80 * (1 - tP)}px) rotate(${-3 * (1 - tP)}deg)`;
      psc.update(125 + playT * 1.2, playT > 0 ? 1 : 0, { sunY: 220 - 240 * sunP, sunX: 600, hillX: 300 * hP });
      pC.style.opacity = clamp(cP * 3); pC.style.transform = `scale(${cP}) translateY(${-6 * Math.abs(Math.sin(playT * 4)) * (playT > 0 ? 1 : 0)}px)`;
      poseNoa(pNoa, t, { x: 620 - 160 * seg(t, 130.6, 132.4), y: 330, s: 1, look: -1, op: seg(t, 130.5, 130.8), hop: playT > .6 ? (playT * 1.5) % 1 * .4 : 0, wave: playT > 1.8 });
      sparks.forEach((sp, i) => {
        const k = [1, 2, 3, 4, 4][i], p = seg(t, CODE[k][1] + .75, CODE[k][1] + 1.3);
        const pos = [[330, 50], [610, 150], [360, 330], [260, 210], [60, 200]][i];
        sp.style.opacity = p > 0 && p < 1 ? 1 - p : 0;
        sp.style.transform = `translate(${pos[0]}px, ${pos[1] - 40 * p}px) scale(${.5 + p}) rotate(${p * 90}deg)`;
      });
      c04_slam(badge, t, 131.9, -4);
      const nIn = back(seg(t, 130.3, 130.8));
      poseNoa(proud, t, { x: 780, y: 690 + 280 * (1 - nIn), s: 1, talk: t > 130.9 && t < 133, wave: t > 131.2, look: 1, op: clamp(nIn * 3), hop: seg(t, 132.9, 133.4) > 0 && t < 133.4 ? seg(t, 132.9, 133.4) : 0 });
      sayBubble(pb2, t, 130.9, 133.6, "이 영상도 Claude가 코드로 움직였어!", 960, 790);
    }
  };
});

// ---- Uchu (co-host): rides the 1-second rocket in, jaw-drops at 53%, gets swept off by the paper wipe,
//      then returns to O-face at the 85% ring and cheers the shopping crowd ----
(() => {
  let u, ub, rk;
  uchuHook((t, s) => {
    if (!u) {
      rk = el("div", "position:absolute;left:0;top:0;z-index:30;width:300px;height:140px", `<svg width="300" height="140" viewBox="-60 0 180 84" overflow="visible">
        <g class="fl"><path d="M14 42 L-40 28 L-22 42 L-40 56Z" fill="#f2a24e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M14 42 L-12 35 L-4 42 L-12 49Z" fill="#fff3c4"/></g>
        <path d="M30 26 L12 12 L20 34Z M30 58 L12 72 L20 50Z" fill="#c8372d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M14 28 H74 Q106 30 112 42 Q106 54 74 56 H14Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M22 34 H70" stroke="#9fd3f0" stroke-width="4" stroke-linecap="round" opacity=".8"/>
        <circle cx="78" cy="42" r="8" fill="#9fd3f0" stroke="${INK}" stroke-width="3"/><text x="44" y="51" font-size="13" font-weight="700" fill="#c8372d" text-anchor="middle">1s</text></svg>`, s.root);
      u = makeUchu(150); s.root.appendChild(u); ub = makeBubble(s.root);
    }
    const fl = rk.querySelector(".fl");
    // A · rocket ride: 106.3 → parks at x≈230 by 107.3 (lane 1 "1.0s ✓")
    const rp = seg(t, 106.3, 107.3), park = t >= 107.3;
    const rx = lerp(-420, 170, out(rp)), ry = 782 + (park ? 0 : 6 * Math.sin(t * 40)) + (park ? 5 * Math.exp(-5 * (t - 107.3)) * Math.sin(18 * (t - 107.3)) : 0);
    const rOut = ease(seg(t, 109.5, 110.0));
    rk.style.opacity = rp > 0 && rOut < 1 ? 1 : 0;
    rk.style.transform = `translate(${rx - 700 * rOut}px, ${ry}px) rotate(${park ? -2 * rOut : -3}deg)`;
    fl.setAttribute("transform", `translate(14 42) scale(${(park ? (1 - seg(t, 107.3, 107.6)) : 1) * (1 + .3 * Math.sin(t * 50))} 1) translate(-14 -42)`);
    // wipe band (112.15–112.8) sweeps him away
    const bp = seg(t, 112.15, 112.8), bandX = lerp(-120, 2040, ease(bp)) + 60;
    if (t < 118) {
      const off = seg(t, 107.45, 107.9);                        // hops off the rocket onto the floor
      let x = rx + 100, y = ry - 128;
      if (t > 107.45) { x = lerp(rx + 100, 245, off); y = lerp(ry - 128, 700, off) - 90 * Math.sin(off * Math.PI); }
      const swept = bandX > x + 20 && bp > 0;
      if (swept) x = bandX - 20;
      let mood = rp < 1 ? "happy" : "happy", hop = off > 0 && off < 1 ? .2 + off * .8 : 0, look = 1, arms, wave = false;
      if (rp < 1) { arms = "up"; }
      if (t > 108.3 && t < 109.5) { wave = true; }
      if (t > 110.9) { mood = "shock"; look = .8; }                          // 53% jaw-drop
      if (swept) { mood = "shock"; hop = 0; }
      poseUchu(u, t, { x, y, mood, hop, look, arms, wave, op: rp > 0 && x < 1800 ? 1 : 0 });
      if (t > 110.9) { const jd = seg(t, 111.55, 111.8) * (1 - seg(t, 112.2, 112.4));       // jaw drops extra-long on the splat
        u.P.m.setAttribute("transform", `translate(100 131) scale(1 ${(1 + .45 * jd).toFixed(2)}) translate(-100 -131)`); u.P.lip.setAttribute("transform", u.P.m.getAttribute("transform")); u.P.tg.setAttribute("transform", `translate(0 ${(1 + 9 * jd).toFixed(1)})`); }
      else { u.P.m.removeAttribute("transform"); u.P.lip.removeAttribute("transform"); }
      if (t < 109.6) sayBubble(ub, t, 107.6, 109.4, "1초 컷! 🚀", 330, 560);
      else sayBubble(ub, t, 111.6, 112.3, "53%?!", 330, 560);
    } else {
      // C · 85% ring (120.8–124.9): pops up at the right edge
      u.P.m.removeAttribute("transform"); u.P.lip.removeAttribute("transform");
      const cin = seg(t, 120.8, 121.2), cOut = seg(t, 124.6, 125.0);
      let mood = "happy", hop = 0, arms, look = -1;
      if (t > 121.5 && t < 122.9) { mood = "shock"; }
      if (t > 123.0 && t < 124.3) { hop = ((t - 123) * 1.8) % 1; arms = "up"; }
      poseUchu(u, t, { x: 1615, y: lerp(1080, 712, back(cin)) + 300 * ease(cOut), s: 140 / 150, mood, hop, arms, look, op: cin > 0 && cOut < 1 ? 1 : 0 });
      sayBubble(ub, t, 121.7, 122.9, "85%!!", 1440, 580);
    }
  });
})();
