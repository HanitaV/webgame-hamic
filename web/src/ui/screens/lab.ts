import { DATA } from "../../core/data";
import { modeBrief } from "../mode-brief";
/** Phòng thí nghiệm (GDD 6): free play with the function plot, mirrors and blocks, no goals. */

import { t } from "../../core/i18n";
import { setFlag } from "../../game/progress";
import type { Level } from "../../game/types";
import { runProgram, type Block } from "../../puzzles/logic/blocks";
import { VIEWS } from "../../puzzles/views/index";
import type { PuzzleView } from "../../puzzles/views/types";
import { btn, el } from "../dom";
import { tiaLine } from "../overlay";
import { back } from "../router";

const TOOLS: { id: string; module: Level["module"]; level: Level }[] = [
  { id: "plot", module: "plot-limit", level: { id: "lab-plot", module: "plot-limit", prompt: "", hints: [], data: { T: 3, eps: 0.5, a_range: [0, 100], a_step: 1, b_range: [0.05, 3], b_step: 0.05 }, answer: {} } },
  { id: "beam", module: "beam-order", level: { id: "lab-beam", module: "beam-order", prompt: "", hints: [], data: { vector: [1, 0], mirrors: [] }, answer: {} } },
  { id: "blocks", module: "block-vm", level: { id: "lab-blocks", module: "block-vm", prompt: "", hints: [], data: {}, answer: {} } },
];

export function screenLab(root: HTMLElement) {
  let view: PuzzleView | null = null;
  const tabs = el("div", { class: "tabs", role: "tablist" });
  const controls = el("div", { class: "controls" });
  const stageHost = el("div", { class: "stage-host" });
  const tiaHost = el("div", { class: "tia-host" });
  const tried = new Set<string>();
  let current = TOOLS[0];

  const watch = () => {
    if (!view) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = view.solution() as any;
    if (current.id === "plot" && s.a === 70) { setFlag("lab70"); tiaHost.replaceChildren(tiaLine(t("lab.seventy"), "happy")); }
    if (current.id === "beam" && Array.isArray(s.order) && s.order.length === 2) {
      tried.add(s.order.join(">"));
      if (tried.has("R90>FX") && tried.has("FX>R90")) setFlag("labBothOrders");
    }
  };
  const runBtn = btn(t("level.run"), () => {
    if (!view) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = view.solution() as any;
    if (current.id === "blocks") {
      const r = runProgram(s.program as Block[]);
      const has70 = Object.values(r.vars).includes(70) || r.lights.size === 70;
      if (has70) setFlag("lab70");
      view.show({ ok: true, stars: [false, false, false], message: "", detail: { run: r } });
      tiaHost.replaceChildren(tiaLine(r.error ?? (has70 ? t("lab.seventy") : t("lab.ran", { n: r.lights.size, v: Object.entries(r.vars).map(([k, v]) => `${k} = ${v}`).join(", ") || "—" })), has70 ? "happy" : "calm"));
    } else {
      view.show({ ok: true, stars: [false, false, false], message: "" });
      watch();
    }
  }, "primary big run", {}, "play");

  const open = (tool: (typeof TOOLS)[number]) => {
    current = tool;
    view?.destroy();
    controls.replaceChildren();
    stageHost.replaceChildren();
    tiaHost.replaceChildren(tiaLine(t(`lab.intro.${tool.id}`)));
    tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.id === tool.id)));
    view = VIEWS[tool.module]!({ level: tool.level, casual: false, lab: true, controls, stage: stageHost, changed: watch });
  };
  for (const tool of TOOLS) tabs.append(btn(t(`lab.tab.${tool.id}`), () => open(tool), "small tab", { role: "tab", "data-id": tool.id }));

  root.append(el("div", { class: "screen level-screen lab-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display level-title", text: t("title.lab") }), tabs),
    el("div", { class: "level-body" },
      el("aside", { class: "level-left panel" }, modeBrief("lab", true), el("p", { class: "prompt", text: t("lab.prompt") }), controls, runBtn),
      el("section", { class: "level-stage stage-frame" }, stageHost, tiaHost))));
  open(TOOLS[0]);
  return () => view?.destroy();
}
