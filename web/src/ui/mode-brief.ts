import { DATA } from "../core/data";
import { t } from "../core/i18n";
import { btn, el } from "./dom";
import { go } from "./router";
import { P } from "../game/progress";

export function modeBrief(mode: string, compact = false) {
  const brief = DATA.story.modes[mode];
  const details = el("details", { class: "mode-brief-details" }, el("summary", { text: t("story.brief.goal") }),
    el("p", { text: t(brief.goal) }), el("b", { text: t("story.brief.after") }), el("p", { text: t(brief.payoff) }));
  return el("section", { class: `mode-brief${compact ? " compact" : ""}` },
    el("small", { class: "kicker", text: t(brief.speaker) }),
    el("h2", { class: "display", text: t(brief.title) }),
    el("p", { text: t(brief.intro) }), details,
    btn(t("story.brief.story"), () => { if (mode === "guest") P.endGuest(); go("walk"); }, "small ghost", {}, "route"));
}
