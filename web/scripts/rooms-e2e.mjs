import { chromium } from 'playwright';
import { ready, wait } from './story-driver.mjs';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390},serviceWorkers:'block'});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/interiors/'))requests.push(r.url());});
const out='../output/topology-capture';mkdirSync(out,{recursive:true});
const mapPosition=()=>page.evaluate(()=>{const h=window.__hoitu,p=h.walkPosition(),m=h.data.map;return {x:p.x/m.scale+m.origin[0],z:p.z/m.scale+m.origin[1]};});
try{
 await page.goto(process.env.CAPTURE_URL??'http://127.0.0.1:4173/');await ready(page);
 await page.evaluate(()=>{const h=window.__hoitu;h.storyProgress.set({introSeen:true});h.go('walk');});await page.locator('[data-dialogue-next]').click();await wait(300);
 assert.equal(requests.length,0,'Indoor model and JSON remain lazy');
 await page.evaluate(()=>{const h=window.__hoitu;h.teleportToPoint(106.6,-64);h.pauseWalk(false);h.walkToPoint(106.6,-95);});
 assert((await page.evaluate(()=>window.__hoitu.walkingMetrics())).route>0,'Route through T1 exists');
 await page.waitForFunction(()=>{const h=window.__hoitu,p=h.walkPosition(),m=h.data.map;return p.z/m.scale+m.origin[1]<-94;},null,{timeout:10000});
 await page.screenshot({path:out+'/t1-passage.png'});
 // The same facade has an opening at the lobby and solid wall away from it.
 await page.evaluate(()=>{const h=window.__hoitu;h.teleportToPoint(75,-65);h.pauseWalk(false);h.walkAxis(0,-1);});await wait(1000);await page.evaluate(()=>window.__hoitu.walkAxis(0,0));
 assert((await mapPosition()).z>-70.2,'T1 facade wall blocks northbound movement');
 // Previously omitted west wing: its outer wall must block movement too.
 await page.evaluate(()=>{const h=window.__hoitu;h.teleportToPoint(23,-100);h.walkAxis(1,0);});await wait(800);await page.evaluate(()=>window.__hoitu.walkAxis(0,0));
 assert((await mapPosition()).x<26,'T1 west-wing wall blocks movement');
 const doors=await page.evaluate(()=>window.__hoitu.data.map.buildings.find(b=>b.id==='HUS_T1').entrances);
 assert(doors.length>=3,'T1 has multiple model-derived entrances');
 for(let i=0;i<doors.length;i++){
  await page.evaluate(p=>{const h=window.__hoitu;h.teleportToPoint(...p);h.pauseWalk(false);},doors[i].position);await wait(150);
  assert(await page.evaluate(()=>window.__hoitu.enterBuilding('HUS_T1')),'Every T1 entrance enters the floor plan');await wait(300);
  const state=await page.evaluate(()=>window.__hoitu.roomState());
  assert(state.room.rooms.length>40,'T1 floor includes both wings and rooms');assert(state.room.solids.length>100,'Interior collision uses model walls');
  assert(state.room.rooms.some(r=>r.type==='lab'),'Lab spaces preserved');
  if(i===0){
    await page.screenshot({path:out+'/t1-ground-floor.png'});assert(requests.some(r=>r.endsWith('.glb')),'Real model is loaded on entry');
    const lab=state.room.rooms.find(r=>r.num==='111'),center=state.room.sourceCenter;
    const goal={x:1000+lab.door[0]-center[0],z:lab.door[1]-center[1]};
    await page.evaluate(p=>window.__hoitu.walkToWorldPoint(p.x,p.z),goal);
    assert((await page.evaluate(()=>window.__hoitu.walkingMetrics())).route>0,'Indoor route through actual lab door exists');
    await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.2;},goal,{timeout:10000});
    await page.screenshot({path:out+'/t1-lab-room.png'});
  }
  await page.evaluate(()=>window.__hoitu.exitBuilding());await wait(100);
  const p=await mapPosition();assert(Math.abs(p.x-doors[i].position[0])<.01 && Math.abs(p.z-doors[i].position[1])<.01,'Exit returns to selected entrance');
 }
 for(const b of await page.evaluate(()=>window.__hoitu.data.map.buildings.filter(b=>b.enterable))){
  await page.evaluate(p=>window.__hoitu.teleportToPoint(...p),b.entrance);
  assert(await page.evaluate(id=>window.__hoitu.enterBuilding(id),b.id),b.id+' enters');await wait(100);await page.evaluate(()=>window.__hoitu.exitBuilding());await wait(100);
 }
 await page.evaluate(()=>window.__hoitu.teleportToPoint(-135,-120));assert.equal(await page.evaluate(()=>window.__hoitu.enterBuilding('USSH_C')),false);
 await page.route('**/interiors/T1.json',r=>r.fulfill({status:503,body:'unavailable'}));
 await page.evaluate(p=>window.__hoitu.teleportToPoint(...p),doors[0].position);assert.equal(await page.evaluate(()=>window.__hoitu.enterBuilding('HUS_T1')),false);
 await page.unroute('**/interiors/T1.json');assert(await page.evaluate(()=>window.__hoitu.enterBuilding('HUS_T1')));await wait(100);await page.evaluate(()=>window.__hoitu.exitBuilding());
 assert.deepEqual(errors,[]);console.log('PASS: T1 through passage, facade/wing walls, all T1 entrances, model floor plan/labs, lazy GLB, all open HUS buildings, USSH closed, load retry.');
}finally{await browser.close();}
