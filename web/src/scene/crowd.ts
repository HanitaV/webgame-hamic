import * as THREE from "three";
import type { CrowdSpot, MapData } from "../core/data";

/**
 * Background students. Quest actors stay put in walking.ts.
 * Heading matches the old crowd: rotation.y = atan2(dx, dz), so yaw 0 faces +z
 * (toward the street) and local +x is to the character's right.
 * Lecture halls have no interior, so those students shrink out at the threshold.
 */

const SPEED = 0.36;
type Mode = "stroll" | "lecture" | "sit" | "talk" | "phone";
type EndName = "a" | "b" | "apron" | "door" | "away";
type Face = "travel" | "partner" | "out" | "door" | "building";
interface Clip { dur: number; pose: "walk" | "talk" | "phone" | "hidden" | "stand"; from: EndName; to: EndName; face: Face }
interface Agent {
  mode: Mode; route: number; pair: number; partner: number; seat: number; seats: number;
  lane: number; trail: number; face: number; yaw: number; yawTarget: number; offset: number;
  endA: THREE.Vector3; endB: THREE.Vector3; apron: THREE.Vector3; door: THREE.Vector3; away: THREE.Vector3;
  clips: Clip[];
  pos: THREE.Vector3; sit: number; phone: number; talk: number; swing: number; scale: number; bob: number;
  pose: string; bodyY: number;
}

export interface CrowdSample {
  mode: string; pose: string; x: number; z: number; yaw: number;
  scale: number; phone: number; sit: number; bodyY: number;
}

export class CampusCrowd {
  private parts: THREE.InstancedMesh[] = [];
  private agents: Agent[] = [];
  private low = false;
  private clock = 0;
  private elapsed = 0;
  private placed = false;
  private dummy = new THREE.Object3D();
  private fromV = new THREE.Vector3();
  private toV = new THREE.Vector3();
  constructor(parent: THREE.Object3D, private map: MapData, point: (x: number, z: number) => THREE.Vector3) {
    const scale = point(1, 0).x - point(0, 0).x;
    const config = map.walk.crowd;
    const nodes = map.walk.nodes;
    const primary: Agent[] = [];
    const extra: Agent[] = [];
    const put = (agent: Agent, near: boolean) => (near ? primary : extra).push(agent);
    const v = (x: number, z: number) => point(x, z);
    config.routes.forEach((route, routeId) => {
      const a = nodes.find((n) => n.id === route.from)!;
      const b = nodes.find((n) => n.id === route.to)!;
      const endA = v(a.x, a.z), endB = v(b.x, b.z);
      const leg = Math.max(0.8, endA.distanceTo(endB) / SPEED);
      const wait = 4.8;
      const total = 2 * (leg + wait);
      const pairs = Math.ceil(route.count / 2);
      for (let seat = 0; seat < route.count; seat++) {
        const pair = Math.floor(seat / 2);
        const clips = strollClips(leg, wait);
        const offset = route.near ? leg * 0.22 : ((pair + 0.35) / pairs) * total;
        put(blank({
          mode: "stroll", route: routeId, pair, seat, seats: route.count, offset, clips,
          lane: (seat % 2 === 0 ? -1 : 1) * 0.055, trail: (seat % 2) * 0.06,
          endA, endB, apron: endA, door: endA, away: endB, face: 0,
        }), seat < (route.near ?? 0));
      }
    });
    let lectureIndex = 0;
    const wood = new THREE.MeshLambertMaterial({ color: "#8a6244" });
    const metal = new THREE.MeshLambertMaterial({ color: "#2a3148" });
    for (const spot of config.spots ?? []) {
      if (spot.kind === "sit") addBench(parent, v(spot.x, spot.z), deg(spot.yaw), spot.count, (spot.span ?? 0.95) * scale, wood, metal);
      for (let seat = 0; seat < spot.count; seat++) {
        put(this.spotAgent(spot, seat, scale, v, lectureIndex), seat < (spot.near ?? 0));
      }
      if (spot.kind === "lecture") lectureIndex++;
    }
    this.agents = primary.concat(extra);
    for (const agent of this.agents) {
      agent.partner = agent.mode === "stroll"
        ? this.agents.findIndex((other) => other !== agent && other.mode === "stroll" && other.route === agent.route && other.pair === agent.pair)
        : -1;
    }
    const mat = new THREE.MeshLambertMaterial({ color: "#eef1fb" });
    const screenMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    const limb = new THREE.CapsuleGeometry(0.009, 0.047, 2, 4);
    const geometry = [
      new THREE.SphereGeometry(0.022, 6, 5),
      new THREE.CapsuleGeometry(0.024, 0.044, 2, 5),
      limb, limb, limb, limb,
      new THREE.BoxGeometry(0.02, 0.032, 0.004),
      new THREE.BoxGeometry(0.016, 0.024, 0.002),
    ];
    const shirts = ["#5ad8ff", "#ffd25e", "#5eeaa0", "#a1a9c6"];
    geometry.forEach((g, part) => {
      const mesh = new THREE.InstancedMesh(g, part === 7 ? screenMat : mat, config.normalCount);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      for (let i = 0; i < config.normalCount; i++) {
        const color = part === 0 ? "#eef1fb" : part === 6 ? "#171b28" : part === 7 ? "#b9e6ff" : part >= 2 ? "#121629" : shirts[i % 4];
        mesh.setColorAt(i, new THREE.Color(color));
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      parent.add(mesh);
      this.parts.push(mesh);
    });
    this.update(0, true, true);
  }
  setLow(low: boolean) { this.low = low; this.update(0, true, true); }
  get count() { return Math.min(this.agents.length, this.low ? this.map.walk.crowd.lowCount : this.map.walk.crowd.normalCount); }
  sample(): CrowdSample[] {
    return this.agents.map((a) => ({ mode: a.mode, pose: a.pose, x: a.pos.x, z: a.pos.z, yaw: a.yaw, scale: a.scale, phone: a.phone, sit: a.sit, bodyY: a.bodyY }));
  }
  update(dt: number, reduceMotion: boolean, force = false) {
    if (!reduceMotion) this.clock += dt;
    const snap = !this.placed || reduceMotion;
    this.simulate(reduceMotion, snap ? 1 : Math.min(1, dt * 6));
    this.placed = true;
    this.elapsed += dt;
    if (!force && this.elapsed < (this.low ? 0.15 : 0.04)) return;
    this.elapsed = 0;
    this.write(reduceMotion);
  }
  private spotAgent(spot: CrowdSpot, seat: number, scale: number, v: (x: number, z: number) => THREE.Vector3, lectureIndex: number): Agent {
    const yaw = deg(spot.yaw);
    const center = v(spot.x, spot.z);
    const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
    const home = center.clone();
    let face = yaw;
    if (spot.kind === "talk") {
      const radius = spot.count <= 2 ? 0.085 : 0.105;
      const ang = (seat / spot.count) * Math.PI * 2 + yaw;
      home.set(center.x + Math.sin(ang) * radius, 0, center.z + Math.cos(ang) * radius);
      face = Math.atan2(center.x - home.x, center.z - home.z);
    } else if (spot.kind === "sit" || spot.kind === "phone") {
      const span = (spot.span ?? 0.95) * scale;
      const along = (seat - (spot.count - 1) / 2) * span;
      const forward = spot.kind === "sit" ? 0.02 : 0;
      home.x += rightX * along + fwdX * forward;
      home.z += rightZ * along + fwdZ * forward;
    }
    const apron = spot.kind === "lecture" ? v(spot.x, spot.z) : home.clone();
    const door = spot.door ? v(spot.door[0], spot.door[1]) : home.clone();
    const away = spot.away ? v(spot.away[0], spot.away[1]) : home.clone();
    const spread = (spot.spread ?? 1.2) * scale;
    const lane = spot.kind === "lecture" ? (seat - (spot.count - 1) / 2) * spread : 0;
    let clips: Clip[] = [];
    let offset = seat * 1.7;
    if (spot.kind === "lecture") {
      const approach = Math.max(0.6, away.distanceTo(apron) / SPEED);
      const toDoor = Math.max(0.35, apron.distanceTo(door) / SPEED);
      const inside = 22 + (lectureIndex % 3) * 5;
      clips = lectureClips(approach, toDoor, inside, seat);
      const total = clips.reduce((sum, clip) => sum + clip.dur, 0);
      const pre = 2.2;
      const insideStart = approach + pre + toDoor;
      const lingerStart = insideStart + inside + toDoor;
      offset = (seat === 0 ? insideStart + inside * 0.45 : seat === 1 ? lingerStart + 6.2 * 0.4 : (seat / spot.count) * total) + lectureIndex * 7;
    }
    return blank({
      mode: spot.kind, route: -1, pair: -1, seat, seats: spot.count, offset, clips, lane, trail: 0,
      endA: home, endB: home, apron, door, away, face,
    });
  }
  private end(agent: Agent, name: EndName, out: THREE.Vector3) {
    out.copy(name === "a" ? agent.endA : name === "b" ? agent.endB : name === "door" ? agent.door : name === "away" ? agent.away : agent.apron);
  }
  private simulate(reduceMotion: boolean, turn: number) {
    const t = this.clock;
    for (const agent of this.agents) {
      agent.bob = reduceMotion || agent.mode === "sit" ? 0 : Math.sin(t * 1.3 + agent.seat) * 0.002;
      if (agent.mode === "stroll" || agent.mode === "lecture") this.follow(agent, t, reduceMotion);
      else this.social(agent, t, reduceMotion);
      agent.yaw = turnTo(agent.yaw, agent.yawTarget, turn);
    }
  }
  private follow(agent: Agent, t: number, reduceMotion: boolean) {
    const local = clipAt(agent.clips, t + agent.offset);
    this.end(agent, local.clip.from, this.fromV);
    this.end(agent, local.clip.to, this.toV);
    const moving = local.clip.pose === "walk";
    placeOn(agent.pos, this.fromV, this.toV, moving ? local.u : 1, agent.lane, moving ? agent.trail : 0);
    const len = this.fromV.distanceTo(this.toV);
    if (local.clip.face === "travel" && len > 0.02) agent.yawTarget = Math.atan2(this.toV.x - this.fromV.x, this.toV.z - this.fromV.z);
    else if (local.clip.face === "partner") agent.yawTarget = partnerYaw(agent.endA, agent.endB, agent.lane);
    else if (local.clip.face === "out") agent.yawTarget = Math.atan2(agent.apron.x - agent.door.x, agent.apron.z - agent.door.z);
    else if (local.clip.face === "door") agent.yawTarget = Math.atan2(agent.door.x - agent.apron.x, agent.door.z - agent.apron.z);
    else agent.yawTarget = Math.atan2(agent.apron.x - agent.away.x, agent.apron.z - agent.away.z);
    agent.sit = 0;
    agent.phone = local.clip.pose === "phone" ? 1 : 0;
    agent.talk = local.clip.pose === "talk" ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 + agent.seat * 1.7)) : 0;
    agent.pose = local.clip.pose;
    agent.swing = moving && !reduceMotion ? Math.sin(t * 7 + agent.seat) * 0.38 : 0;
    const entering = local.clip.to === "door" && local.clip.pose === "walk";
    const leaving = local.clip.from === "door" && local.clip.pose === "walk";
    if (local.clip.pose === "hidden") agent.scale = 0;
    else if (entering) agent.scale = 1 - THREE.MathUtils.smoothstep(local.u, 0.55, 1);
    else if (leaving) agent.scale = THREE.MathUtils.smoothstep(local.u, 0, 0.45);
    else agent.scale = 1;
  }
  private social(agent: Agent, t: number, reduceMotion: boolean) {
    agent.pos.copy(agent.endA);
    agent.swing = 0;
    agent.scale = 1;
    agent.yawTarget = agent.face + (reduceMotion ? 0 : Math.sin(t * 0.65 + agent.seat) * (agent.mode === "sit" ? 0 : 0.08));
    if (agent.mode === "sit") {
      const social = t + 8;
      const up = Math.floor(social / 15) % agent.seats === agent.seat ? pulse(social, 15, 3.4) : 0;
      agent.sit = 1 - up;
      agent.phone = up;
      const gesturing = Math.floor(t / 3.4) % agent.seats === agent.seat;
      agent.talk = up > 0.2 ? 0 : gesturing ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.5 + agent.seat)) : 0.12;
      agent.pose = up > 0.55 ? "phone" : "sit";
      return;
    }
    if (agent.mode === "talk") {
      const social = t + 6;
      const glance = Math.floor(social / 17) % agent.seats === agent.seat ? pulse(social, 17, 2.6) : 0;
      agent.sit = 0;
      agent.phone = glance;
      agent.talk = (1 - glance) * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.6 + agent.seat * 2.1)));
      agent.pose = glance > 0.55 ? "phone" : "talk";
      return;
    }
    const up = pulse(t + 4.5, 12, 2.2);
    agent.sit = 0;
    agent.phone = 1 - up;
    agent.talk = 0;
    agent.pose = up > 0.55 ? "stand" : "phone";
  }
  private write(reduceMotion: boolean) {
    const shown = this.count;
    const standY = [0.15, 0.103, 0.039, 0.039, 0.099, 0.099];
    const sitY = [0.09, 0.054, 0.026, 0.026, 0.052, 0.052];
    const side0 = [0, 0, -0.013, 0.013, -0.033, 0.033];
    for (const mesh of this.parts) mesh.count = shown;
    for (let i = 0; i < shown; i++) {
      const agent = this.agents[i];
      const yaw = agent.yaw;
      const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
      const sideX = Math.cos(yaw), sideZ = -Math.sin(yaw);
      const bob = reduceMotion ? 0 : agent.bob;
      for (let part = 0; part < this.parts.length; part++) {
        let y = 0, side = 0, fwd = 0, rotX = 0, sy = 1, sx = 1;
        if (part < 6) {
          y = lerp(standY[part], sitY[part], agent.sit) + bob;
          side = side0[part];
          fwd = agent.sit * (part >= 2 && part <= 3 ? 0.05 : 0.014);
          if (part >= 2 && part <= 3) {
            // Negative rotX swings the foot toward +z, the character's forward.
            rotX = lerp(agent.swing * (part % 2 ? 1 : -1), -1.25, agent.sit);
            sy = lerp(1, 0.52, agent.sit);
          } else if (part >= 4) {
            rotX = lerp(agent.swing * (part % 2 ? 1 : -1), -0.75, agent.sit);
          }
          if (part === 5 && agent.phone > 0) {
            rotX = lerp(rotX, -1.55, agent.phone);
            fwd += 0.02 * agent.phone;
            y += 0.016 * agent.phone;
          } else if (part === 4 && agent.talk > 0) {
            rotX = lerp(rotX, -0.45 - 0.7 * agent.talk, Math.min(1, agent.talk + 0.15));
          }
          if (part === 1) agent.bodyY = y;
        } else {
          const phone = handPhone(agent);
          y = phone.y;
          side = phone.side;
          fwd = phone.fwd + (part === 7 ? 0.004 : 0);
          rotX = phone.rotX;
          sx = agent.phone > 0.04 ? 1 : 0;
        }
        const hidden = agent.scale < 0.02 || (part >= 6 && sx === 0);
        const s = hidden ? 0 : agent.scale;
        this.dummy.position.set(agent.pos.x + sideX * side + fwdX * fwd, hidden ? 0 : y, agent.pos.z + sideZ * side + fwdZ * fwd);
        this.dummy.rotation.set(rotX, yaw, 0);
        this.dummy.scale.set(s, s * (part < 6 ? sy : 1), s);
        this.dummy.updateMatrix();
        this.parts[part].setMatrixAt(i, this.dummy.matrix);
      }
    }
    for (const mesh of this.parts) mesh.instanceMatrix.needsUpdate = true;
  }
}

function blank(partial: Omit<Agent, "partner" | "yaw" | "yawTarget" | "pos" | "sit" | "phone" | "talk" | "swing" | "scale" | "bob" | "pose" | "bodyY">): Agent {
  return { ...partial, partner: -1, yaw: partial.face, yawTarget: partial.face, pos: partial.endA.clone(), sit: 0, phone: 0, talk: 0, swing: 0, scale: 1, bob: 0, pose: "stand", bodyY: 0 };
}

function deg(yaw?: number) { return ((yaw ?? 0) * Math.PI) / 180; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * THREE.MathUtils.clamp(t, 0, 1); }
function turnTo(cur: number, target: number, alpha: number) {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * Math.min(1, Math.max(0, alpha));
}
function pulse(t: number, period: number, dur: number) {
  const fade = 0.28;
  const u = ((t % period) + period) % period;
  if (u >= dur) return 0;
  if (u < fade) return u / fade;
  if (u > dur - fade) return Math.max(0, (dur - u) / fade);
  return 1;
}
function placeOn(out: THREE.Vector3, from: THREE.Vector3, to: THREE.Vector3, u: number, lane: number, trail: number) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const k = THREE.MathUtils.clamp(u, 0, 1);
  out.set(from.x + dx * k + (dz / len) * lane - (dx / len) * trail, 0, from.z + dz * k + (-dx / len) * lane - (dz / len) * trail);
}
function partnerYaw(from: THREE.Vector3, to: THREE.Vector3, lane: number) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const s = lane > 0 ? -1 : 1;
  return Math.atan2((dz / len) * s, (-dx / len) * s);
}
function clipAt(clips: Clip[], time: number) {
  const total = clips.reduce((sum, clip) => sum + clip.dur, 0) || 1;
  let t = ((time % total) + total) % total;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    if (t <= clip.dur || i === clips.length - 1) return { clip, u: clip.dur <= 0 ? 1 : Math.min(1, t / clip.dur) };
    t -= clip.dur;
  }
  return { clip: clips[0], u: 0 };
}
function strollClips(leg: number, wait: number): Clip[] {
  const talk = wait * 0.62, glance = wait - talk;
  return [
    { dur: leg, pose: "walk", from: "a", to: "b", face: "travel" },
    { dur: talk, pose: "talk", from: "b", to: "b", face: "partner" },
    { dur: glance, pose: "phone", from: "b", to: "b", face: "partner" },
    { dur: leg, pose: "walk", from: "b", to: "a", face: "travel" },
    { dur: talk, pose: "talk", from: "a", to: "a", face: "partner" },
    { dur: glance, pose: "phone", from: "a", to: "a", face: "partner" },
  ];
}
function lectureClips(approach: number, toDoor: number, inside: number, seat: number): Clip[] {
  return [
    { dur: approach, pose: "walk", from: "away", to: "apron", face: "travel" },
    { dur: 2.2, pose: "phone", from: "apron", to: "apron", face: "door" },
    { dur: toDoor, pose: "walk", from: "apron", to: "door", face: "travel" },
    { dur: inside, pose: "hidden", from: "door", to: "door", face: "travel" },
    { dur: toDoor, pose: "walk", from: "door", to: "apron", face: "travel" },
    { dur: 6.2, pose: seat % 2 ? "phone" : "talk", from: "apron", to: "apron", face: "out" },
    { dur: approach, pose: "walk", from: "apron", to: "away", face: "travel" },
    { dur: 4.6, pose: "phone", from: "away", to: "away", face: "building" },
  ];
}
function handPhone(agent: Agent) {
  const sit = THREE.MathUtils.clamp(agent.sit, 0, 1);
  const phone = THREE.MathUtils.clamp(agent.phone, 0, 1);
  const armY = lerp(0.099, 0.052, sit) + 0.016 * phone;
  const armFwd = sit * 0.014 + 0.02 * phone;
  const pitch = lerp(lerp(agent.swing, -0.75, sit), -1.55, phone);
  // Arm center to the hand, along local -y, after the same rotX the arm uses.
  const reach = 0.04;
  return {
    y: armY - reach * Math.cos(pitch),
    side: 0.03,
    fwd: armFwd - reach * Math.sin(pitch),
    rotX: pitch * 0.25,
  };
}
function addBench(parent: THREE.Object3D, at: THREE.Vector3, yaw: number, seats: number, span: number, wood: THREE.Material, metal: THREE.Material) {
  const length = Math.max(0.18, (seats - 1) * span + 0.11);
  const group = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(length, 0.016, 0.072), wood);
  seat.position.y = 0.046;
  const back = new THREE.Mesh(new THREE.BoxGeometry(length, 0.052, 0.012), wood);
  back.position.set(0, 0.08, -0.032);
  group.add(seat, back);
  for (const x of [-length / 2 + 0.016, length / 2 - 0.016]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.046, 0.05), metal);
    leg.position.set(x, 0.023, 0);
    group.add(leg);
  }
  group.position.copy(at);
  group.rotation.y = yaw;
  parent.add(group);
}
