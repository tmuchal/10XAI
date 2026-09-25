// 10XAI Sports — pitch channels (soccer). y is 0–100 from the attacking team's
// perspective: L = its left touchline side, R = its right.
const CH = (y) => (y < 33.3 ? "L" : y > 66.7 ? "R" : "C");
const MIRROR = { L: "R", C: "C", R: "L" };   // my left attacks their right
const FLANK = { L: "left", C: "central", R: "right" };

// Which channel an attack came through. A shot's own location is useless for this
// (most shots are taken centrally, inside the box). Instead, take the widest action
// by the same team in the attacking 40% during the 15 s before the shot: the
// cross, cut-back or carry that made the chance. `events` must be time-sorted.
const LOOKBACK_S = 15;
function buildUpChannel(events, i) {
  const shot = events[i];
  if (typeof shot.y === "number" && CH(shot.y) !== "C") return CH(shot.y);
  if (shot.t == null) return typeof shot.y === "number" ? "C" : null;
  let best = null, bestWide = 17;
  for (let j = i - 1; j >= 0; j--) {
    const e = events[j];
    if (e.t == null || shot.t - e.t > LOOKBACK_S) break;
    if (e.team !== shot.team || typeof e.y !== "number" || typeof e.x !== "number" || e.x < 60) continue;
    const wide = Math.abs(e.y - 50);
    if (wide > bestWide) { bestWide = wide; best = CH(e.y); }
  }
  return best || (typeof shot.y === "number" ? "C" : null);
}

const sortedEvents = (m) => (m.events.some((e) => e.t == null) ? m.events : [...m.events].sort((a, b) => a.t - b.t));

module.exports = { CH, MIRROR, FLANK, buildUpChannel, sortedEvents };
