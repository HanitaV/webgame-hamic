/**
 * HAMIC Trailer V3 — Cartoon Voxel Building Explosion & Shockwave System
 * ======================================================================
 * Adapted from `webgame-hamic-animation/animation/src/effects/{explosion,voxels}.ts`
 * and scaled to `world.ts` (`map.scale = 0.1`, where 1 world unit = 10 layout units).
 *
 * Every effect is a closed-form pure function of local blast age `age` (seconds relative
 * to detonation `t0`), so forward playback, freeze-frame (`43.0-43.7s`), and reverse
 * time-rewind (`5.65-6.30s` & `43.70-45.45s`) are 100% deterministic and seamless.
 *
 * Complies with GDD 5.4 & AGENTS.md:
 * - Toy-model / low-poly cartoon block explosion (no realistic fire/smoke/casualties)
 * - No strobe flashing > 3Hz
 */

import * as THREE from "three";
import type { BuildingUnitRig } from "./rigs";
import { clamp01, easeOutCubic, lerp } from "./timeline";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildingRng(id: string, salt = 0): () => number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < id.length; i += 1) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  }
  return mulberry32(h);
}

function smooth(x: number): number {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
}

function easeOutBack(x: number, overshoot = 1.70158): number {
  const u = clamp01(x) - 1;
  return 1 + u * u * ((overshoot + 1) * u + overshoot);
}

function makeAdditiveRimMaterial(
  color: THREE.ColorRepresentation,
  power = 2.0,
  side: THREE.Side = THREE.DoubleSide
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1.0 },
      uPower: { value: power },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPower;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float a = (0.26 + pow(f, uPower) * 1.55) * uOpacity;
        gl_FragColor = vec4(uColor * (0.65 + f), clamp(a, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side,
    fog: false,
  });
}

/**
 * Expanding energy dome with Fresnel rim + bright core.
 */
export class EnergySphere {
  readonly group = new THREE.Group();
  private shell: THREE.Mesh;
  private core: THREE.Mesh;

  constructor(
    center: THREE.Vector3,
    private radius: number,
    private life: number,
    color = "#b04dff",
    coreColor = "#ffe9ff",
    private delay = 0
  ) {
    this.shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 3),
      makeAdditiveRimMaterial(color, 2.0, THREE.DoubleSide)
    );
    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 2),
      makeAdditiveRimMaterial(coreColor, 0.85, THREE.FrontSide)
    );
    this.group.add(this.shell, this.core);
    this.group.position.copy(center);
    this.group.name = "V3_EnergySphere";
    this.update(-1);
  }

  update(age: number): void {
    const localAge = age - this.delay;
    const u = localAge / this.life;
    this.group.visible = u >= 0 && u <= 1;
    if (!this.group.visible) return;

    const r = this.radius * easeOutCubic(Math.min(1, u * 1.6));
    this.shell.scale.setScalar(Math.max(r, 0.02));
    this.core.scale.setScalar(Math.max(r * 0.56 * (1 - smooth(u * 1.35)), 0.02));
    (this.shell.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
      1 - smooth((u - 0.32) / 0.68);
    (this.core.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
      1 - smooth(u / 0.62);
    this.group.rotation.y = u * 2.2;
  }
}

/**
 * Expanding ground shockwave ring + translucent banded cylindrical wall.
 */
export class ExpandingShockwave {
  readonly group = new THREE.Group();
  private ring: THREE.Mesh;
  private wall: THREE.Mesh;
  private wallMat: THREE.ShaderMaterial;

  constructor(
    readonly center: THREE.Vector3,
    private maxRadius: number,
    private life: number,
    color = "#c070ff",
    private height = 2.4
  ) {
    const ringGeo = new THREE.RingGeometry(0.91, 1.0, 96, 1);
    ringGeo.rotateX(-Math.PI / 2);
    this.ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
      })
    );
    this.ring.position.y = 0.06;

    this.wallMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 1.0 },
      },
      vertexShader: /* glsl */ `
        varying float vY;
        void main() {
          vY = uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vY;
        void main() {
          float a = pow(1.0 - vY, 1.35) * uOpacity;
          float band = step(0.5, fract(vY * 5.0));
          vec3 c = mix(uColor, vec3(1.0), 0.35 * band * (1.0 - vY));
          gl_FragColor = vec4(c, a * 0.76);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
    });

    this.wall = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 96, 1, true),
      this.wallMat
    );
    this.group.add(this.ring, this.wall);
    this.group.position.copy(center);
    this.group.name = "V3_ExpandingShockwave";
    this.update(-1);
  }

  radiusAt(age: number): number {
    if (age <= 0) return 0.1;
    const u = clamp01(age / this.life);
    return lerp(0.25, this.maxRadius, easeOutCubic(u));
  }

  update(age: number): void {
    this.group.visible = age >= 0 && age <= this.life;
    if (!this.group.visible) return;

    const u = clamp01(age / this.life);
    const r = Math.max(this.radiusAt(age), 0.05);
    const fade = 1 - smooth((u - 0.52) / 0.48);

    this.ring.scale.set(r, 1, r);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.92 * fade;

    const h = this.height * (0.62 + 0.38 * Math.pow(Math.sin(age * 8.5), 2));
    this.wall.scale.set(r, h, r);
    this.wall.position.y = h * 0.5;
    this.wallMat.uniforms.uOpacity.value = fade;
  }
}

interface PuffSpec {
  dir: THREE.Vector3;
  dist: number;
  size: number;
  delay: number;
  life: number;
  rise: number;
  stem: boolean;
}

const DEFAULT_FIRE_PALETTE = [
  "#ffffff",
  "#fff3a0",
  "#ffc23d",
  "#ff7a1a",
  "#d23cff",
  "#7b3cff",
].map((c) => new THREE.Color(c));
const SMOKE_COLOR = new THREE.Color("#8d8296");

/**
 * Low-poly cartoon puff balls that pop out into a mushroom cloud and stem.
 */
export class CartoonExplosion {
  readonly mesh: THREE.InstancedMesh;
  private puffs: PuffSpec[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private c = new THREE.Color();

  constructor(
    private center: THREE.Vector3,
    private scale: number,
    count = 95,
    seed = 3,
    private palette = DEFAULT_FIRE_PALETTE,
    private startDelay = 0
  ) {
    const rng = mulberry32(seed);
    for (let i = 0; i < count; i += 1) {
      const stem = i < count * 0.24;
      const th = rng() * Math.PI * 2;
      const ph = stem ? 0 : Math.acos(1 - rng() * 1.08);
      const dir = new THREE.Vector3(
        Math.sin(ph) * Math.cos(th),
        Math.cos(ph),
        Math.sin(ph) * Math.sin(th)
      );
      this.puffs.push({
        dir,
        dist: stem ? 0.08 * rng() : 0.32 + rng() * 0.78,
        size: stem ? 0.21 : 0.16 + rng() * 0.25,
        delay: rng() * 0.22,
        life: 2.4 + rng() * 2.1,
        rise: stem ? 0.28 + (i / (count * 0.24)) * 0.92 : 0.16 + rng() * 0.38,
        stem,
      });
    }

    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshLambertMaterial({
      color: "#ffffff",
      flatShading: true,
      emissive: "#ffffff",
      emissiveIntensity: 0.0,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance += vColor * 0.65;\n#endif"
      );
    };

    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.frustumCulled = false;
    this.mesh.name = "V3_CartoonExplosion";
    for (let i = 0; i < count; i += 1) {
      this.mesh.setColorAt(i, this.c.set("#ffffff"));
    }
    this.update(-1);
  }

  update(age: number): void {
    const localAge = age - this.startDelay;
    const S = this.scale;
    let anyVisible = false;

    for (let i = 0; i < this.puffs.length; i += 1) {
      const pf = this.puffs[i];
      const tau = localAge - pf.delay;
      if (tau < 0 || tau > pf.life) {
        this.s.setScalar(0);
        this.m.compose(this.center, this.q.identity(), this.s);
        this.mesh.setMatrixAt(i, this.m);
        continue;
      }
      anyVisible = true;
      const u = tau / pf.life;
      const out = easeOutCubic(Math.min(1, tau / 0.68));
      if (pf.stem) {
        this.p.set(
          this.center.x + pf.dir.x * S * pf.dist,
          this.center.y + S * pf.rise * out,
          this.center.z + pf.dir.z * S * pf.dist
        );
      } else {
        this.p.copy(pf.dir).multiplyScalar(S * pf.dist * out).add(this.center);
        this.p.y += S * pf.rise * (0.58 * out + 0.22 * tau);
        this.p.y = Math.max(this.p.y, S * pf.size * 0.35);
      }

      const pop = easeOutBack(tau / 0.28, 2.15);
      const shrink = 1 - smooth((u - 0.56) / 0.44);
      this.s.setScalar(Math.max(0.001, S * pf.size * pop * shrink * (1 + 0.45 * u)));
      this.q.setFromEuler(new THREE.Euler(tau * 0.75 + i, tau * 0.55, 0));
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);

      const pal = this.palette;
      const x = clamp01(u * 1.55) * (pal.length - 1);
      const a = Math.floor(x);
      const b = Math.min(a + 1, pal.length - 1);
      this.c.copy(pal[a]).lerp(pal[b], x - a);
      if (u > 0.52) {
        this.c.lerp(SMOKE_COLOR, smooth((u - 0.52) / 0.38));
      }
      this.mesh.setColorAt(i, this.c);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.visible = anyVisible;
  }
}

/**
 * Low-poly cartoon dust rolling outward along the ground behind a shockwave front.
 */
export class CartoonDust {
  readonly mesh: THREE.InstancedMesh;
  private items: {
    ang: number;
    lag: number;
    size: number;
    life: number;
    birth: number;
    jitter: number;
  }[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private upAxis = new THREE.Vector3(0, 1, 0);

  constructor(
    private wave: ExpandingShockwave,
    private maxAge: number,
    count = 110,
    seed = 5,
    color = "#d6c3a5"
  ) {
    const rng = mulberry32(seed);
    for (let i = 0; i < count; i += 1) {
      this.items.push({
        ang: rng() * Math.PI * 2,
        lag: 0.15 + rng() * 0.9,
        size: 0.14 + rng() * 0.26,
        life: 1.4 + rng() * 1.5,
        birth: 0.08 + rng() * 1.6,
        jitter: rng(),
      });
    }
    this.mesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshLambertMaterial({
        color,
        flatShading: true,
        emissive: color,
        emissiveIntensity: 0.18,
      }),
      count
    );
    this.mesh.frustumCulled = false;
    this.mesh.name = "V3_CartoonDust";
    this.update(-1);
  }

  update(age: number): void {
    const c = this.wave.center;
    const active = age >= 0.05 && age <= this.maxAge + 1.5;
    this.mesh.visible = active;
    if (!active) return;

    for (let i = 0; i < this.items.length; i += 1) {
      const it = this.items[i];
      const elapsed = age - it.birth;
      if (elapsed < 0) {
        this.s.setScalar(0);
      } else {
        const local = elapsed % it.life;
        const bornAt = age - local;
        const r = Math.max(this.wave.radiusAt(bornAt) - it.lag, 0.1);
        const u = local / it.life;
        this.p.set(
          c.x + Math.cos(it.ang) * (r + u * 0.55),
          it.size * 0.38 + u * 0.52,
          c.z + Math.sin(it.ang) * (r + u * 0.55)
        );
        const fadeOut = age > this.maxAge ? 1 - clamp01((age - this.maxAge) / 1.5) : 1;
        this.s.setScalar(Math.max(0.001, it.size * Math.sin(u * Math.PI) * fadeOut));
      }
      this.q.setFromAxisAngle(this.upAxis, it.jitter * 6 + age * 1.2);
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/**
 * Scorched cartoon crater decal on the ground after detonation.
 */
export class Crater {
  readonly mesh: THREE.Mesh;

  constructor(center: THREE.Vector3, radius: number, private delay = 0.06) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, "rgba(24, 14, 34, 0.95)");
    grad.addColorStop(0.55, "rgba(58, 32, 54, 0.78)");
    grad.addColorStop(0.82, "rgba(120, 74, 58, 0.36)");
    grad.addColorStop(1, "rgba(120, 74, 58, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.CircleGeometry(radius, 48);
    geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      })
    );
    this.mesh.position.set(center.x, 0.038, center.z);
    this.mesh.renderOrder = 1;
    this.update(-1);
  }

  update(age: number): void {
    const u = clamp01((age - this.delay) / 0.65);
    this.mesh.visible = u > 0;
    if (this.mesh.visible) {
      this.mesh.scale.setScalar(Math.max(0.01, easeOutCubic(u)));
    }
  }
}

interface VoxelPiece {
  p0: THREE.Vector3;
  v: THREE.Vector3;
  axis: THREE.Vector3;
  spin: number;
  size: number;
  delay: number;
  landT: number;
}

const GRAVITY = 5.4; // Cartoon gravity in world units/s^2 (54 in 10x layout units)

/**
 * VoxelFragmentation: shatters real `BuildingUnitRig` meshes into hundreds of
 * ballistic 3D voxel blocks when the blast front reaches each building.
 * Reversible for time-rewind (`age` decreasing back below `hideAt`).
 */
export class VoxelFragmentation {
  readonly mesh: THREE.InstancedMesh;
  private pieces: VoxelPiece[] = [];
  private ranges: {
    u: BuildingUnitRig;
    from: number;
    to: number;
    hideAt: number;
  }[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();

  constructor(
    units: BuildingUnitRig[],
    private center: THREE.Vector3,
    frontSpeed: number,
    power: number,
    seed: number,
    campus: "hus" | "ussh",
    maxPerBuilding = 420
  ) {
    const pieces: VoxelPiece[] = [];
    const colors: THREE.Color[] = [];

    const wallBase = new THREE.Color(campus === "hus" ? "#e7cb89" : "#f2d6a2");
    const roofBase = new THREE.Color(campus === "hus" ? "#b85343" : "#c2593f");
    const windowLit = new THREE.Color("#ffd25e");
    const windowGlass = new THREE.Color("#7dd3fc");
    const accentGlow = new THREE.Color(campus === "hus" ? "#38bdf8" : "#f472b6");

    for (const u of units) {
      const size = u.worldSize;
      const minX = u.worldBase.x - size.x * 0.5;
      const minY = 0.05;
      const minZ = u.worldBase.z - size.z * 0.5;

      let vs = THREE.MathUtils.clamp(Math.min(size.x, size.z) / 4.2, 0.22, 0.42);
      const countShell = (step: number) => {
        const nx = Math.max(2, Math.ceil(size.x / step));
        const ny = Math.max(2, Math.ceil(size.y / step));
        const nz = Math.max(2, Math.ceil(size.z / step));
        return (
          nx * ny * nz -
          Math.max(0, nx - 2) * Math.max(0, ny - 1) * Math.max(0, nz - 2)
        );
      };
      while (countShell(vs) > maxPerBuilding) {
        vs *= 1.12;
      }

      const nx = Math.max(2, Math.ceil(size.x / vs));
      const ny = Math.max(2, Math.ceil(size.y / vs));
      const nz = Math.max(2, Math.ceil(size.z / vs));
      const sx = size.x / nx;
      const sy = size.y / ny;
      const sz = size.z / nz;

      const br = buildingRng(u.nodeName, seed);
      const dist = Math.hypot(u.worldBase.x - center.x, u.worldBase.z - center.z);
      const hideAt = Math.min(0.26, dist / frontSpeed);
      const from = pieces.length;

      for (let i = 0; i < nx; i += 1) {
        for (let j = 0; j < ny; j += 1) {
          for (let k = 0; k < nz; k += 1) {
            const isShell =
              i === 0 || i === nx - 1 || k === 0 || k === nz - 1 || j === ny - 1;
            if (!isShell) continue;

            const p0 = new THREE.Vector3(
              minX + (i + 0.5) * sx,
              minY + (j + 0.5) * sy,
              minZ + (k + 0.5) * sz
            );
            const away = new THREE.Vector3(p0.x - center.x, 0, p0.z - center.z);
            const d = Math.max(away.length(), 0.15);
            away.divideScalar(d);

            const side = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(
              (br() - 0.5) * 0.95
            );
            const fall = 1 / (1 + d / 24);
            const hs = power * (1.8 + 3.8 * br()) * fall;
            const v = away.add(side).normalize().multiplyScalar(hs);
            v.y = power * (2.5 + 3.4 * br() + (j / ny) * 2.1) * (0.65 + 0.35 * fall);

            const pieceSize = Math.min(sx, sy, sz) * (0.85 + br() * 0.32);
            const h = pieceSize * 0.5;
            const landT =
              (v.y + Math.sqrt(v.y * v.y + 2 * GRAVITY * Math.max(p0.y - h, 0))) /
              GRAVITY;

            pieces.push({
              p0,
              v,
              axis: new THREE.Vector3(
                br() - 0.5,
                br() - 0.5,
                br() - 0.5
              ).normalize(),
              spin: 3.2 + br() * 9.5,
              size: pieceSize,
              delay: br() * 0.10 + (j / ny) * 0.04,
              landT,
            });

            let c = wallBase.clone();
            const rPick = br();
            if (j === ny - 1) {
              c = rPick < 0.16 ? accentGlow.clone() : roofBase.clone();
            } else if (j === 0) {
              c.multiplyScalar(0.76);
            } else if (rPick < 0.18) {
              c = windowLit.clone();
            } else if (rPick < 0.32) {
              c = windowGlass.clone();
            }
            c.multiplyScalar(0.92 + br() * 0.18);
            colors.push(c);
          }
        }
      }
      this.ranges.push({ u, from, to: pieces.length, hideAt });
    }

    this.pieces = pieces;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 0.0,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance += vColor * 0.28;\n#endif"
      );
    };

    this.mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, pieces.length));
    this.mesh.frustumCulled = false;
    this.mesh.name = `V3_VoxelFragmentation_${campus}`;
    colors.forEach((col, idx) => this.mesh.setColorAt(idx, col));
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.update(-1, 0);
  }

  update(age: number, extraWobble = 0): void {
    const mesh = this.mesh;
    let anyBroken = false;

    for (const r of this.ranges) {
      const broken = age >= r.hideAt;
      r.u.pivot.visible = !broken;

      // Jelly wobble on intact building meshes right before break-up or under incoming shockwave
      if (!broken) {
        const preBlast = age >= -0.75 ? clamp01((age + 0.75) / Math.max(0.75 + r.hideAt, 0.05)) : 0;
        const amp = 0.04 * preBlast + 0.22 * preBlast * preBlast + extraWobble;
        if (amp > 0.001) {
          const w = Math.sin(age * 28 + r.u.worldBase.x * 0.6);
          r.u.pivot.scale.set(
            1 + amp * 0.65 * w,
            1 - amp * w + 0.16 * preBlast * preBlast,
            1 + amp * 0.65 * w
          );
          r.u.pivot.position.set(
            r.u.localBasePos.x + Math.sin(age * 46 + r.u.orderIndex) * amp * 1.8,
            r.u.localBasePos.y,
            r.u.localBasePos.z + Math.cos(age * 41 + r.u.orderIndex) * amp * 1.8
          );
          r.u.pivot.rotation.set(
            r.u.localBaseRot.x,
            r.u.localBaseRot.y,
            r.u.localBaseRot.z + Math.sin(age * 19 + r.u.orderIndex) * amp * 0.35
          );
        } else {
          r.u.pivot.scale.set(1, 1, 1);
          r.u.pivot.position.copy(r.u.localBasePos);
          r.u.pivot.rotation.copy(r.u.localBaseRot);
        }
        r.u.pivot.updateMatrix();

        // Ground shadow & foundation rim while intact
        r.u.groundShadow.visible = true;
        r.u.groundShadow.scale.setScalar(1.0);
        (r.u.groundShadow.material as THREE.MeshBasicMaterial).opacity = 0.88;
        const rimMat = r.u.groundRim.material as THREE.MeshBasicMaterial;
        rimMat.opacity = amp > 0.005 ? Math.min(0.95, 0.35 + amp * 3.2) : 0.0;
        r.u.groundRim.scale.setScalar(1.0 + amp * 1.2);
        r.u.thrusterRing.visible = false;

        for (let i = r.from; i < r.to; i += 1) {
          this.s.set(0, 0, 0);
          this.m.compose(this.pieces[i].p0, this.q.identity(), this.s);
          mesh.setMatrixAt(i, this.m);
        }
        continue;
      }

      anyBroken = true;
      // Building has shattered into voxel blocks!
      const breakAge = Math.max(0, age - r.hideAt);
      r.u.groundShadow.visible = false;
      const rimMat = r.u.groundRim.material as THREE.MeshBasicMaterial;
      rimMat.opacity = Math.max(0, 0.85 * (1 - clamp01(breakAge / 1.4)));
      r.u.groundRim.scale.setScalar(1.0 + Math.min(2.2, breakAge * 0.9));

      for (let i = r.from; i < r.to; i += 1) {
        const pc = this.pieces[i];
        const tau = Math.max(0, age - r.hideAt - pc.delay);
        const tt = Math.min(tau, pc.landT);

        this.p.set(
          pc.p0.x + pc.v.x * tt,
          pc.p0.y + pc.v.y * tt - 0.5 * GRAVITY * tt * tt,
          pc.p0.z + pc.v.z * tt
        );
        if (tau >= pc.landT) {
          const skid = Math.min(tau - pc.landT, 0.65);
          const f = skid - (skid * skid) / 1.3;
          this.p.x += pc.v.x * 0.25 * f;
          this.p.z += pc.v.z * 0.25 * f;
          this.p.y = pc.size * 0.5;
        }

        this.q.setFromAxisAngle(pc.axis, pc.spin * Math.min(tau, pc.landT + 0.32));
        const pop = tau < 0.18 ? 1 + 0.28 * Math.sin((tau / 0.18) * Math.PI) : 1;
        this.s.setScalar(pc.size * pop);
        this.m.compose(this.p, this.q, this.s);
        mesh.setMatrixAt(i, this.m);
      }
    }

    mesh.visible = anyBroken;
    if (anyBroken) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/**
 * Complete cartoon explosion rig for one campus (HUS or USSH).
 */
export class CampusExplosionCluster {
  readonly group = new THREE.Group();
  readonly voxels: VoxelFragmentation;
  readonly wave: ExpandingShockwave;
  private fx: { update(age: number): void }[] = [];

  constructor(
    units: BuildingUnitRig[],
    readonly center: THREE.Vector3,
    campus: "hus" | "ussh"
  ) {
    this.group.name = `V3_CampusExplosionCluster_${campus}`;
    const isHus = campus === "hus";

    this.voxels = new VoxelFragmentation(
      units,
      center.clone().setY(0.9),
      isHus ? 16.0 : 24.0,
      isHus ? 1.15 : 1.40,
      isHus ? 101 : 202,
      campus
    );
    this.group.add(this.voxels.mesh);

    const sphereMain = new EnergySphere(
      center.clone().setY(1.0),
      isHus ? 5.8 : 7.4,
      2.2,
      isHus ? "#b04dff" : "#ff8a1e",
      isHus ? "#fff0ff" : "#fff6e0",
      0
    );
    const sphereSub = new EnergySphere(
      center.clone().setY(1.1),
      isHus ? 4.4 : 5.8,
      1.9,
      isHus ? "#38bdf8" : "#b04dff",
      "#ffffff",
      0.06
    );

    const exMain = new CartoonExplosion(
      center.clone().setY(0.35),
      isHus ? 4.2 : 5.4,
      isHus ? 85 : 110,
      isHus ? 31 : 47,
      isHus
        ? DEFAULT_FIRE_PALETTE
        : ["#ffffff", "#fff3a0", "#ffb03d", "#ff6a1a", "#d23cff", "#ff8a1e"].map(
            (x) => new THREE.Color(x)
          ),
      0.02
    );

    // Add compact secondary cartoon fireballs on key buildings
    const subExplosions: CartoonExplosion[] = [];
    units.slice(0, 4).forEach((u, idx) => {
      const subEx = new CartoonExplosion(
        u.worldBase.clone().setY(0.45),
        isHus ? 1.9 : 2.2,
        32,
        (isHus ? 300 : 400) + idx,
        DEFAULT_FIRE_PALETTE,
        0.04 + idx * 0.06
      );
      subExplosions.push(subEx);
      this.group.add(subEx.mesh);
    });

    this.wave = new ExpandingShockwave(
      center.clone().setY(0),
      isHus ? 18.0 : 22.0,
      3.0,
      isHus ? "#9b30ff" : "#ff7a1a",
      isHus ? 1.6 : 2.0
    );

    const dust = new CartoonDust(
      this.wave,
      3.0,
      100,
      isHus ? 7 : 9,
      isHus ? "#cdbb9c" : "#d8c2a0"
    );

    const crater = new Crater(center.clone().setY(0), isHus ? 7.8 : 9.6, 0.06);

    this.group.add(
      sphereMain.group,
      sphereSub.group,
      exMain.mesh,
      this.wave.group,
      dust.mesh,
      crater.mesh
    );

    this.fx = [
      sphereMain,
      sphereSub,
      exMain,
      ...subExplosions,
      this.wave,
      dust,
      crater,
    ];
  }

  update(age: number, extraWobble = 0): void {
    this.voxels.update(age, extraWobble);
    for (const f of this.fx) {
      f.update(age);
    }
  }
}
