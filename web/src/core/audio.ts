/**
 * Small synthesized sound effects (WebAudio, no files): a click, a soft chime for success, a low
 * gentle tone for "chưa đạt", and a chord when a circuit lights. Ending stems share this SFX bus;
 * their soft cartoon impacts avoid loud realistic explosions (GDD 11.2).
 */

let ctx: AudioContext | null = null;
let volume = 0.6;
let muted = false;
let master: GainNode | null = null;
let meter: AnalyserNode | null = null;

export function setAudio(v: number, mute: boolean) {
  volume = Math.max(0, Math.min(1, v));
  muted = mute;
  if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, .015);
}

function ac() {
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 3; limiter.ratio.value = 12;
    limiter.attack.value = .004; limiter.release.value = .12;
    master = ctx.createGain(); master.gain.value = muted ? 0 : volume;
    meter = ctx.createAnalyser(); meter.fftSize = 512;
    limiter.connect(master).connect(meter).connect(ctx.destination);
    input = limiter;
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}
let input: DynamicsCompressorNode | null = null;
export function audioBus() { const context = ac(); return context && input ? { context, input } : null; }
export function audioDiagnostics() {
  const samples = new Float32Array(512); meter?.getFloatTimeDomainData(samples);
  return { volume, muted, gain: master?.gain.value ?? 0, state: ctx?.state ?? "uninitialized", rms: Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length) };
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const a = ac();
  if (!a || muted || volume === 0) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = a.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(input!);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => tone(660, 0, 0.06, "square", 0.08),
  ok: () => [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.09, 0.28, "triangle", 0.18)),
  notYet: () => tone(220, 0, 0.22, "sine", 0.12),
  light: () => [392, 523.25, 659.25, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.6, "triangle", 0.15)),
  place: () => tone(880, 0, 0.04, "square", 0.04),
  star: (i: number) => tone(784 + i * 196, 0, 0.18, "triangle", 0.15),
};

let haptics = true;
/** Rung rất ngắn khi xong việc hoặc nhận bằng chứng (điện thoại có hỗ trợ); tắt theo cài đặt. */
export function setHaptics(on: boolean) { haptics = on; }
export function buzz(ms = 18) {
  if (!haptics || muted) return;
  try { navigator.vibrate?.(ms); } catch { /* trình duyệt không hỗ trợ */ }
}
