# tools

## Narration, captions and music (`build-narration.py`)

Builds the spoken English voice-over, the bilingual caption track, and the music bed for the film. Everything runs offline. The film length, chapter boundaries and curtain timing come from `film/timeline.js` (read through `tools/timeline.py`), never from constants in the scripts.

| Input | Output |
|---|---|
| `tools/narration.json`: the cues (`ch` + `at` beat anchor: seconds after that chapter's film start, `en` spoken text, `ko` subtitle, optional `say` pronunciation override, optional per-cue `speed` of 1.1 or less) | `audio/narration.wav` (voice only, 48 kHz mono) · `audio/music.wav` (synthesized bed, 48 kHz stereo) · `audio/mix.wav` (voice + ducked music, 48 kHz stereo, exactly the timeline's length) · `film/captions.js` (`window.CAPTIONS`) |

TTS engine: **Kokoro-82M** (q8 ONNX, voice `af_heart`) through the `kokoro-onnx` Python package. The model weights come from the npm package `kokoro-q8-shards`, and the voice styles come from `kokoro-js` (`voices/*.bin`). You need npm and PyPI access. Hugging Face and GitHub are not used.

```bash
cd docs/videos/higgsfield-brand-page
python3 -m venv /tmp/tts/venv
/tmp/tts/venv/bin/pip install kokoro-onnx soundfile numpy scipy
/tmp/tts/venv/bin/python tools/build-narration.py --setup   # once: npm pack + join shards (sha256 checked) + voice pack
/tmp/tts/venv/bin/python tools/build-narration.py --check   # timing report only
/tmp/tts/venv/bin/python tools/build-narration.py           # write audio/*.wav + film/captions.js
```

- The build caches synthesized lines in `$KOKORO_CACHE/lines` (default `/tmp/kokoro-cache`). A full build without the cache takes about 5 minutes on CPU. After that, only edited lines are synthesized again.
- Layout: each line starts at its anchor, or 0.3 s after the previous line ends, whichever is later. The guard uses the same curtain constants as `film/boot.js` (`TIMELINE.curtain`): a curtain starts closing at `boundary − closeLead` (0.75 s) and the final one at `total − endClose` (1.3 s). The build fails (`OVER`) if the speech runs into a closing curtain, and warns (`TAIL`) if only the 0.3 s caption tail does (that caption fades out with the curtain). It also warns if a line starts more than 1.2 s after its anchor. Shorten the text rather than speeding it up.
- Captions run from speech start to speech end + 0.3 s and never overlap. Keep `en` at 80 characters or fewer and `ko` at about 40 or fewer.
- Levels: speech is normalized to about −19 dBFS RMS. The music sits 18 dB below it (`--music-db`) and ducks another 5 dB under speech (`--duck-db`). The music is D-major I–V–vi–IV at 96 bpm: marimba arpeggio, plucked strums, pad, soft bass and shaker. It adds a swell, a whoosh and a chime at each chapter change, plus an opening curtain swell and whoosh at 0–1.2 s.

## Sound effects and the final mix (`build-sfx.py`)

Adds a synthesized sound-effects layer on top of `audio/mix.wav` and writes the deliverable soundtrack. Run it after `build-narration.py`. It needs only numpy, scipy and soundfile, and it runs offline. Every sound is generated in code with fixed seeds, so rebuilds are bit-identical.

| Input | Output |
|---|---|
| `tools/sfx-cues.json` (the cue sheet) · `audio/mix.wav` · `audio/narration.wav` (drives the ducking) · `film/captions.js` (finds the key spoken numbers) | `audio/sfx.wav` (the SFX bus alone, at its level in the final mix, 48 kHz stereo) · `audio/final.wav` (mix + SFX, −16 LUFS integrated, true peak ≤ −1 dBTP, 48 kHz stereo, exactly the timeline's length) |

```bash
cd docs/videos/higgsfield-brand-page
/tmp/tts/venv/bin/python tools/build-sfx.py            # about 1 minute; prints loudness, protections and the 20 loudest cues
/tmp/tts/venv/bin/python tools/build-sfx.py --report   # print the report only, write nothing
```

Options: `--sfx-lufs` (SFX bus loudness, default −22), `--target-lufs` (default −16), `--tp` (default −1 dBTP), `--sfx-peak` (SFX bus ceiling, default −4 dBFS), `--duck-db` (default −6), `--protect-db` (default −6).

- **Cue sheet.** Each cue is `{ch, at, type, gain?, pan?, …}`: `at` is seconds after chapter `ch` starts on the film clock (`film/timeline.js`), so the cues of a chapter move with it when the film is re-timed. Curtain lead-ins sit at a negative `at` on the chapter they open (a cue in the last second before a boundary belongs to the next chapter). A plain `t` in film seconds still works for one-off tests. Impacts (pop, stamp, ding, and so on) put their transient at the resolved time. Sweeps (whoosh, curtain, swipe) start there. `gain` is in dB, where 0 is a headline hit, −6 to −9 is normal and −10 to −15 is background. `pan` runs from −1 (left) to 1 (right). Per-type options include `dur`, `pitch` (semitones), `n`, `step`, `rate`, `dir`, `kind`, `short`, `big` and `soft`. `note` records what happens on screen at that moment. The `shakeCam`/`.fire` calls in the chapters mark the authored impacts (chapter-local time = authored time − the chapter's `authoredAt`). `tools/anchor-cues.py` did the one-time conversion from absolute `t`/`at` and asserts that every anchor resolves to the old time exactly.
- **Types (32).** Transitions: `whoosh`, `curtain`, `swipe`, `scribble`. Impacts: `stamp`, `thud`, `clunk`, `clack`, `bonk`, `button`. Cartoon: `pop`, `pop_run`, `boing`, `whistle`, `gulp`, `horn`, `rocket`, `shaker`. Money and bells: `coin`, `ding`, `kaching`, `sparkle`. Counters: `ticks`, `wheel` (one peg per 22.5° of the ease-out-cubic spin), `drumroll`, `keys`, `flash`, `shutter`. Crowd: `confetti`, `crowd` (`ooh` or `aww`, formant-filtered voices), `applause`, and `osting`, Uchu's short brass "O!" stab. Pitched sounds are tuned to D major to match the music.
- **Mixing.** Each type has a base level (`LEVEL`) calibrated from its measured momentary loudness and capped by peak. The bus gets a small room reverb and ducks 6 dB whenever the narrator is speaking. It is normalized to `--sfx-lufs` and peak-limited. The final mix is `mix.wav` plus the bus, normalized to −16 LUFS with a 4×-oversampled look-ahead true-peak limiter (typically under 2 dB of gain reduction).
- **Key numbers.** The build estimates when each key number is spoken ("fifty milliseconds", "53%", "85%", "270%", "91%", "72%", "2.7/4.5 million", and so on) from the caption text. A cue that stays loud for more than 0.35 s over one of these gets an extra `--protect-db` cut. Short hits synced to a number are kept. The report lists both kinds.
