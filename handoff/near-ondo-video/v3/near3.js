window.VIDEO.scenes = function(A){
  const {T, E, panel, show, stagger, drawLines, growBars, reveal, count, stamp, kpop, burst, bubble, lineChart, barChart, gauge, needle, camTo, camReset} = A;
  const money = v => '$' + v.toFixed(2);

  // ---------- opening ----------
  { const t0 = T('hook1'), t1 = E('hook1');
    const p = panel(`<div class="ttl">NEAR Protocol <small>Sep 14 → Sep 23, 2026</small></div>
      <div class="big">$2.20 <span class="sub" style="font-size:.4em">→</span> <span class="red cnt">$4.29</span></div>
      ${lineChart({w:760, h:220, min:2, max:4.5, fmt:v => '$' + v, grid:[2, 3, 4], pts:[['9/14', 2.2], ['', 2.35], ['', 2.48], ['9/17', 2.87], ['', 3.05], ['', 3.2], ['9/20', 3.45], ['', 3.8], ['', 4.05], ['9/23', 4.29]], labels:[0, 3, 6, 9], area:'#F4A7A0', color:'#C8372D'})}
      <div class="sub">reported closes on 9/14, 9/17, 9/20, 9/23 · line between them is illustrative</div>`, {x:22, y:14, w:56});
    show(p, t0 + .2, t1);
    count('.cnt', p, t0 + .5, t0 + 2.5, 2.2, 4.29, money);
    drawLines(p, t0 + .5, 2.2);
    stamp('+95%', t0 + 2.6, t1, {x:64, y:18, color:'#2E7D3E', rot:-10});
    burst(t0 + 2.7, 62, 30, 90);
    kpop('9일 만에 <em>2배</em>', t0 + 3.1, 2.4, 50, 73, {size:.8});
    camTo(t0 + .2, {s:1.04}, 3); camReset(t1 - .4);
  }
  { const t0 = T('hook2'), t1 = E('hook2');
    const p = panel(`<div class="grid3">
      <div class="scn" style="background:#FFF1B8"><h4>① 차트</h4><p>가격 흐름을 숫자로</p><p class="sub">Chart</p></div>
      <div class="scn" style="background:#E3F6E6"><h4>② 팩트체크</h4><p>주장마다 출처 확인</p><p class="sub">Claims</p></div>
      <div class="scn" style="background:#E4F1FF"><h4>③ 미래</h4><p>AI · 인텐트 · 투자 관점</p><p class="sub">Future</p></div></div>`, {x:20, y:22, w:60, tape:false});
    show(p, t0 + .1, t1);
    stagger(p, '.scn', t0 + .3, .35);
    bubble('uchay', '숫자로만 가자!', t0 + 1.2, t1);
  }

  // ---------- chapter 1: price action ----------
  { const t0 = T('pa1'), t1 = E('pa3');
    const pts = [['9/10', 2.15], ['', 2.22], ['', 2.18], ['', 2.25], ['9/14', 2.2], ['', 2.35], ['', 2.48], ['9/17', 2.87], ['', 3.05], ['', 3.2], ['9/20', 3.45], ['', 3.8], ['', 4.05], ['9/23', 4.29], ['9/24', 4.18]];
    let svg = lineChart({w:900, h:420, min:1.8, max:4.6, fmt:v => '$' + v, grid:[2, 2.5, 3, 3.5, 4, 4.5], pts, labels:[0, 4, 7, 10, 13], area:'#F9C7BE', color:'#C8372D',
      bands:[{lo:3.8, hi:3.9, fill:'#FFE3A1', label:'$3.80–3.90 전 저항 → 지지?', ink:'#9A6A10'}],
      marks:[{i:7, text:'+14% 스냅샷', color:'#C8372D', dy:-22}, {i:10, text:'3일 +45%', color:'#2E7D3E', dy:-24, dx:-20}, {i:13, text:'$4.29', color:'#C8372D', dy:-20}]});
    svg = svg.replace('</svg>', '<path class="trend" d="M80 40 L520 240" stroke="#7A6A5C" stroke-width="4" stroke-dasharray="12 9" fill="none"/><text class="trend" x="90" y="34" font-size="18" fill="#7A6A5C" font-family="Gaegu, sans-serif" font-weight="700">수년간의 하락 추세선</text></svg>');
    const p = panel(`<div class="ttl">NEAR / USD · 일별 흐름 <small>daily, Sep 10–24 · key reported prices marked</small></div>${svg}`, {x:19, y:12, w:62});
    show(p, t0 + .1, t1);
    const path = p.querySelector('.drawp'), len = path.getTotalLength(); path.setAttribute('stroke-dasharray', len);
    A.tl.fromTo(path, {attr:{'stroke-dashoffset':len}}, {attr:{'stroke-dashoffset':len*.5}, duration:2.2, ease:'power1.inOut'}, t0 + .4);
    A.tl.fromTo(path, {attr:{'stroke-dashoffset':len*.5}}, {attr:{'stroke-dashoffset':len*.25}, duration:1.4, immediateRender:false}, T('pa2') + .2);
    A.tl.fromTo(path, {attr:{'stroke-dashoffset':len*.25}}, {attr:{'stroke-dashoffset':0}, duration:1.4, immediateRender:false}, T('pa2') + 1.8);
    const marks = p.querySelectorAll('.mark');
    A.tl.fromTo(marks[0], {opacity:0}, {opacity:1, duration:.3}, t0 + 2.6);
    A.tl.fromTo(marks[1], {opacity:0}, {opacity:1, duration:.3}, T('pa2') + 1.6);
    A.tl.fromTo(marks[2], {opacity:0}, {opacity:1, duration:.3}, T('pa2') + 3.2);
    p.querySelectorAll('.trend').forEach(x => A.tl.fromTo(x, {opacity:0}, {opacity:1, duration:.4}, T('pa2') + .3));
    const band = p.querySelector('svg rect'); const bandT = p.querySelectorAll('svg text');
    A.tl.fromTo(band, {opacity:0}, {opacity:.55, duration:.4}, T('pa3') + .2);
    A.tl.fromTo(p.querySelectorAll('.areap'), {opacity:0}, {opacity:.35, duration:1}, t0 + .6);
    kpop('스냅샷 당일 <b>+14%</b>', t0 + 3, 2, 70, 16, {size:.75});
    kpop('추세선 <i>돌파!</i>', T('pa2') + 1.2, 2.2, 36, 16, {size:.8});
    kpop('천장 → <em>바닥</em>?', T('pa3') + 1, 2.2, 66, 16, {size:.8});
    camTo(T('pa2') + .1, {s:1.12, x:-4, y:3}, 1.2); camReset(T('pa3') + .2, 1);
  }
  { const t0 = T('pa4'), t1 = E('pa4');
    const p = panel(`<div class="ttl">최고가와 비교 <small>all-time high vs now</small></div>${barChart({w:700, h:330, max:21, items:[{l:'최고가 2022.1', s:'ATH, Jan 16 2022', v:20.44, t:'$20.44', c:'#CFE3FB'}, {l:'9월 23일', s:'Sep 23, 2026', v:4.29, t:'$4.29', c:'#F9B8AE'}]})}`, {x:26, y:14, w:48});
    show(p, t0 + .1, t1); growBars(p, t0 + .4, .5);
    stamp('-79%', t0 + 2.4, t1, {x:58, y:36, color:'#B3261E', rot:8});
    bubble('noa', '멀리 보면 아직 바닥권', t0 + .8, t1);
  }

  // ---------- chapter 2: drivers ----------
  { const t0 = T('dr1'), t1 = E('dr2');
    const p = panel(`<div class="ttl">용의자 1 · NEAR@3.33 인센티브 <small>confidential deposits crossed the trigger on Sep 17</small></div>
      <div class="grid2" style="align-items:center">
        <div><div class="sub">비공개 예치금 (Confidential TVL)</div><div class="big red cnt">$0M</div><div class="sub">트리거 $70M · 9/17 스냅샷</div></div>
        ${gauge({max:80, zones:[{a:0, b:70, c:'#BFE8C4'}, {a:70, b:80, c:'#F9B8AE'}]})}
      </div>`, {x:17, y:13, w:40});
    show(p, t0 + .1, t1);
    count('.cnt', p, t0 + .5, t0 + 3, 0, 70.8, v => '$' + v.toFixed(1) + 'M');
    needle(p, t0 + .5, 0, 70.8, 80);
    const q = panel(`<div class="ttl">보상 구조 = 콜옵션 <small>payoff of one reward token</small></div>
      <svg viewBox="0 0 520 260"><path d="M40 220 H500 M40 220 V20" stroke="#2A1E1A" stroke-width="3" fill="none"/>
      <path class="drawp" d="M40 214 L250 214 L250 120 L500 40" stroke="#2E7D3E" stroke-width="7" fill="none" stroke-linejoin="round"/>
      <line x1="250" x2="250" y1="30" y2="220" stroke="#C8372D" stroke-width="3" stroke-dasharray="8 7"/>
      <text x="258" y="46" font-size="22" fill="#C8372D" font-family="Jua, sans-serif">$3.33 (3일 평균가)</text>
      <text x="60" y="200" font-size="19" fill="#7A6A5C" font-family="Gaegu, sans-serif" font-weight="700">잠김 = 0</text>
      <text x="360" y="120" font-size="19" fill="#2E7D3E" font-family="Gaegu, sans-serif" font-weight="700">1:1 NEAR로 전환</text>
      <text x="270" y="250" font-size="18" fill="#7A6A5C" font-family="IBM Plex Mono, monospace">NEAR price →</text></svg>
      <div class="sub">333,333 tokens · ≥$100 private balance + 1 swap · max 2% per wallet</div>`, {x:55, y:30, w:30, rot:2, pink:true});
    show(q, T('dr2') + .1, t1, 'right');
    drawLines(q, T('dr2') + .6, 1.6);
    kpop('모두가 <em>상승</em>을 원함', T('dr2') + 2.6, 2.2, 36, 72, {size:.75});
  }
  { const t0 = T('dr3'), t1 = E('dr3');
    const p = panel(`<div class="ttl">용의자 2 · 실사용 <small>NEAR Intents</small></div><div class="sub">누적 거래 (Dune)</div><div class="big navy cnt">$0B</div><div class="sub">public $29.5B · confidential $1.9B (6%)</div>`, {x:18, y:15, w:28});
    const q = panel(`<div class="ttl">주간 체인 수수료 <small>weekly fees</small></div>${barChart({w:520, h:300, max:2.2, items:[{l:'9/7–13', v:1, t:'≈$1M', c:'#E4DCCD'}, {l:'9/14–20', v:2, t:'≈$2M', c:'#BFE8C4'}]})}`, {x:50, y:15, w:32, rot:1.5});
    show(p, t0 + .1, t1, 'left'); show(q, t0 + 1.2, t1, 'right');
    count('.cnt', p, t0 + .4, t0 + 2.6, 0, 31.4, v => '$' + v.toFixed(1) + 'B');
    growBars(q, t0 + 1.6, .4);
    kpop('수수료 <b>2배</b>', t0 + 3.2, 2, 66, 70, {size:.8});
  }
  { const t0 = T('dr4'), t1 = E('dr4');
    const p = panel(`<div class="ttl">용의자 3 · 시장 전체 <small>market-wide tailwinds</small></div><div class="grid2">
      <div class="scn" style="background:#FFE6EC"><h4>BTC 숏스퀴즈</h4><div class="big red cnt">$0M</div><p>9/21 청산 · BTC $85K 돌파</p></div>
      <div class="scn" style="background:#FFF1B8"><h4>프라이버시 코인</h4><div class="big amb cnt2">$0</div><p>지캐시 사상 최고 · 9/23</p></div></div>`, {x:22, y:15, w:56});
    show(p, t0 + .1, t1);
    count('.cnt', p, t0 + .5, t0 + 2.4, 0, 648, v => '$' + Math.round(v) + 'M');
    count('.cnt2', p, t0 + 1.6, t0 + 3.4, 0, 1600, v => '$' + Math.round(v).toLocaleString('en-US'));
    burst(t0 + 2.4, 40, 40, 50);
  }
  { const t0 = T('dr5'), t1 = E('dr5');
    const p = panel(`<div class="ttl">종합: 상승의 구조 <small>how the pieces fit</small></div>
      <div class="flow"><div class="node" style="background:#FFE3A1">인센티브<small>불씨 · spark</small></div><div class="arrow">＋</div><div class="node" style="background:#BFE8C4">실사용<small>연료 · fuel</small></div><div class="arrow">＋</div><div class="node" style="background:#CFE3FB">시장 파도<small>바람 · wind</small></div><div class="arrow">=</div><div class="node" style="background:#F9B8AE">+95%<small>9 days</small></div></div>
      <div class="rows" style="margin-top:1cqw">
        <div class="row"><span class="k">높음</span><span class="v">NEAR@3.33 트리거<small>timing matches Sep 17</small></span><span class="chip ok">강함</span></div>
        <div class="row"><span class="k">중상</span><span class="v">BTC 스퀴즈 · 프라이버시 테마<small>same week</small></span><span class="chip ok">강함</span></div>
        <div class="row"><span class="k">중간</span><span class="v">인텐트 사용량 · 수수료<small>real demand</small></span><span class="chip ok">강함</span></div>
        <div class="row"><span class="k">낮음</span><span class="v">TVL · Ondo 제휴<small>effect / too late</small></span><span class="chip md">약함</span></div></div>`, {x:18, y:12, w:64});
    show(p, t0 + .1, t1);
    stagger(p, '.node, .arrow', t0 + .3, .18);
    stagger(p, '.row', t0 + 1.8, .3);
  }

  // ---------- chapter 3: fact check board ----------
  { const t0 = T('fc1'), t1 = E('fc5');
    const rows = [['fc1', '일주일 +80%', 'Cointelegraph · CoinCentral', 'ok', '사실'], ['fc2', 'TVL $350M+', '달러 표시 → 가격이 부풀림', 'md', '부풀림'], ['fc3', '거래량 +120%', '출처 불명', 'no', '미확인'], ['fc4', '선물 출시가 원인', '출시일 17일 vs 21일', 'md', '불분명'], ['fc5', 'Ondo 제휴가 원인', '9/23 발표 · 상승 후', 'no', '늦음']];
    const p = panel(`<div class="ttl">팩트체크 보드 <small>claim → evidence → status</small></div><div class="rows">${rows.map(r => `<div class="row fr"><span class="k">${r[1]}</span><span class="v">${r[2]}</span><span class="chip ${r[3]}">${r[4]}</span></div>`).join('')}</div>`, {x:20, y:12, w:60});
    show(p, t0 + .1, t1);
    const rs = p.querySelectorAll('.fr');
    rows.forEach((r, i) => A.tl.fromTo(rs[i], {autoAlpha:0, x:-40}, {autoAlpha:1, x:0, duration:.4, ease:'back.out(1.8)'}, T(r[0]) + .4));
    stamp('사실', T('fc1') + 2.2, E('fc1'), {x:66, y:62, color:'#2E7D3E'});
    stamp('미확인', T('fc3') + 2, E('fc3'), {x:64, y:62, color:'#B3261E'});
    stamp('늦음', T('fc5') + 1.6, E('fc5'), {x:66, y:62, color:'#B3261E'});
    const loop = panel(`<div class="flow"><div class="node">가격 ↑</div><div class="arrow">→</div><div class="node">예치 NEAR 가치 ↑</div><div class="arrow">→</div><div class="node" style="background:#FFE3A1">TVL ↑</div></div>`, {x:26, y:68, w:48, tape:false, cls:'yellow'});
    show(loop, T('fc2') + 2.4, E('fc2'));
  }

  // ---------- chapter 4: supply ----------
  { const t0 = T('tk1'), t1 = E('tk3');
    const p = panel(`<div class="ttl">연간 인플레이션 <small>max annual issuance</small></div>${barChart({w:520, h:300, max:5.5, items:[{l:'~2025.10', v:5, t:'5%', c:'#F9B8AE'}, {l:'2025.10.30 이후', v:2.5, t:'2.5%', c:'#BFE8C4', s:'≈32M NEAR / yr'}]})}`, {x:18, y:13, w:32});
    show(p, t0 + .1, t1); growBars(p, t0 + .5, .6);
    kpop('발행량 <em>반토막</em>', t0 + 2.2, 2.2, 36, 72, {size:.8});
    const q = panel(`<div class="ttl">수수료가 가는 곳 <small>where fees go</small></div>
      <div class="flow"><div class="node">기본 가스비<small>base gas</small></div><div class="arrow">→</div><div class="node" style="background:#F9B8AE">70% 소각<small>burned</small></div></div>
      <div class="flow" style="margin-top:.8cqw"><div class="node">인텐트 수수료<small>Intents fees</small></div><div class="arrow">→</div><div class="node" style="background:#BFE8C4">NEAR 매수<small>market buy</small></div></div>`, {x:53, y:13, w:30, rot:1.5, pink:true});
    show(q, T('tk2') + .1, t1, 'right'); stagger(q, '.node, .arrow', T('tk2') + .4, .2);
    const g = panel(`<div class="ttl">소각 vs 신규 발행 <small>September pace, rough estimate</small></div>${gauge({max:100, zones:[{a:0, b:100, c:'#EADBC4'}, {a:100, b:100, c:'#BFE8C4'}]})}<div class="sub" style="text-align:center">소각 &lt; 발행 → 순공급 증가 (추정)</div>`, {x:53, y:50, w:30, tape:false, cls:'yellow'});
    show(g, T('tk3') + .2, t1); needle(g, T('tk3') + .6, 0, 45, 100);
    kpop('아직 <b>순증가</b>', T('tk3') + 2.4, 2, 36, 72, {size:.8});
  }

  // ---------- chapter 5: future ----------
  { const t0 = T('fu1'), t1 = E('fu1');
    const p = panel(`<div class="grid2"><div class="scn" style="background:#E4F1FF"><h4>인텐트 Intents</h4><p>원하는 '결과'만 말하면<br>솔버가 최적 경로로 실행</p><p class="sub">chain abstraction · unified liquidity</p></div>
      <div class="scn" style="background:#EEE3FB"><h4>사용자 소유 AI</h4><p>내 데이터·내 에이전트는<br>내가 소유</p><p class="sub">User-owned AI · NEAR AI</p></div></div>`, {x:20, y:18, w:60, tape:false});
    show(p, t0 + .1, t1); stagger(p, '.scn', t0 + .4, .5);
  }
  { const t0 = T('fu2'), t1 = E('fu2');
    const p = panel(`<div class="ttl">AI 에이전트 × 인텐트 <small>how an agent would trade</small></div>
      <div class="flow"><div class="node" style="background:#EEE3FB">AI 에이전트<small>"USDC→SOL, 최저가"</small></div><div class="arrow">→</div><div class="node">인텐트<small>intent</small></div><div class="arrow">→</div><div class="node" style="background:#FFE3A1">솔버 경쟁<small>solvers bid</small></div><div class="arrow">→</div><div class="node" style="background:#BFE8C4">35+ 체인 실행<small>any chain</small></div></div>
      <svg viewBox="0 0 900 60" style="margin-top:.6cqw"><line x1="40" x2="860" y1="30" y2="30" stroke="#C9B79A" stroke-width="4" stroke-dasharray="10 10"/><circle class="token" cx="40" cy="30" r="16" fill="#F8C94A" stroke="#2A1E1A" stroke-width="3"/></svg>`, {x:17, y:18, w:66});
    show(p, t0 + .1, t1); stagger(p, '.node, .arrow', t0 + .3, .25);
    A.tl.fromTo(p.querySelector('.token'), {attr:{cx:40}}, {attr:{cx:860}, duration:2.6, ease:'power1.inOut'}, t0 + 2.2);
    kpop('결과만 <em>말하면 끝</em>', t0 + 1.6, 2.2, 50, 70, {size:.8});
  }
  { const t0 = T('fu3'), t1 = E('fu3');
    const p = panel(`<div class="ttl">비공개 실행 (TEE) <small>confidential compute</small></div>
      <svg viewBox="0 0 700 250"><rect x="230" y="40" width="240" height="170" rx="20" fill="#EEE3FB" stroke="#2A1E1A" stroke-width="4"/>
      <path d="M300 40 V14 Q350 -14 400 14 V40" fill="none" stroke="#2A1E1A" stroke-width="8"/>
      <text x="350" y="120" text-anchor="middle" font-size="30" fill="#6B53A8" font-family="Jua, sans-serif">AI 모델 연산</text>
      <text x="350" y="160" text-anchor="middle" font-size="20" fill="#2A1E1A" font-family="Gaegu, sans-serif" font-weight="700">데이터는 계속 암호화</text>
      <g class="pkt"><rect x="30" y="110" width="120" height="44" rx="10" fill="#FFF1B8" stroke="#2A1E1A" stroke-width="3"/><text x="90" y="140" text-anchor="middle" font-size="20" font-family="IBM Plex Mono, monospace">#9f2a…</text></g>
      <g class="pkt2"><rect x="550" y="110" width="120" height="44" rx="10" fill="#BFE8C4" stroke="#2A1E1A" stroke-width="3"/><text x="610" y="140" text-anchor="middle" font-size="20" font-family="IBM Plex Mono, monospace">#c71e…</text></g></svg>`, {x:24, y:14, w:52});
    show(p, t0 + .1, t1);
    A.tl.fromTo(p.querySelector('.pkt'), {x:-60, opacity:0}, {x:0, opacity:1, duration:.6}, t0 + .8);
    A.tl.fromTo(p.querySelector('.pkt2'), {x:-60, opacity:0}, {x:0, opacity:1, duration:.6}, t0 + 2.4);
  }
  { const t0 = T('fu4'), t1 = E('fu4');
    const p = panel(`<div class="grid3"><div class="scn"><h4 class="big navy" style="font-size:max(22px,4.6cqw)">9</h4><p>샤드 (6 → 9)</p><p class="sub">shards in 2025</p></div>
      <div class="scn"><h4 class="mid grn">동적</h4><p>리샤딩</p><p class="sub">dynamic resharding</p></div>
      <div class="scn"><h4 class="big red cnt" style="font-size:max(20px,3.6cqw)">0</h4><p>TPS 공개 테스트</p><p class="sub">public test, live core code</p></div></div>`, {x:20, y:20, w:60, tape:false});
    show(p, t0 + .1, t1); stagger(p, '.scn', t0 + .3, .4);
    count('.cnt', p, t0 + 1.2, t0 + 3, 0, 1000000, v => Math.round(v).toLocaleString('en-US'));
  }
  { const t0 = T('fu5'), t1 = E('fu5');
    const p = panel(`<div class="mid" style="text-align:center">AI 에이전트에게 필요한 레일</div><div class="flow" style="margin-top:1cqw"><div class="node" style="background:#BFE8C4">싸다<small>cheap</small></div><div class="node" style="background:#EEE3FB">비공개<small>private</small></div><div class="node" style="background:#CFE3FB">체인 초월<small>cross-chain</small></div></div>`, {x:24, y:22, w:52, cls:'yellow'});
    show(p, t0 + .1, t1); stagger(p, '.node', t0 + .6, .35);
    camTo(t0 + .1, {s:1.06}, 2); camReset(t1 - .5);
  }

  // ---------- chapter 6: scenarios ----------
  { const t0 = T('sc1'), t1 = E('sc4');
    const p = panel(`<div class="grid3">
      <div class="scn s1" style="background:#E3F6E6"><h4 class="grn">강세 Bull</h4><p>인텐트 거래량·수수료 복리 성장</p><p>AI 에이전트가 실사용자로</p></div>
      <div class="scn s2" style="background:#FFF1B8"><h4 class="amb">기본 Base</h4><p>인센티브 사이클 종료</p><p>$3.33~3.90 구간 시험</p></div>
      <div class="scn s3" style="background:#FFE6EC"><h4 class="red">약세 Bear</h4><p>보상 전환 후 매도</p><p>예치금 이탈 · 시장 하락</p></div></div>`, {x:18, y:14, w:64, tape:false});
    show(p, t0 + .1, T('sc4'));
    ['sc1', 'sc2', 'sc3'].forEach((id, i) => A.tl.fromTo(p.querySelector('.s' + (i + 1)), {autoAlpha:0, y:30}, {autoAlpha:1, y:0, duration:.45, ease:'back.out(1.8)'}, T(id) + .3));
    const w = panel(`<div class="ttl">체크리스트 · 볼 숫자 4개 <small>what to watch</small></div><div class="rows">
      <div class="row"><span class="k">①</span><span class="v">주간 인텐트 거래량<small>weekly Intents volume</small></span><span class="chip info">Dune</span></div>
      <div class="row"><span class="k">②</span><span class="v">수수료<small>fees</small></span><span class="chip info">on-chain</span></div>
      <div class="row"><span class="k">③</span><span class="v">보상 이후 비공개 예치금<small>deposits after rewards</small></span><span class="chip md">retention</span></div>
      <div class="row"><span class="k">④</span><span class="v">$3.33 · 3일 평균가<small>3-day VWAP line</small></span><span class="chip no">key line</span></div></div>`, {x:22, y:14, w:56});
    show(w, T('sc4') + .1, E('sc4')); stagger(w, '.row', T('sc4') + .5, .45);
  }

  // ---------- chapter 7: verdict ----------
  { const t0 = T('v1'), t1 = E('v2');
    const p = panel(`<div class="ttl" style="text-align:center">판결 · 한 줄 요약</div><div class="mid" style="text-align:center">인센티브가 이끈 랠리,<br>그 아래엔 <span class="hl">커지는 실사용</span></div><div class="sub" style="text-align:center;margin-top:.6cqw">An incentive-led rally on top of real, growing usage · 투자 조언 아님</div>`, {x:24, y:16, w:52});
    show(p, t0 + .1, t1, 'drop');
    stamp('CASE CLOSED', t0 + 2.6, t1, {x:56, y:48, color:'#B3261E', rot:-8});
    burst(t0 + 2.8, 50, 78, 120);
  }
};
