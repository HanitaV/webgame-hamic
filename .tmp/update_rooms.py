import json, pathlib, shutil
root=pathlib.Path('.')
p=root/'web/public/data/map.json'; m=json.loads(p.read_text(encoding='utf-8'))
for b in m['buildings']:
 b['enterable']=b['id'].startswith('HUS_')
 if b['enterable']:
  b['entrance']=[b['x'],round(b['z']+b['d']/2+3,3)]
  b['interiorFile']='data/interiors/'+b.get('interiorKind','hall')+'.json'
for e in m['walk']['easterEggs']:
 if e.get('building','').startswith('USSH_'):
  b=next(b for b in m['buildings'] if b['id']==e['building']);e['x']=b['x']+b['w']/2+4;e.pop('building')
 if e['id']=='egg_hust_gt1':e['color']='#5ad8ff';e['texture']='textures/gt1-hust.png'
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=root/'web/public/data/i18n/vi.json';v=json.loads(p.read_text(encoding='utf-8'))
v.update({'story.ui.enterBuilding':'Vào {name}','story.ui.exitBuilding':'Ra sân trường','story.ui.loadingRoom':'Đang tải phòng…','story.ui.roomLoadFailed':'Chưa tải được phòng. Bạn có thể thử lại.','story.ui.usshExterior':'USSH chỉ tham quan bên ngoài: chưa có bản thiết kế.','story.ui.roomEstimate':'Nội thất minh họa, chưa xác minh bản thiết kế.','story.prop.uet.name':'ĐẠI HỌC QUỐC GIA HÀ NỘI\nTRƯỜNG\nĐẠI HỌC\nCÔNG NGHỆ','story.prop.uet.motto':'Khát khao\nSáng tạo\nVươn tới\nThế giới','story.ui.capacity':'{count} chỗ ngồi'})
for k,val in list(v.items()):
 if 'egg_hust_gt1' in k:v[k]=val.replace('bìa đỏ','bìa xanh').replace('Bìa đỏ','Bìa xanh')
p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
d=root/'web/public/data/interiors';d.mkdir(exist_ok=True)
for kind,rows,cols in [('lecture',8,12),('lab',4,6),('archive',3,4),('hall',4,6)]:
 (d/(kind+'.json')).write_text(json.dumps({'kind':kind,'width':18,'depth':20,'rows':rows,'columns':cols,'seatSpacing':1.1,'rowSpacing':1.65,'entry':[0,8.8],'exhibit':[-7,7],'camera':{'height':12,'distance':10,'lookHeight':0.8},'verified':False},indent=2)+'\n')
d=root/'web/public/textures';d.mkdir(exist_ok=True);shutil.copyfile(root/'docs/assets/gt_1_hust_2.png',d/'gt1-hust.png')
p=root/'web/src/core/data.ts';s=p.read_text(encoding='utf-8').replace('  interiorKind?:','  enterable?: boolean;\n  entrance?: [number, number];\n  interiorFile?: string;\n  interiorKind?:',1).replace('  kind: "book_red"','  texture?: string;\n  kind: "book_red"',1);p.write_text(s,encoding='utf-8')
