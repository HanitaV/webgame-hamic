import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {registerHooks,stripTypeScriptTypes} from 'node:module';
const hooks=registerHooks({load(url,context,next){
 if(!url.startsWith('file:') || !url.endsWith('.ts'))return next(url,context);
 return {format:'module',source:stripTypeScriptTypes(readFileSync(new URL(url),'utf8'),{mode:'transform',sourceUrl:url}),shortCircuit:true};
}});
const {Navigation}=await import('../src/scene/navigation.ts');hooks.deregister();
const read=file=>JSON.parse(readFileSync(new URL('../public/data/'+file,import.meta.url),'utf8'));
const map=read('map.json'),floor=read('interiors/east-network.json');
const walls=floor.solids.map(s=>({x:(s.min[0]+s.max[0])/2,z:(s.min[2]+s.max[2])/2,w:s.max[0]-s.min[0],d:s.max[2]-s.min[2]}));
for(const {rect:r} of floor.rooms)walls.push({x:(r[0]+r[2])/2,z:(r[1]+r[3])/2,w:r[2]-r[0],d:r[3]-r[1]});
const rs=floor.regions, bounds={x0:floor.sourceCenter[0]-floor.width/2+.48,x1:floor.sourceCenter[0]+floor.width/2-.48,z0:floor.sourceCenter[1]-floor.depth/2+.48,z1:floor.sourceCenter[1]+floor.depth/2-.48};
const nav=new Navigation(walls,.48,.5,bounds,rs.map(r=>({x0:r[0],z0:r[1],x1:r[2],z1:r[3]})));
const start={x:119.8,z:-72.35};
assert.equal(floor.junctions?.length,3,'All three shared hall junctions are authored');
for(const j of floor.junctions){
 const [x,z]=j.center;
 const a={x:x+(j.axis==='x'?-3:0),z:z+(j.axis==='z'?-3:0)};
 const b={x:x+(j.axis==='x'?3:0),z:z+(j.axis==='z'?3:0)};
 assert(nav.clear(a,b),j.id+' is straight and free of wall/stair obstructions');
 console.log('PASS continuous junction',j.id);
}
assert(nav.allowed(start.x,start.z),'T1 east entrance is clear');
for(const building of ['HUS_T1','HUS_T1_E','HUS_T5','HUS_T4','HUS_T3']){
 const rooms=floor.rooms.filter(r=>r.building===building);
 assert(rooms.length>0,building+' has rooms');
 for(const r of rooms){const target={x:r.approach[0],z:r.approach[1]};assert(nav.path(start,target).length,building+' room '+r.num+' connects to T1 east');}
 console.log('PASS',building,rooms.length,'room doors connected to T1 east');
}
for(const id of ['HUS_T1','HUS_T2']){
 const b=map.buildings.find(b=>b.id===id),d=read(b.interiorFile.replace('data/',''));
 assert(d.passage,id+' has a central passage');
 const x=(d.passage[0]+d.passage[2])/2;
 assert(!b.entryBarriers.some(r=>x>=r[0]&&x<=r[2]),id+' central axis is not blocked');
 assert.deepEqual(b.entrances.map(d=>d.zone),['west','east']);
}
console.log('PASS T1/T2 central passages and side entrances');
for(const d of floor.entrances){
 const inward=d.side.startsWith('+')?-2.5:2.5;
 const p={x:d.position[0]+(d.side.endsWith('x')?inward:0),z:d.position[1]+(d.side.endsWith('z')?inward:0)};
 const missing=floor.rooms.filter(r=>!nav.path(p,{x:r.approach[0],z:r.approach[1]}).length);
 assert.deepEqual(missing.map(r=>r.building+' '+r.num),[],d.id+' reaches every connected room');
 console.log('PASS entrance',d.id);
}
