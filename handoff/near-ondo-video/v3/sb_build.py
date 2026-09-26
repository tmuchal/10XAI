import json, base64, html
cues = json.load(open('sb/cues.json'))
chs = json.load(open('near3.json'))['chapters']
fmt = lambda t: f"{int(t//60)}:{int(t%60):02d}"
VIS = {
 'hook1':'Hero price card: $2.20 → $4.29 counter, mini line chart, green +95% stamp, confetti; Uchay reaction close-up "9일 만에 2배?!"',
 'hook2':'Three agenda cards: ① 차트 ② 팩트체크 ③ 미래; Uchay bubble "숫자로만 가자!"',
 'c1':'Curtains close · sign "CHAPTER 01 차트가 말하는 것"',
 'pa1':'Big daily line chart (Sep 10–24) draws halfway; +14% snapshot marker',
 'pa2':'Same chart continues; dashed years-long downtrend line appears; +45% marker; camera push-in',
 'pa3':'Same chart; $3.80–3.90 band highlights',
 'pa4':'Bar chart: ATH $20.44 vs $4.29; −79% stamp; Noa bubble',
 'c2':'Curtains · "CHAPTER 02 누가 가격을 밀었나"',
 'dr1':'Confidential TVL gauge + counter to $70.8M',
 'dr2':'Payoff (call-option) chart slides in over the gauge',
 'dr3':'$31.4B Intents counter + weekly fee bars ≈$1M → ≈$2M',
 'dr4':'Two cards: BTC short squeeze $648M, Zcash $1,600',
 'dr5':'Formula row: incentive + usage + market wave = +95%, evidence ranking rows',
 'c3':'Curtains · "CHAPTER 03 팩트체크"',
 'fc1':'Fact-check board, row 1: 일주일 +80% → 사실 stamp',
 'fc2':'Row 2: TVL $350M+ → 부풀림; price→TVL loop strip; Uchay squint reaction',
 'fc3':'Row 3: 거래량 +120% → 미확인 stamp',
 'fc4':'Row 4: 선물 출시 → 불분명',
 'fc5':'Row 5: Ondo 제휴 → 늦음 stamp',
 'c4':'Curtains · "CHAPTER 04 공급과 소각"',
 'tk1':'Inflation bars 5% → 2.5%',
 'tk2':'Fee flow: base gas → 70% burn; Intents fees → NEAR buy',
 'tk3':'Gauge: burn vs issuance (needle ≈45%, estimate)',
 'c5':'Curtains · "CHAPTER 05 미래: AI × 인텐트"',
 'fu1':'Two pillars: Intents | user-owned AI',
 'fu2':'Flow: AI agent → intent → solvers → 35+ chains; token dot travels',
 'fu3':'TEE box: encrypted packets in/out',
 'fu4':'Stat tiles: 9 shards · dynamic resharding · 1,000,000 TPS',
 'fu5':'Yellow card: cheap · private · cross-chain',
 'c6':'Curtains · "CHAPTER 06 투자 관점 시나리오"',
 'sc1':'Scenario cards appear one by one: 강세',
 'sc2':'+ 기본',
 'sc3':'+ 약세',
 'sc4':'Checklist panel: 4 numbers to watch',
 'c7':'Curtains · "마지막 장. 판결"',
 'v1':'Verdict card drops, CASE CLOSED stamp, confetti; Uchay reaction "주범은 인센티브!"',
 'v2':'Same verdict card; Noa closes with disclaimer',
}
FLAG = {
 'hook1':('red', 'Headline says +95% (9 days), but chapter 3 confirms "+80% in a week". Two different numbers for the same move, with no explanation.'),
 'hook2':('amber', 'The agenda (차트·팩트체크·미래) doesn\'t match the 7 chapters that follow, so viewers lose the map.'),
 'pa3':('amber', 'Support/resistance claim with no follow-up; the price after Sep 23 is never shown.'),
 'dr5':('red', 'The conclusion ("incentive lit the fuse") lands at 0:52, before the fact check. Chapter 3 then re-judges suspects that chapter 2 never introduced (TVL, perps, Ondo).'),
 'c3':('red', 'Drivers and fact check are split across two chapters. The same "who did it" question is answered twice, in two formats.'),
 'fc1':('amber', 'Re-checks a number already shown in the hook, which adds nothing new.'),
 'c4':('amber', 'Supply/burn sits between the fact check and the AI future with no bridge. It belongs next to the investment view.'),
 'tk3':('amber', 'This is the only estimate in the video, and it\'s shown as a gauge without its inputs.'),
 'c5':('amber', 'The future chapter never connects back to price: why would AI agents create demand for NEAR?'),
 'fu5':('amber', 'Noa\'s line repeats the previous card.'),
 'sc4':('amber', 'Watch-list comes after scenarios but isn\'t tied to them (which number flips bull → bear?).'),
 'v1':('amber', 'Verdict repeats dr5 almost word for word. The ending adds no new insight.'),
 'c7':('amber', '7 curtain breaks ≈ 17s of the 2:51 runtime is chapter cards.'),
}
def thumb(i):
    return 'data:image/jpeg;base64,' + base64.b64encode(open(f'sb/{i}.s.jpg','rb').read()).decode()
rows = []
cur = -1
for c in cues:
    if c['ch'] != cur:
        cur = c['ch']; ch = chs[cur]
        chcues = [q for q in cues if q['ch'] == cur]
        rows.append(f'<h3 class="chh"><span class="n">CH {cur:02d}</span> {html.escape(ch["ko"])} <small>{html.escape(ch["en"])} · {fmt(chcues[0]["t0"])}–{fmt(chcues[-1]["t1"])} · {chcues[-1]["t1"]-chcues[0]["t0"]:.0f}s</small></h3>')
    fl = FLAG.get(c['id'])
    who = 'Noa' if c['who'] == 'noa' else 'Uchay'
    rows.append(f'''<article class="shot{' card' if c['card'] else ''}{(' f-' + fl[0]) if fl else ''}">
  <img src="{thumb(c['id'])}" alt="Frame from {c['id']}" loading="lazy">
  <div class="meta"><div class="top"><b class="id">{c['id']}</b><span class="tc">{fmt(c['t0'])}–{fmt(c['t1'])} · {c['t1']-c['t0']:.1f}s</span><span class="who">{'' if c['card'] else who}</span></div>
  <p class="en">“{html.escape(c['en'])}”</p><p class="ko">{html.escape(c['ko'])}</p>
  <p class="vis">{html.escape(VIS.get(c['id'], ''))}</p>
  {f'<p class="src">출처 · {html.escape(c["src"])}</p>' if c['src'] else ''}
  {f'<p class="flag {fl[0]}">{"문제" if fl[0]=="red" else "주의"} · {html.escape(fl[1])}</p>' if fl else ''}</div>
</article>''')
body = '\n'.join(rows)
tot = cues[-1]['t1'] + 1.2
PROPOSED = [
 ('00', '콜드 오픈 · 질문 던지기', 'Cold open · the question', '0:00–0:14', [
   ('Uchay', '9월 14일 $2.20 → 23일 $4.29. 9일 +95%, 일주일 기준 +80%.', 'One number set, explained once: 9-day +95% and 7-day +80% on the same chart'),
   ('Noa', '"그래서 누가 올렸고, 이거 계속 가?"', 'Noa becomes the skeptic who asks the questions; Uchay answers'),
   ('—', '오늘의 3가지 질문: 누가? 진짜 가치? 앞으로?', 'Agenda = exactly the 3 acts that follow')]),
 ('01', '사건 재구성: 가격 + 사건 타임라인', 'Reconstruct the week', '0:14–0:45', [
   ('Uchay', '일별 차트 위에 사건을 겹쳐서: 9/17 스냅샷, 9/17·21 선물(날짜 논란), 9/21 BTC 스퀴즈, 9/23 Ondo', 'One chart with event pins: timing becomes visible evidence'),
   ('Noa', '"Ondo는 23일? 이미 다 오른 뒤네."', 'Timing kills weak suspects on screen instead of in a separate table'),
   ('Uchay', '추세선 돌파, $3.80–3.90 구간, 그리고 9/24 이후 가격', 'Adds what happened after the peak')]),
 ('02', '용의자 심문 (원인 + 팩트체크 통합)', 'Suspects, each with a verdict', '0:45–1:35', [
   ('Uchay', '용의자 카드 5장: 인센티브 · 실사용 · 시장 파도 · 선물 · TVL/Ondo', 'Each suspect: claim → evidence → stamp (강함/부분/미확인/늦음)'),
   ('Noa', '"TVL 3.5억 달러면 대박 아냐?" → 가격이 TVL을 부풀리는 루프', 'Fact check lives inside the suspect it belongs to'),
   ('Uchay', '랭킹 보드로 정리: 불씨 = 인센티브, 연료 = 실사용 + 시장', 'One conclusion, stated once')]),
 ('03', '가치가 받쳐주나? (실사용 × 공급)', 'Is value backing it?', '1:35–2:05', [
   ('Uchay', '인텐트 거래량·수수료 → 소각 70% / 인텐트 수수료 NEAR 매수', 'Usage and burn shown as one flow'),
   ('Uchay', '발행 2.5%(연 약 3,200만 개) vs 9월 수준 소각 — 계산 과정 공개', 'The estimate shows its inputs'),
   ('Noa', '"그럼 수수료가 몇 배가 돼야 순감소야?"', 'Question that leads straight into the future act')]),
 ('04', '미래: AI 에이전트가 수요가 된다면', 'AI agents as future demand', '2:05–2:35', [
   ('Uchay', 'AI 에이전트 → 인텐트 → 솔버 → 35+ 체인 (TEE로 비공개)', 'Framed as "where fees could come from"'),
   ('Uchay', '샤드 9개, 동적 리샤딩, 1M TPS 테스트 = 에이전트 규모를 감당할 레일', 'Tech tied back to the fee question'),
   ('Noa', '"아직은 로드맵. 숫자로 확인해야지."', 'Keeps it honest: project claims labeled')]),
 ('05', '시나리오 + 체크리스트 + 판결', 'Scenarios, watch-list, verdict', '2:35–3:00', [
   ('Uchay', '강세/기본/약세, 각 시나리오를 뒤집는 숫자 하나씩', 'Watch-list is built into each scenario'),
   ('Uchay', '판결: 인센티브가 점화, 실사용이 바닥, 관건은 $3.33과 인텐트 수수료', 'Verdict adds the forward-looking test, not a repeat'),
   ('Noa', '투자 조언 아님.', '')]),
]
prop = []
for n, ko, en, tc, beats in PROPOSED:
    prop.append(f'<div class="act"><div class="acth"><span class="n">ACT {n}</span><b>{ko}</b><small>{en} · {tc}</small></div><ol>' + ''.join(f'<li><span class="w">{w}</span><span class="l">{html.escape(l)}</span><span class="why">{html.escape(y)}</span></li>' for w, l, y in beats) + '</ol></div>')
page = f'''<title>NEAR Storyboard Review</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,700;6..12,800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{{ color-scheme:light; --bg:#FFF7EA; --panel:#fff; --line:#EADBC4; --ink:#2A1E1A; --muted:#7A6A5C; --red:#C8372D; --amber:#B7791F; --green:#2E7D3E; --yellow:#F8C94A; --navy:#2F4468;
  --ko:'Gaegu','Apple SD Gothic Neo','Malgun Gothic',sans-serif; --body:'Nunito Sans',system-ui,-apple-system,'Segoe UI',sans-serif; --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace; }}
body{{ margin:0; background:var(--bg); color:var(--ink); font:15px/1.55 var(--body); }}
.wrap{{ max-width:1200px; margin:0 auto; padding-inline:clamp(16px,4vw,40px); padding-block:32px 80px; display:flex; flex-direction:column; gap:36px; }}
.eyebrow{{ font:500 12px/1 var(--mono); letter-spacing:.14em; text-transform:uppercase; color:var(--red); }}
h1{{ font:700 clamp(32px,5vw,52px)/1.05 var(--ko); margin:6px 0 8px; text-wrap:balance; }}
h2{{ font:700 clamp(26px,3.4vw,36px)/1.1 var(--ko); margin:0 0 6px; }}
.dek{{ color:var(--muted); margin:0; max-width:70ch; }}
.stats{{ display:flex; flex-wrap:wrap; gap:10px; margin-top:14px; }}
.stat{{ background:var(--panel); border:2px solid var(--line); border-radius:10px; padding:8px 12px; font:700 14px/1.2 var(--body); }}
.stat b{{ display:block; font:700 24px/1 var(--ko); }}
.issues{{ display:grid; grid-template-columns:minmax(0,1fr); gap:10px; }}
@media (min-width:820px){{ .issues{{ grid-template-columns:repeat(2,minmax(0,1fr)); }} }}
.iss{{ background:var(--panel); border:2px solid var(--line); border-left:6px solid var(--red); border-radius:10px; padding:12px 14px; }}
.iss.amber{{ border-left-color:var(--amber); }}
.iss b{{ font:700 19px/1.2 var(--ko); display:block; margin-bottom:3px; }}
.iss p{{ margin:0; color:#4A3A30; }}
.chh{{ font:700 24px/1.2 var(--ko); margin:18px 0 4px; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }}
.chh .n{{ font:500 12px/1 var(--mono); letter-spacing:.14em; color:var(--red); }}
.chh small{{ font:500 13px/1 var(--mono); color:var(--muted); }}
.board{{ display:flex; flex-direction:column; gap:10px; }}
.shot{{ display:grid; grid-template-columns:minmax(0,1fr); gap:12px; background:var(--panel); border:2px solid var(--line); border-radius:12px; padding:10px; }}
@media (min-width:760px){{ .shot{{ grid-template-columns:300px minmax(0,1fr); }} }}
.shot.card{{ background:#FBF3E4; }}
.shot.f-red{{ border-color:#E7A59C; box-shadow:inset 5px 0 0 var(--red); }}
.shot.f-amber{{ border-color:#EBCB8F; box-shadow:inset 5px 0 0 var(--amber); }}
.shot img{{ width:100%; height:auto; aspect-ratio:16/9; display:block; border-radius:6px; border:1.5px solid var(--ink); }}
.meta{{ display:flex; flex-direction:column; gap:4px; min-width:0; }}
.top{{ display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; }}
.id{{ font:700 14px/1 var(--mono); }}
.tc{{ font:500 12px/1 var(--mono); color:var(--muted); font-variant-numeric:tabular-nums; }}
.who{{ font:700 12px/1 var(--body); background:#FFF1B8; border:1px solid var(--ink); border-radius:99px; padding:3px 8px; }}
.who:empty{{ display:none; }}
.en{{ margin:0; font-weight:700; }}
.ko{{ margin:0; font:700 17px/1.3 var(--ko); color:var(--navy); }}
.vis{{ margin:0; color:var(--muted); font-size:14px; }}
.src{{ margin:0; font:500 12px/1.3 var(--mono); color:var(--muted); }}
.flag{{ margin:4px 0 0; font-size:14px; padding:6px 9px; border-radius:8px; }}
.flag.red{{ background:#FCE3DF; color:#7A1D14; }} .flag.amber{{ background:#FFF0CC; color:#6B4A0A; }}
.acts{{ display:grid; grid-template-columns:minmax(0,1fr); gap:12px; }}
@media (min-width:900px){{ .acts{{ grid-template-columns:repeat(2,minmax(0,1fr)); }} }}
.act{{ background:var(--panel); border:2px solid var(--ink); border-radius:12px; padding:14px 16px; box-shadow:4px 4px 0 rgba(42,30,26,.85); }}
.acth{{ display:flex; flex-direction:column; gap:2px; margin-bottom:8px; }}
.acth .n{{ font:500 12px/1 var(--mono); letter-spacing:.14em; color:var(--red); }}
.acth b{{ font:700 22px/1.15 var(--ko); }}
.acth small{{ font:500 12px/1.3 var(--mono); color:var(--muted); }}
.act ol{{ margin:0; padding-left:1.2em; display:flex; flex-direction:column; gap:8px; }}
.act li .w{{ font:700 12px/1 var(--body); background:#E4F1FF; border:1px solid var(--ink); border-radius:99px; padding:2px 7px; margin-right:6px; }}
.act li .l{{ font:700 16px/1.35 var(--ko); }}
.act li .why{{ display:block; font-size:13px; color:var(--muted); }}
.cmp{{ width:100%; border-collapse:collapse; background:var(--panel); border:2px solid var(--line); border-radius:12px; overflow:hidden; }}
.cmp-wrap{{ overflow-x:auto; }}
.cmp th, .cmp td{{ text-align:left; padding:9px 12px; border-bottom:1px solid var(--line); vertical-align:top; font-size:14px; }}
.cmp th{{ font:500 11px/1.4 var(--mono); letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }}
.cmp td b{{ font-family:var(--ko); font-size:16px; }}
</style>
<main class="wrap">
<header>
  <span class="eyebrow">Storyboard review · NEAR, 9일 만에 2배</span>
  <h1>지금 구성 그대로 펼쳐 보기</h1>
  <p class="dek">Every line of the current cut, with a real frame from the video, the English and Korean lines, what's on screen, and the source. Shots with structural problems are marked red (breaks the story) or amber (weakens it). A proposed reorder follows at the bottom. Nothing has been rebuilt yet.</p>
  <div class="stats"><div class="stat"><b>{fmt(tot)}</b>runtime</div><div class="stat"><b>{len(cues)}</b>lines</div><div class="stat"><b>8</b>chapters</div><div class="stat"><b>7</b>curtain breaks</div><div class="stat"><b>{sum(1 for v in FLAG.values() if v[0]=="red")}</b>red flags</div></div>
</header>
<section>
  <span class="eyebrow">Diagnosis</span><h2>무엇이 이상한가</h2>
  <div class="issues">
    <div class="iss"><b>같은 질문을 두 번 답함</b><p>Chapter 2 names the culprit (incentive) at 0:52, then chapter 3's fact check re-judges TVL, perps and Ondo, suspects chapter 2 never introduced. Viewers get the answer before the evidence.</p></div>
    <div class="iss"><b>숫자가 두 개 (+95% vs +80%)</b><p>The hook says +95% over 9 days; the fact check confirms +80% in a week. Both are right, but the video never says why they differ.</p></div>
    <div class="iss amber"><b>챕터 순서에 다리가 없음</b><p>Supply and burn (ch 4) sits between the fact check and the AI future, and the future chapter never connects back to price or demand.</p></div>
    <div class="iss amber"><b>커튼이 너무 잦음</b><p>Eight chapters means seven curtain breaks, about 17s of chapter cards in a 2:51 video. The agenda in the hook lists three parts, not eight.</p></div>
    <div class="iss amber"><b>노아의 역할이 없음</b><p>Noa mostly repeats Uchay's summary. There's no question-and-answer dynamic to carry the story.</p></div>
    <div class="iss amber"><b>끝이 반복</b><p>The verdict restates dr5 almost word for word and adds no forward-looking test.</p></div>
  </div>
</section>
<section>
  <span class="eyebrow">Current cut · shot by shot</span><h2>현재 스토리보드 ({len(cues)}컷)</h2>
  <div class="board">{body}</div>
</section>
<section>
  <span class="eyebrow">Proposal · not built yet</span><h2>제안: 6막 구조로 재구성</h2>
  <p class="dek" style="margin-bottom:12px">Three questions, asked once and answered in order: who pushed it, is value backing it, and what happens next. Noa asks, Uchay answers. The drivers and fact check merge into one "suspects" act, and the chapter count drops from 8 to 6.</p>
  <div class="acts">{''.join(prop)}</div>
</section>
<section>
  <span class="eyebrow">Before → after</span><h2>바뀌는 점</h2>
  <div class="cmp-wrap"><table class="cmp"><thead><tr><th>Area</th><th>Now</th><th>Proposed</th></tr></thead><tbody>
    <tr><td><b>질문</b></td><td>"Hype or real?", with an agenda that doesn't match the chapters</td><td>3 questions (누가? 가치? 앞으로?) that map 1:1 to acts 2–4</td></tr>
    <tr><td><b>원인 + 팩트체크</b></td><td>Two chapters; the answer comes before the evidence</td><td>One act: each suspect → evidence → stamp, then a ranking</td></tr>
    <tr><td><b>+95% vs +80%</b></td><td>Both shown, never reconciled</td><td>Explained once in the cold open, on the same chart</td></tr>
    <tr><td><b>타임라인</b></td><td>Price chart without events</td><td>Event pins on the chart (snapshot, perps dates, BTC squeeze, Ondo)</td></tr>
    <tr><td><b>공급·소각</b></td><td>Floating chapter, estimate shown without its math</td><td>"Is value backing it?", with the inputs shown and a bridge to the future act</td></tr>
    <tr><td><b>AI 미래</b></td><td>Tech list</td><td>Framed as "where future fee demand could come from", with project claims labeled</td></tr>
    <tr><td><b>엔딩</b></td><td>Repeats dr5</td><td>Verdict plus a forward test: $3.33 and Intents fees</td></tr>
    <tr><td><b>챕터 카드</b></td><td>8 chapters · 7 curtains</td><td>6 acts · 5 curtains, about 5s saved for content</td></tr>
  </tbody></table></div>
</section>
</main>'''
open('near-storyboard.html', 'w').write(page)
print(len(page)//1024, 'KB')
