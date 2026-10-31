/** Authoring & offline GPU render entry for the 59-second Hamic trailer. */
import "@fontsource/be-vietnam-pro/vietnamese-800.css";
import "@fontsource/be-vietnam-pro/latin-800.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import { DATA, loadData } from "../core/data";
import { initWorld } from "../scene/world";
import { createTrailerDirector } from "./director";

await loadData(() => {});
await Promise.all([
  document.fonts.load('800 64px "Be Vietnam Pro"'),
  document.fonts.load('700 44px "Be Vietnam Pro"'),
  document.fonts.load('600 28px "Be Vietnam Pro"'),
]);

const glCanvas = document.querySelector<HTMLCanvasElement>("#gl-canvas")!;
const masterCanvas = document.querySelector<HTMLCanvasElement>("#master-canvas")!;

await initWorld(
  glCanvas,
  DATA.circuits.map((c) => c.color),
  { low: false, reduceLights: false, reduceMotion: false, offline: true },
  DATA.map,
);

const director = await createTrailerDirector(
  glCanvas,
  masterCanvas,
  DATA.map,
  DATA.circuits.map((c) => c.color),
  import.meta.env.BASE_URL,
);

director.renderFrame(0, 0.95);
Object.assign(window, { __trailer: director });
