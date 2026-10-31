import {chromium} from 'playwright';
import {ready,wait} from './story-driver.mjs';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const out=process.env.CAPTURE_OUT??'../output/connected-campus';mkdirSync(out,{recursive:true});
try{
 await page.goto(process.env.CAPTURE_URL??'http://127.0.0.1:4173/');await ready(page);
 await page.evaluate(()=>{const h=window.__hoitu;h.storyProgress.set({introSeen:true});h.go('walk');});await page.locator('[data-dialogue-next]').click();
 const enter=await page.evaluate(()=>window.__hoitu.data.map.buildings.find(b=>b.id==='HUS_T1').entrances.find(d=>d.zone==='east').position);
 await page.evaluate(p=>window.__hoitu.teleportToPoint(...p),enter);await wait(200);
 await page.locator('[data-enter-building]').click();await page.locator('[data-confirm-space]').click();
 await page.waitForFunction(()=>window.__hoitu.roomState().room?.connectedBuildings?.length===4);
 const root=await page.evaluate(()=>window.__hoitu.roomState().room.model);
 const junctions=await page.evaluate(()=>window.__hoitu.roomState().room.junctions.slice().sort((a,b)=>b.center[1]-a.center[1]));
 for(const j of junctions){
  const [x,z]=j.center;
  for(const offset of [3,0,-3]){
   const goal=await page.evaluate(([x,z])=>{const h=window.__hoitu,c=h.roomState().room.sourceCenter,p={x:1000+x-c[0],z:z-c[1]};h.walkToWorldPoint(p.x,p.z);return p;},[x+(j.axis==='x'?offset:0),z+(j.axis==='z'?offset:0)]);
   await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.2;},goal,{timeout:60000});
   if(offset===0){await wait(300);await page.screenshot({path:out+'/junction-'+j.id+'.png'});}
  }
  console.log('PASS walk across finished junction',j.id);
 }
 for(const [building,x,z] of [['HUS_T3',53.3,-202.8],['HUS_T4',155.35,-202.8],['HUS_T5',187.07,-165.1],['HUS_T1',175.11,-102]]){
  const goal=await page.evaluate(([x,z])=>{const h=window.__hoitu,c=h.roomState().room.sourceCenter,p={x:1000+x-c[0],z:z-c[1]};h.walkToWorldPoint(p.x,p.z);return p;},[x,z]);
  assert((await page.evaluate(()=>window.__hoitu.walkingMetrics().route))>0,'Route to '+building);
  await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.2;},goal,{timeout:30000});await wait(200);
  const s=await page.evaluate(()=>window.__hoitu.roomState());assert.equal(s.section.building,building);assert.equal(s.room.model,root,'No extra map transition between connected buildings');
  await page.screenshot({path:out+'/'+building+'.png'});console.log('PASS continuous walk to',building);
 }
 assert.deepEqual(errors,[]);console.log('PASS T1 east -> T5 -> T4 -> T3, no map reload, correct location labels');
}finally{await browser.close();}
