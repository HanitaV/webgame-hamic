import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await page.waitForFunction(() => window.__campus?.ready);
  const result = await page.evaluate(() => {
    const api = window.__campus;
    api.setMode("walk");
    const start = api.player().y;
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    api.step(12);
    const peak = api.player().y;
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", repeat: true }));
    api.step(120);
    const landed = api.player().y;
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
    document.querySelector("#jump").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    api.step(12);
    const touch = api.player().y;
    return { start, peak, landed, touch };
  });
  assert(result.peak > result.start + 0.5);
  assert.equal(result.landed, result.start);
  assert(result.touch > result.start + 0.5);
  console.log("browser jump-check ok", result);
} finally { await browser.close(); }
