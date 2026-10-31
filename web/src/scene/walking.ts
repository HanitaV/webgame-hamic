import * as THREE from "three";
import { CampusCrowd } from "./crowd";
import type { MapData, WalkCharacter } from "../core/data";
import { t } from "../core/i18n";

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
const projected = new THREE.Vector3();
const lampPosts = new Map<string, { bulb: THREE.Mesh; halo: THREE.Mesh }>();

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

/** Circular HAMIC chest emblem + "HAMIC" wordmark (from docs/assets/hamic_polo_1.jpg). */
function drawHamicChestLogo(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = "#f7f9fd";
  g.fill();

  const bits = "010100100001101001011010010110100101";
  g.save();
  g.translate(cx, cy);
  g.fillStyle = "#de5928";
  g.font = `700 ${Math.max(6, Math.round(r * 0.15))}px "Be Vietnam Pro", monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 0; i < bits.length; i += 1) {
    const a = (i / bits.length) * Math.PI * 2 - Math.PI / 2;
    g.save();
    g.rotate(a + Math.PI / 2);
    g.fillText(bits[i], 0, -r * 0.89);
    g.restore();
  }
  g.restore();

  g.beginPath();
  g.arc(cx, cy, r * 0.77, 0, Math.PI * 2);
  g.fillStyle = "#f9fbff";
  g.fill();
  g.lineWidth = r * 0.085;
  g.strokeStyle = "#2960a5";
  g.stroke();

  g.strokeStyle = "#2960a5";
  g.lineCap = "round";
  g.lineWidth = r * 0.145;
  g.beginPath();
  g.moveTo(cx, cy - r * 0.52);
  g.lineTo(cx, cy - r * 0.02);
  g.stroke();

  g.lineWidth = r * 0.115;
  g.beginPath();
  g.arc(cx, cy - r * 0.05, r * 0.42, -Math.PI * 0.82, -Math.PI * 0.60);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy - r * 0.05, r * 0.42, -Math.PI * 0.40, -Math.PI * 0.18);
  g.stroke();

  g.lineWidth = r * 0.11;
  g.beginPath();
  g.arc(cx, cy + r * 0.02, r * 0.43, Math.PI * 0.22, Math.PI * 0.78);
  g.stroke();

  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#e04839";
  g.font = `800 ${Math.round(r * 0.36)}px "Be Vietnam Pro", sans-serif`;
  g.fillText("A", cx - r * 0.39, cy + r * 0.14);
  g.font = `800 ${Math.round(r * 0.21)}px "Be Vietnam Pro", sans-serif`;
  g.fillText("+", cx - r * 0.20, cy + r * 0.02);

  g.fillStyle = "#e79824";
  g.font = `800 ${Math.round(r * 0.39)}px "Be Vietnam Pro", sans-serif`;
  g.fillText("$", cx + r * 0.38, cy + r * 0.14);

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
  const tex = plain ? {base:color,torso:null,collar:null,leftSleeve:null,rightSleeve:null} : getKitTextures(kit, color);

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

export function initWalking(scene: THREE.Scene, map: MapData, convert: typeof point, label: (text: string) => THREE.Sprite) {
  data = map; point = convert; group = new THREE.Group(); group.visible = false; scene.add(group);
  for (const n of map.walk.nodes) nodes.set(n.id, point(n.x, n.z));
  const pathMat = new THREE.LineBasicMaterial({ color: "#ffd25e", transparent: true, opacity: .35 });
  for (const [a,b] of map.walk.edges) {
    const geo = new THREE.BufferGeometry().setFromPoints([nodes.get(a)!.clone().setY(.08), nodes.get(b)!.clone().setY(.08)]);
    group.add(new THREE.Line(geo, pathMat));
  }
  const scale = map.walk.avatar.height * map.scale / map.walk.avatar.modelHeight;
  player = student("#ffd25e", "player"); player.scale.setScalar(scale); group.add(player);
  legs.push(player.userData.legs); arms.push(player.userData.arms);
  playerRing = new THREE.Mesh(new THREE.RingGeometry(.10, .125, 24), new THREE.MeshBasicMaterial({ color: "#ffd25e", side: THREE.DoubleSide }));
  playerRing.rotation.x = -Math.PI/2; group.add(playerRing);
  for (const npc of map.walk.characters) {
    const g = student(npc.color, npc.role, npc.plain);
    g.scale.setScalar(scale);
    g.position.copy(nodes.get(npc.node)!).add(new THREE.Vector3((npc.offset?.[0] ?? 2.5)*map.scale,0,(npc.offset?.[1] ?? 0)*map.scale));
    const tag = label(t(npc.name)); tag.position.copy(g.position).y = map.walk.avatar.height * map.scale + .10; tag.scale.multiplyScalar(.18); group.add(tag); nameTags.push(tag);
    group.add(g); actors.push(g);
  }
  crowd = new CampusCrowd(scene,map,point);
  marker = new THREE.Mesh(new THREE.TorusGeometry(.32, .018, 5, 32), new THREE.MeshBasicMaterial({ color: "#ffd25e" }));
  marker.rotation.x = -Math.PI/2; group.add(marker);
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
  enabled = on; group.visible = on; axis.set(0,0); route = []; paused = false;
  if (on) { if (!pos) pos = nodes.get(data.walk.spawn)!.clone(); player.position.copy(pos); }
}
export function setWalkingLow(low:boolean) { crowd?.setLow(low); }
export function resetWalkPosition() {
  pos = nodes.get(data.walk.spawn)!.clone();
  player.position.copy(pos); route = []; axis.set(0,0);
}
/** Đặt người chơi ngay tại một node (Hack mode và kiểm thử tự động). */
export function teleportTo(id: string) {
  const n = nodes.get(id); if (!n) return;
  pos = n.clone(); player.position.copy(pos); route = []; axis.set(0, 0);
}
export function pauseWalk(on: boolean) { paused = on; axis.set(0,0); }
export function walkAxis(x: number, z: number) { axis.set(x,z); if (x || z) route = []; }
export function walkTarget(id: string) { marker.position.copy(nodes.get(id)!).y = .12; }
export function nearNode(id: string) { return !!pos && pos.distanceTo(nodes.get(id)!) < data.walk.avatar.talkDistance * data.scale; }
export function nearCharacter(id: string) {
  const index = data.walk.characters.findIndex((c) => c.id === id);
  return !!pos && index >= 0 && pos.distanceTo(actors[index].position) <= data.walk.avatar.talkDistance * data.scale;
}
export function nearbyCharacter(preferred?: string): WalkCharacter | null {
  if (!enabled || !pos) return null;
  if (preferred && nearCharacter(preferred)) return data.walk.characters.find((c) => c.id === preferred)!;
  return data.walk.characters.filter((c) => nearCharacter(c.id)).sort((a,b) => {
    const pa=actors[data.walk.characters.indexOf(a)].position, pb=actors[data.walk.characters.indexOf(b)].position;
    return pos!.distanceToSquared(pa)-pos!.distanceToSquared(pb);
  })[0] ?? null;
}
export function characterAtScreen(camera: THREE.Camera, x: number, y: number, width: number, height: number) {
  let best: string | null = null, distance = 26;
  for (const npc of characterScreenPositions(camera,width,height)) {
    if (!npc.near || !npc.visible) continue;
    const d=Math.hypot(npc.x-x,npc.y-y);
    if (d < distance) { distance=d; best=npc.id; }
  }
  return best;
}
export function characterScreenPositions(camera: THREE.Camera, width: number, height: number) {
  return actors.map((actor,i) => {
    projected.copy(actor.position).y += data.walk.avatar.height * data.scale * .6;
    projected.project(camera);
    return { id: data.walk.characters[i].id, x:(projected.x+1)*width/2, y:(1-projected.y)*height/2, visible: projected.z >= -1 && projected.z <= 1, near: nearCharacter(data.walk.characters[i].id) };
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
    mat.transparent=on; mat.depthTest=!on; mat.depthWrite=!on; mat.needsUpdate=true;
  });
  playerRing.renderOrder=on ? 40 : 0;
  const ringMat=playerRing.material as THREE.MeshBasicMaterial;
  ringMat.transparent=on; ringMat.depthTest=!on; ringMat.depthWrite=!on;
}
export function walkingMetrics() { return { characterHeight: data.walk.avatar.height * data.scale, sceneScale: data.scale, modelHeight: new THREE.Box3().setFromObject(player).getSize(new THREE.Vector3()).y, enabled, paused, route: route.length, crowd:crowd.count, questActors:actors.length }; }

/** Walk the shortest route through the authored campus paths, including the canteen crossing. */
export function walkTo(id: string) {
  if (!pos) return;
  const start = [...nodes].sort((a,b) => a[1].distanceToSquared(pos!) - b[1].distanceToSquared(pos!))[0][0];
  const dist = new Map<string, number>([[start, 0]]), prev = new Map<string,string>();
  const open = new Set(nodes.keys());
  while (open.size) {
    const a = [...open].sort((a,b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity))[0]; open.delete(a);
    if (a === id) break;
    for (const edge of data.walk.edges) {
      const b = edge[0] === a ? edge[1] : edge[1] === a ? edge[0] : null;
      if (!b) continue;
      const d = (dist.get(a) ?? Infinity) + nodes.get(a)!.distanceTo(nodes.get(b)!);
      if (d < (dist.get(b) ?? Infinity)) { dist.set(b,d); prev.set(b,a); }
    }
  }
  const ids = [id];
  while (ids[0] !== start) { const p = prev.get(ids[0]); if (!p) return; ids.unshift(p); }
  route = ids.map((n) => nodes.get(n)!.clone());
}

function allowed(p: THREE.Vector3) {
  return data.walk.edges.some(([a,b]) => {
    const line = new THREE.Line3(nodes.get(a)!, nodes.get(b)!);
    return line.closestPointToPoint(p, true, new THREE.Vector3()).distanceTo(p) <= data.walk.radius * data.scale;
  });
}
export function updateWalking(dt: number, time: number, reduceMotion: boolean): THREE.Vector3 | null {
  if (!enabled || !pos) return null;
  crowd.update(dt,reduceMotion);
  const before = pos.clone();
  const speed = data.walk.avatar.speed * data.scale;
  if (!paused) {
    if (axis.lengthSq()) {
      const step = axis.clone().normalize().multiplyScalar(dt * speed * Math.min(1, axis.length()));
      const next = pos.clone().add(new THREE.Vector3(step.x,0,step.y));
      if (allowed(next)) pos.copy(next);
    } else if (route.length) {
      const d = pos.distanceTo(route[0]);
      if (d <= dt*speed) { pos.copy(route.shift()!); } else pos.lerp(route[0], dt*speed/d);
    }
  }
  const motion = pos.clone().sub(before);
  player.position.copy(pos);
  playerRing.position.copy(pos).y = .015;
  const moving = !reduceMotion && motion.lengthSq() > .000001;
  if (motion.lengthSq() > .000001) player.rotation.y = Math.atan2(motion.x,motion.z);
  for (const rig of legs) rig.children.forEach((l,i) => { l.rotation.x = moving ? Math.sin(time*12+i*Math.PI)*.55 : 0; });
  for (const rig of arms) rig.children.forEach((a,i) => { a.rotation.x = moving ? Math.sin(time*12+(1-i)*Math.PI)*.30 : 0; });
  actors.forEach((a,i) => {
    a.rotation.y = Math.atan2(pos!.x-a.position.x, pos!.z-a.position.z);
    nameTags[i].visible = pos!.distanceTo(a.position) < 3;
  });
  return pos;
}
