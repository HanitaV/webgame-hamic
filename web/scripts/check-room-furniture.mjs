import {readFileSync,readdirSync} from 'node:fs';
import {registerHooks,stripTypeScriptTypes} from 'node:module';
import assert from 'node:assert/strict';
const hooks=registerHooks({load(url,context,next){
 if(!url.startsWith('file:')||!url.endsWith('.ts'))return next(url,context);
 return {format:'module',source:stripTypeScriptTypes(readFileSync(new URL(url),'utf8'),{mode:'transform',sourceUrl:url}),shortCircuit:true};
}});
export const {Navigation}=await import('../src/scene/navigation.ts');hooks.deregister();
export function roomNavigation(room){
 const [cx,cz]=room.sourceCenter;
 const walls=room.solids.map(s=>({x:(s.min[0]+s.max[0])/2-cx,z:(s.min[2]+s.max[2])/2-cz,w:s.max[0]-s.min[0],d:s.max[2]-s.min[2]}));
 return new Navigation(walls,.48,.5,{x0:-room.width/2+.48,x1:room.width/2-.48,z0:-room.depth/2+.48,z1:room.depth/2-.48},room.regions.map(r=>({x0:r[0]-cx,z0:r[1]-cz,x1:r[2]-cx,z1:r[3]-cz})));
}
const folder=new URL('../public/data/interiors/rooms/',import.meta.url);
let count=0;const kinds=new Set();
for(const file of readdirSync(folder)){
 if(!file.endsWith('.json'))continue;
 const room=JSON.parse(readFileSync(new URL(file,folder),'utf8'));
 const rect=room.clipRect,old=room.sourceRoomRect,nav=roomNavigation(room),start={x:room.entry[0],z:room.entry[1]};
 assert((rect[2]-rect[0])*(rect[3]-rect[1])>(old[2]-old[0])*(old[3]-old[1]),file+' is larger than the corridor footprint');
 assert(room.furniture.length>0,file+' has solid furniture');
 assert(nav.allowed(start.x,start.z),file+' entry is clear');
 for(const [x,z] of room.walkPoints)assert(nav.path(start,{x,z}).length,file+' has a path to '+[x,z]);
 for(const s of room.furniture){
  const target={x:(s.min[0]+s.max[0])/2,z:(s.min[2]+s.max[2])/2};
  assert(!nav.allowed(target.x,target.z),file+' blocks '+s.kind);
  assert.equal(nav.path(start,target).length,0,file+' does not route through '+s.kind);
 }
 kinds.add(room.kind);count++;
}
assert(count>=101);
const templates=JSON.parse(readFileSync(new URL('../../legacy/campus/data/room_templates.json',import.meta.url),'utf8'));
for(const [kind,room] of Object.entries(templates)){
 const nav=roomNavigation(room),start={x:room.entry[0],z:room.entry[1]};
 assert(nav.allowed(start.x,start.z),kind+' template entry is clear');
 for(const [x,z] of room.walkPoints)assert(nav.path(start,{x,z}).length,kind+' template has a path to '+[x,z]);
}
console.log('PASS',count,'larger room maps:',[...kinds].join(', '),'; entries, aisles, desks/chairs/equipment collision and blocked click targets');
