from pathlib import Path
import json
for p in Path('web/public/data/interiors').glob('*.json'):
 d=json.loads(p.read_text());d['camera']={'height':24,'distance':20,'lookHeight':.8};p.write_text(json.dumps(d,indent=2)+'\n')
p=Path('web/src/scene/world.ts');s=p.read_text(encoding='utf-8');a=s.index('  if (inside && loadedRoom) {\n    camGoal.x');b=s.index('  if (changedSpace)',a);s=s[:a]+'''  if (inside && loadedRoom) {
    const framing = loadedRoom.data.camera;
    camGoal.set(1000, framing.height, framing.distance);
    lookGoal.set(1000, framing.lookHeight, 0);
  }
'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('web/scripts/rooms-e2e.mjs');s=p.read_text(encoding='utf-8').replace("browser.newPage({viewport:","browser.newPage({serviceWorkers:'block',viewport:");p.write_text(s,encoding='utf-8')
