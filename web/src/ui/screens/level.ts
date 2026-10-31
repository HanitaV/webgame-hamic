import { difficultyProfile } from "../../game/play";
/**
 * The level shell (GDD 3.1, 9.1): đề → thao tác → Chạy thử → quan sát → điều chỉnh → sao.
 * Unlimited runs, free hints (no star lost), no countdown, grey lights and numbers when not yet there.
 */

import { sfx } from "../../core/audio";
import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { completeLevel, noteHint, noteRun, setFlag, type Mode } from "../../game/progress";
import { settings } from "../../game/settings";
import type { EvalResult, Level, Stars } from "../../game/types";
import { evaluate } from "../../puzzles/logic/index";
import { VIEWS } from "../../puzzles/views/index";
import { refreshWorld } from "../shell";
import { btn, el, starRow, tia } from "../dom";
import { rich } from "../rich";
import { modal, tiaLine, toast } from "../overlay";
import { back, type Params } from "../router";

export interface LevelParams extends Params {
  id: string;
  mode: Mode;
  /** Progress key (defaults to the id). */
  key?: string;
  casual?: boolean;
  /** Label + action for the "next" button in the result panel. */
  next?: { label: string; go: () => void };
  /** Called after a successful run, before the result panel. */
  onSolved?: (res: EvalResult, runs: number) => void;
  /** Replace the result panel entirely (Đêm Hội tụ steps, Khách). */
  afterSolve?: (res: EvalResult) => void;
  backLabel?: string;
  onBack?: () => void;
}

export function starTexts(level: Level, casual: boolean): string[] {
  if (level.starText && !casual) return level.starText;
  const maxRuns = level.stars?.star3?.maxRuns ?? DATA.config.defaultMaxRuns;
  const base = [t("star.done"), t("star.precise")];
  if (casual) return base;
  if (level.module === "block-vm") return [...base, t("star.blocks", { n: level.stars?.star3?.maxBlocks ?? "?" })];
  return [...base, t("star.runs", { n: maxRuns })];
}

export function screenLevel(root: HTMLElement, p: Params) {
  const params = p as LevelParams;
  const level = DATA.levels.get(params.id);
  if (!level) { back(); return; }
  const casual = Boolean(params.casual);
  const assisted = settings.get().assist || difficultyProfile().assist;
  /** Lời dẫn của điểm dừng trong truyện (khóa i18n), hoặc lời dẫn của mode. */
  const activity = (params.storyNote as { title: string; intro: string; payoff: string } | undefined) ?? DATA.story.modes[params.mode]?.activities?.[params.storyActivity ?? level.module];
  const key = params.key ?? level.id;
  const mount = VIEWS[level.module];
  if (!mount) { back(); return; }
  let runs = 0, fails = 0, hintTier = 0;
  let busy = false;

  const prompt = casual && level.casual ? level.casual.prompt : level.prompt;
  const hints = casual && level.casual ? level.casual.hints : level.hints;
  const title = level.title ? `${level.id.length <= 4 ? `${level.id} · ` : ""}${level.title}` : t(`module.${level.module}`);

  const hintBtn = btn(t("level.hint", { n: 0, max: hints.length }), () => openHint(), "small", { "aria-keyshortcuts": "H" }, "bulb");
  const topbar = el("header", { class: "topbar" },
    btn(params.backLabel ?? t("ui.back"), () => (params.onBack ? params.onBack() : back()), "small ghost", { "aria-keyshortcuts": "Escape" }, "back"),
    el("h1", { class: "display level-title" }, level.circuit ? el("span", { class: "title-dot", style: `--c:${DATA.circuits.find((c) => c.id === level.circuit)?.color ?? "#fff"}` }) : null, el("span", { text: title })),
    el("div", { class: "goal-stars", title: starTexts(level, casual).join(" · ") }, starRow([false, false, false], 18, casual ? 2 : 3)),
    hintBtn);

  const controls = el("div", { class: "controls" });
  const runBtn = btn(t("level.run"), () => run(), "primary big run", { "aria-keyshortcuts": "Enter" }, "play");
  const kbd = (k: string, label: string) => el("span", { class: "kbd-item" }, el("kbd", { text: k }), el("span", { text: label }));
  const keys = el("p", { class: "kbd-hints", "aria-hidden": "true" }, kbd("Enter", t("level.run")), kbd("H", t("level.hintKey")), kbd("Esc", t("ui.back")));
  const left = el("aside", { class: "level-left panel" }, activity ? el("div", { class: "mode-level-note" }, el("b", { text: t(activity.title) }), el("p", { text: t(activity.intro) })) : null, rich(prompt, "p", { class: "prompt" }), controls, runBtn, keys);
  const stageHost = el("div", { class: "stage-host" });
  const tiaHost = el("div", { class: "tia-host" });
  tiaHost.append(tiaLine(t("level.tiaStart")));
  const stage = el("section", { class: "level-stage stage-frame", "aria-label": t("level.stage") }, stageHost, tiaHost);
  const hintBox = el("div", { class: "hint-box panel", hidden: true, role: "region", "aria-label": t("level.hintTitle") });
  stage.append(hintBox);
  root.append(el("div", { class: "screen level-screen" }, topbar, el("div", { class: "level-body" }, left, stage)));

  const view = mount({ level, casual, lab: false, controls, stage: stageHost, changed: () => undefined });

  function openHint() {
    if (hintTier < hints.length) hintTier += 1;
    noteHint(key, hintTier);
    hintBtn.querySelector("span")!.textContent = t("level.hint", { n: hintTier, max: hints.length });
    hintBox.hidden = false;
    hintBox.replaceChildren(
      el("div", { class: "hint-head" }, tia(28), el("b", { text: t("level.hintTitle") }), btn("", () => (hintBox.hidden = true), "tiny ghost", { "aria-label": t("ui.close") }, "close")),
      ...hints.slice(0, hintTier).map((h, i) => { const p = rich(h, "p"); p.prepend(el("b", { text: `${i + 1}. ` })); return p; }),
      hintTier < hints.length ? btn(t("level.moreHint"), () => openHint(), "small") : el("p", { class: "muted", text: t("level.noMoreHint") }));
  }

  function run() {
    if (busy) return;
    busy = true;
    runs += 1;
    noteRun(key);
    const res = evaluate(level!, view.solution(), {
      runs, assist: assisted, casual, maxRuns: DATA.config.defaultMaxRuns, toleranceFactor: DATA.config.assist.toleranceFactor,
    });
    const dur = view.show(res);
    window.setTimeout(() => {
      busy = false;
      tiaHost.replaceChildren(tiaLine(res.message, res.ok ? "happy" : "calm"));
      stage.classList.toggle("dim", !res.ok);
      if (!res.ok) {
        sfx.notYet();
        fails += 1;
        if (assisted && fails >= DATA.config.assist.autoHintAfterFails && hintTier === 0) openHint();
        return;
      }
      sfx.ok();
      params.onSolved?.(res, runs);
      if (params.afterSolve) { params.afterSolve(res); return; }
      finish(res);
    }, dur);
  }

  function finish(res: EvalResult) {
    const stars: Stars = casual ? [res.stars[0], res.stars[1], false] : res.stars;
    const lit = completeLevel(key, level!, stars, params.mode);
    if (params.mode === "casual") setFlag("playedCasual");
    refreshWorld();
    const texts = starTexts(level!, casual);
    const rows = el("ul", { class: "star-list" });
    texts.forEach((txt, i) => {
      const li = el("li", { class: stars[i] ? "on" : "off" }, starRow([stars[i]], 24, 1), el("span", { text: txt }));
      li.style.animationDelay = `${i * 220}ms`;
      rows.append(li);
      if (stars[i]) window.setTimeout(() => sfx.star(i), i * 220);
    });
    const actions: HTMLElement[] = [btn(t("level.retry"), () => { close(); }, "")];
    if (casual && DATA.glossary[level!.module]) {
      actions.push(btn(t("casual.glossaryBtn"), () => {
        setFlag("glossaryOpened");
        const g = DATA.glossary[level!.module];
        const c2 = modal({ title: g.name, body: [el("p", { text: g.text }), el("p", { class: "muted", text: g.more })], actions: [btn(t("ui.close"), () => c2(), "")] });
      }, ""));
    }
    if (params.next) actions.push(btn(params.next.label, () => { close(); params.next!.go(); }, "primary", { "data-autofocus": true }));
    else actions.push(btn(t("ui.back"), () => { close(); back(); }, "primary", { "data-autofocus": true }));
    const close = modal({
      title: lit ? t("level.circuitLit", { name: DATA.circuits.find((c) => c.id === lit)?.name ?? "" }) : t("level.done"),
      body: [...(activity ? [el("p", { class: "mode-payoff", text: t(activity.payoff) })] : []), rows, tiaLine(res.message, "happy")],
      actions,
    });
    if (lit) {
      sfx.light();
      toast(t("toast.factTitle"), t("toast.factText"), "info");
    }
  }

  const onKey = (e: KeyboardEvent) => {
    if (document.querySelector(".modal-layer, .keypad-layer")) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); run(); }
    if (e.key.toLowerCase() === "h") openHint();
    if (e.key === "Escape") { e.preventDefault(); params.onBack ? params.onBack() : back(); }
  };
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("keydown", onKey);
    view.destroy();
  };
}
