/* Harness Theater: the film. Scenes are pure functions of local time; cue timings come from
 * timeline.js (generated from script.json by build_audio.py), so every beat lands on the voice.
 *   FILM.frame(t) → SVG markup for time t (seconds) · FILM.total → runtime
 *
 * Per frame: backdrop → camera group (scene world) → Noa (screen space, never cropped) →
 * chapter flat / tag → source → audience → curtains → drapes → subtitle.
 * Rules: world content stays at y ≥ 150 and characters stand on K.STAND, above the subtitle bar;
 * the camera is clamped so nothing slides under the chapter tag or the source pill.
 */
(function (root) {
  const K = root.Kit, TL = root.TL;
  const { W, H, STAND, INK, C, n, k, ease, pop, bob, T, R, noa, crew, uchu, panel, bubble, card, kanban, KCOLS, gate, stampMark, burst, confetti, chip, arrow, sparkle } = K;
  const lerp = (a, b, p) => a + (b - a) * p;
  const g = (x, y, s, inner, op) => `<g transform="translate(${n(x)},${n(y)}) scale(${n(s * 1000) / 1000})"${op != null ? ` opacity="${n(op)}"` : ''}>${inner}</g>`;
  const fade = (p, inner) => p <= 0 ? '' : `<g opacity="${n(Math.min(1, p))}">${inner}</g>`;
  const popAt = (lt, t0, x, y, inner, d) => { const p = k(lt, t0, d || .35); return p <= 0 ? '' : g(x, y, pop(p), inner); };
  const hop = (lt, t0, h) => { const p = k(lt, t0, .38); return p > 0 && p < 1 ? Math.sin(p * Math.PI) * (h || 24) : 0; };
  const squash = (x, y, sy, inner) => sy === 1 ? inner : `<g transform="translate(${n(x)},${n(y)}) scale(1,${n(sy)}) translate(${n(-x)},${n(-y)})">${inner}</g>`;
  const check = (x, y, s) => g(x, y, s, `<circle r="15" fill="#2fb67a" stroke="${INK}" stroke-width="2.2"/><path d="M-7,0 l5,6 l10,-12" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  const NOA = .78;
  const CREW = {
    decompose: ['#5b8def', 'scissors', '분해'], gapfill: ['#f0a92a', 'pencil', '빈칸'], claude: ['#d97757', 'mag', 'Claude'],
    codex: ['#3a3d4a', 'mag', 'Codex'], runner: ['#2fb67a', 'watch', '실행'], runner2: ['#2fb67a', 'watch', '실행'], deploy: ['#a86af2', 'box', '배포'],
    verify: ['#e0352b', 'mag', '심판'], orchestrator: ['#f25a7a', 'baton', '지휘'],
  };
  const member = (role, x, y, s, o) => { const [c, p, l] = CREW[role]; return crew(x, y, s, Object.assign({ bandana: c, prop: p, label: l, eyes: 'dot', crown: role === 'orchestrator' }, o || {})); };

  /* ---------- props ---------- */
  function orb(x, y, r, t, label) {
    return `<defs><radialGradient id="orbg" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#bfe6ff"/><stop offset="1" stop-color="#5b8def"/></radialGradient></defs>` +
      `<circle cx="${x}" cy="${y}" r="${n(r * 1.5 + 6 * Math.sin(t * 3))}" fill="#bfe6ff" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#orbg)" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="${n(x - r * .32)}" cy="${n(y - r * .1)}" r="${n(r * .1)}" fill="${INK}"/><circle cx="${n(x + r * .32)}" cy="${n(y - r * .1)}" r="${n(r * .1)}" fill="${INK}"/><path d="M${n(x - r * .2)},${n(y + r * .25)} Q${x},${n(y + r * .38)} ${n(x + r * .2)},${n(y + r * .25)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` + (label ? T(x, y + r + 28, label, 18, { f: '#2f4f8f', ls: 3 }) : '');
  }
  function dome(x, y, w, p, label, flash) {
    if (p <= 0) return '';
    const h = w * .62;
    return `<g opacity="${n(Math.min(1, p * 2))}"><ellipse cx="${x}" cy="${y}" rx="${w / 2 + 10}" ry="12" fill="#8fd3e8" opacity=".5"/><path d="M${x - w / 2},${y} A${w / 2},${h} 0 0 1 ${x + w / 2},${y}" fill="${flash ? '#ffe0da' : '#dff6ff'}" fill-opacity=".5" stroke="${flash ? C.red : '#3aa0c8'}" stroke-width="3"/><path d="M${n(x - w * .3)},${n(y - h * .55)} Q${n(x - w * .18)},${n(y - h * .8)} ${x},${n(y - h * .88)}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>${label ? T(x, y - h - 12, label, 14, { f: '#2b6f8f' }) : ''}</g>`;
  }
  function node(en, ko, col, icon) {
    return `<rect x="-78" y="-30" width="156" height="60" rx="30" fill="#fffdf6" stroke="${INK}" stroke-width="2.6"/><circle cx="-48" cy="0" r="20" fill="${col}" stroke="${INK}" stroke-width="2.2"/>` + T(-48, 7, icon, 18, { f: '#fff' }) + T(16, -3, en, 19) + T(16, 18, ko, 14, { f: '#6b4a36' });
  }
  function medallion(icon, en, ko, col, gold) {
    return (gold ? `<circle r="64" fill="none" stroke="${C.gold}" stroke-width="6"/>` : '') + `<circle r="56" fill="${col}" stroke="${INK}" stroke-width="3"/><circle r="46" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 5"/>` + icon + T(0, 88, en, 22) + T(0, 112, ko, 16, { f: '#6b4a36' });
  }
  const icoBuckle = () => `<path d="M-36,-30 L-22,-10 M36,30 L22,10" stroke="#6b3f22" stroke-width="8" stroke-linecap="round"/><rect x="-22" y="-16" width="44" height="32" rx="8" fill="${C.yellow}" stroke="${INK}" stroke-width="2.6"/><rect x="-10" y="-6" width="20" height="12" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  const icoBoard = () => `<rect x="-30" y="-22" width="60" height="44" rx="5" fill="#fff" stroke="${INK}" stroke-width="2.4"/>` + [0, 1, 2].map((i) => `<rect x="${-24 + i * 17}" y="-16" width="13" height="32" rx="2" fill="${['#dbe7ff', '#ffefcc', '#d3f2e3'][i]}" stroke="${INK}" stroke-width="1.4"/><rect x="${-22 + i * 17}" y="${-12 + i * 6}" width="9" height="6" rx="1" fill="#fff" stroke="${INK}" stroke-width="1"/>`).join('');
  const icoCrew = () => [-18, 0, 18].map((dx, i) => `<circle cx="${dx}" cy="${i === 1 ? -6 : 4}" r="14" fill="${C.fur}" stroke="${INK}" stroke-width="2.2"/><path d="M${dx - 12},${i === 1 ? -12 : -2} Q${dx},${i === 1 ? -20 : -10} ${dx + 12},${i === 1 ? -12 : -2}" fill="none" stroke="${['#5b8def', '#f25a7a', '#2fb67a'][i]}" stroke-width="5"/>`).join('');
  function postCard(o, bigOp) {
    return `<rect x="-112" y="-78" width="224" height="156" rx="14" fill="${o.bg}" stroke="${INK}" stroke-width="2.6"/><circle cx="-84" cy="-50" r="13" fill="${o.av}" stroke="${INK}" stroke-width="2"/>` + T(-64, -44, o.handle, 15, { a: 'start' }) + T(0, -6, o.line, 18) + T(0, 42, o.big, 36, { f: o.bf || C.red, stroke: '#fff', sw: 5, op: bigOp != null ? n(bigOp) : null });
  }
  const POSTS = [
    { bg: '#ffe3ef', av: '#f7b3c8', handle: '@bestie.ai', line: 'hey besties!! it’s', big: 'FREE!!', stamp: '톤 ≠' },
    { bg: '#eef1f6', av: '#9aa7c2', handle: '@ValuedBrand', line: 'Dear valued customer,', big: '$9.99', bf: '#2f4f8f', stamp: '사실 ≠' },
    { bg: '#fff5cc', av: '#ffd84d', handle: '@yolo.gpt', line: 'yo lol ai go brrr', big: '$0.40', bf: '#d98a20', stamp: '실수 ≠' },
  ];
  /* mini renders of the three outputs, drawn with this kit so the cast really is the same */
  function sticker(x, y, text, flash) {
    return (flash > 0 && flash < 1 ? `<circle cx="${x}" cy="${y}" r="${n(18 + 30 * flash)}" fill="none" stroke="#2fb67a" stroke-width="4" opacity="${n(1 - flash)}"/>` : '') + `<rect x="${x - 34}" y="${y - 13}" width="68" height="26" rx="13" fill="${C.yellow}" stroke="${INK}" stroke-width="2"/>` + T(x, y + 6, text, 15);
  }
  function miniStage(w, h) {
    return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#fbe6c8"/><rect x="${-w / 2}" y="${n(h / 2 - h * .22)}" width="${w}" height="${n(h * .22)}" fill="#e8b27a"/><rect x="${-w / 2}" y="${-h / 2}" width="${n(w * .12)}" height="${h}" fill="${C.curtain}"/><rect x="${n(w / 2 - w * .12)}" y="${-h / 2}" width="${n(w * .12)}" height="${h}" fill="${C.curtain}"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${n(h * .08)}" fill="${C.curtain}"/>`;
  }
  function output(kind, x, y, s, cap, flash, p) {
    if (p <= 0) return '';
    let inner = '', w, h, label;
    if (kind === 'reel') { w = 104; h = 184; label = 'Reel · 30s'; inner = miniStage(w, h) + noa(0, h / 2 - 34, .36, { mood: 'flat' }) + T(0, -h / 2 + 34, 'IT SAID FREE', 13, { f: C.red, stroke: '#fff', sw: 3 }) + `<line x1="-44" y1="${-h / 2 + 29}" x2="44" y2="${-h / 2 + 29}" stroke="${C.red}" stroke-width="3"/><rect x="-36" y="${-h / 2 + 42}" width="72" height="20" rx="10" fill="#2fb67a" stroke="${INK}" stroke-width="1.6"/>` + T(0, -h / 2 + 57, '✓ evidence', 12, { f: '#fff' }); }
    else if (kind === 'long') { w = 208; h = 117; label = 'Long-form'; inner = miniStage(w, h) + noa(-34, h / 2 - 22, .28, { mood: 'smile' }) + uchu(34, h / 2 - 22, .28, { mood: 'shock' }); }
    else { w = 112; h = 140; label = 'Card news'; inner = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#fff8e8"/>` + T(0, -h / 2 + 26, '공짜? 근거 확인 ✓', 13) + noa(0, h / 2 - 22, .3, { mood: 'flat' }); }
    const body = `<rect x="${-w / 2 + 5}" y="${-h / 2 + 6}" width="${w}" height="${h}" rx="10" fill="${INK}" opacity=".18"/><clipPath id="cp-${kind}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8"/></clipPath><g clip-path="url(#cp-${kind})">${inner}</g><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="none" stroke="${INK}" stroke-width="3"/>` + sticker(0, h / 2 + 20, cap, flash) + chip(0, h / 2 + 52, label, '#26386b', { z: 13 });
    return g(x, y, s * pop(p), body);
  }

  /* ---------- scenes: each returns { s, cam: [zoom, cx, cy], noa: {...}, react } ---------- */
  const S = {};

  S.cold = (lt, c) => {
    let s = '';
    const scatter = ease(k(lt, c[3], .7));
    // background rain of other posts
    if (scatter < 1) for (let i = 0; i < 6; i++) { const y = -120 + ((lt * 110 + i * 117) % 760), x = 190 + i * 180; s += g(x, y, .34, `<g transform="rotate(${-10 + i * 5})">${postCard(POSTS[i % 3])}</g>`, .35 * (1 - scatter) * k(lt, c[0], .5)); }
    const P = [[340, 250, -8], [640, 200, 3], [940, 250, 7]];
    P.forEach(([px, py, r], i) => {
      const a = k(lt, .45 + i * .3, .25);
      if (a <= 0 || scatter >= 1) return;
      const st = k(lt, c[2] + [.2, 1.0, 1.9][i], .5);
      const x = px + (i - 1) * 700 * scatter, y = py - 260 * scatter + bob(lt + i, .4, 6);
      s += g(x, y, lerp(1.6, 1, ease(a)), `<g opacity="${n(Math.min(1, a * 3))}"><g transform="rotate(${n(r + bob(lt + i, .3, 3) + scatter * 40 * (i - 1))})">${postCard(POSTS[i], 1 - .65 * st)}</g></g>`) + stampMark(x + 70, y - 58, POSTS[i].stamp, st, -18 + i * 10);
    });
    const ux = lerp(430, 330, ease(k(lt, c[3], .6)));
    s += uchu(ux, STAND - Math.abs(Math.sin(lt * 2.5)) * 6, .95, { mood: lt < c[1] ? 'squint' : lt < c[3] ? 'shock' : 'grin', arms: lt < c[1] ? 'cheeks' : lt > c[3] ? 'up' : 'down', sweat: lt > c[1] && lt < c[3] });
    const tp = k(lt, c[3] + .2, .7);
    if (tp > 0) {
      s += g(640, lerp(-140, 210, ease(tp)), 1, panel(-330, -96, 660, 190, {}) + T(0, -50, 'HARNESS THEATER', 17, { f: '#d2443a', ls: 6 }) + T(0, 8, '하네스 극장', 62) + T(0, 58, '콘텐츠 자동화, 흔들림 없이 · Automation that stays consistent', 17, { f: '#6b4a36' }));
      [[520, icoBuckle, 'Harness', '하네스', '#ffd08a'], [700, icoBoard, 'Board', '보드', '#bcd3ff'], [880, icoCrew, 'Crew', '크루', '#bfe8c8']].forEach(([x, ico, en, ko, col], i) => { s += popAt(lt, c[3] + 2.2 + i * .7, x, 370, medallion(ico(), en, ko, col), .45); });
    }
    s += confetti(lt, c[3] + 4.2, 70, 3, [140, 40, 1140, 560]);
    const land = k(lt, c[1] - .3 + .8, .4);
    const nx = lerp(1380, 1010, ease(k(lt, c[1] - .3, .8)));
    const z = lt < c[3] ? lerp(1, 1.05, ease(k(lt, 0, c[3]))) : 1;
    return { s, cam: [z, 640, 330], noa: { x: nx, flip: true, pose: lt > c[3] ? 'wave' : lt > c[2] ? 'point' : 'idle', mood: lt > c[3] ? 'grin' : 'flat', sq: land > 0 && land < 1 ? .4 * Math.sin(land * Math.PI) : 0 }, react: lt > c[3] + 4 ? 'cheer' : lt > c[2] && lt < c[3] ? 'gasp' : null };
  };

  S.harness = (lt, c) => {
    let s = '';
    const panelsOut = 1 - k(lt, c[3] - .2, .4);           // guides/sensors/judge give the stage to the gate
    const ring = k(lt, c[0] + 2.8, .6);
    { const sq = lt > c[4] + 1.0 && lt < c[4] + 1.2; s += popAt(lt, .1, 640, 300, sq ? `<g transform="scale(1.08,.92)">${orb(0, 0, 64, lt, 'MODEL')}</g>` : orb(0, 0, 64, lt, 'MODEL'), .5); }
    if (ring > 0) s += `<g opacity="${n(ring)}"><circle cx="640" cy="300" r="${n(118 + 5 * Math.sin(lt * 2))}" fill="none" stroke="#f0a92a" stroke-width="7" stroke-dasharray="${n(760 * ring)} 999"/><circle cx="640" cy="300" r="136" fill="none" stroke="#f0a92a" stroke-width="2" stroke-dasharray="4 8" transform="rotate(${n(lt * 20)} 640 300)"/>${T(640, 158, 'HARNESS', 20, { f: '#d98a20', ls: 5 })}</g>`;
    if (panelsOut > 0) {
      let side = '';
      const gp = k(lt, c[1], .45);
      if (gp > 0) {
        let p = panel(-130, -120, 260, 250, { head: 'GUIDES · 가이드 · before', headFill: '#ffe9c4' });
        [['brand.md', '브랜드 규칙'], ['mission', '미션'], ['tools', '허용 도구']].forEach(([en, ko], i) => { const q = k(lt, c[1] + 1.2 + i, .35); if (q > 0) p += g(0, -44 + i * 58, pop(q), `<rect x="-110" y="-22" width="220" height="44" rx="10" fill="#fff" stroke="${INK}" stroke-width="2"/><rect x="-110" y="-22" width="10" height="44" rx="4" fill="#f0a92a"/>` + T(-88, 6, en, 18, { a: 'start' }) + T(96, 6, ko, 15, { a: 'end', f: '#6b4a36' })); });
        side += g(360, 322, pop(gp), p) + fade(k(lt, c[1] + 1, .4), arrow(496, 310, 566, 306, { c: '#d98a20', w: 4 }));
      }
      const sp = k(lt, c[2], .45);
      if (sp > 0) {
        let p = panel(-140, -80, 280, 160, { head: 'SENSORS · 코드 · after', headFill: '#d3f2e3' });
        [['length ≤ 16 · 길이'], ['banned words · 금지어'], ['broken links · 링크']].forEach(([t], i) => { const q = k(lt, c[2] + 1.6 + i * .6, .3); p += T(-118, -8 + i * 34 + 8, t, 17, { a: 'start' }) + (q > 0 ? check(114, -12 + i * 34 + 6, pop(q) * .85) : ''); });
        side += g(975, 262, pop(sp), p) + fade(k(lt, c[2] + .8, .4), arrow(732, 272, 832, 252, { c: '#2fb67a', w: 4 }));
        const jp = k(lt, c[2] + 3.3, .45);
        if (jp > 0) side += g(975, 436, pop(jp), panel(-140, -60, 280, 120, { fill: '#fff5f3', head: 'JUDGE · 심판 모델', headFill: '#ffd9d3' }) + member('verify', -92, 52, .52, { eyes: 'focus', label: null }) + bubble(20, 12, 'true?', { z: 16, tail: [-30, 20] }) + bubble(84, 12, 'us?', { z: 16, tail: [60, 30] }) + (lt > c[2] + 5.2 ? check(122, -26, pop(k(lt, c[2] + 5.2, .3))) : '')) + fade(k(lt, c[2] + 3.6, .4), arrow(720, 346, 832, 420, { c: '#e0352b', w: 4 }));
      }
      s += fade(panelsOut, side);
    }
    // gate: risky work waits for a human
    const gt = k(lt, c[3], .45);
    const gOut = 1 - k(lt, c[5], .4);
    if (gt > 0 && gOut > 0) s += `<g opacity="${n(Math.min(gt, gOut))}">${gate(430, STAND, 0, 200)}${card(650, 452, 190, 40, 'rm -rf content/', { kind: 'risk', z: 15, badge: 'RISK 78' })}<g opacity="${n(.6 + .4 * Math.sin(lt * 6))}">${chip(900, 480, '⏳ WAITING · 사람 대기', '#e0352b', { z: 15 })}</g></g>`;
    // seatbelt gag
    const sb = k(lt, c[4] + .6, .4);
    if (sb > 0) s += `<g><path d="M556,216 L724,384" stroke="#6b3f22" stroke-width="18" stroke-linecap="round" stroke-dasharray="${n(240 * sb)} 999"/>`
      + (sb >= 1 ? `<rect x="620" y="284" width="40" height="30" rx="6" fill="${C.yellow}" stroke="${INK}" stroke-width="2.6"/><rect x="630" y="293" width="20" height="12" rx="3" fill="#fff" stroke="${INK}" stroke-width="1.8"/>` : '') + `</g>` + (lt > c[4] + 1.0 && lt < c[5] + .3 ? burst(700, 260, 32, 'CLICK!', { z: 14 }) : '');
    if (lt > c[4] - .2) s += uchu(lerp(300, 540, ease(k(lt, c[4], .8)) * (1 - ease(k(lt, c[5] + .2, .8)))), STAND, .82, { mood: lt < c[5] ? 'squint' : 'grin', arms: lt > c[5] ? 'up' : 'down' });
    const mp = k(lt, c[5] + .4, .5);
    if (mp > 0) { const v = Math.round(1e6 * ease(k(lt, c[5] + .6, 2.4))); s += g(640, 468, 1.1 * pop(mp), `<rect x="-250" y="-38" width="500" height="76" rx="16" fill="#26386b" stroke="${INK}" stroke-width="2.6"/>` + T(-80, 12, v.toLocaleString('en-US'), 32, { f: C.yellow }) + T(130, -2, 'lines of code', 15, { f: '#fff' }) + T(130, 20, 'written by agents', 15, { f: '#9fe0c4' })); }
    if (lt > c[5] + 3) s += fade(k(lt, c[5] + 3, .4), T(640, 548, 'Humans steer. Agents execute.', 26, { f: '#26386b', stroke: '#fff', sw: 6 }));
    let cam = [1.02, 640, 330];
    if (lt > c[1] - .3 && lt < c[2] - .3) cam = [1.06, 520, 340];
    else if (lt >= c[2] - .3 && lt < c[3] - .2) cam = [1.06, 800, 340];
    else if (lt >= c[3] - .2 && lt < c[5]) cam = [1.04, 620, 360];
    else if (lt >= c[5]) cam = [1.0, 640, 360];
    return { s, cam, noa: { x: 190, pose: lt > c[5] ? 'wave' : lt > c[0] ? 'point' : 'idle', mood: lt > c[5] ? 'grin' : 'smile' }, react: lt > c[4] + .5 && lt < c[4] + 2.5 ? 'laugh' : null };
  };

  S.ontology = (lt, c) => {
    let s = '';
    const N = [[260, 300, 'Source', '출처', '#5b8def', 'S'], [470, 250, 'Claim', '주장', '#f7a1b4', 'C'], [690, 330, 'Evidence', '근거', '#2fb67a', 'E'], [900, 250, 'Script', '대본', '#f0a92a', 'S'], [1080, 310, 'Asset', '결과물', '#a86af2', 'A']];
    const L = [[0, 1, 'cites'], [1, 2, 'supportedBy'], [1, 3, 'usedIn'], [3, 4, 'renders']];
    const nt = (i) => c[2] + 2.4 + i * .6;
    // the dictionary (Uchu thinks it's a dinosaur)
    const bk = k(lt, c[1] + .3, .5), bOut = 1 - k(lt, c[2] + 2.0, .4);
    if (bk > 0 && bOut > 0) {
      let b = `<path d="M0,-70 Q-90,-96 -190,-70 L-190,90 Q-90,64 0,90 Q90,64 190,90 L190,-70 Q90,-96 0,-70 Z" fill="#fffdf6" stroke="${INK}" stroke-width="3"/><line x1="0" y1="-70" x2="0" y2="90" stroke="${INK}" stroke-width="2.4"/>` + T(-95, -26, 'ONTOLOGY', 24, { f: '#26386b', ls: 3 }) + T(-95, 6, '온톨로지 사전', 17, { f: '#6b4a36' }) + T(95, -26, 'objects', 18) + T(95, 4, 'links', 18) + T(95, 34, 'actions', 18);
      // the cold-open posts get swallowed into typed objects
      POSTS.forEach((p, i) => { const q = k(lt, c[2] + .4 + i * .3, .9); if (q > 0 && q < 1) b += g(lerp([-420, 0, 420][i], 0, ease(q)), lerp(-180, 0, ease(q)), .5 * (1 - q * .7), postCard(p)); });
      s += g(640, 330, pop(bk) * bOut, b) + (lt > c[2] + 1.8 && lt < c[2] + 2.5 ? burst(640, 330, 70, 'TYPED!', { z: 20, fill: '#bfe8c8' }) : '');
    }
    L.forEach(([a, b, lab]) => {
      const p = k(lt, nt(b) - .1, .5);
      if (p <= 0) return;
      const [x1, y1] = N[a], [x2, y2] = N[b], mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 40;
      s += `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="#8a6a52" stroke-width="3" stroke-dasharray="${n(420 * p)} 999"/>` + fade(p, T(mx, my + 12, lab, 14, { f: '#8a6a52' }));
    });
    // the sensor sweeps the claim→evidence link (drawn under the nodes, stops at the evidence edge)
    if (lt > c[5]) { const q = k(lt, c[5] + .1, 1.1); if (q < 1) { const sx = lerp(N[1][0] + 60, N[2][0] - 70, q), sy = lerp(N[1][1] + 10, N[2][1] - 10, q); s += `<line x1="${N[1][0] + 60}" y1="${N[1][1] + 10}" x2="${n(sx)}" y2="${n(sy)}" stroke="#2fb67a" stroke-width="6" stroke-linecap="round" opacity=".7"/>` + sparkle(sx, sy, 1.4, '#bfffe0'); } }
    N.forEach(([x, y, en, ko, col, ic], i) => { const p = k(lt, nt(i), .5); if (p > 0) s += g(lerp(640, x, ease(p)), lerp(330, y, ease(p)) + bob(lt + i, .3, 3), pop(Math.min(1, p * 1.5)), node(en, ko, col, ic)); });
    // the rule: a claim with no evidence hits the lock
    const rp = k(lt, c[3], .4);
    let cardX = 0, cardY = 0;
    if (rp > 0) {
      s += g(960, STAND, pop(rp), `<rect x="-60" y="-124" width="120" height="124" rx="10" fill="#8f5b3a" stroke="${INK}" stroke-width="2.6"/><rect x="-48" y="-112" width="96" height="112" rx="6" fill="#c07d4c"/>` + T(0, -134, 'PUBLISH', 18) + `<path d="M-10,-66 v-10 a10,10 0 0 1 20,0 v10" fill="none" stroke="#9aa0ad" stroke-width="6"/><rect x="-16" y="-66" width="32" height="26" rx="4" fill="${C.yellow}" stroke="${INK}" stroke-width="2.2"/>`);
      const tr = k(lt, c[3] + 1.0, 1.8), bk2 = k(lt, c[3] + 2.8, .5);
      cardX = lerp(470, 860, ease(tr)) - 130 * ease(bk2); cardY = lerp(290, 480, ease(tr)) - Math.sin(bk2 * Math.PI) * 40;
      s += g(cardX, cardY, 1, card(-90, -20, 180, 40, 'claim: "free"', { kind: 'risk', z: 16, badge: bk2 > 0 ? 'NO EVIDENCE' : null }));
      if (bk2 > 0 && bk2 < 1) s += burst(900, 440, 40, 'BONK', { z: 15, fill: '#ffd0c8' });
      s += `<path d="M${N[1][0] + 40},${N[1][1] + 26} L${N[2][0] - 40},${N[2][1] - 20}" stroke="${C.red}" stroke-width="3" stroke-dasharray="4 6" opacity="${n(rp * .8)}"/>`;
    }
    if (lt > c[5]) s += stampMark(cardX, cardY - 46, 'CAUGHT', k(lt, c[5] + 1.4, .5), 10);
    const um = lt < c[1] ? 'squint' : lt < c[4] ? 'smile' : lt < c[5] ? 'shock' : 'squint';
    s += uchu(1110, STAND + 150 * (1 - ease(k(lt, c[0] - .5, .5))), .8, { mood: um, arms: lt > c[4] && lt < c[5] + 1 ? 'cheeks' : 'down' });
    if (lt < c[1] + .3) { const dp = k(lt, c[0] + .2, .3); s += g(1060, 330, pop(dp), `<ellipse rx="70" ry="52" fill="#fff" stroke="${INK}" stroke-width="2.6"/><circle cx="40" cy="62" r="8" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="52" cy="80" r="5" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M-40,20 Q-44,-4 -26,-8 L-16,-30 Q-10,-40 0,-34 L4,-22 Q20,-26 30,-12 L42,-18 L38,0 Q40,20 26,22 L22,34 L14,34 L14,22 L-6,22 L-8,34 L-16,34 L-16,22 Q-30,24 -40,20 Z" fill="#8fd07a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="-4" cy="-24" r="2.4" fill="${INK}"/>`); }
    if (lt > c[1] + .3 && lt < c[1] + .9) s += burst(1060, 330, 56, 'POP!', { z: 18, fill: '#ffe3ef' });
    let cam = [1.02, 640, 330];
    if (lt > c[2] + 2 && lt < c[3]) cam = [1.04, 660, 310];
    else if (lt >= c[3]) cam = [1.04, 720, 360];
    return { s, cam, noa: { x: lerp(195, 360, ease(k(lt, c[4], .9))), pose: lt > c[3] ? 'point' : lt > c[1] ? 'think' : 'idle', mood: lt > c[5] ? 'grin' : 'smile' }, tint: null, react: lt > c[3] + 2.8 && lt < c[3] + 4 ? 'gasp' : lt > c[0] && lt < c[1] ? 'laugh' : null };
  };

  S.board = (lt, c) => {
    let s = '';
    const kb = kanban(300, 170, 720, 300, KCOLS, { head: '10XAI · BOARD', glow: lt > c[2] + 1.8 && lt < c[2] + 3.2 ? 2 : undefined });
    const bp = k(lt, c[1] + .2, .5);
    const under = bp > 0 ? `<ellipse cx="640" cy="330" rx="${n(460 * ease(bp))}" ry="${n(220 * ease(bp))}" fill="#bcd3ff" opacity=".35"/>` : '';
    if (bp > 0) s += g(640, 320, pop(bp), `<g transform="translate(-640,-320)">${kb.svg}</g>`);
    if (bp >= 1) { const lab = 'LIVE · agents 6 · humans 1'; s += `<circle cx="${n(1004 - K.tw(lab, 14) - 12)}" cy="188" r="${n(6 + 2 * Math.sin(lt * 6))}" fill="#ff5a4a"/>` + T(1004, 194, lab, 14, { a: 'end', f: '#e0352b' }); }
    const cw = kb.colW - 16, cx = (i) => kb.colX(i) + 8, rowY = (r) => kb.top + 6 + r * 44;
    // seeded cards (the three cold-open posts are now cards)
    const seed = [
      [0, 2, 'post · "$0.40"', '#ffd84d', c[1] + 2.6],
      [1, 0, 'claim · 5 min', '#f7a1b4', c[1] + 3.2], [1, 1, 'script · reel', '#f0a92a', c[1] + 3.2], [2, 1, 'asset · card', '#a86af2', c[1] + 3.2],
      [3, 1, 'source · docs', '#5b8def', c[1] + 3.8], [3, 2, 'evidence · log', '#2fb67a', c[1] + 3.8],
    ];
    seed.forEach(([col, row, t, stripe, t0]) => { if (lt > c[3] && ((col === 1 && row === 1) || (col === 0 && row === 2))) return; s += popAt(lt, t0, cx(col) + cw / 2, rowY(row) + 17, card(-cw / 2, -17, cw, 34, t, { stripe, z: 13 })); });
    // FREE!! (no evidence, caught in chapter 2) heads for the gate and is rejected
    const fp = k(lt, c[1] + 2.6, .3);
    if (fp > 0) {
      const mv = ease(k(lt, c[2] + 1.8, .6)), dq = k(lt, c[2] + 4.4, .9), drop = dq * dq;
      const x = lerp(cx(0), cx(2), mv) - 150 * drop, y = lerp(rowY(1), rowY(2), mv) - (mv > 0 && mv < 1 ? Math.sin(mv * Math.PI) * 40 : 0) + 300 * drop;
      if (dq < 1) s += `<g opacity="${n(1 - k(drop, .45, .55))}">` + g(x + cw / 2, y + 17, pop(fp), `<g transform="rotate(${n(-35 * drop)})">` + card(-cw / 2, -17, cw, 34, 'post · "FREE!!"', { stripe: '#f7b3c8', z: 13, kind: mv >= 1 ? 'risk' : 'orig', badge: mv >= 1 ? 'NO EVIDENCE' : null }) + `</g>`) + `</g>`;
      s += stampMark(cx(2) + cw / 2 - 150 * drop, rowY(2) + 17 + 300 * drop, 'REJECT', k(lt, c[2] + 3.9, .5) * (1 - k(drop, .45, .55)), -12);
      if (dq > 0 && dq < .6) s += burst(cx(2) + cw / 2, rowY(2) + 60, 30, 'NOPE', { z: 13, fill: '#ffd0c8' });
      if (lt > c[2] + 3.9 && lt < c[2] + 5.1) s += popAt(lt, c[2] + 3.9, cx(2) + cw / 2, 150, chip(0, 0, '근거 없음 → 발행 불가', '#e0352b', { z: 14 }));
    }
    // the hero card walks every column, and waits at the gate
    const hp = k(lt, c[1] + 2.6, .3);
    if (hp > 0) {
      let at = 0, from = 0, mv = 1;
      [[c[2] + 1.0, 1], [c[2] + 1.8, 2], [c[2] + 3.2, 3]].forEach(([tm, to]) => { if (lt >= tm) { from = at; at = to; mv = k(lt, tm, .6); } });
      const x = lerp(cx(from), cx(at), ease(mv)), y = rowY(0) - (mv < 1 ? Math.sin(mv * Math.PI) * 44 : 0);
      if (mv > 0 && mv < 1) s += `<path d="M${n(x - 6)},${n(y + 17)} l-70,0" stroke="#9aa7c2" stroke-width="6" stroke-linecap="round" opacity=".55"/>`;
      const waiting = at === 2 && mv >= 1;
      if (waiting) s += `<rect x="${n(x - 6)}" y="${n(y - 6)}" width="${n(cw + 12)}" height="46" rx="10" fill="none" stroke="${C.red}" stroke-width="4" opacity="${n(.4 + .5 * Math.abs(Math.sin(lt * 6)))}"/>`;
      s += g(x + cw / 2, y + 17, pop(hp) * 1.04, card(-cw / 2, -17, cw, 34, 'post · "$9.99"', { stripe: '#9aa7c2', z: 14, kind: at === 3 ? 'ok' : 'orig', badge: at === 3 && mv >= 1 ? '✓' : waiting ? 'WAIT' : null }));
    }
    // Uchu walks over and presses approve
    const ux = lerp(1110, 880, ease(k(lt, c[2] + .6, 1.4)));
    const pressed = lt > c[2] + 2.8;
    s += uchu(ux, STAND - (pressed && lt < c[2] + 3.4 ? hop(lt, c[2] + 2.8, 14) : 0), .78, { mood: pressed ? 'grin' : 'smile', arms: pressed && lt < c[3] ? 'up' : 'down' });
    if (lt > c[2] + 1.9) s += popAt(lt, c[2] + 1.9, 790, 470, `<rect x="-52" y="-16" width="104" height="32" rx="16" fill="${pressed ? '#1f8a5a' : '#2fb67a'}" stroke="${INK}" stroke-width="2.4"/>` + T(0, 6, 'APPROVE', 16, { f: '#fff' }) + (pressed && lt < c[2] + 3.4 ? `<circle r="${n(20 + 40 * k(lt, c[2] + 2.8, .5))}" fill="none" stroke="#2fb67a" stroke-width="3" opacity="${n(1 - k(lt, c[2] + 2.8, .5))}"/>` : ''));
    // everyone reads the same board, live
    const wp = k(lt, c[3], .5);
    if (wp > 0) {
      for (let r = 0; r < 3; r++) { const q = ((lt - c[3]) * .7 + r / 3) % 1; s += `<rect x="${n(300 - 26 * q)}" y="${n(170 - 26 * q)}" width="${n(720 + 52 * q)}" height="${n(300 + 52 * q)}" rx="${n(12 + 20 * q)}" fill="none" stroke="#5b8def" stroke-width="3" opacity="${n(.5 * (1 - q) * wp)}"/>`; }
      // two tiny crew cursors keep dragging cards: the board is alive
      [[1, 1, 3, .0], [0, 2, 1, .5]].forEach(([from, row, to, ph], i) => { const q = k(lt, c[3] + .3 + ph, 1.6), x = lerp(cx(from), cx(to), ease(q)); s += card(x, rowY(row) + 2, cw * .8, 28, i ? 'post · "$0.40"' : 'script · reel', { z: 12, stripe: i ? '#ffd84d' : '#f0a92a' }) + member(i ? 'decompose' : 'runner', x + cw * .8, rowY(row) + 44, .3, { eyes: 'focus', label: null }); });
      s += popAt(lt, c[3] + 2.8, 640, 506, chip(0, 0, 'One source of truth · 진실의 원천은 하나', '#26386b', { z: 19 }));
    }
    const peek = c[3] + 2.4;
    if (lt > peek - .15 && lt < peek + .35) s += burst(190, STAND - 70, 26, 'zip!', { z: 12, fill: '#e3ecff' });
    return { s, under, cam: lt > c[2] && lt < c[3] ? [1.04, 660, 330] : [1.02, 650, 330], tint: ['#2b2f5a', .30], noa: lt > c[3] + 2.4 ? { x: 640, y: lerp(430, 196, pop(k(lt, c[3] + 2.4, .45))), behind: true, pose: 'cheer', mood: 'grin' } : { x: 190, pose: lt > c[1] ? 'point' : 'idle', mood: 'smile' }, react: lt > c[2] + 3.2 && lt < c[2] + 4.4 ? 'cheer' : null };
  };

  S.crew = (lt, c) => {
    let s = '';
    const O = [640, 300];
    const team = [['decompose', 330], ['gapfill', 445], ['claude', 560], ['codex', 675], ['runner', 800], ['runner2', 925]];
    const op = k(lt, c[0] + .3, .5);
    if (op > 0) {
      s += `<polygon points="${O[0] - 60},${O[1] + 70} ${O[0] + 60},${O[1] + 70} ${O[0] - 100},${STAND} ${O[0] + 100},${STAND}" fill="#fff4dc" opacity=".55"/>`;
      s += g(O[0], O[1] + 70, pop(op), `<rect x="-70" y="0" width="140" height="26" rx="6" fill="#8f5b3a" stroke="${INK}" stroke-width="2.6"/>` + member('orchestrator', 0, 0, .95, { eyes: 'happy', label: null }));
    }
    const crashAt = c[6] + 2.4;
    team.forEach(([role, x], i) => {
      const p = k(lt, c[0] + .6 + i * .1, .4);
      if (p <= 0) return;
      if (lt > c[0] + 1) { const f = ((lt - c[0] - 1) * .6 + i * .17) % 1, y0 = O[1] + 130, px = lerp(O[0], x, f), py = lerp(y0, STAND - 120, f) - Math.sin(f * Math.PI) * 20, dim = lt > c[2] + 1.8 && lt < c[3] ? .25 : 1; s += `<g opacity="${dim}"><path d="M${O[0]},${y0} Q${(O[0] + x) / 2},${y0 - 20} ${x},${STAND - 120}" fill="none" stroke="${CREW[role][0]}" stroke-width="2.4" stroke-dasharray="5 7" opacity=".55"/><rect x="${n(px - 9)}" y="${n(py - 6)}" width="18" height="12" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.6"/></g>`; }
      let h = 0;
      if (role === 'decompose') h = hop(lt, c[1] + .6);
      if (role === 'gapfill') h = hop(lt, c[1] + 2.4);
      if (role === 'claude' || role === 'codex') h = hop(lt, c[2] + 2.0);
      const dizzy = role === 'runner' && lt > crashAt && lt < crashAt + 2;
      s += g(x, STAND - 12 - h, pop(p), member(role, 0, 0, .8, { eyes: dizzy ? 'dizzy' : (role === 'claude' || role === 'codex') && lt > c[2] ? 'focus' : 'dot' }));
    });
    [[330, c[1] + .3, '✂ split!'], [445, c[1] + 1.6, '+ .env!'], [560, c[2] + 2.0, 'risk 12'], [675, c[2] + 2.0, 'risk 71?!']].forEach(([x, t0, txt]) => { if (lt > t0 && lt < t0 + 1.6) s += popAt(lt, t0, x, 330, bubble(0, 0, txt, { z: 16, tail: [0, 40] })); });
    if (lt > c[1] + .6) s += popAt(lt, c[1] + .6, 330, 400, card(-50, -12, 100, 24, 'step 1', { z: 11 }) + card(-50, 16, 100, 24, 'step 2', { z: 11 }));
    if (lt > c[1] + 2.4) s += popAt(lt, c[1] + 2.4, 445, 410, card(-56, -12, 112, 24, '+ .env keys', { kind: 'gap', z: 11 }));
    if (lt > c[2] + 1.8) {
      s += popAt(lt, c[2] + 2.0, 560, 410, chip(0, 0, '✓ risk 12', '#2fb67a', { z: 15 }));
      s += popAt(lt, c[2] + 2.0, 675, 410, chip(0, 0, '✗ risk 71', '#e0352b', { z: 15 }));
      if (lt > c[2] + 3.6) s += popAt(lt, c[2] + 3.6, 617, 368, chip(0, 0, 'DISAGREE → HUMAN', '#26386b', { z: 15 }));
    }
    // Uchu is the human in the loop
    if (lt > c[3] - .2) {
      const pw = lt > c[5];
      s += uchu(1080, STAND - (pw ? Math.abs(Math.sin(lt * 7)) * 12 : 0), .82, { mood: pw ? 'grin' : lt > c[4] ? 'shock' : 'smile', arms: pw ? 'up' : 'down', crown: pw });
      s += popAt(lt, c[4] + 1.4, 1080, 330, `<rect x="-58" y="-18" width="116" height="36" rx="18" fill="#2fb67a" stroke="${INK}" stroke-width="2.6"/>` + T(0, 7, 'APPROVE', 18, { f: '#fff' }));
      if (lt > c[4] + 1.4) s += fade(k(lt, c[4] + 1.4, .4), arrow(740, 368, 1010, 336, { c: '#26386b', w: 3 }));
      if (pw && lt < c[6]) for (let i = 0; i < 5; i++) s += sparkle(1080 + Math.cos(lt * 3 + i * 1.3) * 80, 420 + Math.sin(lt * 3 + i * 1.3) * 40, 1.1, C.yellow);
    }
    // sandboxes contain the crash
    const flash = lt > crashAt && lt < crashAt + .6;
    [[800, 0], [925, .4]].forEach(([x, d], i) => { s += dome(x, STAND - 10, 124, k(lt, c[6] + 1.2 + d, .4), 'git worktree', i === 0 && flash); });
    if (lt > crashAt) { const q = k(lt, crashAt, .4); s += g(800, STAND - 40, 1, `<g transform="rotate(${n(80 * ease(q))})">${card(-40, -12, 80, 24, 'rm -rf', { kind: 'risk', z: 11 })}</g>`) + (lt < crashAt + 1.2 ? burst(800, STAND - 70, 30, 'CRASH', { z: 12, fill: '#ffd0c8' }) : '') + popAt(lt, crashAt + .6, 800, STAND - 110, chip(0, 0, '진짜 파일 무사 ✓', '#2fb67a', { z: 13 })); }
    let cam = [1.0, 640, 360];
    if (lt > c[2] && lt < c[3]) cam = [1.06, 617, 380];
    else if (lt >= c[3] && lt < c[6]) cam = [1.04, 840, 380];
    else if (lt >= c[6]) cam = [1.05, 860, 400];
    return { s, cam, spot: 640, vignette: true, noa: { x: 190, pose: lt > c[4] && lt < c[5] ? 'point' : 'idle', mood: lt > c[5] && lt < c[6] ? 'flat' : 'smile' }, react: lt > c[5] && lt < c[6] ? 'laugh' : lt > c[2] + 3.6 && lt < c[3] ? 'gasp' : lt > crashAt && lt < crashAt + 1.5 ? 'gasp' : null };
  };

  S.auto = (lt, c) => {
    let s = '';
    const critic = k(lt, c[5], .5), mOut = 1 - critic;
    const big = lt > c[4] && lt < c[5] + .4 ? ease(k(lt, c[4], .5)) * (1 - k(lt, c[5], .4)) : 0;
    const mp = k(lt, c[0] + .2, .5);
    if (mp > 0 && mOut > 0) {
      let m = `<rect x="-120" y="-100" width="240" height="200" rx="26" fill="#cfe3f7" stroke="${INK}" stroke-width="3"/><rect x="-96" y="-76" width="192" height="100" rx="10" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
      ['#dbe7ff', '#ffefcc', '#ffd9d3', '#d3f2e3'].forEach((col, i) => { m += `<rect x="${-88 + i * 45}" y="-68" width="40" height="84" rx="4" fill="${col}" stroke="${INK}" stroke-width="1.2"/><rect x="${-84 + i * 45}" y="${-60 + ((Math.floor(lt * 2) + i) % 3) * 22}" width="32" height="14" rx="2" fill="#fff" stroke="${INK}" stroke-width="1"/>`; });
      m += T(0, 60, 'ontology + harness', 16, { f: '#2f4f8f' });
      for (const [gx, sign] of [[-120, 1], [120, -1]]) m += `<g transform="translate(${gx},80) rotate(${n(sign * lt * 60)})">${[0, 60, 120].map((a) => `<rect x="-5" y="-30" width="10" height="60" fill="${C.yellow}" stroke="${INK}" stroke-width="1.6" transform="rotate(${a})"/>`).join('')}<circle r="22" fill="${C.yellow}" stroke="${INK}" stroke-width="2.4"/><circle r="8" fill="#fff" stroke="${INK}" stroke-width="2"/></g>`;
      s += g(470, 330, pop(mp), m, mOut * (1 - .5 * big));
      // the one fact that gets fixed stays lit while the machine dims
      if (lt > c[3]) {
        const fix = k(lt, c[4] + 1.2, .6), ring = big > 0 ? `<rect x="-96" y="-28" width="192" height="56" rx="16" fill="none" stroke="#2fb67a" stroke-width="5" opacity="${n(big * (.5 + .5 * Math.sin(lt * 8)))}"/>` : '';
        s += g(470, 204, pop(k(lt, c[3], .35)), ring + (fix >= 1 ? g(0, 0, pop(k(lt, c[4] + 1.8, .3)), card(-86, -18, 172, 36, 'claim · setup: 12 min', { kind: 'ok', z: 15 })) : card(-86, -18, 172, 36, 'claim · setup: 5 min', { kind: 'risk', z: 15 }) + (fix > 0 ? `<line x1="20" y1="0" x2="${n(20 + 62 * Math.min(1, fix / .6))}" y2="0" stroke="${C.red}" stroke-width="4"/>` : '')), mOut);
      }
    }
    const ip = k(lt, c[0] + 1.0, 1);
    if (ip < 1 && ip > 0) { const bx = lerp(200, 440, ease(ip)), by = lerp(250, 300, ease(ip)) - Math.sin(ip * Math.PI) * 60; s += g(bx, by, 1 - .6 * ip, `<circle r="${n(40 + 5 * Math.sin(lt * 8))}" fill="#fff6c8" opacity=".6"/><path d="M-22,-10 A26,26 0 1 1 22,-10 Q14,4 12,18 L-12,18 Q-14,4 -22,-10 Z" fill="${C.yellow}" stroke="${INK}" stroke-width="2.6"/><rect x="-12" y="18" width="24" height="12" rx="3" fill="#9aa0ad" stroke="${INK}" stroke-width="2"/>` + T(0, 60, 'one idea', 17)); }
    // three outputs drawn with this cast; the fixed fact flows into all of them
    const row = ease(critic);
    const O = [['reel', 745, 300, 1.0, 830, 216, c[1] + 1.4, c[4] + 2.0], ['long', 965, 212, 1.0, 975, 216, c[1] + 2.4, c[4] + 2.3], ['card', 1010, 420, 1.0, 1080, 216, c[1] + 3.4, c[4] + 2.6]];
    // conveyor belt that carries the outputs in
    if (mOut > 0 && lt > c[1]) { let belt = `<rect x="600" y="${STAND - 18}" width="560" height="22" rx="11" fill="#6d6f86" stroke="${INK}" stroke-width="2.4"/>`; for (let i = 0; i < 14; i++) { const x = 606 + ((lt * 120 + i * 40) % 548); belt += `<line x1="${n(x)}" y1="${STAND - 14}" x2="${n(x + 10)}" y2="${STAND}" stroke="#a9abc0" stroke-width="3"/>`; } s += fade(k(lt, c[1], .4) * mOut, belt); }
    O.forEach(([kind, x, y, sc, x2, y2, t0]) => { const p = k(lt, t0, .45); if (p > 0 && mOut > .5) s += `<path d="M590,330 Q${(590 + x) / 2},${y - 90} ${x},${y}" fill="none" stroke="#f0a92a" stroke-width="3" stroke-dasharray="${n(500 * p)} 999" opacity="${n(.8 * mOut)}"/>`; });
    O.forEach(([kind, x, y, sc, x2, y2, t0, tFix]) => { if (lt > tFix - .4 && lt < tFix + .6) s += `<path d="M470,204 Q${(470 + x) / 2},${y - 170} ${x},${n(y + (kind === 'reel' ? 112 : kind === 'long' ? 78 : 90) * (1 + .2 * big))}" fill="none" stroke="#2fb67a" stroke-width="4" stroke-dasharray="${n(700 * k(lt, tFix - .4, .4))} 999"/>`; });
    O.forEach(([kind, x, y, sc, x2, y2, t0, tFix]) => {
      const p = k(lt, t0, .45), slide = 1 - ease(k(lt, t0, .6));
      const fixed = lt > tFix;
      s += output(kind, lerp(x, x2, row) + 360 * slide, lerp(y, y2, row), lerp(sc, .62, row) * (1 + .2 * big), fixed ? '12 min' : '5 min', fixed ? k(lt, tFix, .6) : 0, p);
    });
    [['same facts', '같은 사실'], ['same voice', '같은 목소리'], ['same cast', '같은 캐릭터']].forEach(([en, ko], i) => { const p = k(lt, c[2] + .3 + i * .7, .35); if (p > 0 && mOut > 0) s += g(500, 470 + i * 36, pop(p), chip(0, 0, '✓ ' + en + ' · ' + ko, '#2fb67a', { z: 14 }), mOut); });
    // the critic's scoreboard
    if (critic > 0) {
      let b = panel(-190, -120, 380, 240, { head: 'CRITIC AGENT · 비평 에이전트', headFill: '#ffe3ef' });
      b += `<line x1="-150" y1="0" x2="150" y2="0" stroke="${C.red}" stroke-width="2" stroke-dasharray="6 5"/>` + T(158, 5, '8.0', 13, { f: C.red, a: 'start' });
      [['R1', 5.4], ['R2', 7.5], ['R3', 8.1]].forEach(([r, v], i) => { const q = ease(k(lt, c[5] + 1.4 + i * .7, .5)), h = 12 * v * q; b += `<rect x="${-120 + i * 90}" y="${n(96 - h)}" width="60" height="${n(h)}" rx="6" fill="${['#f0a92a', '#5b8def', '#2fb67a'][i]}" stroke="${INK}" stroke-width="2"/>` + (q > .1 ? T(-90 + i * 90, n(88 - h), v.toFixed(1), 20) : '') + T(-90 + i * 90, 114, r, 14, { f: '#6b4a36' }); });
      s += g(470, 340, pop(critic), b) + stampMark(620, 240, 'B+', k(lt, c[5] + 3.4, .5), 12);
    }
    if (lt > c[3] - .1) s += uchu(1135, STAND, .78, { mood: lt < c[4] ? 'squint' : lt > c[6] - .1 && lt < c[7] ? 'shock' : 'smile', arms: lt > c[6] - .1 && lt < c[7] + .6 ? 'cheeks' : 'down', bang: lt > c[6] && lt < c[7], sweat: lt > c[6] });
    let cam = [1.03, 520, 330];
    if (lt > c[1] && lt < c[5]) cam = [1.02, 720, 340];
    else if (lt >= c[5]) cam = [1.02, 640, 330];
    if (lt > c[4] + 1.6 && lt < c[5]) cam = [1.06, 900, 330];
    return { s, cam, tint: ['#ffcf7a', .18], noa: { x: lerp(190, 250, ease(k(lt, c[4], .6)) * (1 - ease(k(lt, c[5], .6)))), pose: lt > c[4] && lt < c[5] ? 'stamp' : lt > c[1] && lt < c[3] ? 'point' : 'idle', mood: lt > c[7] ? 'flat' : 'smile', glasses: lt > c[7] + .2 ? 'up' : true }, react: lt > c[5] + 3.4 && lt < c[6] ? 'cheer' : lt > c[6] ? 'laugh' : lt > c[4] + 2 && lt < c[5] ? 'cheer' : null };
  };

  S.curtain = (lt, c) => {
    let s = '';
    const bow = lt > c[2] + .3 && lt < c[2] + .9 ? .82 : 1;
    [[420, icoBuckle, 'Harness', '규칙 · rules', '#ffd08a'], [640, icoBoard, 'Board', '진실 · truth', '#bcd3ff'], [860, icoCrew, 'Crew', '속도 · speed', '#bfe8c8']].forEach(([x, ico, en, ko, col], i) => {
      // on "Encore!" the medallions fly down, orbit Noa once, and come home in a burst of confetti
      const fly = ease(k(lt, c[2], .35)) * (1 - ease(k(lt, c[2] + 1.2, .45))), a = 2 * Math.PI * k(lt, c[2], 1.2) + i * 2.09;
      const mx = lerp(x, 640 + 150 * Math.cos(a), fly), my = lerp(240, STAND - 200 + 40 * Math.sin(a), fly);
      s += popAt(lt, c[0] + [.3, 1.5, 2.8][i], mx, my, g(0, 0, 1 - .45 * fly, medallion(ico(), en, ko, col, true)), .45);
    });
    s += confetti(lt, c[2] + 1.2, 60, 3, [440, 260, 840, 520]);
    const mq = k(lt, c[1] + .3, .4);
    if (mq > 0) {
      let m = `<rect x="-230" y="-26" width="460" height="52" rx="12" fill="#fff8e8" stroke="${C.red}" stroke-width="9"/>`;
      for (let i = 0; i < 23; i++) { const x = -220 + i * 20; m += `<circle cx="${x}" cy="-26" r="3.2" fill="${(i + Math.floor(lt * 6)) % 2 ? C.yellow : '#fff'}"/><circle cx="${x}" cy="26" r="3.2" fill="${(i + Math.floor(lt * 6)) % 2 ? '#fff' : C.yellow}"/>`; }
      s += g(640, 138, pop(mq), m + R(0, 9, '다음 공연 ★ *NEXT SHOW*', 24, INK, C.red));
    }
    [[250, 'decompose'], [355, 'gapfill'], [460, 'claude'], [820, 'runner'], [925, 'deploy'], [1030, 'codex']].forEach(([x, role], i) => { const p = k(lt, .2 + i * .1, .4); if (p > 0) s += squash(x, STAND - 12, bow, g(x, STAND - 12 - Math.abs(Math.sin(lt * 3 + i)) * 8 * (bow < 1 ? 0 : 1), pop(p), member(role, 0, 0, .74, { eyes: 'happy', hat: true, label: null }))); });
    s += squash(1130, STAND, bow, uchu(1130, STAND - (lt > c[2] && bow === 1 ? Math.abs(Math.sin(lt * 6)) * 22 : 0), .8, { mood: 'grin', arms: lt > c[2] ? 'up' : 'down' }));
    s += popAt(lt, c[1] + 1.2, 640, 88, chip(0, 0, 'github.com/tmuchal/10XAI', '#26386b', { z: 17 }));
    s += confetti(lt, c[1], 90, 5, [140, 40, 1140, 580]);
    return { s, cam: [lerp(1.05, 1, ease(k(lt, 0, 3))), 640, 340], noa: { x: 640, scale: .9, pose: lt > c[1] + 1 ? 'cheer' : 'wave', mood: 'grin', hat: true, sq: bow < 1 ? .6 : 0 }, react: lt > c[1] ? 'cheer' : null };
  };

  /* ---------- chrome ---------- */
  // Chapter entrances: a painted scenery flat drops in with the chapter card, then flies out.
  function chapterFlat(ch, lt, lead) {
    const down = ease(k(lt, -.35, .35)), up = ease(k(lt, lead - .35, .35));
    if (up >= 1) return '';
    const y = -H * (1 - down) - H * up;
    const FLAT = { 1: ['#fbe8c9', (x, y) => g(x, y, 3.2, icoBuckle())], 2: ['#e6effb', (x, y) => g(x, y, 1, `<path d="M0,-80 Q-100,-110 -210,-80 L-210,90 Q-100,62 0,90 Q100,62 210,90 L210,-80 Q100,-110 0,-80 Z" fill="#fff" stroke="${INK}" stroke-width="4"/><line x1="0" y1="-80" x2="0" y2="90" stroke="${INK}" stroke-width="3"/>`)], 3: ['#e7f6ec', (x, y) => g(x, y, 4, icoBoard())], 4: ['#fbe3ea', (x, y) => g(x, y, 4, icoCrew())], 5: ['#efe6fb', (x, y) => g(x, y, 1, [0, 1, 2, 3, 4].map((i) => `<rect x="${-250 + i * 104}" y="-60" width="92" height="120" rx="6" fill="#2c2e47" stroke="${INK}" stroke-width="3"/><rect x="${-240 + i * 104}" y="-46" width="72" height="92" fill="#fff7e0"/>`).join(''))] };
    const [tint, motif] = FLAT[ch[0]] || FLAT[1];
    let f = `<rect x="0" y="0" width="${W}" height="${H}" fill="${tint}"/><rect x="0" y="0" width="${W}" height="${H}" fill="url(#sun)" opacity=".7"/>`;
    [[250, 200], [1030, 210], [240, 540], [1040, 530]].forEach(([x, yy]) => { f += `<g opacity=".3">${motif(x, yy)}</g>`; });
    f += `<rect x="150" y="${H - 40}" width="${W - 300}" height="14" fill="#8f5b3a"/>` + g(640, 360, 1, panel(-310, -120, 620, 240, {}) + `<rect x="-290" y="-132" width="84" height="24" fill="#9fd3f5" opacity=".8" transform="rotate(-4)"/><rect x="206" y="-134" width="84" height="24" fill="#f7b5c8" opacity=".8" transform="rotate(5)"/>` + T(0, -62, 'CHAPTER ' + String(ch[0]).padStart(2, '0'), 22, { f: '#d2443a', ls: 7 }) + T(0, 18, ch[1], 58) + T(0, 72, ch[2], 24, { f: '#6b4a36' }));
    [[280, 180], [1000, 190], [330, 560], [960, 560]].forEach(([x, yy], i) => { f += sparkle(x, yy, 1.4 + .3 * Math.sin(lt * 6 + i), '#fff4c2'); });
    return `<g transform="translate(0,${n(y)})">${f}<line x1="200" y1="-${H}" x2="200" y2="0" stroke="${INK}" stroke-width="2"/><line x1="${W - 200}" y1="-${H}" x2="${W - 200}" y2="0" stroke="${INK}" stroke-width="2"/></g>`;
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

  /* ---------- camera: ease toward each new target over 0.7 s, clamped away from the chrome ---------- */
  function camAt(sc, lt, c) {
    const target = (u) => S[sc.id](Math.max(0, u), c, sc).cam;
    const now = target(lt), prev = target(lt - .7);
    let v = now;
    if (now.join() !== prev.join()) {
      let lo = lt - .7, hi = lt;
      for (let j = 0; j < 8; j++) { const mid = (lo + hi) / 2; if (target(mid).join() === now.join()) hi = mid; else lo = mid; }
      const from = target(lo), p = ease(k(lt, hi, .7));
      v = from.map((x, j) => lerp(x, now[j], p));
    }
    const z = Math.min(v[0], 1.06), cy = Math.min(v[2], 172 + 190 / z), cx = Math.max(640 - (z - 1) * 600, Math.min(640 + (z - 1) * 600, v[1]));
    return [z, cx, cy];
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
    let s = K.backdrop(t, { spot: res.spot || (sc.id === 'cold' || sc.id === 'curtain' ? 640 : null), tint: res.tint, vignette: res.vignette });
    const camT = `translate(640,360) scale(${n(z * 1000) / 1000}) translate(${n(-cx)},${n(-cy)})`;
    if (res.under) s += `<g transform="${camT}">${res.under}</g>`;   // lit under the board, not over a peeking Noa
    if (res.noa && res.noa.behind) { const o = res.noa; s += noa(o.x, o.y, o.scale || NOA, o); }   // peeks over the board, which is drawn on top
    s += `<g transform="translate(640,360) scale(${n(z * 1000) / 1000}) translate(${n(-cx)},${n(-cy)})">${res.s}</g>`;
    const nx = scenes[i + 1], pre = nx && nx.chapter && lt > sc.dur - .35;
    if (sc.chapter) { s += chapterFlat(sc.chapter, lt, lead); if (lt > lead - .35 && !pre) s += K.chapterTag(sc.chapter[0], sc.chapter[1], k(lt, lead - .2, .45)); }
    if (pre) s += chapterFlat(nx.chapter, lt - sc.dur, 1e9);   // the next flat drops over the cut
    if (res.noa && !res.noa.behind) { const o = res.noa; s += noa(o.x, STAND, o.scale || NOA, o); }
    if (sc.source) s += K.source(sc.source, k(lt, lead, .5) * (1 - k(lt, sc.dur - .35, .12)));
    s += audience(t, res.react) + K.curtains(t);
    // the drapes open the show, frame the finale, and close it
    let dr = 0;
    if (i === 0) dr = 1 - k(lt, 0, .35);
    if (i === scenes.length - 2) dr = k(lt, sc.dur - .4, .4);
    if (i === scenes.length - 1) dr = Math.max(1 - k(lt, 0, .45), k(lt, sc.dur - 1.3, 1.2));
    s += drapes(dr);
    let cue = null;
    sc.cues.forEach((q) => { if (lt >= q.start - .05 && lt < q.start + q.dur + .35) cue = q; });
    if (cue && dr < .9) s += K.subtitle(cue.en, cue.ko, lt - cue.start + .05);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`;
  }
  root.FILM = { frame, total: TL.total, scenes };
})(window);
