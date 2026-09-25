// Parallel frame renderer: splits the timeline across worker processes, then joins
// the segments and (optionally) muxes a narration track.
// Usage: node tools/render-parallel.cjs <page.html> <out.mp4> [fps=30] [workers=4] [audio.wav]
// Env: FFMPEG (path to ffmpeg), NODE_PATH must resolve "playwright".
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("child_process");
const path = require("path"), fs = require("fs");
const FFMPEG = process.env.FFMPEG || "ffmpeg";

async function openPage(html) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("file://" + path.resolve(html) + "?render");
  await page.evaluate(() => window.READY || null);
  return { browser, page };
}

async function worker(html, fps, a, b, out) {
  const { browser, page } = await openPage(html);
  const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "medium", out], { stdio: ["pipe", "ignore", "inherit"] });
  for (let f = a; f < b; f++) {
    await page.evaluate(t => window.render(t), f / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
  await browser.close();
}

async function main() {
  const [html, out, fpsArg, wArg, audio] = process.argv.slice(2);
  if (process.env.RP_WORKER) {
    const [a, b, seg] = process.env.RP_WORKER.split(",");
    return worker(html, Number(fpsArg), Number(a), Number(b), seg);
  }
  const fps = Number(fpsArg || 30), W = Number(wArg || 4);
  const { browser, page } = await openPage(html);
  const total = Math.round((await page.evaluate(() => window.DURATION)) * fps);
  await browser.close();
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "rp-"));
  const per = Math.ceil(total / W), segs = [];
  const t0 = Date.now();
  await Promise.all(Array.from({ length: W }, (_, i) => {
    const a = i * per, b = Math.min(total, a + per), seg = path.join(tmp, `seg${i}.mp4`);
    segs.push(seg);
    return new Promise((res, rej) => {
      const p = spawn(process.execPath, [__filename, html, out, String(fps), String(W)], { env: { ...process.env, RP_WORKER: `${a},${b},${seg}` }, stdio: "inherit" });
      p.on("close", c => c === 0 ? res() : rej(new Error("worker " + i + " failed")));
    });
  }));
  fs.writeFileSync(path.join(tmp, "list.txt"), segs.map(s => `file '${s}'`).join("\n"));
  const args = ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "list.txt")];
  if (audio) args.push("-i", audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest");
  args.push("-c:v", "copy", "-movflags", "+faststart", out);
  execFileSync(FFMPEG, args, { stdio: "inherit" });
  console.log(`wrote ${out} (${total} frames, ${W} workers, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
main().catch(e => { console.error(e); process.exit(1); });
