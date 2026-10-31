/**
 * Autonomous GPU Render Pipeline for the 59-second Hamic 3D Trailer.
 * - Bundles render-trailer.html via Vite and serves all assets in-memory via Playwright CDP route interception (zero TCP sockets needed).
 * - Launches Chrome with D3D11 hardware GPU rasterization (rejects SwiftShader/software).
 * - Renders 16 QA keyframes + 4x4 contact sheet (--qa-only or full).
 * - Renders 1,770 frames (59.00s @ 30 FPS) at 1920x1080 and encodes:
 *   1. trailer/output/hamic_trailer_59s_no_subs.mp4 (1920x1080, 30fps, H.264 yuv420p + AAC 48kHz)
 *   2. trailer/output/hamic_trailer_59s_final.mp4   (1920x1080, 30fps, burned-in Vietnamese subtitles)
 *   3. trailer/output/hamic_trailer_59s_preview.mp4 (1280x720,  30fps, burned-in Vietnamese subtitles)
 *   4. trailer/output/contact_sheet.jpg             (4x4 QA contact sheet of 16 timestamps)
 */
import { chromium } from "playwright";
import { build } from "vite";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, resolve } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const webDir = resolve(root, "web");
const buildDir = resolve(root, "trailer/.build");
const outDir = resolve(root, "trailer/output");
const qaFramesDir = resolve(root, "trailer/qa/frames");
const audioWav = resolve(root, "trailer/audio/trailer_master_59s.wav");

const QA_TIMESTAMPS = [0, 3, 6, 10, 15, 20, 25, 30, 34, 37, 40, 43, 47, 52, 56, 58];
const qaOnly = process.argv.includes("--qa-only");
const fps = 30;
const duration = 59;
const totalFrames = fps * duration; // 1770

await mkdir(outDir, { recursive: true });
await mkdir(qaFramesDir, { recursive: true });

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function probeNvenc() {
  const res = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=black:s=256x256:d=0.1", "-c:v", "h264_nvenc", "-f", "null", "-"],
    { encoding: "utf8", windowsHide: true },
  );
  if (res.status === 0) {
    console.log("[Encoder] h264_nvenc hardware encoder available and active.");
    return { codec: "h264_nvenc", args: ["-c:v", "h264_nvenc", "-preset", "p5", "-cq", "19"] };
  }
  console.log("[Encoder] h264_nvenc unavailable (driver API mismatch); using CUDA hwaccel + libx264.");
  return { codec: "libx264", args: ["-c:v", "libx264", "-preset", "medium", "-crf", "18"] };
}

function runFfmpeg(args, cwd = root) {
  return new Promise((resolveDone, rejectDone) => {
    const proc = spawn("ffmpeg", args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d;
    });
    proc.on("error", rejectDone);
    proc.on("close", (code) => {
      if (code === 0) resolveDone();
      else rejectDone(new Error(`FFmpeg exited ${code}:\n${stderr}`));
    });
  });
}

async function buildContactSheet() {
  const inputs = [];
  for (let i = 0; i < QA_TIMESTAMPS.length; i++) {
    const sec = QA_TIMESTAMPS[i];
    inputs.push("-i", resolve(qaFramesDir, `qa_${String(sec).padStart(2, "0")}s.jpg`));
  }
  const filterParts = QA_TIMESTAMPS.map((_, i) => `[${i}:v]scale=480:270[v${i}]`).join(";");
  const stackInputs = QA_TIMESTAMPS.map((_, i) => `[v${i}]`).join("");
  const filterComplex = `${filterParts};${stackInputs}xstack=inputs=16:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|0_h0+h4|w0_h0+h4|w0+w1_h0+h4|w0+w1+w2_h0+h4|0_h0+h4+h8|w0_h0+h4+h8|w0+w1_h0+h4+h8|w0+w1+w2_h0+h4+h8[out]`;
  const sheetPath = resolve(outDir, "contact_sheet.jpg");
  await runFfmpeg([
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-hwaccel",
    "cuda",
    ...inputs,
    "-filter_complex",
    filterComplex,
    "-map",
    "[out]",
    "-q:v",
    "2",
    sheetPath,
  ]);
  console.log("[QA] Contact sheet written:", sheetPath);
}

console.log("[Build] Bundling render-trailer.html with Vite...");
await build({
  configFile: false,
  root: webDir,
  base: "/",
  publicDir: resolve(webDir, "public"),
  logLevel: "error",
  build: {
    outDir: buildDir,
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      input: resolve(webDir, "render-trailer.html"),
    },
  },
});

const browser = await chromium.launch({
  channel: "chrome",
  args: [
    "--no-sandbox",
    "--use-angle=d3d11",
    "--force_high_performance_gpu",
    "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ],
});

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(msg.text());
  });

  // Serve bundled assets and web/public directly via CDP route fulfillment (no network sockets required)
  await page.route("http://trailer.local/**", async (route) => {
    const u = new URL(route.request().url());
    const relPath = decodeURIComponent(u.pathname).replace(/^\/+/, "") || "render-trailer.html";
    const candidateBuild = resolve(buildDir, relPath);
    const candidatePublic = resolve(webDir, "public", relPath);
    const filePath = existsSync(candidateBuild) ? candidateBuild : candidatePublic;
    if (!existsSync(filePath)) {
      await route.fulfill({ status: 404, body: `Not found: ${relPath}` });
      return;
    }
    const body = await readFile(filePath);
    const contentType = MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    await route.fulfill({ status: 200, contentType, body });
  });

  await page.goto("http://trailer.local/render-trailer.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__trailer), null, { timeout: 60000 });

  const gpu = await page.evaluate(() => window.__trailer.gpu);
  console.log("[WebGL2 GPU]:", gpu);
  if (/swiftshader|software|llvmpipe|basic render/i.test(gpu)) {
    throw new Error(`Hardware GPU required, but got software renderer: ${gpu}`);
  }

  console.log("[QA] Rendering 16 QA keyframes...");
  for (const sec of QA_TIMESTAMPS) {
    const b64 = await page.evaluate((t) => window.__trailer.renderTime(t, 0.96), sec);
    const outPath = resolve(qaFramesDir, `qa_${String(sec).padStart(2, "0")}s.jpg`);
    await writeFile(outPath, Buffer.from(b64, "base64"));
  }
  await buildContactSheet();

  if (qaOnly) {
    if (pageErrors.length) console.warn("[Page Warnings]:", pageErrors);
    console.log("[QA] Done (--qa-only).");
  } else {
    const enc = probeNvenc();
    const noSubsPath = resolve(outDir, "hamic_trailer_59s_no_subs.mp4");
    const finalPath = resolve(outDir, "hamic_trailer_59s_final.mp4");
    const previewPath = resolve(outDir, "hamic_trailer_59s_preview.mp4");

    console.log(`[Render] Streaming ${totalFrames} frames (1920x1080 @ 30fps) to ${noSubsPath}...`);
    const ffArgs = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-hwaccel",
      "cuda",
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "-framerate",
      String(fps),
      "-i",
      "pipe:0",
      "-i",
      audioWav,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      ...enc.args,
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(fps),
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-shortest",
      "-movflags",
      "+faststart",
      noSubsPath,
    ];
    const ffmpeg = spawn("ffmpeg", ffArgs, { cwd: root, windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
    let ffErr = "";
    ffmpeg.stderr.on("data", (d) => {
      ffErr += d;
    });
    const ffDone = new Promise((res, rej) => {
      ffmpeg.on("error", rej);
      ffmpeg.on("close", (code) => (code === 0 ? res() : rej(new Error(ffErr))));
    });

    const t0 = Date.now();
    for (let f = 0; f < totalFrames; f++) {
      const b64 = await page.evaluate((idx) => window.__trailer.renderFrame(idx, 0.96), f);
      const buf = Buffer.from(b64, "base64");
      if (!ffmpeg.stdin.write(buf)) {
        await once(ffmpeg.stdin, "drain");
      }
      if (f % 150 === 0 || f === totalFrames - 1) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  Frame ${f + 1}/${totalFrames} (${((f / totalFrames) * 100).toFixed(1)}%) - ${elapsed}s`);
      }
    }
    ffmpeg.stdin.end();
    await ffDone;
    console.log(`[Render] Saved ${noSubsPath} (${((await stat(noSubsPath)).size / 1024 / 1024).toFixed(2)} MiB)`);

    // Burn in Vietnamese subtitles for hamic_trailer_59s_final.mp4 (1920x1080)
    const subStyle =
      "Fontname=Be Vietnam Pro,Fontsize=18,PrimaryColour=&H00FBF1EE,OutlineColour=&H00120907,BackColour=&H90120907,Bold=1,Outline=2,Shadow=1,MarginV=22";
    console.log("[Render] Encoding hamic_trailer_59s_final.mp4 (1920x1080 with burned-in Vietnamese subtitles)...");
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-hwaccel",
      "cuda",
      "-i",
      noSubsPath,
      "-vf",
      `subtitles=trailer/subtitles/trailer.srt:force_style='${subStyle}'`,
      ...enc.args,
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(fps),
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      finalPath,
    ]);
    console.log(`[Render] Saved ${finalPath} (${((await stat(finalPath)).size / 1024 / 1024).toFixed(2)} MiB)`);

    // Encode hamic_trailer_59s_preview.mp4 (1280x720)
    console.log("[Render] Encoding hamic_trailer_59s_preview.mp4 (1280x720 preview)...");
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-hwaccel",
      "cuda",
      "-i",
      finalPath,
      "-vf",
      "scale=1280:720:flags=lanczos",
      "-c:v",
      enc.codec,
      ...(enc.codec === "libx264" ? ["-preset", "fast", "-crf", "21"] : ["-preset", "p4", "-cq", "22"]),
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(fps),
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      previewPath,
    ]);
    console.log(`[Render] Saved ${previewPath} (${((await stat(previewPath)).size / 1024 / 1024).toFixed(2)} MiB)`);
  }
} finally {
  await browser.close();
}
