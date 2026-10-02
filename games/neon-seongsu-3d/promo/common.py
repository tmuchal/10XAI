"""Shared paths, script lines and helpers for the NEON SEONGSU: DEAD RAIN trailer pipeline."""
import json
import os
import subprocess
import urllib.request

PROMO = os.path.dirname(os.path.abspath(__file__))
GAME_SRC = os.path.dirname(PROMO)                       # live game (never edited, only copied)
BUILD = os.path.join(PROMO, 'build')
SNAP = os.path.join(BUILD, 'game')                      # frozen snapshot that is captured
OUT = os.path.join(PROMO, 'out')
ASSETS = os.path.join(PROMO, 'assets')
FONTS = os.path.join(ASSETS, 'fonts')
OLD_PROMO = os.path.join(os.path.dirname(GAME_SRC), 'neon-seongsu', 'promo')
OLD_MODELS = os.path.join(OLD_PROMO, 'build', 'models')
OLD_FONTS = os.path.join(OLD_PROMO, 'assets', 'fonts')
MODELS = os.path.join(BUILD, 'models')
TIMELINE = os.path.join(BUILD, 'timeline.json')

W, H, FPS = 1920, 1080, 30

TOXIC = (125, 255, 155)   # #7dff9b
MAG = (255, 46, 136)      # #ff2e88
CYAN = (41, 231, 255)
AMBER = (255, 179, 71)
LINE2 = (0, 168, 77)
BLOOD = (220, 24, 48)
NIGHT = (7, 8, 13)
INK = (236, 233, 255)

# BIBLE.md section 7 (exact lines). `tts` respells Korean names for the English voice; `parts` are spoken
# separately with `part_gap` seconds between them (the subtitle still shows the full line).
LINES = [
    dict(en="Seongsu-dong. Quarantine Zone Seven.", ko="성수동. 격리구역 7.",
         parts=["Sung-soo dong.", "Quarantine Zone Seven."], part_gap=0.7),
    dict(en="OMNI promised a calmer city. Their drones rained spores instead.",
         ko="OMNI는 더 평온한 도시를 약속했다. 그들의 드론은 대신 포자를 뿌렸다.",
         parts=["Omni promised a calmer city.", "Their drones rained spores instead."], part_gap=0.55),
    dict(en="Now the infected follow the neon, and the raiders own the streets.",
         ko="이제 감염체는 네온을 따라 움직이고, 거리는 레이더들의 것이 됐다.",
         parts=["Now the infected follow the neon,", "and the raiders own the streets."], part_gap=0.45),
    dict(en="Han Seo-jin came back for one reason: to switch it all off.",
         ko="한서진이 돌아온 이유는 하나. 이 모든 걸 꺼버리기 위해서.",
         parts=["Hahn Suh-jin came back for one reason:", "to switch it all off."], part_gap=0.45),
    dict(en="Take contracts from the last fixer in Seongsu.", ko="성수의 마지막 해결사에게 의뢰를 받아라.",
         tts="Take contracts from the last fixer in Sung-soo."),
    dict(en="Hotwire anything with wheels.", ko="바퀴 달린 건 뭐든 훔쳐라."),
    dict(en="Build your shelter in a red-brick warehouse, and hold it when the Blood Rain comes.",
         ko="붉은 벽돌 창고에 쉘터를 짓고, 블러드 레인이 오면 버텨라.",
         parts=["Build your shelter in a red-brick warehouse,", "and hold it when the Blood Rain comes."],
         part_gap=0.5),
    dict(en="Under the Line 2 viaduct, through Seoul Forest, all the way to OMNI Tower.",
         ko="2호선 고가 아래로, 서울숲을 지나, OMNI 타워까지.",
         parts=["Under the Line Two viaduct,", "through Seoul Forest,", "all the way to Omni Tower."],
         part_gap=0.35),
    dict(en="Neon Seongsu: Dead Rain. Play it free in your browser.",
         ko="네온 성수: 데드 레인. 브라우저에서 무료로 플레이하세요.",
         parts=["Neon Sung-soo. Dead Rain.", "Play it free, in your browser."], part_gap=0.6),
]

# Seconds of silence BEFORE each line (index = line - 1). Line 1 waits for the opening logo card.
GAP_BEFORE = [7.6, 2.2, 3.4, 2.2, 4.4, 1.6, 1.8, 4.0, 4.2]
TAIL = 6.4

MODEL_URLS = {
    'kokoro-v1.0.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
}
FONT_URLS = {
    'BlackHanSans-Regular.ttf': 'blackhansans/BlackHanSans-Regular.ttf',
    'IBMPlexSansKR-SemiBold.ttf': 'ibmplexsanskr/IBMPlexSansKR-SemiBold.ttf',
    'IBMPlexSansKR-Regular.ttf': 'ibmplexsanskr/IBMPlexSansKR-Regular.ttf',
    'IBMPlexSans-Var.ttf': 'ibmplexsans/IBMPlexSans%5Bwdth%2Cwght%5D.ttf',
    'IBMPlexMono-Medium.ttf': 'ibmplexmono/IBMPlexMono-Medium.ttf',
    'IBMPlexMono-SemiBold.ttf': 'ibmplexmono/IBMPlexMono-SemiBold.ttf',
}


def font(name):
    return os.path.join(FONTS, name)


def fetch(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print('download', url)
    urllib.request.urlretrieve(url, dest + '.part')
    os.replace(dest + '.part', dest)
    return dest


def _reuse_or_fetch(name, old_dir, new_dir, url):
    dest = os.path.join(new_dir, name)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return dest
    old = os.path.join(old_dir, name)
    if os.path.exists(old) and os.path.getsize(old) > 0:
        os.makedirs(new_dir, exist_ok=True)
        try:
            os.link(old, dest)          # hard link: no extra disk, no download
        except OSError:
            import shutil
            shutil.copy(old, dest)
        return dest
    return fetch(url, dest)


def ensure_fonts():
    for name, rel in FONT_URLS.items():
        _reuse_or_fetch(name, OLD_FONTS, FONTS, 'https://raw.githubusercontent.com/google/fonts/main/ofl/' + rel)


def ensure_models():
    for name, url in MODEL_URLS.items():
        _reuse_or_fetch(name, OLD_MODELS, MODELS, url)


def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd, **kw):
    print('+', ' '.join(str(c) for c in cmd)[:300])
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def load_timeline():
    with open(TIMELINE) as f:
        return json.load(f)
