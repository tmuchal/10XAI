// ---------------------------------------------------------------- 03 · Character consistency (72–106)
scene(72, 106, (R, s) => {
  s.caps = [[72.2, "컷마다 얼굴이 바뀌면, 몰입이 깨집니다", "If the face changes every shot, immersion breaks"],
            [82, "① 캐릭터 시트: 정면 · 3/4 · 측면 · 클로즈업, 의상은 하나로", "1. Character sheet: 4 views, one outfit"],
            [86.5, "② Soul ID: 같은 사람 사진 20장+ → 3~5분 학습 → 저장", "2. Soul ID: 20+ photos, ~3–5 min training, saved identity"],
            [91, "③ Reference Element로 Kling · Seedance 영상에 재사용", "3. Reuse it in Kling / Seedance via Reference Element"],
            [95, "④ 의상·헤어 고정 + 네거티브 프롬프트  ⑤ 시드보다 레퍼런스", "4. Lock outfit & hair  5. References beat seeds"],
            [99.5, "배경과 앵글이 달라도, 같은 사람", "Different scenes and angles, same person"]];
  s.cite = [[72, "Higgsfield Soul ID · Kling 3.0 Elements"]];
  chapter(R, "CHAPTER 03", "사람(캐릭터) 일관성 유지");
  // gag: three generated shots with three different Noas
  const shots = [PAL.sea, PAL.gold, PAL.night].map((p, i) => {
    const w = el("div", `left:${150 + i * 560}px;top:230px;width:500px;height:300px;border-radius:16px;overflow:hidden`, "", R); w.className = "abs";
    const f = makeFilm(p); w.appendChild(f);
    el("div", "position:absolute;left:14px;top:10px;font-size:17px;font-weight:700;color:#fff;text-shadow:0 1px 6px #000;z-index:2", `SHOT ${i + 1}`, w);
    const n = makeNoa(170, [{ body: "#9fd3f0" }, { glasses: true, scarf: "#6fb3d9", beret: "#1e3a33" }, { spiky: true, body: "#f7c6d4" }][i]);
    w.appendChild(n); w.f = f; w.n = n;
    return w;
  });
  const real = makeNoa(200); R.appendChild(real);
  const bubs = [makeBubble(R), makeBubble(R), makeBubble(R), makeBubble(R)];
  // character sheet
  const sheet = el("div", "left:96px;top:200px;width:900px;height:360px;background:var(--cream);border-radius:20px;color:var(--ink)", `
    <div style="position:absolute;left:24px;top:14px;font-size:16px;letter-spacing:4px;color:#8a7f70">CHARACTER SHEET · NOA</div>`, R); sheet.className = "abs";
  const views = ["정면", "3/4", "측면", "클로즈업"].map((lb, i) => {
    const box = el("div", `position:absolute;left:${24 + i * 216}px;top:50px;width:200px;height:290px;border-radius:14px;background:#e9e0d2;overflow:hidden`, "", sheet);
    const n = makeNoa(i === 3 ? 360 : 170); box.appendChild(n);
    el("div", "position:absolute;left:12px;bottom:10px;font-size:18px;font-weight:700", lb, box);
    return n;
  });
  // Soul ID: photo grid collapses into an ID card
  const grid = el("div", "left:1060px;top:200px;width:760px;height:360px", "", R); grid.className = "abs";
  const photos = Array.from({ length: 20 }, (_, i) => {
    const d = el("div", `position:absolute;left:${(i % 5) * 150}px;top:${Math.floor(i / 5) * 88}px;width:136px;height:78px;border-radius:10px;overflow:hidden;background:#efe0c2`, "", grid);
    const n = makeNoa(60); n.style.left = (38 + (i % 3) * 6) + "px"; n.style.top = "6px"; d.appendChild(n); d.n = n;
    return d;
  });
  const idc = el("div", "left:1220px;top:230px;width:440px;height:280px;border-radius:20px;background:linear-gradient(135deg,#fff4dc,#f7d9a8);border:2px solid var(--gold);padding:26px", `
    <div style="font-size:16px;letter-spacing:4px;color:var(--gold)">SOUL ID</div><div style="font-size:44px;font-weight:900;margin-top:6px">NOA</div>
    <div style="font-size:19px;color:#6b5d52;margin-top:10px;line-height:1.6">사진 20장+ · 학습 약 3~5분<br>Reference Element로 저장됨</div>`, R); idc.className = "abs";
  const idNoa = makeNoa(130); idc.appendChild(idNoa);
  const steps = el("div", "left:96px;top:600px;width:1728px;display:flex;gap:16px", "", R); steps.className = "abs";
  const stepEls = ["① 캐릭터 시트 4컷", "② Soul ID 학습", "③ Reference Element 재사용", "④ 의상·헤어 고정 + 네거티브", "⑤ 시드 < 레퍼런스"].map(x => el("div", "flex:1;padding:16px 18px;border-radius:14px;background:var(--panel);border:1px solid var(--line);font-size:21px;font-weight:700;text-align:center", x, steps));
  const oks = [PAL.dawn, PAL.forest, PAL.sea].map((p, i) => {
    const w = el("div", `left:${150 + i * 560}px;top:230px;width:500px;height:300px;border-radius:16px;overflow:hidden`, "", R); w.className = "abs";
    const f = makeFilm(p); w.appendChild(f); const n = makeNoa(170); w.appendChild(n); w.f = f; w.n = n;
    el("div", "position:absolute;right:14px;top:10px;font-size:20px;font-weight:800;color:#27c26a;text-shadow:0 1px 6px #000;z-index:2", "✓ SAME", w);
    return w;
  });
  const endB = makeBubble(R);
  return t => {
    const gagOut = seg(t, 81.4, 81.9);
    shots.forEach((w, i) => {
      const p = back(seg(t, 72.5 + i * .5, 73.1 + i * .5));
      w.style.opacity = clamp(p) * (1 - gagOut); w.style.transform = `scale(${0.8 + 0.2 * p})`;
      w.f.update(t + i, .7);
      poseNoa(w.n, t, { x: 160, y: 90, s: 1, talk: t > 77 && t < 79, look: 1 });
    });
    poseNoa(real, t, { x: 860, y: 640 + 200 * (1 - back(seg(t, 74.5, 75.1))), s: .9, mood: t > 75 && t < 80.5 ? "shock" : "happy", talk: t > 75.2 && t < 77, op: seg(t, 74.5, 74.6) * (1 - gagOut) });
    sayBubble(bubs[0], t, 75.2, 81.6, "…누구세요?", 1000, 600);
    [0, 1, 2].forEach(i => sayBubble(bubs[i + 1], t, 77.4 + i * .15, 81.6, "나야.", 190 + i * 560, 160));
    // sheet + Soul ID
    const sh = out(seg(t, 82, 82.8));
    sheet.style.opacity = sh * (1 - seg(t, 99, 99.5)); sheet.style.transform = `translateY(${30 * (1 - sh)}px)`;
    views.forEach((n, i) => poseNoa(n, t, { x: i === 3 ? -80 : 15, y: i === 3 ? 20 : 70, s: i === 1 ? .95 : 1, look: [0, .8, 1, 0][i], flip: false }));
    views[1].style.transform += " skewY(-4deg)";
    views[2].style.transform = views[2].style.transform.replace(/scale\(([^,]+), ([^)]+)\)/, "scale(0.62, $2)");
    const gp = seg(t, 86.5, 87.3), collapse = ease(seg(t, 88.6, 89.8));
    grid.style.opacity = gp * (1 - seg(t, 89.6, 89.9));
    photos.forEach((d, i) => {
      d.style.opacity = seg(t, 86.5 + i * .05, 86.8 + i * .05);
      const dx = (1220 + 220 - 1060 - ((i % 5) * 150 + 68)) * collapse, dy = (230 + 140 - 200 - (Math.floor(i / 5) * 88 + 39)) * collapse;
      d.style.transform = `translate(${dx}px, ${dy}px) scale(${1 - .7 * collapse})`;
      poseNoa(d.n, t, { x: 0, y: 0, s: 1, look: [(i % 3) - 1][0] });
    });
    const ic = back(seg(t, 89.7, 90.3));
    idc.style.opacity = clamp(ic) * (1 - seg(t, 99, 99.5)); idc.style.transform = `scale(${0.7 + 0.3 * ic})`;
    poseNoa(idNoa, t, { x: 290, y: 130, s: 1, wave: t > 90.5 && t < 93 });
    stepEls.forEach((e, i) => {
      const at = [82, 86.5, 91, 95, 96.5][i]; const p = pop(e, t, at, .5, 16);
      e.style.opacity = p * (1 - seg(t, 99, 99.5));
      e.style.borderColor = t > at && t < ([86.5, 91, 95, 96.5, 99][i]) ? "var(--gold)" : "var(--line)";
    });
    // result
    oks.forEach((w, i) => {
      const p = back(seg(t, 99.6 + i * .4, 100.2 + i * .4));
      w.style.opacity = clamp(p); w.style.transform = `scale(${0.85 + 0.15 * p})`;
      w.f.update(t + i * 3, .7);
      poseNoa(w.n, t, { x: [60, 250, 150][i], y: [90, 80, 100][i], s: [1, .8, 1.1][i], look: [1, -1, 0][i], wave: i === 1 && t > 101 });
    });
    sayBubble(endB, t, 101.5, 105.8, "이제 어디서든 나야 😎", 1300, 560);
  };
});

