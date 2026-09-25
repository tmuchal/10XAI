// 한반도 대전략 — computer opponents
'use strict';

function rebaseCheck(u, j) {
  if (CLASSES[u.t].dom !== 'air' || u.acted || j === u.pos) return false;
  const ci = W.tiles[j].city;
  if (ci >= 0) {
    if (!friendly(u.n, G.cities[ci].owner) || cityAirCount(j) >= 4) return false;
  } else {
    const cv = shipAt(j);
    if (!cv || cv.t !== 'cv' || !friendly(u.n, cv.n) || carrierAirCount(cv.id) >= CLASSES.cv.carrier || u.t === 'bmr') return false;
  }
  return kmDist(u.pos, j) <= Math.min(unitKm(u) * 2, u.t === 'bmr' ? 14000 : 6000);
}
function rebaseAir(u, j) {
  if (!rebaseCheck(u, j)) return false;
  Hooks.fx({ k: 'shot', from: u.pos, to: j, dom: 'rebase' });
  const cv = W.tiles[j].city < 0 ? shipAt(j) : null;
  u.carrier = cv ? cv.id : null;
  u.pos = j; u.acted = true; u.moved = true;
  return true;
}
function rebaseTargets(u) {
  const out = [];
  for (const cy of W.cities) if (rebaseCheck(u, cy.tile)) out.push(cy.tile);
  for (const s of G.units) if (s.t === 'cv' && rebaseCheck(u, s.pos)) out.push(s.pos);
  return out;
}

// ---------- pathing maps (bounded Dijkstra) ----------
function heapPush(h, item) { h.push(item); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } }
function heapPop(h) {
  const top = h[0], last = h.pop();
  if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } }
  return top;
}
function distMap(sources, enterCost, maxCost = 40) {
  const d = new Float32Array(W.N).fill(INF), h = [];
  for (const s of sources) { if (d[s] === 0) continue; d[s] = 0; heapPush(h, [0, s]); }
  while (h.length) {
    const [dc, cur] = heapPop(h);
    if (dc > d[cur] || dc > maxCost) continue;
    const ce = enterCost(cur);
    for (const j of W.tiles[cur].nb) {
      if (enterCost(j) >= INF) continue;
      const nd = dc + ce;
      if (nd < d[j]) { d[j] = nd; heapPush(h, [nd, j]); }
    }
  }
  return d;
}
function buildMaps(n, eTiles) {
  const landCost = i => {
    const t = W.tiles[i];
    if (!t.land) return INF;
    const o = tileOwner(i);
    if (o && !friendly(n, o) && !atWar(n, o)) return INF;
    return t.city >= 0 ? 1 : TERRAIN_KIND[t.terrain].cost;
  };
  const seaCost = i => { const t = W.tiles[i]; if (!t.land) return 1; return (t.city >= 0 && W.cities[t.city].port && friendly(n, tileOwner(i))) ? 1 : INF; };
  const enemyCities = W.cities.filter(c => atWar(n, G.cities[c.id].owner));
  const maps = {};
  const lazy = (k, f) => Object.defineProperty(maps, k, { get() { const v = f(); Object.defineProperty(maps, k, { value: v }); return v; }, configurable: true });
  lazy('land', () => distMap(enemyCities.map(c => c.tile), landCost, 36));
  lazy('home', () => distMap(citiesOf(n).map(c => c.tile), landCost, 16));
  lazy('ports', () => distMap(citiesOf(n).filter(c => c.port).map(c => c.tile), landCost, 20));
  lazy('sea', () => {
    const src = [];
    for (const c of enemyCities) if (c.port) for (const k of W.tiles[c.tile].nb) if (!W.tiles[k].land) src.push(k);
    for (const j of eTiles) { const s = shipAt(j); if (s && !CLASSES[s.t].stealth) src.push(j); }
    return distMap(src, seaCost, 45);
  });
  lazy('homePort', () => distMap(W.cities.filter(c => c.port && friendly(n, G.cities[c.id].owner)).map(c => c.tile), seaCost, 40));
  lazy('amph', () => {
    const src = [];
    for (const c of enemyCities) for (const j of tilesWithin(c.tile, 2)) {
      if (W.tiles[j].land) continue;
      if (W.tiles[j].nb.some(k => W.tiles[k].land && atWar(n, tileOwner(k)) && OG[k] < 0)) src.push(j);
    }
    return distMap(src, i => W.tiles[i].land ? INF : 1, 40);
  });
  return maps;
}

// ---------- scoring ----------
function targetValue(tg) { return tg.unit ? 0.6 + CLASSES[tg.unit.t].cost / 40 : (W.cities[tg.city].cap ? 2.2 : 1.4); }
function evalAttack(u, j, fromTile) {
  const saved = u.pos;
  u.pos = fromTile;
  const pv = preview(u, j);
  u.pos = saved;
  if (!pv) return null;
  let s = pv.dealt * targetValue(pv.tg) - pv.taken * 1.2;
  if (pv.kill) s += 35 + CLASSES[pv.tg.unit.t].cost / 3;
  if (pv.capture) s += 140;
  if (pv.tg.city >= 0 && !pv.tg.unit) s += 8;
  if (pv.taken >= u.hp - 5) s -= 200;
  return { s, pv };
}
function adjacentEnemies(n, i) {
  let k = 0;
  for (const j of W.tiles[i].nb) { const g = groundAt(j); if (g && atWar(n, g.n)) k++; const s = shipAt(j); if (s && atWar(n, s.n)) k++; }
  return k;
}
function bestAttackFrom(u, reach, eTiles) {
  let best = null;
  const rng = attackRange(u);
  for (const [j, r] of reach) {
    if ((r.left <= 0 && j !== u.pos) || !canEnd(u, j)) continue;
    if (j === u.pos && u.mv <= 0) continue;
    for (const k of tilesWithin(j, rng)) {
      if (k === j || !eTiles.has(k)) continue;
      const e = evalAttack(u, k, j);
      if (!e) continue;
      let s = e.s;
      if (isRanged(u) && adjacentEnemies(u.n, j) > 0) s -= 18;
      if (j !== u.pos) s -= 1;
      if (!best || s > best.s) best = { s, from: j, to: k };
    }
  }
  return best;
}
function threatZone(n, eTiles, rad) {
  const z = new Uint8Array(W.N), d = new Uint8Array(W.N), q = [];
  for (const e of eTiles) { if (!z[e]) { z[e] = 1; q.push(e); } }
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    if (d[i] >= rad) continue;
    for (const k of W.tiles[i].nb) if (!z[k]) { z[k] = 1; d[k] = d[i] + 1; q.push(k); }
  }
  return z;
}
function mustGarrison(u, zone) {
  const ci = W.tiles[u.pos].city;
  if (ci < 0 || G.cities[ci].owner !== u.n || u.emb) return false;
  if (G.nations[u.n].capital === ci) return true;
  return !!zone[u.pos];
}

// ---------- unit behaviour ----------
function aiLand(u, ctx) {
  if (!uById.has(u.id)) return;
  const { maps, eTiles, zone, minor } = ctx;
  let reach = reachable(u);
  const garrison = mustGarrison(u, zone);
  const att = bestAttackFrom(u, garrison || minor ? new Map([[u.pos, reach.get(u.pos) || { left: u.mv }]]) : reach, eTiles);
  if (att && att.s > (garrison ? 25 : 10)) {
    if (att.from !== u.pos) moveUnit(u, att.from, reach);
    if (uById.has(u.id)) doAttack(u, att.to);
    return;
  }
  if (garrison || minor) return;
  if (u.emb) return aiEmbarked(u, maps, reach);
  const lowHp = u.hp < 38;
  let map = lowHp ? maps.home : maps.land;
  if (!lowHp && map[u.pos] >= INF) {
    const ci = W.tiles[u.pos].city;
    const inPort = ci >= 0 && W.cities[ci].port && G.cities[ci].owner === u.n;
    if (inPort && Math.random() < 0.4) {
      const sea = [...reach.keys()].filter(j => !W.tiles[j].land && canEnd(u, j)).sort((a, b) => maps.amph[a] - maps.amph[b]);
      if (sea.length && maps.amph[sea[0]] < INF) { moveUnit(u, sea[0], reach); return; }
    }
    return;
  }
  let best = u.pos, bs = map[u.pos] * 10;
  for (const [j] of reach) {
    if (!canEnd(u, j) || !W.tiles[j].land) continue;
    let s = map[j] * 10;
    if (s >= INF) continue;
    const adj = adjacentEnemies(u.n, j);
    if (isRanged(u) || u.t === 'shorad' || u.t === 'sam') s += adj * 25;
    else if (u.hp < 60) s += adj * 12;
    if (W.tiles[j].city >= 0) s -= 2;
    s -= TERRAIN_KIND[W.tiles[j].terrain].def * 3;
    if (s < bs) { bs = s; best = j; }
  }
  if (best !== u.pos) moveUnit(u, best, reach);
  if (!uById.has(u.id) || u.mv <= 0) return;
  const a2 = bestAttackFrom(u, new Map([[u.pos, { left: u.mv, prev: -1 }]]), eTiles);
  if (a2 && a2.s > 12) doAttack(u, a2.to);
}
function aiEmbarked(u, maps, reach) {
  let land = null, ls = INF;
  for (const [j] of reach) {
    const t = W.tiles[j];
    if (!t.land || !canEnd(u, j)) continue;
    const o = tileOwner(j);
    if (!(atWar(u.n, o) || friendly(u.n, o))) continue;
    const s = maps.land[j] + adjacentEnemies(u.n, j) * 3;
    if (s < ls) { ls = s; land = j; }
  }
  if (land !== null && ls < 14) { moveUnit(u, land, reach); return; }
  let best = u.pos, bs = maps.amph[u.pos];
  for (const [j] of reach) {
    if (W.tiles[j].land || !canEnd(u, j)) continue;
    const s = maps.amph[j] + adjacentEnemies(u.n, j) * 4;
    if (s < bs) { bs = s; best = j; }
  }
  if (best !== u.pos) moveUnit(u, best, reach);
}
function aiSea(u, ctx) {
  if (!uById.has(u.id)) return;
  const { maps, eTiles } = ctx;
  const reach = reachable(u);
  if (canAttackFrom(u)) {
    const att = bestAttackFrom(u, reach, eTiles);
    if (att && att.s > 10) {
      if (att.from !== u.pos) moveUnit(u, att.from, reach);
      if (uById.has(u.id)) doAttack(u, att.to);
      return;
    }
  }
  const support = u.t === 'cv' || u.t === 'lhd' || u.t === 'ssbn';
  const map = u.hp < 40 || u.t === 'ssbn' ? maps.homePort : maps.sea;
  if (map[u.pos] >= INF && !support) return;
  let best = u.pos, bs = map[u.pos] + (support ? 4 : 0);
  for (const [j] of reach) {
    if (!canEnd(u, j)) continue;
    let s = map[j] + (u.hp < 60 || support ? adjacentEnemies(u.n, j) * 5 : 0);
    if (support && map[j] < 4) s += 6;
    if (s < bs) { bs = s; best = j; }
  }
  if (best !== u.pos) moveUnit(u, best, reach);
  if (!uById.has(u.id) || u.mv <= 0 || !canAttackFrom(u)) return;
  const a2 = bestAttackFrom(u, new Map([[u.pos, { left: u.mv, prev: -1 }]]), eTiles);
  if (a2 && a2.s > 10) doAttack(u, a2.to);
}
function aiAir(u, ctx) {
  if (!uById.has(u.id) || u.acted || u.hp < 45) return;
  const { eTiles } = ctx;
  let best = null;
  const quick = j => { const g = groundAt(j), s = shipAt(j); return (g && atWar(u.n, g.n) ? CLASSES[g.t].cost * (1.5 - g.hp / 100) : 0) + (s && atWar(u.n, s.n) ? CLASSES[s.t].cost : 0) + (W.tiles[j].city >= 0 ? 20 : 0); };
  const tg = attackTargets(u, u.pos, null, eTiles).sort((a, b) => quick(b) - quick(a)).slice(0, 8);
  for (const k of tg) {
    const e = evalAttack(u, k, u.pos);
    if (e && (!best || e.s > best.s)) best = { s: e.s, to: k };
  }
  if (best && best.s > 8) { doAttack(u, best.to); return; }
  if (u.carrier) return;
  const pts = [...eTiles];
  if (!pts.length) return;
  const sample = pts.length > 60 ? pts.filter((_, k) => k % Math.ceil(pts.length / 60) === 0) : pts;
  const near = i => sample.reduce((m, p) => Math.min(m, kmDist(i, p)), INF);
  const here = near(u.pos);
  if (here <= unitKm(u)) return;
  let bj = -1, bd = here;
  for (const j of rebaseTargets(u)) { const d = near(j); if (d < bd && d > 150) { bd = d; bj = j; } }
  if (bj >= 0) rebaseAir(u, bj);
}

// ---------- national decisions ----------
function weightedPick(w) {
  const ks = Object.keys(w).filter(k => w[k] > 0), tot = ks.reduce((s, k) => s + w[k], 0);
  let r = Math.random() * tot;
  for (const k of ks) { r -= w[k]; if (r <= 0) return k; }
  return ks[0] || 'inf';
}
function mixOf(n) {
  const F = NATIONS[n].forces || { inf: 1 }, w = {};
  for (const [k, v] of Object.entries(F)) if (v > 0 && canRecruitClass(n, k)) w[k] = v;
  if (!Object.keys(w).length) w.inf = 1;
  return w;
}
function aiEconomy(n, enemies, zone) {
  const N = G.nations[n], minor = NATIONS[n].tier === 'minor';
  const e = economyPreview(n);
  N.rd = enemies.length ? 0.15 : 0.3;
  if (!N.research) pickResearch(n);
  const reserve = Math.max(12, e.upkeep * 1.2);
  if (e.net < 0 && N.money < 40) {
    // bankrupt: stand down the least useful units far from any front
    const spare = G.units.filter(u => u.n === n && !(zone && zone[u.pos]) && !u.carrier).sort((a, b) => CLASSES[b.t].up - CLASSES[a.t].up);
    let gap = -e.net;
    for (const u of spare) { if (gap <= 0) break; if (W.tiles[u.pos].city >= 0 && groundAt(u.pos) === u && CLASSES[u.t].dom === 'land') continue; gap -= CLASSES[u.t].up; if (u.t === 'cv') for (const x of G.units.slice()) if (x.carrier === u.id) removeUnit(x); removeUnit(u); }
    N.rd = 0.05;
    return;
  }
  const mine = G.units.reduce((s, u) => s + (u.n === n ? 1 : 0), 0);
  const cs = citiesOf(n);
  const cap = minor ? cs.length * 2 + 1 : cs.length * 3 + 12;
  if (!enemies.length && N.money > 350 && !minor) {
    N.rd = 0.35;
    const big = cs.filter(c => G.cities[c.id].factory < 2).sort((a, b) => G.cities[b.id].pop - G.cities[a.id].pop)[0];
    if (big) build(n, big.id, 'factory');
  }
  if (!enemies.length && mine >= cs.length * (minor ? 1 : 1.3)) return;
  const cities = cs.map(cy => ({ cy, th: zone && zone[cy.tile] ? 0 : 9 })).sort((a, b) => a.th - b.th || G.cities[b.cy.id].pop - G.cities[a.cy.id].pop);
  for (const { cy, th } of cities) if (th === 0 && G.cities[cy.id].fort < 2 && N.money > reserve + 70) build(n, cy.id, 'fort');
  if (!minor && enemies.length && N.money > reserve + 100) {
    const opts = missileBuildable(n).filter(M => M.type !== 'icbm' && M.type !== 'slbm');
    if (opts.length && Object.values(N.arsenal).reduce((s, v) => s + v, 0) < 12) buyMissile(n, opts[Math.floor(Math.random() * opts.length)].id);
  }
  if (!minor && has(n, 'nuke') && N.nukes < 3 && N.money > reserve + 150 && Math.random() < 0.2) produceNuke(n);
  if (!minor && N.money > reserve + 140) {
    let k = 0;
    for (const u of G.units) { if (k >= 2) break; if (u.n === n && W.tiles[u.pos].city >= 0 && modernizeCheck(u).ok) { modernize(u); k++; } }
  }
  let count = mine + G.queue.filter(q => q.n === n).length;
  const mix = minor ? { inf: 1 } : mixOf(n);
  for (const { cy, th } of cities) {
    if (count >= cap || N.money < reserve + 18) break;
    for (let slot = 0; slot < 2; slot++) {
      const garrisoned = !!groundAt(cy.tile);
      let tries = 0, done = false;
      while (tries++ < 4 && !done) {
        let t = (!garrisoned && th === 0 && slot === 0) ? (has(n, 'mech') && Math.random() < 0.5 ? 'mech' : 'inf') : weightedPick(mix);
        if (th > 0 && CLASSES[t].dom === 'land' && Math.random() < 0.4) t = 'inf';
        if (N.money - unitCost(n, t) < reserve) continue;
        if (recruit(n, cy.id, t)) { count++; done = true; }
      }
      if (!done) break;
    }
  }
}
function aiMissiles(n, eTiles) {
  let shots = n === 'PRK' || n === 'IRN' ? 3 : 2;
  const sitesBy = {};
  while (shots-- > 0) {
    if (Math.random() > 0.6) break;
    const cand = [];
    for (const mid of missileOwned(n)) {
      const M = MISSILES[mid];
      sitesBy[mid] = sitesBy[mid] || missileLaunchSites(n, mid);
      if (!sitesBy[mid].length) continue;
      for (const j of eTiles) {
        const g = groundAt(j), s = shipAt(j), ci = W.tiles[j].city;
        let v = 0;
        if (g && atWar(n, g.n)) v += CLASSES[g.t].cost / 12 + (g.hp < 45 ? 3 : 0);
        if (s && atWar(n, s.n)) v += CLASSES[s.t].cost / 10 * (M.shipDmg ? 1.6 : 1);
        if (ci >= 0 && atWar(n, G.cities[ci].owner)) v += (G.cities[ci].pop + G.cities[ci].ind) / 4 + (W.cities[ci].cap ? 3 : 0) + cityAirCount(j) * 1.5;
        v -= M.cost / 25;
        if (v > 2) cand.push({ v, j, mid });
      }
    }
    cand.sort((a, b) => b.v - a.v);
    let best = null, tried = 0;
    for (const c of cand) {
      if (tried >= 10) break;
      if (missileSite(n, c.mid, c.j, sitesBy[c.mid]) < 0) continue;
      tried++;
      const v = c.v * (1 - interceptChance(n, c.mid, c.j));
      if (!best || v > best.v) best = { ...c, v };
    }
    if (!best || best.v < 2) break;
    fireMissile(n, best.mid, best.j, false);
  }
}
function nukeStrike(n, against) {
  const N = G.nations[n];
  if (N.nukes <= 0) return false;
  const cands = [];
  for (const mid of missileOwned(n)) if (MISSILES[mid].nuke) cands.push(mid);
  if (!cands.length) return false;
  const targets = citiesOf(against).sort((a, b) => G.cities[b.id].pop - G.cities[a.id].pop);
  for (const cy of targets.slice(0, 8)) {
    for (const mid of cands.sort((a, b) => MISSILES[b].yieldKt - MISSILES[a].yieldKt)) {
      if (missileSite(n, mid, cy.tile) >= 0 && missileTargetOk(n, cy.tile)) { fireMissile(n, mid, cy.tile, true); return true; }
    }
  }
  return false;
}
function aiNuclear(n, eTiles) {
  const N = G.nations[n];
  const list = G.flags.retaliate || [];
  for (const r of list.slice()) {
    if (r.from !== n) continue;
    list.splice(list.indexOf(r), 1);
    if (n === G.player || !atWar(n, r.against) || N.nukes <= 0) continue;
    const odds = hasTrait(n, 'triad') || hasTrait(n, 'force_de_frappe') ? 0.95 : 0.7;
    if (Math.random() < odds && nukeStrike(n, r.against)) logMsg(`[${nName(n)}] 핵 보복 명령 하달`, 'nuke', n);
  }
  if (N.nukes <= 0) return;
  const doctrine = ['RUS', 'PRK', 'PAK'].includes(n) ? 0.1 : ['CHN', 'IND', 'ISR'].includes(n) ? 0.03 : 0.01;
  const cap = W.cities.find(c => c.nat === n && c.cap);
  const capThreat = cap && [...tilesWithin(cap.tile, 1)].some(j => { const g = groundAt(j); return g && atWar(n, g.n); });
  const desperate = (cap && G.cities[cap.id].owner !== n) || N.stab < 15 || capThreat;
  if (!desperate || Math.random() > doctrine) return;
  let best = null;
  for (const j of eTiles) {
    let v = 0;
    for (const k of tilesWithin(j, 1)) { const g = groundAt(k); if (g && atWar(n, g.n)) v += CLASSES[g.t].cost; }
    if (!best || v > best.v) best = { v, j };
  }
  if (!best || best.v < 60) return;
  const mid = missileOwned(n).filter(m => MISSILES[m].nuke).sort((a, b) => MISSILES[a].yieldKt - MISSILES[b].yieldKt).find(m => missileSite(n, m, best.j) >= 0);
  if (mid) { logMsg(`[${nName(n)}] 전술핵 사용 승인 — "확전을 통한 긴장 완화"`, 'nuke', n); fireMissile(n, mid, best.j, true); }
}
function aiDeploy(n, zone, eTiles) {
  const N = G.nations[n];
  if (N.money < 60) return;
  const pts = [...eTiles].filter(j => W.tiles[j].city >= 0);
  if (!pts.length) return;
  const sample = pts.length > 40 ? pts.filter((_, k) => k % Math.ceil(pts.length / 40) === 0) : pts;
  const near = i => sample.reduce((m, p) => Math.min(m, kmDist(i, p)), INF);
  const dests = W.cities.filter(c => friendly(n, G.cities[c.id].owner) && !zone[c.tile] && G.cities[c.id].hp > 50).map(c => ({ c, d: near(c.tile) })).sort((a, b) => a.d - b.d).slice(0, 6);
  if (!dests.length) return;
  let sent = 0;
  for (const u of G.units.filter(x => x.n === n && !zone[x.pos] && !x.acted && !x.moved && !x.carrier)) {
    if (sent >= 3 || N.money < 50) break;
    const C = CLASSES[u.t];
    if (C.dom === 'land' && (mustGarrison(u, zone) || (W.tiles[u.pos].city >= 0 && groundAt(u.pos) === u && citiesOf(n).length > 1 && Math.random() < 0.5))) continue;
    const here = near(u.pos);
    for (const { c, d } of dests) {
      if (d > here * 0.5 || d > 2500 && C.dom === 'land') continue;
      if (C.dom === 'sea' && !c.port) continue;
      const p = deployPlan(u, c.id);
      if (p.ok && p.cost < N.money * 0.25) { deploy(u, c.id); sent++; break; }
    }
  }
}
function aiDiplomacy(n) {
  const p = G.player, minor = NATIONS[n].tier === 'minor';
  for (const e of enemiesOf(n)) {
    if (e === p) {
      if (peaceAcceptance(n, e) > 0.7 && Math.random() < 0.25 && !G.pending.some(x => x.from === n)) G.pending.push({ type: 'peace', from: n });
    } else if (peaceAcceptance(n, e) > 0.62 && peaceAcceptance(e, n) > 0.45 && Math.random() < 0.3) makePeace(n, e);
  }
  if (minor || G.nations[n].puppet) return;
  for (const o of MAJOR_IDS) {
    if (o === n || G.nations[o].capitulated) continue;
    if (atWar(n, o) || allied(n, o)) continue;
    const common = enemiesOf(n).some(e => atWar(o, e));
    if (common) addRel(n, o, 1);
    if (o === p) {
      if (common && rel(n, o) >= 45 && Math.random() < 0.06 && !G.pending.some(x => x.from === n)) G.pending.push({ type: 'alliance', from: n });
    } else if (allianceCheck(n, o).ok && Math.random() < 0.05) proposeAlliance(n, o);
    const truceOk = (G.truce[pk(n, o)] ?? -99) + 6 <= G.turn;
    if (!truceOk || G.flags.aiWarTurn === G.turn || rel(n, o) >= -55 || (o === p && G.turn < 12)) continue;
    if (militaryPower(n) < 2 * militaryPower(o)) continue;
    const capA = capitalOf(n), capB = capitalOf(o);
    if (!capA || !capB || kmDist(capA.tile, capB.tile) > 3500) continue;   // only neighbours start wars of choice
    const deterred = G.nations[o].nukes > 0 || NATION_IDS.some(x => G.ally[pk(x, o)] && G.nations[x].nukes > 0 && !allied(x, n));
    if (Math.random() < (deterred ? 0.002 : 0.01)) { G.flags.aiWarTurn = G.turn; declareWar(n, o); }
  }
}
function aiCyber(n) {
  if (!has(n, 'cyber') || G.nations[n].money < 60 || Math.random() > 0.3) return;
  const es = enemiesOf(n);
  if (es.length) cyberAttack(n, es[Math.floor(Math.random() * es.length)]);
}
function aiTurn(n) {
  const N = G.nations[n];
  if (!N.alive || N.capitulated) return;
  const minor = NATIONS[n].tier === 'minor';
  aiDiplomacy(n);
  const enemies = enemiesOf(n);
  const eTiles = enemies.length ? enemyTiles(n) : new Set();
  const zone = enemies.length ? threatZone(n, eTiles, minor ? 5 : 10) : new Uint8Array(W.N);
  aiEconomy(n, enemies, zone);
  if (!enemies.length) return;
  if (!minor) { aiNuclear(n, eTiles); aiMissiles(n, eTiles); aiCyber(n); aiDeploy(n, zone, eTiles); }
  const mine = G.units.filter(u => u.n === n && !u.acted);
  const busy = mine.filter(u => CLASSES[u.t].dom === 'air' ? !minor : zone[u.pos]);
  if (!busy.length) return;
  const ctx = { maps: buildMaps(n, eTiles), eTiles, zone, minor };
  const order = u => { const d = CLASSES[u.t].dom; return d === 'air' ? 0 : isRanged(u) && d === 'land' ? 1 : d === 'sea' ? 2 : 3; };
  busy.sort((a, b) => order(a) - order(b));
  for (const u of busy) {
    if (!uById.has(u.id) || u.acted) continue;
    const dom = CLASSES[u.t].dom;
    if (dom === 'air') aiAir(u, ctx);
    else if (dom === 'sea') aiSea(u, ctx);
    else aiLand(u, ctx);
  }
}
function aiEvents(n) {
  const ev = rollEvent(n);
  if (ev) applyEvent(n, ev, null);
}
