// 10XAI card model — the metadata contract shared by server, agents, and UI.
//
// The kanban core (server/kanban.cjs) stores task.metadata as a free-form object
// and shallow-merges it on every update, so these fields need NO schema migration.
// This module is the single source of truth for field names + safe derivation, so
// every pipeline stage (decompose → gapfill → verify → measure → export) agrees.
//
//   metadata = {
//     kind:    "original" | "gapfill",        // gapfill = auto-inserted gray card
//     stage:   "decomposed"|"gapfilled"|"verified"|"measured"|"exported",
//     sourceChannel: "x" | "linkedin" | …,
//     claim:    { cost, timeMin, free },       // what the author claimed
//     measured: { cost, timeMin, exitCode, failed } | null,  // what we measured
//     risk:     { score:0..100, flags:[] } | null,
//     badges:   [],                            // ["security","cost-gap","unreproducible"]
//     gate:     { status:"open"|"blocked"|"passed", reason? }
//   }

const STAGES = ["decomposed", "gapfilled", "verified", "measured", "exported"];
const KINDS = ["original", "gapfill"];
const CHANNELS = ["x", "linkedin", "youtube", "medium", "newsletter", "other"];

// A forward column move is blocked for human review at/above this risk score.
const RISK_GATE_THRESHOLD = 70;
// Flag substrings that always block, regardless of numeric score.
const HARD_FLAG_RE = /secret|credential|api[\s_-]?key|prod|payment|billing|delete|drop\s|rm\s-rf/i;

function emptyClaim() { return { cost: null, timeMin: null, free: null }; }

// Fill in defaults without clobbering whatever a stage already wrote.
function normalizeMetadata(meta) {
  const m = Object.assign({}, meta || {});
  if (!KINDS.includes(m.kind)) m.kind = "original";
  if (m.claim == null || typeof m.claim !== "object") m.claim = emptyClaim();
  if (!Array.isArray(m.badges)) m.badges = [];
  if (m.measured === undefined) m.measured = null;
  if (m.risk === undefined) m.risk = null;
  if (m.gate == null || typeof m.gate !== "object") m.gate = { status: "open" };
  return m;
}

// Does this card carry enough risk that a forward move must stop for review?
function isRisky(meta) {
  const r = meta && meta.risk;
  if (!r) return false;
  if (typeof r.score === "number" && r.score >= RISK_GATE_THRESHOLD) return true;
  if (Array.isArray(r.flags) && r.flags.some((f) => HARD_FLAG_RE.test(String(f)))) return true;
  return false;
}

// claim-vs-measured gap for the card detail view. Returns null until measured.
function claimGap(meta) {
  const c = (meta && meta.claim) || {};
  const x = meta && meta.measured;
  if (!x) return null;
  return {
    timeMin: c.timeMin != null && x.timeMin != null ? +(x.timeMin - c.timeMin).toFixed(1) : null,
    cost: c.cost != null && x.cost != null ? +(x.cost - c.cost).toFixed(2) : null,
    claimedFree: c.free === true,
    actuallyCost: x.cost != null ? x.cost : null,
    failed: !!x.failed,
  };
}

module.exports = {
  STAGES, KINDS, CHANNELS, RISK_GATE_THRESHOLD,
  emptyClaim, normalizeMetadata, isRisky, claimGap,
};
