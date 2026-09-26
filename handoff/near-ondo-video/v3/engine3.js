(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#2A1E1A';
  const V = window.VIDEO;
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent, text){
    const e = document.createElementNS(NS, tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeBack = q => 1 + 2.7*Math.pow(q - 1, 3) + 1.7*Math.pow(q - 1, 2);
  const rnd = (i, k) => { const v = Math.sin(i*127.1 + k*311.7)*43758.5453; return v - Math.floor(v); };
  const fmtT = t => Math.floor(t/60) + ':' + String(Math.floor(t%60)).padStart(2, '0');

  // ---------- timing: every line gets its own slot, sized from its voice-over ----------
  const CH = V.chapters;
  const CUES = V.cues;
  let t = 0.5;
  CUES.forEach((c, i) => {
    const est = c.en.split(/\s+/).length/2.6 + .4;
    const dur = Math.max(c.card ? 2.4 : 2.2, (c.dur || est) + .3) + (c.extra || 0);
    c.i = i; c.t0 = t; c.t1 = t + dur; t += dur;
  });
  const D = t + 1.2;
  const byId = {}; CUES.forEach(c => { if (c.id) byId[c.id] = c; });
  const T = id => { if (!byId[id]) throw new Error('no cue ' + id); return byId[id].t0; };
  const E = id => byId[id].t1;
  // chapter windows: a chapter becomes visible once its curtain is fully closed
  const chapStarts = CH.map((ch, k) => { const c = CUES.find(q => q.ch === k); return k === 0 ? 0 : c.t0 + .7; });
  const chapAt = tt => { let k = 0; chapStarts.forEach((s, j) => { if (tt >= s) k = j; }); return k; };

  const tl = gsap.timeline({paused:true});
  const EV = [];
  const counters = [], bursts = [], pops = [];

  // ---------- background: pastel stage with a different set per chapter ----------
  const bg = $('bg'), defs = el('defs', {}, bg);
  const skyG = el('linearGradient', {id:'sky3', x1:0, y1:0, x2:0, y2:1}, defs);
  const skyStops = [0, .55, 1].map(o => el('stop', {offset:o, 'stop-color':'#FDE9C8'}, skyG));
  el('rect', {width:1600, height:900, fill:'url(#sky3)'}, bg);
  const blotch = el('filter', {id:'wc3', x:0, y:0, width:'100%', height:'100%'}, defs);
  el('feTurbulence', {type:'fractalNoise', baseFrequency:'0.004 0.007', numOctaves:3, seed:9}, blotch);
  el('feColorMatrix', {type:'matrix', values:'0 0 0 0 1  0 0 0 0 .78  0 0 0 0 .86  1.6 0 0 0 -.7'}, blotch);
  el('rect', {width:1600, height:900, filter:'url(#wc3)', opacity:.35}, bg);
  const sparkles = [];
  for (let k = 0; k < 14; k++){
    const s = el('path', {d:'M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z', fill:'#FFF6D8', stroke:'#C9B79A', 'stroke-width':1.2, transform:`translate(${120 + rnd(k, 1)*1360},${70 + rnd(k, 2)*420})`}, bg);
    sparkles.push([s, k]);
  }
  const setsG = el('g', {}, bg);
  const clouds = [];
  function cloud(x, y, s, v){
    const g = el('g', {}, bg);
    el('path', {d:'M-70 22 Q-84 -8 -46 -12 Q-40 -44 -4 -40 Q24 -60 50 -30 Q86 -32 80 2 Q94 24 62 28 Z', fill:'#fff', stroke:'#7A6A5C', 'stroke-width':3/s, transform:`scale(${s})`}, g);
    el('path', {d:'M-40 14 Q-10 20 30 12', fill:'none', stroke:'#BFD8EF', 'stroke-width':5/s, 'stroke-linecap':'round', transform:`scale(${s})`}, g);
    clouds.push({g, x, y, v});
  }
  [[220, 150, 1.05, 9], [640, 90, .7, 6], [1080, 170, .95, 8], [1400, 260, .6, 11], [380, 300, .55, 7]].forEach(a => cloud(...a));
  el('path', {d:'M0 560 Q220 500 460 540 T900 520 T1340 548 T1600 520 L1600 700 L0 700 Z', fill:'#CFE7B8', stroke:'#8FAF7E', 'stroke-width':3}, bg);
  el('path', {d:'M0 610 Q300 570 620 604 T1240 592 T1600 600 L1600 700 L0 700 Z', fill:'#B8DDA0', stroke:'#86A874', 'stroke-width':3}, bg);
  el('rect', {x:0, y:700, width:1600, height:200, fill:'#E4B878'}, bg);
  for (let x = -600; x <= 2200; x += 100) el('line', {x1:x, y1:700, x2:800 + (x - 800)*1.9, y2:900, stroke:'#C99A5E', 'stroke-width':2.5}, bg);
  [742, 796, 862].forEach(y => el('line', {x1:0, x2:1600, y1:y, y2:y, stroke:'#C99A5E', 'stroke-width':2}, bg));
  el('line', {x1:0, x2:1600, y1:700, y2:700, stroke:'#8C6A42', 'stroke-width':4}, bg);
  // footlights
  for (let x = 140; x < 1500; x += 120){ el('ellipse', {cx:x, cy:892, rx:34, ry:14, fill:'#FFE9A8', stroke:INK, 'stroke-width':2.5}, bg); }

  const SETS = {};
  const P = (d, fill, extra) => Object.assign({d, fill, stroke:'#8A7866', 'stroke-width':3, 'stroke-linejoin':'round'}, extra || {});
  function set(name, fn){ const g = el('g', {opacity:0}, setsG); fn(g); SETS[name] = g; }
  set('city', g => { let x = 60; for (let i = 0; i < 16; i++){ const w = 60 + rnd(i, 3)*50, h = 80 + rnd(i, 4)*170; el('rect', {x, y:560 - h, width:w, height:h, fill:['#F6D3C4', '#D9D2F2', '#CFE3F5', '#F7E3B5'][i % 4], stroke:'#8A7866', 'stroke-width':2.5}, g); for (let yy = 560 - h + 14; yy < 540; yy += 22) for (let xx = x + 10; xx < x + w - 12; xx += 18) if (rnd(xx, yy) > .45) el('rect', {x:xx, y:yy, width:8, height:11, fill:'#FFF6D8', stroke:'#B9A68E', 'stroke-width':1}, g); x += w + 38; } });
  set('chart', g => { for (let k = 0; k < 18; k++){ const x = 120 + k*76, o = 360 - k*9 - (k % 3)*14, c = 360 - k*9 - ((k + 1) % 3)*14 + 20, up = c < o; el('line', {x1:x, x2:x, y1:Math.min(o, c) - 24, y2:Math.max(o, c) + 24, stroke:up ? '#7CC48A' : '#E88C7E', 'stroke-width':3, opacity:.55}, g); el('rect', {x:x - 12, y:Math.min(o, c), width:24, height:Math.abs(o - c) + 6, fill:up ? '#BFE8C4' : '#F9C7BE', stroke:up ? '#5FA36B' : '#C9776A', 'stroke-width':2, opacity:.75}, g); } for (let y = 140; y < 560; y += 70) el('line', {x1:80, x2:1520, y1:y, y2:y, stroke:'#C9B79A', 'stroke-width':1.5, 'stroke-dasharray':'6 10', opacity:.7}, g); });
  set('vault', g => { el('circle', {cx:1260, cy:400, r:190, fill:'#E4E7EE', stroke:'#8A7866', 'stroke-width':4}, g); el('circle', {cx:1260, cy:400, r:150, fill:'#F1F3F7', stroke:'#8A7866', 'stroke-width':3}, g); for (let k = 0; k < 10; k++){ const a = k/10*Math.PI*2; el('circle', {cx:1260 + 170*Math.cos(a), cy:400 + 170*Math.sin(a), r:8, fill:'#C9CED8', stroke:'#8A7866', 'stroke-width':2}, g); } const wh = el('g', {class:'spin', 'data-cx':1260, 'data-cy':400, 'data-v':12}, g); for (let k = 0; k < 3; k++) el('rect', {x:1256, y:300, width:8, height:200, fill:'#C9CED8', stroke:'#8A7866', 'stroke-width':2, transform:`rotate(${k*60} 1260 400)`}, wh); [[260, 520], [330, 520], [295, 494]].forEach(([x, y]) => el('path', P(`M${x - 30} ${y} L${x + 30} ${y} L${x + 22} ${y - 24} L${x - 22} ${y - 24} Z`, '#F6D98A'), g)); });
  set('lab', g => { for (let k = 0; k < 9; k++){ const y = 150 + k*44; el('path', {d:`M80 ${y} H${300 + rnd(k, 1)*300} V${y + 30} H${600 + rnd(k, 2)*600} V${y} H1520`, fill:'none', stroke:'#A9C8F0', 'stroke-width':3, opacity:.6}, g); el('circle', {cx:600 + rnd(k, 2)*600, cy:y + 30, r:7, fill:'#CFE3F5', stroke:'#7FA3D1', 'stroke-width':2}, g); } const orb = el('g', {class:'spin', 'data-cx':1300, 'data-cy':330, 'data-v':-20}, g); el('circle', {cx:1300, cy:330, r:120, fill:'none', stroke:'#C4A6E8', 'stroke-width':4, 'stroke-dasharray':'14 12'}, orb); el('circle', {cx:1420, cy:330, r:14, fill:'#F6D3C4', stroke:'#8A7866', 'stroke-width':2}, orb); el('circle', {cx:1300, cy:330, r:54, fill:'#E9DDFB', stroke:'#8A7866', 'stroke-width':3}, g); el('text', {x:1300, y:342, 'text-anchor':'middle', 'font-size':34, fill:'#6B53A8', 'font-family':'Jua, sans-serif'}, g, 'AI'); });
  set('court', g => { [220, 400, 1200, 1380].forEach(x => { el('rect', {x:x - 26, y:300, width:52, height:260, fill:'#F7F1E6', stroke:'#8A7866', 'stroke-width':3}, g); el('rect', {x:x - 38, y:284, width:76, height:20, fill:'#EEE5D5', stroke:'#8A7866', 'stroke-width':3}, g); }); el('path', P('M150 284 L310 200 L470 284 Z M1130 284 L1290 200 L1450 284 Z', '#EEE5D5'), g); el('circle', {cx:800, cy:330, r:70, fill:'#F6D98A', stroke:'#8A7866', 'stroke-width':3}, g); el('path', {d:'M770 350 L830 310 M760 312 L840 312', stroke:'#8A7866', 'stroke-width':6, 'stroke-linecap':'round'}, g); });
  set('bank', g => { el('path', P('M470 300 L800 190 L1130 300 Z', '#F3EBDD'), g); el('rect', {x:470, y:300, width:660, height:26, fill:'#EEE5D5', stroke:'#8A7866', 'stroke-width':3}, g); for (let x = 520; x <= 1080; x += 112){ el('rect', {x:x - 20, y:326, width:40, height:220, fill:'#FBF6EC', stroke:'#8A7866', 'stroke-width':3}, g); } el('rect', {x:450, y:546, width:700, height:20, fill:'#EEE5D5', stroke:'#8A7866', 'stroke-width':3}, g); });
  set('globe', g => { const orb = el('g', {class:'spin', 'data-cx':1250, 'data-cy':360, 'data-v':6}, g); el('circle', {cx:1250, cy:360, r:170, fill:'#D6ECF7', stroke:'#8A7866', 'stroke-width':3}, g); el('path', P('M1140 300 C1170 250 1230 260 1240 300 C1255 340 1210 360 1195 400 C1180 430 1150 440 1140 410 C1120 380 1120 330 1140 300 Z M1280 260 C1330 240 1390 270 1395 320 C1400 370 1350 380 1330 370 C1320 410 1330 460 1300 470 C1275 480 1265 430 1270 400 C1245 390 1250 290 1280 260 Z', '#CDE8C0'), g); for (let k = 0; k < 6; k++){ el('ellipse', {cx:1250, cy:360, rx:170, ry:40 + k*25, fill:'none', stroke:'#BFD8EF', 'stroke-width':1.5, opacity:.8}, orb); } });
  set('hills', g => {});

  // ---------- curtains + valance (the frame) ----------
  const frame = $('frame');
  function curtain(side){
    const g = el('g', {}, frame), inner = el('g', {}, g);
    const w = 860;
    el('path', {d:`M0 0 H${w} C${w - 18} 220 ${w + 16} 460 ${w - 8} 700 C${w - 14} 800 ${w + 4} 860 ${w - 4} 900 H0 Z`, fill:'#C8372D', stroke:INK, 'stroke-width':5}, inner);
    for (let x = 60; x < w; x += 70) el('path', {d:`M${x} 0 C${x - 12} 260 ${x + 14} 520 ${x - 4} 900`, fill:'none', stroke:x % 140 ? '#9E2519' : '#E0584B', 'stroke-width':x % 140 ? 9 : 7, opacity:.55}, inner);
    el('rect', {x:w - 70, y:400, width:90, height:30, rx:15, fill:'#F2C14E', stroke:INK, 'stroke-width':3}, inner);
    el('path', {d:`M${w - 30} 430 l-10 36 h22 z`, fill:'#F2C14E', stroke:INK, 'stroke-width':3}, inner);
    if (side === 'r') inner.setAttribute('transform', 'translate(1600,0) scale(-1,1)');
    return g;
  }
  const curL = curtain('l'), curR = curtain('r');
  const OPEN = 752, CLOSED = -30; // how far each curtain slides out of view
  gsap.set(curL, {x:-OPEN}); gsap.set(curR, {x:OPEN});
  let vd = 'M0 0 H1600 V48';
  for (let x = 1600; x > 0; x -= 100) vd += ` Q${x - 50} 98 ${x - 100} 48`;
  el('path', {d:vd + ' Z', fill:'#B32E25', stroke:INK, 'stroke-width':5}, frame);
  el('path', {d:'M0 20 H1600', stroke:'#F2C14E', 'stroke-width':5}, frame);
  for (let x = 100; x < 1600; x += 100){ el('line', {x1:x, x2:x, y1:48, y2:74, stroke:'#F2C14E', 'stroke-width':3}, frame); el('path', {d:`M${x - 8} 74 h16 l-3 22 h-10 z`, fill:'#F2C14E', stroke:INK, 'stroke-width':2}, frame); }
  // side audience hamsters with party hats
  function tinyHam(x, y, s){
    const g = el('g', {transform:`translate(${x},${y}) scale(${s})`}, frame);
    el('ellipse', {cx:0, cy:0, rx:30, ry:26, fill:'#EDB36F', stroke:INK, 'stroke-width':3}, g);
    el('circle', {cx:-18, cy:-22, r:7, fill:'#EDB36F', stroke:INK, 'stroke-width':2.5}, g); el('circle', {cx:18, cy:-22, r:7, fill:'#EDB36F', stroke:INK, 'stroke-width':2.5}, g);
    el('path', {d:'M-12 -6 q4 -5 8 0 M4 -6 q4 -5 8 0', stroke:INK, 'stroke-width':2.5, fill:'none', 'stroke-linecap':'round'}, g);
    el('ellipse', {cx:-16, cy:4, rx:6, ry:3.5, fill:'#F2839A', opacity:.6}, g); el('ellipse', {cx:16, cy:4, rx:6, ry:3.5, fill:'#F2839A', opacity:.6}, g);
    el('path', {d:'M-8 -24 L0 -54 L8 -24 Z', fill:'#F29BB2', stroke:INK, 'stroke-width':2.5}, g);
    return g;
  }
  const aud = [[36, 842, 1], [110, 868, .9], [1564, 842, 1], [1490, 868, .9]].map(([x, y, s]) => tinyHam(x, y, s));

  // ---------- characters: slim Uchay + Noa the hamster ----------
  const chars = $('chars');
  function mkChar(id, vb, left, bottom, width){
    const d = document.createElement('div'); d.className = 'char'; d.id = id;
    d.style.left = left + '%'; d.style.bottom = bottom + '%'; d.style.width = width + '%';
    const s = el('svg', {viewBox:vb}); d.appendChild(s); chars.appendChild(d);
    return {d, s};
  }
  const U = {}; {
    const {d, s} = mkChar('uchay', '-70 -175 140 180', 7.6, 17, 8.8); U.div = d;
    const root = el('g', {}, s); U.root = root;
    el('ellipse', {cx:0, cy:2, rx:30, ry:5, fill:'#6B3F1F', opacity:.25}, root);
    const body = el('g', {}, root); U.body = body;
    // legs
    [-10, 10].forEach(x => { el('path', {d:`M${x} -22 L${x} -6`, stroke:INK, 'stroke-width':12, 'stroke-linecap':'round'}, body); el('path', {d:`M${x} -22 L${x} -6`, stroke:'#E0342C', 'stroke-width':7.5, 'stroke-linecap':'round'}, body); el('ellipse', {cx:x + (x < 0 ? -3 : 3), cy:-3, rx:9, ry:5, fill:'#E0342C', stroke:INK, 'stroke-width':2.5}, body); });
    // torso
    el('path', {d:'M-17 -70 C-30 -62 -31 -34 -26 -20 Q0 -14 26 -20 C31 -34 30 -62 17 -70 Z', fill:'#E0342C', stroke:INK, 'stroke-width':3}, body);
    el('path', {d:'M-18 -56 C-22 -46 -22 -36 -20 -28', stroke:'#F46A5E', 'stroke-width':4, fill:'none', 'stroke-linecap':'round'}, body);
    el('circle', {cx:0, cy:-42, r:6.5, fill:'#F8C94A', stroke:INK, 'stroke-width':1.8}, body);
    // arms (pivot at shoulders)
    U.armL = el('g', {}, body); U.armR = el('g', {}, body);
    [[U.armL, -18, -1], [U.armR, 18, 1]].forEach(([g, x, sx]) => {
      el('path', {d:`M0 0 Q${sx*8} 12 ${sx*10} 26`, stroke:INK, 'stroke-width':11, fill:'none', 'stroke-linecap':'round'}, g);
      el('path', {d:`M0 0 Q${sx*8} 12 ${sx*10} 26`, stroke:'#E0342C', 'stroke-width':6.5, fill:'none', 'stroke-linecap':'round'}, g);
      el('circle', {cx:sx*10, cy:28, r:5.5, fill:'#E0342C', stroke:INK, 'stroke-width':2.2}, g);
      g.__x = x;
    });
    // head
    const head = el('g', {}, body); U.head = head;
    U.ant = el('g', {}, head);
    [-1, 1].forEach(sx => { el('path', {d:`M${sx*12} -128 Q${sx*18} -142 ${sx*20} -156`, stroke:INK, 'stroke-width':6.5, fill:'none', 'stroke-linecap':'round'}, U.ant); el('path', {d:`M${sx*12} -128 Q${sx*18} -142 ${sx*20} -156`, stroke:'#E0342C', 'stroke-width':3.5, fill:'none', 'stroke-linecap':'round'}, U.ant); el('circle', {cx:sx*20, cy:-159, r:5.5, fill:'#E0342C', stroke:INK, 'stroke-width':2.2}, U.ant); });
    [-1, 1].forEach(sx => el('circle', {cx:sx*37, cy:-100, r:9.5, fill:'#E0342C', stroke:INK, 'stroke-width':2.5}, head));
    el('ellipse', {cx:0, cy:-101, rx:36, ry:33, fill:'#E0342C', stroke:INK, 'stroke-width':3}, head);
    el('path', {d:'M-26 -116 Q-16 -130 0 -132', stroke:'#F46A5E', 'stroke-width':4, fill:'none', 'stroke-linecap':'round'}, head);
    el('ellipse', {cx:0, cy:-98, rx:23, ry:24.5, fill:'#6DB33F', stroke:INK, 'stroke-width':2.2}, head);
    el('ellipse', {cx:-10, cy:-89, rx:2.8, ry:6.5, fill:'#C6E6A6', opacity:.9}, head); el('ellipse', {cx:10, cy:-89, rx:2.8, ry:6.5, fill:'#C6E6A6', opacity:.9}, head);
    U.eyes = el('g', {}, head);
    [-1, 1].forEach(sx => { el('ellipse', {cx:sx*8.5, cy:-104, rx:6.2, ry:5.4, fill:'#fff', stroke:INK, 'stroke-width':1.5}, U.eyes); el('circle', {cx:sx*8.5 - 1.2, cy:-103.6, r:2.8, fill:'#3A2616'}, U.eyes); el('circle', {cx:sx*8.5 - .4, cy:-104.6, r:.9, fill:'#fff'}, U.eyes); });
    U.smile = el('path', {d:'M-6 -89 Q0 -84 6 -89', stroke:INK, 'stroke-width':2, fill:'none', 'stroke-linecap':'round'}, head);
    U.talk = el('ellipse', {cx:0, cy:-87, rx:4.2, ry:3.6, fill:'#7A1E1E', stroke:INK, 'stroke-width':1.5, opacity:0}, head);
  }
  const N = {}; {
    const {d, s} = mkChar('noa', '-60 -120 120 125', 83.2, 17, 7.2); N.div = d;
    const root = el('g', {}, s); N.root = root;
    el('ellipse', {cx:0, cy:2, rx:28, ry:5, fill:'#6B3F1F', opacity:.25}, root);
    const b = el('g', {}, root); N.body = b;
    [-16, 16].forEach(x => el('ellipse', {cx:x, cy:-4, rx:9, ry:5, fill:'#F4A3A8', stroke:INK, 'stroke-width':2.2}, b));
    [-1, 1].forEach(sx => { el('circle', {cx:sx*20, cy:-92, r:9, fill:'#E8A962', stroke:INK, 'stroke-width':2.5}, b); el('circle', {cx:sx*20, cy:-91, r:4.5, fill:'#F4A3A8'}, b); });
    el('path', {d:'M0 -100 C26 -100 36 -78 36 -52 C36 -22 22 -8 0 -8 C-22 -8 -36 -22 -36 -52 C-36 -78 -26 -100 0 -100 Z', fill:'#E8A962', stroke:INK, 'stroke-width':3}, b);
    el('ellipse', {cx:0, cy:-30, rx:18, ry:16, fill:'#FBE3C0'}, b);
    el('path', {d:'M-26 -44 Q0 -34 26 -44 L24 -36 Q0 -26 -24 -36 Z', fill:'#F8C94A', stroke:INK, 'stroke-width':2}, b);
    el('path', {d:'M14 -38 L22 -22 L12 -24 Z', fill:'#F8C94A', stroke:INK, 'stroke-width':2}, b);
    el('path', {d:'M-24 -72 H24 V-66 Q24 -58 16 -58 H6 Q2 -58 1 -64 H-1 Q-2 -58 -6 -58 H-16 Q-24 -58 -24 -66 Z', fill:'#1A1310'}, b);
    el('path', {d:'M-18 -69 l5 0 M8 -69 l5 0', stroke:'#fff', 'stroke-width':1.5, 'stroke-linecap':'round', opacity:.8}, b);
    el('ellipse', {cx:-20, cy:-52, rx:5, ry:3, fill:'#F2839A', opacity:.6}, b); el('ellipse', {cx:20, cy:-52, rx:5, ry:3, fill:'#F2839A', opacity:.6}, b);
    el('ellipse', {cx:0, cy:-56, rx:3, ry:2.2, fill:'#C96A6A'}, b);
    N.smile = el('path', {d:'M-5 -51 Q-2.5 -48 0 -51 Q2.5 -48 5 -51', stroke:INK, 'stroke-width':1.6, fill:'none'}, b);
    N.talk = el('ellipse', {cx:0, cy:-49, rx:3.4, ry:2.8, fill:'#7A1E1E', opacity:0}, b);
    N.arm = el('g', {}, b);
    el('ellipse', {cx:30, cy:-40, rx:6, ry:9, fill:'#E8A962', stroke:INK, 'stroke-width':2.2}, N.arm);
    el('ellipse', {cx:-30, cy:-40, rx:6, ry:9, fill:'#E8A962', stroke:INK, 'stroke-width':2.2}, b);
  }
  const bubbles = $('bubbles');

  // ---------- helpers for scenes ----------
  const panels = $('panels'), kpopsEl = $('kpops');
  function panel(html, o){
    o = Object.assign({x:30, y:20, w:40, cls:'', rot:0, tape:true}, o || {});
    const d = document.createElement('div');
    d.className = 'pn ' + o.cls;
    d.style.left = o.x + '%'; d.style.top = o.y + '%'; d.style.width = o.w + '%';
    if (o.h) d.style.height = o.h + '%';
    d.innerHTML = (o.tape ? `<span class="tape${o.pink ? ' pink' : ''}"></span>` : '') + html;
    panels.appendChild(d);
    gsap.set(d, {autoAlpha:0, rotation:o.rot});
    d.__rot = o.rot;
    return d;
  }
  function show(d, tin, tout, how){
    const r = d.__rot || 0;
    if (how === 'drop') tl.fromTo(d, {autoAlpha:0, y:-260, rotation:r - 6}, {autoAlpha:1, y:0, rotation:r, duration:.7, ease:'bounce.out'}, tin);
    else if (how === 'left') tl.fromTo(d, {autoAlpha:0, x:-400}, {autoAlpha:1, x:0, duration:.55, ease:'power3.out'}, tin);
    else if (how === 'right') tl.fromTo(d, {autoAlpha:0, x:400}, {autoAlpha:1, x:0, duration:.55, ease:'power3.out'}, tin);
    else tl.fromTo(d, {autoAlpha:0, y:36, scale:.9, rotation:r - 3}, {autoAlpha:1, y:0, scale:1, rotation:r, duration:.5, ease:'back.out(1.7)'}, tin);
    if (tout != null) tl.to(d, {autoAlpha:0, y:-24, duration:.3, ease:'power2.in'}, tout - .3);
    EV.push({c:tin, kind:'pop'});
    return d;
  }
  function stagger(d, sel, tin, gap){
    const items = d.querySelectorAll(sel);
    items.forEach((it, i) => tl.fromTo(it, {autoAlpha:0, y:16}, {autoAlpha:1, y:0, duration:.35, ease:'back.out(1.8)'}, tin + i*(gap || .22)));
  }
  function drawLines(d, tin, dur){
    d.querySelectorAll('.drawp').forEach(p => {
      const len = p.getTotalLength(); p.setAttribute('stroke-dasharray', len);
      tl.fromTo(p, {attr:{'stroke-dashoffset':len}}, {attr:{'stroke-dashoffset':0}, duration:dur || 1.6, ease:'power1.inOut'}, tin);
    });
  }
  function growBars(d, tin, gap){
    d.querySelectorAll('rect.bar').forEach((r, i) => {
      const y = +r.getAttribute('y'), h = +r.getAttribute('height');
      tl.fromTo(r, {attr:{y:y + h, height:0}}, {attr:{y, height:h}, duration:.7, ease:'power3.out'}, tin + i*(gap || .15));
    });
  }
  function reveal(d, sel, tin, gap){ d.querySelectorAll(sel).forEach((it, i) => tl.fromTo(it, {opacity:0}, {opacity:1, duration:.3}, tin + i*(gap || .2))); }
  function count(elOrSel, root, t0, t1, from, to, fmt){ const e = typeof elOrSel === 'string' ? root.querySelector(elOrSel) : elOrSel; counters.push({e, t0, t1, from, to, fmt}); e.textContent = fmt(from); }
  function stamp(html, tin, tout, o){
    o = Object.assign({x:60, y:30, color:'#B3261E', rot:-8}, o || {});
    const d = document.createElement('div'); d.className = 'stampx'; d.innerHTML = html;
    d.style.left = o.x + '%'; d.style.top = o.y + '%'; d.style.color = o.color;
    panels.appendChild(d);
    tl.fromTo(d, {autoAlpha:0, scale:2.4, rotation:o.rot}, {autoAlpha:1, scale:1, rotation:o.rot, duration:.3, ease:'back.out(1.5)'}, tin);
    if (tout != null) tl.to(d, {autoAlpha:0, duration:.3}, tout - .3);
    tl.fromTo('#camera', {x:-10}, {x:0, duration:.45, ease:'elastic.out(1.2,0.3)', immediateRender:false}, tin + .25);
    EV.push({c:tin + .22, kind:'thump'});
    return d;
  }
  function kpop(html, tin, dur, x, y, o){
    o = Object.assign({rot:-4, size:1}, o || {});
    const d = document.createElement('div'); d.className = 'kpop'; d.innerHTML = html;
    d.style.left = x + '%'; d.style.top = y + '%'; d.style.fontSize = `max(${16*o.size}px, ${3.6*o.size}cqw)`;
    kpopsEl.appendChild(d);
    pops.push({d, t:tin, dur, rot:o.rot});
    EV.push({c:tin, kind:'pop'});
  }
  function burst(tin, x, y, n){ bursts.push({t:tin, x, y, n:n || 70}); }
  function bubble(who, text, tin, tout){
    const b = document.createElement('div'); b.className = 'bubble' + (who === 'noa' ? ' r' : ''); b.textContent = text;
    if (who === 'noa'){ b.style.right = '12%'; b.style.bottom = '42%'; } else { b.style.left = '14%'; b.style.bottom = '45%'; }
    bubbles.appendChild(b);
    tl.fromTo(b, {autoAlpha:0, scale:.4}, {autoAlpha:1, scale:1, duration:.3, ease:'back.out(2)'}, tin);
    tl.to(b, {autoAlpha:0, duration:.2}, tout - .2);
  }
  // SVG chart builders (return markup)
  function lineChart(o){
    const W = o.w || 820, H = o.h || 360, pl = 64, pr = 24, pt = 20, pb = 44;
    const xs = i => pl + i*(W - pl - pr)/(o.pts.length - 1), ys = v => pt + (1 - (v - o.min)/(o.max - o.min))*(H - pt - pb);
    let g = `<svg viewBox="0 0 ${W} ${H}">`;
    (o.grid || []).forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${ys(v)}" y2="${ys(v)}" stroke="#D9CBB5" stroke-width="2" stroke-dasharray="5 8"/><text x="${pl - 10}" y="${ys(v) + 6}" text-anchor="end" font-size="18" fill="#7A6A5C" font-family="IBM Plex Mono, monospace">${o.fmt(v)}</text>`; });
    (o.bands || []).forEach(b => { g += `<rect x="${pl}" y="${ys(b.hi)}" width="${W - pl - pr}" height="${ys(b.lo) - ys(b.hi)}" fill="${b.fill}" opacity=".55"/><text x="${W - pr - 6}" y="${ys(b.hi) + 20}" text-anchor="end" font-size="17" fill="${b.ink || '#7A6A5C'}" font-family="Gaegu, sans-serif" font-weight="700">${b.label}</text>`; });
    const d = o.pts.map((p, i) => (i ? 'L' : 'M') + xs(i).toFixed(1) + ' ' + ys(p[1]).toFixed(1)).join(' ');
    if (o.area) g += `<path class="areap" d="${d} L${xs(o.pts.length - 1)} ${H - pb} L${pl} ${H - pb} Z" fill="${o.area}" opacity=".35"/>`;
    g += `<path class="drawp" d="${d}" fill="none" stroke="${o.color || '#C8372D'}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
    o.pts.forEach((p, i) => { if (o.labels && o.labels.includes(i)) g += `<text x="${xs(i)}" y="${H - 14}" text-anchor="middle" font-size="18" fill="#7A6A5C" font-family="IBM Plex Mono, monospace">${p[0]}</text>`; });
    (o.marks || []).forEach(m => { const x = xs(m.i), y = ys(o.pts[m.i][1]); g += `<g class="mark"><circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${m.color || '#C8372D'}" stroke-width="4"/><text x="${x + (m.dx || 0)}" y="${y + (m.dy || -18)}" text-anchor="${m.anchor || 'middle'}" font-size="${m.size || 22}" fill="${m.color || '#2A1E1A'}" font-family="Jua, sans-serif">${m.text}</text></g>`; });
    return g + '</svg>';
  }
  function barChart(o){
    const W = o.w || 820, H = o.h || 340, pb = 58, pt = 40, n = o.items.length, bw = (W - 40)/n*.58;
    let g = `<svg viewBox="0 0 ${W} ${H}"><line x1="10" x2="${W - 10}" y1="${H - pb}" y2="${H - pb}" stroke="#2A1E1A" stroke-width="3"/>`;
    o.items.forEach((it, i) => {
      const cx = 20 + (i + .5)*(W - 40)/n, h = Math.max(4, (o.log ? Math.log10(it.v)/Math.log10(o.max) : it.v/o.max)*(H - pb - pt));
      g += `<rect class="bar" x="${cx - bw/2}" y="${H - pb - h}" width="${bw}" height="${h}" rx="6" fill="${it.c}" stroke="#2A1E1A" stroke-width="3"/>`;
      g += `<text class="bl" x="${cx}" y="${H - pb - h - 10}" text-anchor="middle" font-size="${o.vs || 26}" fill="#2A1E1A" font-family="Jua, sans-serif">${it.t}</text>`;
      g += `<text x="${cx}" y="${H - pb + 26}" text-anchor="middle" font-size="${o.ls || 19}" fill="#2A1E1A" font-family="Gaegu, sans-serif" font-weight="700">${it.l}</text>`;
      if (it.s) g += `<text x="${cx}" y="${H - pb + 48}" text-anchor="middle" font-size="15" fill="#7A6A5C" font-family="Gochi Hand, cursive">${it.s}</text>`;
    });
    return g + '</svg>';
  }
  function gauge(o){
    const a = v => Math.PI*(1 - v/o.max);
    const p = v => [200 + 150*Math.cos(a(v)), 190 - 150*Math.sin(a(v))];
    let g = `<svg viewBox="0 0 400 220"><path d="M50 190 A150 150 0 0 1 350 190" fill="none" stroke="#EADBC4" stroke-width="30"/>`;
    (o.zones || []).forEach(z => { const [x1, y1] = p(z.a), [x2, y2] = p(z.b); g += `<path d="M${x1} ${y1} A150 150 0 0 1 ${x2} ${y2}" fill="none" stroke="${z.c}" stroke-width="30"/>`; });
    g += `<g class="needle"><line x1="200" y1="190" x2="200" y2="62" stroke="#2A1E1A" stroke-width="7" stroke-linecap="round"/><circle cx="200" cy="190" r="14" fill="#2A1E1A"/></g>`;
    return g + '</svg>';
  }
  function needle(d, tin, v0, v1, max){
    const n = d.querySelector('.needle'); const ang = v => -90 + 180*v/max;
    tl.fromTo(n, {rotation:ang(v0), svgOrigin:'200 190'}, {rotation:ang(v1), svgOrigin:'200 190', duration:1.4, ease:'elastic.out(1,0.5)'}, tin);
  }
  // camera
  const cam = {s:1, x:0, y:0, r:0};
  const camTo = (tin, o, dur, ease) => tl.to(cam, Object.assign({duration:dur || 1, ease:ease || 'power3.inOut'}, o), tin);
  const camReset = (tin, dur) => camTo(tin, {s:1, x:0, y:0, r:0}, dur || .8);

  // ---------- chapter curtains ----------
  const csign = $('csign');
  CUES.forEach(c => {
    if (!c.card) return;
    tl.to(curL, {x:CLOSED, duration:.6, ease:'power2.in'}, c.t0 - .05);
    tl.to(curR, {x:-CLOSED, duration:.6, ease:'power2.in'}, c.t0 - .05);
    tl.to(curL, {x:-OPEN, duration:.8, ease:'power3.out'}, c.t1 - .6);
    tl.to(curR, {x:OPEN, duration:.8, ease:'power3.out'}, c.t1 - .6);
    EV.push({c:c.t0, kind:'whoosh'}, {c:c.t1 - .6, kind:'whoosh'});
  });
  // opening: curtains start closed and part on the first line
  gsap.set(curL, {x:CLOSED}); gsap.set(curR, {x:-CLOSED});
  tl.to(curL, {x:-OPEN, duration:1, ease:'power3.out'}, .15);
  tl.to(curR, {x:OPEN, duration:1, ease:'power3.out'}, .15);

  // ---------- scenes (per video) ----------
  const A = {tl, T, E, cue:id => byId[id], panel, show, stagger, drawLines, growBars, reveal, count, stamp, kpop, burst, bubble, lineChart, barChart, gauge, needle, camTo, camReset};
  V.scenes(A);
  tl.to({}, {duration:.01}, D - .01);

  // ---------- reaction cam ----------
  const reactEl = buildReactionCam(); $('reactHost').appendChild(reactEl);
  const rFace = reactEl.querySelector('.rface'), rMouth = reactEl.querySelector('.rmouth'), rCap = reactEl.querySelector('.rcap'), rKo = reactEl.querySelector('.rko'), rEn = reactEl.querySelector('.ren');
  const REACTS = CUES.filter(c => c.react).map(c => ({t:c.t0 + (c.react.at || 0), d:c.react.d || 1.3, mood:c.react.mood || 'shock', ko:c.react.ko, en:c.react.en}));
  REACTS.forEach(r => EV.push({c:r.t, kind:'thump'}));
  const cutflash = $('cutflash');
  function renderReact(tt, w){
    const r = REACTS.find(q => tt >= q.t && tt < q.t + q.d);
    if (!r){ if (reactEl.style.display !== 'none') reactEl.style.display = 'none'; return false; }
    const a = tt - r.t;
    reactEl.style.display = 'block'; reactEl.dataset.mood = r.mood;
    if (rKo.__h !== r.ko){ rKo.innerHTML = r.ko; rEn.textContent = r.en; rKo.__h = r.ko; }
    const q = Math.min(1, a/.22), punch = rm ? 1 : 1.28 - .28*easeBack(q), sh = rm ? 0 : Math.max(0, 1 - a/.35)*14;
    rFace.style.transform = `translate(${(Math.sin(w*55)*sh).toFixed(1)}px,${(Math.cos(w*47)*sh).toFixed(1)}px) rotate(${r.mood === 'squint' ? -3 : 2}deg) scale(${punch.toFixed(3)})`;
    rMouth.setAttribute('transform', `translate(800 735) scale(1 ${(1 + Math.abs(Math.sin(w*9))*.15).toFixed(3)}) translate(-800 -735)`);
    const cq = clamp((a - .12)/.28, 0, 1);
    rCap.style.opacity = cq > 0 ? 1 : 0; rCap.style.transform = `rotate(-4deg) scale(${(rm ? 1 : easeBack(cq)).toFixed(3)})`;
    reactEl.style.opacity = (r.d - a) < .12 ? Math.max(0, (r.d - a)/.12).toFixed(2) : 1;
    return a < .1 ? (1 - a/.1)*.8 : 0;
  }

  // ---------- confetti (deterministic 2D) ----------
  const fx = $('fx'), fctx = fx.getContext('2d');
  const PAL = ['#F8C94A', '#E8783E', '#F29BB2', '#3E9CA3', '#7CC48A', '#C8372D', '#8FB8DE'];
  function drawFx(tt){
    const W = fx.width, H = fx.height;
    fctx.clearRect(0, 0, W, H);
    for (const b of bursts){
      const a = tt - b.t; if (a < 0 || a > 3) continue;
      for (let i = 0; i < b.n; i++){
        const vx = (rnd(i, b.t) - .5)*900, vy = -400 - rnd(i, b.t + 1)*700, drag = (1 - Math.exp(-1.5*a))/1.5;
        const x = (b.x/100)*W + vx*drag*W/1600 + Math.sin(a*6 + i)*8, y = (b.y/100)*H + (vy*drag + 520*a*a)*H/900;
        fctx.save(); fctx.translate(x, y); fctx.rotate(a*(4 + rnd(i, 3)*8)); fctx.globalAlpha = a > 2.4 ? (3 - a)/.6 : 1;
        fctx.fillStyle = PAL[i % PAL.length]; fctx.fillRect(-5*W/1280, -8*W/1280, 10*W/1280, 16*W/1280); fctx.restore();
      }
    }
  }

  // ---------- per-frame render ----------
  const subEn = $('subEn'), subKo = $('subKo'), ccN = $('ccN'), ccT = $('ccT'), ccard = $('ccard'), srcchip = $('srcchip'), camera = $('camera');
  const csN = $('csN'), csT = $('csT'), csE = $('csE');
  let lastCue = -2, lastChap = -1, speaking = false, voiceOn = false, talkFlag = null;
  const cueAt = tt => { let k = -1; for (let i = 0; i < CUES.length; i++) if (CUES[i].t0 <= tt) k = i; return k; };
  function render(tt, w){
    tl.seek(tt, true);
    // sky + set per chapter
    const k = chapAt(tt), chp = CH[k];
    if (k !== lastChap){
      chp.sky.forEach((c, j) => skyStops[j].setAttribute('stop-color', c));
      Object.keys(SETS).forEach(n => SETS[n].setAttribute('opacity', n === chp.set ? 1 : 0));
      lastChap = k;
      [...document.querySelectorAll('.chipb')].forEach((b, j) => b.setAttribute('aria-current', j === k ? 'true' : 'false'));
    }
    clouds.forEach(c => { const x = ((c.x + w*c.v) % 1900 + 1900) % 1900 - 150; c.g.setAttribute('transform', `translate(${x.toFixed(1)},${c.y})`); });
    sparkles.forEach(([s, i]) => s.setAttribute('opacity', (.45 + .55*Math.abs(Math.sin(w*1.6 + i))).toFixed(2)));
    bg.querySelectorAll('.spin').forEach(g => g.setAttribute('transform', `rotate(${((w*(+g.dataset.v)) % 360).toFixed(1)} ${g.dataset.cx} ${g.dataset.cy})`));
    aud.forEach((g, i) => { const base = g.getAttribute('transform').replace(/ translate\(0,[^)]*\)$/, ''); g.setAttribute('transform', base + ` translate(0,${(-Math.abs(Math.sin(w*3 + i))*6).toFixed(1)})`); });
    // cue-driven text
    const ci = cueAt(tt), cue = CUES[ci];
    const inCue = cue && tt < cue.t1 + .2;
    if (ci !== lastCue){
      subEn.textContent = inCue ? cue.en : ''; subKo.textContent = inCue ? cue.ko : '';
      const chq = cue ? CH[cue.ch] : CH[0];
      srcchip.textContent = cue && (cue.src || chq.src) ? '출처 · ' + (cue.src || chq.src) : '';
      if (cue && cue.card){ csN.textContent = 'CHAPTER ' + String(cue.ch).padStart(2, '0'); csT.textContent = chq.ko; csE.textContent = chq.en; }
      lastCue = ci;
    }
    const cardOn = cue && cue.card && tt > cue.t0 + .35 && tt < cue.t1 - .45;
    csign.style.opacity = cardOn ? 1 : 0;
    csign.style.transform = `translate(-50%,-50%) rotate(${cardOn ? (Math.sin(w*1.7)*1.5).toFixed(2) : 0}deg)`;
    const showCard = k > 0 && !(cue && cue.card);
    ccard.style.opacity = showCard ? 1 : 0;
    if (showCard){ ccN.textContent = 'CHAPTER ' + String(k).padStart(2, '0'); ccT.textContent = chp.ko; }
    // characters
    const tk = talkFlag != null ? talkFlag : (voiceOn ? speaking : (inCue && tt < cue.t0 + (cue.t1 - cue.t0)*.8));
    const who = cue && cue.who === 'noa' ? 'noa' : 'uchay';
    const pose = cue && cue.pose || 'idle';
    const uBob = Math.sin(w*2.4)*1.6, nBob = Math.sin(w*2.1 + 1)*1.4;
    const walkIn = clamp((tt - .3)/1.2, 0, 1);
    U.div.style.transform = `translateX(${((1 - walkIn)*-160).toFixed(1)}%)`;
    N.div.style.transform = `translateX(${((1 - walkIn)*160).toFixed(1)}%)`;
    U.body.setAttribute('transform', `translate(0,${(uBob - (walkIn < 1 ? Math.abs(Math.sin(w*14))*6 : 0)).toFixed(2)})`);
    N.body.setAttribute('transform', `translate(0,${(nBob - (walkIn < 1 ? Math.abs(Math.sin(w*14))*5 : 0)).toFixed(2)})`);
    const armR = pose === 'point' ? -125 + Math.sin(w*3)*6 : pose === 'wave' ? -150 + Math.sin(w*9)*22 : pose === 'think' ? -95 : pose === 'shrug' ? -60 : 8 + Math.sin(w*2)*4;
    const armL = pose === 'shrug' ? 60 : pose === 'think' ? 30 : -8 - Math.sin(w*2)*4;
    U.armR.setAttribute('transform', `translate(18,-60) rotate(${armR})`);
    U.armL.setAttribute('transform', `translate(-18,-60) rotate(${armL})`);
    U.head.setAttribute('transform', `rotate(${(pose === 'think' ? -8 : Math.sin(w*1.3)*2).toFixed(2)} 0 -70)`);
    U.ant.setAttribute('transform', `rotate(${(Math.sin(w*5)*4).toFixed(2)} 0 -128)`);
    const bl = (w % 3.4) < .14 ? .15 : 1;
    U.eyes.setAttribute('transform', `translate(0,${(-104*(1 - bl)).toFixed(2)}) scale(1,${bl})`);
    const uTalk = tk && who === 'uchay' && Math.sin(w*16) > -.2, nTalk = tk && who === 'noa' && Math.sin(w*15) > -.2;
    U.talk.setAttribute('opacity', uTalk ? 1 : 0); U.smile.setAttribute('opacity', uTalk ? 0 : 1);
    if (uTalk) U.talk.setAttribute('ry', (2.5 + Math.abs(Math.sin(w*16))*3).toFixed(2));
    N.talk.setAttribute('opacity', nTalk ? 1 : 0); N.smile.setAttribute('opacity', nTalk ? 0 : 1);
    N.arm.setAttribute('transform', who === 'noa' && inCue ? `rotate(${(-40 + Math.sin(w*6)*10).toFixed(1)} 26 -46)` : '');
    // counters, pops, confetti, camera
    for (const c of counters){ const p = clamp((tt - c.t0)/(c.t1 - c.t0), 0, 1); c.e.textContent = c.fmt(c.from + (c.to - c.from)*(1 - Math.pow(1 - p, 3))); }
    for (const p of pops){
      const a = tt - p.t;
      if (a < 0 || a > p.dur){ if (p.d.style.opacity !== '0') p.d.style.opacity = 0; continue; }
      const q = Math.min(1, a/.3), out = a > p.dur - .18 ? Math.max(0, (p.dur - a)/.18) : 1;
      p.d.style.opacity = (Math.min(1, q*2.5)*out).toFixed(2);
      p.d.style.transform = `translate(-50%,-50%) rotate(${(p.rot + (rm ? 0 : Math.sin(w*6 + p.t)*1.2)).toFixed(2)}deg) scale(${((rm ? 1 : easeBack(q))*(.6 + .4*out)).toFixed(3)})`;
    }
    drawFx(tt);
    const fl = renderReact(tt, w);
    // chapter-change flash
    let flash = fl || 0;
    CUES.forEach(c => { if (c.card){ const a = tt - (c.t1 - .6); if (a > 0 && a < .25) flash = Math.max(flash, 0); } });
    cutflash.style.opacity = flash.toFixed(2);
    if (!rm) camera.style.transform = `translate(${cam.x}%,${cam.y}%) rotate(${cam.r}deg) scale(${cam.s})`;
    $('subs').style.opacity = REACTS.some(r => tt >= r.t && tt < r.t + r.d) ? 0 : 1;
  }

  // ---------- playback, voice and controls ----------
  const synth = window.speechSynthesis || null;
  let enVoice = null;
  function pickVoice(){ if (!synth) return; const vs = synth.getVoices().filter(v => /^en(-|_)/i.test(v.lang)); enVoice = vs.find(v => /Google US English|Samantha|Aria|Jenny|Guy|Daniel/i.test(v.name)) || vs.find(v => /en-US/i.test(v.lang)) || vs[0] || null; }
  if (synth){ pickVoice(); synth.onvoiceschanged = pickVoice; }
  let AC = null;
  function initAudio(){ try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume && AC.resume(); } catch(e){ AC = null; } }
  function noiseBuf(dur){ const b = AC.createBuffer(1, AC.sampleRate*dur, AC.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return b; }
  function sfx(kind){
    if (!voiceOn || !AC) return;
    const n = AC.currentTime, g = AC.createGain(); g.connect(AC.destination);
    if (kind === 'pop'){ const o = AC.createOscillator(); o.frequency.setValueAtTime(520, n); o.frequency.exponentialRampToValueAtTime(1250, n + .07); g.gain.setValueAtTime(.1, n); g.gain.exponentialRampToValueAtTime(.001, n + .12); o.connect(g); o.start(n); o.stop(n + .13); }
    if (kind === 'thump'){ const o = AC.createOscillator(); o.frequency.setValueAtTime(150, n); o.frequency.exponentialRampToValueAtTime(45, n + .25); g.gain.setValueAtTime(.45, n); g.gain.exponentialRampToValueAtTime(.001, n + .3); o.connect(g); o.start(n); o.stop(n + .32); }
    if (kind === 'whoosh'){ const s = AC.createBufferSource(); s.buffer = noiseBuf(.6); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(350, n); f.frequency.exponentialRampToValueAtTime(1800, n + .45); g.gain.setValueAtTime(.001, n); g.gain.exponentialRampToValueAtTime(.14, n + .15); g.gain.exponentialRampToValueAtTime(.001, n + .55); s.connect(f); f.connect(g); s.start(n); }
  }
  let curU = null, spokenIdx = -1;
  function say(text, idx){
    if (!synth) return; synth.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; if (enVoice) u.voice = enVoice; u.rate = 1.03; u.pitch = 1.08;
    curU = u; speaking = true; spokenIdx = idx;
    const done = () => { if (curU === u) speaking = false; }; u.onend = done; u.onerror = done;
    synth.speak(u);
  }
  function stopVoice(){ if (synth) synth.cancel(); curU = null; speaking = false; }

  let T0 = 0, playing = false, lastW = performance.now()/1000, prev = 0, hold = 0;
  const playBtn = $('playBtn'), scrub = $('scrub'), tcOut = $('tcOut'), voiceBtn = $('voiceBtn');
  scrub.max = D.toFixed(2);
  function loop(){
    const w = performance.now()/1000, dt = Math.min(.1, w - lastW); lastW = w;
    if (playing){
      let adv = dt;
      const ci = cueAt(T0), c = CUES[ci];
      if (voiceOn && speaking && c && T0 + adv >= c.t1 - .05 && hold < 2.5){ adv = 0; hold += dt; }
      prev = T0; T0 = Math.min(D, T0 + adv);
      const nci = cueAt(T0);
      if (nci !== ci) hold = 0;
      if (voiceOn && nci >= 0 && nci !== spokenIdx && T0 - CUES[nci].t0 < .6) say(CUES[nci].say || CUES[nci].en, nci);
      EV.forEach(e => { if (prev < e.c && T0 >= e.c) sfx(e.kind); });
      if (T0 >= D){ playing = false; playBtn.textContent = 'Replay'; }
    }
    if (!window.__freeze) paint(T0, w);
    requestAnimationFrame(loop);
  }
  function paint(tt, w){ render(tt, w); tcOut.textContent = fmtT(tt) + ' / ' + fmtT(D); if (document.activeElement !== scrub) scrub.value = tt.toFixed(2); }
  function seek(tt){ stopVoice(); T0 = clamp(tt, 0, D); prev = T0; hold = 0; spokenIdx = cueAt(T0 - .6); lastCue = -2; paint(T0, performance.now()/1000); }
  function setPlay(p){ playing = p; playBtn.textContent = p ? 'Pause' : 'Play'; if (synth){ if (p && synth.paused) synth.resume(); if (!p && speaking) synth.pause(); } }
  function setVoice(on){ voiceOn = on && !!synth; if (on) initAudio(); if (!voiceOn) stopVoice(); voiceBtn.setAttribute('aria-pressed', voiceOn ? 'true' : 'false'); voiceBtn.textContent = voiceOn ? 'Voice on' : 'Voice off'; }
  playBtn.addEventListener('click', () => { $('startOv').hidden = true; if (T0 >= D){ seek(0); setPlay(true); return; } setPlay(!playing); });
  $('restartBtn').addEventListener('click', () => { $('startOv').hidden = true; seek(0); setPlay(true); });
  voiceBtn.addEventListener('click', () => setVoice(!voiceOn));
  $('startVoice').addEventListener('click', () => { setVoice(true); $('startOv').hidden = true; seek(0); setPlay(true); });
  $('startSilent').addEventListener('click', () => { setVoice(false); $('startOv').hidden = true; seek(0); setPlay(true); });
  scrub.addEventListener('input', () => seek(parseFloat(scrub.value)));
  const chipsEl = $('chips');
  CH.forEach((ch, k) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chipb'; b.textContent = (k ? k + ' · ' : '') + ch.ko; b.addEventListener('click', () => { $('startOv').hidden = true; const c = CUES.find(q => q.ch === k); seek(Math.max(0, c.t0 - .1)); setPlay(true); }); chipsEl.appendChild(b); });
  document.addEventListener('keydown', e => { if (e.target.closest && e.target.closest('input, button, a')) return; if (e.code === 'Space'){ e.preventDefault(); playBtn.click(); } });
  if (!synth){ voiceBtn.disabled = true; voiceBtn.textContent = 'Voice unavailable'; }
  window.__v = {
    dur:D,
    render:(tt, talk) => { talkFlag = talk == null ? null : !!talk; lastCue = -2; paint(tt, tt); },
    timeline:() => ({dur:D, cues:CUES.map(c => ({t:c.t0, d:c.t1 - c.t0, say:c.say || c.en})), ev:EV.map(e => ({c:e.c, kind:e.kind})).sort((a, b) => a.c - b.c)})
  };
  setVoice(false); voiceBtn.textContent = synth ? 'Voice off' : 'Voice unavailable';
  seek(rm ? 3 : 0);
  requestAnimationFrame(loop);
})();
