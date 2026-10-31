#!/usr/bin/env node
/**
 * Hamic Trailer V3 — Hardware-Accelerated Deterministic Render Pipeline
 * =====================================================================
 * Bundles `render-trailer-v3.html` via Vite and serves all assets in-memory via
 * Playwright CDP route interception (`http://trailer.local/**`, zero TCP sockets).
 * Supports:
 *   node web/scripts/render-trailer-v3.mjs --gate A
 *   node web/scripts/render-trailer-v3.mjs --gate B
 *   node web/scripts/render-trailer-v3.mjs --gate C
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(WEB_DIR, "..");
const V3_DIR = path.resolve(ROOT_DIR, "trailer_v3");
const SYNC = JSON.parse(fs.readFileSync(path.resolve(V3_DIR, "captions/words.json"), "utf8"));
const LAST_FRAME = SYNC.totalFrames - 1;
const BUILD_DIR = path.resolve(V3_DIR, ".build");
const STILLS_DIR = path.resolve(V3_DIR, "qa", "stills");
const PREVIEW_DIR = path.resolve(V3_DIR, "preview");
const OUTPUT_DIR = path.resolve(V3_DIR, "output");
const QA_DIR = path.resolve(V3_DIR, "qa");
const MASTER_WAV = path.resolve(V3_DIR, "audio", "master_synced.wav");

for (const d of [BUILD_DIR, STILLS_DIR, PREVIEW_DIR, OUTPUT_DIR, QA_DIR]) {
  fs.mkdirSync(d, { recursive: true });
}

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
  ".ttf": "font/ttf",
};

function probeVideoEncoder() {
  const testRes = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=256x256:d=0.1",
      "-c:v",
      "h264_nvenc",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8", windowsHide: true }
  );
  if (testRes.status === 0) {
    return {
      codec: "h264_nvenc",
      args: ["-c:v", "h264_nvenc", "-preset", "p5", "-cq", "18", "-pix_fmt", "yuv420p"],
      note: "NVIDIA NVENC hardware encoder active",
    };
  }
  const errLine = (testRes.stderr || "").trim().split(/\r?\n/)[0] || "NVENC unavailable";
  return {
    codec: "libx264",
    args: ["-c:v", "libx264", "-preset", "fast", "-crf", "17", "-pix_fmt", "yuv420p"],
    note: `libx264 encode, CUDA decode (NVENC driver incompatibility; nvenc probe: ${errLine})`,
  };
}

async function bundleAndLaunchBrowser() {
  console.log("[Build] Bundling render-trailer-v3.html with Vite...");
  await build({
    configFile: false,
    root: WEB_DIR,
    base: "/",
    publicDir: path.resolve(WEB_DIR, "public"),
    logLevel: "error",
    build: {
      outDir: BUILD_DIR,
      emptyOutDir: true,
      copyPublicDir: false,
      rollupOptions: {
        input: path.resolve(WEB_DIR, "render-trailer-v3.html"),
      },
    },
  });

  const chromeArgs = [
    "--no-sandbox",
    "--use-angle=d3d11",
    "--force_high_performance_gpu",
    "--enable-gpu-rasterization",
    "--enable-zero-copy",
    "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ];

  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: "chrome", args: chromeArgs });
  } catch {
    browser = await chromium.launch({ headless: true, args: chromeArgs });
  }

  return browser;
}

async function openHarnessPage(browser, { width, height, aspect, mode }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("[PageError]", e));

  await page.route("http://trailer.local/**", async (route) => {
    const u = new URL(route.request().url());
    const relPath = decodeURIComponent(u.pathname).replace(/^\/+/, "") || "render-trailer-v3.html";
    const candidateBuild = path.resolve(BUILD_DIR, relPath);
    const candidatePublic = path.resolve(WEB_DIR, "public", relPath);
    const filePath = fs.existsSync(candidateBuild) ? candidateBuild : candidatePublic;
    if (!fs.existsSync(filePath)) {
      await route.fulfill({ status: 404, body: `Not found: ${relPath}` });
      return;
    }
    const body = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    await route.fulfill({ status: 200, contentType, body });
  });

  const url = `http://trailer.local/render-trailer-v3.html?w=${width}&h=${height}&aspect=${aspect}&mode=${mode}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__trailerV3 && window.__trailerV3.ready === true, null, {
    timeout: 60000,
  });
  const webglInfo = await page.evaluate(() => window.__trailerV3.getWebGLInfo());
  if (/swiftshader|software|llvmpipe|basic render/i.test(webglInfo.renderer)) {
    throw new Error(`Hardware GPU required, but got software WebGL: ${webglInfo.renderer}`);
  }
  return { context, page, webglInfo };
}

async function renderClip({
  browser,
  encoder,
  width,
  height,
  aspect,
  mode,
  startFrame,
  endFrame,
  outPath,
  label,
}) {
  const { context, page, webglInfo } = await openHarnessPage(browser, {
    width,
    height,
    aspect,
    mode,
  });

  const startSec = startFrame / 30;
  const durSec = (endFrame - startFrame + 1) / 30;

  const ffArgs = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-hwaccel",
    "cuda",
    "-f",
    "image2pipe",
    "-vcodec",
    "mjpeg",
    "-framerate",
    "30",
    "-i",
    "pipe:0",
    "-ss",
    startSec.toFixed(3),
    "-t",
    durSec.toFixed(3),
    "-i",
    MASTER_WAV,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-vf",
    "format=yuv420p",
    "-color_range",
    "tv",
    ...encoder.args,
    "-r",
    "30",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    "-shortest",
    outPath,
  ];

  const ff = spawn("ffmpeg", ffArgs, { windowsHide: true, stdio: ["pipe", "inherit", "inherit"] });

  const total = endFrame - startFrame + 1;
  const t0 = Date.now();
  for (let f = startFrame; f <= endFrame; f++) {
    await page.evaluate((frameIdx) => window.__trailerV3.renderFrame(frameIdx), f);
    const buf = await page.screenshot({ type: "jpeg", quality: 94, omitBackground: false });
    const ok = ff.stdin.write(buf);
    if (!ok) {
      await new Promise((r) => ff.stdin.once("drain", r));
    }
    const done = f - startFrame + 1;
    if (done % 90 === 0 || f === endFrame) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      process.stdout.write(`  [${label}] frame ${done}/${total} (${elapsed}s)\n`);
    }
  }

  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}`))
    );
  });

  await context.close();
  return webglInfo;
}

async function runGateA(browser) {
  console.log("=== GATE A: 3D Reconnaissance & Preview Stills (1080x1920) ===");
  const { context, page, webglInfo } = await openHarnessPage(browser, {
    width: 1080,
    height: 1920,
    aspect: "9x16",
    mode: "burned",
  });
  console.log(`WebGL Hardware GPU: ${webglInfo.renderer} (${webglInfo.vendor})`);

  const gateAFrames = [0, 42, 120, 276, 495, 546, 600, 654, 708, 759, 810, 861, 1029, 1055, 1075, 1095, 1176, 1227, 1290, 1380, 1530, 1650, 1780, LAST_FRAME];
  const telemetry = [];

  for (const f of gateAFrames) {
    const state = await page.evaluate((frameIdx) => window.__trailerV3.renderFrame(frameIdx), f);
    const outPng = path.resolve(STILLS_DIR, `frame_${String(f).padStart(4, "0")}.png`);
    await page.screenshot({ path: outPng, type: "png" });
    telemetry.push({ frame: f, file: outPng, ...state });
    console.log(
      `  Saved still frame ${f} (${state.timeSec}s, ${state.shotId}) -> HUS lift=${state.rigState.husLiftProgress}, USSH lift=${state.rigState.usshLiftProgress}`
    );
  }

  fs.writeFileSync(
    path.resolve(QA_DIR, "gate_a_telemetry.json"),
    JSON.stringify({ webglInfo, stills: telemetry }, null, 2),
    "utf8"
  );
  await context.close();
}

async function runGateB(browser, encoder) {
  console.log("=== GATE B: 720p/30fps Full-Motion Proof Clips ===");
  const clips = [
    { label: "hook", startFrame: 0, endFrame: 187, out: path.resolve(PREVIEW_DIR, "hook.mp4") },
    { label: "decisions", startFrame: 479, endFrame: 908, out: path.resolve(PREVIEW_DIR, "decisions.mp4") },
    { label: "countdown", startFrame: 920, endFrame: 1107, out: path.resolve(PREVIEW_DIR, "countdown.mp4") },
    { label: "launch", startFrame: 1108, endFrame: 1354, out: path.resolve(PREVIEW_DIR, "launch.mp4") },
  ];

  for (const c of clips) {
    await renderClip({
      browser,
      encoder,
      width: 720,
      height: 1280,
      aspect: "9x16",
      mode: "burned",
      startFrame: c.startFrame,
      endFrame: c.endFrame,
      outPath: c.out,
      label: c.label,
    });
  }
}

async function runGateC(browser, encoder) {
  console.log("=== GATE C: 1080x1920 Master & Clean & 16:9 Companion Renders ===");
  const burnedMp4 = path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_Reels_synced.mp4");
  const cleanMp4 = path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_Reels_synced_clean.mp4");
  const wideMp4 = path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_16x9_synced.mp4");
  const preview720Mp4 = path.resolve(PREVIEW_DIR, "preview_720p.mp4");

  const webglInfo = await renderClip({
    browser,
    encoder,
    width: 1080,
    height: 1920,
    aspect: "9x16",
    mode: "burned",
    startFrame: 0,
    endFrame: LAST_FRAME,
    outPath: burnedMp4,
    label: "Master_9x16_Burned",
  });

  // Produce 720p preview master from 1080x1920 master using CUDA hardware decode + scale
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-hwaccel",
      "cuda",
      "-i",
      burnedMp4,
      "-vf",
      "scale=720:1280",
      ...encoder.args,
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      preview720Mp4,
    ],
    { stdio: "inherit", windowsHide: true }
  );

  if (!process.argv.includes("--skip-clean")) await renderClip({
    browser,
    encoder,
    width: 1080,
    height: 1920,
    aspect: "9x16",
    mode: "clean",
    startFrame: 0,
    endFrame: LAST_FRAME,
    outPath: cleanMp4,
    label: "Master_9x16_Clean",
  });

  await renderClip({
    browser,
    encoder,
    width: 1920,
    height: 1080,
    aspect: "16x9",
    mode: "burned",
    startFrame: 0,
    endFrame: LAST_FRAME,
    outPath: wideMp4,
    label: "Companion_16x9",
  });

  // Build 24-frame contact sheet from the 1080x1920 master
  const contactSheetPath = path.resolve(QA_DIR, "contact_sheet.jpg");
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-hwaccel",
      "cuda",
      "-i",
      burnedMp4,
      "-vf",
      `fps=24/${SYNC.durationSec},scale=270:480,tile=6x4`,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      contactSheetPath,
    ],
    { stdio: "inherit", windowsHide: true }
  );

  console.log("Saved 24-frame QA contact sheet:", contactSheetPath);
  return { webglInfo, encoder };
}

async function runPatchHamic(browser, encoder) {
  console.log("=== PATCH EXPLOSION: Re-rendering Explosion Windows (0..188, 990..1394, 1617..1769) + Gate B Clips ===");

  await renderClip({
    browser,
    encoder,
    width: 720,
    height: 1280,
    aspect: "9x16",
    mode: "burned",
    startFrame: 0,
    endFrame: 188,
    outPath: path.resolve(PREVIEW_DIR, "hook.mp4"),
    label: "hook_explosion",
  });

  await renderClip({
    browser,
    encoder,
    width: 720,
    height: 1280,
    aspect: "9x16",
    mode: "burned",
    startFrame: 990,
    endFrame: 1289,
    outPath: path.resolve(PREVIEW_DIR, "launch.mp4"),
    label: "launch_explosion",
  });

  const targets = [
    {
      label: "Master_9x16_Burned",
      width: 1080,
      height: 1920,
      aspect: "9x16",
      mode: "burned",
      mp4: path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_Reels_synced.mp4"),
    },
    {
      label: "Master_9x16_Clean",
      width: 1080,
      height: 1920,
      aspect: "9x16",
      mode: "clean",
      mp4: path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_Reels_synced_clean.mp4"),
    },
    {
      label: "Companion_16x9",
      width: 1920,
      height: 1080,
      aspect: "16x9",
      mode: "burned",
      mp4: path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_16x9_synced.mp4"),
    },
  ];

  for (const t of targets) {
    const s1Mp4 = `${t.mp4}.s1.mp4`;
    const s2Mp4 = `${t.mp4}.s2.mp4`;
    const s3Mp4 = `${t.mp4}.s3.mp4`;
    const s4Mp4 = `${t.mp4}.s4.mp4`;
    const s5Mp4 = `${t.mp4}.s5.mp4`;
    const listTxt = `${t.mp4}.concat.txt`;
    const outTmp = `${t.mp4}.patched.mp4`;

    // Segment 1: Cold Open Explosion & Rewind (frames 0..188, 6.300s)
    await renderClip({
      browser,
      encoder,
      width: t.width,
      height: t.height,
      aspect: t.aspect,
      mode: t.mode,
      startFrame: 0,
      endFrame: 188,
      outPath: s1Mp4,
      label: `${t.label}_S1_Hook`,
    });

    // Segment 2: Unchanged Glitches + Speedrun + Misclick + Countdown (frames 189..989, 6.300s -> 33.000s, dur 26.700s)
    spawnSync(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-hwaccel",
        "cuda",
        "-i",
        t.mp4,
        "-ss",
        "6.300",
        "-frames:v",
        "801",
        "-vf",
        "fps=30,format=yuv420p",
        "-color_range",
        "tv",
        ...encoder.args,
        "-r",
        "30",
        "-an",
        s2Mp4,
      ],
      { stdio: "inherit", windowsHide: true }
    );

    // Segment 3: Actual Disaster Explosion + Relief Rollback (frames 990..1394, 33.000s -> 46.500s)
    await renderClip({
      browser,
      encoder,
      width: t.width,
      height: t.height,
      aspect: t.aspect,
      mode: t.mode,
      startFrame: 990,
      endFrame: 1394,
      outPath: s3Mp4,
      label: `${t.label}_S3_Disaster`,
    });

    // Segment 4: Unchanged Event Reveal P1 & P2 (frames 1395..1616, 46.500s -> 53.900s, dur 7.400s)
    spawnSync(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-hwaccel",
        "cuda",
        "-i",
        t.mp4,
        "-ss",
        "46.500",
        "-frames:v",
        "222",
        "-vf",
        "fps=30,format=yuv420p",
        "-color_range",
        "tv",
        ...encoder.args,
        "-r",
        "30",
        "-an",
        s4Mp4,
      ],
      { stdio: "inherit", windowsHide: true }
    );

    // Segment 5: Choice CTA ("CHO NỔ CẢ HAI TRƯỜNG") + Loop Seam (frames 1617..1769, 53.900s -> 59.000s)
    await renderClip({
      browser,
      encoder,
      width: t.width,
      height: t.height,
      aspect: t.aspect,
      mode: t.mode,
      startFrame: 1617,
      endFrame: LAST_FRAME,
      outPath: s5Mp4,
      label: `${t.label}_S5_OutroLoop`,
    });

    fs.writeFileSync(
      listTxt,
      [s1Mp4, s2Mp4, s3Mp4, s4Mp4, s5Mp4].map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n",
      "utf8"
    );

    spawnSync(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listTxt,
        "-i",
        MASTER_WAV,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "48000",
        "-movflags",
        "+faststart",
        "-t",
        "59.000",
        outTmp,
      ],
      { stdio: "inherit", windowsHide: true }
    );

    fs.renameSync(outTmp, t.mp4);
    for (const f of [s1Mp4, s2Mp4, s3Mp4, s4Mp4, s5Mp4, listTxt]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    console.log(`  Patched ${t.label} -> ${t.mp4}`);
  }

  // Update preview_720p.mp4 & contact sheets
  const burnedMp4 = path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_Reels_synced.mp4");
  const wideMp4 = path.resolve(OUTPUT_DIR, "Hamic_Trailer_V3_16x9_synced.mp4");
  const preview720Mp4 = path.resolve(PREVIEW_DIR, "preview_720p.mp4");
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-hwaccel",
      "cuda",
      "-i",
      burnedMp4,
      "-vf",
      "scale=720:1280,format=yuv420p",
      "-color_range",
      "tv",
      ...encoder.args,
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      preview720Mp4,
    ],
    { stdio: "inherit", windowsHide: true }
  );

  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-hwaccel",
      "cuda",
      "-i",
      burnedMp4,
      "-vf",
      `fps=24/${SYNC.durationSec},scale=270:480,tile=6x4`,
      "-frames:v",
      "1",
      "-update",
      "1",
      "-q:v",
      "2",
      path.resolve(QA_DIR, "contact_sheet.jpg"),
    ],
    { stdio: "inherit", windowsHide: true }
  );

  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-hwaccel",
      "cuda",
      "-i",
      wideMp4,
      "-vf",
      "fps=24/59,scale=480:270,tile=6x4",
      "-frames:v",
      "1",
      "-update",
      "1",
      "-q:v",
      "3",
      path.resolve(QA_DIR, "contact_sheet_16x9.jpg"),
    ],
    { stdio: "inherit", windowsHide: true }
  );
}

async function main() {
  const gateArgIdx = process.argv.indexOf("--gate");
  const gate = gateArgIdx !== -1 ? process.argv[gateArgIdx + 1] : "ALL";

  const encoder = probeVideoEncoder();
  console.log(`Video Encoder Probe: ${encoder.codec} — ${encoder.note}`);

  const browser = await bundleAndLaunchBrowser();
  try {
    if (gate === "PATCH") {
      throw new Error("PATCH uses obsolete 59-second windows. Use gate C to rebuild synced outputs.");
      await runPatchHamic(browser, encoder);
      return;
    }
    if (gate === "A" || gate === "ALL") {
      await runGateA(browser);
    }
    if (gate === "B" || gate === "ALL") {
      await runGateB(browser, encoder);
    }
    if (gate === "C" || gate === "ALL") {
      await runGateC(browser, encoder);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
