// Lint the film's shared global scope: node tools/check-globals.cjs [--selftest]
//
// film/index.html loads classic scripts that share ONE global lexical scope. A top-level name declared twice
// (e.g. a new chapter's `const seg`) makes the second script throw "Identifier … has already been declared",
// and the film renders blank. This tool loads the scripts in index.html order and fails on:
//   1. duplicate top-level declarations across (or within) scripts
//   2. `window.X = …` overwriting a top-level function/var X declared by another script
//   3. a chapter file reading film-global timing (DURATION, BOUNDS, TIMELINE, SHOTS3D, CAPTIONS, SC): chapters
//      run on their own authored clock (see scene() in core.js), so film time must not leak in
//   4. V8 itself refusing to instantiate a script in load order (ground truth; needs no parser)
// Warns (fails with --strict) on chapter top-level names without the chapter prefix (c03_, C03_, c03s_, …).
// Parser: acorn (resolved from NODE_PATH, or bundled with the global eslint). `source tools/env.sh` first.
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");

const FILM = path.join(__dirname, "..", "film");
const TIMING = new Set(["DURATION", "BOUNDS", "TIMELINE", "SHOTS3D", "CAPTIONS", "SC", "SIGNS"]);
const args = process.argv.slice(2), STRICT = args.includes("--strict"), SELFTEST = args.includes("--selftest");

function loadAcorn() {
  const roots = [...(process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean)];
  try { roots.push(cp.execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()); } catch (e) {}
  const tries = ["acorn", ...roots.flatMap(r => [path.join(r, "acorn"), path.join(r, "eslint", "node_modules", "acorn"), path.join(r, "espree", "node_modules", "acorn")])];
  for (const t of tries) { try { return require(t); } catch (e) {} }
  return null;
}
const acorn = loadAcorn();

function scripts() {
  const html = fs.readFileSync(path.join(FILM, "index.html"), "utf8");
  return [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1])
    .map(rel => ({ rel, src: fs.readFileSync(path.join(FILM, rel), "utf8") }));
}

function patternNames(p, out) {
  if (!p) return out;
  if (p.type === "Identifier") out.push(p.name);
  else if (p.type === "ObjectPattern") p.properties.forEach(q => patternNames(q.type === "RestElement" ? q.argument : q.value, out));
  else if (p.type === "ArrayPattern") p.elements.forEach(q => patternNames(q, out));
  else if (p.type === "RestElement") patternNames(p.argument, out);
  else if (p.type === "AssignmentPattern") patternNames(p.left, out);
  return out;
}

function topLevel(src, file) {
  const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "script", locations: true });
  const decls = [];
  for (const n of ast.body) {
    if (n.type === "VariableDeclaration") n.declarations.forEach(d => patternNames(d.id, []).forEach(name => decls.push({ name, kind: n.kind, line: d.loc.start.line })));
    else if (n.type === "FunctionDeclaration") decls.push({ name: n.id.name, kind: "function", line: n.loc.start.line });
    else if (n.type === "ClassDeclaration") decls.push({ name: n.id.name, kind: "class", line: n.loc.start.line });
  }
  const toks = [...acorn.tokenizer(src, { ecmaVersion: "latest", locations: true })];
  const windowSets = [], reads = [];
  toks.forEach((tk, i) => {
    if (tk.type.label !== "name") return;
    const prev = toks[i - 1], next = toks[i + 1];
    if (tk.value === "window" && next && next.type.label === "." && toks[i + 2] && toks[i + 3] && toks[i + 3].type.label === "=")
      windowSets.push({ name: toks[i + 2].value, line: tk.loc.start.line });
    const isProp = prev && (prev.type.label === "." || prev.type.label === "?.");
    const isKey = next && next.type.label === ":" && prev && (prev.type.label === "{" || prev.type.label === ",");
    if (!isProp && !isKey && TIMING.has(tk.value)) reads.push({ name: tk.value, line: tk.loc.start.line });
  });
  return { decls, windowSets, reads };
}

function check(list) {
  const errors = [], warns = [];
  // 4. ground truth: instantiate every script in one context, in load order
  const ctx = vm.createContext({});
  for (const { rel, src } of list) {
    try { new vm.Script(src, { filename: rel }).runInContext(ctx, { timeout: 2000 }); }
    catch (e) { if (e && e.name === "SyntaxError") errors.push(`${rel}: V8 refuses to load it: ${e.message}`); /* other errors: no DOM here */ }
  }
  if (!acorn) { warns.push("acorn not found (set NODE_PATH, see tools/env.sh): only the V8 load check ran"); return { errors, warns }; }
  const owner = new Map();   // name -> {rel, kind, line}
  const parsed = list.map(({ rel, src }) => ({ rel, ...topLevel(src, rel) }));
  for (const { rel, decls } of parsed) {
    for (const d of decls) {
      const o = owner.get(d.name);
      // (var/function duplicates do not throw, but the later one silently replaces the earlier: also an error)
      if (o) errors.push(`${rel}:${d.line} top-level ${d.kind} '${d.name}' already declared in ${o.rel}:${o.line} (${o.kind})`);
      else owner.set(d.name, { rel, ...d });
      const m = rel.match(/chapters\/(ch([\w]+))\.js$/);
      if (m && !new RegExp(`^[cC]${m[2]}_`).test(d.name)) warns.push(`${rel}:${d.line} chapter top-level name '${d.name}' lacks the '${"c" + m[2]}_' prefix`);
    }
  }
  for (const { rel, windowSets } of parsed) for (const w of windowSets) {
    const o = owner.get(w.name);
    if (o && ["function", "var"].includes(o.kind)) errors.push(`${rel}:${w.line} window.${w.name} = … overwrites the top-level ${o.kind} '${w.name}' of ${o.rel}:${o.line}`);
  }
  for (const { rel, reads } of parsed) if (/chapters\//.test(rel)) for (const r of reads)
    errors.push(`${rel}:${r.line} chapter reads film-global '${r.name}' (chapters must stay on their authored clock)`);
  return { errors, warns };
}

let list = scripts();
if (SELFTEST) {   // a scratch chapter that shadows core names and reads film time must be caught
  const i = list.findIndex(s => s.rel === "captions.js");
  list.splice(i, 0, { rel: "chapters/chzz.js", src: "const el = 1;\nfunction hash() {}\nconst c_zz_bad = DURATION;\n" });
}
const { errors, warns } = check(list);
warns.forEach(w => console.log("warn  " + w));
errors.forEach(e => console.log("ERROR " + e));
const names = acorn ? list.reduce((n, s) => n + topLevel(s.src, s.rel).decls.length, 0) : "?";
console.log(`${list.length} scripts, ${names} top-level names: ${errors.length} error(s), ${warns.length} warning(s)` + (acorn ? "" : " [no parser]"));
if (SELFTEST) {
  const ok = errors.some(e => /'el' already declared/.test(e)) && errors.some(e => /'hash' already declared/.test(e)) && errors.some(e => /reads film-global 'DURATION'/.test(e)) && errors.some(e => /V8 refuses/.test(e));
  console.log(ok ? "selftest ok: collisions and film-time reads are caught" : "selftest FAILED"); process.exit(ok ? 0 : 1);
}
process.exit(errors.length || (STRICT && warns.length) ? 1 : 0);
