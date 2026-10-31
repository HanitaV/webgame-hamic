/** Views for mạch 4–6: graph, modular, count. */

import { t } from "../../core/i18n";
import { el } from "../../ui/dom";
import { INK, choiceGroup, dot, gridBg, pixelText, polyline, ring, roundRect, stageCanvas, stepper } from "../../ui/widgets";
import { LET, WEEK, degrees, type Edge } from "../logic/discrete";
import type { Mount } from "./types";

/* ---------- graph ---------- */

export const mountGraph: Mount = (ctx) => {
  const { level, casual } = ctx;
  const { n, edges, task } = level.data as { n: number; edges: Edge[]; task: string };
  const chosen = new Set<number>();
  let cls: "circuit" | "path" | "none" | "" = "";
  const ends: string[] = [];
  let shown: boolean | null = null;
  let showDeg = false;
  const summary = el("p", { class: "ctl-label", role: "status" });
  const sync = () => {
    const total = [...chosen].reduce((s, i) => s + edges[i][2], 0);
    summary.textContent = task === "euler"
      ? (cls === "path" ? t("g.ends", { e: ends.join(", ") || "…" }) : "")
      : t("g.summary", { k: chosen.size, total });
  };
  if (task === "euler") {
    const q = choiceGroup([t("g.circuit"), t("g.path"), t("g.none")], (i) => {
      cls = (["circuit", "path", "none"] as const)[i];
      shown = null; sync(); c.render(); ctx.changed();
    }, t("g.eulerQ"));
    ctx.controls.append(q.root, el("p", { class: "ctl-hint", text: t("g.tapEnds") }));
  } else {
    ctx.controls.append(el("p", { class: "ctl-hint", text: casual ? t("g.tapWireCasual") : t("g.tapWire") }));
    const clr = el("button", { type: "button", class: "btn small", text: t("g.clear") });
    clr.addEventListener("click", () => { chosen.clear(); shown = null; sync(); c.render(); ctx.changed(); });
    ctx.controls.append(clr);
  }
  ctx.controls.append(summary);
  sync();

  let pos: [number, number][] = [];
  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h, 24);
    const cx = w / 2, cy = h / 2 + 6, r = Math.min(w, h) / 2 - 40;
    const layout = level.data.pos as [number, number][] | undefined;
    pos = layout
      ? layout.map(([u, v]) => [Math.round(44 + u * (w - 88)), Math.round(34 + v * (h - 78))])
      : [...Array(n).keys()].map((i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
      });
    edges.forEach(([a, b, wgt], i) => {
      const on = chosen.has(i);
      const [x0, y0] = pos[a], [x1, y1] = pos[b];
      const col = on ? (shown === false ? INK.grey : shown ? INK.good : INK.light) : "rgba(255,255,255,0.16)";
      polyline(g, [[x0, y0], [x1, y1]], col, on ? 4 : 2, on && shown !== false ? 14 : 0);
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      roundRect(g, mx - 14, my - 11, 28, 22, 11, "#121628", on ? col : "rgba(255,255,255,0.12)");
      pixelText(g, String(wgt), mx, my + 1, on ? INK.light : INK.text, 14, "center", 600);
    });
    const deg = degrees(n, edges);
    pos.forEach(([x, y], i) => {
      const isEnd = ends.includes(LET[i]);
      const special = task === "shortest" && (LET[i] === level.data.from || LET[i] === level.data.to);
      dot(g, x, y, 17, isEnd || special ? INK.target : INK.light, 20);
      dot(g, x, y, 13, "#fff6d8", 0);
      pixelText(g, LET[i], x, y + 1, "#2a1d00", 16, "center", 800);
      const labels = level.data.labels as string[] | undefined;
      if (labels?.[i]) pixelText(g, labels[i], x, y + 30, INK.text, 12, "center", 600);
      if (showDeg) pixelText(g, String(deg[i]), x + 24, y - 18, INK.lightB, 14, "left", 700);
    });
  });

  const hit = (ev: PointerEvent) => {
    const rect = c.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    if (task === "euler") {
      const i = pos.findIndex(([px, py]) => Math.abs(px - x) < 22 && Math.abs(py - y) < 22);
      if (i < 0) return;
      const L = LET[i];
      const k = ends.indexOf(L);
      if (k >= 0) ends.splice(k, 1); else { ends.push(L); if (ends.length > 2) ends.shift(); }
    } else {
      let best = -1, bd = 24;
      edges.forEach(([a, b], i) => {
        const [x0, y0] = pos[a], [x1, y1] = pos[b];
        const dx = x1 - x0, dy = y1 - y0;
        const u = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
        const dd = Math.hypot(x0 + u * dx - x, y0 + u * dy - y);
        if (dd < bd) { bd = dd; best = i; }
      });
      if (best < 0) return;
      if (chosen.has(best)) chosen.delete(best); else chosen.add(best);
    }
    shown = null;
    sync();
    c.render();
    ctx.changed();
  };
  c.canvas.addEventListener("pointerdown", hit);

  return {
    solution: () => (task === "euler" ? { cls, ends: [...ends] } : { edges: [...chosen] }),
    show(res) { shown = res ? res.ok : null; showDeg = Boolean(res && task === "euler"); c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};

/* ---------- modular ---------- */

export const mountModular: Mount = (ctx) => {
  const { level } = ctx;
  const d = level.data;
  let x: number | null = null;
  let index: number | null = null;
  let locks: { m: number; want: number; got: number }[] | null = null;
  if (d.kind === "crt" || d.kind === "number") {
    const max = d.kind === "crt" ? (d.moduli as number[]).reduce((p, m) => p * m, 1) - 1 : d.max;
    x = d.kind === "crt" ? 0 : d.min;
    const st = stepper({ label: d.kind === "crt" ? "n" : t("mod.number"), value: x!, min: d.kind === "crt" ? 0 : d.min, max, onChange: (v) => { x = v; locks = null; c.render(); ctx.changed(); } });
    ctx.controls.append(st.root);
  } else if (d.kind === "lastdigit") {
    const g = choiceGroup([..."0123456789"], (i) => { x = i; ctx.changed(); }, t("mod.digit"));
    ctx.controls.append(g.root);
  } else {
    const opts: string[] = d.kind === "weekday" ? WEEK : d.options;
    const g = choiceGroup(opts, (i) => { index = i; ctx.changed(); }, t("mod.pick"));
    ctx.controls.append(g.root);
  }
  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h, 24);
    if (d.kind === "crt") {
      const ms = d.moduli as number[];
      const bw = Math.min(120, (w - 40) / ms.length - 16);
      ms.forEach((m, i) => {
        const x0 = 20 + i * (bw + 16) + (w - 40 - ms.length * (bw + 16)) / 2, y0 = h / 2 - 64;
        const l = locks?.[i];
        const open = l ? l.got === l.want : false;
        const col = l ? (open ? INK.good : INK.grey) : "rgba(255,255,255,0.35)";
        g.strokeStyle = col; g.lineWidth = 7; g.lineCap = "round";
        g.beginPath();
        g.arc(x0 + bw / 2, y0 + 36 - (open ? 10 : 0), bw * 0.24, Math.PI, open ? Math.PI * 1.75 : 0);
        g.stroke();
        roundRect(g, x0, y0 + 36, bw, 88, 16, l ? (open ? "rgba(94,234,160,0.18)" : "rgba(255,255,255,0.05)") : "rgba(255,255,255,0.07)", col, open ? 16 : 0);
        pixelText(g, `mod ${m}`, x0 + bw / 2, y0 + 66, INK.text, 16, "center", 700);
        pixelText(g, `≡ ${d.residues[i]}`, x0 + bw / 2, y0 + 94, INK.light, 16, "center", 700);
        if (l) pixelText(g, `${x} mod ${m} = ${l.got}`, x0 + bw / 2, y0 + 146, open ? INK.good : INK.dim, 14, "center", 600);
      });
    } else {
      pixelText(g, d.kind === "weekday" ? "7" : d.kind === "lastdigit" ? `${d.a}^${d.k}` : "70", w / 2, h / 2, INK.light, 88, "center", 800);
    }
  });
  return {
    solution: () => ({ x, index }),
    show(res) { locks = res?.detail?.locks ?? null; c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};

/* ---------- count ---------- */

export const mountCount: Mount = (ctx) => {
  const { level, casual } = ctx;
  const d = level.data;
  let count: number | null = null;
  let choice: number | null = null;
  let shown: boolean | null = null;
  if (casual && level.casual?.choices) {
    const g = choiceGroup(level.casual.choices.map(String), (i) => { choice = i; ctx.changed(); }, t("count.pick"));
    ctx.controls.append(g.root);
  } else {
    const st = stepper({ label: t("count.ways"), value: 0, min: 0, max: 999999, onChange: (v) => { count = v; shown = null; c.render(); ctx.changed(); } });
    count = 0;
    ctx.controls.append(st.root);
  }
  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h, 24);
    if (d.kind === "grid" || d.kind === "gridblock") {
      const W = d.W as number, H = d.H as number;
      const cell = Math.floor(Math.min((w - 60) / W, (h - 60) / H));
      const ox = Math.floor((w - cell * W) / 2), oy = Math.floor((h - cell * H) / 2);
      for (let i = 0; i <= W; i += 1) polyline(g, [[ox + i * cell, oy], [ox + i * cell, oy + cell * H]], "rgba(255,255,255,0.2)", 1.5, 0);
      for (let j = 0; j <= H; j += 1) polyline(g, [[ox, oy + j * cell], [ox + cell * W, oy + j * cell]], "rgba(255,255,255,0.2)", 1.5, 0);
      for (let i = 0; i <= W; i += 1) for (let j = 0; j <= H; j += 1) dot(g, ox + i * cell, oy + j * cell, 3, "rgba(255,255,255,0.45)", 0);
      dot(g, ox, oy + H * cell, 8, INK.good, 16);
      dot(g, ox + W * cell, oy, 8, INK.light, 16);
      if (d.blocked) {
        const [bx, by] = d.blocked as [number, number];
        dot(g, ox + bx * cell, oy + (H - by) * cell, 9, "#ff6b81", 12);
        pixelText(g, "×", ox + bx * cell, oy + (H - by) * cell, "#2a0010", 16, "center", 800);
      }
      return;
    }
    const n = d.n as number, k = d.k as number;
    const size = Math.min(44, (w - 40) / n - 10);
    const colors = ["#ffd25e", "#5ad8ff", "#5eeaa0", "#ff9f5a", "#ff7ad9", "#b69cff", "#ffffff", "#d6dbee"];
    for (let i = 0; i < n; i += 1) {
      const x = 20 + i * (size + 10) + (w - 40 - n * (size + 10)) / 2 + size / 2;
      const on = d.kind === "perm" || i < k;
      const col = d.kind === "perm" ? colors[i % colors.length] : on ? INK.light : "rgba(255,255,255,0.1)";
      dot(g, x, h / 2, size / 2, col, on ? 16 : 0);
    }
    pixelText(g, d.kind === "perm" ? t("count.permLabel", { n, k }) : t("count.combLabel", { n, k }), w / 2, h / 2 + size / 2 + 28, INK.text, 15, "center", 600);
    if (shown === false) ring(g, w / 2, 34, 14, INK.grey, 2);
  });
  return {
    solution: () => ({ count, choice }),
    show(res) { shown = res ? res.ok : null; c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};
