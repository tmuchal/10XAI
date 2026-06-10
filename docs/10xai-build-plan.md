# 10XAI — 기획서 5번 "실제로 해야 할 작업" (보드 구조 매핑판)

> 일반 칸반 하네스 기준으로 적힌 5번을, `init`으로 받은 **이 보드(agent-kanban-harness)의 실제 파일·함수·라인**에 박아 다시 쓴 버전.
> 제품 정의: AI 빌더 콘텐츠(트윗/링크드인/유튜브/뉴스레터)를 붙여넣으면 → 칸반으로 분해 → 생략 단계 보강(회색 카드) → 보안·비용·재현성 실측 → 검증된 실행 모듈로 export. **POC = X(트위터) 우선.**

---

## 0. 데이터 모델 확장 — 모든 작업의 뿌리

태스크는 `~/.claude/tasks/10XAI/<id>.json` 파일 1개 = 1카드. 핵심: **`metadata`는 free-form shallow-merge라 스키마 검증 없이 새 필드를 그대로 받는다** (`server/kanban.cjs:403` `Object.assign({}, task.metadata, data.metadata)`). 즉 마이그레이션 없이 필드 추가 가능.

추가할 `metadata` 필드 (전부 신규, 검증 불필요):

| 필드 | 의미 | 쓰는 단계 |
|---|---|---|
| `metadata.kind` | `"original"` \| `"gapfill"` | 분해/보강. 회색 카드 = `gapfill` |
| `metadata.sourceChannel` | `"x"` \| `"linkedin"` \| ... | 입력 채널 (POC=x) |
| `metadata.claim` | `{ cost, timeMin, free }` — 작성자 주장값 | 분해 |
| `metadata.measured` | `{ cost, timeMin, exitCode, failed }` — 실측값 | 실측 |
| `metadata.risk` | `{ score:0..100, flags:["secret-exposure",...] }` | 검증 |
| `metadata.badges` | `["security","cost-gap","unreproducible"]` | 검증 |
| `metadata.gate` | `{ status:"open"\|"blocked"\|"passed", reason }` | 이동 게이트 |
| `metadata.runner` | (기존) `claude`/`codex`/`both`/sandbox 어댑터 | 실측 |

> 코드 변경 거의 없음 — `createTask`(`kanban.cjs:330`)/`updateTask`(`:373`)가 이미 임의 metadata를 보존한다. SSE 브로드캐스트(`:818`, `:1589` 파일워치)도 metadata를 그대로 UI로 흘려보낸다. **UI 렌더만 이 필드를 읽으면 됨.**

---

## 1. 다섯 에이전트 파이프라인 → `agents/*.md` 재구성

기존 5개 에이전트(frontend/backend/deploy-gate/monitor/reviewer)를 **콘텐츠 검증 파이프라인 5단계로 교체**한다. 에이전트 정의 포맷은 그대로(`agents/_TEMPLATE.md:1-8` frontmatter: `name/mission/runner/group/model_default/tools_allowed/worktree/escalation/owns`). 라우팅은 orchestrator(`agents/orchestrator.md:51-57`)가 담당.

| # | 새 에이전트 파일 | 역할 | runner | 매핑되는 기존 메커니즘 |
|---|---|---|---|---|
| 1 | `agents/decompose-agent.md` | 붙여넣은 콘텐츠 → 카드 N개로 분해, `claim` 추출 | `claude` | 신규. 입력 트리거 = §4 ingest API |
| 2 | `agents/gapfill-agent.md` | 작성자가 생략한 단계 → **회색 카드**(`kind:"gapfill"`) 삽입 | `claude` | detector 패턴(`lib/detect/_template.cjs:33`) 응용 |
| 3 | `agents/verify-agent.md` | 보안·정책 risk score + 배지 부여 | `reviewer:codex` | detector alert 스키마(`source/signal/severity/routesTo/evidence`, `_template.cjs:15-25`) |
| 4 | `agents/measure-agent.md` | 샌드박스 실행 → 비용·시간 실측, `measured` 기록 | `sandbox`(신규 어댑터) | runner 어댑터(`lib/runner/index.cjs:30`) + worktree 격리 |
| 5 | `agents/export-agent.md` | 5종 리포트 + SKILL.md/JSON 모듈 export | `claude` | skill 포맷(`skills/*.md`) + §5 |

`agents/_TEMPLATE.md` 복사해서 5개 작성. `frontend/backend/deploy-gate/monitor/reviewer-codex.md`는 삭제 또는 `group: legacy`로 비활성. orchestrator 라우팅 규칙(`orchestrator.md:51-57`)을 "콘텐츠 단계별 순차 진행"으로 교체.

---

## 2. 카드 이동 게이트 — `updateTask`에 삽입

**현재 상태 전이에는 게이트가 전혀 없다.** `updateTask`(`kanban.cjs:386-431`)가 어떤 status 문자열이든 그대로 받는다(`:386` `if (data.status !== undefined && data.status !== task.status)`). 여기가 정확한 삽입 지점.

설계:
- `kanban.cjs:388`의 `task.status = data.status` **직전**에 게이트 체크를 끼운다.
- 안전 전환(낮은 risk) → 자동 통과.
- 위험 전환(`metadata.risk.score ≥ THRESHOLD` 또는 보안 플래그) → status를 강제로 `in_review`로 돌리고 `metadata.gate = {status:"blocked", reason}` 기록. 이미 있는 패턴: executor 실패 시 `in_review`로 격리(`:418`, `:1169`)와 동일.
- 사람 승인은 기존 `POST /api/tasks/:id/review`(`:1702`, `approve`→completed `:1720` / `reject`→pending `:1725`)를 **그대로 재사용**. 새 승인 UI 안 만들어도 됨.

게이트 판정 로직은 `lib/gate/index.cjs`의 `runStage`(`:37`)/`finalize`(`:81`) 구조를 차용 — 단, deploy 커맨드 대신 "전환 규칙"을 평가. 실패 시 사람검토 카드 자동생성(`notifyFailure:135`)도 재사용 가능.

---

## 3. 보강·검증·실측 — 카드 처리 흐름에 3동작 삽입

세 동작 모두 §1의 에이전트가 수행하고, 결과는 §0의 metadata에 적힌다. UI가 그걸 읽어 렌더(§4 아님 — UI는 여기).

### 3a. 보강(gap-fill) → 회색 카드
- gapfill-agent가 누락 단계를 `POST /api/tasks`로 생성하되 `metadata.kind:"gapfill"`, `parentId` = 원본 카드.
- **UI 렌더**: `ui/kanban.html` `taskCardHTML()`(`:660-674`)에서 `t.metadata.kind==="gapfill"`면 `.tc`에 `data-type="gapfill"` 부여 → CSS로 회색/줄무늬 처리(`tokens.css`의 `--st-idle-bg/fg`). 삽입 지점은 카드 div 생성부(`:668`).

### 3b. 검증 → 배지 + risk score
- verify-agent가 `metadata.risk` / `metadata.badges` 기록.
- **UI 렌더**: `taskCardHTML()` 의 `.tc-meta` 블록(`:671`), runner 배지 뒤에 risk/cost/security 배지 주입. 기존 배지 CSS 패턴 재사용(`.tc-pri`/`.tc-tag`/`.tc-rn`, `:182-216`). 새 클래스 `.tc-badge`만 추가.

### 3c. 실측 → 샌드박스 실행
- **신규 runner 어댑터** `lib/runner/adapters/sandbox.cjs`. 인터페이스는 기존 어댑터와 동일: `async run(task, opts) → { runner, verdict, confidence, reportPath, duration_ms, summary }` (참고 `adapters/claude.cjs:93`).
- 격리 = 기존 git worktree(`lib/runner/worktree-manager.cjs:24` `createWorktree`)를 그대로 sandbox로 사용. 시간 = `duration_ms` 이미 측정됨. 비용 = `budget.cjs:20-35`의 토큰/호출 집계 패턴 확장.
- `index.cjs:30` `runTask` 디스패처에 `case "sandbox"` 추가(`:35-47` 라우팅 블록).
- 결과를 `metadata.measured`에 기록 → `claim` vs `measured` 갭이 카드에 드러남.

> 카드 배정은 보드가 이미 함(orchestrator 라우팅 + auto-pickup `config.autoPickup`). **연결만** 하면 됨.

---

## 4. 입력 출구(IN) — 콘텐츠 붙여넣기 → 분해 트리거

기획서: "텍스트 한 덩어리 붙여넣기 → 1분 내 정적 분해 보드 초안".

- **UI**: 기존 "+ 새 카드" 모달(`ui/kanban.html` `openNewTaskModal()` `:692` / `createNewTask()` `:711`)에 **큰 textarea + 채널 선택(X/LinkedIn...) + "분해" 버튼** 추가. 또는 헤더에 전용 paste 패널.
- **신규 API** `POST /api/ingest { content, channel }` (`kanban.cjs`의 라우터에 추가, 기존 라우트 패턴 `:1664` 참고). 동작: decompose-agent 실행 → 카드 N개 생성 → 즉시 SSE로 보드에 뜸(`broadcast :818`).
- **2단계 흐름**: ① 정적 분해(즉시, 회색 카드+1차 리스크 플래그) → ② 백그라운드 동적 검증(verify+measure가 카드별로 `measured` 채움). watch 스케줄러(`lib/watch/scheduler.cjs`)를 백그라운드 러너로 재사용.

---

## 5. 출력 출구(OUT) — 검증된 보드를 모듈로 export

기획서 최종 산출물 3종: ① 시각화된 보드 ② 5종 리포트 ③ 실행 모듈(CLI·SKILL.md·JSON).

- **신규 skill** `skills/export.md` (포맷: `skills/gate.md:1-6` frontmatter 동일).
- **신규 API** `POST /api/export/:format` (`format` = `skill|json|cli`). 검증 끝난 보드를 읽어:
  - `SKILL.md` — frontmatter + 단계별 body. **안전 구간=자동 실행, 위험 구간=수동 게이트 구조를 모듈에 그대로 박음** (§2 게이트 메타를 직렬화).
  - `JSON` — 카드 + claim/measured/risk 전체.
  - `CLI` — 실행 가능한 스크립트.
- 기존 skill-create 메커니즘(`metadata.resourceAction:{kind:"skill-create"}`, 완료 시 파일 생성 `kanban.cjs:404`)을 재사용해 export 결과를 `skills/`에 떨군다.
- **5종 리포트**: 재현성/비용갭/보안/실패카드/요약. `lib/gate/finalize`(`:81`)의 report.md 생성 패턴 차용, `data/runs/`에 출력. `/standup` skill(`skills/standup.md`)이 이미 리포트 집계 패턴 보유.

---

## 6. 해커톤 3일 매핑 (기획서 기준)

| 일차 | 목표 | 이 보드에서 손댈 것 |
|---|---|---|
| **D1** | 분해 + 보드 표시 | §0 metadata, §1 decompose/gapfill 에이전트, §4 ingest API + paste UI, §3a 회색 카드 렌더 |
| **D2** | 검증 + 실측 + 게이트 | §3b 배지/risk(verify-agent), §3c sandbox 어댑터(도구 1~2개만 연동), §2 이동 게이트, 카드 클릭 시 claim-vs-measured 상세(modal `openTaskModal :733`) |
| **D3** | 데모 + 확장성 + 랜딩 | X 케이스 3~4개 사전처리, 링크드인 포스트 1건 동일 파이프라인 통과(채널 확장 증명), §5 export, 랜딩 페이지 |

---

## 7. 신규 vs 재사용 요약

**신규 작성**: `agents/{decompose,gapfill,verify,measure,export}-agent.md`, `lib/runner/adapters/sandbox.cjs`, `skills/export.md`, `POST /api/ingest`, `POST /api/export/:format`, UI paste 패널 + 배지/회색카드 CSS.

**재사용(거의 그대로)**: 태스크 저장/CRUD(`kanban.cjs`), metadata 자유 확장, SSE 라이브 업데이트, status 머신 + review 승인, worktree 격리=sandbox, budget 비용추적, detector alert 스키마, gate report 생성, skill-create 파일 출력, orchestrator 라우팅, ops-thread/Telegram 미러.

**핵심 통찰**: 이 하네스는 "AI 작업물을 카드로 묶고·검증하고·게이트로 막고·실측하고·모듈로 내보내는" 인프라가 **이미 다 있다**. 10XAI는 그 입력을 "내 작업 지시"에서 "남의 빌더 콘텐츠"로 바꾸고, 검증 대상을 "코드 안전성"에서 "콘텐츠 재현성·비용갭"으로 바꾸는 **재조준(re-aim)** 작업이다. 새로 짜는 건 분해 입구·실측 어댑터·export 출구 3개뿐.
