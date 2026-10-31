from pathlib import Path
import json
p=Path('web/public/data/map.json');m=json.loads(p.read_text(encoding='utf-8'))
for b in m['buildings']:
 if not b['enterable']:b['entrance']=[b['x']+b['w']/2+3,b['z']]
for n in m['walk']['nodes']:
 if n['id']=='g':
  b=next(b for b in m['buildings'] if b['id']=='USSH_G');n['z']=b['z']+b['d']/2+4
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for p in Path('web/public/data/interiors').glob('*.json'):
 d=json.loads(p.read_text());d['exhibit']=[-.8,8];d['moveSpeed']=3.5;p.write_text(json.dumps(d,indent=2)+'\n')
p=Path('web/src/scene/interiors.ts');s=p.read_text().replace('kind: string; width:', 'kind: string; moveSpeed: number; width:');p.write_text(s)
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8').replace('const radius = .17;', 'const radius = .17;')
s=s.replace('return !!pos && index >= 0 && eggActors[index].visible && pos.distanceTo(eggActors[index].position) <= data.walk.avatar.talkDistance * data.scale;', 'return !!pos && index >= 0 && eggActors[index].visible && pos.distanceTo(eggActors[index].position) <= (activeBuilding ? 1.6 : data.walk.avatar.talkDistance * data.scale);')
s=s.replace('  const speed = data.walk.avatar.speed * data.scale;','  const speed = activeBuilding && room ? room.moveSpeed : data.walk.avatar.speed * data.scale;\n  player.scale.setScalar(data.walk.avatar.height * (activeBuilding ? 1 : data.scale) / data.walk.avatar.modelHeight);')
a=s.index('function clearSegment(');b=s.index('/** Visibility graph',a)
s=s[:a]+'''function clearSegment(a: THREE.Vector3, b: THREE.Vector3) {
  for (const o of obstacles()) {
    let lo = 0, hi = 1;
    for (const [start, delta, center, extent] of [[a.x, b.x-a.x, o.x, o.w/2+radius], [a.z, b.z-a.z, o.z, o.d/2+radius]]) {
      if (Math.abs(delta) < 1e-9) { if (Math.abs(start-center) >= extent) { lo = 2; break; } }
      else { const t0 = (center-extent-start)/delta, t1 = (center+extent-start)/delta; lo = Math.max(lo, Math.min(t0,t1)); hi = Math.min(hi, Math.max(t0,t1)); }
    }
    if (lo <= hi) return false;
  }
  return true;
}
''' +s[b:]
p.write_text(s,encoding='utf-8')
p=Path('web/src/ui/screens/walk.ts');s=p.read_text(encoding='utf-8').replace('    const portalMode = state.loading', '    const portalMode = state.loading').replace('entrance?.id ?? (state.error ? "error" : "outside")','(entrance ? entrance.id + (state.error ? ":error" : "") : state.error ? "error" : "outside")')
s=s.replace('      } else if (entrance) portal.append(btn(', '      } else if (entrance && !entrance.enterable) portal.append(el("p", { text: t("story.ui.usshExterior") }));\n      else if (entrance) { if (state.error) portal.append(el("p", { text: t("story.ui.roomLoadFailed"), role: "status" })); portal.append(btn(')
s=s.replace('{ "data-enter-building": entrance.id }));','{ "data-enter-building": entrance.id })); }')
s=s.replace('    film?.dispose(); film = null;\n    disposed', '    portal.remove();\n    film?.dispose(); film = null;\n    disposed')
p.write_text(s,encoding='utf-8')
p=Path('web/src/ui/story/minimap.ts');s=p.read_text(encoding='utf-8').replace('{ "data-map-zoom": "out" }','{ "data-map-zoom": "out", "aria-label": t("story.map.zoomOutLabel") }').replace('{ "data-map-zoom": "in" }','{ "data-map-zoom": "in", "aria-label": t("story.map.zoomInLabel") }');p.write_text(s,encoding='utf-8')
for name in ['capture.mjs','story-e2e.mjs']:
 p=Path('web/scripts')/name;s=p.read_text(encoding='utf-8').replace('await page.evaluate(() => window.__hoitu.teleportToPoint(106.8, -78.0));','await page.evaluate(async () => { const h = window.__hoitu, b = h.data.map.buildings.find(b => b.id === "HUS_T1"); h.teleportToPoint(...b.entrance); await h.enterBuilding(b.id); });')
 s=s.replace('indoorDiag.cameraDistance < indoorDiag.desiredCameraDistance','indoorDiag.room.seats === 96').replace('Camera tự động thu gần khi vào trong Giảng đường T1','Giảng đường T1 riêng có 96 chỗ, camera nội thất')
 s=s.replace('walkToPoint(-135, -130)','walkToPoint(-110, -130)')
 p.write_text(s,encoding='utf-8')
