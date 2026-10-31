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
  let buffer: AudioBuffer | null = null, disposed = false, target = 0, wanted = false, speed = 1;
  let voice: { source: AudioBufferSourceNode; gain: GainNode; offset: number; started: number; rate: number } | null = null;
  function silence() {
    if (!voice) return;
    const old = voice; voice = null;
    old.gain.gain.cancelScheduledValues(context.currentTime);
    old.gain.gain.setTargetAtTime(0, context.currentTime, .008);
    try { old.source.stop(context.currentTime + .04); } catch { /* already ended */ }
  }
  function sync(seconds: number, playing: boolean, rate = 1) {
    if (disposed) return;
    target = Math.max(0, seconds); wanted = playing; speed = rate;
    state.offset = target; state.playing = playing && !!buffer;
    if (!playing || !buffer || target >= buffer.duration - .01) { silence(); state.playing = false; return; }
    const predicted = voice ? voice.offset + Math.max(0, context.currentTime - voice.started) * voice.rate : -1;
    if (voice && Math.abs(predicted - target) < .14 && voice.rate === rate) return;
    silence();
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.playbackRate.value = rate;
    gain.gain.setValueAtTime(0, context.currentTime); gain.gain.linearRampToValueAtTime(1, context.currentTime + .04);
    source.connect(gain).connect(input);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    const started = context.currentTime + .015;
    source.start(started, target);
    voice = { source, gain, offset: target, started, rate };
  }
  let pending = buffers.get(path);
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}${path}`).then(response => { if (!response.ok) throw new Error(`ending audio ${response.status}`); return response.arrayBuffer(); }).then(bytes => context.decodeAudioData(bytes));
    buffers.set(path, pending);
    // Limit decoded memory on phones (two 16-second stereo buffers).
    if (buffers.size > 2) buffers.delete(buffers.keys().next().value!);
  }
  void pending.then(decoded => { if (disposed) return; buffer = decoded; state.ready = true; sync(target, wanted, speed); }).catch(() => { buffers.delete(path); });
  const resume = () => { if (context.state === "running") sync(target, wanted, speed); };
  context.addEventListener("statechange", resume);
  return { sync, dispose() {
    if (disposed) return;
    disposed = true; state.playing = false; silence(); sessions.delete(state);
    context.removeEventListener("statechange", resume);
  } };
}
