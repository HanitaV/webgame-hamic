/**
 * evaluate(level, solution, ctx) for every module (GDD 10.1 PuzzleModule.evaluate).
 * Module evaluators decide ★1 Hoàn thành and ★2 Chính xác; ★3 Gọn is the module's own rule
 * (block count) or, by default, "reached within maxRuns runs". Dạo chơi has no ★3 (GDD 6.1).
 */

import type { EvalCtx, EvalResult, Level } from "../../game/types";
import { evalPick, evalPlot, evalRemovable, evalSeries } from "./analysis";
import { evalBlocks } from "./blocks";
import { evalCount, evalGraph, evalModular } from "./discrete";
import { evalBeam, evalTranspose } from "./linear";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function evaluate(level: Level, solution: any, ctx: EvalCtx): EvalResult {
  let r: EvalResult;
  switch (level.module) {
    case "plot-limit": r = evalPlot(level, solution, ctx); break;
    case "series": r = evalSeries(level, solution); break;
    case "removable": r = evalRemovable(level, solution); break;
    case "pick-limit": r = evalPick(level, solution); break;
    case "beam-order": r = evalBeam(level, solution); break;
    case "transpose-bug": r = evalTranspose(level, solution); break;
    case "block-vm": return evalBlocks(level, solution, ctx);
    case "graph": r = evalGraph(level, solution); break;
    case "modular": r = evalModular(level, solution); break;
    case "count": r = evalCount(level, solution, ctx.casual); break;
    default: throw new Error(`module ${level.module}`);
  }
  const maxRuns = level.stars?.star3?.maxRuns ?? ctx.maxRuns;
  r.stars[2] = !ctx.casual && r.ok && ctx.runs <= maxRuns;
  return r;
}

export const defaultCtx = (over: Partial<EvalCtx> = {}): EvalCtx => ({
  runs: 1, assist: false, casual: false, maxRuns: 3, toleranceFactor: 2, ...over,
});
