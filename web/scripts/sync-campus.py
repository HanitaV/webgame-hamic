"""Sync collision and ground-floor spaces from the same blockout used by build-map.mjs.
Run after legacy/campus/scripts/build_blockout.py. No inferred building rectangles.
"""
import copy, json, pathlib, struct, hashlib, shutil
ROOT=pathlib.Path(__file__).resolve().parents[2]
SRC=ROOT/'legacy/campus'
OUT=ROOT/'web/public'
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p,v): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
layout=read(SRC/'data/campus.layout.json');coll=read(SRC/'data/collision.json');inter=read(SRC/'data/interiors.json')
raw=(SRC/'assets/models/campus_blockout.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);binary=raw[28+n:]
source_hash=hashlib.sha256(raw).hexdigest()
templates=read(SRC/'data/room_templates.json')
for template in templates.values():
 target=OUT/template['model'];target.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(SRC/'assets/models/rooms'/target.name,target)
write(OUT/'data/campus-collision.json',dict(coll,modelSha256=source_hash))

def export_model(group,path):
 groups={group} if isinstance(group,str) else set(group)
 nodes=[copy.deepcopy(n) for n in g['nodes'] if n.get('extras',{}).get('group') in groups and n.get('extras',{}).get('floor')==1]
 out={'asset':g['asset'],'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':[],'materials':g['materials'],'buffers':[],'bufferViews':[],'accessors':[]}
 buf=bytearray();am={};vm={};mm={}
 def accessor(i):
  if i in am:return am[i]
  a=copy.deepcopy(g['accessors'][i]);v=a['bufferView']
  if v not in vm:
   view=copy.deepcopy(g['bufferViews'][v]);start=view.get('byteOffset',0)
   while len(buf)%4:buf.append(0)
   view['byteOffset']=len(buf);buf.extend(binary[start:start+view['byteLength']]);vm[v]=len(out['bufferViews']);out['bufferViews'].append(view)
  a['bufferView']=vm[v];am[i]=len(out['accessors']);out['accessors'].append(a);return am[i]
 for node in nodes:
  mi=node['mesh']
  if mi not in mm:
   mesh=copy.deepcopy(g['meshes'][mi])
   for p in mesh['primitives']:
    p['attributes']={k:accessor(i) for k,i in p['attributes'].items()}
    if 'indices' in p:p['indices']=accessor(p['indices'])
   mm[mi]=len(out['meshes']);out['meshes'].append(mesh)
  node['mesh']=mm[mi]
 out['buffers']=[{'byteLength':len(buf)}]
 js=json.dumps(out,separators=(',',':')).encode();js+=b' '*((-len(js))%4);buf.extend(b'\0'*((-len(buf))%4))
 path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf)
 return len(nodes)

m=read(OUT/'data/map.json');floors={}
for b in m['buildings']:
 parts=[p for p in layout['buildings'] if p['id']==b['id'] or ('HUS_'+p.get('group',''))==b['id']]
 b['footprints']=[q['footprint'] for q in inter['buildings'] if any(p['id']==q['id'] for p in parts)]
 doors=[]
 for part in parts:
  if part.get('access')!='open':continue
  x,z=part['center_xz'];w,d=part['size_xz']
  for o in part.get('openings',[]):
   if 1 not in o.get('floors',[1]):continue
   side=o['side'];front=[o['at'],z+(1 if side=='+z' else -1)*(d/2+1)] if side.endswith('z') else [x+(1 if side=='+x' else -1)*(w/2+1),o['at']]
   # Shared openings join building wings and are traversable, but aren't outdoor entrances.
   if any(q['id']!=part['id'] and abs(front[0]-q['center_xz'][0])<q['size_xz'][0]/2 and abs(front[1]-q['center_xz'][1])<q['size_xz'][1]/2 for q in layout['buildings']):continue
   doors.append({'id':part['id']+'_'+side+'_'+str(len(doors)),'position':[round(a,3) for a in front],'side':side,'width':o['width']})
 # The directory shows open central passages through BOTH T1 and T2.
 passage_id={'HUS_T1':'lobby','HUS_T2':'t2_center'}.get(b['id'])
 passage=next((h['rect'] for h in inter['halls'] if h['building']==b['id'] and h['id']==passage_id),None) if passage_id else None
 if passage:
  z=passage[1]+1.5 if parts[0].get('corridor')=='-z' else passage[3]-1.5
  code=b['id'].removeprefix('HUS_').lower()
  doors=[{'id':code+'_west','position':[passage[0]+1,z],'side':'+x','width':3,'zone':'west','title':'story.space.'+code+'.west'}, {'id':code+'_east','position':[passage[2]-1,z],'side':'-x','width':3,'zone':'east','title':'story.space.'+code+'.east'}]
 b['entrances']=doors
 if not doors:
  b['enterable']=False;b.pop('entrance',None);continue
 b['entrance']=doors[0]['position'];b['enterable']=True
 group=parts[0]['group'];b['interiorFile']='data/interiors/'+group+'.json'
 regions=[q['footprint'] for q in inter['buildings'] if q['group']==group and q['access']=='open']
 x0=min(r[0] for r in regions);z0=min(r[1] for r in regions);x1=max(r[2] for r in regions);z1=max(r[3] for r in regions);cx=(x0+x1)/2;cz=(z0+z1)/2
 ids=[p['id'] for p in parts];solids=[s for s in coll['solids'] if any(s['id'].startswith(i+'_') for i in ids) and s['max'][1]>.2 and s['min'][1]<1.7]
 is_hall=parts[0].get('program')=='hall';furniture=[s for s in solids if s.get('kind')]
 roomdata={'kind':'hall' if is_hall else 'building','model':'models/interiors/'+group+'.glb','modelSha256':source_hash,'moveSpeed':6,'width':x1-x0+4,'depth':z1-z0+4,'rows':0,'columns':0,'seatSpacing':1.1,'rowSpacing':1.65,'entry':[doors[0]['position'][0]-cx,doors[0]['position'][1]-cz],'exhibit':[0,0],'sourceCenter':[cx,cz],'regions':regions,'solids':solids,'rooms':[r for r in inter['rooms'] if r['group']==group and r['floor']==1],'halls':[h for h in inter['halls'] if h['building'] in ids],'entrances':doors,'camera':{'height':13,'distance':9.5,'lookHeight':0.8,'follow':True} if is_hall else {'height':12,'distance':10,'lookHeight':1},'verified':False}
 if furniture:roomdata['furniture']=furniture
 b['entryBarriers']=regions if not passage else [[r[0],r[1],min(r[2],passage[0]),r[3]] for r in regions if r[0]<passage[0]]+[[max(r[0],passage[2]),r[1],r[2],r[3]] for r in regions if r[2]>passage[2]]
 if passage: roomdata['passage']=passage
 for index,r in enumerate(roomdata['rooms']):
  rect=r['rect'];dx,dz=r['door']
  edges=[abs(dx-rect[0]),abs(dx-rect[2]),abs(dz-rect[1]),abs(dz-rect[3])];edge=edges.index(min(edges))
  nx,nz=[(-1,0),(1,0),(0,-1),(0,1)][edge]
  threshold=[rect[0] if edge==0 else rect[2] if edge==1 else dx,rect[1] if edge==2 else rect[3] if edge==3 else dz]
  r['approach']=[round(threshold[0]+nx*1.25,3),round(threshold[1]+nz*1.25,3)]
  suffix='-'+str(index) if sum(q['building']==r['building'] and q['num']==r['num'] for q in roomdata['rooms'])>1 else ''
  r['interiorFile']='data/interiors/rooms/'+group+'-'+r['building']+'-'+r['num']+suffix+'.json'
  # Standalone maps have more floor space and furniture colliders without changing campus portals.
  detail=dict(roomdata,**copy.deepcopy(templates[r['type']]))
  detail.update(rooms=[],passage=None,selectedRoom=r['num'],titleType=r['type'],exhibit=detail['entry'],sourceRoomRect=rect)
  write(OUT/r['interiorFile'],detail)
 # Exhibit is placed in the actual lobby at a reachable doorway, not at an arbitrary building centre.
 roomdata['exhibit']=[doors[0]['position'][0]-cx+1,doors[0]['position'][1]-cz]
 count=export_model(group,OUT/roomdata['model']);write(OUT/b['interiorFile'],roomdata);floors[group]=roomdata;print(group,len(doors),'entrances',len(solids),'solids',len(roomdata['rooms']),'rooms',count,'meshes')

# The connected east/north perimeter in hus_directory.png is one walkable space:
# east T1 -> T5 -> T4 -> T3. Keep every source room and shared doorway in place.
groups=['T1','T5','T4','T3'];t1=floors['T1'];cut=t1['passage'][2]
network=copy.deepcopy(floors['T5']);network.pop('passage',None)
network['model']='models/interiors/east-network.glb'
network['regions']=[[max(cut,r[0]),r[1],r[2],r[3]] for r in t1['regions'] if r[2]>cut]+[r for group in groups[1:] for r in floors[group]['regions']]
network['rooms']=[r for r in t1['rooms'] if r['rect'][0]>=cut-.01]+[r for group in groups[1:] for r in floors[group]['rooms']]
network['solids']=[s for group in groups for s in floors[group]['solids']]
network['halls']=[h for group in groups for h in floors[group]['halls'] if group!='T1' or h['rect'][0]>=cut]
network['entrances']=[d for d in t1['entrances'] if d['zone']=='east']+[d for group in groups[1:] for d in floors[group]['entrances']]
rs=network['regions'];x0=min(r[0] for r in rs);z0=min(r[1] for r in rs);x1=max(r[2] for r in rs);z1=max(r[3] for r in rs)
network['sourceCenter']=[(x0+x1)/2,(z0+z1)/2];network['width']=x1-x0+4;network['depth']=z1-z0+4
network['modelClipRects']={'T1':[cut,min(r[1] for r in t1['regions']),max(r[2] for r in t1['regions']),max(r[3] for r in t1['regions'])]}
network['connectedBuildings']=['HUS_T1','HUS_T5','HUS_T4','HUS_T3']
network['junctions']=[j for j in inter.get('junctions',[]) if all(group in groups for group in j['groups'])]
east_regions=network['regions'][:sum(r[2]>cut for r in t1['regions'])]
network['buildingRegions']=[{'building':'HUS_'+group,'title':'story.space.t1.east' if group=='T1' else next(b['name'] for b in m['buildings'] if b['id']=='HUS_'+group),'rect':r} for group in groups for r in (east_regions if group=='T1' else floors[group]['regions'])]
export_model(groups,OUT/network['model']);write(OUT/'data/interiors/east-network.json',network)
for b in m['buildings']:
 if b['id']=='HUS_T1':
  next(d for d in b['entrances'] if d['zone']=='east')['interiorFile']='data/interiors/east-network.json'
 elif b['id'] in network['connectedBuildings']:
  b['interiorFile']='data/interiors/east-network.json'
(OUT/'data/map.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
