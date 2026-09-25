// Dance Lab — drill library and practice-plan builder.
// Drills are keyed to the style axes in analyze.mjs. Each one says why it was
// picked (the measured number), how to do it, and a target you can check in
// Practice mode.

const fmtBpm = (b) => Math.round(b);

export const DRILLS = {
  sharpness: [
    { id: "hit-freeze", name: "Hit & Freeze", minutes: 6,
      how: ["Metronome at the practice tempo.", "On counts 1 and 5, snap into a pose from the choreography as fast as you can.", "Hold completely still until the next hit — no drifting fingers, no settling.", "Film one 8-count and check the stop in slow motion."],
      target: (r) => r.stopTime != null ? `Lock each pose within ${Math.round(r.stopTime * 1000 + 30)} ms (reference: ${Math.round(r.stopTime * 1000)} ms).` : "Every pose fully still by the next count." },
    { id: "accent-map", name: "Accent mapping", minutes: 5,
      how: ["Watch one 8-count of the killing part at 0.5x.", "Write down which counts are hits (e.g. 1, 3&, 5, 7).", "Mark it at half speed hitting only those counts, soft on the rest."],
      target: (r) => `Match the reference density: ~${Math.round(r.hitsPerMin)} hits per minute.` },
  ],
  power: [
    { id: "full-out-8s", name: "Full-out 8-counts", minutes: 6,
      how: ["Pick the highest-energy phrase.", "Dance one 8-count at 100% intensity, rest one 8-count, repeat ×8.", "Push the movement through the whole body — not just the arms."],
      target: (r) => `Reach average limb speed ≈ ${r.energy} torso-lengths/s in Practice mode.` },
    { id: "plie-drops", name: "Plié drops", minutes: 4,
      how: ["Feet wider than shoulders.", "Drop into a plié on every beat and drive back up explosively.", "Keep the chest proud — power comes from the legs."],
      target: () => "4 sets × 16 counts without losing tempo." },
  ],
  flow: [
    { id: "waves", name: "Body & arm waves", minutes: 6,
      how: ["Arm wave: shoulder → elbow → wrist → fingers, both directions, 4 counts each.", "Body wave: chest → ribs → hips → knees, then reverse.", "Link two waves without stopping."],
      target: (r) => `Keep moving ${Math.round(r.continuity * 100)}% of the time, like the reference.` },
    { id: "slow-motion", name: "Slow-motion run", minutes: 5,
      how: ["Play the section at 0.5x.", "Dance it continuously with no pauses between moves.", "If a move stops, find the path that connects it to the next one."],
      target: () => "One full section at 0.5x without a single dead stop." },
  ],
  groove: [
    { id: "bounce", name: "Bounce foundation", minutes: 5,
      how: (r) => [`Metronome at ${fmtBpm(r.bpm || 100)} BPM.`, r.bounceOnBeat != null && r.bounceOnBeat < 0 ? "Up-bounce: rise on every beat, sink on the &." : "Down-bounce: drop the hips on every beat, recover on the &.", "Knees soft, chest relaxed; add a small shoulder bounce after 16 counts."],
      target: (r) => `Bounce depth ≈ ${r.bounceAmp} torso-lengths (about ${Math.round(r.bounceAmp * 50)} cm for a 50 cm torso).` },
    { id: "groove-walk", name: "Groove walk", minutes: 4,
      how: ["Walk forward/back on the beat keeping the bounce.", "Add a shoulder roll every 4 counts.", "Never let the bounce stop when you change direction."],
      target: () => "16 counts forward, 16 back, bounce never breaks." },
  ],
  extension: [
    { id: "lines", name: "Line finishing", minutes: 5,
      how: ["Take the 4 biggest shapes of the choreography.", "Hold each for 4 counts in front of a mirror, reaching through the fingertips.", "Then hit each shape on 1 and hold to 4."],
      target: (r) => `Arms at ≥ ${Math.round(r.extension * 100)}% of full length on those shapes.` },
  ],
  footwork: [
    { id: "step-ladder", name: "Step ladder", minutes: 6,
      how: ["Isolate the footwork of the section — arms relaxed at your sides.", "Count it out loud at 0.5x, then 0.75x, then 1x.", "Only add the arms once the feet are automatic."],
      target: (r) => `Travel ≈ ${r.travelPerMin} torso-lengths per minute of choreography.` },
  ],
  levels: [
    { id: "level-changes", name: "Level changes", minutes: 5,
      how: ["Practise each drop/rise on its own for 8 reps.", "Land the low position on the count, not after it.", "Protect the knees: land through the balls of the feet."],
      target: (r) => `Hip height range ≈ ${r.levelRange} torso-lengths.` },
  ],
  rhythm: [
    { id: "count-clap", name: "Count & clap", minutes: 4,
      how: ["Play the song, count 8s out loud.", "Clap only on the accents you mapped.", "Then dance it saying the counts."],
      target: (r) => r.onBeat != null ? `≥ ${Math.round(r.onBeat * 100)}% of hits on the beat (reference).` : "Every hit on a count you can name." },
  ],
  balance: [
    { id: "weak-side", name: "Weak-side reps", minutes: 4,
      how: ["Flip the choreography to your weak side.", "Mark it ×4 slowly, then full-out ×2.", "Switch back — both sides should now look the same."],
      target: () => "Left/right match ≥ 80% in Practice mode." },
  ],
  isolation: [
    { id: "chest-iso", name: "Chest isolations", minutes: 4,
      how: ["Hips locked.", "Chest forward/back ×8, side/side ×8, then circles.", "Add hits: pop the chest on 1, 3, 5, 7."],
      target: () => "Hips stay still while the chest moves." },
  ],
};

function resolve(d, raw) {
  return { id: d.id, name: d.name, minutes: d.minutes, how: typeof d.how === "function" ? d.how(raw) : d.how, target: d.target(raw) };
}

export const DRILL_BY_ID = Object.fromEntries(Object.entries(DRILLS).flatMap(([axis, list]) => list.map((d) => [d.id, { ...d, axis }])));

// Target a trend: close the biggest axis gaps first, then the trend's own drills.
export function trendPlan(res, fit) {
  const t = fit.trend, r = res.raw;
  const ids = [];
  for (const g of fit.gaps) if (g.delta > 0 && DRILLS[g.axis]) ids.push(DRILLS[g.axis][0].id);
  for (const id of t.drills || []) ids.push(id);
  const drills = [...new Set(ids)].filter((id) => DRILL_BY_ID[id]).slice(0, 4).map((id) => {
    const d = DRILL_BY_ID[id], g = fit.gaps.find((x) => x.axis === d.axis);
    return { ...resolve(d, r), axis: d.axis, why: g ? `${t.name}: ${d.axis} ${g.have} → ${g.want}` : `Core drill for ${t.name}.` };
  });
  return { trend: t, fit: fit.fit, gaps: fit.gaps, drills, cues: t.cues || [] };
}

export function buildPracticePlan(res) {
  const r = res.raw, axes = res.axes;
  const bpm = r.bpm || null;
  const ladder = [0.5, 0.75, 0.9, 1].map((x) => ({ speed: x, bpm: bpm ? Math.round(bpm * x) : null }));
  // Signature = what makes this dance feel like itself; drill those first.
  const signature = Object.entries(axes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const drills = [];
  for (const k of signature) {
    const list = DRILLS[k] || [];
    list.slice(0, 1).forEach((d) => drills.push({ ...resolve(d, r), axis: k, why: `Signature trait — ${k} scored ${axes[k]}/100.` }));
  }
  if (r.upperShare <= 0.45 && !signature.includes("footwork")) drills.push({ ...resolve(DRILLS.footwork[0], r), axis: "footwork", why: `Legs carry ${Math.round((1 - r.upperShare) * 100)}% of the motion.` });
  if (r.isolation >= 0.45) drills.push({ ...resolve(DRILLS.isolation[0], r), axis: "isolation", why: `Chest isolation ${Math.round(r.isolation * 100)}%.` });
  if (signature.includes("sharpness")) drills.push({ ...resolve(DRILLS.sharpness[1], r), axis: "sharpness", why: "Sharp styles live or die on knowing exactly which counts hit." });
  drills.push({ ...resolve(DRILLS.balance[0], r), axis: "balance", why: "Most dancers have a weaker side; idol choreo is often mirrored across members." });

  const focus = (res.sections || []).filter((s) => s.killing).sort((a, b) => a.killing - b.killing);
  const drillMin = drills.reduce((s, d) => s + d.minutes, 0);
  const session = [
    { block: "Warm-up", minutes: 6, detail: "Neck/shoulder rolls, hip circles, 16 counts of bounce at the song tempo." },
    { block: "Signature drills", minutes: drillMin, detail: drills.map((d) => d.name).join(" → ") },
    { block: "Section loops", minutes: 15, detail: focus.length ? `Loop the killing part${focus.length > 1 ? "s" : ""} (${focus.map((s) => `${fmtTime(s.start)}–${fmtTime(s.end)}`).join(", ")}) at 0.5x → 0.75x → 1x. Move up only when your match score is ≥ 70.` : "Loop each 8-count at 0.5x → 0.75x → 1x. Move up only when your match score is ≥ 70." },
    { block: "Full run + record", minutes: 8, detail: "Two full run-throughs in Practice mode. Compare your numbers against the reference." },
  ];
  const weeks = [
    { week: 1, goal: "Learn it", detail: "0.5x only. Counts out loud. Marking is fine — accuracy over energy. Target match ≥ 60." },
    { week: 2, goal: "Make it yours", detail: `0.75x full-out. Add the signature: ${signature.join(", ")}. Target match ≥ 70.` },
    { week: 3, goal: "Perform it", detail: "1x with music and facial expression. Film yourself; aim for energy within 15% of the reference." },
  ];
  return { bpm, bpmSource: r.bpmSource, ladder, signature, drills, focus, session, sessionMinutes: session.reduce((s, b) => s + b.minutes, 0), weeks };
}

export function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
