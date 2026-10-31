/**
 * Cốt truyện 2.8 — hàm thuần (không DOM, không ngẫu nhiên). Dữ liệu ở public/data/story.json,
 * luật kết cục ở config.json → endings. check-answers kiểm mọi tổ hợp lựa chọn.
 *
 * Trạng thái lưu tối thiểu (step, decisions, topics, lamps…); cờ, bằng chứng, vật phẩm, sự thật
 * và độ thân thiết đều được suy ra từ trạng thái, nên tua lại hay nhập bản lưu cũ không bao giờ lệch.
 */

export interface Line { speaker: string; text: string }
export interface DecisionOption {
  id: string; text: string; reply: string; effect: string;
  tags?: string[]; trust?: Record<string, number>; requiresFacts?: number;
}
export type Cause = "version" | "notes" | "final";
export interface Decision { stop: string; speaker: string; cause?: Cause; prompt: string; options: DecisionOption[] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Activity { type: string; title: string; [k: string]: any }
export interface Stop {
  id: string; chapter: string; npc: string; title: string; objective: string;
  lines: Line[]; activity?: Activity; decision?: string; after: Line[];
  evidence?: string[]; items?: string[]; facts?: number[];
}
export interface Topic { id: string; label: string; lines: Line[]; requires: string[]; minFacts?: number; grantsFact?: number }
export interface NpcPlace { node: string; offset?: [number, number] }
export interface NpcStory {
  chapters: Record<string, NpcPlace>; topics: Topic[]; ambient: Record<string, string>;
  callbacks: { requires: string[]; text: string }[]; epilogue: { warm: string; plain: string };
}
export interface Chapter { id: string; title: string; time: number; travel: string }
export type EndingId = "E1" | "E2" | "E3" | "E4" | "E5" | "E6";
export const ENDING_IDS: EndingId[] = ["E1", "E2", "E3", "E4", "E5", "E6"];
export type E2Variant = Cause | "extra";
export interface EndingDef { title: string; scene: string; lines: Line[]; hint: string; caption?: string; variants?: Record<E2Variant, { title: string; line: Line }> }
export interface BondBranch { lines: Line[]; trust?: Record<string, number>; evidence?: string }
export interface StoryContent {
  version: number; title: string; intro: string; prologue: Line[];
  bondChoice: { prompt: string; listen: { text: string; reply: string }; build: { text: string; reply: string } };
  chapters: Chapter[]; stops: Stop[]; decisions: Record<string, Decision>;
  evidence: Record<string, { title: string; text: string; bond?: string }>;
  items: Record<string, { title: string; text: string }>;
  npcs: Record<string, NpcStory>;
  bondScenes: Record<string, { listen: BondBranch; build: BondBranch }>;
  messages: { id: string; requires: string[]; speaker: string; text: string }[];
  lamps: { need: number; title: string; notes: Record<string, string> };
  endings: Record<EndingId, EndingDef>;
}
export type Bond = "listen" | "build";
export interface StoryState {
  /** Số điểm dừng chính đã xong (chỉ số điểm dừng hiện tại). */
  step: number;
  introSeen: boolean;
  bond: Bond;
  /** decisionId → optionId. */
  decisions: Record<string, string>;
  /** "npc.topic" đã hỏi. */
  topics: string[];
  /** Node đã thắp đèn. */
  lamps: string[];
  activeSeconds: number;
  endingsSeen: string[];
  lastEnding: string | null;
  chatSeen: number;
  /** Bước của bản lưu version 3; > 0 nghĩa là còn chờ chuyển sang cốt truyện mới. */
  legacyStep: number;
}
export interface EndingRules {
  boom: { enabled: boolean };
  threshold: number;
  risk: Record<string, Record<string, number>>;
  target: Record<string, number>;
  tolerance: { E2: number; other: number };
  unlock: { E6: { facts: number } };
}

export const emptyStory = (): StoryState => ({
  step: 0, introSeen: false, bond: "listen", decisions: {}, topics: [], lamps: [],
  activeSeconds: 0, endingsSeen: [], lastEnding: null, chatSeen: 0, legacyStep: 0,
});

/* ---------- vị trí trong truyện ---------- */

export function storyComplete(story: StoryContent, s: StoryState) { return s.step >= story.stops.length; }
export function currentStop(story: StoryContent, s: StoryState): Stop | null { return story.stops[s.step] ?? null; }
export function chapterIndex(story: StoryContent, s: StoryState) {
  const stop = currentStop(story, s) ?? story.stops[story.stops.length - 1];
  return story.chapters.findIndex((c) => c.id === stop.chapter);
}
export function currentChapter(story: StoryContent, s: StoryState): Chapter {
  return story.chapters[Math.max(0, chapterIndex(story, s))];
}
/** Bước ánh sáng (map.json → atmosphere): theo chương, màn diễn là đêm hẳn. */
export function storyTime(story: StoryContent, s: StoryState) {
  return storyComplete(story, s) ? 6 : currentChapter(story, s).time;
}

/* ---------- cờ suy ra ---------- */

export function storyFacts(story: StoryContent, s: StoryState): Set<number> {
  const facts = new Set<number>();
  story.stops.slice(0, s.step).forEach((stop) => stop.facts?.forEach((f) => facts.add(f)));
  for (const [npc, data] of Object.entries(story.npcs)) for (const topic of data.topics) {
    if (topic.grantsFact && s.topics.includes(`${npc}.${topic.id}`)) facts.add(topic.grantsFact);
  }
  return facts;
}

export function storyEvidence(story: StoryContent, s: StoryState): string[] {
  const out: string[] = [];
  story.stops.slice(0, s.step).forEach((stop) => {
    const scene = story.bondScenes[stop.id]?.[s.bond];
    if (scene?.evidence) out.push(scene.evidence);
    stop.evidence?.forEach((e) => out.push(e));
  });
  return [...new Set(out)];
}

export function storyItems(story: StoryContent, s: StoryState): string[] {
  return [...new Set(story.stops.slice(0, s.step).flatMap((stop) => stop.items ?? []))];
}

export function deriveFlags(story: StoryContent, s: StoryState): Set<string> {
  const f = new Set<string>();
  if (s.introSeen) f.add("intro");
  f.add(`bond:${s.bond}`);
  story.stops.slice(0, s.step).forEach((stop) => f.add(`done:${stop.id}`));
  for (const [d, o] of Object.entries(s.decisions)) f.add(`dec:${d}:${o}`);
  for (const t of s.topics) f.add(`topic:${t}`);
  for (const e of storyEvidence(story, s)) f.add(`ev:${e}`);
  for (const i of storyItems(story, s)) f.add(`item:${i}`);
  for (const n of storyFacts(story, s)) f.add(`fact:${n}`);
  const ci = chapterIndex(story, s);
  story.chapters.slice(0, ci + 1).forEach((c) => f.add(`chapter:${c.id}`));
  if (storyComplete(story, s)) f.add("complete");
  return f;
}

export const requiresMet = (req: readonly string[], flags: Set<string>) => req.every((r) => flags.has(r));

export function topicAvailable(topic: Topic, flags: Set<string>, facts: number) {
  return requiresMet(topic.requires, flags) && facts >= (topic.minFacts ?? 0);
}

export function decisionOptions(decision: Decision, facts: number) {
  return decision.options.filter((o) => facts >= (o.requiresFacts ?? 0));
}

/** Độ thân thiết: chỉ cộng, không bao giờ trừ (không phạt người chơi). */
export function trustOf(story: StoryContent, s: StoryState): Record<string, number> {
  const trust: Record<string, number> = Object.fromEntries(Object.keys(story.npcs).map((id) => [id, 0]));
  const add = (map?: Record<string, number>) => { for (const [k, v] of Object.entries(map ?? {})) trust[k] = (trust[k] ?? 0) + Math.max(0, v); };
  for (const [d, o] of Object.entries(s.decisions)) add(story.decisions[d]?.options.find((x) => x.id === o)?.trust);
  story.stops.slice(0, s.step).forEach((stop) => add(story.bondScenes[stop.id]?.[s.bond]?.trust));
  for (const t of s.topics) { const npc = t.split(".")[0]; trust[npc] = (trust[npc] ?? 0) + 1; }
  return trust;
}
export const TRUST_WARM = 2;

/** NPC đứng ở node nào trong chương này (mặc định theo map.json). */
export function npcPlace(story: StoryContent, chapterId: string, npc: string, fallback: NpcPlace): NpcPlace {
  const chapters = story.npcs[npc]?.chapters ?? {};
  let place = fallback;
  for (const c of story.chapters) {
    if (chapters[c.id]) place = chapters[c.id];
    if (c.id === chapterId) break;
  }
  return place;
}

export function ambientLines(story: StoryContent, s: StoryState, npc: string): string[] {
  const data = story.npcs[npc];
  if (!data) return [];
  const flags = deriveFlags(story, s);
  const cb = data.callbacks.find((c) => requiresMet(c.requires, flags));
  const line = data.ambient[currentChapter(story, s).id];
  return [cb?.text, line].filter((x): x is string => Boolean(x));
}

export function chatMessages(story: StoryContent, s: StoryState) {
  const flags = deriveFlags(story, s);
  return story.messages.filter((m) => requiresMet(m.requires, flags));
}

export function lampsDone(lit: readonly string[], need: number) { return new Set(lit).size >= need; }

/* ---------- kết cục ---------- */

export interface EndingResult { id: EndingId; variant: E2Variant | null; risk: number; contributions: { decision: string; option: string; risk: number }[] }

function optionOf(story: StoryContent, decision: string, option: string) {
  return story.decisions[decision]?.options.find((o) => o.id === option);
}

export function endingRisk(rules: EndingRules, decisions: Record<string, string>) {
  return Object.entries(decisions).reduce((sum, [d, o]) => sum + (rules.risk[d]?.[o] ?? 0), 0);
}

/**
 * Kết cục tất định từ lựa chọn (ENDINGS.md mục 2, bản 2.8):
 * tổng rủi ro ≥ ngưỡng → E2 (trừ khi tắt cảnh nổ); sau đó E5 (pháo không hội tụ), E4 (drone nhìn ngược),
 * E6 (pháo theo các ước, cần đủ sự thật), E3 (giữ nguyên lời ghi nhưng còn sai sót nhỏ), còn lại E1
 * (E1 cũng là kết cục của lượt chơi không để lại rủi ro nào).
 */
export function pickEnding(story: StoryContent, rules: EndingRules, decisions: Record<string, string>, facts: number): EndingResult {
  const contributions = Object.entries(decisions)
    .map(([decision, option]) => ({ decision, option, risk: rules.risk[decision]?.[option] ?? 0 }))
    .filter((c) => c.risk > 0);
  const risk = contributions.reduce((s, c) => s + c.risk, 0);
  const tags = new Set(Object.entries(decisions).flatMap(([d, o]) => optionOf(story, d, o)?.tags ?? []));
  let id: EndingId;
  if (rules.boom.enabled && risk >= rules.threshold) id = "E2";
  else if (tags.has("diverge")) id = "E5";
  else if (tags.has("flip")) id = "E4";
  else if (tags.has("weird")) id = facts >= rules.unlock.E6.facts ? "E6" : "E1";
  else if (tags.has("kept") && risk > 0) id = "E3";
  else id = "E1";
  return { id, variant: id === "E2" ? e2Variant(story, rules, decisions) : null, risk, contributions };
}

/** Nguyên nhân hiển thị của E2: sai sót gốc nặng nhất người chơi để lại; không có thì "thêm một chùm". */
export function e2Variant(story: StoryContent, rules: EndingRules, decisions: Record<string, string>): E2Variant {
  let best: Cause | null = null, bestRisk = 0;
  for (const cause of ["version", "notes", "final"] as Cause[]) {
    const entry = Object.entries(story.decisions).find(([, d]) => d.cause === cause);
    if (!entry) continue;
    const r = rules.risk[entry[0]]?.[decisions[entry[0]] ?? ""] ?? 0;
    if (r > bestRisk) { best = cause; bestRisk = r; }
  }
  return best ?? "extra";
}

/** Duyệt mọi tổ hợp phương án (giả định đã đủ sự thật để thấy mọi phương án). */
export function enumerateEndings(story: StoryContent, rules: EndingRules, facts = 7) {
  const ids = Object.keys(story.decisions);
  const counts: Record<EndingId, number> = { E1: 0, E2: 0, E3: 0, E4: 0, E5: 0, E6: 0 };
  const variants: Record<string, number> = {};
  let total = 0;
  const rec = (i: number, acc: Record<string, string>) => {
    if (i === ids.length) {
      const r = pickEnding(story, rules, acc, facts);
      counts[r.id] += 1; total += 1;
      if (r.variant) variants[r.variant] = (variants[r.variant] ?? 0) + 1;
      return;
    }
    for (const o of story.decisions[ids[i]].options) rec(i + 1, { ...acc, [ids[i]]: o.id });
  };
  rec(0, {});
  const share = Object.fromEntries(ENDING_IDS.map((id) => [id, (100 * counts[id]) / total])) as Record<EndingId, number>;
  return { counts, share, total, variants };
}

export interface TimelineEntry { decision: string; stop: string; option: string; text: string; effect: string; risk: number; tags: string[] }
export function timeline(story: StoryContent, rules: EndingRules, s: StoryState): TimelineEntry[] {
  return story.stops.filter((stop) => stop.decision && s.decisions[stop.decision]).map((stop) => {
    const d = stop.decision!, o = s.decisions[d], opt = optionOf(story, d, o)!;
    return { decision: d, stop: stop.id, option: o, text: opt.text, effect: opt.effect, risk: rules.risk[d]?.[o] ?? 0, tags: opt.tags ?? [] };
  });
}

/* ---------- tua lại và bản lưu cũ ---------- */

/** Quay về trước điểm dừng `stopId`, bỏ các lựa chọn từ đó trở đi; tiến trình khác giữ nguyên. */
export function rewindTo(story: StoryContent, s: StoryState, stopId: string): StoryState {
  const index = story.stops.findIndex((x) => x.id === stopId);
  if (index < 0) return s;
  const later = new Set(story.stops.slice(index).map((x) => x.decision).filter(Boolean));
  const decisions = Object.fromEntries(Object.entries(s.decisions).filter(([d]) => !later.has(d)));
  return { ...s, step: Math.min(s.step, index), decisions };
}

/** Nhảy tới điểm dừng `index`, các lựa chọn trước đó lấy phương án an toàn (A) nếu chưa có. */
export function fastForward(story: StoryContent, s: StoryState, index: number): StoryState {
  const step = Math.max(0, Math.min(story.stops.length, index));
  const decisions = { ...s.decisions };
  story.stops.slice(0, step).forEach((stop) => { if (stop.decision && !decisions[stop.decision]) decisions[stop.decision] = story.decisions[stop.decision].options[0].id; });
  return { ...s, step, introSeen: true, decisions };
}

/** Bước của cốt truyện 2.7 (0..6, sáu nhiệm vụ) → điểm dừng tương ứng của 2.8. */
export const LEGACY_STEP_MAP = [0, 1, 4, 5, 8, 13, 14];
export function migrateLegacy(story: StoryContent, s: StoryState): StoryState {
  if (!s.legacyStep) return s;
  const index = LEGACY_STEP_MAP[Math.max(0, Math.min(LEGACY_STEP_MAP.length - 1, s.legacyStep))];
  return { ...fastForward(story, s, Math.max(s.step, index)), legacyStep: 0 };
}

/* ---------- kiểm tra trạng thái kẹt ---------- */

/** Liệt kê vấn đề khiến truyện có thể kẹt: cờ không bao giờ có, quyết định thiếu, node lạ. */
export function storyProblems(story: StoryContent, nodes: readonly string[], npcIds: readonly string[]): string[] {
  const problems: string[] = [];
  const done = emptyStory();
  const all = fastForward(story, { ...done, topics: [] }, story.stops.length);
  const flags = deriveFlags(story, all);
  ["listen", "build"].forEach((b) => flags.add(`bond:${b}`));
  for (const d of Object.values(story.decisions)) for (const o of d.options) flags.add(`dec:${Object.keys(story.decisions).find((k) => story.decisions[k] === d)}:${o.id}`);
  for (const [npc, data] of Object.entries(story.npcs)) for (const t of data.topics) flags.add(`topic:${npc}.${t.id}`);
  for (const stop of story.stops) {
    if (!npcIds.includes(stop.npc)) problems.push(`stop ${stop.id}: NPC ${stop.npc}`);
    if (stop.decision && !story.decisions[stop.decision]) problems.push(`stop ${stop.id}: thiếu quyết định ${stop.decision}`);
    if (stop.decision && story.decisions[stop.decision].stop !== stop.id) problems.push(`quyết định ${stop.decision} gắn sai điểm dừng`);
    if (!story.chapters.some((c) => c.id === stop.chapter)) problems.push(`stop ${stop.id}: chương ${stop.chapter}`);
  }
  for (const [id, d] of Object.entries(story.decisions)) {
    if (!story.stops.some((s) => s.decision === id)) problems.push(`quyết định ${id} không gắn điểm dừng`);
    if (!d.options.some((o) => !o.requiresFacts)) problems.push(`quyết định ${id} không có phương án luôn mở`);
  }
  for (const [npc, data] of Object.entries(story.npcs)) {
    for (const place of Object.values(data.chapters)) if (!nodes.includes(place.node)) problems.push(`${npc}: node ${place.node}`);
    for (const t of data.topics) for (const r of t.requires) if (!flags.has(r)) problems.push(`${npc}.${t.id}: cờ ${r} không bao giờ có`);
    for (const c of data.callbacks) for (const r of c.requires) if (!flags.has(r)) problems.push(`${npc} callback: cờ ${r}`);
  }
  for (const m of story.messages) for (const r of m.requires) if (!flags.has(r)) problems.push(`tin ${m.id}: cờ ${r}`);
  for (const n of Object.keys(story.lamps.notes)) if (!nodes.includes(n)) problems.push(`đèn ở node lạ ${n}`);
  if (Object.keys(story.lamps.notes).length < story.lamps.need) problems.push("không đủ đèn để thắp");
  return problems;
}
