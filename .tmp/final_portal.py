from pathlib import Path
p=Path('web/src/ui/screens/walk.ts');s=p.read_text(encoding='utf-8').replace('inside?.id ?? (entrance ?', '(inside ? "inside:" + inside.id : null) ?? (entrance ?');p.write_text(s,encoding='utf-8')
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8').replace('  if (!pos || activeBuilding) return;\n  const target = nodes.get(id);','  if (activeBuilding) exitBuilding();\n  if (!pos) return;\n  const target = nodes.get(id);');p.write_text(s,encoding='utf-8')
p=Path('web/scripts/rooms-e2e.mjs');s=p.read_text(encoding='utf-8').replace("await page.keyboard.press('Escape');", "await page.locator('[data-egg-close=\"egg_hust_gt1\"]').click();");p.write_text(s,encoding='utf-8')
p=Path('web/package.json');import json;d=json.loads(p.read_text());d['scripts']['test:rooms']='node scripts/rooms-e2e.mjs';p.write_text(json.dumps(d,indent=2)+'\n')
