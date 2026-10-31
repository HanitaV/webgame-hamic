/**
 * Luật chấm các minigame trong truyện (2.8) — hàm thuần, không DOM, không ngẫu nhiên.
 * Mỗi hàm nhận dữ liệu từ story.json và lời giải của người chơi, trả về kết quả mô tả được.
 */

import type { Level } from "../../game/types";
import { LET, shortest, type Edge } from "./discrete";

/* ---------- Hai bản cùng tên: tìm dòng khác nhau ---------- */
export function diffLines(a: readonly string[], b: readonly string[]) {
  const n = Math.max(a.length, b.length);
  return [...Array(n).keys()].filter((i) => a[i] !== b[i]);
}
export function evalVersions(a: readonly string[], b: readonly string[], selected: readonly number[]) {
  const diff = diffLines(a, b), pick = new Set(selected);
  const missing = diff.filter((i) => !pick.has(i)).length;
  const extra = [...pick].filter((i) => !diff.includes(i)).length;
  return { ok: missing === 0 && extra === 0, diff, missing, extra };
}

/* ---------- Bắt lỗi đồng bộ ---------- */
export interface SyncFolder { id: string; role: "need" | "junk" | string }
export function evalSync(folders: readonly SyncFolder[], included: readonly string[]) {
  const on = new Set(included);
  const missing = folders.filter((f) => f.role === "need" && !on.has(f.id)).map((f) => f.id);
  const junk = folders.filter((f) => f.role === "junk" && on.has(f.id)).map((f) => f.id);
  return { ok: missing.length === 0 && junk.length === 0, missing, junk };
}
/** Mẫu chung (lỗi gốc của truyện): bỏ mọi thư mục có tên bắt đầu bằng "_". */
export function templateDrops(labels: readonly string[]) { return labels.filter((l) => l.startsWith("_")); }

/* ---------- Ghép ảnh với lời ghi ---------- */
export interface Caption { id: string; photo: string }
export function evalCaptions(captions: readonly Caption[], photos: readonly string[], pairs: Record<string, string>) {
  const paired = photos.filter((p) => pairs[p]).length;
  const used = Object.values(pairs);
  const duplicate = used.length !== new Set(used).size;
  const wrong = photos.filter((p) => pairs[p] && captions.find((c) => c.id === pairs[p])?.photo !== p).length;
  return { ok: paired === photos.length && wrong === 0 && !duplicate, paired, wrong, duplicate };
}

/* ---------- Nhịp chữ và hiệu ứng ---------- */
export interface TimingCfg { rise: number; total: number; words: number; rate: number }
const EPS = 1e-9;
export function timingWindow(c: TimingCfg) {
  const minHold = c.words / c.rate;
  return { minHold, delayMin: c.rise, delayMax: c.total - minHold };
}
export function evalTiming(c: TimingCfg, delay: number, hold: number) {
  const w = timingWindow(c);
  const issues: ("early" | "short" | "long")[] = [];
  if (delay < c.rise - EPS) issues.push("early");
  if (hold < w.minHold - EPS) issues.push("short");
  if (delay + hold > c.total + EPS) issues.push("long");
  return { ok: issues.length === 0, issues, ...w };
}

/* ---------- Thứ tự tổng duyệt (sắp xếp tô-pô) ---------- */
export interface TopoStep { id: string; needs: string[] }
export function evalTopo(steps: readonly TopoStep[], order: readonly string[]) {
  const pos = new Map(order.map((id, i) => [id, i]));
  let firstBad: { step: string; need: string } | null = null;
  for (const id of order) {
    const step = steps.find((s) => s.id === id);
    if (!step) continue;
    const need = step.needs.find((n) => !pos.has(n) || pos.get(n)! > pos.get(id)!);
    if (need) { firstBad = { step: id, need }; break; }
  }
  const complete = order.length === steps.length && new Set(order).size === steps.length && steps.every((s) => pos.has(s.id));
  return { ok: complete && !firstBad, complete, firstBad };
}
/** Số thứ tự hợp lệ (để kiểm: dữ liệu phải có ít nhất một, và nhiều hơn một để không phải đoán thuộc lòng). */
export function countTopoOrders(steps: readonly TopoStep[]) {
  let count = 0;
  const rec = (order: string[]) => {
    if (order.length === steps.length) { count += 1; return; }
    for (const s of steps) if (!order.includes(s.id) && s.needs.every((n) => order.includes(n))) rec([...order, s.id]);
  };
  rec([]);
  return count;
}

/* ---------- Đối chiếu bằng chứng ---------- */
export interface CauseCard { id: string; real: boolean }
export function evalCauses(cards: readonly CauseCard[], selected: readonly string[]) {
  const pick = new Set(selected);
  const missing = cards.filter((c) => c.real && !pick.has(c.id)).length;
  const extra = cards.filter((c) => !c.real && pick.has(c.id)).length;
  return { ok: missing === 0 && extra === 0, missing, extra };
}

/* ---------- Đường chuyển tư liệu: đề graph dựng từ map.json ---------- */
export interface MapGraphCfg { title?: string; from: string; to: string; nodes: string[]; edges: [string, string, number][]; short: Record<string, string>; note: string; prompt?: string; layout?: Record<string, [number, number]> }
export function mapGraphLevel(id: string, cfg: MapGraphCfg, layout: { id: string; x: number; z: number }[], shortLabel: (k: string) => string, hints: string[], prompt: string, title?: string): Level {
  const index = new Map(cfg.nodes.map((n, i) => [n, i]));
  const edges: Edge[] = cfg.edges.map(([a, b, w]) => [index.get(a)!, index.get(b)!, w]);
  const pts = cfg.nodes.map((n) => layout.find((p) => p.id === n)!);
  const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  // Bản đồ nhìn từ trên: x sang phải, z âm vào sâu trong trường (lên trên màn hình).
  // Sơ đồ giản lược tác giả vẽ (layout) dễ đọc hơn tọa độ thật; thiếu thì dùng tọa độ map.json.
  const pos = cfg.layout ? cfg.nodes.map((n) => cfg.layout![n]) : pts.map((p) => [(p.x - x0) / Math.max(1, x1 - x0), (p.z - z0) / Math.max(1, z1 - z0)]);
  const from = LET[index.get(cfg.from)!], to = LET[index.get(cfg.to)!];
  return {
    id, module: "graph", title, prompt,
    data: { n: cfg.nodes.length, task: "shortest", from, to, edges, labels: cfg.nodes.map((n) => shortLabel(cfg.short[n])), pos },
    answer: { length: shortest(cfg.nodes.length, edges, index.get(cfg.from)!, index.get(cfg.to)!) },
    hints,
  };
}
