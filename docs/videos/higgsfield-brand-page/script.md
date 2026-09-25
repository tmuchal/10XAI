# 대본 — Claude × Higgsfield로 만든 브랜드 비즈니스 페이지

> **Archived script.** This describes the retired v1 explainer render (`explainer.html` / `render.cjs`, removed). The current film is `film/` (see `README.md`).

**길이** 약 66초 · **형식** 1920×1080 모션 그래픽 · **예시 주소** `noainostory.higgsfield.app`

> 한 줄 요약: **Claude가 브랜드와 대본을 쓰고 → Higgsfield가 영상·이미지를 만들고 → 한 페이지로 조립하면 → Higgsfield가 바로 호스팅한다.** 서버·도메인·배포 설정이 따로 필요 없다.

| # | 시간 | 화면 | 내레이션 (KO) | 자막 (EN) |
|---|---|---|---|---|
| 0 | 0:00–0:07 | 완성된 브랜드 페이지. 히어로 영상이 재생되고 워드마크가 떠오른다 | 이 페이지, 코드 한 줄 없이 Claude와 Higgsfield로 만들었습니다. | Built with Claude + Higgsfield, no code. |
| 1 | 0:07–0:16 | 좌: 회색 템플릿 홈페이지 / 우: 컬러·타이포·영상이 들어간 브랜드 페이지 | 평범한 홈페이지가 아니라, 브랜딩이 입혀진 비즈니스 페이지입니다. | Not a template homepage: a branded business page. |
| 2 | 0:16–0:27 | Claude 대화창. 요청 → 브랜드 키트(컬러·서체·슬로건)와 히어로 영상 대본이 생성된다 | 먼저 Claude에게 브랜드를 설명하면, 컬러와 서체, 카피, 그리고 영상 대본까지 한 번에 잡아줍니다. | Claude writes the brand kit, the copy, and the video script. |
| 3 | 0:27–0:39 | Higgsfield 생성 화면. 대본이 프롬프트로 넘어가고, 브랜드 컬러의 이미지가 렌더된 뒤 한 컷이 영상으로 움직인다 | 그 대본으로 Higgsfield가 브랜드 톤에 맞는 이미지와 영상을 만듭니다. | Higgsfield turns the script into on-brand images and video. |
| 4 | 0:39–0:50 | 빈 와이어프레임에 히어로 영상·소개 이미지·서비스 카드·CTA가 차례로 들어간다 | 만든 영상과 이미지를 그대로 페이지에 넣으면, 한 장짜리 브랜드 페이지가 완성됩니다. | Drop the assets in: hero film, about, services, contact. |
| 5 | 0:50–0:59 | Publish 버튼 → 주소창에 `noainostory.higgsfield.app` 강조 | 배포는 따로 할 필요 없습니다. Higgsfield에서 바로 호스팅돼서, 이 주소로 곧장 열립니다. | No separate deploy: Higgsfield hosts it at *.higgsfield.app. |
| 6 | 0:59–1:06 | 요약 3단계 + 주소 | 대본은 Claude, 영상과 이미지는 Higgsfield, 주소까지 한 번에. | Script → visuals → live page, in one flow. |

## 촬영/녹음 메모

- 내레이션은 장면당 한두 문장이라 1.0배속 한국어 기준 각 장면 길이에 맞습니다. 녹음 후 `explainer.mp4`에 오디오만 얹으면 됩니다:
  `ffmpeg -i explainer.mp4 -i narration.m4a -c:v copy -c:a aac -shortest final.mp4`
- 화면 속 브랜드(NOAINO STORY)의 컬러·카피·이미지는 **예시**입니다. 실제 페이지의 로고, 컬러, 섹션, 영상 컷을 주시면 그대로 바꿔 넣을 수 있습니다.
- Higgsfield 생성은 크레딧을 씁니다. 스틸로 룩을 먼저 확정하고, 고른 컷만 영상으로 돌리는 순서가 가장 저렴합니다.
