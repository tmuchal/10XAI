import json, re, subprocess, sys, os, html
os.chdir(os.path.dirname(os.path.abspath(__file__)))
FF = __import__('imageio_ffmpeg').get_ffmpeg_exe()
def speakable(s):
    s = s.replace('NEAR at 3.33', 'near at three thirty-three')
    s = re.sub(r'\$(\d+)\.(\d\d)\b', lambda m: f"{m[1]} dollars {m[2]}", s)
    s = re.sub(r'\$(\d[\d,.]*)\s*(million|billion|trillion)', r'\1 \2 dollars', s)
    s = re.sub(r'\$(\d[\d,]*)', r'\1 dollars', s)
    for a, b in [('TVL', 'T V L'), ('MOU', 'M O U'), ('ETFs', 'E T Fs'), ('ETF', 'E T F'), ('TPS', 'T P S'), (' AI ', ' A I '), ('AI agent', 'A I agent'), ('RWA', 'R W A'), ('USDY', 'U S D Y'), ('OUSG', 'O U S G'), ('BUIDL', 'build'), ('DeFi', 'dee fi'), ('ONDO', 'ondo'), ('NEAR', 'near'), ('24/7', 'twenty four seven'), ('non-US', 'non U S'), (' US ', ' U S '), ('%', ' percent')]:
        s = s.replace(a, b)
    return s
def tts_dur(text, fn):
    subprocess.run(['espeak-ng', '-v', 'en-us+m3', '-s', '188', '-p', '55', '-w', fn, speakable(text)], check=True)
    info = subprocess.run([FF, '-i', fn], capture_output=True, text=True).stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info)
    return int(m[1])*3600 + int(m[2])*60 + float(m[3])
def build(name, preview=False):
    data = json.load(open(f'{name}.json'))
    os.makedirs(f'tts_{name}', exist_ok=True)
    for i, c in enumerate(data['cues']):
        c['dur'] = round(tts_dur(c['en'], f'tts_{name}/c{i}.wav'), 2)
    json.dump(data, open(f'{name}.timed.json', 'w'), ensure_ascii=False)
    meta = json.load(open(f'{name}.meta.json'))
    fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Gaegu:wght@400;700&family=Jua&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,800&family=IBM+Plex+Mono:wght@400;500&display=swap">'
    extra_css = '''
  #camera > *{ position:absolute; inset:0; }
  #kpops, #reactHost{ pointer-events:none; }
  #fx{ width:100%; height:100%; }
  svg.layer{ position:absolute; inset:0; }
'''
    page = f'''<title>{html.escape(meta['title'])}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{fonts}
<style>
{open('style3.css').read()}{extra_css}
</style>
<main class="wrap">
  <header class="intro">
    <span class="eyebrow">{meta['eyebrow']}</span>
    <h1>{meta['h1']}</h1>
    <p class="dek">{meta['dek']}</p>
  </header>
  <section class="player" aria-label="Video">
    <div class="stage3" id="stage3">
      <div id="camera">
        <svg class="layer" id="bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"></svg>
        <div id="chars"></div>
        <div id="panels"></div>
        <div id="bubbles"></div>
        <canvas id="fx" width="1280" height="720"></canvas>
      </div>
      <svg class="layer" id="frame" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"></svg>
      <div class="ccard" id="ccard"><div class="n" id="ccN"></div><div class="t" id="ccT"></div></div>
      <div class="srcchip" id="srcchip"></div>
      <div class="csign" id="csign"><div class="n" id="csN"></div><div class="t" id="csT"></div><div class="e" id="csE"></div></div>
      <div id="kpops"></div>
      <div id="reactHost"></div>
      <div class="cutflash" id="cutflash"></div>
      <div class="subs" id="subs" aria-live="polite"><div class="in"><span class="en" id="subEn"></span><span class="ko" id="subKo"></span></div></div>
      <div class="startov" id="startOv"><div class="startCard"><button class="bigplay" id="startVoice" type="button">▶ 음성과 함께 재생 · Play with voice</button><button class="quiet" id="startSilent" type="button">무음으로 재생 · Play silently</button></div></div>
    </div>
    <div class="controls">
      <button class="btn" id="playBtn" type="button">Play</button>
      <button class="btn ghost" id="restartBtn" type="button">Restart</button>
      <button class="btn ghost" id="voiceBtn" type="button" aria-pressed="false">Voice off</button>
      <span class="tc" id="tcOut">0:00</span>
      <input id="scrub" type="range" min="0" max="180" step="0.02" value="0" aria-label="Seek">
    </div>
    <div class="chips" id="chips" role="group" aria-label="Jump to chapter"></div>
  </section>
{open(f'{name}.sections.html').read()}
</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
{open('reaction.js').read()}
window.VIDEO = {json.dumps({'chapters':data['chapters'], 'cues':data['cues']}, ensure_ascii=False)};
</script>
<script>
{open(f'{name}.js').read()}
</script>
<script>
{open('engine3.js').read()}
</script>
'''
    open(f'{name}.html', 'w').write(page)
    loc = page.replace('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', '../three128/dist/gsap.min.js')
    loc = loc.replace(fonts, ''.join(f'<link rel="stylesheet" href="../fonts/{f}">' for f in ['jua/400.css', 'gochi-hand/400.css', 'gaegu/400.css', 'gaegu/700.css', 'nunito-sans/400.css', 'nunito-sans/600.css', 'nunito-sans/800.css', 'ibm-plex-mono/400.css', 'ibm-plex-mono/500.css']))
    open(f'p_{name}.html', 'w').write('<meta charset="utf-8">\n' + loc)
    rec = loc.replace('</style>', '''  html,body{ overflow:hidden !important; }
  .stage3{ position:fixed !important; left:0; top:0; width:1280px !important; height:720px !important; z-index:9999; }
  #startOv{ display:none !important; }
</style>''', 1)
    open(f'rec_{name}.html', 'w').write('<meta charset="utf-8">\n' + rec)
    tot = sum(max(2.4 if c.get('card') else 2.2, c['dur'] + .3) + c.get('extra', 0) for c in data['cues']) + 1.7
    print(name, 'built · est. length', round(tot, 1), 's ·', len(data['cues']), 'cues')
if __name__ == '__main__':
    for n in sys.argv[1:]: build(n)
