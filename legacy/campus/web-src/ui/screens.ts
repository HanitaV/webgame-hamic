/**
 * Screen stack over native <dialog> elements. `push` opens a screen on top (pause → settings),
 * `pop` closes the top one, Esc closes the top one (the dialog's own cancel), and focus returns
 * to whatever opened it. Game input listens to `onChange` and stops while anything is open.
 */

import { reducedMotion } from "./settings";

export type ScreenId = "pause" | "settings" | "achievements" | "share" | "howto" | "about" | "confirm";

interface Entry {
  dialog: HTMLDialogElement;
  onOpen?: () => void;
  onClose?: () => void;
}

class ScreenStack {
  private screens = new Map<ScreenId, Entry>();
  private stack: ScreenId[] = [];
  private listeners = new Set<(top: ScreenId | null) => void>();

  register(id: ScreenId, entry: Entry) {
    this.screens.set(id, entry);
    const { dialog } = entry;
    dialog.addEventListener("close", () => {
      const i = this.stack.lastIndexOf(id);
      if (i >= 0) this.stack.splice(i, 1);
      entry.onClose?.();
      this.changed();
    });
    // Click on the backdrop (outside the sheet) closes it, like Esc.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog && id !== "confirm") this.close(id);
    });
    for (const closer of dialog.querySelectorAll<HTMLElement>("[data-close]")) {
      closer.addEventListener("click", () => this.close(id));
    }
  }

  push(id: ScreenId) {
    const entry = this.screens.get(id);
    if (!entry || entry.dialog.open) return;
    entry.onOpen?.();
    entry.dialog.classList.toggle("still", reducedMotion());
    entry.dialog.showModal();
    this.stack.push(id);
    const first = entry.dialog.querySelector<HTMLElement>("[data-autofocus]:not([hidden])");
    first?.focus();
    this.changed();
  }

  close(id: ScreenId) {
    const entry = this.screens.get(id);
    if (entry?.dialog.open) entry.dialog.close();
  }

  pop() {
    const top = this.top();
    if (top) this.close(top);
  }

  closeAll() {
    for (const id of [...this.stack].reverse()) this.close(id);
  }

  top(): ScreenId | null {
    return this.stack.at(-1) ?? null;
  }

  isOpen() {
    return this.stack.length > 0;
  }

  onChange(listener: (top: ScreenId | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed() {
    for (const listener of [...this.listeners]) listener(this.top());
  }
}

export const screens = new ScreenStack();

/** Ask before something that cannot be undone. The question names what will be lost. */
export function confirmAction(question: string, yesLabel: string, noLabel: string, onYes: () => void) {
  const dialog = document.querySelector<HTMLDialogElement>("#scr-confirm")!;
  dialog.querySelector("#confirm-text")!.textContent = question;
  const yes = dialog.querySelector<HTMLButtonElement>("#confirm-yes")!;
  const no = dialog.querySelector<HTMLButtonElement>("#confirm-no")!;
  yes.textContent = yesLabel;
  no.textContent = noLabel;
  yes.onclick = () => {
    screens.close("confirm");
    onYes();
  };
  no.onclick = () => screens.close("confirm");
  screens.push("confirm");
}
