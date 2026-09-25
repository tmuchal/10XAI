// ---------------------------------------------------------------- 01 · Who it's for (10–40)
scene(10, 40, (R, s) => {
  s.caps = [[10.2, "이 몰입형 페이지, 업종을 가리지 않습니다", "Immersive pages work for any kind of business"],
            [13, "에이전시 — 포트폴리오가 곧 쇼릴", "Agency: the portfolio becomes a showreel"],
            [18, "온라인 쇼핑몰 — 제품이 화면 안에서 움직인다", "Online store: products move on screen"],
            [23, "오프라인 매장 — 검색에서 방문까지 한 번에", "Offline store: from search to a visit"],
            [28, "인플루언서 — 링크 하나가 나만의 매장", "Influencer: one link becomes your own shop"],
            [33, "그리고 이게, 제가 실제로 만든 페이지", "And this is the page I actually built"]];
  const head = chapter(R, "CHAPTER 01", "누구를 위한 페이지인가");
  const W = 400, H = 540, cards = [];
  const mk = (i, bg, inner) => { const c = el("div", `left:${120 + i * 430}px;top:230px;width:${W}px;height:${H}px;background:${bg}`, inner, R); c.className = "card"; cards.push(c); return c; };
  // a) agency
  const A = mk(0, "#fbe0c0", `<div style="padding:26px 26px 0"><div style="font-size:15px;letter-spacing:4px;color:var(--gold)">AGENCY</div>
    <div class="serif" style="font-size:34px;font-weight:700;margin-top:8px">우리가 만든<br>브랜드 필름</div></div>
    <div class="reel" style="position:absolute;left:0;top:170px;height:190px;width:1600px"></div>
    <div style="position:absolute;left:26px;bottom:34px" class="btn" data-b>상담 예약 →</div>
    <div style="position:absolute;right:26px;bottom:44px;font-size:16px;color:var(--muted)">SHOWREEL 2026</div>`);
  A.querySelector("[data-b]").style.cssText += ";background:var(--gold);color:#1a1406";
  const reel = A.querySelector(".reel"), reelF = [PAL.dawn, PAL.night, PAL.gold, PAL.sea, PAL.dawn, PAL.night].map((p, i) => {
    const w = el("div", `position:absolute;left:${i * 260}px;top:0;width:244px;height:190px;border-radius:12px;overflow:hidden;border:3px solid #2b2320`, "", reel);
    const f = makeFilm(p); w.appendChild(f); return f; });
  // b) shop
  const B = mk(1, "#f2ebe0", `<div style="padding:26px;color:var(--ink)"><div style="font-size:15px;letter-spacing:4px;color:var(--terra)">ONLINE STORE</div>
    <div style="position:absolute;right:26px;top:22px;font-size:30px">🛒<span class="cart" style="position:absolute;right:-10px;top:-6px;width:26px;height:26px;border-radius:50%;background:var(--terra);color:#fff;font-size:15px;display:grid;place-items:center;font-weight:800">0</span></div></div>
    <svg class="bottle" viewBox="0 0 200 260" style="position:absolute;left:100px;top:80px;width:200px;height:260px">
      <ellipse cx="100" cy="248" rx="60" ry="8" fill="rgba(0,0,0,.15)"/>
      <g class="rot"><rect x="78" y="20" width="44" height="40" rx="6" fill="#17140f"/><rect x="50" y="56" width="100" height="186" rx="30" fill="#d4623a"/>
      <rect x="62" y="118" width="76" height="70" rx="8" fill="#f2ebe0"/><text x="100" y="160" text-anchor="middle" font-size="18" font-weight="800" fill="#17140f" font-family="serif">NOA</text>
      <rect class="shine" x="64" y="66" width="12" height="160" rx="6" fill="rgba(255,255,255,.35)"/></g></svg>
    <div style="position:absolute;left:26px;top:360px;color:var(--ink)"><div class="serif" style="font-size:28px;font-weight:700">노아 선셋 오일</div>
      <div style="font-size:17px;color:#6b6358;margin-top:4px">★★★★☆ 4.6 · 리뷰 128</div><div style="font-size:26px;font-weight:800;margin-top:6px">₩39,000</div></div>
    <div class="btn buy" style="position:absolute;left:26px;right:26px;bottom:26px;background:var(--ink);color:#fff">장바구니 담기</div>`);
  // c) store
  const C = mk(2, "#cfe3c8", `<div style="padding:26px"><div style="font-size:15px;letter-spacing:4px;color:var(--gold)">OFFLINE STORE</div>
    <div class="serif" style="font-size:32px;font-weight:700;margin-top:8px">성수 쇼룸</div></div>
    <svg viewBox="0 0 400 260" style="position:absolute;left:0;top:120px;width:400px;height:260px">
      <rect x="60" y="70" width="280" height="180" fill="#f2ebe0"/><rect x="60" y="40" width="280" height="36" fill="#17140f"/>
      <text x="200" y="65" text-anchor="middle" font-size="20" fill="#c8a266" font-family="serif" letter-spacing="4">NOAINO</text>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${60 + i * 40} 76 h40 v26 q-20 14 -40 0Z" fill="${i % 2 ? "#f2ebe0" : "#d4623a"}"/>`).join("")}
      <rect class="glow" x="90" y="130" width="120" height="100" rx="6" fill="#ffd9a8"/><rect x="236" y="130" width="74" height="120" rx="4" fill="#17140f"/></svg>
    <svg class="pin" viewBox="0 0 60 80" style="position:absolute;left:300px;top:96px;width:60px;height:80px"><path d="M30 78 C30 78 4 44 4 28 A26 26 0 0 1 56 28 C56 44 30 78 30 78Z" fill="#d4623a"/><circle cx="30" cy="28" r="10" fill="#fff"/></svg>
    <div style="position:absolute;left:26px;top:396px;font-size:20px;color:#2f5d3a">● 영업 중 · 도보 3분</div>
    <div class="btn" style="position:absolute;left:26px;right:26px;bottom:26px;background:var(--gold);color:#1a1406">길찾기 · 방문 예약</div>`);
  // d) influencer
  const D = mk(3, "#f8d3df", `<div style="padding:26px;text-align:center"><div style="font-size:15px;letter-spacing:4px;color:var(--pink)">INFLUENCER</div>
    <div class="av" style="width:110px;height:110px;border-radius:50%;margin:18px auto 0;background:conic-gradient(var(--terra),var(--gold),var(--pink),var(--terra));padding:5px"><div class="avin" style="width:100%;height:100%;border-radius:50%;background:#f8d3df;position:relative;overflow:hidden"></div></div>
    <div style="font-size:24px;font-weight:800;margin-top:12px">@noaino</div><div class="fol" style="font-size:17px;color:var(--muted)">팔로워 12.4K</div></div>
    <div class="links" style="position:absolute;left:26px;right:26px;top:290px"></div>`);
  const mini = makeNoa(100); mini.style.left = "0"; mini.style.top = "0"; D.querySelector(".avin").appendChild(mini);
  const links = ["🔥 이번 주 공구 오픈", "▶ 신상 리뷰 영상", "📍 팝업 스토어 일정"].map(l => el("div", "height:56px;border-radius:14px;background:#fffaf0;border:3px solid #2b2320;margin-bottom:12px;display:flex;align-items:center;padding:0 18px;font-size:19px;font-weight:700", l, D.querySelector(".links")));
  const ref = refWindow(R, 260, 170, 1400, 700);
  const noa = makeNoa(150); R.appendChild(noa);
  const bub = makeBubble(R);
  return t => {
    head.style.opacity = seg(t, 10, 10.6) * (1 - seg(t, 32.6, 33));
    const active = t < 13 ? -1 : t < 33 ? Math.floor((t - 13) / 5) : 4;
    cards.forEach((c, i) => {
      const inn = back(seg(t, 10.4 + i * .2, 11 + i * .2));
      const on = active === i, gone = seg(t, 32.6, 33.2);
      c.style.opacity = clamp(inn) * (active >= 0 && !on ? .45 : 1) * (1 - gone);
      c.style.transform = `translateY(${(1 - inn) * 60 - (on ? 16 : 0)}px) scale(${on ? 1.06 : 1})`;
      c.style.boxShadow = on ? "0 0 0 3px var(--gold), 0 30px 80px rgba(0,0,0,.6)" : "none";
      c.style.zIndex = on ? 2 : 1;
    });
    reelF.forEach((f, i) => f.update(t + i * 2, .8)); reel.style.transform = `translateX(${-((t * 50) % 520)}px)`;
    const rot = Math.cos(t * 1.4);
    B.querySelector(".rot").setAttribute("transform", `translate(100 0) scale(${0.55 + 0.45 * Math.abs(rot)} 1) translate(-100 0)`);
    B.querySelector(".shine").setAttribute("x", 64 + 60 * (rot < 0 ? 1 : 0));
    const press = seg(t, 20.2, 20.4) - seg(t, 20.4, 20.6);
    B.querySelector(".buy").style.transform = `scale(${1 - .06 * press})`;
    B.querySelector(".buy").textContent = t > 20.5 && t < 23 ? "담았어요 ✓" : "장바구니 담기";
    B.querySelector(".cart").textContent = t > 20.5 ? "1" : "0";
    B.querySelector(".cart").style.transform = `scale(${1 + .5 * (seg(t, 20.5, 20.7) - seg(t, 20.7, 21))})`;
    C.querySelector(".pin").style.transform = `translateY(${-Math.abs(Math.sin(t * 3)) * 22}px)`;
    C.querySelector(".glow").setAttribute("opacity", .75 + .25 * Math.sin(t * 5));
    poseNoa(mini, t, { x: 5, y: 10, s: 1 });
    D.querySelector(".fol").textContent = "팔로워 " + (12.4 + 0.5 * seg(t, 28, 32)).toFixed(1) + "K";
    links.forEach((l, i) => pop(l, t, 28.4 + i * .4, .5, 18));
    // reference
    const r = out(seg(t, 33, 33.8));
    ref.style.opacity = r; ref.style.transform = `scale(${0.9 + 0.1 * r})`;
    ref.scrollTo(0.5 * ease(seg(t, 34, 39.5)), t);
    // Noa hops card to card, then points at the reference
    const idx = clamp(active, 0, 3), hopP = active >= 0 && active < 4 ? seg((t - 13) % 5, 0, .5) : 0;
    const tx = active < 0 ? 900 : active < 4 ? 120 + idx * 430 + 125 : 1640;
    poseNoa(noa, t, { x: tx, y: active < 4 ? 70 : 720, s: .9, hop: hopP, talk: t > 34 && t < 36.5, look: active >= 4 ? -1 : 0, wave: t > 34 && t < 36, op: seg(t, 12.6, 13) });
    sayBubble(bub, t, 34, 39.6, "이게 실제로 만든 페이지야 👀", 1300, 660);
  };
});

