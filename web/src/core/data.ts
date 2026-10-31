import type { StoryData } from "../game/story";
import type { EndingId, EndingRules } from "../puzzles/logic/story";
import { mapGraphLevel, type MapGraphCfg } from "../puzzles/logic/activities";
/** Loads every content file listed in GDD 8.2 from public/data. Editing those files needs no code change. */

import type { Circuit, Level } from "../game/types";

export interface Config {
  version: string;
  mode: "journey" | "guest";
  title: string;
  credits: string;
  greeting: string;
  greetingVerified: boolean;
  circuitsEnabled: number[];
  defaultMaxRuns: number;
  assist: { toleranceFactor: number; autoHintAfterFails: number };
  finaleUnlock: { journeyCircuits: number[]; casualAnyCircuits: number };
  guest: { levels: string[]; idleResetSeconds: number };
  casual: { enabled: boolean; maxDifficulty: number; circuits: Record<string, string[]>; levelsToLight: number };
  daily: { count: number; maxDifficulty: number; timeZone: string };
  practice: { modules: string[] };
  splashes: string[];
  endings: EndingRules;
  cinematics?: Partial<Record<EndingId, { src: string; poster: string; duration: number; audio?: string }>>;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  type: "HT" | "DL" | "TD";
  hidden: boolean;
  target?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rule: any;
}

export interface CoreFact { circuit: number; title: string; text: string; casual: string; source: string; divisors?: number[] }
export interface NFact { n: number; text: string; tags: string[] }
export interface Glossary { name: string; text: string; more: string }

export interface MapBuilding {
  id: string;
  name: string;
  x: number;
  z: number;
  h: number;
  w?: number;
  d?: number;
  footprints?: [number, number, number, number][];
  enterable?: boolean;
  entrance?: [number, number];
  entrances?: { id: string; position: [number, number]; side: string; width: number; zone?: string; title?: string; interiorFile?: string }[];
  entryBarriers?: number[][];
  entranceZone?: string;
  entranceTitle?: string;
  interiorFile?: string;
  interiorKind?: "lecture" | "lab" | "archive" | "hall";
  interiorTitle?: string;
  boardTitle?: string;
  boardFormula?: string;
}
export interface WalkEasterEgg {
  id: string;
  x: number;
  z: number;
  building?: string;
  texture?: string;
  kind: "book_red" | "book_stack" | "uet_rock" | "casio" | "chronicle" | "iced_tea" | "cat" | "film_reel" | "prism" | "logbook" | "duck" | "chalk_board" | "survey_stack" | "cipher_disk" | "old_map";
  room?: string;
  roomPos?: [number, number];
  color: string;
  title: string;
  place: string;
  lore: string;
  quip: string;
}
export interface WalkNode { id: string; x: number; z: number; label: string; short?: string }
export interface WalkCharacter { id: string; node: string; name: string; color: string; role: string; plain?: boolean; offset?: [number, number] }
/** Background-student life. Coordinates are layout units. yaw 0 faces +z, toward the street. */
export interface CrowdRoute { from: string; to: string; count: number; near?: number }
export interface CrowdSpot {
  kind: "lecture" | "sit" | "talk" | "phone";
  count: number;
  near?: number;
  x: number;
  z: number;
  /** Degrees. 0 faces +z (toward the gate). Sit rows face each other; talk rotates the circle. */
  yaw?: number;
  /** Layout metres between seats on a bench or phone line. */
  span?: number;
  /** Layout metres between people sharing a doorway. */
  spread?: number;
  /** Lecture threshold. Students shrink out here — buildings have no interior. */
  door?: [number, number];
  /** Where a lecture group walks off to before coming back. */
  away?: [number, number];
}
export interface AtmosphereFrame { step: number; label: string; sky: string; sunColor: string; sunIntensity: number; sunPosition: [number, number, number]; hemiSky: string; hemiGround: string; hemiIntensity: number; exposure: number; night: number; fogDensity: number }
export interface MapData {
  drone: { model: string; stations: { node: string; offset: [number, number]; count: number; scale: number; label: string }[] };
  atmosphere: AtmosphereFrame[];
  walk: {
    crowd: { normalCount: number; lowCount: number; routes: CrowdRoute[]; spots: CrowdSpot[] }; spawn: string; radius: number; nodes: WalkNode[]; edges: [string, string][]; characters: WalkCharacter[];
    easterEggs?: WalkEasterEgg[];
    avatar: { height: number; modelHeight: number; speed: number; talkDistance: number; camera: { height: number; distance: number; lookHeight: number; occlusionOpacity: number }; indoorCamera?: { height: number; distance: number; lookHeight: number; insideOpacity: number } }
  };
  mapVerified: boolean;
  model: string;
  scale: number;
  origin: [number, number];
  core: { x: number; z: number; label: string };
  overview: { distance: number; height: number };
  campuses: { id: string; label: string; name: string; x: number; z: number }[];
  buildings: MapBuilding[];
  anchors: Record<string, string>;
}

export interface GameData {
  story: StoryData;
  config: Config;
  circuits: Circuit[];
  levels: Map<string, Level>;
  journey: Level[];
  finaleSteps: Level[];
  generated: Level[];
  achievements: Achievement[];
  facts: CoreFact[];
  factsN: NFact[];
  glossary: Record<string, Glossary>;
  strings: Record<string, string>;
  qa: Record<string, unknown>;
  map: MapData;
}

export let DATA: GameData;

const base = () => `${import.meta.env.BASE_URL}data/`;

async function json<T>(path: string): Promise<T> {
  const res = await fetch(base() + path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function loadData(onProgress: (f: number) => void): Promise<GameData> {
  const files = ["config.json", "levels/circuits.json", "levels_generated.json", "achievements.json", "facts.json", "facts_generated.json", "casual_glossary.json", "i18n/vi.json", "qa_report.json", "map.json"];
  let done = 0;
  const step = <T>(p: Promise<T>) => p.then((v) => { done += 1; onProgress(done / files.length); return v; });
  const [config, circuitsFile, generated, ach, facts, factsN, glossary, strings, qa, map] = await Promise.all([
    step(json<Config>(files[0])),
    step(json<{ circuits: Circuit[]; levels: Level[]; finaleSteps: Level[] }>(files[1])),
    step(json<Level[]>(files[2])),
    step(json<{ achievements: Achievement[] }>(files[3])),
    step(json<{ facts: CoreFact[] }>(files[4])),
    step(json<NFact[]>(files[5])),
    step(json<Record<string, Glossary>>(files[6])),
    step(json<Record<string, string>>(files[7])),
    step(json<Record<string, unknown>>(files[8])),
    step(json<MapData>(files[9])),
  ]);
  const story = await json<StoryData>("story.json");
  const levels = new Map<string, Level>();
  for (const l of [...circuitsFile.levels, ...circuitsFile.finaleSteps, ...generated]) levels.set(l.id, l);
  // Đề "Đường chuyển tư liệu" dựng từ chính lối đi trong map.json (STORY_BIBLE mục 6).
  for (const stop of story.stops) {
    const a = stop.activity;
    if (a?.type !== "mapgraph") continue;
    const tr = (k: string) => (strings[k] ?? k).replace(/\{([pP])lace:([a-z0-9]+)\}/g, (_, p: string, id: string) => {
      const name = strings[map.walk.nodes.find((n) => n.id === id)?.short ?? ""] ?? id;
      return p === "P" ? name.charAt(0).toLocaleUpperCase("vi") + name.slice(1) : name;
    });
    levels.set(storyLevelId(stop.id), mapGraphLevel(storyLevelId(stop.id), a as unknown as MapGraphCfg, map.walk.nodes, tr, (a.hints as string[]).map(tr), tr((a.prompt ?? a.note) as string), tr(a.title)));
  }
  DATA = {
    story,
    config,
    circuits: circuitsFile.circuits.filter((c) => config.circuitsEnabled.includes(c.id)),
    levels,
    journey: circuitsFile.levels,
    finaleSteps: circuitsFile.finaleSteps,
    generated,
    achievements: ach.achievements,
    facts: facts.facts,
    factsN,
    glossary,
    strings,
    qa,
    map,
  };
  return DATA;
}

/** Id của màn sinh từ điểm dừng truyện (đường chuyển tư liệu). */
export const storyLevelId = (stop: string) => `story:${stop}`;

export function circuitOf(levelId: string): number | undefined {
  return DATA.levels.get(levelId)?.circuit;
}

/** Where a circuit lives on the campus map: its anchor building, or the core (circuit 7). */
export function circuitPlace(id: number): { name: string; campus: string } {
  const m = DATA.map;
  const bid = m.anchors[String(id)];
  const b = bid ? m.buildings.find((x) => x.id === bid) : undefined;
  if (!b) return { name: m.core.label, campus: "HUS" };
  return { name: b.name, campus: b.id.split("_")[0] };
}
