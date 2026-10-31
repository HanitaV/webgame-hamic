/** Glue between progress/settings and the scene, CSS and audio. */

import { setAudio, setHaptics } from "../core/audio";
import { DATA } from "../core/data";
import { P } from "../game/progress";
import { reducedMotion, settings } from "../game/settings";
import { setLit, setStoryTime, setWorldOptions } from "../scene/world";
import { storyProgress } from "../game/story";
import { storyTime } from "../puzzles/logic/story";
import { setGlow } from "./widgets";

export function refreshWorld() {
  if (!DATA) return;
  const lit = new Set([...P.get().lit, ...P.get().casualLit]);
  setLit(DATA.circuits.map((c) => lit.has(c.id)));
  setStoryTime(storyTime(DATA.story, storyProgress.get()));
}

export function applySettings() {
  const s = settings.get();
  const root = document.documentElement;
  root.style.setProperty("--text-scale", String(Number(s.textSize) / 100));
  root.classList.toggle("reduce-motion", reducedMotion());
  root.classList.toggle("reduce-lights", s.reduceLights);
  root.classList.toggle("colorblind", s.colorblind);
  setAudio(s.sfxVolume, s.mute);
  setHaptics(s.haptics);
  setGlow(!s.reduceLights);
  setWorldOptions({ low: s.lowGraphics, reduceLights: s.reduceLights, reduceMotion: reducedMotion() });
}
