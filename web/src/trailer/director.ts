import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import type { MapData } from "../core/data";
import { offlineContext, renderOfflineFrame, setOfflineRenderer, worldDiagnostics } from "../scene/world";
import { applyCameraPose, evaluateTrailerCamera } from "./camera";
import { TrailerHudRenderer } from "./hud";
import { createTrailerSceneController } from "./shots";
import { TRAILER_DURATION, TRAILER_FPS, TRAILER_TOTAL_FRAMES } from "./timeline";

export interface TrailerDirector {
  gpu: string;
  fps: number;
  duration: number;
  totalFrames: number;
  diagnostics: typeof worldDiagnostics;
  setResolution(width: number, height: number): void;
  renderTime(t: number, jpegQuality?: number): string;
  renderFrame(frameIndex: number, jpegQuality?: number): string;
}

export async function createTrailerDirector(
  glCanvas: HTMLCanvasElement,
  masterCanvas: HTMLCanvasElement,
  map: MapData,
  circuitColors: string[],
  baseUrl: string,
): Promise<TrailerDirector> {
  const { renderer, scene, camera } = offlineContext();
  let width = masterCanvas.width || 1920;
  let height = masterCanvas.height || 1080;

  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.44, 0.45, 0.82);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  setOfflineRenderer(() => {});

  const hudCanvas = document.createElement("canvas");
  hudCanvas.width = width;
  hudCanvas.height = height;
  const hudCtx = hudCanvas.getContext("2d")!;
  const masterCtx = masterCanvas.getContext("2d", { alpha: false })!;

  const sceneController = createTrailerSceneController(scene, map, circuitColors);
  const hud = new TrailerHudRenderer();
  await hud.init(baseUrl);

  const gl = renderer.getContext();
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));

  function setResolution(w: number, h: number) {
    width = w;
    height = h;
    glCanvas.width = w;
    glCanvas.height = h;
    masterCanvas.width = w;
    masterCanvas.height = h;
    hudCanvas.width = w;
    hudCanvas.height = h;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function renderAtTime(t: number) {
    const clampedT = Math.max(0, Math.min(TRAILER_DURATION, t));
    renderOfflineFrame(clampedT, 1 / TRAILER_FPS);

    // Dual-pass split-screen during Scene 10 comparison window (55.65s -> 57.65s)
    if (clampedT >= 55.65 && clampedT < 57.65) {
      const halfW = Math.floor(width / 2);

      // Left half: Festive night show (E1 + E3 + E4)
      sceneController.update(clampedT, "festive");
      applyCameraPose(camera, evaluateTrailerCamera(clampedT, "left"));
      composer.render(1 / TRAILER_FPS);
      masterCtx.drawImage(glCanvas, 0, 0, halfW, height, 0, 0, halfW, height);

      // Right half: Launchpad E2 (HUS & USSH floating in the sky)
      sceneController.update(clampedT, "launch");
      applyCameraPose(camera, evaluateTrailerCamera(clampedT, "right"));
      composer.render(1 / TRAILER_FPS);
      masterCtx.drawImage(glCanvas, halfW, 0, width - halfW, height, halfW, 0, width - halfW, height);
    } else {
      sceneController.update(clampedT, "normal");
      applyCameraPose(camera, evaluateTrailerCamera(clampedT));
      composer.render(1 / TRAILER_FPS);
      masterCtx.drawImage(glCanvas, 0, 0, width, height);
    }

    hud.draw(hudCtx, width, height, clampedT);
    masterCtx.drawImage(hudCanvas, 0, 0, width, height);
  }

  return {
    gpu,
    fps: TRAILER_FPS,
    duration: TRAILER_DURATION,
    totalFrames: TRAILER_TOTAL_FRAMES,
    diagnostics: worldDiagnostics,
    setResolution,
    renderTime(t: number, jpegQuality = 0.96): string {
      renderAtTime(t);
      return masterCanvas.toDataURL("image/jpeg", jpegQuality).split(",")[1];
    },
    renderFrame(frameIndex: number, jpegQuality = 0.96): string {
      const t = frameIndex / TRAILER_FPS;
      renderAtTime(t);
      return masterCanvas.toDataURL("image/jpeg", jpegQuality).split(",")[1];
    },
  };
}
