import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const out='../output/nearest-exit';mkdirSync(out,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function enter(id,zone){
  assert(await page.evaluate(async ({id,zone})=>{
    const h=window.__hoitu,b=h.data.map.buildings.find(b=>b.id===id),door=zone?b.entrances.find(d=>d.zone===zone):b.entrances[0];
    h.teleportToPoint(...door.position);h.pauseWalk(false);return h.enterBuilding(id);
  },{id,zone}));await wait(200);
}
async function walk(x,z){
  const p=await page.evaluate(([x,z])=>{const h=window.__hoitu,c=h.roomState().room.sourceCenter,p={x:1000+x-c[0],z:z-c[1]};h.walkToWorldPoint(p.x,p.z);return p;},[x,z]);
  await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.2;},p,{timeout:60000});await wait(200);
}
async function leave(expectedBuilding,zone,ui=true,expectedPosition){
  const expected=expectedPosition??await page.evaluate(({id,zone})=>{
    const h=window.__hoitu,b=h.data.map.buildings.find(b=>b.id===id),p=h.walkPosition(),f=h.roomState().room;
    const mx=p.x-1000+f.sourceCenter[0],mz=p.z+f.sourceCenter[1];
    return b.entrances.filter(d=>!zone||d.zone===zone).sort((a,b)=>Math.hypot(a.position[0]-mx,a.position[1]-mz)-Math.hypot(b.position[0]-mx,b.position[1]-mz))[0].position;
  },{id:expectedBuilding,zone});
  if(ui){await page.locator('[data-exit-building]').click();await page.locator('[data-confirm-space]').click();}
  else await page.evaluate(()=>window.__hoitu.exitBuilding());
  await page.waitForFunction(()=>!window.__hoitu.roomState().building);await wait(300);
  const p=await page.evaluate(()=>{const h=window.__hoitu,p=h.walkPosition(),m=h.data.map;return [p.x/m.scale+m.origin[0],p.z/m.scale+m.origin[1]];});
  assert(Math.hypot(p[0]-expected[0],p[1]-expected[1])<.01,'Exits at nearest '+expectedBuilding+' entrance');
  await page.screenshot({path:out+'/'+expectedBuilding+(zone??'')+'.png'});
  console.log('PASS nearest exit',expectedBuilding,expected);
}
try{
  await page.goto(process.env.CAPTURE_URL??'http://127.0.0.1:4173/');await page.waitForFunction(()=>window.__hoitu?.ready,null,{timeout:120000});
  await page.evaluate(()=>{const h=window.__hoitu;h.storyProgress.set({introSeen:true});h.go('walk');});await page.locator('[data-dialogue-next]').click();
  await enter('HUS_T1','east');await walk(187.07,-165.1);await leave('HUS_T5');
  await enter('HUS_T5');await walk(101.27,-202.8);await leave('HUS_T3');
  // Same building, different entrance: returning to the original door is incorrect.
  await enter('HUS_T5');await walk(187.07,-126.1);await leave('HUS_T5');
  await enter('HUS_T2','west');await leave('HUS_T2','west');
  await enter('HUS_T2','east');await leave('HUS_T2','east');
  await enter('HUS_T1','west');await leave('HUS_T1','west');
  await enter('HUS_T5');
  const r=await page.evaluate(()=>{const h=window.__hoitu,s=h.roomState(),c=s.room.sourceCenter,p=h.walkPosition();return s.room.rooms.filter(r=>r.type==='classroom'&&r.building==='HUS_T5').sort((a,b)=>Math.hypot(1000+a.approach[0]-c[0]-p.x,a.approach[1]-c[1]-p.z)-Math.hypot(1000+b.approach[0]-c[0]-p.x,b.approach[1]-c[1]-p.z))[0];});
  await walk(...r.approach);
  const beforeRoomExit=await page.evaluate(()=>{
    const h=window.__hoitu,s=h.roomState(),p=h.walkPosition(),c=s.room.sourceCenter,x=p.x-1000+c[0],z=p.z+c[1];
    return h.data.map.buildings.find(b=>b.id==='HUS_T5').entrances.slice().sort((a,b)=>Math.hypot(a.position[0]-x,a.position[1]-z)-Math.hypot(b.position[0]-x,b.position[1]-z))[0].position;
  });
  assert(await page.evaluate(f=>window.__hoitu.enterRoom(f),r.interiorFile));
  await leave('HUS_T5',undefined,false,beforeRoomExit);
  await page.evaluate(()=>{const h=window.__hoitu;h.teleportToPoint(106.6,-64);h.exitBuilding();});
  const p=await page.evaluate(()=>{const h=window.__hoitu,p=h.walkPosition(),m=h.data.map;return [p.x/m.scale+m.origin[0],p.z/m.scale+m.origin[1]];});
  assert(Math.hypot(p[0]-106.6,p[1]+64)<.01,'Calling exit outdoors keeps current position');
  assert.deepEqual(errors,[]);console.log('PASS mapping, connected-building exits, isolated wing, room fallback, repeated exit');
}finally{await browser.close();}
