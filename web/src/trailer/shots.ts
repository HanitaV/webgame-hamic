import * as THREE from "three";
import type { MapData } from "../core/data";
import { buildDroneModel, createDrone, type Drone } from "../scene/drone";
import { endingImpact } from "../scene/ending-impact";
import { fireworkBouquets } from "../scene/fireworks";
import { glowTexture } from "../scene/textures";
import { setLit, setStoryTime } from "../scene/world";

export type TrailerRenderMode = "normal" | "festive" | "launch";

interface BuildingBlock {
  id: string;
  campusId: "HUS" | "USSH";
  group: THREE.Group;
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  boosterRing: THREE.Mesh;
}

export interface TrailerSceneController {
  update(t: number, mode?: TrailerRenderMode): void;
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

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(a: number, b: number, x: number): number {
  const u = clamp01((x - a) / Math.max(1e-6, b - a));
  return u * u * (3 - 2 * u);
}

function modelGroup(obj: THREE.Object3D): string {
  let p: THREE.Object3D | null = obj;
  while (p) {
    if (typeof p.userData.building_id === "string") return p.userData.building_id;
    const group = p.userData.group;
    if (typeof group === "string") {
      return p.userData.campus && !group.startsWith(`${p.userData.campus}_`)
        ? `${p.userData.campus}_${group}`
        : group;
    }
    if (p.name.startsWith("tree")) return "trees";
    p = p.parent;
  }
  return "";
}

export function createTrailerSceneController(
  scene: THREE.Scene,
  map: MapData,
  circuitColors: string[],
): TrailerSceneController {
  const glow = glowTexture();
  const palette = circuitColors.map((c) => new THREE.Color(c));
  const gold = new THREE.Color("#ffd25e");
  const cyan = new THREE.Color("#5ad8ff");
  const danger = new THREE.Color("#ff6b81");
  const ok = new THREE.Color("#5eeaa0");
  const white = new THREE.Color("#eef1fb");

  const P = (x: number, z: number, y = 0) =>
    new THREE.Vector3((x - map.origin[0]) * map.scale, y * map.scale, (z - map.origin[1]) * map.scale);

  const makeGlowSprite = (color: THREE.Color | string, scale: number, opacity: number) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    s.scale.setScalar(scale);
    return s;
  };

  const root = new THREE.Group();
  root.name = "trailer_fx_root";
  scene.add(root);

  // Locate campus group & wrap each building group (G_HUS_* and G_USSH_*) in a pivot group for deterministic HUS -> USSH liftoff
  const buildingBlocks: BuildingBlock[] = [];
  let campusGroup: THREE.Group | null = null;
  scene.traverse((obj) => {
    if (!campusGroup && obj.parent === scene && obj instanceof THREE.Group && obj.children.length > 10) {
      let hasBuilding = false;
      for (const c of obj.children) {
        if (c.name.startsWith("G_HUS_") || c.name.startsWith("G_USSH_")) {
          hasBuilding = true;
          break;
        }
      }
      if (hasBuilding) campusGroup = obj;
    }
  });

  // Also collect 3D label sprites and roof beacons in scene so we can hide clutter and lift campus badges with buildings
  const buildingLabelSprites: THREE.Sprite[] = [];
  const campusBadgeSprites: { sprite: THREE.Sprite; baseY: number; campusId: "HUS" | "USSH" }[] = [];
  const roofBeaconObjects: { obj: THREE.Object3D; baseY: number; campusId: "HUS" | "USSH" }[] = [];
  for (const child of scene.children) {
    if (child instanceof THREE.Sprite && (child.material as THREE.SpriteMaterial).depthTest === false) {
      // The first two label sprites added in world.ts are the campus badges USSH (x < 0) and HUS (x > 0)
      if (Math.abs(child.position.y - 4.0) < 0.25 && child.scale.y >= 1.4) {
        campusBadgeSprites.push({
          sprite: child,
          baseY: child.position.y,
          campusId: child.position.x >= 0 ? "HUS" : "USSH",
        });
      } else {
        buildingLabelSprites.push(child);
      }
    } else if (
      (child instanceof THREE.Mesh || child instanceof THREE.Sprite) &&
      child.position.y > 1.2 &&
      child.position.y < 15 &&
      Math.abs(child.position.x) > 3.0
    ) {
      // Roof beacon crystal, halo, or vertical beam
      roofBeaconObjects.push({
        obj: child,
        baseY: child.position.y,
        campusId: child.position.x >= 0 ? "HUS" : "USSH",
      });
    }
  }

  const rndB = mulberry(20261101);
  if (campusGroup) {
    const cg = campusGroup as THREE.Group;
    cg.updateMatrixWorld(true);
    const targetGroups: THREE.Object3D[] = [];
    for (const child of [...cg.children]) {
      if (
        (child.name.startsWith("G_HUS_") || child.name.startsWith("G_USSH_")) &&
        !child.name.endsWith("_GATE")
      ) {
        targetGroups.push(child);
      }
    }

    for (const gNode of targetGroups) {
      const bid = gNode.name.replace(/^G_/, "");
      const box = new THREE.Box3().setFromObject(gNode);
      const worldPivot = box.getCenter(new THREE.Vector3());
      const group = new THREE.Group();
      group.name = `pivot_${bid}`;
      group.position.copy(cg.worldToLocal(worldPivot.clone()));
      cg.add(group);
      group.updateMatrixWorld(true);

      // Ensure child meshes update properly when parent group moves
      gNode.traverse((m) => {
        if ((m as THREE.Mesh).isMesh) {
          m.matrixAutoUpdate = true;
        }
      });
      group.attach(gNode);

      const campusId: "HUS" | "USSH" = bid.startsWith("HUS_") ? "HUS" : "USSH";
      const outDir = worldPivot.clone().setY(0).normalize();
      const signX = rndB() > 0.5 ? 1 : -1;
      const signZ = rndB() > 0.5 ? 1 : -1;
      const vel = new THREE.Vector3(
        outDir.x * (0.6 + rndB() * 0.7),
        3.6 + rndB() * 1.4,
        outDir.z * (0.6 + rndB() * 0.7),
      );
      const spin = new THREE.Vector3(
        signX * (0.14 + rndB() * 0.12),
        (rndB() - 0.5) * 0.28,
        signZ * (0.12 + rndB() * 0.12),
      );

      // Add a cartoon booster ring under the building (visible when lifting off)
      const boosterRing = new THREE.Mesh(
        new THREE.RingGeometry(10, 16, 32),
        new THREE.MeshBasicMaterial({
          color: campusId === "HUS" ? "#ffd25e" : "#5ad8ff",
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      boosterRing.rotation.x = -Math.PI / 2;
      boosterRing.position.set(0, -6, 0);
      group.add(boosterRing);

      buildingBlocks.push({
        id: bid,
        campusId,
        group,
        basePos: group.position.clone(),
        baseRot: group.rotation.clone(),
        vel,
        spin,
        boosterRing,
      });
    }
  }

  // Locate walking group and player avatar for Scene 02
  const walkingGroup = scene.getObjectByName("walking") as THREE.Group | undefined;
  let playerAvatar: THREE.Group | null = null;
  if (walkingGroup) {
    for (const child of walkingGroup.children) {
      if (child instanceof THREE.Group && Array.isArray(child.userData.legs)) {
        playerAvatar = child;
        break;
      }
    }
  }

  // =========================================================================
  // SCENE 02 RIG: HUS <-> USSH Glowing Connector Path & Runner
  // =========================================================================
  const s02Group = new THREE.Group();
  s02Group.name = "s02_mission_path";
  root.add(s02Group);

  const runCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(11.5, 0.15, -3.5),
    new THREE.Vector3(6.8, 0.15, -3.8),
    new THREE.Vector3(1.5, 0.15, -4.2),
    new THREE.Vector3(-4.2, 0.15, -4.6),
    new THREE.Vector3(-10.5, 0.15, -5.0),
    new THREE.Vector3(-14.0, 0.15, -5.2),
  ]);
  const pathTube = new THREE.Mesh(
    new THREE.TubeGeometry(runCurve, 120, 0.14, 8, false),
    new THREE.MeshBasicMaterial({
      color: "#ffd25e",
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const pathSubTube = new THREE.Mesh(
    new THREE.TubeGeometry(runCurve, 120, 0.06, 8, false),
    new THREE.MeshBasicMaterial({
      color: "#5ad8ff",
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  pathSubTube.position.y = 0.08;
  s02Group.add(pathTube, pathSubTube);

  const pathPulses = Array.from({ length: 14 }, (_, i) => {
    const s = makeGlowSprite(i % 2 === 0 ? "#ffd25e" : "#5ad8ff", 1.1, 0.9);
    s02Group.add(s);
    return s;
  });

  // =========================================================================
  // SCENE 03 RIGS: 4 Incidents
  // =========================================================================
  // 3A: Row of 7 LED pillars on HUS lawn (Lamp #6 out of rhythm)
  const s03AGroup = new THREE.Group();
  s03AGroup.name = "s03a_leds";
  root.add(s03AGroup);
  const ledPillars = Array.from({ length: 7 }, (_, i) => {
    const g = new THREE.Group();
    const x = 5.6 + i * 1.45;
    const z = -3.8 + (i === 5 ? 0.35 : 0);
    g.position.set(x, 0, z);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 1.35, 12),
      new THREE.MeshStandardMaterial({ color: "#1d2540", roughness: 0.4 }),
    );
    pole.position.y = 0.675;
    const bulb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 1),
      new THREE.MeshStandardMaterial({
        color: i === 5 ? "#ff6b81" : "#ffd25e",
        emissive: i === 5 ? "#ff6b81" : "#ffd25e",
        emissiveIntensity: 2.2,
      }),
    );
    bulb.position.y = 1.55;
    const halo = makeGlowSprite(i === 5 ? "#ff6b81" : "#ffd25e", 2.2, 0.85);
    halo.position.y = 1.55;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.52, 32),
      new THREE.MeshBasicMaterial({
        color: i === 5 ? "#ff6b81" : "#ffd25e",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    g.add(pole, bulb, halo, ring);
    s03AGroup.add(g);
    return { g, bulb, halo, ring };
  });

  // 3B: Two floating 3D file slabs with red diff clash at HUS Gate
  const s03BGroup = new THREE.Group();
  s03BGroup.name = "s03b_files";
  root.add(s03BGroup);
  const fileSlabs = [-1, 1].map((side) => {
    const slab = new THREE.Group();
    slab.position.set(10.4 + side * 1.55, 2.5, 4.6);
    slab.rotation.y = -side * 0.22;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 2.3, 0.08),
      new THREE.MeshStandardMaterial({
        color: "#0e152b",
        emissive: side < 0 ? "#5ad8ff" : "#ff6b81",
        emissiveIntensity: 0.35,
        roughness: 0.2,
      }),
    );
    slab.add(body);
    for (let row = 0; row < 5; row++) {
      const isDiff = row === 2 || row === 3;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.14, 0.12),
        new THREE.MeshBasicMaterial({
          color: isDiff ? (side < 0 ? "#5eeaa0" : "#ff6b81") : "#8a94b8",
        }),
      );
      bar.position.set(0, 0.65 - row * 0.34, 0.02);
      slab.add(bar);
    }
    s03BGroup.add(slab);
    return slab;
  });
  const diffClashRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.045, 12, 48),
    new THREE.MeshBasicMaterial({ color: "#ff6b81", transparent: true, opacity: 0.9 }),
  );
  diffClashRing.position.set(10.4, 2.4, 4.8);
  s03BGroup.add(diffClashRing);

  // 3C & 04-1: Mirror + Laser Beam + Target Bullseye near HUS_T1
  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = "s03c_mirror_rig";
  root.add(mirrorGroup);
  const mirrorPos = new THREE.Vector3(4.2, 7.6, -15.2);
  const sourcePos = new THREE.Vector3(8.5, 6.2, -9.2);
  const targetBullseyePos = new THREE.Vector3(10.2, 7.8, -15.0);
  const wrongTargetPos = new THREE.Vector3(-0.6, 11.2, -13.5);

  const mirrorFrame = new THREE.Group();
  mirrorFrame.position.copy(mirrorPos);
  const mirrorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.8, 0.12),
    new THREE.MeshStandardMaterial({
      color: "#5ad8ff",
      emissive: "#5ad8ff",
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.1,
    }),
  );
  const mirrorRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.07, 12, 48),
    new THREE.MeshBasicMaterial({ color: "#ffd25e" }),
  );
  mirrorFrame.add(mirrorGlass, mirrorRim);
  mirrorGroup.add(mirrorFrame);

  const targetBullseye = new THREE.Group();
  targetBullseye.position.copy(targetBullseyePos);
  targetBullseye.lookAt(mirrorPos);
  [0.95, 0.6, 0.25].forEach((r, idx) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r * 0.78, r, 32),
      new THREE.MeshBasicMaterial({
        color: idx === 1 ? "#ffd25e" : "#5eeaa0",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    targetBullseye.add(ring);
  });
  mirrorGroup.add(targetBullseye);

  const makeBeamMesh = (from: THREE.Vector3, to: THREE.Vector3, colorHex: string, radius = 0.08) => {
    const len = from.distanceTo(to);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, len, 10),
      new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    mesh.position.copy(from).lerp(to, 0.5);
    mesh.lookAt(to);
    mesh.rotateX(Math.PI / 2);
    return mesh;
  };
  const incomingBeam = makeBeamMesh(sourcePos, mirrorPos, "#ffd25e", 0.07);
  const wrongReflectedBeam = makeBeamMesh(mirrorPos, wrongTargetPos, "#ff6b81", 0.09);
  const fixedReflectedBeam = makeBeamMesh(mirrorPos, targetBullseyePos, "#5eeaa0", 0.09);
  const wrongArrowCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.7, 16),
    new THREE.MeshBasicMaterial({ color: "#ff6b81" }),
  );
  wrongArrowCone.position.copy(wrongTargetPos);
  wrongArrowCone.lookAt(wrongTargetPos.clone().add(wrongTargetPos.clone().sub(mirrorPos).normalize()));
  wrongArrowCone.rotateX(Math.PI / 2);
  mirrorGroup.add(incomingBeam, wrongReflectedBeam, fixedReflectedBeam, wrongArrowCone);

  // 3D: Dissolving Note Board & Voxel Particles at USSH Courtyard
  const s03DGroup = new THREE.Group();
  s03DGroup.name = "s03d_missing_notes";
  root.add(s03DGroup);
  const noteCenter = new THREE.Vector3(-12.5, 3.0, -5.0);
  const noteVoxels = Array.from({ length: 64 }, (_, i) => {
    const gx = (i % 8) - 3.5;
    const gy = Math.floor(i / 8) - 3.5;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.22, 0.08),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? "#ff6b81" : i % 2 === 0 ? "#5ad8ff" : "#ffd25e",
        transparent: true,
        opacity: 0.9,
      }),
    );
    s03DGroup.add(mesh);
    return {
      mesh,
      base: new THREE.Vector3(noteCenter.x + gx * 0.3, noteCenter.y + gy * 0.26, noteCenter.z),
      vel: new THREE.Vector3((gx * 0.25) + Math.sin(i) * 0.6, 0.8 + (i % 5) * 0.35, Math.cos(i) * 0.6),
    };
  });

  // =========================================================================
  // SCENE 04 RIGS: Decisions 02..08
  // =========================================================================
  // 04-2: Calculus firework trajectory curve & 70m safety ceiling ring
  const s04CalcGroup = new THREE.Group();
  root.add(s04CalcGroup);
  const ceilingHeight = 14.2;
  const ceilingRing = new THREE.Mesh(
    new THREE.RingGeometry(4.2, 4.55, 64),
    new THREE.MeshBasicMaterial({
      color: "#ffd25e",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    }),
  );
  ceilingRing.rotation.x = -Math.PI / 2;
  ceilingRing.position.set(10.4, ceilingHeight, -4.2);
  const calcPoints = Array.from({ length: 40 }, (_, i) => {
    const u = i / 39;
    const tVal = u * 3.0;
    const y = ceilingHeight * (1 - Math.exp(-1.65 * tVal));
    return new THREE.Vector3(6.5 + u * 7.8, 0.5 + y, -4.2);
  });
  const calcCurve = new THREE.CatmullRomCurve3(calcPoints);
  const calcTube = new THREE.Mesh(
    new THREE.TubeGeometry(calcCurve, 80, 0.11, 8, false),
    new THREE.MeshBasicMaterial({ color: "#5eeaa0", transparent: true, opacity: 0.9 }),
  );
  const calcShell = makeGlowSprite("#ffd25e", 2.4, 1.0);
  s04CalcGroup.add(ceilingRing, calcTube, calcShell);

  // 04-3: Graph shortest path network across campus
  const s04GraphGroup = new THREE.Group();
  root.add(s04GraphGroup);
  const graphNodes: Record<string, THREE.Vector3> = {
    A: new THREE.Vector3(10.4, 4.5, 4.5),     // HUS Gate
    C: new THREE.Vector3(4.2, 5.5, -13.5),    // HUS T1
    B: new THREE.Vector3(10.4, 6.2, -4.2),    // HUS Core
    D: new THREE.Vector3(-4.5, 5.2, -10.5),   // USSH C
    E: new THREE.Vector3(-12.5, 5.8, -5.0),   // USSH Courtyard
  };
  for (const [key, pos] of Object.entries(graphNodes)) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 20, 16),
      new THREE.MeshBasicMaterial({ color: key === "D" ? "#6b7394" : "#ffd25e" }),
    );
    sphere.position.copy(pos);
    const halo = makeGlowSprite(key === "D" ? "#5ad8ff" : "#ffd25e", 2.8, 0.85);
    halo.position.copy(pos);
    s04GraphGroup.add(sphere, halo);
  }
  const graphEdges: [string, string, boolean][] = [
    ["A", "C", true],
    ["C", "B", true],
    ["B", "E", true],
    ["A", "B", false],
    ["C", "D", false],
    ["D", "E", false],
  ];
  for (const [u, v, optimal] of graphEdges) {
    s04GraphGroup.add(
      makeBeamMesh(
        graphNodes[u],
        graphNodes[v],
        optimal ? "#ffd25e" : "#3a4568",
        optimal ? 0.14 : 0.06,
      ),
    );
  }
  const graphRunnerPulse = makeGlowSprite("#5eeaa0", 3.4, 1.0);
  s04GraphGroup.add(graphRunnerPulse);

  // 04-5: Synced note cubes flying from HUS to USSH
  const s04NotesArc = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(10.4, 6.0, -4.2),
    new THREE.Vector3(-1.0, 13.5, -4.6),
    new THREE.Vector3(-12.5, 3.5, -5.0),
  );
  const s04NotesGroup = new THREE.Group();
  root.add(s04NotesGroup);
  const s04NotePackets = Array.from({ length: 12 }, (_, i) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.45),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? "#ffd25e" : "#5eeaa0" }),
    );
    s04NotesGroup.add(m);
    return m;
  });

  // =========================================================================
  // CONVERGENCE BEAMS, BRIDGE OF LIGHT, DRONES & FIREWORKS (S04-6, S06, S07, S09, S10)
  // =========================================================================
  const showRigGroup = new THREE.Group();
  showRigGroup.name = "trailer_show_rig";
  root.add(showRigGroup);

  const coreGround = P(map.core.x, map.core.z, 0);
  const coreSky = P(map.core.x, map.core.z, 60);
  const usshGround = new THREE.Vector3(-12.5, 0, -5.0);

  // E1 + E3 Dual Firework Bouquets
  const fwMain = fireworkBouquets(coreGround, palette, "E1", false);
  const fwBridge = fireworkBouquets(usshGround, palette.slice().reverse(), "E3", false);
  showRigGroup.add(fwMain.mesh, fwBridge.mesh);

  // E3 Woven Bridge of Light connecting HUS and USSH
  const bridgeGroup = new THREE.Group();
  const bridgeA = coreSky.clone().setY(6.2);
  const bridgeB = P(map.campuses[0].x, -120, 60);
  const bridgeMid = bridgeA.clone().lerp(bridgeB, 0.5).setY(15.5);
  const bridgeCurve = new THREE.QuadraticBezierCurve3(bridgeA, bridgeMid, bridgeB);
  const bridgeMainMat = new THREE.MeshBasicMaterial({
    color: "#ffd25e",
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const bridgeMainMesh = new THREE.Mesh(
    new THREE.TubeGeometry(bridgeCurve, 160, 0.18, 12),
    bridgeMainMat,
  );
  bridgeGroup.add(bridgeMainMesh);
  for (let lane = -3; lane <= 3; lane++) {
    if (!lane) continue;
    const ribbon = new THREE.Mesh(
      new THREE.TubeGeometry(bridgeCurve, 100, 0.045, 6),
      new THREE.MeshBasicMaterial({
        color: palette[Math.abs(lane) % palette.length],
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ribbon.position.x = lane * 0.25;
    bridgeGroup.add(ribbon);
  }
  showRigGroup.add(bridgeGroup);

  // 6 Convergence Beams from Anchor Buildings to Core Meet Point
  const meetPoint = new THREE.Vector3(coreGround.x, 9.2, coreGround.z);
  const convergenceBeams: THREE.Mesh[] = [];
  circuitColors.forEach((col, i) => {
    const bid = map.anchors[String(i + 1)];
    const b = map.buildings.find((x) => x.id === bid);
    if (!b) return;
    const top = P(b.x, b.z, b.h).add(new THREE.Vector3(0, 1.6, 0));
    const beam = makeBeamMesh(top, meetPoint, col, 0.08);
    showRigGroup.add(beam);
    convergenceBeams.push(beam);
  });

  // Expanding Ground Shockwave Ring for Scene 05/06
  const shockwaveRing = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.0, 96),
    new THREE.MeshBasicMaterial({
      color: "#ffd25e",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  shockwaveRing.rotation.x = -Math.PI / 2;
  shockwaveRing.position.set(coreGround.x, 0.25, coreGround.z);
  showRigGroup.add(shockwaveRing);

  // 70 Drones forming "70" + 6 Hero Quadcopters
  const SEVEN = ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."];
  const ZERO = [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."];
  const cells70: [number, number][] = [];
  SEVEN.forEach((row, y) => [...row].forEach((c, x) => c === "#" && cells70.push([x, y])));
  ZERO.forEach((row, y) => [...row].forEach((c, x) => c === "#" && cells70.push([x + 7, y])));

  const droneSwarmGroup = new THREE.Group();
  showRigGroup.add(droneSwarmGroup);
  const sphereGeo = new THREE.SphereGeometry(0.24, 14, 10);
  const swarmPoints = cells70.map(([cx, cy], i) => {
    const col = palette[i % palette.length];
    const mesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: col }));
    const halo = makeGlowSprite(col, 1.35, 0.7);
    const to = new THREE.Vector3(coreGround.x + (cx - 6) * 0.78, 18.2 - cy * 0.78, coreGround.z);
    const angle = (i / cells70.length) * Math.PI * 2;
    const from = new THREE.Vector3(
      coreGround.x + Math.cos(angle) * 8,
      6.5 + (i % 5) * 0.8,
      coreGround.z + Math.sin(angle) * 8,
    );
    droneSwarmGroup.add(mesh, halo);
    return { mesh, halo, from, to };
  });

  const droneTemplate = buildDroneModel();
  const heroDrones: { drone: Drone; base: THREE.Vector3; col: THREE.Color }[] = Array.from(
    { length: 8 },
    (_, i) => {
      const d = createDrone(droneTemplate);
      d.root.scale.setScalar(1.05);
      const base = new THREE.Vector3(
        coreGround.x + (i - 3.5) * 2.2,
        12.5 + (i % 2) * 1.4,
        coreGround.z + 5.5,
      );
      showRigGroup.add(d.root);
      return { drone: d, base, col: palette[i % palette.length] };
    },
  );

  // =========================================================================
  // SCENE 07 RIGS: Dual Cartoon Impacts (HUS first, USSH second) & Confetti
  // =========================================================================
  const husImpact = endingImpact(new THREE.Vector3(10.4, 0, -4.2), false);
  const usshImpact = endingImpact(new THREE.Vector3(-12.5, 0, -5.0), false);
  root.add(husImpact.group, usshImpact.group);

  const confettiCount = 750;
  const confettiBase = new Float32Array(confettiCount * 3);
  const confettiVel = new Float32Array(confettiCount * 3);
  const confettiPos = new Float32Array(confettiCount * 3);
  const confettiCol = new Float32Array(confettiCount * 3);
  const confColors = [gold, cyan, ok, danger, white];
  const rndC = mulberry(7070);
  for (let i = 0; i < confettiCount; i++) {
    confettiBase[i * 3] = (rndC() - 0.5) * 76;
    confettiBase[i * 3 + 1] = 8 + rndC() * 26;
    confettiBase[i * 3 + 2] = -22 + rndC() * 34;
    confettiVel[i * 3] = (rndC() - 0.5) * 1.2;
    confettiVel[i * 3 + 1] = -(1.1 + rndC() * 1.4);
    confettiVel[i * 3 + 2] = (rndC() - 0.5) * 1.2;
    const c = confColors[i % confColors.length];
    confettiCol[i * 3] = c.r;
    confettiCol[i * 3 + 1] = c.g;
    confettiCol[i * 3 + 2] = c.b;
  }
  const confettiGeo = new THREE.BufferGeometry();
  confettiGeo.setAttribute("position", new THREE.BufferAttribute(confettiPos, 3));
  confettiGeo.setAttribute("color", new THREE.BufferAttribute(confettiCol, 3));
  const confettiMat = new THREE.PointsMaterial({
    size: 0.36,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const confettiPoints = new THREE.Points(confettiGeo, confettiMat);
  confettiPoints.frustumCulled = false;
  root.add(confettiPoints);

  // =========================================================================
  // DETERMINISTIC FRAME UPDATE: update(t, mode)
  // =========================================================================
  return {
    update(t: number, mode: TrailerRenderMode = "normal") {
      // 1. Base lighting & circuit beacons progression
      setStoryTime(6, true);
      if (mode === "festive") {
        setLit([true, true, true, true, true, true, true]);
      } else if (mode === "launch") {
        setLit([true, true, true, true, true, true, true]);
      } else if (t < 3.8) {
        // S01: sequentially ignite circuits as camera dives in
        const litCount = Math.floor(smoothstep(0.6, 3.4, t) * 7);
        setLit(Array.from({ length: 7 }, (_, i) => i < litCount));
      } else if (t < 15.8) {
        // S02 & S03: partial circuits lit during troubleshooting
        setLit([true, false, true, false, true, false, true]);
      } else if (t < 31.0) {
        // S04: circuits light up one by one across the 8 decisions
        const prog = Math.floor(smoothstep(15.8, 29.0, t) * 7);
        setLit(Array.from({ length: 7 }, (_, i) => i <= prog));
      } else {
        setLit([true, true, true, true, true, true, true]);
      }

      // 2. Scene 02: Runner along HUS -> USSH path
      const inS02 = mode === "normal" && t >= 3.8 && t < 7.8;
      s02Group.visible = inS02;
      if (walkingGroup) {
        walkingGroup.visible = inS02;
        // Hide NPC text sprites during S02 so they don't clutter the frame
        for (const wc of walkingGroup.children) {
          if (wc instanceof THREE.Sprite) wc.visible = false;
        }
      }
      // Hide cluttered individual building name tags; keep only USSH / HUS main badges in wide shots
      for (const lbl of buildingLabelSprites) {
        lbl.visible = false;
      }
      const showCampusBadges =
        mode === "festive" ||
        mode === "launch" ||
        t < 3.8 ||
        (t >= 35.0 && t < 57.15);
      for (const cb of campusBadgeSprites) {
        cb.sprite.visible = showCampusBadges;
      }
      if (inS02) {
        const u = clamp01((t - 3.8) / 4.0);
        const pos = runCurve.getPointAt(u);
        const tangent = runCurve.getTangentAt(u);
        if (playerAvatar) {
          playerAvatar.position.copy(pos);
          playerAvatar.rotation.y = Math.atan2(tangent.x, tangent.z);
          const stride = Math.sin(t * 20) * 0.75;
          const [legL, legR] = playerAvatar.userData.legs as [THREE.Object3D, THREE.Object3D];
          const [armL, armR] = playerAvatar.userData.arms as [THREE.Object3D, THREE.Object3D];
          if (legL && legR) {
            legL.rotation.x = stride;
            legR.rotation.x = -stride;
          }
          if (armL && armR) {
            armL.rotation.x = -stride * 0.7;
            armR.rotation.x = stride * 0.7;
          }
        }
        pathPulses.forEach((p, idx) => {
          const pu = (u * 1.4 + idx / pathPulses.length) % 1;
          p.position.copy(runCurve.getPointAt(pu)).add(new THREE.Vector3(0, 0.28, 0));
        });
      }

      // 3. Scene 03: 4 Incidents
      s03AGroup.visible = mode === "normal" && t >= 7.8 && t < 9.65;
      if (s03AGroup.visible) {
        ledPillars.forEach((p, i) => {
          const isBad = i === 5;
          const wave = Math.sin(t * 6 - i * 0.65);
          p.bulb.position.y = isBad ? 1.85 + Math.sin(t * 9) * 0.12 : 1.5 + wave * 0.08;
          p.bulb.rotation.y = t * (isBad ? -3.5 : 1.5);
          p.ring.scale.setScalar(isBad ? 1.2 + Math.sin(t * 8) * 0.25 : 1.0);
        });
      }

      s03BGroup.visible = mode === "normal" && t >= 9.65 && t < 12.05;
      if (s03BGroup.visible) {
        fileSlabs[0].position.y = 2.5 + Math.sin(t * 3) * 0.1;
        fileSlabs[1].position.y = 2.5 + Math.cos(t * 3) * 0.1;
        diffClashRing.rotation.z = t * 2.5;
        diffClashRing.scale.setScalar(1 + Math.sin(t * 6) * 0.12);
      }

      const inMirrorShot =
        mode === "normal" && ((t >= 12.05 && t < 13.6) || (t >= 15.8 && t < 18.45));
      mirrorGroup.visible = inMirrorShot;
      if (inMirrorShot) {
        const fixFactor = t >= 15.8 ? smoothstep(16.2, 17.4, t) : 0;
        mirrorFrame.rotation.y = THREE.MathUtils.lerp(-0.65, 0.42, fixFactor);
        wrongReflectedBeam.visible = fixFactor < 0.65;
        wrongArrowCone.visible = fixFactor < 0.65;
        fixedReflectedBeam.visible = fixFactor >= 0.45;
        targetBullseye.scale.setScalar(fixFactor >= 0.5 ? 1.15 + Math.sin(t * 6) * 0.08 : 0.9);
      }

      s03DGroup.visible = mode === "normal" && t >= 13.6 && t < 15.8;
      if (s03DGroup.visible) {
        const dt3d = Math.max(0, t - 13.75);
        noteVoxels.forEach((v, i) => {
          const scatter = smoothstep(0.1, 1.4, dt3d - (i % 8) * 0.04);
          v.mesh.position.copy(v.base).addScaledVector(v.vel, scatter * 1.8);
          v.mesh.rotation.set(scatter * 2.2, scatter * 1.7, scatter * 1.3);
          (v.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.15, 1 - scatter * 0.75);
        });
      }

      // 4. Scene 04: Decisions 02..08
      s04CalcGroup.visible = mode === "normal" && t >= 18.45 && t < 20.95;
      if (s04CalcGroup.visible) {
        const u = clamp01((t - 18.55) / 2.1);
        calcShell.position.copy(calcCurve.getPointAt(u));
        ceilingRing.rotation.z = t * 0.8;
      }

      s04GraphGroup.visible = mode === "normal" && t >= 20.95 && t < 23.0;
      if (s04GraphGroup.visible) {
        const u = clamp01((t - 21.05) / 1.75);
        const pathPts = [graphNodes.A, graphNodes.C, graphNodes.B, graphNodes.E];
        const seg = Math.min(2, Math.floor(u * 3));
        const localU = u * 3 - seg;
        graphRunnerPulse.position.lerpVectors(pathPts[seg], pathPts[seg + 1], localU);
      }

      s04NotesGroup.visible = mode === "normal" && t >= 24.5 && t < 25.7;
      if (s04NotesGroup.visible) {
        const baseU = (t - 24.5) / 1.2;
        s04NotePackets.forEach((pkt, i) => {
          const u = (baseU + i / s04NotePackets.length) % 1;
          pkt.position.copy(s04NotesArc.getPointAt(u));
          pkt.rotation.set(t * 3 + i, t * 2, 0);
        });
      }

      // 5. Building Liftoff (Scene 07 HUS-first, USSH-second), Scene 08 Rewind, Scene 10 Split
      let husAge = 0;
      let usshAge = 0;
      if (mode === "launch") {
        husAge = 4.6;
        usshAge = 3.8;
      } else if (mode === "festive") {
        husAge = 0;
        usshAge = 0;
      } else if (t >= 38.0 && t < 46.0) {
        // Scene 07: HUS lifts off FIRST at 38.05s; USSH lifts off SECOND at 40.55s!
        husAge = Math.max(0, t - 38.05);
        usshAge = Math.max(0, t - 40.55);
      } else if (t >= 46.0 && t < 49.8) {
        // Scene 08: Freeze mid-air until 47.25s, then smooth rewind to ground by 49.45s
        const rw = 1 - smoothstep(47.25, 49.45, t);
        const hover = t < 47.25 ? Math.sin((t - 46.0) * 3.5) * 0.15 : 0;
        husAge = (7.95 + hover) * rw;
        usshAge = (5.45 + hover) * rw;
      }

      const unitScale = 1 / map.scale;
      for (const b of buildingBlocks) {
        const age = b.campusId === "HUS" ? husAge : usshAge;
        if (age <= 0.001) {
          b.group.position.copy(b.basePos);
          b.group.rotation.copy(b.baseRot);
          b.boosterRing.visible = false;
        } else {
          // Smooth upward toy-rocket trajectory that rises high into the sky
          const lift = (b.vel.y * age) / (1 + 0.11 * age);
          const drift = age / (1 + 0.16 * age);
          b.group.position.set(
            b.basePos.x + b.vel.x * drift * 0.45 * unitScale,
            b.basePos.y + lift * unitScale,
            b.basePos.z + b.vel.z * drift * 0.45 * unitScale,
          );
          b.group.rotation.set(
            b.baseRot.x + b.spin.x * drift,
            b.baseRot.y + b.spin.y * drift,
            b.baseRot.z + b.spin.z * drift,
          );
          b.boosterRing.visible = true;
          b.boosterRing.scale.setScalar(0.85 + Math.sin(t * 8) * 0.15);
          (b.boosterRing.material as THREE.MeshBasicMaterial).opacity = Math.min(0.9, age * 0.7);
        }
        b.group.updateMatrix();
      }

      // Lift campus badges and roof beacons along with HUS and USSH buildings
      const husWorldLift = husAge > 0 ? (4.2 * husAge) / (1 + 0.11 * husAge) : 0;
      const usshWorldLift = usshAge > 0 ? (4.2 * usshAge) / (1 + 0.11 * usshAge) : 0;
      for (const cb of campusBadgeSprites) {
        cb.sprite.position.y = cb.baseY + (cb.campusId === "HUS" ? husWorldLift : usshWorldLift);
      }
      for (const rb of roofBeaconObjects) {
        rb.obj.position.y = rb.baseY + (rb.campusId === "HUS" ? husWorldLift : usshWorldLift);
      }

      // Update cartoon impacts (HUS at 38.0s, USSH at 40.55s)
      if (mode === "normal" && t >= 37.8 && t < 46.0) {
        husImpact.update(t - 38.0, false);
        usshImpact.update(t - 40.55, false);
      } else {
        husImpact.group.visible = false;
        usshImpact.group.visible = false;
      }

      // Update Confetti (active during S07, S08, and S10 launch side)
      const showConfetti =
        mode === "launch" || (mode === "normal" && t >= 38.2 && t < 49.4);
      confettiPoints.visible = showConfetti;
      if (showConfetti) {
        confettiMat.opacity =
          mode === "launch"
            ? 0.9
            : t >= 46.0
              ? 0.9 * (1 - smoothstep(47.3, 49.3, t))
              : 0.9;
        const elapsedConf = mode === "launch" ? 4.0 : Math.max(0, Math.min(t, 47.25) - 38.2);
        const posAttr = confettiGeo.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < confettiCount; i++) {
          const x = confettiBase[i * 3] + confettiVel[i * 3] * elapsedConf;
          let y = confettiBase[i * 3 + 1] + confettiVel[i * 3 + 1] * elapsedConf;
          y = ((y % 30) + 30) % 30;
          const z = confettiBase[i * 3 + 2] + confettiVel[i * 3 + 2] * elapsedConf;
          posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;
      }

      // 6. Convergence Beams, Shockwave, Bridge of Light, Drones & Fireworks
      const showBeams =
        mode === "festive" ||
        (mode === "normal" && ((t >= 31.0 && t < 38.5) || (t >= 49.8 && t <= 59.0)));
      const beamOpacity =
        mode === "festive"
          ? 0.72
          : t >= 35.0 && t < 38.0
            ? smoothstep(35.0, 36.8, t) * 0.85
            : t >= 49.8
              ? smoothstep(49.8, 51.0, t) * 0.72
              : 0.35;
      for (const bm of convergenceBeams) {
        bm.visible = showBeams;
        (bm.material as THREE.MeshBasicMaterial).opacity = beamOpacity;
      }

      // Ground Shockwave at 32.75s (Button click) and 37.0s ("Chạy mô phỏng!")
      if (mode === "normal" && ((t >= 32.75 && t < 34.8) || (t >= 37.0 && t < 38.6))) {
        const age = t >= 37.0 ? t - 37.0 : t - 32.75;
        shockwaveRing.visible = true;
        shockwaveRing.scale.setScalar(1 + age * 28);
        (shockwaveRing.material as THREE.MeshBasicMaterial).color.set(
          t >= 37.0 ? "#ffd25e" : "#ff6b81",
        );
        (shockwaveRing.material as THREE.MeshBasicMaterial).opacity =
          0.8 * (1 - smoothstep(0.2, 1.6, age));
      } else {
        shockwaveRing.visible = false;
      }

      // Bridge of Light (E3): active in S09 (49.8..55.65s) and S10 festive side
      const showBridge = mode === "festive" || (mode === "normal" && t >= 49.8 && t < 55.65);
      bridgeGroup.visible = showBridge;
      if (showBridge) {
        const bAlpha = mode === "festive" ? 0.85 : smoothstep(49.8, 51.2, t) * 0.85;
        bridgeMainMat.opacity = bAlpha;
      }

      // Fireworks (E1 + E3): active in S09 and S10 festive side
      const showFw = mode === "festive" || (mode === "normal" && t >= 49.8 && t < 55.65);
      fwMain.mesh.visible = showFw;
      fwBridge.mesh.visible = showFw;
      if (showFw) {
        const fwTime = mode === "festive" ? 2.4 + ((t - 55.65) % 4.5) : (t - 49.6) * 1.25;
        fwMain.update(fwTime);
        fwBridge.update(Math.max(0, fwTime - 0.55));
      }

      // 70-Drone Swarm ("70" formation in S04-6, S09, and S10 festive)
      const showSwarm =
        mode === "festive" ||
        (mode === "normal" && ((t >= 25.7 && t < 27.15) || (t >= 49.8 && t < 55.65)));
      droneSwarmGroup.visible = showSwarm;
      if (showSwarm) {
        const formProgress =
          mode === "festive"
            ? 1
            : t < 28.0
              ? smoothstep(25.75, 26.55, t)
              : smoothstep(49.9, 51.2, t);
        swarmPoints.forEach((d, i) => {
          const local = clamp01(formProgress * 1.25 - (i / swarmPoints.length) * 0.25);
          d.mesh.position.lerpVectors(d.from, d.to, local);
          d.mesh.position.y += Math.sin(t * 2.2 + i * 0.3) * 0.06;
          d.halo.position.copy(d.mesh.position);
        });
      }

      // 8 Hero Quadcopters (show-drone.glb)
      const showHeroDrones =
        mode === "festive" ||
        mode === "launch" ||
        (mode === "normal" &&
          ((t >= 25.7 && t < 27.15) || (t >= 35.0 && t < 46.0) || (t >= 49.8 && t < 55.65)));
      heroDrones.forEach((h, i) => {
        h.drone.root.visible = showHeroDrones;
        if (!showHeroDrones) return;
        if (mode === "launch" || (mode === "normal" && t >= 38.0 && t < 46.0)) {
          // In Scene 07 / launch mode: drones swerve playfully around the rising buildings!
          const angle = t * 1.35 + (i / heroDrones.length) * Math.PI * 2;
          const radius = 14 + (i % 3) * 4.5;
          h.drone.root.position.set(
            Math.cos(angle) * radius,
            13 + Math.sin(t * 2.4 + i) * 3.2,
            -5 + Math.sin(angle) * radius * 0.65,
          );
          h.drone.root.rotation.y = -angle + Math.PI / 2;
          h.drone.root.rotation.z = Math.sin(t * 4 + i) * 0.22;
          h.drone.update(t, danger, 0.95, 1, true);
        } else {
          // Hover in formation
          h.drone.root.position.copy(h.base);
          h.drone.root.position.y += Math.sin(t * 1.8 + i) * 0.35;
          h.drone.root.rotation.set(0, 0.15 + Math.sin(t * 0.6 + i) * 0.15, 0);
          h.drone.update(t, h.col, 0.9, 1, true);
        }
      });
    },
  };
}
