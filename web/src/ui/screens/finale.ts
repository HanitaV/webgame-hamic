/** Đêm Hội tụ (GDD 4.7): three short steps, then the show. Everyone gets a complete show. */

import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { P, allLit, completeLevel, setFlag, type Mode } from "../../game/progress";
import type { EvalResult, Stars } from "../../game/types";
import { endShow, playShow } from "../../scene/world";
import { refreshWorld } from "../shell";
import { btn, el, star, starRow } from "../dom";
import { modal } from "../overlay";
import { back, go, reset, type Params } from "../router";

const results: Record<string, { res: EvalResult; runs: number }> = {};

export function screenFinale(root: HTMLElement, params: Params) {
  const mode = (params.mode ?? "journey") as Mode;
  const steps = DATA.finaleSteps.map((s) => s.id);
  if (params.showOnly) return runShow(root, mode);

  const panel = el("div", { class: "panel dark center-panel" });
  const render = () => {
    panel.replaceChildren(el("h2", { class: "display", text: t("finale.title") }), el("p", { text: t("finale.intro") }));
    const slots = el("div", { class: "level-slots" });
    steps.forEach((id, i) => {
      const lv = DATA.levels.get(id)!;
      const r = results[id];
      const open = i === 0 || Boolean(results[steps[i - 1]]);
      const slot = el("button", { type: "button", class: `slot level-slot${r ? " done" : ""}`, disabled: !open }, el("b", { text: String(i + 1) }), el("span", { class: "ls-title", text: lv.title ?? "" }), starRow(r ? r.res.stars.slice(0, 2) : [false, false], 14, 2));
      slot.addEventListener("click", () => playStep(i));
      slots.append(slot);
    });
    panel.append(slots);
    const allDone = steps.every((id) => results[id]);
    panel.append(btn(allDone ? t("finale.watch") : t("finale.start"), () => (allDone ? finishSteps() : playStep(steps.findIndex((id) => !results[id]))), "primary wide", { "data-autofocus": true }));
  };
  const playStep = (i: number, replace = false) => {
    const id = steps[i];
    go("level", {
      id, mode: "finale", key: `f:${id}`, casual: mode === "casual",
      onSolved: (res: EvalResult, runs: number) => { results[id] = { res, runs }; },
      afterSolve: () => {
        if (i + 1 < steps.length) {
          const close = modal({
            title: t("finale.stepDone", { n: i + 1 }),
            body: [el("p", { text: t("finale.nextStep") })],
            actions: [btn(t("finale.next"), () => { close(); playStep(i + 1, true); }, "primary", { "data-autofocus": true })],
          });
        } else {
          back();
          finishSteps();
        }
      },
    }, replace);
  };
  const finishSteps = () => {
    const all = steps.map((id) => results[id]);
    const stars: Stars = [all.every(Boolean), all.every((r) => r?.res.stars[1]), all.reduce((s, r) => s + (r?.runs ?? 99), 0) <= 6];
    if (mode !== "casual" && mode !== "guest") completeLevel("7.1", DATA.levels.get("7.1")!, stars, "journey");
    if (mode === "casual") P.set({ casualLit: P.get().casualLit.includes(7) ? P.get().casualLit : [...P.get().casualLit, 7] });
    refreshWorld();
    go("finale", { mode, showOnly: true, stars }, true);
  };
  render();
  root.append(el("div", { class: "screen finale-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("finale.title") })),
    panel));
}

function runShow(root: HTMLElement, mode: Mode) {
  const lit = mode === "guest" ? 3 : Math.max(3, new Set([...P.get().lit, ...P.get().casualLit]).size);
  const colors = DATA.circuits.map((c) => c.color);
  root.append(el("div", { class: "screen show-screen" }, el("p", { class: "show-caption display", text: t("finale.showing") })));
  document.body.classList.add("showing");
  let ended = false;
  void playShow(lit, colors).then(() => {
    if (ended) return;
    if (mode !== "guest") setFlag("showSeen");
    const gold = mode !== "guest" && allLit();
    const greeting = DATA.config.greeting;
    root.append(el("div", { class: "show-end panel dark" },
      el("h2", { class: "logo small" }, el("span", { text: "Hội tụ" }), el("span", { class: "logo-70", text: "70" })),
      gold ? el("p", { class: "gold" }, star(true, 26), el("span", { text: t("finale.star70") })) : el("p", { text: t("finale.circuits", { n: lit }) }),
      el("p", { class: "greeting", text: greeting }),
      el("div", { class: "row" },
        mode === "guest" ? btn(t("guest.again"), () => { P.startGuest(); reset("guest"); }, "primary") : btn(t("finale.card"), () => go("share"), "primary"),
        mode === "guest" ? null : btn(t("ui.home"), () => reset("title"), ""))));
  });
  return () => { ended = true; document.body.classList.remove("showing"); endShow(); };
}
