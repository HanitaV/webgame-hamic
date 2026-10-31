import type { ModuleId } from "../../game/types";
import { mountPick, mountPlot, mountRemovable, mountSeries } from "./analysis";
import { mountBlocks } from "./blocks";
import { mountCount, mountGraph, mountModular } from "./discrete";
import { mountBeam, mountTranspose } from "./linear";
import type { Mount } from "./types";

export const VIEWS: Partial<Record<ModuleId, Mount>> = {
  "plot-limit": mountPlot,
  series: mountSeries,
  removable: mountRemovable,
  "pick-limit": mountPick,
  "beam-order": mountBeam,
  "transpose-bug": mountTranspose,
  "block-vm": mountBlocks,
  graph: mountGraph,
  modular: mountModular,
  count: mountCount,
};
