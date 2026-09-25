// ---------------------------------------------------------------- 05 · Expertise + humor (134–160)
scene(134, 160, (R, s) => {
  s.caps = [[134.2, "전문성은 본문, 유머는 양념", "Expertise is the meal, humor is the seasoning"],
            [137, "전문성: 과정을 보여주고, 숫자와 후기로 증명", "Expertise: show the work, prove it with numbers and reviews"],
            [143, "유머: 사람들은 재밌는 브랜드를 기억하고 고른다", "Humor: people remember and choose funny brands"],
            [149, "규칙 — 상황은 비틀되, 고객은 놀리지 않는다", "Rule: poke fun at the situation, never the customer"],
            [153.5, "둘을 한 화면에: 과정 공개 + 유머 로딩", "Both at once: show the process, with a joke"]];
  s.cite = [[137, "Buell & Norton 2011 · Spiegel Research Center"], [143, "Oracle Happiness Report"], [149, "McGraw & Warren 2010, Benign Violations"]];
  chapter(R, "CHAPTER 05", "전문성과 유머 코드");
  const sc = el("div", "left:360px;top:180px;width:1200px;height:640px", "", R); sc.className = "abs";
  sc.innerHTML = `<svg width="1200" height="640" style="position:absolute;left:0;top:0">
    <path d="M600 110 L600 560 M520 580 L680 580" stroke="#c8a266" stroke-width="10" stroke-linecap="round"/>
    <polygon points="600,90 585,120 615,120" fill="#c8a266"/></svg>`;
  const beam = el("div", "position:absolute;left:120px;top:100px;width:960px;height:10px;background:var(--gold);border-radius:5px;transform-origin:480px 5px", "", sc);
  const panL = el("div", "position:absolute;left:-60px;top:5px;width:420px;transform-origin:210px 0", "", beam), panR = el("div", "position:absolute;left:600px;top:5px;width:420px;transform-origin:210px 0", "", beam);
  const mkPan = (p, title, color) => { el("div", `height:56px;width:3px;background:var(--gold);margin:0 auto`, "", p);
    return el("div", `margin-top:0;padding:18px;border-radius:0 0 30px 30px;border-top:4px solid ${color};background:rgba(255,255,255,.03);min-height:120px`, `<div style="font-size:30px;font-weight:900;color:${color};text-align:center;margin-bottom:10px">${title}</div>`, p); };
  const LP = mkPan(panL, "전문성", "var(--sky)"), RP = mkPan(panR, "유머", "var(--pink)");
  const L = [["과정을 보여준다", "노동의 착시: 과정이 보이면 가치가 오른다"], ["후기 5개 = 구매 가능성 +270%", "별점은 4.0~4.7이 5.0보다 잘 팔린다"], ["숫자와 결과", "제작 기간 · 성과 · 고객 수"]];
  const Rr = [["91%", "재밌는 브랜드를 선호"], ["72%", "경쟁사보다 유머 있는 브랜드를 선택"], ["90%", "웃긴 광고를 더 잘 기억"]];
  const lItems = L.map(x => el("div", "background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:8px", `<div style="font-size:22px;font-weight:800">${x[0]}</div><div style="font-size:16px;color:var(--muted)">${x[1]}</div>`, LP));
  const rItems = Rr.map(x => el("div", "background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;gap:14px;align-items:center", `<div style="font-size:34px;font-weight:900;color:var(--pink)">${x[0]}</div><div style="font-size:18px">${x[1]}</div>`, RP));
  const rule = el("div", "left:0;right:0;top:250px;text-align:center;z-index:5", `<div style="display:inline-block;padding:30px 50px;border-radius:24px;background:var(--cream);color:var(--ink);box-shadow:0 30px 80px rgba(0,0,0,.6)">
    <div style="font-size:18px;letter-spacing:4px;color:var(--terra)">HUMOR RULE</div>
    <div class="serif" style="font-size:52px;font-weight:800;margin-top:8px">상황은 비틀되,<br>고객은 놀리지 않는다</div>
    <div style="font-size:20px;color:#6b6358;margin-top:12px">웃음 = 약간 어긋났지만 안전한 것 (양성 위반)</div></div>`, R); rule.className = "abs";
  // loading card example
  const ld = el("div", "left:460px;top:220px;width:1000px;height:520px;background:var(--cream);color:var(--ink);border-radius:24px;padding:40px 50px", "", R); ld.className = "abs";
  ld.innerHTML = `<div style="font-size:18px;letter-spacing:4px;color:var(--terra)">예시 · 로딩 화면</div>
    <div class="lt" style="font-size:40px;font-weight:800;margin-top:14px;font-family:'Noto Serif CJK KR'">노아가 브랜드 영상 렌더링 중…</div>
    <div class="lc" style="font-size:24px;color:#6b6358;margin-top:8px">(커피 2잔째 ☕)</div>
    <div style="margin-top:30px;height:18px;border-radius:9px;background:#e0d6c6;overflow:hidden"><div class="lb" style="height:100%;width:0;background:var(--terra)"></div></div>
    <div class="ls" style="margin-top:26px;font-size:24px;line-height:1.9"></div>`;
  const ldNoa = makeNoa(170); ld.appendChild(ldNoa);
  const STEPS = ["✓ 대본 확정 (Claude)", "✓ 스틸 4장 생성 (Higgsfield)", "● 5초 영상 렌더링", "○ 페이지에 배치"];
  return t => {
    const S = seg(t, 134.2, 134.8) * (1 - seg(t, 148.6, 149));
    sc.style.opacity = S;
    const wl = lItems.filter((_, i) => t > 137.3 + i * 1.6).length, wr = rItems.filter((_, i) => t > 143.2 + i * 1.4).length;
    const target = (wr - wl) * 5;  // degrees: heavier side goes down
    beam.style.transform = `rotate(${target + 1.5 * Math.sin(t * 2.2) * seg(t, 137, 140)}deg)`;
    const inv = `rotate(${-target}deg)`; panL.style.transform = inv; panR.style.transform = inv;
    lItems.forEach((e, i) => pop(e, t, 137.3 + i * 1.6, .5, -30));
    rItems.forEach((e, i) => pop(e, t, 143.2 + i * 1.4, .5, -30));
    const ru = back(seg(t, 149, 149.6));
    rule.style.opacity = clamp(ru) * (1 - seg(t, 153, 153.5)); rule.style.transform = `scale(${0.8 + 0.2 * ru}) rotate(${-2 * (1 - clamp(ru))}deg)`;
    const LD = seg(t, 153.5, 154.1);
    ld.style.opacity = LD; ld.style.transform = `translateY(${30 * (1 - LD)}px)`;
    ld.querySelector(".lb").style.width = (100 * ease(seg(t, 154, 159.5)) * .82) + "%";
    ld.querySelector(".lc").textContent = t > 157.5 ? "(커피 3잔째… 거의 다 됐어요 ☕☕☕)" : "(커피 2잔째 ☕)";
    ld.querySelector(".ls").innerHTML = STEPS.map((x, i) => `<div style="opacity:${seg(t, 154.3 + i * .8, 154.7 + i * .8)};color:${x[0] === "✓" ? "#1e3a33" : x[0] === "●" ? "var(--terra)" : "#9a8f80"}">${x}</div>`).join("");
    poseNoa(ldNoa, t, { x: 780, y: 260, s: .9, talk: false, look: -1, mood: t > 157.5 ? "pout" : "happy" });
  };
});

