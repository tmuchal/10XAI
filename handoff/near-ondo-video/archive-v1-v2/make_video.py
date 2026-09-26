# Usage: python3 make_video.py <name> <spoken-cues-json> <out.mp4>
import json, subprocess, re, sys, os, wave, struct, pickle
name, spoken_fn, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.chdir(os.path.dirname(os.path.abspath(__file__)))
FF = __import__('imageio_ffmpeg').get_ffmpeg_exe()
NODE = dict(os.environ, NODE_PATH=subprocess.run(['npm','root','-g'],capture_output=True,text=True).stdout.strip())
rec = f'rec_{name}.html'
subprocess.run(['node','-e',f"""
const {{ chromium }} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + process.cwd() + '/{rec}'); await p.waitForTimeout(600);
require('fs').writeFileSync('tl_{name}.json', JSON.stringify(await p.evaluate(() => window.__cut.timeline()))); await b.close(); }})();"""], check=True, env=NODE)
T = json.load(open(f'tl_{name}.json'))
spoken = json.load(open(spoken_fn))            # same order as cues: the text to feed espeak
ad = f'aud_{name}'; os.makedirs(ad, exist_ok=True)
def tts(txt, fn, maxdur):
    raw = fn + '.raw.wav'
    subprocess.run(['espeak-ng','-v','en-us+m3','-s','178','-p','55','-w',raw,txt], check=True)
    info = subprocess.run([FF,'-i',raw],capture_output=True,text=True).stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info); dur = int(m[1])*3600+int(m[2])*60+float(m[3])
    tempo = max(1.0, min(1.45, dur/maxdur)) if maxdur else 1.0
    subprocess.run([FF,'-y','-loglevel','error','-i',raw,'-af',f'atempo={tempo:.3f},aresample=44100','-ac','1',fn], check=True)
    return dur/tempo
voice = []
cues = T['cues']
for i, c in enumerate(cues):
    nxt = cues[i+1]['t'] if i+1 < len(cues) else None
    fn = f'{ad}/c{i}.wav'
    d = tts(spoken[i], fn, (nxt - c['t'] - .1) if nxt else None)
    voice.append({'t':c['t'], 'dur':d, 'fn':fn})
for j, r in enumerate(T['reacts']):
    busy = any(v['t'] <= r['t'] + .1 <= v['t'] + v['dur'] for v in voice)
    if busy: continue
    fn = f'{ad}/r{j}.wav'
    d = tts(r['en'].replace('?!', '!'), fn, r['d'] - .1)
    voice.append({'t':r['t'] + .08, 'dur':d, 'fn':fn})
end = max(T['dur'], max(v['t'] + v['dur'] for v in voice)) + .5
json.dump([{'t':v['t'], 'dur':v['dur']} for v in voice], open(f'{ad}/voice.json','w'))
_, S = pickle.load(open('audio/mix.pkl','rb'))
SR = 44100; N = int(SR*end); buf = [0.0]*N
def add(smp, t, g=1.0):
    i0 = int(t*SR)
    for k, x in enumerate(smp):
        j = i0 + k
        if 0 <= j < N: buf[j] += x*g
def readwav(p):
    w = wave.open(p); n = w.getnframes(); d = w.readframes(n); w.close(); return [x/32768 for x in struct.unpack('<%dh'%n, d)]
for v in voice: add(readwav(v['fn']), v['t'], .95)
gain = {'pop':.8, 'thump':1.0, 'whoosh':1.0, 'flash':.9}
for e in T['ev']: add(S[e['kind']], e['c'], gain[e['kind']])
peak = max(abs(x) for x in buf); g = .92/peak if peak > .92 else 1
w = wave.open(f'{ad}/mix.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x*g))*32767)) for x in buf)); w.close()
frames = int(end*30); fd = f'fr_{name}'; os.makedirs(fd, exist_ok=True)
for f in os.listdir(fd): os.remove(os.path.join(fd, f))
env = dict(NODE, REC=rec, VJSON=f'{ad}/voice.json', OUT=fd, CMAX=str(T['dur']))
parts = [(k*frames//3, (k+1)*frames//3) for k in range(3)]
procs = [subprocess.Popen(['node','rec.js',str(a),str(b)], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) for a, b in parts]
for p in procs: print(p.communicate()[0].decode().strip())
subprocess.run([FF,'-y','-loglevel','error','-framerate','30','-i',f'{fd}/f%04d.jpg','-i',f'{ad}/mix.wav','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',out], check=True)
print('video', out, round(end, 2), 's', frames, 'frames')
