import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const out='../output/room-camera-access';mkdirSync(out,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function approach(type){
  const r=await page.evaluate(type=>{
    const h=window.__hoitu,s=h.roomState(),p=h.walkPosition(),[cx,cz]=s.room.sourceCenter;
    const rooms=s.room.rooms.filter(r=>r.type===type).sort((a,b)=>Math.hypot(1000+a.approach[0]-cx-p.x,a.approach[1]-cz-p.z)-Math.hypot(1000+b.approach[0]-cx-p.x,b.approach[1]-cz-p.z));
    const r=rooms[0],target={x:1000+r.approach[0]-cx,z:r.approach[1]-cz};h.walkToWorldPoint(target.x,target.z);return {file:r.interiorFile,target};
  },type);
  await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.2;},r.target,{timeout:60000});await wait(200);return r;
}
async function building(id){
  assert(await page.evaluate(async id=>{const h=window.__hoitu,b=h.data.map.buildings.find(b=>b.id===id);h.teleportToPoint(...b.entrance);h.pauseWalk(false);return h.enterBuilding(id);},id));await wait(200);
}
try{
  await page.goto(process.env.CAPTURE_URL??'http://127.0.0.1:4181/');await page.waitForFunction(()=>window.__hoitu?.ready,null,{timeout:120000});
  await page.evaluate(()=>{const h=window.__hoitu;h.storyProgress.set({introSeen:true});h.go('walk');});await page.locator('[data-dialogue-next]').click();
  await building('HUS_T1');const office=await approach('office');
  assert.equal(await page.evaluate(file=>window.__hoitu.enterRoom(file),office.file),false,'Office API denies entry');
  assert.equal(await page.locator('[data-enter-room]').count(),0,'No office entry button');
  assert(await page.locator('[data-office-closed]').isVisible(),'Office restriction visible');
  assert.equal(await page.evaluate(()=>window.__hoitu.roomState().activeRoom),null);
  await page.screenshot({path:out+'/office-closed.png'});
  await approach('lab');await page.locator('[data-enter-room]').click();await page.locator('[data-confirm-space]').click();
  await page.waitForFunction(()=>window.__hoitu.roomState().activeRoom?.type==='lab');await wait(700);await page.screenshot({path:out+'/lab.png'});
  await building('HUS_T5');await approach('classroom');await page.locator('[data-enter-room]').click();await page.locator('[data-confirm-space]').click();
  await page.waitForFunction(()=>window.__hoitu.roomState().activeRoom?.type==='classroom');await wait(700);await page.screenshot({path:out+'/classroom.png'});
  assert.deepEqual(errors,[]);console.log('PASS: office blocked in UI/API; lab/classroom camera captures at 844×390');
}finally{await browser.close();}
