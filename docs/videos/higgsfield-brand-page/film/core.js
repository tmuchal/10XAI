// ============================================================================
// Deterministic timeline. window.render(t) draws the frame at t seconds;
// render.cjs steps it frame by frame. Opened normally, it autoplays.
//
// REFERENCE: drop a full-page screenshot of your site at ref/page.png
// (1440px wide works best). Without it, an example mockup is shown.
// REF_MARKS: where the hook / proof / action labels sit (0..1 of page height).
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
const fmt = n => Math.round(n).toLocaleString("ko-KR");

// ---------------------------------------------------------------- Film (SVG landscape)
const PAL = {
  dawn:   { s1: "#2b2140", s2: "#e07a4f", sun: "#ffd9a8", r: ["#6b4a5c", "#3f2c3d", "#1d1520"], mist: "#f4c9a8" },
  forest: { s1: "#14302b", s2: "#8fb59a", sun: "#f3efd6", r: ["#35584d", "#20403a", "#0f211d"], mist: "#d7e6d5" },
  gold:   { s1: "#3b2a17", s2: "#e9b56b", sun: "#fff1cf", r: ["#8a5a33", "#5a3a22", "#2a1b10"], mist: "#f7ddb0" },
  night:  { s1: "#0d1328", s2: "#4b3f7a", sun: "#e9e4ff", r: ["#2b2d52", "#1b1c38", "#0c0c1c"], mist: "#8d86c9" },
  sea:    { s1: "#0f2a3f", s2: "#6fb3d9", sun: "#f5fbff", r: ["#2f5d7a", "#1d3f57", "#0c2233"], mist: "#cfe8f5" },
};
let uid = 0;
const ridge = (base, amps, k) => {
  let d = `M0 900 L0 ${base}`;
  for (let x = 0; x <= 3200; x += 32) {
    const y = base + amps[0] * Math.sin(2 * Math.PI * x * k[0] / 1600 + 1.3) + amps[1] * Math.sin(2 * Math.PI * x * k[1] / 1600 + .4);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d + " L3200 900 Z";
};
function makeFilm(pal) {
  const id = "f" + uid++;
  const e = el("div"); e.className = "film";
  e.innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.s1}"/><stop offset="1" stop-color="${pal.s2}"/></linearGradient>
      <radialGradient id="${id}g"><stop offset="0" stop-color="${pal.sun}"/><stop offset=".22" stop-color="${pal.sun}" stop-opacity=".9"/><stop offset="1" stop-color="${pal.sun}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.mist}" stop-opacity="0"/><stop offset=".5" stop-color="${pal.mist}" stop-opacity=".45"/><stop offset="1" stop-color="${pal.mist}" stop-opacity="0"/></linearGradient>
    </defs>
    <g class="cam">
      <rect x="-200" y="-200" width="2000" height="1300" fill="url(#${id}s)"/>
      <circle class="sun" cx="1050" cy="520" r="360" fill="url(#${id}g)"/>
      <path class="r0" d="${ridge(560, [40, 22], [2, 5])}" fill="${pal.r[0]}"/>
      <rect class="mist" x="-200" y="520" width="2000" height="220" fill="url(#${id}m)"/>
      <path class="r1" d="${ridge(650, [55, 25], [1, 4])}" fill="${pal.r[1]}"/>
      <path class="r2" d="${ridge(760, [45, 18], [3, 7])}" fill="${pal.r[2]}"/>
    </g></svg>`;
  const q = s => e.querySelector(s);
  const P = { cam: q(".cam"), sun: q(".sun"), r0: q(".r0"), r1: q(".r1"), r2: q(".r2"), mist: q(".mist") };
  e.update = (t, sp = 1) => {
    const s = t * sp;
    P.cam.setAttribute("transform", `translate(800 450) scale(${1.04 + 0.03 * Math.sin(s * 0.25)}) translate(-800 -450)`);
    P.sun.setAttribute("cy", 520 - 60 * Math.sin(s * 0.18));
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
const NOA = { body: "#e8894f", beret: "#c8372d", scarf: "#f2c14e" };
const INK = "#2b2320";
function makeNoa(size = 200, v = {}) {
  const c = Object.assign({}, NOA, v);
  const e = el("div"); e.className = "noa"; e.style.width = size + "px"; e.style.height = size * 1.1 + "px";
  const legs = [50, 78, 108, 136].map(x => `<rect class="lg" x="${x}" y="170" width="14" height="30" rx="3" fill="${c.body}" stroke="${INK}" stroke-width="4"/>`).join("");
  e.innerHTML = `<svg viewBox="0 0 200 220" width="100%" height="100%" overflow="visible">
    <ellipse cx="100" cy="206" rx="64" ry="7" fill="rgba(43,35,32,.22)"/>
    <g class="b">
      ${legs}
      <rect class="al" x="14" y="110" width="32" height="16" rx="6" fill="${c.body}" stroke="${INK}" stroke-width="4"/>
      <rect class="ar" x="154" y="110" width="32" height="16" rx="6" fill="${c.body}" stroke="${INK}" stroke-width="4"/>
      <rect x="38" y="72" width="124" height="104" rx="10" fill="${c.body}" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="78" cy="94" rx="30" ry="12" fill="#fff" opacity=".28"/><ellipse cx="132" cy="158" rx="24" ry="10" fill="#000" opacity=".08"/>
      ${c.scarf && !c.party ? `<path d="M40 146 H160 V162 H40Z" fill="${c.scarf}" stroke="${INK}" stroke-width="4"/><path d="M128 160 L142 188 L122 186Z" fill="${c.scarf}" stroke="${INK}" stroke-width="3"/>` : ""}
      <g class="eyes"><path class="e1" d="" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="e2" d="" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
      ${c.glasses ? `<g fill="none" stroke="${INK}" stroke-width="4"><circle cx="80" cy="104" r="17"/><circle cx="120" cy="104" r="17"/><path d="M97 104 H103"/></g>` : ""}
      <ellipse cx="64" cy="124" rx="9" ry="5" fill="#f08aa0" opacity=".65"/><ellipse cx="136" cy="124" rx="9" ry="5" fill="#f08aa0" opacity=".65"/>
      <path class="m" d="" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${c.spiky ? `<path d="M44 74 L54 44 L66 70 L80 36 L92 68 L106 34 L116 68 L132 40 L140 70 L154 48 L156 74Z" fill="#5a4fcf" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` :
        c.party ? `<path d="M82 74 L100 22 L118 74Z" fill="#f2a7a0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle cx="100" cy="20" r="7" fill="#f2c14e" stroke="${INK}" stroke-width="3"/>` :
        `<g><ellipse cx="96" cy="72" rx="50" ry="13" fill="${c.beret}" stroke="${INK}" stroke-width="4" transform="rotate(-8 96 72)"/><circle cx="92" cy="57" r="6" fill="${c.beret}" stroke="${INK}" stroke-width="3"/></g>`}
    </g></svg>`;
  const q = x => e.querySelector(x);
  e.P = { b: q(".b"), al: q(".al"), ar: q(".ar"), eyes: q(".eyes"), e1: q(".e1"), e2: q(".e2"), m: q(".m"), legs: [...e.querySelectorAll(".lg")] };
  e.seed = (uid++ % 7) * 0.47;
  return e;
}
// pose: { x, y, s (scale), wave, talk, look (-1..1), mood: happy|shock|pout, flip, hop (0..1), op }
function poseNoa(n, t, o) {
  const { x = 0, y = 0, s = 1, wave = 0, talk = false, look = 0, mood = "happy", flip = false, hop = 0, op = 1 } = o;
  const bob = Math.sin((t + n.seed) * 3) * 3 - Math.abs(Math.sin(hop * Math.PI)) * 60;
  n.style.transform = `translate(${x}px, ${y + bob}px) scale(${flip ? -s : s}, ${s})`;
  n.style.transformOrigin = "50% 100%";
  n.style.opacity = op;
  const sq = 1 + 0.035 * Math.sin((t + n.seed) * 6);
  n.P.b.setAttribute("transform", `translate(100 200) scale(${2 - sq} ${sq}) translate(-100 -200)`);
  const blink = ((t + n.seed) % 3.3) < 0.12;
  const eye = cx => mood === "shock" ? `M${cx} 97 a7 8 0 1 0 0.1 0` : mood === "pout" || blink ? `M${cx - 10} 104 H${cx + 10}` : `M${cx - 10} 108 Q${cx} 92 ${cx + 10} 108`;
  n.P.e1.setAttribute("d", eye(80)); n.P.e2.setAttribute("d", eye(120));
  const fillEye = mood === "shock" ? INK : "none";
  n.P.e1.setAttribute("fill", fillEye); n.P.e2.setAttribute("fill", fillEye);
  n.P.eyes.setAttribute("transform", `translate(${look * 5} 0)`);
  const open = talk && Math.floor(t * 8) % 2 === 0;
  n.P.m.setAttribute("d",
    mood === "shock" ? "M96 128 a4 5 0 1 0 0.1 0" : mood === "pout" ? "M91 132 Q100 124 109 132" :
    open ? "M90 120 Q100 140 110 120 Z" : "M91 121 Q100 131 109 121");
  n.P.m.setAttribute("fill", mood === "shock" || open ? INK : "none");
  const w = wave ? Math.sin(t * 10) * 25 - 35 : 0;
  n.P.ar.setAttribute("transform", `rotate(${mood === "shock" ? -40 : w} 154 118)`);
  n.P.al.setAttribute("transform", `rotate(${mood === "shock" ? 40 : 0} 46 118)`);
  const stepAmp = hop > 0 ? 6 : 1.5;
  n.P.legs.forEach((l, i) => l.setAttribute("transform", `translate(0 ${-Math.max(0, Math.sin(t * 9 + i * 1.6)) * stepAmp})`));
}
function makeBubble(parent) { const b = el("div", "opacity:0", "", parent); b.className = "bubble"; return b; }
function sayBubble(b, t, a, z, text, x, y) {
  const p = out(seg(t, a, a + .3)) * (1 - seg(t, z - .3, z));
  b.style.opacity = p; b.style.left = x + "px"; b.style.top = y + "px";
  b.style.transform = `scale(${0.85 + 0.15 * p})`; b.style.transformOrigin = "20% 100%";
  b.textContent = type(text, seg(t, a, a + Math.max(.5, text.length * .045)));
}

// ---------------------------------------------------------------- Brand page mock (fallback reference)
function brandPage() {
  const p = el("div"); p.className = "page";
  p.innerHTML = `
  <section style="position:relative;height:84px;display:flex;align-items:center;padding:0 64px;gap:40px;background:var(--cream);z-index:2">
    <div class="serif" style="font-size:28px;font-weight:700;letter-spacing:5px">NOAINO STORY</div>
    <div style="margin-left:auto;display:flex;gap:36px;font-size:17px;color:#5d554a"><span>About</span><span>Services</span><span>Work</span><span>Contact</span></div>
    <div style="padding:12px 22px;border-radius:999px;background:var(--terra);color:#fff;font-size:16px;font-weight:700">문의하기</div></section>
  <section style="position:relative;height:700px;overflow:hidden;background:#222"><div class="s-hero"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,10,8,.72),rgba(15,10,8,.05) 70%)"></div>
    <div style="position:absolute;left:80px;top:190px;color:#fff;width:720px">
      <div style="font-size:17px;letter-spacing:5px;color:var(--gold)">BRAND FILM · SEOUL</div>
      <div class="serif" style="font-size:78px;font-weight:700;line-height:1.18;margin-top:18px">이야기가<br>브랜드가 되는 곳</div>
      <div style="font-size:22px;margin-top:22px;color:#eadfd0">당신의 브랜드를 영상과 이미지로 이야기합니다.</div>
      <div style="display:flex;gap:14px;margin-top:34px"><div style="padding:16px 28px;border-radius:999px;background:var(--terra);font-size:18px;font-weight:700">프로젝트 문의</div>
      <div style="padding:16px 28px;border-radius:999px;border:1.5px solid rgba(255,255,255,.6);font-size:18px">▶ 브랜드 필름 보기</div></div></div></section>
  <section style="position:relative;height:560px;display:flex;gap:70px;padding:90px 80px">
    <div class="s-about" style="position:relative;width:560px;height:380px;border-radius:18px;overflow:hidden;flex:none"></div>
    <div style="padding-top:30px"><div style="font-size:16px;letter-spacing:4px;color:var(--terra)">ABOUT</div>
      <div class="serif" style="font-size:50px;font-weight:700;margin-top:12px;line-height:1.3">작은 브랜드에도<br>큰 이야기를</div>
      <div style="font-size:20px;color:#5d554a;margin-top:20px;line-height:1.75;width:560px">브랜드의 목소리를 정하고, 그 목소리로 영상과 이미지를 만듭니다.</div></div></section>
  <section style="position:relative;height:540px;padding:70px 80px;background:#e9e0d2">
    <div style="font-size:16px;letter-spacing:4px;color:var(--terra)">SERVICES</div>
    <div style="display:flex;gap:28px;margin-top:26px">${["브랜드 필름", "제품 비주얼", "캠페인 페이지"].map(n => `<div style="flex:1;background:var(--cream);border-radius:18px;overflow:hidden">
      <div class="s-th" style="position:relative;height:220px"></div><div style="padding:22px 24px"><div class="serif" style="font-size:28px;font-weight:700">${n}</div>
      <div style="font-size:16px;color:#6b6358;margin-top:8px">Higgsfield로 제작</div></div></div>`).join("")}</div></section>
  <section style="position:relative;height:300px;background:var(--forest);color:#f2ebe0;display:flex;align-items:center;justify-content:space-between;padding:0 80px">
    <div class="serif" style="font-size:54px;font-weight:700">함께 이야기를 만들어요</div>
    <div style="padding:20px 34px;border-radius:999px;background:var(--gold);color:#1a1406;font-size:20px;font-weight:800">프로젝트 문의 →</div></section>`;
  const films = [];
  const h = makeFilm(PAL.dawn); p.querySelector(".s-hero").replaceWith(h); films.push([h, 1]);
  const a = makeFilm(PAL.forest); p.querySelector(".s-about").appendChild(a); films.push([a, .6]);
  [PAL.gold, PAL.night, PAL.dawn].forEach((pl, i) => { const f = makeFilm(pl); p.querySelectorAll(".s-th")[i].appendChild(f); films.push([f, .5 + i * .2]); });
  p.update = t => films.forEach(([f, sp]) => f.update(t + sp * 7, sp));
  p.fullH = 2184;
  return p;
}

// A browser window showing the reference page: ref/page.png if present, else the mockup.
const REFS = [];
function refWindow(parent, x, y, w, h) {
  const win = el("div", `left:${x}px;top:${y}px;width:${w}px;height:${h}px`, "", parent); win.className = "win";
  win.innerHTML = `<div class="bar"><div class="dot" style="background:#ff5f57"></div><div class="dot" style="background:#febc2e"></div><div class="dot" style="background:#28c840"></div><div class="addr mono">🔒&nbsp;${REF_URL}</div></div>`;
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

