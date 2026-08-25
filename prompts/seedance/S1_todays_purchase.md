# 스핀오프 1편 — 오늘 너는 이걸 산다

본편 세계관 그대로, 톤만 코미디. 1편에서 만든 그 AI가 개인 한 명한테 붙으면 이렇게 된다.

**설정** — Seedance 2.5 · 20s · 720p · **9:16 셀렉터** · Element `@AIIA_uchal_villain`

## 2차 거부 대응 — 부정문을 아예 안 쓴다

1차 거부 때 안전 단어(`no violence` 등)만 뺐는데 또 막혔다. 원인을 다시 잡았다.

**부정문 자체가 문제다.** `no hologram` `no arrow` `no cameras` `no automated tills`
`never rains` — 필터는 부정을 못 읽으니 이건 그냥 그 명사들을 프롬프트에 심는 거다.
60개쯤 쌓이면 걸린다. 그래서 이 버전은 **부정문을 거의 안 쓴다.** 있는 것만 서술한다.

| 뺀 것 | 왜 |
|---|---|
| **침대에서 자는 장면** | `young` + 침대. 어느 필터에서든 1순위. 주방으로 옮김 |
| `Young, clean-shaven` | 나이·신체 서술. `the same age as the reference image` 로 대체 |
| `no cameras` `no automated tills` `no robots` | 안 쓰면 안 나온다 |
| `never blinks, never moves, never scans, never projects` | `small, warm and steady` 하나로 |
| `It never becomes a neon street, never becomes night, never rains` | `bright weekday daytime throughout` |
| `no screen, no hologram, no arrow, no highlight box, no floating marker` | `built into the shelf edge` 로 위치를 못박음 |

프롬프트 길이가 절반이 됐다. 짧을수록 스테이지 지시가 살아난다.

## 개그 엔진
- 밴드는 **글자를 안 띄운다.** **선반 위 물건 딱 하나에 불이 들어온다.**
- 거부 → 다른 가게 → **거기서도 같은 게 켜진다.**
- 홧김에 아무거나 집는다 → **그것도 켜진다.**
- 그가 끝까지 정색. 선글라스도 안 벗는다. 진지할수록 웃긴다.
- 본편이랑 룩을 정반대로: **밝은 낮, 형광등, 진짜 편의점.** 느와르 들어가면 안 웃김.

---

```
A man tries to buy something the system did not already know he would buy, and loses. Visuals feature photoreal cinematography, a bright weekday morning, a small kitchen, then three ordinary convenience shops under flat white fluorescent light. Deadpan locked-off framing, one macro insert of a wrist, quick cuts along the shelves, a slow push in at the end, fine film grain. Audio includes two spoken English lines, a small soft chime, a shop door bell, fridge hum, a barcode beep, and a light comic synth that keeps restarting.

@AIIA_uchal_villain — partial-preserve for facial identity only, and the face matches the reference in every shot. Wardrobe comes from this prompt: a plain black t-shirt, a plain black jacket, matte black rectangular sunglasses in every single shot, and a slim matte chrome band on the LEFT forearm just above the wrist. He stays exactly the age he is in the reference image. He keeps a completely straight face for the whole video and looks at the camera once, in the final shot.

THE BAND — A slim matte chrome band on the LEFT forearm just above the wrist, as thin as a watch strap and just as plain, carrying one small amber dot. The dot glows steadily while a shelf light is on and goes dark once he has paid. That is everything it does.

THE MARK rule strict — This is the only way the system speaks. In each shop exactly ONE item is lit from underneath by a small warm amber light built into the shelf edge, and every other item on that shelf sits in plain fluorescent light. It is always the same item: one plain cup noodle pot with a blank label. The light is small, warm and steady, and it stays put in the shelf edge.

ORDINARY PLACES rule strict — Every location is an ordinary present-day place in daylight: a small kitchen, then three small convenience shops under flat white fluorescent light, each with a humming drinks fridge, wire baskets, a snack aisle and one bored assistant behind the counter. Everything in frame is present-day and everyday, and it stays bright daytime from the first shot to the last.

ENGLISH SIGNAGE rule strict — Every sign in this video carries one short English word or two-word phrase in ordinary block capitals, spelled correctly. Use only these words: OPEN, HOT FOOD, DRINKS, ICE, PAY HERE. All product packaging is plain coloured card with a completely blank face. These are the only words that appear anywhere in this video.

TONE — Deadpan comedy played completely straight, on a bright quiet weekday morning. He is dignified and mildly annoyed about the whole thing. Everyone else is bored and ordinary and nothing unusual happens to anybody.

[Stage 1 | 0-4s]
Initial state: A small ordinary kitchen in morning light. He stands at the counter in the black jacket and the sunglasses waiting for a kettle, his LEFT sleeve pushed back.
Primary event: A soft chime. Macro, filling the frame: the small amber dot on the band lights and holds steady. He looks down at his own wrist for a long flat beat.
End state: He pulls his sleeve down over it, picks up his keys and walks out of the door.
`<a soft chime, a kettle, morning traffic outside, a door>` `(light comic synth enters)`

[Stage 2 | 4-8s]
Initial state: A small bright convenience shop, flat fluorescent light, a drinks fridge humming, a bored assistant on his phone behind the counter.
Primary event: The door bell goes. The moment he walks in, one small warm amber light comes on in the shelf edge under a single plain cup noodle pot halfway down the snack aisle, and the rest of the shelf stays in plain fluorescent light. He looks at it. He looks at his own wrist. He walks straight past it, takes a completely different item off the far end of the aisle and drops it into a wire basket without his expression moving at all.
End state: The little amber light under the noodle pot is still on behind him.
`{The man in the sunglasses: "No."}` `【No.】`
`<a shop door bell, a fridge humming, a wire basket>`

[Stage 3 | 8-12s]
Initial state: The pavement outside in bright daylight. He walks fast with a plastic bag.
Primary event: He goes into a completely different shop three streets away — different colour, different layout, different assistant. The door bell goes. One small warm amber light comes on in the shelf edge under exactly the same plain cup noodle pot. He stops dead in the doorway. Tight shot of his face, absolutely straight, sunglasses on. Back to the light. He turns around and walks straight back out.
End state: The door swinging shut behind him with the little light still on inside.
`<a door bell, fast footsteps, a door swinging>` `(the synth restarts, cheerier)`

[Stage 4 | 12-16s]
Initial state: A third shop. He walks in like a man who has decided something.
Primary event: He goes straight past the aisle to the counter, reaches out without looking and takes the first thing within arm's reach off the rack beside the till — a plain packet — and puts it down in front of the assistant. He folds his arms and waits. The assistant scans it. A barcode beep.
End state: He has bought something nobody could have predicted, and he almost looks satisfied.
`<a counter, a packet set down, a barcode beep>`

[Stage 5 | 16-20s]
Initial state: The counter, the packet sitting on it, his hand still on it.
Primary event: A small warm amber light comes on in the counter edge directly under the packet he just grabbed. Slow push in on it. Then the macro insert: the small dot on his LEFT band glowing steadily, and as the assistant hands him the bag it goes dark. Push in on his face.
End state: He looks up and straight down the lens for the first and only time, completely straight-faced, sunglasses on, a plastic bag in his hand.
`{The man in the sunglasses: "It already knew."}` `【It already knew.】`
`<a barcode beep, a plastic bag, a fridge humming>` `(the comic synth stops dead on one note)`
```

---

## 이것도 막히면

프롬프트 문제가 아닐 수 있다. 확인 순서:

1. **거부 문구를 그대로 보기.** 힉스필드는 보통 카테고리를 준다 (violence / sexual / minors / public figure). 그게 어느 쪽인지에 따라 고칠 데가 완전히 다르다.
2. **엘리먼트를 빼고 프롬프트만** 돌려본다. 통과하면 원인은 프롬프트가 아니라 엘리먼트다.
3. 엘리먼트가 원인이면 **핸들 이름 `villain`** 을 의심한다. 같은 사진으로 이름만 다르게 엘리먼트를 새로 만들어 테스트.
4. 그래도 막히면 **스테이지 1개짜리**로 잘라서 어느 스테이지가 걸리는지 이분 탐색.

## 다음 편 후보
- **안 열리는 문** — 모든 보안을 뚫는 칩이 금고도 사일로도 여는데, 당기는 유리문만 못 연다
- **면접** — 2미터 MAX 유닛이 사람 일자리 면접을 보러 와서 사무실 의자를 부순다
- **엘리베이터** — 유닛이 배달을 하는데 엘리베이터에 안 들어간다. 계단 40층
- **선글라스** — 아무도 그 선글라스를 못 벗긴다
