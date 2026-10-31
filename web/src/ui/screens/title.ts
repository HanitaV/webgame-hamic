import { settings } from "../../game/settings";
import { developerMode } from "../../game/developer";
/** Title screen: hero on the left, mode cards on the right, the light sandbox behind. */

import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { P, coreFactsOpen, journeyStars, maxStars } from "../../game/progress";
import { focusCircuit } from "../../scene/world";
import { btn, el, icon, lamp, star, type IconName } from "../dom";
import { requestLandscape } from "../orientation";
import { go } from "../router";
import { refreshWorld } from "../shell";
import { difficultyPicker } from "../difficulty";
import { storyProgress } from "../../game/story";
import { ENDING_IDS, currentChapter, currentStop, npcPlace, type StoryState } from "../../puzzles/logic/story";
import { modal } from "../overlay";
import { resetWalkPosition } from "../../scene/walking";

export function screenTitle(root: HTMLElement) {
  focusCircuit(null);
  refreshWorld();
  const fact = DATA.config.splashes[Math.floor(Math.random() * DATA.config.splashes.length)];
  const nav = (name: string) => () => { void requestLandscape(); go(name); };
  const stars = journeyStars(), max = maxStars();
  const lit = new Set([...P.get().lit, ...P.get().casualLit]);
  const got = Object.keys(P.get().achievements).length;
  const story = storyProgress.get();
  const start = () => { void requestLandscape(); go("walk"); };
  const newStory = () => {
    const close = modal({ title: t("story.newgame"), body: [el("p", { text: t("story.newgame.note") })], actions: [
      btn(t("story.newgame.confirm"), () => { close(); storyProgress.reset(); resetWalkPosition(); start(); }, "primary"),
      btn(t("ui.close"), () => close(), "ghost"),
    ] });
  };

  const card = (name: string, ic: IconName, title: string, sub: string) => {
    const b = el("button", { type: "button", class: "mode-card" },
      el("span", { class: "mode-icon" }, icon(ic, 22)),
      el("span", { class: "mode-text" }, el("b", { text: title }), el("small", { text: sub })));
    b.addEventListener("click", nav(name));
    return b;
  };

  const lamps = el("div", { class: "lamp-row", "aria-label": t("title.litAria", { n: lit.size, max: DATA.circuits.length }) });
  for (const c of DATA.circuits) lamps.append(lamp(c.color, lit.has(c.id), 14));

  const perf = btn(t("story.perf"),()=>{const low=!settings.get().lowGraphics;settings.set({lowGraphics:low});perf.setAttribute("aria-pressed",String(low));},"small choice",{"aria-pressed":String(settings.get().lowGraphics),"data-performance":true});
  root.append(el("div", { class: "screen title-screen" },
    el("section", { class: "hero" },
      el("p", { class: "kicker", text: DATA.config.credits }),
      el("h1", { class: "logo", "aria-label": DATA.config.title }, el("span", { text: "Hội tụ" }), el("span", { class: "logo-70", text: "70" })),
      el("p", { class: "lead", text: t("story.title.focus") }),
      difficultyPicker(),
      el("div", {class:"performance-choice"},perf,el("small",{class:"muted",text:t("story.perf.help")})),
      el("div", { class: "hero-cta" },
        btn(t(story.introSeen || story.step ? "story.resume" : "story.play"), start, "primary big", { "data-autofocus": true, "data-story-start": true }, "play"),
        story.introSeen || story.step ? btn(t("story.newgame"), newStory, "small ghost") : null),
      el("p", { class: "story-save-line", text: `${t(currentChapter(DATA.story, story).title)}${story.endingsSeen.length ? ` · ${t("story.ui.libraryCount", { n: story.endingsSeen.length, max: ENDING_IDS.length })}` : ""}` }),
      lastTime(story),
      el("details", { class: "title-extras" }, el("summary", { text: t("story.menu") }), el("div", { class: "progress-strip" },
        el("span", { class: "ps-stars" }, star(true, 18), el("b", { text: `${stars}` }), el("span", { text: `/${max}` })),
        el("span", { class: "ps-bar", style: `--p:${stars / max}` }),
        lamps), el("p", { class: "fact-chip" }, icon("sparkle", 16), el("span", { text: fact })))),
    el("nav", { class: "mode-grid", "aria-label": t("title.menu") },
      DATA.config.casual.enabled ? card("casual", "stroll", t("title.casual"), t(DATA.story.modes.casual.title)) : null,
      card("journey", "route", t("title.journey"), t("story.menu")),
      card("daily", "calendar", t("title.daily"), t("title.dailySub")),
      card("practice", "target", t("title.practice"), t("title.practiceSub")),
      card("lab", "flask", t("title.lab"), t("title.labSub")),
      card("notebook", "book", t("title.notebook"), t("title.notebookSub", { n: coreFactsOpen().size })),
      card("achievements", "trophy", t("title.achievements"), t("title.achievementsSub", { n: got, max: DATA.achievements.length })),
      card("settings", "gear", t("title.settings"), t("title.settingsSub"))),
    el("footer", { class: "title-foot" },
      btn(t("title.card"), nav("share"), "small ghost", {}, "share"),
      btn(t("title.guest"), nav("guest"), "small ghost", {}, "guest"),
      el("span", { class: "foot-meta", text: `${developerMode() ? t("story.hack") + " · " : ""}${t("title.version", { v: DATA.config.version })}${DATA.map.mapVerified ? "" : ` · ${t("title.mapDraft")}`}${P.saveOk() ? "" : ` · ${t("title.noSave")}`}` })),
  ));
}

/** "Lần trước: <việc> · <nơi>" để người chơi quay lại biết mình đang ở đâu. */
function lastTime(story: StoryState) {
  const stop = currentStop(DATA.story, story);
  if (!story.introSeen || !stop) return null;
  const c = DATA.map.walk.characters.find((x) => x.id === stop.npc)!;
  const place = npcPlace(DATA.story, stop.chapter, stop.npc, { node: c.node, offset: c.offset });
  const node = DATA.map.walk.nodes.find((n) => n.id === place.node);
  return el("p", { class: "muted small", "data-last-time": true, text: t("story.ui.lastTime", { title: t(stop.title), place: t(node?.label ?? "") }) });
}
