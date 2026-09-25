// Shared helpers for tools/capture-ref.cjs and tools/compare-ref.cjs (reference-page capture + role alignment).
//
// Files in film/ref/:
//   page.png          full-page screenshot at 1440 px wide (1 CSS px = 1 image px)
//   page-mobile.png   optional 390 px wide screenshot (not used by the film)
//   layout.json       DOM geometry (page size, sections, headings, CTAs, media, palette, fonts), page coordinates
//   roles.json        HAND-EDITABLE: which section / element is the hook, proof, action and cta
//   layout.js         window.REF_LAYOUT = layout.json + roles resolved to boxes (what the film reads, file:// safe)
//
// roles.json: each role is one of
//   { "section": 2 }                     section index in layout.json "sections" (negative counts from the end)
//   { "selector": "#reviews" }           "#id", ".class", "tag", or a combination like "section.reviews",
//                                        matched against captured sections, then headings, then CTAs
//   { "text": "후기" }                   first heading, then CTA, then section whose text contains it
//   { "cta": -1 } / { "cta": "문의" }     CTA by index in "ctas" (negative = from the end) or by text
// Section roles aim at their first heading (el) inside the section; CTA roles aim at the button, and their
// section is the one that contains it. Add "el": {"cta": …} / {"text": …} to override the element only.
const fs = require("fs"), path = require("path");

const REF_DIR = path.join(__dirname, "..", "film", "ref");
const ROLE_NAMES = ["hook", "proof", "action", "cta"];
const PROOF_WORDS = ["후기", "리뷰", "사례", "포트폴리오", "고객", "실적", "작업물", "만족", "추천",
  "review", "testimonial", "portfolio", "case stud", "client", "customer", "our work", "results", "trusted"];

// ---------------------------------------------------------------- in-page extraction (runs in the browser)
// Returns page coordinates (scroll-independent). Must be self-contained: it is serialized into the page.
function extractLayout() {
  const sx = scrollX, sy = scrollY;
  const R = e => e.getBoundingClientRect();
  const box = e => { const r = R(e); return [r.left + sx, r.top + sy, r.width, r.height].map(Math.round); };
  const txt = (e, n = 80) => (e.innerText || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, n);
  const hex = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); if (a < 0.05) return null;
    return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("") + (a < 0.99 ? Math.round(a * 255).toString(16).padStart(2, "0") : ""); };
  // geometry ignores opacity (reveal-on-scroll content may be faded out at scroll 0); the palette does not
  const visible = e => { const s = getComputedStyle(e), r = R(e);
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0; };
  const shown = e => visible(e) && +getComputedStyle(e).opacity > 0.02;
  const sel = e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") +
    [...e.classList].filter(c => c.length < 40).slice(0, 5).map(c => "." + c).join("");
  const st = e => { const s = getComputedStyle(e);
    return { bg: hex(s.backgroundColor), fg: hex(s.color), font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, radius: s.borderRadius }; };
  const de = document.documentElement;
  const W = Math.max(de.scrollWidth, de.clientWidth), H = Math.max(de.scrollHeight, document.body ? document.body.scrollHeight : 0);

  // sections: outermost semantic blocks, else the children of the page's single-child "spine"
  const big = e => { const r = R(e); return visible(e) && r.height >= 100 && r.width >= W * 0.6; };
  let secs = [...document.querySelectorAll("header, section, footer, article, main > *, [class*=section], [id*=section]")].filter(big);
  secs = secs.filter(e => !secs.some(o => o !== e && o.contains(e)));
  let how = "semantic";
  if (secs.length < 3) {
    let root = document.body;
    for (let i = 0; i < 12; i++) {
      const kids = [...root.children].filter(big);
      if (kids.length === 1) root = kids[0]; else break;
    }
    const kids = [...root.children].filter(big);
    if (kids.length >= secs.length) { secs = kids; how = "spine"; }
  }
  secs.sort((a, b) => box(a)[1] - box(b)[1]);
  const sections = secs.map((e, i) => { const h = e.querySelector("h1, h2, h3");
    return { i, tag: e.tagName.toLowerCase(), id: e.id || null, cls: [...e.classList].slice(0, 5), sel: sel(e), box: box(e),
      heading: h && visible(h) ? txt(h) : null, hasH1: !!e.querySelector("h1"), text: txt(e, 600), style: st(e) }; });

  const headings = [...document.querySelectorAll("h1, h2, h3")].filter(visible)
    .map(e => { const rg = document.createRange(); rg.selectNodeContents(e); const r = rg.getBoundingClientRect();   // ink box of the text
      const tb = r.width > 0 ? [r.left + sx, r.top + sy, r.width, r.height].map(Math.round) : box(e);
      return { level: +e.tagName[1], text: txt(e), sel: sel(e), box: tb, block: box(e), style: st(e) }; });

  const ctas = [...document.querySelectorAll("a[href], button, [role=button], input[type=submit], input[type=button]")]
    .filter(e => visible(e) && R(e).width >= 40 && R(e).height >= 24)
    .filter((e, _, all) => !all.some(o => o !== e && o.contains(e)))
    .map(e => { const s = getComputedStyle(e), fixed = (() => { for (let p = e; p && p !== document.body; p = p.parentElement) {
        const ps = getComputedStyle(p).position; if (ps === "fixed" || ps === "sticky") return true; } return false; })();
      const filled = !!hex(s.backgroundColor) || /gradient/.test(s.backgroundImage), bordered = parseFloat(s.borderTopWidth) > 0 && !!hex(s.borderTopColor);
      return { text: txt(e, 60) || e.value || e.getAttribute("aria-label") || "", href: e.getAttribute("href"), sel: sel(e), box: box(e),
        inNav: !!e.closest("header, nav") || fixed, filled, bordered, style: st(e) }; })
    .sort((a, b) => a.box[1] - b.box[1] || a.box[0] - b.box[0]);

  const media = [...document.querySelectorAll("img, video, canvas, picture, iframe")].filter(e => visible(e) && R(e).width >= 40 && R(e).height >= 40)
    .map(e => ({ tag: e.tagName.toLowerCase(), src: (e.currentSrc || e.src || e.getAttribute("poster") || "").slice(0, 160), box: box(e) }));

  // computed-style palette + fonts, weighted by visible text length (text) and box area (backgrounds)
  const tally = (m, k, w) => { if (k) m[k] = (m[k] || 0) + w; };
  const text = {}, fonts = {}, bgs = {}, btn = {};
  [...document.querySelectorAll("body *")].slice(0, 8000).forEach(e => {
    if (!shown(e)) return; const s = getComputedStyle(e), r = R(e);
    tally(bgs, hex(s.backgroundColor), r.width * r.height);
    const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join("").length;
    if (own) { tally(text, hex(s.color), own); tally(fonts, s.fontFamily, own); }
  });
  ctas.filter(c => c.filled && !c.inNav).forEach(c => tally(btn, c.style.bg, c.box[2] * c.box[3]));
  const top = (m, n = 8) => { const tot = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ v: k, share: +(v / tot).toFixed(3) })); };
  const loadedFonts = [...new Set([...document.fonts].filter(f => f.status === "loaded").map(f => `${f.family.replace(/["']/g, "")} ${f.weight}`))];

  return { page: { w: W, h: H, title: document.title, lang: de.lang || null }, sectionMode: how, sections, headings, ctas, media,
    style: { text: top(text), bg: top(bgs), buttons: top(btn, 5), fonts: top(fonts, 6), loadedFonts,
      body: st(document.body) } };
}

// ---------------------------------------------------------------- pixel palette (browser canvas, no deps)
// Dominant colours of a PNG by area, quantized to 5 bits/channel, merged within a small distance.
async function pixelPalette(page, png, n = 8) {
  return page.evaluate(async ({ src, n }) => {
    const img = new Image(); img.src = src; await img.decode();
    const w = 360, h = Math.max(1, Math.round(img.naturalHeight * w / img.naturalWidth));
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, m = new Map();
    for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 3) << 10 | (d[i + 1] >> 3) << 5 | (d[i + 2] >> 3); m.set(k, (m.get(k) || 0) + 1); }
    const tot = w * h, cols = [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ rgb: [(k >> 10 & 31) * 8 + 4, (k >> 5 & 31) * 8 + 4, (k & 31) * 8 + 4], v }));
    const out = [];
    for (const c of cols) { const o = out.find(o => Math.hypot(o.rgb[0] - c.rgb[0], o.rgb[1] - c.rgb[1], o.rgb[2] - c.rgb[2]) < 40);
      if (o) o.v += c.v; else out.push({ ...c }); if (out.length > 40) break; }
    return out.sort((a, b) => b.v - a.v).slice(0, n)
      .map(o => ({ v: "#" + o.rgb.map(x => Math.min(255, x).toString(16).padStart(2, "0")).join(""), share: +(o.v / tot).toFixed(3) }));
  }, { src: "data:image/png;base64," + png.toString("base64"), n });
}

// ---------------------------------------------------------------- roles
const idx = (arr, i) => arr[i < 0 ? arr.length + i : i];
const contains = (outer, inner) => inner[1] >= outer[1] - 2 && inner[1] < outer[1] + outer[3];
const sectionAt = (L, b) => L.sections.find(s => contains(s.box, b)) || L.sections.reduce((best, s) =>
  !best || Math.abs(s.box[1] - b[1]) < Math.abs(best.box[1] - b[1]) ? s : best, null);
const parseSel = s => ({ tag: (String(s).match(/^[a-z][a-z0-9-]*/i) || [""])[0].toLowerCase(),
  ids: [...String(s).matchAll(/#([\w-]+)/g)].map(m => m[1]), cls: [...String(s).matchAll(/\.([\w-]+)/g)].map(m => m[1]) });
function selMatch(sel, q) {             // captured "section#id.cls" vs a query "#id" / ".cls" / "tag" / "tag.cls#id"
  const t = parseSel(sel), w = parseSel(q);
  return (!w.tag || w.tag === t.tag) && w.ids.every(i => t.ids.includes(i)) && w.cls.every(c => t.cls.includes(c)) && !!(w.tag || w.ids.length || w.cls.length);
}
const lc = s => String(s || "").toLowerCase();

// Resolve one role spec -> { section: box, el: box, label, via } in page coordinates (or null)
function resolveRole(L, spec) {
  if (spec == null) return null;
  if (typeof spec === "number") spec = { section: spec };
  if (typeof spec === "string") spec = spec.startsWith("#") || spec.startsWith(".") ? { selector: spec } : { text: spec };
  let sec = null, el = null, via = null, label = null;
  const fromSection = s => { sec = s; const h = L.headings.find(h => contains(s.box, h.box)); el = h ? h.box : s.box; label = (h && h.text) || s.heading || s.sel; };
  const fromEl = (o, kind) => { el = o.box; sec = sectionAt(L, o.box); label = o.text || o.sel; via = kind; };
  if (spec.section != null) { const s = idx(L.sections, +spec.section); if (s) { fromSection(s); via = `section ${s.i}`; } }
  else if (spec.selector) {
    const s = L.sections.find(s => selMatch(s.sel, spec.selector));
    if (s) { fromSection(s); via = `selector ${spec.selector} -> section ${s.i}`; }
    else { const o = L.headings.find(h => selMatch(h.sel, spec.selector)) || L.ctas.find(c => selMatch(c.sel, spec.selector));
      if (o) fromEl(o, `selector ${spec.selector}`); }
  } else if (spec.text) {
    const q = lc(spec.text), o = L.headings.find(h => lc(h.text).includes(q)) || L.ctas.find(c => lc(c.text).includes(q));
    if (o) fromEl(o, `text "${spec.text}"`);
    else { const s = L.sections.find(s => lc(s.text).includes(q)); if (s) { fromSection(s); via = `text "${spec.text}" -> section ${s.i}`; } }
  } else if (spec.cta != null) {
    const o = typeof spec.cta === "number" ? idx(L.ctas, spec.cta) : L.ctas.find(c => lc(c.text).includes(lc(spec.cta)));
    if (o) fromEl(o, `cta ${JSON.stringify(spec.cta)}`);
  }
  if (!sec && !el) return null;
  if (spec.el) { const r = resolveRole(L, spec.el); if (r) { el = r.el; label = r.label; } }
  return { section: sec ? sec.box : el, sectionIndex: sec ? sec.i : null, el: el || sec.box, label, via };
}

function guessRoles(L) {
  const S = L.sections, roles = {};
  const hook = S.find(s => s.hasH1) || S.find(s => s.box[3] >= 300) || S[0];
  if (hook) roles.hook = { section: hook.i };
  const score = s => PROOF_WORDS.reduce((a, w) => a + (lc(s.text).split(w).length - 1) * 3, 0) +
    (s.text.match(/\d[\d,.]*\s*(%|\+|만|천|명|건|개|년|배|x|k\b)/gi) || []).length + (s.text.match(/[★⭐]/g) || []).length;
  const cand = S.filter(s => s !== hook).map(s => [s, score(s)]).sort((a, b) => b[1] - a[1]);
  const proof = cand.length && cand[0][1] > 0 ? cand[0][0] : S[Math.floor(S.length / 2)];
  if (proof) roles.proof = { section: proof.i };
  // "last prominent button": filled (or outlined) and not in the nav bar; biggest area breaks ties near the end
  const prom = L.ctas.filter(c => !c.inNav && (c.filled || c.bordered) && c.text);
  const last = prom[prom.length - 1] || L.ctas.filter(c => !c.inNav).slice(-1)[0];
  if (last) { const i = L.ctas.indexOf(last); roles.action = { cta: i }; roles.cta = { cta: i }; }
  else if (S.length) { roles.action = { section: -1 }; roles.cta = { section: -1 }; }
  return roles;
}

const readJSON = f => JSON.parse(fs.readFileSync(f, "utf8"));
const ROLES_HELP = "Hand-editable. Each role: {section: i} | {selector: '#id' / '.class' / 'tag'} | {text: '후기'} | {cta: -1 | 'text'}; " +
  "optional el: {...} overrides the element only. Then run: node tools/compare-ref.cjs (re-links layout.js and redraws compare.png).";

// layout.json + roles.json -> layout.js (window.REF_LAYOUT with roles resolved to boxes). Returns the resolved roles.
function link(dir = REF_DIR) {
  const L = readJSON(path.join(dir, "layout.json"));
  const rf = path.join(dir, "roles.json"), spec = fs.existsSync(rf) ? readJSON(rf) : guessRoles(L);
  const roles = {};
  ROLE_NAMES.forEach(k => { const r = resolveRole(L, spec[k]); if (r) roles[k] = r; });
  if (!roles.cta && roles.action) roles.cta = roles.action;
  if (!roles.action && roles.cta) roles.action = roles.cta;
  const film = { url: L.url, capturedAt: L.capturedAt, page: L.page, roles, sections: L.sections.map(s => ({ i: s.i, sel: s.sel, box: s.box, heading: s.heading })) };
  fs.writeFileSync(path.join(dir, "layout.js"), "// generated by tools/capture-ref.cjs / compare-ref.cjs from layout.json + roles.json; do not edit\n" +
    "window.REF_LAYOUT = " + JSON.stringify(film) + ";\n");
  return roles;
}

function printRoles(roles) {
  ROLE_NAMES.forEach(k => { const r = roles[k];
    console.log(`  ${k.padEnd(6)} ${r ? `${String(r.via).padEnd(28)} el ${JSON.stringify(r.el)}  section y=${r.section[1]} h=${r.section[3]}  "${String(r.label || "").slice(0, 40)}"` : "(unresolved)"}`); });
}

module.exports = { REF_DIR, ROLE_NAMES, ROLES_HELP, extractLayout, pixelPalette, resolveRole, guessRoles, link, printRoles, readJSON };
