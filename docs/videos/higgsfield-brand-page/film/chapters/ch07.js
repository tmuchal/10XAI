// ---------------------------------------------------------------- 07 · Outro (184–192)
scene(184, 192, (R, s) => {
  s.caps = [[184.2, "다음 페이지의 주인공은, 당신의 브랜드", "The next hero is your brand"]];
  const title = el("div", "left:0;right:0;top:130px;text-align:center", `<div style="font-size:24px;letter-spacing:6px;color:var(--gold)">CLAUDE × HIGGSFIELD</div>
    <div class="serif" style="font-size:72px;font-weight:800;margin-top:14px">사람을 붙잡는 브랜드 페이지</div>`, R); title.className = "abs";
  const chips = el("div", "left:0;right:0;top:360px;text-align:center", "", R); chips.className = "abs";
  const CH = ["업종 무관", "고객이 주인공", "Soul ID 일관성", "3초 · 스크롤 · 영상", "전문성 + 유머", "버튼 → 매출"].map(c => el("span", "margin:0 8px;font-size:26px;border-color:var(--gold)", c, chips));
  CH.forEach(c => c.className = "chip");
  const url = el("div", "left:0;right:0;top:470px;text-align:center;font-size:48px", `${REF_URL.split(".")[0]}<span style="color:var(--gold)">.${REF_URL.split(".").slice(1).join(".")}</span>`, R); url.className = "abs mono";
  const noa = makeNoa(220); R.appendChild(noa);
  return t => {
    pop(title, t, 184.2, .7, 30);
    CH.forEach((c, i) => { const p = back(seg(t, 185 + i * .2, 185.5 + i * .2)); c.style.opacity = clamp(p); c.style.display = "inline-block"; c.style.transform = `scale(${0.7 + 0.3 * p})`; });
    const u = out(seg(t, 186.6, 187.4)); url.style.opacity = u; url.style.letterSpacing = `${6 * (1 - u)}px`;
    poseNoa(noa, t, { x: 850, y: 600, s: 1, wave: true, talk: t > 187.5 && t < 190, op: seg(t, 184.5, 185) });
  };
});

