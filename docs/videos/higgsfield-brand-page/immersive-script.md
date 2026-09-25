# 대본 — 사람을 붙잡는 브랜드 페이지 (Claude × Higgsfield)

**길이** 약 3분 12초 · **형식** 1920×1080 모션 그래픽 · **가이드 캐릭터** 노아(Noa): 베레모·골드 스카프, 전편 동일 디자인
**레퍼런스** 제가 만든 페이지 `noainostory.higgsfield.app`이 4번 등장 (01·02·06장 + 오프닝)

> 핵심 메시지: 몰입형 브랜드 페이지는 **업종을 가리지 않는다**. 흐름은 **고객이 주인공인 이야기**로 잡고, 사람은 **Soul ID·레퍼런스로 일관되게**, 몰입은 **속도·스크롤·영상**으로, 신뢰는 **전문성 + 유머**로 만들고, 마지막엔 **행동(CTA) → 매출**로 연결한다.

---

## 00 · 오프닝 (0:00–0:10)
- **화면**: 암전 → 타이머 `0.000 → 0.050s` → 레퍼런스 페이지가 번쩍 → 노아 등장.
- **노아**: "안녕, 난 노아. 첫인상은 0.05초면 끝나."
- **내레이션**: 방문자는 0.05초 만에 페이지의 인상을 정합니다. 그 0.05초를 붙잡는 페이지, Claude와 Higgsfield로 만듭니다.
- **근거**: Lindgaard et al., 2006. 50ms 노출만으로 시각적 매력 판단이 500ms 판단과 높은 상관.

## 01 · 누구를 위한 페이지인가 (0:10–0:40)
| 업종 | 화면 | 내레이션 |
|---|---|---|
| 에이전시 | 필름 쇼릴이 흐르는 포트폴리오 + "상담 예약" | 에이전시라면, 포트폴리오가 곧 쇼릴이 됩니다. |
| 온라인 쇼핑몰 | 제품이 회전, 별점 4.6, 장바구니 담기 → 카운트 +1 | 쇼핑몰이라면, 제품이 화면 안에서 움직입니다. |
| 오프라인 매장 | 가게 외관, 핀이 튀고 "영업 중 · 도보 3분 · 길찾기" | 매장이라면, 검색에서 방문까지 한 번에. |
| 인플루언서 | 프로필 + 공구·신상 영상·팝업 링크 | 인플루언서라면, 링크 하나가 나만의 매장이 됩니다. |
- **레퍼런스 컷**: 제가 만든 페이지가 크게 스크롤. 노아가 가리킴.
- **노아**: "이게 실제로 만든 페이지야."

## 02 · 전체 흐름 잡기 (0:40–1:12)
- **화면**: 왼쪽에 이야기 곡선(주인공 → 문제 → 가이드 → 3단계 계획 → 행동 → 성공). 오른쪽 페이지 섹션이 순서대로 켜짐.
- **노아**(삐친 표정): "주인공은 내가 아니라… 손님이래."
- **내레이션**: 페이지의 주인공은 브랜드가 아니라 고객입니다. 고객의 문제를 먼저 말하고, 우리는 길잡이로 등장해 세 단계 계획과 분명한 버튼을 건넵니다.
- **근거 자막**: StoryBrand SB7 (Donald Miller). 인터랙티브 비주얼 체류시간 +62%, 스크롤 깊이 +317% (Infogram × DC Thomson, 2015).
- **레퍼런스 컷**: 제 페이지를 스크롤하며 `훅 · 증거 · 행동` 라벨이 붙음.

## 03 · 사람(캐릭터) 일관성 (1:12–1:46)
- **개그**: 영상 3컷을 뽑았더니 노아가 컷마다 다른 얼굴(파란 몸, 안경, 삐죽 머리). 진짜 노아: "…누구세요?" 셋이 동시에 "나야."
- **해결 5단계** (화면에 차례로):
  1. **캐릭터 시트** (Higgsfield Cinema Studio 기준): 회색 무지 배경 한 장에 3컷. ① 얼굴 클로즈업(얼굴+어깨, 정면, 차분한 시선)이 얼굴을 고정하고, ② 전신 앞(머리부터 신발까지, 똑바로 선 자세, 팔은 편하게, 카메라 정면) ③ 전신 뒤(같은 자세, 뒤돌아선 모습)가 의상과 비율을 고정. 이 레퍼런스 한 장이 수십 컷에 걸쳐 얼굴·의상·비율을 유지시킨다. 건너뛰면 새로 생성할 때마다 인물이 새로 만들어진다. 출처: [Higgsfield Academy · Character sheets in Soul Cinema](https://higgsfield.ai/academy/courses/santiago-cinematic/character-sheets-in-soul-cinema)
  2. **Soul ID**: 같은 사람 사진 20장 이상 → 약 3~5분 학습 → 이름 붙여 저장
  3. **Reference Element**: 저장한 얼굴을 Kling 3.0·Seedance 2.0 영상에 그대로 재사용
  4. **의상·헤어 고정**: 프롬프트마다 반복 + 네거티브 프롬프트로 변형 차단
  5. **시드보다 레퍼런스**: 시드는 약한 신호, 레퍼런스 이미지가 강한 신호
- **결과**: 배경·앵글이 달라도 같은 노아. "이제 어디서든 나야."

## 04 · 몰입감 만들기 (1:46–2:14)
1. **3초 안에**: 로딩 1→3초면 이탈 확률 +32%, 3초 넘으면 모바일 방문자 53%가 떠남 (Google). 노아가 발을 동동.
2. **스크롤할 때마다 무언가 움직인다**: 스크롤에 맞춰 레이어가 움직이는 폰 화면.
3. **히어로엔 영상**: 85%가 영상을 보고 구매를 결심한 적 있음 (Wyzowl, 2026).
4. **애니메이션은 Opus에게**: 코드가 타이핑되고 박스가 부드럽게 움직임. 노아: "이 영상도 Claude가 코드로 움직였어."
   - 근거: Anthropic은 Opus 5 발표에서 "Opus 모델 중 가장 좋은 애니메이션·게임·3D 작업"이라고 밝힘.

## 05 · 전문성과 유머 (2:14–2:40)
- **화면**: 저울. 왼쪽 접시 **전문성**, 오른쪽 접시 **유머**.
  - 전문성: *과정을 보여준다* (노동의 착시, Buell & Norton 2011) · *숫자와 결과* · *후기 5개면 구매 가능성 +270%, 별점은 4.0~4.7이 최고* (Spiegel Research Center)
  - 유머: 91%가 재밌는 브랜드를 선호, 72%는 유머 있는 브랜드를 선택, 90%는 웃긴 광고를 더 기억 (Oracle Happiness Report)
- **규칙**: "상황은 비틀되, 고객은 놀리지 않는다." (양성 위반 이론, McGraw & Warren 2010) · 전문성은 본문, 유머는 양념(로딩·버튼·404).
- **예시 화면**: 로딩 카드 `노아가 브랜드 영상 렌더링 중… (커피 2잔째 ☕)` + 진행 단계 표시 = 과정 공개 + 유머를 한 화면에.

## 06 · 결국, 매출로 (2:40–3:04)
- **화면**: 깔때기. 방문 → 몰입 → 신뢰 → 행동 → 매출. 바닥으로 동전이 떨어지고 노아가 받음.
- **공식**: 방문자 × 전환율 × 객단가 = 매출. 예시: 3,000명 × 1.5% × 60,000원 = 2,700,000원 → 전환율 2.5%면 4,500,000원 *(예시 수치)*.
- **업종별 CTA**: 에이전시 "상담 예약" · 쇼핑몰 "장바구니" · 매장 "길찾기·예약" · 인플루언서 "공구 링크". 바로 사지 않을 사람에겐 보조 CTA(카탈로그·쿠폰·뉴스레터).
- **레퍼런스 컷**: 제 페이지의 마지막 행동 유도 구간.

## 07 · 엔딩 (3:04–3:12)
- **노아**가 인사. "다음 페이지의 주인공은 당신 브랜드."
- 요약 칩 6개 + `noainostory.higgsfield.app`

---

## 레퍼런스 교체 방법
화면 속 레퍼런스 페이지는 `ref/page.png`(제 홈페이지 **전체 페이지 스크린샷**, 폭 1440px 권장)를 불러옵니다. 파일이 없으면 예시 목업이 대신 나옵니다. 스크린샷을 넣고 다시 렌더링하세요:

```bash
node render.cjs 30 immersive.mp4 immersive-film.html
```

`immersive-film.html` 상단의 `REF_MARKS`로 `훅/증거/행동` 라벨 위치(페이지 높이 대비 비율)를 조정합니다.

## 출처
- Lindgaard, G. et al. (2006). *Attention web designers: You have 50 milliseconds to make a good first impression!* Behaviour & IT 25(2). https://www.tandfonline.com/doi/abs/10.1080/01449290500330448
- StoryBrand SB7 framework (Donald Miller). https://umbrex.com/resources/frameworks/marketing-frameworks/storybrand-sb7-framework/
- Scrollytelling 체류시간·스크롤 깊이 (Infogram × DC Thomson 2015, 인용). https://scrollytelling.ai/what-is-scrollytelling/
- Higgsfield Academy, Character sheets in Soul Cinema (회색 배경 3컷 캐릭터 시트). https://higgsfield.ai/academy/courses/santiago-cinematic/character-sheets-in-soul-cinema
- Higgsfield Soul ID. https://higgsfield.ai/blog/Soul-ID-AI-Character-Consistency · https://higgsfield.ai/blog/sould-id-best-character-consistency
- Kling 3.0 캐릭터 일관성 (레퍼런스 4컷, Elements, 시드 vs 레퍼런스). https://www.atlascloud.ai/blog/guides/how-to-use-kling-3.0-for-character-consistency · https://www.neolemon.com/blog/kling-ai-grok-ai-character-consistency-tips/
- Google 모바일 로딩 속도와 이탈. https://www.marketingdive.com/news/google-53-of-mobile-users-abandon-sites-that-take-over-3-seconds-to-load/426070/
- Wyzowl Video Marketing Statistics 2026. https://wyzowl.com/video-marketing-statistics/
- Anthropic, Introducing Claude Opus 5. https://www.anthropic.com/news/claude-opus-5
- Buell & Norton (2011). *The Labor Illusion.* Management Science 57(9). https://www.hbs.edu/faculty/Pages/item.aspx?num=40158
- Spiegel Research Center, *How Online Reviews Influence Sales.* https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/
- Oracle Happiness Report (Marketing Dive 보도). https://www.marketingdive.com/news/happiness-marketing-brand-consumer-oracle/625554/
- McGraw & Warren (2010). *Benign Violations.* Psychological Science. https://journals.sagepub.com/doi/abs/10.1177/0956797610376073
