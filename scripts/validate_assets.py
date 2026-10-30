#!/usr/bin/env python3
"""Structural checks on packed GLB buffers, topology, JSON and local references."""
import hashlib
import json
import math
import struct
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


def check(path):
    raw=path.read_bytes()
    magic,version,size=struct.unpack_from('<4sII',raw)
    assert magic==b'glTF' and version==2 and size==len(raw)
    chunks=[];offset=12
    while offset<len(raw):
        length,kind=struct.unpack_from('<I4s',raw,offset)
        assert length%4==0
        payload=raw[offset+8:offset+8+length]
        assert len(payload)==length
        chunks.append((kind,payload))
        offset+=8+length
    assert offset==len(raw) and chunks[0][0]==b'JSON' and chunks[1][0]==b'BIN\0'
    doc=json.loads(chunks[0][1]); binary=chunks[1][1]
    assert doc['buffers'][0]['byteLength']==len(binary)
    def accessor(index):
        a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
        count=a['count']*{'SCALAR':1,'VEC3':3}[a['type']]
        fmt,width={5126:('f',4),5123:('H',2)}[a['componentType']]
        offset=v.get('byteOffset',0)+a.get('byteOffset',0)
        assert offset%4==0
        assert a.get('byteOffset',0)+count*width<=v['byteLength']
        assert v.get('byteOffset',0)+v['byteLength']<=len(binary)
        values=struct.unpack_from('<'+fmt*count,binary,offset)
        assert all(math.isfinite(x) for x in values)
        if a['type']=='VEC3' and 'min' in a:
            assert a['min']==[min(values[i::3]) for i in range(3)]
            assert a['max']==[max(values[i::3]) for i in range(3)]
        return values
    for i in range(len(doc['accessors'])):accessor(i)
    triangles=0
    for mesh in doc['meshes']:
        for p in mesh['primitives']:
            pos=accessor(p['attributes']['POSITION']);normal=accessor(p['attributes']['NORMAL'])
            indices=accessor(p['indices'])
            assert len(pos)==len(normal) and len(indices)%3==0
            assert max(indices)<len(pos)//3
            assert p['material']<len(doc['materials'])
            for i in range(0,len(normal),3):
                assert abs(sum(x*x for x in normal[i:i+3])-1)<1e-5
            triangles+=len(indices)//3
    for node in doc['nodes']:
        assert node['mesh']<len(doc['meshes'])
        assert all(x>0 for x in node.get('scale',[1,1,1]))
    assert doc['scenes'][doc['scene']]['nodes']==list(range(len(doc['nodes'])))
    return {'file':str(path.relative_to(ROOT)),'status':'structural_checks_passed',
            'bytes':len(raw),'nodes':len(doc['nodes']),'stored_triangles':triangles,
            'sha256':hashlib.sha256(raw).hexdigest()}


if __name__=='__main__':
    checks=[check(p) for p in sorted((ROOT/'assets/models').glob('*.glb'))]
    assert len(checks)==7
    for p in (ROOT/'data').glob('*.json'):json.loads(p.read_text(encoding='utf-8'))
    for name in ['campus_map_user.png','campus_satellite_user.png']:
        assert (ROOT/'assets/references/user'/name).read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
    layout=json.loads((ROOT/'data/campus.layout.json').read_text(encoding='utf-8'))
    ids=[b['id'] for b in layout['buildings']]
    assert len(ids)==len(set(ids)) and len(ids)==20
    named=[]
    neutral=[]
    for b in layout['buildings']:
        assert isinstance(b.get('source_ids'), list) and b['source_ids']
        if b['verified_name'] is not None:
            assert b['confidence'] in ('low', 'medium')
            named.append(b['id']+':'+str(b['verified_name']))
        else:
            assert b['verified_name'] is None
            neutral.append(b['id'])
    interiors=json.loads((ROOT/'data/interiors.json').read_text(encoding='utf-8'))
    rooms=interiors['rooms']
    wc=[r for r in rooms if r['type']=='wc']
    assert rooms and len(wc)==37, len(wc)
    assert not any(r['group'] in ('T1','T2') and r['type'] in ('classroom','lecture') for r in rooms)
    for b in layout['buildings']:
        if b['campus']=='USSH' and b['id']!='USSH_STAGE':
            assert b.get('access')=='closed' and not b.get('openings'), b['id']
    floors={b['group']:b['floors'] for b in interiors['buildings'] if b['access']=='open'}
    assert floors['T1']==4 and floors['T2']==5 and floors['T3']==5 and floors['T4']==5 and floors['T5']==7 and floors['SPECIAL']==4
    report={'status':'passed','checks':checks,'building_blocks':len(ids),
        'hus_rooms':len(rooms)-len(wc),'hus_wc':len(wc),'hus_floors':floors,
        'named_blocks':named,'neutral_blocks':neutral,
        'scope':'GLB binary structure, buffer bounds, indices, normals, JSON, included source-image signatures, interiors rules (37 WC at the map WC spots, no classrooms in T1/T2, USSH closed, floor counts); not Khronos certification or browser/Blender rendering',
        'not_run':['Blender execution is not part of this structural check'],
        'accuracy':'sizes_are_estimates; names only where source_ids is non-empty'}
    (ROOT/'data/validation_report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
