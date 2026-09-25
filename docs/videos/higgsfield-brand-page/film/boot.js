// ============================================================================ RENDER
const capKo = document.querySelector("#cap .ko"), capEn = document.querySelector("#cap .en");
function render(t) {
  let cap = null, cite = "";
  SC.forEach(s => {
    const o = t < s.a || t > s.b ? 0 : s.a === 0 ? 1 - seg(t, s.b - FADE, s.b) : s.b === DURATION ? seg(t, s.a, s.a + FADE)
      : Math.min(seg(t, s.a, s.a + FADE), 1 - seg(t, s.b - FADE, s.b));
    s.root.style.opacity = o; s.root.style.display = o > 0 ? "block" : "none";
    if (o > 0) {
      s.root.style.transform = `scale(${1 + 0.012 * (1 - o)})`;
      s.update(t);
      s.caps.forEach(c => { if (t >= c[0]) cap = [c, s]; });
      s.cite.forEach(c => { if (t >= c[0]) cite = c[1]; });
    }
  });
  if (window.CAPTIONS) {
    const c = window.CAPTIONS.find(c => t >= c.start && t < c.end);
    if (c) {
      const p = seg(t, c.start, c.start + .25) * (1 - seg(t, c.end - .2, c.end));
      capKo.textContent = c.ko; capEn.textContent = c.en;
      $("cap").style.opacity = p; $("cap").style.transform = `translateY(${8 * (1 - p)}px)`;
    } else $("cap").style.opacity = 0;
  } else if (cap) {
    const [c, s] = cap, next = s.caps[s.caps.indexOf(c) + 1], end = next ? next[0] : s.b;
    const p = seg(t, c[0], c[0] + .35) * (1 - seg(t, end - .25, end));
    capKo.textContent = c[1]; capEn.textContent = c[2];
    $("cap").style.opacity = p; $("cap").style.transform = `translateY(${10 * (1 - p)}px)`;
  } else $("cap").style.opacity = 0;
  $("cite").textContent = cite ? "출처 · " + cite : "";
  $("prog").style.width = (100 * t / DURATION) + "%";
}

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
const baseRender = render;
window.render = t => { baseRender(t); stageFx(t); };
window.DURATION = DURATION;
if (!location.search.includes("render")) {
  const t0 = performance.now();
  const loop = now => { window.render(((now - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else window.render(0);
