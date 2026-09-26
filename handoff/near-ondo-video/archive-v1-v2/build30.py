import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = open('near-case.html').read()
def R(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (s.count(a), a[:80])
    s = s.replace(a, b)

R("<title>The Case of NEAR's +80% Week</title>", "<title>NEAR +80% in 30 Seconds</title>")
R("family=Gochi+Hand&family=Gaegu:wght@400;700&family=", "family=Gochi+Hand&family=Gaegu:wght@400;700&family=Black+Han+Sans&family=Jua&family=")

R("  [hidden]{ display:none !important; }\n</style>", open('cut_css.css').read() + "\n</style>")

i0 = s.index('  <header class="intro">'); i1 = s.index('  <section class="player"')
s = s[:i0] + open('cut_intro.html').read() + s[i1:]
j0 = s.index('  <section class="sheet"'); j1 = s.index('  <section class="sources"')
s = s[:j0] + open('cut_sections.html').read() + s[j1:]
R('''      <div class="banner" aria-live="polite">''', '''      <div class="kprog" id="kprog"></div>
      <div class="endcard" id="endCard"><span class="echip">사건 종결 · 한 줄 요약</span><p class="e1">불 붙인 건 <em>인센티브</em>, 키운 건 <em>시장</em></p><p class="e2">관건은 3일 평균가 <b>$3.33</b></p><p class="e3">The incentive lit it, the market fanned it. Watch $3.33.</p><p class="e4">투자 조언 아님 · 2026년 9월 14–24일 보도 기준</p></div>
      <div class="khead"><span class="kchap" id="kchap">사건 개요</span><span class="ktitle">NEAR +80% 사건 파일</span></div>
      <div id="kpops"></div>
      <div class="cutflash" id="cutflash"></div>
      <div class="banner" aria-live="polite">''')
R('<button class="btn ghost" id="juryBtn" type="button" aria-pressed="true">Jury mode</button>', '<button class="btn ghost" id="juryBtn" type="button" aria-pressed="false" hidden>Jury mode</button>')
R("tl.fromTo(train, {x:-200}, {x:1900, duration:3.4, ease:'power1.in'}, 66.6);", "tl.fromTo(train, {x:120}, {x:1750, duration:2.8, ease:'none'}, 66.5);")
R('<input id="scrub" type="range" min="0" max="101" step="0.05" value="0" aria-label="Seek">', '<input id="scrub" type="range" min="0" max="30" step="0.02" value="0" aria-label="Seek">')
R('<span class="tc" id="tcOut">0:00 / 1:41</span>', '<span class="tc" id="tcOut">0:00 / 0:30</span>')

R("if (!sfxOn || !AC || tl.paused()) return;", "if (!sfxOn || !AC) return;")
R("let lastScene = -1, lastSub = null, lastSeed = -1;", "let lastScene = -1, lastSub = null, lastSeed = -1;\n  let CUT = null, cutT = 0, cutPlaying = false;")
R('''    let idx = -1;
    for (let i = 0; i < CUES.length; i++){ if (CUES[i].t <= t) idx = i; }
    const cue = CUES[idx], next = CUES[idx+1];
    let en = '', ko = '', typing = false;
    if (cue && (!next || t < next.t) && (t < cue.t + cue.s.length/CPS + 5 || (speaking && spokenIdx === idx))){
      if (voiceOn){ en = cue.s; }
      else { const n = Math.floor((t - cue.t)*CPS); en = cue.s.slice(0, n); typing = n < cue.s.length; }
      ko = cue.ko;
    }''', '''    const CC = CUT ? CUT.cues : CUES, ct = CUT ? cutT : t;
    let idx = -1;
    for (let i = 0; i < CC.length; i++){ if (CC[i].t <= ct) idx = i; }
    const cue = CC[idx], next = CC[idx+1];
    let en = '', ko = '', typing = false;
    if (cue && (!next || ct < next.t) && (ct < cue.t + cue.s.length/CPS + 5 || (speaking && spokenIdx === idx))){
      if (voiceOn){ en = cue.s; }
      else { const n = Math.floor((ct - cue.t)*CPS); en = cue.s.slice(0, n); typing = n < cue.s.length; }
      ko = cue.ko;
    }''')
R("const talking = voiceOn ? speaking : (typing && !tl.paused());", "const talking = voiceOn ? speaking : (typing && (CUT ? cutPlaying : !tl.paused()));")
R("if (G3) G3.render(t, w);", "if (G3) G3.render(t, w, CUT ? CUT.fx : null);")
R("function render(t, w){", "function render(t, w, fx){")
R("        for (let j = 0; j < b.n; j++){\n          const i = b.i0 + j;\n          if (a < 0 || a > 3.4){ hide(conf, i); continue; }", "        for (let j = 0; j < b.n; j++){\n          const i = b.i0 + j;\n          if (a < 0 || a > 3.4 || (fx && fx.cap && b.t > fx.cap)){ hide(conf, i); continue; }")
R("          if (a < 0 || a > 3.6){ hide(coins, i); hide(coinsInk, i); continue; }", "          if (a < 0 || a > 3.6 || (fx && fx.cap && c.t > fx.cap - .1)){ hide(coins, i); hide(coinsInk, i); continue; }")
R("      const tr = TR.find(r => t >= r.t0 && t <= r.t1);\n      if (tr){\n        if (faceN !== tr.n) drawFace(tr.n);\n        const p = (t - tr.t0)/(tr.t1 - tr.t0);",
  "      const tr = fx ? fx.cube : TR.find(r => t >= r.t0 && t <= r.t1);\n      if (tr){\n        if (faceN !== tr.n) drawFace(tr.n);\n        const p = fx ? tr.p : (t - tr.t0)/(tr.t1 - tr.t0);")
R("""    function drawFace(n){
      const c = faceCanvas.getContext('2d');""", """    function drawFace(n){
      const c = faceCanvas.getContext('2d');
      if (typeof n === 'string'){
        const [a, b] = n.split('|');
        c.fillStyle = '#FFD84A'; c.fillRect(0, 0, 256, 256);
        c.strokeStyle = '#2A1E1A'; c.lineWidth = 12; c.strokeRect(6, 6, 244, 244);
        c.fillStyle = '#2A1E1A'; c.textAlign = 'center';
        c.font = '64px "Black Han Sans", "Jua", sans-serif'; c.fillText(a, 128, 118);
        c.fillStyle = '#C8372D'; c.font = '48px "Jua", "Black Han Sans", sans-serif'; c.fillText(b || '', 128, 196);
        faceTex.needsUpdate = true; faceN = n; return;
      }""")


# --- worlds: per-chapter backgrounds ---
R("  // ---------- Curtains, scene switching, acting ----------", open('bg.js').read() + "  // ---------- Curtains, scene switching, acting ----------")
R("  tl.to({}, {duration:.01}, D - .01);", "  wireWorlds(['city','rooftop','vault','highway','trading','clouds','station','beach','court']);\n  tl.to({}, {duration:.01}, D - .01);")
R("rays.setAttribute('transform', `rotate(${(w*2.5)%360} 800 330)`);", "rays.setAttribute('transform', `rotate(${(w*2.5)%360} 800 330)`);\n    (window.__AMB || []).forEach(f => f(t, w));")
k0 = s.index("  // ---------- Controls ----------"); k1 = s.index("})();\n</script>")
score = open('cut_score.js').read() if os.path.exists('cut_score.js') else ''
s = s[:k0] + score + open('reaction.js').read() + open('cut_engine.js').read() + s[k1:]
open('near-30s.html', 'w').write(s)
print('built')
