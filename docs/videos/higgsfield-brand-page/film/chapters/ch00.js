// ---------------------------------------------------------------- 00 · Opening (0–10)
// Beats: 0.3 stopwatch counts 0.000 → 0.050s · 1.7 DING · 1.95 flash → the real page
// pops in · 2.6 Noa runs in, slips on the stopwatch, backflips, lands · 4.8 page
// becomes a poster on the right, title drops in letter by letter, Noa presents it.
(() => {
const INK0 = "#2b2320";
const c00_rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const c00_settle = (t, f = 2.2, k = 5) => t <= 0 ? 0 : Math.exp(-k * t) * Math.sin(2 * Math.PI * f * t);

scene(0, 10, (R, s) => {
  s.caps = [[0.2, "방문자는 0.05초 만에 첫인상을 정합니다", "Visitors judge a page in 50 milliseconds"],
            [5.2, "그 0.05초를 붙잡는 페이지, Claude × Higgsfield", "Pages that hold that moment, built with Claude × Higgsfield"]];
  s.cite = [[0, "Lindgaard et al., 2006 · Behaviour & IT"]];
  const cam = el("div", "position:absolute;inset:0;transform-origin:960px 420px", "", R);

  // ---- reference page (flash) ----
  const ref = refWindow(cam, 340, 90, 1240, 700);
  ref.style.transformOrigin = "0 0";
  const tada = el("div", `left:0;top:0;z-index:12;padding:10px 26px 12px;background:#c8372d;color:#fffaf0;border:4px solid ${INK0};
    border-radius:14px;font-size:40px;box-shadow:6px 7px 0 rgba(43,35,32,.25);white-space:nowrap`, "짠! 실제로 만든 페이지", cam); tada.className = "abs";

  // ---- stopwatch ----
  const ticks = Array.from({ length: 20 }, (_, i) => {
    const a = i / 20 * 2 * Math.PI, r1 = i % 5 ? 150 : 138;
    return `<line x1="${210 + Math.sin(a) * r1}" y1="${230 - Math.cos(a) * r1}" x2="${210 + Math.sin(a) * 160}" y2="${230 - Math.cos(a) * 160}" stroke="${INK0}" stroke-width="${i % 5 ? 4 : 7}" stroke-linecap="round"/>`;
  }).join("");
  const rays = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 2 * Math.PI;
    return `<line x1="${210 + Math.sin(a) * 215}" y1="${230 - Math.cos(a) * 215}" x2="${210 + Math.sin(a) * 285}" y2="${230 - Math.cos(a) * 285}" stroke="${INK0}" stroke-width="8" stroke-linecap="round"/>`; }).join("");
  const sw = el("div", "left:750px;top:90px;width:420px;height:440px;z-index:20;transform-origin:210px 230px", `
    <svg viewBox="0 0 420 440" width="420" height="440" overflow="visible">
      <g class="rays" opacity="0">${rays}</g>
      <rect x="180" y="22" width="60" height="36" rx="8" fill="#c8372d" stroke="${INK0}" stroke-width="6"/>
      <rect class="btn" x="192" y="4" width="36" height="22" rx="6" fill="#f2c14e" stroke="${INK0}" stroke-width="5"/>
      <rect x="330" y="80" width="40" height="24" rx="8" fill="#f2c14e" stroke="${INK0}" stroke-width="5" transform="rotate(45 350 92)"/>
      <circle cx="218" cy="240" r="182" fill="rgba(43,35,32,.18)"/>
      <circle cx="210" cy="230" r="182" fill="#e8894f" stroke="${INK0}" stroke-width="8"/>
      <circle cx="210" cy="230" r="162" fill="#fffaf0" stroke="${INK0}" stroke-width="6"/>
      <path class="wedge" d="" fill="#f7d774" stroke="${INK0}" stroke-width="3"/>
      ${ticks}
      <text x="210" y="178" text-anchor="middle" font-size="30" fill="#c8372d" font-family="GaeguLat">0.1s</text>
      <g class="hand"><line x1="210" y1="250" x2="210" y2="96" stroke="#c8372d" stroke-width="9" stroke-linecap="round"/></g>
      <circle cx="210" cy="230" r="16" fill="${INK0}"/>
      <ellipse cx="150" cy="140" rx="46" ry="20" fill="#fff" opacity=".6" transform="rotate(-35 150 140)"/>
    </svg>`, cam); sw.className = "abs";
  const wedge = sw.querySelector(".wedge"), hand = sw.querySelector(".hand"), swRays = sw.querySelector(".rays"), swBtn = sw.querySelector(".btn");
  // big readout — fixed-width cells so the digits don't jitter
  const readout = el("div", "left:0;right:0;top:560px;text-align:center;z-index:20;white-space:nowrap", "", cam); readout.className = "abs";
  const cells = Array.from({ length: 6 }, (_, i) => el("span", `display:inline-block;width:${i === 1 ? 44 : 92}px;font-size:150px;line-height:1;color:${INK0};text-shadow:6px 6px 0 #f7d774`, "", readout));
  const ding = el("div", `left:1150px;top:80px;z-index:21;font-size:76px;color:#c8372d;-webkit-text-stroke:3px ${INK0};opacity:0`, "딩!", cam); ding.className = "abs";

  // ---- flash + sparkles ----
  const flash = el("div", "left:-200px;top:-200px;width:2320px;height:1480px;z-index:25;background:#fffdf3;opacity:0", "", cam); flash.className = "abs";
  const sparks = Array.from({ length: 12 }, (_, i) => { const d = el("div", `left:0;top:0;z-index:13;opacity:0`, `<svg width="54" height="54" viewBox="0 0 54 54"><path d="M27 2 L33 21 L52 27 L33 33 L27 52 L21 33 L2 27 L21 21Z" fill="${["#f7d774", "#e0607e", "#3e8fb8", "#f2c14e"][i % 4]}" stroke="${INK0}" stroke-width="3.5" stroke-linejoin="round"/></svg>`, cam); d.className = "abs"; return d; });

  // ---- title block (phase B) ----
  const chips = el("div", "left:150px;top:170px;z-index:14;white-space:nowrap", `
    <span class="cA" style="display:inline-block;padding:8px 22px;border:4px solid ${INK0};border-radius:999px;background:#fffaf0;font-size:34px;box-shadow:4px 5px 0 rgba(43,35,32,.22)">Claude</span>
    <span class="cX" style="display:inline-block;font-size:44px;color:#c8372d;margin:0 14px">×</span>
    <span class="cB" style="display:inline-block;padding:8px 22px;border:4px solid ${INK0};border-radius:999px;background:#f7d774;font-size:34px;box-shadow:4px 5px 0 rgba(43,35,32,.22)">Higgsfield</span>`, cam); chips.className = "abs";
  const cA = chips.querySelector(".cA"), cB = chips.querySelector(".cB"), cX = chips.querySelector(".cX");
  const LINES = ["사람을 붙잡는", "브랜드 페이지"];
  const tBox = el("div", "left:150px;top:268px;z-index:14", "", cam); tBox.className = "abs";
  const chars = [];
  LINES.forEach((L, li) => {
    const row = el("div", `white-space:nowrap;height:122px;font-size:112px;line-height:122px;color:${li ? "#c8372d" : INK0};text-shadow:5px 5px 0 #f7d774`, "", tBox);
    [...L].forEach(ch => { const c = el("span", "display:inline-block;transform-origin:50% 100%", ch === " " ? "&nbsp;" : ch, row); chars.push(c); });
  });
  const under = el("div", "left:140px;top:510px;z-index:13", `<svg width="720" height="40"><path class="u" d="M6 24 Q180 6 360 20 T714 16" stroke="#e8894f" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="760" stroke-dashoffset="760"/></svg>`, cam); under.className = "abs";
  const uPath = under.querySelector(".u");

  // ---- Noa ----
  const noa = makeNoa(170); cam.appendChild(noa);
  const bub = makeBubble(cam), bub2 = makeBubble(cam);
  // open loop: a sealed envelope "₩4,500,000?" — Noa stashes it in his cheek pouch (opened in ch06)
  const env = el("div", "left:0;top:0;z-index:33;opacity:0;transform-origin:50% 50%", `<svg width="210" height="134" viewBox="0 0 210 134" overflow="visible">
    <rect x="8" y="10" width="194" height="116" rx="8" fill="rgba(43,35,32,.2)"/>
    <rect x="3" y="4" width="194" height="116" rx="8" fill="#fffaf0" stroke="${INK0}" stroke-width="4.5"/>
    <path d="M5 8 L100 64 L195 8" fill="none" stroke="${INK0}" stroke-width="4" stroke-linejoin="round"/>
    <text x="100" y="104" text-anchor="middle" font-size="30" fill="#c8372d" font-family="GaeguLat">₩4,500,000?</text>
    <circle cx="100" cy="62" r="17" fill="#c8372d" stroke="${INK0}" stroke-width="4"/><text x="100" y="71" text-anchor="middle" font-size="24" fill="#fffaf0" font-family="GaeguLat">?</text></svg>`, cam); env.className = "abs";
  const puff = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  puff.setAttribute("cx", "140"); puff.setAttribute("cy", "122"); puff.setAttribute("fill", "#f0b27a"); puff.setAttribute("stroke", INK0); puff.setAttribute("stroke-width", "4");
  noa.P.b.appendChild(puff);

  return t => {
    // gentle camera: push in on the stopwatch, settle, then slow push toward the title
    const camS = 1 + 0.05 * out(seg(t, 0.2, 1.8)) - 0.05 * ease(seg(t, 1.9, 2.4)) + 0.035 * ease(seg(t, 5, 10));
    const shake = t > 1.95 && t < 2.35 ? Math.sin(t * 90) * 6 * (1 - seg(t, 1.95, 2.35)) : 0;
    cam.style.transform = `translate(${shake}px, 0) scale(${camS})`;
    cam.style.transformOrigin = t < 4.8 ? "960px 400px" : "620px 420px";

    // ---- stopwatch count ----
    const swIn = back(seg(t, 0.15, 0.7));
    const run = seg(t, 0.8, 1.7), ms = 0.05 * run;
    const ang = 360 * run * 0.5; // dial = 0.1s, so 0.05s is half a turn
    hand.setAttribute("transform", `rotate(${ang} 210 230)`);
    const a1 = ang * Math.PI / 180, big = ang > 180 ? 1 : 0;
    wedge.setAttribute("d", run > 0 ? `M210 230 L210 72 A158 158 0 ${big} 1 ${210 + Math.sin(a1) * 158} ${230 - Math.cos(a1) * 158} Z` : "");
    swBtn.setAttribute("transform", `translate(0 ${8 * (seg(t, 0.72, 0.8) - seg(t, 0.8, 0.9))})`);
    const dingP = seg(t, 1.7, 2.0);
    const jolt = t > 1.7 ? c00_settle(t - 1.7, 3, 6) : 0;
    swRays.setAttribute("opacity", t > 1.7 && t < 2.1 ? 1 - seg(t, 1.9, 2.1) : 0);
    swRays.setAttribute("transform", `translate(210 230) scale(${0.9 + 0.2 * dingP}) translate(-210 -230)`);
    ding.style.opacity = t > 1.7 && t < 2.0 ? 1 : 0;
    ding.style.transform = `scale(${back(seg(t, 1.7, 1.85))}) rotate(12deg)`;

    // stopwatch life: pop in → after flash it shrinks, drops onto the floor, then gets kicked
    const drop = seg(t, 2.0, 2.55), kick = seg(t, 3.38, 3.95);
    let sx = 960, sy = 320, ss = swIn * (1 + 0.06 * jolt), rot = -4 * c00_settle(t - 0.15, 1.5, 3);
    if (t > 2.0) {
      const e = out(drop);
      sx = lerp(960, 840, e); ss = lerp(1, 0.32, e);
      const landY = 800;
      sy = drop < 1 ? lerp(320, landY, drop * drop) : landY - 60 * Math.abs(Math.sin(Math.min(1, seg(t, 2.55, 3.1)) * Math.PI * 2)) * (1 - seg(t, 2.55, 3.1));
      rot = 200 * e;
      if (t > 3.38) { sx = lerp(840, 160, out(kick)); sy = landY - 120 * Math.sin(kick * Math.PI); rot = 200 + 720 * out(kick); }
    }
    sw.style.transform = `translate(${sx - 960}px, ${sy - 320}px) scale(${ss}) rotate(${rot}deg)`;
    sw.style.opacity = (t < 0.15 ? 0 : 1) * (1 - seg(t, 3.85, 4.0));

    // readout
    const str = ms.toFixed(3) + "s";
    cells.forEach((c, i) => c.textContent = str[i] || "");
    readout.style.opacity = seg(t, 0.35, 0.6) * (1 - seg(t, 1.9, 2.0));
    readout.style.transform = `translateY(${24 * (1 - out(seg(t, 0.35, 0.7)))}px) scale(${1 + 0.12 * c00_settle(t - 1.7, 3, 6)})`;

    // ---- flash → reference page ----
    flash.style.opacity = t < 1.9 ? 0 : t < 2.0 ? seg(t, 1.9, 2.0) : 1 - seg(t, 2.0, 2.45);
    const rIn = seg(t, 1.95, 2.55), rB = seg(t, 4.8, 5.7);
    const rS = lerp(0.82 + 0.18 * back(rIn), 0.56, ease(rB));
    const rX = lerp(340, 1030, ease(rB)), rY = lerp(90, 196, ease(rB));
    const rRot = lerp(-2.5 * c00_settle(t - 1.95, 1.4, 3) * 3, 2.5, ease(rB)) + (t > 5.7 ? 1.2 * c00_settle(t - 5.7, 1.2, 3) : 0);
    // scale about the window centre while it pops, then glide to the poster slot
    const cxOff = 620 * (1 - rS), cyOff = 350 * (1 - rS) * (1 - ease(rB));
    ref.style.opacity = t < 1.95 ? 0 : 1;
    ref.style.transform = `translate(${rX - 340 + cxOff * (1 - ease(rB))}px, ${rY - 90 + cyOff}px) scale(${rS}) rotate(${rRot}deg)`;
    ref.scrollTo(0.08 * ease(seg(t, 2.6, 4.6)) * (1 - ease(rB)), t);
    // "짠!" sticker slaps onto the page
    const tdIn = back(seg(t, 2.45, 2.8)), tdB = ease(rB);
    tada.style.opacity = seg(t, 2.45, 2.5);
    tada.style.left = lerp(300, 1000, tdB) + "px"; tada.style.top = lerp(46, 132, tdB) + "px";
    tada.style.transform = `rotate(${-7 + 3 * tdB}deg) scale(${(1.6 - 0.6 * tdIn) * lerp(1, 0.72, tdB)})`;
    tada.style.transformOrigin = "0 0";
    // sparkles burst from the page corners at the reveal, and twinkle round the title later
    sparks.forEach((d, i) => {
      if (i < 8) {
        const dt = t - 2.0 - (i % 4) * 0.04, ox = i < 4 ? 360 : 1560, oy = i % 2 ? 120 : 760;
        const a = (i % 4) / 4 * Math.PI * 0.5 + (i < 4 ? Math.PI * 0.75 : -Math.PI * 0.25) + (oy > 400 ? (i < 4 ? -Math.PI * 0.5 : Math.PI * 0.5) : 0);
        const p = out(clamp(dt / 0.9));
        d.style.opacity = dt > 0 && dt < 1.2 ? 1 - seg(dt, 0.8, 1.2) : 0;
        d.style.transform = `translate(${ox + Math.cos(a) * 160 * p}px, ${oy + Math.sin(a) * 160 * p}px) scale(${0.4 + 0.8 * Math.sin(p * Math.PI)}) rotate(${dt * 200}deg)`;
      } else {
        const j = i - 8, pos = [[870, 250], [930, 420], [120, 460], [700, 170]][j];
        const tw = 0.5 + 0.5 * Math.sin(t * 5 + j * 1.7);
        d.style.opacity = seg(t, 6.6 + j * .2, 6.9 + j * .2) * (0.35 + 0.65 * tw);
        d.style.transform = `translate(${pos[0]}px, ${pos[1]}px) scale(${0.55 + 0.35 * tw}) rotate(${t * 40 + j * 30}deg)`;
      }
    });

    // ---- title (phase B) ----
    const chA = back(seg(t, 5.0, 5.45)), chB = back(seg(t, 5.15, 5.6)), bump = seg(t, 5.55, 5.7) - seg(t, 5.7, 5.95);
    cA.style.transform = `translateX(${-340 * (1 - chA) + 6 * bump}px)`; cB.style.transform = `translateX(${340 * (1 - chB) - 6 * bump}px)`;
    cX.style.transform = `scale(${back(seg(t, 5.55, 5.85)) * (1 + 0.3 * bump)}) rotate(${t * 30}deg)`;
    chips.style.opacity = seg(t, 5.0, 5.2);
    chars.forEach((c, i) => {
      const a = 5.35 + i * 0.075, p = seg(t, a, a + 0.45);
      const wob = t > a + 0.45 ? 5 * c00_settle(t - a - 0.45, 1.6, 4) : 0;
      c.style.opacity = p > 0 ? 1 : 0;
      c.style.transform = `translateY(${-90 * (1 - out(p))}px) scale(${lerp(0.4, 1, back(p))}, ${lerp(1.4, 1, back(p))}) rotate(${(i % 2 ? 1 : -1) * (14 * (1 - p) + wob)}deg)`;
    });
    uPath.setAttribute("stroke-dashoffset", 760 * (1 - ease(seg(t, 6.45, 7.05))));
    tBox.style.transform = `translateY(${-4 * Math.sin(t * 1.4) * seg(t, 7, 8)}px)`;

    // ---- Noa: run in → slip on the stopwatch → backflip → land → present the title ----
    let nx, ny = 690, nrot = 0, mood = "happy", hop = 0, flip = false, look = -0.6, wave = false, talk = false, arm = null;
    const runIn = seg(t, 2.6, 3.38);
    if (t < 3.38) { nx = lerp(1900, 880, runIn); hop = t > 2.6 ? (t * 5) % 1 * 0.25 : 0; look = -1; }
    else if (t < 4.0) {
      const f = seg(t, 3.38, 4.0);
      nx = lerp(880, 800, f); ny = 690 - 200 * Math.sin(f * Math.PI); nrot = -360 * ease(f); mood = "shock";
    } else if (t < 4.9) {
      nx = 800; mood = seg(t, 4.0, 4.25) < 1 ? "shock" : "happy"; wave = t > 4.25; talk = t > 4.25 && t < 4.8;
    } else {
      const w = ease(seg(t, 4.9, 5.6)); nx = lerp(800, 720, w); flip = true; look = -1;
      talk = (t > 5.8 && t < 7.6) || (t > 8.1 && t < 8.9); arm = t > 5.7 && t < 7.8 ? -45 + 8 * Math.sin(t * 4) : null; if (t > 9.35) mood = "happy";
    }
    const land = t > 4.0 ? c00_settle(t - 4.0, 2.5, 5) : 0;
    poseNoa(noa, t, { x: nx, y: ny, s: 1, mood, hop, flip, look, wave, talk, op: t > 2.55 ? 1 : 0 });
    noa.style.transform += ` rotate(${nrot}deg) scale(${1 + 0.12 * land}, ${1 - 0.12 * land})`;
    noa.style.transformOrigin = t > 3.38 && t < 4.0 ? "50% 60%" : "50% 100%";
    if (arm !== null) noa.P.ar.setAttribute("transform", `rotate(${arm} 154 118)`);

    sayBubble(bub, t, 3.45, 4.0, "으앗!", nx + 150, 560);
    sayBubble(bub2, t, 4.25, 5.1, "…안녕, 난 노아!", 960, 600);
    if (t > 5.1 && t < 7.9) sayBubble(bub2, t, 5.9, 7.9, "첫인상은 0.05초면 끝나.", 880, 600);
    if (t >= 7.9) sayBubble(bub2, t, 8.05, 9.8, "이 봉투는… 마지막에 열자 🤫", 880, 600);
    // envelope: pops out at 7.9, wiggles, then gets stuffed into the cheek pouch at 9.0
    const eIn = seg(t, 7.85, 8.25), eSt = seg(t, 9.0, 9.35);
    const ex = lerp(lerp(nx + 40, 920, out(eIn)), nx + 30, ease(eSt)), ey = lerp(lerp(760, 700, out(eIn)) - 110 * Math.sin(eIn * Math.PI), 760, ease(eSt));
    env.style.opacity = eIn > 0 && eSt < 1 ? 1 : 0;
    env.style.transform = `translate(${ex}px, ${ey}px) scale(${back(eIn) * (1 - 0.9 * eSt)}) rotate(${-8 + 6 * Math.sin(t * 7) * (1 - eSt) + 200 * eSt}deg)`;
    const pf = t > 9.35 ? 1 + 0.25 * c00_settle(t - 9.35, 2.8, 5) : 0;
    puff.setAttribute("rx", 24 * pf); puff.setAttribute("ry", 18 * pf); puff.setAttribute("opacity", pf ? 1 : 0);
  };
});
})();
