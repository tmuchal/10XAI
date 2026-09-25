// ============================================================================
// film/timeline.js: THE timeline. Loaded first by index.html; read by the Python tools too
// (tools/timeline.py parses the object between the JSON and END comment markers, so keep it strict JSON).
//
// Chapters play back to back in this order; each chapter's film start is the sum of the durations before it.
//   id         chapters/<id>.js registers its scene through scene(a, b, build)
//   dur        seconds on screen
//   authoredAt the clock the chapter file is written in: scene(a, …) uses a == authoredAt, and every time
//              literal in the file (scene window, caps, cite, update(t) logic) is on that clock. The film start
//              may differ; scene() re-bases it (shift = start - authoredAt). New chapters use authoredAt 0.
//   label      title-card / hanging-sign kicker. "auto" = numbered in order ("CHAPTER 01", "CHAPTER 02", …, counting
//              only "auto" chapters), any other string is used as is ("FIN"); null = no kicker (the opener)
//   sign       [Korean, English] text on the hanging sign that drops at the chapter's curtain
// Anchors and 3D shots are { ch, at }: at = seconds after that chapter's FILM start (negative = before it).
// Curtain (film seconds relative to each boundary B, plus the film end E):
//   closes B-closeLead .. B-closedAt, opens B+openAt .. B+openLag; final close E-endClose .. E-endClosed.
// ============================================================================
window.TIMELINE = /*JSON*/{
  "fps": 30,
  "fade": 0.6,
  "curtain": { "closeLead": 0.75, "closedAt": 0.2, "openAt": 0.5, "openLag": 1.25, "endClose": 1.3, "endClosed": 0.4 },
  "chapters": [
    { "id": "ch00", "dur": 10, "authoredAt": 0,   "label": null,         "sign": null },
    { "id": "ch01", "dur": 30, "authoredAt": 10,  "label": "auto",       "sign": ["누구를 위한 페이지?", "Who is it for?"] },
    { "id": "ch02", "dur": 32, "authoredAt": 40,  "label": "auto",       "sign": ["전체 흐름 잡기", "Shaping the flow"] },
    { "id": "ch03", "dur": 34, "authoredAt": 72,  "label": "auto",       "sign": ["캐릭터 일관성", "One consistent character"] },
    { "id": "ch03s","dur": 20, "authoredAt": 0,   "label": "auto",       "sign": ["Seedance 2.5 × 프롬프팅", "Seedance 2.5 prompting"] },
    { "id": "ch04", "dur": 28, "authoredAt": 106, "label": "auto",       "sign": ["몰입감 만들기", "Building immersion"] },
    { "id": "ch05", "dur": 26, "authoredAt": 134, "label": "auto",       "sign": ["전문성 × 유머", "Expertise × humor"] },
    { "id": "ch06", "dur": 24, "authoredAt": 160, "label": "auto",       "sign": ["결국, 매출로", "Turning it into sales"] },
    { "id": "ch07", "dur": 8,  "authoredAt": 184, "label": "FIN",        "sign": ["커튼콜", "Curtain call"] }
  ],
  "anchors": {
    "extrasCheer": { "ch": "ch06", "at": 3, "until": 16 }
  },
  "shots3d": [
    { "name": "flythrough",  "ch": "ch00", "at": 0 },
    { "name": "photobooth",  "ch": "ch03", "at": 14.5 },
    { "name": "coinfunnel",  "ch": "ch06", "at": 3.0 },
    { "name": "curtaincall", "ch": "ch07", "at": 3.0 }
  ]
}/*END*/;
(T => {
  let s = 0, n = 0;
  T.chapters.forEach((c, i) => { c.index = i; c.start = s; s += c.dur; c.end = s; c.shift = c.start - c.authoredAt;
    if (c.label === "auto") c.label = "CHAPTER " + String(++n).padStart(2, "0"); });
  T.total = s;
  T.byId = Object.fromEntries(T.chapters.map(c => [c.id, c]));
  T.at = (ch, lt) => { const c = T.byId[ch]; if (!c) throw new Error("TIMELINE: unknown chapter " + ch); return c.start + lt; };
  T.bounds = T.chapters.slice(1).map(c => c.start);            // curtain boundaries (film s)
  T.boundChapters = T.chapters.slice(1);                       // the chapter each boundary opens
  T.shotStart = name => { const x = T.shots3d.find(e => e.name === name); return x ? T.at(x.ch, x.at) : null; };
})(window.TIMELINE);
