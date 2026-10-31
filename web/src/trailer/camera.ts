import * as THREE from "three";

/**
 * Deterministic fixed-clock camera choreography for all 10 trailer scenes.
 * Uses smooth cubic/quintic easing, spline interpolation, controlled whip-pans,
 * and safe altitude envelopes so the camera never clips into any building mesh.
 */

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  roll: number;
}

export function applyCameraPose(camera: THREE.PerspectiveCamera, pose: CameraPose): void {
  camera.position.copy(pose.position);
  camera.up.set(0, 1, 0);
  camera.lookAt(pose.target);
  if (Math.abs(pose.roll) > 1e-5) {
    camera.rotateZ(pose.roll);
  }
  if (Math.abs(camera.fov - pose.fov) > 1e-3) {
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
  }
}

/**
 * Scene coordinate references (in world units, where map.origin=[2.5,-125], scale=0.1):
 * - HUS Core / Lawn: (10.41, 0, -4.22), corePos.y = 6.0
 * - HUS Gate:        (10.41, 0, 11.68)
 * - HUS T1:          (10.43, 1.6, 4.70)
 * - HUS T3:          (6.30,  2.0, -8.72)
 * - HUS Canteen:     (3.67,  0.4, -4.22)
 * - Crossing:        (-1.25, 0, -5.00)
 * - USSH E:          (-5.10, 2.0, 0.49)
 * - USSH C:          (-13.78, 1.8, 0.48)
 * - USSH B:          (-21.43, 1.8, 0.48)
 */
export function evaluateTrailerCamera(time: number, splitSide?: "left" | "right"): CameraPose {
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  let fov = 42;
  let roll = 0;

  // SCENE 10 Split-Screen override when rendering Left (Festive) vs Right (Rocket Launch)
  if (splitSide === "left") {
    const u = smoothstep(55.65, 59.0, time);
    position.set(2.0 - u * 3.0, 18.5 - u * 1.5, 44.0 - u * 4.0);
    target.set(3.5, 6.8, -3.5);
    fov = 42;
    return { position, target, fov, roll: 0 };
  }
  if (splitSide === "right") {
    const u = smoothstep(55.65, 59.0, time);
    position.set(-4.0 + u * 3.0, 22.0 + u * 2.5, 54.0 - u * 3.0);
    target.set(-1.0, 10.5 + u * 2.0, -3.5);
    fov = 44;
    return { position, target, fov, roll: 0 };
  }

  // SCENE 01 — HOOK (0.00 - 3.80s): High aerial establishing shot -> energetic dolly-in
  if (time < 3.80) {
    const u = smootherstep(0.0, 3.80, time);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 36.0, 56.0),
      new THREE.Vector3(6.5, 25.0, 42.0),
      new THREE.Vector3(11.5, 14.5, 26.5),
    ]);
    position.copy(curve.getPoint(u));
    target.set(
      THREE.MathUtils.lerp(0.0, 4.5, u),
      THREE.MathUtils.lerp(3.5, 4.2, u),
      THREE.MathUtils.lerp(-2.0, -3.5, u)
    );
    fov = THREE.MathUtils.lerp(46, 40, u);
    roll = Math.sin(u * Math.PI) * -0.025;
    return { position, target, fov, roll };
  }

  // SCENE 02 — NHIỆM VỤ (3.80 - 7.80s): Low-altitude tracking shot following runner from HUS to USSH
  if (time < 7.80) {
    const u = smootherstep(3.80, 7.80, time);
    // Runner moves along spline from HUS Lawn (10.4, -4.2) -> Canteen (1.5, -6.5) -> Crossing (-1.5, -5.0) -> USSH E (-5.1, -4.5)
    const runnerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(10.4, 0.0, 2.0),
      new THREE.Vector3(8.5, 0.0, -4.2),
      new THREE.Vector3(2.2, 0.0, -6.2),
      new THREE.Vector3(-4.5, 0.0, -4.8),
      new THREE.Vector3(-9.5, 0.0, -2.5),
    ]);
    const runnerPos = runnerCurve.getPoint(u);
    const camCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(15.5, 7.5, 11.5),
      new THREE.Vector3(12.0, 6.2, 4.5),
      new THREE.Vector3(4.5, 6.8, 3.2),
      new THREE.Vector3(-2.5, 7.5, 5.5),
      new THREE.Vector3(-8.0, 8.5, 8.0),
    ]);
    position.copy(camCurve.getPoint(u));
    target.copy(runnerPos).add(new THREE.Vector3(0, 1.3, -1.2));
    fov = 42;
    roll = Math.sin(u * Math.PI * 2) * 0.018;
    return { position, target, fov, roll };
  }

  // SCENE 03 — BỐN SỰ CỐ (7.80 - 15.80s): 4 distinct action shots
  if (time < 15.80) {
    if (time < 9.65) {
      // Shot 3A (7.80 - 9.65s): Row of 7 LED pillars on HUS lawn, tracking toward pillar #6 misfiring
      const u = smootherstep(7.80, 9.65, time);
      position.set(THREE.MathUtils.lerp(6.2, 12.6, u), 4.2, THREE.MathUtils.lerp(4.2, 3.4, u));
      target.set(THREE.MathUtils.lerp(7.5, 12.2, u), 2.1, -3.8);
      fov = 38;
      // Micro-jolt when pillar #6 misfires at 9.05s
      if (time > 9.00 && time < 9.55) {
        const j = Math.exp(-(time - 9.00) * 8) * 0.16;
        position.x += Math.sin(time * 55) * j;
        position.y += Math.cos(time * 48) * j * 0.6;
      }
      return { position, target, fov, roll: 0 };
    }
    if (time < 12.05) {
      // Shot 3B (9.65 - 12.05s): Two floating 3D file slabs at HUS Gate
      const u = smootherstep(9.65, 12.05, time);
      position.set(THREE.MathUtils.lerp(9.0, 11.6, u), 4.6, THREE.MathUtils.lerp(18.2, 16.8, u));
      target.set(10.4, 2.8, 10.5);
      fov = 39;
      return { position, target, fov, roll: 0 };
    }
    if (time < 13.60) {
      // Shot 3C (12.05 - 13.60s): Reversed 3D mirror reflecting red laser beam off-target
      const u = smootherstep(12.05, 13.60, time);
      position.set(THREE.MathUtils.lerp(-1.2, 1.5, u), 5.6, THREE.MathUtils.lerp(5.8, 4.6, u));
      target.set(-3.8, 2.6, -2.5);
      fov = 40;
      return { position, target, fov, roll: -0.02 };
    }
    // Shot 3D (13.60 - 15.80s): 404 Note Not Found dissolving + chaotic final schedules at T3/USSH
    const u = smootherstep(13.60, 15.80, time);
    position.set(THREE.MathUtils.lerp(-8.5, -5.2, u), 5.8, THREE.MathUtils.lerp(7.2, 6.2, u));
    target.set(-6.5, 2.9, -2.2);
    fov = 40;
    return { position, target, fov, roll: 0 };
  }

  // SCENE 04 — TÁM QUYẾT ĐỊNH (15.80 - 31.00s): 8 dynamic camera angles with energetic whip-ins
  if (time < 31.00) {
    if (time < 19.35) {
      // 01/08 ha: Matrix mirror alignment over lawn/E
      const u = smootherstep(15.80, 19.35, time);
      position.set(THREE.MathUtils.lerp(-1.5, 2.8, u), 6.5, THREE.MathUtils.lerp(7.0, 5.2, u));
      target.set(-2.5, 2.8, -2.5);
      fov = 40;
    } else if (time < 21.25) {
      // 02/08 firework: Calculus trajectory rising to 70m ring above HUS core
      const u = smootherstep(19.35, 21.25, time);
      position.set(THREE.MathUtils.lerp(16.0, 13.5, u), THREE.MathUtils.lerp(8.5, 11.5, u), 22.0);
      target.set(10.4, THREE.MathUtils.lerp(3.5, 7.2, u), -4.2);
      fov = 42;
    } else if (time < 22.90) {
      // 03/08 final: High-angle graph view across HUS-USSH walkways
      const u = smootherstep(21.25, 22.90, time);
      position.set(THREE.MathUtils.lerp(4.0, -2.0, u), 24.0, THREE.MathUtils.lerp(24.0, 21.0, u));
      target.set(1.5, 1.5, -4.5);
      fov = 44;
    } else if (time < 24.30) {
      // 04/08 version: Hash verification at HUS Gate
      const u = smootherstep(22.90, 24.30, time);
      position.set(THREE.MathUtils.lerp(13.5, 10.8, u), 5.2, 17.5);
      target.set(10.4, 2.5, 10.5);
      fov = 38;
    } else if (time < 25.55) {
      // 05/08 notes: Data stream across Canteen crossing
      const u = smootherstep(24.30, 25.55, time);
      position.set(THREE.MathUtils.lerp(5.5, -1.5, u), 7.5, 6.5);
      target.set(1.0, 2.4, -5.0);
      fov = 40;
    } else if (time < 26.75) {
      // 06/08 drones: 70-drone formation locking in above HUS lawn
      const u = smootherstep(25.55, 26.75, time);
      position.set(10.4 + (1 - u) * 4.0, 12.0 + u * 2.5, 26.0 - u * 3.0);
      target.set(10.4, 14.5, -4.2);
      fov = 42;
    } else if (time < 27.80) {
      // 07/08 captions: USSH Building E emerald beacon & archival frames
      const u = smootherstep(26.75, 27.80, time);
      position.set(THREE.MathUtils.lerp(-9.5, -6.5, u), 7.2, 9.5);
      target.set(-5.1, 3.2, -1.0);
      fov = 39;
    } else {
      // 08/08 bursts (27.80 - 31.00s): Orbiting toward HUS T3 server & central core
      const u = smootherstep(27.80, 31.00, time);
      position.set(THREE.MathUtils.lerp(14.0, 8.5, u), THREE.MathUtils.lerp(13.0, 9.5, u), THREE.MathUtils.lerp(24.0, 16.5, u));
      target.set(8.5, 4.5, -5.5);
      fov = 38;
    }
    return { position, target, fov, roll };
  }

  // SCENE 05 — CHỌN ĐẠI (31.00 - 35.00s): Dramatic push-in + click shake at 32.75s
  if (time < 35.00) {
    const u = smootherstep(31.00, 35.00, time);
    position.set(8.5 - u * 1.5, 9.5 - u * 1.2, 16.5 - u * 4.2);
    target.set(8.8, 4.8, -4.5);
    fov = THREE.MathUtils.lerp(38, 33, u);
    if (time >= 32.75 && time < 33.65) {
      const age = time - 32.75;
      const shake = Math.exp(-age * 5.5) * 0.22;
      position.x += Math.sin(age * 48) * shake;
      position.y += Math.cos(age * 41) * shake * 0.7;
      roll = Math.sin(age * 36) * shake * 0.08;
    }
    return { position, target, fov, roll };
  }

  // SCENE 06 — CHẠY MÔ PHỎNG (35.00 - 38.00s): Wide two-campus convergence view
  if (time < 38.00) {
    const u = smootherstep(35.00, 38.00, time);
    position.set(THREE.MathUtils.lerp(4.0, 0.5, u), THREE.MathUtils.lerp(20.0, 23.5, u), THREE.MathUtils.lerp(46.0, 54.0, u));
    target.set(0.5, THREE.MathUtils.lerp(4.5, 5.5, u), -4.0);
    fov = 43;
    return { position, target, fov, roll: 0 };
  }

  // SCENE 07 — SỰ CỐ E2 (38.00 - 46.00s): Wide two-campus shot + tilt-up as HUS then USSH fly up!
  if (time < 46.00) {
    const u = smootherstep(38.00, 46.00, time);
    // Keep wide enough that both USSH (x ~ -13..-5) and HUS (x ~ +4..+18) are clearly inside frame
    const angle = (u - 0.5) * 0.24;
    const dist = THREE.MathUtils.lerp(54.0, 62.0, u);
    position.set(Math.sin(angle) * dist, THREE.MathUtils.lerp(22.0, 27.5, u), Math.cos(angle) * dist);
    // Tilt up smoothly as HUS (38.1s) and USSH (41.2s) float into the sky
    const lookY = THREE.MathUtils.lerp(5.2, 12.8, smoothstep(38.2, 45.2, time));
    const lookX = THREE.MathUtils.lerp(3.2, -0.5, smoothstep(40.5, 44.0, time));
    target.set(lookX, lookY, -4.5);
    fov = 44;

    // Gentle, short camera shake on HUS liftoff (38.0s) and USSH liftoff (41.2s)
    if (time >= 38.00 && time < 39.10) {
      const age = time - 38.00;
      const strength = 0.28 * Math.exp(-age * 3.8);
      position.x += Math.sin(age * 16) * strength;
      position.y += Math.sin(age * 13) * strength * 0.55;
    } else if (time >= 41.15 && time < 42.10) {
      const age = time - 41.15;
      const strength = 0.22 * Math.exp(-age * 4.2);
      position.x += Math.sin(age * 15) * strength;
      position.y += Math.cos(age * 12) * strength * 0.5;
    }
    return { position, target, fov, roll: 0 };
  }

  // SCENE 08 — BÌNH TĨNH (46.00 - 49.80s): Freeze frame (46.0-47.35s) then smooth rewind pull-back
  if (time < 49.80) {
    if (time < 47.35) {
      // Freeze-frame camera with ultra-slow matrix drift
      const u = (time - 46.00) / 1.35;
      position.set(7.4 + u * 0.6, 27.5, 61.5);
      target.set(-0.5, 12.8, -4.5);
      fov = 44;
      return { position, target, fov, roll: 0 };
    }
    const rw = smootherstep(47.35, 49.60, time);
    position.set(THREE.MathUtils.lerp(8.0, 2.0, rw), THREE.MathUtils.lerp(27.5, 19.0, rw), THREE.MathUtils.lerp(61.5, 48.0, rw));
    target.set(THREE.MathUtils.lerp(-0.5, 2.0, rw), THREE.MathUtils.lerp(12.8, 6.5, rw), -4.2);
    fov = THREE.MathUtils.lerp(44, 42, rw);
    return { position, target, fov, roll: 0 };
  }

  // SCENE 09 — THÔNG BÁO SỰ KIỆN (49.80 - 55.65s): Majestic crane sweep showing E3 Bridge + E1 Fireworks + 70 Drones
  const u9 = smootherstep(49.80, 55.65, time);
  position.set(THREE.MathUtils.lerp(2.0, -3.5, u9), THREE.MathUtils.lerp(18.5, 16.5, u9), THREE.MathUtils.lerp(48.0, 44.5, u9));
  target.set(THREE.MathUtils.lerp(2.5, 1.5, u9), THREE.MathUtils.lerp(7.5, 9.2, u9), -4.0);
  fov = 42;
  return { position, target, fov, roll: 0 };
}
