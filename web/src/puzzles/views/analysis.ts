/** Views for mạch 1: plot-limit, series, removable, pick-limit. */

import { t } from "../../core/i18n";
import { reducedMotion } from "../../game/settings";
import { el } from "../../ui/dom";
import { INK, dot, gridBg, pixelText, polyline, ring, roundRect, slider, stageCanvas, stepper } from "../../ui/widgets";
import { height, parseFraction, parseOption, plotRanges, removableF, removableLimit, seriesSum } from "../logic/analysis";
import type { Mount } from "./types";

const fmt = (x: number, d = 2) => String(Math.round(x * 10 ** d) / 10 ** d).replace(".", ",");

/** Axis frame shared by the plots. */
function axes(g: CanvasRenderingContext2D, w: number, h: number, L: number, B: number, R: number, T: number) {
  g.fillStyle = INK.axis;
  g.fillRect(L, T, 1.5, h - B - T);
  g.fillRect(L, h - B, w - L - R, 1.5);
}

/* ---------- plot-limit ---------- */

export const mountPlot: Mount = (ctx) => {
  const { level, casual, lab } = ctx;
  const r = plotRanges(level);
  const target = lab ? null : (level.data.target as number);
  const T = (level.data.T as number) ?? 3;
  let a = lab ? 50 : Math.round((r.a[0] + r.a[1]) / 2 / 10) * 10;
  let b = 0.5;
  let anim = 1;
  let result: { ok: boolean; star2: boolean } | null = null;
  const labels = casual && level.casual?.labels ? level.casual.labels : { a: "a", b: "b" };
  const sa = slider({ label: labels.a, min: r.a[0], max: r.a[1], step: r.aStep, value: a, format: (v) => (casual ? `${v} m` : String(v)), onInput: (v) => { a = v; result = null; c.render(); ctx.changed(); } });
  const sb = slider({ label: labels.b, min: r.b[0], max: r.b[1], step: r.bStep, value: b, format: (v) => fmt(v), onInput: (v) => { b = Math.round(v * 100) / 100; result = null; c.render(); ctx.changed(); } });
  ctx.controls.append(sa.root, sb.root);
  if (!casual) ctx.controls.append(el("p", { class: "formula", text: "h(t) = a·(1 − e^(−bt))" }));

  const tMax = Math.max(6, T * 2);
  const yMax = Math.max(100, r.a[1]);
  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h);
    const L = 46, B = 30, R = 18, Tp = 18;
    const X = (tt: number) => L + (tt / tMax) * (w - L - R);
    const Y = (v: number) => h - B - (v / yMax) * (h - B - Tp);
    axes(g, w, h, L, B, R, Tp);
    for (let v = 0; v <= yMax; v += 20) pixelText(g, String(v), L - 8, Y(v), INK.dim, 12, "right");
    for (let tt = 0; tt <= tMax; tt += 1) pixelText(g, `${tt}s`, X(tt), h - B + 15, INK.dim, 12, "center");
    if (target !== null) {
      polyline(g, [[L, Y(target)], [w - R, Y(target)]], INK.target, 1.5, 0, [6, 6]);
      pixelText(g, `${target} m`, w - R - 4, Y(target) - 12, INK.target, 13, "right", 600);
      polyline(g, [[X(T), Tp], [X(T), h - B]], "rgba(255,159,90,0.45)", 1, 0, [3, 5]);
      pixelText(g, `t = ${T}s`, X(T) + 6, h - B - 12, INK.target, 12);
    }
    const color = result && !result.ok ? INK.grey : INK.light;
    const N = 160;
    const upto = Math.max(1, Math.floor(N * anim));
    const pts: [number, number][] = [];
    for (let i = 0; i <= upto; i += 1) { const tt = (i / N) * tMax; pts.push([X(tt), Y(height(a, b, tt))]); }
    polyline(g, pts, color, 3, result && !result.ok ? 0 : 14);
    const [hx, hy] = pts[pts.length - 1];
    dot(g, hx, hy, 6, "#fff", 18);
    if (result) {
      const hT = height(a, b, T);
      dot(g, X(T), Y(hT), 4, result.star2 ? INK.good : INK.text, 10);
      pixelText(g, `h(${T}) = ${fmt(hT, 3)} m`, L + 10, Tp + 12, result.star2 ? INK.good : INK.text, 14, "left", 600);
    }
  });

  return {
    solution: () => ({ a, b }),
    show(res) {
      result = res ? { ok: res.ok, star2: res.stars[1] } : null;
      if (!res || reducedMotion()) { anim = 1; c.render(); return 0; }
      const start = performance.now();
      const dur = 900;
      const tick = (now: number) => {
        anim = Math.min(1, (now - start) / dur);
        c.render();
        if (anim < 1) requestAnimationFrame(tick);
      };
      anim = 0.01;
      requestAnimationFrame(tick);
      return dur;
    },
    destroy: () => c.destroy(),
  };
};

/* ---------- series ---------- */

export const mountSeries: Mount = (ctx) => {
  const { level, casual } = ctx;
  const q = parseFraction(level.data.q);
  const limit = q / (1 - q);
  const p = (level.data.percent as number) / 100;
  let N = 1;
  let shown: boolean | null = null;
  const st = stepper({ label: casual ? t("series.pours") : t("series.lamps"), value: N, min: 1, max: 40, onChange: (v) => { N = v; shown = null; c.render(); ctx.changed(); } });
  ctx.controls.append(st.root);

  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h);
    const s = seriesSum(q, N);
    const frac = s / limit;
    if (casual) {
      const cw = Math.min(150, w * 0.36), ch = h - 80;
      const x0 = Math.round(w / 2 - cw / 2), y0 = 28;
      const fill = ch * frac;
      roundRect(g, x0, y0 + ch - fill, cw, fill, 10, shown === false ? INK.grey : "rgba(90,216,255,0.75)", undefined, shown === false ? 0 : 16);
      roundRect(g, x0 - 4, y0 - 4, cw + 8, ch + 8, 14, undefined, "rgba(255,255,255,0.55)");
      const ty = y0 + ch - ch * p;
      polyline(g, [[x0 - 28, ty], [x0 + cw + 28, ty]], INK.target, 1.5, 0, [6, 6]);
      pixelText(g, `${fmt(level.data.percent, 2)}%`, x0 + cw + 34, ty, INK.target, 14, "left", 600);
      pixelText(g, `${fmt(frac * 100, 2)}%`, w / 2, y0 + ch + 28, INK.text, 18, "center", 700);
      return;
    }
    const n = Math.max(N, 8);
    const area = w * 0.6;
    const bw = Math.max(5, area / n - 4);
    const base = h - 34;
    for (let i = 1; i <= n; i += 1) {
      const lit = i <= N;
      const bh = Math.max(3, (h - 90) * q ** (i - 1));
      roundRect(g, 18 + (i - 1) * (bw + 4), base - bh, bw, bh, Math.min(6, bw / 2), lit ? (shown === false ? INK.grey : INK.light) : "rgba(255,255,255,0.07)", undefined, lit && shown !== false ? 12 : 0);
    }
    const mx = w * 0.74, mw = w * 0.11, mh = h - 90;
    roundRect(g, mx, base - mh, mw, mh, 10, "rgba(255,255,255,0.06)");
    roundRect(g, mx, base - mh * frac, mw, mh * frac, 10, shown === false ? INK.grey : INK.good, undefined, shown === false ? 0 : 14);
    polyline(g, [[mx - 10, base - mh * p], [mx + mw + 10, base - mh * p]], INK.target, 1.5, 0, [5, 5]);
    pixelText(g, fmt(p * limit, 3), mx + mw + 14, base - mh * p, INK.target, 13, "left", 600);
    pixelText(g, `Σ = ${fmt(s, 4)}`, mx + mw / 2, base + 17, INK.text, 14, "center", 600);
  });

  return {
    solution: () => ({ N }),
    show(res) { shown = res ? res.ok : null; c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};

/* ---------- removable ---------- */

export const mountRemovable: Mount = (ctx) => {
  const { level } = ctx;
  const cx = level.data.c as number;
  const L = removableLimit(level);
  let value = 0;
  let ok: boolean | null = null;
  const st = stepper({ label: `f(${cx})`, value, min: -99, max: 99, onChange: (v) => { value = v; ok = null; c.render(); ctx.changed(); } });
  ctx.controls.append(st.root);

  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h);
    const x0 = cx - 8, x1 = cx + 8;
    const ys: number[] = [];
    for (let i = 0; i <= 64; i += 1) { const x = x0 + (i / 64) * 16; if (Math.abs(x - cx) > 1e-6) ys.push(removableF(level, x)); }
    ys.push(value);
    const yLo = Math.min(...ys) - 4, yHi = Math.max(...ys) + 4;
    const X = (x: number) => 24 + ((x - x0) / (x1 - x0)) * (w - 48);
    const Y = (y: number) => h - 24 - ((y - yLo) / (yHi - yLo)) * (h - 48);
    if (yLo < 0 && yHi > 0) polyline(g, [[24, Y(0)], [w - 24, Y(0)]], INK.axis, 1.5, 0);
    polyline(g, [[X(cx), 12], [X(cx), h - 12]], "rgba(255,255,255,0.15)", 1, 0, [4, 6]);
    pixelText(g, `x = ${cx}`, X(cx) + 8, 20, INK.dim, 13);
    const color = ok === true ? INK.good : ok === false ? INK.grey : INK.light;
    const left: [number, number][] = [], right: [number, number][] = [];
    for (let i = 0; i <= 200; i += 1) {
      const x = x0 + (i / 200) * 16;
      if (Math.abs(x - cx) < 0.12) continue;
      (x < cx ? left : right).push([X(x), Y(removableF(level, x))]);
    }
    polyline(g, left, color, 3, ok === false ? 0 : 12);
    polyline(g, right, color, 3, ok === false ? 0 : 12);
    if (ok === true) dot(g, X(cx), Y(L), 6, INK.good, 18);
    else ring(g, X(cx), Y(L), 7, "#ffffff", 2);
    dot(g, X(cx), Y(value), 6, ok === true ? INK.good : INK.target, 14);
  });

  return {
    solution: () => ({ value }),
    show(res) { ok = res ? res.ok : null; c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};

/* ---------- pick-limit ---------- */

export const mountPick: Mount = (ctx) => {
  const { level } = ctx;
  const options = level.data.options as { label: string; f: string }[];
  const target = level.data.target as number;
  const selected = new Set<string>();
  let shown: boolean | null = null;
  const list = el("div", { class: "pick-list", role: "group", "aria-label": t("pick.options") });
  for (const o of options) {
    const b = el("button", { type: "button", class: "btn pick", "aria-pressed": "false" },
      el("b", { text: o.label }), el("span", { class: "math", text: o.f }));
    b.addEventListener("click", () => {
      if (selected.has(o.label)) selected.delete(o.label); else selected.add(o.label);
      b.setAttribute("aria-pressed", String(selected.has(o.label)));
      shown = null;
      c.render();
      ctx.changed();
    });
    list.append(b);
  }
  ctx.controls.append(list);

  const c = stageCanvas(ctx.stage, (g, w, h) => {
    gridBg(g, w, h, 1000);
    const cols = options.length > 3 ? 3 : options.length;
    const rows = Math.ceil(options.length / cols);
    const cw = w / cols, ch = h / rows;
    options.forEach((o, i) => {
      const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
      const f = parseOption(o.f);
      const on = selected.has(o.label);
      roundRect(g, x0 + 5, y0 + 5, cw - 10, ch - 10, 12, on ? "rgba(255,210,94,0.08)" : "rgba(255,255,255,0.03)", on ? "rgba(255,210,94,0.6)" : "rgba(255,255,255,0.08)");
      pixelText(g, o.label, x0 + 18, y0 + 20, on ? INK.light : INK.text, 15, "left", 700);
      if (!f) return;
      const pad = 14;
      const yLo = -target * 0.4, yHi = target * 1.6;
      const X = (x: number) => x0 + pad + (x / 20) * (cw - 2 * pad);
      const Y = (y: number) => y0 + ch - pad - ((Math.max(yLo, Math.min(yHi, y)) - yLo) / (yHi - yLo)) * (ch - 2 * pad - 16);
      polyline(g, [[x0 + pad, Y(target)], [x0 + cw - pad, Y(target)]], "rgba(255,159,90,0.6)", 1, 0, [4, 4]);
      const pts: [number, number][] = [];
      for (let k = 1; k <= 160; k += 1) { const x = (k / 160) * 20; pts.push([X(x), Y(f(x))]); }
      polyline(g, pts, on ? (shown === false ? INK.grey : INK.light) : INK.lightB, 2.2, on ? 10 : 6);
    });
  });

  return {
    solution: () => ({ selected: [...selected] }),
    show(res) { shown = res ? res.ok : null; c.render(); return 0; },
    destroy: () => c.destroy(),
  };
};
