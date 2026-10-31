import { difficulty, difficultyProfile } from "../../game/play";
import { modeBrief } from "../mode-brief";
/** Dạo chơi, Thử thách hằng ngày, Luyện tập vô hạn, Khách (GDD 6). */

import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { sfx } from "../../core/audio";
import { P, dailyIds, finaleUnlocked, mulberry, record, setFlag, today, unlockNumberFact } from "../../game/progress";
import { toast } from "../overlay";
import type { Level } from "../../game/types";
import { focusCircuit } from "../../scene/world";
import { blockIcon, btn, el, hamicChip, hamicLogo, hamicSigns, starRow, tia } from "../dom";
import { back, go, reset, type Params } from "../router";
import { keypad } from "../widgets";

/* ---------- Dạo chơi ---------- */

function casualPool(circuit: number): Level[] {
  const mods = DATA.config.casual.circuits[String(circuit)] ?? [];
  return DATA.generated.filter((l) => l.casual && mods.includes(l.module) && (l.difficulty ?? 1) <= difficultyProfile().casualMax);
}

function playCasual(circuit: number) {
  const pool = casualPool(circuit);
  const next = pool.find((l) => !record(`c:${l.id}`).done) ?? pool[Math.floor(Math.random() * pool.length)];
  if (!next) return;
  go("level", {
    id: next.id, mode: "casual", key: `c:${next.id}`, casual: true, storyActivity: String(circuit),
    next: { label: t("casual.next"), go: () => { back(); playCasual(circuit); } },
  });
}

export function screenCasual(root: HTMLElement) {
  focusCircuit(null);
  const tiles = el("div", { class: "casual-tiles" });
  for (const id of Object.keys(DATA.config.casual.circuits).map(Number)) {
    const c = DATA.circuits.find((x) => x.id === id);
    if (!c) continue;
    const pool = casualPool(id);
    const done = pool.filter((l) => record(`c:${l.id}`).done).length;
    const lit = P.get().casualLit.includes(id);
    const tile = el("button", { type: "button", class: "btn casual-tile" },
      blockIcon(c.color, lit, 40),
      el("b", { text: t(`casual.circuit.${id}`) }),
      el("small", { text: t(DATA.story.modes.casual.activities![String(id)].title) }),
      el("small", { text: lit ? t("casual.lit") : t("casual.progress", { n: Math.min(done, DATA.config.casual.levelsToLight), max: DATA.config.casual.levelsToLight }) }));
    tile.addEventListener("click", () => playCasual(id));
    tiles.append(tile);
  }
  const finale = btn(t("casual.finale"), () => go("finale", { mode: "casual" }), "primary", { disabled: !finaleUnlocked() });
  root.append(el("div", { class: "screen casual-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.casual") }), hamicChip()),
    el("div", { class: "panel dark casual-panel" },
      modeBrief("casual"),
      tiles,
      el("div", { class: "row" }, finale, btn(t("casual.toJourney"), () => { setFlag("playedCasual"); go("journey"); }, "")),
      el("p", { class: "muted", text: t("casual.finaleNote", { n: DATA.config.finaleUnlock.casualAnyCircuits }) }))));
}

/* ---------- Thử thách hằng ngày ---------- */

export function screenDaily(root: HTMLElement) {
  const calendarDay = today();
  const day = `${calendarDay}~${difficulty()}`;
  const ids = dailyIds(day);
  const slots = el("div", { class: "level-slots" });
  ids.forEach((id, i) => {
    const lv = DATA.levels.get(id)!;
    const r = record(`d:${day}:${id}`);
    const slot = el("button", { type: "button", class: `slot level-slot${r.done ? " done" : ""}`, "data-level-id": id },
      el("b", { text: String(i + 1) }), el("span", { class: "ls-title", text: t(DATA.story.modes.daily.activities![String(i)].title) }), starRow(r.stars, 14));
    slot.addEventListener("click", () => go("level", {
      id, mode: "daily", key: `d:${day}:${id}`, storyActivity: String(i),
      next: ids[i + 1] ? { label: t("level.next"), go: () => { back(); slots.querySelectorAll<HTMLButtonElement>("button")[i + 1]?.click(); } } : undefined,
    }));
    slots.append(slot);
  });
  const doneToday = Boolean(P.get().flags[`dailyDone:${day}`]);
  root.append(el("div", { class: "screen daily-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.daily") }), hamicChip()),
    el("div", { class: "panel dark center-panel" },
      el("h2", { class: "display", text: t("daily.date", { d: calendarDay.split("-").reverse().join("/") }) }),
      modeBrief("daily"),
      el("small", { class: "muted", text: t("story.modeDifficulty", { name: t(difficultyProfile().name) }) }),
      slots,
      el("p", { class: doneToday ? "good" : "muted", text: doneToday ? t("daily.done") : t("daily.notYet") }),
      el("p", { class: "muted", text: t("daily.days", { n: P.get().dailyDays.length }) }))));
}

/* ---------- Luyện tập vô hạn ---------- */

export function screenPractice(root: HTMLElement, params: Params) {
  const mods = DATA.config.practice.modules;
  let mod: string = params.mod ?? mods[0];
  let diff: number = params.diff ?? difficultyProfile().practice;
  const modRow = el("div", { class: "chip-row", role: "radiogroup", "aria-label": t("practice.module") });
  const diffRow = el("div", { class: "chip-row", role: "radiogroup", "aria-label": t("practice.diff") });
  const info = el("p", { class: "muted" });
  const sync = () => {
    params.mod = mod; params.diff = diff;
    modRow.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.v === mod)));
    diffRow.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.v) === diff)));
    info.textContent = t("practice.pool", { n: pool().length });
  };
  const pool = () => DATA.generated.filter((l) => l.module === mod && l.difficulty === diff);
  for (const m of mods) {
    const b = btn(t(`module.${m}`), () => { mod = m; sync(); }, "small choice", { role: "radio", "data-v": m });
    modRow.append(b);
  }
  for (let d = 1; d <= 5; d += 1) diffRow.append(btn(String(d), () => { diff = d; sync(); }, "small choice", { role: "radio", "data-v": d }));
  const play = (lv: Level, replay = false) => {
    if (replay) setFlag("seedReplay");
    go("level", { id: lv.id, mode: "practice", key: `p:${lv.id}`, next: { label: t("practice.another"), go: () => { back(); newOne(); } } });
  };
  const newOne = () => {
    const list = pool();
    if (!list.length) return;
    const rnd = mulberry(Date.now() & 0xffffffff);
    play(list[Math.floor(rnd() * list.length)]);
  };
  const seedBtn = btn(t("practice.seed"), () => keypad({
    title: t("practice.seedTitle"), value: null, min: 0, max: 9999999, onDone: (n) => {
      const secretKeys: Record<number, string> = {
        17: "practice.secret.17",
        70: "practice.secret.70",
        836: "practice.secret.836",
        1956: "practice.secret.1956",
        2026: "practice.secret.2026",
        2485: "practice.secret.2485",
      };
      if (secretKeys[n]) {
        sfx.chord70();
        unlockNumberFact(n >= 1 && n <= 200 ? n : 70);
        toast(t("practice.secretTitle"), t(secretKeys[n]), "info");
        const exact = DATA.generated.find((l) => l.seed === n);
        const list = pool().length ? pool() : DATA.generated;
        const chosen = exact ?? list[n % list.length];
        if (chosen) play(chosen, true);
        return;
      }
      const lv = DATA.generated.find((l) => l.seed === n);
      if (lv) play(lv, true);
      else info.textContent = t("practice.noSeed", { n });
    },
  }), "");
  sync();
  root.append(el("div", { class: "screen practice-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.practice") }), hamicChip()),
    el("div", { class: "panel dark center-panel" },
      modeBrief("practice"),
      el("p", { class: "ctl-label", text: t("practice.module") }), modRow,
      el("p", { class: "ctl-label", text: t("practice.diff") }), diffRow,
      el("div", { class: "row" }, btn(t("practice.new"), newOne, "primary"), seedBtn),
      info)));
}

/* ---------- Khách (kiosk) ---------- */

let idleTimer = 0;
let idleBound = false;

function armIdle() {
  window.clearTimeout(idleTimer);
  if (!P.isGuest()) return;
  idleTimer = window.setTimeout(() => {
    if (!P.isGuest()) return;
    document.querySelectorAll(".modal-layer, .keypad-layer").forEach((n) => n.remove());
    P.startGuest();
    reset("guest");
  }, DATA.config.guest.idleResetSeconds * 1000);
}

export function screenGuest(root: HTMLElement) {
  P.startGuest();
  focusCircuit(null);
  if (!idleBound) {
    idleBound = true;
    for (const ev of ["pointerdown", "keydown"]) window.addEventListener(ev, armIdle, { passive: true });
  }
  armIdle();
  const ids = DATA.config.guest.levels;
  const playStep = (i: number) => {
    const id = ids[i];
    go("level", {
      id, mode: "guest", key: `g:${id}`, storyActivity: String(i),
      backLabel: t("guest.quit"),
      onBack: () => reset("guest"),
      next: i + 1 < ids.length
        ? { label: t("guest.next", { n: i + 2, max: ids.length }), go: () => playStep(i + 1) }
        : { label: t("guest.show"), go: () => go("finale", { mode: "guest", showOnly: true }) },
    }, i > 0);
  };
  root.append(el("div", { class: "screen guest-screen" },
    el("div", { class: "panel dark center-panel guest-panel" },
      el("div", { class: "guest-brand" }, hamicLogo("lockup", 76, t("hamic.logoAlt")), hamicSigns(t("hamic.signsAria"))),
      el("h1", { class: "logo small" }, el("span", { text: t("title.logoLead") }), el("span", { class: "logo-70", text: t("title.logoAccent") })),
      modeBrief("guest"),
      btn(t("guest.start"), () => playStep(0), "primary wide", { "data-autofocus": true }),
      el("p", { class: "muted", text: t("guest.note", { s: DATA.config.guest.idleResetSeconds }) }),
      DATA.config.mode === "guest" ? null : btn(t("guest.exit"), () => { P.endGuest(); window.clearTimeout(idleTimer); reset("title"); }, "small"))));
}
