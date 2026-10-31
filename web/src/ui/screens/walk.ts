/**
 * Màn đi bộ — cốt truyện 2.8 "Vì sao đèn lệch?" (docs/STORY_BIBLE.md).
 * Dữ liệu ở story.json, luật ở puzzles/logic/story.ts. Không đồng hồ đếm ngược, không phạt.
 */

import { DATA, storyLevelId } from "../../core/data";
import { t } from "../../core/i18n";
import { developerMode } from "../../game/developer";
import { difficulty } from "../../game/play";
import { checkAchievements, P } from "../../game/progress";
import { storyProgress as save, type StoryLine } from "../../game/story";
import {
  ENDING_IDS, ambientLines, currentChapter, currentStop, decisionOptions, deriveFlags, fastForward, migrateLegacy,
  npcPlace, pickEnding, rewindTo, storyComplete, storyEvidence, storyFacts, storyItems, storyTime, topicAvailable,
  type E2Variant, type EndingId, type EndingResult, type Stop,
} from "../../puzzles/logic/story";
import { endShow, focusCircuit, playShow, setStoryTime, skipShow } from "../../scene/world";
import {
  nearCharacter, nearNode, nearbyCharacter, onCharacterInteraction, pauseWalk, placeCharacters, resetWalkPosition,
  setLamps, walkAxis, walkMode, walkTarget, walkTo,
} from "../../scene/walking";
import { btn, el, icon } from "../dom";
import { toast } from "../overlay";
import { joystick } from "../joystick";
import { rich } from "../rich";
import { minimap } from "../story/minimap";
import { buzz } from "../../core/audio";
import { back, go, reset } from "../router";
import { mountActivity, DIALOG_ACTIVITIES } from "../story/activities";
import { NOTEBOOK_TABS, chatContent, endingLibrary, endingPanel, notebookContent, type NotebookTab } from "../story/panels";
import { settings } from "../../game/settings";

/** Câu đố mở bằng màn chơi riêng: khi quay lại, truyện tiếp tục từ điểm dừng này. */
let resumeAfterLevel: string | null = null;
/** Minigame đã giải trong phiên (đóng hộp thoại giữa chừng thì không phải giải lại). */
const solvedThisSession = new Set<string>();
/** Lịch sử thoại của phiên (Sổ → Lịch sử thoại), giữ 80 câu gần nhất. */
const dialogueLog: StoryLine[] = [];

export function screenWalk(root: HTMLElement) {
  focusCircuit(null); walkMode(true);
  const st = DATA.story;
  let legacyNote = false;
  if (save.get().legacyStep) { save.replace(migrateLegacy(st, save.get())); legacyNote = true; }
  let disposed = false, showing = false, dialogOpen = false, closable = true;
  const held = new Set<string>();
  const hud = el("div", { class: "walk-hud panel dark" });
  const dialog = el("section", { class: "walk-dialog panel dark", role: "dialog", "aria-modal": "true", "aria-label": t("story.title"), hidden: true });
  const radioText = el("p");
  const radio = el("aside", { class: "walk-radio panel", "aria-label": t("story.radio") }, el("small", { class: "kicker", text: t("story.radio") }), radioText);
  const controls = el("div", { class: "walk-controls" });
  const fab = el("div", { class: "walk-fab" });
  let nudged = false, stopStarted = save.get().activeSeconds;
  const map = minimap(() => { const c = stop(); return c ? placeOf(c.npc).node : placeOf("chief").node; }, () => state().lamps,
    () => DATA.map.walk.characters.map((c) => ({ node: placeOf(c.id).node, main: c.id === stop()?.npc })));
  let mapOn = true;
  const view = el("div", { class: "walk-screen" }, hud, radio, map.root, controls, fab, dialog);
  root.append(view);

  const state = () => save.get();
  const stop = () => currentStop(st, state());
  const facts = () => storyFacts(st, state()).size;
  const npcName = (id: string) => t(DATA.map.walk.characters.find((c) => c.id === id)?.name ?? id);
  const placeOf = (npc: string) => {
    const c = DATA.map.walk.characters.find((x) => x.id === npc)!;
    return npcPlace(st, currentChapter(st, state()).id, npc, { node: c.node, offset: c.offset });
  };
  const nodeLabel = (node: string) => t(DATA.map.walk.nodes.find((n) => n.id === node)?.label ?? node);
  const lampNodes = Object.keys(st.lamps.notes);

  function placeAll() {
    const places: Record<string, { node: string; offset?: [number, number] }> = {};
    for (const c of DATA.map.walk.characters) places[c.id] = placeOf(c.id);
    placeCharacters(places);
    setLamps(lampNodes, state().lamps);
  }

  /* ---------- hộp thoại ---------- */
  function closeDialog() {
    dialog.classList.remove("walk-ending");
    dialogOpen = false; dialog.hidden = true; hud.inert = false; controls.inert = false; fab.inert = false; pauseWalk(false);
    render();
    hud.querySelector<HTMLButtonElement>("[data-talk]")?.focus({ preventScroll: true });
  }
  function openDialog(focusTop = false, canClose = true) {
    closable = canClose;
    dialogOpen = true; held.clear(); walkAxis(0, 0); pauseWalk(true); hud.inert = true; controls.inert = true; fab.inert = true; stick.release(); dialog.hidden = false;
    dialog.scrollTop = 0;
    requestAnimationFrame(() => {
      if (focusTop) { dialog.tabIndex = -1; dialog.focus({ preventScroll: true }); }
      else dialog.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus({ preventScroll: true });
    });
  }
  /** Lật từng câu thoại; xong thì gọi `done`. */
  function lines(pages: StoryLine[], done: () => void, kicker: string, canClose = true) {
    if (!pages.length) { done(); return; }
    let index = 0;
    const page = () => {
      const line = pages[index];
      if (dialogueLog.at(-1) !== line) { dialogueLog.push(line); if (dialogueLog.length > 80) dialogueLog.shift(); }
      dialog.replaceChildren(el("p", { class: "kicker", text: t(kicker) }),
        el("div", { class: "dialogue-speaker" }, icon("guest", 22), el("b", { text: t(line.speaker) })),
        rich(t(line.text), "p", { class: "dialogue-prose", "aria-live": "polite" }),
        el("div", { class: "row" }, btn(t("story.dialogue.next"), () => { if (++index < pages.length) page(); else done(); }, "primary", { "data-dialogue-next": true }),
          canClose ? btn(t("story.dialogue.close"), closeDialog, "ghost") : null));
      dialog.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    };
    page(); if (!dialogOpen) openDialog(false, canClose); else closable = canClose;
  }

  /* ---------- HUD ---------- */
  function render() {
    const s = state(), cur = stop(), chapter = currentChapter(st, s);
    setStoryTime(storyTime(st, s));
    placeAll();
    const target = cur ? placeOf(cur.npc).node : placeOf("chief").node;
    walkTarget(target);
    radioText.textContent = t(chapter.travel);
    const unread = Math.max(0, deriveChat() - s.chatSeen);
    const talk = btn(t("story.talk"), () => interact(), "primary", { disabled: true, "data-talk": true }, "chat");
    const tool = (label: string, fn: () => void, ic: Parameters<typeof btn>[4], attrs: Record<string, string | boolean>, extra = "") =>
      btn(label, fn, `small ghost tool${extra}`, { "aria-label": label, title: label, ...attrs }, ic);
    hud.replaceChildren(
      el("div", { class: "row hud-top" }, tool(t("ui.home"), () => reset("title"), "back", {}),
        el("p", { class: "kicker hud-chapter", text: t(chapter.title) }),
        el("small", { class: "muted hud-progress", text: t("story.ui.progress", { n: Math.min(s.step, st.stops.length), max: st.stops.length }) })),
      el("h2", { class: "display", text: cur ? t(cur.title) : t("story.ui.finale") }),
      el("p", { class: "walk-objective", "data-objective": true, text: cur ? `${t(cur.objective)} · ${nodeLabel(target)}` : t("story.ui.done") }),
      el("div", { class: "row hud-actions" }, btn(t("story.travel"), () => { held.clear(); walkAxis(0, 0); walkTo(target); nudged = true; }, "small", { "data-travel": true }, "route"), talk,
        ...(cur ? [] : [btn(t("story.ui.finale"), () => finale(), "primary", { "data-finale": true }, "play")])),
      el("small", { class: "muted hud-near", "data-nearby-npc": true }),
      el("div", { class: "row walk-tools" },
        tool(t("story.ui.notebook", { n: storyEvidence(st, s).length }), () => notebook("evidence"), "book", { "data-notebook": true }),
        tool(t("story.ui.chat", { n: unread }), chat, "chat", { "data-chat": true }, unread ? " has-unread" : ""),
        tool(t("story.ui.lampCount", { n: s.lamps.length, max: st.lamps.need }), () => notebook("lamps"), "lamp", { "data-lamp-count": true })),
      el("details", { class: "hud-more" }, el("summary", { text: t("story.ui.more") }),
        el("small", { class: "muted", text: t(DATA.story.difficulties[difficulty()].name) }),
        el("small", { class: "muted", text: t(DATA.map.atmosphere.filter((f) => f.step <= storyTime(st, s)).at(-1)!.label), "data-time-of-day": true }),
        el("small", { class: "muted", text: t("story.ui.keys") })));
    fab.replaceChildren(); fab.dataset.mode = "";
    map.draw();
    if (developerMode()) hud.querySelector(".hud-more")!.append(devTools());
    syncInteraction();
  }
  const deriveChat = () => st.messages.filter((m) => m.requires.every((r) => flagsNow().has(r))).length;
  const flagsNow = () => deriveFlags(st, state());

  function devTools() {
    const box = el("details", { class: "dev-tools" }, el("summary", { text: t("story.hack") }));
    box.append(el("p", { class: "small muted", text: t("story.ui.devEndings") }));
    const row = el("div", { class: "row" });
    for (const id of ENDING_IDS) row.append(btn(id, () => { void showEnding({ id, variant: id === "E2" ? "version" : null, risk: 0, contributions: [] }, true); }, "small", { "data-dev-ending": id }));
    for (const v of ["notes", "final", "extra"] as E2Variant[]) row.append(btn(t("story.ui.devVariant", { name: t(st.endings.E2.variants![v].title) }), () => { void showEnding({ id: "E2", variant: v, risk: 0, contributions: [] }, true); }, "small"));
    box.append(row, el("p", { class: "small muted", text: t("story.ui.devJump") }));
    st.stops.forEach((x, i) => box.append(btn(`${i + 1}. ${t(x.title)}`, () => { save.replace(fastForward(st, { ...state(), step: Math.min(state().step, i) }, i)); render(); walkTo(placeOf(x.npc).node); }, "small wide")));
    box.append(btn(t("story.ui.finale"), () => { save.replace(fastForward(st, state(), st.stops.length)); render(); }, "small wide"));
    return box;
  }

  /* ---------- tương tác ---------- */
  function syncInteraction() {
    const cur = stop();
    const npc = nearbyCharacter(cur?.npc);
    const talk = hud.querySelector<HTMLButtonElement>("[data-talk]");
    const name = hud.querySelector<HTMLElement>("[data-nearby-npc]");
    if (talk) { talk.disabled = !npc; talk.dataset.npc = npc?.id ?? ""; }
    if (name) name.textContent = npc ? t("story.ui.near", { name: t(npc.name) }) : t("story.ui.far");
    // Nút hành động lớn cho ngón cái (góc phải dưới): trò chuyện hoặc thắp đèn, tùy chỗ đang đứng.
    const lampNode = lampHere();
    const mode = npc ? `talk:${npc.id}` : lampNode ? `lamp:${lampNode}` : "";
    if (fab.dataset.mode !== mode) {
      fab.dataset.mode = mode;
      fab.replaceChildren(...(npc ? [btn(t("story.ui.talkTo", { name: t(npc.name).split(" · ")[0] }), () => interact(npc.id), "primary big", { "data-fab": "talk" }, "chat")]
        : lampNode ? [btn(t("story.ui.lamp"), lightLamp, "big", { "data-fab": "lamp", "data-lamp": true }, "lamp")] : []));
    }
  }
  const lampHere = () => lampNodes.find((n) => nearNode(n) && !state().lamps.includes(n)) ?? null;

  function lightLamp() {
    const n = lampHere();
    if (!n) return;
    save.set({ lamps: [...state().lamps, n] });
    setLamps(lampNodes, state().lamps);
    radioText.textContent = t(st.lamps.notes[n]);
    const count = state().lamps.length;
    toast(t("story.ui.lampLit"), count === st.lamps.need ? t("story.ui.lampDone", { n: count }) : t("story.ui.lampCount", { n: count, max: st.lamps.need }), "info");
    checkAchievements();
    render();
  }

  function interact(id?: string) {
    if (showing || dialogOpen) return;
    const cur = stop();
    const near = id ? (nearCharacter(id) ? DATA.map.walk.characters.find((c) => c.id === id) : null) : nearbyCharacter(cur?.npc);
    if (!near) return;
    if (cur && near.id === cur.npc) { runStop(cur); return; }
    if (!cur && near.id === "chief") { finale(); return; }
    chatWith(near.id);
  }

  /** Trò chuyện ngoài việc chính: thoại theo chương (kèm gọi lại lựa chọn cũ), chủ đề hỏi, chỉ đường. */
  function chatWith(npc: string) {
    const pages = ambientLines(st, state(), npc).map((text) => ({ speaker: `story.npc.${npc}`, text }));
    lines(pages, () => topicMenu(npc), "story.ambient.title");
  }
  function topicMenu(npc: string) {
    const s = state(), flags = deriveFlags(st, s), cur = stop();
    const topics = st.npcs[npc]?.topics.filter((tp) => topicAvailable(tp, flags, facts())) ?? [];
    const box = el("div", { class: "walk-choices" });
    dialog.replaceChildren(el("p", { class: "kicker", text: t("story.ui.topics") }), el("h2", { class: "display", text: npcName(npc) }), box);
    for (const tp of topics) {
      const key = `${npc}.${tp.id}`, asked = s.topics.includes(key);
      box.append(btn(`${t(tp.label)}${asked ? ` · ${t("story.ui.asked")}` : ""}`, () => {
        if (!asked) { save.set({ topics: [...state().topics, key] }); checkAchievements(); }
        const before = storyFacts(st, s);
        lines(tp.lines, () => rewards({}, () => topicMenu(npc), before), tp.label);
      }, `wide${asked ? " ghost" : ""}`, { "data-topic": key }));
    }
    if (!topics.length) box.append(el("p", { class: "muted", text: t("story.ui.noTopics") }));
    if (cur) box.append(btn(t("story.ui.goTo", { place: nodeLabel(placeOf(cur.npc).node) }), () => { closeDialog(); walkTo(placeOf(cur.npc).node); }, "", {}, "route"));
    box.append(btn(t("story.close"), closeDialog, "ghost"));
    openDialog(true);
  }

  /* ---------- điểm dừng chính ---------- */
  function runStop(s0: Stop) {
    const bond = st.bondScenes[s0.id]?.[state().bond];
    const pages = [...s0.lines, ...(bond?.lines ?? [])];
    if (solvedThisSession.has(s0.id)) { afterActivity(s0); return; }
    lines(pages, () => activity(s0), currentChapter(st, state()).title);
  }

  function activity(s0: Stop) {
    const a = s0.activity;
    if (!a) { afterActivity(s0); return; }
    if (DIALOG_ACTIVITIES.includes(a.type)) {
      mountActivity({ body: dialog, easy: difficulty() === "easy", onSolved: () => { solvedThisSession.add(s0.id); afterActivity(s0); }, onLeave: closeDialog }, a);
      openDialog(true);
      return;
    }
    // Câu đố của mô-đun có sẵn: mở màn chơi riêng, quay lại thì tiếp tục.
    const levelId = a.type === "mapgraph" ? storyLevelId(s0.id) : (a.levels as Record<string, string>)[difficulty()];
    const level = DATA.levels.get(levelId);
    if (!level) { afterActivity(s0); return; }
    const handwritten = DATA.journey.some((l) => l.id === levelId);
    dialog.replaceChildren(el("p", { class: "kicker", text: t("story.ui.levelNote") }), el("h2", { class: "display", text: t(a.title) }),
      el("p", { text: t(a.note) }),
      el("div", { class: "row" }, btn(t("story.ui.startActivity"), () => {
        closeDialog();
        resumeAfterLevel = null;
        go("level", {
          id: levelId, mode: handwritten || a.type === "mapgraph" ? "journey" : "practice", key: handwritten || a.type === "mapgraph" ? levelId : `p:${levelId}`,
          casual: difficulty() === "easy" && Boolean(level.casual),
          storyNote: { title: a.title, intro: a.note, payoff: "story.ui.levelPayoff" },
          onSolved: () => { resumeAfterLevel = s0.id; solvedThisSession.add(s0.id); },
          next: { label: t("story.ui.backToStory"), go: () => back("walk") },
        });
      }, "primary", { "data-start-level": levelId }, "play"), btn(t("story.ui.later"), closeDialog, "ghost")));
    openDialog();
  }

  function afterActivity(s0: Stop) {
    const dec = s0.decision ? st.decisions[s0.decision] : null;
    if (!dec) { finishStop(s0); return; }
    const opts = decisionOptions(dec, facts());
    const box = el("div", { class: "walk-choices" });
    dialog.replaceChildren(el("p", { class: "kicker", text: t("story.ui.decide") }), el("h2", { class: "display", text: t(s0.title) }),
      el("div", { class: "dialogue-speaker" }, icon("guest", 22), el("b", { text: npcName(dec.speaker) })), el("p", { class: "walk-question", text: t(dec.prompt) }), box);
    for (const o of dec.options) {
      const open = opts.includes(o);
      box.append(btn(open ? t(o.text) : `${t(o.text)} · ${t("story.ui.decisionLocked")}`, () => {
        save.set({ decisions: { ...state().decisions, [s0.decision!]: o.id } });
        lines([{ speaker: `story.npc.${dec.speaker}`, text: o.reply }], () => finishStop(s0), "story.ui.decide", false);
      }, "wide narrative-choice", { disabled: !open, "data-decision": `${s0.decision}:${o.id}` }));
    }
    openDialog(true, false);
  }

  function finishStop(s0: Stop) {
    lines(s0.after, () => {
      const before = { ev: storyEvidence(st, state()), items: storyItems(st, state()), facts: storyFacts(st, state()) };
      save.set({ step: state().step + 1 });
      nudged = false; stopStarted = state().activeSeconds; buzz();
      solvedThisSession.delete(s0.id);
      checkAchievements();
      const gained = { evidence: storyEvidence(st, state()).filter((x) => !before.ev.includes(x)), items: storyItems(st, state()).filter((x) => !before.items.includes(x)) };
      rewards(gained, () => { closeDialog(); const next = stop(); if (next) walkTo(placeOf(next.npc).node); }, before.facts);
    }, s0.title, false);
  }

  /** Bảng "Đã ghi vào Sổ": bằng chứng, vật phẩm, sự thật mới. */
  function rewards(g: { evidence?: string[]; items?: string[] }, done: () => void, factsBefore: Set<number>) {
    const factRows = DATA.facts.filter((f) => storyFacts(st, state()).has(f.circuit) && !factsBefore.has(f.circuit));
    const rows = [
      ...(g.evidence ?? []).map((id) => el("article", { class: "journal-entry" }, el("small", { class: "kicker", text: t("story.ui.evidenceNew") }), el("b", { text: t(st.evidence[id].title) }), rich(t(st.evidence[id].text)))),
      ...(g.items ?? []).map((id) => el("article", { class: "journal-entry" }, el("small", { class: "kicker", text: t("story.ui.itemNew") }), el("b", { text: t(st.items[id].title) }), el("p", { text: t(st.items[id].text) }))),
      ...factRows.map((f) => el("article", { class: "journal-entry" }, el("small", { class: "kicker", text: t("story.ui.factNew") }), el("b", { text: f.title }), rich(f.text))),
    ];
    if (!rows.length) { done(); return; }
    dialog.replaceChildren(el("p", { class: "kicker", text: t("story.ui.chapterDone") }), ...rows, btn(t("story.ui.continue"), done, "primary", { "data-story-continue": true }));
    openDialog(true, false);
  }

  /* ---------- Sổ, nhóm ---------- */
  function notebook(tab: NotebookTab | "log") {
    const tabs = el("div", { class: "tab-row", role: "tablist" }, ...NOTEBOOK_TABS.map((k) => btn(t(`story.ui.tab.${k}`), () => notebook(k), `small${k === tab ? " primary" : " ghost"}`, { role: "tab", "aria-selected": String(k === tab), "data-tab": k })));
    tabs.append(btn(t("story.ui.tab.log"), () => notebook("log"), `small${tab === "log" ? " primary" : " ghost"}`, { role: "tab", "aria-selected": String(tab === "log"), "data-tab": "log" }));
    const content = tab === "log"
      ? (dialogueLog.length ? el("ol", { class: "chat-list" }, ...dialogueLog.map((l) => el("li", {}, el("b", { text: t(l.speaker) }), el("p", { text: t(l.text) })))) : el("p", { class: "muted", text: t("story.ui.logEmpty") }))
      : notebookContent(state(), tab);
    dialog.replaceChildren(el("p", { class: "kicker", text: t(state().bond === "listen" ? "story.ui.bondNote.listen" : "story.ui.bondNote.build") }),
      el("h2", { class: "display", text: t("story.ui.notebook", { n: storyEvidence(st, state()).length }) }), tabs, content, btn(t("story.ui.close"), closeDialog, "primary"));
    openDialog(true);
  }
  function chat() {
    const content = chatContent(state());
    save.set({ chatSeen: deriveChat() });
    dialog.replaceChildren(el("h2", { class: "display", text: t("story.ui.chatTitle") }), content, btn(t("story.ui.close"), closeDialog, "primary"));
    openDialog(true);
  }

  /* ---------- mở đầu ---------- */
  function prologue() {
    lines(st.prologue, () => {
      dialog.replaceChildren(el("h2", { class: "display", text: t("story.prologue.title") }), el("p", { text: t(st.intro) }), el("p", { class: "walk-question", text: t(st.bondChoice.prompt) }));
      for (const bond of ["listen", "build"] as const) dialog.append(btn(t(st.bondChoice[bond].text), () => {
        save.set({ introSeen: true, bond });
        checkAchievements();
        lines([{ speaker: "story.npc.chief", text: st.bondChoice[bond].reply }], () => { closeDialog(); walkTo(placeOf(stop()!.npc).node); }, "story.prologue.title", false);
      }, "wide narrative-choice", { "data-bond": bond }));
      dialog.querySelector<HTMLButtonElement>("button")?.focus();
    }, "story.prologue.title", false);
  }

  /* ---------- Đêm Hội tụ và kết cục ---------- */
  function finale() {
    if (showing) return;
    if (!storyComplete(st, state())) { lines([{ speaker: "story.npc.chief", text: "story.ui.finaleLocked" }], closeDialog, "story.ui.finale"); return; }
    const r = pickEnding(st, DATA.config.endings, state().decisions, facts());
    void showEnding(r, false);
  }

  async function showEnding(r: EndingResult, preview: boolean) {
    if (dialogOpen) { dialog.hidden = true; dialogOpen = false; }
    showing = true; held.clear(); walkMode(false); hud.hidden = controls.hidden = radio.hidden = fab.hidden = map.root.hidden = true;
    const def = st.endings[r.id];
    const caption = el("p", { class: "walk-caption panel", role: "status" }, el("span", { text: t("story.ui.showing") }));
    if (def.caption) caption.append(el("span", { class: "ending-caption", text: ` ${t(def.caption)}` }));
    if (settings.get().reduceLights) caption.append(el("small", { class: "muted", text: ` ${t("story.ui.reduced")}` }));
    caption.append(btn(t("story.ui.skip"), () => skipShow(), "small", { "data-skip": true }));
    view.append(caption);
    caption.querySelector<HTMLButtonElement>("[data-skip]")?.focus();
    const lit = Math.max(3, new Set([...P.get().lit, ...P.get().casualLit, ...storyFacts(st, state())]).size);
    await playShow(Math.min(7, lit), DATA.circuits.map((c) => c.color), { id: r.id, variant: r.variant });
    if (disposed) return;
    caption.remove();
    if (!preview || developerMode()) {
      const seen = state().endingsSeen.includes(r.id) ? state().endingsSeen : [...state().endingsSeen, r.id];
      save.set({ endingsSeen: seen, lastEnding: r.id }); save.flush(); checkAchievements();
    }
    const actions = [
      btn(t("story.ui.rewind"), () => { endShow(); save.replace(rewindTo(st, state(), "s13")); afterShow(); walkTo(placeOf("duc").node); }, "primary", { "data-rewind": true }, "restart"),
      btn(t("story.ui.again"), () => { endShow(); save.reset(); save.set({ introSeen: false }); resetWalkPosition(); reset("walk"); }, "", { "data-again": true }),
      btn(t("story.ui.library"), () => { dialog.replaceChildren(el("h2", { class: "display", text: t("story.ui.library") }), endingLibrary(state()), btn(t("story.ui.back"), () => { void reopen(); }, "primary")); }, "ghost", {}, "trophy"),
      btn(t("story.ui.home"), () => reset("title"), "ghost"),
    ];
    const reopen = async () => { dialog.replaceChildren(endingPanel(state(), r, preview, actions)); };
    dialog.classList.add("walk-ending");
    dialog.replaceChildren(endingPanel(state(), r, preview, actions));
    dialog.hidden = false; dialogOpen = true; closable = false; dialog.scrollTop = 0;
    dialog.querySelector<HTMLButtonElement>("button")?.focus();
  }
  function afterShow() {
    showing = false; hud.hidden = controls.hidden = radio.hidden = fab.hidden = false; map.root.hidden = !mapOn;
    dialog.classList.remove("walk-ending"); dialog.hidden = true; dialogOpen = false;
    walkMode(true); render();
  }

  /* ---------- điều khiển ---------- */
  const mappings: Record<string, [number, number]> = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
  function applyHeld() { let x = 0, z = 0; for (const code of held) { x += mappings[code][0]; z += mappings[code][1]; } walkAxis(x, z); }
  const keydown = (e: KeyboardEvent) => {
    if (e.code === "Tab" && dialogOpen) {
      const buttons = [...dialog.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), summary")];
      if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0]?.focus(); }
    }
    if (e.key === "Escape" && dialogOpen && closable && !showing) { e.preventDefault(); closeDialog(); return; }
    if (dialogOpen || showing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (mappings[e.code]) { e.preventDefault(); held.add(e.code); applyHeld(); }
    if (e.code === "KeyE" && !e.repeat) { e.preventDefault(); interact(); }
    if (e.code === "KeyL" && !e.repeat) { e.preventDefault(); lightLamp(); }
    if (e.code === "KeyJ" && !e.repeat) { e.preventDefault(); notebook("evidence"); }
    if (e.code === "KeyM" && !e.repeat) { e.preventDefault(); mapOn = !mapOn; map.root.hidden = !mapOn; }
  };
  const keyup = (e: KeyboardEvent) => { held.delete(e.code); if (mappings[e.code]) applyHeld(); };
  const blur = () => { held.clear(); walkAxis(0, 0); };
  const visibility = () => { if (document.hidden) { blur(); pauseWalk(true); } else if (!dialogOpen && !showing) pauseWalk(false); };
  const stick = joystick(t("story.ui.joystick"), (x, z) => { if (showing || dialogOpen) return; walkAxis(x, z); });
  controls.append(stick.root);
  document.addEventListener("keydown", keydown); document.addEventListener("keyup", keyup); window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
  const offInteraction = onCharacterInteraction((id) => interact(id));
  const timer = window.setInterval(syncInteraction, 120);
  // Nhắc chủ động: đi lòng vòng hơn 75 giây ở một việc thì đài nhắc chỗ cần tới (không phạt, không đếm ngược).
  const clock = window.setInterval(() => {
    if (document.hidden || showing) return;
    save.set({ activeSeconds: state().activeSeconds + 1 });
    const cur = stop();
    if (cur && !dialogOpen && !nudged && state().activeSeconds - stopStarted > 75) {
      nudged = true;
      radioText.textContent = t("story.ui.nudge", { name: npcName(cur.npc), place: nodeLabel(placeOf(cur.npc).node) });
      hud.querySelector("[data-travel]")?.classList.add("pulse");
    }
  }, 1000);

  // Móc cho kịch bản kiểm tự động (web/scripts/story-e2e.mjs): giải câu đố của màn chơi riêng mà không mở màn đó.
  Object.assign(window, { __walkTest: { solveActivity: () => { const s0 = stop(); if (s0) { solvedThisSession.add(s0.id); afterActivity(s0); } }, interact, finale } });
  render();
  if (resumeAfterLevel && stop()?.id === resumeAfterLevel) { const s0 = stop()!; resumeAfterLevel = null; afterActivity(s0); }
  else lines([{ speaker: "story.dialogue.narrator", text: "notice.choices" }], () => {
    if (!state().introSeen) prologue();
    else if (legacyNote) lines([{ speaker: "story.dialogue.narrator", text: "story.ui.legacy" }], closeDialog, "story.title");
    else closeDialog();
  }, "notice.title", false);
  return () => {
    disposed = true; offInteraction(); map.destroy(); delete (window as unknown as Record<string, unknown>).__walkTest; clearInterval(timer); clearInterval(clock); skipShow();
    document.removeEventListener("keydown", keydown); document.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
    endShow(); walkMode(false);
  };
}

export type { EndingId };
