// ============================================================================ RENDER
const capKo = document.querySelector("#cap .ko"), capEn = document.querySelector("#cap .en"), capBox = document.querySelector("#cap .box");
let capKey = "";
function showCap(en, ko, a, z, t) {
  const key = en + "|" + ko;
  if (key !== capKey) { capEn.textContent = en || ""; capKo.textContent = ko || ""; capKo.style.display = ko ? "" : "none"; capEn.style.display = en ? "" : "none"; capKey = key; }
  const pIn = seg(t, a, a + .38), pOut = seg(t, z - .22, z);
  const o = clamp(pIn * 3) * (1 - pOut);
  $("cap").style.opacity = o;
  capBox.style.transform = `translateY(${(18 * (1 - out(pIn)) + 10 * pOut).toFixed(1)}px) scale(${(0.86 + 0.14 * back(pIn)).toFixed(3)}) rotate(${(wobble(t, a, 1.2, 12, 5)).toFixed(2)}deg)`;
}
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
  if (window.CAPTIONS && window.CAPTIONS.length) {
    const c = window.CAPTIONS.find(c => t >= c.start && t < c.end);
    if (c) showCap(c.en, c.ko, c.start, c.end, t); else $("cap").style.opacity = 0;
  } else if (cap) {
    const [c, s] = cap, next = s.caps[s.caps.indexOf(c) + 1], end = next ? next[0] : s.b;
    showCap(c[2], c[1], c[0], end, t);
  } else $("cap").style.opacity = 0;
  const ct = cite ? "출처 · " + cite : "";
  if ($("cite").textContent !== ct) $("cite").textContent = ct;
}

// ============================================================================ STAGE FX
// Everything here is a pure function of t. Cost notes: no full-frame SVG filters or blend modes
// (they cost ~250 ms/frame); the hand-drawn "boil" comes from 3 pre-jittered variants of the
// decor swapped at 8 fps, per-element CSS rotate/translate jitter, and jittered curtain geometry.
const BOUNDS = [10, 40, 72, 106, 134, 160, 184];
const SIGNS = [["누구를 위한 페이지?", "Who is it for?"], ["전체 흐름 잡기", "Shaping the flow"], ["캐릭터 일관성", "One consistent character"],
  ["몰입감 만들기", "Building immersion"], ["전문성 × 유머", "Expertise × humor"], ["결국, 매출로", "Turning it into sales"], ["커튼콜", "Curtain call"]];
const J = (i, j, k, a) => (hash(i, j, k) - .5) * 2 * a;   // jitter

// shared paint (kept in the always-rendered #fx defs: gradients inside display:none SVGs don't paint)
$("fx").insertAdjacentHTML("beforeend", `<linearGradient id="flw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7b06c"/><stop offset=".5" stop-color="#eebd7c"/><stop offset="1" stop-color="#dc9c5a"/></linearGradient>
  <radialGradient id="lampglow"><stop offset="0" stop-color="#fff6cc" stop-opacity=".95"/><stop offset="1" stop-color="#fff6cc" stop-opacity="0"/></radialGradient>
  <linearGradient id="fls" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a22" stop-opacity=".35"/><stop offset="1" stop-color="#7a4a22" stop-opacity="0"/></linearGradient>
  <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c231d"/><stop offset=".55" stop-color="#d23c30"/><stop offset="1" stop-color="#e65a47"/></linearGradient>`);
// ---- floor: honey-wood planks in perspective + footlights (3 boil variants)
(function floor() {
  const v = [0, 1, 2].map(k => {
    let s = "";
    for (let i = -16; i <= 16; i++) s += `<path d="M${960 + i * 64 + J(i, k, 1, 1.5)} 0 L${960 + i * 150 + J(i, k, 2, 2.5)} 190" stroke="#b9773c" stroke-width="3" stroke-opacity=".75"/>`;
    [30, 78, 138].forEach((y, r) => { let d = `M0 ${y}`; for (let x = 0; x <= 1920; x += 120) d += ` L${x} ${(y + J(x, r, k, 1.4)).toFixed(1)}`; s += `<path d="${d}" stroke="#c4844a" stroke-width="2.5" fill="none"/>`; });
    for (let g = 0; g < 26; g++) { const x = hash(g, 3) * 1880, y = 12 + hash(g, 4) * 160; s += `<path d="M${x} ${y} q18 ${-4 + J(g, k, 5, 1.5)} 36 0 t36 0" stroke="#fff3d6" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`; }
    let edge = "M0 3"; for (let x = 0; x <= 1920; x += 80) edge += ` L${x} ${(3 + J(x, k, 7, 1.3)).toFixed(1)}`;
    const lamps = Array.from({ length: 12 }, (_, i) => { const x = 110 + i * 155; return `<g transform="translate(${x} 176)"><ellipse cx="0" cy="-6" rx="46" ry="26" fill="url(#lampglow)"/>
      <path d="M-22 8 Q-22 -14 0 -16 Q22 -14 22 8Z" fill="#ffe7a0" stroke="${INK}" stroke-width="3.5"/><path d="M-12 -6 Q-6 -11 2 -11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`; }).join("");
    return `<svg width="1920" height="190" style="display:${k ? "none" : "block"}">
      <rect width="1920" height="190" fill="url(#flw)"/>${s}<rect width="1920" height="22" fill="url(#fls)"/>
      <path d="${edge}" stroke="${INK}" stroke-width="5" fill="none"/>${lamps}</svg>`;
  });
  $("floor").innerHTML = v.join("");
})();
// ---- valance: swagged pelmet with fold shading, gold trim and tassels (3 boil variants)
(function valance() {
  const v = [0, 1, 2].map(k => {
    let sw = "", tr = "", ts = "";
    for (let i = 0; i < 12; i++) {
      const x = i * 160 + J(i, k, 1, 1.5), m = x + 80, y1 = 34 + J(i, k, 2, 1.5), dip = 78 + J(i, k, 3, 2.5);
      sw += `<path d="M${x} ${y1} Q${m} ${dip + 20} ${x + 160} ${y1} L${x + 160} 0 L${x} 0Z" fill="url(#vg)" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`;
      sw += `<path d="M${x + 24} ${y1 + 8} Q${m} ${dip - 4} ${x + 136} ${y1 + 8}" stroke="#8e1d18" stroke-opacity=".55" stroke-width="3" fill="none"/>`;
      sw += `<path d="M${x + 40} ${y1 + 2} Q${m} ${dip - 22} ${x + 120} ${y1 + 2}" stroke="#ff8a74" stroke-opacity=".45" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      tr += `<path d="M${x + 4} ${y1 + 4} Q${m} ${dip + 22} ${x + 156} ${y1 + 4}" stroke="${INK}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${x + 4} ${y1 + 4} Q${m} ${dip + 22} ${x + 156} ${y1 + 4}" stroke="#f7c948" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      ts += `<g transform="translate(${x + 160} ${y1 + 2})"><path d="M0 0 L0 18" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="20" r="7" fill="#f7c948" stroke="${INK}" stroke-width="3"/>
        <path d="M-8 26 L-10 50 L10 50 L8 26Z" fill="#f7c948" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-4 30 L-5 48 M3 30 L4 48" stroke="#c8963a" stroke-width="2"/></g>`;
    }
    return `<svg width="1920" height="140" overflow="visible" style="display:${k ? "none" : "block"}">
      <rect x="-10" y="-10" width="1940" height="44" fill="#b52e26"/>${sw}${tr}${ts}
      <path d="M-10 6 H1930" stroke="#f7c948" stroke-width="5"/><path d="M-10 11 H1930" stroke="${INK}" stroke-width="2" stroke-opacity=".5"/></svg>`;
  });
  $("valance").innerHTML = v.join("");
})();

// ---- curtains: jittered fold bands, hourglass tie-back when open, overshoot + trailing hem
const NS = "http://www.w3.org/2000/svg";
$("curt").innerHTML = `<defs>
  <linearGradient id="cb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a1c17"/><stop offset=".28" stop-color="#c0322a"/><stop offset=".55" stop-color="#e45a48"/><stop offset=".72" stop-color="#cf3c31"/><stop offset="1" stop-color="#96221b"/></linearGradient>
  <linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a0d0a" stop-opacity=".45"/><stop offset=".22" stop-color="#4a0d0a" stop-opacity="0"/><stop offset=".85" stop-color="#4a0d0a" stop-opacity="0"/><stop offset="1" stop-color="#4a0d0a" stop-opacity=".25"/></linearGradient></defs>
  <g id="cL"></g><g id="cR"></g>`;
const NB = 9, NYS = 16, TIE_Y = 540;
const CP = ["cL", "cR"].map(id => {
  const g = $(id), mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); g.appendChild(e); return e; };
  const bands = Array.from({ length: NB }, () => mk("path", { fill: "url(#cb)", stroke: "#7a1813", "stroke-width": 2, "stroke-opacity": .55 }));
  return { g, bands, shade: mk("path", { fill: "url(#cs)" }), hem: mk("path", { fill: "#f7c948", stroke: INK, "stroke-width": 3.5, "stroke-linejoin": "round" }),
    edge: mk("path", { fill: "none", stroke: INK, "stroke-width": 6, "stroke-linejoin": "round", "stroke-linecap": "round" }),
    tieI: mk("path", { fill: "none", stroke: INK, "stroke-width": 26, "stroke-linecap": "round" }), tie: mk("path", { fill: "none", stroke: "#f7c948", "stroke-width": 17, "stroke-linecap": "round" }),
    tas: mk("path", { fill: "#f7c948", stroke: INK, "stroke-width": 3.5, "stroke-linejoin": "round" }) };
});
const backOut = x => back(clamp(x));
function curtainC(t) {   // 0 open .. 1 closed (overshoots both ways)
  let c = t < 1.3 ? 1 - backOut(seg(t, 0.15, 1.3)) : 0, bi = -1;
  BOUNDS.forEach((B, i) => { const k = t < B ? backOut(seg(t, B - 0.75, B - 0.2)) : 1 - backOut(seg(t, B + 0.5, B + 1.25)); if (Math.abs(k) > Math.abs(c)) { c = k; bi = i; } });
  const e = backOut(seg(t, DURATION - 1.3, DURATION - 0.4)); if (e > c) c = e;
  return { c, bi };
}
function innerX(y, c, t, side, lag) {
  const k1 = y / TIE_Y, k2 = (y - TIE_Y) / (1080 - TIE_Y);
  const open = y < TIE_Y ? 150 + 120 * Math.pow(1 - k1, 1.6) : 150 + 95 * Math.pow(k2, .75);
  const closed = 985;
  const sway = (1 - clamp(c)) * 5 * Math.sin(t * 1.3 + y * .006 + side * 2) * (Math.max(0, y) / 1080);
  return lerp(open, closed, c) + sway + lag * Math.pow(Math.max(0, y) / 1080, 1.4);
}
function drawCurtains(t, c) {
  const vel = (c - curtainC(t - .08).c) / .08, k = boilStep(t);
  const lag = clamp(-vel * 30, -90, 90);
  const tieOp = clamp(1 - c * 2.5);
  CP.forEach((P, side) => {
    const X = x => side ? 1920 - x : x, outer = -40;
    const ys = Array.from({ length: NYS + 1 }, (_, j) => j / NYS * 1100 - 10);
    const E = ys.map((y, j) => innerX(y, c, t, side, lag) + J(side, j, k, 1.4));
    const col = f => ys.map((y, j) => [X(outer + f * (E[j] - outer) + (f > 0 && f < 1 ? J(f * 10 + side, j, k + 3, 1.6) : 0)), y]);
    const pts = a => a.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
    for (let i = 0; i < NB; i++) {
      const a = col(i / NB), b = col((i + 1) / NB).reverse();
      P.bands[i].setAttribute("d", "M" + pts(a) + " L" + pts(b) + "Z");
    }
    const inner = ys.map((y, j) => [X(E[j]), y]);
    P.shade.setAttribute("d", `M${X(outer)} -10 L${pts(inner)} L${X(outer)} 1090Z`);
    P.edge.setAttribute("d", "M" + pts(inner));
    const eB = E[NYS], hy = 1046;
    let hem = `M${X(outer)} ${hy}`;
    for (let s = 0; s <= 8; s++) hem += ` L${X(outer + (eB - outer) * s / 8).toFixed(1)} ${(hy + (s % 2 ? 6 : 0) + J(s, side, k, 1)).toFixed(1)}`;
    P.hem.setAttribute("d", hem + ` L${X(eB + 2)} 1090 L${X(outer)} 1090Z`);
    const eT = innerX(TIE_Y, c, t, side, lag), ty = TIE_Y + 4;
    const tieD = `M${X(outer)} ${ty - 14} Q${X(eT * .5)} ${ty + 12} ${X(eT + 6)} ${ty}`;
    P.tieI.setAttribute("d", tieD); P.tie.setAttribute("d", tieD);
    const sw = Math.sin(t * 2.1 + side) * 4 - lag * .15, tx = X(eT + 4);
    P.tas.setAttribute("d", `M${tx} ${ty} L${tx + sw - 12} ${ty + 70} L${tx + sw + 12} ${ty + 70}Z M${tx - 8} ${ty + 8} a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0`);
    [P.tieI, P.tie, P.tas].forEach(e => e.setAttribute("opacity", tieOp));
  });
}

// ---- extras (party-hat stagehands in front of the curtains)
const EXTRAS = [[18, 1], [118, 1], [1706, -1], [1806, -1]].map(([x, look]) => { const n = makeNoa(96, { party: true, scarf: null }); $("extras").appendChild(n); n.x = x; n.look = look; return n; });
// ---- confetti (deterministic) when the curtain opens
const CONF = Array.from({ length: 56 }, (_, i) => { const e = document.createElementNS(NS, i % 3 ? "rect" : "circle"); $("confetti").appendChild(e);
  const col = ["#ffcf3f", "#ff7f9a", "#6cc6f0", "#7fd1a0", "#b79bf0", "#ff9a4f"][i % 6];
  if (i % 3) { e.setAttribute("width", 12 + hash(i, 1) * 8); e.setAttribute("height", 8 + hash(i, 2) * 5); e.setAttribute("x", -8); e.setAttribute("y", -5); }
  else e.setAttribute("r", 6 + hash(i, 3) * 3);
  e.setAttribute("fill", col); e.setAttribute("stroke", INK); e.setAttribute("stroke-width", 2.5); return e; });
function confetti(t) {
  const starts = [0.35, ...BOUNDS.map(B => B + 0.55)];
  const a = starts.filter(s => t >= s && t < s + 3.2).pop();
  const svg = $("confetti");
  if (a === undefined) { svg.style.display = "none"; return; }
  svg.style.display = "block";
  const u = t - a, fade = 1 - seg(u, 2.6, 3.2);
  CONF.forEach((e, i) => {
    const side = i % 2, x0 = side ? 1760 : 160, vx = (side ? -1 : 1) * (180 + hash(i, a, 4) * 520), vy = -(520 + hash(i, a, 5) * 520);
    const x = x0 + vx * u * (1 - .25 * u / 3.2) + Math.sin(u * 5 + i) * 18, y = 960 + vy * u + 620 * u * u;
    const r = u * (200 + hash(i, 6) * 400) * (hash(i, 7) > .5 ? 1 : -1);
    e.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(0)}) scale(${(1 - .6 * Math.abs(Math.sin(u * 7 + i))).toFixed(2)} 1)`);
    e.setAttribute("opacity", fade);
  });
}
// ---- dust motes drifting in the spotlight beam (parallax: faster than the backdrop)
const DUST = Array.from({ length: 34 }, (_, i) => { const e = document.createElementNS(NS, i % 5 ? "circle" : "path"); $("dust").appendChild(e);
  if (i % 5) { e.setAttribute("r", 2 + hash(i, 1) * 3.5); e.setAttribute("fill", "#fffbe6"); e.setAttribute("stroke", "#e8b85a"); e.setAttribute("stroke-width", 1.2); }
  else { e.setAttribute("d", "M0 -11 Q1.5 -1.5 11 0 Q1.5 1.5 0 11 Q-1.5 1.5 -11 0 Q-1.5 -1.5 0 -11Z"); e.setAttribute("fill", "#fff3b0"); e.setAttribute("stroke", INK); e.setAttribute("stroke-width", 2); e.setAttribute("stroke-opacity", .5); }
  return e; });
function dust(t, sx, sy, cam) {
  DUST.forEach((e, i) => {
    const sp = 14 + hash(i, 2) * 30, ang = hash(i, 3) * 6.28;
    const ox = ((hash(i, 4) * 1300 + t * sp * Math.cos(ang) + Math.sin(t * .7 + i) * 30) % 1300 + 1300) % 1300 - 650;
    const oy = ((hash(i, 5) * 900 - t * sp + Math.cos(t * .5 + i) * 20) % 900 + 900) % 900 - 450;
    const x = sx + ox * (1 + (cam - 1) * 1.6), y = sy + oy * (1 + (cam - 1) * 1.6);
    const d = Math.hypot(ox / 650, oy / 450), tw = .5 + .5 * Math.sin(t * (2 + hash(i, 6) * 3) + i);
    e.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(i % 5 ? 1 : .6 + .5 * tw).toFixed(2)}) rotate(${(t * 40 + i * 30) % 360})`);
    e.setAttribute("opacity", (clamp(1 - d) * (.35 + .65 * tw)).toFixed(2));
  });
}
// ---- per-element wobble inside scenes (cheap substitute for a full-frame displacement filter)
const BOIL_SEL = ".card,.win,.chap,.bubble,.chip,.reftag,.btn,.boil";
function boilScene(s, t) {
  if (!s.boil) s.boil = [...s.root.querySelectorAll(BOIL_SEL)];
  s.boil.forEach((e, i) => jiggle(e, t, e.classList.contains("win") || e.classList.contains("card") ? .35 : 1, i + s.a));
}
function mainNoa() {
  let best = null, ba = 0;
  SC.forEach(s => { if (s.root.style.display !== "block") return;
    s.root.querySelectorAll(":scope > .noa").forEach(n => { if (+(n.style.opacity || 1) < .3) return; const r = n.getBoundingClientRect(), a = r.width * r.height;
      if (a > ba && r.width > 60) { ba = a; best = r; } }); });
  return best;
}
function stageFx(t) {
  const k = boilStep(t) % 3;
  [$("floor"), $("valance")].forEach(g => [...g.children].forEach((c, i) => { c.style.display = i === k ? "block" : "none"; }));
  // curtains
  const { c, bi } = curtainC(t);
  drawCurtains(t, c);
  const cc = clamp(c);
  $("cap").style.opacity = (+$("cap").style.opacity || 0) * (1 - cc); $("cite").style.opacity = 1 - cc;
  // camera: fly in through the curtain at the start, gentle push on every chapter change
  const intro = t < 2.2 ? 1 + 0.5 * (1 - backOut(seg(t, 0.1, 1.5))) : 1;
  let push = 0; BOUNDS.forEach(B => { if (t > B - 1 && t < B + 1.8) push = Math.max(push, t < B ? ease(seg(t, B - .8, B - .1)) : 1 - backOut(seg(t, B + .45, B + 1.5))); });
  const cam = intro + 0.06 * push;
  const sh = window.SHAKE || [0, 0]; window.SHAKE = [0, 0];
  $("cam").style.transform = `translate(${sh[0].toFixed(1)}px, ${(sh[1] - 120 * (intro - 1)).toFixed(1)}px) scale(${cam.toFixed(4)})`;
  // spotlight follows the main Noa, softly biased to centre stage
  const r = mainNoa();
  const nx = r ? r.left + r.width / 2 : 960, ny = r ? r.top + r.height / 2 : 470;
  const sx = lerp(960, nx, .5), sy = lerp(470, ny, .35);
  $("spot").style.transform = `translate(${sx.toFixed(0)}px, ${sy.toFixed(0)}px) scale(${(1 + .03 * Math.sin(t * 1.7)).toFixed(3)})`;
  $("pool").style.transform = `translate(${lerp(960, nx, .75).toFixed(0)}px, 975px)`;
  dust(t, sx, sy, cam);
  // scene wobble
  SC.forEach(s => { if (s.root.style.display === "block") boilScene(s, t); });
  // chapter sign: drops on ropes, swings, is hauled up as the curtain opens
  const sg = $("sign");
  if (bi >= 0 && cc > .02) {
    const B = BOUNDS[bi];
    const d = backOut(seg(t, B - 0.5, B - 0.1)), up = ease(seg(t, B + 0.4, B + 0.9));
    const ang = wobble(t, B - 0.12, 7, 7.5, 2.6) + (1 - clamp(d)) * -4 + up * 3;
    sg.style.display = "block";
    sg.style.transform = `translateY(${(-760 * (1 - d) - 800 * up).toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
    if (sg.dataset.bi !== String(bi)) { sg.dataset.bi = bi; sg.querySelector(".k").textContent = bi === 6 ? "FIN" : `CHAPTER 0${bi + 1}`;
      sg.querySelector(".t").textContent = SIGNS[bi][0]; sg.querySelector(".e").textContent = SIGNS[bi][1]; }
  } else sg.style.display = "none";
  // extras: anticipate, hop and cheer when the curtain opens
  EXTRAS.forEach((n, i) => {
    const cheer = BOUNDS.some(B => t > B + .45 && t < B + 2.2) || (t > .3 && t < 2.6) || (t > 163 && t < 176);
    const hp = cheer ? ((t * 1.8 + i * .27) % 1) : 0;
    poseNoa(n, t + i * .7, { x: n.x, y: 836, s: 1, look: n.look, hop: hp, wave: cheer, arms: cheer && i % 2 ? "up" : undefined });
    jiggle(n, t, .6, 90 + i);
  });
  confetti(t);
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
