#!/usr/bin/env node
// Validates a story pack against SPEC.md. Usage: node tools/validate.js story/rofan.js
const fs = require('fs'), path = require('path'), vm = require('vm');

const BG = 'black white sky_day sky_sunset sky_night palace_hall ballroom garden_rose bedroom_noble study_duke library corridor_night carriage chapel balcony_night forest town_market dungeon throne_room tea_room lake house_day house_night daughter_room town_square school church castle_gate field_training festival tavern mage_tower hill_sunset farm harbor agency_office practice_room dorm stage_concert broadcast_studio filming_set audition_hall rooftop_night cafe street_seoul press_room awards airport hospital han_river'.split(' ');
const EMO = 'neutral smile laugh sad cry angry surprised shy smirk cold worried tired'.split(' ');
const LOOK = {
  sex: ['f', 'm'], age: ['child', 'teen', 'adult', 'elder'],
  hairStyle: 'long wavy bob ponytail twintail braid updo bun short messy slick long_m'.split(' '),
  bangs: 'straight side parted none'.split(' '), eyeShape: 'round sharp gentle droopy'.split(' '),
  outfit: 'gown uniform suit school stage robe armor casual maid dress_child coat hanbok tracksuit priest'.split(' '),
};
const ACC = 'crown tiara glasses earrings ribbon hairpin cape scar mole flower headphones necklace veil hat beard monocle epaulets choker'.split(' ');
const STEP_KEYS = new Set('t c e as bg fx show at hide title sub if then else choice prompt go call chat goal max input label def toast ending end'.split(' '));
const COND_KEYS = new Set('v aff flag noflag s turn age month top maxstat chance any all not'.split(' '));
const FX_KEYS = new Set('v set setv aff flag unflag'.split(' '));

const file = process.argv[2];
if (!file) { console.error('usage: node tools/validate.js story/<pack>.js'); process.exit(2); }
const packs = [];
const ctx = { STORY: { register: p => packs.push(p) }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(file), 'utf8'), ctx, { filename: file });
if (packs.length !== 1) { console.error(`expected 1 STORY.register call, got ${packs.length}`); process.exit(1); }
const P = packs[0];
const errs = [], warn = [];
const E = (w, m) => errs.push(`${w}: ${m}`);
const chars = P.chars || {}, scenes = P.scenes || {}, endings = P.endings || {};
const statIds = new Set([...(P.stats || []).map(s => s.id), ...Object.keys(P.vars || {})]);
const referenced = new Set([P.start]);

for (const k of ['id', 'genre', 'title', 'blurb', 'world', 'start', 'scenes', 'chars', 'endings']) if (!P[k]) E('pack', `missing ${k}`);
if (P.start && !scenes[P.start]) E('pack', `start scene ${P.start} missing`);
if (P.cover) { if (!BG.includes(P.cover.bg)) E('cover', `bad bg ${P.cover.bg}`); if (P.cover.c && !chars[P.cover.c]) E('cover', `bad char ${P.cover.c}`); }

for (const [id, c] of Object.entries(chars)) {
  const w = `char ${id}`;
  for (const k of ['name', 'look', 'persona']) if (!c[k]) E(w, `missing ${k}`);
  const L = c.look || {};
  for (const [k, vals] of Object.entries(LOOK)) if (L[k] !== undefined && !vals.includes(L[k])) E(w, `look.${k}=${L[k]}`);
  for (const k of ['sex', 'age', 'skin', 'hair', 'hairStyle', 'eyes', 'outfit', 'outfitColor']) if (L[k] === undefined) E(w, `look.${k} missing`);
  for (const a of L.acc || []) if (!ACC.includes(a)) E(w, `look.acc ${a}`);
  (c.talk || []).forEach((tp, i) => { checkCond(tp.if, `${w}.talk[${i}]`); (tp.lines || []).forEach(l => checkStep(l, `${w}.talk[${i}]`)); checkFx(tp.fx, `${w}.talk[${i}]`); });
}

function checkCond(c, w) {
  if (!c) return;
  if (typeof c !== 'object') return E(w, `cond not object`);
  for (const [k, v] of Object.entries(c)) {
    if (!COND_KEYS.has(k)) E(w, `unknown cond key ${k}`);
    if (k === 'any' || k === 'all') (v || []).forEach(x => checkCond(x, w));
    if (k === 'not') checkCond(v, w);
    if (k === 'aff' || k === 'top') for (const id of k === 'top' ? [v] : Object.keys(v)) if (!chars[id]) E(w, `cond aff unknown char ${id}`);
    if (k === 'v') for (const [s, cmp] of Object.entries(v)) { if (!/^(>=|<=|>|<|==|!=)-?\d+(\.\d+)?$/.test(String(cmp))) E(w, `bad comparator ${s}:${cmp}`); if (!statIds.has(s)) warn.push(`${w}: cond on undeclared var ${s}`); }
    if (['turn', 'age'].includes(k) && !/^(>=|<=|>|<|==|!=)-?\d+$/.test(String(v))) E(w, `bad ${k} comparator ${v}`);
  }
}
function checkFx(f, w) {
  if (!f) return;
  for (const [k, v] of Object.entries(f)) {
    if (!FX_KEYS.has(k)) E(w, `unknown fx key ${k}`);
    if (k === 'aff') for (const id of Object.keys(v)) if (!chars[id]) E(w, `fx aff unknown char ${id}`);
    if (k === 'v' || k === 'setv') for (const s of Object.keys(v)) if (!statIds.has(s)) warn.push(`${w}: fx on undeclared var ${s}`);
  }
}
function checkStep(st, w) {
  if (typeof st === 'string') return;
  if (!st || typeof st !== 'object') return E(w, 'bad step');
  for (const k of Object.keys(st)) if (!STEP_KEYS.has(k)) E(w, `unknown step key ${k}`);
  if (st.c && st.c !== 'me' && !chars[st.c]) E(w, `unknown speaker ${st.c}`);
  if (st.show && !chars[st.show]) E(w, `unknown show ${st.show}`);
  if (st.hide && st.hide !== 'all' && !chars[st.hide]) E(w, `unknown hide ${st.hide}`);
  if (st.chat && !chars[st.chat]) E(w, `unknown chat ${st.chat}`);
  if (st.e && !EMO.includes(st.e)) E(w, `bad emotion ${st.e}`);
  if (st.bg && !BG.includes(st.bg)) E(w, `bad bg ${st.bg}`);
  if (st.at && !['l', 'c', 'r'].includes(st.at)) E(w, `bad at ${st.at}`);
  if (st.go) { referenced.add(st.go); if (!scenes[st.go]) E(w, `go to missing scene ${st.go}`); }
  if (st.call) { referenced.add(st.call); if (!scenes[st.call]) E(w, `call to missing scene ${st.call}`); }
  if (st.ending && st.ending !== 'auto' && !endings[st.ending]) E(w, `missing ending ${st.ending}`);
  if (st.fx && typeof st.fx === 'object') checkFx(st.fx, w);
  if (st.if !== undefined && (st.then || st.else)) checkCond(st.if, w);
  (st.then || []).forEach(s => checkStep(s, w));
  (st.else || []).forEach(s => checkStep(s, w));
  if (st.choice) st.choice.forEach((o, i) => {
    const ww = `${w}.choice[${i}]`;
    if (!o.t) E(ww, 'missing label');
    checkCond(o.if, ww); checkCond(o.req, ww); checkFx(o.fx, ww);
    if (o.go) { referenced.add(o.go); if (!scenes[o.go]) E(ww, `go to missing scene ${o.go}`); }
    (o.then || []).forEach(s => checkStep(s, ww));
  });
}
for (const [id, arr] of Object.entries(scenes)) {
  if (!Array.isArray(arr)) { E(`scene ${id}`, 'not an array'); continue; }
  arr.forEach((st, i) => checkStep(st, `scene ${id}[${i}]`));
}
for (const [id, en] of Object.entries(endings)) {
  if (!en.title || !en.t) E(`ending ${id}`, 'missing title/t');
  if (en.bg && !BG.includes(en.bg)) E(`ending ${id}`, `bad bg ${en.bg}`);
  if (en.c && !chars[en.c]) E(`ending ${id}`, `bad char ${en.c}`);
  if (en.e && !EMO.includes(en.e)) E(`ending ${id}`, `bad emo ${en.e}`);
}
(P.endingRules || []).forEach((r, i) => { if (!endings[r.id]) E(`endingRules[${i}]`, `missing ending ${r.id}`); checkCond(r.if, `endingRules[${i}]`); });

if (P.sim) {
  const S = P.sim;
  for (const k of ['turns', 'slots', 'activities', 'finale']) if (S[k] === undefined) E('sim', `missing ${k}`);
  if (S.finale) { referenced.add(S.finale); if (!scenes[S.finale]) E('sim', `finale scene ${S.finale} missing`); }
  if (S.hubChar && !S.hubChar.startsWith('s:') && !chars[S.hubChar]) E('sim', `hubChar ${S.hubChar}`);
  for (const b of [S.hubBg, S.hubBgNight]) if (b && !BG.includes(b)) E('sim', `hub bg ${b}`);
  const ids = new Set();
  (S.activities || []).forEach((a, i) => {
    const w = `activity ${a.id || i}`;
    if (ids.has(a.id)) E(w, 'duplicate id'); ids.add(a.id);
    for (const k of ['id', 'name', 'cat', 'fx']) if (!a[k]) E(w, `missing ${k}`);
    checkFx(a.fx, w); checkCond(a.req, w);
    if (a.great) checkFx(a.great.fx, w); if (a.fail) checkFx(a.fail.fx, w);
  });
  (S.shop || []).forEach((it, i) => checkFx(it.fx, `shop ${it.id || i}`));
  (S.events || []).forEach((ev, i) => {
    const w = `event ${ev.id || i}`;
    checkCond(ev.if, w);
    referenced.add(ev.scene);
    if (!scenes[ev.scene]) E(w, `scene ${ev.scene} missing`);
  });
  checkFx(S.turnFx, 'sim.turnFx');
}
const orphans = Object.keys(scenes).filter(s => !referenced.has(s));
const count = o => JSON.stringify(o).length;
const lines = Object.values(scenes).reduce((n, a) => n + a.length, 0);
console.log(`${P.id}: ${Object.keys(scenes).length} scenes, ${lines} top-level steps, ${Object.keys(chars).length} chars, ${Object.keys(endings).length} endings, ${(P.sim?.events || []).length} events, ${(P.sim?.activities || []).length} activities, ${(count(P) / 1024).toFixed(0)} KB`);
if (orphans.length) warn.push(`unreferenced scenes: ${orphans.join(', ')}`);
warn.slice(0, 30).forEach(w => console.log('WARN ' + w));
if (errs.length) { errs.slice(0, 80).forEach(e => console.log('ERR  ' + e)); console.log(`${errs.length} error(s)`); process.exit(1); }
console.log('OK');
