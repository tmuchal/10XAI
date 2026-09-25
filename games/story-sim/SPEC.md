# 운명극장 — content & art contract

The format the engine (`js/engine.js`), the art module (`js/art.js`) and the story packs (`story/*.js`) share. All files are classic `<script>` globals, loaded in this order:

```
js/art.js → js/engine.js → story/rofan.js → story/raise.js → story/star.js → js/boot.js
```

No modules and no build step. Each story file calls `STORY.register(pack)` once. Everything user-facing is written in Korean.

---

## 1. Art (`js/art.js`, global `ART`)

```js
ART.portrait(look, emo, opts?)  // → SVG markup string. viewBox "0 0 400 600", transparent, a bust down to the waist.
                                //   opts.crop === 'face' → the same drawing with viewBox cropped to the head (square).
ART.bg(id)                      // → data URL (PNG) of a painted 1280×720 background. Cached per id.
ART.BG_IDS                      // every background id it can paint
ART.EMOTIONS                    // the 12 emotions below
```

### `look` (character appearance)

| key | values |
|---|---|
| `sex` | `'f'` \| `'m'` |
| `age` | `'child'` (≈10) \| `'teen'` \| `'adult'` \| `'elder'` |
| `skin` | hex, e.g. `'#f7dccb'` |
| `hair` | hex. `hair2` optional hex for gradient tips / highlights |
| `hairStyle` | `long` `wavy` `bob` `ponytail` `twintail` `braid` `updo` `bun` `short` `messy` `slick` `long_m` (a man's long hair tied low) |
| `bangs` | `straight` `side` `parted` `none` |
| `eyes` | hex iris colour |
| `eyeShape` | `round` `sharp` `gentle` `droopy` |
| `outfit` | `gown` `uniform` `suit` `school` `stage` `robe` `armor` `casual` `maid` `dress_child` `coat` `hanbok` `tracksuit` `priest` |
| `outfitColor` | hex. `accent` optional hex for trim / embroidery |
| `acc` | array of: `crown` `tiara` `glasses` `earrings` `ribbon` `hairpin` `cape` `scar` `mole` `flower` `headphones` `necklace` `veil` `hat` `beard` `monocle` `epaulets` `choker` |

### Emotions (exactly these ids)

`neutral` `smile` `laugh` `sad` `cry` `angry` `surprised` `shy` `smirk` `cold` `worried` `tired`

### Background ids (exactly these)

- Common: `black` `white` `sky_day` `sky_sunset` `sky_night`
- Romance fantasy: `palace_hall` `ballroom` `garden_rose` `bedroom_noble` `study_duke` `library` `corridor_night` `carriage` `chapel` `balcony_night` `forest` `town_market` `dungeon` `throne_room` `tea_room` `lake`
- Raising: `house_day` `house_night` `daughter_room` `town_square` `school` `church` `castle_gate` `field_training` `festival` `tavern` `mage_tower` `hill_sunset` `farm` `harbor`
- Star: `agency_office` `practice_room` `dorm` `stage_concert` `broadcast_studio` `filming_set` `audition_hall` `rooftop_night` `cafe` `street_seoul` `press_room` `awards` `airport` `hospital` `han_river`

---

## 2. Story pack

```js
STORY.register({
  id: 'rofan',                 // 'rofan' | 'raise' | 'star'
  genre: '로맨스 판타지',
  title: '…', subtitle: '…', blurb: '2–3 sentence pitch shown on the genre card',
  cover: { bg: 'ballroom', c: 'kael', e: 'smirk' },   // key art for the genre card
  world: '…',                  // 5–10 sentences of setting, for the AI chat prompt
  player: { label: '당신의 이름', def: '레티시아' }, // the player's name prompt (stored as s.name)
  vars: { money: 500, stress: 0 },                   // initial numbers (S.v)
  stats: [ { id: 'int', name: '지능', max: 100, color: '#7aa2ff' }, … ],  // numbers shown as bars
  chars: {
    kael: {
      name: '카엘 드 벨몬트', short: '카엘', role: '북부 대공', color: '#9ab7ff',
      look: { …see §1… },
      persona: '5–8 sentences for the AI: personality, secret, what they want from the player, speech style (존댓말/반말, 말버릇), what they never do.',
      talk: [                  // scripted chat topics — the fallback when AI chat is unavailable
        { t: '요즘 어떻게 지내?', if: {…optional cond…}, lines: [ {c:'kael', t:'…', e:'smile'}, … ], fx: { aff: { kael: 2 } } },
        …(at least 5 per main character)
      ],
    },
  },
  start: 'prologue',
  scenes: { prologue: [ …steps… ], … },
  endings: { true_kael: { title: '…', rank: 'S', t: 'epilogue, 3–6 sentences', bg: 'lake', c: 'kael', e: 'smile' }, … },
  endingRules: [ { id: 'true_kael', if: {…cond…} }, …, { id: 'normal', if: {} } ],  // first match wins, for {ending:'auto'}
  sim: { … },                  // optional, see §5
});
```

State the engine keeps (`S`): `S.v` numbers (stats and vars together), `S.s` strings (`name`, route, names…), `S.aff` affection per character id (0–100), `S.flags` set, `S.turn` (sim turn index from 0).

Initial affection: `affStart: { kael: 10, rian: 20 }` at pack level (default 0).

### Text

- Plain Korean. Interpolation works in step text, choice labels, character `name`/`short`, and ending text. `{name}` → the player's name. `{s.key}` → a string var. `{v.key}` → a number var.
- `{c:'…'}` as the speaker; the special speaker `'me'` is the player (no portrait, name shown as the player's name).

---

## 3. Steps (a scene is an array of steps, run in order)

| step | meaning |
|---|---|
| `'…'` | narration (shorthand for `{t:'…'}`) |
| `{t:'…'}` | narration |
| `{c:'kael', t:'…', e:'smile', as:'???'}` | a character line. `e` sets the expression (it persists). `as` overrides the displayed name. Speaking auto-shows the character. |
| `{c:'me', t:'…'}` | the player speaks |
| `{bg:'ballroom', fx:'fade'\|'flash'\|'shake'}` | change the background (default `fade`) |
| `{show:'kael', e:'cold', at:'l'\|'c'\|'r'}` | show / move a character |
| `{hide:'kael'}` / `{hide:'all'}` | hide |
| `{title:'제1장', sub:'가면무도회'}` | a full-screen chapter card |
| `{fx:{…effect…}}` | apply an effect (see §4). Changes are shown as small toasts. |
| `{if:cond, then:[…], else:[…]}` | branch |
| `{choice:[ opt, … ], prompt:'…'}` | a choice. `opt = {t:'label', if:cond, req:cond, hint:'why locked', fx:{…}, then:[…], go:'scene'}`. `if` hides the option when false; `req` shows it locked with `hint`. After `then`, `go` jumps; without `go` the scene continues. |
| `{go:'scene'}` | jump (no return) |
| `{call:'scene'}` | run another scene, then come back |
| `{chat:'kael', goal:'what this talk is about', max:4}` | an **in-scene free conversation**. With AI available the player types freely for up to `max` messages; the character replies in character and affection shifts (±3 per message at most). Without AI the engine offers that character's `talk` topics instead. Then the scene continues. |
| `{input:'dname', label:'딸의 이름', def:'올리브'}` | ask for a name, store in `S.s.dname` |
| `{toast:'…'}` | a small notification |
| `{ending:'id'}` / `{ending:'auto'}` | show an ending (`auto` → first matching `endingRules`) and finish the run |
| `{end:true}` | end this scene: in a sim pack this returns to the hub; in a pure story pack it is only used at the very end |

### Conditions (`cond`, every key must hold)

```js
{ v: { int: '>=50', money: '<0' } }   // comparators: '>=N' '<=N' '>N' '<N' '==N' '!=N'
{ aff: { kael: '>=60' } }
{ flag: 'met_kael' } / { flag: ['a','b'] }   // all set
{ noflag: 'x' } / { noflag: ['x','y'] }     // none set
{ s: { route: 'kael' } }                    // string equality
{ turn: '>=24' } { age: '>=12' } { month: 4 }  // sim only (age = ageStart + floor(turn/12) for monthly sims)
{ top: 'kael' }        // kael has the strictly-highest affection among chars with affection
{ maxstat: 'int' }     // 'int' is the highest of pack.stats
{ chance: 0.3 }
{ any: [cond, …] } { all: [cond, …] } { not: cond }
```

## 4. Effects (`fx`)

```js
{ v: { int: +3, money: -100 },   // add to numbers (clamped to 0..max for stats; money may go negative)
  set: { route: 'kael' },        // set strings
  setv: { stress: 0 },           // set numbers absolutely
  aff: { kael: +5 },             // affection, clamped 0..100
  flag: 'met_kael' | ['a','b'],
  unflag: 'x' | [...] }
```

---

## 5. Sim layer (optional `pack.sim` — used by the raising and star packs)

The run alternates: **hub → plan the turn → the turn plays out → events → hub**, until `turns` run out, then `finale`.

```js
sim: {
  unit: 'month',            // 'month' | 'week'
  start: { year: 1, month: 3 },   // calendar label only
  yearLabel: '왕국력 {y}년',       // optional; {y} {m}
  turns: 96,                // total turns
  ageStart: 10,             // optional: age shown and usable in conds
  slots: 3, slotNames: ['상순','중순','하순'],   // activities per turn
  hubChar: 'daughter',      // char id shown in the hub. 's:star' → the char id stored in S.s.star
  hubCharByAge: { 14: 'daughter_teen', 17: 'daughter_adult' },  // optional: swap the hub char from that age on
  hubBg: 'house_day',       // or hubBgNight for alternate turns — engine picks day/night itself if both exist
  money: 'money',           // which var is money (shown in the HUD)
  hud: ['money','stress'],  // vars shown in the HUD besides stats
  activities: [
    { id: 'study', name: '학교 수업', cat: '교육', // no emoji anywhere; `cat` groups activities in the planner
      desc: '…', cost: 50,             // money per slot (negative = income, e.g. part-time jobs)
      fx: { v: { int: +4, stress: +3 } },
      req: cond, hint: 'why locked',
      great: { chance: 0.15, fx: {…}, t: '…' },   // optional bonus outcome
      fail:  { chance: 0.1,  fx: {…}, t: '…' },   // base chance; the engine adds stress/250
      lines: ['flavor line shown while it plays', …] },
  ],
  shop: [ { id, name, price, desc, fx, once: true } ],   // optional
  events: [ { id, if: cond, scene: 'sceneId', prio: 10, once: true (default), at: 'start'|'end' (default 'end') } ],
  turnFx: { v: { stress: -2 } },   // applied automatically every turn (e.g. natural recovery)
  finale: 'finale',               // scene run after the last turn; it should end with {ending:'auto'} or specific endings
}
```

Events fire in priority order (higher first), at most **one `start` event and one `end` event per turn**. Event scenes end with `{end:true}`.

The hub also always offers **대화하기** (free AI chat with the hub character, with `talk` topics as the fallback) and **상태** (stats).

---

## 6. Validation

Each story file must load in Node with a stub (`global.STORY={register(p){…}}`) and pass `node games/story-sim/tools/validate.js story/<file>.js`, which checks: every `go`/`call`/`scene` target exists; every `bg` id is in the list above; every speaker/show id is a char or `'me'`; every `e` is a valid emotion; every `ending` id exists; every `look` uses allowed values.
