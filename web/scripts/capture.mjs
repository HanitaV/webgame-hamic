/**
 * Chụp ảnh màn hình toàn bộ luồng chơi (điện thoại ngang 844×390, máy tính 1280×800, điện thoại dọc).
 * Playwright nằm trong devDependencies; mặc định dùng Chrome có sẵn trên máy.
 * Có thể đặt CAPTURE_CHANNEL=chromium sau khi cài trình duyệt bằng npx playwright install chromium.
 *   npm run build && npx vite preview --port 4173 &
 *   npm run capture -- [thư-mục-ra] [phone|desk|portrait]
 * Mặc định ghi vào ../docs/screenshots. In ra mọi lỗi console; thoát mã 1 nếu có lỗi.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const out = process.argv[2] ?? "../docs/screenshots";
const only = process.argv[3] ?? "";
const url = process.env.CAPTURE_URL ?? "http://127.0.0.1:4173/";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CAPTURE_CHANNEL ?? (process.env.PLAYWRIGHT_MODULE ? undefined : "chrome"), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

async function session(name, viewport, mobile, fn) {
  if (only && !name.startsWith(only)) return;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`${name}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.stack ?? e}`));
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.__hoitu?.ready, null, { timeout: 120000 });
  const snap = async (shot) => { await wait(500); await page.screenshot({ path: `${out}/${name}-${shot}.png`, timeout: 120000, animations: "disabled" }); };
  try { await fn(page, snap); }
  catch (e) {
    console.log("FAILED STATE",name,await page.evaluate(() => ({ position:window.__hoitu.walkPosition(), walking:window.__hoitu.walkingMetrics(), world:window.__hoitu.worldDiagnostics(), story:window.__hoitu.storyProgress.get(), visible:document.visibilityState, dialog:document.querySelector('.walk-dialog')?.textContent })));
    throw e;
  } finally { await ctx.close(); }
}

const flow = async (page, snap) => {
  await snap("title");
  await page.getByText("Bản vẽ kỹ thuật", {exact:true}).click();
  await snap("journey");
  await page.click("text=Chơi màn 1.1");
  await wait(300);
  await snap("level-1.1");
  // set a = 70 via slider input, b = 1.65
  await page.evaluate(() => {
    const ins = document.querySelectorAll(".slider input");
    const set = (i, v) => { ins[i].value = String(v); ins[i].dispatchEvent(new Event("input", { bubbles: true })); };
    set(0, 70); set(1, 1.65);
  });
  await page.click(".run");
  await wait(1600);
  await snap("level-1.1-result");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  // unlock circuits 1-3 for the remaining screens
  await page.evaluate(() => {
    const P = window.__hoitu.progress;
    const lv = {};
    for (const id of ["1.1","1.2","1.3","1.4","2.1","2.2","2.3","2.4","3.1","3.2","3.3","3.4","3.5"]) lv[id] = { done: true, stars: [true, true, id !== "1.4"], hints: 0, runs: 1 };
    P.set({ levels: lv, lit: [1, 2, 3], factsN: [1,2,3,6,14,17,28,70] });
    window.__hoitu.reset("title");
  });
  await snap("title-progress");
  await page.evaluate(() => { window.__hoitu.go("level", { id: "2.3", mode: "journey" }); });
  await page.click(".palette .tile >> nth=0");
  await page.click(".palette .tile >> nth=1");
  await snap("level-2.3");
  await page.evaluate(() => { window.__hoitu.go("level", { id: "3.2", mode: "journey" }); });
  await page.click(".blk-tile.blk-repeat");
  await page.click(".blk-list .blk-drop >> nth=0");
  await page.click(".blk-tile.blk-place");
  await page.click(".blk-tile.blk-move");
  await snap("level-3.2");
  await page.click(".run");
  await wait(2600);
  await snap("level-3.2-run");
  await page.evaluate(() => { document.querySelectorAll(".modal-layer").forEach((n) => n.remove()); window.__hoitu.go("level", { id: "4.1", mode: "journey" }); });
  await snap("level-4.1");
  await page.evaluate(() => window.__hoitu.go("casual"));
  await snap("casual");
  await page.evaluate(() => window.__hoitu.go("notebook"));
  await snap("notebook");
  await page.evaluate(() => window.__hoitu.go("achievements"));
  await snap("achievements");
  await page.evaluate(() => window.__hoitu.go("settings"));
  await snap("settings");
  await page.evaluate(() => window.__hoitu.go("share"));
  await wait(600);
  await snap("share");
  await page.evaluate(() => window.__hoitu.go("finale", { mode: "journey", showOnly: true }));
  await wait(9000);
  await snap("show");
};

/* ---------- Cốt truyện 2.8 (dùng chung bộ điều khiển với story-e2e.mjs) ---------- */
const { startStory, playStop, runFinale } = await import("./story-driver.mjs");

await session("story", { width: 844, height: 390 }, true, async (page, snap) => {
  await startStory(page, "build", snap);
  await wait(1500); await snap("walk-start");
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    const chapter = await page.evaluate(() => { const h = window.__hoitu; return h.storyLogic.currentChapter(h.data.story, h.storyProgress.get()).id; });
    if (!seen.has(chapter)) { seen.add(chapter); await page.evaluate((n) => window.__hoitu.teleportTo(n), await page.evaluate(() => { const h = window.__hoitu, st = h.data.story, s = h.storyProgress.get(), stop = st.stops[s.step]; if (!stop) return "t3"; const c = h.data.map.walk.characters.find((x) => x.id === stop.npc); return h.storyLogic.npcPlace(st, stop.chapter, stop.npc, { node: c.node }).node; })); await wait(900); await snap(`chapter-${chapter}`); }
    const id = await playStop(page, { ha: "B", captions: "A" }, async (shot) => { if (!seen.has(shot)) { seen.add(shot); await snap(shot); } });
    if (!id) break;
    if (id === "s4") { await page.locator("[data-chat]").click(); await snap("chat"); await page.keyboard.press("Escape"); }
    if (id === "s9") { await page.locator("[data-notebook]").click(); await snap("notebook-evidence"); await page.locator('[data-tab="timeline"]').click(); await snap("notebook-timeline"); await page.keyboard.press("Escape"); }
  }
  await page.evaluate(() => window.__hoitu.teleportTo("lawn")); await wait(400);
  await page.evaluate(() => window.__walkTest.interact("math")); await wait(300); await snap("npc-chat");
  for (let i = 0; i < 4 && await page.locator(".walk-dialog:not([hidden]) [data-dialogue-next]").count(); i++) await page.locator(".walk-dialog:not([hidden]) [data-dialogue-next]").click();
  await snap("topics"); await page.keyboard.press("Escape");
  await runFinale(page, 4000, snap); await snap("ending-panel");
  await page.locator("[data-rewind]").click(); await wait(600); await snap("after-rewind");
});

for (const reduce of [false, true]) await session(reduce ? "ending-reduced" : "ending", { width: 844, height: 390 }, true, async (page, snap) => {
  if (reduce) await page.evaluate(() => { localStorage.setItem("hoitu70:settings", JSON.stringify({ version: 1, savedAt: 0, data: { reduceLights: true } })); });
  if (reduce) { await page.reload(); await page.waitForFunction(() => window.__hoitu?.ready); }
  await page.keyboard.press("Control+Shift+H");
  await page.evaluate(() => { window.__hoitu.storyProgress.set({ introSeen: true }); window.__hoitu.go("walk"); });
  await wait(800);
  const list = reduce ? [["E2", "E2"]] : [["E1", "E1"], ["E2", "E2-version"], ["E3", "E3"], ["E4", "E4"], ["E5", "E5"], ["E6", "E6"]];
  for (const [id, name] of list) {
    await page.evaluate(() => document.querySelectorAll("details.hud-more, details.dev-tools").forEach((d) => { d.open = true; }));
    // Developer controls may sit outside the short HUD's visible area.
    await page.locator(`[data-dev-ending="${id}"]`).dispatchEvent("click");
    await page.waitForSelector("[data-skip]"); await wait(6200); await snap(`${name}-scene`);
    await page.locator("[data-skip]").click({ timeout: 3000 }).catch(() => {}); await page.waitForSelector(".ending-panel h2"); await snap(`${name}-panel`);
    await page.locator("[data-rewind]").click(); await wait(400);
  }
  if (!reduce) for (const v of ["notes", "final", "extra"]) {
    await page.evaluate(() => document.querySelectorAll("details.hud-more, details.dev-tools").forEach((d) => { d.open = true; }));
    const label = await page.evaluate((k) => window.__hoitu.data.strings[window.__hoitu.data.story.endings.E2.variants[k].title], v);
    await page.locator(".dev-tools button", { hasText: label }).dispatchEvent("click");
    await page.waitForSelector("[data-skip]"); await page.locator("[data-skip]").click({ timeout: 3000 }).catch(() => {}); await page.waitForSelector(".ending-panel h2"); await snap(`E2-${v}-panel`);
    await page.locator("[data-rewind]").click(); await wait(400);
  }
});

await session("library", { width: 844, height: 390 }, true, async (page, snap) => {
  await page.evaluate(() => { window.__hoitu.storyProgress.set({ introSeen: true, endingsSeen: ["E1", "E2", "E4"] }); window.__hoitu.go("walk"); });
  await wait(800); await page.locator("[data-notebook]").click(); await page.locator('[data-tab="endings"]').click(); await snap("endings-library");
  await page.locator('[data-tab="facts"]').click(); await snap("facts");
});

await session("phone", { width: 844, height: 390 }, true, flow);
await session("desk", { width: 1280, height: 800 }, false, flow);
await session("portrait", { width: 390, height: 844 }, true, async (page, snap) => { await snap("cover"); });
console.log("ERRORS", JSON.stringify(errors, null, 1));
await browser.close();
if (errors.length) process.exit(1);
