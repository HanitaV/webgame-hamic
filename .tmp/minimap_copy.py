import json,pathlib
p=pathlib.Path('web/public/data/i18n/vi.json'); v=json.loads(p.read_text(encoding='utf-8-sig'));v.update({
'story.map.canvas':'Bản đồ khuôn viên. Chạm để chọn điểm đến.',
'story.map.overview':'Toàn khu','story.map.follow':'Theo bạn','story.map.zoomOut':'−','story.map.zoomIn':'+',
'story.map.hint':'Chạm để chọn điểm đến','story.map.waypoint':'Đã đánh dấu điểm đến',
'story.map.north':'B ↑','story.map.indoors':'Đang ở trong nhà','story.map.campusOutside':'Bản đồ khuôn viên hiện khi ra ngoài',
'story.map.overviewLabel':'Toàn cảnh khuôn viên, hướng Bắc ở trên. Chạm để chọn điểm đến.',
'story.map.followLabel':'Bản đồ quanh bạn, hướng Bắc ở trên. Chạm để chọn điểm đến.',
'story.map.zoomInLabel':'Phóng to bản đồ','story.map.zoomOutLabel':'Thu nhỏ bản đồ'})
p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=pathlib.Path('web/src/style.css');s=p.read_text(encoding='utf-8');s=s.replace('top: calc(var(--edge-t) + 172px)', 'top: calc(var(--edge-t) + 228px)').replace('top: calc(var(--edge-t) + 118px)', 'top: calc(var(--edge-t) + 184px)');s=s.replace('.minimap-canvas { display: block; width: 220px; height: 150px; cursor: pointer; }', '''.minimap-canvas { display: block; width: 220px; height: 150px; cursor: crosshair; border-radius: var(--r-sm); }
.minimap-tools { display: flex; align-items: center; gap: 4px; padding-bottom: 4px; }
.minimap-tools .btn { min-height: 32px; min-width: 36px; padding: 0 8px; font-size: .7rem; }
.minimap-tools .btn:first-child { flex: 1; }
.minimap-tools .btn[aria-pressed="true"] { color: var(--gold); border-color: var(--gold); }
.minimap-status { display: block; padding: 4px 2px 0; font-size: .6rem; color: var(--muted); }''');s=s.replace('.minimap-canvas { width: 150px; height: 102px; }', '.minimap-canvas { width: 180px; height: 110px; }');p.write_text(s,encoding='utf-8')
