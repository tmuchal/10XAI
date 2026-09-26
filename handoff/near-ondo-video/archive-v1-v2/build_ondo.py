import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = open('ondo-base.html').read()
def R(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (s.count(a), a[:80])
    s = s.replace(a, b)

R("<title>The Case of NEAR's +80% Week</title>", "<title>Ondo × BlackRock, Fact-Checked</title>")
R("family=Gochi+Hand&family=Gaegu:wght@400;700&family=", "family=Gochi+Hand&family=Gaegu:wght@400;700&family=Black+Han+Sans&family=Jua&family=")

R("  [hidden]{ display:none !important; }\n</style>", open('cut_css.css').read() + "\n</style>")

i0 = s.index('  <header class="intro">'); i1 = s.index('  <section class="player"')
s = s[:i0] + open('ondo_intro.html').read() + s[i1:]
j0 = s.index('  <section class="sheet"'); j1 = s.index('  <section class="sources"')
s = s[:j0] + open('ondo_sections.html').read() + s[j1:]
R('''      <div class="banner" aria-live="polite">''', '''      <div class="kprog" id="kprog"></div>
      <div class="endcard" id="endCard"><span class="echip">판결 · 한 줄 요약</span><p class="e1">MOU 아닌 <em>상품 제휴</em></p><p class="e2">이름값은 크고, 블랙록 역할은 <b>제한적</b></p><p class="e3">A product deal, not an MOU. Big name, limited role.</p><p class="e4">투자 조언 아님 · 2026년 9월 24일 보도 기준</p></div>
      <div class="khead"><span class="kchap" id="kchap">MOU?</span><span class="ktitle">온도 × 블랙록 팩트체크</span></div>
      <div id="kpops"></div>
      <div class="cutflash" id="cutflash"></div>
      <div class="banner" aria-live="polite">''')
R('<button class="btn ghost" id="juryBtn" type="button" aria-pressed="true">Jury mode</button>', '<button class="btn ghost" id="juryBtn" type="button" aria-pressed="false" hidden>Jury mode</button>')
R('<input id="scrub" type="range" min="0" max="101" step="0.05" value="0" aria-label="Seek">', '<input id="scrub" type="range" min="0" max="31" step="0.02" value="0" aria-label="Seek">')
R('<span class="tc" id="tcOut">0:00 / 1:41</span>', '<span class="tc" id="tcOut">0:00 / 0:31</span>')

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

k0 = s.index("  // ---------- Controls ----------"); k1 = s.index("})();\n</script>")
score = ''
s = s[:k0] + score + open('reaction.js').read() + open('cut_engine_ondo.js').read() + s[k1:]
open('ondo-30s.html', 'w').write(s)
print('built')
s = open('ondo-30s.html').read()
i = s.index('<section class="sources"'); j = s.index('</section>', i) + len('</section>')
s = s[:i] + '''<section class="sources" aria-labelledby="srcHead">
    <div class="sec-head" style="margin-bottom:14px">
      <span class="eyebrow">Evidence locker</span>
      <h2 id="srcHead">Sources</h2>
      <p>All figures are as reported by these outlets. They were not re-checked against on-chain or exchange data. This is not investment advice.</p>
    </div>
    <ol>
      <li><a href="https://www.prnewswire.com/news-releases/ondo-launches-intelligent-portfolios-powered-by-blackrock-bringing-portfolio-strategies-onchain-302889211.html">PR Newswire: Ondo launches Intelligent Portfolios, Powered by BlackRock</a></li>
      <li><a href="https://www.theblock.co/news/markets/2026-09-24-ondo-launches-onchain-portfolio-tokens-based-blackrock-developed-strategies-416260">The Block: portfolio tokens and BlackRock's limited role</a></li>
      <li><a href="https://crypto.news/blackrock-strategies-power-three-ondo-portfolio-tokens/">crypto.news: three Ondo portfolio tokens</a></li>
      <li><a href="https://www.cryptotimes.io/2026/09/24/ondo-launches-three-tokenized-portfolios-built-on-blackrock-strategies/">The Crypto Times: three tokenized portfolios</a></li>
      <li><a href="https://cryptobriefing.com/ondo-blackrock-tokenized-intelligent-portfolios/">Crypto Briefing: $9.8T model-portfolio business</a></li>
      <li><a href="https://ondo.finance/blog/introducing-ondo-intelligent-portfolios">Ondo blog: Introducing Ondo Intelligent Portfolios</a></li>
      <li><a href="https://bitcoinethereumnews.com/tech/ondo-ondo-price-rallies-18-following-blackrock-partnership-token-release/">BEN: ONDO +18% after the launch</a></li>
      <li><a href="https://www.coingecko.com/en/coins/ondo">CoinGecko: ONDO price</a></li>
      <li><a href="https://ondo.finance/blog/building-on-buidl-how-ondo-leverages-blackrocks-tokenized-treasuries">Ondo blog: the earlier BUIDL relationship</a></li>
    </ol>
  </section>''' + s[j:]
s = s.replace('<p class="fine">This is an explainer, not investment advice.</p>', '<p class="fine">A fact-check explainer, not investment advice.</p>')
open('ondo-30s.html', 'w').write(s)
print('sources ok')
