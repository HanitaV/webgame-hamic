/**
 * Hamic Trailer V3 — Browser Harness Entrypoint (`render-trailer-v3.html`)
 * ========================================================================
 * Exposes `window.__trailerV3` for Playwright deterministic frame capture:
 * - `renderFrame(frame: number)`
 * - `getWebGLInfo()`
 * - `totalFrames`, `fps`, `durationSec`
 */

import "@fontsource/be-vietnam-pro/vietnamese-800.css";
import "@fontsource/be-vietnam-pro/latin-800.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "../style.css";
import { DATA, loadData } from "../core/data";
import { initWorld } from "../scene/world";
import { AspectMode, DURATION_SEC, FPS, RenderOverlayMode, TOTAL_FRAMES } from "./timeline";
import { TrailerV3Director } from "./director";

export interface TrailerV3Harness {
  ready: boolean;
  fps: number;
  durationSec: number;
  totalFrames: number;
  aspectMode: AspectMode;
  overlayMode: RenderOverlayMode;
  renderFrame: (frame: number) => ReturnType<TrailerV3Director["renderFrame"]>;
  resize: (width: number, height: number) => void;
  getWebGLInfo: () => { vendor: string; renderer: string };
}

declare global {
  interface Window {
    __trailerV3?: TrailerV3Harness;
  }
}

async function bootTrailerV3(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const aspectParam = params.get("aspect");
  const modeParam = params.get("mode");
  const aspectMode: AspectMode = aspectParam === "16x9" ? "16x9" : "9x16";
  const overlayMode: RenderOverlayMode = modeParam === "clean" ? "clean" : "burned";

  const width = Number(params.get("w")) || (aspectMode === "9x16" ? 1080 : 1920);
  const height = Number(params.get("h")) || (aspectMode === "9x16" ? 1920 : 1080);

  const app = document.getElementById("trailer-v3-app")!;
  app.style.width = `${width}px`;
  app.style.height = `${height}px`;

  const glCanvas = document.querySelector<HTMLCanvasElement>("#trailer-v3-canvas")!;
  const hudEl = document.getElementById("trailer-v3-hud")!;

  await loadData(() => {});
  await Promise.all([
    document.fonts.load('800 64px "Be Vietnam Pro"'),
    document.fonts.load('700 44px "Be Vietnam Pro"'),
    document.fonts.load('600 28px "Be Vietnam Pro"'),
  ]);

  const circuitColors = DATA.circuits.map((c) => c.color);
  await initWorld(
    glCanvas,
    circuitColors,
    { low: false, reduceLights: false, reduceMotion: false, offline: true },
    DATA.map
  );

  const director = new TrailerV3Director(hudEl, circuitColors, width, height, aspectMode, overlayMode);

  const initialFrame = Number(params.get("frame") ?? 0);
  director.renderFrame(initialFrame);

  window.__trailerV3 = {
    ready: true,
    fps: FPS,
    durationSec: DURATION_SEC,
    totalFrames: TOTAL_FRAMES,
    aspectMode,
    overlayMode,
    renderFrame: (f: number) => director.renderFrame(f),
    resize: (w: number, h: number) => {
      app.style.width = `${w}px`;
      app.style.height = `${h}px`;
      director.resize(w, h);
    },
    getWebGLInfo: () => director.getWebGLInfo(),
  };
}

bootTrailerV3().catch((err) => {
  console.error("Failed to boot Trailer V3:", err);
});
