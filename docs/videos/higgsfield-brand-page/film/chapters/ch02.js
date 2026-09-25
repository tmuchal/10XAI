// ---------------------------------------------------------------- 02 · The flow (40–72)
// Beats: 40.6 Noa struts into the spotlight under a "주인공" sign · 42.2 the customer walks
// in, the spotlight swings over, Noa is bumped aside and sulks under a rain cloud; the page's
// hero line "우리 회사는 업계 최고!" is struck out and rewritten for the customer · 45 Noa
// accepts a GUIDE badge · 46 a road draws: the customer walks problem → guide (Noa hands a
// map) → 3 stepping stones → presses the big button → success flag + confetti; each station
// lights the matching page section · 53 bars grow (+62% dwell, +317% scroll depth) while the
// page scrolls scene to scene; the +317% bar launches Noa into the air · 60 the wireframe
// flips into the real page; Hook / Proof / Action notes light up as it scrolls.
(() => {
const INK2 = "#2b2320";
const c02_rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const c02_settle = (t, f = 2.2, k = 5) => t <= 0 ? 0 : Math.exp(-k * t) * Math.sin(2 * Math.PI * f * t);
const C02_COL = ["#f7d774", "#f2a7a0", "#9fd3a8", "#bcdcf0", "#e8894f", "#d7b8f0"];

// Catmull-Rom through points → SVG path + arc-length lookup
function c02_road(P) {
  const pts = [P[0], ...P, P[P.length - 1]];
  let d = `M${P[0][0]} ${P[0][1]}`; const S = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
    for (let k = 0; k < 40; k++) {
      const u = k / 40, v = 1 - u;
      S.push([v * v * v * p1[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p2[0], v * v * v * p1[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p2[1], i - 1 + u]);
    }
  }
  S.push([...P[P.length - 1], P.length - 1]);
  let L = 0; S.forEach((s, i) => { if (i) L += Math.hypot(s[0] - S[i - 1][0], s[1] - S[i - 1][1]); s[3] = L; });
  const at = u => { // u = point index (fractional) → [x,y]
    for (let i = 1; i < S.length; i++) if (S[i][2] >= u) { const a = S[i - 1], b = S[i], f = (u - a[2]) / Math.max(1e-6, b[2] - a[2]); return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; }
    return S[S.length - 1];
  };
  const lenAt = u => { for (let i = 1; i < S.length; i++) if (S[i][2] >= u) return S[i][3]; return L; };
  return { d, L, at, lenAt };
}

function c02_person(parent) {
  const p = el("div", "left:0;top:0;width:100px;height:150px;z-index:24;transform-origin:50% 100%", `
    <svg viewBox="0 0 100 150" width="100" height="150" overflow="visible">
      <ellipse cx="50" cy="146" rx="30" ry="5" fill="rgba(43,35,32,.22)"/>
      <g class="bd">
      <rect class="lL" x="36" y="102" width="12" height="40" rx="5" fill="#3b3a58" stroke="${INK2}" stroke-width="3.5"/>
      <rect class="lR" x="53" y="102" width="12" height="40" rx="5" fill="#3b3a58" stroke="${INK2}" stroke-width="3.5"/>
      <rect class="aL" x="17" y="72" width="12" height="32" rx="5" fill="#3e8fb8" stroke="${INK2}" stroke-width="3.5"/>
      <g class="aR"><rect x="71" y="72" width="12" height="32" rx="5" fill="#3e8fb8" stroke="${INK2}" stroke-width="3.5"/>
        <path d="M70 100 h22 l-3 26 h-16z" fill="#f2a7a0" stroke="${INK2}" stroke-width="3"/><path d="M76 100 q5 -10 10 0" fill="none" stroke="${INK2}" stroke-width="3"/></g>
      <path d="M24 112 Q22 66 50 64 Q78 66 76 112 Z" fill="#3e8fb8" stroke="${INK2}" stroke-width="4"/>
      <path d="M40 66 L50 80 L60 66" fill="none" stroke="#fffaf0" stroke-width="4"/>
      <circle cx="50" cy="40" r="25" fill="#f6d2b0" stroke="${INK2}" stroke-width="4"/>
      <path d="M25 40 Q26 12 52 13 Q77 15 75 42 Q66 26 52 28 Q36 28 25 40Z" fill="#5b3a29" stroke="${INK2}" stroke-width="3.5"/>
      <g class="ey"><circle cx="41" cy="44" r="3.4" fill="${INK2}"/><circle cx="59" cy="44" r="3.4" fill="${INK2}"/></g>
      <path class="mo" d="M43 54 Q50 60 57 54" fill="none" stroke="${INK2}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="35" cy="52" rx="5" ry="3" fill="#f08aa0" opacity=".6"/><ellipse cx="65" cy="52" rx="5" ry="3" fill="#f08aa0" opacity=".6"/>
      <g class="crown" opacity="0"><path d="M32 16 L36 -4 L45 8 L50 -8 L55 8 L64 -4 L68 16 Z" fill="#f7d774" stroke="${INK2}" stroke-width="3.5" stroke-linejoin="round"/></g>
      </g></svg>`, parent); p.className = "abs";
  const q = x => p.querySelector(x);
  p.P = { bd: q(".bd"), lL: q(".lL"), lR: q(".lR"), aL: q(".aL"), aR: q(".aR"), mo: q(".mo"), crown: q(".crown"), ey: q(".ey") };
  return p;
}
// feet at (x,y); walk = phase in cycles (0 = standing)
function c02_posePerson(p, t, { x, y, s = 1, walk = 0, moving = false, flip = false, jump = 0, mood = "happy", reach = 0, crown = 0, op = 1 }) {
  const sw = moving ? Math.sin(walk * Math.PI * 2) * 22 : 0;
  const bob = moving ? -Math.abs(Math.sin(walk * Math.PI * 2)) * 6 : Math.sin(t * 3) * 1.5;
  p.style.transform = `translate(${x - 50}px, ${y - 150 + bob - jump}px) scale(${flip ? -s : s}, ${s})`;
  p.style.opacity = op;
  p.P.lL.setAttribute("transform", `rotate(${sw} 42 104)`); p.P.lR.setAttribute("transform", `rotate(${-sw} 59 104)`);
  p.P.aL.setAttribute("transform", `rotate(${-sw * 0.8 + (jump > 0 ? 140 : 0)} 23 74)`);
  p.P.aR.setAttribute("transform", `rotate(${sw * 0.8 - reach * 70} 77 74)`);
  p.P.mo.setAttribute("d", mood === "shock" ? "M46 56 a4 4 0 1 0 0.1 0" : mood === "big" ? "M42 52 Q50 64 58 52 Z" : "M43 54 Q50 60 57 54");
  p.P.mo.setAttribute("fill", mood === "shock" || mood === "big" ? INK2 : "none");
  p.P.crown.setAttribute("opacity", crown > 0 ? 1 : 0);
  p.P.crown.setAttribute("transform", `translate(0 ${-30 * (1 - crown)}) rotate(${6 * Math.sin(t * 4)} 50 10)`);
}

scene(40, 72, (R, s) => {
  s.caps = [[40.2, "흐름의 핵심: 주인공은 브랜드가 아니라 고객", "The customer is the hero, not the brand"],
            [46, "고객의 문제 → 길잡이인 우리 → 3단계 계획 → 분명한 버튼", "Problem → you as the guide → a 3-step plan → a clear button"],
            [53, "스크롤이 곧 장면 전환: 인터랙티브 비주얼은 체류시간을 늘린다", "Scroll as scene change: interactive visuals raise dwell time"],
            [60, "제 페이지에 흐름을 대입하면", "Mapped onto my page"]];
  s.cite = [[40, "StoryBrand SB7 · Donald Miller"], [53, "Infogram × DC Thomson, 2015 (인용)"]];
  const cam = el("div", "position:absolute;inset:0", "", R);
  chapter(cam, "CHAPTER 02", "전체 흐름 잡기");

  // ================= spotlight stage (40–46) =================
  const SPOT_X = 600;
  const spot = el("div", "left:0;top:0;width:1000px;height:900px;z-index:2", `<svg width="1000" height="900" overflow="visible">
    <g class="beam"><path d="M${SPOT_X - 40} 120 L${SPOT_X + 40} 120 L${SPOT_X + 170} 830 L${SPOT_X - 170} 830 Z" fill="#fff6c8" opacity=".75"/>
    <ellipse cx="${SPOT_X}" cy="830" rx="175" ry="34" fill="#fff1a8" stroke="${INK2}" stroke-width="3" stroke-dasharray="10 10"/></g>
    <g class="lamp"><rect x="${SPOT_X - 46}" y="92" width="92" height="40" rx="10" fill="#6b5d52" stroke="${INK2}" stroke-width="4"/><line x1="${SPOT_X}" y1="40" x2="${SPOT_X}" y2="92" stroke="${INK2}" stroke-width="5"/></g></svg>`, cam); spot.className = "abs";
  const beam = spot.querySelector(".beam"), lamp = spot.querySelector(".lamp");
  const sign = el("div", "left:0;top:0;z-index:6;transform-origin:50% -120px", `
    <svg width="360" height="260" overflow="visible" style="position:absolute;left:-180px;top:-120px"><line x1="60" y1="0" x2="100" y2="120" stroke="${INK2}" stroke-width="4"/><line x1="300" y1="0" x2="260" y2="120" stroke="${INK2}" stroke-width="4"/></svg>
    <div style="position:absolute;left:-180px;top:0;width:360px;padding:10px 0 14px;text-align:center;background:#fbe3b0;border:4px solid ${INK2};border-radius:14px;box-shadow:6px 7px 0 rgba(43,35,32,.25)">
      <div style="font-size:26px;color:#c8372d;letter-spacing:3px">★ HERO ★</div>
      <div class="sg" style="font-size:44px;line-height:1.1">주인공 = <span class="who">노아</span></div></div>`, cam); sign.className = "abs";
  const who = sign.querySelector(".who");
  const cloud = el("div", "left:0;top:0;z-index:26;opacity:0", `<svg width="150" height="120" viewBox="0 0 150 120" overflow="visible">
    <g class="dr">${[30, 60, 90, 118].map((x, i) => `<line class="d${i}" x1="${x}" y1="70" x2="${x - 6}" y2="88" stroke="#3e8fb8" stroke-width="5" stroke-linecap="round"/>`).join("")}</g>
    <path d="M22 66 Q4 64 10 46 Q14 30 34 34 Q40 10 66 14 Q88 4 100 26 Q126 20 132 42 Q148 50 138 64 Z" fill="#c9cfd8" stroke="${INK2}" stroke-width="4" stroke-linejoin="round"/></svg>`, cam); cloud.className = "abs";
  const drops = [0, 1, 2, 3].map(i => cloud.querySelector(".d" + i));
  const badge = el("div", `left:0;top:0;z-index:32;padding:4px 14px 6px;background:#f7d774;border:3px solid ${INK2};border-radius:10px;font-size:24px;white-space:nowrap;opacity:0`, "🧭 가이드", cam); badge.className = "abs";

  // ================= story road (46–53) =================
  const ST = [[230, 818], [560, 806], [835, 690], [600, 575], [320, 470], [590, 330]];
  const road = c02_road([[180, 824], ...ST, [720, 300]]);
  const U = i => i + 1; // station i sits at point index i+1
  const roadEl = el("div", "left:0;top:0;width:1000px;height:900px;z-index:3", `<svg width="1000" height="900" overflow="visible">
    <path class="r0" d="${road.d}" fill="none" stroke="${INK2}" stroke-width="66" stroke-linecap="round"/>
    <path class="r1" d="${road.d}" fill="none" stroke="#f6dca8" stroke-width="58" stroke-linecap="round"/>
    <path class="r2" d="${road.d}" fill="none" stroke="#fffaf0" stroke-width="5" stroke-dasharray="16 18" stroke-linecap="round"/></svg>`, cam); roadEl.className = "abs";
  const rPaths = ["r0", "r1", "r2"].map(c => roadEl.querySelector("." + c));
  // stations: numbered badge + label, plus a prop
  const LBL = [["주인공", "Hero"], ["문제", "Problem"], ["가이드", "Guide"], ["계획", "Plan"], ["행동", "Action"], ["성공", "Success"]];
  const LPOS = [[175, 568], [470, 640], [730, 440], [540, 420], [175, 290], [740, 250]];
  const stations = ST.map((p, i) => {
    const d = el("div", `left:${LPOS[i][0]}px;top:${LPOS[i][1]}px;z-index:20;white-space:nowrap;display:flex;align-items:center;gap:8px;padding:4px 14px 6px 6px;background:#fffaf0;border:3px solid ${INK2};border-radius:999px;box-shadow:4px 5px 0 rgba(43,35,32,.2);transform-origin:20% 100%`,
      `<span style="display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:${C02_COL[i]};border:3px solid ${INK2};font-size:24px">${i + 1}</span><span style="font-size:30px">${LBL[i][0]}</span><span style="font-size:22px;color:#6b5d52">${LBL[i][1]}</span>`, cam);
    d.className = "abs"; return d;
  });
  // props
  const rock = el("div", `left:${ST[1][0] + 36}px;top:${ST[1][1] - 84}px;z-index:22`, `<svg width="110" height="90" viewBox="0 0 110 90" overflow="visible">
    <path d="M8 86 Q2 50 30 36 Q50 8 78 26 Q106 36 102 86 Z" fill="#b8a898" stroke="${INK2}" stroke-width="4"/><path d="M40 50 q10 -8 20 2" fill="none" stroke="${INK2}" stroke-width="3"/>
    <text class="qm" x="80" y="-6" font-size="46" fill="#c8372d" font-family="GaeguLat">?!</text></svg>`, cam); rock.className = "abs";
  const qm = rock.querySelector(".qm");
  const stones = [0, 1, 2].map(k => { const pt = road.at(U(3) - 0.55 + k * 0.4); const d = el("div", `left:${pt[0] - 34}px;top:${pt[1] + 2}px;z-index:4`, `<svg width="68" height="34" overflow="visible"><ellipse cx="34" cy="14" rx="30" ry="13" fill="#d7cfc4" stroke="${INK2}" stroke-width="3.5"/><text x="34" y="23" text-anchor="middle" font-size="24" fill="${INK2}" font-family="GaeguLat">${k + 1}</text></svg>`, cam); d.className = "abs"; d.pt = pt; return d; });
  const bigBtn = el("div", `left:${ST[4][0] - 150}px;top:${ST[4][1] - 110}px;z-index:22`, `<svg width="110" height="120" overflow="visible">
    <rect x="18" y="62" width="74" height="54" rx="6" fill="#6b5d52" stroke="${INK2}" stroke-width="4"/>
    <g class="cap"><ellipse cx="55" cy="62" rx="42" ry="14" fill="#8f1f18" stroke="${INK2}" stroke-width="4"/><path d="M13 62 V44 A42 14 0 0 1 97 44 V62" fill="#c8372d" stroke="${INK2}" stroke-width="4"/><ellipse cx="55" cy="44" rx="42" ry="14" fill="#e0524a" stroke="${INK2}" stroke-width="4"/>
    <text x="55" y="51" text-anchor="middle" font-size="22" fill="#fffaf0" font-family="GaeguKo">GO</text></g></svg>`, cam); bigBtn.className = "abs";
  const btnCap = bigBtn.querySelector(".cap");
  const flag = el("div", `left:${ST[5][0] + 30}px;top:${ST[5][1] - 190}px;z-index:22`, `<svg width="140" height="200" overflow="visible">
    <line x1="20" y1="190" x2="20" y2="10" stroke="${INK2}" stroke-width="6" stroke-linecap="round"/>
    <path class="fl" d="M20 12 Q60 2 100 16 L100 64 Q60 52 20 62 Z" fill="#c8372d" stroke="${INK2}" stroke-width="4"/>
    <text x="58" y="46" text-anchor="middle" font-size="30" fill="#fffaf0" font-family="GaeguLat">★</text></svg>`, cam); flag.className = "abs";
  const flagCloth = flag.querySelector(".fl"), flagSvg = flag.querySelector("svg");
  const mapProp = el("div", `left:0;top:0;z-index:34;opacity:0`, `<svg width="56" height="44" viewBox="0 0 56 44"><path d="M3 6 L19 2 L37 8 L53 3 L53 38 L37 42 L19 36 L3 41 Z" fill="#fffaf0" stroke="${INK2}" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 30 Q24 12 30 24 T46 12" fill="none" stroke="#c8372d" stroke-width="3" stroke-dasharray="4 4"/></svg>`, cam); mapProp.className = "abs";
  const COLS = ["#f7d774", "#e0607e", "#3e8fb8", "#9fd3a8", "#e8894f"];
  const conf = Array.from({ length: 36 }, (_, i) => { const d = el("div", `left:0;top:0;width:${12 + c02_rnd(i) * 10}px;height:${8 + c02_rnd(i + 50) * 9}px;background:${COLS[i % 5]};border:2px solid ${INK2};border-radius:2px;z-index:35;opacity:0`, "", cam); d.className = "abs"; return d; });
  const burst = (t, T0, ox, oy, seed, from = 0, to = conf.length) => conf.slice(from, to).forEach((d, j) => {
    const i = j + seed, dt = t - T0 - (j % 5) * 0.03;
    if (dt < 0 || dt > 2.4) { d.style.opacity = 0; return; }
    const a = -Math.PI / 2 + (c02_rnd(i + 9) - 0.5) * 2.6, v = 500 + 600 * c02_rnd(i + 3), k = (1 - Math.exp(-2.4 * dt)) / 2.4;
    d.style.opacity = 1 - seg(dt, 1.8, 2.4);
    d.style.transform = `translate(${ox + Math.cos(a) * v * k + 10 * Math.sin(dt * 7 + i)}px, ${oy + Math.sin(a) * v * k + 200 * dt * dt}px) rotate(${dt * (300 + 400 * c02_rnd(i))}deg) scaleX(${Math.cos(dt * 8 + i)})`;
  });

  // ================= page wireframe (right) =================
  const WX = 1030, WY = 170, WW = 720, WH = 690;
  const wire = el("div", `left:${WX}px;top:${WY}px;width:${WW}px;height:${WH}px;word-break:keep-all;background:#fffaf0;border:4px solid ${INK2};border-radius:18px;overflow:hidden;box-shadow:9px 11px 0 rgba(43,35,32,.22);z-index:8;transform-origin:50% 50%`, `
    <div style="height:48px;background:#f6d9a0;border-bottom:4px solid ${INK2};display:flex;align-items:center;gap:9px;padding:0 16px">
      <i style="width:13px;height:13px;border-radius:50%;background:#ff5f57;border:2px solid ${INK2}"></i><i style="width:13px;height:13px;border-radius:50%;background:#febc2e;border:2px solid ${INK2}"></i><i style="width:13px;height:13px;border-radius:50%;background:#28c840;border:2px solid ${INK2}"></i>
      <span style="margin-left:12px;font-size:24px">내 브랜드 페이지 · 설계도</span></div>
    <div class="vp" style="position:absolute;left:0;right:0;top:52px;bottom:0;overflow:hidden"><div class="inner" style="position:absolute;left:0;right:0;top:0;padding:14px 18px"></div></div>
    <div class="sb" style="position:absolute;right:6px;top:60px;width:10px;height:120px;border-radius:5px;background:#6b5d52;opacity:.5"></div>`, cam); wire.className = "abs";
  const inner = wire.querySelector(".inner"), sbar = wire.querySelector(".sb");
  const SECT = [["주인공", "Hero", "당신의 고민, 3일이면 끝"], ["문제", "Problem", "이런 게 불편하셨죠?"], ["가이드", "Guide", "후기 128 · 경력 7년"],
    ["계획", "Plan", "1 상담 → 2 제작 → 3 오픈"], ["행동", "Action", "지금 상담 예약 →"], ["성공", "Success", "“문의가 두 배가 됐어요”"]];
  const rows = SECT.map((r, i) => {
    const d = el("div", `position:relative;height:92px;margin-bottom:10px;border:3px solid ${INK2};border-radius:12px;background:${C02_COL[i]};display:flex;align-items:center;gap:14px;padding:0 16px;white-space:nowrap`,
      `<span class="bd" style="flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#fffaf0;border:3px solid ${INK2};font-size:28px">${i + 1}</span>
       <span style="flex:none;width:110px;font-size:34px">${r[0]}</span><span style="font-size:28px;color:#4a3f38">${r[2]}</span>`, inner);
    d.bd = d.querySelector(".bd"); return d;
  });
  // one big section card at a time (40.5–53), plus a pill strip that assembles the page
  const sec = el("div", `left:1000px;top:200px;width:760px;height:400px;z-index:9;background:#fffaf0;border:5px solid ${INK2};border-radius:22px;overflow:hidden;box-shadow:10px 12px 0 rgba(43,35,32,.22);word-break:keep-all`, `
    <div style="height:56px;background:#f6d9a0;border-bottom:4px solid ${INK2};display:flex;align-items:center;padding:0 20px;font-size:28px">내 페이지 설계도 · <span class="sn" style="margin-left:8px;color:#c8372d">섹션 1/6</span></div>
    <div class="panes" style="position:absolute;left:0;right:0;top:60px;bottom:0"></div>`, cam); sec.className = "abs";
  const secN = sec.querySelector(".sn");
  const panes = SECT.map((r, i) => {
    let ex = `<div style="font-size:50px;line-height:1.2">${r[2]}</div>`;
    if (i === 0) ex = `<div class="h1" style="font-size:50px;position:relative;white-space:nowrap;display:inline-block">우리 회사는 업계 최고!<svg class="strike" width="520" height="40" style="position:absolute;left:-10px;top:24px" overflow="visible"><path d="M0 18 Q130 4 260 16 T520 10" stroke="#c8372d" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="560" stroke-dashoffset="560"/></svg></div><div class="h2" style="font-size:54px;color:#c8372d;white-space:nowrap"></div>`;
    if (i === 3) ex = `<div style="display:flex;gap:14px">${["상담", "제작", "오픈"].map((x, k) => `<span class="pc" style="display:inline-block;font-size:42px;padding:6px 22px 10px;border:4px solid ${INK2};border-radius:999px;background:${C02_COL[3]}">${k + 1} ${x}</span>`).join("")}</div>`;
    if (i === 4) ex = `<span class="cta" style="display:inline-block;font-size:46px;padding:10px 34px 14px;border:4px solid ${INK2};border-radius:999px;background:#c8372d;color:#fffaf0;box-shadow:5px 6px 0 rgba(43,35,32,.25)">지금 상담 예약 →</span>`;
    if (i === 5) ex = `<div style="font-size:48px">“문의가 두 배가 됐어요”</div><div style="font-size:44px;color:#d98c1f">★★★★★</div>`;
    const d = el("div", `position:absolute;inset:0;padding:30px 36px;display:none`, `
      <div style="display:flex;align-items:center;gap:20px"><span class="bd" style="display:grid;place-items:center;width:96px;height:96px;border-radius:50%;background:${C02_COL[i]};border:5px solid ${INK2};font-size:56px">${i + 1}</span>
        <span style="font-size:84px;line-height:1">${r[0]}</span><span style="font-size:32px;color:#6b5d52;align-self:flex-end;margin-bottom:8px">${r[1]} 섹션</span></div>
      <div class="ex" style="margin-top:34px">${ex}</div>`, sec.querySelector(".panes"));
    d.bd = d.querySelector(".bd"); d.ex = d.querySelector(".ex"); return d;
  });
  const h1 = panes[0].querySelector(".h1"), h2 = panes[0].querySelector(".h2"), strike = panes[0].querySelector(".strike path");
  const pills = SECT.map((r, i) => { const d = el("div", `left:${1000 + i * 128}px;top:640px;width:118px;height:104px;z-index:9;border:4px solid ${INK2};border-radius:14px;background:#efe6d6;text-align:center;padding-top:6px;box-shadow:4px 5px 0 rgba(43,35,32,.18)`,
    `<div style="display:grid;place-items:center;width:40px;height:40px;margin:0 auto;border-radius:50%;background:#fffaf0;border:3px solid ${INK2};font-size:24px">${i + 1}</div><div style="font-size:28px;white-space:nowrap">${r[0]}</div>`, cam); d.className = "abs"; return d; });
  // scroll-as-scene-change sections below the rows
  const SCN = [[PAL.dawn, "장면 1 · 새벽의 첫 컷"], [PAL.forest, "장면 2 · 숲으로 스크롤"], [PAL.sea, "장면 3 · 바다에서 CTA"]];
  const scenesF = SCN.map(([pl, lab]) => {
    const box = el("div", `position:relative;height:430px;margin-bottom:12px;border:3px solid ${INK2};border-radius:12px;overflow:hidden`, "", inner);
    const f = makeFilm(pl); box.appendChild(f);
    const l = el("div", `position:absolute;left:18px;top:18px;padding:4px 16px 6px;background:#fffaf0;border:3px solid ${INK2};border-radius:10px;font-size:28px;z-index:2`, lab, box);
    box.f = f; box.l = l; return box;
  });
  const mouse = el("div", `left:${WX + WW - 96}px;top:${WY + WH - 150}px;z-index:12;opacity:0`, `<svg width="64" height="96" viewBox="0 0 64 96"><rect x="4" y="4" width="56" height="86" rx="28" fill="#fffaf0" stroke="${INK2}" stroke-width="4"/><line x1="32" y1="4" x2="32" y2="36" stroke="${INK2}" stroke-width="3"/><rect class="wh" x="27" y="16" width="10" height="16" rx="5" fill="#c8372d" stroke="${INK2}" stroke-width="2.5"/></svg>`, cam); mouse.className = "abs";
  const wheel = mouse.querySelector(".wh");

  // ================= stats (53–60) =================
  const BASE = 790, UNIT = 1.0;
  const bars = [[180, 100, "#d7cfc4"], [290, 162, "#f7d774"], [520, 100, "#d7cfc4"], [630, 417, "#e8894f"]].map(([x, v, c]) => {
    const d = el("div", `left:${x}px;top:${BASE}px;width:96px;height:0;z-index:10;background:${c};border:4px solid ${INK2};border-bottom:none;border-radius:10px 10px 0 0;box-shadow:6px 0 0 rgba(43,35,32,.18)`, "", cam);
    d.className = "abs"; d.v = v; return d; });
  const baseLine = el("div", `left:180px;top:${BASE}px;width:620px;height:6px;background:${INK2};border-radius:3px;z-index:11;transform-origin:0 50%`, "", cam); baseLine.className = "abs";
  const nums = [[338, "+62%", 62], [678, "+317%", 317]].map(([cx, txt, v], i) => { const d = el("div", `left:${cx - 230}px;top:0;width:460px;text-align:center;z-index:12;font-size:${i ? 160 : 136}px;line-height:1;white-space:nowrap;color:#c8372d;text-shadow:4px 4px 0 #f7d774;-webkit-text-stroke:4px ${INK2};text-shadow:7px 7px 0 #f7d774;opacity:0`, txt, cam); d.className = "abs"; d.v = v; return d; });
  const blabels = [[288, "평균 체류시간"], [628, "스크롤 깊이"]].map(([cx, txt]) => { const d = el("div", `left:${cx - 140}px;top:${BASE + 12}px;width:280px;text-align:center;z-index:12;font-size:36px;white-space:nowrap;opacity:0`, txt, cam); d.className = "abs"; return d; });
  const legend = el("div", `left:560px;top:140px;z-index:12;font-size:28px;white-space:nowrap;opacity:0`, `<span style="display:inline-block;width:22px;height:22px;background:#d7cfc4;border:3px solid ${INK2};vertical-align:-3px"></span> 정적 페이지 &nbsp; <span style="display:inline-block;width:22px;height:22px;background:#e8894f;border:3px solid ${INK2};vertical-align:-3px"></span> 인터랙티브`, cam); legend.className = "abs";
  const dizzy = el("div", `left:0;top:0;z-index:33;font-size:30px;color:#d98c1f;opacity:0;white-space:nowrap`, "★ ✦ ★", cam); dizzy.className = "abs";

  // ================= reference (60–72) =================
  const ref = refWindow(cam, 980, 150, 800, 720);
  ref.style.transformOrigin = "50% 50%";
  const NOTES = [["훅 · Hook", "첫 화면에서 붙잡기", [0, 1]], ["증거 · Proof", "작업 · 숫자 · 후기", [2, 3]], ["행동 · Action", "분명한 버튼 하나", [4, 5]]];
  const notes = NOTES.map((n, i) => {
    const d = el("div", `left:180px;top:${236 + i * 176}px;width:560px;height:152px;z-index:14;background:${["#fbe3b0", "#f8d3df", "#d5ecd0"][i]};border:4px solid ${INK2};border-radius:14px;padding:14px 22px;box-shadow:7px 8px 0 rgba(43,35,32,.22);transform-origin:0 50%`,
      `<div style="font-size:44px;line-height:1.05">${n[0]}</div><div style="font-size:28px;color:#6b5d52">${n[1]}</div>
       <div style="position:absolute;right:18px;top:16px;display:flex;gap:8px">${n[2].map(k => `<span style="display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:${C02_COL[k]};border:3px solid ${INK2};font-size:24px">${k + 1}</span>`).join("")}</div>`, cam);
    d.className = "abs"; return d; });
  const arrow = el("div", "left:0;top:0;width:1920px;height:1000px;z-index:13", `<svg width="1920" height="1000" overflow="visible"><path class="ar" d="" fill="none" stroke="${INK2}" stroke-width="5" stroke-dasharray="12 10" stroke-linecap="round"/><path class="ah" d="" fill="${INK2}"/></svg>`, cam); arrow.className = "abs";
  const arP = arrow.querySelector(".ar"), arH = arrow.querySelector(".ah");
  const c02_markTop = bx => 150 + bx.y - 58 >= 196 ? 150 + bx.y - 58 : 150 + bx.y + bx.h + 8;   // window at y 150
  const marks = REF_MARKS.map((m, i) => { const d = el("div", `left:930px;top:0;z-index:16;padding:6px 16px 8px;border:4px solid ${INK2};border-radius:12px;font-size:28px;white-space:nowrap;background:${["#fbe3b0", "#f8d3df", "#d5ecd0"][i]};box-shadow:4px 5px 0 rgba(43,35,32,.25);transform-origin:0 50%`, m[1], cam); d.className = "abs"; return d; });
  const toot = el("div", `left:0;top:0;z-index:36;font-size:38px;color:#c8372d;opacity:0;white-space:nowrap`, "뿌우~!", cam); toot.className = "abs";

  // ================= cast =================
  const cust = c02_person(cam);
  const noa = makeNoa(150); cam.appendChild(noa);
  const horn = document.createElementNS("http://www.w3.org/2000/svg", "g");
  horn.innerHTML = `<path d="M100 126 L136 114 L136 138 Z" fill="#3e8fb8" stroke="${INK2}" stroke-width="4" stroke-linejoin="round"/>
    <rect class="tube" x="134" y="119" width="0" height="14" rx="4" fill="#f7d774" stroke="${INK2}" stroke-width="3.5"/>
    <circle class="curl" cx="142" cy="126" r="9" fill="none" stroke="#e0607e" stroke-width="6"/>`;
  noa.P.b.appendChild(horn);
  const tube = horn.querySelector(".tube"), curl = horn.querySelector(".curl");
  const bub = makeBubble(cam); bub.style.whiteSpace = "normal"; bub.style.width = "360px"; bub.style.textAlign = "center"; bub.style.wordBreak = "keep-all";
  const bubC = makeBubble(cam), bubN = makeBubble(cam);
  // "coping" loading bar (63.6–71): crawls, stalls, then snaps to 100% when Uchu cheers him up
  const c02_meter = el("div", `left:690px;top:318px;width:440px;z-index:37;opacity:0;transform-origin:50% 100%`, `
    <div class="lb" style="font-size:32px;text-align:center;white-space:nowrap;margin-bottom:6px">멘탈 회복 중…</div>
    <div style="position:relative;height:46px;border:4px solid ${INK2};border-radius:999px;background:#fffaf0;overflow:hidden;box-shadow:5px 6px 0 rgba(43,35,32,.2)">
      <div class="fill" style="position:absolute;left:0;top:0;bottom:0;width:0;background:repeating-linear-gradient(-45deg,#9fd3f0 0 16px,#7cbfe6 16px 32px)"></div>
      <div class="pc" style="position:absolute;left:0;right:0;top:3px;text-align:center;font-size:30px;line-height:1">3%</div></div>`, cam); c02_meter.className = "abs";
  const c02_mFill = c02_meter.querySelector(".fill"), c02_mPc = c02_meter.querySelector(".pc"), c02_mLb = c02_meter.querySelector(".lb");
  const c02_burst = makeBurst(cam, 22, 7);
  const c02_glint = document.createElementNS("http://www.w3.org/2000/svg", "path");
  c02_glint.setAttribute("d", "M0 -14 L3 -3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3 -3Z"); c02_glint.setAttribute("fill", "#fff"); c02_glint.setAttribute("stroke", INK2); c02_glint.setAttribute("stroke-width", "2");
  noa.P.b.appendChild(c02_glint);

  // customer timeline along the road: [arrive time, depart time] per station
  const STOPS = [[46.4, 46.7], [47.2, 47.7], [48.2, 48.9], [49.6, 49.9], [50.5, 51.2], [51.9, 53]];
  const custU = t => {
    if (t < STOPS[0][0]) return U(0);
    for (let i = 0; i < STOPS.length; i++) {
      if (t <= STOPS[i][1]) return U(i);
      if (i + 1 < STOPS.length && t < STOPS[i + 1][0]) return lerp(U(i), U(i + 1), ease(seg(t, STOPS[i][1], STOPS[i + 1][0])));
    }
    return U(5);
  };
  const reached = t => { let k = -1; STOPS.forEach((st, i) => { if (t >= st[0]) k = i; }); return k; };

  return t => {
    // ---------------- phase switches ----------------
    const toRoad = seg(t, 45.8, 46.6), toStats = seg(t, 52.9, 53.6), toRef = seg(t, 59.4, 60.4);
    // spotlight stage
    const beamX = t < 42.4 ? 0 : 0;
    spot.style.opacity = seg(t, 40.3, 40.8) * (1 - toRoad);
    beam.setAttribute("opacity", 0.6 + 0.4 * Math.abs(Math.sin(t * 7)) * (t < 40.9 ? 1 : 0) + (t > 40.9 ? 0.4 : 0));
    beam.setAttribute("transform", `rotate(${t > 42.5 && t < 42.9 ? -3 * Math.sin(seg(t, 42.5, 42.9) * Math.PI) : 0} ${SPOT_X} 110)`);
    lamp.setAttribute("transform", `translate(0 ${-20 * (1 - out(seg(t, 40.3, 40.8)))})`);
    const sIn = seg(t, 40.5, 41.0), sOut = toRoad;
    const swing = 7 * c02_settle(t - 41.0, 1.1, 1.8) + 9 * c02_settle(t - 42.9, 1.3, 2);
    sign.style.opacity = sIn > 0 ? 1 - sOut : 0;
    sign.style.transform = `translate(${SPOT_X}px, ${lerp(-300, 236, out(sIn)) - 400 * sOut * sOut}px) rotate(${swing}deg)`;
    who.textContent = t < 42.9 ? "노아" : "고객";
    who.style.color = t < 42.9 ? INK2 : "#c8372d";
    who.style.display = "inline-block"; who.style.transform = `scale(${t > 42.9 ? back(seg(t, 42.9, 43.2)) : 1})`;

    // road + stations
    roadEl.style.opacity = t > 45.7 ? 1 - toStats : 0;
    const drawn = ease(seg(t, 45.8, 47.0));
    rPaths.forEach((p, i) => { p.setAttribute("stroke-dasharray", i === 2 ? "16 18" : `${road.L} ${road.L}`); if (i < 2) p.setAttribute("stroke-dashoffset", road.L * (1 - drawn)); });
    rPaths[2].setAttribute("opacity", drawn >= 1 ? 1 : 0);
    const rk = reached(t);
    stations.forEach((d, i) => {
      const a = i === 0 ? 46.3 : STOPS[i][0] - 0.25, p = seg(t, a, a + 0.4);
      d.style.opacity = (p > 0 ? 1 : 0) * (1 - toStats);
      const lit = rk === i && t < 52.9;
      d.style.transform = `scale(${back(p) * (lit ? 1.12 : 1)}) rotate(${(i % 2 ? 2 : -2) + (lit ? 2 * Math.sin(t * 6) : 0)}deg)`;
      d.style.background = lit ? "#fff1a8" : "#fffaf0";
    });
    const propOp = (a) => seg(t, a, a + 0.3) * (1 - toStats);
    rock.style.opacity = propOp(46.6);
    rock.style.transform = `translateY(${-20 * (1 - back(seg(t, 46.6, 46.9)))}px) rotate(${t > 47.2 && t < 47.7 ? 3 * Math.sin(t * 40) : 0}deg)`;
    qm.setAttribute("opacity", t > 47.2 && t < 47.9 ? 1 : 0);
    stones.forEach((d, k) => {
      const hopOn = seg(t, 48.9 + k * 0.23, 49.1 + k * 0.23);
      d.style.opacity = propOp(47.4 + k * 0.1);
      d.style.transform = `translateY(${4 * Math.sin(hopOn * Math.PI)}px)`;
    });
    bigBtn.style.opacity = propOp(48.2);
    const press = seg(t, 50.6, 50.72) - seg(t, 50.8, 51.0);
    btnCap.setAttribute("transform", `translate(0 ${14 * press})`);
    flag.style.opacity = propOp(48.8);
    const raise = back(seg(t, 51.9, 52.4));
    flagSvg.style.transform = `translateY(${120 * (1 - raise)}px)`; flagSvg.style.clipPath = "inset(-40px -40px 0 -40px)";
    flag.style.overflow = "hidden"; flag.style.height = "200px";
    flagCloth.setAttribute("d", `M20 12 Q60 ${2 + 8 * Math.sin(t * 6)} 100 16 L100 64 Q60 ${52 + 8 * Math.sin(t * 6 + 1)} 20 62 Z`);
    burst(t, 52.0, ST[5][0] + 60, ST[5][1] - 160, 0, 0, 18);

    // big section card: flips to the section the customer just reached, then collapses into the page
    const wIn = back(seg(t, 52.85, 53.3));
    const SW = [40.5, ...STOPS.slice(1).map(st => st[0] - 0.1)];
    let cur = 0; SW.forEach((w, i) => { if (t >= w) cur = i; });
    const dSw = Math.min(...SW.slice(1).map(w => Math.abs(t - w)));
    const flipY = dSw < 0.16 ? dSw / 0.16 : 1;
    const secIn = back(seg(t, 40.4, 40.95)), col = seg(t, 52.5, 52.95);
    sec.style.opacity = secIn > 0 && col < 1 ? 1 : 0;
    sec.style.transformOrigin = "50% 50%";
    sec.style.transform = `translate(${60 * col}px, ${-40 * (1 - secIn) + 200 * col * col}px) scale(${(0.6 + 0.4 * secIn) * (1 - 0.8 * col)}, ${flipY * (0.6 + 0.4 * secIn) * (1 - 0.8 * col)}) rotate(${-1 + 1.2 * c02_settle(t - Math.max(...SW.filter(w => w <= t), 40.95), 1.4, 3.5)}deg)`;
    secN.textContent = `섹션 ${cur + 1}/6`;
    panes.forEach((pn, i) => {
      pn.style.display = i === cur ? "block" : "none";
      if (i !== cur) return;
      const a = SW[i] + 0.1, p = back(seg(t, a, a + 0.4));
      pn.ex.style.transform = `translateY(${30 * (1 - p)}px) scale(${0.8 + 0.2 * p})`; pn.ex.style.opacity = clamp(p * 1.5);
      pn.ex.style.transformOrigin = "0 50%";
      pn.bd.style.transform = `scale(${1 + 0.3 * Math.abs(c02_settle(t - a, 2.2, 4))}) rotate(${-8 * c02_settle(t - a, 1.5, 3)}deg)`;
    });
    if (cur === 4) { const pc = seg(t, 50.6, 50.72) - seg(t, 50.8, 51.0); panes[4].querySelector(".cta").style.transform = `scale(${1 - 0.1 * pc})`; }
    if (cur === 3) panes[3].querySelectorAll(".pc").forEach((c, k) => { c.style.transform = `translateY(${-16 * Math.sin(seg(t, 48.9 + k * 0.23, 49.15 + k * 0.23) * Math.PI)}px)`; });
    pills.forEach((pl, i) => {
      const lit = (i === 0 && t > 40.5) || (t > 45.9 && rk >= i);
      const lp = back(seg(t, SW[i] + 0.2, SW[i] + 0.55));
      pl.style.background = lit ? C02_COL[i] : "#efe6d6";
      pl.style.opacity = seg(t, 40.7 + i * 0.07, 40.9 + i * 0.07) * (1 - seg(t, 52.5, 52.85));
      pl.style.transform = `translateY(${lit ? -10 * Math.sin(Math.min(1, lp) * Math.PI) : 0}px) scale(${lit && i === cur && t < 52.5 ? 1.08 : 1}) translateY(${-60 * seg(t, 52.5, 52.85)}px)`;
    });
    rows.forEach((r, i) => { const p = back(seg(t, 52.95 + i * 0.05, 53.25 + i * 0.05)); r.style.transform = `scale(${p})`; r.style.transformOrigin = "0 50%"; });
    strike.setAttribute("stroke-dashoffset", 560 * (1 - ease(seg(t, 42.7, 43.1))));
    h1.style.display = t > 43.5 ? "none" : "inline-block";
    h2.textContent = type("당신의 고민, 3일이면 끝 ★", seg(t, 43.5, 44.6));
    // scrolling: rows scroll away, then snap from scene to scene
    const sc = 620 * ease(seg(t, 53.3, 54.3)) + 442 * ease(seg(t, 55.3, 56.1)) + 442 * ease(seg(t, 57.2, 58.0));
    inner.style.transform = `translateY(${-sc}px)`;
    sbar.style.transform = `translateY(${sc / 1950 * 470}px)`;
    scenesF.forEach((b, i) => { b.f.update(t + i * 3, 0.9); b.l.style.transform = `translateY(${Math.max(0, (sc - 620 - i * 442) * -0.3)}px)`; });
    mouse.style.opacity = seg(t, 53.1, 53.4) * (1 - toRef);
    wheel.setAttribute("transform", `translate(0 ${(t * 2 % 1) * 10})`);
    // flip into the reference page
    const fl1 = seg(t, 59.4, 59.9), fl2 = seg(t, 59.9, 60.5);
    wire.style.opacity = fl1 < 1 && t > 52.85 ? 1 : 0;
    wire.style.transform = `scale(${(0.5 + 0.5 * wIn) * (fl1 < 1 ? 1 - fl1 : 1)}, ${0.5 + 0.5 * wIn}) rotate(${-1 + (1 - wIn) * 4}deg)`;
    ref.style.opacity = fl2 > 0 ? 1 : 0;
    const rb = back(fl2);
    ref.style.transform = `scale(${rb}, 1) rotate(${1.5 * c02_settle(t - 60.5, 1.2, 3)}deg)`;
    const H = ref.real ? ref.img.naturalHeight * (800 / ref.img.naturalWidth) : ref.mock.fullH * ref.k;
    const viewH = ref.viewH;
    // scroll lands on each section exactly as the narration names it: hook (60.4) · proof (61.3) · action (62.2)
    // (with a captured layout, ref/roles.json picks the three sections; else the REF_MARKS fractions)
    const fH = ref.sectionFrac("hook", 0), fA = ref.sectionFrac("action", 1);
    const fP = ref.sectionFrac("proof", H > viewH ? clamp((REF_MARKS[1][0] * H - 0.22 * viewH) / (H - viewH)) : 0);
    const f = fH + (fP - fH) * ease(seg(t, 60.95, 61.45)) + (fA - fP) * ease(seg(t, 61.8, 62.35));
    ref.scrollTo(f, t);

    // stats
    legend.style.opacity = seg(t, 53.4, 53.8) * (1 - toRef);
    baseLine.style.opacity = seg(t, 53.2, 53.3) * (1 - toRef);
    baseLine.style.transform = `scaleX(${out(seg(t, 53.2, 53.7))})`;
    const growA = back(seg(t, 53.8, 54.6)), growB = back(seg(t, 55.1, 55.9));
    const gB0 = out(seg(t, 53.8, 54.4));
    bars.forEach((b, i) => {
      const g = i === 0 || i === 2 ? gB0 : i === 1 ? growA : growB;
      const h = b.v * UNIT * g;
      b.style.height = h + "px"; b.style.top = (BASE - h) + "px";
      b.style.opacity = seg(t, 53.6, 53.7) * (1 - toRef);
    });
    nums.forEach((n, i) => {
      const a = i ? 56.2 : 54.6, p = seg(t, a, a + 0.9);
      const top = BASE - (i ? 417 : 162) * UNIT - (i ? 180 : 156);
      n.textContent = "+" + Math.round(n.v * out(p)) + "%";
      n.style.top = top + "px";
      n.style.opacity = (p > 0 ? 1 : 0) * (1 - toRef);
      n.style.transform = `translate(${6 * Math.sin(t * 70) * (1 - seg(t, a + 0.9, a + 1.1)) * (p > 0 ? 1 : 0)}px, 0) scale(${lerp(2.6, 1, back(seg(t, a, a + 0.35))) * (1 + 0.14 * Math.abs(c02_settle(t - a - 0.9, 2.5, 5)))}) rotate(-5deg)`;
    });
    blabels.forEach((l, i) => { l.style.opacity = seg(t, 53.7 + i * 0.2, 54 + i * 0.2) * (1 - toRef); });

    // reference notes + marks
    const off = f * Math.max(0, H - viewH);
    const act = t < 61.25 ? 0 : t < 62.15 ? 1 : 2;
    const dimK = ease(seg(t, 63.1, 63.6));   // coping beat: the page steps back, the hamster steps up
    ref.style.opacity = (fl2 > 0 ? 1 : 0) * (1 - 0.55 * dimK);
    arrow.style.opacity = t > 60.5 ? 1 - dimK : 0;
    marks.forEach((m, i) => {
      const bx = ref.boxOf(REF_ROLES[i]);   // real page: the label sits just above the role's element (below if clipped)
      const y = bx ? c02_markTop(bx) : 150 + 44 + REF_MARKS[i][0] * H - off + 20;
      const vis = t > 60.5 && y > 190 && y < 830 ? 1 : 0;
      const pp = back(seg(t, 60.6 + i * 0.15, 60.9 + i * 0.15));
      m.style.opacity = vis * (pp > 0 ? 1 : 0) * (1 - dimK);
      m.style.top = clamp(y, 190, 830) + "px";
      m.style.transform = `scale(${pp * (i === act ? 1.12 : 1)}) rotate(-3deg)`;
    });
    notes.forEach((n, i) => {
      const p = back(seg(t, 60.4 + i * 0.25, 60.9 + i * 0.25));
      const on = i === act && t > 60.4 && dimK < 1;
      n.style.opacity = seg(t, 60.4 + i * 0.25, 60.5 + i * 0.25) * (1 - 0.55 * dimK);
      const hit = on ? back(seg(t, [60.4, 61.25, 62.15][i], [60.4, 61.25, 62.15][i] + 0.3)) : 0;
      n.style.transform = `translateX(${-80 * (1 - p) + 24 * hit}px) scale(${on ? 0.96 + 0.1 * hit : 0.96}) rotate(${on ? -1.5 : 0}deg)`;
      n.style.filter = on || t < 61 ? "none" : "saturate(.5)";
    });
    {
      const bx = ref.boxOf(REF_ROLES[act]);
      const my = bx ? c02_markTop(bx) + 26 : 150 + 44 + REF_MARKS[act][0] * H - off + 40, ny = 236 + act * 176 + 76;
      const tgtY = clamp(my, 210, 850);
      arP.setAttribute("d", `M740 ${ny} C 830 ${ny}, 850 ${tgtY}, 920 ${tgtY}`);
      arH.setAttribute("d", `M926 ${tgtY} l-18 -11 l0 22 z`);
      arP.setAttribute("stroke-dashoffset", -t * 40);
    }

    // ---------------- customer ----------------
    let cx, cy, cm = false, cwalk = 0, cmood = "happy", cjump = 0, creach = 0, cflip = false;
    if (t < 45.8) {
      const w = seg(t, 42.1, 42.9); cx = lerp(-60, SPOT_X, out(w)); cy = 830; cm = w > 0 && w < 1; cwalk = t * 2.2;
      cmood = t > 42.9 && t < 43.6 ? "big" : "happy";
    } else if (t < 46.4) {
      const w = ease(seg(t, 45.8, 46.4)); cx = lerp(SPOT_X, ST[0][0], w); cy = lerp(830, ST[0][1], w); cm = true; cwalk = t * 2.4; cflip = true;
    } else {
      const u = custU(t), pt = road.at(u), pt2 = road.at(Math.min(u + 0.02, 6.99));
      cx = pt[0]; cy = pt[1]; cm = rk < 5 && t > STOPS[Math.max(0, rk)][1] && (rk + 1 >= STOPS.length || t < STOPS[rk + 1][0]);
      cwalk = road.lenAt(u) / 90; cflip = pt2[0] < pt[0] - 0.01;
      if (rk === 1 && t < 47.7) cmood = "shock";
      if (rk === 2 && t < 48.9) creach = seg(t, 48.4, 48.6);
      if (t > 48.9 && t < 49.6) cjump = 26 * Math.abs(Math.sin(seg(t, 48.9, 49.6) * Math.PI * 3));
      if (rk === 4 && t < 51.2) creach = seg(t, 50.4, 50.6) - seg(t, 50.9, 51.1), cflip = true;
      if (t > 51.9) { cjump = 60 * Math.abs(Math.sin(seg(t, 51.9, 52.9) * Math.PI * 2)); cmood = "big"; }
    }
    const cOp = seg(t, 42.1, 42.2) * (1 - toStats);
    c02_posePerson(cust, t, { x: cx, y: cy, s: t < 46 ? 1 + 0.35 * back(seg(t, 42.9, 43.35)) * (1 - ease(seg(t, 45.6, 46.2))) : 1, walk: cwalk, moving: cm, flip: cflip, jump: cjump, mood: cmood, reach: creach, crown: t < 42.9 ? 0 : back(seg(t, 42.9, 43.3)), op: cOp });
    sayBubble(bubC, t, 47.25, 47.9, "헉, 막혔다!", cx + 10, cy - 240);

    // ---------------- Noa ----------------
    let c02_s = 1, c02_gl = 0;
    let nx, ny, mood = "happy", wave = false, talk = false, look = 0, flip = false, hop = 0, arm = null, sq = 0, nop = 1, rot = 0;
    const NS = 150 * 1.1; // Noa height
    if (t < 45.8) {
      const w = seg(t, 40.6, 41.3);
      if (t < 42.6) { nx = lerp(-200, SPOT_X - 75, out(w)); ny = 830 - NS; wave = t > 41.3 && t < 42.4; hop = w > 0 && w < 1 ? (t * 4) % 1 * 0.3 : 0; look = 0.3;
        sq = t > 41.3 ? 0.1 * c02_settle(t - 41.3, 2.4, 5) : 0; }
      else {
        const b = seg(t, 42.6, 43.0); nx = lerp(SPOT_X - 75, 830, out(b)); ny = 830 - NS - 80 * Math.sin(b * Math.PI); rot = 20 * Math.sin(b * Math.PI);
        mood = t < 43.1 ? "shock" : t < 45.2 ? "pout" : "happy"; look = -1;
        talk = t > 43.3 && t < 44.8;
        if (t > 45.2) { wave = t < 45.7; sq = 0.12 * c02_settle(t - 45.2, 2.4, 5); }
      }
    } else if (t < 53) {
      // hops over to the guide station
      const h = seg(t, 45.9, 46.5), gx = ST[2][0] + 20, gy = ST[2][1] - NS - 6;
      nx = lerp(830, gx, ease(h)); ny = lerp(830 - NS, gy, h) - 120 * Math.sin(h * Math.PI);
      look = -0.6; flip = true;
      if (t > 47.9 && t < 48.8) { arm = -20 + 10 * Math.sin(t * 12); talk = true; }
      if (t > 51.9) { wave = true; hop = (t * 2.5) % 1 * 0.3; }
    } else if (t < 59.6) {
      // walks to the bar-B spot, gets launched by the +317% bar, lands dizzy
      const gx = ST[2][0] + 20, gy = ST[2][1] - NS - 6;
      const m = seg(t, 53.0, 53.8), bx = 630 + 48 - 75;
      const hB = 417 * UNIT * back(seg(t, 55.1, 55.9));
      if (t < 55.1) { nx = lerp(gx, bx, ease(m)); ny = lerp(gy, BASE - NS, m) - 90 * Math.sin(m * Math.PI); look = 0.5; mood = t > 54.6 ? "shock" : "happy"; }
      else if (t < 55.75) { nx = bx; ny = BASE - NS - hB; mood = "shock"; }
      else {
        const fl = seg(t, 55.75, 56.55); const startY = BASE - NS - 417 * UNIT;
        nx = lerp(bx, 820, fl); ny = fl < 1 ? lerp(startY, BASE - NS, fl) - 260 * Math.sin(fl * Math.PI) : BASE - NS; rot = 360 * ease(fl);
        mood = t < 57.8 ? "shock" : "happy"; look = -0.8;
        sq = t > 56.55 ? 0.16 * c02_settle(t - 56.55, 2.6, 5) : 0;
        if (t > 58) { wave = true; talk = t < 59; }
      }
    } else {
      // reference: toots the horn at the reveal, then points at the active note
      const w = seg(t, 59.4, 60.2); nx = lerp(820, 700, ease(w)); ny = 870 - NS; flip = false; look = -1;
      if (t > 60.4 && t < 63.1) { flip = true; arm = -10 + 6 * Math.sin(t * 5); look = 1; }
      if (t >= 63.1) {
        // "demoted from hero to guide… coping": shuffles to centre stage, sulks, then perks up on "Chin up"
        const c = ease(seg(t, 63.1, 63.8)); nx = lerp(700, 800, c); c02_s = lerp(1, 1.75, c);
        hop = c > 0 && c < 1 ? ((t - 63.1) * 3) % 1 * 0.35 : 0;
        if (t < 69.3) { mood = t > 63.7 ? "pout" : "happy"; look = -0.3 + 0.15 * Math.sin(t * 1.3); sq = t > 63.8 ? 0.05 + 0.02 * Math.sin(t * 1.6) : 0;
          if (t > 65.6 && t < 66.1) sq += 0.08 * Math.sin(seg(t, 65.6, 66.1) * Math.PI); }   // big sigh
        else { mood = "happy"; look = 0.4; const hp = seg(t, 69.45, 70.15); hop = hp > 0 && hp < 1 ? hp : 0; wave = t > 70.15; talk = t > 69.6 && t < 70.9;
          sq = 0.12 * c02_settle(t - 70.15, 2.6, 5); c02_gl = seg(t, 70.3, 70.45) * (1 - seg(t, 70.6, 70.8)); }
      }
      nop = 1;
    }
    poseNoa(noa, t, { x: nx, y: ny, s: c02_s, mood, wave, talk, look, flip, hop, op: seg(t, 40.6, 40.7) * nop });
    noa.style.transform += ` rotate(${rot}deg) scale(${1 + sq}, ${1 - sq})`;
    noa.style.transformOrigin = rot ? "50% 60%" : "50% 100%";
    if (arm !== null) noa.P.ar.setAttribute("transform", `rotate(${arm} 154 118)`);
    // sulk cloud
    const cl = seg(t, 43.2, 43.5) * (1 - seg(t, 45.0, 45.3)), cl2 = seg(t, 63.7, 64.1) * (1 - seg(t, 69.3, 69.7));
    cloud.style.opacity = t > 60 ? cl2 : cl;
    cloud.style.transform = t > 60 ? `translate(${nx + 5 + 8 * Math.sin(t * 2)}px, ${870 - NS * c02_s - 120 - 30 * (1 - out(seg(t, 63.7, 64.1))) - 140 * ease(seg(t, 69.3, 69.7))}px)`
      : `translate(${nx + 5 + 6 * Math.sin(t * 2)}px, ${ny - 90 - 20 * seg(t, 45.0, 45.3)}px)`;
    c02_glint.setAttribute("opacity", c02_gl);
    c02_glint.setAttribute("transform", `translate(128 98) scale(${0.3 + 1.1 * c02_gl}) rotate(${(t * 200) % 360})`);
    // coping meter
    const mIn = back(seg(t, 64.0, 64.4)), fixd = seg(t, 69.3, 69.55);
    const pct = t < 69.3 ? 3 + 9 * ease(seg(t, 64.4, 66.6)) - 2 * seg(t, 66.6, 67.4) : lerp(10, 100, out(fixd));
    c02_meter.style.opacity = clamp(mIn * 2) * (1 - seg(t, 71.0, 71.3));
    c02_meter.style.transform = `scale(${(0.6 + 0.4 * mIn) * (1 + 0.1 * c02_settle(t - 69.55, 2.4, 5))}) rotate(${-2 + wobble(t, 69.55, 4, 12, 4)}deg)`;
    c02_mFill.style.width = pct.toFixed(1) + "%";
    c02_mFill.style.background = t > 69.5 ? "repeating-linear-gradient(-45deg,#9fd3a8 0 16px,#7fc08c 16px 32px)" : "repeating-linear-gradient(-45deg,#9fd3f0 0 16px,#7cbfe6 16px 32px)";
    const pcT = Math.round(pct) + "%"; if (c02_mPc.textContent !== pcT) c02_mPc.textContent = pcT;
    const lbT = t > 69.5 ? "회복 완료! 😎" : t > 66.6 && t < 67.6 ? "멘탈 회복 중… (역주행)" : "멘탈 회복 중…";
    if (c02_mLb.textContent !== lbT) c02_mLb.textContent = lbT;
    c02_burst.fire(t, 69.55, 1120, 400, 0.8);
    shakeCam(t, 69.55, 7, 0.35);
    drops.forEach((d, i) => d.setAttribute("transform", `translate(0 ${((t * 1.8 + i * 0.3) % 1) * 40})`));
    // GUIDE badge flies onto Noa and stays with him on the road
    const bIn = seg(t, 44.9, 45.3);
    badge.style.opacity = bIn > 0 && t < 53.2 ? 1 : 0;
    badge.style.transform = `translate(${lerp(1100, nx + 20, out(bIn))}px, ${lerp(200, ny + 136, out(bIn)) - 80 * Math.sin(bIn * Math.PI)}px) rotate(${-8 + 360 * (1 - out(bIn))}deg)`;
    // the map handed to the customer at the guide station
    const mp = seg(t, 48.2, 48.6);
    mapProp.style.opacity = mp > 0 && t < 49.5 ? 1 : 0;
    { const hx = t < 48.6 ? lerp(nx + 10, cx - 10, mp) : cx + 20, hy = t < 48.6 ? lerp(ny + 90, cy - 80, mp) - 50 * Math.sin(mp * Math.PI) : cy - 80 - cjump;
      mapProp.style.transform = `translate(${hx}px, ${hy}px) rotate(${-10 + 20 * Math.sin(t * 5)}deg)`; }
    sayBubble(bub, t, 43.3, 45.1, "주인공은 내가 아니라… 손님이래 😤", 620, 470);
    sayBubble(bubN, t, 47.9, 48.9, "지도 받아!", nx + 110, ny - 70);
    if (t > 64.5 && t < 67.4) sayBubble(bubN, t, 64.6, 67.4, "괜찮아… 길잡이도 멋져… 😢", 990, 560);
    if (t > 69.5) sayBubble(bubN, t, 69.6, 71.6, "명대사는 내 몫! 😎", 990, 560);
    if (t > 57.9 && t < 59.3) sayBubble(bubN, t, 57.9, 59.3, "317%… 어지러워", nx + 120, ny - 70);
    dizzy.style.opacity = t > 56.6 && t < 57.9 ? 1 : 0;
    dizzy.style.transform = `translate(${nx + 30 + 30 * Math.cos(t * 9)}px, ${ny + 10 + 8 * Math.sin(t * 9)}px)`;
    // party horn toot at the reveal
    horn.setAttribute("opacity", t > 60.0 && t < 61.2 ? 1 : 0);
    const blow = Math.max(seg(t, 60.2, 60.4) - seg(t, 60.55, 60.7), seg(t, 60.75, 60.9) - seg(t, 61.0, 61.15));
    tube.setAttribute("width", 90 * blow); curl.setAttribute("opacity", blow < 0.12 ? 1 : 0);
    toot.style.opacity = blow > 0.5 ? 1 : 0;
    toot.style.transform = `translate(${nx + 120}px, ${ny - 40}px) rotate(8deg) scale(${0.9 + 0.2 * blow})`;
  };
});
})();

// ---- Uchu (co-host): cheers the crowned customer (the real hero), later cheers up demoted Noa ----
(() => {
  let u, ub;
  uchuHook((t, s) => {
    if (!u) { u = makeUchu(150); s.root.appendChild(u); ub = makeBubble(s.root); }
    // A · 42.8–46.1: pops in at the far left, fan-cheers the customer with the crown
    const aIn = seg(t, 42.8, 43.2), aOut = seg(t, 45.7, 46.2);
    // B · 67.3–72: slides in beside Noa, "Chin up, Noa!" (lip-syncs the narration), pats his back
    const bIn = seg(t, 67.3, 67.8);
    if (t < 50) {
      const x = lerp(60, 230, out(aIn)) - 300 * ease(aOut), y = 700 - 150 * Math.sin(aOut * Math.PI) + 300 * (1 - out(aIn));
      const cheer = t > 43.2 && t < 45.7;
      poseUchu(u, t, { x, y, mood: t < 43.5 ? "shock" : "happy", hop: cheer ? (t * 1.9) % 1 * .7 : 0, arms: cheer ? "up" : undefined, look: 1, op: aIn > 0 && aOut < 1 ? 1 : 0 });
      sayBubble(ub, t, 43.55, 45.5, "손님 최고! 👑", 200, 520);
    } else {
      const x = lerp(180, 610, out(bIn)), y = 690 - 110 * Math.sin(bIn * Math.PI);
      const pat = t > 69.0 && t < 70.6;
      poseUchu(u, t, { x, y, mood: t < 67.8 ? "shock" : "happy", look: 1, talk: t > 67.7 && t < 68.9, arms: pat ? "point" : undefined, hop: t > 70.8 && t < 71.4 ? seg(t, 70.8, 71.4) : 0, op: bIn > 0 ? 1 : 0 });
      if (pat) u.P.ar.setAttribute("transform", `translate(138 160) rotate(${(-95 + 18 * Math.abs(Math.sin(t * 9))).toFixed(1)})`);
      sayBubble(ub, t, 67.7, 69.5, "힘내, 노아! 🙌", 470, 520);
    }
  });
})();
