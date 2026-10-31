from pathlib import Path
p=Path('web/src/scene/world.ts');s=p.read_text(encoding='utf-8');s=s.replace('requestEasterEggInteraction, roomState }','requestEasterEggInteraction, roomState, installCampusCollision }')
s=s.replace('let loadedRoom: ReturnType<typeof import("./interiors").buildRoom>', 'let loadedRoom: Awaited<ReturnType<typeof import("./interiors").buildRoom>>')
s=s.replace('loadedRoom = module.buildRoom(b, roomData);','loadedRoom = await module.buildRoom(b, roomData);')
s=s.replace('return Promise.all([loadCampus().catch', '''return Promise.all([fetch(`${import.meta.env.BASE_URL}data/campus-collision.json`).then(async response => {
    if (!response.ok) throw new Error("Campus collision unavailable");
    installCampusCollision(await response.json());
  }), loadCampus().catch''')
s=s.replace('    camGoal.set(1000, framing.height, framing.distance);\n    lookGoal.set(1000, framing.lookHeight, 0);','    camGoal.set(walker!.x, framing.height, walker!.z + framing.distance);\n    lookGoal.set(walker!.x, framing.lookHeight, walker!.z);')
p.write_text(s,encoding='utf-8')
p=Path('web/src/ui/story/minimap.ts');s=p.read_text(encoding='utf-8');s=s.replace('      if (b.enterable && b.entrance) roundRect(g, px(b.entrance[0]) - 2, pz(b.entrance[1]) - 2, 4, 4, 1, INK.lightB);','      if (b.enterable) for (const door of b.entrances ?? []) roundRect(g, px(door.position[0])-2, pz(door.position[1])-2,4,4,1,INK.lightB);')
s=s.replace('    if (building) [mx, mz] = building.entrance ?? [building.x, building.z + (building.d ?? 0) / 2 + 4];','    if (building) {\n      const door = [...(building.entrances ?? [])].sort((a,b)=>Math.hypot(a.position[0]-mx,a.position[1]-mz)-Math.hypot(b.position[0]-mx,b.position[1]-mz))[0];\n      if (door) [mx,mz] = door.position;\n    }')
p.write_text(s,encoding='utf-8')
p=Path('web/scripts/sync-campus.py');s=p.read_text(encoding='utf-8-sig').replace("write(OUT/'data/map.json',m)","(OUT/'data/map.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\\n',encoding='utf-8')");p.write_text(s,encoding='utf-8')
