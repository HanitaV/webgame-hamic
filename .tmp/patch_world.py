from pathlib import Path
p=Path('web/src/scene/world.ts');s=p.read_text(encoding='utf-8').replace('requestEasterEggInteraction }','requestEasterEggInteraction, roomState }')
s=s.replace('let interiorGroup: THREE.Group | null = null;\nconst interiorBanners = new Map<string, THREE.Sprite>();','''let loadedRoom: ReturnType<typeof import("./interiors").buildRoom> | null = null;
const hiddenOutside = new Map<THREE.Object3D, boolean>();''')
s=s.replace('  buildBuildingInteriors();','')
a=s.index('/** Tạo mặt bảng');b=s.index('async function loadCampus',a);s=s[:a]+s[b:]
s=s.replace('initWalking(scene, map, P, (text) => labelSprite(text, { size: .8 }));','''initWalking(scene, map, P, (text) => labelSprite(text, { size: .8 }), async b => {
    if (!b.enterable || !b.interiorFile) throw new Error("Exterior only");
    const [module, response] = await Promise.all([import("./interiors"), fetch(`${import.meta.env.BASE_URL}${b.interiorFile}`)]);
    if (!response.ok) throw new Error(`Room HTTP ${response.status}`);
    const roomData = await response.json();
    loadedRoom?.dispose();
    loadedRoom = module.buildRoom(b, roomData); loadedRoom.root.visible = false; scene.add(loadedRoom.root);
    return { data: loadedRoom.data, obstacles: loadedRoom.obstacles };
  });''')
s=s.replace('  currentInsideBuilding = inside?.id ?? null;','''  const changedSpace = currentInsideBuilding !== (inside?.id ?? null);
  currentInsideBuilding = inside?.id ?? null;
  if (inside) {
    for (const obj of scene.children) {
      if ((obj as THREE.Light).isLight || obj.name === "walking" || obj === loadedRoom?.root) continue;
      if (!hiddenOutside.has(obj)) hiddenOutside.set(obj, obj.visible);
      obj.visible = false;
    }
    if (loadedRoom) loadedRoom.root.visible = true;
  } else {
    for (const [obj, visible] of hiddenOutside) obj.visible = visible;
    hiddenOutside.clear();
    if (loadedRoom) { loadedRoom.dispose(); loadedRoom = null; }
  }''')
s=s.replace('  for (const [bid, banner] of interiorBanners) banner.visible = walkingEnabled() && !showUpdate && currentInsideBuilding === bid;','')
s=s.replace('    const ic = map.walk.avatar.indoorCamera ?? { height: 13.5, distance: 15.5, lookHeight: 2.2, insideOpacity: 0.08 };','    const ic = inside && loadedRoom ? { height: loadedRoom.data.camera.height / map.scale, distance: loadedRoom.data.camera.distance / map.scale, lookHeight: loadedRoom.data.camera.lookHeight / map.scale } : c;',1)
s=s.replace('THREE.MathUtils.lerp(c.height, ic.height, indoorBlend)','ic.height').replace('THREE.MathUtils.lerp(c.distance, ic.distance, indoorBlend)','ic.distance').replace('THREE.MathUtils.lerp(c.lookHeight, ic.lookHeight, indoorBlend)','ic.lookHeight')
s=s.replace('  camera.position.lerp(camGoal, k);','''  if (inside && loadedRoom) {
    camGoal.x = THREE.MathUtils.clamp(camGoal.x, 1000 - loadedRoom.data.width / 2 + .5, 1000 + loadedRoom.data.width / 2 - .5);
    camGoal.z = Math.min(camGoal.z, loadedRoom.data.depth / 2 - .5);
  }
  if (changedSpace) { camera.position.copy(camGoal); look.copy(lookGoal); }
  camera.position.lerp(camGoal, k);''')
s=s.replace('  if (walker) occlusion?.update','  if (walker && !inside) occlusion?.update')
s=s.replace('    insideBuilding: currentInsideBuilding, indoorBlend,','    insideBuilding: currentInsideBuilding, indoorBlend, room: loadedRoom ? { seats: loadedRoom.seats, kind: loadedRoom.data.kind, verified: loadedRoom.data.verified } : null, loadingRoom: roomState().loading,')
p.write_text(s,encoding='utf-8')
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8').replace('import { ROOM_ORIGIN } from "./interiors";','const ROOM_ORIGIN = 1000;').replace('group = new THREE.Group(); group.visible', 'group = new THREE.Group(); group.name = "walking"; group.visible')
# Indoor ground clicks use local scene coordinates directly.
s=s.replace('  const mx = wx / data.scale', '  if (activeBuilding) { const target = new THREE.Vector3(wx, 0, wz); if (allowed(target) && clearSegment(pos, target)) route = [target]; return; }\n  const mx = wx / data.scale')
p.write_text(s,encoding='utf-8')
p=Path('web/src/ui/screens/walk.ts');s=p.read_text(encoding='utf-8').replace('  buildingAtPosition, nearCharacter','  roomState, nearbyEntrance, enterBuilding, exitBuilding, buildingAtPosition, nearCharacter')
s=s.replace('  const fab = el(', '  const portal = el("div", { class: "walk-room-controls panel dark" }); root.append(portal);\n  const fab = el(')
s=s.replace('    const inside = buildingAtPosition();','''    const inside = buildingAtPosition();
    const state = roomState(); const entrance = nearbyEntrance();
    const portalMode = state.loading ? "loading" : inside?.id ?? entrance?.id ?? (state.error ? "error" : "outside");
    if (portal.dataset.mode !== portalMode) {
      portal.dataset.mode = portalMode;
      portal.replaceChildren();
      if (state.loading) portal.append(el("p", { text: t("story.ui.loadingRoom"), role: "status" }));
      else if (inside) {
        portal.append(btn(t("story.ui.exitBuilding"), exitBuilding, "primary", { "data-exit-building": true }));
        portal.append(el("small", { text: t("story.ui.roomEstimate") }));
        if (state.room?.kind === "lecture") portal.append(el("small", { text: t("story.ui.capacity", { count: state.room.rows * state.room.columns }) }));
      } else if (entrance) portal.append(btn(t("story.ui.enterBuilding", { name: entrance.name }), () => { void enterBuilding(entrance.id); }, "primary", { "data-enter-building": entrance.id }));
      else if (state.error) portal.append(el("p", { text: t("story.ui.roomLoadFailed"), role: "status" }));
      portal.hidden = portal.childElementCount === 0;
    }''')
p.write_text(s,encoding='utf-8')
p=Path('web/src/style.css');s=p.read_text(encoding='utf-8');s+='\n.walk-room-controls { position: fixed; top: 80px; right: 16px; z-index: 15; padding: 10px; display: grid; gap: 6px; max-width: 260px; }\n.walk-room-controls[hidden] { display: none; }\n@media (max-height: 520px) { .walk-room-controls { top: 65px; right: 12px; max-width: 220px; padding: 8px; font-size: 11px; } }\n';p.write_text(s,encoding='utf-8')
p=Path('web/src/main.ts');s=p.read_text(encoding='utf-8').replace('teleportToPoint, buildingAtPosition }','teleportToPoint, buildingAtPosition, enterBuilding, exitBuilding, walkAxis, roomState }').replace('teleportToPoint, buildingAtPosition, pauseWalk, worldDiagnostics','teleportToPoint, buildingAtPosition, enterBuilding, exitBuilding, walkAxis, roomState, pauseWalk, worldDiagnostics');p.write_text(s,encoding='utf-8')
