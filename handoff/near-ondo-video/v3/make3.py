import json, subprocess, sys, os, wave, struct, pickle
name, out = sys.argv[1], sys.argv[2]
os.chdir(os.path.dirname(os.path.abspath(__file__)))
FF = __import__('imageio_ffmpeg').get_ffmpeg_exe()
NODE = dict(os.environ, NODE_PATH=subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
subprocess.run(['node', '-e', f"""
const {{ chromium }} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + process.cwd() + '/rec_{name}.html'); await p.waitForTimeout(600);
require('fs').writeFileSync('tl_{name}.json', JSON.stringify(await p.evaluate(() => window.__v.timeline()))); await b.close(); }})();"""], check=True, env=NODE)
T = json.load(open(f'tl_{name}.json'))
voice = []
for i, c in enumerate(T['cues']):
    fn = f'tts_{name}/c{i}.wav'
    w = wave.open(fn); d = w.getnframes()/w.getframerate(); w.close()
    voice.append({'t':c['t'], 'dur':d, 'fn':fn})
json.dump([{'t':v['t'], 'dur':v['dur']} for v in voice], open(f'voice_{name}.json', 'w'))
_, S = pickle.load(open('../audio/mix.pkl', 'rb'))
SR = 44100; end = T['dur']; N = int(SR*end); buf = [0.0]*N
def add(smp, t, g=1.0):
    i0 = int(t*SR)
    for k, x in enumerate(smp):
        j = i0 + k
        if 0 <= j < N: buf[j] += x*g
def readwav(p):
    w = wave.open(p); sr = w.getframerate(); n = w.getnframes(); d = w.readframes(n); w.close()
    x = [v/32768 for v in struct.unpack('<%dh' % n, d)]
    if sr != SR:  # linear resample
        r = sr/SR; x = [x[min(len(x) - 1, int(i*r))] for i in range(int(len(x)/r))]
    return x
for v in voice: add(readwav(v['fn']), v['t'], .95)
gain = {'pop':.55, 'thump':.9, 'whoosh':.9, 'flash':.8}
for e in T['ev']: add(S[e['kind']], e['c'], gain.get(e['kind'], .8))
peak = max(abs(x) for x in buf); g = .92/peak if peak > .92 else 1
w = wave.open(f'mix_{name}.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x*g))*32767)) for x in buf)); w.close()
frames = int(end*30); fd = f'fr_{name}'; os.makedirs(fd, exist_ok=True)
for f in os.listdir(fd): os.remove(os.path.join(fd, f))
open('rec3.js', 'w').write(r"""
const { chromium } = require('playwright');
const V = JSON.parse(require('fs').readFileSync(process.env.VJSON));
(async () => {
  const [from, to] = [Number(process.argv[2]), Number(process.argv[3])];
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{ width:1280, height:720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/' + process.env.REC); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__freeze = true; });
  for (let k = from; k < to; k++){
    const t = k/30, talk = V.some(v => t >= v.t && t <= v.t + v.dur);
    await p.evaluate(([t, talk]) => window.__v.render(t, talk), [t, talk]);
    await p.screenshot({ path:process.env.OUT + '/f' + String(k).padStart(5, '0') + '.jpg', type:'jpeg', quality:88, clip:{x:0, y:0, width:1280, height:720} });
  }
  console.log('done', from, to, JSON.stringify(errs)); await b.close();
})();
""")
env = dict(NODE, REC=f'rec_{name}.html', VJSON=f'voice_{name}.json', OUT=fd)
W = 4
parts = [(k*frames//W, (k + 1)*frames//W) for k in range(W)]
procs = [subprocess.Popen(['node', 'rec3.js', str(a), str(b)], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) for a, b in parts]
for p in procs: print(p.communicate()[0].decode().strip())
subprocess.run([FF, '-y', '-loglevel', 'error', '-framerate', '30', '-i', f'{fd}/f%05d.jpg', '-i', f'mix_{name}.wav', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], check=True)
print('video', out, round(end, 1), 's', frames, 'frames')
