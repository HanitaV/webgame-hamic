import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { frameRoom } from '../src/scene/room-camera.ts';

let checks=0;
for(const file of readdirSync('public/data/interiors/rooms')) {
  const room=JSON.parse(readFileSync('public/data/interiors/rooms/'+file,'utf8'));
  for(const [width,height] of [[844,390],[1280,800],[390,844]]) {
    const camera=new PerspectiveCamera(40,width/height,.1,500), target=new Vector3();
    frameRoom(room.clipRect,room.sourceCenter,1000,camera.fov,camera.aspect,height,camera.position,target);
    camera.lookAt(target);camera.updateMatrixWorld();
    const [x0,z0,x1,z1]=room.clipRect,[cx,cz]=room.sourceCenter;
    const top=1-2*Math.min(150,height*.4)/height,bottom=-1+2*Math.min(38,height*.1)/height;
    for(const x of [x0,x1])for(const y of [0,1.5])for(const z of [z0,z1]) {
      const p=new Vector3(1000+x-cx,y,z-cz).project(camera);
      assert(Math.abs(p.x)<.91&&p.y>=bottom-.001&&p.y<=top+.001,`${file} fits ${width}×${height}`);
      assert(p.z>-1&&p.z<1,'Room stays within the camera depth range');checks++;
    }
  }
}
console.log('PASS',checks,'room corners fit the visible viewport below the HUD');
