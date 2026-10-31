/** Shared data shapes. Level JSON comes from public/data (handwritten) and levels_generated.json. */

export type ModuleId =
  | "plot-limit" | "series" | "removable" | "pick-limit"
  | "beam-order" | "transpose-bug" | "block-vm"
  | "graph" | "modular" | "count" | "finale";

export type Stars = [boolean, boolean, boolean];

export interface CasualText {
  prompt: string;
  hints: string[];
  labels?: Record<string, string>;
  mirrorNames?: Record<string, string>;
  choices?: number[];
  answerIndex?: number;
}

export interface Level {
  id: string;
  module: ModuleId;
  prompt: string;
  title?: string;
  circuit?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer: any;
  hints: string[];
  stars?: { star1?: unknown; star2?: unknown; star3?: { maxBlocks?: number; maxRuns?: number } };
  starText?: string[];
  difficulty?: number;
  seed?: number;
  casual?: CasualText | null;
  checks?: string[];
}

export interface Circuit {
  id: number;
  name: string;
  topic: string;
  priority: string;
  color: string;
  levels: string[];
}

export interface EvalCtx {
  /** Runs including this one. */
  runs: number;
  assist: boolean;
  casual: boolean;
  maxRuns: number;
  toleranceFactor: number;
}

export interface EvalResult {
  ok: boolean;
  stars: Stars;
  /** One line for Tia: describes what happened, never judges the player. */
  message: string;
  /** Extra info the view can draw (numbers, paths). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detail?: any;
}

export const STAR_DEFAULT_TEXT: [string, string, string] = ["Hoàn thành", "Chính xác", "Gọn"];
