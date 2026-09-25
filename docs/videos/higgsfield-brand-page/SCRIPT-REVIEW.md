# Script review: Claude × Higgsfield brand-page film (v2 draft, 212 s)

**Scope.** This reviews `tools/narration.json` (38 cues, 192 s) against the chapter visuals (`film/chapters/ch00–ch07.js` beat comments and `s.caps`), the sources in `immersive-script.md`, and the new Seedance 2.5 chapter. The revised cue list is in **`tools/narration-v2.draft.json`** (43 cues, 212 s). It uses the same schema: `ch` + `at` (seconds after that chapter's film start), `en`, `ko`, and optional `say`. `narration.json` was not touched.

**How the timeline shift works.** Cues are anchored per chapter, so ch04–ch07 cues move +20 s automatically once `ch03s` (20 s) sits in `film/timeline.js` after ch03. The draft uses the chapter id `ch03s`, as in ARCHITECTURE-REVIEW.md A.1. Film-second columns below are on the new 212 s clock.

**Timing method.** Each cue is estimated at 2.6 words/s. Numbers count as 2 words, decimals as 3, and % as +1. Each cue must end before the next cue starts and stay outside the curtain windows. Those windows run from B−0.8 to B+1.0 at B = 10, 40, 72, 106, 126, 154, 180, 204, and from 210.7 (the final close, E−1.3) to 212. All 43 cues pass by that estimate. Kokoro at speed 1.08 actually speaks about 3.1 words/s, so the real audio will have 15–20% slack. **Run `build-narration.py --check` to confirm; I did not run TTS.** The cue at 106.3 in the brief sat inside the ch03s opening curtain (106 + 1.0), so the new chapter starts speaking at 107.0 and finishes by 124.2.

---

## 1. Top issues (old script), in priority order

1. **The ending contradicts the film's core rule.** ch02 says "your customer is the hero. Not your brand." Then ch07 says "The next page's hero? Your brand." and the marquee says "다음 주인공 ★ 당신의 브랜드". That breaks the StoryBrand through-line at the exact moment it should pay off. *Fix:* "Next hero: your customer…" (the visual also needs changing; see V-15).
2. **"Claude × Higgsfield", the premise, is almost never spoken.** Claude is named twice (ch00 and ch04). Higgsfield is named once, and the brand only appears in ch03 feature names. Nothing says who does what, and nothing says **where the site lives**. *Fix:* a recurring motif. It starts as "Claude writes it. Higgsfield makes it real." (ch00) and comes back with a twist in each chapter: "Claude wrote it. Higgsfield hosts it." · "Claude drafts the story" · "Higgsfield keeps the face" · "Claude writes the shot list" · "Claude Opus codes it" · "Claude wrote that [joke]" · "Claude writes yours" · "publish yours on Higgsfield".
3. **The open loop was vague ("one button pays off") and ignored the visual.** On screen, the loop is the "₩4,500,000?" envelope, with Uchal's "450만?!" bubble. *Fix:* "Noa's envelope? Opens at the end." → ch06 "Remember Noa's envelope? It all comes down to one button." → the ₩4.5M figure lands → "That's the button."
4. **Several stats were unattributed or overstated.** "270% more likely" had no baseline (it is five reviews versus zero). "72% pick them over rivals" is a survey statement of intent. "85%" had no source. "53% of mobile visitors leave" should be "visits are abandoned". "Judge your page" should be "judge its looks" (Lindgaard measured visual appeal). The ₩ example was not marked as hypothetical in the spoken line. *Fix:* see §3.
5. **Reality gaps.** The "near me" line implied the page itself gets you found locally. Soul ID was shown as training on a cartoon hamster. Nothing covered credits or retakes. Publishing (Higgsfield hosts at `*.higgsfield.app`, with no server or domain setup) was never said. *Fix:* §4.
6. **Weak chapter hand-offs.** Only ch05→ch06 ("Remember that button…") and ch03's gag had real hooks. *Fix:* every chapter now ends by pointing at the next: ch02 "Guides just need one face" → ch03 · "Now let's make him move" → ch03s · Uchal "30초에 소리까지?!" → ch04 · "Now, earn their trust" → ch05 · "Now, money" → ch06 · "Already full" → ch07.
7. **No concrete "do this tomorrow".** *Fix:* ch06 "Tomorrow: Claude writes yours. One main, one 'maybe later.'" ch07 then gives the action path: see the live page, publish yours on Higgsfield.
8. **Timing.** At 2.6 words/s, 11 old cues overran their slot, and the builder pushed later cues off their beats (for example, the ch05 humor line drifted from 143.8 to 144.85, and "never the customer" missed Uchal's gag). The new lines are shorter, and the rule line now lands "never" on the ✗ beat (authored 152.4).
9. **Uchal was never named in narration.** He is now named once, in a 2D co-host moment: the ch05 rule stamp, where he starts a customer joke ("…never the customer, Uchal."). His ch03s line is an on-screen bubble, not voice.

## 2. Scorecard per chapter (1–5; old → new)

| Ch | Hook | Clarity | Flow / hand-off | Specificity | Humor | Accuracy | KO subs | CTA / payoff | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 00 Opening | 4→5 | 4→4 | 3→5 | 3→4 | 3→3 | 3→5 | 3→4 | 2→4 | "Judge your page" becomes "judge your page's looks" (Lindgaard: visual appeal). The motif is introduced over the "Claude × Higgsfield" title stamp (5.25). The envelope open loop is now named. |
| 01 Who it's for | 3→4 | 4→5 | 3→4 | 3→4 | 4→4 | 2→4 | 4→4 | 2→4 | The agency line gains its CTA ("books the call" = 상담 예약). The local line no longer implies the page wins "near me" search. Proof now says what Claude and Higgsfield each did. |
| 02 Flow | 4→4 | 4→5 | 2→4 | 3→4 | 4→4 | 4→4 | 4→4 | 3→4 | "Claude drafts the story" makes the StoryBrand step concrete. "Hook. Proof. Action." is timed to the scroll beats (60.4/61.3/62.2). "Guides just need one face" hands off to ch03 and trades the "best lines" quip for a hook. |
| 03 Consistency | 5→5 | 4→5 | 3→5 | 5→5 | 5→5 | 3→4 | 4→4 | 3→4 | Soul ID is now scoped to real faces. "Higgsfield keeps the face" + "Now let's make him move" hands off to Seedance. |
| 03s Seedance 2.5 (new) | —→4 | —→5 | —→5 | —→5 | —→4 | —→5 | —→4 | —→4 | Shot-list anatomy in 4 cues. "A few takes later" is honest about iteration. Uchal's bubble is the button. |
| 04 Immersion | 3→4 | 4→5 | 3→5 | 4→5 | 3→3 | 3→5 | 3→4 | 2→4 | 53% is now phrased as visits abandoned (Google). 85% is attributed to Wyzowl. The Seedance clip becomes the hero video, which ties ch03s in. |
| 05 Expertise + humor | 4→4 | 4→4 | 3→5 | 4→5 | 4→5 | 2→4 | 3→4 | 3→4 | 270% now has its baseline. 72% is framed as "would pick". Oracle is attributed. Uchal is named on the ✗. The loading gag is credited to Claude. |
| 06 Money | 4→5 | 4→4 | 4→5 | 4→4 | 4→4 | 3→4 | 4→4 | 3→5 | The envelope loop closes. "Say conversion rises…" marks the example as hypothetical. The "tomorrow" takeaway is added. |
| 07 Curtain | 3→4 | 3→5 | —→— | 2→4 | 3→2 | 1→5 | 3→4 | 2→5 | Fixes the hero contradiction. Adds the site CTA and the publish step. The "Noa's got the curtain" quip was cut for time (the rope gag still plays visually). |

## 3. Fact-check (every stat and claim in the narration)

Egress to higgsfield.ai, wyzowl.com, marketingdive.com and spiegel.medill was **blocked** from this container. Higgsfield and Seedance claims were confirmed through web-search snippets of the pages listed. The four marketing stats are checked against the citations in `immersive-script.md` and the well-known wording of those studies. The Wyzowl 2026 figure (85%) could not be opened directly; re-verify it before publishing.

| Claim (as now spoken) | Status | Source · note |
|---|---|---|
| 50 ms to judge a page's looks | ✅ qualified | Lindgaard et al. 2006, *Behaviour & IT* 25(2). Ratings after 50 ms exposure correlated with 500 ms ratings of **visual appeal**. The old "judge your page" overstated it; the new line says "looks". |
| Customer = hero, you = guide, plan + one CTA | ✅ | StoryBrand SB7 (Donald Miller). |
| Interactive pages hold people longer | ⚠️ kept qualitative | +62% dwell / +317% scroll depth (Infogram × DC Thomson 2015) is only a secondhand citation (scrollytelling.ai). The narration makes no number claim. The bars on screen show the numbers, so they need a source line (V-4). |
| Character sheet on plain grey: face close-up + full body front + back | ✅ | Higgsfield Academy, *Character sheets in Soul Cinema* (Cinema Studio). |
| Soul ID: 20+ photos, about 3–5 min | ✅ with scope | Higgsfield says a minimum of 20 photos and about 3 minutes of training; its blog says 3–5 min. Soul ID is documented for **photos of a real person**, so the line now says "for real faces". For a mascot like Noa, the working path is the character sheet plus reference images. |
| Reuse via Reference Element in Kling / Seedance | ✅ | Higgsfield blog, "Soul ID Explained": a saved Reference Element carries the face into Cinema Studio, Marketing Studio, Supercomputer and video models including **Seedance 2.0 and Kling 3.0**. For Seedance **2.5**, the documented route is attaching reference images (up to 50), not a Reference Element. See V-6. |
| Lock outfit/hair; references beat seeds | ✅ | atlascloud and neolemon Kling guides (in immersive-script.md). |
| Seedance 2.5 on Higgsfield: up to 30 s, native audio, up to 50 references, native up to 1080p | ✅ | higgsfield.ai/blog/seedance-2-5-on-higgsfield-2026 · higgsfield.ai/seedance/2.5 (also openart, morphic). One Higgsfield landing page (`/seedance-2.5`) advertises "4K"; the blog says **native up to 1080p**, so the film should say "1080p" or nothing. The narration says "up to thirty seconds". |
| Prompt shape: one visual rule on top, one sound rule at the bottom, shots in between | ✅ | higgsfield.ai/blog/seedance-2-5-prompting-guide: "one visual rule at the top, one sound rule at the bottom, and everything in between broken into shots." The same guide also advises using one reference per element rather than maxing out the 50. |
| Shot 1 / Shot 2… action, framing, end point, "Hard cut." | ✅ | Same guide ("labeled 'Shot 1', 'Shot 2'… ending in 'Hard cut'"). "End point" and "one camera move per beat" come from the Kapwing / fal guides; the camera rule is left to on-screen call-outs (V-9). |
| "The character from the reference images" rather than re-describing | ✅ | Per brief (Higgsfield / fal guides). Spoken as "Don't re-describe Noa". The exact phrase appears in the typed prompt (V-8). |
| 53% of mobile visits abandoned past 3 s | ✅ reworded | Google/SOASTA 2016 via Marketing Dive. The old "visitors leave" is now "visits are abandoned". |
| 85% say a video convinced them to buy | ✅ attributed | Wyzowl Video Marketing Statistics 2026 (as cited). This is a self-report survey, so the line says "85% tell Wyzowl". |
| Show your work → trust | ✅ | Buell & Norton 2011, the labor illusion. |
| 5 reviews vs 0 → purchase likelihood +270% | ✅ reworded | Spiegel Research Center: "purchase likelihood for a product with five reviews is 270% greater than for a product with no reviews." The old line had no baseline. |
| 91% prefer funny brands; 72% would pick them over rivals | ✅ attributed | Oracle × Gretchen Rubin *Happiness Report* 2022 (Marketing Dive). "Would choose" is stated intent, and the line says "would". |
| Joke about the situation, not the customer | ✅ | Benign violation theory (McGraw & Warren 2010), used as a rule of thumb. |
| Claude Opus writes smooth animation code | ✅ | Anthropic, *Introducing Claude Opus 5* (animation, games and 3D work, as cited). The film itself is HTML/JS animation, so "How do you think this video moves?" holds. |
| 3,000 × 1.5% × ₩60,000 = ₩2.7M → at 2.5% = ₩4.5M | ✅ math, **illustrative** | The spoken "Say conversion rises one point…" plus the KO "(예시)" mark it as an example. Keep the "예시" tag on screen (V-13). |
| Site is published on Higgsfield at `*.higgsfield.app` | ✅ | higgsfield.ai/blog/introducing-higgsfield-apps · /skills/website · /blog/build-website-with-ai. Higgsfield's builder is reachable in Supercomputer or from Claude via the **Higgsfield MCP** (`https://mcp.higgsfield.ai/mcp`, OAuth, no API key). **Every deploy goes live immediately** at the subdomain; listing on the community feed is optional. Building spends your credits; visitors who generate inside an app use their own. |

## 4. Reality check: claims and on-screen depictions vs. how the workflow really works

**The real workflow.** Every spoken or depicted step should match this:
1. **Claude** does strategy, the StoryBrand flow, copy, CTA wording, the Seedance shot-list prompts, the brand kit and custom animation code. It drives Higgsfield through the **Higgsfield MCP connector**; connecting is free via OAuth.
2. **Higgsfield** does the Cinema Studio character sheet, Soul ID (real people), image and video generation (Seedance 2.5, Kling 3.0) with references, and the **website/app builder**. The builder deploys straight to `<name>.higgsfield.app`: no server, no domain setup, live at once, with an optional feed listing.
3. **Generation costs credits, and good results take a few takes.** The draft now says "A few takes later" (ch03s). No line promises zero work or guaranteed revenue. The ₩ figures are an example.

**Narration claims audited:** all 43 cues. Changes made for realism:
- ch01 local store: "from a 'near me' search to your front door" → "Hours, directions, booking: one tap from your page." A page does not rank you in "near me" search; your map listing does.
- ch01 influencer: "your very own storefront" → "a real shop window". The page shows and links out; this avoids implying built-in checkout.
- ch01 proof: now says "Claude wrote it. Higgsfield hosts it." (true to the `.higgsfield.app` URL on screen).
- ch03: Soul ID is scoped to "real faces".
- ch03s: "A few takes later" states the iteration and credit cost honestly. "Up to thirty seconds."
- ch07: "publish yours on Higgsfield". No server, repo or domain is mentioned anywhere in the narration.

**Deploy/hosting depictions:** I grepped all chapters, `core.js` and `boot.js` for server, deploy, hosting, domain, vercel/netlify and `.com`. No visual depicts renting a server or other hosting. The only address shown is `🔒 noainostory.higgsfield.app` (`core.js:39,386`), which is correct. What's missing is a *publish* moment (V-14).

## 5. Claude × Higgsfield beat per chapter

| Ch | What Claude does | What Higgsfield does | Spoken beat (draft) | On-screen moment today / needed |
|---|---|---|---|---|
| 00 | Writes the page, the story and the code | Makes it real: images, video, hosting | "Claude writes it. Higgsfield makes it real." (4.2) | Title chips "Claude × Higgsfield" stamp at 5.25 ✅. Add the role badge (V-1). |
| 01 | Wrote the reference page's copy/flow | Hosts it at `noainostory.higgsfield.app` | "Proof? Claude wrote it. Higgsfield hosts it." (33.2) | Address bar shows `.higgsfield.app` ✅. Add a two-tag split on the page drop (V-2). |
| 02 | Drafts the SB7 story: problem → guide → 3 steps → button | — (the page sections are built later by the builder) | "Claude drafts the story…" (46.2) | The road draws at 46; needs a Claude badge on the map Noa hands over (V-3). |
| 03 | — (prompts) | Character sheet, Soul ID, Reference Element, Kling/Seedance | "Higgsfield keeps the face." (99.8) | Photobooth "SOUL ID · NOA" (fix V-5); machines (V-6). |
| 03s | Writes the Seedance shot-list prompt | Seedance 2.5 renders 3 shots, up to 30 s with audio | "Claude writes the shot list…" (111.7) | New chapter: prompt panel badged "✎ Claude", render panel "Higgsfield · Seedance 2.5" (V-7…V-11). |
| 04 | Codes the animation (Opus) | Supplies the hero video (the Seedance clip) | "Your Seedance clip? Hero video." / "Claude Opus codes it." | Editor badge "✎ Claude Opus" ✅. Hero video needs a "Seedance · Higgsfield" tag (V-12). |
| 05 | Writes copy and the loading-screen joke | Renders the stills and video | "'Noa's rendering, coffee number two.' Claude wrote that." | Loading steps already say "대본 확정 · Claude / 스틸 4장 · Higgsfield / 5초 영상 · Higgsfield" ✅. Add a 4th step "Higgsfield에 게시" (V-14). |
| 06 | Writes the CTA copy (main + soft) | — (the button lives on the Higgsfield-hosted page) | "Tomorrow: Claude writes yours…" (196.1) | CTA board 196; add a small "✎ Claude" on the button labels (V-13). |
| 07 | — | Publishes: live at `.higgsfield.app` | "…then publish yours on Higgsfield." (205) | Marquee URL flips at 207 ✅. Fix the hero text (V-15). |

## 6. Visual follow-ups (new film seconds; authored clock in brackets)

| ID | Where | Problem | Fix |
|---|---|---|---|
| V-1 | All chapters | The division of labor is never shown as a system. | Add a small recurring **role badge**: a top-corner pill "✎ Claude → ▶ Higgsfield" whose active side lights up on each motif line. Timings: 4.2, 33.2, 46.2, 99.8, 111.7/119.6, 139.2/145.8, 174.3, 196.1, 205. |
| V-2 | ch01 33.2–35.9 | The proof shows only a URL. | Two tags pop over the dropped page, "Claude: 카피·흐름" and "Higgsfield: 영상·호스팅", with an arrow to the 🔒 address bar. |
| V-3 | ch02 46.2–51 | "Claude drafts the story" has no visual. | Stamp a tiny "✎ Claude" on the map Noa hands to the customer. |
| V-4 | ch02 53–60 (53–60) | The +62% / +317% bars show secondhand numbers with no source line. | Add a cite line "Infogram × DC Thomson (2015), via scrollytelling.ai", or drop the numbers from the bars. |
| V-5 | ch03 86.5–91 | The photobooth trains **Soul ID on Noa** (a cartoon). Soul ID is documented for 20+ photos of a real person. | Relabel the card "SOUL ID · 실제 인물용" and show a human (for example, a shop owner) in the booth. Alternatively, add a sub-caption "마스코트는 캐릭터 시트 + 레퍼런스". The `s.caps` "같은 사람 사진 20장+" is fine. |
| V-6 | ch03 91–95 | The machines are labeled "Kling 3.0" and "Seedance 2.5". Reference Element is documented for Kling 3.0 and **Seedance 2.0**; 2.5 takes reference images directly. | Relabel the second machine "Seedance". Or keep "2.5" and change the flying chip from "Reference Element" to "레퍼런스 이미지". |
| V-7 | ch03s 106–110 | New chapter (planned). | Three-panel grey sheet + stage snap into a panel titled **"Seedance 2.5 · Higgsfield"**. Chips "레퍼런스 최대 50장 · 1080p". Keep the attach snap at ~107.5 so it lands on "Attach the sheet". |
| V-8 | ch03s 110–118 | Prompt typing must show what is spoken. | Order the typed prompt: `VISUAL: warm paper-cutout look…` (call-out "① 화면 규칙 맨 위") → `Shot 1: the character from the reference images walks in… medium shot… ends at centre. Hard cut.` → `Shot 2…` → `Shot 3…` → `AUDIO: stage ambience, soft footsteps, no dialogue` (call-out "② 사운드 규칙 맨 끝"). Badge the editor "✎ Claude". Call-outs time to the narration: rules at 112.5–115, "action/framing/end point/Hard cut" at 116.4–119.5. |
| V-9 | ch03s 116–119 | The camera rule isn't spoken. | Add a small call-out on each shot line: "카메라 무브 1개/비트". |
| V-10 | ch03s 118–124 | Generate beat. | Move the Generate press to ~119.6 (the "A few takes later" cue). Show a quick "재생성 ×2" flip and a "크레딧 사용" chip before the 3 shots play. Tag "최대 30초 · 오디오 포함". |
| V-11 | ch03s 124–126 | Uchal bubble "30초에 소리까지?!" | Start it at ≥124.3, after narration ends at ~124.2, and keep it clear of the curtain. |
| V-12 | ch04 139–145 (119–125) | The hero-video beat doesn't link to Seedance. | Label the hero video "Seedance 2.5 · Higgsfield" (small tag). The 85% ring needs a "Wyzowl 2026" cite line. |
| V-13 | ch06 187–196 (167–176) | The ₩ example must read as an example. The CTA board has no Claude. | Keep a visible "예시" tag on the formula result. Add "✎ Claude" micro-badges on the CTA labels at 196.1. Optional: move Uchal's ₩4.5M gasp (193.75, authored 173.75) to ~194.8 to meet the spoken "4.5". |
| V-14 | ch05 173.5–180 (153.5–160) | No publish step anywhere in the film. | Add a 4th loading step "Higgsfield에 게시 · noainostory.higgsfield.app" (replacing "페이지에 배치", which has no owner and no tick). |
| V-15 | ch07 204–212 (184–192) | The banner caption, the marquee "다음 주인공 ★ 당신의 브랜드" and `s.caps` "다음 페이지의 주인공은, 당신의 브랜드" contradict ch02. | Change them to "다음 주인공 ★ 당신의 고객". Recap chip "Soul ID 일관성" → "캐릭터 일관성". Optional: add a chip "Higgsfield에 게시". The URL flip (207) lines up with "See Noa's page live". |
| V-16 | ch01 23–27 (23–27) | The store card types a "near me" search, which implies the page wins local search. | Retitle the search box as a map listing ("지도 앱") that links to the page, or cut straight to the page's 길찾기/예약 buttons. |
| V-17 | ch02 67.3–72 (67.3–72) | Uchal lip-syncs "Chin up, Noa!". The new line is "Chin up, Noa. Guides just need one face." (67.6–70.7). | Extend the lip-sync to 70.7. Optional: the coping bar snaps to 100% on "one face". |
| V-18 | ch05 170.7–174.2 (150.7–154.2) | The rule line now ends "…never the customer, Uchal." | Uchal's pout/agree should follow his name (~173.8). The ✗ still lands on "never" (~172.6 est.; authored 152.4 + 20). |

## 7. Diff: every cue, old → new

Film seconds are on the new 212 s clock. The ch03s rows are new. ch04 has one extra cue (the transition line). 40 of 43 cues changed.

| # | ch | new film s (at) | Old `en` | New `en` | New `ko` |
|---|---|---|---|---|---|
| 1 | ch00 | 0.3 (0.3) | You have fifty milliseconds. That's how long a visitor takes to judge your page. | Fifty milliseconds. That's how fast visitors judge your page's looks. | 0.05초. 방문자가 페이지 겉모습을 판단하는 시간이에요. |
| 2 | ch00 | 4.2 (4.2) | Claude and Higgsfield can win it. Stay to the end: one button pays off. | Claude writes it. Higgsfield makes it real. Noa's envelope? Opens at the end. | Claude가 쓰고 Higgsfield가 현실로. 봉투는 마지막에 열어요. |
| 3 | ch01 | 11.0 (1.0) | Who's this for? Probably you. | Who's this for? Probably you. (unchanged) | 누구를 위한 거냐고요? 아마 당신이요. |
| 4 | ch01 | 13.4 (3.4) | Agency? Your portfolio becomes a living showreel. | Agency? Your portfolio plays like a showreel, and books the call. | 에이전시라면? 포트폴리오가 쇼릴처럼 흐르고, 상담 예약까지. |
| 5 | ch01 | 18.2 (8.2) | Online shop? Your products spin, shine, and hop into the cart. | Online shop? Products spin, shine, and hop into the cart. | 쇼핑몰이라면? 제품이 돌고, 빛나고, 장바구니로 쏙. |
| 6 | ch01 | 23.2 (13.2) | Local store? From a 'near me' search to your front door, in one tap. | Local store? Hours, directions, booking: one tap from your page. | 매장이라면? 영업시간, 길 찾기, 예약까지 페이지에서 한 번에. |
| 7 | ch01 | 28.2 (18.2) | Influencer? One link becomes your very own storefront. | Influencer? Your one link becomes a real shop window. | 인플루언서라면? 링크 하나가 제대로 된 쇼윈도가 돼요. |
| 8 | ch01 | 33.2 (23.2) | Want proof? Here's a real page I built. | Proof? Claude wrote it. Higgsfield hosts it. | 증거요? Claude가 쓰고, Higgsfield가 호스팅해요. |
| 9 | ch01 | 36.0 (26.0) | And meet Noa, your guide. Too cool for eye contact. | Noa, your guide. Too cool for eye contact. | 가이드 노아예요. 너무 쿨해서 눈은 안 마주쳐요. |
| 10 | ch02 | 41.0 (1.0) | Here's the StoryBrand rule: your customer is the hero. Not your brand. | StoryBrand's rule: your customer is the hero. Not your brand. | 스토리브랜드 원칙: 주인공은 브랜드가 아니라 고객이에요. |
| 11 | ch02 | 46.2 (6.2) | Start with their problem. Be the guide: a three-step plan, one clear button. | Claude drafts the story: their problem, you as guide, three steps, one button. | 이야기는 Claude가: 고객의 문제, 길잡이인 나, 3단계, 버튼 하나. |
| 12 | ch02 | 53.2 (13.2) | Make every scroll a scene change. Interactive visuals keep people around longer. | Then make every scroll a scene change. Interactive pages hold people longer. | 스크롤마다 장면이 바뀌게. 인터랙티브 페이지는 더 오래 붙잡아요. |
| 13 | ch02 | 60.2 (20.2) | On my page? Hook, then proof, then action. | My page? Hook. Proof. Action. | 제 페이지는? 훅, 증거, 행동. |
| 14 | ch02 | 63.3 (23.3) | Noa just got demoted from hero to guide. The hamster is... coping. | Noa, demoted from hero to guide. He's... coping. | 주인공에서 길잡이로 강등된 노아. 지금… 추스르는 중. |
| 15 | ch02 | 67.6 (27.6) | Chin up, Noa. Guides get the best lines. | Chin up, Noa. Guides just need one face. | 힘내, 노아. 길잡이는 얼굴 하나면 돼. |
| 16 | ch03 | 73.0 (1.0) | Ever generated three shots and gotten three different faces? Noa has. | Ever generated three shots and gotten three different faces? Noa has. | 세 컷 뽑았더니 얼굴이 셋? 노아가 그랬어요. |
| 17 | ch03 | 77.9 (5.9) | Blue Noa. Nerdy Noa. Spiky Noa. Who are these hamsters? | Blue Noa. Nerdy Noa. Spiky Noa. Who are these hamsters? | 파란 노아, 범생이 노아, 삐죽머리 노아. 너희 누구야? |
| 18 | ch03 | 82.2 (10.2) | One: a character sheet on grey. Face close-up, full body front and back. | One: a grey character sheet. Face close-up, body front and back. | 하나, 회색 배경 캐릭터 시트. 얼굴 클로즈업, 전신 앞·뒤. |
| 19 | ch03 | 86.7 (14.7) | Two: Soul ID. Twenty-plus photos, three to five minutes, one saved face. | Two: Soul ID, for real faces. Twenty-plus photos, three to five minutes. | 둘, 실제 인물이면 Soul ID. 사진 20장 이상, 3~5분 학습. |
| 20 | ch03 | 91.4 (19.4) | Three: reuse that face in Kling or Seedance with Reference Element. | Three: reuse it in Kling or Seedance via Reference Element. | 셋, Reference Element로 Kling·Seedance 재사용. |
| 21 | ch03 | 95.7 (23.7) | Four: lock outfit and hair. Five: references beat seeds. | Four: lock outfit and hair. Five: references beat seeds. | 넷, 의상·헤어 고정. 다섯, 시드보다 레퍼런스. |
| 22 | ch03 | 99.8 (27.8) | Same shades, same scarf, same hamster. Anywhere you put him. | Same shades, same scarf. Higgsfield keeps the face. Now let's make him move. | 얼굴은 Higgsfield가 지키고, 이제 움직여 볼 차례! |
| 23 | ch03s | 107.0 (1.0) | *(new cue)* | Attach the sheet to Seedance 2.5. Don't re-describe Noa. | 시트를 Seedance 2.5에 첨부. 노아를 다시 묘사하지 마세요. |
| 24 | ch03s | 111.7 (5.7) | *(new cue)* | Claude writes the shot list: visual rule on top, sound rule last. | 샷 리스트는 Claude가: 맨 위엔 화면 규칙, 맨 끝엔 사운드 규칙. |
| 25 | ch03s | 116.4 (10.4) | *(new cue)* | Each shot: action, framing, end point. Hard cut. | 샷마다 동작, 구도, 끝나는 지점. 그리고 하드 컷. |
| 26 | ch03s | 119.6 (13.6) | *(new cue)* | A few takes later: same Noa, up to thirty seconds, with sound. | 몇 번 다시 뽑으면: 같은 노아, 최대 30초, 소리까지. |
| 27 | ch04 | 127.0 (1.0) | Speed first. Past three seconds, Google says 53% of mobile visitors leave. | Now, speed. Past three seconds, Google says 53% of mobile visits are abandoned. | 이제 속도. 구글: 3초를 넘기면 모바일 방문의 53%가 이탈해요. |
| 28 | ch04 | 132.8 (6.8) | Next, make something move with every scroll. Reward the thumb, it keeps going. | Then make every scroll move something. Reward the thumb; it keeps going. | 스크롤마다 뭔가 움직이게. 엄지에 보상을 주면 계속 내려가요. |
| 29 | ch04 | 139.2 (13.2) | Put video in your hero. 85% of people say a video convinced them to buy. | Your Seedance clip? Hero video. 85% tell Wyzowl a video convinced them to buy. | 히어로엔 Seedance 영상. 85%가 영상 보고 구매 결심(Wyzowl) |
| 30 | ch04 | 145.8 (19.8) | Smooth animation? Let Claude Opus code it. How do you think this video moves? | Smooth motion? Claude Opus codes it. How do you think this video moves? | 모션은 Claude Opus가 코드로. 이 영상은 어떻게 움직일까요? |
| 31 | ch04 | 151.0 (25.0) | *(new cue)* | Now, earn their trust. | 이제 신뢰를 얻을 차례예요. |
| 32 | ch05 | 155.0 (1.0) | Expertise is the meal. Humor is the seasoning. | Expertise is the meal. Humor is the seasoning. (unchanged) | 전문성은 본 요리, 유머는 양념. |
| 33 | ch05 | 158.1 (4.1) | Show your work. People trust effort they can see. | Show your work; visible effort earns trust. | 과정을 보여 주세요. 보이는 노력이 신뢰가 돼요. |
| 34 | ch05 | 160.8 (6.8) | Five reviews? Buying gets 270% more likely. | Five reviews, not zero? Purchase likelihood up 270%. | 후기 0개보다 5개면? 구매 가능성 270% 상승. |
| 35 | ch05 | 164.9 (10.9) | Humor? 91% prefer funny brands. 72% pick them over rivals. | Oracle: 91% prefer funny brands; 72% would pick them over rivals. | 오라클 조사: 91%는 재밌는 브랜드 선호, 72%는 경쟁사 대신 선택. |
| 36 | ch05 | 170.7 (16.7) | One rule: joke about the situation, never the customer. | Rule: joke about the situation, never the customer, Uchal. | 규칙: 상황은 비틀어도, 고객은 놀리지 않기. 알았지, 우찰? |
| 37 | ch05 | 174.3 (20.3) | Like this: 'Noa's rendering. Coffee number two.' Progress, plus a smile. | 'Noa's rendering, coffee number two.' Claude wrote that. Now, money. | ‘노아 렌더링 중, 커피 두 잔째.’ Claude 작품. 이제 돈 얘기. |
| 38 | ch06 | 181.0 (1.0) | Remember that button I promised? Here's how it turns into money. | Remember Noa's envelope? It all comes down to one button. | 노아의 봉투 기억나요? 결국 버튼 하나에 달렸어요. |
| 39 | ch06 | 187.0 (7.0) | Revenue is visitors, times conversion, times order value. | Revenue is visitors, times conversion, times order value. (unchanged) | 매출 = 방문자 × 전환율 × 객단가. |
| 40 | ch06 | 190.6 (10.6) | Add one point of conversion: 2.7 million won becomes 4.5 million. | Say conversion rises one point: 2.7 million won becomes 4.5. | 전환율이 1%p 오르면: 270만 원이 450만 원으로. (예시) |
| 41 | ch06 | 196.1 (16.1) | That's the button: one clear call to action, plus a soft one for maybe-laters. | That's the button. Tomorrow: Claude writes yours. One main, one 'maybe later.' | 그게 그 버튼. 내일은 Claude와 써 보세요: 메인 하나, ‘나중에’ 하나. |
| 42 | ch06 | 201.6 (21.6) | Noa's cheeks? Already full. | Noa's cheeks? Already full. | 노아 볼주머니요? 벌써 꽉 찼어요. |
| 43 | ch07 | 205.0 (1.0) | The next page's hero? Your brand. Go build it. Noa's got the curtain. | Next hero: your customer. See Noa's page live, then publish yours on Higgsfield. | 다음 주인공은 고객. 노아 페이지 보고, 내 것도 Higgsfield로! |
