import { Store } from "../core/storage";
import { developerMode } from "./developer";
import type { Difficulty, DifficultyProfile } from "./play";
import { emptyStory, type StoryContent, type StoryState } from "../puzzles/logic/story";

export type { Line as StoryLine, StoryState, EndingId, E2Variant } from "../puzzles/logic/story";

export interface ModeBrief { title: string; speaker: string; intro: string; goal: string; payoff: string; activities?: Record<string, { title: string; intro: string; payoff: string }> }
export interface StoryData extends StoryContent {
  difficulties: Record<Difficulty, DifficultyProfile>;
  modes: Record<string, ModeBrief>;
}

const isStrList = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");
const isStrMap = (v: unknown) => v !== null && typeof v === "object" && !Array.isArray(v) && Object.values(v as object).every((x) => typeof x === "string");

/**
 * Bản lưu cốt truyện. Version 4 (bản 2.8) thay hẳn cấu trúc 2.7: step/answers/fieldChoices được
 * chuyển thành legacyStep; màn đi bộ dùng story.json để nhảy tới điểm dừng tương ứng (migrateLegacy).
 */
export const storySave = new Store<StoryState>({
  key: "hoitu70:story", version: 4, defaults: emptyStory,
  migrations: {
    1: (s) => ({ ...s, introSeen: Number(s.step) > 0, bond: "listen", asked: [] }),
    2: (s) => ({ ...s, activeSeconds: 0, fieldChoices: {}, rehearsals: 0 }),
    3: (s) => ({
      step: 0,
      introSeen: Boolean(s.introSeen),
      bond: s.bond === "build" ? "build" : "listen",
      decisions: {}, topics: [], lamps: [],
      activeSeconds: Number.isFinite(Number(s.activeSeconds)) ? Math.max(0, Number(s.activeSeconds)) : 0,
      endingsSeen: [], lastEnding: null, chatSeen: 0,
      legacyStep: Number.isInteger(s.step) ? Math.max(0, Math.min(6, Number(s.step))) : 0,
    }),
  },
  validate: (s) => Number.isInteger(s.step) && s.step >= 0 && s.step <= 64
    && typeof s.introSeen === "boolean" && (s.bond === "listen" || s.bond === "build")
    && isStrMap(s.decisions) && isStrList(s.topics) && isStrList(s.lamps) && isStrList(s.endingsSeen)
    && Number.isFinite(s.activeSeconds) && s.activeSeconds >= 0
    && (s.lastEnding === null || typeof s.lastEnding === "string")
    && Number.isInteger(s.chatSeen) && s.chatSeen >= 0 && Number.isInteger(s.legacyStep) && s.legacyStep >= 0 ? s : null,
});

const clone = (s: StoryState): StoryState => ({
  ...s,
  decisions: { ...s.decisions },
  topics: [...s.topics],
  lamps: [...s.lamps],
  endingsSeen: [...s.endingsSeen],
  sidequests: { ...(s.sidequests ?? {}) },
  eggs: [...(s.eggs ?? [])],
  boards: [...(s.boards ?? [])],
});
let testStory: StoryState | null = null;
/** Hack mode chạy trên bản sao trong bộ nhớ; bản lưu thật không bị đụng tới. */
export const storyProgress = {
  get(): StoryState {
    if (!developerMode()) return storySave.get() as StoryState;
    return testStory ??= clone(storySave.get() as StoryState);
  },
  set(value: Partial<StoryState>) {
    if (developerMode()) testStory = { ...this.get(), ...value };
    else storySave.set(value);
  },
  replace(value: StoryState) { this.set(clone(value)); },
  reset() {
    const keep = this.get().endingsSeen;
    if (developerMode()) testStory = { ...emptyStory(), endingsSeen: [...keep] };
    else { storySave.reset(); storySave.set({ endingsSeen: [...keep] }); }
  },
  flush() { if (!developerMode()) storySave.flush(); },
};
