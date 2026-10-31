/**
 * Mobile is landscape-only. On a touch phone held upright, a full-screen "xoay ngang" cover blocks
 * the game (CSS does the showing). On the first tap we also ask the browser for fullscreen and a
 * landscape lock where it allows it (Android Chrome); iOS ignores the lock, so the cover stays the rule.
 */

import { t } from "../core/i18n";
import { el, hamicLogo, hamicSigns } from "./dom";

export function isTouchPhone() {
  return window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 820;
}

export function installRotateCover() {
  const cover = el("div", { class: "rotate-cover", role: "alertdialog", "aria-live": "assertive" },
    hamicLogo("lockup", 84, t("hamic.logoAlt")),
    hamicSigns(t("hamic.signsAria")),
    el("div", { class: "rotate-phone", "aria-hidden": "true" }),
    el("p", { class: "display", text: t("rotate.title") }),
    el("p", { text: t("rotate.text") }));
  document.body.append(cover);
}

let asked = false;

/** Call from a user gesture (e.g. the first button tap). */
export async function requestLandscape() {
  if (asked || !isTouchPhone()) return;
  asked = true;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await o.lock?.("landscape");
  } catch {
    /* not supported (iOS Safari): the rotate cover handles it */
  }
}
