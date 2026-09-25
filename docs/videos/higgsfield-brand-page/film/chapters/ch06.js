// ---------------------------------------------------------------- 06 · Money (160–184)
// A hand-drawn funnel machine: visitors pour in, drop out stage by stage, survivors pop out as
// coins that Noa catches. Then the revenue formula rolls up, four businesses get one clear
// button each (pressed by a cursor), and the reference page's closing CTA is revealed.
const C06_INK = "#2b2320";
// Claude mark for the "Claude writes your button copy" micro-badges on the CTA board (177.3: "Tomorrow: Claude writes yours")
const C06_CLAUDE = `<svg width="22" height="22" viewBox="-20 -20 40 40" style="flex:none">${Array.from({ length: 8 }, (_, k) =>
  `<path d="M0 -3 L-3 -17 Q0 -20 3 -17Z" fill="#d97757" stroke="${C06_INK}" stroke-width="2" stroke-linejoin="round" transform="rotate(${k * 45})"/>`).join("")}<circle r="4.5" fill="#d97757" stroke="${C06_INK}" stroke-width="2"/></svg>`;
const c06_card = (bg = "#fffaf0", r = 16) => `background:${bg};border:3px solid ${C06_INK};border-radius:${r}px;box-shadow:6px 7px 0 rgba(43,35,32,.22)`;
const c06_abs = (css, html, parent) => el("div", "position:absolute;" + css, html, parent);
const c06_h = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
// graphic wipe: two torn paper strips sweep across the stage (content swaps behind them)
function c06_strips(R, cols) {
  const S = cols.map((c, i) => el("div", `position:absolute;left:0;top:-300px;width:${620 - i * 180}px;height:1600px;z-index:60;background:repeating-linear-gradient(90deg,${c} 0 34px,rgba(255,255,255,.18) 34px 40px),${c};border-left:5px solid ${C06_INK};border-right:5px solid ${C06_INK};opacity:0`, "", R));
  return (t, t0, dur) => S.forEach((e, i) => {
    const p = seg(t, t0 + i * .08, t0 + i * .08 + dur), cx = lerp(-700, 2700, ease(p));
    e.style.opacity = p > 0 && p < 1 ? 1 : 0; e.style.transform = `translateX(${cx - (310 - i * 90)}px) rotate(14deg)`;
  });
}
const c06_kick = (tau, a = 5, w = 14) => tau <= 0 ? 0 : Math.exp(-a * tau) * Math.sin(w * tau);

scene(160, 184, (R, s) => {
  s.caps = [[160.2, "결국 목표는 하나: 행동, 그리고 매출", "In the end: action, then revenue"],
            [167, "방문자 × 전환율 × 객단가 = 매출", "Visitors × conversion rate × order value = revenue"],
            [173, "업종마다 버튼 하나를 분명하게, 망설이는 사람에겐 보조 CTA", "One clear button per business, plus a softer option"],
            [178, "제 페이지의 마지막 장면도 결국 '행동'", "My page also ends on the action"]];
  s.cite = [[167, "예시 수치 · illustrative numbers"]];
  const head = chapter(R, "CHAPTER 06", "결국, 비즈니스(매출)로");
  const INK = C06_INK; R.style.wordBreak = "keep-all";

  // ================= funnel machine
  const CX = 540, Y0 = 250, BH = 86, WT = [760, 620, 490, 370, 260, 180], SPY = Y0 + 5 * BH;  // spout top
  const FL = [["방문", "Visit"], ["머무름", "Stay"], ["신뢰", "Trust"], ["행동", "Act"], ["매출", "Revenue"]];
  const FC = ["#fdf0d5", "#f9e0b0", "#f4c98a", "#eeac68", "#e5884a"];
  const fun = c06_abs("left:0;top:0;width:1100px;height:1000px", "", R);
  const bands = FL.map((_, i) => { const y = Y0 + i * BH, a = WT[i] / 2, b = WT[i + 1] / 2;
    return `<path d="M${CX - a} ${y} L${CX + a} ${y} L${CX + b} ${y + BH} L${CX - b} ${y + BH} Z" fill="${FC[i]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`; }).join("");
  fun.innerHTML = `<svg width="1100" height="1000" style="position:absolute;left:0;top:0;overflow:visible">
    <g class="fb">${bands}
      <path d="M${CX - WT[0] / 2 - 14} ${Y0 - 4} H${CX + WT[0] / 2 + 14}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <rect x="${CX - 46}" y="${SPY}" width="92" height="50" fill="#c98a4a" stroke="${INK}" stroke-width="4"/>
      <rect x="${CX - 58}" y="${SPY + 44}" width="116" height="16" rx="6" fill="#e6ac66" stroke="${INK}" stroke-width="4"/>
      <path d="M${CX - 58} ${SPY + 52} L${CX - 150} ${SPY + 20}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M${CX - 205} ${SPY + 140} L${CX - 160} ${SPY + 40} L${CX - 115} ${SPY + 140}" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <g transform="translate(${CX - 160} ${SPY + 40})"><circle r="66" fill="rgba(255,250,240,.6)" stroke="${INK}" stroke-width="5"/>
        <g class="gear">${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<path d="M0 0 L0 -62" stroke="#c98a4a" stroke-width="4" transform="rotate(${k * 45})"/>`).join("")}
        <circle r="62" fill="none" stroke="#f2c14e" stroke-width="6" stroke-dasharray="10 12"/></g><circle r="8" fill="${INK}"/></g>
    </g></svg>`;
  const gear = fun.querySelector(".gear");
  const runner = makeNoa(84, { party: true, scarf: null }); fun.appendChild(runner);
  const dotsL = c06_abs("left:0;top:0;width:1100px;height:1000px", "", fun);
  const labels = FL.map((f, i) => c06_abs(`left:${CX - 110}px;top:${Y0 + i * BH + 18}px;width:220px;text-align:center;white-space:nowrap;z-index:2`,
    `<span style="display:inline-block;padding:2px 12px 4px;border-radius:12px;background:rgba(255,250,240,.9);border:2px solid ${INK}"><span style="font-size:34px">${f[0]}</span> <span style="font-size:22px;color:#6b5d52">${f[1]}</span></span>`, fun));
  const VC = ["#f08aa0", "#7cc3e0", "#9bd48a", "#f2c14e", "#b9a0e8", "#ff9d6b"];
  const N = 72, SPD = 200;
  const vis = Array.from({ length: N }, (_, i) => {
    const e = c06_abs("left:0;top:0;width:30px;height:30px;opacity:0", `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="${VC[i % 6]}" stroke="${INK}" stroke-width="3"/>
      <circle cx="11" cy="14" r="2" fill="${INK}"/><circle cx="19" cy="14" r="2" fill="${INK}"/></svg>`, dotsL);
    const t0 = 162.0 + i * .16, boost = t0 > 171.2;          // the stream starts when the button is pressed
    const keep = boost ? [.92, .9, .86, .84] : [.84, .8, .74, .7];
    let d = 5; for (let k = 0; k < 4; k++) if (c06_h(i, k) > keep[k]) { d = k; break; }
    return { e, t0, d, u: (c06_h(i, 7) * 2 - 1) * .85, side: c06_h(i, 9) > .5 ? 1 : -1 };
  });
  const hw = y => { const k = clamp((y - Y0) / BH, 0, 5), i = Math.min(4, Math.floor(k)), f = k - i; return lerp(WT[i], WT[i + 1], f) / 2; };
  const coins = vis.filter(v => v.d === 5).map(v => {
    const e = c06_abs("left:0;top:0;width:40px;height:40px;opacity:0;z-index:33", `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f7c843" stroke="${INK}" stroke-width="3"/>
      <circle cx="20" cy="20" r="11" fill="none" stroke="#c98a1a" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-size="19" font-family="GaeguLat" fill="#8a5a12">₩</text></svg>`, R);
    return { e, te: v.t0 + (SPY + 40 - 190) / SPD };
  });
  const catcher = makeNoa(160); R.appendChild(catcher);
  const live = c06_abs(`left:1050px;top:280px;width:720px;padding:20px 30px 24px;${c06_card("#fffaf0", 20)};white-space:nowrap`, `
    <div style="font-size:28px;letter-spacing:3px;color:#c8372d">LIVE · 노아의 매출 바구니</div>
    <div style="display:flex;align-items:center;gap:18px;margin-top:4px"><svg width="96" height="96" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f7c843" stroke="${INK}" stroke-width="2.5"/><circle cx="20" cy="20" r="11" fill="none" stroke="#c98a1a" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-size="19" font-family="GaeguLat" fill="#8a5a12">₩</text></svg>
      <span class="cc" style="font-size:120px;line-height:1;display:inline-block;transform-origin:50% 70%">0</span><span style="font-size:40px">코인</span></div>
    <div style="font-size:32px;margin-top:10px">방문자 <span class="vv" style="color:#2f6f94">0</span>명 → 끝까지 온 사람 <span class="kk" style="color:#2f7a3a">0</span>명</div>
    <div style="font-size:24px;color:#6b5d52;margin-top:4px">대부분은 중간에 떠난다 — 남는 사람을 늘리는 게 핵심</div>`, R);
  const liveSub = [...live.children].slice(2);
  const liveC = live.querySelector(".cc"), liveV = live.querySelector(".vv"), liveK = live.querySelector(".kk");
  const basket = c06_abs("left:0;top:0;width:120px;height:70px;z-index:34", `<svg width="120" height="70" overflow="visible">
    <g class="pile"></g><path d="M6 14 H114 L100 62 H20 Z" fill="#d9a06a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M14 30 H106 M18 46 H102" stroke="${INK}" stroke-width="3" opacity=".5"/></svg>`, R);
  const pile = basket.querySelector(".pile");
  const env = c06_abs("left:0;top:0;width:280px;height:160px;z-index:36;transform-origin:50% 50%", `
    <svg width="280" height="160" style="position:absolute;left:0;top:0;overflow:visible;z-index:0"><rect x="2" y="2" width="276" height="156" rx="10" fill="#f3d9a4" stroke="${INK}" stroke-width="4"/></svg>
    <div class="cd" style="position:absolute;left:14px;top:12px;width:252px;height:130px;border:3px solid ${INK};border-radius:8px;text-align:center;white-space:nowrap;z-index:2">
      <div style="font-size:22px;color:#6b5d52;margin-top:4px">노아의 예측</div><div style="font-size:36px;line-height:1.1">₩4,500,000<span class="q" style="color:#c8372d">?</span></div>
      <div class="ck" style="font-size:28px;color:#2f7a3a;opacity:0">✓ 적중!</div></div>
    <div style="position:absolute;left:0;top:0;width:280px;height:160px;z-index:3">
      <svg width="280" height="160" style="position:absolute;left:0;top:0;overflow:visible"><path d="M2 64 L140 116 L278 64 V150 Q278 158 270 158 H10 Q2 158 2 150 Z" fill="#f7e2b6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>
      <div class="fr" style="position:absolute;left:0;right:0;top:112px;text-align:center;font-size:30px;white-space:nowrap">₩4,500,000?</div></div>
    <div class="fl" style="position:absolute;left:0;top:0;width:280px;height:100px;transform-origin:50% 2px;z-index:4">
      <svg width="280" height="100" style="overflow:visible"><path d="M2 4 L140 90 L278 4 Z" fill="#efcf8f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>
      <div class="sl" style="position:absolute;left:120px;top:60px;width:40px;height:40px;border-radius:50%;background:#c8372d;border:3px solid ${INK};color:#fff;font-size:26px;text-align:center;line-height:34px">?</div></div>`, R);
  const eFront = env.querySelector(".fr"), eCard = env.querySelector(".cd"), eFlap = env.querySelector(".fl"), eSeal = env.querySelector(".sl"), eQ = env.querySelector(".q"), eChk = env.querySelector(".ck");
  const eLab = c06_abs(`left:0;top:0;padding:4px 14px 6px;${c06_card("#fff3c4", 10)};font-size:26px;white-space:nowrap;z-index:37;transform-origin:0 100%`, "봉인된 예측 · sealed guess", R);
  // "Remember that button I promised?" (161.0): the button itself, pressed at 161.95 → the funnel starts
  const c06_btn = c06_abs(`left:1180px;top:300px;width:520px;height:0;z-index:38`, `
    <div class="tg" style="position:absolute;left:250px;top:-34px;padding:4px 16px 6px;${c06_card("#fff3c4", 10)};font-size:32px;white-space:nowrap;transform:rotate(5deg)">약속한 그 버튼!</div>
    <div class="bb" style="position:absolute;left:0;top:34px;width:520px;height:120px;border-radius:60px;background:#d4623a;border:4px solid ${INK};box-shadow:0 10px 0 ${INK};color:#fff;font-size:52px;display:flex;align-items:center;justify-content:center;white-space:nowrap">▶ 상담 예약하기</div>
    <div class="rr" style="position:absolute;left:200px;top:34px;width:120px;height:120px;border-radius:50%;border:6px solid #f2c14e;opacity:0"></div>`, R);
  const c06_bb = c06_btn.querySelector(".bb"), c06_tg = c06_btn.querySelector(".tg"), c06_rr = c06_btn.querySelector(".rr");
  const c06_b1 = makeBurst(R, 24, 11), c06_b2 = makeBurst(R, 28, 12);
  // "Noa's cheeks? Already full." (181.0–183.0): the finale gag
  const c06_q = c06_abs(`left:0;top:0;font-size:120px;color:#c8372d;z-index:39;-webkit-text-stroke:3px ${INK};opacity:0`, "?", R);
  const c06_full = c06_abs(`left:1150px;top:330px;padding:8px 26px 12px;border:6px solid #c8372d;border-radius:16px;background:#fffaf0;color:#c8372d;font-size:64px;white-space:nowrap;z-index:40;opacity:0;box-shadow:6px 7px 0 rgba(43,35,32,.22)`, "볼주머니 만석!", R);
  const c06_fsub = el("div", "font-size:30px;color:#6b5d52;text-align:center;margin-top:-4px", "FULL · 더는 못 넣어요", c06_full);
  const c06_pc = [0, 1, 2, 3].map(() => c06_abs("left:0;top:0;width:52px;height:52px;z-index:37;opacity:0", `<svg width="52" height="52" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f7c843" stroke="${INK}" stroke-width="3"/><circle cx="20" cy="20" r="11" fill="none" stroke="#c98a1a" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-size="19" font-family="GaeguLat" fill="#8a5a12">₩</text></svg>`, R));
  const burst = Array.from({ length: 18 }, (_, i) => c06_abs(`left:0;top:0;width:16px;height:12px;border:2px solid ${INK};border-radius:3px;background:${["#f2c14e", "#f08aa0", "#7cc3e0", "#9bd48a"][i % 4]};z-index:37;opacity:0`, "", R));

  // ================= formula
  const form = c06_abs("left:1010px;top:230px;width:780px;height:560px", "", R);
  const fh = c06_abs("left:0;top:0;width:780px;white-space:nowrap", `<span style="font-size:30px;letter-spacing:3px;color:#c8372d">매출 공식 · REVENUE</span>`, form);
  const tag = c06_abs(`left:560px;top:-6px;padding:4px 14px 6px;${c06_card("#fff3c4", 10)};font-size:24px;white-space:nowrap`, "예시 · illustrative", form);
  const TL = [["방문자", "visitors", "3,000"], ["전환율", "conversion", "1.5%"], ["객단가", "order value", "₩60,000"]];
  const tiles = TL.map((x, i) => c06_abs(`left:${i * 280}px;top:70px;width:220px;height:150px;${c06_card("#fffaf0", 16)};text-align:center;white-space:nowrap`,
    `<div style="font-size:30px;margin-top:10px">${x[0]}</div><div style="font-size:22px;color:#6b5d52;margin-top:-4px">${x[1]}</div><div class="v" style="font-size:48px;line-height:1.1;margin-top:4px">${x[2]}</div>`, form));
  const ops = ["×", "×"].map((o, i) => c06_abs(`left:${220 + i * 280}px;top:108px;width:60px;text-align:center;font-size:56px`, o, form));
  const res = c06_abs(`left:0;top:270px;width:780px;height:150px;${c06_card("#fbe3b0", 18)};display:flex;align-items:center;justify-content:center;gap:18px;white-space:nowrap`,
    `<span style="font-size:60px">=</span><span class="rv" style="font-size:86px;line-height:1">₩0</span>`, form);
  const rv = res.querySelector(".rv"), crV = tiles[1].querySelector(".v");
  const delta = c06_abs(`left:560px;top:236px;padding:6px 16px 8px;${c06_card("#d8f0cf", 12)};font-size:34px;color:#2f7a3a;white-space:nowrap;z-index:3`, "+₩1,800,000", form);
  const boostN = c06_abs(`left:60px;top:452px;width:660px;padding:10px 0 12px;${c06_card("#e3f2f8", 14)};text-align:center;font-size:32px;white-space:nowrap`,
    `몰입 + 신뢰 ↑ &nbsp;→&nbsp; 전환율 <span style="color:#6b5d52">1.5%</span> → <span style="color:#2f7a3a">2.5%</span>`, form);

  // ================= CTA board
  const ctaH = c06_abs("left:260px;top:226px;width:1400px;text-align:center;white-space:nowrap", `<div style="font-size:56px;line-height:1.1">업종마다, 분명한 버튼 <span style="color:#c8372d">하나</span></div>`, R);
  const CT = [["🎬", "에이전시", "Agency", "상담 예약", "Book a consult", "포트폴리오 보기"],
              ["🛍️", "쇼핑몰", "Online shop", "장바구니 담기", "Add to cart", "찜하기 ♡"],
              ["🏪", "오프라인 매장", "Local store", "길찾기 · 예약", "Directions / reserve", "메뉴 둘러보기"],
              ["📱", "인플루언서", "Influencer", "공구 링크", "Group-buy link", "팔로우"]];
  const CBG = ["#fbe0c0", "#f2ebe0", "#d8ecd3", "#f8d3df"];
  const cards = CT.map((c, i) => {
    const e = c06_abs(`left:${150 + i * 413}px;top:340px;width:380px;height:400px;${c06_card(CBG[i], 20)};white-space:nowrap`, `
      <div style="position:absolute;left:22px;top:16px;font-size:58px;line-height:1.1">${c[0]}</div>
      <div style="position:absolute;left:104px;top:22px;font-size:38px;line-height:1">${c[1]}</div>
      <div style="position:absolute;left:106px;top:66px;font-size:22px;color:#6b5d52">${c[2]}</div>
      <div class="pb" style="position:absolute;left:24px;right:24px;top:132px;height:84px;border-radius:42px;background:#d4623a;border:3px solid ${INK};box-shadow:0 7px 0 ${INK};color:#fff;font-size:38px;display:flex;align-items:center;justify-content:center;gap:10px">${c[3]} <span class="ok" style="opacity:0">✓</span></div>
      <div style="position:absolute;left:0;right:0;top:236px;text-align:center;font-size:24px;color:#6b5d52">${c[4]}</div>
      <div class="sb" style="position:absolute;left:54px;right:54px;top:292px;height:60px;border-radius:30px;border:3px dashed ${INK};background:rgba(255,255,255,.55);font-size:28px;color:#6b5d52;display:flex;align-items:center;justify-content:center">${c[5]}</div>
      <div class="cl" style="position:absolute;right:8px;top:106px;z-index:3;display:flex;align-items:center;gap:5px;padding:1px 12px 3px 6px;border:3px solid ${INK};border-radius:999px;background:#fbd0bd;font-size:22px;opacity:0;transform-origin:100% 100%">${C06_CLAUDE}Claude 문구</div>
      <div class="rp" style="position:absolute;left:190px;top:174px;width:0;height:0"><div style="position:absolute;left:-60px;top:-60px;width:120px;height:120px;border-radius:50%;border:5px solid #f2c14e"></div></div>`, R);
    return e;
  });
  const softNote = c06_abs(`left:560px;top:770px;padding:8px 22px 10px;${c06_card("#fffaf0", 14)};font-size:30px;white-space:nowrap`, "↑ 점선 = 보조 CTA · 망설이는 사람을 위한 부드러운 선택지", R);
  const cursor = c06_abs("left:0;top:0;width:60px;height:70px;z-index:45", `<svg width="60" height="70" viewBox="0 0 60 70" overflow="visible">
    <path d="M4 2 L4 52 L17 40 L27 62 L37 57 L27 36 L45 36 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`, R);
  const PRESS = [177.3, 177.75, 178.2, 178.65];

  // ================= reference page reveal
  const stars = [[330, 200], [1470, 170], [300, 640], [1500, 600], [760, 150], [1160, 760]].map(([x, y], i) => c06_abs(`left:${x}px;top:${y}px;width:70px;height:70px;z-index:6`,
    `<svg width="70" height="70" viewBox="-35 -35 70 70"><path d="M0 -32 L9 -9 L32 0 L9 9 L0 32 L-9 9 L-32 0 L-9 -9 Z" fill="${["#f2c14e", "#f08aa0", "#7cc3e0"][i % 3]}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`, R));
  const noa = makeNoa(190); R.appendChild(noa);
  // bulging cheek pouches for the finale (inked, drawn behind the face so whiskers stay on top)
  const c06_pouch = [40, 160].map(cx => { const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = `<ellipse cx="${cx}" cy="128" rx="27" ry="25" fill="${NOA.body}" stroke="${INK}" stroke-width="5"/><ellipse cx="${cx + (cx < 100 ? 4 : -4)}" cy="132" rx="17" ry="15" fill="${NOA.belly}"/>
      <path d="M${cx - 12} 114 Q${cx - 4} 108 ${cx + 6} 110" stroke="#fff" stroke-opacity=".6" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    noa.P.ckl.parentNode.insertBefore(g, noa.P.ckl); g.cx = cx; return g; });
  const wipeA = c06_strips(R, ["#f7d774", "#f08aa0"]), wipeB = c06_strips(R, ["#7cc3e0", "#f7d774"]);

  // Beats cued to the narration: button 161.0 · formula 167.0 · +1%p 170.9 · "4.5 million" 172.4 ·
  // Re-cued to the spoken lines (film 190.86 / 196.24): "one point" 172.0 · "becomes 4.5" 175.4 · "That's the button" 176.3 ·
  // "Tomorrow: Claude writes yours" 177.3 · "Noa's cheeks? Already full." 181.0
  return t => {
    // ---------- funnel + formula phase (160.2–176.35)
    const M = seg(t, 160.2, 160.8), X1 = ease(seg(t, 175.95, 176.35));
    const fin = back(seg(t, 160.3, 161.0));
    fun.style.opacity = clamp(fin * 2) * (1 - X1);
    fun.style.transform = `translate(${-200 * X1}px, ${60 * (1 - clamp(fin))}px) scale(${0.9 + 0.1 * fin})`; fun.style.transformOrigin = "540px 700px";
    labels.forEach((l, i) => { const p = back(seg(t, 160.7 + i * .18, 161.1 + i * .18)); l.style.opacity = clamp(p * 2); l.style.transform = `scale(${0.4 + 0.6 * p})`; });
    const spin = t < 161.95 ? 0 : (t - 161.95) * 260 + 400 * (1 - Math.exp(-3 * (t - 161.95)));     // the machine starts on the press
    gear.setAttribute("transform", `rotate(${spin.toFixed(1)})`);
    poseNoa(runner, t * 2.2, { x: CX - 160 - 42, y: SPY + 40 + 58 - 84, s: 1, flip: true, hop: t > 161.95 ? (t * 3.4) % 1 : 0, op: fun.style.opacity });
    vis.forEach(v => {
      const tau = t - v.t0;
      if (tau < 0 || X1 >= 1) { v.e.style.opacity = 0; return; }
      const y = 190 + tau * SPD;
      const dy = v.d < 5 ? Y0 + v.d * BH + BH * .55 : 1e9;               // where it drops out
      let x, yy, op = 1, sc = 1;
      if (y < dy) {
        x = CX + v.u * Math.max(0, hw(Math.max(y, Y0)) - 22); yy = y; op = seg(y, 190, 230);
        if (y > SPY) { x = CX; sc = 1 - seg(y, SPY, SPY + 40); }
        if (y > SPY + 40) op = 0;
      } else {                                                             // bounce out sideways
        const k = (y - dy) / SPD, xs = CX + v.u * Math.max(0, hw(dy) - 22);
        x = xs + v.side * 320 * k; yy = dy - 220 * k + 520 * k * k; op = 1 - seg(k, .35, .75);
      }
      v.e.style.opacity = op * M;
      v.e.style.transform = `translate(${x - 15}px, ${yy - 15}px) scale(${sc}) rotate(${y >= dy ? v.side * (y - dy) * 1.5 : 0}deg)`;
    });
    // ---------- the promised button (161.05–162.75)
    const bIn = back(seg(t, 161.05, 161.45)), bFly = ease(seg(t, 162.3, 162.8)), pr = seg(t, 161.9, 161.97) * (1 - seg(t, 162.05, 162.2));
    c06_btn.style.display = t > 161.0 && bFly < 1 ? "block" : "none";
    c06_btn.style.opacity = clamp(bIn * 2) * (1 - seg(t, 162.6, 162.8));
    c06_btn.style.transform = `translate(${lerp(0, CX - 1440, bFly)}px, ${lerp(0, -40, bFly) - 160 * Math.sin(Math.PI * bFly)}px) scale(${(0.5 + 0.5 * bIn) * lerp(1, .25, bFly)}) rotate(${-2 + 2 * bIn + wobble(t, 161.97, 3, 16, 5) - 20 * bFly}deg)`;
    c06_bb.style.transform = `translateY(${8 * pr}px)`; c06_bb.style.boxShadow = `0 ${10 - 8 * pr}px 0 ${INK}`;
    c06_bb.style.background = t > 161.95 ? "#c8372d" : "#d4623a";
    const tgp = back(seg(t, 161.3, 161.6)); c06_tg.style.opacity = clamp(tgp * 2); c06_tg.style.transform = `rotate(${5 + 3 * wobble(t, 161.6, 1, 10, 4)}deg) scale(${tgp})`;
    const rrp = seg(t, 161.95, 162.5); c06_rr.style.opacity = rrp > 0 ? 1 - rrp : 0; c06_rr.style.transform = `scale(${.4 + 3.2 * out(rrp)})`;
    c06_b1.fire(t, 161.95, 1440, 400, 1.1); shakeCam(t, 161.95, 10, .35);
    // cursor: glides in, presses at 161.95; later presses the four CTA buttons
    const bxy = i => [150 + i * 413 + 210, 340 + 184];
    let cx = 1000, cy = 980, cop = 0;
    if (t < 163) {
      const m = ease(seg(t, 161.25, 161.88));
      cx = lerp(1780, 1450, m); cy = lerp(760, 420, m) - 40 * Math.sin(Math.PI * m);
      if (t > 162.1) { const e = ease(seg(t, 162.1, 162.6)); cx += 260 * e; cy += 300 * e; }
      cop = seg(t, 161.25, 161.4) * (1 - seg(t, 162.35, 162.6));
    } else if (t >= 176.9) {
      let k = 0; while (k < 3 && t > PRESS[k] + .25) k++;
      const from = k === 0 ? [1000, 980] : bxy(k - 1), to = bxy(k);
      const m = ease(seg(t, k === 0 ? 176.9 : PRESS[k - 1] + .25, PRESS[k] - .05));
      cx = lerp(from[0], to[0], m); cy = lerp(from[1], to[1], m) - 40 * Math.sin(m * Math.PI);
      if (t > PRESS[3] + .25) { const e = ease(seg(t, PRESS[3] + .3, 179.3)); cx = lerp(to[0], 1850, e); cy = lerp(to[1], 900, e); }
      cop = seg(t, 176.9, 177.1) * (1 - seg(t, 179.0, 179.3));
    }
    const cpr = [161.95, ...PRESS].some(p => t > p - .04 && t < p + .16);
    cursor.style.opacity = cop;
    cursor.style.transform = `translate(${cx}px, ${cy}px) scale(${cpr ? .82 : 1})`;
    // catcher + coins
    const bx = 760 + 30 * Math.sin(t * 1.4);
    let caught = 0, lastCatch = -9, inBasket = 0, inCheek = 0;
    coins.forEach((c, k) => { if (t > c.te + .75) { if (k % 2) inCheek++; else inBasket++; } });
    coins.forEach((c, k) => {
      const p = seg(t, c.te, c.te + .75);
      if (t < c.te || t > c.te + .75 || X1 > 0) { c.e.style.opacity = 0; if (t > c.te + .75) { caught++; lastCatch = Math.max(lastCatch, c.te + .75); } return; }
      const tx = 760 + 30 * Math.sin((c.te + .75) * 1.4) + (k % 2 ? 22 : 0);
      const x = lerp(CX, tx, p), y = lerp(SPY + 50, k % 2 ? 826 : 706, p) - 200 * 4 * p * (1 - p);
      c.e.style.opacity = 1; c.e.style.transform = `translate(${x - 20}px, ${y - 20}px) scale(${Math.abs(Math.cos(t * 9)) * .7 + .3}, 1)`;
    });
    const cOp = seg(t, 162.2, 162.6) * (1 - X1), nOp = seg(t, 160.4, 160.8) * (1 - X1);
    const bump = c06_kick(t - lastCatch, 7, 18);
    const cheer = t > 175.4 && t < 176.2;
    poseNoa(catcher, t, { x: bx - 80, y: 722 + 6 * bump, s: 1, look: t < 162 ? .4 : -.6, mood: "happy",
      hop: cheer ? (t - 175.4) / .8 : 0, arms: t > 162.1 ? "up" : undefined, op: nOp });
    // cheek pouches fill up with every other coin (pays off at 181: "Noa's cheeks? Already full.")
    const puffC = 1 + Math.min(.45, inCheek * .07) + .12 * c06_kick(t - lastCatch, 6, 16) * (inCheek > 0 ? 1 : 0);
    catcher.P.ckl.setAttribute("transform", `translate(50 128) scale(${puffC.toFixed(3)}) translate(-50 -128)`);
    catcher.P.ckr.setAttribute("transform", `translate(150 128) scale(${puffC.toFixed(3)}) translate(-150 -128)`);
    basket.style.opacity = cOp * (1 - seg(t, 175.9, 176.1)); basket.style.transform = `translate(${bx - 60}px, ${688 + 8 * bump}px)`;
    env.style.opacity = 0; eLab.style.opacity = 0;
    burst.forEach((b, i) => { const tau = t - 175.4, a = i / burst.length * 6.283 + .3 * c06_h(i, 2), d = (120 + 90 * c06_h(i, 3)) * out(seg(tau, 0, .6));
      b.style.opacity = tau > 0 && X1 < 1 ? 1 - seg(tau, .5, .9) : 0;
      b.style.transform = `translate(${1400 + Math.cos(a) * d * 1.4 - 8}px, ${590 + Math.sin(a) * d * .7 + 120 * tau * tau - 8}px) rotate(${tau * 500 + i * 40}deg)`; });
    // compact live counter (top right, clear of the 3D insert at 163–166)
    const lp = back(seg(t, 162.7, 163.1)), lx = ease(seg(t, 166.5, 166.95)), lk = 1;
    live.style.opacity = clamp(lp * 2) * (1 - lx); live.style.transformOrigin = "100% 0";
    live.style.transform = `translateY(${-50 * lx - 70 * lk}px) scale(${(0.6 + 0.4 * lp) * (1 - .45 * lk)}) rotate(${1.5 - 1.5 * lx}deg)`;
    liveSub.forEach(e => e.style.opacity = 0);
    liveC.textContent = caught; liveC.style.transform = `scale(${1 + .25 * c06_kick(t - lastCatch, 6, 16)})`;
    const nPile = Math.min(9, inBasket);
    if (pile.childElementCount !== nPile) pile.innerHTML = Array.from({ length: nPile }, (_, k) =>
      `<circle cx="${22 + (k % 5) * 19 + (k >= 5 ? 9 : 0)}" cy="${k >= 5 ? 0 : 12}" r="11" fill="#f7c843" stroke="${INK}" stroke-width="2.5"/>`).join("");
    // formula: tiles land on "visitors · conversion · order value"
    const F = seg(t, 166.9, 167.3);
    form.style.opacity = F * (1 - X1); form.style.transform = `translateX(${240 * X1}px)`;
    const hp = back(seg(t, 166.9, 167.4)); fh.style.opacity = clamp(hp * 2); fh.style.transform = `translateY(${-20 * (1 - hp)}px)`;
    const tp = back(seg(t, 170.1, 170.5)); tag.style.opacity = clamp(tp * 2); tag.style.transform = `rotate(6deg) scale(${1.8 - 0.8 * tp})`;
    const TT = [167.35, 168.35, 169.35];
    tiles.forEach((e, i) => { const p = back(seg(t, TT[i], TT[i] + .45));
      e.style.opacity = clamp(p * 2); e.style.transform = `translateY(${-60 * (1 - p)}px) rotate(${(i - 1) * 1.5 + 3 * wobble(t, TT[i] + .35, 1, 14, 6)}deg)`; });
    ops.forEach((e, i) => { const p = back(seg(t, TT[i + 1] - .2, TT[i + 1] + .1)); e.style.opacity = clamp(p * 2); e.style.transform = `scale(${p})`; });
    const rp = back(seg(t, 169.9, 170.3));
    res.style.opacity = clamp(rp * 2); res.style.transform = `scale(${0.7 + 0.3 * rp})`;
    const FL0 = 172.0;                                                   // "Say conversion rises one point"
    const flip = t < FL0 ? 1 : t < FL0 + .2 ? 1 - seg(t, FL0, FL0 + .2) : back(seg(t, FL0 + .2, FL0 + .5));
    tiles[1].style.transform += ` scaleY(${Math.max(.02, flip)})`;
    tiles[1].style.background = t > FL0 + .2 ? "#d8f0cf" : "#fffaf0";
    crV.textContent = t > FL0 + .2 ? "2.5%" : "1.5%"; crV.style.color = t > FL0 + .2 ? "#2f7a3a" : INK;
    const R1 = 174.6, R2 = 175.4;                                        // "…becomes 4.5"
    const roll = t < R1 ? 2700000 * out(seg(t, 169.95, 170.75)) : lerp(2700000, 4500000, ease(seg(t, R1, R2)));
    rv.textContent = "₩" + fmt(Math.round(roll / 1000) * 1000);
    rv.style.color = t > R1 ? "#2f7a3a" : INK;
    res.style.transform += ` scale(${1 + 0.1 * c06_kick(t - R2, 5, 16) + (t > R1 && t < R2 ? .02 * Math.sin(t * 40) : 0)})`;
    c06_b2.fire(t, R2, 1400, 570, 1.2); shakeCam(t, R2, 10, .4);
    const bn = back(seg(t, FL0 + .1, FL0 + .55)); boostN.style.opacity = clamp(bn * 2); boostN.style.transform = `translateY(${30 * (1 - bn)}px)`;
    const dp = back(seg(t, R2, R2 + .4)); delta.style.opacity = clamp(dp * 2); delta.style.transform = `rotate(-6deg) scale(${1.6 - 0.6 * dp})`;
    // ---------- CTA board (176.05–181): "That's the button: one clear call to action, plus a soft one for maybe-laters."
    const X2 = ease(seg(t, 180.55, 181.0));
    const hh = back(seg(t, 176.3, 176.75));
    ctaH.style.opacity = clamp(hh * 2) * (1 - X2); ctaH.style.transform = `translateY(${-30 * (1 - hh) - 60 * X2}px)`;
    cards.forEach((c, i) => {
      const p = back(seg(t, 176.4 + i * .12, 176.85 + i * .12));
      const tp2 = t - PRESS[i], pressed = tp2 > 0 && tp2 < .22;
      c.style.opacity = clamp(p * 2) * (1 - X2);
      c.style.transform = `translateY(${120 * (1 - p) + 200 * X2}px) rotate(${(i % 2 ? 1 : -1) * (1 - p) * 6 + (i % 2 ? .8 : -.8)}deg) scale(${1 + 0.04 * c06_kick(tp2, 6, 14)})`;
      const pb = c.querySelector(".pb");
      pb.style.transform = `translateY(${pressed ? 6 : 0}px)`; pb.style.boxShadow = `0 ${pressed ? 1 : 7}px 0 ${INK}`;
      pb.style.background = tp2 > .1 ? "#c8372d" : "#d4623a";
      pb.querySelector(".ok").style.opacity = seg(tp2, .15, .35);
      const rpp = seg(tp2, 0, .55), rr = c.querySelector(".rp > div");
      rr.style.opacity = tp2 > 0 ? 1 - rpp : 0; rr.style.transform = `scale(${0.3 + 2.4 * out(rpp)})`;
      const clp = back(seg(t, 177.35 + i * .1, 177.7 + i * .1)), cl = c.querySelector(".cl");
      cl.style.opacity = clamp(clp * 2); cl.style.transform = `scale(${.4 + .6 * clp}) rotate(${4 - 2 * clp}deg)`;
      const sb = c.querySelector(".sb"), sp = back(seg(t, 176.8 + i * .12, 177.2 + i * .12));
      sb.style.opacity = clamp(sp * 2) * (t > 179.0 ? 1 : .75); sb.style.transform = `scale(${(0.6 + 0.4 * sp) * (1 + .1 * c06_kick(t - 179.05 - i * .1, 5, 14))})`;
    });
    const sn = back(seg(t, 179.0, 179.4)); softNote.style.opacity = clamp(sn * 2) * (1 - X2); softNote.style.transform = `translateY(${20 * (1 - sn)}px)`;
    // ---------- finale (181–184): "Noa's cheeks? Already full."
    const nIn = back(seg(t, 180.95, 181.4)), CH1 = 181.95;
    const puffF = t < 181 ? 1 : 1.25 + 1.05 * out(seg(t, CH1, CH1 + .3)) + .25 * c06_kick(t - CH1 - .3, 5, 13) + .04 * Math.sin(t * 9) * seg(t, CH1, CH1 + .3);
    poseNoa(noa, t, { x: 865, y: 612 + 300 * (1 - clamp(nIn)), s: 2.1, look: t > 181.3 && t < CH1 ? .5 : 0, mood: t > CH1 && t < CH1 + .45 ? "pout" : "happy",
      hop: t > 180.95 && t < 181.45 ? (t - 180.95) / .5 : t > 182.7 && t < 183.2 ? (t - 182.7) / .5 : 0, op: clamp(nIn * 3), arms: t > CH1 + .45 && t < 182.7 ? "hips" : undefined });
    c06_pouch.forEach(g => { const k = Math.max(.01, (puffF - 1) / 1.3), sx = k * (1 + .12 * c06_kick(t - CH1 - .3, 5, 13)), sy = k * (1 - .1 * c06_kick(t - CH1 - .3, 5, 13));
      g.setAttribute("transform", `translate(${g.cx} 128) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-g.cx} -128)`); g.style.display = t > 181 ? "" : "none"; });
    shakeCam(t, CH1, 9, .35);
    // "?" pops beside the cheek, then the FULL stamp slams
    const qp = back(seg(t, 181.3, 181.6)); c06_q.style.opacity = clamp(qp * 2) * (1 - seg(t, CH1 - .1, CH1));
    c06_q.style.transform = `translate(${1120}px, ${470}px) scale(${qp}) rotate(${10 + 8 * Math.sin(t * 6)}deg)`;
    const fp = seg(t, CH1 + .1, CH1 + .38);
    c06_full.style.opacity = t > CH1 + .1 ? 1 : 0;
    c06_full.style.transform = `rotate(-6deg) scale(${fp < 1 ? 2.4 - 1.4 * out(fp) : 1 + .05 * c06_kick(t - CH1 - .38, 6, 18)})`;
    shakeCam(t, CH1 + .38, 7, .3);
    // one coin too many pops out of each cheek
    c06_pc.forEach((c, i) => { const a = CH1 + .5 + i * .14, p = seg(t, a, a + .75), side = i % 2 ? 1 : -1;
      const x0 = 960 + side * 125, y0 = 610;
      c.style.opacity = p > 0 && p < 1 ? 1 : 0;
      c.style.transform = `translate(${x0 + side * (140 + 60 * i) * p - 26}px, ${y0 - 330 * p + 520 * p * p - 26}px) rotate(${side * 600 * p}deg) scale(${Math.abs(Math.cos(t * 8 + i)) * .6 + .4}, 1)`; });
    stars.forEach((e, i) => { const p = back(seg(t, 181.05 + i * .07, 181.4 + i * .07));
      e.style.opacity = clamp(p * 2); e.style.transform = `scale(${p * (0.85 + 0.2 * Math.sin(t * 5 + i))}) rotate(${t * 40 + i * 30}deg)`; });
    head.style.opacity = 1 - seg(t, 180.5, 180.9);
    wipeA(t, 175.9, .8); wipeB(t, 180.45, .8);
  };
});

// ---- Uchu (co-host): tries to catch coins (they all go to Noa), gets bonked by one,
//      then gasps when the envelope's ₩4,500,000 is confirmed ----
(() => {
  let u, ub, coin;
  uchuHook((t, s) => {
    if (!u) {
      u = makeUchu(160); s.root.appendChild(u); ub = makeBubble(s.root);
      coin = el("div", "position:absolute;left:0;top:0;z-index:33;width:44px;height:44px", `<svg width="44" height="44" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f7c843" stroke="${INK}" stroke-width="3"/>
        <circle cx="20" cy="20" r="11" fill="none" stroke="#c98a1a" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-size="19" font-family="GaeguLat" fill="#8a5a12">₩</text></svg>`, s.root);
    }
    const inP = seg(t, 162.7, 163.15), X1 = ease(seg(t, 175.95, 176.35));
    const x = 905 + 12 * Math.sin(t * 2.2) * (t < 165.8 ? 1 : 0), y = lerp(1060, 668, back(inP));
    let mood = "happy", hop = 0, arms = "up", look = -1, talk = false;
    if (t < 165.8) hop = ((t - 163.1) * 1.7) % 1 * .55;                 // jumping for coins, catching nothing
    else if (t < 166.55) { mood = "pout"; arms = "down"; }
    // one coin ricochets off Noa's head: bonk (166.55) → O-face → he catches it (167.0) → happy
    const cf = seg(t, 166.0, 166.55), bonk = t > 166.55 && t < 167.0;
    if (bonk) { mood = "shock"; arms = undefined; }
    if (t >= 167.0 && t < 170.3) { mood = "happy"; arms = undefined; hop = t < 167.6 ? seg(t, 167.0, 167.6) : 0; look = -.4; }
    if (t >= 170.3 && t < 175.4) { mood = "happy"; look = .8; arms = "hips"; }
    if (t >= 175.4) { mood = "shock"; look = .6; }                      // ₩4,500,000! (on the spoken "4.5")
    poseUchu(u, t, { x: x + 700 * X1, y: y - 120 * Math.sin(X1 * Math.PI), mood, hop, arms, look, talk, op: inP > 0 && X1 < 1 ? 1 : 0 });
    // coin path: Noa's head (≈780,720) → arc → Uchu's head, bounce up, into his mitten
    let cx, cy, cop = 1, cr = t * 600;
    if (t < 166.0) cop = 0;
    else if (t < 166.55) { cx = lerp(780, x + 70, cf); cy = lerp(720, y + 20, cf) - 160 * Math.sin(cf * Math.PI); }
    else if (t < 167.0) { const b = seg(t, 166.55, 167.0); cx = x + 70 + 40 * b; cy = y + 20 - 110 * Math.sin(b * Math.PI) + 60 * b; }
    else { cx = x + 125; cy = y + 110 + 3 * Math.sin(t * 5); cr = 0; }
    coin.style.opacity = cop * (1 - X1) * (t < 170.3 ? 1 : 0);
    if (cop) coin.style.transform = `translate(${cx}px, ${cy}px) rotate(${cr}deg) scale(${t > 167 ? 1 : Math.abs(Math.cos(t * 9)) * .7 + .3}, 1)`;
    sayBubble(ub, t, 166.6, 167.9, "아얏! …내 거다!", 1010, 560);
  });
})();
