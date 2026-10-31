/** Views for mạch 2: beam-order (gương) and transpose-bug. */

import { t } from "../../core/i18n";
import { el } from "../../ui/dom";
import { INK, arrow, choiceGroup, dot, gridBg, pixelText, polyline, stageCanvas } from "../../ui/widgets";
import { MATS, MIRROR_NAMES, MIRROR_SHORT, beamPath, rotationOf, slotsOf, transposeOptions, mv, type Vec } from "../logic/linear";
import type { Mount } from "./types";

function matText(name: string) {
  const m = MATS[name];
  const f = (x: number) => (x < 0 ? `−${-x}` : ` ${x}`);
  return `[${f(m[0][0])} ${f(m[0][1])}]\n[${f(m[1][0])} ${f(m[1][1])}]`;
}

/* ---------- beam-order ---------- */

export const mountBeam: Mount = (ctx) => {
  const { level, casual, lab } = ctx;
  const mirrors: string[] = lab ? Object.keys(MATS) : [...level.data.mirrors];
  const slots = lab ? 3 : slotsOf(level);
  const vector = (level.data.vector ?? [1, 0]) as Vec;
  const target = lab ? null : (level.data.target as Vec);
  const order: string[] = [];
  let shown: boolean | null = null;
  const names = casual && level.casual?.mirrorNames ? level.casual.mirrorNames : null;

  const seqRow = el("div", { class: "seq", "aria-label": t("beam.sequence") });
  const palette = el("div", { class: "palette", role: "group", "aria-label": t("beam.palette") });
  const tiles = new Map<string, HTMLButtonElement[]>();
  const used = () => {
    const count = new Map<string, number>();
    for (const n of order) count.set(n, (count.get(n) ?? 0) + 1);
    return count;
  };
  const refresh = () => {
    seqRow.replaceChildren();
    for (let i = 0; i < slots; i += 1) {
      const name = order[i];
      const slot = el("button", { type: "button", class: `slot seq-slot${name ? " filled" : ""}`, "aria-label": name ? `${t("beam.remove")} ${names?.[name] ?? MIRROR_NAMES[name]}` : `${t("beam.empty")} ${i + 1}` });
      slot.append(el("small", { text: String(i + 1) }));
      if (name) slot.append(el("b", { text: names ? "◆" : MIRROR_SHORT[name] }), el("span", { text: names?.[name] ?? MIRROR_NAMES[name] }));
      slot.addEventListener("click", () => { if (name) { order.splice(i, 1); shown = null; refresh(); } });
      seqRow.append(slot);
    }
    const u = used();
    const lefts = new Map<string, number>();
    for (const n of mirrors) lefts.set(n, (lefts.get(n) ?? 0) + 1);
    for (const [n, list] of tiles) {
      const left = (lefts.get(n) ?? 0) - (u.get(n) ?? 0);
      list.forEach((b, i) => { b.disabled = !lab && i >= left; });
    }
    c?.render();
    ctx.changed();
  };
  for (const name of mirrors) {
    const b = el("button", { type: "button", class: "slot tile" },
      el("b", { text: names ? "◆" : MIRROR_SHORT[name] }),
      el("span", { class: "tile-name", text: names?.[name] ?? MIRROR_NAMES[name] }));
    if (!names && !casual) b.append(el("pre", { class: "mat", text: matText(name) }));
    b.addEventListener("click", () => {
      if (order.length >= slots) return;
      order.push(name);
      shown = null;
      refresh();
    });
    if (!tiles.has(name)) tiles.set(name, []);
    tiles.get(name)!.push(b);
    palette.append(b);
  }
  ctx.controls.append(el("p", { class: "ctl-label", text: t("beam.pick") }), palette, el("p", { class: "ctl-label", text: t("beam.order") }), seqRow);

  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h, 24);
    const path = beamPath(vector, order);
    const all = [...path, ...(target ? [target] : [])];
    const ext = Math.max(2, ...all.map((v) => Math.max(Math.abs(v[0]), Math.abs(v[1]))));
    const cx = Math.round(w / 2), cy = Math.round(h / 2);
    const s = (Math.min(w, h) / 2 - 30) / ext;
    polyline(g, [[16, cy], [w - 16, cy]], INK.axis, 1.5, 0);
    polyline(g, [[cx, 16], [cx, h - 16]], INK.axis, 1.5, 0);
    if (!casual) {
      pixelText(g, "x", w - 20, cy - 12, INK.dim, 16);
      pixelText(g, "y", cx + 10, 22, INK.dim, 16);
    }
    if (target) {
      arrow(g, cx, cy, cx + target[0] * s, cy - target[1] * s, "rgba(255,210,94,0.28)", 10, 0);
      if (!casual) pixelText(g, `(${target[0]}, ${target[1]})`, cx + target[0] * s + 8, cy - target[1] * s - 10, INK.light, 18);
    }
    // incoming beam (white), then each mirror's output
    arrow(g, cx - vector[0] * s, cy + vector[1] * s, cx, cy, "#ffffff", 2.5, 10);
    dot(g, cx, cy, 5, "#ffffff", 16);
    path.forEach((v, i) => {
      if (i === 0) return;
      const last = i === path.length - 1;
      const col = last ? (shown === false ? INK.grey : shown === true ? INK.good : INK.lightB) : "rgba(90,216,255,0.35)";
      arrow(g, cx, cy, cx + v[0] * s, cy - v[1] * s, col, last ? 4 : 2, last && shown !== false ? 16 : 0);
    });
    if (!casual) {
      const out = path[path.length - 1];
      pixelText(g, `${t("beam.out")} (${out[0]}, ${out[1]})`, 14, 18, INK.text, 18);
    }
  });
  refresh();

  return {
    solution: () => ({ order: [...order] }),
    show(res) { shown = res ? res.ok : null; c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};

/* ---------- transpose-bug ---------- */

export const mountTranspose: Mount = (ctx) => {
  const { level } = ctx;
  const k = level.data.scale as number;
  const { R, text } = rotationOf(level);
  const d = level.data.d as Vec;
  let dir: "up" | "down" | "same" | "" = "";
  let fixes: boolean | null = null;
  let detAns: number | null = null;
  let revealed = false;
  const q1 = choiceGroup([t("tb.up"), t("tb.down"), t("tb.same")], (i) => { dir = (["up", "down", "same"] as const)[i]; ctx.changed(); }, t("tb.q1"));
  const q2 = choiceGroup([t("tb.yes"), t("tb.no")], (i) => { fixes = i === 0; ctx.changed(); }, t("tb.q2", { k }));
  const opts = transposeOptions(level);
  const q3 = choiceGroup(opts.map(String), (i) => { detAns = opts[i]; ctx.changed(); }, t("tb.q3", { k }));
  ctx.controls.append(
    el("p", { class: "ctl-label", text: t("tb.q1") }), q1.root,
    el("p", { class: "ctl-label", text: t("tb.q2", { k }) }), q2.root,
    el("p", { class: "ctl-label", text: t("tb.q3", { k }) }), q3.root,
  );
  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h, 24);
    pixelText(g, "R =", 16, 30, INK.text, 20);
    pixelText(g, `[ ${text[0][0]}  ${text[0][1]} ]`, 56, 22, INK.text, 18);
    pixelText(g, `[ ${text[1][0]}  ${text[1][1]} ]`, 56, 42, INK.text, 18);
    const cx = Math.round(w / 2), cy = Math.round(h / 2 + 10);
    const len = Math.hypot(d[0], d[1]);
    const s = (Math.min(w, h) / 2 - 40) / len;
    polyline(g, [[16, cy], [w - 16, cy]], INK.axis, 1.5, 0);
    polyline(g, [[cx, 60], [cx, h - 16]], INK.axis, 1.5, 0);
    arrow(g, cx, cy, cx + d[0] * s, cy - d[1] * s, "#ffffff", 2.5, 8);
    pixelText(g, "d", cx + d[0] * s + 8, cy - 8, INK.text, 18);
    if (revealed) {
      const up = mv(R, d), down = mv([[R[0][0], R[1][0]], [R[0][1], R[1][1]]], d);
      arrow(g, cx, cy, cx + up[0] * s, cy - up[1] * s, INK.good, 4);
      pixelText(g, "R·d", cx + up[0] * s + 8, cy - up[1] * s, INK.good, 18);
      arrow(g, cx, cy, cx + down[0] * s, cy - down[1] * s, INK.target, 4);
      pixelText(g, "Rᵀ·d", cx + down[0] * s + 8, cy - down[1] * s, INK.target, 18);
    } else {
      pixelText(g, "?", cx + 24, cy - 40, INK.light, 28);
    }
  });
  return {
    solution: () => ({ dir, fixes, det: detAns }),
    show(res) { revealed = Boolean(res); c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};
