/**
 * Giao diện các minigame mới trong truyện (STORY_BIBLE mục 6). Luật chấm ở puzzles/logic/activities.ts.
 * Không đồng hồ, không phạt; ba bậc gợi ý; mọi nút bấm được bằng chạm và bàn phím; dùng được ở 844×390.
 */

import { sfx } from "../../core/audio";
import { t, num } from "../../core/i18n";
import type { Activity } from "../../puzzles/logic/story";
import { evalCauses, evalCaptions, evalSync, evalTiming, evalTopo, evalVersions, timingWindow, type TimingCfg } from "../../puzzles/logic/activities";
import { btn, el, icon, type IconName } from "../dom";
import { rich } from "../rich";
import { INK, roundRect, stageCanvas, pixelText } from "../widgets";
import { slider } from "../widgets";

export interface ActivityHost {
  /** Phần thân hộp thoại để vẽ minigame. */
  body: HTMLElement;
  easy: boolean;
  onSolved: () => void;
  onLeave: () => void;
}

type Check = () => { ok: boolean; message: string };

/** Khung chung: tiêu đề, đề bài, vùng chơi, dòng phản hồi, gợi ý ba bậc, nút Kiểm tra/Để sau. */
function frame(host: ActivityHost, a: Activity, area: HTMLElement, check: Check, checkLabel = t("story.ui.check")) {
  const hints = (host.easy && a.hintsEasy ? a.hintsEasy : a.hints) as string[];
  let tier = 0;
  const feedback = el("p", { class: "activity-feedback", role: "status", "aria-live": "polite" });
  const hintBox = el("div", { class: "activity-hints", hidden: true });
  const hintBtn = btn(t("story.ui.hint", { n: 0, max: hints.length }), () => {
    tier = Math.min(hints.length, tier + 1);
    hintBtn.querySelector("span")!.textContent = t("story.ui.hint", { n: tier, max: hints.length });
    hintBox.hidden = false;
    hintBox.replaceChildren(el("b", { text: t("story.ui.hintTitle") }), ...hints.slice(0, tier).map((h, i) => rich(`${i + 1}. ${t(h)}`)));
  }, "small", { "data-activity-hint": true }, "bulb");
  const checkBtn = btn(checkLabel, () => {
    const r = check();
    feedback.textContent = r.message;
    feedback.classList.toggle("good", r.ok);
    if (r.ok) {
      sfx.ok();
      checkBtn.disabled = true;
      host.body.querySelectorAll<HTMLButtonElement>(".activity-area button, .activity-area input").forEach((b) => (b.disabled = true));
      const next = btn(t("story.ui.continue"), host.onSolved, "primary", { "data-activity-continue": true });
      actions.replaceChildren(next); next.focus();
    } else sfx.notYet();
  }, "primary", { "data-activity-check": true });
  const actions = el("div", { class: "row activity-actions" }, checkBtn, hintBtn, btn(t("story.ui.later"), host.onLeave, "ghost"));
  host.body.replaceChildren(
    el("p", { class: "kicker", text: t("story.ui.levelNote") }),
    el("h2", { class: "display", text: t(a.title) }),
    rich(t(host.easy && a.promptEasy ? a.promptEasy : a.prompt), "p", { class: "activity-prompt" }),
    area, feedback, hintBox, actions);
  area.classList.add("activity-area");
  return { feedback };
}

/* ---------- Hai bản cùng tên ---------- */
function versions(host: ActivityHost, a: Activity) {
  const [f1, f2] = a.files as { name: string; meta: string; lines: string[] }[];
  const A = f1.lines.map((k) => t(k)), B = f2.lines.map((k) => t(k));
  const picked = new Set<number>();
  const count = el("small", { class: "muted" });
  const sync = () => { count.textContent = t("story.ui.versions.diff", { n: picked.size }); };
  const col = (f: { name: string; meta: string }, lines: string[], pick: boolean) => el("div", { class: "version-col" },
    el("b", {}, icon("file", 16), el("span", { text: ` ${t(f.name)}` })), el("small", { class: "muted", text: t(f.meta) }),
    el("ol", { class: "version-lines" }, ...lines.map((line, i) => {
      if (!pick) return el("li", {}, el("code", { text: line }));
      const b = btn(line, () => { picked.has(i) ? picked.delete(i) : picked.add(i); b.setAttribute("aria-pressed", String(picked.has(i))); b.classList.toggle("on", picked.has(i)); sync(); }, "version-line", { "aria-pressed": "false", "data-version-line": i });
      return el("li", {}, b);
    })));
  const diffN = evalVersions(A, B, []).diff.length;
  const area = el("div", {}, el("div", { class: "version-grid" }, col(f1, A, false), col(f2, B, true)), count,
    host.easy ? el("small", { class: "muted", text: t("story.ui.versions.count", { n: diffN }) }) : null);
  sync();
  frame(host, a, area, () => {
    const r = evalVersions(A, B, [...picked]);
    return { ok: r.ok, message: r.ok ? t(a.success) : r.missing ? t("story.ui.versions.missing") : t("story.ui.versions.extra") };
  });
}

/* ---------- Bắt lỗi đồng bộ ---------- */
function sync(host: ActivityHost, a: Activity) {
  const folders = a.folders as { id: string; label: string; desc: string; role: string }[];
  const on = new Set<string>(a.start as string[]);
  const list = el("div", { class: "sync-list" });
  const draw = () => list.replaceChildren(...folders.map((f) => {
    const active = on.has(f.id);
    const b = btn(el("span", { class: "sync-row" }, el("code", { text: t(f.label) }), el("small", { class: "muted", text: t(f.desc) }), el("b", { class: active ? "good" : "muted", text: t(active ? "story.ui.sync.on" : "story.ui.sync.off") })),
      () => { active ? on.delete(f.id) : on.add(f.id); draw(); }, `sync-toggle${active ? " on" : ""}`, { "aria-pressed": String(active), "data-sync-folder": f.id });
    return b;
  }));
  draw();
  const area = el("div", {}, el("p", { class: "muted small" }, el("b", { text: `${t("story.ui.sync.rule")}: ` }), t(a.rule)), list);
  frame(host, a, area, () => {
    const r = evalSync(folders, [...on]);
    const name = (id: string) => t(folders.find((f) => f.id === id)!.label);
    const parts = [r.missing.length ? t("story.ui.sync.missing", { list: r.missing.map(name).join(", ") }) : "", r.junk.length ? t("story.ui.sync.junk", { list: r.junk.map(name).join(", ") }) : ""].filter(Boolean);
    return { ok: r.ok, message: r.ok ? t(a.success) : parts.join(" ") };
  }, t("story.ui.run"));
}

/* ---------- Ghép ảnh với lời ghi ---------- */
function captions(host: ActivityHost, a: Activity) {
  const photos = a.photos as { id: string; icon: IconName; label: string }[];
  const caps = a.captions as { id: string; photo: string; text: string }[];
  const pairs: Record<string, string> = {};
  let active: string | null = null;
  const status = el("small", { class: "muted" });
  const grid = el("div", { class: "caption-grid" });
  const draw = () => {
    const photoCol = el("div", { class: "caption-col" }, ...photos.map((p) => {
      const cap = caps.find((c) => c.id === pairs[p.id]);
      const b = btn(el("span", { class: "photo-tile" }, icon(p.icon, 26), el("b", { text: t(p.label) }), cap ? el("small", { text: `“${t(cap.text)}”` }) : null),
        () => { active = active === p.id ? null : p.id; draw(); }, `caption-photo${active === p.id ? " on" : ""}${cap ? " paired" : ""}`, { "aria-pressed": String(active === p.id), "data-photo": p.id });
      return b;
    }));
    const capCol = el("div", { class: "caption-col" }, ...caps.map((c) => {
      const owner = Object.keys(pairs).find((k) => pairs[k] === c.id);
      return btn(t(c.text), () => {
        if (!active) { status.textContent = t("story.ui.captions.pickPhoto"); return; }
        for (const k of Object.keys(pairs)) if (pairs[k] === c.id) delete pairs[k];
        pairs[active] = c.id; active = null; draw();
      }, `caption-text${owner ? " paired" : ""}`, { "data-caption": c.id, "aria-label": `${t(c.text)}${owner ? ` · ${t(photos.find((p) => p.id === owner)!.label)}` : ""}` });
    }));
    grid.replaceChildren(photoCol, capCol);
    status.textContent = t("story.ui.captions.paired", { n: Object.keys(pairs).length, max: photos.length });
  };
  draw();
  frame(host, a, el("div", {}, grid, status), () => {
    const r = evalCaptions(caps, photos.map((p) => p.id), pairs);
    return { ok: r.ok, message: r.ok ? t(a.success) : r.paired < photos.length ? t("story.ui.captions.paired", { n: r.paired, max: photos.length }) : t("story.ui.captions.wrong", { n: r.wrong }) };
  });
}

/* ---------- Nhịp chữ và hiệu ứng ---------- */
function timing(host: ActivityHost, a: Activity) {
  const cfg: TimingCfg = { rise: a.rise, total: a.total, words: a.words, rate: a.rate };
  let delay = a.delay.start as number, hold = a.hold.start as number;
  const w = timingWindow(cfg);
  const host2 = el("div", { class: "timing-stage" });
  const c = stageCanvas(host2, (g, W, H) => {
    const x = (s: number) => 16 + (s / cfg.total) * (W - 32);
    roundRect(g, 0, 0, W, H, 10, INK.bg);
    // hiệu ứng: dốc lên tới lúc ổn định
    g.strokeStyle = INK.lightB; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= 60; i += 1) { const s = (i / 60) * cfg.total; const y = H * .52 - (H * .32) * Math.min(1, s / cfg.rise); i ? g.lineTo(x(s), y) : g.moveTo(x(s), y); }
    g.stroke();
    pixelText(g, t("story.ui.timing.effect"), x(0), 14, INK.text, 11, "left", 600);
    const r = evalTiming(cfg, delay, hold);
    roundRect(g, x(delay), H * .64, Math.max(4, x(Math.min(cfg.total + 1, delay + hold)) - x(delay)), H * .2, 6, r.ok ? INK.good : INK.light);
    pixelText(g, t("story.ui.timing.text"), x(delay) + 6, H * .74 + 1, INK.bg, 11, "left", 700);
    g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([4, 4]);
    for (const s of [cfg.rise, cfg.total]) { g.beginPath(); g.moveTo(x(s), 18); g.lineTo(x(s), H - 6); g.stroke(); }
    g.setLineDash([]);
  });
  const sDelay = slider({ label: t("story.ui.timing.delay"), min: a.delay.min, max: a.delay.max, step: a.delay.step, value: delay, format: (v) => num(v, 1), onInput: (v) => { delay = v; c.render(); } });
  const sHold = slider({ label: t("story.ui.timing.hold"), min: a.hold.min, max: a.hold.max, step: a.hold.step, value: hold, format: (v) => num(v, 1), onInput: (v) => { hold = v; c.render(); } });
  sDelay.root.dataset.timing = "delay"; sHold.root.dataset.timing = "hold";
  void w;
  frame(host, a, el("div", { class: "timing-area" }, host2, el("div", { class: "timing-controls" }, sDelay.root, sHold.root)), () => {
    const r = evalTiming(cfg, delay, hold);
    return { ok: r.ok, message: r.ok ? t(a.success) : r.issues.map((i) => t(`story.ui.timing.${i}`)).join(" ") };
  });
}

/* ---------- Thứ tự tổng duyệt ---------- */
function topo(host: ActivityHost, a: Activity) {
  const steps = a.steps as { id: string; label: string; needs: string[] }[];
  const order: string[] = [];
  const label = (id: string) => t(steps.find((s) => s.id === id)!.label);
  const tray = el("div", { class: "topo-tray" });
  const line = el("p", { class: "topo-order" });
  const draw = () => {
    tray.replaceChildren(...steps.map((s) => btn(el("span", { class: "topo-step" }, el("b", { text: t(s.label) }), s.needs.length ? el("small", { class: "muted", text: t("story.ui.topo.needs", { list: s.needs.map(label).join(", ") }) }) : null),
      () => { order.push(s.id); draw(); }, "topo-btn", { disabled: order.includes(s.id), "data-topo-step": s.id })));
    line.textContent = t("story.ui.topo.order", { list: order.map(label).join(" → ") || "…" });
  };
  draw();
  const area = el("div", {}, tray, line, btn(t("story.ui.reset"), () => { order.length = 0; draw(); }, "small ghost", { "data-topo-reset": true }, "restart"));
  frame(host, a, area, () => {
    const r = evalTopo(steps, order);
    return { ok: r.ok, message: r.ok ? t(a.success) : r.firstBad ? t("story.ui.topo.bad", { step: label(r.firstBad.step), need: label(r.firstBad.need) }) : t("story.ui.retry") };
  });
}

/* ---------- Đối chiếu bằng chứng ---------- */
function causes(host: ActivityHost, a: Activity) {
  const cards = a.cards as { id: string; text: string; real: boolean }[];
  const pick = new Set<string>();
  const count = el("small", { class: "muted" });
  const grid = el("div", { class: "cause-grid" }, ...cards.map((c) => {
    const b = btn(t(c.text), () => { pick.has(c.id) ? pick.delete(c.id) : pick.add(c.id); b.classList.toggle("on", pick.has(c.id)); b.setAttribute("aria-pressed", String(pick.has(c.id))); count.textContent = t("story.ui.causes.pick", { n: pick.size }); }, "cause-card", { "aria-pressed": "false", "data-cause": c.id });
    return b;
  }));
  count.textContent = t("story.ui.causes.pick", { n: 0 });
  frame(host, a, el("div", {}, grid, count), () => {
    const r = evalCauses(cards, [...pick]);
    return { ok: r.ok, message: r.ok ? t(a.success) : r.missing ? t("story.ui.causes.missing") : t("story.ui.causes.extra") };
  });
}

const MOUNTS: Record<string, (host: ActivityHost, a: Activity) => void> = { versions, sync, captions, timing, topo, causes };
export const DIALOG_ACTIVITIES = Object.keys(MOUNTS);

export function mountActivity(host: ActivityHost, a: Activity) {
  const m = MOUNTS[a.type];
  if (!m) throw new Error(`activity ${a.type}`);
  m(host, a);
}
