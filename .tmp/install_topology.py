from pathlib import Path
p=Path('web/src/core/data.ts');s=p.read_text(encoding='utf-8').replace('  entrance?: [number, number];','  entrance?: [number, number];\n  entrances?: { id: string; position: [number, number]; side: string; width: number }[];');p.write_text(s,encoding='utf-8')
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8');s=s.replace('import { CampusCrowd }','import { Navigation } from "./navigation";\nimport { CampusCrowd }',1)
a=s.index('export function nearbyEntrance()');b=s.index('export async function enterBuilding',a)
s=s[:a]+'''export function nearbyEntrance() {
  if (!pos || activeBuilding || loadingRoom) return null;
  let nearest: MapBuilding | null = null, distance = .8;
  for (const b of data.buildings) for (const door of b.entrances ?? []) {
    const d = pos.distanceTo(point(...door.position));
    if (d < distance) { nearest = { ...b, entrance: door.position }; distance = d; }
  }
  return nearest;
}
'''+s[b:]
s=s.replace('const b = data.buildings.find(b => b.id === id);','const b = nearbyEntrance();\n  if (b?.id !== id) return false;',1)
s=s.replace('roomObstacles = loaded.obstacles;','roomObstacles = loaded.obstacles;\n    indoorNavigation = new Navigation(roomObstacles.map(o => ({...o,x:o.x+ROOM_ORIGIN})), .48, .5, {x0:ROOM_ORIGIN-room.width/2+.48,x1:ROOM_ORIGIN+room.width/2-.48,z0:-room.depth/2+.48,z1:room.depth/2-.48});',1)
a=s.index('function obstacles():');b=s.index('function move(delta:',a)
s=s[:a]+'''let outdoorNavigation: Navigation | null = null, indoorNavigation: Navigation | null = null;
export function installCampusCollision(source: { player_radius: number; solids: { id: string; min: number[]; max: number[] }[] }) {
  const walls = source.solids.filter(s => s.max[1] > .2 && s.min[1] < 1.7).map(s => ({
    x: point((s.min[0]+s.max[0])/2,0).x, z: point(0,(s.min[2]+s.max[2])/2).z,
    w:(s.max[0]-s.min[0])*data.scale,d:(s.max[2]-s.min[2])*data.scale
  }));
  outdoorNavigation = new Navigation(walls, source.player_radius*data.scale, .06, {
    x0:point(-245,0).x,x1:point(245,0).x,z0:point(0,-240).z,z1:point(0,25).z
  });
}
function navigation() { return activeBuilding ? indoorNavigation : outdoorNavigation; }
function allowed(p: THREE.Vector3) { return navigation()?.allowed(p.x,p.z) ?? false; }
function clearSegment(a: THREE.Vector3,b: THREE.Vector3) { return navigation()?.clear(a,b) ?? false; }
function outdoorRoute(start: THREE.Vector3,target: THREE.Vector3) {
  return (navigation()?.path(start,target) ?? []).map(p=>new THREE.Vector3(p.x,0,p.z));
}
'''+s[b:]
s=s.replace('if (allowed(target) && clearSegment(pos, target)) route = [target];','if (allowed(target)) route = outdoorRoute(pos, target);')
s=s.replace('Math.ceil(delta.length() / .08)','Math.ceil(delta.length() / (activeBuilding ? .15 : .025))')
p.write_text(s,encoding='utf-8')
