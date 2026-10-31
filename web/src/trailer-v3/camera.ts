/**
 * Hamic Trailer V3 — Directed Camera Choreography (9:16 Master & 16:9 Companion)
 * ==============================================================================
 * World coordinate system (`map.scale = 0.1`):
 * - HUS T1 (`G_HUS_T1`):   (10.43, 1.6,  4.70)
 * - HUS T3 (`G_HUS_T3`):   ( 6.30, 2.0, -8.72)
 * - HUS Lawn / Core:       (10.41, 0.0, -4.22)
 * - Central Stage:         ( 2.50, 0.02, -3.80), scale = 0.22
 *   - LED #6:              ( 4.22, 0.85, -5.34)
 *   - File Slabs:          ( 2.50, 0.95, -3.36)
 *   - Mirror & Laser:      ( 2.40, 0.90, -4.13)
 *   - _ghichu Note:        ( 2.50, 0.95, -3.47)
 *   - Parabola Curve:      ( 2.50, 1.65, -4.24)
 *   - Shortest-Path Graph: ( 2.50, 0.25, -2.81)
 *   - [THÊM PHÁO] Button:  ( 2.50, 0.86, -3.10)
 * - USSH E (`G_USSH_E`):   (-5.10, 2.0,  0.49)
 * - USSH C (`G_USSH_C`):   (-13.78, 1.8, 0.48)
 * - USSH B (`G_USSH_B`):   (-21.43, 1.8, 0.48)
 */

import * as THREE from "three";
import {
  AspectMode,
  FPS,
   easeInOutCubic,
  easeOutCubic,
  lerp,
  rangeProgress,
} from "./timeline";

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  roll: number;
}

const FRAME0_POS = new THREE.Vector3(18.6, 5.8, 17.5);
const FRAME0_TARGET = new THREE.Vector3(8.6, 2.2, -1.2);

function lerpVec(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  return new THREE.Vector3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
}

function addBlastShake(pos: THREE.Vector3, target: THREE.Vector3, t: number, t0: number, amp: number): void {
  const dt = t - t0;
  if (dt < 0 || dt > 1.8) return;
  const k = amp * Math.exp(-dt * 2.2);
  const sx = Math.sin(dt * 44) * k;
  const sy = Math.cos(dt * 37) * k * 0.85;
  const sz = Math.sin(dt * 31 + 1.1) * k * 0.6;
  pos.x += sx;
  pos.y += sy;
  pos.z += sz;
  target.x += sx * 0.45;
  target.y += sy * 0.45;
}

export function computeDirectedCamera(frame: number, aspectMode: AspectMode): CameraPose {
  const t = frame / FPS;
  const pos = new THREE.Vector3();
  const target = new THREE.Vector3();
  let fov = aspectMode === "9x16" ? 46 : 38;
  let roll = 0;

  if (t < 3.1) {
    // S01_HOOK_HUS_LIFT: Hero view of HUS campus shattering into thousands of voxel blocks & shockwave!
    const u = easeOutCubic(rangeProgress(t, 0.0, 3.1));
    pos.copy(lerpVec(FRAME0_POS, new THREE.Vector3(21.2, 8.2, 20.5), u));
    target.copy(lerpVec(FRAME0_TARGET, new THREE.Vector3(8.2, 2.8, -1.6), u));
    addBlastShake(pos, target, t, 0.0, 0.28);
    fov = aspectMode === "9x16" ? 48 : 38;
    roll = -0.025 * Math.sin(t * 3.4);
  } else if (t < 6.3) {
    // S02_HOOK_USSH_DRONE: Chase FPV following banking drone toward exploding USSH campus, then rewind whip
    if (t < 5.65) {
      const u = easeInOutCubic(rangeProgress(t, 3.1, 5.65));
      pos.copy(lerpVec(new THREE.Vector3(-1.2, 5.8, 15.8), new THREE.Vector3(-4.5, 8.4, 19.2), u));
      target.copy(lerpVec(new THREE.Vector3(-8.8, 2.2, -0.4), new THREE.Vector3(-10.2, 2.8, -0.8), u));
      addBlastShake(pos, target, t, 3.1, 0.32);
      fov = aspectMode === "9x16" ? 50 : 40;
      roll = 0.048 * Math.sin(t * 4.5);
    } else {
      // Fast visual rewind whip into Central Stage (2.5, 0.85, 14.2)
      const rw = easeInOutCubic(rangeProgress(t, 5.65, 6.3));
      pos.copy(lerpVec(new THREE.Vector3(-4.5, 8.4, 19.2), new THREE.Vector3(2.8, 1.35, 18.4), rw));
      target.copy(lerpVec(new THREE.Vector3(-10.2, 2.8, -0.8), new THREE.Vector3(2.8, 0.9, 13.8), rw));
      fov = aspectMode === "9x16" ? 45 : 36;
      roll = (1 - rw) * 0.10;
    }
  } else if (t < 9.65) {
    // S03_REWIND_GLITCH_LED: Close-up on the stage LED arc, zooming in on out-of-phase LED #6 at (4.22, 0.85, 12.66)
    const u = easeInOutCubic(rangeProgress(t, 6.3, 9.65));
    pos.copy(lerpVec(new THREE.Vector3(2.8, 1.35, 18.4), new THREE.Vector3(4.6, 1.15, 16.1), u));
    target.copy(lerpVec(new THREE.Vector3(2.8, 0.9, 13.8), new THREE.Vector3(3.9, 0.95, 12.7), u));
    fov = aspectMode === "9x16" ? 42 : 34;
  } else if (t < 13.0) {
    // S04_GLITCH_FILES_MIRROR_NOTE: 3 punchy macro sub-angles on physical glitches 2, 3, 4
    if (t < 10.65) {
      // Glitch 2: Colliding duplicate 3D file slabs at (2.5, 0.95, 14.86)
      const u = easeOutCubic(rangeProgress(t, 9.65, 10.65));
      pos.copy(lerpVec(new THREE.Vector3(2.1, 1.22, 19.6), new THREE.Vector3(2.5, 1.15, 19.25), u));
      target.set(2.5, 0.95, 14.86);
      fov = aspectMode === "9x16" ? 42 : 34;
    } else if (t < 11.35) {
      // Glitch 3: Reversed 3D mirror shooting red laser off-target at (2.3, 0.85, 13.87)
      const u = easeOutCubic(rangeProgress(t, 10.65, 11.35));
      pos.copy(lerpVec(new THREE.Vector3(0.8, 1.35, 17.4), new THREE.Vector3(1.6, 1.22, 17.2), u));
      target.set(2.3, 0.85, 13.87);
      fov = aspectMode === "9x16" ? 42 : 34;
    } else {
      // Glitch 4: Dissolving yellow _ghichu 3D note at (2.5, 0.95, 14.53)
      const u = easeOutCubic(rangeProgress(t, 11.35, 13.0));
      pos.copy(lerpVec(new THREE.Vector3(2.5, 1.05, 17.6), new THREE.Vector3(3.1, 1.35, 17.9), u));
      target.set(2.5, 1.0 + u * 0.28, 14.53);
      fov = aspectMode === "9x16" ? 40 : 32;
    }
  } else if (t < 16.4) {
    // S05_DECISION_01_02: 01/08 LED series sync (13.0-15.0s) -> 02/08 2x2 Matrix rotates mirror (15.0-16.4s)
    if (t < 15.0) {
      const u = easeInOutCubic(rangeProgress(t, 13.0, 15.0));
      pos.copy(lerpVec(new THREE.Vector3(0.6, 1.4, 18.5), new THREE.Vector3(4.2, 1.3, 18.3), u));
      target.set(2.5, 0.95, 13.8);
      fov = aspectMode === "9x16" ? 44 : 36;
    } else {
      const u = easeInOutCubic(rangeProgress(t, 15.0, 16.4));
      pos.copy(lerpVec(new THREE.Vector3(1.2, 1.25, 17.4), new THREE.Vector3(2.8, 1.25, 17.6), u));
      target.copy(lerpVec(new THREE.Vector3(1.8, 0.9, 13.9), new THREE.Vector3(3.2, 1.05, 13.9), u));
      fov = aspectMode === "9x16" ? 42 : 34;
    }
  } else if (t < 19.8) {
    // S06_DECISION_03_04: 03/08 Derivative parabola curve (16.4-18.2s) -> 04/08 Shortest-path graph (18.2-19.8s)
    if (t < 18.2) {
      const u = easeInOutCubic(rangeProgress(t, 16.4, 18.2));
      pos.copy(lerpVec(new THREE.Vector3(1.2, 1.4, 19.2), new THREE.Vector3(3.6, 2.1, 19.4), u));
      target.copy(lerpVec(new THREE.Vector3(1.8, 1.6, 13.8), new THREE.Vector3(3.2, 2.6, 13.8), u));
      fov = aspectMode === "9x16" ? 46 : 36;
    } else {
      const u = easeInOutCubic(rangeProgress(t, 18.2, 19.8));
      pos.copy(lerpVec(new THREE.Vector3(1.4, 2.8, 18.6), new THREE.Vector3(3.6, 2.5, 18.4), u));
      target.set(2.5, 0.35, 15.2);
      fov = aspectMode === "9x16" ? 44 : 35;
    }
  } else if (t < 22.2) {
    // S07_DECISION_05_06: 05/08 SHA-256 hash lock (19.8-21.0s) -> 06/08 _ghichu light bridge (21.0-22.2s)
    if (t < 21.0) {
      const u = easeOutCubic(rangeProgress(t, 19.8, 21.0));
      pos.copy(lerpVec(new THREE.Vector3(2.8, 1.18, 19.3), new THREE.Vector3(2.5, 1.12, 19.0), u));
      target.set(2.5, 0.95, 14.86);
      fov = aspectMode === "9x16" ? 42 : 34;
    } else {
      const u = easeInOutCubic(rangeProgress(t, 21.0, 22.2));
      pos.copy(lerpVec(new THREE.Vector3(2.5, 1.8, 16.5), new THREE.Vector3(2.5, 2.6, 15.2), u));
      target.copy(lerpVec(new THREE.Vector3(4.5, 2.8, 1.5), new THREE.Vector3(1.5, 4.2, 1.5), u));
      fov = aspectMode === "9x16" ? 48 : 38;
    }
  } else if (t < 27.1) {
    // S08_DECISION_07_08_CALM: 07/08 70-drone formation (22.2-23.8s) -> 08/08 photo match (23.8-25.2s) -> Calm beat (25.2-27.1s)
    if (t < 23.8) {
      const u = easeInOutCubic(rangeProgress(t, 22.2, 23.8));
      pos.copy(lerpVec(new THREE.Vector3(4.2, 2.2, 14.5), new THREE.Vector3(1.2, 2.5, 15.2), u));
      target.set(2.5, 6.2, -4.2);
      fov = aspectMode === "9x16" ? 48 : 38;
    } else if (t < 25.2) {
      const u = easeOutCubic(rangeProgress(t, 23.8, 25.2));
      pos.copy(lerpVec(new THREE.Vector3(1.5, 1.2, 18.2), new THREE.Vector3(2.5, 1.15, 17.9), u));
      target.set(2.5, 0.95, 14.68);
      fov = aspectMode === "9x16" ? 42 : 34;
    } else {
      // Calm apparent-success beat (25.2 - 27.1s): harmonious wide stage + campus vista
      const u = easeInOutCubic(rangeProgress(t, 25.2, 27.1));
      pos.copy(lerpVec(new THREE.Vector3(5.5, 2.6, 20.5), new THREE.Vector3(3.8, 2.2, 19.2), u));
      target.set(2.5, 1.8, 8.2);
      fov = aspectMode === "9x16" ? 46 : 36;
    }
  } else if (t < 30.13) {
    // S09_MISCLICK_BUTTON: Macro close-up on physical 3D [THÊM PHÁO] button pedestal & 3D cursor finger at (2.5, 0.86, 14.90)!
    const u = easeInOutCubic(rangeProgress(t, 27.1, 29.75));
    pos.copy(lerpVec(new THREE.Vector3(3.8, 1.65, 17.8), new THREE.Vector3(3.15, 1.32, 17.05), u));
    target.set(2.5, 0.88, 14.90);
    fov = aspectMode === "9x16" ? 38 : 30;
  } else if (t < 33.0) {
    // S10_COUNTDOWN_3_2_1: 3 physical object cuts paired to 3 -> 2 -> 1!
    if (t < 31.08) {
      // 3: HUS Core (G_HUS_T1 at 10.43, 1.6, 4.70)
      const u = easeOutCubic(rangeProgress(t, 30.13, 31.08));
      pos.copy(lerpVec(new THREE.Vector3(16.2, 1.3, 10.8), new THREE.Vector3(14.8, 1.45, 9.6), u));
      target.set(10.4, 1.8, 4.2);
      fov = aspectMode === "9x16" ? 44 : 35;
    } else if (t < 32.02) {
      // 2: USSH Block E (G_USSH_E at -5.10, 2.0, 0.49)
      const u = easeOutCubic(rangeProgress(t, 31.08, 32.02));
      pos.copy(lerpVec(new THREE.Vector3(-0.8, 1.3, 6.8), new THREE.Vector3(-2.2, 1.45, 5.8), u));
      target.set(-5.1, 1.8, 0.5);
      fov = aspectMode === "9x16" ? 44 : 35;
    } else {
      // 1 & GO: Central Stage Console & Button at (2.5, 0.86, 14.90)
      const u = easeOutCubic(rangeProgress(t, 32.02, 33.0));
      pos.copy(lerpVec(new THREE.Vector3(2.5, 1.35, 17.4), new THREE.Vector3(2.5, 1.18, 16.95), u));
      target.set(2.5, 0.86, 14.90);
      fov = aspectMode === "9x16" ? 38 : 30;
    }
  } else if (t < 37.1) {
    // S11_DISASTER_GROUND_HUS:
    // Setup 1 (33.0-35.0s): Ground-level tremor & jelly wobble at HUS T1 base
    // Setup 2 (35.0-37.1s): Hero pullback as HUS explodes FIRST into voxel blocks & shockwave!
    if (t < 35.0) {
      const u = easeInOutCubic(rangeProgress(t, 33.0, 35.0));
      pos.copy(lerpVec(new THREE.Vector3(15.2, 1.25, 11.2), new THREE.Vector3(17.8, 4.2, 15.6), u));
      target.copy(lerpVec(new THREE.Vector3(10.2, 1.2, 3.8), new THREE.Vector3(8.8, 2.0, -0.8), u));
      pos.x += Math.sin(t * 42) * 0.08;
      pos.y += Math.cos(t * 38) * 0.06;
      fov = aspectMode === "9x16" ? 46 : 36;
    } else {
      const u = easeOutCubic(rangeProgress(t, 35.0, 37.1));
      pos.copy(lerpVec(new THREE.Vector3(17.8, 4.8, 16.0), new THREE.Vector3(21.6, 8.8, 21.0), u));
      target.copy(lerpVec(new THREE.Vector3(8.8, 2.2, -1.0), new THREE.Vector3(8.2, 2.8, -1.8), u));
      addBlastShake(pos, target, t, 35.0, 0.42);
      fov = aspectMode === "9x16" ? 50 : 40;
      roll = -0.032 * u;
    }
  } else if (t < 39.6) {
    // S12_DISASTER_USSH_DRONE (Setup 3):
    // Chase FPV as USSH explodes SECOND after clear lag and hero drone dives through the flying voxel debris!
    const u = easeInOutCubic(rangeProgress(t, 37.1, 39.6));
    pos.copy(lerpVec(new THREE.Vector3(-0.8, 5.2, 15.2), new THREE.Vector3(-4.8, 8.6, 19.6), u));
    target.copy(lerpVec(new THREE.Vector3(-8.5, 2.0, -0.2), new THREE.Vector3(-10.2, 2.8, -0.8), u));
    addBlastShake(pos, target, t, 37.15, 0.48);
    fov = aspectMode === "9x16" ? 52 : 41;
    roll = 0.052 * Math.sin(u * Math.PI);
  } else if (t < 43.0) {
    // S13_DISASTER_WIDE_HERO (Setup 4):
    // Wide hero shot showing BOTH HUS (right) and USSH (left) exploding with mushroom clouds, craters & voxel debris!
    const u = easeInOutCubic(rangeProgress(t, 39.6, 43.0));
    pos.copy(lerpVec(new THREE.Vector3(0.5, 11.5, 26.5), new THREE.Vector3(0.0, 14.2, 30.5), u));
    target.copy(lerpVec(new THREE.Vector3(-0.5, 2.4, -1.2), new THREE.Vector3(-0.8, 2.6, -1.6), u));
    addBlastShake(pos, target, t, 39.6, 0.32);
    fov = aspectMode === "9x16" ? 54 : 44;
  } else if (t < 46.5) {
    // S14_RELIEF_ROLLBACK: Freeze punchline (43.0-43.7s) then smooth rollback restore (43.7-46.5s)
    const u = easeInOutCubic(rangeProgress(t, 43.7, 45.4));
    pos.copy(lerpVec(new THREE.Vector3(0.0, 14.2, 30.5), new THREE.Vector3(6.5, 3.0, 14.5), u));
    target.copy(lerpVec(new THREE.Vector3(-0.8, 2.6, -1.6), new THREE.Vector3(3.2, 2.2, -2.5), u));
    fov = aspectMode === "9x16" ? 48 : 38;
  } else if (t < 49.8) {
    // S15_EVENT_REVEAL_P1: Celebratory campus night orbit + fireworks + Phase 1 card (01/11 announcement)
    const u = easeInOutCubic(rangeProgress(t, 46.5, 49.8));
    pos.copy(lerpVec(new THREE.Vector3(6.5, 3.0, 14.5), new THREE.Vector3(10.5, 3.6, 13.0), u));
    target.copy(lerpVec(new THREE.Vector3(3.2, 3.4, -2.5), new THREE.Vector3(4.5, 4.2, -3.0), u));
    fov = aspectMode === "9x16" ? 46 : 36;
  } else if (t < 53.9) {
    // S16_EVENT_REVEAL_P2: Glide toward HUS Courtyard Booth & Stage (Gian hàng Hamic · Chào tân HUS · Nguyễn Trãi)
    const u = easeInOutCubic(rangeProgress(t, 49.8, 53.9));
    pos.copy(lerpVec(new THREE.Vector3(10.5, 3.6, 13.0), new THREE.Vector3(12.8, 2.6, 10.5), u));
    target.copy(lerpVec(new THREE.Vector3(4.5, 4.2, -3.0), new THREE.Vector3(7.5, 2.8, -1.5), u));
    fov = aspectMode === "9x16" ? 45 : 36;
  } else {
    // S17_CTA_CHOICE_LOOP:
    // 53.9 - 58.15s: Dual-campus choice framing
    // 58.15 - 59.00s: Seamless match-cut transition into exact FRAME0_POS & FRAME0_TARGET!
    if (t < 58.15) {
      const u = easeInOutCubic(rangeProgress(t, 53.9, 58.15));
      pos.copy(lerpVec(new THREE.Vector3(12.8, 2.6, 10.5), new THREE.Vector3(15.2, 2.0, 12.2), u));
      target.copy(lerpVec(new THREE.Vector3(7.5, 2.8, -1.5), new THREE.Vector3(8.8, 3.0, 1.2), u));
      fov = aspectMode === "9x16" ? 46 : 36;
    } else {
      const lp = easeInOutCubic(rangeProgress(t, 58.15, 59.0));
      pos.copy(lerpVec(new THREE.Vector3(15.2, 2.0, 12.2), FRAME0_POS, lp));
      target.copy(lerpVec(new THREE.Vector3(8.8, 3.0, 1.2), FRAME0_TARGET, lp));
      fov = aspectMode === "9x16" ? 46 : 36;
      roll = 0;
    }
  }

  return { position: pos, target, fov, roll };
}
