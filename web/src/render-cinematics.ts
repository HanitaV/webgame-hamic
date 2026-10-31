/** Authoring entry only. Vite serves this page locally; the shipping app never imports it. */
import "@fontsource/be-vietnam-pro/vietnamese-800.css";
import "@fontsource/be-vietnam-pro/latin-800.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { DATA, loadData } from "./core/data";
import { initWorld, offlineContext, setOfflineRenderer, renderOfflineFrame, setLit, setStoryTime, playShow, endShow, worldDiagnostics } from "./scene/world";
import type { EndingId } from "./puzzles/logic/story";

await loadData(() => {});
await Promise.all([document.fonts.load('800 64px "Be Vietnam Pro"'), document.fonts.load('700 44px "Be Vietnam Pro"')]);
const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
await initWorld(canvas, DATA.circuits.map(c => c.color), { low: false, reduceLights: false, reduceMotion: false, offline: true }, DATA.map);
const { renderer, scene, camera } = offlineContext();
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight, false);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), .46, .48, .8));
composer.addPass(new OutputPass());
setOfflineRenderer(() => composer.render(1 / 30));
const gl = renderer.getContext();
const info = gl.getExtension("WEBGL_debug_renderer_info");
Object.assign(window, { __cinema: {
  diagnostics: worldDiagnostics,
  gpu: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
  start(id: EndingId) {
    endShow();
    setStoryTime(6, true);
    setLit([true, true, true, true, true, true, true]);
    void playShow(7, DATA.circuits.map(c => c.color), { id, variant: id === "E2" ? "version" : null });
    renderOfflineFrame(0, 0);
  },
  frame(time: number) {
    renderOfflineFrame(time, 1 / 30);
    return canvas.toDataURL("image/jpeg", .97).split(",")[1];
  },
} });
