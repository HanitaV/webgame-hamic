import type { EvalResult, Level } from "../../game/types";

export interface ViewCtx {
  level: Level;
  casual: boolean;
  /** Phòng thí nghiệm: no goal, free play. */
  lab: boolean;
  controls: HTMLElement;
  stage: HTMLElement;
  /** Call when the solution changes (lab uses it to watch for achievements). */
  changed(): void;
}

export interface PuzzleView {
  solution(): unknown;
  /** Draw the outcome of a run (null clears it). Returns ms the run animation takes. */
  show(result: EvalResult | null): number;
  destroy(): void;
}

export type Mount = (ctx: ViewCtx) => PuzzleView;
