import { initMusic, musicDiagnostics } from "./core/music";
import { storyProgress } from "./game/story";
import * as storyLogic from "./puzzles/logic/story";
import { storyTime } from "./puzzles/logic/story";
import { playSettings } from "./game/play";
/** Hội tụ 70 — entry point. Loads content, builds the sandbox, mounts screens. */

import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/be-vietnam-pro/vietnamese-800.css";
import "@fontsource/be-vietnam-pro/latin-800.css";
import "./style.css";

import { bus } from "./core/events";
import { DATA, loadData } from "./core/data";
import { t } from "./core/i18n";
import { P, checkAchievements, dailyIds } from "./game/progress";
import { reducedMotion, settings } from "./game/settings";
import { initWorld, setStoryTime, worldDiagnostics } from "./scene/world";
import { walkPosition, walkingMetrics, walkTo, walkToPoint, walkToWorldPoint, pauseWalk, teleportTo } from "./scene/walking";
import { el } from "./ui/dom";
import { initOverlay, toast } from "./ui/overlay";
import { installRotateCover } from "./ui/orientation";
import { back, current, go, initRouter, register, reset } from "./ui/router";
import { applySettings, refreshWorld } from "./ui/shell";
import { screenAchievements, screenNotebook } from "./ui/screens/book";
import { screenFinale } from "./ui/screens/finale";
import { screenJourney } from "./ui/screens/journey";
import { screenLab } from "./ui/screens/lab";
import { screenLevel } from "./ui/screens/level";
import { screenCasual, screenDaily, screenGuest, screenPractice } from "./ui/screens/modes";
import { screenSettings } from "./ui/screens/settings";
import { screenShare } from "./ui/screens/share";
import { screenWalk } from "./ui/screens/walk";
import { toggleDeveloper } from "./game/developer";
import { audioDiagnostics } from "./core/audio";
import { endingAudioDiagnostics } from "./core/ending-audio";
import { screenTitle } from "./ui/screens/title";

const bootBar = document.querySelector<HTMLElement>("#boot-fill")!;
const bootText = document.querySelector<HTMLElement>("#boot-text")!;

async function main() {
  try {
    await loadData((f) => { bootBar.style.transform = `scaleX(${0.1 + f * 0.8})`; });
  } catch (error) {
    bootText.textContent = `Không tải được dữ liệu (${error instanceof Error ? error.message : error}). Tải lại trang để thử lại.`;
    return;
  }
  document.title = `${DATA.config.title} — ${DATA.config.credits}`;
  const notice = el("aside", { class: "game-notice", text: t("notice.fiction") });
  document.body.append(notice);
  // Reserve the actual wrapped text height, including when text scaling changes.
  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--notice-height", `${notice.getBoundingClientRect().height}px`);
  }).observe(notice);
  bootText.textContent = t("boot.world");
  const s = settings.get();
  // Canvas name tags on the map need the bundled font loaded first.
  await Promise.race([
    Promise.all(["700 44px", "800 64px"].map((f) => document.fonts.load(`${f} "Be Vietnam Pro"`))),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => undefined);
  bootBar.style.transform = "scaleX(0.92)";
  await initWorld(document.querySelector<HTMLCanvasElement>("#world")!, DATA.circuits.map((c) => c.color), { low: s.lowGraphics, reduceLights: s.reduceLights, reduceMotion: reducedMotion() }, DATA.map);
  applySettings();
  setStoryTime(storyTime(DATA.story, storyProgress.get()), true);
  refreshWorld();
  initOverlay();
  installRotateCover();
  bus.on("toast", (e) => toast(e.title, e.text, e.kind));
  bus.on("circuitLit", () => refreshWorld());
  settings.subscribe(() => applySettings());
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", applySettings);

  const screenRoot = el("main", { id: "screen", class: "screen-root" });
  document.body.append(screenRoot);
  initRouter(screenRoot);
  await initMusic();
  register("title", screenTitle);
  register("walk", screenWalk);
  register("journey", screenJourney);
  register("level", screenLevel);
  register("casual", screenCasual);
  register("daily", screenDaily);
  register("practice", screenPractice);
  register("lab", screenLab);
  register("notebook", screenNotebook);
  register("achievements", screenAchievements);
  register("settings", screenSettings);
  register("share", screenShare);
  register("guest", screenGuest);
  register("finale", screenFinale);

  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyH" && e.ctrlKey && e.shiftKey && !e.repeat) {
      e.preventDefault();
      const active = toggleDeveloper();
      reset("title"); refreshWorld();
      toast(t(active ? "story.hackOn" : "story.hackOff"), "", "info");
    }
  });

  // Esc goes back on menu screens (the level screen handles its own keys).
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || document.querySelector(".modal-layer, .keypad-layer, .walk-dialog:not([hidden])")) return;
    if (["title", "level", "guest"].includes(current())) return;
    back();
  });

  document.querySelector("#boot")!.classList.add("hidden");
  watchFrameRate();
  checkAchievements();
  const params = new URLSearchParams(location.search);
  const start = params.get("screen");
  if (DATA.config.mode === "guest" || params.has("guest")) reset("guest");
  else if (start) { reset("title"); go(start); }
  else reset("title");

  Object.assign(window, { __hoitu: { ready: true, go, reset, data: DATA, progress: P, walkPosition, walkingMetrics, walkTo, walkToPoint, walkToWorldPoint, teleportTo, pauseWalk, worldDiagnostics, storyProgress, storyLogic, playSettings, dailyIds, musicDiagnostics, audioDiagnostics, endingAudioDiagnostics, settings } });

  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  }
}

/**
 * Tối ưu máy yếu: đo khung hình trong vài giây đầu. Máy ít nhân hoặc chạy dưới ~25 khung/giây thì
 * tự bật đồ họa thấp (giảm điểm ảnh, ít người nền), trừ khi người chơi tắt "Tự hạ chất lượng".
 */
function watchFrameRate() {
  const s = settings.get();
  if (!s.autoQuality || s.lowGraphics) return;
  const lowSpec = (navigator.hardwareConcurrency ?? 8) <= 2 || ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8) <= 2;
  const lower = () => { settings.set({ lowGraphics: true }); settings.flush(); toast(t("set.low"), t("story.ui.autoLow"), "info"); };
  if (lowSpec) { lower(); return; }
  const samples: number[] = [];
  let last = performance.now(), started = last;
  const tick = (now: number) => {
    if (!document.hidden) samples.push(now - last);
    last = now;
    if (now - started < 6000) { requestAnimationFrame(tick); return; }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)] ?? 0;
    if (median > 40 && settings.get().autoQuality && !settings.get().lowGraphics) lower();
  };
  window.setTimeout(() => { last = started = performance.now(); requestAnimationFrame(tick); }, 1500);
}

void main();
