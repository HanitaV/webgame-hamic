/**
 * Kiểm tự động cốt truyện 2.8 bằng trình duyệt (Playwright):
 *  - đi hết chuỗi chính với bond listen và build, ba độ khó, nhiều bộ lựa chọn khác nhau;
 *  - mỗi lượt so kết cục trên màn hình với pickEnding (luật thuần);
 *  - tải lại trang giữa chừng, tua lại "Chọn lại từ tổng duyệt", bản lưu version 3 của bản 2.7;
 *  - xem thẳng cả sáu kết cục bằng Hack mode, kể cả E2 ở chế độ giảm hiệu ứng ánh sáng;
 *  - báo tỉ lệ kết cục trên mọi tổ hợp lựa chọn (E2 phải xấp xỉ 70%).
 * Chạy: npm run build && npm run preview & ; npm run test:story
 */
import { createRequire } from "node:module";
import { ready, startStory, playStop, runFinale, storyState, wait } from "./story-driver.mjs";

const require = createRequire(import.meta.url);
let chromium;
// PLAYWRIGHT_MODULE cho phép dùng bản Playwright có sẵn trình duyệt trên máy (ví dụ bản cài toàn cục).
({ chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright"));
const url = process.env.CAPTURE_URL ?? "http://127.0.0.1:4173/";
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const failures = [], errors = [];
let passes = 0;
const check = (ok, msg) => { if (ok) passes++; else failures.push(msg); console.log(`${ok ? "  đạt " : "  LỖI "} ${msg}`); };

async function open(name, setup) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`${name}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.stack ?? e}`));
  if (setup) await page.addInitScript(setup);
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await ready(page);
  return { ctx, page };
}

const RUNS = [
  { name: "listen-normal-an-toàn", bond: "listen", diff: "normal", choices: {} },
  { name: "build-easy-nhiều-sai-sót", bond: "build", diff: "easy", choices: { version: "B", notes: "B", captions: "C", final: "B", ha: "C", bursts: "B" } },
  { name: "listen-hard-drone-ngược", bond: "listen", diff: "hard", choices: { drones: "B" } },
  { name: "build-normal-giữ-lời-ghi", bond: "build", diff: "normal", choices: { ha: "B", final: "C" }, reload: true },
];

// ONLY=hack chạy riêng phần Hack mode và tỉ lệ (nhanh).
for (const run of process.env.ONLY === "hack" ? [] : RUNS) {
  console.log(`lượt ${run.name}`);
  const { ctx, page } = await open(run.name);
  await page.evaluate((d) => window.__hoitu.playSettings.set({ difficulty: d }), run.diff);
  await startStory(page, run.bond);
  const done = [];
  for (let i = 0; i < 30; i++) {
    const id = await playStop(page, run.choices);
    if (!id) break;
    done.push(id);
    if (run.reload && id === "s6") {
      const before = await storyState(page);
      await page.evaluate(() => window.__hoitu.storyProgress.flush());
      await page.reload(); await ready(page);
      await page.evaluate(() => window.__hoitu.go("walk"));
      await wait(800);
      const after = await storyState(page);
      check(after.step === before.step && JSON.stringify(after.decisions) === JSON.stringify(before.decisions), `${run.name}: tải lại trang giữ tiến độ (bước ${after.step})`);
    }
  }
  const s = await storyState(page);
  const total = await page.evaluate(() => window.__hoitu.data.story.stops.length);
  check(s.step === total && Object.keys(s.decisions).length === 8, `${run.name}: đi hết ${total} điểm dừng, đủ 8 quyết định (${done.length} lượt)`);
  check(s.bond === run.bond, `${run.name}: giữ lựa chọn bond ${run.bond}`);
  const expected = await page.evaluate(() => { const h = window.__hoitu, st = h.data.story, s = h.storyProgress.get(); return h.storyLogic.pickEnding(st, h.data.config.endings, s.decisions, h.storyLogic.storyFacts(st, s).size); });
  const title = await runFinale(page, 1200);
  const want = await page.evaluate((id) => window.__hoitu.data.strings[window.__hoitu.data.story.endings[id].title], expected.id);
  check(title === want, `${run.name}: màn hình hiện ${expected.id}${expected.variant ? `/${expected.variant}` : ""} (“${title}”)`);
  check((await storyState(page)).endingsSeen.includes(expected.id), `${run.name}: lưu ${expected.id} vào Thư viện kết cục`);
  if (run.name.startsWith("build-easy")) {
    await page.locator("[data-rewind]").click(); await wait(500);
    const r = await storyState(page);
    check(r.step === total - 2 && !r.decisions.final && !r.decisions.bursts && r.decisions.version === "B", `${run.name}: Chọn lại từ tổng duyệt giữ lựa chọn trước đó`);
    for (let i = 0; i < 3; i++) if (!(await playStop(page, { final: "A", bursts: "A" }))) break;
    const again = await runFinale(page, 600);
    check(Boolean(again), `${run.name}: chơi lại tổng duyệt ra kết cục mới (“${again}”)`);
  }
  await ctx.close();
}

// Bản lưu version 3 (bản 2.7) vẫn mở được và được chuyển sang điểm dừng tương ứng.
if (process.env.ONLY !== "hack") {
  const legacy = { version: 3, savedAt: Date.now(), data: { step: 3, answers: [true, false], introSeen: true, bond: "build", asked: ["1"], activeSeconds: 420, fieldChoices: { report0: 1 }, rehearsals: 0 } };
  const { ctx, page } = await open("legacy");
  await page.evaluate((v) => { localStorage.setItem("hoitu70:story", v); }, JSON.stringify(legacy));
  await page.reload(); await ready(page);
  await page.evaluate(() => window.__hoitu.go("walk")); await wait(800);
  const s = await storyState(page);
  check(s.legacyStep === 0 && s.step === 5 && s.bond === "build" && s.activeSeconds >= 420 && s.decisions.version === "A", `bản lưu 2.7 bước 3 → điểm dừng ${s.step}, giữ bond và thời gian chơi`);
  check(await page.locator(".walk-dialog:not([hidden])").count() === 1, "báo cho người chơi biết bản lưu đã được chuyển");
  await ctx.close();
}

// Hack mode: xem thẳng từng kết cục; E2 thêm chế độ giảm hiệu ứng ánh sáng.
{
  const { ctx, page } = await open("hack");
  await page.keyboard.press("Control+Shift+H");
  await page.evaluate(() => window.__hoitu.storyProgress.set({ introSeen: true }));
  await page.evaluate(() => window.__hoitu.go("walk")); await wait(600);
  for (const id of ["E1", "E2", "E3", "E4", "E5", "E6"]) {
    await page.evaluate(() => document.querySelectorAll("details.hud-more, details.dev-tools").forEach((d) => { d.open = true; }));
    await page.locator(`[data-dev-ending="${id}"]`).click();
    await page.waitForSelector("[data-skip]"); await wait(700); await page.locator("[data-skip]").click();
    await page.waitForSelector(".ending-panel h2");
    const t = await page.locator(".ending-panel h2").textContent();
    check(Boolean(t), `Hack mode xem ${id}: “${t}”`);
    if (id === "E2") check((await page.locator(".ending-caption").count()) > 0, "E2 có chú thích sa bàn mô phỏng");
    await page.locator("[data-rewind]").click(); await wait(300);
  }
  await ctx.close();
}

// Tỉ lệ kết cục trên mọi tổ hợp lựa chọn (tất định, không quay ngẫu nhiên).
{
  const { ctx, page } = await open("distribution");
  const d = await page.evaluate(() => { const h = window.__hoitu; return h.storyLogic.enumerateEndings(h.data.story, h.data.config.endings); });
  console.log("tỉ lệ kết cục:", Object.entries(d.share).map(([k, v]) => `${k} ${v.toFixed(2)}%`).join(", "));
  check(Math.abs(d.share.E2 - 70) <= 2, `E2 xuất hiện ${d.share.E2.toFixed(2)}% trên ${d.total} tổ hợp lựa chọn`);
  await ctx.close();
}

await browser.close();
console.log(`story-e2e: ${passes} đạt, ${failures.length} lỗi, ${errors.length} lỗi console`);
for (const e of errors.slice(0, 10)) console.log("  CONSOLE", e);
process.exit(failures.length || errors.length ? 1 : 0);
