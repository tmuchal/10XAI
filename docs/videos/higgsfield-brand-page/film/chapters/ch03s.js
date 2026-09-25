// ---------------------------------------------------------------- 03s · Seedance 2.5 × Higgsfield prompting (local clock 0–20)
// Claude writes a shot-list prompt; Higgsfield (Seedance 2.5) renders it with the same Noa.
// Facts: Seedance 2.5 on Higgsfield: clips up to 30 s, native audio, up to 50 multimodal references, native 1080p
// (higgsfield.ai/blog/seedance-2-5-on-higgsfield-2026, higgsfield.ai/seedance/2.5). Prompt shape: one visual rule on top,
// one sound rule at the bottom, shots in between like a shot list; "the character from the reference images";
// one camera move per beat tied to an event; "Hard cut." (higgsfield.ai/blog/seedance-2-5-prompting-guide).
// Beats: 0.3–4 references → Higgsfield · 4–12 Claude types the prompt + call-outs · 12–18 Generate → 3 shots ·
//        18–20 Uchal "30초에 소리까지?!", Noa glints and exits toward the curtain.
(() => {
  const INK = "#2b2320", SH = "7px 8px 0 rgba(43,35,32,.22)", RED = "#c8372d", GRN = "#2f9e5a", MUTE = "#6b5d52";
  const box = (parent, x, y, w, h, bg, extra = "") => {
    const b = el("div", `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${bg};border:4px solid ${INK};border-radius:18px;box-shadow:${SH};${extra}`, "", parent);
    b.className = "abs"; return b;
  };
  const slam = (s, t, a, rot) => { const p = seg(t, a, a + .28); s.style.opacity = p > 0 ? 1 : 0; s.style.transform = `rotate(${rot}deg) scale(${2.2 - 1.2 * out(p)})`; return p; };
  const bump = (t, a, d = .3) => { const p = seg(t, a, a + d); return p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0; };
  // Claude-style asterisk mark (generic 8-ray burst) and the Higgsfield wordmark pill
  const CLAUDE_MARK = (s = 34) => `<svg width="${s}" height="${s}" viewBox="-20 -20 40 40" style="flex:none">${Array.from({ length: 8 }, (_, k) =>
    `<path d="M0 -3 L-3 -17 Q0 -20 3 -17Z" fill="#d97757" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" transform="rotate(${k * 45})"/>`).join("")}<circle r="4.5" fill="#d97757" stroke="${INK}" stroke-width="1.6"/></svg>`;
  const HF_MARK = (s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" style="flex:none"><rect x="2" y="2" width="36" height="36" rx="10" fill="#c7f25c" stroke="${INK}" stroke-width="3.5"/>
    <path d="M13 11 V29 M27 11 V29 M13 20 H27" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/></svg>`;
  const SPARK = `<svg width="80" height="80" viewBox="-40 -40 80 80" overflow="visible"><path d="M0 -36 Q4 -4 36 0 Q4 4 0 36 Q-4 4 -36 0 Q-4 -4 0 -36Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle r="6" fill="#fff7c2"/></svg>`;
  // mini stage (location reference / shot backdrop)
  const STAGE = (w, h) => `<svg width="${w}" height="${h}" viewBox="0 0 300 180" preserveAspectRatio="none" style="display:block">
    <rect width="300" height="180" fill="#fff1d6"/><ellipse cx="150" cy="120" rx="95" ry="70" fill="#fff9e6"/>
    <path d="M0 130 H300 V180 H0Z" fill="#e0a64f" stroke="${INK}" stroke-width="3"/>${[40, 100, 160, 220, 280].map(x => `<path d="M${x} 130 L${x - 20 + (x - 150) * .2} 180" stroke="#b9803a" stroke-width="2"/>`).join("")}
    <path d="M0 0 H70 Q60 70 76 132 H0Z" fill="#d6453a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M300 0 H230 Q240 70 224 132 H300Z" fill="#d6453a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M22 0 Q30 60 26 130 M48 0 Q52 60 52 130 M278 0 Q270 60 274 130 M252 0 Q248 60 248 130" stroke="#a8201b" stroke-width="3" fill="none"/>
    <path d="M0 0 H300 V22 Q262 40 225 22 Q187 40 150 22 Q112 40 75 22 Q37 40 0 22Z" fill="#e0574a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  const SWATCH = ["#e9a257", "#f2c14e", "#211c1b", "#d6453a", "#9fd3f0"];

  scene(0, 20, (R, s) => {
    s.cite = [[0, "Higgsfield · Seedance 2.5 · 프롬프팅 가이드"]];
    chapter(R, "", "Seedance 2.5 × Higgsfield 프롬프팅");
    R.style.wordBreak = "keep-all";

    // ============ A · references → Higgsfield (0.3–4)
    const A = el("div", "left:0;top:0;width:1920px;height:1080px", "", R); A.className = "abs";
    // A1 · Noa character sheet (grey, headshot / full body front / full body back, as in ch03 step ①)
    const sheet = box(A, 180, 228, 640, 340, "#cfcfcf", "overflow:hidden;background-image:radial-gradient(ellipse at 22% 30%,rgba(255,255,255,.28),transparent 55%),radial-gradient(rgba(0,0,0,.035) 1.5px,transparent 2px);background-size:auto,18px 18px");
    el("div", `position:absolute;left:20px;top:10px;font-size:26px;color:${RED};white-space:nowrap`, "캐릭터 시트 · 노아", sheet);
    const SPX = [20, 264, 448], SPW = [230, 170, 170];
    const sp = ["얼굴", "앞", "뒤"].map((lb, i) => {
      const p = el("div", `position:absolute;left:${SPX[i]}px;top:52px;width:${SPW[i]}px;height:220px;border-radius:12px;overflow:hidden;background:#d6d6d6;border:3px solid ${INK}`, "", sheet);
      p.n = makeNoa(i === 0 ? 300 : 150, i === 2 ? { back: true } : {}); p.appendChild(p.n);
      el("div", `position:absolute;left:${SPX[i]}px;top:280px;width:${SPW[i]}px;text-align:center;font-size:26px;color:${INK}`, lb, sheet);
      return p;
    });
    const stage = box(A, 180, 596, 310, 232, "#fffaf0", "overflow:hidden");
    el("div", "position:absolute;left:12px;top:12px;width:278px;height:160px;border-radius:10px;overflow:hidden;border:3px solid " + INK, STAGE(278, 160), stage);
    el("div", `position:absolute;left:0;right:0;top:180px;text-align:center;font-size:26px;color:${INK}`, "무대 · 로케이션", stage);
    const palC = box(A, 510, 596, 310, 232, "#fffaf0", "overflow:hidden");
    el("div", "position:absolute;left:18px;top:30px;display:flex;gap:10px", SWATCH.map(c => `<div style="width:44px;height:100px;border-radius:12px;border:3px solid ${INK};background:${c}"></div>`).join(""), palC);
    el("div", `position:absolute;left:0;right:0;top:180px;text-align:center;font-size:26px;color:${INK}`, "팔레트 · 색 규칙", palC);
    const SRC = [sheet, stage, palC];
    // A2 · bright Higgsfield panel
    const P1 = box(A, 880, 228, 870, 600, "#fff7fb", "overflow:visible;background-image:radial-gradient(ellipse at 80% 10%,rgba(247,182,200,.35),transparent 55%),radial-gradient(ellipse at 10% 90%,rgba(199,242,92,.25),transparent 50%)");
    el("div", `position:absolute;left:26px;top:20px;display:flex;align-items:center;gap:14px;font-size:38px;color:${INK};white-space:nowrap`,
      `${HF_MARK(44)}Higgsfield <span style="padding:2px 16px 4px;border:4px solid ${INK};border-radius:14px;background:#f7b6c8;font-size:32px">Seedance 2.5</span>`, P1);
    el("div", `position:absolute;left:30px;top:92px;font-size:28px;color:${MUTE}`, "레퍼런스 이미지", P1);
    const slots = [0, 1, 2].map(i => {
      const sl = el("div", `position:absolute;left:${30 + i * 275}px;top:136px;width:250px;height:160px;border:4px dashed #b9a9b0;border-radius:14px;background:rgba(255,255,255,.7);overflow:hidden`, "", P1);
      sl.th = el("div", "position:absolute;inset:0;opacity:0", "", sl);
      return sl;
    });
    // slot thumbnails: sheet (3 mini panels), stage, palette
    slots[0].th.style.background = "#cfcfcf";
    slots[0].ns = [0, 1, 2].map(i => { const p = el("div", `position:absolute;left:${10 + i * 78}px;top:14px;width:70px;height:128px;border-radius:8px;overflow:hidden;background:#d6d6d6;border:2px solid ${INK}`, "", slots[0].th);
      p.n = makeNoa(i === 0 ? 110 : 64, i === 2 ? { back: true } : {}); p.appendChild(p.n); return p; });
    el("div", "position:absolute;inset:0", STAGE(250, 160), slots[1].th);
    slots[2].th.style.background = "#fffaf0";
    el("div", "position:absolute;left:18px;top:24px;display:flex;gap:8px", SWATCH.map(c => `<div style="width:36px;height:108px;border-radius:10px;border:3px solid ${INK};background:${c}"></div>`).join(""), slots[2].th);
    const cnt = el("div", `position:absolute;left:30px;top:396px;display:flex;align-items:baseline;gap:12px;font-size:36px;color:${INK};white-space:nowrap`,
      `레퍼런스 <span class="n" style="display:inline-block;min-width:34px;text-align:center;font-size:52px;color:${RED}">0</span> / 최대 50`, P1);
    const cntN = cnt.querySelector(".n");
    const field = el("div", `position:absolute;left:30px;top:478px;width:802px;height:92px;border:4px solid ${INK};border-radius:14px;background:#fff;display:flex;align-items:center;gap:12px;padding:0 20px;box-sizing:border-box;font-size:28px;color:#9a8e86;white-space:nowrap`,
      `프롬프트 입력란 · 이제 Claude가 씁니다 ${CLAUDE_MARK(30)}`, P1);
    // flying reference chips
    const CH = ["@노아", "@무대", "@팔레트"].map((nm, i) => {
      const c = el("div", `left:0;top:0;z-index:40;padding:6px 18px 8px;border:4px solid ${INK};border-radius:24px;background:${["#fbe3b0", "#fbd9d3", "#d8eef7"][i]};font-size:28px;color:${INK};white-space:nowrap;box-shadow:4px 5px 0 rgba(43,35,32,.22)`, nm, R);
      c.className = "abs";
      c.from = [[640, 208], [330, 576], [660, 576]][i];   // chip centre on its source card (top edge)
      c.to = [30 + i * 275 + 125 + 880, 228 + 136 + 160 + 6];   // under its slot
      c.at = 1.0 + i * .75;
      return c;
    });

    // ============ B · Claude writes the prompt (4–12)
    const B = el("div", "left:0;top:0;width:1920px;height:1080px", "", R); B.className = "abs";
    // docked Higgsfield (waits for the prompt)
    const dock = box(B, 1160, 116, 590, 96, "#fff7fb", "display:flex;align-items:center;gap:14px;padding:0 18px;box-sizing:border-box;transform-origin:50% 50%");
    dock.innerHTML = `${HF_MARK(46)}<div style="line-height:1.1;white-space:nowrap"><div style="font-size:30px;color:${INK}">Higgsfield · Seedance 2.5</div>
      <div class="st" style="font-size:24px;color:${MUTE}">레퍼런스 3 · 프롬프트 기다리는 중…</div></div>`;
    const dockSt = dock.querySelector(".st");
    const C = box(B, 180, 228, 940, 640, "#fffaf0", "overflow:hidden");
    el("div", `position:absolute;left:0;right:0;top:0;height:70px;background:#fbe9dc;border-bottom:4px solid ${INK}`, "", C);
    el("div", `position:absolute;left:22px;top:14px;display:flex;align-items:center;gap:12px;font-size:34px;color:${INK};white-space:nowrap`, `${CLAUDE_MARK(40)}Claude <span style="font-size:26px;color:${MUTE}">· Seedance 2.5용 샷 리스트</span>`, C);
    const cSt = el("div", `position:absolute;right:20px;top:14px;padding:2px 14px 4px;border:3px solid ${INK};border-radius:12px;background:#fff;font-size:24px;color:${INK};white-space:nowrap`, "작성 중…", C);
    // prompt text: lines of [text, kind] tokens; seg = typing group
    const LINES = [
      [0, [["[STYLE]", "tag"], [" Bright watercolor puppet theater,", ""]]],
      [0, [["thick ink outlines, warm stage light.", ""]]],
      [1, [["Shot 1 — ", "shot"], ["The character from the reference images", "ref"]]],
      [1, [["hops onto the stage. Medium-wide;", ""]]],
      [1, [["camera slowly dollies in as it lands.", "cam"], [" ", ""], ["Hard cut.", "cut"]]],
      [2, [["Shot 2 — ", "shot"], ["Close-up: the sunglasses glint as it turns", ""]]],
      [2, [["to camera. ", ""], ["Camera still.", "cam"], [" ", ""], ["Hard cut.", "cut"]]],
      [3, [["Shot 3 — ", "shot"], ["Full body from behind: it walks toward the", ""]]],
      [3, [["curtain; ", ""], ["camera follows once it starts walking.", "cam"]]],
      [4, [["[SOUND]", "tag"], [" Curtain swish, light marimba, audience “ooh”.", ""]]],
    ];
    const SEGT = [[4.45, 5.15], [5.3, 6.75], [6.95, 7.85], [8.05, 9.05], [9.25, 9.9]];   // typing windows
    const FOCUS = [[4.45, 5.3], [5.3, 6.95], [6.95, 8.05], [8.05, 9.25], [9.25, 10.7]];  // line highlight while discussed
    const segLen = SEGT.map((_, g) => LINES.filter(l => l[0] === g).reduce((a, l) => a + l[1].reduce((b, k) => b + k[0].length, 0), 0));
    let y = 88, prev = 0;
    const LN = LINES.map(([g, toks], i) => {
      if (i && g !== prev) y += 14; prev = g;
      const cont = i && LINES[i - 1][0] === g;
      const d = el("div", `position:absolute;left:18px;right:18px;top:${y}px;height:40px;padding-left:${cont ? 34 : 14}px;border-radius:8px;font-size:28px;line-height:40px;color:${INK};white-space:nowrap`, "", C);
      y += 40;
      d.g = g; d.toks = toks; d.len = toks.reduce((a, k) => a + k[0].length, 0);
      d.off = LINES.slice(0, i).filter(l => l[0] === g).reduce((a, l) => a + l[1].reduce((b, k) => b + k[0].length, 0), 0);
      d.last = ""; return d;
    });
    const send = el("div", `position:absolute;right:22px;bottom:18px;padding:6px 22px 8px;border:4px solid ${INK};border-radius:16px;background:#c7f25c;font-size:28px;color:${INK};white-space:nowrap;box-shadow:4px 5px 0 rgba(43,35,32,.25)`, "Higgsfield로 보내기 →", C);
    // call-outs (Korean), aligned with the lines they explain
    const CO = [
      [300, 4.9, "#f7d774", "맨 위: <b>비주얼 규칙 1개</b>", ""],
      [392, 5.9, "#bfe3a6", "캐릭터 재설명 ✗", "→ “the character from the reference images”"],
      [512, 6.8, "#9fd3f0", "샷마다 카메라 1개 · 이벤트에 묶기", ""],
      [596, 7.95, "#fbd9d3", "샷 끝 = <b>Hard cut.</b>", ""],
      [716, 9.95, "#f7d774", "맨 아래: <b>사운드 규칙 1개</b>", ""],
    ].map(([cy, at, bg, a, b]) => {
      const d = box(B, 1150, cy, 610, b ? 104 : 66, "#fffdf7", `display:flex;flex-direction:column;justify-content:center;padding:0 18px 0 30px;box-sizing:border-box;transform-origin:0 50%;border-left:14px solid ${INK}`);
      d.style.borderLeftColor = bg === "#fbd9d3" ? RED : bg === "#9fd3f0" ? "#3e8fb8" : bg === "#bfe3a6" ? GRN : "#d98c1f";
      d.innerHTML = `<div style="font-size:32px;line-height:1.15;color:${INK};white-space:nowrap">${a.replace(/<b>/g, `<b style="font-weight:inherit;background:${bg};padding:0 6px;border-radius:6px">`)}</div>` +
        (b ? `<div style="font-size:24px;line-height:1.2;color:${GRN};white-space:nowrap">${b}</div>` : "");
      d.at = at; return d;
    });
    const arrows = el("div", "left:0;top:0;z-index:36;pointer-events:none", `<svg width="1920" height="1080" overflow="visible">${[[332, 336], [444, 424], [544, 508], [628, 628], [748, 756]].map(([ya, yb], i) =>
      `<path class="ar" d="M1144 ${ya} Q1128 ${(ya + yb) / 2} 1100 ${yb}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path class="ah" d="M1100 ${yb} l14 -9 M1100 ${yb} l15 7" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`).join("")}</svg>`, B);
    arrows.className = "abs";
    const AR = [...arrows.querySelectorAll(".ar")], AH = [...arrows.querySelectorAll(".ah")];
    const handoff = el("div", `left:1150px;top:796px;z-index:37;display:flex;align-items:center;gap:10px;padding:6px 18px 8px;border:4px solid ${INK};border-radius:16px;background:#fff;font-size:30px;color:${INK};white-space:nowrap;transform-origin:0 50%`,
      `${CLAUDE_MARK(32)} Claude가 쓰고 → ${HF_MARK(34)} Higgsfield가 렌더`, B);
    handoff.className = "abs";

    // ============ C · Generate → three shots (12–18)
    const P3 = box(R, 175, 222, 1585, 560, "#fff7fb", "overflow:visible;transform-origin:960px 0;background-image:radial-gradient(ellipse at 85% 0%,rgba(247,182,200,.35),transparent 50%)");
    el("div", `position:absolute;left:24px;top:16px;display:flex;align-items:center;gap:14px;font-size:36px;color:${INK};white-space:nowrap`,
      `${HF_MARK(44)}Higgsfield <span style="padding:2px 16px 4px;border:4px solid ${INK};border-radius:14px;background:#f7b6c8;font-size:30px">Seedance 2.5</span>`, P3);
    el("div", `position:absolute;left:24px;top:84px;display:flex;align-items:center;gap:10px;font-size:26px;color:${INK};white-space:nowrap`,
      ["@노아", "@무대", "@팔레트"].map((nm, i) => `<span style="padding:2px 14px 4px;border:3px solid ${INK};border-radius:18px;background:${["#fbe3b0", "#fbd9d3", "#d8eef7"][i]}">${nm}</span>`).join("") +
      `<span style="margin-left:10px;display:flex;align-items:center;gap:8px;padding:2px 16px 4px;border:3px solid ${INK};border-radius:12px;background:#fbe9dc">${CLAUDE_MARK(28)}Claude 프롬프트 · 샷 3개</span>`, P3);
    const credit = el("div", `position:absolute;right:250px;top:22px;display:flex;align-items:center;gap:8px;padding:4px 16px 6px;border:3px solid ${INK};border-radius:16px;background:#fff4d0;font-size:26px;color:${INK};white-space:nowrap`,
      `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#f2c14e" stroke="${INK}" stroke-width="3"/><path d="M10 15 H20" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>크레딧 사용`, P3);
    const gen = el("div", `position:absolute;right:24px;top:16px;padding:6px 26px 8px;border:4px solid ${INK};border-radius:18px;background:#c7f25c;font-size:32px;color:${INK};white-space:nowrap;box-shadow:5px 6px 0 rgba(43,35,32,.3)`, "Generate ✦", P3);
    const cursor = el("div", "position:absolute;left:0;top:0;z-index:50", `<svg width="46" height="56" viewBox="0 0 46 56"><path d="M4 4 L4 44 L15 34 L23 52 L31 48 L23 31 L38 31Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`, P3);
    const prog = el("div", `position:absolute;right:24px;top:88px;width:420px;height:34px;border:3px solid ${INK};border-radius:17px;background:#fff;overflow:hidden`, "", P3);
    const progF = el("div", "position:absolute;left:0;top:0;bottom:0;width:0;background:repeating-linear-gradient(-45deg,#c7f25c 0 16px,#a9dd3a 16px 32px)", "", prog);
    const progT = el("div", `position:absolute;left:0;right:0;top:0;text-align:center;font-size:24px;line-height:30px;color:${INK}`, "생성 중…", prog);
    const TW = 480, TH = 270, TY = 150;
    const TILES = [["Shot 1 · 미디엄 와이드 · 달리 인", PAL.sunny], ["Shot 2 · 클로즈업 · 카메라 고정", PAL.dawn], ["Shot 3 · 뒷모습 · 팔로우", PAL.lilac]].map(([lb, pal], i) => {
      const f = el("div", `position:absolute;left:${27 + i * (TW + 30)}px;top:${TY}px;width:${TW}px;height:${TH}px;border:4px solid ${INK};border-radius:14px;overflow:hidden;background:#fffaf0;box-shadow:${SH}`, "", P3);
      f.cam = el("div", `position:absolute;left:0;top:0;width:${TW}px;height:${TH}px;transform-origin:50% 60%`, "", f);
      f.film = makeFilm(pal); f.cam.appendChild(f.film);
      if (i === 0) f.set = el("div", `position:absolute;left:0;right:0;bottom:0;height:70px;background:#e0a64f;border-top:4px solid ${INK};background-image:repeating-linear-gradient(90deg,transparent 0 58px,#b9803a 58px 61px)`, "", f.cam);
      if (i === 2) f.set = el("div", "position:absolute;left:90px;top:20px;width:300px;height:250px", STAGE(300, 250), f.cam);
      f.n = makeNoa(i === 1 ? 420 : 150, i === 2 ? { back: true } : {}); f.cam.appendChild(f.n);
      if (i === 1) { f.gl = el("div", "position:absolute;left:0;top:0;z-index:40;opacity:0", SPARK, f.cam); }
      f.lb = el("div", `position:absolute;left:10px;top:8px;z-index:41;padding:1px 12px 3px;border:3px solid ${INK};border-radius:10px;background:rgba(255,250,240,.94);font-size:24px;color:${INK};white-space:nowrap`, lb, f);
      f.snd = el("div", `position:absolute;right:10px;bottom:10px;z-index:41;display:flex;align-items:flex-end;gap:4px;height:34px;padding:4px 10px;border:3px solid ${INK};border-radius:10px;background:rgba(255,250,240,.94)`,
        `<span style="font-size:22px;line-height:26px;margin-right:4px">♪</span>` + [0, 1, 2, 3, 4].map(() => `<i style="display:block;width:6px;border-radius:3px;background:${INK}"></i>`).join(""), f);
      f.bars = [...f.snd.querySelectorAll("i")];
      f.play = el("div", "position:absolute;inset:0;z-index:42;display:grid;place-items:center;background:rgba(255,250,240,.55)", `<svg width="70" height="70" viewBox="0 0 70 70"><circle cx="35" cy="35" r="31" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M28 22 L50 35 L28 48Z" fill="${INK}"/></svg>`, f);
      f.noise = el("div", "position:absolute;inset:0;z-index:43;background:repeating-linear-gradient(0deg,#efe4cc 0 6px,#fffaf0 6px 12px,#e4d6b8 12px 15px)", "", f);
      f.cut = el("div", `position:absolute;inset:0;z-index:44;background:#fff;opacity:0`, "", f);
      f.st = el("div", `position:absolute;left:${27 + i * (TW + 30) + 150}px;top:${TY + TH - 30}px;z-index:46;padding:2px 16px 4px;border:5px solid ${GRN};border-radius:12px;color:${GRN};background:rgba(255,250,240,.95);font-size:32px;white-space:nowrap`, "✓ 같은 노아", P3);
      f.a = [13.45, 14.95, 16.3][i]; f.b = [14.95, 16.3, 17.7][i];
      return f;
    });
    const badge = el("div", `position:absolute;left:27px;top:${TY + TH + 44}px;display:flex;align-items:center;gap:12px;padding:8px 22px 10px;border:4px solid ${INK};border-radius:16px;background:#f7d774;font-size:32px;color:${INK};white-space:nowrap;box-shadow:${SH};transform-origin:0 50%`,
      "Seedance 2.5 · 최대 30초 · 오디오 포함 · 1080p", P3);
    const refsN = el("div", `position:absolute;right:27px;top:${TY + TH + 50}px;font-size:28px;color:${MUTE};white-space:nowrap`, "레퍼런스 최대 50개 · 지금 3개", P3);

    // ============ D · outro (18–20): Uchal + Noa glint + exit
    const noa = makeNoa(160); R.appendChild(noa);
    const nGl = el("div", "left:0;top:0;z-index:40;opacity:0", SPARK, R); nGl.className = "abs";
    const uchal = makeUchu(150); R.appendChild(uchal);
    const ub = makeBubble(R);
    const burst = makeBurst(R, 22, 7);

    return t => {
      // ---- A
      const aOut = ease(seg(t, 3.85, 4.35));
      A.style.display = t < 4.4 ? "block" : "none";
      SRC.forEach((c, i) => {
        const p = back(seg(t, .3 + i * .22, .8 + i * .22));
        c.style.opacity = clamp(p * 2) * (1 - aOut);
        c.style.transform = `translate(${-700 * aOut * (1 + i * .15)}px, ${120 * (1 - p)}px) rotate(${[-1.2, 1, -.8][i] * p}deg)`;
      });
      sp.forEach((p, i) => {
        const np = back(seg(t, .55 + i * .15, .95 + i * .15));
        if (i === 0) poseNoa(p.n, t, { x: -35, y: -60 + 40 * (1 - np), s: np, blink: false });
        else poseNoa(p.n, t, { x: 10, y: 38 + 30 * (1 - np), s: np, arms: "down", blink: false });
      });
      const pIn = back(seg(t, .45, .95));
      P1.style.opacity = clamp(pIn * 2) * (1 - seg(aOut, .5, 1));
      P1.style.transformOrigin = "90% 0";
      P1.style.transform = `translateY(${80 * (1 - pIn)}px) scale(${lerp(1, .35, aOut)})`;
      let got = 0;
      CH.forEach((c, i) => {
        const fp = seg(t, c.at, c.at + .6), fe = ease(fp);
        if (t >= c.at + .6) got++;
        const x = lerp(c.from[0], c.to[0], fe), y0 = lerp(c.from[1], c.to[1], fe) - 160 * Math.sin(Math.PI * fe);
        const shown = t > c.at - .6;
        const tp = back(seg(t, c.at - .6, c.at - .25));
        c.style.opacity = (shown ? clamp(tp * 2) : 0) * (1 - aOut);
        const land = bump(t, c.at + .6, .25);
        c.style.transform = `translate(-50%, -50%) translate(${x}px, ${y0}px) rotate(${(fp > 0 && fp < 1 ? 14 * Math.sin(fp * Math.PI) : 0)}deg) scale(${(t < c.at ? tp : 1) * (1 + .12 * land)})` +
          (aOut > 0 ? ` translate(${280 * aOut}px, ${-120 * aOut}px) scale(${1 - .6 * aOut})` : "");
        const sl = slots[i], th = back(seg(t, c.at + .55, c.at + .9));
        sl.th.style.opacity = clamp(th * 2); sl.th.style.transform = `scale(${.7 + .3 * th})`;
        sl.style.borderStyle = t > c.at + .55 ? "solid" : "dashed"; sl.style.borderColor = t > c.at + .55 ? INK : "#b9a9b0";
      });
      slots[0].ns.forEach((p, i) => poseNoa(p.n, t, i === 0 ? { x: -20, y: -24, s: 1, blink: false } : { x: 3, y: 36, s: 1, arms: "down", blink: false }));
      if (cntN.textContent !== String(got)) cntN.textContent = got;
      const lastLand = got ? CH[got - 1].at + .6 : -9;
      cntN.style.transform = `scale(${1 + .45 * bump(t, lastLand, .35)}) rotate(${-8 * bump(t, lastLand, .35)}deg)`;
      cnt.style.opacity = seg(t, .9, 1.2);
      field.style.opacity = seg(t, 1.1, 1.4);

      // ---- B
      const Bv = t > 3.9 && t < 12.4;
      B.style.display = Bv ? "block" : "none";
      const cIn = back(seg(t, 4.0, 4.45)), fly = ease(seg(t, 11.1, 11.75));
      C.style.opacity = clamp(cIn * 2) * (1 - seg(fly, .75, 1));
      C.style.transformOrigin = "50% 50%";
      C.style.transform = `translate(${lerp(0, 1455 - 650, fly)}px, ${120 * (1 - cIn) + lerp(0, 164 - 548, fly)}px) scale(${lerp(1, .12, fly)}) rotate(${-1 * cIn + 8 * fly}deg)`;
      const dIn = back(seg(t, 4.1, 4.5)), dOut = ease(seg(t, 11.95, 12.35));
      const arrive = bump(t, 11.72, .35);
      dock.style.opacity = clamp(dIn * 2) * (1 - dOut);
      dock.style.transform = `scale(${(.6 + .4 * dIn) * (1 + .1 * arrive) * (1 + .4 * dOut)})`;
      dock.style.background = t > 11.72 ? "#eaffc4" : "#fff7fb";
      const dst = t > 11.72 ? "레퍼런스 3 · 프롬프트 도착 ✓" : "레퍼런스 3 · 프롬프트 기다리는 중…";
      if (dockSt.textContent !== dst) dockSt.textContent = dst;
      dockSt.style.color = t > 11.72 ? GRN : MUTE;
      // typing
      let caretAt = -1;
      LN.forEach((d, i) => {
        const [a, b] = SEGT[d.g], typed = Math.round(segLen[d.g] * seg(t, a, b)) - d.off, n = clamp(typed, 0, d.len);
        if (n > 0 && n < d.len) caretAt = i;
        else if (n >= d.len && t >= a && t < b + .05 && (i === LN.length - 1 || LN[i + 1].g !== d.g)) caretAt = i;
        const foc = t >= FOCUS[d.g][0] && t < FOCUS[d.g][1];
        let left = n, h = "";
        d.toks.forEach(([tx, k]) => {
          if (left <= 0) return; const part = tx.slice(0, left); left -= tx.length;
          const lit = k === "ref" ? t > 5.9 : k === "cam" ? t > 6.8 : k === "cut" ? t > 7.95 : false;
          const hot = k === "ref" ? t > 5.9 && t < 6.95 : k === "cam" ? (t > 6.8 && t < 8.05) || (d.g === 3 && t > 8.9 && t < 9.25) : k === "cut" ? t > 7.95 && t < 9.1 : false;
          const css = k === "tag" ? `color:#fff;background:${d.g ? "#3e8fb8" : "#d98c1f"};padding:0 8px;border-radius:6px` :
            k === "shot" ? `color:${RED}` :
            k === "ref" && lit ? `background:${hot ? "#9be3a8" : "#dff4e2"};border-radius:6px;box-shadow:inset 0 -3px 0 ${GRN}` :
            k === "cam" && lit ? `background:${hot ? "#a9dcf5" : "#e2f2fb"};border-radius:6px;box-shadow:inset 0 -3px 0 #3e8fb8` :
            k === "cut" && lit ? `color:${RED};outline:3px solid ${hot ? RED : "transparent"};outline-offset:1px;border-radius:6px;background:${hot ? "#fde2dd" : "transparent"}` : "";
          h += css ? `<span style="${css}">${part}</span>` : part;
        });
        if (caretAt === i && Math.floor(t * 5) % 2 === 0) h += `<span style="display:inline-block;width:3px;height:30px;margin-left:2px;vertical-align:-5px;background:${INK}"></span>`;
        if (h !== d.last) { d.innerHTML = h; d.last = h; }
        d.style.background = foc && n > 0 ? "rgba(247,215,116,.38)" : "transparent";
      });
      const done = t > 10.0;
      const cst = done ? "완성 ✓" : "작성 중…";
      if (cSt.textContent !== cst) cSt.textContent = cst;
      cSt.style.background = done ? "#bfe3a6" : "#fff";
      const sIn = back(seg(t, 10.2, 10.55)), press = bump(t, 10.9, .22);
      send.style.opacity = clamp(sIn * 2);
      send.style.transform = `scale(${(.6 + .4 * sIn) * (1 - .1 * press)}) translateY(${4 * press}px)`;
      const coOut = ease(seg(t, 10.95, 11.3));
      CO.forEach((d, i) => {
        const p = back(seg(t, d.at, d.at + .4));
        d.style.opacity = clamp(p * 2) * (1 - coOut);
        d.style.transform = `translateX(${80 * (1 - p) + 200 * coOut}px) scale(${.7 + .3 * p}) rotate(${[-1, .8, -.6, 1, -.8][i] * p}deg)`;
        const ap = seg(t, d.at + .15, d.at + .45);
        AR[i].setAttribute("stroke-dasharray", "80"); AR[i].setAttribute("stroke-dashoffset", 80 * (1 - ap));
        AR[i].style.opacity = ap > 0 ? 1 - coOut : 0; AH[i].style.opacity = ap >= 1 ? 1 - coOut : 0;
      });
      const hIn = back(seg(t, 10.55, 10.95)), hOut = ease(seg(t, 11.8, 12.2));
      handoff.style.opacity = clamp(hIn * 2) * (1 - hOut);
      handoff.style.transform = `translateY(${-230 * ease(seg(t, 10.95, 11.35))}px) scale(${.6 + .4 * hIn})`;

      // ---- C
      const Cv = t > 11.9;
      P3.style.display = Cv ? "block" : "none";
      const p3 = back(seg(t, 11.95, 12.45)), shrink = ease(seg(t, 17.8, 18.3));
      P3.style.opacity = clamp(p3 * 2);
      P3.style.transform = `translate(${lerp(510, 0, out(seg(t, 11.95, 12.4)))}px, ${lerp(-110, 0, out(seg(t, 11.95, 12.4)))}px) scale(${(.4 + .6 * p3) * (1 - .13 * shrink)})`;
      const cp = ease(seg(t, 12.3, 12.7)), gp = bump(t, 12.72, .22);
      cursor.style.opacity = t > 12.25 && t < 13.2 ? 1 : 0;
      cursor.style.transform = `translate(${lerp(1100, 1470, cp)}px, ${lerp(240, 44, cp) + 6 * gp}px) scale(${1 - .12 * gp})`;
      gen.style.transform = `scale(${1 - .1 * gp}) translateY(${5 * gp}px)`;
      gen.style.boxShadow = gp > .3 ? "1px 2px 0 rgba(43,35,32,.3)" : "5px 6px 0 rgba(43,35,32,.3)";
      const crp = back(seg(t, 12.8, 13.15)); credit.style.opacity = clamp(crp * 2); credit.style.transform = `scale(${.5 + .5 * crp}) rotate(${-4 * (1 - crp)}deg)`;
      const pg = ease(seg(t, 12.8, 13.4));
      prog.style.opacity = seg(t, 12.75, 12.9); progF.style.width = 100 * pg + "%";
      const pt = pg >= 1 ? "완료 · 3샷" : "생성 중…"; if (progT.textContent !== pt) progT.textContent = pt;
      TILES.forEach((f, i) => {
        const tin = back(seg(t, 12.85 + i * .12, 13.3 + i * .12));
        f.style.opacity = clamp(tin * 2); f.style.transform = `translateY(${60 * (1 - tin)}px)`;
        f.noise.style.opacity = 1 - seg(t, 13.3 + i * .1, 13.5 + i * .1);
        f.noise.style.backgroundPosition = `0 ${Math.floor(t * 30) * 7}px`;
        const on = t >= f.a && t < f.b, lt = clamp(t, f.a, f.b) - f.a, played = t >= f.b;
        f.play.style.opacity = t < f.a ? 1 : 0;
        f.style.borderColor = on ? RED : INK; f.style.outline = on ? `4px solid ${RED}` : "none";
        f.cut.style.opacity = 1 - seg(t, f.a, f.a + .18) > 0 && t >= f.a ? .85 * (1 - seg(t, f.a, f.a + .18)) : 0;
        f.film.update(t < f.a ? 0 : lt * (on ? 1 : 1), .9);
        f.bars.forEach((b2, k) => { b2.style.height = (on ? 8 + 20 * Math.abs(Math.sin(t * (7 + k * 1.7) + k)) : 8) + "px"; });
        if (i === 0) {   // hop in from the left, land, THEN dolly in
          const hop = seg(lt, 0, .8), land = f.a + .8;
          poseNoa(f.n, t, { x: lerp(-180, 165, out(hop)), y: 72, s: 1, hop: hop > 0 && hop < 1 ? hop : 0, wave: t > land + .1 && on });
          f.cam.style.transform = `scale(${1 + .22 * ease(seg(t, land, f.b))})`;
        } else if (i === 1) {   // close-up, camera still: turns to camera, the sunglasses glint
          const turn = ease(seg(lt, .15, .55));
          poseNoa(f.n, t, { x: 30, y: -150, s: 1, look: lerp(1, 0, turn), blink: false });
          const g = seg(t, f.a + .55, f.a + 1.05), gv = g > 0 && g < 1 ? Math.sin(g * Math.PI) : 0;
          f.gl.style.opacity = gv; f.gl.style.transform = `translate(${148}px, ${76}px) scale(${.4 + gv}) rotate(${90 * g}deg)`;
        } else {   // back view walks toward the curtain; the camera follows only once it starts walking
          const walk = seg(t, f.a + .3, f.b);
          poseNoa(f.n, t, { x: 165 + 20 * Math.sin(walk * 9), y: lerp(108, 60, walk), s: lerp(1, .62, walk), hop: walk > 0 && walk < 1 ? (walk * 5) % 1 * .35 : 0 });
          f.cam.style.transform = `scale(${1 + .16 * ease(walk)}) translateY(${-10 * ease(walk)}px)`;
        }
        slam(f.st, t, f.b - .3, [-6, 4, -3][i]);
      });
      const bp = back(seg(t, 14.4, 14.85)); badge.style.opacity = clamp(bp * 2); badge.style.transform = `scale(${.5 + .5 * bp}) rotate(${-1.5 * bp}deg)`;
      refsN.style.opacity = seg(t, 14.7, 15.0);

      // ---- D
      const nIn = back(seg(t, 17.95, 18.4)), exit = ease(seg(t, 19.0, 19.9));
      const nx = lerp(990, 1260, exit);
      poseNoa(noa, t, { x: nx, y: 700 + 220 * (1 - nIn), s: 1, op: t > 17.9 ? clamp(nIn * 3) * (1 - seg(exit, .85, 1)) : 0,
        look: t < 18.9 ? -.4 : 1, hop: exit > 0 && exit < 1 ? (exit * 3) % 1 * .45 : 0, wave: t > 18.4 && t < 18.95 });
      const g2 = seg(t, 18.55, 18.95), gv2 = g2 > 0 && g2 < 1 ? Math.sin(g2 * Math.PI) : 0;
      nGl.style.opacity = gv2; nGl.style.transform = `translate(${nx + 104 - 40}px, ${700 + 58 - 40}px) scale(${.4 + gv2}) rotate(${90 * g2}deg)`;
      const uIn = back(seg(t, 18.05, 18.45));
      poseUchu(uchal, t, { x: 1480, y: 700 + 240 * (1 - uIn), mood: "shock", look: -1, op: t > 18 ? clamp(uIn * 3) : 0, tag: seg(t, 18.35, 18.7),
        hop: seg(t, 18.5, 18.95) > 0 && t < 18.95 ? seg(t, 18.5, 18.95) : 0 });
      sayBubble(ub, t, 18.2, 20.2, "30초에 소리까지?!", 1250, 600);
      burst.fire(t, 18.6, nx + 104, 758, .7);
      if (t > 18.15 && t < 18.6) shakeCam(t, 18.15, 5, .3);
    };
  });
})();
