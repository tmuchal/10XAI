# Builds stage-film.html (watercolor puppet-theater look) from immersive-film.html.
# Usage: python3 restyle.py
import re
src = open("immersive-film.html").read()
s = src

def rep(a, b, count=None):
    global s
    n = s.count(a)
    assert n >= 1, "missing: " + a[:80]
    if count is not None: assert n == count, f"{n}x: {a[:80]}"
    s = s.replace(a, b)

# ---------- palette: dark studio -> watercolor paper ----------
rep('--bg: #0d0d11; --panel: #17171d; --panel2: #202029; --line: #2e2e3a; --text: #f4f1ea; --muted: #a09c93;',
    '--bg: #f3e2bd; --panel: #fffaf0; --panel2: #fdf0d5; --line: #2b2320; --text: #2b2320; --muted: #6b5d52;')
rep('--cream: #f2ebe0; --ink: #17140f; --terra: #d4623a; --forest: #1e3a33; --gold: #c8a266; --sky: #6fb3d9; --pink: #f08aa0;',
    '--cream: #f2ebe0; --ink: #17140f; --terra: #d4623a; --forest: #1e3a33; --gold: #d98c1f; --sky: #3e8fb8; --pink: #e0607e;')
rep('["#2a2a33", "#34302a", "#3e3524", "#4d3c20", "#c8a266"]', '["#fdf0d5", "#f7dfae", "#f2c77f", "#eaa65a", "#e07b39"]')
for a, b in [("#111114", "#fbe0c0"), ("border:3px solid #26262e", "border:3px solid #2b2320"), ("#1b1420", "#f8d3df"),
             ("background:#2a2230", "background:#fffaf0;border:3px solid #2b2320"), ("#24242d", "#f1e4c8"), ('"#3a3326"', '"#f7d774"'),
             ("#2a2a33", "#efe0c2"), ("linear-gradient(135deg,#2a2233,#17171d)", "linear-gradient(135deg,#fff4dc,#f7d9a8)"),
             ("#dcd8cf", "#6b5d52"), ("background:#000;padding:14px", "background:#2b2320;padding:14px"),
             ("rgba(8,8,10,.7)", "rgba(247,233,200,.9)"), ('mk(2, "#1e3a33"', 'mk(2, "#cfe3c8"'), ("color:#d7e6d5", "color:#2f5d3a"),
             ("text-shadow:0 10px 40px rgba(0,0,0,.6)", "text-shadow:4px 4px 0 #f7d774")]:
    rep(a, b)

# ---------- theme CSS ----------
THEME = r'''
  /* ===== Stage theme: watercolor paper, ink lines, puppet theater ===== */
  @font-face { font-family: "GaeguKo"; src: url(fonts/gaegu-korean-400-normal.woff2) format("woff2"); font-weight: 400; size-adjust: 120%; }
  @font-face { font-family: "GaeguKo"; src: url(fonts/gaegu-korean-700-normal.woff2) format("woff2"); font-weight: 700 900; size-adjust: 120%; }
  @font-face { font-family: "GaeguLat"; src: url(fonts/gaegu-latin-400-normal.woff2) format("woff2"); font-weight: 400; size-adjust: 120%; }
  @font-face { font-family: "GaeguLat"; src: url(fonts/gaegu-latin-700-normal.woff2) format("woff2"); font-weight: 700 900; size-adjust: 120%; }
  html, body { font-family: "GaeguLat", "GaeguKo", "Noto Sans CJK KR", sans-serif; font-weight: 700; }
  #stage { background:
      repeating-conic-gradient(from 0deg at 50% 42%, rgba(255,255,255,.16) 0 5deg, rgba(255,255,255,0) 5deg 13deg),
      radial-gradient(700px 480px at 50% 40%, rgba(255,215,90,.75), rgba(255,215,90,0) 70%),
      radial-gradient(520px 420px at 22% 30%, rgba(240,140,130,.38), rgba(240,140,130,0) 70%),
      radial-gradient(560px 420px at 80% 62%, rgba(255,160,80,.35), rgba(255,160,80,0) 70%),
      radial-gradient(420px 300px at 65% 12%, rgba(250,190,150,.45), rgba(250,190,150,0) 70%),
      #f5e3bd; }
  #scenes { position: absolute; inset: 0; z-index: 2; transform-origin: 960px 320px; transform: scale(.82); }
  .scrim { display: none; }
  .chap { background: #fbe3b0; border: 3px solid #2b2320; border-radius: 12px; padding: 10px 24px 12px; box-shadow: 6px 7px 0 rgba(43,35,32,.22); transform: rotate(-1.5deg); }
  .chap .k { color: #c8372d; } .chap .t { font-size: 50px; }
  .card { border: 3px solid #2b2320; box-shadow: 7px 8px 0 rgba(43,35,32,.22); }
  .win { border: 3px solid #2b2320; box-shadow: 9px 11px 0 rgba(43,35,32,.25); }
  .bar { background: #f6d9a0; border-bottom: 3px solid #2b2320; }
  .addr { background: #fffaf0; color: #2b2320; border: 2px solid #2b2320; }
  .chip { border: 3px solid #2b2320; background: #fffaf0; }
  .stat { color: #c8372d; }
  .reftag { border: 3px solid #2b2320; background: #f7d774; color: #2b2320; }
  .bubble { border: 3px solid #2b2320; font-size: 30px; padding: 12px 22px; box-shadow: 5px 6px 0 rgba(43,35,32,.25); }
  .bubble::before { content: ""; position: absolute; left: 30px; bottom: -19px; border: 17px solid transparent; border-bottom: 0; border-top-color: #2b2320; }
  #cap { bottom: 30px; }
  #cap .box { display: inline-block; background: #2c3e57; border: 3px solid #2b2320; border-radius: 14px; padding: 8px 30px 10px; box-shadow: 5px 6px 0 rgba(43,35,32,.35); }
  #cap .ko { font-size: 38px; color: #f7d774; letter-spacing: 0; }
  #cap .en { font-size: 22px; color: #f4ead5; margin-top: 0; }
  #cite { color: #fbe9c9; bottom: 10px; font-size: 18px; }
  .progress { display: none; }
  #floor { position: absolute; left: 0; right: 0; bottom: 0; height: 190px; z-index: 1; }
  .curt { position: absolute; top: 0; bottom: 0; z-index: 40;
    background: linear-gradient(90deg, rgba(0,0,0,.18), rgba(0,0,0,0) 30%, rgba(255,255,255,.08) 60%, rgba(0,0,0,.15)),
                repeating-linear-gradient(90deg, #a92a22 0 12px, #c8372d 12px 44px, #db5443 44px 56px, #c8372d 56px 78px); }
  #curtL { left: 0; border-right: 5px solid #2b2320; border-bottom-right-radius: 40px; }
  #curtR { right: 0; border-left: 5px solid #2b2320; border-bottom-left-radius: 40px; }
  .tie { position: absolute; top: 470px; width: 70px; height: 30px; border-radius: 15px; background: #f2c14e; border: 4px solid #2b2320; }
  #valance { position: absolute; left: 0; top: 0; width: 1920px; height: 60px; z-index: 41; }
  #grain { position: absolute; inset: 0; z-index: 44; pointer-events: none; mix-blend-mode: multiply; opacity: .5;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 .75  0 0 0 0 .55  0 0 0 0 .35  0 0 0 .22 0'/></filter><rect width='600' height='600' filter='url(%23n)'/></svg>"),
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .28 0'/></filter><rect width='300' height='300' filter='url(%23g)'/></svg>"); }
  #sign { position: absolute; left: 50%; top: 380px; z-index: 43; transform: translateX(-50%) rotate(-2deg); background: #fbe3b0; border: 4px solid #2b2320;
    border-radius: 14px; padding: 16px 44px 20px; text-align: center; box-shadow: 8px 9px 0 rgba(43,35,32,.3); white-space: nowrap; }
  #sign .k { font-size: 26px; color: #c8372d; letter-spacing: 4px; } #sign .t { font-size: 64px; color: #2b2320; }
'''
rep("</style>", THEME + "</style>", 1)

# ---------- stage decor markup ----------
rep('''  <div id="scenes"></div>
  <div class="scrim" style="z-index:45"></div>
  <div id="cap"><div class="ko"></div><div class="en"></div></div>''',
'''  <svg width="0" height="0" style="position:absolute"><defs id="fx"></defs></svg>
  <div id="floor"></div>
  <div id="scenes"></div>
  <div class="curt" id="curtL"><div class="tie" style="right:-40px"></div></div>
  <div class="curt" id="curtR"><div class="tie" style="left:-40px"></div></div>
  <div id="valance"></div>
  <div id="sign"><div class="k"></div><div class="t"></div></div>
  <div id="extras"></div>
  <div id="grain"></div>
  <div id="cap"><div class="box"><div class="ko"></div><div class="en"></div></div></div>''', 1)

# ---------- Noa: boxy watercolor puppet (same identity: beret + scarf) ----------
a = s.index("// ---------------------------------------------------------------- Noa (the guide character)")
b = s.index("function makeBubble(parent)")
NOA = r'''// ---------------------------------------------------------------- Noa (the guide character)
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
'''
s = s[:a] + NOA + s[b:]

# ---------- stage effects: boil, curtains, sign, extras ----------
FX = r'''
// ============================================================================ STAGE FX
// Line boil (hand-drawn wobble), curtains that close between chapters, floor, extras.
$("fx").innerHTML = [0, 1, 2].map(i => `<filter id="boil${i}" x="-1%" y="-1%" width="102%" height="102%">
  <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="${i * 7 + 3}"/>
  <feDisplacementMap in="SourceGraphic" scale="3.4" xChannelSelector="R" yChannelSelector="G"/></filter>`).join("");
(function floor() {
  let lines = "";
  for (let i = -16; i <= 16; i++) lines += `<line x1="${960 + i * 64}" y1="0" x2="${960 + i * 150}" y2="190" stroke="#8a5a2b" stroke-width="3"/>`;
  [38, 92, 160].forEach(y => lines += `<line x1="0" y1="${y}" x2="1920" y2="${y}" stroke="#b0733a" stroke-width="2"/>`);
  $("floor").innerHTML = `<svg width="1920" height="190"><defs><linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d49a5a"/><stop offset="1" stop-color="#b87838"/></linearGradient></defs>
    <rect width="1920" height="190" fill="url(#fl)"/>${lines}<line x1="0" y1="2" x2="1920" y2="2" stroke="${INK}" stroke-width="5"/></svg>`;
  let sc = "";
  for (let x = 0; x < 1920; x += 64) sc += `<path d="M${x} 30 Q${x + 32} 66 ${x + 64} 30" fill="#c8372d" stroke="${INK}" stroke-width="4"/>`;
  $("valance").innerHTML = `<svg width="1920" height="70" overflow="visible"><rect x="-10" y="-10" width="1940" height="42" fill="#b52e26" stroke="${INK}" stroke-width="4"/>${sc}</svg>`;
})();
const EXTRAS = [[150, 1], [250, 1], [1590, -1], [1690, -1]].map(([x, look]) => { const n = makeNoa(96, { party: true, scarf: null }); $("extras").appendChild(n); n.x = x; n.look = look; return n; });
const BOUNDS = [10, 40, 72, 106, 134, 160, 184];
const SIGNS = ["누구를 위한 페이지?", "전체 흐름 잡기", "캐릭터 일관성", "몰입감 만들기", "전문성 × 유머", "결국, 매출로", "커튼콜"];
function stageFx(t) {
  const f = `url(#boil${Math.floor(t * 8) % 3})`;
  $("scenes").style.filter = f; $("valance").style.filter = f; $("floor").style.filter = f;
  // curtains: closed at the very start and end, and briefly at each chapter change
  let c = t < 1.2 ? 1 - ease(seg(t, 0.2, 1.2)) : 0, bi = -1;
  BOUNDS.forEach((B, i) => { const k = t < B ? ease(seg(t, B - 0.6, B)) : 1 - ease(seg(t, B + 0.35, B + 1.0)); if (k > c) { c = k; bi = i; } });
  c = Math.max(c, ease(seg(t, DURATION - 1.2, DURATION - 0.2)));
  const w = 150 + 815 * c;
  const co = parseFloat($("cap").style.opacity || "1"); $("cap").style.opacity = co * (1 - c); $("cite").style.opacity = 1 - c;
  $("curtL").style.width = w + "px"; $("curtR").style.width = w + "px";
  const sg = $("sign"), sv = bi >= 0 ? seg(c, .85, 1) : 0;
  sg.style.opacity = sv; sg.style.transform = `translateX(-50%) rotate(-2deg) translateY(${-30 * (1 - sv)}px)`;
  if (bi >= 0) { sg.querySelector(".k").textContent = bi === 6 ? "FIN" : `CHAPTER 0${bi + 1}`; sg.querySelector(".t").textContent = SIGNS[bi]; }
  // extras bounce when the curtain opens
  EXTRAS.forEach((n, i) => {
    const cheer = BOUNDS.some(B => t > B + .3 && t < B + 1.4) || t < 1.6 || (t > 163 && t < 176);
    poseNoa(n, t + i * .7, { x: n.x, y: 842, s: 1, look: n.look, hop: cheer ? ((t * 2.2 + i * .25) % 1) : 0, wave: cheer && i % 2 === 0 });
  });
}
window.READY = Promise.all([["700 40px GaeguKo", "가나다"], ["400 40px GaeguKo", "가"], ["700 40px GaeguLat", "Aa"], ["400 40px GaeguLat", "A"]].map(([f, x]) => document.fonts.load(f, x))).then(() => document.fonts.ready);
'''
rep("window.render = render;\nwindow.DURATION = DURATION;", FX + "const baseRender = render;\nwindow.render = t => { baseRender(t); stageFx(t); };\nwindow.DURATION = DURATION;", 1)
rep("render(((now - t0) / 1000) % DURATION)", "window.render(((now - t0) / 1000) % DURATION)", 1)
rep("} else render(0);", "} else window.render(0);", 1)
rep("<title>Immersive Brand Page</title>", "<title>Brand Page Theater</title>", 1)
rep('<div style="font-size:30px;line-height:2;margin-top:10px">', '<div style="font-size:26px;line-height:2;margin-top:10px;white-space:nowrap">', 1)
open("stage-film.html", "w").write(s)
print("ok")
