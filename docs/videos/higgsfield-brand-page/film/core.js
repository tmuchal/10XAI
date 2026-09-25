// ============================================================================
// Deterministic timeline. window.render(t) draws the frame at t seconds;
// render.cjs steps it frame by frame. Opened normally, it autoplays.
//
// REFERENCE: drop a full-page screenshot of your site at ref/page.png
// (1440px wide works best). Without it, an example mockup is shown.
// REF_MARKS: where the hook / proof / action labels sit (0..1 of page height).
//
// ---------------------------------------------------------------- HELPER API
// Existing (unchanged signatures):
//   el(tag, css, html, parent)       create element
//   pop(node, t, a, d=.6, dy=24)     fade + rise in; returns progress
//   seg(t,a,b) clamp lerp ease out back type fmt clamp $  PAL  INK  NOA
//   makeFilm(pal) -> div.film with .update(t, speed)   (bright watercolor landscape)
//   makeNoa(size, variant) / poseNoa(n, t, {x,y,s,wave,talk,look,mood,flip,hop,op})
//   makeBubble(parent) / sayBubble(b, t, a, z, text, x, y)
//   brandPage(), refWindow(parent,x,y,w,h) (.scrollTo(frac,t)), scene(a,b,build), chapter(root,k,t)
// Added:
//   hash(i, j=0, k=0) -> 0..1      deterministic noise (use instead of Math.random)
//   boilStep(t) -> int             the current 8 fps "line boil" step (hand-drawn wobble clock)
//   jiggle(node, t, amt=1, i=0)    hand-drawn wobble on one element (CSS rotate/translate
//                                  props, so it never fights your style.transform)
//   popIn(node, t, a, d=.45)       bouncy scale pop (back ease) + fade; returns progress
//   wobble(t, a, amp=6, freq=9, decay=3.5)  damped spring angle after an event at time a
//   PAL.mint, PAL.sunny, PAL.lilac  extra bright film palettes (night/sea/... are bright too)
//   poseNoa extra options: blink:false to keep eyes open, arms:'up'|'down'|'hips' override
//   wipe(node, t, a, dur=.6, dir='right'|'left'|'up'|'down')  ragged ink/paper-strip reveal (clip-path)
//   countStamp(node, t, a, to, {from, dur, fmt, prefix, suffix})  kinetic counter + stamp-in
//   makeBurst(parent, n=24, seed=1) -> svg with .fire(t, a, x, y, power=1)  deterministic sparkle burst
//   shakeCam(t, a, amp=10, dur=.45)  soft camera shake of the whole stage
// Scenes/elements with class "boil" also get the hand-drawn wobble automatically
// (as do .card .win .chap .bubble .chip .reftag .btn inside a scene).
// ============================================================================
const REF_URL = "noainostory.higgsfield.app";
const REF_MARKS = [[0.02, "훅 · Hook"], [0.4, "증거 · Proof"], [0.86, "행동 · Action"]];

const DURATION = 192, FADE = 0.6;
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const out = x => 1 - Math.pow(1 - x, 3);
const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const type = (s, p) => s.slice(0, Math.round(s.length * clamp(p)));
const lerp = (a, b, p) => a + (b - a) * p;
const hash = (i, j = 0, k = 0) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };
const boilStep = t => Math.floor(t * 8 + 1e-6);
const wobble = (t, a, amp = 6, freq = 9, decay = 3.5) => t < a ? 0 : amp * Math.exp(-decay * (t - a)) * Math.sin(freq * (t - a));
function el(tag, css, html, parent) {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
// fade + rise helper
function pop(node, t, a, d = 0.6, dy = 24) {
  const p = out(seg(t, a, a + d));
  node.style.opacity = p; node.style.transform = `translateY(${dy * (1 - p)}px)`;
  return p;
}
function popIn(node, t, a, d = 0.45) {
  const p = seg(t, a, a + d);
  node.style.opacity = clamp(p * 3); node.style.transform = `scale(${0.6 + 0.4 * back(p)})`;
  return p;
}
function jiggle(node, t, amt = 1, i = 0) {
  const k = boilStep(t), r = (hash(i, k) - .5) * .5 * amt, x = (hash(i, k, 1) - .5) * 1.6 * amt, y = (hash(i, k, 2) - .5) * 1.6 * amt;
  node.style.rotate = r.toFixed(3) + "deg"; node.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
}
// ink/paper-strip wipe reveal: dir 'left'|'right'|'up'|'down'; ragged edge jitters on the boil clock
function wipe(node, t, a, dur = .6, dir = "right") {
  const p = ease(seg(t, a, a + dur)), k = boilStep(t), N = 10, pts = [];
  const e = i => clamp(p * 112 - 6 + (hash(i, k, 9) - .5) * 8 * (p < 1 ? 1 : 0), 0, 100);
  for (let i = 0; i <= N; i++) { const v = i * 100 / N;
    pts.push(dir === "right" ? `${e(i)}% ${v}%` : dir === "left" ? `${100 - e(i)}% ${v}%` : dir === "down" ? `${v}% ${e(i)}%` : `${v}% ${100 - e(i)}%`); }
  const base = dir === "right" ? ["0% 100%", "0% 0%"] : dir === "left" ? ["100% 100%", "100% 0%"] : dir === "down" ? ["100% 0%", "0% 0%"] : ["100% 100%", "0% 100%"];
  node.style.clipPath = p >= 1 ? "none" : `polygon(${base[1]}, ${pts.join(", ")}, ${base[0]})`;
  node.style.opacity = p > 0 ? 1 : 0;
  return p;
}
// kinetic counter that stamps in: countStamp(node, t, a, to, {from, dur, fmt, prefix, suffix})
function countStamp(node, t, a, to, o = {}) {
  const { from = 0, dur = 1, fmt: f = fmt, prefix = "", suffix = "" } = o;
  const p = out(seg(t, a, a + dur)), st = seg(t, a + dur, a + dur + .35);
  const txt = prefix + f(lerp(from, to, p)) + suffix; if (node.textContent !== txt) node.textContent = txt;
  node.style.opacity = t < a ? 0 : 1;
  node.style.transform = `scale(${(st > 0 ? 1.35 - .35 * back(st) : 1 + .04 * Math.sin(t * 30) * (p < 1 ? 1 : 0)).toFixed(3)}) rotate(${(st > 0 ? -4 * (1 - st) : 0).toFixed(2)}deg)`;
  return p;
}
// deterministic sparkle/confetti burst: const b = makeBurst(parent, 28, seed); b.fire(t, a, x, y, power)
function makeBurst(parent, n = 24, seed = 1) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", 1); svg.setAttribute("height", 1); svg.setAttribute("overflow", "visible");
  svg.style.cssText = "position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:35";
  const cols = ["#ffcf3f", "#ff7f9a", "#6cc6f0", "#7fd1a0", "#b79bf0", "#ff9a4f"];
  const P = Array.from({ length: n }, (_, i) => { const e = document.createElementNS("http://www.w3.org/2000/svg", "path");
    e.setAttribute("d", i % 2 ? "M0 -9 Q1.5 -1.5 9 0 Q1.5 1.5 0 9 Q-1.5 1.5 -9 0 Q-1.5 -1.5 0 -9Z" : "M-6 -4 H6 V4 H-6Z");
    e.setAttribute("fill", cols[i % 6]); e.setAttribute("stroke", INK); e.setAttribute("stroke-width", 2); svg.appendChild(e); return e; });
  parent.appendChild(svg);
  svg.fire = (t, a, x, y, power = 1) => {
    const u = t - a; if (u < 0 || u > 1.6) { svg.style.display = "none"; return; }
    svg.style.display = "block";
    P.forEach((e, i) => { const ang = hash(i, seed) * 6.283, v = (220 + hash(i, seed, 2) * 380) * power;
      const px = x + Math.cos(ang) * v * u * (1 - u * .3), py = y + Math.sin(ang) * v * u * (1 - u * .3) + 300 * u * u;
      e.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${(u * 400 * (i % 2 ? 1 : -1)).toFixed(0)}) scale(${(1 - u / 1.6).toFixed(2)})`); });
  };
  return svg;
}
// soft screen shake: call shakeCam(t, a, amp=10, dur=.45) in a scene update (applied to the stage camera by boot.js)
function shakeCam(t, a, amp = 10, dur = .45) {
  if (t < a || t > a + dur) return;
  const u = (t - a) / dur, k = amp * (1 - u) * (1 - u), f = boilStep(t * 3);
  const s = window.SHAKE || [0, 0]; window.SHAKE = [s[0] + (hash(f, 1) - .5) * 2 * k, s[1] + (hash(f, 2) - .5) * 2 * k];
}
const fmt = n => Math.round(n).toLocaleString("ko-KR");

// ---------------------------------------------------------------- Film (SVG landscape)
// Bright daylight watercolor: sky gradient, glowing sun, drifting clouds,
// three mid-tone ridges with ink outlines (never near-black).
const PAL = {
  dawn:   { s1: "#9fd6f2", s2: "#ffd9bd", sun: "#fff3c4", r: ["#f7bfa3", "#ec9a82", "#d9786c"], mist: "#fff1e4" },
  forest: { s1: "#b8e4f6", s2: "#e9f7dc", sun: "#fffbe2", r: ["#b5e0b0", "#8cc996", "#69af7e"], mist: "#f3fbea" },
  gold:   { s1: "#ffe9a6", s2: "#ffcf96", sun: "#fffbe8", r: ["#f7ca78", "#eca95a", "#d88b48"], mist: "#fff4d8" },
  night:  { s1: "#b7b2f0", s2: "#fbcbe0", sun: "#fff7fb", r: ["#b3a6e6", "#9587d6", "#7a6dc2"], mist: "#f3ecff" },
  sea:    { s1: "#8fd4f6", s2: "#dcf4ff", sun: "#ffffff", r: ["#8fd0ec", "#5fb5de", "#4598c8"], mist: "#ecf9ff" },
  mint:   { s1: "#a9e6f0", s2: "#e6fbef", sun: "#fffde8", r: ["#a8e6cf", "#7fd1b3", "#5bb897"], mist: "#f0fff7" },
  sunny:  { s1: "#8fd0f5", s2: "#fff4b8", sun: "#fffbe0", r: ["#ffe08a", "#f7c65e", "#e7a64a"], mist: "#fffbe6" },
  lilac:  { s1: "#cdbff5", s2: "#ffe1ec", sun: "#fffaff", r: ["#d6c4f2", "#b9a3e6", "#9a84d4"], mist: "#fbf5ff" },
};
const INK = "#2b2320";
let uid = 0;
const ridge = (base, amps, k) => {
  let d = `M0 1000 L0 ${base}`;
  for (let x = 0; x <= 3200; x += 32) {
    const y = base + amps[0] * Math.sin(2 * Math.PI * x * k[0] / 1600 + 1.3) + amps[1] * Math.sin(2 * Math.PI * x * k[1] / 1600 + .4);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d + " L3200 1000 Z";
};
const filmCloud = (x, y, s) => [[0, 0, 34], [44, -24, 42], [94, -6, 36], [132, 8, 26], [62, 14, 32]]
  .map(([a, b, r]) => `<circle cx="${x + a * s}" cy="${y + b * s}" r="${r * s}"/>`).join("");
function makeFilm(pal) {
  const id = "f" + uid++;
  const e = el("div"); e.className = "film";
  const clouds = [[120, 170, 1.1], [760, 110, .8], [1260, 210, 1.2], [1900, 150, .9]];
  e.innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.s1}"/><stop offset=".75" stop-color="${pal.s2}"/></linearGradient>
      <radialGradient id="${id}g"><stop offset="0" stop-color="#fff"/><stop offset=".18" stop-color="${pal.sun}"/><stop offset=".3" stop-color="${pal.sun}" stop-opacity=".7"/><stop offset="1" stop-color="${pal.sun}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.mist}" stop-opacity="0"/><stop offset=".5" stop-color="${pal.mist}" stop-opacity=".6"/><stop offset="1" stop-color="${pal.mist}" stop-opacity="0"/></linearGradient>
    </defs>
    <g class="cam">
      <rect x="-200" y="-200" width="2000" height="1300" fill="url(#${id}s)"/>
      <circle class="sun" cx="1050" cy="480" r="380" fill="url(#${id}g)"/>
      <g class="cl"><g fill="#fff" stroke="${INK}" stroke-opacity=".45" stroke-width="7">${clouds.map(c => filmCloud(...c)).join("")}</g>
        <g fill="#fffdf7">${clouds.map(c => filmCloud(...c)).join("")}</g></g>
      <path class="r0" d="${ridge(560, [40, 22], [2, 5])}" fill="${pal.r[0]}" stroke="${INK}" stroke-opacity=".5" stroke-width="4" stroke-linejoin="round"/>
      <rect class="mist" x="-200" y="540" width="2000" height="220" fill="url(#${id}m)"/>
      <path class="r1" d="${ridge(650, [55, 25], [1, 4])}" fill="${pal.r[1]}" stroke="${INK}" stroke-opacity=".6" stroke-width="4" stroke-linejoin="round"/>
      <path class="r2" d="${ridge(760, [45, 18], [3, 7])}" fill="${pal.r[2]}" stroke="${INK}" stroke-opacity=".7" stroke-width="5" stroke-linejoin="round"/>
    </g></svg>`;
  const q = s => e.querySelector(s);
  const P = { cam: q(".cam"), sun: q(".sun"), r0: q(".r0"), r1: q(".r1"), r2: q(".r2"), mist: q(".mist"), cl: q(".cl") };
  e.update = (t, sp = 1) => {
    const s = t * sp;
    P.cam.setAttribute("transform", `translate(800 450) scale(${1.04 + 0.03 * Math.sin(s * 0.25)}) translate(-800 -450)`);
    P.sun.setAttribute("cy", 480 - 60 * Math.sin(s * 0.18));
    P.cl.setAttribute("transform", `translate(${-((s * 8) % 2000) + 200} 0)`);
    P.r0.setAttribute("transform", `translate(${-(s * 12) % 1600} 0)`);
    P.r1.setAttribute("transform", `translate(${-(s * 30) % 1600} 0)`);
    P.r2.setAttribute("transform", `translate(${-(s * 60) % 1600} 0)`);
    P.mist.setAttribute("transform", `translate(${40 * Math.sin(s * 0.3)} 0)`);
  };
  e.update(0);
  return e;
}

// ---------------------------------------------------------------- Noa (the guide character)
// Noa is a chubby golden hamster in COOL BLACK SUNGLASSES (identity marker in every shot)
// with a yellow scarf. Hand-drawn watercolor fill, ink outline.
// Variant keys (for the "inconsistent character" gag in chapter 03 and the floor extras):
//   body: fur colour · glasses:true → nerdy round clear glasses instead of sunglasses ·
//   spiky:true → punk mohawk tuft · party:true → party hat, no sunglasses (extras) ·
//   beret: "#hex" → small beret · scarf: null → no scarf / "#hex" → scarf colour.
const NOA = { body: "#e9a257", belly: "#f7d9a8", scarf: "#f2c14e" };
function makeNoa(size = 200, v = {}) {
  const c = Object.assign({}, NOA, v);
  const shades = !c.glasses && !c.party;
  const e = el("div"); e.className = "noa"; e.style.width = size + "px"; e.style.height = size * 1.1 + "px";
  const S = `stroke="${INK}" stroke-linejoin="round" stroke-linecap="round"`;
  const id = "n" + uid;
  const lens = dx => `<path d="M${66 + dx} 86 H${95 + dx} Q${99 + dx} 86 ${98 + dx} 92 L${96 + dx} 103 Q${94 + dx} 110 ${87 + dx} 110 H${75 + dx} Q${68 + dx} 110 ${67 + dx} 103 L${64 + dx} 92 Q${63 + dx} 86 ${66 + dx} 86Z"/>`;
  const whisk = s => `<g class="wh${s < 0 ? "l" : "r"}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".75">
      <path d="M${100 + s * 26} 121 L${100 + s * 50} 114"/><path d="M${100 + s * 27} 126 L${100 + s * 53} 127"/><path d="M${100 + s * 26} 131 L${100 + s * 48} 139"/></g>`;
  e.innerHTML = `<svg viewBox="0 0 200 220" width="100%" height="100%" overflow="visible">
    <defs><radialGradient id="${id}f" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#9a4a14" stop-opacity=".2"/></radialGradient></defs>
    <ellipse class="sh" cx="100" cy="204" rx="62" ry="8" fill="rgba(120,70,30,.22)"/>
    <g class="b">
      <g class="earl"><circle cx="62" cy="66" r="18" fill="${c.body}" ${S} stroke-width="4.5"/><circle cx="63" cy="67" r="9.5" fill="#f5a3b5"/></g>
      <g class="earr"><circle cx="138" cy="66" r="18" fill="${c.body}" ${S} stroke-width="4.5"/><circle cx="137" cy="67" r="9.5" fill="#f5a3b5"/></g>
      <circle class="tl" cx="166" cy="182" r="8" fill="${c.body}" ${S} stroke-width="4"/>
      ${[74, 126].map(x => `<ellipse class="lg" cx="${x}" cy="196" rx="17" ry="8.5" fill="${c.belly}" ${S} stroke-width="4"/>`).join("")}
      <path d="M100 56 C140 56 160 80 164 104 C183 110 185 146 166 153 C168 181 144 198 100 198 C56 198 32 181 34 153 C15 146 17 110 36 104 C40 80 60 56 100 56Z" fill="${c.body}" ${S} stroke-width="5.5"/>
      <ellipse cx="100" cy="176" rx="40" ry="20" fill="${c.belly}"/>
      <g class="ckl"><ellipse cx="50" cy="128" rx="17" ry="19" fill="${c.belly}" opacity=".85"/></g>
      <g class="ckr"><ellipse cx="150" cy="128" rx="17" ry="19" fill="${c.belly}" opacity=".85"/></g>
      <path d="M100 56 C140 56 160 80 164 104 C183 110 185 146 166 153 C168 181 144 198 100 198 C56 198 32 181 34 153 C15 146 17 110 36 104 C40 80 60 56 100 56Z" fill="url(#${id}f)"/>
      <path d="M66 70 Q84 62 104 64" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M92 58 Q96 66 100 58 Q104 66 108 58" stroke="${INK}" stroke-width="2.5" fill="none" opacity=".45"/>
      ${c.scarf ? `<path d="M34 146 Q100 164 166 146 L167 161 Q100 180 33 161Z" fill="${c.scarf}" ${S} stroke-width="4"/><path d="M52 154 Q66 158 80 159" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
        <g class="st"><path d="M128 162 Q142 176 146 194 L122 188 Q126 176 118 164Z" fill="${c.scarf}" ${S} stroke-width="3.5"/></g>` : ""}
      <g class="pwl"><rect x="28" y="152" width="30" height="20" rx="10" fill="${c.body}" ${S} stroke-width="4.5"/><path d="M32 158 v8 M37 158 v9" stroke="${INK}" stroke-width="2" opacity=".5"/></g>
      <g class="pwr"><rect x="142" y="152" width="30" height="20" rx="10" fill="${c.body}" ${S} stroke-width="4.5"/><path d="M168 158 v8 M163 158 v9" stroke="${INK}" stroke-width="2" opacity=".5"/></g>
      <g class="face">
        <ellipse cx="100" cy="126" rx="28" ry="18" fill="${c.belly}"/>
        <ellipse cx="56" cy="134" rx="10" ry="6" fill="#ff8aa2" opacity=".55"/><ellipse cx="144" cy="134" rx="10" ry="6" fill="#ff8aa2" opacity=".55"/>
        ${whisk(-1)}${whisk(1)}
        <path class="m" d="" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <g class="teeth"><rect x="94.5" y="124" width="11" height="8" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M100 124 V132" stroke="${INK}" stroke-width="1.5"/></g>
        <path d="M94 115 Q100 111 106 115 Q104 121 100 121 Q96 121 94 115Z" fill="#f58ca0" ${S} stroke-width="2.5"/>
        <g class="eyes"><path class="e1" d="" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="e2" d="" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle class="p1" cx="80" cy="98" r="4.5" fill="${INK}"/><circle class="p2" cx="120" cy="98" r="4.5" fill="${INK}"/></g>
        ${c.glasses ? `<g fill="rgba(210,235,255,.35)" stroke="${INK}" stroke-width="3.5"><circle cx="80" cy="98" r="15"/><circle cx="120" cy="98" r="15"/><path d="M95 96 Q100 92 105 96" fill="none"/></g>` : ""}
        ${shades ? `<g class="sg"><g fill="#211c1b" ${S} stroke-width="3.5">${lens(0)}${lens(38)}</g>
          <path d="M97 91 Q101 87 105 91" stroke="${INK}" stroke-width="4" fill="none"/><path d="M63 89 L52 85 M137 89 L148 85" stroke="${INK}" stroke-width="3.5"/>
          <path d="M70 101 L78 89 L83 89 L75 101Z M108 101 L116 89 L121 89 L113 101Z" fill="#fff" opacity=".8"/><circle cx="90" cy="92" r="2" fill="#fff" opacity=".7"/><circle cx="128" cy="92" r="2" fill="#fff" opacity=".7"/></g>` : ""}
        <g class="brows" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"><path class="br1" d=""/><path class="br2" d=""/></g>
      </g>
      <g class="hat">${c.spiky ? `<path d="M80 62 L84 32 L92 50 L98 18 L106 48 L114 28 L118 50 L126 38 L122 62Z" fill="#8a6cf0" ${S} stroke-width="4"/>` :
        c.party ? `<path d="M84 62 L100 12 L116 62Z" fill="#ffb0c0" ${S} stroke-width="4"/><path d="M92 38 L108 38 M88 50 L112 50" stroke="#fff" stroke-width="4" opacity=".8"/><circle cx="100" cy="11" r="7" fill="#f7c948" ${S} stroke-width="3"/>` :
        v.beret ? `<ellipse cx="98" cy="58" rx="36" ry="11" fill="${v.beret}" ${S} stroke-width="4" transform="rotate(-8 98 58)"/><path d="M96 47 Q95 40 100 38" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>` : ""}</g>
    </g></svg>`;
  const q = x => e.querySelector(x);
  e.P = { b: q(".b"), al: q(".pwl"), ar: q(".pwr"), eyes: q(".face"), eye: q(".eyes"), e1: q(".e1"), e2: q(".e2"), p1: q(".p1"), p2: q(".p2"), m: q(".m"),
    legs: [...e.querySelectorAll(".lg")], sh: q(".sh"), hat: q(".hat"), tail: q(".st"), teeth: q(".teeth"), sg: q(".sg"), br1: q(".br1"), br2: q(".br2"),
    earl: q(".earl"), earr: q(".earr"), whl: q(".whl"), whr: q(".whr"), ckl: q(".ckl"), ckr: q(".ckr"), tl: q(".tl") };
  e.shades = shades; e.party = !!c.party;
  e.seed = (uid++ % 7) * 0.47; e.size = size;
  return e;
}
// pose: { x, y, s (scale), wave, talk, look (-1..1), mood: happy|shock|pout, flip, hop (0..1), op, blink, arms }
// hop is a 0..1 phase: 0-.18 anticipation crouch, .18-.86 airborne (stretch), .86-1 landing squash.
// mood "shock" slides the sunglasses down the nose to reveal wide cartoon eyes.
function poseNoa(n, t, o) {
  const { x = 0, y = 0, s = 1, wave = 0, talk = false, look = 0, mood = "happy", flip = false, hop = 0, op = 1, blink: canBlink = true, arms } = o;
  const T = t + n.seed, P = n.P;
  let lift = 0, sx = 1, sy = 1, air = 0;
  if (hop > 0 && hop < 1) {
    if (hop < .18) { const k = Math.sin(hop / .18 * Math.PI / 2); sy = 1 - .16 * k; sx = 1 + .12 * k; }
    else if (hop < .86) { const u = (hop - .18) / .68, sp = Math.abs(1 - 2 * u); lift = 4 * u * (1 - u) * 70; sy = 1 + .14 * sp; sx = 1 - .08 * sp; air = 1; }
    else { const k = Math.sin((hop - .86) / .14 * Math.PI); sy = 1 - .15 * k; sx = 1 + .12 * k; }
  }
  const breathe = 1 + 0.028 * Math.sin(T * 4.2);
  sy *= breathe; sx *= 2 - breathe;
  if (mood === "shock") { sy *= 1.05; sx *= .97; }
  const bob = hop > 0 ? 0 : Math.sin(T * 3) * 2.5;
  n.style.transform = `translate(${x}px, ${y + bob - lift}px) scale(${flip ? -s : s}, ${s})`;
  n.style.transformOrigin = "50% 100%";
  n.style.opacity = op;
  if (op <= 0) return;
  const lean = look * 2.5 + (talk ? Math.sin(T * 4.5) * 2.2 : 0) + (mood === "shock" ? Math.sin(t * 40) * 1.2 : 0);
  P.b.setAttribute("transform", `translate(100 200) rotate(${lean.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-100 -200)`);
  const unit = (n.size || 200) / 200 * Math.max(.05, s);
  const shK = 1 - Math.min(.5, lift / 140);
  P.sh.setAttribute("transform", `translate(0 ${(lift / unit).toFixed(1)}) translate(100 204) scale(${shK.toFixed(3)}) translate(-100 -204)`);
  P.sh.setAttribute("opacity", (1 - lift / 200).toFixed(2));
  const bc = (T % 3.7), blink = canBlink && (bc < 0.11 || (Math.floor(T / 3.7) % 3 === 1 && bc > .22 && bc < .31));
  const squint = hop > 0 && hop < .18;
  // face: look shift
  P.eyes.setAttribute("transform", `translate(${(look * 6).toFixed(1)} ${air ? -2 : 0})`);
  // eyes: hidden behind sunglasses unless shocked (glasses slide down)
  const shock = mood === "shock", showEyes = !n.shades || shock;
  P.eye.style.display = showEyes ? "" : "none";
  if (showEyes) {
    const eye = cx => shock ? `M${cx} 82 a10 11 0 1 0 0.1 0` : mood === "pout" || blink || squint ? `M${cx - 9} 99 H${cx + 9}` : `M${cx - 10} 102 Q${cx} 88 ${cx + 10} 102`;
    P.e1.setAttribute("d", eye(80)); P.e2.setAttribute("d", eye(120));
    P.e1.setAttribute("fill", shock ? "#fff" : "none"); P.e2.setAttribute("fill", shock ? "#fff" : "none");
    const pv = shock ? "" : "none"; P.p1.style.display = pv; P.p2.style.display = pv;
    if (shock) { const j = Math.sin(t * 35) * 1.2; P.p1.setAttribute("cx", 80 + j); P.p2.setAttribute("cx", 120 + j); P.p1.setAttribute("cy", 93); P.p2.setAttribute("cy", 93); }
  }
  if (P.sg) { const sl = shock ? 21 : 0; P.sg.setAttribute("transform", `translate(0 ${sl}) rotate(${shock ? -4 : 0} 100 98)`); }
  // eyebrows above the glasses carry the expression
  const by = shock ? 62 : 76, tw = shock ? 0 : Math.sin(T * 2) * 1.2;
  P.br1.setAttribute("d", mood === "pout" ? `M68 ${by - 6} L90 ${by + 3}` : `M68 ${by + 2 + tw} Q79 ${by - 7 + tw} 90 ${by + tw}`);
  P.br2.setAttribute("d", mood === "pout" ? `M110 ${by + 3} L132 ${by - 6}` : `M110 ${by + tw} Q121 ${by - 7 + tw} 132 ${by + 2 + tw}`);
  // mouth + buck teeth
  const ph = Math.floor(t * 9) % 4, open = talk && ph !== 3;
  P.m.setAttribute("d",
    shock ? "M94 141 a6 7 0 1 0 0.1 0" : mood === "pout" ? "M92 131 Q100 125 108 131" :
    open ? (ph === 1 ? "M92 123 Q100 136 108 123 Z" : "M89 122 Q100 142 111 122 Z") : air ? "M91 123 Q100 138 109 123 Z" : "M89 123 Q94 129 100 123 Q106 129 111 123");
  P.m.setAttribute("fill", shock || open || air ? "#7a2d2a" : "none");
  P.teeth.style.display = open || air ? "" : "none";
  // whiskers twitch, ears flick on the blink cadence, cheeks puff on squash
  const tw2 = Math.sin(T * 13) * (Math.sin(T * 1.3) > .4 ? 5 : 1);
  P.whl.setAttribute("transform", `rotate(${tw2.toFixed(1)} 74 126)`); P.whr.setAttribute("transform", `rotate(${(-tw2).toFixed(1)} 126 126)`);
  const flick = blink ? 14 : (bc > 3.5 ? 6 : 0);
  P.earl.setAttribute("transform", `rotate(${(-flick - look * 3).toFixed(1)} 66 76)`); P.earr.setAttribute("transform", `rotate(${(flick * .6 - look * 3).toFixed(1)} 134 76)`);
  const puff = 1 + Math.max(0, sx - 1) * 2.2 + (mood === "pout" ? .12 : 0);
  P.ckl.setAttribute("transform", `translate(50 128) scale(${puff.toFixed(3)}) translate(-50 -128)`); P.ckr.setAttribute("transform", `translate(150 128) scale(${puff.toFixed(3)}) translate(-150 -128)`);
  // paws
  let rl = Math.sin(T * 3) * 6, rr = -Math.sin(T * 3) * 6;
  if (talk) rl += Math.sin(T * 5.5) * 18 + 12;
  if (wave) rr = Math.sin(t * 11) * 26 - 105;
  if (air) { rl = 70; rr = wave ? rr : -70; }
  if (hop > 0 && hop < .18) { rl = -20; rr = 20; }
  if (shock || arms === "up") { rl = 100 + Math.sin(t * 30) * 6; rr = -100 - Math.sin(t * 30) * 6; }
  if (mood === "pout" || arms === "down") { rl = -30; rr = 30; }
  if (arms === "hips") { rl = -55; rr = 55; }
  P.al.setAttribute("transform", `rotate(${rl.toFixed(1)} 56 160)`);
  P.ar.setAttribute("transform", `rotate(${rr.toFixed(1)} 144 160)`);
  if (P.tail) P.tail.setAttribute("transform", `rotate(${(Math.sin(T * 3.4) * 6 + (air ? -14 : 0)).toFixed(1)} 124 164)`);
  P.tl.setAttribute("transform", `translate(${(Math.sin(T * 6) * 1.5).toFixed(1)} 0)`);
  P.hat.setAttribute("transform", `translate(0 ${air ? -5 : squint ? 3 : 0}) rotate(${(Math.sin(T * 2.2) * 2 + look * 2).toFixed(2)} 100 60)`);
  const stepAmp = air ? 0 : hop > 0 ? 3 : 1.5;
  P.legs.forEach((l, i) => l.setAttribute("transform", air ? `translate(0 5)` : `translate(0 ${(-Math.max(0, Math.sin(t * 9 + i * 2.6)) * stepAmp).toFixed(1)})`));
}
function makeBubble(parent) { const b = el("div", "opacity:0", "", parent); b.className = "bubble"; return b; }
function sayBubble(b, t, a, z, text, x, y) {
  const pIn = seg(t, a, a + .38), p = clamp(pIn * 3) * (1 - seg(t, z - .25, z));
  b.style.opacity = p; b.style.left = x + "px"; b.style.top = y + "px";
  const sc = t < a + .38 ? 0.55 + 0.45 * back(pIn) : 1 - .15 * seg(t, z - .25, z);
  b.style.transform = `scale(${sc.toFixed(3)}) rotate(${(wobble(t, a, 3, 14, 5)).toFixed(2)}deg)`; b.style.transformOrigin = "20% 100%";
  b.textContent = type(text, seg(t, a + .05, a + .05 + Math.max(.5, text.length * .045)));
}

// ---------------------------------------------------------------- Brand page mock (fallback reference)
function brandPage() {
  const p = el("div"); p.className = "page";
  p.innerHTML = `
  <section style="position:relative;height:84px;display:flex;align-items:center;padding:0 64px;gap:40px;background:#fffaf0;z-index:2;border-bottom:2px solid #f0e2c8">
    <div class="serif" style="font-size:28px;font-weight:700;letter-spacing:5px">NOAINO STORY</div>
    <div style="margin-left:auto;display:flex;gap:36px;font-size:17px;color:#5d554a"><span>About</span><span>Services</span><span>Work</span><span>Contact</span></div>
    <div style="padding:12px 22px;border-radius:999px;background:var(--terra);color:#fff;font-size:16px;font-weight:700">문의하기</div></section>
  <section style="position:relative;height:700px;overflow:hidden;background:#fbe9d0"><div class="s-hero"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,250,240,.9),rgba(255,250,240,.6) 42%,rgba(255,250,240,0) 72%)"></div>
    <div style="position:absolute;left:80px;top:180px;color:#2b2320;width:720px">
      <div style="font-size:17px;letter-spacing:5px;color:#c9531f;font-weight:800">BRAND FILM · SEOUL</div>
      <div class="serif" style="font-size:78px;font-weight:700;line-height:1.18;margin-top:18px">이야기가<br>브랜드가 되는 곳</div>
      <div style="font-size:22px;margin-top:22px;color:#5d4a3c">당신의 브랜드를 영상과 이미지로 이야기합니다.</div>
      <div style="display:flex;gap:14px;margin-top:34px"><div style="padding:16px 28px;border-radius:999px;background:var(--terra);color:#fff;font-size:18px;font-weight:700;box-shadow:0 8px 20px rgba(212,98,58,.35)">프로젝트 문의</div>
      <div style="padding:16px 28px;border-radius:999px;border:2px solid #2b2320;background:rgba(255,255,255,.6);font-size:18px">▶ 브랜드 필름 보기</div></div></div></section>
  <section style="position:relative;height:560px;display:flex;gap:70px;padding:90px 80px;background:#fffaf0">
    <div class="s-about" style="position:relative;width:560px;height:380px;border-radius:18px;overflow:hidden;flex:none"></div>
    <div style="padding-top:30px"><div style="font-size:16px;letter-spacing:4px;color:var(--terra)">ABOUT</div>
      <div class="serif" style="font-size:50px;font-weight:700;margin-top:12px;line-height:1.3">작은 브랜드에도<br>큰 이야기를</div>
      <div style="font-size:20px;color:#5d554a;margin-top:20px;line-height:1.75;width:560px">브랜드의 목소리를 정하고, 그 목소리로 영상과 이미지를 만듭니다.</div></div></section>
  <section style="position:relative;height:540px;padding:70px 80px;background:#fdeed6">
    <div style="font-size:16px;letter-spacing:4px;color:var(--terra)">SERVICES</div>
    <div style="display:flex;gap:28px;margin-top:26px">${["브랜드 필름", "제품 비주얼", "캠페인 페이지"].map(n => `<div style="flex:1;background:#fffaf0;border-radius:18px;overflow:hidden;box-shadow:0 10px 24px rgba(160,100,40,.12)">
      <div class="s-th" style="position:relative;height:220px"></div><div style="padding:22px 24px"><div class="serif" style="font-size:28px;font-weight:700">${n}</div>
      <div style="font-size:16px;color:#6b6358;margin-top:8px">Higgsfield로 제작</div></div></div>`).join("")}</div></section>
  <section style="position:relative;height:300px;background:linear-gradient(100deg,#ffe08f,#ffc79a);color:#2b2320;display:flex;align-items:center;justify-content:space-between;padding:0 80px">
    <div class="serif" style="font-size:54px;font-weight:700">함께 이야기를 만들어요</div>
    <div style="padding:20px 34px;border-radius:999px;background:var(--terra);color:#fff;font-size:20px;font-weight:800">프로젝트 문의 →</div></section>`;
  const films = [];
  const h = makeFilm(PAL.dawn); p.querySelector(".s-hero").replaceWith(h); films.push([h, 1]);
  const a = makeFilm(PAL.forest); p.querySelector(".s-about").appendChild(a); films.push([a, .6]);
  [PAL.gold, PAL.lilac, PAL.sea].forEach((pl, i) => { const f = makeFilm(pl); p.querySelectorAll(".s-th")[i].appendChild(f); films.push([f, .5 + i * .2]); });
  p.update = t => films.forEach(([f, sp]) => f.update(t + sp * 7, sp));
  p.fullH = 2184;
  return p;
}

// A browser window showing the reference page: ref/page.png if present, else the mockup.
const REFS = [];
function refWindow(parent, x, y, w, h) {
  const win = el("div", `left:${x}px;top:${y}px;width:${w}px;height:${h}px`, "", parent); win.className = "win";
  win.innerHTML = `<div class="bar"><div class="dot" style="background:#ff6f61"></div><div class="dot" style="background:#ffc43d"></div><div class="dot" style="background:#4cc38a"></div><div class="addr mono">🔒&nbsp;${REF_URL}</div></div>`;
  const view = el("div", `height:${h - 44}px`, "", win); view.className = "view";
  const k = w / 1440;
  const mock = brandPage(); mock.style.transform = `scale(${k})`; view.appendChild(mock);
  const img = el("img", `position:absolute;left:0;top:0;width:${w}px;display:none`, null, view);
  img.onload = () => { img.style.display = "block"; mock.style.display = "none"; win.real = true; };
  img.src = "ref/page.png";
  const tag = el("div", "right:16px;top:58px", "REFERENCE · 제가 만든 페이지", win); tag.className = "reftag";
  win.view = view; win.k = k; win.mock = mock; win.img = img; win.viewH = h - 44;
  // scroll to a fraction of the page height
  win.scrollTo = (f, t) => {
    if (win.real) { const H = img.naturalHeight * (w / img.naturalWidth); img.style.transform = `translateY(${-f * Math.max(0, H - win.viewH)}px)`; }
    else { mock.update(t); mock.style.transform = `scale(${k}) translateY(${-f * Math.max(0, mock.fullH - win.viewH / k)}px)`; }
  };
  REFS.push(win);
  return win;
}

// ============================================================================ SCENES
const SC = [];
function scene(a, b, build) {
  const root = el("div", "", "", $("scenes")); root.className = "scene";
  const s = { a, b, root, caps: [], cite: [] };
  s.update = build(root, s) || (() => {});
  SC.push(s);
  return s;
}
function chapter(root, k, t) { const c = el("div", "", `<div class="k">${k}</div><div class="t">${t}</div>`, root); c.className = "chap"; return c; }
