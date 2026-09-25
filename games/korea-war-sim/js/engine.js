// 한반도 대전략 — rules engine
'use strict';

const NB = [
  [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]],
  [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]],
];
const INF = 1e9;
const Hooks = { log() {}, fx() {} };
const W = { tiles: [], cities: [], N: HEX.W * HEX.H };
let G = null;
let OG = null, OS = null, LAND_IDX = [];
const uById = new Map();
const cache = { supply: {}, comp: {} };

// ---------- geometry ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function tileIdx(c, r) { if (r < 0 || r >= HEX.H) return -1; c = ((c % HEX.W) + HEX.W) % HEX.W; return r * HEX.W + c; }
function tileLonLat(c, r) { let lon = HEX.LON0 + (c + 0.5 * (r & 1)) * HEX.DLON; if (lon >= 180) lon -= 360; return [lon, HEX.LAT0 - r * HEX.DLAT]; }
function lonLatToCR(lon, lat) { const r = Math.round((HEX.LAT0 - lat) / HEX.DLAT); return [Math.round((lon - HEX.LON0) / HEX.DLON - 0.5 * (r & 1)), r]; }
function pip(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function bbox(pts) { let a = INF, b = INF, c = -INF, d = -INF; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; }
function inPoly(lon, lat, P) {
  const [a, b, c, d] = P.bb;
  if (lat < b || lat > d) return false;
  for (const L of [lon, lon + 360]) if (L >= a && L <= c && pip(L, lat, P.pts)) return true;
  return false;
}
function cube(i) { const c = i % HEX.W, r = (i / HEX.W) | 0; return [c - ((r - (r & 1)) >> 1), r]; }
function hexDist(a, b) {
  const W0 = HEX.W, ar = (a / W0) | 0, br = (b / W0) | 0;
  const dz = ar - br;
  let dx = (a - ar * W0 - ((ar - (ar & 1)) >> 1)) - (b - br * W0 - ((br - (br & 1)) >> 1));
  const s = dx + dz / 2;
  if (s > W0 / 2) dx -= W0; else if (s < -W0 / 2) dx += W0;
  const e = dx + dz;
  return Math.max(dx < 0 ? -dx : dx, dz < 0 ? -dz : dz, e < 0 ? -e : e);
}
const OFFS = {};
function offsetsFor(rad, parity) {
  const key = rad * 2 + parity;
  if (OFFS[key]) return OFFS[key];
  const out = [], r0 = 50, c0 = 50;
  const base = tileIdxRaw(c0, r0 + parity);
  for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad - 1; dc <= rad + 1; dc++) {
    const j = tileIdxRaw(c0 + dc, r0 + parity + dr);
    if (hexDist(base, j) <= rad) out.push([dc, dr]);
  }
  out.sort((x, y) => hexDist(base, tileIdxRaw(c0 + x[0], r0 + parity + x[1])) - hexDist(base, tileIdxRaw(c0 + y[0], r0 + parity + y[1])));
  return (OFFS[key] = out);
}
function tileIdxRaw(c, r) { return r * HEX.W + c; }
function tilesWithin(i, rad) {
  const r = (i / HEX.W) | 0, c = i - r * HEX.W, out = [];
  for (const [dc, dr] of offsetsFor(rad, r & 1)) { const j = tileIdx(c + dc, r + dr); if (j >= 0) out.push(j); }
  return out;
}
function kmDist(a, b) {
  const A = W.tiles[a], B = W.tiles[b], R = Math.PI / 180;
  const dl = (B.lat - A.lat) * R, dn = (B.lon - A.lon) * R;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(A.lat * R) * Math.cos(B.lat * R) * Math.sin(dn / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, sm = t => t * t * (3 - 2 * t);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s), u = sm(xf), v = sm(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function mdlLat(lon) {
  for (let k = 1; k < MDL.length; k++) { const [x0, y0] = MDL[k - 1], [x1, y1] = MDL[k]; if (lon <= x1) return y0 + (y1 - y0) * Math.max(0, lon - x0) / (x1 - x0); }
  return MDL[MDL.length - 1][1];
}
function segDistKm(lon, lat, a, b) {
  const k = Math.cos(lat * Math.PI / 180) * 111;
  const px = lon * k, py = lat * 111, ax = a[0] * k, ay = a[1] * 111, bx = b[0] * k, by = b[1] * 111;
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  const t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

// ---------- world generation ----------
function buildWorld() {
  const lands = LANDS.map(L => ({ ...L, bb: bbox(L.pts) }));
  const waters = WATERS.map(p => ({ pts: p, bb: bbox(p) }));
  const korea = { pts: KOREA_REGION, bb: bbox(KOREA_REGION) };
  const regions = {};
  for (const k of Object.keys(REGIONS)) regions[k] = REGIONS[k].map(p => ({ pts: p, bb: bbox(p) }));
  const T = new Array(W.N);
  for (let r = 0; r < HEX.H; r++) for (let c = 0; c < HEX.W; c++) {
    const [lon, lat] = tileLonLat(c, r);
    let land = false, nat = null;
    for (const L of lands) if (inPoly(lon, lat, L)) { land = true; nat = L.nat || null; break; }
    if (land && waters.some(P => inPoly(lon, lat, P))) land = false;
    const i = r * HEX.W + c;
    T[i] = { i, c, r, lon, lat, land, nat, terrain: 'sea', nb: [], nbDir: [], coast: false, city: -1, home: -1 };
  }
  W.tiles = T;
  for (const t of T) NB[t.r & 1].forEach(([dc, dr], d) => { const j = tileIdx(t.c + dc, t.r + dr); if (j >= 0) { t.nb.push(j); t.nbDir.push(d); } });
  for (const t of T) if (t.land && inPoly(t.lon, t.lat, korea)) t.nat = t.lat > mdlLat(t.lon) ? 'PRK' : 'KOR';

  const hasSea = j => T[j].nb.some(k => !T[k].land);
  W.cities = [];
  CITY_DATA.forEach(([name, nat, lon, lat, pop, ind, port, flags], id) => {
    const [c, r] = lonLatToCR(lon, lat);
    const start = tileIdx(c, clamp(r, 0, HEX.H - 1));
    let best = -1, bs = INF;
    for (const j of tilesWithin(start, 2)) {
      const t = T[j];
      if (t.city >= 0) continue;
      let s = hexDist(start, j) * 10;
      if (!t.land) s += port ? 5 : 14;
      else if (t.nat && t.nat !== nat) s += 25;
      if (port && !hasSea(j) && t.land) s += 8;
      if (s < bs) { bs = s; best = j; }
    }
    if (best < 0) best = start;
    const t = T[best]; t.land = true; t.city = id; if (!t.nat) t.nat = nat;
    const m = /O:([A-Z]{3})/.exec(flags);
    W.cities.push({ id, name, nat, tile: best, pop, ind, port: !!port, cap: flags.includes('C'), base: flags.includes('B'), occ: m ? m[1] : null, lon, lat });
  });
  for (const t of T) t.coast = t.land && t.nb.some(k => !T[k].land);

  const ridgeSegs = [];
  for (const R of RIDGES) for (let k = 1; k < R.length; k++) {
    const a = R[k - 1], b = R[k];
    ridgeSegs.push([a, b, Math.min(a[0], b[0]) - 4, Math.max(a[0], b[0]) + 4, Math.min(a[1], b[1]) - 3, Math.max(a[1], b[1]) + 3]);
  }
  for (const t of T) {
    if (!t.land) continue;
    let d = INF;
    for (const [a, b, x0, x1, y0, y1] of ridgeSegs) if (t.lon >= x0 && t.lon <= x1 && t.lat >= y0 && t.lat <= y1) d = Math.min(d, segDistKm(t.lon, t.lat, a, b));
    const n = vnoise(t.c * 0.3, t.r * 0.3, 7), f = vnoise(t.c * 0.45 + 40, t.r * 0.45, 13);
    const inR = k => regions[k].some(P => inPoly(t.lon, t.lat, P));
    const hi = inR('highland');
    if (d < 55 + n * 45 || (hi && n > 0.35)) t.terrain = 'mount';
    else if (d < 140 + n * 70 || hi) t.terrain = 'hill';
    else if (t.lat > 66 || t.lat < -50) t.terrain = 'tundra';
    else if (inR('desert')) t.terrain = 'desert';
    else if (inR('jungle')) t.terrain = 'jungle';
    else if (t.lat > 50 && f > 0.35) t.terrain = 'forest';
    else if (f > 0.7) t.terrain = 'forest';
    else t.terrain = 'plain';
  }

  // nation of each land tile: BFS over land from pinned tiles, cities and anchors
  const q = [], seen = new Uint8Array(W.N);
  const push = i => { if (!seen[i]) { seen[i] = 1; q.push(i); } };
  for (const cy of W.cities) push(cy.tile);
  for (const [nat, lon, lat] of ANCHORS) {
    const [c, r] = lonLatToCR(lon, lat); const j = tileIdx(c, r);
    if (j >= 0 && T[j].land && !T[j].nat) { T[j].nat = nat; push(j); }
  }
  for (const t of T) if (t.land && t.nat) push(t.i);
  for (let h = 0; h < q.length; h++) {
    const t = T[q[h]];
    for (const k of t.nb) if (T[k].land && !T[k].nat) { T[k].nat = t.nat; push(k); }
  }
  const via = new Array(W.N).fill(null), q2 = [];
  for (const t of T) if (t.land && t.nat) { via[t.i] = t.nat; q2.push(t.i); }
  for (let h = 0; h < q2.length; h++) for (const k of T[q2[h]].nb) if (!via[k]) { via[k] = via[q2[h]]; q2.push(k); }
  for (const t of T) if (t.land && !t.nat) t.nat = via[t.i];

  // home city: nearest city of the same nation along same-nation land
  const q3 = [];
  for (const cy of W.cities) { T[cy.tile].home = cy.id; q3.push(cy.tile); }
  for (let h = 0; h < q3.length; h++) {
    const t = T[q3[h]];
    for (const k of t.nb) { const u = T[k]; if (u.land && u.home < 0 && u.nat === t.nat) { u.home = t.home; q3.push(k); } }
  }
  for (const t of T) {
    if (!t.land || t.home >= 0) continue;
    let best = -1, bd = INF;
    for (const cy of W.cities) { if (cy.nat !== t.nat) continue; const d = hexDist(t.i, cy.tile); if (d < bd) { bd = d; best = cy.id; } }
    if (best < 0) for (const cy of W.cities) { const d = hexDist(t.i, cy.tile); if (d < bd) { bd = d; best = cy.id; } }
    t.home = best;
  }
  OG = new Int32Array(W.N).fill(-1);
  OS = new Int32Array(W.N).fill(-1);
  LAND_IDX = T.filter(t => t.land).map(t => t.i);
}

// ---------- relations ----------
const PKT = {};
function pk(a, b) { let m = PKT[a]; if (!m) m = PKT[a] = {}; let k = m[b]; if (k === undefined) k = m[b] = a < b ? a + '|' + b : b + '|' + a; return k; }
const atWar = (a, b) => a !== b && !!G.war[pk(a, b)];
function allied(a, b) {
  if (a === b) return true;
  if (G.ally[pk(a, b)]) return true;
  if (G.vassal[a] === b || G.vassal[b] === a) return true;
  if (G.flags.coalition && a !== G.player && b !== G.player) return true;
  return false;
}
const friendly = (a, b) => a === b || allied(a, b);
const rel = (a, b) => G.rel[pk(a, b)] ?? 0;
function addRel(a, b, d) { if (a === b) return; const k = pk(a, b); G.rel[k] = clamp((G.rel[k] ?? 0) + d, -100, 100); }
function enemiesOf(n) { const out = []; for (const o of NATION_IDS) if (atWar(n, o)) out.push(o); return out; }
function activeNations() { return NATION_IDS.filter(n => G.nations[n].alive && !G.nations[n].capitulated); }
const has = (n, tech) => G.nations[n].techs.includes(tech);
const hasTrait = (n, t) => (NATIONS[n].traits || []).includes(t) && !(t === 'peace_const' && G.nations[n].flags.noPeaceConst);
const nName = n => NATIONS[n].short;
const flag = (n, f) => { const v = G.nations[n].flags[f]; return v === true || (typeof v === 'number' && v >= G.turn); };

// ---------- units ----------
function reindex() {
  OG.fill(-1); OS.fill(-1); uById.clear();
  for (const u of G.units) {
    uById.set(u.id, u);
    const dom = CLASSES[u.t].dom;
    if (dom === 'air') continue;
    if (dom === 'sea') OS[u.pos] = u.id; else OG[u.pos] = u.id;
  }
}
const groundAt = i => OG[i] >= 0 ? uById.get(OG[i]) : null;
const shipAt = i => OS[i] >= 0 ? uById.get(OS[i]) : null;
function airAt(i) { return G.units.filter(u => u.pos === i && CLASSES[u.t].dom === 'air'); }
function cityAirCount(i) { let k = 0; for (const u of G.units) if (u.pos === i && !u.carrier && CLASSES[u.t].dom === 'air') k++; return k; }
function carrierAirCount(cvId) { let k = 0; for (const u of G.units) if (u.carrier === cvId) k++; return k; }
function tileOwner(i) { const t = W.tiles[i]; return t.home >= 0 ? G.cities[t.home].owner : null; }
function dsg(u) { return DESIGNS[u.d] || DESIGNS_BY_CLASS[u.t][0]; }
function bestDesign(n, cls) {
  const N = G && G.nations[n];
  let best = null;
  for (const d of DESIGNS_BY_CLASS[cls]) {
    if (!d.nations) continue;
    if (!d.nations.includes(n) && !(N && N.bought.includes(d.id))) continue;
    if (d.req && N && !has(n, d.req)) continue;
    if (!best || d.q > best.q) best = d;
  }
  return best || DESIGNS_BY_CLASS[cls].find(d => !d.nations);
}
function unitKm(u) { return dsg(u).km || CLASSES[u.t].km || 0; }
function isStealthAir(u) { return !!dsg(u).stealth; }
function mvMax(u) { return CLASSES[u.t].mv + (u.t === 'ss' && has(u.n, 'aip') ? 1 : 0); }
function addUnit(n, t, pos, fresh = true, carrier = null) {
  const d = bestDesign(n, t);
  const u = { id: G.nextId++, t, d: d.id, n, pos, hp: 100, mv: 0, acted: fresh, moved: fresh, fort: 0, xp: 0, emb: false, icp: false, carrier };
  if (!fresh) u.mv = mvMax(u);
  G.units.push(u); uById.set(u.id, u);
  const dom = CLASSES[t].dom;
  if (dom === 'sea') OS[pos] = u.id; else if (dom === 'land') { OG[pos] = u.id; u.emb = !W.tiles[pos].land; }
  return u;
}
function removeUnit(u) {
  const k = G.units.indexOf(u);
  if (k >= 0) G.units.splice(k, 1);
  uById.delete(u.id);
  if (OS[u.pos] === u.id) OS[u.pos] = -1;
  if (OG[u.pos] === u.id) OG[u.pos] = -1;
}
function placeUnitAt(u, j) {
  if (OS[u.pos] === u.id) OS[u.pos] = -1;
  if (OG[u.pos] === u.id) OG[u.pos] = -1;
  u.pos = j;
  const dom = CLASSES[u.t].dom;
  if (dom === 'sea') { OS[j] = u.id; if (u.t === 'cv') for (const a of G.units) if (a.carrier === u.id) a.pos = j; }
  else if (dom === 'land') { OG[j] = u.id; u.emb = !W.tiles[j].land; }
}
function freeSlotNear(n, tile, dom, maxR = 3) {
  if (dom === 'air') return (W.tiles[tile].city >= 0 && cityAirCount(tile) < 4) ? tile : -1;
  const cand = tilesWithin(tile, maxR).sort((a, b) => hexDist(tile, a) - hexDist(tile, b));
  for (const j of cand) {
    const t = W.tiles[j];
    if (dom === 'land') { if (t.land && OG[j] < 0 && friendly(n, tileOwner(j))) return j; }
    else {
      if (!t.land && OG[j] < 0 && OS[j] < 0) return j;
      if (t.city >= 0 && W.cities[t.city].port && OS[j] < 0 && friendly(n, tileOwner(j))) return j;
    }
  }
  return -1;
}

// ---------- scenarios ----------
const NATO = ['USA', 'GBR', 'FRA', 'DEU', 'ITA', 'POL', 'CAN', 'TUR', 'ESP', 'PRT', 'NLD', 'BEL', 'CZE', 'HUN', 'LTU', 'LVA', 'EST', 'FIN', 'SWE', 'NOR', 'DNK', 'ISL', 'ROU', 'BGR', 'GRC'];
const BASE_ALLIANCES = (() => {
  const a = [];
  for (let i = 0; i < NATO.length; i++) for (let j = i + 1; j < NATO.length; j++) a.push([NATO[i], NATO[j]]);
  return a.concat([['USA', 'KOR'], ['USA', 'JPN'], ['USA', 'AUS'], ['USA', 'PHL'], ['AUS', 'NZL'], ['CHN', 'PRK'], ['RUS', 'PRK'], ['RUS', 'BLR'], ['RUS', 'KAZ']]);
})();
const BASE_RELATIONS = {
  'KOR|PRK': -65, 'CHN|TWN': -60, 'IND|PAK': -55, 'IRN|ISR': -85, 'ISR|LBN': -70, 'ISR|SYR': -60, 'ISR|YEM': -70, 'IRN|SAU': -40, 'IRN|USA': -70, 'PRK|USA': -75, 'RUS|USA': -55,
  'CHN|USA': -35, 'CHN|JPN': -30, 'JPN|KOR': 25, 'CHN|IND': -30, 'CHN|VNM': -15, 'ARM|AZE': -55, 'GRC|TUR': -15, 'POL|RUS': -65, 'RUS|UKR': -90, 'CHN|RUS': 60, 'CHN|PAK': 80,
  'IRN|RUS': 55, 'PRK|RUS': 60, 'ISR|USA': 80, 'TWN|USA': 55, 'JPN|TWN': 40, 'KOR|TWN': 20, 'UKR|USA': 55, 'GBR|UKR': 60, 'POL|UKR': 60, 'DEU|UKR': 50, 'FRA|UKR': 50,
  'IND|RUS': 40, 'IND|USA': 30, 'SAU|USA': 40, 'EGY|USA': 30, 'CHN|PHL': -35, 'JPN|PRK': -60, 'ARG|GBR': -30, 'CUB|USA': -50, 'USA|VEN': -50, 'KOR|POL': 45, 'IRN|YEM': 70, 'IRN|LBN': 70, 'IRN|SYR': 40, 'CHN|KOR': -10, 'JPN|RUS': -35, 'KOR|RUS': -20,
};
const SCENARIOS = [
  { id: 'dictator', name: '독재자의 길', year: 2027, month: 1, wars: [['RUS', 'UKR']],
    blurb: '현재의 세계 질서에서 출발하는 샌드박스. 칙령·숙청·선전으로 권력을 다지고, 원하는 순간 원하는 상대에게 전쟁을 선포하라. 평판이 무너지면 세계가 연합해 맞선다.' },
  { id: 'korea', name: '2027 한반도 위기', year: 2027, month: 3, wars: [['RUS', 'UKR'], ['PRK', 'KOR'], ['PRK', 'USA']], firstStrike: 'PRK',
    blurb: '북한의 기습 남침. 한미 연합군이 반격하고, 북한이 무너지면 중국이 개입한다. 러시아는 우크라이나에 묶여 있다.' },
  { id: 'ww3', name: '제3차 세계대전', year: 2029, month: 6, blocs: true,
    blurb: '대만해협 봉쇄를 계기로 NATO·인도태평양 동맹과 중·러·북·이란 축이 전면전에 돌입한다. 튀르키예·인도·사우디 등은 중립을 지킨다.' },
  { id: 'world', name: '세계를 적으로', year: 2030, month: 1, worldVsPlayer: true,
    blurb: '당신의 정권을 제외한 모든 나라가 연합해 선전포고했다. 세계 정복 아니면 파멸. 시작 예산 3배, 인력 2배.' },
];

// ---------- new game ----------
function hasTraitRaw(n, t) { return (NATIONS[n].traits || []).includes(t); }
function initFactions(n) {
  const gov = G && G.nations[n] ? G.nations[n].gov : NATIONS[n].gov;
  const f = { army: 55, sec: 55, party: 55, biz: 55, people: 55 };
  if (gov === 'oneparty') Object.assign(f, { party: 70, sec: 65, people: 50 });
  if (gov === 'monarchy') Object.assign(f, { party: 72, biz: 65 });
  if (gov === 'theocracy') Object.assign(f, { party: 68, sec: 66, people: 42 });
  if (gov === 'junta') Object.assign(f, { army: 70, people: 45 });
  if (gov === 'authoritarian') Object.assign(f, { sec: 62, biz: 50 });
  if (hasTraitRaw(n, 'songun')) f.army += 12;
  if (n === 'RUS') f.biz = 45;
  if (n === 'PRK') f.people = 42;
  return f;
}
function newGame(scenId, player, opts = {}) {
  const sc = SCENARIOS.find(s => s.id === scenId);
  G = {
    v: 2, turn: 1, maxTurn: opts.maxTurn || 120, year: sc.year, month: sc.month, scen: sc.id, player, fog: opts.fog !== false, diff: opts.diff || 'normal',
    leader: { name: opts.leaderName || '지도자', title: opts.leaderTitle || NATIONS[player].leader },
    nations: {}, cities: W.cities.map(c => ({ owner: c.occ || c.nat, hp: 100, pop: c.pop, ind: c.ind, fort: c.cap ? 1 : 0, factory: 0, sam: c.cap ? 1 : 0, rec: 0 })),
    units: [], nextId: 1, war: {}, ally: {}, rel: {}, truce: {}, vassal: {}, sanc: {}, fallout: {}, transit: [], doom: 89,
    log: [], over: null, won: [], flags: {}, pending: [], hist: [], nukeLog: [], cabinet: {}, cand: {}, queue: [], nextPid: 1, report: null,
  };
  for (const id of NATION_IDS) {
    const N = NATIONS[id], gov = N.gov;
    const capital = W.cities.find(c => c.nat === id && c.cap);
    G.nations[id] = {
      id, alive: true, money: N.money, manpower: N.manpower, fuel: 40, stab: N.stab, techs: N.techs.slice(), research: null, progress: {}, rd: 0.2,
      capital: capital ? capital.id : -1, capitulated: false, incomeMult: 1, cyberCd: 0, aidCd: 0, diploCd: {}, opsCd: {}, losses: 0, kills: 0, taken: 0, lost: 0, tTaken: 0, tLost: 0,
      arsenal: { ...(ARSENALS[id] || {}) }, nukes: N.nukes || 0, gov, fac: null, power: { democracy: 25, authoritarian: 55, oneparty: 70, monarchy: 65, theocracy: 60, junta: 60 }[gov],
      rep: ({ PRK: -70, IRN: -50, RUS: -45, CHN: -10, BLR: -40, SYR: -40, AFG: -50, MMR: -35, YEM: -40, VEN: -30, CUB: -20 })[id] ?? (gov === 'democracy' ? 30 : 5),
      flags: {}, cd: {}, bought: [], intel: {}, nextElection: gov === 'democracy' ? 18 + Math.floor(Math.random() * 18) : 0,
      last: { gross: 0, upkeep: 0, net: 0, fuel: 0, mp: 0, rp: 0, blockaded: 0, ports: 0, sanc: 0, oilx: 0, tribute: 0 },
    };
    G.nations[id].fac = initFactions(id);
  }
  const P = G.nations[player];
  P.slush = 0; P.skim = 0;
  initCabinet(player);
  if (sc.worldVsPlayer) { P.money *= 3; P.manpower *= 2; G.flags.coalition = true; }
  if (!sc.worldVsPlayer) for (const [a, b] of BASE_ALLIANCES) G.ally[pk(a, b)] = 1;
  for (const a of NATION_IDS) for (const b of NATION_IDS) if (a < b) {
    const A = NATIONS[a], B = NATIONS[b];
    G.rel[pk(a, b)] = G.ally[pk(a, b)] ? 70 : A.bloc === B.bloc && A.bloc !== 'nonaligned' ? 25 : (A.bloc === 'west' && B.bloc === 'east') || (A.bloc === 'east' && B.bloc === 'west') ? -30 : 0;
  }
  Object.assign(G.rel, BASE_RELATIONS);
  const war = (a, b) => { if (a !== b) { G.war[pk(a, b)] = 1; delete G.ally[pk(a, b)]; G.rel[pk(a, b)] = Math.min(G.rel[pk(a, b)] ?? 0, -70); } };
  if (sc.wars) for (const [a, b] of sc.wars) war(a, b);
  if (sc.blocs) {
    const west = ['USA', 'GBR', 'FRA', 'DEU', 'ITA', 'POL', 'CAN', 'JPN', 'KOR', 'AUS', 'TWN', 'UKR', 'ISR', 'PHL', 'NZL', ...NATO.filter(x => !MAJOR_IDS.includes(x))];
    const east = ['CHN', 'RUS', 'PRK', 'IRN', 'BLR', 'YEM', 'LBN'];
    for (const a of west) for (const b of east) war(a, b);
    for (let i = 0; i < east.length; i++) for (let j = i + 1; j < east.length; j++) G.ally[pk(east[i], east[j])] = 1;
    for (const a of ['JPN', 'KOR', 'AUS', 'TWN', 'UKR', 'ISR']) for (const b of west) if (a !== b) G.ally[pk(a, b)] = 1;
  }
  if (sc.worldVsPlayer) for (const o of NATION_IDS) if (o !== player) war(player, o);
  reindex();
  if (sc.worldVsPlayer) for (const cy of W.cities) if (cy.nat === player) G.cities[cy.id].fort = Math.max(G.cities[cy.id].fort, 2);
  for (const cy of W.cities) if (cy.nat === 'UKR' && G.cities[cy.id].owner === 'UKR') G.cities[cy.id].fort = 2;
  deployForces();
  if (sc.worldVsPlayer) { const F = NATIONS[player].forces; NATIONS[player].forces = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, Math.ceil(v * 0.6)])); deployForces(player); NATIONS[player].forces = F; }
  if (G.diff === 'hard') for (const id of NATION_IDS) if (id !== player) G.nations[id].money = Math.round(G.nations[id].money * 1.4);
  if (G.diff === 'easy') { P.money += 200; P.manpower += 100; }
  for (const id of NATION_IDS) pickResearch(id);
  G.flags.firstStrike = sc.firstStrike || null;
  cache.supply = {}; cache.comp = {};
  logMsg(`${sc.name} — ${G.year}년 ${G.month}월. ${G.leader.title} ${G.leader.name}이(가) ${NATIONS[player].name}의 권좌에 올랐습니다.`, 'sys');
  snapshotHist();
  return G;
}
function deployForces(only) {
  for (const n of only ? [only] : NATION_IDS) {
    const F = NATIONS[n].forces || {};
    const cities = citiesOf(n);
    if (!cities.length) continue;
    const rivals = new Set(NATION_IDS.filter(o => o !== n && (rel(n, o) <= -30 || atWar(n, o))));
    const front = cy => rivals.size && tilesWithin(cy.tile, 5).some(j => rivals.has(tileOwner(j)));
    const slots = cities.map(cy => ({ cy, w: G.cities[cy.id].pop + (front(cy) ? 10 : 0) + (cy.cap ? 5 : 0), k: 0 }));
    const ports = cities.filter(c => c.port).sort((a, b) => G.cities[b.id].pop - G.cities[a.id].pop);
    const byPop = cities.slice().sort((a, b) => (b.cap - a.cap) || (G.cities[b.id].pop - G.cities[a.id].pop));
    for (const cls of CLASS_ORDER) {
      const count = F[cls] || 0, dom = CLASSES[cls].dom;
      for (let k = 0; k < count; k++) {
        if (dom === 'land') {
          slots.sort((a, b) => b.w / (b.k + 1) - a.w / (a.k + 1));
          const s = slots[0]; s.k++;
          const j = freeSlotNear(n, s.cy.tile, 'land', 4);
          if (j >= 0) addUnit(n, cls, j, false);
        } else if (dom === 'air') {
          const cy = byPop.find(c => cityAirCount(c.tile) < 4);
          if (cy) addUnit(n, cls, cy.tile, false);
        } else if (ports.length) {
          const cy = ports[k % ports.length];
          const j = freeSlotNear(n, cy.tile, 'sea', 4);
          if (j >= 0) {
            const u = addUnit(n, cls, j, false);
            if (cls === 'cv') for (let a = 0; a < 2; a++) addUnit(n, 'ftr', j, false, u.id);
          }
        }
      }
    }
  }
}
function serialize() { return JSON.parse(JSON.stringify(G)); }
function loadGame(obj) {
  G = obj;
  G.cabinet ||= {}; G.cand ||= {}; G.queue ||= []; G.nextPid ||= 1;
  const P0 = G.nations[G.player]; P0.slush ||= 0; P0.skim ||= 0;
  if (!Object.keys(G.cabinet).length) initCabinet(G.player);
  reindex(); cache.supply = {}; cache.comp = {};
}
function logMsg(text, kind = 'info', who = null) {
  G.log.push({ t: G.turn, text, kind, who });
  if (G.log.length > 500) G.log.splice(0, G.log.length - 500);
  Hooks.log(text, kind, who);
}
function curMonth(turn = G.turn) { return ((G.month - 1 + (turn - 1)) % 12) + 1; }
function dateLabel(turn = G.turn) { const m0 = G.month - 1 + (turn - 1); return `${G.year + Math.floor(m0 / 12)}년 ${(m0 % 12) + 1}월`; }

// ---------- supply, connectivity, vision ----------
function friendMemo(n) { const m = {}; return o => { if (o == null) return false; let v = m[o]; if (v === undefined) v = m[o] = friendly(n, o); return v; }; }
function supplyMap(n) {
  if (cache.supply[n]) return cache.supply[n];
  const m = new Uint8Array(W.N), fr = friendMemo(n);
  const R = 4 + (has(n, 'logi') ? 2 : 0);
  for (const cy of W.cities) if (fr(G.cities[cy.id].owner)) for (const j of tilesWithin(cy.tile, R)) m[j] = 1;
  for (const i of LAND_IDX) if (fr(tileOwner(i))) m[i] = 1;
  return (cache.supply[n] = m);
}
function supplied(u) {
  if (CLASSES[u.t].dom !== 'land' || u.emb) return true;
  return !!supplyMap(u.n)[u.pos];
}
function compMap(n) {
  if (cache.comp[n]) return cache.comp[n];
  const m = new Int32Array(W.N).fill(-1), fr = friendMemo(n);
  let id = 0;
  for (const i of LAND_IDX) {
    if (m[i] >= 0 || !fr(tileOwner(i))) continue;
    const q = [i]; m[i] = id;
    for (let h = 0; h < q.length; h++) for (const k of W.tiles[q[h]].nb) if (m[k] < 0 && W.tiles[k].land && fr(tileOwner(k))) { m[k] = id; q.push(k); }
    id++;
  }
  return (cache.comp[n] = m);
}
function sharesIntel(a, b) { return friendly(a, b) || (hasTrait(a, 'five_eyes') && hasTrait(b, 'five_eyes')); }
function visionFor(n) {
  const v = new Uint8Array(W.N);
  const mark = (i, r) => { for (const j of tilesWithin(i, r)) v[j] = 1; };
  for (const u of G.units) {
    if (!sharesIntel(n, u.n)) continue;
    const C = CLASSES[u.t];
    mark(u.pos, C.dom === 'air' ? 3 : C.vis + (u.t === 'sof' && has(u.n, 'sof2') ? 1 : 0));
  }
  for (const cy of W.cities) {
    const o = G.cities[cy.id].owner;
    if (sharesIntel(n, o)) mark(cy.tile, 2);
    else if (has(n, 'satellite') && !flag(n, 'blinded') && (atWar(n, o) || NATIONS[o].tier === 'major')) mark(cy.tile, 1);
  }
  for (const [t, until] of Object.entries(G.nations[n].intel)) {
    if (until < G.turn) continue;
    for (const u of G.units) if (u.n === t) v[u.pos] = 1;
  }
  return v;
}
function unitVisible(u, n, vis) {
  if (sharesIntel(n, u.n)) return true;
  if (!vis[u.pos]) return false;
  if (CLASSES[u.t].stealth && !((G.nations[n].intel[u.n] ?? -1) >= G.turn)) {
    return G.units.some(o => sharesIntel(n, o.n) && CLASSES[o.t].dom !== 'air' && (hexDist(o.pos, u.pos) <= 1 || (o.t === 'dd' && hexDist(o.pos, u.pos) <= 2)));
  }
  return true;
}

// ---------- movement ----------
function enemyBlocks(u, j) {
  const g = groundAt(j), s = shipAt(j);
  return (g && !friendly(u.n, g.n)) || (s && !friendly(u.n, s.n));
}
function zocAt(n, j) {
  for (const k of W.tiles[j].nb) { const g = groundAt(k); if (g && !g.emb && atWar(n, g.n)) return true; }
  return false;
}
function stepCost(u, from, to) {
  const C = CLASSES[u.t], t = W.tiles[to];
  if (C.dom === 'sea') {
    if (!t.land) return 1;
    if (t.city < 0 || !W.cities[t.city].port) return INF;
    return friendly(u.n, tileOwner(to)) ? 1 : INF;
  }
  if (!t.land) {
    if (u.emb) return 1;
    const f = W.tiles[from];
    const port = f.city >= 0 && W.cities[f.city].port && friendly(u.n, tileOwner(from));
    const lhd = f.coast && G.units.some(s => s.t === 'lhd' && friendly(u.n, s.n) && hexDist(s.pos, from) <= 1);
    return (port || lhd) ? -1 : INF;
  }
  const o = tileOwner(to);
  if (o && !friendly(u.n, o) && !atWar(u.n, o)) return INF;
  if (t.city >= 0 && !friendly(u.n, o)) return INF;
  if (u.emb) return -1;
  if (t.city >= 0) return 0.5;
  let c = TERRAIN_KIND[t.terrain].cost;
  if (t.terrain === 'tundra' && hasTrait(u.n, 'arctic')) c = 1;
  if (C.climber) c = t.terrain === 'mount' ? 2 : 1;
  if (friendly(u.n, o) && friendly(u.n, tileOwner(from))) c = Math.max(0.5, c / 2); // roads & rail at home
  return c;
}
function reachable(u) {
  const res = new Map();
  if (u.mv <= 0 || CLASSES[u.t].dom === 'air' || u.transit) return res;
  const C = CLASSES[u.t];
  res.set(u.pos, { left: u.mv, prev: -1, stop: false });
  const open = [u.pos];
  while (open.length) {
    let bi = 0;
    for (let k = 1; k < open.length; k++) if (res.get(open[k]).left > res.get(open[bi]).left) bi = k;
    const cur = open.splice(bi, 1)[0];
    const cr = res.get(cur);
    if (cr.stop || cr.left <= 0) continue;
    for (const j of W.tiles[cur].nb) {
      if (enemyBlocks(u, j)) continue;
      const c = stepCost(u, cur, j);
      if (c >= INF) continue;
      let left = c < 0 ? 0 : Math.max(0, cr.left - c), stop = c < 0;
      if (C.dom === 'land' && W.tiles[j].land && !C.noZoc && zocAt(u.n, j)) { left = 0; stop = true; }
      const ex = res.get(j);
      if (!ex || left > ex.left) { res.set(j, { left, prev: cur, stop }); open.push(j); }
    }
  }
  return res;
}
function canEnd(u, j) {
  if (j === u.pos) return true;
  const dom = CLASSES[u.t].dom, t = W.tiles[j];
  if (dom === 'sea') return OS[j] < 0 && (t.land || OG[j] < 0);
  if (t.land) return OG[j] < 0;
  return OG[j] < 0 && OS[j] < 0;
}
function pathTo(reach, j) { const p = []; for (let k = j; k >= 0; k = reach.get(k).prev) p.unshift(k); return p; }
function moveUnit(u, j, reach) {
  reach = reach || reachable(u);
  const r = reach.get(j);
  if (!r || !canEnd(u, j)) return false;
  const path = pathTo(reach, j);
  placeUnitAt(u, j);
  u.mv = r.left; u.moved = true; u.fort = 0;
  Hooks.fx({ k: 'move', u: u.id, path });
  return true;
}

// ---------- combat ----------
const vet = u => Math.min(3, Math.floor(u.xp / 3));
function morale(n) { return 0.8 + 0.4 * G.nations[n].stab / 100 + 0.02 * mSkill(n, 'chief'); }
function homeDefense(u) {
  const t = W.tiles[u.pos];
  if (t.nat !== u.n || tileOwner(u.pos) !== u.n) return 1;
  let m = 1;
  if (hasTrait(u.n, 'porcupine')) m *= 1.2;
  if (hasTrait(u.n, 'eastern_wall')) m *= 1.15;
  if (hasTrait(u.n, 'unyielding')) m *= 1.4;
  if (hasTrait(u.n, 'peace_const')) m *= 1.1;
  return m;
}
function unitStr(u, role, vs) {
  const C = CLASSES[u.t], d = dsg(u), n = u.n, dom = C.dom;
  let s = (role === 'atk' ? C.atk : C.def) * d.q;
  if (hasTrait(n, 'precision')) s *= 1.05;
  if (role === 'atk' && dom !== 'air') s *= 1 + 0.02 * mSkill(n, 'defense');
  if (role === 'atk' && n === G.player && G.cabinet.chief?.trait === 'strategist') s *= 1.05;
  if (dom === 'sea' && (hasTrait(n, 'royal_navy') || hasTrait(n, 'hegemon_navy'))) s *= 1.1;
  if (u.t === 'mbt' && role === 'atk' && has(n, 'mbt35')) s *= 1.1;
  if (u.t === 'mbt' && role === 'def' && has(n, 'mbt4')) s *= 1.15;
  if (dom === 'land' && has(n, 'ncw')) s *= 1.1;
  if (has(n, 'ai_c2')) s *= 1.05;
  if ((u.t === 'inf' || u.t === 'mech') && role === 'def' && has(n, 'robot')) s *= 1.15;
  if (u.t === 'sof' && role === 'atk' && has(n, 'sof2')) s *= 1.3;
  if (u.t === 'ftr' && role === 'atk' && has(n, 'gen45')) s *= 1.1;
  if (u.t === 'uav') { if (has(n, 'swarm')) s *= 1.3; if (hasTrait(n, 'drone_power')) s *= 1.2; }
  if (u.t === 'dd' && role === 'def' && has(n, 'aegis')) s *= 1.2;
  if (u.t === 'ss' && role === 'atk' && has(n, 'aip')) s *= 1.2;
  if (u.t === 'shorad' && has(n, 'laser')) s *= 1.4;
  if (vs) {
    const V = CLASSES[vs.t];
    if ((u.t === 'ss' || u.t === 'ssn') && V.dom === 'sea') s *= 1.3;
    if (u.t === 'shorad' && V.dom === 'air') s *= 3;
    if (u.t === 'sam' && V.dom === 'air') s *= 2.5;
    if (dom === 'sea' && vs.emb) s *= 1.5;
    if (vs.t === 'uav' && role === 'def' && has(n, 'ew')) s *= 1.3;
  }
  if (u.emb) s = role === 'def' ? (G.units.some(l => l.t === 'lhd' && friendly(n, l.n) && hexDist(l.pos, u.pos) <= 1) ? 10 : 4) : s * (C.amphib || has(n, 'amphib') ? 1 : 0.6);
  s *= 0.55 + 0.45 * u.hp / 100;
  s *= 1 + 0.1 * vet(u);
  s *= morale(n);
  if (flag(n, 'purgeArmy')) s *= 0.88;
  if (!supplied(u)) s *= 0.7;
  if (C.fuel > 0 && G.nations[n].fuel <= 0) s *= 0.7;
  if (role === 'def' && dom === 'land' && !u.emb) {
    const t = W.tiles[u.pos];
    if (t.city >= 0) s *= 1.25 + 0.15 * G.cities[t.city].fort * (hasTrait(n, 'tunnels') ? 1.5 : 1);
    else {
      s *= TERRAIN_KIND[t.terrain].def;
      if (hasTrait(n, 'guerrilla') && (t.terrain === 'jungle' || t.terrain === 'forest')) s *= 1.25;
    }
    if (u.fort > 0) s *= 1.2;
    s *= homeDefense(u);
  }
  return Math.max(0.5, s);
}
function cityStr(ci) {
  const c = G.cities[ci];
  const tunnels = hasTrait(c.owner, 'tunnels') ? 1.5 : 1;
  return Math.max(1, (8 + c.pop * 1.4 + c.fort * 6 * tunnels) * (0.4 + 0.6 * c.hp / 100) * morale(c.owner));
}
function flank(n, j, exceptId) {
  let k = 0;
  for (const nb of W.tiles[j].nb) { const g = groundAt(nb); if (g && g.id !== exceptId && g.n === n && !g.emb) k++; }
  return 1 + 0.1 * Math.min(3, k);
}
// Combined arms: friendly artillery/rocket brigades in range of the target lay down preparatory fire
function supportBonus(n, j) {
  for (const k of tilesWithin(j, 3)) { const g = groundAt(k); if (g && g.n === n && (g.t === 'spg' || g.t === 'mlrs') && hexDist(k, j) <= CLASSES[g.t].rng) return 1.1; }
  return 1;
}
function dmgPair(A, D, ranged) { const r = A / D; return { def: clamp(30 * Math.pow(r, 1.15), 2, 100), att: ranged ? 0 : clamp(30 * Math.pow(1 / r, 1.15), 1, 100) }; }
function isRanged(u) { return CLASSES[u.t].rng > 0; }
function targetAt(u, j) {
  const C = CLASSES[u.t], t = W.tiles[j];
  const g = groundAt(j), s = shipAt(j);
  const hostile = x => x && atWar(u.n, x.n);
  const ci = t.city;
  const cityHostile = ci >= 0 && atWar(u.n, G.cities[ci].owner);
  if (C.dom === 'land' && !isRanged(u)) {
    if (!t.land) return null;
    if (hostile(g)) return { unit: g, city: cityHostile ? ci : -1 };
    return cityHostile ? { unit: null, city: ci } : null;
  }
  if (u.t === 'ss' || u.t === 'ssn') {
    if (hostile(s)) return { unit: s, city: -1 };
    if (hostile(g) && g.emb) return { unit: g, city: -1 };
    return null;
  }
  if (C.dom === 'sea' && u.t !== 'dd') return null;
  if (hostile(g)) return { unit: g, city: cityHostile ? ci : -1 };
  if (hostile(s)) return { unit: s, city: -1 };
  return cityHostile ? { unit: null, city: ci } : null;
}
function attackRange(u) { const C = CLASSES[u.t]; return C.dom === 'air' ? 0 : C.rng > 0 ? C.rng : 1; }
function canAttackFrom(u) {
  if (u.acted || u.transit) return false;
  if (CLASSES[u.t].dom === 'air') return u.hp > 15;
  if (u.t === 'ssbn' || u.t === 'cv' || u.t === 'lhd' || u.t === 'sam') return false;
  return u.mv > 0;
}
function enemyTiles(n) {
  const s = new Set();
  for (const u of G.units) if (CLASSES[u.t].dom !== 'air' && atWar(n, u.n)) s.add(u.pos);
  for (const cy of W.cities) if (atWar(n, G.cities[cy.id].owner)) s.add(cy.tile);
  return s;
}
function attackTargets(u, from = u.pos, vis = null, eTiles = null) {
  if (!canAttackFrom(u)) return [];
  const out = [];
  const ok = j => {
    const tg = targetAt(u, j);
    if (!tg) return false;
    if (vis && tg.unit && !unitVisible(tg.unit, u.n, vis)) return false;
    if (vis && !tg.unit && !vis[j]) return false;
    return true;
  };
  if (CLASSES[u.t].dom === 'air') {
    const km = unitKm(u);
    for (const j of eTiles || enemyTiles(u.n)) if (kmDist(from, j) <= km && ok(j)) out.push(j);
    return out;
  }
  for (const j of tilesWithin(from, attackRange(u))) if (j !== from && ok(j)) out.push(j);
  return out;
}
function interceptors(att, j) {
  const aas = [];
  let ftr = null;
  for (const o of G.units) {
    if (!atWar(att.n, o.n)) continue;
    if (o.t === 'shorad' && hexDist(o.pos, j) <= 2) aas.push(o);
    else if (o.t === 'sam' && hexDist(o.pos, j) <= 3) aas.push(o);
    else if (o.t === 'ftr' && !o.icp && o.hp > 30 && kmDist(o.pos, j) <= unitKm(o) && (!ftr || unitStr(o, 'atk') > unitStr(ftr, 'atk'))) ftr = o;
  }
  aas.sort((a, b) => dsg(b).q - dsg(a).q); aas.length = Math.min(aas.length, 2);
  const ci = W.tiles[j].city;
  const sam = ci >= 0 && atWar(att.n, G.cities[ci].owner) ? G.cities[ci].sam : 0;
  return { aas, ftr, sam };
}
function aaDamage(a) { return (a.t === 'sam' ? 18 : 12) * dsg(a).q * (a.hp / 100) * (a.t === 'shorad' && has(a.n, 'laser') ? 1.4 : 1); }
function preview(u, j) {
  const tg = targetAt(u, j);
  if (!tg) return null;
  const C = CLASSES[u.t], ranged = isRanged(u) || C.dom === 'air';
  let pre = 0;
  if (C.dom === 'air') {
    const ic = interceptors(u, j), st = isStealthAir(u) ? 0.5 : 1;
    pre += ic.aas.reduce((s, a) => s + aaDamage(a) * st, 0) + ic.sam * 10 * st;
    if (ic.ftr) pre += dmgPair(unitStr(ic.ftr, 'atk', u), unitStr(u, 'def', ic.ftr), false).def * st;
  }
  const A = unitStr(u, 'atk', tg.unit) * (C.dom === 'land' && !ranged ? flank(u.n, j, u.id) * supportBonus(u.n, j) : 1) * (u.t === 'bmr' && !tg.unit ? 1.5 : 1);
  if (tg.unit) {
    const d = dmgPair(A, unitStr(tg.unit, 'def', u), ranged);
    return { tg, dealt: d.def, taken: d.att + pre, kill: d.def >= tg.unit.hp, city: tg.city, pre };
  }
  const d = dmgPair(A, cityStr(tg.city), ranged);
  return { tg, dealt: d.def, taken: (ranged ? 0 : d.att * 0.7) + pre, kill: false, capture: !ranged && C.dom === 'land' && G.cities[tg.city].hp - d.def <= 0, city: tg.city, pre };
}
function killUnit(u, by, how = '격파') {
  const was = dsg(u).name;
  removeUnit(u);
  if (u.t === 'cv') for (const a of G.units.slice()) if (a.carrier === u.id) removeUnit(a);
  const N = G.nations[u.n]; N.losses++;
  N.stab = clamp(N.stab - (hasTrait(u.n, 'opinion') ? 0.5 : u.n === 'PRK' ? 0.12 : 0.25) * (CLASSES[u.t].cost / 50), 0, 100);
  if (by && G.nations[by]) G.nations[by].kills++;
  logMsg(`[${nName(u.n)}] ${was} ${how}`, 'loss', u.n);
  Hooks.fx({ k: 'boom', i: u.pos });
}
function doAttack(u, j) {
  const tg = targetAt(u, j);
  if (!tg || !canAttackFrom(u)) return null;
  const C = CLASSES[u.t], ranged = isRanged(u) || C.dom === 'air';
  const rnd = () => 0.85 + Math.random() * 0.3;
  const out = { dealt: 0, taken: 0, killed: false, died: false, captured: false };
  u.acted = true; u.moved = true; u.fort = 0;
  if (C.dom !== 'air') u.mv = 0;
  Hooks.fx({ k: 'shot', from: u.pos, to: j, dom: C.dom });
  const nm = dsg(u).name;
  if (C.dom === 'air') {
    const ic = interceptors(u, j), st = isStealthAir(u) ? 0.5 : 1;
    for (const a of ic.aas) { const d = Math.round(aaDamage(a) * st * rnd()); u.hp -= d; out.taken += d; }
    if (ic.sam) { const d = Math.round(ic.sam * 10 * st * rnd()); u.hp -= d; out.taken += d; }
    if (ic.ftr && Math.random() < (st < 1 ? 0.5 : 1)) {
      ic.ftr.icp = true;
      const d = dmgPair(unitStr(ic.ftr, 'atk', u), unitStr(u, 'def', ic.ftr), false);
      const a = Math.round(d.def * rnd()), b = Math.round(d.att * 0.8 * rnd());
      u.hp -= a; ic.ftr.hp -= b; out.taken += a;
      logMsg(`[${nName(ic.ftr.n)}] ${dsg(ic.ftr).name} 요격 — 공중전 (${-a} / ${-b})`, 'combat', ic.ftr.n);
      if (ic.ftr.hp <= 0) killUnit(ic.ftr, u.n, '공중전에서 격추');
    }
    if (u.hp <= 0) { killUnit(u, tg.unit ? tg.unit.n : G.cities[tg.city]?.owner, '요격으로 격추'); out.died = true; return out; }
  }
  const A = unitStr(u, 'atk', tg.unit) * (C.dom === 'land' && !ranged ? flank(u.n, j, u.id) * supportBonus(u.n, j) : 1) * (u.t === 'bmr' && !tg.unit ? 1.5 : 1);
  if (tg.unit) {
    const d = tg.unit;
    const dmg = dmgPair(A, unitStr(d, 'def', u), ranged);
    const dd = Math.min(100, Math.round(dmg.def * rnd())), da = Math.min(100, Math.round(dmg.att * rnd()));
    d.hp -= dd; u.hp -= da; out.dealt = dd; out.taken += da;
    if (tg.city >= 0) G.cities[tg.city].hp = Math.max(0, G.cities[tg.city].hp - Math.round(dd * 0.3));
    u.xp++; d.xp++;
    Hooks.fx({ k: 'dmg', i: j, text: `-${dd}` });
    if (da) Hooks.fx({ k: 'dmg', i: u.pos, text: `-${da}` });
    logMsg(`[${nName(u.n)}] ${nm} → [${nName(d.n)}] ${dsg(d).name}${tg.city >= 0 ? ` (${W.cities[tg.city].name})` : ''}: 적 -${dd}${da ? `, 아군 -${da}` : ''}`, 'combat', u.n);
    if (d.hp <= 0) { killUnit(d, u.n); out.killed = true; u.xp += 2; }
    if (u.hp <= 0) { killUnit(u, d.n); out.died = true; return out; }
    if (out.killed && C.dom === 'land' && !ranged && W.tiles[j].land) {
      if (tg.city >= 0) { if (G.cities[tg.city].hp <= 50 && OG[j] < 0) { placeUnitAt(u, j); captureCity(tg.city, u.n); out.captured = true; } }
      else if (OG[j] < 0) placeUnitAt(u, j);
    }
    return out;
  }
  const c = G.cities[tg.city];
  const dmg = dmgPair(A, cityStr(tg.city), ranged);
  const dd = Math.min(100, Math.round(dmg.def * rnd())), da = ranged ? 0 : Math.min(100, Math.round(dmg.att * 0.7 * rnd()));
  c.hp = Math.max(0, c.hp - dd); u.hp -= da; out.dealt = dd; out.taken += da;
  Hooks.fx({ k: 'dmg', i: j, text: `-${dd}` });
  logMsg(`[${nName(u.n)}] ${nm} → ${W.cities[tg.city].name} 공격: 방어력 -${dd}${da ? `, 아군 -${da}` : ''}`, 'combat', u.n);
  u.xp++;
  if (u.hp <= 0) { killUnit(u, c.owner); out.died = true; return out; }
  if (c.hp <= 0 && C.dom === 'land' && !ranged && OG[j] < 0) { placeUnitAt(u, j); captureCity(tg.city, u.n); out.captured = true; }
  return out;
}

// ---------- cities ----------
function citiesOf(n) { return W.cities.filter(c => G.cities[c.id].owner === n); }
function capitalOf(n) { const ci = G.nations[n].capital; return ci >= 0 ? W.cities[ci] : null; }
function captureCity(ci, by) {
  const cy = W.cities[ci], c = G.cities[ci], prev = c.owner;
  let newOwner = by;
  if (cy.nat !== by && allied(by, cy.nat) && G.nations[cy.nat].alive && !G.nations[cy.nat].capitulated && atWar(cy.nat, prev)) newOwner = cy.nat;
  c.owner = newOwner; c.hp = 35; c.pop = Math.max(1, c.pop - 1); c.fort = Math.max(0, c.fort - 1); c.sam = 0; c.rec = 9;
  for (const u of G.units.slice()) if (u.pos === cy.tile && !friendly(newOwner, u.n) && CLASSES[u.t].dom !== 'land' && !u.carrier) killUnit(u, by, '기지 함락으로 손실');
  const P = G.nations[prev], B = G.nations[newOwner];
  const wasCap = P.capital === ci;
  P.stab = clamp(P.stab - (wasCap ? 10 : 3) * (prev === 'PRK' ? 0.6 : 1), 0, 100); P.lost++; P.tLost++;
  B.stab = clamp(B.stab + (cy.nat === newOwner ? 5 : 2), 0, 100); B.taken++; B.tTaken++;
  if (cy.nat !== newOwner) B.rep = clamp(B.rep - 1, -100, 100);
  for (const o of NATION_IDS) if (o !== prev && G.ally[pk(o, prev)]) addRel(o, by, -3);
  logMsg(`${cy.name} 함락 — [${nName(newOwner)}] 점령${newOwner !== by ? ` ([${nName(by)}] 탈환 후 반환)` : ''}${wasCap ? ' · 수도 함락!' : ''}`, 'capture', newOwner);
  Hooks.fx({ k: 'capture', i: cy.tile, n: newOwner });
  if (wasCap) {
    const rest = citiesOf(prev).sort((a, b) => G.cities[b.id].pop - G.cities[a.id].pop);
    P.capital = rest.length ? rest[0].id : -1;
    if (rest.length) logMsg(`[${nName(prev)}] 수도를 ${rest[0].name}(으)로 이전`, 'sys', prev);
  }
  cache.supply = {}; cache.comp = {};
  checkCapitulation(prev, by);
}
function cityRecruitCap(ci) { return G.cities[ci].pop >= 7 ? 2 : 1; }
function unitCost(n, t) {
  let c = CLASSES[t].cost;
  if (hasTrait(n, 'factory_world')) c *= 0.88;
  if (flag(n, 'warEconomy')) c *= 0.8;
  if (t === 'inf' && hasTrait(n, 'peoples_war')) c *= 0.75;
  if (t === 'sof' && (hasTrait(n, 'axis_resist') || hasTrait(n, 'guerrilla'))) c *= 0.7;
  if (t === 'uav' && hasTrait(n, 'drone_power')) c *= 0.6;
  if (t === 'mbt' && hasTrait(n, 'eastern_wall')) c *= 0.85;
  if (t === 'cv' && hasTrait(n, 'hegemon_navy')) c *= 0.8;
  if (n === G.player && G.diff === 'easy') c *= 0.85;
  return Math.round(c);
}
function unitMp(n, t) { return Math.round(CLASSES[t].mp * (has(n, 'robot') && (t === 'inf' || t === 'mech') ? 0.7 : 1)); }
function canRecruitClass(n, t) { const C = CLASSES[t]; return !C.req || has(n, C.req) || (t === 'ssn' && hasTrait(n, 'aukus') && has(n, 'aip')); }
function recruitCheck(n, ci, t) {
  const C = CLASSES[t], N = G.nations[n], c = G.cities[ci], cy = W.cities[ci];
  if (!N.alive || N.capitulated) return { ok: false, why: '행동 불가' };
  const own = c.owner === n || (n === 'USA' && cy.base && allied(n, c.owner));
  if (!own) return { ok: false, why: '자국 도시 아님' };
  if (!canRecruitClass(n, t)) return { ok: false, why: `기술 필요: ${TECH_BY_ID[C.req].name}` };
  if (C.dom === 'sea' && !cy.port) return { ok: false, why: '항구 필요' };
  if (c.rec >= cityRecruitCap(ci)) return { ok: false, why: '이번 턴 편성 한도' };
  const cost = unitCost(n, t);
  if (N.money < cost) return { ok: false, why: '예산 부족' };
  if (N.manpower < unitMp(n, t)) return { ok: false, why: '인력 부족' };
  const slot = freeSlotNear(n, cy.tile, C.dom, C.dom === 'air' ? 0 : 1);
  if (slot < 0) return { ok: false, why: C.dom === 'air' ? '비행장 포화 (최대 4)' : '배치 공간 없음' };
  if (zocAt(n, cy.tile) && c.hp < 30) return { ok: false, why: '도시 포위됨' };
  return { ok: true, slot, cost };
}
function recruit(n, ci, t) {
  const r = recruitCheck(n, ci, t);
  if (!r.ok) return null;
  const N = G.nations[n];
  N.money -= r.cost; N.manpower -= unitMp(n, t); G.cities[ci].rec++;
  if (BUILD_TURNS[t]) { const q = { n, ci, t, done: G.turn + BUILD_TURNS[t] }; G.queue.push(q); return { queued: true, t, done: q.done, d: bestDesign(n, t).id }; }
  return addUnit(n, t, r.slot, true);
}
const BUILDINGS = {
  fort:    { name: '요새화',   cost: 30, max: 3, desc: '도시 방어 +15%/단계' },
  factory: { name: '군수공장', cost: 45, max: 2, desc: '도시 예산 기여 +3/단계' },
  sam:     { name: '방공망',   cost: 35, max: 2, desc: '미사일 요격 +12%/단계, 공습 방공 피해' },
};
function buildCheck(n, ci, b) {
  const c = G.cities[ci], B = BUILDINGS[b];
  if (c.owner !== n) return { ok: false, why: '자국 도시 아님' };
  if (c[b] >= B.max) return { ok: false, why: '최대 단계' };
  const cost = B.cost * (c[b] + 1);
  if (G.nations[n].money < cost) return { ok: false, why: '예산 부족' };
  if (c.built === G.turn) return { ok: false, why: '이번 턴 건설 완료' };
  return { ok: true, cost };
}
function build(n, ci, b) {
  const r = buildCheck(n, ci, b);
  if (!r.ok) return false;
  G.nations[n].money -= r.cost; G.cities[ci][b]++; G.cities[ci].built = G.turn;
  return true;
}

// ---------- strategic deployment ----------
function deployPlan(u, ci) {
  const C = CLASSES[u.t], cy = W.cities[ci], c = G.cities[ci];
  if (u.acted || u.moved || u.transit || u.carrier) return { ok: false, why: '이번 턴 이미 행동' };
  if (!friendly(u.n, c.owner) || cy.tile === u.pos) return { ok: false, why: '아군 도시 아님' };
  if (C.dom === 'sea' && !cy.port) return { ok: false, why: '항구 필요' };
  if (C.dom !== 'air' && zocAt(u.n, u.pos)) return { ok: false, why: '교전 중에는 불가' };
  const km = kmDist(u.pos, cy.tile);
  let eta, cost, mode;
  if (C.dom === 'land') {
    const cm = compMap(u.n);
    if (cm[u.pos] >= 0 && cm[u.pos] === cm[cy.tile]) { mode = '철도·도로 이동'; eta = 1 + Math.floor(km / 4000); cost = 2 + km / 1500; }
    else {
      const here = W.tiles[u.pos];
      if (here.city < 0 || !W.cities[here.city].port) return { ok: false, why: '출발지가 항구가 아님' };
      if (!cy.port) return { ok: false, why: '도착지가 항구가 아님' };
      mode = '해상 수송'; eta = 1 + Math.ceil(km / 5000); cost = 4 + km / 600;
    }
  } else if (C.dom === 'sea') { mode = '원거리 전개'; eta = 1 + Math.ceil(km / 6000); cost = 3 + km / 1000; }
  else { mode = '공중 전개'; eta = 1 + Math.floor(km / 8000); cost = 2 + km / 1500; }
  if (hasTrait(u.n, 'world_police')) { cost *= 0.5; eta = Math.max(1, eta - 1); }
  if (has(u.n, 'logi')) eta = Math.max(1, eta - 1);
  cost = Math.round(cost);
  if (G.nations[u.n].money < cost) return { ok: false, why: '예산 부족', cost, eta, mode, km };
  return { ok: true, cost, eta, mode, km };
}
function deploy(u, ci) {
  const p = deployPlan(u, ci);
  if (!p.ok) return null;
  G.nations[u.n].money -= p.cost;
  if (u.t === 'cv') for (const a of G.units.slice()) if (a.carrier === u.id) { removeUnit(a); a.carrier = null; a.transit = true; G.transit.push({ u: a, to: ci, eta: G.turn + p.eta }); }
  removeUnit(u);
  u.transit = true;
  G.transit.push({ u, to: ci, eta: G.turn + p.eta });
  logMsg(`[${nName(u.n)}] ${dsg(u).name} → ${W.cities[ci].name} ${p.mode} (${Math.round(p.km).toLocaleString()}km, ${p.eta}턴)`, 'move', u.n);
  return p;
}
function processTransit(n) {
  for (const tr of G.transit.slice()) {
    if (tr.u.n !== n || tr.eta > G.turn) continue;
    let cy = W.cities[tr.to];
    const dom = CLASSES[tr.u.t].dom;
    if (!friendly(n, G.cities[tr.to].owner)) {
      const alt = citiesOf(n).filter(c => dom !== 'sea' || c.port).sort((a, b) => kmDist(a.tile, cy.tile) - kmDist(b.tile, cy.tile))[0];
      if (!alt) { G.transit.splice(G.transit.indexOf(tr), 1); continue; }
      cy = alt;
    }
    const j = dom === 'air' ? (cityAirCount(cy.tile) < 4 ? cy.tile : -1) : freeSlotNear(n, cy.tile, dom, 3);
    if (j < 0) { tr.eta++; continue; }
    G.transit.splice(G.transit.indexOf(tr), 1);
    const u = tr.u; delete u.transit; u.carrier = null;
    u.pos = j; G.units.push(u); uById.set(u.id, u);
    if (dom === 'sea') OS[j] = u.id; else if (dom === 'land') { OG[j] = u.id; u.emb = false; }
    u.mv = 0; u.acted = true; u.moved = true;
    logMsg(`[${nName(n)}] ${dsg(u).name} ${cy.name} 도착`, 'move', n);
  }
}

// ---------- missiles, nukes ----------
function missileLaunchSites(n, mid) {
  const M = MISSILES[mid], out = [];
  if (M.type === 'slbm') {
    for (const u of G.units) if (u.n === n && (u.t === 'ssbn' || (u.t === 'ss' && dsg(u).slbm))) out.push(u.pos);
    return out;
  }
  for (const cy of W.cities) if (G.cities[cy.id].owner === n || (n === 'USA' && cy.base && allied(n, G.cities[cy.id].owner))) out.push(cy.tile);
  if (M.type === 'cm') for (const u of G.units) if (u.n === n && (u.t === 'dd' || u.t === 'ssn' || u.t === 'bmr')) out.push(u.pos);
  return out;
}
function missileSite(n, mid, j, sites) {
  const km = MISSILES[mid].km;
  let best = -1, bd = INF;
  for (const s of sites || missileLaunchSites(n, mid)) { const d = kmDist(s, j); if (d <= km && d < bd) { bd = d; best = s; } }
  return best;
}
function missileOwned(n) { return Object.entries(G.nations[n].arsenal).filter(([, v]) => v > 0).map(([k]) => k); }
function missileBuildable(n) {
  const N = G.nations[n];
  return Object.values(MISSILES).filter(M => {
    const mine = M.nations ? M.nations.includes(n) || N.bought.includes(M.id) : (N.arsenal[M.id] !== undefined || NATIONS[n].tier === 'minor');
    return mine && (!M.req || has(n, M.req));
  });
}
function missileCost(n, mid) { return Math.round(MISSILES[mid].cost * (hasTrait(n, 'missile_power') ? 0.7 : 1)); }
function buyMissile(n, mid) {
  const N = G.nations[n], c = missileCost(n, mid);
  if (N.money < c) return false;
  N.money -= c; N.arsenal[mid] = (N.arsenal[mid] || 0) + 1;
  return true;
}
function defenderAt(j) { const g = groundAt(j), s = shipAt(j), ci = W.tiles[j].city; return g?.n || s?.n || (ci >= 0 ? G.cities[ci].owner : null); }
function interceptChance(att, mid, j) {
  const def = defenderAt(j);
  if (!def) return 0;
  const M = MISSILES[mid];
  let p = (has(def, 'amd1') ? 0.2 : 0) + (has(def, 'amd2') ? 0.2 : 0);
  if (M.type === 'icbm' && has(def, 'gmd')) p += 0.25;
  const ci = W.tiles[j].city;
  if (ci >= 0 && G.cities[ci].owner === def) p += 0.12 * G.cities[ci].sam;
  let sams = 0;
  for (const o of G.units) {
    if (!friendly(def, o.n)) continue;
    const d = hexDist(o.pos, j);
    if (o.t === 'sam' && d <= 3 && sams < 2) { p += 0.2 * dsg(o).q; sams++; }
    else if (o.t === 'shorad' && d <= 1 && (M.type === 'cm' || M.type === 'srbm')) p += 0.08 * (has(o.n, 'laser') ? 2 : 1);
    else if (o.t === 'dd' && has(o.n, 'aegis') && d <= 4) p += 0.12 + (has(o.n, 'aegis2') ? 0.12 : 0);
  }
  if (hasTrait(def, 'iron_dome')) p += 0.2;
  p *= 1 - (M.evade || 0);
  if (has(def, 'ew') && M.type !== 'icbm') p += 0.08;
  return clamp(p, 0, 0.9);
}
function missileTargetOk(n, j) {
  const g = groundAt(j), s = shipAt(j), ci = W.tiles[j].city;
  return !!((g && atWar(n, g.n)) || (s && atWar(n, s.n)) || (ci >= 0 && atWar(n, G.cities[ci].owner)));
}
function fireMissile(n, mid, j, nuclear = false) {
  const N = G.nations[n], M = MISSILES[mid];
  if (!(N.arsenal[mid] > 0) || !missileTargetOk(n, j)) return null;
  if (nuclear && (!M.nuke || N.nukes <= 0)) return null;
  const site = missileSite(n, mid, j);
  if (site < 0) return null;
  N.arsenal[mid]--;
  if (nuclear) N.nukes--;
  const p = interceptChance(n, mid, j);
  const hit = Math.random() >= p;
  Hooks.fx({ k: 'missile', from: site, to: j, hit, nuke: nuclear });
  const tgtName = W.tiles[j].city >= 0 ? W.cities[W.tiles[j].city].name : `${W.tiles[j].lat.toFixed(1)}°, ${W.tiles[j].lon.toFixed(1)}°`;
  if (!hit) {
    logMsg(`[${nName(n)}] ${M.name}${nuclear ? ' (핵탄두)' : ''} → ${tgtName}: 요격됨 (요격 확률 ${Math.round(p * 100)}%)`, 'missile', n);
    if (nuclear) nuclearAftermath(n, defenderAt(j), false, M.yieldKt);
    return { hit: false, p };
  }
  if (nuclear) { nuclearDetonation(n, j, M.yieldKt || 50, M.name); return { hit: true, p, nuke: true }; }
  const parts = [];
  const dmgBase = M.dmg + (M.type === 'srbm' && has(n, 'srbm2') ? 10 : 0);
  for (const u of [groundAt(j), shipAt(j)]) {
    if (!u || !atWar(n, u.n)) continue;
    const base = CLASSES[u.t].dom === 'sea' && M.shipDmg ? M.shipDmg : dmgBase;
    const d = Math.round(base * (0.85 + Math.random() * 0.3));
    u.hp -= d; parts.push(`${dsg(u).name} -${d}`);
    if (u.hp <= 0) killUnit(u, n, '미사일 공격으로 궤멸');
  }
  const ci = W.tiles[j].city;
  if (ci >= 0 && atWar(n, G.cities[ci].owner)) {
    const c = G.cities[ci], d = Math.round(dmgBase * 0.75);
    c.hp = Math.max(0, c.hp - d); parts.push(`${W.cities[ci].name} 방어력 -${d}`);
    for (const a of airAt(j)) if (atWar(n, a.n) && !a.carrier) { a.hp -= 25; if (a.hp <= 0) killUnit(a, n, '활주로 피격으로 손실'); }
    G.nations[c.owner].stab = clamp(G.nations[c.owner].stab - 1, 0, 100);
    for (const o of MAJOR_IDS) if (!allied(o, n) && o !== c.owner) addRel(o, n, -1);
    N.rep = clamp(N.rep - 1, -100, 100);
  }
  Hooks.fx({ k: 'boom', i: j, big: true });
  logMsg(`[${nName(n)}] ${M.name} 명중 → ${tgtName}: ${parts.join(', ') || '피해 없음'}`, 'missile', n);
  return { hit: true, p };
}
function nuclearDetonation(n, j, kt, weapon) {
  const radius = kt >= 100 ? (has(n, 'thermo') && kt >= 300 ? 2 : 1) : 0;
  const tiles = tilesWithin(j, radius);
  let killed = 0;
  const tgt = defenderAt(j) || tileOwner(j);
  for (const t of tiles) {
    const d = hexDist(j, t);
    const dmg = d === 0 ? 100 : d === 1 ? 75 : 45;
    for (const u of G.units.slice()) {
      if (u.pos !== t) continue;
      u.hp -= CLASSES[u.t].dom === 'air' && d === 0 ? 100 : dmg;
      if (u.hp <= 0) { killUnit(u, n, '핵폭발로 소멸'); killed++; }
    }
    const ci = W.tiles[t].city;
    if (ci >= 0) {
      const c = G.cities[ci];
      c.pop = Math.max(1, Math.round(c.pop * (d === 0 ? 0.25 : 0.6))); c.hp = 0; c.fort = 0; c.sam = 0; c.factory = 0; c.ind = Math.floor(c.ind / 2); c.nuked = true;
    }
    G.fallout[t] = G.turn + 6;
  }
  G.doom -= kt >= 100 ? 12 : 6;
  G.nukeLog.push({ t: G.turn, by: n, at: j, kt });
  if (n === G.player) G.flags.aggr = (G.flags.aggr || 0) + 3;
  logMsg(`☢ [${nName(n)}] ${weapon} 핵폭발 (${kt}kt) — ${W.tiles[j].city >= 0 ? W.cities[W.tiles[j].city].name : '표적 지역'} 궤멸, 부대 ${killed}개 소멸. 종말 시계 자정 ${Math.max(0, G.doom)}초 전`, 'nuke', n);
  Hooks.fx({ k: 'nuke', i: j, r: radius });
  nuclearAftermath(n, tgt, true, kt);
}
function nuclearAftermath(n, tgt, detonated, kt) {
  const N = G.nations[n];
  const tac = has(n, 'tacnuke') && kt <= 20;
  N.rep = clamp(N.rep - (detonated ? (tac ? 25 : 50) : 20), -100, 100);
  for (const o of NATION_IDS) if (o !== n) addRel(o, n, detonated ? (allied(o, n) ? -15 : tac ? -20 : -40) : -12);
  for (const o of activeNations()) G.nations[o].stab = clamp(G.nations[o].stab - (detonated ? 2 : 0.5), 0, 100);
  if (tgt && G.nations[tgt]) {
    G.nations[tgt].stab = clamp(G.nations[tgt].stab - (detonated ? 12 : 3), 0, 100);
    if (!atWar(tgt, n)) declareWar(tgt, n, true);
    G.flags.retaliate = G.flags.retaliate || [];
    G.flags.retaliate.push({ from: tgt, against: n });
    for (const o of NATION_IDS) if (o !== tgt && G.ally[pk(o, tgt)] && G.nations[o].nukes > 0 && o !== n) G.flags.retaliate.push({ from: o, against: n });
  }
  G.flags.unPending = { by: n, why: detonated ? '핵무기 사용' : '핵 공격 시도' };
}
function nukeCost(n) { return hasTrait(n, 'triad') ? 42 : 60; }
function produceNuke(n) {
  const N = G.nations[n];
  if (!has(n, 'nuke') || N.money < nukeCost(n)) return false;
  N.money -= nukeCost(n); N.nukes++;
  if (!(NATIONS[n].nukes > 0) && !N.flags.nukeTested) {
    N.flags.nukeTested = true;
    logMsg(`[${nName(n)}] 첫 핵실험 성공 — 세계가 경악했습니다`, 'nuke', n);
    N.rep = clamp(N.rep - 20, -100, 100); G.doom -= 3;
    G.flags.unPending = { by: n, why: '핵실험' };
  }
  return true;
}

// ---------- cyber & espionage ----------
function cyberCheck(n, target) {
  const N = G.nations[n];
  if (!has(n, 'cyber')) return { ok: false, why: '사이버전 사령부 필요' };
  if (!atWar(n, target)) return { ok: false, why: '교전국 아님' };
  if (N.cyberCd > 0) return { ok: false, why: `재사용 ${N.cyberCd}턴` };
  if (N.money < 20) return { ok: false, why: '예산 부족' };
  return { ok: true };
}
function cyberAttack(n, target) {
  if (!cyberCheck(n, target).ok) return null;
  const N = G.nations[n]; N.money -= 20; N.cyberCd = 3;
  const block = (has(target, 'cyber') ? 0.5 : 0) + (hasTrait(target, 'firewall') ? 0.3 : 0);
  if (Math.random() < block) { logMsg(`[${nName(n)}] → [${nName(target)}] 사이버 공격 차단됨`, 'cyber', n); return false; }
  G.nations[target].incomeMult = Math.min(G.nations[target].incomeMult, 0.75);
  logMsg(`[${nName(n)}] → [${nName(target)}] 전력망·금융망 사이버 공격 성공: 다음 달 수입 -25%`, 'cyber', n);
  return true;
}
function opChance(n, target, op) {
  const O = OPS.find(o => o.id === op);
  let p = O.base + (has(n, 'intel') ? 0.15 : 0) + (hasTrait(n, 'mossad') ? 0.25 : 0) + 0.05 * mSkill(n, 'intel') - 0.05 * mSkill(target, 'intel');
  if (op === 'proxy' && hasTrait(n, 'axis_resist')) p += 0.2;
  if (op === 'assassinate' && has(n, 'sof2')) p += 0.1;
  if (op === 'coup') p += (50 - G.nations[target].stab) / 120 + (G.nations[target].gov === 'democracy' ? -0.05 : 0.05);
  if (hasTrait(target, 'firewall')) p -= 0.25;
  if (hasTrait(target, 'mossad')) p -= 0.2;
  if (['USA', 'RUS', 'CHN', 'GBR', 'ISR'].includes(target)) p -= 0.1;
  return clamp(p, 0.03, 0.95);
}
function opCheck(n, target, op) {
  const O = OPS.find(o => o.id === op), N = G.nations[n];
  if (target === n || !G.nations[target].alive || G.nations[target].capitulated) return { ok: false, why: '대상 없음' };
  if (N.money < O.cost) return { ok: false, why: '예산 부족' };
  const cd = N.opsCd[`${target}:${op}`] ?? -99;
  if (cd > G.turn) return { ok: false, why: `재시도 ${cd - G.turn}턴 후` };
  if (op === 'steal' && !G.nations[target].techs.some(t => !has(n, t))) return { ok: false, why: '탈취할 기술 없음' };
  return { ok: true, p: opChance(n, target, op) };
}
function runOp(n, target, op) {
  const c = opCheck(n, target, op);
  if (!c.ok) return null;
  const O = OPS.find(o => o.id === op), N = G.nations[n], T = G.nations[target];
  N.money -= O.cost; N.opsCd[`${target}:${op}`] = G.turn + (op === 'coup' ? 8 : op === 'assassinate' ? 6 : 3);
  const ok = Math.random() < c.p;
  const tn = nName(target), heavy = op === 'assassinate' || op === 'coup';
  if (!ok) {
    const caught = Math.random() < (heavy ? 0.7 : 0.35);
    if (caught) { N.rep = clamp(N.rep - (heavy ? 15 : 5), -100, 100); addRel(n, target, heavy ? -40 : -12); }
    logMsg(`[${nName(n)}] → [${tn}] ${O.name} 실패${caught ? ' — 요원 체포, 배후 발각' : ''}`, 'intel', n);
    if (caught && heavy && !atWar(n, target) && Math.random() < 0.5) declareWar(target, n, true);
    return { ok: false, caught };
  }
  let msg = '';
  if (op === 'recon') { N.intel[target] = G.turn + 3; msg = '3턴간 부대 위치 파악'; }
  if (op === 'sabotage') { T.incomeMult = Math.min(T.incomeMult, 0.8); msg = '다음 달 수입 -20%'; }
  if (op === 'steal') { const cand = T.techs.filter(t => !has(n, t)); const t = cand[Math.floor(Math.random() * cand.length)]; N.progress[t] = (N.progress[t] || 0) + TECH_BY_ID[t].cost * 0.6; msg = `${TECH_BY_ID[t].name} 설계 자료 확보 (진척 60%)`; }
  if (op === 'disinfo') { T.stab = clamp(T.stab - 6, 0, 100); msg = '안정도 -6'; }
  if (op === 'assassinate') { T.stab = clamp(T.stab - 15, 0, 100); msg = `${NATIONS[target].leader} 측근 제거 — 안정도 -15`; }
  if (op === 'proxy') {
    const cs = citiesOf(target).sort(() => Math.random() - 0.5).slice(0, 2);
    for (const cy of cs) G.cities[cy.id].hp = Math.max(0, G.cities[cy.id].hp - 30);
    T.stab = clamp(T.stab - 5, 0, 100); msg = `${cs.map(c => c.name).join('·')} 무장봉기`;
  }
  if (op === 'coup') { regimeChange(target, n); msg = '친(親)정권 수립'; }
  logMsg(`[${nName(n)}] → [${tn}] ${O.name} 성공: ${msg}`, 'intel', n);
  return { ok: true, msg };
}
function regimeChange(n, sponsor) {
  const N = G.nations[n];
  const old = REGIME_NAMES[N.gov];
  N.gov = sponsor ? G.nations[sponsor].gov : (N.gov === 'democracy' ? 'junta' : 'democracy');
  N.stab = 45; N.fac = initFactions(n); N.power = 30;
  for (const e of enemiesOf(n)) if (!sponsor || e === sponsor || allied(e, sponsor)) makePeace(n, e, true);
  if (sponsor) {
    for (const o of NATION_IDS) if (G.ally[pk(n, o)] && atWar(o, sponsor)) delete G.ally[pk(n, o)];
    G.ally[pk(n, sponsor)] = 1; G.rel[pk(n, sponsor)] = 60;
  }
  logMsg(`[${nName(n)}] 정권 교체 — ${old}에서 ${REGIME_NAMES[N.gov]}(으)로${sponsor ? ` ([${nName(sponsor)}] 배후)` : ''}`, 'capitulate', n);
  cache.supply = {}; cache.comp = {};
}

// ---------- diplomacy ----------
function militaryPower(n) { let p = 0; for (const u of G.units) if (u.n === n) p += (CLASSES[u.t].atk + CLASSES[u.t].def) * dsg(u).q * u.hp / 100; return p; }
function declareWar(a, b, provoked = false) {
  if (atWar(a, b) || G.vassal[a] === b || G.vassal[b] === a) return false;
  if (!provoked && (G.truce[pk(a, b)] ?? -99) + 6 > G.turn) return false;
  if (G.ally[pk(a, b)]) delete G.ally[pk(a, b)];
  G.war[pk(a, b)] = 1; G.rel[pk(a, b)] = -80;
  const A = G.nations[a];
  if (!provoked) {
    const defensive = enemiesOf(b).some(e => e !== a && allied(e, a));
    A.stab = clamp(A.stab - (A.gov === 'democracy' ? 5 : 2) - (hasTrait(a, 'peace_const') ? 8 : 0), 0, 100);
    if (!defensive) { A.rep = clamp(A.rep - 15, -100, 100); G.flags.unPending = G.flags.unPending || { by: a, why: `${nName(b)} 침공` }; if (a === G.player) G.flags.aggr = (G.flags.aggr || 0) + 1; }
    G.nations[b].stab = clamp(G.nations[b].stab + 3, 0, 100);
  }
  logMsg(`[${nName(a)}] → [${nName(b)}] 선전포고`, 'war', a);
  for (const o of activeNations()) {
    if (o === a || o === b || o === G.player) continue;
    if (allied(o, b) && !allied(o, a) && !atWar(o, a) && rel(o, b) >= 40) {
      G.war[pk(o, a)] = 1; G.rel[pk(o, a)] = -70;
      logMsg(`[${nName(o)}] 동맹 조약에 따라 [${nName(a)}]에 선전포고`, 'war', o);
    }
  }
  cache.supply = {}; cache.comp = {};
  return true;
}
function makePeace(a, b, silent) {
  delete G.war[pk(a, b)];
  G.truce[pk(a, b)] = G.turn;
  G.rel[pk(a, b)] = Math.max(rel(a, b), -30);
  for (const u of G.units.slice()) {
    if ((u.n !== a && u.n !== b) || CLASSES[u.t].dom !== 'land') continue;
    const o = tileOwner(u.pos);
    if (o && !friendly(u.n, o) && !atWar(u.n, o)) {
      const home = citiesOf(u.n).map(c => c.tile).sort((x, y) => hexDist(u.pos, x) - hexDist(u.pos, y));
      let spot = -1;
      for (const h of home.slice(0, 6)) { spot = freeSlotNear(u.n, h, 'land', 3); if (spot >= 0) break; }
      if (spot >= 0) placeUnitAt(u, spot); else removeUnit(u);
    }
  }
  cache.supply = {}; cache.comp = {};
  if (!silent) logMsg(`[${nName(a)}] ↔ [${nName(b)}] 강화 조약 체결`, 'peace', a);
}
function warScore(a, b) {
  let s = 0;
  for (const cy of W.cities) {
    const o = G.cities[cy.id].owner;
    if (cy.nat === b && o === a) s += cy.cap ? 25 : 6;
    if (cy.nat === a && o === b) s -= cy.cap ? 25 : 6;
  }
  s += clamp((militaryPower(a) + 1) / (militaryPower(b) + 1) * 10 - 10, -25, 25);
  s += (G.nations[a].stab - G.nations[b].stab) * 0.3;
  return s;
}
function peaceAcceptance(ai, other) {
  const N = G.nations[ai];
  let p = 0.25 - warScore(ai, other) / 60 + (50 - N.stab) / 80 + 0.05 * mSkill(other, 'foreign');
  if (G.flags.coalition && other === G.player) p -= 0.25;
  if (G.scen === 'korea' && ai === 'PRK' && warScore(ai, other) > 10) p -= 0.3;
  return clamp(p, 0, 1);
}
function proposePeace(from, to) {
  if (!atWar(from, to)) return false;
  const p = peaceAcceptance(to, from);
  if (p >= 0.5) { makePeace(from, to); return true; }
  addRel(from, to, -2);
  logMsg(`[${nName(to)}] 강화 제안 거절 (수락 의사 ${Math.round(p * 100)}%)`, 'diplo', to);
  return false;
}
function allianceCheck(a, b) {
  if (allied(a, b)) return { ok: false, why: '이미 동맹' };
  if (atWar(a, b)) return { ok: false, why: '교전 중' };
  const common = enemiesOf(a).some(e => atWar(b, e));
  const need = common ? 35 : 60;
  if (rel(a, b) < need) return { ok: false, why: `관계 ${need} 이상 필요` };
  if (G.nations[a].rep < -40 && NATIONS[b].gov === 'democracy') return { ok: false, why: '국제 평판이 너무 낮음' };
  return { ok: true };
}
function proposeAlliance(a, b) {
  if (!allianceCheck(a, b).ok) return false;
  G.ally[pk(a, b)] = 1; addRel(a, b, 10);
  logMsg(`[${nName(a)}] ↔ [${nName(b)}] 군사 동맹 체결`, 'peace', a);
  cache.supply = {}; cache.comp = {};
  return true;
}
function breakAlliance(a, b) {
  if (!G.ally[pk(a, b)]) return false;
  delete G.ally[pk(a, b)]; addRel(a, b, -35);
  G.nations[a].stab = clamp(G.nations[a].stab - 2, 0, 100); G.nations[a].rep = clamp(G.nations[a].rep - 5, -100, 100);
  logMsg(`[${nName(a)}] ↔ [${nName(b)}] 동맹 파기`, 'war', a);
  cache.supply = {}; cache.comp = {};
  return true;
}
function improveRelations(a, b) {
  const N = G.nations[a];
  if (N.money < 15 || N.diploCd[b] === G.turn) return false;
  N.money -= 15; N.diploCd[b] = G.turn; addRel(a, b, (atWar(a, b) ? 4 : 8) * (hasTrait(a, 'nonaligned') ? 2 : 1) + 2 * mSkill(a, 'foreign'));
  return true;
}
function requestAid(a, b) {
  const N = G.nations[a];
  if (!allied(a, b) || N.aidCd > 0 || rel(a, b) < 40 || G.nations[b].money < 40) return false;
  const amt = Math.round(Math.min(80, G.nations[b].money * 0.2));
  G.nations[b].money -= amt; N.money += amt; N.aidCd = 5; addRel(a, b, -6);
  logMsg(`[${nName(b)}] → [${nName(a)}] 군사 원조 ${amt}억$`, 'diplo', b);
  return amt;
}
function ultimatumOdds(a, b) {
  const protectors = NATION_IDS.filter(o => o !== a && o !== b && G.ally[pk(o, b)] && !G.nations[o].capitulated);
  const pb = militaryPower(b) + protectors.reduce((s, o) => s + militaryPower(o) * 0.3, 0);
  return clamp(militaryPower(a) / (pb * 4 + 1) - 0.25 + (G.nations[b].stab < 40 ? 0.15 : 0), 0, 0.9);
}
function ultimatum(a, b) {
  if (G.vassal[b] || atWar(a, b) || G.ally[pk(a, b)]) return null;
  const p = ultimatumOdds(a, b);
  if (Math.random() < p) {
    G.vassal[b] = a;
    for (const e of enemiesOf(b)) makePeace(b, e, true);
    for (const o of NATION_IDS) if (G.ally[pk(b, o)] && o !== a) delete G.ally[pk(b, o)];
    G.nations[a].rep = clamp(G.nations[a].rep - 8, -100, 100);
    logMsg(`[${nName(b)}] [${nName(a)}]의 최후통첩 수용 — 보호국 편입`, 'capture', a);
    cache.supply = {}; cache.comp = {};
    return true;
  }
  addRel(a, b, -30);
  logMsg(`[${nName(b)}] [${nName(a)}]의 최후통첩 거부`, 'war', b);
  return false;
}
function armsOffer(buyer, seller) {
  if (buyer === seller || atWar(buyer, seller) || G.nations[seller].capitulated || (!allied(buyer, seller) && rel(buyer, seller) < 40)) return [];
  const out = [];
  for (const cls of CLASS_ORDER) {
    const d = bestDesign(seller, cls), mine = bestDesign(buyer, cls);
    if (!d || !d.nations || !d.nations.includes(seller) || d.q <= mine.q + 0.02 || G.nations[buyer].bought.includes(d.id)) continue;
    if ((cls === 'ssbn' || cls === 'ssn') && !(hasTrait(buyer, 'aukus') && hasTrait(seller, 'aukus'))) continue;
    out.push({ kind: 'design', id: d.id, cost: Math.round(CLASSES[cls].cost * 1.6), name: d.name, cls });
  }
  for (const M of missileBuildable(seller)) {
    if (['icbm', 'slbm', 'irbm'].includes(M.type) || !M.nations || M.nations.includes(buyer) || G.nations[buyer].bought.includes(M.id)) continue;
    out.push({ kind: 'missile', id: M.id, cost: Math.round(M.cost * 6), name: `${M.name} × 4`, cls: 'missile' });
  }
  return out.slice(0, 14);
}
function buyArms(buyer, seller, item) {
  const N = G.nations[buyer];
  if (N.money < item.cost) return false;
  N.money -= item.cost; G.nations[seller].money += item.cost * 0.8;
  N.bought.push(item.id);
  if (item.kind === 'missile') N.arsenal[item.id] = (N.arsenal[item.id] || 0) + 4;
  addRel(buyer, seller, 5);
  logMsg(`[${nName(buyer)}] ← [${nName(seller)}] 무기 도입 계약: ${item.name}`, 'diplo', buyer);
  return true;
}

// ---------- sanctions, UN, coalition ----------
function sanctionPenalty(n) {
  let p = 0;
  for (const s of G.sanc[n] || []) p += (NATIONS[s].tier === 'major' ? NATIONS[s].econ * 0.028 : 0.004) * (hasTrait(s, 'reserve_currency') ? 2 : 1);
  if (hasTrait(n, 'juche')) p *= 0.5;
  return clamp(p, 0, 0.3);
}
function updateSanctions() {
  for (const t of NATION_IDS) {
    const T = G.nations[t];
    const list = [];
    for (const s of MAJOR_IDS) {
      if (s === t || G.nations[s].capitulated || allied(s, t)) continue;
      const S = NATIONS[s];
      const hostile = atWar(s, t);
      const rogue = T.rep < -35 && (G.nations[s].gov === 'democracy' || S.bloc === 'west');
      const un = (G.flags.unSanction?.[t] ?? -1) >= G.turn && S.bloc !== NATIONS[t].bloc;
      if (hostile || rogue || un) list.push(s);
    }
    G.sanc[t] = list;
  }
}
function processUN() {
  const u = G.flags.unPending;
  G.flags.unPending = null;
  if (!u || !G.nations[u.by]) return;
  const P5 = ['USA', 'CHN', 'RUS', 'GBR', 'FRA'];
  const veto = P5.find(p => p === u.by || allied(p, u.by) || rel(p, u.by) >= 45);
  if (veto) { logMsg(`유엔 안보리: [${nName(u.by)}] 규탄 결의안 (${u.why}) — [${nName(veto)}] 거부권 행사로 부결`, 'diplo', veto); return; }
  G.flags.unSanction = G.flags.unSanction || {};
  G.flags.unSanction[u.by] = G.turn + 12;
  G.nations[u.by].rep = clamp(G.nations[u.by].rep - 10, -100, 100);
  for (const o of NATION_IDS) if (G.nations[o].gov === 'democracy' && !allied(o, u.by)) addRel(o, u.by, -8);
  logMsg(`유엔 안보리: [${nName(u.by)}] 규탄·제재 결의 채택 (${u.why}) — 12개월 국제 제재`, 'war', u.by);
}
function coalitionCheck() {
  const p = G.player, P = G.nations[p];
  if (G.flags.coalition || P.capitulated) return;
  const share = controlled(p) / W.cities.length;
  const aggr = G.flags.aggr || 0;
  if (share < 0.15 && !(aggr >= 2 && P.rep < -50)) return;
  const joiners = [];
  for (const o of MAJOR_IDS) {
    if (o === p || atWar(o, p) || allied(o, p) || G.nations[o].capitulated) continue;
    const chance = Math.max(0, share - 0.1) * 1.5 + Math.max(0, -P.rep - 50) / 150 * Math.min(1, aggr / 3) + (rel(o, p) < 0 ? 0.1 : 0);
    if (Math.random() < chance * 0.3) { declareWar(o, p, true); joiners.push(nName(o)); }
  }
  if (joiners.length) logMsg(`대(對)${nName(p)} 연합 확대 — ${joiners.join(', ')} 참전`, 'war');
}

// ---------- politics ----------
function regime(n) { return REGIMES[G.nations[n].gov]; }
function factionLabel(n, f) { return f === 'party' ? regime(n).party : FACTION_BASE[f]; }
function loyaltyAvg(n) { const N = G.nations[n], w = regime(n).w; return FACTIONS.reduce((s, f) => s + w[f] * N.fac[f], 0); }
function coupRisk(n) {
  const N = G.nations[n], f = N.fac;
  const r = ((45 - f.army) * 1.1 + (40 - f.sec) * 0.5 + (35 - f.party) * 0.3 + (N.stab < 30 ? 8 : 0) - (flag(n, 'successor') ? 4 : 0) - N.power * 0.08) * regime(n).coupMult;
  return clamp(r / 100 + (n === G.player ? cabinetCoupRisk() : 0), 0, 0.5);
}
function revoltRisk(n) {
  const N = G.nations[n], f = N.fac;
  const r = (35 - f.people) * 1.2 + (30 - N.stab) * 0.8 - f.sec * 0.15 - (flag(n, 'media') ? 4 : 0);
  return clamp(r / 100 - 0.02 * mSkill(n, 'interior'), 0, 0.4);
}
function decreeCheck(n, id) {
  const D = DECREES.find(d => d.id === id), N = G.nations[n], need = D.need || {};
  if (D.once && N.flags['done_' + id]) return { ok: false, why: '이미 시행' };
  if ((N.cd[id] ?? -1) > G.turn) return { ok: false, why: `${N.cd[id] - G.turn}턴 후 가능` };
  if (need.gov && !need.gov.includes(N.gov)) return { ok: false, why: `${need.gov.map(g => REGIME_NAMES[g]).join('·')} 전용` };
  if (need.notGov && need.notGov.includes(N.gov)) return { ok: false, why: `${REGIME_NAMES[N.gov]}에서 불가` };
  if (need.power && N.power < need.power) return { ok: false, why: `권력 기반 ${need.power} 필요` };
  if (need.noNukes && (N.nukes > 0 || has(n, 'nuke') || flag(n, 'nukeProgram'))) return { ok: false, why: '이미 핵 보유·개발 중' };
  if (need.elections && !regime(n).elections) return { ok: false, why: '선거 없는 체제' };
  if (need.oilExporter && NATIONS[n].oil < 20) return { ok: false, why: '산유국 전용' };
  if (N.money < D.cost) return { ok: false, why: '예산 부족' };
  return { ok: true };
}
function applyFx(n, fx) {
  const N = G.nations[n];
  if (!fx) return;
  if (fx.fac) for (const [f, d] of Object.entries(fx.fac)) N.fac[f] = clamp(N.fac[f] + d, 0, 100);
  if (fx.stab) N.stab = clamp(N.stab + fx.stab, 0, 100);
  if (fx.rep) N.rep = clamp(N.rep + fx.rep, -100, 100);
  if (fx.power) N.power = clamp(N.power + fx.power, 0, 100);
  if (typeof fx.money === 'number') N.money += fx.money;
  if (fx.money === 'nationalize') { const gain = Math.round(60 + economyPreview(n).gross * 1.5); N.money += gain; logMsg(`[${nName(n)}] 몰수 자산 ${gain}억$ 국고 귀속`, 'event', n); }
  if (typeof fx.mp === 'number') N.manpower = Math.max(0, N.manpower + fx.mp);
  if (fx.mp === 'mobilize') { const gain = Math.round(citiesOf(n).reduce((s, c) => s + G.cities[c.id].pop, 0) * 6 + 40); N.manpower += gain; logMsg(`[${nName(n)}] 총동원령 — 인력 ${gain}천 명 징집`, 'event', n); }
  if (fx.fuel) N.fuel += fx.fuel;
  if (fx.flag) N.flags[fx.flag] = fx.flagTurns ? G.turn + fx.flagTurns : true;
  if (fx.rel) {
    const mine = citiesOf(n);
    for (const o of NATION_IDS) if (o !== n && citiesOf(o).some(c => mine.some(m => kmDist(m.tile, c.tile) < 2500))) addRel(n, o, fx.rel);
  }
  if (fx.gov) { N.gov = fx.gov; N.nextElection = 0; logMsg(`[${nName(n)}] 체제 전환: ${REGIME_NAMES[fx.gov]}`, 'capitulate', n); G.flags.unPending = { by: n, why: '헌정 중단' }; }
  if (fx.special === 'nukeprog') { N.flags.nukeProgram = true; G.flags.unPending = { by: n, why: '핵무기 개발' }; }
  if (fx.special === 'energy') { for (const o of NATION_IDS) if (atWar(n, o) || (!allied(n, o) && NATIONS[o].oilImport > 20)) G.nations[o].fuel -= 15; N.flags.embargo = G.turn + 4; }
  if (fx.special === 'dropPeaceConst') N.flags.noPeaceConst = true;
  if (fx.special === 'grantMissiles') N.arsenal.stormshadow = (N.arsenal.stormshadow || 0) + 3;
  if (fx.special === 'grantSam') { const cap = capitalOf(n); if (cap) { const j = freeSlotNear(n, cap.tile, 'land', 2); if (j >= 0) addUnit(n, 'sam', j); } }
  if (fx.special === 'research' && N.research) N.progress[N.research] = (N.progress[N.research] || 0) + 40;
}
function enactDecree(n, id) {
  if (!decreeCheck(n, id).ok) return false;
  const D = DECREES.find(d => d.id === id), N = G.nations[n];
  N.money -= D.cost;
  if (D.once) N.flags['done_' + id] = true;
  if (D.cd) N.cd[id] = G.turn + D.cd;
  applyFx(n, D.fx);
  logMsg(`[${nName(n)}] 칙령: ${D.name}`, 'decree', n);
  return true;
}
function politicsTurn(n) {
  const N = G.nations[n], f = N.fac;
  for (const k of FACTIONS) f[k] += (50 - f[k]) * 0.03;
  const wars = enemiesOf(n).length;
  const pen = sanctionPenalty(n);
  const weary = (hasTrait(n, 'opinion') ? 1.4 : 1) * (flag(n, 'propaganda') ? 0.5 : 1) * (flag(n, 'media') ? 0.7 : 1);
  f.people += -Math.min(3, 0.5 * wars) * weary - (N.fuel <= 0 ? 2 : 0) - pen * 12 - (flag(n, 'mobilized') ? 1 : 0) + N.tTaken * 1.5 - N.tLost * 3;
  f.biz += -pen * 18 - (wars ? 0.5 : 0) + (N.money > 300 ? 0.5 : 0);
  f.army += (N.money < 0 ? -4 : 0) + N.tTaken * 2 - N.tLost * 3 + (hasTrait(n, 'songun') ? 0.3 : 0);
  f.party += flag(n, 'cult') ? 0.3 : 0;
  f.sec += flag(n, 'media') ? 0.2 : 0;
  for (const k of FACTIONS) f[k] = clamp(f[k], 0, 100);
  N.stab = clamp(N.stab + (loyaltyAvg(n) - N.stab) * 0.1 + (flag(n, 'cult') ? 0.4 : 0), hasTrait(n, 'unyielding') ? 20 : 0, 100);
  N.power = clamp(N.power + ((f.sec + f.army) / 2 - 50) * 0.02, 0, 100);
  N.tTaken = 0; N.tLost = 0;
}
function politicalCrises(n) {
  const N = G.nations[n], out = [];
  if (G.flags.forceCoup) { G.flags.forceCoup = false; out.push('coup'); }
  else if (Math.random() < coupRisk(n)) out.push('coup');
  const pl = plotters().sort((a, b) => (b.ambition - b.loyalty) - (a.ambition - a.loyalty))[0];
  if (pl && Math.random() < (pl.ambition - pl.loyalty - 25) / 120) out.push('plot:' + pl.post);
  if (N.skim > 0 && Math.random() < N.skim * 1.2) out.push('scandal');
  else if (Math.random() < revoltRisk(n)) out.push('uprising');
  if (regime(n).elections && N.nextElection && G.turn >= N.nextElection) out.push('election');
  if (N.rep < -40 && Math.random() < 0.05) out.push('assassination');
  return out;
}
function electionOdds(n) {
  const N = G.nations[n];
  return clamp(0.15 + N.fac.people / 110 + N.stab / 260 + (flag(n, 'rigged') ? 0.6 : 0) + (regime(n).rigged ? 0.3 : 0), 0.05, 0.97);
}
function aiPoliticsTurn(n) {
  const N = G.nations[n];
  N.tTaken = 0; N.tLost = 0;
  if (N.stab < 14 && Math.random() < 0.08) { logMsg(`[${nName(n)}] 수도에서 쿠데타 발생`, 'capitulate', n); regimeChange(n, null); }
}

// ---------- capitulation & victory ----------
function checkCapitulation(n, by) {
  const N = G.nations[n];
  if (!N.alive || N.capitulated || N.puppet) return;
  const home = W.cities.filter(c => c.nat === n);
  const held = home.filter(c => G.cities[c.id].owner === n).length;
  const origCap = home.find(c => c.cap);
  const capLost = origCap && G.cities[origCap.id].owner !== n;
  const holdBy = o => home.filter(c => G.cities[c.id].owner === o).length;
  const atWarNow = enemiesOf(n).length > 0;
  if (!atWarNow) { if (N.stab <= 6 && n !== G.player) { logMsg(`[${nName(n)}] 국가 붕괴 위기 — 군부가 권력 장악`, 'capitulate', n); regimeChange(n, null); } return; }
  const hardy = hasTrait(n, 'unyielding');
  if (!(citiesOf(n).length === 0 || (!hardy && N.stab <= 6) || (capLost && held / Math.max(1, home.length) < (hardy ? 0.12 : 0.35)) || (!hardy && capLost && N.stab < 18))) return;
  let victor = by || enemiesOf(n).sort((x, y) => holdBy(y) - holdBy(x))[0];
  if (victor && holdBy(victor) === 0 && !(origCap && G.cities[origCap.id].owner === victor)) victor = enemiesOf(n).find(e => holdBy(e) > 0) || null;
  for (const o of NATION_IDS) if (atWar(n, o)) { delete G.war[pk(n, o)]; G.truce[pk(n, o)] = G.turn + 300; }
  logMsg(`[${nName(n)}] 무조건 항복`, 'capitulate', n);
  G.flags.beaten = G.flags.beaten || {};
  if (victor) G.flags.beaten[n] = victor;
  if (n === G.player) { N.capitulated = true; return; }
  if (victor && origCap && G.cities[origCap.id].owner === victor && ((n === 'PRK' && victor === 'KOR') || (n === 'KOR' && victor === 'PRK'))) {
    N.capitulated = true;
    for (const cy of citiesOf(n)) G.cities[cy.id].owner = victor;
    for (const u of G.units.slice()) if (u.n === n) removeUnit(u);
    logMsg(`한반도 통일 — ${NATIONS[victor].name} 주도의 흡수 통일`, 'capitulate', victor);
  } else if (victor && citiesOf(n).length) {
    G.vassal[n] = victor; N.puppet = true; N.stab = 40;
    for (const o of NATION_IDS) if (G.ally[pk(n, o)]) delete G.ally[pk(n, o)];
    for (const u of G.units.slice()) if (u.n === n && CLASSES[u.t].dom === 'land' && tileOwner(u.pos) !== n) removeUnit(u);
    logMsg(`[${nName(n)}] [${nName(victor)}]의 괴뢰 정부 수립 — 보호국 편입`, 'capture', victor);
  } else N.capitulated = true;
  cache.supply = {}; cache.comp = {};
}
function controlled(p) { return citiesOf(p).length + NATION_IDS.filter(o => G.vassal[o] === p).reduce((s, o) => s + citiesOf(o).length, 0); }
function majorCapitalsHeld(p) {
  let k = 0;
  for (const m of MAJOR_IDS) {
    if (m === p) continue;
    const cap = W.cities.find(c => c.nat === m && c.cap);
    const o = G.cities[cap.id].owner;
    if (o === p || G.vassal[o] === p || G.vassal[m] === p) k++;
  }
  return k;
}
function score(n) {
  return Math.round((n === G.player ? (G.nations[n].slush || 0) / 10 : 0) + citiesOf(n).reduce((s, c) => s + 8 + G.cities[c.id].pop, 0) + G.nations[n].stab + G.nations[n].techs.length * 3 + militaryPower(n) / 60 + NATION_IDS.filter(o => G.vassal[o] === n).length * 15);
}
function checkVictory() {
  if (G.over) return G.over;
  const p = G.player, P = G.nations[p];
  const won = id => G.won.includes(id);
  if (G.doom <= 0) return (G.over = { win: false, id: 'winter', title: '핵겨울', text: '종말 시계가 자정을 가리켰습니다. 대규모 핵전쟁의 재가 성층권을 뒤덮고 문명이 붕괴했습니다. 승자는 없습니다.' });
  if (P.flags.overthrown) return (G.over = { win: false, id: 'overthrown', title: P.flags.overthrown, text: `${G.leader.title} ${G.leader.name}의 통치는 ${dateLabel()}에 막을 내렸습니다.` });
  if (P.capitulated) return (G.over = { win: false, id: 'capit', title: '패전', text: `${NATIONS[p].name}이(가) 항복했습니다.` });
  const korea = W.cities.filter(c => c.nat === 'KOR' || c.nat === 'PRK');
  if ((p === 'KOR' || p === 'PRK') && !won('unify') && korea.every(c => G.cities[c.id].owner === p))
    return (G.over = { win: true, id: 'unify', title: '한반도 통일', text: `${NATIONS[p].name}이(가) 한반도 전역 ${korea.length}개 도시를 장악했습니다.` });
  const ctrl = controlled(p), need = Math.ceil(W.cities.length * 0.35);
  if (!won('hegemony') && ctrl >= need) return (G.over = { win: true, id: 'hegemony', title: '세계 패권', text: `전 세계 ${W.cities.length}개 도시 중 ${ctrl}개(보호국 포함)를 지배합니다.` });
  if (!won('conquest') && majorCapitalsHeld(p) >= MAJOR_IDS.length - 1) return (G.over = { win: true, id: 'conquest', title: '세계 정복', text: `모든 강대국의 수도가 ${G.leader.title} ${G.leader.name}의 깃발 아래 들어왔습니다.` });
  const beaten = Object.entries(G.flags.beaten || {}).filter(([, v]) => friendly(p, v)).length;
  if (!won('war') && beaten > 0 && enemiesOf(p).length === 0) return (G.over = { win: true, id: 'war', title: '전쟁 승리', text: `적국 ${beaten}개국을 굴복시키고 전쟁을 끝냈습니다.` });
  if (G.turn > G.maxTurn && !won('time')) {
    const ranks = MAJOR_IDS.filter(n => !G.nations[n].capitulated).map(n => [n, score(n)]).sort((a, b) => b[1] - a[1]);
    const pos = ranks.findIndex(r => r[0] === p) + 1;
    return (G.over = { win: pos === 1, id: 'time', title: pos === 1 ? '종전 — 점수 1위' : `종전 — 점수 ${pos}위`, text: ranks.slice(0, 6).map(([n, s]) => `${nName(n)} ${s}`).join(' · ') });
  }
  return null;
}
function continueAfterWin() { if (G.over && G.over.win) { G.won.push(G.over.id); G.over = null; } }

// ---------- research ----------
function techAllowed(n, t) {
  if (t.id === 'nuke' && !(G.nations[n].nukes > 0 || flag(n, 'nukeProgram'))) return false;
  return !t.req || has(n, t.req);
}
function availableTechs(n) { return TECHS.filter(t => !has(n, t.id) && techAllowed(n, t)); }
function pickResearch(n) {
  const N = G.nations[n];
  if (N.research && !has(n, N.research)) return;
  const av = availableTechs(n);
  N.research = av.length ? av.sort((a, b) => a.cost - b.cost)[Math.floor(Math.random() * Math.min(3, av.length))].id : null;
}

// ---------- phases ----------
function blockaded(ci) {
  const cy = W.cities[ci];
  if (!cy.port) return false;
  const o = G.cities[ci].owner;
  return W.tiles[cy.tile].nb.some(k => { const s = shipAt(k); return s && atWar(o, s.n); });
}
function economyPreview(n) {
  const N = G.nations[n], NT = NATIONS[n];
  let base = 0, ports = 0, blk = 0, mp = 0;
  const home = W.cities.filter(c => c.nat === n);
  for (const cy of citiesOf(n)) {
    const c = G.cities[cy.id];
    let v = c.pop * 0.9 + c.ind * 1.3 + c.factory * 3 * (hasTrait(n, 'chaebol') ? 1.5 : 1);
    if (cy.nat !== n) v *= 0.5;
    if (cy.port) { ports++; if (blockaded(cy.id)) { blk++; v *= 0.6; } }
    base += v; mp += c.pop * 0.6;
  }
  const oilRatio = home.length ? home.filter(c => G.cities[c.id].owner === n).length / home.length : 1;
  const pen = sanctionPenalty(n);
  let mult = NT.econ * (0.6 + 0.4 * N.stab / 100) * N.incomeMult * (1 - pen);
  if (has(n, 'wareco')) mult *= 1.12;
  if (hasTrait(n, 'industrial')) mult *= 1.1;
  if (hasTrait(n, 'oil_money')) mult *= 1.2;
  if (hasTrait(n, 'suez') && !enemiesOf(n).length) mult *= 1.1;
  if (hasTrait(n, 'songun')) mult *= 0.9;
  if (flag(n, 'econShock')) mult *= 0.85;
  if (flag(n, 'mobilized')) mult *= 0.9;
  if (flag(n, 'purgeParty')) mult *= 0.9;
  let gross = base * 0.72 * mult * (1 + 0.03 * mSkill(n, 'economy'));
  if (G.vassal[n]) gross *= 0.85;
  let tribute = 0;
  for (const o of NATION_IDS) if (G.vassal[o] === n) tribute += (G.nations[o].last.gross || 0) * 0.15;
  let upkeep = 0, fuelUse = 0;
  for (const u of G.units) if (u.n === n) { upkeep += CLASSES[u.t].up; fuelUse += CLASSES[u.t].fuel * 0.35; }
  for (const tr of G.transit) if (tr.u.n === n) upkeep += CLASSES[tr.u.t].up;
  if (hasTrait(n, 'songun')) upkeep *= 0.7;
  const rpMult = (hasTrait(n, 'fast_rnd') ? 1.15 : 1) * (has(n, 'chip') ? 1.15 : 1) * (has(n, 'ai_c2') ? 1.1 : 1) * (flag(n, 'warEconomy') ? 0.7 : 1);
  const rp = gross * N.rd * rpMult;
  const rdCost = gross * N.rd;
  const openPorts = ports ? (ports - blk) / ports : 1;
  const domestic = NT.oil * oilRatio;
  const fuelIn = domestic + NT.oilImport * openPorts * (1 - pen) * (has(n, 'energy') ? 1.4 : 1);
  const surplus = Math.max(0, domestic - fuelUse);
  const oilx = flag(n, 'embargo') ? 0 : surplus * 0.35 * (hasTrait(n, 'energy_super') ? 2 : 1) * (1 - pen);
  const mpGain = mp * (hasTrait(n, 'reserve') ? 1.3 : 1) * (hasTrait(n, 'peoples_war') ? 1.5 : 1) * (hasTrait(n, 'demographic') ? 1.5 : 1) * (0.6 + 0.4 * N.stab / 100) + (hasTrait(n, 'legion') ? 8 : 0);
  const skim = n === G.player ? gross * (N.skim || 0) : 0;
  return { gross, upkeep, rp, rdCost, oilx, tribute, skim, net: gross - rdCost - upkeep + oilx + tribute - skim, fuel: fuelIn - fuelUse, mp: mpGain, blockaded: blk, ports, sanc: pen };
}
function startPhase(n) {
  const N = G.nations[n];
  processTransit(n);
  processQueue(n);
  const winter = [12, 1, 2].includes(curMonth());
  for (const u of G.units.slice()) {
    if (u.n !== n) continue;
    const C = CLASSES[u.t];
    if (!u.moved && !u.acted) {
      let h = 10 + (has(n, 'logi') ? 5 : 0);
      const o = tileOwner(u.pos);
      if (C.dom !== 'land' || o === n) h += 5;
      if (W.tiles[u.pos].city >= 0 && friendly(n, o)) h += 10;
      if (C.dom === 'sea' && !W.tiles[u.pos].land) h = 5;
      u.hp = Math.min(100, u.hp + h);
      u.fort = Math.min(2, u.fort + 1);
    } else u.fort = 0;
    if (!supplied(u)) u.hp -= 8;
    if ((G.fallout[u.pos] ?? -1) >= G.turn) u.hp -= 15;
    if (winter && C.dom === 'land' && W.tiles[u.pos].city < 0) {
      const o = tileOwner(u.pos);
      if (o && o !== n && hasTrait(o, 'general_winter') && atWar(n, o)) u.hp -= 10;
    }
    if (u.hp <= 0) { killUnit(u, null, '보급 두절·혹한·방사능으로 와해'); continue; }
    u.mv = mvMax(u);
    if (C.fuel > 0 && N.fuel <= 0 && C.dom !== 'air') u.mv = Math.max(1, Math.floor(u.mv / 2));
    u.acted = false; u.moved = false;
  }
  for (const cy of citiesOf(n)) {
    const c = G.cities[cy.id];
    c.rec = 0;
    if (c.pop < 4 && c.fort === 0) continue;
    let g = null;
    for (const k of W.tiles[cy.tile].nb) { const x = groundAt(k); if (x && atWar(n, x.n) && (!g || x.hp < g.hp)) g = x; }
    if (!g) continue;
    const d = Math.round((6 + c.fort * 4) * (0.5 + c.hp / 200));
    g.hp -= d;
    Hooks.fx({ k: 'dmg', i: g.pos, text: `-${d}` });
    if (g.hp <= 0) killUnit(g, n, `${cy.name} 수비대 포격으로 격파`);
  }
}
function endRound() {
  updateSanctions();
  for (const n of activeNations()) {
    const N = G.nations[n];
    const e = economyPreview(n);
    N.last = e;
    N.money = Math.round((N.money + e.net) * 10) / 10;
    if (N.money < 0) N.stab = clamp(N.stab - 1.5, 0, 100);
    N.fuel = clamp(N.fuel + e.fuel, -20, 300);
    N.manpower = Math.round(N.manpower + e.mp);
    N.incomeMult = 1;
    if (N.research) {
      N.progress[N.research] = (N.progress[N.research] || 0) + e.rp;
      const T = TECH_BY_ID[N.research];
      if (N.progress[N.research] >= T.cost) {
        N.techs.push(T.id); delete N.progress[T.id];
        if (NATIONS[n].tier === 'major' || n === G.player) logMsg(`[${nName(n)}] 기술 개발 완료: ${T.name}`, 'tech', n);
        N.research = null;
        if (n !== G.player) pickResearch(n);
      }
    }
    const wars = enemiesOf(n).length;
    let ds = -Math.min(0.8, 0.25 * wars) * (hasTrait(n, 'opinion') ? 1.4 : 1) * (flag(n, 'propaganda') ? 0.5 : 1);
    if (e.ports) ds -= 1.5 * e.blockaded / e.ports;
    if (N.fuel <= 0) ds -= 2;
    ds -= 0.3 * W.cities.filter(c => c.nat === n && G.cities[c.id].owner !== n).length;
    if (!wars) ds += N.stab < NATIONS[n].stab + 8 ? 0.6 : 0;
    if (wars && N.stab < 40) ds += 0.4;
    ds -= e.sanc * 4;
    N.stab = clamp(N.stab + ds, 0, 100);
    if (n === G.player) { politicsTurn(n); cabinetTurn(); N.slush = (N.slush || 0) + e.skim; } else aiPoliticsTurn(n);
    N.rep = clamp(N.rep + (N.rep < 0 ? 0.3 : -0.1), -100, 100);
    if (N.cyberCd > 0) N.cyberCd--;
    if (N.aidCd > 0) N.aidCd--;
    if (n === 'PRK' && G.turn % 2 === 0) N.arsenal.kn23 = (N.arsenal.kn23 || 0) + 1;
    if (n === 'RUS' && wars && G.turn % 4 === 0) {
      const cap = capitalOf('RUS'); const j = cap ? freeSlotNear('RUS', cap.tile, 'land', 2) : -1;
      if (j >= 0) { addUnit('RUS', G.turn % 8 === 0 ? 'mbt' : 'mech', j, true); logMsg('[러시아] 시베리아·볼가 동원 부대 도착', 'sys', 'RUS'); }
    }
  }
  G.cities.forEach((c, ci) => {
    const threatened = W.tiles[W.cities[ci].tile].nb.some(k => { const g = groundAt(k); return g && atWar(c.owner, g.n); });
    c.hp = Math.min(100, c.hp + (threatened ? 4 : 12));
  });
  for (const u of G.units) u.icp = false;
  for (const a of NATION_IDS) for (const b of NATION_IDS) if (a < b && !atWar(a, b) && !G.ally[pk(a, b)]) {
    const k = pk(a, b), r = G.rel[k] ?? 0;
    const target = (G.nations[a].rep + G.nations[b].rep) * 0.1;
    G.rel[k] = r + clamp(target - r, -0.3, 0.3);
  }
  processUN();
  scenarioTriggers();
  coalitionCheck();
  for (const n of activeNations()) checkCapitulation(n, null);
  for (const [t, until] of Object.entries(G.fallout)) if (until < G.turn) delete G.fallout[t];
  G.turn++;
  cache.supply = {}; cache.comp = {};
  snapshotHist();
}
function scenarioTriggers() {
  // Western aid to Ukraine while the West itself is not at war with Russia
  if (atWar('RUS', 'UKR') && G.turn % 3 === 0) {
    const donors = ['USA', 'GBR', 'DEU', 'POL', 'FRA'].filter(d => !G.nations[d].capitulated && rel(d, 'UKR') >= 40 && !atWar(d, 'RUS'));
    if (donors.length) {
      const U = G.nations.UKR; U.money += 20 * donors.length;
      const hub = W.cities.find(c => c.name === '르비우');
      if (hub && G.cities[hub.id].owner === 'UKR') for (const t of ['spg', 'sam', 'mbt'].slice(0, Math.min(3, donors.length - 1))) { const j = freeSlotNear('UKR', hub.tile, 'land', 3); if (j >= 0) addUnit('UKR', t, j, false); }
      if (G.turn % 6 === 0) logMsg(`[${donors.map(nName).join('·')}] 우크라이나 군사지원 패키지 전달 (제슈프 허브 경유)`, 'diplo', donors[0]);
    }
  }
  if (G.scen === 'korea' && !G.flags.chinaIn && !G.nations.CHN.capitulated && !G.nations.PRK.capitulated && G.player !== 'CHN') {
    const prkLost = W.cities.filter(c => c.nat === 'PRK' && G.cities[c.id].owner !== 'PRK').length;
    const deep = G.units.some(u => (u.n === 'KOR' || u.n === 'USA') && W.tiles[u.pos].nat === 'PRK' && W.tiles[u.pos].lat > 39.6);
    if (prkLost >= 3 || deep) {
      G.flags.chinaIn = true;
      for (const e of ['KOR', 'USA']) if (!atWar('CHN', e)) { delete G.ally[pk('CHN', e)]; G.war[pk('CHN', e)] = 1; G.rel[pk('CHN', e)] = -80; }
      logMsg('[중국] 항미원조 — 조중우호조약에 따라 한반도 전쟁 개입', 'war', 'CHN');
      for (const nm of ['단둥', '선양']) {
        const cy = W.cities.find(c => c.name === nm);
        if (G.cities[cy.id].owner !== 'CHN') continue;
        for (const t of ['inf', 'inf', 'mech', 'mbt']) { const j = freeSlotNear('CHN', cy.tile, 'land', 3); if (j >= 0) addUnit('CHN', t, j, false); }
      }
      cache.supply = {};
    }
  }
}
function snapshotHist() {
  const row = { t: G.turn };
  for (const n of MAJOR_IDS) row[n] = { c: citiesOf(n).length, s: Math.round(G.nations[n].stab) };
  const Pn = G.nations[G.player];
  row.me = { m: Math.round(Pn.money), s: Math.round(Pn.stab), c: controlled(G.player), p: Math.round(Pn.power), slush: Math.round(Pn.slush || 0) };
  G.hist.push(row);
  if (G.hist.length > 200) G.hist.shift();
}
const GENERIC_EVENTS = [
  { title: '유엔 안보리 긴급회의', text: '안보리가 즉각 휴전 결의안을 상정했습니다.', choices: [{ label: '결의 지지', fx: { stab: -2, rep: 8 } }, { label: '결의 거부', fx: { stab: 3, rep: -6, fac: { army: 4 } } }] },
  { title: '전시 국채 발행', text: '재무부가 대규모 전시 국채 발행을 건의했습니다.', choices: [{ label: '발행', fx: { money: 90, stab: -3, fac: { people: -4 } } }, { label: '보류', fx: {} }] },
  { title: '전력망 사이버 공격', text: '정체불명의 해커 집단이 전력망 제어 시스템에 침입했습니다.', choices: [{ label: '긴급 복구 (30억$)', fx: { money: -30 } }, { label: '자연 복구 대기', fx: { stab: -3, fac: { people: -4, biz: -4 } } }] },
  { title: '국제 유가 급등', text: '호르무즈 해협 긴장으로 유가가 배럴당 140달러를 넘었습니다.', choices: [{ label: '전략비축유 방출', fx: { fuel: 25 } }, { label: '민간 배급제', fx: { fuel: 40, fac: { people: -8 } } }] },
  { title: '대규모 반전 시위', text: '수도 중심가에서 수십만 명이 전쟁 중단을 요구합니다.', choices: [{ label: '평화 의지 표명', fx: { fac: { people: 8, army: -5 }, rep: 3 } }, { label: '강제 해산', fx: { fac: { people: -10, sec: 5 }, rep: -5, power: 4 } }] },
  { title: '고위 장교 망명', text: '적국 작전참모가 기밀 문서를 들고 망명을 요청했습니다.', choices: [{ label: '수용', fx: { special: 'research', rep: -2 } }, { label: '송환', fx: { rep: 3 } }] },
  { title: '방산 수출 기회', text: '중동 국가가 대규모 무기 구매를 제안했습니다.', choices: [{ label: '계약', fx: { money: 70, fac: { biz: 6 }, rep: -2 } }, { label: '거절', fx: { rep: 2 } }] },
  { title: '지도자 건강 이상설', text: '외신이 지도자의 건강 이상설을 보도했습니다. 권력 서열에 관심이 쏠립니다.', choices: [{ label: '공개 행사로 불식', fx: { money: -10, fac: { party: 4 } } }, { label: '보도 통제', fx: { fac: { sec: 4, people: -3 }, power: 3 } }] },
];
function rollEvent(n) {
  if (Math.random() > (n === G.player ? 0.35 : 0.1)) return null;
  const nat = NATION_EVENTS.filter(e => e.n.includes(n));
  if (nat.length && Math.random() < 0.55) return nat[Math.floor(Math.random() * nat.length)];
  return GENERIC_EVENTS[Math.floor(Math.random() * GENERIC_EVENTS.length)];
}
function applyEvent(n, ev, idx) {
  const ch = ev.choices[idx ?? Math.floor(Math.random() * ev.choices.length)];
  applyFx(n, ch.fx);
  if (n === G.player || NATIONS[n].tier === 'major') logMsg(`[${nName(n)}] ${ev.title} → ${ch.label}`, 'event', n);
}

// ---------- build queue & refits ----------
const BUILD_TURNS = { cv: 4, ssbn: 3, ssn: 2, bmr: 2, dd: 2, lhd: 2, ss: 2 };
function processQueue(n) {
  for (const q of G.queue.slice()) {
    if (q.n !== n || q.done > G.turn) continue;
    const cy = W.cities[q.ci];
    if (G.cities[q.ci].owner !== n) { G.queue.splice(G.queue.indexOf(q), 1); logMsg(`[${nName(n)}] ${cy.name} 조선소 함락 — 건조 중이던 ${CLASSES[q.t].name} 손실`, 'loss', n); continue; }
    const j = freeSlotNear(n, cy.tile, CLASSES[q.t].dom, 2);
    if (j < 0) continue;
    G.queue.splice(G.queue.indexOf(q), 1);
    const u = addUnit(n, q.t, j, true);
    if (n === G.player || NATIONS[n].tier === 'major' && (q.t === 'cv' || q.t === 'ssbn')) logMsg(`[${nName(n)}] ${cy.name}: ${dsg(u).name} 취역`, 'tech', n);
  }
}
function modernizeCost(u) { return Math.round(CLASSES[u.t].cost * 0.4); }
function modernizeCheck(u) {
  const best = bestDesign(u.n, u.t), cur = dsg(u);
  if (!best || best.id === u.d || best.q <= cur.q + 0.01) return { ok: false, why: '최신 설계' };
  if (u.acted || u.moved) return { ok: false, why: '이번 턴 행동함' };
  const ci = W.tiles[u.pos].city;
  if (ci < 0 || G.cities[ci].owner !== u.n) return { ok: false, why: '자국 도시·항구에서만' };
  if (G.nations[u.n].money < modernizeCost(u)) return { ok: false, why: '예산 부족' };
  return { ok: true, to: best, cost: modernizeCost(u) };
}
function modernize(u) {
  const c = modernizeCheck(u);
  if (!c.ok) return false;
  G.nations[u.n].money -= c.cost;
  const from = dsg(u).name;
  u.d = c.to.id; u.acted = true; u.moved = true; u.mv = 0;
  if (u.n === G.player) logMsg(`[${nName(u.n)}] ${from} → ${c.to.name} 개량 완료`, 'tech', u.n);
  return true;
}

// ---------- cabinet & slush fund (player regime only) ----------
function postTitle(n, post) { return (POST_TITLES[n] || {})[post] || POSTS.find(p => p.id === post).name; }
function makePerson(n, post) {
  const pool = NAME_POOLS[CULTURE[n] || 'we'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const sur = pick(pool.sur), giv = pick(pool.given);
  const keys = Object.keys(MINISTER_TRAITS);
  let trait = pick(keys);
  if (trait === 'strategist' && post !== 'chief') trait = pick(['loyal', 'hawk', 'technocrat']);
  const r = Math.random();
  const skill = r < 0.12 ? 1 : r < 0.88 ? 2 + Math.floor(Math.random() * 3) : 5;
  return {
    id: G.nextPid++, name: pool.order === 'sg' ? sur + giv : `${giv} ${sur}`, post, fac: POSTS.find(p => p.id === post).fac, skill,
    loyalty: Math.round(45 + Math.random() * 35), ambition: Math.round(trait === 'ambitious' ? 60 + Math.random() * 30 : 15 + Math.random() * 55), trait, since: G.turn, age: 45 + Math.floor(Math.random() * 25),
  };
}
function initCabinet(n) { G.cabinet = {}; for (const p of POSTS) G.cabinet[p.id] = makePerson(n, p.id); }
function mSkill(n, post) {
  if (!G || !G.cabinet || n !== G.player) return 0;
  const m = G.cabinet[post];
  if (!m) return -2;
  let s = m.skill - 3;
  if (m.trait === 'technocrat') s++;
  if (m.trait === 'inept' || m.trait === 'corrupt') s--;
  return s;
}
function candidates(post) {
  if (!G.cand[post] || G.cand[post].t !== G.turn) G.cand[post] = { t: G.turn, list: [0, 1, 2].map(() => makePerson(G.player, post)) };
  return G.cand[post].list;
}
function appoint(post, idx) {
  const list = candidates(post), c = list[idx], N = G.nations[G.player];
  if (!c) return false;
  const old = G.cabinet[post];
  if (old) N.fac[old.fac] = clamp(N.fac[old.fac] - 5, 0, 100);
  c.since = G.turn; G.cabinet[post] = c; list.splice(idx, 1);
  logMsg(`[${nName(G.player)}] ${postTitle(G.player, post)} ${old ? `${old.name} 경질, ` : ''}${c.name} 임명`, 'decree', G.player);
  return true;
}
function purgeMinister(post) {
  const m = G.cabinet[post], N = G.nations[G.player];
  if (!m) return false;
  N.fac[m.fac] = clamp(N.fac[m.fac] - 10, 0, 100); N.power = clamp(N.power + 6, 0, 100); N.rep = clamp(N.rep - 3, -100, 100);
  for (const o of Object.values(G.cabinet)) if (o && o !== m) { o.loyalty = clamp(o.loyalty + 8, 0, 100); o.ambition = clamp(o.ambition - 10, 0, 100); }
  G.cabinet[post] = null;
  logMsg(`[${nName(G.player)}] ${postTitle(G.player, post)} ${m.name} 숙청 — 반역 혐의로 체포`, 'decree', G.player);
  if (m.fac === 'army' && N.fac.army < 35 && Math.random() < 0.3) G.flags.forceCoup = true;
  return true;
}
function bribeMinister(post) {
  const m = G.cabinet[post], N = G.nations[G.player];
  if (!m || (N.slush || 0) < 30) return false;
  N.slush -= 30; m.loyalty = clamp(m.loyalty + 20, 0, 100);
  return true;
}
function bribeFaction(f) {
  const N = G.nations[G.player];
  if ((N.slush || 0) < 40) return false;
  N.slush -= 40; N.fac[f] = clamp(N.fac[f] + 10, 0, 100);
  logMsg(`[${nName(G.player)}] ${factionLabel(G.player, f)} 핵심 인사들에게 비밀 자금 전달`, 'decree', G.player);
  return true;
}
function cabinetTurn() {
  const N = G.nations[G.player];
  for (const p of POSTS) {
    const m = G.cabinet[p.id];
    if (!m) continue;
    m.loyalty += ((N.power + N.fac[m.fac]) / 2 - m.loyalty) * 0.05 + (m.trait === 'loyal' ? 1 : 0) - (m.ambition > 70 ? 0.5 : 0);
    if (m.trait === 'ambitious') m.ambition += 0.6;
    if (N.stab < 35) m.ambition += 0.8;
    m.loyalty = clamp(m.loyalty, 0, 100); m.ambition = clamp(m.ambition, 0, 100);
    if (m.trait === 'corrupt') N.slush = (N.slush || 0) + 3;
    if (m.trait === 'demagogue') N.fac.people = clamp(N.fac.people + 0.5, 0, 100);
    if (m.trait === 'hawk') { N.fac.army = clamp(N.fac.army + 0.3, 0, 100); N.rep = clamp(N.rep - 0.2, -100, 100); }
  }
}
function plotters() { return POSTS.map(p => G.cabinet[p.id]).filter(m => m && m.ambition - m.loyalty > 25); }
function cabinetCoupRisk() {
  let r = 0;
  for (const m of Object.values(G.cabinet || {})) if (m && (m.fac === 'army' || m.fac === 'sec')) r += Math.max(0, m.ambition - m.loyalty) / 400;
  return r;
}
