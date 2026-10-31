// Every t("key") used in src must exist in public/data/i18n/vi.json (GDD 8.2: all UI strings there).
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
const vi = JSON.parse(readFileSync(join(root, "public/data/i18n/vi.json"), "utf8"));
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith(".ts") && files.push(p); } };
walk(join(root, "src"));
const missing = new Set();
const prefixes = { "module.": ["plot-limit","series","removable","pick-limit","beam-order","transpose-bug","block-vm","graph","modular","count"], "blk.dir.": ["right","left","up","down"], "blk.tile.": ["repeat","for","place","move","newline","color","ifEven","set","addVar","addConst","addLinear"], "lab.intro.": ["plot","beam","blocks"], "lab.tab.": ["plot","beam","blocks"], "casual.circuit.": ["1","2","4","6"], "priority.": ["Must","Should","Could"], "set.val.": ["100","115","130","system","on","off"] };
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\("([a-zA-Z0-9_.-]+)"/g)) if (!(m[1] in vi)) missing.add(`${m[1]} (${f.replace(root, "")})`);
  for (const m of src.matchAll(/(?:label|help|title): "(set\.[a-zA-Z]+)"/g)) if (!(m[1] in vi)) missing.add(m[1]);
  for (const m of src.matchAll(/t\("(set\.import(?:Ok|Fail))"|"(set\.import(?:Ok|Fail))"/g)) { const k = m[1] ?? m[2]; if (!(k in vi)) missing.add(k); }
}
for (const [p, list] of Object.entries(prefixes)) for (const s of list) if (!(p + s in vi)) missing.add(p + s);
const story = JSON.parse(readFileSync(join(root, "public/data/story.json"), "utf8"));
const map = JSON.parse(readFileSync(join(root, "public/data/map.json"), "utf8"));
const collect = (v) => { if (typeof v === "string" && v.startsWith("story.") && !(v in vi)) missing.add(v); else if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v === "object") Object.values(v).forEach(collect); };
collect(story); collect(map.walk); collect(map.atmosphere);
// Apply the generator's readability rules to the new authored casual-mode copy too.
const rules = JSON.parse(readFileSync(join(root, "public/data/qa_report.json"), "utf8")).casual_rules;
const casualKeys = [];
const casualCopy = (v) => {
  if (typeof v === "string" && v.startsWith("story.")) casualKeys.push(v);
  else if (v && typeof v === "object") Object.values(v).forEach(casualCopy);
};
casualCopy(story.modes.casual);
const plain = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
const copyErrors = [];
for (const key of casualKeys) {
  const value = vi[key];
  if (!value) continue;
  for (const word of rules.banned_terms) {
    if (new RegExp(`(^|[^\\p{L}\\p{N}_])${plain(word)}($|[^\\p{L}\\p{N}_])`, "u").test(plain(value))) copyErrors.push(`${key}: ${word}`);
  }
  for (const sentence of value.split(/(?<=[.?!])\s+/).filter(Boolean)) {
    if (sentence.trim().split(/\s+/).length > rules.max_words_per_sentence || (sentence.match(/\d+(?:[.,]\d+)?/g) ?? []).length > rules.max_numbers_per_sentence) copyErrors.push(`${key}: ${sentence}`);
  }
}
// Lint "Dạo chơi" cho lời dẫn mức Cốt truyện (dễ) trong truyện 2.8: promptEasy, hintsEasy.
const easyKeys = [];
const easyCopy = (v, field) => {
  if (typeof v === "string" && v.startsWith("story.") && (field === "promptEasy" || field === "hintsEasy")) easyKeys.push(v);
  else if (Array.isArray(v)) v.forEach((x) => easyCopy(x, field));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) easyCopy(x, k);
};
easyCopy(story);
for (const key of easyKeys) {
  const value = vi[key] ?? "";
  for (const word of rules.banned_terms) if (new RegExp(`(^|[^\\p{L}\\p{N}_])${plain(word)}($|[^\\p{L}\\p{N}_])`, "u").test(plain(value))) copyErrors.push(`${key}: ${word}`);
  for (const sentence of value.split(/(?<=[.?!])\s+/).filter(Boolean)) {
    if (sentence.trim().split(/\s+/).length > rules.max_words_per_sentence || (sentence.match(/\d+(?:[.,]\d+)?/g) ?? []).length > rules.max_numbers_per_sentence) copyErrors.push(`${key}: ${sentence}`);
  }
}
// Khóa story.* mồ côi: không được story.json, map.json hay mã nguồn nhắc tới.
const referenced = new Set();
const ref = (v) => { if (typeof v === "string") referenced.add(v); else if (Array.isArray(v)) v.forEach(ref); else if (v && typeof v === "object") Object.values(v).forEach(ref); };
ref(story); ref(map);
const dynamicPrefixes = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/"(story\.[a-zA-Z0-9_.-]+)"/g)) referenced.add(m[1]);
  for (const m of src.matchAll(/`(story\.[a-zA-Z0-9_.-]*)\$\{/g)) if (m[1] !== "story.") dynamicPrefixes.push(m[1]);
}
for (const k of ["up", "left", "down", "right"]) referenced.add(`story.${k}`); // nút điều hướng: t(`story.${key}`)
const orphans = Object.keys(vi).filter((k) => k.startsWith("story.") && !referenced.has(k) && !dynamicPrefixes.some((p) => k.startsWith(p)));
// Mã {place:id} trong lời thoại phải trỏ tới điểm dừng có tên ngắn trong map.json.
for (const [k, v] of Object.entries(vi)) for (const m of String(v).matchAll(/\{[pP]lace:([a-z0-9]+)\}/g)) {
  const node = map.walk.nodes.find((n) => n.id === m[1]);
  if (!node || !(node.short in vi)) missing.add(`${k}: {place:${m[1]}}`);
}
console.log(`check-strings: ${files.length} tệp, ${missing.size} khóa thiếu, ${orphans.length} khóa story.* mồ côi`);
for (const o of orphans.slice(0, 20)) console.log("  MỒ CÔI", o);
if (process.argv.includes("--prune") && orphans.length) { for (const o of orphans) delete vi[o]; writeFileSync(join(root, "public/data/i18n/vi.json"), JSON.stringify(vi, null, 1) + "\n"); console.log(`đã xóa ${orphans.length} khóa mồ côi`); process.exit(0); }
console.log(`easy-copy: ${easyKeys.length} chuỗi lời dẫn mức dễ`);
for (const m of missing) console.log("  THIẾU", m);
console.log(`casual-copy: ${casualKeys.length} chuỗi mới, ${copyErrors.length} vi phạm`);
for (const e of copyErrors) console.log("  LINT", e);
process.exit(missing.size || copyErrors.length || orphans.length ? 1 : 0);
