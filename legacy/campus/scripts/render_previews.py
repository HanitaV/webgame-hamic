#!/usr/bin/env python3
"""Optional CPU previews of actual GLB geometry; requires Pillow and NumPy."""
import json
import math
import struct
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]


def dot(a,b):
    return sum(x*y for x,y in zip(a,b))


def sub(a,b):
    return [x-y for x,y in zip(a,b)]


def unit(v):
    length = math.sqrt(dot(v,v))
    return [x/length for x in v]


def cross(a,b):
    return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]


def triangles(path):
    raw = path.read_bytes()
    size = struct.unpack_from('<I',raw,12)[0]
    doc = json.loads(raw[20:20+size])
    binary = raw[28+size:]
    def read(index):
        a = doc['accessors'][index]
        v = doc['bufferViews'][a['bufferView']]
        width = {'SCALAR':1,'VEC3':3}[a['type']]
        fmt = {5126:'f',5123:'H'}[a['componentType']]
        return struct.unpack_from('<'+fmt*(a['count']*width),binary,
            v.get('byteOffset',0)+a.get('byteOffset',0))
    result=[]
    for node in doc['nodes']:
        scale=node.get('scale',[1,1,1]);trans=node.get('translation',[0,0,0])
        for p in doc['meshes'][node['mesh']]['primitives']:
            pos=read(p['attributes']['POSITION']); idx=read(p['indices'])
            color=doc['materials'][p['material']]['pbrMetallicRoughness']['baseColorFactor'][:3]
            for i in range(0,len(idx),3):
                pts=[[pos[j*3+k]*scale[k]+trans[k] for k in range(3)] for j in idx[i:i+3]]
                normal=unit(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])))
                result.append((pts,normal,color))
    return result


def render(tris,name,topdown=False):
    width,height=1600,1080
    target=[0,0,-90]
    eye=[0,500,-90] if topdown else [340,350,430]
    forward=unit(sub(target,eye))
    right=[1,0,0] if topdown else unit(cross(forward,[0,1,0]))
    up=[0,0,-1] if topdown else unit(cross(right,forward))
    projected=[]
    for pts,normal,color in tris:
        if dot(normal,[-x for x in forward])<=0:
            continue
        coords=[(dot(sub(p,target),right),dot(sub(p,target),up)) for p in pts]
        depth=[dot(sub(p,eye),forward) for p in pts]
        shade=.57+.43*max(0,dot(normal,unit([-.5,1,.35])))
        rgb=tuple(round(c*255*shade) for c in color)
        projected.append((depth,coords,rgb))
    coords=[p for _,tri,_ in projected for p in tri]
    xmin,xmax=min(p[0] for p in coords),max(p[0] for p in coords)
    ymin,ymax=min(p[1] for p in coords),max(p[1] for p in coords)
    factor=min((width-150)/(xmax-xmin),(height-220)/(ymax-ymin))
    cx,cy=(xmin+xmax)/2,(ymin+ymax)/2
    canvas=np.full((height,width,3),[243,241,233],dtype=np.uint8)
    zbuffer=np.full((height,width),np.inf,dtype=np.float32)
    for depth,points,color in projected:
        xy=[(width/2+(x-cx)*factor,height/2+20-(y-cy)*factor) for x,y in points]
        xmin=max(0,math.floor(min(p[0] for p in xy)))
        xmax=min(width-1,math.ceil(max(p[0] for p in xy)))
        ymin=max(0,math.floor(min(p[1] for p in xy)))
        ymax=min(height-1,math.ceil(max(p[1] for p in xy)))
        if xmax<xmin or ymax<ymin:
            continue
        (x0,y0),(x1,y1),(x2,y2)=xy
        den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
        if abs(den)<1e-8:
            continue
        yy,xx=np.mgrid[ymin:ymax+1,xmin:xmax+1]
        xx=xx+.5;yy=yy+.5
        w0=((y1-y2)*(xx-x2)+(x2-x1)*(yy-y2))/den
        w1=((y2-y0)*(xx-x2)+(x0-x2)*(yy-y2))/den
        w2=1-w0-w1
        zz=w0*depth[0]+w1*depth[1]+w2*depth[2]
        old=zbuffer[ymin:ymax+1,xmin:xmax+1]
        mask=(w0>=-1e-6)&(w1>=-1e-6)&(w2>=-1e-6)&(zz<old)
        old[mask]=zz[mask]
        canvas[ymin:ymax+1,xmin:xmax+1][mask]=color
    image=Image.fromarray(canvas)
    draw=ImageDraw.Draw(image)
    font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    try:
        title=ImageFont.truetype(font_path,29)
        body=ImageFont.truetype(font_path,20)
    except OSError:
        title=body=ImageFont.load_default()
    draw.text((40,26),'USSH x HUS | APPROXIMATE BLOCKOUT SEED',font=title,fill='#263E46')
    draw.text((40,70),'CPU render of included GLB | estimated geometry, not a surveyed campus model',font=body,fill='#576B6D')
    draw.text((40,height-70),'14 neutral building blocks | actual names and heights remain unverified',font=body,fill='#576B6D')
    if topdown:
        draw.text((125,height-106),'USSH seed',font=body,fill='#943C3C')
        draw.text((1050,height-106),'HUS seed',font=body,fill='#355E76')
    out=ROOT/'previews'/name
    out.parent.mkdir(exist_ok=True)
    image.save(out)
    print(out)


if __name__=='__main__':
    tris=triangles(ROOT/'assets/models/campus_blockout.glb')
    render(tris,'overview_seed.png')
    render(tris,'topdown_seed.png',True)
