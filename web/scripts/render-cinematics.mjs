/** GPU raster → fixed-clock JPEG frames → H.264. Run against `npm run dev`.
 * PREVIEW=1 ENDINGS=E1 npm run render:cinematics produces contact frames first.
 * Never accepts SwiftShader/software rendering as a GPU export. */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const output = resolve(root, "web/public/cinematics");
const qa = resolve(root, "output/cinematics");
const width = Number(process.env.RENDER_WIDTH ?? 1920), height = Number(process.env.RENDER_HEIGHT ?? 1080);
const fps = 30, duration = 16;
const endings = (process.env.ENDINGS ?? "E1,E2,E3,E4,E5,E6").split(",");
await mkdir(output, { recursive: true }); await mkdir(qa, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--force_high_performance_gpu", "--ignore-gpu-blocklist", "--disable-software-rasterizer", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${process.env.RENDER_URL ?? "http://127.0.0.1:5173"}/render-cinematics.html`);
  await page.waitForFunction(() => window.__cinema, null, { timeout: 120000 });
  const gpu = await page.evaluate(() => window.__cinema.gpu);
  console.log("GPU:", gpu);
  if (/swiftshader|software|llvmpipe|basic render/i.test(gpu)) throw new Error("Hardware GPU is required for this export.");
  for (const id of endings) {
    if (!/^E[1-6]$/.test(id)) throw new Error(`Unknown ending ${id}`);
    await page.evaluate(id => window.__cinema.start(id), id);
    // Verify the semantic reveal, so the films cannot silently regress to unexplained dots.
    for (const [time, expected] of [[1, "neutral"], [2.5, "colored"], [11, "points"]]) {
      const reveal = await page.evaluate(time => { window.__cinema.frame(time); return window.__cinema.diagnostics().drones.reveal; }, time);
      const valid = expected === "neutral" ? reveal.hull === 1 && reveal.colored === 0 : expected === "colored" ? reveal.hull === 1 && reveal.colored === 1 : reveal.hull === 0;
      if (!valid) throw new Error(`${id}: drone reveal failed at ${time}s: ${JSON.stringify(reveal)}`);
    }
    // Restart after the probes: the movie's simulation must advance from frame zero.
    await page.evaluate(id => window.__cinema.start(id), id);
    if (process.env.PREVIEW) {
      for (const time of [1, 2.3, 6, 11, 15]) {
        const jpg = await page.evaluate(time => window.__cinema.frame(time), time);
        await writeFile(resolve(qa, `${id}-${time}.jpg`), Buffer.from(jpg, "base64"));
      }
      console.log("Preview", id);
      continue;
    }
    const path = resolve(output, `${id}.mp4`);
    const ffmpeg = spawn(process.env.FFMPEG ?? "ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", String(fps), "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path], { windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    ffmpeg.stderr.on("data", data => { stderr += data; });
    const completion = new Promise((resolve, reject) => {
      ffmpeg.on("error", reject);
      ffmpeg.on("close", code => code === 0 ? resolve() : reject(new Error(stderr)));
    });
    for (let frame = 0; frame < fps * duration; frame++) {
      const jpg = Buffer.from(await page.evaluate(t => window.__cinema.frame(t), frame / fps), "base64");
      if (!ffmpeg.stdin.write(jpg)) await once(ffmpeg.stdin, "drain");
      if (frame === 0) await writeFile(resolve(output, `${id}.jpg`), jpg);
      if ([30, 69, 180, 330, 450].includes(frame)) await writeFile(resolve(qa, `${id}-${frame / fps}.jpg`), jpg);
      if (frame % 90 === 0) console.log(`${id}: ${frame}/${fps * duration}`);
    }
    ffmpeg.stdin.end();
    await completion;
    console.log(`${id}: ${((await stat(path)).size / 1024 / 1024).toFixed(2)} MiB`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  if (!process.env.PREVIEW) await writeFile(resolve(output, "provenance.json"), JSON.stringify({
    created: new Date().toISOString(), source: "Original in-repository campus model and procedural Three.js scenes. No external footage.",
    renderer: gpu, width, height, fps, duration, codec: "H.264 / yuv420p, CRF 19, faststart, no audio", encoder: "libx264 (installed NVENC requires a newer driver; rasterization remains hardware GPU)",
    rebuild: "npm run dev; npm run render:cinematics",
    endings: (await Promise.all(["E1", "E2", "E3", "E4", "E5", "E6"].map(async id => { try { await stat(resolve(output, `${id}.mp4`)); return id; } catch { return null; } }))).filter(Boolean),
    renderedThisRun: endings,
  }, null, 2));
} finally { await browser.close(); }
