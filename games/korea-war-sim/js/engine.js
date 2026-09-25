// 한반도 대전략 — rules engine (world generation, state, movement, combat, economy, diplomacy)
'use strict';

const NB = [
  [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]],  // even rows: E NE NW W SW SE
  [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]],    // odd rows
];
const TERRAIN = {
  plain:  { name: '평야', cost: 1, def: 1.0 },
  forest: { name: '삼림', cost: 2, def: 1.25 },
  hill:   { name: '구릉', cost: 2, def: 1.25 },
  mount:  { name: '산악', cost: 3, def: 1.5 },
  sea:    { name: '해양', cost: 1, def: 1.0 },
};
const INF = 1e9;
const Hooks = { log() {}, fx() {}, changed() {} };
const W = { tiles: [], cities: [], N: HEX.W * HEX.H };
let G = null;
let OG = null, OS = null;            // occupancy: ground / ship unit id per tile
const uById = new Map();
const cache = { supply: {} };

// ---------- geometry helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function tileIdx(c, r) { return (c < 0 || r < 0 || c >= HEX.W || r >= HEX.H) ? -1 : r * HEX.W + c; }
function tileLonLat(c, r) { return [HEX.LON0 + (c + 0.5 * (r & 1)) * HEX.DLON, HEX.LAT0 - r * HEX.DLAT]; }
function lonLatToCR(lon, lat) {
  const r = Math.round((HEX.LAT0 - lat) / HEX.DLAT);
  return [Math.round((lon - HEX.LON0) / HEX.DLON - 0.5 * (r & 1)), r];
}
function pip(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function cube(i) { const c = i % HEX.W, r = (i / HEX.W) | 0; return [c - (r - (r & 1)) / 2, r]; }
function hexDist(a, b) {
  const [ax, az] = cube(a), [bx, bz] = cube(b);
  const dx = ax - bx, dz = az - bz;
  return Math.max(Math.abs(dx), Math.abs(dz), Math.abs(dx + dz));
}
function tilesWithin(i, rad) {
  const t = W.tiles[i], out = [];
  for (let r = t.r - rad; r <= t.r + rad; r++) for (let c = t.c - rad - 1; c <= t.c + rad + 1; c++) {
    const j = tileIdx(c, r);
    if (j >= 0 && hexDist(i, j) <= rad) out.push(j);
  }
  return out;
}
function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sm = t => t * t * (3 - 2 * t);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  const u = sm(xf), v = sm(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function mdlLat(lon) {
  for (let k = 1; k < MDL.length; k++) {
    const [x0, y0] = MDL[k - 1], [x1, y1] = MDL[k];
    if (lon <= x1) return y0 + (y1 - y0) * Math.max(0, lon - x0) / (x1 - x0);
  }
  return MDL[MDL.length - 1][1];
}
function segDistKm(lon, lat, a, b) {
  const k = Math.cos(lat * Math.PI / 180) * 111;
  const px = lon * k, py = lat * 111, ax = a[0] * k, ay = a[1] * 111, bx = b[0] * k, by = b[1] * 111;
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  const t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

// ---------- world generation (deterministic, not saved) ----------
function buildWorld() {
  const T = [];
  for (let r = 0; r < HEX.H; r++) for (let c = 0; c < HEX.W; c++) {
    const [lon, lat] = tileLonLat(c, r);
    let land = false, nat = null;
    for (const L of LANDS) if (pip(lon, lat, L.pts)) { land = true; nat = L.nat || null; break; }
    T.push({ i: T.length, c, r, lon, lat, land, nat, terrain: 'sea', nb: [], nbDir: [], coast: false, city: -1, home: -1 });
  }
  W.tiles = T;
  for (const t of T) {
    NB[t.r & 1].forEach(([dc, dr], d) => { const j = tileIdx(t.c + dc, t.r + dr); if (j >= 0) { t.nb.push(j); t.nbDir.push(d); } });
  }
  for (const [lon, lat, nat] of FORCED_LAND) { const [c, r] = lonLatToCR(lon, lat); const t = T[tileIdx(c, r)]; t.land = true; t.nat = nat; }
  for (const t of T) if (t.land && !t.nat) t.nat = pip(t.lon, t.lat, KOREA_REGION) ? (t.lat > mdlLat(t.lon) ? 'PRK' : 'KOR') : pip(t.lon, t.lat, RUSSIA_REGION) ? 'RUS' : 'CHN';

  const hasSea = j => T[j].nb.some(k => !T[k].land);
  W.cities = [];
  CITY_DATA.forEach(([name, nat, lon, lat, pop, ind, port, flags], id) => {
    let [c, r] = lonLatToCR(lon, lat);
    const start = tileIdx(clamp(c, 0, HEX.W - 1), clamp(r, 0, HEX.H - 1));
    let best = -1, bs = INF;
    for (const j of tilesWithin(start, 2)) {
      const t = T[j];
      if (t.city >= 0 || t.nb.some(k => T[k].city >= 0)) continue;
      let s = hexDist(start, j) * 10;
      if (!t.land) s += port ? 6 : 16; else if (t.nat !== nat) s += 9;
      if (port && !hasSea(j)) s += 8;
      if (s < bs) { bs = s; best = j; }
    }
    if (best < 0) best = start;
    const t = T[best]; t.land = true; t.nat = nat; t.city = id;
    W.cities.push({ id, name, nat, tile: best, pop, ind, port: !!port, cap: flags.includes('C'), base: flags.includes('B'), lon, lat });
  });
  for (const t of T) t.coast = t.land && t.nb.some(k => !T[k].land);

  for (const t of T) {
    if (!t.land) continue;
    let d = INF;
    for (const R of RIDGES) for (let k = 1; k < R.length; k++) d = Math.min(d, segDistKm(t.lon, t.lat, R[k - 1], R[k]));
    const n = vnoise(t.c * 0.35, t.r * 0.35, 7);
    const f = vnoise(t.c * 0.5 + 40, t.r * 0.5, 13);
    const wooded = t.lat > 41.5 || t.nat === 'JPN' || t.nat === 'PRK';
    if (d < 30 + n * 30) t.terrain = 'mount';
    else if (d < 80 + n * 45) t.terrain = 'hill';
    else if (f > (wooded ? 0.5 : 0.74)) t.terrain = 'forest';
    else t.terrain = 'plain';
  }
  for (const t of T) {
    if (!t.land) continue;
    let best = -1, bd = INF;
    for (const cy of W.cities) {
      if (cy.nat !== t.nat) continue;
      const d = hexDist(t.i, cy.tile) + cy.id * 1e-4;
      if (d < bd) { bd = d; best = cy.id; }
    }
    t.home = best;
  }
  OG = new Int32Array(W.N).fill(-1);
  OS = new Int32Array(W.N).fill(-1);
}

// ---------- relations ----------
const pk = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const atWar = (a, b) => a !== b && !!G.war[pk(a, b)];
const allied = (a, b) => a === b || !!G.ally[pk(a, b)];
const friendly = (a, b) => a === b || allied(a, b);
function rel(a, b) { return G.rel[pk(a, b)] ?? 0; }
function addRel(a, b, d) { if (a === b) return; const k = pk(a, b); G.rel[k] = clamp((G.rel[k] ?? 0) + d, -100, 100); }
function enemiesOf(n) { return NATION_IDS.filter(o => atWar(n, o)); }
function activeNations() { return NATION_IDS.filter(n => G.nations[n].alive); }
const has = (n, tech) => G.nations[n].techs.includes(tech);
const nName = n => NATIONS[n].short;

// ---------- occupancy ----------
function reindex() {
  OG.fill(-1); OS.fill(-1); uById.clear();
  for (const u of G.units) {
    uById.set(u.id, u);
    if (UNITS[u.t].dom === 'air') continue;
    if (UNITS[u.t].dom === 'sea') OS[u.pos] = u.id; else OG[u.pos] = u.id;
  }
}
const groundAt = i => OG[i] >= 0 ? uById.get(OG[i]) : null;
const shipAt = i => OS[i] >= 0 ? uById.get(OS[i]) : null;
const airAt = i => G.units.filter(u => u.pos === i && UNITS[u.t].dom === 'air');
function tileOwner(i) { const t = W.tiles[i]; return t.home >= 0 ? G.cities[t.home].owner : null; }
function cityAt(i) { return W.tiles[i].city; }

function addUnit(n, t, pos, fresh = true) {
  const u = { id: G.nextId++, t, n, pos, hp: 100, mv: fresh ? 0 : UNITS[t].mv + mvBonus(n, t), acted: fresh, moved: fresh, fort: 0, xp: 0, emb: false, icp: false };
  G.units.push(u); uById.set(u.id, u);
  if (UNITS[t].dom === 'sea') OS[pos] = u.id; else if (UNITS[t].dom === 'land') OG[pos] = u.id;
  return u;
}
function removeUnit(u) {
  G.units.splice(G.units.indexOf(u), 1); uById.delete(u.id);
  if (OS[u.pos] === u.id) OS[u.pos] = -1;
  if (OG[u.pos] === u.id) OG[u.pos] = -1;
}
function placeUnitAt(u, j) {
  if (OS[u.pos] === u.id) OS[u.pos] = -1;
  if (OG[u.pos] === u.id) OG[u.pos] = -1;
  u.pos = j;
  const dom = UNITS[u.t].dom;
  if (dom === 'sea') OS[j] = u.id;
  else if (dom === 'land') { OG[j] = u.id; u.emb = !W.tiles[j].land; }
}
function mvBonus(n, t) { return (t === 'ss' && has(n, 'aip')) ? 1 : 0; }

// Find a free slot for a new unit near a tile
function freeSlotNear(n, tile, dom, maxR = 3) {
  if (dom === 'air') {
    const ci = cityAt(tile);
    return (ci >= 0 && airAt(tile).length < 4) ? tile : -1;
  }
  const cand = tilesWithin(tile, maxR).sort((a, b) => hexDist(tile, a) - hexDist(tile, b));
  for (const j of cand) {
    const t = W.tiles[j];
    if (dom === 'land') {
      if (t.land && OG[j] < 0 && friendly(n, tileOwner(j))) return j;
    } else {
      if (!t.land && OG[j] < 0 && OS[j] < 0) return j;
      if (t.city >= 0 && W.cities[t.city].port && OS[j] < 0 && friendly(n, tileOwner(j))) return j;
    }
  }
  return -1;
}

// ---------- new game / save ----------
function newGame(scenId, player, opts = {}) {
  const sc = SCENARIOS.find(s => s.id === scenId);
  G = {
    v: 1, turn: 1, maxTurn: opts.maxTurn || 60, year: sc.year, month: sc.month, scen: sc.id, player,
    fog: opts.fog !== false, diff: opts.diff || 'normal',
    nations: {}, cities: W.cities.map(c => ({ owner: c.nat, hp: 100, pop: c.pop, fort: c.cap ? 1 : 0, factory: 0, sam: c.cap ? 1 : 0, rec: 0 })),
    units: [], nextId: 1, war: {}, ally: {}, rel: {}, truce: {}, log: [], over: null, flags: {}, pending: [], hist: [],
  };
  for (const id of NATION_IDS) {
    const N = NATIONS[id];
    const alive = id !== 'USA' || sc.usa;
    const capital = W.cities.find(c => c.nat === id && c.cap);
    G.nations[id] = {
      id, alive, money: N.money, manpower: N.manpower, fuel: 40, missiles: N.missiles, stab: N.stab,
      techs: N.techs.slice(), research: null, progress: {}, rd: 0.2, capital: capital ? capital.id : -1,
      capitulated: false, incomeMult: 1, cyberCd: 0, aidCd: 0, diploCd: {}, losses: 0, kills: 0, taken: 0, lost: 0,
      last: { gross: 0, upkeep: 0, net: 0, fuel: 0, mp: 0, rp: 0, blockaded: 0 },
    };
  }
  const alive = activeNations();
  if (sc.wars === 'all') { for (const a of alive) for (const b of alive) if (a < b) G.war[pk(a, b)] = 1; }
  else for (const [a, b] of sc.wars) if (G.nations[a].alive && G.nations[b].alive) G.war[pk(a, b)] = 1;
  for (const [a, b] of sc.alliances) if (G.nations[a].alive && G.nations[b].alive) G.ally[pk(a, b)] = 1;
  for (const a of NATION_IDS) for (const b of NATION_IDS) if (a < b) {
    const k = pk(a, b);
    G.rel[k] = G.war[k] ? -70 : G.ally[k] ? 70 : 0;
  }
  Object.assign(G.rel, sc.relations);
  reindex();
  for (const id of alive) {
    for (const [cname, list] of FORCES[id] || []) {
      const cy = W.cities.find(c => c.name === cname);
      if (!cy || !friendly(id, G.cities[cy.id].owner)) continue;
      for (const t of list) {
        const j = freeSlotNear(id, cy.tile, UNITS[t].dom, 3);
        if (j >= 0) addUnit(id, t, j, false);
      }
    }
  }
  if (G.diff !== 'easy') {
    const bonus = G.diff === 'hard' ? 1.35 : 1.0;
    for (const id of alive) if (id !== player) G.nations[id].money = Math.round(G.nations[id].money * bonus);
  }
  if (G.diff === 'easy') G.nations[player].money += 120;
  for (const id of alive) pickResearch(id);
  G.flags.firstStrike = sc.id === 'crisis';
  cache.supply = {};
  logMsg(`${sc.name} — ${G.year}년 ${G.month}월. ${NATIONS[player].name} 지휘를 시작합니다.`, 'sys');
  snapshotHist();
  return G;
}
function serialize() { return JSON.parse(JSON.stringify(G)); }
function loadGame(obj) { G = obj; reindex(); cache.supply = {}; }

function logMsg(text, kind = 'info', who = null) {
  G.log.push({ t: G.turn, text, kind, who });
  if (G.log.length > 400) G.log.splice(0, G.log.length - 400);
  Hooks.log(text, kind, who);
}
function dateLabel(turn = G.turn) {
  const m0 = G.month - 1 + (turn - 1);
  return `${G.year + Math.floor(m0 / 12)}년 ${(m0 % 12) + 1}월`;
}

// ---------- supply & visibility ----------
function supplyMap(n) {
  if (cache.supply[n]) return cache.supply[n];
  const m = new Uint8Array(W.N);
  const R = 4 + (has(n, 'logi') ? 2 : 0);
  for (const cy of W.cities) {
    if (!friendly(n, G.cities[cy.id].owner)) continue;
    for (const j of tilesWithin(cy.tile, R)) m[j] = 1;
  }
  for (const t of W.tiles) if (t.land && friendly(n, tileOwner(t.i))) m[t.i] = 1;
  return (cache.supply[n] = m);
}
function supplied(u) {
  const dom = UNITS[u.t].dom;
  if (dom !== 'land' || u.emb) return true;
  return !!supplyMap(u.n)[u.pos];
}
function visionFor(n) {
  const v = new Uint8Array(W.N);
  const mark = (i, r) => { for (const j of tilesWithin(i, r)) v[j] = 1; };
  for (const u of G.units) {
    if (!friendly(n, u.n)) continue;
    const U = UNITS[u.t];
    mark(u.pos, U.dom === 'air' ? 3 : U.vis + (u.t === 'sof' && has(u.n, 'sof2') ? 1 : 0));
  }
  for (const cy of W.cities) if (friendly(n, G.cities[cy.id].owner)) mark(cy.tile, 2);
  return v;
}
function unitVisible(u, n, vis) {
  if (friendly(n, u.n)) return true;
  if (!vis[u.pos]) return false;
  if (UNITS[u.t].stealth) {
    return G.units.some(o => friendly(n, o.n) && UNITS[o.t].dom !== 'air' && (hexDist(o.pos, u.pos) <= 1 || (o.t === 'dd' && hexDist(o.pos, u.pos) <= 2)));
  }
  return true;
}

// ---------- movement ----------
function enemyBlocks(u, j) {
  const g = groundAt(j), s = shipAt(j);
  if (g && !friendly(u.n, g.n)) return true;
  if (s && !friendly(u.n, s.n)) return true;
  return false;
}
function zocAt(n, j) {
  for (const k of W.tiles[j].nb) { const g = groundAt(k); if (g && !g.emb && atWar(n, g.n)) return true; }
  return false;
}
// returns cost, INF, or -1 for "uses all remaining" (embark/disembark)
function stepCost(u, from, to) {
  const U = UNITS[u.t], t = W.tiles[to];
  if (U.dom === 'sea') {
    if (!t.land) return 1;
    if (t.city < 0 || !W.cities[t.city].port) return INF;
    return friendly(u.n, tileOwner(to)) ? 1 : INF;
  }
  if (!t.land) {
    if (u.emb) return 1;
    const f = W.tiles[from];
    return (f.city >= 0 && W.cities[f.city].port && friendly(u.n, tileOwner(from))) ? -1 : INF;
  }
  const o = tileOwner(to);
  if (o && !friendly(u.n, o) && !atWar(u.n, o)) return INF;
  if (t.city >= 0 && !friendly(u.n, o)) return INF;
  if (u.emb) return -1;
  if (t.city >= 0) return 1;
  let c = TERRAIN[t.terrain].cost;
  if (U.climber) c = t.terrain === 'mount' ? 2 : 1;
  return c;
}
function reachable(u) {
  const res = new Map();
  if (u.mv <= 0 || UNITS[u.t].dom === 'air') return res;
  const U = UNITS[u.t];
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
      let left = c < 0 ? 0 : Math.max(0, cr.left - c);
      let stop = c < 0;
      if (U.dom === 'land' && W.tiles[j].land && !U.noZoc && zocAt(u.n, j)) { left = 0; stop = true; }
      const ex = res.get(j);
      if (!ex || left > ex.left) { res.set(j, { left, prev: cur, stop }); open.push(j); }
    }
  }
  return res;
}
function canEnd(u, j) {
  if (j === u.pos) return true;
  const dom = UNITS[u.t].dom, t = W.tiles[j];
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
function morale(n) { return 0.8 + 0.4 * G.nations[n].stab / 100; }
function unitStr(u, role, vs) {
  const U = UNITS[u.t];
  let s = role === 'atk' ? U.atk : U.def;
  const n = u.n;
  if (u.t === 'armor' && role === 'atk' && has(n, 'mbt3')) s *= 1.2;
  if (U.dom === 'land' && has(n, 'ncw')) s *= 1.1;
  if (u.t === 'sof' && role === 'atk' && has(n, 'sof2')) s *= 1.3;
  if (u.t === 'ftr' && has(n, 'stealth')) s *= 1.25;
  if (u.t === 'dd' && role === 'def' && has(n, 'aegis')) s *= 1.25;
  if (u.t === 'ss' && role === 'atk' && has(n, 'aip')) s *= 1.25;
  if (vs) {
    const V = UNITS[vs.t];
    if (u.t === 'ss' && V.dom === 'sea') s *= 1.3;
    if (u.t === 'aa' && V.dom === 'air') s *= 3;
    if (U.dom === 'sea' && vs.emb) s *= 1.5;
  }
  if (u.emb) s = role === 'def' ? 4 : s * 0.6;
  s *= 0.55 + 0.45 * u.hp / 100;
  s *= 1 + 0.1 * vet(u);
  s *= morale(n);
  if (!supplied(u)) s *= 0.7;
  if (U.fuel > 0 && G.nations[n].fuel <= 0) s *= 0.7;
  if (role === 'def' && U.dom === 'land' && !u.emb) {
    const t = W.tiles[u.pos];
    s *= t.city >= 0 ? 1.25 + 0.15 * G.cities[t.city].fort : TERRAIN[t.terrain].def;
    if (u.fort > 0) s *= 1.2;
  }
  return Math.max(0.5, s);
}
function cityStr(ci) {
  const c = G.cities[ci];
  return Math.max(1, (8 + c.pop * 1.4 + c.fort * 6) * (0.4 + 0.6 * c.hp / 100) * morale(c.owner));
}
function flank(n, j, exceptId) {
  let k = 0;
  for (const nb of W.tiles[j].nb) { const g = groundAt(nb); if (g && g.id !== exceptId && g.n === n && !g.emb) k++; }
  return 1 + 0.1 * Math.min(3, k);
}
function dmgPair(A, D, ranged) {
  const r = A / D;
  return { def: clamp(30 * Math.pow(r, 1.15), 2, 100), att: ranged ? 0 : clamp(30 * Math.pow(1 / r, 1.15), 1, 100) };
}
function isRanged(u) { const U = UNITS[u.t]; return U.rng > 0; }

// what an attack on tile j would hit
function targetAt(u, j) {
  const U = UNITS[u.t], t = W.tiles[j];
  const g = groundAt(j), s = shipAt(j);
  const hostile = x => x && atWar(u.n, x.n);
  const ci = t.city;
  const cityHostile = ci >= 0 && atWar(u.n, G.cities[ci].owner);
  if (U.dom === 'land' && !isRanged(u)) {
    if (!t.land) return null;
    if (hostile(g)) return { unit: g, city: cityHostile ? ci : -1 };
    if (cityHostile) return { unit: null, city: ci };
    return null;
  }
  if (u.t === 'ss') {
    if (hostile(s)) return { unit: s, city: -1 };
    if (hostile(g) && g.emb) return { unit: g, city: -1 };
    return null;
  }
  if (hostile(g)) return { unit: g, city: cityHostile ? ci : -1 };
  if (hostile(s)) return { unit: s, city: -1 };
  if (cityHostile) return { unit: null, city: ci };
  return null;
}
function attackRange(u) { const U = UNITS[u.t]; return U.dom === 'air' ? U.rng : U.rng > 0 ? U.rng : 1; }
function canAttackFrom(u) {
  if (u.acted) return false;
  if (UNITS[u.t].dom === 'air') return u.hp > 15;
  return u.mv > 0;
}
function attackTargets(u, from = u.pos, vis = null) {
  if (!canAttackFrom(u)) return [];
  const out = [];
  for (const j of tilesWithin(from, attackRange(u))) {
    if (j === from) continue;
    const tg = targetAt(u, j);
    if (!tg) continue;
    if (vis && tg.unit && !unitVisible(tg.unit, u.n, vis)) continue;
    if (vis && !tg.unit && !vis[j]) continue;
    out.push(j);
  }
  return out;
}
function interceptors(att, j) {
  const aas = G.units.filter(o => o.t === 'aa' && atWar(att.n, o.n) && hexDist(o.pos, j) <= 2).slice(0, 2);
  const ftr = G.units.filter(o => o.t === 'ftr' && !o.icp && o.hp > 30 && atWar(att.n, o.n) && hexDist(o.pos, j) <= UNITS.ftr.rng)
    .sort((a, b) => b.hp - a.hp)[0] || null;
  const ci = W.tiles[j].city;
  const sam = ci >= 0 && atWar(att.n, G.cities[ci].owner) ? G.cities[ci].sam : 0;
  return { aas, ftr, sam };
}
// Expected outcome (no randomness) for previews and AI scoring
function preview(u, j) {
  const tg = targetAt(u, j);
  if (!tg) return null;
  const U = UNITS[u.t];
  const ranged = isRanged(u);
  let pre = 0;
  if (U.dom === 'air') {
    const ic = interceptors(u, j);
    const st = u.t === 'ftr' && has(u.n, 'stealth') ? 0.5 : 1;
    pre += ic.aas.reduce((s, a) => s + 14 * (a.hp / 100) * st, 0) + ic.sam * 10 * st;
    if (ic.ftr) pre += dmgPair(unitStr(ic.ftr, 'atk', u), unitStr(u, 'def', ic.ftr), false).def * st;
  }
  let A = unitStr(u, 'atk', tg.unit) * (U.dom === 'land' && !ranged ? flank(u.n, j, u.id) : 1);
  if (tg.unit) {
    const D = unitStr(tg.unit, 'def', u);
    const d = dmgPair(A, D, ranged);
    return { tg, dealt: d.def, taken: d.att + pre, kill: d.def >= tg.unit.hp, city: tg.city, pre };
  }
  const D = cityStr(tg.city);
  const d = dmgPair(A, D, ranged);
  const taken = ranged ? 0 : d.att * 0.7;
  return { tg, dealt: d.def, taken: taken + pre, kill: false, capture: !ranged && U.dom === 'land' && G.cities[tg.city].hp - d.def <= 0, city: tg.city, pre };
}
function gainXp(u, k) { u.xp += k; }
function killUnit(u, by, how = '격파') {
  const was = UNITS[u.t].name;
  removeUnit(u);
  const n = G.nations[u.n]; n.losses++;
  n.stab = clamp(n.stab - (u.n === 'USA' ? 0.8 : u.n === 'PRK' ? 0.12 : 0.25), 0, 100);
  if (by) G.nations[by].kills++;
  logMsg(`[${nName(u.n)}] ${was} ${how}`, 'loss', u.n);
  Hooks.fx({ k: 'boom', i: u.pos });
}
function doAttack(u, j) {
  const tg = targetAt(u, j);
  if (!tg || !canAttackFrom(u)) return null;
  const U = UNITS[u.t];
  const ranged = isRanged(u);
  const rnd = () => 0.85 + Math.random() * 0.3;
  const out = { dealt: 0, taken: 0, killed: false, died: false, captured: false };
  u.acted = true; u.moved = true; u.fort = 0;
  if (U.dom !== 'air') u.mv = 0;
  Hooks.fx({ k: 'shot', from: u.pos, to: j, dom: U.dom });

  if (U.dom === 'air') {
    const ic = interceptors(u, j);
    const st = u.t === 'ftr' && has(u.n, 'stealth') ? 0.5 : 1;
    for (const a of ic.aas) { const d = Math.round(14 * (a.hp / 100) * st * rnd()); u.hp -= d; out.taken += d; }
    if (ic.sam) { const d = Math.round(ic.sam * 10 * st * rnd()); u.hp -= d; out.taken += d; }
    if (ic.ftr && Math.random() < (st < 1 ? 0.5 : 1)) {
      ic.ftr.icp = true;
      const d = dmgPair(unitStr(ic.ftr, 'atk', u), unitStr(u, 'def', ic.ftr), false);
      const a = Math.round(d.def * rnd()), b = Math.round(d.att * 0.8 * rnd());
      u.hp -= a; ic.ftr.hp -= b; out.taken += a;
      logMsg(`[${nName(ic.ftr.n)}] 전투기 요격 — 공중전 (${-a} / ${-b})`, 'combat', ic.ftr.n);
      if (ic.ftr.hp <= 0) killUnit(ic.ftr, u.n, '공중전에서 격추');
    }
    if (u.hp <= 0) { killUnit(u, tg.unit ? tg.unit.n : G.cities[tg.city]?.owner, '요격으로 격추'); out.died = true; return out; }
  }

  const A = unitStr(u, 'atk', tg.unit) * (U.dom === 'land' && !ranged ? flank(u.n, j, u.id) : 1);
  if (tg.unit) {
    const d = tg.unit;
    const dmg = dmgPair(A, unitStr(d, 'def', u), ranged);
    const dd = Math.min(100, Math.round(dmg.def * rnd())), da = Math.min(100, Math.round(dmg.att * rnd()));
    d.hp -= dd; u.hp -= da; out.dealt = dd; out.taken += da;
    if (tg.city >= 0) G.cities[tg.city].hp = Math.max(0, G.cities[tg.city].hp - Math.round(dd * 0.3));
    gainXp(u, 1); gainXp(d, 1);
    Hooks.fx({ k: 'dmg', i: j, text: `-${dd}` });
    if (da) Hooks.fx({ k: 'dmg', i: u.pos, text: `-${da}` });
    logMsg(`[${nName(u.n)}] ${U.name} → [${nName(d.n)}] ${UNITS[d.t].name}${tg.city >= 0 ? ` (${W.cities[tg.city].name})` : ''}: 적 -${dd}${da ? `, 아군 -${da}` : ''}`, 'combat', u.n);
    if (d.hp <= 0) { killUnit(d, u.n); out.killed = true; gainXp(u, 2); }
    if (u.hp <= 0) { killUnit(u, d.n); out.died = true; return out; }
    if (out.killed && U.dom === 'land' && !ranged && W.tiles[j].land) {
      if (tg.city >= 0) {
        if (G.cities[tg.city].hp <= 50 && OG[j] < 0) { placeUnitAt(u, j); captureCity(tg.city, u.n); out.captured = true; }
      } else if (OG[j] < 0) placeUnitAt(u, j);
    }
    return out;
  }
  const c = G.cities[tg.city];
  const dmg = dmgPair(A, cityStr(tg.city), ranged);
  const dd = Math.min(100, Math.round(dmg.def * rnd())), da = ranged ? 0 : Math.min(100, Math.round(dmg.att * 0.7 * rnd()));
  c.hp = Math.max(0, c.hp - dd); u.hp -= da; out.dealt = dd; out.taken += da;
  Hooks.fx({ k: 'dmg', i: j, text: `-${dd}` });
  logMsg(`[${nName(u.n)}] ${U.name} → ${W.cities[tg.city].name} 공격: 도시 방어력 -${dd}${da ? `, 아군 -${da}` : ''}`, 'combat', u.n);
  gainXp(u, 1);
  if (u.hp <= 0) { killUnit(u, c.owner); out.died = true; return out; }
  if (c.hp <= 0 && U.dom === 'land' && !ranged && OG[j] < 0) { placeUnitAt(u, j); captureCity(tg.city, u.n); out.captured = true; }
  return out;
}

// ---------- cities ----------
function citiesOf(n) { return W.cities.filter(c => G.cities[c.id].owner === n); }
function capitalOf(n) { const ci = G.nations[n].capital; return ci >= 0 ? W.cities[ci] : null; }
function captureCity(ci, by) {
  const cy = W.cities[ci], c = G.cities[ci], prev = c.owner;
  let newOwner = by;
  // liberation: an ally retaking its partner's city hands it back
  if (cy.nat !== by && allied(by, cy.nat) && G.nations[cy.nat].alive && !G.nations[cy.nat].capitulated && atWar(cy.nat, prev)) newOwner = cy.nat;
  else if (NATIONS[by].offshore) {
    const partner = NATION_IDS.find(p => p !== by && allied(by, p) && atWar(p, prev) && G.nations[p].alive && hexDist(capitalOf(p)?.tile ?? cy.tile, cy.tile) < 20);
    if (partner) newOwner = partner;
  }
  c.owner = newOwner; c.hp = 35; c.pop = Math.max(1, c.pop - 1); c.fort = Math.max(0, c.fort - 1); c.sam = 0; c.rec = 9;
  for (const u of G.units.slice()) {
    if (u.pos !== cy.tile || friendly(newOwner, u.n)) continue;
    if (UNITS[u.t].dom !== 'land') killUnit(u, by, '기지 함락으로 손실');
  }
  const P = G.nations[prev], B = G.nations[newOwner];
  const wasCap = P.capital === ci;
  P.stab = clamp(P.stab - (wasCap ? 10 : 3) * (prev === 'PRK' ? 0.6 : 1), 0, 100); P.lost++;
  B.stab = clamp(B.stab + (cy.nat === newOwner ? 5 : 3), 0, 100); B.taken++;
  for (const o of NATION_IDS) if (allied(o, prev) && o !== prev) addRel(o, by, -4);
  logMsg(`${cy.name} 함락 — [${nName(newOwner)}] 점령${newOwner !== by ? ` ([${nName(by)}] 탈환 후 반환)` : ''}${wasCap ? ' · 수도 함락!' : ''}`, 'capture', newOwner);
  Hooks.fx({ k: 'capture', i: cy.tile, n: newOwner });
  if (wasCap) {
    const rest = citiesOf(prev).sort((a, b) => G.cities[b.id].pop - G.cities[a.id].pop);
    P.capital = rest.length ? rest[0].id : -1;
    if (rest.length) logMsg(`[${nName(prev)}] 수도를 ${rest[0].name}(으)로 이전`, 'sys', prev);
  }
  cache.supply = {};
  checkCapitulation(prev, by);
}
function cityRecruitCap(ci) { return G.cities[ci].pop >= 7 ? 2 : 1; }
function recruitCheck(n, ci, t) {
  const U = UNITS[t], N = G.nations[n], c = G.cities[ci], cy = W.cities[ci];
  if (!N.alive || N.capitulated) return { ok: false, why: '행동 불가' };
  const own = NATIONS[n].offshore ? (allied(n, c.owner) && c.owner !== n && (cy.base || cy.cap)) : c.owner === n;
  if (!own) return { ok: false, why: NATIONS[n].offshore ? '동맹국 기지·수도에서만 증원' : '자국 도시 아님' };
  if (U.req && !has(n, U.req)) return { ok: false, why: `기술 필요: ${TECHS.find(x => x.id === U.req).name}` };
  if (U.dom === 'sea' && !cy.port) return { ok: false, why: '항구 필요' };
  if (c.rec >= cityRecruitCap(ci)) return { ok: false, why: '이번 턴 편성 한도' };
  const cost = unitCost(n, t);
  if (N.money < cost) return { ok: false, why: '예산 부족' };
  if (N.manpower < U.mp) return { ok: false, why: '인력 부족' };
  const slot = freeSlotNear(n, cy.tile, U.dom, U.dom === 'air' ? 0 : 1);
  if (slot < 0) return { ok: false, why: U.dom === 'air' ? '비행장 포화 (최대 4)' : '배치 공간 없음' };
  if (zocAt(n, cy.tile) && c.hp < 30) return { ok: false, why: '도시 포위됨' };
  return { ok: true, slot, cost };
}
function unitCost(n, t) { return Math.round(UNITS[t].cost * (G.cities && n === G.player && G.diff === 'easy' ? 0.85 : 1)); }
function recruit(n, ci, t) {
  const r = recruitCheck(n, ci, t);
  if (!r.ok) return null;
  const N = G.nations[n];
  N.money -= r.cost; N.manpower -= UNITS[t].mp; G.cities[ci].rec++;
  const u = addUnit(n, t, r.slot, true);
  return u;
}
const BUILDINGS = {
  fort:    { name: '요새화',   cost: 30, max: 3, desc: '도시 방어 +15%/단계, 도시 전력 +6' },
  factory: { name: '군수공장', cost: 45, max: 2, desc: '도시 예산 기여 +3/단계' },
  sam:     { name: '방공망',   cost: 35, max: 2, desc: '미사일 요격 +15%/단계, 공습 시 방공 피해' },
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

// ---------- missiles & cyber ----------
function missileRange(n) { return 8 + (has(n, 'bm2') ? 4 : 0); }
function missileLaunchSite(n, j) {
  let best = null, bd = INF;
  for (const cy of W.cities) {
    const own = G.cities[cy.id].owner === n || (NATIONS[n].offshore && allied(n, G.cities[cy.id].owner));
    if (!own) continue;
    const d = hexDist(cy.tile, j);
    if (d <= missileRange(n) && d < bd) { bd = d; best = cy; }
  }
  return best;
}
function interceptChance(n, j) {
  const g = groundAt(j), s = shipAt(j), ci = W.tiles[j].city;
  const def = g?.n || s?.n || (ci >= 0 ? G.cities[ci].owner : null);
  if (!def) return 0;
  let p = (has(def, 'amd1') ? 0.25 : 0) + (has(def, 'amd2') ? 0.25 : 0);
  if (ci >= 0 && G.cities[ci].owner === def) p += 0.15 * G.cities[ci].sam;
  for (const o of G.units) {
    if (!friendly(def, o.n)) continue;
    if (o.t === 'aa' && hexDist(o.pos, j) <= 2) { p += 0.12; }
    if (o.t === 'dd' && has(o.n, 'aegis') && hexDist(o.pos, j) <= 3) { p += 0.15; }
  }
  return Math.min(0.85, p);
}
function missileTargetOk(n, j) {
  const tg = targetAt({ n, t: 'art', pos: j, hp: 100, xp: 0 }, j);
  return !!tg && !!missileLaunchSite(n, j);
}
function fireMissile(n, j) {
  const N = G.nations[n];
  if (N.missiles <= 0 || !missileTargetOk(n, j)) return null;
  const site = missileLaunchSite(n, j);
  N.missiles--;
  const p = interceptChance(n, j);
  const hit = Math.random() >= p;
  Hooks.fx({ k: 'missile', from: site.tile, to: j, hit });
  const dmgBase = 40 + (has(n, 'bm2') ? 15 : 0);
  const ci = W.tiles[j].city;
  if (!hit) { logMsg(`[${nName(n)}] 탄도미사일 발사 (${site.name}) → 요격됨 (요격 확률 ${Math.round(p * 100)}%)`, 'missile', n); return { hit: false, p }; }
  const parts = [];
  for (const u of [groundAt(j), shipAt(j)]) {
    if (!u || !atWar(n, u.n)) continue;
    const d = Math.round(dmgBase * (0.85 + Math.random() * 0.3));
    u.hp -= d; parts.push(`${UNITS[u.t].name} -${d}`);
    if (u.hp <= 0) killUnit(u, n, '미사일 공격으로 궤멸');
  }
  if (ci >= 0 && atWar(n, G.cities[ci].owner)) {
    const c = G.cities[ci];
    const d = 30 + (has(n, 'bm2') ? 10 : 0);
    c.hp = Math.max(0, c.hp - d); parts.push(`${W.cities[ci].name} 방어력 -${d}`);
    for (const a of airAt(j)) if (atWar(n, a.n)) { a.hp -= 25; if (a.hp <= 0) killUnit(a, n, '활주로 피격으로 손실'); }
    G.nations[c.owner].stab = clamp(G.nations[c.owner].stab - 1, 0, 100);
    for (const o of activeNations()) if (!allied(o, n) && o !== c.owner) addRel(o, n, -2);
  }
  Hooks.fx({ k: 'boom', i: j, big: true });
  logMsg(`[${nName(n)}] 탄도미사일 명중 (${site.name} 발사): ${parts.join(', ') || '피해 없음'}`, 'missile', n);
  return { hit: true, p };
}
function buyMissile(n) {
  const N = G.nations[n];
  const cost = 30;
  if (N.money < cost || N.missiles >= 30) return false;
  N.money -= cost; N.missiles++;
  return true;
}
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
  const blocked = has(target, 'cyber') && Math.random() < 0.5;
  if (blocked) { logMsg(`[${nName(n)}] → [${nName(target)}] 사이버 공격 차단됨`, 'cyber', n); return false; }
  G.nations[target].incomeMult = Math.min(G.nations[target].incomeMult, 0.75);
  logMsg(`[${nName(n)}] → [${nName(target)}] 사이버 공격 성공: 다음 달 예산 -25%`, 'cyber', n);
  return true;
}

// ---------- diplomacy ----------
function militaryPower(n) {
  let p = 0;
  for (const u of G.units) if (u.n === n) p += (UNITS[u.t].atk + UNITS[u.t].def) * u.hp / 100;
  return p;
}
function declareWar(a, b, silent) {
  if (atWar(a, b) || allied(a, b)) return false;
  if ((G.truce[pk(a, b)] ?? -99) + 6 > G.turn) return false;
  G.war[pk(a, b)] = 1; G.rel[pk(a, b)] = -80;
  G.nations[a].stab = clamp(G.nations[a].stab - 3, 0, 100);
  G.nations[b].stab = clamp(G.nations[b].stab + 3, 0, 100);
  logMsg(`[${nName(a)}] → [${nName(b)}] 선전포고`, 'war', a);
  // defensive alliances (AI members answer the call)
  for (const o of activeNations()) {
    if (o === a || o === b || G.nations[o].capitulated || o === G.player) continue;
    if (allied(o, b) && !allied(o, a) && !atWar(o, a) && rel(o, b) >= 40) {
      G.war[pk(o, a)] = 1; G.rel[pk(o, a)] = -70;
      logMsg(`[${nName(o)}] 동맹 조약에 따라 [${nName(a)}]에 선전포고`, 'war', o);
    }
  }
  if (!silent) cache.supply = {};
  return true;
}
function makePeace(a, b) {
  delete G.war[pk(a, b)];
  G.truce[pk(a, b)] = G.turn;
  G.rel[pk(a, b)] = Math.max(rel(a, b), -30);
  // expel units from each other's territory
  for (const u of G.units.slice()) {
    const pair = u.n === a ? b : u.n === b ? a : null;
    if (!pair || UNITS[u.t].dom !== 'land') continue;
    const o = tileOwner(u.pos);
    if (o && !friendly(u.n, o) && !atWar(u.n, o)) {
      const cap = capitalOf(u.n);
      const home = citiesOf(u.n).map(c => c.tile).sort((x, y) => hexDist(u.pos, x) - hexDist(u.pos, y));
      let spot = -1;
      for (const h of home) { spot = freeSlotNear(u.n, h, 'land', 3); if (spot >= 0) break; }
      if (spot < 0 && cap) spot = freeSlotNear(u.n, cap.tile, 'land', 5);
      if (spot >= 0) placeUnitAt(u, spot); else removeUnit(u);
    }
  }
  cache.supply = {};
  logMsg(`[${nName(a)}] ↔ [${nName(b)}] 강화 조약 체결`, 'peace', a);
}
function warScore(a, b) {
  // positive = a winning against b
  let s = 0;
  for (const cy of W.cities) {
    const o = G.cities[cy.id].owner;
    if (cy.nat === b && o === a) s += cy.cap ? 25 : 8;
    if (cy.nat === a && o === b) s -= cy.cap ? 25 : 8;
  }
  const pa = militaryPower(a) + 1, pb = militaryPower(b) + 1;
  s += clamp((pa / pb - 1) * 20, -25, 25);
  s += (G.nations[a].stab - G.nations[b].stab) * 0.3;
  return s;
}
function peaceAcceptance(ai, other) {
  // AI's willingness to accept peace offered by `other`
  const N = G.nations[ai];
  let p = 0.25 - warScore(ai, other) / 60 + (50 - N.stab) / 80;
  if (G.scen === 'crisis' && ai === 'PRK' && warScore(ai, other) > 10) p -= 0.3;
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
  return { ok: true };
}
function proposeAlliance(a, b) {
  const r = allianceCheck(a, b);
  if (!r.ok) return false;
  G.ally[pk(a, b)] = 1; addRel(a, b, 10);
  logMsg(`[${nName(a)}] ↔ [${nName(b)}] 군사 동맹 체결`, 'peace', a);
  cache.supply = {};
  return true;
}
function breakAlliance(a, b) {
  if (!G.ally[pk(a, b)]) return false;
  delete G.ally[pk(a, b)]; addRel(a, b, -35);
  G.nations[a].stab = clamp(G.nations[a].stab - 2, 0, 100);
  logMsg(`[${nName(a)}] ↔ [${nName(b)}] 동맹 파기`, 'war', a);
  cache.supply = {};
  return true;
}
function improveRelations(a, b) {
  const N = G.nations[a];
  if (N.money < 15 || (N.diploCd[b] ?? -1) === G.turn) return false;
  N.money -= 15; N.diploCd[b] = G.turn; addRel(a, b, atWar(a, b) ? 4 : 8);
  return true;
}
function requestAid(a, b) {
  const N = G.nations[a];
  if (!allied(a, b) || N.aidCd > 0 || rel(a, b) < 40 || G.nations[b].money < 40) return false;
  const amt = Math.round(Math.min(60, G.nations[b].money * 0.25));
  G.nations[b].money -= amt; N.money += amt; N.aidCd = 5; addRel(a, b, -6);
  logMsg(`[${nName(b)}] → [${nName(a)}] 군사 원조 ${amt}`, 'diplo', b);
  return amt;
}

// ---------- capitulation & victory ----------
function checkCapitulation(n, by) {
  const N = G.nations[n];
  if (!N.alive || N.capitulated) return;
  if (NATIONS[n].offshore) {
    if (N.stab <= 20) {
      N.capitulated = true;
      for (const u of G.units.slice()) if (u.n === n) removeUnit(u);
      for (const o of NATION_IDS) if (atWar(n, o)) { delete G.war[pk(n, o)]; G.truce[pk(n, o)] = G.turn; }
      logMsg(`[미국] 여론 악화로 동아시아에서 전면 철수`, 'capitulate', n);
    }
    return;
  }
  const home = W.cities.filter(c => c.nat === n);
  const held = home.filter(c => G.cities[c.id].owner === n).length;
  const origCap = home.find(c => c.cap);
  const capLost = origCap && G.cities[origCap.id].owner !== n;
  if (citiesOf(n).length === 0 || N.stab <= 6 || (capLost && held / home.length < 0.35) || (capLost && N.stab < 18)) {
    N.capitulated = true;
    const held_by = o => home.filter(c => G.cities[c.id].owner === o).length;
    const victor = by || enemiesOf(n).sort((x, y) => held_by(y) - held_by(x))[0];
    for (const o of NATION_IDS) if (atWar(n, o)) { delete G.war[pk(n, o)]; G.truce[pk(n, o)] = G.turn + 200; }
    logMsg(`[${nName(n)}] 무조건 항복`, 'capitulate', n);
    // Korean pair: the victor absorbs what remains (unification)
    if (victor && origCap && G.cities[origCap.id].owner === victor && ((n === 'PRK' && victor === 'KOR') || (n === 'KOR' && victor === 'PRK'))) {
      for (const cy of citiesOf(n)) G.cities[cy.id].owner = victor;
      for (const u of G.units.slice()) if (u.n === n) removeUnit(u);
      logMsg(`한반도 통일 — ${NATIONS[victor].name} 주도의 흡수 통일`, 'capitulate', victor);
    } else {
      for (const u of G.units.slice()) if (u.n === n && UNITS[u.t].dom === 'land' && tileOwner(u.pos) !== n) removeUnit(u);
    }
    cache.supply = {};
    G.flags.everCapitulated = G.flags.everCapitulated || {};
    if (victor) G.flags.everCapitulated[n] = victor;
  }
}
function score(n) {
  const cs = citiesOf(n);
  return Math.round(cs.reduce((s, c) => s + 8 + G.cities[c.id].pop, 0) + G.nations[n].stab + G.nations[n].techs.length * 4 + militaryPower(n) / 40);
}
function checkVictory() {
  if (G.over) return G.over;
  const p = G.player, P = G.nations[p];
  if (P.capitulated) return (G.over = { win: false, title: '패전', text: `${NATIONS[p].name}이(가) 항복했습니다.` });
  const korea = W.cities.filter(c => c.nat === 'KOR' || c.nat === 'PRK');
  if ((p === 'KOR' || p === 'PRK') && korea.every(c => G.cities[c.id].owner === p))
    return (G.over = { win: true, title: '한반도 통일', text: `${NATIONS[p].name}이(가) 한반도 전역 ${korea.length}개 도시를 장악했습니다.` });
  const total = W.cities.length, mine = citiesOf(p).length;
  if (mine >= Math.ceil(total * 0.5))
    return (G.over = { win: true, title: '동북아 패권', text: `전체 ${total}개 도시 중 ${mine}개를 장악했습니다.` });
  const beaten = Object.entries(G.flags.everCapitulated || {}).filter(([, v]) => friendly(p, v)).length;
  if (beaten > 0 && enemiesOf(p).length === 0)
    return (G.over = { win: true, title: '전쟁 승리', text: `적국 ${beaten}개국을 항복시키고 전쟁을 끝냈습니다.` });
  if (G.turn > G.maxTurn) {
    const ranks = activeNations().filter(n => !NATIONS[n].offshore).map(n => [n, score(n)]).sort((a, b) => b[1] - a[1]);
    const pos = ranks.findIndex(r => r[0] === p) + 1;
    return (G.over = { win: pos === 1, title: pos === 1 ? '종전 — 점수 1위' : `종전 — 점수 ${pos}위`, text: ranks.map(([n, s]) => `${nName(n)} ${s}`).join(' · ') });
  }
  return null;
}

// ---------- research ----------
function availableTechs(n) {
  return TECHS.filter(t => !has(n, t.id) && (!t.req || has(n, t.req)));
}
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
  let base = 0, ports = 0, blk = 0, mp = 0, oilRatio = 0;
  const home = W.cities.filter(c => c.nat === n);
  for (const cy of citiesOf(n)) {
    const c = G.cities[cy.id];
    let v = c.pop * 0.9 + cy.ind * 1.3 + c.factory * 3;
    if (cy.nat !== n) v *= 0.5;
    if (cy.port) { ports++; if (blockaded(cy.id)) { blk++; v *= 0.6; } }
    base += v; mp += c.pop * 0.7;
  }
  if (home.length) oilRatio = home.filter(c => G.cities[c.id].owner === n).length / home.length;
  if (NT.offshore) { base = 110; mp = 18; oilRatio = 1; }
  const stabM = 0.6 + 0.4 * N.stab / 100;
  const gross = base * 0.6 * NT.econ * stabM * (has(n, 'wareco') ? 1.15 : 1) * N.incomeMult;
  const upkeep = G.units.reduce((s, u) => s + (u.n === n ? UNITS[u.t].up : 0), 0);
  const rp = gross * N.rd;
  const openPorts = ports ? (ports - blk) / ports : 0;
  const fuelIn = NT.oil * oilRatio + NT.oilImport * openPorts;
  const fuelUse = G.units.reduce((s, u) => s + (u.n === n ? UNITS[u.t].fuel * 0.5 : 0), 0);
  return { gross, upkeep, rp, net: gross - rp - upkeep, fuel: fuelIn - fuelUse, mp: mp * (0.6 + 0.4 * N.stab / 100), blockaded: blk, ports };
}
function startPhase(n) {
  // reset units, heal, attrition, city bombardment
  const N = G.nations[n];
  for (const u of G.units.slice()) {
    if (u.n !== n) continue;
    const U = UNITS[u.t];
    if (!u.moved && !u.acted) {
      let h = 10 + (has(n, 'logi') ? 5 : 0);
      const o = tileOwner(u.pos);
      if (U.dom !== 'land' || o === n) h += 5;
      if (W.tiles[u.pos].city >= 0 && friendly(n, o)) h += 10;
      if (U.dom === 'sea' && !W.tiles[u.pos].land) h = 5;
      u.hp = Math.min(100, u.hp + h);
      u.fort = Math.min(2, u.fort + 1);
    } else u.fort = 0;
    if (!supplied(u)) { u.hp -= 8; if (u.hp <= 0) { killUnit(u, null, '보급 두절로 와해'); continue; } }
    u.mv = U.mv + mvBonus(n, u.t);
    if (U.fuel > 0 && N.fuel <= 0 && U.dom !== 'air') u.mv = Math.max(1, Math.floor(u.mv / 2));
    u.acted = false; u.moved = false;
  }
  for (const cy of citiesOf(n)) {
    const c = G.cities[cy.id];
    c.rec = 0;
    if (c.pop < 4 && c.fort === 0) continue;
    const tgts = W.tiles[cy.tile].nb.map(groundAt).filter(g => g && atWar(n, g.n));
    if (!tgts.length) continue;
    const g = tgts.sort((a, b) => a.hp - b.hp)[0];
    const d = Math.round((6 + c.fort * 4) * (0.5 + c.hp / 200));
    g.hp -= d;
    Hooks.fx({ k: 'dmg', i: g.pos, text: `-${d}` });
    if (g.hp <= 0) killUnit(g, n, `${cy.name} 수비대 포격으로 격파`);
  }
}
function endRound() {
  // economy for every nation, then events, date advance
  for (const n of activeNations()) {
    const N = G.nations[n];
    if (N.capitulated) continue;
    const e = economyPreview(n);
    N.last = { gross: e.gross, upkeep: e.upkeep, net: e.net, fuel: e.fuel, mp: e.mp, rp: e.rp, blockaded: e.blockaded };
    N.money = Math.round((N.money + e.net) * 10) / 10;
    if (N.money < 0) { N.stab = clamp(N.stab - 3, 0, 100); }
    N.fuel = clamp(N.fuel + e.fuel, -20, 200);
    N.manpower = Math.round(N.manpower + e.mp);
    N.incomeMult = 1;
    if (N.research) {
      N.progress[N.research] = (N.progress[N.research] || 0) + e.rp;
      const T = TECHS.find(t => t.id === N.research);
      if (N.progress[N.research] >= T.cost) {
        N.techs.push(T.id); delete N.progress[T.id];
        logMsg(`[${nName(n)}] 기술 개발 완료: ${T.name}`, 'tech', n);
        N.research = null;
        if (n !== G.player) pickResearch(n);
      }
    }
    // stability drift
    const wars = enemiesOf(n).length;
    let ds = -Math.min(0.8, 0.25 * wars);
    if (e.ports) ds -= 1.5 * e.blockaded / e.ports;
    if (wars && N.stab < 40) ds += 0.4; // rally around the flag
    if (N.fuel <= 0) ds -= 2;
    ds -= 0.3 * W.cities.filter(c => c.nat === n && G.cities[c.id].owner !== n).length;
    if (!wars) ds += N.stab < NATIONS[n].stab + 8 ? 0.8 : 0;
    N.stab = clamp(N.stab + ds, 0, 100);
    if (N.cyberCd > 0) N.cyberCd--;
    if (N.aidCd > 0) N.aidCd--;
    if (n === 'PRK' && G.turn % 2 === 0) N.missiles = Math.min(30, N.missiles + 1);
    if (n === 'RUS' && wars && G.turn % 4 === 0) {
      const cap = capitalOf('RUS');
      const j = cap ? freeSlotNear('RUS', cap.tile, 'land', 2) : -1;
      if (j >= 0) { addUnit('RUS', G.turn % 8 === 0 ? 'armor' : 'mech', j, true); logMsg('[러시아] 시베리아 횡단철도로 증원 부대 도착', 'sys', 'RUS'); }
    }
  }
  for (const c of G.cities) {
    const ci = G.cities.indexOf(c);
    const threatened = W.tiles[W.cities[ci].tile].nb.some(k => { const g = groundAt(k); return g && atWar(c.owner, g.n); });
    c.hp = Math.min(100, c.hp + (threatened ? 4 : 12));
  }
  for (const u of G.units) u.icp = false;
  for (const a of NATION_IDS) for (const b of NATION_IDS) if (a < b && !atWar(a, b)) {
    const k = pk(a, b); const r = G.rel[k] ?? 0;
    if (!G.ally[k]) G.rel[k] = r > 0 ? Math.max(0, r - 0.5) : Math.min(0, r + 0.5);
  }
  scenarioTriggers();
  for (const n of activeNations()) checkCapitulation(n, null);
  G.turn++;
  cache.supply = {};
  snapshotHist();
}
function scenarioTriggers() {
  if (G.scen === 'crisis' && !G.flags.chinaIn && G.nations.CHN.alive && !G.nations.CHN.capitulated && !G.nations.PRK.capitulated) {
    const prkLost = W.cities.filter(c => c.nat === 'PRK' && G.cities[c.id].owner !== 'PRK').length;
    const deep = G.units.some(u => (u.n === 'KOR' || u.n === 'USA') && W.tiles[u.pos].nat === 'PRK' && W.tiles[u.pos].lat > 39.6);
    if (prkLost >= 3 || deep || G.cities[W.cities.find(c => c.name === '평양').id].owner !== 'PRK') {
      G.flags.chinaIn = true;
      for (const e of ['KOR', 'USA']) if (!atWar('CHN', e) && G.nations[e].alive && !G.nations[e].capitulated) {
        delete G.ally[pk('CHN', e)];
        G.war[pk('CHN', e)] = 1; G.rel[pk('CHN', e)] = -80;
      }
      logMsg('[중국] 항미원조 — 조중우호조약에 따라 한반도 전쟁에 개입', 'war', 'CHN');
      for (const nm of ['단둥', '선양']) {
        const cy = W.cities.find(c => c.name === nm);
        if (G.cities[cy.id].owner !== 'CHN') continue;
        for (const t of ['inf', 'inf', 'mech', 'armor']) { const j = freeSlotNear('CHN', cy.tile, 'land', 3); if (j >= 0) addUnit('CHN', t, j, false); }
      }
      cache.supply = {};
    }
  }
  if (G.scen === 'crisis' && G.turn === 2 && G.nations.USA.alive) {
    const cy = W.cities.find(c => c.name === '도쿄');
    for (const t of ['dd', 'dd']) { const j = freeSlotNear('USA', cy.tile, 'sea', 4); if (j >= 0) addUnit('USA', t, j, false); }
    logMsg('[미국] 제7함대 항모강습단 동해 전개', 'sys', 'USA');
  }
}
function snapshotHist() {
  const row = { t: G.turn };
  for (const n of NATION_IDS) row[n] = { c: citiesOf(n).length, s: Math.round(G.nations[n].stab), u: G.units.filter(u => u.n === n).length };
  G.hist.push(row);
}

// Random events. Returns an event object for the player to decide, or null.
function rollEvent(n) {
  if (Math.random() > (n === G.player ? 0.32 : 0.18)) return null;
  const pool = EVENTS.filter(e => e.id !== 'typhoon' || G.month % 12 >= 6);
  return pool[Math.floor(Math.random() * pool.length)];
}
function applyEvent(n, ev, choiceIdx) {
  const N = G.nations[n];
  if (ev.auto === 'typhoon') {
    for (const u of G.units) if (UNITS[u.t].dom === 'sea' && !W.tiles[u.pos].land) u.hp = Math.max(1, u.hp - 20);
    logMsg('태풍으로 해상의 모든 함정이 피해 (-20)', 'event');
    return;
  }
  if (ev.auto === 'hero') { N.stab = clamp(N.stab + 6, 0, 100); logMsg(`[${nName(n)}] ${ev.title}: 안정도 +6`, 'event', n); return; }
  if (ev.auto === 'defector') {
    if (N.research) N.progress[N.research] = (N.progress[N.research] || 0) + 40;
    logMsg(`[${nName(n)}] ${ev.title}: 연구 +40`, 'event', n); return;
  }
  if (ev.cyberBlock && has(n, 'cyber') && choiceIdx == null) { logMsg(`[${nName(n)}] 사이버 공격 방어 성공`, 'event', n); return; }
  const ch = ev.choices[choiceIdx ?? Math.floor(Math.random() * ev.choices.length)];
  const fx = ch.fx;
  if (fx.stab) N.stab = clamp(N.stab + fx.stab, 0, 100);
  if (fx.money) N.money += fx.money;
  if (fx.manpower) N.manpower += fx.manpower;
  if (fx.fuel) N.fuel += fx.fuel;
  if (fx.incomeMult) N.incomeMult = Math.min(N.incomeMult, fx.incomeMult);
  if (fx.relAll) for (const o of NATION_IDS) addRel(n, o, fx.relAll);
  logMsg(`[${nName(n)}] ${ev.title} → ${ch.label}`, 'event', n);
}
