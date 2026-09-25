# Video plan: automating content with ontology and harness engineering

> Working title (KR): **"프롬프트는 끝났다 — 온톨로지 + 하네스로 콘텐츠를 '검증된 자동화'로 만드는 법"**
> Working title (EN): *Prompts aren't enough: automating content with ontology and harness engineering*
> Format: long-form YouTube, 16–18 min, plus 3 Shorts cut from it
> Case study: this repo (10XAI), shown running on camera

The planning notes are in English, following the repo rule. The narration lines in §5 are in Korean because they are the spoken script.

---

## 0. The one-sentence thesis

**The ontology defines what your content *is*: its nouns, links, and verbs. The harness defines how agents *act on it*: guides, sensors, gates, and a sandbox. Put both together and "an AI wrote it" becomes "an AI made it, and here are the receipts."**

- Agent = Model + Harness. The model is interchangeable; the harness and the ontology are what you actually build and own.
- Without an ontology, the harness has nothing typed to check against. Without a harness, the ontology is just a diagram.

---

## 1. Study notes (what the video must get right)

### 1.1 Harness engineering

| Source | Key idea for the video | Use on screen as |
|---|---|---|
| OpenAI, *Harness engineering: leveraging Codex in an agent-first world* (early 2026) | 5-month internal experiment. About 1M lines of code, about 1,500 merged PRs, 3 engineers driving Codex, zero hand-written lines, roughly 1/10 of the time. "Humans steer. Agents execute." The repo docs are a *map*, not a manual. | The "why now" stat card |
| Böckeler / Thoughtworks on martinfowler.com, *Harness engineering for coding agent users* | Vocabulary taken from cybernetics. **Guides** are feedforward: they steer before the agent acts. **Sensors** are feedback: they measure after it acts. Sensors are either **computational** (linters, tests, regex; cheap, run every time) or **inferential** (an LLM judge; semantic and costly, use selectively). | The core diagram of the video (§3) |
| Anthropic, *Effective harnesses for long-running agents* (Nov 2025) | An initializer agent creates `feature_list.json`, `init.sh`, `claude-progress.txt`, and a git repo. Worker agents then do **one feature at a time** and leave artifacts behind for the next context window. | "State lives in files, not in the model's memory" |
| LangChain, *The Anatomy of an Agent Harness*; Databricks, *What is an AI Agent Harness?* | The harness is everything except the model: tools, memory, context, permissions, observability, retries. | Glossary slide |
| arXiv 2605.13357, *AI Harness Engineering: A Runtime Substrate…* | Academic framing: the harness manages context, tools, memory, task state, verification, permissions, and failure attribution. | One-line citation only |

### 1.2 Ontology

| Source | Key idea for the video | Use on screen as |
|---|---|---|
| Palantir Ontology docs and blog (*Connecting Agents to Decisions*, Apr 2026) | Three primitives. **Object types** are the nouns. **Link types** are the relationships. **Action types** are the verbs, and every write goes through them with validation, approval, and audit. Agents act only through actions, so they are bounded by the same rules as humans. | The cleanest definition of "ontology" for a practitioner audience |
| arXiv 2604.00555, *Ontology-Constrained Neural Reasoning in Enterprise Agentic Systems* | "The ontology stops being the output of the LLM and becomes the harness around it." | **The bridge quote** that joins the two halves of the video |
| Schema.org / content knowledge graph (Schema App); Adobe Brand Intelligence | Content-side ontologies: entities, attributes, and relations for pages, brand, and voice, used to keep AI output consistent across channels. | Shows that creators already use this, often without the name |
| arXiv 2604.23090 (multi-agent ontology generation), LLM4KGOE workshop (ESWC 2026) | LLMs can *draft* ontologies, but humans still own the schema. | Caveat slide |

### 1.3 Claims to avoid or soften (fact-check list)

- **"88% of AI agent projects never reach production."** This circulates in blog posts, but I found no primary source. **Do not use it.**
- The OpenAI numbers (1M LOC, 1,500 PRs, 3 engineers) are OpenAI's self-report. Say "OpenAI reports…".
- The 10XAI results in `README.md` (OpenHands → 7 cards in ~30s, 6 gated; bolt.new → 8 cards with an "upgrade to paid" card) are **our own earlier runs**. Re-run them on camera and show the fresh numbers, per CLAUDE.md rule 5 (claimed vs. measured).
- Don't say the ontology makes the output "correct". It makes the output **checkable**.
- Palantir is an example of the concept, not an endorsement. No logos or UI in the thumbnail.

---

## 2. Audience and promise

- **Who:** creators, marketers, and indie builders who already use ChatGPT or Claude for content, have hit "the output is inconsistent, and sometimes wrong or risky", and want automation they can trust.
- **What they walk away with:**
  1. A 3-primitive content ontology they can copy (§4).
  2. A 4-part harness checklist: guides, sensors, gates, sandbox/budget.
  3. A working reference implementation they can clone (10XAI).
- **Not covered:** RDF/OWL formalism, graph databases, fine-tuning. Mention these as "further reading" only.

---

## 3. The core mental model (the one diagram)

```
                 ┌──────────── HARNESS ────────────┐
   GUIDES        │                                 │   SENSORS
 (feedforward)   │   ┌────────── ONTOLOGY ──────┐  │ (feedback)
 agent .md       │   │ Objects: Source, Claim,  │  │ computational:
 mission/owns ──►│   │   Step, Risk, Measurement│  │  risk ≥ 70, regex flags,
 tools_allowed   │   │ Links:  Claim→Step→Risk  │  │  exit codes, cost/time
 CLAUDE.md rules │   │ Actions: decompose,      │◄─┤ inferential:
                 │   │  gapfill, verify, run,   │  │  LLM verify, Claude+Codex
                 │   │  export                  │  │  cross-check
                 │   └──────────────────────────┘  │
                 │   GATE (human) · SANDBOX · BUDGET│
                 └─────────────────────────────────┘
                       MODEL = swappable engine
```

Narrative beat: **the ontology is the thing sensors can check against.** "risk ≥ 70" only means something because `risk` is a typed field on a typed card.

---

## 4. Case study mapping: 10XAI as ontology + harness

Show these files on screen, in this order.

### 4.1 Ontology in 10XAI

| Primitive | In 10XAI | File |
|---|---|---|
| Object types | Card with `kind` (original / gapfill), `stage`, `sourceChannel` | `lib/model/card.cjs:1-22` |
| Properties | `claim {cost, timeMin, free}`, `measured {cost, timeMin, exitCode, failed}`, `risk {score, flags}`, `badges`, `gate {status, reason}` | `lib/model/card.cjs:13-17` |
| Link / derived relation | `claimGap(meta)`: claim ↔ measured difference | `lib/model/card.cjs:52-63` |
| Lifecycle (state machine) | `decomposed → gapfilled → verified → measured → exported`; task states `pending → in_progress → in_review → completed` | `lib/model/card.cjs:20`, `CLAUDE.md` |
| Action types | REST verbs that are the *only* way to change state: `POST /api/ingest`, `/api/verify/run`, `/api/execute/run`, `/api/repair/run`, `PUT /api/tasks/:id` | `server/kanban.cjs:1969-2060` |

Talking point: metadata is a **shallow merge with no schema migration** (`card.cjs` header comment). Each stage *adds* typed fields. That is how you evolve an ontology cheaply.

### 4.2 Harness in 10XAI

| Harness part | In 10XAI | File |
|---|---|---|
| Guides (feedforward) | Agent frontmatter: `mission`, `tools_allowed`, `worktree`, `escalation`, `model_default`; project rules | `agents/*.md`, `agents/_TEMPLATE.md`, `CLAUDE.md` |
| Computational sensor | `RISK_GATE_THRESHOLD = 70` and `HARD_FLAG_RE` (secret, credential, api key, prod, payment, delete, `rm -rf`…) | `lib/model/card.cjs:24-49` |
| Inferential sensor | `verify-agent` with `runner: both` (Claude + Codex cross-check); disagreement → `in_review` | `agents/verify-agent.md`, `lib/runner/index.cjs` |
| Gate (human-in-the-loop) | Risky cards stop in the **Gate / Review** column. Rule #1: never auto-run them. | `CLAUDE.md`, `lib/gate/index.cjs` |
| Sandbox | One git worktree per run, removed afterwards | `lib/runner/worktree-manager.cjs` |
| Budget and fallback | Daily second-model cap, model fallback chain, automatic promotion to cross-check by severity | `lib/runner/budget.cjs` |
| Orchestration | Verify orchestrator fans out one worker per card; the harness-builder generates one execute sub-agent per verified step | `agents/verify-orchestrator.md`, `agents/harness-builder.md` |
| Observability | Live SSE board, ops thread, activity log | `server/kanban.cjs` (`/events`, `/api/activity`) |

---

## 5. Episode structure with a Korean narration script

Target 17:00. Screen recording (SR), motion graphic (MG), talking head (TH).

### 00:00–00:45 · Cold open / hook (TH + SR)
- **Visual:** a viral "one prompt, full SaaS, free!" post is pasted into 10XAI. Cards stream in. One card turns red: `⚠72`.
- **Narration:**
  > "이 게시물, '프롬프트 하나로 SaaS 완성, 무료'라고 합니다. 붙여넣고 30초 뒤에 보시죠. 카드 8장, 작성자가 빼먹은 단계 3개, 그리고 빨간 카드 하나 — 위험도 72점. 오늘은 이걸 가능하게 한 두 가지, **온톨로지**와 **하네스 엔지니어링**으로 콘텐츠 자동화를 '믿을 수 있게' 만드는 방법을 보여드립니다."
- **On-screen text:** `claimed: free → measured: $0.40` (use the fresh number from the pre-recording run).

### 00:45–02:30 · Problem: why prompt-only automation breaks (TH + MG)
- Three failure modes, one card each: **inconsistency** (different output every run), **silent gaps** (skipped steps), **unsafe actions** (secrets, production, payments).
- **Narration:**
  > "프롬프트를 아무리 다듬어도 세 가지는 안 고쳐집니다. 매번 결과가 다르고, 중요한 단계를 조용히 건너뛰고, 가끔은 해서는 안 되는 걸 합니다. 모델이 멍청해서가 아니라 — 모델을 둘러싼 '구조'가 없어서입니다."
- Transition: "Prompt engineering → Context engineering → **Harness engineering**" timeline graphic.

### 02:30–05:00 · Concept 1: harness engineering (MG)
- Agent = Model + Harness. Cite OpenAI's 1M-LOC experiment ("OpenAI reports").
- Böckeler's **guides vs. sensors**, then **computational vs. inferential**, as a 2×2 grid.
- Anthropic's long-running pattern: state lives in files (`progress.txt`, `feature_list.json`), one feature at a time.
- **Narration (key line):**
  > "하네스는 말의 마구(馬具)입니다. 말(모델)이 아무리 힘이 세도, 고삐와 눈가리개와 울타리가 없으면 밭을 갈 수 없습니다. 고삐가 '가이드', 울타리에 달린 센서가 '피드백'입니다."

### 05:00–07:30 · Concept 2: ontology (MG)
- The Palantir framing: **nouns (objects), relationships (links), verbs (actions)**.
- Point to land: *all writes go through actions*, so the agent obeys the same rules as a human.
- Translate into creator terms: "Your content already has an ontology. You just haven't written it down."
- **Narration:**
  > "온톨로지는 어려운 철학 용어가 아닙니다. '우리 콘텐츠에는 어떤 것들이 있고(명사), 서로 어떻게 연결되고(관계), 무엇을 할 수 있는가(동사)'를 적어둔 약속입니다. 그리고 에이전트는 이 동사로만 세상을 바꿀 수 있게 합니다."

### 07:30–08:30 · The bridge (MG, the thesis beat)
- Show the quote: *"The ontology stops being the output of the LLM and becomes the harness around it."* (arXiv 2604.00555)
- Reveal the §3 diagram.
- **Narration:**
  > "센서가 '위험도 70점 이상이면 멈춰'라고 판단하려면, 먼저 '위험도'라는 필드가 존재해야 합니다. 온톨로지가 타입을 만들고, 하네스가 그 타입을 검사합니다. 둘은 한 쌍입니다."

### 08:30–13:30 · Live demo: 10XAI end to end (SR, the main segment)
1. `npm start` → open `localhost:8080`. (15s)
2. Paste a real post or repo URL (pick one in pre-production; see §7). Show `POST /api/ingest` → cards arriving live over SSE. (60s)
3. **Ontology zoom-in:** open one card and show the `metadata` JSON: `claim`, `kind: gapfill`, `risk`. Cut to `lib/model/card.cjs`. (60s)
4. **Guides zoom-in:** open `agents/verify-agent.md` and point at `mission`, `tools_allowed`, `runner: both`. (45s)
5. **Sensors + gate:** a card lands in **Gate / Review**. Show `RISK_GATE_THRESHOLD = 70` and `HARD_FLAG_RE`. Try to run it: blocked. Approve it manually. (60s)
6. **Sandbox + measure:** run a safe card and show the worktree created and then removed, plus `measured` filled in and the claim-vs-measured gap. (45s)
7. **Export:** Library → SKILL.md / JSON module. (30s)
- **Narration anchor during the gate moment:**
  > "여기가 핵심입니다. AI가 '실행해도 됩니다'라고 해도, 온톨로지상 이 카드는 `risk.score ≥ 70`이니까 하네스가 막습니다. 사람이 승인하기 전까지는 절대 자동 실행되지 않습니다."

### 13:30–15:45 · Apply it to your own content pipeline (MG + template)
Walk through a **creator content ontology** that viewers can copy:

```yaml
objects:
  Source:    { url, channel, author, fetchedAt }
  Claim:     { text, type: [cost|time|result|free], value }
  Evidence:  { kind: [measurement|citation|screenshot], ref }
  Script:    { title, hook, sections[], lengthSec }
  Asset:     { type: [thumbnail|short|thread|newsletter], status }
  Risk:      { score: 0-100, flags[] }
links:
  Source  -has->       Claim
  Claim   -supportedBy-> Evidence       # a Claim without Evidence can't be published
  Script  -uses->      Claim
  Script  -renders->   Asset
actions:
  ingest(Source)          # guide: channel-specific fetcher
  extractClaims(Source)   # sensor: every Claim has a type + value
  factCheck(Claim)        # sensor (inferential): LLM judge + citation required
  draft(Script)           # guide: brand-voice file, banned-phrases list
  lint(Script)            # sensor (computational): length, banned words, unsourced numbers
  publish(Asset)          # GATE: human approval if any Risk.score >= 70
```

- Harness checklist slide (the takeaway screenshot):
  1. **Guides:** a brand-voice file, a per-agent mission, allowed tools
  2. **Computational sensors:** length, banned phrases, "every number has a source"
  3. **Inferential sensors:** fact-check judge, second-model cross-check on high-stakes content
  4. **Gates:** a human approves publishing, money, and anything irreversible
  5. **State in files:** a progress log, so the next run picks up where the last one stopped
- **Narration:**
  > "여러분 채널에 그대로 쓰세요. 규칙은 하나 — '근거(Evidence)에 연결되지 않은 주장(Claim)은 발행할 수 없다.' 이 한 줄이 온톨로지이자 하네스입니다."

### 15:45–16:40 · Limits and honesty (TH)
- The ontology is a human decision. LLMs can draft it, but you own it.
- Inferential sensors cost money, so use them selectively.
- A harness reduces risk but doesn't remove it. That is why the gate exists.

### 16:40–17:00 · CTA (TH)
- "Clone the repo, paste the last viral post that fooled you, and share your board screenshot in the comments."
- Link to the repo and the source list.

---

## 6. Shorts (vertical, 30–55s each)

| # | Hook line (KR) | Source segment |
|---|---|---|
| S1 | "'무료'라던 AI 자동화, 실제로 돌려보니 $0.40" | Cold open + measure step |
| S2 | "하네스 엔지니어링을 30초로: 고삐 vs 센서" | 02:30–05:00 |
| S3 | "AI가 '괜찮다'고 해도 멈추는 이유 — 위험도 70점 게이트" | Demo step 5 |

---

## 7. Pre-production checklist

- [ ] Choose the demo input. Candidates: a currently viral "one-prompt app" post, `github.com/OpenHands/OpenHands`, or `github.com/stackblitz/bolt.new`. Do **2 dry runs** and keep the one that reliably produces ≥1 gated card and ≥1 gap-fill card.
- [ ] Record the dry-run numbers (card count, time to decompose, number gated, measured cost) in a table. The on-screen numbers must come from the recorded take, not from `README.md`.
- [ ] Confirm the `claude` CLI is on PATH. `/api/ingest` returns 503 without it (`server/kanban.cjs:2045`).
- [ ] Use a clean `config.js` and `.env` containing **no real secrets** (they may appear on screen). Blur the terminal history.
- [ ] Set the UI to English or Korean via `/api/lang` to match the narration.
- [ ] Prepare a fallback: a pre-recorded full run in case the live run stalls.
- [ ] Build the §3 diagram and the guides/sensors 2×2 as motion graphics.
- [ ] Put the source list (§9) in the description.

## 8. Title and thumbnail options

- **T1:** 프롬프트는 끝났다 — 온톨로지 + 하네스로 AI 콘텐츠 자동화 (실제 코드 공개)
- **T2:** "무료"라던 AI 자동화, 돌려보니 위험도 72점 | 하네스 엔지니어링 실전
- **T3:** AI 에이전트를 믿을 수 있게 만드는 2가지: 온톨로지와 하네스
- **Thumbnail:** left, a viral post screenshot (blurred author) stamped "FREE?"; right, a red `⚠72` card. Text: **"돌려봤다"**.

## 9. Sources (put in the video description)

- OpenAI — Harness engineering: leveraging Codex in an agent-first world: https://openai.com/index/harness-engineering/
- Böckeler, B. — Harness engineering for coding agent users (martinfowler.com): https://martinfowler.com/articles/harness-engineering.html
- Thoughtworks — Harness engineering and agent feedback: exploring AI coding sensors: https://www.thoughtworks.com/insights/blog/generative-ai/harness-engineering-agent-feedback-exploring-ai-coding-sensors
- Anthropic — Effective harnesses for long-running agents: https://anthropic.com/engineering/effective-harnesses-for-long-running-agents
- LangChain — The Anatomy of an Agent Harness: https://www.langchain.com/blog/the-anatomy-of-an-agent-harness
- Databricks — What is an AI Agent Harness?: https://www.databricks.com/blog/ai-harness
- AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents: https://arxiv.org/pdf/2605.13357
- Palantir — The Ontology system: https://www.palantir.com/docs/foundry/architecture-center/ontology-system
- Palantir — Connecting Agents to Decisions: https://blog.palantir.com/connecting-agents-to-decisions-277dee8ddb40
- Ontology-Constrained Neural Reasoning in Enterprise Agentic Systems: https://arxiv.org/pdf/2604.00555
- Towards Automated Ontology Generation from Unstructured Text: A Multi-Agent LLM Approach: https://arxiv.org/pdf/2604.23090
- Schema App — What is a Content Knowledge Graph?: https://www.schemaapp.com/schema-markup/what-is-a-content-knowledge-graph/
- awesome-harness-engineering: https://github.com/ai-boost/awesome-harness-engineering
