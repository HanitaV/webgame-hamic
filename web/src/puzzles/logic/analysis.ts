/** Mạch 1 — Giải tích: plot-limit, series, removable, pick-limit. Pure functions, no DOM. */

import type { EvalCtx, EvalResult, Level } from "../../game/types";

export const fmt = (x: number, digits = 3) => {
  if (!Number.isFinite(x)) return String(x);
  const r = Math.round(x * 10 ** digits) / 10 ** digits;
  return String(r).replace(".", ",");
};

export function parseFraction(s: string | number): number {
  if (typeof s === "number") return s;
  const [a, b] = s.split("/").map(Number);
  return b ? a / b : a;
}

/* ---------- plot-limit ---------- */

export interface PlotSolution { a: number; b: number }

export function plotRanges(level: Level) {
  const d = level.data;
  const a = d.a_range ?? [0, 100];
  const bMin = level.answer?.b_min ?? 1;
  const b = d.b_range ?? [0.05, Math.max(3, Math.ceil((bMin + 0.6) * 2) / 2)];
  return { a: a as [number, number], aStep: d.a_step ?? 1, b: b as [number, number], bStep: d.b_step ?? 0.05 };
}

export const height = (a: number, b: number, t: number) => a * (1 - Math.exp(-b * t));

export function evalPlot(level: Level, sol: PlotSolution, ctx: EvalCtx): EvalResult {
  const { T, eps, target } = level.data;
  const a = Math.round(sol.a);
  const b = Math.round(sol.b * 100) / 100;
  const tol = eps * (ctx.assist ? ctx.toleranceFactor : 1);
  const err = Math.abs(height(a, b, T) - target);
  const star1 = a === target && b > 0;
  const star2 = star1 && err <= tol + 1e-9;
  let message: string;
  if (!star1) message = `Độ cao đang tiến tới ${a} m, vạch đích là ${target} m. Mình thử đổi a xem.`;
  else if (!star2) message = `Pháo dừng ở ${target} m rồi. Sau ${T} s còn cách ${fmt(err)} m; thử tăng b.`;
  else message = `Pháo dừng ở ${target} m; sau ${T} s chỉ cách ${fmt(err)} m.`;
  return { ok: star1, stars: [star1, star2, false], message, detail: { a, b, err, tol } };
}

/* ---------- series ---------- */

export interface SeriesSolution { N: number }

export function seriesSum(q: number, N: number) {
  // sum_{n=1..N} q^n
  return (q * (1 - q ** N)) / (1 - q);
}

export function evalSeries(level: Level, sol: SeriesSolution): EvalResult {
  const q = parseFraction(level.data.q);
  const limit = q / (1 - q);
  const need = level.answer.N as number;
  const N = Math.max(0, Math.round(sol.N));
  const s = seriesSum(q, N);
  const pct = (s / limit) * 100;
  const star1 = N >= need;
  const star2 = N === need;
  const message = !star1
    ? `${N} đèn cho tổng ${fmt(s, 4)}, mới được ${fmt(pct, 2)}% (cần ${fmt(level.data.percent, 2)}%).`
    : star2
      ? `${N} đèn cho tổng ${fmt(s, 4)}: vừa đủ ${fmt(level.data.percent, 2)}%.`
      : `${N} đèn đạt mục tiêu; thử bớt đèn xem vẫn đủ không.`;
  return { ok: star1, stars: [star1, star2, false], message, detail: { s, pct, limit } };
}

/* ---------- removable ---------- */

export interface RemovableSolution { value: number }

/** f(x) = (x² + Bx + C)/(x − c); returns the value the curve approaches at c. */
export function removableLimit(level: Level) {
  const { c, numerator } = level.data as { c: number; numerator: [number, number, number] };
  const B = numerator[1];
  return 2 * c + B; // quotient x + (B + c), evaluated at c
}

export function removableF(level: Level, x: number) {
  const { c, numerator } = level.data as { c: number; numerator: [number, number, number] };
  return (numerator[0] * x * x + numerator[1] * x + numerator[2]) / (x - c);
}

export function evalRemovable(level: Level, sol: RemovableSolution): EvalResult {
  const L = removableLimit(level);
  const ok = Math.round(sol.value) === L;
  const message = ok
    ? `Đường sáng liền mạch tại x = ${level.data.c}.`
    : `Điểm lấp đang ở độ cao ${sol.value}; đường sáng hai bên chưa nối vào đó.`;
  return { ok, stars: [ok, ok, false], message, detail: { L } };
}

/* ---------- pick-limit ---------- */

export interface PickSolution { selected: string[] }

/** Numeric evaluator for the fixed set of option templates used by gen_levels.py and circuits.json. */
export function parseOption(text: string): ((x: number) => number) | null {
  const t = text.replace(/\s+/g, "").replace(/−/g, "-");
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^(\d+)x\/\(x\+(\d+)\)$/))) { const a = +m[1], k = +m[2]; return (x) => (a * x) / (x + k); }
  if ((m = t.match(/^(\d+)\(1-e\^\(-x\)\)$/))) { const a = +m[1]; return (x) => a * (1 - Math.exp(-x)); }
  if ((m = t.match(/^(\d+)\+1\/x$/))) { const a = +m[1]; return (x) => a + 1 / x; }
  if ((m = t.match(/^(\d+)\+sin\(x\)\/x$/))) { const a = +m[1]; return (x) => a + Math.sin(x) / x; }
  if ((m = t.match(/^\((\d+)x²\+1\)\/\(x²\+(\d+)\)$/))) { const a = +m[1], k = +m[2]; return (x) => (a * x * x + 1) / (x * x + k); }
  if ((m = t.match(/^(\d+)x\/\(x²\+1\)$/))) { const a = +m[1]; return (x) => (a * x) / (x * x + 1); }
  if ((m = t.match(/^(\d+)·sinx$/))) { const a = +m[1]; return (x) => a * Math.sin(x); }
  if ((m = t.match(/^(\d+)\/x$/))) { const a = +m[1]; return (x) => a / x; }
  if ((m = t.match(/^(\d+)\+x$/))) { const a = +m[1]; return (x) => a + x; }
  if ((m = t.match(/^(\d+)x$/))) { const a = +m[1]; return (x) => a * x; }
  return null;
}

export function evalPick(level: Level, sol: PickSolution): EvalResult {
  const correct = new Set<string>(level.answer.correct);
  const chosen = new Set(sol.selected);
  const missing = [...correct].filter((x) => !chosen.has(x)).length;
  const extra = [...chosen].filter((x) => !correct.has(x)).length;
  const ok = missing === 0 && extra === 0;
  const message = ok
    ? `Đúng cả ${correct.size} hàm cùng tiến tới ${level.data.target}.`
    : `Còn ${missing} hàm đúng chưa chọn và ${extra} hàm đã chọn không tiến tới ${level.data.target}.`;
  return { ok, stars: [ok, ok, false], message, detail: { missing, extra } };
}
