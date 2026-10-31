/** Sổ (bằng chứng, vật phẩm, dòng thời gian, sự thật, đèn, kết cục), tin nhắn nhóm và bảng kết cục. */

import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import type { StoryState } from "../../game/story";
import {
  ENDING_IDS, TRUST_WARM, chatMessages, storyEvidence, storyFacts, storyItems, timeline, trustOf,
  type EndingResult, type Line,
} from "../../puzzles/logic/story";
import { btn, el, icon } from "../dom";
import { rich } from "../rich";

const story = () => DATA.story;

export function lineEl(line: Line) {
  return el("p", { class: "ending-line" }, el("b", { text: `${t(line.speaker)}: ` }), t(line.text));
}

function list(items: HTMLElement[]) {
  return items.length ? el("div", { class: "journal-list" }, ...items) : el("p", { class: "muted", text: t("story.ui.empty") });
}

function entry(title: string, text: string, tag?: string) {
  return el("article", { class: "journal-entry" }, el("b", { text: title }), rich(text), tag ? el("small", { class: "muted", text: tag }) : null);
}

export type NotebookTab = "evidence" | "items" | "timeline" | "facts" | "lamps" | "endings";
export const NOTEBOOK_TABS: NotebookTab[] = ["evidence", "items", "timeline", "facts", "lamps", "endings"];

export function notebookContent(s: StoryState, tab: NotebookTab): HTMLElement {
  const st = story();
  switch (tab) {
    case "evidence": return list(storyEvidence(st, s).map((id) => {
      const e = st.evidence[id];
      return entry(t(e.title), t(e.text), e.bond === "build" ? t("story.ui.bondTag.build") : undefined);
    }));
    case "items": return list(storyItems(st, s).map((id) => entry(t(st.items[id].title), t(st.items[id].text))));
    case "timeline": return list(timeline(st, DATA.config.endings, s).map((e) => entry(t(st.stops.find((x) => x.id === e.stop)!.title), `${t(e.text)} ${t(e.effect)}`)));
    case "facts": {
      const facts = storyFacts(st, s);
      return list(DATA.facts.filter((f) => facts.has(f.circuit)).map((f) => entry(f.title, f.text, f.source)));
    }
    case "lamps": {
      const notes = st.lamps.notes;
      return el("div", {}, el("p", { class: "muted", text: t("story.ui.lampCount", { n: s.lamps.length, max: st.lamps.need }) }),
        list(s.lamps.filter((n) => notes[n]).map((n) => entry(t(DATA.map.walk.nodes.find((x) => x.id === n)!.label), t(notes[n])))));
    }
    case "endings": return endingLibrary(s);
  }
}

export function endingLibrary(s: StoryState) {
  const st = story();
  return el("div", { class: "journal-list" },
    el("p", { class: "muted", text: t("story.ui.libraryCount", { n: ENDING_IDS.filter((id) => s.endingsSeen.includes(id)).length, max: ENDING_IDS.length }) }),
    ...ENDING_IDS.map((id) => {
      const seen = s.endingsSeen.includes(id), e = st.endings[id];
      return el("article", { class: `journal-entry${seen ? "" : " locked"}`, "data-ending-entry": id },
        el("b", { text: `${id} · ${seen ? t(e.title) : t("story.ui.libraryLocked")}` }),
        seen ? el("p", { text: e.lines.map((l) => t(l.text)).join(" ") }) : el("p", { class: "muted", text: t("story.ui.libraryHint", { hint: t(e.hint) }) }));
    }));
}

export function chatContent(s: StoryState) {
  const msgs = chatMessages(story(), s);
  if (!msgs.length) return el("p", { class: "muted", text: t("story.ui.chatEmpty") });
  return el("ol", { class: "chat-list", "aria-live": "polite" }, ...msgs.map((m, i) => el("li", { class: i >= s.chatSeen ? "new" : "" }, el("b", { text: t(m.speaker) }), el("p", { text: t(m.text) }))));
}

/** Bảng kết cục: lời thoại, nguyên nhân (E2), dòng thời gian nhân quả, lời kết của 12 NPC. */
export function endingPanel(s: StoryState, r: EndingResult, preview: boolean, actions: HTMLElement[]) {
  const st = story(), e = st.endings[r.id];
  const variant = r.variant && e.variants ? e.variants[r.variant] : null;
  const trust = trustOf(st, s);
  const rows = timeline(st, DATA.config.endings, s);
  const root = el("div", { class: "ending-panel" },
    el("p", { class: "kicker", text: preview ? t("story.ui.preview") : t("story.ui.ending", { id: r.id }) }),
    el("h2", { class: "display", text: t(e.title) }),
    variant ? el("p", { class: "walk-question", text: t("story.ui.cause", { name: t(variant.title) }) }) : null,
    ...e.lines.map(lineEl), variant ? lineEl(variant.line) : null,
    e.caption ? el("p", { class: "ending-caption", role: "note" }, icon("sparkle", 16), el("span", { text: ` ${t(e.caption)}` })) : null,
    r.id === "E1" ? el("p", { class: "greeting", text: DATA.config.greeting }) : null,
    el("div", { class: "row ending-actions" }, ...actions),
    el("details", { class: "ending-details", open: true }, el("summary", { text: t("story.ui.timeline") }),
      el("ol", { class: "timeline-list" }, ...rows.map((row) => el("li", { class: row.risk ? "risk" : "" },
        el("b", { text: t(st.stops.find((x) => x.id === row.stop)!.title) }),
        el("p", { text: t(row.effect) }),
        el("small", { class: row.risk ? "warn" : "good", text: row.risk ? t("story.ui.timelineRisk") : t("story.ui.timelineSafe") }))))),
    el("details", { class: "ending-details" }, el("summary", { text: t("story.ui.epilogues") }),
      el("ul", { class: "epilogue-list" }, ...DATA.map.walk.characters.map((c) => {
        const ep = st.npcs[c.id]?.epilogue;
        if (!ep) return null;
        return el("li", {}, el("b", { text: `${t(c.name)}: ` }), t((trust[c.id] ?? 0) >= TRUST_WARM ? ep.warm : ep.plain));
      }))),
  );
  return root;
}

export function backButton(onClick: () => void) { return btn(t("story.ui.back"), onClick, "ghost", {}, "back"); }
