  // ---------- 30-second cut: an edit list over the master timeline ----------
  // Each segment plays a slice of the full show [m0, m1] in d seconds of cut time.
  const SEG = [
    {m0:2.5,  m1:5.3,  d:2.8, ch:'사건 개요'},
    {m0:22.2, m1:24.2, d:2.0, ch:'용의자 1 · 인센티브', fly:'용의자 1|인센티브'},
    {m0:28.0, m1:31.4, d:3.4, ch:'용의자 1 · 인센티브'},
    {m0:34.2, m1:36.2, d:1.8, ch:'용의자 2 · 실사용', fly:'용의자 2|실사용'},
    {m0:40.1, m1:43.7, d:2.6, ch:'용의자 2 · 실사용'},
    {m0:56.2, m1:58.2, d:2.0, ch:'용의자 3 · TVL', fly:'용의자 3|TVL 풍선'},
    {m0:62.6, m1:64.4, d:1.8, ch:'용의자 3 · TVL'},
    {m0:66.5, m1:69.3, d:2.2, ch:'용의자 4 · Ondo', fly:'용의자 4|Ondo'},
    {m0:70.0, m1:73.0, d:2.2, ch:'용의자 4 · Ondo'},
    {m0:76.1, m1:77.8, d:1.6, ch:'공범 · 시장 전체', fly:'공범|시장 전체'},
    {m0:82.9, m1:85.9, d:2.6, ch:'공범 · 시장 전체'},
    {m0:88.0, m1:90.2, d:2.0, ch:'최종 판결', fly:'최종|판결'},
    {m0:96.2, m1:99.2, d:3.0, ch:'최종 판결'}
  ];
  let acc = 0; SEG.forEach(g => { g.c0 = acc; acc += g.d; g.c1 = acc; });
  const CUT_D = acc;
  const CHAPS = [...new Set(SEG.map(g => g.ch))];
  const CHAP = CHAPS.map(ch => { const gs = SEG.filter(g => g.ch === ch); return {ch, c0:gs[0].c0, c1:gs[gs.length-1].c1}; });
  const segAt = c => SEG.find(g => c < g.c1) || SEG[SEG.length-1];
  function masterAt(c){ const g = segAt(c); const k = Math.min(1, Math.max(0, (c - g.c0)/g.d)); return g.m0 + (g.m1 - g.m0)*k; }
  function cutOf(m){ for (const g of SEG) if (m >= g.m0 && m <= g.m1) return g.c0 + (m - g.m0)/(g.m1 - g.m0)*g.d; return null; }
  const BOUNDS = SEG.slice(1).map((g, i) => ({c:g.c0, big:!!g.fly, fly:g.fly}));

  const CUT_CUES = [
    [0.2,  "NEAR jumped 80% in one week. Who did it?", "NEAR, 일주일 새 80% 급등. 범인은 누구?"],
    [2.9,  "Suspect one: a $70 million snapshot, and a 14% jump.", "용의자 1: 예치금 7천만 달러에 찰칵, 그날 14% 급등."],
    [5.8,  "Rewards unlock only above $3.33, so holders want it up.", "보상은 $3.33을 넘어야 풀린다. 그러니 다들 상승을 원한다."],
    [8.3,  "Suspect two: real usage. $31 billion moved, fees doubled.", "용의자 2: 진짜 사용량. 누적 314억 달러, 수수료는 2배."],
    [12.7, "The TVL balloon? Partly just the price going up.", "TVL 풍선? 일부는 가격이 올라서 부푼 것."],
    [16.5, "Ondo's deal came on the 23rd. The rally train had left.", "Ondo 제휴는 23일. 랠리 기차는 이미 떠났다."],
    [20.9, "Accomplices: $648 million in shorts squeezed, and a privacy wave.", "공범: 숏 6억 4,800만 달러 청산, 그리고 프라이버시 코인 열풍."],
    [25.1, "Verdict: the incentive lit the fuse. Watch $3.33.", "판결: 불을 붙인 건 인센티브. 관건은 $3.33."],
    [28.3, "Case closed. Not investment advice.", "사건 종결. 투자 조언은 아닙니다."]
  ].map(([t, s, ko]) => ({t, s, ko}));

  // Korean variety-show pop captions: text (HTML), cut time, duration, x%, y%, tilt, size class
  const POPS = [
    {t:0.15, d:2.5, x:40, y:15, r:-3, cls:'big', h:'일주일 만에 <em>+80%</em>'},
    {t:1.6,  d:1.2, x:26, y:42, r:7,  cls:'sm',  h:'범인은?!'},
    {t:2.95, d:1.7, x:22, y:32, r:-5, cls:'',    h:'7천만 달러 → <em>찰칵</em>'},
    {t:3.9,  d:1.0, x:74, y:58, r:4,  cls:'sm',  h:'그날 <b>+14%</b>'},
    {t:5.9,  d:2.2, x:82, y:38, r:-3, cls:'sm',  h:'<em>$3.33</em> 넘어야 해제'},
    {t:7.3,  d:0.9, x:16, y:30, r:5,  cls:'sm',  h:'모두 <em>상승</em>을 원해'},
    {t:8.4,  d:1.6, x:74, y:47, r:-4, cls:'',    h:'누적 <em>314억 달러</em>'},
    {t:10.9, d:1.6, x:80, y:26, r:5,  cls:'',    h:'수수료 <b>2배!</b>'},
    {t:12.8, d:1.7, x:64, y:32, r:-5, cls:'',    h:'풍선 속 <em>착시</em>'},
    {t:14.8, d:1.5, x:48, y:15, r:4,  cls:'sm',  h:'원인이 아니라 <b>결과</b>'},
    {t:16.6, d:1.7, x:36, y:40, r:-3, cls:'sm',  h:'랠리 기차 출발~'},
    {t:19.8, d:1.0, x:44, y:34, r:-6, cls:'big', h:'<b>지각!</b>'},
    {t:21.0, d:1.4, x:50, y:57, r:-3, cls:'',    h:'숏 <b>6.48억 달러</b> 청산'},
    {t:23.0, d:1.8, x:50, y:48, r:4,  cls:'sm',  h:'프라이버시 <em>열풍</em>'},
    {t:25.2, d:1.7, x:62, y:20, r:-4, cls:'',    h:'1위: <em>인센티브</em>'}
  ];

  const REACTS = [
    {at:1.9,  d:1.0, mood:'shock',  ko:'헐, <em>80%</em>?!<br>범인은?!', en:'Eighty percent?!'},
    {at:20.62, d:1.0, mood:'squint', ko:'기차 놓친 거<br><b>실화?</b>', en:'Missed the train?'},
    {at:25.95, d:1.0, mood:'shock',  ko:'주범은<br><em>인센티브!</em>', en:'The incentive did it!'}
  ];
  REACTS.sort((a, b) => a.at - b.at);
  const EDIT_D = CUT_D + REACTS.reduce((a, r) => a + r.d, 0);
  function toCut(e){ let acc = 0; for (const r of REACTS){ const s0 = r.at + acc; if (e < s0) return e - acc; if (e < s0 + r.d) return r.at; acc += r.d; } return Math.min(CUT_D, e - acc); }
  function reactAt(e){ let acc = 0; for (const r of REACTS){ const s0 = r.at + acc; if (e >= s0 && e < s0 + r.d) return {r, a:e - s0}; acc += r.d; } return null; }
  function toEdit(c){ let acc = 0; for (const r of REACTS){ if (r.at <= c) acc += r.d; } return c + acc; }
  const reactStart = r => toEdit(r.at) - r.d;
  CUT = {cues:CUT_CUES, fx:{cube:null, cap:97.15}};
  plaqueG.parentNode.setAttribute('display', 'none');
  closedStamp.parentNode.setAttribute('display', 'none');
  footer.setAttribute('display', 'none');
  const endCard = $('endCard'), END_T = 27.9;
  const reactEl = buildReactionCam(); $('kpops').after(reactEl);
  const rFace = reactEl.querySelector('.rface'), rMouth = reactEl.querySelector('.rmouth'), rCap = reactEl.querySelector('.rcap'), rKo = reactEl.querySelector('.rko'), rEn = reactEl.querySelector('.ren');
  const kpops = $('kpops'), kchap = $('kchap'), kprog = $('kprog'), cutflash = $('cutflash');
  POPS.forEach(p => { p.el = document.createElement('div'); p.el.className = 'kpop ' + p.cls; p.el.innerHTML = p.h; p.el.style.opacity = 0; kpops.appendChild(p.el); });
  CHAP.forEach(c => { const sp = document.createElement('span'); sp.appendChild(document.createElement('i')); kprog.appendChild(sp); c.bar = sp.firstChild; });
  const easeBack = q => 1 + 2.7*Math.pow(q - 1, 3) + 1.7*Math.pow(q - 1, 2);

  // Sound events on the cut clock
  const EV = [];
  BOUNDS.forEach(b => EV.push({c:b.c - (b.big ? .3 : 0), kind:b.big ? 'whoosh' : 'pop'}));
  STAMPS.forEach(st => { const c = cutOf(st.t + .22); if (c != null) EV.push({c, kind:'thump'}); });
  { const c = cutOf(22.65); if (c != null) EV.push({c, kind:'flash'}); }
  POPS.forEach(p => EV.push({c:p.t, kind:'pop'}));
  EV.push({c:END_T, kind:'thump'});

  let lastChap = '';
  function renderCut(c, w){
    const m = masterAt(c);
    tl.seek(m);
    // 3D hamster fly-by carrying the next chapter sign
    let cube = null;
    for (const b of BOUNDS){ if (b.big){ const p = (c - (b.c - .5))/1.0; if (p >= 0 && p <= 1) cube = {p, n:b.fly}; } }
    CUT.fx.cube = cube;
    frame(m, w);
    // whip-pan / jump-cut punch on top of the master camera
    let tx = 0, blur = 0, sc = 1, fl = 0;
    for (const b of BOUNDS){
      const dt = c - b.c;
      if (b.big && dt > -.14 && dt < .24){ tx = dt < 0 ? (dt/.14)*9 : (1 - dt/.24)*-9 + 0; tx = dt < 0 ? -(1 + dt/.14)*9 : (1 - dt/.24)*9; blur = (1 - Math.abs(dt < 0 ? dt/.14 : dt/.24))*7; fl = Math.max(0, 1 - Math.abs(dt)/.12)*.75; }
      if (!b.big && dt >= 0 && dt < .28){ sc = 1 + (1 - dt/.28)*.07; }
    }
    if (!rm){
      camEl.style.transform += ` translateX(${tx.toFixed(2)}%) scale(${sc.toFixed(3)})`;
      camEl.style.filter = blur > .2 ? `blur(${blur.toFixed(1)}px)` : '';
    }
    cutflash.style.opacity = fl.toFixed(2);
    // end card: one-line summary in Korean + English
    { const a = c - END_T; const on = a >= 0;
      const q = Math.min(1, Math.max(0, a/.4));
      endCard.style.opacity = on ? Math.min(1, q*2).toFixed(2) : 0;
      endCard.style.transform = `translate(-50%,-50%) rotate(${on ? (-2*(1 - q)).toFixed(2) : 0}deg) scale(${on ? (rm ? 1 : easeBack(q)*.9 + .1).toFixed(3) : .6})`; }
    // Korean pop captions
    for (const p of POPS){
      const a = c - p.t;
      if (a < 0 || a > p.d){ if (p.el.style.opacity !== '0') p.el.style.opacity = 0; continue; }
      const q = Math.min(1, a/.32), out = a > p.d - .18 ? Math.max(0, (p.d - a)/.18) : 1;
      const k = (rm ? 1 : easeBack(q))*(.6 + .4*out);
      const wob = rm ? 0 : Math.sin(w*6 + p.t)*1.2;
      p.el.style.opacity = (Math.min(1, q*2.5)*out).toFixed(2);
      p.el.style.left = p.x + '%'; p.el.style.top = p.y + '%';
      p.el.style.transform = `translate(-50%,-50%) rotate(${(p.r + wob).toFixed(2)}deg) scale(${k.toFixed(3)})`;
    }
    // chapter chip + progress
    const g = segAt(c);
    if (g.ch !== lastChap){ kchap.textContent = g.ch; kchap.classList.remove('in'); void kchap.offsetWidth; if (!rm) kchap.classList.add('in'); lastChap = g.ch; }
    CHAP.forEach(ch => ch.bar.style.transform = `scaleX(${Math.min(1, Math.max(0, (c - ch.c0)/(ch.c1 - ch.c0))).toFixed(3)})`);
    tcOut.textContent = fmtT(c) + ' / ' + fmtT(CUT_D);
    if (document.activeElement !== scrub) scrub.value = c.toFixed(2);
  }

  let editT = 0;
  function renderReact(e, w){
    const ra = reactAt(e);
    const bn = document.querySelector('.banner');
    if (!ra){ if (reactEl.style.display !== 'none'){ reactEl.style.display = 'none'; bn.style.opacity = 1; } return; }
    bn.style.opacity = 0;
    const {r, a} = ra;
    reactEl.style.display = 'block';
    if (reactEl.dataset.mood !== r.mood){ reactEl.dataset.mood = r.mood; }
    if (rKo.__h !== r.ko){ rKo.innerHTML = r.ko; rEn.textContent = r.en; rKo.__h = r.ko; }
    const q = Math.min(1, a/.22), punch = rm ? 1 : 1.28 - .28*easeBack(q);
    const sh = rm ? 0 : Math.max(0, 1 - a/.35)*14;
    rFace.style.transform = `translate(${(Math.sin(w*55)*sh).toFixed(1)}px,${(Math.cos(w*47)*sh).toFixed(1)}px) rotate(${(r.mood === 'squint' ? -3 : 2) + (rm ? 0 : Math.sin(w*3)*1.2)}deg) scale(${punch.toFixed(3)})`;
    const m = r.mood === 'shock' ? 1 + Math.abs(Math.sin(w*9))*.16 : 1 + Math.abs(Math.sin(w*6))*.1;
    rMouth.setAttribute('transform', `translate(800 735) scale(1 ${m.toFixed(3)}) translate(-800 -735)`);
    const cq = Math.min(1, Math.max(0, (a - .12)/.28));
    rCap.style.opacity = cq > 0 ? 1 : 0;
    rCap.style.transform = `rotate(-4deg) scale(${(rm ? 1 : easeBack(cq)).toFixed(3)})`;
    const out = r.d - a;
    reactEl.style.opacity = out < .1 ? Math.max(0, out/.1).toFixed(2) : 1;
    if (a < .12) cutflash.style.opacity = ((1 - a/.12)*.85).toFixed(2);
  }
  function renderAll(e, w){
    cutT = toCut(e);
    renderCut(cutT, w);
    renderReact(e, w);
    tcOut.textContent = fmtT(e) + ' / ' + fmtT(EDIT_D);
    if (document.activeElement !== scrub) scrub.value = e.toFixed(2);
  }

  // ---------- Playback ----------
  const cueIdx = c => { let i = -1; CUT_CUES.forEach((q, j) => { if (q.t <= c) i = j; }); return i; };
  let lastW = performance.now()/1000, cutPrev = 0, holdAcc = 0;
  function cutLoop(){
    const w = performance.now()/1000, dt = Math.min(.1, w - lastW); lastW = w;
    if (cutPlaying){
      let adv = dt;
      if (!reactAt(editT) && voiceOn && speaking && spokenIdx >= 0){
        const nx = CUT_CUES[spokenIdx + 1], lim = nx ? nx.t - .05 : CUT_D;
        if (toCut(editT + adv) >= lim && !reactAt(editT + adv) && holdAcc < 1.4){ adv = 0; holdAcc += dt; }
      }
      const prevE = editT;
      editT = Math.min(EDIT_D, editT + adv);
      cutT = toCut(editT);
      if (voiceOn && !reactAt(editT)){ const i = cueIdx(cutT); if (i >= 0 && i !== spokenIdx && cutT - CUT_CUES[i].t < .6){ holdAcc = 0; say(CUT_CUES[i].s, i); } }
      REACTS.forEach(r => { const s0 = reactStart(r); if (prevE < s0 && editT >= s0){ sfx('pop'); sfx('thump'); } });
      EV.forEach(ev => { const ec = toEdit(ev.c); if (prevE < ec && editT >= ec) sfx(ev.kind); });
      if (editT >= EDIT_D){ cutPlaying = false; playBtn.textContent = 'Replay'; }
    }
    if (!window.__freeze) renderAll(editT, w);
    requestAnimationFrame(cutLoop);
  }
  function cutSeek(e){ stopVoice(); editT = Math.max(0, Math.min(EDIT_D, e)); cutT = toCut(editT); cutPrev = cutT; spokenIdx = cueIdx(cutT - .6); holdAcc = 0; renderAll(editT, performance.now()/1000); }
  function cutPlay(p){
    cutPlaying = p; playBtn.textContent = p ? 'Pause' : 'Play';
    if (synth){ if (p && synth.paused) synth.resume(); if (!p && speaking) synth.pause(); }
  }
  window.__cut = {seek:cutSeek, play:cutPlay, render:(e, talk) => { editT = e; cutT = toCut(e); cutPrev = cutT; if (talk != null){ voiceOn = true; speaking = !!talk; } renderAll(e, e); }, dur:EDIT_D,
    timeline:() => ({dur:EDIT_D, cues:CUT_CUES.map(q => ({t:toEdit(q.t), s:q.s})), reacts:REACTS.map(r => ({t:reactStart(r), d:r.d, en:r.en})), ev:EV.map(ev => ({c:toEdit(ev.c), kind:ev.kind})).concat(REACTS.map(r => ({c:reactStart(r), kind:'thump'})))}),
    events:() => EV.map(ev => ({c:toEdit(ev.c), kind:ev.kind}))};
  playBtn.addEventListener('click', () => {
    $('startOv').hidden = true;
    if (editT >= EDIT_D){ cutSeek(0); cutPlay(true); return; }
    cutPlay(!cutPlaying);
  });
  $('restartBtn').addEventListener('click', () => { $('startOv').hidden = true; cutSeek(0); cutPlay(true); });
  voiceBtn.addEventListener('click', () => setVoice(!voiceOn));
  $('startVoice').addEventListener('click', () => { setVoice(true); $('startOv').hidden = true; cutSeek(0); cutPlay(true); });
  $('startSilent').addEventListener('click', () => { setVoice(false); $('startOv').hidden = true; cutSeek(0); cutPlay(true); });
  scrub.max = EDIT_D.toFixed(2);
  scrub.addEventListener('input', () => cutSeek(parseFloat(scrub.value)));
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, button, a')) return;
    if (e.code === 'Space'){ e.preventDefault(); playBtn.click(); }
  });

  // ---------- Shot list (frames captured from the cut) ----------
  const stage = $('stage');
  function snapshot(){
    const cl = stage.cloneNode(true);
    cl.removeAttribute('id'); cl.removeAttribute('role'); cl.setAttribute('aria-hidden', 'true');
    cl.querySelectorAll('[filter="url(#boil)"]').forEach(n => n.removeAttribute('filter'));
    cl.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    cl.setAttribute('class', 'thumb');
    return cl;
  }
  const BEATS = [
    {ch:'사건 개요', how:'Curtains part, the camera swoops in from an angle, a hamster pumps the price thermometer, and 3D confetti and coins burst on "+80%".'},
    {ch:'용의자 1 · 인센티브', how:'A 3D hamster flies past with the chapter sign. A camera flash freezes the $70M snapshot, then a jump cut to the $3.33 padlock with a push-in and a green STRONG stamp.'},
    {ch:'용의자 2 · 실사용', how:'Whip-pan in. The scoreboard counter rolls to $31.4B, then a jump cut to the fee sack doubling, with a green 3D confetti burst.'},
    {ch:'용의자 3 · TVL', how:'The balloon inflates with an elastic push-in, then a jump cut to the loop and the amber PARTLY stamp.'},
    {ch:'용의자 4 · Ondo', how:'The RALLY train leaves, then the camera pans with the Ondo hamster as it arrives late and the red TOO LATE stamp lands.'},
    {ch:'공범 · 시장 전체', how:'Accomplice posters roll their counters, then cardboard waves rise with 3D water spray under a Dutch-angle roll.'},
    {ch:'최종 판결', how:'The podium sweeps past, the curtains close with one confetti burst, and a one-line summary card slams in while Uchay bows, antennae swinging. The CASE CLOSED stamp and the finale coin shower are dropped here so the takeaway stays readable.'}
  ];
  const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const beatsEl = $('beats');
  BEATS.forEach(bt => {
    const ch = CHAP.find(c => c.ch === bt.ch);
    const segs = SEG.filter(g => g.ch === bt.ch);
    const card = document.createElement('article'); card.className = 'beat';
    const th = document.createElement('div'); th.className = 'thumbs';
    segs.slice(0, 2).forEach(g => { tl.seek(g.m0 + (g.m1 - g.m0)*.8); frame(g.m0 + (g.m1 - g.m0)*.8, 12); th.appendChild(snapshot()); });
    const cues = CUT_CUES.filter(q => q.t >= ch.c0 - .05 && q.t < ch.c1);
    const pops = POPS.filter(p => p.t >= ch.c0 && p.t < ch.c1);
    const txt = document.createElement('div');
    txt.innerHTML = `<h3>${esc(bt.ch)}<small>${fmtT(ch.c0)}–${fmtT(ch.c1)} · ${(ch.c1 - ch.c0).toFixed(1)}s</small></h3>` +
      cues.map(q => `<p class="vo">“${esc(q.s)}”<span class="ko">${esc(q.ko)}</span></p>`).join('') +
      `<div class="pops">${pops.map(p => `<span>${p.h.replace(/<[^>]+>/g, '')}</span>`).join('')}</div>` +
      `<p class="how">${esc(bt.how)}</p>`;
    card.append(th, txt);
    beatsEl.appendChild(card);
  });

  // ---------- Scorecard ----------
  const SCORE = window.__SCORE || [];
  const tbl = $('scoreTable');
  if (SCORE.length){
    const v1 = SCORE.reduce((a, r) => a + r.v1, 0), v2 = SCORE.reduce((a, r) => a + r.v2, 0);
    tbl.innerHTML = '<thead><tr><th>Criterion</th><th>Cut 1</th><th>Rebuilt</th><th>What was weak → what I rebuilt</th></tr></thead><tbody>' +
      SCORE.map(r => `<tr><td><b>${esc(r.k)}</b><span class="ko">${esc(r.ko)}</span></td><td class="n${r.v1 <= 6 ? ' low' : ''}">${r.v1}</td><td class="n${r.v2 > r.v1 ? ' up' : ''}">${r.v2}</td><td>${esc(r.note)}</td></tr>`).join('') +
      `</tbody><tfoot><tr><td>Total</td><td class="n">${v1}/100</td><td class="n up">${v2}/100</td><td></td></tr></tfoot>`;
  }

  // ---------- Start ----------
  setVoice(false);
  voiceBtn.textContent = synth ? 'Voice off' : 'Voice unavailable';
  cutSeek(rm ? 1.2 : 0.01);
  requestAnimationFrame(cutLoop);
