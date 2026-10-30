import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const out = resolve(root, "output/shots");
mkdirSync(out, { recursive: true });
const consoleErrors = [];

const defaultChrome = {
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "/usr/bin/google-chrome",
}[process.platform];
const browser = await puppeteer.launch({
  // Set CHROME_PATH to any Chrome/Chromium binary.
  executablePath: process.env.CHROME_PATH || defaultChrome,
  headless: true,
  args: ["--hide-scrollbars", "--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
  defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(String(error)));
page.on("response", (response) => {
  if (response.status() >= 400) consoleErrors.push(`${response.status()} ${response.url()}`);
});

await page.goto(process.env.APP_URL || "http://127.0.0.1:4173/", { waitUntil: "networkidle0", timeout: 120000 });
await page.waitForFunction(() => window.__campus && window.__campus.ready, { timeout: 120000 });
const report = await page.evaluate(() => ({
  selfTest: window.__campus.selfTest,
  errors: window.__campus.errors,
  graphics: window.__campus.graphics(),
}));
console.log(JSON.stringify(report, null, 2));
if (!report.selfTest.ok) {
  throw new Error("in-page control self-test failed");
}

await page.evaluate(() => { window.__campus.setGraphics(false); window.__campus.setHour(10, false); });
await page.evaluate(() => document.body.classList.add("ui-off"));
const hidden = await page.evaluate(() => getComputedStyle(document.querySelector("#title")).display);
console.log("title display while UI hidden:", hidden);
await page.screenshot({ path: resolve(out, "overview.png") });
await page.evaluate(() => window.__campus.flyTo("ussh"));
await new Promise((resolveWait) => setTimeout(resolveWait, 250));
await page.screenshot({ path: resolve(out, "ussh.png") });
await page.evaluate(() => window.__campus.flyTo("hus"));
await new Promise((resolveWait) => setTimeout(resolveWait, 250));
await page.screenshot({ path: resolve(out, "hus.png") });
await page.evaluate(() => window.__campus.setMode("cine"));
await new Promise((resolveWait) => setTimeout(resolveWait, 2500));
await page.screenshot({ path: resolve(out, "cine.png") });
await page.evaluate(() => document.querySelector("#cine-pause").click());
await page.evaluate(() => window.__campus.setMode("walk"));
await new Promise((resolveWait) => setTimeout(resolveWait, 300));
await page.screenshot({ path: resolve(out, "walk.png") });

const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));
await page.evaluate(() => window.__campus.view([221, 123.5, 52], [119.6, 5.2, -123.5]));
await page.evaluate(() => window.__campus.showFloor(3));
await page.evaluate(() => window.__campus.view([221, 123.5, 52], [119.6, 5.2, -123.5]));
await wait(300);
await page.screenshot({ path: resolve(out, "hus-floor3.png") });
await page.evaluate(() => window.__campus.showFloor(1));
await page.evaluate(() => window.__campus.view([106.6, 91, 13], [106.6, 0, -91]));
await wait(300);
await page.screenshot({ path: resolve(out, "hus-floor1-axis.png") });
await page.evaluate(() => window.__campus.showFloor(7));
await page.evaluate(() => window.__campus.view([240.5, 91, -78], [187.2, 26, -156]));
await wait(300);
await page.screenshot({ path: resolve(out, "hus-t5-floor7.png") });
await page.evaluate(() => window.__campus.showFloor(null));
await page.evaluate(() => window.__campus.view([106.6, 18.2, 23.4], [106.6, 7.8, -78]));
await wait(300);
await page.screenshot({ path: resolve(out, "hus-gate-axis.png") });
await page.evaluate(() => window.__campus.teleport(72.8, -73.2, 3, -Math.PI / 2));
await wait(400);
await page.screenshot({ path: resolve(out, "walk-t1-floor3.png") });
await page.evaluate(() => window.__campus.teleport(106.6, -52, 1, 0));
await wait(400);
await page.screenshot({ path: resolve(out, "walk-t1-lobby.png") });
// Camera against a wall: standing in the T1 corridor with the back to the street wall.
await page.evaluate(() => window.__campus.teleport(78, -71.8, 2, 0));
await page.evaluate(() => window.__campus.step(30));
await wait(500);
console.log("camera clear in corridor:", await page.evaluate(() => window.__campus.cameraClear()));
await page.screenshot({ path: resolve(out, "walk-wall.png") });
await page.evaluate(() => window.__campus.showFloor(5));
await page.evaluate(() => window.__campus.showFloor(null));
await page.evaluate(() => window.__campus.view([124.8, 24.7, -145.6], [174.2, 22.8, -154.7]));
await wait(400);
await page.screenshot({ path: resolve(out, "hus-t5-logo.png") });
await page.evaluate(() => window.__campus.showFloor(1));
await page.evaluate(() => window.__campus.view([67.6, 20.8, -59.8], [53.3, 0, -80.6]));
await wait(400);
await page.screenshot({ path: resolve(out, "hus-wc-t1.png") });
await page.evaluate(() => window.__campus.showFloor(null));
await page.evaluate(() => window.__campus.view([130, 18.2, -135.2], [174.2, 2.6, -140.4]));
await wait(400);
await page.screenshot({ path: resolve(out, "hus-t5-doors.png") });
await page.evaluate(() => window.__campus.setHour(18.1, false));
await page.evaluate(() => window.__campus.view([244.4, 88.4, 20.8], [117, 10.4, -143]));
await wait(500);
await page.screenshot({ path: resolve(out, "dusk.png") });
await page.evaluate(() => window.__campus.setHour(22, false));
await page.evaluate(() => window.__campus.view([78, 52, 52], [130, 15.6, -143]));
await wait(500);
await page.screenshot({ path: resolve(out, "night.png") });
await page.evaluate(() => { window.__campus.setGraphics(true); window.__campus.setHour(10, false); });
await page.evaluate(() => window.__campus.view([244.4, 88.4, 20.8], [117, 10.4, -143]));
await wait(1500);
await page.screenshot({ path: resolve(out, "fancy-day.png") });
await page.evaluate(() => window.__campus.setGraphics(false));
await page.evaluate(() => window.__campus.setHour(10, false));

await page.evaluate(() => {
  document.body.classList.remove("ui-off");
  window.__campus.setMode("orbit");
  window.__campus.flyTo("overview");
});
await page.screenshot({ path: resolve(out, "ui-desktop.png") });

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await new Promise((resolveWait) => setTimeout(resolveWait, 400));
await page.screenshot({ path: resolve(out, "mobile.png") });

await page.evaluate(() => window.__campus.setMode("walk"));
await new Promise((resolveWait) => setTimeout(resolveWait, 300));
await page.screenshot({ path: resolve(out, "mobile-walk.png") });

console.log("console errors:", consoleErrors);
if (consoleErrors.length) {
  throw new Error("page logged console errors");
}
await browser.close();
console.log("shots:", out);
