/**
 * The light sandbox: the USSH × HUS campus at night (map data in public/data/map.json, model built
 * by scripts/build-map.mjs from legacy/campus). Each circuit has an anchor building with a crystal
 * beacon on its roof; lighting a circuit lights that building and its beacon. Circuit 7 is the core
 * above the HUS lawn, which grows brighter with every lit circuit. The Đêm Hội tụ show (GDD 4.7)
 * plays over the lawn: fireworks, beams from every lit building meeting above the core, drones
 * forming "70".
 *
 * Positions, sizes and names are estimates in game units, not a survey (map.json → mapVerified).
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { frameRoom } from "./room-camera";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { MapData } from "../core/data";
import { initWalking, updateWalking, walkingEnabled, characterAtScreen, characterScreenPositions, requestCharacterInteraction, setPlayerOccluded, setWalkingLow, walkToWorldPoint, buildingAtPosition, easterEggAtScreen, requestEasterEggInteraction, roomState, installCampusCollision } from "./walking";
import { Atmosphere } from "./atmosphere";
import { BuildingOcclusion } from "./occlusion";
import type { EndingId } from "../puzzles/logic/story";
import { t } from "../core/i18n";
import { glowTexture } from "./textures";
import { fireworkBouquets } from "./fireworks";
import { buildDroneModel, createDrone, type Drone } from "./drone";
import { endingImpact } from "./ending-impact";
import { createEndingSound, type EndingSound } from "../core/ending-audio";

export interface WorldOptions { low: boolean; reduceLights: boolean; reduceMotion: boolean; offline?: boolean }

const TAU = Math.PI * 2;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let map: MapData;
let opts: WorldOptions = { low: false, reduceLights: false, reduceMotion: false };
let orbit = 0.9;
let focusId: number | null = null;
const camGoal = new THREE.Vector3();
const lookGoal = new THREE.Vector3();
const look = new THREE.Vector3();
let atmosphere: Atmosphere;
let occlusion: BuildingOcclusion | null = null;
let cameraDistance = 0;
let glow: THREE.Texture;
let core: THREE.Mesh, coreHalo: THREE.Sprite, ringMesh: THREE.Mesh, coreLight: THREE.PointLight | null = null;
let corePos = new THREE.Vector3();
let motes: THREE.Points;
let stars: THREE.Points;
let campus: THREE.Group | null = null;
const lampMats: THREE.MeshLambertMaterial[] = [];
const labels: THREE.Sprite[] = [];
let loadedRoom: Awaited<ReturnType<typeof import("./interiors").buildRoom>> | null = null;
const hiddenOutside = new Map<THREE.Object3D, boolean>();
let indoorBlend = 0;
let currentInsideBuilding: string | null = null;
let currentInteriorRoot: string | null = null;

/** Accept both the original blockout extras and the optimized map builder's group extras. */
function modelGroup(obj: THREE.Object3D): string {
  let p: THREE.Object3D | null = obj;
  while (p) {
    if (typeof p.userData.building_id === "string") return p.userData.building_id;
    const group = p.userData.group;
    if (typeof group === "string") return p.userData.campus && !group.startsWith(`${p.userData.campus}_`) ? `${p.userData.campus}_${group}` : group;
    if (p.name.startsWith("tree")) return "trees";
    p = p.parent;
  }
  return "";
}

/** Lambert (not PBR) for the campus: one light model, cheap enough for phones. */
function nightMaterial(src: THREE.MeshStandardMaterial, tint: THREE.Color) {
  return new THREE.MeshLambertMaterial({ color: src.color.clone().multiply(tint), name: src.name });
}

type Beacon = {
  crystal: THREE.Mesh; halo: THREE.Sprite; beam: THREE.Mesh;
  label: THREE.Sprite | null; color: THREE.Color; lit: boolean; top: THREE.Vector3; base: number;
  buildingId: string; mats: THREE.MeshLambertMaterial[];
};
const beacons: Beacon[] = [];
let showUpdate: ((dt: number, t: number) => boolean) | null = null;
let showGroup: THREE.Group | null = null;
let last = 0;
let droneTemplate = buildDroneModel();
let droneStations: THREE.Group | null = null;
const demoDrones: { drone: Drone; base: THREE.Vector3; center: THREE.Vector3; count: number; index: number }[] = [];
let droneStationMode = 0;
let droneChordUntil = 0;
let corePulseUntil = 0;
export function getDroneStationMode() { return droneStationMode; }
export function cycleDroneStationMode() { droneStationMode = (droneStationMode + 1) % 3; return droneStationMode; }
export function triggerDroneChord() { droneChordUntil = performance.now() / 1000 + 3.5; }
export function pulseCore() { corePulseUntil = performance.now() / 1000 + 2.4; }
let droneReveal = { seconds: 0, hull: 0, colored: 0 };

async function loadDrones() {
  try { droneTemplate = (await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}${map.drone.model}`)).scene; }
  catch (error) { console.warn("drone model, using original procedural source", error); }
  droneStations = new THREE.Group(); droneStations.name = "drone_demo_stations"; scene.add(droneStations);
  for (const station of map.drone.stations) {
    const node = map.walk.nodes.find(n => n.id === station.node)!;
    const base = P(node.x + station.offset[0], node.z + station.offset[1]);
    const label = labelSprite(t(station.label), { size: .16 });
    label.position.copy(base).add(new THREE.Vector3(0, .8, 0)); droneStations.add(label);
    for (let i = 0; i < station.count; i++) {
      const location = base.clone().add(new THREE.Vector3((i - (station.count - 1) / 2) * .52, 0, 0));
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(.235, .235, .025, 32), new THREE.MeshStandardMaterial({ color: "#121629", roughness: .9 }));
      pad.position.copy(location).setY(.025); droneStations.add(pad);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.205, .009, 6, 40), new THREE.MeshBasicMaterial({ color: "#ffd25e" }));
      ring.rotation.x = Math.PI / 2; ring.position.copy(location).setY(.04); droneStations.add(ring);
      const drone = createDrone(droneTemplate); drone.root.scale.setScalar(station.scale);
      const hover = location.clone().setY(.28 + i * .06); drone.root.position.copy(hover);
      droneStations.add(drone.root); demoDrones.push({ drone, base: hover, center: base.clone(), count: station.count, index: i });
    }
  }
}

function applyDemoDroneItem(item: { drone: Drone; base: THREE.Vector3; center: THREE.Vector3; count: number; index: number }, time: number) {
  const chordBoost = time < droneChordUntil ? Math.sin(Math.min(1, (droneChordUntil - time) / 3.5) * Math.PI) : 0;
  const palette7 = ["#ff7b7b", "#ffb85e", "#ffd25e", "#5eeaa0", "#5ad8ff", "#9b8cff", "#eef1fb"].map((c) => new THREE.Color(c));
  let color: THREE.Color;
  if (droneStationMode === 1) {
    color = new THREE.Color(item.index % 2 === 0 ? "#ffd25e" : "#5ad8ff");
    const ang = (item.index / Math.max(1, item.count)) * TAU + (opts.reduceMotion ? 0 : time * 0.35);
    item.drone.root.position.set(item.center.x + Math.cos(ang) * 0.36, 0.48 + (opts.reduceMotion ? 0 : Math.sin(time * 0.9) * 0.03), item.center.z + Math.sin(ang) * 0.36);
  } else if (droneStationMode === 2) {
    const p7 = opts.reduceMotion || opts.reduceLights ? item.index % palette7.length : (time * 0.22 + item.index * 1.4) % palette7.length;
    const i0 = Math.floor(p7), i1 = (i0 + 1) % palette7.length;
    color = palette7[i0].clone().lerp(palette7[i1], p7 % 1);
    item.drone.root.position.copy(item.base);
    item.drone.root.position.y = 0.34 + (item.index === 1 ? 0.16 : 0) + (opts.reduceMotion ? 0 : Math.sin(time * 0.85 + item.index) * 0.04);
  } else {
    const phase = opts.reduceMotion || opts.reduceLights ? 0 : (time * .16 + item.index * .7) % 3;
    const colors = [new THREE.Color("#eef1fb"), new THREE.Color("#ffd25e"), new THREE.Color("#5ad8ff"), new THREE.Color("#eef1fb")];
    color = colors[Math.floor(phase)].clone().lerp(colors[Math.floor(phase) + 1], phase % 1);
    item.drone.root.position.copy(item.base);
    if (!opts.reduceMotion) item.drone.root.position.y += Math.sin(time * .8 + item.index) * .035;
  }
  if (chordBoost > 0 && !opts.reduceMotion) item.drone.root.position.y += chordBoost * 0.22;
  item.drone.update(time, color, opts.reduceLights ? .08 : (chordBoost > 0 ? .62 : .38), opts.low && item.index > 0 ? 0 : 1, !opts.reduceMotion);
}
function updateDemoDrones(time: number) {
  if (!droneStations) return;
  droneStations.visible = walkingEnabled() && !showUpdate;
  if (droneStations.visible) { for (const item of demoDrones) applyDemoDroneItem(item, time); }
  if (droneStations) return;
  for (const item of demoDrones) {
    const phase = 0;
    const colors = [new THREE.Color("#eef1fb"), new THREE.Color("#ffd25e"), new THREE.Color("#5ad8ff"), new THREE.Color("#eef1fb")];
    const color = colors[Math.floor(phase)].clone().lerp(colors[Math.floor(phase) + 1], phase % 1);
    item.drone.root.position.copy(item.base);
    if (!opts.reduceMotion) item.drone.root.position.y += Math.sin(time * .8 + item.index) * .035;
    item.drone.update(time, color, opts.reduceLights ? .08 : .38, opts.low && item.index > 0 ? 0 : 1, !opts.reduceMotion);
  }
}
let renderOverride: (() => void) | null = null;
let videoBackground = false;
export function setVideoBackground(active: boolean) { videoBackground = active; }
const draw = () => renderOverride ? renderOverride() : renderer.render(scene, camera);

/** Offline export uses the actual game scene, with a fixed clock and GPU postprocessing. */
export function offlineContext() { return { renderer, scene, camera }; }
export function setOfflineRenderer(render: () => void) { renderOverride = render; }
export function renderOfflineFrame(time: number, dt = 1 / 30) {
  atmosphere.update(dt, true);
  (stars.material as THREE.PointsMaterial).opacity = atmosphere.night;
  (motes.material as THREE.PointsMaterial).opacity = .35 * atmosphere.night;
  showUpdate?.(dt, time);
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Campus coordinates (game units of campus.layout.json) → scene coordinates. */
function P(x: number, z: number, y = 0) {
  return new THREE.Vector3((x - map.origin[0]) * map.scale, y * map.scale, (z - map.origin[1]) * map.scale);
}

function sprite(color: THREE.Color | string, scale: number, opacity: number) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(scale);
  return s;
}

/** A name tag: rounded dark pill with white text, always facing the camera. */
function labelSprite(text: string, opt: { size?: number; accent?: string; strong?: boolean; bare?: boolean } = {}) {
  const px = opt.strong ? 64 : 44;
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const font = `${opt.strong ? 800 : 700} ${px}px "Be Vietnam Pro", system-ui, sans-serif`;
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + px * 1.2 + (opt.accent ? px * 0.7 : 0);
  const h = Math.ceil(px * 1.7);
  c.width = w; c.height = h;
  g.font = font;
  if (!opt.bare) {
    g.fillStyle = "rgba(10,13,26,0.82)";
    g.beginPath();
    g.roundRect(2, 2, w - 4, h - 4, h / 2 - 2);
    g.fill();
    g.strokeStyle = opt.accent ?? "rgba(255,255,255,0.22)";
    g.lineWidth = 3;
    g.stroke();
  }
  let x = px * 0.6;
  if (opt.accent) {
    g.fillStyle = opt.accent;
    g.beginPath();
    g.arc(x + px * 0.22, h / 2, px * 0.22, 0, TAU);
    g.fill();
    x += px * 0.7;
  }
  g.fillStyle = opt.strong ? "#ffd25e" : "#eef1fb";
  g.textBaseline = "middle";
  g.fillText(text, x, h / 2 + px * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  const size = opt.size ?? 0.9;
  s.scale.set((size * w) / h, size, 1);
  s.renderOrder = 10;
  s.center.set(0.5, 0);
  return s;
}

function buildStatic(colors: string[]) {
  glow = glowTexture();
  // ground beyond the campus walls
  const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 96), new THREE.MeshStandardMaterial({ color: "#0b0f1d", roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  // the core above the HUS lawn (circuit 7)
  corePos = P(map.core.x, map.core.z, 60);
  ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 16, 120), new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffd25e", emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.2 }));
  ringMesh.position.copy(corePos);
  core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 2), new THREE.MeshStandardMaterial({ color: "#fff4d0", emissive: "#ffd25e", emissiveIntensity: 0.3, roughness: 0.2 }));
  core.position.copy(corePos);
  coreHalo = sprite("#ffd25e", 5, 0.2);
  coreHalo.position.copy(corePos);
  scene.add(ringMesh, core, coreHalo);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, corePos.y, 8), new THREE.MeshBasicMaterial({ color: "#ffd25e", transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
  stem.position.set(corePos.x, corePos.y / 2, corePos.z);
  scene.add(stem);
  if (!opts.low) {
    coreLight = new THREE.PointLight("#ffd25e", 0, 26, 1.4);
    coreLight.position.copy(corePos);
    scene.add(coreLight);
  }

  // one beacon per circuit 1..6 on its anchor building
  colors.forEach((col, i) => {
    const id = String(i + 1);
    const bid = map.anchors[id];
    const b = map.buildings.find((x) => x.id === bid);
    if (!b) return;
    const color = new THREE.Color(col);
    const roof = P(b.x, b.z, b.h);
    const top = roof.clone().add(new THREE.Vector3(0, 1.6, 0));
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshStandardMaterial({ color: "#2a3050", emissive: color, emissiveIntensity: 0, metalness: 0.2, roughness: 0.15, flatShading: true }));
    crystal.position.copy(top);
    crystal.scale.set(1, 1.5, 1);
    const halo = sprite(color, 3.6, 0);
    halo.position.copy(top);
    const beamH = 14;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, beamH, 12, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(top.x, top.y + beamH / 2, top.z);
    scene.add(crystal, halo, beam);
    beacons[i] = { crystal, halo, beam, label: null, color, lit: false, top, base: top.y, buildingId: b.id, mats: [] };
  });

  // name tags: campuses and buildings
  for (const cp of map.campuses) {
    const s = labelSprite(cp.label, { strong: true, size: 1.5 });
    s.position.copy(P(cp.x, cp.z, 40));
    scene.add(s);
    labels.push(s);
  }
  for (const b of map.buildings) {
    const k = beacons.findIndex((x) => x?.buildingId === b.id);
    const s = labelSprite(b.name, { accent: k >= 0 ? `#${beacons[k].color.getHexString()}` : undefined, size: 0.85 });
    s.position.copy(P(b.x, b.z, b.h)).add(new THREE.Vector3(0, k >= 0 ? 0.35 : 0.5, 0));
    if (k >= 0) { s.position.x += 1.1; beacons[k].label = s; }
    scene.add(s);
    labels.push(s);
  }

  // sky: round stars and drifting light motes
  const rnd = mulberry(70);
  const starPos: number[] = [];
  for (let i = 0; i < (opts.low ? 260 : 700); i += 1) {
    const th = rnd() * TAU, ph = Math.acos(rnd() * 0.9);
    starPos.push(150 * Math.sin(ph) * Math.cos(th), 150 * Math.cos(ph) + 6, 150 * Math.sin(ph) * Math.sin(th));
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ map: glow, color: "#dfe6ff", size: 1.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  scene.add(stars);
  const mp: number[] = [];
  for (let i = 0; i < (opts.low ? 50 : 160); i += 1) mp.push((rnd() - 0.5) * 50, 0.5 + rnd() * 8, (rnd() - 0.5) * 40);
  const mg = new THREE.BufferGeometry();
  mg.setAttribute("position", new THREE.Float32BufferAttribute(mp, 3));
  motes = new THREE.Points(mg, new THREE.PointsMaterial({ map: glow, color: "#ffe6a8", size: 0.3, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(motes);

}

async function loadCampus() {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}${map.model}`);
  const root = gltf.scene;
  root.scale.setScalar(map.scale);
  root.position.set(-map.origin[0] * map.scale, 0, -map.origin[1] * map.scale);
  const night = new THREE.Color("#a3acd2");
  const anchorIds = new Set(beacons.filter(Boolean).map((b) => b.buildingId));
  const shared = new Map<THREE.Material, THREE.MeshLambertMaterial>();
  const cloned = new Map<string, Map<THREE.Material, THREE.MeshLambertMaterial>>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const group = modelGroup(mesh);
    const src = mesh.material as THREE.MeshStandardMaterial;
    let m = shared.get(src);
    if (!m) { m = nightMaterial(src, night); shared.set(src, m); }
    if (group === "lamps") {
      const hsl = { h: 0, s: 0, l: 0 };
      src.color.getHSL(hsl);
      if (hsl.l > 0.75) {
        m = m.clone();
        m.emissive.set("#ffcf8a");
        m.emissiveIntensity = 1.4;
        lampMats.push(m);
      }
    } else if (anchorIds.has(group)) {
      let byMat = cloned.get(group);
      if (!byMat) { byMat = new Map(); cloned.set(group, byMat); }
      let c = byMat.get(src);
      if (!c) { c = m.clone(); byMat.set(src, c); }
      m = c;
    }
    mesh.material = m;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
  });
  for (const b of beacons) if (b) b.mats = [...(cloned.get(b.buildingId)?.values() ?? [])];
  campus = root;
  scene.add(root);
  occlusion = new BuildingOcclusion(root, (mesh) => {
    const id = modelGroup(mesh);
    return map.buildings.find((b) => id === b.id || id.startsWith(`${b.id}_`))?.id ?? null;
  }, map.walk.avatar.camera.occlusionOpacity);
  setLit(beacons.map((b) => b?.lit ?? false).concat([coreLitFlag]));
}

let coreLitFlag = false;

export function initWorld(canvas: HTMLCanvasElement, colors: string[], o: WorldOptions, mapData: MapData) {
  opts = o;
  map = mapData;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.low ? .85 : 1.75));
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene();
  atmosphere = new Atmosphere(scene, renderer, map.atmosphere);
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
  buildStatic(colors);
  initWalking(scene, map, P, (text) => labelSprite(text, { size: .8 }), async (b, file, isCurrent) => {
    if (!b.enterable || !b.interiorFile) throw new Error("Exterior only");
    const [module, response] = await Promise.all([import("./interiors"), fetch(`${import.meta.env.BASE_URL}${file ?? b.interiorFile}`)]);
    if (!response.ok) throw new Error(`Room HTTP ${response.status}`);
    const roomData = await response.json();
    const next = await module.buildRoom(b, roomData, text => labelSprite(text, {size:.5}));
    if(isCurrent && !isCurrent()){next.dispose();throw new Error("Cancelled transition");}
    loadedRoom?.dispose();
    loadedRoom = next; loadedRoom.root.visible = false; scene.add(loadedRoom.root);
    return { data: loadedRoom.data, obstacles: loadedRoom.obstacles };
  });
  setWalkingLow(opts.low);
  camera.position.set(0, map.overview.height, map.overview.distance);
  look.set(0, 0, 0);
  resize();
  window.addEventListener("resize", resize);
  const groundRay = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const groundHit = new THREE.Vector3();
  canvas.addEventListener("pointerup", (e) => {
    if (!walkingEnabled() || showUpdate) return;
    const id = characterAtScreen(camera, e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    if (id) { requestCharacterInteraction(id); return; }
    const eggId = easterEggAtScreen(camera, e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    if (eggId) { requestEasterEggInteraction(eggId); return; }
    const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    groundRay.setFromCamera(ndc, camera);
    if (groundRay.ray.intersectPlane(groundPlane, groundHit)) {
      walkToWorldPoint(groundHit.x, groundHit.z);
    }
  });
  if (!o.offline) requestAnimationFrame(loop);
  return Promise.all([fetch(`${import.meta.env.BASE_URL}data/campus-collision.json`).then(async response => {
    if (!response.ok) throw new Error("Campus collision unavailable");
    installCampusCollision(await response.json());
  }), loadCampus().catch((e) => { console.warn("campus model", e); }), loadDrones()]);
}

export function setWorldOptions(o: WorldOptions) {
  opts = o;
  setWalkingLow(o.low);
  renderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.low ? .85 : 1.75));
  setLit(beacons.map((b) => b?.lit ?? false).concat([coreLitFlag]));
  resize();
}
export function setStoryTime(step: number, immediate = false) { atmosphere?.setStep(step, immediate); }

function resize() {
  if (!renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/** lit[i] for circuit i + 1; index 6 is the core (circuit 7). */
export function setLit(lit: boolean[]) {
  const k = opts.reduceLights ? 0.45 : 1;
  let n = 0;
  beacons.forEach((b, i) => {
    if (!b) return;
    b.lit = Boolean(lit[i]);
    if (b.lit) n += 1;
    const m = b.crystal.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = b.lit ? 2.4 * k : 0.12;
    m.color.set(b.lit ? b.color : "#2a3050");
    b.halo.material.opacity = b.lit ? 0.85 * k : 0.08;
    (b.beam.material as THREE.MeshBasicMaterial).opacity = b.lit ? 0.32 * k : 0;
    for (const mm of b.mats) { mm.emissive.copy(b.color); mm.emissiveIntensity = b.lit ? 0.12 * k : 0; }
  });
  coreLitFlag = Boolean(lit[6]);
  if (coreLitFlag) n += 1;
  if (core) {
    (core.material as THREE.MeshStandardMaterial).emissiveIntensity = (0.3 + n * 0.35) * k;
    coreHalo.material.opacity = (0.15 + n * 0.1) * k;
    (ringMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = (0.3 + n * 0.25) * k;
    if (coreLight) coreLight.intensity = (2 + n * 3) * k;
  }
  for (const m of lampMats) m.emissiveIntensity = 1.4 * k;
}

/** Swing the camera toward a circuit's building (or the core for 7), or back to the overview. */
export function focusCircuit(id: number | null) {
  focusId = id;
}

function focusPoint(id: number): THREE.Vector3 | null {
  if (id === 7) return corePos.clone();
  return beacons[id - 1]?.top.clone() ?? null;
}

function loop(now: number) {
  requestAnimationFrame(loop);
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
  last = now;
  if (videoBackground) return;
  const tt = now / 1000;
  updateDemoDrones(tt);
  atmosphere.update(dt, opts.reduceMotion);
  (stars.material as THREE.PointsMaterial).opacity = atmosphere.night;
  (motes.material as THREE.PointsMaterial).opacity = .55 * atmosphere.night * (opts.reduceLights ? .45 : 1);
  for (const mat of lampMats) mat.emissiveIntensity = 1.4 * atmosphere.night * (opts.reduceLights ? .45 : 1);
  if (showUpdate) {
    if (!showUpdate(dt, tt)) showUpdate = null;
    return;
  }
  if (!opts.reduceMotion) {
    orbit += dt * 0.035;
    ringMesh.rotation.x = Math.PI / 2 + Math.sin(tt * 0.4) * 0.25;
    ringMesh.rotation.y += dt * 0.4;
    beacons.forEach((b, i) => {
      if (!b) return;
      b.crystal.rotation.y += dt * 0.6;
      b.crystal.position.y = b.base + Math.sin(tt * 0.9 + i) * 0.1;
      b.halo.position.y = b.crystal.position.y;
    });
    motes.rotation.y += dt * 0.01;
    if (coreHalo) {
      const boost = tt < corePulseUntil && !opts.reduceLights ? Math.sin(Math.min(1, (corePulseUntil - tt) / 2.4) * Math.PI) * 1.8 : 0;
      coreHalo.scale.setScalar(5 + boost);
    }
  }
  const walker = updateWalking(dt, tt, opts.reduceMotion);
  const inside = walker ? buildingAtPosition(walker) : null;
  const interiorRoot=inside ? loadedRoom?.root.uuid??null : null;
  const changedSpace = currentInsideBuilding !== (inside?.id ?? null) || currentInteriorRoot!==interiorRoot;
  currentInteriorRoot=interiorRoot;
  currentInsideBuilding = inside?.id ?? null;
  if (inside) {
    for (const obj of scene.children) {
      if ((obj as THREE.Light).isLight || obj.name === "walking" || obj === loadedRoom?.root) continue;
      if (!hiddenOutside.has(obj)) hiddenOutside.set(obj, obj.visible);
      obj.visible = false;
    }
    if (loadedRoom) { loadedRoom.root.visible = true; if(walker)loadedRoom.update(walker); }
  } else {
    for (const [obj, visible] of hiddenOutside) obj.visible = visible;
    hiddenOutside.clear();
    if (loadedRoom) { loadedRoom.dispose(); loadedRoom = null; }
  }
  const targetIndoor = inside ? 1 : 0;
  indoorBlend = opts.reduceMotion ? targetIndoor : THREE.MathUtils.lerp(indoorBlend, targetIndoor, 1 - Math.exp(-dt * 6.5));

  for (const label of labels) label.visible = !walkingEnabled();
  const f = focusId !== null ? focusPoint(focusId) : null;
  if (walker) {
    const c = map.walk.avatar.camera;
    const ic = inside && loadedRoom ? { height: loadedRoom.data.camera.height / map.scale, distance: loadedRoom.data.camera.distance / map.scale, lookHeight: loadedRoom.data.camera.lookHeight / map.scale } : c;
    const ch = ic.height;
    const cd = ic.distance;
    const lh = ic.lookHeight;
    camGoal.set(walker.x, walker.y + ch * map.scale, walker.z + cd * map.scale);
    lookGoal.copy(walker).add(new THREE.Vector3(0, lh * map.scale, 0));
  } else if (f) {
    // stand outside the target, on the side facing away from the map centre, looking slightly down
    const out = new THREE.Vector3(f.x, 0, f.z);
    if (out.lengthSq() < 4) out.set(0, 0, 1);
    out.normalize();
    const side = new THREE.Vector3(-out.z, 0, out.x).multiplyScalar(4);
    camGoal.set(f.x + out.x * 13 + side.x, f.y + 7, f.z + out.z * 13 + side.z);
    lookGoal.set(f.x, f.y - 1.2, f.z);
  } else {
    const d = map.overview.distance;
    const a = opts.reduceMotion ? 0.9 : 0.9 + Math.sin(orbit) * 0.55;
    camGoal.set(Math.sin(a - 0.9) * d, map.overview.height, Math.cos(a - 0.9) * d);
    lookGoal.set(0, 0, -3);
  }
  const k = opts.reduceMotion ? 1 : 1 - Math.exp(-dt * (walker ? 6 : 1.8));
  if (inside && loadedRoom) {
    const framing = loadedRoom.data.camera;
    camGoal.set(walker!.x, framing.height, walker!.z + framing.distance);
    lookGoal.set(walker!.x, framing.lookHeight, walker!.z);
    const r=loadedRoom.data;
    if(r.selectedRoom && r.clipRect && r.sourceCenter && !r.camera.follow){
      frameRoom(r.clipRect,r.sourceCenter,1000,camera.fov,camera.aspect,renderer.domElement.clientHeight,camGoal,lookGoal);
    }
  }
  if (changedSpace) { camera.position.copy(camGoal); look.copy(lookGoal); }
  camera.position.lerp(camGoal, k);
  look.lerp(lookGoal, k);
  const ic = map.walk.avatar.indoorCamera ?? { height: 13.5, distance: 15.5, lookHeight: 2.2, insideOpacity: 0.08 };
  if (walker && !inside) occlusion?.update(camera, walker, map.walk.avatar.height * map.scale, dt, opts.reduceMotion, currentInsideBuilding, ic.insideOpacity);
  else occlusion?.clear();
  setPlayerOccluded(!!walker && (occlusion?.active ?? false));
  cameraDistance = camera.position.distanceTo(look);
  camera.lookAt(look);
  draw();
}

/* ---------- Đêm Hội tụ show ---------- */

/** "70" in a 5×7 dot font (clearer than 3×5 at a distance). */
const SEVEN = ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."];
const ZERO = [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."];
function digitCells(): [number, number][] {
  const out: [number, number][] = [];
  SEVEN.forEach((row, y) => [...row].forEach((c, x) => c === "#" && out.push([x, y])));
  ZERO.forEach((row, y) => [...row].forEach((c, x) => c === "#" && out.push([x + 7, y])));
  return out;
}

/** Kết cục đang diễn (E1–E6) và nguyên nhân hiển thị của E2. */
export interface ShowEnding { id: EndingId; variant?: string | null }

const showRestore: (() => void)[] = [];
let showResolve: (() => void) | null = null;
let showSound: EndingSound | null = null;
/** Nút "Bỏ qua cảnh": kết thúc ngay, mô hình trở về như cũ khi màn hình gọi endShow(). */
export function skipShow() { showSound?.dispose(); showSound = null; const r = showResolve; showResolve = null; r?.(); }

/** "70", "07" hay các cụm ước của 70 (kết cục E6) cho dàn drone. */
function droneTargets(kind: "70" | "07" | "weird"): { cells: [number, number][]; labels: { text: string; x: number }[] } {
  if (kind === "weird") {
    const cells: [number, number][] = [], labels: { text: string; x: number }[] = [];
    let x = 0;
    for (const d of [1, 2, 5, 7, 10, 14, 35]) {
      const cols = Math.ceil(d / 5);
      for (let i = 0; i < d; i += 1) cells.push([x + Math.floor(i / 5), 6 - (i % 5)]);
      labels.push({ text: String(d), x: x + (cols - 1) / 2 });
      x += cols + 1;
    }
    return { cells: cells.map(([cx, cy]) => [cx - x / 2 + 6, cy]), labels: labels.map((l) => ({ ...l, x: l.x - x / 2 + 6 })) };
  }
  const cells = digitCells();
  return { cells: kind === "07" ? cells.map(([cx, cy]) => [cx >= 7 ? cx - 7 : cx + 7, cy]) : cells, labels: [] };
}

/**
 * Play the show over the HUS lawn. `circuits` = number of lit circuits (≥ 3) decides how rich it is.
 * `ending` chọn biến thể của kết cục (ENDINGS.md): E1 trình diễn đầy đủ, E2 mô hình "nổ" hoạt hình,
 * E3 cầu ánh sáng nối hai trường, E4 drone xếp "07", E5 pháo bay mãi, E6 các ước của 70.
 * Pháo cách nhau ≥ 0,45 s nên không có gì chớp quá 3 lần/giây. Cảnh E2: khối rơi chậm, hoa giấy,
 * không lửa/khói/người/chớp sáng; "Giảm hiệu ứng ánh sáng" hoặc "Giảm chuyển động" → mờ dần tại chỗ.
 */
export function playShow(circuits: number, colors: string[], ending?: ShowEnding): Promise<void> {
  showSound?.dispose();
  const sound = opts.offline ? null : createEndingSound(ending?.id ?? "E1");
  showSound = sound;
  if (droneStations) droneStations.visible = false;
  occlusion?.clear();
  atmosphere.setShow(true);
  return new Promise((resolve) => {
    showResolve = resolve;
    if (showGroup) scene.remove(showGroup);
    const id = ending?.id;
    const boom = id === "E2";
    const fadeOnly = opts.reduceLights || opts.reduceMotion;
    const blocks: { mesh: THREE.Group; base: THREE.Vector3; rot: THREE.Euler; vel: THREE.Vector3; spin: THREE.Vector3; mats: THREE.MeshLambertMaterial[] }[] = [];
    const rndB = mulberry(70);
    if (boom && campus) {
      const buildings = new Map<string, THREE.Mesh[]>();
      campus.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const gid = modelGroup(mesh);
        const building = map.buildings.find(b => gid === b.id || gid.startsWith(`${b.id}_`));
        if (!building) return;
        const parts = buildings.get(building.id) ?? [];
        parts.push(mesh); buildings.set(building.id, parts);
      });
      for (const parts of buildings.values()) {
        const box = new THREE.Box3();
        parts.forEach(mesh => box.expandByObject(mesh));
        const pivot = box.getCenter(new THREE.Vector3());
        const building = new THREE.Group();
        building.position.copy(campus.worldToLocal(pivot.clone()));
        campus.add(building); building.updateMatrixWorld(true);
        const originals = parts.map(mesh => ({ mesh, parent: mesh.parent!, matrix: mesh.matrix.clone(), material: mesh.material }));
        const mats: THREE.MeshLambertMaterial[] = [];
        for (const part of originals) {
          building.attach(part.mesh);
          if (fadeOnly) {
            const mat = (part.mesh.material as THREE.MeshLambertMaterial).clone();
            mat.transparent = true; part.mesh.material = mat; mats.push(mat);
          }
        }
        const base = building.position.clone(), rot = building.rotation.clone();
        const out = pivot.clone().setY(0).normalize();
        const vel = new THREE.Vector3(out.x * (1.1 + rndB()), 2 + rndB() * 1.3, out.z * (1.1 + rndB()));
        const spin = new THREE.Vector3((rndB() - .5) * .12, (rndB() - .5) * .2, (rndB() - .5) * .12);
        blocks.push({ mesh: building, base, rot, vel, spin, mats });
        showRestore.push(() => {
          for (const part of originals) {
            part.parent.add(part.mesh); part.mesh.matrix.copy(part.matrix);
            part.matrix.decompose(part.mesh.position, part.mesh.quaternion, part.mesh.scale);
            part.mesh.material = part.material;
          }
          campus?.remove(building); mats.forEach(mat => mat.dispose());
        });
      }
    }
    const group = new THREE.Group();
    let anniversary: THREE.Sprite | null = null;
    if (id && id !== "E2") {
      const title = labelSprite(t("story.anniversary"), { strong: true, size: 1.2, bare: true });
      title.position.copy(corePos).add(new THREE.Vector3(0, 3.7, 0)); group.add(title);
      anniversary = title;
    }
    showGroup = group;
    scene.add(group);
    const palette = colors.slice(0, Math.max(3, circuits)).map((c) => new THREE.Color(c));
    const k = opts.reduceLights ? 0.5 : 1;
    const C = corePos.clone().setY(0);
    const impact = boom ? endingImpact(P(map.campuses.reduce((sum, c) => sum + c.x, 0) / map.campuses.length, map.campuses.reduce((sum, c) => sum + c.z, 0) / map.campuses.length), opts.low) : null;
    if (impact) group.add(impact.group);
    const H = 15;
    const fast = opts.reduceMotion;
    const sphere = new THREE.SphereGeometry(1, 16, 12);
    const droneFormation = new THREE.Group();
    group.add(droneFormation);
    const tops = beacons.filter(Boolean).map((b) => b.top);
    for (const l of labels) l.visible = false;
    for (const b of beacons) if (b) b.beam.visible = false;

    const fireworks = fireworkBouquets(C, palette, id, opts.low);
    fireworks.mesh.visible = !fadeOnly;
    group.add(fireworks.mesh);
    const bridgeFireworks = id === "E3" ? fireworkBouquets(P(map.campuses[0].x, -120), palette.slice().reverse(), id, opts.low) : null;
    if (bridgeFireworks) { bridgeFireworks.mesh.visible = !fadeOnly; group.add(bridgeFireworks.mesh); }
    const meet = new THREE.Vector3(C.x, H * 0.55, C.z);
    const beams: THREE.Mesh[] = [];
    if (!boom) beacons.forEach((b, i) => {
      if (!b || i >= Math.max(3, circuits)) return;
      const len = b.top.distanceTo(meet);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 8), new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.copy(b.top).lerp(meet, 0.5);
      m.lookAt(meet);
      m.rotateX(Math.PI / 2);
      group.add(m);
      beams.push(m);
    });
    // E3: cầu ánh sáng từ lõi HUS sang sân USSH.
    let bridge: THREE.Mesh | null = null;
    if (id === "E3") {
      const a = corePos.clone().setY(6), b = P(map.campuses[0].x, -120, 60);
      const mid = a.clone().lerp(b, .5).setY(Math.max(a.y, b.y) + 9);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      bridge = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .16, 12), new THREE.MeshBasicMaterial({ color: "#ffd25e", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      // A handful of parallel ribbons make the bridge read as a woven path of light.
      for (let lane = -3; lane <= 3; lane++) {
        if (!lane) continue;
        const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, .035, 6), new THREE.MeshBasicMaterial({ color: palette[Math.abs(lane) % palette.length], transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false }));
        ribbon.position.x = lane * .22;
        bridge.add(ribbon);
      }
      group.add(bridge);
    }
    const drones: { mesh: THREE.Mesh; halo: THREE.Sprite; from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    const rnd = mulberry(circuits * 97 + 7);
    const targets = boom ? { cells: [] as [number, number][], labels: [] as { text: string; x: number }[] } : droneTargets(id === "E4" ? "07" : id === "E6" ? "weird" : "70");
    const spacing = id === "E6" ? 0.62 : 0.78;
    targets.cells.forEach(([cx, cy], i) => {
      const col = palette[i % palette.length];
      const mesh = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: col }));
      mesh.scale.setScalar(0.24);
      const halo = sprite(col, 1.3, 0.55 * k);
      const to = new THREE.Vector3(C.x + (cx - 6) * spacing, H + 3.2 - cy * 0.78, C.z);
      const src = tops[i % tops.length] ?? corePos;
      const from = new THREE.Vector3(src.x + (rnd() - 0.5) * 2, src.y + 0.5, src.z);
      mesh.position.copy(from);
      halo.position.copy(from);
      mesh.visible = halo.visible = false;
      droneFormation.add(mesh, halo);
      drones.push({ mesh, halo, from, to });
    });
    const white = new THREE.Color("#eef1fb");
    const heroDrones = Array.from({ length: 6 }, (_, i) => {
      const drone = createDrone(droneTemplate); drone.root.scale.setScalar(.95);
      const from = C.clone().add(new THREE.Vector3((i % 3 - 1) * 2.4, 10.5 + Math.floor(i / 3) * .3, 6 - Math.floor(i / 3) * 2.4));
      const point = drones.length ? drones[Math.floor(i * drones.length / 6)] : null;
      const to = point?.to.clone() ?? C.clone().add(new THREE.Vector3((i - 2.5) * 4, 18, -24));
      if (point) point.from.copy(from);
      group.add(drone.root);
      const halo = point?.halo ?? sprite(white, .6, 0);
      if (!point) group.add(halo);
      return { drone, from, to, point, halo, color: palette[i % palette.length] };
    });
    const key = new THREE.PointLight("#eef1fb", 28, 20, 1.5); key.position.copy(C).add(new THREE.Vector3(4, 15, 10)); group.add(key);
    const divisorTags = targets.labels.map((l) => {
      const s = labelSprite(l.text, { size: .9, bare: true });
      s.position.set(C.x + (l.x - 6) * spacing, H + 3.2 + 1.2, C.z);
      s.visible = false; group.add(s);
      return s;
    });
    const divisorOrbits = id === "E6" ? targets.labels.map((l, i) => {
      const radius = .65 + Math.sqrt([1, 2, 5, 7, 10, 14, 35][i]) * .21;
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius, .012, 6, 100), new THREE.MeshBasicMaterial({ color: palette[i % palette.length], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      orbit.position.set(C.x + (l.x - 6) * spacing, H + .5, C.z - .3);
      group.add(orbit);
      return orbit;
    }) : [];
    // E2: hoa giấy rơi chậm (màu đặc, không cộng sáng, không chớp).
    let confetti: { pts: THREE.Points; vel: Float32Array } | null = null;
    if (boom) {
      const n = opts.low ? 260 : 700, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), col = new Float32Array(n * 3);
      const conf = ["#ffd25e", "#5ad8ff", "#5eeaa0", "#ff6b81", "#eef1fb"].map((c) => new THREE.Color(c));
      for (let i = 0; i < n; i += 1) {
        pos.set([(rndB() - .5) * 70, 18 + rndB() * 16, -8 - rndB() * 30], i * 3);
        vel.set([(rndB() - .5) * .6, -(0.9 + rndB() * 1.1), (rndB() - .5) * .6], i * 3);
        const c = conf[i % conf.length]; col.set([c.r, c.g, c.b], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .32, vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
      group.add(pts);
      confetti = { pts, vel };
    }
    const prelude = fadeOnly ? 0 : 3.6;
    const duration = 12.4 + prelude;
    const coreOpacity = coreHalo.material.opacity;
    showRestore.push(() => { coreHalo.material.opacity = coreOpacity; });
    let start = -1;
    let done = false;
    showUpdate = (dt, now) => {
      if (start < 0) start = now;
      const elapsed = (now - start) * (fast ? 2.5 : 1);
      const t = Math.max(0, elapsed - prelude);
      sound?.sync(prelude ? elapsed : elapsed + 3.6, !done && !document.hidden, fast ? 2.5 : 1);
      impact?.update(t - 1.6, fadeOnly);
      if (anniversary) anniversary.visible = fadeOnly || elapsed > 6;
      coreHalo.material.opacity = coreOpacity * (fadeOnly ? 1 : THREE.MathUtils.lerp(.1, 1, THREE.MathUtils.smoothstep(elapsed, 3, 6.5)));
      fireworks.update(t);
      bridgeFireworks?.update(t - 1.15);
      const bt = Math.max(0, Math.min(1, (t - 3.2) / 1.2));
      for (const b of beams) (b.material as THREE.MeshBasicMaterial).opacity = bt * 0.7 * k;
      if (bridge) (bridge.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.min(1, (t - 4) / 2.5)) * .75 * k;
      const dtw = Math.max(0, Math.min(1, (t - 4.6) / 2.6));
      const ease = dtw * dtw * (3 - 2 * dtw);
      drones.forEach((d, i) => {
        const local = Math.max(0, Math.min(1, ease * 1.3 - (i / drones.length) * 0.3));
        d.mesh.visible = d.halo.visible = t > 4.6;
        d.mesh.position.lerpVectors(d.from, d.to, local);
        if (id === "E6" && !fadeOnly) {
          const gather = Math.sin(Math.max(0, Math.min(1, (t - 7) / 3)) * Math.PI) * .22;
          d.mesh.position.x = THREE.MathUtils.lerp(d.mesh.position.x, C.x, gather);
          d.mesh.position.y += Math.sin(t * .65 + Math.floor(i / 7)) * .15 * ease;
        }
        d.halo.position.copy(d.mesh.position);
      });
      const colorMix = fadeOnly ? 1 : THREE.MathUtils.smoothstep(elapsed, 1.1, 2.5);
      const hull = fadeOnly ? 0 : 1 - THREE.MathUtils.smoothstep(elapsed, 6.2, 8.8);
      droneReveal = { seconds: elapsed, hull, colored: colorMix };
      heroDrones.forEach((hero, i) => {
        const rise = fadeOnly ? 1 : THREE.MathUtils.smoothstep(elapsed, 2.5 + i * .08, 8.2 + i * .04);
        const color = white.clone().lerp(hero.color, colorMix);
        hero.drone.root.position.lerpVectors(hero.from, hero.to, rise);
        hero.drone.root.position.y += Math.sin(rise * Math.PI) * 1.3;
        hero.drone.root.rotation.y = .15 + (fadeOnly ? 0 : elapsed * .1);
        hero.drone.update(elapsed, color, colorMix * (opts.reduceLights ? .15 : 1), hull, !fadeOnly);
        hero.halo.visible = !fadeOnly && elapsed > 1.1;
        hero.halo.position.copy(hero.drone.root.position).add(new THREE.Vector3(0, -.13 * hull, 0));
        hero.halo.material.color.copy(color);
        hero.halo.material.opacity = colorMix * (.12 + (1 - hull) * .43) * k;
        hero.halo.scale.setScalar(.55 + (1 - hull) * .75);
        if (hero.point && !fadeOnly) {
          hero.point.mesh.visible = elapsed > 6.2;
          hero.point.mesh.position.copy(hero.drone.root.position);
          hero.point.mesh.scale.setScalar(.24 * (1 - hull));
        }
      });
      // E4's formation is initially read from backstage; its true '07' is revealed by the camera.
      if (id === "E4" && !fadeOnly) {
        const turn = THREE.MathUtils.smoothstep(t, 7, 10.5);
        const angle = (1 - turn) * THREE.MathUtils.smoothstep(t, 4, 6) * Math.PI;
        droneFormation.position.set(C.x - C.x * Math.cos(angle) - C.z * Math.sin(angle), 0, C.z + C.x * Math.sin(angle) - C.z * Math.cos(angle));
        droneFormation.rotation.y = angle;
      }
      for (const s of divisorTags) s.visible = t > 6.4;
      divisorOrbits.forEach((orbit, i) => {
        (orbit.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.smoothstep(t, 6.8, 8.5) * .55;
        orbit.rotation.y = fadeOnly ? 0 : Math.sin(t * .24 + i) * .3;
      });
      // E2: sau 1,6 s các khối tách nhau, bay lên chậm rồi rơi chậm; giảm hiệu ứng thì mờ dần tại chỗ.
      if (boom) {
        const bt2 = Math.max(0, t - 1.6);
        for (const b of blocks) {
          if (fadeOnly) { for (const mat of b.mats) mat.opacity = Math.max(.12, 1 - bt2 / 3); continue; }
          const g = 0.55;
          const u = 1 / map.scale, lift = Math.max(0, b.vel.y * bt2 - .5 * g * bt2 * bt2);
          b.mesh.position.set(b.base.x + b.vel.x * bt2 * .5 * u, b.base.y + lift * u, b.base.z + b.vel.z * bt2 * .5 * u);
          b.mesh.rotation.set(b.rot.x + b.spin.x * bt2, b.rot.y + b.spin.y * bt2, b.rot.z + b.spin.z * bt2);
          b.mesh.updateMatrix();
        }
        if (confetti) {
          const p = confetti.pts.geometry.getAttribute("position") as THREE.BufferAttribute;
          const show = t > 1.8;
          (confetti.pts.material as THREE.PointsMaterial).opacity = show ? (fadeOnly ? .35 : .9) : 0;
          if (show && !fast) for (let i = 0; i < p.count; i += 1) {
            let y = p.getY(i) + confetti.vel[i * 3 + 1] * dt;
            if (y < 0) y += 30;
            p.setXYZ(i, p.getX(i) + confetti.vel[i * 3] * dt, y, p.getZ(i) + confetti.vel[i * 3 + 2] * dt);
          }
          p.needsUpdate = true;
        }
      }
      if (!done && elapsed > duration) { done = true; sound?.dispose(); showResolve = null; resolve(); }
      // stand south of the lawn (the HUS gate side), looking up over T2 at the sky above the core
      const sweep = fadeOnly ? 1 : THREE.MathUtils.smoothstep(t, 0, 12);
      camera.position.set(C.x + 12 - sweep * 10, 11 - sweep * 2, C.z + 52 - sweep * 5);
      camera.lookAt(C.x, id === "E5" ? 15 + Math.max(0, t - 2) * 3 : 15.5, C.z - 4);
      if (id === "E6") {
        const close = fadeOnly ? 1 : THREE.MathUtils.smoothstep(t, 4.5, 9.5);
        camera.position.set(C.x + 6 * (1 - close), 11 + close * 2, C.z + 50 - close * 21);
        camera.lookAt(C.x, 15 + close * 1.5, C.z);
      }
      if (boom || id === "E3") {
        const a = fadeOnly ? 0.5 : .35 + t * .035;
        camera.position.set(Math.sin(a) * 65, boom ? 30 : 27 - sweep * 5, Math.cos(a) * 65);
        camera.lookAt(0, boom ? 8 : 9, -8);
      }
      if (!fadeOnly) {
        const pull = THREE.MathUtils.smoothstep(elapsed, 2.6, 6.5);
        const widePosition = camera.position.clone(), wideDirection = new THREE.Vector3();
        camera.getWorldDirection(wideDirection);
        const wideLook = widePosition.clone().addScaledVector(wideDirection, 30);
        camera.position.lerpVectors(C.clone().add(new THREE.Vector3(1.1, 12.6, 14)), widePosition, pull);
        camera.lookAt(C.clone().add(new THREE.Vector3(0, 10.8, 4.8)).lerp(wideLook, pull));
        if (boom) {
          const age = t - 1.6, strength = age > 0 && age < 1.1 ? .25 * Math.exp(-age * 3.5) : 0;
          camera.position.x += Math.sin(age * 14) * strength;
          camera.position.y += Math.sin(age * 11) * strength * .45;
        }
      }
      draw();
      return true;
    };
  });
}

export function endShow() {
  showSound?.dispose(); showSound = null;
  atmosphere?.setShow(false);
  occlusion?.clear();
  for (const restore of showRestore.splice(0)) restore();
  showUpdate = null;
  for (const l of labels) l.visible = true;
  for (const b of beacons) if (b) b.beam.visible = true;
  if (showGroup) {
    scene.remove(showGroup);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    showGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && !m.userData.droneSharedGeometry) geometries.add(m.geometry);
      const mat = (o as THREE.Mesh | THREE.Sprite).material;
      if (mat) for (const v of Array.isArray(mat) ? mat : [mat]) { materials.add(v); const tx = (v as THREE.SpriteMaterial).map; if (tx && tx !== glow) textures.add(tx); }
    });
    geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); textures.forEach((t) => t.dispose());
    showGroup = null;
  }
}

/** True once the campus model is in the scene (used by tests). */
export function campusReady() { return campus !== null; }
export function worldDiagnostics() {
  const c = map.walk.avatar.camera;
  return {
    showChangedMeshes: showRestore.length, litMaterials: beacons.map((b) => b.mats.length),
    drones: { stationsVisible: droneStations?.visible ?? false, stationCount: demoDrones.length, reveal: droneReveal, positions: demoDrones.map(d => d.drone.root.position.toArray()) },
    atmosphere: atmosphere.diagnostics(), occlusion: occlusion?.diagnostics(), cameraDistance,
    insideBuilding: currentInsideBuilding, indoorBlend, room: loadedRoom ? { seats: loadedRoom.seats, kind: loadedRoom.data.kind, verified: loadedRoom.data.verified } : null, loadingRoom: roomState().loading,
    characters: characterScreenPositions(camera, window.innerWidth, window.innerHeight),
    desiredCameraDistance: Math.hypot(c.height - c.lookHeight, c.distance) * map.scale
  };
}
