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
// One fixed identity in every scene: orange box body, red beret, yellow scarf.
// Variants exist only for the "inconsistent character" gag in chapter 03.
const NOA = { body: "#ef8f4f", beret: "#d63a2f", scarf: "#f7c948" };
function makeNoa(size = 200, v = {}) {
  const c = Object.assign({}, NOA, v);
  const e = el("div"); e.className = "noa"; e.style.width = size + "px"; e.style.height = size * 1.1 + "px";
  const S = `stroke="${INK}" stroke-linejoin="round" stroke-linecap="round"`;
  const legs = [52, 80, 108, 134].map(x => `<rect class="lg" x="${x}" y="168" width="15" height="30" rx="5" fill="${c.body}" ${S} stroke-width="4.5"/>`).join("");
  const arm = (cls, x) => `<g class="${cls}"><rect x="${x}" y="108" width="34" height="18" rx="9" fill="${c.body}" ${S} stroke-width="4.5"/></g>`;
  e.innerHTML = `<svg viewBox="0 0 200 220" width="100%" height="100%" overflow="visible">
    <ellipse class="sh" cx="100" cy="204" rx="66" ry="8" fill="rgba(120,70,30,.22)"/>
    <g class="b">
      ${legs}
      ${arm("al", 12)}${arm("ar", 154)}
      <rect x="38" y="70" width="124" height="106" rx="14" fill="${c.body}" ${S} stroke-width="5.5"/>
      <path d="M50 84 Q70 76 104 80 Q86 92 58 104 Q48 98 50 84Z" fill="#fff" opacity=".32"/>
      <path d="M44 150 Q100 166 156 142 L156 164 Q156 172 146 172 L54 172 Q44 172 44 162Z" fill="#b8481f" opacity=".16"/>
      <rect x="44" y="76" width="112" height="94" rx="10" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>
      ${c.scarf && !c.party ? `<path d="M40 144 Q100 152 160 144 V161 Q100 168 40 161Z" fill="${c.scarf}" ${S} stroke-width="4"/><path d="M60 147 Q70 150 80 148" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>
        <g class="tail"><path d="M126 158 Q140 172 146 190 L122 184 Q126 172 120 160Z" fill="${c.scarf}" ${S} stroke-width="3.5"/></g>` : ""}
      <g class="eyes"><path class="e1" d="" stroke="${INK}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="e2" d="" stroke="${INK}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
      ${c.glasses ? `<g fill="none" stroke="${INK}" stroke-width="4"><circle cx="80" cy="104" r="17"/><circle cx="120" cy="104" r="17"/><path d="M97 104 H103"/></g>` : ""}
      <ellipse class="ck" cx="62" cy="124" rx="10" ry="6" fill="#ff7f9a" opacity=".55"/><ellipse class="ck" cx="138" cy="124" rx="10" ry="6" fill="#ff7f9a" opacity=".55"/>
      <path class="m" d="" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="sw" d="M160 78 Q168 92 164 98 Q156 100 156 92 Q156 86 160 78Z" fill="#9fdcf7" stroke="${INK}" stroke-width="3" opacity="0"/>
      <g class="hat">${c.spiky ? `<path d="M44 74 L54 44 L66 70 L80 36 L92 68 L106 34 L116 68 L132 40 L140 70 L154 48 L156 74Z" fill="#5a4fcf" ${S} stroke-width="4"/>` :
        c.party ? `<path d="M82 74 L100 20 L118 74Z" fill="#ffb0c0" ${S} stroke-width="4"/><path d="M90 50 L110 50 M86 62 L114 62" stroke="#fff" stroke-width="4" opacity=".8"/><circle cx="100" cy="18" r="7" fill="#f7c948" ${S} stroke-width="3"/>` :
        `<ellipse cx="96" cy="70" rx="52" ry="14" fill="${c.beret}" ${S} stroke-width="4.5" transform="rotate(-8 96 70)"/><path d="M60 66 Q80 58 104 60" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none"/><path d="M92 56 Q90 46 96 44" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`}</g>
    </g></svg>`;
  const q = x => e.querySelector(x);
  e.P = { b: q(".b"), al: q(".al"), ar: q(".ar"), eyes: q(".eyes"), e1: q(".e1"), e2: q(".e2"), m: q(".m"), legs: [...e.querySelectorAll(".lg")],
    sh: q(".sh"), sw: q(".sw"), hat: q(".hat"), tail: q(".tail") };
  e.seed = (uid++ % 7) * 0.47; e.size = size;
  return e;
}
// pose: { x, y, s (scale), wave, talk, look (-1..1), mood: happy|shock|pout, flip, hop (0..1), op, blink, arms }
// hop is a 0..1 phase: 0-.18 anticipation crouch, .18-.86 airborne (stretch), .86-1 landing squash.
function poseNoa(n, t, o) {
  const { x = 0, y = 0, s = 1, wave = 0, talk = false, look = 0, mood = "happy", flip = false, hop = 0, op = 1, blink: canBlink = true, arms } = o;
  const T = t + n.seed;
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
  n.P.b.setAttribute("transform", `translate(100 200) rotate(${lean.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-100 -200)`);
  const unit = (n.size || 200) / 200 * Math.max(.05, s);
  const shK = 1 - Math.min(.5, lift / 140);
  n.P.sh.setAttribute("transform", `translate(0 ${(lift / unit).toFixed(1)}) translate(100 204) scale(${shK.toFixed(3)}) translate(-100 -204)`);
  n.P.sh.setAttribute("opacity", (1 - lift / 200).toFixed(2));
  const bc = (T % 3.7), blink = canBlink && mood !== "shock" && (bc < 0.11 || (Math.floor(T / 3.7) % 3 === 1 && bc > .22 && bc < .31));
  const squint = hop > 0 && hop < .18;
  const eye = cx => mood === "shock" ? `M${cx} 95 a7 9 0 1 0 0.1 0` : mood === "pout" || blink || squint ? `M${cx - 10} 105 H${cx + 10}` : `M${cx - 11} 109 Q${cx} 90 ${cx + 11} 109`;
  n.P.e1.setAttribute("d", eye(80)); n.P.e2.setAttribute("d", eye(120));
  const fillEye = mood === "shock" ? INK : "none";
  n.P.e1.setAttribute("fill", fillEye); n.P.e2.setAttribute("fill", fillEye);
  n.P.eyes.setAttribute("transform", `translate(${look * 6} ${air ? -2 : 0})`);
  const ph = Math.floor(t * 9) % 4, open = talk && ph !== 3;
  n.P.m.setAttribute("d",
    mood === "shock" ? "M96 130 a5 7 0 1 0 0.1 0" : mood === "pout" ? "M90 133 Q100 124 110 133" :
    open ? (ph === 1 ? "M92 120 Q100 134 108 120 Z" : "M88 119 Q100 142 112 119 Z") : air ? "M90 119 Q100 136 110 119 Z" : "M90 121 Q100 132 110 121");
  n.P.m.setAttribute("fill", mood === "shock" || open || air ? INK : "none");
  n.P.sw.setAttribute("opacity", mood === "shock" ? 1 : 0);
  n.P.sw.setAttribute("transform", `translate(0 ${mood === "shock" ? (t * 14) % 10 : 0})`);
  // arms
  let rl = Math.sin(T * 3) * 5, rr = -Math.sin(T * 3) * 5;
  if (talk) { rl += Math.sin(T * 5.5) * 16 + 8; }
  if (wave) rr = Math.sin(t * 11) * 28 - 48;
  if (air) { rl = 55; rr = wave ? rr : -55; }
  if (hop > 0 && hop < .18) { rl = -20; rr = 20; }
  if (mood === "shock" || arms === "up") { rl = 55 + Math.sin(t * 30) * 5; rr = -55 - Math.sin(t * 30) * 5; }
  if (mood === "pout" || arms === "down") { rl = -32; rr = 32; }
  if (arms === "hips") { rl = -60; rr = 60; }
  n.P.al.setAttribute("transform", `rotate(${rl.toFixed(1)} 46 117)`);
  n.P.ar.setAttribute("transform", `rotate(${rr.toFixed(1)} 154 117)`);
  if (n.P.tail) n.P.tail.setAttribute("transform", `rotate(${(Math.sin(T * 3.4) * 6 + (air ? -14 : 0)).toFixed(1)} 124 160)`);
  n.P.hat.setAttribute("transform", `translate(0 ${air ? -5 : squint ? 3 : 0}) rotate(${(Math.sin(T * 2.2) * 2 + look * 2).toFixed(2)} 100 76)`);
  const stepAmp = air ? 0 : hop > 0 ? 3 : 1.5;
  n.P.legs.forEach((l, i) => l.setAttribute("transform", air ? `translate(0 4)` : `translate(0 ${(-Math.max(0, Math.sin(t * 9 + i * 1.6)) * stepAmp).toFixed(1)})`));
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
