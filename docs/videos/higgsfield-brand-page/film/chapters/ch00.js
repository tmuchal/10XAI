// ---------------------------------------------------------------- 00 · Opening (0–10)
scene(0, 10, (R, s) => {
  s.caps = [[0.2, "방문자는 0.05초 만에 첫인상을 정합니다", "Visitors judge a page in 50 milliseconds"],
            [5.2, "그 0.05초를 붙잡는 페이지, Claude × Higgsfield", "Pages that hold that moment, built with Claude × Higgsfield"]];
  s.cite = [[0, "Lindgaard et al., 2006 · Behaviour & IT"]];
  const timer = el("div", "left:0;right:0;top:360px;text-align:center;font-size:150px;font-weight:900", "", R); timer.className = "abs mono";
  const ref = refWindow(R, 260, 70, 1400, 780);
  const title = el("div", "left:0;right:0;top:250px;text-align:center;z-index:20", `
    <div style="font-size:26px;letter-spacing:6px;color:var(--gold)">CLAUDE × HIGGSFIELD</div>
    <div class="serif" style="font-size:96px;font-weight:800;margin-top:16px;line-height:1.15;text-shadow:4px 4px 0 #f7d774">사람을 붙잡는<br>브랜드 페이지</div>`, R); title.className = "abs";
  const dim = el("div", "inset:0;background:rgba(247,233,200,.9);z-index:10", "", R); dim.className = "abs";
  const noa = makeNoa(220); R.appendChild(noa);
  const bub = makeBubble(R);
  return t => {
    const tm = seg(t, 0.3, 1.6);
    timer.textContent = (0.05 * tm).toFixed(3) + "s";
    timer.style.opacity = 1 - seg(t, 1.8, 2.1);
    const flash = seg(t, 1.8, 2.2);
    ref.style.opacity = flash; ref.style.transform = `scale(${0.94 + 0.06 * out(flash) + 0.02 * seg(t, 2, 10)})`;
    ref.scrollTo(0, t);
    dim.style.opacity = seg(t, 4.6, 5.2) * 0.9;
    pop(title, t, 5.1, .8, 30);
    const nIn = back(seg(t, 2.6, 3.2));
    poseNoa(noa, t, { x: 1500, y: 620 + 300 * (1 - nIn), s: 1, wave: t > 3 && t < 5, talk: t > 3.2 && t < 4.8, look: -0.6, op: seg(t, 2.6, 2.7) });
    sayBubble(bub, t, 3.2, 9.8, "안녕, 난 노아. 첫인상은 0.05초면 끝나.", 1080, 540);
  };
});

