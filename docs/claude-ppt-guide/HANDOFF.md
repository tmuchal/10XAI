# Handoff — Claude PPT guide videos

Branch: `claude/claude-powerpoint-creation-u4hfq3` (everything committed and pushed).
Web player (private, owner can share): https://claude.ai/artifact/4QyKXTuvTYvSm9fcwe8FJM

## Deliverables (this folder)

| File | What it is |
|---|---|
| `claude-ppt-guide.mp4` | Main guide, theater style, 2:58, 1080p, Korean captions. Cast: 우추 (lead), 노아 (guide hamster), 햄 부장, hamster audience |
| `q3-briefing-uchu.mp4` | 30 s Q3 briefing (v2), Blender 3D + motion graphics, English VO, KO/EN subs |
| `q3-briefing-uchu-v1.mp4` | v1 of the briefing, kept for comparison |
| `sample-company-deck.pptx` | 9-slide exec deck shown as the "finished deck" (sample data, native charts) |
| `README.md` | Guide text: before/after table, tools (PowerPoint add-in, Excel link, Claude Design, Higgsfield) with sources, steps, prompt template, scene timeline |

## Sources and how to rebuild

- `src/` — guide video. `video.html` holds all scenes (`data-dur`, `text/x-cap` captions, `text/x-act` character events, `BLOCK` positions, camera in `camera()`), rendered frame by frame by `render-video.cjs`. Assets: `make-backdrop.py`, `make-music.py` (length = total seconds, now 178), `product3d.py` (Blender stand-in product renders), `build-deck.cjs` (the .pptx). Build steps are in README "다시 만들기". Needs `npm install` in `src/`, Blender 4.0, LibreOffice.
- `v3/` — 30 s briefing. `scene3d.py` (Blender Eevee shots: hero, chart, road, sprite), `briefing.html` (compositor), `voiceover.py` (Kokoro TTS, model files from the kokoro-onnx GitHub release), `audio.py`, `prep.py`, `render-v3.cjs`.
- Render time on a 4-core container: guide ≈ 30–40 min; Blender plates for the briefing ≈ 1 h (rendered on twos).

## Open items

1. **Higgsfield is not connected.** The Higgsfield scene (1:46) uses Blender stand-in product images, labeled "예시" on screen. To swap in real output, either:
   - add the Higgsfield MCP connector (`https://mcp.higgsfield.ai`) in claude.ai and enable it for the session (recommended), or
   - allow `higgsfield.ai` and `*.higgsfield.ai` in the environment's network settings and provide CLI credentials through an environment variable (browser login cannot complete inside the cloud container because the OAuth callback goes to the container's `localhost:8765`).
   Already done in the old container only (not persisted in the repo): `npm i -g @higgsfield/cli` (1.1.26) and `npx skills add higgsfield-ai/skills -g -y -a claude-code`. Repeat both in a new environment.
2. Replace `src/product/*.png` / `spin_*.png` (generated at build time, not committed) with Higgsfield images/video, then re-render the guide.
3. Optional: add the "누리 텀블러" product slide (from the Higgsfield scene) to `sample-company-deck.pptx` as slide 10.
4. `claude-ppt-guide.mp4` is 51 MB (GitHub warns above 50 MB). Consider Git LFS if it grows.

All figures in the videos and deck are sample data.
