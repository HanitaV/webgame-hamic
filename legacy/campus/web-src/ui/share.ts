/**
 * Sharing: the invite text, the link, and a screenshot of the 3D view.
 * Uses the Web Share API where the browser has it, the clipboard otherwise, and a download for
 * the picture. Nothing is uploaded anywhere.
 */

import { GAME } from "../config";
import { formatDuration, t } from "../i18n";
import { progress } from "./achievements";

export function shareUrl(): string {
  if (GAME.shareUrl) return GAME.shareUrl;
  const { origin, pathname } = window.location;
  return origin === "null" ? window.location.href : `${origin}${pathname}`;
}

export function shareText(): string {
  const best = progress.get().bestRunSeconds;
  return best === null ? t("share.textPlay") : t("share.textWon", { time: formatDuration(best) });
}

export function canNativeShare(): boolean {
  return typeof navigator.share === "function";
}

export async function nativeShare(file?: Blob): Promise<boolean> {
  if (!canNativeShare()) return false;
  const data: ShareData = { title: GAME.title, text: shareText(), url: shareUrl() };
  if (file) {
    const shot = new File([file], "ussh-hus.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [shot] })) data.files = [shot];
  }
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

export async function copyInvite(): Promise<boolean> {
  const text = `${shareText()} ${shareUrl()}`;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Grab the canvas. `render` must draw a fresh frame first: the WebGL buffer is cleared after it
 * is shown, so the frame and the read have to happen in the same task.
 */
export function captureCanvas(canvas: HTMLCanvasElement, render: () => void): Promise<Blob | null> {
  render();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function shotName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `ussh-hus-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.png`;
}
