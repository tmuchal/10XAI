import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s=open('near-case.html').read()
def R(a,b):
    global s
    assert s.count(a)==1,a[:60]; s=s.replace(a,b)
def cut(a,b,new,incl_b=False):
    global s
    i=s.index(a); j=s.index(b)+(len(b) if incl_b else 0); s=s[:i]+new+s[j:]
R("  const D = 101;","  const D = 31;")
cut("  const SC = [","  const KEY = ","  const SC = [\n    {t:0, chip:'MOU?'}, {t:4.5, chip:'Launch'}, {t:10, chip:'How'}, {t:16, chip:'Roles'}, {t:21, chip:'Who'}, {t:24.5, chip:'Market'}, {t:28, chip:'Verdict'}\n  ];\n")
cut("  const KEY = ","  const KO = ","  const KEY = [3.9, 9.4, 15.6, 20.6, 24.2, 27.6, 30.6];\n")
i=s.index("  const KO = "); t="].map(([t, s], i) => ({t, s, ko:KO[i]}));"; j=s.index(t)+len(t)
s=s[:i]+'''  const KO = ["온도와 블랙록이 MOU를 맺었다? 정확히는 아닙니다."];
  const CUES = [[0.2, "Ondo and BlackRock signed an MOU? Not quite."]].map(([t, s], i) => ({t, s, ko:KO[i]}));'''+s[j:]
cut("  // ---------- Shot 1: cold open ----------","  // ---------- Curtains, scene switching, acting ----------", open('ondo_scenes.js').read())
cut("  // ---------- Curtains, scene switching, acting ----------","  tl.to({}, {duration:.01}, D - .01);", open('ondo_acting.js').read(), incl_b=True)
i=s.index("    const BURSTS = ["); j=s.index("];", i)+2
s=s[:i]+'''    const BURSTS = [
      {t:3.35, sx:800, sy:350, n:50}, {t:5.9, sx:920, sy:520, n:90}, {t:12.7, sx:1150, sy:450, n:70},
      {t:25.4, sx:1200, sy:500, n:70}, {t:28.8, sx:800, sy:420, n:110}
    ]'''+s[j:]
R("    const COINS = [{t:4.05, sx:690, sy:330, n:26, mode:'burst'}, {t:23.8, n:64, mode:'rain'}, {t:97.2, sx:800, sy:420, n:34, mode:'burst'}];",
  "    const COINS = [{t:5.8, sx:920, sy:520, n:30, mode:'burst'}, {t:25.2, n:56, mode:'rain'}];")
R("    const DROPS = {t:83.0, n:90};","    const DROPS = {t:999, n:1};")

# --- worlds: per-chapter backgrounds ---
R("  // ---------- Curtains, scene switching, acting ----------", open('bg.js').read() + "  // ---------- Curtains, scene switching, acting ----------")
R("  tl.to({}, {duration:.01}, D - .01);", "  wireWorlds(['boardroom','showroom','market','split','airport','exchange','court']);\n  tl.to({}, {duration:.01}, D - .01);")
R("rays.setAttribute('transform', `rotate(${(w*2.5)%360} 800 330)`);", "rays.setAttribute('transform', `rotate(${(w*2.5)%360} 800 330)`);\n    (window.__AMB || []).forEach(f => f(t, w));")
open('ondo-base.html','w').write(s)
print('base ok')
