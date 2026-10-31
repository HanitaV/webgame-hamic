/** Mạch 3 — khối lệnh: the block language, its interpreter, and evaluation. */

import type { EvalCtx, EvalResult, Level } from "../../game/types";

export type Dir = "right" | "left" | "up" | "down";

export type Block =
  | { t: "repeat"; n: number; body: Block[] }
  | { t: "for"; v: string; from: number; to: number; body: Block[] }
  | { t: "place" }
  | { t: "move"; dir: Dir }
  | { t: "newline" }
  | { t: "color"; c: "A" | "B" }
  | { t: "ifEven"; v: string; body: Block[]; else: Block[] }
  | { t: "set"; v: string; value: number }
  | { t: "addVar"; v: string; src: string }
  | { t: "addConst"; v: string; k: number }
  | { t: "addLinear"; v: string; a: number; d: number; src: string };

export type BlockType = Block["t"];

export const CONTAINERS: BlockType[] = ["repeat", "for", "ifEven"];

export interface RunResult {
  lights: Map<string, "A" | "B">;
  vars: Record<string, number>;
  /** Drone path for animation: each entry is a position, `place` set when a light was put there. */
  trace: { x: number; y: number; place?: "A" | "B" }[];
  steps: number;
  error?: string;
}

const key = (x: number, y: number) => `${x},${y}`;

export function runProgram(program: Block[], maxSteps = 200_000): RunResult {
  const lights = new Map<string, "A" | "B">();
  const vars: Record<string, number> = {};
  const trace: RunResult["trace"] = [{ x: 0, y: 0 }];
  let x = 0, y = 0, color: "A" | "B" = "A", steps = 0;
  const traceCap = 4000;
  const read = (v: string) => {
    if (!(v in vars)) throw new Error(`Biến ${v} chưa có giá trị: thêm khối "Đặt ${v} = 0" ở đầu chương trình.`);
    return vars[v];
  };
  const exec = (blocks: Block[]) => {
    for (const b of blocks) {
      steps += 1;
      if (steps > maxSteps) throw new Error("Chương trình chạy quá lâu, có thể số lặp quá lớn.");
      switch (b.t) {
        case "repeat":
          for (let i = 0; i < b.n; i += 1) exec(b.body);
          break;
        case "for":
          for (let i = b.from; i <= b.to; i += 1) {
            vars[b.v] = i;
            exec(b.body);
          }
          break;
        case "place":
          lights.set(key(x, y), color);
          if (trace.length < traceCap) trace.push({ x, y, place: color });
          break;
        case "move":
          if (b.dir === "right") x += 1;
          else if (b.dir === "left") x -= 1;
          else if (b.dir === "up") y -= 1;
          else y += 1;
          if (trace.length < traceCap) trace.push({ x, y });
          break;
        case "newline":
          x = 0;
          y += 1;
          if (trace.length < traceCap) trace.push({ x, y });
          break;
        case "color":
          color = b.c;
          break;
        case "ifEven":
          exec(read(b.v) % 2 === 0 ? b.body : b.else);
          break;
        case "set":
          vars[b.v] = b.value;
          break;
        case "addVar":
          vars[b.v] = read(b.v) + read(b.src);
          break;
        case "addConst":
          vars[b.v] = read(b.v) + b.k;
          break;
        case "addLinear":
          vars[b.v] = read(b.v) + b.a + b.d * read(b.src);
          break;
      }
    }
  };
  try {
    exec(program);
    return { lights, vars, trace, steps };
  } catch (error) {
    return { lights, vars, trace, steps, error: error instanceof Error ? error.message : String(error) };
  }
}

export function countBlocks(program: Block[]): number {
  let n = 0;
  for (const b of program) {
    n += 1;
    if (b.t === "repeat" || b.t === "for") n += countBlocks(b.body);
    if (b.t === "ifEven") n += countBlocks(b.body) + countBlocks(b.else);
  }
  return n;
}

/* ---------- Targets ---------- */

/** Cells a light pattern asks for. Formats: [[x,y(,c)],…], "rect:WxH", "parity:N", "digits:70". */
export function patternCells(pattern: unknown): Map<string, "A" | "B" | null> {
  const out = new Map<string, "A" | "B" | null>();
  if (Array.isArray(pattern)) {
    for (const p of pattern as [number, number, ("A" | "B")?][]) out.set(key(p[0], p[1]), p[2] ?? null);
    return out;
  }
  const s = String(pattern);
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^rect:(\d+)x(\d+)$/))) {
    for (let y = 0; y < +m[2]; y += 1) for (let x = 0; x < +m[1]; x += 1) out.set(key(x, y), null);
  } else if ((m = s.match(/^parity:(\d+)$/))) {
    for (let i = 1; i <= +m[1]; i += 1) out.set(key(i - 1, 0), i % 2 === 0 ? "A" : "B");
  } else if (s === "digits:70") {
    const seven = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4]];
    const zero = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4], [0, 1], [0, 2], [0, 3]];
    for (const [x, y] of seven) out.set(key(x, y), null);
    for (const [x, y] of zero) out.set(key(x + 4, y), null);
  }
  return out;
}

/* ---------- Generated levels: convert gen_levels.py programs ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PyNode = any[];

export function fromPython(prog: PyNode[]): Block[] {
  return prog.map((op): Block => {
    const kind = op[0];
    if (kind === "set") return { t: "set", v: op[1], value: op[2][1] };
    if (kind === "for") return { t: "for", v: op[1], from: op[2], to: op[3], body: fromPython(op[4]) };
    if (kind === "if") return { t: "ifEven", v: op[1], body: fromPython(op[4]), else: [] };
    if (kind === "add_to") {
      const e = op[2];
      if (e[0] === "var") return { t: "addVar", v: op[1], src: e[1] };
      if (e[0] === "int") return { t: "addConst", v: op[1], k: e[1] };
      if (e[0] === "add" && e[1][0] === "int" && e[2][0] === "mul") {
        return { t: "addLinear", v: op[1], a: e[1][1], d: e[2][1][1], src: e[2][2][1] };
      }
    }
    throw new Error(`khối không hỗ trợ: ${JSON.stringify(op)}`);
  });
}

/** Normalised block-level setup: palette, start program, goal, star3 limit and reference solution. */
export function blockSetup(level: Level) {
  const d = level.data;
  if (d.kind === "lights" || d.kind === "var") {
    const ref: Block[] | undefined = level.answer?.solution;
    return {
      palette: (d.palette ?? []) as BlockType[],
      start: (d.start ?? []) as Block[],
      goal: d.kind === "lights" ? { type: "lights" as const, cells: patternCells(d.pattern) } : { type: "var" as const, v: d.variable as string, equals: level.answer.expected as number },
      maxBlocks: level.stars?.star3?.maxBlocks ?? (ref ? countBlocks(ref) : Infinity),
      reference: ref,
      grid: (d.grid ?? [10, 7]) as [number, number],
      lockStructure: Boolean(d.lockStructure),
      offByOne: d.offByOne as { buggyResult: number; missing: number } | undefined,
    };
  }
  // gen_levels.py block-vm levels
  const ref = fromPython(d.kind === "offbyone" ? level.answer.fixed : level.answer.reference);
  const paletteByKind: Record<string, BlockType[]> = {
    sum_to_n: ["set", "for", "addVar"],
    sum_arith: ["set", "for", "addLinear"],
    count_even: ["set", "for", "ifEven", "addConst"],
    grid: ["set", "for", "addConst"],
    offbyone: ["set", "for", "addVar"],
  };
  const variable = d.kind === "offbyone" ? "s" : (d.variable as string);
  return {
    palette: paletteByKind[d.kind] ?? ["set", "for", "addVar"],
    start: d.kind === "offbyone" ? fromPython(d.buggy) : [],
    goal: { type: "var" as const, v: variable, equals: level.answer.expected as number },
    maxBlocks: countBlocks(ref),
    reference: ref,
    grid: [10, 7] as [number, number],
    lockStructure: false,
    offByOne: d.kind === "offbyone" ? { buggyResult: level.answer.buggyResult as number, missing: level.answer.expected - level.answer.buggyResult } : undefined,
  };
}

export interface BlockSolution { program: Block[] }

export function evalBlocks(level: Level, sol: BlockSolution, ctx: EvalCtx): EvalResult {
  const setup = blockSetup(level);
  const run = runProgram(sol.program);
  const used = countBlocks(sol.program);
  if (run.error) return { ok: false, stars: [false, false, false], message: run.error, detail: { run, used } };
  let star1 = false, star2 = false, message = "";
  if (setup.goal.type === "lights") {
    const want = setup.goal.cells;
    let hit = 0, wrongColor = 0;
    for (const [k, c] of want) {
      const got = run.lights.get(k);
      if (got !== undefined && (c === null || got === c)) hit += 1;
      else if (got !== undefined) wrongColor += 1;
    }
    const extra = [...run.lights.keys()].filter((k) => !want.has(k)).length;
    star1 = hit === want.size;
    star2 = star1 && extra === 0;
    message = star1
      ? extra === 0 ? `Đủ ${want.size} đèn, đúng vị trí.` : `Đủ ${want.size} đèn, nhưng có thêm ${extra} đèn ngoài hình.`
      : `Mới sáng đúng ${hit}/${want.size} đèn${wrongColor ? `, ${wrongColor} đèn sai màu` : ""}${extra ? `, ${extra} đèn ngoài hình` : ""}.`;
  } else {
    const got = run.vars[setup.goal.v];
    star1 = got === setup.goal.equals;
    star2 = star1;
    if (star1) message = `${setup.goal.v} = ${got}. Đúng giá trị cần.`;
    else if (got === undefined) message = `Chưa có biến ${setup.goal.v}. Thêm khối "Đặt ${setup.goal.v} = 0".`;
    else if (setup.offByOne && got === setup.offByOne.buggyResult) message = `${setup.goal.v} = ${got}, thiếu đúng ${setup.offByOne.missing}: dấu hiệu của lỗi lệch một.`;
    else message = `${setup.goal.v} = ${got}, cần ${setup.goal.equals}.`;
  }
  const star3 = star1 && !ctx.casual && !setup.lockStructure && used <= setup.maxBlocks;
  return { ok: star1, stars: [star1, star2, star3], message, detail: { run, used, maxBlocks: setup.maxBlocks } };
}
