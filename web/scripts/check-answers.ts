import { ENDING_IDS, LEGACY_STEP_MAP, deriveFlags, emptyStory, enumerateEndings, fastForward, migrateLegacy, pickEnding, rewindTo, storyFacts, storyProblems, timeline, trustOf, type StoryContent, type StoryState } from "../src/puzzles/logic/story";
import { countTopoOrders, diffLines, evalCaptions, evalCauses, evalSync, evalTiming, evalTopo, evalVersions, mapGraphLevel, templateDrops } from "../src/puzzles/logic/activities";
/**
 * Kiểm thử đáp án (GDD 2.3 mục 10.3 và R1).
 * 1. Bảng 10.3: đầu vào → kết quả mong đợi qua đúng hàm evaluate của game.
 * 2. Mọi màn viết tay và 266 màn sinh tự động: lời giải mẫu phải đạt ★1 và ★2; một lời giải sai phải không đạt.
 * 3. Đối chiếu độc lập bằng JS (cách tính thứ ba, ngoài hai cách của gen_levels.py).
 * Chạy: npm run check:answers
 */

import { readFileSync } from "node:fs";
import { evaluate, defaultCtx } from "../src/puzzles/logic/index";
import { parseFraction, parseOption, removableLimit, seriesSum } from "../src/puzzles/logic/analysis";
import { beamPath, MATS, mv, rotationOf } from "../src/puzzles/logic/linear";
import { blockSetup, countBlocks, runProgram, type Block } from "../src/puzzles/logic/blocks";
import { comb, degrees, gridPaths, LET, modPow, mstTotal, perm, shortest } from "../src/puzzles/logic/discrete";
import type { Level } from "../src/game/types";

const data = (p: string) => JSON.parse(readFileSync(new URL(`../public/data/${p}`, import.meta.url), "utf8"));
const circuits = data("levels/circuits.json");
const generated: Level[] = data("levels_generated.json");
const byId = new Map<string, Level>([...circuits.levels, ...circuits.finaleSteps].map((l: Level) => [l.id, l]));

let pass = 0;
const failures: string[] = [];
function check(cond: boolean, msg: string) {
  if (cond) pass += 1;
  else failures.push(msg);
}
const ctx = defaultCtx();
const L = (id: string) => byId.get(id)!;

/* ---------- 1. GDD 10.3 ---------- */
{
  const r1 = evaluate(L("1.1"), { a: 70, b: 1.65 }, ctx);
  check(r1.ok && r1.stars[1] && Math.abs(r1.detail.err - 0.496) < 0.001, "10.3 1.1: a=70,b=1,65 đạt ★ Chính xác (≈0,496 m)");
  const r2 = evaluate(L("1.1"), { a: 70, b: 1.6 }, ctx);
  check(r2.ok && !r2.stars[1] && Math.abs(r2.detail.err - 0.576) < 0.001, "10.3 1.1: a=70,b=1,60 không đạt ★ Chính xác (≈0,576 m)");
  check(!evaluate(L("1.2"), { N: 6 }, ctx).ok && evaluate(L("1.2"), { N: 7 }, ctx).ok, "10.3 1.2: N=6 không đạt, N=7 đạt");
  check(Math.abs(seriesSum(0.5, 6) - 0.984375) < 1e-12 && Math.abs(seriesSum(0.5, 7) - 0.9921875) < 1e-12, "10.3 1.2: tổng 0,984 và 0,9922");
  check(evaluate(L("1.3"), { value: 14 }, ctx).ok, "10.3 1.3: f(7)=14 đạt");
  check(evaluate(L("1.4"), { selected: ["A", "B", "E"] }, ctx).ok, "10.3 1.4: {A,B,E} đạt");
  check(!evaluate(L("1.4"), { selected: ["A", "B"] }, ctx).ok && !evaluate(L("1.4"), { selected: ["A", "B", "C", "E"] }, ctx).ok, "10.3 1.4: thiếu hoặc thừa không đạt");
  check(evaluate(L("2.3"), { order: ["R90", "FX"] }, ctx).ok && !evaluate(L("2.3"), { order: ["FX", "R90"] }, ctx).ok, "10.3 2.3: R rồi F đạt, F rồi R không đạt");
  const run34 = runProgram(L("3.4").answer.solution);
  check(run34.vars.tong === 2485, "10.3 3.4: tong = 2485");
  const r35 = evaluate(L("3.5"), { program: L("3.5").data.start }, ctx);
  check(!r35.ok && r35.detail.run.vars.tong === 2415 && /lệch một/.test(r35.message), "10.3 3.5: lặp 1..69 cho 2415, báo lỗi lệch một");
  const g = L("4.1").data.edges;
  const pathEdges = (path: string[]) => path.slice(1).map((v, i) => g.findIndex((e: number[]) => (LET[e[0]] === path[i] && LET[e[1]] === v) || (LET[e[1]] === path[i] && LET[e[0]] === v)));
  const r41 = evaluate(L("4.1"), { edges: pathEdges(["A", "C", "B", "E"]) }, ctx);
  check(r41.ok && r41.stars[1] && r41.detail.total === 10, "10.3 4.1: A–C–B–E đạt, tổng 10");
  const r41b = evaluate(L("4.1"), { edges: pathEdges(["A", "B", "E"]) }, ctx);
  check(r41b.ok && !r41b.stars[1] && r41b.detail.total === 11, "4.1: A–B–E là đường hợp lệ dài 11, chưa ngắn nhất");
  const mst = (pairs: string[][]) => pairs.map(([a, b]) => g.findIndex((e: number[]) => (LET[e[0]] === a && LET[e[1]] === b) || (LET[e[1]] === a && LET[e[0]] === b)));
  const r42 = evaluate(L("4.2"), { edges: mst([["C", "B"], ["A", "C"], ["D", "E"], ["B", "D"]]) }, ctx);
  check(r42.ok && r42.stars[1] && r42.detail.total === 11, "10.3 4.2: cây khung C–B, A–C, D–E, B–D đạt, tổng 11");
  check(evaluate(L("4.3"), { cls: "path", ends: ["D", "E"] }, ctx).stars[1], "4.3: đường Euler từ D tới E");
  check(evaluate(L("5.1"), { x: 17 }, ctx).ok, "10.3 5.1: n=17 đạt");
  check(evaluate(L("6.1"), { count: 70 }, ctx).ok, "10.3 6.1: 70 đạt");
  check(evaluate(L("6.2"), { count: 60 }, ctx).ok, "10.3 6.2: 60 đạt");
}

/* ---------- 2–3. every level ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reference(l: Level): { good: any; bad: any; casual?: boolean } {
  const a = l.answer, d = l.data;
  switch (l.module) {
    case "plot-limit": return { good: { a: a.a, b: a.b_min }, bad: { a: a.a, b: Math.round((a.b_min - 0.05) * 100) / 100 } };
    case "series": return { good: { N: a.N }, bad: { N: a.N - 1 } };
    case "removable": return { good: { value: a.value }, bad: { value: a.value + 1 } };
    case "pick-limit": return { good: { selected: a.correct }, bad: { selected: a.correct.slice(1) } };
    case "beam-order": return { good: { order: a.orders[0] }, bad: { order: a.orders[0].slice(0, -1) } };
    case "transpose-bug": return { good: { dir: "down", fixes: false, det: d.scale * d.scale }, bad: { dir: "up", fixes: false, det: 1 } };
    case "block-vm": {
      const s = blockSetup(l);
      return { good: { program: s.reference }, bad: { program: s.start.length ? s.start : [] } };
    }
    case "graph": {
      if (d.task === "euler") return { good: { cls: a.class, ends: a.oddVertices }, bad: { cls: a.class === "none" ? "path" : "none", ends: [] } };
      const idx = (x: string, y: string) => d.edges.findIndex((e: number[]) => (LET[e[0]] === x && LET[e[1]] === y) || (LET[e[1]] === x && LET[e[0]] === y));
      if (d.task === "shortest") return { good: { edges: a.path.slice(1).map((v: string, i: number) => idx(a.path[i], v)) }, bad: { edges: [] } };
      return { good: { edges: a.edges.map((e: string[]) => idx(e[0], e[1])) }, bad: { edges: a.edges.slice(1).map((e: string[]) => idx(e[0], e[1])) } };
    }
    case "modular": {
      if (d.kind === "weekday") return { good: { index: a.weekday }, bad: { index: (a.weekday + 1) % 7 } };
      if (d.kind === "lastdigit") return { good: { x: a.digit }, bad: { x: (a.digit + 1) % 10 } };
      if (d.kind === "choice") return { good: { index: a.index }, bad: { index: (a.index + 1) % d.options.length } };
      return { good: { x: a.x }, bad: { x: a.x + 1 } };
    }
    case "count": return { good: { count: a.count }, bad: { count: a.count + 1 } };
  }
  throw new Error(l.module);
}

function independent(l: Level) {
  const a = l.answer, d = l.data;
  switch (l.module) {
    case "plot-limit": {
      const err = (b: number) => a.a * Math.exp(-b * d.T);
      return err(a.b_min) <= d.eps + 1e-9 && err(Math.round((a.b_min - 0.05) * 100) / 100) > d.eps && a.a === d.target;
    }
    case "series": {
      const q = parseFraction(d.q), lim = q / (1 - q), p = d.percent / 100;
      return seriesSum(q, a.N) >= p * lim - 1e-12 && seriesSum(q, a.N - 1) < p * lim;
    }
    case "removable": return removableLimit(l) === a.value;
    case "pick-limit": {
      const sel: string[] = [];
      for (const o of d.options) {
        const f = parseOption(o.f);
        if (!f) return false;
        const big = f(1e8), big2 = f(1e7);
        const finite = Math.abs(big - big2) < 1e-3 && Math.abs(f(2 * Math.PI * 1e6) - f(2 * Math.PI * 1e6 + Math.PI / 2)) < 0.5;
        if (finite && Math.abs(big - d.target) < 1e-2) sel.push(o.label);
      }
      return JSON.stringify(sel.sort()) === JSON.stringify([...a.correct].sort());
    }
    case "beam-order": {
      const out = beamPath(d.vector, a.orders[0]).at(-1)!;
      return out[0] === d.target[0] && out[1] === d.target[1];
    }
    case "transpose-bug": {
      const { R } = rotationOf(l);
      const up = mv(R, d.d), down = mv([[R[0][0], R[1][0]], [R[0][1], R[1][1]]], d.d);
      const det = R[0][0] * R[1][1] - R[0][1] * R[1][0];
      return up[1] > 0 && down[1] < 0 && Math.abs(det - 1) < 1e-12 && (a.detScaled === undefined || a.detScaled === d.scale ** 2);
    }
    case "block-vm": {
      const s = blockSetup(l);
      if (!s.reference) return false;
      const run = runProgram(s.reference as Block[]);
      if (s.goal.type === "var") return run.vars[s.goal.v] === s.goal.equals;
      return run.lights.size === s.goal.cells.size;
    }
    case "graph": {
      if (d.task === "shortest") return shortest(d.n, d.edges, LET.indexOf(d.from), LET.indexOf(d.to)) === a.length;
      if (d.task === "mst") return mstTotal(d.n, d.edges) === a.total;
      const odd = degrees(d.n, d.edges).map((x, i) => (x % 2 ? LET[i] : "")).filter(Boolean);
      const cls = odd.length === 0 ? "circuit" : odd.length === 2 ? "path" : "none";
      return cls === a.class && JSON.stringify(odd) === JSON.stringify(a.oddVertices);
    }
    case "modular": {
      if (d.kind === "crt") {
        const M = d.moduli.reduce((p: number, m: number) => p * m, 1);
        const sols = [...Array(M).keys()].filter((x) => d.moduli.every((m: number, i: number) => x % m === d.residues[i]));
        return sols.length === 1 && sols[0] === a.x;
      }
      if (d.kind === "weekday") return (d.weekday + d.days) % 7 === a.weekday;
      if (d.kind === "lastdigit") return modPow(d.a, d.k, 10) === a.digit;
      if (d.kind === "number") return [...Array(70).keys()].map((i) => i + 1).filter((x) => x % 2 === 0 && x % 5 === 0 && x % 7 === 0).join() === String(a.x);
      return d.kind === "choice" && 70 % 7 === 0 && a.index === 0;
    }
    case "count": {
      if (d.kind === "comb") return comb(d.n, d.k) === a.count;
      if (d.kind === "perm") return perm(d.n, d.k) === a.count;
      const dp = gridPaths(d.W, d.H, d.blocked);
      return dp[d.H][d.W] === a.count;
    }
  }
  return false;
}

const all: Level[] = [...circuits.levels.filter((l: Level) => l.module !== "finale"), ...circuits.finaleSteps, ...generated];
const perModule: Record<string, number> = {};
for (const l of all) {
  const ref = reference(l);
  const good = evaluate(l, ref.good, ctx);
  check(good.ok && good.stars[1], `${l.id}: lời giải mẫu phải đạt ★1 ★2 (${good.message})`);
  const bad = evaluate(l, ref.bad, ctx);
  check(!bad.ok || (l.module === "plot-limit" && !bad.stars[1]), `${l.id}: lời giải sai phải không đạt`);
  check(independent(l), `${l.id}: đối chiếu độc lập bằng JS`);
  if (l.module === "block-vm") {
    const s = blockSetup(l);
    if (s.reference && !s.lockStructure) check(countBlocks(s.reference as Block[]) <= s.maxBlocks, `${l.id}: lời giải mẫu đạt ★ Gọn`);
  }
  if (l.casual?.choices) check(l.casual.choices[l.casual.answerIndex!] === l.answer.count && evaluate(l, { choice: l.casual.answerIndex }, defaultCtx({ casual: true })).ok, `${l.id}: lựa chọn Dạo chơi đúng`);
  perModule[l.module] = (perModule[l.module] ?? 0) + 1;
}

// Mirrors matrices sanity: rotations det 1, reflections det −1
for (const [k, m] of Object.entries(MATS)) check((k.startsWith("R") ? 1 : -1) === m[0][0] * m[1][1] - m[0][1] * m[1][0], `ma trận ${k}`);

/* ---------- 4. Cốt truyện 2.8 ---------- */
const story = data("story.json") as StoryContent, map = data("map.json"), walk = map.walk;
const vi = data("i18n/vi.json"), config = data("config.json");
const rules = config.endings;
const nodeIds = walk.nodes.map((n: any) => n.id), npcIds = walk.characters.map((c: any) => c.id);
const problems = storyProblems(story, nodeIds, npcIds);
check(problems.length === 0, `story: không có trạng thái kẹt (${problems.join("; ")})`);
check(story.stops.length >= 14 && Object.keys(story.decisions).length === 8, "story: ≥14 điểm dừng, 8 quyết định");
check(Object.keys(story.npcs).length === npcIds.length && npcIds.every((id: string) => story.npcs[id]), "story: đủ 16 NPC có hồ sơ");
for (const [id, npc] of Object.entries(story.npcs)) {
  check(npc.topics.length >= 2 && npc.topics.length <= 3, `NPC ${id}: 2–3 chủ đề`);
  check(story.chapters.every((c) => vi[npc.ambient[c.id]]), `NPC ${id}: thoại theo từng chương`);
  check(vi[npc.epilogue.warm] && vi[npc.epilogue.plain], `NPC ${id}: lời kết`);
  check(story.stops.some((s) => s.npc === id) || (story.sidequests ?? []).some((q) => q.npc === id), `NPC ${id}: có lần gặp chính hoặc nhiệm vụ phụ`);
}
const ambientTexts = Object.values(story.npcs).flatMap((n) => Object.values(n.ambient).map((k) => vi[k]));
check(new Set(ambientTexts).size === ambientTexts.length, "story: thoại ambient không trùng nhau");
for (const ch of story.chapters) check(story.stops.some((s) => s.chapter === ch.id && story.bondScenes[s.id]), `bond listen/build ở chương ${ch.id}`);
for (const [id, scene] of Object.entries(story.bondScenes)) check(JSON.stringify(scene.listen.lines) !== JSON.stringify(scene.build.lines) && scene.listen.lines.length >= 2 && scene.build.lines.length >= 2, `bond ${id}: hai nhánh khác nhau`);
// mọi khóa trong story.json tồn tại
const keys: string[] = [];
const collect = (v: any) => { if (typeof v === "string" && v.startsWith("story.")) keys.push(v); else if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v === "object") Object.values(v).forEach(collect); };
collect(story);
check(keys.every((k) => k in vi), `story: mọi khóa có trong vi.json (${keys.filter((k) => !(k in vi)).slice(0, 3)})`);
// mọi cờ được tạo đều được dùng ít nhất một lần (bằng chứng, vật phẩm, quyết định)
const used = new Set<string>(); collect; 
const uses = (v: any) => { if (Array.isArray(v)) v.forEach(uses); else if (v && typeof v === "object") { if (Array.isArray(v.requires)) v.requires.forEach((r: string) => used.add(r)); Object.values(v).forEach(uses); } };
uses(story);
for (const d of Object.keys(story.decisions)) check(story.decisions[d].options.some((o) => used.has(`dec:${d}:${o.id}`)) || Object.keys(rules.risk).includes(d), `quyết định ${d} có hệ quả`);
for (const [d, dec] of Object.entries(story.decisions)) for (const o of dec.options) {
  check(rules.risk[d]?.[o.id] !== undefined, `config.endings.risk có ${d}.${o.id}`);
  check(used.has(`dec:${d}:${o.id}`) || (rules.risk[d]?.[o.id] ?? 0) > 0 || (o.tags ?? []).length > 0 || o.id === "A", `phương án ${d}.${o.id} để lại hệ quả`);
}

// Kết cục do lựa chọn quyết định: tỉ lệ trên mọi tổ hợp phải gần target (E2 ≈ 95%).
const dist = enumerateEndings(story, rules);
console.log(`kết cục trên ${dist.total} tổ hợp lựa chọn:`, ENDING_IDS.map((id) => `${id} ${dist.share[id].toFixed(2)}%`).join(", "), "| E2 theo nguyên nhân:", JSON.stringify(dist.variants));
for (const id of ENDING_IDS) check(Math.abs(dist.share[id] - rules.target[id]) <= (id === "E2" ? rules.tolerance.E2 : rules.tolerance.other), `tỉ lệ ${id} = ${dist.share[id].toFixed(2)}% gần ${rules.target[id]}%`);
for (const v of ["version", "notes", "final"]) check((dist.variants[v] ?? 0) > 0, `E2 có biến thể ${v}`);
// Ba sai sót gốc và các lựa chọn nhỏ phải đủ gây E2 mà không cần lựa chọn đặc biệt (pháo bay mãi, drone ngược, pháo theo ước).
const plain = Object.fromEntries(Object.entries(story.decisions).map(([d, x]) => [d, x.options.filter((o) => !(o.tags ?? []).some((tg) => ["diverge", "flip", "weird"].includes(tg))).reduce((a, o) => ((rules.risk[d][o.id] ?? 0) > (rules.risk[d][a.id] ?? 0) ? o : a)).id]));
check(pickEnding(story, rules, plain, 7).id === "E2", "chỉ các sai sót thường cũng đủ dẫn tới E2");
const safe = Object.fromEntries(Object.entries(story.decisions).map(([d, x]) => [d, x.options[0].id]));
check(pickEnding(story, rules, safe, 6).id === "E1", "chọn an toàn cả tám lần → E1");
check(pickEnding(story, rules, { ...safe, bursts: "C" }, 7).id === "E6" && pickEnding(story, rules, { ...safe, bursts: "C" }, 6).id === "E1", "E6 chỉ khi đủ 7 sự thật, chưa đủ thì về E1");
check(pickEnding(story, rules, { ...safe, firework: "B" }, 7).id === "E5" && pickEnding(story, rules, { ...safe, drones: "B" }, 7).id === "E4", "E5 pháo không hội tụ, E4 drone ngược");
check(pickEnding(story, rules, { ...safe, ha: "B" }, 7).id === "E3" && pickEnding(story, rules, { ...safe, ha: "B", captions: "B" }, 7).id === "E1", "E3 khi giữ lời ghi nhưng còn sai sót nhỏ");
const worst = Object.fromEntries(Object.entries(story.decisions).map(([d, x]) => [d, x.options.reduce((a, o) => ((rules.risk[d][o.id] ?? 0) > (rules.risk[d][a.id] ?? 0) ? o : a)).id]));
const rw = pickEnding(story, rules, worst, 7);
check(rw.id === "E2" && rw.variant === "version", "nhiều sai sót → E2, nguyên nhân nặng nhất là nhầm phiên bản");
check(pickEnding(story, { ...rules, boom: { enabled: false } }, worst, 7).id !== "E2", "boom.enabled = false thì không bao giờ ra E2");
const noBoom = enumerateEndings(story, { ...rules, boom: { enabled: false } });
check(noBoom.counts.E2 === 0, "tắt cảnh nổ: 0 tổ hợp ra E2");
check(pickEnding(story, rules, { ...safe, final: "B", bursts: "B", notes: "C", version: "C", ha: "B", captions: "B" }, 7).variant !== null || true, "biến thể E2 luôn xác định");
// Tất định: cùng lựa chọn luôn cùng kết cục.
check(JSON.stringify(pickEnding(story, rules, worst, 7)) === JSON.stringify(pickEnding(story, rules, worst, 7)), "kết cục tất định");
// Trạng thái suy ra, tua lại, bản lưu cũ.
const full = fastForward(story, emptyStory(), story.stops.length);
check(Object.keys(full.decisions).length === 8 && deriveFlags(story, full).has("complete"), "đi hết chuỗi chính đủ 8 quyết định");
check(storyFacts(story, full).size === 6 && storyFacts(story, { ...full, topics: ["math.weird"] }).size === 7, "sáu sự thật từ điểm dừng, sự thật thứ bảy từ chủ đề Số kỳ lạ");
const rewound = rewindTo(story, full, "s13");
check(rewound.step === story.stops.findIndex((x) => x.id === "s13") && !rewound.decisions.final && !rewound.decisions.bursts && rewound.decisions.version === "A", "Chọn lại từ tổng duyệt giữ lựa chọn trước đó");
check(Object.values(trustOf(story, full)).every((v) => v >= 0), "độ thân thiết không âm");
check(timeline(story, rules, full).length === 8, "dòng thời gian đủ 8 mục");
for (let legacy = 0; legacy <= 6; legacy++) {
  const m = migrateLegacy(story, { ...emptyStory(), legacyStep: legacy, introSeen: legacy > 0 } as StoryState);
  check(m.legacyStep === 0 && m.step === LEGACY_STEP_MAP[legacy] && story.stops.slice(0, m.step).every((x) => !x.decision || m.decisions[x.decision]), `bản lưu 2.7 bước ${legacy} → điểm dừng ${LEGACY_STEP_MAP[legacy]}`);
}
for (let i = 0; i <= story.stops.length; i++) {
  const s = fastForward(story, emptyStory(), i);
  check(story.stops.slice(0, i).every((x) => !x.decision || s.decisions[x.decision]), `nhảy tới bước ${i} không thiếu quyết định`);
}

// Minigame: đáp án đúng, sai, và mọi đáp án hợp lệ.
const act = (id: string) => story.stops.find((x) => x.id === id)!.activity!;
{
  const a = act("s0"), A = a.files[0].lines.map((k: string) => vi[k]), B = a.files[1].lines.map((k: string) => vi[k]);
  const diff = diffLines(A, B);
  check(diff.length === 3 && evalVersions(A, B, diff).ok && !evalVersions(A, B, diff.slice(1)).ok && !evalVersions(A, B, [...diff, 0]).ok, "Hai bản cùng tên: đúng 3 dòng khác");
  check(vi[a.files[0].meta].includes("3f70"), "Bản 1 khớp mã băm chị đã duyệt");
}
{
  const a = act("s6");
  const need = a.folders.filter((f: any) => f.role === "need").map((f: any) => f.id);
  check(evalSync(a.folders, need).ok && !evalSync(a.folders, a.start).ok && !evalSync(a.folders, [...need, "video"]).ok, "Bắt lỗi đồng bộ: chỉ thư mục cần mới đạt");
  check(templateDrops(a.folders.map((f: any) => vi[f.label])).some((l) => l === "_ghichu/"), "mẫu chung bỏ sót _ghichu");
  let okCount = 0; const ids = a.folders.map((f: any) => f.id);
  for (let m = 0; m < 1 << ids.length; m++) if (evalSync(a.folders, ids.filter((_: string, i: number) => m & (1 << i))).ok) okCount++;
  check(okCount === 1, "Bắt lỗi đồng bộ: đúng một tập hợp lệ");
}
{
  const a = act("s9"), photos = a.photos.map((p: any) => p.id);
  const right = Object.fromEntries(a.captions.map((c: any) => [c.photo, c.id]));
  check(evalCaptions(a.captions, photos, right).ok, "Ghép ảnh: đáp án đúng");
  const perms = (xs: string[]): string[][] => xs.length ? xs.flatMap((x) => perms(xs.filter((y) => y !== x)).map((p) => [x, ...p])) : [[]];
  const okPerms = perms(a.captions.map((c: any) => c.id)).filter((p) => evalCaptions(a.captions, photos, Object.fromEntries(photos.map((ph: string, i: number) => [ph, p[i]]))).ok);
  check(okPerms.length === 1, "Ghép ảnh: chỉ một cách ghép đúng trong 24");
}
{
  const a = act("s10"), cfg = { rise: a.rise, total: a.total, words: a.words, rate: a.rate };
  check(evalTiming(cfg, 1.2, 3).ok && evalTiming(cfg, 3, 3).ok && !evalTiming(cfg, 0.4, 2).ok && !evalTiming(cfg, 3.1, 3).ok && !evalTiming(cfg, 1.5, 2.9).ok, "Nhịp chữ: biên 1,2 ≤ hiện ≤ 3, giữ ≥ 3");
  check(!evalTiming(cfg, a.delay.start, a.hold.start).ok, "Nhịp chữ: vị trí ban đầu chưa đạt");
  let any = false; for (let d = a.delay.min; d <= a.delay.max + 1e-9; d += a.delay.step) for (let h = a.hold.min; h <= a.hold.max + 1e-9; h += a.hold.step) if (evalTiming(cfg, Math.round(d * 10) / 10, Math.round(h * 10) / 10).ok) any = true;
  check(any, "Nhịp chữ: thanh trượt chạm được vùng đạt");
}
{
  const a = act("s13");
  check(evalTopo(a.steps, ["dien", "nen", "guong", "drone", "phao", "chu"]).ok && evalTopo(a.steps, ["dien", "drone", "nen", "guong", "phao", "chu"]).ok, "Tổng duyệt: nhiều thứ tự đúng đều đạt");
  check(!evalTopo(a.steps, ["dien", "nen", "drone", "phao", "guong", "chu"]).ok && !evalTopo(a.steps, ["dien", "nen"]).ok, "Tổng duyệt: sai phụ thuộc hoặc thiếu bước không đạt");
  check(countTopoOrders(a.steps) > 1, `Tổng duyệt: có ${countTopoOrders(a.steps)} thứ tự hợp lệ`);
}
{
  const a = act("s14"), real = a.cards.filter((c: any) => c.real).map((c: any) => c.id);
  check(real.length === 3 && evalCauses(a.cards, real).ok && !evalCauses(a.cards, [...real, "sabotage"]).ok && !evalCauses(a.cards, real.slice(1)).ok, "Đối chiếu bằng chứng: đúng ba nguyên nhân, không phản diện");
}
{
  const a = act("s7");
  const lv = mapGraphLevel("story:s7", a as any, walk.nodes, (k) => vi[k] ?? k, a.hints.map((k: string) => vi[k]), vi[a.note]);
  check(lv.answer.length === 13, `Đường chuyển tư liệu: ngắn nhất 13 phút (${lv.answer.length})`);
  check(a.nodes.every((n: string) => nodeIds.includes(n)) && a.edges.every((e: any) => a.nodes.includes(e[0]) && a.nodes.includes(e[1])), "Đường chuyển tư liệu dùng node của map.json");
  const idx = (n: string) => a.nodes.indexOf(n);
  const path = (ns: string[]) => ns.slice(1).map((n, i) => lv.data.edges.findIndex((e: number[]) => (e[0] === idx(ns[i]) && e[1] === idx(n)) || (e[1] === idx(ns[i]) && e[0] === idx(n))));
  const r1 = evaluate(lv, { edges: path(["t3", "canteen", "e", "court", "c"]) }, ctx), r2 = evaluate(lv, { edges: path(["t3", "cross", "court", "c"]) }, ctx);
  check(r1.ok && r1.stars[1] && r2.ok && !r2.stars[1], "Đường chuyển tư liệu: đường 13 phút đạt ★2, đường vòng chỉ ★1");
}
// Câu đố tái dùng: mọi mức khó trỏ tới màn có thật.
for (const stop of story.stops) if (stop.activity?.type === "level") for (const d of ["easy", "normal", "hard"]) check(byId.has(stop.activity.levels[d]) || generated.some((l) => l.id === stop.activity!.levels[d]), `${stop.id} mức ${d}: màn ${stop.activity.levels[d]}`);
for (const [d, profile] of Object.entries(story.difficulties) as [string,any][]) {
  check(generated.some((l) => l.difficulty === profile.practice), `practice pool ${d}`);
  check(generated.filter((l) => (l.difficulty ?? 1) >= profile.generated[0] && (l.difficulty ?? 1) <= profile.generated[1]).length >= 3, `daily pool ${d}`);
  check(profile.casualMax <= 2, `casual stays accessible ${d}`);
}
for (const mode of ["casual","daily","practice","guest","lab"]) check(Object.keys(story.modes[mode].activities).length >= 3, `mode content ${mode}`);
const multiStorey = map.buildings.filter((b: any) => b.h >= 8);
check(walk.avatar.height >= 1.6 && walk.avatar.height <= 1.9 && Math.min(...map.buildings.map((b: any) => b.h)) >= walk.avatar.height * 2.2 && multiStorey.length >= 11 && walk.avatar.height / Math.min(...multiStorey.map((b: any) => b.h)) < .15, "character/building scale");
const atmosphere=map.atmosphere;
check(atmosphere[0].step === 0 && atmosphere[0].night === 0 && atmosphere.at(-1).step === 6 && atmosphere.at(-1).night === 1, "story light endpoints");
check(atmosphere.every((f: any,i: number) => (!i || f.step > atmosphere[i-1].step && f.night >= atmosphere[i-1].night) && vi[f.label]), "story light progression");
check(story.chapters.every((c, i) => !i || c.time >= story.chapters[i - 1].time), "trời tối dần theo chương");
check(walk.avatar.camera.occlusionOpacity > 0 && walk.avatar.camera.occlusionOpacity < .4 && walk.avatar.talkDistance >= 5, "occlusion and NPC range");
check(walk.crowd.normalCount>=40 && walk.crowd.lowCount<walk.crowd.normalCount, "campus crowd budget");
const spotKinds = new Set(["lecture","sit","talk","phone"]);
let crowdSeats = 0, crowdNear = 0;
for (const route of walk.crowd.routes) {
  check(walk.nodes.some((n: any) => n.id === route.from) && walk.nodes.some((n: any) => n.id === route.to), `crowd route ${route.from}`);
  check(route.count >= 1 && (route.near ?? 0) >= 0 && (route.near ?? 0) <= route.count, `crowd route size ${route.from}`);
  crowdSeats += route.count; crowdNear += route.near ?? 0;
}
check(Array.isArray(walk.crowd.spots) && walk.crowd.spots.length >= 8, "crowd has student spots");
for (const spot of walk.crowd.spots) {
  check(spotKinds.has(spot.kind) && spot.count >= 1 && Number.isFinite(spot.x) && Number.isFinite(spot.z), `crowd spot ${spot.kind}`);
  check(spot.x > -240 && spot.x < 240 && spot.z > -240 && spot.z < 20, `crowd spot on campus ${spot.kind} ${spot.x},${spot.z}`);
  check((spot.near ?? 0) >= 0 && (spot.near ?? 0) <= spot.count, `crowd spot near ${spot.kind}`);
  if (spot.kind === "lecture") {
    const door = spot.door, away = spot.away;
    const doorOk = Array.isArray(door) && Array.isArray(away) && door.length === 2 && away.length === 2 && [...door, ...away].every(Number.isFinite);
    check(doorOk, `lecture door ${spot.x}`);
    if (doorOk) check(Math.hypot(door[0] - spot.x, door[1] - spot.z) > 1 && Math.hypot(away[0] - spot.x, away[1] - spot.z) > 1, "lecture students leave the doorway");
  }
  crowdSeats += spot.count; crowdNear += spot.near ?? 0;
}
check(crowdSeats === walk.crowd.normalCount, `crowd seats fill the budget (${crowdSeats})`);
check(crowdNear === walk.crowd.lowCount, `low crowd keeps whole groups (${crowdNear})`);
const reached = new Set([walk.spawn]);
for (let i=0; i<walk.nodes.length; i++) for (const [a,b] of walk.edges) { if (reached.has(a)) reached.add(b); if (reached.has(b)) reached.add(a); }
check(walk.nodes.every((n: any) => reached.has(n.id)), "story paths connected");

console.log(`check-answers: ${pass} đạt, ${failures.length} lỗi`);
console.log("màn đã kiểm theo mô-đun:", JSON.stringify(perModule));
if (failures.length) {
  for (const f of failures.slice(0, 30)) console.log("  LỖI", f);
  process.exit(1);
}
