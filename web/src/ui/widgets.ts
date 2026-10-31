/** Reusable controls: slider, stepper, keypad, choice group, and the stage canvas helpers. */

import { sfx } from "../core/audio";
import { t } from "../core/i18n";
import { btn, el } from "./dom";

/** Pill slider: the label and value sit inside the track, the fill shows the value. */
export function slider(opts: {
  label: string; min: number; max: number; step: number; value: number;
  format?: (v: number) => string; onInput: (v: number) => void;
}): { root: HTMLElement; set(v: number): void; get(): number } {
  const root = el("label", { class: "slider" });
  const input = el("input", { type: "range", min: opts.min, max: opts.max, step: opts.step, value: opts.value, "aria-label": opts.label }) as HTMLInputElement;
  const text = el("span", { class: "slider-text" });
  const fmt = opts.format ?? ((v: number) => String(v).replace(".", ","));
  const sync = () => {
    text.textContent = `${opts.label}: ${fmt(Number(input.value))}`;
    const p = (Number(input.value) - opts.min) / (opts.max - opts.min);
    root.style.setProperty("--p", String(p));
  };
  input.addEventListener("input", () => {
    sync();
    opts.onInput(Number(input.value));
  });
  input.addEventListener("change", () => sfx.click());
  sync();
  root.append(input, text);
  return {
    root,
    set(v: number) { input.value = String(v); sync(); },
    get() { return Number(input.value); },
  };
}

/** −/+ stepper with a number in the middle. Tapping the number opens the keypad. */
export function stepper(opts: { label?: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  let v = opts.value;
  const step = opts.step ?? 1;
  const out = el("button", { type: "button", class: "num-field", "aria-label": `${opts.label ?? ""} ${v}`.trim() });
  const set = (n: number) => {
    v = Math.min(opts.max, Math.max(opts.min, n));
    out.textContent = String(v);
    out.setAttribute("aria-label", `${opts.label ?? ""} ${v}`.trim());
    opts.onChange(v);
  };
  out.textContent = String(v);
  out.addEventListener("click", () => keypad({ title: opts.label ?? "", value: v, min: opts.min, max: opts.max, onDone: set }));
  const root = el("span", { class: "stepper" },
    btn("−", () => set(v - step), "small", { "aria-label": t("ui.minus") }),
    out,
    btn("+", () => set(v + step), "small", { "aria-label": t("ui.plus") }),
  );
  if (opts.label) root.prepend(el("span", { class: "stepper-label", text: opts.label }));
  return { root, set, get: () => v };
}

/** On-screen number keypad (works on phones without the system keyboard covering half the game). */
export function keypad(opts: { title: string; value: number | null; min?: number; max?: number; onDone: (v: number) => void }) {
  let text = opts.value === null || Number.isNaN(opts.value) ? "" : String(opts.value);
  const display = el("div", { class: "keypad-display", role: "status" });
  const sync = () => (display.textContent = text || "0");
  sync();
  const layer = el("div", { class: "keypad-layer", role: "dialog", "aria-modal": "true", "aria-label": opts.title || t("ui.keypad") });
  const close = () => { layer.remove(); document.removeEventListener("keydown", onKey); };
  const done = () => {
    const n = Number(text || "0");
    const lo = opts.min ?? -Infinity, hi = opts.max ?? Infinity;
    opts.onDone(Math.min(hi, Math.max(lo, n)));
    close();
  };
  const press = (k: string) => {
    if (k === "⌫") text = text.slice(0, -1);
    else if (k === "−") text = text.startsWith("-") ? text.slice(1) : `-${text}`;
    else if (text.replace("-", "").length < 7) text = text === "0" ? k : text + k;
    sync();
  };
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", (opts.min ?? 0) < 0 ? "−" : "", "0", "⌫"];
  const grid = el("div", { class: "keypad-grid" });
  for (const k of keys) grid.append(k ? btn(k, () => press(k), "key") : el("span"));
  const panel = el("div", { class: "panel keypad" },
    el("div", { class: "keypad-title display", text: opts.title || t("ui.keypad") }),
    display, grid,
    el("div", { class: "keypad-actions" }, btn(t("ui.cancel"), close, "small"), btn(t("ui.ok"), done, "primary small")),
  );
  const onKey = (e: KeyboardEvent) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") press("⌫");
    else if (e.key === "-") press("−");
    else if (e.key === "Enter") done();
    else if (e.key === "Escape") close();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };
  document.addEventListener("keydown", onKey);
  layer.addEventListener("click", (e) => { if (e.target === layer) close(); });
  layer.append(panel);
  document.body.append(layer);
  (grid.querySelector("button") as HTMLButtonElement | null)?.focus();
}

/** A row of choice buttons; returns current index. */
export function choiceGroup(options: string[], onPick: (i: number) => void, label: string) {
  let picked = -1;
  const root = el("div", { class: "choice-group", role: "radiogroup", "aria-label": label });
  const buttons = options.map((o, i) => {
    const b = btn(o, () => {
      picked = i;
      buttons.forEach((x, j) => x.setAttribute("aria-checked", String(j === i)));
      onPick(i);
    }, "choice", { role: "radio", "aria-checked": "false" });
    root.append(b);
    return b;
  });
  return { root, get: () => picked, set(i: number) { buttons[i]?.click(); } };
}

/** A canvas that follows its box and draws at device pixel ratio. */
export function stageCanvas(host: HTMLElement, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = el("canvas", { class: "stage-canvas" }) as HTMLCanvasElement;
  host.append(canvas);
  let w = 0, h = 0;
  const g = canvas.getContext("2d")!;
  const render = () => {
    if (!w || !h) return;
    g.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.imageSmoothingEnabled = true;
    draw(g, w, h);
  };
  const ro = new ResizeObserver(() => {
    const r = host.getBoundingClientRect();
    w = Math.max(1, Math.floor(r.width));
    h = Math.max(1, Math.floor(r.height));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    render();
  });
  ro.observe(host);
  return { canvas, render, size: () => ({ w, h }), destroy: () => ro.disconnect() };
}

/** Shared palette for stage drawings (night sky, glowing lines). */
export const INK = {
  bg: "#0a0d1a",
  grid: "rgba(255,255,255,0.045)",
  axis: "rgba(255,255,255,0.22)",
  text: "#d6dbee",
  dim: "#7a83a3",
  light: "#ffd25e",
  lightB: "#5ad8ff",
  good: "#5eeaa0",
  grey: "#525a78",
  target: "#ff9f5a",
};

let glowOn = true;
/** Glow is part of the light theme; "Giảm hiệu ứng ánh sáng" turns it off. */
export function setGlow(on: boolean) { glowOn = on; }

function withGlow(g: CanvasRenderingContext2D, color: string, blur: number, draw: () => void) {
  g.save();
  if (glowOn && blur > 0) { g.shadowColor = color; g.shadowBlur = blur; }
  draw();
  g.restore();
}

/** Text on the stage (Be Vietnam Pro). Kept under the old name for call sites. */
export function pixelText(g: CanvasRenderingContext2D, text: string, x: number, y: number, color = INK.text, size = 14, align: CanvasTextAlign = "left", weight = 500) {
  g.font = `${weight} ${Math.round(size * 0.86)}px "Be Vietnam Pro", system-ui, sans-serif`;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(text, x, y);
}
export const stageText = pixelText;

/** Background with a faint dot grid. */
export function gridBg(g: CanvasRenderingContext2D, w: number, h: number, cell = 28) {
  g.fillStyle = INK.bg;
  g.fillRect(0, 0, w, h);
  if (cell >= 1000) return;
  g.fillStyle = INK.grid;
  for (let x = cell / 2; x < w; x += cell) for (let y = cell / 2; y < h; y += cell) { g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fill(); }
}

export function polyline(g: CanvasRenderingContext2D, pts: [number, number][], color: string, width = 3, glow = 12, dash?: number[]) {
  if (pts.length < 2) return;
  withGlow(g, color, glow, () => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineCap = "round";
    g.lineJoin = "round";
    if (dash) g.setLineDash(dash);
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
    g.stroke();
  });
}

export function dot(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, glow = 14, ring?: string) {
  withGlow(g, color, glow, () => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  });
  if (ring) { g.strokeStyle = ring; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); }
}

export function ring(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width = 2) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
}

export function arrow(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, width = 3, glow = 12) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = Math.max(9, width * 3.2);
  withGlow(g, color, glow, () => {
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = width;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1 - Math.cos(a) * head * 0.6, y1 - Math.sin(a) * head * 0.6);
    g.stroke();
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x1 - Math.cos(a - 0.45) * head, y1 - Math.sin(a - 0.45) * head);
    g.lineTo(x1 - Math.cos(a + 0.45) * head, y1 - Math.sin(a + 0.45) * head);
    g.closePath();
    g.fill();
  });
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, glow = 0) {
  withGlow(g, fill ?? stroke ?? "#fff", glow, () => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); }
  });
}
