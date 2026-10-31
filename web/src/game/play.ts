import { DATA } from "../core/data";
import { Store } from "../core/storage";

export const DIFFICULTIES = ["easy", "normal", "hard"] as const;
export type Difficulty = typeof DIFFICULTIES[number];
export interface DifficultyProfile { name: string; description: string; generated: [number, number]; casualMax: number; practice: number; assist: boolean }
export const playSettings = new Store<{ difficulty: Difficulty }>({
  key: "hoitu70:play", version: 1, defaults: () => ({ difficulty: "normal" }),
  validate: (s) => DIFFICULTIES.includes(s.difficulty) ? s : null,
});
export const difficulty = () => playSettings.get().difficulty;
export const difficultyProfile = () => DATA.story.difficulties[difficulty()];
