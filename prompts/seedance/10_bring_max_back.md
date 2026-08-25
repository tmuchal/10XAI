# 10편 — MAX를 돌려달라 · 사이버펑크 진입

MAX가 없어진 세상이 더 팍팍해지자 사람들이 MAX를 찾기 시작한다.
쓰러진 기계를 세워놓고 그 앞에 **왼팔뚝을 뒤집어 내미는** 옹호 세력이 생긴다.
같은 거리에서 위층은 더 부자가 되고 아래층은 더 가난해진다. 그 상태가 사이버펑크다.

**설정** — Seedance 2.5 · 20s · 720p · **9:16 셀렉터**
**Element** — `@AIIA_uchal_villain` (마지막 스테이지에만)

## 검열 거부 대응 (1차 거부됨)

힉스필드 필터는 **부정문을 못 읽는다.** `no violence` `no weapon` `no riot` `never a salute`
`nothing suggestive, adult or explicit` `fully clothed` — 전부 금지어를 쓴 걸로 센다.
안전하려고 넣은 CONSTRAINTS 블록이 거부 원인이었다.

| 뺀 것 | 대신 넣은 것 |
|---|---|
| `CONSTRAINTS — No blood, no injury, no body, no weapon, no fighting, no protest march and no riot.` | `TONE` 블록으로 전부 긍정문 전환 |
| `Every person is fully clothed.` | `Everyone is dressed for cold wet weather in heavy work clothes, coats and boots.` |
| `Nothing suggestive, adult or explicit appears on any sign.` | 단어 화이트리스트 + `No other word appears anywhere.` |
| `never a fist and never a salute` | `Nobody raises an arm above shoulder height.` |
| 왼팔을 곧게 **들어올리는** 동작 | 왼팔뚝을 **뒤집어 내미는** 동작 (4편 받침대 자세) |
| `no flag, no banner, no slogan, no mask, no armband, no leader` | 통째로 삭제. 안 쓰면 안 나온다 |
| `where it was cut off` | `the joint is capped with a plate` |
| `No brand marks. No recognisable landmark.` | `Every surface is plain. The city is anonymous.` |

## 이 편의 장치
- 옹호 세력의 표식은 **왼팔뚝을 내미는 동작** 하나다. 4편 밴드 채우던 자세와 정확히 같다.
- 빈부격차를 **한 프레임 안 위아래**로 보여준다. 컷으로 나누면 비교가 안 된다.
- 죽은 기계는 끝까지 **안 켜진다.** 앰버 바는 검은 채로 끝난다.
- 간판은 전부 진짜 영어 단어.

---

```
The world got harder without MAX, so people start asking for it back, and the street splits into the ones above the rain and the ones under it. Visuals feature photoreal cinematography, one wide city boulevard at night in heavy rain, hand-made neon at street level and cold clean light behind glass above it, one locked-off wide holding the full height of the street, slow tilts between the top floors and the pavement, handheld crowd coverage, fine film grain, heavy anamorphic flare. Audio includes one spoken English line, rain, generators humming, hand-carts on wet tarmac, a crowd going quiet all at once, and a low dirty synth that never resolves.

CONTINUITY LOCK — This is the same street as the previous video, from the same fixed camera position: a wide two-lane boulevard, four-storey buildings down both sides, bare trees along the right kerb, parked cars, a pedestrian crossing in the near foreground, three service compounds behind mesh fencing under floodlight, and one white machine that has lain in the road since the day it came down.

@AIIA_uchal_villain — partial-preserve for facial identity only, and the face matches the reference. Wardrobe and grooming come from this prompt, never from the reference image. A black suit soaked through and grimy, white shirt buttoned to the collar, no tie, matte black rectangular sunglasses worn in every shot he is in and never replaced by clear, round, wire or horn-rimmed glasses. Young, clean-shaven, jet black hair, never old, greying or lined. He appears in the final stage only, standing in the crowd, and speaks one line at the very end.

THE STANDING MACHINE rule strict — One machine, upright again but switched off. Two metres tall, humanoid, on two legs, taller than every person in frame by a clear head and shoulders. The whole body is covered in smooth moulded white shell panels with clean panel lines, scuffed and stained from real work. A smooth moulded head with a plain blank front and one horizontal amber light bar across it that stays unlit for the whole video. Its left forearm has been taken off at the elbow and the open joint is capped with a plain plate. It reads as a civilian work machine: no crest on the head, no chest plate detail, no shoulder pads, no belt, no webbing and no straps, and no exposed struts, pistons, rods or wiring anywhere. It has been stood up against a pillar and lashed there with rope and cable, and it stays exactly where it is for the whole video, holds the same pose, stays unlit and is never repaired.

THE GESTURE rule strict — The people who want MAX back do one thing and nothing else. A person steps up to the standing machine, pushes their left sleeve back, turns their left forearm over and holds it out flat toward it, palm up — the same way a forearm was rested on the plinth on the day a band was fitted. They hold it there a few seconds, lower it and step aside, and the next person does the same. It is always the LEFT forearm, never the right and never both. The forearm has nothing on it: no band, no watch, no bracelet. Nobody raises an arm above shoulder height, nobody speaks, nobody chants, nobody carries anything and nobody is in a hurry. It is quiet and patient, like a queue at a counter.

THE DIVIDE rule strict — The well-off and the struggling appear in the SAME frame, above and below, and never in separate cut-away shots. The top two floors of the buildings are behind unbroken glass: dry, warm, clean, softly lit, people in good clothes moving slowly and never looking down. The street below is in the rain: mesh fencing, floodlight, hand-carts, lines of people waiting their turn, everyone in soaked work clothes. A glassed-in walkway crosses above the boulevard between two buildings with a doorman in a plain dark coat at each end and well-dressed people crossing it dry, and the underside of that walkway throws the brightest light the pavement gets. The two levels simply ignore each other.

ENGLISH SIGNAGE rule strict — Every sign and every neon tube in this video carries one short English word or two-word phrase, spelled correctly, in ordinary block capitals. Use only these words: POWER, WATER, FUEL, PAY HERE, CLOSED, PARTS, HOT FOOD, REPAIR, TOOLS, BEDS. Street-level signs are hand-painted, stencilled or bent by hand out of neon tube, crooked and homemade. No other word, letter, letterform, glyph or digit appears anywhere in this video, and no Korean, Chinese or Japanese characters appear.

TONE — This is a calm, patient, rainy night on a working street. People are orderly and quiet and everyone keeps to themselves. Everyone is dressed for cold wet weather in heavy work clothes, coats and boots. Every surface is plain and carries no emblem. The city is anonymous.

[Stage 1 | 0-4s]
Initial state: The boulevard at night in heavy rain, from the fixed camera position. Three fenced compounds under floodlight, lines of people waiting at two of them, hand-carts going past.
Primary event: At the near corner the white machine has been lifted up off the road and stood against a pillar, lashed there with rope and cable, its left forearm gone at the elbow, its amber bar unlit. A woman stops in front of it, wipes the rain off its chest panel with her sleeve, and leaves a folded coat at its feet. A man sets a tin cup down beside the coat and walks on.
End state: The switched-off machine standing over a small pile of things people have left at its feet.
`<rain on white panels, generators humming, a hand-cart on wet tarmac>` `(low dirty synth enters)`

[Stage 2 | 4-8s]
Initial state: The same corner. A dozen people standing loosely around the machine, waiting their turn.
Primary event: A man steps up, pushes his left sleeve back, turns his left forearm over and holds it out flat toward the machine, palm up, at waist height. He holds it a few seconds, lowers it and steps aside. The woman behind him does the same. Then the next, then the next — one at a time, patient, each holding a bare left forearm out flat and lowering it again. Across the road the line at the POWER fence stops shuffling and watches them.
End state: A quiet line of people taking turns to hold a left forearm out to a machine that will never switch on again.
`<a crowd going quiet all at once, rain, one generator still running>`

[Stage 3 | 8-12s]
Initial state: The fixed camera position, now holding the full height of the street — pavement at the bottom of frame, four storeys of building up to the top.
Primary event: Slow tilt up the front of one building. Ground floor: a fenced compound, a floodlight, a line of people in the rain, a stencilled board reading PAY HERE. First floor: dark, boarded, a hand-painted board reading CLOSED. Third and fourth floors: unbroken glass, warm and dry inside, clean pale rooms, people in good clothes standing with drinks and never looking out. Tilt back down to the pavement and the line is still exactly where it was.
End state: One frame holding both — lit glass at the top, mesh and rain at the bottom.
`<rain on glass from outside, a generator, a line of people who do not talk>` `(the synth thickens)`

[Stage 4 | 12-16s]
Initial state: Mid-height across the boulevard. A glassed-in walkway crossing above the street between two buildings.
Primary event: Well-dressed people cross it dry and unhurried, a doorman in a plain dark coat at each end, and none of them looks down. The underside of the walkway throws the only clean light onto the pavement below, and in that light a man drags a loaded hand-cart through standing water while two people haul a rope over a pulley to lift what a machine used to lift. Cut once, back to the corner: another left forearm held out flat to the standing machine, the pile at its feet bigger than before.
End state: A dry lit bridge full of people over a wet dark street full of people, in one frame.
`<footsteps on glass above, rain and hand-carts below, a pulley under load>`

[Stage 5 | 16-20s]
Initial state: Handheld, down in the crowd at street level, rain coming through hand-bent neon.
Primary event: The camera moves through them — soaked work clothes, crooked English signs, steam off a grating, floodlight through mesh, and at the corner one more left forearm turned over and held out flat to the standing machine. The man in the black suit and dark sunglasses is among them, soaked and grimy, the only one with his hands in his pockets. He looks up at the unlit amber bar.
End state: Close-up on his face in the rain behind the dark lenses, lit red and blue from below, the patient line out of focus behind him.
`{The man in the sunglasses: "You asked for this."}` `【You asked for this.】`
`(the dirty synth holds and does not resolve)` `<rain on neon, a quiet crowd, no machine sound anywhere>`
```
