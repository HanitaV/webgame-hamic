from pathlib import Path
p=Path('web/src/scene/navigation.ts');s=p.read_text(encoding='utf-8').replace('if(closed.has(nk)||!this.allowed(q.x,q.z))continue;','if(Math.abs(q.x-p.x)>s*1.1 || Math.abs(q.z-p.z)>s*1.1 || closed.has(nk)||!this.allowed(q.x,q.z))continue;');p.write_text(s,encoding='utf-8')
p=Path('web/scripts/sync-campus.py');s=p.read_text(encoding='utf-8').replace(" doors=[]\n for part in parts:"," b['footprints']=[q['footprint'] for q in inter['buildings'] if any(p['id']==q['id'] for p in parts)]\n doors=[]\n for part in parts:");p.write_text(s,encoding='utf-8')
p=Path('web/src/core/data.ts');s=p.read_text(encoding='utf-8').replace('  enterable?: boolean;','  footprints?: [number, number, number, number][];\n  enterable?: boolean;',1);p.write_text(s,encoding='utf-8')
p=Path('web/src/ui/story/minimap.ts');s=p.read_text(encoding='utf-8').replace('      roundRect(g, px(b.x) - bw / 2, pz(b.z) - bd / 2, bw, bd, 2, INK.grey, INK.dim);','''      for (const r of b.footprints ?? [[b.x-(b.w??20)/2,b.z-(b.d??16)/2,b.x+(b.w??20)/2,b.z+(b.d??16)/2]])
        roundRect(g,px(r[0]),pz(r[1]),(r[2]-r[0])*scale,(r[3]-r[1])*scale,2,INK.grey,INK.dim);''');p.write_text(s,encoding='utf-8')
