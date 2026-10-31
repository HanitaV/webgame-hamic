from pathlib import Path
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8')
s=s.replace('let data: MapData;', '''import type { RoomData, Obstacle } from "./interiors";
import { ROOM_ORIGIN } from "./interiors";
let activeBuilding: MapBuilding | null = null;
let room: RoomData | null = null;
let roomObstacles: Obstacle[] = [];
let loadingRoom = false;
let roomError = false;
let transitionVersion = 0;
let loadRoom: (b: MapBuilding) => Promise<{ data: RoomData; obstacles: Obstacle[] }>;
let returnPosition: THREE.Vector3 | null = null;
export function roomState() { return { building: activeBuilding, room, loading: loadingRoom, error: roomError }; }
export function nearbyEntrance() {
  if (!pos || activeBuilding || loadingRoom) return null;
  return data.buildings.find(b => b.entrance && pos!.distanceTo(point(...b.entrance)) < 1.1) ?? null;
}
export async function enterBuilding(id: string) {
  const b = data.buildings.find(b => b.id === id);
  if (!b?.enterable || !b.entrance || !pos || activeBuilding || loadingRoom) return false;
  if (pos.distanceTo(point(...b.entrance)) > 1.1) return false;
  loadingRoom = true; roomError = false; route = []; axis.set(0, 0);
  const version = ++transitionVersion;
  try {
    const loaded = await loadRoom(b);
    if (version !== transitionVersion || !enabled) return false;
    returnPosition = point(...b.entrance); activeBuilding = b; room = loaded.data; roomObstacles = loaded.obstacles;
    pos.set(ROOM_ORIGIN + room.entry[0], 0, room.entry[1]); player.position.copy(pos);
    return true;
  } catch { if (version === transitionVersion) roomError = true; return false; }
  finally { if (version === transitionVersion) loadingRoom = false; }
}
export function exitBuilding() {
  transitionVersion++; loadingRoom = false;
  if (returnPosition && pos) { pos.copy(returnPosition); player.position.copy(pos); }
  activeBuilding = null; room = null; roomObstacles = []; route = []; axis.set(0, 0);
}
let data: MapData;''')
s=s.replace('label: (text: string) => THREE.Sprite) {','label: (text: string) => THREE.Sprite, loader: typeof loadRoom) {\n  loadRoom = loader;')
s=s.replace('  enabled = on; group.visible', '  if (!on) exitBuilding();\n  enabled = on; group.visible')
s=s.replace('  pos = nodes.get(data.walk.spawn)!.clone();','  exitBuilding();\n  pos = nodes.get(data.walk.spawn)!.clone();')
s=s.replace('  const n = nodes.get(id); if (!n) return;','  exitBuilding();\n  const n = nodes.get(id); if (!n) return;')
s=s.replace('  if (!point) return;\n  pos = point','  if (!point) return;\n  exitBuilding();\n  pos = point')
a=s.index('  if (!p || !data) return null;',s.index('export function buildingAtPosition'));b=s.index('\n}\nexport function setFoundEggs',a)
s=s[:a]+'  return activeBuilding;'+s[b:]
s=s.replace('  return !!pos && index >= 0 && pos.distanceTo(eggActors[index].position)', '  return !!pos && index >= 0 && eggActors[index].visible && pos.distanceTo(eggActors[index].position)')
s=s.replace('export function nearNode(id: string) { return !!pos', 'export function nearNode(id: string) { return !activeBuilding && !!pos')
s=s.replace('  return !!pos && index >= 0 && pos.distanceTo(actors[index].position)', '  return !activeBuilding && !!pos && index >= 0 && pos.distanceTo(actors[index].position)')
s=s.replace('visible: projected.z >= -1', 'visible: !activeBuilding && projected.z >= -1')
a=s.index('  if (!pos) return;',s.index('export function walkTo(id:'));b=s.index('\n}\n',a)
s=s[:a]+'''  if (!pos || activeBuilding) return;
  const target = nodes.get(id); if (target) route = outdoorRoute(pos, target);'''+s[b:]
s=s.replace('  const cx = Math.max', '  if (activeBuilding) return;\n  const cx = Math.max')
s=s.replace('if (allowed(target)) route = [target];','if (allowed(target)) route = outdoorRoute(pos, target);')
a=s.index('function allowed(p:');b=s.index('export function updateWalking',a)
s=s[:a]+'''function obstacles(): Obstacle[] {
  if (activeBuilding) return roomObstacles.map(o => ({ ...o, x: o.x + ROOM_ORIGIN }));
  return data.buildings.filter(b => b.w && b.d).map(b => ({ x: point(b.x, b.z).x, z: point(b.x, b.z).z, w: b.w! * data.scale, d: b.d! * data.scale }));
}
const radius = .17;
function allowed(p: THREE.Vector3) {
  if (activeBuilding && room) {
    if (Math.abs(p.x - ROOM_ORIGIN) > room.width / 2 - radius || Math.abs(p.z) > room.depth / 2 - radius) return false;
  } else {
    const mx = p.x / data.scale + data.origin[0], mz = p.z / data.scale + data.origin[1];
    if (mx < -245 || mx > 245 || mz < -240 || mz > 25) return false;
  }
  return !obstacles().some(b => Math.abs(p.x - b.x) < b.w / 2 + radius && Math.abs(p.z - b.z) < b.d / 2 + radius);
}
function clearSegment(a: THREE.Vector3, b: THREE.Vector3) {
  const steps = Math.ceil(a.distanceTo(b) / .08);
  for (let i = 1; i <= steps; i++) if (!allowed(a.clone().lerp(b, i / steps))) return false;
  return true;
}
/** Visibility graph around expanded footprints: clicks and quest walking use the same collision. */
function outdoorRoute(start: THREE.Vector3, target: THREE.Vector3) {
  if (!allowed(target)) return [];
  if (clearSegment(start, target)) return [target.clone()];
  const vertices = [start.clone(), target.clone()];
  for (const o of obstacles()) for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    const v = new THREE.Vector3(o.x + dx * (o.w / 2 + radius + .04), 0, o.z + dz * (o.d / 2 + radius + .04));
    if (allowed(v)) vertices.push(v);
  }
  const distance = vertices.map(() => Infinity), previous = vertices.map(() => -1), open = new Set(vertices.map((_, i) => i)); distance[0] = 0;
  while (open.size) {
    const a = [...open].sort((i, j) => distance[i] - distance[j])[0]; open.delete(a);
    if (!Number.isFinite(distance[a]) || a === 1) break;
    for (const b of open) {
      const cost = distance[a] + vertices[a].distanceTo(vertices[b]);
      if (cost < distance[b] && clearSegment(vertices[a], vertices[b])) { distance[b] = cost; previous[b] = a; }
    }
  }
  if (!Number.isFinite(distance[1])) return [];
  const path = [vertices[1]]; let i = 1;
  while (previous[i] > 0) { i = previous[i]; path.unshift(vertices[i]); }
  return path;
}
function move(delta: THREE.Vector3) {
  const steps = Math.max(1, Math.ceil(delta.length() / .08)); delta.multiplyScalar(1 / steps);
  for (let i = 0; i < steps; i++) {
    const next = pos!.clone(); next.x += delta.x; if (allowed(next)) pos!.x = next.x;
    next.copy(pos!); next.z += delta.z; if (allowed(next)) pos!.z = next.z;
  }
}
''' +s[b:]
s=s.replace('  if (!paused) {','  if (!paused && !loadingRoom) {')
s=s.replace('      const next = pos.clone().add(new THREE.Vector3(step.x, 0, step.y));\n      if (allowed(next)) pos.copy(next);', '      move(new THREE.Vector3(step.x, 0, step.y));')
s=s.replace('      if (d <= dt * speed) { pos.copy(route.shift()!); } else pos.lerp(route[0], dt * speed / d);','      move(route[0].clone().sub(pos).multiplyScalar(Math.min(1, dt * speed / Math.max(d, .00001))));\n      if (pos.distanceTo(route[0]) < .03) route.shift();\n      else if (pos.distanceToSquared(before) < .000001) route = [];')
s=s.replace('  actors.forEach((a, i) => {','  actors.forEach((a, i) => {\n    a.visible = !activeBuilding;')
s=s.replace('    nameTags[i].visible = pos!', '    nameTags[i].visible = !activeBuilding && pos!')
s=s.replace('  eggActors.forEach((ea, i) => {','''  marker.visible = !activeBuilding;
  eggActors.forEach((ea, i) => {
    const egg = data.walk.easterEggs![i];
    ea.visible = activeBuilding ? egg.building === activeBuilding.id : !egg.building;
    if (activeBuilding && room && ea.visible) ea.position.set(ROOM_ORIGIN + room.exhibit[0], 0, room.exhibit[1]);
    else if (!activeBuilding) ea.position.copy(point(egg.x, egg.z));
    eggTags[i].position.copy(ea.position).y = .5;''')
s=s.replace('    eggTags[i].visible = pos!', '    eggTags[i].visible = ea.visible && pos!')
p.write_text(s,encoding='utf-8')
