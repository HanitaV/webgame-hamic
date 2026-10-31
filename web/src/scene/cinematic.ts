import { DATA } from "../core/data";
import { reducedMotion, settings } from "../game/settings";
import type { EndingId } from "../puzzles/logic/story";
import { setVideoBackground } from "./world";
import { createEndingSound } from "../core/ending-audio";

export interface CinematicPlayback {
  /** false means the caller should use the real-time scene instead. */
  finished: Promise<boolean>;
  skip(): void;
  dispose(): void;
}

/** Native decoding, presented as scenery. No video controls, fullscreen or play overlay.
 * The element stays muted for autoplay; a synchronized stem goes through the game's SFX bus.
 * Only the selected ending downloads. The live 3D renderer sleeps while the film is visible. */
export function playCinematic(id: EndingId, onTime?: (seconds: number) => void): CinematicPlayback | null {
  const asset = DATA.config.cinematics?.[id];
  if (!asset || settings.get().reduceLights || reducedMotion()) return null;
  const video = document.createElement("video");
  video.className = "ending-film";
  video.dataset.cinematic = id;
  video.muted = video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
  video.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback");
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  video.preload = "auto";
  video.poster = `${import.meta.env.BASE_URL}${asset.poster}`;
  video.src = `${import.meta.env.BASE_URL}${asset.src}`;
  const sound = createEndingSound(id);
  document.body.append(video);
  let resolve!: (ok: boolean) => void;
  const finished = new Promise<boolean>(r => { resolve = r; });
  let done = false, disposed = false, visible = false, stalled = true;
  let timeout = window.setTimeout(() => finish(false), 7000);
  function finish(ok: boolean) {
    if (done) return;
    done = true;
    sound?.dispose();
    clearTimeout(timeout);
    video.pause();
    if (!ok || !visible) { video.remove(); setVideoBackground(false); }
    resolve(ok);
  }
  function playing() {
    if (done || disposed) return;
    clearTimeout(timeout);
    stalled = false;
    visible = true;
    video.classList.add("ready");
    setVideoBackground(true);
    sound?.sync(video.currentTime, true);
  }
  function waiting() {
    if (done) return;
    stalled = true;
    sound?.sync(video.currentTime, false);
    clearTimeout(timeout);
    timeout = window.setTimeout(() => finish(false), 7000);
  }
  function visibility() {
    if (done || disposed) return;
    if (document.hidden) video.pause();
    else void video.play().catch(() => finish(false));
  }
  video.addEventListener("playing", playing);
  video.addEventListener("timeupdate", () => { onTime?.(video.currentTime); sound?.sync(video.currentTime, !done && !stalled && !video.paused && !video.seeking); });
  video.addEventListener("pause", () => sound?.sync(video.currentTime, false));
  video.addEventListener("seeking", () => sound?.sync(video.currentTime, false));
  video.addEventListener("seeked", () => sound?.sync(video.currentTime, !done && !stalled && !video.paused));
  video.addEventListener("waiting", waiting);
  video.addEventListener("ended", () => finish(true));
  video.addEventListener("error", () => finish(false));
  document.addEventListener("visibilitychange", visibility);
  void video.play().catch(() => finish(false));
  return {
    finished,
    skip() {
      if (done || disposed) return;
      if (visible && Number.isFinite(video.duration)) video.currentTime = Math.max(0, video.duration - .04);
      finish(true);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      finish(true);
      document.removeEventListener("visibilitychange", visibility);
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      setVideoBackground(false);
    },
  };
}
