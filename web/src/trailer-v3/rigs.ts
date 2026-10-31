/**
 * Hamic Trailer V3 — Deterministic 3D Rigs (Buildings, Hero Drone, Physical Props)
 * ================================================================================
 * Exposes discrete, frame-driven rig parameters (`motion-design` skill):
 * - BuildingLaunchRig: `liftProgress`, `groundShadowScale`, `platformCompression`, `rollAngle`, `pitchAngle`
 * - HeroDroneRig: `position`, `bank`, `pitch`, `yaw`, `thrustPulse`
 * - StagePropsRig: `ledPhaseError`, `fileConflictOffset`, `mirrorNormalAngle`, `noteDissolveProgress`,
 *   `parabolaProgress`, `graphPulseProgress`, `bridgeFlowProgress`, `photoMatchProgress`, `buttonPressProgress`
 *
 * World coordinate system (`map.scale = 0.1`):
 * - HUS T1 (`G_HUS_T1`):   (10.43, 1.6,  4.70), size ~(1.5, 2.1, 6.3)
 * - HUS T3 (`G_HUS_T3`):   ( 6.30, 2.0, -8.72), size ~(1.5, 2.1, 5.6)
 * - HUS Lawn / Core:       (10.41, 0.0, -4.22)
 * - Central Stage:         ( 2.50, 0.02, -3.80), scale = 0.22
 * - USSH E (`G_USSH_E`):   (-5.10, 2.0,  0.49), size ~(3.3, 2.0, 1.6)
 * - USSH C (`G_USSH_C`):   (-13.78, 1.8, 0.48)
 * - USSH B (`G_USSH_B`):   (-21.43, 1.8, 0.48)
 */

import * as THREE from "three";
import { buildDroneModel, createDrone, type Drone } from "../scene/drone";
import { CampusExplosionCluster, CartoonExplosion, EnergySphere } from "./explosion";
import {
  FPS,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  rangeProgress,
  springPop,
} from "./timeline";

export interface BuildingUnitRig {
  id: string;
  nodeName: string;
  campus: "hus" | "ussh";
  isPrimaryHero: boolean;
  worldBase: THREE.Vector3;
  worldSize: THREE.Vector3;
  localBasePos: THREE.Vector3;
  localBaseRot: THREE.Euler;
  pivot: THREE.Group;
  groundShadow: THREE.Mesh;
  groundRim: THREE.Mesh;
  thrusterRing: THREE.Mesh;
  dustGroup: THREE.Group;
  dustCubes: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; phase: number }[];
  orderIndex: number;
  // Discrete rig parameters
  liftProgress: number;
  groundShadowScale: number;
  platformCompression: number;
  rollAngle: number;
  pitchAngle: number;
}

const HUS_NODE_NAMES = [
  "G_HUS_T1",
  "G_HUS_T3",
  "G_HUS_T5",
  "G_HUS_T4",
  "G_HUS_T2",
  "G_HUS_SPECIAL",
  "G_HUS_CANTEEN",
];

const USSH_NODE_NAMES = [
  "G_USSH_E",
  "G_USSH_B",
  "G_USSH_G",
  "G_USSH_C",
  "G_USSH_D",
  "G_USSH_H",
];

function makeCanvasSignTexture(
  title: string,
  sub: string,
  borderColor: string,
  bgColor = "rgba(7, 9, 18, 0.92)"
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 176, 24);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  const titleFontPx = title.length > 12 ? 46 : 66;
  ctx.font = `800 ${titleFontPx}px "Be Vietnam Pro", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 256, 78);

  ctx.fillStyle = borderColor;
  ctx.font = '700 32px "Be Vietnam Pro", sans-serif';
  ctx.fillText(sub, 256, 140);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class TrailerV3RigSystem {
  readonly root = new THREE.Group();
  readonly husUnits: BuildingUnitRig[] = [];
  readonly usshUnits: BuildingUnitRig[] = [];

  private husExplosion!: CampusExplosionCluster;
  private usshExplosion!: CampusExplosionCluster;
  private wideSalvoFx: { update(age: number): void }[] = [];

  private campusBadgeSprites: { sprite: THREE.Sprite; baseY: number; campus: "hus" | "ussh" }[] = [];
  private roofBeaconObjects: { obj: THREE.Object3D; baseY: number; campus: "hus" | "ussh" }[] = [];

  // Hero FPV Drone + Escort Swarm + Sky Formation Drones ("70" emblem)
  readonly heroDrone = new THREE.Group();
  private heroDroneCtrl!: Drone;
  private heroDroneSearchlight!: THREE.Mesh;
  private escortDrones: { ctrl: Drone; offset: THREE.Vector3 }[] = [];
  private formationDrones: { ctrl: Drone; targetPos: THREE.Vector3; launchPos: THREE.Vector3 }[] = [];

  // Central Stage Physical Props at (2.5, 0.02, -3.8), scale 0.22
  readonly stageGroup = new THREE.Group();
  private ledTowers: { group: THREE.Group; bar: THREE.Mesh; mat: THREE.MeshBasicMaterial; index: number }[] = [];
  private fileSlabA!: THREE.Group;
  private fileSlabB!: THREE.Group;
  private fileLockRing!: THREE.Mesh;
  private mirrorGroup!: THREE.Group;
  private mirrorFrame!: THREE.Group;
  private mirrorMatrixRing!: THREE.Mesh;
  private laserBeamIn!: THREE.Mesh;
  private laserBeamOut!: THREE.Mesh;
  private laserTargetCrest!: THREE.Mesh;
  private noteGroup!: THREE.Group;
  private noteSheet!: THREE.Mesh;
  private noteVoxels: { mesh: THREE.Mesh; home: THREE.Vector3; vel: THREE.Vector3 }[] = [];
  private parabolaGroup!: THREE.Group;
  private parabolaShell!: THREE.Mesh;
  private parabolaTangentArrow!: THREE.Group;
  private graphGroup!: THREE.Group;
  private graphEdges: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; idx: number }[] = [];
  private bridgePackets: THREE.Mesh[] = [];
  private photoFrames: { group: THREE.Group; idx: number }[] = [];

  // Big Physical Button & 3D Articulated Cursor Hand
  readonly buttonRigGroup = new THREE.Group();
  private buttonCap!: THREE.Mesh;
  private buttonCapShadow!: THREE.Mesh;
  private buttonShockwave!: THREE.Mesh;
  private cursorHand!: THREE.Group;

  // Exposed discrete telemetry for QA / overlay inspection
  public state = {
    husLiftProgress: 0,
    usshLiftProgress: 0,
    husShadowScale: 1,
    usshShadowScale: 1,
    platformCompression: 0,
    droneBankDeg: 0,
    ledPhaseError: 0,
    mirrorNormalDeg: 0,
    buttonPressProgress: 0,
  };

  constructor(private worldScene: THREE.Scene) {
    this.root.name = "TrailerV3RigRoot";
    this.worldScene.add(this.root);
    this.setupBuildingRigs();
    this.setupHeroDrones();
    this.setupStageProps();
  }

  private setupBuildingRigs(): void {
    // 1. Hide small individual building tags so they never clutter close-up shots,
    //    and collect main HUS/USSH campus badges + roof beacons so they lift with buildings.
    const walkingGroup = this.worldScene.getObjectByName("walking");
    if (walkingGroup) walkingGroup.visible = false;
    const droneStations = this.worldScene.getObjectByName("drone_demo_stations");
    if (droneStations) droneStations.visible = false;

    for (const child of this.worldScene.children) {
      if (child instanceof THREE.Sprite && (child.material as THREE.SpriteMaterial).depthTest === false) {
        if (Math.abs(child.position.y - 4.0) < 0.35 && child.scale.y >= 1.4) {
          this.campusBadgeSprites.push({
            sprite: child,
            baseY: child.position.y,
            campus: child.position.x >= 0 ? "hus" : "ussh",
          });
        } else {
          child.visible = false;
        }
      } else if (
        (child instanceof THREE.Mesh || child instanceof THREE.Sprite) &&
        child.position.y > 1.2 &&
        child.position.y < 15 &&
        Math.abs(child.position.x) > 3.0
      ) {
        this.roofBeaconObjects.push({
          obj: child,
          baseY: child.position.y,
          campus: child.position.x >= 0 ? "hus" : "ussh",
        });
      }
    }

    // 2. Find `campusGroup` (which has scale = 0.1 in world.ts)
    let campusGroup: THREE.Group | null = null;
    this.worldScene.traverse((obj) => {
      if (!campusGroup && obj.parent === this.worldScene && obj instanceof THREE.Group && obj.children.length > 10) {
        for (const c of obj.children) {
          if (c.name.startsWith("G_HUS_") || c.name.startsWith("G_USSH_")) {
            campusGroup = obj;
            break;
          }
        }
      }
    });
    if (!campusGroup) return;
    const cg = campusGroup as THREE.Group;
    cg.updateMatrixWorld(true);

    const wrapList = (names: string[], campus: "hus" | "ussh", out: BuildingUnitRig[]) => {
      names.forEach((nodeName, idx) => {
        const gNode = cg.getObjectByName(nodeName);
        if (!gNode) return;

        const box = new THREE.Box3().setFromObject(gNode);
        if (box.isEmpty()) return;

        const worldCenter = box.getCenter(new THREE.Vector3());
        const worldSize = box.getSize(new THREE.Vector3());
        const worldBase = new THREE.Vector3(worldCenter.x, 0, worldCenter.z);

        // Create pivot inside `cg` (local scale = 10x world) and attach `gNode`
        const pivot = new THREE.Group();
        pivot.name = `V3Pivot_${nodeName}`;
        pivot.position.copy(cg.worldToLocal(worldCenter.clone()));
        cg.add(pivot);
        pivot.updateMatrixWorld(true);

        gNode.traverse((m) => {
          if ((m as THREE.Mesh).isMesh) {
            m.matrixAutoUpdate = true;
          }
        });
        pivot.attach(gNode);

        const isPrimaryHero = idx < 3;
        const accentHex = campus === "hus" ? 0x38bdf8 : 0xf472b6;

        // Add glowing thruster ring under building in `pivot` local space (10x world)
        const localRadius = Math.max(5.0, Math.min(worldSize.x, worldSize.z) * 4.5);
        const thrusterRing = new THREE.Mesh(
          new THREE.RingGeometry(localRadius * 0.55, localRadius * 1.05, 32).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({
            color: campus === "hus" ? 0xffd25e : 0x38bdf8,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        thrusterRing.position.set(0, -(worldSize.y * 5.0) - 0.5, 0);
        pivot.add(thrusterRing);

        // Add dark contact shadow patch on the ground in `this.root` (world space, y = 0.03)
        const shadowGeo = new THREE.PlaneGeometry(worldSize.x * 1.32, worldSize.z * 1.32).rotateX(-Math.PI / 2);
        const shadowMat = new THREE.MeshBasicMaterial({
          color: 0x010206,
          transparent: true,
          opacity: 0.88,
          depthWrite: false,
        });
        const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
        groundShadow.position.set(worldBase.x, 0.03, worldBase.z);
        this.root.add(groundShadow);

        // Glowing ground foundation footprint rim in world space (y = 0.045)
        const wRadius = Math.max(0.75, Math.min(worldSize.x, worldSize.z) * 0.58);
        const rimGeo = new THREE.RingGeometry(wRadius * 0.92, wRadius * 1.25, 32).rotateX(-Math.PI / 2);
        const rimMat = new THREE.MeshBasicMaterial({
          color: accentHex,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const groundRim = new THREE.Mesh(rimGeo, rimMat);
        groundRim.position.set(worldBase.x, 0.045, worldBase.z);
        this.root.add(groundRim);

        // Low-poly ground dust cubes around foundation in world space
        const dustGroup = new THREE.Group();
        dustGroup.position.set(worldBase.x, 0.05, worldBase.z);
        this.root.add(dustGroup);
        const dustCubes: BuildingUnitRig["dustCubes"] = [];
        const cubeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
        const cubeMat = new THREE.MeshLambertMaterial({
          color: campus === "hus" ? 0x7dd3fc : 0xfde047,
          emissive: campus === "hus" ? 0x0c4a6e : 0x713f12,
        });
        const dustCount = isPrimaryHero ? 16 : 8;
        for (let k = 0; k < dustCount; k++) {
          const m = new THREE.Mesh(cubeGeo, cubeMat);
          m.visible = false;
          dustGroup.add(m);
          dustCubes.push({
            mesh: m,
            angle: (k / dustCount) * Math.PI * 2,
            radius: wRadius * (0.9 + 0.5 * ((k * 7) % 5) / 5),
            speed: 1.3 + (k % 4) * 0.35,
            phase: k * 0.71,
          });
        }

        out.push({
          id: `${campus}_${idx}`,
          nodeName,
          campus,
          isPrimaryHero,
          worldBase,
          worldSize,
          localBasePos: pivot.position.clone(),
          localBaseRot: pivot.rotation.clone(),
          pivot,
          groundShadow,
          groundRim,
          thrusterRing,
          dustGroup,
          dustCubes,
          orderIndex: idx,
          liftProgress: 0,
          groundShadowScale: 1,
          platformCompression: 0,
          rollAngle: 0,
          pitchAngle: 0,
        });
      });
    };

    // Discover all HUS and USSH building groups in `cg` (prioritizing hero buildings first)
    const allHusNames = [...HUS_NODE_NAMES];
    const allUsshNames = [...USSH_NODE_NAMES];
    for (const child of cg.children) {
      if (child.name.startsWith("G_HUS_") && !allHusNames.includes(child.name)) {
        allHusNames.push(child.name);
      } else if (child.name.startsWith("G_USSH_") && !allUsshNames.includes(child.name)) {
        allUsshNames.push(child.name);
      }
    }

    wrapList(allHusNames, "hus", this.husUnits);
    wrapList(allUsshNames, "ussh", this.usshUnits);

    // 3. Instantiate cartoon voxel explosion & shockwave clusters for HUS and USSH
    this.husExplosion = new CampusExplosionCluster(
      this.husUnits,
      new THREE.Vector3(8.6, 0, -1.2),
      "hus"
    );
    this.usshExplosion = new CampusExplosionCluster(
      this.usshUnits,
      new THREE.Vector3(-9.5, 0, -0.2),
      "ussh"
    );
    this.root.add(this.husExplosion.group, this.usshExplosion.group);

    // Secondary wide-hero chain-reaction salvo for S13_DISASTER_WIDE_HERO (39.6-43.0s)
    const salvoHusEx = new CartoonExplosion(new THREE.Vector3(8.6, 0.5, -1.2), 4.8, 85, 501);
    const salvoHusSphere = new EnergySphere(new THREE.Vector3(8.6, 1.0, -1.2), 6.4, 2.2, "#b04dff", "#fff0ff");
    const salvoUsshEx = new CartoonExplosion(new THREE.Vector3(-9.5, 0.5, -0.2), 5.6, 95, 502);
    const salvoUsshSphere = new EnergySphere(new THREE.Vector3(-9.5, 1.0, -0.2), 7.6, 2.4, "#ff8a1e", "#fff6e0");
    this.root.add(salvoHusEx.mesh, salvoHusSphere.group, salvoUsshEx.mesh, salvoUsshSphere.group);
    this.wideSalvoFx = [salvoHusEx, salvoHusSphere, salvoUsshEx, salvoUsshSphere];
  }

  private setupHeroDrones(): void {
    const template = buildDroneModel();
    this.heroDroneCtrl = createDrone(template);
    this.heroDroneCtrl.root.scale.setScalar(0.95);
    this.heroDrone.add(this.heroDroneCtrl.root);

    // Volumetric searchlight cone under hero drone
    const coneGeo = new THREE.ConeGeometry(0.48, 1.8, 16, 1, true);
    coneGeo.translate(0, -0.9, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.heroDroneSearchlight = new THREE.Mesh(coneGeo, coneMat);
    this.heroDrone.add(this.heroDroneSearchlight);
    this.root.add(this.heroDrone);

    // 6 escort drones for depth parallax (world scale)
    const offsets = [
      new THREE.Vector3(-1.4, 0.55, -0.9),
      new THREE.Vector3(1.3, 0.35, -1.2),
      new THREE.Vector3(-2.1, -0.25, -1.8),
      new THREE.Vector3(1.9, 0.75, -2.1),
      new THREE.Vector3(-0.8, 0.95, -2.6),
      new THREE.Vector3(0.9, -0.35, -1.5),
    ];
    for (let i = 0; i < offsets.length; i++) {
      const ctrl = createDrone(template);
      ctrl.root.scale.setScalar(0.62);
      this.root.add(ctrl.root);
      this.escortDrones.push({ ctrl, offset: offsets[i] });
    }

    // Sky formation drones spelling "70" over central lawn (2.5, 6.2, -4.0) for Decision 07/08 & Outro
    const glyphPts: [number, number][] = [
      // "7"
      [-2.2, 1.2], [-1.7, 1.2], [-1.2, 1.2], [-0.7, 1.2],
      [-0.85, 0.7], [-1.05, 0.2], [-1.25, -0.3], [-1.45, -0.8], [-1.65, -1.3],
      // "0"
      [0.7, 1.2], [1.3, 1.2], [1.9, 0.8], [1.9, 0.2], [1.9, -0.4], [1.9, -0.9],
      [1.3, -1.3], [0.7, -1.3], [0.25, -0.9], [0.25, -0.4], [0.25, 0.2], [0.25, 0.8],
    ];
    glyphPts.forEach(([gx, gy], idx) => {
      const ctrl = createDrone(template);
      ctrl.root.scale.setScalar(0.55);
      this.root.add(ctrl.root);
      this.formationDrones.push({
        ctrl,
        targetPos: new THREE.Vector3(2.5 + gx * 1.35, 6.2 + gy * 0.95, -4.2),
        launchPos: new THREE.Vector3(2.5 + (idx - 10) * 0.35, 0.4, -3.5 - (idx % 4) * 0.45),
      });
    });
  }

  private setupStageProps(): void {
    // Central festival stage at (2.5, 0.02, 14.2) on the wide-open front avenue in front of all gates (z=11.68),
    // with the entire illuminated HUS x USSH campus skyline behind!
    // Scale 0.22 converts our 13-unit stage rig into ~2.86 world units!
    this.stageGroup.position.set(2.5, 0.02, 14.2);
    this.stageGroup.scale.setScalar(0.22);
    this.root.add(this.stageGroup);

    // Glowing stage deck platform
    const deckGeo = new THREE.CylinderGeometry(13.5, 14.5, 0.8, 32);
    const deckMat = new THREE.MeshLambertMaterial({ color: 0x0f172a, emissive: 0x091326 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.4;
    this.stageGroup.add(deck);

    const deckRim = new THREE.Mesh(
      new THREE.RingGeometry(13.1, 13.7, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    deckRim.position.y = 0.85;
    this.stageGroup.add(deckRim);

    // 1. 8 Physical LED Towers (Glitch 1 + Decision 01/08)
    for (let i = 0; i < 8; i++) {
      const ang = -Math.PI * 0.72 + (i / 7) * Math.PI * 0.68;
      const r = 10.5;
      const tGroup = new THREE.Group();
      tGroup.position.set(Math.cos(ang) * r, 0.8, Math.sin(ang) * r);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.6, 1.1),
        new THREE.MeshLambertMaterial({ color: 0x1e293b })
      );
      tGroup.add(base);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffd25e });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 6.2, 0.65), mat);
      bar.position.y = 3.4;
      tGroup.add(bar);
      this.stageGroup.add(tGroup);
      this.ledTowers.push({ group: tGroup, bar, mat, index: i });
    }

    // 2. Duplicate Conflicting 3D File Slabs + SHA-256 Lock Ring (Glitch 2 + Decision 05/08)
    const makeFileSlab = (title: string, sub: string, borderHex: string) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 3.6, 0.35),
        new THREE.MeshLambertMaterial({ color: 0x0f172a, emissive: 0x111c33 })
      );
      g.add(body);
      const faceTex = makeCanvasSignTexture(title, sub, borderHex);
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(5.3, 3.3),
        new THREE.MeshBasicMaterial({ map: faceTex, transparent: true })
      );
      face.position.z = 0.19;
      g.add(face);
      return g;
    };
    this.fileSlabA = makeFileSlab("kich_ban_v2.json", "HASH #A8F2", "#38bdf8");
    this.fileSlabB = makeFileSlab("kich_ban_FINAL.json", "CONFLICT #99E1", "#fb7185");
    this.fileSlabA.position.set(-2.6, 4.2, 3.0);
    this.fileSlabB.position.set(2.6, 4.2, 3.0);
    this.stageGroup.add(this.fileSlabA, this.fileSlabB);

    this.fileLockRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.8, 0.22, 12, 36),
      new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0 })
    );
    this.fileLockRing.position.set(0, 4.2, 3.3);
    this.stageGroup.add(this.fileLockRing);

    // 3. Physical 3D Mirror + Laser Beam + 2x2 Rotation Matrix Ring (Glitch 3 + Decision 02/08)
    this.mirrorGroup = new THREE.Group();
    this.mirrorGroup.position.set(0, 0.8, 0);
    this.stageGroup.add(this.mirrorGroup);

    this.mirrorFrame = new THREE.Group();
    this.mirrorFrame.position.set(-4.2, 3.5, -1.5);
    const mirrorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4.4, 3.2),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
    );
    const mirrorRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 4.8, 3.6),
      new THREE.MeshLambertMaterial({ color: 0x334155, emissive: 0x0f172a })
    );
    this.mirrorFrame.add(mirrorRim, mirrorGlass);
    this.mirrorGroup.add(this.mirrorFrame);

    // 3D Matrix [R] coordinate ring around mirror
    this.mirrorMatrixRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.14, 12, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd25e })
    );
    this.mirrorMatrixRing.position.copy(this.mirrorFrame.position);
    this.mirrorGroup.add(this.mirrorMatrixRing);

    // Laser emitter & beams
    const beamGeo = new THREE.CylinderGeometry(0.14, 0.14, 9.0, 10);
    beamGeo.rotateZ(Math.PI / 2);
    this.laserBeamIn = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    this.laserBeamIn.position.set(-8.6, 3.5, -1.5);
    this.mirrorGroup.add(this.laserBeamIn);

    const outGeo = new THREE.CylinderGeometry(0.18, 0.18, 12.0, 10);
    outGeo.translate(0, 6.0, 0);
    outGeo.rotateZ(-Math.PI / 2);
    this.laserBeamOut = new THREE.Mesh(outGeo, new THREE.MeshBasicMaterial({ color: 0xffd25e }));
    this.laserBeamOut.position.copy(this.mirrorFrame.position);
    this.mirrorGroup.add(this.laserBeamOut);

    this.laserTargetCrest = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.6, 0),
      new THREE.MeshBasicMaterial({ color: 0xffd25e })
    );
    this.laserTargetCrest.position.set(7.2, 5.2, -1.5);
    this.mirrorGroup.add(this.laserTargetCrest);

    // 4. Giant 3D Post-it Note `_ghichu` + Voxel Dissolve (Glitch 4 + Decision 06/08)
    this.noteGroup = new THREE.Group();
    this.noteGroup.position.set(0, 4.2, 1.5);
    this.stageGroup.add(this.noteGroup);

    const noteTex = makeCanvasSignTexture("_ghichu.txt", "KẾT NỐI HUS ↔ USSH", "#ffd25e", "#facc15");
    this.noteSheet = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 3.4, 0.24),
      new THREE.MeshBasicMaterial({ map: noteTex })
    );
    this.noteGroup.add(this.noteSheet);

    const voxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const voxMat = new THREE.MeshBasicMaterial({ color: 0xffd25e });
    for (let vx = -2; vx <= 2; vx++) {
      for (let vy = -1; vy <= 1; vy++) {
        const vm = new THREE.Mesh(voxGeo, voxMat);
        const home = new THREE.Vector3(vx * 0.9, vy * 0.9, 0);
        const vel = new THREE.Vector3(
          (vx + 0.3) * 1.8,
          2.8 + Math.abs(vx + vy) * 0.9,
          ((vx * 3 + vy) % 3 - 1) * 1.4
        );
        this.noteGroup.add(vm);
        this.noteVoxels.push({ mesh: vm, home, vel });
      }
    }

    // Light bridge packets between HUS T1 (10.4, 4.7) and USSH E (-5.1, 0.5) in world space
    const pktGeo = new THREE.OctahedronGeometry(0.24, 0);
    const pktMat = new THREE.MeshBasicMaterial({ color: 0xffd25e });
    for (let i = 0; i < 14; i++) {
      const pkt = new THREE.Mesh(pktGeo, pktMat);
      pkt.visible = false;
      this.root.add(pkt);
      this.bridgePackets.push(pkt);
    }

    // 5. 3D Parabolic Trajectory + Derivative Tangent Vector (Decision 03/08)
    this.parabolaGroup = new THREE.Group();
    this.parabolaGroup.position.set(0, 1.0, -2.0);
    this.stageGroup.add(this.parabolaGroup);

    const curvePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const x = lerp(-9, 9, u);
      const y = 1.0 + 13.5 * (1 - Math.pow(2 * u - 1, 2));
      curvePts.push(new THREE.Vector3(x, y, 0));
    }
    const curve = new THREE.CatmullRomCurve3(curvePts);
    const tubeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.22, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    this.parabolaGroup.add(tubeMesh);

    this.parabolaShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xffd25e })
    );
    this.parabolaGroup.add(this.parabolaShell);

    this.parabolaTangentArrow = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8).rotateZ(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, 0.9, 10).rotateZ(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    tip.position.x = 2.2;
    this.parabolaTangentArrow.add(shaft, tip);
    this.parabolaGroup.add(this.parabolaTangentArrow);

    // 6. 3D Shortest-Path Graph Nodes & Tubes (Decision 04/08)
    this.graphGroup = new THREE.Group();
    this.graphGroup.position.set(0, 1.2, 0);
    this.stageGroup.add(this.graphGroup);
    const gNodes = [
      new THREE.Vector3(-8, 0.5, 6),
      new THREE.Vector3(-3, 0.5, 2),
      new THREE.Vector3(-2, 0.5, 8),
      new THREE.Vector3(3, 0.5, 4),
      new THREE.Vector3(8, 0.5, 1),
      new THREE.Vector3(8, 0.5, 7),
    ];
    for (const np of gNodes) {
      const nodeMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 0.5, 16),
        new THREE.MeshBasicMaterial({ color: 0xffd25e })
      );
      nodeMesh.position.copy(np);
      this.graphGroup.add(nodeMesh);
    }
    const pairs = [
      [0, 1],
      [1, 3],
      [3, 4],
      [0, 2],
      [2, 3],
      [3, 5],
    ];
    pairs.forEach(([a, b], idx) => {
      const pA = gNodes[a];
      const pB = gNodes[b];
      const dist = pA.distanceTo(pB);
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const eMat = new THREE.MeshBasicMaterial({ color: idx < 3 ? 0xffd25e : 0x1e293b });
      const eMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, dist), eMat);
      eMesh.position.copy(mid);
      eMesh.lookAt(pB);
      this.graphGroup.add(eMesh);
      this.graphEdges.push({ mesh: eMesh, mat: eMat, idx });
    });

    // 7. USSH 3D Memory Photo Frames (Decision 08/08)
    for (let i = 0; i < 3; i++) {
      const fg = new THREE.Group();
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 2.8, 0.28),
        new THREE.MeshBasicMaterial({ color: 0xffd25e })
      );
      const innerMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.3, 2.3),
        new THREE.MeshBasicMaterial({
          map: makeCanvasSignTexture(`KỶ NIỆM 0${i + 1}`, "USSH × HUS", "#38bdf8"),
        })
      );
      innerMesh.position.z = 0.16;
      fg.add(frameMesh, innerMesh);
      this.stageGroup.add(fg);
      this.photoFrames.push({ group: fg, idx: i });
    }

    // 8. Physical 3D [THÊM PHÁO] Console Pedestal, Button Cap & 3D Cursor Hand (Section 4)
    this.buttonRigGroup.position.set(0, 0.8, 3.2);
    this.stageGroup.add(this.buttonRigGroup);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 4.0, 2.6, 24),
      new THREE.MeshLambertMaterial({ color: 0x1e293b, emissive: 0x0f172a })
    );
    ped.position.y = 1.3;
    this.buttonRigGroup.add(ped);

    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.1, 0.45, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd25e })
    );
    bezel.position.y = 2.7;
    this.buttonRigGroup.add(bezel);

    // Dark contact shadow directly under button cap (`motion-design` shadow interaction)
    this.buttonCapShadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.45, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x020308, transparent: true, opacity: 0.78 })
    );
    this.buttonCapShadow.position.y = 2.94;
    this.buttonRigGroup.add(this.buttonCapShadow);

    this.buttonCap = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.35, 1.1, 24),
      new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xbe123c })
    );
    this.buttonCap.position.y = 3.55;
    this.buttonRigGroup.add(this.buttonCap);

    // Top label on button cap
    const capLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.3).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        map: makeCanvasSignTexture("THÊM PHÁO", "×1000 XUNG LỰC", "#ffd25e", "#881337"),
        transparent: true,
      })
    );
    capLabel.position.y = 0.57;
    this.buttonCap.add(capLabel);

    this.buttonShockwave = new THREE.Mesh(
      new THREE.RingGeometry(2.3, 2.9, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xffd25e,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    );
    this.buttonShockwave.position.y = 2.98;
    this.buttonRigGroup.add(this.buttonShockwave);

    // Stylized 3D Articulated Cursor Hand / Finger
    this.cursorHand = new THREE.Group();
    const palm = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.9, 0.75),
      new THREE.MeshLambertMaterial({ color: 0xf8fafc, emissive: 0x334155 })
    );
    palm.position.set(0, 1.8, 0);
    const finger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.42, 2.1, 14),
      new THREE.MeshLambertMaterial({ color: 0xffd25e, emissive: 0x713f12 })
    );
    finger.position.set(0, 0.45, 0);
    const cuff = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.65, 0.9),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    cuff.position.set(0, 2.9, 0);
    this.cursorHand.add(palm, finger, cuff);
    this.cursorHand.position.set(0.8, 6.5, 0.5);
    this.cursorHand.rotation.z = 0.18;
    this.buttonRigGroup.add(this.cursorHand);
  }

  /**
   * Pure deterministic update for frame `frame` (0..1769).
   */
  update(frame: number): void {
    const t = frame / FPS;

    this.updateBuildings(t);
    this.updateDrones(t);
    this.updateStageProps(t);
  }

  private updateBuildings(t: number): void {
    let husBlastAge = -1.0;
    let usshBlastAge = -1.0;
    let usshWaveWobble = 0.0;
    let wideSalvoAge = -1.0;

    if (t < 5.65) {
      // Cold open (0.00 - 5.65s):
      // Frame 0 starts with HUS already mid-explosion (`husBlastAge = 0.38s`)!
      husBlastAge = t < 1.0 ? -1.0 : lerp(0.0, 3.20, rangeProgress(t, 1.0, 5.65));
      if (t < 3.1) {
        usshBlastAge = lerp(-0.75, -0.01, rangeProgress(t, 1.35, 3.1));
        usshWaveWobble = 0.09 * rangeProgress(t, 1.35, 3.1);
      } else {
        // USSH explodes second at t = 2.85s!
        usshBlastAge = lerp(0.0, 2.45, rangeProgress(t, 3.1, 5.65));
      }
    } else if (t < 6.30) {
      // Rewind whip (5.65 - 6.30s): all voxel blocks fly back into the buildings!
      const rw = easeInOutCubic(rangeProgress(t, 5.65, 6.28));
      husBlastAge = lerp(3.20, -1.0, rw);
      usshBlastAge = lerp(2.45, -1.0, rw);
    } else if (t >= 32.8 && t < 35.0) {
      // Ground tremor & pre-blast jelly wobble (33.0 - 35.0s)
      husBlastAge = lerp(-0.75, -0.01, rangeProgress(t, 33.0, 35.0));
      usshWaveWobble = 0.06 * rangeProgress(t, 33.4, 35.0);
    } else if (t >= 35.0 && t < 43.0) {
      // Actual Disaster: HUS explodes FIRST at 35.00s, USSH explodes SECOND at 37.15s!
      husBlastAge = (t - 35.0) * 0.68;
      if (t < 37.15) {
        usshBlastAge = lerp(-0.75, -0.01, rangeProgress(t, 35.15, 37.15));
        usshWaveWobble = 0.14 * rangeProgress(t, 35.2, 37.15);
      } else {
        usshBlastAge = (t - 37.15) * 0.78;
      }
      if (t >= 39.55) {
        wideSalvoAge = (t - 39.55) * 0.85;
      }
    } else if (t >= 43.0 && t < 46.5) {
      // Relief & Fast Visual Rollback (43.0 - 46.5s)
      const husEndAge = (43.0 - 35.0) * 0.68;
      const usshEndAge = (43.0 - 37.15) * 0.78;
      const salvoEndAge = (43.0 - 39.55) * 0.85;
      if (t < 43.70) {
        // Freeze punchline (`CHỈ LÀ MÔ PHỎNG`)
        husBlastAge = husEndAge;
        usshBlastAge = usshEndAge;
        wideSalvoAge = salvoEndAge;
      } else if (t < 45.45) {
        // Reverse voxel reassembly!
        const rb = easeInOutCubic(rangeProgress(t, 43.70, 45.45));
        husBlastAge = lerp(husEndAge, -1.0, rb);
        usshBlastAge = lerp(usshEndAge, -1.0, rb);
        wideSalvoAge = lerp(salvoEndAge, -1.0, rb);
      } else if (t < 46.05) {
        const settle = Math.sin(rangeProgress(t, 45.45, 46.05) * Math.PI);
        usshWaveWobble = 0.04 * settle;
      }
    } else if (t >= 58.15) {
      // Seamless loop seam feeding into Frame 0 (`husBlastAge = 0.38`)
      const lp = easeInOutCubic(rangeProgress(t, 58.15, 59.0));
      husBlastAge = lerp(-0.45, 0.38, lp);
      usshBlastAge = -1.0;
    }

    if (this.husExplosion) {
      this.husExplosion.update(husBlastAge, usshWaveWobble * 0.4);
    }
    if (this.usshExplosion) {
      this.usshExplosion.update(usshBlastAge, usshWaveWobble);
    }
    for (const fx of this.wideSalvoFx) {
      fx.update(wideSalvoAge);
    }

    const husProgress = clamp01(husBlastAge / 1.4);
    const usshProgress = clamp01(usshBlastAge / 1.4);
    for (const u of this.husUnits) {
      u.liftProgress = husProgress;
      u.groundShadowScale = Math.max(0.22, 1.0 - husProgress * 0.72);
      for (const dc of u.dustCubes) dc.mesh.visible = false;
    }
    for (const u of this.usshUnits) {
      u.liftProgress = usshProgress;
      u.groundShadowScale = Math.max(0.22, 1.0 - usshProgress * 0.72);
      for (const dc of u.dustCubes) dc.mesh.visible = false;
    }

    // Float campus badges slightly above the blast cloud and hide roof beacons when shattered
    for (const cb of this.campusBadgeSprites) {
      const prog = cb.campus === "hus" ? husProgress : usshProgress;
      cb.sprite.position.y = cb.baseY + prog * 3.8;
    }
    for (const rb of this.roofBeaconObjects) {
      const age = rb.campus === "hus" ? husBlastAge : usshBlastAge;
      rb.obj.visible = age < 0.08;
      rb.obj.position.y = rb.baseY;
    }

    this.state.husLiftProgress = Number(husProgress.toFixed(3));
    this.state.usshLiftProgress = Number(usshProgress.toFixed(3));
    this.state.husShadowScale = Number((this.husUnits[0]?.groundShadowScale ?? 1).toFixed(3));
    this.state.usshShadowScale = Number((this.usshUnits[0]?.groundShadowScale ?? 1).toFixed(3));
    this.state.platformCompression = Number(usshWaveWobble.toFixed(3));
  }

  private updateDrones(t: number): void {
    const cyanColor = new THREE.Color(0x38bdf8);
    const goldColor = new THREE.Color(0xffd25e);
    this.heroDroneCtrl.update(t * 25, cyanColor, 1.0, 1.0, true);

    // Hero drone trajectory in world units:
    // - S01/S02 (0-6.3s) & S11-S13 (35-43s): banking between HUS T1 (10.4, 4.7) and USSH E (-5.1, 0.5)!
    let pos = new THREE.Vector3(3.5, 2.6, -2.0);
    let bank = 0;
    let pitch = -0.14;
    let yaw = 0;

    if (t < 6.3) {
      const u = rangeProgress(t, 0, 6.3);
      pos.set(
        lerp(11.2, -3.8, easeInOutCubic(u)) + Math.sin(t * 3.8) * 0.9,
        lerp(2.2, 4.4, u) + Math.cos(t * 5.2) * 0.45,
        lerp(5.8, 1.2, u)
      );
      bank = 0.58 * Math.sin(t * 4.5);
      pitch = -0.24 + 0.15 * Math.cos(t * 3.8);
      yaw = 0.65 + u * 0.9;
    } else if (t >= 35.0 && t < 43.0) {
      const u = rangeProgress(t, 35.0, 43.0);
      pos.set(
        lerp(9.5, -4.2, easeInOutCubic(u)) + Math.sin(t * 4.8) * 1.1,
        lerp(2.0, 4.8, u) + Math.sin(t * 6.0) * 0.55,
        lerp(4.2, 1.5, u)
      );
      bank = 0.68 * Math.sin(t * 5.4);
      pitch = -0.28;
      yaw = 0.5 + u * 1.1;
    } else {
      const ang = t * 0.65;
      pos.set(2.5 + Math.cos(ang) * 3.2, 2.8 + Math.sin(t * 2.0) * 0.35, -3.8 + Math.sin(ang) * 2.4);
      bank = 0.22 * Math.sin(t * 2.4);
      pitch = -0.12;
      yaw = -ang + Math.PI * 0.5;
    }

    this.heroDrone.position.copy(pos);
    this.heroDrone.rotation.set(pitch, yaw, bank);
    this.state.droneBankDeg = Math.round((bank * 180) / Math.PI);

    for (let i = 0; i < this.escortDrones.length; i++) {
      const ed = this.escortDrones[i];
      ed.ctrl.update(t * 25 + i, i % 2 === 0 ? goldColor : cyanColor, 0.9, 1.0, true);
      ed.ctrl.root.position.copy(pos).add(ed.offset);
      ed.ctrl.root.position.y += Math.sin(t * 3.2 + i) * 0.22;
      ed.ctrl.root.rotation.set(pitch * 0.8, yaw, bank * 0.85);
    }

    // Update sky formation drones ("70") in Decision 07/08 (22.0-27.1s) and Outro (46.5-58.1s)
    const showFormation = (t >= 22.0 && t < 27.1) || (t >= 46.5 && t < 58.1);
    const formP = t < 30 ? easeOutCubic(rangeProgress(t, 22.0, 23.1)) : easeOutCubic(rangeProgress(t, 46.5, 47.8));
    this.formationDrones.forEach((fd, idx) => {
      if (!showFormation) {
        fd.ctrl.update(t * 20, goldColor, 0, 0, false);
        return;
      }
      fd.ctrl.update(t * 25 + idx, idx < 9 ? cyanColor : goldColor, 1.2, 1.0, true);
      fd.ctrl.root.position.set(
        lerp(fd.launchPos.x, fd.targetPos.x, formP),
        lerp(fd.launchPos.y, fd.targetPos.y, formP) + Math.sin(t * 3.0 + idx) * 0.08,
        lerp(fd.launchPos.z, fd.targetPos.z, formP)
      );
    });
  }

  private updateStageProps(t: number): void {
    // Stage is visible during Rewind/Glitches (6.3-13.0s), Speedrun (13.0-27.1s), Misclick/Countdown (27.1-33.0s), and Outro (46.5-58.1s)
    this.stageGroup.visible = t >= 5.7 && t < 33.2;

    // 1. LED Towers: Glitch (6.3 - 9.8s) vs Fixed (13.0s+)
    const isLedGlitch = t >= 6.3 && t < 13.8;
    const ledFixP = rangeProgress(t, 13.6, 14.6);
    const phaseErr = isLedGlitch ? 1.0 - ledFixP : 0.0;
    this.state.ledPhaseError = Number(phaseErr.toFixed(2));

    for (const lt of this.ledTowers) {
      if (lt.index === 5 && phaseErr > 0.05) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 16.0);
        lt.mat.color.setHex(pulse > 0.5 ? 0xf43f5e : 0xa855f7);
        lt.bar.scale.y = 0.45 + 0.75 * pulse;
        lt.group.rotation.z = 0.18 * Math.sin(t * 14.0);
      } else {
        lt.mat.color.setHex(0xffd25e);
        lt.bar.scale.y = 1.0 + 0.12 * Math.sin(t * 4.0 + lt.index * 0.5);
        lt.group.rotation.z = 0;
      }
    }

    // 2. Duplicate File Slabs (Glitch 9.65-10.65s; Fixed 19.8-21.0s)
    const showFiles = (t >= 9.65 && t < 10.65) || (t >= 19.8 && t < 21.0);
    this.fileSlabA.visible = showFiles;
    this.fileSlabB.visible = showFiles;
    this.fileLockRing.visible = showFiles;
    if (showFiles) {
      const isFixed = t >= 19.9;
      const fixP = springPop(t - 19.9);
      if (!isFixed) {
        const clash = Math.sin(t * 22.0) * 0.65;
        this.fileSlabA.position.set(-2.6 + clash, 4.2 + Math.cos(t * 18) * 0.25, 3.0);
        this.fileSlabB.position.set(2.6 - clash, 4.2 - Math.cos(t * 18) * 0.25, 3.2);
        this.fileSlabA.rotation.z = 0.12 * Math.sin(t * 15);
        this.fileSlabB.rotation.z = -0.14 * Math.cos(t * 15);
        this.fileSlabB.scale.setScalar(1.0);
        (this.fileLockRing.material as THREE.MeshBasicMaterial).opacity = 0;
      } else {
        this.fileSlabA.position.set(lerp(-2.6, 0, fixP), 4.2, 3.1);
        this.fileSlabB.position.set(lerp(2.6, 0, fixP), 4.2, 2.8);
        this.fileSlabB.scale.setScalar(Math.max(0.01, 1 - fixP * 0.85));
        this.fileSlabA.rotation.z = 0;
        const rMat = this.fileLockRing.material as THREE.MeshBasicMaterial;
        rMat.opacity = clamp01(fixP);
        this.fileLockRing.rotation.z = t * 2.5;
      }
    }

    // 3. Mirror & Laser Matrix (Glitch 10.65-11.35s; Fixed 15.0-16.4s)
    const showMirror = (t >= 10.65 && t < 11.35) || (t >= 15.0 && t < 16.4);
    this.mirrorGroup.visible = showMirror;
    if (showMirror) {
      const fixP = easeInOutCubic(rangeProgress(t, 15.15, 16.05));
      const mirrorAng = lerp(-0.62, 0.0, fixP);
      this.mirrorFrame.rotation.y = mirrorAng;
      this.mirrorMatrixRing.rotation.z = t * 2.2;
      this.mirrorMatrixRing.visible = t >= 15.0;
      this.laserBeamOut.rotation.y = mirrorAng * 1.4;
      this.laserBeamOut.rotation.z = lerp(-0.38, 0.14, fixP);
      const outMat = this.laserBeamOut.material as THREE.MeshBasicMaterial;
      outMat.color.setHex(fixP > 0.7 ? 0xffd25e : 0xf43f5e);
      this.laserTargetCrest.scale.setScalar(fixP > 0.7 ? 1.35 + 0.2 * Math.sin(t * 12) : 0.7);
      this.state.mirrorNormalDeg = Math.round((mirrorAng * 180) / Math.PI);
    }

    // 4. Post-It Note `_ghichu` & Light Bridge (Glitch 11.35-13.0s; Fixed 21.0-22.2s)
    const showNote = (t >= 11.35 && t < 13.0) || (t >= 21.0 && t < 22.2);
    this.noteGroup.visible = showNote;
    if (showNote) {
      const isDissolving = t < 13.0;
      const dissP = isDissolving
        ? easeOutCubic(rangeProgress(t, 11.45, 12.75))
        : 1.0 - easeOutCubic(rangeProgress(t, 21.1, 21.85));
      this.noteSheet.scale.setScalar(Math.max(0.01, 1.0 - dissP));
      for (const v of this.noteVoxels) {
        v.mesh.visible = dissP > 0.04;
        v.mesh.position.copy(v.home).addScaledVector(v.vel, dissP * 1.8);
        v.mesh.rotation.set(dissP * 4.0, dissP * 3.0, 0);
        v.mesh.scale.setScalar(Math.max(0.05, 1.0 - dissP * 0.45));
      }
    }

    const showBridge = t >= 21.0 && t < 27.1;
    this.bridgePackets.forEach((pkt, i) => {
      pkt.visible = showBridge;
      if (showBridge) {
        const u = (t * 0.55 + i / this.bridgePackets.length) % 1.0;
        pkt.position.set(
          lerp(10.4, -5.1, u),
          2.2 + Math.sin(u * Math.PI) * 3.4,
          lerp(4.7, 0.5, u)
        );
        pkt.rotation.y = t * 3.0 + i;
      }
    });

    // 5. Parabola + Derivative Tangent (Decision 03/08: 16.4 - 18.2s)
    const showParabola = t >= 16.4 && t < 18.2;
    this.parabolaGroup.visible = showParabola;
    if (showParabola) {
      const u = easeInOutCubic(rangeProgress(t, 16.5, 17.95));
      const x = lerp(-9, 9, u);
      const y = 1.0 + 13.5 * (1 - Math.pow(2 * u - 1, 2));
      const dydx = (-54.0 * (2 * u - 1)) / 18.0;
      const ang = Math.atan(dydx);
      this.parabolaShell.position.set(x, y, 0);
      this.parabolaTangentArrow.position.set(x, y, 0.5);
      this.parabolaTangentArrow.rotation.z = ang;
    }

    // 6. Shortest-Path Graph (Decision 04/08: 18.2 - 19.8s)
    const showGraph = t >= 18.2 && t < 19.8;
    this.graphGroup.visible = showGraph;
    if (showGraph) {
      const gp = rangeProgress(t, 18.3, 19.5);
      for (const ge of this.graphEdges) {
        if (ge.idx < 3) {
          const active = gp * 3 >= ge.idx;
          ge.mat.color.setHex(active ? 0xffd25e : 0x38bdf8);
          ge.mesh.scale.y = active ? 2.2 : 1.0;
        }
      }
    }

    // 7. USSH Memory Photo Frames (Decision 08/08: 23.8 - 25.2s)
    const showPhotos = t >= 23.8 && t < 25.2;
    for (const pf of this.photoFrames) {
      pf.group.visible = showPhotos;
      if (showPhotos) {
        const sp = springPop(t - (23.85 + pf.idx * 0.22));
        const x = (pf.idx - 1) * 4.6;
        pf.group.position.set(x, lerp(9.5, 4.2, sp), 2.2);
        pf.group.rotation.z = (1 - sp) * 0.35 * (pf.idx - 1);
      }
    }

    // 8. Big Physical [THÊM PHÁO] Button & 3D Articulated Cursor Hand (27.1 - 33.0s)
    const showButton = t >= 27.1 && t < 33.0;
    this.buttonRigGroup.visible = showButton;
    if (showButton) {
      let pressP = 0;
      let handY = 6.2;
      if (t < 29.55) {
        const hoverP = rangeProgress(t, 27.2, 28.6);
        handY = lerp(7.8, 4.95, easeOutCubic(hoverP)) + 0.22 * Math.sin(t * 7.5);
        if (t >= 29.15) {
          handY += 0.55 * Math.sin(rangeProgress(t, 29.15, 29.55) * Math.PI);
        }
      } else if (t < 29.82) {
        pressP = easeOutCubic(rangeProgress(t, 29.55, 29.75));
        handY = lerp(4.95, 3.85, pressP);
      } else {
        const afterT = t - 29.82;
        const recoil = springPop(afterT, 240, 11, 0.6);
        pressP = lerp(1.0, 0.72, clamp01(recoil));
        handY = lerp(3.85, 4.55, clamp01(recoil));
      }

      this.buttonCap.position.y = lerp(3.55, 3.08, pressP);
      this.buttonCap.scale.set(1 + pressP * 0.09, 1 - pressP * 0.24, 1 + pressP * 0.09);
      this.buttonCapShadow.scale.setScalar(lerp(1.0, 0.86, pressP));
      this.cursorHand.position.y = handY;

      const swMat = this.buttonShockwave.material as THREE.MeshBasicMaterial;
      if (t >= 29.74 && t < 30.6) {
        const swP = rangeProgress(t, 29.74, 30.55);
        this.buttonShockwave.scale.setScalar(1.0 + swP * 4.5);
        swMat.opacity = (1.0 - swP) * 0.9;
      } else {
        swMat.opacity = 0;
      }
      this.state.buttonPressProgress = Number(pressP.toFixed(3));
    } else {
      this.state.buttonPressProgress = 0;
    }
  }
}
