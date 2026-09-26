  // ---------- Ondo × BlackRock: scene builders ----------
  let titleOuter, loopArrows, closedStamp, footer;
  const reporterBubbles = [];
  let smoke = [];
  const ONDO = {w:120, h:86, fur:'#E9E4DA', color:'#5B8FD1', label:'ONDO'};
  const BLK = {w:120, h:86, fur:'#4A4A52', color:'#F5F5F5', label:'BLK'};

  // Shot 1 · MOU? (0–4.5)
  (function(){
    const s = S[0];
    titleOuter = el('g', {}, top);
    const tIn = el('g', {}, titleOuter);
    el('path', {d:'M470 0 V130 M1130 0 V130', stroke:INK, 'stroke-width':5}, tIn);
    el('rect', {x:390, y:120, width:820, height:290, rx:18, fill:K.wood, stroke:INK, 'stroke-width':6}, tIn);
    el('path', {d:'M410 210 H1190 M410 318 H1190', stroke:K.woodD, 'stroke-width':3, opacity:.5}, tIn);
    hand(tIn, 800, 186, 'FACT CHECK · SEP 24, 2026', 30, K.redD, 'middle', {'letter-spacing':4});
    hand(tIn, 800, 282, 'Ondo × BlackRock', 96, INK);
    hand(tIn, 800, 376, 'an MOU?', 88, K.red);
    tl.to(tIn, {y:-470, duration:.7, ease:'back.in(1.4)'}, 1.2);

    const doc = paper(s, 800, 330, 460, 330, -2);
    hand(doc, 0, -78, 'MOU?', 96, INK);
    [-12, 16, 44].forEach((y, i) => el('line', {x1:-170, x2:i === 2 ? 60 : 170, y1:y, y2:y, stroke:'#B9AC9C', 'stroke-width':6, 'stroke-linecap':'round'}, doc));
    hand(doc, -110, 118, 'Ondo ______', 24, '#6B5A4E');
    hand(doc, 100, 118, 'BlackRock ______', 24, '#6B5A4E');
    pop(doc, 1.5);
    const o = box(s, 560, 752, ONDO), b = box(s, 1050, 752, BLK);
    tl.fromTo([o.inner, b.inner], {y:160, opacity:0}, {y:0, opacity:1, duration:.5, ease:'back.out(2)', stagger:.15}, 1.8);
    tl.to(o.inner, {x:60, duration:.35, ease:'power2.out'}, 2.5);
    tl.to(b.inner, {x:-60, duration:.35, ease:'power2.out'}, 2.5);
    bounce(o.bob, 2.5, 3.1, 10, 12); bounce(b.bob, 2.5, 3.1, 10, 12, 1);
    stamp(stampV(s, 800, 350, 440, 'NOT AN MOU', '#B3261E'), 3.1);
  })();

  // Shot 2 · what launched (4.5–10)
  (function(){
    const s = S[1];
    const cal = paper(s, 1340, 205, 200, 130, 4);
    hand(cal, 0, -2, 'SEP 24', 48, K.red); hand(cal, 0, 42, '2026', 28, '#6B5A4E');
    pop(cal, 4.7);
    [[640, '#F2C14E', 'BLKHIon', 'High Income'], [920, '#6CC0C2', 'BLKDIGon', 'Diversified Growth'], [1200, '#F08A5D', 'BLKGRWon', 'High Growth']].forEach(([x, col, tk, name], i) => {
      const ped = el('g', {}, s);
      el('rect', {x:x-110, y:652, width:220, height:100, rx:8, fill:K.wood, stroke:INK, 'stroke-width':5}, ped);
      hand(ped, x, 712, name, name.length > 12 ? 24 : 30, INK);
      pop(ped, 4.7 + i*.1, 40);
      const c = el('g', {}, s);
      el('circle', {cx:x, cy:520, r:100, fill:col, stroke:INK, 'stroke-width':6}, c);
      el('circle', {cx:x, cy:520, r:78, fill:'none', stroke:INK, 'stroke-width':3, 'stroke-dasharray':'8 7', opacity:.6}, c);
      el('ellipse', {cx:x-38, cy:478, rx:26, ry:14, fill:'#fff', opacity:.35}, c);
      hand(c, x, 520, tk, 34, INK);
      hand(c, x, 552, 'powered by BlackRock', 15, '#3A2E25');
      drop(c, 5.0 + i*.35);
    });
    const tag = sign(s, 800, 225, 420, 60, ['3 portfolio tokens'], 34);
    pop(tag, 6.4);
  })();

  // Shot 3 · how it works (10–16)
  (function(){
    const s = S[2];
    const blocks = [];
    [[560, 520, '#7CC48A', 'STOCKS'], [680, 505, '#8FB8DE', 'BONDS'], [615, 452, '#F2B36B', 'BTC']].forEach(([x, y, col, l]) => {
      const g = el('g', {}, s);
      el('rect', {x:x-60, y:y-38, width:120, height:76, rx:8, fill:col, stroke:INK, 'stroke-width':5}, g);
      hand(g, x, y+2, l, 30, INK); hand(g, x, y+28, 'ETF', 18, '#3A2E25');
      blocks.push([g, x, y]);
    });
    const bk = el('g', {}, s);
    el('path', {d:'M470 560 H790 L760 742 H500 Z', fill:'#D9A86A', stroke:INK, 'stroke-width':6, 'stroke-linejoin':'round'}, bk);
    for (let i = 0; i < 4; i++) el('path', {d:`M${485 + i*4} ${596 + i*36} H${775 - i*4}`, stroke:'#A9773F', 'stroke-width':5}, bk);
    for (let i = 0; i < 6; i++) el('path', {d:`M${520 + i*46} 562 L${528 + i*40} 740`, stroke:'#A9773F', 'stroke-width':4}, bk);
    hand(bk, 630, 700, 'the basket', 28, INK);
    pop(bk, 10.2, 60);
    blocks.forEach(([g], i) => pop(g, 10.4 + i*.15, -40));
    const arr = el('path', {d:'M820 560 Q920 470 1010 470', fill:'none', stroke:INK, 'stroke-width':8, 'stroke-dasharray':'16 12', 'stroke-linecap':'round'}, s);
    draw(arr, 11.0, .6);
    const head = el('path', {d:'M1000 446 L1034 470 L1000 494 Z', fill:INK}, s);
    pop(head, 11.5, 0);
    blocks.forEach(([g, x, y], i) => tl.to(g, {x:1150 - x, y:450 - y, scale:.15, opacity:0, duration:.55, ease:'power2.in', smoothOrigin:false, transformOrigin:'50% 50%'}, 11.7 + i*.28));
    const tok = el('g', {}, s);
    el('circle', {cx:1150, cy:450, r:118, fill:'#F2C14E', stroke:INK, 'stroke-width':7}, tok);
    el('circle', {cx:1150, cy:450, r:94, fill:'none', stroke:INK, 'stroke-width':3, 'stroke-dasharray':'9 8', opacity:.6}, tok);
    hand(tok, 1150, 446, '1 TOKEN', 46, INK);
    hand(tok, 1150, 484, '= the whole basket', 20, '#3A2E25');
    popScale(tok, 12.6);
    const clock = el('g', {}, s);
    el('circle', {cx:1380, cy:200, r:62, fill:K.cream, stroke:INK, 'stroke-width':6}, clock);
    for (let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; el('line', {x1:1380 + 50*Math.cos(a), y1:200 + 50*Math.sin(a), x2:1380 + 56*Math.cos(a), y2:200 + 56*Math.sin(a), stroke:INK, 'stroke-width':3}, clock); }
    const hands = el('g', {}, clock);
    el('line', {x1:1380, y1:200, x2:1380, y2:156, stroke:INK, 'stroke-width':5, 'stroke-linecap':'round'}, hands);
    el('line', {x1:1380, y1:200, x2:1410, y2:200, stroke:K.red, 'stroke-width':4, 'stroke-linecap':'round'}, hands);
    spinners.push({g:hands, cx:1380, cy:200, speed:220});
    hand(clock, 1380, 300, '24/7', 40, K.red);
    popScale(clock, 13.5);
    const note = paper(s, 1330, 648, 270, 84, 3);
    hand(note, 0, -6, 'every rebalance', 26, INK); hand(note, 0, 26, 'visible on-chain', 26, INK);
    pop(note, 14.9);
  })();

  // Shot 4 · who does what (16–21)
  (function(){
    const s = S[3];
    el('line', {x1:900, x2:900, y1:170, y2:752, stroke:INK, 'stroke-width':4, 'stroke-dasharray':'14 12', opacity:.6}, s);
    const left = sign(s, 640, 250, 380, 118, ['BlackRock', '✓ model strategy only'], 34);
    drop(left, 16.2);
    const xs = paper(s, 640, 400, 380, 70, -2);
    hand(xs, 0, 11, '✗ issue   ✗ custody   ✗ operate', 26, K.red);
    pop(xs, 17.0);
    const bl = box(s, 640, 752, BLK);
    pop(bl.inner, 16.4, 80);
    const bp = el('g', {}, bl.bob);
    el('line', {x1:-40, x2:-40, y1:bl.top + 30, y2:bl.top - 26, stroke:INK, 'stroke-width':4}, bp);
    el('line', {x1:40, x2:40, y1:bl.top + 30, y2:bl.top - 26, stroke:INK, 'stroke-width':4}, bp);
    el('rect', {x:-100, y:bl.top - 146, width:200, height:120, rx:6, fill:'#5B8FD1', stroke:INK, 'stroke-width':5}, bp);
    for (let i = 1; i < 5; i++) el('line', {x1:-100 + i*40, x2:-100 + i*40, y1:bl.top - 146, y2:bl.top - 26, stroke:'#fff', 'stroke-width':1.5, opacity:.5}, bp);
    for (let i = 1; i < 3; i++) el('line', {x1:-100, x2:100, y1:bl.top - 146 + i*40, y2:bl.top - 146 + i*40, stroke:'#fff', 'stroke-width':1.5, opacity:.5}, bp);
    hand(bp, 0, bl.top - 76, 'MODEL', 38, '#fff');
    const right = sign(s, 1170, 250, 400, 150, ['Ondo', '✓ issue  ✓ tokenize', '✓ custody  ✓ run'], 30);
    drop(right, 17.4);
    const mach = el('g', {}, s);
    el('rect', {x:1180, y:540, width:210, height:190, rx:14, fill:'#9AA0AA', stroke:INK, 'stroke-width':6}, mach);
    el('rect', {x:1200, y:560, width:170, height:40, rx:6, fill:'#5B8FD1', stroke:INK, 'stroke-width':3}, mach);
    hand(mach, 1285, 590, 'TOKENIZER', 22, '#fff');
    [[1235, 660, 34], [1320, 668, 26]].forEach(([cx, cy, r], i) => {
      const gear = el('g', {}, mach);
      for (let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; el('rect', {x:cx - 6, y:cy - r - 10, width:12, height:16, fill:'#6B6F7A', stroke:INK, 'stroke-width':2, transform:`rotate(${k*45} ${cx} ${cy})`}, gear); }
      el('circle', {cx, cy, r, fill:'#6B6F7A', stroke:INK, 'stroke-width':4}, gear);
      el('circle', {cx, cy, r:r*.35, fill:'#9AA0AA', stroke:INK, 'stroke-width':3}, gear);
      spinners.push({g:gear, cx, cy, speed:i ? -140 : 110});
    });
    for (let k = 0; k < 4; k++) el('ellipse', {cx:1420 + (k%2)*6, cy:742 - k*12, rx:20, ry:7, fill:K.yellow, stroke:INK, 'stroke-width':3}, mach);
    pop(mach, 17.6, 60);
    const on = box(s, 1080, 752, ONDO);
    pop(on.inner, 17.8, 80);
    bounce(on.bob, 18.2, 21, 8, 9);
    stamp(stampV(s, 640, 468, 360, 'LIMITED ROLE', '#B7791F'), 19.2);
  })();

  // Shot 5 · who can buy (21–24.5)
  (function(){
    const s = S[4];
    const gl = el('g', {}, s);
    el('circle', {cx:900, cy:400, r:190, fill:'#8FC8E8', stroke:INK, 'stroke-width':6}, gl);
    el('path', {d:'M760 300 C790 250 860 250 880 290 C900 330 850 360 830 400 C815 430 790 470 770 450 C745 425 735 350 760 300 Z', fill:'#7CC48A', stroke:INK, 'stroke-width':4}, gl);
    el('path', {d:'M800 470 C830 460 850 500 840 540 C832 570 805 575 795 545 C785 515 780 480 800 470 Z', fill:'#7CC48A', stroke:INK, 'stroke-width':4}, gl);
    el('path', {d:'M930 280 C990 250 1060 280 1070 330 C1080 380 1030 400 1000 390 C990 430 1010 480 980 500 C950 520 930 470 935 430 C905 420 900 330 930 280 Z', fill:'#7CC48A', stroke:INK, 'stroke-width':4}, gl);
    el('ellipse', {cx:860, cy:250, rx:120, ry:26, fill:'#fff', opacity:.25}, gl);
    popScale(gl, 21.1);
    const no = el('g', {}, s);
    el('circle', {cx:812, cy:330, r:58, fill:'#fff', 'fill-opacity':.35, stroke:'#B3261E', 'stroke-width':12}, no);
    el('line', {x1:772, y1:290, x2:852, y2:370, stroke:'#B3261E', 'stroke-width':12, 'stroke-linecap':'round'}, no);
    hand(no, 812, 320, 'US', 30, '#B3261E');
    popScale(no, 21.9);
    [[1010, 330], [960, 460], [1045, 380]].forEach(([x, y], i) => {
      const ok = el('g', {}, s);
      el('circle', {cx:x, cy:y, r:18, fill:'#2E7D3E', stroke:INK, 'stroke-width':3}, ok);
      el('path', {d:`M${x - 8} ${y} L${x - 2} ${y + 7} L${x + 9} ${y - 7}`, stroke:'#fff', 'stroke-width':4, fill:'none', 'stroke-linecap':'round'}, ok);
      popScale(ok, 22.3 + i*.15);
    });
    const sg = sign(s, 900, 650, 470, 60, ['non-US investors only'], 34);
    pop(sg, 22.2);
    const pj = paper(s, 1300, 260, 250, 70, 4);
    hand(pj, 0, 10, 'permitted countries', 26, INK);
    pop(pj, 22.8);
  })();

  // Shot 6 · market reaction (24.5–28)
  (function(){
    const s = S[5];
    const th = thermo(s, 1200, 620, 240, 'ONDO PRICE', K.red, K.green);
    tl.fromTo(th.liq, {scaleY:.35}, {scaleY:.8, duration:2.2, ease:'power1.inOut', smoothOrigin:false, transformOrigin:'50% 100%'}, 24.8);
    counter(th.txt, 24.8, 27.0, .42, .50, v => '$' + v.toFixed(2));
    const pm = pump(s, 960, 752, 1200, 620);
    pumps.push({h:pm.handle, t0:24.8, t1:27.0});
    const bs = sign(s, 560, 250, 360, 110, ['BlackRock models:', '$9.8 trillion'], 32);
    drop(bs, 24.7);
    const asof = paper(s, 560, 365, 180, 50, -3); hand(asof, 0, 9, 'as of June 2026', 20, '#6B5A4E');
    pop(asof, 25.3);
    const tower = el('g', {}, s);
    for (let k = 0; k < 10; k++){
      el('ellipse', {cx:560 + (k%3 - 1)*4, cy:742 - k*26, rx:66, ry:18, fill:K.yellow, stroke:INK, 'stroke-width':4}, tower);
      el('ellipse', {cx:560 + (k%3 - 1)*4, cy:738 - k*26, rx:40, ry:9, fill:'none', stroke:'#C99A2E', 'stroke-width':3}, tower);
    }
    tl.fromTo(tower, {scaleY:0}, {scaleY:1, duration:.8, ease:'back.out(1.6)', smoothOrigin:false, transformOrigin:'50% 100%'}, 25.1);
    const up = el('g', {}, s);
    el('path', {d:'M1330 560 L1330 330 M1290 370 L1330 320 L1370 370', stroke:'#2E7D3E', 'stroke-width':14, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round'}, up);
    hand(up, 1330, 610, '+18%', 44, '#2E7D3E');
    hand(up, 1330, 646, 'in 24h', 22, '#3A2E25');
    popScale(up, 26.1);
  })();

  // Shot 7 · verdict (28–31): the end card is HTML; keep stubs the engine expects
  (function(){
    closedStamp = place(top, 800, 360, -8);
    closedStamp.__pos = [800, 360];
    footer = el('g', {}, top);
  })();

