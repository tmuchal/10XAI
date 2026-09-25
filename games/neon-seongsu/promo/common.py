"""Shared paths, script lines and helpers for the NEON SEONGSU promo pipeline."""
import json
import os
import subprocess
import urllib.request

PROMO = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(PROMO)
BUILD = os.path.join(PROMO, 'build')
OUT = os.path.join(PROMO, 'out')
ASSETS = os.path.join(PROMO, 'assets')
FONTS = os.path.join(ASSETS, 'fonts')
MODELS = os.path.join(BUILD, 'models')
TIMELINE = os.path.join(BUILD, 'timeline.json')

W, H, FPS = 1920, 1080, 30

# Brand palette (from the game's CSS)
MAG = (255, 46, 136)
CYAN = (41, 231, 255)
AMBER = (255, 179, 71)
LINE2 = (0, 168, 77)
BRICK = (150, 58, 40)
NIGHT = (7, 8, 13)
INK = (236, 233, 255)
RED = (255, 77, 94)

# BIBLE.md section 5. `tts` is a respelling so the English voice says the Korean names right.
LINES = [
    dict(en="Seoul. Seongsu-dong.", ko="서울, 성수동.",
         tts="Seoul. Sung-soo dong."),
    dict(en="For fifty years, this neighborhood made the city's shoes, by hand, in red-brick workshops.",
         ko="오십 년 동안 이 동네는 붉은 벽돌 공방에서 서울의 구두를 손으로 만들었다."),
    dict(en="Then came the cafés. The pop-ups. The money.", ko="그리고 카페가, 팝업이, 돈이 몰려왔다.",
         parts=["Then came the cafés.", "The pop-ups.", "The money."], part_gap=0.5),
    dict(en="It's 2077. The rain never stops, and one company owns every street.",
         ko="2077년. 비는 그치지 않고, 모든 거리는 한 기업의 것이다.",
         parts=["It's twenty seventy-seven.", "The rain never stops, and one company owns every street."],
         part_gap=0.7),
    dict(en="OMNI Dynamics. Their drones see everything.", ko="OMNI 다이내믹스. 그들의 드론은 모든 것을 본다."),
    dict(en="Han Seo-jin built those drones. Now they're hunting her.",
         ko="한서진은 그 드론을 만든 사람이다. 이제 그 드론이 그녀를 쫓는다.",
         tts="Hahn Suh-jin built those drones. Now, they're hunting her."),
    dict(en="Kang Tae-o is the last shoemaker's son on the block, and the fastest driver on the river.",
         ko="강태오는 이 골목 마지막 구두장이의 아들이자, 강변에서 가장 빠른 드라이버다.",
         tts="Kahng Teh-oh is the last shoemaker's son on the block, and the fastest driver on the river."),
    dict(en="Two runners. One city. Switch between them anytime.",
         ko="두 명의 러너, 하나의 도시. 언제든 캐릭터를 전환하라.",
         parts=["Two runners.", "One city.", "Switch between them, anytime."], part_gap=0.35),
    dict(en="Steal any car. Outrun a five-star manhunt. Hack the city with a single pulse.",
         ko="어떤 차든 훔치고, 별 다섯 개 추격을 따돌리고, 펄스 한 번으로 도시를 해킹하라.",
         parts=["Steal any car.", "Outrun a five-star manhunt.", "Hack the city, with a single pulse."],
         part_gap=0.9),
    dict(en="Under the Line 2 viaduct, through Seoul Forest, all the way to the Han River.",
         ko="2호선 고가 아래로, 서울숲을 지나, 한강까지.",
         tts="Under the Line Two viaduct, through Seoul Forest, all the way to the Han River."),
    dict(en="Your phone keeps score. The whole neighborhood is watching.",
         ko="휴대폰 속 SNS에 모든 게 올라간다. 동네 전체가 지켜보고 있다."),
    dict(en="Tonight, they take back Seongsu.", ko="오늘 밤, 두 사람은 성수를 되찾는다.",
         parts=["Tonight,", "they take back Sung-soo."], part_gap=0.45),
    dict(en="Neon Seongsu. Play it free in your browser.", ko="네온 성수. 브라우저에서 무료로 플레이하세요.",
         parts=["Neon Sung-soo.", "Play it free, in your browser."], part_gap=0.6),
]

# Seconds of silence BEFORE each line (index = line number - 1). Bigger gaps at section changes.
GAP_BEFORE = [4.6, 2.2, 1.3, 2.4, 1.2, 2.0, 1.3, 3.6, 1.5, 1.6, 1.4, 1.6, 3.0]
TAIL = 5.0  # seconds after the last line

FONT_URLS = {
    'BlackHanSans-Regular.ttf': 'blackhansans/BlackHanSans-Regular.ttf',
    'IBMPlexSansKR-SemiBold.ttf': 'ibmplexsanskr/IBMPlexSansKR-SemiBold.ttf',
    'IBMPlexSansKR-Regular.ttf': 'ibmplexsanskr/IBMPlexSansKR-Regular.ttf',
    'IBMPlexMono-Medium.ttf': 'ibmplexmono/IBMPlexMono-Medium.ttf',
    'IBMPlexMono-SemiBold.ttf': 'ibmplexmono/IBMPlexMono-SemiBold.ttf',
}
MODEL_URLS = {
    'kokoro-v1.0.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
}


def font(name):
    return os.path.join(FONTS, name)


def fetch(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print('download', url)
    tmp = dest + '.part'
    urllib.request.urlretrieve(url, tmp)
    os.replace(tmp, dest)
    return dest


def ensure_fonts():
    for name, rel in FONT_URLS.items():
        fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/' + rel, font(name))


def ensure_models():
    for name, url in MODEL_URLS.items():
        fetch(url, os.path.join(MODELS, name))


def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd, **kw):
    print('+', ' '.join(str(c) for c in cmd)[:300])
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def load_timeline():
    with open(TIMELINE) as f:
        return json.load(f)
