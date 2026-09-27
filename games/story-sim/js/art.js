/* 운명극장 — art module (global ART).
 * ART.portrait(look, emo, opts) → SVG markup (viewBox 0 0 400 600, transparent, bust to waist)
 * ART.bg(id)                    → PNG data URL of a painted 1280×720 background (cached per id)
 * ART.bgGradient(id)            → CSS gradient placeholder for the same scene
 * ART.BG_IDS, ART.EMOTIONS
 * Classic script, no DOM access at load time. */
(function (root) {
'use strict';

/* ------------------------------------------------------------------ utils */
var UID = 0, PI = Math.PI;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function h2r(h) {
  h = String(h || '').trim().replace('#', '');
  if (h.length === 3) h = h.replace(/./g, '$&$&');
  if (!/^[0-9a-fA-F]{6}$/.test(h.slice(0, 6))) return [136, 136, 136];
  var v = parseInt(h.slice(0, 6), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function r2h(c) {
  return '#' + c.map(function (v) { v = clamp(Math.round(v), 0, 255); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
}
function mix(a, b, t) { var A = h2r(a), B = h2r(b); return r2h([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); }
function dk(c, t) { return mix(c, '#1d1228', t); }
function lt(c, t) { return mix(c, '#ffffff', t); }
function lum(c) { var r = h2r(c); return (0.299 * r[0] + 0.587 * r[1] + 0.114 * r[2]) / 255; }
function rgba(c, a) { var r = h2r(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + a + ')'; }
function n(v) { return Math.round(v * 10) / 10; }
/* tagged template: rounds interpolated numbers */
function p(s) { var o = s[0]; for (var i = 1; i < arguments.length; i++) { var v = arguments[i]; o += (typeof v === 'number' ? n(v) : v) + s[i]; } return o; }
function pa(d, f, s, w, x) {
  return '<path d="' + d + '" fill="' + (f || 'none') + '"' +
    (s ? ' stroke="' + s + '" stroke-width="' + n(w || 1) + '" stroke-linecap="round" stroke-linejoin="round"' : '') + (x ? ' ' + x : '') + '/>';
}
function ell(cx, cy, rx, ry, f, x) { return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(Math.max(0, rx)) + '" ry="' + n(Math.max(0, ry)) + '" fill="' + f + '"' + (x ? ' ' + x : '') + '/>'; }
function circ(cx, cy, r, f, x) { return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(Math.max(0, r)) + '" fill="' + f + '"' + (x ? ' ' + x : '') + '/>'; }
function g(inner, x) { return inner ? '<g' + (x ? ' ' + x : '') + '>' + inner + '</g>' : ''; }
function op(v) { return 'opacity="' + v + '"'; }
function stk(c, w) { return 'stroke="' + c + '" stroke-width="' + n(w) + '"'; }
function cb(a, b, c, d, t) { var u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; }
function qb(a, b, c, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; }

function Defs() { this.id = 'art' + (++UID) + '_'; this.list = []; this.k = 0; }
Defs.prototype.stops = function (st) {
  return st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('');
};
Defs.prototype.lg = function (x1, y1, x2, y2, st, user) {
  var id = this.id + (this.k++);
  this.list.push('<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (user ? ' gradientUnits="userSpaceOnUse"' : '') + '>' + this.stops(st) + '</linearGradient>');
  return 'url(#' + id + ')';
};
Defs.prototype.rg = function (cx, cy, r, st, user, fx, fy) {
  var id = this.id + (this.k++);
  this.list.push('<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + (fx != null ? ' fx="' + fx + '" fy="' + fy + '"' : '') + (user ? ' gradientUnits="userSpaceOnUse"' : '') + '>' + this.stops(st) + '</radialGradient>');
  return 'url(#' + id + ')';
};
Defs.prototype.clip = function (inner) {
  var id = this.id + (this.k++);
  this.list.push('<clipPath id="' + id + '">' + inner + '</clipPath>');
  return 'url(#' + id + ')';
};
Defs.prototype.out = function () { return '<defs>' + this.list.join('') + '</defs>'; };

/* ------------------------------------------------------------ proportions */
var GEO = {
  f: { child: { hs: 1.07, hy: 214, S: 340, sh: 90, wh: 76, nw: 16 },
       teen: { hs: 1, hy: 190, S: 330, sh: 106, wh: 72, nw: 17 },
       adult: { hs: 0.95, hy: 178, S: 322, sh: 114, wh: 78, nw: 18 },
       elder: { hs: 0.94, hy: 182, S: 324, sh: 118, wh: 90, nw: 19 } },
  m: { child: { hs: 1.06, hy: 212, S: 340, sh: 96, wh: 82, nw: 18 },
       teen: { hs: 0.99, hy: 182, S: 328, sh: 126, wh: 96, nw: 22 },
       adult: { hs: 0.96, hy: 170, S: 318, sh: 146, wh: 112, nw: 26 },
       elder: { hs: 0.95, hy: 176, S: 322, sh: 140, wh: 116, nw: 25 } }
};
var EYE = {
  f: { child: { x: 31, y: 22, w: 45, h: 56 }, teen: { x: 31, y: 16, w: 44, h: 51 }, adult: { x: 31, y: 14, w: 43, h: 45 }, elder: { x: 31, y: 13, w: 39, h: 33 } },
  m: { child: { x: 31, y: 22, w: 43, h: 48 }, teen: { x: 32, y: 13, w: 43, h: 37 }, adult: { x: 32, y: 11, w: 43, h: 32 }, elder: { x: 32, y: 11, w: 40, h: 27 } }
};
var ESHAPE = {
  round: { hm: 1.06, tilt: 0.02, is: 1, peak: 0.45 },
  sharp: { hm: 0.8, tilt: -0.17, is: 0.9, peak: 0.62 },
  gentle: { hm: 0.95, tilt: 0.1, is: 1, peak: 0.5 },
  droopy: { hm: 0.9, tilt: 0.25, is: 1, peak: 0.4 }
};
var EMO = {
  neutral: { op: 1, low: 1, iris: 1, bi: 0, bo: 0, ba: 0, mouth: 'neutral', blush: 0 },
  smile: { op: 0.88, low: 0.72, iris: 1, bi: -2, bo: 0, ba: 1, mouth: 'smile', blush: 0.3 },
  laugh: { closed: 1, bi: -4, bo: -1, ba: 2, mouth: 'laugh', blush: 0.45 },
  sad: { op: 0.8, low: 0.95, iris: 1, bi: -8, bo: 4, ba: -2, mouth: 'sad', blush: 0.12, tear: 1, ly: 2, wet: 1 },
  cry: { op: 0.7, low: 0.88, iris: 1, bi: -9, bo: 5, ba: -2, mouth: 'cry', blush: 0.55, tears: 1, ly: 2, wet: 1 },
  angry: { op: 0.76, low: 0.95, iris: 0.9, bi: 9, bo: -3, ba: -3, flat: 1, mouth: 'angry', blush: 0.15, vein: 1, pupil: 0.7 },
  surprised: { op: 1.12, low: 1.06, iris: 0.76, bi: -10, bo: -8, ba: 3, mouth: 'surprised', blush: 0.05, sweat: 1, pupil: 0.55, marks: 1 },
  shy: { op: 0.84, low: 0.82, iris: 1, bi: -5, bo: 2, ba: 0, mouth: 'shy', blush: 1, hatch: 1, lx: 0.55, ly: 2, wet: 1 },
  smirk: { op: 0.8, low: 0.9, iris: 1, bi: 0, bo: 0, ba: 0, mouth: 'smirk', blush: 0, asym: 1 },
  cold: { op: 0.6, low: 1, iris: 0.92, bi: 3, bo: -1, ba: -3, flat: 0.6, mouth: 'cold', blush: 0, dim: 1 },
  worried: { op: 0.9, low: 1, iris: 0.95, bi: -8, bo: 3, ba: -1, mouth: 'worried', blush: 0.12, sweat: 1, lx: -0.3 },
  tired: { op: 0.48, low: 1, iris: 1, bi: 2, bo: 5, ba: -1, mouth: 'tired', blush: 0, bags: 1, gloom: 1, dim: 1 }
};
var EMOTIONS = ['neutral', 'smile', 'laugh', 'sad', 'cry', 'angry', 'surprised', 'shy', 'smirk', 'cold', 'worried', 'tired'];

var OUTDEF = { gown: '#c86a8e', uniform: '#27324f', suit: '#2a2b36', school: '#26345c', stage: '#7a4fd0', robe: '#4a3a7a', armor: '#9aa3b5',
  casual: '#d9c3a8', maid: '#23202a', dress_child: '#f2a8b8', coat: '#3a2a3e', hanbok: '#f6d7e2', tracksuit: '#2f5fb0', priest: '#f1ece2',
  martial: '#2e3a4a', hanfu: '#9ec4c8', royal: '#b3202e', office: '#8a7a9a' };
var ACCDEF = { gown: '#fff4dc', uniform: '#dcb65a', suit: '#8c2436', school: '#d0374a', stage: '#ffd36e', robe: '#dcb65a', armor: '#dcb65a',
  casual: '#f4f0e6', maid: '#b8263c', dress_child: '#ffffff', coat: '#d8b25a', hanbok: '#c83a5a', tracksuit: '#ffffff', priest: '#d7b25a',
  martial: '#c0392b', hanfu: '#d8a040', royal: '#e0b040', office: '#3a4a7a' };

/* ------------------------------------------------------------ head parts */
var FACE = {
  f: 'M-66,-58 C-67,0 -63,32 -51,56 C-38,80 -17,95 0,97 C17,95 38,80 51,56 C63,32 67,0 66,-58 C66,-124 -66,-124 -66,-58Z',
  m: 'M-67,-58 C-68,6 -66,40 -57,62 C-48,80 -31,93 -16,99 Q0,104 16,99 C31,93 48,80 57,62 C66,40 68,6 67,-58 C67,-126 -67,-126 -67,-58Z',
  c: 'M-68,-58 C-71,6 -67,44 -50,66 C-36,82 -17,90 0,90 C17,90 36,82 50,66 C67,44 71,6 68,-58 C68,-126 -68,-126 -68,-58Z'
};
var CHIN = { f: 97, m: 102, c: 90 };

function eyeSvg(D, s, E, em, c) {
  /* returns {o: eye as drawn for the emotion, c: closed-eye lids for blinking, x: extras outside the blink groups} */
  var cx = s * E.x, cy = E.y, w = E.w, h = E.h;
  var inn = [cx - s * w * 0.47, cy + h * 0.12], out = [cx + s * w * 0.53, cy + h * (0.02 + E.tilt)];
  var o = '', x = '', cl0 = '';
  /* closed lids (blink): a relaxed downward curve along the lower half of the eye, lashes for girls */
  var ca = [inn[0] + s * 1, inn[1] + h * 0.1], cz = [out[0], out[1] + h * 0.14], cc = [cx + s * w * 0.04, cy + h * 0.44];
  cl0 += pa(p`M${ca[0]},${ca[1]} Q${cc[0]},${cc[1]} ${cz[0]},${cz[1]}`, 'none', c.lash, c.f ? 3.8 : 3.2);
  cl0 += pa(p`M${cz[0] - s * 3},${cz[1] + 0.5} Q${cz[0] + s * 4},${cz[1] - 0.5} ${cz[0] + s * (c.f ? 9 : 6)},${cz[1] - (c.f ? 5 : 3)}`, 'none', c.lash, c.f ? 2.6 : 2.2);
  cl0 += pa(p`M${ca[0] + s * w * 0.12},${cy - h * 0.06} Q${cx + s * w * 0.06},${cy + h * 0.1} ${cz[0] - s * w * 0.1},${cz[1] - h * 0.18}`, 'none', c.lash, 1.1, op(0.28));
  if (c.f) [0.55, 0.72, 0.88].forEach(function (t, k) {
    var q = qb(ca, cc, cz, t);
    cl0 += pa(p`M${q[0]},${q[1]} l${s * (1.5 + k)},${4 + k * 0.6}`, 'none', c.lash, 1.5 - k * 0.15);
  });
  if (em.closed) {
    var d = p`M${inn[0]},${inn[1] + 3} Q${cx + s * w * 0.05},${cy - h * 0.36} ${out[0]},${out[1] + 3}`;
    o += pa(d, 'none', c.lash, c.f ? 4 : 3.4);
    o += pa(p`M${out[0] - s * 2},${out[1] + 1} Q${out[0] + s * 6},${out[1] - 1} ${out[0] + s * 9},${out[1] - 5}`, 'none', c.lash, 2.4);
    o += pa(p`M${inn[0] + s * w * 0.2},${cy + h * 0.28} Q${cx},${cy + h * 0.36} ${out[0] - s * w * 0.18},${cy + h * 0.24}`, 'none', c.lash, 1.1, op(0.35));
    return { o: o, c: '', x: '' };
  }
  var opn = em.op * (em.asym && s > 0 ? 0.78 : 1);
  var topY = cy + h * 0.1 - h * 0.66 * opn;
  var fl = em.flat || 0, pk = E.peak;
  var c1 = [inn[0] + s * w * 0.12, topY + h * 0.04 + fl * h * 0.26];
  var c2 = [cx + s * w * (pk - 0.2), topY - h * 0.06 + fl * h * 0.04];
  var lowY = cy + h * 0.5 * em.low;
  var up = p`M${inn[0]},${inn[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${out[0]},${out[1]}`;
  var scl = up + p` C${cx + s * w * 0.3},${lowY} ${cx - s * w * 0.18},${lowY + h * 0.02} ${inn[0]},${inn[1]}Z`;
  var cl = D.clip('<path d="' + scl + '"/>');
  var ir = (em.iris || 1) * E.is, rx = w * 0.32 * ir, ry = h * 0.5 * ir;
  var ix = cx + (em.lx || 0) * w * 0.16, iy = cy + h * 0.1 + (em.ly || 0);
  var pu = em.pupil || 1;
  var ig = c.ig;
  var inner = pa(scl, '#fdf9f8') +
    pa(up, 'none', c.skinSh, h * 0.3, op(0.35)) +
    ell(ix, iy, rx, ry, ig, stk(dk(c.eye, 0.62), 1.3)) +
    ell(ix, iy - ry * 0.42, rx * 0.95, ry * 0.46, dk(c.eye, 0.55), op(0.4)) +
    ell(ix, iy + ry * 0.06, rx * 0.44 * pu, ry * 0.5 * pu, dk(c.eye, 0.82)) +
    ell(ix, iy + ry * 0.56, rx * 0.64, ry * 0.26, lt(c.eye, 0.55), op(0.6)) +
    pa([0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { var a = k * PI / 4 + 0.3; return p`M${ix + Math.cos(a) * rx * 0.5},${iy + ry * 0.06 + Math.sin(a) * ry * 0.52} L${ix + Math.cos(a) * rx * 0.88},${iy + ry * 0.06 + Math.sin(a) * ry * 0.9}`; }).join(' '), 'none', lt(c.eye, 0.5), 1, op(0.35)) +
    pa(up, 'none', dk(c.eye, 0.4), 2.5, op(0.35));
  if (em.dim) inner += ell(ix - rx * 0.4, iy - ry * 0.34, rx * 0.2, ry * 0.12, '#fff', op(0.65));
  else inner += ell(ix - rx * 0.38, iy - ry * 0.3, rx * 0.34, ry * 0.25, '#fff') + circ(ix + rx * 0.42, iy + ry * 0.32, rx * 0.15, '#fff', op(0.95));
  if (em.wet) inner += circ(ix + rx * 0.1, iy - ry * 0.52, rx * 0.12, '#fff', op(0.9)) + ell(ix - rx * 0.1, iy + ry * 0.5, rx * 0.5, ry * 0.1, '#fff', op(0.7)) +
    pa(p`M${inn[0]},${lowY - 1} C${cx - s * w * 0.1},${lowY + 1} ${cx + s * w * 0.3},${lowY} ${out[0]},${out[1] + 2}`, 'none', '#e6f6ff', 3.2, op(0.75));
  o += g(inner, 'clip-path="' + cl + '"');
  var th = c.f ? 6.2 : 4.6;
  o += pa(up + p` L${out[0] - s * 1.5},${out[1] + th * 0.55} C${c2[0]},${c2[1] + th} ${c1[0]},${c1[1] + th * 0.45} ${inn[0] + s * 1},${inn[1] + 1.2}Z`, c.lash, c.lash, 1.1);
  o += pa(p`M${out[0] - s * 4},${out[1] - 1.5} Q${out[0] + s * 5},${out[1] - 2} ${out[0] + s * (c.f ? 10 : 6)},${out[1] - (c.f ? 7 : 3)} Q${out[0] + s * 4},${out[1] + 3} ${out[0] - s * 2},${out[1] + 3.5}Z`, c.lash);
  if (c.f) {
    [0.62, 0.8].forEach(function (t, k) {
      var q = cb(inn, c1, c2, out, t);
      o += pa(p`M${q[0] - s * 2},${q[1] + 1} L${q[0] + s * (5 + k * 2)},${q[1] - 6 - k * 1.5} L${q[0] + s * 2.5},${q[1] + 1}Z`, c.lash);
    });
  }
  if (opn > 0.45) o += pa(p`M${cx - s * w * 0.02},${topY - 2} Q${cx + s * w * 0.26},${topY - 3.5} ${out[0] - s * w * 0.1},${out[1] - h * 0.2}`, 'none', c.lash, 1.1, op(0.3));
  o += pa(p`M${out[0] - s * w * 0.04},${out[1] + 2.5} C${cx + s * w * 0.28},${lowY + 0.5} ${cx + s * w * 0.1},${lowY + 1.2} ${cx - s * w * 0.06},${lowY + 0.5}`, 'none', c.lash, 1.3, op(0.55));
  if (em.bags) x += pa(p`M${cx - s * w * 0.28},${lowY + 5} Q${cx + s * w * 0.05},${lowY + 10} ${cx + s * w * 0.38},${lowY + 4}`, 'none', '#7a5a8a', 1.4, op(0.45));
  if (c.elder) x += pa(p`M${out[0] + s * 3},${out[1] + 3} l${s * 7},${2} M${out[0] + s * 2},${out[1] + 8} l${s * 6},${4}`, 'none', c.skinLine, 1, op(0.4));
  return { o: o, c: cl0, x: x };
}

function browSvg(s, E, em, c, m) {
  var bx = s * E.x, by = E.y - E.h * 0.55 - (m ? 9 : 14);
  var bi = em.bi + (em.asym && s < 0 ? -5 : 0), bo = em.bo + (em.asym && s < 0 ? -3 : 0);
  var ix = bx - s * E.w * 0.4, iy = by + bi + 3;
  var ox = bx + s * E.w * 0.62, oy = by + bo + (m ? 3 : 5);
  var mx = (ix + ox) / 2 + s * 3, my = (iy + oy) / 2 - (m ? 4 : 6) - em.ba;
  var t = m ? 6 : 3.4;
  return pa(p`M${ix},${iy - t * 0.55} Q${mx},${my - t * 0.7} ${ox},${oy} Q${mx},${my + t * 0.5} ${ix - s * 0.5},${iy + t * 0.55}Z`, c.brow, c.brow, 0.8);
}

function mouthSvg(kind, my, c) {
  var L = c.mouthLine, dark = '#7a2632', o = '';
  switch (kind) {
    case 'smile': o = pa(p`M-12,${my - 2.5} Q0,${my + 6} 12,${my - 2.5}`, 'none', L, 1.9) + pa(p`M-6,${my + 5} Q0,${my + 7} 6,${my + 5}`, 'none', L, 1, op(0.3)); break;
    case 'laugh':
      o = pa(p`M-15,${my - 3} Q0,${my + 1} 15,${my - 3} Q13,${my + 19} 0,${my + 20} Q-13,${my + 19} -15,${my - 3}Z`, dark, L, 1.6) +
        ell(0, my + 14.5, 8.5, 5, '#e7737e') +
        pa(p`M-13,${my - 1.5} Q0,${my + 2} 13,${my - 1.5} L12,${my + 2.5} Q0,${my + 5.5} -12,${my + 2.5}Z`, '#fff');
      break;
    case 'surprised': o = ell(0, my + 4, 6.5, 8.5, dark, stk(L, 1.5)) + ell(0, my + 8.5, 4, 3, '#e7737e'); break;
    case 'cry':
      o = pa(p`M-11,${my + 3} Q-5,${my - 3} 0,${my} Q5,${my - 3} 11,${my + 3} Q7,${my + 13} 0,${my + 12} Q-7,${my + 13} -11,${my + 3}Z`, dark, L, 1.5) +
        ell(0, my + 9.5, 5, 2.5, '#e7737e');
      break;
    case 'sad': o = pa(p`M-9,${my + 3} Q0,${my - 3} 9,${my + 3}`, 'none', L, 1.7); break;
    case 'angry':
      o = pa(p`M-12,${my + 4} Q0,${my - 5} 12,${my + 4} L10,${my + 9} Q0,${my + 5} -10,${my + 9}Z`, dark, L, 1.6) +
        pa(p`M-10,${my + 2.5} Q0,${my - 3} 10,${my + 2.5} L9,${my + 5} Q0,${my} -9,${my + 5}Z`, '#fff');
      break;
    case 'shy': o = pa(p`M-9,${my} Q-4.5,${my - 3} 0,${my} Q4.5,${my + 3} 9,${my}`, 'none', L, 1.7); break;
    case 'smirk': o = pa(p`M-9,${my + 1} Q3,${my + 3} 12,${my - 5}`, 'none', L, 1.9) + pa(p`M10,${my - 6} l3,${2}`, 'none', L, 1.2, op(0.6)); break;
    case 'cold': o = pa(p`M-7,${my} Q0,${my + 0.8} 7,${my}`, 'none', L, 1.6); break;
    case 'worried': o = pa(p`M-9,${my + 2} Q-4,${my - 2} 0,${my + 1} Q4,${my + 3} 9,${my}`, 'none', L, 1.6); break;
    case 'tired': o = ell(0, my + 2, 4.5, 2.4, dark, op(0.85)) + pa(p`M-7,${my} Q0,${my - 1.5} 7,${my}`, 'none', L, 1.2); break;
    default: o = pa(p`M-8,${my} Q0,${my + 2} 8,${my}`, 'none', L, 1.7);
  }
  return o;
}
/* open "talking" mouth (animation hook .mo) — sized per age/sex, corners follow the emotion */
function talkMouth(kind, my, c, m, age) {
  var w = m ? 10 : 8.4, h = m ? 10.5 : 11.5;
  if (age === 'child') { w = 8; h = 11.5; } else if (age === 'elder') { w *= 0.92; h *= 0.85; } else if (age === 'teen') { w *= 0.95; }
  var up = { smile: 1, laugh: 1.2, smirk: 0.6, shy: 0.5, sad: -1, cry: -1.2, worried: -0.7, tired: -0.4, angry: -0.5 }[kind] || 0;
  if (kind === 'laugh') { w *= 1.15; h *= 0.8; }
  if (kind === 'surprised') { w *= 0.8; h *= 1.2; }
  if (kind === 'angry') { w *= 1.2; h *= 0.8; }
  if (kind === 'tired' || kind === 'cold') { w *= 0.8; h *= 0.6; }
  var y0 = my - 0.5, cy = y0 - up * 2.2, tx = kind === 'smirk' ? 2 : 0;
  var d = p`M${tx - w},${cy} Q${tx},${y0 - 2.2 + up * 0.6} ${tx + w},${cy} C${tx + w * 0.95},${y0 + h * 1.12} ${tx - w * 0.95},${y0 + h * 1.12} ${tx - w},${cy}Z`;
  var o = pa(d, '#6a1a28', c.mouthLine, 1.4);
  o += ell(tx, y0 + h * 0.64, w * 0.5, h * 0.2, '#e0707c');
  if (age !== 'child' || kind === 'angry' || kind === 'laugh') o += pa(p`M${tx - w * 0.72},${cy + 0.9 + up * 0.3} Q${tx},${y0 - 0.2} ${tx + w * 0.72},${cy + 0.9 + up * 0.3} L${tx + w * 0.62},${cy + 2.4} Q${tx},${y0 + 2} ${tx - w * 0.62},${cy + 2.4}Z`, '#fbf6f4');
  o += pa(p`M${tx - w * 0.4},${y0 + h * 1.08} Q${tx},${y0 + h * 1.22} ${tx + w * 0.4},${y0 + h * 1.08}`, 'none', c.mouthLine, 1, op(0.3));
  return o;
}

/* --------------------------------------------------------------- hair */
function fringe(b, m) {
  if (b === 'none') return 'C58,-72 30,-90 4,-86 Q0,-80 -4,-86 C-30,-90 -58,-72 -62,-40';
  if (b === 'parted') return 'C62,-14 58,-2 55,-8 C54,-30 46,-40 38,-46 Q42,-34 36,-26 C30,-52 18,-80 5,-100 Q0,-106 -5,-100 C-18,-80 -30,-52 -36,-26 Q-42,-34 -38,-46 C-46,-40 -54,-30 -55,-8 C-58,-2 -62,-14 -62,-40';
  var N = m ? 6 : 7, o = '', i;
  if (b === 'side') {
    N = m ? 4 : 5;
    for (i = 0; i < N; i++) {
      var t0 = i / (N - 1), tx = 56 - 92 * t0, ty = (m ? -16 : -4) - 40 * t0 + (i % 2 ? 5 : 0), sw2 = 92 / (N - 1);
      o += p`Q${tx + 6},${ty - 18} ${tx},${ty} Q${tx - sw2 * 0.45},${ty - 14} ${tx - sw2 * 0.8},${ty - 34} `;
    }
    return o + 'Q-54,-60 -62,-40';
  }
  for (i = 0; i < N; i++) {
    var xr = 62 - 124 * i / N, xl = 62 - 124 * (i + 1) / N, xm = (xr + xl) / 2, t = i / (N - 1);
    var tipY, sw, dep;
    if (b === 'side') { tipY = -8 - 50 * t + (i % 2 ? -4 : 3); sw = 7; dep = 24; }
    else { tipY = (i === 0 || i === N - 1) ? -16 : -30 + (i % 2 ? -3 : 3) + (m ? -4 : 0); sw = xm > 0 ? 2 : -2; dep = 24; }
    var valY = tipY - dep;
    o += p`Q${xr - 1},${tipY - 10} ${xm + sw},${tipY} Q${xl + 4},${tipY - 13} ${xl},${i === N - 1 ? -40 : valY} `;
  }
  return o;
}
function capTop(top, amt) {
  var A = [[-80, -18], [-86, -92], [-48, -136 + top], [0, -136 + top]], B = [[0, -136 + top], [48, -136 + top], [86, -92], [80, -18]];
  var pts = sample(function (t) { return cb(A[0], A[1], A[2], A[3], t); }, 6).concat(sample(function (t) { return cb(B[0], B[1], B[2], B[3], t); }, 6).slice(1));
  var d = p`M${pts[0][0]},${pts[0][1]} `, i;
  for (i = 1; i < pts.length; i++) {
    var a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = mx, dy = my + 30, l = Math.hypot(dx, dy) || 1;
    d += p`Q${mx + dx / l * amt},${my + dy / l * amt} ${b[0]},${b[1]} `;
  }
  return d;
}
function capPath(b, m, top, amt) { return capTop(top || 0, amt || 4) + 'L62,-40 ' + fringe(b, m) + ' L-80,-18Z'; }
function capLine(b, m, top, amt) { return capTop(top || 0, amt || 4) + 'M62,-40 ' + fringe(b, m); }
function lockPath(kind, s) {
  switch (kind) {
    case 'long': return p`M${s * 56},-62 C${s * 84},-42 ${s * 88},30 ${s * 85},80 C${s * 83},104 ${s * 80},120 ${s * 73},138 C${s * 70},114 ${s * 64},98 ${s * 62},72 C${s * 60},40 ${s * 58},0 ${s * 52},-40Z`;
    case 'wavy': return p`M${s * 56},-62 C${s * 92},-32 ${s * 74},16 ${s * 88},58 C${s * 98},90 ${s * 78},112 ${s * 86},140 C${s * 70},124 ${s * 74},100 ${s * 67},82 C${s * 58},52 ${s * 72},18 ${s * 52},-40Z`;
    case 'mid': return p`M${s * 56},-62 C${s * 88},-40 ${s * 92},40 ${s * 82},72 Q${s * 78},84 ${s * 68},88 C${s * 67},60 ${s * 61},28 ${s * 53},-40Z`;
    case 'short': return p`M${s * 56},-62 C${s * 82},-50 ${s * 84},-6 ${s * 79},20 L${s * 73},38 C${s * 69},16 ${s * 63},-10 ${s * 55},-40Z`;
    case 'burn': return p`M${s * 56},-64 C${s * 80},-54 ${s * 82},-26 ${s * 76},-6 L${s * 71},14 L${s * 67},-3 L${s * 62},9 C${s * 60},-12 ${s * 58},-30 ${s * 53},-42Z`;
    case 'strand': return p`M${s * 50},-74 C${s * 66},-44 ${s * 58},-8 ${s * 68},28 C${s * 76},56 ${s * 70},82 ${s * 78},110 C${s * 64},90 ${s * 62},64 ${s * 58},36 C${s * 50},2 ${s * 56},-40 ${s * 44},-66Z`;
    case 'tendril': return p`M${s * 58},-54 C${s * 74},-22 ${s * 62},18 ${s * 76},56 Q${s * 79},70 ${s * 71},80 C${s * 66},54 ${s * 56},22 ${s * 62},-12 C${s * 62},-30 ${s * 58},-44 ${s * 54},-50Z`;
    default: return '';
  }
}
function backPath(style, f) {
  switch (style) {
    case 'half_up': case 'long': return 'M0,-140 C-62,-140 -96,-96 -96,-24 C-98,70 -110,190 -122,330 Q-108,322 -100,346 Q-88,326 -76,352 Q-64,334 -52,354 L52,354 Q64,334 76,352 Q88,326 100,346 Q108,322 122,330 C110,190 98,70 96,-24 C96,-96 62,-140 0,-140Z';
    case 'wavy': return 'M0,-140 C-64,-140 -100,-96 -100,-24 C-104,40 -86,90 -108,150 C-128,210 -96,262 -122,320 C-130,342 -110,358 -96,346 Q-86,366 -70,350 Q-60,364 -50,350 L50,350 Q60,364 70,350 Q86,366 96,346 C110,358 130,342 122,320 C96,262 128,210 108,150 C86,90 104,40 100,-24 C100,-96 64,-140 0,-140Z';
    case 'bob': return 'M0,-142 C-68,-142 -102,-96 -102,-20 C-102,30 -100,66 -90,88 Q-78,100 -60,90 L60,90 Q78,100 90,88 C100,66 102,30 102,-20 C102,-96 68,-142 0,-142Z';
    case 'braid': return 'M0,-140 C-64,-140 -96,-96 -96,-24 C-96,20 -92,70 -80,112 L80,112 C92,70 96,20 96,-24 C96,-96 64,-140 0,-140Z';
    case 'long_m': return 'M0,-140 C-64,-140 -94,-96 -92,-24 C-92,30 -86,80 -70,110 L70,110 C86,80 92,30 92,-24 C94,-96 64,-140 0,-140Z';
    case 'updo': return 'M0,-164 C-44,-176 -84,-152 -92,-104 C-98,-62 -92,-12 -84,18 L84,18 C92,-12 98,-62 92,-104 C84,-152 44,-176 0,-164Z';
    case 'messy': {
      var o = 'M-80,44 L-88,20 ', i, N = 9;
      for (i = 0; i <= N; i++) {
        var a = PI * (1.12 - 1.24 * i / N), sg = a > PI / 2 ? -1 : 1;
        var vx = Math.cos(a) * 90, vy = -34 - Math.sin(a) * 96, ta = a - 0.16 * (i % 2 ? 1 : -1) * 0 - 0.1 * sg * -1;
        var tx = Math.cos(ta) * 112, ty = -34 - Math.sin(ta) * 116;
        if (i) o += p`Q${(vx + tx) / 2 + Math.cos(a) * 4},${(vy + ty) / 2 - 8} ${tx},${ty} `;
        var a3 = PI * (1.12 - 1.24 * (i + 0.5) / N);
        if (i < N) o += p`Q${Math.cos(a3) * 100},${-34 - Math.sin(a3) * 104} ${Math.cos(a3) * 90},${-34 - Math.sin(a3) * 94} `;
      }
      return o + 'L88,20 L80,44Z';
    }
    default: return f ? 'M0,-140 C-66,-140 -92,-96 -90,-24 C-90,14 -86,44 -74,64 L74,64 C86,44 90,14 90,-24 C92,-96 66,-140 0,-140Z'
      : 'M0,-140 C-64,-140 -90,-96 -88,-24 C-88,6 -84,30 -74,50 L-60,40 L-52,62 L52,62 L60,40 L74,50 C84,30 88,6 88,-24 C90,-96 64,-140 0,-140Z';
  }
}
var LOCKS = { long: 'long', wavy: 'wavy', bob: 'mid', ponytail: 'tendril', twintail: 'mid', braid: 'mid', updo: 'tendril', bun: 'tendril', short: 'short', messy: 'short', slick: '', long_m: 'mid', topknot: 'strand', half_up: 'long' };
function capPt(t, top) {
  var A = [[-80, -18], [-86, -92], [-48, -136 + top], [0, -136 + top]], B = [[0, -136 + top], [48, -136 + top], [86, -92], [80, -18]];
  return t < 0.5 ? cb(A[0], A[1], A[2], A[3], t * 2) : cb(B[0], B[1], B[2], B[3], t * 2 - 1);
}
/* pointed strand tufts that break the cap outline (drawn over the cap edge, stroked only outside) */
function spikes(list, top, fill, line) {
  var o = '', st = '';
  list.forEach(function (q) {
    var t = q[0], len = q[1], sw = q[2], hw = q[3] || 0.035;
    var a = capPt(t - hw, top), b = capPt(t + hw, top), mid = capPt(t, top), t1 = capPt(t + 0.01, top), t0 = capPt(t - 0.01, top);
    var nx = mid[0], ny = mid[1] + 34, l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    var tx = t1[0] - t0[0], ty = t1[1] - t0[1], tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    var tip = [mid[0] + nx * len + tx * sw, mid[1] + ny * len + ty * sw];
    var c1 = [a[0] + nx * len * 0.55 + tx * sw * 0.2, a[1] + ny * len * 0.55 + ty * sw * 0.2], c2 = [b[0] + nx * len * 0.3 + tx * sw * 0.5, b[1] + ny * len * 0.3 + ty * sw * 0.5];
    var edge = p`M${a[0]},${a[1]} Q${c1[0]},${c1[1]} ${tip[0]},${tip[1]} Q${c2[0]},${c2[1]} ${b[0]},${b[1]}`;
    o += pa(edge + p` L${mid[0] - nx * 7},${mid[1] - ny * 7}Z`, fill);
    st += edge + ' ';
  });
  return o + pa(st, 'none', line, 1.5);
}

function hairSvg(D, L, m, st) {
  /* returns {back, front, over(body-level), shadow} in head-local coords */
  var hair = L.hair, h2 = L.hair2, line = dk(hair, 0.55), acc = L.accent || '#d8435e';
  var style = L.hairStyle, bangs = L.bangs;
  var fg = D.lg(0, -140, 0, 150, [[0, lt(hair, 0.1)], [0.45, hair], [1, h2]], true);
  var bgF = D.lg(0, -140, 0, 360, [[0, dk(hair, 0.28)], [0.35, dk(hair, 0.18)], [1, dk(h2, 0.1)]], true);
  var hlc = lum(hair) > 0.65 ? '#ffffff' : lt(mix(hair, h2, 0.3), 0.55);
  var back = '', front = '', over = '', top = '';
  var ties = function (x, y, r) { return circ(x, y, r || 7, acc, stk(dk(acc, 0.4), 1.2)) + circ(x - 2, y - 2, 2, '#fff', op(0.6)); };
  var bp = backPath(style, !m);
  var vol = D.lg(-110, 0, 110, 0, [[0, '#ffffff', 0.14], [0.35, '#ffffff', 0], [0.62, '#1d1228', 0], [1, '#1d1228', 0.3]], true);
  back += pa(bp, bgF, line, 1.6) + pa(bp, vol);
  if (style === 'long' || style === 'wavy') {
    back += pa('M-70,0 Q-92,150 -100,300 M70,0 Q92,150 100,300 M-50,60 Q-66,180 -76,330 M50,60 Q66,180 76,330', 'none', dk(hair, 0.45), 1.3, op(0.4));
    back += pa('M-84,20 Q-100,140 -108,260 M84,20 Q100,140 108,260', 'none', hlc, 2.2, op(0.22));
  }
  if (style === 'ponytail') {
    var tail = 'M28,-122 C104,-156 150,-74 128,30 C116,110 140,190 104,272 Q100,242 86,258 C100,180 84,110 80,40 C76,-30 64,-86 26,-100Z';
    back = pa(tail, bgF, line, 1.6) + pa('M60,-110 C112,-100 116,0 106,80 C100,150 112,200 100,240', 'none', hlc, 2, op(0.3)) + back + ties(50, -124, 8);
  }
  if (style === 'twintail') {
    [-1, 1].forEach(function (s) {
      back = pa(p`M${s * 56},-104 C${s * 124},-120 ${s * 152},-36 ${s * 142},60 C${s * 134},150 ${s * 156},222 ${s * 120},304 Q${s * 114},274 ${s * 100},292 C${s * 114},204 ${s * 96},124 ${s * 96},54 C${s * 96},-14 ${s * 84},-56 ${s * 58},-72Z`, bgF, line, 1.6) +
        pa(p`M${s * 96},-80 C${s * 136},-50 ${s * 128},60 ${s * 122},140`, 'none', hlc, 2, op(0.3)) + back;
    });
    over += ties(-72, -94, 8) + ties(72, -94, 8);
  }
  if (style === 'bun') {
    back = circ(0, -148, 38, bgF, stk(line, 1.6)) + pa('M-24,-160 Q0,-186 26,-160 M-30,-140 Q0,-170 30,-138 M-18,-130 Q4,-150 22,-128', 'none', dk(hair, 0.4), 1.3, op(0.5)) +
      pa('M-20,-170 Q0,-184 18,-172', 'none', hlc, 2.5, op(0.45)) + back;
    over += pa('M40,-170 L-2,-130', 'none', acc, 3.5) + circ(40, -170, 4, acc);
  }
  if (style === 'updo') {
    back += ell(-26, -150, 40, 28, bgF, stk(line, 1.4)) + ell(26, -152, 42, 30, bgF, stk(line, 1.4)) +
      pa('M-50,-156 Q-26,-176 0,-160 M4,-162 Q30,-180 58,-158', 'none', hlc, 2.2, op(0.35));
  }
  if (style === 'messy') back += pa('M-60,-90 Q-80,-40 -76,20 M60,-90 Q80,-40 76,20', 'none', dk(hair, 0.45), 1.2, op(0.4));
  /* over-the-shoulder pieces (drawn above the outfit) */
  if (style === 'braid') {
    var bx = 64, by = 64, k, br = '';
    for (k = 0; k < 9; k++) {
      var t = k / 8, x = bx + 34 * t + 6 * Math.sin(t * 3), y = by + 250 * t, rr = 17 - 6 * t, sgn = k % 2 ? 1 : -1;
      br += ell(x + sgn * 4, y, rr, rr * 0.8, fg, stk(line, 1.4) + ' transform="rotate(' + (sgn * 28) + ' ' + n(x + sgn * 4) + ' ' + n(y) + ')"') +
        pa(p`M${x + sgn * 4 - rr * 0.5},${y - rr * 0.3} Q${x + sgn * 4},${y - rr * 0.6} ${x + sgn * 4 + rr * 0.4},${y - rr * 0.2}`, 'none', hlc, 1.8, op(0.45));
    }
    br += pa('M96,318 Q88,352 80,360 Q98,354 104,366 Q108,346 112,360 Q116,340 106,318Z', fg, line, 1.4) + ties(99, 314, 8);
    over += br;
  }
  if (style === 'long_m') {
    /* a low tail flowing over the shoulder: S-curve, split tips, strand lines */
    var tl = 'M16,78 C46,82 84,112 92,164 C100,214 76,246 78,290 C79,318 90,338 100,356 C86,352 76,342 70,328 C70,344 72,356 76,368 C62,356 56,338 56,318 C52,330 50,342 52,352 C40,332 42,300 50,272 C60,236 76,204 66,166 C58,136 38,112 8,100Z';
    over += pa(tl, fg, line, 1.5) + pa(tl, vol) +
      pa('M40,108 C64,132 80,172 76,216 C72,256 60,290 66,330 M54,112 C78,144 88,186 82,232 C78,270 72,300 84,340 M28,104 C50,130 62,170 60,210 C58,248 50,280 54,320', 'none', dk(hair, 0.42), 1.2, op(0.5)) +
      pa('M62,132 C80,164 84,204 76,240 C70,268 70,290 72,310', 'none', hlc, 2.6, op(0.45)) +
      pa('M14,96 C28,84 48,86 60,98 L56,114 C44,104 30,104 16,112Z', acc, dk(acc, 0.4), 1.2) + pa('M20,100 C32,92 46,94 56,102', 'none', '#fff', 1.2, op(0.4));
  }
  if (style === 'topknot') {
    /* high knot; ribbon tails behind for girls, a small crown (guan) for men */
    if (!m) back = pa('M8,-150 C40,-140 70,-110 84,-60 C92,-30 96,10 110,40 L96,44 C86,14 80,-24 70,-54 C58,-96 34,-126 4,-138Z M-2,-150 C28,-126 50,-96 60,-46 C66,-16 64,20 72,54 L60,54 C54,22 54,-12 48,-40 C40,-84 22,-116 -6,-138Z', acc, dk(acc, 0.45), 1.2) + back;
    back += ell(0, -156, 27, 22, fg, stk(line, 1.6)) + pa('M-20,-158 Q-6,-178 16,-170 M-22,-148 Q0,-168 22,-156 M-12,-140 Q6,-154 20,-146', 'none', dk(hair, 0.4), 1.3, op(0.55)) +
      pa('M-14,-170 Q0,-178 12,-174', 'none', hlc, 2.6, op(0.5));
    top += pa('M-28,-140 Q0,-132 28,-140 L26,-128 Q0,-120 -26,-128Z', acc, dk(acc, 0.45), 1.2) + pa('M-24,-136 Q0,-129 24,-136', 'none', lt(acc, 0.4), 1.2, op(0.7));
    if (m) {
      var gdk = D.lg(0, -186, 0, -140, [[0, '#fff2b8'], [0.5, '#d9a93a'], [1, '#8a5a18']], true);
      top += pa('M-15,-146 L-12,-178 Q0,-186 12,-178 L15,-146 Q0,-142 -15,-146Z', gdk, '#6a4210', 1.2) + pa('M-6,-176 L-5,-150 M6,-176 L5,-150', 'none', '#6a4210', 1, op(0.6)) +
        pa('M-40,-162 L42,-166', 'none', '#6a4210', 4.4) + pa('M-40,-162 L42,-166', 'none', '#e8c870', 2.4) + circ(44, -166, 3.4, L.gem || acc, stk('#6a4210', 1));
    } else top += pa('M-36,-150 L38,-170', 'none', '#6a4210', 3.6) + pa('M-36,-150 L38,-170', 'none', '#e8c870', 2) + flower(40, -170, 8, lt(acc, 0.3));
  }
  if (style === 'half_up') {
    back += ell(0, -146, 30, 22, fg, stk(line, 1.5)) + pa('M-22,-150 Q0,-168 22,-150 M-18,-138 Q2,-154 20,-140', 'none', dk(hair, 0.4), 1.2, op(0.5)) + pa('M-12,-162 Q2,-168 14,-162', 'none', hlc, 2.4, op(0.5));
    top += pa('M-44,-138 L50,-166', 'none', '#6a4210', 4) + pa('M-44,-138 L50,-166', 'none', '#e8c870', 2.2) +
      circ(52, -167, 5, acc, stk(dk(acc, 0.45), 1.2)) + circ(50.5, -168.5, 1.6, '#fff', op(0.7)) +
      pa('M54,-162 C56,-146 58,-132 56,-118 M58,-163 C62,-150 64,-140 64,-128', 'none', '#d9a93a', 1.2) + circ(56, -116, 2.6, acc) + circ(64, -126, 2.2, acc);
  }
  /* front: side locks + cap */
  var lk = LOCKS[style] || '';
  if (!m && style === 'short') lk = 'mid';
  if (m && style === 'ponytail') lk = 'short';
  if (m && (style === 'short' || style === 'messy')) lk = 'burn';
  [-1, 1].forEach(function (s) {
    var d = lockPath(lk, s);
    if (d) front += pa(d, fg, line, 1.5) + pa(d, vol);
  });
  var ctop = style === 'messy' ? -4 : style === 'slick' ? -4 : 0, bump = style === 'slick' ? 1.5 : style === 'messy' ? 7 : 4;
  var cap = capPath(bangs, m, ctop, bump);
  var sh = '';
  front += pa(cap, fg) + pa(cap, vol) + pa(capTop(ctop, bump), 'none', D.lg(-90, 0, 90, 0, [[0, '#ffffff', 0], [0.66, '#ffffff', 0], [1, '#fff4e4', 0.55]], true), 4, 'transform="translate(-2.5 2)"') + pa(capLine(bangs, m, ctop, bump), 'none', line, 1.6);
  sh = pa(cap, L.skinSh, null, 0, 'transform="translate(3 9)"');
  [-1, 1].forEach(function (s) { var d = lockPath(lk, s); if (d) sh += pa(d, L.skinSh, null, 0, 'transform="translate(' + (-s * 4) + ' 6)"'); });
  /* strands + highlight */
  var hy = bangs === 'none' ? -8 : 0;
  if (m && (style === 'short' || style === 'messy' || style === 'slick' || style === 'ponytail')) {
    var SP = style === 'slick' ? [[0.1, 9, -8], [0.17, 8, -7], [0.83, 8, 7], [0.9, 9, 8]]
      : [[0.09, 10, -13, 0.045], [0.18, 13, -17, 0.05], [0.28, 10, -15, 0.045], [0.38, 7, -10, 0.04], [0.47, 8, -5, 0.035], [0.54, 7, 5, 0.035], [0.6, 7, 10, 0.04], [0.7, 11, 16, 0.05], [0.8, 12, 16, 0.05], [0.9, 9, 12, 0.045]];
    if (style === 'messy') SP = SP.map(function (q, i) { return [q[0], q[1] * 1.5 + (i % 2) * 5, q[2] * 1.1, q[3]]; });
    front += spikes(SP, ctop, fg, line);
  }
  if (m && (style === 'short' || style === 'messy') && (bangs === 'side' || bangs === 'straight')) {
    var fs = bangs === 'side' ? [[20, -98, 8, -26, 15], [-12, -100, -22, -44, 13]] : [[-26, -96, -32, -22, 13], [14, -98, 6, -20, 13]];
    fs.forEach(function (q) {
      var d = p`M${q[0] - q[4] / 2},${q[1]} C${q[0] - q[4] / 2 + (q[2] - q[0]) * 0.3},${q[1] + 20} ${q[2] - 3},${q[3] - 18} ${q[2]},${q[3]} C${q[2] + 2},${q[3] - 16} ${q[0] + q[4] / 2 + (q[2] - q[0]) * 0.4},${q[1] + 18} ${q[0] + q[4] / 2},${q[1]}Z`;
      front += pa(d, fg, line, 1.2);
    });
  }
  if (style === 'topknot' || style === 'half_up') front += pa('M-66,-50 Q-58,-100 -16,-132 M-50,-60 Q-40,-104 -4,-134 M66,-50 Q58,-100 16,-132 M50,-60 Q40,-104 6,-134 M-30,-80 Q-20,-116 -2,-136 M30,-80 Q20,-116 2,-136', 'none', dk(hair, 0.42), 1.2, op(0.4));
  else if (style === 'slick') front += pa('M-50,-100 Q-20,-126 20,-128 M-58,-78 Q-24,-112 30,-118 M-62,-54 Q-30,-96 36,-104 M60,-64 Q40,-100 10,-110', 'none', dk(hair, 0.4), 1.3, op(0.55));
  else front += pa('M-8,-130 Q-18,-84 -28,-54 M22,-128 Q26,-84 32,-52 M-40,-118 Q-52,-84 -54,-54 M48,-114 Q56,-84 52,-56 M4,-128 Q6,-90 4,-62', 'none', dk(hair, 0.42), 1.2, op(0.35));
  front += pa(p`M-54,${-92 + hy} Q-28,${-118 + hy} 0,${-120 + hy} Q28,${-118 + hy} 54,${-92 + hy} Q30,${-108 + hy} 0,${-110 + hy} Q-30,${-108 + hy} -54,${-92 + hy}Z`, '#ffffff', null, 0, op(0.28));
  front += pa(p`M-58,${-84 + hy} Q-30,${-116 + hy} 0,${-118 + hy} Q30,${-116 + hy} 58,${-84 + hy} L51,${-80 + hy} L44,${-93 + hy} L36,${-82 + hy} L26,${-98 + hy} L16,${-87 + hy} L6,${-102 + hy} L-4,${-90 + hy} L-14,${-100 + hy} L-24,${-86 + hy} L-34,${-96 + hy} L-44,${-82 + hy} L-51,${-90 + hy}Z`, hlc, null, 0, op(0.62));
  front += pa(p`M-66,-40 C-72,-90 -40,-126 -6,-130`, 'none', '#fff', 2, op(0.25));
  front += pa(p`M-44,${-60 + hy} C-50,${-80 + hy} -44,${-100 + hy} -30,${-112 + hy} C-40,${-98 + hy} -44,${-82 + hy} -42,${-62 + hy}Z M-22,${-66 + hy} C-26,${-88 + hy} -20,${-104 + hy} -8,${-116 + hy} C-16,${-100 + hy} -20,${-88 + hy} -19,${-68 + hy}Z`, hlc, null, 0, op(0.3));
  if (style === 'ponytail' && !m) front += '';
  if (style === 'slick' && bangs !== 'none') front += pa('M14,-86 C30,-60 26,-30 36,-10 C24,-26 18,-50 8,-80Z M-6,-88 C-20,-66 -18,-44 -26,-24 C-12,-40 -8,-60 2,-84Z', fg, line, 1.2);
  if (style === 'long_m' || (m && style === 'short')) front += '';
  return { back: back, front: front, over: over, top: top, shadow: sh };
}

/* ------------------------------------------------------------ outfits */
function sil(B, e, nlw, nl) {
  var cx = 200, S = B.S, sh = B.sh + e, yN = B.nb + 6;
  return p`M${cx - nlw},${yN} L${cx - sh + 18},${S - 2} Q${cx - sh - 3},${S + 3} ${cx - sh - 4},${S + 36} L${cx - sh - 9},606 L${cx + sh + 9},606 L${cx + sh + 4},${S + 36} Q${cx + sh + 3},${S + 3} ${cx + sh - 18},${S - 2} L${cx + nlw},${yN} ` + nl + 'Z';
}
function nlRound(B, w, d) { return p`Q200,${B.nb + 6 + d * 2} ${200 - w},${B.nb + 6}`; }
function nlV(B, w, d) { return p`L200,${B.nb + 6 + d} L${200 - w},${B.nb + 6}`; }
function clothFill(O, col) {
  return O.D.lg(0, O.B.S - 30, 0, 606, [[0, lt(col, 0.14)], [0.4, col], [1, dk(col, 0.22)]], true);
}
function shade(O, d) {
  var B = O.B;
  var gsh = O.D.lg(200 - B.sh - 10, 0, 200 + B.sh + 10, 0, [[0, '#ffffff', 0.16], [0.28, '#ffffff', 0], [0.6, '#000000', 0], [1, '#1d1228', 0.32]], true);
  return pa(d, gsh);
}
function armLines(O, col, x0) {
  var B = O.B, o = '';
  [-1, 1].forEach(function (s) {
    var ax = 200 + s * (B.sh - 28), y0 = x0 || B.S + 60, bx = 200 + s * (B.sh - 16);
    o += pa(p`M${ax},${y0} C${ax + s * 2},${y0 + 80} ${ax + s * 4},${y0 + 160} ${bx},606 L${bx - s * 26},606 C${bx - s * 26},${y0 + 150} ${ax - s * 8},${y0 + 70} ${ax},${y0}Z`, dk(col, 0.55), null, 0, op(0.28));
    o += pa(p`M${ax},${y0} C${ax + s * 2},${y0 + 80} ${ax + s * 4},${y0 + 160} ${bx},606`, 'none', dk(col, 0.5), 1.7, op(0.7));
    o += pa(p`M${200 + s * (B.sh - 2)},${B.S + 60} Q${200 + s * (B.sh - 10)},${B.S + 90} ${200 + s * (B.sh - 4)},${B.S + 120}`, 'none', dk(col, 0.4), 1.3, op(0.4));
  });
  return o;
}
function bust(O, col, y) {
  if (!O.B.f || O.B.age === 'child') return '';
  var B = O.B, Y = y || B.S + 72, k = B.age === 'teen' ? 0.8 : 1;
  return pa(p`M${200 - 62 * k},${Y} Q${200 - 36 * k},${Y + 30 * k} ${200 - 8},${Y + 14 * k} M${200 + 62 * k},${Y} Q${200 + 36 * k},${Y + 30 * k} ${200 + 8},${Y + 14 * k}`, 'none', dk(col, 0.45), 1.5, op(0.4)) +
    ell(200 - 36 * k, Y + 20 * k, 24 * k, 8 * k, dk(col, 0.4), op(0.18)) + ell(200 + 36 * k, Y + 20 * k, 24 * k, 8 * k, dk(col, 0.4), op(0.18));
}
function btn(x, y, r, c) { return circ(x, y, r, c, stk(dk(c, 0.5), 1)) + circ(x - r * 0.3, y - r * 0.3, r * 0.35, '#fff', op(0.6)); }
function metal(D, c) { return D.lg(0, 0, 0, 1, [[0, lt(c, 0.6)], [0.45, c], [1, dk(c, 0.4)]]); }
function frill(pts, dep, fill, line) {
  var d = p`M${pts[0][0]},${pts[0][1]} `, i;
  for (i = 1; i < pts.length; i++) {
    var a = pts[i - 1], b = pts[i], r = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
    d += p`A${r},${r} 0 0 1 ${b[0]},${b[1]} `;
  }
  for (i = pts.length - 1; i >= 0; i--) d += p`L${pts[i][0]},${pts[i][1] + dep} `;
  return pa(d + 'Z', fill, line, 1.1);
}
function sample(fn, n0) { var a = [], i; for (i = 0; i <= n0; i++) a.push(fn(i / n0)); return a; }
function armSkin(O, y0) {
  var B = O.B, o = '';
  [-1, 1].forEach(function (s) {
    var x1 = 200 + s * (B.sh + 3), x2 = 200 + s * (B.sh - 30);
    var S = B.S, X = function (d) { return 200 + s * d; };
    var ad = p`M${X(B.sh - 18)},${S} Q${X(B.sh + 2)},${S + 4} ${X(B.sh + 3)},${S + 36} L${X(B.sh + 8)},606 L${X(B.sh - 20)},606 C${X(B.sh - 24)},${y0 + 120} ${x2},${y0 + 50} ${x2 - s * 2},${y0} L${X(B.sh - 34)},${S + 2}Z`;
    o += pa(ad, O.skinF) + pa(p`M${X(B.sh - 4)},${S + 6} Q${X(B.sh + 2.5)},${S + 14} ${X(B.sh + 3)},${S + 36} L${X(B.sh + 8)},606 M${X(B.sh - 20)},606 C${X(B.sh - 24)},${y0 + 120} ${x2},${y0 + 50} ${x2 - s * 1},${y0 + 14}`, 'none', O.skinLine, 1.4);
    o += pa(p`M${200 + s * (B.sh - 22)},606 C${200 + s * (B.sh - 26)},${y0 + 120} ${x2},${y0 + 50} ${x2 - s * 2},${y0}`, 'none', O.skinSh, 5, op(0.35));
  });
  return o;
}

var OUTFITS = {
  gown: function (O) {
    var B = O.B, S = B.S, sh = B.sh, col = O.col, ac = O.ac, D = O.D, cx = 200;
    var R0 = [cx + sh + 5, S + 42], R1 = [cx + sh - 6, S + 22], R2 = [cx + sh - 30, S + 30];
    var C1 = [cx + 62, S + 22], C2 = [cx + 24, S + 26], C3 = [cx, S + 54];
    var d = p`M${cx - sh - 5},${S + 42} L${cx - sh - 10},606 L${cx + sh + 10},606 L${R0[0]},${R0[1]} Q${R1[0]},${R1[1]} ${R2[0]},${R2[1]} C${C1[0]},${C1[1]} ${C2[0]},${C2[1]} ${C3[0]},${C3[1]} C${cx - 24},${S + 26} ${cx - 62},${S + 22} ${cx - sh + 30},${S + 30} Q${cx - sh + 6},${S + 22} ${cx - sh - 5},${S + 42}Z`;
    var o = pa(d, clothFill(O, col), dk(col, 0.55), 2) + shade(O, d) + armLines(O, col, S + 70) + bust(O, col, S + 58);
    o += pa(p`M${cx - 30},${S + 66} Q${cx - 22},${S + 170} ${cx - 42},606 M${cx + 30},${S + 66} Q${cx + 22},${S + 170} ${cx + 42},606`, 'none', dk(col, 0.4), 1.4, op(0.5));
    var lace = '', k;
    for (k = 0; k < 6; k++) { var y = S + 84 + k * 22; lace += p`M${cx - 10},${y} L${cx + 10},${y + 11} M${cx + 10},${y} L${cx - 10},${y + 11} `; }
    o += pa(lace, 'none', ac, 1.8, op(0.9));
    [-1, 1].forEach(function (s) {
      var pf = p`M${cx + s * (sh - 36)},${S + 36} C${cx + s * (sh + 2)},${S + 14} ${cx + s * (sh + 24)},${S + 56} ${cx + s * (sh + 14)},${S + 98} C${cx + s * (sh - 2)},${S + 110} ${cx + s * (sh - 26)},${S + 100} ${cx + s * (sh - 34)},${S + 82}Z`;
      o += pa(pf, clothFill(O, lt(col, 0.08)), dk(col, 0.5), 1.8) +
        pa(p`M${cx + s * (sh - 20)},${S + 34} Q${cx + s * (sh - 6)},${S + 70} ${cx + s * (sh - 14)},${S + 102} M${cx + s * (sh - 2)},${S + 30} Q${cx + s * (sh + 12)},${S + 64} ${cx + s * (sh + 4)},${S + 104}`, 'none', dk(col, 0.4), 1.3, op(0.5)) +
        pa(p`M${cx + s * (sh - 26)},${S + 38} Q${cx + s * (sh - 4)},${S + 30} ${cx + s * (sh + 8)},${S + 58}`, 'none', '#fff', 2.5, op(0.35));
    });
    var pts = sample(function (t) { return qb(R0, R1, R2, t); }, 4).concat(sample(function (t) { return cb(R2, C1, C2, C3, t); }, 7).slice(1));
    pts = pts.map(function (q) { return [2 * cx - q[0], q[1]]; }).concat(pts.slice().reverse().slice(1));
    o += frill(pts.map(function (q) { return [q[0], q[1] - 3]; }), 8, ac, dk(ac, 0.35));
    o += pa(pts.map(function (q, i) { return (i ? 'L' : 'M') + n(q[0]) + ',' + n(q[1] + 5); }).join(' '), 'none', dk(ac, 0.2), 1, op(0.6));
    o += pa(p`M${cx},${S + 56} C${cx - 16},${S + 40} ${cx - 26},${S + 62} ${cx - 4},${S + 62}Z M${cx},${S + 56} C${cx + 16},${S + 40} ${cx + 26},${S + 62} ${cx + 4},${S + 62}Z`, ac, dk(ac, 0.4), 1.2) + circ(cx, S + 59, 4.5, O.gem, stk('#fff', 1));
    if (S + 230 < 590) o += pa(p`M${cx - B.wh - 18},${S + 226} Q${cx},${S + 238} ${cx + B.wh + 18},${S + 226} L${cx + B.wh + 18},${S + 244} Q${cx},${S + 256} ${cx - B.wh - 18},${S + 244}Z`, dk(col, 0.25), dk(col, 0.55), 1.2);
    return { front: o };
  },
  uniform: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nw = B.nw, nb = B.nb;
    var d = sil(B, 2, nw + 6, nlRound(B, nw + 6, 3));
    var o = pa(d, clothFill(O, col), dk(col, 0.6), 2) + shade(O, d) + armLines(O, col);
    o += pa(p`M${cx - 44},${nb + 10} L${cx - 34},606 L${cx + 34},606 L${cx + 44},${nb + 10}Z`, lt(col, 0.05), dk(col, 0.5), 1.4, op(0.9));
    o += pa(p`M${cx - 44},${nb + 10} L${cx - 34},606 M${cx + 44},${nb + 10} L${cx + 34},606`, 'none', ac, 2, op(0.8));
    var gm = metal(D, ac), y;
    for (y = S + 24; y < 596; y += 38) o += btn(cx - 24, y, 5.5, ac) + btn(cx + 24, y, 5.5, ac);
    o += pa(p`M${cx - nw - 5},${nb + 12} L${cx - nw - 3},${nb - 20} Q${cx},${nb - 15} ${cx + nw + 3},${nb - 20} L${cx + nw + 5},${nb + 12} Q${cx},${nb + 18} ${cx - nw - 5},${nb + 12}Z`, dk(col, 0.15), dk(col, 0.6), 1.5) +
      pa(p`M${cx - nw - 3},${nb - 18} Q${cx},${nb - 13} ${cx + nw + 3},${nb - 18}`, 'none', ac, 2.2) +
      pa(p`M${cx - nw},${nb - 6} l8,0 M${cx + nw},${nb - 6} l-8,0`, 'none', ac, 3);
    o += pa(p`M${cx + B.sh - 30},${S + 6} C${cx + B.sh - 30},${S + 60} ${cx + 60},${S + 80} ${cx + 30},${S + 60} M${cx + B.sh - 26},${S + 8} C${cx + B.sh - 20},${S + 90} ${cx + 70},${S + 110} ${cx + 30},${S + 80}`, 'none', gm, 3.4) +
      pa(p`M${cx + B.sh - 30},${S + 6} C${cx + B.sh - 30},${S + 60} ${cx + 60},${S + 80} ${cx + 30},${S + 60}`, 'none', dk(ac, 0.4), 1, op(0.6));
    o += ['#c8323c', '#2f63c0', '#e9c34a', '#2e8a55'].map(function (c, i) { return pa(p`M${cx - 88 + i * 12},${S + 58} h11 v7 h-11Z`, c, dk(c, 0.4), 0.8); }).join('');
    [-1, 1].forEach(function (s) { o += pa(p`M${cx + s * (nw + 20)},${nb + 10} L${cx + s * (B.sh - 16)},${S} L${cx + s * (B.sh - 14)},${S + 14} L${cx + s * (nw + 22)},${nb + 22}Z`, dk(col, 0.2), ac, 1.4); });
    if (S + 250 < 596) o += pa(p`M${cx - B.sh + 26},${S + 250} L${cx + B.sh - 26},${S + 250} L${cx + B.sh - 25},${S + 266} L${cx - B.sh + 25},${S + 266}Z`, '#2a2024', null, 0) + pa(p`M${cx - 12},${S + 248} h24 v20 h-24Z`, gm, dk(ac, 0.5), 1.2);
    return { front: o };
  },
  suit: function (O) { return suitLike(O, false); },
  school: function (O) { return O.B.f ? sailor(O) : suitLike(O, true); },
  stage: function (O) {
    var B = O.B, S = B.S, sh = B.sh, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, o = '', k;
    var spark = function (x, y, r) { return pa(p`M${x},${y - r} Q${x + r * 0.15},${y - r * 0.15} ${x + r},${y} Q${x + r * 0.15},${y + r * 0.15} ${x},${y + r} Q${x - r * 0.15},${y + r * 0.15} ${x - r},${y} Q${x - r * 0.15},${y - r * 0.15} ${x},${y - r}Z`, '#fff'); };
    var seq = '', rr = 1;
    if (B.f) {
      var bd = p`M${cx - sh + 26},${S + 48} Q${cx},${S + 30} ${cx + sh - 26},${S + 48} C${cx + sh - 30},${S + 130} ${cx + B.wh + 14},${S + 190} ${cx + B.wh + 4},606 L${cx - B.wh - 4},606 C${cx - B.wh - 14},${S + 190} ${cx - sh + 30},${S + 130} ${cx - sh + 26},${S + 48}Z`;
      o += pa(bd, D.lg(0, 0, 1, 1, [[0, lt(col, 0.3)], [0.5, col], [1, dk(col, 0.35)]]), dk(col, 0.55), 2) + bust(O, col, S + 60);
      for (k = 0; k < 70; k++) { var sx = cx - 70 + ((k * 37) % 140), sy = S + 50 + ((k * 53) % (560 - S)); seq += circ(sx, sy, 1.6 + (k % 3) * 0.6, k % 4 ? lt(col, 0.55) : '#fff', op(0.75)); }
      o += g(seq, 'clip-path="' + D.clip('<path d="' + bd + '"/>') + '"');
      [-1, 1].forEach(function (s) { o += pa(p`M${cx + s * (sh - 40)},${S + 44} L${cx + s * (B.nw + 14)},${nb + 8}`, 'none', ac, 3.5); });
      o += pa(p`M${cx - sh + 30},${S + 60} L${cx + B.wh},${S + 200} M${cx + sh - 30},${S + 60} L${cx - B.wh},${S + 200}`, 'none', ac, 3, op(0.9));
      o += pa(p`M${cx - sh + 26},${S + 48} Q${cx},${S + 30} ${cx + sh - 26},${S + 48}`, 'none', ac, 4) + armSkin(O, S + 30);
      [-1, 1].forEach(function (s) { o += pa(p`M${cx + s * (sh + 6)},${S + 170} L${cx + s * (sh + 9)},${S + 196} L${cx + s * (sh - 24)},${S + 200} L${cx + s * (sh - 24)},${S + 174}Z`, ac, dk(ac, 0.4), 1.2); });
    } else {
      var d = sil(B, 3, B.nw + 12, nlV(B, B.nw + 12, 150));
      o += pa(p`M${cx - 46},${nb} L${cx + 46},${nb} L${cx + 40},606 L${cx - 40},606Z`, '#1e1a26', '#0e0c12', 1.2);
      o += pa(p`M${cx - 38},${S + 40} L${cx + 38},${S + 110} M${cx + 38},${S + 40} L${cx - 38},${S + 110}`, 'none', ac, 3);
      o += pa(d, D.lg(0, 0, 1, 1, [[0, lt(col, 0.3)], [0.5, col], [1, dk(col, 0.4)]]), dk(col, 0.6), 2) + shade(O, d) + armLines(O, col);
      for (k = 0; k < 90; k++) { var qx = cx - sh + ((k * 41) % (2 * sh)), qy = S - 6 + ((k * 29) % 90); seq += circ(qx, qy, 1.5 + (k % 3) * 0.6, k % 3 ? lt(col, 0.6) : ac, op(0.8)); }
      o += g(seq, 'clip-path="' + D.clip('<path d="' + d + '"/>') + '"');
      o += pa(p`M${cx - B.nw - 12},${nb + 6} L${cx},${nb + 156} L${cx + B.nw + 12},${nb + 6}`, 'none', ac, 3.2);
    }
    for (k = 0; k < 7; k++) o += spark(cx - sh + 20 + ((k * 73) % (2 * sh - 40)), S + 20 + ((k * 47) % 200), 4 + (k % 3) * 2);
    return { front: o };
  },
  robe: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw;
    var hood = p`M${cx - nw - 50},${S + 14} Q${cx - nw - 40},${nb - 44} ${cx},${nb - 50} Q${cx + nw + 40},${nb - 44} ${cx + nw + 50},${S + 14} Q${cx + nw + 16},${nb - 6} ${cx},${nb - 12} Q${cx - nw - 16},${nb - 6} ${cx - nw - 50},${S + 14}Z`;
    var back = pa(hood, D.lg(0, 0, 0, 1, [[0, dk(col, 0.4)], [1, dk(col, 0.15)]]), dk(col, 0.6), 1.8);
    var d = p`M${cx - nw - 8},${nb + 4} L${cx - B.sh + 18},${S - 2} Q${cx - B.sh - 3},${S + 3} ${cx - B.sh - 6},${S + 36} L${cx - B.sh - 22},606 L${cx + B.sh + 22},606 L${cx + B.sh + 6},${S + 36} Q${cx + B.sh + 3},${S + 3} ${cx + B.sh - 18},${S - 2} L${cx + nw + 8},${nb + 4} L${cx - 26},${S + 150} L${cx - nw - 8},${nb + 4}Z`;
    var o = pa(p`M${cx - nw - 8},${nb + 4} L${cx + nw + 8},${nb + 4} L${cx - 26},${S + 150}Z`, dk(col, 0.35), null, 0);
    o += pa(d, clothFill(O, col), dk(col, 0.6), 2) + shade(O, d) + armLines(O, col);
    o += pa(p`M${cx + nw + 8},${nb + 4} L${cx - 26},${S + 150} L${cx - 26},606`, 'none', ac, 9) +
      pa(p`M${cx + nw + 8},${nb + 4} L${cx - 26},${S + 150} L${cx - 26},606`, 'none', dk(ac, 0.45), 1.2, 'stroke-dasharray="2 7"');
    o += pa(p`M${cx - nw - 8},${nb + 4} L${cx - 8},${S + 60}`, 'none', ac, 7);
    var k, rn = '';
    for (k = 0; k < 6; k++) { var t = k / 5, x = cx + nw + 8 + (cx - 26 - (cx + nw + 8)) * t * 0.9, y = nb + 4 + (S + 150 - nb - 4) * t * 0.9; rn += p`M${x},${y - 3} l3,3 l-3,3 l-3,-3Z `; }
    o += pa(rn, dk(ac, 0.5));
    [-1, 1].forEach(function (s) { o += pa(p`M${cx + s * (B.sh - 4)},${S + 150} Q${cx + s * (B.sh + 18)},${S + 220} ${cx + s * (B.sh + 22)},606`, 'none', dk(col, 0.5), 1.4, op(0.6)); });
    if (S + 236 < 596) o += pa(p`M${cx - B.wh - 20},${S + 236} Q${cx},${S + 246} ${cx + B.wh + 20},${S + 236}`, 'none', ac, 6) + pa(p`M${cx + 20},${S + 240} q-4,30 4,46 M${cx + 28},${S + 240} q6,26 0,40`, 'none', ac, 3);
    o += pa(hood.replace(/Z$/, ''), 'none', ac, 2, op(0.7));
    return { back: back, front: o };
  },
  armor: function (O) {
    var B = O.B, S = B.S, sh = B.sh, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, o = '';
    var steel = D.lg(0, 0, 1, 0, [[0, dk(col, 0.45)], [0.28, lt(col, 0.55)], [0.5, col], [0.8, dk(col, 0.25)], [1, dk(col, 0.5)]]);
    var steelV = D.lg(0, 0, 0, 1, [[0, lt(col, 0.5)], [0.5, col], [1, dk(col, 0.4)]]);
    var d = sil(B, 2, nw + 4, nlRound(B, nw + 4, 2));
    o += pa(d, clothFill(O, '#3c3642'), '#1e1a22', 2) + armLines(O, '#3c3642');
    var chain = '', k;
    for (k = 0; k < 40; k++) chain += p`M${cx - sh + (k % 10) * 26},${S + 120 + Math.floor(k / 10) * 60} q6,6 12,0 `;
    o += pa(chain, 'none', '#6a6472', 1.2, op(0.5));
    var bp = p`M${cx - sh + 38},${S + 20} Q${cx},${S + 2} ${cx + sh - 38},${S + 20} C${cx + sh - 30},${S + 110} ${cx + B.wh + 16},${S + 170} ${cx + B.wh + 10},606 L${cx - B.wh - 10},606 C${cx - B.wh - 16},${S + 170} ${cx - sh + 30},${S + 110} ${cx - sh + 38},${S + 20}Z`;
    o += pa(bp, steel, dk(col, 0.6), 2.2);
    o += pa(p`M${cx},${S + 10} L${cx},606`, 'none', dk(col, 0.45), 1.6) + pa(p`M${cx - 4},${S + 14} L${cx - 4},600`, 'none', '#fff', 1.5, op(0.5));
    o += pa(p`M${cx - sh + 44},${S + 26} Q${cx},${S + 10} ${cx + sh - 44},${S + 26}`, 'none', ac, 3);
    o += pa(p`M${cx - B.wh - 14},${S + 180} Q${cx},${S + 200} ${cx + B.wh + 14},${S + 180}`, 'none', dk(col, 0.5), 2);
    o += pa(p`M${cx - 70},${S + 60} Q${cx - 40},${S + 50} ${cx - 30},${S + 110}`, 'none', '#fff', 3, op(0.35));
    o += pa(p`M${cx - nw - 12},${nb + 12} L${cx - nw - 6},${nb - 16} Q${cx},${nb - 10} ${cx + nw + 6},${nb - 16} L${cx + nw + 12},${nb + 12} Q${cx},${nb + 22} ${cx - nw - 12},${nb + 12}Z`, steelV, dk(col, 0.6), 1.6) +
      pa(p`M${cx - nw - 9},${nb} Q${cx},${nb + 8} ${cx + nw + 9},${nb}`, 'none', dk(col, 0.5), 1.2);
    [-1, 1].forEach(function (s) {
      var pd = p`M${cx + s * (sh - 64)},${S - 4} C${cx + s * (sh - 10)},${S - 26} ${cx + s * (sh + 26)},${S + 6} ${cx + s * (sh + 22)},${S + 60} L${cx + s * (sh - 30)},${S + 58} C${cx + s * (sh - 40)},${S + 30} ${cx + s * (sh - 56)},${S + 14} ${cx + s * (sh - 64)},${S - 4}Z`;
      o += pa(p`M${cx + s * (sh - 24)},${S + 54} L${cx + s * (sh + 22)},${S + 56} L${cx + s * (sh + 20)},${S + 84} L${cx + s * (sh - 22)},${S + 80}Z`, steelV, dk(col, 0.6), 1.6);
      o += pa(pd, steelV, dk(col, 0.6), 2) + pa(p`M${cx + s * (sh - 52)},${S} C${cx + s * (sh - 10)},${S - 16} ${cx + s * (sh + 18)},${S + 10} ${cx + s * (sh + 16)},${S + 52}`, 'none', ac, 2.4);
      o += pa(p`M${cx + s * (sh - 40)},${S - 4} C${cx + s * (sh - 10)},${S - 14} ${cx + s * (sh + 6)},${S} ${cx + s * (sh + 10)},${S + 20}`, 'none', '#fff', 2.2, op(0.5));
      [0.15, 0.4, 0.65, 0.9].forEach(function (t) { var q = cb([cx + s * (sh - 64), S - 4], [cx + s * (sh - 10), S - 26], [cx + s * (sh + 26), S + 6], [cx + s * (sh + 22), S + 60], t); o += circ(q[0] - s * 5, q[1] + 6, 2.4, lt(ac, 0.3), stk(dk(ac, 0.5), 0.8)); });
    });
    [S + 40, S + 90, S + 140].forEach(function (y) { o += circ(cx - sh + 50, y, 2.3, lt(ac, 0.3), stk(dk(ac, 0.5), 0.8)) + circ(cx + sh - 50, y, 2.3, lt(ac, 0.3), stk(dk(ac, 0.5), 0.8)); });
    return { front: o };
  },
  casual: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, o = '', k;
    if (B.f) {
      var d = sil(B, 5, nw + 16, nlRound(B, nw + 16, 12));
      o += pa(p`M${cx - nw - 8},${nb + 4} L${cx},${nb + 30} L${cx - 20},${nb + 34}Z M${cx + nw + 8},${nb + 4} L${cx},${nb + 30} L${cx + 20},${nb + 34}Z`, ac, dk(ac, 0.3), 1.2);
      o += pa(d, clothFill(O, col), dk(col, 0.55), 2) + shade(O, d) + armLines(O, col) + bust(O, col);
      var yN = nb + 6, rib = '';
      o += pa(p`M${cx - nw - 16},${yN} Q${cx},${yN + 24} ${cx + nw + 16},${yN} L${cx + nw + 24},${yN + 2} Q${cx},${yN + 36} ${cx - nw - 24},${yN + 2}Z`, lt(col, 0.1), dk(col, 0.5), 1.4);
      for (k = 0; k <= 16; k++) { var t = k / 16, q = qb([cx - nw - 20, yN + 1], [cx, yN + 30], [cx + nw + 20, yN + 1], t); rib += p`M${q[0]},${q[1] - 3} l0,7 `; }
      o += pa(rib, 'none', dk(col, 0.35), 1, op(0.6));
      var cab = '';
      [-34, 0, 34].forEach(function (x) { for (k = 0; k < 12; k++) { var y = S + 34 + k * 22; if (y > 600) break; cab += p`M${cx + x - 7},${y} Q${cx + x},${y + 11} ${cx + x + 7},${y} M${cx + x - 7},${y + 11} Q${cx + x},${y} ${cx + x + 7},${y + 11} `; } });
      o += pa(cab, 'none', dk(col, 0.3), 1.3, op(0.45));
    } else {
      var hood = p`M${cx - nw - 46},${S + 6} Q${cx - nw - 34},${nb - 40} ${cx},${nb - 42} Q${cx + nw + 34},${nb - 40} ${cx + nw + 46},${S + 6}Z`;
      var back = pa(hood, dk(col, 0.25), dk(col, 0.6), 1.8);
      var d2 = sil(B, 5, nw + 10, nlRound(B, nw + 10, 7));
      o += pa(d2, clothFill(O, col), dk(col, 0.55), 2) + shade(O, d2) + armLines(O, col);
      o += pa(p`M${cx - nw - 34},${S + 2} Q${cx - nw - 20},${nb - 12} ${cx},${nb - 10} Q${cx + nw + 20},${nb - 12} ${cx + nw + 34},${S + 2} Q${cx + nw + 10},${nb + 24} ${cx},${nb + 26} Q${cx - nw - 10},${nb + 24} ${cx - nw - 34},${S + 2}Z`, lt(col, 0.06), dk(col, 0.55), 1.6);
      o += pa(p`M${cx - 14},${nb + 22} Q${cx - 18},${S + 60} ${cx - 12},${S + 96} M${cx + 14},${nb + 22} Q${cx + 20},${S + 50} ${cx + 16},${S + 90}`, 'none', ac, 2.4) +
        pa(p`M${cx - 14},${S + 94} l3,12 M${cx + 16},${S + 88} l-2,12`, 'none', '#bbb', 4);
      if (S + 220 < 596) o += pa(p`M${cx - 70},606 L${cx - 56},${S + 220} L${cx + 56},${S + 220} L${cx + 70},606`, 'none', dk(col, 0.5), 1.6, op(0.7));
      return { back: back, front: o };
    }
    return { front: o };
  },
  maid: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, sh = B.sh, o = '';
    var d = sil(B, 2, nw + 4, nlRound(B, nw + 4, 3));
    o += pa(d, clothFill(O, col), dk(col, 0.7), 2) + shade(O, d) + armLines(O, col);
    [-1, 1].forEach(function (s) {
      o += pa(p`M${cx + s * (sh - 40)},${S - 4} C${cx + s * (sh + 4)},${S - 18} ${cx + s * (sh + 24)},${S + 30} ${cx + s * (sh + 12)},${S + 76} C${cx + s * (sh - 6)},${S + 84} ${cx + s * (sh - 28)},${S + 70} ${cx + s * (sh - 34)},${S + 50}Z`, clothFill(O, lt(col, 0.08)), dk(col, 0.7), 1.6) +
        pa(p`M${cx + s * (sh - 14)},${S - 6} Q${cx + s * (sh + 6)},${S + 30} ${cx + s * (sh - 4)},${S + 78}`, 'none', lt(col, 0.3), 1.4, op(0.6));
    });
    var W = B.f ? 50 : 56, ay = S + 40;
    var apron = p`M${cx - W},${ay} L${cx + W},${ay} L${cx + W + 6},606 L${cx - W - 6},606Z`;
    o += pa(apron, D.lg(0, 0, 0, 1, [[0, '#ffffff'], [1, '#e6e2ec']]), '#b9b4c4', 1.4);
    var pts = sample(function (t) { return [cx - W + 2 * W * t, ay - 1]; }, 8);
    o += frill(pts, 6, '#fff', '#b9b4c4');
    [-1, 1].forEach(function (s) {
      var ps = sample(function (t) { return [cx + s * (W + 1 + 6 * t), ay + 6 + t * (600 - ay)]; }, 9);
      o += pa(ps.map(function (q, i) { return (i ? 'L' : 'M') + n(q[0]) + ',' + n(q[1]); }).join(' '), 'none', '#fff', 7) +
        pa(ps.map(function (q, i) { return (i ? 'L' : 'M') + n(q[0] + s * 3.5) + ',' + n(q[1]); }).join(' '), 'none', '#c9c4d4', 1, 'stroke-dasharray="3 3"');
      o += pa(p`M${cx + s * (W - 6)},${ay} L${cx + s * (sh - 30)},${S - 2}`, 'none', '#fff', 8) + pa(p`M${cx + s * (W - 6)},${ay} L${cx + s * (sh - 30)},${S - 2}`, 'none', '#c9c4d4', 1, 'transform="translate(' + (s * 4) + ' 0)"');
    });
    o += bust(O, '#e6e2ec', S + 66);
    o += pa(p`M${cx - nw - 6},${nb + 6} C${cx - nw - 30},${nb + 12} ${cx - 34},${nb + 40} ${cx - 4},${nb + 34}Z M${cx + nw + 6},${nb + 6} C${cx + nw + 30},${nb + 12} ${cx + 34},${nb + 40} ${cx + 4},${nb + 34}Z`, '#fff', '#b9b4c4', 1.3);
    o += bow(cx, nb + 30, 16, ac);
    return { front: o };
  },
  dress_child: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, sh = B.sh, o = '', k;
    var d = sil(B, 2, nw + 6, nlRound(B, nw + 6, 4));
    o += pa(d, clothFill(O, col), dk(col, 0.55), 2) + shade(O, d) + armLines(O, col);
    o += armSkin(O, S + 70);
    [-1, 1].forEach(function (s) {
      var pf = p`M${cx + s * (sh - 44)},${S - 6} C${cx + s * (sh + 10)},${S - 22} ${cx + s * (sh + 30)},${S + 34} ${cx + s * (sh + 16)},${S + 80} C${cx + s * (sh - 4)},${S + 90} ${cx + s * (sh - 30)},${S + 80} ${cx + s * (sh - 36)},${S + 60}Z`;
      o += pa(pf, clothFill(O, lt(col, 0.1)), dk(col, 0.5), 1.8) +
        pa(p`M${cx + s * (sh - 24)},${S - 8} Q${cx + s * (sh - 8)},${S + 36} ${cx + s * (sh - 16)},${S + 84} M${cx + s * (sh - 2)},${S - 6} Q${cx + s * (sh + 18)},${S + 36} ${cx + s * (sh + 6)},${S + 84}`, 'none', dk(col, 0.35), 1.2, op(0.5)) +
        pa(p`M${cx + s * (sh + 18)},${S + 74} Q${cx + s * (sh - 8)},${S + 94} ${cx + s * (sh - 34)},${S + 70}`, 'none', ac, 3.5);
    });
    var sm = '';
    for (k = 0; k < 4; k++) { var y = S + 60 + k * 14, z = ''; for (var x = cx - 50; x < cx + 50; x += 10) z += p`${x === cx - 50 ? 'M' : 'L'}${x},${y + (x / 10 % 2 ? 5 : 0)} `; sm += z; }
    o += pa(sm, 'none', dk(col, 0.35), 1.2, op(0.55));
    o += pa(p`M${cx - nw - 6},${nb + 4} C${cx - nw - 40},${nb + 10} ${cx - 40},${nb + 44} ${cx - 3},${nb + 36}Z M${cx + nw + 6},${nb + 4} C${cx + nw + 40},${nb + 10} ${cx + 40},${nb + 44} ${cx + 3},${nb + 36}Z`, ac, dk(ac, 0.3), 1.4);
    o += bow(cx, nb + 36, 14, dk(col, 0.25));
    for (k = 0; k < 4; k++) if (S + 110 + k * 34 < 596) o += btn(cx, S + 110 + k * 34, 4, lt(col, 0.6));
    return { front: o };
  },
  coat: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, sh = B.sh, o = '';
    var d = sil(B, 4, nw + 8, nlRound(B, nw + 8, 3));
    o += pa(d, clothFill(O, col), dk(col, 0.6), 2) + shade(O, d) + armLines(O, col);
    o += pa(p`M${cx - nw - 6},${nb + 4} L${cx + nw + 6},${nb + 4} L${cx + 40},606 L${cx - 40},606Z`, B.f ? '#f3eee8' : '#2a2530', '#8a8190', 1);
    if (!B.f) o += pa(p`M${cx - 30},${S + 20} L${cx + 30},${S + 20} L${cx + 36},606 L${cx - 36},606Z`, dk(col, 0.25), null, 0) + [0, 1, 2, 3].map(function (i) { return btn(cx, S + 60 + i * 34, 3.5, ac); }).join('');
    o += pa(p`M${cx - 14},${nb + 2} Q${cx},${nb + 14} ${cx + 14},${nb + 2} L${cx + 10},${nb + 40} Q${cx + 16},${nb + 58} ${cx},${nb + 70} Q${cx - 16},${nb + 58} ${cx - 10},${nb + 40}Z`, B.f ? ac : '#f2ede6', '#8a8190', 1.2) +
      pa(p`M${cx - 8},${nb + 36} Q${cx},${nb + 44} ${cx + 8},${nb + 36} M${cx - 10},${nb + 52} Q${cx},${nb + 60} ${cx + 10},${nb + 52}`, 'none', '#8a8190', 1, op(0.6));
    [-1, 1].forEach(function (s) {
      var lap = p`M${cx + s * (nw + 6)},${nb + 4} L${cx + s * 40},606 L${cx + s * 70},606 L${cx + s * 62},${S + 90} L${cx + s * 88},${S + 40} L${cx + s * (nw + 30)},${nb + 8}Z`;
      o += pa(lap, D.lg(0, 0, 1, 1, [[0, lt(col, 0.12)], [1, dk(col, 0.2)]]), dk(col, 0.6), 1.6) + pa(p`M${cx + s * (nw + 6)},${nb + 4} L${cx + s * 40},606`, 'none', ac, 2);
      o += pa(p`M${cx + s * (nw + 2)},${nb + 8} L${cx + s * (nw + 4)},${nb - 30} L${cx + s * (nw + 36)},${nb - 10} L${cx + s * (nw + 40)},${nb + 12}Z`, dk(col, 0.15), dk(col, 0.6), 1.5);
      [0, 1, 2].forEach(function (i) { if (S + 130 + i * 50 < 596) o += btn(cx + s * 58, S + 130 + i * 50, 5, ac); });
    });
    return { front: o };
  },
  hanbok: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, sh = B.sh, o = '';
    var gor = B.f ? dk(mix(ac, '#8a1030', 0.3), 0.1) : ac, chima = ac;
    var d = sil(B, 6, nw + 4, nlRound(B, nw + 4, 2));
    o += pa(d, clothFill(O, col), dk(col, 0.5), 2) + shade(O, d) + armLines(O, col);
    [-1, 1].forEach(function (s) { o += pa(p`M${cx + s * (sh - 6)},${S + 30} Q${cx + s * (sh + 20)},${S + 200} ${cx + s * (sh + 15)},606`, 'none', dk(col, 0.35), 1.4, op(0.5)); });
    if (B.f && B.age !== 'child') {
      var hem = S + 96;
      o += pa(p`M${cx - sh + 24},${hem} Q${cx},${hem - 10} ${cx + sh - 24},${hem} L${cx + B.wh + 40},606 L${cx - B.wh - 40},606Z`, D.lg(0, 0, 0, 1, [[0, lt(chima, 0.1)], [1, dk(chima, 0.25)]]), dk(chima, 0.5), 1.6);
      o += pa([-40, -20, 0, 20, 40].map(function (x) { return p`M${cx + x * 0.8},${hem + 4} L${cx + x * 1.3},606`; }).join(' '), 'none', dk(chima, 0.35), 1.3, op(0.5));
      o += pa(p`M${cx - sh + 24},${hem} Q${cx},${hem - 10} ${cx + sh - 24},${hem}`, 'none', lt(chima, 0.3), 3);
    }
    var git = p`M${cx + nw + 6},${nb + 2} L${cx - 34},${S + 74} L${cx - 50},${S + 70} L${cx + nw - 10},${nb - 6}Z`;
    o += pa(p`M${cx - nw - 6},${nb + 2} L${cx - 8},${S + 34} L${cx + 2},${S + 26} L${cx - nw + 6},${nb - 6}Z`, dk(col, 0.35), dk(col, 0.6), 1.2);
    o += pa(git, B.f ? gor : dk(col, 0.4), dk(col, 0.6), 1.3);
    o += pa(p`M${cx + nw + 3},${nb - 2} L${cx - 38},${S + 69} M${cx - nw - 2},${nb} L${cx - 4},${S + 28}`, 'none', '#ffffff', 4);
    var kx = cx - 40, ky = S + 76;
    o += pa(p`M${kx},${ky} C${kx - 6},${ky + 60} ${kx - 20},${ky + 140} ${kx - 16},${ky + 220} L${kx - 2},${ky + 216} C${kx - 4},${ky + 140} ${kx + 6},${ky + 60} ${kx + 6},${ky}Z`, gor, dk(gor, 0.45), 1.2) +
      pa(p`M${kx + 2},${ky} C${kx + 8},${ky + 50} ${kx + 10},${ky + 110} ${kx + 4},${ky + 170} L${kx + 18},${ky + 168} C${kx + 20},${ky + 110} ${kx + 16},${ky + 50} ${kx + 8},${ky}Z`, gor, dk(gor, 0.45), 1.2) +
      pa(p`M${kx - 4},${ky - 2} C${kx - 34},${ky - 22} ${kx - 38},${ky + 12} ${kx},${ky + 6}Z`, gor, dk(gor, 0.45), 1.2) + ell(kx + 1, ky + 2, 6, 5, dk(gor, 0.15));
    return { front: o };
  },
  tracksuit: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, sh = B.sh, o = '', k;
    var d = sil(B, 5, nw + 6, nlRound(B, nw + 6, 2));
    o += pa(d, clothFill(O, col), dk(col, 0.55), 2) + shade(O, d) + armLines(O, col);
    [-1, 1].forEach(function (s) {
      o += pa(p`M${cx + s * (sh - 6)},${S - 4} Q${cx + s * (sh + 8)},${S + 20} ${cx + s * (sh + 7)},${S + 60} L${cx + s * (sh + 12)},606`, 'none', ac, 5) +
        pa(p`M${cx + s * (sh - 16)},${S - 2} Q${cx + s * (sh - 2)},${S + 22} ${cx + s * (sh - 3)},${S + 62} L${cx + s * (sh + 1)},606`, 'none', ac, 5) +
        pa(p`M${cx + s * (nw + 16)},${nb + 10} Q${cx + s * (sh - 30)},${S + 20} ${cx + s * (sh - 26)},${S + 64}`, 'none', dk(col, 0.45), 1.3, op(0.6));
    });
    o += pa(p`M${cx - nw - 6},${nb + 12} L${cx - nw - 4},${nb - 18} Q${cx},${nb - 12} ${cx + nw + 4},${nb - 18} L${cx + nw + 6},${nb + 12} Q${cx},${nb + 18} ${cx - nw - 6},${nb + 12}Z`, lt(col, 0.05), dk(col, 0.55), 1.5) +
      pa(p`M${cx - nw - 4},${nb - 16} Q${cx},${nb - 10} ${cx + nw + 4},${nb - 16}`, 'none', ac, 2);
    o += pa(p`M${cx},${nb - 12} L${cx},606`, 'none', '#c9ccd4', 3) + pa(p`M${cx},${nb - 12} L${cx},606`, 'none', '#6a6e7a', 3, 'stroke-dasharray="1.5 2.5"');
    o += pa(p`M${cx - 3},${S + 10} h6 l1,16 h-8Z`, '#d9dce4', '#6a6e7a', 1);
    o += pa(p`M${cx + 50},${S + 50} l8,-6 l8,6 l-8,6Z`, ac, dk(ac, 0.4), 1);
    return { front: o };
  },
  martial: function (O) {
    var B = O.B, S = B.S, sh = B.sh, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, o = '';
    var d = sil(B, 4, nw + 8, nlRound(B, nw + 8, 3));
    o += pa(d, clothFill(O, col), dk(col, 0.6), 2) + shade(O, d) + armLines(O, col) + bust(O, col, S + 64);
    var sy = Math.min(S + (B.age === 'child' ? 170 : 196), 548), R0 = [cx + nw + 10, nb + 2], R1 = [cx - B.wh + 14, sy + 4], L0 = [cx - nw - 10, nb + 2], L1 = [cx + 44, S + 118];
    var X = cross(R0, R1, L0, L1);
    o += pa(p`M${L0[0]},${L0[1]} L${R0[0]},${R0[1]} L${X[0]},${X[1]}Z`, D.lg(0, 0, 0, 1, [[0, '#f7f2ea'], [1, '#d8d0c6']]), '#a8a0a0', 1);
    o += pa(p`M${L0[0] + 4},${L0[1] + 8} L${X[0] + 6},${X[1] - 6}`, 'none', '#ffffff', 5) + pa(p`M${L0[0]},${L0[1]} L${X[0]},${X[1]}`, 'none', ac, 11) + pa(p`M${L0[0] + 5},${L0[1] - 2} L${X[0] + 7},${X[1] - 4}`, 'none', dk(ac, 0.45), 1.2, op(0.7));
    o += pa(p`M${R0[0]},${R0[1]} L${R1[0]},${R1[1]}`, 'none', dk(col, 0.6), 16) + pa(p`M${R0[0] - 3},${R0[1] + 5} L${R1[0] + 2},${R1[1] - 2}`, 'none', '#f4efe6', 4) + pa(p`M${R0[0] + 5},${R0[1] + 1} L${R1[0] + 9},${R1[1]}`, 'none', ac, 10);
    o += pa(p`M${R0[0] + 10},${R0[1] + 2} L${R1[0] + 14},${R1[1] + 2}`, 'none', dk(ac, 0.45), 1.2, op(0.7));
    o += pa(p`M${cx - B.wh},${sy} C${cx - 60},${sy + 30} ${cx - 90},${sy + 120} ${cx - 70},606 M${cx + 40},${S + 60} Q${cx + 60},${S + 120} ${cx + 50},${sy - 4}`, 'none', dk(col, 0.45), 1.4, op(0.5));
    [-1, 1].forEach(function (s) {
      var x0 = cx + s * (sh - 30), x1 = cx + s * (sh + 9), y0 = 540;
      if (y0 > 600) return;
      var bd = p`M${x0},${y0} L${x1 - s * 3},${y0 - 6} L${x1},606 L${x0 + s * 2},606Z`;
      o += pa(bd, D.lg(0, 0, 1, 0, [[0, '#4a3226'], [0.5, '#7a5640'], [1, '#3a2418']]), '#241410', 1.4);
      o += pa(p`M${x0},${y0 + 6} L${x1 - s * 2},${y0} M${x0 + s * 1},${604} L${x1},${598}`, 'none', ac, 2.4);
      var lc = ''; for (var y = y0 + 14; y < 598; y += 12) lc += p`M${x0 + s * 6},${y} L${x1 - s * 8},${y + 8} M${x0 + s * 6},${y + 8} L${x1 - s * 8},${y} `;
      o += pa(lc, 'none', '#c8a878', 1.2, op(0.8));
    });
    if (sy < 590) {
      var sw = Math.min(34, 604 - sy);
      o += pa(p`M${cx - B.wh - 30},${sy - 4} Q${cx},${sy + 6} ${cx + B.wh + 30},${sy - 4} L${cx + B.wh + 32},${sy + sw} Q${cx},${sy + sw + 10} ${cx - B.wh - 32},${sy + sw}Z`, D.lg(0, sy, 0, sy + sw, [[0, dk(col, 0.4)], [0.5, dk(col, 0.62)], [1, dk(col, 0.75)]], true), dk(col, 0.8), 1.4);
      o += pa(p`M${cx - B.wh - 30},${sy + 1} Q${cx},${sy + 11} ${cx + B.wh + 30},${sy + 1} M${cx - B.wh - 32},${sy + sw - 5} Q${cx},${sy + sw + 5} ${cx + B.wh + 32},${sy + sw - 5}`, 'none', ac, 2.2);
      var kx = cx - 36, ky = sy + sw / 2 + 2;
      o += pa(p`M${kx},${ky} C${kx - 6},${ky + 30} ${kx - 16},${ky + 60} ${kx - 12},${ky + 96} L${kx + 2},${ky + 92} C${kx},${ky + 60} ${kx + 6},${ky + 30} ${kx + 6},${ky}Z M${kx + 4},${ky} C${kx + 12},${ky + 26} ${kx + 18},${ky + 54} ${kx + 14},${ky + 80} L${kx + 26},${ky + 76} C${kx + 26},${ky + 50} ${kx + 18},${ky + 26} ${kx + 10},${ky}Z`, ac, dk(ac, 0.45), 1.2);
      o += ell(kx + 3, ky, 11, 9, dk(ac, 0.1), stk(dk(ac, 0.5), 1.2)) + ell(kx, ky - 3, 4, 2.5, '#fff', op(0.35));
    }
    return { front: o };
  },
  hanfu: function (O) {
    var B = O.B, S = B.S, sh = B.sh, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, o = '', back = '';
    var wd = B.age === 'child' ? 26 : 44;
    var d = p`M${cx - nw - 8},${nb + 6} L${cx - sh + 18},${S - 2} Q${cx - sh - 4},${S + 4} ${cx - sh - 8},${S + 40} C${cx - sh - 14},${S + 120} ${cx - sh - wd},${S + 200} ${cx - sh - wd - 6},606 L${cx + sh + wd + 6},606 C${cx + sh + wd},${S + 200} ${cx + sh + 14},${S + 120} ${cx + sh + 8},${S + 40} Q${cx + sh + 4},${S + 4} ${cx + sh - 18},${S - 2} L${cx + nw + 8},${nb + 6} Q${cx},${nb + 12} ${cx - nw - 8},${nb + 6}Z`;
    o += pa(d, clothFill(O, col), dk(col, 0.55), 2) + shade(O, d);
    [-1, 1].forEach(function (s) {
      o += pa(p`M${cx + s * (sh - 26)},${S + 40} C${cx + s * (sh - 20)},${S + 140} ${cx + s * (sh - 10)},${S + 220} ${cx + s * (sh - 6)},606`, 'none', dk(col, 0.5), 1.8, op(0.6));
      o += pa(p`M${cx + s * (sh - 2)},${S + 70} C${cx + s * (sh + 6)},${S + 160} ${cx + s * (sh + wd * 0.5)},${S + 230} ${cx + s * (sh + wd * 0.6)},606 M${cx + s * (sh + 10)},${S + 150} C${cx + s * (sh + 18)},${S + 210} ${cx + s * (sh + wd * 0.8)},${S + 250} ${cx + s * (sh + wd * 0.9)},606`, 'none', dk(col, 0.4), 1.3, op(0.45));
      o += pa(p`M${cx + s * (sh - 30)},${S + 30} Q${cx + s * (sh - 6)},${S + 18} ${cx + s * (sh + 2)},${S + 60}`, 'none', '#fff', 3, op(0.25));
      var ey = Math.min(S + 250, 580), ex = cx + s * (sh + wd * 0.35);
      o += cloudCurl(ex, ey, 9, ac) + cloudCurl(ex + s * 16, ey + 16, 7, ac);
    });
    o += bust(O, col, S + 62);
    var sy = B.f && B.age !== 'child' ? S + 118 : Math.min(S + 190, 540);
    var R0 = [cx + nw + 10, nb + 4], R1 = [cx - 52, sy + 2], L0 = [cx - nw - 10, nb + 4], L1 = [cx + 52, sy + 2];
    var X = cross(R0, R1, L0, L1);
    o += pa(p`M${L0[0]},${L0[1]} L${R0[0]},${R0[1]} L${X[0]},${X[1]}Z`, D.lg(0, 0, 0, 1, [[0, '#fbf8f2'], [1, '#e4ddd4']]), '#b0a8a8', 1);
    var lay = [[18, ac], [12, lt(mix(col, '#ffffff', 0.4), 0.3)], [6, '#fbf8f4']];
    lay.forEach(function (L, i) {
      o += pa(p`M${L0[0] + i * 3},${L0[1] + i * 2} L${X[0] + i * 3},${X[1] - i * 3}`, 'none', dk(L[1], 0.35), L[0] + 2) + pa(p`M${L0[0] + i * 3},${L0[1] + i * 2} L${X[0] + i * 3},${X[1] - i * 3}`, 'none', L[1], L[0]);
    });
    o += pa(p`M${R0[0]},${R0[1]} L${R1[0]},${R1[1]} L${cx + sh},${sy} L${cx + nw + 30},${nb + 4}Z`, clothFill(O, lt(col, 0.04)), null, 0);
    lay.slice().reverse().forEach(function (L, i) {
      var k = 2 - i;
      o += pa(p`M${R0[0] + k * 4},${R0[1]} L${R1[0] + k * 5},${R1[1]}`, 'none', dk(L[1], 0.35), L[0] + 2) + pa(p`M${R0[0] + k * 4},${R0[1]} L${R1[0] + k * 5},${R1[1]}`, 'none', L[1], L[0]);
    });
    var st = ''; for (var t = 0.1; t < 0.95; t += 0.14) { var q = [lerpN(R0[0], R1[0], t) + 16, lerpN(R0[1], R1[1], t)]; st += p`M${q[0] - 3},${q[1]} l3,-3 l3,3 l-3,3Z `; }
    o += pa(st, lt(ac, 0.5), dk(ac, 0.4), 0.6);
    if (sy < 590) {
      var sw = B.f && B.age !== 'child' ? 30 : 24;
      o += pa(p`M${cx - B.wh - 34},${sy - 2} Q${cx},${sy + 8} ${cx + B.wh + 34},${sy - 2} L${cx + B.wh + 36},${sy + sw} Q${cx},${sy + sw + 10} ${cx - B.wh - 36},${sy + sw}Z`, D.lg(0, sy, 0, sy + sw, [[0, lt(ac, 0.2)], [1, dk(ac, 0.3)]], true), dk(ac, 0.5), 1.3);
      var ew = ''; for (var x = cx - B.wh - 20; x < cx + B.wh + 24; x += 16) ew += p`M${x},${sy + sw / 2 + 3} q4,-6 8,0 q4,6 8,0 `;
      o += pa(ew, 'none', lt(ac, 0.6), 1.2, op(0.8));
      var ky = sy + sw / 2 + 4;
      o += pa(p`M${cx - 4},${ky} C${cx - 10},${ky + 50} ${cx - 22},${ky + 110} ${cx - 16},${ky + 190} L${cx - 4},${ky + 186} C${cx - 6},${ky + 110} ${cx},${ky + 50} ${cx + 2},${ky}Z M${cx + 2},${ky} C${cx + 8},${ky + 40} ${cx + 20},${ky + 90} ${cx + 16},${ky + 160} L${cx + 28},${ky + 156} C${cx + 30},${ky + 90} ${cx + 16},${ky + 40} ${cx + 8},${ky}Z`, lt(ac, 0.15), dk(ac, 0.45), 1.1);
      o += pa(p`M${cx - 22},${ky - 2} C${cx - 44},${ky - 22} ${cx - 50},${ky + 10} ${cx - 2},${ky + 2}Z M${cx + 22},${ky - 2} C${cx + 44},${ky - 22} ${cx + 50},${ky + 10} ${cx + 2},${ky + 2}Z`, lt(ac, 0.1), dk(ac, 0.45), 1.1) + ell(cx, ky, 7, 6, dk(ac, 0.15), stk(dk(ac, 0.5), 1));
      if (ky + 80 < 600) { o += pa(p`M${cx + 40},${ky} L${cx + 40},${ky + 40}`, 'none', '#6a8a6a', 1.4) + pa(p`M${cx + 30},${ky + 40} h20 q4,12 -10,22 q-14,-10 -10,-22Z`, D.lg(0, 0, 1, 1, [[0, '#d8f0dc'], [1, '#6aa888']]), '#3a6a50', 1.1) + pa(p`M${cx + 40},${ky + 62} l-3,20 M${cx + 40},${ky + 62} l0,22 M${cx + 40},${ky + 62} l3,20`, 'none', ac, 1.4); }
    }
    if (B.f) o += pa(p`M${cx - sh + 10},${S + 6} C${cx - sh - 24},${S + 80} ${cx - sh - wd - 20},${S + 200} ${cx - sh - wd - 24},606 L${cx - sh - wd + 30},606 C${cx - sh + 10},${S + 190} ${cx - sh + 24},${S + 80} ${cx - sh + 40},${S + 4}Z M${cx + sh - 10},${S + 6} C${cx + sh + 24},${S + 80} ${cx + sh + wd + 20},${S + 200} ${cx + sh + wd + 24},606 L${cx + sh + wd - 30},606 C${cx + sh - 10},${S + 190} ${cx + sh - 24},${S + 80} ${cx + sh - 40},${S + 4}Z`, '#ffffff', '#ffffff', 1, op(0.22));
    return { back: back, front: o };
  },
  royal: function (O) {
    var B = O.B, S = B.S, sh = B.sh, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, o = '', gd = gold(D);
    var d = sil(B, 6, nw + 10, nlRound(B, nw + 10, 4));
    o += pa(d, clothFill(O, col), dk(col, 0.6), 2) + shade(O, d) + armLines(O, col) + bust(O, col, S + 70);
    o += ell(cx, nb + 2, nw + 16, 17, 'none', stk(dk(col, 0.62), 15)) + ell(cx, nb + 2, nw + 16, 17, 'none', stk(dk(col, 0.12), 12)) +
      ell(cx, nb + 2, nw + 7, 11, 'none', stk('#f4efe6', 3.4)) + pa(p`M${cx - nw - 20},${nb - 6} Q${cx},${nb - 24} ${cx + nw + 20},${nb - 6}`, 'none', lt(col, 0.3), 2, op(0.5));
    o += pa(p`M${cx + nw + 6},${nb + 12} Q${cx + nw + 30},${nb + 36} ${cx + sh - 20},${S + 30}`, 'none', dk(col, 0.6), 1.5, op(0.6));
    var rd = B.age === 'child' ? 32 : B.f ? 40 : 48, my = S + (B.age === 'child' ? 80 : 96);
    o += medallion(D, cx, my, rd, col, gd);
    [-1, 1].forEach(function (s) {
      var q = [cx + s * (sh - 30), S + 8];
      o += '<g transform="translate(' + n(q[0]) + ' ' + n(q[1]) + ') scale(' + (s * 0.9) + ' 0.42)">' + medallion(D, 0, 0, rd * 0.8, col, gd, 1) + '</g>';
    });
    var sy = Math.min(my + rd + (B.age === 'child' ? 44 : 64), 560);
    if (sy < 594) {
      var jade = D.lg(0, 0, 0, 1, [[0, '#e6fff0'], [0.5, '#8ed2a8'], [1, '#3a8a64']]);
      o += pa(p`M${cx - sh + 8},${sy - 16} Q${cx},${sy + 18} ${cx + sh - 8},${sy - 16} L${cx + sh - 6},${sy + 2} Q${cx},${sy + 36} ${cx - sh + 6},${sy + 2}Z`, D.lg(0, 0, 0, 1, [[0, '#4a1620'], [1, '#1e0a10']]), '#140608', 1.4);
      for (var k = -3; k <= 3; k++) {
        var t = (k + 3) / 6, q = qb([cx - sh + 22, sy - 8], [cx, sy + 26], [cx + sh - 22, sy - 8], t);
        o += '<rect x="' + n(q[0] - 9) + '" y="' + n(q[1] - 6) + '" width="18" height="13" rx="2" fill="' + jade + '" stroke="#c9a040" stroke-width="1.6"/>';
      }
    }
    return { front: o };
  },
  office: function (O) {
    var B = O.B, S = B.S, sh = B.sh, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, o = '';
    var shirt = '#f6f5f2', sl = '#b8b6c0';
    if (B.f) {
      var d = sil(B, 4, nw + 10, nlRound(B, nw + 10, 5));
      o += pa(d, D.lg(0, S - 30, 0, 606, [[0, '#ffffff'], [1, '#e6e4ec']], true), sl, 1.6) + bust(O, '#c8c6d4', S + 66);
      o += pa(p`M${cx - nw - 10},${nb + 4} L${cx - 2},${nb + 30} L${cx - 26},${nb + 40}Z M${cx + nw + 10},${nb + 4} L${cx + 2},${nb + 30} L${cx + 26},${nb + 40}Z`, '#ffffff', sl, 1.2);
      for (var k = 0; k < 4; k++) if (nb + 50 + k * 34 < 600) o += circ(cx, nb + 50 + k * 34, 2.6, '#f0eef4', stk(sl, 0.8));
      [-1, 1].forEach(function (s) {
        var cg = p`M${cx + s * (nw + 12)},${nb + 4} L${cx + s * (sh - 18)},${S - 2} Q${cx + s * (sh + 3)},${S + 3} ${cx + s * (sh + 4)},${S + 36} L${cx + s * (sh + 9)},606 L${cx + s * 34},606 C${cx + s * 40},${S + 160} ${cx + s * 50},${S + 40} ${cx + s * (nw + 12)},${nb + 4}Z`;
        o += pa(cg, clothFill(O, col), dk(col, 0.5), 1.8);
        o += pa(p`M${cx + s * (nw + 12)},${nb + 4} C${cx + s * 50},${S + 40} ${cx + s * 40},${S + 160} ${cx + s * 34},606`, 'none', lt(col, 0.2), 6) + pa(p`M${cx + s * (nw + 12)},${nb + 4} C${cx + s * 50},${S + 40} ${cx + s * 40},${S + 160} ${cx + s * 34},606`, 'none', dk(col, 0.3), 1, 'stroke-dasharray="1 3"');
        o += pa(p`M${cx + s * (sh - 28)},${S + 60} C${cx + s * (sh - 26)},${S + 140} ${cx + s * (sh - 20)},${S + 220} ${cx + s * (sh - 16)},606`, 'none', dk(col, 0.4), 1.6, op(0.55));
        var kn = ''; for (var y = S + 30; y < 600; y += 9) kn += p`M${cx + s * (sh - 50)},${y} l${s * 3},4 l${s * 3},-4 `;
        o += pa(kn, 'none', dk(col, 0.25), 1, op(0.3));
      });
      [0, 1, 2].forEach(function (i) { var y = S + 120 + i * 46; if (y < 596) o += btn(cx - 44 + i * 3, y, 4, lt(col, 0.5)); });
    } else {
      var d2 = sil(B, 4, nw + 8, nlRound(B, nw + 8, 3));
      o += pa(d2, D.lg(0, S - 30, 0, 606, [[0, '#ffffff'], [1, '#dcdde6']], true), sl, 1.8) + shade(O, d2) + armLines(O, '#c8cad8');
      o += pa(p`M${cx - nw - 4},${nb - 10} L${cx - 6},${nb + 16} L${cx - nw - 22},${nb + 22}Z M${cx + nw + 4},${nb - 10} L${cx + 8},${nb + 14} L${cx + nw + 22},${nb + 22}Z`, '#ffffff', sl, 1.2);
      o += pa(p`M${cx - 7},${nb + 4} L${cx},${nb + 22} L${cx + 7},${nb + 4}`, dk('#f0d8c8', 0.08), 'none');
      var vy = S + 104;
      var vest = p`M${cx - sh + 36},${S + 6} L${cx - nw - 20},${nb + 20} L${cx},${vy} L${cx + nw + 20},${nb + 20} L${cx + sh - 36},${S + 6} C${cx + sh - 30},${S + 80} ${cx + sh - 34},${S + 200} ${cx + sh - 30},606 L${cx - sh + 30},606 C${cx - sh + 34},${S + 200} ${cx - sh + 30},${S + 80} ${cx - sh + 36},${S + 6}Z`;
      if (O.acx) {
        o += pa(p`M${cx - 6},${nb + 18} L${cx + 8},${nb + 18} L${cx + 6},${nb + 30} L${cx - 5},${nb + 30}Z`, dk(ac, 0.1), dk(ac, 0.5), 1) +
          pa(p`M${cx - 5},${nb + 30} L${cx + 6},${nb + 30} L${cx + 14},${vy + 30} L${cx + 4},${vy + 44} L${cx - 6},${vy + 30}Z`, D.lg(0, 0, 1, 0, [[0, ac], [0.5, lt(ac, 0.15)], [1, dk(ac, 0.2)]]), dk(ac, 0.5), 1);
      }
      o += pa(vest, clothFill(O, col), dk(col, 0.6), 1.8);
      o += pa(p`M${cx - nw - 20},${nb + 20} L${cx},${vy} L${cx + nw + 20},${nb + 20}`, 'none', lt(col, 0.2), 1.4);
      o += pa(p`M${cx},${vy} L${cx},606`, 'none', dk(col, 0.55), 1.4);
      [0, 1, 2, 3].forEach(function (i) { var y = vy + 18 + i * 34; if (y < 598) o += btn(cx - 5, y, 3.6, dk(col, 0.3)); });
      [-1, 1].forEach(function (s) { if (S + 170 < 596) o += pa(p`M${cx + s * 34},${S + 170} l${s * 34},-2`, 'none', dk(col, 0.55), 1.6); });
    }
    return { front: o };
  },
  priest: function (O) {
    var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, sh = B.sh, o = '';
    var d = sil(B, 6, nw + 4, nlRound(B, nw + 4, 2));
    o += pa(d, clothFill(O, col), dk(col, 0.45), 2) + shade(O, d) + armLines(O, col);
    [-1, 1].forEach(function (s) { o += pa(p`M${cx + s * 60},${S + 40} Q${cx + s * 74},${S + 180} ${cx + s * 70},606`, 'none', dk(col, 0.3), 1.3, op(0.5)); });
    o += pa(p`M${cx - nw - 4},${nb + 12} L${cx - nw - 3},${nb - 16} Q${cx},${nb - 11} ${cx + nw + 3},${nb - 16} L${cx + nw + 4},${nb + 12} Q${cx},${nb + 18} ${cx - nw - 4},${nb + 12}Z`, lt(col, 0.1), dk(col, 0.45), 1.4);
    var stole = D.lg(0, 0, 1, 0, [[0, dk(ac, 0.3)], [0.4, lt(ac, 0.25)], [1, dk(ac, 0.2)]]);
    [-1, 1].forEach(function (s) {
      o += pa(p`M${cx + s * (nw + 2)},${nb - 6} L${cx + s * (nw + 22)},${nb + 2} L${cx + s * 52},606 L${cx + s * 22},606 L${cx + s * 12},${nb + 30}Z`, stole, dk(ac, 0.5), 1.4);
      var yc = Math.min(S + 180, 560), xc = cx + s * 36;
      o += pa(p`M${xc - 2.5},${yc - 14} h5 v9 h9 v5 h-9 v14 h-5 v-14 h-9 v-5 h9Z`, '#fff8e0', dk(ac, 0.5), 0.8);
      o += pa(p`M${cx + s * (nw + 14)},${nb + 6} L${cx + s * 46},600`, 'none', '#fff4d0', 1, op(0.6) + ' stroke-dasharray="3 4"');
    });
    return { front: o };
  }
};
function bow(x, y, r, c) {
  return pa(p`M${x},${y} C${x - r * 1.6},${y - r * 1.2} ${x - r * 1.8},${y + r * 0.8} ${x},${y}Z M${x},${y} C${x + r * 1.6},${y - r * 1.2} ${x + r * 1.8},${y + r * 0.8} ${x},${y}Z`, c, dk(c, 0.45), 1.2) +
    pa(p`M${x - 2},${y + 2} L${x - r * 0.8},${y + r * 1.6} L${x - r * 0.3},${y + r * 1.4} M${x + 2},${y + 2} L${x + r * 0.8},${y + r * 1.6} L${x + r * 0.3},${y + r * 1.4}`, c, dk(c, 0.45), 1.2) +
    ell(x, y, r * 0.3, r * 0.34, dk(c, 0.15), stk(dk(c, 0.45), 1));
}
function cross(a, b, c, d) {
  var x1 = b[0] - a[0], y1 = b[1] - a[1], x2 = d[0] - c[0], y2 = d[1] - c[1], den = x1 * y2 - y1 * x2 || 1;
  var t = ((c[0] - a[0]) * y2 - (c[1] - a[1]) * x2) / den;
  return [a[0] + x1 * t, a[1] + y1 * t];
}
function lerpN(a, b, t) { return a + (b - a) * t; }
function cloudCurl(x, y, r, c) {
  return pa(p`M${x - r},${y} a${r * 0.5},${r * 0.5} 0 1 1 ${r},0 a${r * 0.5},${r * 0.5} 0 1 1 ${r},0 M${x - r * 0.4},${y + r * 0.3} q${r * 0.4},${r * 0.5} ${r * 1.2},${r * 0.1}`, 'none', c, 1.4, op(0.85));
}
function medallion(D, x, y, r, col, gd, small) {
  var o = circ(x, y, r, gd, stk('#7a5212', 1.6)) + circ(x, y, r * 0.86, dk(col, 0.25), stk('#f6d67a', 1.2));
  /* coiled dragon: body S-curve with scales, head, claws and clouds */
  var b = p`M${x - r * 0.55},${y + r * 0.45} C${x - r * 0.8},${y - r * 0.1} ${x - r * 0.2},${y - r * 0.55} ${x + r * 0.2},${y - r * 0.3} C${x + r * 0.6},${y - r * 0.05} ${x + r * 0.2},${y + r * 0.45} ${x - r * 0.1},${y + r * 0.2} C${x - r * 0.3},${y + r * 0.05} ${x - r * 0.05},${y - r * 0.2} ${x + r * 0.2},${y - r * 0.05}`;
  o += pa(b, 'none', '#8a5a14', r * 0.2) + pa(b, 'none', gd, r * 0.14) + pa(b, 'none', '#fff4c2', r * 0.04, 'stroke-dasharray="' + n(r * 0.06) + ' ' + n(r * 0.08) + '"');
  if (!small) {
    o += pa(p`M${x + r * 0.2},${y - r * 0.3} l${r * 0.2},${-r * 0.14} l${r * 0.06},${r * 0.12} l${r * 0.16},${-r * 0.02} l${-r * 0.08},${r * 0.14} Z`, gd, '#7a5212', 1);
    o += circ(x + r * 0.34, y - r * 0.33, r * 0.035, '#c83030') + pa(p`M${x + r * 0.44},${y - r * 0.44} q${r * 0.12},${-r * 0.1} ${r * 0.24},${-r * 0.02} M${x + r * 0.42},${y - r * 0.3} q${r * 0.14},${r * 0.02} ${r * 0.22},${r * 0.12}`, 'none', '#f6d67a', 1.2);
    [[-0.6, 0.05], [0.42, 0.3], [-0.2, 0.52]].forEach(function (q) { o += pa(p`M${x + r * q[0]},${y + r * q[1]} l${-r * 0.08},${r * 0.1} M${x + r * q[0]},${y + r * q[1]} l${r * 0.02},${r * 0.12} M${x + r * q[0]},${y + r * q[1]} l${r * 0.1},${r * 0.08}`, 'none', gd, 1.4); });
    o += cloudCurl(x - r * 0.45, y - r * 0.55, r * 0.14, '#f6d67a') + cloudCurl(x + r * 0.4, y + r * 0.55, r * 0.14, '#f6d67a') + circ(x - r * 0.05, y - r * 0.02, r * 0.07, '#ffe6a0', stk('#c83030', 1));
  }
  return o;
}
function suitLike(O, school) {
  var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, o = '';
  var vy = school ? S + 110 : S + 150;
  var d = sil(B, 4, nw + 8, nlRound(B, nw + 8, 3));
  o += pa(d, clothFill(O, col), dk(col, 0.6), 2) + shade(O, d) + armLines(O, col);
  o += pa(p`M${cx - nw - 8},${nb + 4} L${cx},${vy} L${cx + nw + 8},${nb + 4}Z`, '#f5f3f0', '#b8b2bc', 1);
  o += pa(p`M${cx - 7},${nb + 12} L${cx + 7},${nb + 12} L${cx + 5},${nb + 24} L${cx - 5},${nb + 24}Z`, dk(ac, 0.1), dk(ac, 0.5), 1) +
    pa(p`M${cx - 5},${nb + 24} L${cx + 5},${nb + 24} L${cx + 11},${vy + 40} L${cx},${vy + 54} L${cx - 11},${vy + 40}Z`, D.lg(0, 0, 1, 0, [[0, ac], [0.5, lt(ac, 0.15)], [1, dk(ac, 0.2)]]), dk(ac, 0.5), 1);
  if (school) o += pa(p`M${cx - 6},${nb + 40} l14,12 M${cx - 8},${nb + 62} l18,15 M${cx - 9},${nb + 86} l20,16`, 'none', lt(ac, 0.6), 2.5, op(0.7));
  o += pa(p`M${cx - nw - 4},${nb - 8} L${cx - 3},${nb + 16} L${cx - nw - 18},${nb + 22}Z M${cx + nw + 4},${nb - 8} L${cx + 3},${nb + 16} L${cx + nw + 18},${nb + 22}Z`, '#fff', '#a9a2ae', 1.2);
  [-1, 1].forEach(function (s) {
    var lap = p`M${cx + s * (nw + 8)},${nb + 2} L${cx + s * 1},${vy + 8} L${cx + s * 30},${vy - 30} L${cx + s * 58},${S + 42} L${cx + s * 48},${S + 32} L${cx + s * 54},${S + 18} L${cx + s * (nw + 22)},${nb + 4}Z`;
    o += pa(lap, D.lg(0, 0, 1, 1, [[0, lt(col, 0.15)], [1, dk(col, 0.25)]]), dk(col, 0.65), 1.5);
    o += pa(p`M${cx + s * (nw + 12)},${nb + 6} L${cx + s * 4},${vy}`, 'none', lt(col, 0.35), 1, op(0.6));
  });
  o += pa(p`M${cx},${vy + 8} L${cx + 3},606`, 'none', dk(col, 0.6), 1.5);
  [0, 1].forEach(function (i) { if (vy + 40 + i * 56 < 596) o += btn(cx + 9, vy + 40 + i * 56, 4.5, school ? ac : dk(col, 0.3)); });
  if (school) o += pa(p`M${cx + 58},${S + 70} h28 v8 q-14,26 -14,26 q-14,-4 -14,-26Z`, ac, lt(ac, 0.6), 1.4) + pa(p`M${cx + 66},${S + 80} l6,8 l6,-8`, 'none', '#fff', 1.2);
  else o += pa(p`M${cx + 60},${S + 78} L${cx + 92},${S + 78}`, 'none', dk(col, 0.6), 1.5) + pa(p`M${cx + 64},${S + 78} l6,-10 l5,7 l5,-9 l5,12Z`, lt(ac, 0.2), dk(ac, 0.4), 0.8);
  return { front: o };
}
function sailor(O) {
  var B = O.B, S = B.S, col = O.col, ac = O.ac, D = O.D, cx = 200, nb = B.nb, nw = B.nw, sh = B.sh, o = '';
  var body = '#f6f5f2';
  var d = sil(B, 3, nw + 6, nlRound(B, nw + 6, 2));
  o += pa(d, D.lg(0, S - 30, 0, 606, [[0, '#ffffff'], [1, '#dcdde6']], true), '#9a9cb0', 2) + shade(O, d) + armLines(O, '#c9cad8') + bust(O, '#c9cad8', S + 70);
  var vy = S + 96;
  var col1 = p`M${cx - nw - 6},${nb + 4} L${cx - sh + 16},${S - 2} L${cx - sh + 18},${S + 46} L${cx},${vy} L${cx + sh - 18},${S + 46} L${cx + sh - 16},${S - 2} L${cx + nw + 6},${nb + 4} L${cx},${S + 50}Z`;
  o += pa(col1, clothFill(O, col), dk(col, 0.5), 1.8);
  [7, 12].forEach(function (k) {
    o += pa(p`M${cx - sh + 16 + k},${S + 2} L${cx - sh + 18 + k},${S + 46 - k * 0.5} L${cx},${vy - k * 1.3} L${cx + sh - 18 - k},${S + 46 - k * 0.5} L${cx + sh - 16 - k},${S + 2}`, 'none', '#fff', 1.6, op(0.9));
  });
  o += bow(cx, vy - 6, 20, ac);
  o += pa(p`M${cx - 6},${vy} L${cx - 14},${vy + 60} L${cx},${vy + 52} L${cx + 14},${vy + 60} L${cx + 6},${vy}Z`, ac, dk(ac, 0.45), 1.2);
  return { front: o };
}

/* --------------------------------------------------------- accessories */
function gold(D) { return D.lg(0, 0, 0, 1, [[0, '#fff4c2'], [0.45, '#e6b640'], [1, '#94621a']]); }
function headAcc(D, a, L, E, m, F) {
  var o = '', ac = L.accent || '#d8435e', gd = gold(D);
  if (a.headband) {
    var hb = lum(ac) > 0.8 ? '#c0392b' : ac;
    o += pa('M76,-60 C98,-58 116,-42 128,-6 L116,-2 C106,-32 94,-46 74,-50Z M76,-56 C96,-48 104,-26 106,12 L94,12 C94,-18 88,-38 72,-46Z', D.lg(0, 0, 1, 1, [[0, lt(hb, 0.15)], [1, dk(hb, 0.35)]]), dk(hb, 0.5), 1.2);
    o += pa('M-80,-60 Q0,-104 80,-60 L79,-46 Q0,-90 -79,-46Z', D.lg(0, -104, 0, -46, [[0, lt(hb, 0.2)], [1, dk(hb, 0.2)]], true), dk(hb, 0.5), 1.3) +
      pa('M-74,-55 Q0,-97 74,-55', 'none', lt(hb, 0.45), 1.2, op(0.7)) + pa('M-60,-60 l6,8 M-40,-70 l5,8 M40,-70 l-5,8 M60,-60 l-6,8', 'none', dk(hb, 0.35), 1, op(0.5)) +
      ell(78, -54, 8, 7, dk(hb, 0.1), stk(dk(hb, 0.5), 1.2));
  }
  if (a.gat) {
    var gb = D.lg(0, -130, 0, -86, [[0, '#2a2a32'], [1, '#08080c']], true);
    o += pa(p`M${-62},-96 C-58,-80 -58,40 -52,${F.chin + 10} M62,-96 C58,-80 58,40 52,${F.chin + 10}`, 'none', '#2a2026', 1.2, op(0.8));
    var bd2 = ['', '']; for (var k = 0; k < 12; k++) { var t = k / 11, yb = F.chin + 14 + 70 * t; [-1, 1].forEach(function (s) { var xb = s * (52 - 24 * t * t); bd2[k % 3 ? 0 : 1] += p`M${xb - 2.6},${yb} a2.6,2.6 0 1 0 5.2,0 a2.6,2.6 0 1 0 -5.2,0Z`; }); }
    o += pa(bd2[0], '#c8783a', '#6a3a14', 0.6) + pa(bd2[1], '#f0c060', '#6a3a14', 0.6);
    o += ell(0, -98, 148, 26, '#14121a', 'fill-opacity=".5" stroke="#08080c" stroke-width="2"') + ell(0, -98, 138, 21, 'none', 'stroke="#3a3844" stroke-width="1" opacity=".6"');
    var rl = ''; for (var k2 = 0; k2 < 16; k2++) { var an = PI * k2 / 16; rl += p`M${Math.cos(an) * 60},${-98 + Math.sin(an) * 12} L${Math.cos(an) * 146},${-98 + Math.sin(an) * 25} `; }
    o += pa(rl, 'none', '#3a3844', 0.8, op(0.5));
    o += pa('M-54,-100 L-48,-166 Q0,-176 48,-166 L54,-100 Q0,-88 -54,-100Z', gb, '#050508', 1.6, 'fill-opacity=".92"') + ell(0, -166, 48, 8, '#1e1c24', stk('#050508', 1.4)) +
      pa('M-54,-112 Q0,-100 54,-112 L54,-100 Q0,-88 -54,-100Z', '#050508') + pa('M-40,-110 L-36,-160', 'none', '#fff', 2, op(0.2));
    [-1, 1].forEach(function (s) { o += circ(s * 62, -96, 4, '#f0c060', stk('#6a3a14', 0.8)); });
  }

  if (a.veil) o += pa('M-88,-54 C-94,-146 94,-146 88,-54 C60,-104 -60,-104 -88,-54Z', '#ffffff', '#ffffff', 1, op(0.45)) + pa('M-88,-54 C-60,-104 60,-104 88,-54', 'none', '#fff', 2, op(0.7) + ' stroke-dasharray="2 4"');
  if (a.maidcap) {
    var mc = '', k;
    for (k = 0; k <= 8; k++) { var t = k / 8, q = qb([-66, -104], [0, -150], [66, -104], t); mc += circ(q[0], q[1] - 4, 8, '#fff', stk('#c9c4d4', 1)); }
    o += mc + pa('M-68,-100 Q0,-146 68,-100 L64,-92 Q0,-134 -64,-92Z', '#fff', '#c9c4d4', 1.2) + pa('M-40,-114 Q0,-138 40,-114', 'none', '#23202a', 3);
  }
  if (a.hat) {
    var hc = L.hatColor;
    if (m) {
      o += ell(0, -96, 100, 18, dk(hc, 0.2), stk(dk(hc, 0.6), 1.6)) + pa('M-56,-102 L-60,-172 Q0,-180 60,-172 L56,-102 Q0,-92 -56,-102Z', D.lg(0, 0, 1, 0, [[0, dk(hc, 0.3)], [0.35, lt(hc, 0.15)], [1, dk(hc, 0.4)]]), dk(hc, 0.6), 1.6) +
        pa('M-57,-116 Q0,-106 57,-116 L57,-102 Q0,-92 -57,-102Z', ac, dk(ac, 0.4), 1) + ell(0, -172, 60, 9, lt(hc, 0.1), stk(dk(hc, 0.5), 1.2));
    } else {
      o += pa('M-126,-96 C-120,-128 120,-128 126,-96 C110,-80 -110,-80 -126,-96Z', D.lg(0, 0, 0, 1, [[0, lt(hc, 0.2)], [1, dk(hc, 0.25)]]), dk(hc, 0.55), 1.6) +
        pa('M-62,-108 C-64,-172 64,-172 62,-108 Q0,-118 -62,-108Z', D.lg(0, 0, 1, 0, [[0, lt(hc, 0.1)], [1, dk(hc, 0.3)]]), dk(hc, 0.55), 1.6) +
        pa('M-62,-120 Q0,-132 62,-120 L62,-108 Q0,-120 -62,-108Z', ac, dk(ac, 0.4), 1) + flower(50, -118, 12, '#fff3f6');
    }
  }
  if (a.crown) {
    o += pa('M-46,-116 L-54,-162 L-30,-138 L-16,-176 L0,-142 L16,-176 L30,-138 L54,-162 L46,-116 Q0,-128 -46,-116Z', gd, '#7a5212', 1.6) +
      pa('M-47,-120 Q0,-132 47,-120 L46,-108 Q0,-120 -46,-108Z', gd, '#7a5212', 1.4) +
      circ(0, -118, 5, L.gem, stk('#fff', 1)) + circ(-26, -116, 3.5, '#3a7bd5', stk('#fff', 0.8)) + circ(26, -116, 3.5, '#3a7bd5', stk('#fff', 0.8)) +
      circ(-54, -164, 4, gd) + circ(-16, -178, 4, gd) + circ(16, -178, 4, gd) + circ(54, -164, 4, gd) + pa('M-40,-124 L-44,-150', 'none', '#fff', 1.5, op(0.6));
  }
  if (a.tiara) {
    var sv = D.lg(0, 0, 0, 1, [[0, '#ffffff'], [0.5, '#d4d6ea'], [1, '#8a8cab']]);
    o += pa('M-50,-102 Q0,-126 50,-102 L46,-97 Q0,-118 -46,-97Z', sv, '#6a6c88', 1.2) +
      pa('M-16,-112 Q-10,-126 0,-140 Q10,-126 16,-112Z M-38,-106 L-32,-122 L-24,-110Z M38,-106 L32,-122 L24,-110Z', sv, '#6a6c88', 1.2) +
      ell(0, -120, 5, 7, L.gem, stk('#fff', 1)) + circ(-32, -113, 2.5, L.gem) + circ(32, -113, 2.5, L.gem);
  }
  if (a.ribbon) o += '<g transform="translate(56 -108) rotate(24)">' + bow(0, 0, 22, lum(ac) > 0.82 ? '#e2456a' : ac) + '</g>';
  if (a.hairpin) o += '<g transform="translate(-50 -64) rotate(-28)">' + pa('M-3,-14 h5 v28 h-5Z M6,-12 h5 v28 h-5Z', gd, '#7a5212', 0.8) + pa('M4,-24 l3,6 6,1 -4,4 1,6 -6,-3 -6,3 1,-6 -4,-4 6,-1Z', ac, dk(ac, 0.4), 0.8) + '</g>';
  if (a.flower) o += flower(-66, -84, 16, lum(L.hair) > 0.6 ? '#e2587c' : '#f8c2d4');
  if (a.headphones) {
    o += pa('M-88,4 C-100,-160 100,-160 88,4', 'none', '#2b2833', 11) + pa('M-84,-20 C-94,-150 94,-150 84,-20', 'none', '#5d5868', 3, op(0.8));
    [-1, 1].forEach(function (s) { o += '<rect x="' + (s * 88 - 15) + '" y="-24" width="30" height="52" rx="13" fill="#2b2833" stroke="' + ac + '" stroke-width="3"/>' + ell(s * 88 - 4, -8, 4, 10, '#fff', op(0.25)); });
  }
  if (a.glasses) {
    [-1, 1].forEach(function (s) {
      var x = s * E.x, y = E.y + 3, rw = E.w * 0.66, rh = Math.max(E.h * 0.62, 17);
      o += '<rect x="' + n(x - rw) + '" y="' + n(y - rh) + '" width="' + n(rw * 2) + '" height="' + n(rh * 2) + '" rx="' + (m ? 5 : 11) + '" fill="#e8f2ff" fill-opacity=".14" stroke="#3a3040" stroke-width="2.4"/>' +
        pa(p`M${x - rw * 0.6},${y + rh * 0.5} L${x - rw * 0.1},${y - rh * 0.6} M${x - rw * 0.2},${y + rh * 0.6} L${x + rw * 0.1},${y + rh * 0.05}`, 'none', '#fff', 2, op(0.5));
      o += pa(p`M${x + s * rw},${y - rh * 0.4} L${s * 68},${y - 6}`, 'none', '#3a3040', 2.2);
    });
    o += pa(p`M${-E.x + E.w * 0.66},${E.y - 2} Q0,${E.y - 8} ${E.x - E.w * 0.66},${E.y - 2}`, 'none', '#3a3040', 2.2);
  }
  if (a.monocle) {
    var mx = E.x, my2 = E.y + 3, r = Math.max(E.w * 0.6, E.h * 0.66);
    o += circ(mx, my2, r, '#eaf4ff', 'fill-opacity=".15" stroke="#c89a3a" stroke-width="3"') + pa(p`M${mx - r * 0.5},${my2 + r * 0.2} L${mx - r * 0.1},${my2 - r * 0.5}`, 'none', '#fff', 2, op(0.6)) +
      pa(p`M${mx + r * 0.7},${my2 + r * 0.7} C${mx + 30},${my2 + 50} ${mx + 40},${my2 + 80} ${mx + 34},${my2 + 120}`, 'none', '#c89a3a', 1.4, 'stroke-dasharray="3 2"');
  }
  if (a.earrings) [-1, 1].forEach(function (s) { o += circ(s * 67, 42, 3, gd) + pa(p`M${s * 67},${45} C${s * 61},${54} ${s * 62},${62} ${s * 67},${62} C${s * 72},${62} ${s * 73},${54} ${s * 67},${45}Z`, L.gem, stk('#fff', 1)); });
  return o;
}
function flower(x, y, r, c) {
  var o = '', k;
  for (k = 0; k < 5; k++) { var a = k * Math.PI * 2 / 5 - Math.PI / 2; o += ell(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.36, c, stk(dk(c, 0.3), 0.8) + ' transform="rotate(' + n(a * 180 / Math.PI) + ' ' + n(x + Math.cos(a) * r * 0.55) + ' ' + n(y + Math.sin(a) * r * 0.55) + ')"'); }
  return pa(p`M${x + r * 0.4},${y + r * 0.5} q${r},${r * 0.2} ${r * 1.2},${r * 1.1} q${-r},${0} ${-r * 1.2},${-r * 1.1}Z`, '#6aa56a', '#3f6e45', 0.8) + o + circ(x, y, r * 0.24, '#ffd66b', stk('#d19a2a', 0.8));
}
function bodyAcc(D, a, B, L) {
  var o = '', cx = 200, nb = B.nb, nw = B.nw, S = B.S, sh = B.sh, gd = gold(D);
  if (a.choker) { var y = nb - 12; o += pa(p`M${cx - nw - 1},${y - 4} Q${cx},${y + 2} ${cx + nw + 1},${y - 4} L${cx + nw + 1},${y + 4} Q${cx},${y + 10} ${cx - nw - 1},${y + 4}Z`, '#221a26', '#000', 0.8) + circ(cx, y + 9, 3.5, L.gem, stk('#fff', 0.8)); }
  if (a.necklace) o += pa(p`M${cx - nw - 3},${nb + 2} Q${cx},${nb + 50} ${cx + nw + 3},${nb + 2}`, 'none', gd, 2) +
    pa(p`M${cx},${nb + 24} C${cx - 7},${nb + 32} ${cx - 6},${nb + 40} ${cx},${nb + 44} C${cx + 6},${nb + 40} ${cx + 7},${nb + 32} ${cx},${nb + 24}Z`, L.gem, '#c89a3a', 1.5) + circ(cx - 2, nb + 34, 1.5, '#fff', op(0.8));
  if (a.epaulets) [-1, 1].forEach(function (s) {
    var fr = '', k;
    for (k = 0; k < 7; k++) { var x = cx + s * (sh - 30 + k * 6); fr += p`M${x},${S + 6} L${x + s * 1},${S + 30} `; }
    o += pa(fr, 'none', '#d9ad45', 2.6) + pa(p`M${cx + s * (sh - 56)},${S - 12} Q${cx + s * (sh - 10)},${S - 22} ${cx + s * (sh + 8)},${S + 2} L${cx + s * (sh + 4)},${S + 10} Q${cx + s * (sh - 14)},${S - 2} ${cx + s * (sh - 56)},${S + 2}Z`, gd, '#7a5212', 1.4);
  });
  if (a.sword) {
    var sx0 = cx + sh * 0.56, sy0 = S - 6;
    o += pa(p`M${sx0 - 6},${sy0 + 4} L${cx - B.wh - 10},606 L${cx - B.wh + 8},606 L${sx0 + 12},${sy0 + 8}Z`, D.lg(0, 0, 1, 0, [[0, '#3a2418'], [0.5, '#6a4630'], [1, '#2a180e']]), '#1a0e08', 1.2);
    var bq = [lerp(sx0, cx - B.wh, 0.42), lerp(sy0 + 6, 606, 0.42)];
    o += '<rect x="' + n(bq[0] - 8) + '" y="' + n(bq[1] - 7) + '" width="18" height="14" rx="2" fill="none" stroke="' + '#d9ad45' + '" stroke-width="3" transform="rotate(-26 ' + n(bq[0]) + ' ' + n(bq[1]) + ')"/>';
  }
  if (a.lanyard) {
    var lc = L.accent || '#3a6ad8', by = S + (B.age === 'child' ? 110 : 140);
    o += pa(p`M${cx - nw - 4},${nb - 6} C${cx - nw - 14},${nb + 40} ${cx - 16},${by - 60} ${cx - 3},${by - 34} M${cx + nw + 4},${nb - 6} C${cx + nw + 14},${nb + 40} ${cx + 16},${by - 60} ${cx + 3},${by - 34}`, 'none', dk(lc, 0.4), 6) +
      pa(p`M${cx - nw - 4},${nb - 6} C${cx - nw - 14},${nb + 40} ${cx - 16},${by - 60} ${cx - 3},${by - 34} M${cx + nw + 4},${nb - 6} C${cx + nw + 14},${nb + 40} ${cx + 16},${by - 60} ${cx + 3},${by - 34}`, 'none', lc, 4);
    o += pa(p`M${cx - 5},${by - 36} h10 v10 h-10Z`, '#c8ccd4', '#6a6e7a', 1);
    o += '<g transform="rotate(-4 ' + cx + ' ' + by + ')">' + '<rect x="' + (cx - 24) + '" y="' + (by - 26) + '" width="48" height="64" rx="4" fill="#ffffff" stroke="#9aa0ac" stroke-width="1.4"/>' +
      '<rect x="' + (cx - 24) + '" y="' + (by - 26) + '" width="48" height="12" rx="3" fill="' + lc + '"/>' + '<rect x="' + (cx - 16) + '" y="' + (by - 8) + '" width="18" height="22" fill="#cfd6e2"/>' + ell(cx - 7, by - 1, 4.5, 5, '#8a94a8') + ell(cx - 7, by + 12, 8, 5, '#8a94a8') +
      pa(p`M${cx + 6},${by - 4} h12 M${cx + 6},${by + 3} h12 M${cx + 6},${by + 10} h8 M${cx - 16},${by + 24} h32 M${cx - 16},${by + 30} h20`, 'none', '#9aa0ac', 2) + '<rect x="' + (cx - 24) + '" y="' + (by - 26) + '" width="48" height="64" rx="4" fill="#ffffff" opacity=".18"/></g>';
  }
  if (a.cape) {
    var cc = L.capeColor, cd = D.lg(0, 0, 0, 1, [[0, lt(cc, 0.1)], [1, dk(cc, 0.3)]]);
    [-1, 1].forEach(function (s) { o += pa(p`M${cx + s * (nw + 6)},${nb + 2} Q${cx + s * (sh + 4)},${S - 14} ${cx + s * (sh + 14)},${S + 70} L${cx + s * (sh - 28)},${S + 74} Q${cx + s * 44},${S + 20} ${cx + s * (nw + 2)},${nb + 16}Z`, cd, dk(cc, 0.6), 1.6) + pa(p`M${cx + s * (sh + 14)},${S + 70} L${cx + s * (sh - 28)},${S + 74}`, 'none', gd, 3); });
    o += circ(cx - 34, S + 16, 6, gd, stk('#7a5212', 1)) + circ(cx + 34, S + 16, 6, gd, stk('#7a5212', 1)) + pa(p`M${cx - 30},${S + 18} Q${cx},${S + 34} ${cx + 30},${S + 18}`, 'none', gd, 2);
  }
  return o;
}
function capeBack(D, B, L) {
  var cx = 200, S = B.S, sh = B.sh, cc = L.capeColor;
  return pa(p`M${cx - sh + 10},${S - 14} C${cx - sh - 40},${S + 60} ${cx - sh - 46},480 ${cx - sh - 60},606 L${cx + sh + 60},606 C${cx + sh + 46},480 ${cx + sh + 40},${S + 60} ${cx + sh - 10},${S - 14}Z`, D.lg(0, 0, 0, 1, [[0, dk(cc, 0.35)], [1, dk(cc, 0.55)]]), dk(cc, 0.7), 1.6);
}

/* sword on the back: hilt and guard rising behind the right shoulder */
function swordBack(D, B, L) {
  var cx = 200, S = B.S, k = B.age === 'child' ? 0.8 : B.f ? 0.92 : 1;
  var gx = cx + B.sh * 0.6, gy = S - 18, ux = 0.42, uy = -0.91, vx = -uy, vy = ux, ac = L.accent || '#c0392b';
  function P(a, b) { return [gx + ux * a + vx * b, gy + uy * a + vy * b]; }
  function poly2(pts) { return pts.map(function (q, i) { return (i ? 'L' : 'M') + n(q[0]) + ',' + n(q[1]); }).join(' ') + 'Z'; }
  var o = '';
  o += pa(poly2([P(-90 * k, -9 * k), P(-2, -10 * k), P(-2, 10 * k), P(-90 * k, 9 * k)]), D.lg(0, 0, 1, 0, [[0, '#1a1418'], [0.5, '#3a2a30'], [1, '#120c10']]), '#050305', 1.2);
  o += pa(poly2([P(-6, -11 * k), P(-2, -11 * k), P(-2, 11 * k), P(-6, 11 * k)]), gold(D), '#6a4210', 1);
  o += pa(poly2([P(0, -24 * k), P(7 * k, -20 * k), P(7 * k, 20 * k), P(0, 24 * k)]), D.lg(0, 0, 1, 1, [[0, '#fff2b8'], [0.5, '#c9962e'], [1, '#6a4210']]), '#4a2a08', 1.3);
  var h0 = 7 * k, h1 = 70 * k;
  o += pa(poly2([P(h0, -6 * k), P(h1, -5 * k), P(h1, 5 * k), P(h0, 6 * k)]), '#1e1a22', '#050305', 1.2);
  var wr = ''; for (var a = h0 + 4; a < h1 - 4; a += 8 * k) { var p1 = P(a, -5 * k), p2 = P(a + 4 * k, 5 * k), p3 = P(a + 8 * k, -5 * k); wr += p`M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} L${p3[0]},${p3[1]} `; }
  o += pa(wr, 'none', ac, 1.6, op(0.9));
  var pm = P(h1 + 6 * k, 0);
  o += pa(poly2([P(h1, -8 * k), P(h1 + 10 * k, -6 * k), P(h1 + 12 * k, 0), P(h1 + 10 * k, 6 * k), P(h1, 8 * k)]), gold(D), '#6a4210', 1.2) + circ(pm[0], pm[1], 2.6 * k, ac);
  var t0 = P(h1 + 12 * k, 0);
  o += pa(p`M${t0[0]},${t0[1]} C${t0[0] + 18 * k},${t0[1] - 6} ${t0[0] + 26 * k},${t0[1] + 14} ${t0[0] + 20 * k},${t0[1] + 34 * k}`, 'none', ac, 2) +
    pa(p`M${t0[0] + 17 * k},${t0[1] + 30 * k} l-4,${26 * k} M${t0[0] + 20 * k},${t0[1] + 30 * k} l0,${28 * k} M${t0[0] + 23 * k},${t0[1] + 30 * k} l4,${25 * k}`, 'none', ac, 2.2) + ell(t0[0] + 20 * k, t0[1] + 32 * k, 4 * k, 5 * k, dk(ac, 0.2));
  return o;
}
/* folding fan held at the chest */
function fanFront(D, B, L, O) {
  var cx = 200, S = B.S, k = B.age === 'child' ? 0.78 : B.f ? 0.92 : 1.05, ac = L.accent || '#c0392b';
  var hx = cx + 34 * k, hy = S + (B.age === 'child' ? 150 : 170) * (B.f ? 0.95 : 1), px = hx - 6 * k, py = hy + 8 * k;
  var R1 = 118 * k, R0 = 34 * k, a0 = -PI * 0.93, a1 = -PI * 0.46, N = 14, i, o = '';
  var paper = D.lg(0, 0, 0, 1, [[0, '#fffaf0'], [1, '#efe4cc']]);
  var outer = [], inner = [];
  for (i = 0; i <= N; i++) { var an = a0 + (a1 - a0) * i / N; outer.push([px + Math.cos(an) * R1, py + Math.sin(an) * R1]); inner.push([px + Math.cos(an) * R0, py + Math.sin(an) * R0]); }
  var sk = ''; for (i = 0; i <= N; i++) sk += p`M${px},${py} L${inner[i][0]},${inner[i][1]} `;
  o += pa(sk, 'none', '#6a4a2a', 3.2) + pa(sk, 'none', '#b88a5a', 1.6);
  var sg = ['', ''];
  for (i = 0; i < N; i++) { var q = [outer[i], outer[i + 1], inner[i + 1], inner[i]]; sg[i % 2] += p`M${q[0][0]},${q[0][1]} L${q[1][0]},${q[1][1]} L${q[2][0]},${q[2][1]} L${q[3][0]},${q[3][1]}Z`; }
  o += pa(sg[0], '#f4ead6', '#c8b898', 0.7) + pa(sg[1], paper, '#c8b898', 0.7);
  var cl = D.clip('<path d="M' + outer.concat(inner.slice().reverse()).map(function (q) { return n(q[0]) + ',' + n(q[1]); }).join(' L') + 'Z"/>');
  var art = '', mx = px - R1 * 0.72, my = py - R1 * 0.62;
  art += pa(p`M${px - R1},${py - 20 * k} L${px - R1 * 0.8},${py - R1 * 0.52} L${px - R1 * 0.62},${py - R1 * 0.44} L${px - R1 * 0.46},${py - R1 * 0.78} L${px - R1 * 0.28},${py - R1 * 0.5} L${px - R1 * 0.1},${py - R1 * 0.66} L${px + R1 * 0.1},${py - R1 * 0.4} L${px + R1 * 0.2},${py}Z`, '#6a7486', null, 0, op(0.45));
  art += pa(p`M${px - R1},${py - 10 * k} L${px - R1 * 0.7},${py - R1 * 0.36} L${px - R1 * 0.5},${py - R1 * 0.3} L${px - R1 * 0.3},${py - R1 * 0.42} L${px},${py - R1 * 0.26} L${px + R1 * 0.2},${py}Z`, '#2a3040', null, 0, op(0.55));
  art += circ(px - R1 * 0.24, py - R1 * 0.84, 9 * k, ac, op(0.85));
  art += pa(p`M${px - R1 * 0.95},${py - R1 * 0.22} q${14 * k},${-8 * k} ${28 * k},0 M${px - R1 * 0.78},${py - R1 * 0.12} q${10 * k},${-6 * k} ${20 * k},0`, 'none', '#ffffff', 2, op(0.7));
  o += g(art, 'clip-path="' + cl + '"');
  o += pa('M' + outer.map(function (q) { return n(q[0]) + ',' + n(q[1]); }).join(' L'), 'none', ac, 3.5) + pa('M' + outer.map(function (q) { return n(q[0]) + ',' + n(q[1]); }).join(' L'), 'none', dk(ac, 0.4), 1, 'transform="translate(0 2)" opacity=".5"');
  o += pa(p`M${px},${py} L${outer[0][0]},${outer[0][1]} M${px},${py} L${outer[N][0]},${outer[N][1]}`, 'none', '#4a2e18', 3.6);
  /* sleeve + hand gripping the pivot */
  var sc = O.col, sl = p`M${hx + 4 * k},${hy + 26 * k} C${hx + 30 * k},${hy + 40 * k} ${hx + 50 * k},${hy + 90 * k} ${hx + 60 * k},606 L${hx - 12 * k},606 C${hx - 12 * k},${hy + 90 * k} ${hx - 22 * k},${hy + 48 * k} ${hx - 16 * k},${hy + 26 * k}Z`;
  o += pa(sl, O.D.lg(0, 0, 1, 0, [[0, lt(sc, 0.12)], [1, dk(sc, 0.3)]]), dk(sc, 0.6), 1.6) + pa(p`M${hx - 16 * k},${hy + 26 * k} Q${hx - 6 * k},${hy + 36 * k} ${hx + 4 * k},${hy + 26 * k}`, 'none', ac, 3);
  var sf = O.skinF, sL = O.skinLine;
  o += pa(p`M${hx - 18 * k},${hy + 24 * k} C${hx - 26 * k},${hy + 8 * k} ${hx - 22 * k},${hy - 10 * k} ${hx - 8 * k},${hy - 14 * k} L${hx + 14 * k},${hy - 12 * k} C${hx + 22 * k},${hy - 4 * k} ${hx + 20 * k},${hy + 14 * k} ${hx + 8 * k},${hy + 26 * k}Z`, sf, sL, 1.3);
  [0, 1, 2, 3].forEach(function (j) {
    var fy = hy - 10 * k + j * 8.5 * k, fw = (18 - j * 1.5) * k;
    o += pa(p`M${hx - 12 * k},${fy} C${hx - 20 * k - fw * 0.2},${fy - 1} ${hx - 22 * k - fw * 0.2},${fy + 8 * k} ${hx - 13 * k},${fy + 8.5 * k} L${hx + 4 * k},${fy + 8 * k} L${hx + 4 * k},${fy}Z`, sf, sL, 1.1);
  });
  o += pa(p`M${hx + 10 * k},${hy + 16 * k} C${hx + 4 * k},${hy + 2 * k} ${hx - 6 * k},${hy - 10 * k} ${hx - 18 * k},${hy - 14 * k} C${hx - 22 * k},${hy - 10 * k} ${hx - 16 * k},${hy - 4 * k} ${hx - 8 * k},${hy + 2 * k} C${hx - 2 * k},${hy + 8 * k} ${hx},${hy + 18 * k} ${hx + 2 * k},${hy + 24 * k}Z`, sf, sL, 1.2);
  o += pa(p`M${hx - 17 * k},${hy - 13 * k} q-2,2 -1,4`, 'none', lt(O.skinSh, 0.5), 1.2);
  return o;
}
/* half mask over the upper face on the viewer's left, with an eye hole */
function maskSvg(D, E, L) {
  var ac = L.accent || '#c0392b', ex = -E.x, ey = E.y + 1, rw = E.w * 0.6, rh = Math.max(E.h * 0.5, 14);
  var outer = p`M6,-78 C-24,-86 -64,-78 -72,-40 C-78,-10 -70,22 -52,38 C-38,48 -18,46 -6,34 C4,20 8,-4 8,-30 C8,-50 8,-66 6,-78Z`;
  var hole = p`M${ex - rw},${ey} C${ex - rw * 0.6},${ey - rh * 1.2} ${ex + rw * 0.6},${ey - rh * 1.2} ${ex + rw},${ey - rh * 0.1} C${ex + rw * 0.6},${ey + rh * 1.1} ${ex - rw * 0.6},${ey + rh * 1.1} ${ex - rw},${ey}Z`;
  var o = pa(outer + ' ' + hole, D.lg(-70, -80, 10, 40, [[0, '#ffffff'], [0.6, '#eceaf0'], [1, '#b8b4c4']], true), '#3a3040', 1.8, 'fill-rule="evenodd"');
  o += pa(hole, 'none', ac, 2.4);
  o += pa(p`M-10,-66 C-30,-70 -52,-58 -58,-40 M-64,6 C-58,20 -46,30 -30,32`, 'none', ac, 2.2, op(0.9)) + cloudCurl(-46, -56, 7, ac) + cloudCurl(-20, 30, 5, ac);
  o += pa(p`M-58,-50 C-50,-66 -30,-74 -8,-72`, 'none', '#fff', 3, op(0.6));
  o += pa(p`M4,-70 C8,-40 6,-6 -6,30`, 'none', '#1d1228', 3, op(0.12));
  return o;
}

/* ------------------------------------------------------------ portrait */
function portrait(look, emo, opts) {
  var L0 = look || {}; opts = opts || {};
  var m = L0.sex === 'm', age = GEO.f[L0.age] ? L0.age : 'adult', sx = m ? 'm' : 'f';
  var G = GEO[sx][age], E0 = EYE[sx][age], es = ESHAPE[L0.eyeShape] || (m ? ESHAPE.sharp : ESHAPE.round);
  var em = EMO[emo] || EMO.neutral;
  var ftype = age === 'child' ? 'c' : sx;
  var E = { x: E0.x, y: E0.y, w: E0.w, h: E0.h * (age === 'child' ? Math.max(es.hm, 0.95) : es.hm), tilt: es.tilt, is: es.is, peak: es.peak };
  var outfit = OUTFITS[L0.outfit] ? L0.outfit : (age === 'child' && !m ? 'dress_child' : 'casual');
  var hs = ['long', 'wavy', 'bob', 'ponytail', 'twintail', 'braid', 'updo', 'bun', 'short', 'messy', 'slick', 'long_m', 'topknot', 'half_up'];
  var skin = L0.skin || '#f7dccb', hair = L0.hair || '#4a3228';
  var L = {
    hair: hair, hair2: L0.hair2 || mix(dk(hair, 0.3), '#3a2250', 0.2),
    hairStyle: hs.indexOf(L0.hairStyle) >= 0 ? L0.hairStyle : (m ? 'short' : 'long'),
    bangs: ['straight', 'side', 'parted', 'none'].indexOf(L0.bangs) >= 0 ? L0.bangs : (m ? 'side' : 'straight'),
    accent: L0.accent || ACCDEF[outfit], skinSh: mix(skin, '#b0506a', 0.32),
    gem: L0.accent && lum(L0.accent) < 0.85 ? L0.accent : '#e2415e'
  };
  var col = L0.outfitColor || OUTDEF[outfit];
  L.hatColor = L0.outfitColor ? dk(L0.outfitColor, 0.2) : (m ? '#2a2430' : '#f0e2cf');
  L.capeColor = L0.outfitColor && lum(L0.outfitColor) < 0.5 && outfit !== 'armor' ? mix(L0.outfitColor, '#5a1020', 0.5) : '#6e1a2c';
  var a = {}; (Array.isArray(L0.acc) ? L0.acc : []).forEach(function (k) { a[k] = 1; });
  if (outfit === 'maid' && !a.hat && !a.crown && !a.veil && !a.headphones) a.maidcap = 1;
  var D = new Defs();
  var B = { S: G.S, sh: G.sh, wh: G.wh, nw: G.nw, nb: G.S - (m ? 16 : 20), hy: G.hy, hs: G.hs, f: !m, age: age };
  var chinY = G.hy + CHIN[ftype] * G.hs, nt = G.hy + 30 * G.hs;
  var skinLine = mix(skin, '#6a2a3a', 0.5);
  var skinF = D.lg(0, 0, 1, 0, [[0, lt(skin, 0.1)], [0.6, skin], [1, mix(skin, L.skinSh, 0.35)]]);
  var O = { acx: !!L0.accent, D: D, B: B, col: col, ac: L.accent, skinF: skinF, skinLine: skinLine, skinSh: L.skinSh, gem: L.gem };
  var HT = 'transform="translate(200 ' + G.hy + ') scale(' + G.hs + ')"';
  var H = hairSvg(D, L, m, 0);
  var out = OUTFITS[outfit](O);
  var o = '';
  /* layer 1: back hair / cape / hood */
  if (a.veil) o += g(pa('M-72,-120 C-150,-40 -170,200 -186,440 L186,440 C170,200 150,-40 72,-120 Q0,-150 -72,-120Z', '#ffffff', '#ffffff', 1.2, op(0.35)), HT);
  if (a.cape) o += capeBack(D, B, L);
  o += g(H.back, HT);
  if (a.sword) o += swordBack(D, B, L);
  if (out.back) o += out.back;
  /* layer 2: skin body */
  var cx = 200, nw = B.nw, nb = B.nb, S = B.S, sh = B.sh;
  var body = p`M${cx - nw},${nt} L${cx - nw},${nb - 8} Q${cx - nw},${nb + 4} ${cx - nw - 16},${nb + 8} L${cx - sh + 18},${S} Q${cx - sh - 2},${S + 4} ${cx - sh - 3},${S + 36} L${cx - sh - 8},606 L${cx + sh + 8},606 L${cx + sh + 3},${S + 36} Q${cx + sh + 2},${S + 4} ${cx + sh - 18},${S} L${cx + nw + 16},${nb + 8} Q${cx + nw},${nb + 4} ${cx + nw},${nb - 8} L${cx + nw},${nt}Z`;
  o += pa(body, skinF, skinLine, 1.6);
  o += pa(p`M${cx - nw - 2},${chinY - 30} L${cx - nw - 2},${chinY + 8} Q${cx},${chinY + 30} ${cx + nw + 2},${chinY + 8} L${cx + nw + 2},${chinY - 30}Z`, L.skinSh, null, 0, op(0.75));
  o += pa(p`M${cx - 44},${nb + 20} Q${cx - 24},${nb + 26} ${cx - 8},${nb + 22} M${cx + 44},${nb + 20} Q${cx + 24},${nb + 26} ${cx + 8},${nb + 22}`, 'none', L.skinSh, 1.6, op(0.7));
  if (m && age !== 'child') o += pa(p`M${cx - nw + 6},${chinY + 4} L${cx - 6},${nb + 10} M${cx + nw - 6},${chinY + 4} L${cx + 6},${nb + 10}`, 'none', L.skinSh, 1.4, op(0.5));
  /* layer 3: outfit + body accessories + over-shoulder hair */
  o += out.front;
  o += bodyAcc(D, a, B, L);
  o += g(H.over, HT);
  if (a.fan) o += fanFront(D, B, L, O);
  /* layer 4: head */
  var ec = { eye: L0.eyes || '#6a4a3a', lash: mix(dk(hair, 0.62), '#2a1420', 0.55), skin: skin, skinSh: L.skinSh, skinLine: skinLine, f: !m, elder: age === 'elder' };
  ec.ig = D.lg(0, 0, 0, 1, [[0, dk(ec.eye, 0.55)], [0.5, ec.eye], [1, lt(ec.eye, 0.45)]]);
  var cbrow = lum(hair) > 0.55 ? mix(hair, '#5a3a34', 0.5) : mix(hair, '#2a1420', 0.35);
  var faceD = FACE[ftype], chin = CHIN[ftype];
  var fclip = D.clip('<path d="' + faceD + '"/>');
  var hd = '';
  [-1, 1].forEach(function (s) {
    hd += pa(p`M${s * 60},-4 C${s * 78},-16 ${s * 86},18 ${s * 74},40 C${s * 68},48 ${s * 61},45 ${s * 58},36Z`, skinF, skinLine, 1.4) +
      pa(p`M${s * 64},6 C${s * 74},2 ${s * 76},18 ${s * 68},30`, 'none', L.skinSh, 1.6, op(0.8));
  });
  hd += pa(faceD, D.rg(-18, -20, 150, [[0, lt(skin, 0.14)], [0.62, skin], [1, mix(skin, L.skinSh, 0.45)]], true), skinLine, 1.7);
  var fin = pa(p`M40,-70 C66,-40 70,20 58,50 C48,74 30,92 8,${chin + 2} L80,${chin + 2} L80,-70Z`, L.skinSh, null, 0, op(0.18)) + H.shadow;
  var rim = D.lg(-70, 0, 70, 0, [[0, '#ffffff', 0], [0.62, '#ffffff', 0], [1, '#fff4e4', 0.75]], true);
  fin += pa(faceD, 'none', rim, 7, 'transform="translate(-2 0)"');
  if (em.gloom) fin += pa('M-80,-80 L80,-80 L80,20 L-80,20Z', D.lg(0, 0, 0, 1, [[0, '#4a3a80', 0.55], [1, '#4a3a80', 0]]), null, 0);
  hd += g(fin, 'clip-path="' + fclip + '"');
  hd += pa(p`M-62,-10 C-62,24 -56,46 -44,62`, 'none', '#fff', 2.4, op(0.35));
  var eyeB = E.y + E.h * 0.62;
  var ny = E.y + (chin - E.y) * 0.46, my = E.y + (chin - E.y) * 0.7;
  var bl = clamp((em.blush || 0) * (m ? 0.6 : 1) + (m ? 0.06 : age === 'child' ? 0.35 : 0.25), 0, 1);
  var blg = D.rg('50%', '50%', '50%', [[0, '#ff6f8a', 0.85], [1, '#ff6f8a', 0]]);
  [-1, 1].forEach(function (s) { hd += ell(s * 41, eyeB + 12, 19, 9, blg, op(n(bl))); });
  if (em.hatch) [-1, 1].forEach(function (s) { hd += pa(p`M${s * 34},${eyeB + 16} l${4},-8 M${s * 41},${eyeB + 16} l${4},-8 M${s * 48},${eyeB + 16} l${4},-8`, 'none', '#e0506e', 1.5, op(0.8)); });
  if (age === 'elder') hd += pa(p`M-24,${ny + 4} Q-30,${my - 4} -24,${my + 8} M24,${ny + 4} Q30,${my - 4} 24,${my + 8}`, 'none', skinLine, 1.2, op(0.35));
  if (a.beard) {
    var bc = mix(hair, '#1d1228', 0.1);
    hd += pa(p`M-64,4 C-62,60 -40,104 0,112 C40,104 62,60 64,4 C60,40 48,${my + 6} 22,${my + 16} Q0,${my + 22} -22,${my + 16} C-48,${my + 6} -60,40 -64,4Z`, bc, dk(hair, 0.5), 1.2, op(0.95)) +
      pa(p`M-22,${my - 4} Q-10,${my - 12} 0,${my - 6} Q10,${my - 12} 22,${my - 4} Q10,${my - 1} 0,${my - 3} Q-10,${my - 1} -22,${my - 4}Z`, bc, dk(hair, 0.5), 1) +
      pa(p`M-40,${my + 10} q6,20 14,34 M40,${my + 10} q-6,20 -14,34 M-10,${my + 24} q2,14 6,24 M10,${my + 24} q-2,14 -6,24`, 'none', lt(hair, 0.3), 1.2, op(0.4));
  }
  hd += m ? pa(p`M4,${ny - 18} L7,${ny} Q6,${ny + 4} 0,${ny + 4}`, 'none', skinLine, 1.5, op(0.6)) + pa(p`M-2,${ny + 2} q2,1 4,0`, 'none', skinLine, 1.2, op(0.5))
    : pa(p`M3,${ny - 5} Q6,${ny} 1,${ny + 2}`, 'none', skinLine, 1.4, op(0.55));
  hd += ell(-3, ny - 6, 1.8, 4, '#fff', op(0.4));
  var eL = eyeSvg(D, -1, E, em, ec), eR = eyeSvg(D, 1, E, em, ec);
  hd += eL.x + eR.x + '<g class="eo">' + eL.o + eR.o + '</g>';
  if (eL.c) hd += '<g class="ec" style="opacity:0">' + eL.c + eR.c + '</g>';
  var mcol = { mouthLine: mix(skin, '#7a2030', 0.62), lips: !m && age !== 'child' };
  if (mcol.lips && ['laugh', 'surprised', 'cry', 'angry'].indexOf(em.mouth) < 0) hd += ell(0, my + 4, 5, 1.8, '#e07a86', op(0.22));
  hd += '<g class="mc">' + mouthSvg(em.mouth, my, mcol) + '</g><g class="mo" style="opacity:0">' + talkMouth(em.mouth, my, mcol, m, age) + '</g>';
  if (em.tear) hd += pa(p`M${E.x + E.w * 0.4},${eyeB + 2} C${E.x + E.w * 0.48},${eyeB + 10} ${E.x + E.w * 0.5},${eyeB + 14} ${E.x + E.w * 0.42},${eyeB + 16} C${E.x + E.w * 0.34},${eyeB + 14} ${E.x + E.w * 0.36},${eyeB + 10} ${E.x + E.w * 0.4},${eyeB + 2}Z`, '#bfe6ff', '#7cb7e0', 1);
  if (em.tears) [-1, 1].forEach(function (s) {
    var tx = s * (E.x - 2);
    hd += pa(p`M${tx},${eyeB - 2} C${tx - s * 2},${eyeB + 20} ${tx + s * 4},${eyeB + 38} ${tx - s * 2},${eyeB + 60}`, 'none', '#a9dcff', 6, op(0.85)) +
      pa(p`M${tx},${eyeB} C${tx - s * 2},${eyeB + 20} ${tx + s * 4},${eyeB + 38} ${tx - s * 2},${eyeB + 58}`, 'none', '#ffffff', 2, op(0.8));
  });
  if (a.mole) hd += circ(E.x + 12, eyeB + 8, 1.9, dk(skin, 0.6));
  if (a.scar) hd += pa(p`M${-E.x - 12},${E.y - E.h * 0.95} L${-E.x + 10},${E.y + E.h * 1.1}`, 'none', '#c77a78', 2.6, op(0.85)) +
    pa(p`M${-E.x - 9},${E.y - 10} l8,-3 M${-E.x - 2},${E.y + 8} l8,-3 M${-E.x + 4},${E.y + 24} l8,-3`, 'none', '#c77a78', 1.5, op(0.8));
  if (a.bandage) hd += '<g transform="translate(46 ' + n(eyeB + 24) + ') rotate(-22)">' + '<rect x="-17" y="-6.5" width="34" height="13" rx="6" fill="#f3dcc0" stroke="#c8a888" stroke-width="1.1"/>' + '<rect x="-6" y="-5" width="12" height="10" rx="2" fill="#e8c8a8"/>' + pa('M-13,-3 v0 M-13,3 v0 M13,-3 v0 M13,3 v0 M-9,0 v0 M9,0 v0', 'none', '#c8a888', 1.8) + '</g>';
  if (a.mask) hd += maskSvg(D, E, L);
  hd += H.front + H.top;
  hd += (a.mask ? '' : browSvg(-1, E, em, { brow: cbrow }, m)) + browSvg(1, E, em, { brow: cbrow }, m);
  if (em.gloom) { var gl = ''; [-44, -28, -12, 4, 20, 36, 52].forEach(function (x, i) { gl += p`M${x},${-78 + (i % 2) * 8} L${x},${-36 + (i % 3) * 6} `; }); hd += g(pa(gl, 'none', '#4a3a80', 2.2, op(0.45)), 'clip-path="' + fclip + '"'); }
  hd += headAcc(D, a, L, E, m, { chin: chin, my: my });
  if (em.vein) hd += '<g transform="translate(56 -80)">' + pa('M-10,-3 Q-3,-3 -3,-10 M3,-10 Q3,-3 10,-3 M10,3 Q3,3 3,10 M-3,10 Q-3,3 -10,3', 'none', '#e03348', 3.4) + '</g>';
  if (em.sweat) hd += '<g transform="translate(' + (m ? 84 : 82) + ' -34) scale(1.3)">' + pa('M0,-12 C5,-4 8,2 8,6 A8,8 0 1 1 -8,6 C-8,2 -5,-4 0,-12Z', '#d6f1ff', '#6fb0de', 1.2) + ell(-3, 5, 2, 3, '#fff', op(0.9)) + '</g>';
  if (em.marks) hd += pa('M-86,-120 l-12,-14 M-70,-136 l-6,-18 M86,-120 l12,-14 M70,-136 l6,-18', 'none', '#3a3040', 2.4, op(0.6));
  o += g(hd, HT);
  var vb = '0 0 400 600';
  if (opts.crop === 'face') { var sz = 280 * G.hs, cu = L.hairStyle === 'topknot' ? 24 : 0; vb = n(200 - sz / 2) + ' ' + n(G.hy - (150 + cu) * G.hs) + ' ' + n(sz) + ' ' + n(sz); }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet">' + D.out() + o + '</svg>';
}

/* ---------------------------------------------------------- backgrounds */
var W = 1280, H = 720;
function RNG(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hash(str) { var h = 2166136261, i; for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function lerp(a, b, t) { return a + (b - a) * t; }
function LG(c, x0, y0, x1, y1, st) { var q = c.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < st.length; i++) q.addColorStop(st[i][0], st[i][1]); return q; }
function RG(c, x, y, r, st, r0, x0, y0) { var q = c.createRadialGradient(x0 == null ? x : x0, y0 == null ? y : y0, r0 || 0, x, y, Math.max(r, 1)); for (var i = 0; i < st.length; i++) q.addColorStop(st[i][0], st[i][1]); return q; }
function rect(c, x, y, w, h, f) { c.fillStyle = f; c.fillRect(x, y, w, h); }
function poly(c, pts, f, s, lw) {
  c.beginPath(); for (var i = 0; i < pts.length; i++) { if (i) c.lineTo(pts[i][0], pts[i][1]); else c.moveTo(pts[i][0], pts[i][1]); } c.closePath();
  if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = lw || 1; c.stroke(); }
}
function eli(c, x, y, rx, ry, f, rot) { c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), rot || 0, 0, PI * 2); c.fillStyle = f; c.fill(); }
function line(c, x0, y0, x1, y1, s, w) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = s; c.lineWidth = w || 1; c.stroke(); }
function rr(c, x, y, w, h, r, f, s, lw) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = lw || 1; c.stroke(); }
}
function glow(c, x, y, r, col, a) { c.fillStyle = RG(c, x, y, r, [[0, rgba(col, a)], [0.35, rgba(col, a * 0.45)], [1, rgba(col, 0)]]); c.fillRect(x - r, y - r, r * 2, r * 2); }
function lighter(c, fn) { c.save(); c.globalCompositeOperation = 'lighter'; fn(); c.restore(); }
function alpha(c, a, fn) { c.save(); c.globalAlpha = a; fn(); c.restore(); }
function sky(c, st, h) { rect(c, 0, 0, W, h || H, LG(c, 0, 0, 0, h || H, st)); }
function stars(c, R, n0, y1, a) {
  for (var i = 0; i < n0; i++) {
    var x = R() * W, y = Math.pow(R(), 1.3) * y1, r = R() < 0.92 ? R() * 1.1 + 0.3 : R() * 1.6 + 1.2;
    c.fillStyle = 'rgba(255,255,255,' + ((a || 1) * (0.35 + R() * 0.65)).toFixed(2) + ')'; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill();
    if (r > 1.8) { glow(c, x, y, r * 6, '#cfe0ff', 0.35); line(c, x - r * 4, y, x + r * 4, y, 'rgba(255,255,255,.5)', 0.8); line(c, x, y - r * 4, x, y + r * 4, 'rgba(255,255,255,.5)', 0.8); }
  }
}
function moon(c, x, y, r, col) {
  glow(c, x, y, r * 6, col || '#b9ccff', 0.35);
  eli(c, x, y, r, r, RG(c, x - r * 0.3, y - r * 0.3, r * 1.3, [[0, '#fffdf2'], [1, '#e6dcc0']]));
  alpha(c, 0.12, function () { eli(c, x + r * 0.3, y - r * 0.1, r * 0.25, r * 0.22, '#8a8070'); eli(c, x - r * 0.35, y + r * 0.35, r * 0.18, r * 0.16, '#8a8070'); eli(c, x - r * 0.1, y - r * 0.45, r * 0.12, r * 0.1, '#8a8070'); });
}
function puff(c, x, y, r, col, a) { c.fillStyle = RG(c, x, y, r, [[0, rgba(col, a)], [0.55, rgba(col, a * 0.85)], [1, rgba(col, 0)]]); c.fillRect(x - r, y - r, r * 2, r * 2); }
function cloud(c, R, x, y, w, col, sh, a) {
  var k, n0 = 7 + Math.floor(R() * 5);
  for (k = 0; k < n0; k++) { var t = k / (n0 - 1); puff(c, x + (t - 0.5) * w, y + 14 + R() * 10, w * (0.16 + R() * 0.08), sh, a * 0.7); }
  for (k = 0; k < n0; k++) { var u = k / (n0 - 1); puff(c, x + (u - 0.5) * w * 0.9, y - Math.sin(u * PI) * w * 0.12 + R() * 8, w * (0.14 + R() * 0.1) * (0.6 + Math.sin(u * PI) * 0.6), col, a); }
}
function ridge(c, R, y, amp, col, f) {
  var p1 = R() * 9, p2 = R() * 9, p3 = R() * 9; f = f || 1;
  c.beginPath(); c.moveTo(0, H);
  for (var x = 0; x <= W + 8; x += 8) c.lineTo(x, y - amp * (0.55 * Math.sin(x * 0.004 * f + p1) + 0.3 * Math.sin(x * 0.011 * f + p2) + 0.15 * Math.sin(x * 0.031 * f + p3)));
  c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill();
}
function treeline(c, R, y, h, col, r0) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H); c.lineTo(0, y);
  for (var x = 0; x <= W + 30; x += 10 + R() * 18) { var r = (r0 || 22) * (0.6 + R() * 0.8); c.lineTo(x, y - R() * h); c.arc(x + r * 0.5, y - R() * h, r, PI, 0); }
  c.lineTo(W, H); c.closePath(); c.fill();
}
function tree(c, R, x, y, s, dark, light, trunk) {
  poly(c, [[x - 6 * s, y], [x - 3 * s, y - 70 * s], [x + 3 * s, y - 70 * s], [x + 7 * s, y]], trunk || '#4a3426');
  var k; for (k = 0; k < 9; k++) {
    var a = R() * PI * 2, d = R() * 34 * s, bx = x + Math.cos(a) * d * 1.2, by = y - 100 * s + Math.sin(a) * d * 0.9, r = (26 + R() * 18) * s;
    eli(c, bx, by, r, r * 0.9, RG(c, bx - r * 0.4, by - r * 0.5, r * 1.4, [[0, light], [0.6, dark], [1, dark]]));
  }
}
function pz(k) { return (1 / lerp(5, 1, k) - 0.2) / 0.8; }
function room(c, o) {
  var b = o.b, bx0 = b[0], by0 = b[1], bx1 = b[2], by1 = b[3];
  poly(c, [[0, 0], [W, 0], [bx1, by0], [bx0, by0]], LG(c, 0, 0, 0, by0, o.ceil));
  poly(c, [[0, 0], [bx0, by0], [bx0, by1], [0, H]], LG(c, 0, 0, bx0, 0, o.side));
  poly(c, [[W, 0], [W, H], [bx1, by1], [bx1, by0]], LG(c, W, 0, bx1, 0, o.side));
  poly(c, [[0, H], [bx0, by1], [bx1, by1], [W, H]], LG(c, 0, by1, 0, H, o.floor));
  rect(c, bx0, by0, bx1 - bx0, by1 - by0, LG(c, 0, by0, 0, by1, o.wall));
  var r = {
    b: b,
    L: function (u, v) { return [lerp(bx0, 0, u), lerp(lerp(by0, 0, u), lerp(by1, H, u), v)]; },
    R: function (u, v) { return [lerp(bx1, W, u), lerp(lerp(by0, 0, u), lerp(by1, H, u), v)]; },
    F: function (u, t) { return [lerp(lerp(bx0, 0, t), lerp(bx1, W, t), u), lerp(by1, H, t)]; },
    sc: function (t) { return lerp((bx1 - bx0) / W, 1, t); }
  };
  if (o.edge) { line(c, 0, 0, bx0, by0, o.edge, 2); line(c, W, 0, bx1, by0, o.edge, 2); line(c, 0, H, bx0, by1, o.edge, 2); line(c, W, H, bx1, by1, o.edge, 2); c.strokeStyle = o.edge; c.lineWidth = 2; c.strokeRect(bx0, by0, bx1 - bx0, by1 - by0); }
  return r;
}
function wallQuad(c, fn, u0, u1, v0, v1, f, s, lw) { poly(c, [fn(u0, v0), fn(u1, v0), fn(u1, v1), fn(u0, v1)], f, s, lw); }
function floorGrid(c, r, nx, nz, col, w) {
  var i; c.save(); c.strokeStyle = col; c.lineWidth = w || 1;
  for (i = -nx; i <= nx * 2; i++) { var a = r.F(i / nx, 0), b = r.F(i / nx, 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  for (i = 1; i <= nz; i++) { var t = pz(i / nz), y = lerp(r.b[3], H, t); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.restore();
}
function checker(c, r, nx, nz, c1, c2) {
  var i, j;
  for (j = 0; j < nz; j++) for (i = -nx; i < nx * 2; i++) {
    if ((i + j) % 2) continue;
    var t0 = pz(j / nz), t1 = pz((j + 1) / nz);
    poly(c, [r.F(i / nx, t0), r.F((i + 1) / nx, t0), r.F((i + 1) / nx, t1), r.F(i / nx, t1)], c2);
  }
}
function column(c, x, top, bot, w, col, cap) {
  rect(c, x - w / 2, top, w, bot - top, LG(c, x - w / 2, 0, x + w / 2, 0, [[0, dk(col, 0.45)], [0.25, lt(col, 0.35)], [0.45, col], [1, dk(col, 0.5)]]));
  c.save(); c.globalAlpha = 0.25; for (var k = 1; k < 5; k++) line(c, x - w / 2 + w * k / 5, top, x - w / 2 + w * k / 5, bot, dk(col, 0.5), 1); c.restore();
  var cw = w * 1.35, ch = Math.max(8, w * 0.35);
  rect(c, x - cw / 2, top - ch, cw, ch, LG(c, 0, top - ch, 0, top, [[0, lt(cap || col, 0.3)], [1, dk(cap || col, 0.3)]]));
  rect(c, x - cw / 2 - 3, top - ch - 5, cw + 6, 6, dk(cap || col, 0.1));
  rect(c, x - cw / 2, bot - ch, cw, ch, LG(c, 0, bot - ch, 0, bot, [[0, lt(col, 0.2)], [1, dk(col, 0.4)]]));
}
function archPath(c, x, y, w, h) { c.beginPath(); c.moveTo(x - w / 2, y + h); c.lineTo(x - w / 2, y + w / 2); c.arc(x, y + w / 2, w / 2, PI, 0); c.lineTo(x + w / 2, y + h); c.closePath(); }
function archWin(c, x, y, w, h, glass, frame, bars) {
  archPath(c, x, y, w + 16, h + 8); c.fillStyle = frame; c.fill();
  archPath(c, x, y + 6, w, h); c.fillStyle = LG(c, 0, y, 0, y + h, glass); c.fill();
  c.save(); archPath(c, x, y + 6, w, h); c.clip();
  c.strokeStyle = frame; c.lineWidth = Math.max(2, w * 0.04);
  var k; for (k = 1; k < (bars || 3); k++) line(c, x - w / 2 + w * k / (bars || 3), y, x - w / 2 + w * k / (bars || 3), y + h + 10, frame, Math.max(2, w * 0.035));
  for (k = 1; k < 5; k++) line(c, x - w, y + w / 2 + (h - w / 2) * k / 5, x + w, y + w / 2 + (h - w / 2) * k / 5, frame, Math.max(1.5, w * 0.025));
  c.restore();
}
function shaft(c, x0, y0, x1, y1, x2, y2, x3, y3, col, a) {
  lighter(c, function () { poly(c, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]], LG(c, (x0 + x1) / 2, y0, (x2 + x3) / 2, y2, [[0, rgba(col, a)], [1, rgba(col, 0)]])); });
}
function curtain(c, x, y, w, h, col, folds, tie) {
  var k, f = folds || 5, fw = w / f;
  for (k = 0; k < f; k++) {
    var x0 = x + k * fw, pinch = tie ? (k / f - 0.5) * 0 : 0;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + fw, y);
    if (tie) { c.quadraticCurveTo(x0 + fw * 0.9 + (tie - x0) * 0.35, y + h * 0.6, x0 + fw + (tie - x0 - fw) * 0.4, y + h); c.lineTo(x0 + (tie - x0) * 0.4, y + h); c.quadraticCurveTo(x0 + (tie - x0) * 0.35, y + h * 0.6, x0, y); }
    else { c.lineTo(x0 + fw + 2, y + h); c.lineTo(x0 - 2, y + h); }
    c.closePath();
    c.fillStyle = LG(c, x0, 0, x0 + fw, 0, [[0, dk(col, 0.45)], [0.35, lt(col, 0.2)], [0.6, col], [1, dk(col, 0.35)]]); c.fill();
  }
  rect(c, x - 6, y - 10, w + 12, 18, LG(c, 0, y - 10, 0, y + 8, [[0, lt(col, 0.2)], [1, dk(col, 0.4)]]));
}
function chandelier(c, x, y, s, col) {
  col = col || '#e8c060';
  line(c, x, 0, x, y - 30 * s, dk(col, 0.4), 2 * s);
  lighter(c, function () { glow(c, x, y + 10 * s, 190 * s, '#ffcf7a', 0.35); });
  var k, tiers = [[0, 80, 18], [-26, 54, 12], [-48, 30, 8]];
  tiers.forEach(function (t) {
    var ty = y + t[0] * s, rw = t[1] * s;
    c.beginPath(); c.ellipse(x, ty, rw, rw * 0.22, 0, 0, PI); c.strokeStyle = col; c.lineWidth = 3 * s; c.stroke();
    for (k = 0; k < t[2]; k++) {
      var a = PI * (k + 0.5) / t[2], px = x + Math.cos(a) * rw, py = ty + Math.sin(a) * rw * 0.22;
      rect(c, px - 2 * s, py - 12 * s, 4 * s, 12 * s, '#fff6e0');
      lighter(c, function () { glow(c, px, py - 14 * s, 16 * s, '#ffd98a', 0.9); });
      eli(c, px, py + 8 * s, 2 * s, 5 * s, 'rgba(230,240,255,.8)');
    }
  });
  poly(c, [[x - 12 * s, y + 6 * s], [x + 12 * s, y + 6 * s], [x, y + 34 * s]], col);
}
function books(c, R, x, y, w, h, rows, wood) {
  rect(c, x - 8, y - 12, w + 16, h + 20, wood || '#4a2e20');
  var rh = h / rows, i, pal = ['#7a2a2a', '#2a4a6a', '#2f5a3a', '#6a4a2a', '#8a6a3a', '#4a2a4a', '#a0703a', '#2a2a3a', '#6a2a3e', '#3a5a5a'];
  for (i = 0; i < rows; i++) {
    var yy = y + i * rh, bx = x;
    rect(c, x, yy, w, rh, dk(wood || '#4a2e20', 0.55));
    while (bx < x + w - 4) {
      var bw = 5 + R() * 9, bh = rh * (0.62 + R() * 0.3); if (bx + bw > x + w) break;
      var col = pal[Math.floor(R() * pal.length)];
      if (R() < 0.08) { poly(c, [[bx, yy + rh], [bx + bh * 0.5, yy + rh - bh * 0.85], [bx + bh * 0.5 + bw, yy + rh - bh * 0.85], [bx + bw, yy + rh]], col); bx += bh * 0.5 + bw + 2; continue; }
      rect(c, bx, yy + rh - bh, bw, bh, LG(c, bx, 0, bx + bw, 0, [[0, lt(col, 0.2)], [0.5, col], [1, dk(col, 0.4)]]));
      if (R() < 0.5) rect(c, bx, yy + rh - bh + bh * 0.2, bw, 2, 'rgba(230,200,120,.6)');
      bx += bw + 0.6;
    }
    rect(c, x - 8, yy + rh - 4, w + 16, 6, LG(c, 0, yy + rh - 4, 0, yy + rh + 2, [[0, lt(wood || '#4a2e20', 0.2)], [1, dk(wood || '#4a2e20', 0.4)]]));
  }
}
function rose(c, x, y, r, col) {
  eli(c, x, y, r, r, RG(c, x - r * 0.3, y - r * 0.3, r * 1.3, [[0, lt(col, 0.35)], [1, dk(col, 0.3)]]));
  c.strokeStyle = dk(col, 0.45); c.lineWidth = Math.max(0.8, r * 0.12);
  c.beginPath(); c.arc(x, y, r * 0.55, 0.3, 4.2); c.stroke(); c.beginPath(); c.arc(x + r * 0.1, y - r * 0.05, r * 0.28, 2, 6); c.stroke();
}
function bush(c, R, x, y, w, h, dark, light, flowers, fr) {
  var k;
  for (k = 0; k < 26; k++) { var bx = x + (R() - 0.5) * w, by = y - R() * h, r = h * (0.18 + R() * 0.2); eli(c, bx, by, r * 1.2, r, RG(c, bx - r * 0.3, by - r * 0.5, r * 1.5, [[0, light], [0.7, dark], [1, dk(dark, 0.3)]])); }
  if (flowers) for (k = 0; k < (fr || 22); k++) rose(c, x + (R() - 0.5) * w * 0.95, y - R() * h * 1.05, 5 + R() * 7, flowers[Math.floor(R() * flowers.length)]);
}
function bokeh(c, R, n0, cols, r0, r1, a, y0, y1) {
  lighter(c, function () {
    for (var i = 0; i < n0; i++) {
      var x = R() * W, y = lerp(y0 || 0, y1 || H, R()), r = lerp(r0, r1, R()), col = cols[Math.floor(R() * cols.length)];
      c.fillStyle = RG(c, x, y, r, [[0, rgba(col, a * 0.7)], [0.75, rgba(col, a * 0.5)], [0.92, rgba(col, a * 0.8)], [1, rgba(col, 0)]]);
      c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill();
    }
  });
}
function motes(c, R, n0, col, y0, y1) { lighter(c, function () { for (var i = 0; i < n0; i++) { var x = R() * W, y = lerp(y0, y1, R()); glow(c, x, y, 2 + R() * 5, col, 0.5 + R() * 0.4); } }); }
function spot(c, x, y, x1, w, len, col, a) {
  lighter(c, function () { poly(c, [[x - 6, y], [x + 6, y], [x1 + w / 2, y + len], [x1 - w / 2, y + len]], LG(c, x, y, x1, y + len, [[0, rgba(col, a)], [0.7, rgba(col, a * 0.35)], [1, rgba(col, 0)]])); glow(c, x, y, 40, col, a * 1.2); });
}
function city(c, R, base, hmin, hmax, col, win, dens, wmin) {
  var x = -10;
  while (x < W + 10) {
    var bw = (wmin || 40) + R() * 70, bh = hmin + R() * (hmax - hmin);
    rect(c, x, base - bh, bw, bh + 2, col);
    if (R() < 0.3) rect(c, x + bw * 0.3, base - bh - 14, bw * 0.4, 14, col);
    if (win) {
      c.fillStyle = win;
      for (var yy = base - bh + 8; yy < base - 6; yy += 9) for (var xx = x + 5; xx < x + bw - 6; xx += 8) if (R() < dens) { c.globalAlpha = 0.4 + R() * 0.6; c.fillRect(xx, yy, 4, 5); }
      c.globalAlpha = 1;
    }
    x += bw + R() * 4;
  }
}
function lanterns(c, R, x0, y0, x1, y1, sag, cols, n0) {
  c.strokeStyle = 'rgba(40,20,20,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); c.stroke();
  for (var k = 1; k < n0; k++) {
    var t = k / n0, q = qb([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + sag * 2], [x1, y1], t), col = cols[k % cols.length];
    lighter(c, function () { glow(c, q[0], q[1] + 10, 40, col, 0.5); });
    eli(c, q[0], q[1] + 10, 9, 12, RG(c, q[0], q[1] + 8, 14, [[0, '#fff6d0'], [0.5, col], [1, dk(col, 0.3)]]));
  }
}
function crowd(c, R, y, n0, col) {
  var a = [], i; for (i = 0; i < n0; i++) a.push(y + R() * (H - y)); a.sort(function (p1, p2) { return p1 - p2; });
  for (i = 0; i < n0; i++) { var x = R() * W, yy = a[i], r = 12 + (yy - y) / (H - y) * 22; eli(c, x, yy + r * 2.6, r * 2.3, r * 1.9, col); rect(c, x - r * 2.3, yy + r * 2.6, r * 4.6, H, col); eli(c, x, yy, r, r * 1.15, col); }
}
function sticks(c, R, y, n0, cols) {
  lighter(c, function () { for (var i = 0; i < n0; i++) { var x = R() * W, yy = y + Math.pow(R(), 0.8) * (H - y), k = 0.4 + (yy - y) / (H - y), col = cols[Math.floor(R() * cols.length)]; glow(c, x, yy, 14 * k, col, 0.9); line(c, x, yy, x + (R() - 0.5) * 6, yy + 10 * k, rgba(col, 0.9), 2 * k); } });
}
function water(c, R, y0, st, streaks) {
  rect(c, 0, y0, W, H - y0, LG(c, 0, y0, 0, H, st));
  c.save(); for (var i = 0; i < (streaks || 160); i++) { var y = y0 + Math.pow(R(), 1.6) * (H - y0), w = 10 + (y - y0) * 0.4 * R(); c.globalAlpha = 0.08 + R() * 0.18; line(c, R() * W, y, R() * W + w, y, '#ffffff', 1 + (y - y0) / 200); } c.restore();
}
function reflect(c, R, x, y0, len, col, w) { lighter(c, function () { for (var y = y0; y < y0 + len; y += 5 + R() * 5) { var ww = (w || 10) * (0.4 + R()); c.globalAlpha = (1 - (y - y0) / len) * 0.7; line(c, x - ww / 2 + (R() - 0.5) * 8, y, x + ww / 2 + (R() - 0.5) * 8, y, col, 2); } }); }
function neon(c, x, y, w, h, col, R) {
  rr(c, x, y, w, h, 6, 'rgba(20,10,30,.85)');
  c.save(); c.shadowColor = col; c.shadowBlur = 18; rr(c, x + 3, y + 3, w - 6, h - 6, 5, null, col, 2.5);
  c.strokeStyle = lt(col, 0.5); c.lineWidth = 3;
  var vert = h > w, k, n0 = vert ? Math.floor(h / (w * 0.9)) : Math.floor(w / (h * 0.9));
  for (k = 0; k < n0; k++) {
    var cx = vert ? x + w / 2 : x + (k + 0.5) * w / n0, cy = vert ? y + (k + 0.5) * h / n0 : y + h / 2, s = (vert ? w : h) * 0.26;
    c.beginPath(); var t = Math.floor(R() * 4);
    if (t === 0) { c.moveTo(cx - s, cy - s); c.lineTo(cx + s, cy - s); c.lineTo(cx + s, cy + s); } else if (t === 1) { c.arc(cx, cy, s * 0.8, 0, PI * 2); } else if (t === 2) { c.moveTo(cx - s, cy - s); c.lineTo(cx - s, cy + s); c.lineTo(cx + s, cy + s); c.moveTo(cx, cy - s); c.lineTo(cx, cy); } else { c.moveTo(cx - s, cy); c.lineTo(cx + s, cy); c.moveTo(cx, cy - s); c.lineTo(cx, cy + s); }
    c.stroke();
  }
  c.restore();
}
function finish(c, o) {
  o = o || {};
  if (o.tint) alpha(c, o.ta || 0.12, function () { c.globalCompositeOperation = 'soft-light'; rect(c, 0, 0, W, H, o.tint); });
  if (o.haze) alpha(c, 1, function () { rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, rgba(o.haze, 0)], [0.55, rgba(o.haze, 0.1)], [1, rgba(o.haze, 0.18)]])); });
  rect(c, 0, 0, W, H, RG(c, W / 2, H * 0.45, W * 0.72, [[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(10,5,20,' + (o.vig == null ? 0.5 : o.vig) + ')']]));
}
function skyDay(c, R, hz) {
  sky(c, [[0, '#3d7fd6'], [0.5, '#84bdf0'], [1, '#e2f1fb']], hz || H);
  lighter(c, function () { glow(c, 1060, 110, 420, '#fff2c8', 0.45); glow(c, 1060, 110, 90, '#ffffff', 0.9); });
  for (var i = 0; i < 6; i++) cloud(c, R, R() * W, 90 + R() * 200, 180 + R() * 220, '#ffffff', '#b8cde6', 0.85);
}
function skySunset(c, R, hz) {
  sky(c, [[0, '#2b2a6a'], [0.3, '#8a4a86'], [0.55, '#e57a6a'], [0.75, '#ffb46e'], [1, '#ffe2a6']], hz || H);
  lighter(c, function () { glow(c, 640, (hz || H) * 0.84, 520, '#ffb070', 0.55); glow(c, 640, (hz || H) * 0.84, 70, '#fff4d0', 1); });
  for (var i = 0; i < 9; i++) { var y = 80 + R() * 300, x = R() * W, w = 200 + R() * 300; c.save(); c.globalAlpha = 0.55; eli(c, x, y, w, 10 + R() * 12, LG(c, 0, y - 20, 0, y + 20, [[0, '#6a3a6e'], [1, '#ff9a7a']])); c.restore(); }
}
function skyNight(c, R, hz, mx, my) {
  sky(c, [[0, '#050818'], [0.55, '#131d48'], [1, '#2c3a70']], hz || H);
  alpha(c, 0.35, function () { for (var i = 0; i < 14; i++) puff(c, 200 + i * 70 + R() * 40, 80 + i * 22 + R() * 30, 90 + R() * 60, i % 2 ? '#6a4aa0' : '#3a5aa0', 0.5); });
  stars(c, R, 420, (hz || H) * 0.95);
  if (mx != null) moon(c, mx, my, 42);
}

/* ---- ink-wash (수묵) helpers for the murim sets ---- */
function peaks(c, R, base, h, col, mist, o) {
  /* a layer of steep karst peaks fading into mist at the base */
  o = o || {};
  var x = -60 - R() * 60, pts = [[x, base]], vy = base - h * 0.2 * R();
  c.beginPath(); c.moveTo(-100, H); c.lineTo(x, vy);
  while (x < W + 80) {
    var pw = (o.w || 120) * (0.6 + R() * 0.9), ph = h * (0.45 + R() * 0.55), sk = 0.35 + R() * 0.3, ny = base - ph * (0.1 + R() * 0.35), tx = x + pw * sk, ty = base - ph;
    /* rounded karst summit, steep flanks */
    c.bezierCurveTo(x + pw * sk * 0.35, vy - (vy - ty) * 0.5, tx - pw * 0.16, ty + ph * 0.02, tx, ty);
    c.bezierCurveTo(tx + pw * 0.14, ty + ph * 0.02, x + pw - (pw - pw * sk) * 0.3, ny - (ny - ty) * 0.45, x + pw, ny);
    pts.push([tx - pw * 0.1, ty + 10], [tx, ty], [tx + pw * 0.1, ty + 10], [x + pw, ny]);
    x += pw; vy = ny;
  }
  c.lineTo(W + 100, H); c.closePath();
  c.fillStyle = LG(c, 0, base - h, 0, base + (o.fade || 60), [[0, col], [0.55, col], [1, rgba(mist, 1)]]); c.fill();
  if (o.ink) { /* dry-brush texture strokes down the faces */
    alpha(c, o.ink, function () {
      for (var k = 1; k + 3 < pts.length; k += 4) {
        var tp = pts[k + 1]; for (var j = 0; j < 5; j++) { var dx = (R() - 0.5) * 30; line(c, tp[0] + dx * 0.3, tp[1] + 6 + j * 4, tp[0] + dx * 1.6, tp[1] + 40 + R() * h * 0.4, dk(col, 0.35), 1 + R() * 2); }
      }
    });
  }
  return pts;
}
function mistBand(c, y, h, col, a) { rect(c, 0, y - h, W, h * 2, LG(c, 0, y - h, 0, y + h, [[0, rgba(col, 0)], [0.5, rgba(col, a)], [1, rgba(col, 0)]])); }
function pine(c, R, x, y, s, col, lean) {
  lean = lean || 0;
  c.strokeStyle = col; c.lineCap = 'round';
  c.lineWidth = 9 * s; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + (lean - 10) * s, y - 60 * s, x + (lean + 20) * s, y - 110 * s, x + lean * 2 * s, y - 170 * s); c.stroke();
  var k; for (k = 0; k < 6; k++) {
    var t = 0.25 + k * 0.14, bx = x + lean * 2 * s * t + (k % 2 ? 1 : -1) * 6 * s, by = y - 170 * s * t, dir = k % 2 ? 1 : -1, len = (70 - k * 8) * s * (0.8 + R() * 0.4);
    c.lineWidth = 3 * s; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + dir * len * 0.5, by - 12 * s, bx + dir * len, by - 4 * s); c.stroke();
    for (var j = 0; j < 4; j++) eli(c, bx + dir * len * (0.35 + j * 0.2), by - 10 * s - R() * 6 * s, (22 + R() * 12) * s, (7 + R() * 3) * s, col);
  }
  eli(c, x + lean * 2 * s, y - 176 * s, 26 * s, 9 * s, col);
  c.lineCap = 'butt';
}
function roofC(c, x, y, w, h, col, ridge, tiles) {
  /* curved Chinese roof: ridge at y, eave tips flare up at the ends */
  var hw = w / 2, rw = w * 0.34, fl = w * 0.06;
  c.beginPath(); c.moveTo(x - rw, y); c.lineTo(x + rw, y);
  c.bezierCurveTo(x + rw + w * 0.05, y + h * 0.6, x + hw - fl, y + h * 0.95, x + hw + fl, y + h * 0.62);
  c.quadraticCurveTo(x + hw - fl * 0.5, y + h * 1.08, x + hw - fl * 1.6, y + h * 1.05);
  c.lineTo(x - hw + fl * 1.6, y + h * 1.05);
  c.quadraticCurveTo(x - hw + fl * 0.5, y + h * 1.08, x - hw - fl, y + h * 0.62);
  c.bezierCurveTo(x - hw + fl, y + h * 0.95, x - rw - w * 0.05, y + h * 0.6, x - rw, y); c.closePath();
  c.fillStyle = LG(c, 0, y, 0, y + h, [[0, lt(col, 0.12)], [1, dk(col, 0.35)]]); c.fill();
  if (tiles) { c.save(); c.clip(); c.globalAlpha = 0.35; for (var t = -hw; t < hw; t += Math.max(4, w / 40)) line(c, x + t * 0.72, y, x + t * 1.02, y + h * 1.1, dk(col, 0.5), Math.max(1, w / 220)); c.restore(); }
  rect(c, x - rw - 2, y - Math.max(3, h * 0.08), rw * 2 + 4, Math.max(4, h * 0.12), ridge || dk(col, 0.3));
  poly(c, [[x - rw - 2, y - h * 0.08], [x - rw - h * 0.12, y - h * 0.3], [x - rw + h * 0.05, y - h * 0.08]], ridge || dk(col, 0.3));
  poly(c, [[x + rw + 2, y - h * 0.08], [x + rw + h * 0.12, y - h * 0.3], [x + rw - h * 0.05, y - h * 0.08]], ridge || dk(col, 0.3));
  rect(c, x - hw + fl * 1.6, y + h * 1.02, w - fl * 3.2, Math.max(2, h * 0.07), dk(col, 0.55));
}
function hall(c, x, base, w, wh, rh, o) {
  /* a pavilion: plinth, red pillars, lattice panels, curved roof (optionally two tiers) */
  o = o || {};
  var wall = o.wall || '#b8342a', wood = o.wood || '#6a2a1e', roofCol = o.roof || '#3a4248';
  rect(c, x - w * 0.46, base - 6, w * 0.92, 10, o.plinth || '#8a8478');
  rect(c, x - w * 0.4, base - wh, w * 0.8, wh - 4, LG(c, 0, base - wh, 0, base, [[0, dk(wall, 0.25)], [1, wall]]));
  var n0 = o.bays || 5, k;
  for (k = 0; k <= n0; k++) { var px = x - w * 0.4 + w * 0.8 * k / n0; rect(c, px - w * 0.012, base - wh, w * 0.024, wh - 4, dk(wall, 0.2)); }
  if (o.lattice !== false) for (k = 0; k < n0; k++) {
    var lx = x - w * 0.4 + w * 0.8 * (k + 0.12) / n0, lw = w * 0.8 * 0.76 / n0, ly = base - wh * 0.86, lh = wh * 0.62;
    rect(c, lx, ly, lw, lh, o.glow ? LG(c, 0, ly, 0, ly + lh, [[0, '#ffd890'], [1, '#e89a48']]) : dk(wood, 0.2));
    c.save(); c.globalAlpha = 0.6; for (var j = 1; j < 4; j++) line(c, lx + lw * j / 4, ly, lx + lw * j / 4, ly + lh, wood, Math.max(1, w / 260)); for (j = 1; j < 6; j++) line(c, lx, ly + lh * j / 6, lx + lw, ly + lh * j / 6, wood, Math.max(1, w / 260)); c.restore();
  }
  rect(c, x - w * 0.42, base - wh - wh * 0.08, w * 0.84, wh * 0.1, o.beam || '#2a5a58');
  roofC(c, x, base - wh - rh * 0.95, w * 1.1, rh, roofCol, null, true);
  if (o.tier) { rect(c, x - w * 0.24, base - wh - rh * 1.55, w * 0.48, rh * 0.62, dk(wall, 0.15)); roofC(c, x, base - wh - rh * 2.1, w * 0.7, rh * 0.75, roofCol, null, true); }
}
function lanternC(c, x, y, r, col, lit) {
  col = col || '#d8321e';
  line(c, x, y - r * 1.8, x, y - r * 0.9, '#2a1a10', Math.max(1, r * 0.08));
  if (lit !== false) lighter(c, function () { glow(c, x, y, r * 5, '#ff9a40', 0.45); });
  rect(c, x - r * 0.45, y - r * 1.02, r * 0.9, r * 0.2, '#c8962e');
  eli(c, x, y, r, r * 0.9, RG(c, x - r * 0.3, y - r * 0.2, r * 1.3, [[0, lit === false ? col : '#ffe6a0'], [0.45, lit === false ? col : lt(col, 0.1)], [1, dk(col, 0.35)]]));
  c.save(); c.globalAlpha = 0.35; c.strokeStyle = dk(col, 0.5); c.lineWidth = Math.max(0.8, r * 0.06);
  [-0.55, 0, 0.55].forEach(function (f) { c.beginPath(); c.ellipse(x, y, Math.abs(f) * r + 0.1, r * 0.9, 0, 0, PI * 2); c.stroke(); }); c.restore();
  rect(c, x - r * 0.45, y + r * 0.82, r * 0.9, r * 0.2, '#c8962e');
  line(c, x, y + r * 1.02, x, y + r * 1.9, col, Math.max(1.5, r * 0.18));
}
function bambooStalk(c, R, x, y0, y1, w, col, leaves, lcol) {
  var seg = w * (5 + R() * 3), y, lean = (R() - 0.5) * w * 1.5;
  rect(c, x - w / 2, y0, w, y1 - y0, LG(c, x - w / 2, 0, x + w / 2, 0, [[0, dk(col, 0.25)], [0.3, lt(col, 0.18)], [0.6, col], [1, dk(col, 0.35)]]));
  for (y = y1 - seg * R(); y > y0; y -= seg) { rect(c, x - w / 2 - 1, y - 1.5, w + 2, Math.max(2, w * 0.14), dk(col, 0.35)); rect(c, x - w / 2, y + Math.max(2, w * 0.14), w, Math.max(1, w * 0.06), lt(col, 0.3)); }
  if (leaves) for (var k = 0; k < leaves; k++) {
    var ly = y0 + R() * (y1 - y0) * 0.7, dir = R() < 0.5 ? -1 : 1, n0 = 3 + Math.floor(R() * 4);
    line(c, x, ly, x + dir * w * 3, ly - w * 0.8, dk(col, 0.2), Math.max(1, w * 0.08));
    for (var j = 0; j < n0; j++) { c.save(); c.translate(x + dir * w * 3, ly - w * 0.8); c.rotate(dir * (0.2 + j * 0.35) + (dir < 0 ? PI : 0)); eli(c, w * 2.2, 0, w * 2.4, w * 0.3, lcol || lt(col, 0.05)); c.restore(); }
  }
}
function snow(c, R, n0, a) { for (var i = 0; i < n0; i++) { var x = R() * W, y = R() * H, r = R() < 0.85 ? 0.8 + R() * 1.6 : 2.4 + R() * 2.4; c.fillStyle = 'rgba(255,255,255,' + ((a || 0.9) * (0.4 + R() * 0.6)).toFixed(2) + ')'; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); } }
function embers(c, R, n0, y0, y1) { lighter(c, function () { for (var i = 0; i < n0; i++) { var x = R() * W, y = lerp(y0, y1, R()), r = 1 + R() * 2.5, col = R() < 0.5 ? '#ffb040' : '#ff6a20'; glow(c, x, y, r * 5, col, 0.8); line(c, x, y, x + (R() - 0.3) * 8, y + 4 + R() * 6, rgba('#ffd080', 0.8), r * 0.6); } }); }
function smoke(c, R, x, y, h, col, a) { for (var k = 0; k < 14; k++) { var t = k / 13; puff(c, x + Math.sin(t * 5 + R()) * 40 * t + t * 120, y - t * h, 40 + t * 110, col, a * (1 - t * 0.6)); } }
function flame(c, R, x, y, w, h) {
  lighter(c, function () { glow(c, x, y - h * 0.4, Math.max(w, h) * 1.3, '#ff6a20', 0.45); });
  for (var k = 0; k < 11; k++) {
    var t = k / 10, fx = x + (R() - 0.5) * w * (1 - t * 0.4), fh = h * (0.35 + R() * 0.65) * (k > 7 ? 0.6 : 1), fw = w * (0.12 + R() * 0.14), lean = (R() - 0.5) * fw * 1.6;
    c.beginPath(); c.moveTo(fx - fw, y);
    c.bezierCurveTo(fx - fw * 1.1, y - fh * 0.45, fx + lean - fw * 0.3, y - fh * 0.6, fx + lean * 1.4, y - fh);
    c.bezierCurveTo(fx + lean + fw * 0.2, y - fh * 0.62, fx + fw * 1.1, y - fh * 0.4, fx + fw, y); c.closePath();
    c.fillStyle = LG(c, 0, y, 0, y - fh, k > 7 ? [[0, 'rgba(255,250,200,.95)'], [1, 'rgba(255,200,80,.2)']] : [[0, 'rgba(255,220,110,.95)'], [0.45, 'rgba(255,120,30,.85)'], [1, 'rgba(200,30,10,.1)']]); c.fill();
  }
}
function crane(c, x, y, s, col) {
  c.strokeStyle = col; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x - 26 * s, y - 6 * s); c.quadraticCurveTo(x - 10 * s, y - 16 * s, x, y); c.quadraticCurveTo(x + 10 * s, y - 16 * s, x + 26 * s, y - 8 * s); c.stroke();
  line(c, x, y, x + 12 * s, y + 3 * s, col, 1.4 * s); line(c, x, y, x - 14 * s, y + 4 * s, col, 1.2 * s);
}
function paper(c, R, a) { alpha(c, a || 0.05, function () { for (var i = 0; i < 260; i++) { var x = R() * W, y = R() * H; line(c, x, y, x + (R() - 0.5) * 60, y + (R() - 0.5) * 6, R() < 0.5 ? '#3a2a1a' : '#ffffff', 1); } }); }
function lerpC(a, b, t) { return mix(a, b, t); }
function hallLattice(c, x, y, w, h, glowCol, wood) {
  rect(c, x, y, w, h, LG(c, 0, y, 0, y + h, [[0, lt(glowCol, 0.3)], [1, glowCol]]));
  lighter(c, function () { glow(c, x + w / 2, y + h / 2, Math.max(w, h), glowCol, 0.25); });
  c.save(); c.globalAlpha = 0.85; var k; for (k = 1; k < 5; k++) line(c, x + w * k / 5, y, x + w * k / 5, y + h, wood, 2); for (k = 1; k < 4; k++) line(c, x, y + h * k / 4, x + w, y + h * k / 4, wood, 2); c.restore();
  c.strokeStyle = wood; c.lineWidth = 3; c.strokeRect(x, y, w, h);
}
function peaksAt(c, R, x, y, w, h, col) {
  c.save(); c.beginPath(); c.rect(x, y - h, w, h); c.clip();
  for (var k = 0; k < 6; k++) { var px = x + R() * w, ph = h * (0.4 + R() * 0.6), pw = 40 + R() * 60; c.beginPath(); c.moveTo(px - pw, y); c.quadraticCurveTo(px - pw * 0.2, y - ph, px, y - ph); c.quadraticCurveTo(px + pw * 0.2, y - ph, px + pw, y); c.fillStyle = rgba(col, 0.5 + R() * 0.4); c.fill(); }
  c.restore();
}
function pillarRed(c, x, top, bot, w) {
  rect(c, x - w / 2, top, w, bot - top, LG(c, x - w / 2, 0, x + w / 2, 0, [[0, '#4a0e0a'], [0.3, '#c8402e'], [0.5, '#a8301e'], [1, '#3a0a08']]));
  [top + 10, bot - 30].forEach(function (y) { rect(c, x - w / 2 - 2, y, w + 4, Math.max(6, w * 0.25), LG(c, x - w / 2, 0, x + w / 2, 0, [[0, '#8a6a20'], [0.4, '#f0d070'], [1, '#6a4a10']])); });
  rect(c, x - w * 0.7, bot - 8, w * 1.4, 10, '#6a6460');
}

function stall(c, R, x, y, s, cols) {
  var w = 220 * s, h = 150 * s, k;
  rect(c, x - w / 2, y - h * 0.8, 8 * s, h * 0.8, '#5a3a22'); rect(c, x + w / 2 - 8 * s, y - h * 0.8, 8 * s, h * 0.8, '#5a3a22');
  rect(c, x - w / 2 - 6 * s, y - 40 * s, w + 12 * s, 40 * s, LG(c, 0, y - 40 * s, 0, y, [[0, '#a87040'], [1, '#6a4222']]));
  rect(c, x - w / 2 - 8 * s, y - 46 * s, w + 16 * s, 8 * s, '#c08a50');
  for (k = 0; k < 5; k++) {
    var bx = x - w / 2 + 24 * s + k * (w - 48 * s) / 4, by = y - 50 * s, fc = ['#e0402a', '#f0b020', '#6ab040', '#8a3a8a', '#f07a30'][(k + Math.floor(R() * 5)) % 5];
    eli(c, bx, by + 4 * s, 20 * s, 9 * s, '#8a6a3a');
    for (var j = 0; j < 6; j++) eli(c, bx + (j - 2.5) * 5 * s, by - (j % 2) * 5 * s - 2 * s, 6 * s, 6 * s, RG(c, bx + (j - 2.5) * 5 * s - 2 * s, by - 4 * s, 8 * s, [[0, lt(fc, 0.4)], [1, fc]]));
  }
  var n0 = 8, ay = y - h * 0.8, sw = w / n0;
  for (k = 0; k < n0; k++) {
    var x0 = x - w / 2 - 10 * s + k * (w + 20 * s) / n0;
    poly(c, [[x0 + 8 * s, ay - 40 * s], [x0 + sw + 8 * s, ay - 40 * s], [x0 + sw + 2.5 * s, ay], [x0, ay]], cols[k % 2]);
    c.beginPath(); c.arc(x0 + sw / 2 + 1, ay, sw / 2 + 1, 0, PI); c.fillStyle = cols[k % 2]; c.fill();
  }
  alpha(c, 0.25, function () { rect(c, x - w / 2, ay + sw / 2, w, 14 * s, '#000'); });
}
function crate(c, R, x, y, s) {
  var w = 70 * s, h = 50 * s;
  rect(c, x - w / 2, y - h, w, h, LG(c, 0, y - h, 0, y, [[0, '#b88850'], [1, '#7a5430']]));
  c.save(); c.globalAlpha = 0.6; for (var k = 1; k < 3; k++) line(c, x - w / 2, y - h + h * k / 3, x + w / 2, y - h + h * k / 3, '#5a3a1a', 1.5); line(c, x - w / 2, y - h, x + w / 2, y, '#5a3a1a', 3); c.restore();
  c.strokeStyle = '#4a2e14'; c.lineWidth = 2; c.strokeRect(x - w / 2, y - h, w, h);
  for (var j = 0; j < 7; j++) eli(c, x - w * 0.35 + j * w * 0.11, y - h - 4 * s - (j % 2) * 4 * s, 7 * s, 7 * s, RG(c, x - w * 0.35 + j * w * 0.11 - 2, y - h - 6 * s, 9 * s, [[0, '#ffd070'], [1, ['#e05a2a', '#d02a2a', '#f0a020'][j % 3]]]));
}
function lanternsEU(c, x0, y0, x1, y1, sag, n0) {
  c.strokeStyle = 'rgba(40,24,16,.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y1); c.stroke();
  for (var k = 1; k < n0; k++) {
    var q = qb([x0, y0], [(x0 + x1) / 2, y0 + sag * 2], [x1, y1], k / n0);
    lighter(c, function () { glow(c, q[0], q[1] + 16, 34, '#ffc060', 0.4); });
    line(c, q[0], q[1], q[0], q[1] + 6, '#2a1a10', 1.5);
    poly(c, [[q[0] - 7, q[1] + 6], [q[0] + 7, q[1] + 6], [q[0] + 9, q[1] + 26], [q[0] - 9, q[1] + 26]], '#fff0c0', '#3a2a1a', 2);
    rect(c, q[0] - 10, q[1] + 25, 20, 4, '#3a2a1a'); poly(c, [[q[0] - 8, q[1] + 6], [q[0] + 8, q[1] + 6], [q[0], q[1] - 1]], '#3a2a1a');
  }
}

var SCENES = {
  black: function (c) { rect(c, 0, 0, W, H, '#07060b'); rect(c, 0, 0, W, H, RG(c, W / 2, H / 2, 700, [[0, 'rgba(40,30,60,.55)'], [1, 'rgba(0,0,0,0)']])); },
  white: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#ffffff'], [1, '#f3eee8']]));
    rect(c, 0, 0, W, H, RG(c, W / 2, H * 0.4, 800, [[0, 'rgba(255,248,236,1)'], [1, 'rgba(236,228,240,1)']]));
    alpha(c, 0.5, function () { bokeh(c, R, 30, ['#ffd9e6', '#fff0c8', '#d8e8ff'], 6, 30, 0.2); });
  },
  sky_day: function (c, R) { skyDay(c, R); ridge(c, R, 600, 40, '#93b6cf', 0.8); ridge(c, R, 650, 30, '#78a48a'); ridge(c, R, 700, 20, '#5a8a60', 1.5); finish(c, { vig: 0.25 }); },
  sky_sunset: function (c, R) {
    skySunset(c, R);
    ridge(c, R, 620, 40, '#5a2e52', 0.8); ridge(c, R, 670, 30, '#3a1e3a', 1.2);
    for (var i = 0; i < 6; i++) { var x = 300 + R() * 600, y = 150 + R() * 150; c.strokeStyle = '#2a1a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 8, y - 4); c.quadraticCurveTo(x - 3, y - 6, x, y); c.quadraticCurveTo(x + 3, y - 6, x + 8, y - 4); c.stroke(); }
    finish(c, { vig: 0.35 });
  },
  sky_night: function (c, R) {
    skyNight(c, R, H, 1000, 150);
    ridge(c, R, 640, 50, '#0c1030', 0.7);
    treeline(c, R, 690, 30, '#070a1c', 18);
    finish(c, { vig: 0.45 });
  },
  palace_hall: function (c, R) {
    var r = room(c, { b: [330, 110, 950, 470], ceil: [[0, '#6a5030'], [1, '#c9a86a']], side: [[0, '#b99e76'], [1, '#e6d6b6']], wall: [[0, '#efe3c8'], [1, '#d8c4a0']], floor: [[0, '#d9cfc4'], [1, '#f6f0ea']] });
    checker(c, r, 8, 10, null, 'rgba(120,90,80,.28)');
    alpha(c, 0.35, function () { floorGrid(c, r, 8, 10, '#8a7060', 1); });
    poly(c, [r.F(0.4, 0), r.F(0.6, 0), r.F(0.63, 1), r.F(0.37, 1)], LG(c, 0, 470, 0, H, [[0, '#8a1e2a'], [1, '#b8303e']]));
    poly(c, [r.F(0.39, 0), r.F(0.4, 0), r.F(0.37, 1), r.F(0.355, 1)], '#d8b050'); poly(c, [r.F(0.6, 0), r.F(0.61, 0), r.F(0.645, 1), r.F(0.63, 1)], '#d8b050');
    [0.22, 0.5, 0.78].forEach(function (x) { archWin(c, 330 + 620 * x, 150, 110, 280, [[0, '#f4fbff'], [1, '#a8c8e8']], '#b8995e', 3); });
    [0.22, 0.5, 0.78].forEach(function (x) { var cx = 330 + 620 * x; shaft(c, cx - 50, 200, cx + 50, 200, cx + 200, H, cx - 20, H, '#fff6dc', 0.28); });
    [0.08, 0.3, 0.6].forEach(function (t, i) { var q = r.L(t, 0), q2 = r.L(t, 1), w = 40 * r.sc(t) * 1.4; column(c, q[0] + w, q[1] + 30, q2[1], w, '#f0e6d2', '#d8b050'); q = r.R(t, 0); q2 = r.R(t, 1); column(c, q[0] - w, q[1] + 30, q2[1], w, '#f0e6d2', '#d8b050'); });
    rect(c, 330, 110, 620, 12, '#c9a24a'); rect(c, 330, 458, 620, 12, '#b8904a');
    chandelier(c, 640, 90, 1.1);
    motes(c, R, 60, '#fff2c0', 100, 600);
    finish(c, { vig: 0.45, tint: '#ffcf8a', ta: 0.15 });
  },
  ballroom: function (c, R) {
    var r = room(c, { b: [250, 120, 1030, 470], ceil: [[0, '#2a1418'], [1, '#6a3a2e']], side: [[0, '#3a1a22'], [1, '#6a3240']], wall: [[0, '#7a3e46'], [1, '#4e2430']], floor: [[0, '#7a4a2a'], [1, '#caa070']] });
    for (var i = 0; i < 5; i++) { var x = 250 + 78 + i * 156; archWin(c, x, 160, 90, 260, [[0, '#1a2a5a'], [0.6, '#3a5a9a'], [1, '#8aa0d0']], '#d8b060', 3); }
    for (i = 0; i < 6; i++) { var px = 250 + i * 156; rect(c, px - 8, 120, 16, 350, LG(c, px - 8, 0, px + 8, 0, [[0, '#9a7030'], [0.5, '#f0d080'], [1, '#8a6020']])); }
    floorGrid(c, r, 14, 12, 'rgba(60,30,10,.35)', 1);
    lighter(c, function () { [[640, 560, 300], [340, 540, 160], [940, 540, 160]].forEach(function (g) { c.fillStyle = RG(c, g[0], g[1], g[2], [[0, 'rgba(255,200,120,.45)'], [1, 'rgba(255,200,120,0)']]); c.save(); c.translate(g[0], g[1]); c.scale(1, 0.35); c.beginPath(); c.arc(0, 0, g[2], 0, PI * 2); c.restore(); c.fill(); }); });
    alpha(c, 0.35, function () { for (var k = 0; k < 7; k++) { var x = 380 + k * 90 + R() * 30, y = 440; eli(c, x, y - 40, 10, 12, '#2a1418'); poly(c, [[x - 16, y - 28], [x + 16, y - 28], [x + 26, y + 30], [x - 26, y + 30]], '#2a1418'); } });
    chandelier(c, 640, 110, 1.2); chandelier(c, 330, 90, 0.8); chandelier(c, 950, 90, 0.8);
    bokeh(c, R, 34, ['#ffd08a', '#ffe6b0', '#ffb070'], 4, 16, 0.35);
    finish(c, { vig: 0.5, tint: '#ffb060', ta: 0.18 });
  },
  garden_rose: function (c, R) {
    skyDay(c, R, 420);
    ridge(c, R, 400, 20, '#9ab8c8');
    treeline(c, R, 420, 40, '#5f8a5a', 26);
    rect(c, 0, 400, W, H - 400, LG(c, 0, 400, 0, H, [[0, '#7aa860'], [1, '#4a7a3a']]));
    poly(c, [[600, 420], [680, 420], [900, H], [380, H]], LG(c, 0, 420, 0, H, [[0, '#e6dcc8'], [1, '#c8b89a']]));
    var gx = 640, gy = 400;
    for (var i = -2; i <= 2; i++) rect(c, gx + i * 34 - 4, gy - 130, 8, 130, '#f6f2ea');
    eli(c, gx, gy - 130, 90, 16, '#e8e2d6'); c.beginPath(); c.moveTo(gx - 88, gy - 130); c.quadraticCurveTo(gx, gy - 230, gx + 88, gy - 130); c.fillStyle = LG(c, gx - 80, 0, gx + 80, 0, [[0, '#ffffff'], [1, '#cfc8bc']]); c.fill();
    rect(c, gx - 96, gy - 4, 192, 10, '#ddd6c8');
    bush(c, R, 420, 470, 300, 90, '#2f5a2a', '#6aa050', ['#e03a5a', '#f07a9a', '#fff0f4'], 18);
    bush(c, R, 860, 470, 300, 90, '#2f5a2a', '#6aa050', ['#e03a5a', '#f07a9a', '#fff0f4'], 18);
    bush(c, R, 90, 720, 380, 320, '#23461f', '#5a9046', ['#d42a4a', '#f06a8a', '#ffd0dc'], 40);
    bush(c, R, 1190, 720, 380, 320, '#23461f', '#5a9046', ['#d42a4a', '#f06a8a', '#ffd0dc'], 40);
    for (i = 0; i < 40; i++) eli(c, R() * W, R() * H, 4 + R() * 3, 2 + R() * 2, rgba('#ffb0c4', 0.8), R() * PI);
    lighter(c, function () { glow(c, 1060, 110, 300, '#fff0c0', 0.3); });
    finish(c, { vig: 0.35, tint: '#ffd0a0', ta: 0.12 });
  },
  bedroom_noble: function (c, R) {
    var r = room(c, { b: [250, 90, 1030, 470], ceil: [[0, '#d8c0b8'], [1, '#f6e8e2']], side: [[0, '#d8b4b4'], [1, '#f4e0dc']], wall: [[0, '#faece8'], [1, '#efd8d4']], floor: [[0, '#8a5a3c'], [1, '#c89a70']] });
    alpha(c, 0.14, function () { for (var y = 110; y < 360; y += 34) for (var x = 270 + (y % 68 ? 17 : 0); x < 1020; x += 34) { poly(c, [[x, y - 7], [x + 5, y], [x, y + 7], [x - 5, y]], '#b0607a'); eli(c, x, y, 1.6, 1.6, '#c8a048'); } });
    rect(c, 250, 360, 780, 110, LG(c, 0, 360, 0, 470, [[0, '#f2dcd6'], [1, '#e2c4bc']])); rect(c, 250, 356, 780, 6, '#d8b060');
    alpha(c, 0.5, function () { for (var x = 270; x < 1020; x += 96) c.strokeRect(x, 376, 80, 76); });
    alpha(c, 0.3, function () { for (var i = -12; i < 24; i++) { var a = r.F(i / 12, 0), b = r.F(i / 12, 1); line(c, a[0], a[1], b[0], b[1], '#5a3a24', 1.5); } });
    rect(c, 250, 90, 780, 14, '#e6c8a0'); for (var m = 262; m < 1030; m += 18) rect(c, m, 104, 8, 6, '#d8b890');
    /* window with sheer + heavy drapes */
    archWin(c, 480, 130, 170, 250, [[0, '#fdfbf0'], [0.6, '#dcecf6'], [1, '#bcd4e8']], '#f6ece0', 3);
    c.save(); archPath(c, 480, 136, 170, 250); c.clip(); treeline(c, R, 400, 40, '#a8c8a0', 20); c.restore();
    shaft(c, 400, 160, 560, 160, 760, H, 420, H, '#fff6e0', 0.26);
    alpha(c, 0.45, function () { curtain(c, 395, 120, 80, 280, '#ffffff', 4, 400); curtain(c, 485, 120, 80, 280, '#ffffff', 4, 560); });
    curtain(c, 360, 104, 70, 330, '#c8506e', 3, 360); curtain(c, 530, 104, 70, 330, '#c8506e', 3, 600);
    for (var k = 0; k < 9; k++) { var q = qb([360, 110], [480, 150], [600, 110], k / 8); eli(c, q[0], q[1], 16, 10, '#b8405e'); }
    /* rug */
    eli(c, 640, 620, 380, 80, LG(c, 0, 540, 0, 700, [[0, '#9a3a50'], [1, '#6a2034']])); eli(c, 640, 620, 350, 68, '#b85468'); eli(c, 640, 620, 300, 54, '#8a2a40');
    alpha(c, 0.7, function () { for (var j = 0; j < 24; j++) { var a = j / 24 * PI * 2; eli(c, 640 + Math.cos(a) * 325, 620 + Math.sin(a) * 62, 6, 3, '#e8c070'); } eli(c, 640, 620, 60, 14, '#e8b0b8'); });
    /* vanity */
    rr(c, 150, 300, 110, 140, 50, LG(c, 150, 0, 260, 0, [[0, '#e0f0fa'], [1, '#98b4cc']]), '#c8a048', 7);
    lighter(c, function () { glow(c, 190, 340, 50, '#ffffff', 0.3); });
    rect(c, 110, 440, 190, 20, '#f4e6dc'); rect(c, 118, 458, 174, 70, LG(c, 0, 458, 0, 528, [[0, '#f0e0d6'], [1, '#d8c2b4']])); rect(c, 122, 528, 12, 60, '#e0c8b8'); rect(c, 276, 528, 12, 60, '#e0c8b8');
    [[150, '#e888a8'], [176, '#8ab8e0'], [262, '#f0c060']].forEach(function (b) { rr(c, b[0] - 7, 418, 14, 22, 4, b[1]); rect(c, b[0] - 3, 410, 6, 8, '#d8b060'); });
    eli(c, 220, 432, 16, 8, '#fff'); for (var f = 0; f < 5; f++) eli(c, 212 + f * 4, 420 - (f % 2) * 4, 6, 6, '#f090a8');
    /* canopy bed */
    var bx = 700, bw = 480;
    [[bx, 150, 430], [bx + bw, 150, 470]].forEach(function (p) { rect(c, p[0] - 8, p[1], 16, p[2], LG(c, p[0] - 8, 0, p[0] + 8, 0, [[0, '#6a3a24'], [0.4, '#b8804a'], [1, '#5a2e18']])); eli(c, p[0], p[1], 12, 8, '#d8b060'); });
    poly(c, [[bx - 20, 140], [bx + bw + 20, 140], [bx + bw + 10, 176], [bx - 10, 176]], LG(c, 0, 140, 0, 176, [[0, '#d86a86'], [1, '#a83a58']]));
    for (k = 0; k < 11; k++) { var sx = bx - 10 + k * (bw + 20) / 11; c.beginPath(); c.moveTo(sx, 176); c.quadraticCurveTo(sx + (bw + 20) / 22, 206, sx + (bw + 20) / 11, 176); c.fillStyle = k % 2 ? '#c24a6a' : '#d25a7a'; c.fill(); }
    rect(c, bx - 20, 136, bw + 40, 8, '#e8c070');
    curtain(c, bx - 30, 180, 110, 380, '#f0b0c4', 4, bx - 10); curtain(c, bx + bw - 80, 180, 110, 400, '#f0b0c4', 4, bx + bw + 10);
    rr(c, bx + 40, 300, bw - 80, 120, 20, LG(c, 0, 300, 0, 420, [[0, '#b8905a'], [1, '#8a6038']]));
    rr(c, bx + 60, 380, 150, 64, 26, '#ffffff'); rr(c, bx + 210, 380, 150, 64, 26, '#fff6f8'); rr(c, bx + 130, 400, 140, 50, 22, '#f8d8e0');
    poly(c, [[bx + 20, 450], [bx + bw - 20, 450], [bx + bw + 30, 600], [bx - 40, 600]], LG(c, 0, 450, 0, 600, [[0, '#fbeef2'], [1, '#e8c8d4']]));
    poly(c, [[bx - 20, 520], [bx + bw + 10, 520], [bx + bw + 30, 600], [bx - 40, 600]], LG(c, 0, 520, 0, 600, [[0, '#d25a7a'], [1, '#9a2e4c']]));
    alpha(c, 0.8, function () { line(c, bx - 20, 524, bx + bw + 10, 524, '#e8c070', 3); for (var d2 = 0; d2 < 14; d2++) { var dx = lerp(bx - 10, bx + bw, d2 / 13); eli(c, dx, 560, 5, 5, '#f4d080'); } });
    rect(c, bx - 40, 600, bw + 70, 70, LG(c, 0, 600, 0, 670, [[0, '#9a2e4c'], [1, '#6a1a32']]));
    rect(c, bx + 40, 640, bw - 60, 40, LG(c, 0, 640, 0, 680, [[0, '#c89060'], [1, '#8a5a36']])); rect(c, bx + 50, 680, 14, 30, '#6a4022'); rect(c, bx + bw - 40, 680, 14, 30, '#6a4022');
    chandelier(c, 560, 50, 0.6);
    motes(c, R, 18, '#fff4e0', 150, 520);
    finish(c, { vig: 0.4, tint: '#ffc0b0', ta: 0.14 });
  },
  study_duke: function (c, R) {
    var r = room(c, { b: [240, 90, 1040, 480], ceil: [[0, '#1a100c'], [1, '#3a261c']], side: [[0, '#241610'], [1, '#4a3024']], wall: [[0, '#4a3226'], [1, '#2e1e16']], floor: [[0, '#2a1a12'], [1, '#5a3a28']] });
    books(c, R, 270, 130, 250, 330, 6, '#3a2418'); books(c, R, 760, 130, 250, 330, 6, '#3a2418');
    archWin(c, 640, 120, 170, 300, [[0, '#2a3a6a'], [1, '#8a9ac0']], '#2a1a12', 3);
    curtain(c, 530, 110, 60, 360, '#5a1a24', 3); curtain(c, 690, 110, 60, 360, '#5a1a24', 3);
    alpha(c, 0.5, function () { for (var u = 0.1; u < 1; u += 0.22) { wallQuad(c, r.L, u, u + 0.16, 0.45, 0.9, null, '#6a4a34', 3); wallQuad(c, r.R, u, u + 0.16, 0.45, 0.9, null, '#6a4a34', 3); } });
    poly(c, [[250, 560], [1030, 560], [1110, 660], [170, 660]], LG(c, 0, 560, 0, 660, [[0, '#6a3a22'], [1, '#3a1e12']]));
    rect(c, 170, 660, 940, 60, '#2a140c'); rect(c, 240, 552, 800, 10, '#8a5a36');
    lighter(c, function () { glow(c, 360, 480, 260, '#ffc070', 0.45); });
    poly(c, [[320, 470], [400, 470], [380, 440], [340, 440]], '#2e6a4a'); rect(c, 356, 470, 8, 84, '#c9a060');
    for (var i = 0; i < 5; i++) poly(c, [[560 + i * 6, 548 - i * 3], [700 + i * 4, 548 - i * 3], [710 + i * 4, 556 - i * 3], [550 + i * 6, 556 - i * 3]], i % 2 ? '#f2eadc' : '#e6dcc8');
    eli(c, 800, 544, 14, 6, '#1a1a22'); rect(c, 790, 520, 20, 24, '#1a1a2a'); line(c, 812, 520, 830, 480, '#f0f0f0', 2);
    motes(c, R, 30, '#ffd9a0', 100, 500);
    finish(c, { vig: 0.55, tint: '#ff9a50', ta: 0.18 });
  },
  library: function (c, R) {
    var r = room(c, { b: [360, 70, 920, 470], ceil: [[0, '#1c120e'], [1, '#3e2a1e']], side: [[0, '#2a1a12'], [1, '#4a3022']], wall: [[0, '#3a281e'], [1, '#2a1a14']], floor: [[0, '#3a2418'], [1, '#6a4630']] });
    books(c, R, 380, 100, 150, 360, 7); books(c, R, 750, 100, 150, 360, 7);
    archWin(c, 640, 90, 170, 330, [[0, '#fff8e0'], [1, '#c8d8e8']], '#3a2418', 3);
    shaft(c, 570, 140, 710, 140, 820, H, 420, H, '#fff0c8', 0.3);
    [0, 1].forEach(function (side) {
      var fn = side ? r.R : r.L, u, v;
      for (u = 0; u < 1; u += 0.2) {
        wallQuad(c, fn, u, u + 0.2, 0.05, 1, '#3a2418');
        for (v = 0.08; v < 0.95; v += 0.13) {
          var bu = u + 0.01; while (bu < u + 0.19) { var bw = 0.008 + R() * 0.012, col = ['#7a2a2a', '#2a4a6a', '#2f5a3a', '#6a4a2a', '#8a6a3a', '#4a2a4a'][Math.floor(R() * 6)]; wallQuad(c, fn, bu, Math.min(bu + bw, u + 0.19), v + 0.02 + R() * 0.03, v + 0.12, col); bu += bw + 0.002; }
          wallQuad(c, fn, u, u + 0.2, v + 0.12, v + 0.13, '#5a3a24');
        }
        wallQuad(c, fn, u, u + 0.012, 0.05, 1, '#2a180e');
      }
    });
    var q0 = r.R(0.55, 0.02), q1 = r.R(0.62, 1);
    line(c, q0[0] - 30, q0[1], q1[0] - 50, q1[1], '#8a5a30', 6); line(c, q0[0] + 10, q0[1], q1[0] + 10, q1[1], '#8a5a30', 6);
    poly(c, [[430, 560], [850, 560], [900, 620], [380, 620]], '#5a3420'); rect(c, 380, 620, 520, 20, '#3a2014');
    [480, 800].forEach(function (x) { rect(c, x - 3, 520, 6, 40, '#f4ecd8'); lighter(c, function () { glow(c, x, 514, 90, '#ffc070', 0.6); }); });
    motes(c, R, 80, '#ffe6b0', 80, 640);
    finish(c, { vig: 0.55, tint: '#ffb060', ta: 0.15 });
  },
  corridor_night: function (c, R) {
    var r = room(c, { b: [560, 240, 720, 420], ceil: [[0, '#0a0c1c'], [1, '#1a1e3a']], side: [[0, '#141a36'], [1, '#2a3060']], wall: [[0, '#1a1e3a'], [1, '#12142a']], floor: [[0, '#1a1a30'], [1, '#2a2440']] });
    poly(c, [r.F(0.36, 0), r.F(0.64, 0), r.F(0.7, 1), r.F(0.3, 1)], LG(c, 0, 420, 0, H, [[0, '#2a0e1a'], [1, '#5a1a2e']]));
    [0.15, 0.4, 0.62, 0.8].forEach(function (u) {
      var w = 0.07 + u * 0.06;
      wallQuad(c, r.L, u, u + w, 0.18, 0.72, '#dfe8ff'); wallQuad(c, r.L, u + 0.005, u + w - 0.005, 0.2, 0.7, LG(c, 0, 0, 0, H, [[0, '#6a8ad0'], [1, '#2a3a80']]));
      var a = r.L(u, 0.45), b = r.L(u + w, 0.45); line(c, a[0], a[1], b[0], b[1], '#1a1e3a', 3);
      var f0 = r.F(-0.05 + u * 0.1, pz(u * 0.9)), f1 = r.F(0.3 + u * 0.2, pz(Math.min(1, u * 0.9 + 0.12)));
      lighter(c, function () { poly(c, [r.L(u, 0.72), r.L(u + w, 0.72), [f1[0], f1[1]], [f0[0] + 40, f0[1]]], rgba('#9ab8ff', 0.18)); });
      var s = r.R(u + w / 2, 0.42); lighter(c, function () { glow(c, s[0], s[1], 90 * r.sc(u), '#ffb060', 0.55); }); eli(c, s[0], s[1], 4 * r.sc(u) + 1, 8 * r.sc(u) + 2, '#ffe6b0');
    });
    rect(c, 560, 240, 160, 180, LG(c, 0, 240, 0, 420, [[0, '#050610'], [1, '#12142a']]));
    finish(c, { vig: 0.6, tint: '#3050c0', ta: 0.2 });
  },
  carriage: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#3a2016'], [1, '#1e0e0a']]));
    rr(c, 360, 90, 560, 250, 30, '#c9a060');
    c.save(); rr(c, 376, 106, 528, 218, 22); c.clip();
    sky(c, [[0, '#8ac0ea'], [1, '#f2e6c8']], 340);
    ridge(c, R, 300, 20, '#8aa6a0'); treeline(c, R, 330, 30, '#5a8050', 20);
    alpha(c, 0.35, function () { for (var i = 0; i < 30; i++) { var y = 250 + R() * 80; line(c, 380, y, 900, y + (R() - 0.5) * 4, '#2e4a2a', 2 + R() * 6); } });
    c.restore();
    curtain(c, 300, 80, 110, 300, '#7a1e30', 4, 390); curtain(c, 870, 80, 110, 300, '#7a1e30', 4, 890);
    rr(c, 150, 330, 980, 220, 40, LG(c, 0, 330, 0, 550, [[0, '#8a2436'], [1, '#5a1422']]));
    for (var y = 370; y < 520; y += 50) for (var x = 200; x < 1100; x += 70) { eli(c, x + (y % 100 ? 35 : 0), y, 4, 4, '#3a0a14'); }
    rr(c, 120, 520, 1040, 140, 40, LG(c, 0, 520, 0, 660, [[0, '#a02e44'], [1, '#5a1422']]));
    rect(c, 0, 660, W, 60, '#1a0c08');
    rect(c, 0, 60, 60, 600, '#4a2a1a'); rect(c, W - 60, 60, 60, 600, '#4a2a1a'); rect(c, 0, 50, W, 16, '#c9a060');
    lighter(c, function () { glow(c, 640, 200, 500, '#fff0d0', 0.2); });
    finish(c, { vig: 0.5, tint: '#ff9a60', ta: 0.15 });
  },
  chapel: function (c, R) {
    var r = room(c, { b: [470, 90, 810, 460], ceil: [[0, '#6a6a7a'], [1, '#b8b4c0']], side: [[0, '#8a8898'], [1, '#d8d4dc']], wall: [[0, '#e6e2e8'], [1, '#c8c2cc']], floor: [[0, '#a8a0a0'], [1, '#d8d0cc']] });
    var cx = 640, cy = 190, rw = 110;
    eli(c, cx, cy, rw + 12, rw + 12, '#8a8090');
    var cols = ['#d83a4a', '#3a6ad8', '#e8c03a', '#3aa86a', '#9a4ad8', '#3ac0d8'];
    for (var k = 0; k < 12; k++) { c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, rw, k * PI / 6, (k + 1) * PI / 6); c.closePath(); c.fillStyle = cols[k % 6]; c.fill(); c.strokeStyle = '#3a3040'; c.lineWidth = 3; c.stroke(); }
    eli(c, cx, cy, 34, 34, '#f0e0a0'); c.strokeStyle = '#3a3040'; c.beginPath(); c.arc(cx, cy, 34, 0, PI * 2); c.stroke();
    lighter(c, function () { glow(c, cx, cy, 260, '#ffe0f0', 0.3); });
    [0.1, 0.35, 0.6].forEach(function (u) {
      var w = 0.08; wallQuad(c, r.L, u, u + w, 0.1, 0.6, LG(c, 0, 0, 0, H, [[0, '#8a4ad8'], [0.5, '#d84a6a'], [1, '#3a8ad8']]), '#5a5060', 3);
      wallQuad(c, r.R, u, u + w, 0.1, 0.6, LG(c, 0, 0, 0, H, [[0, '#3a8ad8'], [0.5, '#e8c03a'], [1, '#d84a6a']]), '#5a5060', 3);
    });
    shaft(c, 560, 200, 720, 200, 900, H, 380, H, '#fff0e8', 0.22);
    rect(c, 560, 380, 160, 80, '#e8e0d8'); rect(c, 550, 372, 180, 12, '#c9a060');
    [590, 690].forEach(function (x) { rect(c, x - 2, 350, 4, 24, '#fff'); lighter(c, function () { glow(c, x, 346, 30, '#ffd080', 0.9); }); });
    rect(c, 637, 300, 6, 70, '#c9a060'); rect(c, 622, 316, 36, 6, '#c9a060');
    for (var i = 0; i < 7; i++) {
      var t0 = pz(i / 7 * 0.95), t1 = t0 + 0.035 + t0 * 0.05;
      [[0.02, 0.4], [0.6, 0.98]].forEach(function (s2) { poly(c, [r.F(s2[0], t0), r.F(s2[1], t0), r.F(s2[1], t1), r.F(s2[0], t1)], '#5a3a26'); var a = r.F(s2[0], t0), b = r.F(s2[1], t0); poly(c, [a, b, [b[0], b[1] - 40 * r.sc(t0)], [a[0], a[1] - 40 * r.sc(t0)]], '#6e4a30'); });
    }
    motes(c, R, 60, '#fff0d0', 100, 600);
    finish(c, { vig: 0.45, tint: '#e0c0ff', ta: 0.12 });
  },
  balcony_night: function (c, R) {
    skyNight(c, R, 520, 900, 140);
    ridge(c, R, 470, 30, '#141a3a');
    c.fillStyle = '#0e1230'; [[180, 300, 50], [260, 250, 40], [1080, 280, 60]].forEach(function (t) { rect(c, t[0], t[1], t[2], 480 - t[1], '#0e1230'); poly(c, [[t[0] - 8, t[1]], [t[0] + t[2] + 8, t[1]], [t[0] + t[2] / 2, t[1] - 60]], '#0e1230'); });
    city(c, R, 500, 10, 40, '#0c1028', '#ffcf7a', 0.25, 20);
    rect(c, 0, 500, W, 220, LG(c, 0, 500, 0, H, [[0, '#3a3450'], [1, '#1a1628']]));
    rect(c, 0, 480, W, 26, LG(c, 0, 480, 0, 506, [[0, '#cfc8d8'], [1, '#8a84a0']]));
    for (var x = 20; x < W; x += 46) { c.beginPath(); c.moveTo(x, 506); c.bezierCurveTo(x - 14, 540, x + 34, 560, x + 12, 600); c.lineTo(x + 22, 600); c.bezierCurveTo(x, 560, x + 48, 540, x + 34, 506); c.fillStyle = LG(c, x, 0, x + 34, 0, [[0, '#9a94b0'], [0.4, '#e0dae8'], [1, '#6a6480']]); c.fill(); }
    rect(c, 0, 600, W, 24, '#8a84a0'); rect(c, 0, 624, W, 96, '#2a2640');
    lighter(c, function () { glow(c, 0, 360, 380, '#ffb060', 0.35); glow(c, W, 360, 380, '#ffb060', 0.35); });
    curtain(c, -20, 0, 160, 720, '#5a1a3a', 4); curtain(c, W - 140, 0, 160, 720, '#5a1a3a', 4);
    motes(c, R, 30, '#d8ff9a', 300, 600);
    finish(c, { vig: 0.5, tint: '#6a70ff', ta: 0.12 });
  },
  forest: function (c, R) {
    sky(c, [[0, '#a8d0c0'], [1, '#e8f0d8']]);
    lighter(c, function () { glow(c, 900, 60, 500, '#fff6d0', 0.5); });
    var layers = [['#9ab8a4', 0.6, 30], ['#6a9478', 0.8, 40], ['#3e6a4e', 1, 55]];
    layers.forEach(function (L, i) { for (var k = 0; k < 14; k++) { var x = R() * W, w = L[2] * (0.6 + R() * 0.6); rect(c, x - w * 0.15, 0, w * 0.3, 520 + i * 40, L[0]); } treeline(c, R, 120 + i * 30, 60, L[0], 50); ridge(c, R, 540 + i * 50, 20, L[0]); });
    for (var s = 0; s < 6; s++) shaft(c, 820 + s * 40, 0, 880 + s * 40, 0, 500 + s * 120, H, 380 + s * 120, H, '#fff6c8', 0.12);
    [[80, 60], [1180, 70], [260, 40]].forEach(function (t) { rect(c, t[0] - t[1] / 2, 0, t[1], H, LG(c, t[0] - t[1] / 2, 0, t[0] + t[1] / 2, 0, [[0, '#1a2418'], [0.4, '#4a3a2a'], [1, '#141a12']])); });
    poly(c, [[560, 560], [720, 560], [980, H], [300, H]], LG(c, 0, 560, 0, H, [[0, '#b8a878'], [1, '#8a7650']]));
    for (var f = 0; f < 18; f++) { var fx = R() < 0.5 ? R() * 400 : 880 + R() * 400, fy = 640 + R() * 80; for (var l = 0; l < 7; l++) { c.save(); c.translate(fx, fy); c.rotate(-PI / 2 + (l - 3) * 0.3); eli(c, 30, 0, 34, 7, l % 2 ? '#3a6a34' : '#2a5226'); c.restore(); } }
    motes(c, R, 50, '#fff6b0', 100, 650);
    finish(c, { vig: 0.45, haze: '#dfeee0', tint: '#ffe0a0', ta: 0.12 });
  },
  town_market: function (c, R) {
    skyDay(c, R, 400);
    var r = { F: function (u, t) { return [lerp(lerp(520, -200, t), lerp(760, 1480, t), u), lerp(420, H, t)]; } };
    rect(c, 0, 420, W, 300, LG(c, 0, 420, 0, H, [[0, '#b8a488'], [1, '#8a7458']]));
    alpha(c, 0.3, function () { for (var j = 0; j < 14; j++) { var t = pz(j / 14), y = lerp(420, H, t); line(c, 0, y, W, y, '#5a4a38', 1); } for (var i = -10; i < 20; i++) { var a = r.F(i / 10, 0), b = r.F(i / 10, 1); line(c, a[0], a[1], b[0], b[1], '#5a4a38', 1); } });
    [-1, 1].forEach(function (s) {
      for (var k = 0; k < 5; k++) {
        var t0 = pz(k / 5), t1 = pz((k + 1) / 5), x0 = s < 0 ? lerp(520, -200, t0) : lerp(760, 1480, t0), x1 = s < 0 ? lerp(520, -200, t1) : lerp(760, 1480, t1);
        var y0 = lerp(420, H, t0), y1 = lerp(420, H, t1), h0 = 170 * lerp(0.35, 1.6, t0), h1 = 170 * lerp(0.35, 1.6, t1);
        var col = ['#f0e0c4', '#e8d0b0', '#f4ead8', '#dcc8a8'][k % 4];
        poly(c, [[x0, y0], [x1, y1], [x1, y1 - h1 * 2.2], [x0, y0 - h0 * 2.2]], LG(c, x0, 0, x1, 0, [[0, dk(col, 0.25)], [1, col]]), '#5a3a24', 2);
        line(c, x0, y0 - h0 * 2.2, x1, y1 - h1 * 2.2, '#5a3a24', 3 + 4 * t0); line(c, lerp(x0, x1, 0.15), lerp(y0, y1, 0.15) - lerp(h0, h1, 0.15) * 2.1, lerp(x0, x1, 0.45), lerp(y0, y1, 0.45) - lerp(h0, h1, 0.45) * 1.2, '#5a3a24', 2 + 3 * t0); line(c, lerp(x0, x1, 0.45), lerp(y0, y1, 0.45) - lerp(h0, h1, 0.45) * 2.1, lerp(x0, x1, 0.15), lerp(y0, y1, 0.15) - lerp(h0, h1, 0.15) * 1.2, '#5a3a24', 2 + 3 * t0);
        poly(c, [[x0, y0 - h0 * 2.2], [x1, y1 - h1 * 2.2], [x1 + s * 20 * t1, y1 - h1 * 2.9], [x0, y0 - h0 * 2.8]], k % 2 ? '#8a3a2a' : '#6a4a3a');
        line(c, x0, y0 - h0, x1, y1 - h1, '#5a3a24', 3 + 4 * t0); line(c, (x0 + x1) / 2, (y0 + y1) / 2 - (h0 + h1) * 1.1, (x0 + x1) / 2, (y0 + y1) / 2, '#5a3a24', 2 + 3 * t0);
        var wx = lerp(x0, x1, 0.3), wy = lerp(y0, y1, 0.3) - lerp(h0, h1, 0.3) * 1.7; rect(c, wx - 12 * (t0 + 0.4), wy, 24 * (t0 + 0.4), 30 * (t0 + 0.4), '#3a4a6a');
        var ay = lerp(y0, y1, 0.5) - lerp(h0, h1, 0.5) * 0.9; for (var st = 0; st < 6; st++) poly(c, [[lerp(x0, x1, st / 6), ay], [lerp(x0, x1, (st + 1) / 6), ay], [lerp(x0, x1, (st + 1) / 6) - s * 30 * t0, ay + 30 * t0 + 10], [lerp(x0, x1, st / 6) - s * 30 * t0, ay + 30 * t0 + 10]], st % 2 ? '#fff4e0' : ['#d83a3a', '#3a7ad8', '#3aa860'][k % 3]);
      }
    });
    /* cobbles */
    alpha(c, 0.18, function () { for (var j = 0; j < 260; j++) { var t = Math.pow(R(), 0.7), y = lerp(424, H, t), x = lerp(560, 720, R()) + (R() - 0.5) * lerp(200, 1500, t); eli(c, x, y, lerp(3, 16, t), lerp(1.5, 7, t), '#4a3a2a'); } });
    /* distant crowd + stalls + goods */
    alpha(c, 0.55, function () { for (var p2 = 0; p2 < 26; p2++) { var px = 470 + R() * 340, py = 440 + R() * 30, s2 = 0.5 + (py - 440) / 60; eli(c, px, py - 26 * s2, 5 * s2, 6 * s2, '#4a3a3a'); rr(c, px - 8 * s2, py - 20 * s2, 16 * s2, 26 * s2, 5 * s2, ['#6a4a5a', '#4a5a6a', '#7a5a3a', '#5a4a3a'][p2 % 4]); } });
    [[330, 560, 0.9, ['#d83a3a', '#fff4e0'], 1], [950, 560, 0.9, ['#3a7ad8', '#fff4e0'], -1], [520, 480, 0.5, ['#3aa860', '#fff4e0'], 1], [770, 480, 0.5, ['#e0a030', '#fff4e0'], -1]].forEach(function (st) { stall(c, R, st[0], st[1], st[2], st[3]); });
    [[120, 690, 1.3], [210, 670, 1], [1130, 680, 1.2], [1060, 700, 1.4]].forEach(function (cr) { crate(c, R, cr[0], cr[1], cr[2]); });
    lanternsEU(c, 0, 150, W, 150, 70, 9); lanternsEU(c, 120, 240, 1160, 240, 40, 7);
    for (var b = 0; b < 2; b++) { var yb = 110 + b * 90; c.strokeStyle = '#5a3a2a'; c.beginPath(); c.moveTo(0, yb); c.quadraticCurveTo(640, yb + 90, W, yb); c.stroke(); for (var k2 = 1; k2 < 24; k2++) { var q = qb([0, yb], [640, yb + 90], [W, yb], k2 / 24); poly(c, [[q[0] - 10, q[1]], [q[0] + 10, q[1]], [q[0], q[1] + 22]], ['#e84a4a', '#f0c030', '#4a8ae8', '#4ac080'][k2 % 4]); } }
    alpha(c, 0.9, function () { [[60, 1.5], [1230, 1.6], [250, 1.2]].forEach(function (f2) { var x = f2[0], s2 = f2[1], y = H + 10; eli(c, x, y - 150 * s2, 22 * s2, 25 * s2, '#2a1e22'); rr(c, x - 44 * s2, y - 124 * s2, 88 * s2, 150 * s2, 30 * s2, '#2a1e22'); }); });
    motes(c, R, 30, '#fff4d0', 100, 500);

    finish(c, { vig: 0.35, tint: '#ffd8a0', ta: 0.15 });
  },
  dungeon: function (c, R) {
    var r = room(c, { b: [420, 170, 860, 470], ceil: [[0, '#0a0c0c'], [1, '#1e2422']], side: [[0, '#141a18'], [1, '#2e3632']], wall: [[0, '#2e3632'], [1, '#1a201e']], floor: [[0, '#1a1e1c'], [1, '#3a403a']] });
    alpha(c, 0.5, function () { for (var y = 180; y < 470; y += 22) for (var x = 420 + ((y / 22) % 2) * 20; x < 860; x += 40) c.strokeRect(x, y, 40, 22); });
    c.strokeStyle = '#0e1210'; c.lineWidth = 2;
    [0, 1].forEach(function (s) { var fn = s ? r.R : r.L; for (var v = 0; v < 1; v += 0.08) { var a = fn(0, v), b = fn(1, v); line(c, a[0], a[1], b[0], b[1], 'rgba(10,14,12,.6)', 2); } });
    archPath(c, 640, 250, 150, 220); c.fillStyle = '#050606'; c.fill();
    for (var i = 0; i < 9; i++) line(c, 575 + i * 16, 270, 575 + i * 16, 470, '#3a3a3a', 4);
    [[0.35, 'L'], [0.35, 'R'], [0.75, 'L'], [0.75, 'R']].forEach(function (t) { var q = r[t[1]](t[0], 0.4), s = r.sc(t[0]); lighter(c, function () { glow(c, q[0], q[1] - 20 * s, 220 * s, '#ff8a30', 0.55); glow(c, q[0], q[1] - 20 * s, 30 * s, '#ffe0a0', 0.9); }); rect(c, q[0] - 4 * s, q[1] - 10 * s, 8 * s, 40 * s, '#3a2a1a'); });
    c.strokeStyle = '#5a5a5a'; c.lineWidth = 3; for (var k = 0; k < 8; k++) { c.beginPath(); c.ellipse(300, 150 + k * 16, 6, 9, 0, 0, PI * 2); c.stroke(); }
    lighter(c, function () { for (var j = 0; j < 20; j++) { var x = R() * W, y = 560 + R() * 160; c.fillStyle = 'rgba(255,140,60,.08)'; eli(c, x, y, 40 + R() * 60, 6, 'rgba(255,150,70,.08)'); } });
    finish(c, { vig: 0.7, tint: '#30a080', ta: 0.15 });
  },
  throne_room: function (c, R) {
    var r = room(c, { b: [360, 70, 920, 450], ceil: [[0, '#2a1a14'], [1, '#6a4a2a']], side: [[0, '#5a3a2e'], [1, '#a07a5a']], wall: [[0, '#b8946a'], [1, '#8a6a4a']], floor: [[0, '#6a5446'], [1, '#c8b4a0']] });
    checker(c, r, 8, 10, null, 'rgba(40,20,10,.25)');
    archWin(c, 640, 90, 220, 300, [[0, '#fffbe8'], [1, '#e8d0a0']], '#6a4a2a', 4);
    lighter(c, function () { glow(c, 640, 240, 380, '#ffe6b0', 0.5); });
    [440, 840].forEach(function (x) { poly(c, [[x - 34, 90], [x + 34, 90], [x + 34, 330], [x, 360], [x - 34, 330]], LG(c, x - 34, 0, x + 34, 0, [[0, '#6a1420'], [0.5, '#b02a3a'], [1, '#6a1420']])); eli(c, x, 200, 16, 20, '#e8c050'); });
    for (var s = 0; s < 4; s++) rect(c, 520 - s * 30, 420 + s * 12, 240 + s * 60, 12, s % 2 ? '#d8c8b0' : '#b8a890');
    rect(c, 600, 250, 80, 170, LG(c, 600, 0, 680, 0, [[0, '#8a6020'], [0.5, '#f0d070'], [1, '#8a6020']])); poly(c, [[600, 250], [640, 205], [680, 250]], '#e8c050'); rect(c, 612, 268, 56, 110, '#8a1a2a'); rect(c, 596, 360, 88, 40, '#c9a040');
    poly(c, [r.F(0.42, 0.03), r.F(0.58, 0.03), r.F(0.62, 1), r.F(0.38, 1)], LG(c, 0, 460, 0, H, [[0, '#8a1a28'], [1, '#c0303e']]));
    [0.1, 0.35, 0.65].forEach(function (t) { var q = r.L(t, 0), q2 = r.L(t, 1), w = 50 * r.sc(t) * 1.3; column(c, q[0] + w, q[1] + 30, q2[1], w, '#e0d4c0', '#d8b050'); q = r.R(t, 0); q2 = r.R(t, 1); column(c, q[0] - w, q[1] + 30, q2[1], w, '#e0d4c0', '#d8b050'); });
    motes(c, R, 50, '#ffe0a0', 60, 600);
    finish(c, { vig: 0.5, tint: '#ffb060', ta: 0.15 });
  },
  tea_room: function (c, R) {
    var r = room(c, { b: [240, 90, 1040, 480], ceil: [[0, '#e6e0d0'], [1, '#faf4e8']], side: [[0, '#b8d4c4'], [1, '#e0eee6']], wall: [[0, '#eef6ee'], [1, '#d8e8dc']], floor: [[0, '#a07a5a'], [1, '#d0aa82']] });
    alpha(c, 0.25, function () { for (var x = 260; x < 1030; x += 28) rect(c, x, 90, 10, 390, '#9ac8b0'); });
    rect(c, 440, 120, 400, 290, '#ffffff'); rect(c, 452, 132, 376, 266, LG(c, 0, 132, 0, 398, [[0, '#d8ecfa'], [1, '#fdf6e6']]));
    c.save(); c.beginPath(); c.rect(452, 132, 376, 266); c.clip(); for (var q2 = 0; q2 < 3; q2++) cloud(c, R, 500 + q2 * 130, 190 + q2 * 20, 140, '#ffffff', '#c8dcec', 0.8); ridge(c, R, 370, 20, '#a8c8a0'); treeline(c, R, 390, 20, '#7aa878', 16); c.restore();
    rect(c, 637, 132, 6, 266, '#fff'); rect(c, 452, 262, 376, 6, '#fff');
    alpha(c, 0.8, function () { curtain(c, 420, 110, 110, 320, '#fbf6f2', 4, 440); curtain(c, 750, 110, 110, 320, '#fbf6f2', 4, 840); });
    shaft(c, 470, 150, 820, 150, 900, H, 420, H, '#fffbe6', 0.18);
    eli(c, 640, 640, 360, 90, LG(c, 0, 560, 0, 720, [[0, '#ffffff'], [1, '#e0dcd6']])); rect(c, 280, 640, 720, 80, LG(c, 0, 640, 0, 720, [[0, '#f4f0ea'], [1, '#d8d0c8']]));
    for (var k = 0; k < 14; k++) { var a = PI * k / 13; eli(c, 640 + Math.cos(a) * 360, 640 + Math.sin(a) * 90 + 10, 16, 10, '#fff'); }
    eli(c, 520, 600, 60, 40, LG(c, 0, 560, 0, 640, [[0, '#ffffff'], [1, '#c8d8e8']])); eli(c, 520, 562, 20, 8, '#8ab0d0'); poly(c, [[578, 590], [620, 560], [612, 572], [576, 602]], '#e0ecf6');
    [[740, 610], [860, 620]].forEach(function (t) { eli(c, t[0], t[1] + 8, 34, 9, '#f4f4f8'); rect(c, t[0] - 18, t[1] - 16, 36, 22, '#ffffff'); eli(c, t[0], t[1] - 16, 18, 5, '#b8703a'); });
    rect(c, 950, 460, 6, 170, '#d8b060'); [490, 540, 590].forEach(function (y, i) { eli(c, 953, y, 60 - i * 12, 7, '#f6f6f6'); for (var j = -2; j <= 2; j++) eli(c, 953 + j * (18 - i * 3), y - 9, 7, 6, ['#f6a0b8', '#fff0c0', '#a8d8a0'][(i + j + 3) % 3]); });
    bush(c, R, 330, 560, 80, 90, '#4a8a5a', '#8ac08a', ['#f6a0c0', '#ffd0e0', '#ffffff'], 16);
    finish(c, { vig: 0.3, tint: '#ffe6d0', ta: 0.15 });
  },
  lake: function (c, R) {
    sky(c, [[0, '#6aa8e0'], [0.6, '#c8e0f0'], [1, '#f8f0e0']], 420);
    lighter(c, function () { glow(c, 800, 200, 400, '#fff4d0', 0.5); });
    for (var i = 0; i < 4; i++) cloud(c, R, R() * W, 90 + R() * 120, 220 + R() * 200, '#ffffff', '#c0d0e4', 0.7);
    ridge(c, R, 330, 70, '#9ab0cc', 0.7); ridge(c, R, 380, 40, '#6a8a8a'); treeline(c, R, 420, 30, '#3a6a4a', 20);
    rect(c, 0, 420, W, 300, LG(c, 0, 420, 0, H, [[0, '#8ab8d8'], [0.5, '#5a8ab0'], [1, '#2a4a6a']]));
    c.save(); c.translate(0, 840); c.scale(1, -1); c.globalAlpha = 0.35; ridge(c, RNG(9), 380, 40, '#4a6a70'); treeline(c, RNG(7), 420, 30, '#2a4a3a', 20); c.restore();
    lighter(c, function () { for (var k = 0; k < 120; k++) { var x = 800 + (R() - 0.5) * 300 * (1 + R()), y = 430 + R() * 280; c.globalAlpha = 0.3 + R() * 0.5; line(c, x, y, x + 6 + R() * 18, y, '#fff6d8', 1.5); } });
    water(c, R, 420, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], 100);
    for (var r2 = 0; r2 < 40; r2++) { var x0 = R() < 0.5 ? R() * 200 : 1080 + R() * 200; line(c, x0, H, x0 + (R() - 0.5) * 30, 560 + R() * 80, '#3a5a2a', 3); }
    finish(c, { vig: 0.35, tint: '#ffe0b0', ta: 0.1 });
  },
  house_day: function (c, R) { house(c, R, false); },
  house_night: function (c, R) { house(c, R, true); },
  daughter_room: function (c, R) {
    var r = room(c, { b: [240, 100, 1040, 480], ceil: [[0, '#f0e0e4'], [1, '#fff4f4']], side: [[0, '#f0c8d4'], [1, '#fde6ec']], wall: [[0, '#fff0f2'], [1, '#f6dce2']], floor: [[0, '#c89a78'], [1, '#e6c4a0']] });
    alpha(c, 0.35, function () { for (var y = 120; y < 470; y += 36) for (var x = 260 + (y % 72 ? 18 : 0); x < 1030; x += 36) { eli(c, x, y, 4, 4, '#f48aa8'); eli(c, x, y, 1.5, 1.5, '#fff6c0'); } });
    rect(c, 530, 140, 220, 200, '#ffffff'); rect(c, 542, 152, 196, 176, LG(c, 0, 152, 0, 328, [[0, '#9ad0f8'], [1, '#e8f6ff']]));
    cloud(c, R, 620, 220, 120, '#ffffff', '#d0e4f4', 0.8);
    rect(c, 637, 152, 6, 176, '#fff'); rect(c, 542, 238, 196, 6, '#fff');
    curtain(c, 500, 130, 70, 240, '#ffc0d0', 3, 520); curtain(c, 710, 130, 70, 240, '#ffc0d0', 3, 760);
    for (var k = 0; k < 10; k++) { var q = qb([500, 128], [640, 150], [780, 128], k / 9); eli(c, q[0], q[1], 14, 8, '#ffe0e8'); }
    shaft(c, 545, 160, 735, 160, 820, H, 460, H, '#fffbe8', 0.2);
    eli(c, 640, 640, 260, 50, '#f8b0c4'); eli(c, 640, 640, 200, 36, '#fcd0dc');
    rr(c, 60, 420, 380, 180, 20, '#f4e0c8'); rr(c, 80, 400, 340, 90, 24, '#ffffff'); rr(c, 60, 470, 380, 150, 20, LG(c, 0, 470, 0, 620, [[0, '#ffb8cc'], [1, '#e888a8']]));
    for (var j = 0; j < 5; j++) for (var i = 0; i < 6; i++) rect(c, 80 + i * 60, 490 + j * 26, 26, 3, 'rgba(255,255,255,.5)');
    eli(c, 360, 420, 40, 44, '#c89a6a'); eli(c, 335, 385, 14, 14, '#c89a6a'); eli(c, 385, 385, 14, 14, '#c89a6a'); eli(c, 360, 430, 22, 20, '#e6c49a'); eli(c, 348, 412, 3, 3, '#2a1a10'); eli(c, 372, 412, 3, 3, '#2a1a10');
    rect(c, 860, 430, 240, 16, '#e0b890'); rect(c, 870, 446, 14, 150, '#c89a70'); rect(c, 1076, 446, 14, 150, '#c89a70');
    [['#f48aa8', 30], ['#8ac0f0', 26], ['#f0d070', 34]].forEach(function (b, i) { rect(c, 900 + i * 30, 430 - b[1], 24, b[1], b[0]); });
    eli(c, 1030, 410, 18, 20, '#a0d8b0'); rect(c, 1024, 410, 12, 20, '#e6a070');
    finish(c, { vig: 0.3, tint: '#ffd0e0', ta: 0.12 });
  },
  town_square: function (c, R) {
    skyDay(c, R, 420);
    var cols = ['#f2e2c8', '#e8d0b8', '#f6ead6', '#dcc4a8', '#eadcc6'];
    for (var x = -20; x < W; x += 150) { var h = 180 + R() * 100, col = cols[Math.floor(R() * 5)]; rect(c, x, 420 - h, 150, h, col); poly(c, [[x - 6, 420 - h], [x + 156, 420 - h], [x + 75, 420 - h - 60 - R() * 30]], R() < 0.5 ? '#8a3a2a' : '#5a4a6a'); for (var wy = 420 - h + 30; wy < 380; wy += 50) for (var wx = x + 20; wx < x + 130; wx += 40) { rect(c, wx, wy, 22, 30, '#4a5a7a'); rect(c, wx, wy, 22, 4, '#fff'); } rect(c, x, 400, 150, 20, dk(col, 0.2)); }
    rect(c, 0, 420, W, 300, LG(c, 0, 420, 0, H, [[0, '#c8b8a0'], [1, '#9a8468']]));
    alpha(c, 0.3, function () { for (var k = 1; k < 10; k++) { c.strokeStyle = '#6a5a48'; c.beginPath(); c.ellipse(640, 540, k * 80, k * 22, 0, 0, PI * 2); c.stroke(); } });
    eli(c, 640, 560, 220, 50, '#a8a0a0'); eli(c, 640, 552, 200, 40, LG(c, 0, 512, 0, 592, [[0, '#6aa8d0'], [1, '#3a78a8']])); eli(c, 640, 510, 70, 18, '#b8b0b0'); rect(c, 628, 440, 24, 80, '#c8c0c0'); eli(c, 640, 440, 44, 10, '#c8c0c0');
    lighter(c, function () { for (var j = 0; j < 12; j++) { var a = (j / 12) * PI * 2; c.strokeStyle = 'rgba(200,230,255,.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(640, 420); c.quadraticCurveTo(640 + Math.cos(a) * 60, 380, 640 + Math.cos(a) * 90, 510 + Math.sin(a) * 14); c.stroke(); } glow(c, 640, 420, 40, '#ffffff', 0.7); });
    tree(c, R, 120, 560, 1.6, '#3a6a3a', '#7ab060'); tree(c, R, 1160, 560, 1.6, '#3a6a3a', '#7ab060');

    finish(c, { vig: 0.35, tint: '#ffd8a0', ta: 0.12 });
  },
  school: function (c, R) {
    var r = room(c, { b: [300, 110, 1060, 460], ceil: [[0, '#d8d4c8'], [1, '#f2eee4']], side: [[0, '#d8c8a8'], [1, '#f0e4cc']], wall: [[0, '#f4ead4'], [1, '#e2d4b8']], floor: [[0, '#8a6444'], [1, '#c09470']] });
    [0.1, 0.4, 0.7].forEach(function (u) { wallQuad(c, r.L, u, u + 0.2, 0.15, 0.62, '#ffffff'); wallQuad(c, r.L, u + 0.01, u + 0.19, 0.17, 0.6, LG(c, 0, 0, 0, 400, [[0, '#a8d4f4'], [1, '#fff6d8']])); shaft(c, r.L(u, 0.2)[0], r.L(u, 0.2)[1], r.L(u + 0.2, 0.2)[0], r.L(u + 0.2, 0.2)[1], r.F(0.6, pz(u + 0.1))[0] + 200, r.F(0.6, pz(u + 0.1))[1], r.F(0.1, pz(u))[0], r.F(0.1, pz(u))[1], '#fff0c0', 0.2); });
    rect(c, 470, 170, 440, 200, '#8a6a44'); rect(c, 480, 180, 420, 180, LG(c, 0, 180, 0, 360, [[0, '#2e5a44'], [1, '#244a38']]));
    alpha(c, 0.7, function () { c.strokeStyle = '#f0f0e8'; c.lineWidth = 2; for (var k = 0; k < 6; k++) { var y = 205 + k * 24; c.beginPath(); c.moveTo(500, y); for (var x = 500; x < 500 + 150 + R() * 200; x += 10) c.lineTo(x, y + (R() - 0.5) * 6); c.stroke(); } });
    rect(c, 480, 360, 420, 8, '#c8b090'); eli(c, 990, 170, 26, 26, '#fff'); c.strokeStyle = '#333'; c.lineWidth = 3; c.beginPath(); c.arc(990, 170, 26, 0, PI * 2); c.stroke(); line(c, 990, 170, 990, 154, '#333', 3); line(c, 990, 170, 1002, 176, '#333', 2);
    for (var j = 0; j < 4; j++) for (var i = 0; i < 4; i++) {
      var t = pz((j + 0.6) / 4.6) * 0.95, u = 0.12 + i * 0.25, s = r.sc(t), q = r.F(u, t);
      poly(c, [[q[0] - 70 * s, q[1] - 70 * s], [q[0] + 70 * s, q[1] - 70 * s], [q[0] + 80 * s, q[1] - 56 * s], [q[0] - 80 * s, q[1] - 56 * s]], '#c89a6a');
      rect(c, q[0] - 80 * s, q[1] - 56 * s, 160 * s, 6 * s, '#8a5a3a'); rect(c, q[0] - 70 * s, q[1] - 50 * s, 6 * s, 50 * s, '#6a6a70'); rect(c, q[0] + 64 * s, q[1] - 50 * s, 6 * s, 50 * s, '#6a6a70');
    }
    finish(c, { vig: 0.35, tint: '#ffe0a0', ta: 0.15 });
  },
  church: function (c, R) {
    skyDay(c, R, 480);
    ridge(c, R, 470, 30, '#8ab0a0'); treeline(c, R, 490, 30, '#4a7a4a', 26);
    rect(c, 0, 480, W, 240, LG(c, 0, 480, 0, H, [[0, '#7aa860'], [1, '#4a7a3a']]));
    var gx = 640;
    rect(c, gx - 200, 250, 400, 250, LG(c, gx - 200, 0, gx + 200, 0, [[0, '#d8d0c4'], [0.5, '#f2ece2'], [1, '#b8b0a4']]));
    poly(c, [[gx - 220, 254], [gx, 140], [gx + 220, 254]], '#6a4a5a');
    rect(c, gx - 50, 20, 100, 240, LG(c, gx - 50, 0, gx + 50, 0, [[0, '#d0c8bc'], [0.5, '#f6f0e6'], [1, '#b0a89c']])); poly(c, [[gx - 60, 24], [gx, -60], [gx + 60, 24]], '#5a3a4a');
    archPath(c, gx, 60, 40, 70); c.fillStyle = '#3a3040'; c.fill(); eli(c, gx, 190, 50, 50, '#3a5a9a'); for (var k = 0; k < 8; k++) line(c, gx, 190, gx + Math.cos(k * PI / 4) * 50, 190 + Math.sin(k * PI / 4) * 50, '#e8e0d0', 3);
    archPath(c, gx, 360, 90, 140); c.fillStyle = '#5a3a28'; c.fill(); line(c, gx, 380, gx, 500, '#3a2418', 3);
    [gx - 140, gx + 140].forEach(function (x) { archPath(c, x, 300, 44, 120); c.fillStyle = LG(c, 0, 300, 0, 420, [[0, '#c84a6a'], [1, '#3a6ad8']]); c.fill(); });
    rect(c, gx - 4, -80, 8, 40, '#d8b050'); rect(c, gx - 14, -70, 28, 6, '#d8b050');
    poly(c, [[gx - 50, 500], [gx + 50, 500], [gx + 200, H], [gx - 200, H]], '#d8ccb4');
    tree(c, R, 200, 520, 2, '#2e5a32', '#6a9a50'); tree(c, R, 1080, 530, 2.2, '#2e5a32', '#6a9a50');
    [[330, 560], [400, 590], [900, 570], [960, 600]].forEach(function (t) { rr(c, t[0] - 16, t[1] - 40, 32, 44, 14, '#a8a4a8'); });
    finish(c, { vig: 0.35, tint: '#ffe0b0', ta: 0.12 });
  },
  castle_gate: function (c, R) {
    skyDay(c, R, 520);
    ridge(c, R, 520, 20, '#8aa8a0');
    rect(c, 0, 240, W, 300, LG(c, 0, 240, 0, 540, [[0, '#a8a098'], [1, '#6a645e']]));
    for (var x = 0; x < W; x += 60) rect(c, x, 214, 36, 30, '#a8a098');
    alpha(c, 0.35, function () { for (var y = 250; y < 540; y += 28) for (var x2 = ((y / 28) % 2) * 30; x2 < W; x2 += 60) c.strokeRect(x2, y, 60, 28); });
    [[330, 150, 170], [950, 150, 170]].forEach(function (t) { rect(c, t[0] - t[2] / 2, t[1], t[2], 400, LG(c, t[0] - t[2] / 2, 0, t[0] + t[2] / 2, 0, [[0, '#6a645e'], [0.4, '#c8c0b6'], [1, '#5a544e']])); for (var k = 0; k < 5; k++) rect(c, t[0] - t[2] / 2 + k * 36, t[1] - 26, 24, 30, '#b0a89e'); poly(c, [[t[0] - t[2] / 2 - 10, t[1] - 26], [t[0], t[1] - 150], [t[0] + t[2] / 2 + 10, t[1] - 26]], '#4a3a5a'); archPath(c, t[0], t[1] + 60, 30, 60); c.fillStyle = '#2a2430'; c.fill(); rect(c, t[0] - 2, t[1] - 220, 4, 80, '#3a3030'); poly(c, [[t[0] + 2, t[1] - 220], [t[0] + 70, t[1] - 200], [t[0] + 2, t[1] - 180]], '#b02a3a'); });
    archPath(c, 640, 250, 260, 300); c.fillStyle = '#6a645e'; c.fill(); archPath(c, 640, 270, 230, 280); c.fillStyle = LG(c, 0, 270, 0, 550, [[0, '#0e0c10'], [1, '#2a2620']]); c.fill();
    c.save(); archPath(c, 640, 270, 230, 170); c.clip(); for (var i = 0; i < 12; i++) line(c, 525 + i * 21, 270, 525 + i * 21, 440, '#3a3430', 5); for (var j = 0; j < 8; j++) line(c, 520, 290 + j * 22, 760, 290 + j * 22, '#3a3430', 5); c.restore();
    [[440, 300], [840, 300]].forEach(function (t) { poly(c, [[t[0] - 30, t[1]], [t[0] + 30, t[1]], [t[0] + 30, t[1] + 140], [t[0], t[1] + 120], [t[0] - 30, t[1] + 140]], LG(c, t[0] - 30, 0, t[0] + 30, 0, [[0, '#1a2a6a'], [0.5, '#3a5ab0'], [1, '#1a2a6a']])); eli(c, t[0], t[1] + 50, 12, 14, '#e8c050'); });
    rect(c, 0, 540, W, 180, LG(c, 0, 540, 0, H, [[0, '#9a8a6a'], [1, '#6a5a44']])); poly(c, [[525, 550], [755, 550], [960, H], [320, H]], LG(c, 0, 550, 0, H, [[0, '#6a4a30'], [1, '#8a6a48']]));
    alpha(c, 0.4, function () { for (var k = 0; k < 10; k++) { var y = lerp(550, H, pz(k / 10)); line(c, lerp(525, 320, (y - 550) / 170), y, lerp(755, 960, (y - 550) / 170), y, '#3a2a1a', 2); } });
    finish(c, { vig: 0.4, tint: '#ffd8a0', ta: 0.1 });
  },
  field_training: function (c, R) {
    skyDay(c, R, 440);
    ridge(c, R, 420, 40, '#9ab4c4');
    c.fillStyle = '#7a8aa0'; rect(c, 900, 330, 160, 100, '#8a98ac'); rect(c, 930, 280, 30, 60, '#8a98ac'); rect(c, 1010, 290, 30, 50, '#8a98ac'); poly(c, [[925, 280], [945, 240], [965, 280]], '#6a7890');
    treeline(c, R, 440, 20, '#5a8a50', 20);
    rect(c, 0, 440, W, 280, LG(c, 0, 440, 0, H, [[0, '#8ab860'], [1, '#5a8a3a']]));
    alpha(c, 0.4, function () { for (var k = 0; k < 400; k++) { var x = R() * W, y = 450 + R() * 270, h = 4 + (y - 440) / 20; line(c, x, y, x + (R() - 0.5) * 4, y - h, R() < 0.5 ? '#4a7a2a' : '#a8d080', 1.5); } });
    for (var f = 0; f < W; f += 90) { rect(c, f, 480, 8, 60, '#8a6a4a'); } rect(c, 0, 490, W, 6, '#a07a54'); rect(c, 0, 515, W, 6, '#a07a54');
    [[380, 600, 1.2], [640, 560, 0.9], [880, 620, 1.3]].forEach(function (d) { var x = d[0], y = d[1], s = d[2]; rect(c, x - 5 * s, y - 150 * s, 10 * s, 150 * s, '#7a5a3a'); rect(c, x - 50 * s, y - 120 * s, 100 * s, 10 * s, '#7a5a3a'); rr(c, x - 28 * s, y - 135 * s, 56 * s, 80 * s, 20 * s, '#d8c090', '#8a7040', 2); eli(c, x, y - 150 * s, 18 * s, 18 * s, '#d8c090'); line(c, x - 28 * s, y - 100 * s, x + 28 * s, y - 100 * s, '#8a7040', 3); });
    [[1100, 520]].forEach(function (t) { for (var k = 5; k > 0; k--) eli(c, t[0], t[1], k * 14, k * 16, k % 2 ? '#e8e0d0' : '#c83a3a'); rect(c, t[0] - 4, t[1] + 70, 8, 60, '#7a5a3a'); });
    rect(c, 120, 520, 140, 10, '#7a5a3a'); for (var s2 = 0; s2 < 5; s2++) { line(c, 140 + s2 * 25, 440, 140 + s2 * 25, 600, '#9aa0a8', 4); poly(c, [[134 + s2 * 25, 440], [146 + s2 * 25, 440], [140 + s2 * 25, 420]], '#c0c6ce'); }
    finish(c, { vig: 0.35, tint: '#ffe0a0', ta: 0.12 });
  },
  festival: function (c, R) {
    skyNight(c, R, 460);
    lighter(c, function () {
      [[300, 150, '#ff6a8a'], [700, 110, '#8adfff'], [1000, 180, '#ffd06a'], [520, 220, '#b08aff']].forEach(function (f) {
        glow(c, f[0], f[1], 140, f[2], 0.25);
        for (var k = 0; k < 40; k++) { var a = k / 40 * PI * 2, r1 = 60 + R() * 40; c.strokeStyle = rgba(f[2], 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(f[0] + Math.cos(a) * 20, f[1] + Math.sin(a) * 20); c.lineTo(f[0] + Math.cos(a) * r1, f[1] + Math.sin(a) * r1 + 8); c.stroke(); glow(c, f[0] + Math.cos(a) * r1, f[1] + Math.sin(a) * r1 + 8, 6, '#ffffff', 0.9); }
      });
    });
    city(c, R, 460, 60, 180, '#1a1428', '#ffc070', 0.35, 60);
    rect(c, 0, 460, W, 260, LG(c, 0, 460, 0, H, [[0, '#3a2a2a'], [1, '#1a1216']]));
    [[0, 180], [880, 1280]].forEach(function (s) { for (var x = s[0]; x < s[1]; x += 140) { rect(c, x + 10, 400, 120, 140, '#5a2e22'); for (var k = 0; k < 6; k++) poly(c, [[x + k * 22, 390], [x + (k + 1) * 22, 390], [x + (k + 1) * 22 + 2, 420], [x + k * 22 - 2, 420]], k % 2 ? '#fff0e0' : '#d83a3a'); lighter(c, function () { glow(c, x + 70, 470, 120, '#ffb060', 0.35); }); } });
    lanterns(c, R, -20, 200, 1300, 220, 60, ['#ff6a4a', '#ffb040', '#ff8ab0'], 22); lanterns(c, R, -20, 300, 1300, 280, 50, ['#ffb040', '#ff6a4a'], 18);
    alpha(c, 0.9, function () { crowd(c, R, 560, 22, '#120c10'); });
    bokeh(c, R, 50, ['#ffb060', '#ff6a8a', '#ffe0a0'], 6, 22, 0.35, 300, H);
    finish(c, { vig: 0.5, tint: '#ff8a50', ta: 0.12 });
  },
  tavern: function (c, R) {
    var r = room(c, { b: [220, 100, 1060, 470], ceil: [[0, '#1e120c'], [1, '#3e281a']], side: [[0, '#2a1a10'], [1, '#5a3a24']], wall: [[0, '#5a3a24'], [1, '#3a2416']], floor: [[0, '#2a1a10'], [1, '#5a3a22']] });
    alpha(c, 0.4, function () { for (var x = 220; x < 1060; x += 36) line(c, x, 100, x, 470, '#2a1a10', 2); });
    for (var y = 100; y < 480; y += 60) line(c, 0, y * 0.2, W, y * 0.2, '#1a0e08', 10);
    [180, 250, 320].forEach(function (y) { rect(c, 300, y, 420, 8, '#7a5030'); for (var x = 310; x < 700; x += 18 + R() * 10) { var col = ['#3a6a3a', '#6a2a2a', '#c8a040', '#3a4a7a'][Math.floor(R() * 4)]; rect(c, x, y - 34, 10, 34, col); rect(c, x + 3, y - 44, 4, 10, col); glow(c, x + 3, y - 20, 6, '#ffffff', 0.3); } });
    rect(c, 820, 280, 180, 190, '#2a1a12'); archPath(c, 910, 320, 120, 150); c.fillStyle = '#0e0806'; c.fill();
    lighter(c, function () { glow(c, 910, 440, 180, '#ff7a20', 0.6); for (var k = 0; k < 8; k++) { var fx = 870 + R() * 80; poly(c, [[fx - 12, 470], [fx + 12, 470], [fx + (R() - 0.5) * 10, 400 + R() * 30]], rgba(['#ffb040', '#ff6a20', '#ffe080'][k % 3], 0.8)); } });
    [[180, 560, 1.4], [120, 470, 1.2], [1150, 560, 1.4]].forEach(function (b) { var s = b[2]; eli(c, b[0], b[1], 60 * s, 70 * s, LG(c, b[0] - 60 * s, 0, b[0] + 60 * s, 0, [[0, '#3a2414'], [0.4, '#8a5a34'], [1, '#2a180e']])); [-0.5, 0.5].forEach(function (h) { eli(c, b[0], b[1] + h * 90 * s, 60 * s, 8 * s, 'rgba(40,40,40,.6)'); }); });
    rect(c, 0, 560, W, 30, LG(c, 0, 560, 0, 590, [[0, '#a07040'], [1, '#6a4020']])); rect(c, 0, 590, W, 130, LG(c, 0, 590, 0, H, [[0, '#4a2c18'], [1, '#24140a']]));
    [[480, 520], [560, 526], [760, 522]].forEach(function (m) { rect(c, m[0] - 16, m[1], 32, 40, 'rgba(240,210,150,.85)'); rect(c, m[0] - 16, m[1], 32, 8, '#fff8e8'); c.strokeStyle = '#6a4a2a'; c.lineWidth = 4; c.beginPath(); c.arc(m[0] + 18, m[1] + 20, 10, -PI / 2, PI / 2); c.stroke(); });
    [[400, 90], [880, 90], [640, 60]].forEach(function (l) { line(c, l[0], 0, l[0], l[1], '#2a1a10', 2); lighter(c, function () { glow(c, l[0], l[1] + 20, 200, '#ffa040', 0.45); }); rr(c, l[0] - 12, l[1], 24, 34, 6, '#ffe0a0', '#3a2a1a', 3); });
    motes(c, R, 30, '#ffc080', 100, 500);
    finish(c, { vig: 0.55, tint: '#ff8a40', ta: 0.2 });
  },
  mage_tower: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#120e2a'], [1, '#2a1e4a']]));
    for (var k = 0; k < 9; k++) { var x = k * 160 - 20; rect(c, x, 0, 150, 520, LG(c, x, 0, x + 150, 0, [[0, '#1a1438'], [0.5, '#2e2456'], [1, '#1a1438']])); }
    books(c, R, 60, 120, 260, 360, 6, '#2a1e3a'); books(c, R, 960, 120, 260, 360, 6, '#2a1e3a');
    eli(c, 640, 220, 150, 150, '#3a2e5a'); eli(c, 640, 220, 136, 136, LG(c, 0, 90, 0, 360, [[0, '#0a0c2a'], [1, '#2a2a6a']]));
    c.save(); c.beginPath(); c.arc(640, 220, 136, 0, PI * 2); c.clip(); stars(c, R, 120, 360); moon(c, 700, 170, 26); c.restore();
    for (var s = 0; s < 4; s++) line(c, 640 + Math.cos(s * PI / 4) * 136, 220 + Math.sin(s * PI / 4) * 136, 640 - Math.cos(s * PI / 4) * 136, 220 - Math.sin(s * PI / 4) * 136, '#3a2e5a', 5);
    rect(c, 0, 500, W, 220, LG(c, 0, 500, 0, H, [[0, '#231a3e'], [1, '#120c22']]));
    lighter(c, function () {
      c.save(); c.translate(640, 610); c.scale(1, 0.26);
      [260, 220, 150].forEach(function (rad, i) { c.strokeStyle = rgba('#7af0ff', 0.8 - i * 0.15); c.lineWidth = 6; c.beginPath(); c.arc(0, 0, rad, 0, PI * 2); c.stroke(); });
      c.strokeStyle = rgba('#b08aff', 0.8); c.lineWidth = 4; c.beginPath(); for (var t = 0; t <= 6; t++) { var a = t * PI * 2 / 6 * 2 - PI / 2; if (t) c.lineTo(Math.cos(a) * 220, Math.sin(a) * 220); else c.moveTo(Math.cos(a) * 220, Math.sin(a) * 220); } c.stroke();
      for (var t2 = 0; t2 < 24; t2++) { var a2 = t2 / 24 * PI * 2; c.fillStyle = rgba('#b0f8ff', 0.8); c.fillRect(Math.cos(a2) * 240 - 5, Math.sin(a2) * 240 - 5, 10, 10); }
      c.restore();
      glow(c, 640, 600, 320, '#6ae0ff', 0.25);
      for (var o = 0; o < 7; o++) { var ox = 300 + R() * 680, oy = 200 + R() * 260; glow(c, ox, oy, 40, ['#8af0ff', '#c08aff', '#ffd08a'][o % 3], 0.6); glow(c, ox, oy, 8, '#ffffff', 1); }
    });
    [[420, 470], [470, 480], [860, 475]].forEach(function (b, i) { eli(c, b[0], b[1], 16, 18, ['#8a3aff', '#3affb0', '#ff4a8a'][i]); rect(c, b[0] - 5, b[1] - 34, 10, 18, 'rgba(200,220,255,.7)'); });
    motes(c, R, 60, '#a8e8ff', 50, 700);
    finish(c, { vig: 0.55, tint: '#6a4aff', ta: 0.12 });
  },
  hill_sunset: function (c, R) {
    skySunset(c, R, 560);
    ridge(c, R, 540, 30, '#6a3a5a', 0.7);
    city(c, R, 560, 6, 30, '#4a2440', '#ffc070', 0.2, 14);
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, 560); c.bezierCurveTo(300, 520, 600, 470, 900, 500); c.bezierCurveTo(1100, 520, 1200, 560, W, 580); c.lineTo(W, H); c.closePath(); c.fillStyle = LG(c, 0, 470, 0, H, [[0, '#6a5a3a'], [1, '#2a2418']]); c.fill();
    lighter(c, function () { c.strokeStyle = 'rgba(255,190,120,.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 560); c.bezierCurveTo(300, 520, 600, 470, 900, 500); c.bezierCurveTo(1100, 520, 1200, 560, W, 580); c.stroke(); });
    var tx = 860, ty = 500; poly(c, [[tx - 10, ty], [tx - 4, ty - 150], [tx + 6, ty - 150], [tx + 12, ty]], '#2a1a1e');
    for (var k = 0; k < 14; k++) { var a = R() * PI, d = R() * 90; eli(c, tx + Math.cos(a) * d * 1.3, ty - 190 - Math.sin(a) * d * 0.6, 40 + R() * 20, 30 + R() * 14, '#2e1e24'); }
    alpha(c, 0.5, function () { for (var g = 0; g < 300; g++) { var x = R() * W, y = 560 + R() * 160; line(c, x, y, x + 3, y - 10, R() < 0.5 ? '#ffb070' : '#3a2a1a', 1.5); } });
    finish(c, { vig: 0.4 });
  },
  farm: function (c, R) {
    skyDay(c, R, 420);
    ridge(c, R, 400, 30, '#9ab8c8'); treeline(c, R, 420, 24, '#5a8a50', 22);
    rect(c, 0, 420, W, 300, LG(c, 0, 420, 0, H, [[0, '#a8c870'], [1, '#6a9a40']]));
    for (var i = -20; i < 40; i++) { var t = i / 20; c.strokeStyle = i % 2 ? '#5a8a30' : '#c8b060'; c.lineWidth = 8; c.beginPath(); c.moveTo(640 + (t - 0.5) * 200, 430); c.lineTo(640 + (t - 0.5) * 3200, H); c.stroke(); }
    rect(c, 820, 280, 220, 160, LG(c, 820, 0, 1040, 0, [[0, '#9a2a24'], [1, '#c8423a']])); poly(c, [[800, 290], [930, 200], [1060, 290]], '#5a3a34'); rect(c, 895, 350, 70, 90, '#6a1a18'); line(c, 895, 350, 965, 440, '#fff', 3); line(c, 965, 350, 895, 440, '#fff', 3);
    rect(c, 290, 220, 30, 210, '#e8e0d0'); var wx = 305, wy = 220; for (var k = 0; k < 4; k++) { c.save(); c.translate(wx, wy); c.rotate(k * PI / 2 + 0.4); poly(c, [[0, -4], [110, -14], [110, 14], [0, 4]], '#d8cfc0'); c.restore(); } eli(c, wx, wy, 10, 10, '#6a4a3a');
    [[480, 470], [540, 480], [1100, 480]].forEach(function (h) { eli(c, h[0], h[1], 40, 30, LG(c, 0, h[1] - 30, 0, h[1] + 30, [[0, '#f0d890'], [1, '#b89840']])); });
    for (var f = 0; f < W; f += 70) rect(c, f, 600, 8, 80, '#8a6a4a'); rect(c, 0, 610, W, 7, '#a07a54'); rect(c, 0, 640, W, 7, '#a07a54');
    tree(c, R, 120, 470, 1.4, '#3a6a3a', '#7ab060');
    finish(c, { vig: 0.3, tint: '#ffe0a0', ta: 0.12 });
  },
  harbor: function (c, R) {
    sky(c, [[0, '#5a90d0'], [0.7, '#f4d0a0'], [1, '#ffe8c0']], 430);
    lighter(c, function () { glow(c, 900, 360, 400, '#ffd8a0', 0.5); });
    for (var i = 0; i < 5; i++) cloud(c, R, R() * W, 80 + R() * 160, 200 + R() * 200, '#fff4e8', '#d8b8b0', 0.7);
    ridge(c, R, 420, 20, '#8a9ab8'); rect(c, 1080, 330, 24, 90, '#f0ece4'); rect(c, 1080, 350, 24, 14, '#c83a3a'); poly(c, [[1076, 330], [1092, 310], [1108, 330]], '#c83a3a'); lighter(c, function () { glow(c, 1092, 322, 30, '#fff0a0', 0.8); });
    water(c, R, 430, [[0, '#6a98c0'], [0.5, '#3a6a98'], [1, '#1e3e62']], 260);
    reflect(c, R, 900, 432, 280, '#ffd8a0', 40);
    [[560, 430, 1], [760, 440, 0.8], [360, 450, 1.2]].forEach(function (s) {
      var x = s[0], y = s[1], k = s[2];
      poly(c, [[x - 110 * k, y - 20 * k], [x + 120 * k, y - 20 * k], [x + 90 * k, y + 10 * k], [x - 90 * k, y + 10 * k]], '#4a2e20');
      line(c, x, y - 20 * k, x, y - 230 * k, '#3a2418', 4 * k); line(c, x - 60 * k, y - 20 * k, x - 60 * k, y - 170 * k, '#3a2418', 3 * k);
      poly(c, [[x + 4 * k, y - 220 * k], [x + 90 * k, y - 60 * k], [x + 4 * k, y - 40 * k]], 'rgba(250,244,230,.95)'); poly(c, [[x - 56 * k, y - 160 * k], [x - 4 * k, y - 50 * k], [x - 56 * k, y - 40 * k]], 'rgba(240,232,216,.95)');
    });
    poly(c, [[0, 520], [420, 520], [640, H], [0, H]], LG(c, 0, 520, 0, H, [[0, '#8a6a4a'], [1, '#5a3e28']]));
    alpha(c, 0.5, function () { for (var p2 = 0; p2 < 14; p2++) { var y = lerp(520, H, p2 / 14); line(c, 0, y, lerp(420, 640, p2 / 14), y, '#3a2618', 2); } });
    for (var b = 0; b < 5; b++) rect(c, 60 + b * 90, 560 + b * 30, 14, 200, '#3a2618');
    [[120, 600], [190, 620], [150, 560]].forEach(function (cr) { rect(c, cr[0] - 30, cr[1] - 30, 60, 50, '#a07a4a'); c.strokeStyle = '#6a4a2a'; c.lineWidth = 3; c.strokeRect(cr[0] - 30, cr[1] - 30, 60, 50); });
    for (var g2 = 0; g2 < 6; g2++) { var gx = 500 + R() * 600, gy = 100 + R() * 150; c.strokeStyle = '#3a3a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx - 10, gy - 4); c.quadraticCurveTo(gx - 4, gy - 8, gx, gy); c.quadraticCurveTo(gx + 4, gy - 8, gx + 10, gy - 4); c.stroke(); }
    finish(c, { vig: 0.35, tint: '#ffc080', ta: 0.12 });
  },
  agency_office: function (c, R) {
    var r = room(c, { b: [200, 90, 1080, 480], ceil: [[0, '#d8dce0'], [1, '#f2f4f6']], side: [[0, '#c8ccd4'], [1, '#eceef2']], wall: [[0, '#e8ecf0'], [1, '#d8dce4']], floor: [[0, '#8a8e96'], [1, '#c8ccd2']] });
    rect(c, 360, 110, 700, 330, LG(c, 0, 110, 0, 440, [[0, '#8ab8e8'], [1, '#e0ecf6']]));
    c.save(); c.beginPath(); c.rect(360, 110, 700, 330); c.clip(); city(c, R, 440, 80, 280, '#9ab0cc', '#e8f0ff', 0.2, 50); alpha(c, 0.5, function () { city(c, RNG(3), 440, 40, 160, '#7a90b0', '#ffffff', 0.15, 40); }); c.restore();
    for (var x = 360; x <= 1060; x += 140) rect(c, x - 3, 110, 6, 330, '#5a6070'); rect(c, 360, 272, 700, 4, '#5a6070');
    lighter(c, function () { glow(c, 710, 270, 500, '#ffffff', 0.18); });
    [[230, 150, '#f06a8a'], [290, 170, '#6a8af0'], [230, 280, '#f0c040']].forEach(function (p3) { rect(c, p3[0] - 6, p3[1] - 6, 62, 86, '#2a2a30'); rect(c, p3[0], p3[1], 50, 74, LG(c, 0, p3[1], 0, p3[1] + 74, [[0, p3[2]], [1, dk(p3[2], 0.4)]])); });
    for (var l = 0; l < 3; l++) rect(c, 420 + l * 200, 20 - l * 4, 140, 8, 'rgba(255,255,255,.9)');
    rr(c, 60, 470, 360, 140, 24, LG(c, 0, 470, 0, 610, [[0, '#3a4050'], [1, '#22262e']])); rr(c, 80, 420, 320, 90, 20, '#4a5060');
    rect(c, 740, 520, 440, 20, '#f4f4f6'); rect(c, 760, 540, 12, 160, '#b0b4bc'); rect(c, 1150, 540, 12, 160, '#b0b4bc');
    rect(c, 900, 400, 170, 110, '#1a1c22'); rect(c, 906, 406, 158, 96, LG(c, 0, 406, 0, 502, [[0, '#4a6ae0'], [1, '#a04ae0']])); rect(c, 975, 510, 20, 12, '#8a8e96');
    eli(c, 1190, 400, 50, 70, '#3a7a4a'); eli(c, 1170, 440, 40, 60, '#4a9a5a'); rect(c, 1165, 480, 50, 60, '#e8e4dc');
    finish(c, { vig: 0.3, tint: '#c0d8ff', ta: 0.1 });
  },
  practice_room: function (c, R) {
    var r = room(c, { b: [180, 80, 1100, 470], ceil: [[0, '#b8bcc4'], [1, '#e2e4e8']], side: [[0, '#c8ccd2'], [1, '#e8eaee']], wall: [[0, '#e0e8f0'], [1, '#c8d4e0']], floor: [[0, '#8a6a4a'], [1, '#d8b088']] });
    rect(c, 190, 100, 900, 360, LG(c, 0, 100, 0, 460, [[0, '#cfdbe8'], [1, '#a8b8c8']]));
    alpha(c, 0.5, function () { rect(c, 300, 300, 680, 160, LG(c, 0, 300, 0, 460, [[0, '#b89878'], [1, '#e8c8a0']])); for (var k = 0; k < 4; k++) rect(c, 300 + k * 200, 120, 120, 12, '#ffffff'); });
    for (var x = 190; x <= 1090; x += 225) rect(c, x - 2, 100, 4, 360, '#e8eef4');
    lighter(c, function () { for (var s = 0; s < 8; s++) poly(c, [[250 + s * 110, 100], [290 + s * 110, 100], [180 + s * 110, 460], [140 + s * 110, 460]], 'rgba(255,255,255,.07)'); });
    rect(c, 180, 300, 920, 8, LG(c, 0, 300, 0, 308, [[0, '#f0f0f0'], [1, '#8a8e96']])); [250, 640, 1030].forEach(function (x2) { rect(c, x2, 308, 6, 30, '#9a9ea6'); });
    floorGrid(c, r, 20, 0, 'rgba(90,60,30,.25)', 1.5);
    lighter(c, function () { [0.3, 0.6].forEach(function (t) { var q = r.F(0.5, t); c.save(); c.translate(q[0], q[1]); c.scale(1, 0.12); glow(c, 0, 0, 400, '#ffffff', 0.35); c.restore(); }); });
    for (var l = 0; l < 3; l++) for (var m = 0; m < 3; m++) rect(c, 280 + m * 280, 20 + l * 22, 180 - l * 30, 10, 'rgba(255,255,255,.95)');
    rr(c, 40, 380, 90, 170, 10, '#1e2024'); eli(c, 85, 430, 30, 30, '#3a3c42'); eli(c, 85, 500, 20, 20, '#3a3c42');
    [[1150, 600], [1180, 610]].forEach(function (b) { rr(c, b[0] - 10, b[1] - 50, 20, 50, 6, 'rgba(160,210,255,.8)'); });
    finish(c, { vig: 0.3, tint: '#fff0d8', ta: 0.1 });
  },
  dorm: function (c, R) {
    var r = room(c, { b: [260, 110, 1020, 480], ceil: [[0, '#2a2440'], [1, '#4a3e66']], side: [[0, '#3a3258'], [1, '#5e5282']], wall: [[0, '#5a4e80'], [1, '#433a66']], floor: [[0, '#4a3a4a'], [1, '#7a6070']] });
    rect(c, 560, 150, 240, 190, '#e0dcea'); rect(c, 570, 160, 220, 170, LG(c, 0, 160, 0, 330, [[0, '#0e1230'], [1, '#2a2a5a']])); c.save(); c.beginPath(); c.rect(570, 160, 220, 170); c.clip(); stars(c, R, 30, 250); city(c, R, 330, 30, 110, '#161a3a', '#ffd080', 0.4, 20); c.restore(); rect(c, 677, 160, 6, 170, '#e0dcea');
    lighter(c, function () { for (var k = 0; k < 26; k++) { var q = qb([280, 130], [640, 200], [1000, 130], k / 25); glow(c, q[0], q[1], 16, ['#ffd080', '#ff9ac0', '#a0d0ff'][k % 3], 0.9); } });
    c.strokeStyle = '#2a2230'; c.beginPath(); c.moveTo(280, 130); c.quadraticCurveTo(640, 200, 1000, 130); c.stroke();
    [[300, 200, '#ff8ab0'], [380, 190, '#8ab0ff'], [880, 200, '#ffd06a']].forEach(function (p3) { rect(c, p3[0], p3[1], 60, 84, LG(c, 0, p3[1], 0, p3[1] + 84, [[0, p3[2]], [1, dk(p3[2], 0.5)]])); });
    rect(c, 40, 260, 12, 460, '#c8c0d0'); rect(c, 420, 260, 12, 460, '#c8c0d0'); rr(c, 40, 330, 392, 40, 8, '#e8dcf0'); rr(c, 40, 540, 392, 60, 10, LG(c, 0, 540, 0, 600, [[0, '#f0c0d8'], [1, '#c890b0']])); rr(c, 60, 510, 120, 40, 14, '#ffffff'); rect(c, 40, 590, 392, 16, '#a898b8');
    rect(c, 820, 470, 360, 16, '#d8c8b8'); rect(c, 840, 486, 12, 200, '#a89888'); rect(c, 1150, 486, 12, 200, '#a89888');
    poly(c, [[930, 470], [1060, 470], [1050, 400], [940, 400]], '#2a2a30'); lighter(c, function () { glow(c, 995, 430, 160, '#8ab0ff', 0.4); }); rect(c, 946, 406, 98, 60, LG(c, 0, 406, 0, 466, [[0, '#a0c0ff'], [1, '#e0a0ff']]));
    lighter(c, function () { glow(c, 870, 440, 120, '#ffc070', 0.45); });
    finish(c, { vig: 0.45, tint: '#8a70ff', ta: 0.12 });
  },
  stage_concert: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#05030c'], [0.6, '#140a2a'], [1, '#0a0614']]));
    rect(c, 300, 150, 680, 300, LG(c, 300, 150, 980, 450, [[0, '#ff3a9a'], [0.5, '#6a3aff'], [1, '#3ad8ff']]));
    alpha(c, 0.35, function () { for (var y = 150; y < 450; y += 6) line(c, 300, y, 980, y, '#000', 2); for (var x = 300; x < 980; x += 6) line(c, x, 150, x, 450, '#000', 1); });
    lighter(c, function () { glow(c, 640, 300, 500, '#8a4aff', 0.35); });
    c.strokeStyle = '#6a6a78'; c.lineWidth = 3;
    [[60, 60, W - 120, 30], [60, 60, 30, 440], [W - 90, 60, 30, 440]].forEach(function (t) { c.strokeRect(t[0], t[1], t[2], t[3]); var hor = t[2] > t[3], len = hor ? t[2] : t[3]; for (var k = 0; k < len; k += 30) { c.beginPath(); if (hor) { c.moveTo(t[0] + k, t[1]); c.lineTo(t[0] + k + 30, t[1] + t[3]); } else { c.moveTo(t[0], t[1] + k); c.lineTo(t[0] + t[2], t[1] + k + 30); } c.stroke(); } });
    var cols = ['#ff4ab0', '#4ad8ff', '#b08aff', '#ffffff', '#ffd04a'];
    for (var s = 0; s < 9; s++) { var sx = 120 + s * 130; spot(c, sx, 90, sx + (R() - 0.5) * 500, 260 + R() * 160, 620, cols[s % 5], 0.22); }
    rect(c, 0, 470, W, 30, LG(c, 0, 470, 0, 500, [[0, '#3a2a5a'], [1, '#120a20']])); lighter(c, function () { rect(c, 0, 468, W, 4, 'rgba(160,120,255,.9)'); });
    crowd(c, R, 520, 60, '#07040c');
    sticks(c, R, 510, 520, ['#ff5ab8', '#ff8ad0', '#7ad8ff', '#ffffff']);
    for (var k2 = 0; k2 < 120; k2++) { c.save(); c.translate(R() * W, R() * 460); c.rotate(R() * PI); rect(c, -4, -2, 8, 4, rgba(cols[k2 % 5], 0.8)); c.restore(); }
    finish(c, { vig: 0.45 });
  },
  broadcast_studio: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#0e1026'], [1, '#1c1a3a']]));
    for (var y = 20; y < 110; y += 26) for (var x = 40; x < W; x += 60) { rect(c, x, y, 30, 10, '#2a2a38'); lighter(c, function () { glow(c, x + 15, y + 12, 20, '#fff0d0', 0.35); }); }
    for (var i = 0; i < 7; i++) { var px = 180 + i * 140; rect(c, px, 140, 120, 300, LG(c, 0, 140, 0, 440, [[0, ['#3a8aff', '#ff4a9a', '#8a4aff'][i % 3]], [1, '#1a1a3a']])); alpha(c, 0.3, function () { for (var k = 0; k < 300; k += 8) line(c, px, 140 + k, px + 120, 140 + k, '#000', 1); }); }
    lighter(c, function () { glow(c, 640, 280, 500, '#6a8aff', 0.25); });
    rect(c, 0, 440, W, 280, LG(c, 0, 440, 0, H, [[0, '#2a2848'], [1, '#101024']]));
    eli(c, 640, 530, 360, 70, LG(c, 0, 460, 0, 600, [[0, '#e8ecff'], [1, '#9aa0c8']])); eli(c, 640, 520, 340, 60, LG(c, 0, 460, 0, 580, [[0, '#ffffff'], [1, '#c8d0f0']]));
    lighter(c, function () { c.save(); c.translate(640, 530); c.scale(1, 0.2); c.strokeStyle = 'rgba(120,200,255,.9)'; c.lineWidth = 12; c.beginPath(); c.arc(0, 0, 355, 0, PI * 2); c.stroke(); c.restore(); });
    rr(c, 520, 420, 240, 70, 10, '#2a2e52'); rect(c, 520, 420, 240, 12, '#6a8aff');
    [[120, 560, 1], [1160, 560, -1]].forEach(function (cm) { var x = cm[0], y = cm[1], s = cm[2]; rect(c, x - 50, y - 60, 100, 60, '#15151c'); rect(c, x + s * 50, y - 50, s * 40, 40, '#15151c'); eli(c, x + s * 95, y - 30, 12, 20, '#2a2a3a'); line(c, x, y, x - 50, H, '#15151c', 8); line(c, x, y, x + 50, H, '#15151c', 8); line(c, x, y, x, H, '#15151c', 8); lighter(c, function () { glow(c, x - s * 30, y - 50, 10, '#ff3040', 0.9); }); });
    finish(c, { vig: 0.45 });
  },
  filming_set: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#0c0c10'], [1, '#1e1c22']]));
    rect(c, 360, 150, 560, 380, LG(c, 0, 150, 0, 530, [[0, '#e8dcc8'], [1, '#c8b8a0']])); rect(c, 360, 150, 560, 30, '#fff'); rect(c, 480, 220, 160, 200, '#f4f0e8'); rect(c, 490, 230, 140, 180, LG(c, 0, 230, 0, 410, [[0, '#a8d0f0'], [1, '#e8f0f8']])); rect(c, 700, 300, 150, 110, '#8a5a3a'); rect(c, 720, 250, 20, 50, '#3a7a4a');
    rect(c, 360, 530, 560, 40, '#8a6a4a');
    lighter(c, function () { glow(c, 640, 360, 450, '#fff4e0', 0.3); });
    [[200, 180, 1], [1080, 170, -1], [640, 40, 0]].forEach(function (l) { var x = l[0], y = l[1]; line(c, x, y + 60, x, 720, '#2a2a30', 5); line(c, x, 700, x - 40, 720, '#2a2a30', 4); line(c, x, 700, x + 40, 720, '#2a2a30', 4); c.save(); c.translate(x, y); c.rotate(l[2] * 0.3); rect(c, -60, -40, 120, 90, '#1a1a20'); rect(c, -52, -32, 104, 74, LG(c, 0, -32, 0, 42, [[0, '#ffffff'], [1, '#e8eef8']])); c.restore(); lighter(c, function () { glow(c, x, y, 200, '#ffffff', 0.35); }); });
    var cx = 960, cy = 520; rect(c, cx - 70, cy - 60, 110, 70, '#141418'); rect(c, cx - 110, cy - 50, 40, 44, '#141418'); eli(c, cx - 115, cy - 28, 14, 22, '#2a2a36'); line(c, cx - 20, cy + 10, cx - 80, H, '#141418', 7); line(c, cx - 20, cy + 10, cx + 30, H, '#141418', 7); line(c, cx - 20, cy + 10, cx - 20, H, '#141418', 7);
    c.strokeStyle = '#08080a'; c.lineWidth = 5; for (var k = 0; k < 5; k++) { c.beginPath(); c.moveTo(R() * W, H); c.bezierCurveTo(R() * W, 600, R() * W, 690, R() * W, H); c.stroke(); }
    rect(c, 250, 600, 90, 10, '#3a2a1a'); rect(c, 255, 540, 80, 50, '#1a1a1a'); line(c, 260, 610, 330, H, '#3a2a1a', 5); line(c, 330, 610, 260, H, '#3a2a1a', 5);
    finish(c, { vig: 0.55, tint: '#ffe0b0', ta: 0.08 });
  },
  audition_hall: function (c, R) {
    var r = room(c, { b: [200, 80, 1080, 420], ceil: [[0, '#0e0e14'], [1, '#22222c']], side: [[0, '#16161e'], [1, '#2e2e3a']], wall: [[0, '#2a2a36'], [1, '#1a1a22']], floor: [[0, '#2a2420'], [1, '#5a4a3e']] });
    curtain(c, 200, 80, 880, 340, '#3a1a2a', 14);
    floorGrid(c, r, 16, 0, 'rgba(0,0,0,.3)', 1.5);
    lighter(c, function () { c.save(); c.translate(640, 640); c.scale(1, 0.25); glow(c, 0, 0, 420, '#fff4d8', 0.5); c.restore(); poly(c, [[600, 0], [680, 0], [1000, H], [280, H]], 'rgba(255,244,216,.06)'); });
    poly(c, [[260, 440], [1020, 440], [1060, 520], [220, 520]], LG(c, 0, 440, 0, 520, [[0, '#f4f2ee'], [1, '#c8c4bc']])); rect(c, 220, 520, 840, 60, '#1a1a22');
    [420, 640, 860].forEach(function (x) { rr(c, x - 50, 330, 100, 120, 16, '#101014'); rect(c, x - 30, 430, 60, 16, '#f6f4ee'); rect(c, x - 30, 430, 60, 3, '#c8403a'); rect(c, x + 50, 400, 14, 40, 'rgba(180,220,255,.7)'); poly(c, [[x - 40, 470], [x + 20, 468], [x + 26, 480], [x - 34, 482]], '#fffdf8'); });
    finish(c, { vig: 0.6 });
  },
  rooftop_night: function (c, R) {
    skyNight(c, R, 480, 1050, 120);
    lighter(c, function () { glow(c, 640, 520, 700, '#ff8a6a', 0.18); });
    city(c, R, 480, 60, 260, '#10142e', '#ffd88a', 0.3, 40); alpha(c, 0.8, function () { city(c, RNG(11), 500, 20, 120, '#0a0c20', '#a8c8ff', 0.35, 30); });
    lighter(c, function () { for (var k = 0; k < 6; k++) glow(c, R() * W, 200 + R() * 200, 4, '#ff3040', 0.9); });
    rect(c, 0, 520, W, 200, LG(c, 0, 520, 0, H, [[0, '#3a3a4a'], [1, '#1a1a24']]));
    rect(c, 0, 470, W, 10, '#8a8e9a'); for (var x = 0; x < W; x += 40) rect(c, x, 470, 5, 60, '#6a6e7a'); rect(c, 0, 520, W, 8, '#6a6e7a');
    rr(c, 960, 280, 200, 170, 20, '#2a2a36'); for (var l = 0; l < 4; l++) rect(c, 970 + l * 55, 450, 8, 70, '#2a2a36');
    lanterns(c, R, 0, 380, 900, 420, 40, ['#ffd08a', '#fff0c0'], 22);
    bokeh(c, R, 30, ['#ffd08a', '#ff8ab0', '#8ab0ff'], 6, 20, 0.35, 250, 520);
    finish(c, { vig: 0.5, tint: '#6a70ff', ta: 0.12 });
  },
  cafe: function (c, R) {
    var r = room(c, { b: [240, 100, 1040, 470], ceil: [[0, '#2a1e18'], [1, '#4a3628']], side: [[0, '#6a5040'], [1, '#a88a70']], wall: [[0, '#e8dcc8'], [1, '#c8b8a0']], floor: [[0, '#6a4a34'], [1, '#a07a58']] });
    alpha(c, 0.5, function () { for (var y = 110; y < 460; y += 20) for (var x = 240 + ((y / 20) % 2) * 20; x < 1040; x += 40) c.strokeRect(x, y, 40, 20); });
    rect(c, 300, 140, 280, 160, '#2a2a28'); rect(c, 310, 150, 260, 140, '#1e2a24'); alpha(c, 0.7, function () { for (var k = 0; k < 6; k++) { line(c, 330, 170 + k * 20, 330 + 100 + R() * 80, 170 + k * 20, '#f0ece0', 2); line(c, 500, 170 + k * 20, 540, 170 + k * 20, '#f0d080', 2); } });
    [0.1, 0.45].forEach(function (u) { wallQuad(c, r.L, u, u + 0.28, 0.1, 0.75, '#3a2a20'); wallQuad(c, r.L, u + 0.01, u + 0.27, 0.12, 0.73, LG(c, 0, 0, 0, 500, [[0, '#f4e0b8'], [1, '#c8d8e0']])); });
    rect(c, 640, 330, 400, 140, LG(c, 0, 330, 0, 470, [[0, '#8a5a3a'], [1, '#5a3a24']])); rect(c, 630, 322, 420, 12, '#c8b090');
    rr(c, 820, 250, 120, 76, 8, '#c8ccd4'); rect(c, 840, 300, 20, 20, '#2a2a2a'); rect(c, 900, 300, 20, 20, '#2a2a2a');
    [680, 740, 780].forEach(function (x) { rr(c, x, 300, 22, 22, 4, '#ffffff'); });
    [[400, 60], [640, 50], [880, 60]].forEach(function (l) { line(c, l[0], 0, l[0], l[1], '#1a1a1a', 2); poly(c, [[l[0] - 30, l[1] + 30], [l[0] + 30, l[1] + 30], [l[0] + 10, l[1]], [l[0] - 10, l[1]]], '#2a2a2a'); lighter(c, function () { glow(c, l[0], l[1] + 36, 220, '#ffb050', 0.45); glow(c, l[0], l[1] + 34, 12, '#fff6d0', 1); }); });
    eli(c, 1110, 380, 60, 90, '#3a6a3a'); eli(c, 1140, 430, 50, 70, '#4a8a4a'); rect(c, 1090, 470, 60, 70, '#c8a080');
    [[360, 600], [880, 620]].forEach(function (t) { eli(c, t[0], t[1], 120, 26, LG(c, 0, t[1] - 26, 0, t[1] + 26, [[0, '#b8845a'], [1, '#7a5034']])); rect(c, t[0] - 6, t[1], 12, 120, '#2a1a10'); rr(c, t[0] - 16, t[1] - 34, 32, 30, 6, '#f6f2ea'); });
    finish(c, { vig: 0.4, tint: '#ffa050', ta: 0.18 });
  },
  street_seoul: function (c, R) {
    sky(c, [[0, '#0c0a24'], [0.6, '#2a1e50'], [1, '#6a3070']], 440);
    lighter(c, function () { glow(c, 640, 430, 560, '#ff4aa0', 0.28); glow(c, 640, 440, 300, '#4ad8ff', 0.15); });
    city(c, R, 440, 40, 220, '#1e1a36', '#ffd88a', 0.35, 30);
    rect(c, 0, 430, W, 290, LG(c, 0, 430, 0, H, [[0, '#2a2240'], [1, '#3e3452']]));
    poly(c, [[0, H], [0, 600], [560, 432], [600, 432], [170, H]], '#453c5c'); poly(c, [[W, H], [W, 600], [720, 432], [680, 432], [1110, H]], '#453c5c');
    alpha(c, 0.8, function () { var F = function (u, t) { return [lerp(lerp(600, 170, t), lerp(680, 1110, t), u), lerp(432, H, t)]; }, ta = pz(0.62), tb = pz(0.74); for (var k = 0; k < 12; k++) { var u0 = (k + 0.2) / 12, u1 = (k + 0.75) / 12; poly(c, [F(u0, ta), F(u1, ta), F(u1, tb), F(u0, tb)], 'rgba(235,235,245,.6)'); } for (var j = 1; j < 12; j++) { var t2 = pz(j / 12); if (t2 > ta - 0.02 && t2 < tb + 0.02) continue; var q0 = F(0.49, t2), q1 = F(0.51, pz(j / 12 + 0.03)); poly(c, [q0, [q1[0], q0[1]], q1, [q0[0], q1[1]]], 'rgba(255,220,120,.7)'); } });
    var cols = ['#ff4a9a', '#4ad8ff', '#ffd04a', '#b08aff', '#4aff9a', '#ff7a4a'], refl = [];
    [-1, 1].forEach(function (s2) {
      for (var k = 5; k >= 0; k--) {
        var t0 = pz(k / 6), t1 = pz((k + 1) / 6), X = function (t) { return s2 < 0 ? lerp(560, -300, t) : lerp(720, 1580, t); };
        var x0 = X(t0), x1 = X(t1), y0 = lerp(432, H, t0), y1 = lerp(432, H, t1), h0 = 520 * lerp(0.3, 1.5, t0), h1 = 520 * lerp(0.3, 1.5, t1);
        var bc = ['#3a3252', '#2e2844', '#443a5e'][k % 3];
        poly(c, [[x0, y0], [x1, y1], [x1, y1 - h1], [x0, y0 - h0]], LG(c, x0, 0, x1, 0, [[0, dk(bc, 0.3)], [1, bc]]));
        poly(c, [[x0, y0], [x1, y1], [x1, y1 - lerp(40, 110, t1)], [x0, y0 - lerp(40, 110, t0) * 0.8]], LG(c, 0, y0 - 80, 0, y1, [[0, 'rgba(255,220,170,.55)'], [1, 'rgba(255,190,120,.25)']]));
        c.save(); for (var fy = 0.3; fy < 0.92; fy += 0.07) for (var fx = 0.08; fx < 0.92; fx += 0.12) if (R() < 0.55) { var ax = lerp(x0, x1, fx), ay = lerp(y0 - h0, y1 - h1, fx) + lerp(h0, h1, fx) * (1 - fy) , sz = lerp(0.4, 1.6, lerp(t0, t1, fx)); c.globalAlpha = 0.5 + R() * 0.5; rect(c, ax, ay, 9 * sz, 7 * sz, R() < 0.6 ? '#ffd88a' : '#bcd6ff'); } c.restore();
        var sz2 = lerp(0.6, 2.2, t1), col = cols[(k * 2 + (s2 > 0 ? 1 : 0)) % 6];
        var sx = lerp(x0, x1, 0.7), sy = lerp(y0 - h0, y1 - h1, 0.7) + lerp(h0, h1, 0.7) * 0.2;
        neon(c, sx - 14 * sz2, sy, 28 * sz2, 110 * sz2, col, R); refl.push([sx, col]);
        var hx = lerp(x0, x1, 0.35), hy = lerp(y0, y1, 0.35) - lerp(h0, h1, 0.35) * 0.55, col2 = cols[(k + 3) % 6];
        neon(c, hx - 44 * sz2, hy, 88 * sz2, 26 * sz2, col2, R); refl.push([hx, col2]);
      }
    });
    [0.25, 0.55, 0.85].forEach(function (t) { var tt = pz(t); [-1, 1].forEach(function (s2) { var x = 640 + s2 * lerp(90, 760, tt), y = lerp(432, H, tt), hh = lerp(60, 330, tt); line(c, x, y, x, y - hh, '#15121e', lerp(2, 8, tt)); lighter(c, function () { glow(c, x - s2 * 10 * tt, y - hh, lerp(20, 90, tt), '#ffe6b0', 0.8); }); }); });
    lighter(c, function () { refl.forEach(function (q) { reflect(c, R, q[0], 560 + R() * 60, 150, q[1], 16); }); });
    bokeh(c, R, 26, ['#ff6ab0', '#6ad8ff', '#ffd06a', '#ffffff'], 6, 22, 0.3, 200, 560);
    finish(c, { vig: 0.45, tint: '#a04aff', ta: 0.08 });
  },
  press_room: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#e8ecf4'], [1, '#c8ccd8']]));
    for (var y = 20; y < 480; y += 70) for (var x = ((y / 70) % 2) * 80; x < W; x += 160) { rr(c, x + 30, y + 16, 90, 34, 8, '#2a3a7a'); rect(c, x + 44, y + 28, 60, 4, '#ffffff'); rect(c, x + 44, y + 36, 40, 3, '#9ab0ff'); }
    rect(c, 0, 480, W, 240, LG(c, 0, 480, 0, H, [[0, '#2a2e3e'], [1, '#12141c']]));
    rect(c, 240, 420, 800, 110, LG(c, 0, 420, 0, 530, [[0, '#f8f8fa'], [1, '#d0d2da']])); rect(c, 240, 420, 800, 6, '#2a3a7a');
    for (var k = 0; k < 16; k++) { var mx = 500 + (k - 8) * 18 + (R() - 0.5) * 20, my = 400 + R() * 30; line(c, mx, my, 640 + (mx - 640) * 0.3, 430, '#1a1a1a', 3); eli(c, mx, my, 7, 10, '#1a1a1a'); rect(c, mx - 7, my + 8, 14, 10, ['#e83a3a', '#3a6ae8', '#f0c030', '#3ab86a', '#ffffff'][k % 5]); }
    lighter(c, function () { for (var f = 0; f < 9; f++) { var fx = R() * W, fy = 520 + R() * 120; glow(c, fx, fy, 160, '#ffffff', 0.55); glow(c, fx, fy, 20, '#ffffff', 1); } });
    for (var p3 = 0; p3 < 14; p3++) { var px = p3 * 95 + R() * 30, py = 620 + R() * 60; eli(c, px, py, 28, 32, '#0a0a10'); rect(c, px - 45, py + 20, 90, 100, '#0a0a10'); if (p3 % 2) { rect(c, px + 10, py - 30, 44, 30, '#0a0a10'); eli(c, px + 54, py - 16, 10, 14, '#1a1a24'); } }
    finish(c, { vig: 0.4 });
  },
  awards: function (c, R) {
    rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, '#0e0818'], [1, '#2a1830']]));
    rect(c, 290, 80, 700, 300, LG(c, 290, 80, 990, 380, [[0, '#3a1a5a'], [0.5, '#d8a040'], [1, '#3a1a5a']]));
    lighter(c, function () { glow(c, 640, 230, 260, '#ffe0a0', 0.6); });
    c.save(); c.translate(640, 250); poly(c, [[-30, 90], [30, 90], [18, 60], [-18, 60]], '#b8862a'); poly(c, [[-8, 60], [8, 60], [6, 20], [-6, 20]], '#e8b84a'); c.beginPath(); c.moveTo(-50, -60); c.quadraticCurveTo(-50, 20, 0, 24); c.quadraticCurveTo(50, 20, 50, -60); c.closePath(); c.fillStyle = LG(c, -50, 0, 50, 0, [[0, '#9a6a1a'], [0.35, '#fff0b0'], [0.6, '#e8b84a'], [1, '#8a5a10']]); c.fill(); c.restore();
    for (var s = 0; s < 5; s++) rect(c, 200 - s * 50, 400 + s * 22, 880 + s * 100, 22, s % 2 ? '#3a2240' : '#5a3460');
    lighter(c, function () { for (var s2 = 0; s2 < 5; s2++) rect(c, 200 - s2 * 50, 400 + s2 * 22, 880 + s2 * 100, 2, 'rgba(255,210,120,.8)'); });
    for (var sp = 0; sp < 6; sp++) spot(c, 100 + sp * 216, 0, 640 + (sp - 2.5) * 60, 200, 520, sp % 2 ? '#ffe0a0' : '#ffffff', 0.18);
    crowd(c, R, 560, 40, '#08050c');
    for (var k = 0; k < 150; k++) { c.save(); c.translate(R() * W, R() * 520); c.rotate(R() * PI); rect(c, -3, -1.5, 6, 3, rgba(['#ffd86a', '#fff4c8', '#e8a040'][k % 3], 0.9)); c.restore(); }
    bokeh(c, R, 40, ['#ffd86a', '#fff0c0'], 4, 16, 0.4, 0, 520);
    finish(c, { vig: 0.45, tint: '#ffb040', ta: 0.12 });
  },
  airport: function (c, R) {
    var r = room(c, { b: [120, 60, 1160, 460], ceil: [[0, '#c8ccd4'], [1, '#e8eaee']], side: [[0, '#b8bcc4'], [1, '#dcdee4']], wall: [[0, '#dce8f4'], [1, '#c8d4e0']], floor: [[0, '#9aa0aa'], [1, '#e0e2e8']] });
    sky(c, [[0, '#6aa8e8'], [1, '#e0f0fa']], 0);
    rect(c, 130, 70, 1020, 380, LG(c, 0, 70, 0, 450, [[0, '#6aa8e8'], [0.8, '#d8ecf8'], [1, '#e8f0f0']]));
    rect(c, 130, 390, 1020, 60, '#8a9098'); line(c, 130, 420, 1150, 420, '#f0f0f0', 2);
    c.save(); c.translate(760, 300); c.rotate(-0.12); eli(c, 0, 0, 170, 20, '#f4f6f8'); poly(c, [[-40, 0], [40, 0], [-20, 90], [-60, 90]], '#d8dce4'); poly(c, [[-40, 0], [40, 0], [-20, -70], [-60, -70]], '#e4e8ee'); poly(c, [[130, -4], [170, -4], [175, -60], [150, -60]], '#3a6ad8'); for (var w = -120; w < 120; w += 14) eli(c, w, -4, 3, 3, '#5a6a80'); c.restore();
    for (var x = 130; x <= 1150; x += 102) rect(c, x - 3, 70, 6, 380, '#e8eaee'); rect(c, 130, 250, 1020, 5, '#e8eaee');
    for (var i = 0; i < 16; i++) { var t = pz(i / 16), q = r.F(0.5, t); lighter(c, function () { eli(c, q[0], q[1], 200 * r.sc(t), 6 * r.sc(t), 'rgba(255,255,255,.25)'); }); }
    rect(c, 480, 100, 320, 110, '#101418'); for (var k = 0; k < 6; k++) { rect(c, 494, 110 + k * 16, 90, 8, '#ffd040'); rect(c, 600, 110 + k * 16, 60, 8, '#f0f0f0'); rect(c, 700, 110 + k * 16, 80, 8, k % 3 ? '#40e070' : '#ff5040'); }
    for (var j = 0; j < 2; j++) for (var s = 0; s < 10; s++) { var sx = 140 + s * 60 + j * 520, sy = 560 + j * 20; rr(c, sx, sy - 40, 50, 36, 6, '#3a4a6a'); rr(c, sx, sy - 6, 50, 14, 4, '#2a3a5a'); }

    finish(c, { vig: 0.3, tint: '#c0e0ff', ta: 0.1 });
  },
  hospital: function (c, R) {
    var r = room(c, { b: [220, 80, 1060, 470], ceil: [[0, '#dce4e6'], [1, '#f4f8f8']], side: [[0, '#cfdcdc'], [1, '#eef4f2']], wall: [[0, '#f2f6f4'], [1, '#e2eae8']], floor: [[0, '#b8c4c4'], [1, '#e4ecec']] });
    alpha(c, 0.3, function () { floorGrid(c, r, 10, 9, '#9aa8a8', 1); });
    rect(c, 220, 370, 840, 100, '#cfe0dc'); rect(c, 220, 366, 840, 6, '#9ab8b0');
    for (var cl = 0; cl < 4; cl++) rect(c, 300 + cl * 200, 82, 120, 10, '#fbfdff');
    lighter(c, function () { for (var cl2 = 0; cl2 < 4; cl2++) glow(c, 360 + cl2 * 200, 90, 90, '#ffffff', 0.35); });
    /* window with blinds */
    rect(c, 420, 120, 440, 230, '#e8eef0'); rect(c, 432, 132, 416, 206, LG(c, 0, 132, 0, 338, [[0, '#8cc4ec'], [1, '#e6f4fc']]));
    c.save(); c.beginPath(); c.rect(432, 132, 416, 206); c.clip(); cloud(c, R, 560, 190, 180, '#ffffff', '#c8dcec', 0.8); treeline(c, R, 340, 50, '#7aac78', 22); city(c, R, 340, 20, 70, 'rgba(160,180,200,.7)', null, 0, 30); c.restore();
    alpha(c, 0.75, function () { for (var y = 134; y < 250; y += 9) rect(c, 432, y, 416, 5, '#f6f8fa'); }); rect(c, 432, 250, 416, 4, '#c8d0d8'); line(c, 640, 130, 640, 300, '#b8c0c8', 1.5);
    rect(c, 637, 132, 6, 206, '#e8eef0'); rect(c, 410, 346, 460, 12, '#dde6e8');
    shaft(c, 432, 260, 848, 260, 1100, H, 360, H, '#fffbe8', 0.22);
    /* privacy curtain on ceiling track */
    line(c, 40, 60, 700, 60, '#aab4bc', 5);
    c.save(); curtain(c, 40, 64, 250, 560, '#a8d8d0', 7); c.restore();
    alpha(c, 0.25, function () { for (var k = 0; k < 12; k++) rect(c, 44 + k * 21, 64, 3, 560, '#ffffff'); });
    /* monitor */
    rect(c, 1010, 150, 8, 90, '#9aa4ac'); rr(c, 950, 150, 140, 104, 8, '#2a3038'); rect(c, 960, 160, 120, 84, '#08140e');
    c.save(); c.shadowColor = '#40ff90'; c.shadowBlur = 6; c.strokeStyle = '#40ff90'; c.lineWidth = 2; c.beginPath(); c.moveTo(962, 196);
    for (var x = 962; x < 1078; x += 4) { var ph = ((x - 962) / 4) % 14; c.lineTo(x, 196 - (ph === 5 ? 22 : ph === 6 ? -10 : ph === 9 ? 4 : 0)); } c.stroke();
    c.strokeStyle = '#40c8ff'; c.beginPath(); c.moveTo(962, 226); for (x = 962; x < 1078; x += 4) c.lineTo(x, 226 - Math.sin(x * 0.12) * 5); c.stroke(); c.restore();
    c.fillStyle = '#ffd040'; c.fillRect(1054, 164, 20, 8); c.fillStyle = '#40ff90'; c.fillRect(1054, 176, 14, 8);
    /* IV stand */
    line(c, 900, 130, 900, 600, '#b0bac4', 5); line(c, 870, 130, 930, 130, '#b0bac4', 4); [-40, 0, 40].forEach(function (d) { line(c, 900, 600, 900 + d, 620, '#9aa4ac', 4); });
    rr(c, 872, 140, 34, 60, 10, 'rgba(220,240,255,.85)', '#a8c0d4', 2); rect(c, 876, 170, 26, 26, 'rgba(200,230,255,.6)'); rect(c, 886, 200, 6, 16, '#d8e4ec');
    c.strokeStyle = 'rgba(200,220,240,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(889, 216); c.bezierCurveTo(880, 330, 820, 360, 800, 470); c.stroke();
    /* bed */
    var bx = 560, by = 460;
    rr(c, bx + 460, by - 170, 36, 190, 10, LG(c, 0, by - 170, 0, by, [[0, '#e8eef4'], [1, '#b8c4cc']]));
    rr(c, bx, by - 40, 480, 110, 18, LG(c, 0, by - 40, 0, by + 70, [[0, '#ffffff'], [1, '#dde4ec']]));
    rr(c, bx + 340, by - 80, 130, 56, 24, '#ffffff'); alpha(c, 0.3, function () { rr(c, bx + 350, by - 40, 110, 12, 6, '#a8b8c8'); });
    poly(c, [[bx - 10, by - 20], [bx + 330, by - 30], [bx + 330, by + 80], [bx - 30, by + 90]], LG(c, 0, by - 30, 0, by + 90, [[0, '#dfe8f2'], [1, '#aabccc']]));
    alpha(c, 0.35, function () { for (var fo = 0; fo < 4; fo++) line(c, bx + 40 + fo * 70, by - 20, bx + 20 + fo * 76, by + 80, '#8aa0b4', 2); });
    rect(c, bx - 20, by + 70, 520, 26, '#a8b4c0'); rect(c, bx - 10, by + 96, 12, 90, '#8a96a2'); rect(c, bx + 470, by + 96, 12, 90, '#8a96a2');
    rr(c, bx - 30, by - 10, 360, 12, 6, '#c8d0d8'); for (var rl = 0; rl < 7; rl++) rect(c, bx - 20 + rl * 50, by - 2, 6, 40, '#c8d0d8');
    /* cabinet + flowers */
    rect(c, 1120, 470, 130, 160, LG(c, 0, 470, 0, 630, [[0, '#f4f6f6'], [1, '#d4dcdc']])); rect(c, 1116, 462, 138, 12, '#e6ecec'); rect(c, 1134, 520, 102, 3, '#b8c4c4'); rect(c, 1176, 540, 20, 5, '#9aa8a8');
    rr(c, 1170, 400, 34, 62, 12, 'rgba(210,235,250,.8)', '#a8c0d0', 2);
    c.strokeStyle = '#4a8a4a'; c.lineWidth = 2; [[1160, 360], [1186, 344], [1212, 362], [1172, 380], [1200, 374]].forEach(function (f) { c.beginPath(); c.moveTo(1187, 410); c.quadraticCurveTo(1187, 390, f[0], f[1]); c.stroke(); });
    [[1160, 360, '#f6a0b8'], [1186, 344, '#ffe070'], [1212, 362, '#f6a0b8'], [1172, 380, '#ffffff'], [1200, 374, '#f0c0e0']].forEach(function (f) { for (var pe = 0; pe < 5; pe++) { var a = pe / 5 * PI * 2; eli(c, f[0] + Math.cos(a) * 6, f[1] + Math.sin(a) * 6, 6, 5, f[2]); } eli(c, f[0], f[1], 3, 3, '#f0c040'); });
    rect(c, 170, 540, 90, 12, '#9ab4c4'); rect(c, 176, 470, 10, 72, '#8aa4b4'); rr(c, 176, 470, 78, 60, 8, '#a8c4d4'); rect(c, 176, 552, 8, 90, '#7a94a4'); rect(c, 246, 552, 8, 90, '#7a94a4');
    motes(c, R, 10, '#ffffff', 150, 600);
    finish(c, { vig: 0.3, tint: '#c0f0e0', ta: 0.1 });
  },
  han_river: function (c, R) {
    sky(c, [[0, '#070a20'], [0.6, '#1a2050'], [1, '#3a3060']], 420);
    stars(c, R, 120, 300, 0.7);
    lighter(c, function () { glow(c, 640, 420, 700, '#ff8a8a', 0.12); });
    c.beginPath(); c.moveTo(700, 400); c.bezierCurveTo(800, 300, 860, 225, 920, 225); c.bezierCurveTo(990, 225, 1040, 320, 1140, 400); c.fillStyle = '#0a0e24'; c.fill();
    rect(c, 915, 140, 10, 90, '#b8c0d8'); eli(c, 920, 152, 22, 9, '#dfe6f8'); rect(c, 902, 152, 36, 6, '#9aa4c0'); line(c, 920, 140, 920, 96, '#c8d0e0', 3); lighter(c, function () { glow(c, 920, 152, 70, '#9ac0ff', 0.6); glow(c, 920, 96, 12, '#ff5060', 0.9); });
    city(c, R, 400, 30, 150, '#0e1230', '#ffe0a0', 0.4, 30);
    rect(c, 0, 400, W, 320, LG(c, 0, 400, 0, H, [[0, '#101838'], [1, '#050818']]));
    for (var i = 0; i < 90; i++) { var x = R() * W; reflect(c, R, x, 404, 60 + R() * 120, ['#ffe0a0', '#a8c8ff'][i % 2], 6); }
    var by = 440; rect(c, 0, by, W, 10, '#1a1e36'); for (var p = 40; p < W; p += 110) rect(c, p, by + 10, 14, 60, '#141830');
    var cols = ['#ff4a8a', '#ffb04a', '#ffe84a', '#4aff9a', '#4ad8ff', '#8a6aff'];
    lighter(c, function () { for (var k = 0; k < 64; k++) { var x2 = k * 20 + 10, col = cols[Math.floor(k / 11) % 6]; glow(c, x2, by + 2, 12, col, 0.9); reflect(c, R, x2, by + 70, 200, col, 8); } });
    for (var a = 0; a < 8; a++) { c.strokeStyle = 'rgba(200,210,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(a * 160, by); c.quadraticCurveTo(a * 160 + 80, by - 40, a * 160 + 160, by); c.stroke(); }
    water(c, R, 452, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], 120);
    poly(c, [[0, 640], [W, 600], [W, H], [0, H]], LG(c, 0, 600, 0, H, [[0, '#1a2a24'], [1, '#0a120e']]));
    bokeh(c, R, 30, ['#ffe0a0', '#ff8ab0', '#8ab0ff'], 8, 26, 0.3, 380, 700);
    finish(c, { vig: 0.5, tint: '#6a70ff', ta: 0.12 });
  },
  mountain_sect: function (c, R) {
    sky(c, [[0, '#9fb8c8'], [0.45, '#e6e0cc'], [1, '#f4ead4']]);
    lighter(c, function () { glow(c, 900, 170, 380, '#fff0c8', 0.5); });
    eli(c, 900, 170, 46, 46, 'rgba(255,236,200,.85)');
    peaks(c, R, 380, 260, '#b4c0c4', '#eee6d4', { w: 150 });
    mistBand(c, 360, 50, '#f4ecdc', 0.9);
    peaks(c, R, 470, 280, '#7e8e92', '#eee6d4', { w: 170, ink: 0.35 });
    mistBand(c, 450, 60, '#f4ecdc', 0.85);
    /* the sect on the central peak */
    c.beginPath(); c.moveTo(380, H); c.quadraticCurveTo(470, 360, 560, 330); c.lineTo(720, 330); c.quadraticCurveTo(820, 360, 900, H); c.closePath(); c.fillStyle = LG(c, 0, 320, 0, H, [[0, '#4e5a58'], [0.6, '#6e7a74'], [1, '#e8e2d0']]); c.fill();
    hall(c, 640, 330, 250, 60, 50, { tier: 1, roof: '#2e3a40', wall: '#a8302a' });
    hall(c, 510, 350, 110, 34, 26, { roof: '#34403e', bays: 3 }); hall(c, 772, 352, 110, 34, 26, { roof: '#34403e', bays: 3 });
    mistBand(c, 420, 40, '#f4ecdc', 0.7);
    /* stairs and the gate (paifang) */
    for (var k = 0; k < 24; k++) { var t = k / 23, y = lerp(380, H, t), w = lerp(40, 360, t * t); rect(c, 640 - w / 2, y, w, lerp(2, 12, t), k % 2 ? '#b8b0a0' : '#d4ccbc'); }
    var gx = 640, gy = 560;
    [-150, -60, 60, 150].forEach(function (dx) { rect(c, gx + dx - 9, gy - 190, 18, 200, LG(c, gx + dx - 9, 0, gx + dx + 9, 0, [[0, '#6a1a14'], [0.4, '#c0402e'], [1, '#5a1410']])); rect(c, gx + dx - 14, gy, 28, 12, '#7a7468'); });
    rect(c, gx - 170, gy - 170, 340, 16, '#2a5a58'); rect(c, gx - 160, gy - 138, 320, 12, '#2a5a58');
    rect(c, gx - 40, gy - 160, 80, 34, '#1e2a30'); rect(c, gx - 36, gy - 156, 72, 26, '#c8a048');
    alpha(c, 0.8, function () { line(c, gx - 22, gy - 150, gx - 22, gy - 136, '#1e2a30', 3); line(c, gx - 2, gy - 152, gx + 4, gy - 136, '#1e2a30', 3); line(c, gx + 16, gy - 150, gx + 22, gy - 138, '#1e2a30', 3); line(c, gx - 8, gy - 144, gx + 26, gy - 144, '#1e2a30', 2); });
    roofC(c, gx, gy - 214, 380, 44, '#2a343a', null, true); roofC(c, gx - 105, gy - 176, 120, 22, '#2a343a'); roofC(c, gx + 105, gy - 176, 120, 22, '#2a343a');
    /* flanking cliffs with pines */
    c.beginPath(); c.moveTo(0, 250); c.bezierCurveTo(140, 260, 200, 380, 260, 470); c.lineTo(330, H); c.lineTo(0, H); c.closePath(); c.fillStyle = LG(c, 0, 250, 300, H, [[0, '#3a4440'], [1, '#1e2624']]); c.fill();
    c.beginPath(); c.moveTo(W, 300); c.bezierCurveTo(1140, 300, 1080, 420, 1020, 500); c.lineTo(960, H); c.lineTo(W, H); c.closePath(); c.fill();
    alpha(c, 0.5, function () { for (var j = 0; j < 30; j++) { var y = 280 + R() * 400; line(c, R() * 220, y, R() * 220 + 30, y + 40, '#0e1412', 2); line(c, 1280 - R() * 220, y, 1250 - R() * 220, y + 40, '#0e1412', 2); } });
    pine(c, R, 150, 270, 1.1, '#1a2220', 40); pine(c, R, 1150, 320, 0.9, '#1a2220', -40); pine(c, R, 60, 420, 0.8, '#141a18', 20);
    [[300, 150, 1], [340, 130, 0.8], [1020, 110, 0.9]].forEach(function (b) { crane(c, b[0], b[1], b[2], '#2a3030'); });
    mistBand(c, 690, 60, '#f4ecdc', 0.6);
    paper(c, R, 0.05);
    finish(c, { vig: 0.35, tint: '#ffe0b0', ta: 0.12 });
  },
  bamboo_forest: function (c, R) {
    sky(c, [[0, '#dfeedc'], [0.5, '#bcd8b8'], [1, '#8ab08a']]);
    lighter(c, function () { glow(c, 760, 80, 520, '#fff8d8', 0.55); });
    var layers = [['#b4d0ac', 30, 8, 0.5], ['#8ab488', 22, 12, 0.7], ['#5e8e5e', 14, 18, 0.9], ['#3a6a3e', 7, 28, 1]];
    layers.forEach(function (L, i) {
      for (var k = 0; k < L[1]; k++) { var x = R() * (W + 60) - 30; bambooStalk(c, R, x, -20, H, L[2] * (0.8 + R() * 0.4), L[0], i < 2 ? 1 : 2, lt(L[0], 0.05)); }
      mistBand(c, 560 - i * 40, 90, '#e8f4e0', 0.35 - i * 0.07);
    });
    for (var s = 0; s < 5; s++) shaft(c, 700 + s * 50, 0, 740 + s * 50, 0, 420 + s * 140, H, 340 + s * 140, H, '#fffbe0', 0.1);
    poly(c, [[560, 600], [700, 600], [900, H], [340, H]], LG(c, 0, 600, 0, H, [[0, '#a8a078'], [1, '#6a6444']]));
    rect(c, 0, 640, W, 80, LG(c, 0, 640, 0, H, [[0, 'rgba(40,70,40,0)'], [1, 'rgba(30,50,30,.7)']]));
    for (var f = 0; f < 60; f++) { c.save(); c.translate(R() * W, R() * H); c.rotate(R() * PI); eli(c, 0, 0, 7, 1.8, rgba('#8ab060', 0.8)); c.restore(); }
    [[40, 26], [200, 34], [1100, 30], [1240, 38]].forEach(function (b) { bambooStalk(c, R, b[0], -20, H, b[1], '#2e5a32', 3, '#3a6e3a'); });
    motes(c, R, 40, '#fff8c0', 50, 600);
    finish(c, { vig: 0.45, haze: '#e0f0d8', tint: '#d0ffb0', ta: 0.08 });
  },
  murim_inn: function (c, R) {
    var r = room(c, { b: [230, 90, 1050, 470], ceil: [[0, '#1a0e08'], [1, '#3a2414']], side: [[0, '#3a2414'], [1, '#6a4428']], wall: [[0, '#7a5230'], [1, '#5a3a20']], floor: [[0, '#4a3020'], [1, '#7a5634']] });
    alpha(c, 0.35, function () { floorGrid(c, r, 10, 8, '#2a180c', 2); });
    for (var y = 20; y < 90; y += 34) rect(c, 0, y, W, 14, '#24140a');
    /* back wall: gallery railing, counter, wine jars, banner */
    rect(c, 230, 90, 820, 150, LG(c, 0, 90, 0, 240, [[0, '#3a2414'], [1, '#5a3a22']]));
    rect(c, 230, 232, 820, 16, '#2a1a0e'); for (var x = 240; x < 1050; x += 22) rect(c, x, 190, 6, 42, '#6a4428'); rect(c, 230, 184, 820, 8, '#8a5a34');
    for (var d = 0; d < 4; d++) { var dx = 290 + d * 200; rect(c, dx, 110, 120, 70, '#2a1a10'); hallLattice(c, dx + 8, 116, 104, 58, '#e8b060', '#4a2a14'); }
    rect(c, 330, 330, 620, 110, LG(c, 0, 330, 0, 440, [[0, '#8a5a30'], [1, '#5a3618']])); rect(c, 320, 322, 640, 12, '#a87040');
    for (var j = 0; j < 9; j++) { var jx = 360 + j * 64, jh = 36 + (j % 3) * 8; eli(c, jx, 322 - jh * 0.45, 20, jh * 0.55, LG(c, jx - 20, 0, jx + 20, 0, [[0, '#3a2418'], [0.4, '#8a5a3a'], [1, '#24140c']])); rect(c, jx - 8, 322 - jh - 6, 16, 10, '#c83a2a'); rect(c, jx - 12, 322 - jh * 0.6, 24, 12, '#e8d8b0'); }
    rect(c, 1000, 110, 40, 180, '#c83a2a'); alpha(c, 0.8, function () { line(c, 1012, 140, 1028, 150, '#1a0e08', 4); line(c, 1020, 132, 1020, 200, '#1a0e08', 4); line(c, 1008, 180, 1032, 176, '#1a0e08', 4); });
    /* stairs on the right wall */
    for (var s2 = 0; s2 < 10; s2++) { var t = s2 / 10, a = r.R(0.1 + t * 0.5, 0.9 - t * 0.5), b = r.R(0.14 + t * 0.5, 0.9 - t * 0.5); poly(c, [a, b, [b[0], b[1] + 26 * (1 + t)], [a[0], a[1] + 26 * (1 + t)]], s2 % 2 ? '#5a3a20' : '#6a4428'); }
    /* tables & benches */
    [[360, 560, 1], [900, 560, 1], [640, 500, 0.7], [140, 650, 1.4], [1140, 650, 1.4]].forEach(function (t2) {
      var x0 = t2[0], y0 = t2[1], s = t2[2];
      rect(c, x0 - 100 * s, y0 - 6 * s, 200 * s, 16 * s, '#8a5630'); rect(c, x0 - 104 * s, y0 - 12 * s, 208 * s, 10 * s, '#a8703e');
      rect(c, x0 - 90 * s, y0 + 10 * s, 12 * s, 70 * s, '#4a2c14'); rect(c, x0 + 78 * s, y0 + 10 * s, 12 * s, 70 * s, '#4a2c14');
      rect(c, x0 - 120 * s, y0 + 40 * s, 60 * s, 8 * s, '#6a4222'); rect(c, x0 + 60 * s, y0 + 40 * s, 60 * s, 8 * s, '#6a4222');
      eli(c, x0 - 30 * s, y0 - 22 * s, 12 * s, 14 * s, '#e8dcc0'); rect(c, x0 - 34 * s, y0 - 42 * s, 8 * s, 10 * s, '#e8dcc0'); eli(c, x0 + 20 * s, y0 - 16 * s, 9 * s, 5 * s, '#d8ccb0'); eli(c, x0 + 44 * s, y0 - 16 * s, 9 * s, 5 * s, '#d8ccb0');
    });
    [[330, 40], [640, 30], [950, 40], [480, 150], [800, 150]].forEach(function (l) { line(c, l[0], 0, l[0], l[1] + 20, '#1a0e08', 2); lanternC(c, l[0], l[1] + 50, l[1] > 100 ? 16 : 22, '#d8321e'); });
    motes(c, R, 30, '#ffc080', 100, 500);
    finish(c, { vig: 0.55, tint: '#ff9a40', ta: 0.2 });
  },
  training_yard: function (c, R) {
    sky(c, [[0, '#8ab4d8'], [0.6, '#dcecf2'], [1, '#f4f0e0']], 380);
    for (var i = 0; i < 4; i++) cloud(c, R, R() * W, 70 + R() * 90, 200 + R() * 200, '#ffffff', '#c8d8e4', 0.7);
    peaks(c, R, 300, 180, '#9aacb4', '#e8ece6', { w: 180 }); peaks(c, R, 340, 140, '#6e8286', '#e8ece6', { w: 150, ink: 0.3 });
    rect(c, 0, 300, W, 90, '#dcd8cc');
    hall(c, 640, 330, 440, 70, 60, { tier: 1, roof: '#2e3a40' }); hall(c, 180, 350, 300, 56, 44, { roof: '#34403e', bays: 4 }); hall(c, 1100, 350, 300, 56, 44, { roof: '#34403e', bays: 4 });
    rect(c, 0, 350, W, 30, LG(c, 0, 350, 0, 380, [[0, '#8a8478'], [1, '#6a6458']]));
    var r = { b: [0, 380, W, 380], F: function (u, t) { return [lerp(lerp(300, -400, t), lerp(980, 1680, t), u), lerp(380, H, t)]; } };
    rect(c, 0, 380, W, 340, LG(c, 0, 380, 0, H, [[0, '#c8c0b0'], [1, '#e0d8c6']]));
    alpha(c, 0.45, function () { for (var j = 0; j < 12; j++) { var t = pz(j / 12), y = lerp(380, H, t); line(c, 0, y, W, y, '#8a8070', 1.5); } for (var u = -6; u <= 16; u++) { var a = r.F(u / 10, 0), b = r.F(u / 10, 1); line(c, a[0], a[1], b[0], b[1], '#8a8070', 1.5); } });
    /* weapon racks */
    [[150, 520, 1], [1130, 520, 1]].forEach(function (w) { var x = w[0], y = w[1]; rect(c, x - 90, y - 8, 180, 10, '#5a3a20'); rect(c, x - 90, y - 150, 180, 8, '#5a3a20'); rect(c, x - 96, y - 160, 10, 170, '#4a2c14'); rect(c, x + 86, y - 160, 10, 170, '#4a2c14');
      for (var k = 0; k < 5; k++) { var sx = x - 64 + k * 32; line(c, sx, y, sx + 4, y - 200, '#6a4a2a', 4); poly(c, [[sx + 1, y - 200], [sx + 7, y - 200], [sx + 4, y - 228]], '#c8ccd4'); if (k % 2) { eli(c, sx + 4, y - 196, 5, 8, '#c0392b'); } } });
    /* wooden dummies */
    [[420, 560, 1], [860, 540, 0.9]].forEach(function (d) { var x = d[0], y = d[1], s = d[2]; rect(c, x - 14 * s, y - 180 * s, 28 * s, 180 * s, LG(c, x - 14 * s, 0, x + 14 * s, 0, [[0, '#5a3a20'], [0.4, '#a87040'], [1, '#4a2c14']])); eli(c, x, y - 186 * s, 18 * s, 14 * s, '#8a5a30'); [[-1, 120], [1, 100], [-1, 70]].forEach(function (a) { poly(c, [[x, y - a[1] * s], [x + a[0] * 46 * s, y - a[1] * s - 6 * s], [x + a[0] * 46 * s, y - a[1] * s + 2 * s], [x, y - a[1] * s + 8 * s]], '#6a4422'); }); eli(c, x, y, 40 * s, 8 * s, 'rgba(0,0,0,.2)'); });
    [[40, 250], [1240, 250]].forEach(function (b) { line(c, b[0], H, b[0], b[1], '#3a2a1a', 6); poly(c, [[b[0], b[1]], [b[0] + (b[0] < 640 ? 70 : -70), b[1] + 10], [b[0] + (b[0] < 640 ? 60 : -60), b[1] + 200], [b[0], b[1] + 180]], '#b8302a'); alpha(c, 0.7, function () { line(c, b[0] + (b[0] < 640 ? 20 : -20), b[1] + 50, b[0] + (b[0] < 640 ? 44 : -44), b[1] + 140, '#1a0e08', 5); }); });
    finish(c, { vig: 0.35, tint: '#ffe0b0', ta: 0.1 });
  },
  cliff_sea_of_clouds: function (c, R) {
    sky(c, [[0, '#3a4a7a'], [0.35, '#b88aa0'], [0.6, '#ffc8a0'], [1, '#fff0d8']]);
    lighter(c, function () { glow(c, 820, 330, 560, '#ffd8a0', 0.6); glow(c, 820, 330, 70, '#fffbe8', 1); });
    peaks(c, R, 380, 200, '#8a7a96', '#f8dcc0', { w: 160 });
    for (var k = 0; k < 16; k++) cloud(c, R, R() * W, 380 + R() * 60, 260 + R() * 260, '#fff4ec', '#e0b8b0', 0.9);
    peaks(c, R, 470, 200, '#5a5270', '#f8dcc0', { w: 220, ink: 0.3 });
    var px = 980, py = 300;
    c.beginPath(); c.moveTo(px - 70, 480); c.quadraticCurveTo(px - 50, py + 20, px - 20, py); c.lineTo(px + 30, py); c.quadraticCurveTo(px + 60, py + 20, px + 80, 480); c.fillStyle = '#4a4260'; c.fill();
    hall(c, px + 5, py + 2, 90, 26, 22, { roof: '#2a2440', wall: '#6a2a3a', bays: 3 });
    for (k = 0; k < 22; k++) cloud(c, R, R() * W, 480 + R() * 200, 300 + R() * 300, '#fff8f0', '#d8b0b0', 0.95);
    rect(c, 0, 600, W, 120, LG(c, 0, 600, 0, H, [[0, 'rgba(255,240,230,0)'], [1, 'rgba(255,240,230,.8)']]));
    c.beginPath(); c.moveTo(0, 470); c.bezierCurveTo(160, 470, 260, 520, 340, 560); c.bezierCurveTo(400, 600, 460, 640, 520, H); c.lineTo(0, H); c.closePath(); c.fillStyle = LG(c, 0, 470, 0, H, [[0, '#2e2a38'], [1, '#141218']]); c.fill();
    alpha(c, 0.5, function () { for (var j = 0; j < 20; j++) { var x = R() * 380, y = 500 + R() * 200; line(c, x, y, x + 40, y + 20, '#5a5068', 2); } });
    pine(c, R, 250, 520, 1.3, '#16121c', 80);
    [[520, 220, 1], [560, 200, 0.7], [600, 236, 0.8]].forEach(function (b) { crane(c, b[0], b[1], b[2], '#3a3040'); });
    finish(c, { vig: 0.4, tint: '#ffb080', ta: 0.12 });
  },
  waterfall_cave: function (c, R) {
    sky(c, [[0, '#cfe8e0'], [1, '#8ab8b0']]);
    peaks(c, R, 380, 200, '#8aa8a0', '#d8ece6', { w: 140 });
    c.beginPath(); c.moveTo(430, 0); c.lineTo(850, 0); c.lineTo(820, 460); c.lineTo(460, 460); c.closePath(); c.fillStyle = LG(c, 0, 0, 0, 460, [[0, '#4a6a62'], [1, '#2a4640']]); c.fill();
    var fx0 = 560, fx1 = 720;
    c.fillStyle = LG(c, fx0, 0, fx1, 0, [[0, 'rgba(220,245,255,.5)'], [0.3, 'rgba(255,255,255,.95)'], [0.7, 'rgba(230,248,255,.9)'], [1, 'rgba(200,235,250,.5)']]); c.fillRect(fx0, 0, fx1 - fx0, 470);
    alpha(c, 0.6, function () { for (var k = 0; k < 70; k++) { var x = fx0 + R() * (fx1 - fx0); line(c, x, R() * 200, x + (R() - 0.5) * 4, 200 + R() * 270, R() < 0.5 ? '#ffffff' : '#a8d0e0', 1 + R() * 2); } });
    rect(c, 0, 450, W, 270, LG(c, 0, 450, 0, H, [[0, '#6ab0b0'], [0.5, '#2e7078'], [1, '#143a40']]));
    for (var p2 = 0; p2 < 18; p2++) puff(c, 640 + (R() - 0.5) * 400, 460 + R() * 40, 60 + R() * 60, '#ffffff', 0.5);
    alpha(c, 0.5, function () { for (var j = 0; j < 90; j++) { var y = 480 + Math.pow(R(), 1.4) * 240; line(c, R() * W, y, R() * W + 30, y, '#e0f8ff', 1); } });
    /* cave mouth framing */
    c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(1100, H); c.bezierCurveTo(1150, 600, 1080, 420, 1120, 300); c.bezierCurveTo(1150, 160, 980, 60, 820, 70); c.bezierCurveTo(700, 20, 520, 40, 420, 90); c.bezierCurveTo(240, 140, 150, 300, 180, 460); c.bezierCurveTo(200, 560, 150, 640, 170, H); c.lineTo(0, H); c.closePath();
    c.fillStyle = RG(c, 640, 380, 900, [[0, '#3a3e3a'], [0.5, '#1e2220'], [1, '#0a0c0c']]); c.fill();
    alpha(c, 0.55, function () { for (var j = 0; j < 40; j++) { var a = R() * PI * 2, rr2 = 520 + R() * 200; line(c, 640 + Math.cos(a) * rr2, 360 + Math.sin(a) * rr2 * 0.7, 640 + Math.cos(a) * (rr2 + 60), 360 + Math.sin(a) * (rr2 + 60) * 0.7, '#4a524c', 2 + R() * 3); } });
    for (var s = 0; s < 14; s++) { var sx = 440 + s * 30 + R() * 20, sl = 20 + R() * 60, sy = 70 + Math.abs(s - 7) * 6; poly(c, [[sx - 8, sy - 20], [sx + 8, sy - 20], [sx, sy + sl]], '#1a1e1c'); }
    for (var m2 = 0; m2 < 30; m2++) { var mx = R() < 0.5 ? 150 + R() * 80 : 1060 + R() * 80, my = 200 + R() * 400; eli(c, mx, my, 10 + R() * 14, 4 + R() * 4, rgba('#5a8a4a', 0.7)); }
    lighter(c, function () { glow(c, 640, 300, 400, '#e0fff8', 0.25); });
    shaft(c, 520, 60, 760, 60, 900, H, 380, H, '#f0fff8', 0.12);
    motes(c, R, 40, '#e8fff8', 100, 600);
    finish(c, { vig: 0.55, tint: '#80e0d0', ta: 0.1 });
  },
  night_rooftops: function (c, R) {
    skyNight(c, R, H, 860, 190);
    lighter(c, function () { glow(c, 860, 190, 300, '#ffe8c0', 0.35); });
    eli(c, 860, 190, 90, 90, RG(c, 830, 160, 120, [[0, '#fffcf0'], [1, '#f0e2c0']]));
    alpha(c, 0.12, function () { eli(c, 890, 170, 20, 16, '#8a8070'); eli(c, 830, 220, 26, 18, '#8a8070'); eli(c, 870, 230, 12, 10, '#8a8070'); });
    alpha(c, 0.35, function () { for (var k = 0; k < 4; k++) { var y = 200 + k * 34; eli(c, 760 + k * 90, y, 170, 7, 'rgba(40,50,90,.8)'); } });
    peaks(c, R, 470, 140, '#1a2040', '#1e2850', { w: 200 });
    rect(c, 170, 250, 50, 230, '#101630'); for (var t = 0; t < 7; t++) roofC(c, 195, 250 + t * 32, 110 - t * 2, 18, '#101630');
    for (var row = 0; row < 4; row++) {
      var y0 = 470 + row * 70, sc = 0.6 + row * 0.35;
      rect(c, 0, y0 + 18 * sc, W, 170 * sc, dk(lerpC('#1a2038', '#0a0e1c', row / 3), 0.25));
      for (var x = -100 + (row % 2) * 160; x < W + 200; x += 240 * sc) {
        if (R() < 0.45) rect(c, x - 40 * sc, y0 + 74 * sc, 26 * sc, 20 * sc, rgba('#ffb060', 0.7));
        roofC(c, x, y0, 300 * sc, 60 * sc, lerpC('#1a2038', '#0a0e1c', row / 3), '#06080e', true);
        if (R() < 0.6) lanternC(c, x + 110 * sc, y0 + 76 * sc, 7 * sc, '#e8401e');
        lighter(c, function () { glow(c, x, y0 + 90 * sc, 90 * sc, '#ff9a40', 0.2); });
      }
    }
    alpha(c, 0.8, function () { roofC(c, 380, 610, 1100, 150, '#0c1020', '#04060a', true); });
    rect(c, 0, 700, W, 20, '#04060a');
    finish(c, { vig: 0.55, tint: '#4060c0', ta: 0.15 });
  },
  market_street: function (c, R) {
    sky(c, [[0, '#3a3868'], [0.4, '#a86a78'], [0.7, '#f0a070'], [1, '#ffd8a0']], 420);
    peaks(c, R, 360, 120, '#7a5a78', '#e8a888', { w: 200 });
    var vp = 640, hz = 400;
    rect(c, 0, hz, W, H - hz, LG(c, 0, hz, 0, H, [[0, '#8a6a58'], [1, '#5a4034']]));
    alpha(c, 0.3, function () { for (var j = 0; j < 14; j++) { var y = lerp(hz, H, pz(j / 14)); line(c, 0, y, W, y, '#3a2a20', 1); } });
    [-1, 1].forEach(function (s) {
      for (var k = 5; k >= 0; k--) {
        var t0 = pz(k / 6), t1 = pz((k + 1) / 6), x0 = vp + s * lerp(90, 820, t0), x1 = vp + s * lerp(90, 820, t1), h0 = lerp(60, 520, t0), h1 = lerp(60, 520, t1), y0 = lerp(hz, H + 60, t0), y1 = lerp(hz, H + 60, t1);
        var wc = ['#c8a880', '#b89070', '#d0b490'][k % 3];
        poly(c, [[x0, y0], [x1, y1], [x1, y1 - h1], [x0, y0 - h0]], LG(c, x0, 0, x1, 0, [[0, dk(wc, 0.35)], [1, wc]]));
        poly(c, [[x0, y0 - h0 * 0.45], [x1, y1 - h1 * 0.45], [x1, y1 - h1 * 0.5], [x0, y0 - h0 * 0.5]], '#5a2a1a');
        poly(c, [[x0, y0 - h0 * 0.92], [x1, y1 - h1 * 0.92], [x1 + s * h1 * 0.12, y1 - h1 * 1.08], [x0 + s * h0 * 0.12, y0 - h0 * 1.08]], '#2a2a34');
        poly(c, [[x0, y0 - h0 * 0.47], [x1, y1 - h1 * 0.47], [x1 + s * h1 * 0.1, y1 - h1 * 0.56], [x0 + s * h0 * 0.1, y0 - h0 * 0.56]], '#34303a');
        var dx = lerp(x0, x1, 0.3), dw = (x1 - x0) * 0.4, dy = lerp(y0, y1, 0.3);
        poly(c, [[dx, dy], [dx + dw, lerp(y0, y1, 0.7)], [dx + dw, lerp(y0, y1, 0.7) - lerp(h0, h1, 0.7) * 0.38], [dx, dy - lerp(h0, h1, 0.3) * 0.38]], LG(c, 0, dy - 80, 0, dy, [[0, '#ffc870'], [1, '#c86a30']]));
        var sx = lerp(x0, x1, 0.85), sy2 = lerp(y0, y1, 0.85) - lerp(h0, h1, 0.85) * 0.88, sh2 = lerp(h0, h1, 0.85) * 0.34;
        rect(c, sx - sh2 * 0.1, sy2, sh2 * 0.2, sh2, ['#1e2a30', '#6a1a14', '#2a3a24'][k % 3]);
        alpha(c, 0.9, function () { for (var q = 0; q < 3; q++) line(c, sx - sh2 * 0.05, sy2 + sh2 * (0.2 + q * 0.25), sx + sh2 * 0.05, sy2 + sh2 * (0.25 + q * 0.25), '#e8c060', Math.max(1, sh2 * 0.03)); });
        lanternC(c, lerp(x0, x1, 0.6), lerp(y0, y1, 0.6) - lerp(h0, h1, 0.6) * 0.4, lerp(6, 22, (t0 + t1) / 2), '#d8321e');
      }
    });
    lanterns(c, R, 160, 160, 1120, 170, 60, ['#ff5a2a', '#ffb040'], 14);
    alpha(c, 0.8, function () { crowd(c, R, 520, 12, '#2a1a1e'); });
    bokeh(c, R, 30, ['#ffb060', '#ff6a3a'], 6, 20, 0.3, 300, H);
    finish(c, { vig: 0.45, tint: '#ff9a50', ta: 0.15 });
  },
  sect_hall: function (c, R) {
    var r = room(c, { b: [300, 110, 980, 470], ceil: [[0, '#1a1010'], [1, '#4a2a20']], side: [[0, '#4a1a14'], [1, '#7a2e22']], wall: [[0, '#6a3a2a'], [1, '#4a2418']], floor: [[0, '#4a4440'], [1, '#8a827a']] });
    checker(c, r, 8, 10, null, 'rgba(20,16,14,.25)');
    alpha(c, 0.4, function () { for (var y = 0; y < 110; y += 22) line(c, 0, y, W, y, '#2a1810', 6); for (var x = 0; x < W; x += 60) line(c, x, 0, lerp(x, 640, 0.5), 110, '#2a1810', 3); });
    rect(c, 300, 110, 680, 360, LG(c, 0, 110, 0, 470, [[0, '#5a2a1c'], [1, '#3a1a10']]));
    rect(c, 470, 150, 340, 190, '#2a3a38'); for (var k = 0; k < 6; k++) { alpha(c, 0.35, function () { line(c, 480 + k * 60, 160, 530 + k * 50, 330, '#6a8a80', 3); }); }
    alpha(c, 0.5, function () { peaksAt(c, R, 480, 330, 320, 120, '#9ab0a8'); });
    rect(c, 560, 120, 160, 44, '#1e2428'); rect(c, 566, 126, 148, 32, '#c8a048'); alpha(c, 0.8, function () { [590, 630, 670].forEach(function (x) { line(c, x, 132, x + 6, 152, '#1e2428', 4); line(c, x - 8, 142, x + 14, 140, '#1e2428', 3); }); });
    for (var s = 0; s < 4; s++) rect(c, 480 - s * 30, 400 + s * 14, 320 + s * 60, 14, s % 2 ? '#a8a098' : '#c8c0b4');
    rect(c, 590, 330, 100, 76, LG(c, 590, 0, 690, 0, [[0, '#5a1a10'], [0.5, '#9a3a24'], [1, '#4a140c']])); rect(c, 580, 300, 120, 34, '#6a2a18'); rect(c, 576, 294, 128, 8, '#c8a048');
    [-1, 1].forEach(function (sd) { rect(c, 640 + sd * 60 - 8, 312, 16, 90, '#7a2a18'); });
    eli(c, 640, 530, 40, 12, '#3a3230'); rect(c, 612, 470, 56, 60, LG(c, 612, 0, 668, 0, [[0, '#4a4038'], [0.5, '#8a7a60'], [1, '#3a302a']])); eli(c, 640, 470, 34, 8, '#6a5a48');
    smoke(c, R, 640, 460, 260, '#d8d0c8', 0.08);
    [0.08, 0.32, 0.6].forEach(function (t) { var q = r.L(t, 0), q2 = r.L(t, 1), w = 44 * r.sc(t) * 1.4; pillarRed(c, q[0] + w, q[1], q2[1], w); q = r.R(t, 0); q2 = r.R(t, 1); pillarRed(c, q[0] - w, q[1], q2[1], w); });
    [[380, 170], [900, 170]].forEach(function (b) { rect(c, b[0] - 22, b[1], 44, 230, LG(c, 0, b[1], 0, b[1] + 230, [[0, '#c0392b'], [1, '#7a1a14']])); rect(c, b[0] - 26, b[1] - 6, 52, 8, '#c8a048'); alpha(c, 0.8, function () { line(c, b[0], b[1] + 30, b[0], b[1] + 180, '#e8c060', 3); line(c, b[0] - 10, b[1] + 70, b[0] + 10, b[1] + 70, '#e8c060', 3); }); });
    shaft(c, 540, 0, 740, 0, 900, H, 380, H, '#fff0d0', 0.12);
    motes(c, R, 40, '#ffe0a0', 100, 600);
    finish(c, { vig: 0.55, tint: '#ff9a50', ta: 0.18 });
  },
  battlefield_snow: function (c, R) {
    sky(c, [[0, '#5a6070'], [0.6, '#a8acb4'], [1, '#d8d8dc']], 440);
    peaks(c, R, 380, 160, '#8a909c', '#cfd2d8', { w: 200 });
    rect(c, 470, 300, 340, 90, '#6a707c'); for (var k = 0; k < 9; k++) rect(c, 470 + k * 40, 288, 22, 14, '#6a707c'); roofC(c, 640, 250, 160, 36, '#4a505c');
    peaks(c, R, 440, 90, '#b8bcc4', '#e8e8ec', { w: 260 });
    rect(c, 0, 430, W, 290, LG(c, 0, 430, 0, H, [[0, '#dcdee4'], [1, '#f4f4f8']]));
    alpha(c, 0.5, function () { for (var j = 0; j < 40; j++) { var y = 440 + Math.pow(R(), 1.5) * 280; eli(c, R() * W, y, 60 + R() * 140, 4 + R() * 6, '#b8bcc8'); } });
    alpha(c, 0.7, function () { for (var a = 0; a < 70; a++) { var x = R() * W, y = 400 + R() * 30, s = 0.4 + R() * 0.3; line(c, x, y, x + (R() - 0.5) * 10, y - 40 * s, '#3a3a44', 1.2); eli(c, x, y + 4, 4 * s, 8 * s, '#3a3a44'); } });
    [[220, 600, 1.4, 0.3], [380, 560, 1, -0.2], [960, 590, 1.2, 0.15], [1110, 640, 1.6, -0.35], [760, 520, 0.8, 0.1]].forEach(function (s) {
      var x = s[0], y = s[1], k2 = s[2], lean = s[3];
      line(c, x, y, x + lean * 200 * k2, y - 220 * k2, '#3a2a1e', 4 * k2);
      if (s[0] % 2 === 0) { var tx = x + lean * 200 * k2, ty = y - 220 * k2; poly(c, [[tx, ty], [tx + 70 * k2, ty + 12 * k2], [tx + 50 * k2, ty + 40 * k2], [tx + 66 * k2, ty + 80 * k2], [tx + lean * 40 * k2, ty + 90 * k2]], '#8a2a2a'); }
      eli(c, x, y + 4, 30 * k2, 6 * k2, 'rgba(120,120,140,.35)');
    });
    [[520, 660], [800, 690], [120, 690]].forEach(function (b) { line(c, b[0] - 60, b[1], b[0] + 60, b[1] - 20, '#4a3a2a', 5); poly(c, [[b[0] + 60, b[1] - 20], [b[0] + 80, b[1] - 26], [b[0] + 64, b[1] - 12]], '#8a8a94'); });
    [[300, 180, 1], [340, 160, 0.8], [900, 140, 0.9], [940, 170, 0.7]].forEach(function (b) { crane(c, b[0], b[1], b[2] * 0.7, '#2a2a30'); });
    snow(c, R, 420, 0.9);
    alpha(c, 0.25, function () { rect(c, 0, 0, W, H, '#e8ecf4'); });
    finish(c, { vig: 0.45, tint: '#a0b0d0', ta: 0.15 });
  },
  burning_village: function (c, R) {
    sky(c, [[0, '#1a0a10'], [0.5, '#6a1a14'], [1, '#e0602a']], 480);
    for (var k = 0; k < 6; k++) smoke(c, R, 100 + k * 220, 420, 380, '#2a1414', 0.25);
    peaks(c, R, 420, 120, '#2a1014', '#8a3a20', { w: 200 });
    var houses = [[140, 500, 1], [420, 470, 0.8], [700, 490, 1.1], [1000, 470, 0.85], [1200, 510, 1]];
    houses.forEach(function (h) {
      var x = h[0], y = h[1], s = h[2];
      rect(c, x - 90 * s, y - 80 * s, 180 * s, 80 * s, '#1a0a0a');
      roofC(c, x, y - 130 * s, 220 * s, 56 * s, '#140808');
      alpha(c, 0.9, function () { rect(c, x - 60 * s, y - 60 * s, 30 * s, 34 * s, '#ff9a30'); rect(c, x + 20 * s, y - 60 * s, 30 * s, 34 * s, '#ffb040'); });
      flame(c, R, x + (R() - 0.5) * 60 * s, y - 120 * s, 140 * s, 160 * s);
    });
    rect(c, 0, 500, W, 220, LG(c, 0, 500, 0, H, [[0, '#3a1410'], [1, '#120606']]));
    lighter(c, function () { glow(c, 640, 520, 700, '#ff5a20', 0.25); });
    [[80, 720, 1.4], [1180, 720, 1.2]].forEach(function (b) { flame(c, R, b[0], b[1], 200 * b[2], 240 * b[2]); });
    alpha(c, 0.9, function () { for (var j = 0; j < 8; j++) { var x = 200 + R() * 880, y = 600 + R() * 100; line(c, x - 60, y, x + 60, y - 30 + R() * 20, '#0a0404', 8); } poly(c, [[500, 720], [540, 620], [560, 620], [600, 720]], '#0a0404'); });
    embers(c, R, 160, 0, H);
    finish(c, { vig: 0.6, tint: '#ff5020', ta: 0.2 });
  },
  secluded_hut: function (c, R) {
    sky(c, [[0, '#b8ccd8'], [0.6, '#eef0e6'], [1, '#f6f2e4']]);
    lighter(c, function () { glow(c, 300, 150, 400, '#fff4d8', 0.5); });
    peaks(c, R, 330, 230, '#aab8bc', '#eef0e6', { w: 140 });
    mistBand(c, 320, 50, '#f4f2ea', 0.8);
    peaks(c, R, 430, 200, '#7a8c88', '#eef0e6', { w: 190, ink: 0.3 });
    mistBand(c, 420, 50, '#f4f2ea', 0.75);
    rect(c, 0, 440, W, 280, LG(c, 0, 440, 0, H, [[0, '#9ab08a'], [1, '#5a7450']]));
    c.beginPath(); c.moveTo(900, 440); c.bezierCurveTo(840, 520, 1000, 600, 860, H); c.lineTo(1040, H); c.bezierCurveTo(1120, 600, 960, 520, 960, 440); c.closePath(); c.fillStyle = LG(c, 0, 440, 0, H, [[0, '#cfe4e8'], [1, '#7ab0c0']]); c.fill();
    alpha(c, 0.6, function () { for (var j = 0; j < 30; j++) { var y = 450 + R() * 270; line(c, 900 + (y - 440) * 0.1 + R() * 60, y, 930 + R() * 60, y + 2, '#ffffff', 1.5); } });
    /* hut */
    var hx = 520, hy = 520;
    rect(c, hx - 150, hy - 110, 300, 120, LG(c, 0, hy - 110, 0, hy + 10, [[0, '#a88a64'], [1, '#6a5438']]));
    alpha(c, 0.35, function () { for (var x = hx - 150; x < hx + 150; x += 12) line(c, x, hy - 110, x, hy + 10, '#4a3a24', 2); });
    rect(c, hx - 30, hy - 80, 60, 90, '#3a2a1a'); rect(c, hx + 60, hy - 86, 60, 44, '#e8dcc0'); alpha(c, 0.6, function () { for (var q = 1; q < 4; q++) { line(c, hx + 60 + q * 15, hy - 86, hx + 60 + q * 15, hy - 42, '#6a5438', 2); line(c, hx + 60, hy - 86 + q * 11, hx + 120, hy - 86 + q * 11, '#6a5438', 2); } });
    c.beginPath(); c.moveTo(hx - 200, hy - 100); c.quadraticCurveTo(hx - 120, hy - 150, hx - 80, hy - 210); c.lineTo(hx + 80, hy - 210); c.quadraticCurveTo(hx + 120, hy - 150, hx + 200, hy - 100); c.quadraticCurveTo(hx, hy - 90, hx - 200, hy - 100); c.fillStyle = LG(c, 0, hy - 210, 0, hy - 95, [[0, '#c8b078'], [1, '#8a7040']]); c.fill();
    alpha(c, 0.4, function () { for (var t = 0; t < 40; t++) { var x = hx - 180 + t * 9; line(c, x, hy - 100, x + (x - hx) * 0.2, hy - 205, '#6a5430', 1.5); } });
    rect(c, hx - 84, hy - 216, 168, 10, '#6a5430');
    smoke(c, R, hx + 60, hy - 220, 160, '#ffffff', 0.12);
    for (var f = 0; f < 12; f++) { var fx = hx - 260 + f * 44; rect(c, fx - 3, hy - 10, 6, 50, '#6a5438'); } line(c, hx - 262, hy + 4, hx + 230, hy + 4, '#6a5438', 4); line(c, hx - 262, hy + 22, hx + 230, hy + 22, '#6a5438', 4);
    /* plum tree with blossoms + pine */
    c.strokeStyle = '#2a2018'; c.lineCap = 'round';
    [[180, H, 150, 480, 14], [150, 480, 70, 400, 8], [150, 480, 250, 380, 8], [250, 380, 330, 350, 5], [70, 400, 40, 320, 5], [200, 430, 120, 360, 5]].forEach(function (b) { c.lineWidth = b[4]; c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo((b[0] + b[2]) / 2 + 20, (b[1] + b[3]) / 2, b[2], b[3]); c.stroke(); });
    c.lineCap = 'butt';
    for (var bl = 0; bl < 90; bl++) { var bx = 40 + R() * 300, by = 320 + R() * 170; eli(c, bx, by, 4 + R() * 3, 4 + R() * 3, R() < 0.7 ? '#f4a8b8' : '#fff0f4'); }
    pine(c, R, 1180, 560, 1.4, '#2a3a30', -30);
    for (var g2 = 0; g2 < 60; g2++) { var gx = R() * W, gy = 600 + R() * 120; line(c, gx, gy, gx + (R() - 0.5) * 8, gy - 10 - R() * 14, '#4a6a3a', 2); }
    paper(c, R, 0.05);
    finish(c, { vig: 0.35, tint: '#ffe8c0', ta: 0.1 });
  }
};
function house(c, R, night) {
  var r = room(c, { b: [260, 110, 1020, 480], ceil: [[0, '#3a2618'], [1, '#6a4a30']], side: [[0, '#6a4a30'], [1, '#a88058']], wall: [[0, '#b89068'], [1, '#8a6a48']], floor: [[0, '#5a3a24'], [1, '#9a6e48']] });
  alpha(c, 0.35, function () { for (var x = 260; x < 1020; x += 30) line(c, x, 110, x, 480, '#5a3a24', 2); });
  for (var k = 0; k < 3; k++) rect(c, 0, 20 + k * 30, W, 12, '#3a2414');
  rect(c, 330, 170, 200, 180, '#6a4a30'); rect(c, 342, 182, 176, 156, night ? LG(c, 0, 182, 0, 338, [[0, '#0c1438'], [1, '#2a3a70']]) : LG(c, 0, 182, 0, 338, [[0, '#8ac4f0'], [1, '#e8f4e0']]));
  if (night) { c.save(); c.beginPath(); c.rect(342, 182, 176, 156); c.clip(); stars(c, R, 30, 330); moon(c, 470, 220, 16); c.restore(); } else { c.save(); c.beginPath(); c.rect(342, 182, 176, 156); c.clip(); treeline(c, R, 338, 30, '#6a9a58', 18); c.restore(); shaft(c, 342, 190, 518, 190, 640, H, 300, H, '#fff4d0', 0.22); }
  rect(c, 427, 182, 6, 156, '#6a4a30'); rect(c, 342, 257, 176, 6, '#6a4a30');
  curtain(c, 318, 160, 50, 200, '#b85a4a', 2); curtain(c, 492, 160, 50, 200, '#b85a4a', 2);
  rect(c, 740, 260, 200, 220, '#8a7a6a'); rect(c, 720, 250, 240, 20, '#6a5a4a'); archPath(c, 840, 320, 120, 150); c.fillStyle = '#1a0e08'; c.fill();
  lighter(c, function () { glow(c, 840, 440, night ? 260 : 150, '#ff8a30', night ? 0.6 : 0.4); for (var f = 0; f < 6; f++) { var fx = 810 + R() * 60; poly(c, [[fx - 12, 470], [fx + 12, 470], [fx, 410 + R() * 20]], rgba(['#ffb040', '#ff6a20', '#ffe080'][f % 3], 0.85)); } });
  rect(c, 580, 200, 120, 8, '#5a3a24'); [590, 620, 660].forEach(function (x, i) { rr(c, x, 170, 22, 30, 6, ['#c87a4a', '#8aa0b0', '#d8c080'][i]); });
  for (var h = 0; h < 5; h++) { line(c, 270 + h * 14, 110, 270 + h * 14, 150, '#5a4a30', 1); eli(c, 270 + h * 14, 156, 6, 12, '#6a8a4a'); }
  poly(c, [[200, 540], [760, 540], [800, 600], [160, 600]], LG(c, 0, 540, 0, 600, [[0, '#a07048'], [1, '#6a4428']])); rect(c, 180, 600, 20, 120, '#4a2e1a'); rect(c, 760, 600, 20, 120, '#4a2e1a');
  eli(c, 360, 530, 50, 16, '#e8c890'); eli(c, 360, 522, 40, 12, '#c89050'); rr(c, 560, 470, 40, 64, 12, '#8ab0c0'); [[570, 460], [590, 452], [582, 440]].forEach(function (fl) { eli(c, fl[0], fl[1], 8, 8, '#f6d070'); });
  if (night) { lighter(c, function () { glow(c, 480, 470, 200, '#ffb050', 0.5); }); rect(c, 470, 480, 20, 50, '#e8d8b0'); }
  finish(c, night ? { vig: 0.6, tint: '#3050a0', ta: 0.3 } : { vig: 0.35, tint: '#ffd090', ta: 0.15 });
  if (night) alpha(c, 0.35, function () { rect(c, 0, 0, W, H, '#0a0c24'); lighter(c, function () { glow(c, 840, 440, 300, '#ff9040', 0.35); glow(c, 480, 480, 200, '#ffb050', 0.3); }); });
}

var BG_IDS = ['black', 'white', 'sky_day', 'sky_sunset', 'sky_night',
  'palace_hall', 'ballroom', 'garden_rose', 'bedroom_noble', 'study_duke', 'library', 'corridor_night', 'carriage', 'chapel', 'balcony_night', 'forest', 'town_market', 'dungeon', 'throne_room', 'tea_room', 'lake',
  'house_day', 'house_night', 'daughter_room', 'town_square', 'school', 'church', 'castle_gate', 'field_training', 'festival', 'tavern', 'mage_tower', 'hill_sunset', 'farm', 'harbor',
  'agency_office', 'practice_room', 'dorm', 'stage_concert', 'broadcast_studio', 'filming_set', 'audition_hall', 'rooftop_night', 'cafe', 'street_seoul', 'press_room', 'awards', 'airport', 'hospital', 'han_river',
  'mountain_sect', 'bamboo_forest', 'murim_inn', 'training_yard', 'cliff_sea_of_clouds', 'waterfall_cave', 'night_rooftops', 'market_street', 'sect_hall', 'battlefield_snow', 'burning_village', 'secluded_hut'];
var PAL = {
  black: ['#15121c', '#050408'], white: ['#ffffff', '#efe9e4'], sky_day: ['#3d7fd6', '#e2f1fb'], sky_sunset: ['#4a3276', '#ffb46e'], sky_night: ['#050818', '#2c3a70'],
  palace_hall: ['#e9dcc4', '#b89a70'], ballroom: ['#6a3a3e', '#caa070'], garden_rose: ['#84bdf0', '#4a7a3a'], bedroom_noble: ['#f6e4e0', '#c89a70'], study_duke: ['#3a261c', '#5a3a28'],
  library: ['#3a281e', '#6a4630'], corridor_night: ['#0a0c1c', '#2a2440'], carriage: ['#3a2016', '#8a2436'], chapel: ['#b8b4c0', '#d8d0cc'], balcony_night: ['#050818', '#2a2640'],
  forest: ['#a8d0c0', '#3e6a4e'], town_market: ['#84bdf0', '#8a7458'], dungeon: ['#1e2422', '#0a0c0c'], throne_room: ['#b8946a', '#8a1a28'], tea_room: ['#eef6ee', '#d0aa82'], lake: ['#6aa8e0', '#2a4a6a'],
  house_day: ['#b89068', '#9a6e48'], house_night: ['#1a1830', '#3a2418'], daughter_room: ['#fff0f2', '#e6c4a0'], town_square: ['#84bdf0', '#9a8468'], school: ['#f4ead4', '#c09470'],
  church: ['#84bdf0', '#4a7a3a'], castle_gate: ['#84bdf0', '#6a5a44'], field_training: ['#84bdf0', '#5a8a3a'], festival: ['#131d48', '#3a2a2a'], tavern: ['#3e281a', '#24140a'],
  mage_tower: ['#120e2a', '#2a1e4a'], hill_sunset: ['#8a4a86', '#2a2418'], farm: ['#84bdf0', '#6a9a40'], harbor: ['#5a90d0', '#1e3e62'], agency_office: ['#e8ecf0', '#c8ccd2'],
  practice_room: ['#e0e8f0', '#d8b088'], dorm: ['#4a3e66', '#7a6070'], stage_concert: ['#140a2a', '#6a3aff'], broadcast_studio: ['#0e1026', '#3a3a8a'], filming_set: ['#0c0c10', '#8a6a4a'],
  audition_hall: ['#22222c', '#5a4a3e'], rooftop_night: ['#131d48', '#1a1a24'], cafe: ['#4a3628', '#a07a58'], street_seoul: ['#0a0a1e', '#2a2638'], press_room: ['#e8ecf4', '#12141c'],
  awards: ['#0e0818', '#5a3460'], airport: ['#dce8f4', '#e0e2e8'], hospital: ['#eef4f2', '#dce4e4'], han_river: ['#070a20', '#101838'],
  mountain_sect: ['#9fb8c8', '#6e7a74'], bamboo_forest: ['#dfeedc', '#3a6a3e'], murim_inn: ['#3a2414', '#7a5634'], training_yard: ['#8ab4d8', '#c8c0b0'], cliff_sea_of_clouds: ['#3a4a7a', '#fff0d8'],
  waterfall_cave: ['#2a4640', '#143a40'], night_rooftops: ['#050818', '#0a0e1c'], market_street: ['#3a3868', '#5a4034'], sect_hall: ['#4a2418', '#8a827a'], battlefield_snow: ['#5a6070', '#f4f4f8'],
  burning_village: ['#1a0a10', '#120606'], secluded_hut: ['#b8ccd8', '#5a7450']
};
function bgGradient(id) { var p2 = PAL[id] || ['#3a3450', '#15121c']; return 'linear-gradient(180deg,' + p2[0] + ' 0%,' + mix(p2[0], p2[1], 0.5) + ' 55%,' + p2[1] + ' 100%)'; }
var CACHE = {};
function bg(id) {
  id = String(id || '');
  if (CACHE[id]) return CACHE[id];
  var doc = typeof document !== 'undefined' ? document : null, url;
  if (doc && doc.createElement) {
    try {
      var cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
      var c = cv.getContext('2d');
      var fn = SCENES[id];
      if (fn) fn(c, RNG(hash(id) || 7));
      else { var p2 = PAL[id] || ['#3a3450', '#15121c']; rect(c, 0, 0, W, H, LG(c, 0, 0, 0, H, [[0, p2[0]], [1, p2[1]]])); bokeh(c, RNG(hash(id)), 24, ['#ffffff'], 10, 40, 0.12); finish(c, { vig: 0.5 }); }
      url = cv.toDataURL('image/png');
    } catch (e) { url = null; }
  }
  if (!url) {
    var q = PAL[id] || ['#3a3450', '#15121c'];
    url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + q[0] + '"/><stop offset="1" stop-color="' + q[1] + '"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/></svg>');
    if (!doc) return url;
  }
  CACHE[id] = url;
  return url;
}

root.ART = {
  portrait: portrait,
  bg: bg,
  bgGradient: bgGradient,
  BG_IDS: BG_IDS,
  EMOTIONS: EMOTIONS.slice(),
  _scenes: SCENES,
  _pal: PAL
};
})(typeof window !== 'undefined' ? window : this);
