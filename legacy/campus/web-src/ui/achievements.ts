/**
 * Achievements: a registry of definitions, a saved progress record, and rules that listen to game
 * events. To add one:
 *   1. add a definition to `ACHIEVEMENTS` (give it `target` if it counts up);
 *   2. in `wireAchievements`, call `unlock(id)` or `advance(id, n)` from the event that earns it.
 * The screen, the toast and the share text pick it up on their own.
 */

import { NIGHT, RUN, STORAGE } from "../config";
import { bus, type Mode } from "../core/events";
import { Store } from "../core/storage";
import { formatDuration, t } from "../i18n";
import { button, el, icon } from "./dom";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  /** Hidden achievements show "?" until unlocked. */
  hidden?: boolean;
  /** For counting achievements: the number that unlocks it. */
  target?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-paper", title: "Tờ đầu tiên", description: "Nhặt một tờ deadline." },
  { id: "all-papers", title: "Đủ bộ", description: "Cầm đủ ba tờ deadline trong một ván." },
  { id: "delivered", title: "Nộp đúng hạn", description: "Mang đủ ba tờ ra cổng USSH hoặc cổng HUS." },
  { id: "fast-run", title: "Chạy deadline", description: `Nộp đủ ba tờ trong dưới ${RUN.fastSeconds / 60} phút.` },
  { id: "t5-top", title: "Tầng 7 nhà T5", description: "Leo cầu thang lên tầng cao nhất của T5." },
  { id: "explorer", title: "Đi khắp HUS", description: "Bước vào mọi nhà HUS mở cửa.", target: 7 },
  { id: "night-walk", title: "Sân lúc tối", description: "Đi bộ trong sân sau 19 giờ.", hidden: true },
  { id: "director", title: "Xem hết quay cảnh", description: "Xem đoạn quay cảnh tới giây cuối." },
];

export interface Progress {
  /** Unlock time (ms) per achievement id. */
  unlocked: Record<string, number>;
  /** Counter per counting achievement. */
  counters: Record<string, number>;
  /** Building groups visited, for the explorer counter. */
  visited: string[];
  bestRunSeconds: number | null;
  runsCompleted: number;
}

export const progress = new Store<Progress>({
  key: STORAGE.progress,
  version: 1,
  defaults: () => ({ unlocked: {}, counters: {}, visited: [], bestRunSeconds: null, runsCompleted: 0 }),
});

const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function isUnlocked(id: string) {
  return id in progress.get().unlocked;
}

export function unlockedCount() {
  return ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).length;
}

/** Override a counting target once the real number is known (e.g. open buildings in the data). */
export function setTarget(id: string, target: number) {
  const def = byId.get(id);
  if (def && target > 0) def.target = target;
}

export function unlock(id: string) {
  if (!byId.has(id) || isUnlocked(id)) return;
  progress.set({ unlocked: { ...progress.get().unlocked, [id]: Date.now() } });
  progress.flush();
  bus.emit("achievement", { id });
  const def = byId.get(id)!;
  bus.emit("toast", { text: def.title, detail: t("ach.unlocked"), kind: "achievement" });
}

export function advance(id: string, value: number) {
  const def = byId.get(id);
  if (!def || isUnlocked(id)) return;
  const counters = progress.get().counters;
  if ((counters[id] ?? 0) >= value) return;
  progress.set({ counters: { ...counters, [id]: value } });
  if (def.target !== undefined && value >= def.target) unlock(id);
}

/** Connect the rules to game events. Call once. */
export function wireAchievements() {
  let mode: Mode = "orbit";
  let hour = 9;
  const isNight = (h: number) => h >= NIGHT.start || h < NIGHT.end;
  const checkNight = () => {
    if (mode === "walk" && isNight(hour)) unlock("night-walk");
  };

  bus.on("mode", (e) => {
    mode = e.mode;
    checkNight();
  });
  bus.on("hour", (e) => {
    hour = e.hour;
    checkNight();
  });
  bus.on("deadline", (e) => {
    if (e.collected >= 1) unlock("first-paper");
    if (e.collected >= e.total) unlock("all-papers");
  });
  bus.on("won", (e) => {
    unlock("delivered");
    if (e.seconds < RUN.fastSeconds) unlock("fast-run");
    const best = progress.get().bestRunSeconds;
    progress.set({
      runsCompleted: progress.get().runsCompleted + 1,
      bestRunSeconds: best === null ? e.seconds : Math.min(best, e.seconds),
    });
  });
  bus.on("place", (e) => {
    if (!e.group) return;
    if (e.group === "T5" && e.level >= 7) unlock("t5-top");
    const visited = progress.get().visited;
    if (!visited.includes(e.group)) {
      const next = [...visited, e.group];
      progress.set({ visited: next });
      advance("explorer", next.length);
    }
  });
  bus.on("cineEnd", () => unlock("director"));
}

/** Draw the achievements screen body into `host`. Re-run to refresh. */
export function renderAchievements(host: HTMLElement, confirmReset: (onYes: () => void) => void) {
  host.replaceChildren();
  const list = el("ol", { class: "ach-list" });
  const p = progress.get();
  for (const def of ACHIEVEMENTS) {
    const done = isUnlocked(def.id);
    const secret = def.hidden && !done;
    const item = el("li", { class: `ach${done ? " done" : ""}` });
    const mark = el("span", { class: "ach-mark" });
    mark.append(icon(done ? "check" : "lock"));
    const text = el("div", { class: "ach-text" });
    text.append(
      el("strong", { text: secret ? t("ach.hidden") : def.title }),
      el("span", { text: secret ? t("ach.hiddenDesc") : def.description }),
    );
    const meta = el("span", { class: "ach-meta num" });
    if (done) {
      meta.textContent = new Date(p.unlocked[def.id]).toLocaleDateString("vi-VN");
    } else if (def.target !== undefined) {
      const n = Math.min(def.target, p.counters[def.id] ?? 0);
      meta.textContent = t("ach.progress", { n, total: def.target });
      const bar = el("span", { class: "ach-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(def.target), "aria-valuenow": String(n) });
      bar.style.setProperty("--p", String(n / def.target));
      text.append(bar);
    } else {
      meta.textContent = t("ach.locked");
    }
    item.append(mark, text, meta);
    list.append(item);
  }
  const summary = el("div", { class: "ach-summary" });
  const best = p.bestRunSeconds;
  summary.append(
    el("p", { class: "num", text: t("ach.count", { n: unlockedCount(), total: ACHIEVEMENTS.length }) }),
    el("p", { class: "num", text: best === null ? "Chưa có kỷ lục nộp deadline" : `Kỷ lục nộp deadline: ${formatDuration(best)} · ${p.runsCompleted} lần nộp` }),
  );
  const foot = el("div", { class: "set-foot" });
  foot.append(button(t("ach.reset"), () => confirmReset(() => {
    progress.reset();
    renderAchievements(host, confirmReset);
    bus.emit("toast", { text: t("ach.resetDone") });
  }), "ghost danger"));
  host.append(summary, list, foot);
}
