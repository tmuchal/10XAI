// 한반도 대전략 — renderer, input, panels, turn flow
'use strict';

const S = 20, SQ3 = Math.sqrt(3);
const CORNERS = [...Array(6)].map((_, i) => { const a = Math.PI / 180 * (60 * i - 30); return [Math.cos(a) * S, Math.sin(a) * S]; });
const DIR_CORNERS = [[0, 1], [5, 0], [4, 5], [3, 4], [2, 3], [1, 2]];
const COLW = S * SQ3, ROWH = S * 1.5;
const WORLD_W = COLW * HEX.W, WORLD_H = ROWH * (HEX.H - 1) + S * 3;
const COL = { bg: '#0A1823', sea: '#0F2433', shallow: '#15344A', grid: 'rgba(140,180,205,0.07)', coast: '#08131B', label: '#EFE9DA', halo: 'rgba(7,15,21,0.9)', fog: 'rgba(6,13,19,0.42)', accent: '#F2B544', danger: '#E35D51', ok: '#72C282' };
const SAVE_KEY = 'kws-world-v2';
const FONT = "'IBM Plex Sans KR', 'Noto Sans KR', sans-serif";

const $ = s => document.querySelector(s);
const canvas = $('#map'), ctx = canvas.getContext('2d');
const UI = {
  sel: null, reach: null, targets: new Map(), mode: null, tab: 'sel', hover: -1, missile: null, nuclear: false,
  cam: { x: 0, y: 0, z: 1 }, vis: null, fx: [], anim: new Map(), busy: false, dirty: true, dpr: 1, lowres: null, lowDirty: true, labels: [],
  setup: { scen: 'dictator', nat: 'KOR', diff: 'normal', fog: true, turns: 120, name: '', title: '' }, cycle: 0, dipFilter: 'major', dipSearch: '',
};

// ---------- helpers ----------
function tileXY(i) { const t = W.tiles[i]; return [COLW * (t.c + 0.5 * (t.r & 1)) + S, ROWH * t.r + S]; }
function nearX(x) { const cx = UI.cam.x + canvas.clientWidth / 2 / UI.cam.z; return x + WORLD_W * Math.round((cx - x) / WORLD_W); }
function txy(i) { const [x, y] = tileXY(i); return [nearX(x), y]; }
function hexPath(x, y, k = 1) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const [cx, cy] = CORNERS[i]; i ? ctx.lineTo(x + cx * k, y + cy * k) : ctx.moveTo(x + cx * k, y + cy * k); } ctx.closePath(); }
function hexRGB(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgba(hex, a) { const [r, g, b] = hexRGB(hex); return `rgba(${r},${g},${b},${a})`; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const fmt = (v, d = 0) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('ko-KR');
const sgn = v => (v >= 0 ? '+' : '') + fmt(v, Math.abs(v) < 10 ? 1 : 0);
const me = () => G.player;
const P = () => G.nations[G.player];
const pct = v => `${Math.round(v * 100)}%`;

// ---------- vision & selection ----------
function refreshVision() { UI.vis = G.fog ? visionFor(me()) : null; }
function seen(i) { return !UI.vis || !!UI.vis[i]; }
function seenUnit(u) { return !UI.vis || unitVisible(u, me(), UI.vis); }
function selUnit() { return UI.sel?.kind === 'unit' ? uById.get(UI.sel.id) || null : null; }
function selTile() { const u = selUnit(); return u ? u.pos : UI.sel?.kind === 'tile' ? UI.sel.i : -1; }
function computeOrders() {
  UI.reach = null; UI.targets = new Map();
  const u = selUnit();
  if (!u || u.n !== me() || UI.busy) return;
  const dom = CLASSES[u.t].dom;
  const eT = enemyTiles(me());
  if (dom === 'air') { if (UI.mode === 'air') for (const k of attackTargets(u, u.pos, UI.vis, eT)) UI.targets.set(k, u.pos); return; }
  UI.reach = reachable(u);
  if (!canAttackFrom(u)) return;
  for (const [j, r] of UI.reach) {
    if (j !== u.pos && (r.left <= 0 || !canEnd(u, j))) continue;
    for (const k of attackTargets(u, j, UI.vis, eT)) {
      const prev = UI.targets.get(k);
      if (prev === undefined || j === u.pos || (prev !== u.pos && r.left > UI.reach.get(prev).left)) UI.targets.set(k, j);
    }
  }
}
function select(sel) {
  UI.sel = sel;
  if (UI.mode !== 'missile') UI.mode = null;
  computeOrders();
  UI.dirty = true;
  if (sel && UI.tab !== 'sel') UI.tab = 'sel';
  renderPanel(); renderModebar();
}

// ---------- camera ----------
function clampCam() {
  const vh = canvas.clientHeight / UI.cam.z;
  UI.cam.y = clamp(UI.cam.y, -vh * 0.3, WORLD_H - vh * 0.7);
  UI.cam.x = ((UI.cam.x % WORLD_W) + WORLD_W) % WORLD_W;
}
function centerOn(i, z) {
  const [x, y] = tileXY(i);
  if (z) UI.cam.z = z;
  UI.cam.x = x - canvas.clientWidth / 2 / UI.cam.z;
  UI.cam.y = y - canvas.clientHeight / 2 / UI.cam.z;
  clampCam(); UI.dirty = true;
}
function zoomAt(sx, sy, f) {
  const wx = UI.cam.x + sx / UI.cam.z, wy = UI.cam.y + sy / UI.cam.z;
  UI.cam.z = clamp(UI.cam.z * f, 0.08, 3);
  UI.cam.x = wx - sx / UI.cam.z; UI.cam.y = wy - sy / UI.cam.z;
  clampCam(); UI.dirty = true;
}
function screenToTile(sx, sy) {
  let wx = UI.cam.x + sx / UI.cam.z; const wy = UI.cam.y + sy / UI.cam.z;
  wx = ((wx % WORLD_W) + WORLD_W) % WORLD_W;
  const r0 = Math.round((wy - S) / ROWH);
  let best = -1, bd = INF;
  for (let r = r0 - 1; r <= r0 + 1; r++) {
    if (r < 0 || r >= HEX.H) continue;
    const c0 = Math.round((wx - S) / COLW - 0.5 * (r & 1));
    for (let c = c0 - 1; c <= c0 + 1; c++) {
      const i = tileIdx(c, r); if (i < 0) continue;
      let x = COLW * (c + 0.5 * (r & 1)) + S; const y = ROWH * r + S;
      const d = (x - wx) ** 2 + (y - wy) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
  }
  return best;
}
function resize() {
  const r = canvas.getBoundingClientRect();
  UI.dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(r.width * UI.dpr));
  canvas.height = Math.max(1, Math.round(r.height * UI.dpr));
  clampCam(); UI.dirty = true;
}

// ---------- low-zoom political map (1 tile = 2×1 px, odd rows shifted 1 px) ----------
const TCOL = {};
for (const [k, v] of Object.entries(TERRAIN_KIND)) TCOL[k] = hexRGB(v.col);
function rebuildLowres() {
  UI.lowDirty = false;
  const w = HEX.W * 2 + 1, h = HEX.H;
  const cv = UI.lowres || (UI.lowres = document.createElement('canvas'));
  cv.width = w; cv.height = h;
  const c2 = cv.getContext('2d'), img = c2.createImageData(w, h), d = img.data;
  const natRGB = {};
  const sea = hexRGB(COL.sea), shallow = hexRGB(COL.shallow);
  const cen = {};
  for (const t of W.tiles) {
    let rgb;
    if (!t.land) rgb = t.nb.some(k => W.tiles[k].land) ? shallow : sea;
    else {
      const o = tileOwner(t.i), base = TCOL[t.terrain];
      const nc = natRGB[o] || (natRGB[o] = hexRGB(NATIONS[o].color));
      const a = o === t.nat ? 0.55 : 0.75;
      rgb = [base[0] * (1 - a) + nc[0] * a, base[1] * (1 - a) + nc[1] * a, base[2] * (1 - a) + nc[2] * a];
      if (t.nb.some(k => W.tiles[k].land && tileOwner(k) !== o)) rgb = rgb.map(v => v * 0.55);
      const C = cen[o] || (cen[o] = { sx: 0, sy: 0, sr: 0, n: 0 });
      const ang = (t.c + 0.5 * (t.r & 1)) / HEX.W * Math.PI * 2;
      C.sx += Math.cos(ang); C.sy += Math.sin(ang); C.sr += t.r; C.n++;
    }
    for (let k = 0; k < 2; k++) {
      const x = 2 * t.c + (t.r & 1) + k, p = (t.r * w + x) * 4;
      d[p] = rgb[0]; d[p + 1] = rgb[1]; d[p + 2] = rgb[2]; d[p + 3] = 255;
    }
  }
  for (let r = 0; r < h; r++) { const p = (r * w) * 4, q = (r * w + w - 1) * 4; if (!(r & 1)) { d[q] = d[p]; d[q + 1] = d[p + 1]; d[q + 2] = d[p + 2]; d[q + 3] = 255; } else { d[p] = d[q - 4]; d[p + 1] = d[q - 3]; d[p + 2] = d[q - 2]; d[p + 3] = 255; } }
  c2.putImageData(img, 0, 0);
  UI.labels = Object.entries(cen).filter(([, C]) => C.n >= 6).map(([n, C]) => {
    let a = Math.atan2(C.sy, C.sx); if (a < 0) a += Math.PI * 2;
    return { n, x: a / (Math.PI * 2) * WORLD_W + S, y: ROWH * (C.sr / C.n) + S, size: C.n };
  });
}

// ---------- drawing ----------
function drawTerrainGlyph(t, x, y) {
  ctx.lineWidth = 1.1;
  if (t.terrain === 'mount') {
    ctx.strokeStyle = 'rgba(20,24,18,0.45)'; ctx.fillStyle = 'rgba(240,232,210,0.28)';
    for (const [ox, oy, s] of [[-5, 3, 6], [3, 4, 5]]) {
      ctx.beginPath(); ctx.moveTo(x + ox - s, y + oy); ctx.lineTo(x + ox, y + oy - s * 1.3); ctx.lineTo(x + ox + s, y + oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + ox - s * 0.35, y + oy - s * 0.85); ctx.lineTo(x + ox, y + oy - s * 1.3); ctx.lineTo(x + ox + s * 0.35, y + oy - s * 0.85); ctx.closePath(); ctx.fill();
    }
  } else if (t.terrain === 'hill') {
    ctx.strokeStyle = 'rgba(20,24,18,0.45)';
    ctx.beginPath(); ctx.arc(x - 4, y + 4, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 4, y + 5, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else if (t.terrain === 'forest' || t.terrain === 'jungle') {
    ctx.fillStyle = t.terrain === 'jungle' ? 'rgba(10,40,16,0.6)' : 'rgba(22,40,24,0.55)';
    for (const [ox, oy] of [[-5, 1], [2, -3], [4, 4], [-1, 6]]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, 2.6, 0, 6.3); ctx.fill(); }
  } else if (t.terrain === 'desert') {
    ctx.fillStyle = 'rgba(90,70,30,0.35)';
    for (const [ox, oy] of [[-6, 2], [0, -4], [5, 3], [-2, 6], [6, -2]]) ctx.fillRect(x + ox, y + oy, 1.6, 1.6);
  } else if (t.terrain === 'tundra') {
    ctx.strokeStyle = 'rgba(230,240,245,0.35)';
    ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 2, y); ctx.moveTo(x + 1, y + 4); ctx.lineTo(x + 6, y + 4); ctx.stroke();
  }
}
function drawSymbol(t, x, y, w, h, fill, ink, emb) {
  const dom = CLASSES[t].dom;
  ctx.lineWidth = Math.max(1, w * 0.06); ctx.fillStyle = fill; ctx.strokeStyle = ink;
  if (dom === 'sea') {
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.5, h * 0.55, 0, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (t === 'dd') { ctx.moveTo(x - w * 0.32, y - h * 0.05); ctx.lineTo(x + w * 0.32, y - h * 0.05); ctx.lineTo(x + w * 0.2, y + h * 0.22); ctx.lineTo(x - w * 0.24, y + h * 0.22); ctx.closePath(); ctx.moveTo(x - w * 0.05, y - h * 0.05); ctx.lineTo(x - w * 0.05, y - h * 0.28); ctx.lineTo(x + w * 0.08, y - h * 0.28); ctx.lineTo(x + w * 0.08, y - h * 0.05); }
    else if (t === 'cv' || t === 'lhd') { ctx.moveTo(x - w * 0.36, y); ctx.lineTo(x + w * 0.36, y); ctx.lineTo(x + w * 0.28, y + h * 0.2); ctx.lineTo(x - w * 0.3, y + h * 0.2); ctx.closePath(); ctx.rect(x + w * 0.05, y - h * 0.18, w * 0.1, h * 0.18); }
    else { ctx.ellipse(x, y + h * 0.08, w * 0.32, h * 0.14, 0, 0, 6.3); ctx.moveTo(x - w * 0.04, y - h * 0.06); ctx.lineTo(x - w * 0.04, y - h * 0.26); ctx.lineTo(x + w * 0.08, y - h * 0.26); ctx.lineTo(x + w * 0.08, y - h * 0.06); }
    ctx.stroke();
    const tag = { ssn: 'N', ssbn: 'B', lhd: 'L' }[t];
    if (tag) { ctx.fillStyle = ink; ctx.font = `700 ${h * 0.34}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tag, x - w * 0.22, y - h * 0.16); }
    return;
  }
  ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
  const l = x - w / 2, r = x + w / 2, tp = y - h / 2, bt = y + h / 2;
  ctx.beginPath();
  if (t === 'inf' || t === 'mech' || t === 'marine') { ctx.moveTo(l, tp); ctx.lineTo(r, bt); ctx.moveTo(r, tp); ctx.lineTo(l, bt); }
  if (t === 'mbt' || t === 'mech') { ctx.moveTo(x + w * 0.3, y); ctx.ellipse(x, y, w * 0.3, h * 0.26, 0, 0, 6.3); }
  if (t === 'shorad' || t === 'sam') { ctx.moveTo(l + w * 0.12, bt); ctx.quadraticCurveTo(x, tp - h * 0.1, r - w * 0.12, bt); }
  if (t === 'mlrs') { ctx.moveTo(x - w * 0.25, y + h * 0.2); ctx.lineTo(x, y - h * 0.2); ctx.lineTo(x + w * 0.25, y + h * 0.2); }
  ctx.stroke();
  if (t === 'spg' || t === 'mlrs') { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y + (t === 'mlrs' ? h * 0.05 : 0), h * 0.15, 0, 6.3); ctx.fill(); }
  const tag = { sof: 'SF', sam: 'BMD', marine: 'M' }[t];
  if (tag) { ctx.fillStyle = ink; ctx.font = `700 ${h * (tag.length > 2 ? 0.28 : 0.4)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tag, x, t === 'marine' ? y - h * 0.22 : t === 'sam' ? y - h * 0.08 : y); }
  if (emb) { ctx.strokeStyle = '#9FD3F0'; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const px = l + (w * k) / 8, py = bt + h * 0.22 + (k % 2 ? -2 : 2); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
}
function hpColor(hp) { return hp > 66 ? COL.ok : hp > 33 ? COL.accent : COL.danger; }
function unitWorldPos(u, now) {
  const a = UI.anim.get(u.id);
  if (a) {
    const p = clamp((now - a.t0) / a.dur, 0, 1);
    if (p >= 1) UI.anim.delete(u.id);
    else {
      const f = p * (a.path.length - 1), k = Math.floor(f), m = f - k;
      const A = a.path[k], B = a.path[Math.min(k + 1, a.path.length - 1)];
      let bx = B[0]; if (Math.abs(bx - A[0]) > WORLD_W / 2) bx += bx < A[0] ? WORLD_W : -WORLD_W;
      return [nearX(A[0] + (bx - A[0]) * m), A[1] + (B[1] - A[1]) * m];
    }
  }
  return txy(u.pos);
}
function draw(now) {
  const z = UI.cam.z, dpr = UI.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!G) return;
  ctx.setTransform(dpr * z, 0, 0, dpr * z, -UI.cam.x * dpr * z, -UI.cam.y * dpr * z);
  const vw = canvas.clientWidth / z, vh = canvas.clientHeight / z;
  const hexPx = COLW * z;
  const px = v => v / z;
  const low = hexPx < 11;
  if (low) {
    if (UI.lowDirty || !UI.lowres) rebuildLowres();
    ctx.imageSmoothingEnabled = hexPx < 4;
    for (let k = -1; k <= 1; k++) {
      const ox = Math.floor(UI.cam.x / WORLD_W) * WORLD_W + k * WORLD_W;
      ctx.drawImage(UI.lowres, 0, 0, UI.lowres.width, UI.lowres.height, ox + S - COLW / 2, S - ROWH / 2, (UI.lowres.width) * COLW / 2, HEX.H * ROWH);
    }
    ctx.imageSmoothingEnabled = true;
  } else {
    const r0 = Math.max(0, Math.floor((UI.cam.y - S) / ROWH) - 1), r1 = Math.min(HEX.H - 1, Math.ceil((UI.cam.y + vh) / ROWH) + 1);
    const c0 = Math.floor(UI.cam.x / COLW) - 1, c1 = Math.ceil((UI.cam.x + vw) / COLW) + 1;
    const view = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) view.push([tileIdx(c, r), COLW * (c + 0.5 * (r & 1)) + S, ROWH * r + S]);
    for (const [i, x, y] of view) {
      const t = W.tiles[i];
      hexPath(x, y, 1.03);
      if (!t.land) { ctx.fillStyle = t.coast || t.nb.some(k => W.tiles[k].land) ? COL.shallow : COL.sea; ctx.fill(); if (z > 0.9) { ctx.strokeStyle = COL.grid; ctx.lineWidth = px(1); ctx.stroke(); } continue; }
      ctx.fillStyle = TERRAIN_KIND[t.terrain].col; ctx.fill();
      const o = tileOwner(i);
      if (o) { ctx.fillStyle = rgba(NATIONS[o].color, o === t.nat ? 0.3 : 0.45); ctx.fill(); }
      if (o && o !== t.nat) { ctx.save(); hexPath(x, y); ctx.clip(); ctx.strokeStyle = rgba(NATIONS[o].color, 0.5); ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(x - S + k * 7, y + S); ctx.lineTo(x + S + k * 7, y - S); } ctx.stroke(); ctx.restore(); }
      if ((G.fallout[i] ?? -1) >= G.turn) { ctx.fillStyle = 'rgba(190,230,60,0.28)'; ctx.fill(); }
      if (z > 0.5) drawTerrainGlyph(t, x, y);
    }
    for (const [i, x, y] of view) {
      const t = W.tiles[i]; if (!t.land) continue;
      const o = tileOwner(i);
      t.nb.forEach((j, n) => {
        const d = t.nbDir[n], tj = W.tiles[j], [a, b] = DIR_CORNERS[d];
        if (!tj.land) { ctx.strokeStyle = COL.coast; ctx.lineWidth = Math.max(1.4, px(1.6)); ctx.beginPath(); ctx.moveTo(x + CORNERS[a][0], y + CORNERS[a][1]); ctx.lineTo(x + CORNERS[b][0], y + CORNERS[b][1]); ctx.stroke(); }
        else if (tileOwner(j) !== o && o) { const k = 0.9; ctx.strokeStyle = NATIONS[o].color; ctx.lineWidth = Math.max(1.6, px(2.2)); ctx.beginPath(); ctx.moveTo(x + CORNERS[a][0] * k, y + CORNERS[a][1] * k); ctx.lineTo(x + CORNERS[b][0] * k, y + CORNERS[b][1] * k); ctx.stroke(); }
      });
    }
    if (UI.vis) { ctx.fillStyle = COL.fog; for (const [i, x, y] of view) if (!UI.vis[i]) { hexPath(x, y, 1.03); ctx.fill(); } }
  }
  // sea labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [name, lon, lat, sz] of SEA_LABELS) {
    const [c, r] = lonLatToCR(lon, lat); const i = tileIdx(c, r); if (i < 0) continue;
    const [x, y] = txy(i);
    const fs = low ? Math.max(px(11), 14 * sz * 2.4) : Math.max(px(11), 14 * sz);
    ctx.font = `italic 500 ${fs}px ${FONT}`; ctx.fillStyle = 'rgba(150,190,215,0.42)'; ctx.fillText(name.split('').join(' '), x, y);
  }
  const su = selUnit();
  if (!low) drawOrders(su, px);
  drawCities(low, px, z);
  drawUnits(now, low, px, vw, vh);
  if (low) {
    for (const L of UI.labels) {
      if (NATIONS[L.n].tier !== 'major' && L.size < 40 && hexPx < 5) continue;
      const fs = clamp(Math.sqrt(L.size) * 6, 40, 180) * (NATIONS[L.n].tier === 'major' ? 1 : 0.6);
      if (fs * z < 9) continue;
      ctx.font = `700 ${fs}px ${FONT}`; ctx.lineWidth = fs * 0.14; ctx.strokeStyle = COL.halo; ctx.lineJoin = 'round';
      const x = nearX(L.x);
      ctx.strokeText(NATIONS[L.n].short, x, L.y); ctx.fillStyle = 'rgba(245,240,228,0.92)'; ctx.fillText(NATIONS[L.n].short, x, L.y);
    }
  }
  drawFx(now, px);
}
function drawOrders(su, px) {
  if (UI.reach && su) {
    for (const [j, r] of UI.reach) {
      if (j === su.pos || !canEnd(su, j)) continue;
      const [x, y] = txy(j); hexPath(x, y, 0.86);
      ctx.fillStyle = r.left > 0 ? 'rgba(242,181,68,0.22)' : 'rgba(242,181,68,0.12)'; ctx.fill();
      ctx.strokeStyle = 'rgba(242,181,68,0.55)'; ctx.lineWidth = px(1.2); ctx.stroke();
    }
  }
  for (const [k] of UI.targets) { const [x, y] = txy(k); hexPath(x, y, 0.8); ctx.strokeStyle = COL.danger; ctx.lineWidth = px(2.4); ctx.setLineDash([px(5), px(3)]); ctx.stroke(); ctx.setLineDash([]); }
  if (UI.mode === 'missile' && UI.mtargets) for (const i of UI.mtargets) { const [x, y] = txy(i); hexPath(x, y, 0.82); ctx.fillStyle = UI.nuclear ? 'rgba(198,240,74,0.22)' : 'rgba(255,138,91,0.22)'; ctx.fill(); ctx.strokeStyle = UI.nuclear ? '#C6F04A' : '#FF8A5B'; ctx.lineWidth = px(3); ctx.stroke(); }
  if ((UI.mode === 'rebase' || UI.mode === 'deploy') && UI.mtargets) for (const i of UI.mtargets) { const [x, y] = txy(i); hexPath(x, y, 0.85); ctx.strokeStyle = COL.ok; ctx.lineWidth = px(2.4); ctx.stroke(); }
  if (UI.hover >= 0 && !UI.busy) { const [x, y] = txy(UI.hover); hexPath(x, y, 0.95); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = px(1.4); ctx.stroke(); }
  if (su && UI.reach && UI.hover >= 0) {
    const dest = UI.targets.has(UI.hover) ? UI.targets.get(UI.hover) : UI.hover;
    if (UI.reach.has(dest) && dest !== su.pos) {
      const path = pathTo(UI.reach, dest).map(txy);
      ctx.strokeStyle = COL.accent; ctx.lineWidth = px(2.5); ctx.setLineDash([px(6), px(4)]);
      ctx.beginPath(); path.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  if (UI.sel?.kind === 'tile' || (su && CLASSES[su.t].dom === 'air')) {
    const [x, y] = txy(selTile()); hexPath(x, y, 0.92); ctx.strokeStyle = COL.accent; ctx.lineWidth = px(2.5); ctx.stroke();
    if (su && CLASSES[su.t].dom === 'air' && UI.mode === 'air') { const rpx = unitKm(su) / 111 / HEX.DLON * COLW * Math.max(0.4, Math.cos(W.tiles[su.pos].lat * Math.PI / 180)); ctx.beginPath(); ctx.arc(x, y, rpx, 0, 6.3); ctx.strokeStyle = 'rgba(242,181,68,0.5)'; ctx.setLineDash([px(8), px(5)]); ctx.lineWidth = px(1.5); ctx.stroke(); ctx.setLineDash([]); }
  }
}
function drawCities(low, px, z) {
  const vw = canvas.clientWidth / z, vh = canvas.clientHeight / z;
  for (const cy of W.cities) {
    const c = G.cities[cy.id];
    const [x, y] = txy(cy.tile);
    if (x < UI.cam.x - 60 || x > UI.cam.x + vw + 60 || y < UI.cam.y - 60 || y > UI.cam.y + vh + 60) continue;
    const col = NATIONS[c.owner].color;
    const isCap = G.nations[c.owner].capital === cy.id;
    if (low) {
      if (!isCap && c.pop < 7 && z < 0.2) continue;
      const s = px(isCap ? 4 : 2.5);
      ctx.fillStyle = '#10181F'; ctx.fillRect(x - s - px(1), y - s - px(1), 2 * s + px(2), 2 * s + px(2));
      ctx.fillStyle = col; ctx.fillRect(x - s, y - s, 2 * s, 2 * s);
      if (z > 0.2 && (isCap || c.pop >= 8)) { ctx.font = `600 ${px(10)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = px(3); ctx.strokeStyle = COL.halo; ctx.strokeText(cy.name, x, y + s + px(2)); ctx.fillStyle = COL.label; ctx.fillText(cy.name, x, y + s + px(2)); }
      continue;
    }
    const s = 5 + Math.min(4, c.pop * 0.45);
    ctx.fillStyle = '#10181F'; ctx.fillRect(x - s - 1.5, y - s - 1.5, s * 2 + 3, s * 2 + 3);
    ctx.fillStyle = col; ctx.fillRect(x - s, y - s, s * 2, s * 2);
    if (c.nuked) { ctx.strokeStyle = '#C6F04A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, s + 3, 0, 6.3); ctx.stroke(); }
    if (isCap) { ctx.fillStyle = '#10181F'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? s * 0.42 : s * 0.95; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.fill(); }
    for (let k = 0; k < c.fort; k++) { ctx.strokeStyle = '#E8E2D2'; ctx.lineWidth = 1.2; ctx.strokeRect(x - s - 3.5 - k * 2.5, y - s - 3.5 - k * 2.5, (s + 3.5 + k * 2.5) * 2, (s + 3.5 + k * 2.5) * 2); }
    const air = airAt(cy.tile).filter(u => !u.carrier && seenUnit(u));
    if (air.length) {
      ctx.fillStyle = NATIONS[air[0].n].color; ctx.strokeStyle = '#10181F'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + s + 5, y - s - 3, 6, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#10181F'; ctx.font = `700 8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✈' + (air.length > 1 ? air.length : ''), x + s + 5, y - s - 2.5);
    }
    if (z > 0.75 || c.pop >= 6 || isCap || (z > 0.5 && c.pop >= 4)) {
      ctx.font = `700 ${Math.max(px(11), 7.5)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = px(3.2); ctx.strokeStyle = COL.halo; ctx.lineJoin = 'round';
      ctx.strokeText(cy.name, x, y + S * 0.62); ctx.fillStyle = COL.label; ctx.fillText(cy.name, x, y + S * 0.62);
    }
    if (c.hp < 100) { ctx.fillStyle = '#10181F'; ctx.fillRect(x - 9, y - S * 0.95, 18, 3.5); ctx.fillStyle = hpColor(c.hp); ctx.fillRect(x - 9, y - S * 0.95, 18 * c.hp / 100, 3.5); }
    if (cy.port && blockaded(cy.id)) { ctx.strokeStyle = COL.danger; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s + 6, 0, 6.3); ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]); }
  }
}
function drawUnits(now, low, px, vw, vh) {
  for (const u of G.units) {
    const C = CLASSES[u.t], dom = C.dom;
    if (dom === 'air' || !seenUnit(u)) continue;
    const [x0, y0] = unitWorldPos(u, now);
    if (x0 < UI.cam.x - S * 3 || x0 > UI.cam.x + vw + S * 3 || y0 < UI.cam.y - S * 3 || y0 > UI.cam.y + vh + S * 3) continue;
    if (low) {
      if (u.n !== me() && UI.cam.z < 0.2) continue;
      ctx.fillStyle = NATIONS[u.n].color; ctx.strokeStyle = '#0B141B'; ctx.lineWidth = px(1);
      const s = px(u.n === me() ? 3 : 2.2);
      ctx.beginPath(); dom === 'sea' ? ctx.arc(x0, y0, s, 0, 6.3) : ctx.rect(x0 - s, y0 - s, 2 * s, 2 * s); ctx.fill(); ctx.stroke();
      continue;
    }
    const onCity = W.tiles[u.pos].city >= 0 && !UI.anim.has(u.id);
    const x = x0 + (onCity ? (dom === 'sea' ? S * 0.45 : -S * 0.1) : 0), y = y0 - (onCity ? S * 0.3 : S * 0.08) + (dom === 'sea' && onCity ? S * 0.55 : 0);
    const w = S * 1.08, h = S * 0.72;
    const done = u.n === me() && (u.mv <= 0 || u.acted);
    ctx.globalAlpha = done ? 0.55 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - w / 2 + 1.5, y - h / 2 + 2, w, h);
    drawSymbol(u.t, x, y, w, h, NATIONS[u.n].color, '#12181c', u.emb);
    ctx.fillStyle = '#10181F'; ctx.fillRect(x - w / 2, y + h / 2 + 1.5, w, 3.2);
    ctx.fillStyle = hpColor(u.hp); ctx.fillRect(x - w / 2, y + h / 2 + 1.5, w * u.hp / 100, 3.2);
    for (let k = 0; k < vet(u); k++) { ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.moveTo(x + w / 2 - 2 - k * 4, y - h / 2 - 1); ctx.lineTo(x + w / 2 + 1 - k * 4, y - h / 2 - 5); ctx.lineTo(x + w / 2 + 4 - k * 4, y - h / 2 - 1); ctx.fill(); }
    if (u.t === 'cv') { const k = carrierAirCount(u.id); if (k) { ctx.fillStyle = COL.label; ctx.font = `700 8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('✈' + k, x, y - h / 2 - 1); } }
    if (u.fort > 0 && dom === 'land' && !u.emb) { ctx.strokeStyle = '#E8E2D2'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - w / 2 - 3, y - h / 2); ctx.lineTo(x - w / 2 - 3, y + h / 2); ctx.moveTo(x + w / 2 + 3, y - h / 2); ctx.lineTo(x + w / 2 + 3, y + h / 2); ctx.stroke(); }
    if (u.n === me() && !supplied(u)) { ctx.fillStyle = COL.danger; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('보급!', x, y - h / 2 - 2); }
    ctx.globalAlpha = 1;
    if (UI.sel?.kind === 'unit' && UI.sel.id === u.id) { ctx.strokeStyle = COL.accent; ctx.lineWidth = px(2.5); ctx.strokeRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6); }
  }
}
function drawFx(now, px) {
  UI.fx = UI.fx.filter(f => now < f.t0 + f.dur);
  for (const f of UI.fx) {
    const p = (now - f.t0) / f.dur; if (p < 0) continue;
    if (f.k === 'shot') {
      const [ax, ay] = txy(f.from); let [bx, by] = tileXY(f.to); bx = ax + ((bx - ax + WORLD_W * 1.5) % WORLD_W) - WORLD_W / 2;
      ctx.strokeStyle = f.dom === 'rebase' ? rgba('#72C282', 1 - p) : f.dom === 'air' ? `rgba(180,220,255,${1 - p})` : `rgba(255,214,120,${1 - p})`;
      ctx.lineWidth = px(2); ctx.beginPath(); ctx.moveTo(ax, ay);
      if (f.dom === 'air' || f.dom === 'rebase') ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 60, bx, by); else ctx.lineTo(bx, by);
      ctx.stroke();
    } else if (f.k === 'dmg') {
      const [x, y] = txy(f.i);
      ctx.font = `700 ${px(14)}px 'IBM Plex Mono', monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1 - p * p; ctx.lineWidth = px(3); ctx.strokeStyle = COL.halo; ctx.strokeText(f.text, x, y - 10 - p * 22);
      ctx.fillStyle = '#FF9C8F'; ctx.fillText(f.text, x, y - 10 - p * 22); ctx.globalAlpha = 1;
    } else if (f.k === 'boom' || f.k === 'capture') {
      const [x, y] = txy(f.i);
      ctx.strokeStyle = f.k === 'capture' ? rgba(NATIONS[f.n].color, 1 - p) : `rgba(255,150,80,${1 - p})`;
      ctx.lineWidth = px(3); ctx.beginPath(); ctx.arc(x, y, 6 + p * (f.big || f.k === 'capture' ? 34 : 20), 0, 6.3); ctx.stroke();
    } else if (f.k === 'nuke') {
      const [x, y] = txy(f.i);
      const R = (S * 2.2) * (1 + f.r);
      ctx.fillStyle = `rgba(255,245,200,${0.9 * (1 - p)})`; ctx.beginPath(); ctx.arc(x, y, R * (0.3 + p), 0, 6.3); ctx.fill();
      ctx.strokeStyle = `rgba(255,120,40,${1 - p})`; ctx.lineWidth = px(4); ctx.beginPath(); ctx.arc(x, y, R * (0.5 + p * 1.6), 0, 6.3); ctx.stroke();
    } else if (f.k === 'missile') {
      const [ax, ay] = txy(f.from); let [bx, by] = tileXY(f.to); bx = ax + ((bx - ax + WORLD_W * 1.5) % WORLD_W) - WORLD_W / 2;
      const end = f.hit ? 1 : 0.8, q = Math.min(p / 0.85, end);
      const mx = (ax + bx) / 2, my = Math.min(ay, by) - Math.hypot(bx - ax, by - ay) * 0.35;
      const pt = s => [(1 - s) ** 2 * ax + 2 * (1 - s) * s * mx + s * s * bx, (1 - s) ** 2 * ay + 2 * (1 - s) * s * my + s * s * by];
      ctx.strokeStyle = f.nuke ? 'rgba(198,240,74,0.85)' : 'rgba(255,138,91,0.8)'; ctx.lineWidth = px(2); ctx.beginPath();
      for (let s = 0; s <= q; s += 0.03) { const [x, y] = pt(s); s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      const [hx, hy] = pt(q);
      ctx.fillStyle = '#FFE0B0'; ctx.beginPath(); ctx.arc(hx, hy, px(3.5), 0, 6.3); ctx.fill();
      if (!f.hit && p > 0.68) { ctx.strokeStyle = `rgba(160,220,255,${1 - p})`; ctx.lineWidth = px(2); ctx.beginPath(); ctx.arc(hx, hy, 4 + (p - 0.68) * 60, 0, 6.3); ctx.stroke(); }
    }
  }
}
function loop(now) {
  if (UI.dirty || UI.fx.length || UI.anim.size) { UI.dirty = false; draw(now); }
  requestAnimationFrame(loop);
}

// ---------- hooks ----------
const FX_DUR = { shot: 420, dmg: 1000, boom: 650, capture: 900, missile: 1400, nuke: 2600 };
Hooks.fx = f => {
  if (!G) return;
  const now = performance.now();
  if (f.k === 'capture' || f.k === 'nuke') UI.lowDirty = true;
  if (f.k === 'move') {
    if (UI.vis && !f.path.some(i => UI.vis[i])) return;
    UI.anim.set(f.u, { path: f.path.map(tileXY), t0: now, dur: Math.min(700, 110 * (f.path.length - 1)) });
    UI.dirty = true; return;
  }
  if (UI.vis && f.k !== 'nuke') { const pts = [f.i, f.from, f.to].filter(x => x != null); if (!pts.some(i => UI.vis[i])) return; }
  UI.fx.push({ ...f, t0: now + (f.k === 'boom' && f.big ? 1150 : f.k === 'dmg' ? 150 : f.k === 'nuke' ? 1200 : 0), dur: FX_DUR[f.k] || 600 });
  UI.dirty = true;
};
Hooks.log = (text, kind, who) => {
  if (!G) return;
  const mine = who === me() || text.includes(`[${nName(me())}]`);
  if (kind === 'nuke') { toast(text, 'bad'); return; }
  if (['capture', 'capitulate', 'war', 'peace', 'tech'].includes(kind) && (mine || kind === 'capitulate')) toast(text, ['war', 'loss'].includes(kind) ? 'bad' : kind === 'capture' && who === me() ? 'good' : '');
};
function toast(text, cls = '') {
  const box = $('#toasts');
  const d = document.createElement('div'); d.className = 'toast ' + cls; d.textContent = text;
  box.prepend(d);
  while (box.children.length > 4) box.lastChild.remove();
  setTimeout(() => d.remove(), 4500);
}

// ---------- tooltip ----------
function targetVisible(i) {
  const g = groundAt(i), s = shipAt(i);
  if (g && atWar(me(), g.n) && seenUnit(g)) return true;
  if (s && atWar(me(), s.n) && seenUnit(s)) return true;
  const ci = W.tiles[i].city;
  return ci >= 0 && atWar(me(), G.cities[ci].owner) && seen(i);
}
function tipFor(i) {
  if (i < 0) return '';
  const t = W.tiles[i], su = selUnit(), out = [];
  if (UI.mode === 'missile' && UI.mtargets?.has(i)) {
    const M = MISSILES[UI.missile];
    const site = missileSite(me(), UI.missile, i);
    out.push(`<b>${esc(M.name)}${UI.nuclear ? ' · 핵탄두' : ''}</b>`,
      `<div class="row"><span>비행 거리</span><span>${fmt(kmDist(site, i))} km</span></div>`,
      `<div class="row"><span>적 요격 확률</span><span>${pct(interceptChance(me(), UI.missile, i))}</span></div>`,
      `<div class="row"><span>${UI.nuclear ? '위력' : '예상 피해'}</span><span>${UI.nuclear ? `${M.yieldKt}kt` : M.dmg}</span></div>`);
    return out.join('');
  }
  if ((UI.mode === 'deploy' || UI.mode === 'rebase') && su && UI.mtargets?.has(i)) {
    if (UI.mode === 'deploy') { const p = deployPlan(su, W.tiles[i].city); return `<b>${esc(W.cities[W.tiles[i].city].name)} 전개</b><div class="row"><span>${esc(p.mode || '')}</span><span>${fmt(p.km || 0)} km</span></div><div class="row"><span>소요 / 비용</span><span>${p.eta}턴 / ${p.cost}억$</span></div>`; }
    return `<b>재배치</b><div class="row"><span>거리</span><span>${fmt(kmDist(su.pos, i))} km</span></div>`;
  }
  if (su && UI.targets.has(i)) {
    const from = UI.targets.get(i);
    const saved = su.pos; su.pos = from; const pv = preview(su, i); su.pos = saved;
    if (pv) {
      const name = pv.tg.unit ? `[${nName(pv.tg.unit.n)}] ${dsg(pv.tg.unit).name}` : `${W.cities[pv.tg.city].name} 시가지`;
      out.push(`<b>공격: ${esc(name)}</b>`, `<div class="row"><span>적 예상 피해</span><span class="pos">-${Math.round(pv.dealt)}${pv.kill ? ' (격파)' : ''}</span></div>`, `<div class="row"><span>아군 예상 피해</span><span class="${pv.taken >= su.hp ? 'neg' : ''}">-${Math.round(pv.taken)}</span></div>`);
      if (pv.pre) out.push(`<div class="sub">방공·요격 예상 피해 ${Math.round(pv.pre)} 포함</div>`);
      if (pv.capture) out.push(`<div class="sub" style="color:var(--accent)">도시 점령 가능</div>`);
      if (from !== su.pos) out.push(`<div class="sub">이동 후 공격</div>`);
      if (CLASSES[su.t].dom === 'air') out.push(`<div class="sub">거리 ${fmt(kmDist(su.pos, i))} km / 작전반경 ${fmt(unitKm(su))} km</div>`);
      return out.join('');
    }
  }
  const o = tileOwner(i);
  out.push(`<b>${t.city >= 0 ? esc(W.cities[t.city].name) + ' · ' : ''}${t.land ? TERRAIN_KIND[t.terrain].name : '해양'}</b>`);
  out.push(`<div class="sub">${Math.abs(t.lat).toFixed(1)}°${t.lat >= 0 ? 'N' : 'S'} ${Math.abs(t.lon).toFixed(1)}°${t.lon >= 0 ? 'E' : 'W'}${o ? ' · ' + esc(NATIONS[o].name) : ''}</div>`);
  if (t.land && t.city < 0) out.push(`<div class="row"><span>방어 보정</span><span>×${TERRAIN_KIND[t.terrain].def}</span></div>`);
  if ((G.fallout[i] ?? -1) >= G.turn) out.push(`<div class="sub neg">방사능 낙진 (체력 -15/턴)</div>`);
  for (const u of [groundAt(i), shipAt(i)]) if (u && seenUnit(u)) out.push(`<div class="row"><span>[${nName(u.n)}] ${esc(dsg(u).name)}</span><span>${u.hp}%</span></div>`);
  if (su && UI.reach?.has(i) && i !== su.pos && canEnd(su, i)) out.push(`<div class="sub">이동 후 남은 이동력 ${fmt(UI.reach.get(i).left, 1)}</div>`);
  return out.join('');
}
function showTip(i, sx, sy) {
  const tip = $('#tip'), html = tipFor(i);
  if (!html) { tip.hidden = true; return; }
  tip.innerHTML = html; tip.hidden = false;
  const W0 = $('#mapwrap').clientWidth, H0 = $('#mapwrap').clientHeight;
  tip.style.left = Math.min(sx + 16, W0 - tip.offsetWidth - 8) + 'px';
  tip.style.top = Math.min(sy + 16, H0 - tip.offsetHeight - 8) + 'px';
}

// ---------- map input ----------
function onTileClick(i) {
  if (!G || UI.busy || G.over || i < 0) return;
  const su = selUnit();
  if (UI.mode === 'missile') {
    if (UI.mtargets?.has(i)) {
      if (UI.nuclear) return confirmNuke(i);
      const r = fireMissile(me(), UI.missile, i, false);
      toast(r?.hit ? '미사일 명중' : '미사일이 요격되었습니다', r?.hit ? 'good' : 'bad');
      setMissileMode(UI.missile, false);
      after();
    } else { UI.mode = null; UI.mtargets = null; renderModebar(); UI.dirty = true; }
    return;
  }
  if (UI.mode === 'rebase' && su) {
    if (rebaseAir(su, i)) { toast(`${dsg(su).name} 재배치 완료`); UI.mode = null; select({ kind: 'unit', id: su.id }); after(); }
    else { UI.mode = null; select({ kind: 'tile', i }); }
    return;
  }
  if (UI.mode === 'deploy' && su) {
    if (UI.mtargets?.has(i)) { const p = deploy(su, W.tiles[i].city); if (p) toast(`${p.mode}: ${p.eta}턴 후 ${W.cities[W.tiles[i].city].name} 도착`, 'good'); UI.mode = null; select(null); after(); }
    else { UI.mode = null; UI.mtargets = null; renderModebar(); UI.dirty = true; }
    return;
  }
  if (su && su.n === me() && UI.targets.has(i)) {
    const from = UI.targets.get(i);
    if (from !== su.pos) moveUnit(su, from, UI.reach);
    const r = doAttack(su, i);
    UI.mode = null;
    if (r?.captured) toast(`${W.cities[W.tiles[i].city].name} 점령!`, 'good');
    select(uById.has(su.id) ? { kind: 'unit', id: su.id } : { kind: 'tile', i });
    after(); return;
  }
  if (su && su.n === me() && UI.reach?.has(i) && i !== su.pos && canEnd(su, i)) { moveUnit(su, i, UI.reach); select({ kind: 'unit', id: su.id }); after(); return; }
  const cands = [groundAt(i), shipAt(i)].filter(u => u && seenUnit(u)).sort((a, b) => (b.n === me()) - (a.n === me()));
  if (cands.length) {
    const cur = su && su.pos === i ? cands.findIndex(u => u.id === su.id) : -1;
    if (cur === cands.length - 1 && W.tiles[i].city >= 0) { select({ kind: 'tile', i }); return; }
    select({ kind: 'unit', id: cands[(cur + 1) % cands.length].id }); return;
  }
  select({ kind: 'tile', i });
}
function after() {
  refreshVision(); computeOrders();
  const o = checkVictory();
  UI.dirty = true; renderTop(); renderPanel(); renderModebar();
  if (o) showGameOver();
}
function setupInput() {
  const ptrs = new Map();
  let drag = null, pinch = null;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (ptrs.size === 1) drag = { x: e.offsetX, y: e.offsetY, cx: UI.cam.x, cy: UI.cam.y, moved: false, btn: e.button };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: UI.cam.z }; if (drag) drag.moved = true; }
  });
  canvas.addEventListener('pointermove', e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d) / UI.cam.z); return; }
    if (drag && ptrs.size === 1) {
      const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
      if (drag.moved) { UI.cam.x = drag.cx - dx / UI.cam.z; UI.cam.y = drag.cy - dy / UI.cam.z; clampCam(); UI.dirty = true; $('#tip').hidden = true; }
      return;
    }
    if (e.pointerType === 'mouse') { const i = screenToTile(e.offsetX, e.offsetY); if (i !== UI.hover) { UI.hover = i; UI.dirty = true; } showTip(i, e.offsetX, e.offsetY); }
  });
  canvas.addEventListener('pointerup', e => {
    const wasDrag = drag?.moved;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) {
      if (drag && !wasDrag) {
        const i = screenToTile(e.offsetX, e.offsetY);
        if (drag.btn === 2) { UI.mode = null; select(null); } else onTileClick(i);
        if (e.pointerType !== 'mouse') { UI.hover = -1; showTip(-1); }
      }
      drag = null;
    }
  });
  canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; pinch = null; });
  canvas.addEventListener('pointerleave', () => { UI.hover = -1; $('#tip').hidden = true; UI.dirty = true; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (!G || !$('#modal').hidden || ['INPUT', 'SELECT'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { UI.mode = null; UI.mtargets = null; select(null); }
    else if (k === 'e') endTurn();
    else if (k === 'n') nextUnit();
    else if (k === 'f') { const u = selUnit(); if (u && u.n === me()) act('wait', u.id); }
    else if (k === '+' || k === '=') zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.2);
    else if (k === '-') zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.2);
    else if (k.startsWith('arrow')) { const d = 60 / UI.cam.z; if (k === 'arrowleft') UI.cam.x -= d; if (k === 'arrowright') UI.cam.x += d; if (k === 'arrowup') UI.cam.y -= d; if (k === 'arrowdown') UI.cam.y += d; clampCam(); UI.dirty = true; e.preventDefault(); }
  });
  new ResizeObserver(resize).observe($('#mapwrap'));
}

// ---------- modes ----------
function setMissileMode(mid, nuclear) {
  const N = P();
  if (!mid || !(N.arsenal[mid] > 0)) { UI.mode = null; UI.mtargets = null; renderModebar(); UI.dirty = true; return; }
  UI.mode = 'missile'; UI.missile = mid; UI.nuclear = !!nuclear && MISSILES[mid].nuke && N.nukes > 0;
  UI.sel = null; UI.reach = null; UI.targets = new Map();
  const sites = missileLaunchSites(me(), mid), set = new Set();
  for (const j of enemyTiles(me())) if (targetVisible(j) && missileSite(me(), mid, j, sites) >= 0) set.add(j);
  UI.mtargets = set;
  if (!set.size) toast('사거리 안에 보이는 표적이 없습니다', 'bad');
  renderModebar(); renderPanel(); UI.dirty = true;
}
function confirmNuke(i) {
  const M = MISSILES[UI.missile];
  const name = W.tiles[i].city >= 0 ? W.cities[W.tiles[i].city].name : '표적 좌표';
  openModal(`<div class="title-block"><span class="eyebrow nuke">핵 사용 승인 절차 · 2인 확인</span><h2>${esc(name)}에 ${esc(M.name)} 핵탄두 (${M.yieldKt}kt)</h2></div>
    <p>핵폭발은 반경 ${M.yieldKt >= 100 ? (has(me(), 'thermo') && M.yieldKt >= 300 ? 2 : 1) : 0}칸 안의 모든 부대(아군 포함)를 파괴하고 도시 인구를 궤멸시키며 6개월간 낙진을 남깁니다.</p>
    <p>국제 평판이 ${has(me(), 'tacnuke') && M.yieldKt <= 20 ? 25 : 50} 떨어지고 모든 나라와의 관계가 악화됩니다. 표적국과 그 핵 동맹국이 보복할 수 있으며, 종말 시계는 현재 <b>자정 ${G.doom}초 전</b>입니다. 0초가 되면 모두가 패배합니다.</p>
    <div class="btnrow"><button class="btn danger" type="button" id="nk-ok">발사 승인</button><button class="btn" type="button" id="nk-no">취소</button></div>`);
  $('#nk-ok').onclick = () => { closeModal(); const r = fireMissile(me(), UI.missile, i, true); toast(r?.hit ? '핵탄두 폭발 확인' : '핵미사일이 요격되었습니다', 'bad'); UI.mode = null; UI.mtargets = null; after(); };
  $('#nk-no').onclick = closeModal;
}

// ---------- panels ----------
function svgUnit(t, color) {
  const dom = CLASSES[t].dom, ink = '#12181c';
  let inner;
  if (dom === 'sea') {
    inner = `<ellipse cx="16" cy="11" rx="14" ry="9" fill="${color}" stroke="${ink}" stroke-width="1.5"/>`;
    inner += t === 'dd' ? `<path d="M7 11h18l-3 5H9z M15 11V6h3v5" fill="none" stroke="${ink}" stroke-width="1.4"/>` : (t === 'cv' || t === 'lhd') ? `<path d="M5 11h22l-2 4H7z M17 11V7h3v4" fill="none" stroke="${ink}" stroke-width="1.4"/>` : `<ellipse cx="16" cy="13" rx="9" ry="2.5" fill="none" stroke="${ink}" stroke-width="1.4"/><path d="M15 11V7h3v4" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
    const tag = { ssn: 'N', ssbn: 'B', lhd: 'L' }[t];
    if (tag) inner += `<text x="9" y="9" font-size="7" font-weight="700" fill="${ink}" font-family="sans-serif">${tag}</text>`;
  } else {
    inner = `<rect x="2" y="3" width="28" height="17" fill="${color}" stroke="${ink}" stroke-width="1.5"/>`;
    if (['inf', 'mech', 'marine'].includes(t)) inner += `<path d="M2 3l28 17M30 3L2 20" stroke="${ink}" stroke-width="1.4"/>`;
    if (t === 'mbt' || t === 'mech') inner += `<ellipse cx="16" cy="11.5" rx="8" ry="4.5" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
    if (t === 'spg') inner += `<circle cx="16" cy="11.5" r="3" fill="${ink}"/>`;
    if (t === 'mlrs') inner += `<path d="M10 16l6-8 6 8" fill="none" stroke="${ink}" stroke-width="1.4"/><circle cx="16" cy="13" r="2.2" fill="${ink}"/>`;
    if (t === 'shorad' || t === 'sam') inner += `<path d="M5 20Q16 1 27 20" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
    if (['ftr', 'bmr', 'uav'].includes(t)) inner += `<path d="M7 14Q12 5 16 12Q20 5 25 14" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
    const tag = { sof: 'SF', sam: 'BMD', marine: 'M', bmr: 'B', uav: 'UAV' }[t];
    if (tag) inner += `<text x="16" y="${t === 'sof' ? 15.5 : 19}" text-anchor="middle" font-size="${tag.length > 2 ? 6 : 9}" font-weight="700" fill="${ink}" font-family="sans-serif">${tag}</text>`;
  }
  return `<svg width="32" height="23" viewBox="0 0 32 23" aria-hidden="true">${inner}</svg>`;
}
const bar = (v, col) => `<div class="hp"><i style="width:${clamp(v, 0, 100)}%;background:${col}"></i></div>`;
const hpBar = hp => bar(hp, hpColor(hp));
function kv(pairs) { return `<div class="kv">${pairs.map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>`; }
function btn(label, act, arg, o = {}) { return `<button class="btn ${o.cls || 'sm'}" type="button" data-act="${act}"${arg != null ? ` data-arg="${esc(arg)}"` : ''}${o.disabled ? ' disabled' : ''}${o.title ? ` title="${esc(o.title)}"` : ''}>${label}</button>`; }
function statusPill(n) {
  const N = G.nations[n];
  if (N.capitulated) return `<span class="pill gone">항복</span>`;
  if (G.vassal[n] === me()) return `<span class="pill ally">보호국</span>`;
  if (G.vassal[n]) return `<span class="pill gone">${nName(G.vassal[n])} 보호국</span>`;
  if (atWar(me(), n)) return `<span class="pill war">교전</span>`;
  if (allied(me(), n)) return `<span class="pill ally">동맹</span>`;
  if ((G.truce[pk(me(), n)] ?? -99) + 6 > G.turn) return `<span class="pill truce">휴전</span>`;
  return `<span class="pill peace">평화</span>`;
}
function riskColor(v) { return v > 0.15 ? 'var(--danger)' : v > 0.05 ? 'var(--warn)' : 'var(--ok)'; }
function renderTop() {
  if (!G) return;
  const N = P(), e = economyPreview(me());
  $('#nat-chip').style.background = NATIONS[me()].color;
  $('#nat-name').textContent = `${G.leader.title} ${G.leader.name}`;
  $('#date').textContent = `${NATIONS[me()].short} · ${dateLabel()} · 턴 ${G.turn}/${G.maxTurn}`;
  const stabCol = N.stab > 55 ? 'var(--ok)' : N.stab > 30 ? 'var(--warn)' : 'var(--danger)';
  const coup = coupRisk(me()), rev = revoltRisk(me());
  $('#res').innerHTML = [
    ['예산 (억$)', `${fmt(N.money)}<span class="d ${e.net >= 0 ? 'pos' : 'neg'}">${sgn(e.net)}</span>`],
    ['인력 (천명)', `${fmt(N.manpower)}<span class="d pos">+${fmt(e.mp)}</span>`],
    ['연료', `${fmt(N.fuel)}<span class="d ${e.fuel >= 0 ? 'pos' : 'neg'}">${sgn(e.fuel)}</span>`],
    ['안정도', `${fmt(N.stab)}<div class="stabbar"><i style="width:${N.stab}%;background:${stabCol}"></i></div>`],
    ['권력 기반', `${fmt(N.power)}<span class="d" style="color:${riskColor(Math.max(coup, rev))}">쿠데타 ${pct(coup)}</span>`],
    ['국제 평판', `<span class="${N.rep < -30 ? 'neg' : N.rep > 20 ? 'pos' : ''}">${sgn(N.rep)}</span><span class="d mut">제재 ${(G.sanc[me()] || []).length}국</span>`],
    ['핵탄두', `${N.nukes}<span class="d mut">${esc(NATIONS[me()].nukeEst.split(' ')[0])}</span>`],
    ['종말 시계', `<span class="${G.doom < 40 ? 'neg' : ''}">자정 ${G.doom}초 전</span>`],
  ].map(([k, v]) => `<div class="res-item"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');
  $('#btn-end').disabled = UI.busy || !!G.over;
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === UI.tab));
  const idle = idleUnits().length;
  $('[data-act="next"]').textContent = idle ? `다음 부대 (${idle})` : '다음 부대';
  $('[data-tab="tech"]').innerHTML = '연구' + (N.research ? '' : ' <span class="badge">!</span>');
  $('[data-tab="power"]').innerHTML = '권력' + (coup > 0.1 || rev > 0.1 ? ' <span class="badge">!</span>' : '');
}
function renderModebar() {
  const mb = $('#modebar'), su = selUnit();
  let txt = '';
  if (UI.mode === 'missile') txt = `${UI.nuclear ? '☢ 핵탄두 · ' : ''}${MISSILES[UI.missile].name} 표적 선택 · 잔량 ${P().arsenal[UI.missile]}`;
  else if (UI.mode === 'rebase' && su) txt = `${dsg(su).name} 재배치 기지 선택`;
  else if (UI.mode === 'deploy' && su) txt = `${dsg(su).name} 전략 전개 목적지 선택 (초록 도시)`;
  else if (UI.mode === 'air' && su) txt = `${dsg(su).name} 공습 표적 선택 (작전반경 ${fmt(unitKm(su))}km)`;
  mb.hidden = !txt;
  mb.className = UI.nuclear && UI.mode === 'missile' ? 'nuke' : '';
  if (txt) mb.innerHTML = `<span>${esc(txt)}</span><button type="button" data-act="cancel-mode">취소</button>`;
}
function renderPanel() {
  if (!G) return;
  const body = $('#tab-body'), top = body.scrollTop;
  body.innerHTML = ({ sel: panelSel, power: panelPower, nation: panelNation, arms: panelArms, tech: panelTech, diplo: panelDiplo, war: panelWar })[UI.tab]();
  body.scrollTop = UI.keepScroll || UI.tab === 'war' ? top : 0;
  UI.keepScroll = false;
  renderTop();
}
function panelSel() {
  const su = selUnit();
  if (su) return unitCard(su) + tileCard(su.pos, true);
  if (UI.sel?.kind === 'tile') return tileCard(UI.sel.i, false);
  const sc = SCENARIOS.find(s => s.id === G.scen);
  const inTransit = G.transit.filter(t => t.u.n === me());
  return `<div class="sec"><h3>작전 개요</h3><h2>${esc(sc.name)}</h2><p class="sub">${esc(sc.blurb)}</p></div>
  <div class="sec"><h3>이번 턴</h3><div class="rows">
    <div class="row"><span>명령 대기 부대</span><span class="num">${idleUnits().length}</span></div>
    <div class="row"><span>교전국</span><span class="sub">${enemiesOf(me()).slice(0, 8).map(nName).join(', ') || '없음'}${enemiesOf(me()).length > 8 ? ` 외 ${enemiesOf(me()).length - 8}` : ''}</span></div>
    <div class="row"><span>원정 이동 중</span><span class="num">${inTransit.length}</span></div>
    <div class="row"><span>지배 도시 (보호국 포함)</span><span class="num">${controlled(me())} / ${W.cities.length}</span></div>
    <div class="row"><span>강대국 수도 장악</span><span class="num">${majorCapitalsHeld(me())} / ${MAJOR_IDS.length - 1}</span></div>
  </div>
  <div class="btnrow">${btn('다음 부대', 'next')}${btn('수도 보기', 'home')}${btn('세계 지도', 'world')}${btn('규칙', 'help')}</div></div>
  ${inTransit.length ? `<div class="sec"><h3>이동 중인 원정 부대</h3><div class="rows">${inTransit.map(t => `<div class="row"><span>${esc(dsg(t.u).name)}</span><span class="sub">→ ${esc(W.cities[t.to].name)} · ${Math.max(0, t.eta - G.turn)}턴</span></div>`).join('')}</div></div>` : ''}
  <div class="sec"><h3>조작</h3><p class="sub">부대를 선택하면 이동 가능 칸이 노란색, 공격 가능 표적이 붉은 점선으로 표시됩니다. 도시를 선택해 부대 편성·건설을, 부대 카드의 "전략 전개"로 대륙 간 이동을 합니다. 축소하면 세계 정세도가, 확대하면 전술 지도가 나옵니다.</p></div>`;
}
function unitCard(u) {
  const C = CLASSES[u.t], d = dsg(u), mine = u.n === me();
  const stars = '★'.repeat(vet(u)) + '☆'.repeat(3 - vet(u));
  const st = [];
  if (u.emb) st.push('해상 수송 중');
  if (u.fort > 0 && C.dom === 'land') st.push('참호 구축 (방어 +20%)');
  if (!supplied(u)) st.push('<span class="neg">보급 두절 (전투력 -30%, 체력 -8/턴)</span>');
  if (C.fuel > 0 && G.nations[u.n].fuel <= 0) st.push('<span class="neg">연료 고갈</span>');
  if (u.carrier) st.push(`항모 탑재 (${esc(dsg(uById.get(u.carrier) || u).name)})`);
  let actions = '';
  if (mine && !UI.busy) {
    const a = [];
    if (C.dom === 'air') { a.push(btn('출격 (공습)', 'air-strike', u.id, { disabled: u.acted || u.hp <= 15 })); a.push(btn('재배치', 'air-rebase', u.id, { disabled: u.acted })); }
    else a.push(btn('대기 · 참호', 'wait', u.id, { disabled: u.mv <= 0 }));
    a.push(btn('전략 전개', 'deploy', u.id, { disabled: u.acted || u.moved || !!u.carrier, title: '철도·해상·공중 장거리 이동' }));
    if (C.slbm || d.slbm) a.push(btn('SLBM 발사', 'arms-tab'));
    a.push(btn('해산', 'disband', u.id, { cls: 'sm danger' }));
    actions = `<div class="btnrow">${a.join('')}</div>`;
  }
  const rangeLabel = C.dom === 'air' ? ['작전반경', `${fmt(unitKm(u))}km`] : ['사거리', C.rng > 0 ? `${C.rng}칸` : '근접'];
  return `<div class="sec">
    <div class="row" style="justify-content:flex-start;gap:10px">${svgUnit(u.t, NATIONS[u.n].color)}<div><h2>${esc(d.name)}</h2><div class="sub">${esc(C.name)} · ${esc(NATIONS[u.n].short)} · 경험 <span style="color:var(--accent)">${stars}</span>${d.stealth ? ' · 스텔스' : ''}</div></div></div>
    <p class="spec">${esc(d.spec)}</p>
    <div class="row"><span class="sub">체력</span><span class="num">${u.hp}/100</span></div>${hpBar(u.hp)}
    ${kv([['공격', fmt(unitStr(u, 'atk'), 1)], ['방어', fmt(unitStr(u, 'def'), 1)], [C.dom === 'air' ? '출격' : '이동', C.dom === 'air' ? (u.acted ? '완료' : '가능') : `${fmt(u.mv, 1)}/${mvMax(u)}`], rangeLabel])}
    <p class="sub">${st.join(' · ') || (u.acted ? '이번 턴 행동 완료' : '명령 대기')}</p>
    <p class="sub">품질 계수 ×${d.q} · 유지비 ${C.up}/턴 · 연료 ${C.fuel * 0.5}/턴${C.stealth ? ' · 잠항' : ''}${C.noZoc ? ' · 통제지역 무시' : ''}${C.carrier ? ` · 함재기 ${carrierAirCount(u.id)}/${C.carrier}` : ''}</p>
    ${actions}
  </div>`;
}
function tileCard(i, compact) {
  const t = W.tiles[i], o = tileOwner(i);
  let html = t.city >= 0 ? cityCard(t.city) : '';
  if (compact) return t.city < 0 ? html + `<div class="sec"><h3>지형</h3><div class="row"><span>${t.land ? TERRAIN_KIND[t.terrain].name : '해양'}${o ? ' · ' + esc(NATIONS[o].short) : ''}</span><span class="num sub">${t.lat.toFixed(1)}°, ${t.lon.toFixed(1)}°</span></div></div>` : html;
  const units = [groundAt(i), shipAt(i)].filter(u => u && seenUnit(u));
  html += `<div class="sec"><h3>지형 정보</h3>
    <div class="row"><span>${t.land ? TERRAIN_KIND[t.terrain].name : '해양'}</span><span class="num sub">${t.lat.toFixed(2)}°, ${t.lon.toFixed(2)}°</span></div>
    ${t.land ? `<div class="row"><span class="sub">이동 비용 / 방어 보정</span><span class="num">${TERRAIN_KIND[t.terrain].cost} / ×${TERRAIN_KIND[t.terrain].def}</span></div>` : ''}
    ${o ? `<div class="row"><span class="sub">관할</span><span>${esc(NATIONS[o].name)}${o !== t.nat ? ` (원 ${esc(NATIONS[t.nat].short)} 영토)` : ''}</span></div>` : ''}
    <div class="row"><span class="sub">아군 보급</span><span>${supplyMap(me())[i] ? '보급선 내' : '<span class="neg">보급선 밖</span>'}</span></div>
    ${units.map(u => `<div class="list-unit">${svgUnit(u.t, NATIONS[u.n].color)}<div class="grow"><div>${esc(dsg(u).name)}</div><div class="sub">${esc(NATIONS[u.n].short)} · 체력 ${u.hp}</div></div>${btn('선택', 'sel-unit', u.id)}</div>`).join('')}
  </div>`;
  return html;
}
function cityCard(ci) {
  const cy = W.cities[ci], c = G.cities[ci], own = c.owner === me();
  const canBase = own || (me() === 'USA' && cy.base && allied(me(), c.owner));
  const air = airAt(cy.tile).filter(u => !u.carrier && seenUnit(u));
  let html = `<div class="sec">
    <div class="row" style="justify-content:flex-start;gap:10px"><span class="chip" style="background:${NATIONS[c.owner].color}"></span><div><h2>${esc(cy.name)}</h2><div class="sub">${esc(NATIONS[c.owner].name)}${cy.nat !== c.owner ? ` 점령지 (원 ${esc(NATIONS[cy.nat].short)})` : ''}${G.nations[c.owner].capital === ci ? ' · 수도' : ''}${cy.port ? ' · 항구' : ''}${cy.base ? ' · 미군 기지' : ''}${c.nuked ? ' · <span class="neg">피폭</span>' : ''}</div></div></div>
    <div class="row"><span class="sub">도시 방어력</span><span class="num">${c.hp}/100 · 전력 ${fmt(cityStr(ci), 1)}</span></div>${hpBar(c.hp)}
    ${kv([['인구', c.pop], ['산업', c.ind], ['요새', `${c.fort}/3`], ['방공망', `${c.sam}/2`]])}
    ${cy.port && blockaded(ci) ? '<p class="sub neg">해상 봉쇄 중 — 수입 -40%, 연료 수입 감소</p>' : ''}
  </div>`;
  if (air.length) html += `<div class="sec"><h3>비행단 (${air.length}/4)</h3>${air.map(u => `<div class="list-unit">${svgUnit(u.t, NATIONS[u.n].color)}<div class="grow"><div>${esc(dsg(u).name)}</div><div class="sub">${esc(NATIONS[u.n].short)} · 체력 ${u.hp} · 반경 ${fmt(unitKm(u))}km${u.acted ? ' · 출격 완료' : ''}</div></div>${u.n === me() ? btn('출격', 'air-strike', u.id, { disabled: u.acted || u.hp <= 15 }) + btn('이동', 'air-rebase', u.id, { disabled: u.acted }) : ''}</div>`).join('')}</div>`;
  if (canBase && !UI.busy) {
    html += `<div class="sec"><h3>부대 편성 · 이번 턴 ${c.rec}/${cityRecruitCap(ci)}</h3><div class="unit-grid">${CLASS_ORDER.map(t => {
      const r = recruitCheck(me(), ci, t), d = bestDesign(me(), t);
      if (!r.ok && r.why.startsWith('기술') && !['mech', 'marine'].includes(t)) return '';
      return `<button class="btn ubtn" type="button" data-act="recruit" data-arg="${ci}:${t}"${r.ok ? '' : ' disabled'} title="${esc(d.spec)}">${svgUnit(t, NATIONS[me()].color)}<span><span class="nm">${esc(d.name)}</span><span class="cs">${esc(CLASSES[t].abbr)} · ${unitCost(me(), t)}억$ · 인력 ${unitMp(me(), t)}</span>${r.ok ? '' : `<span class="why">${esc(r.why)}</span>`}</span></button>`;
    }).join('')}</div></div>`;
  }
  if (own && !UI.busy) html += `<div class="sec"><h3>건설</h3><div class="rows">${Object.entries(BUILDINGS).map(([k, B]) => { const r = buildCheck(me(), ci, k); return `<div class="row"><span><b>${B.name}</b> <span class="sub">${B.desc}</span></span>${btn(r.ok ? `${r.cost}억$` : esc(r.why), 'build', `${ci}:${k}`, { disabled: !r.ok })}</div>`; }).join('')}</div></div>`;
  return html;
}
function panelPower() {
  const N = P(), R = regime(me());
  const coup = coupRisk(me()), rev = revoltRisk(me());
  const facRows = FACTIONS.map(f => `<div class="fac"><div class="row"><span>${esc(factionLabel(me(), f))} <span class="sub">영향력 ${Math.round(R.w[f] * 100)}%</span></span><span class="num">${Math.round(N.fac[f])}</span></div>${bar(N.fac[f], N.fac[f] > 55 ? 'var(--ok)' : N.fac[f] > 35 ? 'var(--warn)' : 'var(--danger)')}</div>`).join('');
  const cats = [...new Set(DECREES.map(d => d.cat))];
  const decrees = cats.map(cat => `<div class="sec"><h3>칙령 · ${cat}</h3><div class="decrees">${DECREES.filter(d => d.cat === cat).map(d => {
    const c = decreeCheck(me(), d.id);
    return `<div class="decree ${c.ok ? '' : 'off'}"><div class="row"><b>${esc(d.name)}</b>${btn(c.ok ? (d.cost ? `시행 · ${d.cost}억$` : '시행') : esc(c.why), 'decree', d.id, { disabled: !c.ok, cls: d.id === 'martial' || d.id === 'nukeprog' ? 'sm danger' : 'sm' })}</div><div class="sub">${esc(d.desc)}</div></div>`;
  }).join('')}</div></div>`).join('');
  const sanc = G.sanc[me()] || [];
  return `<div class="sec"><h3>정권</h3><h2>${esc(G.leader.title)} ${esc(G.leader.name)}</h2>
    <div class="sub">${esc(NATIONS[me()].name)} · ${REGIME_NAMES[N.gov]}${R.elections ? ` · 다음 선거 ${N.nextElection ? `${Math.max(0, N.nextElection - G.turn)}턴 후` : '없음'}` : ' · 선거 없음'}</div>
    ${kv([['권력 기반', Math.round(N.power)], ['쿠데타 위험', `<span style="color:${riskColor(coup)}">${pct(coup)}</span>`], ['봉기 위험', `<span style="color:${riskColor(rev)}">${pct(rev)}</span>`], ['국제 평판', sgn(N.rep)]])}
    <p class="sub">안정도는 세력 충성도의 가중 평균으로 수렴합니다. 군부·보안기관 충성이 낮으면 쿠데타가, 민중이 등을 돌리면 봉기가 일어납니다.${R.elections ? ' 선거에서 지면 정권을 잃습니다.' : ''}</p></div>
  <div class="sec"><h3>권력 세력 충성도</h3>${facRows}</div>
  <div class="sec"><h3>국가 특성</h3><div class="rows">${(NATIONS[me()].traits || []).map(t => `<div class="row"><b>${esc(TRAITS[t].name)}</b><span class="sub">${esc(TRAITS[t].desc)}</span></div>`).join('') || '<p class="sub">없음</p>'}</div></div>
  <div class="sec"><h3>국제 제재</h3><p class="sub">${sanc.length ? `${sanc.map(nName).join(', ')} — 수입 -${pct(sanctionPenalty(me()))}, 석유 수입 감소` : '제재 없음'}${hasTrait(me(), 'juche') ? ' (주체: 피해 절반)' : ''}</p></div>
  ${decrees}`;
}
function panelNation() {
  const N = P(), e = economyPreview(me());
  const counts = {};
  for (const u of G.units) if (u.n === me()) counts[u.t] = (counts[u.t] || 0) + 1;
  return `<div class="sec"><h3>국가 재정 (다음 달 예상)</h3><div class="rows">
    <div class="row"><span>총수입</span><span class="num">${fmt(e.gross, 1)}</span></div>
    ${e.oilx ? `<div class="row"><span>원유 수출</span><span class="num pos">+${fmt(e.oilx, 1)}</span></div>` : ''}
    ${e.tribute ? `<div class="row"><span>보호국 공납</span><span class="num pos">+${fmt(e.tribute, 1)}</span></div>` : ''}
    <div class="row"><span>연구 투자 (${Math.round(N.rd * 100)}%)</span><span class="num neg">-${fmt(e.rdCost, 1)}</span></div>
    <div class="row"><span>부대 유지비</span><span class="num neg">-${fmt(e.upkeep, 1)}</span></div>
    <div class="row"><b>순수입</b><b class="num ${e.net >= 0 ? 'pos' : 'neg'}">${sgn(e.net)}</b></div></div>
    <label for="rd-slider" class="sub">연구 투자 비율 — 수입의 ${Math.round(N.rd * 100)}%</label>
    <input id="rd-slider" type="range" min="0" max="50" step="5" value="${Math.round(N.rd * 100)}">
    <p class="sub">수입 = 도시별 (인구×0.9 + 산업×1.3 + 공장) × 경제력 ${NATIONS[me()].econ} × 안정도 보정 × (1 − 제재 ${pct(e.sanc)}). 점령지는 절반, 봉쇄 항구는 60%.</p></div>
  <div class="sec"><h3>자원 흐름</h3><div class="rows">
    <div class="row"><span>연료</span><span class="num ${e.fuel >= 0 ? 'pos' : 'neg'}">${fmt(N.fuel)} (${sgn(e.fuel)}/턴)</span></div>
    <div class="row"><span>항구 봉쇄</span><span class="num">${e.blockaded}/${e.ports}</span></div>
    <div class="row"><span>인력 충원</span><span class="num">+${fmt(e.mp)}/턴</span></div>
    <div class="row"><span>전투 사기</span><span class="num">×${fmt(morale(me()), 2)}</span></div></div></div>
  <div class="sec"><h3>군 구성</h3><div class="rows">${CLASS_ORDER.filter(t => counts[t]).map(t => `<div class="row"><span>${esc(bestDesign(me(), t).name)} <span class="sub">${esc(CLASSES[t].name)}</span></span><span class="num">${counts[t]}</span></div>`).join('') || '<p class="sub">부대 없음</p>'}</div>
    <div class="row"><span class="sub">총 전투력 지수</span><span class="num">${fmt(militaryPower(me()))}</span></div></div>`;
}
function panelArms() {
  const N = P();
  const owned = missileBuildable(me()).map(M => M.id);
  for (const k of Object.keys(N.arsenal)) if (!owned.includes(k)) owned.push(k);
  const rows = owned.map(id => {
    const M = MISSILES[id], cnt = N.arsenal[id] || 0, sites = missileLaunchSites(me(), id).length;
    const canBuy = missileBuildable(me()).some(x => x.id === id);
    return `<div class="missile"><div class="row"><b>${esc(M.name)}</b><span class="num">${cnt}기</span></div>
      <div class="mspec">${MISSILE_TYPES[M.type]} · ${fmt(M.km)}km · 마하 ${M.mach} · 피해 ${M.dmg}${M.shipDmg ? ` (대함 ${M.shipDmg})` : ''}${M.evade ? ` · 요격 회피 ${pct(M.evade)}` : ''}${M.nuke ? ` · 핵 탑재 ${M.yieldKt}kt` : ''}</div>
      <div class="sub">${esc(M.spec || '')}${!sites ? ' · <span class="neg">발사 플랫폼 없음</span>' : ''}</div>
      <div class="btnrow">${btn('발사', 'fire', id, { disabled: !cnt || !enemiesOf(me()).length || !sites })}${M.nuke ? btn('☢ 핵탄두 발사', 'fire-nuke', id, { cls: 'sm danger', disabled: !cnt || !N.nukes || !enemiesOf(me()).length || !sites }) : ''}${canBuy ? btn(`생산 ${missileCost(me(), id)}억$`, 'buy-missile', id, { disabled: N.money < missileCost(me(), id) }) : ''}</div></div>`;
  }).join('');
  const designs = CLASS_ORDER.map(cls => {
    const d = bestDesign(me(), cls), C = CLASSES[cls];
    const ok = canRecruitClass(me(), cls);
    return `<div class="design ${ok ? '' : 'off'}"><div class="row" style="justify-content:flex-start;gap:8px">${svgUnit(cls, NATIONS[me()].color)}<div class="grow"><b>${esc(d.name)}</b><div class="sub">${esc(C.name)} · 품질 ×${d.q}${d.km ? ` · 반경 ${fmt(d.km)}km` : ''}${d.stealth ? ' · 스텔스' : ''}${N.bought.includes(d.id) ? ' · 도입' : ''}${ok ? '' : ` · 미보유 (${esc(TECH_BY_ID[C.req]?.name || '')})`}</div></div></div><div class="spec">${esc(d.spec)}</div></div>`;
  }).join('');
  return `<div class="sec"><h3>전략 핵전력</h3>
    ${kv([['핵탄두 (전략 단위)', N.nukes], ['실제 추정 보유', esc(NATIONS[me()].nukeEst)], ['종말 시계', `${G.doom}초`], ['생산', has(me(), 'nuke') ? `${nukeCost(me())}억$` : '불가']])}
    <div class="btnrow">${btn(`핵탄두 1기 생산 (${nukeCost(me())}억$)`, 'make-nuke', null, { disabled: !has(me(), 'nuke') || N.money < nukeCost(me()), cls: 'sm danger' })}</div>
    <p class="sub">${has(me(), 'nuke') ? '핵탑재 가능한 탄도·순항미사일에 핵탄두를 실어 발사할 수 있습니다.' : flag(me(), 'nukeProgram') ? '핵개발 착수 — 연구 탭에서 "핵분열 무기"를 개발하세요.' : '비핵국입니다. 권력 탭의 "핵무기 개발 착수" 칙령으로 개발을 시작할 수 있습니다 (제재 유발).'}</p></div>
  <div class="sec"><h3>미사일 전력</h3>${rows || '<p class="sub">보유·생산 가능한 미사일이 없습니다.</p>'}</div>
  <div class="sec"><h3>병기 체계 (현재 배치 설계)</h3><p class="sub">새로 편성하는 부대는 아래 설계로 생산됩니다. 기술 개발이나 외교 탭의 무기 도입으로 상위 설계가 열립니다.</p><div class="designs">${designs}</div></div>`;
}
function panelTech() {
  const N = P(), cur = N.research ? TECH_BY_ID[N.research] : null, rp = economyPreview(me()).rp;
  const branches = [...new Set(TECHS.map(t => t.b))];
  return `<div class="sec"><h3>현재 연구</h3>${cur ? `<div class="row"><b>${esc(cur.name)}</b><span class="num">${Math.floor(N.progress[cur.id] || 0)}/${cur.cost}</span></div>${bar(100 * (N.progress[cur.id] || 0) / cur.cost, 'var(--accent)')}<p class="sub">턴당 ${fmt(rp, 1)} · 약 ${rp > 0 ? Math.ceil((cur.cost - (N.progress[cur.id] || 0)) / rp) : '∞'}턴</p>` : '<p class="neg">연구 과제를 선택하세요.</p>'}</div>
  ${branches.map(b => `<div class="sec"><h3>${b}</h3>${TECHS.filter(t => t.b === b).map(t => {
    const done = has(me(), t.id), on = N.research === t.id, allowed = techAllowed(me(), t);
    const unlocks = DESIGN_ROWS.filter(r => r[6]?.req === t.id && (r[3] === '*' || r[3].split(' ').includes(me()))).map(r => r[2]);
    return `<div class="tech ${done ? 'done' : ''} ${on ? 'on' : ''}"><div class="row"><b>${esc(t.name)}</b><span class="num sub">${done ? '보유' : `${Math.floor(N.progress[t.id] || 0)}/${t.cost}`}</span></div><div class="sub">${esc(t.desc)}${unlocks.length ? ` · 해금: ${esc(unlocks.join(', '))}` : ''}${!allowed && !done ? (t.id === 'nuke' ? ' · 핵개발 칙령 필요' : ` · 선행: ${esc(TECH_BY_ID[t.req].name)}`) : ''}</div>${!done && !on && allowed ? `<div>${btn('연구 시작', 'research', t.id)}</div>` : ''}</div>`;
  }).join('')}</div>`).join('')}`;
}
function panelDiplo() {
  const f = UI.dipFilter, q = UI.dipSearch.trim();
  let ids = NATION_IDS.filter(n => n !== me());
  if (f === 'major') ids = ids.filter(n => NATIONS[n].tier === 'major');
  if (f === 'war') ids = ids.filter(n => atWar(me(), n));
  if (f === 'ally') ids = ids.filter(n => allied(me(), n));
  if (q) ids = ids.filter(n => NATIONS[n].name.includes(q) || NATIONS[n].short.includes(q));
  ids.sort((a, b) => (atWar(me(), b) - atWar(me(), a)) || ((NATIONS[b].tier === 'major') - (NATIONS[a].tier === 'major')) || (militaryPower(b) - militaryPower(a)));
  const rows = ids.slice(0, 60).map(n => {
    const N = G.nations[n], r = rel(me(), n);
    const barCss = r >= 0 ? `left:50%;width:${r / 2}%;background:var(--ok)` : `right:50%;width:${-r / 2}%;background:var(--danger)`;
    let acts = '';
    if (N.alive && !N.capitulated && !P().capitulated && G.vassal[n] !== me()) {
      const a = [];
      if (atWar(me(), n)) {
        a.push(btn(`강화 제안 (${pct(peaceAcceptance(n, me()))})`, 'peace', n));
        const cc = cyberCheck(me(), n);
        if (has(me(), 'cyber')) a.push(btn('사이버 공격 (20)', 'cyber', n, { disabled: !cc.ok, title: cc.why }));
      } else {
        const truce = (G.truce[pk(me(), n)] ?? -99) + 6 > G.turn;
        if (!allied(me(), n)) {
          a.push(btn('선전포고', 'war', n, { cls: 'sm danger', disabled: truce, title: truce ? '휴전 기간' : '' }));
          const ac = allianceCheck(me(), n); a.push(btn('동맹 제안', 'ally', n, { disabled: !ac.ok, title: ac.why }));
          a.push(btn(`최후통첩 (${pct(ultimatumOdds(me(), n))})`, 'ultimatum', n, { title: '보호국 편입 요구' }));
        } else if (G.ally[pk(me(), n)]) {
          a.push(btn('원조 요청', 'aid', n, { disabled: P().aidCd > 0 || r < 40 }));
          a.push(btn('동맹 파기', 'break', n, { cls: 'sm danger' }));
        }
        if (armsOffer(me(), n).length) a.push(btn('무기 도입', 'arms-deal', n));
      }
      a.push(btn('관계 개선 (15)', 'improve', n, { disabled: P().money < 15 || P().diploCd[n] === G.turn }));
      a.push(btn('첩보 작전', 'ops', n));
      acts = `<div class="btnrow">${a.join('')}</div>`;
    }
    const allies = NATION_IDS.filter(o => o !== n && G.ally[pk(n, o)] && NATIONS[o].tier === 'major').map(nName);
    return `<div class="nation-row"><div class="head"><span class="chip" style="background:${NATIONS[n].color}"></span><b>${esc(NATIONS[n].short)}</b>${statusPill(n)}<span class="sub num" style="margin-left:auto">관계 ${Math.round(r)}</span></div>
      <div class="relbar"><i style="${barCss}"></i></div>
      <div class="sub">${REGIME_NAMES[N.gov]} · 도시 ${citiesOf(n).length} · 전력 ${fmt(militaryPower(n))} · 안정 ${Math.round(N.stab)} · 평판 ${Math.round(N.rep)}${N.nukes ? ` · ☢ ${esc(NATIONS[n].nukeEst.split(' ')[0])}` : ''}${allies.length ? ` · 동맹: ${allies.slice(0, 5).join(', ')}${allies.length > 5 ? '…' : ''}` : ''}</div>${acts}</div>`;
  }).join('');
  return `<div class="sec"><h3>외교 · 첩보</h3>
    <div class="seg" role="group">${[['major', '주요국'], ['war', '교전국'], ['ally', '동맹·보호국'], ['all', '전체']].map(([k, l]) => `<button type="button" data-dip="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
    <input id="dip-search" type="search" placeholder="국가 검색" value="${esc(UI.dipSearch)}" aria-label="국가 검색">
    <p class="sub">평화 관계인 나라의 영토에는 들어갈 수 없습니다. 도발 없는 선전포고는 평판 -15와 안보리 회부를 부릅니다. 동맹국은 방어 조약에 따라 참전합니다.</p></div>${rows}${ids.length > 60 ? `<p class="sub">${ids.length - 60}개국 더 — 검색하세요</p>` : ''}`;
}
function panelWar() {
  const rowsHtml = MAJOR_IDS.map(n => { const N = G.nations[n]; return `<tr><td><span class="chip" style="background:${NATIONS[n].color};width:10px;height:10px"></span> ${esc(NATIONS[n].short)}${N.capitulated ? ' <span class="sub">(항복)</span>' : N.puppet ? ' <span class="sub">(괴뢰)</span>' : ''}</td><td>${citiesOf(n).length}</td><td>${G.units.filter(u => u.n === n).length}</td><td>${Math.round(N.stab)}</td><td>${N.kills}</td><td>${N.losses}</td><td>${score(n)}</td></tr>`; }).join('');
  const logs = G.log.slice(-150).reverse().map(l => `<div class="lg-${l.kind}"><span class="num sub">${l.t}</span> ${esc(l.text)}</div>`).join('');
  const nukes = G.nukeLog.map(x => `<div class="row"><span>${x.t}턴 · ${esc(nName(x.by))}</span><span class="sub">${W.tiles[x.at].city >= 0 ? esc(W.cities[W.tiles[x.at].city].name) : '표적 지역'} · ${x.kt}kt</span></div>`).join('');
  return `<div class="sec"><h3>종말 시계</h3><div class="doom"><span class="num">${G.doom}</span><span>초 전 자정</span></div>${bar(G.doom / 89 * 100, G.doom < 40 ? 'var(--danger)' : 'var(--warn)')}${nukes ? `<div class="rows">${nukes}</div>` : '<p class="sub">아직 핵무기가 사용되지 않았습니다.</p>'}</div>
  <div class="sec"><h3>강대국 현황</h3><div style="overflow-x:auto"><table class="stats"><thead><tr><th>국가</th><th>도시</th><th>부대</th><th>안정</th><th>격파</th><th>손실</th><th>점수</th></tr></thead><tbody>${rowsHtml}</tbody></table></div></div>
  <div class="sec"><h3>작전 일지</h3><div class="log">${logs}</div></div>`;
}

// ---------- actions ----------
function idleUnits() { return G ? G.units.filter(u => u.n === me() && !u.skip && CLASSES[u.t].dom !== 'air' && u.mv > 0 && !u.acted) : []; }
function nextUnit() {
  const list = idleUnits();
  if (!list.length) { toast('명령 대기 중인 부대가 없습니다'); return; }
  UI.cycle = (UI.cycle + 1) % list.length;
  const u = list[UI.cycle];
  select({ kind: 'unit', id: u.id });
  centerOn(u.pos, Math.max(UI.cam.z, 0.9));
}
function confirmBox(title, text, okLabel, fn, danger) {
  openModal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btnrow"><button class="btn ${danger ? 'danger' : 'primary'}" type="button" id="cf-ok">${esc(okLabel)}</button><button class="btn" type="button" id="cf-no">취소</button></div>`);
  $('#cf-ok').onclick = () => { closeModal(); fn(); };
  $('#cf-no').onclick = closeModal;
}
function act(a, arg) {
  if (!G) return;
  const n = arg;
  switch (a) {
    case 'next': return nextUnit();
    case 'zoom-in': return zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.3);
    case 'zoom-out': return zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.3);
    case 'home': { const c = capitalOf(me()) || citiesOf(me())[0]; if (c) centerOn(c.tile, Math.max(UI.cam.z, 0.9)); return; }
    case 'world': { const c = capitalOf(me()) || W.cities[0]; centerOn(c.tile, canvas.clientWidth / WORLD_W * 1.05); return; }
    case 'help': return showHelp();
    case 'arms-tab': UI.tab = 'arms'; return renderPanel();
    case 'cancel-mode': UI.mode = null; UI.mtargets = null; UI.nuclear = false; computeOrders(); renderModebar(); UI.dirty = true; return;
    case 'sel-unit': { const u = uById.get(+arg); if (u) select({ kind: 'unit', id: u.id }); return; }
    case 'wait': { const u = uById.get(+arg); if (u) { u.mv = 0; u.skip = true; } select(null); return after(); }
    case 'disband': { const u = uById.get(+arg); if (!u) return; return confirmBox('부대 해산', `${dsg(u).name}을(를) 해산합니다. 인력 ${Math.round(CLASSES[u.t].mp / 2)}을 회수합니다.`, '해산', () => { P().manpower += Math.round(CLASSES[u.t].mp / 2); if (u.t === 'cv') for (const x of G.units.slice()) if (x.carrier === u.id) removeUnit(x); removeUnit(u); select(null); after(); }, true); }
    case 'air-strike': { const u = uById.get(+arg); if (!u) return; UI.sel = { kind: 'unit', id: u.id }; UI.mode = 'air'; computeOrders(); if (!UI.targets.size) toast('작전반경 내 표적이 없습니다'); renderModebar(); renderPanel(); UI.dirty = true; return; }
    case 'air-rebase': { const u = uById.get(+arg); if (!u) return; UI.sel = { kind: 'unit', id: u.id }; UI.mode = 'rebase'; UI.mtargets = new Set(rebaseTargets(u)); if (!UI.mtargets.size) toast('재배치 가능한 기지가 없습니다 — 전략 전개를 이용하세요'); renderModebar(); renderPanel(); UI.dirty = true; return; }
    case 'deploy': {
      const u = uById.get(+arg); if (!u) return;
      UI.sel = { kind: 'unit', id: u.id }; UI.mode = 'deploy'; UI.reach = null; UI.targets = new Map();
      UI.mtargets = new Set(W.cities.filter(c => deployPlan(u, c.id).ok).map(c => c.tile));
      if (!UI.mtargets.size) toast('전개 가능한 도시가 없습니다 (예산·항구·교전 여부 확인)');
      renderModebar(); UI.dirty = true; return;
    }
    case 'recruit': { const [ci, t] = arg.split(':'); const u = recruit(me(), +ci, t); if (u) toast(`${W.cities[+ci].name}: ${dsg(u).name} 편성`, 'good'); UI.keepScroll = true; return after(); }
    case 'build': { const [ci, b] = arg.split(':'); if (build(me(), +ci, b)) toast(`${W.cities[+ci].name}: ${BUILDINGS[b].name} 완료`, 'good'); UI.keepScroll = true; return after(); }
    case 'fire': return setMissileMode(arg, false);
    case 'fire-nuke': return setMissileMode(arg, true);
    case 'buy-missile': buyMissile(me(), arg); UI.keepScroll = true; return after();
    case 'make-nuke': produceNuke(me()); UI.keepScroll = true; return after();
    case 'research': P().research = arg; UI.keepScroll = true; return after();
    case 'decree': {
      const D = DECREES.find(d => d.id === arg);
      const go = () => { if (enactDecree(me(), arg)) toast(`칙령 시행: ${D.name}`, 'good'); UI.keepScroll = true; after(); };
      if (['martial', 'nukeprog', 'purge_army', 'purge_party', 'nationalize', 'lifelong', 'mobilize'].includes(arg)) return confirmBox(D.name, D.desc, '시행', go, true);
      return go();
    }
    case 'peace': { const ok = proposePeace(me(), n); toast(ok ? `${nName(n)}와 강화 성립` : `${nName(n)}이(가) 강화를 거절했습니다`, ok ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'war': return confirmBox('선전포고', `${NATIONS[n].name}에 선전포고합니다. 상대의 동맹국이 참전할 수 있고, 도발 없는 침공이면 평판 -15와 안보리 회부를 감수해야 합니다.`, '선전포고', () => { declareWar(me(), n); after(); }, true);
    case 'ally': { const ok = proposeAlliance(me(), n); toast(ok ? `${nName(n)}와 동맹 체결` : '동맹 제안이 거절되었습니다', ok ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'break': return confirmBox('동맹 파기', `${NATIONS[n].name}와의 동맹을 파기합니다. 관계 -35, 평판 -5.`, '파기', () => { breakAlliance(me(), n); after(); }, true);
    case 'improve': improveRelations(me(), n); UI.keepScroll = true; return after();
    case 'aid': { const amt = requestAid(me(), n); toast(amt ? `${nName(n)}에서 원조 ${amt}억$ 도착` : '원조 요청이 거절되었습니다', amt ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'cyber': { const r = cyberAttack(me(), n); toast(r ? '사이버 공격 성공 — 적 다음 달 수입 -25%' : '사이버 공격이 차단되었습니다', r ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'ultimatum': return confirmBox('최후통첩', `${NATIONS[n].name}에 보호국 편입을 요구합니다. 수락 가능성 ${pct(ultimatumOdds(me(), n))}. 거부하면 관계 -30.`, '최후통첩 전달', () => { const r = ultimatum(me(), n); toast(r ? `${nName(n)}이(가) 굴복했습니다` : `${nName(n)}이(가) 거부했습니다`, r ? 'good' : 'bad'); after(); });
    case 'arms-deal': return showArmsDeal(n);
    case 'ops': return showOps(n);
    case 'menu': return showMenu();
    case 'new': closeModal(); return showStart();
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && !b.disabled) { act(b.dataset.act, b.dataset.arg); return; }
  const tb = e.target.closest('[data-tab]');
  if (tb && G) { UI.tab = tb.dataset.tab; renderPanel(); return; }
  const df = e.target.closest('[data-dip]');
  if (df && G) { UI.dipFilter = df.dataset.dip; renderPanel(); }
});
document.addEventListener('input', e => {
  if (!G) return;
  if (e.target.id === 'rd-slider') { P().rd = +e.target.value / 100; UI.keepScroll = true; const v = e.target.value; renderPanel(); const s = $('#rd-slider'); if (s) { s.value = v; s.focus(); } }
  if (e.target.id === 'dip-search') { UI.dipSearch = e.target.value; UI.keepScroll = true; renderPanel(); const s = $('#dip-search'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }
});
$('#btn-end').addEventListener('click', () => endTurn());
$('#btn-menu').addEventListener('click', () => showMenu());

function showArmsDeal(seller) {
  const items = armsOffer(me(), seller);
  openModal(`<div class="title-block"><span class="eyebrow">방산 협력 · ${esc(NATIONS[seller].name)}</span><h2>무기 도입 계약</h2></div>
    <p>설계 도입은 이후 편성하는 해당 병종을 판매국 설계로 생산하게 합니다. 미사일은 4기 단위로 들여오며 이후 자체 생산할 수 있습니다.</p>
    <div class="rows">${items.map((it, k) => `<div class="row"><span><b>${esc(it.name)}</b> <span class="sub">${it.kind === 'design' ? esc(CLASSES[it.cls].name) + ' · 품질 ×' + DESIGNS[it.id].q : '미사일'}</span></span><button class="btn sm" type="button" data-buy="${k}"${P().money < it.cost ? ' disabled' : ''}>${it.cost}억$</button></div>`).join('') || '<p class="sub">도입 가능한 품목이 없습니다.</p>'}</div>
    <div class="btnrow"><button class="btn" type="button" id="ad-close">닫기</button></div>`, true);
  $('#modal-card').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (buyArms(me(), seller, items[+b.dataset.buy])) toast(`무기 도입: ${items[+b.dataset.buy].name}`, 'good'); showArmsDeal(seller); after(); });
  $('#ad-close').onclick = closeModal;
}
function showOps(target) {
  openModal(`<div class="title-block"><span class="eyebrow">국가정보원 · 해외 공작</span><h2>${esc(NATIONS[target].name)} 대상 작전</h2></div>
    <div class="rows">${OPS.map(o => { const c = opCheck(me(), target, o.id); return `<div class="op"><div class="row"><b>${esc(o.name)}</b><button class="btn sm${o.id === 'assassinate' || o.id === 'coup' ? ' danger' : ''}" type="button" data-op="${o.id}"${c.ok ? '' : ' disabled'}>${c.ok ? `${o.cost}억$ · 성공 ${pct(c.p)}` : esc(c.why)}</button></div><div class="sub">${esc(o.desc)}</div></div>`; }).join('')}</div>
    <p class="sub">실패하면 요원이 체포되어 배후가 드러날 수 있습니다. 모사드·만리방화벽 같은 특성과 해외 정보망 기술이 성공률에 반영됩니다.</p>
    <div class="btnrow"><button class="btn" type="button" id="op-close">닫기</button></div>`, true);
  $('#modal-card').querySelectorAll('[data-op]').forEach(b => b.onclick = () => { const r = runOp(me(), target, b.dataset.op); closeModal(); if (r) toast(r.ok ? `작전 성공: ${r.msg}` : r.caught ? '작전 실패 — 배후가 드러났습니다' : '작전 실패', r.ok ? 'good' : 'bad'); after(); });
  $('#op-close').onclick = closeModal;
}

// ---------- turn flow ----------
const wait = ms => new Promise(r => setTimeout(r, ms));
function overlay(text) { $('#overlay').hidden = !text; if (text) $('#overlay-text').textContent = text; }
async function runAI(n) {
  startPhase(n);
  const before = UI.fx.length + UI.anim.size;
  aiTurn(n);
  if (UI.fx.length + UI.anim.size > before) { refreshVision(); UI.dirty = true; overlay(`${NATIONS[n].short} 작전 수행 중…`); await wait(450); }
}
async function endTurn() {
  if (!G || UI.busy || G.over) return;
  UI.busy = true; UI.mode = null; UI.sel = null; UI.reach = null; UI.targets = new Map(); UI.mtargets = null;
  renderModebar(); renderTop(); renderPanel();
  overlay('세계 각국이 행동 중…');
  await wait(20);
  let k = 0;
  for (const n of NATION_IDS) {
    if (n === me() || !G.nations[n].alive || G.nations[n].capitulated) continue;
    await runAI(n);
    if (++k % 12 === 0) { overlay(`세계 각국이 행동 중… (${k}/${NATION_IDS.length - 1})`); await wait(0); }
    if (checkVictory()) break;
  }
  if (!G.over) {
    endRound();
    for (const n of MAJOR_IDS) if (n !== me() && !G.nations[n].capitulated) aiEvents(n);
    startPhase(me());
    for (const u of G.units) u.skip = false;
    checkVictory();
  }
  overlay(''); UI.busy = false; UI.lowDirty = true;
  refreshVision(); after(); saveGame(false);
  if (G.over) return showGameOver();
  for (const c of politicalCrises(me())) { await presentCrisis(c); if (G.over) return showGameOver(); }
  await presentEvent(rollEvent(me()));
  await presentOffers();
  if (!P().research) toast('연구 과제를 선택하세요 (연구 탭)');
  after();
  if (G.over) showGameOver();
}
function modalChoice(html, choices) {
  return new Promise(res => {
    openModal(html + `<div class="btnrow">${choices.map((c, k) => `<button class="btn ${c.cls || (k ? '' : 'primary')}" type="button" data-choice="${k}">${esc(c.label)}</button>`).join('')}</div>`);
    $('#modal-card').querySelectorAll('[data-choice]').forEach(b => b.onclick = () => { closeModal(); res(+b.dataset.choice); });
  });
}
async function presentCrisis(kind) {
  const N = P(), ev = POL_EVENTS[kind], head = `<div class="title-block"><span class="eyebrow nuke">${esc(dateLabel())} · 정권 위기</span><h2>${esc(ev.title)}</h2></div><p>${esc(ev.text)}</p>`;
  if (kind === 'coup') {
    const p = clamp(0.25 + N.fac.sec / 150 + N.power / 200 - (N.fac.army < 30 ? 0.1 : 0), 0.1, 0.95);
    const k = await modalChoice(head + `<p class="sub">군부 충성 ${Math.round(N.fac.army)} · 보안기관 충성 ${Math.round(N.fac.sec)} · 권력 기반 ${Math.round(N.power)}</p>`, [{ label: `보안군 투입 진압 (성공 ${pct(p)})` }, { label: '군부와 타협 (60억$, 권력 -15)' }, { label: '해외 망명', cls: 'danger' }]);
    if (k === 0) { if (Math.random() < p) { N.fac.army = 55; N.power = clamp(N.power + 10, 0, 100); N.rep -= 3; N.stab = clamp(N.stab - 3, 0, 100); logMsg(`[${nName(me())}] 쿠데타 진압 — 주모자 처형`, 'decree', me()); toast('쿠데타를 진압했습니다', 'good'); } else N.flags.overthrown = '쿠데타로 실각'; }
    else if (k === 1) { N.fac.army = clamp(N.fac.army + 20, 0, 100); N.money -= 60; N.power = clamp(N.power - 15, 0, 100); N.stab = clamp(N.stab - 4, 0, 100); logMsg(`[${nName(me())}] 군부와 권력 분점 합의`, 'decree', me()); }
    else N.flags.overthrown = '망명 — 정권 포기';
  } else if (kind === 'uprising') {
    const p = clamp(N.fac.sec / 100 + 0.2, 0.1, 0.95);
    const k = await modalChoice(head + `<p class="sub">민중 지지 ${Math.round(N.fac.people)} · 보안기관 충성 ${Math.round(N.fac.sec)}</p>`, [{ label: `유혈 진압 (성공 ${pct(p)}, 평판 -20)`, cls: 'danger' }, { label: '개혁 약속 (권력 -20)' }]);
    if (k === 0) {
      if (Math.random() < p) { N.fac.people = clamp(N.fac.people - 10, 0, 100); N.rep -= 20; N.stab = clamp(N.stab + 3, 0, 100); N.power = clamp(N.power + 5, 0, 100); logMsg(`[${nName(me())}] 시위 유혈 진압`, 'decree', me()); G.flags.unPending = { by: me(), why: '시위대 유혈 진압' }; }
      else { N.stab = clamp(N.stab - 15, 0, 100); N.fac.people -= 10; if (N.stab < 15) N.flags.overthrown = '혁명으로 실각'; else toast('진압 실패 — 정권이 흔들립니다', 'bad'); }
    } else { N.fac.people = clamp(N.fac.people + 20, 0, 100); N.power = clamp(N.power - 20, 0, 100); N.fac.army -= 8; N.fac.party -= 8; N.stab = clamp(N.stab + 5, 0, 100); }
  } else if (kind === 'election') {
    const p = electionOdds(me());
    const opts = [{ label: `선거 실시 (승리 ${pct(p)})` }];
    if (N.gov === 'democracy') opts.push({ label: '비상계엄 · 선거 취소', cls: 'danger' });
    const k = await modalChoice(head + `<p class="sub">민중 지지 ${Math.round(N.fac.people)} · 안정도 ${Math.round(N.stab)}${flag(me(), 'rigged') ? ' · 개표 조작 준비됨' : ''}</p>`, opts);
    if (k === 0) {
      if (Math.random() < p) {
        N.nextElection = G.turn + (regime(me()).elections || 36); N.fac.people = clamp(N.fac.people + 5, 0, 100); N.power = clamp(N.power + 5, 0, 100);
        logMsg(`[${nName(me())}] 선거 승리 — ${G.leader.title} 재신임`, 'decree', me()); toast('선거에서 승리했습니다', 'good');
        if (flag(me(), 'rigged')) { delete N.flags.rigged; if (Math.random() < 0.3) { N.fac.people -= 15; N.rep -= 10; toast(POL_EVENTS.scandal.title, 'bad'); logMsg(`[${nName(me())}] ${POL_EVENTS.scandal.title}`, 'war', me()); } }
      } else N.flags.overthrown = '선거 패배 — 정권 교체';
    } else enactDecree(me(), 'martial');
  } else if (kind === 'assassination') {
    const k = await modalChoice(head, [{ label: '경호 강화 (20억$)' }, { label: '배후 색출 · 보복 (비밀경찰)' }]);
    if (k === 0) N.money -= 20; else { N.fac.sec = clamp(N.fac.sec + 6, 0, 100); N.fac.people -= 4; }
  }
  after();
}
async function presentEvent(ev) {
  if (!ev) return;
  const k = await modalChoice(`<div class="title-block"><span class="eyebrow">${esc(dateLabel())} · 국가 사건</span><h2>${esc(ev.title)}</h2></div><p>${esc(ev.text)}</p><p class="sub">${ev.choices.map(c => `${esc(c.label)}: ${fxText(c.fx)}`).join(' / ')}</p>`, ev.choices);
  applyEvent(me(), ev, k); after();
}
function fxText(fx) {
  const m = { stab: '안정도', money: '예산', mp: '인력', fuel: '연료', rel: '주변국 관계', rep: '평판', power: '권력' };
  const parts = [];
  for (const [k, v] of Object.entries(fx)) {
    if (k === 'fac') for (const [f, d] of Object.entries(v)) parts.push(`${factionLabel(me(), f)} ${d > 0 ? '+' : ''}${d}`);
    else if (m[k] && typeof v === 'number') parts.push(`${m[k]} ${v > 0 ? '+' : ''}${v}`);
  }
  return parts.join(', ') || '특수 효과';
}
async function presentOffers() {
  while (G.pending.length) {
    const o = G.pending.shift();
    if (G.nations[o.from].capitulated) continue;
    if (o.type === 'peace' && !atWar(me(), o.from)) continue;
    if (o.type === 'alliance' && (allied(me(), o.from) || atWar(me(), o.from))) continue;
    const txt = o.type === 'peace' ? `${NATIONS[o.from].name}이(가) 강화를 제안합니다. 수락하면 현재 전선을 기준으로 종전하고 6턴간 휴전합니다.` : `${NATIONS[o.from].name}이(가) 군사 동맹을 제안합니다.`;
    const k = await modalChoice(`<div class="title-block"><span class="eyebrow">외교 전문</span><h2>${o.type === 'peace' ? '강화 제안' : '동맹 제안'} — ${esc(NATIONS[o.from].short)}</h2></div><p>${esc(txt)}</p>`, [{ label: '수락' }, { label: '거절' }]);
    if (k === 0) { if (o.type === 'peace') makePeace(me(), o.from); else { G.ally[pk(me(), o.from)] = 1; addRel(me(), o.from, 10); logMsg(`[${nName(me())}] ↔ [${nName(o.from)}] 군사 동맹 체결`, 'peace', me()); cache.supply = {}; cache.comp = {}; } }
    else addRel(me(), o.from, -3);
    after();
  }
}

// ---------- modals ----------
function openModal(html, wide) { const c = $('#modal-card'); c.className = 'card' + (wide ? ' wide' : ''); c.innerHTML = html; c.onclick = null; $('#modal').hidden = false; const f = c.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
function closeModal() { $('#modal').hidden = true; }
function showGameOver() {
  const o = G.over;
  openModal(`<div class="title-block"><span class="eyebrow">${esc(dateLabel())} · ${o.win ? '승리' : '종국'}</span><h1>${esc(o.title)}</h1></div><p>${esc(o.text)}</p>${panelWar().split('<div class="sec"><h3>작전 일지')[0]}<div class="btnrow">${o.win ? '<button class="btn primary" type="button" id="go-cont">계속 통치하기</button>' : ''}<button class="btn ${o.win ? '' : 'primary'}" type="button" data-act="new">새 게임</button><button class="btn" type="button" id="go-close">지도 보기</button></div>`, true);
  if (o.win) $('#go-cont').onclick = () => { continueAfterWin(); closeModal(); after(); };
  $('#go-close').onclick = closeModal;
  if (!o.win) try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
function showMenu() {
  let hasSave = false; try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
  openModal(`<h2>메뉴</h2><div class="btnrow">
    ${G ? '<button class="btn" type="button" id="m-save">저장</button>' : ''}
    <button class="btn" type="button" id="m-load" ${hasSave ? '' : 'disabled'}>불러오기</button>
    <button class="btn" type="button" id="m-new">새 게임</button><button class="btn" type="button" id="m-help">규칙</button>
    ${G ? `<button class="btn" type="button" id="m-fog">전장의 안개: ${G.fog ? '켜짐' : '꺼짐'}</button>` : ''}
    <button class="btn" type="button" id="m-close">닫기</button></div>
    <p class="sub">매 턴 종료 시 이 브라우저에 자동 저장됩니다. 단축키: E 턴 종료 · N 다음 부대 · F 대기 · Esc 선택 해제 · 방향키 · +/- 확대.</p>`);
  const on = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
  on('#m-save', () => { saveGame(true); closeModal(); });
  on('#m-load', () => { if (loadSaved()) { closeModal(); toast('저장된 게임을 불러왔습니다'); } });
  on('#m-new', () => showStart());
  on('#m-help', () => showHelp());
  on('#m-fog', () => { G.fog = !G.fog; refreshVision(); after(); closeModal(); });
  on('#m-close', closeModal);
}
function showHelp() {
  openModal(`<div class="title-block"><span class="eyebrow">통치 교범</span><h2>규칙 요약</h2></div><div class="help">
    <p><b>지도</b> — 전 세계 1도(약 89km) 헥스. 동서가 이어져 있습니다. 축소하면 정세도, 확대하면 전술 지도가 됩니다. 1턴은 1개월입니다.</p>
    <p><b>권력</b> — 군부·정보기관·관료(당·왕실·성직자)·재계·민중의 충성도가 안정도를 결정합니다. 칙령으로 선전·숙청·계엄·국유화·총동원을 하고, 쿠데타·봉기·선거를 넘겨야 합니다. 민주국가는 계엄으로 선거를 없앨 수 있지만 제재와 평판 하락을 부릅니다.</p>
    <p><b>병기</b> — 각국은 실제 무기 체계(K2 흑표, F-35A, 055형 구축함, 화성-18 등)를 운용합니다. 설계마다 품질 계수가 달라 같은 병종도 전투력이 다릅니다. 기술 개발이나 무기 도입 계약으로 상위 설계를 확보합니다.</p>
    <p><b>전투</b> — 공격력/방어력 비율로 피해가 정해지며 체력·경험·사기·보급·연료·지형·요새·참호·측면 포위가 반영됩니다. 포병·MLRS·구축함은 원거리 사격, 공군은 작전반경(km) 내 공습, 방공·전투기는 요격합니다.</p>
    <p><b>이동</b> — 자국·동맹 영토에서는 철도·도로로 이동 비용이 절반입니다. "전략 전개"로 철도·해상·공중 장거리 이동(수 턴 소요)을 합니다. 평화 관계인 나라의 영토에는 들어갈 수 없습니다.</p>
    <p><b>미사일과 핵</b> — 탄도·순항·극초음속 미사일을 실제 사거리(km)로 발사합니다. 요격 확률은 적의 미사일 방어 기술, 방공망, SAM, 이지스함, 미사일 회피 성능으로 계산됩니다. 핵탄두는 반경 내 모든 것을 파괴하고 낙진을 남기며, 종말 시계를 앞당깁니다. 0초가 되면 핵겨울로 모두 패배합니다.</p>
    <p><b>국제 질서</b> — 평판이 낮거나 침공을 하면 서방 제재·유엔 결의(상임이사국 거부권 가능)가 뒤따릅니다. 너무 강해지면 강대국들이 연합해 맞섭니다. 첩보 작전으로 사보타주·기술 탈취·암살·정권 전복을, 최후통첩으로 약소국을 보호국으로 삼을 수 있습니다.</p>
    <p><b>승리</b> — 한반도 통일(남·북), 세계 도시 35% 지배(세계 패권), 모든 강대국 수도 장악(세계 정복), 적국 항복 후 종전, 또는 기간 종료 시 점수 1위. 승리 후에도 계속 통치할 수 있습니다. 쿠데타·혁명·선거 패배·항복·핵겨울은 패배입니다.</p>
  </div><div class="btnrow"><button class="btn primary" type="button" id="h-close">닫기</button></div>`, true);
  $('#h-close').onclick = () => { closeModal(); if (!G || G.flags.demo) showStart(); };
}
function showStart() {
  const s = UI.setup;
  let hasSave = false; try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
  const N = NATIONS[s.nat];
  openModal(`<div class="title-block"><span class="eyebrow">세계 전략 시뮬레이션 · 1칸 1° · 1턴 1개월</span><h1>한반도 대전략</h1><p>전쟁이 실제로 일어났다고 가정하고, 한 나라의 절대 권력자가 되어 세계를 상대로 싸우는 턴제 전략 게임입니다. 칙령과 숙청으로 권력을 다지고, 실존 무기 체계와 핵으로 세계를 흔드세요.</p></div>
    <div class="sec"><h3>시나리오</h3><div class="pick-grid">${SCENARIOS.map(sc => `<button class="pick" type="button" data-scen="${sc.id}" aria-pressed="${s.scen === sc.id}"><b>${esc(sc.name)}</b><span>${esc(sc.blurb)}</span><span class="meta">${sc.year}년 ${sc.month}월</span></button>`).join('')}</div></div>
    <div class="sec"><h3>지배할 국가</h3><div class="nat-grid">${MAJOR_IDS.map(n => `<button class="natpick" type="button" data-nat="${n}" aria-pressed="${s.nat === n}"><span class="chip" style="background:${NATIONS[n].color}"></span>${esc(NATIONS[n].short)}</button>`).join('')}</div>
      <div class="nat-detail"><b>${esc(N.name)}</b> <span class="sub">${REGIME_NAMES[N.gov]} · 경제력 ×${N.econ} · 핵 ${esc(N.nukeEst)}</span><p>${esc(N.brief)}</p><div class="traits">${(N.traits || []).map(t => `<span class="trait" title="${esc(TRAITS[t].desc)}">${esc(TRAITS[t].name)}</span>`).join('')}</div></div></div>
    <div class="sec"><h3>지도자</h3><div class="opts">
      <label>칭호 <select id="leader-title">${[N.leader, ...LEADER_TITLES.filter(t => t !== N.leader)].map(t => `<option${(s.title || N.leader) === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label>이름 <input id="leader-name" type="text" maxlength="12" placeholder="지도자" value="${esc(s.name)}"></label></div></div>
    <div class="sec"><div class="opts">
      <span>난이도 <span class="seg">${[['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']].map(([k, l]) => `<button type="button" data-diff="${k}" aria-pressed="${s.diff === k}">${l}</button>`).join('')}</span></span>
      <span>전장의 안개 <span class="seg">${[[true, '켜기'], [false, '끄기']].map(([k, l]) => `<button type="button" data-fog="${k}" aria-pressed="${s.fog === k}">${l}</button>`).join('')}</span></span>
      <span>기간 <span class="seg">${[[60, '5년'], [120, '10년'], [240, '20년']].map(([k, l]) => `<button type="button" data-turns="${k}" aria-pressed="${s.turns === k}">${l}</button>`).join('')}</span></span>
    </div></div>
    <div class="btnrow"><button class="btn primary big" type="button" id="st-go">권좌에 오르기</button>${hasSave ? '<button class="btn big" type="button" id="st-load">이어하기</button>' : ''}<button class="btn big" type="button" id="st-help">규칙</button></div>`, true);
  const card = $('#modal-card');
  const keep = () => { s.name = $('#leader-name').value; s.title = $('#leader-title').value; };
  card.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    keep();
    if (b.dataset.scen) s.scen = b.dataset.scen;
    else if (b.dataset.nat) { s.nat = b.dataset.nat; s.title = ''; }
    else if (b.dataset.diff) s.diff = b.dataset.diff;
    else if (b.dataset.fog) s.fog = b.dataset.fog === 'true';
    else if (b.dataset.turns) s.turns = +b.dataset.turns;
    else return;
    const y = card.scrollTop; showStart(); $('#modal-card').scrollTop = y;
  };
  $('#st-go').onclick = e => { e.stopPropagation(); keep(); startGame(); };
  $('#st-help').onclick = e => { e.stopPropagation(); keep(); showHelp(); };
  const l = $('#st-load'); if (l) l.onclick = e => { e.stopPropagation(); if (loadSaved()) closeModal(); };
}
async function startGame() {
  const s = UI.setup;
  closeModal();
  overlay('세계를 준비하는 중…'); await wait(20);
  newGame(s.scen, s.nat, { diff: s.diff, fog: s.fog, maxTurn: s.turns, leaderName: s.name.trim() || '지도자', leaderTitle: s.title || NATIONS[s.nat].leader });
  UI.sel = null; UI.mode = null; UI.fx = []; UI.anim.clear(); UI.tab = 'sel'; UI.lowDirty = true;
  refreshVision();
  const cap = capitalOf(me());
  centerOn(cap.tile, 0.9);
  startPhase(me());
  overlay('');
  after();
  if (G.flags.firstStrike && me() !== G.flags.firstStrike) {
    const fs = G.flags.firstStrike; G.flags.firstStrike = null;
    UI.busy = true; renderTop();
    toast('새벽 4시, 북한군이 군사분계선 전역에서 포격을 시작했습니다', 'bad');
    overlay('북한군 기습 남침'); await runAI(fs); await wait(300);
    overlay(''); UI.busy = false; startPhase(me()); after();
  }
  G.flags.firstStrike = null;
  saveGame(false);
}

// ---------- persistence ----------
function saveGame(manual) {
  if (!G) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); if (manual) toast('저장했습니다'); }
  catch (e) { if (manual) toast('이 브라우저에서는 저장할 수 없습니다', 'bad'); }
}
function loadSaved() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; restore(JSON.parse(raw)); return true; }
  catch (e) { toast('저장 데이터를 읽지 못했습니다', 'bad'); return false; }
}
function restore(obj) {
  loadGame(obj);
  UI.sel = null; UI.mode = null; UI.busy = false; UI.fx = []; UI.anim.clear(); UI.lowDirty = true;
  refreshVision();
  const cap = capitalOf(me()); if (cap) centerOn(cap.tile, 0.9);
  after();
}

// ---------- boot ----------
function boot(data) {
  buildWorld();
  resize();
  setupInput();
  requestAnimationFrame(loop);
  if (data && data.game) restore(data.game);
  else {
    newGame('dictator', 'KOR', {});
    G.flags.demo = true; G.fog = false;
    refreshVision();
    const seoul = W.cities.find(c => c.name === '서울');
    centerOn(seoul.tile, clamp(canvas.clientWidth / (COLW * 70), 0.12, 0.6));
    after();
    showStart();
  }
  try { window.claude?.hot?.snapshot?.(() => ({ game: G && !UI.busy && !G.flags.demo ? serialize() : null })); } catch (e) {}
  document.fonts?.ready?.then(() => { UI.dirty = true; });
}
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
