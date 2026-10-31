/**
 * The interface layer: title screen, HUD, toasts, and the screens behind the menu.
 * It only listens to bus events and calls back into the game through `GameControls`;
 * it never reaches into the 3D scene.
 */

import { DEFAULT_BINDINGS, FLAGS, GAME, type Action } from "../config";
import { bus, type Mode } from "../core/events";
import { formatDuration, t } from "../i18n";
import { ACHIEVEMENTS, progress, renderAchievements, unlockedCount, wireAchievements } from "./achievements";
import { $, hydrateIcons, icon, keyName } from "./dom";
import { confirmAction, screens } from "./screens";
import { bindingsFor, reducedMotion, renderSettings, settings } from "./settings";
import { canNativeShare, copyInvite, download, nativeShare, shareText, shareUrl, shotName } from "./share";

export interface GameControls {
  start(mode: Mode): void;
  setMode(mode: Mode): void;
  mode(): Mode;
  bookmark(id: string): void;
  setFloor(floor: number | null): void;
  climb(delta: number): void;
  resetRun(): void;
  cineToggle(): void;
  cineRestart(): void;
  capture(): Promise<Blob | null>;
  goTitle(): void;
  touchControls(): boolean;
  pointerLocked(): boolean;
}

let game: GameControls;
let atTitle = true;
let hintTimer = 0;
let shot: Blob | null = null;

/* ---------- Toasts ---------- */

function toast(text: string, detail?: string, kind: "info" | "achievement" | "error" = "info") {
  const host = $("#toasts");
  const item = document.createElement("div");
  item.className = `toast ${kind}`;
  if (kind === "achievement") item.append(icon("trophy"));
  const body = document.createElement("div");
  if (detail) {
    const small = document.createElement("small");
    small.textContent = detail;
    body.append(small);
  }
  const strong = document.createElement("strong");
  strong.textContent = text;
  body.append(strong);
  item.append(body);
  host.append(item);
  while (host.children.length > 3) host.firstElementChild!.remove();
  window.setTimeout(() => {
    item.classList.add("out");
    window.setTimeout(() => item.remove(), reducedMotion() ? 0 : 220);
  }, kind === "achievement" ? 4200 : 2600);
}

/* ---------- Hints ---------- */

function showHint(mode: Mode) {
  const hint = $("#hint");
  const touch = game.touchControls();
  const text =
    mode === "walk"
      ? touch ? t("hint.walkTouch") : game.pointerLocked() ? t("hint.walkLocked") : t("hint.walk")
      : mode === "orbit"
        ? touch ? t("hint.orbitTouch") : t("hint.orbit")
        : t("hint.cine");
  hint.textContent = text;
  hint.hidden = false;
  hint.classList.remove("out");
  window.clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => hint.classList.add("out"), 5200);
}

/* ---------- Title ---------- */

function refreshCounts() {
  const text = `${unlockedCount()}/${ACHIEVEMENTS.length}`;
  $("#t-ach-count").textContent = text;
  $("#p-ach-count").textContent = text;
  const best = progress.get().bestRunSeconds;
  const bestEl = $("#t-best");
  bestEl.hidden = best === null;
  if (best !== null) bestEl.textContent = t("title.best", { time: formatDuration(best) });
}

export function showTitle(open: boolean) {
  atTitle = open;
  document.body.classList.toggle("at-title", open);
  $("#title-screen").hidden = !open;
  $("#hud").hidden = open;
  if (open) {
    screens.closeAll();
    refreshCounts();
    window.setTimeout(() => $("#t-play").focus(), 0);
  }
  bus.emit("title", { open });
}

/* ---------- HUD wiring ---------- */

function wireHud() {
  // Mode switch
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
    b.addEventListener("click", () => game.setMode(b.dataset.mode as Mode));
  }
  bus.on("mode", ({ mode }) => {
    document.body.dataset.mode = mode;
    for (const b of document.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
    }
    if (!atTitle) showHint(mode);
    if (mode !== "walk") $("#stair").hidden = true;
  });
  bus.on("pointerLock", () => {
    if (game.mode() === "walk" && !atTitle) showHint("walk");
  });

  // Bookmarks
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bookmark]")) {
    b.addEventListener("click", () => game.bookmark(b.dataset.bookmark!));
  }

  // Where
  bus.on("place", (e) => {
    $("#where-name").textContent = e.name || t("hud.outside");
    const floor = $("#where-floor");
    floor.hidden = !e.name && e.level === 1;
    floor.textContent = t("hud.floor", { n: e.level });
    $("#map-where").textContent = e.name ? `${e.name} · ${t("hud.floor", { n: e.level })}` : t("hud.outside");
    const stair = $("#stair");
    stair.hidden = !e.stair;
    if (e.stair) {
      $("#stair-text").textContent = t("stair.where", { name: e.stair.name, level: e.stair.level, top: e.stair.top });
      ($("#stair-up") as HTMLButtonElement).disabled = !e.stair.canUp;
      ($("#stair-down") as HTMLButtonElement).disabled = !e.stair.canDown;
    }
  });
  bus.on("mode", ({ mode }) => {
    if (mode !== "walk") $("#map-where").textContent = t("hud.mapHint");
  });
  $("#stair-up").addEventListener("click", () => game.climb(1));
  $("#stair-down").addEventListener("click", () => game.climb(-1));

  // Clock
  bus.on("hour", ({ hour }) => {
    const whole = Math.floor(hour) % 24;
    const minutes = Math.floor((hour - Math.floor(hour)) * 60);
    $("#clock").textContent = `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  });

  // Deadline run
  const slots = [...document.querySelectorAll<HTMLElement>(".run-slots i")];
  let total = 3;
  bus.on("run", (e) => {
    total = e.total;
    slots.forEach((s) => s.classList.remove("on"));
    $("#run").classList.remove("won");
    $("#run-text").textContent = t("run.todo");
    $("#run-time").textContent = "0:00";
    $("#run-again").hidden = true;
  });
  bus.on("deadline", (e) => {
    slots.forEach((s, i) => s.classList.toggle("on", i < e.collected));
    $("#run-text").textContent = e.collected >= e.total ? t("run.deliver") : e.collected === 0 ? t("run.todo") : t("run.left", { n: e.total - e.collected });
    if (e.collected > 0 && e.collected < total) toast(t("run.left", { n: e.total - e.collected }), `${e.collected}/${e.total}`);
  });
  bus.on("runTime", ({ seconds }) => {
    $("#run-time").textContent = formatDuration(seconds);
  });
  bus.on("won", ({ seconds }) => {
    $("#run").classList.add("won");
    $("#run-text").textContent = t("run.done", { time: formatDuration(seconds) });
    $("#run-time").textContent = formatDuration(seconds);
    $("#run-again").hidden = false;
    refreshCounts();
  });
  $("#run-again").addEventListener("click", () => game.resetRun());

  // Floors (built once the data says how many)
  let built = 0;
  bus.on("floorView", ({ floor, max }) => {
    const host = $("#floor-buttons");
    if (built !== max) {
      built = max;
      host.replaceChildren();
      const make = (label: string, value: number | null, title: string) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = label;
        b.dataset.floor = value === null ? "all" : String(value);
        b.title = title;
        b.addEventListener("click", () => game.setFloor(value));
        host.append(b);
      };
      for (let f = max; f >= 1; f -= 1) make(String(f), f, t("hud.floorPick", { n: f }));
      make(t("hud.floorAll"), null, "Hiện toàn bộ nhà và mái");
    }
    for (const b of host.querySelectorAll<HTMLButtonElement>("button")) {
      const value = b.dataset.floor === "all" ? null : Number(b.dataset.floor);
      b.setAttribute("aria-pressed", String(value === floor));
    }
  });

  // Cinematic
  const pauseBtn = $("#cine-pause");
  bus.on("cine", ({ time, duration, playing }) => {
    $("#cine-time").textContent = `${formatDuration(time)} / ${formatDuration(duration)}`;
    $("#cine-fill").style.transform = `scaleX(${duration ? time / duration : 0})`;
    const label = playing ? t("cine.pause") : t("cine.play");
    if (pauseBtn.getAttribute("aria-label") !== label) {
      pauseBtn.setAttribute("aria-label", label);
      pauseBtn.dataset.tip = label;
      pauseBtn.replaceChildren(icon(playing ? "pause" : "play"));
    }
  });
  pauseBtn.addEventListener("click", () => game.cineToggle());
  $("#cine-reset").addEventListener("click", () => game.cineRestart());

  // Menu
  $("#open-menu").addEventListener("click", () => screens.push("pause"));
  $("#reveal").addEventListener("click", () => setUiHidden(false));

  bus.on("toast", (e) => toast(e.text, e.detail, e.kind));
  bus.on("achievement", refreshCounts);
}

export function setUiHidden(hidden: boolean) {
  document.body.classList.toggle("ui-off", hidden);
  $("#reveal").hidden = !hidden;
}

/* ---------- Screens ---------- */

function keysTable() {
  const rows: [string, Action[]][] = [
    ["Đi", ["forward", "left", "back", "right"]],
    ["Nhảy", ["jump"]],
    ["Lên / xuống tầng ở cầu thang", ["floorUp", "floorDown"]],
    ["Đi bộ / bản đồ / quay cảnh", ["modeWalk", "modeOrbit", "modeCine"]],
    ["Mở menu", ["pause"]],
    ["Ẩn giao diện", ["toggleUi"]],
  ];
  const table = $("#howto-keys");
  table.replaceChildren();
  const body = document.createElement("tbody");
  for (const [label, actions] of rows) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = label;
    const td = document.createElement("td");
    for (const action of actions) {
      const kbd = document.createElement("kbd");
      kbd.textContent = keyName((bindingsFor(action)[0] ?? DEFAULT_BINDINGS[action][0]));
      td.append(kbd);
    }
    tr.append(th, td);
    body.append(tr);
  }
  const tr = document.createElement("tr");
  tr.innerHTML = "<th scope=\"row\">Nhìn quanh</th><td>Bấm vào cảnh để khoá chuột, rồi di chuột</td>";
  body.append(tr);
  table.append(body);
}

async function openShare() {
  const status = $("#share-status");
  status.textContent = "";
  ($("#share-text") as HTMLTextAreaElement).value = `${shareText()}\n${shareUrl()}`;
  ($("#share-native") as HTMLButtonElement).hidden = !canNativeShare();
  const img = $("#share-img") as HTMLImageElement;
  shot = await game.capture();
  if (shot) {
    if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(shot);
  }
}

function wireScreens() {
  const dlg = (id: string) => $(`#scr-${id}`) as HTMLDialogElement;

  screens.register("pause", { dialog: dlg("pause"), onOpen: refreshCounts });
  screens.register("settings", { dialog: dlg("settings") });
  screens.register("achievements", {
    dialog: dlg("achievements"),
    onOpen: () => renderAchievements($("#ach-body"), (onYes) =>
      confirmAction(t("ach.resetConfirm"), t("ach.resetYes"), t("ach.resetNo"), onYes)),
  });
  screens.register("share", { dialog: dlg("share") });
  screens.register("howto", { dialog: dlg("howto"), onOpen: keysTable });
  screens.register("about", { dialog: dlg("about") });
  screens.register("confirm", { dialog: dlg("confirm") });

  renderSettings($("#settings-body"));

  // Title
  $("#title-lead").textContent = t("title.lead");
  $("#t-play").addEventListener("click", () => game.start("walk"));
  $("#t-explore").addEventListener("click", () => game.start("orbit"));
  $("#t-cine").addEventListener("click", () => game.start("cine"));
  $("#t-ach").addEventListener("click", () => screens.push("achievements"));
  $("#t-settings").addEventListener("click", () => screens.push("settings"));
  $("#t-about").addEventListener("click", () => screens.push("about"));
  const meta = [GAME.publisher, `v${GAME.version}`].filter(Boolean).join(" · ");
  $("#t-meta").textContent = meta;
  $("#about-meta").textContent = `${GAME.title} · ${meta}`;

  // Pause menu
  $("#p-resume").addEventListener("click", () => screens.close("pause"));
  $("#p-howto").addEventListener("click", () => screens.push("howto"));
  $("#p-ach").addEventListener("click", () => screens.push("achievements"));
  $("#p-settings").addEventListener("click", () => screens.push("settings"));
  $("#p-share").addEventListener("click", () => {
    screens.push("share");
    void openShare();
  });
  $("#p-hide").addEventListener("click", () => {
    screens.closeAll();
    setUiHidden(true);
  });
  $("#p-restart").addEventListener("click", () => {
    screens.closeAll();
    game.resetRun();
    game.setMode("walk");
  });
  $("#p-home").addEventListener("click", () => game.goTitle());

  // Share
  $("#share-native").addEventListener("click", async () => {
    const done = await nativeShare(shot ?? undefined);
    if (!done) $("#share-status").textContent = "";
  });
  $("#share-copy").addEventListener("click", async () => {
    const ok = await copyInvite();
    $("#share-status").textContent = ok ? t("share.copied") : t("share.copyFail");
    if (!ok) ($("#share-text") as HTMLTextAreaElement).select();
  });
  $("#share-shot").addEventListener("click", async () => {
    const blob = shot ?? (await game.capture());
    if (!blob) return;
    download(blob, shotName());
    $("#share-status").textContent = t("share.shotDone");
  });

  // Feature flags hide whole entries
  for (const node of document.querySelectorAll<HTMLElement>("[data-feature]")) {
    const flag = node.dataset.feature as keyof typeof FLAGS;
    if (!FLAGS[flag]) node.hidden = true;
  }
}

/* ---------- Settings that belong to the interface ---------- */

function applyUiSettings() {
  const s = settings.get();
  document.documentElement.style.setProperty("--ui-scale", String(Number(s.uiScale) / 100));
  document.documentElement.classList.toggle("reduce-motion", reducedMotion());
}

export function initInterface(controls: GameControls) {
  game = controls;
  hydrateIcons();
  wireAchievements();
  wireHud();
  wireScreens();
  applyUiSettings();
  settings.subscribe((_, changed) => {
    if (changed.includes("uiScale") || changed.includes("reduceMotion")) applyUiSettings();
  });
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", applyUiSettings);
  refreshCounts();
}

export { screens };
