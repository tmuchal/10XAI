  // ---------- 30-second cut: an edit list over the master timeline ----------
  // Each segment plays a slice of the full show [m0, m1] in d seconds of cut time.
  const SEG = [
    {m0:0,    m1:4.5,  d:4.5, ch:'MOU?'},
    {m0:4.5,  m1:10,   d:5.5, ch:'무엇이 나왔나', fly:'출시|9월 24일'},
    {m0:10,   m1:16,   d:6.0, ch:'작동 방식', fly:'작동|방식'},
    {m0:16,   m1:21,   d:5.0, ch:'역할 분담', fly:'역할|분담'},
    {m0:21,   m1:24.5, d:3.5, ch:'투자 대상', fly:'누가|살 수 있나'},
    {m0:24.5, m1:28,   d:3.5, ch:'시장 반응', fly:'시장|반응'},
    {m0:28,   m1:31,   d:3.0, ch:'판결', fly:'판결|한 줄 요약'}
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
    [0.2,  "Ondo and BlackRock signed an MOU? Not quite.", "온도와 블랙록이 MOU를 맺었다? 정확히는 아닙니다."],
    [4.6,  "On September 24th, Ondo launched three portfolio tokens built on BlackRock strategies.", "9월 24일, 온도가 블랙록 전략 기반 포트폴리오 토큰 3종을 출시했습니다."],
    [10.1, "One token holds a whole basket of stock, bond and bitcoin ETFs. Mint or redeem around the clock.", "토큰 하나에 주식·채권·비트코인 ETF 바구니가 통째로. 24시간 발행·환매."],
    [16.1, "BlackRock only supplies the model. Ondo issues, tokenizes and runs everything.", "블랙록은 모델만 제공. 발행·토큰화·운영은 모두 온도 몫."],
    [21.1, "And it's for non-US investors only.", "그리고 미국 외 투자자 전용입니다."],
    [24.6, "Still, ONDO jumped about 18% in a day.", "그래도 ONDO는 하루 만에 약 18% 급등."],
    [28.1, "Verdict: a product deal, not an MOU. Not investment advice.", "판결: MOU가 아닌 상품 제휴. 투자 조언은 아닙니다."]
  ].map(([t, s, ko]) => ({t, s, ko}));

  // Korean variety-show pop captions: text (HTML), cut time, duration, x%, y%, tilt, size class
  const POPS = [
    {t:0.35, d:2.4, x:50, y:15, r:-3, cls:'big', h:'온도 × 블랙록 <em>MOU?</em>'},
    {t:3.25, d:1.2, x:70, y:18, r:5,  cls:'',    h:'<b>정확히는 아님</b>'},
    {t:4.8,  d:1.7, x:36, y:18, r:-4, cls:'',    h:'<em>9월 24일</em> 출시'},
    {t:6.6,  d:1.4, x:58, y:36, r:4,  cls:'',    h:'토큰 <em>3종</em>'},
    {t:8.1,  d:1.8, x:58, y:36, r:-3, cls:'sm',  h:'인컴 · 분산 성장 · 고성장'},
    {t:10.3, d:1.6, x:52, y:15, r:-3, cls:'',    h:'토큰 <em>1개</em> = 바구니 통째로'},
    {t:13.6, d:1.3, x:62, y:30, r:4,  cls:'sm',  h:'<em>24시간</em> 발행·환매'},
    {t:15.0, d:1.0, x:50, y:40, r:-3, cls:'sm',  h:'리밸런싱 <em>온체인 공개</em>'},
    {t:16.4, d:1.7, x:40, y:13, r:-4, cls:'',    h:'블랙록 = <em>모델만</em>'},
    {t:18.2, d:1.6, x:74, y:13, r:4,  cls:'',    h:'나머지는 전부 <b>온도</b>'},
    {t:21.3, d:2.4, x:50, y:14, r:-3, cls:'',    h:'<b>미국 외</b> 투자자 전용'},
    {t:25.0, d:1.6, x:64, y:14, r:-4, cls:'',    h:'ONDO 하루 <b>+18%</b>'},
    {t:26.3, d:1.5, x:50, y:56, r:4,  cls:'sm',  h:'블랙록 모델 자산 <em>9.8조 달러</em>'}
  ];

  CUT = {cues:CUT_CUES, fx:{cube:null, cap:99}};
  plaqueG.parentNode.setAttribute('display', 'none');
  closedStamp.parentNode.setAttribute('display', 'none');
  footer.setAttribute('display', 'none');
  const endCard = $('endCard'), END_T = 28.7;
  const kpops = $('kpops'), kchap = $('kchap'), kprog = $('kprog'), cutflash = $('cutflash');
  POPS.forEach(p => { p.el = document.createElement('div'); p.el.className = 'kpop ' + p.cls; p.el.innerHTML = p.h; p.el.style.opacity = 0; kpops.appendChild(p.el); });
  CHAP.forEach(c => { const sp = document.createElement('span'); sp.appendChild(document.createElement('i')); kprog.appendChild(sp); c.bar = sp.firstChild; });
  const easeBack = q => 1 + 2.7*Math.pow(q - 1, 3) + 1.7*Math.pow(q - 1, 2);

  // Sound events on the cut clock
  const EV = [];
  BOUNDS.forEach(b => EV.push({c:b.c - (b.big ? .3 : 0), kind:b.big ? 'whoosh' : 'pop'}));
  STAMPS.forEach(st => { const c = cutOf(st.t + .22); if (c != null) EV.push({c, kind:'thump'}); });
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

  // ---------- Playback ----------
  const cueIdx = c => { let i = -1; CUT_CUES.forEach((q, j) => { if (q.t <= c) i = j; }); return i; };
  let lastW = performance.now()/1000, cutPrev = 0, holdAcc = 0;
  function cutLoop(){
    const w = performance.now()/1000, dt = Math.min(.1, w - lastW); lastW = w;
    if (cutPlaying){
      let adv = dt;
      if (voiceOn && speaking && spokenIdx >= 0){
        const nx = CUT_CUES[spokenIdx + 1], lim = nx ? nx.t - .05 : CUT_D;
        if (cutT + adv >= lim && holdAcc < 1.4){ adv = Math.max(0, lim - cutT); holdAcc += dt; }
      }
      cutT = Math.min(CUT_D, cutT + adv);
      if (voiceOn){ const i = cueIdx(cutT); if (i >= 0 && i !== spokenIdx && cutT - CUT_CUES[i].t < .6){ holdAcc = 0; say(CUT_CUES[i].s, i); } }
      EV.forEach(e => { if (cutPrev < e.c && cutT >= e.c) sfx(e.kind); });
      if (cutT >= CUT_D){ cutPlaying = false; playBtn.textContent = 'Replay'; }
    }
    if (!window.__freeze) renderCut(cutT, w);
    cutPrev = cutT;
    requestAnimationFrame(cutLoop);
  }
  function cutSeek(c){ stopVoice(); cutT = Math.max(0, Math.min(CUT_D, c)); cutPrev = cutT; spokenIdx = cueIdx(cutT - .6); holdAcc = 0; renderCut(cutT, performance.now()/1000); }
  function cutPlay(p){
    cutPlaying = p; playBtn.textContent = p ? 'Pause' : 'Play';
    if (synth){ if (p && synth.paused) synth.resume(); if (!p && speaking) synth.pause(); }
  }
  window.__cut = {seek:cutSeek, play:cutPlay, render:(c, talk) => { cutT = c; cutPrev = c; if (talk != null){ voiceOn = true; speaking = !!talk; } renderCut(c, c); }, dur:CUT_D, cues:CUT_CUES, events:() => EV.map(e => ({c:e.c, kind:e.kind}))};
  playBtn.addEventListener('click', () => {
    $('startOv').hidden = true;
    if (cutT >= CUT_D){ cutSeek(0); cutPlay(true); return; }
    cutPlay(!cutPlaying);
  });
  $('restartBtn').addEventListener('click', () => { $('startOv').hidden = true; cutSeek(0); cutPlay(true); });
  voiceBtn.addEventListener('click', () => setVoice(!voiceOn));
  $('startVoice').addEventListener('click', () => { setVoice(true); $('startOv').hidden = true; cutSeek(0); cutPlay(true); });
  $('startSilent').addEventListener('click', () => { setVoice(false); $('startOv').hidden = true; cutSeek(0); cutPlay(true); });
  scrub.max = CUT_D.toFixed(2);
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
    {ch:'MOU?', how:'A title sign drops in front of closed curtains, which then part to show an "MOU?" contract between an Ondo hamster and a BlackRock hamster. They shuffle in for a handshake, and a red NOT AN MOU stamp slams onto the contract.'},
    {ch:'무엇이 나왔나', how:'A whip pan and a 3D Uchay fly-by, then three portfolio coins (BLKHIon, BLKDIGon, BLKGRWon) bounce onto wooden pedestals under a SEP 24 calendar. 3D coins and confetti burst.'},
    {ch:'작동 방식', how:'Stock, bond and BTC ETF blocks rise from a woven basket, then fly along a dashed arrow into a single gold "1 TOKEN" coin as the camera pushes in. A 24/7 clock spins.'},
    {ch:'역할 분담', how:'A split stage: the BlackRock hamster holds up a MODEL blueprint under a "✗ issue ✗ custody ✗ operate" note, while the Ondo hamster works a TOKENIZER machine with spinning gears. An amber LIMITED ROLE stamp lands.'},
    {ch:'투자 대상', how:'A globe pops in, a red no-entry sign covers the US, and green checks tick on the rest. A slow push-in follows.'},
    {ch:'시장 반응', how:'A hamster pumps the ONDO PRICE thermometer from $0.42 to $0.50, a coin tower rises under the $9.8T sign, and a green +18% arrow pops. 3D coin rain falls.'},
    {ch:'판결', how:'The curtains close, a one-line summary card slams in, and Uchay bows with the antennae swinging.'}
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
