import { modeBrief } from "../mode-brief";
/** Hành trình: the seven circuits (world-select style list) and their levels (inventory slots). */

import { DATA, circuitPlace } from "../../core/data";
import { t } from "../../core/i18n";
import { P, finaleUnlocked, levelUnlocked, record } from "../../game/progress";
import { focusCircuit } from "../../scene/world";
import { blockIcon, btn, el, icon, star, starRow } from "../dom";
import { back, go, type Params } from "../router";
import type { LevelParams } from "./level";

export function levelParams(id: string): LevelParams {
  const c = DATA.circuits.find((x) => x.levels.includes(id))!;
  const i = c.levels.indexOf(id);
  const nextId = c.levels[i + 1];
  return {
    id,
    mode: "journey",
    next: nextId
      ? { label: t("level.next"), go: () => go("level", levelParams(nextId), true) }
      : { label: t("journey.backToCircuits"), go: () => back() },
  };
}

export function screenJourney(root: HTMLElement, params: Params) {
  let selected: number = params.circuit ?? (DATA.circuits.find((c) => !P.get().lit.includes(c.id))?.id ?? 1);
  const list = el("div", { class: "circuit-list", role: "listbox", "aria-label": t("journey.circuits") });
  const detail = el("section", { class: "circuit-detail panel dark" });

  const render = () => {
    params.circuit = selected;
    focusCircuit(selected);
    list.replaceChildren();
    for (const c of DATA.circuits) {
      const lit = P.get().lit.includes(c.id);
      const stars = c.levels.reduce((s, id) => s + record(id).stars.filter(Boolean).length, 0);
      const locked = !levelUnlocked(c.levels[0]);
      const row = el("button", { type: "button", class: `circuit-row${selected === c.id ? " sel" : ""}${locked ? " locked" : ""}`, role: "option", "aria-selected": String(selected === c.id) },
        blockIcon(c.color, lit, 34),
        el("span", { class: "cr-text" },
          el("b", { text: `${c.id}. ${c.name}` }),
          el("small", { text: locked ? (c.id === 7 ? t("journey.finaleLocked") : t("journey.lockedHint")) : `${c.topic}` })),
        el("span", { class: "cr-meta" }, el("span", { text: `★ ${stars}/${c.levels.length * 3}` }), lit ? el("small", { class: "lit-tag", text: t("journey.lit") }) : null));
      row.addEventListener("click", () => { selected = c.id; render(); });
      list.append(row);
    }
    const c = DATA.circuits.find((x) => x.id === selected)!;
    const cStars = c.levels.reduce((s, id) => s + record(id).stars.filter(Boolean).length, 0);
    const cMax = c.levels.length * 3;
    detail.replaceChildren(el("header", { class: "cd-head" },
      blockIcon(c.color, P.get().lit.includes(c.id), 52),
      el("div", { class: "cd-title" },
        el("small", { class: "cd-kicker", text: `${t("journey.circuit")} ${c.id}` }),
        el("h2", { class: "display", text: c.name }),
        el("p", { class: "muted", text: `${c.topic} · ${t(`priority.${c.priority}`)}` }),
        el("p", { class: "cd-place" }, icon("pin", 14), el("span", { text: t("journey.place", circuitPlace(c.id)) }))),
      el("div", { class: "cd-progress" },
        el("span", { class: "ps-stars" }, star(true, 18), el("b", { text: `${cStars}` }), el("span", { text: `/${cMax}` })),
        el("span", { class: "ps-bar", style: `--p:${cStars / cMax}` }))));
    if (c.id === 7) {
      const ok = finaleUnlocked();
      detail.append(
        el("p", { text: ok ? t("journey.finaleReady") : t("journey.finaleNeed") }),
        btn(t("journey.playFinale"), () => go("finale", { mode: "journey" }), "primary", { disabled: !ok }));
      return;
    }
    const slots = el("div", { class: "level-slots" });
    for (const id of c.levels) {
      const lv = DATA.levels.get(id)!;
      const r = record(id);
      const open = levelUnlocked(id);
      const slot = el("button", { type: "button", class: `slot level-slot${r.done ? " done" : ""}`, disabled: !open, "aria-label": `${id} ${lv.title}${open ? "" : ` (${t("journey.locked")})`}` },
        el("b", { text: id }),
        el("span", { class: "ls-title", text: lv.title ?? "" }),
        starRow(r.stars, 14));
      slot.addEventListener("click", () => go("level", levelParams(id)));
      slots.append(slot);
    }
    detail.append(modeBrief("journey", true), slots);
    const firstOpen = c.levels.find((id) => levelUnlocked(id) && !record(id).done) ?? c.levels.find((id) => levelUnlocked(id));
    if (firstOpen) detail.append(btn(t("journey.play", { id: firstOpen }), () => go("level", levelParams(firstOpen)), "primary"));
    else detail.append(el("p", { class: "muted", text: t("journey.lockedHint") }));
  };
  render();
  root.append(el("div", { class: "screen journey-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.journey") })),
    el("div", { class: "two-pane" }, el("div", { class: "panel dark list-panel" }, list), detail)));
  return () => focusCircuit(null);
}
