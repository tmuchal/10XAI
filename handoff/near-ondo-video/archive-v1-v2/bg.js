  // ---------- Worlds: a different background per chapter (replaces the theatre set) ----------
  const AMB = []; window.__AMB = AMB;
  const BG = {};
  (function(){
    const stage = $('stage'), fg = $('fg'), defs = stage.querySelector('defs');
    const root = el('g', {id:'bgs'}); stage.insertBefore(root, fg);
    // retire the theatre: wash, rays, blotch, floor, curtains, valance
    [...stage.children].filter(n => n.tagName === 'rect' && !n.id && !n.classList.contains('grainRect')).forEach(n => n.setAttribute('display', 'none'));
    ['rays', 'floor', 'curL', 'curR', 'valance'].forEach(id => $(id) && $(id).setAttribute('display', 'none'));
    const lin = (id, stops, x2, y2) => {
      const g = el('linearGradient', {id, x1:0, y1:0, x2:x2 == null ? 0 : x2, y2:y2 == null ? 1 : y2}, defs);
      stops.forEach(([o, c]) => el('stop', {offset:o, 'stop-color':c}, g));
      return `url(#${id})`;
    };
    const rect = (p, x, y, w, h, fill, extra) => el('rect', Object.assign({x, y, width:w, height:h, fill}, extra || {}), p);
    const inked = {stroke:INK, 'stroke-width':4, 'stroke-linejoin':'round'};
    const rnd = (i, k) => { const v = Math.sin(i*91.7 + k*37.3)*43758.5453; return v - Math.floor(v); };
    function env(name){ const g = el('g', {}, root); gsap.set(g, {autoAlpha:0}); BG[name] = g; return g; }
    function cloud(p, x, y, s, speed){
      const o = el('g', {}, p);
      el('path', {d:'M-70 22 Q-84 -8 -46 -12 Q-40 -44 -4 -40 Q24 -60 50 -30 Q86 -32 80 2 Q94 24 62 28 Z', fill:'#fff', transform:`scale(${s})`}, o, null);
      o.lastChild.setAttribute('stroke', INK); o.lastChild.setAttribute('stroke-width', 4/s);
      AMB.push((t, w) => { const xx = ((x + w*speed) % 1900 + 1900) % 1900 - 150; o.setAttribute('transform', `translate(${xx.toFixed(1)},${y})`); });
      return o;
    }
    function skyline(p, base, cols, seed, win, ink, hmin, hmax){
      let x = -20, i = 0;
      while (x < 1620){
        const w = 70 + rnd(seed + i, 1)*90, h = hmin + rnd(seed + i, 2)*(hmax - hmin), c = cols[i % cols.length];
        rect(p, x, base - h, w, h, c, ink ? inked : {});
        if (win) for (let yy = base - h + 18; yy < base - 24; yy += 30) for (let xx = x + 12; xx < x + w - 18; xx += 24)
          if (rnd(xx, yy) > .35) rect(p, xx, yy, 12, 16, rnd(yy, xx) > .5 ? '#FFF3B0' : '#E6F1FF', {rx:2, opacity:.9});
        x += w + 6; i++;
      }
    }
    const ground = (p, fill, y) => rect(p, 0, y == null ? 700 : y, 1600, 900 - (y == null ? 700 : y), fill);
    const hline = (p, y, c, w) => el('line', {x1:0, x2:1600, y1:y, y2:y, stroke:c || INK, 'stroke-width':w || 4}, p);

    // 1 · city (bright day)
    { const g = env('city');
      rect(g, 0, 0, 1600, 900, lin('gCity', [[0, '#7FCBF2'], [.75, '#DDF4FF']]));
      el('circle', {cx:1330, cy:160, r:110, fill:'#FFF3B0', opacity:.6}, g); el('circle', {cx:1330, cy:160, r:66, fill:'#FFE27A', ...inked}, g);
      [[200, 150, 1, 14], [760, 110, .8, 9], [1100, 240, .7, 12]].forEach(([x, y, s, v]) => cloud(g, x, y, s, v));
      skyline(g, 700, ['#BCCBEC', '#D7C6F0', '#F4CFC2'], 3, false, false, 180, 380);
      skyline(g, 700, ['#7FA7D9', '#F29E7F', '#8FCB9B', '#F6D06F', '#C4A6E8'], 11, true, true, 110, 300);
      ground(g, '#D9D2C5'); hline(g, 700); hline(g, 760, '#B9B0A2', 3);
      for (let x = 0; x < 1600; x += 120) el('line', {x1:x, x2:x - 60, y1:700, y2:900, stroke:'#C4BBAD', 'stroke-width':3}, g);
      [1360].forEach(x => { rect(g, x, 440, 12, 262, '#3B4A5C', inked); rect(g, x - 26, 420, 64, 26, '#FFE27A', Object.assign({rx:10}, inked)); });
    }
    // 2 · rooftop
    { const g = env('rooftop');
      rect(g, 0, 0, 1600, 900, lin('gRoof', [[0, '#FFC98B'], [.7, '#FFF0D9']]));
      el('circle', {cx:240, cy:180, r:80, fill:'#FFE9A8', opacity:.8}, g);
      [[500, 130, .9, 10], [1150, 90, .7, 7]].forEach(([x, y, s, v]) => cloud(g, x, y, s, v));
      skyline(g, 640, ['#F5B99C', '#F2C7B0', '#E9A98F'], 21, false, false, 120, 300);
      const wt = el('g', {}, g);
      rect(wt, 1180, 420, 16, 220, '#7A5236', inked); rect(wt, 1270, 420, 16, 220, '#7A5236', inked);
      el('path', {d:'M1160 420 L1306 420 L1296 300 Q1233 270 1170 300 Z', fill:'#B7773F', ...inked}, wt);
      el('path', {d:'M1160 300 L1233 250 L1306 300', fill:'#8C5A2E', ...inked}, wt);
      rect(g, 0, 640, 1600, 60, '#D98C6A', inked);
      for (let x = 0; x < 1600; x += 64) el('line', {x1:x, x2:x, y1:640, y2:700, stroke:'#B96F52', 'stroke-width':3}, g);
      ground(g, '#CDBFAE'); hline(g, 700);
      rect(g, 60, 560, 150, 80, '#A9B4C0', Object.assign({rx:8}, inked));
    }
    // 3 · bank vault
    { const g = env('vault');
      rect(g, 0, 0, 1600, 700, lin('gVault', [[0, '#F4EFE6'], [1, '#E3DACB']]));
      for (let y = 80; y < 700; y += 120) hline(g, y, '#D6CCBB', 3);
      [390, 1500].forEach(x => { rect(g, x - 34, 60, 68, 640, '#F7F3EA', inked); rect(g, x - 46, 40, 92, 30, '#EDE6D8', inked); rect(g, x - 46, 690, 92, 20, '#EDE6D8', inked); });
      const door = el('g', {}, g);
      el('circle', {cx:1180, cy:410, r:270, fill:'#9AA3AF', ...inked}, door);
      el('circle', {cx:1180, cy:410, r:236, fill:'#B8C0CC', ...inked}, door);
      el('circle', {cx:1180, cy:410, r:170, fill:'none', stroke:'#8B94A1', 'stroke-width':10}, door);
      for (let k = 0; k < 12; k++){ const a = k/12*Math.PI*2; el('circle', {cx:1180 + 252*Math.cos(a), cy:410 + 252*Math.sin(a), r:10, fill:'#6B7380', ...inked}, door); }
      const wheel = el('g', {}, door);
      for (let k = 0; k < 3; k++) rect(wheel, 1176, 300, 8, 220, '#6B7380', {transform:`rotate(${k*60} 1180 410)`, ...inked});
      el('circle', {cx:1180, cy:410, r:30, fill:'#D4AF37', ...inked}, wheel);
      AMB.push((t, w) => wheel.setAttribute('transform', `rotate(${(w*8)%360} 1180 410)`));
      ground(g, '#EFE9DE');
      for (let x = 0; x < 1600; x += 80) for (let y = 700; y < 900; y += 50) if (((x/80) + ((y - 700)/50)) % 2) rect(g, x, y, 80, 50, '#DCD3C2');
      hline(g, 700);
      [[1440, 690], [1500, 690], [1470, 664]].forEach(([x, y]) => el('path', {d:`M${x - 30} ${y} L${x + 30} ${y} L${x + 22} ${y - 24} L${x - 22} ${y - 24} Z`, fill:'#F2C14E', ...inked}, g));
    }
    // 4 · highway
    { const g = env('highway');
      rect(g, 0, 0, 1600, 900, lin('gHwy', [[0, '#8DD2F5'], [.7, '#E6F7FF']]));
      [[300, 120, .9, 12], [1000, 170, .7, 9]].forEach(([x, y, s, v]) => cloud(g, x, y, s, v));
      el('path', {d:'M0 560 Q200 470 420 520 T860 500 T1300 520 T1600 480 L1600 700 L0 700 Z', fill:'#A7D98F', ...inked}, g);
      el('path', {d:'M0 600 Q300 540 600 590 T1200 580 T1600 560 L1600 700 L0 700 Z', fill:'#8CCB77', ...inked}, g);
      rect(g, -10, 470, 1620, 34, '#C9CDD4', inked); rect(g, -10, 504, 1620, 12, '#9AA0AA', inked);
      for (let x = 60; x < 1600; x += 220) rect(g, x, 516, 26, 184, '#B3B8C0', inked);
      const cars = [];
      for (let k = 0; k < 7; k++){
        const c = el('g', {}, g), col = ['#E0342C', '#F2C14E', '#5B8FD1', '#7CC48A', '#F08A5D', '#C4A6E8', '#fff'][k];
        rect(c, -28, -22, 56, 22, col, Object.assign({rx:6}, inked)); rect(c, -14, -34, 30, 14, '#DDF4FF', Object.assign({rx:4}, inked));
        el('circle', {cx:-16, cy:0, r:6, fill:INK}, c); el('circle', {cx:16, cy:0, r:6, fill:INK}, c);
        cars.push([c, k]);
      }
      AMB.push((t, w) => cars.forEach(([c, k]) => { const x = ((k*260 + w*(160 + k*14)) % 1800) - 100; c.setAttribute('transform', `translate(${x.toFixed(1)},470)`); }));
      ground(g, '#9FD27E'); hline(g, 700);
    }
    // 5 · trading floor
    { const g = env('trading');
      rect(g, 0, 0, 1600, 700, lin('gTrade', [[0, '#8E6BE0'], [1, '#D38BE0']]));
      const bulbs = [];
      for (let x = 30; x < 1600; x += 50){ const b = el('circle', {cx:x, cy:40, r:9, fill:'#FFE27A', stroke:INK, 'stroke-width':2}, g); bulbs.push(b); }
      AMB.push((t, w) => bulbs.forEach((b, i) => b.setAttribute('opacity', (Math.floor(w*6) + i) % 3 ? 1 : .35)));
      [[240, 120], [1380, 120]].forEach(([x, y], k) => {
        rect(g, x - 130, y, 260, 170, '#1E2A44', Object.assign({rx:10}, inked));
        let d = `M${x - 110} ${y + 130}`; for (let i = 1; i <= 10; i++) d += ` L${x - 110 + i*22} ${y + 130 - (k ? i*9 : (i % 3)*20 + i*4)}`;
        el('path', {d, fill:'none', stroke:k ? '#7CC48A' : '#F2C14E', 'stroke-width':6}, g);
      });
      ground(g, '#D94A5A'); hline(g, 700);
      for (let x = -40; x < 1640; x += 80) for (let y = 720; y < 900; y += 60) el('path', {d:`M${x} ${y} l20 20 l-20 20 l-20 -20 Z`, fill:'#F2C14E', opacity:.35}, g);
    }
    // 6 · above the clouds
    { const g = env('clouds');
      rect(g, 0, 0, 1600, 900, lin('gSky', [[0, '#6FC2F2'], [.8, '#FFE9CC']]));
      el('circle', {cx:1400, cy:140, r:90, fill:'#FFF0B8', opacity:.7}, g);
      [[100, 140, 1.1, 18], [700, 90, .9, 12], [1200, 260, .8, 22], [400, 330, .7, 16]].forEach(([x, y, s, v]) => cloud(g, x, y, s, v));
      const bank = el('path', {d:'M0 720 Q60 650 140 690 Q200 620 290 680 Q360 610 450 670 Q520 600 620 670 Q700 610 790 680 Q870 620 960 680 Q1040 610 1130 670 Q1210 620 1290 680 Q1380 620 1460 680 Q1540 640 1600 690 L1600 900 L0 900 Z', fill:'#fff', ...inked}, g);
      AMB.push((t, w) => bank.setAttribute('transform', `translate(${(Math.sin(w*.6)*12).toFixed(1)},0)`));
    }
    // 7 · train station
    { const g = env('station');
      rect(g, 0, 0, 1600, 700, '#F2E6D0');
      for (let k = 0; k < 5; k++){ const x = 80 + k*300; el('path', {d:`M${x} 560 L${x} 250 Q${x + 120} 110 ${x + 240} 250 L${x + 240} 560 Z`, fill:'#BFE6FA', ...inked}, g); el('line', {x1:x + 120, x2:x + 120, y1:170, y2:560, stroke:INK, 'stroke-width':3}, g); }
      rect(g, 0, 560, 1600, 20, '#C9B48F', inked);
      const clock = el('g', {}, g);
      el('circle', {cx:1440, cy:110, r:56, fill:'#fff', ...inked}, clock);
      const hand = el('line', {x1:1440, y1:110, x2:1440, y2:70, stroke:INK, 'stroke-width':5, 'stroke-linecap':'round'}, clock);
      AMB.push((t, w) => hand.setAttribute('transform', `rotate(${(w*90)%360} 1440 110)`));
      rect(g, 60, 70, 520, 120, '#1E2A44', Object.assign({rx:10}, inked));
      hand; el('text', {x:84, y:118, 'font-size':30, fill:'#FFD84A', class:'mono'}, g, 'RALLY EXPRESS  DEPARTED');
      el('text', {x:84, y:164, 'font-size':30, fill:'#9AE6B4', class:'mono'}, g, 'ONDO LOCAL    SEP 23');
      ground(g, '#D8CFC0'); rect(g, 0, 694, 1600, 14, '#FFD84A', inked);
    }
    // 8 · beach
    { const g = env('beach');
      rect(g, 0, 0, 1600, 900, lin('gBeach', [[0, '#79CFF3'], [.6, '#FFF1D2']]));
      el('circle', {cx:1250, cy:190, r:84, fill:'#FFE27A', ...inked}, g);
      [[300, 120, .9, 10], [900, 80, .7, 7]].forEach(([x, y, s, v]) => cloud(g, x, y, s, v));
      rect(g, 0, 520, 1600, 190, '#4FB0D9', inked);
      const crest = el('path', {d:'', fill:'none', stroke:'#fff', 'stroke-width':6, 'stroke-linecap':'round'}, g);
      AMB.push((t, w) => { let d = ''; for (let k = 0; k < 9; k++){ const x = ((k*200 + w*40) % 1800) - 100; d += `M${x} ${560 + (k%3)*40} q30 -14 60 0 `; } crest.setAttribute('d', d); });
      ground(g, '#F6DDA0', 690); hline(g, 690);
      const palm = el('g', {}, g);
      el('path', {d:'M1500 700 Q1480 520 1440 400', fill:'none', stroke:'#8C5A2E', 'stroke-width':22, 'stroke-linecap':'round'}, palm);
      [[-120, -20], [-60, -70], [20, -60], [80, 0], [-150, 40]].forEach(([dx, dy]) => el('path', {d:`M1440 400 Q${1440 + dx/2} ${400 + dy - 40} ${1440 + dx} ${400 + dy}`, fill:'none', stroke:'#3E9A4A', 'stroke-width':18, 'stroke-linecap':'round'}, palm));
      AMB.push((t, w) => palm.setAttribute('transform', `rotate(${(Math.sin(w*1.2)*1.5).toFixed(2)} 1500 700)`));
    }
    // 9 · courtroom
    { const g = env('court');
      rect(g, 0, 0, 1600, 700, '#C98A55');
      for (let x = 20; x < 1600; x += 200) rect(g, x, 40, 170, 250, '#B97A48', inked);
      for (let x = 20; x < 1600; x += 200) rect(g, x, 320, 170, 250, '#B97A48', inked);
      el('circle', {cx:800, cy:150, r:84, fill:'#F2C14E', ...inked}, g);
      el('circle', {cx:800, cy:150, r:60, fill:'none', stroke:INK, 'stroke-width':3}, g);
      el('path', {d:'M770 170 L830 130 M760 130 L840 130 M790 118 L810 118', stroke:INK, 'stroke-width':6, 'stroke-linecap':'round'}, g);
      rect(g, 0, 580, 1600, 120, '#8C5A2E', inked);
      ground(g, '#D9A56A'); hline(g, 700);
      for (let x = 0; x < 1600; x += 90) el('line', {x1:x, x2:x, y1:700, y2:900, stroke:'#C48E55', 'stroke-width':3}, g);
    }
    // 10 · boardroom
    { const g = env('boardroom');
      rect(g, 0, 0, 1600, 700, '#EFE7DA');
      const win = el('g', {}, g);
      rect(win, 250, 90, 1100, 470, lin('gBoard', [[0, '#8DD2F5'], [1, '#E4F6FF']]), inked);
      const sk = el('g', {}, win); skyline(sk, 560, ['#BCCBEC', '#D7C6F0', '#9FB8E0'], 41, true, false, 120, 330);
      sk.setAttribute('clip-path', 'url(#boardClip)');
      const cp = el('clipPath', {id:'boardClip'}, defs); rect(cp, 250, 90, 1100, 470, '#000');
      for (let x = 250; x <= 1350; x += 275) el('line', {x1:x, x2:x, y1:90, y2:560, stroke:INK, 'stroke-width':6}, win);
      el('line', {x1:250, x2:1350, y1:330, y2:330, stroke:INK, 'stroke-width':4}, win);
      ground(g, '#6E86B8'); hline(g, 700);
      [[150, 700], [1470, 700]].forEach(([x, y]) => { el('path', {d:`M${x - 34} ${y} L${x + 34} ${y} L${x + 26} ${y - 70} L${x - 26} ${y - 70} Z`, fill:'#E08C5A', ...inked}, g); [-30, 0, 30].forEach(a => el('path', {d:`M${x} ${y - 70} Q${x + a} ${y - 150} ${x + a*1.6} ${y - 190}`, fill:'none', stroke:'#3E9A4A', 'stroke-width':16, 'stroke-linecap':'round'}, g)); });
    }
    // 11 · showroom with spotlights
    { const g = env('showroom');
      rect(g, 0, 0, 1600, 700, lin('gShow', [[0, '#B9A6F2'], [1, '#F4E9FF']]));
      for (let x = 0; x < 1600; x += 90) el('path', {d:`M${x} 0 Q${x + 45} 350 ${x} 700`, fill:'none', stroke:'#A08ADF', 'stroke-width':10, opacity:.5}, g);
      const beams = [];
      [640, 920, 1200].forEach(x => { const b = el('path', {d:`M${x - 40} 0 L${x + 40} 0 L${x + 150} 700 L${x - 150} 700 Z`, fill:'#FFF6C8', opacity:.45}, g); beams.push(b); });
      AMB.push((t, w) => beams.forEach((b, i) => b.setAttribute('opacity', (.35 + .15*Math.sin(w*2 + i)).toFixed(2))));
      ground(g, '#8E78D6'); hline(g, 700);
      [640, 920, 1200].forEach(x => el('ellipse', {cx:x, cy:760, rx:170, ry:30, fill:'#FFF6C8', opacity:.45}, g));
    }
    // 12 · supermarket aisle
    { const g = env('market');
      rect(g, 0, 0, 1600, 700, '#F7F2E8');
      for (let r = 0; r < 3; r++){
        const y = 200 + r*150;
        rect(g, 0, y + 110, 1600, 16, '#B9C0CA', inked);
        for (let x = 10; x < 1600; x += 58){ const h = 60 + rnd(x, r)*44; rect(g, x, y + 110 - h, 48, h, ['#F08A5D', '#7CC48A', '#5B8FD1', '#F2C14E', '#E86A7A', '#C4A6E8'][Math.floor(rnd(r, x)*6)], Object.assign({rx:4}, {stroke:INK, 'stroke-width':2.5})); }
      }
      rect(g, 560, 40, 480, 80, '#E0342C', Object.assign({rx:12}, inked));
      el('text', {x:800, y:94, 'text-anchor':'middle', 'font-size':40, fill:'#fff', class:'hand'}, g, 'AISLE 3 · ETF BASKETS');
      ground(g, '#EAE4D8'); hline(g, 700);
      for (let x = 0; x < 1600; x += 100) for (let y = 700; y < 900; y += 50) if (((x/100) + ((y - 700)/50)) % 2) rect(g, x, y, 100, 50, '#DCD4C4');
    }
    // 13 · blueprint studio | factory (split)
    { const g = env('split');
      rect(g, 0, 0, 900, 700, '#3C7CC0'); rect(g, 900, 0, 700, 700, '#D6DAE0');
      for (let x = 0; x < 900; x += 40) el('line', {x1:x, x2:x, y1:0, y2:700, stroke:'#fff', 'stroke-width':1, opacity:.25}, g);
      for (let y = 0; y < 700; y += 40) el('line', {x1:0, x2:900, y1:y, y2:y, stroke:'#fff', 'stroke-width':1, opacity:.25}, g);
      el('circle', {cx:180, cy:560, r:70, fill:'none', stroke:'#fff', 'stroke-width':3, opacity:.6}, g);
      el('path', {d:'M110 560 H250 M180 490 V630', stroke:'#fff', 'stroke-width':2, opacity:.6}, g);
      [[980, 80, 40], [1100, 0, 30]].forEach(([x, y, w]) => rect(g, x, y, w, 700, '#9AA0AA', inked));
      el('path', {d:'M900 200 H1600 M900 240 H1600', stroke:'#8B94A1', 'stroke-width':14}, g);
      const bg1 = el('g', {}, g);
      for (let k = 0; k < 8; k++) rect(bg1, 1454, 60, 12, 30, '#B3B8C0', {transform:`rotate(${k*45} 1460 130)`});
      el('circle', {cx:1460, cy:130, r:50, fill:'#B3B8C0', ...inked}, bg1);
      AMB.push((t, w) => bg1.setAttribute('transform', `rotate(${(w*30)%360} 1460 130)`));
      rect(g, 0, 700, 900, 200, '#2F6AA8'); rect(g, 900, 700, 700, 200, '#BFC4CC'); hline(g, 700);
      for (let x = 900; x < 1600; x += 60) el('path', {d:`M${x} 690 l30 0 l-20 20 l-30 0 Z`, fill:'#FFD84A'}, g);
    }
    // 14 · airport departures
    { const g = env('airport');
      rect(g, 0, 0, 1600, 700, '#E9EEF3');
      rect(g, 0, 60, 1600, 440, lin('gAir', [[0, '#7CC8F2'], [1, '#DDF4FF']]), inked);
      for (let x = 0; x <= 1600; x += 200) el('line', {x1:x, x2:x, y1:60, y2:500, stroke:INK, 'stroke-width':6}, g);
      const plane = el('g', {}, g);
      el('path', {d:'M-90 0 Q-40 -18 80 -10 Q110 -6 110 4 Q80 12 -60 12 Z', fill:'#fff', ...inked}, plane);
      el('path', {d:'M0 0 L-40 50 L-10 50 L30 2 Z M-70 -4 L-90 -40 L-72 -40 L-50 -6 Z', fill:'#E0342C', ...inked}, plane);
      AMB.push((t, w) => { const x = ((w*120) % 2000) - 200; plane.setAttribute('transform', `translate(${x.toFixed(1)},${(260 - x*.05).toFixed(1)}) rotate(-3)`); });
      rect(g, 1080, 100, 460, 170, '#1E2A44', Object.assign({rx:10}, inked));
      [['SEOUL', '✓', '#9AE6B4'], ['SINGAPORE', '✓', '#9AE6B4'], ['NEW YORK', '✗', '#FF8A7E']].forEach(([c, s, col], i) => { el('text', {x:1104, y:146 + i*44, 'font-size':28, fill:'#FFD84A', class:'mono'}, g, c); el('text', {x:1500, y:146 + i*44, 'font-size':30, fill:col, class:'mono', 'text-anchor':'end'}, g, s); });
      rect(g, 0, 500, 1600, 200, '#F4F6F8');
      ground(g, '#DDE5EC'); hline(g, 700);
      for (let x = 0; x < 1600; x += 160) el('line', {x1:x, x2:x - 40, y1:700, y2:900, stroke:'#C9D3DC', 'stroke-width':3}, g);
    }
    // 15 · stock exchange
    { const g = env('exchange');
      rect(g, 0, 0, 1600, 700, lin('gEx', [[0, '#DCEBFA'], [1, '#F4F9FF']]));
      rect(g, 0, 60, 1600, 70, '#1E2A44', inked);
      const tick = el('text', {x:0, y:108, 'font-size':38, fill:'#9AE6B4', class:'mono'}, g, 'ONDO ▲ +18%   BLKHIon ▲ NEW   BLKDIGon ▲ NEW   BLKGRWon ▲ NEW   BTC ▲ 85,000   ONDO ▲ +18%   BLKHIon ▲ NEW   BLKDIGon ▲ NEW   BLKGRWon ▲ NEW   BTC ▲ 85,000');
      AMB.push((t, w) => tick.setAttribute('x', (-((w*140) % 1500)).toFixed(1)));
      [[260, 190], [1340, 190]].forEach(([x, y], k) => { rect(g, x - 150, y, 300, 180, '#1E2A44', Object.assign({rx:10}, inked)); let d = `M${x - 130} ${y + 150}`; for (let i = 1; i <= 12; i++) d += ` L${x - 130 + i*21} ${y + 150 - i*9 - (i % 2)*14}`; el('path', {d, fill:'none', stroke:'#7CC48A', 'stroke-width':6}, g); });
      ground(g, '#C9D6E4'); hline(g, 700);
    }
  })();
  function wireWorlds(map){
    const S0 = map[0];
    gsap.set(BG[S0], {autoAlpha:1});
    SC.forEach((sc, i) => { if (!i) return; const a = map[i - 1], b = map[i]; if (a !== b){ tl.set(BG[a], {autoAlpha:0}, sc.t); tl.set(BG[b], {autoAlpha:1}, sc.t); } });
  }

