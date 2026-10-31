import type { Difficulty } from "./play";
import { developerMode } from "./developer";
/**
 * Progress (stars, circuits, facts, counters, flags) and achievement rules (GDD 3.3, 5.3, 7).
 * Keys: journey level ids ("1.1"), casual "c:<id>", daily "d:<date>:<id>", practice "p:<id>".
 * Guest mode uses an in-memory copy that is never saved.
 */

import { bus } from "../core/events";
import { DATA, type Achievement } from "../core/data";
import { Store } from "../core/storage";
import type { Level, Stars } from "./types";
import { settings } from "./settings";
import { t } from "../core/i18n";
import { storyProgress } from "./story";
import { ENDING_IDS, deriveFlags, storyFacts } from "../puzzles/logic/story";

export type Mode = "journey" | "casual" | "daily" | "practice" | "lab" | "guest" | "finale";

export interface LevelRecord { done: boolean; stars: Stars; hints: number; runs: number }

export interface ProgressData {
  levels: Record<string, LevelRecord>;
  lit: number[];
  casualLit: number[];
  factsN: number[];
  achievements: Record<string, number>;
  counters: { runs: number; casualDone: number };
  flags: Record<string, boolean>;
  dailyDays: string[];
}

const empty = (): ProgressData => ({
  levels: {}, lit: [], casualLit: [], factsN: [], achievements: {},
  counters: { runs: 0, casualDone: 0 }, flags: {}, dailyDays: [],
});

const store = new Store<ProgressData>({ key: "hoitu70:progress", version: 1, defaults: empty });

let guest: ProgressData | null = null;

let developerProgress: ProgressData | null = null;
function devProgress(): ProgressData {
  if (!developerProgress) {
    developerProgress = empty();
    for (const id of DATA.levels.keys()) {
      const r: LevelRecord = { done: true, stars: [true,true,true], hints: 0, runs: 1 };
      for (const key of [id, `c:${id}`, `p:${id}`]) developerProgress.levels[key] = { ...r };
    }
    developerProgress.lit = DATA.circuits.map((c) => c.id);
    developerProgress.casualLit = [...developerProgress.lit];
    developerProgress.factsN = DATA.factsN.map((f) => f.n);
    developerProgress.achievements = Object.fromEntries(DATA.achievements.map((a) => [a.id, Date.now()]));
  }
  return developerProgress;
}
export const P = {
  get(): ProgressData { return developerMode() ? devProgress() : guest ?? (store.get() as ProgressData); },
  set(patch: Partial<ProgressData>) {
    if (developerMode()) Object.assign(devProgress(), patch);
    else if (guest) Object.assign(guest, patch);
    else store.set(patch);
    bus.emit("progress", {});
  },
  saveOk(): boolean { return store.ok; },
  startGuest() { guest = empty(); },
  endGuest() { guest = null; bus.emit("progress", {}); },
  isGuest() { return guest !== null; },
  reset() { if (developerMode()) developerProgress = null; else store.reset(); bus.emit("progress", {}); },
  exportJson(): string {
    return JSON.stringify({ app: "hoi-tu-70", version: 1, exportedAt: new Date().toISOString(), progress: store.get(), settings: settings.get() }, null, 1);
  },
  importJson(text: string): boolean {
    try {
      const d = JSON.parse(text);
      if (d.app !== "hoi-tu-70" || typeof d.progress !== "object") return false;
      store.set({ ...empty(), ...d.progress });
      if (d.settings) settings.set(d.settings);
      store.flush(true);
      bus.emit("progress", {});
      return true;
    } catch {
      return false;
    }
  },
};

export function record(key: string): LevelRecord {
  return P.get().levels[key] ?? { done: false, stars: [false, false, false], hints: 0, runs: 0 };
}

function putRecord(key: string, r: LevelRecord) {
  P.set({ levels: { ...P.get().levels, [key]: r } });
}

export function noteRun(key: string) {
  const r = record(key);
  putRecord(key, { ...r, runs: r.runs + 1 });
  const p = P.get();
  P.set({ counters: { ...p.counters, runs: p.counters.runs + 1 } });
  checkAchievements();
}

export function noteHint(key: string, tier: number) {
  const r = record(key);
  if (tier > r.hints) putRecord(key, { ...r, hints: tier });
}

export function setFlag(flag: string) {
  if (P.get().flags[flag]) return;
  P.set({ flags: { ...P.get().flags, [flag]: true } });
  checkAchievements();
}

/** Number the "sự thật về n" unlock uses: the level's numeric answer if in 1..200, else null. */
function answerNumber(level: Level): number | null {
  const a = level.answer ?? {};
  for (const k of ["count", "x", "value", "expected", "length", "total", "N", "a"]) {
    const v = a[k];
    if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 200) return v;
  }
  return null;
}

function unlockFact(level: Level) {
  const have = new Set(P.get().factsN);
  let n = answerNumber(level);
  if (n === null || have.has(n)) {
    n = null;
    for (let i = 1; i <= 200; i += 1) if (!have.has(i)) { n = i; break; }
  }
  if (n !== null) P.set({ factsN: [...P.get().factsN, n] });
}

/** Record a solved level and light circuits. Returns the circuit lit by this completion, if any. */
export function completeLevel(key: string, level: Level, stars: Stars, mode: Mode): number | null {
  const prev = record(key);
  const merged: Stars = [prev.stars[0] || stars[0], prev.stars[1] || stars[1], prev.stars[2] || stars[2]];
  const firstTime = !prev.done;
  putRecord(key, { ...prev, done: true, stars: merged });
  if (firstTime) unlockFact(level);
  let lit: number | null = null;
  const p = P.get();
  if (mode === "journey" || mode === "guest" || mode === "finale") {
    if (p.flags.playedCasual && mode === "journey") setFlag("casualToJourney");
    const c = DATA.circuits.find((x) => x.levels.includes(level.id));
    if (c && !p.lit.includes(c.id) && c.levels.every((id) => record(id).done)) {
      P.set({ lit: [...P.get().lit, c.id] });
      lit = c.id;
    }
  }
  if (mode === "casual") {
    if (firstTime) P.set({ counters: { ...P.get().counters, casualDone: P.get().counters.casualDone + 1 } });
    const circ = Object.entries(DATA.config.casual.circuits).find(([, mods]) => mods.includes(level.module));
    if (circ) {
      const cid = Number(circ[0]);
      const doneHere = Object.entries(P.get().levels).filter(([k, r]) => k.startsWith("c:") && r.done && circ[1].includes(DATA.levels.get(k.slice(2))?.module ?? "")).length;
      if (!P.get().casualLit.includes(cid) && doneHere >= DATA.config.casual.levelsToLight) {
        P.set({ casualLit: [...P.get().casualLit, cid] });
        lit = cid;
      }
    }
  }
  if (mode === "daily") {
    const day = key.split(":")[1];
    const ids = dailyIds(day);
    if (ids.every((id) => record(`d:${day}:${id}`).done)) {
      const calendarDay = day.split("~")[0];
      P.set({ flags: { ...P.get().flags, [`dailyDone:${day}`]: true }, dailyDays: P.get().dailyDays.includes(calendarDay) ? P.get().dailyDays : [...P.get().dailyDays, calendarDay] });
    }
  }
  if (mode === "practice") setFlag("practiceDone");
  bus.emit("levelDone", { levelId: level.id, stars: merged, mode });
  if (lit !== null) bus.emit("circuitLit", { circuit: lit, mode });
  checkAchievements();
  return lit;
}

/* ---------- derived ---------- */

export function journeyStars(): number {
  let n = 0;
  for (const c of DATA.circuits) for (const id of c.levels) n += record(id).stars.filter(Boolean).length;
  return n + (allLit() ? 1 : 0);
}

export const maxStars = () => DATA.circuits.reduce((s, c) => s + c.levels.length * 3, 0) + 1;

export function allLit() {
  return DATA.circuits.every((c) => P.get().lit.includes(c.id));
}

export function finaleUnlocked() {
  if (developerMode()) return true;
  const f = DATA.config.finaleUnlock;
  return f.journeyCircuits.every((c) => P.get().lit.includes(c)) || P.get().casualLit.length >= f.casualAnyCircuits;
}

/** Circuits whose "sự thật về 70" is open: lit in Hành trình or in Dạo chơi. */
export function coreFactsOpen(): Set<number> {
  return new Set([...P.get().lit, ...P.get().casualLit, ...(DATA?.story?.stops ? storyFacts(DATA.story, storyProgress.get()) : [])]);
}

export function levelUnlocked(levelId: string): boolean {
  if (developerMode()) return true;
  const c = DATA.circuits.find((x) => x.levels.includes(levelId));
  if (!c) return true;
  if (c.id === 7) return finaleUnlocked();
  // GDD 3.2: circuits 2–6 open freely once circuit 1 is lit; levels inside a circuit open in order.
  if (c.id !== 1 && !P.get().lit.includes(1)) return false;
  const i = c.levels.indexOf(levelId);
  return i === 0 || record(c.levels[i - 1]).done;
}

/* ---------- daily (GDD 6: same seed for everyone on the same day) ---------- */

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DATA.config.daily.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailyIds(day: string): string[] {
  const [date, requested] = day.split("~");
  const profile = DATA.story.difficulties[requested as Difficulty];
  const seed = Number(date.replaceAll("-", ""));
  const rnd = mulberry(seed);
  const pool = DATA.generated.filter((l) => profile ? (l.difficulty ?? 1) >= profile.generated[0] && (l.difficulty ?? 1) <= profile.generated[1] : (l.difficulty ?? 1) <= DATA.config.daily.maxDifficulty);
  const mods = [...new Set(pool.map((l) => l.module))];
  const picked: string[] = [];
  while (picked.length < DATA.config.daily.count && mods.length) {
    const m = mods.splice(Math.floor(rnd() * mods.length), 1)[0];
    const options = pool.filter((l) => l.module === m);
    picked.push(options[Math.floor(rnd() * options.length)].id);
  }
  return picked;
}

/* ---------- achievements ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ruleValue(rule: any): number {
  const p = P.get();
  switch (rule.kind) {
    case "levelDone": return record(rule.level).done ? 1 : 0;
    case "levelStar": return record(rule.level).stars[rule.star - 1] ? 1 : 0;
    case "circuitLit": return p.lit.includes(rule.circuit) ? 1 : 0;
    case "all": return rule.of.every((r: unknown) => ruleValue(r) >= 1) ? 1 : 0;
    case "flag": return p.flags[rule.flag] ? 1 : 0;
    case "storyEndings": return storyProgress.get().endingsSeen.filter((id) => (ENDING_IDS as string[]).includes(id)).length;
    case "storyTopics": return storyProgress.get().topics.length;
    case "storyLamps": return new Set(storyProgress.get().lamps).size;
    case "storyFlag": return deriveFlags(DATA.story, storyProgress.get()).has(rule.flag) ? 1 : 0;
    case "circuitStarCount": {
      const c = DATA.circuits.find((x) => x.id === rule.circuit);
      return c ? c.levels.filter((id) => record(id).stars[rule.star - 1]).length : 0;
    }
    case "allCircuitsLit": return allLit() ? 1 : 0;
    case "anyCircuitAllStars": return DATA.circuits.some((c) => c.levels.every((id) => record(id).stars.every(Boolean))) ? 1 : 0;
    case "anyCircuitNoHints": return DATA.circuits.some((c) => p.lit.includes(c.id) && c.levels.every((id) => record(id).done && record(id).hints === 0)) ? 1 : 0;
    case "coreFacts": return coreFactsOpen().size;
    case "counter": return (p.counters as Record<string, number>)[rule.counter] ?? 0;
    case "dailyDays": return p.dailyDays.length;
    case "factsN": return p.factsN.length;
  }
  return 0;
}

export function achievementProgress(a: Achievement): { value: number; target: number; done: boolean } {
  const target = a.target ?? 1;
  const value = Math.min(target, ruleValue(a.rule));
  return { value, target, done: a.id in P.get().achievements };
}

export function checkAchievements() {
  if (P.isGuest()) return;
  for (const a of DATA.achievements) {
    if (a.id in P.get().achievements) continue;
    const { value, target } = achievementProgress(a);
    if (value >= target) {
      P.set({ achievements: { ...P.get().achievements, [a.id]: Date.now() } });
      bus.emit("achievement", { id: a.id });
      if (settings.get().achievementToasts) bus.emit("toast", { title: t("toast.achievement"), text: a.name, kind: "achievement" });
    }
  }
}
