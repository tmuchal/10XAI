/* 운명극장 — story / sim engine. Format: SPEC.md. */
'use strict';

const STORY = {
  packs: {}, order: [],
  register(p) { this.packs[p.id] = p; if (!this.order.includes(p.id)) this.order.push(p.id); },
};

const EMOS = ['neutral', 'smile', 'laugh', 'sad', 'cry', 'angry', 'surprised', 'shy', 'smirk', 'cold', 'worried', 'tired'];
const EMO_KO = { neutral: '평온', smile: '미소', laugh: '웃음', sad: '슬픔', cry: '눈물', angry: '분노', surprised: '놀람', shy: '수줍음', smirk: '능청', cold: '냉담', worried: '걱정', tired: '지침' };
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = a => a[Math.floor(Math.random() * a.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
};
const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  log: '<path d="M5 6h14M5 12h14M5 18h9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  auto: '<path d="M8 5l11 7-11 7z"/>',
  skip: '<path d="M5 5l8 7-8 7zM13 5l8 7-8 7z"/>',
  stats: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  plan: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  shop: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
};
const ic = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

/* ---------------- state ---------------- */
let P = null;          // active pack
let S = null;          // run state (serialisable)
let RUN = null;        // run token
let SAMPLE = null;     // Claude sampling fn (null when unavailable)
let AI_OFF = false;    // set once the viewer declines or sampling is disabled
const PREF = Object.assign({ speed: 26, tier: 'quick' }, store.get('unmyeong-pref', {}));
const UIS = { auto: false, skip: false, typing: null, advance: null, sheet: null };

function newState(pack, name) {
  const st = {
    ver: 1, pack: pack.id, s: { name }, v: {}, aff: {}, flags: {}, turn: 0,
    stack: [], queue: [], stage: { bg: 'black', chars: [] }, log: [], mode: 'vn',
    used: {}, chats: {}, evFired: {}, hubChatTurn: -1, bought: {}, started: Date.now(),
  };
  for (const s of pack.stats || []) st.v[s.id] = 0;
  Object.assign(st.v, JSON.parse(JSON.stringify(pack.vars || {})));
  for (const id of Object.keys(pack.chars || {})) st.aff[id] = 0;
  Object.assign(st.aff, pack.affStart || {});
  return st;
}
const saveKey = id => 'unmyeong-save-' + id;
function save(replay) {
  if (!S) return;
  const c = JSON.parse(JSON.stringify(S));
  if (replay && c.stack.length) c.stack[c.stack.length - 1].i -= 1;
  c.savedAt = Date.now();
  store.set(saveKey(S.pack), c);
}

/* ---------------- text / conditions / effects ---------------- */
function interp(t) {
  if (t == null) return '';
  return String(t).replace(/\{(s\.|v\.)?([a-zA-Z_][\w]*)\}/g, (m, ns, k) => {
    if (!S) return m;
    if (ns === 'v.') return S.v[k] ?? 0;
    if (ns === 's.') return S.s[k] ?? '';
    if (k === 'name') return S.s.name;
    if (S.s[k] != null) return S.s[k];
    return m;
  });
}
function cmp(val, spec) {
  if (typeof spec === 'number') return val === spec;
  const m = /^(>=|<=|>|<|==|!=)\s*(-?\d+(?:\.\d+)?)$/.exec(String(spec).trim());
  if (!m) return false;
  const n = +m[2];
  switch (m[1]) { case '>=': return val >= n; case '<=': return val <= n; case '>': return val > n; case '<': return val < n; case '==': return val === n; default: return val !== n; }
}
const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
function simAge() { const sim = P.sim; if (!sim || sim.ageStart == null) return 0; return sim.ageStart + Math.floor(S.turn / (sim.unit === 'week' ? 48 : 12)); }
function simDate(turn = S.turn) {
  const sim = P.sim, st = sim.start || { year: 1, month: 1 };
  const mIdx = sim.unit === 'week' ? Math.floor(turn / 4) : turn;
  const m0 = (st.month - 1) + mIdx;
  return { y: st.year + Math.floor(m0 / 12), m: (m0 % 12) + 1, w: sim.unit === 'week' ? (turn % 4) + 1 : 0 };
}
function cond(c) {
  if (!c) return true;
  for (const [k, val] of Object.entries(c)) {
    let ok = true;
    switch (k) {
      case 'v': ok = Object.entries(val).every(([id, sp]) => cmp(S.v[id] ?? 0, sp)); break;
      case 'aff': ok = Object.entries(val).every(([id, sp]) => cmp(S.aff[id] ?? 0, sp)); break;
      case 'flag': ok = arr(val).every(f => S.flags[f]); break;
      case 'noflag': ok = arr(val).every(f => !S.flags[f]); break;
      case 's': ok = Object.entries(val).every(([id, x]) => (S.s[id] ?? '') === x); break;
      case 'turn': ok = cmp(S.turn, val); break;
      case 'age': ok = cmp(simAge(), val); break;
      case 'month': ok = P.sim ? simDate().m === val : false; break;
      case 'top': {
        const mine = S.aff[val] ?? 0;
        ok = mine > 0 && Object.entries(S.aff).every(([id, a]) => id === val || a < mine);
        break;
      }
      case 'maxstat': {
        const mine = S.v[val] ?? 0;
        ok = (P.stats || []).every(s => s.id === val || (S.v[s.id] ?? 0) <= mine);
        break;
      }
      case 'chance': ok = Math.random() < val; break;
      case 'any': ok = val.some(cond); break;
      case 'all': ok = val.every(cond); break;
      case 'not': ok = !cond(val); break;
      default: ok = true;
    }
    if (!ok) return false;
  }
  return true;
}
function statDef(id) { return (P.stats || []).find(s => s.id === id); }
function varName(id) {
  const d = statDef(id); if (d) return d.name;
  const names = Object.assign({ money: '돈', stress: '스트레스', fame: '명성', fans: '팬덤' }, P.varNames || {});
  return names[id] || id;
}
function setVar(id, x) {
  const d = statDef(id);
  if (d) x = clamp(x, 0, d.max ?? 100);
  else if (!(P.sim && P.sim.money === id) && id !== 'money') x = Math.max(0, x);
  S.v[id] = Math.round(x * 10) / 10;
}
function applyFx(fx, quiet) {
  if (!fx) return [];
  const notes = [];
  for (const [id, d] of Object.entries(fx.v || {})) {
    const before = S.v[id] ?? 0; setVar(id, before + d);
    const diff = Math.round((S.v[id] - before) * 10) / 10;
    if (diff) notes.push({ k: varName(id), d: diff, bad: id === 'stress' ? diff > 0 : diff < 0 });
  }
  for (const [id, x] of Object.entries(fx.setv || {})) setVar(id, x);
  for (const [id, x] of Object.entries(fx.set || {})) S.s[id] = x;
  for (const [id, d] of Object.entries(fx.aff || {})) {
    const before = S.aff[id] ?? 0; S.aff[id] = clamp(before + d, 0, 100);
    const diff = S.aff[id] - before;
    if (diff) notes.push({ k: charShort(id), d: diff, heart: true });
  }
  for (const f of arr(fx.flag)) S.flags[f] = 1;
  for (const f of arr(fx.unflag)) delete S.flags[f];
  if (!quiet && !UIS.skip) notes.slice(0, 5).forEach(n => toast(fxNote(n)));
  if (S.mode === 'vn') renderTop();
  return notes;
}
function fxNote(n) {
  const sign = n.d > 0 ? '+' : '';
  if (n.heart) return `<span class="hr">♥</span> ${esc(n.k)} <span class="${n.d > 0 ? 'up' : 'dn'}">${sign}${n.d}</span>`;
  return `${esc(n.k)} <span class="${n.bad ? 'dn' : 'up'}">${sign}${n.d}</span>`;
}

/* ---------------- characters ---------------- */
function charDef(id) { return P.chars[id]; }
// affection is shared between age variants of the hub character (daughter_teen → daughter)
function affId(id) {
  if (P.affAlias?.[id]) return P.affAlias[id];
  const by = P.sim?.hubCharByAge;
  if (by && Object.values(by).includes(id) && P.sim.hubChar && !P.sim.hubChar.startsWith('s:')) return P.sim.hubChar;
  return id;
}
function charName(id) { const c = charDef(id); return c ? interp(c.name) : ''; }
function charShort(id) { const c = charDef(id); return c ? interp(c.short || c.name) : id; }
const PORTRAIT_CACHE = new Map();
function portrait(id, e = 'neutral', crop) {
  const c = charDef(id); if (!c) return '';
  const key = `${P.id}:${id}:${e}:${crop || ''}`;
  if (PORTRAIT_CACHE.has(key)) return PORTRAIT_CACHE.get(key);
  let svg = '';
  try { svg = window.ART ? ART.portrait(c.look, EMOS.includes(e) ? e : 'neutral', crop ? { crop } : undefined) : ''; } catch (err) { console.error(err); }
  if (!svg) svg = `<svg viewBox="0 0 400 600"><ellipse cx="200" cy="200" rx="80" ry="95" fill="${c.color || '#888'}" opacity=".5"/><path d="M60 600c10-170 90-230 140-230s130 60 140 230z" fill="${c.color || '#888'}" opacity=".5"/></svg>`;
  if (PORTRAIT_CACHE.size > 400) PORTRAIT_CACHE.clear();
  PORTRAIT_CACHE.set(key, svg);
  return svg;
}
function hubCharId() {
  const sim = P.sim; let id = sim.hubChar || '';
  if (id.startsWith('s:')) id = S.s[id.slice(2)] || Object.keys(P.chars)[0];
  if (sim.hubCharByAge) {
    const age = simAge();
    for (const [a, cid] of Object.entries(sim.hubCharByAge).sort((x, y) => +x[0] - +y[0])) if (age >= +a && P.chars[cid]) id = cid;
  }
  return id;
}

/* ---------------- background & particles ---------------- */
const BG_CACHE = new Map();
function bgURL(id) {
  if (BG_CACHE.has(id)) return BG_CACHE.get(id);
  let u = '';
  try { u = window.ART && ART.bg ? ART.bg(id) : ''; } catch (err) { console.error(err); }
  BG_CACHE.set(id, u);
  return u;
}
let bgFront = 'A';
function setBg(id, how) {
  const url = bgURL(id);
  const front = $('#bg' + bgFront), back = $('#bg' + (bgFront === 'A' ? 'B' : 'A'));
  const css = url ? `url("${url}")` : (window.ART?.bgGradient?.(id) || '#000');
  if (how === 'instant' || UIS.skip) {
    front.style.backgroundImage = css; front.style.opacity = 1; back.style.opacity = 0;
  } else {
    back.style.backgroundImage = css; back.style.opacity = 1; front.style.opacity = 0;
    bgFront = bgFront === 'A' ? 'B' : 'A';
  }
  if (how === 'flash') { const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  if (how === 'shake') { const s = $('#stage'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
}
const FX = { parts: [], raf: 0, kind: '' };
function startParticles(kind) {
  FX.kind = kind;
  const cv = $('#fx'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resize = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  resize();
  if (!FX.bound) { FX.bound = true; addEventListener('resize', resize); }
  const N = reduce ? 0 : kind === 'star' ? 34 : 26;
  FX.parts = Array.from({ length: N }, () => spawn(true));
  function spawn(any) {
    const w = cv.width, h = cv.height, d = devicePixelRatio;
    if (FX.kind === 'rofan') return { x: Math.random() * w, y: any ? Math.random() * h : -20, vx: (Math.random() * .6 + .2) * d, vy: (Math.random() * .6 + .45) * d, r: (Math.random() * 4 + 3) * d, a: Math.random() * 6, va: (Math.random() - .5) * .04, c: Math.random() < .5 ? '255,182,206' : '255,226,236' };
    if (FX.kind === 'raise') return { x: Math.random() * w, y: any ? Math.random() * h : h + 10, vx: (Math.random() - .5) * .3 * d, vy: -(Math.random() * .35 + .12) * d, r: (Math.random() * 2 + 1.2) * d, a: Math.random() * 6, va: .03, c: '255,236,170' };
    return { x: Math.random() * w, y: any ? Math.random() * h : h + 10, vx: (Math.random() - .5) * .2 * d, vy: -(Math.random() * .5 + .2) * d, r: (Math.random() * 2.2 + .8) * d, a: Math.random() * 6, va: .05, c: Math.random() < .5 ? '255,110,190' : '110,230,255' };
  }
  cancelAnimationFrame(FX.raf);
  const tick = () => {
    FX.raf = requestAnimationFrame(tick);
    if (document.hidden || $('#stage').hidden) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < FX.parts.length; i++) {
      const p = FX.parts[i];
      p.x += p.vx + Math.sin(p.a) * .3; p.y += p.vy; p.a += p.va;
      if (p.y > cv.height + 30 || p.y < -30 || p.x > cv.width + 30) { FX.parts[i] = spawn(false); continue; }
      ctx.save(); ctx.translate(p.x, p.y);
      if (FX.kind === 'rofan') {
        ctx.rotate(p.a); ctx.fillStyle = `rgba(${p.c},.75)`;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        const al = .35 + Math.sin(p.a) * .3;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 4);
        g.addColorStop(0, `rgba(${p.c},${al + .3})`); g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  };
  tick();
}

/* ---------------- stage rendering ---------------- */
const POS = { l: 22, c: 50, r: 78 };
function renderChars(speaker) {
  const box = $('#chars');
  const want = S.stage.chars;
  const narrow = innerWidth < 640;
  const pos = narrow ? { l: 26, c: 50, r: 74 } : POS;
  for (const node of [...box.children]) if (!want.find(c => c.id === node.dataset.id)) node.remove();
  for (const c of want) {
    let node = box.querySelector(`[data-id="${c.id}"]`);
    if (!node) { node = el('div', 'ch in'); node.dataset.id = c.id; box.appendChild(node); }
    if (node.dataset.e !== c.e) { node.innerHTML = portrait(c.id, c.e); node.dataset.e = c.e; }
    const x = want.length === 1 ? 50 : pos[c.at || 'c'];
    node.style.left = x + '%';
    node.style.zIndex = c.id === speaker ? 3 : 2;
    node.classList.toggle('dim', !!speaker && speaker !== c.id && want.length > 1);
    node.classList.toggle('talk', c.id === speaker);
  }
}
function showChar(id, e, at) {
  let c = S.stage.chars.find(x => x.id === id);
  if (!c) {
    const used = new Set(S.stage.chars.map(x => x.at));
    at = at || ['c', 'r', 'l'].find(p => !used.has(p)) || 'c';
    if (S.stage.chars.length >= 3) S.stage.chars.shift();
    c = { id, e: e || 'neutral', at };
    S.stage.chars.push(c);
  } else { if (e) c.e = e; if (at) c.at = at; }
  // two on stage both centered → spread them
  if (S.stage.chars.length === 2 && S.stage.chars[0].at === S.stage.chars[1].at) { S.stage.chars[0].at = 'l'; S.stage.chars[1].at = 'r'; }
}
function renderTop() {
  const top = $('#vn-top'); if (!top || S.mode !== 'vn') return;
  const hud = [];
  if (P.sim) {
    const d = simDate();
    hud.push(`<span class="hud"><b>${esc(dateLabel(d))}</b></span>`);
  }
  top.innerHTML = `<button class="ibtn" type="button" data-a="menu" aria-label="메뉴">${ic('menu')}</button>
    <button class="ibtn" type="button" data-a="log" aria-label="대사 기록">${ic('log')}</button>
    <span class="sp"></span>
    <div class="chip-hud">${hud.join('')}</div>
    <button class="ibtn" type="button" data-a="stats" aria-label="상태">${ic('stats')}</button>
    <button class="ibtn ${UIS.auto ? 'on' : ''}" type="button" data-a="auto" aria-label="자동 진행">${ic('auto')}</button>
    <button class="ibtn ${UIS.skip ? 'on' : ''}" type="button" data-a="skip" aria-label="빨리 넘기기">${ic('skip')}</button>`;
}
function dateLabel(d) {
  const sim = P.sim;
  let s = sim.yearLabel ? sim.yearLabel.replace('{y}', d.y).replace('{m}', d.m) : `${d.y}년차`;
  if (!sim.yearLabel || !sim.yearLabel.includes('{m}')) s += ` ${d.m}월`;
  if (d.w) s += ` ${d.w}주`;
  return s;
}
function toast(html) {
  const box = $('#toasts'); if (!box) return;
  while (box.children.length > 4) box.firstChild.remove();
  const t = el('div', 'toast', html); box.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

/* ---------------- waiting for the player ---------------- */
function waitAdvance() { return new Promise(r => { UIS.advance = r; }); }
function advance() {
  if (UIS.typing) { UIS.typing(); return; }
  const r = UIS.advance; UIS.advance = null; if (r) r();
}
async function typeLine(name, text, color) {
  const box = $('#box'); box.hidden = false;
  const np = $('#nameplate'), ln = $('#line'), more = $('#more');
  if (name) { np.hidden = false; np.textContent = name; np.style.background = color || ''; np.style.color = color ? '#1a0e14' : ''; }
  else np.hidden = true;
  ln.classList.toggle('narr', !name);
  more.hidden = true;
  const html = fmt(text);
  if (UIS.skip || PREF.speed === 0) { ln.innerHTML = html; }
  else {
    const chars = [...text];
    let n = 0, done = false;
    await new Promise(res => {
      UIS.typing = () => { done = true; };
      const step = () => {
        if (done || n >= chars.length) { ln.innerHTML = html; UIS.typing = null; res(); return; }
        n += 1; ln.innerHTML = fmt(chars.slice(0, n).join(''));
        setTimeout(step, PREF.speed);
      };
      step();
    });
  }
  more.hidden = false;
  if (UIS.skip) { await sleep(40); return; }
  if (UIS.auto) {
    const t = setTimeout(() => advance(), 900 + text.length * 45);
    await waitAdvance(); clearTimeout(t); return;
  }
  await waitAdvance();
}
const fmt = t => esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>');
function logLine(n, t) { S.log.push({ n, t }); if (S.log.length > 160) S.log.splice(0, S.log.length - 160); }

/* ---------------- interpreter ---------------- */
function resolve(p) {
  let a;
  if (p[0] === 'sc') a = P.scenes[p[1]];
  else if (p[0] === 'talk') a = P.chars[p[1]]?.talk?.[p[2]]?.lines;
  else return null;
  const start = p[0] === 'sc' ? 2 : 3;
  for (let k = start; k < p.length; k += 2) {
    const st = a?.[p[k]], key = p[k + 1];
    if (!st) return null;
    if (key === 'then' || key === 'else') a = st[key];
    else if (key[0] === 'c') a = st.choice?.[+key.slice(1)]?.then;
  }
  return a || null;
}
function startScene(id) {
  if (!P.scenes[id]) { console.warn('missing scene', id); return; }
  S.stack = [{ p: ['sc', id], i: 0 }];
  S.mode = 'vn';
}
async function run() {
  const token = RUN = {};
  showStage();
  while (S.stack.length) {
    if (RUN !== token) return 'stop';
    const f = S.stack[S.stack.length - 1];
    const a = resolve(f.p);
    if (!a || f.i >= a.length) {
      S.stack.pop();
      if (f.go) startScene(f.go);
      continue;
    }
    const idx = f.i++;
    const r = await exec(a[idx], f, idx, token);
    if (r === 'stop' || RUN !== token) return 'stop';
    if (r === 'ending') return 'ending';
  }
  return 'done';
}
async function exec(st, f, idx, token) {
  if (typeof st === 'string') st = { t: st };
  if (st.bg) { S.stage.bg = st.bg; setBg(st.bg, st.fx && typeof st.fx === 'string' ? st.fx : 'fade'); }
  if (st.hide) { S.stage.chars = st.hide === 'all' ? [] : S.stage.chars.filter(c => c.id !== st.hide); renderChars(); }
  if (st.show) { showChar(st.show, st.e, st.at); renderChars(); }
  if (st.title) { await chapterCard(st.title, st.sub); if (RUN !== token) return 'stop'; }
  if (st.fx && typeof st.fx === 'object') applyFx(st.fx);
  if (st.toast) toast(esc(interp(st.toast)));
  if (st.input) {
    const v = await askText(interp(st.label || '이름'), interp(st.def || ''));
    if (RUN !== token) return 'stop';
    S.s[st.input] = v || interp(st.def || '');
    PORTRAIT_CACHE.clear();
  }
  if (st.t != null && !st.choice) {
    const text = interp(st.t);
    let name = '', color = '';
    if (st.c === 'me') { name = S.s.name; color = ''; }
    else if (st.c) {
      showChar(st.c, st.e, st.at);
      name = st.as ? interp(st.as) : charShort(st.c);
      color = charDef(st.c)?.color || '';
    }
    renderChars(st.c && st.c !== 'me' ? st.c : null);
    logLine(name, text);
    save(true);
    await typeLine(name, text, color);
    if (RUN !== token) return 'stop';
  } else if (st.e && st.c && st.c !== 'me') { showChar(st.c, st.e, st.at); renderChars(); }
  if (st.if !== undefined && (st.then || st.else)) {
    const branch = cond(st.if) ? 'then' : 'else';
    if (st[branch]?.length) S.stack.push({ p: f.p.concat([idx, branch]), i: 0 });
    return;
  }
  if (st.choice) {
    const k = await choose(st, token);
    if (RUN !== token || k == null) return 'stop';
    const o = st.choice[k];
    logLine(S.s.name, '▸ ' + interp(o.t));
    if (o.fx) applyFx(o.fx);
    if (o.then?.length) S.stack.push({ p: f.p.concat([idx, 'c' + k]), i: 0, go: o.go });
    else if (o.go) startScene(o.go);
    save();
    return;
  }
  if (st.chat) {
    save(true);
    await chat(st.chat, interp(st.goal || ''), st.max || 4, token);
    if (RUN !== token) return 'stop';
    save();
  }
  if (st.call) { S.stack.push({ p: ['sc', st.call], i: 0 }); return; }
  if (st.go) { startScene(st.go); return; }
  if (st.ending) { await showEnding(st.ending); return 'ending'; }
  if (st.end) { S.stack = []; return; }
}
function chapterCard(t, sub) {
  return new Promise(res => {
    if (UIS.skip) return res();
    const c = el('div', '', `<b>${esc(interp(t))}</b>${sub ? `<h2>${esc(interp(sub))}</h2>` : ''}`);
    c.id = 'card'; $('#stage').appendChild(c);
    const done = () => { c.remove(); res(); };
    setTimeout(done, 2600);
  });
}
function choose(st, token) {
  return new Promise(res => {
    const box = $('#choices'); box.innerHTML = ''; box.hidden = false;
    UIS.skip = false; renderTop();
    if (st.prompt) box.appendChild(el('div', 'prompt', esc(interp(st.prompt))));
    st.choice.forEach((o, k) => {
      if (o.if && !cond(o.if)) return;
      const locked = o.req && !cond(o.req);
      const b = el('button', 'opt', `<span>${esc(interp(o.t))}</span>${locked ? `<small>${esc(interp(o.hint || reqHint(o.req)))}</small>` : ''}`);
      b.type = 'button'; b.style.animationDelay = (k * 60) + 'ms';
      if (locked) b.disabled = true;
      b.onclick = () => { box.hidden = true; box.innerHTML = ''; res(k); };
      box.appendChild(b);
    });
    if (!box.querySelector('.opt:not([disabled])')) { // nothing selectable: fall through with the first option
      const first = st.choice.findIndex(o => !o.if || cond(o.if));
      box.hidden = true; res(first < 0 ? null : first);
    }
    const iv = setInterval(() => { if (RUN !== token) { clearInterval(iv); box.hidden = true; res(null); } else if (box.hidden) clearInterval(iv); }, 400);
  });
}
function reqHint(c) {
  const parts = [];
  const all = [c, ...(c.all || [])];
  for (const x of all) if (x.age) parts.push(`나이 ${String(x.age).replace('>=', '').replace('>', '')}세${String(x.age).startsWith('<') ? ' 미만' : ' 이상'}`);
  for (const x of all.slice(1)) for (const [id, sp] of Object.entries(x.v || {})) parts.push(`${varName(id)} ${sp}`);
  for (const [id, sp] of Object.entries(c.v || {})) parts.push(`${varName(id)} ${sp}`);
  for (const [id, sp] of Object.entries(c.aff || {})) parts.push(`${charShort(id)} 호감 ${sp}`);
  return parts.length ? '필요: ' + parts.join(', ') : '조건이 부족합니다';
}

/* ---------------- screens ---------------- */
function showStage() {
  $('#title').hidden = true; $('#ending').hidden = true; $('#stage').hidden = false;
  document.body.dataset.genre = P.id;
  const hub = $('#hubl'); if (hub) hub.remove();
  $('#vn-top').hidden = false;
  S.mode = 'vn';
  setBg(S.stage.bg || 'black', 'instant');
  renderChars(); renderTop();
}
function closeSheet() { document.querySelectorAll('.sheet,.scrim').forEach(n => n.remove()); UIS.sheet = null; }
function sheet(title, bodyHTML, onMount) {
  closeSheet();
  const scrim = el('div', 'scrim'); scrim.onclick = closeSheet;
  const sh = el('section', 'sheet', `<header><h3>${esc(title)}</h3><button class="ibtn" type="button" data-a="close-sheet" aria-label="닫기">${ic('x')}</button></header><div class="body">${bodyHTML}</div>`);
  sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', title);
  $('#stage').append(scrim, sh);
  UIS.sheet = sh;
  onMount?.(sh);
  return sh;
}
function statsHTML() {
  const bars = (P.stats || []).map(s => {
    const v = S.v[s.id] ?? 0, max = s.max ?? 100;
    return `<div class="bar"><span>${esc(s.name)}</span><span class="t"><i style="width:${clamp(v / max * 100, 0, 100)}%;background:${s.color || 'var(--accent)'}"></i></span><b>${Math.round(v)}</b></div>`;
  }).join('');
  const hud = (P.sim?.hud || Object.keys(P.vars || {})).filter(k => !statDef(k)).map(k => `<div class="bar"><span>${esc(varName(k))}</span><span></span><b>${Math.round(S.v[k] ?? 0).toLocaleString()}</b></div>`).join('');
  const ids = Object.keys(P.chars).filter(id => (S.aff[id] ?? 0) > 0 || S.flags['met_' + id]);
  const affs = ids.sort((a, b) => S.aff[b] - S.aff[a]).map(id => `<div class="aff"><span class="face">${portrait(id, S.aff[id] >= 60 ? 'smile' : 'neutral', 'face')}</span><span class="n">${esc(charShort(id))}<small>${esc(charDef(id).role || '')}</small><span class="heart">♥ ${S.aff[id]}</span></span></div>`).join('');
  return `${P.sim ? `<div class="sub">${esc(dateLabel(simDate()))}${P.sim.ageStart != null ? ` · ${simAge()}세` : ''}</div>` : ''}
    <div class="bars">${bars}</div>${hud ? `<div class="bars">${hud}</div>` : ''}
    ${affs ? `<div class="sub">관계</div><div class="affs">${affs}</div>` : ''}`;
}
function openStats() { sheet('상태', statsHTML()); }
function openLog() {
  const html = S.log.slice(-80).map(l => `<div class="${l.n ? '' : 'n'}">${l.n ? `<b>${esc(l.n)}</b>` : ''}${fmt(l.t)}</div>`).join('') || '<p class="sub">아직 기록이 없습니다.</p>';
  const sh = sheet('대사 기록', `<div class="log">${html}</div>`);
  const body = sh.querySelector('.body'); body.scrollTop = body.scrollHeight;
}
function endingsHTML(pack) {
  const got = store.get('unmyeong-endings', {})[pack.id] || {};
  const all = Object.entries(pack.endings || {});
  return `<div class="sub">엔딩 ${Object.keys(got).filter(k => pack.endings[k]).length} / ${all.length}</div><div class="gal">${all.map(([id, e]) => got[id]
    ? `<div><small>${esc(e.rank || '')}</small>${esc(e.title)}</div>` : `<div class="lock"><small>${esc(e.rank || '')}</small>???</div>`).join('')}</div>`;
}
function openMenu() {
  sheet('메뉴', `
    <button class="ghost" type="button" data-a="title">타이틀로 (자동 저장됨)</button>
    <div class="sub">AI 대화</div>
    <p class="sub" style="letter-spacing:0">${aiStatus()}</p>
    <div class="tabs">
      <button class="tab ${PREF.tier === 'quick' ? 'on' : ''}" type="button" data-a="tier" data-v="quick">빠른 답장</button>
      <button class="tab ${PREF.tier === 'default' ? 'on' : ''}" type="button" data-a="tier" data-v="default">깊은 대화</button>
    </div>
    <div class="sub">글자 속도</div>
    <div class="tabs">
      ${[[45, '느리게'], [26, '보통'], [10, '빠르게'], [0, '즉시']].map(([v, n]) => `<button class="tab ${PREF.speed === v ? 'on' : ''}" type="button" data-a="speed" data-v="${v}">${n}</button>`).join('')}
    </div>
    ${endingsHTML(P)}`);
}
function aiStatus() {
  if (AI_OFF) return 'AI 대화를 쓸 수 없어 준비된 대화 주제로 진행합니다.';
  if (!SAMPLE) return 'AI 연결을 확인하는 중이거나 이 화면에서는 쓸 수 없습니다. 준비된 대화 주제로 진행합니다.';
  return '인물에게 자유롭게 말을 걸 수 있습니다. 첫 대화 때 Claude 사용 허락을 묻습니다.';
}

/* ---------------- free conversation ---------------- */
const AFF_STAGE = a => a >= 80 ? '깊이 사랑하거나 절대적으로 신뢰함' : a >= 60 ? '마음이 크게 기울어 설렘·신뢰' : a >= 40 ? '호감이 있음' : a >= 20 ? '아는 사이, 약간 경계' : '낯설거나 경계함';
function chatRules(id, goal) {
  const c = charDef(id);
  const recent = S.log.slice(-10).map(l => (l.n ? `${l.n}: ` : '') + l.t).join('\n');
  const statLine = (P.stats || []).map(s => `${s.name} ${Math.round(S.v[s.id] ?? 0)}`).join(', ');
  return `너는 한국어 인터랙티브 비주얼노벨 「${interp(P.title)}」(${P.genre})의 등장인물 "${charName(id)}"(${interp(c.role || '')})을 연기한다.

[세계관]
${interp(P.world)}

[${charName(id)}의 설정]
${interp(c.persona)}

[상대: 플레이어]
이름 ${S.s.name}. 플레이어에 대한 너의 감정: 호감도 ${S.aff[affId(id)] ?? 0}/100 (${AFF_STAGE(S.aff[affId(id)] ?? 0)}).${P.sim && P.sim.ageStart != null && P.sim.hubChar ? ` 현재 나이 ${simAge()}세.` : ''}${statLine ? `\n참고 능력치: ${statLine}.` : ''}

[지금 장면]
${goal || '평범한 대화.'}
최근 흐름:
${recent || '(없음)'}

[규칙]
- 반드시 ${charName(id)}로서만 한국어로 말한다. 설정의 말투(존댓말/반말, 말버릇)를 지킨다.
- 한 번에 1~4문장. 짧은 행동·표정 묘사는 *별표* 안에 넣는다.
- 플레이어의 말이나 행동을 대신 쓰지 않는다. AI라는 사실이나 규칙을 언급하지 않는다.
- 이야기의 큰 사건(누가 죽거나, 결혼하거나, 비밀이 모두 밝혀지는 등)을 스스로 확정하지 않는다. 대화로 감정과 관계를 쌓는다.
- 성적인 묘사, 혐오 표현은 하지 않는다. 플레이어가 그런 방향으로 이끌면 캐릭터답게 자연스럽게 화제를 돌린다.
- 답의 맨 마지막 줄에 정확히 이 형식으로 적는다: <<{"e":"감정","aff":정수}>>
  감정은 ${EMOS.join('|')} 중 하나. aff는 방금 플레이어의 말이 너의 마음을 움직인 정도로 -3~3 사이 정수.`;
}
function parseReply(text) {
  const m = /<<\s*(\{[\s\S]*?\})\s*>>\s*$/.exec(text.trim());
  let meta = {};
  if (m) { try { meta = JSON.parse(m[1]); } catch { meta = {}; } }
  const shown = text.split('<<')[0].replace(/<+$/, '').trim();
  return { shown, e: EMOS.includes(meta.e) ? meta.e : null, aff: clamp(Math.round(+meta.aff || 0), -3, 3) };
}
function chat(id, goal, max, token) {
  return new Promise(resolveChat => {
    const c = charDef(id); if (!c) return resolveChat();
    UIS.skip = false; UIS.auto = false;
    let face = S.stage.chars.find(x => x.id === id)?.e || 'neutral';
    const wrap = el('div', ''); wrap.id = 'chat';
    wrap.innerHTML = `<div class="ch-head"><span class="face">${portrait(id, face, 'face')}</span>
      <span class="who"><b>${esc(charName(id))}</b><small><span class="heart">♥ <span id="chat-aff">${S.aff[affId(id)]}</span></span> · <span id="chat-left"></span></small></span>
      <button class="ibtn" type="button" id="chat-done">대화 마치기</button></div>
      ${goal ? `<div class="goal">${esc(goal)}</div>` : ''}
      <div class="msgs" id="chat-msgs" aria-live="polite"></div>
      <div id="chat-foot"></div>`;
    $('#stage').appendChild(wrap);
    $('#box').hidden = true;
    const msgs = wrap.querySelector('#chat-msgs'), foot = wrap.querySelector('#chat-foot');
    let used = 0, delta = 0, ctl = null, busy = false;
    const history = (S.chats[id] = S.chats[id] || []);
    // show the tail of earlier conversations for continuity
    history.slice(-4).forEach(h => addMsg(h.role === 'user' ? 'me' : 'them', h.content, true));
    if (history.length) addMsg('sys', '— 지난 대화 —');
    const left = () => { wrap.querySelector('#chat-left').textContent = `남은 대화 ${Math.max(0, max - used)}회`; };
    left();
    function addMsg(who, text, old) {
      const m = el('div', 'msg ' + who); if (old) m.style.opacity = .6;
      m.innerHTML = who === 'sys' ? esc(text) : fmt(text).replace(/<em>/g, '<span class="act">').replace(/<\/em>/g, '</span>');
      msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; return m;
    }
    function setFace(e) {
      face = e; wrap.querySelector('.face').innerHTML = portrait(id, e, 'face');
      if (S.stage.chars.find(x => x.id === id)) { showChar(id, e); renderChars(id); }
    }
    function finish() {
      ctl?.abort(); wrap.remove();
      if (history.length > 24) history.splice(0, history.length - 24);
      resolveChat();
    }
    wrap.querySelector('#chat-done').onclick = finish;
    const iv = setInterval(() => { if (token && RUN !== token) { clearInterval(iv); finish(); } }, 500);

    function topicsMode(note) {
      if (note) addMsg('sys', note);
      const topics = (c.talk || []).map((t, k) => ({ t, k })).filter(({ t }) => !t.if || cond(t.if));
      const fresh = topics.filter(({ k }) => !S.used[id + ':' + k]);
      const list = (fresh.length ? fresh : topics).slice(0, 4);
      foot.innerHTML = '';
      const box = el('div', 'topics');
      if (used >= max || !list.length) {
        const b = el('button', 'cta', '계속'); b.type = 'button'; b.onclick = finish; box.appendChild(b);
        foot.appendChild(box); return;
      }
      list.forEach(({ t, k }) => {
        const b = el('button', 'opt', `<span>${esc(interp(t.t))}</span>`); b.type = 'button';
        b.onclick = async () => {
          used++; left(); S.used[id + ':' + k] = 1;
          addMsg('me', interp(t.t));
          foot.innerHTML = '';
          for (const ln of t.lines || []) {
            const x = typeof ln === 'string' ? { t: ln } : ln;
            await sleep(420);
            if (x.e && (x.c || id) === id) setFace(x.e);
            addMsg(x.c === 'me' ? 'me' : x.c && x.c !== id ? 'sys' : 'them', (x.c && x.c !== id && x.c !== 'me' ? charShort(x.c) + ': ' : '') + interp(x.t));
          }
          if (t.fx) { applyFx(t.fx); wrap.querySelector('#chat-aff').textContent = S.aff[affId(id)]; }
          topicsMode();
        };
        box.appendChild(b);
      });
      foot.appendChild(box);
    }

    function aiMode() {
      foot.innerHTML = '';
      const chips = (c.talk || []).filter(t => !t.if || cond(t.if)).slice(0, 5);
      if (chips.length) {
        const q = el('div', 'quick');
        chips.forEach(t => { const b = el('button', '', esc(interp(t.t))); b.type = 'button'; b.onclick = () => { inp.value = interp(t.t); inp.focus(); }; q.appendChild(b); });
        foot.appendChild(q);
      }
      const form = el('form', '', `<input id="chat-input" autocomplete="off" maxlength="300" placeholder="${esc(charShort(id))}에게 말하기…"><button type="submit">보내기</button>`);
      foot.appendChild(form);
      const inp = form.querySelector('input'), btn = form.querySelector('button');
      setTimeout(() => inp.focus(), 50);
      form.onsubmit = async ev => {
        ev.preventDefault();
        const text = inp.value.trim();
        if (!text || busy) return;
        if (used >= max) return;
        busy = true; btn.disabled = true; inp.value = '';
        used++; left();
        addMsg('me', text);
        history.push({ role: 'user', content: text });
        const bubble = addMsg('them', ''); bubble.classList.add('think'); bubble.innerHTML = '<i></i><i></i><i></i>';
        ctl = new AbortController();
        const turns = [{ role: 'user', content: chatRules(id, goal) }, { role: 'assistant', content: '알겠어. 지금부터 그 인물로만 말할게.' }];
        for (const h of history.slice(-12)) turns.push({ role: h.role, content: h.content });
        try {
          const res = await SAMPLE(turns, {
            cache: false, signal: ctl.signal, modelTier: PREF.tier,
            onText: ({ text: t }) => { bubble.classList.remove('think'); bubble.innerHTML = fmt(parseReply(t).shown).replace(/<em>/g, '<span class="act">').replace(/<\/em>/g, '</span>'); msgs.scrollTop = msgs.scrollHeight; },
          });
          const r = parseReply(res.text);
          bubble.classList.remove('think');
          bubble.innerHTML = fmt(r.shown || '…').replace(/<em>/g, '<span class="act">').replace(/<\/em>/g, '</span>');
          history.push({ role: 'assistant', content: r.shown || '…' });
          logLine(S.s.name, text); logLine(charShort(id), r.shown);
          if (r.e) setFace(r.e);
          const d = clamp(r.aff, -8 - delta, 8 - delta);
          if (d) { delta += d; applyFx({ aff: { [affId(id)]: d } }); wrap.querySelector('#chat-aff').textContent = S.aff[affId(id)]; }
          save();
        } catch (e) {
          history.pop();
          const code = e?.code;
          if (code === 'cancelled') return;
          bubble.classList.remove('think');
          if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) {
            AI_OFF = true; bubble.remove(); used--; topicsMode('AI 대화를 쓸 수 없어 준비된 주제로 이어갑니다.'); busy = false; return;
          }
          used--; left();
          bubble.textContent = e?.text || '';
          addMsg('sys', code === 'rate_limited' ? '잠시 후 다시 말을 걸어 주세요. (사용량 제한)' : code === 'refused' ? '그 말에는 대답하지 않았다. 다른 이야기를 해 보세요.' : '답을 받지 못했습니다. 다시 보내 보세요.');
          if (!e?.text) bubble.remove();
        } finally {
          busy = false; btn.disabled = false;
        }
        if (used >= max) {
          addMsg('sys', '대화가 자연스럽게 마무리되었다.');
          foot.innerHTML = '';
          const b = el('button', 'cta', '계속'); b.type = 'button'; b.onclick = finish;
          const box = el('div', 'topics'); box.appendChild(b); foot.appendChild(box);
        } else inp.focus();
      };
    }
    if (SAMPLE && !AI_OFF) aiMode(); else topicsMode();
  });
}

/* ---------------- endings ---------------- */
function pickAutoEnding() {
  for (const r of P.endingRules || []) if (P.endings[r.id] && cond(r.if)) return r.id;
  return Object.keys(P.endings)[0];
}
function showEnding(id) {
  if (id === 'auto') id = pickAutoEnding();
  const e = P.endings[id]; if (!e) return;
  const got = store.get('unmyeong-endings', {}); (got[P.id] = got[P.id] || {})[id] = Date.now(); store.set('unmyeong-endings', got);
  store.del(saveKey(P.id));
  RUN = {};
  closeSheet();
  const scr = $('#ending'); scr.hidden = false; $('#stage').hidden = true;
  const total = Object.keys(P.endings).length, have = Object.keys(got[P.id]).filter(k => P.endings[k]).length;
  scr.innerHTML = `<div class="eb" style="background-image:url('${bgURL(e.bg || S.stage.bg || 'black')}')"></div>
    ${e.c && P.chars[e.c] ? `<div class="ec">${portrait(e.c, e.e || 'smile')}</div>` : ''}
    <div class="et"><div class="card2">
      <span class="rank">ENDING · ${esc(e.rank || '')}</span>
      <h2>${esc(interp(e.title))}</h2>
      <p>${esc(interp(e.t)).replace(/\n/g, '<br>')}</p>
      <span class="sub">수집한 엔딩 ${have} / ${total}</span>
      <div class="row2"><button class="ghost" type="button" data-a="title">타이틀로</button><button class="cta" type="button" data-a="again">다시 시작</button></div>
    </div></div>`;
}

/* ---------------- sim: hub, planner, month ---------------- */
function showHub() {
  S.mode = 'hub';
  save();
  RUN = {};
  const st = $('#stage'); st.hidden = false; $('#title').hidden = true; $('#ending').hidden = true;
  $('#box').hidden = true; $('#choices').hidden = true; $('#chars').innerHTML = ''; $('#vn-top').hidden = true;
  document.body.dataset.genre = P.id;
  const sim = P.sim, id = hubCharId();
  const night = sim.hubBgNight && (S.turn % 3 === 2);
  const bg = night ? sim.hubBgNight : (sim.hubBg || 'black');
  setBg(bg, 'instant'); S.stage.bg = bg; S.stage.chars = [];
  const old = $('#hubl'); if (old) old.remove();
  const hub = el('div', ''); hub.id = 'hubl';
  const d = simDate();
  const hud = (sim.hud || []).map(k => {
    const v = S.v[k] ?? 0; const warn = (k === 'stress' && v >= 70) || (k === sim.money && v < 0);
    return `<span class="hud ${warn ? 'warn' : ''}"><span class="k">${esc(varName(k))}</span><b>${Math.round(v).toLocaleString()}</b></span>`;
  }).join('');
  const stress = S.v.stress ?? 0;
  const mood = stress >= 80 ? 'tired' : stress >= 55 ? 'worried' : (S.aff[affId(id)] ?? 0) >= 60 ? 'smile' : 'neutral';
  const remain = sim.turns - S.turn;
  const chatDone = S.hubChatTurn === S.turn;
  hub.innerHTML = `
    <div class="topbar">
      <button class="ibtn" type="button" data-a="menu" aria-label="메뉴">${ic('menu')}</button>
      <span class="date"><b>${esc(dateLabel(d))}</b><small>${sim.ageStart != null ? `${esc(charShort(id))} ${simAge()}세 · ` : ''}남은 ${remain}${sim.unit === 'week' ? '주' : '달'}</small></span>
      <span class="sp"></span><div class="chip-hud">${hud}</div>
    </div>
    ${stress >= 70 ? `<div class="bubble">${esc(charShort(id))}의 얼굴에 피로가 가득하다. 쉬게 해 주는 게 좋겠다.</div>` : ''}
    <div class="hubchar" data-a="chat" role="button" tabindex="0" aria-label="${esc(charShort(id))}와 대화">${portrait(id, mood)}</div>
    <nav class="dock">
      <button class="dbtn" type="button" data-a="chat" ${chatDone ? 'aria-disabled="true" style="opacity:.55"' : ''}>${ic('chat')}대화</button>
      <button class="dbtn" type="button" data-a="stats">${ic('stats')}상태</button>
      ${sim.shop?.length ? `<button class="dbtn" type="button" data-a="shop">${ic('shop')}상점</button>` : `<button class="dbtn" type="button" data-a="log">${ic('log')}기록</button>`}
      <button class="dbtn" type="button" data-a="endings">${ic('heart')}엔딩</button>
      <button class="dbtn go" type="button" data-a="plan">일정 짜기<small>${esc(dateLabel(d))}</small></button>
    </nav>`;
  st.appendChild(hub);
}
function hubChat() {
  if (S.hubChatTurn === S.turn) { toast(`이번 ${P.sim.unit === 'week' ? '주' : '달'}에는 이미 이야기를 나눴다.`); return; }
  const id = hubCharId();
  S.hubChatTurn = S.turn;
  S.stage.chars = [];
  chat(id, `일상 대화. ${dateLabel(simDate())}, 요즘 근황과 고민을 나눈다.`, 3, null).then(() => { save(); showHub(); });
}
function openShop() {
  const items = P.sim.shop || [];
  const money = S.v[P.sim.money || 'money'] ?? 0;
  sheet('상점', `<div class="sub">보유 ${Math.round(money).toLocaleString()}</div><div class="acts">${items.map((it, k) => {
    const sold = it.once && S.bought[it.id];
    const can = !sold && money >= it.price && (!it.req || cond(it.req));
    return `<button class="actc" type="button" data-a="buy" data-k="${k}" ${can ? '' : 'disabled'}><span class="h"><b>${esc(it.name)}</b><span>${sold ? '구입함' : it.price.toLocaleString()}</span></span><p>${esc(interp(it.desc || ''))}</p>${fxChips(it.fx)}</button>`;
  }).join('')}</div>`);
}
function buy(k) {
  const it = P.sim.shop[k]; const mk = P.sim.money || 'money';
  if ((S.v[mk] ?? 0) < it.price) return;
  S.v[mk] -= it.price; if (it.once) S.bought[it.id] = 1;
  applyFx(it.fx, true); toast(`${esc(it.name)} 구입`);
  showHub(); openShop();
}
function fxChips(fx) {
  if (!fx) return '';
  const out = [];
  for (const [id, d] of Object.entries(fx.v || {})) out.push(`<span class="${(id === 'stress' ? d < 0 : d > 0) ? 'up' : 'dn'}">${esc(varName(id))} ${d > 0 ? '+' : ''}${d}</span>`);
  for (const [id, d] of Object.entries(fx.aff || {})) out.push(`<span class="${d > 0 ? 'up' : 'dn'}">♥ ${esc(charShort(id))} ${d > 0 ? '+' : ''}${d}</span>`);
  return out.length ? `<span class="fxs">${out.join('')}</span>` : '';
}
const PLAN = { slots: [], cat: null, cur: 0 };
function openPlanner() {
  const sim = P.sim;
  if (PLAN.slots.length !== sim.slots) { PLAN.slots = Array(sim.slots).fill(null); PLAN.cur = 0; }
  const cats = [...new Set(sim.activities.map(a => a.cat))];
  if (!PLAN.cat || !cats.includes(PLAN.cat)) PLAN.cat = cats[0];
  const mk = sim.money || 'money';
  const cost = PLAN.slots.reduce((n, id) => n + (id ? (sim.activities.find(a => a.id === id).cost || 0) : 0), 0);
  const money = S.v[mk] ?? 0;
  const names = sim.slotNames || Array.from({ length: sim.slots }, (_, i) => `${i + 1}`);
  const acts = sim.activities.filter(a => a.cat === PLAN.cat);
  const ready = PLAN.slots.every(Boolean);
  const broke = money - cost < 0;
  sheet(`${dateLabel(simDate())} 일정`, `
    <div class="slots">${PLAN.slots.map((id, i) => {
      const a = id && sim.activities.find(x => x.id === id);
      return `<button class="slot ${a ? 'f' : ''} ${i === PLAN.cur ? 'cur' : ''}" type="button" data-a="slot" data-k="${i}"><small>${esc(names[i])}</small>${a ? esc(a.name) : '비어 있음'}</button>`;
    }).join('')}</div>
    <div class="sub">예상 비용 ${cost >= 0 ? '−' : '+'}${Math.abs(cost).toLocaleString()} · 보유 ${Math.round(money).toLocaleString()}</div>
    <div class="tabs">${cats.map(c => `<button class="tab ${c === PLAN.cat ? 'on' : ''}" type="button" data-a="cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="acts">${acts.map(a => {
      const ok = !a.req || cond(a.req);
      const c = a.cost || 0;
      return `<button class="actc" type="button" data-a="pick" data-v="${esc(a.id)}" ${ok ? '' : 'disabled'}>
        <span class="h"><b>${esc(a.name)}</b><span>${c > 0 ? '−' + c.toLocaleString() : c < 0 ? '+' + (-c).toLocaleString() : '무료'}</span></span>
        <p>${ok ? esc(interp(a.desc || '')) : esc(interp(a.hint || reqHint(a.req)))}</p>${fxChips(a.fx)}</button>`;
    }).join('')}</div>
    <button class="cta" type="button" data-a="run-plan" ${ready && !broke ? '' : 'disabled'}>${broke ? '돈이 부족합니다' : ready ? '이대로 진행' : `${PLAN.slots.filter(x => !x).length}칸을 더 채우세요`}</button>`,
  sh => { const b = sh.querySelector('.body'); b.scrollTop = PLAN.scroll || 0; b.onscroll = () => { PLAN.scroll = b.scrollTop; }; });
}
async function runPlan() {
  const sim = P.sim, token = RUN = {};
  closeSheet();
  const hub = $('#hubl'); if (hub) hub.querySelector('.dock').style.visibility = 'hidden';
  const names = sim.slotNames || [];
  const mk = sim.money || 'money';
  const layer = el('div', ''); layer.id = 'play'; $('#stage').appendChild(layer);
  let skip = false;
  layer.onclick = () => { skip = true; };
  for (let i = 0; i < PLAN.slots.length; i++) {
    if (RUN !== token) return;
    const a = sim.activities.find(x => x.id === PLAN.slots[i]);
    layer.innerHTML = `<div class="pc"><span class="sub">${esc(names[i] || '')}</span><h4>${esc(a.name)}</h4><div class="res">${esc(interp(rnd(a.lines || [a.desc || '…'])))}</div><div class="prog"><i></i></div><div class="fx-out"></div></div>`;
    requestAnimationFrame(() => { const bar = layer.querySelector('.prog i'); if (bar) bar.style.width = '100%'; });
    await sleep(skip ? 120 : 1150);
    const stress = S.v.stress ?? 0;
    const failP = (a.fail?.chance ?? 0) + stress / 250;
    const greatP = a.great?.chance ?? 0;
    const roll = Math.random();
    let tag = '', text = '';
    if (a.cost) setVar(mk, (S.v[mk] ?? 0) - a.cost);
    let notes;
    if (roll < failP) {
      tag = '<span class="tag fail">실패</span>';
      if (a.fail) { notes = applyFx(a.fail.fx, true); text = a.fail.t || ''; }
      else {
        const half = { v: {} };
        for (const [k, d] of Object.entries(a.fx.v || {})) half.v[k] = k === 'stress' ? d : d > 0 ? Math.floor(d / 2) : d;
        notes = applyFx(Object.assign({}, a.fx, half), true); text = '집중하지 못해 성과가 절반에 그쳤다.';
      }
    } else {
      notes = applyFx(a.fx, true);
      if (roll > 1 - greatP) { tag = '<span class="tag great">대성공</span>'; notes = notes.concat(applyFx(a.great.fx, true)); text = a.great.t || ''; }
    }
    if (a.cost) notes.unshift({ k: varName(mk), d: -a.cost, bad: a.cost > 0 });
    const out = layer.querySelector('.fx-out');
    if (out) out.innerHTML = `${tag} ${text ? `<p style="margin:6px 0 0">${esc(interp(text))}</p>` : ''}<div class="fxs" style="margin-top:6px">${notes.map(n => `<span>${fxNote(n)}</span>`).join('')}</div>`;
    await sleep(skip ? 250 : 1300);
  }
  layer.remove();
  if (RUN !== token) return;
  if (sim.turnFx) applyFx(sim.turnFx, true);
  PLAN.slots = [];
  S.queue = ['@end', '@advance', '@start'];
  flow();
}
function pickEvent(at) {
  const evs = (P.sim.events || []).filter(ev => (ev.at || 'end') === at && !(ev.once !== false && S.evFired[ev.id]) && cond(ev.if));
  evs.sort((a, b) => (b.prio || 0) - (a.prio || 0));
  const ev = evs[0]; if (!ev) return null;
  S.evFired[ev.id] = (S.evFired[ev.id] || 0) + 1;
  return ev;
}
async function flow() {
  for (;;) {
    if (S.stack.length) {
      const r = await run();
      if (r === 'ending' || r === 'stop') return;
      S.stage.chars = [];
      continue;
    }
    if (!S.queue.length) break;
    const q = S.queue.shift();
    if (q === '@end' || q === '@start') { const ev = pickEvent(q.slice(1)); if (ev) startScene(ev.scene); }
    else if (q === '@advance') {
      S.turn++;
      if (S.turn >= P.sim.turns) { S.queue = ['@final']; startScene(P.sim.finale); }
    } else if (q === '@final') { await showEnding('auto'); return; }
    save();
  }
  if (!P.sim) { await showEnding('auto'); return; }
  showHub();
}

/* ---------------- modal helpers ---------------- */
function askText(label, def) {
  return new Promise(res => {
    const m = $('#modal'), card = $('#modal-card');
    card.innerHTML = `<h3>${esc(label)}</h3><input id="ask-input" maxlength="12" value="${esc(def)}" aria-label="${esc(label)}"><button class="cta" type="button" id="ask-ok">확인</button>`;
    m.hidden = false;
    const inp = card.querySelector('input'); setTimeout(() => { inp.focus(); inp.select(); }, 30);
    const ok = () => { m.hidden = true; res(inp.value.trim().slice(0, 12) || def); };
    card.querySelector('#ask-ok').onclick = ok;
    inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}
function modal(html) { const m = $('#modal'); $('#modal-card').innerHTML = html; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; }

/* ---------------- title ---------------- */
const WAR_URL = 'https://claude.ai/artifact/KH8CkrabZAM1cBs4kyLNa7';
function showTitle() {
  RUN = {}; closeSheet(); closeModal();
  delete document.body.dataset.genre;
  $('#stage').hidden = true; $('#ending').hidden = true; $('#title').hidden = false;
  const bills = $('#bills'); bills.innerHTML = '';
  for (const id of STORY.order) {
    const p = STORY.packs[id];
    const sv = store.get(saveKey(id), null);
    const got = Object.keys(store.get('unmyeong-endings', {})[id] || {}).length;
    const b = el('button', 'bill');
    b.type = 'button'; b.dataset.g = id; b.dataset.a = 'open-pack'; b.dataset.v = id;
    const bg = bgURL(p.cover?.bg || 'black');
    if (bg) b.style.backgroundImage = `url("${bg}")`;
    const cover = p.cover?.c && p.chars[p.cover.c];
    const prevP = P; P = p; const art = cover ? portrait(p.cover.c, p.cover.e || 'smile') : ''; P = prevP;
    b.innerHTML = `<span class="art">${art}</span><span class="txt"><span class="g">${esc(p.genre)}</span><h2>${esc(p.title)}</h2><p>${esc(p.blurb)}</p>
      <span class="meta"><span>엔딩 ${got}/${Object.keys(p.endings).length}</span>${sv ? '<span>이어하기 가능</span>' : ''}${p.sim ? `<span>${p.sim.turns}${p.sim.unit === 'week' ? '주' : '개월'} 육성</span>` : '<span>분기형 스토리</span>'}</span></span>`;
    bills.appendChild(b);
  }
  const war = el('a', 'bill war', `<span class="art">WAR</span><span class="txt"><span class="g">전략 시뮬레이션</span><h2>한반도 대전략</h2><p>독재자가 되어 세계를 상대로 전쟁을 벌이는 턴제 전략 게임. 별도 페이지에서 열립니다.</p><span class="meta"><span>새 탭</span></span></span>`);
  war.href = WAR_URL; war.target = '_blank'; war.rel = 'noopener';
  bills.appendChild(war);
  $('#foot').textContent = SAMPLE ? '인물과의 대화는 Claude가 그 인물이 되어 답합니다. 첫 대화 때 사용 허락을 묻습니다.' : '대화 장면에서는 준비된 대화 주제를 고릅니다.';
}
function openPack(id) {
  const p = STORY.packs[id]; const sv = store.get(saveKey(id), null);
  const prevP = P; P = p;
  modal(`<h3>${esc(p.title)}</h3><p>${esc(p.subtitle || p.blurb)}</p>
    ${sv ? `<button class="cta" type="button" data-a="continue" data-v="${id}">이어하기</button>` : ''}
    <button class="${sv ? 'ghost' : 'cta'}" type="button" data-a="new" data-v="${id}">${sv ? '처음부터 (저장 덮어쓰기)' : '시작하기'}</button>
    ${endingsHTML(p)}
    <button class="ghost" type="button" data-a="close-modal">닫기</button>`);
  P = prevP;
}
async function newGame(id) {
  P = STORY.packs[id];
  closeModal();
  document.body.dataset.genre = id;
  const name = await askText(P.player?.label || '당신의 이름', P.player?.def || '나');
  S = newState(P, name);
  PORTRAIT_CACHE.clear();
  startParticles(id);
  $('#box').hidden = true;
  startScene(P.start);
  S.queue = [];
  save();
  flow();
}
function continueGame(id) {
  P = STORY.packs[id];
  const sv = store.get(saveKey(id), null); if (!sv) return newGame(id);
  closeModal();
  S = sv; S.queue = S.queue || [];
  PORTRAIT_CACHE.clear();
  startParticles(id);
  if (S.mode === 'hub' && !S.stack.length && !S.queue.length) { showHub(); return; }
  flow();
}

/* ---------------- input wiring ---------------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (!t) {
    if (e.target.closest('#box-inner')) advance();
    return;
  }
  const a = t.dataset.a, v = t.dataset.v;
  switch (a) {
    case 'open-pack': openPack(v); break;
    case 'new': newGame(v); break;
    case 'continue': continueGame(v); break;
    case 'close-modal': closeModal(); break;
    case 'close-sheet': closeSheet(); break;
    case 'menu': openMenu(); break;
    case 'log': openLog(); break;
    case 'stats': openStats(); break;
    case 'endings': sheet('엔딩 수집', endingsHTML(P)); break;
    case 'auto': UIS.auto = !UIS.auto; UIS.skip = false; renderTop(); if (UIS.auto && !UIS.typing) advance(); break;
    case 'skip': UIS.skip = !UIS.skip; UIS.auto = false; renderTop(); if (UIS.skip) advance(); break;
    case 'title': if (S) save(S.mode === 'vn'); showTitle(); break;
    case 'again': newGame(P.id); break;
    case 'tier': PREF.tier = v; store.set('unmyeong-pref', PREF); openMenu(); break;
    case 'speed': PREF.speed = +v; store.set('unmyeong-pref', PREF); openMenu(); break;
    case 'chat': hubChat(); break;
    case 'shop': openShop(); break;
    case 'buy': buy(+t.dataset.k); break;
    case 'plan': openPlanner(); break;
    case 'slot': { const k = +t.dataset.k; if (PLAN.slots[k]) PLAN.slots[k] = null; PLAN.cur = k; openPlanner(); break; }
    case 'cat': PLAN.cat = v; PLAN.scroll = 0; openPlanner(); break;
    case 'pick': {
      PLAN.slots[PLAN.cur] = v;
      const next = PLAN.slots.findIndex(x => !x); PLAN.cur = next < 0 ? PLAN.cur : next;
      openPlanner(); break;
    }
    case 'run-plan': runPlan(); break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (UIS.sheet) closeSheet(); else if (!$('#modal').hidden) closeModal(); return; }
  if ($('#stage').hidden || UIS.sheet || !$('#modal').hidden || $('#chat')) return;
  if ((e.key === ' ' || e.key === 'Enter') && !$('#box').hidden && $('#choices').hidden) { e.preventDefault(); advance(); }
});

/* ---------------- boot ---------------- */
function boot() {
  if (window.claude?.use) {
    window.claude.use('sample').then(fn => { SAMPLE = fn || null; if (!$('#title').hidden) $('#foot').textContent = SAMPLE ? '인물과의 대화는 Claude가 그 인물이 되어 답합니다. 첫 대화 때 사용 허락을 묻습니다.' : '대화 장면에서는 준비된 대화 주제를 고릅니다.'; }).catch(() => { SAMPLE = null; });
  }
  showTitle();
}
