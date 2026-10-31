import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page = await browser.newPage({viewport:{width:844,height:390}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/');
 await page.waitForFunction(()=>window.__hoitu?.ready);
 await page.locator('.music-dock > button').click();
 for(const chapter of ['ch0','ch1','ch2a','ch2b','ch3']) {
  await page.evaluate(ch=>{const h=window.__hoitu;h.storyProgress.set({step:h.data.story.stops.findIndex(x=>x.chapter===ch)});h.reset('title');},chapter);
  await page.waitForFunction(ch=>{const d=window.__hoitu.musicDiagnostics();return d.chapter===ch&&d.playing&&!d.loading},chapter,{timeout:30000});
  const d=await page.evaluate(()=>window.__hoitu.musicDiagnostics());assert.equal(d.failed,false);assert.ok(d.gain<=.121);assert.ok(d.cached<=2);console.log(chapter,d);
 }
 await page.getByRole('button',{name:'Tắt nhạc',exact:true}).click();
 await page.waitForTimeout(700);
 assert.equal((await page.evaluate(()=>window.__hoitu.musicDiagnostics())).playing,false);
 await page.reload();await page.waitForFunction(()=>window.__hoitu?.ready);
 assert.equal(await page.evaluate(()=>window.__hoitu.settings.get().musicEnabled),false);
 await page.locator('.music-dock > button').click();
 await page.getByRole('button',{name:'Bật nhạc',exact:true}).click();
 await page.waitForFunction(()=>window.__hoitu.musicDiagnostics().playing);
 await page.evaluate(()=>window.__hoitu.settings.set({mute:true}));await page.waitForTimeout(700);
 assert.equal((await page.evaluate(()=>window.__hoitu.musicDiagnostics())).playing,false);
 await page.evaluate(()=>{window.__hoitu.settings.set({mute:false});window.__hoitu.reset('walk')});
 await page.waitForTimeout(1000);
 await page.screenshot({path:'../docs/screenshots/phone-music-panel.png'});
 await page.keyboard.press('Control+Shift+H');
 await page.evaluate(()=>{const h=window.__hoitu;h.storyProgress.replace({...h.storyLogic.fastForward(h.data.story,h.storyProgress.get(),h.data.story.stops.length),introSeen:true});h.go('walk')});
 await page.locator('[data-dev-ending="E2"]').dispatchEvent('click');
 await page.waitForFunction(()=>window.__hoitu.musicDiagnostics().quiet);
 await page.waitForTimeout(1500);
 assert.ok((await page.evaluate(()=>window.__hoitu.musicDiagnostics())).gain<.001);
 await page.evaluate(()=>window.__hoitu.reset('title'));
 await page.waitForTimeout(1500);
 assert.equal((await page.evaluate(()=>window.__hoitu.musicDiagnostics())).quiet,false);
 assert.ok((await page.evaluate(()=>window.__hoitu.musicDiagnostics())).gain>.1);
 assert.deepEqual(errors,[]);console.log('PASS: 5 tracks decode/play, soft gain, bounded cache, toggle, persistence, global mute');
} finally {await browser.close()}
