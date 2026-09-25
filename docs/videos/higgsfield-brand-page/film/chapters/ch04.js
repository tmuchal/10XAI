// ---------------------------------------------------------------- 04 · Immersion (106–134)
scene(106, 134, (R, s) => {
  s.caps = [[106.2, "① 3초 안에 떠야 한다", "1. Load in under 3 seconds"],
            [112.5, "② 스크롤할 때마다 무언가 움직인다", "2. Something moves with every scroll"],
            [119, "③ 히어로엔 영상", "3. Put video in the hero"],
            [125, "④ 부드러운 애니메이션은 Opus에게 코드로", "4. Ask Opus to write the animation code"]];
  s.cite = [[106, "Google mobile speed research"], [119, "Wyzowl Video Marketing Statistics 2026"], [125, "Anthropic · Introducing Claude Opus 5"]];
  chapter(R, "CHAPTER 04", "몰입감 만들기");
  // a) speed race
  const race = el("div", "left:96px;top:230px;width:1728px;height:560px", "", R); race.className = "abs";
  const bars = [["1초", 1, "var(--gold)"], ["3초", 3, "#e0a64f"], ["5초", 5, "var(--terra)"]].map((b, i) => {
    const row = el("div", `position:absolute;left:0;top:${i * 120}px;width:1000px;height:90px`, `<div style="position:absolute;left:0;top:26px;font-size:30px;font-weight:800;width:90px">${b[0]}</div>
      <div style="position:absolute;left:100px;top:30px;width:880px;height:30px;border-radius:15px;background:#f1e4c8;overflow:hidden"><div class="fill" style="height:100%;width:0;background:${b[2]}"></div></div>`, race);
    row.dur = b[1]; return row;
  });
  const people = el("div", "position:absolute;left:0;top:380px;display:flex;gap:10px", "", race);
  const ppl = Array.from({ length: 20 }, () => el("div", "width:40px;height:56px;border-radius:20px 20px 8px 8px;background:#6b5d52", "", people));
  const rs = el("div", "position:absolute;left:1120px;top:0;width:600px", `<div class="stat">+32%</div><div style="font-size:22px;color:#6b5d52;margin:6px 0 30px">로딩 1→3초, 이탈 확률 증가</div>
    <div class="stat" style="color:var(--terra)">53%</div><div style="font-size:22px;color:#6b5d52;margin-top:6px">3초 넘으면 떠나는 모바일 방문자</div>`, race);
  const tapN = makeNoa(150); race.appendChild(tapN);
  // b) scroll phone
  const phone = el("div", "left:620px;top:190px;width:340px;height:660px;border-radius:44px;background:#2b2320;padding:14px;box-shadow:0 30px 90px rgba(0,0,0,.6)", "", R); phone.className = "abs";
  const scr = el("div", "position:relative;width:100%;height:100%;border-radius:32px;overflow:hidden;background:var(--cream)", "", phone);
  const pf = makeFilm(PAL.dawn); scr.appendChild(pf);
  const layers = ["이야기가", "브랜드가", "되는 곳"].map((w, i) => el("div", `position:absolute;left:28px;top:${220 + i * 70}px;font-size:48px;font-weight:800;color:#fff;font-family:'Noto Serif CJK KR';text-shadow:0 4px 20px rgba(0,0,0,.5)`, w, scr));
  const thumb = el("div", "position:absolute;left:1000px;top:420px;width:70px;height:110px;border:4px solid #6b5d52;border-radius:36px", `<div style="width:10px;height:22px;border-radius:5px;background:#6b5d52;margin:18px auto 0" class="wh"></div>`, R); thumb.className = "abs";
  const scrollTxt = el("div", "left:1120px;top:380px;width:660px;font-size:30px;line-height:1.6", "스크롤 = 장면 전환<br><span style='color:var(--muted);font-size:24px'>레이어마다 다른 속도(패럴랙스), 문장이 한 줄씩 등장</span>", R); scrollTxt.className = "abs";
  // c) hero video
  const hv = el("div", "left:96px;top:210px;width:1000px;height:560px;border-radius:20px;overflow:hidden", "", R); hv.className = "abs";
  const hvf = makeFilm(PAL.gold); hv.appendChild(hvf);
  el("div", "position:absolute;left:24px;bottom:22px;right:24px;height:6px;border-radius:3px;background:rgba(255,255,255,.3)", `<div class="pb" style="height:100%;width:0;background:#fff;border-radius:3px"></div>`, hv);
  const hvs = el("div", "left:1180px;top:300px;width:640px", `<div class="stat">85%</div><div style="font-size:24px;color:#6b5d52;margin-top:8px;line-height:1.5">영상을 보고 구매를 결심한 적 있다</div>`, R); hvs.className = "abs";
  // d) Opus code → motion
  const code = el("div", "left:96px;top:200px;width:900px;height:600px;padding:30px 34px;font-size:24px;line-height:1.75;white-space:pre", "", R); code.className = "card mono";
  const CODE = `// Opus가 쓴 스크롤 애니메이션\nconst tl = timeline({ scroll: "#hero" });\ntl.from(".title", { y: 60, opacity: 0, ease: "out" })\n  .to(".sun",    { y: -120, scrub: true })\n  .to(".ridge",  { x: -200, scrub: 0.6 })\n  .from(".cta",  { scale: .8, ease: "back" });`;
  const stageBox = el("div", "left:1060px;top:200px;width:760px;height:600px;border-radius:20px;overflow:hidden", "", R); stageBox.className = "abs";
  const sbf = makeFilm(PAL.night); stageBox.appendChild(sbf);
  const sbT = el("div", "position:absolute;left:40px;top:180px;font-size:60px;font-weight:800;color:#fff;font-family:'Noto Serif CJK KR'", "부드럽게, 재밌게", stageBox);
  const sbC = el("div", "position:absolute;left:40px;top:300px;background:var(--gold);color:#1a1406", "지금 시작하기 →", stageBox); sbC.className = "btn";
  const codeNoa = makeNoa(160); R.appendChild(codeNoa);
  const cb = makeBubble(R);
  return t => {
    const A = seg(t, 106.2, 106.8) * (1 - seg(t, 112, 112.5));
    race.style.opacity = A;
    bars.forEach(b => b.querySelector(".fill").style.width = (100 * seg(t, 107, 107 + b.dur)) + "%");
    ppl.forEach((p, i) => { const leave = i >= 20 - Math.round(20 * .53 * seg(t, 110, 111.5)); p.style.opacity = leave ? .15 : 1; p.style.transform = leave ? "translateY(20px)" : "none"; });
    rs.style.opacity = seg(t, 108.5, 109.2);
    const tap = Math.floor(t * 6) % 2;
    poseNoa(tapN, t, { x: 1500, y: 360, s: .9, mood: t > 109.5 ? "pout" : "happy", look: -1, hop: t > 108 && t < 111 ? tap * .15 : 0 });
    // b
    const B = seg(t, 112.5, 113.1) * (1 - seg(t, 118.5, 119));
    phone.style.opacity = B; thumb.style.opacity = B; scrollTxt.style.opacity = B;
    const sc = ease(seg(t, 113.4, 118)) * 3;
    thumb.querySelector(".wh").style.transform = `translateY(${(sc * 20) % 40}px)`;
    pf.update(sc * 3, 1);
    layers.forEach((l, i) => { const p = clamp(sc - i * .8); l.style.opacity = p; l.style.transform = `translateY(${40 * (1 - p) - sc * 22}px)`; });
    // c
    const C = seg(t, 119, 119.6) * (1 - seg(t, 124.5, 125));
    hv.style.opacity = C; hvs.style.opacity = seg(t, 120, 120.6) * C;
    hvf.update(t, 1.2); hv.querySelector(".pb").style.width = (100 * seg(t, 119.3, 124.5)) + "%";
    // d
    const D = seg(t, 125, 125.6);
    code.style.opacity = D; stageBox.style.opacity = D;
    const shown = type(CODE, seg(t, 125.4, 129.4));
    code.innerHTML = shown.replace(/(\/\/.*)/g, "<span style='color:#77736b'>$1</span>").replace(/(".*?")/g, "<span style='color:var(--gold)'>$1</span>");
    const run = seg(t, 129.4, 133.5);
    sbf.update(run * 8, 1);
    const tp = out(seg(run, 0, .3)); sbT.style.opacity = tp; sbT.style.transform = `translateY(${60 * (1 - tp)}px)`;
    const cp = back(seg(run, .45, .7)); sbC.style.opacity = clamp(cp * 2); sbC.style.transform = `scale(${0.8 + 0.2 * cp})`;
    poseNoa(codeNoa, t, { x: 1620, y: 690, s: .8, talk: t > 130 && t < 132.5, look: -1, op: D });
    sayBubble(cb, t, 130, 133.8, "이 영상도 Claude가 코드로 움직였어 🎬", 1180, 640);
  };
});

