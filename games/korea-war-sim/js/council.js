// 한반도 대전략 — 집무실 (war office): visual-novel decision scenes, minister portraits, advisor chat.
// Presentation only: every decision still resolves to the same choice index the old modal returned.
'use strict';

const VN_EMOS = ['neutral', 'smile', 'laugh', 'sad', 'cry', 'angry', 'surprised', 'shy', 'smirk', 'cold', 'worried', 'tired'];
const VN = {
  cur: null, el: null, bg: {}, por: {}, timer: null, chat: null,
  prefs: (() => { try { return JSON.parse(localStorage.getItem('kws-vn') || '{}') || {}; } catch (e) { return {}; } })(),
  reduced: (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })(),
};
function vnSavePrefs() { try { localStorage.setItem('kws-vn', JSON.stringify(VN.prefs)); } catch (e) {} }
function vnCompact() { return !!VN.prefs.compact; }

// ---------- Claude sampling (artifact runtime). null = scripted advisors ----------
let SAMPLE = null;
try { window.claude?.use?.('sample')?.then(fn => { SAMPLE = fn || null; vnChatRefresh(); }, () => { SAMPLE = null; }); } catch (e) { SAMPLE = null; }
const SAMPLE_OFF = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

// ---------- Korean helpers ----------
const VN_JOSA = { 을: ['을', '를'], 를: ['을', '를'], 이: ['이', '가'], 가: ['이', '가'], 은: ['은', '는'], 는: ['은', '는'], 과: ['과', '와'], 와: ['과', '와'], 으로: ['으로', '로'], 로: ['으로', '로'] };
function josa(word, p) {
  const s = String(word).trim(), pr = VN_JOSA[p];
  if (!pr) return s + p;
  const ch = s.charCodeAt(s.length - 1);
  let b = null;
  if (ch >= 0xAC00 && ch <= 0xD7A3) b = (ch - 0xAC00) % 28;
  else if (/[0-9]$/.test(s)) b = '013678'.includes(s.slice(-1)) ? 1 : 0;
  else if (/%$/.test(s)) b = 0;
  if (b == null) return s + (pr[0] === '으로' ? '(으)로' : `(${pr[0]})${pr[1]}`);
  if (pr[0] === '으로') return s + (b === 0 || b === 8 ? '로' : '으로');
  return s + (b ? pr[0] : pr[1]);
}
function vnFill(t, v) {
  return String(t).replace(/\{([A-Za-z]+)(?::(을|를|이|가|은|는|과|와|으로|로))?\}/g, (_, k, p) => {
    const w = v[k] != null ? String(v[k]) : '';
    return p ? josa(w, p) : w;
  });
}
function vnHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
function vnRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const vnPick = (a, r = Math.random) => a[Math.floor(r() * a.length)];
function vnShort(label) { return String(label).replace(/\s*\([^)]*\)\s*/g, ' ').trim(); }
function vnAddr() {
  const t = G.leader.title, gov = P().gov;
  if (t === '황제' || gov === 'monarchy') return '폐하';
  if (gov === 'oneparty' || ['PRK', 'CHN', 'VNM', 'CUB'].includes(me())) return `${t} 동지`;
  if (gov === 'junta' || gov === 'authoritarian') return '각하';
  return `${t}님`;
}

// ---------- looks: a deterministic ART `look` per minister ----------
const VN_FEMALE = ['혜진', '수영', '경희', '현주', '도모코', '유키', '올가', '파티마', '캐서린', '엘리자베스', '안나', '헬렌'];
const VN_UNIFORM = { PRK: '#4a5a3a', CHN: '#3e5b3c', RUS: '#4e5b40', KOR: '#56613f', USA: '#5d6049', JPN: '#4d5a45', IRN: '#5c5a45', TWN: '#4f5d44', GBR: '#5a573f', FRA: '#3f4f63', DEU: '#4f5548', ISR: '#5e6048', TUR: '#56603f', IND: '#6b6342', PAK: '#4e5e3f', UKR: '#586044', SAU: '#6d6246', EGY: '#6f6446' };
const VN_RED_ACCENT = ['PRK', 'CHN', 'RUS', 'VNM', 'CUB', 'BLR'];
function ministerLook(m, nat = G.player) {
  const r = vnRng(vnHash(`${nat}:${m.id}:${m.name}`));
  const cult = CULTURE[nat] || 'we', gov = G.nations[nat]?.gov || NATIONS[nat].gov;
  const female = VN_FEMALE.some(n => m.name.includes(n));
  const elder = (m.age || 50) >= 61;
  const east = ['ko', 'zh', 'ja'].includes(cult);
  const skin = east ? vnPick(['#f2d4bb', '#eccaaa', '#f5dcc6', '#e8c29f'], r) : cult === 'me' ? vnPick(['#d7a57c', '#c89066', '#b87c55'], r) : vnPick(['#f4d9c8', '#efcfb9', '#e8c3a6', '#c89572', '#8d5a3b'], r);
  const hair = elder ? vnPick(['#8e8b87', '#b9b6b0', '#d6d3cc', '#6d6a66'], r) : east || cult === 'me' ? vnPick(['#1b1714', '#261e19', '#2e2520'], r) : vnPick(['#3b2a1e', '#6b4a2e', '#b99562', '#1c1814', '#8a5a36'], r);
  const military = m.post === 'chief' || (m.post === 'defense' && !(gov === 'democracy' || nat === 'JPN')) || (m.post === 'interior' && ['junta', 'oneparty', 'authoritarian'].includes(gov)) || (m.post === 'intel' && ['junta', 'oneparty'].includes(gov));
  let outfit = military ? 'uniform' : 'suit';
  if (!military && gov === 'theocracy' && m.post === 'interior') outfit = 'priest';
  else if (!military && gov === 'monarchy' && cult === 'me') outfit = 'robe';
  else if (!military && m.post === 'intel' && r() < 0.45) outfit = 'coat';
  const outfitColor = outfit === 'uniform' ? (m.post === 'interior' ? '#2f3a4a' : VN_UNIFORM[nat] || '#4c5842') : outfit === 'priest' ? '#2b2724' : outfit === 'robe' ? vnPick(['#e9e4d8', '#d9d2c2'], r) : vnPick(['#23272e', '#1f2a3a', '#2e2e33', '#3a3530', '#1c2230', '#2a2f28'], r);
  const accent = outfit === 'uniform' ? (VN_RED_ACCENT.includes(nat) ? '#b8322a' : '#c9a24a') : NATIONS[nat].color;
  const acc = [];
  if (outfit === 'uniform') { acc.push('epaulets'); if (m.post === 'chief' || gov === 'junta' ? r() < 0.6 : r() < 0.2) acc.push('hat'); }
  if (m.trait === 'technocrat' || (m.post === 'economy' && r() < 0.5) || r() < 0.18) acc.push('glasses');
  else if (m.trait === 'corrupt' && r() < 0.35) acc.push('monocle');
  if (!female && (cult === 'me' ? r() < 0.85 : outfit === 'priest' ? true : r() < (elder ? 0.35 : 0.12))) acc.push('beard');
  if ((m.trait === 'hawk' && r() < 0.45) || (m.post === 'chief' && r() < 0.2)) acc.push('scar');
  if (r() < 0.12) acc.push('mole');
  if (female && r() < 0.5) acc.push(vnPick(['earrings', 'necklace'], r));
  const eyeShape = { hawk: 'sharp', strategist: 'sharp', ambitious: 'sharp', loyal: 'gentle', corrupt: 'droopy', inept: 'droopy', technocrat: 'round', demagogue: 'round' }[m.trait] || vnPick(['round', 'sharp', 'gentle'], r);
  return {
    sex: female ? 'f' : 'm', age: elder ? 'elder' : 'adult', skin, hair,
    hairStyle: female ? vnPick(elder ? ['bun', 'bob', 'updo'] : ['bob', 'updo', 'bun', 'ponytail'], r) : vnPick(elder ? ['short', 'slick'] : ['short', 'slick', 'short', 'messy'], r),
    bangs: female ? vnPick(['side', 'parted', 'straight'], r) : vnPick(['side', 'parted', 'none'], r),
    eyes: east || cult === 'me' ? vnPick(['#3a2a20', '#2b211b', '#4a3526'], r) : vnPick(['#4a6a8a', '#5a4a3a', '#4a6a4a', '#6a8aa0'], r),
    eyeShape, outfit, outfitColor, accent, acc,
  };
}
const VN_SECRETARY = { name: '비서실장', role: '대통령 비서실', look: { sex: 'f', age: 'adult', skin: '#f2d4bb', hair: '#1b1714', hairStyle: 'updo', bangs: 'side', eyes: '#3a2a20', eyeShape: 'gentle', outfit: 'suit', outfitColor: '#232a36', accent: '#c9a24a', acc: ['glasses'] } };

function vnFallbackSvg(look, emo, crop) {
  const c = look.outfitColor || '#333', sk = look.skin || '#e0c0a0', h = look.hair || '#222';
  const brow = { angry: 'M150 214 L182 224 M250 214 L218 224', worried: 'M150 222 L182 214 M250 222 L218 214', cold: 'M150 218 L182 218 M250 218 L218 218' }[emo] || 'M150 216 Q166 210 182 216 M218 216 Q234 210 250 216';
  const mouth = { smile: 'M180 290 Q200 304 220 290', laugh: 'M178 286 Q200 314 222 286 Z', smirk: 'M184 294 Q206 298 220 286', angry: 'M182 298 Q200 290 218 298', worried: 'M184 298 Q200 292 216 298', sad: 'M182 300 Q200 290 218 300', cold: 'M184 295 L216 295', surprised: 'M192 292 a8 10 0 1 0 16 0 a8 10 0 1 0 -16 0' }[emo] || 'M186 294 Q200 298 214 294';
  const vb = crop ? '100 110 200 200' : '0 0 400 600';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true"><defs><linearGradient id="fbg${h.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#0b0b0d"/></linearGradient></defs>
    <path d="M40 600 C50 440 110 395 200 390 C290 395 350 440 360 600 Z" fill="url(#fbg${h.slice(1)})"/>
    <path d="M170 330 L230 330 L236 400 L200 430 L164 400 Z" fill="${sk}"/>
    <path d="M160 392 L200 470 L240 392 L222 386 L200 430 L178 386 Z" fill="#e8e4dc" opacity=".9"/>
    ${look.acc?.includes('epaulets') ? `<rect x="70" y="420" width="70" height="16" rx="6" fill="${look.accent}"/><rect x="260" y="420" width="70" height="16" rx="6" fill="${look.accent}"/>` : ''}
    <ellipse cx="200" cy="250" rx="72" ry="88" fill="${sk}"/>
    <path d="M126 240 C122 170 160 150 200 150 C244 150 280 170 274 240 C262 206 236 190 200 192 C166 192 140 204 126 240 Z" fill="${h}"/>
    <path d="${brow}" stroke="#2a1d16" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="166" cy="240" rx="8" ry="${emo === 'surprised' ? 9 : 6}" fill="#2a1d16"/><ellipse cx="234" cy="240" rx="8" ry="${emo === 'surprised' ? 9 : 6}" fill="#2a1d16"/>
    ${look.acc?.includes('glasses') ? '<g fill="none" stroke="#222" stroke-width="3"><circle cx="166" cy="240" r="20"/><circle cx="234" cy="240" r="20"/><path d="M186 240 H214"/></g>' : ''}
    ${look.acc?.includes('beard') ? `<path d="M140 280 C150 340 250 340 260 280 C240 320 160 320 140 280 Z" fill="${h}" opacity=".85"/>` : ''}
    <path d="${mouth}" stroke="#6b2b24" stroke-width="4" fill="${emo === 'laugh' ? '#6b2b24' : 'none'}" stroke-linecap="round"/>
    ${look.acc?.includes('hat') ? `<path d="M118 190 Q200 120 282 190 L290 200 Q200 180 110 200 Z" fill="${c}"/><rect x="186" y="150" width="28" height="18" rx="4" fill="${look.accent}"/>` : ''}
  </svg>`;
}
function vnPortrait(look, emo = 'neutral', crop = false) {
  if (!VN_EMOS.includes(emo)) emo = 'neutral';
  const key = JSON.stringify(look) + emo + (crop ? 'f' : '');
  if (VN.por[key]) return VN.por[key];
  let svg = '';
  try { if (window.ART && typeof ART.portrait === 'function') svg = ART.portrait(look, emo, crop ? { crop: 'face' } : {}); } catch (e) { svg = ''; }
  if (!svg || typeof svg !== 'string') svg = vnFallbackSvg(look, emo, crop);
  const keys = Object.keys(VN.por); if (keys.length > 160) delete VN.por[keys[0]];
  return (VN.por[key] = svg);
}

// ---------- the office backdrop (own canvas painting, cached per nation) ----------
function officeBg() {
  const nat = G ? G.player : 'KOR';
  if (VN.bg[nat]) return VN.bg[nat];
  const W0 = 1280, H0 = 720, cv = document.createElement('canvas');
  cv.width = W0; cv.height = H0;
  const g = cv.getContext('2d'), r = vnRng(vnHash('office' + nat));
  // wall: dark walnut
  let gr = g.createLinearGradient(0, 0, 0, H0); gr.addColorStop(0, '#26170f'); gr.addColorStop(0.6, '#1d120c'); gr.addColorStop(1, '#120b07');
  g.fillStyle = gr; g.fillRect(0, 0, W0, H0);
  for (let x = 0; x < W0; x += 64) {
    const pg = g.createLinearGradient(x, 0, x + 64, 0); pg.addColorStop(0, 'rgba(0,0,0,.28)'); pg.addColorStop(0.08, 'rgba(255,220,180,.05)'); pg.addColorStop(0.5, 'rgba(0,0,0,0)'); pg.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = pg; g.fillRect(x, 40, 64, 400);
    g.strokeStyle = 'rgba(255,200,150,.035)'; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) { const gx = x + 6 + r() * 52; g.beginPath(); g.moveTo(gx, 40); g.bezierCurveTo(gx + r() * 8 - 4, 160, gx + r() * 8 - 4, 300, gx + r() * 6 - 3, 440); g.stroke(); }
  }
  // crown moulding and chair rail
  g.fillStyle = '#3a2416'; g.fillRect(0, 0, W0, 40); g.fillStyle = 'rgba(255,210,160,.12)'; g.fillRect(0, 36, W0, 3);
  g.fillStyle = '#2f1d12'; g.fillRect(0, 438, W0, 18); g.fillStyle = 'rgba(255,210,160,.1)'; g.fillRect(0, 438, W0, 2);
  // wainscot panels
  for (let x = 20; x < W0; x += 160) {
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, 476, 140, 150);
    g.strokeStyle = 'rgba(255,210,160,.08)'; g.lineWidth = 2; g.strokeRect(x + 6, 482, 128, 138);
  }
  // window with blinds (left): night city
  const wx = 70, wy = 92, ww = 250, wh = 320;
  gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#0b1624'); gr.addColorStop(0.7, '#15253a'); gr.addColorStop(1, '#3a2a22');
  g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
  for (let k = 0; k < 18; k++) { const bx = wx + r() * ww, bh = 30 + r() * 90; g.fillStyle = 'rgba(8,12,18,.9)'; g.fillRect(bx, wy + wh - bh, 14 + r() * 24, bh); }
  for (let k = 0; k < 70; k++) { g.fillStyle = `rgba(255,${170 + r() * 60 | 0},90,${0.35 + r() * 0.5})`; g.fillRect(wx + r() * ww, wy + wh - r() * 110, 2, 2); }
  g.fillStyle = 'rgba(210,225,255,.9)'; g.beginPath(); g.arc(wx + 190, wy + 60, 14, 0, 7); g.fill();
  for (let y = wy + 8; y < wy + wh; y += 13) { g.fillStyle = 'rgba(40,30,24,.78)'; g.fillRect(wx, y, ww, 6); g.fillStyle = 'rgba(190,200,220,.06)'; g.fillRect(wx, y + 6, ww, 1); }
  g.strokeStyle = '#4a2f1d'; g.lineWidth = 12; g.strokeRect(wx - 6, wy - 6, ww + 12, wh + 12);
  // cool moonlight spill
  gr = g.createRadialGradient(wx + ww / 2, wy + wh, 10, wx + ww / 2, wy + wh + 60, 320); gr.addColorStop(0, 'rgba(120,150,200,.12)'); gr.addColorStop(1, 'rgba(120,150,200,0)');
  g.fillStyle = gr; g.fillRect(0, 300, 700, 420);
  // situation map (centre)
  const mx = 390, my = 70, mw = 500, mh = 330;
  g.fillStyle = '#5a3c1e'; g.fillRect(mx - 14, my - 14, mw + 28, mh + 28);
  g.fillStyle = '#7a5e30'; g.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
  gr = g.createLinearGradient(mx, my, mx + mw, my + mh); gr.addColorStop(0, '#162a33'); gr.addColorStop(1, '#10222b');
  g.fillStyle = gr; g.fillRect(mx, my, mw, mh);
  g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip();
  g.strokeStyle = 'rgba(220,235,240,.07)'; g.lineWidth = 1;
  for (let x = mx; x < mx + mw; x += 25) { g.beginPath(); g.moveTo(x, my); g.lineTo(x, my + mh); g.stroke(); }
  for (let y = my; y < my + mh; y += 25) { g.beginPath(); g.moveTo(mx, y); g.lineTo(mx + mw, y); g.stroke(); }
  const land = (pts, col) => { g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(mx + x * mw, my + y * mh) : g.moveTo(mx + x * mw, my + y * mh)); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = 1.5; g.stroke(); };
  land([[0, 0], [0.62, 0], [0.6, 0.1], [0.5, 0.2], [0.44, 0.34], [0.36, 0.42], [0.3, 0.6], [0.34, 0.8], [0.26, 1], [0, 1]], '#7d6c4e');
  land([[0.44, 0.34], [0.5, 0.28], [0.56, 0.3], [0.58, 0.4], [0.55, 0.52], [0.58, 0.64], [0.54, 0.76], [0.47, 0.8], [0.44, 0.7], [0.46, 0.56], [0.42, 0.46]], '#8c7a58');
  land([[0.7, 0.3], [0.78, 0.22], [0.86, 0.3], [0.84, 0.46], [0.76, 0.62], [0.68, 0.74], [0.64, 0.7], [0.72, 0.56], [0.74, 0.42]], '#7d6c4e');
  land([[0.66, 0], [1, 0], [1, 0.18], [0.84, 0.14], [0.7, 0.1]], '#75654a');
  g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.setLineDash([7, 5]);
  g.beginPath(); g.moveTo(mx + 0.43 * mw, my + 0.47 * mh); g.lineTo(mx + 0.49 * mw, my + 0.45 * mh); g.lineTo(mx + 0.53 * mw, my + 0.49 * mh); g.lineTo(mx + 0.58 * mw, my + 0.46 * mh); g.stroke(); g.setLineDash([]);
  const arrow = (x0, y0, x1, y1, col) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 5; g.beginPath(); g.moveTo(mx + x0 * mw, my + y0 * mh); g.quadraticCurveTo(mx + (x0 + x1) / 2 * mw + 18, my + (y0 + y1) / 2 * mh, mx + x1 * mw, my + y1 * mh); g.stroke(); const a = Math.atan2((y1 - y0) * mh, (x1 - x0) * mw); g.beginPath(); g.moveTo(mx + x1 * mw + Math.cos(a) * 12, my + y1 * mh + Math.sin(a) * 12); g.lineTo(mx + x1 * mw + Math.cos(a + 2.4) * 14, my + y1 * mh + Math.sin(a + 2.4) * 14); g.lineTo(mx + x1 * mw + Math.cos(a - 2.4) * 14, my + y1 * mh + Math.sin(a - 2.4) * 14); g.closePath(); g.fill(); };
  arrow(0.5, 0.3, 0.5, 0.44, 'rgba(192,57,43,.85)'); arrow(0.52, 0.72, 0.51, 0.56, 'rgba(41,98,170,.9)'); arrow(0.78, 0.5, 0.62, 0.5, 'rgba(41,98,170,.7)');
  for (let k = 0; k < 14; k++) { g.fillStyle = r() < 0.5 ? '#c0392b' : '#2962aa'; g.beginPath(); g.arc(mx + (0.3 + r() * 0.5) * mw, my + (0.2 + r() * 0.6) * mh, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(mx + (0.3 + r() * 0.5) * mw, my + (0.2 + r() * 0.6) * mh, 1, 1); }
  gr = g.createLinearGradient(mx, my, mx + mw, my + mh); gr.addColorStop(0, 'rgba(8,5,3,.15)'); gr.addColorStop(1, 'rgba(8,5,3,.45)');
  g.fillStyle = gr; g.fillRect(mx, my, mw, mh);
  g.fillStyle = 'rgba(255,230,190,.05)'; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + mw * 0.45, my); g.lineTo(mx + mw * 0.2, my + mh); g.lineTo(mx, my + mh); g.fill();
  g.restore();
  g.fillStyle = '#b08a4a'; g.fillRect(mx + mw / 2 - 70, my + mh + 16, 140, 20); g.fillStyle = '#3a2410'; g.font = 'bold 12px serif'; g.textAlign = 'center'; g.fillText('作 戰 狀 況 圖', mx + mw / 2, my + mh + 31);
  // flag on a pole
  const fx0 = 950, col = NATIONS[nat].color;
  g.fillStyle = '#6b5226'; g.fillRect(fx0, 70, 7, 560); g.fillStyle = '#d8b25a'; g.beginPath(); g.arc(fx0 + 3.5, 64, 10, 0, 7); g.fill();
  g.beginPath(); g.moveTo(fx0 + 7, 86);
  for (let y = 86; y <= 420; y += 8) g.lineTo(fx0 + 7 + 118 + Math.sin(y / 34) * 10, y);
  g.lineTo(fx0 + 7 + 60, 470); g.lineTo(fx0 + 7, 440); g.closePath();
  gr = g.createLinearGradient(fx0, 0, fx0 + 140, 0); gr.addColorStop(0, col); gr.addColorStop(0.35, rgba(col, 0.75)); gr.addColorStop(0.55, col); gr.addColorStop(0.8, rgba(col, 0.7)); gr.addColorStop(1, col);
  g.fillStyle = gr; g.fill();
  g.fillStyle = 'rgba(0,0,0,.22)'; for (let k = 0; k < 4; k++) g.fillRect(fx0 + 22 + k * 28, 86, 7, 360);
  g.fillStyle = 'rgba(255,245,220,.85)'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 9 : 22; g.lineTo(fx0 + 66 + Math.cos(a) * rr, 190 + Math.sin(a) * rr); } g.closePath(); g.fill();
  // bookshelf (right)
  const bx = 1080; g.fillStyle = '#24160e'; g.fillRect(bx, 60, 200, 540);
  for (let y = 80; y < 580; y += 100) {
    g.fillStyle = '#3b2415'; g.fillRect(bx, y + 84, 200, 10);
    let x = bx + 8; while (x < bx + 190) { const w = 10 + r() * 14, h = 50 + r() * 32; g.fillStyle = vnPick(['#5b1f1b', '#1f3b2c', '#20304d', '#6a4b1e', '#3a2a22', '#4e1d38'], r); g.fillRect(x, y + 84 - h, w, h); g.fillStyle = 'rgba(230,190,110,.35)'; g.fillRect(x + 2, y + 84 - h + 8, w - 4, 2); x += w + 1.5; }
  }
  // desk
  gr = g.createLinearGradient(0, 610, 0, H0); gr.addColorStop(0, '#3d2415'); gr.addColorStop(0.1, '#2a180d'); gr.addColorStop(1, '#140a05');
  g.fillStyle = gr; g.fillRect(0, 610, W0, 110); g.fillStyle = 'rgba(255,210,150,.25)'; g.fillRect(0, 610, W0, 2);
  g.fillStyle = '#e9e1cf'; g.save(); g.translate(300, 650); g.rotate(-0.08); g.fillRect(0, 0, 120, 70); g.fillStyle = '#b3392f'; g.fillRect(8, 8, 50, 6); g.restore();
  // banker's lamp
  const lx = 1150; g.fillStyle = '#b08a3a'; g.fillRect(lx - 4, 560, 8, 56); g.fillRect(lx - 30, 610, 60, 8);
  g.fillStyle = '#1f5a3c'; g.beginPath(); g.moveTo(lx - 60, 566); g.quadraticCurveTo(lx, 520, lx + 60, 566); g.closePath(); g.fill();
  // warm lamp light + vignette
  g.globalCompositeOperation = 'lighter';
  gr = g.createRadialGradient(lx, 580, 10, lx, 580, 620); gr.addColorStop(0, 'rgba(255,190,110,.42)'); gr.addColorStop(0.35, 'rgba(255,160,80,.12)'); gr.addColorStop(1, 'rgba(255,160,80,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W0, H0);
  gr = g.createRadialGradient(640, 250, 10, 640, 250, 420); gr.addColorStop(0, 'rgba(255,200,140,.10)'); gr.addColorStop(1, 'rgba(255,200,140,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W0, H0);
  g.globalCompositeOperation = 'source-over';
  gr = g.createRadialGradient(640, 330, 180, 640, 360, 780); gr.addColorStop(0, 'rgba(0,0,0,.05)'); gr.addColorStop(1, 'rgba(0,0,0,.78)');
  g.fillStyle = gr; g.fillRect(0, 0, W0, H0);
  for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,220,170,${r() * 0.12})`; g.beginPath(); g.arc(r() * W0, r() * 600, r() * 2 + 0.5, 0, 7); g.fill(); }
  let url = '';
  try { url = cv.toDataURL('image/jpeg', 0.86); } catch (e) { url = ''; }
  return (VN.bg[nat] = url);
}

// ---------- speakers ----------
function vnSpeaker(post) {
  const m = post && G.cabinet[post];
  if (!m) return null;
  return { id: 'm' + m.id, m, post, name: m.name, role: `${postTitle(me(), post)} · ${MINISTER_TRAITS[m.trait].name}`, look: ministerLook(m) };
}
function vnSecretary() { return { id: 'sec', m: null, post: null, name: VN_SECRETARY.name, role: `${esc(G.leader.title)} 비서실`, look: VN_SECRETARY.look }; }
function vnCast(prefer, exclude = []) {
  const out = [];
  for (const p of [...prefer, ...POSTS.map(x => x.id)]) {
    if (exclude.includes(p) || out.some(s => s.post === p)) continue;
    const s = vnSpeaker(p); if (s) out.push(s);
  }
  return out;
}

// ---------- advisors' voices ----------
// Openers per situation. {L} = how they address the leader.
const VN_OPEN = {
  coup: {
    any: ['{L}, 지금 즉시 지하 벙커로 옮기셔야 합니다.', '{L}, 최악의 소식입니다. 군 일부가 움직였습니다.'],
    hawk: ['반역자 놈들이 탱크를 끌고 나왔습니다, {L}.'], technocrat: ['{L}, 상황을 정리해 드리겠습니다. 시간이 많지 않습니다.'],
    ambitious: ['{L}… 군 내부의 불만이 결국 터졌군요.'], corrupt: ['{L}, 해외 계좌는… 아니, 일단 보고부터 드리지요.'], loyal: ['{L}! 제 목숨을 걸고 지켜드리겠습니다. 먼저 보고부터 드리지요.'], inept: ['{L}, 그게… 방송국이… 아무튼 큰일입니다!'],
  },
  uprising: {
    any: ['{L}, 광장 상황이 통제를 벗어났습니다.', '{L}, 시위대 규모가 어제의 세 배입니다.'],
    hawk: ['{L}, 폭도들이 관공서를 점거했습니다. 이건 시위가 아니라 반란입니다.'], demagogue: ['{L}, 거리의 분노가 끓어넘치고 있습니다.'], technocrat: ['{L}, 교통·통신망 일부가 마비됐습니다. 보고드립니다.'], corrupt: ['{L}, 재계 쪽에서 벌써 짐을 싸는 사람들이 있습니다.'],
  },
  election: {
    any: ['{L}, 선거일이 다가왔습니다.', '{L}, 마지막 여론조사 결과가 올라왔습니다.'],
    technocrat: ['{L}, 표본 오차를 감안해도 결과는 박빙입니다.'], corrupt: ['{L}, 개표소 몇 곳은 이미 "관리"가 끝났습니다.'], demagogue: ['{L}, 유세장마다 인파가 몰렸습니다. 그러나 방심은 금물입니다.'],
  },
  assassination: {
    any: ['{L}, 무사하셔서 다행입니다. 차량 행렬이 공격받았습니다.', '{L}! 괜찮으십니까? 폭발물이었습니다.'],
    hawk: ['{L}을 노린 테러입니다. 피로 갚아 줘야 합니다.'], loyal: ['{L}, 경호원 둘이 {L}을 대신해 목숨을 잃었습니다.'], ambitious: ['{L}, 운이 좋으셨습니다. …정말 운이 좋으셨어요.'],
  },
  plot: {
    any: ['{L}, 은밀히 보고드릴 것이 있습니다.', '{L}, 이 보고는 이 방 밖으로 나가면 안 됩니다.'],
    hawk: ['{L}, 배신자를 찾았습니다.'], technocrat: ['{L}, 통신 감청 기록에서 이상 패턴이 잡혔습니다.'], ambitious: ['{L}, 흥미로운 정보가 들어왔습니다.'],
  },
  scandal: {
    any: ['{L}, 외신 보도가 터졌습니다.', '{L}, 해외 계좌 문제가 새어 나갔습니다.'],
    technocrat: ['{L}, 유출 경로는 금융정보 공유망으로 보입니다.'], corrupt: ['{L}, 그 계좌라면… 저도 자유롭지 못합니다.'],
  },
  event: {
    any: ['{L}, 결재가 필요한 사안입니다.', '{L}, 보고드릴 사안이 있습니다.', '{L}, 잠시 시간 괜찮으십니까?'],
    hawk: ['{L}, 우물쭈물할 사안이 아닙니다.'], technocrat: ['{L}, 자료를 정리해 왔습니다.'], corrupt: ['{L}, 좋은 소식일 수도, 나쁜 소식일 수도 있습니다.'], inept: ['{L}, 그, 제가 보고서를 어디 뒀더라… 아, 여기 있습니다.'], demagogue: ['{L}, 민심이 이 문제를 지켜보고 있습니다.'],
  },
  offer: { any: ['{L}, 외교 전문이 도착했습니다.'], hawk: ['{L}, 저쪽에서 먼저 손을 내밀었습니다. 약해졌다는 뜻이지요.'], technocrat: ['{L}, 방금 들어온 외교 전문입니다.'] },
};
// Why each trait backs an option
const VN_ADV = {
  hawk: ['망설일 때가 아닙니다. {C:으로} 가야 합니다. 약한 모습을 보이면 끝입니다.', '{C}! 힘으로 눌러야 다음이 없습니다.', '적들은 우리가 물러서기만 기다립니다. {C}입니다.'],
  technocrat: ['숫자로 말씀드리지요. {C} 쪽이 손실 대비 이득이 가장 큽니다.', '감정은 빼고 보시죠. {C:이} 예산과 안정도 모두에 합리적입니다.', '표를 뽑아 봤습니다. 결론은 {C}입니다.'],
  loyal: ['{L}의 안위가 먼저입니다. {C:을} 택하시지요.', '저는 어떤 결정이든 따르겠습니다만, 여쭈신다면 {C}입니다.', '제 충정을 걸고 말씀드립니다. {C}입니다.'],
  ambitious: ['{C}… 그것이 모두에게 좋은 길일지도 모르지요.', '제 생각엔 {C}입니다. 물론, 결정은 {L}께서 하시는 거고요.', '{C:을} 권합니다. 다른 사람들도 그렇게 생각할 겁니다.'],
  corrupt: ['{C:으로} 하시지요. 뒤처리는… 제가 조용히 맡겠습니다.', '돈으로 해결될 일이라면 {C:이} 제일 깔끔합니다.', '{C}. 그래야 모두가 먹고삽니다, {L}.'],
  demagogue: ['인민이 보고 있습니다! {C:이} 민심을 얻는 길입니다.', '{C}! 광장의 목소리가 그걸 원합니다.', '신문 1면을 생각하십시오. {C}입니다.'],
  strategist: ['세 수 앞을 보셔야 합니다. {C} 다음의 판이 우리에게 유리합니다.', '{C}. 지금은 손해 같아도 판 전체로 보면 이득입니다.', '적의 다음 수를 막는 건 {C}뿐입니다.'],
  inept: ['어… 그러니까, {C:이} 괜찮지 않을까요? 아마도요.', '보고서를 다시 봐야겠지만… {C:으로} 하시죠.', '{C}…가 맞겠지요? 아닌가?'],
};
const VN_COUNTER = {
  hawk: ['{A}의 말은 겁쟁이의 소리입니다.', '{A}, 전쟁은 장부로 하는 게 아니오.'], technocrat: ['잠깐만요. {A}의 안대로 하면 뒷감당이 안 됩니다.', '{A}의 말엔 숫자가 없습니다.'],
  loyal: ['송구하지만 저는 생각이 다릅니다, {L}.', '{A}의 충정은 알지만, 위험합니다.'], ambitious: ['{A}의 충정은 잘 알겠습니다만…', '글쎄요, {A}는 너무 단순하게 보는군요.'],
  corrupt: ['너무 서두르시는군요, {A}.', '{A}, 그렇게 하면 모두가 손해요.'], demagogue: ['거리의 목소리는 다릅니다!', '{A}는 광장에 나가 본 적이 없지요.'],
  strategist: ['{A}의 안은 한 수만 봅니다.', '{A}, 그 다음 수는 생각해 봤소?'], inept: ['저, 저는 반대… 아니, 다른 의견입니다.', '음, {A}의 말도 맞는데, 제 생각은 좀…'],
};
const VN_AGREE = ['{A}와 같은 생각입니다.', '이번만큼은 {A}의 말이 옳습니다.', '저도 {A}의 의견에 동의합니다.'];
const VN_LOWLOY = [' …물론 제 말을 들으실지는 모르겠습니다만.', ' 결정은 {L}의 몫이지요. 책임도요.', ' 뭐, 늘 그러셨듯이 알아서 하시겠지요.'];
const VN_HILOY = [' 끝까지 {L} 곁에 있겠습니다.', ' {L}을 믿습니다.', ''];
const VN_PROMPT = ['결단을 내려 주십시오, {L}.', '{L}, 명령을 기다리겠습니다.', '어떻게 하시겠습니까, {L}?'];
const VN_TRAIT_EMO = { hawk: 'angry', technocrat: 'neutral', loyal: 'worried', ambitious: 'smirk', corrupt: 'smirk', demagogue: 'smile', strategist: 'cold', inept: 'tired' };
// Situation flavour for each option of the hard-coded crises (by choice index)
const VN_CHOICE_FLAVOR = {
  coup: ['보안군이 방송국부터 탈환하면 반란군은 명분을 잃습니다.', '장성들에게 자리를 나눠 주면 오늘 밤은 넘길 수 있습니다.', '전용기는 활주로에 대기 중입니다. 계좌만 살아 있다면…'],
  uprising: ['해산 명령을 내리면 오늘 밤 안에 광장을 비울 수 있습니다.', '개혁을 약속하면 군중은 흩어질 겁니다. 대신 권력은 나눠야 하지요.'],
  election: ['투표함을 여십시오. 이긴다면 정통성이 생깁니다.', '계엄을 선포하면 선거는 없습니다. 대신 세계가 등을 돌리겠지요.'],
  assassination: ['경호를 두 배로 늘리고 동선을 바꾸면 됩니다.', '배후를 찾아내 본보기를 보여야 합니다.'],
  plot: ['오늘 밤 안에 체포하면 뿌리째 뽑을 수 있습니다.', '돈으로 마음을 사면 쓸 만한 인재를 잃지 않습니다.', '지켜보다 보면 공범까지 드러날 겁니다.'],
  scandal: ['가짜뉴스로 규정하고 방송을 틀어막으면 됩니다.', '누군가 책임을 져야 한다면… 경제장관이 가장 자연스럽습니다.'],
  offer: ['받아들이면 숨을 돌릴 시간을 법니다.', '거절하면 우리의 의지를 보여 줄 수 있습니다.'],
};
// Scoring vectors for crisis options (same keys as decree/event fx) — only used to decide who backs what
const VN_VEC = {
  coup: [{ sec: 8, power: 10, rep: -3, force: 1 }, { army: 20, money: -60, power: -15, stab: -4 }, { flee: 1 }],
  uprising: [{ sec: 8, people: -10, rep: -20, power: 5, force: 1 }, { people: 20, power: -20, army: -8, party: -8, stab: 5 }],
  election: [{ people: 5, power: 5, stab: 2 }, { army: 15, sec: 10, people: -20, rep: -30, power: 25, force: 1 }],
  assassination: [{ money: -20, stab: 1 }, { sec: 6, people: -4, force: 1 }],
  plot: [{ power: 6, sec: 3, force: 1 }, { money: -30, stab: 1 }, { stab: -1 }],
  scandal: [{ people: -8, rep: -5, sec: 3, force: 1 }, { people: -3, scapegoat: 1 }],
  offer: [{ stab: 3, rep: 3, money: 5 }, { force: 1, army: 3 }],
};
const VN_TRAIT_W = {
  hawk: { army: 1, sec: 0.8, power: 0.6, force: 25, rep: -0.1, rel: -0.2, money: 0.03, people: 0.05, flee: -60, mp: 0.1 },
  technocrat: { money: 0.8, stab: 3, fuel: 0.4, rep: 0.3, rel: 0.3, force: -8, biz: 0.5, people: 0.2, flee: -25, power: 0.1 },
  loyal: { power: 1.2, stab: 2, flee: -80, force: 4, army: 0.2, sec: 0.3, party: 0.3, scapegoat: 10 },
  ambitious: { power: -1.2, flee: 25, army: 0.3, sec: 0.3, stab: -0.5 },
  corrupt: { money: 0.6, biz: 1, flee: 5, force: -2, rep: -0.05 },
  demagogue: { people: 1.5, stab: 1.5, rep: 0.3, force: -6, flee: -30 },
  strategist: { stab: 2, army: 0.5, rep: 0.3, money: 0.3, power: 0.5, rel: 0.2, flee: -40, force: 2 },
  inept: {},
};
function vnFlat(fx) {
  const o = {};
  for (const [k, v] of Object.entries(fx || {})) {
    if (k === 'fac') for (const [f, d] of Object.entries(v)) o[f] = (o[f] || 0) + d;
    else if (typeof v === 'number') o[k] = (o[k] || 0) + v;
  }
  return o;
}
function vnScore(m, vec, k) {
  const w = VN_TRAIT_W[m.trait] || {};
  let s = 0;
  for (const [key, v] of Object.entries(vec)) { s += (w[key] || 0) * v; if (key === m.fac) s += 0.6 * v; }
  if (key0(vec, 'scapegoat') && m.post === 'economy') s -= 60;   // nobody volunteers to be the scapegoat…
  if (m.trait === 'loyal' && key0(vec, 'scapegoat') && m.post === 'economy') s += 70; // …except the loyal one
  if (m.trait === 'inept') s = vnRng(vnHash(m.name + G.turn + k))() * 10;
  return s;
}
function key0(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function vnPref(m, vecs) { let best = 0, bs = -Infinity; vecs.forEach((v, k) => { const s = vnScore(m, v, k); if (s > bs) { bs = s; best = k; } }); return best; }

const VN_EVENT_POST = {
  '재벌 총수 소환': 'economy', '광장의 촛불': 'interior', '장마당 단속': 'interior', '고난의 행군 재현 우려': 'economy', '당 전원회의': 'interior', '부동산 기업 연쇄 부도': 'economy',
  '대만 통일 여론 고조': 'defense', '용병 집단 반란': 'defense', '올리가르히의 불만': 'economy', '의회 전쟁권한 결의': 'foreign', '방위산업 증산 요구': 'defense', '평화헌법 개정 논쟁': 'defense',
  '야스쿠니 참배 논란': 'foreign', '히잡 시위 재점화': 'interior', '사법개혁 반대 시위': 'interior', '리라화 폭락': 'economy', '카슈미르 긴장': 'chief', '서방 무기 지원 패키지': 'foreign',
  '스코틀랜드 독립 투표 요구': 'interior', '연금개혁 총파업': 'economy', '에너지 위기': 'economy', 'TSMC 해외 공장 이전 압박': 'foreign', 'OPEC+ 감산 결정': 'economy', '수에즈 운하 통행료 급감': 'economy',
  '국경 하이브리드 도발': 'interior', '유엔 안보리 긴급회의': 'foreign', '전시 국채 발행': 'economy', '전력망 사이버 공격': 'intel', '국제 유가 급등': 'economy', '대규모 반전 시위': 'interior',
  '고위 장교 망명': 'intel', '방산 수출 기회': 'defense', '지도자 건강 이상설': 'intel',
};
function vnEventPost(ev) {
  if (VN_EVENT_POST[ev.title]) return VN_EVENT_POST[ev.title];
  const t = ev.title + ev.text;
  if (/시위|촛불|봉기|파업|민심/.test(t)) return 'interior';
  if (/해킹|사이버|망명|첩보|스파이/.test(t)) return 'intel';
  if (/유엔|동맹|외교|관계|수출/.test(t)) return 'foreign';
  if (/군|무기|국경|포격|전쟁/.test(t)) return 'defense';
  return 'economy';
}
const VN_BAD = /시위|위기|폭락|부도|공격|반란|아사|파업|논란|도발|긴장|불만|우려|이상설|반대|급감|급등|단속|소환/;
const VN_GOOD = /기회|지원|수출/;

// Build the dialogue for a decision. reporter speaks first, then 1–2 advisors argue, then a prompt.
function vnDebate(kind, choices, o = {}) {
  const L = vnAddr(), lines = [], rec = {};
  const vecs = o.vecs || choices.map(c => vnFlat(c.fx));
  const cast = vnCast(o.prefer || [], o.exclude || []);
  if (!cast.length) {
    const sec = vnSecretary(), se = typeof o.emo === 'string' ? o.emo : 'worried';
    lines.push({ sp: sec, emo: se, t: vnFill(vnPick(VN_OPEN[kind]?.any || VN_OPEN.event.any), { L }) });
    if (o.text) lines.push({ sp: sec, emo: se, t: o.text });
    lines.push({ sp: sec, emo: 'neutral', t: vnFill('내각이 비어 있어 제가 대신 보고드렸습니다. ' + vnPick(VN_PROMPT), { L }) });
    return { lines, rec };
  }
  const rep = cast[0], rm = rep.m;
  const open = VN_OPEN[kind] || VN_OPEN.event;
  const emo0 = typeof o.emo === 'function' ? o.emo(rm) : o.emo || 'neutral';
  lines.push({ sp: rep, emo: rm.loyalty < 30 ? 'cold' : emo0, t: vnFill(vnPick(open[rm.trait] || open.any), { L }) });
  if (o.text) lines.push({ sp: rep, emo: emo0, t: o.text });
  if (o.extra) for (const x of o.extra) lines.push(x);
  if (choices.length < 2) return { lines, rec };
  const say = (sp, k, lead) => {
    const m = sp.m, c = vnShort(choices[k].label);
    let t = (lead || '') + vnFill(vnPick(VN_ADV[m.trait] || VN_ADV.loyal), { C: c, L });
    const fl = VN_CHOICE_FLAVOR[kind]?.[k];
    if (fl) t += ' ' + fl;
    else if (m.trait === 'technocrat' || m.trait === 'strategist') { const f = choices[k].fx && fxText(choices[k].fx); if (f && f !== '특수 효과') t += ` (${f})`; }
    if (m.loyalty < 35) t += vnFill(vnPick(VN_LOWLOY), { L });
    else if (m.loyalty > 78 && m.trait === 'loyal') t += vnFill(vnPick(VN_HILOY), { L });
    const plotting = m.ambition - m.loyalty > 25;
    const emo = m.loyalty < 30 ? 'cold' : plotting ? 'smirk' : VN_TRAIT_EMO[m.trait] || 'neutral';
    (rec[k] ||= []).push(postTitle(me(), sp.post));
    lines.push({ sp, emo, t });
  };
  const p0 = vnPref(rm, vecs);
  say(rep, p0);
  const others = cast.slice(1);
  // the advisor who disagrees the loudest speaks next; if everyone agrees, the most relevant one agrees
  const scored = others.map(s => { const k = vnPref(s.m, vecs); return { s, k, gap: vnScore(s.m, vecs[k], k) - vnScore(s.m, vecs[p0], p0) }; });
  const dis = scored.filter(x => x.k !== p0).sort((a, b) => b.gap - a.gap);
  const A = rm.name;
  if (dis.length) {
    const d = dis[0];
    say(d.s, d.k, vnFill(vnPick(VN_COUNTER[d.s.m.trait] || VN_COUNTER.loyal), { A, L }) + ' ');
    const third = (o.maxVoices || 2) > 2 && dis.find(x => x.k !== d.k && x.s !== d.s);
    if (third) say(third.s, third.k, vnFill(vnPick(VN_COUNTER[third.s.m.trait] || VN_COUNTER.loyal), { A: d.s.m.name, L }) + ' ');
  } else if (scored.length) {
    const s = scored[0].s;
    lines.push({ sp: s, emo: s.m.loyalty < 30 ? 'cold' : 'neutral', t: vnFill(vnPick(VN_AGREE), { A }) });
    (rec[p0] ||= []).push(postTitle(me(), s.post));
  }
  const last = lines[lines.length - 1].sp;
  lines.push({ sp: last, emo: lines[lines.length - 1].emo, t: vnFill(vnPick(VN_PROMPT), { L }) });
  return { lines, rec };
}

// ---------- public: build scenes for the existing decision points ----------
// ctx: { title, eyebrow, text, info (html), post (plot target), odds }
function decideCrisis(kind, compactHtml, choices, ctx = {}) {
  if (vnCompact() || !G) return modalChoice(compactHtml, choices);
  const N = P();
  const cfg = {
    coup: { prefer: ['intel', 'chief', 'defense', 'economy'], emo: m => m.trait === 'hawk' ? 'angry' : m.ambition - m.loyalty > 25 ? 'smirk' : 'cold', maxVoices: 3 },
    uprising: { prefer: ['interior', 'intel', 'economy', 'defense'], emo: 'worried' },
    election: { prefer: ['interior', 'foreign', 'intel'], emo: () => (ctx.odds ?? 0.5) > 0.6 ? 'smile' : 'worried' },
    assassination: { prefer: ['intel', 'interior', 'defense'], emo: m => m.trait === 'loyal' ? 'surprised' : 'angry' },
    plot: { prefer: ctx.post === 'intel' ? ['interior', 'defense'] : ['intel', 'interior', 'defense'], exclude: [ctx.post], emo: 'cold', maxVoices: 3 },
    scandal: { prefer: ['foreign', 'economy', 'interior'], emo: 'worried' },
    offer: { prefer: ['foreign', 'defense', 'economy'], emo: m => m.trait === 'hawk' ? 'smirk' : 'neutral' },
  }[kind] || { prefer: ['interior'] };
  const extra = [];
  if (kind === 'plot' && ctx.post && G.cabinet[ctx.post]) {
    const t = G.cabinet[ctx.post], rep = vnCast(cfg.prefer, cfg.exclude)[0];
    if (rep) extra.push({ sp: rep, emo: 'cold', t: `${postTitle(me(), ctx.post)} ${t.name}입니다. 충성 ${Math.round(t.loyalty)}, 야망 ${Math.round(t.ambition)}. 지난주에만 장성 셋을 따로 만났습니다.` });
  }
  if (kind === 'scandal' && G.cabinet.economy && G.cabinet.economy !== vnCast(cfg.prefer)[0]?.m) {
    const sp = vnSpeaker('economy'), m = sp.m, L = vnAddr();
    extra.push({ sp, emo: m.trait === 'loyal' ? 'sad' : 'worried', t: m.trait === 'loyal' ? `${L}, 필요하다면 제가 책임을 지겠습니다. 그것이 신하의 도리라면.` : m.trait === 'corrupt' ? `${L}, 설마 저를…? 그 계좌 내역, 저만 아는 게 아닙니다.` : `${L}, 저는 그저 지시대로 집행했을 뿐입니다. 부디 현명하게 판단해 주십시오.` });
  }
  const d = vnDebate(kind, choices, { ...cfg, text: ctx.text, vecs: VN_VEC[kind], extra });
  return runScene({ kind, eyebrow: ctx.eyebrow, title: ctx.title, info: ctx.info, lines: d.lines, rec: d.rec, choices, compact: compactHtml, danger: kind !== 'offer' });
}
function decideEvent(ev, compactHtml) {
  const choices = ev.choices.map(c => ({ label: c.label, cls: c.cls, sub: fxText(c.fx), fx: c.fx }));
  if (vnCompact() || !G) return modalChoice(compactHtml, ev.choices);
  const post = vnEventPost(ev);
  const t = ev.title + ev.text, bad = VN_BAD.test(t), good = VN_GOOD.test(t);
  const d = vnDebate('event', choices, { prefer: [post, ...POSTS.map(p => p.id).filter(p => p !== post)], text: ev.text, emo: m => good ? 'smile' : bad ? (m.trait === 'hawk' ? 'angry' : 'worried') : 'neutral' });
  return runScene({ kind: 'event', eyebrow: `${dateLabel()} · 국가 사건`, title: ev.title, lines: d.lines, rec: d.rec, choices, compact: compactHtml });
}

// Monthly briefing: finance → front → intelligence, then the report stays one tap away.
function briefingLines(r) {
  const N = P(), L = vnAddr(), lines = [], e = economyPreview(me());
  const eco = vnSpeaker('economy');
  if (eco) {
    const m = eco.m, up = r.dMoney >= 0;
    let t = `${L}, 이번 달 국고는 ${sgn(r.dMoney)}억$, 잔액 ${fmt(N.money)}억$입니다.`;
    if (e.net < 0 && N.money > 0) t += ` 지금 추세면 약 ${Math.max(1, Math.floor(N.money / -e.net))}개월 뒤 바닥납니다.`;
    else t += ` 다음 달 순수입은 ${sgn(e.net)}억$로 예상됩니다.`;
    if (m.trait === 'technocrat') t += e.sanc > 0.01 ? ` 제재로 수입이 ${pct(e.sanc)} 깎이고 있습니다.` : ' 재정 지표는 관리 가능한 수준입니다.';
    else if (m.trait === 'corrupt') t += (N.skim || 0) > 0 ? ' 착복 이야기는… 여기서는 하지 않겠습니다.' : ' 조금만 떼어 두시면 훗날 요긴할 텐데요.';
    else if (m.trait === 'hawk') t += ' 남는 돈은 전부 군비로 돌리셔야 합니다.';
    else if (m.trait === 'inept') t += ' …아마 그럴 겁니다. 계산기를 다시 두드려 보겠습니다.';
    lines.push({ sp: eco, emo: m.loyalty < 30 ? 'cold' : up ? (m.trait === 'corrupt' ? 'smirk' : 'smile') : 'worried', t });
  }
  const mil = vnSpeaker('chief') || vnSpeaker('defense');
  if (mil) {
    const m = mil.m, wars = enemiesOf(me()).length;
    let t, emo;
    if (!wars) { t = `${L}, 전선은 조용합니다.${m.trait === 'hawk' ? ' 너무 조용하군요. 칼은 녹슬기 전에 써야 합니다.' : ' 이럴 때 병력을 키워 두셔야 합니다.'}`; emo = m.trait === 'hawk' ? 'smirk' : 'neutral'; }
    else {
      t = `적 ${r.kills}개 부대를 격파했고 아군 손실은 ${r.losses}입니다.`;
      if (r.gained.length) t = `${josa(r.gained.slice(0, 3).join(', '), '을')} 점령했습니다! ` + t;
      if (r.lost.length) t += ` 그러나 ${josa(r.lost.slice(0, 3).join(', '), '을')} 잃었습니다.`;
      if (r.threats.length) t += ` ${r.threats[0][0]} 방면에 적 ${r.threats[0][1]}개 부대가 접근 중입니다.`;
      t = `${L}, ` + t;
      if (m.trait === 'hawk') t += ' 공세로 전환할 때입니다.';
      else if (m.trait === 'strategist') t += ' 전선을 좁히고 예비대를 모으십시오.';
      emo = r.lost.length ? 'angry' : r.gained.length || r.kills > r.losses ? (m.trait === 'hawk' ? 'smirk' : 'smile') : r.threats.length ? 'worried' : 'neutral';
    }
    lines.push({ sp: mil, emo: m.loyalty < 30 ? 'cold' : emo, t });
  }
  const intel = vnSpeaker('intel');
  if (intel) {
    const m = intel.m, plotting = m.ambition - m.loyalty > 25;
    let t = `쿠데타 위험 ${pct(r.coup)}, 봉기 위험 ${pct(r.revolt)}입니다.`;
    if (plotting) t += ' 내각에 특이 동향은… 없습니다.';
    else if (r.plots) t += ` 내각 안에 수상한 움직임을 보이는 인물이 ${r.plots}명 있습니다.`;
    if (r.world.length) t += ` 해외 소식: ${r.world[r.world.length - 1].replace(/^\[[^\]]*\]\s*/, '')}`;
    lines.push({ sp: intel, emo: plotting ? 'smirk' : r.coup > 0.15 || r.revolt > 0.15 ? 'worried' : r.plots ? 'cold' : 'neutral', t: `${L}, ` + t });
  }
  if (!lines.length) { const sec = vnSecretary(); lines.push({ sp: sec, emo: 'neutral', t: `${L}, 내각이 비어 있어 제가 대신 보고드립니다. 국고 ${fmt(N.money)}억$, 안정도 ${Math.round(N.stab)}입니다.` }); }
  lines.push({ sp: lines[lines.length - 1].sp, emo: 'neutral', t: '상세 수치는 보고서에 정리해 두었습니다.' });
  return lines;
}
function decideBriefing(compactHtml, choices) {
  if (vnCompact() || !G || !G.report) return modalChoice(compactHtml, choices);
  return runScene({ kind: 'report', eyebrow: `${G.report.date} · 월간 정세 보고`, title: `${G.leader.title}께 올리는 보고`, lines: briefingLines(G.report), choices, compact: compactHtml, report: true });
}

// ---------- the scene ----------
function vnEnsure() {
  if (VN.el) return VN.el;
  const el = document.createElement('div');
  el.id = 'vn'; el.hidden = true;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '집무실');
  el.innerHTML = `<div class="vn-bg"></div><div class="vn-shade"></div>
    <div class="vn-stage" aria-hidden="true"></div>
    <header class="vn-top"><div class="vn-title"><span class="vn-eyebrow"></span><b></b></div>
      <div class="vn-tools">
        <button type="button" class="vn-tool" data-vn="report" hidden>보고서</button>
        <button type="button" class="vn-tool" data-vn="chat"><span class="lg">참모와 </span>대화</button>
        <button type="button" class="vn-tool" data-vn="compact" title="앞으로 결정을 간단한 창으로 표시">간단히</button>
        <button type="button" class="vn-tool strong" data-vn="skip">넘기기 ▸▸</button>
        <button type="button" class="vn-tool" data-vn="close" hidden aria-label="닫기">닫기</button>
      </div></header>
    <div class="vn-panel" hidden></div>
    <div class="vn-bottom">
      <div class="vn-choices" hidden></div>
      <div class="vn-box" tabindex="0" aria-live="polite"><div class="vn-name"><b></b><span></span></div><p class="vn-text"></p><i class="vn-next" aria-hidden="true">▼</i></div>
      <div class="vn-chat" hidden></div>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', vnClick);
  window.addEventListener('keydown', vnKey, true);
  return (VN.el = el);
}
function vnKey(e) {
  if (!VN.el || VN.el.hidden) return;
  const s = VN.cur, tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.key === 'Escape' && VN.chat) { e.preventDefault(); vnChatClose(); } e.stopPropagation(); return; }
  e.stopPropagation();
  if (e.key === 'Escape') { if (VN.chat) vnChatClose(); else if (s && s.phase === 'talk') vnSkip(); return; }
  if (s && s.phase === 'talk' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); vnAdvance(); return; }
  if (s && s.phase === 'choose' && /^[1-9]$/.test(e.key)) { const b = VN.el.querySelector(`.vn-choices [data-k="${+e.key - 1}"]`); if (b && !b.disabled) b.click(); }
}
function vnClick(e) {
  const b = e.target.closest('button');
  const s = VN.cur;
  if (b) {
    const a = b.dataset.vn;
    if (b.dataset.k != null && s && s.phase === 'choose') { vnResolve(+b.dataset.k); return; }
    if (a === 'skip') return vnSkip();
    if (a === 'report') return vnTogglePanel();
    if (a === 'chat') return vnChatOpen(s?.speaker?.post || null);
    if (a === 'close') return vnChatClose();
    if (a === 'compact') {
      VN.prefs.compact = true; vnSavePrefs();
      if (s) { const spec = s.spec, res = s.res; vnHide(); VN.cur = null; modalChoice(spec.compact, spec.choices).then(res); }
      toast('결정을 간단한 창으로 표시합니다 (메뉴에서 되돌릴 수 있음)');
      return;
    }
    if (b.dataset.chat) return vnChatAction(b);
    return;
  }
  if (VN.chat) return;
  if (e.target.closest('.vn-panel') || e.target.closest('.vn-choices')) return;
  if (s && s.phase === 'talk') vnAdvance();
}
function vnShow() {
  const el = vnEnsure();
  el.querySelector('.vn-bg').style.backgroundImage = `url("${officeBg()}")`;
  el.hidden = false;
  document.body.classList.add('vn-open');
}
function vnHide() {
  clearTimeout(VN.timer); VN.timer = null;
  if (VN.chat?.ctl) try { VN.chat.ctl.abort(); } catch (e) {}
  VN.chat = null;
  if (!VN.el) return;
  VN.el.hidden = true; document.body.classList.remove('vn-open');
  VN.el.querySelector('.vn-stage').innerHTML = '';
  VN.el.querySelector('.vn-panel').hidden = true;
}
function runScene(spec) {
  return new Promise(res => {
    vnShow();
    const el = VN.el;
    VN.cur = { spec, res, i: -1, phase: 'talk', speaker: null, typing: false };
    el.querySelector('.vn-eyebrow').textContent = spec.eyebrow || '';
    el.querySelector('.vn-title b').textContent = spec.title || '';
    el.classList.toggle('danger', !!spec.danger);
    el.querySelector('[data-vn="report"]').hidden = !spec.report;
    el.querySelector('[data-vn="skip"]').hidden = false;
    el.querySelector('[data-vn="compact"]').hidden = false;
    el.querySelector('[data-vn="chat"]').hidden = false;
    el.querySelector('[data-vn="close"]').hidden = true;
    el.querySelector('.vn-chat').hidden = true;
    el.querySelector('.vn-box').hidden = false;
    el.querySelector('.vn-panel').hidden = true;
    const ch = el.querySelector('.vn-choices'); ch.hidden = true; ch.innerHTML = '';
    el.classList.remove('raised');
    el.querySelector('.vn-stage').innerHTML = '';
    vnAdvance();
    el.querySelector('.vn-box').focus({ preventScroll: true });
  });
}
function vnSetSpeaker(sp, emo) {
  const stage = VN.el.querySelector('.vn-stage');
  const s = VN.cur || {};
  const id = sp.id;
  let node = stage.querySelector(`[data-sp="${id}"]`);
  for (const n of stage.children) if (n !== node) { n.classList.remove('on'); n.classList.add('side'); }
  // keep at most one previous speaker beside the active one
  const sides = [...stage.children].filter(n => n.classList.contains('side') && n !== node);
  sides.slice(0, -1).forEach(n => n.remove());
  if (!node) { node = document.createElement('div'); node.className = 'vn-por enter'; node.dataset.sp = id; stage.appendChild(node); requestAnimationFrame(() => node.classList.remove('enter')); }
  if (node.dataset.emo !== emo) { node.innerHTML = vnPortrait(sp.look, emo); node.dataset.emo = emo; }
  node.classList.remove('side'); node.classList.add('on');
  s.speaker = sp;
  const nm = VN.el.querySelector('.vn-name');
  nm.hidden = false;
  nm.querySelector('b').textContent = sp.name;
  nm.querySelector('span').textContent = sp.role;
}
function vnType(text, done) {
  const p = VN.el.querySelector('.vn-text'), s = VN.cur;
  clearTimeout(VN.timer);
  VN.el.querySelector('.vn-next').hidden = true;
  if (VN.reduced || VN.prefs.instant) { p.textContent = text; if (s) s.typing = false; VN.el.querySelector('.vn-next').hidden = false; done && done(); return; }
  let k = 0; if (s) s.typing = true;
  const chars = [...text];
  const step = () => {
    k = Math.min(chars.length, k + 2);
    p.textContent = chars.slice(0, k).join('');
    if (k < chars.length) VN.timer = setTimeout(step, 28);
    else { if (s) s.typing = false; VN.el.querySelector('.vn-next').hidden = false; done && done(); }
  };
  if (s) s.finish = () => { clearTimeout(VN.timer); p.textContent = text; s.typing = false; VN.el.querySelector('.vn-next').hidden = false; done && done(); };
  step();
}
function vnAdvance() {
  const s = VN.cur; if (!s || s.phase !== 'talk') return;
  if (s.typing && s.finish) { s.finish(); return; }
  const L = s.spec.lines;
  s.i++;
  if (s.i >= L.length) { vnChoices(); return; }
  const ln = L[s.i];
  vnSetSpeaker(ln.sp, ln.emo || 'neutral');
  vnType(ln.t, s.i === L.length - 1 ? () => vnChoices() : null);
}
function vnSkip() {
  const s = VN.cur; if (!s || s.phase !== 'talk') return;
  clearTimeout(VN.timer);
  const L = s.spec.lines;
  s.i = L.length - 1; s.typing = false;
  const ln = L[s.i];
  vnSetSpeaker(ln.sp, ln.emo || 'neutral');
  VN.el.querySelector('.vn-text').textContent = ln.t;
  vnChoices();
}
function vnChoices() {
  const s = VN.cur; if (!s || s.phase === 'choose') return;
  s.phase = 'choose';
  VN.el.querySelector('.vn-next').hidden = true;
  VN.el.querySelector('[data-vn="skip"]').hidden = true;
  const box = VN.el.querySelector('.vn-choices'), spec = s.spec;
  box.innerHTML = (spec.info ? `<div class="vn-info">${spec.info}</div>` : '') + spec.choices.map((c, k) => {
    const rec = spec.rec?.[k];
    return `<button type="button" class="vn-choice ${c.cls || ''}" data-k="${k}"><span class="vn-ck">${k + 1}</span><span class="vn-cl"><b>${esc(c.label)}</b>${c.sub ? `<small>${esc(c.sub)}</small>` : ''}${rec ? `<em>추천 · ${esc(rec.join(', '))}</em>` : ''}</span></button>`;
  }).join('');
  box.hidden = false;
  VN.el.classList.add('raised');
  const f = box.querySelector('button'); if (f) f.focus({ preventScroll: true });
}
function vnResolve(k) {
  const s = VN.cur; if (!s) return;
  VN.cur = null;
  vnHide();
  s.res(k);
}
function vnTogglePanel() {
  const p = VN.el.querySelector('.vn-panel');
  if (!p.hidden) { p.hidden = true; return; }
  p.innerHTML = `<div class="vn-panel-in"><div class="row"><h3>월간 정세 보고 · ${esc(G.report?.date || '')}</h3><button type="button" class="btn sm" data-vn="report">닫기</button></div>${reportHtml(G.report)}<p class="sub">추이 차트는 전황 탭에 있습니다.</p></div>`;
  p.hidden = false;
}

// ---------- advisor chat ----------
function vnAdvState() {
  G.advisor ||= {};
  G.advisor.hist ||= {}; G.advisor.used ||= {};
  return G.advisor;
}
function vnUsed(m) {
  const A = vnAdvState(), u = A.used[m.id];
  if (!u || u.t !== G.turn) return (A.used[m.id] = { t: G.turn, n: 0, loy: 0 });
  return u;
}
const VN_MAX_MSG = 5;
function vnChatOpen(post) {
  if (!G || G.flags.demo) return;
  const firstM = post && G.cabinet[post] ? post : POSTS.map(p => p.id).find(p => G.cabinet[p]);
  if (!firstM) { toast('대화할 각료가 없습니다 — 먼저 임명하세요', 'bad'); return; }
  const standalone = !VN.cur;
  if (standalone) {
    if (innerWidth < 900) closeSheet();
    vnShow();
    VN.el.querySelector('.vn-eyebrow').textContent = `${dateLabel()} · 집무실`;
    VN.el.querySelector('.vn-title b').textContent = '참모와 대화';
    VN.el.classList.remove('danger');
    VN.el.querySelector('[data-vn="report"]').hidden = true;
  }
  VN.chat = { post: firstM, standalone, busy: false, ctl: null, prevSpeaker: VN.cur?.speaker || null };
  VN.el.querySelector('[data-vn="skip"]').hidden = true;
  VN.el.querySelector('[data-vn="compact"]').hidden = true;
  VN.el.querySelector('[data-vn="chat"]').hidden = true;
  VN.el.querySelector('[data-vn="close"]').hidden = false;
  VN.el.querySelector('[data-vn="close"]').textContent = standalone ? '닫기' : '결정으로 돌아가기';
  VN.el.querySelector('.vn-choices').hidden = true;
  VN.el.querySelector('.vn-panel').hidden = true;
  VN.el.querySelector('.vn-chat').hidden = false;
  VN.el.classList.add('raised');
  vnChatSelect(firstM);
}
function vnChatClose() {
  const c = VN.chat; if (!c) return;
  if (c.ctl) try { c.ctl.abort(); } catch (e) {}
  VN.chat = null;
  if (c.standalone) { vnHide(); after(); return; }
  const el = VN.el, s = VN.cur;
  el.querySelector('.vn-chat').hidden = true;
  el.querySelector('[data-vn="close"]').hidden = true;
  el.querySelector('[data-vn="chat"]').hidden = false;
  el.querySelector('[data-vn="compact"]').hidden = false;
  if (s) {
    const ln = s.spec.lines[Math.max(0, Math.min(s.i, s.spec.lines.length - 1))];
    vnSetSpeaker(ln.sp, ln.emo || 'neutral');
    el.querySelector('.vn-text').textContent = ln.t;
    if (s.phase === 'choose') el.querySelector('.vn-choices').hidden = false;
    else {
      el.classList.remove('raised'); el.querySelector('[data-vn="skip"]').hidden = false; el.querySelector('.vn-next').hidden = false; s.typing = false; }
  }
  after();
}
function vnChatSelect(post) {
  const c = VN.chat, m = G.cabinet[post]; if (!c || !m) return;
  if (c.ctl) try { c.ctl.abort(); } catch (e) {}
  c.post = post; c.busy = false; c.ctl = null;
  const sp = vnSpeaker(post);
  vnSetSpeaker(sp, m.loyalty < 30 ? 'cold' : 'neutral');
  const hist = vnAdvState().hist[m.id] || [];
  const lastA = [...hist].reverse().find(h => h.role === 'assistant');
  VN.el.querySelector('.vn-text').textContent = lastA ? vnStrip(lastA.content) : vnGreeting(m);
  VN.el.querySelector('.vn-next').hidden = true;
  vnChatRender();
}
function vnGreeting(m) {
  const L = vnAddr();
  return vnPick({
    hawk: [`${L}, 부르셨습니까. 적을 칠 이야기라면 언제든 환영입니다.`], technocrat: [`${L}, 자료는 준비돼 있습니다. 무엇이 궁금하십니까?`],
    loyal: [`${L}, 무엇이든 하명하십시오.`], ambitious: [`${L}께서 저를 따로 부르시다니, 영광이군요.`], corrupt: [`${L}, 문 닫고 편하게 말씀하시지요.`],
    demagogue: [`${L}, 민심의 소리를 전해 드릴까요?`], strategist: [`${L}, 지도 앞으로 오시지요. 판을 같이 보시겠습니까?`], inept: [`아, ${L}! 예, 예. 무슨 일이신지…`],
  }[m.trait] || [`${L}, 부르셨습니까.`]) + (m.loyalty < 30 ? ' …짧게 해 주시지요.' : '');
}
function vnChatRender() {
  const c = VN.chat; if (!c) return;
  const m = G.cabinet[c.post], u = vnUsed(m), left = VN_MAX_MSG - u.n;
  const ai = !!SAMPLE;
  const hist = (vnAdvState().hist[m.id] || []).slice(-6);
  const cast = POSTS.filter(p => G.cabinet[p.id]).map(p => { const x = G.cabinet[p.id]; return `<button type="button" class="vn-face${p.id === c.post ? ' on' : ''}" data-chat="pick" data-post="${p.id}" aria-pressed="${p.id === c.post}" title="${esc(postTitle(me(), p.id))} ${esc(x.name)}">${vnPortrait(ministerLook(x), 'neutral', true)}<span>${esc(postTitle(me(), p.id))}</span></button>`; }).join('');
  const log = hist.length > 1 ? `<details class="vn-log"><summary>지난 대화 ${Math.floor(hist.length / 2)}건</summary>${hist.map(h => `<p class="${h.role === 'user' ? 'me' : ''}"><b>${h.role === 'user' ? esc(G.leader.title) : esc(m.name)}</b> ${esc(vnStrip(h.content))}</p>`).join('')}</details>` : '';
  const body = ai
    ? `<form class="vn-input" data-chat-form><input type="text" maxlength="240" placeholder="${left > 0 ? `${esc(m.name)}에게 말하기…` : '이번 달 대화 한도를 다 썼습니다'}" ${left > 0 && !c.busy ? '' : 'disabled'} aria-label="각료에게 할 말" autocomplete="off"><button type="submit" class="btn primary" ${left > 0 && !c.busy ? '' : 'disabled'}>보내기</button></form>`
    : `<div class="vn-topics">${vnTopics(m).map((t, k) => `<button type="button" class="btn sm" data-chat="topic" data-k="${k}">${esc(t.q)}</button>`).join('')}</div>`;
  const loyTxt = u.loy ? ` · 이번 달 충성 ${u.loy > 0 ? '+' : ''}${u.loy}` : '';
  VN.el.querySelector('.vn-chat').innerHTML = `<div class="vn-cast">${cast}</div>${log}${body}<div class="vn-meta">${ai ? `남은 대화 ${Math.max(0, left)}/${VN_MAX_MSG}${loyTxt} · 충성 ${Math.round(m.loyalty)}` : `준비된 질문 · 충성 ${Math.round(m.loyalty)}`}</div>`;
  const f = VN.el.querySelector('[data-chat-form]');
  if (f) f.onsubmit = e => { e.preventDefault(); const inp = f.querySelector('input'); const v = inp.value.trim(); if (v) { inp.value = ''; vnChatSend(v); } };
}
function vnChatAction(b) {
  const c = VN.chat; if (!c) return;
  if (b.dataset.chat === 'pick') return vnChatSelect(b.dataset.post);
  if (b.dataset.chat === 'topic') {
    const m = G.cabinet[c.post], t = vnTopics(m)[+b.dataset.k]; if (!t) return;
    const a = t.a();
    vnSetSpeaker(vnSpeaker(c.post), a.e);
    vnType(a.t);
  }
}
function vnStrip(t) {
  let s = String(t || '');
  const k = s.indexOf('<<'); if (k >= 0) s = s.slice(0, k);
  return s.replace(/<$/, '').trim();
}
function vnParseTag(t) {
  const m = /<<\s*(\{[\s\S]*?\})\s*>>/.exec(t || '');
  if (!m) return null;
  try { const o = JSON.parse(m[1]); return { e: VN_EMOS.includes(o.e) ? o.e : null, loy: Math.max(-2, Math.min(2, Math.round(+o.loy || 0))) }; } catch (e) { return null; }
}
function vnThreats() {
  const out = [];
  for (const cy of citiesOf(me())) {
    let e = 0;
    for (const j of tilesWithin(cy.tile, 2)) { const g = groundAt(j); if (g && atWar(me(), g.n) && seenUnit(g)) e++; }
    if (e) out.push([cy.name, e]);
  }
  return out.sort((a, b) => b[1] - a[1]).slice(0, 5);
}
function stateBrief() {
  const N = P(), e = economyPreview(me()), R = regime(me());
  const wars = enemiesOf(me()), allies = NATION_IDS.filter(o => o !== me() && allied(me(), o));
  const warTxt = wars.filter(n => G.nations[n].alive).sort((a, b) => militaryPower(b) - militaryPower(a)).slice(0, 8).map(n => `${NATIONS[n].short}(도시 ${citiesOf(n).length}, 전력 ${fmt(militaryPower(n))})`).join(', ');
  const r = G.report;
  const cab = POSTS.map(p => { const x = G.cabinet[p.id]; return x ? `${postTitle(me(), p.id)} ${x.name}(${MINISTER_TRAITS[x.trait].name}, 충성 ${Math.round(x.loyalty)}, 야망 ${Math.round(x.ambition)})` : `${postTitle(me(), p.id)} 공석`; }).join('; ');
  const sanc = G.sanc[me()] || [];
  const s = [
    `날짜: ${dateLabel()} (턴 ${G.turn}/${G.maxTurn})`,
    `국가: ${NATIONS[me()].name} (${REGIME_NAMES[N.gov]}), 지도자: ${G.leader.title} ${G.leader.name}`,
    `국고 ${fmt(N.money)}억$, 다음 달 순수입 ${sgn(e.net)}억$, 연료 ${fmt(N.fuel)} (${sgn(e.fuel)}/턴), 인력 ${fmt(N.manpower)}, 비자금 ${fmt(N.slush || 0)}억$`,
    `안정도 ${Math.round(N.stab)}, 권력 기반 ${Math.round(N.power)}, 국제 평판 ${Math.round(N.rep)}`,
    `세력 충성: ${FACTIONS.map(f => `${factionLabel(me(), f)} ${Math.round(N.fac[f])}(비중 ${Math.round(R.w[f] * 100)}%)`).join(', ')}`,
    `쿠데타 위험 ${pct(coupRisk(me()))}, 봉기 위험 ${pct(revoltRisk(me()))}, 반역 징후 각료 ${plotters().length}명${R.elections && N.nextElection ? `, 다음 선거 ${Math.max(0, N.nextElection - G.turn)}턴 후` : ''}`,
    `교전국: ${warTxt || '없음'}${wars.length > 8 ? ` 외 ${wars.length - 8}개국` : ''}`,
    `동맹: ${allies.slice(0, 10).map(n => NATIONS[n].short).join(', ') || '없음'}`,
    r ? `지난 달: 점령 ${r.gained.slice(0, 4).join(', ') || '없음'}, 상실 ${r.lost.slice(0, 4).join(', ') || '없음'}, 적 격파 ${r.kills}, 아군 손실 ${r.losses}` : '',
    `위협받는 도시: ${vnThreats().map(([n, k]) => `${n}(적 ${k})`).join(', ') || '없음'}`,
    `보유 도시 ${citiesOf(me()).length}/${W.cities.length}, 군 전력 지수 ${fmt(militaryPower(me()))}, 핵탄두 ${N.nukes}, 연구 중: ${N.research ? TECH_BY_ID[N.research].name : '없음'}`,
    `종말 시계: 자정 ${G.doom}초 전. 제재: ${sanc.length ? `${sanc.slice(0, 6).map(nName).join(', ')} (수입 -${pct(sanctionPenalty(me()))})` : '없음'}`,
    r?.world?.length ? `최근 세계 사건: ${r.world.slice(-3).join(' / ')}` : '',
    `내각: ${cab}`,
  ].filter(Boolean).join('\n');
  return s.length > 2900 ? s.slice(0, 2900) : s;
}
const VN_VOICE = {
  hawk: '강경하고 공격적이다. 무력과 선제공격을 선호하고 협상은 약함으로 본다. 짧고 단호한 군인 말투.',
  technocrat: '냉정한 기술관료. 숫자·비용·확률로 말하고 감정적 결정을 경계한다. 차분하고 정확한 말투.',
  loyal: '지도자에게 헌신적이다. 지도자의 안위와 정권 유지를 최우선으로 여긴다. 정중하고 따뜻한 말투.',
  ambitious: '공손하지만 속내를 숨긴다. 자기 세력과 입지를 은근히 챙기며 지도자를 떠보기도 한다. 매끄럽고 계산적인 말투.',
  corrupt: '돈과 이권에 밝다. 비자금·뒷거래를 넌지시 암시한다. 능글맞고 은근한 말투.',
  demagogue: '민심과 선전을 중시한다. 광장·여론·언론 이야기를 즐긴다. 열정적이고 과장된 말투.',
  strategist: '장기 전략가. 적의 다음 수와 판 전체를 본다. 냉철하고 비유를 섞는 말투.',
  inept: '무능하고 우물쭈물한다. 가끔 숫자를 헷갈리거나 엉뚱한 소리를 하지만 악의는 없다. 더듬는 말투.',
};
function advisorPrompt(m) {
  const loyTone = m.loyalty < 35 ? '지도자에게 불만이 있어 말이 퉁명스럽고 은근히 비꼰다.' : m.loyalty > 72 ? '지도자에게 깊이 충성한다.' : '공적이고 신중한 태도를 유지한다.';
  const plot = m.ambition - m.loyalty > 25 ? ' 당신은 은밀히 권력 찬탈을 꿈꾸고 있지만 절대 직접 드러내지 않는다.' : '';
  return `너는 전략 게임 "한반도 대전략"의 등장인물을 연기한다. 플레이어는 이 나라의 독재자다.

[인물]
${NATIONS[me()].name}의 ${postTitle(me(), m.post)} ${m.name} (${m.age}세). 담당: ${POSTS.find(p => p.id === m.post).desc}.
특성: ${MINISTER_TRAITS[m.trait].name} — ${VN_VOICE[m.trait] || ''} 능력 ${m.skill}/5, 충성 ${Math.round(m.loyalty)}/100, 야망 ${Math.round(m.ambition)}/100. ${loyTone}${plot}
지도자를 "${vnAddr()}"라고 부르며 존댓말을 쓴다.

[현재 게임 상태]
${stateBrief()}

[지도자가 실제로 할 수 있는 조치]
칙령: ${DECREES.map(d => d.name).join(', ')}. 첩보 작전: ${OPS.map(o => o.name).join(', ')}. 외교: 강화 제안, 동맹 제안, 관계 개선, 원조 요청, 사이버 공격, 최후통첩, 무기 도입. 군사: 부대 편성·이동·공격, 전략 전개, 미사일·핵 발사. 내각: 각료 교체·숙청·비자금 매수. 연구 과제 선택.

[규칙]
- 반드시 한국어로, 끝까지 이 인물로서만 말한다. AI나 게임이라는 사실을 언급하지 않는다.
- 1~4문장으로 짧게 답한다.
- 위 상태의 실제 수치와 이름에 근거한 구체적 조언을 한다. 게임에 없는 기능·수치·국가를 지어내지 않는다.
- 답의 맨 마지막 줄에 정확히 다음 형식을 붙인다: <<{"e":"감정","loy":정수}>>
  e는 neutral, smile, laugh, sad, cry, angry, surprised, shy, smirk, cold, worried, tired 중 하나(지금 이 인물의 표정).
  loy는 -2~2: 지도자의 말이 당신을 존중·신뢰하면 +, 모욕·위협·무시하면 -, 보통이면 0.`;
}
async function vnChatSend(text) {
  const c = VN.chat; if (!c || c.busy) return;
  const m = G.cabinet[c.post]; if (!m) return;
  const u = vnUsed(m);
  if (u.n >= VN_MAX_MSG) { toast('이번 달에는 더 이상 대화할 수 없습니다'); return; }
  if (!SAMPLE) { vnChatRender(); return; }
  const A = vnAdvState();
  const hist = (A.hist[m.id] || []).filter(h => h && (h.role === 'user' || h.role === 'assistant'));
  // keep strict user/assistant alternation starting with a user turn
  const clean = [];
  for (const h of hist) { if (!clean.length && h.role !== 'user') continue; if (clean.length && clean[clean.length - 1].role === h.role) clean.pop(); clean.push({ role: h.role, content: String(h.content).slice(0, 800) }); }
  if (clean.length && clean[clean.length - 1].role === 'user') clean.pop();
  const turns = [...clean, { role: 'user', content: text }];
  turns[0] = { role: 'user', content: `${advisorPrompt(m)}\n\n[지도자의 말]\n${turns[0].content}` };
  c.busy = true; u.n++;
  const ctl = new AbortController(); c.ctl = ctl;
  const post = c.post;
  vnChatRender();
  const p = VN.el.querySelector('.vn-text');
  p.textContent = '생각하는 중…'; p.classList.add('thinking');
  VN.el.querySelector('.vn-next').hidden = true;
  let got = false;
  try {
    const res = await SAMPLE(turns, {
      cache: false, modelTier: 'quick', signal: ctl.signal,
      onText: ({ text: t }) => { if (VN.chat !== c || c.post !== post) return; got = true; p.classList.remove('thinking'); p.textContent = vnStrip(t) || '…'; },
    });
    if (VN.chat !== c || c.post !== post) return;
    const full = res?.text || '';
    const tag = vnParseTag(full), shown = vnStrip(full) || '…';
    p.classList.remove('thinking'); p.textContent = shown;
    const list = (A.hist[m.id] ||= []);
    list.push({ role: 'user', content: text }, { role: 'assistant', content: full.slice(0, 1200) });
    if (list.length > 12) list.splice(0, list.length - 12);
    if (tag) {
      if (tag.e) vnSetSpeaker(vnSpeaker(post), tag.e);
      const d = Math.max(-3 - u.loy, Math.min(3 - u.loy, tag.loy));
      if (d) { u.loy += d; m.loyalty = clamp(m.loyalty + d, 0, 100); }
    }
    saveGame(false);
  } catch (e) {
    if (VN.chat !== c) return;
    p.classList.remove('thinking');
    const code = e?.code || '';
    if (code === 'cancelled') return;
    u.n = Math.max(0, u.n - 1);
    if (SAMPLE_OFF.includes(code)) { SAMPLE = null; p.textContent = 'AI 참모를 사용할 수 없어 준비된 질문으로 전환합니다.'; }
    else p.textContent = (e?.text ? vnStrip(e.text) + ' ' : '') + ({ rate_limited: '(참모가 잠시 숨을 고릅니다 — 요청이 많습니다. 잠시 후 다시 말씀하십시오.)', refused: '(참모가 그 말에는 대답하지 않습니다.)', upstream_error: '(통신 장애입니다. 다시 시도하십시오.)', prompt_too_large: '(보고가 너무 깁니다. 대화 기록을 줄였습니다.)', session_expired: '(세션이 만료되었습니다. 페이지를 새로 고치세요.)' }[code] || '(통신 장애입니다. 다시 시도하십시오.)');
    if (code === 'prompt_too_large') A.hist[m.id] = (A.hist[m.id] || []).slice(-4);
    if (!got) vnSetSpeaker(vnSpeaker(post), 'tired');
  } finally {
    if (VN.chat === c) { c.busy = false; c.ctl = null; if (c.post === post) vnChatRender(); const inp = VN.el.querySelector('.vn-input input'); if (inp && !inp.disabled) inp.focus({ preventScroll: true }); }
  }
}
function vnChatRefresh() { if (VN.chat && VN.el && !VN.el.hidden) vnChatRender(); }

// Scripted Q&A (no AI): 4 common topics + 1–2 per post, answered from the live game state
function vnTopics(m) {
  const L = vnAddr(), N = P(), tr = m.trait;
  const tail = t => t + (m.loyalty < 30 ? ' …더 물으실 게 있습니까?' : tr === 'inept' ? ' …아마도요.' : '');
  const wars = enemiesOf(me()).filter(n => G.nations[n].alive && !G.nations[n].capitulated);
  const weakest = wars.slice().sort((a, b) => militaryPower(a) - militaryPower(b))[0];
  const strongest = wars.slice().sort((a, b) => militaryPower(b) - militaryPower(a))[0];
  const T = [
    { q: '전선 상황은?', a: () => {
      if (!wars.length) return { e: tr === 'hawk' ? 'smirk' : 'neutral', t: tail(`${L}, 지금은 교전 중인 나라가 없습니다.${tr === 'hawk' ? ' 칼을 뽑을 명분만 있으면 됩니다.' : ''}`) };
      const th = vnThreats(), r = G.report;
      let t = `${L}, ${wars.length}개국과 교전 중입니다. 가장 강한 적은 ${NATIONS[strongest].short}(전력 ${fmt(militaryPower(strongest))}), 우리는 ${fmt(militaryPower(me()))}입니다.`;
      if (th.length) t += ` ${th[0][0]} 방면에 적 ${th[0][1]}개 부대가 붙어 있습니다.`;
      if (r && r.lost.length) t += ` 지난달 ${josa(r.lost.slice(0, 2).join(', '), '을')} 잃었습니다.`;
      return { e: th.length ? (tr === 'hawk' ? 'angry' : 'worried') : 'neutral', t: tail(t) };
    } },
    { q: '예산은?', a: () => {
      const e = economyPreview(me());
      let t = `국고 ${fmt(N.money)}억$, 다음 달 순수입 ${sgn(e.net)}억$입니다.`;
      if (e.net < 0 && N.money > 0) t += ` 이대로면 ${Math.max(1, Math.floor(N.money / -e.net))}개월 버팁니다.`;
      if (e.sanc > 0.01) t += ` 제재로 수입이 ${pct(e.sanc)} 줄었습니다.`;
      if (tr === 'corrupt') t += ` 해외 계좌엔 ${fmt(N.slush || 0)}억$… 든든하시지요.`;
      if (tr === 'technocrat') t += ` 연구 투자 비율은 ${Math.round(N.rd * 100)}%입니다.`;
      return { e: e.net < 0 ? 'worried' : 'smile', t: tail(`${L}, ${t}`) };
    } },
    { q: '쿠데타 위험은?', a: () => {
      const plotting = m.ambition - m.loyalty > 25, pl = plotters().filter(x => x !== m);
      if (plotting) return { e: 'smirk', t: `${L}께서 그런 걱정을 하실 필요는 없습니다. 내각은 전부 충성스럽지요. …저를 포함해서요.` };
      let t = `쿠데타 위험 ${pct(coupRisk(me()))}, 봉기 위험 ${pct(revoltRisk(me()))}입니다. 군부 충성 ${Math.round(N.fac.army)}, 보안기관 ${Math.round(N.fac.sec)}.`;
      if (pl.length) t += ` ${postTitle(me(), pl[0].post)} ${josa(pl[0].name, '을')} 지켜보셔야 합니다.`;
      return { e: coupRisk(me()) > 0.12 || pl.length ? 'worried' : 'neutral', t: tail(`${L}, ${t}`) };
    } },
    { q: '다음 목표는?', a: () => {
      let t;
      if (m.post === 'economy') t = N.research ? `연구 중인 ${TECH_BY_ID[N.research].name}부터 끝내시지요. 그리고 돈이 새는 곳을 막아야 합니다.` : '연구 과제부터 정하십시오. 놀고 있는 연구소는 낭비입니다.';
      else if (m.post === 'foreign') { const foe = wars.slice().sort((a, b) => rel(me(), b) - rel(me(), a))[0]; t = foe ? `${NATIONS[foe].short}와는 관계가 ${Math.round(rel(me(), foe))}입니다. 강화 제안을 넣어 볼 만합니다.` : '동맹을 넓힐 때입니다. 외교 탭에서 관계 개선부터 하시지요.'; }
      else if (m.post === 'interior') t = N.fac.people < 45 ? `민중 지지가 ${Math.round(N.fac.people)}입니다. 배급 확대나 대국민 담화가 급합니다.` : '치안은 안정적입니다. 이 틈에 권력 기반을 다지시지요.';
      else if (m.post === 'intel') t = strongest ? `${NATIONS[strongest].short}에 공작을 거시지요. 허위정보나 사보타주면 충분히 흔들립니다.` : '지금은 정보망을 넓혀 두는 게 좋겠습니다.';
      else t = weakest ? `${NATIONS[weakest].short}의 전력이 가장 약합니다 (지수 ${fmt(militaryPower(weakest))}). 거기부터 치시지요.` : tr === 'hawk' ? '전쟁이 없으니 군을 키우십시오. 명분은 만들면 됩니다.' : '병력을 정비하고 방공망을 보강하십시오.';
      return { e: tr === 'hawk' ? 'smirk' : 'neutral', t: tail(`${L}, ${t}`) };
    } },
  ];
  const extra = {
    defense: [{ q: '병력 상태는?', a: () => { const n = G.units.filter(x => x.n === me()).length; return { e: N.fuel < 15 ? 'worried' : 'neutral', t: tail(`${L}, 부대 ${n}개, 인력 ${fmt(N.manpower)}, 연료 ${fmt(N.fuel)}입니다. 전투 사기는 ×${fmt(morale(me()), 2)}.`) }; } }],
    chief: [{ q: '핵 억지력은?', a: () => ({ e: N.nukes ? 'cold' : 'worried', t: tail(N.nukes ? `${L}, 핵탄두 ${N.nukes}기가 준비돼 있습니다. 종말 시계는 자정 ${G.doom}초 전입니다. 쓰는 순간 세계가 달라집니다.` : `${L}, 우리에겐 핵이 없습니다. 종말 시계는 자정 ${G.doom}초 전입니다.`) }) }],
    intel: [{ q: '적의 움직임은?', a: () => { const th = vnThreats(); return { e: th.length ? 'cold' : 'neutral', t: tail(th.length ? `${L}, ${th.map(([n, k]) => `${n}(적 ${k})`).join(', ')} 주변에 적 부대가 포착됐습니다.` : `${L}, 우리 도시 근처에서 포착된 적 부대는 없습니다.`) }; } }],
    interior: [{ q: '민심은?', a: () => ({ e: N.fac.people < 40 ? 'worried' : 'smile', t: tail(`${L}, 민중 지지 ${Math.round(N.fac.people)}, 안정도 ${Math.round(N.stab)}입니다. 봉기 위험은 ${pct(revoltRisk(me()))}.`) }) }],
    economy: [{ q: '제재 영향은?', a: () => { const s = G.sanc[me()] || []; return { e: s.length ? 'worried' : 'smile', t: tail(s.length ? `${L}, ${s.slice(0, 5).map(nName).join(', ')}의 제재로 수입이 ${pct(sanctionPenalty(me()))} 깎이고 있습니다.` : `${L}, 현재 우리를 제재하는 나라는 없습니다.`) }; } }],
    foreign: [{ q: '우리 평판은?', a: () => ({ e: N.rep < -30 ? 'worried' : 'neutral', t: tail(`${L}, 국제 평판은 ${Math.round(N.rep)}입니다. 동맹국은 ${NATION_IDS.filter(o => o !== me() && allied(me(), o)).length}개국입니다.`) }) }],
  };
  return [...T, ...(extra[m.post] || [])];
}
