# 10XAI — Full UI/UX Redesign Spec (v1)

> **Status: Finalized (2026-06-10).** Brand direction = **Light default · Indigo `#6366F1`**. Verification color = emerald `#059669`. Four stage colors (decomposed blue / verifying yellow / gate red / done green).
>
> Target screens: `ui/kanban.html` + `ui/styles/{tokens,kanban,progress}.css`
> Principle: **keep the board shape (4 columns · state machine · SSE · modal)**, and reframe the brand, entry point, cards, and detail on top of it into a product.
> Implementation strategy: colors, spacing, and typography are all CSS variables. Redesign = **swapping token values + adding new component classes** (not tearing down the structure).

---

## 0. Design Principles

1. **Contrast of trust** — the opposite tone of the content we verify (hype, cherry-picking, bait paywalls). Calm, measurement-based, no exaggeration.
2. **Information hierarchy = product narrative** — input (Hero) → board (pile of evidence) → card (claim vs. measured). The screen itself is the narrative of "decomposing claims and refuting them with measurements."
3. **Two-stage truth** — static decomposition (instant) → dynamic verification (background). The UI visually distinguishes "not yet measured" from "measured."
4. **Token-first** — a brand change should be done by swapping values in one file (`tokens.css`). Keep all three themes (light/dark/navy).

---

## 1. Brand & Visual Identity

| Item | Decision |
|---|---|
| Name | **10XAI** — ironically borrows builders' "10X" rhetoric. We *verify* those 10X claims. |
| Tagline | **"Builder content, into verified modules."** (subtitle: reveal the gap between claim and measurement) |
| Voice | Assertive, measurement-based, no hype. Speaks in numbers ("5 min → measured 12 min"). |
| Logo mark | `10X` = brand indigo accent + `AI` = text color. Numbers in a mono font (JetBrains/SF Mono feel). |
| Signature color | **Indigo `#6366F1`** = brand/CTA (Decompose · logo · active tab). Does not clash with the stage semantic colors (blue/yellow/red/green). |
| Verified/Pass | Keep emerald `#059669` (existing accent) = "verified/passed". |
| Default theme | **Light** (product, trust) by default, keep Dark/Navy toggle. |

> The signature color is a single token line (`--token-brand-primary`), so it can be swapped at any time. Indigo is recommended because it's a SaaS idiom for "tech, trust, awakening" while not overlapping with the four stage colors.

---

## 2. Design Tokens — 10XAI Extension Layer

Add/redefine in `tokens.css`. Reuse the existing raw and status tokens; add only the product concepts as new ones.

### 2a. Brand redefinition
```css
--token-brand-primary:       #6366F1;   /* indigo — CTA·logo·active */
--token-brand-primary-hover: #4F46E5;
--token-brand-accent:        #059669;   /* emerald — verified (kept) */
```

### 2b. Pipeline stage colors = aliases of existing status tokens (new semantic mapping)
| Stage (column) | Meaning | Token |
|---|---|---|
| Decomposed | Static decomposition done, unverified | `--st-gen-*` (blue) |
| Verifying | Dynamic verification/measurement in progress | `--st-val-*` (amber) |
| Gate · Review | Risky transition halted, awaiting human approval | `--st-flag-*` (red) |
| Verified | Passed | `--st-pass-*` (green) |

### 2c. Product-specific new tokens
```css
/* Risk gauge (0~100) */
--x-risk-low:  var(--gn);   /* <40  */
--x-risk-mid:  var(--am);   /* 40-69 */
--x-risk-high: var(--rd);   /* >=70  → gate */

/* Gap-fill (reinforcement gray card) */
--x-gapfill-bg:     var(--st-idle-bg);
--x-gapfill-fg:     var(--st-idle-fg);
--x-gapfill-border: var(--t4);          /* dashed */

/* Claim vs Measured gap */
--x-gap-worse: var(--rd);   /* measured is worse than claim (pricier·longer·failed) */
--x-gap-ok:    var(--gn);   /* as claimed or better */

/* Channel chip */
--x-chan-bg: var(--s2);
--x-chan-fg: var(--t2);
```

### 2d. Badge token mapping (shared by card/modal)
| Badge | Trigger | Color |
|---|---|---|
| Channel `X`/`in` | `metadata.sourceChannel` | `--x-chan-*` |
| `⚠NN` risk | `metadata.risk.score` | score → low/mid/high |
| `💸$X` cost gap | `measured.cost > claim` or `claim.free && measured.cost>0` | `--x-gap-worse` |
| `🔒` security | secret/credential-type entries in `risk.flags` | `--token-flag-fact-*` |
| `✗repro-failed` | `measured.failed` | `--st-error-*` |
| `✓cross` | `crossValidation.agreement==="agreed"` (existing) | `--vl` violet |

---

## 3. Layout & Information Architecture

```
┌─ TOPBAR (56px) ───────────────────────────────────────────────────────────┐
│ [10X]AI  builder content into verified modules    decomp N·verifying N·gate N·done N  ●connected ⚙ │
├─ HERO (collapsible) ───────────────────────────────────────────────────────┤
│ ┌ paste content ─────────────────────────────┐  channel [X ▾]  [ Decompose ] │
│ └────────────────────────────────────────────┘                            │
│ Recent: X · "Automate $10k/month with AI" · just now · 7 cards               │
├─ FILTERBAR ───────────────────────────────────────────────────────────────┤
│ [All][X][in][YT]  [⚠risk only][╌gapfill][💸cost gap]   🔍search   export▾    │
├─ BOARD ──────────────────────────────────────────────┬─ Log (pipeline) ───┤
│ Decomposed  Verifying  Gate·Review   Verified         │ 📥 7 cards decomp.  │
│ ▢▢▢      ▢▢       ▢            ▢                    │ ◐ #3 measuring…     │
│                                                      │ ⚠ #5 secret found   │
└──────────────────────────────────────────────────────┴────────────────────┘
```

- Grid: keep board `repeat(4, minmax(260px,1fr))`. Keep the right log panel width token (`--ops-w` 340px).
- z-index: keep tokens (`--token-z-*`) as-is — modal 200, toast 300.
- Hero is collapsible: textarea expands on input focus, collapses to a single line on blur (reclaiming the vertical space the `harness overview` used to occupy).
- Responsive: below 1100px the log panel collapses (reuse existing `toggleOps`), board scrolls horizontally.

---

## 4. Component Spec

Each item: **anchor (file:line) · appearance · state · tokens**.

### 4.1 Topbar — `kanban.html` header (~330)
- Appearance: logo `[10X]AI` (10X = indigo) + tagline (small, `--t3`) + right-side stage counters + connection status + theme/chat icons.
- Change: "multi-agent harness" → tagline. Counter labels All/In-progress/Review/Done → **Decomposed/Verifying/Gate/Done**.
- Tokens: logo `--token-brand-primary`, counter dot color = stage tokens.

### 4.2 Ingest Hero — replaces the `harness overview` panel area ★new core★
- Appearance: large textarea (placeholder "Paste a tweet, LinkedIn post, or YouTube script") + channel dropdown + **Decompose** CTA (indigo).
- States: idle (collapsed to one line) / focus (expanded) / submitting (spinner · "Decomposing…") / done (shows a "recent input" strip below).
- Behavior: click → `POST /api/ingest {content, channel}` → immediately shows "Decomposing" → cards appear via SSE.
- Tokens: CTA `--token-brand-primary`, border `--b1`, background `--s1`.

### 4.3 Filterbar — re-aim the filter row (~75)
- Remove: `Core/Domain/Cross-validation/Phase-only` (harness-internal).
- New: channel (All/X/in/YT) + toggles (risk only / gapfill cards / cost gap). Right side: search + **export** menu.
- Tokens: active chip `--token-brand-primary`, inactive `--s2/--t2`.

### 4.4 Columns — `kanban.html:523-539`
- Labels only: Pending → **Decomposed**, In-progress → **Verifying**, Human review → **Gate · Review**, Done → **Verified**.
- Keep the dot color animation (`:165-168`) as-is (gray/blue → pulse/red/green). Keep the `getCol()` (`:564`) mapping.

### 4.5 Card (original) — `taskCardHTML() :660-674`
```
┌ #3 ──────────────── X · ⚠62 · 💸$0.40 ─┐
│ Create Supabase project · issue keys     │   ← .tc-title
│ ◐ verify-agent · reviewer:codex  ✓cross  │   ← .tc-meta (existing)
│ claim 5 min·free  →  measured 12 min·$0.40  ▲ │   ← .tc-claimline (new)
└──────────────────────────────────────────┘
```
- New: a badge row in `.tc-top` (channel · risk · cost gap), `.tc-claimline` (claim → measured, `--x-gap-worse` on a gap).
- Graceful degrade: when there's no `measured`, show `claim 5 min·free · awaiting measurement` (gray).

### 4.6 Card (gapfill · gray) — same function, branch
```
┌╌ #4 ╌╌╌╌╌╌╌╌╌ gapfill · author omitted ╌┐
│ (missing) .env setup + key security        │
│ gapfill-agent                              │
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```
- `metadata.kind==="gapfill"` → `.tc[data-type=gapfill]`: dashed border · `--x-gapfill-bg` · dimmed (opacity .85) · "gapfill" tag.

### 4.7 Card detail modal — `openTaskModal() :733-756`
- Three new sections:
  - **Claim vs. measured table**: time · cost · reproduction × (claim | measured | gap). Gap cell color = `--x-gap-worse/ok`.
  - **Risk**: gauge bar (`risk.score`/100, color = low/mid/high) + `flags` list.
  - **Missing steps**: links to this card's gapfill children (`parentId`).
- Gate: when `gate.status==="blocked"`, show a red banner at the top + **approve/reject** (reuse existing `/api/tasks/:id/review`).

### 4.8 Log panel — relabel the ops thread (`:541`)
- "Ops thread" → **Pipeline log**. Same functionality (append-only, SSE). Decomposition/measurement/risk events flow through it.

### 4.9 Export menu — new (lower priority, Stage 5)
- Dropdown: SKILL.md / JSON / CLI. `POST /api/export/:format`.

### 4.10 State screens
- Empty board: "Paste content to start verification" (draw the eye toward Hero).
- Decomposing: 3 skeleton cards.
- Decomposition failed: toast (`--token-toast-err-*`) + log entry.

---

## 5. Interaction Flow

1. **Paste → decompose (static)**: Hero input → Decompose → "Decomposing" (instant) → within a minute, original cards appear in the `Decomposed` column + gray gapfill cards inserted. First-pass risk flags.
2. **Dynamic verification (background)**: cards automatically flow to `Verifying` while risk/measured get filled in (minutes to hours). Reuses the watch scheduler.
3. **Gate halt**: risky cards (risk ≥ 70 or security flag) stop at `Gate · Review` → approve/reject in the modal.
4. **Export**: a fully verified board → modules (SKILL.md/JSON/CLI) + 5 reports.

---

## 6. Motion
- Card appearance: fade + slide-up 150ms (`--token-duration-fast`). Sequential stagger during decomposition.
- Stage move: column-to-column movement keeps the existing SSE re-render (250ms debounce).
- Verifying card: `◐` spin or dot-color pulse (`--token-duration-pulse`).
- Risk gauge: 0 → score width transition 400ms.

---

## 7. Implementation Mapping & Build Sequence

| Task | File | Type |
|---|---|---|
| Brand/product tokens | `ui/styles/tokens.css` | Value swap + new variables |
| Token copy · counters · logo | `kanban.html` header | Edit |
| Hero | `harness overview` area | Replace (new component + JS) |
| Filter re-aim | filter row | Edit |
| Column labels | `:523-539` | Edit |
| Card (badges · gapfill · claim → measured) | `taskCardHTML :660` | Extend |
| Modal (claim-vs-measured · risk · gate) | `openTaskModal :733` | Extend |
| New CSS | `kanban.css` | `.tc[data-type=gapfill]` · `.tc-badge` · `.x-gauge` · `.hero-*` |

**Stage 0 (UI reskin, zero data dependency) details**:
1. `tokens.css`: add brand indigo + product tokens.
2. Topbar copy · counters · logo.
3. `harness overview` → Ingest Hero (the Decompose button connects to `/api/ingest`; the route lands in Stage 1).
4. Filter re-aim + column labels.
5. Cards/modal: just the new CSS skeleton so they don't break on empty fields (data is filled in Stage 2~3).
→ Result: **even without data, the board looks like the "10XAI product."** Confirm by capture.

After this: Stage 1 (ingest complete) → 2 (card appearance) → 3 (modal) → 4 (pipeline agents) → 5 (export).
