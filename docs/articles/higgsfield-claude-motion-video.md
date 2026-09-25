# Making Video Move with Claude + Higgsfield — A 10XAI Teardown

> "Claude writes the brief, picks the model, generates the asset, iterates on variants — work that used to take a team and a week now finishes in a chat and an afternoon."
> — Higgsfield, launch copy for its MCP server

Since Higgsfield shipped its official MCP server (April 30, 2026), a lot of posts say you can go from one sentence in Claude to finished, cinematic video. This article runs that claim through the 10XAI pipeline: **decompose → fill the gaps → verify → execute & measure → export**. You get a workflow you can reproduce, the steps the posts leave out, and the risks that should stop at the gate.

---

## 1. What the claim actually says

| # | Author claim | Type | Status |
|---|---|---|---|
| C1 | "Connect in 60 seconds, no API key" | time | Plausible: OAuth, no key |
| C2 | "Access to 30+ image and video models (Veo 3.1, Sora 2, Kling 3.0, Seedance 2.0, Wan, Hailuo, Soul…)" | capability | Partial: third-party guides list fewer models on the hosted endpoint |
| C3 | "The MCP is free" | cost | **Misleading**: connecting is free, generating uses credits |
| C4 | "A week of team work in one afternoon" | time | Unmeasured, depends on how many re-rolls it takes |

The fourth column is the result of 10XAI's verify stage. The measured values in section 5 are left blank on purpose until you run the board yourself. We don't publish numbers we didn't measure.

---

## 2. Decomposed workflow (Kanban cards)

Gray cards (⬜) are prerequisite steps the posts skip, added by the gap-fill stage.

```
Decomposed ─────────────────────────────────────────────────────────────▶ Verified
⬜ G1  Create a Higgsfield account; check plan and credit balance
⬜ G2  Decide the output spec: aspect ratio, duration, resolution, audio yes/no
 1     Connect the Higgsfield MCP server to Claude
 2     Write a motion brief (subject, action, camera move, lighting, pacing)
 3     Generate a still keyframe (image model): lock look and identity first
 4     Animate the keyframe (image-to-video) with a camera-move prompt
⬜ G3  Price-check the model before rendering (credits per clip × expected re-rolls)
 5     Review, re-roll, or restyle (video-to-video)
 6     Stitch shots; first/last-frame interpolation for transitions
⬜ G4  Rights/likeness check on any real person, brand, or reference footage
 7     Export the final cut + save the prompt set as a reusable SKILL.md
```

### Step 1: connect

**Claude (web / desktop):** Settings → Connectors → **+** → *Add custom connector* → Name `Higgsfield`, URL `https://mcp.higgsfield.ai/mcp` → sign in with your Higgsfield account (OAuth).

**Claude Code:**

```bash
claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp
# then run /mcp inside Claude Code to complete the OAuth sign-in
```

No API key goes into your config. The token lives with the OAuth session, which fits 10XAI rule 3 (no plaintext secrets).

### Step 2: the motion brief

The biggest reason AI video looks "static" is a prompt that describes a **picture**, not a **move**. Make Claude write the brief in five slots:

```
SUBJECT   : who/what is on screen, and one identity anchor (outfit, color, prop)
ACTION    : one verb, one direction ("turns toward camera", "runs left to right")
CAMERA    : one move ("slow dolly-in", "orbit 90° right", "crane up", "handheld follow")
LIGHT     : source + time ("golden-hour backlight", "neon side light, wet street")
PACING    : duration and speed ("5s, slow start, fast finish")
```

Rules of thumb that hold across Kling, Veo, and Seedance:

- **One camera move per shot.** "Dolly in while orbiting and tilting" gives you mush. Chain shots instead.
- **Motion needs a direction and a speed.** "Moves" is weak; "drifts slowly to the left" works.
- **Name the static things.** "Background stays still, only the hair and coat move in the wind" cuts down on warping.
- **Physical verbs beat mood words.** "Steam rises, cup slides across the table" beats "cozy vibe".

### Steps 3–4: image first, then motion

Don't go straight from text to video. First generate a still with an image model (Soul, Nano Banana Pro, Flux) until the look and character are right, then animate *that frame*. Image generations cost far fewer credits than video, so you iterate where it's cheap and render motion only once.

A prompt to hand Claude:

```text
Using Higgsfield:
1. Generate 4 keyframe stills for this brief with an image model. 16:9.
   Brief: a courier on a red bicycle, rain-soaked Seoul alley at night, neon reflections.
2. Wait for me to pick one.
3. Before rendering video, tell me the credit cost of a 5s clip on Kling 3.0 vs Veo 3.1
   and my remaining balance.
4. Animate the chosen frame on the model I approve:
   CAMERA: low-angle tracking shot following the bike, left to right.
   ACTION: wheels splash through puddles, coat flaps; background signs stay static.
   PACING: 5s, steady speed.
```

Step 3 of that prompt is the gap-fill card G3 written as an instruction. The MCP exposes balance and per-model pricing, so make Claude check the price before every render.

### Steps 5–6: iterate and connect shots

- **Re-roll** the same prompt once or twice before rewriting it; motion models are stochastic.
- **Video-to-video restyle** fixes the look while keeping the motion you like.
- **First/last-frame interpolation**: give the last frame of shot A and the first frame of shot B, and the model generates the move between them. This is how you get continuous camera moves longer than one clip.

---

## 3. Verify: risk per card

| Card | Risk | Level | Gate? |
|---|---|---|---|
| 1 Connect MCP | OAuth grants an agent spend authority over your credit pool | Medium | **Yes**, once; approve the scope |
| 4 / 5 Render video | Credit burn: premium models (Veo 3.1, Sora 2) cost roughly 10× Kling per clip; an agent loop can drain a plan | Medium | **Yes**: every render above a credit threshold |
| G4 Likeness / brand | Real faces, celebrity lookalikes, logos, copyrighted reference footage → ToS and legal exposure | **High** | **Yes**: human sign-off |
| 2 / 3 Brief + stills | Low cost, no external side effects | Low | Auto-run |

The 10XAI contract applies: **renders and anything with real likeness wait at the gate. Briefs and cheap stills run automatically.**

---

## 4. The "free" claim, decoded

- **Connecting the MCP is free.** Generating is not. Every image and video uses credits from your Higgsfield account.
- Free tier: about **150 credits/month** (as reported May 2026, subject to change).
- Paid plans are reported at about **$15 / $39 / $99 per month** billed annually (Starter / Plus / Ultra), with pools of roughly **200 / 1,000 / 3,000 credits**. Some regions and accounts see $19–$129.
- Third-party estimates, **including re-rolls**: about **$0.60–$1.00 per usable Kling-class clip** and **$3–$9 per usable Sora 2 / Veo 3.1 clip**.

So "a campaign in an afternoon" is realistic on Kling-class models, and it gets expensive quickly if Claude uses premium models by default. Tell Claude which model to use.

---

## 5. Execute & measure: claimed vs. measured

Paste this article (or the original post) into the 10XAI board, approve the gated cards, and the exec stage fills in this table in `metadata.measured`:

| Metric | Claimed | Measured |
|---|---|---|
| Setup time (C1) | 60 s | — |
| Models available on the hosted endpoint (C2) | 30+ | — |
| Cost of MCP connection (C3) | $0 | — |
| Credits per usable 5s clip, Kling 3.0 | — | — |
| Credits per usable 5s clip, Veo 3.1 | — | — |
| Re-rolls to a usable clip (median of 5 briefs) | — | — |
| Brief → 3-shot, 15s sequence, wall-clock (C4) | "an afternoon" | — |

Cells stay empty until a run fills them. That's the point of 10XAI.

---

## 6. Export: a reusable module

After a verified run, the deploy stage packages the workflow as a `SKILL.md` you can reuse:

```markdown
---
name: motion-shot
description: Turn a one-line idea into a 5s moving shot via Higgsfield MCP — still first, price check, then animate.
---
1. Expand the idea into SUBJECT / ACTION / CAMERA (one move) / LIGHT / PACING.
2. Generate 4 stills (image model, 16:9). Stop and ask the user to pick.
3. Report credit cost for the candidate video models and the remaining balance. Stop and ask.
4. Animate the chosen still on the approved model. Name what must stay static.
5. If the user rejects it: re-roll once, then revise only the CAMERA or ACTION slot.
6. Never use a real person's likeness, a logo, or reference footage without explicit confirmation.
```

---

## Verdict

- **Works:** Claude + Higgsfield MCP does turn a sentence into moving video without leaving the chat, and setup is minutes, not hours.
- **Missing from the posts:** a credit budget, the "still first, then animate" order, one-camera-move prompting, and a likeness/ToS check.
- **Risky if run as-is:** an agent with OAuth spend authority and no price gate. Put renders behind the gate.

## Sources

- Higgsfield — [Generate AI Videos Straight From Claude with Higgsfield's MCP](https://higgsfield.ai/blog/Generate-AI-Videos-From-Claude-with-Higgsfield-MCP), [Higgsfield MCP](https://higgsfield.ai/mcp)
- [How to Connect Higgsfield to Claude or ChatGPT](https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent)
- [Higgsfield MCP for Claude Code: 60-Second Setup (TECHSY)](https://techsy.io/en/blog/higgsfield-mcp-claude-code)
- [Higgsfield MCP: Setup, Models & the Credit Catch (Creetr)](https://creetr.com/blog/higgsfield-mcp)
- [Higgsfield MCP Is Now FREE: Claude AI Video Workflow Guide (AIIDElist)](https://aiidelist.com/blog/higgsfield-mcp-is-now-free)
- [Higgsfield AI Pricing 2026 (Layer3 Labs)](https://www.layer3labs.io/guides/higgsfield-ai-pricing)
- [Higgsfield AI Review 2026 (AI Funnel Insider)](https://aifunnelinsider.com/higgsfield-ai-review-2026/)

*Prices, credit pools, and model lists change often. Figures are as reported by the sources above in 2026, not measured by 10XAI.*
