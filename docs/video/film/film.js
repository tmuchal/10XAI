/* Harness Theater: the film. Scenes are pure functions of local time; cue timings come from
 * timeline.js (generated from script.json by build_audio.py), so every beat lands on the voice.
 *   FILM.frame(t) → SVG markup for time t (seconds) · FILM.total → runtime
 *
 * Per frame: backdrop → camera group (scene) → chapter card / tag → source → audience →
 * curtains → drapes (close/open transitions) → subtitle.
 */
(function (root) {
  const K = root.Kit, TL = root.TL;
  const { W, H, FLOOR, INK, C, n, k, ease, pop, bob, T, R, noa, crew, uchu, panel, bubble, card, kanban, KCOLS, gate, stampMark, burst, confetti, chip, arrow, sparkle } = K;
  const lerp = (a, b, p) => a + (b - a) * p;
  const g = (x, y, s, inner, op) => `<g transform="translate(${n(x)},${n(y)}) scale(${n(s * 1000) / 1000})"${op != null ? ` opacity="${n(op)}"` : ''}>${inner}</g>`;
  const fade = (p, inner) => p <= 0 ? '' : `<g opacity="${n(Math.min(1, p))}">${inner}</g>`;
  const popAt = (lt, t0, x, y, inner, d) => { const p = k(lt, t0, d || .35); return p <= 0 ? '' : g(x, y, pop(p), inner); };
  const hop = (lt, t0, h) => { const p = k(lt, t0, .38); return p > 0 && p < 1 ? Math.sin(p * Math.PI) * (h || 24) : 0; };
  const check = (x, y, s) => g(x, y, s, `<circle r="15" fill="#2fb67a" stroke="${INK}" stroke-width="2.2"/><path d="M-7,0 l5,6 l10,-12" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  const NOA = .82;                                   // Noa is the guide, not the set
  const CREW = {
    decompose: ['#5b8def', 'scissors', '분해'], gapfill: ['#f0a92a', 'pencil', '빈칸'], claude: ['#d97757', 'mag', 'Claude'],
    codex: ['#3a3d4a', 'mag', 'Codex'], runner: ['#2fb67a', 'watch', '실행'], deploy: ['#a86af2', 'box', '배포'],
    verify: ['#e0352b', 'mag', '심판'], orchestrator: ['#f25a7a', 'baton', '지휘'],
  };
  const member = (role, x, y, s, o) => { const [c, p, l] = CREW[role]; return crew(x, y, s, Object.assign({ bandana: c, prop: p, label: l, eyes: 'dot', crown: role === 'orchestrator' }, o || {})); };

  /* ---------- extra props ---------- */
  function orb(x, y, r, t, label) {
    return `<defs><radialGradient id="orbg" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#bfe6ff"/><stop offset="1" stop-color="#5b8def"/></radialGradient></defs>` +
      `<circle cx="${x}" cy="${y}" r="${n(r * 1.5 + 6 * Math.sin(t * 3))}" fill="#bfe6ff" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#orbg)" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="${n(x - r * .32)}" cy="${n(y - r * .1)}" r="${n(r * .1)}" fill="${INK}"/><circle cx="${n(x + r * .32)}" cy="${n(y - r * .1)}" r="${n(r * .1)}" fill="${INK}"/><path d="M${n(x - r * .2)},${n(y + r * .25)} Q${x},${n(y + r * .38)} ${n(x + r * .2)},${n(y + r * .25)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` + (label ? T(x, y + r + 30, label, 20, { f: '#2f4f8f', ls: 3 }) : '');
  }
  function dome(x, y, w, p, label) {
    if (p <= 0) return '';
    const h = w * .62;
    return `<g opacity="${n(Math.min(1, p * 2))}"><ellipse cx="${x}" cy="${y}" rx="${w / 2 + 10}" ry="12" fill="#8fd3e8" opacity=".5"/><path d="M${x - w / 2},${y} A${w / 2},${h} 0 0 1 ${x + w / 2},${y}" fill="#dff6ff" fill-opacity=".45" stroke="#3aa0c8" stroke-width="3"/><path d="M${n(x - w * .3)},${n(y - h * .55)} Q${n(x - w * .18)},${n(y - h * .8)} ${x},${n(y - h * .88)}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>${label ? T(x, y + 30, label, 14, { f: '#2b6f8f' }) : ''}</g>`;
  }
  function node(en, ko, col, icon) {
    return `<rect x="-78" y="-30" width="156" height="60" rx="30" fill="#fffdf6" stroke="${INK}" stroke-width="2.6"/><circle cx="-48" cy="0" r="20" fill="${col}" stroke="${INK}" stroke-width="2.2"/>` + T(-48, 7, icon, 18, { f: '#fff' }) + T(16, -3, en, 19) + T(16, 18, ko, 14, { f: '#6b4a36' });
  }
  function medallion(icon, en, ko, col) {
    return `<circle r="56" fill="${col}" stroke="${INK}" stroke-width="3"/><circle r="46" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 5"/>` + icon + T(0, 86, en, 22) + T(0, 110, ko, 16, { f: '#6b4a36' });
  }
  const icoBuckle = () => `<path d="M-36,-30 L-22,-10 M36,30 L22,10" stroke="#6b3f22" stroke-width="8" stroke-linecap="round"/><rect x="-22" y="-16" width="44" height="32" rx="8" fill="${C.yellow}" stroke="${INK}" stroke-width="2.6"/><rect x="-10" y="-6" width="20" height="12" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  const icoBoard = () => `<rect x="-30" y="-22" width="60" height="44" rx="5" fill="#fff" stroke="${INK}" stroke-width="2.4"/>` + [0, 1, 2].map((i) => `<rect x="${-24 + i * 17}" y="-16" width="13" height="32" rx="2" fill="${['#dbe7ff', '#ffefcc', '#d3f2e3'][i]}" stroke="${INK}" stroke-width="1.4"/><rect x="${-22 + i * 17}" y="${-12 + i * 6}" width="9" height="6" rx="1" fill="#fff" stroke="${INK}" stroke-width="1"/>`).join('');
  const icoCrew = () => [-18, 0, 18].map((dx, i) => `<circle cx="${dx}" cy="${i === 1 ? -6 : 4}" r="14" fill="${C.fur}" stroke="${INK}" stroke-width="2.2"/><path d="M${dx - 12},${i === 1 ? -12 : -2} Q${dx},${i === 1 ? -20 : -10} ${dx + 12},${i === 1 ? -12 : -2}" fill="none" stroke="${['#5b8def', '#f25a7a', '#2fb67a'][i]}" stroke-width="5"/>`).join('');
  function postCard(o) {
    return `<rect x="-112" y="-78" width="224" height="156" rx="14" fill="${o.bg}" stroke="${INK}" stroke-width="2.6"/><circle cx="-84" cy="-50" r="13" fill="${o.av}" stroke="${INK}" stroke-width="2"/>` + T(-64, -44, o.handle, 15, { a: 'start' }) + T(0, -6, o.line, 18) + T(0, 42, o.big, 36, { f: o.bf || C.red, stroke: '#fff', sw: 5 });
  }
  function imgFrame(x, y, w, h, href, label, p) {
    if (p <= 0) return '';
    return g(x, y, pop(p), `<rect x="${-w / 2 + 5}" y="${-h / 2 + 6}" width="${w}" height="${h}" rx="12" fill="${INK}" opacity=".18"/><rect x="${-w / 2 - 6}" y="${-h / 2 - 6}" width="${w + 12}" height="${h + 12}" rx="14" fill="#2c2e47" stroke="${INK}" stroke-width="2.6"/><image href="${href}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>` + chip(0, h / 2 + 34, label, '#26386b', { z: 15 }));
  }

  /* ---------- scenes: each returns { s, cam: [zoom, cx, cy], react } ---------- */
  const S = {};

  S.cold = (lt, c) => {
    let s = '';
    const scatter = ease(k(lt, c[3], .7));
    const posts = [
      { x: 330, y: 250, r: -8, t: c[0] + .3, bg: '#ffe3ef', av: '#f7b3c8', handle: '@bestie.ai', line: 'hey besties!! it’s', big: 'FREE!!', stamp: '톤 ≠' },
      { x: 640, y: 190, r: 3, t: c[0] + .9, bg: '#eef1f6', av: '#9aa7c2', handle: '@ValuedBrand', line: 'Dear valued customer,', big: '$9.99', bf: '#2f4f8f', stamp: '사실 ≠' },
      { x: 950, y: 250, r: 7, t: c[0] + 1.5, bg: '#fff5cc', av: '#ffd84d', handle: '@yolo.gpt', line: 'yo lol ai go brrr', big: '$0.40', bf: '#d98a20', stamp: '실수 ≠' },
    ];
    posts.forEach((p, i) => {
      const a = k(lt, p.t, .4);
      if (a <= 0 || scatter >= 1) return;
      const x = p.x + (i - 1) * 700 * scatter, y = p.y - 260 * scatter + bob(lt + i, .4, 6);
      s += g(x, y, pop(a), `<g transform="rotate(${n(p.r + bob(lt + i, .3, 3) + scatter * 40 * (i - 1))})">${postCard(p)}</g>`) + stampMark(x, y + 30, p.stamp, k(lt, c[2] + [.2, 1.0, 1.9][i], .5), -14 + i * 8);
    });
    s += uchu(560, FLOOR - 4 - Math.abs(Math.sin(lt * 2.5)) * 6, .95, { mood: lt < c[1] ? 'squint' : lt < c[3] ? 'shock' : 'grin', arms: lt < c[1] ? 'cheeks' : lt > c[3] ? 'up' : 'down', sweat: lt > c[1] && lt < c[3] });
    const nx = lerp(1380, 1000, ease(k(lt, c[1] - .3, .8)));
    s += noa(nx, FLOOR - 4, NOA, { pose: lt > c[3] ? 'wave' : lt > c[2] ? 'point' : 'idle', mood: lt > c[3] ? 'grin' : 'flat', flip: true });
    const tp = k(lt, c[3] + .2, .7);
    if (tp > 0) {
      s += g(640, lerp(-140, 196, ease(tp)), 1, panel(-330, -96, 660, 190, {}) + T(0, -50, 'HARNESS THEATER', 17, { f: '#d2443a', ls: 6 }) + T(0, 8, '하네스 극장', 62) + T(0, 58, '콘텐츠 자동화, 흔들림 없이 · Automation that stays consistent', 17, { f: '#6b4a36' }));
      [[440, icoBuckle, 'Harness', '하네스', '#ffd08a'], [640, icoBoard, 'Board', '보드', '#bcd3ff'], [840, icoCrew, 'Crew', '크루', '#bfe8c8']].forEach(([x, ico, en, ko, col], i) => { s += popAt(lt, c[3] + 2.2 + i * .7, x, 400, medallion(ico(), en, ko, col), .45); });
    }
    s += confetti(lt, c[3] + 4.2, 70, 3, [140, 40, 1140, 560]);
    const z = lt < c[3] ? lerp(1, 1.06, ease(k(lt, 0, c[3]))) : 1;
    return { s, cam: [z, 640, 340], react: lt > c[3] + 4 ? 'cheer' : lt > c[2] && lt < c[3] ? 'gasp' : null };
  };

  S.harness = (lt, c) => {
    let s = '';
    const ring = k(lt, c[0] + 2.8, .6);
    s += popAt(lt, .2, 640, 300, orb(0, 0, 66, lt, 'MODEL'), .5);
    if (ring > 0) s += `<g opacity="${n(ring)}"><circle cx="640" cy="300" r="${n(120 + 6 * Math.sin(lt * 2))}" fill="none" stroke="#f0a92a" stroke-width="7" stroke-dasharray="${n(760 * ring)} 999"/><circle cx="640" cy="300" r="140" fill="none" stroke="#f0a92a" stroke-width="2" stroke-dasharray="4 8" transform="rotate(${n(lt * 20)} 640 300)"/>${T(640, 150, 'HARNESS', 20, { f: '#d98a20', ls: 4 })}</g>`;
    const gp = k(lt, c[1], .45);
    if (gp > 0) {
      let p = panel(-130, -120, 260, 250, { head: 'GUIDES · 가이드 · before', headFill: '#ffe9c4' });
      [['brand.md', '브랜드 규칙'], ['mission', '미션'], ['tools', '허용 도구']].forEach(([en, ko], i) => { const q = k(lt, c[1] + 1.2 + i, .35); if (q > 0) p += g(0, -44 + i * 58, pop(q), `<rect x="-110" y="-22" width="220" height="44" rx="10" fill="#fff" stroke="${INK}" stroke-width="2"/><rect x="-110" y="-22" width="10" height="44" rx="4" fill="#f0a92a"/>` + T(-88, 6, en, 18, { a: 'start' }) + T(96, 6, ko, 15, { a: 'end', f: '#6b4a36' })); });
      s += g(300, 300, pop(gp), p) + fade(k(lt, c[1] + 1, .4), arrow(438, 300, 556, 300, { c: '#d98a20', w: 4 }));
    }
    const sp = k(lt, c[2], .45);
    if (sp > 0) {
      let p = panel(-140, -86, 280, 172, { head: 'SENSORS · 센서 · after', headFill: '#d3f2e3' });
      [['length ≤ 16', '길이'], ['banned words', '금지어'], ['dead links', '링크']].forEach(([en, ko], i) => { const q = k(lt, c[2] + 2 + i * .6, .3); p += T(-118, -24 + i * 34 + 22, en + ' · ' + ko, 17, { a: 'start' }) + (q > 0 ? check(112, -8 + i * 34 + 8, pop(q) * .9) : ''); });
      s += g(1000, 214, pop(sp), p) + fade(k(lt, c[2] + 1, .4), arrow(730, 262, 852, 226, { c: '#2fb67a', w: 4 }));
    }
    const jp = k(lt, c[3], .45);
    if (jp > 0) {
      s += g(1000, 400, pop(jp), panel(-140, -64, 280, 128, { fill: '#fff5f3' }) + member('verify', -84, 56, .66, { eyes: 'focus', label: null }) + bubble(30, -24, 'true?', { z: 17, tail: [-20, 0] }) + bubble(52, 24, 'on-brand?', { z: 17, tail: [-10, 30] }) + (lt > c[3] + 2.6 ? check(118, -46, pop(k(lt, c[3] + 2.6, .3))) : ''));
      s += fade(k(lt, c[3] + .6, .4), arrow(728, 330, 856, 390, { c: '#e0352b', w: 4 }));
    }
    const gt = k(lt, c[4], .45);
    if (gt > 0) s += `<g opacity="${n(gt)}">${gate(600, FLOOR - 4, 0, 190)}</g>` + fade(gt, card(730, 470, 190, 40, 'rm -rf content/', { kind: 'risk', z: 15, badge: 'RISK 78' })) + stampMark(830, 532, 'HUMAN ✓', k(lt, c[4] + 1.4, .5), -8);
    const sb = k(lt, c[5], .3);
    if (sb > 0) s += `<g opacity="${n(sb)}"><path d="M570,230 L710,370" stroke="#6b3f22" stroke-width="16" stroke-linecap="round"/><path d="M710,230 L570,370" stroke="#6b3f22" stroke-width="16" stroke-linecap="round"/><rect x="622" y="282" width="36" height="28" rx="6" fill="${C.yellow}" stroke="${INK}" stroke-width="2.6"/></g>` + (lt < c[6] + .2 ? burst(746, 206, 36, 'CLICK!', { z: 14 }) : '');
    if (lt > c[5] - .2) s += uchu(430, FLOOR - 4, .8, { mood: lt < c[6] ? 'squint' : 'grin', arms: lt > c[6] ? 'up' : 'down' });
    const mp = k(lt, c[6] + .4, .5);
    if (mp > 0) { const v = Math.round(1e6 * ease(k(lt, c[6] + .6, 2.4))); s += g(640, 116, pop(mp), `<rect x="-250" y="-40" width="500" height="80" rx="16" fill="#26386b" stroke="${INK}" stroke-width="2.6"/>` + T(-80, 12, v.toLocaleString('en-US'), 32, { f: C.yellow }) + T(130, -2, 'lines of code', 15, { f: '#fff' }) + T(130, 20, '0 written by hand', 15, { f: '#ff9d8f' })); }
    if (lt > c[6] + 3) s += fade(k(lt, c[6] + 3, .4), T(640, 186, 'Humans steer. Agents execute.', 24, { f: '#26386b' }));
    s += noa(222, FLOOR - 4, NOA, { pose: lt > c[6] ? 'wave' : lt > c[0] ? 'point' : 'idle', mood: lt > c[6] ? 'grin' : 'smile' });
    let cam = [1.04, 640, 320];
    if (lt > c[1] - .3 && lt < c[2] - .3) cam = [1.12, 470, 320];
    else if (lt >= c[2] - .3 && lt < c[4] - .2) cam = [1.12, 840, 310];
    else if (lt >= c[4] - .2 && lt < c[6]) cam = [1.08, 680, 380];
    else if (lt >= c[6]) cam = [1.0, 640, 360];
    return { s, cam, react: lt > c[5] && lt < c[5] + 2 ? 'laugh' : null };
  };

  S.ontology = (lt, c) => {
    let s = '';
    const N = [[260, 250, 'Source', '출처', '#5b8def', 'S'], [470, 190, 'Claim', '주장', '#f7a1b4', 'C'], [690, 270, 'Evidence', '근거', '#2fb67a', 'E'], [900, 190, 'Script', '대본', '#f0a92a', 'S'], [1090, 260, 'Asset', '결과물', '#a86af2', 'A']];
    const L = [[0, 1, 'cites'], [1, 2, 'supportedBy'], [1, 3, 'usedIn'], [3, 4, 'renders']];
    const nt = (i) => c[1] + 2.4 + i * .6;
    L.forEach(([a, b, lab]) => {
      const p = k(lt, nt(b) - .1, .5);
      if (p <= 0) return;
      const [x1, y1] = N[a], [x2, y2] = N[b], mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 40;
      s += `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="#8a6a52" stroke-width="3" stroke-dasharray="${n(420 * p)} 999"/>` + fade(p, T(mx, my + 12, lab, 14, { f: '#8a6a52' }));
    });
    N.forEach(([x, y, en, ko, col, ic], i) => { s += popAt(lt, nt(i), x, y + bob(lt + i, .3, 3), node(en, ko, col, ic)); });
    if (lt < nt(0)) s += fade(k(lt, c[0] + 1.4, .4) - k(lt, nt(0) - .3, .3), T(640, 250, 'ONTOLOGY', 64, { f: '#26386b', ls: 8 }) + T(640, 292, 'objects · links · actions', 20, { f: '#6b4a36' }));
    const rp = k(lt, c[2], .4);
    if (rp > 0) {
      s += g(1040, 480, pop(rp), `<rect x="-60" y="-80" width="120" height="120" rx="10" fill="#8f5b3a" stroke="${INK}" stroke-width="2.6"/><rect x="-48" y="-68" width="96" height="108" rx="6" fill="#c07d4c"/>` + T(0, -92, 'PUBLISH', 18) + `<path d="M-10,-26 v-10 a10,10 0 0 1 20,0 v10" fill="none" stroke="#9aa0ad" stroke-width="6"/><rect x="-16" y="-26" width="32" height="26" rx="4" fill="${C.yellow}" stroke="${INK}" stroke-width="2.2"/>`);
      const tr = k(lt, c[2] + 1.0, 1.8), bk = k(lt, c[2] + 2.8, .5);
      const cx = lerp(470, 930, ease(tr)) - 110 * ease(bk), cy = lerp(250, 470, ease(tr)) - Math.sin(bk * Math.PI) * 40;
      s += g(cx, cy, 1, card(-90, -20, 180, 40, 'claim: "free"', { kind: 'risk', z: 16, badge: bk > 0 ? 'NO EVIDENCE' : null }));
      if (bk > 0 && bk < 1) s += burst(990, 420, 40, 'BONK', { z: 15, fill: '#ffd0c8' });
      s += `<path d="M${N[1][0] + 40},${N[1][1] + 26} L${N[2][0] - 40},${N[2][1] - 20}" stroke="${C.red}" stroke-width="3" stroke-dasharray="4 6" opacity="${n(rp * .8)}"/>`;
    }
    if (lt > c[4]) { const b = lerp(160, 1140, k(lt, c[4] + .2, 1.2)); s += `<rect x="${n(b - 8)}" y="150" width="16" height="360" rx="8" fill="#2fb67a" opacity="${n(.35 * (1 - k(lt, c[4] + 1.4, .3)))}"/>` + stampMark(880, 420, 'CAUGHT', k(lt, c[4] + 1.4, .5), 10); }
    if (lt > c[3] - .1) s += uchu(1160, FLOOR - 4, .8, { mood: lt < c[4] ? 'shock' : 'squint', arms: 'cheeks' });
    s += noa(222, FLOOR - 4, NOA, { pose: lt > c[2] ? 'point' : 'idle', mood: lt > c[4] ? 'grin' : 'smile' });
    let cam = [1.02, 640, 330];
    if (lt > c[1] + 2 && lt < c[2]) cam = [1.08, 680, 290];
    else if (lt >= c[2] && lt < c[4] + 1.6) cam = [1.12, 860, 390];
    return { s, cam, react: lt > c[2] + 2.8 && lt < c[2] + 4 ? 'gasp' : null };
  };

  S.board = (lt, c) => {
    let s = '';
    const glow = lt > c[2] + .2 && lt < c[3] ? Math.min(3, Math.floor((lt - c[2] - .2) / .85)) : undefined;
    const kb = kanban(250, 150, 780, 320, KCOLS, { head: '10XAI · BOARD', glow });
    const bp = k(lt, c[0] + .8, .5);
    if (bp > 0) s += g(640, 310, pop(bp), `<g transform="translate(-640,-310)">${kb.svg}</g>`);
    if (bp >= 1) s += `<circle cx="990" cy="168" r="${n(6 + 2 * Math.sin(lt * 6))}" fill="#e0352b"/>` + T(1004, 174, 'LIVE', 15, { a: 'start', f: '#e0352b' });
    const cw = kb.colW - 20, cx = (i) => kb.colX(i) + 10;
    [['claim · "5 min"', '#f7a1b4'], ['script · reel', '#f0a92a'], ['asset · card', '#a86af2']].forEach(([t, col], i) => {
      const p = k(lt, c[1] + .6 * (i + 1), .3);
      if (p <= 0) return;
      let at = 0, mv = 1, from = 0;
      if (i === 0) [[c[2] + .2, 1], [c[2] + 1.1, 2], [c[2] + 1.9, 3]].forEach(([tm, to]) => { if (lt >= tm) { from = at; at = to; mv = k(lt, tm, .6); } });
      const x = lerp(cx(from), cx(at), ease(mv)), y = kb.top + 10 + i * 50 - (mv < 1 ? Math.sin(mv * Math.PI) * 50 : 0);
      if (i === 0 && mv > 0 && mv < 1) s += `<path d="M${n(x - 10)},${n(y + 20)} l-70,0" stroke="#f7a1b4" stroke-width="6" stroke-linecap="round" opacity=".5"/>`;
      s += g(x + cw / 2, y + 18, pop(p), card(-cw / 2, -18, cw, 36, t, { stripe: col, z: 14, kind: i === 0 && at === 3 ? 'ok' : 'orig', badge: i === 0 && at === 3 && mv >= 1 ? '✓' : null }));
    });
    const wp = k(lt, c[3], .5);
    if (wp > 0) {
      for (let r = 0; r < 3; r++) { const q = ((lt - c[3]) * .7 + r / 3) % 1; s += `<rect x="${n(250 - 30 * q)}" y="${n(150 - 30 * q)}" width="${n(780 + 60 * q)}" height="${n(320 + 60 * q)}" rx="${n(12 + 20 * q)}" fill="none" stroke="#5b8def" stroke-width="3" opacity="${n(.5 * (1 - q) * wp)}"/>`; }
      [360, 470, 810, 920].forEach((x, i) => { s += g(x, FLOOR - 16 + (1 - pop(k(lt, c[3] + i * .15, .4))) * 60, 1, member(['decompose', 'claude', 'runner', 'deploy'][i], 0, 0, .66, { eyes: 'focus', label: null })); });
      s += popAt(lt, c[3] + 2.8, 640, 116, chip(0, 0, 'One source of truth · 진실은 하나', '#26386b', { z: 20 }));
    }
    s += uchu(640, FLOOR - 4, .7, { mood: lt > c[2] + 2.8 ? 'grin' : 'smile', arms: lt > c[2] + 2.8 && lt < c[3] + 1 ? 'up' : 'down' });
    s += noa(222, FLOOR - 4, NOA, { pose: lt > c[1] ? 'point' : 'idle', mood: 'smile' });
    const cam = lt < c[2] ? [1.06, 640, 320] : lt < c[3] ? [1.1, 700, 320] : [1.0, 640, 340];
    return { s, cam, react: lt > c[2] + 2.8 && lt < c[2] + 4 ? 'cheer' : null };
  };

  S.crew = (lt, c) => {
    let s = '';
    const O = [640, 300];
    const team = [['decompose', 270], ['gapfill', 400], ['claude', 540], ['codex', 670], ['runner', 810], ['deploy', 940]];
    const op = k(lt, c[0] + .3, .5);
    if (op > 0) {
      s += `<polygon points="${O[0] - 60},${O[1] + 70} ${O[0] + 60},${O[1] + 70} ${O[0] - 90},${FLOOR} ${O[0] + 90},${FLOOR}" fill="#fff4dc" opacity=".35"/>`;
      s += g(O[0], O[1] + 70, pop(op), `<rect x="-70" y="0" width="140" height="26" rx="6" fill="#8f5b3a" stroke="${INK}" stroke-width="2.6"/>` + member('orchestrator', 0, 0, .95, { eyes: 'happy', label: null }));
    }
    team.forEach(([role, x], i) => {
      const p = k(lt, c[0] + .6 + i * .1, .4);
      if (p <= 0) return;
      if (lt > c[0] + 1) { const f = ((lt - c[0] - 1) * .6 + i * .17) % 1, px = lerp(O[0], x, f), py = lerp(O[1] + 40, FLOOR - 130, f) - Math.sin(f * Math.PI) * 60; s += `<path d="M${O[0]},${O[1] + 40} Q${(O[0] + x) / 2},${O[1] - 30} ${x},${FLOOR - 130}" fill="none" stroke="${CREW[role][0]}" stroke-width="2.4" stroke-dasharray="5 7" opacity=".6"/><rect x="${n(px - 9)}" y="${n(py - 6)}" width="18" height="12" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`; }
      let h = 0;
      if (role === 'decompose') h = hop(lt, c[1] + .6);
      if (role === 'gapfill') h = hop(lt, c[1] + 2.4);
      if (role === 'claude' || role === 'codex') h = hop(lt, c[2] + 2.0);
      if (role === 'runner' || role === 'deploy') h = hop(lt, c[3] + 1.4);
      s += g(x, FLOOR - 16 - h, pop(p), member(role, 0, 0, .8, { eyes: (role === 'claude' || role === 'codex') && lt > c[2] ? 'focus' : 'dot' }));
    });
    if (lt > c[1] + .6) s += popAt(lt, c[1] + .6, 270, 410, card(-50, -12, 100, 24, 'step 1', { z: 11 }) + card(-50, 16, 100, 24, 'step 2', { z: 11 }));
    if (lt > c[1] + 2.4) s += popAt(lt, c[1] + 2.4, 400, 420, card(-56, -12, 112, 24, '+ .env keys', { kind: 'gap', z: 11 }));
    if (lt > c[2] + 1.8) {
      s += popAt(lt, c[2] + 2.0, 540, 400, chip(0, 0, '✓ 12', '#2fb67a', { z: 16 }));
      s += popAt(lt, c[2] + 2.0, 670, 400, chip(0, 0, '✗ 71', '#e0352b', { z: 16 }));
      if (lt > c[2] + 3.6) s += popAt(lt, c[2] + 3.6, 605, 352, chip(0, 0, 'DISAGREE → REVIEW', '#26386b', { z: 15 }));
    }
    [[810, 0], [940, .4], [540, .8]].forEach(([x, d]) => { s += dome(x, FLOOR - 12, 120, k(lt, c[3] + 1.4 + d, .4), 'git worktree'); });
    if (lt > c[4] - .2) {
      const pw = lt > c[6];
      s += g(1110, FLOOR - 4 - (pw ? Math.abs(Math.sin(lt * 7)) * 14 : 0), 1, uchu(0, 0, .82, { mood: pw ? 'grin' : lt > c[5] ? 'shock' : 'smile', arms: pw ? 'up' : 'down' }) + (pw ? `<path d="M-16,-138 L-16,-154 L-8,-146 L0,-158 L8,-146 L16,-154 L16,-138 Z" fill="${C.yellow}" stroke="${INK}" stroke-width="2"/>` : ''));
      s += popAt(lt, c[5] + 1.4, 1110, 420, `<rect x="-58" y="-18" width="116" height="36" rx="18" fill="#2fb67a" stroke="${INK}" stroke-width="2.6"/>` + T(0, 7, 'APPROVE', 18, { f: '#fff' }));
      if (pw) for (let i = 0; i < 5; i++) s += sparkle(1110 + Math.cos(lt * 3 + i * 1.3) * 80, 380 + Math.sin(lt * 3 + i * 1.3) * 40, 1.1, C.yellow);
    }
    s += noa(215, FLOOR - 4, NOA * .95, { pose: lt > c[5] ? 'point' : 'idle', mood: lt > c[6] ? 'flat' : 'smile' });
    let cam = [1.0, 640, 360];
    if (lt > c[2] && lt < c[3]) cam = [1.14, 605, 420];
    else if (lt >= c[3] && lt < c[4]) cam = [1.1, 800, 420];
    else if (lt >= c[4]) cam = [1.12, 920, 400];
    return { s, cam, react: lt > c[6] ? 'laugh' : lt > c[2] + 3.6 && lt < c[3] ? 'gasp' : null };
  };

  S.auto = (lt, c) => {
    let s = '';
    const mp = k(lt, c[0] + .2, .5);
    if (mp > 0) {
      let m = `<rect x="-120" y="-100" width="240" height="200" rx="26" fill="#cfe3f7" stroke="${INK}" stroke-width="3"/><rect x="-96" y="-76" width="192" height="100" rx="10" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
      ['#dbe7ff', '#ffefcc', '#ffd9d3', '#d3f2e3'].forEach((col, i) => { m += `<rect x="${-88 + i * 45}" y="-68" width="40" height="84" rx="4" fill="${col}" stroke="${INK}" stroke-width="1.2"/><rect x="${-84 + i * 45}" y="${-60 + ((Math.floor(lt * 2) + i) % 3) * 22}" width="32" height="14" rx="2" fill="#fff" stroke="${INK}" stroke-width="1"/>`; });
      m += T(0, 60, 'ontology + harness', 16, { f: '#2f4f8f' });
      for (const [gx, sign] of [[-120, 1], [120, -1]]) m += `<g transform="translate(${gx},80) rotate(${n(sign * lt * 60)})">${[0, 60, 120].map((a) => `<rect x="-5" y="-30" width="10" height="60" fill="${C.yellow}" stroke="${INK}" stroke-width="1.6" transform="rotate(${a})"/>`).join('')}<circle r="22" fill="${C.yellow}" stroke="${INK}" stroke-width="2.4"/><circle r="8" fill="#fff" stroke="${INK}" stroke-width="2"/></g>`;
      s += g(560, 320, pop(mp), m);
    }
    const ip = k(lt, c[0] + 1.2, 1);
    if (ip < 1) { const bx = lerp(200, 520, ease(ip)), by = lerp(260, 300, ease(ip)) - Math.sin(ip * Math.PI) * 60; s += g(bx, by, 1 - .6 * ip, `<circle r="${n(40 + 5 * Math.sin(lt * 8))}" fill="#fff6c8" opacity=".6"/><path d="M-22,-10 A26,26 0 1 1 22,-10 Q14,4 12,18 L-12,18 Q-14,4 -22,-10 Z" fill="${C.yellow}" stroke="${INK}" stroke-width="2.6"/><rect x="-12" y="18" width="24" height="12" rx="3" fill="#9aa0ad" stroke="${INK}" stroke-width="2"/>` + T(0, 60, 'one idea', 17)); }
    const outs = [['../renders/web/reel_cover.jpg', 'Reel · 30s', 860, 250, 96, 170, c[1] + 1.4], ['../renders/web/hero_hamster.jpg', 'Long-form · 14min', 1040, 220, 200, 112, c[1] + 2.4], ['../cardnews/slide-01.png', 'Card news · 10', 960, 420, 100, 125, c[1] + 3.4]];
    outs.forEach(([href, label, x, y, w, h, t0]) => {
      const p = k(lt, t0, .45);
      if (p > 0) s += `<path d="M680,320 Q${(680 + x) / 2},${y - 80} ${x},${y}" fill="none" stroke="#f0a92a" stroke-width="3" stroke-dasharray="${n(500 * p)} 999" opacity=".8"/>`;
      s += imgFrame(x, y, w, h, href, label, p);
    });
    [['same facts', '같은 사실'], ['same voice', '같은 목소리'], ['same cast', '같은 캐릭터']].forEach(([en, ko], i) => { s += popAt(lt, c[2] + .4 + i * .7, 330 + i * 230, 530, chip(0, 0, '✓ ' + en + ' · ' + ko, '#2fb67a', { z: 16 })); });
    const sb = k(lt, c[3], .45);
    if (sb > 0) {
      let b = panel(-190, -120, 380, 240, { head: 'CRITIC AGENT · 비평 에이전트', headFill: '#ffe3ef' });
      b += `<line x1="-150" y1="0" x2="150" y2="0" stroke="${C.red}" stroke-width="2" stroke-dasharray="6 5"/>` + T(158, 5, '8.0', 13, { f: C.red, a: 'start' });
      [['R1', 5.4], ['R2', 7.5], ['R3', 8.1]].forEach(([r, v], i) => { const q = ease(k(lt, c[3] + 1.4 + i * .7, .5)), h = 12 * v * q; b += `<rect x="${-120 + i * 90}" y="${n(96 - h)}" width="60" height="${n(h)}" rx="6" fill="${['#f0a92a', '#5b8def', '#2fb67a'][i]}" stroke="${INK}" stroke-width="2"/>` + (q > .1 ? T(-90 + i * 90, n(88 - h), v.toFixed(1), 20) : '') + T(-90 + i * 90, 114, r, 14, { f: '#6b4a36' }); });
      s += g(640, 260, pop(sb), b) + stampMark(800, 170, 'B+', k(lt, c[3] + 3.4, .5), 12);
    }
    if (lt > c[4] - .1) s += uchu(1150, FLOOR - 4, .8, { mood: 'shock', arms: 'cheeks', bang: lt < c[5] });
    s += noa(222, FLOOR - 4, NOA, { pose: lt > c[1] ? 'point' : 'idle', mood: 'flat', glasses: lt > c[5] ? 'up' : true });
    let cam = [1.06, 460, 320];
    if (lt > c[1] && lt < c[2] - .2) cam = [1.04, 760, 330];
    else if (lt >= c[2] - .2 && lt < c[3]) cam = [1.0, 640, 370];
    else if (lt >= c[3]) cam = [1.08, 720, 300];
    return { s, cam, react: lt > c[3] + 3.4 && lt < c[4] ? 'cheer' : lt > c[4] ? 'laugh' : null };
  };

  S.curtain = (lt, c) => {
    let s = '';
    [[400, icoBuckle, 'Harness', '규칙', '#ffd08a'], [640, icoBoard, 'Board', '진실', '#bcd3ff'], [880, icoCrew, 'Crew', '속도', '#bfe8c8']].forEach(([x, ico, en, ko, col], i) => { s += popAt(lt, c[0] + [.3, 1.5, 2.8][i], x, 190, medallion(ico(), en, ko, col), .45); });
    const mq = k(lt, c[1] + .3, .4);
    if (mq > 0) {
      let m = `<rect x="-230" y="-26" width="460" height="52" rx="12" fill="#fff8e8" stroke="${C.red}" stroke-width="9"/>`;
      for (let i = 0; i < 23; i++) { const x = -220 + i * 20; m += `<circle cx="${x}" cy="-26" r="3.2" fill="${(i + Math.floor(lt * 6)) % 2 ? C.yellow : '#fff'}"/><circle cx="${x}" cy="26" r="3.2" fill="${(i + Math.floor(lt * 6)) % 2 ? '#fff' : C.yellow}"/>`; }
      s += g(640, 370, pop(mq), m + R(0, 9, '다음 공연 ★ *NEXT SHOW*', 24, INK, C.red));
    }
    [[260, 'decompose'], [370, 'gapfill'], [480, 'claude'], [800, 'runner'], [910, 'deploy'], [1020, 'codex']].forEach(([x, role], i) => { const p = k(lt, .2 + i * .1, .4); if (p > 0) s += g(x, FLOOR - 16 - Math.abs(Math.sin(lt * 3 + i)) * 8, pop(p), member(role, 0, 0, .74, { eyes: 'happy', hat: true, label: null })); });
    s += noa(640, FLOOR - 4 - Math.abs(Math.sin(lt * 2.2)) * 5, .95, { pose: lt > c[1] + 1 ? 'cheer' : 'wave', mood: 'grin', hat: true });
    s += uchu(1120, FLOOR - 4 - (lt > c[2] ? Math.abs(Math.sin(lt * 6)) * 22 : 0), .82, { mood: 'grin', arms: lt > c[2] ? 'up' : 'down' });
    s += popAt(lt, c[1] + 1.2, 640, 440, chip(0, 0, 'github.com/tmuchal/10XAI', '#26386b', { z: 17 }));
    s += confetti(lt, c[1], 90, 5, [140, 40, 1140, 580]);
    return { s, cam: [lerp(1.06, 1, ease(k(lt, 0, 3))), 640, 340], react: lt > c[1] ? 'cheer' : null };
  };

  /* ---------- chrome ---------- */
  function chapterCard(ch, lt, lead) {
    const inP = k(lt, .05, .45), outP = ease(k(lt, lead - .75, .55));
    if (outP >= 1) return K.chapterTag(ch[0], ch[1], 1);
    const sc = pop(inP) * lerp(1, .45, outP), x = lerp(640, 250, outP), y = lerp(330, 120, outP);
    const card_ = `<g opacity="${n(1 - outP)}"><polygon points="-110,-420 110,-420 300,160 -300,160" fill="#fffbe0" opacity=".45"/>` + panel(-300, -110, 600, 220, {}) + `<rect x="-280" y="-122" width="80" height="22" fill="#9fd3f5" opacity=".75" transform="rotate(-4)"/><rect x="200" y="-124" width="80" height="22" fill="#f7b5c8" opacity=".75" transform="rotate(5)"/>` +
      T(0, -54, 'CHAPTER ' + String(ch[0]).padStart(2, '0'), 20, { f: '#d2443a', ls: 6 }) + T(0, 20, ch[1], 54) + T(0, 70, ch[2], 22, { f: '#6b4a36' }) + `</g>`;
    return g(x, y, sc, card_) + (outP > .3 ? K.chapterTag(ch[0], ch[1], (outP - .3) / .7) : '');
  }
  function drapes(p) {
    if (p <= 0) return '';
    const w = (W / 2 + 30) * ease(p);
    const side = (x0, dir) => {
      let d = `<rect x="${n(x0)}" y="0" width="${n(w)}" height="${H}" fill="${C.curtain}" stroke="${INK}" stroke-width="3"/>`;
      for (let i = 1; i < 8; i++) { const x = x0 + (w * i) / 8; d += `<line x1="${n(x)}" y1="0" x2="${n(x + dir * 6)}" y2="${H}" stroke="${i % 2 ? C.curtain2 : '#e0484a'}" stroke-width="${i % 2 ? 4 : 6}" opacity=".7"/>`; }
      return d;
    };
    return side(0, 1) + side(W - w, -1);
  }
  const REACT = { gasp: { mood: 'o' }, cheer: { hop: 12 }, laugh: { hop: 7 } };
  function audience(t, react) {
    const spots = [[34, 612, .55, 0], [92, 640, .6, .3], [1188, 640, .6, .6], [1246, 612, .55, .9]];
    const r = REACT[react] || {};
    return spots.map(([x, y, s, ph]) => crew(x, y - Math.abs(Math.sin((t + ph) * (r.hop ? 9 : 3))) * (r.hop || 4), s, { eyes: r.mood ? 'dot' : 'happy', mood: r.mood, hat: true })).join('');
  }

  /* ---------- camera: ease toward each new target over 0.7 s ---------- */
  function camAt(sc, lt, c) {
    const target = (u) => S[sc.id](Math.max(0, u), c, sc).cam;
    const now = target(lt), prev = target(lt - .7);
    if (now.join() === prev.join()) return now;
    let lo = lt - .7, hi = lt;
    for (let j = 0; j < 8; j++) { const mid = (lo + hi) / 2; if (target(mid).join() === now.join()) hi = mid; else lo = mid; }
    const from = target(lo), p = ease(k(lt, hi, .7));
    return from.map((v, j) => lerp(v, now[j], p));
  }

  /* ---------- compose ---------- */
  const scenes = TL.scenes;
  function frame(t) {
    t = Math.max(0, Math.min(TL.total - 1e-3, t));
    let i = scenes.findIndex((sc) => t >= sc.start && t < sc.start + sc.dur);
    if (i < 0) i = scenes.length - 1;
    const sc = scenes[i], lt = t - sc.start, c = sc.cues.map((q) => q.start);
    const lead = sc.cues.length ? sc.cues[0].start : 0;
    const res = S[sc.id](lt, c, sc);
    const [z, cx, cy] = camAt(sc, lt, c);
    const content = sc.chapter ? fade(k(lt, lead - .6, .5), res.s) : res.s;
    let s = K.backdrop(t, { spot: sc.id === 'cold' || sc.id === 'curtain' ? 640 : null });
    s += `<g transform="translate(640,360) scale(${n(z * 1000) / 1000}) translate(${n(-cx)},${n(-cy)})">${content}</g>`;
    if (sc.chapter) s += chapterCard(sc.chapter, lt, lead);
    if (sc.source) s += K.source(sc.source, k(lt, lead, .5));
    s += audience(t, res.react) + K.curtains(t);
    s += drapes(Math.max(k(lt, sc.dur - .4, .4), i > 0 ? 1 - k(lt, 0, .45) : 0));
    let cue = null;
    sc.cues.forEach((q) => { if (lt >= q.start - .05 && lt < q.start + q.dur + .35) cue = q; });
    if (cue) s += K.subtitle(cue.en, cue.ko, lt - cue.start + .05);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`;
  }
  root.FILM = { frame, total: TL.total, scenes };
})(window);
