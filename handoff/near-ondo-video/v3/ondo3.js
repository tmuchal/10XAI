window.VIDEO.scenes = function(A){
  const {T, E, panel, show, stagger, drawLines, growBars, reveal, count, stamp, kpop, burst, bubble, lineChart, barChart, gauge, needle, camTo, camReset} = A;

  // ---------- opening ----------
  { const t0 = T('o1'), t1 = E('o1');
    const p = panel(`<div class="ttl">속보? <small>headline, Sep 24</small></div><div class="mid">"블랙록 × 온도<br><span class="red">MOU 체결</span>"</div><div class="sub" style="margin-top:.6cqw">BlackRock and Ondo sign MOU?</div>`, {x:22, y:16, w:30, rot:-3, cls:'yellow'});
    show(p, t0 + .2, t1, 'drop');
    const q = panel(`<div class="ttl">MOU? <small>memorandum of understanding</small></div><svg viewBox="0 0 420 180"><line x1="30" x2="390" y1="40" y2="40" stroke="#C9B79A" stroke-width="6"/><line x1="30" x2="360" y1="72" y2="72" stroke="#C9B79A" stroke-width="6"/><line x1="30" x2="300" y1="104" y2="104" stroke="#C9B79A" stroke-width="6"/><text x="40" y="160" font-size="22" font-family="Gaegu, sans-serif" font-weight="700" fill="#7A6A5C">Ondo ______</text><text x="220" y="160" font-size="22" font-family="Gaegu, sans-serif" font-weight="700" fill="#7A6A5C">BlackRock ______</text></svg>`, {x:52, y:18, w:28, rot:2});
    show(q, t0 + .8, t1, 'right');
    stamp('확인 중…', t0 + 1.6, t1, {x:58, y:44, color:'#B7791F', rot:-6});
  }
  { const t0 = T('o2'), t1 = E('o2');
    const p = panel(`<div class="grid3"><div class="scn" style="background:#FFF1B8"><h4>① 무엇</h4><p>무엇이 출시됐나</p><p class="sub">what launched</p></div><div class="scn" style="background:#E4F1FF"><h4>② 어떻게</h4><p>토큰은 어떻게 작동하나</p><p class="sub">how it works</p></div><div class="scn" style="background:#E3F6E6"><h4>③ 의미</h4><p>금융·투자에 주는 의미</p><p class="sub">what it means</p></div></div>`, {x:20, y:22, w:60, tape:false});
    show(p, t0 + .1, t1); stagger(p, '.scn', t0 + .3, .35);
  }

  // ---------- chapter 1: what happened ----------
  { const t0 = T('a1'), t1 = E('a2');
    const p = panel(`<div class="ttl">보도자료 · PR Newswire <small>Sep 24, 2026</small></div><div class="mid">Ondo Intelligent Portfolios,<br><span class="navy">Powered by BlackRock</span></div>`, {x:20, y:14, w:44});
    show(p, t0 + .1, t1);
    const coins = panel(`<div class="grid3" style="text-align:center">
      ${[['BLKHIon', '인컴', 'High Income', '#F2C14E'], ['BLKDIGon', '분산 성장', 'Diversified Growth', '#6CC0C2'], ['BLKGRWon', '고성장', 'High Growth', '#F08A5D']].map(c => `<div class="coin"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" fill="${c[3]}" stroke="#2A1E1A" stroke-width="6"/><circle cx="100" cy="100" r="66" fill="none" stroke="#2A1E1A" stroke-width="3" stroke-dasharray="8 7" opacity=".5"/><text x="100" y="108" text-anchor="middle" font-size="28" font-family="Jua, sans-serif" fill="#2A1E1A">${c[0]}</text></svg><div class="mid" style="font-size:max(14px,2.1cqw)">${c[1]}</div><div class="sub">${c[2]}</div></div>`).join('')}</div>`, {x:26, y:40, w:48, tape:false});
    show(coins, T('a2') + .1, t1);
    coins.querySelectorAll('.coin').forEach((c, i) => A.tl.fromTo(c, {autoAlpha:0, y:-160}, {autoAlpha:1, y:0, duration:.7, ease:'bounce.out'}, T('a2') + .3 + i*.35));
    burst(T('a2') + 1.4, 50, 45, 70);
    kpop('토큰 <em>3종</em>', T('a2') + 1.6, 1.8, 70, 30, {size:.8});
  }
  { const t0 = T('a3'), t1 = E('a4');
    const p = panel(`<div class="ttl">누가 무엇을 하나 <small>who does what</small></div><div class="grid2">
      <div class="scn" style="background:#E4F1FF"><h4>블랙록</h4><p class="grn">✓ 모델 전략 제공</p><p class="red">✗ 발행 · ✗ 보관 · ✗ 운영</p><p class="sub">nondiscretionary model strategies</p></div>
      <div class="scn" style="background:#FFF1B8"><h4>온도</h4><p class="grn">✓ 발행 · ✓ 토큰화</p><p class="grn">✓ 보관 · ✓ 운영</p><p class="sub">issued by Ondo Global Markets</p></div></div>`, {x:18, y:13, w:50});
    show(p, t0 + .1, t1); stagger(p, '.scn', t0 + .4, .5);
    stamp('NOT AN MOU', t0 + 2.4, t1, {x:52, y:52, color:'#B3261E', rot:-8});
    const g = panel(`<div class="ttl">투자 가능 지역 <small>eligibility</small></div><svg viewBox="0 0 300 180"><circle cx="150" cy="90" r="78" fill="#D6ECF7" stroke="#2A1E1A" stroke-width="4"/><path d="M95 60 C110 40 140 45 145 65 C150 85 128 95 120 115 C112 130 98 128 92 112 C84 95 86 72 95 60 Z" fill="#CDE8C0" stroke="#2A1E1A" stroke-width="3"/><circle cx="118" cy="82" r="30" fill="none" stroke="#B3261E" stroke-width="7"/><line x1="97" y1="61" x2="139" y2="103" stroke="#B3261E" stroke-width="7"/><text x="190" y="80" font-size="22" font-family="Jua, sans-serif" fill="#2E7D3E">✓ 비미국</text><text x="190" y="110" font-size="18" font-family="Gaegu, sans-serif" font-weight="700" fill="#7A6A5C">허용 국가만</text></svg>`, {x:66, y:44, w:18, rot:3, pink:true});
    show(g, T('a4') + .2, t1, 'right');
  }

  // ---------- chapter 2: price ----------
  { const t0 = T('p1'), t1 = E('p3');
    const pts = [['9/17', .372], ['', .38], ['', .39], ['', .40], ['', .41], ['9/22', .415], ['9/23', .421], ['', .45], ['9/24', .497], ['', .523]];
    const p = panel(`<div class="ttl">ONDO / USD <small>around the launch · key reported prices marked, path illustrative</small></div>${lineChart({w:900, h:400, min:.34, max:.55, fmt:v => '$' + v.toFixed(2), grid:[.35, .4, .45, .5, .55], pts, labels:[0, 5, 6, 8], area:'#BFE8C4', color:'#2E7D3E', marks:[{i:6, text:'≈$0.42', color:'#7A6A5C', dy:24}, {i:8, text:'+18% · $0.50', color:'#2E7D3E', dy:-20}, {i:9, text:'+27%?', color:'#B7791F', dy:-20, anchor:'end', dx:-6}]})}`, {x:19, y:12, w:62});
    show(p, t0 + .1, t1);
    drawLines(p, t0 + .4, 2.4);
    const marks = p.querySelectorAll('.mark');
    A.tl.fromTo(marks[0], {opacity:0}, {opacity:1, duration:.3}, t0 + 1.2);
    A.tl.fromTo(marks[1], {opacity:0}, {opacity:1, duration:.3}, t0 + 2.6);
    A.tl.fromTo(marks[2], {opacity:0}, {opacity:1, duration:.3}, T('p2') + .6);
    A.tl.fromTo(p.querySelectorAll('.areap'), {opacity:0}, {opacity:.35, duration:1}, t0 + .6);
    kpop('하루 <i>+18%</i>', t0 + 2.8, 2, 30, 76, {size:.85});
    const v = panel(`<div class="ttl">24시간 거래대금 <small>24h volume</small></div><div class="big grn cnt">$0</div>`, {x:58, y:52, w:22, rot:2, cls:'mint'});
    show(v, T('p3') + .1, t1, 'right'); count('.cnt', v, T('p3') + .4, T('p3') + 2.2, 0, 1.09, x => '$' + x.toFixed(2) + 'B');
    camTo(t0 + .2, {s:1.06, y:2}, 2); camReset(T('p3'));
  }
  { const t0 = T('p4'), t1 = E('p4');
    const p = panel(`<div class="ttl">관건은 이것 <small>the real test</small></div><div class="flow"><div class="node" style="background:#FFE3A1">뉴스 급등<small>news spike</small></div><div class="arrow">→</div><div class="node">새 토큰에<br>자금 유입?<small>real inflows</small></div><div class="arrow">→</div><div class="node" style="background:#BFE8C4">지속<small>lasts</small></div></div><div class="flow" style="margin-top:.6cqw;justify-content:center"><div class="node" style="background:#F9B8AE;flex:0 0 40%">아니면 되돌림<small>or it fades</small></div></div>`, {x:22, y:18, w:56});
    show(p, t0 + .1, t1); stagger(p, '.node, .arrow', t0 + .3, .25);
  }

  // ---------- chapter 3: how it works ----------
  { const t0 = T('h1'), t1 = E('h3');
    const p = panel(`<div class="ttl">토큰 1개 안에 <small>one token, one basket</small></div><svg viewBox="0 0 900 360">
      <g class="blk b1"><rect x="40" y="60" width="170" height="80" rx="12" fill="#BFE8C4" stroke="#2A1E1A" stroke-width="4"/><text x="125" y="108" text-anchor="middle" font-size="28" font-family="Jua, sans-serif">주식 ETF</text></g>
      <g class="blk b2"><rect x="40" y="160" width="170" height="80" rx="12" fill="#CFE3FB" stroke="#2A1E1A" stroke-width="4"/><text x="125" y="208" text-anchor="middle" font-size="28" font-family="Jua, sans-serif">채권 ETF</text></g>
      <g class="blk b3"><rect x="40" y="260" width="170" height="80" rx="12" fill="#FFE3A1" stroke="#2A1E1A" stroke-width="4"/><text x="125" y="308" text-anchor="middle" font-size="28" font-family="Jua, sans-serif">BTC ETF</text></g>
      <path class="drawp" d="M230 200 C330 200 360 200 470 200" stroke="#C8372D" stroke-width="7" fill="none" stroke-dasharray="1"/>
      <g class="tok"><circle cx="600" cy="200" r="120" fill="#F2C14E" stroke="#2A1E1A" stroke-width="7"/><text x="600" y="192" text-anchor="middle" font-size="40" font-family="Jua, sans-serif">1 TOKEN</text><text x="600" y="232" text-anchor="middle" font-size="22" font-family="Gaegu, sans-serif" font-weight="700">비중대로 담긴 바구니</text></g>
      <g class="clock"><circle cx="820" cy="70" r="46" fill="#fff" stroke="#2A1E1A" stroke-width="4"/><line class="hand" x1="820" y1="70" x2="820" y2="36" stroke="#2A1E1A" stroke-width="5" stroke-linecap="round"/><text x="820" y="150" text-anchor="middle" font-size="30" font-family="Jua, sans-serif" fill="#C8372D">24/7</text></g>
    </svg>`, {x:18, y:13, w:64});
    show(p, t0 + .1, t1);
    p.querySelectorAll('.blk').forEach((b, i) => A.tl.fromTo(b, {opacity:0, x:-40}, {opacity:1, x:0, duration:.4}, t0 + .5 + i*.3));
    drawLines(p, t0 + 1.6, .8);
    A.tl.fromTo(p.querySelector('.tok'), {opacity:0}, {opacity:1, duration:.4}, t0 + 2.2);
    A.tl.fromTo(p.querySelector('.clock'), {opacity:0}, {opacity:1, duration:.4}, T('h2') + .3);
    A.tl.fromTo(p.querySelector('.hand'), {rotation:0, svgOrigin:'820 70'}, {rotation:720, svgOrigin:'820 70', duration:3, ease:'none'}, T('h2') + .3);
    const oc = panel(`<div class="ttl">온체인에서 보이는 것 <small>visible on-chain</small></div><div class="rows"><div class="row"><span class="k">보유 종목</span><span class="v">holdings</span><span class="chip ok">공개</span></div><div class="row"><span class="k">비중</span><span class="v">weights</span><span class="chip ok">공개</span></div><div class="row"><span class="k">리밸런싱</span><span class="v">every rebalance</span><span class="chip ok">공개</span></div></div>`, {x:60, y:57, w:25, rot:2, pink:true});
    show(oc, T('h2') + 1.2, E('h2'), 'right'); stagger(oc, '.row', T('h2') + 1.5, .3);
    const sc = panel(`<div class="ttl">스마트 컨트랙트 <small>smart contract</small></div><div class="flow"><div class="node">배분·수수료<small>allocations, fees</small></div><div class="arrow">→</div><div class="node" style="background:#BFE8C4">디파이 연결<small>DeFi-ready</small></div></div>`, {x:56, y:60, w:30, rot:-2, cls:'blue'});
    show(sc, T('h3') + .3, t1, 'right'); stagger(sc, '.node, .arrow', T('h3') + .6, .25);
    kpop('<em>24시간</em> 발행·환매', T('h2') + 1, 2, 32, 74, {size:.75});
  }

  // ---------- chapter 4: scale ----------
  { const t0 = T('s1'), t1 = E('s1');
    const p = panel(`<div class="ttl">온도 TVL 구성 <small>platform TVL ≈ $3.6B</small></div>${barChart({w:760, h:330, max:2.4, items:[{l:'USDY', s:'tokenized treasuries', v:2.16, t:'$2.16B', c:'#BFE8C4'}, {l:'토큰화 주식', s:'Ondo Stocks', v:1.03, t:'$1.03B', c:'#CFE3FB'}, {l:'OUSG', s:'institutional', v:.409, t:'$0.41B', c:'#FFE3A1'}]})}`, {x:20, y:13, w:50});
    show(p, t0 + .1, t1); growBars(p, t0 + .5, .5);
    const tot = panel(`<div class="sub">합계 total</div><div class="big navy cnt">$0B</div>`, {x:66, y:22, w:16, rot:3, cls:'yellow'});
    show(tot, t0 + .3, t1, 'right'); count('.cnt', tot, t0 + .5, t0 + 2.6, 0, 3.6, v => '$' + v.toFixed(1) + 'B');
  }
  { const t0 = T('s2'), t1 = E('s3');
    const p = panel(`<div class="grid2"><div class="scn" style="background:#E4F1FF"><h4 class="big navy cnt" style="font-size:max(22px,4.4cqw)">0</h4><p>미국 주식·ETF 종목</p><p class="sub">US stocks &amp; ETFs listed</p></div><div class="scn" style="background:#E3F6E6"><h4 class="big grn cnt2" style="font-size:max(22px,4.4cqw)">$0B</h4><p>누적 거래</p><p class="sub">cumulative volume</p></div></div>`, {x:20, y:16, w:44, tape:false});
    show(p, t0 + .1, t1); count('.cnt', p, t0 + .4, t0 + 2, 0, 440, v => Math.round(v) + '+'); count('.cnt2', p, t0 + .8, t0 + 2.6, 0, 20, v => '$' + Math.round(v) + 'B+');
    const hist = panel(`<div class="ttl">이미 오랜 파트너 <small>since 2024</small></div><div class="flow"><div class="node" style="background:#FFF1B8">온도<small>Ondo</small></div><div class="arrow">→ $95M →</div><div class="node" style="background:#CFE3FB">블랙록 BUIDL<small>tokenized MMF</small></div></div><div class="sub" style="margin-top:.5cqw">2024.3 · first week · largest holder at the time</div>`, {x:46, y:48, w:36, rot:2, pink:true});
    show(hist, T('s3') + .1, t1, 'right'); stagger(hist, '.node, .arrow', T('s3') + .4, .3);
  }

  // ---------- chapter 5: bigger picture ----------
  { const t0 = T('b1'), t1 = E('b2');
    const p = panel(`<div class="ttl">토큰화 실물자산 (스테이블코인 제외) <small>distributed RWA value</small></div><div class="big grn cnt">$0B</div><div class="sub">May 2026 · +200%+ year on year</div>`, {x:18, y:15, w:30});
    show(p, t0 + .1, t1, 'left'); count('.cnt', p, t0 + .4, t0 + 2.4, 0, 32, v => '$' + Math.round(v) + 'B+');
    const q = panel(`<div class="ttl">규모 비교 <small>billions of dollars</small></div>${barChart({w:600, h:320, max:34, items:[{l:'RWA 전체', v:32, t:'$32B', c:'#BFE8C4'}, {l:'토큰화 국채', v:13, t:'$13B', c:'#CFE3FB'}, {l:'온도', v:3.6, t:'$3.6B', c:'#FFE3A1'}, {l:'BUIDL', v:2.9, t:'$2.9B', c:'#F9B8AE'}], vs:22, ls:17})}`, {x:50, y:15, w:34, rot:1.5});
    show(q, T('b2') + .1, t1, 'right'); growBars(q, T('b2') + .4, .3);
    kpop('1년 새 <i>3배+</i>', t0 + 2.6, 2, 34, 64, {size:.8});
  }
  { const t0 = T('b3'), t1 = E('b3');
    const p = panel(`<div class="ttl">블랙록 모델 포트폴리오 vs 온체인 RWA <small>linear scale, to size</small></div><svg viewBox="0 0 900 300"><rect class="bar" x="60" y="40" width="360" height="200" rx="10" fill="#CFE3FB" stroke="#2A1E1A" stroke-width="4"/><text x="240" y="150" text-anchor="middle" font-size="44" font-family="Jua, sans-serif">$9.8T</text><text x="240" y="280" text-anchor="middle" font-size="22" font-family="Gaegu, sans-serif" font-weight="700">블랙록 모델 포트폴리오</text>
      <rect class="bar" x="560" y="239" width="360" height="1" fill="#C8372D" stroke="#C8372D" stroke-width="2"/><text x="740" y="220" text-anchor="middle" font-size="30" font-family="Jua, sans-serif" fill="#C8372D">$32B ← 이만큼</text><text x="740" y="280" text-anchor="middle" font-size="22" font-family="Gaegu, sans-serif" font-weight="700">온체인 RWA 전체</text></svg>`, {x:20, y:15, w:60});
    show(p, t0 + .1, t1); growBars(p, t0 + .5, .6);
  }

  // ---------- chapter 6: IT convergence ----------
  { const t0 = T('i1'), t1 = E('i1');
    const p = panel(`<div class="ttl">결제의 변화 <small>settlement</small></div><div class="grid2"><div class="scn" style="background:#F4EEE2"><h4>기존</h4><p>평일 장중 · T+1 결제</p><p class="sub">market hours, next-day settlement</p></div><div class="scn" style="background:#E3F6E6"><h4>온체인</h4><p>24/7 · 몇 초 안에 이동</p><p class="sub">always on, seconds</p></div></div>`, {x:22, y:18, w:56});
    show(p, t0 + .1, t1); stagger(p, '.scn', t0 + .4, .6);
    kpop('시장은 <em>닫히지 않는다</em>', t0 + 2.4, 2, 50, 70, {size:.75});
  }
  { const t0 = T('i2'), t1 = E('i2');
    const p = panel(`<div class="ttl">조합성 <small>composability</small></div><div class="flow"><div class="node" style="background:#F2C14E">포트폴리오 토큰</div><div class="arrow">→</div><div class="node" style="background:#CFE3FB">대출 담보<small>collateral</small></div><div class="arrow">·</div><div class="node" style="background:#EEE3FB">스마트 지갑<small>smart wallet</small></div><div class="arrow">·</div><div class="node" style="background:#BFE8C4">서류 없음<small>no paperwork</small></div></div>`, {x:17, y:22, w:66});
    show(p, t0 + .1, t1); stagger(p, '.node, .arrow', t0 + .3, .22);
  }
  { const t0 = T('i3'), t1 = E('i3');
    const p = panel(`<div class="ttl">전망 · outlook <small>not yet a product · labeled as outlook</small></div><div class="flow"><div class="node" style="background:#EEE3FB">AI 에이전트</div><div class="arrow">→</div><div class="node">규칙<small>rules, limits</small></div><div class="arrow">→</div><div class="node" style="background:#F2C14E">자동 리밸런싱<small>on-chain</small></div></div>`, {x:20, y:22, w:60, cls:'yellow'});
    show(p, t0 + .1, t1); stagger(p, '.node, .arrow', t0 + .3, .25);
  }

  // ---------- chapter 7: investor view ----------
  { const t0 = T('v1'), t1 = E('v2');
    const p = panel(`<div class="ttl">ONDO 토큰의 성격 <small>what the token is</small></div><div class="flow"><div class="node" style="background:#BFE8C4">상품 성장<small>product growth</small></div><div class="arrow">⇢?</div><div class="node" style="background:#FFE3A1">ONDO 가치<small>governance token</small></div></div><div class="sub" style="margin-top:.5cqw">no automatic fee share to holders</div>`, {x:18, y:14, w:40});
    show(p, t0 + .1, t1); stagger(p, '.node, .arrow', t0 + .3, .3);
    const s = panel(`<div class="ttl">공급 현황 <small>supply, Jul 2026</small></div><svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="110" fill="none" stroke="#F9B8AE" stroke-width="46"/><circle class="arcc" cx="150" cy="150" r="110" fill="none" stroke="#BFE8C4" stroke-width="46" stroke-dasharray="${(2*Math.PI*110*.487).toFixed(1)} 999" transform="rotate(-90 150 150)"/><text x="150" y="146" text-anchor="middle" font-size="40" font-family="Jua, sans-serif">48.7%</text><text x="150" y="182" text-anchor="middle" font-size="20" font-family="Gaegu, sans-serif" font-weight="700">유통 · 51.3% 잠김</text></svg>`, {x:60, y:16, w:22, rot:2, pink:true});
    show(s, T('v2') + .1, t1, 'right');
    A.tl.fromTo(s.querySelector('.arcc'), {attr:{'stroke-dasharray':'0 999'}}, {attr:{'stroke-dasharray':(2*Math.PI*110*.487).toFixed(1) + ' 999'}, duration:1.2, ease:'power2.out'}, T('v2') + .4);
    kpop('언락 = <b>매도 압력</b>?', T('v2') + 2.2, 2.2, 38, 72, {size:.75});
  }
  { const t0 = T('v3'), t1 = E('v4');
    const p = panel(`<div class="grid2"><div class="scn" style="background:#E3F6E6"><h4 class="grn">강세 Bull</h4><p>포트폴리오 토큰에 실자산 유입</p><p>새 시장·규제 허용 확대</p></div><div class="scn" style="background:#FFE6EC"><h4 class="red">약세 Bear</h4><p>뉴스 효과 소멸</p><p>언락 물량 부담</p></div></div>`, {x:20, y:14, w:60, tape:false});
    show(p, t0 + .1, T('v4')); stagger(p, '.scn', t0 + .3, .5);
    const w = panel(`<div class="ttl">체크리스트 · 볼 것 3가지 <small>what to watch</small></div><div class="rows"><div class="row"><span class="k">①</span><span class="v">새 포트폴리오 토큰 자산<small>assets in BLK*on tokens</small></span><span class="chip info">on-chain</span></div><div class="row"><span class="k">②</span><span class="v">언락 일정<small>unlock dates</small></span><span class="chip md">supply</span></div><div class="row"><span class="k">③</span><span class="v">규제상 허용 지역<small>where access is allowed</small></span><span class="chip no">regulation</span></div></div>`, {x:22, y:14, w:56});
    show(w, T('v4') + .1, t1); stagger(w, '.row', T('v4') + .4, .4);
  }

  // ---------- chapter 8: verdict ----------
  { const t0 = T('z1'), t1 = E('z2');
    const p = panel(`<div class="ttl" style="text-align:center">판결 · 한 줄 요약</div><div class="mid" style="text-align:center">MOU 아닌 <span class="hl">상품 제휴</span><br>이름값은 크고, 역할은 제한적</div><div class="sub" style="text-align:center;margin-top:.6cqw">Not an MOU: a real product, a famous name, a limited role · 투자 조언 아님</div>`, {x:24, y:16, w:52});
    show(p, t0 + .1, t1, 'drop');
    stamp('CASE CLOSED', t0 + 2.6, t1, {x:56, y:50, color:'#B3261E', rot:-8});
    burst(t0 + 2.8, 50, 78, 120);
  }
};
