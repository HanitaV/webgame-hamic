import { audioBus } from "./audio";
import { DATA } from "./data";
import { t } from "./i18n";
import { settings } from "../game/settings";
import { storyProgress, storySave } from "../game/story";
import { currentChapter } from "../puzzles/logic/story";
import { btn, el } from "../ui/dom";
import { onNavigate } from "../ui/router";

interface Track { chapter: string; src: string; title: string; artist: string; source: string; license: string }
interface Voice { source: AudioBufferSourceNode; gain: GainNode }
let tracks: Track[] = [], selected: Track | undefined, voice: Voice | null = null;
let context: AudioContext | null = null, music: GainNode | null = null;
let unlocked = false, quiet = false, loading = false, failed = false, generation = 0;
let render = () => {};
const buffers = new Map<string, { buffer: AudioBuffer; level: number }>();

export function musicDiagnostics() {
  return { chapter: selected?.chapter, track: selected?.src, playing: !!voice && context?.state === "running" && !document.hidden,
    gain: music?.gain.value ?? 0, loading, failed, quiet, cached: buffers.size };
}

function mix() {
  const s = settings.get();
  const gain = s.mute || !s.musicEnabled || document.hidden || quiet ? 0 : Math.max(0, Math.min(1, s.musicVolume));
  if (music && context) music.gain.setTargetAtTime(gain, context.currentTime, .18);
  render();
}
function stop(fade = .65) {
  if (!voice || !context) return;
  const old = voice; voice = null;
  old.gain.gain.cancelScheduledValues(context.currentTime);
  old.gain.gain.setTargetAtTime(0, context.currentTime, fade / 4);
  old.source.stop(context.currentTime + fade);
}

/** Called by story rendering as well as saved progress (including developer chapter jumps). */
export function refreshMusic() {
  const next = tracks.find(x => x.chapter === currentChapter(DATA.story, storyProgress.get()).id) ?? tracks[0];
  if (selected !== next) { selected = next; generation++; loading = false; failed = false; stop(); }
  mix();
  void play();
}
export function quietMusic(value: boolean) { quiet = value; mix(); }

async function play() {
  if (!unlocked || !selected || !settings.get().musicEnabled || settings.get().mute || document.hidden || voice || loading) return;
  if (!context) {
    const bus = audioBus(); if (!bus) return;
    context = bus.context;
    // Separate from SFX volume; the global mute is applied by mix().
    music = context.createGain(); music.gain.value = 0; music.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume().catch(() => {});
  const token = ++generation, track = selected;
  loading = true; failed = false; render();
  try {
    let decoded = buffers.get(track.src);
    if (!decoded) {
      const response = await fetch(`${import.meta.env.BASE_URL}${encodeURI(track.src)}`);
      if (!response.ok) throw new Error(`music ${response.status}`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      // Match source loudness before the deliberately quiet player volume. Peak cap keeps headroom.
      let energy = 0, peak = 0, count = 0;
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const samples = buffer.getChannelData(ch);
        for (let i = 0; i < samples.length; i++) {
          peak = Math.max(peak, Math.abs(samples[i]));
          if (i % 8 === 0) { energy += samples[i] * samples[i]; count++; }
        }
      }
      decoded = { buffer, level: Math.min(3, .1 / Math.max(.001, Math.sqrt(energy / count)), .8 / Math.max(.001, peak)) };
      if (token !== generation) return;
      buffers.set(track.src, decoded);
      if (buffers.size > 2) buffers.delete(buffers.keys().next().value!);
    }
    if (token !== generation || document.hidden || !settings.get().musicEnabled || settings.get().mute) return;
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = decoded.buffer; source.loop = true;
    gain.gain.value = 0; gain.gain.setTargetAtTime(decoded.level, context.currentTime, .3);
    source.connect(gain).connect(music!);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(); voice = { source, gain }; mix();
  } catch { if (token === generation) failed = true; }
  finally { if (token === generation) { loading = false; render(); } }
}

export async function initMusic() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/music.json`);
    if (!response.ok) return;
    tracks = (await response.json()).tracks;
  } catch { return; }
  const panel = el("section", { id: "music-panel", class: "music-panel", hidden: true, "aria-label": t("bgm.title") });
  const title = el("b"), artist = el("small", { class: "muted" }), status = el("small", { role: "status" });
  const toggle = btn("", () => settings.set({ musicEnabled: !settings.get().musicEnabled }), "small wide");
  const volume = el("input", { type: "range", min: 0, max: 1, step: .01, "aria-label": t("bgm.volume") });
  volume.addEventListener("input", () => settings.set({ musicVolume: Number(volume.value) }));
  const open = btn(t("bgm.title"), () => {
    panel.hidden = !panel.hidden;
    open.setAttribute("aria-expanded", String(!panel.hidden));
  }, "small", { "aria-label": t("bgm.open"), "aria-controls": "music-panel", "aria-expanded": "false" }, "music");
  const close = btn(t("bgm.close"), () => { panel.hidden = true; open.setAttribute("aria-expanded", "false"); open.focus(); }, "small ghost", {}, "close");
  panel.append(title, artist, status, toggle, el("label", {}, t("bgm.volume"), volume), close);
  const dock = el("aside", { class: "music-dock" }, open, panel);
  document.body.append(dock);
  dock.addEventListener("keydown", event => {
    event.stopPropagation();
    if (event.key === "Escape" && !panel.hidden) {
      event.stopPropagation(); panel.hidden = true;
      open.setAttribute("aria-expanded", "false"); open.focus();
    }
  });
  dock.addEventListener("keyup", event => event.stopPropagation());
  render = () => {
    title.textContent = selected ? t(selected.title) : t("bgm.title"); artist.textContent = selected?.artist ?? "";
    const s = settings.get();
    status.textContent = t(s.mute ? "bgm.muted" : !s.musicEnabled ? "bgm.paused" : quiet ? "bgm.ending" : failed ? "bgm.error" : !voice ? "bgm.waiting" : "bgm.playing");
    toggle.querySelector("span")!.textContent = t(s.musicEnabled ? "bgm.off" : "bgm.on");
    toggle.setAttribute("aria-pressed", String(s.musicEnabled)); volume.value = String(s.musicVolume);
  };
  const unlock = () => { unlocked = true; void play(); };
  document.addEventListener("pointerdown", unlock, { passive: true });
  document.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { generation++; loading = false; stop(.1); mix(); }
    else refreshMusic();
  });
  settings.subscribe(() => {
    mix();
    if (!settings.get().musicEnabled || settings.get().mute) { generation++; loading = false; stop(.1); }
    else void play();
  });
  storySave.subscribe(() => refreshMusic());
  onNavigate(() => { quiet = false; refreshMusic(); });
  refreshMusic();
}
