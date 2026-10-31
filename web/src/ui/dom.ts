/** DOM helpers, the line-icon set, stars, Tia and the circuit lamp. */

import { sfx } from "../core/audio";

type Attrs = Record<string, string | number | boolean | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === "text") n.textContent = String(v);
    else if (k === "html") n.innerHTML = String(v);
    else n.setAttribute(k, v === true ? "" : String(v));
  }
  for (const k of kids) if (k !== null && k !== undefined && k !== false) n.append(k);
  return n;
}

/** Button. variant: "" | "primary" | "ghost" | "danger" | "small" | "big" | "wide" | "tiny" … */
export function btn(label: string | Node, onClick: () => void, variant = "", attrs: Attrs = {}, iconName?: IconName): HTMLButtonElement {
  const b = el("button", { type: "button", class: `btn ${variant}`.trim(), ...attrs });
  if (iconName) b.append(icon(iconName));
  if (typeof label === "string") b.append(el("span", { text: label }));
  else b.append(label);
  b.addEventListener("click", () => {
    sfx.click();
    onClick();
  });
  return b;
}

export function $(sel: string, root: ParentNode = document): HTMLElement {
  const n = root.querySelector<HTMLElement>(sel);
  if (!n) throw new Error(`missing ${sel}`);
  return n;
}

const SVGNS = "http://www.w3.org/2000/svg";

function svg(viewBox: string, cls: string, inner: string, size?: number) {
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", viewBox);
  s.setAttribute("class", cls);
  s.setAttribute("aria-hidden", "true");
  if (size) { s.setAttribute("width", String(size)); s.setAttribute("height", String(size)); }
  s.innerHTML = inner;
  return s;
}

/* ---------- icons (24×24, 1.75 stroke) ---------- */

const ICONS = {
  pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 17c6 0 2-10 8-10"/>',
  stroll: '<path d="M4 18c3-6 6-6 8-2s5 4 8-2"/><circle cx="12" cy="7" r="2.2"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
  flask: '<path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2l-5.5-9.5v-6"/><path d="M7.5 15h9"/>',
  book: '<path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h9"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  share: '<circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8.1 11l7.3-3.9M8.1 13l7.3 3.9"/>',
  guest: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  trash: '<path d="M5 7h14M10 4h4M7 7l1 13h8l1-13"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
  tree: '<path d="M12 21v-5"/><path d="M12 3c-3.5 0-6 2.6-6 5.6 0 1.2.4 2.2 1 3-.6.6-1 1.5-1 2.4 0 2 1.8 3 4 3h4c2.2 0 4-1 4-3 0-.9-.4-1.8-1-2.4.6-.8 1-1.8 1-3C18 5.6 15.5 3 12 3z"/>',
  board: '<rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M7 9.5h4M7 12.5h6M14.5 9l2 2-2 2M9 20l3-4 3 4"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  chat: '<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/>',
  lamp: '<path d="M12 21v-9M9 21h6"/><circle cx="12" cy="8" r="3.5"/><path d="M12 2.5v1.5M6.5 8H5M19 8h-1.5M8 4l1 1M16 4l-1 1"/>',
  file: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5"/>',
  hamic: '<path d="M12 4.2v7.6" stroke-width="2.4"/><path d="M8.1 7.1a7.4 7.4 0 0 0-3.5 6.7"/><path d="M15.9 7.1a7.4 7.4 0 0 1 3.5 6.7"/><path d="M7.6 18.1a7.4 7.4 0 0 0 8.8 0"/>',
} as const;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName, size = 20): SVGSVGElement {
  return svg("0 0 24 24", "icon", ICONS[name], size);
}

/* ---------- stars, Tia, lamps ---------- */

const STAR_PATH = "M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.9 6.2 20.1l1.4-6.4L2.7 9.3l6.5-.7z";

/** Filled vs outlined carries the meaning, not colour alone (GDD 9.2). */
export function star(on: boolean, size = 22): SVGSVGElement {
  return svg("0 0 24 24", `star-ic ${on ? "on" : "off"}`, `<path d="${STAR_PATH}"/>`, size);
}

export function starRow(stars: boolean[], size = 22, count = 3): HTMLElement {
  const wrap = el("span", { class: "star-row", role: "img", "aria-label": `${stars.filter(Boolean).length}/${count} sao` });
  for (let i = 0; i < count; i += 1) wrap.append(star(Boolean(stars[i]), size));
  return wrap;
}

let tiaId = 0;
/** Tia: a soft light orb with two eyes, no human shape (GDD 2.1, 11.1). */
export function tia(size = 40, mood: "calm" | "happy" = "calm"): SVGSVGElement {
  const id = `tia${(tiaId += 1)}`;
  const eyes = mood === "happy"
    ? '<path d="M15 23q2.5-3 5 0M28 23q2.5-3 5 0" stroke="#3a2a00" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    : '<ellipse cx="18" cy="23" rx="2.2" ry="3" fill="#3a2a00"/><ellipse cx="30" cy="23" rx="2.2" ry="3" fill="#3a2a00"/>';
  return svg("0 0 48 48", "tia", `
    <defs><radialGradient id="${id}" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffd76a"/><stop offset="1" stop-color="#ff9f3a"/></radialGradient></defs>
    <circle cx="24" cy="24" r="20" fill="url(#${id})"/>
    <circle cx="17" cy="15" r="4" fill="#fff" opacity=".7"/>${eyes}`, size);
}

/** Round lamp for a circuit: dim glass when off, glowing in its colour when lit. */
export function lamp(color: string, lit: boolean, size = 32): HTMLElement {
  const b = el("span", { class: `lamp${lit ? " lit" : ""}`, "aria-hidden": "true" });
  b.style.setProperty("--c", color);
  b.style.width = b.style.height = `${size}px`;
  return b;
}

/** Kept for older call sites. */
export const blockIcon = lamp;

/** Official HAMIC club emblem ("mark" = circular badge, "lockup" = badge + HAMIC wordmark). */
export function hamicLogo(variant: "mark" | "lockup" = "mark", size = 36, alt = ""): HTMLImageElement {
  const w = variant === "lockup" ? Math.round(size * (448 / 512)) : size;
  return el("img", {
    class: `hamic-img hamic-${variant}`,
    src: `${import.meta.env.BASE_URL}assets/hamic-${variant === "lockup" ? "logo" : "mark"}.png`,
    width: w,
    height: size,
    alt,
    decoding: "async",
    draggable: "false",
    "aria-hidden": alt ? undefined : "true",
  });
}

/** Three core symbols inside the HAMIC emblem: Mathematics (A+), Informatics power (⏻), Applied Math ($). */
export function hamicSigns(ariaLabel?: string): HTMLElement {
  const attrs: Attrs = ariaLabel ? { class: "hamic-signs", role: "img", "aria-label": ariaLabel } : { class: "hamic-signs", "aria-hidden": "true" };
  return el("span", attrs,
    el("i", { class: "hamic-sign hamic-sign-a", "aria-hidden": "true" }, "A", el("sup", { text: "+" })),
    el("i", { class: "hamic-sign hamic-sign-pwr", "aria-hidden": "true" }, icon("hamic", 13)),
    el("i", { class: "hamic-sign hamic-sign-dlr", "aria-hidden": "true", text: "$" }),
  );
}

/** 8-bit ASCII binary of "HAMIC" from the outer ring of the club emblem, alternating amber & crimson. */
export function hamicBinary(tip?: string): HTMLElement {
  return el("span", { class: "hamic-binary", title: tip, "aria-hidden": "true" },
    el("span", { text: "01001000" }),
    el("b", { text: "01000001" }),
    el("span", { text: "01001101" }),
    el("b", { text: "01001001" }),
    el("span", { text: "01000011" }),
  );
}

/** Compact HAMIC club badge for screen topbars. */
export function hamicChip(): HTMLElement {
  return el("span", { class: "hamic-chip", "aria-hidden": "true" },
    hamicLogo("mark", 22),
    el("b", { text: "HAMIC" }),
    hamicSigns(),
  );
}

export function clear(node: HTMLElement) {
  node.replaceChildren();
}

export interface SlideDock {
  root: HTMLElement;
  toggle: HTMLButtonElement;
  collapsed: () => boolean;
  setCollapsed: (v: boolean) => void;
}

/** Khung trượt ngang kèm nút mũi tên trái/phải để thu gọn hoặc mở rộng các bảng công cụ. */
export function slideDock(
  side: "left" | "right",
  id: string,
  panel: HTMLElement,
  labels: { hide: string; show: string },
  opts?: { tag?: keyof HTMLElementTagNameMap; extraClass?: string; clipped?: boolean; onToggle?: (collapsed: boolean) => void },
): SlideDock {
  let isCollapsed = false;
  panel.classList.add("slide-body");
  const toggle = el(
    "button",
    {
      type: "button",
      class: `btn tiny slide-toggle slide-toggle-${side}`,
      "data-slide-toggle": id,
      "aria-expanded": "true",
      "aria-label": labels.hide,
      title: labels.hide,
    },
    icon(side === "left" ? "back" : "next", 16),
  );
  const children = side === "left" ? [panel, toggle] : [toggle, panel];
  const track = opts?.clipped ? el("div", { class: `slide-track slide-track-${side}` }, ...children) : null;
  const root = el(
    opts?.tag ?? "div",
    { class: `slide-dock slide-dock-${side} slide-dock-${id}${opts?.clipped ? " slide-dock-clipped" : ""}${opts?.extraClass ? ` ${opts.extraClass}` : ""}` },
    ...(track ? [track] : children),
  );
  const setCollapsed = (v: boolean) => {
    isCollapsed = v;
    root.classList.toggle("is-collapsed", isCollapsed);
    panel.inert = isCollapsed;
    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    const lbl = isCollapsed ? labels.show : labels.hide;
    toggle.setAttribute("aria-label", lbl);
    toggle.setAttribute("title", lbl);
    opts?.onToggle?.(isCollapsed);
  };
  toggle.addEventListener("pointerdown", (e) => e.stopPropagation());
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.click();
    setCollapsed(!isCollapsed);
  });
  return { root, toggle, collapsed: () => isCollapsed, setCollapsed };
}
