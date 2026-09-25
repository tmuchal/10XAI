// Composites briefing.html frame-by-frame (Blender plates + overlays) and encodes with the audio mix.
// Usage: node render-v3.cjs <briefing.html> <out.mp4> <mix.wav> [--stills f1,f2,...] [--from F --to F]
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const args = process.argv.slice(2);
const [html, out, audio] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ffmpeg = process.env.FFMPEG || "ffmpeg";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("file://" + path.resolve(html));
  await page.evaluate(async () => { await document.fonts.ready; });
  const total = await page.evaluate(() => window.TOTAL_FRAMES);
  const stills = opt("--stills");
  if (stills) {
    for (const f of stills.split(",").map(Number)) {
      await page.evaluate(f => window.frame(f), f);
      await page.waitForTimeout(50);
      await page.screenshot({ path: path.join(out, `f${String(f).padStart(4, "0")}.png`) });
    }
    return browser.close();
  }
  const ff = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-",
    "-i", audio, "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < total; f++) {
    await page.evaluate(f => window.frame(f), f);
    const buf = await page.screenshot({ type: "jpeg", quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (f % 150 === 0) console.log("frame", f);
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r)); await browser.close(); console.log("wrote", out);
})();
