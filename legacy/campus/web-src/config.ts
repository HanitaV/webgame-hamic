/**
 * Static game configuration. Values here are decided at build time and never saved;
 * anything the player can change lives in `ui/settings.ts`.
 */

declare const __APP_VERSION__: string;

const params = new URLSearchParams(window.location.search);

export const GAME = {
  id: "ussh-hus",
  title: "USSH × HUS",
  place: "334–336 Nguyễn Trãi, Hà Nội",
  version: typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev",
  /** Shown on the title screen and in About. Change or empty it to hide. */
  publisher: "CLB Toán Tin HAMIC",
  /** Link used by Share. Null means the address the game is opened at, without query or hash. */
  shareUrl: null as string | null,
} as const;

/** Feature switches. Turn a feature off here and its menu entries disappear. */
export const FLAGS = {
  achievements: true,
  share: true,
  /** Debug tools (collider boxes, self-test notes). On in `npm run dev` or with `?debug` in the URL. */
  debug: import.meta.env.DEV || params.has("debug"),
  /** Skip the title screen, for capture scripts: `?play=walk|orbit|cine`. */
  autostart: (params.get("play") ?? "") as "" | "walk" | "orbit" | "cine",
} as const;

/** localStorage keys. Bump the schema version in the store, not the key, when the shape changes. */
export const STORAGE = {
  settings: "ussh-hus:settings",
  progress: "ussh-hus:progress",
} as const;

/** Rules of the deadline run. */
export const RUN = {
  /** A run faster than this unlocks the speed achievement. */
  fastSeconds: 120,
} as const;

/** Night for the night-walk achievement: from `start` to `end` hours, wrapping midnight. */
export const NIGHT = { start: 19, end: 5 } as const;

export type Action =
  | "forward" | "back" | "left" | "right"
  | "jump" | "floorUp" | "floorDown"
  | "pause" | "toggleUi" | "modeWalk" | "modeOrbit" | "modeCine";

/**
 * Default key bindings as KeyboardEvent.code values. The player's overrides are stored in
 * settings (`bindings`), so a rebinding screen only has to write there.
 */
export const DEFAULT_BINDINGS: Record<Action, string[]> = {
  forward: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  jump: ["Space"],
  floorUp: ["KeyE", "PageUp"],
  floorDown: ["KeyQ", "PageDown"],
  pause: ["Escape", "KeyP"],
  toggleUi: ["KeyH"],
  modeWalk: ["Digit1"],
  modeOrbit: ["Digit2"],
  modeCine: ["Digit3"],
};
