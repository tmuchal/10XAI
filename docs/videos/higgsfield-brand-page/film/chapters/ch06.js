// ---------------------------------------------------------------- 06 · Money (160–184)
scene(160, 184, (R, s) => {
  s.caps = [[160.2, "결국 목표는 하나: 행동, 그리고 매출", "In the end: action, then revenue"],
            [167, "방문자 × 전환율 × 객단가 = 매출", "Visitors × conversion rate × order value = revenue"],
            [173, "업종마다 버튼 하나를 분명하게, 망설이는 사람에겐 보조 CTA", "One clear button per business, plus a softer option"],
            [178, "제 페이지의 마지막 장면도 결국 '행동'", "My page also ends on the action"]];
  s.cite = [[167, "예시 수치 · illustrative numbers"]];
  chapter(R, "CHAPTER 06", "결국, 비즈니스(매출)로");
  const F = [["방문", "Visit", 900], ["몰입", "Stay", 760], ["신뢰", "Trust", 620], ["행동", "Act", 480], ["매출", "Revenue", 340]];
  const fun = el("div", "left:150px;top:190px;width:900px;height:620px", "", R); fun.className = "abs";
  const layers = F.map((f, i) => el("div", `position:absolute;left:${(900 - f[2]) / 2}px;top:${i * 104}px;width:${f[2]}px;height:92px;border-radius:14px;background:${["#fdf0d5", "#f7dfae", "#f2c77f", "#eaa65a", "#e07b39"][i]};display:flex;align-items:center;justify-content:center;gap:14px;${i === 4 ? "color:#1a1406" : ""}`,
    `<span style="font-size:32px;font-weight:900">${f[0]}</span><span style="font-size:18px;opacity:.7">${f[1]}</span>`, fun));
  const dots = Array.from({ length: 40 }, (_, i) => el("div", "position:absolute;width:14px;height:14px;border-radius:50%;background:#6b5d52;opacity:0", "", fun));
  const coins = Array.from({ length: 8 }, () => el("div", "position:absolute;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffe7a8,#c8a266 60%,#8a6a2e);border:2px solid #8a6a2e;opacity:0;z-index:3", "", R));
  const catcher = makeNoa(150); R.appendChild(catcher);
  const form = el("div", "left:1110px;top:200px;width:720px", "", R); form.className = "abs";
  form.innerHTML = `<div style="font-size:18px;letter-spacing:4px;color:var(--gold)">REVENUE · 예시</div>
    <div style="font-size:26px;line-height:2;margin-top:10px;white-space:nowrap">
      방문자 <b class="mono">3,000</b> × 전환율 <b class="mono cr" style="color:var(--gold)">1.5%</b> × 객단가 <b class="mono">60,000원</b></div>
    <div class="rev mono" style="font-size:66px;font-weight:900;margin-top:10px">= 2,700,000원</div>
    <div class="up" style="font-size:22px;color:#27c26a;margin-top:10px;opacity:0">몰입 + 신뢰로 전환율 1.5% → 2.5%</div>`;
  const ctas = el("div", "left:1110px;top:560px;width:720px;display:grid;grid-template-columns:1fr 1fr;gap:14px", "", R); ctas.className = "abs";
  const CT = [["에이전시", "상담 예약"], ["쇼핑몰", "장바구니"], ["오프라인 매장", "길찾기 · 예약"], ["인플루언서", "공구 링크"]].map(c => el("div", "padding:16px 20px;border-radius:14px;background:var(--panel);border:1px solid var(--line)", `<div style="font-size:17px;color:var(--muted)">${c[0]}</div><div style="font-size:26px;font-weight:800;color:var(--gold)">${c[1]} →</div>`, ctas));
  const soft = el("div", "left:1110px;top:800px;font-size:20px;color:#6b5d52", "보조 CTA · 카탈로그 받기 / 쿠폰 / 뉴스레터", R); soft.className = "abs";
  const ref = refWindow(R, 300, 180, 1320, 690);
  const noa = makeNoa(150); R.appendChild(noa); const bub = makeBubble(R);
  return t => {
    const M = seg(t, 160.2, 160.8) * (1 - seg(t, 177.4, 178));
    fun.style.opacity = M; form.style.opacity = seg(t, 167, 167.6) * M; ctas.style.opacity = M; soft.style.opacity = M;
    layers.forEach((l, i) => pop(l, t, 160.4 + i * .3, .5, 20));
    dots.forEach((d, i) => {
      const life = ((t - 161.5 - i * .17) % 4 + 4) % 4, alive = t > 161.5 + i * .17;
      const depth = Math.min(4, Math.floor(life / .8)), keep = [1, .75, .55, .3, .15][depth] > ((i * 37) % 100) / 100;
      const x = 450 + ((i * 53) % 13 - 6) * (F[depth][2] / 30), y = 40 + life * 104 / .8;
      d.style.left = x + "px"; d.style.top = Math.min(y, 470) + "px";
      d.style.opacity = alive && keep && life < 3.8 ? M * .9 : 0;
    });
    coins.forEach((c, i) => {
      const life = ((t - 163 - i * .5) % 4 + 4) % 4, alive = t > 163 + i * .5 && t < 177;
      c.style.left = (590 + ((i * 41) % 60) - 30) + "px"; c.style.top = (720 + life * 60) + "px";
      c.style.opacity = alive && life < 1.4 ? M : 0; c.style.transform = `rotateY(${t * 400}deg)`;
    });
    poseNoa(catcher, t, { x: 520 + 40 * Math.sin(t * 2.2), y: 700, s: .8, mood: "happy", wave: true, op: seg(t, 163, 163.4) * M });
    const boost = ease(seg(t, 170, 172));
    form.querySelector(".cr").textContent = (1.5 + boost).toFixed(1) + "%";
    form.querySelector(".rev").textContent = "= " + fmt(3000 * (0.015 + 0.01 * boost) * 60000) + "원";
    form.querySelector(".up").style.opacity = seg(t, 170, 170.5);
    CT.forEach((c, i) => { const p = pop(c, t, 173 + i * .4, .5, 16); c.style.opacity = p; });
    soft.style.opacity = seg(t, 175, 175.5) * M;
    const r = out(seg(t, 178, 178.8));
    ref.style.opacity = r; ref.style.transform = `scale(${0.92 + 0.08 * r})`;
    ref.scrollTo(lerp(0.7, 1, ease(seg(t, 178.5, 182.5))), t);
    poseNoa(noa, t, { x: 1640, y: 740, s: .85, talk: t > 179.5 && t < 182, look: -1, op: seg(t, 178.8, 179.2) });
    sayBubble(bub, t, 179.5, 183.8, "마지막은 늘 버튼 하나 👉", 1320, 660);
  };
});

