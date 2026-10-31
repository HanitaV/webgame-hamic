import { DATA } from "../core/data";
import { t } from "../core/i18n";
import { DIFFICULTIES, difficulty, playSettings } from "../game/play";
import { btn, el } from "./dom";

export function difficultyPicker(onChange: () => void = () => {}) {
  const description = el("p", { class: "difficulty-description", "aria-live": "polite" });
  const choices = el("div", { class: "difficulty-choices", role: "group", "aria-label": t("story.difficulty") });
  const sync = () => {
    for (const b of choices.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.difficulty === difficulty()));
    description.textContent = t(DATA.story.difficulties[difficulty()].description);
  };
  for (const d of DIFFICULTIES) choices.append(btn(t(DATA.story.difficulties[d].name), () => { playSettings.set({ difficulty: d }); sync(); onChange(); }, "small choice", { "data-difficulty": d, "aria-pressed": String(d === difficulty()) }));
  sync();
  return el("section", { class: "difficulty-picker", "aria-label": t("story.difficulty") }, el("b", { class: "small", text: t("story.difficulty") }), choices, description);
}
