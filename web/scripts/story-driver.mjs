/**
 * Điều khiển cốt truyện 2.8 qua giao diện thật (Playwright), dùng chung cho story-e2e.mjs và capture.mjs.
 * Minigame trong hộp thoại được giải bằng cách bấm nút như người chơi; câu đố mở màn chơi riêng được
 * giải qua móc __walkTest.solveActivity (màn chơi riêng đã có kiểm thử ở check-answers và capture).
 */

/** Chỉ tìm trong hộp thoại đang mở (hộp thoại đóng vẫn giữ nội dung cũ trong DOM). */
const D = (sel) => `.walk-dialog:not([hidden]) ${sel}`;

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ready(page) {
  await page.waitForFunction(() => window.__hoitu?.ready, null, { timeout: 120000 });
}

/** Trạng thái hiện tại của truyện. */
export const storyState = (page) => page.evaluate(() => window.__hoitu.storyProgress.get());

export async function startStory(page, bond = "listen", snap) {
  await page.locator("[data-story-start]").click();
  await page.waitForSelector("[data-dialogue-next]", { timeout: 30000 });
  if (snap) await snap("prologue");
  for (let i = 0; i < 10 && await page.locator(D("[data-dialogue-next]")).count() && !(await page.locator("[data-bond]").count()); i++) await page.locator(D("[data-dialogue-next]")).first().click();
  if (snap) await snap("bond");
  await page.locator(`[data-bond="${bond}"]`).click();
  await page.locator(D("[data-dialogue-next]")).click();
}

/** Giải minigame đang mở trong hộp thoại bằng các thao tác đúng. */
export async function solveDialogActivity(page, snap) {
  const plan = await page.evaluate(() => {
    const h = window.__hoitu, st = h.data.story, s = h.storyProgress.get();
    const a = st.stops[s.step].activity;
    const vi = h.data.strings;
    if (a.type === "versions") { const A = a.files[0].lines.map((k) => vi[k]), B = a.files[1].lines.map((k) => vi[k]); return { type: a.type, clicks: A.map((x, i) => x !== B[i] ? `[data-version-line="${i}"]` : null).filter(Boolean) }; }
    if (a.type === "sync") { const need = new Set(a.folders.filter((f) => f.role === "need").map((f) => f.id)), on = new Set(a.start); return { type: a.type, clicks: a.folders.filter((f) => need.has(f.id) !== on.has(f.id)).map((f) => `[data-sync-folder="${f.id}"]`) }; }
    if (a.type === "captions") return { type: a.type, clicks: a.captions.flatMap((c) => [`[data-photo="${c.photo}"]`, `[data-caption="${c.id}"]`]) };
    if (a.type === "topo") { const order = [], left = [...a.steps]; while (left.length) { const i = left.findIndex((x) => x.needs.every((n) => order.includes(n))); order.push(left.splice(i, 1)[0].id); } return { type: a.type, clicks: order.map((id) => `[data-topo-step="${id}"]`) }; }
    if (a.type === "causes") return { type: a.type, clicks: a.cards.filter((c) => c.real).map((c) => `[data-cause="${c.id}"]`) };
    if (a.type === "timing") return { type: a.type, clicks: [], delay: a.rise + 0.3, hold: a.words / a.rate + 0.5 };
    return { type: a.type, clicks: [] };
  });
  // một lần thử sai trước để kiểm phản hồi không phạt
  await page.locator(D("[data-activity-check]")).click();
  if (await page.locator(D("[data-activity-continue]")).count()) throw new Error(`${plan.type}: chấp nhận lời giải rỗng`);
  await page.locator(D("[data-activity-hint]")).click();
  for (const sel of plan.clicks) await page.locator(D(sel)).click();
  if (plan.type === "timing") await page.evaluate(([d, h]) => {
    const set = (k, v) => { const i = document.querySelector(`[data-timing="${k}"] input`); i.value = String(v); i.dispatchEvent(new Event("input", { bubbles: true })); };
    set("delay", d); set("hold", h);
  }, [plan.delay, plan.hold]);
  if (snap) await snap(`activity-${plan.type}`);
  await page.locator(D("[data-activity-check]")).click();
  try { const next = page.locator(D("[data-activity-continue]")); await next.waitFor({ timeout: 8000 }); await next.scrollIntoViewIfNeeded(); await next.click({ timeout: 15000 }); }
  catch (e) { throw new Error(`${plan.type}: chưa đạt sau lời giải đúng — “${await page.locator(D(".activity-feedback")).textContent()}”`); }
  return plan.type;
}

/**
 * Chơi điểm dừng hiện tại: dịch chuyển tới NPC, trò chuyện, giải câu đố, chọn phương án `choices[decision]`.
 * Trả về id điểm dừng đã xong.
 */
export async function playStop(page, choices, snap) {
  const info = await page.evaluate(() => {
    const h = window.__hoitu, st = h.data.story, s = h.storyProgress.get(), stop = st.stops[s.step];
    if (!stop) return null;
    const L = h.storyLogic, c = h.data.map.walk.characters.find((x) => x.id === stop.npc);
    const place = L.npcPlace(st, stop.chapter, stop.npc, { node: c.node, offset: c.offset });
    return { id: stop.id, npc: stop.npc, node: place.node, decision: stop.decision ?? null, activity: stop.activity?.type ?? null };
  });
  if (!info) return null;
  await page.evaluate((n) => window.__hoitu.teleportTo(n), info.node);
  await wait(250);
  await page.evaluate((id) => window.__walkTest.interact(id), info.npc);
  for (let guard = 0; guard < 60; guard++) {
    await wait(60);
    if (await page.locator(D("[data-dialogue-next]")).count()) { await page.locator(D("[data-dialogue-next]")).first().click(); continue; }
    if (await page.locator(D("[data-activity-check]:not([disabled])")).count()) { await solveDialogActivity(page, snap); continue; }
    if (await page.locator(D("[data-start-level]")).count()) { if (snap) await snap(`level-intro-${info.id}`); await page.evaluate(() => window.__walkTest.solveActivity()); continue; }
    if (await page.locator(D("[data-decision]")).count()) {
      if (snap) await snap(`decision-${info.decision}`);
      const want = choices[info.decision] ?? "A";
      await page.locator(D(`[data-decision="${info.decision}:${want}"]`)).click(); continue;
    }
    if (await page.locator(D("[data-story-continue]")).count()) { if (snap) await snap(`rewards-${info.id}`); await page.locator(D("[data-story-continue]")).click(); continue; }
    const s = await storyState(page);
    if (s.step > 0 && (await page.evaluate(() => document.querySelector(".walk-dialog")?.hidden))) break;
  }
  return info.id;
}

/** Chạy Đêm Hội tụ, bỏ qua cảnh sau `watchMs`, trả về tiêu đề kết cục trên bảng. */
export async function runFinale(page, watchMs = 2500, snap) {
  await page.evaluate(() => window.__walkTest.finale());
  await page.waitForSelector("[data-skip]", { timeout: 20000 });
  await wait(watchMs);
  if (snap) await snap("show");
  // Cảnh có thể đã tự hết trong lúc chờ (máy chậm): khi đó không còn nút Bỏ qua.
  await page.locator("[data-skip]").click({ timeout: 3000 }).catch(() => {});
  await page.waitForSelector(".ending-panel h2", { timeout: 20000 });
  return page.locator(".ending-panel h2").textContent();
}
