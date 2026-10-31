/** Toasts (Minecraft "advancement" style), modal panels and the Tia speech line. */

import { t } from "../core/i18n";
import { reducedMotion } from "../game/settings";
import { btn, el, tia } from "./dom";

let toastHost: HTMLElement;

export function initOverlay() {
  toastHost = el("div", { class: "toasts", "aria-live": "polite" });
  document.body.append(toastHost);
}

export function toast(title: string, text: string, kind: "achievement" | "info" = "info") {
  const item = el("div", { class: `toast ${kind}` },
    kind === "achievement" ? el("span", { class: "toast-icon", "aria-hidden": "true" }) : tia(28, "happy"),
    el("div", {}, el("b", { text: title }), el("span", { text })));
  toastHost.append(item);
  while (toastHost.children.length > 3) toastHost.firstElementChild!.remove();
  window.setTimeout(() => {
    item.classList.add("out");
    window.setTimeout(() => item.remove(), reducedMotion() ? 0 : 300);
  }, 4000);
}

/** Modal panel with focus kept inside; Esc closes unless `locked`. */
export function modal(opts: { title: string; body: (Node | string)[]; actions: HTMLElement[]; locked?: boolean; wide?: boolean; onClose?: () => void }) {
  const layer = el("div", { class: "modal-layer" });
  const panel = el("div", { class: `panel modal${opts.wide ? " wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": opts.title },
    el("h2", { class: "display", text: opts.title }),
    el("div", { class: "modal-body" }, ...opts.body),
    el("div", { class: "modal-actions" }, ...opts.actions));
  layer.append(panel);
  const before = document.activeElement as HTMLElement | null;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !opts.locked) { e.preventDefault(); e.stopPropagation(); close(); }
    if (e.key === "Tab") {
      const f = [...panel.querySelectorAll<HTMLElement>("button:not([disabled]), input, a[href], textarea")];
      if (!f.length) return;
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  };
  function close() {
    document.removeEventListener("keydown", onKey, true);
    layer.remove();
    before?.focus?.();
    opts.onClose?.();
  }
  document.addEventListener("keydown", onKey, true);
  document.body.append(layer);
  requestAnimationFrame(() => (panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelector<HTMLElement>(".modal-actions button"))?.focus());
  return close;
}

export function confirmBox(title: string, text: string, yes: string, onYes: () => void) {
  const close = modal({
    title,
    body: [el("p", { text })],
    actions: [btn(t("ui.keep"), () => close(), "", { "data-autofocus": true }), btn(yes, () => { close(); onYes(); }, "danger")],
  });
}

/** Tia's line under the sandbox. */
export function tiaLine(text: string, mood: "calm" | "happy" = "calm") {
  return el("div", { class: "tia-line", role: "status" }, tia(30, mood), el("span", { text }));
}
