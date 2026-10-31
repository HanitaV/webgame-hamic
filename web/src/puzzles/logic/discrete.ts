/** Mạch 4–6 — đồ thị, số học, tổ hợp. */

import type { EvalResult, Level } from "../../game/types";

export const LET = "ABCDEFGH";
export type Edge = [number, number, number];

/* ---------- graph ---------- */

export interface GraphSolution {
  edges?: number[];
  cls?: "circuit" | "path" | "none" | "";
  ends?: string[];
}

export function degrees(n: number, edges: Edge[]) {
  const deg = new Array(n).fill(0);
  for (const [a, b] of edges) { deg[a] += 1; deg[b] += 1; }
  return deg;
}

function find(parent: number[], x: number): number {
  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
  return x;
}

/** Dijkstra distance s→t; used by tests to cross-check the stored answers. */
export function shortest(n: number, edges: Edge[], s: number, t: number) {
  const dist = new Array(n).fill(Infinity);
  dist[s] = 0;
  const done = new Array(n).fill(false);
  for (let k = 0; k < n; k += 1) {
    let u = -1;
    for (let i = 0; i < n; i += 1) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    done[u] = true;
    for (const [a, b, w] of edges) {
      if (a === u && dist[u] + w < dist[b]) dist[b] = dist[u] + w;
      if (b === u && dist[u] + w < dist[a]) dist[a] = dist[u] + w;
    }
  }
  return dist[t];
}

export function mstTotal(n: number, edges: Edge[]) {
  const parent = [...Array(n).keys()];
  let total = 0;
  for (const [a, b, w] of [...edges].sort((x, y) => x[2] - y[2])) {
    const ra = find(parent, a), rb = find(parent, b);
    if (ra !== rb) { parent[ra] = rb; total += w; }
  }
  return total;
}

export function evalGraph(level: Level, sol: GraphSolution): EvalResult {
  const { n, edges, task } = level.data as { n: number; edges: Edge[]; task: string };
  if (task === "euler") {
    const cls = sol.cls ?? "";
    const want = level.answer.class as string;
    const star1 = cls === want;
    const odd = new Set<string>(level.answer.oddVertices);
    const ends = new Set(sol.ends ?? []);
    const endsOk = want !== "path" || (ends.size === 2 && [...ends].every((e) => odd.has(e)));
    const star2 = star1 && endsOk;
    const message = !cls
      ? "Chọn một khả năng rồi bấm Chạy thử."
      : !star1
        ? "Đếm số dây nối vào từng đèn rồi thử lại."
        : !endsOk ? "Đúng là đi được. Điểm đầu và cuối chưa đúng." : "Đúng rồi.";
    return { ok: star1, stars: [star1, star2, false], message, detail: { deg: degrees(n, edges) } };
  }
  const chosen = (sol.edges ?? []).map((i) => edges[i]).filter(Boolean);
  const total = chosen.reduce((s, e) => s + e[2], 0);
  if (task === "shortest") {
    const s = LET.indexOf(level.data.from), t = LET.indexOf(level.data.to);
    // Walk from s along chosen edges; valid iff it is one simple path ending at t using every chosen edge.
    const used = new Set<number>();
    let cur = s, steps = 0, valid = chosen.length > 0;
    const seen = new Set([s]);
    while (valid && cur !== t) {
      const next = chosen.findIndex((e, i) => !used.has(i) && (e[0] === cur || e[1] === cur));
      if (next < 0) { valid = false; break; }
      used.add(next);
      const e = chosen[next];
      cur = e[0] === cur ? e[1] : e[0];
      if (seen.has(cur)) { valid = false; break; }
      seen.add(cur);
      steps += 1;
    }
    valid = valid && cur === t && used.size === chosen.length;
    const best = level.answer.length as number;
    const star2 = valid && total === best;
    const message = !valid
      ? `Các dây đã chọn chưa thành một đường liền từ ${level.data.from} tới ${level.data.to}.`
      : star2 ? `Đường dài ${total}, ngắn nhất.` : `Đường dài ${total}. Có đường ngắn hơn đấy.`;
    return { ok: valid, stars: [valid, star2, false], message, detail: { total, steps } };
  }
  // mst
  const parent = [...Array(n).keys()];
  let cycle = false;
  for (const [a, b] of chosen) {
    const ra = find(parent, a), rb = find(parent, b);
    if (ra === rb) cycle = true;
    else parent[ra] = rb;
  }
  const roots = new Set([...Array(n).keys()].map((i) => find(parent, i)));
  const valid = !cycle && roots.size === 1 && chosen.length === n - 1;
  const best = level.answer.total as number;
  const star2 = valid && total === best;
  const message = cycle
    ? "Có dây tạo thành vòng kín; bỏ bớt một dây trong vòng."
    : roots.size > 1 ? `Còn ${roots.size} cụm đèn chưa nối với nhau.`
      : star2 ? `Mọi đèn đã nối, tổng ${total}: ít nhất.` : `Mọi đèn đã nối, tổng ${total}. Có cách tốn ít dây hơn.`;
  return { ok: valid, stars: [valid, star2, false], message, detail: { total } };
}

/* ---------- modular ---------- */

export const WEEK = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];

export interface ModSolution { x?: number | null; index?: number | null }

export function modPow(a: number, k: number, m: number) {
  let r = 1 % m, base = a % m, e = k;
  while (e > 0) { if (e & 1) r = (r * base) % m; base = (base * base) % m; e >>= 1; }
  return r;
}

export function evalModular(level: Level, sol: ModSolution): EvalResult {
  const d = level.data;
  const kind = d.kind as string;
  if (kind === "crt") {
    const x = sol.x ?? NaN;
    const M = (d.moduli as number[]).reduce((p: number, m: number) => p * m, 1);
    const locks = (d.moduli as number[]).map((m, i) => ({ m, want: d.residues[i] as number, got: ((x % m) + m) % m }));
    const inRange = Number.isInteger(x) && x >= 0 && x < M;
    const open = locks.filter((l) => l.got === l.want).length;
    const ok = inRange && open === locks.length;
    const message = !Number.isInteger(x) ? "Nhập một số rồi bấm Chạy thử." : !inRange ? `Số cần nằm trong 0..${M - 1}.` : ok ? `Mở cả ${locks.length} ổ khóa.` : `Mở được ${open}/${locks.length} ổ khóa.`;
    return { ok, stars: [ok, ok, false], message, detail: { locks } };
  }
  if (kind === "weekday") {
    const want = ((d.weekday as number) + (d.days as number)) % 7;
    const ok = sol.index === want;
    return { ok, stars: [ok, ok, false], message: ok ? `Đúng, ${WEEK[want]}.` : "Chưa đúng thứ. Thử tính số ngày dư khi chia cho 7." };
  }
  if (kind === "lastdigit") {
    const want = modPow(d.a, d.k, 10);
    const ok = sol.x === want;
    return { ok, stars: [ok, ok, false], message: ok ? `Chữ số tận cùng là ${want}.` : "Chưa đúng. Thử viết vài lũy thừa đầu để thấy chu kỳ." };
  }
  if (kind === "choice") {
    const ok = sol.index === level.answer.index;
    return { ok, stars: [ok, ok, false], message: ok ? "Mở ổ khóa." : "Ổ khóa chưa mở. Thử chia cho 7." };
  }
  // number
  const ok = sol.x === level.answer.x;
  return { ok, stars: [ok, ok, false], message: ok ? "Mở ổ khóa." : `Số ${sol.x ?? "?"} chưa mở được ổ khóa.` };
}

/* ---------- count ---------- */

export interface CountSolution { count?: number | null; choice?: number | null }

export const comb = (n: number, k: number) => {
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
export const perm = (n: number, k: number) => {
  let r = 1;
  for (let i = 0; i < k; i += 1) r *= n - i;
  return r;
};
export function gridPaths(W: number, H: number, blocked?: [number, number]) {
  const dp: number[][] = Array.from({ length: H + 1 }, () => new Array(W + 1).fill(0));
  for (let y = 0; y <= H; y += 1) for (let x = 0; x <= W; x += 1) {
    if (blocked && blocked[0] === x && blocked[1] === y) { dp[y][x] = 0; continue; }
    if (x === 0 && y === 0) { dp[y][x] = 1; continue; }
    dp[y][x] = (x ? dp[y][x - 1] : 0) + (y ? dp[y - 1][x] : 0);
  }
  return dp;
}

export function evalCount(level: Level, sol: CountSolution, casual: boolean): EvalResult {
  const want = level.answer.count as number;
  const got = casual && level.casual?.choices && sol.choice != null ? level.casual.choices[sol.choice] : sol.count;
  const ok = got === want;
  const message = got == null ? "Nhập số cách rồi bấm Chạy thử." : ok ? `Đúng, ${want} cách.` : `${got} chưa đúng. Thử đếm với trường hợp nhỏ hơn.`;
  return { ok, stars: [ok, ok, false], message };
}
