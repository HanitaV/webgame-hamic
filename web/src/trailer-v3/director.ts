/**
 * Hamic Trailer V3 — Deterministic Frame-Index Director
 * =====================================================
 * Coordinates `offlineContext()` (`world.ts`), `TrailerV3RigSystem`, `fireworkBouquets`,
 * `computeDirectedCamera`, and `TrailerV3Overlay` off a single frame index `n` (0..1769).
 * Guaranteed deterministic: seeking to any frame `n` produces the exact same 3D & UI state.
 */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  offlineContext,
  renderOfflineFrame,
  setLit,
  setOfflineRenderer,
  setStoryTime,
} from "../scene/world";
import { fireworkBouquets } from "../scene/fireworks";
import {
  AspectMode,
  FPS,
  RenderOverlayMode,
  TOTAL_FRAMES,
  findShot,
  rangeProgress,
  storyboardFrame,
} from "./timeline";
import { TrailerV3RigSystem } from "./rigs";
import { computeDirectedCamera } from "./camera";
import { TrailerV3Overlay } from "./overlay";

const ALL_LIT = [true, true, true, true, true, true, true];

export class TrailerV3Director {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly rigs: TrailerV3RigSystem;
  readonly overlay: TrailerV3Overlay;

  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private fireworks: ReturnType<typeof fireworkBouquets>;

  private stageSpot!: THREE.PointLight;
  private husSpot!: THREE.PointLight;
  private usshSpot!: THREE.PointLight;

  constructor(
    hudEl: HTMLElement,
    circuitColors: string[],
    width: number,
    height: number,
    readonly aspectMode: AspectMode = "9x16",
    readonly overlayMode: RenderOverlayMode = "burned"
  ) {
    const ctx = offlineContext();
    this.renderer = ctx.renderer;
    this.scene = ctx.scene;
    this.camera = ctx.camera;

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.45, 0.82);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
    setOfflineRenderer(() => {});

    const palette = circuitColors.map((c) => new THREE.Color(c));
    this.fireworks = fireworkBouquets(new THREE.Vector3(3.5, 0.5, -2.5), palette, "E1", false);
    this.scene.add(this.fireworks.mesh);

    this.rigs = new TrailerV3RigSystem(this.scene);
    this.overlay = new TrailerV3Overlay(hudEl, aspectMode, overlayMode, width, height);

    this.setupCinematicLighting();
  }

  private setupCinematicLighting(): void {
    const keyLight = new THREE.DirectionalLight(0xe2e8f0, 0.85);
    keyLight.position.set(15, 30, 20);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-20, 22, -18);
    this.scene.add(rimLight);

    this.stageSpot = new THREE.PointLight(0xffd25e, 2.5, 18, 1.2);
    this.stageSpot.position.set(2.5, 3.5, 15.2);
    this.scene.add(this.stageSpot);

    this.husSpot = new THREE.PointLight(0x38bdf8, 2.4, 24, 1.2);
    this.husSpot.position.set(10.4, 5.5, 4.7);
    this.scene.add(this.husSpot);

    this.usshSpot = new THREE.PointLight(0xf472b6, 2.4, 24, 1.2);
    this.usshSpot.position.set(-5.1, 5.5, 0.5);
    this.scene.add(this.usshSpot);
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.overlay.syncViewport(width, height);
  }

  getWebGLInfo(): { vendor: string; renderer: string } {
    const gl = this.renderer.getContext();
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: dbg ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR)),
      renderer: dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)),
    };
  }

  /**
   * Render exact frame `frame` (0..1769 at 30fps).
   */
  renderFrame(frame: number) {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frame)));
    const visualFrame = storyboardFrame(clamped);
    const t = visualFrame / FPS;
    const { shot, localProgress } = findShot(visualFrame);

    // 1. Set deep night festival sky (`setStoryTime(6, true)`) & circuit lighting
    setStoryTime(6, true);
    if (t < 6.3) {
      setLit(ALL_LIT);
      this.stageSpot.color.setHex(0xfb7185);
    } else if (t < 13.0) {
      const flicker = Math.floor(t * 4) % 2 === 0;
      setLit([flicker, false, !flicker, false, flicker, false, true]);
      this.stageSpot.color.setHex(0xf43f5e);
    } else if (t < 27.1) {
      const count = Math.min(7, Math.max(1, Math.floor(rangeProgress(t, 13.0, 25.0) * 8)));
      setLit([0, 1, 2, 3, 4, 5, 6].map((i) => i < count));
      this.stageSpot.color.setHex(0xffd25e);
    } else if (t < 33.0) {
      setLit(ALL_LIT);
      const warnPulse = Math.floor(t * 4) % 2 === 0;
      this.stageSpot.color.setHex(warnPulse ? 0xfb7185 : 0xffd25e);
    } else if (t < 43.0) {
      setLit(ALL_LIT);
      this.stageSpot.color.setHex(0x38bdf8);
    } else {
      setLit(ALL_LIT);
      this.stageSpot.color.setHex(0xffd25e);
    }

    // 2. Update deterministic 3D rigs (buildings, shadows, hero drones, stage props, button)
    this.rigs.update(visualFrame);

    // 3. Update GPU shader fireworks deterministically
    const showFireworks =
      (t >= 0.0 && t < 5.6) ||
      (t >= 25.0 && t < 27.1) ||
      (t >= 39.0 && t < 43.0) ||
      (t >= 46.5 && t < 58.1);
    this.fireworks.mesh.visible = showFireworks;
    if (showFireworks) {
      const fwLocal =
        t < 6
          ? t + 1.2
          : t < 28
            ? (t - 24.8) * 1.8
            : t < 44
              ? (t - 38.8) * 1.9
              : ((t - 46.5) % 7.5) + 0.3;
      this.fireworks.update(fwLocal);
    }

    // 4. Compute & apply directed camera pose
    const camPose = computeDirectedCamera(visualFrame, this.aspectMode);
    const cam = this.camera;
    cam.fov = camPose.fov;
    cam.position.copy(camPose.position);
    cam.up.set(0, 1, 0);
    cam.lookAt(camPose.target);
    if (Math.abs(camPose.roll) > 1e-4) {
      cam.rotateZ(camPose.roll);
    }
    cam.updateProjectionMatrix();

    // 5. Step world lights & render post-processed 3D scene
    renderOfflineFrame(1 / FPS);
    this.composer.render();

    // 6. Update frame-locked overlay (word captions, countdown, cards)
    this.overlay.update(visualFrame, clamped);

    return {
      frame: clamped,
      timeSec: Number((clamped / FPS).toFixed(3)),
      storyboardSec: Number(t.toFixed(3)),
      shotId: shot.id,
      section: shot.section,
      shotProgress: Number(localProgress.toFixed(3)),
      aspectMode: this.aspectMode,
      overlayMode: this.overlayMode,
      rigState: { ...this.rigs.state },
      camera: {
        pos: cam.position.toArray().map((v: number) => Number(v.toFixed(2))),
        target: camPose.target.toArray().map((v: number) => Number(v.toFixed(2))),
        fov: cam.fov,
      },
    };
  }
}
