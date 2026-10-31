/** One screen at a time over the 3D sandbox; Esc / "Quay lại" pops the history. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Params = Record<string, any>;
export type Screen = (root: HTMLElement, params: Params) => (() => void) | void;

const screens = new Map<string, Screen>();
const history: { name: string; params: Params }[] = [];
let cleanup: (() => void) | void;
let host: HTMLElement;
const listeners = new Set<(name: string) => void>();

export function initRouter(root: HTMLElement) { host = root; }
export function register(name: string, s: Screen) { screens.set(name, s); }
export function onNavigate(fn: (name: string) => void) { listeners.add(fn); }

function show(name: string, params: Params) {
  if (typeof cleanup === "function") cleanup();
  host.replaceChildren();
  host.dataset.screen = name;
  document.body.dataset.screen = name;
  const s = screens.get(name);
  if (!s) throw new Error(`screen ${name}`);
  cleanup = s(host, params);
  for (const l of listeners) l(name);
  // focus the first control so keyboards and gamepads land somewhere (game-ui-ux)
  requestAnimationFrame(() => (host.querySelector<HTMLElement>("[data-autofocus]") ?? host.querySelector<HTMLElement>("button:not([disabled])"))?.focus({ preventScroll: true }));
}

export function go(name: string, params: Params = {}, replace = false) {
  if (replace) history.pop();
  history.push({ name, params });
  show(name, params);
}

export function back(fallback = "title") {
  history.pop();
  const prev = history[history.length - 1];
  if (prev) show(prev.name, prev.params);
  else go(fallback);
}

export function reset(name: string, params: Params = {}) {
  history.length = 0;
  go(name, params);
}

export function current() { return history[history.length - 1]?.name ?? ""; }
