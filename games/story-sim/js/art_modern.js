/*
 * art_modern.js — painted backgrounds for the modern / dating-sim, apocalypse,
 * Joseon-court and occult / fantasy sets (SPEC.md §1 "Modern & dating-sim sets").
 *
 * Classic script, loaded right after js/art.js. Adds painters to ART._scenes:
 *   ART._scenes[id] = function (c, rnd) { … }   // 1280×720 CanvasRenderingContext2D + seeded RNG
 * ART.bg(id) looks painters up at call time, so no other wiring is needed.
 * Exports ART.MODERN_IDS. All painting is deterministic (only rnd() is used).
 */
(function () {
if (typeof window === 'undefined' || !window.ART) return;
var ART = window.ART, S = ART._scenes || (ART._scenes = {});

/* ------------------------------------------------------------ helpers */
var W = 1280, H = 720, PI = Math.PI, TAU = PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function h2r(h) {
  h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var v = parseInt(h, 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function r2h(c) { return '#' + c.map(function (v) { v = clamp(Math.round(v), 0, 255); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
function mix(a, b, t) { var A = h2r(a), B = h2r(b); return r2h([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); }
function dk(c, t) { return mix(c, '#140c1c', t); }
function lt(c, t) { return mix(c, '#ffffff', t); }
function rgba(c, a) { var r = h2r(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + (+a).toFixed(3) + ')'; }
function lerp(a, b, t) { return a + (b - a) * t; }
function pick(R, a) { return a[Math.floor(R() * a.length) % a.length]; }
function LG(c, x0, y0, x1, y1, st) { var q = c.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < st.length; i++) q.addColorStop(st[i][0], st[i][1]); return q; }
function RG(c, x, y, r, st, r0) { var q = c.createRadialGradient(x, y, r0 || 0, x, y, Math.max(r, 1)); for (var i = 0; i < st.length; i++) q.addColorStop(st[i][0], st[i][1]); return q; }
function V(c, y0, y1, st) { return LG(c, 0, y0, 0, y1, st); }
function rect(c, x, y, w, h, f) { c.fillStyle = f; c.fillRect(x, y, w, h); }
function poly(c, pts, f, s, lw) {
  c.beginPath(); for (var i = 0; i < pts.length; i++) { if (i) c.lineTo(pts[i][0], pts[i][1]); else c.moveTo(pts[i][0], pts[i][1]); } c.closePath();
  if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = lw || 1; c.stroke(); }
}
function eli(c, x, y, rx, ry, f, rot) { c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), rot || 0, 0, TAU); c.fillStyle = f; c.fill(); }
function line(c, x0, y0, x1, y1, s, w) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = s; c.lineWidth = w || 1; c.stroke(); }
function rr(c, x, y, w, h, r, f, s, lw) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = lw || 1; c.stroke(); }
}
function glow(c, x, y, r, col, a) { c.fillStyle = RG(c, x, y, r, [[0, rgba(col, a)], [0.35, rgba(col, a * 0.45)], [1, rgba(col, 0)]]); c.fillRect(x - r, y - r, r * 2, r * 2); }
function lighter(c, fn) { c.save(); c.globalCompositeOperation = 'lighter'; fn(); c.restore(); }
function alpha(c, a, fn) { c.save(); c.globalAlpha = a; fn(); c.restore(); }
function clip(c, pts, fn) { c.save(); c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.clip(); fn(); c.restore(); }
function clipR(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
function puff(c, x, y, r, col, a) { c.fillStyle = RG(c, x, y, r, [[0, rgba(col, a)], [0.55, rgba(col, a * 0.85)], [1, rgba(col, 0)]]); c.fillRect(x - r, y - r, r * 2, r * 2); }
function cloud(c, R, x, y, w, col, sh, a) {
  var k, n0 = 7 + Math.floor(R() * 5);
  for (k = 0; k < n0; k++) { var t = k / (n0 - 1); puff(c, x + (t - 0.5) * w, y + 14 + R() * 10, w * (0.16 + R() * 0.08), sh, a * 0.7); }
  for (k = 0; k < n0; k++) { var u = k / (n0 - 1); puff(c, x + (u - 0.5) * w * 0.9, y - Math.sin(u * PI) * w * 0.12 + R() * 8, w * (0.14 + R() * 0.1) * (0.6 + Math.sin(u * PI) * 0.6), col, a); }
}
function tower(c, R, x, y, w, col, sh, a) { // towering cumulus
  for (var k = 0; k < 16; k++) { var t = k / 15, cx = x + (R() - 0.5) * w * (1 - t * 0.5), cy = y - t * w * 0.7, r = w * (0.22 - t * 0.08) * (0.8 + R() * 0.4); puff(c, cx + r * 0.2, cy + r * 0.25, r, sh, a * 0.6); puff(c, cx, cy, r, col, a); }
}
function stars(c, R, n0, y1, a) {
  for (var i = 0; i < n0; i++) {
    var x = R() * W, y = Math.pow(R(), 1.3) * y1, r = R() < 0.93 ? R() * 1.1 + 0.3 : R() * 1.4 + 1.2;
    c.fillStyle = 'rgba(255,255,255,' + ((a || 1) * (0.35 + R() * 0.65)).toFixed(2) + ')'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    if (r > 1.9) { glow(c, x, y, r * 6, '#cfe0ff', 0.3); line(c, x - r * 4, y, x + r * 4, y, 'rgba(255,255,255,.45)', 0.7); line(c, x, y - r * 4, x, y + r * 4, 'rgba(255,255,255,.45)', 0.7); }
  }
}
function moon(c, x, y, r, col) {
  glow(c, x, y, r * 7, col || '#b9ccff', 0.35);
  eli(c, x, y, r, r, RG(c, x - r * 0.3, y - r * 0.3, r * 1.3, [[0, '#fffdf2'], [1, '#e2d8bc']]));
  alpha(c, 0.12, function () { eli(c, x + r * 0.3, y - r * 0.1, r * 0.25, r * 0.22, '#8a8070'); eli(c, x - r * 0.35, y + r * 0.35, r * 0.18, r * 0.16, '#8a8070'); eli(c, x - r * 0.1, y - r * 0.45, r * 0.12, r * 0.1, '#8a8070'); });
}
function ridge(c, R, y, amp, col, f, x0, x1) {
  var p1 = R() * 9, p2 = R() * 9, p3 = R() * 9; f = f || 1; x0 = x0 || 0; x1 = x1 == null ? W : x1;
  c.beginPath(); c.moveTo(x0, H);
  for (var x = x0; x <= x1 + 8; x += 8) c.lineTo(x, y - amp * (0.55 * Math.sin(x * 0.004 * f + p1) + 0.3 * Math.sin(x * 0.011 * f + p2) + 0.15 * Math.sin(x * 0.031 * f + p3)));
  c.lineTo(x1, H); c.closePath(); c.fillStyle = col; c.fill();
}
function treeline(c, R, y, h, col, r0, x0, x1) {
  x0 = x0 || 0; x1 = x1 == null ? W : x1;
  c.fillStyle = col; c.beginPath(); c.moveTo(x0, H); c.lineTo(x0, y);
  for (var x = x0; x <= x1 + 30; x += 10 + R() * 18) { var r = (r0 || 22) * (0.6 + R() * 0.8), yy = y - R() * h; c.lineTo(x, yy); c.arc(x + r * 0.5, yy, r, PI, 0); }
  c.lineTo(x1, H); c.closePath(); c.fill();
}
function foliage(c, R, x, y, w, h, dark, light, n0) {
  for (var k = 0; k < (n0 || 24); k++) { var bx = x + (R() - 0.5) * w, by = y - R() * h, r = h * (0.16 + R() * 0.18); eli(c, bx, by, r * 1.2, r, RG(c, bx - r * 0.3, by - r * 0.5, r * 1.5, [[0, light], [0.7, dark], [1, dk(dark, 0.3)]])); }
}
function shaft(c, pts, col, a) {
  var x0 = (pts[0][0] + pts[1][0]) / 2, y0 = (pts[0][1] + pts[1][1]) / 2, x1 = (pts[2][0] + pts[3][0]) / 2, y1 = (pts[2][1] + pts[3][1]) / 2;
  lighter(c, function () { poly(c, pts, LG(c, x0, y0, x1, y1, [[0, rgba(col, a)], [1, rgba(col, 0)]])); });
}
function bokeh(c, R, n0, cols, r0, r1, a, y0, y1) {
  lighter(c, function () {
    for (var i = 0; i < n0; i++) {
      var x = R() * W, y = lerp(y0 || 0, y1 == null ? H : y1, R()), r = lerp(r0, r1, R()), col = pick(R, cols);
      c.fillStyle = RG(c, x, y, r, [[0, rgba(col, a * 0.6)], [0.75, rgba(col, a * 0.45)], [0.92, rgba(col, a * 0.8)], [1, rgba(col, 0)]]);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  });
}
function motes(c, R, n0, col, y0, y1, x0, x1) { lighter(c, function () { for (var i = 0; i < n0; i++) { var x = lerp(x0 || 0, x1 == null ? W : x1, R()), y = lerp(y0, y1, R()); glow(c, x, y, 2 + R() * 5, col, 0.4 + R() * 0.4); } }); }
function finish(c, o) {
  o = o || {};
  if (o.tint) alpha(c, o.ta || 0.12, function () { c.globalCompositeOperation = 'soft-light'; rect(c, 0, 0, W, H, o.tint); });
  if (o.haze) rect(c, 0, 0, W, H, V(c, 0, H, [[0, rgba(o.haze, 0)], [0.55, rgba(o.haze, o.ha || 0.08)], [1, rgba(o.haze, (o.ha || 0.08) * 1.8)]]));
  if (o.low) rect(c, 0, H * 0.55, W, H * 0.45, V(c, H * 0.55, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,6,20,' + o.low + ')']]));
  rect(c, 0, 0, W, H, RG(c, W / 2, H * 0.45, W * 0.72, [[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(10,5,20,' + (o.vig == null ? 0.5 : o.vig) + ')']]));
}
function txt(c, s, x, y, size, col, o) {
  o = o || {};
  c.save(); c.font = (o.w || '700') + ' ' + size + 'px ' + (o.f || '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif');
  c.textAlign = o.a || 'center'; c.textBaseline = 'middle'; c.fillStyle = col;
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 14; }
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); c.fillText(s, 0, 0); } else c.fillText(s, x, y);
  c.restore();
}
/* simple pinhole camera: x right, y up, z forward; horizon at cy, eye height `eye` */
function Cam(f, cx, cy, eye) {
  var P = function (x, y, z) { z = Math.max(z, 0.04); return [cx + f * x / z, cy - f * (y - eye) / z]; };
  P.f = f; P.cx = cx; P.cy = cy; P.eye = eye; return P;
}
function q3(c, P, pts, f, s, lw) { poly(c, pts.map(function (p) { return P(p[0], p[1], p[2]); }), f, s, lw); }
function l3(c, P, a, b, s, w) { var A = P(a[0], a[1], a[2]), B = P(b[0], b[1], b[2]); line(c, A[0], A[1], B[0], B[1], s, w); }
function sc(P, z) { return P.f / z; }
/* axis-aligned box; col = front colour, faces auto-shaded */
function box(c, P, x0, y0, z0, x1, y1, z1, col, o) {
  o = o || {};
  var top = o.top || lt(col, 0.18), side = o.side || dk(col, 0.28);
  if (x0 > 0) q3(c, P, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], side);
  if (x1 < 0) q3(c, P, [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], side);
  if (y1 < P.eye) q3(c, P, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top);
  if (y0 > P.eye) q3(c, P, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], o.bot || dk(col, 0.4));
  if (!o.noFront) q3(c, P, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], o.front || col);
}
/* a 3D room shell. o: {x0,x1,y1,zb,zn, floor,ceil,left,right,back} colour-stop arrays; returns screen rect of back wall */
function shell(c, P, o) {
  var x0 = o.x0, x1 = o.x1, y1 = o.y1, zb = o.zb, zn = o.zn || 0.35;
  var B0 = P(x0, y1, zb), B1 = P(x1, 0, zb), N0 = P(x0, y1, zn), N1 = P(x1, 0, zn);
  q3(c, P, [[x0, y1, zn], [x1, y1, zn], [x1, y1, zb], [x0, y1, zb]], V(c, Math.min(N0[1], 0), B0[1], o.ceil));
  q3(c, P, [[x0, 0, zn], [x0, 0, zb], [x0, y1, zb], [x0, y1, zn]], LG(c, Math.max(N0[0], -200), 0, B0[0], 0, o.left));
  q3(c, P, [[x1, 0, zn], [x1, 0, zb], [x1, y1, zb], [x1, y1, zn]], LG(c, Math.min(N1[0], W + 200), 0, B1[0], 0, o.right || o.left));
  q3(c, P, [[x0, 0, zn], [x1, 0, zn], [x1, 0, zb], [x0, 0, zb]], V(c, B1[1], Math.max(N1[1], H), o.floor));
  rect(c, B0[0], B0[1], B1[0] - B0[0], B1[1] - B0[1], V(c, B0[1], B1[1], o.back));
  return { x: B0[0], y: B0[1], w: B1[0] - B0[0], h: B1[1] - B0[1] };
}
function planks(c, P, x0, x1, zn, zb, step, col, w) { for (var x = x0; x <= x1 + 1e-6; x += step) l3(c, P, [x, 0, zn], [x, 0, zb], col, w || 1); }
function zlines(c, P, x0, x1, y, zs, col, w) { zs.forEach(function (z) { l3(c, P, [x0, y, z], [x1, y, z], col, w || 1); }); }
/* window pane with sky content painter */
function pane(c, x, y, w, h, frame, fw, paint, cols, rows) {
  rect(c, x - fw, y - fw, w + fw * 2, h + fw * 2, frame);
  clipR(c, x, y, w, h, paint);
  var k; for (k = 1; k < (cols || 1); k++) rect(c, x + w * k / cols - fw / 3, y, fw * 0.66, h, frame);
  for (k = 1; k < (rows || 1); k++) rect(c, x, y + h * k / rows - fw / 3, w, fw * 0.66, frame);
}
function skyline(c, R, base, hmin, hmax, col, win, dens, wmin, wmax, x0, x1) {
  var x = x0 == null ? -10 : x0; x1 = x1 == null ? W + 10 : x1;
  while (x < x1) {
    var bw = (wmin || 40) + R() * ((wmax || 110) - (wmin || 40)), bh = hmin + R() * (hmax - hmin);
    rect(c, x, base - bh, bw, bh + 2, col);
    if (R() < 0.3) rect(c, x + bw * 0.3, base - bh - 12, bw * 0.4, 12, col);
    if (R() < 0.15) line(c, x + bw * 0.5, base - bh - 12, x + bw * 0.5, base - bh - 40, col, 2);
    if (win) {
      c.fillStyle = win;
      for (var yy = base - bh + 8; yy < base - 6; yy += 9) for (var xx = x + 5; xx < x + bw - 6; xx += 8) if (R() < dens) { c.globalAlpha = 0.35 + R() * 0.65; c.fillRect(xx, yy, 4, 5); }
      c.globalAlpha = 1;
    }
    x += bw + R() * 4;
  }
}
function person(c, x, y, s, col) { // standing silhouette, feet at y
  eli(c, x, y - 160 * s, 13 * s, 15 * s, col);
  poly(c, [[x - 24 * s, y - 138 * s], [x + 24 * s, y - 138 * s], [x + 28 * s, y - 70 * s], [x + 16 * s, y - 70 * s], [x + 13 * s, y], [x + 2 * s, y], [x, y - 60 * s], [x - 2 * s, y], [x - 13 * s, y], [x - 16 * s, y - 70 * s], [x - 28 * s, y - 70 * s]], col);
}
function lantern(c, x, y, r, col, a) { // round paper lantern
  lighter(c, function () { glow(c, x, y, r * 4, col, a == null ? 0.45 : a); });
  eli(c, x, y, r, r * 1.2, RG(c, x - r * 0.2, y - r * 0.3, r * 1.4, [[0, '#fff6d8'], [0.5, col], [1, dk(col, 0.35)]]));
  alpha(c, 0.35, function () { for (var k = -2; k <= 2; k++) { c.beginPath(); c.ellipse(x, y + k * r * 0.4, r * Math.sqrt(1 - (k * 0.4 / 1.2) * (k * 0.4 / 1.2) * 0.9), r * 0.08, 0, 0, TAU); c.strokeStyle = dk(col, 0.5); c.lineWidth = 1; c.stroke(); } });
  rect(c, x - r * 0.35, y - r * 1.3, r * 0.7, r * 0.18, '#2a1a14'); rect(c, x - r * 0.35, y + r * 1.12, r * 0.7, r * 0.18, '#2a1a14');
}
function stringLights(c, R, x0, y0, x1, y1, sag, cols, n0, r) {
  var mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag * 2;
  c.strokeStyle = 'rgba(30,20,30,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
  lighter(c, function () {
    for (var k = 1; k < n0; k++) { var t = k / n0, u = 1 - t, x = u * u * x0 + 2 * u * t * mx + t * t * x1, y = u * u * y0 + 2 * u * t * my + t * t * y1, col = cols[k % cols.length]; glow(c, x, y + 3, (r || 3) * 5, col, 0.6); eli(c, x, y + 3, r || 3, r || 3, lt(col, 0.6)); }
  });
}
function firework(c, R, x, y, r, col, n0) {
  lighter(c, function () {
    glow(c, x, y, r * 1.4, col, 0.22);
    for (var k = 0; k < n0; k++) {
      var a = k / n0 * TAU + R() * 0.08, rr0 = r * (0.85 + R() * 0.2), ex = x + Math.cos(a) * rr0, ey = y + Math.sin(a) * rr0 + rr0 * 0.12;
      c.strokeStyle = LG(c, x, y, ex, ey, [[0, rgba(col, 0)], [0.6, rgba(col, 0.5)], [1, rgba(lt(col, 0.5), 0.95)]]); c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2); c.quadraticCurveTo(x + Math.cos(a) * rr0 * 0.8, y + Math.sin(a) * rr0 * 0.8, ex, ey); c.stroke();
      eli(c, ex, ey, 2.4, 2.4, lt(col, 0.7));
      if (R() < 0.5) eli(c, ex + Math.cos(a) * 8, ey + 10 + R() * 8, 1.4, 1.4, rgba(lt(col, 0.5), 0.7));
    }
    glow(c, x, y, r * 0.25, '#ffffff', 0.5);
  });
}
function petals(c, R, n0, col, y0, y1) {
  for (var i = 0; i < n0; i++) {
    var x = R() * W, y = lerp(y0, y1, R()), s = 3 + R() * 5 * (y / H + 0.4), a = R() * PI;
    eli(c, x, y, s, s * 0.55, rgba(i % 3 ? col : lt(col, 0.4), 0.6 + R() * 0.35), a);
  }
}
function rain(c, R, n0, col, a, len) {
  c.save(); c.strokeStyle = rgba(col, a); c.lineWidth = 1;
  c.beginPath(); for (var i = 0; i < n0; i++) { var x = R() * (W + 100) - 50, y = R() * H, l = (len || 26) * (0.5 + R()); c.moveTo(x, y); c.lineTo(x - l * 0.18, y + l); } c.stroke(); c.restore();
}
function fluo(c, P, x, y, z, w, d, a) { // ceiling light panel
  var s = q3; s(c, P, [[x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y, z + d], [x - w / 2, y, z + d]], '#fbfcff');
  var m = P(x, y, z + d / 2); lighter(c, function () { glow(c, m[0], m[1], sc(P, z + d / 2) * w * 0.9, '#e8f2ff', a == null ? 0.35 : a); });
}
function chalk(c, R, x, y, w, rows, col) { // cursive-looking chalk handwriting
  c.save(); c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 1.8;
  for (var r0 = 0; r0 < rows; r0++) {
    var yy = y + r0 * 24, xx = x + (r0 % 3 === 0 ? 0 : 20), end = x + w * (0.45 + R() * 0.55);
    while (xx < end) {
      var ww = 26 + R() * 50, n0 = Math.floor(ww * 1.6), fq = 0.55 + R() * 0.2; c.beginPath(); c.moveTo(xx, yy);
      for (var k = 1; k <= n0; k++) { var t = k / n0, ph = k * fq, amp = 3 + 2 * Math.sin(k * 0.13 + r0), px = xx + t * ww - Math.cos(ph) * 2.2, py = yy - Math.abs(Math.sin(ph * 0.5)) * amp - (Math.sin(k * 0.21 + xx) > 0.93 ? 5 : 0); c.lineTo(px, py); }
      c.stroke(); if (R() < 0.3) line(c, xx + ww * 0.3, yy - 11, xx + ww * 0.3 + 2, yy + 1, col, 1.6);
      xx += ww + 10 + R() * 12;
    }
  }
  c.restore();
}
function chair(c, P, x, z, col, face) { // school chair, face: -1 facing camera, 1 facing away
  box(c, P, x - 0.2, 0.42, z - 0.2, x + 0.2, 0.46, z + 0.2, col);
  [[-0.18, -0.18], [0.16, -0.18], [-0.18, 0.16], [0.16, 0.16]].forEach(function (o) { box(c, P, x + o[0], 0, z + o[1], x + o[0] + 0.03, 0.42, z + o[1] + 0.03, '#6a6e78'); });
  var bz = face > 0 ? z - 0.2 : z + 0.17; box(c, P, x - 0.19, 0.55, bz, x + 0.19, 0.82, bz + 0.03, col);
}
function desk(c, P, x, z, top, frame) { // school desk 0.6 x 0.45, height 0.72
  [[-0.28, -0.2], [0.25, -0.2], [-0.28, 0.18], [0.25, 0.18]].forEach(function (o) { box(c, P, x + o[0], 0, z + o[1], x + o[0] + 0.03, 0.7, z + o[1] + 0.03, frame); });
  box(c, P, x - 0.28, 0.52, z - 0.2, x + 0.28, 0.66, z + 0.2, dk(frame, 0.1));
  box(c, P, x - 0.31, 0.68, z - 0.23, x + 0.31, 0.72, z + 0.23, top, { top: lt(top, 0.12) });
}
function greenery(c, R, x, y, s) { // potted plant
  rr(c, x - 22 * s, y - 50 * s, 44 * s, 50 * s, 6 * s, V(c, y - 50 * s, y, [[0, '#e8e2d8'], [1, '#b8b0a4']]));
  for (var k = 0; k < 14; k++) { var a = -PI / 2 + (R() - 0.5) * 2.2, l = (50 + R() * 60) * s; c.save(); c.translate(x, y - 50 * s); c.rotate(a + PI / 2); eli(c, 0, -l / 2, 9 * s, l / 2, k % 2 ? '#3f7a44' : '#5c9a52'); c.restore(); }
}

var IDS = [];
function def(id, fn) { S[id] = fn; IDS.push(id); }

/* ------------------------------------------------ side-wall window helpers */
function sideWin(c, P, x, z0, z1, y0, y1, paint, frame, nz, ny, fw) {
  var pts = [P(x, y0, z0), P(x, y0, z1), P(x, y1, z1), P(x, y1, z0)];
  clip(c, pts, paint);
  var k; fw = fw || 0.06;
  for (k = 0; k <= nz; k++) { var z = lerp(z0, z1, k / nz); q3(c, P, [[x, y0, z - fw], [x, y0, z + fw], [x, y1, z + fw], [x, y1, z - fw]], frame); }
  for (k = 0; k <= ny; k++) { var y = lerp(y0, y1, k / ny); q3(c, P, [[x, y - fw * 0.7, z0], [x, y - fw * 0.7, z1], [x, y + fw * 0.7, z1], [x, y + fw * 0.7, z0]], frame); }
  return pts;
}
function sunPatch(c, P, x, z0, z1, y0, y1, d, col, a) { // light from a window at wall x hitting the floor, sun dir d=[dx,dy,dz] (dy<0)
  function hit(y, z) { var t = -y / d[1]; return [x + d[0] * t, 0, z + d[2] * t]; }
  var A = hit(y1, z0), B = hit(y1, z1), C2 = hit(y0, z1), D2 = hit(y0, z0);
  lighter(c, function () {
    q3(c, P, [A, B, C2, D2], rgba(col, a));
    var w0 = P(x, y1, z0), w1 = P(x, y1, z1), f0 = P(A[0], 0, A[2]), f1 = P(B[0], 0, B[2]);
    poly(c, [w0, w1, f1, f0], LG(c, (w0[0] + w1[0]) / 2, w0[1], (f0[0] + f1[0]) / 2, f0[1], [[0, rgba(col, a * 0.35)], [1, rgba(col, a * 0.05)]]));
  });
}
function wallCurtain(c, P, x, z0, z1, y0, y1, col, folds) {
  for (var k = 0; k < folds; k++) {
    var za = lerp(z0, z1, k / folds), zb = lerp(z0, z1, (k + 1) / folds), A = P(x, y1, za), B = P(x, y0, zb);
    q3(c, P, [[x, y0, za], [x, y0, zb], [x, y1, zb], [x, y1, za]], LG(c, A[0], 0, B[0], 0, [[0, dk(col, 0.25)], [0.4, lt(col, 0.25)], [0.7, col], [1, dk(col, 0.2)]]));
  }
}
function outsideDay(c, R, x0, y0, x1, y1, o) {
  o = o || {};
  rect(c, x0, y0, x1 - x0, y1 - y0, V(c, y0, y1, o.sky || [[0, '#7fb6e8'], [0.6, '#bfe0f4'], [1, '#f2f6e8']]));
  var hz = lerp(y0, y1, o.hz == null ? 0.62 : o.hz);
  for (var i = 0; i < 4; i++) cloud(c, R, lerp(x0, x1, R()), lerp(y0, hz, 0.2 + R() * 0.4), 60 + R() * 120, '#ffffff', '#cfe0ee', 0.8);
  if (o.city) { skyline(c, R, hz + 6, 10, 60, rgba('#9ab4c8', 0.9), null, 0, 20, 50, x0, x1); }
  treeline(c, R, hz + 20, 40, o.tree || '#6aa05e', 16, x0, x1);
  alpha(c, 0.6, function () { treeline(c, R, hz + 40, 30, dk(o.tree || '#6aa05e', 0.25), 20, x0, x1); });
}

/* ----------------------------------------------------------- school */
def('classroom', function (c, R) {
  var P = Cam(600, 640, 320, 1.2), X = 4.6, ZB = 8.4;
  var bk = shell(c, P, { x0: -X, x1: X, y1: 3.1, zb: ZB, zn: 0.3,
    ceil: [[0, '#d8d2c8'], [1, '#efe9dd']], left: [[0, '#d9cdb4'], [1, '#efe6d2']], right: [[0, '#cfc2a6'], [1, '#ebe0c8']],
    floor: [[0, '#c69a68'], [1, '#8e643e']], back: [[0, '#f1e9d6'], [1, '#e6dcc4']] });
  planks(c, P, -X, X, 0.3, ZB, 0.3, 'rgba(90,56,30,.28)');
  alpha(c, 0.18, function () { for (var z = 0.6; z < ZB; z += 1.1 + R() * 0.6) zlines(c, P, -X, X, 0, [z], '#5a381e', 1); });
  // wainscot
  q3(c, P, [[-X, 0, 0.3], [-X, 0, ZB], [-X, 0.85, ZB], [-X, 0.85, 0.3]], V(c, 300, 720, [[0, '#b99a72'], [1, '#8a6a48']]));
  q3(c, P, [[X, 0, 0.3], [X, 0, ZB], [X, 0.85, ZB], [X, 0.85, 0.3]], V(c, 300, 720, [[0, '#b39570'], [1, '#86684a']]));
  var b0 = P(-X, 0.85, ZB), b1 = P(X, 0, ZB); rect(c, b0[0], b0[1], b1[0] - b0[0], b1[1] - b0[1], '#b09070');
  // left windows
  var win = sideWin(c, P, -X, 1.1, 7.6, 0.95, 2.75, function () { outsideDay(c, R, -200, 0, 400, 640, { hz: 0.55 }); lighter(c, function () { glow(c, 120, 200, 300, '#fff0c8', 0.3); }); }, '#e8e4dc', 4, 2, 0.05);
  wallCurtain(c, P, -X + 0.05, 0.4, 1.3, 0.9, 2.95, '#efe2bc', 3); wallCurtain(c, P, -X + 0.05, 7.4, 8.1, 0.9, 2.95, '#efe2bc', 3);
  wallCurtain(c, P, -X + 0.05, 4.1, 4.7, 0.9, 2.95, '#efe2bc', 2);
  // right wall: bulletin board + door
  q3(c, P, [[X, 1.0, 2.0], [X, 1.0, 5.4], [X, 2.3, 5.4], [X, 2.3, 2.0]], '#a8784a');
  q3(c, P, [[X, 1.06, 2.1], [X, 1.06, 5.3], [X, 2.24, 5.3], [X, 2.24, 2.1]], '#c79a64');
  for (var k = 0; k < 9; k++) { var z = 2.25 + R() * 2.7, y = 1.2 + R() * 0.8, pc = pick(R, ['#ffffff', '#fff3b0', '#ffd6e0', '#d6ecff', '#ffffff']); q3(c, P, [[X - 0.01, y, z], [X - 0.01, y, z + 0.35], [X - 0.01, y + 0.42, z + 0.35], [X - 0.01, y + 0.42, z]], pc); }
  q3(c, P, [[X, 0, 6.2], [X, 0, 7.5], [X, 2.3, 7.5], [X, 2.3, 6.2]], '#8f6a4a');
  q3(c, P, [[X - 0.01, 1.3, 6.35], [X - 0.01, 1.3, 6.9], [X - 0.01, 2.05, 6.9], [X - 0.01, 2.05, 6.35]], '#dfe8ee');
  // blackboard wall
  function bw(x0, y0, x1, y1, f) { var a = P(x0, y1, ZB), b = P(x1, y0, ZB); rect(c, a[0], a[1], b[0] - a[0], b[1] - a[1], f); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; }
  bw(-2.9, 0.88, 2.9, 2.36, '#a7865c');
  var bb = bw(-2.8, 0.95, 2.8, 2.3, V(c, 200, 400, [[0, '#2f5a46'], [1, '#244a39']]));
  alpha(c, 0.12, function () { for (var i = 0; i < 20; i++) eli(c, bb[0] + R() * bb[2], bb[1] + R() * bb[3], 30 + R() * 40, 6 + R() * 8, '#ffffff', (R() - 0.5) * 0.3); });
  chalk(c, R, bb[0] + 22, bb[1] + 24, bb[2] * 0.55, 2, 'rgba(240,244,236,.8)');
  txt(c, 'y = x² − 4x + 3', bb[0] + bb[2] * 0.36, bb[1] + bb[3] * 0.72, 20, 'rgba(250,236,170,.85)', { w: '400', f: '"Comic Sans MS","Segoe Print",cursive' });
  txt(c, '9월 27일 (금)', bb[0] + bb[2] - 60, bb[1] + 24, 14, 'rgba(240,244,236,.85)', { w: '400' });
  txt(c, '주번  김 · 이', bb[0] + bb[2] - 60, bb[1] + 46, 12, 'rgba(240,244,236,.7)', { w: '400' });
  txt(c, '자습', bb[0] + bb[2] - 60, bb[1] + bb[3] - 30, 22, 'rgba(255,190,190,.8)', { w: '400' });
  rect(c, bb[0], bb[1] + bb[3], bb[2], 5, '#8a6a4a');
  for (k = 0; k < 4; k++) rect(c, bb[0] + 60 + k * 14, bb[1] + bb[3] - 3, 9, 3, ['#ffffff', '#ffe46a', '#ff8a8a', '#ffffff'][k]);
  // flag + clock + speaker
  var fl = P(-0.25, 2.8, ZB), fr = P(0.25, 2.5, ZB); rect(c, fl[0], fl[1], fr[0] - fl[0], fr[1] - fl[1], '#fbfbf7');
  var fx = (fl[0] + fr[0]) / 2, fy = (fl[1] + fr[1]) / 2, fw = fr[0] - fl[0];
  c.beginPath(); c.arc(fx, fy, fw * 0.16, PI, TAU); c.fillStyle = '#cf2a3a'; c.fill(); c.beginPath(); c.arc(fx, fy, fw * 0.16, 0, PI); c.fillStyle = '#2a4aa0'; c.fill();
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { alpha(c, 0.8, function () { for (var j = 0; j < 3; j++) rect(c, fx + q[0] * fw * 0.33 - 4, fy + q[1] * fw * 0.2 - 3 + j * 2.2, 8, 1.2, '#222'); }); });
  var ck = P(1.3, 2.68, ZB); eli(c, ck[0], ck[1], 16, 16, '#fbfbf7'); c.strokeStyle = '#555'; c.lineWidth = 2; c.beginPath(); c.arc(ck[0], ck[1], 16, 0, TAU); c.stroke(); line(c, ck[0], ck[1], ck[0] + 6, ck[1] + 7, '#333', 2); line(c, ck[0], ck[1], ck[0] - 1, ck[1] - 11, '#333', 1.5);
  var sp = P(-1.5, 2.8, ZB); rr(c, sp[0] - 14, sp[1], 28, 20, 3, '#6a5a48');
  // platform + podium
  box(c, P, -3.2, 0, 7.4, 3.2, 0.14, ZB, '#9a7048');
  box(c, P, -0.55, 0.14, 7.2, 0.55, 1.08, 7.7, '#8a5a36', { top: '#b07c4c' });
  // ceiling lights
  [2.2, 4.6, 7].forEach(function (z) { [-2.2, 0, 2.2].forEach(function (x) { fluo(c, P, x, 3.09, z, 1.3, 0.22, 0.08); }); });
  // sun on floor (sun from the left windows)
  var sd = [0.9, -0.62, -0.35];
  for (k = 0; k < 4; k++) sunPatch(c, P, -X, 1.15 + k * 1.62, 1.15 + (k + 1) * 1.62 - 0.12, 0.98, 2.72, sd, '#ffcf85', 0.2);
  // desks, far to near
  var rows = [6.3, 5.1, 3.9, 2.7], cols = [-3.0, -1.5, 0, 1.5, 3.0];
  rows.forEach(function (z) {
    var order = cols.slice().sort(function (a, b) { return Math.abs(b) - Math.abs(a); });
    order.forEach(function (x) {
      if (z < 3 && Math.abs(x) < 0.1) return;
      desk(c, P, x, z, '#d7b07a', '#5d6470');
      chair(c, P, x, z - 0.52, '#c49460', 1);
      if (R() < 0.35) { var tp = P(x - 0.1, 0.72, z - 0.05); rect(c, tp[0] - 12 * 5 / z, tp[1] - 3 * 5 / z, 28 * 5 / z, 4 * 5 / z, pick(R, ['#3a6ab0', '#e8e4d8', '#c04a4a'])); }
    });
  });
  lighter(c, function () { glow(c, 120, 260, 520, '#ffd9a0', 0.14); });
  motes(c, R, 50, '#fff0c8', 150, 560, 0, 700);
  finish(c, { vig: 0.35, tint: '#ffc880', ta: 0.2, haze: '#ffe0b0' });
});

def('school_hallway', function (c, R) {
  var P = Cam(560, 640, 330, 1.5), X = 1.7, ZB = 34, Y = 3;
  var bk = shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#cfcbc4'], [1, '#ebe7de']], left: [[0, '#dcd4c4'], [1, '#f0ebe0']], right: [[0, '#d8d0bc'], [1, '#efe8da']],
    floor: [[0, '#cfc6b2'], [1, '#9c907c']], back: [[0, '#f2eee4'], [1, '#e2dccf']] });
  // end window
  pane(c, bk.x + bk.w * 0.15, bk.y + bk.h * 0.28, bk.w * 0.7, bk.h * 0.42, '#d8d4cc', 2, function () { rect(c, 0, 0, W, H, V(c, bk.y, bk.y + bk.h, [[0, '#cfe6fa'], [1, '#fdfbf0']])); lighter(c, function () { glow(c, 640, bk.y + bk.h * 0.5, 80, '#ffffff', 0.9); }); }, 2, 1);
  // floor tiles + gloss
  var z, k;
  for (z = 0.6; z < ZB; z *= 1.22) zlines(c, P, -X, X, 0, [z], 'rgba(90,80,64,.28)', 1);
  l3(c, P, [0, 0, 0.3], [0, 0, ZB], 'rgba(90,80,64,.25)', 1);
  // wainscot bands
  [[-X], [X]].forEach(function (s) { q3(c, P, [[s[0], 0, 0.3], [s[0], 0, ZB], [s[0], 0.12, ZB], [s[0], 0.12, 0.3]], '#6a6a66'); });
  // left windows (sunlit)
  for (z = 1.2; z < ZB - 2; z += 3.2) {
    sideWin(c, P, -X, z, z + 2.4, 1.0, 2.6, function () { rect(c, 0, 0, W, H, V(c, 0, 400, [[0, '#8ec2ee'], [1, '#e6f2f6']])); treeline(c, R, 420, 60, '#78aa62', 30); }, '#dcd8d0', 2, 1, 0.05);
    sunPatch(c, P, -X, z + 0.05, z + 2.35, 1.03, 2.57, [1.2, -0.9, -0.5], '#ffe2a8', 0.26);
  }
  // reflections of windows on glossy floor
  alpha(c, 0.18, function () { for (z = 1.2; z < ZB - 2; z += 3.2) q3(c, P, [[-X, 0, z], [-X, 0, z + 2.4], [-X + 0.9, 0, z + 2.4], [-X + 0.9, 0, z]], '#ffffff'); });
  // right wall: doors, lockers, class plates
  var cls = ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'], segs = [];
  for (k = 0, z = 2.0; z < ZB - 2; z += 5, k++) segs.push([k, z]);
  segs.reverse().forEach(function (sg) {
    var k = sg[0], z = sg[1], j;
    // locker bank
    box(c, P, X - 0.42, 0, z + 1.4, X, 1.3, z + 4.2, '#7f9fbe', { side: '#86a6c4', top: '#c2d2e2' });
    for (j = 1; j < 7; j++) { var zz = z + 1.4 + j * 0.4; l3(c, P, [X - 0.42, 0.05, zz], [X - 0.42, 1.28, zz], 'rgba(40,60,90,.55)', 1); }
    l3(c, P, [X - 0.42, 0.65, z + 1.4], [X - 0.42, 0.65, z + 4.2], 'rgba(40,60,90,.55)', 1);
    for (j = 0; j < 7; j++) { var zc = z + 1.6 + j * 0.4; [0.95, 0.35].forEach(function (yy) { l3(c, P, [X - 0.43, yy, zc - 0.08], [X - 0.43, yy, zc + 0.08], 'rgba(30,40,60,.6)', 1.2); }); }
    // door
    q3(c, P, [[X, 0, z], [X, 0, z + 1.1], [X, 2.25, z + 1.1], [X, 2.25, z]], '#b8946a');
    q3(c, P, [[X - 0.01, 1.3, z + 0.2], [X - 0.01, 1.3, z + 0.9], [X - 0.01, 2.0, z + 0.9], [X - 0.01, 2.0, z + 0.2]], '#c8dce8');
    q3(c, P, [[X, 2.3, z], [X, 2.3, z + 1.1], [X, Y, z + 1.1], [X, Y, z]], '#dfe8ee');
    // projecting plate
    var p0 = P(X, 2.72, z + 1.25), p1 = P(X - 0.55, 2.48, z + 1.25);
    rect(c, p1[0], p0[1], p0[0] - p1[0], p1[1] - p0[1], '#fbfaf4'); c.strokeStyle = '#3a5a8a'; c.lineWidth = Math.max(1, 3 / (z / 5)); c.strokeRect(p1[0], p0[1], p0[0] - p1[0], p1[1] - p0[1]);
    if (k < 4) txt(c, cls[k] || '', (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, Math.max(7, (p1[1] - p0[1]) * 0.62), '#2a3a5a');
  });
  // ceiling lights
  for (z = 1.5; z < ZB; z += 3.2) fluo(c, P, 0, Y - 0.01, z, 0.3, 1.4, 0.1);
  // warm afternoon sheen
  lighter(c, function () { glow(c, 200, 360, 600, '#ffd8a0', 0.18); glow(c, 640, 320, 90, '#ffffff', 0.35); });
  motes(c, R, 40, '#fff4d0', 120, 600, 0, 640);
  finish(c, { vig: 0.4, tint: '#ffcf90', ta: 0.16, haze: '#f8e8d0' });
});

def('school_rooftop', function (c, R) {
  var P = Cam(600, 640, 440, 1.6), k;
  rect(c, 0, 0, W, 440, V(c, 0, 440, [[0, '#2f78d0'], [0.55, '#78b6ee'], [1, '#e8f2f4']]));
  lighter(c, function () { glow(c, 1080, 90, 460, '#ffe8c0', 0.28); glow(c, 1080, 90, 60, '#ffffff', 0.9); });
  tower(c, R, 260, 360, 380, '#ffffff', '#b8cce4', 0.9); tower(c, R, 820, 380, 260, '#ffffff', '#c0d2e8', 0.85);
  for (k = 0; k < 4; k++) cloud(c, R, R() * W, 80 + R() * 120, 160 + R() * 160, '#ffffff', '#c8d8ec', 0.7);
  ridge(c, R, 425, 40, '#9ab4cc', 0.7);
  skyline(c, R, 446, 14, 70, '#a8bccc', null, 0, 22, 70);
  alpha(c, 0.7, function () { skyline(c, R, 452, 8, 40, '#8ea4b6', null, 0, 18, 50); });
  // floor (green urethane)
  q3(c, P, [[-40, 0, 0.3], [40, 0, 0.3], [40, 0, 14], [-40, 0, 14]], V(c, 440, 720, [[0, '#6a9a86'], [1, '#3e6e5c']]));
  for (var x = -12; x <= 12; x += 1.5) l3(c, P, [x, 0, 0.3], [x, 0, 14], 'rgba(255,255,255,.12)', 1);
  zlines(c, P, -40, 40, 0, [2, 3, 4.5, 6.5, 9.5], 'rgba(255,255,255,.1)');
  // parapet + fence at z=14
  box(c, P, -40, 0, 14, 40, 0.5, 14.4, '#c8c4b8');
  var f0 = P(-40, 0.5, 14), f1 = P(40, 2.9, 14);
  c.save(); c.beginPath(); c.rect(0, f1[1], W, f0[1] - f1[1]); c.clip();
  c.strokeStyle = 'rgba(50,90,70,.55)'; c.lineWidth = 1; c.beginPath();
  for (x = -40; x < W + 40; x += 9) { c.moveTo(x, f0[1]); c.lineTo(x + (f0[1] - f1[1]), f1[1]); c.moveTo(x, f1[1]); c.lineTo(x + (f0[1] - f1[1]), f0[1]); }
  c.stroke(); c.restore();
  for (x = -12; x <= 12; x += 2.4) box(c, P, x, 0.5, 14, x + 0.06, 2.95, 14.06, '#3e7a5a');
  box(c, P, -40, 2.9, 14, 40, 2.96, 14.06, '#3e7a5a');
  // left fence along x = -6.5
  var L0 = P(-6.5, 0.5, 1.2), L1 = P(-6.5, 0.5, 14), L2 = P(-6.5, 2.9, 14), L3 = P(-6.5, 2.9, 1.2);
  box(c, P, -6.9, 0, 0.5, -6.5, 0.5, 14, '#c8c4b8');
  clip(c, [L0, L1, L2, L3], function () {
    c.strokeStyle = 'rgba(40,80,60,.6)'; c.lineWidth = 1.4; c.beginPath();
    for (var z = 0.6; z < 14; z += 0.18) { var a = P(-6.5, 0.5, z), b = P(-6.5, 2.9, z + 0.18); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); a = P(-6.5, 2.9, z); b = P(-6.5, 0.5, z + 0.18); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  });
  for (var z = 1.2; z < 14; z += 2) box(c, P, -6.56, 0.5, z, -6.5, 2.95, z + 0.06, '#3e7a5a');
  l3(c, P, [-6.5, 2.92, 0.5], [-6.5, 2.92, 14], '#3e7a5a', 4);
  // water tank on stand (right)
  var tx = 4.6, tz = 9.5;
  [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(function (o) { box(c, P, tx + o[0], 0, tz + o[1], tx + o[0] + 0.1, 1.4, tz + o[1] + 0.1, '#7a8a94'); });
  box(c, P, tx - 1, 1.4, tz - 1, tx + 1.1, 1.5, tz + 1.1, '#8a98a0');
  var ta = P(tx - 1.1, 3.6, tz - 1.1), tb = P(tx + 1.2, 1.5, tz - 1.1), tw = tb[0] - ta[0];
  rect(c, ta[0], ta[1], tw, tb[1] - ta[1], LG(c, ta[0], 0, tb[0], 0, [[0, '#9ab0bc'], [0.3, '#e8f0f2'], [0.6, '#c4d2da'], [1, '#7a909c']]));
  eli(c, ta[0] + tw / 2, ta[1], tw / 2, tw * 0.12, '#d6e2e8'); eli(c, ta[0] + tw / 2, tb[1], tw / 2, tw * 0.12, LG(c, ta[0], 0, tb[0], 0, [[0, '#9ab0bc'], [0.3, '#e8f0f2'], [1, '#7a909c']]));
  for (k = 1; k < 4; k++) line(c, ta[0], ta[1] + (tb[1] - ta[1]) * k / 4, tb[0], ta[1] + (tb[1] - ta[1]) * k / 4, 'rgba(90,110,120,.35)', 2);
  line(c, tb[0] - 8, ta[1], tb[0] - 8, tb[1] + 40, '#6a7a84', 2);
  // stair housing (left)
  box(c, P, -6.2, 0, 3.2, -3.4, 3.2, 7.8, '#e2dccf', { side: '#c8c0b0', top: '#bdb6a8' });
  box(c, P, -6.3, 3.2, 3.1, -3.3, 3.3, 7.9, '#a8a294', { bot: '#9a9486' });
  q3(c, P, [[-3.39, 0, 4.2], [-3.39, 0, 5.4], [-3.39, 2.2, 5.4], [-3.39, 2.2, 4.2]], '#6a7e8e');
  q3(c, P, [[-3.38, 1.3, 4.35], [-3.38, 1.3, 5.25], [-3.38, 2.0, 5.25], [-3.38, 2.0, 4.35]], '#aac4d4');
  var ex = P(-3.38, 2.45, 4.8); rect(c, ex[0] - 10, ex[1] - 5, 20, 10, '#3aa060');
  // bench
  box(c, P, 0.2, 0.42, 11.2, 2.6, 0.48, 11.6, '#b88a5a'); box(c, P, 0.2, 0.6, 11.6, 2.6, 0.95, 11.66, '#b88a5a');
  [0.3, 2.4].forEach(function (x) { box(c, P, x, 0, 11.25, x + 0.08, 0.42, 11.55, '#5a5e66'); });
  // shadows
  alpha(c, 0.22, function () { q3(c, P, [[-3.4, 0, 3.2], [-3.4, 0, 7.8], [-1.8, 0, 7.2], [-1.8, 0, 2.6]], '#123a2c'); q3(c, P, [[3.5, 0, 8.4], [5.8, 0, 8.4], [4.8, 0, 7.0], [2.6, 0, 7.0]], '#123a2c'); });
  lighter(c, function () { glow(c, 1080, 90, 900, '#fff0d0', 0.12); });
  finish(c, { vig: 0.3, tint: '#ffe0a0', ta: 0.12 });
});

function sakura(c, R, x, y, w, h, n0) {
  var cols = ['#f7c3d3', '#f1adc2', '#fbd6e2', '#ec9fb6', '#fde8ef'], k;
  for (k = 0; k < n0 * 0.5; k++) { var a = R() * TAU, d = Math.sqrt(R()); puff(c, x + Math.cos(a) * d * w * 0.5, y + Math.sin(a) * d * h * 0.5, 30 + R() * 40, pick(R, ['#e89ab2', '#f4b8ca']), 0.55); }
  for (k = 0; k < n0 * 3; k++) {
    a = R() * TAU; d = Math.sqrt(R());
    var bx = x + Math.cos(a) * d * w * 0.5, by = y + Math.sin(a) * d * h * 0.5, r = 4 + R() * 9, t = (by - (y - h / 2)) / h;
    eli(c, bx, by, r * 1.3, r, rgba(t > 0.6 ? pick(R, ['#e28fa8', '#ec9fb6', '#f1adc2']) : pick(R, cols), 0.9));
  }
  for (k = 0; k < n0; k++) { a = R() * TAU; d = Math.sqrt(R()); eli(c, x + Math.cos(a) * d * w * 0.45, y + Math.sin(a) * d * h * 0.45 - h * 0.08, 2 + R() * 4, 2 + R() * 3, 'rgba(255,245,248,.9)'); }
}
function branch(c, x0, y0, x1, y1, w, col) { c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (y1 - y0) * 0.2, (y0 + y1) / 2, x1, y1); c.stroke(); }
def('school_gate_sakura', function (c, R) {
  var P = Cam(640, 640, 390, 1.6), k;
  rect(c, 0, 0, W, 400, V(c, 0, 400, [[0, '#8cc4f0'], [0.7, '#cfe6f6'], [1, '#f6eef0']]));
  for (k = 0; k < 5; k++) cloud(c, R, R() * W, 60 + R() * 140, 160 + R() * 160, '#ffffff', '#dce6f4', 0.8);
  ridge(c, R, 330, 30, '#a8c4d8', 0.6);
  // school building
  var s0 = P(-9, 7.5, 32), s1 = P(9, 0, 32);
  rect(c, s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1], V(c, s0[1], s1[1], [[0, '#f4ecdc'], [1, '#dcd0bc']]));
  var cw = P(-1.2, 9.5, 32), cw2 = P(1.2, 7.5, 32); rect(c, cw[0], cw[1], cw2[0] - cw[0], cw2[1] - cw[1], '#ece2cf'); eli(c, 640, (cw[1] + cw2[1]) / 2, 14, 14, '#fbfaf4'); c.strokeStyle = '#5a5a5a'; c.lineWidth = 1.5; c.beginPath(); c.arc(640, (cw[1] + cw2[1]) / 2, 14, 0, TAU); c.stroke();
  for (var fl = 0; fl < 4; fl++) for (var i = 0; i < 16; i++) { var a = P(-8.4 + i * 1.07, 1.1 + fl * 1.6 + 1.0, 32), b = P(-8.4 + i * 1.07 + 0.72, 1.1 + fl * 1.6, 32); rect(c, a[0], a[1], b[0] - a[0], b[1] - a[1], i % 5 === 2 ? '#a8c8dc' : '#8fb2ca'); }
  rect(c, s0[0] - 4, s0[1] - 4, s1[0] - s0[0] + 8, 5, '#c8b8a0');
  treeline(c, R, s1[1] + 4, 20, '#6e9e5a', 14, 0, s0[0] + 10); treeline(c, R, s1[1] + 4, 20, '#6e9e5a', 14, s1[0] - 10, W);
  // ground + path
  q3(c, P, [[-60, 0, 0.3], [60, 0, 0.3], [60, 0, 32], [-60, 0, 32]], V(c, 400, 720, [[0, '#9ab27e'], [1, '#6e8e58']]));
  q3(c, P, [[-3, 0, 0.3], [3, 0, 0.3], [3, 0, 32], [-3, 0, 32]], V(c, 400, 720, [[0, '#e0d6c6'], [1, '#bfae96']]));
  for (var z = 1; z < 32; z *= 1.3) zlines(c, P, -3, 3, 0, [z], 'rgba(120,100,80,.2)');
  // cherry trees — far pairs then framing trees
  [[-6, 14], [6, 14], [-5.2, 10], [5.8, 10]].forEach(function (t) {
    var b = P(t[0], 0, t[1]), s = sc(P, t[1]);
    poly(c, [[b[0] - 0.15 * s, b[1]], [b[0] - 0.08 * s, b[1] - 2.6 * s], [b[0] + 0.08 * s, b[1] - 2.6 * s], [b[0] + 0.15 * s, b[1]]], '#5a3a36');
    sakura(c, R, b[0], b[1] - 3.2 * s, 3.6 * s, 1.9 * s, 50);
  });
  // gate pillars + sliding gate
  [[-3.9, -3.1], [3.1, 3.9]].forEach(function (p, j) {
    box(c, P, p[0], 0, 7, p[1], 2.9, 7.8, '#bcb4a8', { side: '#9a9286', top: '#d8d2c8' });
    box(c, P, p[0] - 0.08, 2.9, 6.92, p[1] + 0.08, 3.05, 7.88, '#8a8278');
  });
  var pl = P(-3.85, 2.4, 6.99), pr = P(-3.15, 1.0, 6.99); rect(c, pl[0], pl[1], pr[0] - pl[0], pr[1] - pl[1], '#6a5a44'); rect(c, pl[0] + 3, pl[1] + 3, pr[0] - pl[0] - 6, pr[1] - pl[1] - 6, '#efe6d0');
  var ph = pr[1] - pl[1] - 12; c.save(); c.font = '700 ' + Math.round(Math.min((pr[0] - pl[0]) * 0.5, ph / 6.8)) + 'px serif'; c.fillStyle = '#3a2a1a'; c.textAlign = 'center'; c.textBaseline = 'middle';
  '운명고등학교'.split('').forEach(function (ch, j) { c.fillText(ch, (pl[0] + pr[0]) / 2, pl[1] + 6 + (j + 0.5) * ph / 6); }); c.restore();
  box(c, P, 3.9, 0, 7.2, 8.5, 1.5, 7.3, 'rgba(0,0,0,0)', { noFront: true, top: 'rgba(0,0,0,0)', side: 'rgba(0,0,0,0)' });
  for (var gx = 3.95; gx < 8.5; gx += 0.14) box(c, P, gx, 0.08, 7.25, gx + 0.03, 1.45, 7.28, '#4a5a6a');
  box(c, P, 3.9, 1.45, 7.22, 8.5, 1.55, 7.3, '#4a5a6a'); box(c, P, 3.9, 0.05, 7.22, 8.5, 0.12, 7.3, '#4a5a6a');
  // fence walls
  box(c, P, -30, 0, 7.3, -3.9, 1.2, 7.6, '#c8beb0'); box(c, P, 8.5, 0, 7.3, 30, 1.2, 7.6, '#c8beb0');
  branch(c, -30, 720, 60, 200, 40, '#4a2e2c'); branch(c, 50, 300, 360, 70, 14, '#4a2e2c'); branch(c, 40, 380, -40, 160, 16, '#4a2e2c');
  branch(c, 1310, 720, 1220, 210, 44, '#4a2e2c'); branch(c, 1230, 300, 930, 60, 14, '#4a2e2c'); branch(c, 1240, 380, 1320, 170, 16, '#4a2e2c');
  sakura(c, R, 140, 80, 560, 220, 110); sakura(c, R, 1150, 80, 560, 220, 110);
  sakura(c, R, 30, 250, 160, 180, 40); sakura(c, R, 1260, 250, 160, 180, 40);
  // petal carpet
  alpha(c, 0.8, function () { for (k = 0; k < 160; k++) { var z2 = 1 + R() * 14, x2 = (R() - 0.5) * 10, pp = P(x2, 0, z2), s2 = sc(P, z2) * 0.05; eli(c, pp[0], pp[1], s2, s2 * 0.5, pick(R, ['#f7c6d6', '#fbdce6', '#f3b2c6'])); } });
  petals(c, R, 90, '#f6b8cc', 0, 720);
  lighter(c, function () { glow(c, 640, 120, 600, '#fff4f0', 0.25); });
  finish(c, { vig: 0.3, tint: '#ffc8d8', ta: 0.18, haze: '#fff0f4' });
});

def('gym', function (c, R) {
  var P = Cam(560, 640, 340, 1.7), X = 10, Y = 9, ZB = 19, k, z;
  var bk = shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.4,
    ceil: [[0, '#4a4e58'], [1, '#8a8e96']], left: [[0, '#cfc6b6'], [1, '#e6ded0']], right: [[0, '#cfc6b6'], [1, '#e6ded0']],
    floor: [[0, '#e0b27a'], [1, '#b87e46']], back: [[0, '#e8e0d2'], [1, '#d6cab6']] });
  // floor boards + gloss
  for (var x = -X; x <= X; x += 0.35) l3(c, P, [x, 0, 0.4], [x, 0, ZB], 'rgba(120,70,30,.18)', 1);
  alpha(c, 0.3, function () { q3(c, P, [[-3, 0, 4], [3, 0, 4], [2, 0, ZB], [-2, 0, ZB]], LG(c, 0, 330, 0, 720, [[0, 'rgba(255,250,235,.9)'], [1, 'rgba(255,250,235,0)']])); });
  // court lines
  var LC = '#ffffff';
  function pl(pts, col, w) { c.beginPath(); pts.forEach(function (p, i) { var q = P(p[0], 0, p[1]); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.strokeStyle = col; c.lineWidth = w; c.stroke(); }
  q3(c, P, [[-2.45, 0, ZB - 5.8], [2.45, 0, ZB - 5.8], [2.45, 0, ZB - 0.2], [-2.45, 0, ZB - 0.2]], 'rgba(190,60,50,.55)');
  pl([[-2.45, ZB - 0.2], [-2.45, ZB - 5.8], [2.45, ZB - 5.8], [2.45, ZB - 0.2]], LC, 2);
  var arc = []; for (k = 0; k <= 24; k++) { var a = PI * k / 24; arc.push([Math.cos(a) * 1.8, ZB - 5.8 - Math.sin(a) * 1.8]); } pl(arc, LC, 2);
  var tp = []; for (k = 0; k <= 30; k++) { a = PI * k / 30; tp.push([Math.cos(a) * 6.75, ZB - 1.6 - Math.sin(a) * 6.75]); } pl(tp, LC, 2);
  pl([[-7.5, ZB - 13.5], [7.5, ZB - 13.5]], LC, 2);
  var cc = []; for (k = 0; k <= 40; k++) { a = TAU * k / 40; cc.push([Math.cos(a) * 1.8, ZB - 13.5 + Math.sin(a) * 1.8]); } pl(cc, LC, 2);
  pl([[-7.5, 0.5], [-7.5, ZB - 0.2], [7.5, ZB - 0.2], [7.5, 0.5]], LC, 2);
  pl([[-8.4, 0.5], [-8.4, ZB - 0.3]], '#2a6ac0', 3); pl([[8.4, 0.5], [8.4, ZB - 0.3]], '#2a6ac0', 3);
  // high windows + padded wall
  [-X, X].forEach(function (x) {
    q3(c, P, [[x, 0, 0.4], [x, 0, ZB], [x, 1.8, ZB], [x, 1.8, 0.4]], V(c, 200, 720, [[0, '#3a7a5a'], [1, '#2a5a44']]));
    for (z = 2; z < ZB - 1; z += 3) { sideWin(c, P, x, z, z + 2.2, 5.6, 7.9, function () { rect(c, 0, 0, W, H, '#dff0fb'); }, '#aeb4b8', 2, 2, 0.06);
      if (x < 0) sunPatch(c, P, x, z, z + 2.2, 5.6, 7.9, [0.9, -0.55, -0.3], '#fff0d0', 0.09); }
  });
  // back wall: stage + banner + scoreboard
  function bw(x0, y0, x1, y1, f) { var a = P(x0, y1, ZB), b = P(x1, y0, ZB); rect(c, a[0], a[1], b[0] - a[0], b[1] - a[1], f); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; }
  var bn = bw(-4, 6.2, 4, 7.2, '#b82a36'); txt(c, '정 정 당 당', bn[0] + bn[2] / 2, bn[1] + bn[3] / 2, bn[3] * 0.62, '#fff4e0', { f: 'serif' });
  var sb = bw(5, 4.5, 8.5, 6.4, '#1a1c22'); txt(c, 'HOME', sb[0] + sb[2] * 0.25, sb[1] + sb[3] * 0.22, sb[3] * 0.14, '#e8e8e8', { f: 'sans-serif' }); txt(c, 'GUEST', sb[0] + sb[2] * 0.75, sb[1] + sb[3] * 0.22, sb[3] * 0.14, '#e8e8e8', { f: 'sans-serif' });
  txt(c, '42', sb[0] + sb[2] * 0.25, sb[1] + sb[3] * 0.6, sb[3] * 0.36, '#ff6a3a', { f: 'monospace', glow: '#ff4a2a', blur: 6 }); txt(c, '38', sb[0] + sb[2] * 0.75, sb[1] + sb[3] * 0.6, sb[3] * 0.36, '#ffb03a', { f: 'monospace', glow: '#ff8a2a', blur: 6 });
  bw(-X, 0, X, 1.6, V(c, 380, 420, [[0, '#3a7a5a'], [1, '#2a5a44']]));
  // hoop
  var hb = P(-0.9, 3.95, ZB - 1.2), hb2 = P(0.9, 2.9, ZB - 1.2);
  l3(c, P, [0, 3.4, ZB], [0, 3.4, ZB - 1.2], '#5a5e66', 5); l3(c, P, [0, 5.5, ZB], [0, 3.95, ZB - 1.2], '#5a5e66', 3);
  rect(c, hb[0], hb[1], hb2[0] - hb[0], hb2[1] - hb[1], 'rgba(230,240,248,.85)'); c.strokeStyle = '#d23a2a'; c.lineWidth = 2.5; c.strokeRect(hb[0], hb[1], hb2[0] - hb[0], hb2[1] - hb[1]);
  var sq = P(-0.3, 3.4, ZB - 1.2), sq2 = P(0.3, 3.05, ZB - 1.2); c.strokeRect(sq[0], sq[1], sq2[0] - sq[0], sq2[1] - sq[1]);
  var rim = P(0, 3.05, ZB - 1.45); c.beginPath(); c.ellipse(rim[0], rim[1], 11, 3, 0, 0, TAU); c.strokeStyle = '#ff5a1a'; c.lineWidth = 2.5; c.stroke();
  alpha(c, 0.8, function () { for (k = -3; k <= 3; k++) line(c, rim[0] + k * 3.4, rim[1] + 1, rim[0] + k * 2.2, rim[1] + 16, '#ffffff', 1); });
  // trusses + lights
  for (z = 2; z < ZB; z += 3) {
    l3(c, P, [-X, Y - 0.1, z], [X, Y - 0.1, z], '#3a3e46', 4); l3(c, P, [-X, Y - 1.2, z], [X, Y - 1.2, z], '#4a4e56', 2);
    for (x = -X; x < X; x += 2) { l3(c, P, [x, Y - 1.2, z], [x + 1, Y - 0.1, z], '#4a4e56', 1.5); l3(c, P, [x + 1, Y - 0.1, z], [x + 2, Y - 1.2, z], '#4a4e56', 1.5); }
    [-5, 0, 5].forEach(function (x2) { var lp = P(x2, Y - 1.6, z + 1.5); eli(c, lp[0], lp[1], sc(P, z + 1.5) * 0.35, sc(P, z + 1.5) * 0.1, '#fffdf2'); lighter(c, function () { glow(c, lp[0], lp[1] + 4, sc(P, z + 1.5) * 1.4, '#fff4d8', 0.35); }); });
  }
  // basketball on the floor
  var ball = P(-2.3, 0.12, 3.2), br = sc(P, 3.2) * 0.12;
  alpha(c, 0.3, function () { eli(c, ball[0] + 6, ball[1] + br * 0.9, br * 1.1, br * 0.3, '#3a200a'); });
  eli(c, ball[0], ball[1], br, br, RG(c, ball[0] - br * 0.4, ball[1] - br * 0.4, br * 1.5, [[0, '#ffa860'], [1, '#b04a14']]));
  c.strokeStyle = '#3a1a08'; c.lineWidth = 1.5; c.beginPath(); c.arc(ball[0], ball[1], br, 0, TAU); c.moveTo(ball[0] - br, ball[1]); c.quadraticCurveTo(ball[0], ball[1] + br * 0.4, ball[0] + br, ball[1]); c.moveTo(ball[0], ball[1] - br); c.quadraticCurveTo(ball[0] + br * 0.4, ball[1], ball[0], ball[1] + br); c.stroke();
  lighter(c, function () { glow(c, 640, 380, 700, '#fff0d8', 0.12); });
  finish(c, { vig: 0.4, tint: '#ffd8a0', ta: 0.14 });
});

function piano(c, P, x0, z0, s) {
  // outline in local (u across, w deep); straight side at u=0
  var o = [[0, 0], [1.5, 0], [1.5, 0.35], [1.35, 0.9], [1.0, 1.35], [0.8, 1.9], [0.55, 2.2], [0.2, 2.3], [0, 2.25]];
  var top = 1.0, bot = 0.72, i;
  function g(p, y) { return [x0 + p[0] * s, y, z0 + p[1] * s]; }
  [[0.1, 0.25], [1.3, 0.25], [0.3, 2.0]].forEach(function (l) { box(c, P, x0 + l[0] * s - 0.05, 0, z0 + l[1] * s - 0.05, x0 + l[0] * s + 0.05, bot, z0 + l[1] * s + 0.05, '#141418'); });
  var segs = []; for (i = 0; i < o.length; i++) segs.push([o[i], o[(i + 1) % o.length]]);
  segs.sort(function (a, b) { return (b[0][1] + b[1][1]) - (a[0][1] + a[1][1]); });
  segs.forEach(function (sg) { q3(c, P, [g(sg[0], bot), g(sg[1], bot), g(sg[1], top), g(sg[0], top)], '#18181e', 'rgba(120,120,140,.25)', 1); });
  q3(c, P, o.map(function (p) { return g(p, top); }), '#26262e');
  // lid propped (hinged on u=0 side)
  var ang = 0.55, lid = o.map(function (p) { return [x0 + p[0] * s * Math.cos(ang), top + p[0] * s * Math.sin(ang), z0 + p[1] * s]; });
  var pa = P(x0 + 1.1 * s, top, z0 + 0.9 * s), pb = P(lid[3][0], lid[3][1], lid[3][2]); line(c, pa[0], pa[1], pb[0], pb[1], '#0e0e12', 3);
  q3(c, P, lid, LG(c, P(x0, top, z0)[0], 0, P(x0 + 1.5 * s, top, z0)[0], 0, [[0, '#1a1a22'], [0.6, '#3a3a48'], [1, '#101016']]));
  // keyboard
  box(c, P, x0 - 0.02, 0.8, z0 - 0.5 * s, x0 + 1.52 * s, 0.9, z0, '#16161a');
  q3(c, P, [[x0 + 0.05, 0.9, z0 - 0.45 * s], [x0 + 1.45 * s, 0.9, z0 - 0.45 * s], [x0 + 1.45 * s, 0.9, z0 - 0.05], [x0 + 0.05, 0.9, z0 - 0.05]], '#f6f4ee');
  for (i = 0; i < 36; i++) { var u = 0.05 + (1.4 * s) * i / 36; l3(c, P, [x0 + u, 0.9, z0 - 0.45 * s], [x0 + u, 0.9, z0 - 0.05], 'rgba(60,60,60,.5)', 0.8); if ([1, 2, 4, 5, 6].indexOf(i % 7) >= 0) q3(c, P, [[x0 + u - 0.012, 0.905, z0 - 0.25 * s], [x0 + u + 0.012, 0.905, z0 - 0.25 * s], [x0 + u + 0.012, 0.905, z0 - 0.05], [x0 + u - 0.012, 0.905, z0 - 0.05]], '#111'); }
  // music desk with sheet
  q3(c, P, [[x0 + 0.35 * s, 1.0, z0 + 0.1], [x0 + 1.15 * s, 1.0, z0 + 0.1], [x0 + 1.15 * s, 1.32, z0 + 0.22], [x0 + 0.35 * s, 1.32, z0 + 0.22]], '#1a1a20');
  q3(c, P, [[x0 + 0.45 * s, 1.04, z0 + 0.09], [x0 + 1.05 * s, 1.04, z0 + 0.09], [x0 + 1.05 * s, 1.3, z0 + 0.2], [x0 + 0.45 * s, 1.3, z0 + 0.2]], '#fbf8ee');
}
function stand(c, P, x, z, col) {
  l3(c, P, [x, 0, z], [x, 1.1, z], '#2a2a30', 2);
  [0, 2.1, 4.2].forEach(function (a) { l3(c, P, [x, 0.02, z], [x + Math.cos(a) * 0.25, 0, z + Math.sin(a) * 0.25], '#2a2a30', 2); });
  q3(c, P, [[x - 0.25, 1.05, z], [x + 0.25, 1.05, z], [x + 0.25, 1.4, z + 0.08], [x - 0.25, 1.4, z + 0.08]], '#2a2a30');
  q3(c, P, [[x - 0.22, 1.08, z - 0.01], [x + 0.22, 1.08, z - 0.01], [x + 0.22, 1.38, z + 0.07], [x - 0.22, 1.38, z + 0.07]], col || '#fbf8ee');
}
def('music_room', function (c, R) {
  var P = Cam(600, 640, 320, 1.3), X = 4.6, ZB = 8, k;
  shell(c, P, { x0: -X, x1: X, y1: 3.1, zb: ZB, zn: 0.3,
    ceil: [[0, '#dcd4c8'], [1, '#f2ece2']], left: [[0, '#e0d8c6'], [1, '#f4eee2']], right: [[0, '#d6ccb8'], [1, '#efe7d8']],
    floor: [[0, '#b27a4e'], [1, '#7a4e2e']], back: [[0, '#f4eee0'], [1, '#e6dccb']] });
  planks(c, P, -X, X, 0.3, ZB, 0.25, 'rgba(70,40,20,.25)');
  // acoustic panel dots on right wall
  alpha(c, 0.25, function () { for (var z = 0.8; z < ZB; z += 0.35) for (var y = 1.0; y < 2.9; y += 0.3) { var p = P(X, y, z); eli(c, p[0], p[1], 60 / z * 0.04 * 10, 60 / z * 0.04 * 10, '#8a7a62'); } });
  q3(c, P, [[X, 0, 0.3], [X, 0, ZB], [X, 0.9, ZB], [X, 0.9, 0.3]], '#9a7452');
  // left windows w/ sheer curtains
  sideWin(c, P, -X, 1.0, 7.0, 0.95, 2.75, function () { outsideDay(c, R, -200, 0, 400, 640, { hz: 0.6, sky: [[0, '#f6c890'], [0.5, '#fbe2b8'], [1, '#fff6e0']], tree: '#8aa060' }); lighter(c, function () { glow(c, 100, 260, 300, '#ffe6b0', 0.25); }); }, '#e6dccb', 3, 2, 0.05);
  alpha(c, 0.7, function () { wallCurtain(c, P, -X + 0.08, 1.0, 2.6, 0.9, 2.95, '#fffaf0', 5); wallCurtain(c, P, -X + 0.08, 5.3, 7.0, 0.9, 2.95, '#fffaf0', 5); });
  q3(c, P, [[-X, 0, 0.3], [-X, 0, ZB], [-X, 0.9, ZB], [-X, 0.9, 0.3]], '#9a7452');
  for (k = 0; k < 3; k++) sunPatch(c, P, -X, 1.05 + k * 2, 2.95 + k * 2, 0.98, 2.72, [1, -0.5, -0.45], '#ffc070', 0.22);
  // back wall: music board + portraits
  function bw(x0, y0, x1, y1, f) { var a = P(x0, y1, ZB), b = P(x1, y0, ZB); rect(c, a[0], a[1], b[0] - a[0], b[1] - a[1], f); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; }
  bw(-2.6, 0.95, 2.6, 2.22, '#9a7a56');
  var bb = bw(-2.5, 1.0, 2.5, 2.16, V(c, 200, 400, [[0, '#2e5646'], [1, '#234436']]));
  for (var g = 0; g < 3; g++) { for (k = 0; k < 5; k++) line(c, bb[0] + 14, bb[1] + 18 + g * 36 + k * 4.5, bb[0] + bb[2] - 14, bb[1] + 18 + g * 36 + k * 4.5, 'rgba(240,240,230,.55)', 1);
    for (k = 0; k < 14; k++) { var nx = bb[0] + 40 + k * (bb[2] - 60) / 14, ny = bb[1] + 18 + g * 36 + Math.floor(R() * 9) * 2.25; eli(c, nx, ny, 3, 2.3, 'rgba(250,250,240,.85)', -0.3); line(c, nx + 2.6, ny, nx + 2.6, ny - 12, 'rgba(250,250,240,.85)', 1); } }
  txt(c, '𝄞', bb[0] + 24, bb[1] + 28, 24, 'rgba(250,250,240,.8)', { w: '400', f: 'serif' });
  for (k = 0; k < 5; k++) { var fr = bw(-3.4 + k * 1.6, 2.35, -2.9 + k * 1.6, 2.95, '#6a4a2a'); rect(c, fr[0] + 3, fr[1] + 3, fr[2] - 6, fr[3] - 6, '#e8dcc4'); eli(c, fr[0] + fr[2] / 2, fr[1] + fr[3] * 0.42, fr[2] * 0.22, fr[3] * 0.24, '#b8a484'); eli(c, fr[0] + fr[2] / 2, fr[1] + fr[3] * 0.34, fr[2] * 0.3, fr[3] * 0.18, k % 2 ? '#e8e0d0' : '#5a4a3a'); rect(c, fr[0] + fr[2] * 0.22, fr[1] + fr[3] * 0.66, fr[2] * 0.56, fr[3] * 0.3, '#3a3a44'); }
  // tiered risers + chairs
  box(c, P, -X, 0, 5.6, X, 0.18, ZB, '#8a5a36');
  [-3, -1.8, -0.6, 0.6, 1.8, 3].forEach(function (x) { chair(c, P, x, 6.6, '#b02a3a', -1); });
  [-2.6, -1.3, 1.3, 2.6].forEach(function (x, i) { stand(c, P, x, 5.3, i % 2 ? '#fbf8ee' : '#fff4e0'); });
  // grand piano
  piano(c, P, 1.1, 3.7, 1.0);
  // sheets on floor
  [[-2.4, 2.2, 0.3], [-1.5, 2.9, -0.4], [-0.6, 2.0, 0.9]].forEach(function (sh) { var sx = sh[0], sz = sh[1], a = sh[2], ca = Math.cos(a) * 0.21, sa = Math.sin(a) * 0.21, cb = Math.cos(a) * 0.3, sb = Math.sin(a) * 0.3;
    q3(c, P, [[sx, 0.01, sz], [sx + ca, 0.01, sz + sa], [sx + ca - sb, 0.01, sz + sa + cb], [sx - sb, 0.01, sz + cb]], '#fbf6e8', 'rgba(120,100,80,.4)', 1);
    for (var j = 1; j < 5; j++) { var t = j / 5; l3(c, P, [sx - sb * t + ca * 0.1, 0.012, sz + cb * t + sa * 0.1], [sx - sb * t + ca * 0.9, 0.012, sz + cb * t + sa * 0.9], 'rgba(60,50,40,.45)', 1); } });
  lighter(c, function () { glow(c, 60, 300, 560, '#ffc27a', 0.12); });
  motes(c, R, 60, '#ffe0a8', 150, 600, 0, 760);
  finish(c, { vig: 0.4, tint: '#ffb070', ta: 0.24, haze: '#ffd8a8' });
});

/* ------------------------------------------------------- modern city */
var PROD = ['#e8423a', '#f2b632', '#3a8ae0', '#46b060', '#f07aa8', '#ffffff', '#7a4ad0', '#f28a2a', '#30b8c0', '#d8d040'];
function shelfFace(c, R, P, x, z0, z1, ys, dens, lc) { // products on a plane x = const
  ys.forEach(function (y) {
    var z = z0 + 0.02;
    l3(c, P, [x, y - 0.015, z0], [x, y - 0.015, z1], lc || '#c8ccd2', 2);
    while (z < z1 - 0.08) {
      var w = 0.07 + R() * 0.12, h = 0.12 + R() * 0.18;
      if (R() < (dens == null ? 0.92 : dens)) q3(c, P, [[x, y, z], [x, y, z + w], [x, y + h, z + w], [x, y + h, z]], lc ? mix(pick(R, PROD), '#4a5a50', 0.45) : pick(R, PROD));
      z += w + 0.01;
    }
  });
}
def('convenience_store', function (c, R) {
  var P = Cam(560, 640, 320, 1.6), X = 4.2, Y = 2.8, ZB = 11, k, z;
  var bk = shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#c8ced6'], [1, '#eef0f4']], left: [[0, '#cfd6dc'], [1, '#eceff2']], right: [[0, '#d2d8de'], [1, '#eef0f4']],
    floor: [[0, '#e4e6e2'], [1, '#aeb4b4']], back: [[0, '#f6f8fa'], [1, '#e8ecee']] });
  for (var x = -X; x <= X; x += 0.6) l3(c, P, [x, 0, 0.3], [x, 0, ZB], 'rgba(120,130,130,.25)', 1);
  for (z = 0.6; z < ZB; z += 0.6) zlines(c, P, -X, X, 0, [z], 'rgba(120,130,130,.2)');
  // brand stripes
  [[2.45, 2.55, '#f28a2a'], [2.35, 2.45, '#2ab070'], [2.25, 2.35, '#e8423a']].forEach(function (b) { q3(c, P, [[-X, b[0], 0.3], [-X, b[0], ZB], [-X, b[1], ZB], [-X, b[1], 0.3]], b[2]); q3(c, P, [[X, b[0], 0.3], [X, b[0], ZB], [X, b[1], ZB], [X, b[1], 0.3]], b[2]); var a = P(-X, b[1], ZB), bb = P(X, b[0], ZB); rect(c, a[0], a[1], bb[0] - a[0], bb[1] - a[1], b[2]); });
  // left: storefront glass with night street
  sideWin(c, P, -X, 0.3, 7.5, 0.25, 2.2, function () {
    rect(c, 0, 0, W, H, V(c, 0, 720, [[0, '#070a1e'], [0.6, '#14183a'], [1, '#1c1a2e']]));
    skyline(c, R, 470, 60, 260, '#0c0e22', '#ffd890', 0.12, 40, 90, -400, 500);
    lighter(c, function () { for (var i = 0; i < 16; i++) glow(c, R() * 400 - 150, 380 + R() * 200, 20 + R() * 40, pick(R, ['#ff5a8a', '#5ad0ff', '#ffc060', '#ffffff']), 0.35); });
  }, '#9aa2aa', 5, 1, 0.04);
  alpha(c, 0.14, function () { for (k = 0; k < 5; k++) q3(c, P, [[-X + 0.01, 0.3, 0.6 + k * 1.4], [-X + 0.01, 0.3, 1.0 + k * 1.4], [-X + 0.01, 2.2, 1.4 + k * 1.4], [-X + 0.01, 2.2, 1.0 + k * 1.4]], '#ffffff'); });
  txt(c, 'OPEN 24H', P(-X, 1.9, 2.2)[0], P(-X, 1.9, 2.2)[1], 26, '#ff4a6a', { glow: '#ff2a5a', blur: 12, f: 'sans-serif' });
  // right: fridge wall
  var fz0 = 1.2, fz1 = 9.8;
  box(c, P, X - 0.7, 0, fz0, X, 2.2, fz1, '#b8c0c8', { side: '#aab2ba' });
  clip(c, [P(X - 0.7, 0.15, fz0), P(X - 0.7, 0.15, fz1), P(X - 0.7, 2.05, fz1), P(X - 0.7, 2.05, fz0)], function () {
    rect(c, 0, 0, W, H, '#dff4ff');
    for (var y = 0.25; y < 2.0; y += 0.36) { var zz = fz0; while (zz < fz1) { var bw = 0.06 + R() * 0.03, col = pick(R, ['#3a9ae0', '#e8423a', '#46b060', '#f2b632', '#ffffff', '#8ad0f0', '#f07aa8']); var xf = X - 0.72; q3(c, P, [[xf, y, zz], [xf, y, zz + bw], [xf, y + 0.2, zz + bw], [xf, y + 0.2, zz]], col); q3(c, P, [[xf, y + 0.2, zz + bw * 0.25], [xf, y + 0.2, zz + bw * 0.75], [xf, y + 0.27, zz + bw * 0.75], [xf, y + 0.27, zz + bw * 0.25]], lt(col, 0.3)); zz += bw + 0.008; } l3(c, P, [X - 0.7, y - 0.02, fz0], [X - 0.7, y - 0.02, fz1], '#c8d8e4', 2); }
    lighter(c, function () { var m = P(X - 0.7, 1.1, 3); glow(c, m[0], m[1], 420, '#bfe8ff', 0.35); });
  });
  for (z = fz0; z <= fz1 + 0.01; z += 0.95) l3(c, P, [X - 0.7, 0.05, z], [X - 0.7, 2.15, z], '#8a929a', 3);
  lighter(c, function () { q3(c, P, [[X - 0.7, 0, fz0], [X - 0.7, 0, fz1], [X - 2.2, 0, fz1], [X - 2.2, 0, fz0]], 'rgba(160,220,255,.14)'); });
  // back wall shelves
  var s0 = P(-2.8, 1.9, ZB), s1 = P(1.8, 0, ZB); rect(c, s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1], '#d4d8dc');
  for (var yy = 0.25; yy < 1.8; yy += 0.36) { var xx = -2.75; while (xx < 1.75) { var ww = 0.08 + R() * 0.12, pa = P(xx, yy, ZB), pb = P(xx + ww, yy + 0.14 + R() * 0.14, ZB); rect(c, pa[0], pb[1], pb[0] - pa[0], pa[1] - pb[1], pick(R, PROD)); xx += ww + 0.02; } }
  // gondola aisles (far to near)
  [[-2.7, -2.0], [1.1, 1.8]].forEach(function (g) {
    for (var gz = 9.6; gz > 6; gz -= 2.7) {
      var za = gz - 2.5, zb2 = gz;
      box(c, P, g[0], 0, za, g[1], 1.55, zb2, '#e4e8ec', { side: '#d2d8de', top: '#f2f4f6' });
      var face = g[1] < 0 ? g[1] + 0.001 : g[0] - 0.001;
      shelfFace(c, R, P, face, za, zb2, [0.12, 0.48, 0.84, 1.2]);
      var e0 = P(g[0], 1.55, za), e1 = P(g[1], 0, za); rect(c, e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1], '#e8ecf0');
      for (var ly = 0.1; ly < 1.5; ly += 0.36) { var lx = g[0] + 0.03; while (lx < g[1] - 0.06) { var lw = 0.07 + R() * 0.08, q0 = P(lx, ly, za - 0.01), q1 = P(lx + lw, ly + 0.12 + R() * 0.14, za - 0.01); rect(c, q0[0], q1[1], q1[0] - q0[0], q0[1] - q1[1], pick(R, PROD)); lx += lw + 0.01; } }
      // hanging promo tag
      var t0 = P((g[0] + g[1]) / 2 - 0.25, 2.25, za), t1 = P((g[0] + g[1]) / 2 + 0.25, 1.95, za);
      l3(c, P, [(g[0] + g[1]) / 2, Y, za], [(g[0] + g[1]) / 2, 2.25, za], '#888', 1);
      rect(c, t0[0], t0[1], t1[0] - t0[0], t1[1] - t0[1], '#ffe23a'); txt(c, '1+1', (t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2, (t1[1] - t0[1]) * 0.7, '#e8203a', { f: 'sans-serif', w: '900' });
    }
  });
  // ceiling light strips
  [-2.6, 0, 2.6].forEach(function (x) { for (z = 1.2; z < ZB; z += 2.2) fluo(c, P, x, Y - 0.01, z, 0.22, 1.6, 0.16); });
  // floor reflection of fridge + lights
  alpha(c, 0.22, function () { q3(c, P, [[-0.6, 0, 1], [0.6, 0, 1], [0.3, 0, ZB], [-0.3, 0, ZB]], LG(c, 0, 330, 0, 720, [[0, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']])); });
    // checkout counter (front left)
  box(c, P, -4.1, 0, 1.8, -2.9, 0.95, 3.4, '#3a8a5a', { top: '#e8ece8', side: '#2e7048' });
  var rg = P(-3.4, 0.95, 2.4); rr(c, rg[0] - 30, rg[1] - 40, 60, 40, 4, '#2a2e36'); rect(c, rg[0] - 22, rg[1] - 34, 44, 22, '#6ad0ff');
  lighter(c, function () { glow(c, 640, 250, 700, '#f4fbff', 0.06); });
  finish(c, { vig: 0.42, tint: '#bfe0ff', ta: 0.12, low: 0.18 });
});

function nightCity(c, R, x0, y0, x1, y1, o) {
  o = o || {};
  rect(c, x0, y0, x1 - x0, y1 - y0, V(c, y0, y1, o.sky || [[0, '#0a0e2a'], [0.6, '#1c2250'], [1, '#3a2e5a']]));
  var hz = lerp(y0, y1, o.hz || 0.7);
  alpha(c, 0.8, function () { stars(c, R, 40, hz - 40, 0.6); });
  lighter(c, function () { glow(c, (x0 + x1) / 2, y1, (x1 - x0) * 0.6, '#7a4aa0', 0.35); });
  skyline(c, R, y1, (y1 - y0) * 0.3, (y1 - y0) * 0.75, '#1e2248', '#ffe0a0', 0.22, 26, 70, x0, x1);
  skyline(c, R, y1, (y1 - y0) * 0.15, (y1 - y0) * 0.5, '#12142e', '#ffd070', 0.35, 30, 80, x0, x1);
  lighter(c, function () { for (var i = 0; i < 12; i++) { var bx = lerp(x0, x1, R()), by = lerp(hz - 60, hz, R()); glow(c, bx, by, 8, '#ff3a3a', 0.8); } });
  lighter(c, function () { for (var i = 0; i < 40; i++) glow(c, lerp(x0, x1, R()), lerp(hz, y1, R()), 6 + R() * 14, pick(R, ['#ffd08a', '#ff8ab0', '#8ad0ff']), 0.5); glow(c, (x0 + x1) / 2, hz + 40, (x1 - x0) * 0.5, '#ff9a70', 0.15); });
}
function monitor(c, P, x, y, z, w, h, col) {
  box(c, P, x - 0.03, y, z + 0.02, x + 0.03, y + 0.12, z + 0.06, '#2a2c32');
  q3(c, P, [[x - w / 2 - 0.02, y + 0.1, z], [x + w / 2 + 0.02, y + 0.1, z], [x + w / 2 + 0.02, y + 0.12 + h, z], [x - w / 2 - 0.02, y + 0.12 + h, z]], '#1a1c22');
  var a = P(x - w / 2, y + 0.1 + h, z), b = P(x + w / 2, y + 0.12, z);
  rect(c, a[0], a[1], b[0] - a[0], b[1] - a[1], V(c, a[1], b[1], [[0, lt(col, 0.3)], [1, col]]));
  alpha(c, 0.5, function () { for (var k = 0; k < 4; k++) rect(c, a[0] + (b[0] - a[0]) * 0.1, a[1] + (b[1] - a[1]) * (0.2 + k * 0.18), (b[0] - a[0]) * (0.4 + (k % 2) * 0.3), Math.max(1, (b[1] - a[1]) * 0.06), '#ffffff'); });
  lighter(c, function () { glow(c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (b[0] - a[0]) * 1.2, col, 0.2); });
}
function officeChair(c, P, x, z) {
  l3(c, P, [x, 0.05, z], [x, 0.45, z], '#2a2c32', 3);
  [0, 1.26, 2.5, 3.8, 5.0].forEach(function (a) { l3(c, P, [x, 0.05, z], [x + Math.cos(a) * 0.28, 0.03, z + Math.sin(a) * 0.28], '#2a2c32', 2); });
  box(c, P, x - 0.24, 0.45, z - 0.22, x + 0.24, 0.52, z + 0.22, '#3a3e48');
  box(c, P, x - 0.23, 0.55, z - 0.26, x + 0.23, 1.05, z - 0.2, '#30343e');
}
def('office_floor', function (c, R) {
  var P = Cam(560, 640, 330, 1.55), X = 7.5, Y = 3, ZB = 11.5, k, z;
  var bk = shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#8a8e9a'], [1, '#c8c4c8']], left: [[0, '#a8acb6'], [1, '#d8d4d6']], right: [[0, '#a8acb6'], [1, '#d8d4d6']],
    floor: [[0, '#8a8e9e'], [1, '#4e5464']], back: [[0, '#e8eaee'], [1, '#d8dce2']] });
  // back glass wall with sunset city
  var g0 = P(-X, Y - 0.15, ZB), g1 = P(X, 0.1, ZB);
  clipR(c, g0[0], g0[1], g1[0] - g0[0], g1[1] - g0[1], function () {
    var y0 = g0[1], y1 = g1[1];
    rect(c, 0, y0, W, y1 - y0, V(c, y0, y1, [[0, '#6a7ac0'], [0.45, '#f0a080'], [1, '#ffd8a0']]));
    lighter(c, function () { glow(c, 820, y1 - 20, 300, '#ffc890', 0.6); glow(c, 820, y1 - 20, 40, '#fff4d0', 1); });
    skyline(c, R, y1 + 4, 20, (y1 - y0) * 0.75, '#5a5a7e', '#ffe0a8', 0.06, 18, 50, g0[0], g1[0]);
    skyline(c, R, y1 + 4, 10, (y1 - y0) * 0.4, '#474a6a', '#ffe0a8', 0.1, 14, 40, g0[0], g1[0]);
  });
  for (x = -X; x <= X + 0.01; x += 1.5) { var m0 = P(x, Y, ZB), m1 = P(x, 0, ZB); line(c, m0[0], m0[1], m1[0], m1[1], '#9aa0aa', 3); }
  zlines(c, P, -X, X, Y - 0.15, [ZB], '#9aa0aa', 3); zlines(c, P, -X, X, 0.1, [ZB], '#9aa0aa', 3);
  // sunlight across floor
  lighter(c, function () { q3(c, P, [[-X, 0, ZB], [X, 0, ZB], [X, 0, 0.3], [-X, 0, 0.3]], V(c, 330, 720, [[0, 'rgba(255,190,120,.4)'], [0.5, 'rgba(255,170,110,.14)'], [1, 'rgba(255,190,120,0)']])); });
  // carpet tiles
  for (var x = -X; x <= X; x += 0.8) l3(c, P, [x, 0, 0.3], [x, 0, ZB], 'rgba(40,50,60,.14)', 1);
  // ceiling panels + lights
  for (x = -6; x <= 6; x += 3) for (z = 1.5; z < ZB; z += 2.5) fluo(c, P, x, Y - 0.01, z, 0.9, 0.9, 0.015);
  // desk rows, far to near
  [9.2, 6.6, 4.0].forEach(function (z) {
    [[-6.5, -1.2], [1.2, 6.5]].forEach(function (d) {
      box(c, P, d[0], 1.0, z + 0.62, d[1], 1.32, z + 0.66, '#b8c4ce', { top: '#d4dce2' }); // partition
      box(c, P, d[0], 0, z - 0.02, d[0] + 0.05, 0.72, z + 0.6, '#9aa4ae'); box(c, P, d[1] - 0.05, 0, z - 0.02, d[1], 0.72, z + 0.6, '#9aa4ae');
      box(c, P, d[0], 0.72, z, d[1], 0.76, z + 0.62, '#eef0f2', { top: '#f6f7f8' });
      for (var mx = d[0] + 0.6; mx < d[1] - 0.3; mx += 1.3) {
        monitor(c, P, mx, 0.76, z + 0.42, 0.55, 0.32, pick(R, ['#3a7ad8', '#4a90e0', '#2a5ab0', '#6ac0e0']));
        if (R() < 0.5) { var cp = P(mx + 0.4, 0.76, z + 0.2); eli(c, cp[0], cp[1] - 4 * 5 / z, 3.5 * 5 / z, 5 * 5 / z, '#f4f0ea'); }
        if (R() < 0.4) { var pp = P(mx - 0.45, 0.76, z + 0.25); rect(c, pp[0] - 10 * 5 / z, pp[1] - 2, 18 * 5 / z, 2 * 5 / z, '#fbfbfb'); }
      }
      for (mx = d[0] + 0.6; mx < d[1] - 0.3; mx += 1.3) officeChair(c, P, mx, z - 0.45);
    });
  });
  greenery(c, R, 60, 715, 1.5); greenery(c, R, 1225, 710, 1.4);
  lighter(c, function () { glow(c, 820, 330, 700, '#ffb070', 0.14); });
  finish(c, { vig: 0.35, tint: '#ffb080', ta: 0.18 });
});

def('meeting_room', function (c, R) {
  var P = Cam(600, 640, 320, 1.35), X = 3.6, Y = 2.8, ZB = 8.5, k, z;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#d4d8de'], [1, '#eef0f4']], left: [[0, '#cfe0ea'], [1, '#e6f0f4']], right: [[0, '#dfe4ea'], [1, '#f0f2f6']],
    floor: [[0, '#8a8e96'], [1, '#5a5e66']], back: [[0, '#eceef2'], [1, '#dde0e6']] });
  // left glass wall: office outside, frosted band
  sideWin(c, P, -X, 0.05, ZB, 0.02, Y - 0.05, function () {
    rect(c, 0, 0, W, H, V(c, 0, 720, [[0, '#dce8f0'], [1, '#aebccc']]));
    alpha(c, 0.35, function () { for (var i = 0; i < 20; i++) rect(c, R() * 360, 250 + R() * 250, 30 + R() * 60, 40 + R() * 90, pick(R, ['#8a9ab0', '#c0ccd8', '#6a7a90'])); });
  }, '#b8c0c8', 4, 1, 0.03);
  q3(c, P, [[-X + 0.01, 1.05, 0.3], [-X + 0.01, 1.05, ZB], [-X + 0.01, 1.45, ZB], [-X + 0.01, 1.45, 0.3]], 'rgba(255,255,255,.7)');
  // right windows (daylight)
  sideWin(c, P, X, 0.8, 7.6, 0.4, 2.6, function () { rect(c, 0, 0, W, H, V(c, 0, 400, [[0, '#8ec0ec'], [1, '#e8f2f8']])); skyline(c, R, 440, 40, 260, '#a8b8c8', '#e8f0f8', 0.3, 30, 70, 900, 1400); }, '#c8ccd2', 3, 1, 0.04);
  for (k = 0; k < 3; k++) { var zz = 0.9 + k * 2.27; alpha(c, 0.5, function () { for (var sl = 0.45; sl < 2.6; sl += 0.12) q3(c, P, [[X - 0.02, sl, zz], [X - 0.02, sl, zz + 2.1], [X - 0.02, sl + 0.05, zz + 2.1], [X - 0.02, sl + 0.05, zz]], '#e4e8ec'); }); }
  // back wall screen with chart
  var s0 = P(-1.8, 2.3, ZB), s1 = P(1.8, 0.95, ZB);
  rr(c, s0[0] - 6, s0[1] - 6, s1[0] - s0[0] + 12, s1[1] - s0[1] + 12, 4, '#15171c');
  rect(c, s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1], V(c, s0[1], s1[1], [[0, '#f8fafc'], [1, '#e6ecf2']]));
  var sw = s1[0] - s0[0], sh = s1[1] - s0[1];
  rect(c, s0[0], s0[1], sw, sh * 0.16, '#2a4a8a'); txt(c, 'Q3 REVIEW', s0[0] + sw * 0.18, s0[1] + sh * 0.08, sh * 0.09, '#ffffff', { f: 'sans-serif' });
  [0.35, 0.55, 0.45, 0.7, 0.85].forEach(function (v, i) { rect(c, s0[0] + sw * (0.08 + i * 0.1), s0[1] + sh * (0.9 - v * 0.65), sw * 0.07, sh * v * 0.65, i === 4 ? '#e85a4a' : '#4a7ad0'); });
  c.strokeStyle = '#2ab070'; c.lineWidth = 2; c.beginPath(); [0.3, 0.42, 0.38, 0.6, 0.72].forEach(function (v, i) { var px = s0[0] + sw * (0.62 + i * 0.08), py = s0[1] + sh * (0.9 - v * 0.7); if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.stroke();
  lighter(c, function () { glow(c, (s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2, sw * 0.8, '#dfe8ff', 0.15); });
  // credenza
  box(c, P, -2.6, 0, ZB - 0.5, 2.6, 0.7, ZB, '#5a4a3e');
  greenery(c, R, s1[0] + 90, P(2.2, 0.7, ZB - 0.25)[1], 0.9);
  // table + chairs (far to near)
  var zs = [7.0, 6.0, 5.0, 4.0, 3.0];
  officeChair(c, P, 0, 7.9);
  zs.forEach(function (z) { [-1.35, 1.35].forEach(function (x) { l3(c, P, [x, 0.05, z], [x, 0.45, z], '#2a2c32', 3); box(c, P, x - 0.24, 0.45, z - 0.24, x + 0.24, 0.52, z + 0.24, '#2e323c'); var bx = x < 0 ? x - 0.3 : x + 0.24; box(c, P, bx, 0.55, z - 0.23, bx + 0.06, 1.1, z + 0.23, '#262a32'); }); });
  [[-0.5, 3.0], [0.5, 3.0], [-0.5, 7.0], [0.5, 7.0]].forEach(function (l) { box(c, P, l[0] - 0.03, 0, l[1], l[0] + 0.03, 0.72, l[1] + 0.06, '#4a4e56'); });
  box(c, P, -0.8, 0.6, 2.4, 0.8, 0.72, 7.4, '#3a3e46');
  box(c, P, -0.95, 0.72, 2.2, 0.95, 0.77, 7.6, '#f4f4f2', { top: V(c, 300, 600, [[0, '#f8f8f6'], [1, '#dedcd8']]) });
  alpha(c, 0.2, function () { q3(c, P, [[-0.3, 0.771, 2.3], [0.3, 0.771, 2.3], [0.2, 0.771, 7.5], [-0.2, 0.771, 7.5]], '#ffffff'); });
  [[-0.6, 3.2], [0.55, 4.6], [-0.5, 5.8], [0.6, 6.6]].forEach(function (d) { q3(c, P, [[d[0] - 0.12, 0.772, d[1]], [d[0] + 0.12, 0.772, d[1]], [d[0] + 0.12, 0.772, d[1] + 0.3], [d[0] - 0.12, 0.772, d[1] + 0.3]], '#ffffff'); });
  [[0.4, 3.4], [-0.4, 5.2]].forEach(function (d) { var p = P(d[0], 0.77, d[1]); eli(c, p[0], p[1] - 6, 5, 7, '#f0f4f8'); });
  // pendant lights
  [4.4, 5.8, 7.2].forEach(function (z) { var a = P(0, Y, z), b = P(0, 2.05, z); line(c, a[0], a[1], b[0], b[1], '#333', 1); var w = sc(P, z) * 0.35; rr(c, b[0] - w, b[1], w * 2, w * 0.2, 3, '#2a2c32'); lighter(c, function () { glow(c, b[0], b[1] + w * 0.3, w * 2.2, '#fff0d0', 0.14); }); });
  finish(c, { vig: 0.32, tint: '#b8d0ff', ta: 0.12 });
});

def('subway', function (c, R) {
  var P = Cam(520, 640, 340, 1.55), X = 1.45, Y = 2.25, ZB = 19, k, z;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#9ea4aa'], [1, '#d8dcde']], left: [[0, '#aeb4b8'], [1, '#dcdfe0']], right: [[0, '#aeb4b8'], [1, '#dcdfe0']],
    floor: [[0, '#8a8c90'], [1, '#55585e']], back: [[0, '#d0d4d6'], [1, '#b8bcc0']] });
  [-X, X].forEach(function (x) { q3(c, P, [[x, 0.86, 0.3], [x, 0.86, ZB], [x, 0.92, ZB], [x, 0.92, 0.3]], '#2ab04a'); });
  alpha(c, 0.25, function () { for (k = 0; k < 400; k++) { var pz = 0.5 + Math.pow(R(), 1.8) * 18, pp = P((R() - 0.5) * 2.6, 0, pz); eli(c, pp[0], pp[1], 1.2, 0.8, '#3a3c40'); } });
  // end door w/ window to next car
  var d0 = P(-0.45, 1.95, ZB), d1 = P(0.45, 0, ZB); rect(c, d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1], '#b8bcc0');
  var w0 = P(-0.28, 1.75, ZB), w1 = P(0.28, 1.05, ZB); rect(c, w0[0], w0[1], w1[0] - w0[0], w1[1] - w0[1], '#9ab0c0'); rect(c, w0[0] + 3, w0[1] + 3, w1[0] - w0[0] - 6, w1[1] - w0[1] - 6, '#cfe0ea');
  // segments along each wall: doors / windows+seats
  var segs = []; for (z = 1.0; z < ZB - 0.5; z += 4.2) segs.push(z);
  segs.reverse().forEach(function (z0) {
    [-1, 1].forEach(function (s) {
      var x = s * X, xi = s * (X - 0.5);
      // door (at z0 .. z0+1.3)
      q3(c, P, [[x, 0, z0], [x, 0, z0 + 1.3], [x, 1.95, z0 + 1.3], [x, 1.95, z0]], '#aeb4b8');
      sideWin(c, P, x, z0 + 0.15, z0 + 1.15, 0.95, 1.8, function () { rect(c, 0, 0, W, H, '#1a1c24'); }, '#aeb4b8', 2, 1, 0.03);
      l3(c, P, [x, 0.02, z0 + 0.65], [x, 1.95, z0 + 0.65], '#6a6e72', 2);
      q3(c, P, [[x, 1.98, z0 + 0.1], [x, 1.98, z0 + 1.2], [x, 2.1, z0 + 1.2], [x, 2.1, z0 + 0.1]], '#2a2c30');
      // window run above seats
      sideWin(c, P, x, z0 + 1.6, z0 + 4.0, 0.95, 1.75, function () {
        rect(c, 0, 0, W, H, '#0e1016');
        lighter(c, function () { for (var i = 0; i < 40; i++) { var yy = P(x, 1.0 + R() * 0.7, z0 + 2.8)[1], xx = R() * W, len = 80 + R() * 320, col = pick(R, ['#ffcf8a', '#8ad0ff', '#ffffff', '#ff9a6a']); c.fillStyle = LG(c, xx, 0, xx + len, 0, [[0, rgba(col, 0)], [0.5, rgba(col, 0.85)], [1, rgba(col, 0)]]); c.fillRect(xx, yy, len, 1.5 + R() * 3); glow(c, xx + len / 2, yy, 20, col, 0.25); } });
      }, '#b0b4b8', 2, 1, 0.035);
      // ad panels
      q3(c, P, [[x, 1.9, z0 + 1.6], [x, 1.9, z0 + 4.0], [x, 2.15, z0 + 4.0], [x, 2.15, z0 + 1.6]], '#e8eaec');
      for (k = 0; k < 3; k++) q3(c, P, [[x - s * 0.005, 1.93, z0 + 1.7 + k * 0.78], [x - s * 0.005, 1.93, z0 + 2.38 + k * 0.78], [x - s * 0.005, 2.12, z0 + 2.38 + k * 0.78], [x - s * 0.005, 2.12, z0 + 1.7 + k * 0.78]], pick(R, ['#ff8a6a', '#6ab0f0', '#f2d24a', '#8ad08a', '#e88ac0']));
      // bench
      var sx0 = Math.min(x, xi), sx1 = Math.max(x, xi), seat = s < 0 && z0 > 12 ? '#e87a9a' : '#3a6ac8';
      box(c, P, sx0, 0, z0 + 1.45, sx1, 0.4, z0 + 4.15, '#a8acb0');
      box(c, P, sx0, 0.4, z0 + 1.45, sx1, 0.5, z0 + 4.15, seat, { top: lt(seat, 0.15), side: dk(seat, 0.2) });
      var bxx = s < 0 ? -X : X - 0.12; box(c, P, bxx, 0.5, z0 + 1.45, bxx + 0.12, 0.92, z0 + 4.15, dk(seat, 0.1), { side: seat });
      for (k = 1; k < 7; k++) l3(c, P, [xi, 0.5, z0 + 1.45 + k * 0.385], [x, 0.5, z0 + 1.45 + k * 0.385], rgba(dk(seat, 0.4), 0.6), 1);
      // poles at bench ends
      [z0 + 1.4, z0 + 4.2].forEach(function (pz) { l3(c, P, [xi - s * 0.03, 0, pz], [xi - s * 0.03, Y, pz], '#dfe4e8', Math.max(2, sc(P, pz) * 0.035)); });
    });
  });
  // grab bars + straps
  [-0.95, 0.95].forEach(function (x) {
    l3(c, P, [x, 1.95, 0.3], [x, 1.95, ZB], '#d8dde2', 3);
    for (z = 1.4; z < ZB; z += 0.55) { var t = P(x, 1.95, z), b = P(x, 1.68, z), r = sc(P, z) * 0.07; line(c, t[0], t[1], b[0], b[1] - r, '#e8eaee', Math.max(1, r * 0.35)); c.beginPath(); c.moveTo(b[0], b[1] - r * 1.2); c.lineTo(b[0] - r, b[1] + r * 0.6); c.lineTo(b[0] + r, b[1] + r * 0.6); c.closePath(); c.strokeStyle = '#f4f4f4'; c.lineWidth = Math.max(1, r * 0.3); c.stroke(); }
  });
  // ceiling light strips
  [-0.7, 0.7].forEach(function (x) { q3(c, P, [[x - 0.07, Y - 0.01, 0.3], [x + 0.07, Y - 0.01, 0.3], [x + 0.07, Y - 0.01, ZB], [x - 0.07, Y - 0.01, ZB]], '#ffffff'); lighter(c, function () { q3(c, P, [[x - 0.3, Y - 0.01, 0.3], [x + 0.3, Y - 0.01, 0.3], [x + 0.3, Y - 0.01, ZB], [x - 0.3, Y - 0.01, ZB]], 'rgba(230,240,255,.12)'); }); });
  alpha(c, 0.14, function () { [-0.7, 0.7].forEach(function (x) { q3(c, P, [[x - 0.1, 0.001, 0.3], [x + 0.1, 0.001, 0.3], [x + 0.1, 0.001, ZB], [x - 0.1, 0.001, ZB]], '#ffffff'); }); });
  // line map above end door
  var m0 = P(-1.2, 2.2, ZB - 0.05), m1 = P(1.2, 2.0, ZB - 0.05); rect(c, m0[0], m0[1], m1[0] - m0[0], m1[1] - m0[1], '#f6f6f6'); line(c, m0[0] + 4, (m0[1] + m1[1]) / 2, m1[0] - 4, (m0[1] + m1[1]) / 2, '#2ab04a', 2);
  finish(c, { vig: 0.38, tint: '#d0e0ff', ta: 0.1 });
});

def('apartment_night', function (c, R) {
  var P = Cam(560, 640, 320, 1.2), X = 4.2, Y = 2.6, ZB = 7.5, k;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#2a2430'], [1, '#4a3e48']], left: [[0, '#3a3038'], [1, '#6a5650']], right: [[0, '#3a3038'], [1, '#62504c']],
    floor: [[0, '#8a5a3a'], [1, '#3e2618']], back: [[0, '#5a4a4a'], [1, '#4a3a3a']] });
  planks(c, P, -X, X, 0.3, ZB, 0.22, 'rgba(30,16,8,.3)');
  // big window with night city
  var w0 = P(-2.9, 2.45, ZB), w1 = P(2.9, 0.12, ZB);
  pane(c, w0[0], w0[1], w1[0] - w0[0], w1[1] - w0[1], '#2a2226', 4, function () { nightCity(c, R, w0[0], w0[1], w1[0], w1[1], { hz: 0.55 }); moon(c, w0[0] + 90, w0[1] + 50, 18); }, 3, 1);
  // sheer curtains
  alpha(c, 0.55, function () { [[-3.6, -2.5], [2.5, 3.6]].forEach(function (cv) { for (var f = 0; f < 5; f++) { var a = P(lerp(cv[0], cv[1], f / 5), Y, ZB - 0.1), b = P(lerp(cv[0], cv[1], (f + 1) / 5), 0, ZB - 0.1); rect(c, a[0], a[1], b[0] - a[0], b[1] - a[1], LG(c, a[0], 0, b[0], 0, [[0, '#8a7a80'], [0.5, '#d8cfd0'], [1, '#8a7a80']])); } }); });
  // shelf on left wall
  box(c, P, -X, 0, 2.2, -X + 0.4, 1.9, 4.6, '#5a3e2e', { side: '#6a4a36' });
  for (var sy = 0.35; sy < 1.9; sy += 0.45) { var zz = 2.3; while (zz < 4.5) { var bw = 0.05 + R() * 0.07; q3(c, P, [[-X + 0.4, sy, zz], [-X + 0.4, sy, zz + bw], [-X + 0.4, sy + 0.24 + R() * 0.1, zz + bw], [-X + 0.4, sy + 0.24, zz]], pick(R, ['#8a3a3a', '#3a5a7a', '#c8a060', '#4a6a4a', '#e8dcc8'])); zz += bw + 0.01; } l3(c, P, [-X + 0.4, sy - 0.02, 2.2], [-X + 0.4, sy - 0.02, 4.6], '#3a2418', 3); }
  // TV on right wall
  q3(c, P, [[X - 0.02, 0.9, 3.0], [X - 0.02, 0.9, 5.0], [X - 0.02, 1.95, 5.0], [X - 0.02, 1.95, 3.0]], '#101218');
  q3(c, P, [[X - 0.03, 0.95, 3.08], [X - 0.03, 0.95, 4.92], [X - 0.03, 1.9, 4.92], [X - 0.03, 1.9, 3.08]], V(c, 150, 500, [[0, '#2a3a6a'], [1, '#6a4a8a']]));
  box(c, P, X - 0.45, 0, 2.8, X, 0.45, 5.2, '#3a2a22');
  // rug
  q3(c, P, [[-2.4, 0.005, 2.2], [2.2, 0.005, 2.2], [2.2, 0.005, 5.6], [-2.4, 0.005, 5.6]], '#5e4450');
  q3(c, P, [[-2.2, 0.006, 2.4], [2.0, 0.006, 2.4], [2.0, 0.006, 5.4], [-2.2, 0.006, 5.4]], '#7a5a66');
  alpha(c, 0.25, function () { for (var rz = 2.6; rz < 5.3; rz += 0.4) l3(c, P, [-2.1, 0.007, rz], [1.9, 0.007, rz], '#c8a0a8', 1); });
  [[-1.5, 2.2], [1.5, 2.2], [0, 4.4], [-2.6, 5], [2.6, 5]].forEach(function (d) { var p = P(d[0], Y - 0.01, d[1]); eli(c, p[0], p[1], sc(P, d[1]) * 0.08, sc(P, d[1]) * 0.02, '#fff0d0'); lighter(c, function () { glow(c, p[0], p[1] + 4, sc(P, d[1]) * 0.25, '#ffc070', 0.35); }); });
  // sofa facing camera under the window
  box(c, P, -2.3, 0, 6.2, 2.3, 0.95, 6.9, '#6a5a78', { top: '#8a7a98' });
  box(c, P, -2.3, 0, 5.4, 2.3, 0.45, 6.2, '#6a5a78', { top: '#857496' });
  box(c, P, -2.6, 0, 5.3, -2.3, 0.68, 6.9, '#5e4e6c'); box(c, P, 2.3, 0, 5.3, 2.6, 0.68, 6.9, '#5e4e6c');
  [[-1.8, '#e8c8a0'], [-1.05, '#c86a7a'], [1.2, '#e8d8c0'], [1.8, '#a8c0d8']].forEach(function (cu) { var a = P(cu[0] - 0.28, 0.9, 6.15), b = P(cu[0] + 0.28, 0.45, 6.15); rr(c, a[0], a[1], b[0] - a[0], b[1] - a[1], 6, cu[1]); });
  // coffee table
  box(c, P, -1.0, 0.36, 3.2, 1.0, 0.42, 4.2, '#7a5236', { top: '#9a6a46' });
  [[-0.95, 3.25], [0.9, 3.25], [-0.95, 4.1], [0.9, 4.1]].forEach(function (l) { box(c, P, l[0], 0, l[1], l[0] + 0.05, 0.36, l[1] + 0.05, '#4a3020'); });
  var mg = P(-0.3, 0.42, 3.6); rr(c, mg[0] - 6, mg[1] - 12, 12, 12, 2, '#f4efe6'); var bk = P(0.3, 0.42, 3.7); rect(c, bk[0] - 18, bk[1] - 4, 36, 5, '#3a6a8a');
  var cd = P(0.0, 0.42, 3.9); rect(c, cd[0] - 4, cd[1] - 14, 8, 14, '#fff4e0'); lighter(c, function () { glow(c, cd[0], cd[1] - 18, 60, '#ffb050', 0.6); });
  // floor lamp (left)
  var lb = P(-3.2, 0, 5.2), lt0 = P(-3.2, 1.75, 5.2);
  line(c, lb[0], lb[1], lt0[0], lt0[1], '#2a2226', 3); eli(c, lb[0], lb[1], 16, 4, '#2a2226');
  poly(c, [[lt0[0] - 22, lt0[1] + 26], [lt0[0] + 22, lt0[1] + 26], [lt0[0] + 14, lt0[1] - 4], [lt0[0] - 14, lt0[1] - 4]], '#f8dca8');
  lighter(c, function () { glow(c, lt0[0], lt0[1] + 12, 420, '#ffa850', 0.42); glow(c, lt0[0], lt0[1] + 12, 60, '#fff0c8', 0.8); poly(c, [[lt0[0] - 22, lt0[1] + 26], [lt0[0] + 22, lt0[1] + 26], [lt0[0] + 150, lb[1] + 40], [lt0[0] - 150, lb[1] + 40]], LG(c, 0, lt0[1], 0, lb[1] + 40, [[0, 'rgba(255,190,110,.25)'], [1, 'rgba(255,190,110,0)']])); });
  greenery(c, R, P(3.4, 0, 6.6)[0], P(3.4, 0, 6.6)[1], 1.3);
  // floor reflections of window
  alpha(c, 0.15, function () { q3(c, P, [[-2.9, 0.003, ZB], [2.9, 0.003, ZB], [2.9, 0.003, 6.9], [-2.9, 0.003, 6.9]], '#8aa0ff'); });
  lighter(c, function () { glow(c, 640, 250, 500, '#4a5aa0', 0.12); });
  finish(c, { vig: 0.55, tint: '#ff9a60', ta: 0.18 });
});

/* --------------------------------------------------- outdoor leisure */
def('amusement_park', function (c, R) {
  var k, i;
  rect(c, 0, 0, W, 520, V(c, 0, 520, [[0, '#1e1a4a'], [0.35, '#5a3a7a'], [0.62, '#d0607a'], [0.82, '#ffa070'], [1, '#ffd8a0']]));
  lighter(c, function () { glow(c, 380, 470, 460, '#ffb070', 0.45); });
  alpha(c, 0.8, function () { stars(c, R, 80, 200, 0.8); });
  for (k = 0; k < 7; k++) { var y = 180 + R() * 200, x = R() * W; alpha(c, 0.45, function () { eli(c, x, y, 200 + R() * 200, 8 + R() * 10, V(c, y - 20, y + 20, [[0, '#8a4a8a'], [1, '#ff9a8a']])); }); }
  ridge(c, R, 500, 20, '#5a3a6a', 0.7);
  // roller coaster silhouette (left)
  c.strokeStyle = '#2a1a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(-20, 360);
  var tr = []; for (i = 0; i <= 60; i++) { var t = i / 60, xx = -20 + t * 520, yy = 360 - Math.sin(t * PI * 2.4) * 110 - Math.sin(t * PI) * 60; tr.push([xx, yy]); c.lineTo(xx, yy); } c.stroke();
  c.lineWidth = 2; tr.forEach(function (p, j) { if (j % 3 === 0) line(c, p[0], p[1], p[0], 520, 'rgba(42,26,58,.9)', 2); if (j % 6 === 0 && j < 57) line(c, p[0], p[1], tr[j + 3][0], 520, 'rgba(42,26,58,.6)', 1.2); });
  lighter(c, function () { tr.forEach(function (p, j) { if (j % 2 === 0) glow(c, p[0], p[1] - 3, 7, '#ffd070', 0.8); }); });
  // ferris wheel
  var fx = 900, fy = 270, fr = 230;
  line(c, fx, fy, fx - 120, 540, '#2a1a3a', 8); line(c, fx, fy, fx + 120, 540, '#2a1a3a', 8);
  c.strokeStyle = 'rgba(40,24,56,.95)'; c.lineWidth = 4; c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(fx, fy, fr * 0.92, 0, TAU); c.stroke();
  for (k = 0; k < 24; k++) { var a = k / 24 * TAU; line(c, fx, fy, fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, 'rgba(40,24,56,.8)', 1.5); }
  var lc = ['#ff6ab0', '#ffd060', '#6ad0ff', '#a0ff8a'];
  lighter(c, function () { for (k = 0; k < 72; k++) { a = k / 72 * TAU; glow(c, fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, 9, lc[k % 4], 0.9); } for (k = 0; k < 24; k++) { a = k / 24 * TAU; for (var s2 = 0.3; s2 < 0.95; s2 += 0.16) glow(c, fx + Math.cos(a) * fr * s2, fy + Math.sin(a) * fr * s2, 5, lc[(k + 1) % 4], 0.55); } glow(c, fx, fy, 40, '#ffffff', 0.7); glow(c, fx, fy, 260, '#ff8ac0', 0.12); });
  for (k = 0; k < 16; k++) { a = k / 16 * TAU + 0.1; var gx = fx + Math.cos(a) * fr, gy = fy + Math.sin(a) * fr; line(c, gx, gy, gx, gy + 14, '#2a1a3a', 2); rr(c, gx - 13, gy + 12, 26, 22, 7, pick(R, ['#e85a7a', '#5a8ae8', '#f2c24a', '#6ac08a'])); rect(c, gx - 9, gy + 16, 18, 8, 'rgba(255,240,200,.8)'); }
  // carousel tent (center-left)
  var cx = 560, cy = 520;
  lighter(c, function () { glow(c, cx, cy - 40, 200, '#ffc070', 0.4); });
  rect(c, cx - 120, cy - 90, 240, 90, V(c, cy - 90, cy, [[0, '#ffe6b0'], [1, '#f0a060']]));
  for (k = 0; k < 7; k++) { var px = cx - 105 + k * 35; rect(c, px - 2, cy - 90, 4, 90, '#d8b060'); eli(c, px, cy - 40 + (k % 2) * 10, 12, 8, '#fff4ea'); }
  poly(c, [[cx - 140, cy - 88], [cx + 140, cy - 88], [cx, cy - 190]], '#e84a5a');
  for (k = 0; k < 8; k++) { var t0 = k / 8, t1 = (k + 0.5) / 8; poly(c, [[cx - 140 + 280 * t0, cy - 88], [cx - 140 + 280 * t1, cy - 88], [cx, cy - 190]], '#fff0e8'); }
  for (k = 0; k < 9; k++) eli(c, cx - 140 + k * 35, cy - 88, 17.5, 10, k % 2 ? '#e84a5a' : '#fff0e8');
  line(c, cx, cy - 190, cx, cy - 215, '#d8b060', 3); poly(c, [[cx, cy - 215], [cx + 22, cy - 208], [cx, cy - 201]], '#ffd060');
  lighter(c, function () { for (k = 0; k < 9; k++) glow(c, cx - 140 + k * 35, cy - 80, 8, '#fff0b0', 0.9); });
  // trees silhouettes + fence
  treeline(c, R, 540, 30, '#2a1a36', 20, 0, 380); treeline(c, R, 545, 20, '#2a1a36', 16, 1080, W);
  // plaza
  rect(c, 0, 520, W, 200, V(c, 520, 720, [[0, '#6a4a6a'], [1, '#2e1e36']]));
  alpha(c, 0.14, function () { for (k = 0; k < 14; k++) { var y2 = 520 + Math.pow(k / 14, 1.6) * 200; line(c, 0, y2, W, y2, '#8a6a8a', 1); } for (k = -10; k <= 10; k++) line(c, 640 + k * 30, 520, 640 + k * 200, 720, '#8a6a8a', 1); });
  lighter(c, function () { glow(c, 900, 600, 320, '#ff8ac0', 0.18); glow(c, 560, 580, 200, '#ffc070', 0.2); });
  // lamps + string lights
  [[120, 700, 1.2], [1160, 700, 1.2], [330, 600, 0.7], [960, 600, 0.7]].forEach(function (l) { var x = l[0], y = l[1], s = l[2]; line(c, x, y, x, y - 260 * s, '#1e1428', 5 * s); eli(c, x, y - 262 * s, 14 * s, 18 * s, '#fff0c8'); lighter(c, function () { glow(c, x, y - 262 * s, 80 * s, '#ffc070', 0.6); }); });
  stringLights(c, R, 120, 440, 330, 445, 30, ['#ffd070', '#ff8ab0', '#8ad0ff'], 14, 3);
  stringLights(c, R, 960, 445, 1160, 440, 30, ['#ffd070', '#ff8ab0', '#8ad0ff'], 14, 3);
  alpha(c, 0.8, function () { for (k = 0; k < 18; k++) person(c, 200 + R() * 900, 560 + R() * 30, 0.3 + R() * 0.1, '#241832'); });
  // balloons
  [[1040, 520, '#ff5a7a'], [1052, 510, '#5ac0ff'], [1030, 505, '#ffd24a']].forEach(function (b) { line(c, b[0], b[1] + 14, 1046, 575, '#222', 1); eli(c, b[0], b[1], 11, 14, RG(c, b[0] - 3, b[1] - 4, 16, [[0, lt(b[2], 0.5)], [1, b[2]]])); });
  bokeh(c, R, 22, ['#ffd070', '#ff8ab0', '#8ad0ff'], 6, 20, 0.18, 380, 720);
  finish(c, { vig: 0.45, tint: '#ff8aa0', ta: 0.14 });
});

def('beach', function (c, R) {
  var k, hz = 330;
  rect(c, 0, 0, W, hz, V(c, 0, hz, [[0, '#1e6ad0'], [0.6, '#5aa8ec'], [1, '#bfe2f6']]));
  lighter(c, function () { glow(c, 1020, 70, 420, '#fff6d8', 0.45); glow(c, 1020, 70, 60, '#ffffff', 1); });
  tower(c, R, 260, hz - 20, 300, '#ffffff', '#a8c4e4', 0.95); tower(c, R, 620, hz - 10, 200, '#ffffff', '#b0cae8', 0.9); tower(c, R, 1180, hz - 20, 260, '#ffffff', '#a8c4e4', 0.9);
  cloud(c, R, 820, 120, 260, '#ffffff', '#cfe0f0', 0.7);
  // island
  ridge(c, R, hz + 2, 18, '#6a90a8', 1.2, 60, 360);
  // sea
  rect(c, 0, hz, W, H - hz, V(c, hz, hz + 170, [[0, '#1a6aa8'], [0.5, '#1e8ab8'], [0.85, '#3ac0c8'], [1, '#8ae0d8']]));
  alpha(c, 0.5, function () { for (k = 0; k < 120; k++) { var y = hz + Math.pow(R(), 1.5) * 140, w = 8 + (y - hz) * 0.8 * R(); line(c, R() * W, y, R() * W + w, y, '#e8fbff', 1 + (y - hz) / 120); } });
  lighter(c, function () { for (k = 0; k < 90; k++) { var x = 820 + (R() - 0.5) * 520, y = hz + 4 + R() * 120; glow(c, x, y, 3 + R() * 6, '#fffbe0', 0.9); } });
  // buoys
  for (k = 0; k < 8; k++) { var bx = 200 + k * 130, by = hz + 50 + Math.sin(k) * 4; eli(c, bx, by, 5, 4, k % 2 ? '#ff6a3a' : '#ffffff'); }
  // shallow water + foam
  var shore = function (x) { return 480 + Math.sin(x * 0.006) * 14 + Math.sin(x * 0.017 + 1) * 6; };
  var x;
  // sand
  c.beginPath(); c.moveTo(0, H); for (x = 0; x <= W; x += 10) c.lineTo(x, shore(x)); c.lineTo(W, H); c.closePath(); c.fillStyle = V(c, 460, 720, [[0, '#f0dcb4'], [1, '#d8b888']]); c.fill();
  alpha(c, 0.35, function () { c.beginPath(); c.moveTo(0, shore(0) + 16); for (x = 0; x <= W; x += 10) c.lineTo(x, shore(x) + 14); c.lineTo(W, shore(W)); for (x = W; x >= 0; x -= 10) c.lineTo(x, shore(x) - 1); c.closePath(); c.fillStyle = '#b89a70'; c.fill(); });
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.beginPath(); for (x = 0; x <= W; x += 10) { var yy = shore(x) - 4 + Math.sin(x * 0.08) * 2; if (x) c.lineTo(x, yy); else c.moveTo(x, yy); } c.stroke();
  alpha(c, 0.6, function () { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); for (x = 0; x <= W; x += 10) { var y2 = shore(x) - 26 + Math.sin(x * 0.05 + 2) * 3; if (x) c.lineTo(x, y2); else c.moveTo(x, y2); } c.stroke(); });
  alpha(c, 0.25, function () { for (k = 0; k < 500; k++) eli(c, R() * W, 500 + R() * 220, 1, 1, R() < 0.5 ? '#a88860' : '#ffffff'); });
  // parasol + shadow + chair
  var px = 980, py = 640;
  alpha(c, 0.25, function () { eli(c, px + 60, py + 10, 190, 40, '#6a4a2a'); });
  line(c, px, py + 20, px - 30, 330, '#f4f4f4', 6);
  var top = [px - 30, 322], rw = 230;
  for (k = 0; k < 8; k++) { var a0 = PI + k * PI / 8, a1 = PI + (k + 1) * PI / 8; c.beginPath(); c.moveTo(top[0], top[1] - 40); c.lineTo(top[0] + Math.cos(a0) * rw, top[1] + 30 + Math.sin(a0) * -1 * 0); c.quadraticCurveTo(top[0] + Math.cos((a0 + a1) / 2) * rw * 1.02, top[1] + 44, top[0] + Math.cos(a1) * rw, top[1] + 30); c.closePath(); c.fillStyle = k % 2 ? '#fff6ee' : '#e84a4a'; c.fill(); }
  alpha(c, 0.18, function () { poly(c, [[top[0], top[1] - 40], [top[0] + rw, top[1] + 30], [top[0] + rw * 0.2, top[1] + 38]], '#000'); });
  poly(c, [[px - 160, 640], [px + 10, 640], [px + 40, 612], [px - 130, 612]], '#3a8ac8'); poly(c, [[px - 160, 640], [px - 130, 612], [px - 190, 560], [px - 215, 585]], '#4a9ad8');
  for (k = 0; k < 6; k++) line(c, px - 150 + k * 30, 640, px - 120 + k * 30, 612, 'rgba(255,255,255,.5)', 2);
  [[px - 150, 640], [px + 5, 640], [px - 205, 585]].forEach(function (l) { line(c, l[0], l[1], l[0], l[1] + 26, '#e8e8e8', 3); });
  // ball + towel
  eli(c, 380, 650, 30, 30, RG(c, 370, 640, 36, [[0, '#ffffff'], [1, '#e0e0e0']])); c.save(); c.beginPath(); c.arc(380, 650, 30, 0, TAU); c.clip(); rect(c, 350, 620, 20, 60, '#e84a4a'); rect(c, 390, 620, 20, 60, '#3a8ae8'); c.restore();
  poly(c, [[500, 690], [700, 670], [740, 715], [520, 720]], '#f2c24a'); for (k = 0; k < 4; k++) line(c, 510 + k * 55, 690 - k * 5, 530 + k * 55, 720, 'rgba(232,90,90,.7)', 6);
  // gulls
  for (k = 0; k < 4; k++) { var gx = 500 + R() * 400, gy = 120 + R() * 100, s = 6 + R() * 5; c.strokeStyle = '#2a3a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx - s, gy - s * 0.4); c.quadraticCurveTo(gx - s * 0.4, gy - s * 0.7, gx, gy); c.quadraticCurveTo(gx + s * 0.4, gy - s * 0.7, gx + s, gy - s * 0.4); c.stroke(); }
  finish(c, { vig: 0.28, tint: '#ffe0a0', ta: 0.12 });
});

function stall(c, R, P, x0, x1, z0, z1, awn, side) {
  var fx = side < 0 ? x1 : x0; // front plane faces the street
  box(c, P, x0, 0, z0, x1, 2.3, z1, '#5a3e2e', { side: '#2a1e1a', top: '#3a2a24' });
  var nb = side < 0 ? [x1 - 0.9, x1] : [x0, x0 + 0.9]; q3(c, P, [[nb[0], 1.0, z0 - 0.01], [nb[1], 1.0, z0 - 0.01], [nb[1], 2.2, z0 - 0.01], [nb[0], 2.2, z0 - 0.01]], '#f4ead8');
  var tc = P((nb[0] + nb[1]) / 2, 1.6, z0); txt(c, pick(R, ['떡볶이', '솜사탕', '닭꼬치', '금붕어', '빙수', '풍선']), tc[0], tc[1], sc(P, z0) * 0.2, '#c8302a', { f: 'serif', rot: 0 });
  // lit counter opening
  var c0 = [fx, 0.9, z0 + 0.1], c1 = [fx, 1.9, z1 - 0.1];
  q3(c, P, [[fx, 0.9, z0 + 0.1], [fx, 0.9, z1 - 0.1], [fx, 1.9, z1 - 0.1], [fx, 1.9, z0 + 0.1]], LG(c, 0, P(fx, 1.9, z0)[1], 0, P(fx, 0.9, z0)[1], [[0, '#ffcf80'], [1, '#e87a30']]));
  for (var k = 0; k < 6; k++) { var zz = lerp(z0 + 0.2, z1 - 0.3, k / 5); var b = P(fx, 1.0, zz), t = P(fx, 1.25, zz); eli(c, b[0], (b[1] + t[1]) / 2, Math.max(2, (b[1] - t[1]) * 0.45), (b[1] - t[1]) * 0.35, pick(R, ['#ff6a4a', '#fff0d0', '#6ad0ff', '#ffd04a', '#e84a8a'])); }
  q3(c, P, [[fx, 0, z0], [fx, 0, z1], [fx, 0.9, z1], [fx, 0.9, z0]], '#d8c8b0');
  // striped awning sloping toward street
  var ax = fx + side * -0.7 * -1; ax = fx - side * 0.7 * -1;
  var ox = fx + (side < 0 ? 0.7 : -0.7), n0 = 8;
  for (k = 0; k < n0; k++) { var za = lerp(z0, z1, k / n0), zb = lerp(z0, z1, (k + 1) / n0); q3(c, P, [[fx, 2.4, za], [fx, 2.4, zb], [ox, 2.05, zb], [ox, 2.05, za]], k % 2 ? '#fff4ea' : awn); }
  q3(c, P, [[ox, 2.05, z0], [ox, 2.05, z1], [ox, 1.9, z1], [ox, 1.9, z0]], awn);
  lighter(c, function () { var m = P(ox, 1.6, (z0 + z1) / 2); glow(c, m[0], m[1], sc(P, (z0 + z1) / 2) * 1.2, '#ffb060', 0.35); });
}
def('festival_night', function (c, R) {
  var P = Cam(560, 640, 360, 1.6), k, z;
  rect(c, 0, 0, W, 380, V(c, 0, 380, [[0, '#060a22'], [0.6, '#14184a'], [1, '#3a2450']]));
  stars(c, R, 120, 300, 0.7);
  alpha(c, 0.3, function () { for (k = 0; k < 8; k++) puff(c, R() * W, 150 + R() * 150, 120, '#6a5a8a', 0.4); });
  firework(c, R, 330, 140, 110, '#ff6a8a', 40); firework(c, R, 820, 100, 140, '#6ad0ff', 48); firework(c, R, 1080, 220, 80, '#ffd060', 32); firework(c, R, 560, 250, 60, '#a0ff8a', 26);
  lighter(c, function () { line(c, 1000, 380, 1030, 250, 'rgba(255,220,150,.4)', 2); });
  treeline(c, R, 360, 30, '#0c0a1e', 26);
  q3(c, P, [[-30, 0, 0.3], [30, 0, 0.3], [30, 0, 40], [-30, 0, 40]], V(c, 360, 720, [[0, '#3a2a30'], [1, '#1a1218']]));
  q3(c, P, [[-2.5, 0, 0.3], [2.5, 0, 0.3], [2.5, 0, 40], [-2.5, 0, 40]], V(c, 360, 720, [[0, '#6a4a3a'], [1, '#3a2620']]));
  lighter(c, function () { q3(c, P, [[-2.5, 0, 0.3], [2.5, 0, 0.3], [1, 0, 40], [-1, 0, 40]], V(c, 360, 720, [[0, 'rgba(255,170,90,.35)'], [1, 'rgba(255,170,90,0)']])); });
  // stalls both sides, far to near
  var awns = ['#d83a3a', '#2a6ac8', '#e87a2a', '#3a9a5a', '#c83a8a'];
  for (z = 30.4; z > 7; z -= 2.8) { stall(c, R, P, -5.5, -3, z, z + 2.5, awns[Math.floor(z) % 5], -1); stall(c, R, P, 3, 5.5, z, z + 2.5, awns[(Math.floor(z) + 2) % 5], 1); }
  // crowd silhouettes along the street
  var ppl = []; for (k = 0; k < 40; k++) ppl.push([(R() - 0.5) * 4.6, 3 + Math.pow(R(), 0.7) * 26]); ppl.sort(function (a, b) { return b[1] - a[1]; });
  ppl.forEach(function (p) { var f = P(p[0], 0, p[1]), s = sc(P, p[1]) * 0.0105; if (p[1] < 6) return; person(c, f[0], f[1], s, rgba('#1a1220', 0.92)); });
  // lantern strings across the street
  for (z = 6.2; z < 30; z += 3.2) { var a = P(-3.2, 2.9, z), b = P(3.2, 2.9, z), n0 = 9, sag = sc(P, z) * 0.35;
    c.strokeStyle = 'rgba(20,10,20,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, a[1] + sag * 2, b[0], b[1]); c.stroke();
    for (k = 1; k < n0; k++) { var t = k / n0, u = 1 - t, lx = u * u * a[0] + 2 * u * t * (a[0] + b[0]) / 2 + t * t * b[0], ly = u * u * a[1] + 2 * u * t * (a[1] + sag * 2) + t * t * b[1]; lantern(c, lx, ly + sc(P, z) * 0.18, sc(P, z) * 0.12, k % 2 ? '#ff5a3a' : '#ffe6b0', 0.35); } }
  bokeh(c, R, 16, ['#ffb060', '#ff7a5a', '#ffe0a0'], 6, 20, 0.22, 300, 720);
  finish(c, { vig: 0.5, tint: '#ff9a60', ta: 0.14 });
});

/* -------------------------------------------------------- apocalypse */
function vines(c, R, pts, n0, col) { // pts: array of [x,y] anchor points at the top of surfaces
  c.save(); c.lineCap = 'round';
  for (var k = 0; k < n0; k++) {
    var a = pick(R, pts), x = a[0] + (R() - 0.5) * 30, y = a[1], len = 40 + R() * 160, w = 1.5 + R() * 2;
    c.strokeStyle = rgba(col, 0.9); c.lineWidth = w; c.beginPath(); c.moveTo(x, y);
    for (var t = 0; t < len; t += 12) { x += (R() - 0.5) * 8; y += 12; c.lineTo(x, y); } c.stroke();
    for (var j = 0; j < len / 14; j++) eli(c, x + (R() - 0.5) * 14, a[1] + R() * len, 3 + R() * 5, 2 + R() * 3, rgba(R() < 0.5 ? col : lt(col, 0.25), 0.9), R() * PI);
  }
  c.restore();
}
function ruinFace(c, R, P, x, z0, z1, h, col, o) { // facade on plane x (facing the street)
  o = o || {};
  var n0 = 10, top = [], k;
  for (k = 0; k <= n0; k++) { var z = lerp(z0, z1, k / n0), hh = h - (R() < 0.35 ? R() * h * 0.35 : R() * 0.4); if (o.notch && k > 3 && k < 7) hh -= h * 0.3; top.push([x, hh, z]); }
  var pts = [[x, 0, z0], [x, 0, z1]].concat(top.slice().reverse());
  var A = P(x, h, z0), B = P(x, 0, z1);
  q3(c, P, pts, LG(c, A[0], 0, B[0], 0, [[0, dk(col, 0.1)], [1, lt(col, 0.1)]]));
  // windows
  var rows = Math.floor((h - 1) / 1.3), cols = Math.floor((z1 - z0) / 1.1);
  for (var r = 0; r < rows; r++) for (k = 0; k < cols; k++) {
    var y0 = 1.0 + r * 1.3, za = z0 + 0.3 + k * 1.1, ok = true;
    for (var t = 0; t < top.length; t++) if (Math.abs(top[t][2] - za) < 0.8 && top[t][1] < y0 + 1.1) ok = false;
    if (!ok) continue;
    q3(c, P, [[x, y0, za], [x, y0, za + 0.65], [x, y0 + 0.8, za + 0.65], [x, y0 + 0.8, za]], R() < 0.2 ? '#6a7a78' : '#23261f');
    if (R() < 0.3) q3(c, P, [[x, y0 + 0.4, za], [x, y0 + 0.8, za + 0.3], [x, y0 + 0.8, za]], 'rgba(170,190,180,.6)');
  }
  alpha(c, 0.3, function () { for (k = 0; k < 6; k++) { var zz = lerp(z0, z1, R()), a = P(x, h * 0.9, zz), b = P(x, 0, zz + 0.3); c.fillStyle = LG(c, 0, a[1], 0, b[1], [[0, 'rgba(40,36,24,.0)'], [0.5, 'rgba(40,36,24,.5)'], [1, 'rgba(40,36,24,0)']]); c.fillRect(a[0] - 3, a[1], Math.max(4, Math.abs(b[0] - a[0]) * 0.2), b[1] - a[1]); } });
  return top.map(function (p) { return P(p[0], p[1], p[2]); });
}
function car(c, P, x, z, col, o) {
  o = o || {};
  var w = 0.85, L = 2.1, s = sc(P, z);
  alpha(c, 0.4, function () { q3(c, P, [[x - w - 0.15, 0.01, z - L - 0.1], [x + w + 0.15, 0.01, z - L - 0.1], [x + w + 0.15, 0.01, z + L], [x - w - 0.15, 0.01, z + L]], '#1a1810'); });
  box(c, P, x - w + 0.1, 0, z - L + 0.3, x + w - 0.1, 0.3, z + L - 0.3, '#141414');
  box(c, P, x - w, 0.22, z - L, x + w, 0.8, z + L, col, { side: dk(col, 0.25), top: lt(col, 0.12) });
  // cabin with sloped windshield
  var cz0 = z - L * 0.2, cz1 = z + L * 0.55, ww = w * 0.88;
  if (x - ww > 0) q3(c, P, [[x - ww, 0.8, cz0 - 0.5], [x - ww, 0.8, cz1], [x - ww, 1.3, cz1 - 0.2], [x - ww, 1.3, cz0]], '#2e3432');
  if (x + ww < 0) q3(c, P, [[x + ww, 0.8, cz0 - 0.5], [x + ww, 0.8, cz1], [x + ww, 1.3, cz1 - 0.2], [x + ww, 1.3, cz0]], '#2e3432');
  q3(c, P, [[x - ww, 1.3, cz0], [x + ww, 1.3, cz0], [x + ww, 1.3, cz1 - 0.2], [x - ww, 1.3, cz1 - 0.2]], lt(col, 0.1));
  q3(c, P, [[x - ww, 0.8, cz0 - 0.5], [x + ww, 0.8, cz0 - 0.5], [x + ww, 1.3, cz0], [x - ww, 1.3, cz0]], o.broken ? '#1c201e' : '#4a5a5c');
  if (o.broken) { var m = P(x + 0.2, 1.05, cz0 - 0.25); for (var k = 0; k < 7; k++) line(c, m[0], m[1], m[0] + Math.cos(k * 0.9) * s * 0.5, m[1] + Math.sin(k * 0.9) * s * 0.2, 'rgba(200,210,200,.55)', 1); }
  q3(c, P, [[x - w, 0.35, z - L - 0.01], [x + w, 0.35, z - L - 0.01], [x + w, 0.6, z - L - 0.01], [x - w, 0.6, z - L - 0.01]], dk(col, 0.15));
  [-1, 1].forEach(function (h) { var p = P(x + h * w * 0.7, 0.5, z - L - 0.02); rect(c, p[0] - s * 0.14, p[1] - s * 0.06, s * 0.28, s * 0.1, o.lit ? '#ffe8a0' : '#8a8a80'); });
  var gp = P(x, 0.45, z - L - 0.02); rect(c, gp[0] - s * 0.3, gp[1] - s * 0.04, s * 0.6, s * 0.08, '#2a2a28');
  alpha(c, 0.5, function () { for (var k = 0; k < 6; k++) { var p = P(x + Math.sin(k * 3 + z) * 0.7, 0.8, z + Math.cos(k * 5 + x) * 1.6); eli(c, p[0], p[1], s * 0.22, s * 0.06, '#6a3a1a'); } });
}
function shrub(c, R, x, y, w, h, dark, light, n0) {
  for (var k = 0; k < n0; k++) { var t = R(), bx = x + (R() - 0.5) * w * (1 - t * 0.5), by = y - t * h, r = 5 + R() * 12; eli(c, bx, by, r * 1.3, r, t > 0.5 || R() < 0.3 ? light : dark, R() * PI); }
}
function grass(c, R, P, n0, x0, x1, z0, z1, col) {
  for (var k = 0; k < n0; k++) {
    var x = lerp(x0, x1, R()), z = lerp(z0, z1, Math.pow(R(), 1.5)), p = P(x, 0, z), s = sc(P, z) * 0.012;
    c.strokeStyle = rgba(R() < 0.5 ? col : lt(col, 0.2), 0.9); c.lineWidth = Math.max(1, s * 1.5); c.beginPath();
    for (var j = 0; j < 6; j++) { var a = -PI / 2 + (R() - 0.5) * 1.4, l = (14 + R() * 26) * s; c.moveTo(p[0] + (R() - 0.5) * 10 * s, p[1]); c.quadraticCurveTo(p[0] + Math.cos(a) * l * 0.5, p[1] + Math.sin(a) * l * 0.6, p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l); }
    c.stroke();
  }
}
def('ruined_city', function (c, R) {
  var P = Cam(560, 640, 400, 1.7), k;
  rect(c, 0, 0, W, 420, V(c, 0, 420, [[0, '#8a8a74'], [0.5, '#c4bc94'], [1, '#e8dcb0']]));
  lighter(c, function () { glow(c, 880, 170, 300, '#fff0c0', 0.35); }); eli(c, 880, 170, 34, 34, 'rgba(255,248,220,.85)');
  alpha(c, 0.45, function () { skyline(c, R, 410, 60, 280, '#a8a488', null, 0, 30, 90); });
  alpha(c, 0.3, function () { for (k = 0; k < 10; k++) { var x = R() * W; poly(c, [[x, 410], [x + 30, 410], [x + 26, 180 + R() * 100], [x + 14, 150 + R() * 100], [x + 2, 200]], '#8a8670'); } });
  alpha(c, 0.35, function () { for (k = 0; k < 6; k++) puff(c, R() * W, 200 + R() * 200, 200, '#e8dcb0', 0.6); });
  // ground
  q3(c, P, [[-40, 0, 0.3], [40, 0, 0.3], [40, 0, 60], [-40, 0, 60]], V(c, 400, 720, [[0, '#8a8468'], [1, '#4a4636']]));
  q3(c, P, [[-5, 0, 0.3], [5, 0, 0.3], [5, 0, 60], [-5, 0, 60]], V(c, 400, 720, [[0, '#7a7a70'], [1, '#3e3e3a']]));
  for (var z = 3; z < 60; z += 4) q3(c, P, [[-0.1, 0.001, z], [0.1, 0.001, z], [0.1, 0.001, z + 2], [-0.1, 0.001, z + 2]], 'rgba(220,200,120,.45)');
  // cracks
  c.strokeStyle = 'rgba(30,28,20,.6)'; c.lineWidth = 1.5; for (k = 0; k < 14; k++) { var zc = 1.5 + R() * 20, xc = (R() - 0.5) * 9, p = P(xc, 0, zc); c.beginPath(); c.moveTo(p[0], p[1]); for (var j = 0; j < 6; j++) { xc += (R() - 0.5) * 0.8; zc += (R() - 0.3) * 0.8; p = P(xc, 0, zc); c.lineTo(p[0], p[1]); } c.stroke(); }
  // buildings (far to near)
  var tops = [];
  [[40, 26, 16, '#7a7462'], [26, 18, 10, '#8a8270'], [18, 10, 16, '#6e6a5c'], [10, 2, 11, '#8a7e68']].forEach(function (b, i) {
    tops = tops.concat(ruinFace(c, R, P, -5.6, b[1], b[0], b[2], b[3], { notch: i === 2 }));
    box(c, P, -14, 0, b[1], -5.6, b[2] * 0.8, b[1] + 0.01, dk(b[3], 0.15), { noFront: false });
    tops = tops.concat(ruinFace(c, R, P, 5.6, b[1] + 1, b[0] + 1, b[2] * 0.9 + 2, mix(b[3], '#8a8a80', 0.3), { notch: i === 1 }));
    box(c, P, 5.6, 0, b[1] + 1, 14, b[2] * 0.75, b[1] + 1.01, dk(b[3], 0.1));
  });
  // collapsed holes on near facades
  [[-5.6, 4.2, 6.8, 2.5, 6.5], [5.6, 5.0, 8.0, 3.2, 7.6]].forEach(function (hq) {
    var x = hq[0], pts = []; for (var k = 0; k < 12; k++) { var a = k / 12 * TAU, rz = (hq[2] - hq[1]) / 2, ry = (hq[4] - hq[3]) / 2; pts.push(P(x, (hq[3] + hq[4]) / 2 + Math.sin(a) * ry * (0.7 + R() * 0.4), (hq[1] + hq[2]) / 2 + Math.cos(a) * rz * (0.7 + R() * 0.4))); }
    poly(c, pts, '#1e1c16'); c.save(); c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.clip();
    rect(c, 0, 0, W, H, V(c, pts[3][1], pts[9][1], [[0, '#171510'], [1, '#3a3428']]));
    for (var fy = 1.0; fy < 12; fy += 1.3) { var fa = P(x, fy, hq[1] - 1), fb = P(x - Math.sign(x) * 1.5, fy, hq[2] + 1); poly(c, [fa, P(x, fy, hq[2] + 1), P(x - Math.sign(x) * 1.5, fy, hq[2] + 1), P(x - Math.sign(x) * 1.5, fy, hq[1] - 1)], '#6a6250'); poly(c, [P(x, fy - 0.2, hq[1] - 1), P(x, fy - 0.2, hq[2] + 1), P(x, fy, hq[2] + 1), P(x, fy, hq[1] - 1)], '#8a806a'); }
    for (k = 0; k < 10; k++) { var a2 = pick(R, pts); line(c, a2[0], a2[1], a2[0] + (R() - 0.5) * 60, a2[1] + (R() - 0.5) * 60, '#5a3a24', 2); } c.restore();
    c.strokeStyle = '#a89c80'; c.lineWidth = 3; c.stroke();
  });
  var topPts = []; for (k = 0; k < 20; k++) topPts.push([R() < 0.5 ? R() * 330 : 950 + R() * 330, -5]);
  vines(c, R, tops.concat(topPts), 70, '#4a6a2a');
  // leaning street light + fallen sign
  var l0 = P(-4.6, 0, 7), l1 = P(-3.0, 4.2, 7.5); line(c, l0[0], l0[1], l1[0], l1[1], '#3a3a36', 5); line(c, l1[0], l1[1], l1[0] + 50, l1[1] + 20, '#3a3a36', 4);
  var sg = P(3.2, 0.6, 6); c.save(); c.translate(sg[0], sg[1]); c.rotate(-0.25); rect(c, -70, -26, 140, 52, '#2a5a8a'); rect(c, -66, -22, 132, 44, '#3a6a9a'); txt(c, '서울역 2km', 0, 0, 18, '#ffffff', { f: 'sans-serif' }); c.restore();
  // cars
  car(c, P, 2.0, 16, '#8a4a3a'); car(c, P, -2.6, 11, '#5a6a7a', { broken: true }); car(c, P, 1.8, 6.5, '#b8b0a0', { broken: true });
  grass(c, R, P, 160, -5.5, 5.5, 1.5, 30, '#6a8a3a');
  shrub(c, R, 1180, 740, 340, 220, '#34501e', '#5e7e34', 420); shrub(c, R, 80, 740, 280, 160, '#34501e', '#5e7e34', 300);
  // debris
  for (k = 0; k < 40; k++) { var dz = 1.5 + R() * 18, dx = (R() - 0.5) * 11, dp = P(dx, 0, dz), ds = sc(P, dz) * (0.05 + R() * 0.15); poly(c, [[dp[0] - ds, dp[1]], [dp[0] + ds, dp[1]], [dp[0] + ds * 0.4, dp[1] - ds * 0.7]], pick(R, ['#6a665a', '#8a8472', '#4a463c'])); }
  for (k = 0; k < 4; k++) { var bx = 300 + R() * 600, by = 120 + R() * 120, bs = 5 + R() * 4; c.strokeStyle = '#3a3a30'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(bx - bs, by - bs * 0.4); c.quadraticCurveTo(bx - bs * 0.4, by - bs * 0.7, bx, by); c.quadraticCurveTo(bx + bs * 0.4, by - bs * 0.7, bx + bs, by - bs * 0.4); c.stroke(); }
  finish(c, { vig: 0.5, tint: '#c8b070', ta: 0.2, haze: '#d8d0a8', ha: 0.12 });
});

function cot(c, R, P, x, z, blanket) {
  [[-0.35, -0.9], [0.32, -0.9], [-0.35, 0.87], [0.32, 0.87]].forEach(function (o) { l3(c, P, [x + o[0], 0, z + o[1]], [x + o[0], 0.4, z + o[1]], '#3a3a30', 2); });
  box(c, P, x - 0.38, 0.38, z - 0.95, x + 0.38, 0.44, z + 0.95, '#5a6a3a', { top: '#6a7a48' });
  var bz = z - 0.5 + (R() - 0.5) * 0.2;
  q3(c, P, [[x - 0.4, 0.46, bz], [x + 0.4, 0.46, bz], [x + 0.4, 0.5, z + 0.8], [x - 0.4, 0.5, z + 0.8]], blanket);
  q3(c, P, [[x - 0.4, 0.46, bz], [x + 0.4, 0.46, bz], [x + 0.42, 0.25, bz - 0.02], [x - 0.42, 0.25, bz - 0.02]], dk(blanket, 0.2));
  var pl = P(x, 0.5, z + 0.7), s = sc(P, z + 0.7); eli(c, pl[0], pl[1] - s * 0.04, s * 0.2, s * 0.05, '#b8b0a0');
}
function campLantern(c, P, x, y, z, a) {
  var p = P(x, y, z), s = sc(P, z);
  lighter(c, function () { glow(c, p[0], p[1] - s * 0.12, s * 1.3, '#ffa040', a || 0.5); glow(c, p[0], p[1] - s * 0.12, s * 0.3, '#fff0c0', 0.9); });
  rect(c, p[0] - s * 0.06, p[1] - s * 0.22, s * 0.12, s * 0.18, 'rgba(255,230,160,.9)'); rect(c, p[0] - s * 0.07, p[1] - s * 0.25, s * 0.14, s * 0.04, '#3a3a30'); rect(c, p[0] - s * 0.07, p[1] - s * 0.04, s * 0.14, s * 0.04, '#3a3a30');
}
def('shelter', function (c, R) {
  var P = Cam(560, 640, 330, 1.45), X = 5, Y = 3.4, ZB = 12, k, z;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#1a1c1a'], [1, '#3a3c36']], left: [[0, '#2a2c28'], [1, '#4a4a42']], right: [[0, '#2a2c28'], [1, '#4a4a42']],
    floor: [[0, '#5a5448'], [1, '#2a2620']], back: [[0, '#4a4a42'], [1, '#3a3a34']] });
  // concrete blocks + stains
  alpha(c, 0.18, function () { for (var y = 0.3; y < Y; y += 0.4) { zlines(c, P, -X, -X, y, [0], '#000'); l3(c, P, [-X, y, 0.3], [-X, y, ZB], '#15150f', 1); l3(c, P, [X, y, 0.3], [X, y, ZB], '#15150f', 1); } });
  alpha(c, 0.25, function () { for (k = 0; k < 10; k++) { var zz = 1 + R() * 10, sx = R() < 0.5 ? -X : X, a = P(sx, Y, zz), b = P(sx, 0.5 + R(), zz + 0.4); c.fillStyle = LG(c, 0, a[1], 0, b[1], [[0, 'rgba(20,24,16,.8)'], [1, 'rgba(20,24,16,0)']]); poly(c, [a, P(sx, Y, zz + 0.4), b, P(sx, 0.8, zz)], c.fillStyle); } });
  // pipes along ceiling
  [[-X + 0.3, Y - 0.2, '#6a4a3a'], [-X + 0.6, Y - 0.25, '#5a5a52'], [X - 0.4, Y - 0.2, '#5a5a52']].forEach(function (pp) { l3(c, P, [pp[0], pp[1], 0.3], [pp[0], pp[1], ZB], pp[2], 6); l3(c, P, [pp[0], pp[1] + 0.05, 0.3], [pp[0], pp[1] + 0.05, ZB], lt(pp[2], 0.2), 1.5); });
  // back wall: barricaded doors + old hoop
  function bw(x0, y0, x1, y1, f) { var a = P(x0, y1, ZB), b = P(x1, y0, ZB); rect(c, a[0], a[1], b[0] - a[0], b[1] - a[1], f); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; }
  bw(-1.4, 0, 1.4, 2.4, '#3a4a4a');
  var hb = bw(-0.6, 2.5, 0.6, 3.2, '#c8c8c0'); c.strokeStyle = '#8a3a2a'; c.lineWidth = 2; c.strokeRect(hb[0], hb[1], hb[2], hb[3]);
  var hr = P(0, 2.5, ZB - 0.3); c.beginPath(); c.ellipse(hr[0], hr[1], 14, 3, 0, 0, TAU); c.strokeStyle = '#8a4a2a'; c.stroke();
  for (k = 0; k < 7; k++) { var a = P(-1.9 + R() * 0.3, 0.3 + k * 0.33, ZB - 0.2), b = P(1.9 - R() * 0.3, 0.2 + k * 0.33 + (R() - 0.5) * 0.4, ZB - 0.2); c.save(); c.lineCap = 'butt'; line(c, a[0], a[1], b[0], b[1], pick(R, ['#7a5a3a', '#6a4a2e', '#8a6a44']), sc(P, ZB) * 0.16); c.restore(); }
  box(c, P, -3.8, 0, ZB - 0.8, -2.0, 2.2, ZB - 0.2, '#4a5058'); box(c, P, 2.0, 0, ZB - 0.9, 4.2, 1.2, ZB - 0.2, '#6a5040'); box(c, P, 2.2, 1.2, ZB - 0.8, 3.8, 1.9, ZB - 0.3, '#5a4234');
  // sandbags
  for (k = 0; k < 12; k++) { var sp = P(-1.8 + (k % 6) * 0.6 + (k > 5 ? 0.3 : 0), 0.18 + (k > 5 ? 0.3 : 0), ZB - 1.2), ss = sc(P, ZB - 1.2); eli(c, sp[0], sp[1], ss * 0.32, ss * 0.16, V(c, sp[1] - ss * 0.16, sp[1] + ss * 0.16, [[0, '#b8a878'], [1, '#6a5a3a']])); }
  // supply boxes
  [[3.2, 5.2], [3.9, 5.4], [3.5, 6.1], [3.4, 5.6, 1]].forEach(function (b) { var y0 = b[2] ? 0.5 : 0; box(c, P, b[0] - 0.3, y0, b[1] - 0.3, b[0] + 0.3, y0 + 0.5, b[1] + 0.3, '#a8845a', { top: '#c8a070' }); });
  box(c, P, -4.6, 0, 3, -3.8, 0.35, 5, '#2a5a8a'); // water bottles crate
  for (k = 0; k < 8; k++) { var wp = P(-4.5 + (k % 4) * 0.2, 0.35, 3.3 + Math.floor(k / 4) * 0.6); eli(c, wp[0], wp[1] - 10, 5, 12, 'rgba(160,210,240,.7)'); }
  // cots, far to near
  var blank = ['#7a3a3a', '#3a4a7a', '#6a6a4a', '#8a6a3a', '#4a6a5a'];
  [10, 8, 6, 4, 2.2].forEach(function (z, i) { cot(c, R, P, -2.6, z, blank[i % 5]); cot(c, R, P, 1.9, z + 0.4, blank[(i + 2) % 5]); });
  // hanging sheet partition
  alpha(c, 0.8, function () { l3(c, P, [-1.2, 2.3, 3], [-1.2, 2.3, 9], '#2a2a26', 1); for (k = 0; k < 6; k++) q3(c, P, [[-1.2, 2.3, 3 + k], [-1.2, 2.3, 4 + k], [-1.2, 0.8 + R() * 0.2, 4 + k], [-1.2, 0.8, 3 + k]], k % 2 ? '#6e6858' : '#5e5a4c'); });
  rect(c, 0, 0, W, H, 'rgba(12,10,8,.35)');
  // lanterns
  campLantern(c, P, -2.0, 0, 5.8, 0.45); campLantern(c, P, 3.5, 1.0, 5.6, 0.5); campLantern(c, P, 0.6, 0, 3, 0.4); campLantern(c, P, -3.8, 0.35, 4, 0.35);
  // caged bulb
  var cb = P(0, Y - 0.5, 7); line(c, cb[0], P(0, Y, 7)[1], cb[0], cb[1], '#222', 1); eli(c, cb[0], cb[1] + 6, 6, 8, '#fff4c8'); lighter(c, function () { glow(c, cb[0], cb[1] + 6, 120, '#ffd080', 0.25); });
  motes(c, R, 25, '#ffe0a0', 150, 600);
  finish(c, { vig: 0.7, tint: '#ff9a40', ta: 0.16, low: 0.2 });
});

def('ruined_mart', function (c, R) {
  var P = Cam(560, 640, 330, 1.6), X = 6, Y = 3.4, ZB = 18, k, z;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#1a1e1c'], [1, '#3a403c']], left: [[0, '#2a302c'], [1, '#4a524a']], right: [[0, '#2a302c'], [1, '#4a524a']],
    floor: [[0, '#6a6e66'], [1, '#2e322e']], back: [[0, '#3e4640'], [1, '#2e3430']] });
  for (var x = -X; x <= X; x += 0.6) l3(c, P, [x, 0, 0.3], [x, 0, ZB], 'rgba(20,24,20,.3)', 1);
  for (z = 0.6; z < ZB; z *= 1.25) zlines(c, P, -X, X, 0, [z], 'rgba(20,24,20,.3)');
  // ceiling grid with missing tiles
  for (x = -X; x < X; x += 1.2) for (z = 0.6; z < ZB; z += 1.2) { if (R() < 0.18) q3(c, P, [[x, Y, z], [x + 1.2, Y, z], [x + 1.2, Y, z + 1.2], [x, Y, z + 1.2]], '#0a0c0a'); }
  alpha(c, 0.2, function () { for (x = -X; x <= X; x += 1.2) l3(c, P, [x, Y, 0.3], [x, Y, ZB], '#5a605a', 1); for (z = 0.6; z < ZB; z += 1.2) zlines(c, P, -X, X, Y, [z], '#5a605a', 1); });
  // back wall sign
  var s0 = P(-3, 3.1, ZB), s1 = P(3, 2.5, ZB); rect(c, s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1], '#6a2a22'); txt(c, '신선 식품', (s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2, (s1[1] - s0[1]) * 0.6, 'rgba(240,220,200,.6)');
  // aisles (shelving on planes facing centre aisle) far to near
  [[-3.6, -2.8], [2.8, 3.6], [-X + 0.01, -X + 0.6], [X - 0.6, X - 0.01]].forEach(function (g, gi) {
    for (var gz = ZB - 1; gz > 2; gz -= 3.4) {
      var za = gz - 3.2, zb2 = gz;
      box(c, P, g[0], 0, za, g[1], 1.9, zb2, '#6a706c', { side: '#565c58', top: '#7a807a' });
      var face = g[1] < 0 ? g[1] + 0.001 : g[0] - 0.001;
      shelfFace(c, R, P, face, za, zb2, [0.15, 0.6, 1.05, 1.5], 0.14, '#8a948c');
    }
  });
  // toppled shelf
  q3(c, P, [[-1.6, 0, 7.2], [0.4, 0, 8.6], [0.8, 0.35, 8.3], [-1.2, 0.35, 6.9]], '#5a605c'); q3(c, P, [[-1.2, 0.35, 6.9], [0.8, 0.35, 8.3], [0.9, 0.5, 8.0], [-1.1, 0.5, 6.6]], '#7a807a');
  // scattered products
  for (k = 0; k < 42; k++) { var sz = 1.5 + Math.pow(R(), 0.8) * 13, sx = (R() - 0.5) * 5, p = P(sx, 0, sz), s = sc(P, sz) * (0.07 + R() * 0.06), pc = mix(pick(R, PROD), '#3a4a40', 0.5); c.save(); c.translate(p[0], p[1] - s * 0.3); c.rotate((R() - 0.5) * 0.8); rect(c, -s, -s * 0.6, s * 2, s * 1.2, pc); rect(c, -s, -s * 0.6, s * 2, s * 0.3, lt(pc, 0.25)); c.restore(); }
  // tipped cart
  var cp = P(1.4, 0, 3.4), cs = sc(P, 3.4) * 0.01; c.save(); c.translate(cp[0], cp[1]); c.rotate(-0.35); c.strokeStyle = '#9aa4a8'; c.lineWidth = 2;
  for (k = 0; k <= 8; k++) { line(c, -40 * cs + k * 10 * cs, -60 * cs, -34 * cs + k * 9 * cs, -10 * cs, '#9aa4a8', 1.5); } line(c, -40 * cs, -60 * cs, 42 * cs, -60 * cs, '#aab4b8', 3); line(c, -34 * cs, -10 * cs, 38 * cs, -10 * cs, '#aab4b8', 3); line(c, 42 * cs, -60 * cs, 60 * cs, -80 * cs, '#aab4b8', 3);
  eli(c, -30 * cs, 0, 6 * cs, 6 * cs, '#222'); eli(c, 30 * cs, 0, 6 * cs, 6 * cs, '#222'); c.restore();
  // fluorescent tubes: most dead, one hanging, one flickering bright
  [[-1.5, 4], [1.5, 4], [-1.5, 8], [1.5, 8], [-1.5, 12], [1.5, 12], [-1.5, 16], [1.5, 16]].forEach(function (f, i) {
    if (i === 3) { var a = P(f[0] - 0.6, Y - 0.05, f[1]), b = P(f[0] + 0.3, Y - 1.1, f[1]); line(c, a[0], a[1], b[0], b[1], '#8a908a', sc(P, f[1]) * 0.08); return; }
    if (i === 2) { var lp = P(f[0], Y - 0.05, f[1]); q3(c, P, [[f[0] - 0.6, Y - 0.02, f[1] - 0.06], [f[0] + 0.6, Y - 0.02, f[1] - 0.06], [f[0] + 0.6, Y - 0.02, f[1] + 0.06], [f[0] - 0.6, Y - 0.02, f[1] + 0.06]], '#f4fff8');
      lighter(c, function () { glow(c, lp[0], lp[1], 420, '#c8f0e0', 0.35); glow(c, lp[0], lp[1], 80, '#ffffff', 0.6); poly(c, [P(f[0] - 0.6, Y, f[1]), P(f[0] + 0.6, Y, f[1]), P(f[0] + 2.4, 0, f[1] + 0.8), P(f[0] - 2.4, 0, f[1] - 0.8)], V(c, lp[1], P(0, 0, f[1])[1], [[0, 'rgba(200,255,230,.18)'], [1, 'rgba(200,255,230,.03)']])); }); return; }
    q3(c, P, [[f[0] - 0.6, Y - 0.02, f[1] - 0.06], [f[0] + 0.6, Y - 0.02, f[1] - 0.06], [f[0] + 0.6, Y - 0.02, f[1] + 0.06], [f[0] - 0.6, Y - 0.02, f[1] + 0.06]], '#5a605a');
  });
  // light shaft from a hole in the ceiling
  shaft(c, [P(2.4, Y, 5.4), P(3.6, Y, 5.4), P(2.8, 0, 4.2), P(1.4, 0, 4.2)], '#e8f0d0', 0.2);
  lighter(c, function () { q3(c, P, [[1.4, 0.001, 3.8], [2.8, 0.001, 3.8], [2.8, 0.001, 4.8], [1.4, 0.001, 4.8]], 'rgba(230,240,200,.18)'); });
  motes(c, R, 50, '#e0f0d0', 100, 600, 520, 900);
  finish(c, { vig: 0.62, tint: '#60a080', ta: 0.22, low: 0.25 });
});

/* ------------------------------------------------------------ joseon */
var DAN = { green: '#2f7a62', blue: '#2a5a9a', red: '#b83a2a', col: '#a8342a', white: '#f4ecd8', ochre: '#d8a040' };
function hRoof(c, cx, y, w, h, o) { // hanok roof, eave line at y, ridge at y-h
  o = o || {};
  var tipUp = h * (o.lift || 0.32), L = cx - w / 2, Rr = cx + w / 2, rw = w * (o.ridge || 0.55);
  var tile = o.col || '#3a3c44';
  c.beginPath();
  c.moveTo(L - w * 0.02, y - tipUp);
  c.quadraticCurveTo(cx - w * 0.3, y + h * 0.06, cx, y + h * 0.05);
  c.quadraticCurveTo(cx + w * 0.3, y + h * 0.06, Rr + w * 0.02, y - tipUp);
  c.quadraticCurveTo(Rr - w * 0.1, y - h * 0.55, cx + rw / 2, y - h);
  c.lineTo(cx - rw / 2, y - h);
  c.quadraticCurveTo(L + w * 0.1, y - h * 0.55, L - w * 0.02, y - tipUp);
  c.closePath();
  c.fillStyle = V(c, y - h, y, [[0, lt(tile, 0.08)], [0.7, tile], [1, dk(tile, 0.3)]]); c.fill();
  // tile rows
  c.save(); c.clip(); c.strokeStyle = rgba(dk(tile, 0.5), 0.55); c.lineWidth = Math.max(1, w / 400);
  for (var k = -40; k <= 40; k++) { var t = k / 40, x0 = cx + t * rw / 2, x1 = cx + t * w * 0.52; c.beginPath(); c.moveTo(x0, y - h); c.quadraticCurveTo(x1 - t * w * 0.05, y - h * 0.3, x1, y + h * 0.1); c.stroke(); }
  c.restore();
  // eave edge highlight + rafter ends
  c.strokeStyle = '#f0ece0'; c.lineWidth = Math.max(1.5, h * 0.04); c.beginPath(); c.moveTo(L - w * 0.02, y - tipUp); c.quadraticCurveTo(cx - w * 0.3, y + h * 0.06, cx, y + h * 0.05); c.quadraticCurveTo(cx + w * 0.3, y + h * 0.06, Rr + w * 0.02, y - tipUp); c.stroke();
  // ridge
  rr(c, cx - rw / 2 - h * 0.08, y - h - h * 0.12, rw + h * 0.16, h * 0.16, h * 0.05, '#e8e2d4'); rect(c, cx - rw / 2 - h * 0.08, y - h - h * 0.06, rw + h * 0.16, h * 0.08, dk(tile, 0.2));
  [-1, 1].forEach(function (s) { var ex = cx + s * (rw / 2 + h * 0.08); poly(c, [[ex, y - h - h * 0.12], [ex + s * h * 0.12, y - h - h * 0.3], [ex + s * h * 0.06, y - h + h * 0.04]], '#2a2c32'); });
}
function eaveBand(c, R, x0, x1, y, h) { // dancheong under the eaves
  rect(c, x0, y, x1 - x0, h, DAN.green);
  var n0 = Math.max(6, Math.floor((x1 - x0) / (h * 1.1)));
  for (var k = 0; k < n0; k++) { var cx = x0 + (k + 0.5) * (x1 - x0) / n0, r = h * 0.3; eli(c, cx, y + h * 0.5, r, r, DAN.white); eli(c, cx, y + h * 0.5, r * 0.62, r * 0.62, DAN.red); eli(c, cx, y + h * 0.5, r * 0.3, r * 0.3, DAN.ochre); rect(c, cx + h * 0.4, y + h * 0.2, h * 0.12, h * 0.6, DAN.blue); }
  rect(c, x0, y, x1 - x0, h * 0.12, DAN.blue); rect(c, x0, y + h * 0.88, x1 - x0, h * 0.12, '#1e3a5a');
  // rafter ends row above
  for (var j = 0; j < n0 * 2; j++) { var rx = x0 + (j + 0.5) * (x1 - x0) / (n0 * 2); eli(c, rx, y - h * 0.22, h * 0.14, h * 0.14, DAN.green); eli(c, rx, y - h * 0.22, h * 0.07, h * 0.07, DAN.white); }
}
function lattice(c, x, y, w, h, frame, paper, n0, m0) {
  rect(c, x, y, w, h, frame); rect(c, x + 3, y + 3, w - 6, h - 6, paper);
  c.strokeStyle = frame; c.lineWidth = Math.max(1, w / 60);
  c.beginPath(); for (var k = 1; k < n0; k++) { c.moveTo(x + w * k / n0, y); c.lineTo(x + w * k / n0, y + h); } for (k = 1; k < m0; k++) { c.moveTo(x, y + h * k / m0); c.lineTo(x + w, y + h * k / m0); } c.stroke();
}
function hall(c, R, cx, base, w, h, o) { // frontal palace hall: columns, lattice doors, dancheong, roof(s)
  o = o || {};
  var bays = o.bays || 5, colH = h * 0.42, top = base - colH, bw = w * 0.86 / bays, x0 = cx - w * 0.43;
  rect(c, x0, top, w * 0.86, colH, '#3a2a22');
  for (var b = 0; b < bays; b++) { var bx = x0 + b * bw; lattice(c, bx + bw * 0.1, top + colH * 0.12, bw * 0.8, colH * 0.84, '#8a3a2a', '#efe4c8', 6, 8); }
  for (b = 0; b <= bays; b++) { var px = x0 + b * bw; rect(c, px - bw * 0.07, top, bw * 0.14, colH, LG(c, px - bw * 0.07, 0, px + bw * 0.07, 0, [[0, '#7a2218'], [0.35, '#c8483a'], [1, '#6a1c14']])); rect(c, px - bw * 0.09, base - 6, bw * 0.18, 6, '#c8c0b0'); }
  rect(c, x0 - bw * 0.1, top - h * 0.06, w * 0.86 + bw * 0.2, h * 0.06, '#8a2a20');
  eaveBand(c, R, x0 - bw * 0.2, x0 + w * 0.86 + bw * 0.2, top - h * 0.12, h * 0.06);
  if (o.double) { hRoof(c, cx, top - h * 0.14, w * 1.14, h * 0.2, { ridge: 0.98, lift: 0.4 }); var ty = top - h * 0.3; rect(c, cx - w * 0.35, ty - h * 0.12, w * 0.7, h * 0.14, '#8a2a20'); eaveBand(c, R, cx - w * 0.36, cx + w * 0.36, ty - h * 0.16, h * 0.05); hRoof(c, cx, ty - h * 0.18, w * 0.98, h * 0.36, { ridge: 0.5 }); }
  else hRoof(c, cx, top - h * 0.14, w * 1.14, h * 0.45, { ridge: 0.52 });
  if (o.plaque) { var py = o.double ? top - h * 0.2 : top - h * 0.3; rect(c, cx - w * 0.07, py - h * 0.05, w * 0.14, h * 0.1, '#1e2a4a'); rect(c, cx - w * 0.065, py - h * 0.042, w * 0.13, h * 0.084, '#2a3a6a'); txt(c, o.plaque, cx, py, h * 0.055, '#f0d890', { f: 'serif' }); }
}
function pine(c, R, x, y, s, col) {
  c.strokeStyle = '#3a2a22'; c.lineWidth = 10 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 30 * s, y - 80 * s, x - 40 * s, y - 150 * s, x + 10 * s, y - 230 * s); c.stroke();
  [[0, -230, 90], [-50, -170, 70], [50, -140, 80], [-30, -110, 60], [30, -200, 60]].forEach(function (b) { var bx = x + b[0] * s, by = y + b[1] * s; c.lineWidth = 4 * s; line(c, x + b[0] * 0.2 * s, by + 20 * s, bx, by, '#3a2a22', 4 * s); for (var k = 0; k < 7; k++) eli(c, bx + (R() - 0.5) * b[2] * s, by + (R() - 0.5) * 16 * s, b[2] * 0.35 * s, 12 * s, col || '#2a4a32'); });
}
def('joseon_palace', function (c, R) {
  var P = Cam(600, 640, 420, 1.7), k;
  rect(c, 0, 0, W, 420, V(c, 0, 420, [[0, '#4a8ad8'], [0.6, '#9ac8ec'], [1, '#e8f0f0']]));
  for (k = 0; k < 5; k++) cloud(c, R, R() * W, 60 + R() * 120, 160 + R() * 180, '#ffffff', '#c8d8ec', 0.75);
  ridge(c, R, 250, 70, '#7a9aa8', 0.8); ridge(c, R, 300, 50, '#5a7a6a', 1.1);
  // courtyard stones
  q3(c, P, [[-40, 0, 0.3], [40, 0, 0.3], [40, 0, 30], [-40, 0, 30]], V(c, 420, 720, [[0, '#c8bca8'], [1, '#a89a84']]));
  for (var z = 1.2; z < 30; z *= 1.12) { var dz = z * 0.12; for (var x = -14; x < 14; x += 0.9 + R() * 0.6) { if (R() < 0.5) continue; q3(c, P, [[x, 0.001, z], [x + 0.8, 0.001, z], [x + 0.8, 0.001, z + dz], [x, 0.001, z + dz]], rgba(pick(R, ['#b8ac96', '#d4c8b4', '#a89c88', '#c0b4a0']), 0.7), 'rgba(90,80,64,.25)', 1); } }
  // royal path
  q3(c, P, [[-1.6, 0.02, 0.3], [1.6, 0.02, 0.3], [1.6, 0.02, 24], [-1.6, 0.02, 24]], '#d6ccba');
  q3(c, P, [[-0.55, 0.05, 0.3], [0.55, 0.05, 0.3], [0.55, 0.05, 24], [-0.55, 0.05, 24]], '#e2dac8');
  [-1.6, -0.55, 0.55, 1.6].forEach(function (x) { l3(c, P, [x, 0.05, 0.3], [x, 0.05, 24], 'rgba(90,80,64,.4)', 1); });
  // terrace + stairs
  box(c, P, -12, 0, 24, 12, 0.9, 30, '#c8beac', { top: '#d8d0c0' }); box(c, P, -9, 0.9, 26, 9, 1.8, 30, '#c8beac', { top: '#d8d0c0' });
  for (k = 0; k < 6; k++) box(c, P, -1.4, k * 0.15, 23.4 + k * 0.1, 1.4, (k + 1) * 0.15, 24, '#d8d0c0');
  for (x = -12; x <= 12; x += 0.8) { if (Math.abs(x) < 1.6) continue; box(c, P, x, 0.9, 24, x + 0.08, 1.35, 24.08, '#b8ae9a'); } box(c, P, -12, 1.3, 24, -1.6, 1.36, 24.08, '#c8beac'); box(c, P, 1.6, 1.3, 24, 12, 1.36, 24.08, '#c8beac');
  // main hall
  var hb = P(0, 1.8, 30), hs = sc(P, 30);
  hall(c, R, 640, hb[1], hs * 22, hs * 13, { bays: 7, double: true, plaque: '勤政殿' });
  // rank stones
  for (k = 0; k < 8; k++) { var zz = 6 + k * 2.2; [-2.6, 2.6].forEach(function (x2) { box(c, P, x2 - 0.15, 0, zz, x2 + 0.15, 0.45, zz + 0.15, '#b0a690', { top: '#c8beac' }); var tp2 = P(x2, 0.45, zz); eli(c, tp2[0], tp2[1], sc(P, zz) * 0.15, sc(P, zz) * 0.05, '#c8beac'); }); }
  // corridors on the sides (회랑)
  [-1, 1].forEach(function (s) { var a = P(s * 16, 0, 4), b = P(s * 16, 0, 30); for (var z2 = 30; z2 > 3; z2 -= 2) box(c, P, s > 0 ? 16 : -16.3, 0, z2, s > 0 ? 16.3 : -16, 2.6, z2 + 0.3, '#a8342a'); q3(c, P, [[s * 16, 2.6, 3], [s * 16, 2.6, 30], [s * 17.5, 3.4, 30], [s * 17.5, 3.4, 3]], '#3a3c44'); q3(c, P, [[s * 16, 2.3, 3], [s * 16, 2.3, 30], [s * 16, 2.6, 30], [s * 16, 2.6, 3]], DAN.green); });
  lighter(c, function () { glow(c, 900, 90, 500, '#fff4d8', 0.2); });
  finish(c, { vig: 0.3, tint: '#ffe0b0', ta: 0.12 });
});

function lotus(c, R, x, y, s) {
  eli(c, x, y, 38 * s, 13 * s, V(c, y - 13 * s, y + 13 * s, [[0, '#6aa05a'], [1, '#2e5a32']]));
  c.save(); c.globalAlpha = 0.5; line(c, x, y, x + 30 * s, y - 4 * s, '#8ac070', 1); line(c, x, y, x - 26 * s, y + 5 * s, '#8ac070', 1); c.restore();
}
function lotusFlower(c, x, y, s) {
  line(c, x, y + 30 * s, x, y, '#4a7a3a', 2 * s);
  for (var k = -2; k <= 2; k++) { c.save(); c.translate(x, y); c.rotate(k * 0.35); eli(c, 0, -12 * s, 6 * s, 14 * s, V(c, -26 * s, 0, [[0, '#ffd0e0'], [1, '#e8709a']])); c.restore(); }
  eli(c, x, y - 4 * s, 5 * s, 3 * s, '#f0d060');
}
def('palace_pond', function (c, R) {
  var k, hz = 380;
  rect(c, 0, 0, W, hz, V(c, 0, hz, [[0, '#5a7ac0'], [0.5, '#e0a8a0'], [1, '#ffd8b0']]));
  lighter(c, function () { glow(c, 1050, 300, 380, '#ffc890', 0.45); glow(c, 1050, 300, 40, '#fff4d8', 0.9); });
  for (k = 0; k < 6; k++) { var y = 90 + R() * 200, x = R() * W; alpha(c, 0.45, function () { eli(c, x, y, 200 + R() * 200, 8 + R() * 10, V(c, y - 20, y + 20, [[0, '#b88aa0'], [1, '#ffc8a8']])); }); }
  ridge(c, R, 290, 80, '#8a8ab0', 0.7); ridge(c, R, 330, 50, '#6a7a90', 1.1);
  treeline(c, R, 372, 20, '#4a5a4a', 16);
  // pond
  rect(c, 0, hz, W, H - hz, V(c, hz, H, [[0, '#7a90a8'], [0.4, '#4a6a78'], [1, '#1e3a42']]));
  // pavilion (screen space)
  var cx = 680, base = 350, w = 560;
  function pav(flip) {
    c.save(); if (flip) { c.translate(0, base * 2 + 22); c.scale(1, -1); }
    rect(c, cx - w * 0.52, base, w * 1.04, 16, '#c8beac'); rect(c, cx - w * 0.52, base + 12, w * 1.04, 10, '#a89c88');
    for (var p2 = 0; p2 <= 12; p2++) { var px = cx - w * 0.46 + p2 * w * 0.92 / 12; rect(c, px - 8, base - 70, 16, 70, LG(c, px - 8, 0, px + 8, 0, [[0, '#9a9080'], [0.4, '#e0d8c8'], [1, '#8a8070']])); }
    rect(c, cx - w * 0.48, base - 76, w * 0.96, 8, '#b8ae9a');
    for (p2 = 0; p2 <= 12; p2++) { px = cx - w * 0.46 + p2 * w * 0.92 / 12; rect(c, px - 4.5, base - 130, 9, 56, LG(c, px - 4.5, 0, px + 4.5, 0, [[0, '#7a2218'], [0.4, '#c8483a'], [1, '#6a1c14']])); }
    for (p2 = 0; p2 < 12; p2++) { px = cx - w * 0.46 + (p2 + 0.5) * w * 0.92 / 12; rect(c, px - 14, base - 128, 28, 8, 'rgba(60,20,16,.6)'); }
    for (p2 = 0; p2 < 30; p2++) rect(c, cx - w * 0.46 + p2 * w * 0.92 / 30, base - 88, 2, 12, '#6a2a20'); rect(c, cx - w * 0.47, base - 92, w * 0.94, 4, '#8a2a20');
    eaveBand(c, R, cx - w * 0.48, cx + w * 0.48, base - 142, 12);
    hRoof(c, cx, base - 146, w * 1.12, 110, { ridge: 0.6, lift: 0.3 });
    c.restore();
  }
  // reflection first
  c.save(); c.beginPath(); c.rect(0, hz, W, H - hz); c.clip(); alpha(c, 0.35, function () { pav(true); }); c.restore();
  alpha(c, 0.25, function () { for (k = 0; k < 90; k++) { var yy = hz + Math.pow(R(), 1.4) * (H - hz); line(c, R() * W, yy, R() * W + 20 + R() * 80, yy, '#e8f0f8', 1); } });
  // island + bridges
  rect(c, cx - w * 0.56, base + 8, w * 1.12, 30, V(c, base + 8, base + 38, [[0, '#b8ae9a'], [1, '#8a806c']]));
  for (k = 0; k < 3; k++) { var bx = cx - w * 0.5 + k * 70 - 200; rect(c, bx - 200, base + 20, 190, 10, '#b8ae9a'); }
  pav(false);
  // willow
  c.strokeStyle = '#2e261c'; c.lineWidth = 34; c.lineCap = 'round'; c.beginPath(); c.moveTo(70, 740); c.bezierCurveTo(120, 500, 30, 300, 140, 40); c.stroke(); c.lineWidth = 14; c.beginPath(); c.moveTo(100, 300); c.quadraticCurveTo(220, 180, 380, 20); c.stroke(); c.strokeStyle = 'rgba(120,100,70,.4)'; c.lineWidth = 6; c.beginPath(); c.moveTo(62, 740); c.bezierCurveTo(110, 500, 22, 300, 132, 40); c.stroke();
  for (k = 0; k < 60; k++) { var wx = 30 + R() * 360, wy = -10 + R() * 120, len = 120 + R() * 260; c.strokeStyle = rgba(pick(R, ['#6a9a4a', '#8ab85a', '#4a7a3a']), 0.85); c.lineWidth = 1.5; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 10, wy + len * 0.5, wx + (R() - 0.5) * 20, wy + len); c.stroke(); for (var j = 0; j < 8; j++) eli(c, wx + (R() - 0.5) * 12, wy + R() * len, 2, 5, rgba('#8ab85a', 0.8), R()); }
  // lotus pads & flowers in foreground
  var pads = []; for (k = 0; k < 70; k++) pads.push([R() * W, 470 + Math.pow(R(), 0.8) * 250]); pads.sort(function (a, b) { return a[1] - b[1]; });
  pads.forEach(function (p) { var s = 0.4 + (p[1] - 470) / 250 * 1.4; lotus(c, R, p[0], p[1], s); if (R() < 0.18) lotusFlower(c, p[0] + 10 * s, p[1] - 12 * s, s); });
  lighter(c, function () { for (k = 0; k < 40; k++) glow(c, 900 + (R() - 0.5) * 500, hz + 10 + R() * 120, 4, '#ffe0b0', 0.8); });
  finish(c, { vig: 0.35, tint: '#ffb090', ta: 0.15 });
});

function stitched(c, R, P, x, z0, z1, y0, y1) { // horizontal stacks of stitched books on plane x
  var zz = z0 + 0.04;
  while (zz < z1 - 0.3) {
    var d = 0.24 + R() * 0.06, y = y0, top = y0 + (y1 - y0) * (0.4 + R() * 0.5);
    while (y < top) { var th = 0.025 + R() * 0.02, col = pick(R, ['#d8c088', '#c8a86a', '#e4d4a4', '#b89858', '#d0b27a']);
      q3(c, P, [[x, y, zz], [x, y, zz + d], [x, y + th, zz + d], [x, y + th, zz]], col, rgba(dk(col, 0.45), 0.6), 0.5);
      y += th + 0.003; }
    var rp0 = P(x, y0, zz + d * 0.15), rp1 = P(x, top, zz + d * 0.15); line(c, rp0[0], rp0[1], rp1[0], rp1[1], 'rgba(170,40,30,.55)', 1);
    zz += d + 0.05 + R() * 0.04;
  }
}
def('royal_library', function (c, R) {
  var P = Cam(560, 640, 330, 1.25), X = 4.2, Y = 3.2, ZB = 8.5, k, z;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#3a2618'], [1, '#6a4a30']], left: [[0, '#6a4a30'], [1, '#9a7450']], right: [[0, '#6a4a30'], [1, '#9a7450']],
    floor: [[0, '#9a6a3e'], [1, '#4e3018']], back: [[0, '#c8b490'], [1, '#a88c64']] });
  // maru boards (lateral) + frames
  for (z = 0.5; z < ZB; z += 0.35) zlines(c, P, -X, X, 0, [z], 'rgba(60,36,18,.3)');
  for (var x = -X; x <= X; x += 1.4) l3(c, P, [x, 0, 0.3], [x, 0, ZB], 'rgba(60,36,18,.35)', 2);
  // ceiling rafters
  for (x = -X; x <= X; x += 0.35) l3(c, P, [x, Y, 0.3], [x, Y, ZB], 'rgba(30,18,10,.55)', 3);
  [2, 5].forEach(function (zz) { box(c, P, -X, Y - 0.3, zz, X, Y, zz + 0.3, '#4a3020'); });
  // back wall: paper sliding doors glowing
  var d0 = P(-3.4, 2.5, ZB), d1 = P(3.4, 0.25, ZB), dw = (d1[0] - d0[0]) / 4;
  for (k = 0; k < 4; k++) lattice(c, d0[0] + k * dw + 2, d0[1], dw - 4, d1[1] - d0[1], '#6a4028', '#f6ecd0', 5, 9);
  lighter(c, function () { glow(c, 640, (d0[1] + d1[1]) / 2, 420, '#fff0c8', 0.35); });
  var tp = P(0, 2.85, ZB); rect(c, tp[0] - 90, tp[1] - 22, 180, 40, '#2a1a10'); rect(c, tp[0] - 86, tp[1] - 18, 172, 32, '#3a2a1e'); txt(c, '奎章閣', tp[0], tp[1] - 2, 22, '#e8c878', { f: 'serif' });
  // light shafts through paper
  shaft(c, [P(-3.4, 2.5, ZB), P(3.4, 2.5, ZB), P(4, 0, 3), P(-4, 0, 3)], '#fff4d8', 0.05);
  alpha(c, 0.3, function () { q3(c, P, [[-3.4, 0.002, ZB], [3.4, 0.002, ZB], [3.4, 0.002, ZB - 2.5], [-3.4, 0.002, ZB - 2.5]], V(c, 380, 460, [[0, 'rgba(255,240,200,.8)'], [1, 'rgba(255,240,200,0)']])); });
  // bookshelves on both walls
  [-1, 1].forEach(function (s) {
    var xw = s * X, xf = s * (X - 0.6);
    box(c, P, Math.min(xw, xf), 0, 0.8, Math.max(xw, xf), 2.8, 7.6, '#5a3a24', { side: '#6e4a2e', top: '#7a5434' });
    var shelves = [0.15, 0.7, 1.25, 1.8, 2.35];
    for (var zc = 0.9; zc < 7.5; zc += 1.3) {
      shelves.forEach(function (y0) { stitched(c, R, P, xf - s * 0.001, zc, zc + 1.2, y0, y0 + 0.5); });
      l3(c, P, [xf, 0, zc], [xf, 2.8, zc], '#3a2414', 3);
    }
    shelves.forEach(function (y0) { l3(c, P, [xf, y0 - 0.02, 0.8], [xf, y0 - 0.02, 7.6], '#3a2414', 3); });
  });
  // low desk (서안) + cushion + book + brush
  box(c, P, -1.0, 0, 3.2, 1.0, 0.36, 3.9, '#6a3a22', { top: '#8a4e2e' }); box(c, P, -1.05, 0.36, 3.15, 1.05, 0.4, 3.95, '#7a4428', { top: '#9a5a36' });
  q3(c, P, [[-0.45, 0.405, 3.35], [0.02, 0.41, 3.35], [0.02, 0.41, 3.75], [-0.45, 0.405, 3.75]], '#f4ead0'); q3(c, P, [[0.02, 0.41, 3.35], [0.48, 0.405, 3.35], [0.48, 0.405, 3.75], [0.02, 0.41, 3.75]], '#efe2c4');
  alpha(c, 0.6, function () { for (k = 0; k < 6; k++) { l3(c, P, [-0.4 + k * 0.07, 0.411, 3.4], [-0.4 + k * 0.07, 0.411, 3.7], '#2a2a2a', 1); l3(c, P, [0.08 + k * 0.07, 0.411, 3.4], [0.08 + k * 0.07, 0.411, 3.7], '#2a2a2a', 1); } });
  box(c, P, 0.65, 0.4, 3.4, 0.85, 0.44, 3.7, '#1e1e22'); l3(c, P, [0.55, 0.43, 3.3], [0.9, 0.43, 3.25], '#c8a060', 3);
  q3(c, P, [[-0.5, 0.01, 2.2], [0.5, 0.01, 2.2], [0.5, 0.01, 2.9], [-0.5, 0.01, 2.9]], '#8a2a3a'); q3(c, P, [[-0.4, 0.06, 2.28], [0.4, 0.06, 2.28], [0.4, 0.06, 2.82], [-0.4, 0.06, 2.82]], '#a8344a');
  // candle
  var cd = P(-0.8, 0.4, 3.5); rect(c, cd[0] - 4, cd[1] - 26, 8, 26, '#f4ead8'); lighter(c, function () { glow(c, cd[0], cd[1] - 32, 140, '#ffb050', 0.5); eli(c, cd[0], cd[1] - 32, 3, 7, '#fff4c0'); });
  motes(c, R, 50, '#ffe8b0', 150, 600, 300, 1000);
  finish(c, { vig: 0.5, tint: '#ffb060', ta: 0.2 });
});

function thatch(c, R, P, x0, x1, z0, z1, side) { // side -1: stall on the left
  var inner = side < 0 ? x1 : x0, outer = side < 0 ? x0 : x1;
  box(c, P, x0, 0, z0, x1, 1.9, z1, '#7a6048', { side: '#8a6a4e', top: '#6a5038' });
  q3(c, P, [[inner, 0, z0 + 0.1], [inner, 0, z1 - 0.1], [inner, 1.8, z1 - 0.1], [inner, 1.8, z0 + 0.1]], '#3a2a1e');
  box(c, P, Math.min(inner, inner - side * 0.6), 0, z0 + 0.15, Math.max(inner, inner - side * 0.6), 0.75, z1 - 0.15, '#9a7a56', { top: '#b89468' });
  for (var k = 0; k < 5; k++) { var zz = lerp(z0 + 0.4, z1 - 0.4, k / 4), g = P(inner - side * 0.3, 0.75, zz), s = sc(P, zz); if (k % 2) eli(c, g[0], g[1] - s * 0.12, s * 0.14, s * 0.13, V(c, g[1] - s * 0.25, g[1], [[0, '#8a5a34'], [1, '#4a2e1a']])); else { eli(c, g[0], g[1] - s * 0.05, s * 0.18, s * 0.06, '#c8a060'); for (var j = 0; j < 4; j++) eli(c, g[0] + (j - 1.5) * s * 0.07, g[1] - s * 0.08, s * 0.04, s * 0.04, pick(R, ['#e8603a', '#f0c050', '#a0c060'])); } }
  // straw roof: sloped plane toward street with fat rounded edge
  var ox = inner - side * 0.6;
  q3(c, P, [[outer - side * -0.2, 2.6, z0 - 0.2], [outer - side * -0.2, 2.6, z1 + 0.2], [ox, 1.9, z1 + 0.2], [ox, 1.9, z0 - 0.2]], V(c, P(0, 2.6, z0)[1], P(0, 1.9, z0)[1], [[0, '#c8a868'], [1, '#9a7a44']]));
  var e0 = P(ox, 1.9, z0 - 0.2), e1 = P(ox, 1.9, z1 + 0.2); c.save(); c.lineCap = 'round'; line(c, e0[0], e0[1], e1[0], e1[1], '#b8944e', sc(P, z0) * 0.22); line(c, e0[0], e0[1] - sc(P, z0) * 0.04, e1[0], e1[1] - sc(P, z1) * 0.04, '#d8b870', sc(P, z0) * 0.08); c.restore();
  var f0 = P(ox, 1.9, z0 - 0.2), f1 = P(outer + side * 0.2, 2.6, z0 - 0.2), fb = P(ox, 1.6, z0 - 0.2); eli(c, (f0[0] + f1[0]) / 2, (f0[1] + f1[1]) / 2, Math.abs(f1[0] - f0[0]) * 0.55, Math.abs(f1[1] - f0[1]) * 0.7 + sc(P, z0) * 0.1, '#b8944e');
  alpha(c, 0.35, function () { for (var t = 0; t < 30; t++) { var zz = lerp(z0, z1, R()), a = P(outer + side * 0.2, 2.6, zz), b = P(ox, 1.9, zz + 0.05); line(c, a[0], a[1], b[0], b[1], '#7a5a2a', 1); } });
}
function banner(c, P, x, z, col, ch, s) {
  var top = P(x, 3.4, z), b = P(x, 1.4, z), w = sc(P, z) * 0.35;
  line(c, top[0], top[1] - 6, b[0], P(x, 0, z)[1], '#4a3222', Math.max(2, w * 0.12));
  line(c, top[0] - w * 0.2, top[1], top[0] + w * 1.1, top[1], '#4a3222', Math.max(1.5, w * 0.08));
  c.beginPath(); c.moveTo(top[0] + w * 0.05, top[1]); c.lineTo(top[0] + w * 1.0, top[1]); c.quadraticCurveTo(top[0] + w * 1.1, (top[1] + b[1]) / 2, top[0] + w * 0.96, b[1]); c.lineTo(top[0] + w * 0.52, b[1] - w * 0.3); c.lineTo(top[0] + w * 0.05, b[1]); c.closePath(); c.fillStyle = col; c.fill();
  txt(c, ch, top[0] + w * 0.52, top[1] + (b[1] - top[1]) * 0.35, w * 0.6, col === '#f4eee0' ? '#2a2a3a' : '#f4eee0', { f: 'serif' });
}
function hanbokPerson(c, x, y, s, col, gat, f) {
  var lower = f ? mix(col, '#b83a4a', 0.6) : mix(col, '#e8e2d4', 0.3);
  if (f) poly(c, [[x - 12 * s, y - 104 * s], [x + 12 * s, y - 104 * s], [x + 30 * s, y], [x - 30 * s, y]], lower);
  else { poly(c, [[x - 15 * s, y - 70 * s], [x + 15 * s, y - 70 * s], [x + 17 * s, y], [x + 3 * s, y], [x, y - 40 * s], [x - 3 * s, y], [x - 17 * s, y]], lower); poly(c, [[x - 15 * s, y - 118 * s], [x + 15 * s, y - 118 * s], [x + 24 * s, y - 50 * s], [x - 24 * s, y - 50 * s]], col); }
  poly(c, [[x - 14 * s, y - 120 * s], [x + 14 * s, y - 120 * s], [x + 17 * s, y - (f ? 100 : 86) * s], [x - 17 * s, y - (f ? 100 : 86) * s]], f ? mix(col, '#f4e0a0', 0.4) : dk(col, 0.08));
  [-1, 1].forEach(function (d) { poly(c, [[x + d * 13 * s, y - 118 * s], [x + d * 24 * s, y - 80 * s], [x + d * 17 * s, y - 76 * s], [x + d * 11 * s, y - 100 * s]], f ? mix(col, '#f4e0a0', 0.4) : dk(col, 0.08)); });
  line(c, x - 5 * s, y - 118 * s, x + 4 * s, y - 104 * s, dk(col, 0.3), 1.5 * s);
  eli(c, x, y - 132 * s, 9 * s, 11 * s, '#e8c8a0');
  eli(c, x, y - 138 * s, 9.5 * s, 7 * s, '#1e1a1a');
  if (gat) { eli(c, x, y - 141 * s, 26 * s, 4.5 * s, 'rgba(20,20,26,.9)'); rect(c, x - 8 * s, y - 158 * s, 16 * s, 17 * s, '#15151a'); }
  else if (f) eli(c, x, y - 128 * s, 6 * s, 5 * s, '#1e1a1a');
}
def('joseon_market', function (c, R) {
  var P = Cam(560, 640, 380, 1.6), k;
  rect(c, 0, 0, W, 400, V(c, 0, 400, [[0, '#6aa0d8'], [0.6, '#b8d8ec'], [1, '#f0ece0']]));
  for (k = 0; k < 4; k++) cloud(c, R, R() * W, 70 + R() * 140, 180 + R() * 160, '#ffffff', '#d0dcea', 0.7);
  ridge(c, R, 330, 60, '#8aa0a8', 0.8); ridge(c, R, 360, 40, '#6a8a6a', 1.1);
  // far gate
  var gb = P(0, 0, 40), gs = sc(P, 40);
  rect(c, gb[0] - gs * 7, gb[1] - gs * 3.2, gs * 14, gs * 3.2, '#b8ae98'); archPath(c, gb[0], gb[1] - gs * 2.6, gs * 2.4, gs * 2.6); c.fillStyle = '#2a2420'; c.fill();
  hall(c, R, gb[0], gb[1] - gs * 3.2, gs * 9, gs * 7, { bays: 3 });
  q3(c, P, [[-40, 0, 0.3], [40, 0, 0.3], [40, 0, 40], [-40, 0, 40]], V(c, 380, 720, [[0, '#b89a74'], [1, '#8a6a48']]));
  q3(c, P, [[-3.2, 0.001, 0.3], [3.2, 0.001, 0.3], [3.2, 0.001, 40], [-3.2, 0.001, 40]], V(c, 380, 720, [[0, '#d8c09a'], [1, '#b0906a']]));
  alpha(c, 0.14, function () { for (k = 0; k < 200; k++) { var z = 1 + Math.pow(R(), 1.5) * 30, p = P((R() - 0.5) * 6, 0, z), s = sc(P, z) * (0.008 + R() * 0.02); eli(c, p[0], p[1], s * 2, s, '#6a4a2a'); } });
  alpha(c, 0.2, function () { for (k = 0; k < 6; k++) { var xx = -2.2 + k * 0.9; l3(c, P, [xx, 0.002, 0.5], [xx * 0.3, 0.002, 30], '#8a6a44', 3); } });
  // stalls both sides, far to near
  for (var z = 34; z > 2.5; z -= 3.3) { thatch(c, R, P, -6.5, -3.4, z, z + 3, -1); thatch(c, R, P, 3.4, 6.5, z + 1.2, z + 4.2, 1); }
  // banners
  [[-3.3, 9, '#f4eee0', '酒'], [3.3, 13.5, '#2a3a6a', '布'], [-3.3, 19, '#a83a2a', '藥'], [3.3, 6.2, '#f4eee0', '米'], [-3.3, 27, '#2a3a6a', '茶']].forEach(function (b) { banner(c, P, b[0], b[1], b[2], b[3]); });
  // people
  var ppl = []; for (k = 0; k < 18; k++) ppl.push([(R() - 0.5) * 5, 5 + Math.pow(R(), 0.8) * 26]); ppl.sort(function (a, b) { return b[1] - a[1]; });
  ppl.forEach(function (p, i) { var f = P(p[0], 0, p[1]); hanbokPerson(c, f[0], f[1], sc(P, p[1]) * 0.0105, pick(R, ['#f0ebe0', '#e6e0d0', '#9ab0c8', '#c8a880', '#8aa088', '#6a7a9a']), i % 3 === 0, i % 3 === 1); });
  lighter(c, function () { glow(c, 1000, 60, 500, '#fff0d0', 0.2); });
  finish(c, { vig: 0.35, tint: '#ffc880', ta: 0.16, haze: '#f0e0c0', ha: 0.06 });
});
function archPath(c, x, y, w, h) { c.beginPath(); c.moveTo(x - w / 2, y + h); c.lineTo(x - w / 2, y + w / 2); c.arc(x, y + w / 2, w / 2, PI, 0); c.lineTo(x + w / 2, y + h); c.closePath(); }

function chungsa(c, x, y, r, a) { // 청사초롱 (blue top, red body)
  lighter(c, function () { glow(c, x, y, r * 6, '#ffb060', a || 0.5); });
  rr(c, x - r, y - r * 1.3, r * 2, r * 2.6, r * 0.5, V(c, y - r * 1.3, y + r * 1.3, [[0, '#2a4aa0'], [0.3, '#3a5ab0'], [0.32, '#e8483a'], [1, '#b82a2a']]));
  lighter(c, function () { eli(c, x, y + r * 0.2, r * 0.7, r * 0.9, 'rgba(255,200,120,.55)'); });
  rect(c, x - r * 1.1, y - r * 1.45, r * 2.2, r * 0.2, '#2a1a14'); rect(c, x - r * 1.1, y + r * 1.25, r * 2.2, r * 0.2, '#2a1a14');
  line(c, x, y + r * 1.45, x, y + r * 2.2, '#e8483a', 1.5);
}
def('palace_wall_night', function (c, R) {
  var P = Cam(600, 640, 430, 1.6), k;
  rect(c, 0, 0, W, 440, V(c, 0, 440, [[0, '#040818'], [0.6, '#101c44'], [1, '#243464']]));
  stars(c, R, 260, 400, 0.9);
  moon(c, 1010, 150, 64, '#c8d8ff');
  alpha(c, 0.4, function () { for (k = 0; k < 4; k++) eli(c, 900 + R() * 300, 200 + R() * 60, 140, 8, '#3a4a7a'); });
  ridge(c, R, 360, 60, '#141c3a', 0.8);
  q3(c, P, [[-40, 0, 0.3], [40, 0, 0.3], [40, 0, 40], [-40, 0, 40]], V(c, 430, 720, [[0, '#2a2e44'], [1, '#12141e']]));
  // stone path
  for (var z = 1; z < 30; z += 0.8) for (var x = -1.8; x < 1.8; x += 0.9) { var o = (Math.floor(z / 0.8) % 2) * 0.45; q3(c, P, [[x + o, 0.002, z], [x + o + 0.86, 0.002, z], [x + o + 0.86, 0.002, z + 0.76], [x + o, 0.002, z + 0.76]], rgba(pick(R, ['#4a4e62', '#3e4256', '#545870']), 0.9)); }
  // wall running along the left (x = -3) into the distance, and continuing behind the gate
  var WX = -3.2, WH = 3.0;
  q3(c, P, [[WX, 0, 0.3], [WX, 0, 30], [WX, 1.4, 30], [WX, 1.4, 0.3]], V(c, 200, 720, [[0, '#6a6a78'], [1, '#3a3a48']]));
  for (z = 0.5; z < 30; z += 0.7) { for (var y = 0; y < 1.4; y += 0.35) { var zz = z + ((y / 0.35) % 2) * 0.35; q3(c, P, [[WX + 0.001, y + 0.02, zz], [WX + 0.001, y + 0.02, zz + 0.66], [WX + 0.001, y + 0.33, zz + 0.66], [WX + 0.001, y + 0.33, zz]], rgba(pick(R, ['#6a6a7e', '#5e5e72', '#525266', '#747488']), 0.9)); } }
  q3(c, P, [[WX, 1.4, 0.3], [WX, 1.4, 30], [WX, WH, 30], [WX, WH, 0.3]], LG(c, 0, 0, 560, 0, [[0, '#6a6a84'], [1, '#4e5068']]));
  alpha(c, 0.35, function () { for (z = 1; z < 30; z += 1.4) { var a = P(WX, 1.8, z), s = sc(P, z); eli(c, a[0], a[1] - s * 0.3, s * 0.05, s * 0.2, '#3a3a4a'); } });
  q3(c, P, [[WX - 0.35, WH, 0.3], [WX - 0.35, WH, 30], [WX + 0.45, WH - 0.25, 30], [WX + 0.45, WH - 0.25, 0.3]], '#22242e');
  q3(c, P, [[WX - 0.35, WH + 0.35, 0.3], [WX - 0.35, WH + 0.35, 30], [WX - 0.35, WH, 30], [WX - 0.35, WH, 0.3]], '#1a1c24');
  l3(c, P, [WX - 0.35, WH + 0.38, 0.3], [WX - 0.35, WH + 0.38, 30], '#3a3c4a', 5);
  // gate at the end of the path
  var gb = P(0, 0, 22), gs = sc(P, 22);
  rect(c, 0, gb[1] - gs * 3, W, gs * 3, '#3e4058'); rect(c, 0, gb[1] - gs * 3.2, W, gs * 0.3, '#1e2028');
  rect(c, gb[0] - gs * 2.6, gb[1] - gs * 3.9, gs * 5.2, gs * 3.9, '#3a2a2a');
  [-1, 1].forEach(function (s) { rect(c, gb[0] + s * gs * 2.4 - gs * 0.2, gb[1] - gs * 3.9, gs * 0.4, gs * 3.9, '#7a2a22'); rect(c, gb[0] + (s < 0 ? -gs * 2.2 : gs * 0.05), gb[1] - gs * 3.3, gs * 2.15, gs * 3.3, '#8a2a20'); for (var j = 0; j < 5; j++) for (var i = 0; i < 4; i++) eli(c, gb[0] + (s < 0 ? -gs * 2.0 : gs * 0.3) + i * gs * 0.5, gb[1] - gs * 3.0 + j * gs * 0.65, gs * 0.05, gs * 0.05, '#d8b050'); });
  eaveBand(c, R, gb[0] - gs * 2.8, gb[0] + gs * 2.8, gb[1] - gs * 4.3, gs * 0.3);
  hRoof(c, gb[0], gb[1] - gs * 4.4, gs * 7.6, gs * 2.2, { ridge: 0.5 });
  // pine silhouette
  pine(c, R, 1150, 470, 1.4, '#0e1a1c'); pine(c, R, 1010, 440, 0.8, '#101c22');
  // lanterns on posts
  [[-2.2, 3], [2.2, 3], [-2.2, 8], [2.2, 8], [-2.2, 14], [2.2, 14]].forEach(function (l) { var b = P(l[0], 0, l[1]), t = P(l[0], 1.9, l[1]), s = sc(P, l[1]); line(c, b[0], b[1], t[0], t[1], '#1e1614', s * 0.07); line(c, t[0], t[1], t[0] + (l[0] < 0 ? 1 : -1) * s * 0.3, t[1], '#1e1614', s * 0.04); chungsa(c, t[0] + (l[0] < 0 ? 1 : -1) * s * 0.3, t[1] + s * 0.28, s * 0.12, 0.55); lighter(c, function () { c.fillStyle = RG(c, b[0], b[1], s * 1.2, [[0, 'rgba(255,160,80,.18)'], [1, 'rgba(255,160,80,0)']]); c.save(); c.translate(b[0], b[1]); c.scale(1, 0.25); c.beginPath(); c.arc(0, 0, s * 1.2, 0, TAU); c.restore(); c.fill(); }); });
  lighter(c, function () { glow(c, 1010, 150, 500, '#8aa0ff', 0.1); });
  finish(c, { vig: 0.55, tint: '#4060c0', ta: 0.22 });
});

/* --------------------------------------------------- occult / fantasy */
function gothPath(c, x, y, w, h) { // pointed arch, top at y
  c.beginPath(); c.moveTo(x - w / 2, y + h); c.lineTo(x - w / 2, y + w * 0.55);
  c.quadraticCurveTo(x - w / 2, y + w * 0.12, x, y); c.quadraticCurveTo(x + w / 2, y + w * 0.12, x + w / 2, y + w * 0.55); c.lineTo(x + w / 2, y + h); c.closePath();
}
function stainedGlass(c, R, x, y, w, h, cols, lead) {
  c.save(); gothPath(c, x, y, w, h); c.fillStyle = '#10080e'; c.fill(); c.clip();
  var cell = w / 7;
  for (var gy = y - cell; gy < y + h + cell; gy += cell) for (var gx = x - w / 2 - cell; gx < x + w / 2 + cell; gx += cell) {
    var j = function () { return (R() - 0.5) * cell * 0.5; };
    poly(c, [[gx + j(), gy + j()], [gx + cell + j(), gy + j()], [gx + cell + j(), gy + cell + j()], [gx + j(), gy + cell + j()]], pick(R, cols), lead || '#140a10', Math.max(1.5, w / 90));
  }
  // rose medallion
  var rx = x, ry = y + w * 0.62, rr0 = w * 0.34;
  eli(c, rx, ry, rr0, rr0, '#2a1428');
  for (var k = 0; k < 12; k++) { var a0 = k / 12 * TAU, a1 = (k + 1) / 12 * TAU; c.beginPath(); c.moveTo(rx, ry); c.arc(rx, ry, rr0 * 0.94, a0, a1); c.closePath(); c.fillStyle = k % 2 ? cols[0] : cols[2]; c.fill(); c.strokeStyle = lead || '#140a10'; c.lineWidth = Math.max(1.5, w / 80); c.stroke(); }
  eli(c, rx, ry, rr0 * 0.35, rr0 * 0.35, cols[3] || '#ffd070'); c.stroke();
  for (k = 1; k < 3; k++) line(c, x - w / 2 + w * k / 3, ry + rr0, x - w / 2 + w * k / 3, y + h, lead || '#140a10', Math.max(3, w / 30));
  lighter(c, function () { glow(c, x, y + h * 0.45, w * 0.9, '#ffe0c0', 0.25); });
  c.restore();
  c.strokeStyle = '#2a1a1e'; c.lineWidth = Math.max(4, w / 18); gothPath(c, x, y, w, h); c.stroke();
}
function candelabra(c, x, y, s) {
  line(c, x, y, x, y - 190 * s, '#8a6a2a', 5 * s); eli(c, x, y, 26 * s, 7 * s, '#6a4a1a');
  var arms = [[-40, -170], [-20, -182], [0, -200], [20, -182], [40, -170]];
  c.strokeStyle = '#a07a30'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x - 40 * s, y - 160 * s); c.quadraticCurveTo(x, y - 140 * s, x + 40 * s, y - 160 * s); c.stroke();
  arms.forEach(function (a) { var ax = x + a[0] * s, ay = y + a[1] * s; line(c, ax, ay + 12 * s, ax, ay, '#a07a30', 2.5 * s); rect(c, ax - 3 * s, ay - 16 * s, 6 * s, 16 * s, '#f4ead8'); lighter(c, function () { glow(c, ax, ay - 22 * s, 34 * s, '#ffb050', 0.7); eli(c, ax, ay - 21 * s, 2.5 * s, 6 * s, '#fff2b0'); }); });
  lighter(c, function () { glow(c, x, y - 190 * s, 170 * s, '#ff9a40', 0.25); });
}
function frame(c, x, y, w, h, inner) {
  rect(c, x - 6, y - 6, w + 12, h + 12, LG(c, x, y, x + w, y + h, [[0, '#e8c060'], [0.5, '#8a6020'], [1, '#d8a848']]));
  rect(c, x, y, w, h, inner || '#2a1a1a');
}
def('gothic_mansion', function (c, R) {
  var P = Cam(540, 640, 360, 1.6), X = 5.5, Y = 7, ZB = 15, k, z;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#0e080c'], [1, '#2a161c']], left: [[0, '#1e1016'], [1, '#3e2228']], right: [[0, '#1e1016'], [1, '#3e2228']],
    floor: [[0, '#3a2226'], [1, '#140a0c']], back: [[0, '#3a2226'], [1, '#2a161a']] });
  // checker marble floor
  for (z = 0.5; z < ZB; z += 0.9) for (var x = -X; x < X; x += 0.9) if ((Math.round(z / 0.9) + Math.round(x / 0.9)) % 2) q3(c, P, [[x, 0.001, z], [x + 0.9, 0.001, z], [x + 0.9, 0.001, z + 0.9], [x, 0.001, z + 0.9]], 'rgba(10,4,8,.45)');
  // wall panels + portraits
  [-X, X].forEach(function (sx) {
    q3(c, P, [[sx, 0, 0.3], [sx, 0, ZB], [sx, 1.2, ZB], [sx, 1.2, 0.3]], '#2a1216');
    for (z = 1.5; z < ZB - 1; z += 3.2) {
      var a = P(sx, 3.8, z), b = P(sx, 2.2, z + 1.4);
      q3(c, P, [[sx, 2.1, z - 0.1], [sx, 2.1, z + 1.5], [sx, 3.9, z + 1.5], [sx, 3.9, z - 0.1]], '#b08838');
      q3(c, P, [[sx, 2.2, z], [sx, 2.2, z + 1.4], [sx, 3.8, z + 1.4], [sx, 3.8, z]], V(c, a[1], b[1], [[0, '#3a2a2a'], [1, '#1a1012']]));
      var m = P(sx, 3.15, z + 0.7), s = sc(P, z + 0.7); eli(c, m[0], m[1], s * 0.12, s * 0.2, '#8a7060'); eli(c, m[0], m[1] + s * 0.45, s * 0.3, s * 0.2, '#3a1a2a');
      // pilasters
      q3(c, P, [[sx, 0, z + 2.1], [sx, 0, z + 2.5], [sx, Y, z + 2.5], [sx, Y, z + 2.1]], '#2e1a1e');
    }
  });
  // stained glass window on back wall + drapes
  var w0 = P(-2.0, 6.5, ZB), w1 = P(2.0, 1.4, ZB);
  stainedGlass(c, R, (w0[0] + w1[0]) / 2, w0[1], w1[0] - w0[0], w1[1] - w0[1], ['#c8283a', '#2a4ab0', '#7a2a9a', '#e8b030', '#2a8a6a', '#a81a4a'], '#1a0c14');
  [[-3.4, -2.1], [2.1, 3.4]].forEach(function (d) { var a = P(d[0], 6.6, ZB - 0.05), b = P(d[1], 0, ZB - 0.05), fw = (b[0] - a[0]) / 4; for (var f = 0; f < 4; f++) rect(c, a[0] + f * fw, a[1], fw + 1, b[1] - a[1], LG(c, a[0] + f * fw, 0, a[0] + (f + 1) * fw, 0, [[0, '#3a0610'], [0.45, '#b01a2e'], [1, '#4a0814']])); });
  var vt = P(-3.5, 6.95, ZB - 0.05), vb = P(3.5, 6.55, ZB - 0.05); rect(c, vt[0], vt[1], vb[0] - vt[0], vb[1] - vt[1], V(c, vt[1], vb[1], [[0, '#8a1224'], [1, '#4a0612']])); for (k = 0; k < 9; k++) { var sx2 = vt[0] + (k + 0.5) * (vb[0] - vt[0]) / 9; eli(c, sx2, vb[1], (vb[0] - vt[0]) / 18, 8, '#6a0c1a'); }
  // grand staircase
  for (k = 0; k < 10; k++) { var zz = ZB - 4 + k * 0.28; box(c, P, -2.6 + k * 0.05, k * 0.2, zz, 2.6 - k * 0.05, (k + 1) * 0.2, ZB, '#3a2428', { top: '#5a3a3a' }); q3(c, P, [[-1.1, (k + 1) * 0.2 + 0.001, zz], [1.1, (k + 1) * 0.2 + 0.001, zz], [1.1, (k + 1) * 0.2 + 0.001, zz + 0.28], [-1.1, (k + 1) * 0.2 + 0.001, zz + 0.28]], '#8a0e20'); q3(c, P, [[-1.1, k * 0.2, zz], [1.1, k * 0.2, zz], [1.1, (k + 1) * 0.2, zz], [-1.1, (k + 1) * 0.2, zz]], '#6a0a18'); }
  [-2.6, 2.6].forEach(function (x2) { l3(c, P, [x2, 1.0, ZB - 4], [x2 * 0.83, 2.9, ZB], '#b08838', 4); box(c, P, x2 - 0.12, 0, ZB - 4.1, x2 + 0.12, 1.2, ZB - 3.9, '#3a2024'); });
  // red carpet runner
  q3(c, P, [[-1.1, 0.003, 0.3], [1.1, 0.003, 0.3], [1.1, 0.003, ZB - 4], [-1.1, 0.003, ZB - 4]], V(c, 400, 720, [[0, '#7a0a1a'], [1, '#b8182e']]));
  [-1.1, 1.1].forEach(function (x2) { l3(c, P, [x2 * 0.93, 0.004, 0.3], [x2 * 0.93, 0.004, ZB - 4], '#d8a840', 2); });
  // coloured light from the glass on the floor
  lighter(c, function () { [['#c8283a', -0.8], ['#2a4ab0', 0.2], ['#e8b030', 0.9]].forEach(function (g) { var gp = P(g[1], 0, 6.5); c.fillStyle = RG(c, gp[0], gp[1], 90, [[0, rgba(g[0], 0.22)], [1, rgba(g[0], 0)]]); c.save(); c.translate(gp[0], gp[1]); c.scale(1.2, 0.3); c.beginPath(); c.arc(0, 0, 90, 0, TAU); c.restore(); c.fill(); }); shaft(c, [w0, [w1[0], w0[1]], P(1.3, 0, 5), P(-1.3, 0, 5)], '#ffc8d0', 0.07); });
  // candelabras along the carpet
  [[-2, 3.2], [2, 3.2], [-2, 7], [2, 7]].forEach(function (cd) { var b = P(cd[0], 0, cd[1]); candelabra(c, b[0], b[1], sc(P, cd[1]) * 0.0105); });
  motes(c, R, 30, '#ffc890', 150, 600);
  finish(c, { vig: 0.65, tint: '#a02040', ta: 0.18 });
});

function neonSign(c, x, y, w, h, s, col, vertical) {
  rr(c, x, y, w, h, Math.min(w, h) * 0.12, 'rgba(12,8,20,.92)');
  c.save(); c.shadowColor = col; c.shadowBlur = Math.min(w, h) * 0.5; rr(c, x + 3, y + 3, w - 6, h - 6, Math.min(w, h) * 0.1, null, col, Math.max(1.5, Math.min(w, h) * 0.05)); c.restore();
  if (vertical) { var n0 = s.length; s.split('').forEach(function (ch, i) { txt(c, ch, x + w / 2, y + h * (i + 0.5) / n0, Math.min(w * 0.62, h / n0 * 0.8), lt(col, 0.55), { glow: col, blur: 12 }); }); }
  else txt(c, s, x + w / 2, y + h / 2, Math.min(h * 0.62, w / s.length * 1.1), lt(col, 0.55), { glow: col, blur: 12 });
  lighter(c, function () { glow(c, x + w / 2, y + h / 2, Math.max(w, h) * 0.9, col, 0.22); });
}
def('neon_alley', function (c, R) {
  var P = Cam(540, 640, 360, 1.6), X = 2.4, Y = 16, ZB = 40, k, z;
  rect(c, 0, 0, W, H, '#07060e');
  rect(c, 0, 0, W, 360, V(c, 0, 360, [[0, '#07061a'], [1, '#2a1a3a']]));
  // far street glow
  var e0 = P(-X, 5, ZB), e1 = P(X, 0, ZB); rect(c, e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1], V(c, e0[1], e1[1], [[0, '#3a2a5a'], [1, '#ff8a70']]));
  lighter(c, function () { glow(c, 640, e1[1] - 20, 180, '#ff9a80', 0.5); });
  // ground
  q3(c, P, [[-X, 0, 0.3], [X, 0, 0.3], [X, 0, ZB], [-X, 0, ZB]], V(c, 360, 720, [[0, '#1a1426'], [1, '#0a0810']]));
  // walls
  [-1, 1].forEach(function (s) { var x = s * X; q3(c, P, [[x, 0, 0.3], [x, 0, ZB], [x, Y, ZB], [x, Y, 0.3]], LG(c, s < 0 ? 0 : W, 0, 640, 0, [[0, '#1a1422'], [1, '#2a2034']])); });
  // windows, AC units, pipes
  [-1, 1].forEach(function (s) {
    var x = s * X;
    for (z = 1; z < ZB - 1; z += 2.2) for (var y = 3.2; y < Y; y += 2.4) { if (R() < 0.25) continue; var lit = R() < 0.35; q3(c, P, [[x, y, z], [x, y, z + 1], [x, y + 1.1, z + 1], [x, y + 1.1, z]], lit ? pick(R, ['#ffcf8a', '#8ad0ff', '#ff9ac0']) : '#0e0a16'); }
    for (k = 0; k < 9; k++) { var az = 6 + R() * 28, ay = 2.4 + R() * 6, xi = x - s * 0.45; box(c, P, Math.min(x, xi), ay, az, Math.max(x, xi), ay + 0.45, az + 0.65, '#3a3a4a', { side: '#44445a', top: '#4e4e62', bot: '#2a2a38' }); var fc = P(xi, ay + 0.22, az + 0.32); eli(c, fc[0], fc[1], sc(P, az) * 0.03, sc(P, az) * 0.15, '#1e1e2a'); }
    l3(c, P, [x - s * 0.1, 0, 3], [x - s * 0.1, Y, 3], '#3a3a48', 5); l3(c, P, [x - s * 0.1, 0, 12], [x - s * 0.1, Y, 12], '#3a3a48', 4);
  });
  // overhead cables
  c.strokeStyle = 'rgba(10,8,14,.9)'; c.lineWidth = 1.5;
  for (k = 0; k < 9; k++) { var zc = 3 + k * 3.5, a = P(-X, 5 + R() * 3, zc), b = P(X, 5 + R() * 3, zc + (R() - 0.5) * 3); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 40 * 5 / zc, b[0], b[1]); c.stroke(); }
  // neon signs: projecting vertical ones (face the camera) and flat ones on the walls
  var words = ['노래방', '호프', '분식', 'PC방', '24시', '치킨', '여관', '당구장', 'BAR'], cols = ['#ff3a8a', '#3ad8ff', '#ffb03a', '#a05aff', '#3aff9a', '#ff5a3a'];
  var signs = []; for (z = 3; z < 30; z += 2.6) signs.push(z); signs.reverse();
  var refl = [];
  signs.forEach(function (z, i) {
    var s = i % 2 ? -1 : 1, x = s * X, wd = words[i % words.length], col = cols[i % cols.length];
    if (i % 3 !== 2) { var yb = 2.6 + (i % 4) * 0.6, a = P(x - s * 0.75, yb + 2.2, z), b = P(x - s * 0.15, yb, z); var l = Math.min(a[0], b[0]), r = Math.max(a[0], b[0]); neonSign(c, l, a[1], r - l, b[1] - a[1], wd.replace('PC방', 'PC'), col, true); refl.push([(l + r) / 2, col, sc(P, z), z]); }
    else { var q0 = P(x, 2.8, z), q1 = P(x, 2.2, z + 1.8); var l2 = Math.min(q0[0], q1[0]), r2 = Math.max(q0[0], q1[0]); c.save(); c.shadowColor = col; c.shadowBlur = 16; poly(c, [P(x, 2.2, z), P(x, 2.2, z + 1.8), P(x, 2.8, z + 1.8), P(x, 2.8, z)], null, col, 2.5); c.restore(); txt(c, wd, (l2 + r2) / 2, (q0[1] + q1[1]) / 2 + 2, (q1[1] - q0[1]) * 0.8 + 6, lt(col, 0.5), { glow: col, blur: 10 }); refl.push([(l2 + r2) / 2, col, sc(P, z), z]); }
  });
  // wet reflections on the ground
  lighter(c, function () {
    refl.forEach(function (r0) { var g = P(0, 0, r0[3] * 0.8), yy = g[1], len = r0[2] * 1.3, rx0 = r0[0] + (r0[0] - 640) * -0.15; c.save(); c.translate(rx0, yy + len * 0.35); c.scale(0.22, 1); c.fillStyle = RG(c, 0, 0, len * 0.65, [[0, rgba(r0[1], 0.75)], [0.5, rgba(r0[1], 0.25)], [1, rgba(r0[1], 0)]]); c.fillRect(-len, -len, len * 2, len * 2); c.restore(); glow(c, r0[0], P(0, 3, r0[3])[1], r0[2] * 1.2, r0[1], 0.08); });
    q3(c, P, [[-0.8, 0.001, 0.3], [0.8, 0.001, 0.3], [0.3, 0.001, ZB], [-0.3, 0.001, ZB]], V(c, 360, 720, [[0, 'rgba(255,140,120,.35)'], [0.4, 'rgba(255,140,120,.08)'], [1, 'rgba(255,140,120,0)']]));
  });
  // puddles
  for (k = 0; k < 8; k++) { var pz = 1.5 + R() * 12, px = (R() - 0.5) * 3.4, pp = P(px, 0, pz), ps = sc(P, pz); alpha(c, 0.5, function () { eli(c, pp[0], pp[1], ps * (0.4 + R() * 0.5), ps * 0.06, '#2a2440'); }); }
  rain(c, R, 500, '#c8d8ff', 0.28, 30);
  alpha(c, 0.5, function () { rain(c, R, 120, '#ffffff', 0.35, 60); });
  finish(c, { vig: 0.55, tint: '#6a3aa0', ta: 0.2 });
});

function floatCandle(c, x, y, s) {
  rect(c, x - 3 * s, y, 6 * s, 20 * s, '#f4ead8');
  lighter(c, function () { glow(c, x, y - 5 * s, 26 * s, '#ffb050', 0.55); eli(c, x, y - 4 * s, 2.2 * s, 5 * s, '#fff2b0'); });
}
def('academy_hall', function (c, R) {
  var P = Cam(520, 640, 380, 1.7), X = 7, Y = 14, ZB = 28, k, z;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#070a20'], [1, '#1a1e48']], left: [[0, '#241a18'], [1, '#4a3a32']], right: [[0, '#241a18'], [1, '#4a3a32']],
    floor: [[0, '#4a3830'], [1, '#1e1410']], back: [[0, '#40342c'], [1, '#2a201a']] });
  // enchanted starry ceiling
  var c0 = P(-X, Y, 0.3), c1 = P(X, Y, ZB); c.save(); c.beginPath(); c.rect(0, 0, W, c1[1]); c.clip(); stars(c, R, 200, c1[1], 0.9); alpha(c, 0.3, function () { puff(c, 400, 60, 300, '#5a4aa0', 0.5); puff(c, 900, 120, 260, '#3a5aa0', 0.5); }); c.restore();
  // stone courses
  alpha(c, 0.18, function () { for (var y = 0.6; y < Y; y += 0.6) { l3(c, P, [-X, y, 0.3], [-X, y, ZB], '#1a0e08', 1); l3(c, P, [X, y, 0.3], [X, y, ZB], '#1a0e08', 1); } });
  // tall windows on side walls
  [-X, X].forEach(function (sx) {
    for (z = 3; z < ZB - 2; z += 4) {
      var a = P(sx, 11, z), b = P(sx, 3, z + 1.8), m = P(sx, 7, z + 0.9);
      clip(c, [P(sx, 3, z), P(sx, 3, z + 1.8), P(sx, 10, z + 1.8), P(sx, 11, z + 0.9), P(sx, 10, z)], function () { rect(c, 0, 0, W, H, V(c, a[1], b[1], [[0, '#141e50'], [1, '#4a64a8']])); lighter(c, function () { glow(c, m[0], m[1], sc(P, z) * 1.5, '#9ab8ff', 0.3); }); });
      l3(c, P, [sx, 3, z + 0.9], [sx, 11, z + 0.9], '#2a1a14', Math.max(2, sc(P, z) * 0.06)); for (var yy = 4; yy < 10.5; yy += 1.4) l3(c, P, [sx, yy, z], [sx, yy, z + 1.8], '#2a1a14', Math.max(1, sc(P, z) * 0.04));
      // pillars
      box(c, P, sx < 0 ? sx : sx - 0.6, 0, z + 2.5, sx < 0 ? sx + 0.6 : sx, Y, z + 3.1, '#5a4434', { side: '#6a5040' });
    }
  });
  // banners hanging from above
  var bcol = ['#a8242e', '#2a7a3a', '#2a4aa8', '#d8a82a'];
  [-5.4, -1.9, 1.9, 5.4].forEach(function (bx, i) { for (z = 6; z < 22; z += 7.5) { var a = P(bx - 0.55, 12.5, z), b = P(bx + 0.55, 8.2, z), col = bcol[i]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo((a[0] + b[0]) / 2, b[1] - (b[0] - a[0]) * 0.35); c.lineTo(a[0], b[1]); c.closePath(); c.fillStyle = LG(c, a[0], 0, b[0], 0, [[0, dk(col, 0.35)], [0.5, col], [1, dk(col, 0.3)]]); c.fill(); rect(c, a[0] - 2, a[1] - 3, b[0] - a[0] + 4, 4, '#d8b050'); var em = (b[0] - a[0]) * 0.22; eli(c, (a[0] + b[0]) / 2, a[1] + (b[1] - a[1]) * 0.4, em, em, '#e8c860'); eli(c, (a[0] + b[0]) / 2, a[1] + (b[1] - a[1]) * 0.4, em * 0.6, em * 0.6, dk(col, 0.2)); } });
  // back wall: great arched window + dais + high table
  var gw0 = P(-2.4, 12, ZB), gw1 = P(2.4, 3.2, ZB);
  stainedGlass(c, R, 640, gw0[1], gw1[0] - gw0[0], gw1[1] - gw0[1], ['#3a5ab0', '#6a3aa0', '#2a7a8a', '#e8c060', '#4a8ad0', '#8a4ab0'], '#1a1020');
  box(c, P, -X, 0, ZB - 3, X, 0.6, ZB, '#4a3424', { top: '#6a4a34' });
  box(c, P, -4.5, 0.6, ZB - 2.2, 4.5, 1.4, ZB - 1.6, '#5a3a24', { top: '#8a6040' });
  for (k = 0; k < 7; k++) { var hp = P(-3.6 + k * 1.2, 1.4, ZB - 1.9); floatCandle(c, hp[0], hp[1] - 12, sc(P, ZB) * 0.03); }
  // long house tables with benches
  [-4.6, -1.6, 1.6, 4.6].forEach(function (tx) {
    box(c, P, tx - 0.9, 0, 5, tx - 0.55, 0.45, ZB - 4, '#3a2414', { top: '#5a3a22' }); box(c, P, tx + 0.55, 0, 5, tx + 0.9, 0.45, ZB - 4, '#3a2414', { top: '#5a3a22' });
    box(c, P, tx - 0.5, 0.72, 5, tx + 0.5, 0.8, ZB - 4, '#4a2e1a', { top: '#6a4428' });
    box(c, P, tx - 0.35, 0, 5.1, tx + 0.35, 0.72, 5.2, '#2a1a0e');
    for (z = 6; z < ZB - 4; z += 2.2) { var cp = P(tx, 0.8, z), cs = sc(P, z); rect(c, cp[0] - cs * 0.02, cp[1] - cs * 0.14, cs * 0.04, cs * 0.14, '#f4ead8'); lighter(c, function () { glow(c, cp[0], cp[1] - cs * 0.17, cs * 0.35, '#ffb050', 0.5); }); eli(c, cp[0] + cs * 0.2, cp[1] - cs * 0.01, cs * 0.08, cs * 0.025, '#d8b050'); }
  });
  // floating candles
  for (k = 0; k < 140; k++) { var fz = 2.5 + Math.pow(R(), 0.7) * 24, fx = (R() - 0.5) * 12, fy = 6.5 + R() * 5, fp = P(fx, fy, fz); floatCandle(c, fp[0], fp[1], sc(P, fz) * 0.013); }
  lighter(c, function () { glow(c, 640, 330, 640, '#ffa050', 0.16); });
  finish(c, { vig: 0.55, tint: '#ff9a50', ta: 0.18 });
});

def('academy_dorm', function (c, R) {
  var P = Cam(560, 640, 330, 1.3), X = 3.8, Y = 3.4, ZB = 6.5, k;
  shell(c, P, { x0: -X, x1: X, y1: Y, zb: ZB, zn: 0.3,
    ceil: [[0, '#2a1c16'], [1, '#5a3e2c']], left: [[0, '#5a4a40'], [1, '#8a7464']], right: [[0, '#5a4a40'], [1, '#8a7464']],
    floor: [[0, '#8a5a36'], [1, '#3a2414']], back: [[0, '#8a7666'], [1, '#6a5648']] });
  // stone texture
  alpha(c, 0.2, function () { for (var y = 0.3; y < Y; y += 0.3) { var off = (y * 10) % 2 ? 0.2 : 0; for (var z = 0.5 + off; z < ZB; z += 0.45) { var a = P(-X, y, z), b = P(-X, y + 0.28, z + 0.42); } l3(c, P, [-X, y, 0.3], [-X, y, ZB], '#2a1a14', 1); l3(c, P, [X, y, 0.3], [X, y, ZB], '#2a1a14', 1); var p0 = P(-X, y, ZB), p1 = P(X, y, ZB); line(c, p0[0], p0[1], p1[0], p1[1], '#2a1a14', 1); } });
  planks(c, P, -X, X, 0.3, ZB, 0.3, 'rgba(30,16,8,.35)');
  // beams
  [1.8, 4.2].forEach(function (z) { box(c, P, -X, Y - 0.28, z, X, Y, z + 0.28, '#3a2418'); });
  // round window
  var wc = P(0, 2.0, ZB), wr = sc(P, ZB) * 0.95;
  eli(c, wc[0], wc[1], wr + 14, wr + 14, '#5a4030');
  c.save(); c.beginPath(); c.arc(wc[0], wc[1], wr, 0, TAU); c.clip(); rect(c, wc[0] - wr, wc[1] - wr, wr * 2, wr * 2, V(c, wc[1] - wr, wc[1] + wr, [[0, '#0a0e30'], [1, '#3a3a7a']])); stars(c, R, 120, H); moon(c, wc[0] + wr * 0.4, wc[1] - wr * 0.35, wr * 0.16);
  c.fillStyle = '#10122a'; [[-0.7, 0.5, 0.12, 0.9], [-0.3, 0.6, 0.1, 0.5], [0.5, 0.45, 0.14, 1.0]].forEach(function (t) { var tx = wc[0] + t[0] * wr, ty = wc[1] + t[1] * wr, tw = t[2] * wr; rect(c, tx - tw / 2, ty - t[3] * wr * 0.5, tw, wr, '#10122a'); poly(c, [[tx - tw * 0.7, ty - t[3] * wr * 0.5], [tx + tw * 0.7, ty - t[3] * wr * 0.5], [tx, ty - t[3] * wr * 0.5 - tw * 1.6]], '#10122a'); lighter(c, function () { glow(c, tx, ty - t[3] * wr * 0.2, 5, '#ffcf70', 0.9); }); });
  c.restore();
  c.strokeStyle = '#4a3020'; c.lineWidth = 6; line(c, wc[0] - wr, wc[1], wc[0] + wr, wc[1], '#4a3020', 5); line(c, wc[0], wc[1] - wr, wc[0], wc[1] + wr, '#4a3020', 5); c.beginPath(); c.arc(wc[0], wc[1], wr * 0.5, 0, TAU); c.lineWidth = 3; c.stroke();
  lighter(c, function () { glow(c, wc[0], wc[1], wr * 2, '#6a8aff', 0.15); });
  // bookshelf on left wall
  box(c, P, -X, 0, 1.4, -X + 0.45, 2.6, 3.8, '#4a2e1c', { side: '#5a3a24' });
  for (var sy = 0.25; sy < 2.5; sy += 0.5) { var zz = 1.5; while (zz < 3.7) { var bw = 0.05 + R() * 0.06, bh = 0.28 + R() * 0.12; q3(c, P, [[-X + 0.45, sy, zz], [-X + 0.45, sy, zz + bw], [-X + 0.45, sy + bh, zz + bw], [-X + 0.45, sy + bh, zz]], pick(R, ['#7a2a2a', '#2a4a6a', '#2f5a3a', '#6a4a2a', '#a0703a', '#4a2a4a'])); zz += bw + 0.01; } l3(c, P, [-X + 0.45, sy - 0.02, 1.4], [-X + 0.45, sy - 0.02, 3.8], '#2a1a10', 3); }
  // desk + potions + candle (left, near window)
  box(c, P, -3.2, 0.72, 4.3, -1.6, 0.8, 5.6, '#6a4428', { top: '#8a5a34' }); [[-3.15, 4.35], [-1.7, 4.35], [-3.15, 5.5], [-1.7, 5.5]].forEach(function (l) { box(c, P, l[0], 0, l[1], l[0] + 0.07, 0.72, l[1] + 0.07, '#4a2e1c'); });
  [['#3aff9a', -2.3, 4.7], ['#c85aff', -2.05, 4.9], ['#ff5a7a', -1.85, 4.6]].forEach(function (pt) { var b = P(pt[1], 0.8, pt[2]), s = sc(P, pt[2]); eli(c, b[0], b[1] - s * 0.07, s * 0.06, s * 0.07, rgba(pt[0], 0.8)); rect(c, b[0] - s * 0.015, b[1] - s * 0.19, s * 0.03, s * 0.07, rgba(pt[0], 0.6)); lighter(c, function () { glow(c, b[0], b[1] - s * 0.07, s * 0.3, pt[0], 0.35); }); });
  var bk = P(-2.8, 0.8, 4.9), bs = sc(P, 4.9); poly(c, [[bk[0] - bs * 0.25, bk[1]], [bk[0] + bs * 0.25, bk[1]], [bk[0] + bs * 0.2, bk[1] - bs * 0.05], [bk[0] - bs * 0.2, bk[1] - bs * 0.05]], '#f0e4c8');
  var cd = P(-1.8, 0.8, 5.3), cs = sc(P, 5.3); rect(c, cd[0] - cs * 0.02, cd[1] - cs * 0.16, cs * 0.04, cs * 0.16, '#f4ead8'); lighter(c, function () { glow(c, cd[0], cd[1] - cs * 0.2, cs * 1.4, '#ffa040', 0.5); eli(c, cd[0], cd[1] - cs * 0.19, cs * 0.012, cs * 0.03, '#fff2b0'); });
  box(c, P, -3.4, 0.45, 3.7, -2.9, 0.5, 4.2, '#6a3a24'); box(c, P, -3.4, 0.5, 3.7, -3.35, 1.1, 4.2, '#6a3a24');
  // canopy bed (right)
  var bx0 = 1.2, bx1 = X - 0.05, bz0 = 3.0, bz1 = ZB - 0.05;
  [[bx0, bz0], [bx1 - 0.1, bz0], [bx0, bz1 - 0.1], [bx1 - 0.1, bz1 - 0.1]].forEach(function (p2) { box(c, P, p2[0], 0, p2[1], p2[0] + 0.1, 2.5, p2[1] + 0.1, '#4a2a1a'); });
  box(c, P, bx0, 0.2, bz0, bx1, 0.55, bz1, '#5a3420'); box(c, P, bx0 + 0.05, 0.55, bz0 + 0.02, bx1 - 0.05, 0.72, bz1 - 0.1, '#e8e0d0', { top: '#f4eee4' });
  q3(c, P, [[bx0 - 0.02, 0.74, bz0 - 0.02], [bx1, 0.74, bz0 - 0.02], [bx1, 0.74, bz1 - 1.1], [bx0 - 0.02, 0.74, bz1 - 1.1]], '#8a2a3a'); q3(c, P, [[bx0 - 0.02, 0.35, bz0 - 0.03], [bx1, 0.35, bz0 - 0.03], [bx1, 0.74, bz0 - 0.03], [bx0 - 0.02, 0.74, bz0 - 0.03]], '#6a1e2c');
  alpha(c, 0.4, function () { for (var qz = bz0 + 0.3; qz < bz1 - 1.1; qz += 0.3) l3(c, P, [bx0, 0.742, qz], [bx1, 0.742, qz], '#d8a040', 1); });
  var pw = P(bx0 + 0.3, 0.9, bz1 - 0.6), pw2 = P(bx1 - 0.3, 0.72, bz1 - 0.6); rr(c, pw[0], pw[1], pw2[0] - pw[0], pw2[1] - pw[1], 10, '#fbf6ee');
  box(c, P, bx0 - 0.05, 2.5, bz0 - 0.05, bx1 + 0.05, 2.7, bz1, '#6a1e2c');
  for (var f = 0; f < 4; f++) { var xa = bx0 - 0.05 + f * 0.13, xb = xa + 0.14; q3(c, P, [[xa, 2.5, bz0 - 0.06], [xb, 2.5, bz0 - 0.06], [xb + 0.02 - f * 0.05, 0.25, bz0 - 0.06], [xa - f * 0.05, 0.25, bz0 - 0.06]], LG(c, P(xa, 1, bz0)[0], 0, P(xb, 1, bz0)[0], 0, [[0, '#4a0e18'], [0.5, '#b8303e'], [1, '#4a0e18']])); }
  var tb = P(bx0 + 0.2, 1.1, bz0 - 0.07); eli(c, tb[0], tb[1], sc(P, bz0) * 0.2, sc(P, bz0) * 0.04, '#d8a040');
  // rug
  var rg = P(0, 0, 3), rs = sc(P, 3); c.save(); c.translate(rg[0] - 60, rg[1]); c.scale(1, 0.28); eli(c, 0, 0, rs * 1.3, rs * 1.3, '#6a2a3a'); eli(c, 0, 0, rs * 1.1, rs * 1.1, '#8a4a3a'); c.strokeStyle = '#d8a040'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, rs * 0.9, 0, TAU); c.stroke(); c.restore();
  // house banner on right wall
  q3(c, P, [[X - 0.01, 1.4, 1.4], [X - 0.01, 1.4, 2.4], [X - 0.01, 2.9, 2.4], [X - 0.01, 2.9, 1.4]], '#2a4aa8');
  // hanging lantern
  var hl = P(0.5, 2.6, 3.4); line(c, hl[0], P(0.5, Y, 3.4)[1], hl[0], hl[1], '#222', 1.5); lantern(c, hl[0], hl[1] + 16, 14, '#ffb050', 0.5);
  motes(c, R, 30, '#ffd090', 150, 600);
  finish(c, { vig: 0.55, tint: '#ff9a50', ta: 0.2 });
});

def('observatory', function (c, R) {
  var cx = 640, cy = 470, rx = 820, ry = 600, k;
  rect(c, 0, 0, W, H, '#06081a');
  // dome shell
  c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, PI, TAU); c.closePath(); c.clip();
  rect(c, 0, 0, W, cy, RG(c, cx, cy - 100, 900, [[0, '#2a2a4a'], [0.6, '#1a1a36'], [1, '#0a0a1a']]));
  // slit with sky
  var sw = 0.16;
  c.beginPath(); for (var t = 0; t <= 1.001; t += 0.05) { var th = t * PI / 2, x = cx + rx * Math.sin(-sw) * Math.cos(th), y = cy - ry * Math.sin(th); if (t) c.lineTo(x, y); else c.moveTo(x, y); } for (t = 1; t >= -0.001; t -= 0.05) { th = t * PI / 2; c.lineTo(cx + rx * Math.sin(sw) * Math.cos(th), cy - ry * Math.sin(th)); } c.closePath();
  c.save(); c.clip(); rect(c, 0, 0, W, cy, V(c, 0, cy, [[0, '#050618'], [1, '#1a1a4a']])); alpha(c, 0.55, function () { for (k = 0; k < 20; k++) puff(c, cx + (R() - 0.5) * 160, R() * cy, 60 + R() * 40, pick(R, ['#6a5ab0', '#4a6ab8', '#a07ac8']), 0.35); }); stars(c, R, 260, cy); c.restore();
  // ribs
  for (k = -9; k <= 9; k++) { var ph = k * 0.17; if (Math.abs(ph) < sw + 0.02 && k !== 0) continue; if (k === 0) continue; c.beginPath(); for (t = 0; t <= 1.001; t += 0.05) { th = t * PI / 2; x = cx + rx * Math.sin(ph) * Math.cos(th); y = cy - ry * Math.sin(th); if (t) c.lineTo(x, y); else c.moveTo(x, y); } c.strokeStyle = '#3a3a5a'; c.lineWidth = 5; c.stroke(); c.strokeStyle = 'rgba(160,140,200,.2)'; c.lineWidth = 1.5; c.stroke(); }
  [0.3, 0.6].forEach(function (lv) { c.beginPath(); c.ellipse(cx, cy - ry * lv, rx * Math.cos(Math.asin(lv)), 40 * (1 - lv), 0, PI, TAU); c.strokeStyle = '#3a3a5a'; c.lineWidth = 4; c.stroke(); });
  [-sw, sw].forEach(function (ph) { c.beginPath(); for (t = 0; t <= 1.001; t += 0.05) { th = t * PI / 2; x = cx + rx * Math.sin(ph) * Math.cos(th); y = cy - ry * Math.sin(th); if (t) c.lineTo(x, y); else c.moveTo(x, y); } c.strokeStyle = '#5a5070'; c.lineWidth = 8; c.stroke(); });
  c.restore();
  // moonlight through the slit
  shaft(c, [[cx - 80, 0], [cx + 80, 0], [cx + 200, H], [cx - 200, H]], '#9ab0ff', 0.12);
  // cylindrical wall band with star charts & shelves
  rect(c, 0, cy - 10, W, 150, V(c, cy - 10, cy + 140, [[0, '#3a2a2a'], [1, '#241818']]));
  rect(c, 0, cy - 14, W, 8, '#8a6a3a');
  for (k = 0; k < 7; k++) { var fx = 40 + k * 180 + (k > 2 ? 60 : 0); if (k === 3) continue; rect(c, fx, cy + 10, 120, 100, '#1a1a36'); rect(c, fx + 4, cy + 14, 112, 92, '#b8ac90'); c.strokeStyle = 'rgba(40,40,90,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(fx + 60, cy + 60, 38, 0, TAU); c.stroke(); for (var j = 0; j < 14; j++) eli(c, fx + 20 + R() * 80, cy + 22 + R() * 76, 1.4, 1.4, '#2a2a5a'); line(c, fx + 30, cy + 40, fx + 70, cy + 70, 'rgba(40,40,90,.6)', 1); line(c, fx + 70, cy + 70, fx + 95, cy + 50, 'rgba(40,40,90,.6)', 1); }
  // floor
  rect(c, 0, cy + 140, W, H - cy - 140, V(c, cy + 140, H, [[0, '#4a3020'], [1, '#2a1a10']]));
  alpha(c, 0.3, function () { for (k = -12; k <= 12; k++) line(c, cx + k * 20, cy + 140, cx + k * 140, H, '#1a0e08', 1.5); });
  c.beginPath(); c.ellipse(cx, cy + 250, 330, 70, 0, 0, TAU); c.strokeStyle = '#c8a050'; c.lineWidth = 3; c.stroke();
  for (k = 0; k < 12; k++) { var a = k / 12 * TAU; eli(c, cx + Math.cos(a) * 330, cy + 250 + Math.sin(a) * 70, 5, 3, '#e8c060'); }
  // railing (balcony) along the wall
  rect(c, 0, cy + 118, W, 6, '#8a6a3a'); for (k = 0; k < 40; k++) rect(c, k * 33, cy + 124, 4, 22, '#6a4a2a');
  // telescope
  var bx = 690, by = cy + 250;
  poly(c, [[bx - 90, by + 30], [bx + 90, by + 30], [bx + 40, by - 50], [bx - 40, by - 50]], V(c, by - 50, by + 30, [[0, '#6a5030'], [1, '#2a1a10']]));
  rect(c, bx - 18, by - 180, 36, 140, LG(c, bx - 18, 0, bx + 18, 0, [[0, '#5a4020'], [0.5, '#b89048'], [1, '#4a3018']]));
  eli(c, bx, by - 190, 44, 30, '#8a6a30');
  c.save(); c.translate(bx, by - 200); c.rotate(-1.18);
  rect(c, -40, -34, 520, 68, LG(c, 0, -34, 0, 34, [[0, '#6a4a18'], [0.3, '#f0d080'], [0.6, '#c89a40'], [1, '#5a3a14']]));
  rect(c, 400, -44, 70, 88, LG(c, 0, -44, 0, 44, [[0, '#6a4a18'], [0.3, '#f8e0a0'], [1, '#5a3a14']]));
  rect(c, -80, -24, 50, 48, LG(c, 0, -24, 0, 24, [[0, '#4a3010'], [0.4, '#d8b060'], [1, '#3a2408']]));
  [60, 200, 330].forEach(function (x2) { rect(c, x2, -38, 14, 76, '#8a6420'); });
  rect(c, -40, -70, 200, 20, LG(c, 0, -70, 0, -50, [[0, '#8a6a30'], [1, '#4a3418']]));
  c.restore();
  lighter(c, function () { glow(c, 890, 20, 80, '#cfe0ff', 0.3); });
  // desk lamp + books (left)
  poly(c, [[80, 600], [360, 600], [390, 640], [50, 640]], '#5a3a22'); rect(c, 50, 640, 340, 80, '#3a2414');
  rect(c, 110, 560, 60, 40, '#8a2a2a'); rect(c, 120, 545, 50, 15, '#2a4a6a'); poly(c, [[200, 598], [300, 590], [310, 598], [210, 604]], '#efe4c8');
  var lp = [330, 540]; line(c, lp[0], 600, lp[0] - 10, lp[1], '#2a2a22', 3); poly(c, [[lp[0] - 36, lp[1] + 4], [lp[0] + 16, lp[1] + 4], [lp[0] + 4, lp[1] - 20], [lp[0] - 24, lp[1] - 20]], '#2a4a3a');
  lighter(c, function () { glow(c, lp[0] - 10, lp[1] + 20, 260, '#ffb060', 0.45); });
  // orrery on the right
  var ox = 1080, oy = 560; line(c, ox, oy + 60, ox, oy, '#8a6a30', 3); eli(c, ox, oy + 62, 30, 8, '#6a4a20');
  [60, 42, 26].forEach(function (r0, i) { c.beginPath(); c.ellipse(ox, oy, r0, r0 * 0.35, -0.2, 0, TAU); c.strokeStyle = '#c8a050'; c.lineWidth = 1.5; c.stroke(); eli(c, ox + Math.cos(i * 2) * r0, oy + Math.sin(i * 2) * r0 * 0.35, 5 - i, 5 - i, ['#6ab0ff', '#ff8a5a', '#c8e0a0'][i]); });
  eli(c, ox, oy, 11, 11, RG(c, ox - 3, oy - 3, 14, [[0, '#fff0a0'], [1, '#e8a030']])); lighter(c, function () { glow(c, ox, oy, 60, '#ffc050', 0.35); });
  motes(c, R, 40, '#c8d8ff', 50, 650, 500, 800);
  finish(c, { vig: 0.55, tint: '#5060c0', ta: 0.2 });
});

ART.MODERN_IDS = IDS.slice();
})();
