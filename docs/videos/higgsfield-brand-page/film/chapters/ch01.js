// ---------------------------------------------------------------- 01 · Who it's for (10–40)
// Game-show structure: "업종 룰렛" — a prize wheel spins and lands on each business on the beat.
// Beats: 10.3 wheel drops in, rim bulbs chase, mystery card · 13 lands on 에이전시 (clapper snaps,
// cursor books a call) · 18 쇼핑몰 (bottle spins, add-to-cart, bottle arcs into the cart) · 23 매장
// (search typed, pin drops, route draws) · 28 인플루언서 (links pop, hearts, followers tick) — each
// card whip-pans in with blur while kinetic type stamps the benefit; Noa spins the wheel each time.
// 32.5 wheel rolls off, the real page drops in, confetti, Noa blows a party horn, then points at it.
(() => {
const INK1 = "#2b2320";
const c01_rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const c01_settle = (t, f = 2.2, k = 5) => t <= 0 ? 0 : Math.exp(-k * t) * Math.sin(2 * Math.PI * f * t);
const C01_CURSOR = `<svg width="46" height="56" viewBox="0 0 46 56"><path d="M4 4 L4 44 L15 34 L23 52 L31 48 L23 31 L38 30 Z" fill="#fffaf0" stroke="${INK1}" stroke-width="4" stroke-linejoin="round"/></svg>`;

scene(10, 40, (R, s) => {
  s.caps = [[10.2, "이 몰입형 페이지, 업종을 가리지 않습니다", "Immersive pages work for any kind of business"],
            [13, "에이전시 — 포트폴리오가 곧 쇼릴", "Agency: the portfolio becomes a showreel"],
            [18, "온라인 쇼핑몰 — 제품이 화면 안에서 움직인다", "Online store: products move on screen"],
            [23, "오프라인 매장 — 검색에서 방문까지 한 번에", "Offline store: from search to a visit"],
            [28, "인플루언서 — 링크 하나가 나만의 매장", "Influencer: one link becomes your own shop"],
            [33, "그리고 이게, 제가 실제로 만든 페이지", "And this is the page I actually built"]];
  const cam = el("div", "position:absolute;inset:0", "", R);
  const head = chapter(cam, "CHAPTER 01", "누구를 위한 페이지인가");
  const W = 720, H = 600, TOP = 200, CX = 990, CS = 1, cards = [];
  const tag = (txt, bg) => `<div style="position:absolute;left:22px;top:18px;padding:4px 14px 6px;border:3px solid ${INK1};border-radius:10px;background:${bg};font-size:26px;transform:rotate(-2deg)">${txt}</div>`;
  const mk = (i, bg, inner) => {
    const c = el("div", `left:${CX - W / 2}px;top:${TOP}px;width:${W}px;height:${H}px;background:${bg};transform-origin:50% 0;word-break:keep-all`, inner, cam); c.className = "card";
    const cur = el("div", "position:absolute;left:0;top:0;z-index:9;opacity:0", C01_CURSOR, c);
    const ring = el("div", `position:absolute;left:0;top:0;width:60px;height:60px;margin:-30px 0 0 -30px;border:4px solid ${INK1};border-radius:50%;z-index:8;opacity:0`, "", c);
    c.cur = cur; c.ring = ring; cards.push(c); return c;
  };
  // drives a card's cursor: glide from (x0,y0) to (x1,y1) during [a, a+.8], click at a+.9
  const click = (c, t, a, x0, y0, x1, y1) => {
    const m = ease(seg(t, a, a + 0.8)), vis = seg(t, a - 0.3, a) * (1 - seg(t, a + 1.8, a + 2.1));
    const press = seg(t, a + 0.85, a + 0.95) - seg(t, a + 0.95, a + 1.1);
    c.cur.style.opacity = vis;
    c.cur.style.transform = `translate(${lerp(x0, x1, m)}px, ${lerp(y0, y1, m) + 6 * Math.sin(m * Math.PI) * -4}px) scale(${1 - 0.15 * press})`;
    const rp = seg(t, a + 0.9, a + 1.4);
    c.ring.style.opacity = rp > 0 && rp < 1 ? 1 - rp : 0;
    c.ring.style.transform = `translate(${x1 + 6}px, ${y1 + 6}px) scale(${0.3 + 1.2 * rp})`;
    return press;
  };

  // a) agency ------------------------------------------------------------
  const STAMP = (txt, sub, col) => `<div class="stamp" style="position:absolute;left:50%;top:44%;z-index:10;opacity:0;padding:10px 34px 14px;border:6px solid ${col};border-radius:16px;background:rgba(255,250,240,.92);color:${col};text-align:center;white-space:nowrap;box-shadow:6px 7px 0 rgba(43,35,32,.25)"><div style="font-size:76px;line-height:1">${txt}</div><div style="font-size:30px;color:${INK1}">${sub}</div></div>`;
  const A = mk(0, "#fbe0c0", `${tag("에이전시 · AGENCY", "#f7d774")}
    <div style="position:absolute;left:28px;top:66px;font-size:44px">우리가 만든 브랜드 필름</div>
    <svg class="clap" viewBox="0 0 110 100" style="position:absolute;right:26px;top:18px;width:120px;height:110px;overflow:visible">
      <rect x="8" y="38" width="94" height="56" rx="6" fill="#fffaf0" stroke="${INK1}" stroke-width="4"/>
      <text x="55" y="76" text-anchor="middle" font-size="24" fill="${INK1}" font-family="GaeguLat">TAKE 1</text>
      <g class="top"><rect x="8" y="20" width="94" height="18" fill="${INK1}" stroke="${INK1}" stroke-width="4"/>
      ${[0, 1, 2, 3].map(i => `<path d="M${16 + i * 22} 22 l12 0 l-8 14 l-12 0z" fill="#fffaf0"/>`).join("")}</g></svg>
    <div style="position:absolute;left:0;right:0;top:138px;height:8px;background:repeating-linear-gradient(90deg,${INK1} 0 16px,transparent 16px 30px)"></div>
    <div class="reel" style="position:absolute;left:0;top:152px;height:262px;width:2200px"></div>
    <div style="position:absolute;left:0;right:0;top:420px;height:8px;background:repeating-linear-gradient(90deg,${INK1} 0 16px,transparent 16px 30px)"></div>
    <div class="bk btn" style="position:absolute;left:28px;bottom:30px;background:#e8894f;color:#fffaf0;border:4px solid ${INK1};font-size:34px;padding:10px 30px">상담 예약 →</div>
    <div style="position:absolute;right:30px;bottom:44px;font-size:26px;color:#6b5d52">SHOWREEL 2026</div>
    ${STAMP("예약 완료!", "금요일 오후 3시 ✓", "#2f7d4f")}`);
  const reel = A.querySelector(".reel"), reelF = [PAL.dawn, PAL.sea, PAL.gold, PAL.forest, PAL.dawn, PAL.sea].map((p, i) => {
    const w = el("div", `position:absolute;left:${i * 360}px;top:0;width:340px;height:262px;border-radius:12px;overflow:hidden;border:4px solid ${INK1}`, "", reel);
    const f = makeFilm(p); w.appendChild(f); return f; });
  const clapTop = A.querySelector(".clap .top"), aBk = A.querySelector(".bk"), aStamp = A.querySelector(".stamp");

  // b) shop ---------------------------------------------------------------
  const B = mk(1, "#fff4e2", `${tag("쇼핑몰 · ONLINE STORE", "#f2a7a0")}
    <div class="cartw" style="position:absolute;right:30px;top:20px;width:96px;height:84px">
      <svg viewBox="0 0 58 50" width="96" height="84"><path d="M3 6 H12 L18 34 H48 L54 14 H15" fill="#fffaf0" stroke="${INK1}" stroke-width="4" stroke-linejoin="round"/><circle cx="22" cy="43" r="5" fill="${INK1}"/><circle cx="44" cy="43" r="5" fill="${INK1}"/></svg>
      <span class="cart" style="position:absolute;right:-16px;top:-14px;width:48px;height:48px;border-radius:50%;background:#c8372d;color:#fff;border:4px solid ${INK1};font-size:30px;display:grid;place-items:center">0</span></div>
    <svg viewBox="0 0 200 260" style="position:absolute;left:50px;top:84px;width:260px;height:338px;overflow:visible">
      <ellipse cx="100" cy="250" rx="60" ry="8" fill="rgba(43,35,32,.2)"/>
      <g class="rot"><rect x="78" y="20" width="44" height="40" rx="6" fill="${INK1}"/><rect x="50" y="56" width="100" height="186" rx="30" fill="#e8894f" stroke="${INK1}" stroke-width="5"/>
      <rect x="62" y="118" width="76" height="70" rx="8" fill="#fffaf0" stroke="${INK1}" stroke-width="3"/><text x="100" y="162" text-anchor="middle" font-size="26" fill="${INK1}" font-family="GaeguLat">NOA</text>
      <rect class="shine" x="64" y="66" width="12" height="160" rx="6" fill="rgba(255,255,255,.5)"/></g></svg>
    <div style="position:absolute;left:350px;right:30px;top:150px;line-height:1.2">
      <div style="font-size:44px">노아 선셋 오일</div>
      <div style="font-size:28px;color:#6b5d52;margin-top:6px"><span style="color:#d98c1f">★</span> 4.6 · 리뷰 128</div>
      <div style="font-size:52px;margin-top:6px">₩39,000</div></div>
    <div class="btn buy" style="position:absolute;left:350px;right:30px;bottom:34px;background:${INK1};color:#fffaf0;font-size:34px;padding:14px 0">장바구니 담기</div>
    <div style="position:absolute;left:40px;bottom:40px;font-size:26px;color:#6b5d52">360° 돌려 보기</div>
    <svg class="fly" viewBox="0 0 40 60" style="position:absolute;left:0;top:0;width:60px;height:90px;opacity:0;z-index:9"><rect x="14" y="2" width="12" height="10" fill="${INK1}"/><rect x="6" y="10" width="28" height="48" rx="9" fill="#e8894f" stroke="${INK1}" stroke-width="3"/></svg>
    <div class="plus" style="position:absolute;left:470px;top:40px;z-index:10;font-size:150px;line-height:1;color:#c8372d;-webkit-text-stroke:4px ${INK1};text-shadow:6px 6px 0 #f7d774;opacity:0;transform-origin:50% 80%">+1</div>`);
  const bRot = B.querySelector(".rot"), bShine = B.querySelector(".shine"), bBuy = B.querySelector(".buy"), bCart = B.querySelector(".cart"), bFly = B.querySelector(".fly"), bPlus = B.querySelector(".plus"), bCartW = B.querySelector(".cartw");

  // c) offline store ------------------------------------------------------
  const C = mk(2, "#e3f0da", `${tag("매장 · OFFLINE STORE", "#9fd3a8")}
    <div style="position:absolute;left:360px;right:28px;top:16px;height:58px;border:4px solid ${INK1};border-radius:999px;background:#fffaf0;display:flex;align-items:center;padding:0 18px;font-size:30px;gap:10px;white-space:nowrap;overflow:hidden">🔍 <span class="q"></span></div>
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style="position:absolute;left:0;top:90px;width:720px;height:320px;border-top:4px solid ${INK1};border-bottom:4px solid ${INK1}">
      <rect x="0" y="0" width="400" height="250" fill="#d5e8c8"/>
      <path d="M0 70 H400 M0 180 H400 M110 0 V250 M290 0 V250" stroke="#fffaf0" stroke-width="22"/>
      <path d="M0 70 H400 M0 180 H400 M110 0 V250 M290 0 V250" stroke="#b9d3a8" stroke-width="2" stroke-dasharray="8 8"/>
      <rect x="140" y="92" width="120" height="66" rx="6" fill="#bcdcf0" stroke="${INK1}" stroke-width="3"/>
      <g transform="translate(300 88)"><rect x="0" y="12" width="84" height="66" fill="#fffaf0" stroke="${INK1}" stroke-width="3"/>
        ${[0, 1, 2, 3].map(i => `<path d="M${i * 21} 12 h21 v12 q-10.5 9 -21 0Z" fill="${i % 2 ? "#fffaf0" : "#c8372d"}" stroke="${INK1}" stroke-width="2"/>`).join("")}
        <rect class="glow" x="10" y="34" width="34" height="30" fill="#ffd9a8" stroke="${INK1}" stroke-width="2"/><rect x="52" y="34" width="22" height="44" fill="${INK1}"/></g>
      <path class="route" d="M60 210 V180 H290 V120" fill="none" stroke="#c8372d" stroke-width="7" stroke-linecap="round" stroke-dasharray="4 14"/>
      <circle cx="60" cy="214" r="12" fill="#3e8fb8" stroke="${INK1}" stroke-width="4"/>
    </svg>
    <svg class="pin" viewBox="0 0 60 80" style="position:absolute;left:556px;top:102px;width:80px;height:106px;overflow:visible"><path d="M30 78 C30 78 4 44 4 28 A26 26 0 0 1 56 28 C56 44 30 78 30 78Z" fill="#c8372d" stroke="${INK1}" stroke-width="4"/><circle cx="30" cy="28" r="10" fill="#fffaf0" stroke="${INK1}" stroke-width="3"/></svg>
    <div class="walk" style="position:absolute;left:210px;top:260px;z-index:6;padding:6px 20px 10px;background:#fffaf0;border:4px solid ${INK1};border-radius:14px;font-size:46px;white-space:nowrap;box-shadow:5px 6px 0 rgba(43,35,32,.2);opacity:0">🚶 도보 3분!</div>
    <div style="position:absolute;left:28px;top:430px;font-size:30px;color:#2f5d3a">● 영업 중 · 성수동</div>
    <div class="btn go" style="position:absolute;left:28px;right:28px;bottom:28px;background:#f7d774;color:${INK1};border:4px solid ${INK1};font-size:34px;padding:12px 0">길찾기 · 방문 예약</div>`);
  const cQ = C.querySelector(".q"), cPin = C.querySelector(".pin"), cRoute = C.querySelector(".route"), cGlow = C.querySelector(".glow"), cWalk = C.querySelector(".walk"), cGo = C.querySelector(".go");

  // d) influencer ---------------------------------------------------------
  const D = mk(3, "#fde2ea", `${tag("인플루언서 · CREATOR", "#f7b8cb")}
    <div style="position:absolute;left:0;width:320px;top:78px;text-align:center">
      <div style="width:176px;height:176px;border-radius:50%;margin:0 auto;background:conic-gradient(#e8894f,#f7d774,#e0607e,#e8894f);padding:8px;border:4px solid ${INK1}"><div class="avin" style="width:100%;height:100%;border-radius:50%;background:#fde2ea;position:relative;overflow:hidden"></div></div>
      <div style="font-size:38px;margin-top:10px">@noaino</div><div class="fol" style="font-size:32px;color:#6b5d52">팔로워 12.4K</div></div>
    <div class="links" style="position:absolute;left:330px;right:28px;top:96px"></div>
    ${STAMP("완판 임박!", "공구 오픈 3분 만에 🔥", "#c8372d")}`);
  const mini = makeNoa(140); mini.style.left = "10px"; mini.style.top = "10px"; D.querySelector(".avin").appendChild(mini);
  const links = ["🔥 공구 오픈", "▶ 신상 리뷰", "📍 팝업 일정"].map(l => el("div", `height:88px;border-radius:16px;background:#fffaf0;border:4px solid ${INK1};margin-bottom:20px;display:flex;align-items:center;padding:0 22px;font-size:36px;white-space:nowrap;box-shadow:4px 5px 0 rgba(43,35,32,.18)`, l, D.querySelector(".links")));
  const hearts = Array.from({ length: 9 }, (_, i) => el("div", `position:absolute;left:0;top:0;font-size:${34 + (i % 3) * 12}px;opacity:0;z-index:7;color:#e0607e;-webkit-text-stroke:2px ${INK1}`, "♥", D));
  const dFol = D.querySelector(".fol"), dStamp = D.querySelector(".stamp");

  // reference reveal ------------------------------------------------------
  const ref = refWindow(cam, 180, 150, 1200, 720);
  ref.style.transformOrigin = "50% 0";
  const tada = el("div", `left:170px;top:104px;z-index:12;padding:8px 22px 10px;background:#c8372d;color:#fffaf0;border:4px solid ${INK1};border-radius:14px;font-size:36px;box-shadow:6px 7px 0 rgba(43,35,32,.25);white-space:nowrap;transform-origin:0 50%`, "짠! 제가 만든 페이지", cam); tada.className = "abs";
  const COLS = ["#f7d774", "#e0607e", "#3e8fb8", "#9fd3a8", "#e8894f"];
  const conf = Array.from({ length: 44 }, (_, i) => { const d = el("div", `left:0;top:0;width:${12 + c01_rnd(i) * 10}px;height:${8 + c01_rnd(i + 50) * 10}px;background:${COLS[i % 5]};border:2px solid ${INK1};border-radius:2px;z-index:15;opacity:0`, "", cam); d.className = "abs"; return d; });
  // Noa's guide intro (35.9–39.3): nameplate, an "eye contact" reticle he keeps dodging, 0% stamp
  const c01_plate = el("div", `left:1250px;top:300px;z-index:17;padding:10px 26px 12px;background:#fff3cf;border:4px solid ${INK1};border-radius:14px;box-shadow:6px 7px 0 rgba(43,35,32,.25);white-space:nowrap;opacity:0;transform-origin:0 100%`,
    `<div style="font-size:24px;letter-spacing:4px;color:#c8372d">YOUR GUIDE</div><div style="font-size:48px;line-height:1.05">가이드 · 노아</div>`, cam); c01_plate.className = "abs";
  const c01_ret = el("div", "left:0;top:0;z-index:36;opacity:0;pointer-events:none", `<svg width="160" height="160" viewBox="-80 -80 160 160" overflow="visible">
    <g class="ring"><circle r="58" fill="none" stroke="#c8372d" stroke-width="6" stroke-dasharray="22 12"/><circle r="8" fill="#c8372d"/>
    <path d="M0 -76 V-44 M0 44 V76 M-76 0 H-44 M44 0 H76" stroke="#c8372d" stroke-width="6" stroke-linecap="round"/></g>
    <g transform="translate(40 -96)"><rect x="-6" y="-24" width="128" height="36" rx="10" fill="#fffaf0" stroke="${INK1}" stroke-width="3"/><text x="58" y="3" text-anchor="middle" font-size="24" font-family="GaeguKo" fill="${INK1}">아이컨택?</text></g></svg>`, cam); c01_ret.className = "abs"; const c01_ring = c01_ret.querySelector(".ring");
  const c01_zero = el("div", `left:1250px;top:440px;z-index:19;padding:6px 22px 10px;border:6px solid #c8372d;border-radius:14px;background:rgba(255,250,240,.94);color:#c8372d;font-size:50px;white-space:nowrap;opacity:0;box-shadow:6px 7px 0 rgba(43,35,32,.22)`, "아이컨택 0%", cam); c01_zero.className = "abs";
  const toot = el("div", `left:0;top:0;z-index:16;font-size:40px;color:#c8372d;opacity:0;white-space:nowrap`, "뿌우~!", cam); toot.className = "abs";

  const noa = makeNoa(140); cam.appendChild(noa);
  // party horn prop living inside Noa's body group
  const horn = document.createElementNS("http://www.w3.org/2000/svg", "g");
  horn.innerHTML = `<path d="M100 126 L136 114 L136 138 Z" fill="#3e8fb8" stroke="${INK1}" stroke-width="4" stroke-linejoin="round"/>
    <rect class="tube" x="134" y="119" width="0" height="14" rx="4" fill="#f7d774" stroke="${INK1}" stroke-width="3.5"/>
    <circle class="curl" cx="142" cy="126" r="9" fill="none" stroke="#e0607e" stroke-width="6"/>`;
  noa.P.b.appendChild(horn);
  const tube = horn.querySelector(".tube"), curl = horn.querySelector(".curl");
  const bub = makeBubble(cam); bub.style.whiteSpace = "normal"; bub.style.width = "330px"; bub.style.textAlign = "center"; bub.style.wordBreak = "keep-all";
  const bubS = makeBubble(cam);

  // ---- game-show wheel ----
  const WC = [380, 470], WR = 200, SEG = [["에이전시", "🎬", "#f7d774"], ["쇼핑몰", "🛒", "#f2a7a0"], ["매장", "🏪", "#9fd3a8"], ["인플루언서", "📱", "#f7b8cb"]];
  const arcP = (a0, a1, r) => { const p = a => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M0 0 L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`; };
  const segs = [0, 1, 2, 3].map(i => `<path d="${arcP(i * 90 - 45, i * 90 + 45, WR - 14)}" fill="${SEG[i][2]}" stroke="${INK1}" stroke-width="4"/>`).join("");
  // labels stay upright while the wheel spins (positioned per frame) so they are always readable
  const labs = [0, 1, 2, 3].map(i => `<g class="lab"><text x="0" y="-14" text-anchor="middle" font-size="40" font-family="GaeguKo">${SEG[i][1]}</text>
      <text x="0" y="26" text-anchor="middle" font-size="${i === 3 ? 30 : 36}" fill="${INK1}" font-family="GaeguKo">${SEG[i][0]}</text></g>`).join("");
  const bulbs = Array.from({ length: 16 }, (_, k) => { const a = k / 16 * 2 * Math.PI; return `<circle class="bl" cx="${(Math.sin(a) * (WR - 2)).toFixed(1)}" cy="${(-Math.cos(a) * (WR - 2)).toFixed(1)}" r="9" stroke="${INK1}" stroke-width="3"/>`; }).join("");
  const wheel = el("div", `left:${WC[0] - 320}px;top:${WC[1] - 300}px;width:640px;height:720px;z-index:5`, `<svg width="640" height="720" viewBox="-320 -300 640 720" overflow="visible">
      <path d="M-22 0 L-90 390 L90 390 L22 0 Z" fill="#c8372d" stroke="${INK1}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="-120" y="380" width="240" height="30" rx="10" fill="#8f1f18" stroke="${INK1}" stroke-width="5"/>
      <circle cx="10" cy="12" r="${WR + 6}" fill="rgba(43,35,32,.2)"/>
      <circle cx="0" cy="0" r="${WR + 6}" fill="#e8894f" stroke="${INK1}" stroke-width="6"/>
      <g class="rot">${segs}</g><g class="labs">${labs}</g>
      <g class="bulbs">${bulbs}</g>
      <circle cx="0" cy="0" r="40" fill="#fffaf0" stroke="${INK1}" stroke-width="5"/><text x="0" y="10" text-anchor="middle" font-size="28" font-family="GaeguKo" fill="#c8372d">GO</text>
      <g class="ptr"><path d="M-26 ${-WR - 44} L26 ${-WR - 44} L0 ${-WR + 10} Z" fill="#fffaf0" stroke="${INK1}" stroke-width="5" stroke-linejoin="round"/><circle cx="0" cy="${-WR - 40}" r="10" fill="#c8372d" stroke="${INK1}" stroke-width="4"/></g>
      <g class="rays" opacity="0">${Array.from({ length: 9 }, (_, k) => { const a = (-80 + k * 20) * Math.PI / 180; return `<line x1="${Math.sin(a) * 60}" y1="${-WR - 40 - Math.cos(a) * 60}" x2="${Math.sin(a) * 100}" y2="${-WR - 40 - Math.cos(a) * 100}" stroke="${INK1}" stroke-width="6" stroke-linecap="round"/>`; }).join("")}</g></svg>`, cam); wheel.className = "abs";
  const c01_labs = [...wheel.querySelectorAll(".lab")];
  const wRot = wheel.querySelector(".rot"), wPtr = wheel.querySelector(".ptr"), wRays = wheel.querySelector(".rays"), wBulbs = [...wheel.querySelectorAll(".bl")];
  const wTitle = el("div", `left:${WC[0] - 200}px;top:130px;width:400px;text-align:center;z-index:7;font-size:48px;color:#c8372d;text-shadow:4px 4px 0 #f7d774;-webkit-text-stroke:1.5px ${INK1};white-space:nowrap`, "업종 룰렛!", cam); wTitle.className = "abs";
  // mystery card (before the first spin)
  const mystery = el("div", `left:${CX - W / 2}px;top:${TOP}px;width:${W}px;height:${H}px;transform-origin:50% 0;background:repeating-linear-gradient(45deg,#f7d774 0 26px,#f2c14e 26px 52px);display:grid;place-items:center;text-align:center`,
    `<div><div style="font-size:180px;line-height:1;color:#fffaf0;-webkit-text-stroke:5px ${INK1}">?</div><div style="font-size:34px;margin-top:10px;padding:6px 18px;background:#fffaf0;border:3px solid ${INK1};border-radius:12px">당신의 업종은?</div></div>`, cam); mystery.className = "card";
  // kinetic type column
  const KT = [[["포트폴리오가", "곧 쇼릴"], "Agency"], [["제품이", "화면에서", "움직인다"], "Online store"], [["검색에서", "방문까지", "한 번에"], "Offline store"], [["링크 하나가", "나만의 매장"], "Creator"]];
  const kt = KT.map((k, i) => {
    const d = el("div", `left:1380px;top:290px;width:380px;z-index:9;word-break:keep-all`, "", cam); d.className = "abs";
    d.chars = [];
    k[0].forEach((L, li) => { const row = el("div", `white-space:nowrap;font-size:52px;line-height:1.2;color:${li === k[0].length - 1 ? "#c8372d" : INK1};text-shadow:3px 3px 0 #f7d774`, "", d);
      [...L].forEach(ch => d.chars.push(el("span", "display:inline-block;transform-origin:50% 100%", ch === " " ? "&nbsp;" : ch, row))); });
    el("div", `display:inline-block;margin-top:12px;padding:2px 14px 4px;border:3px solid ${INK1};border-radius:999px;background:#fffaf0;font-size:24px`, k[1], d);
    return d; });
  const puff = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  puff.setAttribute("cx", "140"); puff.setAttribute("cy", "122"); puff.setAttribute("fill", "#f0b27a"); puff.setAttribute("stroke", INK1); puff.setAttribute("stroke-width", "4");
  noa.P.b.appendChild(puff);
  const glint = document.createElementNS("http://www.w3.org/2000/svg", "path");
  glint.setAttribute("d", "M0 -14 L3 -3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3 -3Z"); glint.setAttribute("fill", "#fff"); glint.setAttribute("stroke", INK1); glint.setAttribute("stroke-width", "2");
  noa.P.b.appendChild(glint);
  const SPIN = [[11.9, 13.0], [16.9, 18.0], [21.9, 23.0], [26.9, 28.0]], BEAT = [13, 18, 23, 28];
  const wheelAngle = t => {
    let a = 20 + 8 * Math.sin(t * 1.5) * (t < 11.9 ? 1 : 0), prev = 20;
    for (let i = 0; i < 4; i++) {
      const [s0, e0] = SPIN[i], tgt = -(i * 90) - 720 * (i + 1);
      if (t < s0) return i === 0 ? a : prev + 3 * c01_settle(t - SPIN[i - 1][1], 1.8, 3.5);
      if (t < e0) { const p = seg(t, s0, e0); return lerp(prev, tgt, 1 - Math.pow(1 - p, 3)); }
      prev = tgt;
    }
    return prev + 3 * c01_settle(t - SPIN[3][1], 1.8, 3.5);
  };

  return t => {
    head.style.opacity = seg(t, 10.2, 10.6) * (1 - seg(t, 11.0, 11.3));
    head.style.transform = `rotate(-1.5deg) translateY(${-40 * seg(t, 11.0, 11.3)}px)`;
    const active = t < 13 ? -1 : t < 33 ? Math.floor((t - 13) / 5) : 4;
    // wheel: drops in, spins on each beat, rolls away at the end
    const wIn = seg(t, 10.3, 10.9), wOut = seg(t, 32.4, 33.2);
    const ang = wheelAngle(t);
    wheel.style.opacity = wIn > 0 && wOut < 1 ? 1 : 0;
    wheel.style.transform = `translate(${-900 * wOut * wOut}px, ${-700 * (1 - back(wIn))}px) rotate(${-200 * wOut * wOut}deg)`;
    wheel.style.transformOrigin = `320px 300px`;
    wRot.setAttribute("transform", `rotate(${ang})`);
    c01_labs.forEach((g, i) => { const A = (ang + i * 90) * Math.PI / 180, r = i === 3 ? 122 : 118;
      g.setAttribute("transform", `translate(${(Math.sin(A) * r).toFixed(1)} ${(-Math.cos(A) * r).toFixed(1)})`); });
    const spinning = SPIN.some(([a, b]) => t > a && t < b);
    const fr = ((ang % 22.5) + 22.5) % 22.5 / 22.5;
    wPtr.setAttribute("transform", `rotate(${spinning ? -18 * fr : 5 * c01_settle(t - (SPIN.find(([a, b]) => t >= b) || [0, 99])[1], 3, 5)} 0 ${-WR - 40})`);
    const landed = BEAT.find(b => t >= b && t < b + 0.45);
    wRays.setAttribute("opacity", landed ? 1 - seg(t, landed + 0.2, landed + 0.45) : 0);
    wRays.setAttribute("transform", `translate(0 ${-WR - 40}) scale(${landed ? 0.8 + 0.4 * seg(t, landed, landed + 0.45) : 1}) translate(0 ${WR + 40})`);
    wBulbs.forEach((b, k) => b.setAttribute("fill", (Math.floor(t * (spinning ? 14 : 4)) + k) % 3 === 0 ? "#fff6c8" : "#f2c14e"));
    wTitle.style.opacity = seg(t, 11.2, 11.3) * (1 - wOut);
    wTitle.style.transform = `scale(${back(seg(t, 11.2, 11.55)) * (1 + 0.06 * Math.sin(t * 5))}) rotate(${-3 + 2 * Math.sin(t * 2)}deg)`;
    // cards: whip-pan in from the right with blur, out to the left
    const whip = (node, tin, tout) => {
      const pi = seg(t, tin, tin + 0.38), po = seg(t, tout, tout + 0.32);
      if (pi <= 0 || po >= 1) { node.style.opacity = 0; node.style.display = "none"; return; }
      node.style.display = "block"; node.style.opacity = 1;
      const xi = 760 * (1 - out(pi)), xo = -820 * po * po, blur = 10 * (1 - pi) + 12 * po;
      const settle = 2 * c01_settle(t - tin - 0.38, 1.4, 3.5);
      node.style.transform = `translateX(${xi + xo}px) skewX(${-14 * (1 - pi) + 14 * po}deg) rotate(${-1.5 + settle}deg) scale(${CS})`;
      node.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : "none";
    };
    whip(mystery, 10.8, 12.95);
    cards.forEach((c, i) => { whip(c, BEAT[i] - 0.05, i < 3 ? BEAT[i + 1] - 0.05 : 32.5); c.style.zIndex = 3; });
    mystery.style.transform += ` rotate(${3 * Math.sin(t * 2.2)}deg)`;
    // kinetic type
    kt.forEach((d, i) => {
      const a = BEAT[i] + 0.3, z = i < 3 ? BEAT[i + 1] - 0.15 : 32.4;
      const vis = t > a - 0.05 && t < z + 0.3;
      d.style.opacity = vis ? 1 - seg(t, z, z + 0.3) : 0;
      d.style.transform = `translateY(${-40 * seg(t, z, z + 0.3)}px)`;
      d.chars.forEach((c, j) => { const p = seg(t, a + j * 0.05, a + j * 0.05 + 0.28);
        c.style.opacity = p > 0 ? 1 : 0; c.style.transform = `scale(${lerp(2.1, 1, back(p))}, ${lerp(0.4, 1, back(p))}) rotate(${(j % 2 ? 4 : -4) * (1 - p)}deg)`; });
    });

    const stampAt = (node, a) => { const p = seg(t, a, a + 0.3), q = back(p);
      node.style.opacity = p > 0 ? 1 : 0;
      node.style.transform = `translate(-50%, -50%) rotate(-10deg) scale(${lerp(2.4, 1, q) * (1 + 0.04 * c01_settle(t - a - 0.3, 3, 5))})`; };
    // agency: reel rolls, clapper snaps, cursor books a call → big "예약 완료!" stamp
    reelF.forEach((f, i) => f.update(t + i * 2, .8)); reel.style.transform = `translateX(${-((t * 70) % 720)}px)`;
    const snap = Math.max(seg(t, 13.3, 13.45) - seg(t, 13.5, 13.9), seg(t, 14.6, 14.75) - seg(t, 14.8, 15.2));
    clapTop.setAttribute("transform", `rotate(${-28 * (1 - snap) * (t > 13 && t < 16 ? 1 : 0.4)} 8 38)`);
    const pa = click(A, t, 15.3, 560, 300, 150, 530);
    aBk.style.transform = `scale(${1 - 0.1 * pa})`;
    stampAt(aStamp, 16.25);

    // shop: bottle turntable → add to cart → bottle arcs into the cart → huge "+1"
    const rot = Math.cos(t * 1.6), spin = t > 18 && t < 23 ? 1 : 0.4;
    bRot.setAttribute("transform", `translate(100 0) scale(${1 - (1 - Math.abs(rot)) * 0.45 * spin} 1) translate(-100 0)`);
    bShine.setAttribute("x", rot < 0 ? 124 : 64);
    const pb = click(B, t, 19.3, 640, 330, 510, 520);
    bBuy.style.transform = `scale(${1 - 0.1 * pb})`;
    bBuy.textContent = t > 20.25 && t < 23 ? "담았어요 ✓" : "장바구니 담기";
    bBuy.style.background = t > 20.25 && t < 23 ? "#2f7d4f" : INK1;
    const fl = seg(t, 20.3, 21.0);
    bFly.style.opacity = fl > 0 && fl < 1 ? 1 : 0;
    bFly.style.transform = `translate(${lerp(150, 620, fl)}px, ${lerp(220, 40, fl) - 220 * Math.sin(fl * Math.PI)}px) rotate(${fl * 720}deg) scale(${1.2 - 0.7 * fl})`;
    const hit = t > 21.0 ? c01_settle(t - 21.0, 2.5, 5) : 0;
    bCart.textContent = t > 21.0 ? "1" : "0";
    bCart.style.transform = `scale(${1 + 0.8 * Math.abs(hit)})`;
    bCartW.style.transform = `rotate(${14 * hit}deg)`;
    const pl = seg(t, 21.0, 22.4);
    bPlus.style.opacity = pl > 0 && pl < 1 ? 1 - seg(pl, 0.7, 1) : 0;
    bPlus.style.transform = `translateY(${-30 * out(pl)}px) scale(${back(seg(t, 21.0, 21.3))}) rotate(${-8 + 4 * Math.sin(t * 8)}deg)`;

    // store: search typed → pin slams down → route draws → "도보 3분!" pops
    cQ.textContent = type("성수 쇼룸 근처", seg(t, 23.3, 24.3)) + (t > 23 && t < 24.5 && Math.floor(t * 4) % 2 ? "|" : "");
    const pinDrop = seg(t, 24.4, 24.75);
    const pinB = t > 24.75 ? Math.abs(c01_settle(t - 24.75, 1.8, 4)) * 50 : 0;
    const squash = t > 24.75 ? 0.25 * Math.max(0, c01_settle(t - 24.75, 2.2, 6)) : 0;
    cPin.style.transform = `translateY(${-320 * (1 - pinDrop * pinDrop) - pinB - (t > 26.5 ? Math.abs(Math.sin(t * 3)) * 12 : 0)}px) scale(${1 + squash}, ${1 - squash})`;
    cPin.style.transformOrigin = "50% 100%";
    cPin.style.opacity = t < 23 ? 1 : seg(t, 24.4, 24.45);
    const rt = seg(t, 25.0, 26.1);
    cRoute.style.clipPath = `inset(0 ${100 - 100 * rt}% 0 0)`;
    cRoute.setAttribute("stroke-dashoffset", -t * 30);
    cGlow.setAttribute("fill", t > 25 && Math.floor(t * 3) % 2 ? "#ffe9a8" : "#ffd9a8");
    const wp1 = seg(t, 26.1, 26.4);
    cWalk.style.opacity = wp1 > 0 ? 1 : 0;
    cWalk.style.transform = `scale(${back(wp1) * (1 + 0.06 * c01_settle(t - 26.4, 2, 4))}) rotate(-4deg)`;
    const pc = click(C, t, 26.9, 620, 360, 360, 540);
    cGo.style.transform = `scale(${1 - 0.1 * pc})`;

    // influencer: links pop, hearts float, followers tick, click 공구 오픈 → "완판 임박!" stamp
    poseNoa(mini, t, { x: 0, y: 0, s: 1, wave: t > 28 && t < 31, talk: t > 29 && t < 30 });
    dFol.textContent = "팔로워 " + (12.4 + 0.6 * ease(seg(t, 28.6, 32.4))).toFixed(1) + "K";
    links.forEach((l, i) => {
      const p = back(seg(t, 28.3 + i * 0.25, 28.75 + i * 0.25));
      l.style.transform = t < 26 ? "none" : `translateX(${-80 * (1 - p)}px) scale(${0.6 + 0.4 * p})`;
      l.style.opacity = t < 26 ? 1 : clamp(p * 2);
    });
    const pd = click(D, t, 29.8, 620, 520, 520, 140);
    links[0].style.background = t > 30.7 && t < 33 ? "#f7d774" : "#fffaf0";
    if (pd) links[0].style.transform = `scale(${1 - 0.06 * pd})`;
    stampAt(dStamp, 30.9);
    hearts.forEach((h, i) => {
      const a = 28.6 + i * 0.4, p = seg(t, a, a + 1.8);
      h.style.opacity = p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0;
      h.style.transform = `translate(${120 + 110 * c01_rnd(i) + 22 * Math.sin(p * 9 + i)}px, ${260 - 230 * p}px) scale(${0.7 + 0.6 * p})`;
    });

    // ---- reference reveal ----
    const rIn = seg(t, 33.1, 33.9);
    const rY = t < 33.9 ? lerp(-900, 0, rIn * rIn) : -26 * Math.abs(c01_settle(t - 33.9, 1.6, 4)) * 1;
    const rRot = t < 33.9 ? -4 * (1 - rIn) : 2.5 * c01_settle(t - 33.9, 1.3, 3);
    ref.style.opacity = t > 33.05 ? 1 : 0;
    const c01_sh = ease(seg(t, 35.6, 36.2));
    ref.style.transform = `translate(${-110 * c01_sh}px, ${rY}px) rotate(${rRot}deg) scale(${(1 + 0.015 * ease(seg(t, 34, 40))) * (1 - 0.12 * c01_sh)})`;
    ref.scrollTo(0.55 * ease(seg(t, 34.8, 39.6)), t);
    const tdP = back(seg(t, 34.0, 34.35));
    tada.style.opacity = seg(t, 34.0, 34.05);
    tada.style.transform = `translate(${-60 * c01_sh}px, ${10 * c01_sh}px) rotate(${-6 + 2 * Math.sin(t * 3)}deg) scale(${(1.8 - 0.8 * tdP) * (1 - 0.1 * c01_sh)})`;
    conf.forEach((d, i) => {
      const side = i % 2, dt = t - 33.95 - (i % 6) * 0.03;
      if (dt < 0 || dt > 3) { d.style.opacity = 0; return; }
      const a = side ? -Math.PI * (0.62 + 0.3 * c01_rnd(i + 7)) : -Math.PI * (0.08 + 0.3 * c01_rnd(i + 7));
      const v = 700 + 700 * c01_rnd(i + 3), k = (1 - Math.exp(-2.2 * dt)) / 2.2;
      const x = (side ? 1370 : 190) + Math.cos(a) * v * k + 14 * Math.sin(dt * 7 + i);
      const y = 180 + Math.sin(a) * v * k + 170 * dt * dt;
      d.style.opacity = 1 - seg(dt, 2.3, 3);
      d.style.transform = `translate(${x}px, ${y}px) rotate(${dt * (300 + 500 * c01_rnd(i))}deg) scaleX(${Math.cos(dt * 8 + i)})`;
    });

    // ---- Noa ----
    let c01_s = 1, c01_dx = 0, c01_smear = 0;
    let nx = 180, ny = 716, hop = 0, mood = "happy", wave = false, talk = false, look = 1, flip = false, arm = null, sq = 0, gl = 0, nrot = 0;
    if (t < 32.4) {
      // hops in from the right, then works the wheel: crouch → swipe → watch → celebrate
      const pin = seg(t, 11.0, 11.6);
      if (t < 11.6) { nx = lerp(-160, 180, ease(pin)); ny = 716 - 120 * Math.sin(pin * Math.PI); mood = "happy"; }
      sq = t > 11.6 ? 0.14 * c01_settle(t - 11.6, 2.6, 6) : 0;
      SPIN.forEach(([s0, e0], i) => {
        if (t > s0 - 0.35 && t < s0) sq = 0.14 * seg(t, s0 - 0.35, s0 - 0.1);
        if (t >= s0 && t < s0 + 0.3) { arm = lerp(50, -110, out(seg(t, s0, s0 + 0.2))); sq = -0.08; }
        if (t >= s0 + 0.3 && t < e0) { mood = t < e0 - 0.3 ? "shock" : "happy"; look = 1; }
        if (t >= e0 && t < e0 + 0.7) { hop = seg(t, e0, e0 + 0.7); wave = true; }
      });
      if (t > 20.45 && t < 22.6) { look = 0.3; talk = t > 21.2 && t < 21.8; }
      if (t > 24.5 && t < 25.0) mood = "shock";
      if (t > 29 && t < 31) { wave = true; look = 0.5; }
    } else {
      // leaps over to the right of the page, blows the horn, glints at camera, then points at the page
      const p = seg(t, 32.6, 33.4);
      flip = true; nx = lerp(180, 1470, ease(p)); ny = lerp(716, 714, p) - 260 * Math.sin(p * Math.PI); nrot = p > 0 && p < 1 ? 360 * ease(p) : 0;
      sq = t > 33.4 ? 0.15 * c01_settle(t - 33.4, 2.5, 5) : 0; look = 1; flip = true;
      mood = t > 32.6 && t < 33.4 ? "shock" : "happy";
      if (t > 35.0 && t < 35.5) { flip = false; look = 0; gl = seg(t, 35.0, 35.15) * (1 - seg(t, 35.3, 35.5)); }
      if (t > 35.5 && t < 35.95) { arm = -18 + 6 * Math.sin(t * 5); talk = true; }
      if (t >= 35.95) {
        // guide intro: grows into a close-up, then dodges the "eye contact" reticle twice
        c01_s = 1 + 0.85 * back(seg(t, 35.9, 36.4));
        flip = false; look = 0;
        const d1 = seg(t, 37.25, 37.42), d2 = seg(t, 37.85, 38.02);
        c01_dx = -80 * out(d1) + 130 * out(d2);
        if (t > 37.25) look = t < 37.85 ? -1 : 1;
        if (t > 37.85) flip = true;
        c01_smear = (d1 > 0 && d1 < 1) || (d2 > 0 && d2 < 1) ? (d2 > 0 ? 1 : -1) : 0;
        sq = 0.1 * c01_settle(t - 37.42, 2.6, 6) + 0.1 * c01_settle(t - 38.02, 2.6, 6) + (t > 35.9 ? 0.12 * c01_settle(t - 36.35, 2.2, 5) : 0);
        if (t > 38.35) { arm = null; gl = seg(t, 38.55, 38.7) * (1 - seg(t, 38.85, 39.05)); }
        talk = t > 36.1 && t < 37.0;
      }
      nx += c01_dx;
    }
    poseNoa(noa, t, { x: nx, y: ny, s: c01_s, hop, mood, wave, talk, look, flip, arms: t > 38.35 ? "hips" : undefined, op: seg(t, 11.0, 11.05) });
    noa.style.transform += ` rotate(${nrot}deg) scale(${1 + sq}, ${1 - sq}) skewX(${-14 * c01_smear}deg)`;
    // intro props
    const plP = back(seg(t, 36.05, 36.45));
    c01_plate.style.opacity = clamp(plP * 2);
    c01_plate.style.transform = `scale(${plP}) rotate(${-3 + wobble(t, 36.45, 3, 10, 4)}deg)`;
    const fy = 868 - 0.6 * 154 * c01_s;
    const rIn2 = popIn(c01_ret, t, 36.95, 0.3);
    const rx = t < 37.3 ? 1470 + 70 : t < 37.85 ? lerp(1540, 1540 - 80, out(seg(t, 37.45, 37.7))) : lerp(1460, 1590, out(seg(t, 38.05, 38.3)));
    c01_ret.style.opacity = rIn2 > 0 ? clamp(rIn2 * 3) * (1 - seg(t, 38.35, 38.5)) : 0;
    c01_ret.style.transform = `translate(${rx - 80}px, ${fy - 80}px) scale(${(0.6 + 0.4 * back(rIn2)) * (1 + 0.25 * seg(t, 38.35, 38.5))})`;
    c01_ring.setAttribute("transform", `rotate(${(t * 60) % 360})`);
    const zS = seg(t, 38.35, 38.6);
    c01_zero.style.opacity = zS > 0 ? 1 : 0;
    c01_zero.style.transform = `rotate(-8deg) scale(${lerp(2.4, 1, back(zS)) * (1 + 0.05 * c01_settle(t - 38.6, 3, 5))})`;
    if (t > 38.35 && t < 38.7) shakeCam(t, 38.4, 8, 0.3);
    noa.style.transformOrigin = nrot ? "50% 60%" : "50% 100%";
    if (arm !== null) noa.P.ar.setAttribute("transform", `rotate(${arm} 154 117)`);
    glint.setAttribute("opacity", gl); glint.setAttribute("transform", `translate(128 98) scale(${0.3 + 1.1 * gl}) rotate(${t * 200})`);
    // cheek-pouch gag: when the bottle lands in the cart, Noa stuffs his cheeks too
    const pf = t > 21.3 && t < 22.9 ? (1 + 0.25 * c01_settle(t - 21.3, 2.8, 5)) * (1 - seg(t, 22.6, 22.9)) : 0;
    puff.setAttribute("rx", 24 * pf); puff.setAttribute("ry", 18 * pf); puff.setAttribute("opacity", pf ? 1 : 0);
    // party horn: out at 34.0–35.0 with two toots
    const hornOn = t > 33.85 && t < 35.1;
    horn.setAttribute("opacity", hornOn ? 1 : 0);
    const blow = Math.max(seg(t, 34.0, 34.2) - seg(t, 34.35, 34.5), seg(t, 34.55, 34.7) - seg(t, 34.85, 35.0));
    tube.setAttribute("width", 90 * blow); curl.setAttribute("opacity", blow < 0.12 ? 1 : 0);
    toot.style.opacity = blow > 0.5 ? 1 : 0;
    toot.style.transform = `translate(${nx - 150}px, ${ny - 30}px) rotate(-10deg) scale(${0.9 + 0.2 * blow})`;
    sayBubble(bubS, t, 21.4, 22.7, "나도 볼에 담았다!", nx + 70, ny - 80);
    sayBubble(bub, t, 34.5, 35.85, "진짜 페이지야 👀", 1400, 470);
  };
});
})();

// ---- Uchu (co-host): the studio audience of the wheel — O-face on every landing, cheers after ----
(() => {
  let u;
  const BEATS = [13, 18, 23, 28];
  uchuHook((t, s) => {
    if (!u) { u = makeUchu(165); s.root.appendChild(u); }
    const inP = seg(t, 12.3, 12.75), outP = seg(t, 32.3, 32.9);
    let mood = "happy", hop = 0, wave = false, look = -1, arms, talk = false;
    BEATS.forEach(b => {
      if (t >= b - 0.9 && t < b) { mood = "happy"; look = -1; arms = "hips"; }       // drumroll: leaning in
      if (t >= b && t < b + 0.95) { mood = "shock"; }                                  // it LANDS
      if (t >= b + 0.95 && t < b + 1.6) { hop = seg(t, b + 0.95, b + 1.6); wave = true; }
    });
    if (t > 29.6 && t < 31.6) { talk = t > 29.8 && t < 30.6; look = -.6; }
    const x = lerp(1600, 1545, out(inP)) + 260 * ease(outP);
    const y = lerp(1100, 696, back(inP)) - 180 * Math.sin(outP * Math.PI);
    poseUchu(u, t, { x, y, s: 1, mood: outP > 0 ? "shock" : mood, hop: outP > 0 ? 0 : hop, wave, look, arms, talk, op: inP > 0 && outP < 1 ? 1 : 0 });
  });
})();
