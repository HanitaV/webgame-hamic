import { audioBus } from "./audio";
import { DATA } from "./data";
import type { EndingId } from "../puzzles/logic/story";

export interface EndingSound { sync(seconds: number, playing: boolean, rate?: number): void; dispose(): void }
const buffers = new Map<string, Promise<AudioBuffer>>();
const sessions = new Set<{ id: string; playing: boolean; offset: number; ready: boolean }>();
export const endingAudioDiagnostics = () => [...sessions].map(session => ({ ...session }));

/** One decoded stem at a time per cutscene, through the game's SFX bus. The media clock owns sync. */
export function createEndingSound(id: EndingId): EndingSound | null {
  const path = DATA.config.cinematics?.[id]?.audio;
  const bus = path ? audioBus() : null;
  if (!path || !bus) return null;
  const { context, input } = bus;
  const state = { id, playing: false, offset: 0, ready: false }; sessions.add(state);
  let buffer: AudioBuffer | null = null, disposed = false, target = 0, targetStamp = performance.now(), wanted = false, speed = 1;
  let voice: { source: AudioBufferSourceNode; gain: GainNode; offset: number; started: number; rate: number } | null = null;
  function silence() {
    if (!voice) return;
    const old = voice; voice = null;
    const now = context.currentTime, current = old.gain.gain.value;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(current, now);
    old.gain.gain.linearRampToValueAtTime(0, now + .03);
    try { old.source.stop(now + .035); } catch { /* already ended */ }
  }
  const liveTarget = () => wanted ? target + Math.max(0, (performance.now() - targetStamp) / 1000) * speed : target;
  function sync(seconds: number, playing: boolean, rate = 1) {
    if (disposed) return;
    target = Math.max(0, seconds); targetStamp = performance.now(); wanted = playing; speed = rate;
    state.offset = target; state.playing = playing && !!buffer && context.state === "running";
    if (!playing || !buffer || context.state !== "running" || target >= buffer.duration - .02) { silence(); state.playing = false; return; }
    const now = context.currentTime;
    if (voice) {
      const predicted = voice.offset + Math.max(0, now - voice.started) * voice.rate;
      const drift = target - predicted;
      if (Math.abs(drift) < .45) {
        const nudged = Math.abs(drift) < .03 ? rate : rate * Math.max(.96, Math.min(1.04, 1 + drift * .25));
        if (Math.abs(voice.rate - nudged) > .001) {
          voice.offset = predicted; voice.started = now; voice.rate = nudged;
          voice.source.playbackRate.setTargetAtTime(nudged, now, .04);
        }
        return;
      }
    }
    silence();
    const source = context.createBufferSource(), gain = context.createGain();
    const started = now + .012;
    const startOffset = Math.min(buffer.duration - .02, target + .012 * rate);
    source.buffer = buffer; source.playbackRate.value = rate;
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0, started);
    gain.gain.linearRampToValueAtTime(1, started + .035);
    source.connect(gain).connect(input);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(started, startOffset);
    voice = { source, gain, offset: startOffset, started, rate };
  }
  let pending = buffers.get(path);
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}${path}`).then(response => { if (!response.ok) throw new Error(`ending audio ${response.status}`); return response.arrayBuffer(); }).then(bytes => context.decodeAudioData(bytes));
    buffers.set(path, pending);
    // Limit decoded memory on phones (two 16-second stereo buffers).
    if (buffers.size > 2) buffers.delete(buffers.keys().next().value!);
  }
  void pending.then(decoded => { if (disposed) return; buffer = decoded; state.ready = true; sync(liveTarget(), wanted, speed); }).catch(() => { buffers.delete(path); });
  const resume = () => { if (context.state === "running") sync(liveTarget(), wanted, speed); };
  context.addEventListener("statechange", resume);
  return { sync, dispose() {
    if (disposed) return;
    disposed = true; state.playing = false; silence(); sessions.delete(state);
    context.removeEventListener("statechange", resume);
  } };
}
