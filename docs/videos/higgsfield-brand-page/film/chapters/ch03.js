// ---------------------------------------------------------------- 03 · Character consistency (72–106)
// Local helpers (prefix c03_). Bright paper + ink look; only t drives motion.
const c03_INK = "#2b2320", c03_SH = "7px 8px 0 rgba(43,35,32,.22)";
const c03_hash = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
const c03_hill = (base, amp, k) => {
  let d = `M0 470 L0 ${base}`;
  for (let x = 0; x <= 1600; x += 20) d += ` L${x} ${(base + amp * Math.sin(2 * Math.PI * x * k / 800 + k)).toFixed(1)}`;
  return d + " L1600 470 Z";
};
const c03_PAL = {
  beach:  { s: ["#bfe6f5", "#fdf3d8"], sun: "#ffd65a", h: ["#8fd0e6", "#f6dc9c", "#efc27e"] },
  park:   { s: ["#cdeefa", "#fff6d8"], sun: "#ffe07a", h: ["#bfe3a6", "#94d07c", "#6fba5e"] },
  sunset: { s: ["#ffc9ae", "#fff0c9"], sun: "#fff3a8", h: ["#f6b196", "#ec9180", "#d77a70"] },
  lilac:  { s: ["#e2dbff", "#fff1e2"], sun: "#ffd98a", h: ["#cdbff3", "#ad9ee6", "#8f80d6"] },
};
let c03_uid = 0;
// bright hand-drawn landscape (sky, sun, cloud, three ink-outlined hills)
function c03_scape(p) {
  const id = "c03g" + c03_uid++;
  const e = el("div", "position:absolute;inset:0;overflow:hidden");
  const cloud = `<path d="M0 40 Q-6 14 22 14 Q30 -8 58 2 Q80 -10 96 12 Q122 12 116 40 Z" fill="#fff" stroke="${c03_INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  e.innerHTML = `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style="display:block">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.s[0]}"/><stop offset="1" stop-color="${p.s[1]}"/></linearGradient></defs>
    <rect width="800" height="450" fill="url(#${id})"/>
    <g class="sun"><g class="ry">${Array.from({ length: 10 }, (_, i) => `<path d="M0 -60 L0 -80" transform="rotate(${i * 36})" stroke="${c03_INK}" stroke-width="4" stroke-linecap="round"/>`).join("")}</g>
      <circle r="44" fill="${p.sun}" stroke="${c03_INK}" stroke-width="4"/></g>
    <g class="cl">${cloud}<g transform="translate(330 50) scale(.7)">${cloud}</g></g>
    <path class="h0" d="${c03_hill(250, 16, 2)}" fill="${p.h[0]}" stroke="${c03_INK}" stroke-width="4"/>
    <path class="h1" d="${c03_hill(305, 20, 1)}" fill="${p.h[1]}" stroke="${c03_INK}" stroke-width="4"/>
    <path class="h2" d="${c03_hill(372, 12, 3)}" fill="${p.h[2]}" stroke="${c03_INK}" stroke-width="4"/>
  </svg>`;
  const q = s => e.querySelector(s);
  const P = { sun: q(".sun"), ry: q(".ry"), cl: q(".cl"), h: [q(".h0"), q(".h1"), q(".h2")] };
  e.update = (t, sp = 1, sunX = 620) => {
    const s = t * sp;
    P.sun.setAttribute("transform", `translate(${sunX} ${104 + 8 * Math.sin(s * .8)})`);
    P.ry.setAttribute("transform", `rotate(${s * 18})`);
    P.cl.setAttribute("transform", `translate(${((s * 16) % 1000) - 150} 44)`);
    [8, 18, 34].forEach((v, i) => P.h[i].setAttribute("transform", `translate(${-((s * v) % 800)} 0)`));
  };
  e.update(0);
  return e;
}
function c03_box(parent, x, y, w, h, bg, extra = "") {
  const b = el("div", `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${bg};border:4px solid ${c03_INK};border-radius:18px;box-shadow:${c03_SH};${extra}`, "", parent);
  b.className = "abs"; return b;
}
// film frame with a bright scene inside
function c03_frame(parent, x, y, w, h, pal, label, noaV) {
  const f = c03_box(parent, x, y, w, h, "#fffaf0", "overflow:hidden");
  f.sc = c03_scape(pal); f.appendChild(f.sc);
  if (label) el("div", `position:absolute;left:12px;top:10px;z-index:35;padding:2px 14px;border:3px solid ${c03_INK};border-radius:10px;background:#fffaf0;font-size:24px;color:${c03_INK}`, label, f);
  f.n = makeNoa(170, noaV || {}); f.appendChild(f.n);
  return f;
}
function c03_stamp(parent, x, y, text, color, rot) {
  const s = el("div", `left:${x}px;top:${y}px;z-index:38;padding:4px 18px 6px;border:5px solid ${color};border-radius:12px;color:${color};background:rgba(255,250,240,.88);font-size:34px;letter-spacing:1px;white-space:nowrap`, text, parent);
  s.className = "abs"; s.rot = rot; return s;
}
function c03_slam(s, t, a) {
  const p = seg(t, a, a + .28);
  s.style.opacity = p > 0 ? 1 : 0;
  s.style.transform = `rotate(${s.rot}deg) scale(${2.4 - 1.4 * out(p) + .08 * Math.sin(p * Math.PI)})`;
  return p;
}
const c03_perim = (x, y, w, h, p) => {
  let d = clamp(p) * 2 * (w + h);
  if (d < w) return [x + d, y]; d -= w;
  if (d < h) return [x + w, y + d]; d -= h;
  if (d < w) return [x + w - d, y + h]; d -= w;
  return [x, y + h - d];
};
const c03_PENCIL = `<svg width="150" height="150" viewBox="0 0 150 150" overflow="visible"><g transform="translate(0 150) rotate(-45)">
  <path d="M0 0 L24 -10 L24 10Z" fill="#f6d7a7" stroke="${c03_INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0 0 L8 -3.5 L8 3.5Z" fill="${c03_INK}"/>
  <rect x="24" y="-10" width="92" height="20" fill="#f7d774" stroke="${c03_INK}" stroke-width="3"/><path d="M24 0 H116" stroke="#e0a64f" stroke-width="3"/>
  <rect x="116" y="-10" width="16" height="20" fill="#9fd3f0" stroke="${c03_INK}" stroke-width="3"/><rect x="132" y="-10" width="16" height="20" rx="5" fill="#f2a7a0" stroke="${c03_INK}" stroke-width="3"/></g></svg>`;

scene(72, 106, (R, s) => {
  s.caps = [[72.2, "컷마다 얼굴이 바뀌면, 몰입이 깨집니다", "If the face changes every shot, immersion breaks"],
            [82, "① 캐릭터 시트: 회색 배경 · 얼굴 클로즈업 + 앞 · 뒤 전신", "1. Character sheet on grey: headshot + full body front & back"],
            [86.5, "② Soul ID: 같은 사람 사진 20장+ → 3~5분 학습 → 저장", "2. Soul ID: 20+ photos, ~3–5 min training, saved identity"],
            [91, "③ Reference Element로 Kling · Seedance 영상에 재사용", "3. Reuse it in Kling / Seedance via Reference Element"],
            [95, "④ 의상·헤어 고정 + 네거티브 프롬프트  ⑤ 시드보다 레퍼런스", "4. Lock outfit & hair  5. References beat seeds"],
            [99.5, "배경과 앵글이 달라도, 같은 사람", "Different scenes and angles, same person"]];
  s.cite = [[72, "Higgsfield Soul ID · Kling 3.0 Elements"]];
  chapter(R, "CHAPTER 03", "사람(캐릭터) 일관성 유지");
  R.style.wordBreak = "keep-all";

  // ============ A · gag: three generated shots, three different Noas (72–81.9)
  const gag = el("div", "left:0;top:0;width:1920px;height:1080px;transform-origin:960px 560px", "", R); gag.className = "abs";
  const GAG = [["beach", { body: "#9fd3f0" }], ["park", { glasses: true, scarf: "#6fb3d9", beret: "#3f8f7a" }], ["lilac", { spiky: true, body: "#f7c6d4", scarf: null }]];
  const board = c03_box(gag, 120, 262, 1680, 372, "#e8c48f", "background-image:radial-gradient(rgba(120,70,30,.18) 2px,transparent 2.5px);background-size:22px 22px");
  const wanted = el("div", `left:760px;top:574px;z-index:37;padding:4px 22px 6px;border:4px solid ${c03_INK};border-radius:10px;background:#fffaf0;font-size:30px;color:#c8372d;white-space:nowrap`, "WANTED · 진짜 노아는?", gag); wanted.className = "abs";
  const shots = GAG.map(([pal, v], i) => {
    const f = c03_frame(gag, 150 + i * 560, 300, 500, 290, c03_PAL[pal], `AI 생성 컷 ${i + 1}`, v);
    f.st = c03_stamp(gag, 150 + i * 560 + 200, 430, "✗ 다른 얼굴", "#c8372d", -10 + i * 5);
    el("div", `position:absolute;left:236px;top:6px;width:26px;height:26px;border-radius:50%;background:#c8372d;border:3px solid ${c03_INK};z-index:37;box-shadow:2px 3px 0 rgba(43,35,32,.3)`, "", f);
    el("div", `position:absolute;right:12px;top:10px;z-index:35;padding:0 12px;border:3px solid ${c03_INK};border-radius:8px;background:#fbd9d3;font-size:28px;color:${c03_INK}`, ["털 색 ✗", "안경 ✗", "머리 ✗"][i], f);
    return f;
  });
  const yarn = el("div", "left:0;top:0;z-index:36;pointer-events:none", `<svg width="1920" height="700" overflow="visible"><path class="y" d="M400 318 Q680 400 960 318 Q1240 400 1520 318 M400 318 Q640 500 960 590 M1520 318 Q1280 500 960 590" fill="none" stroke="#c8372d" stroke-width="5" stroke-linecap="round" stroke-dasharray="2000" stroke-dashoffset="2000"/></svg>`, gag); yarn.className = "abs";
  const yarnP = yarn.querySelector(".y");
  const real = makeNoa(200); gag.appendChild(real);
  const qm = [0, 1, 2].map(i => { const q = el("div", `left:${780 - i * 46}px;top:${720 - i * 20}px;font-size:${64 - i * 8}px;color:#c8372d;z-index:31`, "?", gag); q.className = "abs"; return q; });
  const sweat = el("div", "left:1050px;top:650px;z-index:32", `<svg width="30" height="40"><path d="M15 2 Q28 22 24 30 A10 10 0 0 1 6 30 Q2 22 15 2Z" fill="#9fd3f0" stroke="${c03_INK}" stroke-width="3"/></svg>`, gag); sweat.className = "abs";
  const whoB = makeBubble(gag), meB = [0, 1, 2].map(() => makeBubble(gag));

  // ============ step rail (82–99.5)
  const RAIL = [["1", "캐릭터 시트", "얼굴 + 앞 · 뒤 전신", 82, 86.5], ["2", "Soul ID", "사진 20장+ 학습", 86.5, 91],
                ["3", "레퍼런스", "Kling · Seedance 2.0", 91, 95], ["4", "의상·헤어 고정", "+ 네거티브", 95, 96.7], ["5", "시드 < 레퍼런스", "레퍼런스가 이김", 96.7, 99.5]];
  const rail = RAIL.map((r, i) => {
    const n = c03_box(R, 1430, 228 + i * 122, 360, 104, "#fffaf0", "display:flex;align-items:center;gap:14px;padding:0 16px;transform-origin:0 50%");
    n.innerHTML = `<div class="num" style="flex:none;width:52px;height:52px;border-radius:50%;border:4px solid ${c03_INK};background:#fbe3b0;display:grid;place-items:center;font-size:30px">${r[0]}</div>
      <div style="line-height:1.1"><div style="font-size:33px;color:${c03_INK};white-space:nowrap">${r[1]}</div><div style="font-size:24px;color:#6b5d52;margin-top:2px;white-space:nowrap">${r[2]}</div></div>
      <div class="ck" style="position:absolute;right:12px;top:-14px;font-size:44px;color:#2f9e5a;opacity:0">✓</div>`;
    n.num = n.querySelector(".num"); n.ck = n.querySelector(".ck"); return n;
  });

  // ============ B · character sheet, Higgsfield Cinema Studio standard (82–86.6)
  // One reference sheet on a plain GREY background, three panels: headshot (locks the face),
  // full body front + full body back (lock outfit and proportions).
  // Source: higgsfield.ai/academy/courses/santiago-cinematic/character-sheets-in-soul-cinema
  const SX = 130, SY = 228, PH = 360, PY = 62;
  const PX = [26, 466, 846], PWS = [420, 360, 360];
  const sheet = c03_box(R, SX, SY, 1270, 600, "#cfcfcf", `background-image:radial-gradient(ellipse at 22% 30%,rgba(255,255,255,.28),transparent 55%),radial-gradient(ellipse at 78% 70%,rgba(90,90,90,.12),transparent 60%),radial-gradient(rgba(0,0,0,.035) 1.5px,transparent 2px);background-size:auto,auto,18px 18px`);
  el("div", `position:absolute;left:26px;top:12px;font-size:28px;letter-spacing:3px;color:#c8372d`, "캐릭터 시트 · 노아 <span style='font-size:22px;color:#5a5250'>CHARACTER SHEET · 회색 배경</span>", sheet);
  const VIEWS = [["얼굴 클로즈업 · 정면", "HEADSHOT"], ["전신 · 앞", "FULL BODY FRONT"], ["전신 · 뒤", "FULL BODY BACK"]];
  const panels = VIEWS.map((v, i) => {
    const p = el("div", `position:absolute;left:${PX[i]}px;top:${PY}px;width:${PWS[i]}px;height:${PH}px;border-radius:12px;overflow:hidden;background:#d6d6d6`, "", sheet);
    p.n = makeNoa(i === 0 ? 540 : 260, i === 2 ? { back: true } : {}); p.appendChild(p.n);
    p.lb = el("div", `position:absolute;left:50%;bottom:8px;transform:translateX(-50%);padding:2px 14px 4px;border-radius:10px;background:rgba(255,250,240,.9);text-align:center;line-height:1.05;white-space:nowrap;font-size:26px;color:${c03_INK};z-index:40`, `${v[0]}<br><span style="font-size:17px;letter-spacing:2px;color:#6b5d52">${v[1]}</span>`, p);
    return p;
  });
  const HT = PY + 8 + 48 * 1.3, FT = PY + 8 + 204 * 1.3;   // head-top / feet lines of the full-body Noas
  const outl = el("div", "position:absolute;left:0;top:0;width:1270px;height:600px;z-index:41;pointer-events:none", `<svg width="1270" height="600" overflow="visible">
    ${VIEWS.map((_, i) => `<rect class="ol" x="${PX[i]}" y="${PY}" width="${PWS[i]}" height="${PH}" rx="12" fill="none" stroke="${c03_INK}" stroke-width="4" stroke-dasharray="${2 * (PWS[i] + PH)}" stroke-dashoffset="${2 * (PWS[i] + PH)}"/>`).join("")}
    <path class="gd" d="M456 ${HT} H1206" stroke="#c8372d" stroke-width="3" stroke-dasharray="14 10" fill="none"/>
    <path class="gd" d="M456 ${FT} H1206" stroke="#c8372d" stroke-width="3" stroke-dasharray="14 10" fill="none"/></svg>`, sheet);
  const ols = [...outl.querySelectorAll(".ol")], gds = [...outl.querySelectorAll(".gd")];
  const gdL = el("div", `position:absolute;left:1212px;top:${HT - 16}px;height:${FT - HT + 32}px;display:flex;flex-direction:column;justify-content:space-between;font-size:24px;color:#c8372d;z-index:42`, "<div>머리</div><div>발</div>", sheet);
  const pencil = el("div", "position:absolute;left:0;top:0;z-index:45", c03_PENCIL, sheet);
  const outfit = el("div", `position:absolute;left:26px;top:438px;right:26px;display:flex;align-items:center;gap:18px;font-size:30px;color:${c03_INK}`, "", sheet);
  const chips = [["#211c1b", "까만 선글라스"], ["#f2c14e", "노란 스카프"], ["#e9a257", "주황 햄스터 털"]].map(([c, x]) => {
    const d = el("div", `display:flex;align-items:center;gap:10px;padding:10px 18px;border:4px solid ${c03_INK};border-radius:14px;background:#fff;box-shadow:4px 5px 0 rgba(43,35,32,.2)`,
      `<span style="width:30px;height:30px;border-radius:8px;border:3px solid ${c03_INK};background:${c}"></span>${x}`, outfit); return d;
  });
  const eq = el("div", `position:absolute;left:26px;top:522px;padding:8px 20px;border-radius:14px;background:#f7d774;border:4px solid ${c03_INK};font-size:30px;color:${c03_INK};white-space:nowrap;transform-origin:0 50%`, "회색 배경 · 3컷 = 얼굴 + 의상 + 비율 고정", sheet);

  // ============ C · Soul ID photo booth (86.5–91)
  const booth = el("div", "left:150px;top:228px;width:300px;height:560px", `<svg width="300" height="560" viewBox="0 0 300 560" overflow="visible">
    <rect x="16" y="530" width="268" height="24" rx="8" fill="#e0a64f" stroke="${c03_INK}" stroke-width="4"/>
    <rect x="6" y="60" width="288" height="476" rx="18" fill="#9fd3f0" stroke="${c03_INK}" stroke-width="5"/>
    <rect x="34" y="100" width="232" height="250" rx="12" fill="#fffaf0" stroke="${c03_INK}" stroke-width="4"/>
    <circle cx="120" cy="420" r="30" fill="#fffaf0" stroke="${c03_INK}" stroke-width="4"/><circle cx="120" cy="420" r="14" fill="#6fb3d9" stroke="${c03_INK}" stroke-width="3"/><circle cx="114" cy="414" r="4" fill="#fff"/>
    <rect class="bulb" x="190" y="398" width="54" height="40" rx="8" fill="#fff7c2" stroke="${c03_INK}" stroke-width="4"/>
    <rect x="276" y="450" width="26" height="76" rx="6" fill="#fffaf0" stroke="${c03_INK}" stroke-width="4"/>
    <rect x="30" y="4" width="240" height="66" rx="14" fill="#f7d774" stroke="${c03_INK}" stroke-width="5"/>
    <text x="150" y="50" text-anchor="middle" font-size="36" font-family="GaeguLat, GaeguKo" font-weight="700" fill="${c03_INK}">SOUL ID</text>
    <g class="rays" stroke="${c03_INK}" stroke-width="4" stroke-linecap="round">${[-60, -20, 20, 60].map(a => `<path d="M0 -34 L0 -54" transform="translate(217 418) rotate(${a})"/>`).join("")}</g>
  </svg>`, R); booth.className = "abs";
  const bNoa = makeNoa(150); booth.appendChild(bNoa);
  const curtain = el("div", `position:absolute;left:180px;top:104px;width:84px;height:244px;z-index:32;border-left:4px solid ${c03_INK};border-radius:0 10px 10px 0;background:repeating-linear-gradient(90deg,#c8372d 0 14px,#db5443 14px 24px)`, "", booth);
  const flash = el("div", "position:absolute;left:38px;top:104px;width:224px;height:242px;border-radius:10px;background:#fff;z-index:33;opacity:0", "", booth);
  const bRays = booth.querySelector(".rays"), bulb = booth.querySelector(".bulb");
  const POL = Array.from({ length: 20 }, (_, i) => {
    const c = i % 5, r = Math.floor(i / 5);
    const d = el("div", `left:0;top:0;width:118px;height:138px;background:#fff;border:3px solid ${c03_INK};border-radius:6px;box-shadow:4px 5px 0 rgba(43,35,32,.2)`, "", R); d.className = "abs";
    const img = el("div", `position:absolute;left:7px;top:7px;width:98px;height:92px;overflow:hidden;border:2px solid ${c03_INK};background:${["#d8eef7", "#fbe3b0", "#e4f2d6", "#fbd9d3", "#e2dbff"][(i * 3) % 5]}`, "", d);
    d.n = makeNoa(76); img.appendChild(d.n);
    el("div", `position:absolute;left:0;right:0;bottom:4px;text-align:center;font-size:22px;color:${c03_INK}`, `#${i + 1}`, d);
    d.tx = 476 + (i % 3) * 44 + (c03_hash(i, 1) - .5) * 30; d.ty = 236 + Math.floor(i / 3) * 62 + (c03_hash(i, 2) - .5) * 20; d.rot = (c03_hash(i, 3) - .5) * 34;
    d.at = 86.8 + i * .09; d.look = [-1, -.5, 0, .5, 1][i % 5]; d.flip = c03_hash(i, 4) > .6; d.ns = .9 + .25 * c03_hash(i, 5);
    return d;
  });
  const cnt = c03_box(R, 150, 800, 250, 66, "#fffaf0", "display:grid;place-items:center;font-size:32px;color:#2b2320");
  const train = c03_box(R, 420, 800, 340, 66, "#fffaf0", "overflow:hidden");
  const trainFill = el("div", "position:absolute;left:0;top:0;bottom:0;width:0;background:repeating-linear-gradient(-45deg,#f7d774 0 18px,#f2c14e 18px 36px)", "", train);
  const trainTx = el("div", "position:absolute;left:70px;top:11px;font-size:28px;color:#2b2320;white-space:nowrap", "학습 중 · 3~5분", train);
  const clock = el("div", "position:absolute;left:14px;top:5px", `<svg width="54" height="54"><circle cx="27" cy="27" r="22" fill="#fff" stroke="${c03_INK}" stroke-width="4"/><path class="hd" d="M27 27 V11" stroke="${c03_INK}" stroke-width="4" stroke-linecap="round"/><path class="hd2" d="M27 27 H38" stroke="#c8372d" stroke-width="4" stroke-linecap="round"/></svg>`, train);
  const hands = [clock.querySelector(".hd"), clock.querySelector(".hd2")];
  // the Soul ID card (later becomes the Reference Element)
  const card = c03_box(R, 720, 290, 500, 336, "#fff4d0", "transform-origin:0 0;overflow:visible");
  card.innerHTML = `<div style="position:absolute;left:0;right:0;top:0;height:18px;border-radius:14px 14px 0 0;background:linear-gradient(90deg,#f2a7a0,#f7d774,#bfe3a6,#9fd3f0,#cdbff3);border-bottom:3px solid ${c03_INK}"></div>
    <div class="ph" style="position:absolute;left:24px;top:44px;width:170px;height:200px;border:4px solid ${c03_INK};border-radius:12px;background:#fbe3b0;overflow:hidden"></div>
    <div style="position:absolute;left:220px;top:36px;font-size:28px;letter-spacing:3px;color:#c8372d">SOUL ID</div>
    <div style="position:absolute;left:218px;top:66px;font-size:78px;line-height:1;color:${c03_INK}">NOA</div>
    <div style="position:absolute;left:220px;top:160px;font-size:24px;line-height:1.4;color:#6b5d52">사진 20장+ 학습<br>3~5분 → 이름 저장</div>
    <div style="position:absolute;left:24px;top:290px;font-size:22px;color:#c8372d;white-space:nowrap">고정: 선글라스 · 스카프 · 주황 털</div>
    <div class="rt" style="position:absolute;left:150px;top:-34px;padding:4px 18px;border:4px solid ${c03_INK};border-radius:12px;background:#9fd3f0;font-size:28px;color:${c03_INK};white-space:nowrap;opacity:0">Reference Element</div>`;
  const cNoa = makeNoa(150); card.querySelector(".ph").appendChild(cNoa);
  const cardRt = card.querySelector(".rt");
  const saved = c03_stamp(card, 10, 206, "저장 완료 ✓", "#2f9e5a", -8);

  // ============ D · Reference Element → Kling / Seedance (91–95)
  const MACH = [["Kling 3.0", "#9fd3f0", 600, "park"], ["Seedance 2.0", "#f7b6c8", 1030, "sunset"]].map(([nm, col, x, pal], i) => {
    const m = c03_box(R, x, 236, 360, 580, col, "overflow:visible");
    m.innerHTML = `<div style="position:absolute;left:120px;top:-22px;width:120px;height:26px;border:4px solid ${c03_INK};border-radius:8px;background:#fffaf0"></div>
      <div style="position:absolute;left:20px;top:24px;font-size:34px;color:${c03_INK};white-space:nowrap">${nm}</div>
      <div style="position:absolute;left:24px;top:72px;font-size:28px;color:#4b3f3a">영상 생성 모델</div>
      <svg class="gear" style="position:absolute;right:18px;top:26px" width="70" height="70" viewBox="-35 -35 70 70"><g class="g">
        ${Array.from({ length: 8 }, (_, k) => `<rect x="-7" y="-33" width="14" height="14" rx="3" fill="#f7d774" stroke="${c03_INK}" stroke-width="3" transform="rotate(${k * 45})"/>`).join("")}
        <circle r="23" fill="#f7d774" stroke="${c03_INK}" stroke-width="4"/><circle r="8" fill="#fffaf0" stroke="${c03_INK}" stroke-width="3"/></g></svg>
      <div class="scr" style="position:absolute;left:26px;top:120px;width:300px;height:220px;border:4px solid ${c03_INK};border-radius:12px;overflow:hidden;background:#fffaf0"></div>
      <div style="position:absolute;left:26px;top:364px;display:flex;gap:14px">${[0, 1, 2].map(() => `<div class="lt" style="width:30px;height:30px;border-radius:50%;border:4px solid ${c03_INK};background:#fffaf0"></div>`).join("")}</div>
      <div style="position:absolute;right:26px;top:360px;width:120px;height:40px;border:4px solid ${c03_INK};border-radius:20px;background:#fffaf0"></div>
      <div class="ok" style="position:absolute;left:26px;right:26px;top:430px;padding:12px 0;text-align:center;border:4px solid ${c03_INK};border-radius:14px;background:#fffaf0;font-size:30px;color:${c03_INK};opacity:0">✓ 같은 노아 출력</div>`;
    const scr = m.querySelector(".scr");
    m.noise = el("div", "position:absolute;inset:0;z-index:2;background:repeating-linear-gradient(0deg,#efe4cc 0 6px,#fffaf0 6px 12px,#e4d6b8 12px 15px)", "", scr);
    m.sc = c03_scape(c03_PAL[pal]); scr.appendChild(m.sc);
    m.n = makeNoa(130); scr.appendChild(m.n);
    m.gear = m.querySelector(".g"); m.lts = [...m.querySelectorAll(".lt")]; m.ok = m.querySelector(".ok");
    m.chip = c03_box(R, 0, 0, 130, 86, "#fff4d0", "z-index:34;display:flex;align-items:center;gap:6px;padding:0 8px;overflow:hidden");
    m.chip.innerHTML = `<svg width="54" height="56" viewBox="0 0 54 56"><circle cx="12" cy="14" r="9" fill="#e9a257" stroke="${c03_INK}" stroke-width="3"/><circle cx="42" cy="14" r="9" fill="#e9a257" stroke="${c03_INK}" stroke-width="3"/><ellipse cx="27" cy="32" rx="23" ry="21" fill="#e9a257" stroke="${c03_INK}" stroke-width="3"/><path d="M12 26 H24 V32 H12Z M30 26 H42 V32 H30Z" fill="#211c1b" stroke="${c03_INK}" stroke-width="2"/></svg><div style="font-size:26px;color:${c03_INK}">NOA</div>`;
    m.sl = [x + 180, 214]; m.at = 91.7 + i * .35;
    return m;
  });

  // ============ E · ④ lock outfit & hair + negatives, ⑤ reference beats seed (95–99.5)
  const lockP = c03_box(R, 130, 236, 640, 590, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:24px;top:14px;font-size:34px;color:${c03_INK}`, "④ 의상·헤어 고정 <span style='font-size:24px;color:#6b5d52'>+ 네거티브</span>", lockP);
  const shield = el("div", `position:absolute;left:78px;top:118px;width:340px;height:340px;border-radius:50%;border:5px dashed #3e8fb8;background:rgba(159,211,240,.25)`, "", lockP);
  const lNoa = makeNoa(230); lockP.appendChild(lNoa);
  const tagHat = el("div", `position:absolute;left:14px;top:92px;padding:4px 14px;border:3px solid ${c03_INK};border-radius:10px;background:#fbd9d3;font-size:28px;z-index:36`, "선글라스 고정", lockP);
  const tagSc = el("div", `position:absolute;left:14px;top:430px;padding:4px 14px;border:3px solid ${c03_INK};border-radius:10px;background:#fbe3b0;font-size:28px;z-index:36`, "스카프 고정", lockP);
  const lock = el("div", "position:absolute;left:300px;top:320px;z-index:37", `<svg width="110" height="140" viewBox="0 0 110 140" overflow="visible">
    <path class="sh" d="M26 64 V38 A29 29 0 0 1 84 38 V64" fill="none" stroke="${c03_INK}" stroke-width="16" stroke-linecap="round"/>
    <path class="sh2" d="M26 64 V38 A29 29 0 0 1 84 38 V64" fill="none" stroke="#c9c1b4" stroke-width="8" stroke-linecap="round"/>
    <rect x="8" y="60" width="94" height="76" rx="14" fill="#f2c14e" stroke="${c03_INK}" stroke-width="5"/>
    <circle cx="55" cy="92" r="10" fill="${c03_INK}"/><path d="M55 96 V116" stroke="${c03_INK}" stroke-width="8" stroke-linecap="round"/></svg>`, lockP);
  const shk = [lock.querySelector(".sh"), lock.querySelector(".sh2")];
  const click = el("div", `position:absolute;left:400px;top:280px;font-size:40px;color:#c8372d;z-index:38;white-space:nowrap`, "찰칵!", lockP);
  const negs = ["✗ 안경", "✗ 삐죽 머리", "✗ 파란 털"].map((x, i) => {
    const d = el("div", `position:absolute;left:0;top:0;padding:6px 14px;border:4px solid #c8372d;border-radius:12px;background:#fff;color:#c8372d;font-size:28px;white-space:nowrap;z-index:39`, x, lockP);
    d.at = 96.05 + i * .28; d.y0 = 150 + i * 120; return d;
  });
  const negL = el("div", `position:absolute;left:24px;bottom:16px;font-size:30px;color:#3e6f8a`, "네거티브 = 변형 차단 방패", lockP);

  const tugP = c03_box(R, 800, 236, 600, 590, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:24px;top:14px;font-size:34px;color:${c03_INK}`, "⑤ 시드 &lt; 레퍼런스", tugP);
  el("div", `position:absolute;left:0;right:0;top:420px;bottom:0;background:#e4f2d6;border-top:4px solid ${c03_INK}`, "", tugP);
  el("div", `position:absolute;left:283px;top:170px;height:250px;border-left:4px dashed #c8372d`, "", tugP);
  const tug = el("div", "position:absolute;left:0;top:0;width:600px;height:590px", `<svg width="600" height="590" overflow="visible">
    <path d="M180 300 C 240 316, 330 316, 390 300" fill="none" stroke="#b0733a" stroke-width="10" stroke-linecap="round"/>
    <path d="M180 300 C 240 316, 330 316, 390 300" fill="none" stroke="${c03_INK}" stroke-width="3" stroke-dasharray="6 10"/>
    <path d="M285 312 L285 354 L321 342Z" fill="#c8372d" stroke="${c03_INK}" stroke-width="3" stroke-linejoin="round"/></svg>`, tugP);
  const dice = el("div", "position:absolute;left:60px;top:250px;transform-origin:50% 100%", `<svg width="130" height="170" viewBox="0 0 130 170" overflow="visible">
    <rect x="40" y="130" width="14" height="36" rx="4" fill="#fff" stroke="${c03_INK}" stroke-width="4"/><rect x="76" y="130" width="14" height="36" rx="4" fill="#fff" stroke="${c03_INK}" stroke-width="4"/>
    <rect x="10" y="20" width="110" height="112" rx="20" fill="#fff" stroke="${c03_INK}" stroke-width="5"/>
    ${[[38, 48], [92, 48], [65, 76], [38, 104], [92, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c03_INK}"/>`).join("")}
    <path d="M120 70 L150 58" stroke="${c03_INK}" stroke-width="6" stroke-linecap="round"/></svg>`, tugP);
  const diceL = el("div", `position:absolute;left:30px;top:440px;width:230px;text-align:center;font-size:30px;color:${c03_INK};line-height:1.2`, "시드<br><span style='font-size:24px;color:#6b5d52'>약한 신호</span>", tugP);
  const frameC = el("div", `position:absolute;left:376px;top:196px;width:136px;height:170px;border:6px solid ${c03_INK};border-radius:10px;background:#f7d774;transform-origin:50% 100%`, "", tugP);
  const frameIn = el("div", `position:absolute;left:10px;top:10px;right:10px;bottom:10px;border:3px solid ${c03_INK};background:#d8eef7;overflow:hidden`, "", frameC);
  const fNoa = makeNoa(96); frameIn.appendChild(fNoa);
  const frameL = el("div", `position:absolute;left:350px;top:440px;width:240px;text-align:center;font-size:30px;color:${c03_INK};line-height:1.2`, "레퍼런스<br><span style='font-size:24px;color:#6b5d52'>강한 신호</span>", tugP);
  const win = el("div", `position:absolute;left:360px;top:96px;padding:4px 20px;border:4px solid ${c03_INK};border-radius:14px;background:#f7d774;font-size:40px;color:#c8372d;z-index:5`, "승리!", tugP);
  const conf = Array.from({ length: 14 }, (_, i) => el("div", `position:absolute;left:0;top:0;width:14px;height:22px;border:2px solid ${c03_INK};border-radius:3px;background:${["#c8372d", "#f7d774", "#9fd3f0", "#bfe3a6"][i % 4]}`, "", tugP));

  // ============ F · result: the same Noa in three scenes (99.5–106)
  const res = el("div", "left:0;top:0;width:1920px;height:1080px;transform-origin:960px 480px", "", R); res.className = "abs";
  const oks = [["beach", "해변 · 롱숏"], ["park", "공원 · 클로즈업"], ["sunset", "노을 · 측면"]].map(([pal, lb], i) => {
    const f = c03_frame(res, 150 + i * 560, 250, 500, 300, c03_PAL[pal], lb);
    f.st = c03_stamp(res, 150 + i * 560 + 250, 470, "✓ 같은 노아", "#2f9e5a", -8 + i * 6);
    return f;
  });
  const idBadge = c03_box(res, 150, 640, 420, 110, "#fff4d0", "display:flex;align-items:center;gap:16px;padding:0 20px");
  idBadge.innerHTML = `<div style="width:66px;height:66px;border-radius:50%;border:4px solid ${c03_INK};background:#bfe3a6;display:grid;place-items:center;font-size:40px">✓</div>
    <div style="line-height:1.15"><div style="font-size:24px;letter-spacing:2px;color:#c8372d">SOUL ID · NOA</div><div style="font-size:30px;color:${c03_INK}">3개 장면, 1개 얼굴</div></div>`;
  const before = c03_box(res, 1300, 712, 450, 130, "#fffaf0", "overflow:hidden");
  el("div", `position:absolute;left:14px;top:6px;font-size:22px;color:#6b5d52;z-index:40`, "이전 결과", before);
  const bNoas = GAG.map(([, v], i) => { const n = makeNoa(88, v); before.appendChild(n); return n; });
  const bX = el("div", `position:absolute;left:0;top:0;width:450px;height:130px;z-index:41`, `<svg width="450" height="130"><path class="x" d="M110 20 L400 118 M400 20 L110 118" stroke="#c8372d" stroke-width="8" stroke-linecap="round" fill="none" stroke-dasharray="320" stroke-dashoffset="320"/></svg>`, before);
  const bXp = bX.querySelector(".x");
  const endNoa = makeNoa(190); res.appendChild(endNoa);
  const endB = makeBubble(res);
  const c03_burst = makeBurst(res, 26, 3);

  const c03_plate = R.querySelector(".chap"), c03_W = el("div", "position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:960px 470px");
  [...R.children].forEach(c => { if (c !== c03_plate) c03_W.appendChild(c); }); R.appendChild(c03_W);
  return t => {
    const c03_m = getComputedStyle($("scenes")).transform.match(/matrix\(([^,]+)/), c03_k = c03_m ? +c03_m[1] : .82;
    c03_W.style.transform = `scale(${Math.min(1, .85 / c03_k)})`;
    // ---- A: gag
    const gagOut = ease(seg(t, 81.3, 81.95));
    gag.style.display = t < 82 ? "block" : "none";
    gag.style.transform = `scale(${1 + .035 * ease(seg(t, 72.5, 81))})`;
    shots.forEach((f, i) => {
      const p = back(seg(t, 72.4 + i * .35, 73.1 + i * .35));
      f.style.opacity = clamp(p * 3) * (1 - gagOut);
      f.style.transform = `translateY(${-420 * (1 - p) - 640 * gagOut * (1 + i * .2)}px) rotate(${[-3, 1.5, -2][i] * (1 - gagOut) + (i - 1) * 30 * gagOut}deg)`;
      f.sc.update(t + i * 4, .6);
      const nameAt = [77.95, 78.75, 79.5][i], said = seg(t, nameAt, nameAt + .55);
      const hl = back(seg(t, nameAt, nameAt + .3)) * (1 - ease(seg(t, nameAt + .7, nameAt + 1.0)));
      f.style.transform += ` translateY(${-26 * hl}px) scale(${1 + .1 * hl})`;
      f.style.zIndex = hl > .01 ? 5 : 1;
      poseNoa(f.n, t, { x: 165, y: 92, look: [1, 0, -1][i], talk: t > nameAt && t < nameAt + .6, hop: said > 0 && said < 1 ? said : 0, mood: t > 80.4 ? "pout" : "happy" });
      c03_slam(f.st, t, 80.35 + i * .2);
      f.st.style.opacity = +f.st.style.opacity * (1 - gagOut);
      sayBubble(meB[i], t, nameAt, 80.3, ["파란 노아!", "범생이 노아!", "삐죽머리 노아!"][i], 150 + i * 560 + 150, 212);
    });
    [80.35, 80.55, 80.75].forEach(a => shakeCam(t, a, 6, .25));
    const rp = back(seg(t, 74.4, 75.0));
    const jump = seg(t, 75.0, 75.5), recoil = seg(t, 77.6, 78.1);
    poseNoa(real, t, { x: 860, y: 672 + 260 * (1 - rp) + 30 * gagOut, s: .95, mood: t > 75 && t < 81 ? "shock" : "happy", talk: t > 75.3 && t < 76.8,
      hop: jump > 0 && jump < 1 ? jump : recoil > 0 && recoil < 1 ? recoil * .6 : 0, look: Math.sin(t * 2.2) * (t > 75.6 && t < 77.2 ? 1 : 0), op: clamp(rp * 4) * (1 - gagOut) });
    real.style.transform += ` translateX(${-40 * out(recoil) * (1 - gagOut)}px)`;
    qm.forEach((q, i) => {
      const p = back(seg(t, 75.4 + i * .18, 75.8 + i * .18));
      q.style.opacity = clamp(p) * (1 - seg(t, 80.6, 81.1));
      q.style.transform = `translateY(${-30 * p - 50 + 6 * Math.sin(t * 5 + i)}px) rotate(${(i - 1) * 16 + 8 * Math.sin(t * 4 + i)}deg) scale(${p})`;
    });
    const sw = seg(t, 78.2, 79.8);
    sweat.style.opacity = sw > 0 && sw < 1 ? 1 : 0; sweat.style.transform = `translateY(${60 * sw}px)`;
    sayBubble(whoB, t, 75.3, 77.3, "…누구세요?", 1080, 690);

    const bd = back(seg(t, 72.3, 72.8));
    board.style.opacity = clamp(bd * 2) * (1 - gagOut); board.style.transform = `scaleY(${.6 + .4 * bd})`;
    yarnP.setAttribute("stroke-dashoffset", 2000 * (1 - ease(seg(t, 75.5, 76.6))));
    yarn.style.opacity = 1 - gagOut;
    const wtp = back(seg(t, 76.3, 76.7));
    wanted.style.opacity = clamp(wtp * 2) * (1 - gagOut); wanted.style.transform = `scale(${wtp}) rotate(${-3 + 1.5 * Math.sin(t * 3)}deg)`;
    // ---- rail
    const railOut = ease(seg(t, 99.1, 99.6));
    rail.forEach((n, i) => {
      const [, , , a, b] = RAIL[i];
      const pin = back(seg(t, 81.9 + i * .1, 82.5 + i * .1));
      const act = t >= a && t < b, done = t >= b;
      const hl = act ? out(seg(t, a, a + .3)) : 0;
      n.style.opacity = clamp(pin * 2) * (t < a ? .72 : 1);
      const hide = ease(seg(t, 86.3 + i * .04, 86.8 + i * .04)) * (1 - back(seg(t, 89.5 + i * .06, 90.0 + i * .06)));
      n.style.transform = `translateX(${420 * (1 - pin) - 18 * hl + 520 * railOut * (1 + i * .15) + 560 * hide}px) rotate(${(i % 2 ? .8 : -.8) * (1 - hl)}deg) scale(${1 + .06 * hl})`;
      n.style.background = act ? "#f7d774" : "#fffaf0";
      n.num.style.background = act ? "#c8372d" : done ? "#bfe3a6" : "#fbe3b0";
      n.num.style.color = act ? "#fff" : c03_INK;
      const ck = back(seg(t, b, b + .35));
      n.ck.style.opacity = done ? 1 : 0; n.ck.style.transform = `scale(${done ? ck : 0}) rotate(-8deg)`;
    });

    // ---- B: sheet
    const shIn = back(seg(t, 81.9, 82.4)), shOut = ease(seg(t, 86.2, 86.75));
    sheet.style.display = t > 81.8 && t < 86.8 ? "block" : "none";
    sheet.style.opacity = clamp(shIn * 2) * (1 - shOut);
    sheet.style.transform = `translateY(${60 * (1 - shIn) - 80 * shOut}px) scale(${1 - .08 * shOut}) rotate(${-1.2 * shOut}deg)`;
    const DR = [82.3, 82.95, 83.6];
    let pen = null;
    panels.forEach((p, i) => {
      const dp = seg(t, DR[i], DR[i] + .5), W = PWS[i];
      ols[i].setAttribute("stroke-dashoffset", 2 * (W + PH) * (1 - ease(dp)));
      if (dp > 0 && dp < 1) pen = c03_perim(PX[i], PY, W, PH, ease(dp));
      p.style.opacity = seg(t, DR[i] + .15, DR[i] + .45);
      const np = back(seg(t, DR[i] + .35, DR[i] + .75));
      if (i === 0) poseNoa(p.n, t, { x: -60, y: -108 + 60 * (1 - np), s: np, look: 0, blink: false });
      else poseNoa(p.n, t, { x: 50, y: 8 + 40 * (1 - np), s: np, look: 0, arms: "down", blink: false });
      p.lb.style.opacity = seg(t, DR[i] + .5, DR[i] + .8);
    });
    const gp = ease(seg(t, 84.6, 85.2));
    gds.forEach(g => { g.setAttribute("stroke-dasharray", `14 10`); g.style.clipPath = `inset(0 ${100 - 100 * gp}% 0 0)`; });
    gdL.style.opacity = seg(t, 85.0, 85.3);
    if (!pen && t > 84.45 && t < 85.3) pen = [456 + 758 * gp, HT + (FT - HT) * seg(t, 84.9, 85.2)];
    pencil.style.opacity = pen ? 1 : 0;
    if (pen) pencil.style.transform = `translate(${pen[0]}px, ${pen[1] - 150}px) rotate(${4 * Math.sin(t * 30)}deg)`;
    chips.forEach((c, i) => { const p = back(seg(t, 85.2 + i * .18, 85.6 + i * .18)); c.style.opacity = clamp(p * 2); c.style.transform = `translateY(${30 * (1 - p)}px) scale(${.7 + .3 * p})`; });
    const ep = back(seg(t, 85.8, 86.15)); eq.style.opacity = clamp(ep * 2); eq.style.transform = `scale(${.6 + .4 * ep}) rotate(-2deg)`;

    // ---- C: photo booth
    const Cv = t > 86.3 && t < 91.8;
    const bIn = back(seg(t, 86.4, 86.9)), bOut = ease(seg(t, 90.1, 90.6));
    [booth, cnt, train].forEach(e => e.style.display = Cv ? "block" : "none");
    booth.style.opacity = clamp(bIn * 2) * (1 - bOut);
    booth.style.transform = `translateY(${300 * (1 - bIn) + 200 * bOut}px)`;
    const ft = (t - 86.8) / .09, inFl = t > 86.8 && t < 88.6;
    const fl = inFl ? Math.pow(1 - (ft % 1), 2) : 0;
    flash.style.opacity = fl * .9; bRays.style.opacity = fl; bulb.setAttribute("fill", fl > .4 ? "#fff" : "#fff7c2");
    const k = Math.floor(ft);
    poseNoa(bNoa, t, { x: 50, y: 160, s: 1, look: inFl ? [-1, 0, 1, .5, -.5][k % 5] : 0, wave: inFl && k % 3 === 1, mood: inFl && k % 4 === 3 ? "pout" : "happy" });
    booth.style.transform += ` translateX(${inFl ? 2 * Math.sin(t * 60) : 0}px)`;
    const conv = ease(seg(t, 89.6, 90.15));
    let shot = 0;
    POL.forEach((d, i) => {
      if (!Cv) { d.style.display = "none"; return; }
      d.style.display = "block";
      const p = out(seg(t, d.at, d.at + .45)); if (t >= d.at) shot++;
      const x0 = 400, y0 = 668;
      let x = lerp(x0, d.tx, p), y = lerp(y0, d.ty, p) - 140 * Math.sin(Math.PI * p);
      x = lerp(x, 910, conv); y = lerp(y, 370, conv);
      d.style.opacity = (t >= d.at ? 1 : 0) * (1 - seg(conv, .8, 1));
      d.style.transform = `translate(${x}px, ${y}px) rotate(${lerp(-30, d.rot, p) * (1 - conv)}deg) scale(${(.35 + .65 * p) * (1 - .7 * conv)})`;
      poseNoa(d.n, t, { x: 1, y: 8, s: d.ns, look: d.look, flip: d.flip });
    });
    cnt.innerHTML = `사진 <span style="color:#c8372d;font-size:40px">&nbsp;${Math.min(20, shot)}</span>장${shot >= 20 ? "+" : ""}`;
    const cIn = back(seg(t, 86.8, 87.2));
    cnt.style.opacity = clamp(cIn * 2) * (1 - bOut); cnt.style.transform = `scale(${.6 + .4 * cIn}) rotate(-2deg)`;
    const tIn = back(seg(t, 88.4, 88.8)), tp = ease(seg(t, 88.7, 89.7));
    train.style.opacity = clamp(tIn * 2) * (1 - bOut); train.style.transform = `translateY(${40 * (1 - tIn)}px)`;
    trainFill.style.width = 100 * tp + "%";
    trainTx.textContent = tp >= 1 ? "학습 완료!" : "학습 중 · 3~5분";
    hands[0].setAttribute("transform", `rotate(${tp * 1440} 27 27)`); hands[1].setAttribute("transform", `rotate(${tp * 120} 27 27)`);

    // card: pops at 90, then docks left as a Reference Element for D
    const cp = back(seg(t, 89.95, 90.4)), dock = ease(seg(t, 91.0, 91.55)), cOut = ease(seg(t, 94.6, 95.05));
    card.style.display = t > 89.9 && t < 95.1 ? "block" : "none";
    card.style.opacity = clamp(cp * 2) * (1 - cOut);
    const cs = lerp(1, .85, dock) * (.4 + .6 * cp);
    card.style.transform = `translate(${lerp(0, -560, dock) + 250 * (1 - cs / lerp(1, .85, dock)) }px, ${lerp(0, 120, dock) + 150 * (1 - cp)}px) scale(${cs}) rotate(${lerp(-2, 2, dock)}deg)`;
    poseNoa(cNoa, t, { x: 10, y: 34, s: 1, wave: t > 90.4 && t < 91.2 });
    c03_slam(saved, t, 90.45); saved.style.opacity = +saved.style.opacity * (1 - dock);
    const rtp = back(seg(t, 91.3, 91.7)); cardRt.style.opacity = clamp(rtp * 2); cardRt.style.transform = `scale(${rtp})`;

    // ---- D: machines
    MACH.forEach((m, i) => {
      const mIn = back(seg(t, 91.2 + i * .15, 91.7 + i * .15)), mOut = ease(seg(t, 94.55, 95.05));
      const vis = t > 90.8 && t < 95.1;
      m.style.display = vis ? "block" : "none"; m.chip.style.display = vis ? "flex" : "none";
      const arrive = m.at + .6, outAt = arrive + .75;
      const shake = t > arrive && t < outAt ? Math.sin(t * 70) * 4 : 0;
      const squash = seg(t, arrive, arrive + .2), sq = Math.sin(squash * Math.PI) * .05;
      m.style.opacity = clamp(mIn * 2) * (1 - mOut);
      m.style.transform = `translate(${shake}px, ${240 * (1 - mIn) + 300 * mOut * (1 + i * .3)}px) scale(${1 + sq}, ${1 - sq})`;
      m.style.transformOrigin = "50% 100%";
      m.gear.setAttribute("transform", `rotate(${t > arrive ? (t - arrive) * 400 : 0})`);
      m.lts.forEach((l, j) => l.style.background = t > arrive && (Math.floor(t * 8) + j) % 3 === 0 ? ["#c8372d", "#f7d774", "#2f9e5a"][j] : t > outAt ? "#bfe3a6" : "#fffaf0");
      const rev = seg(t, outAt, outAt + .3);
      m.noise.style.opacity = 1 - rev;
      m.noise.style.backgroundPosition = `0 ${Math.floor(t * 30) * 7}px`;
      m.sc.update(t + i * 3, .8);
      poseNoa(m.n, t, i === 0 ? { x: 86, y: 34 + 60 * (1 - out(rev)), s: 1, look: 1, flip: false } : { x: 86, y: 34 + 60 * (1 - out(rev)), s: 1, wave: true, hop: t > outAt + .3 ? ((t * 1.6) % 1) * .6 : 0 });
      const okp = back(seg(t, outAt + .25, outAt + .6)); m.ok.style.opacity = clamp(okp * 2); m.ok.style.transform = `scale(${.6 + .4 * okp})`;
      // flying reference chip: from the docked card into the machine's top slot
      const fp = seg(t, m.at, arrive), fe = ease(fp);
      const sx = 290, sy = 470, [tx, ty] = m.sl;
      const cx = lerp(sx, tx, fe) - 65, cy = lerp(sy, ty, fe) - 110 * Math.sin(Math.PI * fe) - 43 - 30 * seg(t, arrive - .1, arrive);
      m.chip.style.opacity = fp > 0 && t < arrive ? 1 : 0;
      m.chip.style.transform = `translate(${cx}px, ${cy}px) rotate(${360 * fe}deg) scale(${1 - .35 * seg(fp, .8, 1)})`;
    });

    // ---- E: lock + negatives
    const eIn = back(seg(t, 94.9, 95.4)), eOut = ease(seg(t, 99.1, 99.55));
    const Ev = t > 94.8 && t < 99.6;
    lockP.style.display = tugP.style.display = Ev ? "block" : "none";
    lockP.style.opacity = clamp(eIn * 2) * (1 - eOut);
    lockP.style.transform = `translate(${-900 * eOut * eOut}px, ${360 * (1 - eIn)}px) rotate(${-1 - 6 * eOut}deg)`;
    poseNoa(lNoa, t, { x: 133, y: 150, s: 1, look: t > 96 && t < 97 ? 1 : 0, mood: t > 95.8 && t < 96.05 ? "shock" : "happy" });
    [tagHat, tagSc].forEach((g, i) => { const p = back(seg(t, 95.2 + i * .15, 95.55 + i * .15)); g.style.opacity = clamp(p * 2); g.style.transform = `scale(${p}) rotate(-3deg)`; });
    const drop = seg(t, 95.3, 95.75), snap = seg(t, 95.78, 95.9);
    lock.style.opacity = drop > 0 ? 1 : 0;
    lock.style.transform = `translateY(${-420 * (1 - back(drop))}px) rotate(${10 * Math.sin(drop * 9) * (1 - drop)}deg)`;
    shk.forEach(p => p.setAttribute("transform", `translate(0 ${-18 + 18 * out(snap)})`));
    const ck = seg(t, 95.9, 96.5);
    click.style.opacity = ck > 0 && ck < 1 ? 1 - ck * ck : 0; click.style.transform = `scale(${.6 + .6 * out(ck)}) rotate(-8deg)`;
    const shp = back(seg(t, 95.95, 96.3));
    const hitGlow = negs.reduce((a, d) => Math.max(a, 1 - Math.abs(t - (d.at + .3)) / .12), 0);
    shield.style.opacity = clamp(shp * 2); shield.style.transform = `scale(${shp * (1 + .05 * clamp(hitGlow))})`;
    shield.style.borderColor = hitGlow > 0 ? "#c8372d" : "#3e8fb8";
    negs.forEach((d, i) => {
      const f = seg(t, d.at, d.at + .3), bnc = seg(t, d.at + .3, d.at + .9);
      const x = bnc > 0 ? 400 + 260 * out(bnc) : lerp(640, 400, f), y = d.y0 - (bnc > 0 ? 200 * out(bnc) - 260 * bnc * bnc : 0);
      d.style.opacity = t > d.at ? 1 - seg(bnc, .6, 1) : 0;
      d.style.transform = `translate(${x}px, ${y}px) rotate(${bnc * 160 * (i % 2 ? -1 : 1)}deg)`;
      d.style.textDecoration = bnc > 0 ? "line-through" : "none";
    });
    negL.style.opacity = seg(t, 96.3, 96.7);

    // ---- E: tug of war
    const uIn = back(seg(t, 96.5, 97.0));
    tugP.style.opacity = clamp(uIn * 2) * (1 - eOut);
    tugP.style.transform = `translate(${900 * eOut * eOut}px, ${360 * (1 - uIn)}px) rotate(${1 + 6 * eOut}deg)`;
    const yank = back(seg(t, 97.9, 98.5)), wob = t > 97.0 && t < 97.95 ? 16 * Math.sin((t - 97) * 11) : 0;
    const off = wob + 44 * yank;
    tug.style.transform = `translateX(${off}px)`;
    const fall = ease(seg(t, 98.4, 98.9));
    dice.style.transform = `translate(${off - 10 * fall}px, 0px) rotate(${-10 - 12 * Math.abs(Math.sin(t * 6)) * (1 - yank) - 28 * fall}deg)`;
    frameC.style.transform = `translateX(${off}px) rotate(${8 + 4 * Math.sin(t * 6) * (1 - yank)}deg)`;
    poseNoa(fNoa, t, { x: 5, y: 26, s: 1, mood: yank > .3 ? "happy" : "pout", wave: fall > .5 });
    diceL.style.opacity = frameL.style.opacity = seg(t, 96.9, 97.2);
    diceL.style.color = fall > .5 ? "#b0a79a" : c03_INK;
    const wp = back(seg(t, 98.7, 99.0));
    win.style.opacity = clamp(wp * 2); win.style.transform = `scale(${wp}) rotate(${-6 + 3 * Math.sin(t * 8)}deg)`;
    conf.forEach((c, i) => {
      const p = seg(t, 98.7, 99.5), a = c03_hash(i, 7) * Math.PI * 2, v = 120 + 120 * c03_hash(i, 8);
      c.style.opacity = p > 0 && p < 1 ? 1 : 0;
      c.style.transform = `translate(${460 + Math.cos(a) * v * p}px, ${150 + Math.sin(a) * v * p - 60 * p + 300 * p * p}px) rotate(${p * 540 * (i % 2 ? 1 : -1)}deg)`;
    });

    // ---- F: result
    const Fv = t > 99.3;
    res.style.display = Fv ? "block" : "none";
    res.style.transform = `scale(${1.08 + .03 * ease(seg(t, 99.6, 106))})`;
    oks.forEach((f, i) => {
      const p = back(seg(t, 99.35 + i * .3, 100.0 + i * .3));
      f.style.opacity = clamp(p * 2);
      f.style.transform = `translateY(${-360 * (1 - p)}px) rotate(${[-2, 1.5, -1.5][i] * p}deg)`;
      f.sc.update(t + i * 5, .6, [620, 180, 560][i]);
      const c03_fin = seg(t, 103.7 + i * .08, 104.3 + i * .08);
      if (c03_fin > 0 && c03_fin < 1) f.style.transform += ` translateY(${-18 * Math.sin(c03_fin * Math.PI)}px)`;
      if (i === 0) poseNoa(f.n, t, { x: 70, y: 110, s: .62, look: 1, wave: t > 101 });
      else if (i === 1) poseNoa(f.n, t, { x: 150, y: 150, s: 1.6, look: .3, talk: t > 101.5 && t < 104 });
      else {
        poseNoa(f.n, t, { x: 120 + 60 * Math.sin(t * .7), y: 96, s: 1, look: 1, hop: ((t * 2.4) % 1) * .12 });
        f.n.style.transform = f.n.style.transform.replace(/scale\(([^,]+), ([^)]+)\)/, (m, a, b2) => `scale(${(+a * .62).toFixed(3)}, ${b2})`);
      }
      c03_slam(f.st, t, 100.6 + i * .3);
    });
    const ib = back(seg(t, 100.4, 100.9)); idBadge.style.opacity = clamp(ib * 2); idBadge.style.transform = `translateX(${-300 * (1 - ib)}px) rotate(-1.5deg)`;
    const bb = back(seg(t, 101.8, 102.3)); before.style.opacity = clamp(bb * 2); before.style.transform = `translateX(${300 * (1 - bb)}px) rotate(1.5deg)`;
    bNoas.forEach((n, i) => poseNoa(n, t, { x: 100 + i * 108, y: 22, s: 1, mood: t > 102.7 ? "shock" : "happy" }));
    bXp.setAttribute("stroke-dashoffset", 320 * (1 - ease(seg(t, 102.5, 102.9))));
    const en = back(seg(t, 100.8, 101.3));
    poseNoa(endNoa, t, { x: 865, y: 640 + 260 * (1 - en), s: 1.25, wave: t > 101.4, talk: t > 101.5 && t < 103.5, hop: seg(t, 103.6, 104.1) > 0 && t < 104.1 ? seg(t, 103.6, 104.1) : 0, op: clamp(en * 3) });
    sayBubble(endB, t, 101.5, 105.6, "이제 어디서든 나야 ^_^", 1100, 590);
    c03_burst.fire(t, 103.75, 960, 600, 1.3);
  };
});

// ---- Uchu (co-host): can't handle the three "wrong" Noas; later compares himself — still himself ----
(() => {
  let u, ub;
  uchuHook((t, s) => {
    if (!u) { u = makeUchu(150); s.root.appendChild(u); ub = makeBubble(s.root); }
    const inP = seg(t, 77.2, 77.6), outP = ease(seg(t, 81.3, 81.95));
    const x = 1400 + 420 * outP, y = lerp(1060, 700, back(inP)) + 40 * outP;
    let mood = "shock", look = -1, hop = 0, arms;
    if (t > 78.6 && t < 79.55) { mood = "happy"; arms = "point"; look = -.6; }     // "wait, that one's nerdy…"
    const recoil = seg(t, 79.6, 80.1); if (recoil > 0 && recoil < 1) hop = recoil;  // stamps slam → jumps
    poseUchu(u, t, { x, y, mood, look, hop, arms, flip: arms === "point", op: inP > 0 && outP < 1 ? 1 : 0 });
    sayBubble(ub, t, 80.1, 81.3, "셋 다 누구야?!", 1420, 600);
  });
})();
