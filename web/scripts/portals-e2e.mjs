import { chromium } from 'playwright';
import { ready, wait } from './story-driver.mjs';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=d3d11','--ignore-gpu-blocklist','--enable-gpu-rasterization']});
const page=await browser.newPage({viewport:{width:844,height:390},serviceWorkers:'block'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const out='../output/portals-capture';mkdirSync(out,{recursive:true});
const state=()=>page.evaluate(()=>window.__hoitu.roomState());
const confirm=async selector=>{await page.locator(selector).click();await page.locator('[data-confirm-space]').click();await page.waitForFunction(()=>!window.__hoitu.roomState().loading);await wait(200);};
try{
 await page.goto(process.env.CAPTURE_URL ?? 'http://127.0.0.1:4173/');await ready(page);
 await page.evaluate(()=>{const h=window.__hoitu;h.storyProgress.set({introSeen:true});h.go('walk');});await page.locator('[data-dialogue-next]').click();
 for(const [name,from,to] of [['T1',-64,-95],['T2',-95,-124]]){
  await page.evaluate(([from,to])=>{const h=window.__hoitu;h.teleportToPoint(106.6,from);h.pauseWalk(false);h.walkToPoint(106.6,to);},[from,to]);
  assert((await page.evaluate(()=>window.__hoitu.walkingMetrics())).route>0,name+' through passage remains open');
  await page.waitForFunction(to=>{const h=window.__hoitu,p=h.walkPosition(),m=h.data.map;return p.z/m.scale+m.origin[1]<to+1;},to,{timeout:12000});
  assert.equal((await state()).building,null,name+' passage stays on the campus map');
  await page.screenshot({path:`${out}/${name}-passage.png`});
 }
 // Verify outdoor player cannot walk or click through HUS_CANTEEN from any direction.
 for(const [sx,sz,ax,az] of [[50.2,-167.18,-1,0],[29.0,-167.18,1,0],[39.2,-193.0,0,1],[39.2,-141.5,0,-1]]){
  await page.evaluate(([sx,sz])=>{const h=window.__hoitu;h.teleportToPoint(sx,sz);h.pauseWalk(false);h.walkToPoint(39.195,-167.245);},[sx,sz]);
  assert.equal((await page.evaluate(()=>window.__hoitu.walkingMetrics())).route,0,'Click inside HUS_CANTEEN from outdoors is blocked');
  await page.evaluate(([ax,az])=>window.__hoitu.walkAxis(ax,az),[ax,az]);await wait(900);
  await page.evaluate(()=>window.__hoitu.walkAxis(0,0));
  const mpos=await page.evaluate(()=>{const h=window.__hoitu,p=h.walkPosition(),m=h.data.map;return [p.x/m.scale+m.origin[0],p.z/m.scale+m.origin[1]];});
  const insideFootprint=mpos[0]>30.55 && mpos[0]<47.84 && mpos[1]>-191.36 && mpos[1]<-143.13;
  assert(!insideFootprint,`Outdoor movement blocked at HUS_CANTEEN boundary (ended at ${mpos[0].toFixed(2)}, ${mpos[1].toFixed(2)})`);
 }
 const buildings=await page.evaluate(()=>window.__hoitu.data.map.buildings.filter(b=>b.enterable));
 let tested=0;
 for(const b of buildings){
  for(const entrance of b.entrances){
   await page.evaluate(p=>{const h=window.__hoitu;h.teleportToPoint(...p);h.pauseWalk(false);},entrance.position);await wait(200);
   if(b.id==='HUS_CANTEEN')await page.screenshot({path:`${out}/HUS_CANTEEN-outside.png`});
   await page.locator('[data-enter-building]').click();
   assert.equal((await state()).building,null,'Opening confirmation does not change maps');
   await page.locator('[data-cancel-space]').click();
   assert.equal((await state()).building,null,'Cancel stays outdoors');
   await confirm('[data-enter-building]');assert.equal((await state()).building.id,b.id);
   const s=await state();
   if(s.room.kind==='hall' && s.room.rooms.length===0){
    assert((s.room.furniture?.length??0)>=50,b.id+' hall has authored furniture colliders');
    await page.screenshot({path:`${out}/${b.id}-interior.png`});
    const [cx,cz]=s.room.sourceCenter;
    // Walk through north and south dining aisles using real indoor navigation.
    for(const [label,mx,mz] of [['north-aisle',36.8,-177.8],['south-aisle',36.8,-156.6],['east-aisle',45.9,-175.4]]){
     const target={x:1000+mx-cx,z:mz-cz};
     await page.evaluate(p=>{window.__hoitu.walkToWorldPoint(p.x,p.z);window.__hoitu.pauseWalk(false);},target);
     assert((await page.evaluate(()=>window.__hoitu.walkingMetrics())).route>0,b.id+' '+label+' is reachable');
     await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.25;},target,{timeout:20000});
    }
    await page.screenshot({path:`${out}/${b.id}-dining.png`});
    // Push directly toward hot counter (-x) and dining table (+x) from north-aisle (36.8, -177.8) and verify colliders stop penetration.
    const aisleTarget={x:1000+36.8-cx,z:-177.8-cz};
    await page.evaluate(p=>{window.__hoitu.walkToWorldPoint(p.x,p.z);window.__hoitu.pauseWalk(false);},aisleTarget);
    await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.25;},aisleTarget,{timeout:15000});
    await page.evaluate(()=>window.__hoitu.walkAxis(-1,0));await wait(800);await page.evaluate(()=>window.__hoitu.walkAxis(0,0));
    const afterCounter=await page.evaluate(([cx])=>window.__hoitu.walkPosition().x-1000+cx,[cx]);
    assert(afterCounter>35.45,`Hot counter blocks player inside ${b.id} (x=${afterCounter.toFixed(2)})`);
    await page.evaluate(()=>window.__hoitu.walkAxis(1,0));await wait(800);await page.evaluate(()=>window.__hoitu.walkAxis(0,0));
    const afterTable=await page.evaluate(([cx])=>window.__hoitu.walkPosition().x-1000+cx,[cx]);
    assert(afterTable<38.10,`Dining table blocks player inside ${b.id} (x=${afterTable.toFixed(2)})`);
    await confirm('[data-exit-building]');assert.equal((await state()).building,null);
    tested++;console.log('PASS',b.id,entrance.id,s.room.furniture.length,'furniture colliders, outdoor & indoor barriers verified');
    continue;
   }
   assert(s.room.rooms.length>0,'Corridor has authored rooms');
   if(s.room.passage)assert(s.room.rooms.every(r=>entrance.zone==='west'?r.rect[2]<=s.room.passage[0]+.01:r.rect[0]>=s.room.passage[2]-.01),b.id+' selected side excludes the central passage');
   const rooms=s.room.rooms;
   assert.equal(new Set(rooms.map(r=>r.interiorFile)).size,rooms.length,'Each room has a unique map including repeated WC numbers');
   // Validate every room approach from this entrance using the real navigation grid.
   await page.evaluate(()=>window.__hoitu.pauseWalk(true));
   let reachable=[];
   for(const r of rooms){
    const target={x:1000+r.approach[0]-s.room.sourceCenter[0],z:r.approach[1]-s.room.sourceCenter[1]};
    await page.evaluate(p=>window.__hoitu.walkToWorldPoint(p.x,p.z),target);
    const route=await page.evaluate(()=>window.__hoitu.walkingMetrics().route);
    if(route>0)reachable.push({r,target});
   }
   assert.equal(reachable.length,rooms.length,b.id+' connects every room through authored corridors');
   const local=reachable.filter(({r})=>r.building===b.id || r.building.startsWith(b.id+'_'));
   const {r,target}=local.find(x=>x.r.type!=="office")??local[0]??reachable[0];await page.evaluate(p=>{window.__hoitu.walkToWorldPoint(p.x,p.z);window.__hoitu.pauseWalk(false);},target);
   await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.2;},target,{timeout:30000});await wait(200);
   assert(await page.locator('[data-enter-room]').count(),'Door action appears');
   if(b.id==='HUS_T1')await page.screenshot({path:`${out}/${entrance.zone}-corridor.png`});
   const before=await page.evaluate(()=>window.__hoitu.walkPosition());
   if(tested===0){
    await page.route('**/'+r.interiorFile,route=>route.fulfill({status:503,body:'unavailable'}));
    await confirm('[data-enter-room]');
    assert((await state()).error,'Load error is reported');assert.equal((await state()).activeRoom,null,'Failed room load preserves corridor');
    await page.unroute('**/'+r.interiorFile);
   }
   await confirm('[data-enter-room]');assert((await state()).activeRoom,'Room loads after confirmation');
   assert((await state()).room.selectedRoom,'Room has an independent map');
   await page.screenshot({path:`${out}/${b.id}-${entrance.id}-room.png`});
   await confirm('[data-exit-room]');assert.equal((await state()).activeRoom,null);
   const after=await page.evaluate(()=>window.__hoitu.walkPosition());assert(Math.hypot(before.x-after.x,before.z-after.z)<.01,'Back to same corridor door');
   await confirm('[data-exit-building]');assert.equal((await state()).building,null);
   tested++;console.log('PASS',b.id,entrance.id,reachable.length+'/'+rooms.length,'reachable rooms',r.num);
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS',tested,'entrances: confirm/cancel, T1 wings, corridors, canteen hall, room maps, return paths.');
}finally{await browser.close();}
