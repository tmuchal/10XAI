/* Harness Theater: the film. Scenes are pure functions of local time; cue timings come from
 * timeline.js (generated from script.json by build_audio.py), so every beat lands on the voice.
 *   FILM.frame(t) → SVG markup for time t (seconds) · FILM.total → runtime
 */
(function (root) {
  const K = root.Kit, TL = root.TL;
  const { W, H, FLOOR, INK, C, n, k, ease, pop, bob, T, R, noa, crew, uchu, panel, bubble, card, kanban, KCOLS, meter, gate, stampMark, star, burst, confetti, chip, arrow, sparkle } = K;
  const lerp = (a, b, p) => a + (b - a) * p;
  const g = (x, y, s, inner, op) => `<g transform="translate(${n(x)},${n(y)}) scale(${n(s * 1000) / 1000})"${op != null ? ` opacity="${n(op)}"` : ''}>${inner}</g>`;
  const fade = (p, inner) => p <= 0 ? '' : `<g opacity="${n(Math.min(1, p))}">${inner}</g>`;
  const popAt = (lt, t0, x, y, inner, d) => { const p = k(lt, t0, d || .35); if (p <= 0) return ''; return g(x, y, pop(p), inner); };
  const CREW = {
    decompose: ['#5b8def', 'scissors', '분해'], gapfill: ['#f0a92a', 'pencil', '빈칸'], verify: ['#e0352b', 'mag', '검증'],
    runner: ['#2fb67a', 'watch', '실행'], deploy: ['#a86af2', 'box', '배포'], orchestrator: ['#f25a7a', 'baton', '지휘'],
  };
  const member = (role, x, y, s, lt, o) => { const [c, p, l] = CREW[role]; return crew(x, y - Math.max(0, (o && o.hop) || 0), s, Object.assign({ bandana: c, prop: p, label: l, eyes: 'dot', crown: role === 'orchestrator' }, o || {})); };
  const hop = (lt, t0) => { const p = k(lt, t0, .35); return p > 0 && p < 1 ? Math.sin(p * Math.PI) * 26 : 0; };

  /* ---------------- scenes ---------------- */
  const S = {};

  S.hook = (lt, c) => {
    let s = '';
    // the viral post
    const postIn = pop(k(lt, .15, .5)), postOut = ease(k(lt, c[3], .6));
    const post = panel(-150, -130, 300, 260, { fill: '#ffffff' }) + `<circle cx="-118" cy="-102" r="14" fill="#f7b3c8" stroke="${INK}" stroke-width="2"/>` + T(-96, -97, '@hype.ai', 17, { a: 'start' }) + T(-96, -80, 'trust me bro', 12, { a: 'start', f: '#9a8272' }) + T(0, -24, 'FREE!', 58, { f: C.red, stroke: '#fff', sw: 6 }) + T(0, 16, '1 prompt · 5 min', 22) + star(-44, 58, 13) + star(0, 58, 13, '#f7b3c8') + star(44, 58, 13, '#9fd3f5') + T(0, 104, '♥ 48.2K   ↻ 9.1K', 16, { f: '#9a8272' });
    if (postIn > 0) s += g(840 + postOut * 700, 280 + bob(lt, .5, 4), postIn * (1 + .04 * Math.sin(lt * 6) * (lt < c[1] ? 1 : 0)), `<g transform="rotate(${n(-4 + 8 * k(lt, c[2] + 1.6, .2) - 4 * k(lt, c[2] + 1.8, .3))})">${post}${stampMark(10, -20, '재보자! MEASURE', k(lt, c[2] + 1.6, .5), -12)}</g>`);
    // Uchu, over the moon about it
    const ux = lerp(640, 1040, ease(k(lt, c[3], .7)));
    s += uchu(ux, FLOOR - 4 - Math.abs(Math.sin(lt * 5)) * (lt < c[1] ? 22 : 6), 1.25, { arms: 'up', mood: lt < c[1] ? 'grin' : lt < c[3] ? 'squint' : 'grin' });
    if (lt < c[1] + .4) s += fade(k(lt, .2, .3) - k(lt, c[1] + .1, .3), bubble(560, 330, '*공짜*래!!', { z: 26, tail: [610, 400] }));
    // Noa slides in
    const nx = lerp(-140, 330, ease(k(lt, c[1], .8)));
    s += noa(nx, FLOOR - 4, 1.35, { pose: lt > c[3] ? 'wave' : lt > c[2] + 1.3 ? 'point' : 'idle', mood: lt > c[3] ? 'grin' : 'flat', sq: lt > c[1] && lt < c[1] + .8 ? .5 * Math.sin(k(lt, c[1], .8) * Math.PI * 3) : 0 });
    // title card
    const tp = k(lt, c[3] + .1, .6);
    if (tp > 0) s += g(640, lerp(-120, 190, ease(tp)), 1, panel(-300, -80, 600, 150, { fill: C.paper }) + T(0, -34, 'HARNESS THEATER', 16, { f: '#d2443a', ls: 5 }) + T(0, 16, '하네스 극장', 54) + T(0, 52, 'It said FREE. We measured.', 20, { f: '#6b4a36' }));
    s += confetti(lt, c[3] + .3, 60, 11, [140, 60, 1140, 560]);
    return s;
  };

  S.traps = (lt, c) => {
    let s = '';
    const dim = 1 - .55 * k(lt, c[3], .5);
    // the post goes into the model
    const intro = 1 - k(lt, c[1] - .2, .4);
    if (intro > 0) {
      const px = lerp(360, 620, ease(k(lt, .6, 1.4)));
      s += fade(intro, g(700, 330, 1, `<rect x="-90" y="-80" width="180" height="160" rx="26" fill="#cfe3f7" stroke="${INK}" stroke-width="3"/><circle cx="-34" cy="-14" r="12" fill="${INK}"/><circle cx="34" cy="-14" r="12" fill="${INK}"/><path d="M-26,30 Q0,48 26,30" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` + T(0, -48, 'AI', 26)) + (px < 600 ? card(px - 70, 300, 140, 44, 'viral post', { stripe: C.red }) : ''));
    }
    const P = [
      [370, '숨은 비용', 'Hidden cost', `<circle cx="0" cy="-8" r="38" fill="${C.yellow}" stroke="${INK}" stroke-width="3"/>` + T(0, 6, '$?', 36) + `<rect x="30" y="-40" width="54" height="70" rx="4" fill="#fff" stroke="${INK}" stroke-width="2.4" transform="rotate(10)"/>` + T(62, 4, '???', 16, { r: 10 })],
      [640, '빠진 단계', 'Skipped steps', card(-90, -50, 180, 30, '1. clone repo', {}) + card(-90, -10, 180, 30, '2. ???', { kind: 'gap' }) + card(-90, 30, 180, 30, '3. deploy', {})],
      [910, '확인 안 된 행동', 'Unchecked action', `<circle cx="0" cy="0" r="36" fill="#2b2b33" stroke="${INK}" stroke-width="3"/><path d="M0,-36 q12,-26 32,-22" fill="none" stroke="#8a5a2b" stroke-width="4"/>` + star(34, -60, 12 + 3 * Math.sin(lt * 20), C.yellow) + T(0, 8, 'rm -rf', 16, { f: C.yellow })],
    ];
    P.forEach(([x, ko, en, art], i) => {
      const t0 = c[1] + [.1, 1.1, 2.2][i];
      s += popAt(lt, t0, x + 20, 320, `<g opacity="${n(dim)}">` + panel(-120, -140, 240, 260, {}) + g(0, -30, 1, art) + T(0, 72, ko, 28) + T(0, 100, en, 17, { f: '#6b4a36' }) + `</g>`);
    });
    // Uchu's folder disaster
    const up = k(lt, c[2], .4);
    if (up > 0) {
      s += uchu(1080, FLOOR - 4, 1.1, { mood: 'shock', arms: 'cheeks', sweat: true });
      s += popAt(lt, c[2] + .1, 1060, 390, `<path d="M-40,-24 L-12,-24 L-4,-14 L40,-14 L40,30 L-40,30 Z" fill="#f5c53b" stroke="${INK}" stroke-width="2.6"/><path d="M-26,-10 L26,26 M26,-10 L-26,26" stroke="${C.red}" stroke-width="6" stroke-linecap="round"/>` + T(0, 60, 'DELETED', 16, { f: C.red }));
      for (let i = 0; i < 4; i++) { const p = k(lt, c[2] + i * .12, 1.2); if (p > 0 && p < 1) s += `<circle cx="${n(1080 + (i - 1.5) * 30 * p)}" cy="${n(430 - 80 * p)}" r="${n(14 + 22 * p)}" fill="#d9d4cc" opacity="${n(.7 * (1 - p))}"/>`; }
    }
    // a model with no structure
    const mp = k(lt, c[3], .5);
    if (mp > 0) { const wob = Math.sin(lt * 7) * 8; s += g(640, 470, pop(mp), `<g transform="rotate(${n(wob)})"><rect x="-80" y="-70" width="160" height="120" rx="20" fill="#cfe3f7" stroke="${INK}" stroke-width="3"/><path d="M-40,-24 l14,14 M-26,-24 l-14,14 M26,-24 l14,14 M40,-24 l-14,14" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="0" cy="22" rx="10" ry="12" fill="${INK}"/>${T(0, -38, 'MODEL', 18)}</g>` + T(0, 80, '구조 없음 · no structure', 17, { f: '#6b4a36' })); }
    s += noa(210, FLOOR - 4, 1.2, { pose: lt > c[3] ? 'shrug' : lt > c[0] ? 'point' : 'idle', mood: lt > c[2] && lt < c[3] ? 'o' : 'flat' });
    return s;
  };

  S.harness = (lt, c) => {
    let s = '';
    // equation
    const eq = [[300, 'MODEL', '#8fb3d9'], [410, '+', null], [540, 'HARNESS', '#f0a92a'], [670, '=', null], [790, 'AGENT', '#2fb67a']];
    const eqT = [c[1] + .3, c[1] + .8, c[1] + 1.2, c[1] + 1.8, c[1] + 2.2];
    eq.forEach(([x, t, col], i) => { s += popAt(lt, eqT[i], x + 80, 196, col ? chip(0, 8, t, col, { z: 26 }) : T(0, 16, t, 44)); });
    if (lt > eqT[2]) s += fade(k(lt, eqT[2] + .3, .4), T(620, 262, '가이드 · 센서 · 게이트 · 샌드박스', 18, { f: '#6b4a36' }));
    // the model gets strapped in
    const mp = pop(k(lt, .1, .5)), strap = k(lt, c[0] + .9, .35);
    const wob = (1 - strap) * Math.sin(lt * 7) * 7;
    if (lt < c[2] + .2) s += g(440, 440, mp * (1 - k(lt, c[2], .3)), `<g transform="rotate(${n(wob)})"><rect x="-80" y="-70" width="160" height="120" rx="20" fill="#cfe3f7" stroke="${INK}" stroke-width="3"/>${strap > .5 ? `<circle cx="-30" cy="-16" r="10" fill="${INK}"/><circle cx="30" cy="-16" r="10" fill="${INK}"/><path d="M-22,22 Q0,36 22,22" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` : `<path d="M-40,-24 l14,14 M-26,-24 l-14,14 M26,-24 l14,14 M40,-24 l-14,14" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`}${T(0, -40, 'MODEL', 18)}${strap > 0 ? `<g opacity="${n(strap)}"><path d="M-84,-60 L84,40" stroke="#6b3f22" stroke-width="14" stroke-linecap="round"/><path d="M84,-60 L-84,40" stroke="#6b3f22" stroke-width="14" stroke-linecap="round"/><rect x="-16" y="-24" width="32" height="26" rx="5" fill="${C.yellow}" stroke="${INK}" stroke-width="2.4"/></g>` : ''}</g>` + (strap > 0 ? burst(110, -70, 34, 'CLICK!', { z: 14 }) : ''));
    // guides and sensors
    const gp = k(lt, c[2], .4);
    if (gp > 0) {
      s += g(620, 420, pop(gp), panel(-380, -110, 760, 220, {}) + `<line x1="-300" y1="30" x2="300" y2="30" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
        T(-240, 72, 'BEFORE', 16, { f: '#6b4a36', ls: 2 }) + T(0, 72, 'ACT', 16, { f: '#6b4a36', ls: 2 }) + T(240, 72, 'AFTER', 16, { f: '#6b4a36', ls: 2 }) +
        `<circle cx="0" cy="30" r="12" fill="${C.yellow}" stroke="${INK}" stroke-width="2.4"/>` +
        g(-240, -20, 1, `<line x1="0" y1="40" x2="0" y2="-40" stroke="#8a5a2b" stroke-width="6"/><path d="M-4,-44 L70,-44 L88,-30 L70,-16 L-4,-16 Z" fill="#fff" stroke="${INK}" stroke-width="2.4"/>` + T(38, -24, '가이드', 18)) +
        g(240, -30, 1, `<g transform="rotate(${n(k(lt, c[2] + 2.4, .1) > 0 && lt < c[2] + 3.4 ? Math.sin(lt * 30) * 18 : 0)})"><path d="M-26,34 Q-26,-12 0,-14 Q26,-12 26,34 Z" fill="${C.yellow}" stroke="${INK}" stroke-width="2.6"/><circle cx="0" cy="38" r="6" fill="${INK}"/></g>` + T(0, -30, '센서', 18)) +
        (lt > c[2] + 2.4 && lt < c[2] + 3.6 ? T(300, -50, 'DING!', 24, { f: C.red, stroke: '#fff', sw: 4, r: 8 }) : '') +
        fade(k(lt, c[2] + .5, .3), arrow(-200, -56, -60, -56, {})) + fade(k(lt, c[2] + 1.6, .3), arrow(60, -56, 200, -56, {})));
    }
    // a million lines
    const cp = k(lt, c[3], .4);
    if (cp > 0) {
      const v = Math.round(1000000 * ease(k(lt, c[3] + .3, 2.4)));
      s += g(620, 420, pop(cp), panel(-300, -100, 600, 190, { fill: '#fffdf2' }) + T(0, -30, v.toLocaleString('en-US'), 60, { f: '#2f6fd6' }) + T(0, 14, 'lines of code · 코드 줄 수', 20, { f: '#6b4a36' }) + T(0, 58, '손으로 쓴 줄: 0 · OpenAI 발표 기준', 18, { f: C.red }));
    }
    s += noa(1060, FLOOR - 4, 1.25, { pose: lt > c[1] && lt < c[2] ? 'point' : lt > c[3] ? 'think' : 'idle', flip: true, mood: lt > c[3] + 2 ? 'grin' : 'smile' });
    return s;
  };

  S.ontology = (lt, c) => {
    let s = '';
    const cats = [['명사 Objects', '#5b8def', 410], ['관계 Links', '#f0a92a', 640], ['동사 Actions', '#2fb67a', 870]];
    cats.forEach(([t, col, x], i) => { s += popAt(lt, c[1] + i * .6, x + 60, 196, chip(0, 8, t, col, { z: 22 })); });
    // the card
    const cp = k(lt, c[0] + 1.6, .5);
    if (cp > 0) {
      s += g(640, lerp(520, 330, ease(cp)), 1, card(-170, -40, 340, 80, 'Deploy the agent', { z: 26, stripe: '#5b8def' }) + T(-150, 70, 'card · 카드 한 장', 15, { a: 'start', f: '#6b4a36' }));
    }
    // four typed tags
    const tags = [['claim', '"free"', '#f7b3c8', -300, -30], ['measured', '?', '#cfe3f7', 300, -30], ['risk', '72', '#ffd0c8', -300, 60], ['gate', 'hold', '#d3f2e3', 300, 60]];
    tags.forEach(([name, val, col, dx, dy], i) => {
      const t0 = c[2] + .05 + i * .55, p = k(lt, t0, .35);
      if (p <= 0) return;
      const x = 640 + dx, y = 330 + dy;
      s += `<line x1="${640 + Math.sign(dx) * 170}" y1="330" x2="${n(x - Math.sign(dx) * 70)}" y2="${y}" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4" opacity="${n(p)}"/>`;
      const ok = k(lt, c[4] + .6 + i * .3, .2);
      s += g(x, y, pop(p), `<path d="M-70,-26 L50,-26 L74,0 L50,26 L-70,26 Z" fill="${col}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="52" cy="0" r="6" fill="#fff" stroke="${INK}" stroke-width="2"/>` + T(-8, -4, name, 15, { f: '#6b4a36' }) + T(-8, 18, val, 20) + (ok > 0 ? g(-84, -26, pop(ok), `<circle r="15" fill="#2fb67a" stroke="${INK}" stroke-width="2.2"/><path d="M-7,0 l5,6 l10,-12" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`) : ''));
    });
    // the scan beam
    if (lt > c[4] + .4 && lt < c[4] + 2.2) { const bx = lerp(300, 980, k(lt, c[4] + .4, 1.6)); s += `<rect x="${n(bx - 6)}" y="240" width="12" height="190" rx="6" fill="#2fb67a" opacity=".35"/>`; }
    if (lt > c[3]) s += uchu(1090, FLOOR - 4, 1.05, { mood: lt < c[4] ? 'squint' : 'smile' }) + fade(k(lt, c[3], .3) - k(lt, c[4] + 1, .3), bubble(1040, 380, '그냥 이름표야?', { z: 20, tail: [1080, 450] }));
    s += noa(190, FLOOR - 4, 1.2, { pose: lt > c[4] ? 'point' : lt > c[2] ? 'point' : 'idle', mood: lt > c[4] ? 'grin' : 'smile' });
    if (lt > c[4]) s += fade(k(lt, c[4] + .2, .3), bubble(250, 360, '기계가 *검사*하는 이름표', { z: 19, tail: [220, 420] }));
    return s;
  };

  S.crew = (lt, c) => {
    let s = '';
    const bp = k(lt, .1, .5);
    const kb = kanban(340, 150, 760, 268, KCOLS, { glow: lt > c[2] + 2.2 && lt < c[3] ? 2 : undefined });
    if (bp > 0) s += g(720, 284, pop(bp), `<g transform="translate(-720,-284)">${kb.svg}</g>`);
    const colC = (i) => kb.colX(i) + 10, cw = kb.colW - 20;
    // the post flies in and splits
    const fp = k(lt, c[0] + 1.3, .6);
    if (fp > 0 && fp < 1) s += card(lerp(1180, colC(0), ease(fp)), lerp(140, kb.top, ease(fp)) - Math.sin(fp * Math.PI) * 80, cw, 34, 'viral post', { stripe: C.red });
    const cards = [
      { t: 'clone repo', born: c[1] + .4, row: 0, to1: c[2] + .2, to3: c[3] + .6, badge: '12' },
      { t: 'install SDK', born: c[1] + .8, row: 1, to1: c[2] + .35, to3: c[3] + 1.0, badge: '18' },
      { t: 'run shell', born: c[1] + 1.2, row: 2, to1: c[2] + .5, to2: c[2] + 2.3, badge: '72', risk: true },
      { t: '.env keys', born: c[1] + 2.6, row: 3, gap: true, to1: c[2] + .65, to3: c[3] + 1.4, badge: '9' },
    ];
    cards.forEach((cd) => {
      const b = k(lt, cd.born, .3);
      if (b <= 0) return;
      let col = 0, p = 1, from = 0;
      const moves = [[cd.to1, 1], [cd.to2, 2], [cd.to3, 3]].filter((m) => m[0] != null);
      moves.forEach(([tm, to]) => { if (lt >= tm) { from = col; col = to; p = k(lt, tm, .5); } });
      const x = lerp(colC(from), colC(col), ease(p)), y = kb.top + cd.row * 46 - Math.sin(p * Math.PI) * (p < 1 ? 40 : 0);
      const scored = cd.badge && lt > c[2] + (cd.risk ? 2.4 : 1.2);
      s += g(x + cw / 2, y + 17, pop(b), card(-cw / 2, -17, cw, 34, cd.t, { kind: cd.gap ? 'gap' : cd.risk && col >= 2 ? 'risk' : 'orig', badge: scored ? cd.badge : null, badgeFill: cd.risk ? C.red : '#2fb67a', z: 14 }));
    });
    // the crew
    const X = { decompose: 380, gapfill: 515, verify: 650, runner: 785, deploy: 920 };
    const hops = { decompose: [c[1] + .4, c[1] + .8, c[1] + 1.2], gapfill: [c[1] + 2.6], verify: [c[2] + 1.2, c[2] + 2.4], runner: [c[3] + .6], deploy: [c[3] + 1.4] };
    Object.entries(X).forEach(([role, x], i) => {
      const p = k(lt, .3 + i * .12, .4);
      if (p <= 0) return;
      const h = Math.max(...hops[role].map((t0) => hop(lt, t0)));
      s += g(x, FLOOR - 20, pop(p), member(role, 0, 0, .9, lt, { hop: h, eyes: role === 'verify' && lt > c[2] ? 'focus' : 'dot' }));
    });
    if (lt > c[2] + .8) s += popAt(lt, c[2] + .8, 650, 446, chip(-58, 0, 'Claude ✓', '#d97757', { z: 14 }) + chip(58, 0, 'Codex ✓', '#2b2b33', { z: 14 }));
    // the orchestrator
    const op = k(lt, c[3], .45);
    if (op > 0) {
      s += g(1085, FLOOR - 26, pop(op), member('orchestrator', 0, 0, 1.0, lt, { eyes: 'happy', hop: Math.abs(Math.sin(lt * 4)) * 6 }));
      Object.values(X).forEach((x, i) => { const lp = k(lt, c[3] + .3 + i * .15, .3); if (lp > 0) s += `<path d="M1060,${FLOOR - 120} Q${(1060 + x) / 2},${FLOOR - 200} ${x},${FLOOR - 110}" fill="none" stroke="#f25a7a" stroke-width="3" stroke-dasharray="7 6" opacity="${n(lp * .9)}"/>`; });
      s += sparkle(1110, FLOOR - 150 + bob(lt, 1, 4), 1.2, C.yellow);
    }
    s += noa(150, FLOOR - 4, 1.05, { pose: lt > c[0] + 1 ? 'point' : 'wave', mood: 'grin' });
    return s;
  };

  S.gate = (lt, c) => {
    let s = '';
    const part1 = 1 - k(lt, c[3] - .1, .4);
    // meter + pump + the risky card
    const v = 72 * Math.min(1, [c[0] + 1.2, c[0] + 1.9, c[0] + 2.6].reduce((a, t0) => a + ease(k(lt, t0, .45)) / 3, 0));
    if (part1 > 0) {
      const alarm = v >= 70 && Math.floor(lt * 4) % 2 === 0;
      let p = '';
      if (alarm) p += `<rect x="130" y="80" width="1020" height="510" fill="${C.red}" opacity=".06"/>`;
      p += meter(250, 210, v, {});
      const pushed = [c[0] + 1.2, c[0] + 1.9, c[0] + 2.6].some((t0) => lt > t0 && lt < t0 + .25);
      p += `<rect x="330" y="${FLOOR - 16}" width="110" height="14" rx="3" fill="#4a5078" stroke="${INK}" stroke-width="2"/><rect x="366" y="${FLOOR - 130}" width="38" height="116" rx="10" fill="#39b3b0" stroke="${INK}" stroke-width="2.6"/><line x1="385" y1="${FLOOR - 130}" x2="385" y2="${FLOOR - (pushed ? 150 : 186)}" stroke="#9aa0ad" stroke-width="6"/><rect x="350" y="${FLOOR - (pushed ? 160 : 196)}" width="70" height="12" rx="6" fill="#4a5078" stroke="${INK}" stroke-width="2"/><path d="M366,${FLOOR - 30} Q300,${FLOOR - 10} 282,${FLOOR - 94}" fill="none" stroke="#2c2e47" stroke-width="6"/>`;
      p += popAt(lt, .4, 640, 260, card(-150, -34, 300, 68, 'Run shell · rm -rf', { kind: 'risk', z: 22, badge: v >= 70 ? 'RISK 72' : null }) + stampMark(0, 82, '사람 승인 · HUMAN', k(lt, c[2] + 1.1, .5), -6));
      p += gate(560, FLOOR - 4, 0, 210);
      s += `<g opacity="${n(part1)}">${p}</g>`;
      s += `<g opacity="${n(part1)}">${uchu(1090, FLOOR - 4 - (lt > c[1] && lt < c[2] ? Math.abs(Math.sin(lt * 7)) * 16 : 0), 1.1, { mood: lt > c[1] ? 'grin' : 'smile', arms: lt > c[1] ? 'up' : 'down' })}${fade(k(lt, c[1], .25) - k(lt, c[2] + .5, .3), bubble(1060, 380, '그냥 돌려!', { z: 22, tail: [1090, 450] }))}</g>`;
      s += `<g opacity="${n(part1)}">${noa(880, FLOOR - 4, 1.15, { pose: lt > c[2] + .6 ? 'stamp' : 'idle', mood: 'flat', flip: true, extra: lt > c[2] + .6 ? K.prop('stamp', 58, -122) : '' })}</g>`;
    }
    // sandbox + measure
    const part2 = k(lt, c[3], .4);
    if (part2 > 0) {
      let p = `<polygon points="190,${FLOOR} 610,${FLOOR} 570,${FLOOR - 70} 230,${FLOOR - 70}" fill="#c98a52" stroke="${INK}" stroke-width="2.6"/><polygon points="206,${FLOOR - 6} 594,${FLOOR - 6} 560,${FLOOR - 62} 240,${FLOOR - 62}" fill="#ffe09a"/>` + T(400, FLOOR - 84, 'SANDBOX · git worktree', 17, { f: '#6b4a36' });
      [300, 400, 500].forEach((x, i) => { p += card(x - 40, FLOOR - 56 - Math.abs(Math.sin(lt * 4 + i)) * 8, 80, 26, ['clone', 'install', 'run'][i], { kind: 'ok', z: 12 }); });
      const sec = Math.round(720 * ease(k(lt, c[3] + .8, 1.4))), cents = 40 * ease(k(lt, c[3] + 2.4, .5));
      p += `<circle cx="300" cy="230" r="54" fill="#fff" stroke="${INK}" stroke-width="3"/><line x1="300" y1="230" x2="${n(300 + 40 * Math.sin(sec / 60 * Math.PI / 6))}" y2="${n(230 - 40 * Math.cos(sec / 60 * Math.PI / 6))}" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/><rect x="290" y="166" width="20" height="12" fill="#9aa0ad" stroke="${INK}" stroke-width="2"/>` + T(300, 320, Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), 26);
      p += `<circle cx="480" cy="230" r="44" fill="${C.yellow}" stroke="${INK}" stroke-width="3"/>` + T(480, 244, '$' + (cents / 100).toFixed(2), 24) + T(480, 320, 'cost · 비용', 17, { f: '#6b4a36' });
      s += `<g opacity="${n(part2)}">${p}</g>`;
      // chalkboard
      const cb = k(lt, c[4], .4);
      if (cb > 0) {
        const strike = k(lt, c[4] + 1.9, .4);
        s += g(900, 330, pop(cb), `<rect x="-230" y="-150" width="460" height="300" rx="10" fill="#8f5b3a" stroke="${INK}" stroke-width="3"/><rect x="-216" y="-136" width="432" height="272" rx="6" fill="#2f5a4a"/>` + T(-110, -100, '주장 CLAIMED', 17, { f: '#e9dcc0' }) + T(110, -100, '실측 MEASURED', 17, { f: C.yellow }) + `<line x1="0" y1="-120" x2="0" y2="110" stroke="#e9dcc0" stroke-width="2" opacity=".5"/>` +
          T(-110, -40, '공짜 · free', 26, { f: '#fff' }) + T(-110, 10, '5분 · 5 min', 26, { f: '#fff' }) + (strike > 0 ? `<line x1="-190" y1="-48" x2="${n(-190 + 160 * strike)}" y2="-44" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/><line x1="-190" y1="2" x2="${n(-190 + 160 * strike)}" y2="6" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/>` : '') +
          fade(k(lt, c[4] + 1.9, .4), T(110, -40, '$0.40', 32, { f: C.yellow }) + T(110, 10, '12분 · 12 min', 26, { f: C.yellow })) + chip(0, 100, '예시 수치 · example', '#e9dcc0', { z: 14, f: INK }));
      }
      const up = k(lt, c[5], .3);
      if (up > 0) s += g(1080, FLOOR - 4, 1 + .25 * Math.sin(k(lt, c[5], .5) * Math.PI), uchu(0, 0, 1.15, { mood: 'shock', arms: 'cheeks', sweat: true, bang: true }));
      s += `<g opacity="${n(part2)}">${noa(700, FLOOR - 4, 1.05, { glasses: lt > c[4] + 1.9 ? 'up' : true, mood: 'flat' })}</g>`;
    }
    return s;
  };

  S.yours = (lt, c) => {
    let s = '';
    // pack the verified steps
    const pk = k(lt, c[0] + .2, .4), close = k(lt, c[0] + 1.5, .3), shelf = k(lt, c[1] - .2, .5);
    const boxX = lerp(420, 1030, ease(shelf)), boxY = lerp(360, 262, ease(shelf)), boxS = lerp(1, .7, ease(shelf));
    if (pk > 0) {
      let b = `<rect x="-90" y="-60" width="180" height="120" rx="8" fill="#e2b577" stroke="${INK}" stroke-width="3"/><rect x="-12" y="-60" width="24" height="120" fill="${C.red}"/><rect x="-60" y="10" width="120" height="30" rx="4" fill="#fff" stroke="${INK}" stroke-width="2"/>` + T(0, 32, 'SKILL.md', 20);
      if (close > 0) b += `<path d="M-90,-60 L0,${n(-60 - 40 * (1 - close))} L90,-60" fill="#d9a563" stroke="${INK}" stroke-width="2.6"/>`;
      s += g(boxX, boxY, pop(pk) * boxS, b);
      ['clone repo', 'install SDK', 'export'].forEach((t, i) => { const p = k(lt, c[0] + .6 + i * .2, .5); if (p > 0 && p < 1) s += card(lerp(160, 360, ease(p)), lerp(160 + i * 40, 320, ease(p)) - Math.sin(p * Math.PI) * 60, 130, 30, t, { kind: 'ok', z: 13 }); });
    }
    if (shelf > 0) s += fade(shelf, `<rect x="910" y="304" width="240" height="14" fill="#8f5b3a" stroke="${INK}" stroke-width="2.4"/>` + T(1030, 346, 'LIBRARY · 라이브러리', 16, { f: '#6b4a36' }));
    // the content ontology flow
    const flow = [['Source', '출처', '#5b8def'], ['Claim', '주장', '#f7a1b4'], ['Evidence', '근거', '#2fb67a'], ['Script', '대본', '#f0a92a'], ['Asset', '결과물', '#a86af2']];
    flow.forEach(([en, ko, col], i) => {
      const t0 = c[1] + .4 + i * .5, x = 230 + i * 150;
      s += popAt(lt, t0, x, 440, chip(0, 0, en, col, { z: 20 }) + T(0, 38, ko, 18, { f: '#6b4a36' }));
      if (i && lt > t0) s += fade(k(lt, t0, .3), arrow(x - 104, 436, x - 60, 436, { dash: false, w: 3 }));
    });
    // the rule
    const rp = k(lt, c[2], .4);
    if (rp > 0) s += g(540, 262, pop(rp), panel(-330, -64, 660, 128, { fill: '#fffdf2' }) + T(0, -12, '근거 없으면 발행 금지', 36, { f: C.red }) + T(0, 30, 'No evidence, no publish', 20, { f: '#6b4a36' }) + stampMark(250, -40, 'RULE #1', k(lt, c[2] + 2.2, .5), 12));
    s += noa(1060, FLOOR - 4, 1.2, { pose: lt > c[2] ? 'point' : lt > c[1] ? 'think' : 'wave', flip: true, mood: 'grin' });
    return s;
  };

  S.curtain = (lt, c) => {
    let s = '';
    s += popAt(lt, .1, 640, 176, panel(-330, -70, 660, 140, {}) + T(0, -28, 'HARNESS THEATER · CURTAIN CALL', 15, { f: '#d2443a', ls: 3 }) + T(0, 20, '공짜라며? 직접 재봤어요', 40) + T(0, 52, 'It said FREE. We measured.', 18, { f: '#6b4a36' }));
    const mq = k(lt, .6, .4);
    if (mq > 0) {
      let m = `<rect x="-260" y="-30" width="520" height="60" rx="12" fill="#fff8e8" stroke="${C.red}" stroke-width="10"/>`;
      for (let i = 0; i < 26; i++) { const x = -250 + i * 20; m += `<circle cx="${x}" cy="-30" r="3.4" fill="${(i + Math.floor(lt * 6)) % 2 ? C.yellow : '#fff'}"/><circle cx="${x}" cy="30" r="3.4" fill="${(i + Math.floor(lt * 6)) % 2 ? '#fff' : C.yellow}"/>`; }
      m += R(0, 10, '다음 주인공 ★ *당신의 콘텐츠*', 26, INK, C.red);
      s += g(640, 300, pop(mq), m);
    }
    const line = [[250, 'decompose'], [370, 'gapfill'], [480, 'verify'], [800, 'runner'], [910, 'deploy']];
    line.forEach(([x, role], i) => { const p = k(lt, .4 + i * .1, .4); if (p > 0) s += g(x, FLOOR - 26 - Math.abs(Math.sin(lt * 3 + i)) * 8, pop(p), member(role, 0, 0, .82, lt, { eyes: 'happy', hat: true, label: null })); });
    s += noa(640, FLOOR - 4 - Math.abs(Math.sin(lt * 2.2)) * 6, 1.45, { pose: lt > c[0] + 2 ? 'cheer' : 'wave', mood: 'grin' });
    s += uchu(1040, FLOOR - 4 - (lt > c[1] ? Math.abs(Math.sin(lt * 6)) * 20 : 0), 1.1, { mood: 'grin', arms: lt > c[1] ? 'up' : 'down' });
    s += popAt(lt, c[1] + .6, 640, 372, chip(0, 0, 'github.com/tmuchal/10XAI', '#26386b', { z: 18 }));
    s += confetti(lt, .2, 80, 5, [140, 40, 1140, 580]);
    return s;
  };

  /* ---------------- compose ---------------- */
  const scenes = TL.scenes;
  function frame(t) {
    t = Math.max(0, Math.min(TL.total - 1e-3, t));
    let i = scenes.findIndex((sc) => t >= sc.start && t < sc.start + sc.dur);
    if (i < 0) i = scenes.length - 1;
    const sc = scenes[i], lt = t - sc.start, c = sc.cues.map((q) => q.start);
    let s = K.backdrop(t, { spot: sc.id === 'hook' || sc.id === 'curtain' ? 640 : null });
    s += S[sc.id](lt, c, sc);
    if (sc.chapter) s += K.chapterTag(sc.chapter[0], sc.chapter[1], k(lt, .05, .5));
    if (sc.source) s += K.source(sc.source, k(lt, .3, .5));
    s += K.audience(t) + K.curtains(t);
    let cue = null;
    sc.cues.forEach((q) => { if (lt >= q.start - .05 && lt < q.start + q.dur + .35) cue = q; });
    if (cue) s += K.subtitle(cue.en, cue.ko, (lt - cue.start + .05));
    if (i > 0 && lt < .35) s += `<rect width="${W}" height="${H}" fill="#fffdf2" opacity="${n(1 - lt / .35)}"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`;
  }
  root.FILM = { frame, total: TL.total, scenes };
})(window);
