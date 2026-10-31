/** Player settings (GDD 8.1), saved with a schema version. */

import { Store } from "../core/storage";

export interface Settings {
  sfxVolume: number;
  mute: boolean;
  textSize: "100" | "115" | "130";
  colorblind: boolean;
  reduceMotion: "system" | "on" | "off";
  reduceLights: boolean;
  lowGraphics: boolean;
  assist: boolean;
  achievementToasts: boolean;
  nickname: string;
  /** Rung nhẹ trên điện thoại khi xong việc. */
  haptics: boolean;
  /** Tự bật đồ họa thấp khi máy chạy chậm. */
  autoQuality: boolean;
}

export const settings = new Store<Settings>({
  key: "hoitu70:settings",
  version: 1,
  defaults: () => ({
    sfxVolume: 0.6,
    mute: false,
    textSize: "100",
    colorblind: false,
    reduceMotion: "system",
    reduceLights: false,
    lowGraphics: false,
    assist: false,
    achievementToasts: true,
    nickname: "",
    haptics: true,
    autoQuality: true,
  }),
  validate: (s) => ({ ...s, sfxVolume: Math.min(1, Math.max(0, Number(s.sfxVolume) || 0)) }),
});

export function reducedMotion() {
  const m = settings.get().reduceMotion;
  if (m === "on") return true;
  if (m === "off") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
