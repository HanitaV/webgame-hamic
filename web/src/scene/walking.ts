import * as THREE from "three";
import { Navigation } from "./navigation";
import { CampusCrowd } from "./crowd";
import type { MapBuilding, MapData, WalkCharacter, WalkEasterEgg } from "../core/data";
import { t } from "../core/i18n";

import type { RoomData, Obstacle, RoomPortal } from "./interiors";
const ROOM_ORIGIN = 1000;
let activeBuilding: MapBuilding | null = null;
let room: RoomData | null = null;
let roomObstacles: Obstacle[] = [];
let loadingRoom = false;
let roomError = false;
let transitionVersion = 0;
let loadRoom: (b: MapBuilding, file?: string, isCurrent?: () => boolean) => Promise<{ data: RoomData; obstacles: Obstacle[] }>;
let returnPosition: THREE.Vector3 | null = null;
let activeRoom: RoomPortal | null = null;
let corridorPosition: THREE.Vector3 | null = null;
let corridorRoom: RoomData | null = null;
let corridorNavigation: Navigation | null = null;
export function roomState() {
  const x=pos&&room?.sourceCenter ? pos.x-ROOM_ORIGIN+room.sourceCenter[0] : 0;
  const z=pos&&room?.sourceCenter ? pos.z+room.sourceCenter[1] : 0;
  const section=room?.buildingRegions?.find(({rect:r})=>x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3]);
  return { building: activeBuilding, room, activeRoom, section, loading: loadingRoom, error: roomError };
}
function installIndoor(loaded: {data: RoomData; obstacles: Obstacle[]}) {
  room=loaded.data; roomObstacles=loaded.obstacles;
  const [cx,cz]=room.sourceCenter!;
  const clip=room.clipRect;
  const regions=room.regions?.map(r=>({x0:ROOM_ORIGIN+Math.max(r[0],clip?.[0]??-Infinity)-cx,z0:Math.max(r[1],clip?.[1]??-Infinity)-cz,x1:ROOM_ORIGIN+Math.min(r[2],clip?.[2]??Infinity)-cx,z1:Math.min(r[3],clip?.[3]??Infinity)-cz})).filter(r=>r.x1>r.x0&&r.z1>r.z0);
  indoorNavigation=new Navigation(roomObstacles.map(o=>({...o,x:o.x+ROOM_ORIGIN})),.48,.5,{x0:ROOM_ORIGIN-room.width/2+.48,x1:ROOM_ORIGIN+room.width/2-.48,z0:-room.depth/2+.48,z1:room.depth/2-.48},regions);
}
export function nearbyRoom() {
  if(!activeBuilding || !room || activeRoom || loadingRoom || !pos)return null;
  const [cx,cz]=room.sourceCenter!;
  return room.rooms?.find(r=>Math.hypot(pos!.x-ROOM_ORIGIN-r.approach[0]+cx,pos!.z-r.approach[1]+cz)<2)??null;
}
export async function enterRoom(file: string) {
  const target=nearbyRoom();
  if(!target || target.type==="office" || target.interiorFile!==file || !activeBuilding)return false;
  return changeRoom(target);
}
async function changeRoom(target: RoomPortal | null) {
  if(!activeBuilding || loadingRoom || !pos)return false;
  const b=activeBuilding, previous=pos.clone(),previousRoom=room,previousNavigation=indoorNavigation,version=++transitionVersion;
  loadingRoom=true;roomError=false;route=[];axis.set(0,0);
  try{
    const loaded=await loadRoom(b,target?.interiorFile,()=>version===transitionVersion&&enabled);
    if(version!==transitionVersion || !enabled)return false;
    installIndoor(loaded);
    if(target){corridorPosition=previous;corridorRoom=previousRoom;corridorNavigation=previousNavigation;pos.set(ROOM_ORIGIN+room!.entry[0],0,room!.entry[1]);}
    else if(corridorPosition){pos.copy(corridorPosition);corridorRoom=null;corridorNavigation=null;}
    activeRoom=target;player.position.copy(pos);return true;
  }catch{if(version===transitionVersion)roomError=true;return false;}
  finally{if(version===transitionVersion)loadingRoom=false;}
}
export async function exitRoom() { if(!activeRoom)return false;return changeRoom(null); }
export function nearbyEntrance() {
  if (!pos || activeBuilding || loadingRoom) return null;
  let nearest: MapBuilding | null = null, distance = .8;
  for (const b of data.buildings) for (const door of b.entrances ?? []) {
    const d = pos.distanceTo(point(...door.position));
    if (d < distance) { nearest = { ...b, entrance: door.position, entranceZone: door.zone, entranceTitle: door.title, interiorFile: door.interiorFile??b.interiorFile }; distance = d; }
  }
  return nearest;
}
export async function enterBuilding(id: string) {
  const b = nearbyEntrance();
  if (b?.id !== id) return false;
  if (!b?.enterable || !b.entrance || !pos || activeBuilding || loadingRoom) return false;
  if (pos.distanceTo(point(...b.entrance)) > 1.1) return false;
  loadingRoom = true; roomError = false; route = []; axis.set(0, 0);
  const version = ++transitionVersion;
  try {
    const loaded = await loadRoom(b,undefined,()=>version===transitionVersion&&enabled);
    if (version !== transitionVersion || !enabled) return false;
    returnPosition = point(...b.entrance); activeBuilding = b; installIndoor(loaded);
    pos.set(ROOM_ORIGIN + room!.entry[0], 0, room!.entry[1]); player.position.copy(pos);
    return true;
  } catch { if (version === transitionVersion) roomError = true; return false; }
  finally { if (version === transitionVersion) loadingRoom = false; }
}
export function exitBuilding() {
  transitionVersion++; loadingRoom = false;
  const destination=activeBuilding ? nearestCampusExit()??returnPosition : null;
  if (destination && pos) { pos.copy(destination); player.position.copy(pos); }
  returnPosition=null;
  activeBuilding = null; activeRoom=null;corridorPosition=null;corridorRoom=null;corridorNavigation=null;roomError=false;room = null; roomObstacles = []; route = []; axis.set(0, 0);
}
/** Interior models use their own origin; compare exits in the campus source coordinates. */
function nearestCampusExit() {
  const floor=activeRoom ? corridorRoom : room;
  const location=activeRoom ? corridorPosition : pos;
  const nav=activeRoom ? corridorNavigation : indoorNavigation;
  if(!floor?.sourceCenter || !location || !nav)return null;
  const [cx,cz]=floor.sourceCenter;
  const mx=location.x-ROOM_ORIGIN+cx,mz=location.z+cz;
  const doors=(floor.entrances??[]).slice().sort((a,b)=>
    Math.hypot(a.position[0]-mx,a.position[1]-mz)-Math.hypot(b.position[0]-mx,b.position[1]-mz));
  for(const door of doors){
    const outside=point(...door.position);
    if(!outdoorNavigation?.allowed(outside.x,outside.z))continue;
    const inward=door.side.startsWith('+')?-2.5:2.5;
    const inside={x:ROOM_ORIGIN+door.position[0]-cx+(door.side.endsWith('x')?inward:0),z:door.position[1]-cz+(door.side.endsWith('z')?inward:0)};
    // An exit on the other side of a wall or the outdoor T1/T2 passage is not reachable.
    if(nav.allowed(inside.x,inside.z) && (nav.clear(location,inside)||nav.path(location,inside).length))return outside;
  }
  return null;
}
let data: MapData;
let group: THREE.Group;
let player: THREE.Group;
let marker: THREE.Mesh;
let point: (x: number, z: number) => THREE.Vector3;
const nodes = new Map<string, THREE.Vector3>();
let route: THREE.Vector3[] = [];
let enabled = false, paused = false;
let axis = new THREE.Vector2();
let pos: THREE.Vector3 | null = null;
const legs: THREE.Group[] = [];
const arms: THREE.Group[] = [];
const actors: THREE.Group[] = [];
const nameTags: THREE.Sprite[] = [];
let playerRing: THREE.Mesh;
let crowd: CampusCrowd;
let playerOccluded = false;
const interactionListeners = new Set<(id: string) => void>();
const eggInteractionListeners = new Set<(id: string) => void>();
const projected = new THREE.Vector3();
const lampPosts = new Map<string, { bulb: THREE.Mesh; halo: THREE.Mesh }>();
const eggActors: THREE.Group[] = [];
const eggTags: THREE.Sprite[] = [];
const eggRings: THREE.Mesh[] = [];

type ShirtKit = "hamic" | "hus" | "ussh";
interface KitTextures {
  base: string;
  collar: THREE.CanvasTexture;
  torso: THREE.CanvasTexture;
  leftSleeve: THREE.CanvasTexture;
  rightSleeve: THREE.CanvasTexture;
}
const kitCache = new Map<string, KitTextures>();

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!];
}

function toTex(c: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function shadeHex(hex: string, factor: number): string {
  const col = new THREE.Color(hex);
  col.multiplyScalar(factor);
  return `#${col.getHexString()}`;
}

/** Subtle polo piqué knit grain + seam shading so shirts read as real fabric up close. */
function fillPique(g: CanvasRenderingContext2D, w: number, h: number, base: string) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.028)";
  for (let y = 0; y < h; y += 6) {
    for (let x = (y % 12 === 0 ? 0 : 3); x < w; x += 6) g.fillRect(x, y, 2, 2);
  }
  g.fillStyle = "rgba(0,0,0,0.045)";
  for (let y = 3; y < h; y += 6) {
    for (let x = (y % 12 === 3 ? 0 : 3); x < w; x += 6) g.fillRect(x, y, 2, 2);
  }
}

/** Circular HAMIC chest emblem + "HAMIC" wordmark (matching official club logo). */
function drawHamicChestLogo(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = "#e6e9f0";
  g.fill();

  const bytes = ["01001000", "01000001", "01001101", "01001001", "01000011", "01001000", "01000001", "01001101", "01001001", "01000011"];
  const totalBits = bytes.length * 8;
  g.save();
  g.translate(cx, cy);
  g.font = `800 ${Math.max(5, Math.round(r * 0.13))}px "Be Vietnam Pro", monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let bitIdx = 0;
  for (let b = 0; b < bytes.length; b += 1) {
    g.fillStyle = b % 2 === 0 ? "#d9821e" : "#c81e2b";
    for (let k = 0; k < 8; k += 1) {
      const a = (bitIdx / totalBits) * Math.PI * 2 - Math.PI * 0.42;
      g.save();
      g.rotate(a + Math.PI / 2);
      g.fillText(bytes[b][k], 0, -r * 0.885);
      g.restore();
      bitIdx += 1;
    }
  }
  g.restore();

  g.beginPath();
  g.arc(cx, cy, r * 0.77, 0, Math.PI * 2);
  g.fillStyle = "#f9fbff";
  g.fill();
  g.lineWidth = r * 0.085;
  g.strokeStyle = "#1b4588";
  g.stroke();

  g.strokeStyle = "#1b4588";
  g.lineCap = "round";
  g.lineWidth = r * 0.16;
  g.beginPath();
  g.moveTo(cx, cy - r * 0.50);
  g.lineTo(cx, cy - r * 0.02);
  g.stroke();

  g.strokeStyle = "#2bb0f6";
  g.lineWidth = r * 0.035;
  g.beginPath();
  g.moveTo(cx + r * 0.045, cy - r * 0.44);
  g.lineTo(cx + r * 0.045, cy - r * 0.16);
  g.stroke();

  g.strokeStyle = "#1b4588";
  g.lineWidth = r * 0.115;
  g.beginPath();
  g.arc(cx, cy - r * 0.05, r * 0.42, -Math.PI * 0.88, -Math.PI * 0.62);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy - r * 0.05, r * 0.42, -Math.PI * 0.38, -Math.PI * 0.12);
  g.stroke();

  g.lineWidth = r * 0.11;
  g.beginPath();
  g.arc(cx, cy + r * 0.02, r * 0.43, Math.PI * 0.22, Math.PI * 0.78);
  g.stroke();

  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#c81440";
  g.font = `800 ${Math.round(r * 0.38)}px "Be Vietnam Pro", sans-serif`;
  g.fillText("A", cx - r * 0.39, cy + r * 0.15);
  g.font = `800 ${Math.round(r * 0.22)}px "Be Vietnam Pro", sans-serif`;
  g.fillText("+", cx - r * 0.19, cy + r * 0.02);

  g.fillStyle = "#f59227";
  g.font = `800 ${Math.round(r * 0.40)}px "Be Vietnam Pro", sans-serif`;
  g.fillText("$", cx + r * 0.38, cy + r * 0.15);

  g.fillStyle = "#f7f9fe";
  g.font = `800 ${Math.round(r * 0.62)}px "Be Vietnam Pro", system-ui, sans-serif`;
  g.fillText("HAMIC", cx, cy + r * 1.42);
  g.restore();
}

/** HUS sleeve crest (from docs/assets/hus_polo_2.jpg). */
function drawHusSleeveCrest(g: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  g.save();
  g.translate(cx, cy);
  const u = s / 200;

  g.beginPath();
  g.moveTo(-42 * u, -42 * u);
  g.lineTo(54 * u, -46 * u);
  g.lineTo(52 * u, 36 * u);
  g.bezierCurveTo(50 * u, 74 * u, 22 * u, 92 * u, -2 * u, 92 * u);
  g.bezierCurveTo(-30 * u, 92 * u, -46 * u, 72 * u, -46 * u, 42 * u);
  g.closePath();
  g.fillStyle = "#0e87d1";
  g.fill();
  g.lineWidth = 4.5 * u;
  g.strokeStyle = "#dc1f29";
  g.stroke();

  g.beginPath();
  g.moveTo(-34 * u, -34 * u);
  g.lineTo(31 * u, -34 * u);
  g.lineTo(30 * u, 30 * u);
  g.bezierCurveTo(28 * u, 54 * u, 12 * u, 66 * u, -4 * u, 66 * u);
  g.bezierCurveTo(-22 * u, 66 * u, -34 * u, 52 * u, -34 * u, 30 * u);
  g.closePath();
  g.fillStyle = "#163a63";
  g.fill();

  g.fillStyle = "#132946";
  for (let i = -2; i <= 2; i += 1) {
    g.save();
    g.translate(-2 * u, -10 * u);
    g.rotate(i * 0.36);
    g.fillRect(-5 * u, -28 * u, 10 * u, 12 * u);
    g.restore();
  }
  g.strokeStyle = "#f5f9ff";
  g.lineWidth = 2.6 * u;
  for (const rad of [11 * u, 17 * u]) {
    g.beginPath();
    g.arc(-2 * u, -4 * u, rad, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  }

  g.fillStyle = "#f7faff";
  g.strokeStyle = "#132946";
  g.lineWidth = 3 * u;
  g.beginPath();
  g.moveTo(-27 * u, -4 * u);
  g.quadraticCurveTo(-14 * u, -8 * u, -2 * u, -1 * u);
  g.quadraticCurveTo(10 * u, -8 * u, 24 * u, -4 * u);
  g.lineTo(22 * u, 40 * u);
  g.quadraticCurveTo(9 * u, 36 * u, -2 * u, 44 * u);
  g.quadraticCurveTo(-13 * u, 36 * u, -25 * u, 40 * u);
  g.closePath();
  g.fill();
  g.stroke();

  g.save();
  g.translate(-1.5 * u, 19 * u);
  g.strokeStyle = "#18365c";
  g.lineWidth = 2.0 * u;
  for (const ang of [0, Math.PI / 3, -Math.PI / 3]) {
    g.save();
    g.rotate(ang);
    g.beginPath();
    g.ellipse(0, 0, 12 * u, 4.8 * u, 0, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
  g.fillStyle = "#18365c";
  g.beginPath();
  g.arc(0, 0, 2.5 * u, 0, Math.PI * 2);
  g.fill();
  g.restore();

  g.fillStyle = "#f7faff";
  g.strokeStyle = "#132946";
  g.lineWidth = 2.6 * u;
  g.beginPath();
  g.roundRect(-44 * u, -40 * u, 22 * u, 11 * u, 3 * u);
  g.fill();
  g.stroke();

  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    const a = 0.25 + t * 1.15;
    const lx = -16 * u - Math.cos(a) * 34 * u;
    const ly = 16 * u + Math.sin(a) * 48 * u - 14 * u;
    g.save();
    g.translate(lx, ly);
    g.rotate(-0.55 + t * 0.85);
    g.fillStyle = "#f2c629";
    g.strokeStyle = "#182334";
    g.lineWidth = 2 * u;
    g.beginPath();
    g.ellipse(0, 0, 8.5 * u, 4.2 * u, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.restore();
  }

  g.beginPath();
  g.moveTo(-52 * u, -52 * u);
  g.bezierCurveTo(-52 * u, -76 * u, -24 * u, -78 * u, 6 * u, -76 * u);
  g.bezierCurveTo(28 * u, -75 * u, 40 * u, -84 * u, 40 * u, -92 * u);
  g.bezierCurveTo(54 * u, -80 * u, 56 * u, -56 * u, 48 * u, -42 * u);
  g.bezierCurveTo(32 * u, -48 * u, -18 * u, -44 * u, -46 * u, -44 * u);
  g.closePath();
  g.fillStyle = "#e01e28";
  g.fill();
  g.strokeStyle = "#ffffff";
  g.lineWidth = 3.2 * u;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-12 * u, -54 * u);
  g.quadraticCurveTo(28 * u, -54 * u, 42 * u, -66 * u);
  g.stroke();

  g.fillStyle = "#f5f9ff";
  g.font = `700 ${Math.max(7, Math.round(9.5 * u))}px "Be Vietnam Pro", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.save();
  g.translate(6 * u, 80 * u);
  g.rotate(-0.18);
  g.fillText("ĐẠI HỌC", 0, 0);
  g.restore();
  g.save();
  g.translate(42 * u, -2 * u);
  g.rotate(-Math.PI / 2);
  g.fillText("KHOA HỌC TỰ NHIÊN", 0, 0);
  g.restore();

  g.restore();
}

function getKitTextures(kit: ShirtKit, rawColor: string): KitTextures {
  const key = `${kit}:${rawColor}`;
  const cached = kitCache.get(key);
  if (cached) return cached;

  const base = kit === "hamic" ? "#8e192b" : kit === "hus" ? "#1f82c6" : "#228b67";
  const dark = shadeHex(base, 0.82);
  const deep = shadeHex(base, 0.68);

  // 1. Collar texture
  const [cc, cg] = makeCanvas(512, 128);
  fillPique(cg, 512, 128, shadeHex(base, 0.94));
  cg.fillStyle = "rgba(0,0,0,0.07)";
  for (let x = 0; x < 512; x += 6) cg.fillRect(x, 0, 2, 128);
  if (kit === "hamic") {
    cg.fillStyle = "#f7f9fe";
    cg.fillRect(0, 14, 512, 18);
  } else if (kit === "ussh") {
    cg.fillStyle = "#e9fff4";
    cg.fillRect(0, 14, 512, 14);
  } else {
    cg.fillStyle = shadeHex(base, 0.80);
    cg.fillRect(0, 12, 512, 4);
  }

  // 2. Torso texture (1600×640)
  const W = 1600, H = 640;
  const [tc, tg] = makeCanvas(W, H);
  fillPique(tg, W, H, base);

  for (const sx of [0, W / 2, W]) {
    const grd = tg.createLinearGradient(sx - 90, 0, sx + 90, 0);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(0.5, "rgba(0,0,0,0.16)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    tg.fillStyle = grd;
    tg.fillRect(sx - 90, 0, 180, H);
    tg.strokeStyle = deep;
    tg.lineWidth = 2;
    tg.beginPath();
    tg.moveTo(sx, 0);
    tg.lineTo(sx, H);
    tg.stroke();
  }
  tg.fillStyle = dark;
  tg.fillRect(0, H - 26, W, 26);
  tg.strokeStyle = "rgba(255,255,255,0.12)";
  tg.lineWidth = 2;
  tg.beginPath();
  tg.moveTo(0, H - 28); tg.lineTo(W, H - 28);
  tg.moveTo(0, H - 22); tg.lineTo(W, H - 22);
  tg.stroke();

  tg.strokeStyle = "rgba(0,0,0,0.18)";
  tg.lineWidth = 3;
  tg.beginPath();
  tg.moveTo(920, 96);
  tg.quadraticCurveTo(1200, 114, 1480, 96);
  tg.stroke();

  const fx = W * 0.25;
  tg.fillStyle = deep;
  tg.fillRect(fx - 24, 92, 48, 172);
  tg.strokeStyle = "rgba(0,0,0,0.28)";
  tg.lineWidth = 3;
  tg.strokeRect(fx - 24, 92, 48, 172);
  tg.beginPath();
  tg.moveTo(fx - 44, 0);
  tg.lineTo(fx + 44, 0);
  tg.lineTo(fx, 118);
  tg.closePath();
  tg.fillStyle = kit === "hus" ? "#cfd6e0" : deep;
  tg.fill();
  tg.beginPath();
  tg.moveTo(fx - 28, 0);
  tg.lineTo(fx + 28, 0);
  tg.lineTo(fx, 98);
  tg.closePath();
  tg.fillStyle = "#d8b8a6";
  tg.fill();

  const chestX = 518;
  if (kit === "hamic") {
    drawHamicChestLogo(tg, chestX, 184, 45);
    const bx = W * 0.75;
    tg.save();
    tg.fillStyle = "#f7f9fe";
    tg.textAlign = "center";
    tg.textBaseline = "middle";
    tg.font = '800 23px "Be Vietnam Pro", system-ui, sans-serif';
    tg.fillText("CÂU LẠC BỘ TOÁN TIN HAMIC", bx, 194, 340);
    tg.fillStyle = "#eef2fb";
    tg.font = '600 14.5px "Be Vietnam Pro", system-ui, sans-serif';
    tg.fillText("HUS APPLIED MATHEMATICS & INFORMATICS CLUB", bx, 224, 372);
    tg.restore();
  } else if (kit === "hus") {
    tg.save();
    tg.textAlign = "center";
    tg.textBaseline = "middle";
    tg.fillStyle = "#eef5fc";
    tg.font = '800 48px "Be Vietnam Pro", system-ui, sans-serif';
    tg.fillText("HUS", chestX, 196);
    const husW = tg.measureText("HUS").width;
    tg.fillStyle = "#dbeaf8";
    tg.font = '700 10.5px "Be Vietnam Pro", system-ui, sans-serif';
    tg.fillText("VNU UNIVERSITY OF SCIENCE", chestX, 228, husW * 1.04);
    tg.restore();
  } else {
    tg.save();
    tg.textAlign = "center";
    tg.textBaseline = "middle";
    tg.fillStyle = "#f4fff9";
    tg.font = '800 38px "Be Vietnam Pro", system-ui, sans-serif';
    tg.fillText("USSH", chestX, 198);
    tg.fillStyle = "#c8f7df";
    tg.fillRect(chestX - 46, 222, 92, 4);
    tg.restore();
  }

  // 3. Left & Right Short-Sleeve Textures (1024×448)
  const buildSleeve = (isLeft: boolean) => {
    const SW = 1024, SH = 448;
    const [sc, sg] = makeCanvas(SW, SH);
    fillPique(sg, SW, SH, base);
    sg.fillStyle = shadeHex(base, 0.90);
    sg.fillRect(0, 368, SW, 80);
    sg.fillStyle = "rgba(0,0,0,0.08)";
    for (let x = 0; x < SW; x += 8) sg.fillRect(x, 368, 3, 80);
    sg.strokeStyle = deep;
    sg.lineWidth = 2.5;
    sg.beginPath();
    sg.moveTo(0, 364); sg.lineTo(SW, 364);
    sg.moveTo(0, 369); sg.lineTo(SW, 369);
    sg.stroke();

    if (kit === "hamic") {
      sg.fillStyle = "#f7f9fe";
      sg.fillRect(0, 410, SW, 16);
      if (isLeft) {
        sg.save();
        sg.fillStyle = "#f8fafe";
        sg.textAlign = "center";
        sg.textBaseline = "middle";
        sg.font = '800 38px "Be Vietnam Pro", system-ui, sans-serif';
        sg.fillText("HAMIC FAMILY", SW * 0.5, 326, 330);
        sg.restore();
      }
    } else if (kit === "hus") {
      if (isLeft) drawHusSleeveCrest(sg, SW * 0.5, 224, 195);
    } else {
      sg.fillStyle = "#e9fff4";
      sg.fillRect(0, 414, SW, 12);
    }
    return toTex(sc);
  };

  const out: KitTextures = {
    base,
    collar: toTex(cc),
    torso: toTex(tc),
    leftSleeve: buildSleeve(true),
    rightSleeve: buildSleeve(false),
  };
  kitCache.set(key, out);
  return out;
}

/** Superellipse loft with arc-length UVs: u=0.25 front(+Z), u=0.5 left(+X), u=0.75 back(-Z). */
function torsoLoftGeometry(): THREE.BufferGeometry {
  const rings = [
    { y: 0.468, rx: 0.172, rz: 0.110, v: 0.00 },
    { y: 0.484, rx: 0.190, rz: 0.122, v: 0.04 },
    { y: 0.585, rx: 0.186, rz: 0.120, v: 0.25 },
    { y: 0.700, rx: 0.198, rz: 0.129, v: 0.50 },
    { y: 0.805, rx: 0.205, rz: 0.133, v: 0.73 },
    { y: 0.872, rx: 0.198, rz: 0.124, v: 0.88 },
    { y: 0.908, rx: 0.136, rz: 0.098, v: 0.96 },
    { y: 0.924, rx: 0.068, rz: 0.064, v: 1.00 },
  ];
  const segs = 56, exp = 0.72;
  const sPow = (t: number) => Math.sign(t) * Math.pow(Math.abs(t), exp);
  const unitPts: [number, number][] = [];
  const cum: number[] = [0];
  for (let i = 0; i <= segs; i += 1) {
    const th = -Math.PI / 2 + (i / segs) * Math.PI * 2;
    unitPts.push([sPow(Math.sin(th)), sPow(Math.cos(th))]);
    if (i > 0) {
      const dx = (unitPts[i][0] - unitPts[i - 1][0]) * 0.20;
      const dz = (unitPts[i][1] - unitPts[i - 1][1]) * 0.13;
      cum.push(cum[i - 1] + Math.hypot(dx, dz));
    }
  }
  const total = cum[segs];
  const posArr: number[] = [], uvArr: number[] = [], idx: number[] = [];
  for (let r = 0; r < rings.length; r += 1) {
    const { y, rx, rz, v } = rings[r];
    for (let i = 0; i <= segs; i += 1) {
      posArr.push(unitPts[i][0] * rx, y, unitPts[i][1] * rz);
      uvArr.push(cum[i] / total, v);
    }
  }
  const stride = segs + 1;
  for (let r = 0; r < rings.length - 1; r += 1) {
    for (let i = 0; i < segs; i += 1) {
      const a = r * stride + i, b = a + 1, c = a + stride, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const botCenter = posArr.length / 3;
  posArr.push(0, rings[0].y, 0);
  uvArr.push(0.25, 0);
  for (let i = 0; i < segs; i += 1) idx.push(botCenter, i + 1, i);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(posArr, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvArr, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Short polo sleeve cylinder with smooth shoulder taper and raised ribbed cuff band. */
function sleeveGeometry(isLeft: boolean): THREE.BufferGeometry {
  const rings = [
    { y: -0.158, r: 0.053, v: 0.00 },
    { y: -0.154, r: 0.057, v: 0.02 },
    { y: -0.126, r: 0.058, v: 0.18 },
    { y: -0.122, r: 0.056, v: 0.19 },
    { y: -0.058, r: 0.059, v: 0.58 },
    { y: 0.000, r: 0.060, v: 1.00 },
  ];
  const segs = 36;
  const posArr: number[] = [], uvArr: number[] = [], idx: number[] = [];
  const dir = isLeft ? 1 : -1;
  for (let k = 0; k < rings.length; k += 1) {
    const { y, r, v } = rings[k];
    for (let i = 0; i <= segs; i += 1) {
      const u = i / segs;
      const th = u * Math.PI * 2;
      const x = -dir * r * Math.cos(th);
      const z = dir * r * Math.sin(th);
      posArr.push(x, y, z);
      uvArr.push(u, v);
    }
  }
  const stride = segs + 1;
  for (let k = 0; k < rings.length - 1; k += 1) {
    for (let i = 0; i < segs; i += 1) {
      const a = k * stride + i, b = a + 1, c = a + stride, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(posArr, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvArr, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** 3D folded polo collar wrapping around back/sides of neck with open front V. */
function collarGeometry(): THREE.BufferGeometry {
  const profile = [
    { dy: 0.000, dr: 0.072, v: 0.05 },
    { dy: 0.036, dr: 0.078, v: 0.45 },
    { dy: 0.006, dr: 0.104, v: 0.96 },
    { dy: 0.002, dr: 0.098, v: 1.00 },
  ];
  const segs = 28;
  const start = 0.36, end = Math.PI * 2 - 0.36;
  const posArr: number[] = [], uvArr: number[] = [], idx: number[] = [];
  for (let p = 0; p < profile.length; p += 1) {
    const { dy, dr, v } = profile[p];
    for (let i = 0; i <= segs; i += 1) {
      const u = i / segs;
      const a = start + u * (end - start);
      const frontFactor = Math.max(0, Math.cos(a));
      const x = Math.sin(a) * dr;
      const z = Math.cos(a) * dr * 0.95;
      const y = 0.916 + dy - frontFactor * (p >= 2 ? 0.016 : 0.004);
      posArr.push(x, y, z);
      uvArr.push(u, v);
    }
  }
  const stride = segs + 1;
  for (let p = 0; p < profile.length - 1; p += 1) {
    for (let i = 0; i < segs; i += 1) {
      const a = p * stride + i, b = a + 1, c = a + stride, d = c + 1;
      idx.push(a, c, d, a, d, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(posArr, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvArr, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

let sharedTorsoGeo: THREE.BufferGeometry | null = null;
let sharedLeftSleeveGeo: THREE.BufferGeometry | null = null;
let sharedRightSleeveGeo: THREE.BufferGeometry | null = null;
let sharedCollarGeo: THREE.BufferGeometry | null = null;

/** Stylized polo-shirt student models matching HAMIC & HUS uniforms in docs/assets. */
export function student(color: string, role: string, plain = false) {
  if (!sharedTorsoGeo) {
    sharedTorsoGeo = torsoLoftGeometry();
    sharedLeftSleeveGeo = sleeveGeometry(true);
    sharedRightSleeveGeo = sleeveGeometry(false);
    sharedCollarGeo = collarGeometry();
  }
  const kit: ShirtKit = role === "player" || role === "chief" ? "hamic" : role === "math" ? "hus" : "ussh";
  const tex = plain ? { base: color, torso: null, collar: null, leftSleeve: null, rightSleeve: null } : getKitTextures(kit, color);

  const g = new THREE.Group();
  const shirtSolid = new THREE.MeshLambertMaterial({ color: plain ? color : tex.base, emissive: plain ? color : tex.base, emissiveIntensity: 0.14 });
  const torsoMat = new THREE.MeshLambertMaterial({ color: plain ? color : "#ffffff", map: plain ? null : tex.torso, emissive: plain ? color : "#ffffff", emissiveMap: plain ? null : tex.torso, emissiveIntensity: 0.15 });
  const collarMat = new THREE.MeshLambertMaterial({ color: plain ? color : "#ffffff", map: plain ? null : tex.collar, emissive: plain ? color : "#ffffff", emissiveMap: plain ? null : tex.collar, emissiveIntensity: 0.15, side: THREE.DoubleSide });
  const leftSleeveMat = new THREE.MeshLambertMaterial({ color: plain ? color : "#ffffff", map: plain ? null : tex.leftSleeve, emissive: plain ? color : "#ffffff", emissiveMap: plain ? null : tex.leftSleeve, emissiveIntensity: 0.15 });
  const rightSleeveMat = new THREE.MeshLambertMaterial({ color: plain ? color : "#ffffff", map: plain ? null : tex.rightSleeve, emissive: plain ? color : "#ffffff", emissiveMap: plain ? null : tex.rightSleeve, emissiveIntensity: 0.15 });

  const pantsColor = kit === "hus" ? "#1b273d" : role === "chief" ? "#161d30" : "#1b2236";
  const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
  const shoeMat = new THREE.MeshLambertMaterial({ color: "#151b2e" });
  const soleMat = new THREE.MeshLambertMaterial({ color: "#eef2fc" });
  const skinMat = new THREE.MeshLambertMaterial({ color: "#f5e0d3", emissive: "#f5e0d3", emissiveIntensity: 0.06 });
  const hairMat = new THREE.MeshLambertMaterial({ color: role === "history" ? "#211b29" : "#161a2c" });
  const darkMat = new THREE.MeshLambertMaterial({ color: "#101424" });
  const whiteMat = new THREE.MeshLambertMaterial({ color: "#f7f9fe", emissive: "#ffffff", emissiveIntensity: 0.12 });

  const addMesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // Pelvis / hip bridge under polo hem
  const hip = addMesh(g, new THREE.CylinderGeometry(0.164, 0.154, 0.06, 20), pantsMat, 0, 0.46, 0);
  hip.scale.set(1, 1, 0.66);

  // Polo shirt torso + 3D collar + 3D front placket & 2 pearl buttons
  addMesh(g, sharedTorsoGeo!, torsoMat);
  addMesh(g, sharedCollarGeo!, collarMat);
  const placket = addMesh(g, new THREE.BoxGeometry(0.032, 0.130, 0.010), shirtSolid, 0, 0.805, 0.130);
  placket.rotation.x = -0.07;
  const buttonGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, 12);
  buttonGeo.rotateX(Math.PI / 2);
  addMesh(g, buttonGeo, whiteMat, 0, 0.836, 0.136);
  addMesh(g, buttonGeo, whiteMat, 0, 0.792, 0.138);

  // Articulated legs (hip pivot at y=0.47) + tailored trousers + sleek rounded sneakers
  const legRig = new THREE.Group();
  g.add(legRig);
  const thighGeo = new THREE.CylinderGeometry(0.068, 0.052, 0.39, 16);
  const hipCapGeo = new THREE.SphereGeometry(0.066, 12, 10);
  const shoeBodyGeo = new THREE.CapsuleGeometry(0.044, 0.070, 6, 12);
  shoeBodyGeo.rotateX(Math.PI / 2);
  const soleGeo = new THREE.CapsuleGeometry(0.047, 0.076, 4, 12);
  soleGeo.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.088, 0.47, 0);
    addMesh(leg, hipCapGeo, pantsMat, 0, 0, 0);
    addMesh(leg, thighGeo, pantsMat, 0, -0.195, 0);
    const shoe = addMesh(leg, shoeBodyGeo, shoeMat, 0, -0.422, 0.022);
    shoe.scale.set(1.02, 0.72, 1.0);
    const sole = addMesh(leg, soleGeo, soleMat, 0, -0.454, 0.022);
    sole.scale.set(1.04, 0.34, 1.02);
    legRig.add(leg);
  }

  // Arms: smooth sloped shoulders + short polo sleeves + bare forearms & hands
  const armRig = new THREE.Group();
  g.add(armRig);
  const shoulderCapGeo = new THREE.SphereGeometry(0.059, 16, 12);
  const forearmGeo = new THREE.CylinderGeometry(0.043, 0.036, 0.152, 14);
  const elbowGeo = new THREE.SphereGeometry(0.042, 10, 8);
  const handGeo = new THREE.SphereGeometry(0.041, 12, 10);
  const holdsProp = role !== "player";

  for (const sx of [-1, 1]) {
    const isLeft = sx === 1;
    const arm = new THREE.Group();
    arm.position.set(sx * 0.183, 0.840, 0);
    arm.rotation.z = sx * 0.15;
    const cap = addMesh(arm, shoulderCapGeo, shirtSolid, 0, 0, 0);
    cap.scale.set(1.0, 0.85, 0.95);
    addMesh(arm, isLeft ? sharedLeftSleeveGeo! : sharedRightSleeveGeo!, isLeft ? leftSleeveMat : rightSleeveMat);

    const lower = new THREE.Group();
    lower.position.set(0, -0.154, 0);
    // NPCs cradle the bottom-outer corner of their prop in their right(-X) hand without clipping through the front
    if (!isLeft && holdsProp) {
      arm.rotation.x = -0.18;
      arm.rotation.z = -0.10;
      lower.rotation.x = -0.76;
      lower.rotation.z = 0.14;
    }
    addMesh(lower, elbowGeo, skinMat, 0, 0, 0);
    addMesh(lower, forearmGeo, skinMat, 0, -0.075, 0);
    const hand = addMesh(lower, handGeo, skinMat, 0, -0.156, 0.004);
    hand.scale.set(0.90, 1.10, 0.78);
    arm.add(lower);
    armRig.add(arm);
  }

  // Neck, head & expressive open face (forehead & eyes unobstructed!)
  addMesh(g, new THREE.CylinderGeometry(0.055, 0.061, 0.11, 14), skinMat, 0, 0.965, 0);
  const head = addMesh(g, new THREE.SphereGeometry(0.168, 24, 20), skinMat, 0, 1.168, 0);
  head.scale.set(1.0, 1.05, 0.96);
  for (const sx of [-1, 1]) {
    const ear = addMesh(g, new THREE.SphereGeometry(0.031, 10, 8), skinMat, sx * 0.164, 1.156, -0.008);
    ear.scale.set(0.55, 1.0, 0.75);
    const eye = addMesh(g, new THREE.SphereGeometry(0.021, 12, 10), darkMat, sx * 0.060, 1.160, 0.152);
    eye.scale.set(0.92, 1.24, 0.55);
    addMesh(g, new THREE.SphereGeometry(0.007, 8, 6), whiteMat, sx * 0.060 + 0.006, 1.168, 0.162);
    const brow = addMesh(g, new THREE.BoxGeometry(0.040, 0.008, 0.010), hairMat, sx * 0.062, 1.202, 0.149);
    brow.rotation.z = sx * -0.08;
    brow.rotation.y = sx * 0.22;
  }
  const nose = addMesh(g, new THREE.SphereGeometry(0.013, 8, 6), skinMat, 0, 1.134, 0.163);
  nose.scale.set(0.9, 0.8, 1.1);

  // Tilted-back sculpted hair cap so front hairline sits cleanly ABOVE eyebrows while back covers nape
  const hairCap = addMesh(g, new THREE.SphereGeometry(0.178, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.54), hairMat, 0, 1.176, -0.008);
  hairCap.scale.set(1.02, 1.06, 1.00);
  hairCap.rotation.x = -0.44;
  // Soft parted front bangs framing top of forehead above eyebrows
  for (const [bx, by, bz, sx, sy, rz] of [
    [-0.076, 1.262, 0.128, 0.066, 0.036, 0.30],
    [-0.006, 1.272, 0.136, 0.072, 0.038, 0.06],
    [0.074, 1.262, 0.128, 0.064, 0.035, -0.32],
  ]) {
    const bang = addMesh(g, new THREE.SphereGeometry(1, 12, 10), hairMat, bx, by, bz);
    bang.scale.set(sx, sy, 0.042);
    bang.rotation.z = rz;
  }

  // Role-specific hair & story props
  if (role === "player") {
    // Member lanyard + ID card hugging chest slope below placket
    const strapMat = new THREE.MeshLambertMaterial({ color: "#68101e" });
    for (const sx of [-1, 1]) {
      const s = addMesh(g, new THREE.BoxGeometry(0.010, 0.165, 0.006), strapMat, sx * 0.030 - 0.022, 0.808, 0.124);
      s.rotation.z = sx * 0.19;
      s.rotation.x = -0.18;
    }
    const cardHolder = addMesh(g, new THREE.BoxGeometry(0.050, 0.066, 0.008), whiteMat, -0.024, 0.702, 0.135);
    cardHolder.rotation.z = 0.04;
    cardHolder.rotation.x = -0.04;
    const cardHeader = addMesh(g, new THREE.BoxGeometry(0.044, 0.015, 0.010), shirtSolid, -0.025, 0.723, 0.136);
    cardHeader.rotation.z = 0.04;
    cardHeader.rotation.x = -0.04;
  }
  if (role === "chief") {
    addMesh(g, new THREE.SphereGeometry(0.082, 16, 12), hairMat, 0, 1.312, -0.152);
    const tie = addMesh(g, new THREE.TorusGeometry(0.054, 0.011, 8, 18), shirtSolid, 0, 1.292, -0.126);
    tie.rotation.x = 0.65;
    for (const sx of [-1, 1]) {
      const lock = addMesh(g, new THREE.CapsuleGeometry(0.020, 0.082, 4, 8), hairMat, sx * 0.160, 1.132, 0.042);
      lock.rotation.z = sx * 0.08;
    }
  }
  if (role === "math") {
    const glassMat = new THREE.MeshLambertMaterial({ color: "#222b42" });
    for (const sx of [-1, 1]) {
      addMesh(g, new THREE.TorusGeometry(0.034, 0.0045, 8, 22), glassMat, sx * 0.061, 1.161, 0.159);
    }
    addMesh(g, new THREE.BoxGeometry(0.030, 0.005, 0.006), glassMat, 0, 1.165, 0.162);
  }
  if (role === "chief" || role === "math") {
    const screenColor = role === "chief" ? "#ffd25e" : "#5ad8ff";
    const screenMat = new THREE.MeshLambertMaterial({ color: screenColor, emissive: screenColor, emissiveIntensity: 0.42 });
    const tab = new THREE.Group();
    tab.position.set(-0.205, 0.692, 0.176);
    tab.rotation.set(-0.42, 0.28, 0.12);
    addMesh(tab, new THREE.BoxGeometry(0.165, 0.215, 0.015), darkMat);
    addMesh(tab, new THREE.BoxGeometry(0.142, 0.186, 0.005), screenMat, 0, 0, 0.008);
    g.add(tab);
  }
  if (role === "history") {
    for (const sx of [-1, 1]) {
      addMesh(g, new THREE.CapsuleGeometry(0.030, 0.098, 4, 8), hairMat, sx * 0.156, 1.112, 0.012);
    }
    const folderMat = new THREE.MeshLambertMaterial({ color: "#d8b480", emissive: "#d8b480", emissiveIntensity: 0.08 });
    const doc = new THREE.Group();
    doc.position.set(-0.206, 0.692, 0.172);
    doc.rotation.set(-0.38, 0.26, 0.12);
    addMesh(doc, new THREE.BoxGeometry(0.175, 0.23, 0.032), folderMat);
    addMesh(doc, new THREE.BoxGeometry(0.164, 0.22, 0.020), whiteMat, 0.007, 0.009, 0);
    addMesh(doc, new THREE.BoxGeometry(0.180, 0.016, 0.036), shirtSolid, 0, 0.015, 0);
    g.add(doc);
  }
  if (role === "stage") {
    const headsetBand = addMesh(g, new THREE.TorusGeometry(0.174, 0.007, 8, 24, Math.PI), darkMat, 0, 1.182, -0.01);
    headsetBand.rotation.x = -0.15;
    addMesh(g, new THREE.CylinderGeometry(0.024, 0.024, 0.020, 12), darkMat, -0.170, 1.155, -0.008).rotation.z = Math.PI / 2;
    const micBoom = addMesh(g, new THREE.BoxGeometry(0.005, 0.005, 0.105), darkMat, -0.152, 1.124, 0.062);
    micBoom.rotation.y = -0.35;
    const clip = new THREE.Group();
    clip.position.set(-0.205, 0.692, 0.174);
    clip.rotation.set(-0.40, 0.28, 0.12);
    addMesh(clip, new THREE.BoxGeometry(0.165, 0.22, 0.013), darkMat);
    addMesh(clip, new THREE.BoxGeometry(0.142, 0.186, 0.005), whiteMat, 0, -0.006, 0.007);
    addMesh(clip, new THREE.BoxGeometry(0.056, 0.020, 0.016), shirtSolid, 0, 0.095, 0.009);
    g.add(clip);
  }

  g.userData.legs = legRig;
  g.userData.arms = armRig;
  return g;
}

/** Dựng mô hình 3D thu nhỏ cho từng Easter Egg trong khuôn viên (giáo trình HUST, Toán cao cấp ĐHQGHN, Cục đá UET, Casio, v.v.). */
function buildEasterEggProp(egg: WalkEasterEgg): { prop: THREE.Group; ring: THREE.Mesh } {
  const g = new THREE.Group();
  const addMesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const wood = new THREE.MeshLambertMaterial({ color: "#6e4b2e" });
  const darkWood = new THREE.MeshLambertMaterial({ color: "#4a321e" });
  const paper = new THREE.MeshLambertMaterial({ color: "#f6f2e4", emissive: "#ffd25e", emissiveIntensity: 0.12 });
  const gold = new THREE.MeshBasicMaterial({ color: "#ffd25e" });
  const slate = new THREE.MeshLambertMaterial({ color: "#1c2338" });

  if (egg.kind === "uet_rock") {
    // White, irregular monolith and two inset inscriptions, following docs/assets/UET_*.
    const stone = new THREE.MeshLambertMaterial({ color: "#eeeade", flatShading: true });
    const outline = new THREE.Shape();
    outline.moveTo(-.22, 0); outline.lineTo(-.24, .16); outline.lineTo(-.17, .39);
    outline.lineTo(-.11, .53); outline.lineTo(.03, .51); outline.lineTo(.13, .39);
    outline.lineTo(.22, .41); outline.lineTo(.25, .25); outline.lineTo(.23, .02); outline.closePath();
    const geo = new THREE.ExtrudeGeometry(outline, { depth: .25, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 1, steps: 1 });
    addMesh(g, geo, stone, 0, .015, -.13);
    const plaque = (key: string, width: number, height: number) => {
      const [c, ctx] = makeCanvas(512, 640); ctx.fillStyle = "#eeeade"; ctx.fillRect(0, 0, 512, 640);
      ctx.fillStyle = "#154c79"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const lines = t(key).split("\n");
      lines.forEach((line, i) => { ctx.font = `${i === 0 ? 600 : 800} ${i === 0 ? 28 : 54}px "Be Vietnam Pro"`; ctx.fillText(line, 256, 100 + i * 118, 470); });
      return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: toTex(c) }));
    };
    const front = plaque("story.prop.uet.name", .28, .31); front.position.set(-.03, .24, .148); g.add(front);
    const side = plaque("story.prop.uet.motto", .19, .27); side.rotation.y = Math.PI / 2; side.position.set(.255, .23, 0); g.add(side);

  } else {
    // Bàn/bục gỗ trưng bày nhỏ cho các kỷ vật trong phòng/căng-tin
    addMesh(g, new THREE.BoxGeometry(0.28, 0.022, 0.20), wood, 0, 0.11, 0);
    for (const [lx, lz] of [[-0.11, -0.07], [0.11, -0.07], [-0.11, 0.07], [0.11, 0.07]]) {
      addMesh(g, new THREE.BoxGeometry(0.022, 0.11, 0.022), darkWood, lx, 0.055, lz);
    }
    if (egg.kind === "book_red") {
      // Actual blue cover supplied by the user; no publisher crest is recreated in geometry.
      const cover = new THREE.MeshLambertMaterial({ color: "#154c79" });
      const book = new THREE.Group(); book.position.set(0, .30, 0); book.rotation.x = -.14;
      addMesh(book, new THREE.BoxGeometry(.23, .32, .04), paper);
      for (const z of [-.023, .023]) addMesh(book, new THREE.BoxGeometry(.245, .335, .006), cover, 0, 0, z);
      addMesh(book, new THREE.BoxGeometry(.014, .335, .05), cover, -.12);
      if (egg.texture) {
        const texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${egg.texture}`); texture.colorSpace = THREE.SRGBColorSpace;
        addMesh(book, new THREE.PlaneGeometry(.245, .335), new THREE.MeshBasicMaterial({ map: texture }), 0, 0, .027);
      }
      g.add(book);
    } else if (egg.kind === "book_stack") {
      // Bộ 3 cuốn Toán cao cấp ĐHQGHN xếp chồng
      const colors = ["#154c79", "#1e81b0", "#5ad8ff"];
      colors.forEach((col, idx) => {
        const bMat = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.18 });
        const bk = addMesh(g, new THREE.BoxGeometry(0.14, 0.026, 0.17), bMat, 0, 0.135 + idx * 0.028, 0);
        bk.rotation.y = (idx - 1) * 0.18;
      });
    } else if (egg.kind === "casio") {
      // Máy tính bỏ túi Casio fx-580VN X màn hình sáng xanh
      addMesh(g, new THREE.BoxGeometry(0.11, 0.018, 0.17), slate, 0, 0.13, 0);
      addMesh(g, new THREE.BoxGeometry(0.085, 0.006, 0.045), new THREE.MeshBasicMaterial({ color: "#5ad8ff" }), 0, 0.14, -0.045);
      addMesh(g, new THREE.BoxGeometry(0.085, 0.004, 0.085), paper, 0, 0.14, 0.03);
    } else if (egg.kind === "chronicle") {
      // Kỷ yếu Tổng hợp 1956 mở hai trang + đèn đọc sách vàng
      addMesh(g, new THREE.BoxGeometry(0.18, 0.014, 0.14), darkWood, 0, 0.128, 0);
      addMesh(g, new THREE.BoxGeometry(0.082, 0.018, 0.125), paper, -0.044, 0.136, 0);
      addMesh(g, new THREE.BoxGeometry(0.082, 0.018, 0.125), paper, 0.044, 0.136, 0);
      addMesh(g, new THREE.SphereGeometry(0.024, 10, 8), gold, 0, 0.21, -0.05);
    } else if (egg.kind === "iced_tea") {
      // 2 ly trà đá + tờ nháp bí kíp qua môn
      const teaMat = new THREE.MeshLambertMaterial({ color: "#f5b041", emissive: "#ffd25e", emissiveIntensity: 0.25 });
      addMesh(g, new THREE.BoxGeometry(0.13, 0.005, 0.15), paper, -0.02, 0.124, 0.01);
      addMesh(g, new THREE.CylinderGeometry(0.026, 0.020, 0.065, 12), teaMat, -0.04, 0.155, -0.01);
      addMesh(g, new THREE.CylinderGeometry(0.026, 0.020, 0.065, 12), teaMat, 0.045, 0.155, 0.02);
    } else if (egg.kind === "prism") {
      const glass = new THREE.MeshLambertMaterial({ color: "#b8ebff", emissive: "#5ad8ff", emissiveIntensity: 0.32 });
      const pr = addMesh(g, new THREE.CylinderGeometry(0.055, 0.055, 0.13, 3), glass, -0.02, 0.155, 0);
      pr.rotation.z = Math.PI / 2;
      ["#ff7b7b", "#ffd25e", "#5eeaa0", "#5ad8ff"].forEach((col, idx) => {
        addMesh(g, new THREE.BoxGeometry(0.075, 0.006, 0.012), new THREE.MeshBasicMaterial({ color: col }), 0.07, 0.132 + idx * 0.008, -0.024 + idx * 0.016);
      });
    } else if (egg.kind === "logbook") {
      const navy = new THREE.MeshLambertMaterial({ color: "#1a3b6e" });
      addMesh(g, new THREE.BoxGeometry(0.19, 0.016, 0.145), navy, 0, 0.129, 0);
      addMesh(g, new THREE.BoxGeometry(0.086, 0.016, 0.13), paper, -0.045, 0.139, 0);
      addMesh(g, new THREE.BoxGeometry(0.086, 0.016, 0.13), paper, 0.045, 0.139, 0);
      addMesh(g, new THREE.BoxGeometry(0.012, 0.008, 0.15), gold, 0, 0.146, 0.01);
      addMesh(g, new THREE.CylinderGeometry(0.008, 0.008, 0.11, 8), gold, 0.08, 0.145, -0.03);
    } else if (egg.kind === "duck") {
      const duckYellow = new THREE.MeshLambertMaterial({ color: "#ffd25e", emissive: "#ffd25e", emissiveIntensity: 0.25 });
      const beakMat = new THREE.MeshLambertMaterial({ color: "#ff7b54", emissive: "#ff7b54", emissiveIntensity: 0.2 });
      const body = addMesh(g, new THREE.SphereGeometry(0.056, 12, 10), duckYellow, 0, 0.152, 0);
      body.scale.set(1.2, 0.86, 0.95);
      addMesh(g, new THREE.SphereGeometry(0.038, 12, 10), duckYellow, 0.045, 0.198, 0);
      const beak = addMesh(g, new THREE.BoxGeometry(0.034, 0.012, 0.026), beakMat, 0.082, 0.192, 0);
      beak.rotation.z = -0.08;
    } else if (egg.kind === "chalk_board") {
      const boardGreen = new THREE.MeshLambertMaterial({ color: "#1d4d3e", emissive: "#5eeaa0", emissiveIntensity: 0.1 });
      const brd = addMesh(g, new THREE.BoxGeometry(0.20, 0.13, 0.014), boardGreen, 0, 0.19, -0.02);
      brd.rotation.x = -0.18;
      ["#eef1fb", "#ffd25e", "#5ad8ff"].forEach((col, idx) => {
        addMesh(g, new THREE.CylinderGeometry(0.006, 0.006, 0.045, 6), new THREE.MeshBasicMaterial({ color: col }), -0.04 + idx * 0.04, 0.128, 0.045);
      });
    } else if (egg.kind === "survey_stack") {
      addMesh(g, new THREE.BoxGeometry(0.13, 0.038, 0.16), paper, -0.035, 0.14, 0);
      addMesh(g, new THREE.BoxGeometry(0.11, 0.012, 0.15), darkWood, 0.055, 0.128, 0.01);
      addMesh(g, new THREE.BoxGeometry(0.095, 0.006, 0.13), paper, 0.055, 0.136, 0.01);
      addMesh(g, new THREE.BoxGeometry(0.04, 0.008, 0.018), gold, 0.055, 0.14, -0.05);
    } else if (egg.kind === "cipher_disk") {
      const brass = new THREE.MeshLambertMaterial({ color: "#d4a23a", emissive: "#ffd25e", emissiveIntensity: 0.2 });
      addMesh(g, new THREE.CylinderGeometry(0.082, 0.082, 0.014, 24), brass, -0.02, 0.128, 0);
      addMesh(g, new THREE.CylinderGeometry(0.056, 0.056, 0.018, 24), slate, -0.02, 0.136, 0);
      addMesh(g, new THREE.CylinderGeometry(0.016, 0.016, 0.024, 12), gold, -0.02, 0.144, 0);
      addMesh(g, new THREE.BoxGeometry(0.075, 0.014, 0.11), paper, 0.075, 0.128, 0.01);
    } else if (egg.kind === "old_map") {
      const parchment = new THREE.MeshLambertMaterial({ color: "#ead9b5", emissive: "#ffd25e", emissiveIntensity: 0.14 });
      addMesh(g, new THREE.BoxGeometry(0.21, 0.006, 0.15), parchment, 0, 0.125, 0.005);
      const roll = addMesh(g, new THREE.CylinderGeometry(0.016, 0.016, 0.21, 12), parchment, 0, 0.136, -0.068);
      roll.rotation.z = Math.PI / 2;
      addMesh(g, new THREE.SphereGeometry(0.012, 8, 8), gold, -0.04, 0.135, 0.02);
      addMesh(g, new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: "#5ad8ff" }), 0.05, 0.135, -0.01);
    } else if (egg.kind === "cat") {
      // Giáo sư Mèo Vàng nằm cuộn tròn trên bàn đầu Nhà T5
      const catMat = new THREE.MeshLambertMaterial({ color: "#f4a236", emissive: "#ffd25e", emissiveIntensity: 0.18 });
      const body = addMesh(g, new THREE.SphereGeometry(0.065, 12, 10), catMat, 0, 0.155, 0);
      body.scale.set(1.25, 0.78, 1.0);
      addMesh(g, new THREE.SphereGeometry(0.044, 12, 10), catMat, 0.055, 0.185, 0.01);
      addMesh(g, new THREE.ConeGeometry(0.016, 0.032, 4), catMat, 0.055, 0.228, -0.015);
      addMesh(g, new THREE.ConeGeometry(0.016, 0.032, 4), catMat, 0.055, 0.228, 0.035);
    } else {
      // Máy chữ cổ & Cuộn phim tư liệu
      const silver = new THREE.MeshLambertMaterial({ color: "#b8c2db", emissive: "#5ad8ff", emissiveIntensity: 0.15 });
      const reel = addMesh(g, new THREE.CylinderGeometry(0.055, 0.055, 0.018, 16), silver, -0.05, 0.132, 0);
      reel.rotation.x = Math.PI / 2;
      addMesh(g, new THREE.BoxGeometry(0.095, 0.045, 0.085), slate, 0.045, 0.145, 0);
      addMesh(g, new THREE.BoxGeometry(0.065, 0.055, 0.006), paper, 0.045, 0.185, -0.02);
    }
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.195, 24),
    new THREE.MeshBasicMaterial({ color: egg.color || "#ffd25e", side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.018;
  g.add(ring);
  return { prop: g, ring };
}

export function initWalking(scene: THREE.Scene, map: MapData, convert: typeof point, label: (text: string) => THREE.Sprite, loader: typeof loadRoom) {
  loadRoom = loader;
  data = map; point = convert; group = new THREE.Group(); group.name = "walking"; group.visible = false; scene.add(group);
  for (const n of map.walk.nodes) nodes.set(n.id, point(n.x, n.z));
  const pathMat = new THREE.LineBasicMaterial({ color: "#ffd25e", transparent: true, opacity: .35 });
  for (const [a, b] of map.walk.edges) {
    const geo = new THREE.BufferGeometry().setFromPoints([nodes.get(a)!.clone().setY(.08), nodes.get(b)!.clone().setY(.08)]);
    group.add(new THREE.Line(geo, pathMat));
  }
  const scale = map.walk.avatar.height * map.scale / map.walk.avatar.modelHeight;
  player = student("#ffd25e", "player"); player.scale.setScalar(scale); group.add(player);
  legs.push(player.userData.legs); arms.push(player.userData.arms);
  playerRing = new THREE.Mesh(new THREE.RingGeometry(.10, .125, 24), new THREE.MeshBasicMaterial({ color: "#ffd25e", side: THREE.DoubleSide }));
  playerRing.rotation.x = -Math.PI / 2; group.add(playerRing);
  for (const npc of map.walk.characters) {
    const g = student(npc.color, npc.role, npc.plain);
    g.scale.setScalar(scale);
    g.position.copy(nodes.get(npc.node)!).add(new THREE.Vector3((npc.offset?.[0] ?? 2.5) * map.scale, 0, (npc.offset?.[1] ?? 0) * map.scale));
    const tag = label(t(npc.name)); tag.position.copy(g.position).y = map.walk.avatar.height * map.scale + .10; tag.scale.multiplyScalar(.18); group.add(tag); nameTags.push(tag);
    group.add(g); actors.push(g);
  }
  for (const egg of map.walk.easterEggs ?? []) {
    const { prop, ring } = buildEasterEggProp(egg);
    prop.position.copy(point(egg.x, egg.z));
    const tag = label(`★ ${t(egg.title)}`);
    tag.position.copy(prop.position).y = 0.28;
    tag.scale.multiplyScalar(0.11);
    tag.visible = false;
    group.add(prop, tag);
    eggActors.push(prop);
    eggTags.push(tag);
    eggRings.push(ring);
  }
  crowd = new CampusCrowd(scene, map, point);
  marker = new THREE.Mesh(new THREE.TorusGeometry(.32, .018, 5, 32), new THREE.MeshBasicMaterial({ color: "#ffd25e" }));
  marker.rotation.x = -Math.PI / 2; group.add(marker);
}

/** Đặt NPC theo chương (story.json → npcs[].chapters). Thiếu thì giữ vị trí mặc định trong map.json. */
export function placeCharacters(places: Record<string, { node: string; offset?: [number, number] }>) {
  data.walk.characters.forEach((c, i) => {
    const place = places[c.id] ?? { node: c.node, offset: c.offset };
    const base = nodes.get(place.node);
    if (!base) return;
    actors[i].position.copy(base).add(new THREE.Vector3((place.offset?.[0] ?? 2.5) * data.scale, 0, (place.offset?.[1] ?? 0) * data.scale));
    nameTags[i].position.copy(actors[i].position).y = data.walk.avatar.height * data.scale + .10;
  });
}

/** Đèn lối đi: một cột nhỏ ở mỗi node; đèn đã thắp sáng vàng, chưa thắp màu xám. Không nhấp nháy. */
export function setLamps(ids: readonly string[], lit: readonly string[]) {
  if (!lampPosts.size) {
    const poleGeo = new THREE.CylinderGeometry(.012, .016, .42, 6), bulbGeo = new THREE.SphereGeometry(.045, 12, 8), haloGeo = new THREE.SphereGeometry(.11, 12, 8);
    const poleMat = new THREE.MeshBasicMaterial({ color: "#3a4060" });
    for (const id of ids) {
      const base = nodes.get(id);
      if (!base) continue;
      const g = new THREE.Group();
      g.position.copy(base).add(new THREE.Vector3(-1.8 * data.scale, 0, -1.8 * data.scale));
      const pole = new THREE.Mesh(poleGeo, poleMat); pole.position.y = .21;
      const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: "#6f789a" })); bulb.position.y = .45;
      const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: "#ffd25e", transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.y = .45;
      g.add(pole, bulb, halo); group.add(g);
      lampPosts.set(id, { bulb, halo });
    }
  }
  for (const [id, post] of lampPosts) {
    const on = lit.includes(id);
    (post.bulb.material as THREE.MeshBasicMaterial).color.set(on ? "#ffd25e" : "#6f789a");
    post.halo.visible = on;
  }
}

export function walkMode(on: boolean) {
  if (!on) exitBuilding();
  enabled = on; group.visible = on; axis.set(0, 0); route = []; paused = false;
  if (on) { if (!pos) pos = nodes.get(data.walk.spawn)!.clone(); player.position.copy(pos); }
}
export function setWalkingLow(low: boolean) { crowd?.setLow(low); }
export function resetWalkPosition() {
  exitBuilding();
  pos = nodes.get(data.walk.spawn)!.clone();
  player.position.copy(pos); route = []; axis.set(0, 0);
}
/** Đặt người chơi ngay tại một node (Hack mode và kiểm thử tự động). */
export function teleportTo(id: string) {
  exitBuilding();
  const n = nodes.get(id); if (!n) return;
  pos = n.clone(); player.position.copy(pos); route = []; axis.set(0, 0);
}
/** Đặt người chơi ngay tại tọa độ bản đồ (mx, mz) bất kỳ (kiểm thử vào tòa nhà / Easter Egg). */
export function teleportToPoint(mx: number, mz: number) {
  if (!point) return;
  exitBuilding();
  pos = point(mx, mz); player.position.copy(pos); route = []; axis.set(0, 0);
}
/** Kiểm tra người chơi có đang đứng trong lòng một tòa nhà hay giảng đường không. */
export function buildingAtPosition(p: THREE.Vector3 | null = pos): MapBuilding | null {
  return activeBuilding;
}
export function setFoundEggs(ids: readonly string[]) {
  (data?.walk.easterEggs ?? []).forEach((egg, i) => {
    const ring = eggRings[i];
    if (!ring) return;
    const found = ids.includes(egg.id);
    (ring.material as THREE.MeshBasicMaterial).color.set(found ? "#5eeaa0" : (egg.color || "#ffd25e"));
  });
}
export function nearEasterEgg(id: string) {
  const eggs = data?.walk.easterEggs ?? [];
  const index = eggs.findIndex((e) => e.id === id);
  return !!pos && index >= 0 && eggActors[index].visible && pos.distanceTo(eggActors[index].position) <= (activeBuilding ? 1.6 : data.walk.avatar.talkDistance * data.scale);
}
export function nearbyEasterEgg(): WalkEasterEgg | null {
  if (!enabled || !pos) return null;
  const eggs = data.walk.easterEggs ?? [];
  return eggs
    .filter((e) => nearEasterEgg(e.id))
    .sort((a, b) => {
      const pa = eggActors[eggs.indexOf(a)].position;
      const pb = eggActors[eggs.indexOf(b)].position;
      return pos!.distanceToSquared(pa) - pos!.distanceToSquared(pb);
    })[0] ?? null;
}
export function easterEggAtScreen(camera: THREE.Camera, x: number, y: number, width: number, height: number) {
  const eggs = data?.walk.easterEggs ?? [];
  let best: string | null = null, distance = 28;
  eggs.forEach((egg, i) => {
    if (!nearEasterEgg(egg.id)) return;
    projected.copy(eggActors[i].position).y += 0.18;
    projected.project(camera);
    if (projected.z < -1 || projected.z > 1) return;
    const sx = ((projected.x + 1) * width) / 2;
    const sy = ((1 - projected.y) * height) / 2;
    const d = Math.hypot(sx - x, sy - y);
    if (d < distance) { distance = d; best = egg.id; }
  });
  return best;
}
export function requestEasterEggInteraction(id: string) {
  if (nearEasterEgg(id)) for (const fn of eggInteractionListeners) fn(id);
}
export function onEasterEggInteraction(fn: (id: string) => void) {
  eggInteractionListeners.add(fn);
  return () => { eggInteractionListeners.delete(fn); };
}
export function pauseWalk(on: boolean) { paused = on; axis.set(0, 0); }
export function walkAxis(x: number, z: number) { axis.set(x, z); if (x || z) route = []; }
export function walkTarget(id: string) { marker.position.copy(nodes.get(id)!).y = .12; }
export function nearNode(id: string) { return !activeBuilding && !!pos && pos.distanceTo(nodes.get(id)!) < data.walk.avatar.talkDistance * data.scale; }
export function nearCharacter(id: string) {
  const index = data.walk.characters.findIndex((c) => c.id === id);
  return !activeBuilding && !!pos && index >= 0 && pos.distanceTo(actors[index].position) <= data.walk.avatar.talkDistance * data.scale;
}
export function nearbyCharacter(preferred?: string): WalkCharacter | null {
  if (!enabled || !pos) return null;
  if (preferred && nearCharacter(preferred)) return data.walk.characters.find((c) => c.id === preferred)!;
  return data.walk.characters.filter((c) => nearCharacter(c.id)).sort((a, b) => {
    const pa = actors[data.walk.characters.indexOf(a)].position, pb = actors[data.walk.characters.indexOf(b)].position;
    return pos!.distanceToSquared(pa) - pos!.distanceToSquared(pb);
  })[0] ?? null;
}
export function characterAtScreen(camera: THREE.Camera, x: number, y: number, width: number, height: number) {
  let best: string | null = null, distance = 26;
  for (const npc of characterScreenPositions(camera, width, height)) {
    if (!npc.near || !npc.visible) continue;
    const d = Math.hypot(npc.x - x, npc.y - y);
    if (d < distance) { distance = d; best = npc.id; }
  }
  return best;
}
export function characterScreenPositions(camera: THREE.Camera, width: number, height: number) {
  return actors.map((actor, i) => {
    projected.copy(actor.position).y += data.walk.avatar.height * data.scale * .6;
    projected.project(camera);
    return { id: data.walk.characters[i].id, x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2, visible: !activeBuilding && projected.z >= -1 && projected.z <= 1, near: nearCharacter(data.walk.characters[i].id) };
  });
}
export function requestCharacterInteraction(id: string) { if (nearCharacter(id)) for (const fn of interactionListeners) fn(id); }
export function onCharacterInteraction(fn: (id: string) => void) { interactionListeners.add(fn); return () => { interactionListeners.delete(fn); }; }
export function walkPosition() { return pos?.clone(); }
export function walkingEnabled() { return enabled; }
export function setPlayerOccluded(on: boolean) {
  if (on === playerOccluded) return;
  playerOccluded = on;
  player.traverse((o) => {
    const mesh = o as THREE.Mesh; if (!mesh.isMesh) return;
    mesh.renderOrder = on ? 30 : 0;
    const mat = mesh.material as THREE.MeshLambertMaterial;
    mat.transparent = on; mat.depthTest = !on; mat.depthWrite = !on; mat.needsUpdate = true;
  });
  playerRing.renderOrder = on ? 40 : 0;
  const ringMat = playerRing.material as THREE.MeshBasicMaterial;
  ringMat.transparent = on; ringMat.depthTest = !on; ringMat.depthWrite = !on;
}
export function walkingMetrics() { return { characterHeight: data.walk.avatar.height * data.scale, sceneScale: data.scale, modelHeight: new THREE.Box3().setFromObject(player).getSize(new THREE.Vector3()).y, enabled, paused, route: route.length, crowd: crowd.count, questActors: actors.length }; }

/** Walk the shortest route through the authored campus paths, including the canteen crossing. */
export function walkTo(id: string) {
  if (activeBuilding) exitBuilding();
  if (!pos) return;
  const target = nodes.get(id); if (target) route = outdoorRoute(pos, target);
}

/** Walk directly to any map coordinate (x, z) in open-world campus bounds. */
export function walkToPoint(mx: number, mz: number) {
  if (!pos) return;
  if (activeBuilding) return;
  const cx = Math.max(-245, Math.min(245, mx));
  const cz = Math.max(-240, Math.min(25, mz));
  const target = point(cx, cz);
  if (allowed(target)) route = outdoorRoute(pos, target);
}

/** Walk directly to a 3D world-space coordinate (wx, wz) on the ground plane. */
export function walkToWorldPoint(wx: number, wz: number) {
  if (!pos || !data) return;
  if (activeBuilding) { const target = new THREE.Vector3(wx, 0, wz); if (allowed(target)) route = outdoorRoute(pos, target); return; }
  const mx = wx / data.scale + data.origin[0];
  const mz = wz / data.scale + data.origin[1];
  walkToPoint(mx, mz);
}

let outdoorNavigation: Navigation | null = null, indoorNavigation: Navigation | null = null;
export function installCampusCollision(source: { player_radius: number; solids: { id: string; min: number[]; max: number[] }[] }) {
  const walls = source.solids.filter(s => s.max[1] > .2 && s.min[1] < 1.7).map(s => ({
    x: point((s.min[0]+s.max[0])/2,0).x, z: point(0,(s.min[2]+s.max[2])/2).z,
    w:(s.max[0]-s.min[0])*data.scale,d:(s.max[2]-s.min[2])*data.scale
  }));
  for(const b of data.buildings)for(const r of b.entryBarriers??[])walls.push({x:point((r[0]+r[2])/2,0).x,z:point(0,(r[1]+r[3])/2).z,w:(r[2]-r[0])*data.scale,d:(r[3]-r[1])*data.scale});
  outdoorNavigation = new Navigation(walls, source.player_radius*data.scale, .06, {
    x0:point(-245,0).x,x1:point(245,0).x,z0:point(0,-240).z,z1:point(0,25).z
  });
}
function navigation() { return activeBuilding ? indoorNavigation : outdoorNavigation; }
function allowed(p: THREE.Vector3) { return navigation()?.allowed(p.x,p.z) ?? false; }
function clearSegment(a: THREE.Vector3,b: THREE.Vector3) { return navigation()?.clear(a,b) ?? false; }
function outdoorRoute(start: THREE.Vector3,target: THREE.Vector3) {
  return (navigation()?.path(start,target) ?? []).map(p=>new THREE.Vector3(p.x,0,p.z));
}
function move(delta: THREE.Vector3) {
  const steps = Math.max(1, Math.ceil(delta.length() / (activeBuilding ? .15 : .025))); delta.multiplyScalar(1 / steps);
  for (let i = 0; i < steps; i++) {
    const next = pos!.clone(); next.x += delta.x; if (allowed(next)) pos!.x = next.x;
    next.copy(pos!); next.z += delta.z; if (allowed(next)) pos!.z = next.z;
  }
}
function placeEggActor(ea: THREE.Group, egg: WalkEasterEgg) {
  if (!activeBuilding) {
    ea.visible = !egg.building;
    if (ea.visible) ea.position.copy(point(egg.x, egg.z));
    return;
  }
  if (!room) { ea.visible = false; return; }
  if (activeRoom) {
    ea.visible = egg.building === activeRoom.building && egg.room === activeRoom.num;
    if (ea.visible) ea.position.set(ROOM_ORIGIN + (egg.roomPos?.[0] ?? room.exhibit[0]), 0, egg.roomPos?.[1] ?? room.exhibit[1]);
    return;
  }
  if (egg.room || !egg.building) { ea.visible = false; return; }
  if (egg.building === activeBuilding.id) {
    ea.visible = true;
    ea.position.set(ROOM_ORIGIN + room.exhibit[0], 0, room.exhibit[1]);
    return;
  }
  if (room.connectedBuildings?.includes(egg.building) && room.sourceCenter) {
    const eb = data.buildings.find((b) => b.id === egg.building);
    const door = eb?.entrance ? room.entrances?.find((d) => Math.hypot(d.position[0] - eb.entrance![0], d.position[1] - eb.entrance![1]) < 0.05) : undefined;
    if (eb?.entrance && door) {
      const [cx, cz] = room.sourceCenter;
      const inward = door.side.startsWith("+") ? -2.5 : 2.5;
      const ex = eb.entrance[0] - cx + (door.side.endsWith("x") ? inward : 0) + 0.9;
      const ez = eb.entrance[1] - cz + (door.side.endsWith("z") ? inward : 0);
      ea.visible = true;
      ea.position.set(ROOM_ORIGIN + ex, 0, ez);
      return;
    }
  }
  ea.visible = false;
}
export function nearbyDroneStation() {
  if (!enabled || !pos || activeBuilding) return null;
  for (const st of data.drone.stations) {
    const node = data.walk.nodes.find((n) => n.id === st.node);
    if (!node) continue;
    const base = point(node.x + st.offset[0], node.z + st.offset[1]);
    if (pos.distanceTo(base) <= 5.5 * data.scale) return st;
  }
  return null;
}
export function nearbyBoardBuilding(): MapBuilding | null {
  if (!enabled || !pos) return null;
  if (activeBuilding) {
    if (activeRoom) return null;
    const secId = roomState().section?.building;
    const b = (secId ? data.buildings.find((x) => x.id === secId || secId.startsWith(`${x.id}_`)) : null) ?? activeBuilding;
    return b.boardTitle ? b : null;
  }
  for (const b of data.buildings) {
    if (b.enterable || !b.boardTitle) continue;
    const shortId = b.id.split("_")[1]?.toLowerCase();
    if (shortId && nearNode(shortId)) return b;
  }
  return null;
}
export function updateWalking(dt: number, time: number, reduceMotion: boolean): THREE.Vector3 | null {
  if (!enabled || !pos) return null;
  if (!activeBuilding) crowd.update(dt, reduceMotion);
  const before = pos.clone();
  const speed = activeBuilding && room ? room.moveSpeed : data.walk.avatar.speed * data.scale;
  player.scale.setScalar(data.walk.avatar.height * (activeBuilding ? 1 : data.scale) / data.walk.avatar.modelHeight);
  if (!paused && !loadingRoom) {
    if (axis.lengthSq()) {
      const step = axis.clone().normalize().multiplyScalar(dt * speed * Math.min(1, axis.length()));
      move(new THREE.Vector3(step.x, 0, step.y));
    } else if (route.length) {
      const d = pos.distanceTo(route[0]);
      move(route[0].clone().sub(pos).multiplyScalar(Math.min(1, dt * speed / Math.max(d, .00001))));
      if (pos.distanceTo(route[0]) < .03) route.shift();
      else if (pos.distanceToSquared(before) < .000001) route = [];
    }
  }
  const motion = pos.clone().sub(before);
  player.position.copy(pos);
  playerRing.position.copy(pos).y = .015;
  const moving = !reduceMotion && motion.lengthSq() > .000001;
  if (motion.lengthSq() > .000001) player.rotation.y = Math.atan2(motion.x, motion.z);
  for (const rig of legs) rig.children.forEach((l, i) => { l.rotation.x = moving ? Math.sin(time * 12 + i * Math.PI) * .55 : 0; });
  for (const rig of arms) rig.children.forEach((a, i) => { a.rotation.x = moving ? Math.sin(time * 12 + (1 - i) * Math.PI) * .30 : 0; });
  actors.forEach((a, i) => {
    a.visible = !activeBuilding;
    a.rotation.y = Math.atan2(pos!.x - a.position.x, pos!.z - a.position.z);
    nameTags[i].visible = !activeBuilding && pos!.distanceTo(a.position) < 3;
  });
  marker.visible = !activeBuilding;
  eggActors.forEach((ea, i) => {
    const egg = data.walk.easterEggs![i];
    placeEggActor(ea, egg);


    eggTags[i].position.copy(ea.position).y = .5;
    eggTags[i].visible = ea.visible && pos!.distanceTo(ea.position) < 2.6;
  });
  return pos;
}
