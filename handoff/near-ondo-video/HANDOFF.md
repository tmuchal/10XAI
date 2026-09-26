# 작업 지시서 — NEAR / Ondo 설명 영상 v3 → v4 (NEAR 재구성)

이 폴더 하나로 작업을 이어갈 수 있습니다. 새 터미널에서 이 폴더를 열고, Claude Code에 **"HANDOFF.md 읽고 이어서 작업해"**라고 지시하면 됩니다.

---

## 0. 한 줄 요약
NEAR 가격 급등(2026년 9월)과 Ondo × BlackRock 인텔리전트 포트폴리오를 다루는 약 3분짜리 설명 영상 두 편이 v3로 완성되어 있습니다.
**이번 작업: NEAR 영상 구성이 어색하다는 피드백이 있었습니다. 스토리보드 리뷰(`v3/near-storyboard.html`)에서 제안한 6막 구조로 NEAR를 다시 만들고 MP4로 다시 렌더링해 주세요.**
Ondo는 현재 버전을 유지합니다. 수정 요청이 오면 같은 방식으로 작업합니다.

## 1. 사용자 요구사항 (반드시 지킬 것)
- **캐릭터**
  - 주인공은 **우체이(Uchay)**: 빨간 안테나 슈트에 초록색 얼굴. 참고 이미지는 `ref/uchu.jpg`, `ref/uchu2.jpg`.
  - 조연은 **노아(Noa)**: 선글라스를 쓴 햄스터. 참고 이미지는 `ref/ham.jpg`.
  - 캐릭터는 **날씬하게** 그립니다. 뚱뚱하다는 피드백이 있었습니다. 사용자가 참고로 준 `theater-final-preview.mp4`는 이 폴더에 없으니 필요하면 사용자에게 요청하세요.
- **음성과 자막:** 음성은 **영어**, 자막은 **영어와 한국어 통합 자막**입니다. 하단 네이비 바에 영어는 흰색, 한국어는 노란색으로 넣습니다. 한국어 문장은 자연스럽고 정확해야 합니다.
- **톤:** **밝게.** 어두운 화면은 쓰지 않습니다. 파스텔 톤 무대를 씁니다.
- **연출:**
  - 무대 하나에 고정된 연극 스타일은 쓰지 않습니다.
  - **배경, 화면, 차트, 그래프가 계속 바뀌면서** 여러 층으로 몰입감 있게 연출합니다.
  - 블렌더 느낌의 모션그래픽을 넣습니다.
- **내용:**
  - 가격 상승을 전문적으로 분석합니다.
  - 팩트체크는 확실하게 합니다.
  - 미래 관점에서 **투자 가치**와 **IT 융합**(AI 에이전트, 인텐트, 토큰화)을 다룹니다.
  - 주장은 "주장값 대 실측값"처럼 숫자로 제시합니다.
  - 영상 끝에 "투자 조언 아님"을 넣습니다.
- **길이:** **3분 이내**입니다.

## 2. 폴더 구조
```
near-ondo-video/
  HANDOFF.md                 ← 이 문서
  v3/                        ← 작업 폴더 (여기서 명령 실행)
    engine3.js               공용 엔진 (세트 8종, 커튼, 캐릭터, 패널, 차트, 카메라, 자막, 리액션캠)
    reaction.js              우체이 풀프레임 리액션 클로즈업
    style3.css               무대와 페이지 스타일
    near3.json / near3.js    NEAR: 챕터·큐(대사) 데이터 / 장면 비주얼
    ondo3.json / ondo3.js    Ondo: 챕터·큐(대사) 데이터 / 장면 비주얼
    *.meta.json              페이지 제목과 소개 문구
    *.sections.html          영상 아래 팩트체크 표와 출처
    build3.py                TTS 길이 측정 → {name}.html, p_{name}.html, rec_{name}.html 생성
    make3.py                 MP4 렌더링 (프레임 캡처 4개 병렬 + 오디오 믹스 + H.264/AAC 인코딩)
    rec3.js                  make3.py가 쓰는 프레임 캡처 스크립트 (make3.py가 다시 생성함)
    shots.js                 확인용 프레임 캡처
    sbshots.js + sb_build.py 스토리보드 생성 (큐마다 프레임 1장 → near-storyboard.html)
    near-storyboard.html     현재 NEAR 스토리보드 리뷰 (진단과 6막 제안 포함)
    sb/                      스토리보드 썸네일
  fonts/                     로컬 폰트 (@fontsource: jua, gaegu, gochi-hand, nunito-sans, ibm-plex-mono, black-han-sans)
  three128/dist/gsap.min.js  로컬 GSAP 3.12.5
  audio/mix.pkl              효과음 샘플 (pop, thump, whoosh, flash). make3.py가 ../audio/mix.pkl로 읽음
  ref/                       캐릭터 참고 이미지
  deliverables/              지금까지 완성한 영상 (near-v3.mp4, ondo-v3.mp4 = 최신, 나머지는 이전 버전)
```
**경로 주의:** `build3.py`와 `make3.py`는 `../fonts`, `../three128`, `../audio`를 상대 경로로 참조합니다. 폴더 구조를 그대로 유지하세요.

## 3. 환경 준비
```bash
# 시스템
espeak-ng                      # TTS (apt install espeak-ng / brew install espeak-ng)
node 18+, python 3.10+
# 노드 (make3.py는 `npm root -g`의 playwright를 씀)
npm i -g playwright && npx playwright install chromium
# 파이썬
pip install imageio-ffmpeg
```

## 4. 빌드와 렌더링 명령 (`v3/`에서 실행)
```bash
python3 build3.py near3              # 예상 길이 출력. 170–180초가 목표
open p_near3.html                    # 브라우저 미리보기 (로컬 폰트와 GSAP 사용)
node sbshots.js && python3 sb_build.py   # 스토리보드 다시 생성 (sb_build.py의 VIS, FLAG, PROPOSED도 갱신)
python3 make3.py near3 near-v4.mp4   # 최종 MP4 (1280×720, 30fps). 약 5,000프레임이라 오래 걸림
```
- `near3.html`은 게시용입니다. CDN의 GSAP과 Google Fonts를 씁니다. `p_*`와 `rec_*`는 로컬 렌더링용입니다.
- 렌더링용 HTML에는 반드시 `<meta charset="utf-8">`가 있어야 합니다. 없으면 한국어가 깨집니다.
- 프레임 폴더 `fr_*`는 수백 MB이니 완료 후 지우세요. **mp4와 프레임은 git에 커밋하지 마세요.**

## 5. 엔진 핵심
- `VIDEO = {chapters, cues}`. 챕터는 `{ko, en, set, sky, src}`이고 set은 city, chart, vault, lab, court, bank, globe, hills 중 하나입니다.
- 큐는 `{id, ch, en, ko, who?('noa'), pose?('wave','point','think'), card?(챕터 타이틀), src?, extra?(추가 초), react?{at, d, mood, ko, en}}`입니다.
- 큐 길이: `max(card ? 2.4 : 2.2, TTS길이 + .3) + extra`. 대사를 줄이면 영상도 짧아집니다.
- 장면 스크립트는 `window.VIDEO.scenes = function(A){...}`입니다. 헬퍼 `A`는 다음을 제공합니다:
  `T(id)`/`E(id)`(큐 시작/끝 시각), `panel(html,{x,y,w})`, `show`, `stagger`, `drawLines`, `growBars`, `reveal`, `count`, `stamp`, `kpop`(한글 팝 텍스트), `burst`(색종이), `bubble(who,text,t0,t1)`, `lineChart`, `barChart`, `gauge`, `needle`, `camTo`, `camReset`.
- 모든 애니메이션은 정지된 GSAP 타임라인을 `window.__v.render(t, talk)`로 탐색해서 그립니다. 그래서 웹 재생과 MP4 결과가 프레임 단위로 같습니다.
- **SVG에 GSAP `transformOrigin`을 쓰지 마세요.** 위치가 어긋납니다. 절차적 transform이나 `smoothOrigin:false`를 쓰세요.
- 알려진 사소한 문제: 스탬프 흔들림이 `#camera`에 걸리는데, render가 이를 덮어씁니다.

## 6. NEAR 현재 구성의 문제 (스토리보드 진단)
- 🔴 **같은 질문을 두 번 답합니다.** 원인 분석(dr1–dr5)과 팩트체크(fc1–fc5)가 따로 있어 반복처럼 느껴집니다.
- 🔴 **숫자 두 개가 충돌합니다.** 9일 +95%와 7일 +80%가 따로 나오고 둘을 설명하지 않습니다.
- 🟠 **챕터 순서에 연결이 없습니다.** 흐름이 기술 → 토큰 → 미래라서 "왜 올랐나"와 "가치가 있나"가 끊깁니다.
- 🟠 **챕터 타이틀 카드 7장이 약 17초**를 차지해 흐름이 끊깁니다.
- 🟠 **노아에게 역할이 없습니다.** 정보를 덧붙이는 대사뿐입니다.
- 🟠 **엔딩(v1–v2)이 dr5를 반복합니다.**

## 7. 목표 구조: 6막, 약 3:00 (노아 = 질문하는 회의론자, 우체이 = 답하는 역할)
| 막 | 시간 | 내용 |
|---|---|---|
| ACT 00 콜드 오픈 | 0:00–0:14 | 9/14 $2.20 → 9/23 $4.29. **9일 +95%와 7일 +80%를 한 차트에서 한 번에 설명.** 노아: "누가 올렸고, 계속 가?" 오늘의 질문 3개(누가? 진짜 가치? 앞으로?) = 이어지는 막 |
| ACT 01 사건 재구성 | 0:14–0:45 | 일별 차트에 사건 핀 표시: 9/17 NEAR@3.33 스냅샷, 9/21 BTC 숏스퀴즈, 9/23 Ondo. 노아: "Ondo는 23일? 이미 다 오른 뒤네." 추세선 돌파, $3.80–3.90 구간, 9/24 이후 가격 |
| ACT 02 용의자 심문 | 0:45–1:35 | 용의자 카드 5장(인센티브, 실사용/인텐트, 시장 흐름, 선물, TVL/Ondo). 각각 주장 → 근거 → 판정 스탬프(강함/부분/미확인/늦음). 팩트체크는 해당 용의자 안에 넣음. 노아: "TVL 3.5억 달러면 대박?" → 가격이 TVL을 부풀리는 구조. 결론은 한 번만: **불씨는 인센티브, 연료는 실사용과 시장** |
| ACT 03 가치가 받쳐주나 | 1:35–2:05 | 인텐트 거래량과 수수료 → 기본 가스비의 70% 소각. 발행 2.5%(연 약 3,200만 개)와 소각량 비교는 **계산 과정을 화면에 공개**. 노아: "수수료가 몇 배가 돼야 순감소야?" |
| ACT 04 미래: AI 에이전트 | 2:05–2:35 | AI 에이전트 → 인텐트 → 솔버 → 35개 이상 체인(TEE 비공개). 샤드 9개, 동적 리샤딩, 1M TPS 테스트 = 에이전트 규모를 감당할 인프라. 노아: "아직 로드맵이니 숫자로 확인해야지"(프로젝트 주장임을 표시) |
| ACT 05 시나리오와 판결 | 2:35–3:00 | 강세/기본/약세 시나리오마다 **판단을 뒤집는 숫자 하나**(체크리스트 겸용). 판결: 인센티브가 불을 붙였고 실사용이 바닥을 받친다. 앞으로 볼 것은 $3.33과 인텐트 수수료. 투자 조언 아님 |

**구현 규칙**
- 커튼 카드는 7장 대신 **짧은 전환 6개**로 줄입니다(`card:true` 큐를 줄이거나 짧게).
- 기존 near3.js의 좋은 장면은 재사용합니다: 히어로 가격 카드, 일별 차트와 밴드·마크, 용의자 보드, 판결 스탬프.
- 큐 id와 챕터를 새로 짜고, `near3.json`, `near3.js`, `near3.sections.html`, `sb_build.py`의 VIS와 FLAG를 새 구조에 맞춥니다.
- 끝나면 `sbshots.js`와 `sb_build.py`로 **새 스토리보드를 만들어 사용자에게 먼저 보여 주고**, 승인을 받은 뒤 MP4를 렌더링합니다.

## 8. 검증된 사실 (출처는 `near3.sections.html`, `ondo3.sections.html`)
**NEAR**
- 가격: 9/14 $2.20, 9/17 $2.87(+14.3%), 9/20 약 $3.45, 9/23 $4.29. 역대 최고가는 $20.44(2022년 1월).
- NEAR@3.33 인센티브: 9/17 스냅샷 $70.79M 시점에 트리거. 333,333 NEAR.
- 인텐트 누적 $31.4B(Dune). 수수료는 주당 약 $2M.
- 시장: BTC 숏스퀴즈 $648M. ZEC $1,600.
- 공급: 인플레이션 5% → 2.5%(2025년 10월 30일), 연 약 3,200만 개 발행. 기본 가스비의 70% 소각.
- 기술: 샤드 9개, 1M TPS 테스트.

**Ondo**
- 9/24 인텔리전트 포트폴리오 출시(BLKHIon, BLKDIGon, BLKGRWon). BlackRock은 **모델 전략만 제공**하고 **MOU 보도는 없음**. 대상은 미국 외 적격 투자자.
- ONDO 하루 약 +18%(일부 +27.5%). 거래대금 $1.09B.
- TVL $3.6B(USDY $2.16B, 주식 $1.03B, OUSG $408.9M). 440개 이상 종목. 2024년 BUIDL에 $95M.
- 시장: RWA $32B 이상(2026년 5월). 토큰화 국채 약 $13B. BUIDL 약 $2.9B. BlackRock 모델 포트폴리오 $9.8T.
- 공급: 유통량 48.7%(2026년 7월).

사실을 새로 추가하면 반드시 웹 검색으로 출처를 확인하고 `sections.html`에 기록합니다.

## 9. 완료 기준
- [ ] 새 NEAR 스토리보드 HTML 공유 → 사용자 승인
- [ ] `build3.py near3` 예상 길이 3:00 이하
- [ ] `p_near3.html`에서 겹침과 잘림 없음, 한국어 자막이 깨지지 않음
- [ ] `near-v4.mp4` 렌더링 후 확인용 프레임 몇 장 점검
- [ ] 결과는 영어 음성과 영어·한국어 자막, 밝은 톤, 날씬한 캐릭터

## 10. 추가로 들어 있는 것
- `deliverables/`: 완성 영상 6편
  - `near-v3.mp4`, `ondo-v3.mp4`: 최신판
  - `near-worlds.mp4`, `ondo-worlds.mp4`: v3 이전, 장면마다 배경을 바꾼 버전
  - `near-30s-uchay-v2.mp4`, `ondo-blackrock-uchay-v2.mp4`: 30초판과 Ondo 초기판
- `archive-v1-v2/`: v3 이전 파이프라인 소스. 참고용이며 이번 작업에는 쓰지 않음.
  - `near-case.html`: NEAR 1:41 풀버전
  - `cut_engine*.js`, `build30.py`, `build_ondo.py`, `ondo_*.js`, `bg.js`(챕터별 배경), `make_video.py`, `rec.js`
  - `*-backup.html`: 초기 버전 백업
- 사용자가 준 참고 영상 `theater-final-preview.mp4`는 없음. 필요하면 `deliverables/`에 넣어 달라고 요청.
