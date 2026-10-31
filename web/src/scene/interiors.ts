import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { MapBuilding } from "../core/data";
import { t } from "../core/i18n";
import { INK } from "../ui/widgets";

export interface SourceSolid { id: string; kind?: string; min: [number, number, number]; max: [number, number, number] }
export interface RoomPortal { num: string; building: string; type: string; rect: number[]; door: [number, number]; approach: [number, number]; interiorFile: string }
export interface RoomData {
  kind: string; model?: string; moveSpeed: number; width: number; depth: number; rows: number; columns: number;
  seatSpacing: number; rowSpacing: number; entry: [number, number]; exhibit: [number, number];
  sourceCenter?: [number, number]; regions?: number[][]; solids?: SourceSolid[];
  rooms?: RoomPortal[];
  clipRect?: number[]; passage?: number[]; selectedRoom?: string; titleType?: string;
  modelClipRects?: Record<string,number[]>;
  connectedBuildings?: string[];
  buildingRegions?: {building: string;title: string;rect: number[]}[];
  furniture?: SourceSolid[];
  walkPoints?: [number,number][];
  sourceRoomRect?: number[];
  entrances?: { position: [number,number]; side: string; width: number }[];
  camera: { height: number; distance: number; lookHeight: number; follow?: boolean }; verified: boolean;
}
export interface Obstacle { x: number; z: number; w: number; d: number }
export const ROOM_ORIGIN = 1000;

/** Ground-floor meshes and walls are exported together from the authored blockout. */
export async function buildRoom(b: MapBuilding, source: RoomData, label: (text: string) => THREE.Sprite) {
  if (!source.model || !source.sourceCenter || !b.entrance) throw new Error("Missing model floor plan");
  const [cx,cz] = source.sourceCenter;
  const door = source.entrances?.find(d => Math.hypot(d.position[0]-b.entrance![0],d.position[1]-b.entrance![1]) < .01);
  const side = door?.side ?? "+z", inward = side.startsWith("+") ? -2.5 : 2.5;
  const data = { ...source, entry: source.selectedRoom ? source.entry : [b.entrance[0]-cx+(side.endsWith("x")?inward:0),b.entrance[1]-cz+(side.endsWith("z")?inward:0)] as [number,number] };
  if (source.passage && b.entranceZone) {
    const [x0,z0,x1,z1] = source.regions![0];
    // T1/T2 passages remain outdoors; only the selected side loads here.
    const rs = source.regions!;
    data.clipRect = [Math.min(x0,...rs.map(r=>r[0])),Math.min(z0,...rs.map(r=>r[1])),Math.max(x1,...rs.map(r=>r[2])),Math.max(z1,...rs.map(r=>r[3]))];
    if (b.entranceZone === "west") data.clipRect[2] = source.passage[0];
    else data.clipRect[0] = source.passage[2];
    data.rooms = source.rooms?.filter(r => b.entranceZone === "west" ? r.rect[2] <= source.passage![0]+.01 : r.rect[0] >= source.passage![2]-.01);
  }
  data.exhibit = [data.entry[0]+.9,data.entry[1]];
  const root = new THREE.Group(); root.name = `interior_${b.id}`; root.position.x=ROOM_ORIGIN;
  const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}${source.model}`);
  gltf.scene.position.set(-cx,0,-cz);root.add(gltf.scene);
  const materials=new Set<THREE.Material>();
  const makePlanes=(rect?: number[])=>{
    const planes=[new THREE.Plane(new THREE.Vector3(0,-1,0),1.5)];
    if(rect){const [x0,z0,x1,z1]=rect;planes.push(new THREE.Plane(new THREE.Vector3(1,0,0),-(ROOM_ORIGIN+x0-cx)),new THREE.Plane(new THREE.Vector3(-1,0,0),ROOM_ORIGIN+x1-cx),new THREE.Plane(new THREE.Vector3(0,0,1),-(z0-cz)),new THREE.Plane(new THREE.Vector3(0,0,-1),z1-cz));}
    return planes;
  };
  gltf.scene.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;const src=mesh.material as THREE.MeshStandardMaterial;
    const material=new THREE.MeshLambertMaterial({color:src.color,side:THREE.DoubleSide,clippingPlanes:makePlanes(data.clipRect??data.modelClipRects?.[mesh.userData.group])}); mesh.material=material;materials.add(material);src.dispose();
  });
  const obstacles=(source.solids??[]).map(s=>({x:(s.min[0]+s.max[0])/2-cx,z:(s.min[2]+s.max[2])/2-cz,w:s.max[0]-s.min[0],d:s.max[2]-s.min[2]}));
  // Closed room footprints prevent walking through a portal without confirming.
  for(const r of data.rooms??[]){
    const [x0,z0,x1,z1]=r.rect;
    obstacles.push({x:(x0+x1)/2-cx,z:(z0+z1)/2-cz,w:x1-x0,d:z1-z0});
    const marker=new THREE.Mesh(new THREE.BoxGeometry(1.1,.06,.6),new THREE.MeshBasicMaterial({color:INK.light}));
    marker.position.set(r.approach[0]-cx,.12,r.approach[1]-cz);root.add(marker);materials.add(marker.material);
    const sign=label(t("story.space.roomName",{type:t(`story.space.type.${r.type}`),num:r.num}));
    sign.position.set(r.approach[0]-cx,1.1,r.approach[1]-cz);sign.userData.portal=true;root.add(sign);
  }
  root.add(new THREE.HemisphereLight("#eef1fb","#6f789a",2));
  return { root,data,obstacles,seats:0,update(position: THREE.Vector3){
    const signs=root.children.filter(o=>o.userData.portal);
    let nearest: THREE.Object3D | undefined, distance=5;
    for(const o of signs){o.visible=false;const d=Math.hypot(position.x-ROOM_ORIGIN-o.position.x,position.z-o.position.z);if(d<distance){nearest=o;distance=d;}}
    if(nearest)nearest.visible=true;
  },dispose(){root.removeFromParent();root.traverse(o=>{if((o as THREE.Mesh).isMesh)(o as THREE.Mesh).geometry.dispose();if((o as THREE.Sprite).isSprite){const m=(o as THREE.Sprite).material;m.map?.dispose();m.dispose();}});materials.forEach(m=>m.dispose());} };
}
