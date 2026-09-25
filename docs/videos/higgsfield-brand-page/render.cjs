// Renders explainer.html to MP4, frame by frame (deterministic, no screen capture).
// Usage: node render.cjs [fps] [out.mp4] [page.html]   (needs playwright + ffmpeg on PATH or FFMPEG env)
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");

const FPS = Number(process.argv[2] || 30);
const OUT = process.argv[3] || path.join(__dirname, "explainer.mp4");
const FFMPEG = process.env.FFMPEG || "ffmpeg";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("file://" + path.join(__dirname, process.argv[4] || "explainer.html") + "?render");
  const duration = await page.evaluate(() => window.DURATION);
  const total = Math.round(duration * FPS);

  const ff = spawn(FFMPEG, ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", OUT],
    { stdio: ["pipe", "ignore", "inherit"] });

  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (f % (FPS * 5) === 0) process.stdout.write(`frame ${f}/${total}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
  await browser.close();
  console.log("wrote", OUT);
})();
