// ---------------------------------------------------------------- 05 · Expertise + humor (134–160)
// A balance scale: expertise drops onto the left pan, humor onto the right, Noa balances on the
// fulcrum. Then the humor rule slams in like a stamp, and a loading screen shows both at once.
const C05_INK = "#2b2320";
const c05_card = (bg = "#fffaf0", r = 16) => `background:${bg};border:3px solid ${C05_INK};border-radius:${r}px;box-shadow:6px 7px 0 rgba(43,35,32,.22)`;
const c05_abs = (css, html, parent) => el("div", "position:absolute;" + css, html, parent);
// critically-ish damped step response 0 → 1 (with a little overshoot) for tau seconds after an event
const c05_spring = (tau, a = 3, w = 8) => tau <= 0 ? 0 : 1 - Math.exp(-a * tau) * (Math.cos(w * tau) + (a / w) * Math.sin(w * tau));
// decaying wobble kick
function c05_strips(R, cols) {
  const S = cols.map((c, i) => el("div", `position:absolute;left:0;top:-300px;width:${620 - i * 180}px;height:1600px;z-index:60;background:repeating-linear-gradient(90deg,${c} 0 34px,rgba(255,255,255,.18) 34px 40px),${c};border-left:5px solid ${C05_INK};border-right:5px solid ${C05_INK};opacity:0`, "", R));
  return (t, t0, dur) => S.forEach((e, i) => {
    const p = seg(t, t0 + i * .08, t0 + i * .08 + dur), cx = lerp(-700, 2700, ease(p));
    e.style.opacity = p > 0 && p < 1 ? 1 : 0; e.style.transform = `translateX(${cx - (310 - i * 90)}px) rotate(14deg)`;
  });
}
const c05_kick = (tau, a = 2.6, w = 7) => tau <= 0 ? 0 : Math.exp(-a * tau) * Math.sin(w * tau);

scene(134, 160, (R, s) => {
  s.caps = [[134.2, "전문성은 본문, 유머는 양념", "Expertise is the meal, humor is the seasoning"],
            [137, "전문성: 과정을 보여주고, 숫자와 후기로 증명", "Expertise: show the work, prove it with numbers and reviews"],
            [143, "유머: 사람들은 재밌는 브랜드를 기억하고 고른다", "Humor: people remember and choose funny brands"],
            [149, "규칙 — 상황은 비틀되, 고객은 놀리지 않는다", "Rule: poke fun at the situation, never the customer"],
            [153.5, "둘을 한 화면에: 과정 공개 + 유머 로딩", "Both at once: show the process, with a joke"]];
  s.cite = [[137, "Buell & Norton 2011 · Spiegel Research Center"], [143, "Oracle Happiness Report"], [149, "McGraw & Warren 2010, Benign Violations"]];
  const head = chapter(R, "CHAPTER 05", "전문성과 유머 코드");
  const INK = C05_INK; R.style.wordBreak = "keep-all";
  const W = c05_abs("left:0;top:0;width:1920px;height:1000px", "", R);          // shake wrapper
  const SG = c05_abs("left:0;top:0;width:1920px;height:1000px", "", W);         // scale group

  // ---------- scale: post, beam, strings, pans (SVG)
  const PIV = [960, 300], ARM = 500, DROP = 360;
  SG.innerHTML = `<svg width="1920" height="1000" style="position:absolute;left:0;top:0;overflow:visible">
    <g class="post">
      <path d="M850 872 L1070 872 L1036 832 L884 832Z" fill="#c98a4a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="944" y="300" width="32" height="536" rx="9" fill="#e6ac66" stroke="${INK}" stroke-width="4"/>
      <path d="M952 330 V820" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
    </g>
    <g class="strs" stroke="${INK}" stroke-width="3" fill="none">
      <path class="sL"/><path class="sR"/></g>
    <g class="panL"><path d="M-236 0 Q0 96 236 0 Z" fill="#bfe0ef" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-200 10 Q0 70 200 10" stroke="#fff" stroke-opacity=".6" stroke-width="5" fill="none"/></g>
    <g class="panR"><path d="M-236 0 Q0 96 236 0 Z" fill="#f8cdd8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-200 10 Q0 70 200 10" stroke="#fff" stroke-opacity=".6" stroke-width="5" fill="none"/></g>
    <g class="beam">
      <rect x="446" y="289" width="1028" height="22" rx="11" fill="#f2c14e" stroke="${INK}" stroke-width="4"/>
      <path d="M470 296 H1450" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
      <circle cx="460" cy="300" r="11" fill="#c8372d" stroke="${INK}" stroke-width="3"/>
      <circle cx="1460" cy="300" r="11" fill="#c8372d" stroke="${INK}" stroke-width="3"/></g>
    <circle cx="960" cy="300" r="24" fill="#f2c14e" stroke="${INK}" stroke-width="4"/><circle cx="960" cy="300" r="7" fill="${INK}"/>
  </svg>`;
  const q = x => SG.querySelector(x);
  const P = { post: q(".post"), beam: q(".beam"), sL: q(".sL"), sR: q(".sR"), panL: q(".panL"), panR: q(".panR") };

  // pan tags (hang under each pan)
  const mkTag = (col, bg, ko, en, icon) => c05_abs(`width:340px;white-space:nowrap;padding:8px 12px 10px;text-align:center;${c05_card(bg, 14)};z-index:3`,
    `<div style="font-size:34px;line-height:1.05;color:${col}">${icon} ${ko}</div><div style="font-size:22px;color:#6b5d52">${en}</div>`, SG);
  const tagL = mkTag("#2f6f94", "#e3f2f8", "전문성 · 본문", "EXPERTISE = the meal", "🍚");
  const tagR = mkTag("#c0405f", "#fde6ec", "유머 · 양념", "HUMOR = the seasoning", "🧂");

  // ---------- items dropped onto the pans
  const LI = [
    [`<div style="font-size:38px;line-height:1.1">과정 공개</div><div style="display:flex;gap:6px;margin:6px 0 2px">${["기획", "촬영", "편집"].map((x, i) => `<span style="font-size:26px;padding:0 10px;border:2px solid ${INK};border-radius:8px;background:#d8ecd3">${x}</span>`).join('<span style="font-size:26px">→</span>')}</div><div style="font-size:24px;color:#6b5d52">과정이 보이면 가치 ↑</div>`, "#eef7fb"],
    [`<div style="display:flex;align-items:baseline;gap:12px"><span style="font-size:32px">후기 5개</span><span class="k270" style="font-size:60px;line-height:1;color:#2f6f94">+270%</span></div><div style="font-size:26px;color:#6b5d52"><span style="color:#d98c1f">★4.0–4.7</span> &gt; ★5.0</div>`, "#eef7fb"],
    [`<div style="font-size:38px;line-height:1.1">숫자로 증명</div><div style="font-size:24px;color:#6b5d52">기간 · 성과 · 고객 수</div>`, "#eef7fb"],
  ];
  const RI = [[91, "재미있는<br>브랜드가 좋다"], [72, "경쟁사 대신<br>웃긴 브랜드"], [90, "웃긴 광고를<br>기억한다"]];
  const lItems = LI.map(([h, bg]) => c05_abs(`width:440px;white-space:nowrap;padding:10px 16px 12px;${c05_card(bg, 14)};transform-origin:50% 100%;z-index:4`, h, SG));
  const rItems = RI.map(([n, x]) => {
    const e = c05_abs(`width:440px;white-space:nowrap;padding:8px 18px 10px;${c05_card("#fff", 30)};display:flex;align-items:center;gap:16px;transform-origin:50% 100%;z-index:4`,
      `<span class="num" style="font-size:76px;line-height:1;color:#c0405f;display:inline-block;width:150px;transform-origin:50% 70%">${n}%</span><span style="font-size:30px;line-height:1.1">${x}</span>
       <svg width="34" height="22" style="position:absolute;left:36px;bottom:-21px;overflow:visible"><path d="M0 0 L8 20 L28 0" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M2 -2 H26" stroke="#fff" stroke-width="5"/></svg>`, SG);
    return e;
  });
  const LAND_L = [138.3, 139.8, 141.3], LAND_R = [143.8, 145.3, 146.8];
    // impact text: "쿵!" for expertise, laughs for humor
  const bursts = [...LAND_L.map((tt, i) => [tt, "쿵!", "#2f6f94", -1, i]), ...LAND_R.map((tt, i) => [tt, ["ㅋㅋㅋ", "HA!", "ㅎㅎ"][i], "#c0405f", 1, i])]
    .map(b => { const e = c05_abs(`font-size:52px;color:${b[2]};z-index:6;-webkit-text-stroke:1px ${INK}`, b[1], SG); return [e, ...b]; });
  const balance = c05_abs(`left:720px;top:560px;width:480px;white-space:nowrap;text-align:center;padding:8px 0 10px;${c05_card("#fbe3b0", 14)};z-index:5`,
    `<div style="font-size:36px">⚖ 본문 + 양념 = 균형!</div>`, SG);

  // ---------- cooking-show cold open (134.2–137): chef Noa slams the bowl, sprinkles the shaker
  const CK = c05_abs("left:0;top:0;width:1920px;height:1000px;z-index:9", `
    <div class="sign" style="position:absolute;left:560px;top:170px;width:800px;text-align:center;padding:10px 0 14px;${c05_card("#fbe3b0", 18)};white-space:nowrap">
      <div style="font-size:26px;letter-spacing:5px;color:#c8372d">NOA'S COOKING SHOW</div><div style="font-size:52px;line-height:1.1">노아의 브랜드 쿠킹쇼 🍳</div></div>
    <svg width="1920" height="1000" style="position:absolute;left:0;top:0;overflow:visible">
      <g class="ctr"><rect x="420" y="720" width="1080" height="46" rx="10" fill="#d9a06a" stroke="${INK}" stroke-width="5"/>
        <rect x="450" y="766" width="1020" height="110" fill="#e9b97c" stroke="${INK}" stroke-width="5"/>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${480 + i * 200}" y="790" width="160" height="66" rx="8" fill="none" stroke="${INK}" stroke-width="3" opacity=".45"/>`).join("")}</g>
      <g class="bowl"><path d="M-190 -120 H190 Q190 0 0 0 Q-190 0 -190 -120Z" fill="#fffaf0" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <ellipse cx="0" cy="-120" rx="190" ry="26" fill="#f4c98a" stroke="${INK}" stroke-width="6"/>
        <g class="stm" stroke="#9a8f80" stroke-width="5" fill="none" stroke-linecap="round"><path d="M-60 -160 q-14 -22 0 -44 q14 -22 0 -44"/><path d="M0 -168 q-14 -22 0 -44 q14 -22 0 -44"/><path d="M60 -160 q-14 -22 0 -44 q14 -22 0 -44"/></g></g>
      <g class="shk"><rect x="-44" y="-150" width="88" height="130" rx="18" fill="#f8cdd8" stroke="${INK}" stroke-width="5"/>
        <path d="M-40 -150 Q0 -196 40 -150Z" fill="#c9c2d6" stroke="${INK}" stroke-width="5"/>${[-18, 0, 18].map(x => `<circle cx="${x}" cy="-168" r="4" fill="${INK}"/>`).join("")}</g>
    </svg>
    <div class="bl" style="position:absolute;left:0;top:0;padding:4px 18px 8px;${c05_card("#e3f2f8", 14)};font-size:44px;color:#2f6f94;white-space:nowrap">전문성 = 본문</div>
    <div class="sl" style="position:absolute;left:0;top:0;padding:4px 18px 8px;${c05_card("#fde6ec", 14)};font-size:44px;color:#c0405f;white-space:nowrap">유머 = 양념</div>
    <div class="bang" style="position:absolute;left:0;top:0;font-size:64px;color:#c8372d;-webkit-text-stroke:2px ${INK}">쾅!</div>`, R);
  const cq = x => CK.querySelector(x);
  const ckSign = cq(".sign"), ckCtr = cq(".ctr"), ckBowl = cq(".bowl"), ckShk = cq(".shk"), ckBL = cq(".bl"), ckSL = cq(".sl"), ckBang = cq(".bang"), ckStm = cq(".stm");
  const salt = Array.from({ length: 22 }, (_, i) => c05_abs(`left:0;top:0;width:${10 + (i % 3) * 4}px;height:${10 + (i % 3) * 4}px;border-radius:50%;border:2px solid ${INK};background:${["#fff", "#f7d774", "#f08aa0"][i % 3]};z-index:10;opacity:0`, "", R));
  const chef = makeNoa(230); R.appendChild(chef);
  if (chef.P.hat) chef.P.hat.innerHTML = `<g stroke="${INK}" stroke-width="4" stroke-linejoin="round"><rect x="70" y="40" width="60" height="22" rx="4" fill="#fff"/>
    <path d="M70 44 Q52 30 62 14 Q70 0 86 8 Q94 -8 110 2 Q128 -6 136 12 Q150 28 130 44Z" fill="#fff"/></g>`;

  // ---------- Noa balancing on the fulcrum
  const nw = c05_abs("left:960px;top:300px;width:0;height:0;z-index:7", "", SG);
  const noa = makeNoa(130); nw.appendChild(noa);

  // ---------- rule stamp
  const rule = c05_abs(`left:380px;top:230px;width:1100px;padding:28px 44px 30px;${c05_card("#fffaf0", 22)};z-index:10;text-align:center`, `
    <div style="font-size:26px;letter-spacing:5px;color:#c8372d">HUMOR RULE · 유머의 규칙</div>
    <div style="font-size:66px;line-height:1.12;margin-top:6px">상황은 비틀고,<br>고객은 놀리지 않는다</div>
    <div style="font-size:30px;color:#6b5d52;margin-top:6px">Joke about the situation — never the customer</div>
    <div style="display:flex;gap:24px;margin-top:22px;text-align:left">
      <div class="ok" style="flex:1;padding:12px 18px;${c05_card("#dff0d6", 14)}"><div style="font-size:30px;color:#2f7a3a">✓ 상황을 비틀기</div><div style="font-size:26px">“렌더링 중… 노아는 커피 2잔째”</div></div>
      <div class="no" style="flex:1;padding:12px 18px;${c05_card("#fbe0dc", 14)}"><div style="font-size:30px;color:#c8372d">✗ 고객을 놀리기</div><div style="font-size:26px;text-decoration:line-through;text-decoration-thickness:3px">“이것도 모르세요?”</div></div>
    </div>
    <div class="bv" style="font-size:26px;color:#6b5d52;margin-top:16px">웃음 = 살짝 어긋났지만, 안전할 때 (양성 위반 · benign violation)</div>`, W);
  const rOk = rule.querySelector(".ok"), rNo = rule.querySelector(".no"), rBv = rule.querySelector(".bv");
  const stamp = c05_abs(`left:1330px;top:180px;width:200px;height:200px;border-radius:50%;border:7px double #c8372d;color:#c8372d;background:rgba(255,250,240,.85);
    display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:12;text-align:center;line-height:1.05`,
    `<div style="font-size:52px">SAFE</div><div style="font-size:28px">양성 위반</div><div style="font-size:22px">benign ✓</div>`, W);
  const ruleNoa = makeNoa(150); W.appendChild(ruleNoa);

  // ---------- loading screen example
  const ld = c05_abs(`left:160px;top:220px;width:980px;height:610px;${c05_card("#fffaf0", 20)};overflow:hidden;z-index:8`, `
    <div style="height:50px;background:#f6d9a0;border-bottom:3px solid ${INK};display:flex;align-items:center;gap:9px;padding:0 18px">
      <span style="width:14px;height:14px;border-radius:50%;background:#ff5f57;border:2px solid ${INK}"></span><span style="width:14px;height:14px;border-radius:50%;background:#febc2e;border:2px solid ${INK}"></span><span style="width:14px;height:14px;border-radius:50%;background:#28c840;border:2px solid ${INK}"></span>
      <span style="margin-left:14px;font-size:22px;color:#6b5d52">예시 · 로딩 화면 · LOADING SCREEN</span></div>
    <div style="padding:22px 40px">
      <div class="lt" style="font-size:46px;line-height:1.15;height:54px"></div>
      <div class="lc" style="font-size:32px;color:#c0405f;margin-top:4px;height:40px"></div>
      <div style="display:flex;align-items:center;gap:16px;margin-top:18px">
        <div style="flex:1;height:38px;border:3px solid ${INK};border-radius:19px;background:#f1e4cc;overflow:hidden"><div class="lb" style="height:100%;width:0;border-right:3px solid ${INK};background:repeating-linear-gradient(45deg,#d4623a 0 18px,#ec8a5c 18px 36px)"></div></div>
        <div class="lp" style="font-size:40px;width:90px;text-align:right">0%</div></div>
      <div class="ls" style="margin-top:18px"></div>
    </div>`, R);
  const STEPS = [["대본 확정", "Claude", 154.7], ["스틸 4장 생성", "Higgsfield", 155.7], ["5초 영상 렌더링", "Higgsfield", 159.4], ["페이지에 배치", "", 999]];
  const stepRows = STEPS.map(x => c05_abs("position:relative;display:flex;align-items:center;gap:16px;height:52px;font-size:32px",
    `<svg width="36" height="36" viewBox="0 0 36 36" style="flex:none"><circle cx="18" cy="18" r="15" fill="#fff" stroke="${INK}" stroke-width="3"/>
       <path class="ck" d="M9 18 L16 25 L28 11" stroke="#2f7a3a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
       <path class="sp" d="M18 5 A13 13 0 0 1 31 18" stroke="#d4623a" stroke-width="5" fill="none" stroke-linecap="round"/></svg>
     <span class="nm">${x[0]}</span><span style="font-size:24px;color:#6b5d52">${x[1] ? "· " + x[1] : ""}</span>`, ld.querySelector(".ls")));
  const lt = ld.querySelector(".lt"), lc = ld.querySelector(".lc"), lb = ld.querySelector(".lb"), lp = ld.querySelector(".lp");
  // desk + Noa + coffee
  const deskNoa = makeNoa(240); R.appendChild(deskNoa);
  const desk = c05_abs("left:1170px;top:568px;width:620px;height:330px;z-index:31", `<svg width="620" height="330" overflow="visible">
    <rect x="60" y="250" width="22" height="80" fill="#b77a45" stroke="${INK}" stroke-width="4"/><rect x="538" y="250" width="22" height="80" fill="#b77a45" stroke="${INK}" stroke-width="4"/>
    <rect x="20" y="222" width="580" height="34" rx="8" fill="#d9a06a" stroke="${INK}" stroke-width="4"/>
    <path d="M40 232 H580" stroke="#fff" stroke-opacity=".4" stroke-width="4"/>
    <g class="cups"></g></svg>`, R);
  const cupSvg = (fill = "#fffaf0") => `<path d="M-22 -40 L22 -40 L18 0 L-18 0 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M20 -32 q16 2 12 14 q-3 8 -14 6" fill="none" stroke="${INK}" stroke-width="4"/><path d="M-18 -26 H18" stroke="#8a5a2b" stroke-width="5"/>`;
  const cupsG = desk.querySelector(".cups");
  cupsG.innerHTML = [0, 1, 2].map(i => `<g class="c${i}">${cupSvg("#f4efe6")}</g>`).join("");
  const cups = [0, 1, 2].map(i => cupsG.querySelector(".c" + i));
  const mug = c05_abs("left:0;top:0;width:0;height:0;z-index:32", `<svg width="80" height="120" style="position:absolute;left:-40px;top:-100px;overflow:visible">
    <g transform="translate(40 100)"><g class="steam" stroke="#9a8f80" stroke-width="4" fill="none" stroke-linecap="round">
      <path class="st0" d="M-10 -52 q-8 -12 0 -24 q8 -12 0 -24"/><path class="st1" d="M8 -52 q-8 -12 0 -24 q8 -12 0 -24"/></g>
      ${cupSvg("#c8372d")}<text x="0" y="-12" text-anchor="middle" font-size="16" fill="#fff" font-family="GaeguLat">NOA</text></g></svg>`, R);
  const steams = [mug.querySelector(".st0"), mug.querySelector(".st1")];
  const cnt = c05_abs(`left:1560px;top:430px;padding:6px 18px 8px;${c05_card("#fff3c4", 30)};font-size:44px;z-index:33;transform-origin:50% 50%`, "", R);
  const noteA = c05_abs(`left:720px;top:720px;padding:8px 18px 10px;${c05_card("#e3f2f8", 12)};font-size:32px;color:#2f6f94;z-index:34`, "← 과정 공개 = 전문성", R);
  const noteB = c05_abs(`left:1160px;top:640px;padding:8px 18px 10px;${c05_card("#fde6ec", 12)};font-size:32px;color:#c0405f;z-index:34`, "커피 = 유머 ↓", R);

  const wipe = c05_strips(R, ["#f08aa0", "#f7d774"]);
  const cookU = t => {
    const out1 = ease(seg(t, 136.3, 136.8));
    CK.style.opacity = t < 134.2 ? 0 : 1 - out1; CK.style.display = t > 136.9 ? "none" : "";
    const sp = back(seg(t, 134.25, 134.65)); ckSign.style.transform = `translateY(${-160 * (1 - sp)}px) rotate(${-2 + 1.5 * c05_kick(t - 134.65, 3, 9)}deg)`;
    ckCtr.setAttribute("transform", `translate(0 ${260 * (1 - out(seg(t, 134.2, 134.6)))})`);
    // bowl slams down at 134.95
    const bp = seg(t, 134.6, 134.95), bt = t - 134.95, bsq = bt > 0 ? .18 * Math.exp(-8 * bt) * Math.cos(22 * bt) : 0;
    const fly = ease(seg(t, 136.3, 136.8));
    ckBowl.setAttribute("transform", `translate(${700 - 260 * fly} ${720 - 700 * (1 - bp * bp) + 60 * fly}) scale(${1 + bsq} ${1 - bsq})`);
    ckStm.setAttribute("opacity", bt > 0 ? .5 + .4 * Math.sin(t * 6) : 0);
    ckBang.style.opacity = bt > 0 && bt < .5 ? 1 - bt * 2 : 0; ckBang.style.transform = `translate(${480}px, ${520 - 40 * bt}px) scale(${.8 + bt}) rotate(-10deg)`;
    const blp = back(seg(t, 135.0, 135.35)); ckBL.style.opacity = clamp(blp * 2); ckBL.style.transform = `translate(${560 - 260 * fly}px, ${735 + 60 * fly}px) scale(${blp}) rotate(-3deg)`;
    // shaker: appears in Noa's paw, shakes over the bowl (135.4–136.2)
    const sIn = back(seg(t, 135.3, 135.6)), shake = t > 135.6 && t < 136.25 ? Math.sin((t - 135.6) * 38) : 0;
    ckShk.setAttribute("transform", `translate(${lerp(1180, 820, ease(seg(t, 135.4, 135.65))) + 320 * fly} ${lerp(640, 470, ease(seg(t, 135.4, 135.65))) + 20 * shake}) rotate(${t > 135.6 ? 150 + 18 * shake : 20 * (1 - sIn)}) scale(${sIn})`);
    salt.forEach((e, i) => { const t0 = 135.62 + (i % 11) * .055, tau = t - t0, x0 = 820 + (c05_kick(i + 1, .1, 7.3)) * 50;
      e.style.opacity = tau > 0 && tau < .55 ? 1 : 0; e.style.transform = `translate(${x0 + (i % 5 - 2) * 12}px, ${540 + 380 * tau + 260 * tau * tau}px)`; });
    const slp = back(seg(t, 135.75, 136.1)); ckSL.style.opacity = clamp(slp * 2);
    ckSL.style.transform = `translate(${980 + 320 * fly}px, ${380 + 60 * fly}px) scale(${slp * (1 + .25 * c05_kick(t - 136.1, 5, 14))}) rotate(4deg)`;
    const cOp = seg(t, 134.3, 134.6) * (1 - out1);
    poseNoa(chef, t, { x: 1080, y: 500 + 40 * (1 - cOp), s: 1, talk: t > 134.6 && t < 135.3, look: -1, mood: "happy", hop: t > 136.05 && t < 136.5 ? (t - 136.05) / .45 : 0,
      arms: t > 135.4 && t < 136.2 ? "up" : undefined, op: cOp });
  };
  return t => {
    cookU(t);
    head.style.opacity = 1 - seg(t, 153.2, 153.6);
    wipe(t, 153.05, .8);
    // ================= scale (134.2–149.3)
    const exit = ease(seg(t, 148.9, 149.4));
    SG.style.opacity = seg(t, 136.4, 136.6) * (1 - exit);
    SG.style.transform = `translateY(${80 * exit}px) scale(${1 - 0.08 * exit})`; SG.style.transformOrigin = "960px 600px";
    // post rises, beam drops in
    const pr = out(seg(t, 136.4, 137.0));
    P.post.setAttribute("transform", `translate(0 872) scale(1 ${Math.max(.001, pr)}) translate(0 -872)`);
    const bd = seg(t, 136.75, 137.25), beamY = -520 * (1 - bd * bd);
    // beam angle: sum of damped steps (left items tip left, right items tip right) + landing wobble
    let th = 7 * c05_kick(t - 137.25);
    LAND_L.forEach(tt => th -= 3 * c05_spring(t - tt));
    LAND_R.forEach(tt => th += 3 * c05_spring(t - tt));
    const rad = th * Math.PI / 180, cs = Math.cos(rad), sn = Math.sin(rad);
    P.beam.setAttribute("transform", `translate(0 ${beamY}) rotate(${th} 960 300)`);
    const ends = [[PIV[0] - ARM * cs, PIV[1] - ARM * sn + beamY], [PIV[0] + ARM * cs, PIV[1] + ARM * sn + beamY]];
    // pans sway on each landing (pendulum)
    const sway = side => { let f = 5 * c05_kick(t - 137.25, 1.8, 5);
      (side ? LAND_R : LAND_L).forEach(tt => f += 3 * c05_kick(t - tt, 2.2, 6)); return f * Math.PI / 180; };
    const pans = ends.map(([ex, ey], k) => { const f = sway(k); return [ex + DROP * Math.sin(f), ey + DROP * Math.cos(f)]; });
    [P.sL, P.sR].forEach((sp, k) => { const [ex, ey] = ends[k], [px, py] = pans[k];
      sp.setAttribute("d", `M${px - 226} ${py} L${ex} ${ey} L${px + 226} ${py} M${ex} ${ey} L${px} ${py - 4}`); });
    P.panL.setAttribute("transform", `translate(${pans[0][0]} ${pans[0][1]})`);
    P.panR.setAttribute("transform", `translate(${pans[1][0]} ${pans[1][1]})`);
    [tagL, tagR].forEach((g, k) => { const [px, py] = pans[k], p = back(seg(t, 137.1 + k * .15, 137.5 + k * .15));
      g.style.left = (px - 170) + "px"; g.style.top = (py + 56) + "px"; g.style.opacity = clamp(p * 2);
      g.style.transform = `scale(${0.6 + 0.4 * p}) rotate(${(k ? 2 : -2) + 3 * Math.sin(t * 1.6 + k)}deg)`; });
    // items: fall, land with squash, then ride the pan
    const hsL = lItems.map(e => e.offsetHeight), hsR = rItems.map(e => e.offsetHeight);
    const stackItem = (e, i, land, hs, k) => {
      const [px, py] = pans[k]; let below = 0; for (let j = 0; j < i; j++) below += hs[j] + 6;
      const p = seg(t, land - .45, land), fall = -620 * (1 - p * p), tau = t - land;
      const sq = tau > 0 ? 0.14 * Math.exp(-7 * tau) * Math.cos(20 * tau) : 0;
      e.style.left = (px - 220) + "px"; e.style.top = (py + 8 - below - hs[i] + fall) + "px";
      e.style.opacity = t > land - .45 ? 1 : 0;
      e.style.transform = `scale(${1 + sq * .6}, ${1 - sq}) rotate(${(k ? 1 : -1) * (i % 2 ? 1.2 : -1) + (tau < 0 ? 6 * (1 - p) : 0)}deg)`;
    };
    lItems.forEach((e, i) => stackItem(e, i, LAND_L[i], hsL, 0));
    rItems.forEach((e, i) => { stackItem(e, i, LAND_R[i], hsR, 1);
      const nm = e.querySelector(".num"), tau = t - LAND_R[i];     // numbers count up and punch in
      nm.textContent = Math.round(RI[i][0] * out(seg(tau, 0, .55))) + "%";
      nm.style.transform = `scale(${1 + .35 * c05_kick(tau - .55, 5, 14) + (tau > 0 && tau < .55 ? .15 : 0)}) rotate(${-6 * c05_kick(tau - .55, 5, 14)}deg)`; });
    const k270 = lItems[1].querySelector(".k270"); k270.style.display = "inline-block";
    k270.style.transform = `scale(${1 + .3 * c05_kick(t - LAND_L[1] - .1, 5, 14)})`;
    bursts.forEach(([e, tt, , , side, i]) => {
      const tau = t - tt, [px, py] = pans[side > 0 ? 1 : 0], hs = side > 0 ? hsR : hsL;
      let h = 0; for (let j = 0; j <= i; j++) h += hs[j] + 6;
      const p = seg(tau, 0, .9);
      e.style.opacity = tau > 0 ? Math.sin(p * Math.PI) : 0;
      e.style.left = (px + side * (190 + 40 * p) - 40) + "px"; e.style.top = (py - h - 20 - 70 * out(p)) + "px";
      e.style.transform = `scale(${0.6 + 0.6 * back(clamp(p * 2.5))}) rotate(${side * 10}deg)`;
    });
    const bp = back(seg(t, 147.3, 147.8));
    balance.style.opacity = clamp(bp * 2) * (1 - seg(t, 148.6, 148.9)); balance.style.transform = `translateY(${-20 * (1 - bp)}px) scale(${0.7 + 0.3 * bp}) rotate(-1.5deg)`;
    // Noa: drops onto the pivot, then balances with arms out
    const nd = seg(t, 137.3, 137.7), nY = -560 * (1 - nd * nd), nt = t - 137.7;
    const nsq = nt > 0 ? 0.2 * Math.exp(-6 * nt) * Math.cos(16 * nt) : 0;
    const tilted = Math.abs(th) > 5.6;
    nw.style.transform = `translate(0px, ${beamY}px) rotate(${th * .8}deg)`;
    nw.style.opacity = t > 137.3 ? 1 : 0;
    poseNoa(noa, t, { x: -65, y: -140 + nY, s: 1, mood: tilted ? "shock" : "happy", talk: t > 137.8 && t < 138.2, look: -th / 8, hop: t > 147 && t < 148.4 ? (t - 147) / .7 % 1 : 0 });
    noa.P.b.setAttribute("transform", `translate(100 200) scale(${1 + nsq} ${1 - nsq}) rotate(${-th * .6} 0 0) translate(-100 -200)`);
    if (!tilted) {
      const cheer = t > 147 && t < 148.6, flap = 16 * Math.sin(t * 5.2) * (0.4 + Math.min(1, Math.abs(th) / 6));
      noa.P.al.setAttribute("transform", `rotate(${(cheer ? 55 : 0) + flap - th * 2} 56 160)`);
      noa.P.ar.setAttribute("transform", `rotate(${(cheer ? -55 : 0) + flap - th * 2} 144 160)`);
    }
    // ================= rule stamp (149–153.5)
    const sl = seg(t, 149.0, 149.32), impact = t - 149.32;
    const ro = t < 149 ? 0 : clamp(sl * 5) * (1 - seg(t, 153.1, 153.5));
    rule.style.opacity = ro;
    const ringR = impact > 0 ? 0.05 * Math.exp(-7 * impact) * Math.cos(22 * impact) : 0;
    rule.style.transform = `translateY(${-160 * seg(t, 153.1, 153.5)}px) scale(${(impact < 0 ? 2.3 - 1.3 * sl * sl : 1) * (1 + ringR)}) rotate(-2deg)`;
    const shake = impact > 0 ? Math.exp(-6 * impact) * Math.sin(48 * impact) : 0;
    const st2 = t - 151.95, shake2 = st2 > 0 ? .6 * Math.exp(-7 * st2) * Math.sin(50 * st2) : 0;
    W.style.transform = `translate(${14 * (shake + shake2)}px, ${9 * Math.abs(shake + shake2)}px)`;
    pop(rOk, t, 149.75, .45, 20); pop(rNo, t, 150.35, .45, 20);
    rNo.style.transform += ` rotate(${1.5 * c05_kick(t - 150.65, 3, 14)}deg)`;
    pop(rBv, t, 152.4, .5, 12);
    const sp = seg(t, 151.65, 151.95);
    stamp.style.opacity = t < 151.65 ? 0 : clamp(sp * 4) * (1 - seg(t, 153.1, 153.5));
    stamp.style.transform = `translateY(${-160 * seg(t, 153.1, 153.5)}px) rotate(-14deg) scale(${st2 < 0 ? 3 - 2 * sp * sp : 1 + 0.08 * c05_kick(st2, 6, 20)})`;
    const rn = seg(t, 149.5, 150.1);
    poseNoa(ruleNoa, t, { x: 1540, y: 620 + 200 * (1 - out(rn)), s: 1.2, mood: t < 150.35 || t > 151 ? "happy" : "shock", talk: t > 150.2 && t < 150.9 || t > 152.3 && t < 153,
      look: -1, hop: t > 152 && t < 152.6 ? (t - 152) / .6 : 0, op: out(rn) * (1 - seg(t, 153.1, 153.4)) });
    // ================= loading screen (153.5–160)
    const L = back(seg(t, 153.5, 154.1));
    ld.style.opacity = clamp(L * 3); ld.style.transform = `translateY(${120 * (1 - L)}px) rotate(${-1.2 * (1 - L)}deg)`;
    lt.textContent = type("노아가 브랜드 필름을 렌더링하는 중…", seg(t, 153.8, 155.0));
    const third = t > 157.6;
    lc.textContent = t < 155 ? "" : third ? "(커피 3잔째… 거의 다 됐어요 ☕)" : "(커피 2잔째 ☕)";
    lc.style.transform = `scale(${third ? 1 + 0.12 * c05_kick(t - 157.6, 5, 14) : 1})`; lc.style.transformOrigin = "0 50%";
    const prog = t < 154.2 ? 0 : t < 154.7 ? .25 * ease(seg(t, 154.2, 154.7)) : t < 155.7 ? .25 + .25 * ease(seg(t, 154.9, 155.7)) : .5 + .38 * ease(seg(t, 155.9, 159.4));
    lb.style.width = (100 * prog) + "%"; lb.style.backgroundPosition = `${t * 70}px 0`;
    lp.textContent = Math.round(prog * 100) + "%";
    stepRows.forEach((r, i) => {
      const [, , done] = STEPS[i], appear = 154.2 + i * .35, active = t > (i ? STEPS[i - 1][2] : 154.2) && t < done;
      const p = back(seg(t, appear, appear + .4));
      r.style.opacity = clamp(p * 2); r.style.transform = `translateX(${-30 * (1 - clamp(p))}px)`;
      const ck = r.querySelector(".ck"), spn = r.querySelector(".sp");
      const cp = seg(t, done, done + .25);
      ck.setAttribute("stroke-dasharray", "40"); ck.setAttribute("stroke-dashoffset", 40 * (1 - cp));
      spn.style.opacity = active ? 1 : 0; spn.setAttribute("transform", `rotate(${t * 400} 18 18)`);
      r.querySelector(".nm").style.color = t > done ? "#2f7a3a" : active ? "#d4623a" : "#9a8f80";
    });
    // desk scene
    const D = out(seg(t, 153.9, 154.5));
    desk.style.opacity = D; desk.style.transform = `translateX(${200 * (1 - D)}px)`;
    const sipPh = ((t - 154.6) % 2.6 + 2.6) % 2.6, sip = t < 154.6 ? 0 : ease(seg(sipPh, .2, .6)) * (1 - ease(seg(sipPh, 1.3, 1.7)));
    poseNoa(deskNoa, t, { x: 1400 + 200 * (1 - D), y: 575, s: 1, look: sip > .5 ? 0 : -1, mood: sip > .6 ? "pout" : "happy", op: D });
    deskNoa.P.ar.setAttribute("transform", `rotate(${-70 * sip} 144 160)`);
    const mx = lerp(1690, 1548, sip), my = lerp(790, 762, sip);
    mug.style.left = (mx + 200 * (1 - D)) + "px"; mug.style.top = my + "px"; mug.style.opacity = D;
    mug.style.transform = `rotate(${-24 * sip}deg)`;
    steams.forEach((e, i) => { const k = ((t * .9 + i * .5) % 1); e.setAttribute("opacity", (1 - sip) * Math.sin(k * Math.PI) * .9);
      e.setAttribute("transform", `translate(0 ${-14 * k})`); });
    cups.forEach((c, i) => { const ap = i < 2 ? 1 : seg(t, 157.35, 157.6), bb = i < 2 ? 0 : 0.3 * c05_kick(t - 157.6, 5, 16);
      c.setAttribute("transform", `translate(${90 + i * 62} ${222 - 260 * (1 - ap * ap)}) scale(${1 + bb} ${1 - bb})`);
      c.setAttribute("opacity", i < 2 ? 1 : ap > 0 ? 1 : 0); });
    cnt.textContent = third ? "☕ × 3" : "☕ × 2";
    const cp = back(seg(t, 155.0, 155.5));
    cnt.style.opacity = D * clamp(cp * 2); cnt.style.transform = `rotate(6deg) scale(${(0.6 + 0.4 * cp) * (third ? 1 + 0.35 * c05_kick(t - 157.6, 4, 12) : 1)})`;
    [[noteA, 156.3], [noteB, 156.8]].forEach(([n, a]) => { const p = back(seg(t, a, a + .45));
      n.style.opacity = clamp(p * 2); n.style.transform = `scale(${0.5 + 0.5 * p}) rotate(${n === noteA ? -3 : 3}deg)`; });
  };
});
