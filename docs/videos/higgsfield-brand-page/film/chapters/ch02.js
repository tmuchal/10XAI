// ---------------------------------------------------------------- 02 · The flow (40–72)
scene(40, 72, (R, s) => {
  s.caps = [[40.2, "흐름의 핵심: 주인공은 브랜드가 아니라 고객", "The customer is the hero, not the brand"],
            [46, "고객의 문제 → 길잡이인 우리 → 3단계 계획 → 분명한 버튼", "Problem → you as the guide → a 3-step plan → a clear button"],
            [53, "스크롤이 곧 장면 전환: 인터랙티브 비주얼은 체류시간을 늘린다", "Scroll as scene change: interactive visuals raise dwell time"],
            [60, "제 페이지에 흐름을 대입하면", "Mapped onto my page"]];
  s.cite = [[40, "StoryBrand SB7 · Donald Miller"], [53, "Infogram × DC Thomson, 2015 (인용)"]];
  chapter(R, "CHAPTER 02", "전체 흐름 잡기");
  const NODES = [["주인공", "고객", "Hero · 고객"], ["문제", "무엇이 불편한가", "Problem"], ["가이드", "우리 = 길잡이", "Guide"], ["계획", "1 · 2 · 3 단계", "Plan"], ["행동", "분명한 버튼", "Call to action"], ["성공", "달라진 모습", "Success"]];
  const svg = el("div", "left:96px;top:190px;width:780px;height:640px", "", R); svg.className = "abs";
  svg.innerHTML = `<svg width="780" height="640"><path class="arc" d="M60 560 C 200 520, 200 360, 330 330 S 520 120, 720 80" stroke="#c8a266" stroke-width="5" fill="none" stroke-dasharray="1200" stroke-dashoffset="1200" stroke-linecap="round"/></svg>`;
  const pts = [[60, 560], [190, 450], [330, 330], [470, 240], [600, 140], [720, 80]];
  const nodes = NODES.map((n, i) => { const d = el("div", `left:${96 + pts[i][0] - 18}px;top:${190 + pts[i][1] - 18}px`, `
    <div style="width:36px;height:36px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 8px rgba(200,162,102,.18)"></div>
    <div style="position:absolute;left:48px;top:-8px;white-space:nowrap"><div style="font-size:28px;font-weight:800">${n[0]}</div><div style="font-size:18px;color:var(--muted)">${n[1]}</div></div>`, R); d.className = "abs"; return d; });
  const wire = el("div", "left:1000px;top:190px;width:820px;height:640px;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:26px", "", R); wire.className = "abs";
  const secs = [["HERO", "고객이 원하는 결과를 한 줄로", 120], ["PROBLEM", "지금 무엇이 불편한가", 70], ["GUIDE", "공감 + 권위: 후기 · 숫자 · 로고", 90], ["PLAN", "1 상담 → 2 제작 → 3 오픈", 80], ["CTA", "상담 예약 / 장바구니 / 길찾기", 70], ["SUCCESS", "달라진 모습 · 사례", 80]];
  const rows = secs.map(sx => el("div", `height:${sx[2]}px;border-radius:12px;background:#f1e4c8;margin-bottom:10px;display:flex;align-items:center;gap:18px;padding:0 20px`,
    `<b style="font-size:17px;letter-spacing:3px;color:var(--gold);width:110px">${sx[0]}</b><span style="font-size:21px">${sx[1]}</span>`, wire));
  const stat = el("div", "left:96px;top:180px;display:flex;gap:60px;z-index:3", `<div><div class="stat">+62%</div><div style="font-size:20px;color:#6b5d52;margin-top:6px">평균 체류시간</div></div>
    <div><div class="stat">+317%</div><div style="font-size:20px;color:#6b5d52;margin-top:6px">스크롤 깊이</div></div>`, R); stat.className = "abs";
  const ref = refWindow(R, 1000, 150, 820, 720);
  const marks = REF_MARKS.map(m => { const d = el("div", "left:1020px;z-index:6", m[1], R); d.className = "reftag abs"; d.style.background = "var(--terra)"; d.style.color = "#fff"; return d; });
  const noa = makeNoa(150); R.appendChild(noa);
  const bub = makeBubble(R);
  return t => {
    const arc = svg.querySelector(".arc");
    arc.setAttribute("stroke-dashoffset", 1200 * (1 - ease(seg(t, 41, 51))));
    const act = Math.floor(clamp((t - 41) / 1.7, 0, 5.99));
    nodes.forEach((n, i) => { const p = pop(n, t, 41 + i * 1.7, .5, 14); n.style.opacity = p * (i === act || t > 51.5 ? 1 : .5); });
    rows.forEach((r, i) => {
      const lit = t > 41 + i * 1.7 && (i === act || t > 51.5);
      r.style.background = lit ? "#f7d774" : "#f1e4c8";
      r.style.boxShadow = i === act && t < 51.5 ? "0 0 0 2px var(--gold)" : "none";
    });
    wire.style.opacity = seg(t, 40.5, 41.2) * (1 - seg(t, 59.5, 60));
    stat.style.opacity = seg(t, 53, 53.6) * (1 - seg(t, 59.5, 60)); stat.style.transform = `translateY(${20 * (1 - seg(t, 53, 53.6))}px)`;
    svg.style.opacity = nodes[0].parentNode ? 1 - .6 * seg(t, 53, 53.5) : 1;
    // reference with section marks
    const r = out(seg(t, 60, 60.8));
    ref.style.opacity = r; ref.style.transform = `translateX(${60 * (1 - r)}px)`;
    const f = ease(seg(t, 61, 71));
    ref.scrollTo(f, t);
    marks.forEach((m, i) => {
      const at = REF_MARKS[i][0], vis = r * clamp(1 - Math.abs(f - at) * 4.5);
      m.style.opacity = vis; m.style.top = (230 + 200 * clamp((at - f) * 3 + .5, 0, 1)) + "px";
    });
    // Noa sits on the first node and pouts: the hero isn't him
    poseNoa(noa, t, { x: 110, y: 520, s: .75, mood: t > 42.5 && t < 46 ? "pout" : "happy", talk: t > 42.5 && t < 45.5, look: 1, op: seg(t, 41.4, 41.8) * (1 - seg(t, 59.5, 60)) });
    sayBubble(bub, t, 42.5, 46, "주인공은 내가 아니라… 손님이래 😤", 150, 470);
  };
});

