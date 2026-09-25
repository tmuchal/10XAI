// 한반도 대전략 — computer opponents (economy, diplomacy, operational AI)
'use strict';

const AI_MIX = {
  KOR: { inf: 2, mech: 2.5, armor: 2, art: 2, aa: 0.8, ftr: 1.2, drone: 1, dd: 1, ss: 0.5 },
  PRK: { inf: 4, art: 3, sof: 2, armor: 1, aa: 0.5, ss: 0.6 },
  CHN: { inf: 3, mech: 2, armor: 2, art: 2, aa: 0.6, ftr: 1.2, dd: 1.2, ss: 0.6, sof: 0.5 },
  JPN: { inf: 1.5, mech: 1.2, art: 0.8, dd: 2.5, ss: 1.5, ftr: 1.6, aa: 0.6, drone: 0.6 },
  RUS: { inf: 2, armor: 2, mech: 1.2, art: 1.5, ftr: 1, dd: 0.6, ss: 0.6, aa: 0.5 },
  USA: { mech: 2, armor: 1, ftr: 2.2, dd: 2, drone: 1, art: 0.6 },
};

function rebaseCheck(u, j) {
  if (UNITS[u.t].dom !== 'air' || u.acted || j === u.pos) return false;
  const ci = W.tiles[j].city;
  if (ci < 0 || !friendly(u.n, G.cities[ci].owner)) return false;
  return hexDist(u.pos, j) <= 10 && airAt(j).length < 4;
}
function rebaseAir(u, j) {
  if (!rebaseCheck(u, j)) return false;
  Hooks.fx({ k: 'shot', from: u.pos, to: j, dom: 'rebase' });
  u.pos = j; u.acted = true; u.moved = true;
  return true;
}

// ---------- pathing maps ----------
function heapPush(h, item) { h.push(item); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } }
function heapPop(h) {
  const top = h[0], last = h.pop();
  if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } }
  return top;
}
function distMap(sources, enterCost) {
  const d = new Float64Array(W.N).fill(INF), h = [];
  for (const s of sources) { d[s] = 0; heapPush(h, [0, s]); }
  while (h.length) {
    const [dc, cur] = heapPop(h);
    if (dc > d[cur]) continue;
    const ce = enterCost(cur);
    for (const j of W.tiles[cur].nb) {
      if (enterCost(j) >= INF) continue;
      const nd = dc + ce;
      if (nd < d[j]) { d[j] = nd; heapPush(h, [nd, j]); }
    }
  }
  return d;
}
function buildMaps(n) {
  const enemyCities = W.cities.filter(c => atWar(n, G.cities[c.id].owner));
  const landCost = i => {
    const t = W.tiles[i];
    if (!t.land) return INF;
    const o = tileOwner(i);
    if (o && !friendly(n, o) && !atWar(n, o)) return INF;
    return t.city >= 0 ? 1 : TERRAIN[t.terrain].cost;
  };
  const seaCost = i => {
    const t = W.tiles[i];
    if (!t.land) return 1;
    return (t.city >= 0 && W.cities[t.city].port && friendly(n, tileOwner(i))) ? 1 : INF;
  };
  const weighted = enemyCities.map(c => c.tile);
  const land = distMap(weighted, landCost);
  const home = distMap(citiesOf(n).map(c => c.tile), landCost);
  const ports = distMap(citiesOf(n).filter(c => c.port).map(c => c.tile), landCost);
  const seaSrc = [];
  for (const c of enemyCities) if (c.port) for (const k of W.tiles[c.tile].nb) if (!W.tiles[k].land) seaSrc.push(k);
  for (const u of G.units) if (UNITS[u.t].dom === 'sea' && atWar(n, u.n) && !UNITS[u.t].stealth) seaSrc.push(u.pos);
  const sea = distMap(seaSrc, seaCost);
  const homePort = distMap(W.cities.filter(c => c.port && friendly(n, G.cities[c.id].owner)).map(c => c.tile), seaCost);
  const amphSrc = [];
  for (const c of enemyCities) for (const j of tilesWithin(c.tile, 2)) {
    if (W.tiles[j].land) continue;
    if (W.tiles[j].nb.some(k => W.tiles[k].land && atWar(n, tileOwner(k)) && OG[k] < 0)) amphSrc.push(j);
  }
  const amph = distMap(amphSrc, i => W.tiles[i].land ? INF : 1);
  return { land, home, ports, sea, homePort, amph };
}

// ---------- scoring ----------
function targetValue(tg) {
  if (tg.unit) return 0.6 + UNITS[tg.unit.t].cost / 40;
  return W.cities[tg.city].cap ? 2.2 : 1.4;
}
function evalAttack(u, j, fromTile) {
  const saved = u.pos;
  u.pos = fromTile;
  const pv = preview(u, j);
  u.pos = saved;
  if (!pv) return null;
  const val = targetValue(pv.tg);
  let s = pv.dealt * val - pv.taken * 1.2;
  if (pv.kill) s += 35 + UNITS[pv.tg.unit.t].cost / 3;
  if (pv.capture) s += 140;
  if (pv.tg.city >= 0 && !pv.tg.unit) s += 8;
  if (pv.taken >= u.hp - 5) s -= 200;
  return { s, pv };
}
function enemyNear(n, i, r) {
  for (const u of G.units) if (atWar(n, u.n) && UNITS[u.t].dom !== 'air' && hexDist(u.pos, i) <= r) return true;
  return false;
}
function adjacentEnemies(n, i) {
  let k = 0;
  for (const j of W.tiles[i].nb) { const g = groundAt(j); if (g && atWar(n, g.n)) k++; const s = shipAt(j); if (s && atWar(n, s.n)) k++; }
  return k;
}

// ---------- unit behaviour ----------
function bestAttackFrom(u, reach) {
  let best = null;
  for (const [j, r] of reach) {
    if (r.left <= 0 && j !== u.pos) continue;
    if (!canEnd(u, j)) continue;
    if (j === u.pos && u.mv <= 0) continue;
    for (const k of tilesWithin(j, attackRange(u))) {
      if (k === j) continue;
      const e = evalAttack(u, k, j);
      if (!e) continue;
      let s = e.s;
      if (isRanged(u) && adjacentEnemies(u.n, j) > 0) s -= 18;
      if (j !== u.pos) s -= 1;
      if (!best || s > best.s) best = { s, from: j, to: k, pv: e.pv };
    }
  }
  return best;
}
function mustGarrison(u) {
  const ci = W.tiles[u.pos].city;
  if (ci < 0 || G.cities[ci].owner !== u.n || u.emb) return false;
  if (G.nations[u.n].capital === ci) return true;
  return enemyNear(u.n, u.pos, 4);
}
function aiLand(u, maps) {
  if (!uById.has(u.id)) return;
  let reach = reachable(u);
  const garrison = mustGarrison(u);
  const att = bestAttackFrom(u, garrison ? new Map([[u.pos, reach.get(u.pos) || { left: u.mv }]]) : reach);
  const threshold = garrison ? 25 : 10;
  if (att && att.s > threshold) {
    if (att.from !== u.pos) moveUnit(u, att.from, reach);
    if (uById.has(u.id)) doAttack(u, att.to);
    return;
  }
  if (garrison) return;
  if (u.emb) return aiEmbarked(u, maps, reach);

  const lowHp = u.hp < 38;
  let map = lowHp ? maps.home : maps.land;
  if (!lowHp && map[u.pos] >= INF) {
    // no land route to the enemy: head for a port and ship out
    const ci = W.tiles[u.pos].city;
    const inPort = ci >= 0 && W.cities[ci].port && G.cities[ci].owner === u.n;
    if (inPort && Math.random() < 0.45 && G.units.filter(o => o.n === u.n && UNITS[o.t].dom === 'land').length > 5) {
      const sea = [...reach.keys()].filter(j => !W.tiles[j].land && canEnd(u, j)).sort((a, b) => maps.amph[a] - maps.amph[b]);
      if (sea.length && maps.amph[sea[0]] < INF) { moveUnit(u, sea[0], reach); return; }
    }
    map = maps.ports;
    if (map[u.pos] >= INF || map[u.pos] === 0) return;
  }
  let best = u.pos, bs = map[u.pos] * 10;
  for (const [j] of reach) {
    if (!canEnd(u, j) || !W.tiles[j].land) continue;
    let s = map[j] * 10;
    if (s >= INF) continue;
    const adj = adjacentEnemies(u.n, j);
    if (isRanged(u) || u.t === 'aa') s += adj * 25;
    else if (u.hp < 60) s += adj * 12;
    if (W.tiles[j].city >= 0) s -= 2;
    s += TERRAIN[W.tiles[j].terrain].def * -3;
    if (s < bs) { bs = s; best = j; }
  }
  if (best !== u.pos) moveUnit(u, best, reach);
  if (!uById.has(u.id) || u.mv <= 0) return;
  reach = new Map([[u.pos, { left: u.mv, prev: -1 }]]);
  const a2 = bestAttackFrom(u, reach);
  if (a2 && a2.s > 12) doAttack(u, a2.to);
}
function aiEmbarked(u, maps, reach) {
  let land = null, ls = INF;
  for (const [j] of reach) {
    const t = W.tiles[j];
    if (!t.land || !canEnd(u, j)) continue;
    const o = tileOwner(j);
    if (!(atWar(u.n, o) || o === u.n)) continue;
    const s = maps.land[j] + adjacentEnemies(u.n, j) * 3;
    if (s < ls) { ls = s; land = j; }
  }
  if (land !== null && ls < 12) { moveUnit(u, land, reach); return; }
  let best = u.pos, bs = maps.amph[u.pos];
  for (const [j] of reach) {
    if (W.tiles[j].land || !canEnd(u, j)) continue;
    let s = maps.amph[j] + adjacentEnemies(u.n, j) * 4;
    if (s < bs) { bs = s; best = j; }
  }
  if (best !== u.pos) moveUnit(u, best, reach);
}
function aiSea(u, maps) {
  if (!uById.has(u.id)) return;
  let reach = reachable(u);
  const att = bestAttackFrom(u, reach);
  if (att && att.s > 10) {
    if (att.from !== u.pos) moveUnit(u, att.from, reach);
    if (uById.has(u.id)) doAttack(u, att.to);
    return;
  }
  const map = u.hp < 40 ? maps.homePort : maps.sea;
  let best = u.pos, bs = map[u.pos];
  for (const [j] of reach) {
    if (!canEnd(u, j)) continue;
    const s = map[j] + (u.hp < 60 ? adjacentEnemies(u.n, j) * 3 : 0);
    if (s < bs) { bs = s; best = j; }
  }
  if (best !== u.pos) moveUnit(u, best, reach);
  if (!uById.has(u.id) || u.mv <= 0) return;
  const a2 = bestAttackFrom(u, new Map([[u.pos, { left: u.mv, prev: -1 }]]));
  if (a2 && a2.s > 10) doAttack(u, a2.to);
}
function aiAir(u) {
  if (!uById.has(u.id) || u.acted) return;
  if (u.hp < 45) return;
  let best = null;
  for (const k of tilesWithin(u.pos, attackRange(u))) {
    const e = evalAttack(u, k, u.pos);
    if (e && (!best || e.s > best.s)) best = { s: e.s, to: k };
  }
  if (best && best.s > 8) { doAttack(u, best.to); return; }
  // rebase toward the front
  const enemyPts = G.units.filter(o => atWar(u.n, o.n) && UNITS[o.t].dom !== 'air').map(o => o.pos);
  if (!enemyPts.length) return;
  const near = i => enemyPts.reduce((m, p) => Math.min(m, hexDist(i, p)), INF);
  let bj = u.pos, bd = near(u.pos);
  if (bd <= attackRange(u)) return;
  for (const cy of W.cities) {
    if (!rebaseCheck(u, cy.tile)) continue;
    const d = near(cy.tile);
    if (d < bd && d >= 2) { bd = d; bj = cy.tile; }
  }
  if (bj !== u.pos) rebaseAir(u, bj);
}

// ---------- national decisions ----------
function weightedPick(w) {
  const ks = Object.keys(w), tot = ks.reduce((s, k) => s + w[k], 0);
  let r = Math.random() * tot;
  for (const k of ks) { r -= w[k]; if (r <= 0) return k; }
  return ks[0];
}
function aiEconomy(n, enemies) {
  const N = G.nations[n];
  const e = economyPreview(n);
  N.rd = enemies.length ? 0.15 : 0.3;
  if (!N.research) pickResearch(n);
  const reserve = Math.max(12, e.upkeep * 1.2);
  const mine = G.units.filter(u => u.n === n).length;
  const cap = NATIONS[n].offshore ? 22 : citiesOf(n).length * 3 + 10;
  if (!enemies.length && mine >= citiesOf(n).length * 1.2) return;
  const enemyPts = [];
  for (const u of G.units) if (atWar(n, u.n) && UNITS[u.t].dom !== 'air') enemyPts.push(u.pos);
  for (const cy of W.cities) if (atWar(n, G.cities[cy.id].owner)) enemyPts.push(cy.tile);
  const threat = i => enemyPts.reduce((m, p) => Math.min(m, hexDist(i, p)), 99);
  const cities = W.cities.filter(cy => recruitCheck(n, cy.id, 'inf').why !== '자국 도시 아님' && recruitCheck(n, cy.id, 'inf').why !== '동맹국 기지·수도에서만 증원')
    .map(cy => ({ cy, th: threat(cy.tile) })).sort((a, b) => a.th - b.th);
  for (const { cy, th } of cities) {
    if (th <= 4 && G.cities[cy.id].owner === n && G.cities[cy.id].fort < 2 && N.money > reserve + 70) build(n, cy.id, 'fort');
  }
  if (enemies.length && N.missiles < 6 && N.money > reserve + 90 && n !== 'JPN') buyMissile(n);
  let count = mine;
  for (const { cy, th } of cities) {
    if (count >= cap || N.money < reserve + 18) break;
    for (let slot = 0; slot < 2; slot++) {
      const garrisoned = !!groundAt(cy.tile);
      let tries = 0, done = false;
      while (tries++ < 4 && !done) {
        let t = (!garrisoned && th <= 4 && slot === 0) ? (has(n, 'mech') && Math.random() < 0.5 ? 'mech' : 'inf') : weightedPick(AI_MIX[n]);
        if (th > 8 && UNITS[t].dom === 'land' && Math.random() < 0.5 && !NATIONS[n].offshore) t = 'inf';
        if (N.money - unitCost(n, t) < reserve) continue;
        if (recruit(n, cy.id, t)) { count++; done = true; }
      }
      if (!done) break;
    }
  }
}
function aiMissiles(n) {
  const N = G.nations[n];
  let shots = n === 'PRK' ? 3 : 2;
  while (shots-- > 0 && N.missiles > 0) {
    if (Math.random() > 0.65) break;
    let best = null;
    const consider = (j, v) => {
      if (!missileLaunchSite(n, j)) return;
      const s = v * (1 - interceptChance(n, j));
      if (!best || s > best.s) best = { s, j };
    };
    for (const u of G.units) if (atWar(n, u.n) && UNITS[u.t].dom !== 'air') consider(u.pos, UNITS[u.t].cost / 12 + (u.hp < 45 ? 3 : 0));
    for (const cy of W.cities) if (atWar(n, G.cities[cy.id].owner)) consider(cy.tile, (G.cities[cy.id].pop + cy.ind) / 4 + (cy.cap ? 3 : 0) + airAt(cy.tile).length * 1.5);
    if (!best || best.s < 2.5) break;
    fireMissile(n, best.j);
  }
}
function aiDiplomacy(n) {
  const p = G.player;
  for (const e of enemiesOf(n)) {
    if (e === p) {
      if (peaceAcceptance(n, e) > 0.7 && Math.random() < 0.3 && !G.pending.some(x => x.from === n)) G.pending.push({ type: 'peace', from: n });
    } else if (peaceAcceptance(n, e) > 0.62 && peaceAcceptance(e, n) > 0.45 && Math.random() < 0.3) makePeace(n, e);
  }
  for (const o of activeNations()) {
    if (o === n || G.nations[o].capitulated) continue;
    if (!atWar(n, o) && !allied(n, o)) {
      const common = enemiesOf(n).some(e => atWar(o, e));
      if (common) addRel(n, o, 1);
      if (o === p) {
        if (common && rel(n, o) >= 45 && Math.random() < 0.08 && !G.pending.some(x => x.from === n)) G.pending.push({ type: 'alliance', from: n });
      } else if (allianceCheck(n, o).ok && Math.random() < 0.08) proposeAlliance(n, o);
      const truceOk = (G.truce[pk(n, o)] ?? -99) + 6 <= G.turn;
      if (truceOk && rel(n, o) < -40 && militaryPower(n) > 1.8 * militaryPower(o) && Math.random() < 0.025 && !(o === p && G.turn < 6)) declareWar(n, o);
    }
  }
}
function aiCyber(n) {
  const N = G.nations[n];
  if (!has(n, 'cyber') || N.money < 60 || Math.random() > 0.35) return;
  const es = enemiesOf(n);
  if (es.length) cyberAttack(n, es[Math.floor(Math.random() * es.length)]);
}
function aiEvents(n) {
  const ev = rollEvent(n);
  if (ev) applyEvent(n, ev, null);
}
function aiTurn(n) {
  const N = G.nations[n];
  if (!N.alive || N.capitulated) return;
  aiDiplomacy(n);
  const enemies = enemiesOf(n);
  aiEconomy(n, enemies);
  if (!enemies.length) return;
  aiMissiles(n);
  aiCyber(n);
  const maps = buildMaps(n);
  const mine = G.units.filter(u => u.n === n);
  const order = u => { const U = UNITS[u.t]; return U.dom === 'air' ? 0 : isRanged(u) && U.dom === 'land' ? 1 : U.dom === 'sea' ? 2 : 3; };
  mine.sort((a, b) => order(a) - order(b) || maps.land[a.pos] - maps.land[b.pos]);
  for (const u of mine) {
    if (!uById.has(u.id) || u.acted) continue;
    const dom = UNITS[u.t].dom;
    if (dom === 'air') aiAir(u);
    else if (dom === 'sea') aiSea(u, maps);
    else aiLand(u, maps);
  }
}
