import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--force_high_performance_gpu", "--ignore-gpu-blocklist"] });
const url = process.env.CAPTURE_URL ?? "http://127.0.0.1:4173/";
const output = process.env.CINEMATIC_SHOTS ?? "../output/cinematics-in-game";
await mkdir(output, { recursive: true });
const errors = [], failures = [];
let passes = 0;
function check(ok, name) { if (ok) passes++; else failures.push(name); console.log(`${ok ? "PASS" : "FAIL"} ${name}`); }
async function open(setup) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  if (setup) await setup(page);
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.__hoitu?.ready, null, { timeout: 120000 });
  await page.keyboard.press("Control+Shift+H");
  await page.evaluate(() => {
    const h = window.__hoitu;
    h.storyProgress.replace({ ...h.storyLogic.fastForward(h.data.story, h.storyProgress.get(), h.data.story.stops.length), introSeen: true, activeSeconds: 367 });
    h.go("walk");
  });
  await page.waitForSelector('[data-dev-ending="E1"]', { state: "attached" });
  return { context, page };
}
async function start(page, id) { await page.locator(`[data-dev-ending="${id}"]`).dispatchEvent("click"); await page.waitForSelector("[data-skip]"); }
async function rewind(page) { await page.locator("[data-rewind]").click(); await page.waitForSelector('[data-dev-ending="E1"]', { state: "attached" }); }
try {
  const glb = await readFile(new URL("../public/models/show-drone.glb", import.meta.url));
  const model = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  check(model.nodes.filter(n => /^rotor_\d$/.test(n.name)).length === 4, "Drone GLB contains four identifiable rotors");
  check(model.nodes.filter(n => /^rotor_guard_\d$/.test(n.name)).length === 4 && model.materials.some(m => m.name === "drone_led"), "Drone GLB has guards and its own controllable lights");
  const { context, page } = await open();
  await page.locator('.walk-dialog:not([hidden]) [data-dialogue-next]').click();
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => { const d = window.__hoitu.worldDiagnostics().drones; return d.stationsVisible && d.stationCount === 5; }), "Five physical drones are present in gameplay");
  await page.screenshot({ path: `${output}/drone-gameplay-gate.png` });
  await page.evaluate(() => window.__hoitu.teleportTo("lawn"));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${output}/drone-gameplay-lawn.png` });
  check(await page.locator("video").count() === 0, "No video loaded during ordinary gameplay");
  for (const id of ["E1", "E2", "E3", "E4", "E5", "E6"]) {
    await start(page, id);
    await page.waitForSelector(`video.ready[data-cinematic="${id}"]`, { timeout: 20000 });
    await page.waitForFunction(() => document.querySelector("video").currentTime > .15);
    const info = await page.locator("video").evaluate(v => ({ width: v.videoWidth, height: v.videoHeight, duration: v.duration, controls: v.controls, muted: v.muted, inline: v.playsInline, pip: v.disablePictureInPicture, current: v.currentTime }));
    check(info.width === 1920 && info.height === 1080 && Math.abs(info.duration - 16) < .1, `${id}: decodes 1080p, 16 seconds`);
    check(info.current > 0 && !info.controls && info.muted && info.inline && info.pip, `${id}: inline background playback without player chrome`);
    await page.waitForFunction(id => window.__hoitu.endingAudioDiagnostics().some(s => s.id === id && s.ready && s.playing), id);
    await page.waitForFunction(() => window.__hoitu.audioDiagnostics().rms > .0001);
    check(await page.evaluate(id => { const sessions = window.__hoitu.endingAudioDiagnostics(); return sessions.length === 1 && sessions[0].id === id; }, id), `${id}: one synchronized soundtrack produces an audio signal`);
    if (id === "E2") {
      await page.evaluate(() => window.__hoitu.settings.set({ mute: true })); await page.waitForTimeout(180);
      check(await page.evaluate(() => window.__hoitu.audioDiagnostics().rms < .000001), "Mute silences an already-playing ending");
      await page.evaluate(() => window.__hoitu.settings.set({ mute: false, sfxVolume: 0 })); await page.waitForTimeout(180);
      check(await page.evaluate(() => window.__hoitu.audioDiagnostics().gain < .00001), "Zero SFX volume silences the ending bus");
      await page.evaluate(() => window.__hoitu.settings.set({ sfxVolume: .25 })); await page.waitForTimeout(180);
      check(await page.evaluate(() => Math.abs(window.__hoitu.audioDiagnostics().gain - .25) < .001), "SFX slider controls the ending soundtrack live");
      await page.evaluate(() => window.__hoitu.settings.set({ sfxVolume: .6 }));
    }
    await page.locator("video").evaluate(v => v.pause());
    await page.waitForTimeout(100);
    check(await page.evaluate(() => window.__hoitu.endingAudioDiagnostics().every(s => !s.playing)), `${id}: pausing the film pauses its soundtrack`);
    for (const [time, shot] of [[1, "drone-model"], [2.3, "drone-lights"], [11, "scene"]]) {
      await page.locator("video").evaluate((v, time) => new Promise(resolve => { v.addEventListener("seeked", resolve, { once: true }); v.currentTime = time; }), time);
      if (shot === "drone-model") await page.waitForTimeout(650);
      if (id === "E1") {
        const want = await page.evaluate(time => window.__hoitu.data.strings[time < 3.6 ? "story.drone.launch" : "story.ui.showing"], time);
        check(await page.locator(".walk-caption > span").first().textContent() === want, `Drone introduction caption follows movie time at ${time}s`);
        check(await page.evaluate(time => window.__hoitu.endingAudioDiagnostics().every(s => Math.abs(s.offset - time) < .1 && !s.playing), time), `Audio seek follows the film to ${time}s without playing while paused`);
      }
      await page.screenshot({ path: `${output}/${id}-${shot}.png` });
    }
    await page.locator("video").evaluate(v => v.play());
    await page.screenshot({ path: `${output}/${id}-scene.png` });
    if (id === "E1") await page.waitForSelector(".ending-panel", { timeout: 10000 });
    else await page.locator("[data-skip]").click();
    await page.waitForSelector(".ending-panel");
    check(await page.locator("[data-ending-id]").getAttribute("data-ending-id") === id, `${id}: correct ending result after ${id === "E1" ? "natural completion" : "skip"}`);
    check(await page.locator("video").evaluate(v => v.paused), `${id}: holds a paused frame behind results`);
    check(await page.evaluate(() => window.__hoitu.endingAudioDiagnostics().length === 0), `${id}: natural completion/skip releases ending audio`);
    await page.screenshot({ path: `${output}/${id}-result.png` });
    await rewind(page);
    check(await page.locator("video").count() === 0, `${id}: rewind releases video`);
  }
  await context.close();
  for (const setting of ["reduceLights", "reduceMotion"]) {
    const { context: ctx, page: p } = await open(async p => {
      await p.addInitScript(([key, value]) => localStorage.setItem("hoitu70:settings", JSON.stringify({ version: 1, savedAt: Date.now(), data: { [key]: value, autoQuality: false } })), [setting, setting === "reduceMotion" ? "on" : true]);
    });
    await start(p, "E2");
    await p.waitForTimeout(600);
    check(await p.locator("video").count() === 0, `${setting}: full-motion film bypassed`);
    await p.locator("[data-skip]").click();
    await p.waitForSelector(".ending-panel");
    check(await p.locator(".ending-caption").count() === 1, `${setting}: safe scene still reaches E2 caption`);
    await ctx.close();
  }
  {
    const { context: ctx, page: p } = await open();
    await p.evaluate(() => window.__hoitu.go("finale", { mode: "journey", showOnly: true }));
    await p.waitForSelector('video.ready[data-cinematic="E1"]');
    await p.locator("[data-skip]").click();
    await p.waitForSelector(".show-end");
    check(true, "Technical finale also plays the film and its skip button is clickable");
    await p.evaluate(() => window.__hoitu.reset("title"));
    check(await p.locator("video").count() === 0, "Technical finale releases its film on exit");
    await ctx.close();
  }
  {
    const { context: ctx, page: p } = await open(async p => p.route("**/cinematics/*.mp4", route => route.fulfill({ status: 200, contentType: "video/mp4", body: "invalid video test" })));
    await start(p, "E3");
    await p.waitForFunction(() => document.querySelectorAll("video").length === 0 && window.__hoitu.worldDiagnostics().atmosphere.showing);
    check(true, "Invalid video falls back to the live 3D scene");
    await p.locator("[data-skip]").click(); await p.waitForSelector(".ending-panel");
    check(await p.locator("[data-ending-id]").getAttribute("data-ending-id") === "E3", "Fallback preserves the selected ending");
    check(await p.evaluate(() => window.__hoitu.endingAudioDiagnostics().length === 0), "Fallback skip also releases ending audio");
    await ctx.close();
  }
  {
    const { context: ctx, page: p } = await open(async p => p.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Autoplay test", "NotAllowedError")); }));
    await start(p, "E1");
    await p.waitForFunction(() => !document.querySelector("video") && window.__hoitu.worldDiagnostics().atmosphere.showing);
    check(true, "Autoplay rejection falls back without showing a native play button");
    await p.evaluate(() => window.__hoitu.reset("title"));
    check(await p.locator("video").count() === 0, "Leaving an active fallback cleans up");
    await ctx.close();
  }
} finally { await browser.close(); }
console.log(`${passes} passed, ${failures.length} failed, ${errors.length} console errors`);
for (const error of [...failures, ...errors]) console.log(error);
process.exit(failures.length || errors.length ? 1 : 0);
