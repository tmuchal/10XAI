// Renders video.html frame-by-frame with headless Chromium and pipes JPEG frames into ffmpeg.
// Usage:
//   node render-video.cjs <video.html> <out.mp4> [--music music.wav] [--fps 30]
//   node render-video.cjs <video.html> <outdir> --stills 3,15,40   (PNG previews at given seconds)
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const [html, out] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const fps = +opt("--fps", 30);
const music = opt("--music");
const stills = opt("--stills");
const ffmpeg = process.env.FFMPEG || "ffmpeg";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("file://" + path.resolve(html));
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  const total = await page.evaluate(() => window.TOTAL);

  if (stills) {
    for (const s of stills.split(",").map(Number)) {
      await page.evaluate(t => window.seek(t), s);
      await page.screenshot({ path: path.join(out, `still-${String(s).padStart(5, "0")}.png`) });
    }
    await browser.close();
    return;
  }

  const ff = spawn(ffmpeg, [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    ...(music ? ["-i", music] : []),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    ...(music ? ["-c:a", "aac", "-b:a", "160k", "-shortest"] : []),
    "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  const n = Math.round(total * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.seek(t), i / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (i % (fps * 10) === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
  await browser.close();
  console.log(`wrote ${out} (${total}s @ ${fps}fps)`);
})();
