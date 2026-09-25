// Dance Lab — K-pop trend catalog + trend-fit scoring.
// The bundled catalog is a snapshot (see ASOF / sources). The server can
// replace it with a fresher one researched by the local claude CLI
// (POST /api/dance/trends/refresh → workspace/dance/trends.json).
//
// Each trend describes a *choreography style* with a target profile on the
// same 0–100 axes analyze.mjs measures, so any video (or member, or you in
// Practice mode) can be scored for how "on-trend" it moves.

export const AXIS_KEYS = ["power", "sharpness", "flow", "groove", "extension", "footwork", "levels", "rhythm"];

export const BUNDLED = {
  asOf: "2026-09",
  origin: "bundled",
  note: "Snapshot from web research in Sept 2026. Examples marked 'reported' come from fan/news sites and weren't independently confirmed.",
  trends: [
    {
      id: "point-hook",
      name: "Point-move hook",
      nameKo: "포인트 안무 챌린지",
      summary: "Every comeback ships a 10–15 s challenge cut: one iconic hand/arm gesture locked to the vocal hook, simple feet so anyone can copy it on Shorts/Reels.",
      pointMove: "A sharp, mimeable gesture on the hook (hands, arms, face framing); the feet mostly stay in place.",
      profile: { sharpness: 80, rhythm: 85, extension: 60, footwork: 25, levels: 20, power: 55 },
      cues: ["Hit the gesture exactly on the hook syllable — timing sells it more than size.", "Keep the feet simple and the frame tight, like it's filmed vertically.", "Freeze for a beat after the gesture so it reads on a phone screen."],
      drills: ["accent-map", "hit-freeze", "count-clap"],
      examples: [],
      sources: ["https://www.kpopecho.com/2026/03/top-10-k-pop-dance-challenges-of-2026.html"],
    },
    {
      id: "relentless-footwork",
      name: "Relentless chorus footwork",
      nameKo: "폭발적 풋워크",
      summary: "Hip-hop choruses built on nonstop footwork under bouncy, percussive beats, with a signature hand sign on top.",
      pointMove: "Fast stepping patterns through the whole chorus + a claw/hand-sign accent.",
      profile: { footwork: 85, power: 80, rhythm: 80, sharpness: 65, groove: 60, levels: 45 },
      cues: ["Learn the feet alone first at 0.5x, arms relaxed.", "Stay low and light — weight on the balls of the feet.", "Hand sign lands on the downbeat while the feet keep going."],
      drills: ["step-ladder", "bounce", "hit-freeze"],
      examples: [
        { artist: "BABYMONSTER", song: "CHOOM", date: "2026-05-04", note: "Hip-hop title track with a bouncy synth riff and heavy percussion; the chorus is known for explosive footwork and a 'Monster Claw' gesture (gesture: reported).", status: "confirmed release", source: "https://en.wikipedia.org/wiki/Choom_(EP)" },
      ],
      sources: ["https://en.wikipedia.org/wiki/Choom_(EP)", "https://glofan.co/articles/5-k-pop-choreography-trends-you-ll-see-everywhere-in-2026-a051c5"],
    },
    {
      id: "drop-freeze",
      name: "Predator drop & synced freeze",
      nameKo: "드롭 & 싱크 프리즈",
      summary: "Explosive level drop into a low, wide stance, then the whole group freezes in one frame on the hook.",
      pointMove: "Sudden drop to a low predator stance → whole-group freeze.",
      profile: { levels: 85, sharpness: 85, power: 80, rhythm: 75, flow: 25 },
      cues: ["Drop fast, land quiet: bend the knees, don't fall.", "The freeze is the move — zero drift for a full count.", "Practise the drop in sets of 8 with a knee warm-up first."],
      drills: ["level-changes", "hit-freeze", "plie-drops"],
      examples: [
        { artist: "KATSEYE", song: "Animal", date: "2026-07-24", note: "Chorus hook: predator-stance drop into a six-way synchronized freeze.", status: "reported", source: "https://kpopheadlines.com/dance-challenges" },
      ],
      sources: ["https://kpopheadlines.com/dance-challenges"],
    },
    {
      id: "hip-isolation",
      name: "Hip-isolation groove",
      nameKo: "힙 아이솔레이션",
      summary: "Core-driven hip and chest isolations over a steady groove; 2026 challenge versions speed the isolation chorus up as a rhythm/core test.",
      pointMove: "Fast hip isolations in the chorus with a relaxed upper body.",
      profile: { groove: 85, rhythm: 80, flow: 60, sharpness: 50, footwork: 20, power: 45 },
      cues: ["Lock the ribcage, move only the pelvis.", "Start at 0.75x — the faster 2026 versions only work once it's clean.", "Knees soft; the bounce feeds the isolation."],
      drills: ["chest-iso", "bounce", "count-clap"],
      examples: [
        { artist: "LE SSERAFIM", song: "Smart", date: "2024", note: "Still a challenge staple; 2026 variations speed up the hip-isolation chorus.", status: "reported", source: "https://www.kpopecho.com/2026/03/top-10-k-pop-dance-challenges-of-2026.html" },
      ],
      sources: ["https://www.kpopecho.com/2026/03/top-10-k-pop-dance-challenges-of-2026.html"],
    },
    {
      id: "wave-canon",
      name: "Chest-wave canon (formation ripple)",
      nameKo: "웨이브 캐논",
      summary: "Members enter the same chest-led wave one after another (quarter-beat delays), so the formation ripples. Precision is in the *intentional* offset.",
      pointMove: "Cascading chest waves passed down the line.",
      profile: { flow: 85, rhythm: 80, groove: 55, sharpness: 40, extension: 55 },
      cues: ["The wave starts in the chest, not the arms.", "In a group, the delay must be exact — count it as '1-e-&-a'.", "Check it in the Members tab: timing offsets should be even steps."],
      drills: ["waves", "slow-motion", "count-clap"],
      examples: [],
      sources: ["https://kpopheadlines.com/dance-challenges"],
    },
    {
      id: "story-flow",
      name: "Narrative flow & partner work",
      nameKo: "스토리텔링 · 파트너 안무",
      summary: "Dance breaks that tell a mini-story: continuous transitions, partner work, emotion over hits.",
      pointMove: "Seamless transitions and linked shapes between members.",
      profile: { flow: 90, extension: 70, sharpness: 30, power: 45, levels: 55 },
      cues: ["Every move finishes into the next — no dead stops.", "Long lines through the fingertips; the face carries the story.", "Practise transitions, not just the poses."],
      drills: ["waves", "lines", "slow-motion"],
      examples: [],
      sources: ["https://glofan.co/articles/5-k-pop-choreography-trends-you-ll-see-everywhere-in-2026-a051c5"],
    },
    {
      id: "endurance",
      name: "Full-out endurance performance",
      nameKo: "체력형 퍼포먼스",
      summary: "High-speed, three-minute full-out routines — the counterpart to micro-challenges. Energy has to hold to the last chorus.",
      pointMove: "No rest phrases: power and speed from start to finish.",
      profile: { power: 90, sharpness: 70, footwork: 65, rhythm: 70, levels: 60 },
      cues: ["Energy in the last third should match the first (check Stamina).", "Breathe on the calm counts; spend it on the hits.", "Build with full run-throughs × 3 per session."],
      drills: ["full-out-8s", "plie-drops", "hit-freeze"],
      examples: [],
      sources: ["https://glofan.co/articles/5-k-pop-choreography-trends-you-ll-see-everywhere-in-2026-a051c5"],
    },
    {
      id: "shuffle-32",
      name: "Random-play & 32-step shuffle",
      nameKo: "랜덤플레이 · 32스텝 셔플",
      summary: "Community dance culture: random-play dance and shuffle festas with beginner–intermediate 32-step routines.",
      pointMove: "Repeating step patterns that everyone can join.",
      profile: { footwork: 80, groove: 65, rhythm: 75, power: 50, extension: 35, levels: 20 },
      cues: ["Clean, repeatable steps beat big styling.", "Stay on the grid: every step on a count.", "Know the first 8 counts of many songs (random play)."],
      drills: ["step-ladder", "groove-walk", "count-clap"],
      examples: [],
      sources: ["https://namu.wiki/w/%EB%9E%9C%EB%8D%A4%20%ED%94%8C%EB%A0%88%EC%9D%B4%20%EB%8C%84%EC%8A%A4"],
    },
  ],
  // Recent comebacks worth analyzing (release facts only — no style claims).
  recent: [
    { artist: "Kiss of Life", song: "SWEAT", date: "2026-08-04", source: "https://en.wikipedia.org/wiki/2026_in_South_Korean_music" },
    { artist: "Red Velvet", song: "Velvet Summer", date: "2026-08", source: "https://en.wikipedia.org/wiki/2026_in_South_Korean_music" },
    { artist: "WHIB", song: "Cherry Pie", date: "2026-08-05", source: "https://en.wikipedia.org/wiki/2026_in_South_Korean_music" },
    { artist: "KATSEYE", song: "Animal", date: "2026-07-24", source: "https://kpopheadlines.com/dance-challenges" },
    { artist: "BABYMONSTER", song: "CHOOM", date: "2026-05-04", source: "https://en.wikipedia.org/wiki/Choom_(EP)" },
  ],
};

// ── validation (used by the server for claude-researched catalogs) ──────────
const str = (x, n) => (typeof x === "string" ? x.trim().slice(0, n) : "");
const url = (x) => { const s = str(x, 400); return /^https?:\/\/[^\s"'<>]+$/.test(s) ? s : ""; };
export function validateTrends(obj) {
  if (!obj || !Array.isArray(obj.trends)) throw new Error("trends[] missing");
  const trends = obj.trends.slice(0, 16).map((t, i) => {
    const profile = {};
    for (const k of AXIS_KEYS) if (t.profile && Number.isFinite(+t.profile[k])) profile[k] = Math.max(0, Math.min(100, Math.round(+t.profile[k])));
    if (Object.keys(profile).length < 3) throw new Error(`trend ${i}: profile needs ≥ 3 axes`);
    return {
      id: str(t.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, "-") || "trend-" + i,
      name: str(t.name, 60) || "Trend " + (i + 1),
      nameKo: str(t.nameKo, 40),
      summary: str(t.summary, 400),
      pointMove: str(t.pointMove, 200),
      profile,
      cues: (Array.isArray(t.cues) ? t.cues : []).slice(0, 5).map((c) => str(c, 200)).filter(Boolean),
      drills: (Array.isArray(t.drills) ? t.drills : []).slice(0, 4).map((d) => str(d, 30)).filter(Boolean),
      examples: (Array.isArray(t.examples) ? t.examples : []).slice(0, 5).map((e) => ({
        artist: str(e.artist, 60), song: str(e.song, 80), date: str(e.date, 20), note: str(e.note, 300),
        status: ["confirmed release", "reported"].includes(e.status) ? e.status : "reported", source: url(e.source),
      })).filter((e) => e.artist && e.song),
      sources: (Array.isArray(t.sources) ? t.sources : []).map(url).filter(Boolean).slice(0, 6),
    };
  });
  if (!trends.length) throw new Error("no trends");
  return {
    asOf: str(obj.asOf, 20) || new Date().toISOString().slice(0, 7),
    origin: str(obj.origin, 20) || "researched",
    note: str(obj.note, 300),
    trends,
    recent: (Array.isArray(obj.recent) ? obj.recent : []).slice(0, 12).map((r) => ({ artist: str(r.artist, 60), song: str(r.song, 80), date: str(r.date, 20), source: url(r.source) })).filter((r) => r.artist && r.song),
  };
}

// ── trend fit ───────────────────────────────────────────────────────────────
// fit 0–100: 100 − 1.4 × mean |axis − target| over the axes the trend defines.
// gaps: the axes furthest from the trend, signed (positive = need more).
export function trendFit(axes, trend) {
  const keys = Object.keys(trend.profile);
  const diffs = keys.map((k) => ({ axis: k, have: axes[k], want: trend.profile[k], delta: trend.profile[k] - axes[k] }));
  const mad = diffs.reduce((s, d) => s + Math.abs(d.delta), 0) / keys.length;
  const gaps = diffs.filter((d) => Math.abs(d.delta) >= 15).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { id: trend.id, fit: Math.max(0, Math.round(100 - 1.4 * mad)), gaps };
}

export function rankTrends(axes, catalog) {
  return catalog.trends.map((t) => ({ ...trendFit(axes, t), trend: t })).sort((a, b) => b.fit - a.fit);
}

export const youtubeSearch = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
