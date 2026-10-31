/**
 * Hamic Trailer V3 — Source-Audio Timeline, Easing & Phrase Caption Data
 * ==========================================================================
 * Source frames span 60.667s. Animation frames address the original 59s
 * choreography via storyboardFrame(); captions stay in source audio time.
 * Applies:
 * - `short-form-video`: Frame-0 hook, uneven pattern-interrupt cut schedule, loop seam.
 * - `caption-animation`: Phrase cues at source pauses, without invented word timing.
 * - `countdown-video`: Frame-derived 3->2->1 countdown state without timer drift.
 * - `motion-design`: Energetic x Playful spring physics, anticipation, follow-through.
 */

import wordsData from "./words-data.json";

export const FPS = 30;
export const DURATION_SEC = wordsData.durationSec;
export const TOTAL_FRAMES = wordsData.totalFrames;

/** Map source voice time to the original choreography, shared by all visuals. */
export function storyboardFrame(sourceFrame: number): number {
  const t = sourceFrame / FPS;
  const anchors = wordsData.anchors;
  for (let i = 1; i < anchors.length; i++) {
    const [end, visualEnd] = anchors[i];
    const [start, visualStart] = anchors[i - 1];
    if (t <= end) return (visualStart + (visualEnd - visualStart) *
      Math.max(0, (t - start) / (end - start))) * FPS;
  }
  return 59 * FPS - 1;
}

export type AspectMode = "9x16" | "16x9";
export type RenderOverlayMode = "burned" | "clean";

export interface WordToken {
  text: string;
  startMs: number;
  endMs: number;
  clauseId: number;
  section: string;
}

export interface CaptionPage {
  pageIndex: number;
  clauseId: number;
  section: string;
  text: string;
  startMs: number;
  endMs: number;
  tokens: WordToken[];
}

export const WORD_TOKENS: WordToken[] = wordsData.tokens as WordToken[];
export const CAPTION_PAGES: CaptionPage[] = wordsData.pages as CaptionPage[];

export type ShotId =
  | "S01_HOOK_HUS_LIFT"
  | "S02_HOOK_USSH_DRONE"
  | "S03_REWIND_GLITCH_LED"
  | "S04_GLITCH_FILES_MIRROR_NOTE"
  | "S05_DECISION_01_02"
  | "S06_DECISION_03_04"
  | "S07_DECISION_05_06"
  | "S08_DECISION_07_08_CALM"
  | "S09_MISCLICK_BUTTON"
  | "S10_COUNTDOWN_3_2_1"
  | "S11_DISASTER_GROUND_HUS"
  | "S12_DISASTER_USSH_DRONE"
  | "S13_DISASTER_WIDE_HERO"
  | "S14_RELIEF_ROLLBACK"
  | "S15_EVENT_REVEAL_P1"
  | "S16_EVENT_REVEAL_P2"
  | "S17_CTA_CHOICE_LOOP";

export interface ShotSpec {
  id: ShotId;
  section:
    | "cold_open"
    | "rewind_glitches"
    | "speedrun_8"
    | "misclick_countdown"
    | "disaster_launch"
    | "relief_rollback"
    | "event_reveal_cta";
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export const SHOTS: ShotSpec[] = [
  { id: "S01_HOOK_HUS_LIFT", section: "cold_open", startSec: 0.0, endSec: 3.1, startFrame: 0, endFrame: 93 },
  { id: "S02_HOOK_USSH_DRONE", section: "cold_open", startSec: 3.1, endSec: 6.3, startFrame: 93, endFrame: 189 },
  { id: "S03_REWIND_GLITCH_LED", section: "rewind_glitches", startSec: 6.3, endSec: 9.65, startFrame: 189, endFrame: 290 },
  { id: "S04_GLITCH_FILES_MIRROR_NOTE", section: "rewind_glitches", startSec: 9.65, endSec: 13.0, startFrame: 290, endFrame: 390 },
  { id: "S05_DECISION_01_02", section: "speedrun_8", startSec: 13.0, endSec: 16.4, startFrame: 390, endFrame: 492 },
  { id: "S06_DECISION_03_04", section: "speedrun_8", startSec: 16.4, endSec: 19.8, startFrame: 492, endFrame: 594 },
  { id: "S07_DECISION_05_06", section: "speedrun_8", startSec: 19.8, endSec: 22.2, startFrame: 594, endFrame: 666 },
  { id: "S08_DECISION_07_08_CALM", section: "speedrun_8", startSec: 22.2, endSec: 27.1, startFrame: 666, endFrame: 813 },
  { id: "S09_MISCLICK_BUTTON", section: "misclick_countdown", startSec: 27.1, endSec: 30.13, startFrame: 813, endFrame: 904 },
  { id: "S10_COUNTDOWN_3_2_1", section: "misclick_countdown", startSec: 30.13, endSec: 33.0, startFrame: 904, endFrame: 990 },
  { id: "S11_DISASTER_GROUND_HUS", section: "disaster_launch", startSec: 33.0, endSec: 37.1, startFrame: 990, endFrame: 1113 },
  { id: "S12_DISASTER_USSH_DRONE", section: "disaster_launch", startSec: 37.1, endSec: 39.6, startFrame: 1113, endFrame: 1188 },
  { id: "S13_DISASTER_WIDE_HERO", section: "disaster_launch", startSec: 39.6, endSec: 43.0, startFrame: 1188, endFrame: 1290 },
  { id: "S14_RELIEF_ROLLBACK", section: "relief_rollback", startSec: 43.0, endSec: 46.5, startFrame: 1290, endFrame: 1395 },
  { id: "S15_EVENT_REVEAL_P1", section: "event_reveal_cta", startSec: 46.5, endSec: 49.8, startFrame: 1395, endFrame: 1494 },
  { id: "S16_EVENT_REVEAL_P2", section: "event_reveal_cta", startSec: 49.8, endSec: 53.9, startFrame: 1494, endFrame: 1617 },
  { id: "S17_CTA_CHOICE_LOOP", section: "event_reveal_cta", startSec: 53.9, endSec: 59.0, startFrame: 1617, endFrame: 1770 },
];

export function findShot(frame: number): { shot: ShotSpec; localProgress: number; localSec: number } {
  const clamped = Math.max(0, Math.min(1770 - 1, frame));
  const t = clamped / FPS;
  for (const s of SHOTS) {
    if (t >= s.startSec && t < s.endSec) {
      const dur = Math.max(0.001, s.endSec - s.startSec);
      return {
        shot: s,
        localSec: t - s.startSec,
        localProgress: clamp01((t - s.startSec) / dur),
      };
    }
  }
  const last = SHOTS[SHOTS.length - 1];
  return { shot: last, localSec: t - last.startSec, localProgress: 1.0 };
}

// --- Pure Easing & Spring Primitives (`motion-design` skill) ---

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function rangeProgress(t: number, start: number, end: number): number {
  if (end <= start) return t >= end ? 1 : 0;
  return clamp01((t - start) / (end - start));
}

export function easeOutCubic(t: number): number {
  const p = clamp01(t);
  return 1 - Math.pow(1 - p, 3);
}

export function easeInCubic(t: number): number {
  const p = clamp01(t);
  return p * p * p;
}

export function easeInOutCubic(t: number): number {
  const p = clamp01(t);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function easeOutQuint(t: number): number {
  const p = clamp01(t);
  return 1 - Math.pow(1 - p, 5);
}

/**
 * Heavy stone building lift curve (`motion-design` skill):
 * Slow ponderous inertia at liftoff -> strong upward surge -> gentle airborne hover deceleration.
 * Never overshoots by 20% like a light UI card.
 */
export function heavyStoneLift(t: number): number {
  const p = clamp01(t);
  return p * p * (3 - 2 * p) * (1 - 0.12 * Math.sin(p * Math.PI));
}

/**
 * Playful UI / light-prop spring (`motion-design` & `caption-animation` skills):
 * Underdamped analytical spring response for `deltaSec >= 0`.
 */
export function springPop(deltaSec: number, stiffness = 210, damping = 13, mass = 0.65): number {
  if (deltaSec <= 0) return 0;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const env = Math.exp(-zeta * omega0 * deltaSec);
    return 1 - env * (Math.cos(omegaD * deltaSec) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * deltaSec));
  }
  return 1 - Math.exp(-omega0 * deltaSec) * (1 + omega0 * deltaSec);
}

export interface CountdownStepInfo {
  active: boolean;
  digit: "3" | "2" | "1" | "GO";
  prevDigit: "4" | "3" | "2" | "1";
  stepProgress: number;
  flipProgress: number;
  targetName: string;
  targetSub: string;
  accentColor: string;
}

/**
 * Frame-derived deterministic 3->2->1 countdown (`countdown-video` skill).
 * Paired to 3 distinct physical 3D objects:
 * - 3 (30.13s - 31.08s): HUS Core (`G_HUS_T1` / `G_HUS_T3`)
 * - 2 (31.08s - 32.02s): USSH Block E (`G_USSH_E`)
 * - 1 (32.02s - 32.72s): T3 Central Stage Console
 * - GO (32.72s - 33.00s): Full Campus Ignition
 */
export function getCountdownState(frame: number): CountdownStepInfo | null {
  const t = frame / FPS;
  if (t < 30.10 || t >= 33.00) return null;

  if (t < 31.08) {
    const p = rangeProgress(t, 30.10, 31.08);
    return {
      active: true,
      digit: "3",
      prevDigit: "4",
      stepProgress: p,
      flipProgress: easeOutCubic( clamp01(p / 0.32) ),
      targetName: "KHỐI NHÀ HUS (T1 · T3)",
      targetSub: "NẠP XUNG LỰC NỀN MÓNG",
      accentColor: "#38bdf8",
    };
  }
  if (t < 32.02) {
    const p = rangeProgress(t, 31.08, 32.02);
    return {
      active: true,
      digit: "2",
      prevDigit: "3",
      stepProgress: p,
      flipProgress: easeOutCubic( clamp01(p / 0.32) ),
      targetName: "KHỐI NHÀ USSH (NHÀ E · B)",
      targetSub: "KHÓA CỘNG HƯỞNG TỪ TRƯỜNG",
      accentColor: "#f472b6",
    };
  }
  if (t < 32.72) {
    const p = rangeProgress(t, 32.02, 32.72);
    return {
      active: true,
      digit: "1",
      prevDigit: "2",
      stepProgress: p,
      flipProgress: easeOutCubic( clamp01(p / 0.32) ),
      targetName: "BÀN ĐIỀU KHIỂN TRUNG TÂM",
      targetSub: "LỰC ĐẨY VƯỢT NGƯỠNG 9999%",
      accentColor: "#ffd25e",
    };
  }
  const p = rangeProgress(t, 32.72, 33.00);
  return {
    active: true,
    digit: "GO",
    prevDigit: "1",
    stepProgress: p,
    flipProgress: easeOutCubic( clamp01(p / 0.45) ),
    targetName: "KÍCH HOẠT PHÓNG!",
    targetSub: "MÔ PHỎNG VẬT LÝ QUÁ TẢI",
    accentColor: "#fb7185",
  };
}

