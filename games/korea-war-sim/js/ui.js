// 한반도 대전략 — map renderer, input, panels, turn flow
'use strict';

const S = 20, SQ3 = Math.sqrt(3);
const CORNERS = [...Array(6)].map((_, i) => { const a = Math.PI / 180 * (60 * i - 30); return [Math.cos(a) * S, Math.sin(a) * S]; });
const DIR_CORNERS = [[0, 1], [5, 0], [4, 5], [3, 4], [2, 3], [1, 2]];
const WORLD_W = S * SQ3 * (HEX.W + 0.5) + S * 2, WORLD_H = S * 1.5 * (HEX.H - 1) + S * 3;
const COL = {
  bg: '#0A1823', sea: '#0F2433', shallow: '#15344A', grid: 'rgba(140,180,205,0.07)', coast: '#08131B',
  plain: '#6F7C57', forest: '#4F6749', hill: '#857D5A', mount: '#8D8474', glyph: 'rgba(20,24,18,0.45)', glyphHi: 'rgba(240,232,210,0.28)',
  label: '#EFE9DA', halo: 'rgba(7,15,21,0.9)', fog: 'rgba(6,13,19,0.42)', accent: '#F2B544', danger: '#E35D51', ok: '#72C282',
};
const SAVE_KEY = 'kws-save-v1';

const $ = s => document.querySelector(s);
const canvas = $('#map'), ctx = canvas.getContext('2d');
const UI = {
  sel: null, reach: null, targets: new Map(), mode: null, tab: 'sel', hover: -1,
  cam: { x: 0, y: 0, z: 1 }, vis: null, fx: [], anim: new Map(), busy: false, dirty: true, dpr: 1,
  setup: { scen: 'crisis', nat: 'KOR', diff: 'normal', fog: true, turns: 60 }, cycle: 0,
};

function tileXY(i) { const t = W.tiles[i]; return [S * SQ3 * (t.c + 0.5 * (t.r & 1)) + S, S * 1.5 * t.r + S]; }
function hexPath(x, y, k = 1) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const [cx, cy] = CORNERS[i]; i ? ctx.lineTo(x + cx * k, y + cy * k) : ctx.moveTo(x + cx * k, y + cy * k); }
  ctx.closePath();
}
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const fmt = (v, d = 0) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('ko-KR');
const sgn = v => (v >= 0 ? '+' : '') + fmt(v, Math.abs(v) < 10 ? 1 : 0);
const me = () => G.player;
const P = () => G.nations[G.player];

// ---------- vision & selection ----------
function refreshVision() {
  UI.vis = G.fog ? visionFor(me()) : null;
}
function seen(i) { return !UI.vis || !!UI.vis[i]; }
function seenUnit(u) { return !UI.vis || unitVisible(u, me(), UI.vis); }
function selUnit() { return UI.sel?.kind === 'unit' ? uById.get(UI.sel.id) || null : null; }
function selTile() { const u = selUnit(); return u ? u.pos : UI.sel?.kind === 'tile' ? UI.sel.i : -1; }

function computeOrders() {
  UI.reach = null; UI.targets = new Map();
  const u = selUnit();
  if (!u || u.n !== me() || UI.busy) return;
  const dom = UNITS[u.t].dom;
  if (dom === 'air') {
    if (UI.mode === 'air') for (const k of attackTargets(u, u.pos, UI.vis)) UI.targets.set(k, u.pos);
    return;
  }
  UI.reach = reachable(u);
  if (!canAttackFrom(u)) return;
  for (const [j, r] of UI.reach) {
    if (j !== u.pos && (r.left <= 0 || !canEnd(u, j))) continue;
    for (const k of attackTargets(u, j, UI.vis)) {
      const prev = UI.targets.get(k);
      if (prev === undefined || j === u.pos || (prev !== u.pos && r.left > UI.reach.get(prev).left)) UI.targets.set(k, j);
    }
  }
}
function select(sel) {
  UI.sel = sel; if (UI.mode !== 'missile') UI.mode = null;
  computeOrders();
  UI.dirty = true;
  if (UI.tab !== 'sel' && sel) UI.tab = 'sel';
  renderPanel();
  renderModebar();
}

// ---------- camera ----------
function clampCam() {
  const vw = canvas.clientWidth / UI.cam.z, vh = canvas.clientHeight / UI.cam.z;
  UI.cam.x = clamp(UI.cam.x, -vw * 0.5, WORLD_W - vw * 0.5);
  UI.cam.y = clamp(UI.cam.y, -vh * 0.5, WORLD_H - vh * 0.5);
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
  UI.cam.z = clamp(UI.cam.z * f, 0.3, 3.2);
  UI.cam.x = wx - sx / UI.cam.z; UI.cam.y = wy - sy / UI.cam.z;
  clampCam(); UI.dirty = true;
}
function screenToTile(sx, sy) {
  const wx = UI.cam.x + sx / UI.cam.z, wy = UI.cam.y + sy / UI.cam.z;
  const r0 = Math.round((wy - S) / (1.5 * S));
  let best = -1, bd = INF;
  for (let r = r0 - 1; r <= r0 + 1; r++) {
    const c0 = Math.round((wx - S) / (S * SQ3) - 0.5 * (r & 1));
    for (let c = c0 - 1; c <= c0 + 1; c++) {
      const i = tileIdx(c, r); if (i < 0) continue;
      const [x, y] = tileXY(i); const d = (x - wx) ** 2 + (y - wy) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
  }
  return bd <= S * S * 1.1 ? best : -1;
}
function resize() {
  const r = canvas.getBoundingClientRect();
  UI.dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(r.width * UI.dpr));
  canvas.height = Math.max(1, Math.round(r.height * UI.dpr));
  clampCam(); UI.dirty = true;
}

// ---------- drawing ----------
function drawTerrainGlyph(t, x, y) {
  ctx.lineWidth = 1.1;
  if (t.terrain === 'mount') {
    ctx.strokeStyle = COL.glyph; ctx.fillStyle = COL.glyphHi;
    for (const [ox, oy, s] of [[-5, 3, 6], [3, 4, 5]]) {
      ctx.beginPath(); ctx.moveTo(x + ox - s, y + oy); ctx.lineTo(x + ox, y + oy - s * 1.3); ctx.lineTo(x + ox + s, y + oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + ox - s * 0.35, y + oy - s * 0.85); ctx.lineTo(x + ox, y + oy - s * 1.3); ctx.lineTo(x + ox + s * 0.35, y + oy - s * 0.85); ctx.closePath(); ctx.fill();
    }
  } else if (t.terrain === 'hill') {
    ctx.strokeStyle = COL.glyph;
    ctx.beginPath(); ctx.arc(x - 4, y + 4, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 4, y + 5, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else if (t.terrain === 'forest') {
    ctx.fillStyle = 'rgba(22,40,24,0.55)';
    for (const [ox, oy] of [[-5, 1], [2, -3], [4, 4], [-1, 6]]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, 2.6, 0, 6.3); ctx.fill(); }
  }
}
function drawSymbol(t, x, y, w, h, fill, ink, emb) {
  const dom = UNITS[t].dom;
  ctx.lineWidth = Math.max(1, w * 0.06);
  ctx.fillStyle = fill; ctx.strokeStyle = ink;
  if (dom === 'sea') {
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.5, h * 0.55, 0, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (t === 'dd') { ctx.moveTo(x - w * 0.32, y - h * 0.05); ctx.lineTo(x + w * 0.32, y - h * 0.05); ctx.lineTo(x + w * 0.2, y + h * 0.22); ctx.lineTo(x - w * 0.24, y + h * 0.22); ctx.closePath(); ctx.moveTo(x - w * 0.05, y - h * 0.05); ctx.lineTo(x - w * 0.05, y - h * 0.28); ctx.lineTo(x + w * 0.08, y - h * 0.28); ctx.lineTo(x + w * 0.08, y - h * 0.05); }
    else { ctx.ellipse(x, y + h * 0.08, w * 0.32, h * 0.14, 0, 0, 6.3); ctx.moveTo(x - w * 0.04, y - h * 0.06); ctx.lineTo(x - w * 0.04, y - h * 0.26); ctx.lineTo(x + w * 0.08, y - h * 0.26); ctx.lineTo(x + w * 0.08, y - h * 0.06); }
    ctx.stroke();
    return;
  }
  ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
  const l = x - w / 2, r = x + w / 2, tp = y - h / 2, bt = y + h / 2;
  ctx.beginPath();
  if (t === 'inf' || t === 'mech') { ctx.moveTo(l, tp); ctx.lineTo(r, bt); ctx.moveTo(r, tp); ctx.lineTo(l, bt); }
  if (t === 'armor' || t === 'mech') { ctx.moveTo(x + w * 0.3, y); ctx.ellipse(x, y, w * 0.3, h * 0.26, 0, 0, 6.3); }
  if (t === 'aa') { ctx.moveTo(l + w * 0.12, bt); ctx.quadraticCurveTo(x, tp - h * 0.1, r - w * 0.12, bt); }
  if (t === 'ftr' || t === 'drone') { ctx.moveTo(l + w * 0.18, y + h * 0.12); ctx.quadraticCurveTo(x - w * 0.15, y - h * 0.35, x, y + h * 0.05); ctx.quadraticCurveTo(x + w * 0.15, y - h * 0.35, r - w * 0.18, y + h * 0.12); }
  ctx.stroke();
  if (t === 'art') { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y, h * 0.17, 0, 6.3); ctx.fill(); }
  if (t === 'sof' || t === 'drone') { ctx.fillStyle = ink; ctx.font = `700 ${h * (t === 'drone' ? 0.3 : 0.42)}px 'IBM Plex Sans KR', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t === 'sof' ? 'SF' : 'UAV', x, t === 'drone' ? y + h * 0.28 : y); }
  if (emb) { ctx.strokeStyle = '#9FD3F0'; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const px = l + (w * k) / 8, py = bt + h * 0.22 + (k % 2 ? -2 : 2); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
}
function hpColor(hp) { return hp > 66 ? COL.ok : hp > 33 ? COL.accent : COL.danger; }
function unitScreenPos(u, now) {
  const a = UI.anim.get(u.id);
  if (a) {
    const p = clamp((now - a.t0) / a.dur, 0, 1);
    if (p >= 1) UI.anim.delete(u.id);
    else {
      const f = p * (a.path.length - 1), k = Math.floor(f), m = f - k;
      const A = a.path[k], B = a.path[Math.min(k + 1, a.path.length - 1)];
      return [A[0] + (B[0] - A[0]) * m, A[1] + (B[1] - A[1]) * m];
    }
  }
  return tileXY(u.pos);
}
function draw(now) {
  const z = UI.cam.z, dpr = UI.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!G) return;
  ctx.setTransform(dpr * z, 0, 0, dpr * z, -UI.cam.x * dpr * z, -UI.cam.y * dpr * z);
  const vw = canvas.clientWidth / z, vh = canvas.clientHeight / z;
  const r0 = Math.max(0, Math.floor((UI.cam.y - S) / (1.5 * S)) - 1), r1 = Math.min(HEX.H - 1, Math.ceil((UI.cam.y + vh) / (1.5 * S)) + 1);
  const c0 = Math.max(0, Math.floor(UI.cam.x / (S * SQ3)) - 1), c1 = Math.min(HEX.W - 1, Math.ceil((UI.cam.x + vw) / (S * SQ3)) + 1);
  const px = v => v / z;
  const inView = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) inView.push(r * HEX.W + c);

  // terrain + territory
  for (const i of inView) {
    const t = W.tiles[i]; const [x, y] = tileXY(i);
    hexPath(x, y, 1.02);
    if (!t.land) {
      const shallow = t.nb.some(k => W.tiles[k].land);
      ctx.fillStyle = shallow ? COL.shallow : COL.sea; ctx.fill();
      if (z > 0.9) { ctx.strokeStyle = COL.grid; ctx.lineWidth = px(1); ctx.stroke(); }
      continue;
    }
    ctx.fillStyle = COL[t.terrain]; ctx.fill();
    const o = tileOwner(i);
    if (o) { ctx.fillStyle = rgba(NATIONS[o].color, o === t.nat ? 0.3 : 0.44); ctx.fill(); }
    if (o && o !== t.nat) { // occupied: diagonal hatch
      ctx.save(); hexPath(x, y); ctx.clip(); ctx.strokeStyle = rgba(NATIONS[o].color, 0.5); ctx.lineWidth = 1.2;
      ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(x - S + k * 7, y + S); ctx.lineTo(x + S + k * 7, y - S); } ctx.stroke(); ctx.restore();
    }
    if (z > 0.55) drawTerrainGlyph(t, x, y);
    if (z > 0.9) { hexPath(x, y); ctx.strokeStyle = 'rgba(10,20,14,0.14)'; ctx.lineWidth = px(1); ctx.stroke(); }
  }
  // coasts & borders
  for (const i of inView) {
    const t = W.tiles[i]; if (!t.land) continue;
    const [x, y] = tileXY(i); const o = tileOwner(i);
    t.nb.forEach((j, n) => {
      const d = t.nbDir[n], tj = W.tiles[j];
      const [a, b] = DIR_CORNERS[d];
      if (!tj.land) {
        ctx.strokeStyle = COL.coast; ctx.lineWidth = Math.max(1.4, px(1.6));
        ctx.beginPath(); ctx.moveTo(x + CORNERS[a][0], y + CORNERS[a][1]); ctx.lineTo(x + CORNERS[b][0], y + CORNERS[b][1]); ctx.stroke();
      } else if (tileOwner(j) !== o && o) {
        const k = 0.9;
        ctx.strokeStyle = NATIONS[o].color; ctx.lineWidth = Math.max(1.6, px(2.2));
        ctx.beginPath(); ctx.moveTo(x + CORNERS[a][0] * k, y + CORNERS[a][1] * k); ctx.lineTo(x + CORNERS[b][0] * k, y + CORNERS[b][1] * k); ctx.stroke();
      }
    });
  }
  // fog
  if (UI.vis) {
    ctx.fillStyle = COL.fog;
    for (const i of inView) if (!UI.vis[i]) { const [x, y] = tileXY(i); hexPath(x, y, 1.02); ctx.fill(); }
  }
  // sea labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [name, lon, lat, sz] of SEA_LABELS) {
    const [c, r] = lonLatToCR(lon, lat); const i = tileIdx(c, r); if (i < 0) continue;
    const [x, y] = tileXY(i);
    ctx.font = `italic 500 ${Math.max(12, 15 * sz)}px 'IBM Plex Sans KR', sans-serif`;
    ctx.fillStyle = 'rgba(150,190,215,0.42)'; ctx.fillText(name.split('').join(' '), x, y);
  }
  // orders overlay
  const su = selUnit();
  if (UI.reach && su) {
    for (const [j, r] of UI.reach) {
      if (j === su.pos || !canEnd(su, j)) continue;
      const [x, y] = tileXY(j); hexPath(x, y, 0.86);
      ctx.fillStyle = r.left > 0 ? 'rgba(242,181,68,0.22)' : 'rgba(242,181,68,0.12)'; ctx.fill();
      ctx.strokeStyle = 'rgba(242,181,68,0.55)'; ctx.lineWidth = px(1.2); ctx.stroke();
    }
  }
  for (const [k] of UI.targets) {
    const [x, y] = tileXY(k); hexPath(x, y, 0.8);
    ctx.strokeStyle = COL.danger; ctx.lineWidth = px(2.4); ctx.setLineDash([px(5), px(3)]); ctx.stroke(); ctx.setLineDash([]);
  }
  if (UI.mode === 'missile') {
    for (const i of inView) if (seen(i) && missileTargetOk(me(), i) && targetVisible(i)) { const [x, y] = tileXY(i); hexPath(x, y, 0.78); ctx.strokeStyle = '#FF8A5B'; ctx.lineWidth = px(2.2); ctx.stroke(); }
  }
  if (UI.mode === 'rebase' && su) {
    for (const cy of W.cities) if (rebaseCheck(su, cy.tile)) { const [x, y] = tileXY(cy.tile); hexPath(x, y, 0.85); ctx.strokeStyle = COL.ok; ctx.lineWidth = px(2.4); ctx.stroke(); }
  }
  if (UI.hover >= 0 && !UI.busy) { const [x, y] = tileXY(UI.hover); hexPath(x, y, 0.95); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = px(1.4); ctx.stroke(); }
  // hover path
  if (su && UI.reach && UI.hover >= 0) {
    const dest = UI.targets.has(UI.hover) ? UI.targets.get(UI.hover) : UI.hover;
    if (UI.reach.has(dest) && dest !== su.pos) {
      const path = pathTo(UI.reach, dest).map(tileXY);
      ctx.strokeStyle = COL.accent; ctx.lineWidth = px(2.5); ctx.setLineDash([px(6), px(4)]);
      ctx.beginPath(); path.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  // cities
  const fontBody = "'IBM Plex Sans KR', 'Noto Sans KR', sans-serif";
  for (const cy of W.cities) {
    const t = W.tiles[cy.tile]; if (t.r < r0 || t.r > r1 || t.c < c0 || t.c > c1) continue;
    const [x, y] = tileXY(cy.tile); const c = G.cities[cy.id]; const col = NATIONS[c.owner].color;
    const s = 5 + Math.min(4, c.pop * 0.45);
    ctx.fillStyle = '#10181F'; ctx.fillRect(x - s - 1.5, y - s - 1.5, s * 2 + 3, s * 2 + 3);
    ctx.fillStyle = col; ctx.fillRect(x - s, y - s, s * 2, s * 2);
    if (G.nations[c.owner].capital === cy.id) {
      ctx.fillStyle = '#10181F'; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? s * 0.42 : s * 0.95; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.fill();
    }
    for (let k = 0; k < c.fort; k++) { ctx.strokeStyle = '#E8E2D2'; ctx.lineWidth = 1.2; ctx.strokeRect(x - s - 3.5 - k * 2.5, y - s - 3.5 - k * 2.5, (s + 3.5 + k * 2.5) * 2, (s + 3.5 + k * 2.5) * 2); }
    const air = airAt(cy.tile).filter(seenUnit);
    if (air.length) {
      ctx.fillStyle = NATIONS[air[0].n].color; ctx.strokeStyle = '#10181F'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + s + 5, y - s - 3, 6, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#10181F'; ctx.font = `700 8px ${fontBody}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✈' + (air.length > 1 ? air.length : ''), x + s + 5, y - s - 2.5);
    }
    const showName = z > 0.85 || c.pop >= 6 || cy.cap || z > 0.6 && c.pop >= 4;
    if (showName) {
      const fs = Math.max(px(11), 7.5);
      ctx.font = `700 ${fs}px ${fontBody}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = px(3.2); ctx.strokeStyle = COL.halo; ctx.lineJoin = 'round';
      ctx.strokeText(cy.name, x, y + S * 0.62); ctx.fillStyle = COL.label; ctx.fillText(cy.name, x, y + S * 0.62);
    }
    if (c.hp < 100) {
      ctx.fillStyle = '#10181F'; ctx.fillRect(x - 9, y - S * 0.95, 18, 3.5);
      ctx.fillStyle = hpColor(c.hp); ctx.fillRect(x - 9, y - S * 0.95, 18 * c.hp / 100, 3.5);
    }
    if (cy.port && blockaded(cy.id)) { ctx.strokeStyle = COL.danger; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s + 6, 0, 6.3); ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]); }
  }
  // units
  for (const u of G.units) {
    const dom = UNITS[u.t].dom;
    if (dom === 'air' || !seenUnit(u)) continue;
    const [x0, y0] = unitScreenPos(u, now);
    if (x0 < UI.cam.x - S * 2 || x0 > UI.cam.x + vw + S * 2 || y0 < UI.cam.y - S * 2 || y0 > UI.cam.y + vh + S * 2) continue;
    const onCity = W.tiles[u.pos].city >= 0 && !UI.anim.has(u.id);
    const x = x0 + (onCity ? (dom === 'sea' ? S * 0.45 : -S * 0.1) : 0), y = y0 - (onCity ? S * 0.3 : S * 0.08) + (dom === 'sea' && onCity ? S * 0.55 : 0);
    const w = S * 1.08, h = S * 0.72;
    const done = u.n === me() && (u.mv <= 0 || u.acted) && dom !== 'air';
    ctx.globalAlpha = done ? 0.55 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - w / 2 + 1.5, y - h / 2 + 2, w, h);
    drawSymbol(u.t, x, y, w, h, NATIONS[u.n].color, NATIONS[u.n].ink, u.emb);
    ctx.fillStyle = '#10181F'; ctx.fillRect(x - w / 2, y + h / 2 + 1.5, w, 3.2);
    ctx.fillStyle = hpColor(u.hp); ctx.fillRect(x - w / 2, y + h / 2 + 1.5, w * u.hp / 100, 3.2);
    const v = vet(u);
    for (let k = 0; k < v; k++) { ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.moveTo(x + w / 2 - 2 - k * 4, y - h / 2 - 1); ctx.lineTo(x + w / 2 + 1 - k * 4, y - h / 2 - 5); ctx.lineTo(x + w / 2 + 4 - k * 4, y - h / 2 - 1); ctx.fill(); }
    if (u.fort > 0 && dom === 'land' && !u.emb) { ctx.strokeStyle = '#E8E2D2'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - w / 2 - 3, y - h / 2); ctx.lineTo(x - w / 2 - 3, y + h / 2); ctx.moveTo(x + w / 2 + 3, y - h / 2); ctx.lineTo(x + w / 2 + 3, y + h / 2); ctx.stroke(); }
    if (u.n === me() && !supplied(u)) { ctx.fillStyle = COL.danger; ctx.font = `700 9px ${fontBody}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('보급!', x, y - h / 2 - 2); }
    ctx.globalAlpha = 1;
    if (UI.sel?.kind === 'unit' && UI.sel.id === u.id) { ctx.strokeStyle = COL.accent; ctx.lineWidth = px(2.5); ctx.strokeRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6); }
  }
  if (UI.sel?.kind === 'tile' || (su && UNITS[su.t].dom === 'air')) {
    const [x, y] = tileXY(selTile()); hexPath(x, y, 0.92); ctx.strokeStyle = COL.accent; ctx.lineWidth = px(2.5); ctx.stroke();
    if (su && UNITS[su.t].dom === 'air' && UI.mode === 'air') { ctx.beginPath(); ctx.arc(x, y, S * SQ3 * attackRange(su) + S * 0.5, 0, 6.3); ctx.strokeStyle = 'rgba(242,181,68,0.5)'; ctx.setLineDash([px(8), px(5)]); ctx.lineWidth = px(1.5); ctx.stroke(); ctx.setLineDash([]); }
  }
  drawFx(now);
}
function drawFx(now) {
  const px = v => v / UI.cam.z;
  UI.fx = UI.fx.filter(f => now < f.t0 + f.dur);
  for (const f of UI.fx) {
    const p = (now - f.t0) / f.dur; if (p < 0) continue;
    if (f.k === 'shot') {
      const [ax, ay] = tileXY(f.from), [bx, by] = tileXY(f.to);
      ctx.strokeStyle = f.dom === 'rebase' ? rgba('#72C282', 1 - p) : f.dom === 'air' ? `rgba(180,220,255,${1 - p})` : `rgba(255,214,120,${1 - p})`;
      ctx.lineWidth = px(2); ctx.beginPath(); ctx.moveTo(ax, ay);
      if (f.dom === 'air' || f.dom === 'rebase') ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 40, bx, by); else ctx.lineTo(bx, by);
      ctx.stroke();
    } else if (f.k === 'dmg') {
      const [x, y] = tileXY(f.i);
      ctx.font = `700 ${px(14)}px 'IBM Plex Mono', monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1 - p * p; ctx.lineWidth = px(3); ctx.strokeStyle = COL.halo; ctx.strokeText(f.text, x, y - 10 - p * 22);
      ctx.fillStyle = '#FF9C8F'; ctx.fillText(f.text, x, y - 10 - p * 22); ctx.globalAlpha = 1;
    } else if (f.k === 'boom' || f.k === 'capture') {
      const [x, y] = tileXY(f.i);
      ctx.strokeStyle = f.k === 'capture' ? rgba(NATIONS[f.n].color, 1 - p) : `rgba(255,150,80,${1 - p})`;
      ctx.lineWidth = px(3); ctx.beginPath(); ctx.arc(x, y, 6 + p * (f.big || f.k === 'capture' ? 34 : 20), 0, 6.3); ctx.stroke();
    } else if (f.k === 'missile') {
      const [ax, ay] = tileXY(f.from), [bx, by] = tileXY(f.to);
      const end = f.hit ? 1 : 0.8, q = Math.min(p / 0.85, end);
      const mx = (ax + bx) / 2, my = Math.min(ay, by) - Math.hypot(bx - ax, by - ay) * 0.35;
      const pt = s => [(1 - s) ** 2 * ax + 2 * (1 - s) * s * mx + s * s * bx, (1 - s) ** 2 * ay + 2 * (1 - s) * s * my + s * s * by];
      ctx.strokeStyle = 'rgba(255,138,91,0.8)'; ctx.lineWidth = px(2); ctx.beginPath();
      for (let s = 0; s <= q; s += 0.04) { const [x, y] = pt(s); s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
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

// ---------- fx hooks ----------
const FX_DUR = { shot: 420, dmg: 1000, boom: 650, capture: 900, missile: 1300 };
Hooks.fx = f => {
  if (!G) return;
  const now = performance.now();
  if (f.k === 'move') {
    if (UI.vis && !f.path.some(i => UI.vis[i])) return;
    UI.anim.set(f.u, { path: f.path.map(tileXY), t0: now, dur: Math.min(700, 110 * (f.path.length - 1)) });
    UI.dirty = true; return;
  }
  if (UI.vis) {
    const pts = [f.i, f.from, f.to].filter(x => x != null);
    if (!pts.some(i => UI.vis[i])) return;
  }
  const delay = f.k === 'boom' && f.big ? 1100 : f.k === 'dmg' ? 150 : 0;
  UI.fx.push({ ...f, t0: now + delay, dur: FX_DUR[f.k] || 600 });
  UI.dirty = true;
};
Hooks.log = (text, kind, who) => {
  if (!G) return;
  const mine = who === me() || text.includes(`[${nName(me())}]`) || text.includes(NATIONS[me()].name);
  const loud = ['capture', 'capitulate', 'war', 'peace', 'tech'].includes(kind);
  if (loud && (mine || kind === 'capitulate' || kind === 'war' && text.includes(nName(me())))) toast(text, ['war', 'loss'].includes(kind) ? 'bad' : kind === 'capture' && who === me() ? 'good' : '');
  if (UI.tab === 'war') UI.panelDirty = true;
};
function toast(text, cls = '') {
  const box = $('#toasts');
  const d = document.createElement('div'); d.className = 'toast ' + cls; d.textContent = text;
  box.prepend(d);
  while (box.children.length > 4) box.lastChild.remove();
  setTimeout(() => d.remove(), 4200);
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
  const t = W.tiles[i], su = selUnit();
  const out = [];
  if (UI.mode === 'missile') {
    if (missileTargetOk(me(), i) && targetVisible(i)) {
      const site = missileLaunchSite(me(), i);
      out.push(`<b>탄도미사일 표적</b>`, `<div class="row"><span>발사 기지</span><span>${site.name}</span></div>`, `<div class="row"><span>적 요격 확률</span><span>${Math.round(interceptChance(me(), i) * 100)}%</span></div>`, `<div class="row"><span>예상 피해</span><span>${40 + (has(me(), 'bm2') ? 15 : 0)}</span></div>`);
      return out.join('');
    }
  }
  if (su && UI.targets.has(i)) {
    const from = UI.targets.get(i);
    const saved = su.pos; su.pos = from; const pv = preview(su, i); su.pos = saved;
    if (pv) {
      const name = pv.tg.unit ? `[${nName(pv.tg.unit.n)}] ${UNITS[pv.tg.unit.t].name}` : `${W.cities[pv.tg.city].name} 시가지`;
      out.push(`<b>공격: ${esc(name)}</b>`,
        `<div class="row"><span>적 예상 피해</span><span class="pos">-${Math.round(pv.dealt)}${pv.kill ? ' (격파)' : ''}</span></div>`,
        `<div class="row"><span>아군 예상 피해</span><span class="${pv.taken >= su.hp ? 'neg' : ''}">-${Math.round(pv.taken)}</span></div>`);
      if (pv.pre) out.push(`<div class="sub">방공·요격 예상 피해 ${Math.round(pv.pre)} 포함</div>`);
      if (pv.capture) out.push(`<div class="sub" style="color:var(--accent)">도시 점령 가능</div>`);
      if (from !== su.pos) out.push(`<div class="sub">이동 후 공격</div>`);
      return out.join('');
    }
  }
  const [lon, lat] = [t.lon, t.lat];
  const o = tileOwner(i);
  out.push(`<b>${t.city >= 0 ? esc(W.cities[t.city].name) + ' · ' : ''}${t.land ? TERRAIN[t.terrain].name : '해양'}</b>`);
  out.push(`<div class="sub">${lat.toFixed(1)}°N ${lon.toFixed(1)}°E${o ? ' · ' + nName(o) + ' 영토' : ''}</div>`);
  if (t.land && t.city < 0) out.push(`<div class="row"><span>방어 보정</span><span>×${TERRAIN[t.terrain].def}</span></div>`);
  for (const u of [groundAt(i), shipAt(i)]) if (u && seenUnit(u)) out.push(`<div class="row"><span>[${nName(u.n)}] ${UNITS[u.t].name}</span><span>${u.hp}%</span></div>`);
  if (su && UI.reach?.has(i) && i !== su.pos && canEnd(su, i)) out.push(`<div class="sub">이동 후 남은 이동력 ${UI.reach.get(i).left}</div>`);
  return out.join('');
}
function showTip(i, sx, sy) {
  const tip = $('#tip');
  const html = tipFor(i);
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
    if (missileTargetOk(me(), i) && targetVisible(i)) {
      const r = fireMissile(me(), i);
      toast(r?.hit ? '미사일 명중' : '미사일이 요격되었습니다', r?.hit ? 'good' : 'bad');
      if (P().missiles <= 0) UI.mode = null;
      after();
    } else { UI.mode = null; renderModebar(); UI.dirty = true; }
    return;
  }
  if (UI.mode === 'rebase' && su) {
    if (rebaseAir(su, i)) { toast(`${UNITS[su.t].name} ${W.cities[W.tiles[i].city].name}(으)로 재배치`); UI.mode = null; select({ kind: 'unit', id: su.id }); after(); }
    else { UI.mode = null; select({ kind: 'tile', i }); }
    return;
  }
  if (su && su.n === me() && UI.targets.has(i)) {
    const from = UI.targets.get(i);
    if (from !== su.pos) moveUnit(su, from, UI.reach);
    const r = doAttack(su, i);
    UI.mode = null;
    if (r?.captured) toast(`${W.cities[W.tiles[i].city].name} 점령!`, 'good');
    select(uById.has(su.id) ? { kind: 'unit', id: su.id } : { kind: 'tile', i });
    after();
    return;
  }
  if (su && su.n === me() && UI.reach?.has(i) && i !== su.pos && canEnd(su, i)) {
    moveUnit(su, i, UI.reach);
    select({ kind: 'unit', id: su.id });
    after();
    return;
  }
  // selection cycling on the tile
  const cands = [groundAt(i), shipAt(i)].filter(u => u && seenUnit(u));
  const mineFirst = cands.sort((a, b) => (b.n === me()) - (a.n === me()));
  if (mineFirst.length) {
    const cur = su && su.pos === i ? mineFirst.findIndex(u => u.id === su.id) : -1;
    if (cur === mineFirst.length - 1 && W.tiles[i].city >= 0) { select({ kind: 'tile', i }); return; }
    select({ kind: 'unit', id: mineFirst[(cur + 1) % mineFirst.length].id });
    return;
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
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: UI.cam.z }; if (drag) drag.moved = true;
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.z * d / pinch.d) / UI.cam.z);
      return;
    }
    if (drag && ptrs.size === 1) {
      const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
      if (drag.moved) { UI.cam.x = drag.cx - dx / UI.cam.z; UI.cam.y = drag.cy - dy / UI.cam.z; clampCam(); UI.dirty = true; $('#tip').hidden = true; }
      return;
    }
    if (e.pointerType === 'mouse') {
      const i = screenToTile(e.offsetX, e.offsetY);
      if (i !== UI.hover) { UI.hover = i; UI.dirty = true; }
      showTip(i, e.offsetX, e.offsetY);
    }
  });
  const up = e => {
    const wasDrag = drag?.moved;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) {
      if (drag && !wasDrag) {
        const i = screenToTile(e.offsetX, e.offsetY);
        if (drag.btn === 2) { UI.mode = null; select(null); }
        else onTileClick(i);
        if (e.pointerType !== 'mouse') { UI.hover = -1; showTip(-1); }
      }
      drag = null;
    }
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; pinch = null; });
  canvas.addEventListener('pointerleave', () => { UI.hover = -1; $('#tip').hidden = true; UI.dirty = true; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (!G || !$('#modal').hidden || e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { UI.mode = null; select(null); }
    else if (k === 'e') endTurn();
    else if (k === 'n') nextUnit();
    else if (k === 'f') { const u = selUnit(); if (u && u.n === me()) act('wait', u.id); }
    else if (k === '+' || k === '=') zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.2);
    else if (k === '-') zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.2);
    else if (k.startsWith('arrow')) { const d = 60 / UI.cam.z; if (k === 'arrowleft') UI.cam.x -= d; if (k === 'arrowright') UI.cam.x += d; if (k === 'arrowup') UI.cam.y -= d; if (k === 'arrowdown') UI.cam.y += d; clampCam(); UI.dirty = true; e.preventDefault(); }
  });
  new ResizeObserver(resize).observe($('#mapwrap'));
}

// ---------- panels ----------
function svgUnit(t, color) {
  const dom = UNITS[t].dom, ink = '#12181c';
  let inner = '';
  if (dom === 'sea') {
    inner = `<ellipse cx="16" cy="11" rx="14" ry="9" fill="${color}" stroke="${ink}" stroke-width="1.5"/>` + (t === 'dd' ? `<path d="M7 11h18l-3 5H9z M15 11V6h3v5" fill="none" stroke="${ink}" stroke-width="1.4"/>` : `<ellipse cx="16" cy="13" rx="9" ry="2.5" fill="none" stroke="${ink}" stroke-width="1.4"/><path d="M15 11V7h3v4" fill="none" stroke="${ink}" stroke-width="1.4"/>`);
  } else {
    inner = `<rect x="2" y="3" width="28" height="17" fill="${color}" stroke="${ink}" stroke-width="1.5"/>`;
    if (t === 'inf' || t === 'mech') inner += `<path d="M2 3l28 17M30 3L2 20" stroke="${ink}" stroke-width="1.4"/>`;
    if (t === 'armor' || t === 'mech') inner += `<ellipse cx="16" cy="11.5" rx="8" ry="4.5" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
    if (t === 'art') inner += `<circle cx="16" cy="11.5" r="3" fill="${ink}"/>`;
    if (t === 'aa') inner += `<path d="M5 20Q16 1 27 20" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
    if (t === 'ftr' || t === 'drone') inner += `<path d="M7 14Q12 5 16 12Q20 5 25 14" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
    if (t === 'sof') inner += `<text x="16" y="15.5" text-anchor="middle" font-size="10" font-weight="700" fill="${ink}" font-family="sans-serif">SF</text>`;
    if (t === 'drone') inner += `<text x="16" y="19" text-anchor="middle" font-size="6" font-weight="700" fill="${ink}" font-family="sans-serif">UAV</text>`;
  }
  return `<svg width="32" height="23" viewBox="0 0 32 23" aria-hidden="true">${inner}</svg>`;
}
function hpBar(hp) { return `<div class="hp"><i style="width:${Math.max(0, hp)}%;background:${hpColor(hp)}"></i></div>`; }
function kv(pairs) { return `<div class="kv">${pairs.map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>`; }
function btn(label, act, arg, opts = {}) {
  return `<button class="btn ${opts.cls || 'sm'}" type="button" data-act="${act}"${arg != null ? ` data-arg="${esc(arg)}"` : ''}${opts.disabled ? ' disabled' : ''}${opts.title ? ` title="${esc(opts.title)}"` : ''}>${label}</button>`;
}
function statusPill(n) {
  const N = G.nations[n];
  if (!N.alive) return `<span class="pill gone">불참</span>`;
  if (N.capitulated) return `<span class="pill gone">항복</span>`;
  if (atWar(me(), n)) return `<span class="pill war">교전</span>`;
  if (allied(me(), n)) return `<span class="pill ally">동맹</span>`;
  if ((G.truce[pk(me(), n)] ?? -99) + 6 > G.turn) return `<span class="pill truce">휴전</span>`;
  return `<span class="pill peace">평화</span>`;
}

function renderTop() {
  if (!G) return;
  const N = P(), e = economyPreview(me());
  $('#nat-chip').style.background = NATIONS[me()].color;
  $('#nat-name').textContent = NATIONS[me()].name;
  $('#date').textContent = `${dateLabel()} · 턴 ${G.turn}/${G.maxTurn}`;
  const stabCol = N.stab > 55 ? 'var(--ok)' : N.stab > 30 ? 'var(--warn)' : 'var(--danger)';
  const tech = N.research ? TECHS.find(t => t.id === N.research) : null;
  $('#res').innerHTML = [
    ['예산 (억$)', `${fmt(N.money)}<span class="d ${e.net >= 0 ? 'pos' : 'neg'}">${sgn(e.net)}</span>`],
    ['인력 (천명)', `${fmt(N.manpower)}<span class="d pos">+${fmt(e.mp)}</span>`],
    ['연료', `${fmt(N.fuel)}<span class="d ${e.fuel >= 0 ? 'pos' : 'neg'}">${sgn(e.fuel)}</span>`],
    ['미사일', `${N.missiles}<span class="d mut">사거리 ${missileRange(me())}</span>`],
    ['안정도', `${fmt(N.stab)}<div class="stabbar"><i style="width:${N.stab}%;background:${stabCol}"></i></div>`],
    ['연구', tech ? `${esc(tech.name)}<span class="d mut">${Math.floor(N.progress[tech.id] || 0)}/${tech.cost}</span>` : '<span class="neg">미지정</span>'],
  ].map(([k, v]) => `<div class="res-item"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');
  $('#btn-end').disabled = UI.busy || !!G.over;
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(b => b.setAttribute('aria-selected', b.dataset.tab === UI.tab));
  const idle = idleUnits().length;
  $('[data-act="next"]').textContent = idle ? `다음 부대 (${idle})` : '다음 부대';
  const dtab = document.querySelector('[data-tab="tech"]');
  dtab.innerHTML = '연구' + (N.research ? '' : ' <span class="badge">!</span>');
}
function renderModebar() {
  const mb = $('#modebar');
  const su = selUnit();
  let txt = '';
  if (UI.mode === 'missile') txt = `미사일 표적 선택 · 잔량 ${P().missiles}`;
  else if (UI.mode === 'rebase' && su) txt = `${UNITS[su.t].name} 재배치할 도시 선택 (최대 10칸)`;
  else if (UI.mode === 'air' && su) txt = `${UNITS[su.t].name} 공습 표적 선택 (반경 ${attackRange(su)}칸)`;
  mb.hidden = !txt;
  if (txt) mb.innerHTML = `<span>${txt}</span><button type="button" data-act="cancel-mode">취소</button>`;
}
function renderPanel() {
  if (!G) return;
  UI.panelDirty = false;
  const body = $('#tab-body');
  const top = body.scrollTop;
  body.innerHTML = ({ sel: panelSel, nation: panelNation, tech: panelTech, diplo: panelDiplo, war: panelWar })[UI.tab]();
  body.scrollTop = UI.tab === 'war' ? top : UI.keepScroll ? top : 0;
  UI.keepScroll = false;
  renderTop();
}
function panelSel() {
  const su = selUnit();
  if (su) return unitCard(su) + tileCard(su.pos, true);
  if (UI.sel?.kind === 'tile') return tileCard(UI.sel.i, false);
  const idle = idleUnits();
  const sc = SCENARIOS.find(s => s.id === G.scen);
  return `<div class="sec"><h3>작전 개요</h3><h2>${esc(sc.name)}</h2><p class="sub">${esc(sc.blurb)}</p></div>
  <div class="sec"><h3>이번 턴</h3>
    <div class="rows">
      <div class="row"><span>명령 대기 부대</span><span class="num">${idle.length}</span></div>
      <div class="row"><span>교전국</span><span>${enemiesOf(me()).map(nName).join(', ') || '없음'}</span></div>
      <div class="row"><span>승리 조건</span><span class="sub">${victoryHint()}</span></div>
    </div>
    <div class="btnrow">${btn('다음 부대 선택', 'next')}${btn('수도 보기', 'home')}${P().missiles && enemiesOf(me()).length ? btn('미사일 발사', 'missile-mode') : ''}</div>
  </div>
  <div class="sec"><h3>조작</h3><p class="sub">부대를 선택하면 이동 가능 칸이 노란색, 공격 가능 표적이 붉은 점선으로 표시됩니다. 도시를 선택해 부대 편성·건설을 하고, 공군은 도시 카드에서 출격시킵니다. 드래그로 지도 이동, 휠·핀치로 확대합니다.</p>
  <div class="btnrow">${btn('규칙 보기', 'help')}</div></div>`;
}
function victoryHint() {
  const parts = [];
  if (me() === 'KOR' || me() === 'PRK') parts.push('한반도 24개 도시 통일');
  parts.push(`전체 도시 ${Math.ceil(W.cities.length * 0.5)}개 장악`, '적국 항복 후 종전', `${G.maxTurn}턴 점수 1위`);
  return parts.join(' / ');
}
function unitCard(u) {
  const U = UNITS[u.t], mine = u.n === me();
  const sup = supplied(u);
  const stars = '★'.repeat(vet(u)) + '☆'.repeat(3 - vet(u));
  const st = [];
  if (u.emb) st.push('해상 수송 중 (방어 4)');
  if (u.fort > 0 && U.dom === 'land') st.push('참호 구축 (방어 +20%)');
  if (!sup) st.push('<span class="neg">보급 두절 (전투력 -30%, 체력 -8/턴)</span>');
  if (U.fuel > 0 && G.nations[u.n].fuel <= 0) st.push('<span class="neg">연료 고갈 (전투력 -30%)</span>');
  let actions = '';
  if (mine && !UI.busy) {
    const a = [];
    if (U.dom === 'air') {
      a.push(btn('출격 (공습)', 'air-strike', u.id, { disabled: u.acted || u.hp <= 15 }));
      a.push(btn('재배치', 'air-rebase', u.id, { disabled: u.acted }));
    } else {
      a.push(btn('대기 · 참호', 'wait', u.id, { disabled: u.mv <= 0 }));
    }
    a.push(btn('해산', 'disband', u.id, { cls: 'sm danger' }));
    actions = `<div class="btnrow">${a.join('')}</div>`;
  }
  return `<div class="sec">
    <div class="row" style="justify-content:flex-start;gap:10px">${svgUnit(u.t, NATIONS[u.n].color)}<div><h2>${U.name}</h2><div class="sub">${esc(NATIONS[u.n].name)} · 경험 <span style="color:var(--accent)">${stars}</span></div></div></div>
    <div class="row"><span class="sub">체력</span><span class="num">${u.hp}/100</span></div>${hpBar(u.hp)}
    ${kv([['공격', fmt(unitStr(u, 'atk'), 1)], ['방어', fmt(unitStr(u, 'def'), 1)], [U.dom === 'air' ? '작전반경' : '이동', U.dom === 'air' ? U.rng : `${u.mv}/${U.mv + mvBonus(u.n, u.t)}`], ['사거리', U.rng > 0 ? U.rng : '근접']])}
    <p class="sub">${st.join(' · ') || (U.dom === 'air' ? `기지: ${W.cities[W.tiles[u.pos].city]?.name ?? '—'} · ${u.acted ? '이번 턴 출격 완료' : '출격 가능'}` : u.acted ? '이번 턴 공격 완료' : '명령 대기')}</p>
    <p class="sub">유지비 ${U.up}/턴 · 연료 ${U.fuel * 0.5}/턴${U.stealth ? ' · 잠항 (인접 또는 구축함 2칸 내에서만 발견)' : ''}${U.noZoc ? ' · 적 통제지역 무시' : ''}</p>
    ${actions}
  </div>`;
}
function tileCard(i, compact) {
  const t = W.tiles[i], o = tileOwner(i);
  let html = '';
  if (t.city >= 0) html += cityCard(t.city);
  if (compact && t.city < 0) {
    return html + `<div class="sec"><h3>지형</h3><div class="row"><span>${t.land ? TERRAIN[t.terrain].name : '해양'}${o ? ' · ' + nName(o) + ' 영토' : ''}</span><span class="num sub">${t.lat.toFixed(1)}°N ${t.lon.toFixed(1)}°E</span></div></div>`;
  }
  if (!compact) {
    const units = [groundAt(i), shipAt(i)].filter(u => u && seenUnit(u));
    html += `<div class="sec"><h3>지형 정보</h3>
      <div class="row"><span>${t.land ? TERRAIN[t.terrain].name : '해양'}</span><span class="num sub">${t.lat.toFixed(2)}°N ${t.lon.toFixed(2)}°E</span></div>
      ${t.land ? `<div class="row"><span class="sub">이동 비용 / 방어 보정</span><span class="num">${t.city >= 0 ? 1 : TERRAIN[t.terrain].cost} / ×${t.city >= 0 ? '도시' : TERRAIN[t.terrain].def}</span></div>` : ''}
      ${o ? `<div class="row"><span class="sub">관할</span><span>${esc(NATIONS[o].name)}${o !== t.nat ? ` (원 ${nName(t.nat)} 영토 · 점령지)` : ''}</span></div>` : ''}
      <div class="row"><span class="sub">아군 보급</span><span>${supplyMap(me())[i] ? '보급선 내' : '<span class="neg">보급선 밖</span>'}</span></div>
      ${units.map(u => `<div class="list-unit">${svgUnit(u.t, NATIONS[u.n].color)}<div class="grow"><div>${UNITS[u.t].name}</div><div class="sub">${nName(u.n)} · 체력 ${u.hp}</div></div>${btn('선택', 'sel-unit', u.id)}</div>`).join('')}
    </div>`;
  }
  return html;
}
function cityCard(ci) {
  const cy = W.cities[ci], c = G.cities[ci], own = c.owner === me();
  const canBase = own || (NATIONS[me()].offshore && allied(me(), c.owner) && (cy.base || cy.cap));
  const air = airAt(cy.tile).filter(seenUnit);
  let html = `<div class="sec">
    <div class="row" style="justify-content:flex-start;gap:10px"><span class="chip" style="background:${NATIONS[c.owner].color}"></span><div><h2>${esc(cy.name)}</h2><div class="sub">${esc(NATIONS[c.owner].name)}${cy.nat !== c.owner ? ` 점령지 (원 ${nName(cy.nat)})` : ''}${G.nations[c.owner].capital === ci ? ' · 수도' : ''}${cy.port ? ' · 항구' : ''}${cy.base ? ' · 미군 기지' : ''}</div></div></div>
    <div class="row"><span class="sub">도시 방어력</span><span class="num">${c.hp}/100 · 전력 ${fmt(cityStr(ci), 1)}</span></div>${hpBar(c.hp)}
    ${kv([['인구', c.pop], ['산업', cy.ind], ['요새', `${c.fort}/3`], ['방공망', `${c.sam}/2`]])}
    ${cy.port && blockaded(ci) ? '<p class="sub neg">해상 봉쇄 중 — 이 도시 수입 -40%, 연료 수입 감소</p>' : ''}
  </div>`;
  if (air.length) {
    html += `<div class="sec"><h3>비행단 (${air.length}/4)</h3>${air.map(u => `<div class="list-unit">${svgUnit(u.t, NATIONS[u.n].color)}<div class="grow"><div>${UNITS[u.t].name}</div><div class="sub">${nName(u.n)} · 체력 ${u.hp}${u.acted ? ' · 출격 완료' : ''}</div></div>${u.n === me() ? btn('출격', 'air-strike', u.id, { disabled: u.acted || u.hp <= 15 }) + btn('재배치', 'air-rebase', u.id, { disabled: u.acted }) : ''}</div>`).join('')}</div>`;
  }
  if (canBase && !UI.busy) {
    html += `<div class="sec"><h3>부대 편성 · 이번 턴 ${c.rec}/${cityRecruitCap(ci)}</h3><div class="unit-grid">${UNIT_ORDER.map(t => {
      const r = recruitCheck(me(), ci, t);
      return `<button class="btn ubtn" type="button" data-act="recruit" data-arg="${ci}:${t}"${r.ok ? '' : ' disabled'} title="${esc(r.ok ? `공격 ${UNITS[t].atk} · 방어 ${UNITS[t].def} · 이동 ${UNITS[t].mv}` : r.why)}">${svgUnit(t, NATIONS[me()].color)}<span><span class="nm">${UNITS[t].name}</span><span class="cs">${unitCost(me(), t)}억$ · 인력 ${UNITS[t].mp}</span>${r.ok ? '' : `<span class="why">${esc(r.why)}</span>`}</span></button>`;
    }).join('')}</div></div>`;
  }
  if (own && !UI.busy) {
    html += `<div class="sec"><h3>건설</h3><div class="rows">${Object.entries(BUILDINGS).map(([k, B]) => {
      const r = buildCheck(me(), ci, k);
      return `<div class="row"><span><b>${B.name}</b> <span class="sub">${B.desc}</span></span>${btn(r.ok ? `${r.cost}억$` : esc(r.why), 'build', `${ci}:${k}`, { disabled: !r.ok })}</div>`;
    }).join('')}</div></div>`;
  }
  return html;
}
function panelNation() {
  const N = P(), e = economyPreview(me());
  const counts = {};
  for (const u of G.units) if (u.n === me()) counts[u.t] = (counts[u.t] || 0) + 1;
  return `<div class="sec"><h3>국가 재정 (다음 달 예상)</h3>
    <div class="rows">
      <div class="row"><span>총수입</span><span class="num">${fmt(e.gross, 1)}</span></div>
      <div class="row"><span>연구 투자 (${Math.round(N.rd * 100)}%)</span><span class="num neg">-${fmt(e.rp, 1)}</span></div>
      <div class="row"><span>부대 유지비</span><span class="num neg">-${fmt(e.upkeep, 1)}</span></div>
      <div class="row"><b>순수입</b><b class="num ${e.net >= 0 ? 'pos' : 'neg'}">${sgn(e.net)}</b></div>
    </div>
    <label for="rd-slider" class="sub">연구 투자 비율 — 수입의 ${Math.round(N.rd * 100)}%</label>
    <input id="rd-slider" type="range" min="0" max="50" step="5" value="${Math.round(N.rd * 100)}">
    <p class="sub">수입 = 도시별 (인구×0.9 + 산업×1.3 + 공장) × 경제력 ${NATIONS[me()].econ} × 안정도 보정 ${fmt(0.6 + 0.4 * N.stab / 100, 2)}. 점령지는 절반, 봉쇄된 항구는 60%만 반영됩니다.</p>
  </div>
  <div class="sec"><h3>자원 흐름</h3><div class="rows">
    <div class="row"><span>연료</span><span class="num ${e.fuel >= 0 ? 'pos' : 'neg'}">${fmt(N.fuel)} (${sgn(e.fuel)}/턴)</span></div>
    <div class="row"><span>항구 봉쇄</span><span class="num">${e.blockaded}/${e.ports}</span></div>
    <div class="row"><span>인력 충원</span><span class="num">+${fmt(e.mp)}/턴</span></div>
    <div class="row"><span>안정도</span><span class="num">${fmt(N.stab)} — 전투 사기 ×${fmt(morale(me()), 2)}</span></div>
  </div><p class="sub">안정도가 떨어지면 수입과 전투력이 줄고, 수도를 잃은 채 18 미만이 되면 항복합니다. 전쟁 장기화·봉쇄·연료 고갈·도시 상실이 안정도를 깎습니다.</p></div>
  <div class="sec"><h3>전략 미사일</h3>
    <div class="row"><span>보유 ${N.missiles}기 · 사거리 ${missileRange(me())}칸 (${missileRange(me()) * HEX.KM}km)</span><span class="num">피해 ${40 + (has(me(), 'bm2') ? 15 : 0)}</span></div>
    <div class="btnrow">${btn('발사 표적 지정', 'missile-mode', null, { disabled: !N.missiles || !enemiesOf(me()).length })}${btn('1기 생산 (30억$)', 'buy-missile', null, { disabled: N.money < 30 })}</div>
    <p class="sub">적 요격 확률: 미사일 방어 기술 1·2단계 각 25%, 도시 방공망 단계당 15%, 인근 방공 여단 12%, 이지스 구축함 15% (최대 85%).</p>
  </div>
  <div class="sec"><h3>군 구성</h3><div class="rows">${UNIT_ORDER.filter(t => counts[t]).map(t => `<div class="row"><span>${UNITS[t].name}</span><span class="num">${counts[t]}</span></div>`).join('') || '<p class="sub">부대 없음</p>'}</div>
    <div class="row"><span class="sub">총 전투력 지수</span><span class="num">${fmt(militaryPower(me()))}</span></div></div>`;
}
function panelTech() {
  const N = P();
  const branches = [...new Set(TECHS.map(t => t.branch))];
  const cur = N.research ? TECHS.find(t => t.id === N.research) : null;
  const rp = economyPreview(me()).rp;
  return `<div class="sec"><h3>현재 연구</h3>${cur ? `<div class="row"><b>${cur.name}</b><span class="num">${Math.floor(N.progress[cur.id] || 0)}/${cur.cost}</span></div>${hpBar(100 * (N.progress[cur.id] || 0) / cur.cost).replace(/background:[^"]+/, 'background:var(--accent)')}<p class="sub">턴당 ${fmt(rp, 1)} 연구력 · 약 ${rp > 0 ? Math.ceil((cur.cost - (N.progress[cur.id] || 0)) / rp) : '∞'}턴 남음</p>` : '<p class="neg">연구 과제를 선택하세요.</p>'}</div>
  ${branches.map(b => `<div class="sec"><h3>${b}</h3>${TECHS.filter(t => t.branch === b).map(t => {
    const done = has(me(), t.id), on = N.research === t.id, locked = t.req && !has(me(), t.req);
    const prog = N.progress[t.id] || 0;
    return `<div class="tech ${done ? 'done' : ''} ${on ? 'on' : ''}"><div class="row"><b>${t.name}</b><span class="num sub">${done ? '보유' : `${Math.floor(prog)}/${t.cost}`}</span></div><div class="sub">${t.desc}${locked ? ` · 선행: ${TECHS.find(x => x.id === t.req).name}` : ''}</div>${!done && !on && !locked ? `<div>${btn('연구 시작', 'research', t.id)}</div>` : ''}</div>`;
  }).join('')}</div>`).join('')}`;
}
function panelDiplo() {
  const rows = NATION_IDS.filter(n => n !== me()).map(n => {
    const N = G.nations[n];
    const r = rel(me(), n);
    const bar = r >= 0 ? `left:50%;width:${r / 2}%;background:var(--ok)` : `right:50%;width:${-r / 2}%;background:var(--danger)`;
    let acts = '';
    if (N.alive && !N.capitulated && !P().capitulated) {
      const a = [];
      if (atWar(me(), n)) {
        a.push(btn(`강화 제안 (${Math.round(peaceAcceptance(n, me()) * 100)}%)`, 'peace', n));
        const cc = cyberCheck(me(), n);
        if (has(me(), 'cyber')) a.push(btn('사이버 공격 (20)', 'cyber', n, { disabled: !cc.ok, title: cc.why }));
      } else {
        const truce = (G.truce[pk(me(), n)] ?? -99) + 6 > G.turn;
        if (!allied(me(), n)) a.push(btn('선전포고', 'war', n, { cls: 'sm danger', disabled: truce, title: truce ? '휴전 기간' : '' }));
        const ac = allianceCheck(me(), n);
        if (!allied(me(), n)) a.push(btn('동맹 제안', 'ally', n, { disabled: !ac.ok, title: ac.why }));
        else { a.push(btn('원조 요청', 'aid', n, { disabled: P().aidCd > 0 || r < 40, title: P().aidCd > 0 ? `재요청 ${P().aidCd}턴 후` : r < 40 ? '관계 40 이상 필요' : '' })); a.push(btn('동맹 파기', 'break', n, { cls: 'sm danger' })); }
      }
      a.push(btn('관계 개선 (15)', 'improve', n, { disabled: P().money < 15 || P().diploCd[n] === G.turn }));
      acts = `<div class="btnrow">${a.join('')}</div>`;
    }
    const allies = NATION_IDS.filter(o => o !== n && allied(n, o) && G.nations[o].alive).map(nName);
    return `<div class="nation-row">
      <div class="head"><span class="chip" style="background:${NATIONS[n].color}"></span><b>${NATIONS[n].short}</b>${statusPill(n)}<span class="sub num" style="margin-left:auto">관계 ${Math.round(r)}</span></div>
      <div class="relbar"><i style="${bar}"></i></div>
      <div class="sub">도시 ${citiesOf(n).length} · 부대 ${G.units.filter(u => u.n === n).length} · 안정도 ${Math.round(N.stab)} · 전력 ${fmt(militaryPower(n))}${allies.length ? ` · 동맹: ${allies.join(', ')}` : ''}</div>
      ${acts}
    </div>`;
  }).join('');
  return `<div class="sec"><h3>외교 관계</h3><p class="sub">동맹국은 영토 통과·보급을 공유합니다. 평화 관계인 나라의 영토에는 진입할 수 없습니다. 강화가 성립하면 점령지는 현 상태로 유지되고 6턴간 휴전합니다.</p></div>${rows}`;
}
function panelWar() {
  const ids = activeNations();
  const rowsHtml = ids.map(n => {
    const N = G.nations[n];
    return `<tr><td><span class="chip" style="background:${NATIONS[n].color};width:10px;height:10px"></span> ${NATIONS[n].short}${N.capitulated ? ' <span class="sub">(항복)</span>' : ''}</td><td>${citiesOf(n).length}</td><td>${G.units.filter(u => u.n === n).length}</td><td>${Math.round(N.stab)}</td><td>${N.kills}</td><td>${N.losses}</td><td>${score(n)}</td></tr>`;
  }).join('');
  const logs = G.log.slice(-120).reverse().map(l => `<div class="lg-${l.kind}"><span class="num sub">${l.t}</span> ${esc(l.text)}</div>`).join('');
  return `<div class="sec"><h3>열강 현황</h3><div style="overflow-x:auto"><table class="stats"><thead><tr><th>국가</th><th>도시</th><th>부대</th><th>안정</th><th>격파</th><th>손실</th><th>점수</th></tr></thead><tbody>${rowsHtml}</tbody></table></div></div>
  <div class="sec"><h3>작전 일지</h3><div class="log">${logs}</div></div>`;
}

// ---------- actions ----------
function idleUnits() {
  if (!G) return [];
  return G.units.filter(u => u.n === me() && !u.skip && (UNITS[u.t].dom === 'air' ? false : u.mv > 0 && !u.acted));
}
function nextUnit() {
  const list = idleUnits();
  if (!list.length) { toast('명령 대기 중인 부대가 없습니다'); return; }
  UI.cycle = (UI.cycle + 1) % list.length;
  const u = list[UI.cycle];
  select({ kind: 'unit', id: u.id });
  centerOn(u.pos);
}
function confirmBox(title, text, okLabel, fn) {
  openModal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btnrow"><button class="btn primary" type="button" id="cf-ok">${esc(okLabel)}</button><button class="btn" type="button" id="cf-no">취소</button></div>`);
  $('#cf-ok').onclick = () => { closeModal(); fn(); };
  $('#cf-no').onclick = closeModal;
}
function act(a, arg) {
  if (!G) return;
  const n = arg;
  switch (a) {
    case 'next': return nextUnit();
    case 'zoom-in': return zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.25);
    case 'zoom-out': return zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 0.8);
    case 'home': { const c = capitalOf(me()) || citiesOf(me())[0] || W.cities.find(x => allied(me(), G.cities[x.id].owner)); if (c) centerOn(c.tile); return; }
    case 'help': return showHelp();
    case 'cancel-mode': UI.mode = null; computeOrders(); renderModebar(); UI.dirty = true; return;
    case 'sel-unit': { const u = uById.get(+arg); if (u) { select({ kind: 'unit', id: u.id }); } return; }
    case 'wait': { const u = uById.get(+arg); if (u) { u.mv = 0; u.skip = true; } select(null); return after(); }
    case 'disband': {
      const u = uById.get(+arg); if (!u) return;
      return confirmBox('부대 해산', `${UNITS[u.t].name}을(를) 해산합니다. 인력 ${Math.round(UNITS[u.t].mp / 2)}을 회수합니다.`, '해산', () => {
        P().manpower += Math.round(UNITS[u.t].mp / 2); removeUnit(u); select(null); after();
      });
    }
    case 'air-strike': { const u = uById.get(+arg); if (!u) return; UI.sel = { kind: 'unit', id: u.id }; UI.mode = 'air'; computeOrders(); if (!UI.targets.size) toast('작전반경 내 표적이 없습니다'); renderModebar(); renderPanel(); UI.dirty = true; return; }
    case 'air-rebase': { const u = uById.get(+arg); if (!u) return; UI.sel = { kind: 'unit', id: u.id }; UI.mode = 'rebase'; computeOrders(); renderModebar(); renderPanel(); UI.dirty = true; return; }
    case 'recruit': {
      const [ci, t] = arg.split(':');
      const u = recruit(me(), +ci, t);
      if (u) toast(`${W.cities[+ci].name}: ${UNITS[t].name} 편성 (다음 턴부터 행동)`, 'good');
      UI.keepScroll = true; return after();
    }
    case 'build': { const [ci, b] = arg.split(':'); if (build(me(), +ci, b)) toast(`${W.cities[+ci].name}: ${BUILDINGS[b].name} 완료`, 'good'); UI.keepScroll = true; return after(); }
    case 'missile-mode': UI.mode = 'missile'; UI.sel = null; UI.reach = null; UI.targets = new Map(); renderModebar(); UI.dirty = true; toast('주황색 테두리 표적을 선택하세요'); return;
    case 'buy-missile': buyMissile(me()); UI.keepScroll = true; return after();
    case 'research': P().research = arg; UI.keepScroll = true; return after();
    case 'peace': { const ok = proposePeace(me(), n); toast(ok ? `${nName(n)}와 강화 성립` : `${nName(n)}이(가) 강화를 거절했습니다`, ok ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'war': return confirmBox('선전포고', `${NATIONS[n].name}에 선전포고합니다. 안정도 -3, 상대의 동맹국도 참전할 수 있습니다.`, '선전포고', () => { declareWar(me(), n); after(); });
    case 'ally': { const ok = proposeAlliance(me(), n); toast(ok ? `${nName(n)}와 동맹 체결` : '동맹 제안이 거절되었습니다', ok ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'break': return confirmBox('동맹 파기', `${NATIONS[n].name}와의 동맹을 파기합니다. 관계 -35, 안정도 -2.`, '파기', () => { breakAlliance(me(), n); after(); });
    case 'improve': improveRelations(me(), n); UI.keepScroll = true; return after();
    case 'aid': { const amt = requestAid(me(), n); toast(amt ? `${nName(n)}에서 원조 ${amt}억$ 도착` : '원조 요청이 거절되었습니다', amt ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'cyber': { const r = cyberAttack(me(), n); toast(r ? '사이버 공격 성공 — 적 다음 달 수입 -25%' : '사이버 공격이 차단되었습니다', r ? 'good' : 'bad'); UI.keepScroll = true; return after(); }
    case 'menu': return showMenu();
    case 'save': saveGame(true); return;
    case 'new': closeModal(); return showStart();
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && !b.disabled) { act(b.dataset.act, b.dataset.arg); return; }
  const tb = e.target.closest('[data-tab]');
  if (tb && G) { UI.tab = tb.dataset.tab; renderPanel(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'rd-slider' && G) { P().rd = +e.target.value / 100; UI.keepScroll = true; const v = e.target.value; renderPanel(); const s = $('#rd-slider'); if (s) { s.value = v; s.focus(); } }
});
$('#btn-end').addEventListener('click', () => endTurn());
$('#btn-menu').addEventListener('click', () => showMenu());

// ---------- turn flow ----------
const wait = ms => new Promise(r => setTimeout(r, ms));
function overlay(text) { $('#overlay').hidden = !text; if (text) $('#overlay-text').textContent = text; }
async function runAI(n) {
  overlay(`${NATIONS[n].short} 작전 수행 중…`);
  startPhase(n);
  aiTurn(n);
  refreshVision();
  UI.dirty = true;
  await wait(G.units.some(u => u.n === n && UI.anim.has(u.id)) || UI.fx.length ? 520 : 60);
}
async function endTurn() {
  if (!G || UI.busy || G.over) return;
  UI.busy = true; UI.mode = null; UI.sel = null; UI.reach = null; UI.targets = new Map();
  renderModebar(); renderTop(); renderPanel();
  for (const n of NATION_IDS) {
    if (n === me() || !G.nations[n].alive || G.nations[n].capitulated) continue;
    await runAI(n);
    if (checkVictory()) break;
  }
  if (!G.over) {
    endRound();
    for (const n of activeNations()) if (n !== me()) aiEvents(n);
    startPhase(me());
    for (const u of G.units) u.skip = false;
    checkVictory();
  }
  overlay('');
  UI.busy = false;
  refreshVision(); after();
  saveGame(false);
  if (G.over) return showGameOver();
  const ev = rollEvent(me());
  await presentEvent(ev);
  await presentOffers();
  if (!P().research) toast('연구 과제를 선택하세요 (연구 탭)');
  after();
}
function presentEvent(ev) {
  return new Promise(res => {
    if (!ev) return res();
    if (ev.auto || (ev.cyberBlock && has(me(), 'cyber'))) {
      applyEvent(me(), ev, null); toast(`${ev.title}`, ''); return res();
    }
    openModal(`<div class="title-block"><span class="eyebrow">${esc(dateLabel())} · 국가 사건</span><h2>${esc(ev.title)}</h2></div><p>${esc(ev.text)}</p><div class="btnrow">${ev.choices.map((c, k) => `<button class="btn ${k ? '' : 'primary'}" type="button" data-choice="${k}">${esc(c.label)}</button>`).join('')}</div><p class="sub">${ev.choices.map(c => `${c.label}: ${fxText(c.fx)}`).join(' / ')}</p>`);
    $('#modal-card').querySelectorAll('[data-choice]').forEach(b => b.onclick = () => { applyEvent(me(), ev, +b.dataset.choice); closeModal(); after(); res(); });
  });
}
function fxText(fx) {
  const m = { stab: '안정도', money: '예산', manpower: '인력', fuel: '연료', relAll: '전 국가 관계' };
  const parts = Object.entries(fx).map(([k, v]) => k === 'incomeMult' ? `이번 달 수입 ×${v}` : `${m[k]} ${v > 0 ? '+' : ''}${v}`);
  return parts.join(', ') || '변화 없음';
}
async function presentOffers() {
  while (G.pending.length) {
    const o = G.pending.shift();
    if (!G.nations[o.from].alive || G.nations[o.from].capitulated) continue;
    if (o.type === 'peace' && !atWar(me(), o.from)) continue;
    if (o.type === 'alliance' && (allied(me(), o.from) || atWar(me(), o.from))) continue;
    await new Promise(res => {
      const txt = o.type === 'peace' ? `${NATIONS[o.from].name}이(가) 강화를 제안합니다. 수락하면 현재 전선을 기준으로 종전하고 6턴간 휴전합니다.` : `${NATIONS[o.from].name}이(가) 군사 동맹을 제안합니다. 동맹국은 영토 통과와 보급을 공유합니다.`;
      openModal(`<div class="title-block"><span class="eyebrow">외교 전문</span><h2>${o.type === 'peace' ? '강화 제안' : '동맹 제안'} — ${NATIONS[o.from].short}</h2></div><p>${esc(txt)}</p><div class="btnrow"><button class="btn primary" type="button" id="of-yes">수락</button><button class="btn" type="button" id="of-no">거절</button></div>`);
      $('#of-yes').onclick = () => { if (o.type === 'peace') makePeace(me(), o.from); else { G.ally[pk(me(), o.from)] = 1; addRel(me(), o.from, 10); logMsg(`[${nName(me())}] ↔ [${nName(o.from)}] 군사 동맹 체결`, 'peace', me()); cache.supply = {}; } closeModal(); after(); res(); };
      $('#of-no').onclick = () => { addRel(me(), o.from, -3); closeModal(); res(); };
    });
  }
}

// ---------- modals ----------
function openModal(html, wide) { const c = $('#modal-card'); c.className = 'card' + (wide ? ' wide' : ''); c.innerHTML = html; $('#modal').hidden = false; const f = c.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
function closeModal() { $('#modal').hidden = true; }
function showGameOver() {
  const o = G.over;
  openModal(`<div class="title-block"><span class="eyebrow">${esc(dateLabel())} · ${o.win ? '승리' : '종전'}</span><h1>${esc(o.title)}</h1></div><p>${esc(o.text)}</p>${panelWar().split('<div class="sec"><h3>작전 일지')[0]}<div class="btnrow"><button class="btn primary" type="button" data-act="new">새 게임</button><button class="btn" type="button" id="go-close">지도 보기</button></div>`);
  $('#go-close').onclick = closeModal;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
function showMenu() {
  let hasSave = false; try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
  openModal(`<h2>메뉴</h2><div class="btnrow">
    ${G ? '<button class="btn" type="button" id="m-save">저장</button>' : ''}
    <button class="btn" type="button" id="m-load" ${hasSave ? '' : 'disabled'}>불러오기</button>
    <button class="btn" type="button" id="m-new">새 게임</button>
    <button class="btn" type="button" id="m-help">규칙</button>
    ${G ? `<button class="btn" type="button" id="m-fog">전장의 안개: ${G.fog ? '켜짐' : '꺼짐'}</button>` : ''}
    <button class="btn" type="button" id="m-close">닫기</button></div>
    <p class="sub">매 턴 종료 시 이 브라우저에 자동 저장됩니다. 단축키: E 턴 종료 · N 다음 부대 · F 대기 · Esc 선택 해제 · 방향키 이동 · +/- 확대.</p>`);
  const on = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
  on('#m-save', () => { saveGame(true); closeModal(); });
  on('#m-load', () => { if (loadSaved()) { closeModal(); toast('저장된 게임을 불러왔습니다'); } });
  on('#m-new', () => showStart());
  on('#m-help', () => showHelp());
  on('#m-fog', () => { G.fog = !G.fog; refreshVision(); after(); closeModal(); });
  on('#m-close', closeModal);
}
function showHelp() {
  openModal(`<div class="title-block"><span class="eyebrow">야전 교범</span><h2>규칙 요약</h2></div><div class="help">
    <p><b>턴</b> — 1턴은 1개월. 모든 부대를 움직인 뒤 '턴 종료'를 누르면 다른 나라가 차례로 행동하고, 월말 정산(예산·연료·인력·연구·안정도)이 진행됩니다.</p>
    <p><b>이동</b> — 한 칸에 지상 부대 1개. 평야 1, 삼림·구릉 2, 산악 3의 이동력이 듭니다. 적 지상군 인접 칸에 들어가면 그 자리에서 멈춥니다(통제지역). 특수전 여단은 통제지역을 무시하고 산악을 빠르게 넘습니다. 평화 관계인 나라의 영토에는 들어갈 수 없습니다.</p>
    <p><b>전투</b> — 피해량은 공격력/방어력 비율로 결정됩니다. 체력·경험(★)·안정도·보급·연료·지형(구릉·삼림 ×1.25, 산악 ×1.5)·도시 요새·참호(한 턴 대기 시 +20%)·측면 포위(적 주변 아군 1개당 +10%)가 반영됩니다. 포병·구축함은 2칸 밖에서 반격 없이 포격합니다.</p>
    <p><b>도시 점령</b> — 수비대가 없는 도시는 방어력을 0으로 만든 뒤 보병·기갑 등 근접 지상군이 공격해 점령합니다. 수비대를 격파했을 때 도시 방어력이 50 이하면 즉시 입성합니다. 포위된 도시는 매 턴 인접 적을 포격합니다.</p>
    <p><b>공군</b> — 도시 비행장(최대 4)에 주둔하며 작전반경 안의 표적을 공습합니다. 적 방공 여단(2칸)·도시 방공망·적 전투기가 요격합니다. 스텔스 기술이 요격을 절반으로 줄입니다.</p>
    <p><b>해군·상륙</b> — 적 항구에 인접한 함정은 그 항구를 봉쇄해 수입과 연료 수입을 줄입니다. 잠수함은 인접하거나 구축함 2칸 이내일 때만 보입니다. 자국 항구에 있는 지상군은 바다로 나가 승선할 수 있고(방어 4), 해안에 상륙할 수 있습니다.</p>
    <p><b>보급</b> — 자국·동맹 영토이거나 아군 도시에서 4칸(군수 혁신 6칸) 이내면 보급됩니다. 보급이 끊기면 전투력 -30%, 매 턴 체력 -8.</p>
    <p><b>미사일</b> — 자국 도시에서 사거리 안의 적 부대·도시를 타격합니다. 요격 확률은 적의 미사일 방어 기술·방공망·방공 여단·이지스함에 따라 달라집니다. 도시를 타격하면 제3국과의 관계가 나빠집니다.</p>
    <p><b>안정도와 항복</b> — 전쟁 장기화, 도시 상실, 봉쇄, 연료 고갈로 떨어집니다. 수도를 잃고 안정도가 18 미만이거나 본토 도시 65% 이상을 잃으면, 또는 안정도가 6 이하가 되면 항복합니다. 미국은 안정도 20 이하에서 철수합니다.</p>
    <p><b>승리</b> — ${victoryHintStatic()}</p>
  </div><div class="btnrow"><button class="btn primary" type="button" id="h-close">닫기</button></div>`, true);
  $('#h-close').onclick = () => { closeModal(); if (!G) showStart(); };
}
function victoryHintStatic() { return '한국·북한은 한반도 24개 도시 통일, 모든 나라는 전체 도시의 절반 장악, 적국을 항복시키고 전쟁 종료, 또는 제한 턴 종료 시 점수 1위.'; }
function showStart() {
  const s = UI.setup;
  let hasSave = false; try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
  const nats = NATION_IDS.filter(n => NATIONS[n].playable);
  const stat = n => { const cs = W.cities.filter(c => c.nat === n); return `도시 ${cs.length} · 경제력 ×${NATIONS[n].econ} · 미사일 ${NATIONS[n].missiles}`; };
  openModal(`<div class="title-block"><span class="eyebrow">동북아 전역 작전 시뮬레이션 · 1칸 54km · 1턴 1개월</span><h1>한반도 대전략</h1><p>전쟁이 실제로 일어났다고 가정하고, 한반도를 중심으로 동북아 여섯 세력이 싸우는 턴제 전략 게임입니다. 국가를 골라 경제·연구·외교·군사를 지휘하세요.</p></div>
    <div class="sec"><h3>시나리오</h3><div class="pick-grid">${SCENARIOS.map(sc => `<button class="pick" type="button" data-scen="${sc.id}" aria-pressed="${s.scen === sc.id}"><b>${esc(sc.name)}</b><span>${esc(sc.blurb)}</span><span class="meta">${sc.year}년 ${sc.month}월 개전${sc.usa ? ' · 미국 참전' : ' · 미국 불참'}</span></button>`).join('')}</div></div>
    <div class="sec"><h3>지휘할 국가</h3><div class="pick-grid">${nats.map(n => `<button class="pick" type="button" data-nat="${n}" aria-pressed="${s.nat === n}"><b><span class="chip" style="background:${NATIONS[n].color}"></span>${esc(NATIONS[n].name)}</b><span>${esc(NATIONS[n].brief)}</span><span class="meta">${stat(n)}</span></button>`).join('')}</div></div>
    <div class="sec"><div class="opts">
      <span>난이도 <span class="seg">${[['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']].map(([k, l]) => `<button type="button" data-diff="${k}" aria-pressed="${s.diff === k}">${l}</button>`).join('')}</span></span>
      <span>전장의 안개 <span class="seg">${[[true, '켜기'], [false, '끄기']].map(([k, l]) => `<button type="button" data-fog="${k}" aria-pressed="${s.fog === k}">${l}</button>`).join('')}</span></span>
      <span>기간 <span class="seg">${[[36, '3년'], [60, '5년'], [120, '10년']].map(([k, l]) => `<button type="button" data-turns="${k}" aria-pressed="${s.turns === k}">${l}</button>`).join('')}</span></span>
    </div></div>
    <div class="btnrow"><button class="btn primary big" type="button" id="st-go">작전 개시</button>${hasSave ? '<button class="btn big" type="button" id="st-load">이어하기</button>' : ''}<button class="btn big" type="button" id="st-help">규칙</button></div>`, true);
  const card = $('#modal-card');
  card.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.scen) s.scen = b.dataset.scen;
    else if (b.dataset.nat) s.nat = b.dataset.nat;
    else if (b.dataset.diff) s.diff = b.dataset.diff;
    else if (b.dataset.fog) s.fog = b.dataset.fog === 'true';
    else if (b.dataset.turns) s.turns = +b.dataset.turns;
    else return;
    const y = card.scrollTop; showStart(); $('#modal-card').scrollTop = y;
  };
  $('#st-go').onclick = e => { e.stopPropagation(); startGame(); };
  $('#st-help').onclick = e => { e.stopPropagation(); showHelp(); };
  const l = $('#st-load'); if (l) l.onclick = e => { e.stopPropagation(); if (loadSaved()) closeModal(); };
}
async function startGame() {
  const s = UI.setup;
  closeModal();
  newGame(s.scen, s.nat, { diff: s.diff, fog: s.fog, maxTurn: s.turns });
  UI.sel = null; UI.mode = null; UI.fx = []; UI.anim.clear(); UI.tab = 'sel';
  refreshVision();
  const cap = capitalOf(me());
  centerOn(cap ? cap.tile : W.cities[0].tile, Math.max(0.9, UI.cam.z));
  startPhase(me());
  after();
  if (G.flags.firstStrike && me() !== 'PRK') {
    G.flags.firstStrike = false;
    UI.busy = true; renderTop();
    toast('새벽 4시, 북한군이 군사분계선 전역에서 포격을 시작했습니다', 'bad');
    await runAI('PRK');
    overlay(''); UI.busy = false;
    if (me() !== 'PRK') startPhase(me());
    after();
  }
  G.flags.firstStrike = false;
  saveGame(false);
}

// ---------- persistence ----------
function saveGame(manual) {
  if (!G) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); if (manual) toast('저장했습니다'); }
  catch (e) { if (manual) toast('이 브라우저에서는 저장할 수 없습니다', 'bad'); }
}
function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    restore(JSON.parse(raw));
    return true;
  } catch (e) { toast('저장 데이터를 읽지 못했습니다', 'bad'); return false; }
}
function restore(obj) {
  loadGame(obj);
  UI.sel = null; UI.mode = null; UI.busy = false; UI.fx = []; UI.anim.clear();
  refreshVision();
  const cap = capitalOf(me()); if (cap) centerOn(cap.tile, Math.max(0.9, UI.cam.z));
  after();
}

// ---------- boot ----------
function boot(data) {
  buildWorld();
  resize();
  setupInput();
  requestAnimationFrame(loop);
  // preview world behind the start screen: a live demo board
  if (data && data.game) { restore(data.game); }
  else {
    newGame('crisis', 'KOR', {});
    refreshVision();
    const seoul = W.cities.find(c => c.name === '서울');
    UI.cam.z = Math.min(1.1, Math.max(0.45, canvas.clientHeight / (S * 1.5 * 24)));
    centerOn(seoul.tile);
    after();
    showStart();
  }
  try { window.claude?.hot?.snapshot?.(() => ({ game: G && !UI.busy ? serialize() : null })); } catch (e) {}
  document.fonts?.ready?.then(() => { UI.dirty = true; });
}
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
