from pathlib import Path
p=Path('web/src/scene/navigation.ts');s=p.read_text(encoding='utf-8-sig').replace('private bounds: Bounds) {','private bounds: Bounds, private regions?: Bounds[]) {').replace('return x>=b.x0 && x<=b.x1 && z>=b.z0 && z<=b.z1 && !','return x>=b.x0 && x<=b.x1 && z>=b.z0 && z<=b.z1 && (!this.regions || this.regions.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)) && !');p.write_text(s,encoding='utf-8')
p=Path('web/src/scene/interiors.ts');s=p.read_text(encoding='utf-8-sig').replace('sourceCenter?: [number, number]; solids?', 'sourceCenter?: [number, number]; regions?: number[][]; solids?')
s=s.replace('  const data = { ...source, entry: [b.entrance[0]-cx,b.entrance[1]-cz] as [number,number] };','''  const door = source.entrances?.find(d => Math.hypot(d.position[0]-b.entrance![0],d.position[1]-b.entrance![1]) < .01);
  const side = door?.side ?? "+z", inward = side.startsWith("+") ? -2.5 : 2.5;
  const data = { ...source, entry: [b.entrance[0]-cx+(side.endsWith("x")?inward:0),b.entrance[1]-cz+(side.endsWith("z")?inward:0)] as [number,number] };
  data.exhibit = [data.entry[0]+.9,data.entry[1]];''')
s=s.replace('side:THREE.DoubleSide','side:THREE.DoubleSide,clippingPlanes:[new THREE.Plane(new THREE.Vector3(0,-1,0),1.5)]')
p.write_text(s,encoding='utf-8')
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8').replace('z0:-room.depth/2+.48,z1:room.depth/2-.48});','z0:-room.depth/2+.48,z1:room.depth/2-.48}, room.regions?.map(r=>({x0:ROOM_ORIGIN+r[0]-room!.sourceCenter![0],z0:r[1]-room!.sourceCenter![1],x1:ROOM_ORIGIN+r[2]-room!.sourceCenter![0],z1:r[3]-room!.sourceCenter![1]})));')
p.write_text(s,encoding='utf-8')
p=Path('web/src/scene/world.ts');s=p.read_text(encoding='utf-8').replace('  renderer.outputColorSpace = THREE.SRGBColorSpace;','  renderer.localClippingEnabled = true;\n  renderer.outputColorSpace = THREE.SRGBColorSpace;',1);p.write_text(s,encoding='utf-8')
p=Path('web/src/ui/story/minimap.ts');s=p.read_text(encoding='utf-8');a=s.index('    const building = m.buildings.find',s.index('canvas.addEventListener'));b=s.index('    waypoint = ',a)
s=s[:a]+'''    const door = m.buildings.flatMap(b=>b.entrances ?? []).sort((a,b)=>Math.hypot(px(a.position[0])-x,pz(a.position[1])-y)-Math.hypot(px(b.position[0])-x,pz(b.position[1])-y))[0];
    if (door && Math.hypot(px(door.position[0])-x,pz(door.position[1])-y)<5) [mx,mz]=door.position;
'''+s[b:];p.write_text(s,encoding='utf-8')
