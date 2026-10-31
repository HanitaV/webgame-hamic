/** Mạch 2 — Đại số tuyến tính: beam-order (gương) và transpose-bug. */

import type { EvalResult, Level } from "../../game/types";

export type Mat = [[number, number], [number, number]];
export type Vec = [number, number];

export const MATS: Record<string, Mat> = {
  R90: [[0, -1], [1, 0]],
  R180: [[-1, 0], [0, -1]],
  R270: [[0, 1], [-1, 0]],
  FX: [[1, 0], [0, -1]],
  FY: [[-1, 0], [0, 1]],
  FD: [[0, 1], [1, 0]],
  FA: [[0, -1], [-1, 0]],
};

export const MIRROR_NAMES: Record<string, string> = {
  R90: "Xoay 90°", R180: "Xoay 180°", R270: "Xoay 270°",
  FX: "Đối xứng qua trục x", FY: "Đối xứng qua trục y",
  FD: "Đối xứng qua y = x", FA: "Đối xứng qua y = −x",
};

/** Letters used on the mirror tiles, matching GDD 4.2 (R, S, F). */
export const MIRROR_SHORT: Record<string, string> = { R90: "R", R180: "R²", R270: "R³", FX: "F", FY: "F′", FD: "S", FA: "S′" };

export const mv = (m: Mat, v: Vec): Vec => [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
export const mm = (a: Mat, b: Mat): Mat => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
export const det = (m: Mat) => m[0][0] * m[1][1] - m[0][1] * m[1][0];

/** Apply mirrors in order: the first placed acts first (GDD 2.3). Returns every intermediate direction. */
export function beamPath(start: Vec, order: string[]): Vec[] {
  const out: Vec[] = [start];
  let v = start;
  for (const name of order) {
    v = mv(MATS[name], v);
    out.push(v);
  }
  return out;
}

export interface BeamSolution { order: string[] }

export function slotsOf(level: Level): number {
  return level.data.slots ?? level.data.mirrors.length;
}

export function evalBeam(level: Level, sol: BeamSolution): EvalResult {
  const { vector, target, mirrors } = level.data as { vector: Vec; target: Vec; mirrors: string[] };
  const slots = slotsOf(level);
  const pool = [...mirrors];
  for (const name of sol.order) {
    const i = pool.indexOf(name);
    if (i < 0) return { ok: false, stars: [false, false, false], message: "Mỗi gương chỉ dùng một lần." };
    pool.splice(i, 1);
  }
  if (sol.order.length !== slots) {
    return { ok: false, stars: [false, false, false], message: `Cần đặt đủ ${slots} gương (đang có ${sol.order.length}).`, detail: { path: beamPath(vector, sol.order) } };
  }
  const path = beamPath(vector, sol.order);
  const out = path[path.length - 1];
  const ok = out[0] === target[0] && out[1] === target[1];
  const message = ok
    ? `Tia ra đúng hướng (${target[0]}, ${target[1]}).`
    : `Tia ra theo hướng (${out[0]}, ${out[1]}), cần (${target[0]}, ${target[1]}).`;
  return { ok, stars: [ok, ok, false], message, detail: { path } };
}

/* ---------- transpose-bug ---------- */

export interface TransposeSolution { dir: "up" | "down" | "same" | ""; fixes: boolean | null; det: number | null }

/** Rotation from the level: a Pythagorean triple (generated) or an angle in degrees (handwritten 2.4). */
export function rotationOf(level: Level): { R: Mat; text: string[][] } {
  const d = level.data;
  if (d.triple) {
    const [a, b, h] = d.triple as number[];
    return { R: [[a / h, -b / h], [b / h, a / h]], text: [[`${a}/${h}`, `−${b}/${h}`], [`${b}/${h}`, `${a}/${h}`]] };
  }
  const t = ((d.angle as number) * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  const label = d.angle === 60 ? { c: "1/2", s: "√3/2" } : { c: c.toFixed(3), s: s.toFixed(3) };
  return { R: [[c, -s], [s, c]], text: [[label.c, `−${label.s}`], [label.s, label.c]] };
}

export function transposeOptions(level: Level): number[] {
  const k = level.data.scale as number;
  return [1, k, k * k, 2 * k];
}

export function evalTranspose(level: Level, sol: TransposeSolution): EvalResult {
  const k = level.data.scale as number;
  const { R } = rotationOf(level);
  const Rt: Mat = [[R[0][0], R[1][0]], [R[0][1], R[1][1]]];
  const d = level.data.d as Vec;
  const up = mv(R, d), down = mv(Rt, d);
  const realDir = down[1] < 0 ? "down" : down[1] > 0 ? "up" : "same";
  const dirOk = sol.dir === realDir;
  const fixOk = sol.fixes === false;
  const detOk = sol.det === k * k;
  const ok = dirOk && fixOk;
  let message: string;
  if (!dirOk) message = "Thử bấm Chạy thử và xem tia Rᵀ·d trên sa bàn đi về phía nào.";
  else if (!fixOk) message = `Nhân cả ma trận lên ${k} lần làm tia dài ra ${k} lần nhưng vẫn chúc xuống.`;
  else if (!detOk) message = `Đúng lỗi và cách sửa. Định thức của ${k}·R còn chưa đúng.`;
  else message = `Rᵀ là xoay ngược chiều; det(${k}·R) = ${k * k} ≠ 1 nên đó không phải cách sửa.`;
  return { ok, stars: [ok, ok && detOk, false], message, detail: { up, down } };
}
