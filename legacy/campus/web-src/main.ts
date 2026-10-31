import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { blocked, slide, verticalStep, yawFacing, type Solid } from "./motion";
import { Sky, type SkyState } from "./sky";
import { patchSurface, setSurfaceDetail } from "./surfaces";
import { Minimap } from "./minimap";
import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-800.css";
import "@fontsource/be-vietnam-pro/latin-800.css";
import "./style.css";
import { FLAGS, type Action } from "./config";
import { bus, type Mode, type StairInfo } from "./core/events";
import { t } from "./i18n";
import { setTarget } from "./ui/achievements";
import { initInterface, screens, setUiHidden, showTitle } from "./ui/interface";
import { bindingsFor, reducedMotion, settings } from "./ui/settings";
import { captureCanvas } from "./ui/share";

type Vec3 = [number, number, number];

interface Building {
  id: string;
  campus: string;
  verified_name: string | null;
  display_name?: string;
  show_label?: boolean;
  center_xz: [number, number];
  height: number;
  floors?: number;
  access?: string;
  roof?: string;
}

type Rect = [number, number, number, number];

interface Room {
  group: string;
  building: string;
  floor: number;
  num: string;
  type: string;
  type_name: string;
  labels: string[];
  floor_label: string | null;
  center: Vec3;
}

interface Interiors {
  floor_height: number;
  buildings: { id: string; group: string; campus: string; floors: number; access: string; name: string; footprint: Rect }[];
  links: { id: string; rect: Rect; floors: number[] }[];
  stairs: { building: string; group: string; hall: string; floors: [number, number]; zone: Rect }[];
  rooms: Room[];
  label_groups: { group: string; floor: number; text: string; nums: string; center: Vec3 }[];
  floor_labels: { group: string; floor: number; text: string; center: Vec3 }[];
  lamps: [number, number][];
  logo: {
    building: string;
    side: "-x" | "+x" | "-z" | "+z";
    center_along: number;
    center_y: number;
    height: number;
    aspect: number;
    floor_tag: number;
    file: string;
    crop_viewbox: [number, number, number, number];
  } | null;
}

interface Gate {
  id: string;
  campus: string;
  label: string;
  center_xz: [number, number];
}

interface Layout {
  buildings: Building[];
  trees: [number, number, number][];
  gates: Gate[];
  gameplay: {
    player_radius: number;
    spawn: Vec3;
    deadlines: { id: string; position: Vec3 }[];
    return_gates: string[];
    return_radius: number;
    axis_check: { x: number[]; z_from: number; z_to: number };
    cinematic: { duration_s: number; points: { position: Vec3; look: Vec3 }[] };
  };
  camera_bookmarks: { id: string; position: Vec3; target: Vec3 }[];
  gatehouse?: { lane: [number, number] };
  world_scale?: { horizontal: number; floor_height: number };
}

interface Input {
  forward: number;
  strafe: number;
}

const UP = new THREE.Vector3(0, 1, 0);
const WALK_SPEED = 19;
const GROUP_NAME: Record<string, string> = { SPECIAL: "Nhà Chuyên đề", CANTEEN: "Căng tin HUS" };
const NEUTRAL_LABEL: Record<string, string> = {};

const errors: string[] = [];
window.addEventListener("error", (event) => errors.push(String(event.message)));

const canvas = document.querySelector<HTMLCanvasElement>("#view")!;
const boot = document.querySelector<HTMLElement>("#boot")!;
const bootText = document.querySelector<HTMLElement>("#boot-text")!;
const retry = document.querySelector<HTMLButtonElement>("#retry")!;
const bootFill = document.querySelector<HTMLElement>("#boot-fill")!;
const touch = document.querySelector<HTMLElement>("#touch")!;
const stickEl = document.querySelector<HTMLElement>("#stick")!;
const knob = document.querySelector<HTMLElement>("#knob")!;
const lookpad = document.querySelector<HTMLElement>("#lookpad")!;

/** True while the title screen is up. */
let atTitle = true;
/** Set before we release pointer lock ourselves, so the release does not open the pause menu. */
let releasingLock = false;

function paused() {
  return atTitle || screens.isOpen();
}

function bootProgress(fraction: number, text: string) {
  bootFill.style.transform = `scaleX(${Math.max(0.04, Math.min(1, fraction))})`;
  bootText.textContent = `${text} ${Math.round(fraction * 100)}%`;
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.inset = "0";
labelRenderer.domElement.style.pointerEvents = "none";
document.querySelector("#labels")!.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#d5e6f0");
scene.fog = new THREE.Fog("#d5e6f0", 320, 820);
const hemi = new THREE.HemisphereLight("#f7fbff", "#a9b892", 1.05);
scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff4e4", 1.4);
sun.position.set(90, 160, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -310;
sun.shadow.camera.right = 310;
sun.shadow.camera.top = 310;
sun.shadow.camera.bottom = -310;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 1300;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.35;
sun.target.position.set(0, 0, -104);
scene.add(sun, sun.target);
const moon = new THREE.DirectionalLight("#9fb4ff", 0);
moon.target.position.set(0, 0, -104);
scene.add(moon, moon.target);
const sky = new Sky(scene);
const lampLights: THREE.PointLight[] = [];
const glowMaterials: { mat: THREE.MeshStandardMaterial; kind: "window" | "bulb" }[] = [];
let logoMaterial: THREE.MeshStandardMaterial | null = null;
/** Hour of day 0–24; the clock runs on its own unless paused. */
let hour = settings.get().hour;
let clockRunning = settings.get().dayCycle;
/** Real seconds for one in-game day. */
const DAY_SECONDS = 360;
let skyState: SkyState = Sky.state(hour);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.15, 1200);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.minPolarAngle = 0.12;
controls.minDistance = 8;
controls.maxDistance = 560;
controls.target.set(-13, 6, -130);

const viewRig = new THREE.Group();
const boom = new THREE.Group();
viewRig.add(boom);
boom.position.set(0, 1.35, 0);
scene.add(viewRig);

const player = new THREE.Group();
player.name = "player";
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.38, 0.95, 4, 10),
  new THREE.MeshStandardMaterial({ color: "#ff4d2e", roughness: 0.55 }),
);
body.position.y = 0.38 + 0.95 / 2;
body.name = "body";
player.add(body);
const nose = new THREE.Object3D();
nose.name = "nose";
nose.position.set(0, 1.25, -0.5);
player.add(nose);
scene.add(player);

const colliderRoot = new THREE.Group();
colliderRoot.name = "collider-debug";
colliderRoot.visible = false;
scene.add(colliderRoot);

const keys = new Set<string>();
const stick = { x: 0, y: 0 };
let mode: Mode = "orbit";
let yaw = 0;
let pitch = 0;
let solids: Solid[] = [];
let radius = 0.48;
let layout: Layout;
let world: THREE.Object3D | null = null;
let cineTime = 0;
let cinePlaying = false;
let collected = 0;
let won = false;
/** Seconds walked in the current run (stops while paused and once handed in). */
let runSeconds = 0;
let runSecondShown = -1;
let cineEmitTimer = 0;
let cineEnded = false;
let lastPlaceKey = "";
const papers: { id: string; mesh: THREE.Object3D; x: number; z: number; baseY: number; taken: boolean }[] = [];
const buildingLabels: CSS2DObject[] = [];
const treeLabels: CSS2DObject[] = [];
let posCurve: THREE.CatmullRomCurve3;
let lookCurve: THREE.CatmullRomCurve3;
let interiors: Interiors;
let FH = 3.6;
/** Floor the walker stands on, 1-based. */
let level = 1;
let jumpVelocity = 0;
let grounded = true;

function jump() {
  if (mode !== "walk" || !grounded) return;
  jumpVelocity = 7;
  grounded = false;
}
/** Floor picked in the panel for orbit view; null shows whole buildings with roofs. */
let pickedFloor: number | null = null;
/** Floor currently cut to on screen. */
let shownFloor: number | null | undefined;
const floorObjects: THREE.Object3D[] = [];
const roomTags: { floor: number; obj: CSS2DObject }[] = [];
const nearTags: CSS2DObject[] = [];
let nearTimer = 0;
let stairHere: Interiors["stairs"][number] | null = null;
let insideName = "";
let insideGroup = "";
/** Fancy graphics: surface shaders, shadows, sky dome and clouds, lamp lights. Off by default (lighter). */
let fancy = settings.get().graphics === "fancy";
const worldMaterials = new Set<THREE.MeshStandardMaterial>();
let minimap: Minimap | null = null;
let mapTimer = 0;
let labelsOn = settings.get().buildingLabels;
/** Smoothed walk-camera boom length. */
let boomLen = 5;
let fly: {
  t0: number;
  dur: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
} | null = null;

const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
const camWorld = new THREE.Vector3();

function asset(name: string) {
  return `${import.meta.env.BASE_URL}assets/${name}`;
}

function showError(message: string) {
  boot.classList.remove("hidden");
  bootText.textContent = message;
  retry.hidden = false;
}

function tag(text: string, sub: string, className: string) {
  const el = document.createElement("div");
  el.className = `tag ${className}`.trim();
  el.textContent = text;
  if (sub) {
    const small = document.createElement("small");
    small.textContent = sub;
    el.append(small);
  }
  const obj = new CSS2DObject(el);
  return obj;
}

function buildingTitle(b: Building) {
  if (b.display_name) return b.display_name;
  if (b.verified_name) return `Nhà ${b.verified_name}`;
  return NEUTRAL_LABEL[b.id] ?? b.id;
}

function addLabels() {
  for (const b of layout.buildings) {
    if (b.show_label === false) continue;
    const named = Boolean(b.verified_name || b.display_name);
    const label = tag(
      buildingTitle(b),
      named ? `${b.campus} · ước lượng` : "chưa có tên trên sơ đồ",
      `campus-${b.campus.toLowerCase()}`,
    );
    label.visible = labelsOn;
    label.position.set(b.center_xz[0], b.height + 3.2, b.center_xz[1]);
    label.userData.building = b;
    label.name = `label_${b.id}`;
    scene.add(label);
    buildingLabels.push(label);
  }
  layout.trees.forEach((tree, index) => {
    const label = tag("Cây", "", "tree");
    label.position.set(tree[0], 6.2 * tree[2], tree[1]);
    label.visible = settings.get().treeLabels;
    label.name = `label_tree_${index}`;
    scene.add(label);
    treeLabels.push(label);
  });
  for (const gate of layout.gates) {
    const text = gate.label === "CONG 2" ? "Cổng 2" : gate.label;
    const label = tag(text, gate.campus, `gate${gate.campus === "HUS" ? " hus" : ""}`);
    label.position.set(gate.center_xz[0], 8.4, gate.center_xz[1]);
    scene.add(label);
  }
}

function groupName(group: string) {
  return GROUP_NAME[group] ?? `Nhà ${group}`;
}

function maxFloors() {
  return Math.max(...interiors.buildings.filter((b) => b.access === "open").map((b) => b.floors));
}

function collectFloorObjects() {
  world?.traverse((obj) => {
    const data = obj.userData as { campus?: string; floor?: number };
    if (data.campus === "HUS" && typeof data.floor === "number" && data.floor > 0) floorObjects.push(obj);
  });
}

function addRoomTags() {
  for (const group of interiors.label_groups) {
    const obj = tag(group.text, `${groupName(group.group)} · ${group.nums} · tầng ${group.floor}`, "room");
    obj.position.set(...group.center);
    obj.visible = false;
    scene.add(obj);
    roomTags.push({ floor: group.floor, obj });
  }
  for (const item of interiors.floor_labels) {
    const obj = tag(item.text, `${groupName(item.group)} · tầng ${item.floor}`, "room floor");
    obj.position.set(...item.center);
    obj.visible = false;
    scene.add(obj);
    roomTags.push({ floor: item.floor, obj });
  }
  for (let i = 0; i < 6; i += 1) {
    const obj = tag("P.", "—", "room near");
    obj.visible = false;
    scene.add(obj);
    nearTags.push(obj);
  }
}

/** Show HUS floors up to `floor`; null shows every floor and the roofs. */
function applyFloorView(floor: number | null) {
  if (floor === shownFloor) return;
  shownFloor = floor;
  for (const obj of floorObjects) {
    const f = obj.userData.floor as number;
    obj.visible = floor === null || f <= floor;
  }
  for (const label of buildingLabels) {
    const b = label.userData.building as Building | undefined;
    if (!b) continue;
    const rise = b.roof === "gable" ? 4.5 : 1.8;
    const top = b.floors && floor !== null ? Math.min(b.floors, floor) * FH : b.height + rise;
    label.position.y = top + 3.2;
  }
  refreshRoomTags();
  refreshFloorButtons();
}

function refreshRoomTags() {
  const showPicked = mode !== "walk" && shownFloor !== null && shownFloor !== undefined && labelsOn;
  for (const item of roomTags) item.obj.visible = showPicked && item.floor === shownFloor;
  if (mode !== "walk") for (const obj of nearTags) obj.visible = false;
}

function refreshFloorButtons() {
  if (!interiors) return;
  const current = mode === "walk" ? shownFloor ?? null : pickedFloor;
  bus.emit("floorView", { floor: current, max: maxFloors() });
}

function pickFloor(floor: number | null) {
  pickedFloor = floor;
  if (mode === "cine") setMode("orbit");
  if (mode === "orbit") applyFloorView(pickedFloor);
  refreshFloorButtons();
}

function inRect(x: number, z: number, r: Rect, pad = 0) {
  return x >= r[0] - pad && x <= r[2] + pad && z >= r[1] - pad && z <= r[3] + pad;
}

/** Which HUS building (or link) the walker is in, on the current floor. */
function locate(x: number, z: number) {
  insideGroup = "";
  for (const b of interiors.buildings) {
    if (b.access !== "open" || b.floors < level) continue;
    if (inRect(x, z, b.footprint)) {
      insideGroup = b.group;
      return groupName(b.group);
    }
  }
  for (const link of interiors.links) {
    if (link.floors.includes(level) && inRect(x, z, link.rect)) return "Cầu nối T1–T2";
  }
  return "";
}

function stairAt(x: number, z: number) {
  for (const stair of interiors.stairs) {
    if (stair.floors[1] < level) continue;
    if (inRect(x, z, stair.zone, 0.6)) return stair;
  }
  return null;
}

function setLevel(next: number) {
  jumpVelocity = 0;
  grounded = true;
  level = next;
  player.position.y = (level - 1) * FH;
  viewRig.position.copy(player.position);
  viewRig.updateMatrixWorld(true);
}

function climb(delta: number) {
  if (mode !== "walk" || !stairHere || !grounded) return false;
  const next = level + delta;
  if (next < 1 || next > stairHere.floors[1]) return false;
  setLevel(next);
  updatePlace();
  return true;
}

function updatePlace() {
  const { x, z } = player.position;
  insideName = locate(x, z);
  stairHere = stairAt(x, z);
  if (mode === "walk") applyFloorView(insideName || level > 1 ? level : null);
  const stair: StairInfo | null = mode === "walk" && stairHere
    ? {
      name: `Cầu thang ${groupName(stairHere.group)}`,
      level,
      top: stairHere.floors[1],
      canUp: level < stairHere.floors[1],
      canDown: level > 1,
    }
    : null;
  const key = `${mode}|${insideGroup}|${insideName}|${level}|${stair ? `${stair.name}${stair.top}` : ""}`;
  if (key === lastPlaceKey) return;
  lastPlaceKey = key;
  bus.emit("place", { group: mode === "walk" ? insideGroup : "", name: mode === "walk" ? insideName : "", level, stair });
}

function refreshNearTags(dt: number) {
  nearTimer -= dt;
  if (nearTimer > 0) return;
  nearTimer = 0.2;
  const { x, z } = player.position;
  const near = interiors.rooms
    .filter((room) => room.floor === level)
    .map((room) => ({ room, d: Math.hypot(room.center[0] - x, room.center[2] - z) }))
    .filter((item) => item.d < 9)
    .sort((a, b) => a.d - b.d)
    .slice(0, nearTags.length);
  nearTags.forEach((obj, index) => {
    const item = near[index];
    if (!item || !labelsOn || !insideName) {
      obj.visible = false;
      return;
    }
    const { room } = item;
    const el = obj.element;
    const what = room.labels.join(" · ") || room.floor_label || room.type_name;
    el.firstChild!.textContent = `P.${room.num}`;
    (el.querySelector("small") as HTMLElement).textContent = what;
    obj.position.set(room.center[0], (room.floor - 1) * FH + 2.5, room.center[2]);
    obj.visible = true;
  });
}

/** First hit of the segment a→b against solids (inflated by pad), as a fraction 0–1. Boxes containing a are skipped. */
function segmentHit(a: THREE.Vector3, b: THREE.Vector3, pad: number, maxY: number) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  let best = 1;
  for (const s of solids) {
    if (s.min[1] >= maxY) continue;
    let t0 = 0, t1 = best;
    const lo = [s.min[0] - pad, s.min[1] - pad, s.min[2] - pad];
    const hi = [s.max[0] + pad, s.max[1] + pad, s.max[2] + pad];
    const o = [a.x, a.y, a.z];
    const d = [dx, dy, dz];
    let inside = true;
    let miss = false;
    for (let i = 0; i < 3; i += 1) {
      if (o[i] < lo[i] || o[i] > hi[i]) inside = false;
      if (Math.abs(d[i]) < 1e-9) {
        if (o[i] < lo[i] || o[i] > hi[i]) { miss = true; break; }
        continue;
      }
      let ta = (lo[i] - o[i]) / d[i];
      let tb = (hi[i] - o[i]) / d[i];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) { miss = true; break; }
    }
    if (miss || inside) continue;
    if (t0 < best) best = t0;
  }
  return best;
}

/** True when the walk camera sits outside every visible solid and has a clear line to the player. */
function cameraClear() {
  boom.getWorldPosition(pivot);
  camera.getWorldPosition(camTry);
  const maxY = cutHeight();
  for (const s of solids) {
    if (s.min[1] >= maxY) continue;
    if (camTry.x > s.min[0] + 0.02 && camTry.x < s.max[0] - 0.02 && camTry.y > s.min[1] + 0.02 &&
      camTry.y < s.max[1] - 0.02 && camTry.z > s.min[2] + 0.02 && camTry.z < s.max[2] - 0.02) return false;
  }
  return segmentHit(pivot, camTry, 0.0, maxY) >= 0.999;
}

/** Height above which geometry is hidden by the floor cut, so the camera may pass. */
function cutHeight() {
  // The slab of the next floor starts just under shownFloor*FH and is hidden too.
  return typeof shownFloor === "number" ? shownFloor * FH - 0.2 : Infinity;
}

const pivot = new THREE.Vector3();
const camTry = new THREE.Vector3();

/** The boom always points the same way (up 1.1, back `want`); walls only shorten it along that line. */
const BOOM_HEIGHT = 1.1;
let camHeight = BOOM_HEIGHT;

/**
 * Third-person boom that stops short of walls, partitions, slabs and closed blocks.
 * The camera keeps its orientation and only slides in and out along the boom, so touching a wall
 * never tilts the view. It snaps in when blocked and eases back out when the way is clear.
 */
function placeWalkCamera(dt: number) {
  const want = insideName ? 3.8 : 5.2;
  const full = Math.hypot(BOOM_HEIGHT, want);
  boom.updateMatrixWorld(true);
  boom.getWorldPosition(pivot);
  camTry.set(0, BOOM_HEIGHT, want);
  boom.localToWorld(camTry);
  const t = segmentHit(pivot, camTry, 0.28, cutHeight());
  const allowed = Math.max(0.45, Math.min(full, t * full - 0.15));
  if (allowed < boomLen) boomLen = allowed;
  else boomLen += (allowed - boomLen) * Math.min(1, dt * 2.5);
  const k = boomLen / full;
  camHeight = BOOM_HEIGHT * k;
  camera.position.set(0, camHeight, want * k);
  camera.rotation.set(0, 0, 0);
  camera.updateMatrixWorld(true);
  // Fade the capsule when the camera is right behind its head.
  const bodyMat = body.material as THREE.MeshStandardMaterial;
  const opacity = Math.min(1, Math.max(0.35, (boomLen - 0.6) / 1.4));
  bodyMat.transparent = opacity < 0.99;
  bodyMat.opacity = opacity;
}

/** Orbit camera: push out of any solid it has flown into. */
function keepOrbitCameraOut() {
  const maxY = cutHeight();
  const p = camera.position;
  for (const s of solids) {
    if (s.min[1] >= maxY) continue;
    const pad = 0.4;
    if (p.x < s.min[0] - pad || p.x > s.max[0] + pad || p.y < s.min[1] - pad || p.y > s.max[1] + pad ||
      p.z < s.min[2] - pad || p.z > s.max[2] + pad) continue;
    const pushes: [number, number][] = [
      [s.min[0] - pad - p.x, 0], [s.max[0] + pad - p.x, 0],
      [s.min[1] - pad - p.y, 1], [s.max[1] + pad - p.y, 1],
      [s.min[2] - pad - p.z, 2], [s.max[2] + pad - p.z, 2],
    ];
    pushes.sort((u, v) => Math.abs(u[0]) - Math.abs(v[0]));
    const [amount, axis] = pushes[0];
    if (axis === 0) p.x += amount;
    else if (axis === 1) p.y += amount;
    else p.z += amount;
  }
  if (p.y < 0.6) p.y = 0.6;
}

function applySky(now: number) {
  skyState = Sky.state(hour);
  const { sun: dir, day, dusk } = skyState;
  sky.update(skyState, now / 1000, camera);
  const up = Math.max(0, dir.y);
  sun.position.copy(sun.target.position).addScaledVector(dir, 600);
  sun.intensity = 2.6 * Math.min(1, up * 5) * (0.35 + 0.65 * day);
  sun.color.setRGB(1, 0.62 + 0.36 * Math.min(1, up * 2.5), 0.38 + 0.55 * Math.min(1, up * 2.5), THREE.SRGBColorSpace);
  sun.castShadow = fancy && sun.intensity > 0.05;
  moon.position.copy(moon.target.position).addScaledVector(dir, -600);
  moon.intensity = 0.45 * (1 - day);
  hemi.intensity = 0.28 + 0.9 * day;
  hemi.color.setRGB(0.24 + 0.73 * day, 0.3 + 0.68 * day, 0.5 + 0.5 * day, THREE.SRGBColorSpace);
  hemi.groundColor.setRGB(0.1 + 0.56 * day, 0.11 + 0.61 * day, 0.16 + 0.41 * day, THREE.SRGBColorSpace);
  const fog = scene.fog as THREE.Fog;
  fog.color.copy(skyState.horizon);
  (scene.background as THREE.Color | null)?.copy(skyState.horizon);
  if (!fancy) {
    // Flat sky: blend the horizon toward the zenith colour so day is blue and night is dark.
    (scene.background as THREE.Color).lerp(
      flatZenith.setRGB(0.012 + 0.43 * day, 0.02 + 0.62 * day, 0.06 + 0.9 * day, THREE.SRGBColorSpace), 0.45);
  }
  const night = 1 - day;
  for (const item of glowMaterials) {
    item.mat.emissiveIntensity = item.kind === "bulb" ? 0.15 + 2.2 * night : 1.15 * night;
  }
  if (logoMaterial) logoMaterial.emissiveIntensity = 0.05 + 0.55 * night;
  for (const light of lampLights) light.intensity = fancy ? 60 * night : 0;
  renderer.toneMappingExposure = 1.0 + 0.25 * night;
  void dusk;
}

const flatZenith = new THREE.Color();

function refreshClock() {
  bus.emit("hour", { hour, running: clockRunning });
}

function prepareWorld() {
  world?.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const kind = (mesh.userData as { kind?: string }).kind;
    mesh.receiveShadow = true;
    mesh.castShadow = kind !== "surface";
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const mat = m as THREE.MeshStandardMaterial;
      if (mat.userData.patched) continue;
      mat.userData.patched = true;
      const pattern = (mat.userData.pattern as string | undefined) ?? "plaster";
      patchSurface(mat, pattern, fancy);
      worldMaterials.add(mat);
      if (pattern === "glass_lit" || pattern === "glow") {
        mat.emissive = new THREE.Color(pattern === "glow" ? "#ffe2a0" : "#ffcf7a");
        mat.emissiveIntensity = 0;
        glowMaterials.push({ mat, kind: pattern === "glow" ? "bulb" : "window" });
      }
    }
  });
  for (const [x, z] of interiors.lamps.slice(0, 6)) {
    const light = new THREE.PointLight("#ffd79a", 0, 20, 1.6);
    light.position.set(x, 3.7, z);
    light.visible = fancy;
    scene.add(light);
    lampLights.push(light);
  }
  setGraphics(fancy);
}

/**
 * Light mode (default): plain colours, no shadows, no point lights, flat sky colour, lower pixel ratio.
 * Fancy mode: world-space surface shaders, sun shadows, shader sky with clouds, lamp lights.
 */
function setGraphics(on: boolean) {
  fancy = on;
  renderer.shadowMap.enabled = on;
  sun.castShadow = on;
  sky.dome.visible = on;
  sky.clouds.visible = on;
  for (const light of lampLights) light.visible = on;
  for (const mat of worldMaterials) {
    setSurfaceDetail(mat, on);
    mat.needsUpdate = true;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, on ? 1.75 : 1.25));
}

const mapPoint = new THREE.Vector3();

function refreshMinimap(dt: number) {
  if (!minimap) return;
  mapTimer -= dt;
  if (mapTimer > 0) return;
  mapTimer = 0.1;
  const dots = papers.filter((p) => !p.taken).map((p) => ({ x: p.x, z: p.z }));
  if (mode === "walk") {
    minimap.draw({ x: player.position.x, z: player.position.z, heading: player.rotation.y }, dots, insideGroup || null);
  } else {
    const target = mode === "orbit" ? controls.target : camera.getWorldDirection(mapPoint).multiplyScalar(60).add(camera.position);
    camera.getWorldPosition(camWorld);
    minimap.draw({ x: target.x, z: target.z }, dots, null, { x: camWorld.x, z: camWorld.z });
  }
}

function addMinimap() {
  const host = document.querySelector<HTMLElement>("#minimap-canvas")!;
  type MapLayout = Layout & { surfaces: { id: string; position: Vec3; size: Vec3; color: string }[] };
  const xs = interiors.buildings.flatMap((b) => [b.footprint[0], b.footprint[2]]);
  const zs = interiors.buildings.flatMap((b) => [b.footprint[1], b.footprint[3]]);
  const gateZ = Math.max(...layout.gates.map((g) => g.center_xz[1]));
  const bounds = { x0: Math.min(...xs) - 12, z0: Math.min(...zs) - 10, x1: Math.max(...xs) + 12, z1: gateZ + 40 };
  minimap = new Minimap(host, interiors.buildings, (layout as MapLayout).surfaces, layout.gates, interiors.links, bounds);
  const fit = () => minimap!.resize(window.innerWidth < 820 ? 128 : 232);
  fit();
  window.addEventListener("resize", fit);
  minimap.canvas.addEventListener("click", (event) => {
    const rect = minimap!.canvas.getBoundingClientRect();
    const [x, z] = minimap!.toWorld(event.clientX - rect.left, event.clientY - rect.top);
    if (mode === "cine") setMode("orbit");
    if (mode !== "orbit") return;
    const shift = new THREE.Vector3(x - controls.target.x, 0, z - controls.target.z);
    fly = {
      t0: performance.now(),
      dur: 700,
      from: camera.position.clone(),
      to: camera.position.clone().add(shift),
      fromTarget: controls.target.clone(),
      toTarget: controls.target.clone().add(shift),
    };
    controls.enabled = false;
  });
}

async function addLogo() {
  const logo = interiors.logo;
  if (!logo) return;
  const response = await fetch(asset(logo.file));
  if (!response.ok) return;
  let svg = await response.text();
  const [vx, vy, vw, vh] = logo.crop_viewbox;
  svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${vx} ${vy} ${vw} ${vh}"`)
    .replace(/width="[^"]*"/, `width="${Math.round(1024 * (vw / vh))}"`)
    .replace(/height="[^"]*"/, 'height="1024"');
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolveImage, rejectImage) => {
    image.onload = () => resolveImage();
    image.onerror = () => rejectImage(new Error("logo"));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(1024 * (vw / vh));
  canvas.height = 1024;
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  logoMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.35,
    roughness: 0.55,
    emissive: new THREE.Color("#ffffff"),
    emissiveMap: texture,
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });
  const height = logo.height;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * logo.aspect, height), logoMaterial);
  const b = interiors.buildings.find((item) => item.id === logo.building)!;
  const [x0, z0, x1, z1] = b.footprint;
  const offset = 0.34;
  if (logo.side === "-x") mesh.position.set(x0 - offset, logo.center_y, logo.center_along), (mesh.rotation.y = -Math.PI / 2);
  else if (logo.side === "+x") mesh.position.set(x1 + offset, logo.center_y, logo.center_along), (mesh.rotation.y = Math.PI / 2);
  else if (logo.side === "-z") mesh.position.set(logo.center_along, logo.center_y, z0 - offset), (mesh.rotation.y = Math.PI);
  else mesh.position.set(logo.center_along, logo.center_y, z1 + offset);
  mesh.name = "hus_logo";
  mesh.userData = { campus: "HUS", floor: logo.floor_tag, building_id: logo.building };
  mesh.castShadow = true;
  scene.add(mesh);
  floorObjects.push(mesh);
  mesh.visible = shownFloor === null || shownFloor === undefined || shownFloor >= logo.floor_tag;
}

function addPapers() {
  for (const item of layout.gameplay.deadlines) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.07, 1.2),
      new THREE.MeshStandardMaterial({ color: "#ffe14a", emissive: "#8a5a10", emissiveIntensity: 0.35, roughness: 0.6 }),
    );
    mesh.position.set(item.position[0], item.position[1], item.position[2]);
    mesh.name = item.id;
    const mark = tag("deadline", "", "paper");
    mark.position.set(0, 0.6, 0);
    mesh.add(mark);
    scene.add(mesh);
    papers.push({
      id: item.id,
      mesh,
      x: item.position[0],
      z: item.position[2],
      baseY: item.position[1],
      taken: false,
    });
  }
}

function addColliderDebug() {
  for (const solid of solids) {
    const box = new THREE.Box3(
      new THREE.Vector3(solid.min[0], solid.min[1], solid.min[2]),
      new THREE.Vector3(solid.max[0], solid.max[1], solid.max[2]),
    );
    colliderRoot.add(new THREE.Box3Helper(box, 0x1d4e89));
  }
}

function setTreesVisible(on: boolean) {
  world?.traverse((obj) => {
    if (obj.name.startsWith("tree_")) obj.visible = on;
  });
}

function duration() {
  return layout.gameplay.cinematic.duration_s;
}

function totalPapers() {
  return papers.length;
}

function emitCine() {
  if (!layout) return;
  bus.emit("cine", { time: cineTime, duration: duration(), playing: cinePlaying });
}

function touchControls() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
}

/** Touch pads show only when walking on a touch screen with nothing in front. */
function refreshControls() {
  if (!layout) return;
  const showTouch = mode === "walk" && touchControls() && !paused();
  touch.hidden = !showTouch;
  document.body.classList.toggle("touch-walk", showTouch);
}

function applyCinePose() {
  const u = duration() === 0 ? 0 : Math.min(1, cineTime / duration());
  camera.position.copy(posCurve.getPoint(u));
  camera.lookAt(lookCurve.getPoint(u));
}

function detachCamera() {
  camera.getWorldPosition(camWorld);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  camera.removeFromParent();
  scene.add(camera);
  camera.position.copy(camWorld);
  controls.target.copy(camWorld).addScaledVector(dir, 10);
}

function releasePointer() {
  if (!document.pointerLockElement) return;
  releasingLock = true;
  document.exitPointerLock();
}

function setMode(next: Mode) {
  keys.clear();
  setLevel(level);
  releasePointer();
  controls.autoRotate = false;
  const bodyMat = body.material as THREE.MeshStandardMaterial;
  bodyMat.opacity = 1;
  bodyMat.transparent = false;
  if (next === "orbit") {
    if (mode === "walk" || mode === "cine") detachCamera();
    controls.enabled = true;
    player.visible = true;
  } else if (next === "walk") {
    controls.enabled = false;
    fly = null;
    camera.removeFromParent();
    boom.add(camera);
    camera.position.set(0, 1.1, 5);
    boomLen = 5;
    camera.rotation.set(0, 0, 0);
    player.visible = true;
    viewRig.position.copy(player.position);
    viewRig.rotation.y = yaw;
    boom.rotation.x = pitch;
    viewRig.updateMatrixWorld(true);
  } else {
    if (mode === "walk") detachCamera();
    controls.enabled = false;
    fly = null;
    cineTime = 0;
    cinePlaying = true;
    cineEnded = false;
    player.visible = true;
    applyCinePose();
  }
  mode = next;
  bus.emit("mode", { mode });
  if (next === "walk") {
    shownFloor = undefined;
    updatePlace();
  } else {
    shownFloor = undefined;
    applyFloorView(next === "orbit" ? pickedFloor : null);
    updatePlace();
  }
  refreshRoomTags();
  refreshFloorButtons();
  refreshControls();
  emitCine();
}

function placeBookmark(id: string, instant: boolean) {
  const bookmark = layout.camera_bookmarks.find((item) => item.id === id);
  if (!bookmark) return;
  if (mode !== "orbit") setMode("orbit");
  const to = new THREE.Vector3(...bookmark.position);
  const toTarget = new THREE.Vector3(...bookmark.target);
  if (instant || reducedMotion()) {
    fly = null;
    camera.position.copy(to);
    controls.target.copy(toTarget);
    controls.update();
    return;
  }
  fly = {
    t0: performance.now(),
    dur: 900,
    from: camera.position.clone(),
    to,
    fromTarget: controls.target.clone(),
    toTarget,
  };
  controls.enabled = false;
}

function held(action: Action) {
  return bindingsFor(action).some((code) => keys.has(code));
}

function isAction(action: Action, code: string) {
  return bindingsFor(action).includes(code);
}

function currentInput(): Input {
  const forward = (held("forward") ? 1 : 0) - (held("back") ? 1 : 0) + stick.y;
  const strafe = (held("right") ? 1 : 0) - (held("left") ? 1 : 0) + stick.x;
  return { forward, strafe };
}

function basis() {
  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();
  right.crossVectors(fwd, UP);
  return { f: fwd.clone(), r: right.clone() };
}

function updateWalk(dt: number, input: Input) {
  viewRig.position.copy(player.position);
  viewRig.rotation.y = yaw;
  boom.rotation.x = pitch;
  viewRig.updateMatrixWorld(true);
  const frame = basis();
  let mx = frame.f.x * input.forward + frame.r.x * input.strafe;
  let mz = frame.f.z * input.forward + frame.r.z * input.strafe;
  const mag = Math.hypot(mx, mz);
  if (mag > 1e-5) {
    const scale = (WALK_SPEED * dt * Math.min(1, mag)) / mag;
    mx *= scale;
    mz *= scale;
    const next = slide(player.position.x, player.position.z, mx, mz, solids, radius, player.position.y);
    const movedX = next.x - player.position.x;
    const movedZ = next.z - player.position.z;
    player.position.x = next.x;
    player.position.z = next.z;
    if (movedX * movedX + movedZ * movedZ > 1e-6) {
      player.rotation.y = yawFacing(movedX, movedZ);
    }
  }
  const vertical = verticalStep(player.position.y, jumpVelocity, dt, player.position.x, player.position.z, solids, radius, (level - 1) * FH);
  player.position.y = vertical.y;
  jumpVelocity = vertical.velocity;
  grounded = vertical.grounded;
  updatePlace();
  refreshNearTags(dt);
  viewRig.position.copy(player.position);
  viewRig.updateMatrixWorld(true);
  placeWalkCamera(dt);
  camera.getWorldPosition(camWorld);
  if (camWorld.y < (level - 1) * FH + 0.85) {
    pitch = Math.max(-0.6, pitch - 0.04);
    boom.rotation.x = pitch;
    viewRig.updateMatrixWorld(true);
    placeWalkCamera(dt);
  }
  if (!won) {
    runSeconds += dt;
    if (Math.floor(runSeconds) !== runSecondShown) {
      runSecondShown = Math.floor(runSeconds);
      bus.emit("runTime", { seconds: runSeconds });
    }
    for (const paper of papers) {
      if (paper.taken || Math.abs(paper.baseY - 1.15 - (level - 1) * FH) > 1) continue;
      const dx = player.position.x - paper.x;
      const dz = player.position.z - paper.z;
      if (dx * dx + dz * dz < 2.2 * 2.2) {
        paper.taken = true;
        paper.mesh.visible = false;
        collected += 1;
        bus.emit("deadline", { collected, total: totalPapers() });
      }
    }
    if (collected >= totalPapers()) {
      for (const id of layout.gameplay.return_gates) {
        const gate = layout.gates.find((item) => item.id === id);
        if (!gate) continue;
        const dx = player.position.x - gate.center_xz[0];
        const dz = player.position.z - gate.center_xz[1];
        if (dx * dx + dz * dz <= layout.gameplay.return_radius ** 2) won = true;
      }
      if (won) bus.emit("won", { seconds: runSeconds });
    }
  }
}

function resetMission() {
  collected = 0;
  won = false;
  runSeconds = 0;
  runSecondShown = -1;
  for (const paper of papers) {
    paper.taken = false;
    paper.mesh.visible = true;
  }
  setLevel(1);
  player.position.set(layout.gameplay.spawn[0], 0, layout.gameplay.spawn[2]);
  player.rotation.y = 0;
  yaw = 0;
  pitch = 0;
  bus.emit("run", { total: totalPapers() });
  bus.emit("deadline", { collected: 0, total: totalPapers() });
  if (mode === "walk") updatePlace();
  if (mode === "walk") {
    viewRig.position.copy(player.position);
    viewRig.rotation.y = 0;
    boom.rotation.x = 0;
  }
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, fancy ? 1.75 : 1.25));
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  applyTitleFraming();
  refreshControls();
}

/**
 * On the title screen the menu covers the left side, so the view is shifted right to keep the
 * campus in the visible part. Phones put the menu at the bottom instead and shift the view up.
 */
function applyTitleFraming() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!atTitle) {
    camera.clearViewOffset();
    return;
  }
  const panel = document.querySelector<HTMLElement>(".title-panel");
  if (w >= 820) {
    const covered = panel ? panel.getBoundingClientRect().right : Math.min(560, w * 0.45);
    camera.setViewOffset(w, h, -covered / 2, 0, w, h);
  } else {
    const covered = panel ? h - panel.getBoundingClientRect().top : h * 0.5;
    camera.setViewOffset(w, h, 0, covered / 2, w, h);
  }
}

function enterTitle() {
  atTitle = true;
  setUiHidden(false);
  if (mode !== "orbit") setMode("orbit");
  placeBookmark("overview", true);
  controls.autoRotate = !reducedMotion();
  controls.autoRotateSpeed = 0.35;
  showTitle(true);
  applyTitleFraming();
  refreshControls();
}

function leaveTitle(next: Mode) {
  atTitle = false;
  showTitle(false);
  camera.clearViewOffset();
  controls.autoRotate = false;
  if (next === "orbit") {
    placeBookmark("overview", false);
    bus.emit("mode", { mode: "orbit" });
  } else {
    setMode(next);
  }
  refreshControls();
}

function selfTest() {
  const notes: string[] = [];
  const fail = (message: string) => notes.push(message);
  setMode("walk");
  player.position.set(layout.gameplay.spawn[0], 0, layout.gameplay.spawn[2]);
  yaw = 0;
  pitch = 0;
  viewRig.position.copy(player.position);
  viewRig.rotation.y = 0;
  boom.rotation.x = 0;
  viewRig.updateMatrixWorld(true);
  const frame = basis();
  if (frame.f.dot(new THREE.Vector3(0, 0, -1)) < 0.98) fail(`nhìn thẳng không phải -Z (${frame.f.x.toFixed(2)}, ${frame.f.z.toFixed(2)})`);
  if (frame.r.dot(new THREE.Vector3(1, 0, 0)) < 0.98) fail(`bên phải không phải +X (${frame.r.x.toFixed(2)}, ${frame.r.z.toFixed(2)})`);

  const press = (input: Input, seconds: number) => {
    const start = player.position.clone();
    const steps = Math.round(seconds / 0.016);
    for (let i = 0; i < steps; i += 1) updateWalk(0.016, input);
    const delta = player.position.clone().sub(start);
    delta.y = 0;
    return delta;
  };
  const face = () => new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion).normalize();
  const noseDir = () => {
    const origin = new THREE.Vector3();
    const tip = new THREE.Vector3();
    player.getWorldPosition(origin);
    nose.getWorldPosition(tip);
    return tip.sub(origin).setY(0).normalize();
  };

  player.position.set(layout.gameplay.spawn[0], 0, layout.gameplay.spawn[2]);
  const cases: [Input, "f" | "r", number][] = [
    [{ forward: 1, strafe: 0 }, "f", 1],
    [{ forward: -1, strafe: 0 }, "f", -1],
    [{ forward: 0, strafe: 1 }, "r", 1],
    [{ forward: 0, strafe: -1 }, "r", -1],
  ];
  for (const [input, axis, sign] of cases) {
    player.position.set(layout.gameplay.spawn[0], 0, layout.gameplay.spawn[2]);
    player.rotation.y = 0;
    const before = basis();
    const delta = press(input, 0.4);
    if (delta.length() < 0.4) {
      fail("không di chuyển");
      continue;
    }
    const along = delta.clone().normalize().dot(before[axis]) * sign;
    if (along < 0.9) fail(`hướng ${axis} ${sign} lệch (${along.toFixed(2)})`);
    const travel = delta.clone().normalize();
    if (face().dot(travel) < 0.9) fail(`nhân vật không quay theo hướng đi (${face().dot(travel).toFixed(2)})`);
    if (noseDir().dot(face()) < 0.9) fail("mũi nhân vật không cùng hướng với thân");
  }

  const fp = (id: string) => {
    const b = layout.buildings.find((item) => item.id === id)!;
    const [cx, cz] = b.center_xz;
    const [w, d] = (b as Building & { size_xz: [number, number] }).size_xz;
    return { x0: cx - w / 2, z0: cz - d / 2, x1: cx + w / 2, z1: cz + d / 2, cx, cz };
  };
  const houseH = fp("USSH_H");
  player.position.set(houseH.cx, 0, houseH.z1 + 5);
  press({ forward: 1, strafe: 0 }, 0.8);
  if (player.position.z < houseH.z1 - 0.1) fail(`đi xuyên nhà H, z=${player.position.z.toFixed(2)}`);

  // Nhà USSH là khối kín: đi sang tây vào mặt đông nhà C phải bị chặn.
  setLevel(1);
  const houseC = fp("USSH_C");
  player.position.set(houseC.x1 + 6, 0, houseC.cz);
  press({ forward: 0, strafe: -1 }, 1.0);
  if (player.position.x < houseC.x1 + 0.4) fail(`đi vào được nhà C USSH, x=${player.position.x.toFixed(2)}`);

  // Trục rộng: từ cổng HUS đi thẳng qua sảnh T1, lối có mái, sảnh T2 ra vườn.
  const husGate = layout.gates.find((g) => g.campus === "HUS")!;
  const lane = layout.gatehouse?.lane ?? [husGate.center_xz[0] - 8, husGate.center_xz[0] + 8];
  const goal = layout.gameplay.axis_check.z_to + 12;
  for (const x of [husGate.center_xz[0], lane[0] + 1.6, lane[1] - 1.6]) {
    player.position.set(x, 0, husGate.center_xz[1] + 2);
    yaw = 0;
    press({ forward: 1, strafe: 0 }, 9.0);
    if (player.position.z > goal) fail(`trục cổng HUS → vườn bị chặn ở x=${x.toFixed(1)}, z=${player.position.z.toFixed(1)}`);
  }

  // Cầu thang: lên tầng 2 ở chân T1, đi trên tầng 2 không vướng tường tầng 1, rồi xuống.
  const stair = interiors.stairs.find((item) => item.hall === "w_join");
  if (!stair) fail("không thấy cầu thang T1");
  else {
    const cx = (stair.zone[0] + stair.zone[2]) / 2;
    const cz = (stair.zone[1] + stair.zone[3]) / 2;
    player.position.set(cx, 0, cz);
    setLevel(1);
    updatePlace();
    if (!stairHere) fail("đứng ở ô cầu thang mà không nhận cầu thang");
    if (!climb(1) || level !== 2 || Math.abs(player.position.y - FH) > 1e-6) fail("không lên được tầng 2");
    if (shownFloor !== 2) fail(`đang ở tầng 2 mà cắt nhà ở ${String(shownFloor)}`);
    press({ forward: 0, strafe: 1 }, 0.3);
    if (!insideName) fail("lên tầng 2 mà không ở trong T1");
    player.position.set(cx, FH, cz);
    updatePlace();
    if (!climb(-1) || level !== 1 || player.position.y !== 0) fail("không xuống được tầng 1");
  }
  setLevel(1);

  // Camera đi bộ không chui vào tường: đứng sát tường hành lang T1, quay lưng vào tường ở nhiều hướng.
  const S = layout.world_scale?.horizontal ?? 1;
  const bar = fp("HUS_T1");
  const wing = fp("HUS_T1_W");
  const t5 = fp("HUS_T5");
  const camCases: [number, number, number][] = [
    [bar.cx - 26 * S, bar.z1 - 1.2, 1], [bar.cx - 26 * S, bar.z1 - 1.2, 3], [wing.cx, wing.cz - 9.5 * S, 2],
    [t5.cx, t5.cz + 8.8 * S, 6], [houseC.x1 + 1.0, houseC.cz, 1],
  ];
  for (const [px, pz, fl] of camCases) {
    player.position.set(px, 0, pz);
    setLevel(fl);
    for (const yv of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      yaw = yv;
      pitch = 0;
      boomLen = 6;
      updateWalk(0.016, { forward: 0, strafe: 0 });
      if (!cameraClear()) fail(`camera xuyên tường ở (${px}, ${pz}) tầng ${fl}, hướng ${yv.toFixed(2)}`);
    }
  }
  setLevel(1);

  // Cắt tầng: tầng 1 ẩn mái và tầng trên; "Cả nhà" hiện lại.
  shownFloor = undefined;
  applyFloorView(1);
  const hiddenUpper = floorObjects.filter((obj) => (obj.userData.floor as number) > 1 && obj.visible).length;
  if (floorObjects.length < 50) fail(`quá ít khối theo tầng (${floorObjects.length})`);
  if (hiddenUpper > 0) fail("cắt tầng 1 mà còn khối tầng trên");
  applyFloorView(null);
  if (floorObjects.some((obj) => !obj.visible)) fail("bỏ cắt tầng mà còn khối bị ẩn");

  pitch = 0.25;
  viewRig.rotation.y = yaw;
  boom.rotation.x = pitch;
  viewRig.updateMatrixWorld(true);
  camera.getWorldPosition(camWorld);
  if (camWorld.y < 0.8) fail(`camera dưới mặt đất (${camWorld.y.toFixed(2)})`);

  setMode("cine");
  const cineStart = camera.position.clone();
  for (let i = 0; i < 20; i += 1) {
    cineTime = Math.min(duration(), cineTime + 0.1);
    applyCinePose();
  }
  if (camera.position.distanceTo(cineStart) < 1) fail("camera quay cảnh không dịch chuyển");

  const treeCount = layout.trees.length;
  setTreesVisible(false);
  let hidden = 0;
  world?.traverse((obj) => {
    if (obj.name.startsWith("tree_") && !obj.visible) hidden += 1;
  });
  setTreesVisible(true);
  if (hidden < treeCount) fail("ẩn cây làm mất dữ liệu hoặc không tắt mesh");

  resetMission();
  setMode("orbit");
  placeBookmark("overview", true);
  return { ok: notes.length === 0, notes };
}

let lastFrame = 0;
let clockTick = 0;

function animate(now: number) {
  requestAnimationFrame(animate);
  const dt = lastFrame === 0 ? 1 / 60 : Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (mode === "orbit") {
    if (fly) {
      const u = Math.min(1, (now - fly.t0) / fly.dur);
      const k = u * u * (3 - 2 * u);
      camera.position.lerpVectors(fly.from, fly.to, k);
      controls.target.lerpVectors(fly.fromTarget, fly.toTarget, k);
      if (u >= 1) {
        fly = null;
        controls.enabled = true;
      }
    } else {
      controls.update();
      keepOrbitCameraOut();
    }
  } else if (mode === "walk") {
    if (!paused()) updateWalk(dt, currentInput());
  } else if (cinePlaying && !paused()) {
    cineTime = Math.min(duration(), cineTime + dt);
    applyCinePose();
    if (cineTime >= duration()) {
      cinePlaying = false;
      if (!cineEnded) {
        cineEnded = true;
        bus.emit("cineEnd", {});
      }
      emitCine();
    }
    cineEmitTimer -= dt;
    if (cineEmitTimer <= 0) {
      cineEmitTimer = 0.1;
      emitCine();
    }
  }
  if (clockRunning && !screens.isOpen()) {
    hour = (hour + (dt * 24) / DAY_SECONDS) % 24;
    clockTick += dt;
    if (clockTick > 0.5) {
      clockTick = 0;
      refreshClock();
    }
  }
  applySky(now);
  refreshMinimap(dt);
  const t = now / 1000;
  for (const paper of papers) {
    if (paper.taken) continue;
    paper.mesh.position.y = paper.baseY + Math.sin(t * 2 + paper.x) * 0.22;
    paper.mesh.rotation.y = t * 0.8;
  }
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

/** Apply a look delta in pixels, honouring sensitivity and the inverted-Y setting. */
function look(dx: number, dy: number, scale: number) {
  const s = settings.get();
  const k = scale * s.lookSensitivity;
  yaw -= dx * k;
  pitch = Math.max(-0.6, Math.min(0.25, pitch - dy * k * 0.9 * (s.invertY ? -1 : 1)));
}

function cineToggle() {
  if (mode !== "cine") return;
  if (!cinePlaying && cineTime >= duration()) cineTime = 0;
  cinePlaying = !cinePlaying;
  emitCine();
}

function cineRestart() {
  if (mode !== "cine") return;
  cineTime = 0;
  cinePlaying = true;
  cineEnded = false;
  applyCinePose();
  emitCine();
}

/** Settings → scene. Runs once at start and again for each changed key. */
function applySettings(changed: (keyof ReturnType<typeof settings.get>)[] | "all") {
  const s = settings.get();
  const has = (k: keyof typeof s) => changed === "all" || changed.includes(k);
  if (has("graphics") && changed !== "all") setGraphics(s.graphics === "fancy");
  if (has("buildingLabels")) {
    labelsOn = s.buildingLabels;
    for (const label of buildingLabels) label.visible = labelsOn;
    refreshRoomTags();
    nearTimer = 0;
  }
  if (has("treeLabels")) for (const label of treeLabels) label.visible = s.treeLabels;
  if (has("trees")) setTreesVisible(s.trees);
  if (has("colliders")) colliderRoot.visible = FLAGS.debug && s.colliders;
  if (has("dayCycle")) clockRunning = s.dayCycle;
  if (has("hour") && changed !== "all") {
    hour = s.hour;
    refreshClock();
  }
  if (has("dayCycle")) refreshClock();
}

function bindUi() {
  retry.addEventListener("click", () => location.reload());

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("input, select, textarea, [contenteditable=true]")) return;
    if (screens.isOpen() || atTitle) return; // dialogs and the title menu own the keyboard
    const code = event.code;
    const wasHeld = keys.has(code);
    keys.add(code);
    if (isAction("pause", code) && !event.repeat) {
      event.preventDefault();
      screens.push("pause");
      return;
    }
    if (isAction("jump", code) && !event.repeat && !wasHeld) jump();
    const moving = (["forward", "back", "left", "right", "jump"] as Action[]).some((a) => isAction(a, code));
    if (mode === "walk" && moving) event.preventDefault();
    if (isAction("toggleUi", code)) setUiHidden(!document.body.classList.contains("ui-off"));
    if (mode === "walk" && isAction("floorUp", code)) climb(1);
    if (mode === "walk" && isAction("floorDown", code)) climb(-1);
    if (isAction("modeWalk", code) && mode !== "walk") setMode("walk");
    if (isAction("modeOrbit", code) && mode !== "orbit") setMode("orbit");
    if (isAction("modeCine", code) && mode !== "cine") setMode("cine");
  });
  document.querySelector("#jump")!.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    jump();
  });
  window.addEventListener("blur", () => { keys.clear(); stick.x = 0; stick.y = 0; });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  canvas.addEventListener("click", () => {
    if (mode === "walk" && !paused() && !window.matchMedia("(pointer: coarse)").matches) {
      canvas.requestPointerLock();
    }
  });
  document.addEventListener("pointerlockchange", () => {
    const locked = document.pointerLockElement === canvas;
    bus.emit("pointerLock", { locked });
    // Esc while looking releases the mouse; treat that as "pause", the way most games do.
    if (!locked && !releasingLock && mode === "walk" && !paused()) screens.push("pause");
    releasingLock = false;
  });
  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== canvas || mode !== "walk" || paused()) return;
    look(event.movementX, event.movementY, 0.0022);
  });

  screens.onChange((top) => {
    keys.clear();
    stick.x = 0;
    stick.y = 0;
    knob.style.transform = "translate(0, 0)";
    if (top) releasePointer();
    // The settings slider shows the clock as it is now, not as it was last saved.
    if (top === "settings") settings.set({ hour: Math.round(hour * 4) / 4 });
    refreshControls();
  });
  settings.subscribe((_, changed) => applySettings(changed));

  const moveStick = (clientX: number, clientY: number) => {
    const rect = stickEl.getBoundingClientRect();
    let x = (clientX - (rect.left + rect.width / 2)) / 36;
    let y = (clientY - (rect.top + rect.height / 2)) / 36;
    const mag = Math.hypot(x, y) || 1;
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }
    stick.x = x;
    stick.y = -y;
    knob.style.transform = `translate(${x * 28}px, ${y * 28}px)`;
  };
  stickEl.addEventListener("pointerdown", (event) => {
    stickEl.setPointerCapture(event.pointerId);
    moveStick(event.clientX, event.clientY);
  });
  stickEl.addEventListener("pointermove", (event) => {
    if (!stickEl.hasPointerCapture(event.pointerId)) return;
    moveStick(event.clientX, event.clientY);
  });
  const releaseStick = (event: PointerEvent) => {
    if (stickEl.hasPointerCapture(event.pointerId)) stickEl.releasePointerCapture(event.pointerId);
    stick.x = 0;
    stick.y = 0;
    knob.style.transform = "translate(0, 0)";
  };
  stickEl.addEventListener("pointerup", releaseStick);
  stickEl.addEventListener("pointercancel", releaseStick);

  let lookPointer: number | null = null;
  let lastX = 0;
  let lastY = 0;
  const beginLook = (event: PointerEvent) => {
    if (mode !== "walk" || document.pointerLockElement || paused()) return;
    lookPointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const dragLook = (event: PointerEvent) => {
    if (event.pointerId !== lookPointer) return;
    look(event.clientX - lastX, event.clientY - lastY, 0.005);
    lastX = event.clientX;
    lastY = event.clientY;
  };
  const endLook = (event: PointerEvent) => {
    if (event.pointerId === lookPointer) lookPointer = null;
  };
  lookpad.addEventListener("pointerdown", beginLook);
  lookpad.addEventListener("pointermove", dragLook);
  lookpad.addEventListener("pointerup", endLook);
  canvas.addEventListener("pointerdown", (event) => {
    if (mode === "walk" && window.matchMedia("(pointer: coarse)").matches) beginLook(event);
  });
  canvas.addEventListener("pointermove", dragLook);
  canvas.addEventListener("pointerup", endLook);
  window.addEventListener("resize", resize);
}

function emitAll() {
  bus.emit("mode", { mode });
  lastPlaceKey = "";
  updatePlace();
  bus.emit("run", { total: totalPapers() });
  bus.emit("deadline", { collected, total: totalPapers() });
  refreshClock();
  refreshFloorButtons();
  emitCine();
}

async function main() {
  initInterface({
    start: leaveTitle,
    setMode: (next) => {
      if (next !== mode) setMode(next);
    },
    mode: () => mode,
    bookmark: (id) => placeBookmark(id, false),
    setFloor: pickFloor,
    climb: (delta) => void climb(delta),
    resetRun: resetMission,
    cineToggle,
    cineRestart,
    capture: () => captureCanvas(canvas, () => renderer.render(scene, camera)),
    goTitle: enterTitle,
    touchControls,
    pointerLocked: () => document.pointerLockElement === canvas,
  });
  bindUi();
  resize();
  bootProgress(0.02, t("boot.data"));
  try {
    const [layoutResponse, collisionResponse, interiorResponse] = await Promise.all([
      fetch(asset("campus.layout.json")),
      fetch(asset("collision.json")),
      fetch(asset("interiors.json")),
    ]);
    if (!layoutResponse.ok || !collisionResponse.ok || !interiorResponse.ok) throw new Error("Không đọc được dữ liệu sân.");
    layout = (await layoutResponse.json()) as Layout;
    interiors = (await interiorResponse.json()) as Interiors;
    FH = interiors.floor_height;
    const collision = (await collisionResponse.json()) as { solids: Solid[]; player_radius: number };
    solids = collision.solids;
    radius = collision.player_radius;
    bootProgress(0.08, t("boot.model"));
    const gltf = await new GLTFLoader().loadAsync(asset("campus_blockout.glb"), (event) => {
      if (event.total > 0) bootProgress(0.08 + 0.84 * (event.loaded / event.total), t("boot.model"));
    });
    bootProgress(0.94, t("boot.loading"));
    world = gltf.scene;
    scene.add(world);
    posCurve = new THREE.CatmullRomCurve3(layout.gameplay.cinematic.points.map((point) => new THREE.Vector3(...point.position)));
    lookCurve = new THREE.CatmullRomCurve3(layout.gameplay.cinematic.points.map((point) => new THREE.Vector3(...point.look)));
    prepareWorld();
    addLabels();
    collectFloorObjects();
    addRoomTags();
    addPapers();
    setTarget("explorer", new Set(interiors.buildings.filter((b) => b.access === "open" && b.campus === "HUS").map((b) => b.group)).size);
    addColliderDebug();
    try {
      await addLogo();
    } catch {
      errors.push("Không vẽ được logo HUS.");
    }
    addMinimap();
    const result = bus.silently(() => {
      resetMission();
      const outcome = selfTest();
      applySettings("all");
      return outcome;
    });
    const api = {
      ready: true,
      errors,
      selfTest: result,
      mode: () => mode,
      setMode,
      flyTo: (id: string) => placeBookmark(id, true),
      player: () => ({ x: player.position.x, y: player.position.y, z: player.position.z, level }),
      setHour: (h: number, run = false) => {
        hour = ((h % 24) + 24) % 24;
        clockRunning = run;
        refreshClock();
      },
      collect: () => {
        // Test helper: pick up every paper as if walked over.
        for (const paper of papers) if (!paper.taken) {
          paper.taken = true;
          paper.mesh.visible = false;
          collected += 1;
          bus.emit("deadline", { collected, total: totalPapers() });
        }
      },
      cameraClear: () => cameraClear(),
      setGraphics: (on: boolean) => settings.set({ graphics: on ? "fancy" : "light" }),
      start: (next: Mode) => leaveTitle(next),
      title: () => enterTitle(),
      openScreen: (id: Parameters<typeof screens.push>[0]) => screens.push(id),
      closeScreens: () => screens.closeAll(),
      graphics: () => ({ fancy, shadows: renderer.shadowMap.enabled, sky: sky.dome.visible }),
      /** Run walk frames synchronously (for scripts; headless rendering can be slower than one frame per second). */
      step: (frames = 30) => {
        for (let i = 0; i < frames; i += 1) if (mode === "walk") updateWalk(0.016, { forward: 0, strafe: 0 });
      },
      showFloor: (floor: number | null) => {
        pickedFloor = floor;
        setMode("orbit");
      },
      teleport: (x: number, z: number, floor: number, yawValue = 0) => {
        setMode("walk");
        player.position.set(x, 0, z);
        setLevel(floor);
        yaw = yawValue;
        pitch = -0.25;
        updatePlace();
      },
      view: (position: Vec3, target: Vec3) => {
        setMode("orbit");
        fly = null;
        camera.position.set(...position);
        controls.target.set(...target);
        controls.update();
      },
      collected: () => collected,
      won: () => won,
      rerun: selfTest,
    };
    Object.assign(window, { __campus: api });
    if (!result.ok) {
      errors.push(...result.notes);
      if (FLAGS.debug) console.warn("[selfTest]", result.notes);
    }
    bootProgress(1, t("boot.loading"));
    emitAll();
    if (FLAGS.autostart) {
      atTitle = false;
      showTitle(false);
      leaveTitle(FLAGS.autostart);
    } else {
      enterTitle();
    }
    boot.classList.add("hidden");
    requestAnimationFrame(animate);
  } catch (error) {
    showError(error instanceof Error ? `${error.message} ${t("boot.error")}` : t("boot.error"));
  }
}

void main();
