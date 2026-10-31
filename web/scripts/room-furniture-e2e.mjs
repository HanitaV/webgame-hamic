import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {roomNavigation} from './check-room-furniture.mjs';
import {ready,wait} from './story-driver.mjs';
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const out='../output/furniture-capture';mkdirSync(out,{recursive:true});
const goLocal=async p=>{
 await page.evaluate(p=>{const h=window.__hoitu;h.walkToWorldPoint(1000+p.x,p.z);h.pauseWalk(false);},p);
 await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-1000-p.x,q.z-p.z)<.1;},p,{timeout:30000});
};
try{
 await page.goto(process.env.CAPTURE_URL ?? 'http://127.0.0.1:4173/');await ready(page);
 await page.evaluate(()=>{const h=window.__hoitu;h.storyProgress.set({introSeen:true});h.go('walk');});await page.locator('[data-dialogue-next]').click();
 for(const [building,kind] of [['HUS_T2','lab'],['HUS_T4','classroom'],['HUS_T5','server'],['HUS_T1','office']]){
  if(process.argv.length>2&&!process.argv.slice(2).includes(kind))continue;
  assert(await page.evaluate(async id=>{const h=window.__hoitu,b=h.data.map.buildings.find(b=>b.id===id);h.teleportToPoint(...b.entrance);return h.enterBuilding(id);},building));
  const portal=await page.evaluate(([building,kind])=>{const h=window.__hoitu,r=h.roomState().room;const p=r.rooms.find(p=>p.building===building&&p.type===kind);return {file:p.interiorFile,x:1000+p.approach[0]-r.sourceCenter[0],z:p.approach[1]-r.sourceCenter[1]};},[building,kind]);
  await page.evaluate(p=>window.__hoitu.walkToWorldPoint(p.x,p.z),portal);
  await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.15;},portal,{timeout:30000});await wait(150);
  if(kind==='office'){
   await page.waitForSelector('[data-office-closed]');
   assert.equal(await page.evaluate(file=>window.__hoitu.enterRoom(file),portal.file),false,'Existing closed-office access is preserved');
   await page.evaluate(()=>window.__hoitu.exitBuilding());console.log('PASS office access remains closed');continue;
  }
  await page.locator('[data-enter-room]').click();await page.locator('[data-confirm-space]').click();
  await page.waitForFunction(()=>window.__hoitu.roomState().activeRoom&&!window.__hoitu.roomState().loading);await wait(400);
  const room=await page.evaluate(()=>window.__hoitu.roomState().room);
  assert.equal(room.kind,kind);assert(room.furniture.length>0);assert(room.camera.follow);
  await page.screenshot({path:out+'/'+kind+'-entry.png'});
  const nav=roomNavigation(room),start={x:room.entry[0],z:room.entry[1]};
  for(const [x,z] of room.walkPoints)await goLocal({x,z});
  for(const type of [kind==='lab'?'lab-bench':'desk','chair']){
   let probe;
   for(const s of room.furniture.filter(s=>s.kind===type)){
    for(const [dx,dz,key] of [[1,0,'ArrowLeft'],[-1,0,'ArrowRight'],[0,1,'ArrowUp'],[0,-1,'ArrowDown']]){
     const x=dx?s[dx>0?'max':'min'][0]+dx*1.13:(s.min[0]+s.max[0])/2;
     const z=dz?s[dz>0?'max':'min'][2]+dz*1.13:(s.min[2]+s.max[2])/2;
     if(nav.allowed(x,z)&&nav.path(start,{x,z}).length){probe={s,x,z,dx,dz,key};break;}
    }
    if(probe)break;
   }
   assert(probe,kind+' has accessible '+type);
   await goLocal(probe);await page.keyboard.down(probe.key);await wait(650);await page.keyboard.up(probe.key);
   const p=await page.evaluate(()=>window.__hoitu.walkPosition()),{s,dx,dz}=probe;
   const distance=dx?(p.x-1000-s[dx>0?'max':'min'][0])*dx:(p.z-s[dz>0?'max':'min'][2])*dz;
   assert(distance>=.45&&distance<=.7,kind+' keyboard stops at '+type+' footprint, distance '+distance);
   const before={x:p.x,z:p.z};
   await page.evaluate(s=>window.__hoitu.walkToWorldPoint(1000+(s.min[0]+s.max[0])/2,(s.min[2]+s.max[2])/2),s);await wait(200);
   const after=await page.evaluate(()=>window.__hoitu.walkPosition());
   assert(Math.hypot(after.x-before.x,after.z-before.z)<.03,'Clicking inside '+type+' cannot cross it');
  }
  await page.screenshot({path:out+'/'+kind+'-furniture.png'});
  assert(await page.evaluate(()=>window.__hoitu.exitRoom()));await page.evaluate(()=>window.__hoitu.exitBuilding());
  console.log('PASS',kind,'larger map, connected aisles, physical desks/chairs, blocked click targets, return to corridor');
 }
 assert.deepEqual(errors,[]);
}catch(error){
 console.log('FAILED STATE',await page.evaluate(()=>({room:window.__hoitu.roomState(),position:window.__hoitu.walkPosition(),portal:document.querySelector('.walk-room-controls')?.outerHTML,dialog:document.querySelector('.walk-dialog')?.hidden})));
 await page.screenshot({path:out+'/failed.png'});throw error;
}finally{await browser.close();}
