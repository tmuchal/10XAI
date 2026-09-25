# tools

## Narration, captions and music (`build-narration.py`)

Builds the spoken English voice-over, the bilingual caption track, and the music bed for the 192-second film. Everything runs offline.

| Input | Output |
|---|---|
| `tools/narration.json`: the cues (`at` beat anchor, `en` spoken text, `ko` subtitle, optional `say` pronunciation override, optional per-cue `speed` of 1.1 or less) | `audio/narration.wav` (voice only, 48 kHz mono) · `audio/music.wav` (synthesized bed, 48 kHz stereo) · `audio/mix.wav` (voice + ducked music, 48 kHz stereo, exactly 192.0 s) · `film/captions.js` (`window.CAPTIONS`) |

TTS engine: **Kokoro-82M** (q8 ONNX, voice `af_heart`) through the `kokoro-onnx` Python package. The model weights come from the npm package `kokoro-q8-shards`, and the voice styles come from `kokoro-js` (`voices/*.bin`). You need npm and PyPI access. Hugging Face and GitHub are not used.

```bash
cd docs/videos/higgsfield-brand-page
python3 -m venv /tmp/kokoro-venv
/tmp/kokoro-venv/bin/pip install kokoro-onnx soundfile numpy scipy
/tmp/kokoro-venv/bin/python tools/build-narration.py --setup   # once: npm pack + join shards (sha256 checked) + voice pack
/tmp/kokoro-venv/bin/python tools/build-narration.py --check   # timing report only
/tmp/kokoro-venv/bin/python tools/build-narration.py           # write audio/*.wav + film/captions.js
```

- The build caches synthesized lines in `$KOKORO_CACHE/lines` (default `/tmp/kokoro-cache`). A full build without the cache takes about 5 minutes on CPU. After that, only edited lines are synthesized again.
- Layout: each line starts at its `at` anchor, or 0.3 s after the previous line ends, whichever is later. The build fails if a line (plus a 0.3 s caption tail) runs into a chapter curtain (`boundary − 0.6 s`). It also warns if a line starts more than 1.2 s after its anchor. Shorten the text rather than speeding it up.
- Captions run from speech start to speech end + 0.3 s and never overlap. Keep `en` at 80 characters or fewer and `ko` at about 40 or fewer.
- Levels: speech is normalized to about −19 dBFS RMS. The music sits 18 dB below it (`--music-db`) and ducks another 5 dB under speech (`--duck-db`). The music is D-major I–V–vi–IV at 96 bpm: marimba arpeggio, plucked strums, pad, soft bass and shaker. It adds a swell, a whoosh and a chime at each chapter change, plus an opening curtain swell and whoosh at 0–1.2 s.
