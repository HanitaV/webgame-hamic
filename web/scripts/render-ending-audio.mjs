/** Original SFX → two-pass loudness normalization → AAC stems and optional video mux. */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile, rename } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const output = resolve(root, "web/public/audio/endings"), qa = resolve(root, "output/ending-audio");
await mkdir(output, { recursive: true }); await mkdir(qa, { recursive: true });
const score = JSON.parse(await readFile(resolve(root, "web/public/data/ending-audio.json"), "utf8"));
const endings = (process.env.ENDINGS ?? "E1,E2,E3,E4,E5,E6").split(",");
const run = args => {
  const result = spawnSync(process.env.FFMPEG ?? "ffmpeg", ["-hide_banner", "-y", ...args], { windowsHide: true, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || String(result.error));
  return result.stderr;
};
let server = null;
let renderUrl = process.env.RENDER_URL;
if (!renderUrl) {
  try {
    const probe = await fetch("http://127.0.0.1:5173/render-audio.html");
    if (probe.ok) renderUrl = "http://127.0.0.1:5173";
  } catch { /* start embedded Vite server */ }
  if (!renderUrl) {
    const { createServer } = await import("vite");
    server = await createServer({ root: resolve(root, "web"), server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
    await server.listen();
    const address = server.httpServer.address();
    renderUrl = `http://127.0.0.1:${address.port}`;
  }
}
const browser = await chromium.launch({ channel: "chrome", args: ["--no-sandbox", "--use-angle=d3d11", "--force_high_performance_gpu", "--ignore-gpu-blocklist"] });
const measurements = {};
try {
  const page = await browser.newPage();
  await page.goto(`${renderUrl}/render-audio.html`);
  await page.waitForFunction(() => window.__endingAudioRender);
  for (const id of endings) {
    const base64 = await page.evaluate(id => window.__endingAudioRender(id), id);
    const wav = resolve(qa, `${id}.wav`), destination = resolve(output, `${id}.m4a`);
    await writeFile(wav, Buffer.from(base64, "base64"));
    const { lufs, truePeak, loudnessRange } = score.mix;
    const filter = `loudnorm=I=${lufs}:TP=${truePeak}:LRA=${loudnessRange}`;
    const first = run(["-i", wav, "-af", `${filter}:print_format=json`, "-f", "null", "-"]);
    const measured = JSON.parse(first.slice(first.lastIndexOf("{"), first.lastIndexOf("}") + 1));
    const second = `${filter}:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
    run(["-i", wav, "-af", second, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", destination]);
    const final = run(["-i", destination, "-af", "ebur128=peak=true", "-f", "null", "-"]);
    const summary = final.slice(final.lastIndexOf("Summary:"));
    const integrated = Number(summary.match(/I:\s*([-\d.]+) LUFS/)?.[1]);
    const peak = Number(summary.match(/Peak:\s*([-\d.]+) dBFS/)?.[1]);
    if (!Number.isFinite(integrated) || !Number.isFinite(peak) || peak > -1 || Math.abs(integrated - lufs) > 2) throw new Error(`${id}: invalid loudness ${summary}`);
    measurements[id] = { integratedLUFS: integrated, truePeakDBTP: peak, bytes: (await readFile(destination)).length };
    console.log(id, measurements[id]);
  }
} finally { await browser.close(); await server?.close(); }
await writeFile(resolve(output, "provenance.json"), JSON.stringify({
  created: new Date().toISOString(), source: "Original Web Audio synthesis: layered harmonic oscillators, pink-filtered air, crystalline bell shimmer and damped stereo courtyard reverb; no external samples or music.",
  authoring: ["src/core/ending-score.ts", "public/data/ending-audio.json"],
  duration: score.duration, sampleRate: 48000, channels: 2, codec: "AAC 192 kbit/s", target: score.mix, measurements,
  rebuild: "npm run render:ending-audio; npm run mux:ending-audio",
}, null, 2));
