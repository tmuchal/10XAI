// ---------------------------------------------------------------- 01 · Who it's for (10–40)
// Beats: 10.4 four cards are dealt from a deck · 13 agency (clapper snaps, cursor books a call)
// · 18 shop (bottle spins, add-to-cart, bottle flies into the cart) · 23 store (search typed,
// pin drops, walking route draws) · 28 influencer (link-in-bio, hearts, follower count ticks)
// Noa hops card to card. · 33 cards scatter, the real page drops in, confetti, Noa blows a
// party horn, then points at it.
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
  const W = 400, H = 540, TOP = 250, cards = [];
  const tag = (txt, bg) => `<div style="position:absolute;left:22px;top:18px;padding:4px 14px 6px;border:3px solid ${INK1};border-radius:10px;background:${bg};font-size:24px;transform:rotate(-2deg)">${txt}</div>`;
  const mk = (i, bg, inner) => {
    const c = el("div", `left:${120 + i * 430}px;top:${TOP}px;width:${W}px;height:${H}px;background:${bg}`, inner, cam); c.className = "card";
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
  const A = mk(0, "#fbe0c0", `${tag("에이전시 · AGENCY", "#f7d774")}
    <div style="position:absolute;left:24px;top:74px;font-size:36px;line-height:1.15">우리가 만든<br>브랜드 필름</div>
    <svg class="clap" viewBox="0 0 110 100" style="position:absolute;right:20px;top:66px;width:96px;height:88px;overflow:visible">
      <rect x="8" y="38" width="94" height="56" rx="6" fill="#fffaf0" stroke="${INK1}" stroke-width="4"/>
      <text x="55" y="76" text-anchor="middle" font-size="22" fill="${INK1}" font-family="GaeguLat">TAKE 1</text>
      <g class="top"><rect x="8" y="20" width="94" height="18" fill="${INK1}" stroke="${INK1}" stroke-width="4"/>
      ${[0, 1, 2, 3].map(i => `<path d="M${16 + i * 22} 22 l12 0 l-8 14 l-12 0z" fill="#fffaf0"/>`).join("")}</g></svg>
    <div class="reel" style="position:absolute;left:0;top:186px;height:176px;width:1600px"></div>
    <div style="position:absolute;left:0;right:0;top:176px;height:6px;background:repeating-linear-gradient(90deg,${INK1} 0 14px,transparent 14px 26px)"></div>
    <div style="position:absolute;left:0;right:0;top:366px;height:6px;background:repeating-linear-gradient(90deg,${INK1} 0 14px,transparent 14px 26px)"></div>
    <div class="bk btn" style="position:absolute;left:24px;bottom:30px;background:#e8894f;color:#fffaf0;border:3px solid ${INK1};font-size:26px">상담 예약 →</div>
    <div class="ok" style="position:absolute;left:24px;right:24px;bottom:96px;padding:8px 0;text-align:center;background:#cfe3c8;border:3px solid ${INK1};border-radius:12px;font-size:24px;opacity:0">📅 금요일 3시 예약 완료 ✓</div>`);
  const reel = A.querySelector(".reel"), reelF = [PAL.dawn, PAL.sea, PAL.gold, PAL.forest, PAL.dawn, PAL.sea].map((p, i) => {
    const w = el("div", `position:absolute;left:${i * 260}px;top:0;width:244px;height:176px;border-radius:10px;overflow:hidden;border:3px solid ${INK1}`, "", reel);
    const f = makeFilm(p); w.appendChild(f); return f; });
  const clapTop = A.querySelector(".clap .top"), aOk = A.querySelector(".ok"), aBk = A.querySelector(".bk");

  // b) shop ---------------------------------------------------------------
  const B = mk(1, "#fff4e2", `${tag("쇼핑몰 · ONLINE STORE", "#f2a7a0")}
    <div class="cartw" style="position:absolute;right:22px;top:14px;width:58px;height:50px">
      <svg viewBox="0 0 58 50" width="58" height="50"><path d="M3 6 H12 L18 34 H48 L54 14 H15" fill="none" stroke="${INK1}" stroke-width="4" stroke-linejoin="round"/><circle cx="22" cy="43" r="5" fill="${INK1}"/><circle cx="44" cy="43" r="5" fill="${INK1}"/></svg>
      <span class="cart" style="position:absolute;right:-12px;top:-10px;width:32px;height:32px;border-radius:50%;background:#c8372d;color:#fff;border:3px solid ${INK1};font-size:22px;display:grid;place-items:center">0</span></div>
    <svg viewBox="0 0 200 260" style="position:absolute;left:100px;top:74px;width:200px;height:260px;overflow:visible">
      <ellipse class="sh" cx="100" cy="250" rx="60" ry="8" fill="rgba(43,35,32,.2)"/>
      <g class="rot"><rect x="78" y="20" width="44" height="40" rx="6" fill="${INK1}"/><rect x="50" y="56" width="100" height="186" rx="30" fill="#e8894f" stroke="${INK1}" stroke-width="5"/>
      <rect x="62" y="118" width="76" height="70" rx="8" fill="#fffaf0" stroke="${INK1}" stroke-width="3"/><text x="100" y="162" text-anchor="middle" font-size="26" fill="${INK1}" font-family="GaeguLat">NOA</text>
      <rect class="shine" x="64" y="66" width="12" height="160" rx="6" fill="rgba(255,255,255,.5)"/></g></svg>
    <div style="position:absolute;left:24px;top:338px"><div style="font-size:32px">노아 선셋 오일</div>
      <div style="font-size:24px;color:#6b5d52;margin-top:2px"><span style="color:#d98c1f">★★★★☆</span> 4.6 · 리뷰 128</div><div style="font-size:30px;margin-top:2px">₩39,000</div></div>
    <div class="btn buy" style="position:absolute;left:24px;right:24px;bottom:24px;background:${INK1};color:#fffaf0;font-size:26px">장바구니 담기</div>
    <svg class="fly" viewBox="0 0 40 60" style="position:absolute;left:0;top:0;width:40px;height:60px;opacity:0"><rect x="14" y="2" width="12" height="10" fill="${INK1}"/><rect x="6" y="10" width="28" height="48" rx="9" fill="#e8894f" stroke="${INK1}" stroke-width="3"/></svg>
    <div class="plus" style="position:absolute;right:30px;top:70px;font-size:34px;color:#c8372d;opacity:0">+1</div>`);
  const bRot = B.querySelector(".rot"), bShine = B.querySelector(".shine"), bBuy = B.querySelector(".buy"), bCart = B.querySelector(".cart"), bFly = B.querySelector(".fly"), bPlus = B.querySelector(".plus"), bCartW = B.querySelector(".cartw");

  // c) offline store ------------------------------------------------------
  const C = mk(2, "#e3f0da", `${tag("매장 · OFFLINE STORE", "#9fd3a8")}
    <div class="srch" style="position:absolute;left:24px;right:24px;top:70px;height:50px;border:3px solid ${INK1};border-radius:999px;background:#fffaf0;display:flex;align-items:center;padding:0 16px;font-size:24px;gap:8px">🔍 <span class="q"></span></div>
    <svg viewBox="0 0 400 250" style="position:absolute;left:0;top:132px;width:400px;height:250px">
      <rect x="0" y="0" width="400" height="250" fill="#d5e8c8"/>
      <path d="M0 70 H400 M0 180 H400 M110 0 V250 M290 0 V250" stroke="#fffaf0" stroke-width="22"/>
      <path d="M0 70 H400 M0 180 H400 M110 0 V250 M290 0 V250" stroke="#b9d3a8" stroke-width="2" stroke-dasharray="8 8"/>
      <rect x="140" y="92" width="120" height="66" rx="6" fill="#bcdcf0" stroke="${INK1}" stroke-width="3"/>
      <g transform="translate(300 88)"><rect x="0" y="12" width="84" height="66" fill="#fffaf0" stroke="${INK1}" stroke-width="3"/>
        ${[0, 1, 2, 3].map(i => `<path d="M${i * 21} 12 h21 v12 q-10.5 9 -21 0Z" fill="${i % 2 ? "#fffaf0" : "#c8372d"}" stroke="${INK1}" stroke-width="2"/>`).join("")}
        <rect class="glow" x="10" y="34" width="34" height="30" fill="#ffd9a8" stroke="${INK1}" stroke-width="2"/><rect x="52" y="34" width="22" height="44" fill="${INK1}"/></g>
      <path class="route" d="M60 210 V180 H290 V120" fill="none" stroke="#c8372d" stroke-width="7" stroke-linecap="round" stroke-dasharray="4 14" stroke-dashoffset="0"/>
      <circle cx="60" cy="214" r="12" fill="#3e8fb8" stroke="${INK1}" stroke-width="4"/>
    </svg>
    <svg class="pin" viewBox="0 0 60 80" style="position:absolute;left:312px;top:150px;width:56px;height:76px;overflow:visible"><path d="M30 78 C30 78 4 44 4 28 A26 26 0 0 1 56 28 C56 44 30 78 30 78Z" fill="#c8372d" stroke="${INK1}" stroke-width="4"/><circle cx="30" cy="28" r="10" fill="#fffaf0" stroke="${INK1}" stroke-width="3"/></svg>
    <div class="walk" style="position:absolute;left:24px;top:392px;font-size:26px;color:#2f5d3a">● 영업 중 · 도보 3분</div>
    <div class="btn go" style="position:absolute;left:24px;right:24px;bottom:24px;background:#f7d774;color:${INK1};border:3px solid ${INK1};font-size:26px">길찾기 · 방문 예약</div>`);
  const cQ = C.querySelector(".q"), cPin = C.querySelector(".pin"), cRoute = C.querySelector(".route"), cGlow = C.querySelector(".glow"), cWalk = C.querySelector(".walk"), cGo = C.querySelector(".go");

  // d) influencer ---------------------------------------------------------
  const D = mk(3, "#fde2ea", `${tag("인플루언서 · CREATOR", "#f7b8cb")}
    <div style="position:absolute;left:0;right:0;top:70px;text-align:center">
      <div style="width:116px;height:116px;border-radius:50%;margin:0 auto;background:conic-gradient(#e8894f,#f7d774,#e0607e,#e8894f);padding:6px;border:3px solid ${INK1}"><div class="avin" style="width:100%;height:100%;border-radius:50%;background:#fde2ea;position:relative;overflow:hidden"></div></div>
      <div style="font-size:30px;margin-top:6px">@noaino</div><div class="fol" style="font-size:24px;color:#6b5d52">팔로워 12.4K</div></div>
    <div class="links" style="position:absolute;left:24px;right:24px;top:292px"></div>`);
  const mini = makeNoa(90); mini.style.left = "4px"; mini.style.top = "6px"; D.querySelector(".avin").appendChild(mini);
  const links = ["🔥 이번 주 공구 오픈", "▶ 신상 리뷰 영상", "📍 팝업 스토어 일정"].map(l => el("div", `height:60px;border-radius:14px;background:#fffaf0;border:3px solid ${INK1};margin-bottom:12px;display:flex;align-items:center;padding:0 18px;font-size:25px;box-shadow:3px 4px 0 rgba(43,35,32,.18)`, l, D.querySelector(".links")));
  const hearts = Array.from({ length: 7 }, (_, i) => el("div", `position:absolute;left:0;top:0;font-size:${26 + (i % 3) * 8}px;opacity:0;z-index:7;color:#e0607e`, "♥", D));
  const dFol = D.querySelector(".fol");

  // reference reveal ------------------------------------------------------
  const ref = refWindow(cam, 150, 150, 1230, 720);
  ref.style.transformOrigin = "50% 0";
  const tada = el("div", `left:96px;top:104px;z-index:12;padding:8px 22px 10px;background:#c8372d;color:#fffaf0;border:4px solid ${INK1};border-radius:14px;font-size:36px;box-shadow:6px 7px 0 rgba(43,35,32,.25);white-space:nowrap;transform-origin:0 50%`, "짠! 제가 만든 페이지", cam); tada.className = "abs";
  const COLS = ["#f7d774", "#e0607e", "#3e8fb8", "#9fd3a8", "#e8894f"];
  const conf = Array.from({ length: 44 }, (_, i) => { const d = el("div", `left:0;top:0;width:${12 + c01_rnd(i) * 10}px;height:${8 + c01_rnd(i + 50) * 10}px;background:${COLS[i % 5]};border:2px solid ${INK1};border-radius:2px;z-index:15;opacity:0`, "", cam); d.className = "abs"; return d; });
  const toot = el("div", `left:0;top:0;z-index:16;font-size:40px;color:#c8372d;opacity:0;white-space:nowrap`, "뿌우~!", cam); toot.className = "abs";

  const noa = makeNoa(140); cam.appendChild(noa);
  // party horn prop living inside Noa's body group
  const horn = document.createElementNS("http://www.w3.org/2000/svg", "g");
  horn.innerHTML = `<path d="M100 126 L136 114 L136 138 Z" fill="#3e8fb8" stroke="${INK1}" stroke-width="4" stroke-linejoin="round"/>
    <rect class="tube" x="134" y="119" width="0" height="14" rx="4" fill="#f7d774" stroke="${INK1}" stroke-width="3.5"/>
    <circle class="curl" cx="142" cy="126" r="9" fill="none" stroke="#e0607e" stroke-width="6"/>`;
  noa.P.b.appendChild(horn);
  const tube = horn.querySelector(".tube"), curl = horn.querySelector(".curl");
  const bub = makeBubble(cam); bub.style.whiteSpace = "normal"; bub.style.width = "330px"; bub.style.textAlign = "center";
  const bubS = makeBubble(cam);

  const cardX = i => 120 + i * 430;
  return t => {
    head.style.opacity = seg(t, 10.2, 10.6) * (1 - seg(t, 12.5, 12.9));
    head.style.transform = `rotate(-1.5deg) translateY(${-30 * seg(t, 12.5, 12.9)}px)`;
    const active = t < 13 ? -1 : t < 33 ? Math.floor((t - 13) / 5) : 4;
    const gone = t > 32.5;
    // gentle camera pan toward the active card
    const panTo = active >= 0 && active < 4 ? (1.5 - active) * 36 : 0;
    const panPrev = active > 0 && active < 4 ? (1.5 - (active - 1)) * 36 : 0;
    const pan = active < 0 ? 0 : lerp(active === 0 ? 0 : panPrev, panTo, ease(seg((t - 13) % 5, 0, 0.8)));
    cards.forEach((c, i) => {
      // dealt from a deck in the bottom centre
      const dl = seg(t, 10.4 + i * 0.22, 11.05 + i * 0.22), d = back(dl);
      const on = active === i;
      const sinceOn = on ? t - (13 + i * 5) : 99;
      const lift = on ? back(seg(sinceOn, 0, 0.5)) : active >= 0 && active < 4 && active === i + 1 ? 1 - ease(seg(t - (13 + (i + 1) * 5), 0, 0.4)) : 0;
      const sc = active >= 0 && active < 4 ? lerp(0.95, 1.1, lift) : 1;
      const wob = 2.5 * c01_settle(t - 11.05 - i * 0.22, 1.4, 3.5);
      // exit: scatter away
      const ex = seg(t, 32.5 + i * 0.07, 33.2 + i * 0.07), exE = ex * ex;
      const dx = lerp(960 - 200 - cardX(i), 0, d) + pan + (i - 1.5) * 260 * exE;
      const dy = lerp(420, 0, d) - 24 * lift + 900 * exE;
      const rot = lerp((i - 1.5) * 18, 0, d) + wob + (i - 1.5) * 30 * exE + (on ? -1.2 : 0);
      c.style.opacity = dl > 0 ? 1 : 0;
      c.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${sc})`;
      c.style.filter = active >= 0 && active < 4 && !on ? "saturate(.55) brightness(1.03)" : "none";
      c.style.boxShadow = on ? `0 0 0 5px #f7d774, 12px 14px 0 rgba(43,35,32,.25)` : "";
      c.style.zIndex = on ? 3 : 1;
      c.style.display = gone && ex >= 1 ? "none" : "block";
    });

    // agency: reel rolls, clapper snaps at each "take", cursor books a call
    reelF.forEach((f, i) => f.update(t + i * 2, .8)); reel.style.transform = `translateX(${-((t * 60) % 520)}px)`;
    const snap = Math.max(seg(t, 13.3, 13.45) - seg(t, 13.5, 13.9), seg(t, 15.2, 15.35) - seg(t, 15.4, 15.8));
    clapTop.setAttribute("transform", `rotate(${-28 * (1 - snap) * (t > 13 && t < 17 ? 1 : 0.4)} 8 38)`);
    const pa = click(A, t, 15.6, 340, 300, 140, 480);
    aBk.style.transform = `scale(${1 - 0.08 * pa})`;
    const okP = back(seg(t, 16.55, 16.9));
    aOk.style.opacity = seg(t, 16.55, 16.65); aOk.style.transform = `scale(${okP}) rotate(${-2 * okP}deg)`;

    // shop: bottle turntable, add to cart, bottle arcs into the cart
    const rot = Math.cos(t * 1.6), spin = t > 18 && t < 23 ? 1 : 0.4;
    bRot.setAttribute("transform", `translate(100 0) scale(${1 - (1 - Math.abs(rot)) * 0.45 * spin} 1) translate(-100 0)`);
    bShine.setAttribute("x", rot < 0 ? 124 : 64);
    const pb = click(B, t, 19.5, 330, 200, 190, 470);
    bBuy.style.transform = `scale(${1 - 0.08 * pb})`;
    bBuy.textContent = t > 20.45 && t < 23 ? "담았어요 ✓" : "장바구니 담기";
    bBuy.style.background = t > 20.45 && t < 23 ? "#2f7d4f" : INK1;
    const fl = seg(t, 20.45, 21.1);
    bFly.style.opacity = fl > 0 && fl < 1 ? 1 : 0;
    bFly.style.transform = `translate(${lerp(180, 330, fl)}px, ${lerp(170, 20, fl) - 160 * Math.sin(fl * Math.PI)}px) rotate(${fl * 540}deg) scale(${1 - 0.5 * fl})`;
    const hit = t > 21.1 ? c01_settle(t - 21.1, 2.5, 5) : 0;
    bCart.textContent = t > 21.1 ? "1" : "0";
    bCart.style.transform = `scale(${1 + 0.6 * Math.abs(hit)})`;
    bCartW.style.transform = `rotate(${10 * hit}deg)`;
    const pl = seg(t, 21.1, 21.9);
    bPlus.style.opacity = pl > 0 && pl < 1 ? 1 - pl * pl : 0; bPlus.style.transform = `translateY(${-40 * out(pl)}px)`;

    // store: search typed, pin drops and bounces, route draws, glow in the window
    cQ.textContent = type("성수 쇼룸 근처", seg(t, 23.3, 24.4)) + (t > 23 && t < 24.6 && Math.floor(t * 4) % 2 ? "|" : "");
    const pinDrop = seg(t, 24.5, 24.85);
    const pinB = t > 24.85 ? Math.abs(c01_settle(t - 24.85, 1.8, 4)) * 40 : 0;
    cPin.style.transform = `translateY(${-260 * (1 - pinDrop * pinDrop) - pinB - (t > 26 ? Math.abs(Math.sin(t * 3)) * 10 : 0)}px)`;
    cPin.style.opacity = t < 23 ? 1 : seg(t, 24.5, 24.55);
    const rt = seg(t, 25.1, 26.4);
    cRoute.setAttribute("stroke-dasharray", `4 14`);
    cRoute.style.clipPath = `inset(0 ${100 - 100 * rt}% 0 0)`;
    cRoute.setAttribute("stroke-dashoffset", -t * 30);
    cGlow.setAttribute("fill", t > 25 && Math.floor(t * 3) % 2 ? "#ffe9a8" : "#ffd9a8");
    cWalk.style.transform = `scale(${1 + 0.12 * Math.abs(c01_settle(t - 26.4, 2, 5))})`;
    const pc = click(C, t, 26.6, 330, 250, 190, 490);
    cGo.style.transform = `scale(${1 - 0.08 * pc})`;

    // influencer: links pop, hearts float, followers tick up
    poseNoa(mini, t, { x: 0, y: 0, s: 1, wave: t > 28 && t < 31, talk: t > 29 && t < 30 });
    dFol.textContent = "팔로워 " + (12.4 + 0.6 * ease(seg(t, 28.6, 32.4))).toFixed(1) + "K";
    links.forEach((l, i) => {
      const p = back(seg(t, 28.3 + i * 0.3, 28.8 + i * 0.3));
      l.style.transform = t < 26 ? "none" : `translateX(${-60 * (1 - p)}px) scale(${0.6 + 0.4 * p})`;
      l.style.opacity = t < 26 ? 1 : clamp(p * 2);
    });
    const pd = click(D, t, 30.2, 320, 460, 200, 320);
    links[0].style.background = t > 31.1 && t < 33 ? "#f7d774" : "#fffaf0";
    if (pd) links[0].style.transform = `scale(${1 - 0.06 * pd})`;
    hearts.forEach((h, i) => {
      const a = 28.8 + i * 0.5, p = seg(t, a, a + 1.8);
      h.style.opacity = p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0;
      h.style.transform = `translate(${240 + 60 * c01_rnd(i) + 18 * Math.sin(p * 9 + i)}px, ${190 - 170 * p}px) scale(${0.7 + 0.5 * p})`;
    });

    // ---- reference reveal ----
    const rIn = seg(t, 33.1, 33.9);
    const rY = t < 33.9 ? lerp(-900, 0, rIn * rIn) : -26 * Math.abs(c01_settle(t - 33.9, 1.6, 4)) * 1;
    const rRot = t < 33.9 ? -4 * (1 - rIn) : 2.5 * c01_settle(t - 33.9, 1.3, 3);
    ref.style.opacity = t > 33.05 ? 1 : 0;
    ref.style.transform = `translateY(${rY}px) rotate(${rRot}deg) scale(${1 + 0.015 * ease(seg(t, 34, 40))})`;
    ref.scrollTo(0.55 * ease(seg(t, 34.8, 39.6)), t);
    const tdP = back(seg(t, 34.0, 34.35));
    tada.style.opacity = seg(t, 34.0, 34.05);
    tada.style.transform = `rotate(${-6 + 2 * Math.sin(t * 3)}deg) scale(${1.8 - 0.8 * tdP})`;
    conf.forEach((d, i) => {
      const side = i % 2, dt = t - 33.95 - (i % 6) * 0.03;
      if (dt < 0 || dt > 3) { d.style.opacity = 0; return; }
      const a = side ? -Math.PI * (0.62 + 0.3 * c01_rnd(i + 7)) : -Math.PI * (0.08 + 0.3 * c01_rnd(i + 7));
      const v = 700 + 700 * c01_rnd(i + 3), k = (1 - Math.exp(-2.2 * dt)) / 2.2;
      const x = (side ? 1370 : 160) + Math.cos(a) * v * k + 14 * Math.sin(dt * 7 + i);
      const y = 180 + Math.sin(a) * v * k + 170 * dt * dt;
      d.style.opacity = 1 - seg(dt, 2.3, 3);
      d.style.transform = `translate(${x}px, ${y}px) rotate(${dt * (300 + 500 * c01_rnd(i))}deg) scaleX(${Math.cos(dt * 8 + i)})`;
    });

    // ---- Noa ----
    let nx, ny, hop = 0, mood = "happy", wave = false, talk = false, look = 0, flip = false, arm = null, sq = 0;
    const perch = i => ({ x: cardX(i) + 130 + (1.5 - i) * 36, y: TOP - 24 - 154 - 20 });
    if (t < 13) {
      // bounces in from the left onto the agency card
      const p = seg(t, 12.0, 12.9); const P = perch(0);
      nx = lerp(-150, P.x, p); ny = P.y - 220 * Math.sin(p * Math.PI) + 200 * (1 - p) * 0; hop = p > 0 && p < 1 ? 0.5 : 0;
    } else if (t < 33) {
      const i = active, loc = t - 13 - i * 5, P = perch(i), Q = i > 0 ? perch(i - 1) : P;
      const j = seg(loc, 0.12, 0.62); // hop from the previous card
      nx = lerp(Q.x, P.x, ease(j)); ny = lerp(Q.y, P.y, j) - (i > 0 ? 150 * Math.sin(j * Math.PI) : 0);
      sq = i > 0 ? (seg(loc, 0, 0.12) - seg(loc, 0.12, 0.2)) * 0.18 + 0.12 * c01_settle(loc - 0.62, 2.6, 6) : 0.12 * c01_settle(loc, 2.6, 6);
      look = [0.3, 0.3, 0.6, 0.2][i]; mood = "happy";
      if (i === 0) { wave = loc > 2.4 && loc < 3.6; }
      if (i === 1) { if (loc > 3.1 && loc < 3.8) { hop = seg(loc, 3.1, 3.8); } wave = loc > 3.1 && loc < 4.2; }
      if (i === 2) { mood = loc > 1.5 && loc < 2.0 ? "shock" : "happy"; }
      if (i === 3) { talk = loc > 1 && loc < 2.2; wave = loc > 2.5; }
      if (loc > 4.6) { sq = 0.1 * Math.sin(seg(loc, 4.6, 5) * Math.PI); }
    } else {
      // leaps down to the right of the page, blows the horn, then points at the page
      const p = seg(t, 33.1, 33.8), P = perch(3);
      nx = lerp(P.x, 1470, ease(p)); ny = lerp(P.y, 714, p) - 200 * Math.sin(p * Math.PI);
      sq = t > 33.8 ? 0.15 * c01_settle(t - 33.8, 2.5, 5) : 0; look = -1; flip = true;
      mood = t > 33.3 && t < 33.8 ? "shock" : "happy";
      if (t > 35.2) { arm = -18 + 6 * Math.sin(t * 5); talk = t > 35.4 && t < 38; }
    }
    poseNoa(noa, t, { x: nx, y: ny, s: 1, hop, mood, wave, talk, look, flip, op: seg(t, 12.0, 12.1) });
    noa.style.transform += ` scale(${1 + sq}, ${1 - sq})`;
    if (arm !== null) noa.P.ar.setAttribute("transform", `rotate(${arm} 154 118)`);
    // party horn: out at 34.0–35.0 with two toots
    const hornOn = t > 33.85 && t < 35.1;
    horn.setAttribute("opacity", hornOn ? 1 : 0);
    const blow = Math.max(seg(t, 34.0, 34.2) - seg(t, 34.35, 34.5), seg(t, 34.55, 34.7) - seg(t, 34.85, 35.0));
    tube.setAttribute("width", 90 * blow); curl.setAttribute("opacity", blow < 0.12 ? 1 : 0);
    toot.style.opacity = blow > 0.5 ? 1 : 0;
    toot.style.transform = `translate(${nx - 150}px, ${ny - 30}px) rotate(-10deg) scale(${0.9 + 0.2 * blow})`;
    sayBubble(bubS, t, 21.2, 22.6, "담았다!", nx + 40, ny - 70);
    sayBubble(bub, t, 35.3, 39.6, "이게 실제로 만든 페이지야 👀", 1420, 470);
  };
});
})();
