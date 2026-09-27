/* 운명극장 — story / sim engine. Format: SPEC.md. */
'use strict';

const STORY = {
  packs: {}, order: [],
  register(p) {
    if (!p || !p.id) { console.warn('STORY.register: pack without id'); return; }
    this.packs[p.id] = p; if (!this.order.includes(p.id)) this.order.push(p.id);
  },
};

const EMOS = ['neutral', 'smile', 'laugh', 'sad', 'cry', 'angry', 'surprised', 'shy', 'smirk', 'cold', 'worried', 'tired'];
const EMO_KO = { neutral: '평온', smile: '미소', laugh: '웃음', sad: '슬픔', cry: '눈물', angry: '분노', surprised: '놀람', shy: '수줍음', smirk: '능청', cold: '냉담', worried: '걱정', tired: '지침' };
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = a => a[Math.floor(Math.random() * a.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
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
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  flow: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 7v10M6 12c0-3 4-5 10-0"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5M12 17h.01"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
  hand: '<path d="M9 11V5a1.5 1.5 0 013 0v5M12 10V4a1.5 1.5 0 013 0v6M15 10V6a1.5 1.5 0 013 0v7c0 4-2.5 7-6 7s-5-2-7-5l-1.5-2.5a1.4 1.4 0 012.3-1.6L9 13"/>',
  down: '<path d="M12 4v14M6 12l6 6 6-6"/>',
};
const ic = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ''}</svg>`;
const HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z"/></svg>';

/* ---------------- genres / themes ---------------- */
const THEMES = ['rofan', 'raise', 'star', 'murim', 'school', 'office', 'joseon', 'academy', 'apoc', 'night'];
function themeOf(p) {
  if (!p) return 'rofan';
  if (THEMES.includes(p.theme)) return p.theme;
  if (THEMES.includes(p.id)) return p.id;
  const g = `${p.genre || ''} ${p.title || ''}`;
  const rules = [[/무협|강호|무림/, 'murim'], [/아이돌|배우|연예/, 'star'], [/조선|사극|궁중|왕세자/, 'joseon'], [/아카데미|마법/, 'academy'],
    [/아포칼립스|좀비|생존|종말/, 'apoc'], [/뱀파이어|고딕|괴담|호러|밤의/, 'night'], [/회사|오피스|직장/, 'office'], [/학교|학원|청춘|고교/, 'school'], [/육성|키우/, 'raise']];
  for (const [re, t] of rules) if (re.test(g)) return t;
  return p.sim ? 'raise' : 'rofan';
}
const FILTERS = ['전체', '미연시', '육성', '무협·판타지', '전략'];
const DATING_IDS = ['school', 'office', 'joseon', 'academy', 'apoc', 'night', 'rofan'];
function packTags(p) {
  // explicit tags are free-form ('미연시', '로맨스 판타지', …): fold them and the genre into the title-screen filter buckets
  const raw = Array.isArray(p.tags) ? p.tags.map(String) : [];
  const t = new Set(raw.filter(x => FILTERS.includes(x)));
  const g = `${p.genre || ''} ${raw.join(' ')}`;
  if (/육성|키우|매니지|시뮬/.test(g) || p.sim) t.add('육성');
  if (/로맨스|연애|미연시|로판|러브|순정|dating/i.test(g) || (!raw.length && DATING_IDS.includes(p.id))) t.add('미연시');
  if (/무협|판타지|마법|이세계|아카데미|fantasy/i.test(g) || (!raw.length && ['rofan', 'murim', 'academy'].includes(p.id))) t.add('무협·판타지');
  if (/전략|경영|전쟁|strategy/i.test(g)) t.add('전략');
  if (!t.size) t.add('미연시');
  return [...t];
}

/* ---------------- state ---------------- */
let P = null;          // active pack
let S = null;          // run state (serialisable)
let RUN = null;        // run token
let SAMPLE = null;     // Claude sampling fn (null when unavailable)
let AI_OFF = false;    // set once the viewer declines or sampling is disabled
const PREF = Object.assign({ speed: 26, tier: 'quick', size: 'n' }, store.get('unmyeong-pref', {}));
const HOOK = {};   // filled by js/extras.js (audio, blink, slots, profiles)
const UIS = { auto: false, skip: false, typing: null, advance: null, sheet: null };
let REPLAY_NOFX = false;   // the first step after loading a mid-line save must not re-apply its effects

function newState(pack, name) {
  const st = {
    ver: 2, pack: pack.id, s: { name }, v: {}, aff: {}, flags: {}, turn: 0,
    stack: [], queue: [], stage: { bg: 'black', chars: [] }, log: [], mode: 'vn', chapters: [],
    used: {}, chats: {}, evFired: {}, hubChatTurn: -1, bought: {}, started: Date.now(),
  };
  for (const s of pack.stats || []) st.v[s.id] = 0;
  Object.assign(st.v, JSON.parse(JSON.stringify(pack.vars || {})));
  for (const id of Object.keys(pack.chars || {})) st.aff[id] = 0;
  Object.assign(st.aff, pack.affStart || {});
  return st;
}
function migrate(st) {
  st.queue = st.queue || []; st.chapters = st.chapters || []; st.log = st.log || []; st.stack = st.stack || [];
  st.stage = st.stage || { bg: 'black', chars: [] }; st.stage.chars = st.stage.chars || [];
  st.used = st.used || {}; st.chats = st.chats || {}; st.evFired = st.evFired || {}; st.bought = st.bought || {};
  st.v = st.v || {}; st.s = st.s || { name: '' }; st.aff = st.aff || {}; st.flags = st.flags || {};
  return st;
}
const saveKey = id => 'unmyeong-save-' + id;
let TICK_T = 0;
function save(replay) {
  if (!S || S.done) return;
  const c = JSON.parse(JSON.stringify(S));
  if (replay && c.stack.length) { c.stack[c.stack.length - 1].i -= 1; c.replay = 1; }
  c.savedAt = Date.now();
  store.set(saveKey(S.pack), c);
  saveTick();
}
function saveTick(force) {
  const now = Date.now();
  if (!force && now - TICK_T < 7000) return;
  TICK_T = now;
  const t = $('#savetick'); if (!t || $('#stage').hidden) return;
  t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1700);
}
function withPack(p, st, fn) {
  const pp = P, ps = S; P = p; if (st !== undefined) S = st;
  try { return fn(); } finally { P = pp; S = ps; }
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
      case 'aff': ok = Object.entries(val).every(([id, sp]) => cmp(S.aff[affId(id)] ?? 0, sp)); break;
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
      case 'any': ok = arr(val).some(cond); break;
      case 'all': ok = arr(val).every(cond); break;
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
// quiet: no toasts / bursts (planner does its own feedback). noToast: bursts but no toast (chat shows a badge)
function applyFx(fx, quiet, noToast) {
  if (!fx) return [];
  const notes = [];
  for (const [id, d] of Object.entries(fx.v || {})) {
    const before = S.v[id] ?? 0; setVar(id, before + d);
    const diff = Math.round((S.v[id] - before) * 10) / 10;
    if (diff) notes.push({ id, k: varName(id), d: diff, bad: id === 'stress' ? diff > 0 : diff < 0 });
  }
  for (const [id, x] of Object.entries(fx.setv || {})) setVar(id, x);
  for (const [id, x] of Object.entries(fx.set || {})) S.s[id] = x;
  for (const [cid, d] of Object.entries(fx.aff || {})) {
    const id = affId(cid);
    const before = S.aff[id] ?? 0; S.aff[id] = clamp(before + d, 0, 100);
    const diff = S.aff[id] - before;
    if (diff) {
      notes.push({ id, k: charShort(id), d: diff, heart: true });
      if (!quiet && !UIS.skip) { if (diff > 0) HOOK.sfx?.('heart'); heartBurst(cid, diff); }
    }
  }
  for (const f of arr(fx.flag)) S.flags[f] = 1;
  for (const f of arr(fx.unflag)) delete S.flags[f];
  if (!quiet && !noToast && !UIS.skip) notes.slice(0, 5).forEach(n => toast(fxNote(n)));
  if (S.mode === 'vn') renderTop();
  return notes;
}
function fxNote(n) {
  const sign = n.d > 0 ? '+' : '';
  if (n.heart) return `<span class="hr">♥</span> ${esc(n.k)} <span class="${n.d > 0 ? 'up' : 'dn'}">${sign}${n.d}</span>`;
  return `${esc(n.k)} <span class="${n.bad ? 'dn' : 'up'}">${sign}${n.d}</span>`;
}

/* ---------------- motion helpers (DOM particles, count-up) ---------------- */
function heartBurst(id, d) {
  let r = null;
  const chatFace = $('#chat .ch-head .face');
  const onStage = $(`#chars .ch[data-id="${CSS.escape(affId(id))}"]:not(.gone)`) || $(`#chars .ch[data-id="${CSS.escape(id)}"]:not(.gone)`);
  if (chatFace) r = chatFace.getBoundingClientRect();
  else if (onStage && !$('#stage').hidden) { const b = onStage.getBoundingClientRect(); r = { left: b.left + b.width * .3, top: b.top + b.height * .12, width: b.width * .4, height: b.height * .2 }; }
  else if ($('#hubl .hubchar')) { const b = $('#hubl .hubchar').getBoundingClientRect(); r = { left: b.left + b.width * .3, top: b.top + b.height * .12, width: b.width * .4, height: b.height * .2 }; }
  const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight * .35;
  burst(x, y, d);
}
function burst(x, y, d) {
  const L = $('#fxl'); if (!L) return;
  const neg = d < 0;
  if (!REDUCE) {
    const n = neg ? 4 : Math.min(6 + d * 2, 16);
    for (let i = 0; i < n; i++) {
      const s = el('i', 'hp' + (neg ? ' neg' : ''), HEART_SVG);
      const ang = neg ? Math.PI / 2 + (Math.random() - .5) * 1.2 : -Math.PI / 2 + (Math.random() - .5) * 2.6;
      const dist = (neg ? 30 : 60) + Math.random() * (neg ? 30 : 90);
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--r', ((Math.random() - .5) * 70).toFixed(0) + 'deg');
      s.style.setProperty('--s', (.6 + Math.random() * .8).toFixed(2));
      s.style.animationDelay = (Math.random() * 90) + 'ms';
      L.appendChild(s); setTimeout(() => s.remove(), 1400);
    }
  }
  floatUp(x, y - 10, `♥ ${d > 0 ? '+' : ''}${d}`, neg ? 'neg' : '');
}
function floatUp(x, y, text, cls = '', delay = 0) {
  const L = $('#fxl'); if (!L) return;
  const b = el('b', 'plus ' + cls); b.textContent = text;
  b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.animationDelay = delay + 'ms';
  L.appendChild(b); setTimeout(() => b.remove(), 1800 + delay);
}
function countUp(node, from, to, dur = 900) {
  if (!node) return;
  if (REDUCE || from === to) { node.textContent = Math.round(to).toLocaleString(); return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    node.textContent = Math.round(from + (to - from) * e).toLocaleString();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------- characters ---------------- */
function charDef(id) { return P.chars?.[id]; }
// affection is shared between age variants of the hub character (daughter_teen → daughter)
function affId(id) {
  if (!P) return id;
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
  if (PORTRAIT_CACHE.has(key)) return uniqIds(PORTRAIT_CACHE.get(key));
  let svg = '';
  try { svg = window.ART ? ART.portrait(c.look || {}, EMOS.includes(e) ? e : 'neutral', crop ? { crop } : undefined) : ''; } catch (err) { console.error(err); }
  if (!svg) svg = `<svg viewBox="0 0 400 600"><ellipse cx="200" cy="200" rx="80" ry="95" fill="${c.color || '#888'}" opacity=".5"/><path d="M60 600c10-170 90-230 140-230s130 60 140 230z" fill="${c.color || '#888'}" opacity=".5"/></svg>`;
  if (PORTRAIT_CACHE.size > 400) PORTRAIT_CACHE.clear();
  PORTRAIT_CACHE.set(key, svg);
  return uniqIds(svg);
}
// the same cached SVG may be on the page several times (title card, stage, profile): give every copy its own
// gradient/clip ids, otherwise url(#id) resolves to a copy inside a hidden screen and the fills vanish
let SVG_SEQ = 0;
function uniqIds(svg) { const k = (++SVG_SEQ).toString(36); return svg.replace(/\bart(\d+)_/g, `art$1q${k}_`); }
function hubCharId() {
  const sim = P.sim; let id = sim.hubChar || '';
  if (id.startsWith('s:')) id = S.s[id.slice(2)] || Object.keys(P.chars)[0];
  if (sim.hubCharByAge) {
    const age = simAge();
    for (const [a, cid] of Object.entries(sim.hubCharByAge).sort((x, y) => +x[0] - +y[0])) if (age >= +a && P.chars[cid]) id = cid;
  }
  return P.chars[id] ? id : Object.keys(P.chars)[0];
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
function bgCSS(id) {
  const url = bgURL(id);
  if (url) return `url("${url}")`;
  try { return window.ART?.bgGradient?.(id) || 'linear-gradient(#222, #000)'; } catch { return 'linear-gradient(#222, #000)'; }
}
let bgFront = 'A', BG_LAST = '';
function kbVars(layer) {
  layer.style.setProperty('--kx', ((Math.random() - .5) * 5).toFixed(2) + '%');
  layer.style.setProperty('--ky', ((Math.random() - .5) * 4).toFixed(2) + '%');
  layer.style.setProperty('--ox', (30 + Math.random() * 40).toFixed(0) + '%');
  layer.style.setProperty('--oy', (30 + Math.random() * 40).toFixed(0) + '%');
}
function pickTrans(id) {
  const h = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) + (S?.log.length || 0);
  return h % 5 === 0 ? 'wipe' : h % 5 === 2 ? 'blur' : 'fade';
}
function setBg(id, how) {
  const css = bgCSS(id);
  const front = $('#bg' + bgFront), back = $('#bg' + (bgFront === 'A' ? 'B' : 'A'));
  const same = BG_LAST === id;
  BG_LAST = id;
  if (how === 'instant' || UIS.skip || REDUCE) {
    front.className = REDUCE ? '' : 'kb'; kbVars(front);
    front.style.transition = 'none'; front.style.backgroundImage = css; front.style.opacity = 1; front.style.zIndex = 1;
    back.style.transition = 'none'; back.style.opacity = 0; back.style.zIndex = 0;
    requestAnimationFrame(() => { front.style.transition = ''; back.style.transition = ''; });
  } else if (!same) {
    const mode = (!how || how === 'fade') ? pickTrans(id) : how;
    back.className = ''; kbVars(back);
    back.style.backgroundImage = css; back.style.zIndex = 2; front.style.zIndex = 1;
    if (mode === 'wipe' || mode === 'blur') {
      back.style.transition = 'none'; back.style.opacity = 1;
      back.classList.add(mode === 'wipe' ? (Math.random() < .5 ? 'wipe-l' : 'wipe-r') : 'blur-in');
      if (mode === 'blur') front.classList.add('blur-out');
      setTimeout(() => { front.style.opacity = 0; }, mode === 'wipe' ? 900 : 200);
      setTimeout(() => { back.style.transition = ''; }, 60);
    } else {
      back.classList.add('kb'); back.style.opacity = 1; front.style.opacity = 0;
    }
    bgFront = bgFront === 'A' ? 'B' : 'A';
  }
  screenFx(how);
}
// {fx:'shake'|'flash'} works on any step, with or without a background change
function screenFx(how) {
  if (UIS.skip) return;
  if (how === 'flash') { const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); HOOK.sfx?.('flash'); }
  if (how === 'shake') { const s = $('#stage'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); HOOK.sfx?.('shake'); if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) try { navigator.vibrate(60); } catch { /* ignore */ } }
}
const PK = {
  rofan: { shape: 'petal', col: ['255,182,206', '255,226,236'], dir: 1, n: 26, r: [3, 7] },
  murim: { shape: 'petal', col: ['214,232,206', '240,236,226'], dir: 1, n: 22, r: [3, 6] },
  raise: { shape: 'glow', col: ['255,236,170'], dir: -1, n: 26, r: [1.2, 3.2], speed: .6 },
  star: { shape: 'glow', col: ['255,110,190', '110,230,255'], dir: -1, n: 34, r: [.8, 3], speed: .8 },
  school: { shape: 'sakura', col: ['255,190,212', '255,222,234', '255,240,245'], dir: 1, n: 30, r: [4, 7.5] },
  office: { shape: 'bokeh', col: ['255,200,140', '140,210,255', '255,255,255'], dir: -1, n: 14, r: [14, 40], speed: .18 },
  joseon: { shape: 'petal', col: ['255,170,180', '255,236,240', '255,214,130'], dir: 1, n: 18, r: [2.5, 5] },
  academy: { shape: 'star', col: ['255,236,170', '205,195,255', '255,255,255'], dir: -1, n: 30, r: [2, 4.5], speed: .25 },
  apoc: { shape: 'ash', col: ['200,200,188', '150,148,140', '255,150,90'], dir: 1, n: 44, r: [1, 2.6], speed: .7, drift: .9 },
  night: { shape: 'petal', col: ['170,20,50', '120,10,35', '220,60,90'], dir: 1, n: 16, r: [3.5, 6.5], speed: .7 },
};
function spawnP(cfg, w, h, any, d) {
  const dir = cfg.dir, sp = cfg.speed ?? 1;
  return {
    x: Math.random() * w, y: any ? Math.random() * h : dir > 0 ? -20 * d : h + 20 * d,
    vx: (cfg.drift ?? .5) * (Math.random() - .3) * d * sp,
    vy: dir * (Math.random() * .55 + .35) * d * sp,
    r: (cfg.r[0] + Math.random() * (cfg.r[1] - cfg.r[0])) * d,
    a: Math.random() * 6.28, va: cfg.shape === 'star' ? .02 + Math.random() * .05 : (Math.random() - .5) * .05,
    c: rnd(cfg.col),
  };
}
function drawP(ctx, p, shape) {
  ctx.save(); ctx.translate(p.x, p.y);
  switch (shape) {
    case 'petal':
      ctx.rotate(p.a); ctx.scale(1, .55 + .45 * Math.cos(p.a * 1.7));
      ctx.fillStyle = `rgba(${p.c},.78)`; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.2832); ctx.fill(); break;
    case 'sakura': {
      const r = p.r; ctx.rotate(p.a); ctx.scale(Math.cos(p.a * 1.3) || .1, 1);
      ctx.fillStyle = `rgba(${p.c},.88)`; ctx.beginPath(); ctx.moveTo(0, r);
      ctx.bezierCurveTo(r * 1.1, r * .2, r * .7, -r, r * .22, -r * .95); ctx.lineTo(0, -r * .62); ctx.lineTo(-r * .22, -r * .95);
      ctx.bezierCurveTo(-r * .7, -r, -r * 1.1, r * .2, 0, r); ctx.fill(); break;
    }
    case 'bokeh': {
      const al = .07 + .05 * Math.sin(p.a);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
      g.addColorStop(0, `rgba(${p.c},${(al + .05).toFixed(3)})`); g.addColorStop(.75, `rgba(${p.c},${al.toFixed(3)})`); g.addColorStop(1, `rgba(${p.c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.2832); ctx.fill(); break;
    }
    case 'star': {
      const r = p.r; ctx.globalAlpha = .12 + .88 * Math.max(0, Math.sin(p.a));
      ctx.fillStyle = `rgb(${p.c})`; ctx.beginPath(); ctx.moveTo(0, -r * 2);
      ctx.quadraticCurveTo(0, 0, r * 2, 0); ctx.quadraticCurveTo(0, 0, 0, r * 2); ctx.quadraticCurveTo(0, 0, -r * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -r * 2); ctx.fill(); break;
    }
    case 'ash':
      ctx.rotate(p.a); ctx.fillStyle = `rgba(${p.c},.55)`; ctx.fillRect(-p.r, -p.r * .6, p.r * 2, p.r * 1.2); break;
    default: {
      const al = .35 + Math.sin(p.a) * .3;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 4);
      g.addColorStop(0, `rgba(${p.c},${(al + .3).toFixed(3)})`); g.addColorStop(1, `rgba(${p.c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r * 4, 0, 6.2832); ctx.fill();
    }
  }
  ctx.restore();
}
function stepP(parts, cfg, w, h, d) {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    p.x += p.vx + Math.sin(p.a) * .3 * d; p.y += p.vy; p.a += p.va;
    if (p.y > h + 40 * d || p.y < -40 * d || p.x > w + 50 * d || p.x < -50 * d) parts[i] = spawnP(cfg, w, h, false, d);
  }
}
const FX = { parts: [], raf: 0, kind: '' };
function startParticles(kind) {
  FX.kind = kind;
  HOOK.music?.(kind);
  const cv = $('#fx'), ctx = cv.getContext('2d');
  const cfg = PK[kind] || PK.rofan;
  const resize = () => { cv.width = innerWidth * DPR(); cv.height = innerHeight * DPR(); };
  resize();
  if (!FX.bound) { FX.bound = true; addEventListener('resize', () => { cv.width = innerWidth * DPR(); cv.height = innerHeight * DPR(); }); }
  const N = REDUCE ? 0 : Math.round(cfg.n * (innerWidth < 600 ? .7 : 1));
  FX.parts = Array.from({ length: N }, () => spawnP(cfg, cv.width, cv.height, true, DPR()));
  cancelAnimationFrame(FX.raf);
  const tick = () => {
    FX.raf = requestAnimationFrame(tick);
    if (document.hidden || $('#stage').hidden) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    stepP(FX.parts, cfg, cv.width, cv.height, DPR());
    for (const p of FX.parts) drawP(ctx, p, cfg.shape);
  };
  tick();
}

/* ---------------- stage rendering ---------------- */
const POS = { l: 22, c: 50, r: 78 };
const REACT = { surprised: 'r-hop', angry: 'r-shake', sad: 'r-droop', cry: 'r-droop', laugh: 'r-bounce', shy: 'r-sway', cold: 'r-turn', smirk: 'r-turn', worried: 'r-shiver', smile: 'r-lift', tired: 'r-sink' };
function playAnim(cm, cls) {
  if (!cm) return;
  cm.className = 'cm';
  if (REDUCE || UIS.skip || !cls) return;
  void cm.offsetWidth; cm.classList.add(cls);
  const end = e => { if (e.target !== cm) return; cm.removeEventListener('animationend', end); if (!cls.startsWith('out')) cm.classList.remove(cls); };
  cm.addEventListener('animationend', end);
}
function renderChars(speaker) {
  const box = $('#chars');
  const want = S.stage.chars;
  const narrow = innerWidth < 640;
  const pos = narrow ? { l: 25, c: 50, r: 75 } : POS;
  for (const node of [...box.children]) {
    if (want.find(c => c.id === node.dataset.id) || node.classList.contains('gone')) continue;
    node.classList.add('gone');
    if (UIS.skip || REDUCE) { node.remove(); continue; }
    playAnim(node.querySelector('.cm'), 'out-' + (node.dataset.at || 'c'));
    setTimeout(() => { if (node.classList.contains('gone')) node.remove(); }, 460);
  }
  for (const c of want) {
    let node = box.querySelector(`.ch[data-id="${CSS.escape(c.id)}"]`);
    const x = want.length === 1 ? 50 : pos[c.at || 'c'];
    const side = x < 40 ? 'l' : x > 60 ? 'r' : 'c';
    let fresh = false;
    if (node && node.classList.contains('gone')) { node.classList.remove('gone'); playAnim(node.querySelector('.cm'), 'in-' + side); }
    if (!node) {
      node = el('div', 'ch', '<div class="cf"><div class="cm"><div class="cb"></div></div></div>');
      node.dataset.id = c.id; node.style.left = x + '%';
      node.querySelector('.cb').style.animationDelay = -(Math.random() * 4).toFixed(2) + 's';
      box.appendChild(node); fresh = true;
      playAnim(node.querySelector('.cm'), 'in-' + side);
    }
    if (node.dataset.e !== c.e) {
      const prev = node.dataset.e;
      node.querySelector('.cb').innerHTML = portrait(c.id, c.e);
      node.dataset.e = c.e;
      if (prev && !fresh) playAnim(node.querySelector('.cm'), REACT[c.e]);
    }
    node.dataset.at = side;
    node.style.left = x + '%';
    node.style.zIndex = c.id === speaker ? 3 : 2;
    node.classList.toggle('dim', !!speaker && speaker !== c.id && want.length > 1);
    node.classList.toggle('focus', c.id === speaker && want.length > 1);
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
  const top = $('#vn-top'); if (!top || !S || S.mode !== 'vn') return;
  const date = P.sim ? `<span class="hud mini">${esc(dateLabel(simDate()))}</span>` : '';
  top.innerHTML = `<button class="ibtn" type="button" data-a="menu" aria-label="메뉴">${ic('menu')}</button>
    <button class="ibtn" type="button" data-a="log" aria-label="대사 기록">${ic('log')}</button>
    <span class="sp">${date}</span>
    <button class="ibtn" type="button" data-a="stats" aria-label="상태와 관계">${ic('heart')}</button>
    <button class="ibtn" type="button" data-a="eye" aria-label="UI 숨기고 그림 보기">${ic('eye')}</button>
    <button class="ibtn ${UIS.auto ? 'on' : ''}" type="button" data-a="auto" aria-label="자동 진행" aria-pressed="${UIS.auto}">${ic('auto')}</button>
    <button class="ibtn ${UIS.skip ? 'on' : ''}" type="button" data-a="skip" aria-label="빨리 넘기기" aria-pressed="${UIS.skip}">${ic('skip')}</button>`;
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
function setNoUI(on) {
  document.body.classList.toggle('noui', on);
  $('#noui-hint')?.remove();
  if (on) { const h = el('div', '', '탭하면 UI가 돌아와요'); h.id = 'noui-hint'; $('#stage').appendChild(h); setTimeout(() => h.remove(), 2700); }
}

/* ---------------- waiting for the player ---------------- */
function waitAdvance() { return new Promise(r => { UIS.advance = r; }); }
function advance() {
  if (UIS.typing) { UIS.typing(); return; }
  const r = UIS.advance; UIS.advance = null; if (r) { HOOK.sfx?.('tick'); r(); }
}
async function typeLine(name, text, color, who) {
  const box = $('#box'); box.hidden = false;
  const np = $('#nameplate'), ln = $('#line'), more = $('#more');
  if (name) {
    if (np.hidden || np.textContent !== name) { np.classList.remove('pop'); void np.offsetWidth; np.classList.add('pop'); }
    np.hidden = false; np.textContent = name; np.style.background = color || ''; np.style.color = color ? '#1a0e14' : '';
  } else np.hidden = true;
  ln.classList.toggle('narr', !name);
  more.hidden = true;
  const html = fmt(text);
  if (UIS.skip || PREF.speed === 0) { ln.innerHTML = html; }
  else {
    const chars = [...text];
    let n = 0, done = false;
    HOOK.flap?.(who, true);
    await new Promise(res => {
      UIS.typing = () => { done = true; };
      const step = () => {
        if (done || n >= chars.length) { ln.innerHTML = html; UIS.typing = null; HOOK.flap?.(who, false); res(); return; }
        n += 1; ln.innerHTML = fmt(chars.slice(0, n).join(''));
        setTimeout(step, PREF.speed);
      };
      step();
    });
  }
  more.hidden = false;
  if (UIS.skip) { await sleep(40); return; }
  if (!store.get('unmyeong-onboard', 0)) await coach();
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
  if (st == null) return;
  if (typeof st === 'string') st = { t: st };
  const replay = REPLAY_NOFX; REPLAY_NOFX = false;
  if (st.bg) { S.stage.bg = st.bg; setBg(st.bg, st.fx && typeof st.fx === 'string' ? st.fx : 'fade'); }
  else if (typeof st.fx === 'string' && !replay) screenFx(st.fx);
  if (st.hide) { S.stage.chars = st.hide === 'all' ? [] : S.stage.chars.filter(c => c.id !== st.hide); renderChars(); }
  if (st.show) { if (charDef(st.show)) { showChar(st.show, st.e, st.at); renderChars(); } else console.warn('unknown char', st.show); }
  if (st.title && !replay) { await chapterCard(st.title, st.sub); if (RUN !== token) return 'stop'; }
  if (st.fx && typeof st.fx === 'object' && !replay) applyFx(st.fx);
  if (st.toast && !replay) toast(esc(interp(st.toast)));
  if (st.input) {
    const v = await askText(interp(st.label || '이름'), interp(st.def || ''));
    if (RUN !== token) return 'stop';
    S.s[st.input] = v || interp(st.def || '');
    PORTRAIT_CACHE.clear();
  }
  if (st.t != null && !st.choice) {
    const text = interp(st.t);
    let name = '', color = '';
    const speaker = st.c && st.c !== 'me' && charDef(st.c) ? st.c : null;
    if (st.c === 'me') { name = S.s.name; color = ''; }
    else if (speaker) {
      showChar(st.c, st.e, st.at);
      name = st.as ? interp(st.as) : charShort(st.c);
      color = charDef(st.c)?.color || '';
    } else if (st.c) name = st.as ? interp(st.as) : String(st.c);
    renderChars(speaker);
    logLine(name, text);
    save(true);
    await typeLine(name, text, color, speaker);
    if (RUN !== token) return 'stop';
  } else if (st.e && st.c && st.c !== 'me' && charDef(st.c)) { showChar(st.c, st.e, st.at); renderChars(); }
  if (st.if !== undefined && (st.then || st.else)) {
    const branch = cond(st.if) ? 'then' : 'else';
    if (st[branch]?.length) S.stack.push({ p: f.p.concat([idx, branch]), i: 0 });
    return;
  }
  if (st.choice) {
    const k = await choose(st, token);
    if (RUN !== token || k == null) return 'stop';
    if (k < 0) { save(); return; }   // nothing could be chosen: the scene simply continues
    const o = st.choice[k];
    logLine(S.s.name, '▸ ' + interp(o.t));
    if (o.fx) applyFx(o.fx);
    if (o.then?.length) S.stack.push({ p: f.p.concat([idx, 'c' + k]), i: 0, go: o.go });
    else if (o.go) startScene(o.go);
    save(); saveTick(true);
    return;
  }
  if (st.chat) {
    save(true);
    await chat(st.chat, interp(st.goal || ''), st.max || 4, token);
    if (RUN !== token) return 'stop';
    save();
  }
  if (st.call) { if (P.scenes[st.call]) S.stack.push({ p: ['sc', st.call], i: 0 }); else console.warn('missing scene', st.call); return; }
  if (st.go) { startScene(st.go); return; }
  if (st.ending) { await showEnding(st.ending); return 'ending'; }
  if (st.end) { S.stack = []; return; }
}

/* chapter title card: cinematic, per-genre style, tap to skip */
const CARD_STYLE = { rofan: 'gold', raise: 'warm', star: 'neon', murim: 'ink', school: 'sky', office: 'city', joseon: 'hanji', academy: 'astral', apoc: 'glitch', night: 'moon' };
const CARD_PK = {
  ink: { shape: 'petal', col: ['40,40,36', '80,74,64'], dir: 1, n: 16, r: [3, 6] },
  hanji: { shape: 'petal', col: ['196,58,62', '232,120,128', '240,170,176'], dir: 1, n: 22, r: [2.5, 5] },
};
function cardFx(cv, theme, style) {
  if (REDUCE) return () => {};
  const ctx = cv.getContext('2d'), d = DPR();
  cv.width = innerWidth * d; cv.height = innerHeight * d;
  const w = cv.width, h = cv.height;
  const cfg = CARD_PK[style] || PK[theme] || PK.rofan;
  const parts = Array.from({ length: Math.round(cfg.n * 1.4) }, () => spawnP(cfg, w, h, true, d));
  const blobs = (style === 'ink' || style === 'hanji') ? Array.from({ length: 6 }, (_, i) => ({
    x: w * (.2 + Math.random() * .6), y: h * (.35 + Math.random() * .3), R: Math.min(w, h) * (.12 + Math.random() * .2), t0: 100 + i * 140,
  })) : [];
  const t0 = performance.now(); let raf = 0, frame = 0;
  const tick = now => {
    raf = requestAnimationFrame(tick); frame++;
    const t = now - t0;
    ctx.clearRect(0, 0, w, h);
    for (const b of blobs) {
      const k = clamp((t - b.t0) / 1500, 0, 1), e = 1 - Math.pow(1 - k, 3);
      if (k <= 0) continue;
      const r = b.R * e, g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      const a = style === 'ink' ? .32 : .16;
      g.addColorStop(0, `rgba(24,20,16,${a})`); g.addColorStop(.6, `rgba(24,20,16,${a * .6})`); g.addColorStop(1, 'rgba(24,20,16,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.2832); ctx.fill();
    }
    if (style === 'ink' || style === 'hanji') {   // a brush stroke band sweeping behind the title
      const k = clamp((t - 300) / 900, 0, 1), bw = w * .8 * (1 - Math.pow(1 - k, 3));
      const g = ctx.createLinearGradient(w * .1, 0, w * .1 + bw, 0);
      g.addColorStop(0, 'rgba(20,16,12,0)'); g.addColorStop(.15, `rgba(20,16,12,${style === 'ink' ? .16 : .08})`); g.addColorStop(1, 'rgba(20,16,12,0)');
      ctx.fillStyle = g; ctx.fillRect(w * .1, h * .44, bw, h * .12);
    }
    if (style === 'glitch' && frame % 17 < 2) { ctx.fillStyle = 'rgba(201,226,90,.08)'; ctx.fillRect(0, Math.random() * h, w, 6 * d + Math.random() * 20 * d); }
    stepP(parts, cfg, w, h, d);
    for (const p of parts) drawP(ctx, p, cfg.shape);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
function chapterCard(t, sub) {
  const title = interp(t), s = sub ? interp(sub) : '';
  S.chapters = S.chapters || [];
  const last = S.chapters[S.chapters.length - 1];
  if (!last || last.t !== title || last.sub !== s) {
    S.chapters.push({ t: title, sub: s, turn: P.sim ? S.turn : null, at: Date.now() });
    if (S.chapters.length > 80) S.chapters.splice(0, S.chapters.length - 80);
  }
  return new Promise(res => {
    if (UIS.skip) return res();
    $('#card')?.remove();
    const theme = themeOf(P), style = CARD_STYLE[theme] || 'gold';
    const head = s ? title : '', big = s || title;
    const letters = [...big];
    const per = Math.min(.07, 1.1 / Math.max(1, letters.length));
    const spans = letters.map((ch, i) => `<span style="animation-delay:${(.45 + i * per).toFixed(2)}s">${esc(ch)}</span>`).join('');
    const c = el('div', 'cs-' + style, `<canvas></canvas><i class="sweep"></i><div class="ct">${head ? `<b>${esc(head)}</b>` : ''}<h2>${spans}</h2><i class="rule"></i>${style === 'hanji' ? '<span class="seal">運<br>命</span>' : ''}</div><small class="skip">탭하여 넘기기</small>`);
    c.id = 'card'; c.setAttribute('role', 'button'); c.setAttribute('aria-label', `${title} ${s} — 탭하여 넘기기`);
    $('#stage').appendChild(c);
    HOOK.sfx?.('card');
    const stop = cardFx(c.querySelector('canvas'), theme, style);
    let done = false;
    const finish = () => {
      if (done) return; done = true; clearTimeout(tm);
      c.classList.add('leave');
      setTimeout(() => { stop(); c.remove(); res(); }, 480);
    };
    c.onclick = e => { e.stopPropagation(); finish(); };
    const tm = setTimeout(finish, 3400);
  });
}
function choose(st, token) {
  return new Promise(res => {
    const box = $('#choices'); box.innerHTML = '';
    UIS.skip = false; renderTop();
    const vis = st.choice.map((o, k) => ({ o, k })).filter(({ o }) => !o.if || cond(o.if));
    if (!vis.length) { res(-1); return; }  // every option hidden → skip the choice instead of freezing
    document.body.classList.remove('noui');
    box.hidden = false;
    if (st.prompt) box.appendChild(el('div', 'prompt', esc(interp(st.prompt))));
    let picked = false, iv = 0;
    const done = k => { clearInterval(iv); box.hidden = true; box.innerHTML = ''; res(k); };
    const pick = (k, b) => {
      if (picked) return; picked = true; HOOK.sfx?.('select');
      if (REDUCE) { done(k); return; }
      [...box.children].forEach((x, j) => {
        if (x === b) { x.style.animationDelay = '0ms'; x.classList.add('picked'); return; }
        x.style.animationDelay = (j * 40) + 'ms'; x.style.setProperty('--rot', ((Math.random() - .5) * 6).toFixed(1) + 'deg'); x.classList.add('drop');
      });
      setTimeout(() => done(k), 560);
    };
    vis.forEach(({ o, k }, j) => {
      const locked = o.req && !cond(o.req);
      const b = el('button', 'opt', `<span>${esc(interp(o.t))}</span>${locked ? `<small>${esc(interp(o.hint || reqHint(o.req)))}</small>` : ''}`);
      b.type = 'button'; b.style.animationDelay = (120 + j * 90) + 'ms';
      if (locked) b.disabled = true;
      b.onclick = e => { e.stopPropagation(); pick(k, b); };
      box.appendChild(b);
    });
    if (!box.querySelector('.opt:not([disabled])')) {   // everything locked: let the player move on
      const b = el('button', 'opt skipopt', '<span>…지금은 아무것도 할 수 없다. 넘어간다.</span>');
      b.type = 'button'; b.style.animationDelay = (120 + vis.length * 90) + 'ms';
      b.onclick = e => { e.stopPropagation(); pick(-1, b); };
      box.appendChild(b);
    }
    iv = setInterval(() => { if (RUN !== token) { done(null); } }, 400);
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
function cleanupOverlays() {
  ['#chat', '#play', '#card', '#recap', '#mflip', '#coach', '#noui-hint'].forEach(s => $(s)?.remove());
  const ch = $('#choices'); ch.hidden = true; ch.innerHTML = '';
  document.body.classList.remove('noui');
  UIS.auto = false; UIS.skip = false;
}
function showStage() {
  $('#title').hidden = true; $('#ending').hidden = true; $('#stage').hidden = false;
  document.body.dataset.genre = themeOf(P);
  const hub = $('#hubl'); if (hub) hub.remove();
  $('#vn-top').hidden = false;
  S.mode = 'vn';
  if (BG_LAST !== (S.stage.bg || 'black')) setBg(S.stage.bg || 'black', 'instant');
  renderChars(); renderTop();
}
function closeSheet() { document.querySelectorAll('.sheet,.scrim').forEach(n => n.remove()); UIS.sheet = null; }
function sheet(title, bodyHTML, onMount) {
  closeSheet();
  document.body.classList.remove('noui');
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
  // affection lives on the base id; show whichever variant is current (e.g. daughter_teen once the hub has switched to it)
  let cur = null; try { cur = P.sim ? hubCharId() : null; } catch { cur = null; }
  const shown = base => (cur && cur !== base && affId(cur) === base ? cur : base);
  const ids = Object.keys(P.chars).filter(id => affId(id) === id && ((S.aff[id] ?? 0) > 0 || S.flags['met_' + id]));
  const affs = ids.sort((a, b) => (S.aff[b] ?? 0) - (S.aff[a] ?? 0)).map(base => { const id = shown(base); return `<button class="aff" type="button" data-a="profile" data-v="${esc(id)}"><span class="face">${portrait(id, S.aff[base] >= 60 ? 'smile' : 'neutral', 'face')}</span><span class="n">${esc(charShort(id))}<small>${esc(interp(charDef(id).role || ''))}</small><span class="heart">♥ ${S.aff[base] ?? 0}</span></span></button>`; }).join('');
  return `${P.sim ? `<div class="sub">${esc(dateLabel(simDate()))}${P.sim.ageStart != null ? ` · ${simAge()}세` : ''}</div>` : ''}
    ${bars ? `<div class="bars">${bars}</div>` : ''}${hud ? `<div class="bars">${hud}</div>` : ''}
    ${affs ? `<div class="sub">관계 · 눌러서 프로필 보기</div><div class="affs">${affs}</div>` : '<p class="sub" style="letter-spacing:0">아직 가까워진 인물이 없어요.</p>'}`;
}
function openStats() { sheet('상태 · 관계', statsHTML()); }
function openLog() {
  const html = S.log.slice(-80).map(l => `<div class="${l.n ? '' : 'n'}">${l.n ? `<b>${esc(l.n)}</b>` : ''}${fmt(l.t)}</div>`).join('') || '<p class="sub">아직 기록이 없습니다.</p>';
  const sh = sheet('대사 기록', `<div class="log">${html}</div>`);
  const body = sh.querySelector('.body'); body.scrollTop = body.scrollHeight;
}
function endingsHTML(pack, compact) {
  const got = store.get('unmyeong-endings', {})[pack.id] || {};
  let all = Object.entries(pack.endings || {});
  const have = all.filter(([k]) => got[k]).length;
  const more = compact && all.length > 6 ? all.length - 6 : 0;
  if (more) all = all.filter(([k]) => got[k]).concat(all.filter(([k]) => !got[k])).slice(0, 6);
  return `<div class="sub">엔딩 ${have} / ${Object.keys(pack.endings || {}).length}</div><div class="gal">${all.map(([id, e]) => got[id]
    ? `<div><small>${esc(e.rank || '')}</small>${esc(withPack(pack, undefined, () => interp(e.title)))}</div>` : `<div class="lock"><small>${esc(e.rank || '')}</small>???</div>`).join('')}${more ? `<div class="lock"><small>+${more}</small>더 많은 결말</div>` : ''}</div>`;
}
function openFlow() {
  const ch = S.chapters || [];
  const items = ch.map((c, i) => `<li style="--i:${i}" class="${i === ch.length - 1 ? 'cur' : ''}"><small>${c.turn != null && P.sim ? esc(dateLabel(simDate(c.turn))) + ' · ' : ''}${esc(c.sub ? c.t : `${i + 1}`)}${i === ch.length - 1 ? ' · 지금 여기' : ''}</small><b>${esc(c.sub || c.t)}</b></li>`).join('');
  sheet('스토리 흐름', `<div class="sub">이번 진행에서 지나온 장 ${ch.length}개</div>
    ${items ? `<ol class="flow">${items}</ol>` : '<p class="sub" style="letter-spacing:0">아직 첫 장이 시작되지 않았어요.</p>'}
    ${endingsHTML(P)}`, sh => { const b = sh.querySelector('.body'); const cur = b.querySelector('.cur'); if (cur) b.scrollTop = cur.offsetTop - 120; });
}
function openMenu() {
  sheet('메뉴', `
    <div class="mgrid">
      <button class="mbtn" type="button" data-a="stats">${ic('heart')}<span>상태 · 관계<small>능력치와 호감도</small></span></button>
      <button class="mbtn" type="button" data-a="flow">${ic('flow')}<span>스토리 흐름<small>지나온 장과 엔딩</small></span></button>
      <button class="mbtn" type="button" data-a="slots">${ic('save')}<span>저장 · 불러오기<small>진행은 자동 저장돼요</small></span></button>
      <button class="mbtn" type="button" data-a="log">${ic('log')}<span>대사 기록<small>아래로 쓸어도 열려요</small></span></button>
      <button class="mbtn" type="button" data-a="help">${ic('help')}<span>조작 도움말<small>탭 · 쓸기 · 길게 누르기</small></span></button>
      <button class="mbtn" type="button" data-a="title">${ic('home')}<span>타이틀로<small>저장 후 나가기</small></span></button>
    </div>
    <div class="setrow"><div class="sub">글자 크기</div><div class="tabs">
      ${[['n', '보통'], ['b', '크게']].map(([v, n]) => `<button class="tab ${PREF.size === v ? 'on' : ''}" type="button" data-a="tsize" data-v="${v}">${n}</button>`).join('')}
    </div></div>
    <div class="setrow"><div class="sub">글자 속도</div><div class="tabs">
      ${[[45, '느리게'], [26, '보통'], [10, '빠르게'], [0, '즉시']].map(([v, n]) => `<button class="tab ${PREF.speed === v ? 'on' : ''}" type="button" data-a="speed" data-v="${v}">${n}</button>`).join('')}
    </div></div>
    ${HOOK.menuExtra ? HOOK.menuExtra() : ''}
    <div class="setrow"><div class="sub">AI 대화 답장 방식</div>
    <div class="tabs">
      <button class="tab ${PREF.tier === 'quick' ? 'on' : ''}" type="button" data-a="tier" data-v="quick">빠른 답장</button>
      <button class="tab ${PREF.tier === 'default' ? 'on' : ''}" type="button" data-a="tier" data-v="default">깊은 대화</button>
    </div><p class="sub" style="letter-spacing:0;margin:0">${aiStatus()}</p></div>
    ${endingsHTML(P)}`);
}
function aiStatus() {
  if (AI_OFF) return 'AI 대화를 쓸 수 없어 준비된 대화 주제로 진행합니다.';
  if (!SAMPLE) return '이 화면에서는 AI 대화를 쓸 수 없어요. 대화 장면에서는 준비된 주제를 골라 이야기합니다.';
  return '인물에게 자유롭게 말을 걸 수 있습니다. 첫 대화 때 Claude 사용 허락을 묻습니다.';
}
function applyPrefs() { document.body.classList.toggle('big', PREF.size === 'b'); }

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
const GENERIC_PROMPTS = ['요즘 어떻게 지내?', '너에 대해 더 알고 싶어.', '오늘 고마웠어.', '무슨 고민 있어?'];
function chat(id, goal, max, token) {
  return new Promise(resolveChat => {
    const c = charDef(id); if (!c) return resolveChat();
    UIS.skip = false; UIS.auto = false; document.body.classList.remove('noui');
    const aid = affId(id);
    let face = S.stage.chars.find(x => x.id === id)?.e || 'neutral';
    const wrap = el('div', ''); wrap.id = 'chat';
    const affNow = () => S.aff[aid] ?? 0;
    wrap.innerHTML = `<div class="ch-head"><span class="face">${portrait(id, face, 'face')}</span>
      <span class="who"><b>${esc(charName(id))}</b><small><span class="heart">♥ <span id="chat-aff">${affNow()}</span></span><span class="hbar"><i style="width:${affNow()}%"></i></span> · <span id="chat-left"></span></small></span>
      <button class="ibtn" type="button" id="chat-done">대화 마치기</button></div>
      ${goal ? `<div class="goal">${esc(goal)}</div>` : ''}
      <div class="msgs" id="chat-msgs" aria-live="polite"></div>
      <div id="chat-foot"></div>`;
    $('#stage').appendChild(wrap);
    $('#box').hidden = true;
    const msgs = wrap.querySelector('#chat-msgs'), foot = wrap.querySelector('#chat-foot'), faceEl = wrap.querySelector('.ch-head .face');
    let used = 0, delta = 0, ctl = null, busy = false, closed = false;
    const history = (S.chats[id] = S.chats[id] || []);
    const left = () => { wrap.querySelector('#chat-left').textContent = `남은 대화 ${Math.max(0, max - used)}회`; };
    const rich = t => fmt(t).replace(/<em>/g, '<span class="act">').replace(/<\/em>/g, '</span>');
    function addMsg(who, text, old) {
      if (who === 'sys') { const m = el('div', 'msg sys', esc(text)); msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; return m; }
      const row = el('div', `mrow ${who}${old ? ' old' : ''}`);
      if (who === 'them') row.appendChild(el('span', 'av', portrait(id, face, 'face')));
      const m = el('div', 'msg', rich(text)); row.appendChild(m);
      msgs.appendChild(row); msgs.scrollTop = msgs.scrollHeight;
      return m;
    }
    function affBadge(m, d) {
      if (!d || !m?.parentNode) return;
      const b = el('span', 'affb ' + (d > 0 ? 'up' : 'dn'), `♥ ${d > 0 ? '+' : ''}${d}`);
      m.parentNode.appendChild(b);
      msgs.scrollTop = msgs.scrollHeight;
      if (d > 0) HOOK.sfx?.('heart');
      requestAnimationFrame(() => { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, d); });
    }
    function updAff() {
      wrap.querySelector('#chat-aff').textContent = affNow();
      wrap.querySelector('.hbar i').style.width = affNow() + '%';
      faceEl.classList.remove('pulse'); void faceEl.offsetWidth; faceEl.classList.add('pulse');
    }
    function setFace(e) {
      face = e; faceEl.innerHTML = portrait(id, e, 'face');
      if (S.stage.chars.find(x => x.id === id)) { showChar(id, e); renderChars(id); }
    }
    // show the tail of earlier conversations for continuity
    history.slice(-4).forEach(h => addMsg(h.role === 'user' ? 'me' : 'them', h.content, true));
    if (history.length) addMsg('sys', '— 지난 대화 —');
    left();
    function finish() {
      if (closed) return; closed = true;
      clearInterval(iv); ctl?.abort(); wrap.remove();
      if (history.length > 24) history.splice(0, history.length - 24);
      resolveChat();
    }
    wrap.querySelector('#chat-done').onclick = finish;
    const iv = setInterval(() => { if (token && RUN !== token) finish(); }, 500);
    function doneBtn(label) {
      foot.innerHTML = '';
      const b = el('button', 'cta', label); b.type = 'button'; b.onclick = finish;
      const box = el('div', 'topics'); box.appendChild(b); foot.appendChild(box);
    }

    function topicsMode(note) {
      if (note) { const n = el('div', 'nochat', `<b>${esc(note[0])}</b>${esc(note[1])}`); msgs.appendChild(n); }
      const topics = (c.talk || []).map((t, k) => ({ t, k })).filter(({ t }) => !t.if || cond(t.if));
      const fresh = topics.filter(({ k }) => !S.used[id + ':' + k]);
      const list = (fresh.length ? fresh : topics).slice(0, 4);
      foot.innerHTML = '';
      if (used >= max || !list.length) { doneBtn(used ? '계속' : '대화 마치기'); return; }
      const box = el('div', 'topics');
      list.forEach(({ t, k }, j) => {
        const b = el('button', 'opt', `<span>${esc(interp(t.t))}</span>`); b.type = 'button'; b.style.animationDelay = (j * 70) + 'ms';
        b.onclick = async () => {
          if (busy) return; busy = true;
          const firstTime = !S.used[id + ':' + k];
          used++; left(); S.used[id + ':' + k] = 1;
          addMsg('me', interp(t.t));
          foot.innerHTML = '';
          let lastM = null;
          for (const ln of t.lines || []) {
            const x = typeof ln === 'string' ? { t: ln } : ln;
            const typing = (x.c || id) === id ? addMsg('them', '') : null;
            if (typing) { typing.classList.add('think'); typing.innerHTML = '<i></i><i></i><i></i>'; }
            await sleep(REDUCE ? 150 : 520 + Math.min(700, (x.t || '').length * 14));
            if (closed) return;
            typing?.parentNode.remove();
            if (x.e && (x.c || id) === id) setFace(x.e);
            lastM = addMsg(x.c === 'me' ? 'me' : x.c && x.c !== id ? 'sys' : 'them', (x.c && x.c !== id && x.c !== 'me' ? charShort(x.c) + ': ' : '') + interp(x.t));
          }
          if (t.fx && firstTime) {
            const notes = applyFx(t.fx, true);
            const mine = notes.find(n => n.heart && n.id === aid);
            if (mine) { affBadge(lastM, mine.d); updAff(); }
            notes.filter(n => !(n.heart && n.id === aid)).forEach(n => toast(fxNote(n)));
          }
          busy = false;
          topicsMode();
        };
        box.appendChild(b);
      });
      foot.appendChild(box);
    }

    function aiMode() {
      foot.innerHTML = '';
      const talk = (c.talk || []).filter(t => !t.if || cond(t.if)).slice(0, 5).map(t => interp(t.t));
      const chips = [...talk, ...GENERIC_PROMPTS.filter(g => !talk.includes(g))].slice(0, 6);
      const q = el('div', 'quick', '<span class="ql">예시</span>');
      const form = el('form', '', `<input id="chat-input" autocomplete="off" enterkeyhint="send" maxlength="300" placeholder="${esc(charShort(id))}에게 하고 싶은 말을 직접 써 보세요" aria-label="${esc(charShort(id))}에게 말하기"><button type="submit">보내기</button>`);
      const inp = form.querySelector('input'), btn = form.querySelector('button');
      chips.forEach((t, j) => { const b = el('button', '', esc(t)); b.type = 'button'; b.style.setProperty('--i', j); b.onclick = () => { if (busy) return; inp.value = t; form.requestSubmit(); }; q.appendChild(b); });
      foot.append(q, form);
      if (!history.length) addMsg('sys', `${charShort(id)}에게 자유롭게 말을 걸어 보세요. 말에 따라 마음이 움직여요.`);
      if (matchMedia('(pointer: fine)').matches) setTimeout(() => inp.focus(), 60);
      form.onsubmit = async ev => {
        ev.preventDefault();
        const text = inp.value.trim();
        if (!text || busy || used >= max) return;
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
            onText: ({ text: t }) => { const s = parseReply(t).shown; if (!s) return; bubble.classList.remove('think'); bubble.innerHTML = rich(s); msgs.scrollTop = msgs.scrollHeight; },
          });
          const r = parseReply(res.text);
          bubble.classList.remove('think');
          bubble.innerHTML = rich(r.shown || '…');
          history.push({ role: 'assistant', content: r.shown || '…' });
          logLine(S.s.name, text); logLine(charShort(id), r.shown);
          if (r.e) setFace(r.e);
          const d = clamp(r.aff, -8 - delta, 8 - delta);
          if (d) { delta += d; applyFx({ aff: { [aid]: d } }, true); affBadge(bubble, d); updAff(); }
          save();
        } catch (e) {
          history.pop();
          const code = e?.code;
          if (code === 'cancelled' || closed) return;
          bubble.classList.remove('think');
          if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) {
            AI_OFF = true; bubble.parentNode?.remove(); used--; busy = false;
            topicsMode(['지금은 자유 대화를 쓸 수 없어요', '대신 준비된 이야기 주제로 대화를 이어가요. 호감도는 똑같이 오르내려요.']);
            return;
          }
          used--; left();
          bubble.textContent = e?.text || '';
          addMsg('sys', code === 'rate_limited' ? '잠시 후 다시 말을 걸어 주세요. (사용량 제한)' : code === 'refused' ? '그 말에는 대답하지 않았다. 다른 이야기를 해 보세요.' : '답을 받지 못했습니다. 다시 보내 보세요.');
          if (!e?.text) bubble.parentNode?.remove();
        } finally {
          busy = false; btn.disabled = false;
        }
        if (closed) return;
        if (used >= max) { addMsg('sys', '대화가 자연스럽게 마무리되었다.'); doneBtn('계속'); }
        else if (matchMedia('(pointer: fine)').matches) inp.focus();
      };
    }
    if (SAMPLE && !AI_OFF) aiMode();
    else topicsMode(AI_OFF ? ['지금은 자유 대화를 쓸 수 없어요', '준비된 이야기 주제를 골라 대화를 이어가요.'] : ['이야기 주제를 골라 보세요', '이 화면에서는 준비된 주제로 대화해요. 고른 말에 따라 호감도가 달라져요.']);
  });
}

/* ---------------- endings ---------------- */
function pickAutoEnding() {
  for (const r of P.endingRules || []) if (P.endings[r.id] && cond(r.if)) return r.id;
  return Object.keys(P.endings || {})[0];
}
function splitSentences(t) {
  const out = [];
  for (const para of String(t).split(/\n+/)) {
    const parts = para.match(/[^.!?。…]+(?:[.!?。…]+["'”’」』)]*|$)/g) || [para];
    let buf = '';
    for (const p of parts.map(x => x.trim()).filter(Boolean)) { buf = buf ? buf + ' ' + p : p; if (buf.length > 14) { out.push(buf); buf = ''; } }
    if (buf) out.push(buf);
  }
  return out.length ? out : [String(t)];
}
function showEnding(id) {
  if (id === 'auto') id = pickAutoEnding();
  const e = P.endings?.[id] || { title: '막이 내리다', rank: '', t: '이야기는 여기서 끝났다.' };
  HOOK.music?.(null); HOOK.sfx?.('ending');
  const got = store.get('unmyeong-endings', {});
  const isNew = !(got[P.id] || {})[id];
  if (P.endings?.[id]) { (got[P.id] = got[P.id] || {})[id] = Date.now(); store.set('unmyeong-endings', got); }
  store.del(saveKey(P.id));
  S.done = true;
  RUN = {};
  closeSheet(); cleanupOverlays();
  const scr = $('#ending'); scr.hidden = false; $('#stage').hidden = true; scr.classList.remove('all'); scr.scrollTop = 0;
  const total = Object.keys(P.endings || {}).length, have = Object.keys(got[P.id] || {}).filter(k => P.endings[k]).length;
  const title = interp(e.title);
  const tl = [...title].map((ch, i) => `<span style="animation-delay:${(1.5 + i * .05).toFixed(2)}s">${esc(ch)}</span>`).join('');
  let d = 2.3;
  const lines = splitSentences(interp(e.t)).map(s => { const x = `<p style="--d:${d.toFixed(2)}s">${esc(s)}</p>`; d += Math.min(1.2, .45 + s.length * .02); return x; }).join('');
  const bg = bgCSS(e.bg || S.stage.bg || 'black');
  scr.innerHTML = `<div class="eb" style="background-image:${bg.replace(/"/g, '&quot;')}"></div><div class="vig"></div>
    ${e.c && P.chars[e.c] ? `<div class="end-char"><div class="cb">${portrait(e.c, e.e || 'smile')}</div></div>` : ''}
    <div class="et"><div class="card2">
      <span class="rank">ENDING${e.rank ? ' · ' + esc(e.rank) : ''}</span>
      <h2>${tl}</h2>
      <div class="epi">${lines}</div>
      ${e.rank ? `<div class="stamp" data-r="${esc(e.rank)}" style="--d:${d.toFixed(2)}s">${esc(e.rank)}<small>RANK</small></div>` : ''}
      <span class="sub later" style="--d:${(d + .5).toFixed(2)}s">수집한 엔딩 ${have} / ${total}${isNew && P.endings?.[id] ? ' · 새 엔딩 발견!' : ''}</span>
      <div class="row2 later" style="--d:${(d + .8).toFixed(2)}s"><button class="ghost" type="button" data-a="title">타이틀로</button><button class="cta" type="button" data-a="again">다시 시작</button></div>
      <div class="tapmore later" style="--d:1.5s">화면을 탭하면 바로 모두 보여요</div>
    </div></div>`;
  const toEnd = () => { if (!scr.hidden) scr.scrollTo({ top: scr.scrollHeight, behavior: REDUCE ? 'auto' : 'smooth' }); };
  const stampT = setTimeout(() => HOOK.sfx?.('stamp'), d * 1000);
  const scrollT = setTimeout(toEnd, (d + 1) * 1000);   // bring the buttons into view on short screens
  scr.onclick = ev => { if (ev.target.closest('[data-a]')) return; if (!scr.classList.contains('all')) { scr.classList.add('all'); clearTimeout(stampT); clearTimeout(scrollT); HOOK.sfx?.('stamp'); setTimeout(toEnd, 60); } };
}

/* ---------------- sim: hub, planner, month ---------------- */
const HUBPREV = {};
const EV_WORDS = [[/bday|birthday/, '생일'], [/festival|fest\b|matsuri/, '축제'], [/exam|test|eval|midterm/, '시험 · 평가'], [/award|bonsang|baeksang|daesang/, '시상식'],
  [/xmas|christmas/, '크리스마스'], [/newyear|new_year|^y\d+$/, '새해'], [/ball|party|prom/, '무도회 · 파티'], [/audition/, '오디션'], [/debut/, '데뷔'], [/concert/, '공연'],
  [/summer/, '여름 이벤트'], [/trip|travel|camp/, '여행'], [/tournament|contest|match/, '대회'], [/valentine/, '밸런타인'], [/final_eve|last/, '마지막 달'], [/school_first|entrance/, '입학']];
function eventLabel(ev) {
  if (ev.label) return interp(ev.label);
  const sc = P.scenes?.[ev.scene];
  const t = (sc || []).slice(0, 8).find(s => s && typeof s === 'object' && s.title);
  if (t) return interp(t.sub || t.title);
  for (const [re, w] of EV_WORDS) if (re.test(ev.id)) return w;
  return '';
}
function hubGoals() {
  const sim = P.sim, out = [], t0 = S.turn, unit = sim.unit === 'week' ? '주' : '달';
  try {
    for (let k = 0; k <= 3 && out.length < 2; k++) {
      S.turn = t0 + k;
      if (S.turn >= sim.turns) break;
      const found = [];
      for (const ev of sim.events || []) {
        if (out.find(o => o.label === eventLabel(ev))) continue;
        if (ev.once !== false && S.evFired[ev.id]) continue;
        if (!/"(turn|age|month)"/.test(JSON.stringify(ev.if || {}))) continue;
        if (k === 0 && (ev.at || 'end') === 'start') continue;
        const label = eventLabel(ev); if (!label) continue;
        if (!cond(ev.if)) continue;
        found.push({ label, k, prio: ev.prio || 0 });
      }
      found.sort((a, b) => b.prio - a.prio);
      for (const f of found) if (out.length < 2 && !out.find(o => o.label === f.label)) out.push(f);
    }
  } finally { S.turn = t0; }
  const items = out.map(o => ({ t: o.label, when: o.k === 0 ? `이번 ${unit}` : `${o.k}${unit} 뒤`, cls: '' }));
  const stress = S.v.stress ?? 0;
  if (stress >= 60) items.unshift({ t: `스트레스 ${Math.round(stress)} — 휴식을 넣어 주세요`, when: '', cls: 'warn' });
  const mk = sim.money || 'money';
  if ((S.v[mk] ?? 0) < 0) items.unshift({ t: `${varName(mk)}이 바닥났어요 — 수입 활동이 필요해요`, when: '', cls: 'warn' });
  if (!items.length) {
    const best = (P.stats || []).filter(s => s.id !== 'stress').sort((a, b) => (S.v[b.id] ?? 0) - (S.v[a.id] ?? 0))[0];
    const remain = sim.turns - S.turn;
    items.push({ t: best && (S.v[best.id] ?? 0) > 0 ? `${best.name} ${Math.round(S.v[best.id])} — 지금 가장 뛰어난 능력` : '일정을 짜서 능력을 키워 보세요', when: '', cls: '' });
    if (remain <= 6) items.push({ t: `엔딩까지 ${remain}${unit}`, when: '', cls: 'warn' });
  }
  return items.slice(0, 3);
}
function showHub() {
  S.mode = 'hub';
  save();
  RUN = {};
  const st = $('#stage'); st.hidden = false; $('#title').hidden = true; $('#ending').hidden = true;
  $('#box').hidden = true; $('#choices').hidden = true; $('#chars').innerHTML = ''; $('#vn-top').hidden = true;
  ['#card', '#play', '#mflip'].forEach(s => $(s)?.remove());
  document.body.dataset.genre = themeOf(P);
  const sim = P.sim, id = hubCharId();
  const night = sim.hubBgNight && (S.turn % 3 === 2);
  const bg = night ? sim.hubBgNight : (sim.hubBg || 'black');
  if (BG_LAST !== bg) setBg(bg, 'instant');
  S.stage.bg = bg; S.stage.chars = [];
  const old = $('#hubl'); if (old) old.remove();
  const hub = el('div', ''); hub.id = 'hubl';
  const d = simDate();
  const prev = HUBPREV[P.id] || {};
  const hud = (sim.hud || []).map(k => {
    const v = S.v[k] ?? 0; const warn = (k === 'stress' && v >= 70) || (k === sim.money && v < 0);
    const from = prev[k] != null ? prev[k] : Math.round(v);
    return `<span class="hud ${warn ? 'warn' : ''}" data-k="${esc(k)}"><span class="k">${esc(varName(k))}</span><b>${from.toLocaleString()}</b></span>`;
  }).join('');
  const stress = S.v.stress ?? 0;
  const mood = stress >= 80 ? 'tired' : stress >= 55 ? 'worried' : (S.aff[affId(id)] ?? 0) >= 60 ? 'smile' : 'neutral';
  const remain = sim.turns - S.turn;
  const chatDone = S.hubChatTurn === S.turn;
  const goals = hubGoals();
  const dock = [
    `<button class="dbtn" type="button" data-a="chat" ${chatDone ? 'aria-disabled="true" style="opacity:.55"' : ''}>${ic('chat')}대화</button>`,
    `<button class="dbtn" type="button" data-a="stats">${ic('stats')}상태</button>`,
    sim.shop?.length ? `<button class="dbtn" type="button" data-a="shop">${ic('shop')}상점</button>` : `<button class="dbtn" type="button" data-a="log">${ic('log')}기록</button>`,
    `<button class="dbtn" type="button" data-a="flow">${ic('flow')}흐름</button>`,
    `<button class="dbtn go" type="button" data-a="plan">일정 짜기<small>${esc(dateLabel(d))}</small></button>`,
  ].map((h, i) => h.replace('<button ', `<button style="--i:${i}" `)).join('');
  hub.innerHTML = `
    <div class="hubtop">
      <div class="topbar">
        <button class="ibtn" type="button" data-a="menu" aria-label="메뉴">${ic('menu')}</button>
        <span class="date"><b>${esc(dateLabel(d))}</b><small>${sim.ageStart != null ? `${esc(charShort(id))} ${simAge()}세 · ` : ''}남은 ${remain}${sim.unit === 'week' ? '주' : '달'}</small></span>
        <span class="sp"></span><div class="chip-hud">${hud}</div>
      </div>
      <div class="goalc" role="note"><span class="eb">${ic('target')}이번 ${sim.unit === 'week' ? '주' : '달'} 목표</span><ul>${goals.map(g => `<li class="${g.cls}"><i></i><span>${esc(g.t)}</span>${g.when ? `<small>${esc(g.when)}</small>` : ''}</li>`).join('')}</ul></div>
    </div>
    ${stress >= 70 ? `<div class="bubble">${esc(charShort(id))}의 얼굴에 피로가 가득하다. 쉬게 해 주는 게 좋겠다.</div>` : ''}
    <div class="hubchar" data-a="chat" role="button" tabindex="0" aria-label="${esc(charShort(id))}와 대화"><div class="cb">${portrait(id, mood)}</div></div>
    <nav class="dock">${dock}</nav>`;
  st.appendChild(hub);
  hub.querySelectorAll('.hud[data-k]').forEach(h => {
    const k = h.dataset.k, to = Math.round(S.v[k] ?? 0), from = prev[k];
    if (from != null && from !== to) { setTimeout(() => { countUp(h.querySelector('b'), from, to); h.classList.add('bump'); }, 350); }
  });
  HUBPREV[P.id] = Object.fromEntries((sim.hud || []).map(k => [k, Math.round(S.v[k] ?? 0)]));
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
  if (!it || (S.v[mk] ?? 0) < it.price || (it.once && S.bought[it.id])) return;
  S.v[mk] -= it.price; if (it.once) S.bought[it.id] = 1;
  applyFx(it.fx, true); toast(`${esc(it.name)} 구입`); HOOK.sfx?.('select');
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
function openPlanner(fresh) {
  const sim = P.sim;
  const usable = c => sim.activities.some(a => a.cat === c && (!a.req || cond(a.req)));
  if (PLAN.slots.length !== sim.slots) { PLAN.slots = Array(sim.slots).fill(null); PLAN.cur = 0; }
  PLAN.slots = PLAN.slots.map(id => (id && sim.activities.find(a => a.id === id) ? id : null));
  const cats = [...new Set(sim.activities.map(a => a.cat))];
  if (!PLAN.cat || !cats.includes(PLAN.cat) || (fresh && !usable(PLAN.cat))) PLAN.cat = cats.find(usable) || cats[0];
  const mk = sim.money || 'money';
  const cost = PLAN.slots.reduce((n, id) => n + (id ? (sim.activities.find(a => a.id === id).cost || 0) : 0), 0);
  const money = S.v[mk] ?? 0;
  const names = sim.slotNames || Array.from({ length: sim.slots }, (_, i) => `${i + 1}`);
  const acts = sim.activities.filter(a => a.cat === PLAN.cat);
  const ready = PLAN.slots.every(Boolean);
  const broke = cost > 0 && money - cost < 0;   // free or income-only plans are always allowed, even in debt
  const goal = hubGoals()[0];
  sheet(`${dateLabel(simDate())} 일정`, `
    ${goal ? `<div class="sub" style="letter-spacing:0">목표 · ${esc(goal.t)}${goal.when ? ` (${esc(goal.when)})` : ''}</div>` : ''}
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
const ACT_IC = {
  book: '<path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z"/><path d="M4 20.5A2.5 2.5 0 016.5 18H20v3H6.5"/>',
  sword: '<path d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path d="M5 17l-2 4 4-2M8 13l3 3"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c0-1.2-1.1-2-2.5-2s-2.5.8-2.5 2 1.1 1.7 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.8-2.5-2M12 6v1.5M12 16.5V18"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
  heart: ICON.heart,
  pray: '<path d="M12 3v6M9 6h6"/><path d="M5 21v-6a7 7 0 0114 0v6z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
};
function actKind(a) {
  const s = `${a.cat || ''} ${a.name || ''}`;
  const rules = [[/휴식|쉬|잠|여행|휴가|놀|산책/, 'moon'], [/알바|아르바이트|일하|장사|노동|부업|수입|벌이|행사/, 'coin'], [/노래|음악|보컬|악기|춤|댄스|무대|예술|그림|미술|작곡|연기/, 'music'],
    [/무술|검|훈련|전투|체력|운동|사냥|기사|무공|수련/, 'sword'], [/신앙|교회|기도|명상|성당|신전/, 'pray'], [/사교|데이트|만남|팬|교류|친구|예절/, 'heart'], [/교육|공부|수업|학|독서|시험|마법|강의|언어/, 'book']];
  for (const [re, k] of rules) if (re.test(s)) return k;
  return 'star';
}
async function runPlan() {
  if ($('#play')) return;   // already playing a month
  RUN = {};
  const sim = P.sim, s0 = S;
  const alive = () => S === s0 && !S.done && !$('#stage').hidden;   // the player may leave for the title or load a slot mid-month
  const acts = PLAN.slots.map(id => sim.activities.find(x => x.id === id));
  if (!acts.length || acts.some(a => !a)) { PLAN.slots = []; openPlanner(); return; }
  closeSheet();
  const hub = $('#hubl');
  if (hub) { hub.querySelector('.dock').style.visibility = 'hidden'; const g = hub.querySelector('.goalc'); if (g) g.style.visibility = 'hidden'; }
  const names = sim.slotNames || [];
  const mk = sim.money || 'money';
  const before = { v: { ...S.v }, aff: { ...S.aff } };
  const layer = el('div', ''); layer.id = 'play'; $('#stage').appendChild(layer);
  let skip = false;
  layer.onclick = () => { skip = true; };
  for (let i = 0; i < acts.length; i++) {
    if (!alive()) { layer.remove(); return; }
    const a = acts[i], kind = actKind(a);
    const dots = acts.map((_, j) => `<i class="${j < i ? 'done' : j === i ? 'cur' : ''}"></i>`).join('');
    layer.innerHTML = `<div class="pc"><div class="pdots">${dots}</div><div class="picon k-${kind}"><svg viewBox="0 0 24 24" aria-hidden="true">${ACT_IC[kind]}</svg></div><span class="sub">${esc(names[i] || `${i + 1}번째`)}</span><h4>${esc(a.name)}</h4><div class="res">${esc(interp(rnd(a.lines?.length ? a.lines : [a.desc || '…'])))}</div><div class="prog"><i></i></div><div class="fx-out"></div></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { const bar = layer.querySelector('.prog i'); if (bar) bar.style.width = '100%'; }));
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
        for (const [k, d] of Object.entries(a.fx?.v || {})) half.v[k] = k === 'stress' ? d : d > 0 ? Math.floor(d / 2) : d;
        notes = applyFx(Object.assign({}, a.fx, half), true); text = '집중하지 못해 성과가 절반에 그쳤다.';
      }
    } else {
      notes = applyFx(a.fx, true);
      if (a.great && roll > 1 - greatP) { tag = '<span class="tag great">대성공</span>'; notes = notes.concat(applyFx(a.great.fx, true)); text = a.great.t || ''; HOOK.sfx?.('great'); }
    }
    if (a.cost) notes.unshift({ k: varName(mk), d: -a.cost, bad: a.cost > 0 });
    const out = layer.querySelector('.fx-out');
    if (out) out.innerHTML = `${tag} ${text ? `<p style="margin:6px 0 0">${esc(interp(text))}</p>` : ''}<div class="fxs" style="margin-top:6px">${notes.map((n, j) => `<span style="animation-delay:${j * 70}ms">${fxNote(n)}</span>`).join('')}</div>`;
    if (!skip) {
      const pc = layer.querySelector('.pc')?.getBoundingClientRect();
      if (pc) notes.filter(n => !n.heart && n.k !== varName(mk)).slice(0, 4).forEach((n, j) => floatUp(pc.left + pc.width / 2 + (j % 2 ? 64 : -64), pc.top - 8 - Math.floor(j / 2) * 26, `${n.k} ${n.d > 0 ? '+' : ''}${n.d}`, 'stat' + (n.bad ? ' bad' : ''), j * 170));
      if (notes.some(n => n.heart && n.d > 0) && pc) burst(pc.left + pc.width / 2, pc.top + 30, notes.find(n => n.heart && n.d > 0).d);
    }
    await sleep(skip ? 250 : 1350);
  }
  if (!alive()) { layer.remove(); return; }
  if (sim.turnFx) applyFx(sim.turnFx, true);
  PLAN.slots = [];
  S.queue = ['@end', '@advance', '@start'];
  save();   // effects are committed; a reload resumes with the month's events
  await resultCard(layer, before);
  layer.remove();
  if (!alive()) return;
  flow();
}
function resultCard(layer, before) {
  return new Promise(res => {
    const sim = P.sim, rows = [];
    for (const s of P.stats || []) {
      const a = before.v[s.id] ?? 0, b = S.v[s.id] ?? 0, d = Math.round((b - a) * 10) / 10;
      if (d) rows.push({ n: s.name, a, b, max: s.max ?? 100, color: s.color || 'var(--accent)', d, bad: s.id === 'stress' ? d > 0 : d < 0 });
    }
    for (const k of sim.hud || []) {
      if (statDef(k)) continue;
      const a = before.v[k] ?? 0, b = S.v[k] ?? 0, d = Math.round(b - a);
      if (d) rows.push({ n: varName(k), a, b, d, bad: k === 'stress' ? d > 0 : d < 0, noBar: true });
    }
    for (const [id, b] of Object.entries(S.aff)) {
      const d = b - (before.aff[id] ?? 0);
      if (d && charDef(id)) rows.push({ n: '♥ ' + charShort(id), a: before.aff[id] ?? 0, b, max: 100, color: 'var(--heart)', d, bad: d < 0 });
    }
    const unitNext = sim.unit === 'week' ? '다음 주로' : '다음 달로';
    const pct = (x, m) => clamp(x / m * 100, 0, 100).toFixed(1);
    layer.onclick = null;
    layer.innerHTML = `<div class="pc result"><span class="sub" style="text-align:center">${esc(dateLabel(simDate()))}</span><h4 style="text-align:center">이번 ${sim.unit === 'week' ? '주' : '달'} 결과</h4>
      <div class="rrows">${rows.length ? rows.map((r, i) => r.noBar
        ? `<div class="rr noline" style="--i:${i}"><span>${esc(r.n)}</span><b data-a0="${Math.round(r.a)}" data-b0="${Math.round(r.b)}">${Math.round(r.a).toLocaleString()}</b><em class="${r.bad ? 'dn' : 'up'}">${r.d > 0 ? '+' : ''}${r.d.toLocaleString()}</em></div>`
        : `<div class="rr" style="--i:${i}"><span>${esc(r.n)}</span><span class="t"><i class="ghostbar" style="width:${pct(Math.max(r.a, r.b), r.max)}%"></i><i class="real" style="width:${pct(r.a, r.max)}%;background:${r.color}" data-w="${pct(r.b, r.max)}"></i></span><b data-a0="${Math.round(r.a)}" data-b0="${Math.round(r.b)}">${Math.round(r.a)}</b><em class="${r.bad ? 'dn' : 'up'}">${r.d > 0 ? '+' : ''}${r.d}</em></div>`).join('')
      : '<p class="sub" style="text-align:center;letter-spacing:0">큰 변화 없이 조용히 지나갔다.</p>'}</div>
      <button class="cta" type="button" id="res-next">${unitNext}</button></div>`;
    HOOK.sfx?.('result');
    setTimeout(() => {
      layer.querySelectorAll('.rr').forEach((r, i) => setTimeout(() => {
        const bar = r.querySelector('i.real'); if (bar) bar.style.width = bar.dataset.w + '%';
        const b = r.querySelector('b'); countUp(b, +b.dataset.a0, +b.dataset.b0, 800);
      }, 250 + i * 80));
    }, 60);
    let done = false;
    const go = () => { if (done) return; done = true; res(); };
    layer.querySelector('#res-next').onclick = e => { e.stopPropagation(); go(); };
  });
}
function monthFlip() {
  return new Promise(res => {
    if (UIS.skip || REDUCE || !P.sim || $('#stage').hidden) return res();
    const wk = P.sim.unit === 'week';
    const a = simDate(S.turn - 1), b = simDate(S.turn);
    const big = x => (wk ? x.w : x.m), lbl = x => (wk ? `${x.m}월 ${x.w}주` : `${x.m}월`);
    const ov = el('div', '', `<div class="cal"><div class="ch-t">${esc(dateLabel(b))}</div><div class="pg"><div class="new"><b>${big(b)}</b><small>${esc(lbl(b))}</small></div><div class="old"><b>${big(a)}</b><small>${esc(lbl(a))}</small></div></div></div>`);
    ov.id = 'mflip'; $('#stage').appendChild(ov);
    setTimeout(() => HOOK.sfx?.('page'), 380);
    let done = false;
    const fin = () => { if (done) return; done = true; ov.classList.add('leave'); setTimeout(() => { ov.remove(); res(); }, 420); };
    ov.onclick = e => { e.stopPropagation(); fin(); };
    setTimeout(fin, 1500);
  });
}
function pickEvent(at) {
  const evs = (P.sim.events || []).filter(ev => (ev.at || 'end') === at && !(ev.once !== false && S.evFired[ev.id]) && P.scenes[ev.scene] && cond(ev.if));
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
    if (q === '@end' || q === '@start') { if (P.sim) { const ev = pickEvent(q.slice(1)); if (ev) startScene(ev.scene); } }
    else if (q === '@advance') {
      S.turn++;
      if (S.turn >= P.sim.turns) { S.queue = ['@final']; if (P.scenes[P.sim.finale]) startScene(P.sim.finale); }
      else { const tk = RUN; await monthFlip(); if (RUN !== tk) return; }
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
    card.innerHTML = `<h3>${esc(label)}</h3><input id="ask-input" maxlength="12" value="${esc(def)}" aria-label="${esc(label)}" enterkeyhint="done"><p>비워 두면 기본 이름 「${esc(def)}」로 시작해요.</p><button class="cta" type="button" id="ask-ok">확인</button>`;
    m.hidden = false;
    const inp = card.querySelector('input'); setTimeout(() => { inp.focus(); inp.select(); }, 30);
    const ok = () => { m.hidden = true; res(inp.value.trim().slice(0, 12) || def); };
    card.querySelector('#ask-ok').onclick = ok;
    inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}
function confirmBox(title, msg, okLabel = '확인') {
  return new Promise(res => {
    modal(`<h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="row2"><button class="ghost" type="button" id="cf-no">취소</button><button class="cta" type="button" id="cf-ok">${esc(okLabel)}</button></div>`);
    const card = $('#modal-card');
    card.querySelector('#cf-ok').onclick = e => { e.stopPropagation(); closeModal(); res(true); };
    card.querySelector('#cf-no').onclick = e => { e.stopPropagation(); closeModal(); res(false); };
  });
}
function modal(html) { const m = $('#modal'); $('#modal-card').innerHTML = html; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; }

/* ---------------- title ---------------- */
const WAR_URL = 'https://claude.ai/artifact/KH8CkrabZAM1cBs4kyLNa7';
let TITLE_INTRO = false;
let FILTER = store.get('unmyeong-filter', '전체');
const COVER = new Map();
const packList = () => STORY.order.map(id => STORY.packs[id]).filter(p => p && p.title);
function ago(t) {
  if (!t) return '';
  const s = (Date.now() - t) / 1000;
  if (s < 90) return '방금 전';
  if (s < 3600) return `${Math.round(s / 60)}분 전`;
  if (s < 86400) return `${Math.round(s / 3600)}시간 전`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}일 전`;
  const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
function saveInfo(p, sv) {
  return withPack(p, migrate(JSON.parse(JSON.stringify(sv))), () => {
    let where = '', pct = null, faceId = p.cover?.c;
    if (p.sim) {
      const unit = p.sim.unit === 'week' ? '주' : '달';
      where = `${dateLabel(simDate(S.turn || 0))} · 남은 ${p.sim.turns - (S.turn || 0)}${unit}`;
      pct = clamp(Math.round((S.turn || 0) / p.sim.turns * 100), 2, 100);
      try { faceId = hubCharId(); } catch { /* keep cover */ }
    } else {
      const ch = S.chapters[S.chapters.length - 1];
      const last = S.log.slice().reverse().find(l => l.t && !l.t.startsWith('▸'));
      where = ch ? `${S.chapters.length}장째 · ${ch.sub || ch.t}` : last ? last.t.slice(0, 30) : '프롤로그';
      faceId = S.stage.chars[S.stage.chars.length - 1]?.id || faceId;
    }
    const face = faceId && p.chars?.[faceId] ? portrait(faceId, 'smile', 'face') : '';
    return { where, pct, face, when: ago(sv.savedAt) };
  });
}
function showTitle() {
  RUN = {}; closeSheet(); closeModal(); cleanupOverlays();
  HOOK.music?.('title');
  delete document.body.dataset.genre;
  $('#stage').hidden = true; $('#ending').hidden = true; $('#title').hidden = false;
  if (!TITLE_INTRO && !REDUCE) {
    const cu = el('div', '', '<i></i><i></i><b></b>'); cu.id = 'curtain'; document.body.appendChild(cu);
    setTimeout(() => cu.remove(), 2600);
  }
  TITLE_INTRO = true;
  if (!FILTERS.includes(FILTER)) FILTER = '전체';
  renderResume(); renderFilters(); renderBills();
  $('#foot').textContent = SAMPLE ? '인물과의 대화는 Claude가 그 인물이 되어 답합니다. 첫 대화 때 사용 허락을 묻습니다.' : '대화 장면에서는 준비된 대화 주제를 고릅니다. 진행은 이 브라우저에 자동 저장돼요.';
}
function renderResume() {
  const box = $('#resume');
  const saves = packList().map(p => ({ p, sv: store.get(saveKey(p.id), null) })).filter(x => x.sv && !x.sv.done && x.sv.stack)
    .sort((a, b) => (b.sv.savedAt || 0) - (a.sv.savedAt || 0));
  if (!saves.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<div class="sec-h"><h3>이어하기</h3><small>최근에 플레이한 순서</small></div><div class="rs-list">${saves.map(({ p, sv }, i) => {
    let info; try { info = saveInfo(p, sv); } catch (err) { console.error(err); info = { where: '', when: '', face: '', pct: null }; }
    return `<button class="rcard" type="button" data-a="continue" data-v="${esc(p.id)}" style="--i:${i}"><span class="face">${info.face}</span><span class="ri"><b>${esc(p.title)}</b><small>${esc(info.where)}</small><small>${esc(info.when)}</small>${info.pct != null ? `<span class="pbar"><i style="width:${info.pct}%"></i></span>` : ''}</span><span class="go">이어하기</span></button>`;
  }).join('')}</div>`;
}
function renderFilters() {
  const packs = packList();
  const count = f => f === '전체' ? packs.length + 1 : f === '전략' ? packs.filter(p => packTags(p).includes(f)).length + 1 : packs.filter(p => packTags(p).includes(f)).length;
  $('#filters').innerHTML = FILTERS.map(f => `<button class="fchip ${f === FILTER ? 'on' : ''}" type="button" data-a="filter" data-v="${esc(f)}" aria-pressed="${f === FILTER}">${esc(f)}<small>${count(f)}</small></button>`).join('');
}
function renderBills() {
  const bills = $('#bills'); bills.innerHTML = '';
  let i = 0;
  for (const p of packList().filter(p => FILTER === '전체' || packTags(p).includes(FILTER))) {
    try { bills.appendChild(billCard(p, i++)); } catch (err) { console.error('pack card', p.id, err); }
  }
  if (FILTER === '전체' || FILTER === '전략') {
    const war = el('a', 'bill war', `<span class="shine"></span><span class="art">WAR</span><span class="txt"><span class="g">전략 시뮬레이션</span><h2>한반도 대전략</h2><p>독재자가 되어 세계를 상대로 전쟁을 벌이는 턴제 전략 게임. 별도 페이지에서 열립니다.</p><span class="bact"><span class="bbtn alt" style="display:grid;place-items:center">새 탭에서 열기</span></span></span>`);
    war.href = WAR_URL; war.target = '_blank'; war.rel = 'noopener'; war.dataset.g = 'war'; war.style.setProperty('--i', i++);
    bills.appendChild(war);
  }
  if (!bills.children.length) bills.innerHTML = '<p class="empty-f">이 장르의 작품은 곧 무대에 오릅니다.</p>';
  paintCovers();
}
function billCard(p, i) {
  const id = p.id, theme = themeOf(p), sv = store.get(saveKey(id), null);
  const live = sv && !sv.done && sv.stack;
  const total = Object.keys(p.endings || {}).length;
  const got = Object.keys(store.get('unmyeong-endings', {})[id] || {}).filter(k => p.endings?.[k]).length;
  const b = el('div', 'bill');
  b.dataset.g = theme; b.dataset.a = 'open-pack'; b.dataset.v = id; b.tabIndex = 0;
  b.setAttribute('role', 'button'); b.setAttribute('aria-label', `${p.title} 자세히 보기`);
  b.style.setProperty('--i', i);
  const cv = COVER.get(id);
  b.style.backgroundImage = cv ? cv.bg : (() => { try { return window.ART?.bgGradient?.(p.cover?.bg || 'black') || ''; } catch { return ''; } })();
  const meta = [p.sim ? `${p.sim.turns}${p.sim.unit === 'week' ? '주' : '개월'} 육성` : '분기형 스토리', ...packTags(p).filter(t => t !== '육성').slice(0, 2)];
  b.innerHTML = `<span class="shine"></span>${live ? '<span class="badge">진행 중</span>' : ''}<span class="art">${cv ? cv.art : ''}</span>
    <span class="txt"><span class="g">${esc(p.genre || '')}</span><h2>${esc(p.title)}</h2><p>${esc(p.blurb || p.subtitle || '')}</p>
      <span class="meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}</span>
      <span class="eprog"><span class="t"><i style="width:${total ? got / total * 100 : 0}%"></i></span><span>엔딩 ${got}/${total}</span></span>
      <span class="bact ${live ? 'two' : ''}">${live ? `<button class="bbtn" type="button" data-a="continue" data-v="${esc(id)}">이어하기</button><button class="bbtn alt" type="button" data-a="new" data-v="${esc(id)}">새로 시작</button>` : `<button class="bbtn" type="button" data-a="new" data-v="${esc(id)}">새로 시작</button>`}</span>
    </span>`;
  return b;
}
function coverFor(p) {
  if (COVER.has(p.id)) return COVER.get(p.id);
  const url = bgURL(p.cover?.bg || 'black');
  const bg = url ? `url("${url}")` : '';
  const art = p.cover?.c && p.chars?.[p.cover.c] ? withPack(p, null, () => portrait(p.cover.c, p.cover.e || 'smile')) : '';
  const c = { bg, art }; COVER.set(p.id, c); return c;
}
let PAINT_T = 0;
function paintCovers() {
  clearTimeout(PAINT_T);
  const todo = [...document.querySelectorAll('#bills .bill[data-v]')].filter(b => !b.dataset.painted);
  const next = () => {
    const b = todo.shift(); if (!b) return;
    const p = STORY.packs[b.dataset.v];
    if (p && b.isConnected) {
      try {
        const cached = COVER.has(p.id), c = coverFor(p);
        if (c.bg) b.style.backgroundImage = c.bg;
        const art = b.querySelector('.art'); if (art && !art.innerHTML) art.innerHTML = c.art;
        b.dataset.painted = 1;
        PAINT_T = setTimeout(next, cached ? 0 : 16);
        return;
      } catch (err) { console.error(err); }
    }
    PAINT_T = setTimeout(next, 0);
  };
  PAINT_T = setTimeout(next, 30);
}
function openPack(id) {
  const p = STORY.packs[id]; if (!p) return;
  const sv = store.get(saveKey(id), null), live = sv && !sv.done && sv.stack;
  const c = (() => { try { return coverFor(p); } catch { return { bg: '', art: '' }; } })();
  let info = null; if (live) { try { info = saveInfo(p, sv); } catch { info = null; } }
  modal(`<div class="mhero" style="background-image:${c.bg ? c.bg.replace(/"/g, '&quot;') : 'none'}"><span class="art">${c.art}</span></div>
    <span class="sub">${esc(p.genre || '')}</span>
    <h3>${esc(p.title)}</h3><p>${esc(p.subtitle || '')}</p>
    ${p.blurb ? `<p style="color:#e6dde3;font-size:14.5px;line-height:1.7">${esc(p.blurb)}</p>` : ''}
    ${live ? `${info ? `<div class="sub" style="letter-spacing:0">저장된 진행 · ${esc(info.where)} · ${esc(info.when)}</div>` : ''}<button class="cta" type="button" data-a="continue" data-v="${esc(id)}">이어하기</button>` : ''}
    <button class="${live ? 'ghost' : 'cta'}" type="button" data-a="new" data-v="${esc(id)}">${live ? '처음부터 새로 시작' : '시작하기'}</button>
    ${endingsHTML(p, true)}
    <button class="ghost" type="button" data-a="close-modal">닫기</button>`);
}
async function startNew(id) {
  const sv = store.get(saveKey(id), null);
  if (sv && !sv.done && sv.stack) {
    const ok = await confirmBox('처음부터 시작할까요?', '지금 이어하던 진행(자동 저장)이 사라집니다. 저장 슬롯에 따로 저장한 기록은 그대로 남아요.', '새로 시작');
    if (!ok) return;
  }
  newGame(id);
}
async function newGame(id) {
  P = STORY.packs[id]; if (!P) return;
  closeModal(); PLAN.slots = [];
  document.body.dataset.genre = themeOf(P);
  const name = await askText(interp(P.player?.label || '당신의 이름'), P.player?.def || '나');
  S = newState(P, name);
  PORTRAIT_CACHE.clear(); BG_LAST = '';
  $('#chars').innerHTML = ''; cleanupOverlays();
  startParticles(themeOf(P));
  $('#box').hidden = true;
  startScene(P.start);
  S.queue = [];
  save();
  flow();
}
async function continueGame(id) {
  P = STORY.packs[id]; if (!P) return;
  const sv = store.get(saveKey(id), null);
  if (!sv || sv.done || !sv.stack) return newGame(id);
  closeModal(); closeSheet(); PLAN.slots = [];
  S = migrate(sv);
  REPLAY_NOFX = !!S.replay && S.stack.length > 0; delete S.replay;
  PORTRAIT_CACHE.clear(); BG_LAST = '';
  $('#chars').innerHTML = ''; cleanupOverlays();
  startParticles(themeOf(P));
  if (S.mode === 'hub' && !S.stack.length && !S.queue.length) { showHub(); await recap(); return; }
  showStage(); $('#box').hidden = true;
  const tk = RUN = {};
  await recap();
  if (RUN !== tk) return;
  flow();
}
function recap() {
  return new Promise(res => {
    const lines = (S.log || []).filter(l => l.t && !String(l.t).startsWith('▸')).slice(-4);
    if (!lines.length) return res();
    const ch = S.chapters?.[S.chapters.length - 1];
    const where = P.sim ? dateLabel(simDate()) : '';
    const meta = [ch && ch.sub ? ch.t : '', where, S.savedAt ? ago(S.savedAt) + ' 저장' : ''].filter(Boolean).join(' · ');
    const ov = el('div', '', `<div class="rc" role="dialog" aria-label="지난 이야기"><span class="eb">지난 이야기</span><h3>${esc(ch ? (ch.sub || ch.t) : interp(P.title))}</h3>${meta ? `<span class="meta">${esc(meta)}</span>` : ''}
      <div class="lines">${lines.map((l, i) => `<div style="--i:${i}">${l.n ? `<b>${esc(l.n)}</b>` : ''}${fmt(l.t)}</div>`).join('')}</div>
      <button class="cta" type="button" id="recap-go">이어서 보기</button></div>`);
    ov.id = 'recap'; $('#stage').appendChild(ov);
    let done = false;
    const go = e => { e?.stopPropagation(); if (done) return; done = true; ov.classList.add('leave'); setTimeout(() => { ov.remove(); res(); }, 380); };
    ov.onclick = e => { if (e.target === ov || e.target.id === 'recap-go') go(e); else e.stopPropagation(); };
  });
}

/* ---------------- first-run coach ---------------- */
function coach(force) {
  return new Promise(res => {
    if (!force && store.get('unmyeong-onboard', 0)) return res();
    store.set('unmyeong-onboard', 1);
    $('#coach')?.remove();
    const steps = [
      { sel: '#box:not([hidden]) .inner', h: '탭해서 이야기 넘기기', p: '화면 아무 곳이나 탭하면 다음 대사로 넘어가요. 글자가 나오는 중에 탭하면 한 번에 보여 줘요. 키보드는 스페이스·엔터.', demo: '<span class="tapd"></span>' },
      { sel: null, h: '대화는 직접 입력', p: '대화 장면에서는 인물에게 하고 싶은 말을 직접 써서 보내요. 말에 따라 호감도가 오르내려요. 예시 문장을 눌러 바로 보낼 수도 있어요.', demo: '<span class="fake"><span>오늘 무도회에서 멋졌어</span><b>보내기</b></span>' },
      { sel: '#vn-top:not([hidden]), #hubl .topbar', h: '메뉴 · 저장 · 기록', p: '왼쪽 위 메뉴에서 저장·불러오기, 스토리 흐름, 글자 크기와 소리를 바꿔요. 진행은 자동으로 저장돼요.', demo: `<span class="gest"><span class="sw">${ic('down')}아래로 쓸기<br>지난 대사</span><span>${ic('hand')}길게 누르기<br>그림만 보기</span><span>${ic('eye')}눈 버튼<br>UI 숨기기</span></span>` },
    ];
    const ov = el('div', '', '<div class="spot"></div><div class="tip"></div>');
    ov.id = 'coach'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '조작 안내');
    document.body.appendChild(ov);
    let k = 0;
    const show = () => {
      const s = steps[k], spot = ov.querySelector('.spot'), tip = ov.querySelector('.tip');
      const tgt = s.sel && document.querySelector(s.sel);
      const r = tgt ? tgt.getBoundingClientRect() : null;
      if (r && r.width) spot.style.cssText = `left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px`;
      else spot.style.cssText = `left:${innerWidth / 2}px;top:${innerHeight * .45}px;width:0;height:0`;
      tip.innerHTML = `<div class="demo">${s.demo}</div><h4>${esc(s.h)}</h4><p>${esc(s.p)}</p><div class="foot2"><span class="dots">${steps.map((_, j) => `<i class="${j === k ? 'on' : ''}"></i>`).join('')}</span><button class="cta" type="button" style="width:auto;height:42px;padding:0 20px;font-size:15px">${k === steps.length - 1 ? '시작하기' : '다음'}</button></div>`;
      tip.style.animation = 'none'; void tip.offsetWidth; tip.style.animation = '';
      if (r && r.width && r.top > innerHeight / 2) { tip.style.top = ''; tip.style.bottom = (innerHeight - r.top + 18) + 'px'; }
      else if (r && r.width) { tip.style.bottom = ''; tip.style.top = (r.bottom + 18) + 'px'; }
      else { tip.style.bottom = ''; tip.style.top = Math.max(20, innerHeight * .28) + 'px'; }
    };
    ov.onclick = e => { e.stopPropagation(); k++; if (k >= steps.length) { ov.remove(); res(); } else show(); };
    show();
  });
}

/* ---------------- input wiring ---------------- */
let SUPPRESS_CLICK = false, PRESS = null, WHEEL_T = 0;
function stageBlocked() {
  return !$('#modal').hidden || UIS.sheet || $('#chat') || $('#play') || $('#card') || $('#recap') || $('#coach') || $('#mflip') || !$('#choices').hidden;
}
function canTapAdvance(target) {
  if (!S || S.mode !== 'vn' || $('#stage').hidden || stageBlocked()) return false;
  if (target && target.closest && target.closest('.topbar, button, input, a, .sheet, #hubl')) return false;
  return true;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (!t) {
    if (SUPPRESS_CLICK) { SUPPRESS_CLICK = false; return; }
    if (!e.target.closest('#stage')) return;
    if (document.body.classList.contains('noui')) { setNoUI(false); return; }
    if (canTapAdvance(e.target)) advance();
    return;
  }
  SUPPRESS_CLICK = false;
  const a = t.dataset.a, v = t.dataset.v;
  switch (a) {
    case 'open-pack': openPack(v); break;
    case 'new': e.stopPropagation(); closeModal(); startNew(v); break;
    case 'continue': e.stopPropagation(); continueGame(v); break;
    case 'close-modal': closeModal(); break;
    case 'close-sheet': closeSheet(); break;
    case 'menu': openMenu(); break;
    case 'log': openLog(); break;
    case 'stats': openStats(); break;
    case 'flow': openFlow(); break;
    case 'help': closeSheet(); coach(true); break;
    case 'eye': setNoUI(true); break;
    case 'endings': sheet('엔딩 수집', endingsHTML(P)); break;
    case 'filter': {
      if (v === FILTER) break;
      FILTER = v; store.set('unmyeong-filter', v); renderFilters();
      const cards = [...document.querySelectorAll('#bills .bill')];
      cards.forEach(c => c.classList.add('leave'));
      setTimeout(renderBills, REDUCE ? 0 : 200);
      break;
    }
    case 'auto': UIS.auto = !UIS.auto; UIS.skip = false; renderTop(); if (UIS.auto && !UIS.typing) advance(); break;
    case 'skip': UIS.skip = !UIS.skip; UIS.auto = false; renderTop(); if (UIS.skip) advance(); break;
    case 'title': if (S && !S.done) save(S.mode === 'vn'); showTitle(); break;
    case 'again': newGame(P.id); break;
    case 'tier': PREF.tier = v; store.set('unmyeong-pref', PREF); openMenu(); break;
    case 'speed': PREF.speed = +v; store.set('unmyeong-pref', PREF); openMenu(); break;
    case 'tsize': PREF.size = v; store.set('unmyeong-pref', PREF); applyPrefs(); openMenu(); break;
    case 'chat': hubChat(); break;
    case 'shop': openShop(); break;
    case 'buy': buy(+t.dataset.k); break;
    case 'plan': openPlanner(true); break;
    case 'slot': { const k = +t.dataset.k; if (PLAN.slots[k]) PLAN.slots[k] = null; PLAN.cur = k; openPlanner(); break; }
    case 'cat': PLAN.cat = v; PLAN.scroll = 0; openPlanner(); break;
    case 'pick': {
      PLAN.slots[PLAN.cur] = v; HOOK.sfx?.('select');
      const next = PLAN.slots.findIndex(x => !x); PLAN.cur = next < 0 ? PLAN.cur : next;
      openPlanner(); break;
    }
    case 'run-plan': runPlan(); break;
    default: HOOK.action?.(a, v, t);
  }
});
// keyboard activation for the div-based playbill cards and the hub character
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.bill[data-a], .hubchar[data-a]')) { e.preventDefault(); e.target.click(); }
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#coach')) { $('#coach').click(); return; }
    if (UIS.sheet) closeSheet(); else if (!$('#modal').hidden) closeModal(); else if (document.body.classList.contains('noui')) setNoUI(false);
    return;
  }
  if ($('#stage').hidden || UIS.sheet || !$('#modal').hidden || $('#chat') || e.target.matches?.('input, textarea')) return;
  if (document.body.classList.contains('noui')) { setNoUI(false); return; }
  const ch = $('#choices');
  if (!ch.hidden && /^[1-9]$/.test(e.key)) { const opts = [...ch.querySelectorAll('.opt:not([disabled])')]; opts[+e.key - 1]?.click(); return; }
  if (!canTapAdvance(null)) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
  else if (e.key === 'h' || e.key === 'H') setNoUI(true);
  else if (e.key === 'ArrowUp' || e.key === 'PageUp') openLog();
});
(() => {
  const stage = $('#stage');
  stage.addEventListener('scroll', () => { if (stage.scrollLeft || stage.scrollTop) { stage.scrollLeft = 0; stage.scrollTop = 0; } });
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const noui = document.body.classList.contains('noui');
    if (!noui && !canTapAdvance(e.target)) return;
    const p = { x: e.clientX, y: e.clientY, long: false, t: 0 };
    if (!noui) p.t = setTimeout(() => { if (PRESS === p) { p.long = true; setNoUI(true); SUPPRESS_CLICK = true; } }, 560);
    PRESS = p;
  });
  stage.addEventListener('pointermove', e => {
    if (PRESS && Math.hypot(e.clientX - PRESS.x, e.clientY - PRESS.y) > 12) clearTimeout(PRESS.t);
    if (e.pointerType === 'mouse' && !REDUCE) {   // parallax tilt
      stage.style.setProperty('--px', ((e.clientX / innerWidth - .5) * 2).toFixed(3));
      stage.style.setProperty('--py', ((e.clientY / innerHeight - .5) * 2).toFixed(3));
    }
  });
  const end = e => {
    const p = PRESS; PRESS = null; if (!p) return;
    clearTimeout(p.t);
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.long && dy > 70 && Math.abs(dx) < dy * .7 && canTapAdvance(e.target)) { SUPPRESS_CLICK = true; openLog(); }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', () => { if (PRESS) clearTimeout(PRESS.t); PRESS = null; });
  stage.addEventListener('wheel', e => {
    if (!canTapAdvance(e.target) || document.body.classList.contains('noui')) return;
    const now = Date.now(); if (now - WHEEL_T < 320) return;
    if (e.deltaY < -20) { WHEEL_T = now; openLog(); } else if (e.deltaY > 20) { WHEEL_T = now; advance(); }
  }, { passive: true });
  // title: playbill hover tilt & shine
  const bills = $('#bills');
  const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hover && !REDUCE) {
    bills.addEventListener('pointermove', e => {
      const b = e.target.closest('.bill'); if (!b) return;
      const r = b.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      b.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg'); b.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
      b.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); b.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    bills.addEventListener('pointerout', e => {
      const b = e.target.closest('.bill'); if (!b || b.contains(e.relatedTarget)) return;
      b.style.setProperty('--ry', '0deg'); b.style.setProperty('--rx', '0deg');
    });
  }
})();

/* ---------------- boot ---------------- */
function boot() {
  applyPrefs();
  if (window.claude?.use) {
    window.claude.use('sample').then(fn => { SAMPLE = fn || null; if (!$('#title').hidden) $('#foot').textContent = SAMPLE ? '인물과의 대화는 Claude가 그 인물이 되어 답합니다. 첫 대화 때 사용 허락을 묻습니다.' : '대화 장면에서는 준비된 대화 주제를 고릅니다.'; }).catch(() => { SAMPLE = null; });
  }
  showTitle();
}
