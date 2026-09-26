import sys
fn, reacts = sys.argv[1], sys.argv[2]
s = open(fn).read()
def R(a, b):
    global s
    assert s.count(a) == 1, (fn, a[:70]); s = s.replace(a, b)
if 'const REACTS' in s: sys.exit('already patched')
R("  CUT = {cues:CUT_CUES,", "  const REACTS = " + reacts + ";\n" + r'''  REACTS.sort((a, b) => a.at - b.at);
  const EDIT_D = CUT_D + REACTS.reduce((a, r) => a + r.d, 0);
  function toCut(e){ let acc = 0; for (const r of REACTS){ const s0 = r.at + acc; if (e < s0) return e - acc; if (e < s0 + r.d) return r.at; acc += r.d; } return Math.min(CUT_D, e - acc); }
  function reactAt(e){ let acc = 0; for (const r of REACTS){ const s0 = r.at + acc; if (e >= s0 && e < s0 + r.d) return {r, a:e - s0}; acc += r.d; } return null; }
  function toEdit(c){ let acc = 0; for (const r of REACTS){ if (r.at <= c) acc += r.d; } return c + acc; }
  const reactStart = r => toEdit(r.at) - r.d;
  CUT = {cues:CUT_CUES,''')
R("  const kpops = $('kpops'), kchap", "  const reactEl = buildReactionCam(); $('kpops').after(reactEl);\n  const rFace = reactEl.querySelector('.rface'), rMouth = reactEl.querySelector('.rmouth'), rCap = reactEl.querySelector('.rcap'), rKo = reactEl.querySelector('.rko'), rEn = reactEl.querySelector('.ren');\n  const kpops = $('kpops'), kchap")
# render wrapper
R("  // ---------- Playback ----------", r'''  let editT = 0;
  function renderReact(e, w){
    const ra = reactAt(e);
    if (!ra){ if (reactEl.style.display !== 'none') reactEl.style.display = 'none'; return; }
    const {r, a} = ra;
    reactEl.style.display = 'block';
    if (reactEl.dataset.mood !== r.mood){ reactEl.dataset.mood = r.mood; }
    if (rKo.__h !== r.ko){ rKo.innerHTML = r.ko; rEn.textContent = r.en; rKo.__h = r.ko; }
    const q = Math.min(1, a/.22), punch = rm ? 1 : 1.28 - .28*easeBack(q);
    const sh = rm ? 0 : Math.max(0, 1 - a/.35)*14;
    rFace.style.transform = `translate(${(Math.sin(w*55)*sh).toFixed(1)}px,${(Math.cos(w*47)*sh).toFixed(1)}px) rotate(${(r.mood === 'squint' ? -3 : 2) + (rm ? 0 : Math.sin(w*3)*1.2)}deg) scale(${punch.toFixed(3)})`;
    const m = r.mood === 'shock' ? 1 + Math.abs(Math.sin(w*9))*.16 : 1 + Math.abs(Math.sin(w*6))*.1;
    rMouth.setAttribute('transform', `translate(800 735) scale(1 ${m.toFixed(3)}) translate(-800 -735)`);
    const cq = Math.min(1, Math.max(0, (a - .12)/.28));
    rCap.style.opacity = cq > 0 ? 1 : 0;
    rCap.style.transform = `rotate(-4deg) scale(${(rm ? 1 : easeBack(cq)).toFixed(3)})`;
    const out = r.d - a;
    reactEl.style.opacity = out < .1 ? Math.max(0, out/.1).toFixed(2) : 1;
    if (a < .12) cutflash.style.opacity = ((1 - a/.12)*.85).toFixed(2);
  }
  function renderAll(e, w){
    cutT = toCut(e);
    renderCut(cutT, w);
    renderReact(e, w);
    tcOut.textContent = fmtT(e) + ' / ' + fmtT(EDIT_D);
    if (document.activeElement !== scrub) scrub.value = e.toFixed(2);
  }

  // ---------- Playback ----------''')
i = s.index("  function cutLoop(){"); j = s.index("  function cutPlay(p){")
s = s[:i] + r'''  function cutLoop(){
    const w = performance.now()/1000, dt = Math.min(.1, w - lastW); lastW = w;
    if (cutPlaying){
      let adv = dt;
      if (!reactAt(editT) && voiceOn && speaking && spokenIdx >= 0){
        const nx = CUT_CUES[spokenIdx + 1], lim = nx ? nx.t - .05 : CUT_D;
        if (toCut(editT + adv) >= lim && !reactAt(editT + adv) && holdAcc < 1.4){ adv = 0; holdAcc += dt; }
      }
      const prevE = editT;
      editT = Math.min(EDIT_D, editT + adv);
      cutT = toCut(editT);
      if (voiceOn && !reactAt(editT)){ const i = cueIdx(cutT); if (i >= 0 && i !== spokenIdx && cutT - CUT_CUES[i].t < .6){ holdAcc = 0; say(CUT_CUES[i].s, i); } }
      REACTS.forEach(r => { const s0 = reactStart(r); if (prevE < s0 && editT >= s0){ sfx('pop'); sfx('thump'); } });
      EV.forEach(ev => { const ec = toEdit(ev.c); if (prevE < ec && editT >= ec) sfx(ev.kind); });
      if (editT >= EDIT_D){ cutPlaying = false; playBtn.textContent = 'Replay'; }
    }
    if (!window.__freeze) renderAll(editT, w);
    requestAnimationFrame(cutLoop);
  }
  function cutSeek(e){ stopVoice(); editT = Math.max(0, Math.min(EDIT_D, e)); cutT = toCut(editT); cutPrev = cutT; spokenIdx = cueIdx(cutT - .6); holdAcc = 0; renderAll(editT, performance.now()/1000); }
''' + s[j:]
i = s.index("  window.__cut = {"); j = s.index("\n", i)
s = s[:i] + r'''  window.__cut = {seek:cutSeek, play:cutPlay, render:(e, talk) => { editT = e; cutT = toCut(e); cutPrev = cutT; if (talk != null){ voiceOn = true; speaking = !!talk; } renderAll(e, e); }, dur:EDIT_D,
    timeline:() => ({dur:EDIT_D, cues:CUT_CUES.map(q => ({t:toEdit(q.t), s:q.s})), reacts:REACTS.map(r => ({t:reactStart(r), d:r.d, en:r.en})), ev:EV.map(ev => ({c:toEdit(ev.c), kind:ev.kind})).concat(REACTS.map(r => ({c:reactStart(r), kind:'thump'})))}),
    events:() => EV.map(ev => ({c:toEdit(ev.c), kind:ev.kind}))};''' + s[j:]
R("    if (cutT >= CUT_D){ cutSeek(0); cutPlay(true); return; }", "    if (editT >= EDIT_D){ cutSeek(0); cutPlay(true); return; }")
R("  scrub.max = CUT_D.toFixed(2);", "  scrub.max = EDIT_D.toFixed(2);")
open(fn, 'w').write(s)
print('patched', fn)
