/** Offline sound design source. Original oscillators, filtered noise and a generated stereo room.
 * This authoring module is not imported by the shipping app. Cue timings live in data/ending-audio.json. */
export interface SoundCue { kind: string; at: number; duration: number; db: number; frequency?: number; to?: number; pan?: number; notes?: number[] }
export interface EndingScore { duration: number; sampleRate: number; mix: { lufs: number; truePeak: number; loudnessRange: number }; common: SoundCue[]; endings: Record<string, SoundCue[]> }

export async function renderEndingScore(score: EndingScore, id: string) {
  const context = new OfflineAudioContext(2, score.duration * score.sampleRate, score.sampleRate);
  let seed = 70149 + Number(id.slice(1));
  const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
  const db = (value: number) => Math.pow(10, value / 20);
  const mix = context.createGain(); mix.gain.value = .85;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -8; compressor.knee.value = 12; compressor.ratio.value = 4;
  compressor.attack.value = .008; compressor.release.value = .2;
  const fade = context.createGain();
  fade.gain.setValueAtTime(1, 0); fade.gain.setValueAtTime(1, 15.1); fade.gain.linearRampToValueAtTime(0, 15.98);
  mix.connect(compressor).connect(fade).connect(context.destination);
  const room = context.createConvolver(), wet = context.createGain(); wet.gain.value = .17;
  const impulse = context.createBuffer(2, context.sampleRate * 1.8, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const samples = impulse.getChannelData(channel);
    for (let i = 0; i < samples.length; i++) samples[i] = (random() * 2 - 1) * Math.pow(1 - i / samples.length, 3) * .32;
  }
  room.buffer = impulse; room.connect(wet).connect(mix);
  const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
  const white = noise.getChannelData(0);
  for (let i = 0; i < white.length; i++) white[i] = random() * 2 - 1;

  function envelope(at: number, duration: number, level: number, attack: number, sustain: boolean, pan = 0) {
    const gain = context.createGain(), stereo = context.createStereoPanner();
    stereo.pan.value = pan;
    gain.gain.setValueAtTime(.00001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(.00002, level), at + Math.min(attack, duration * .25));
    if (sustain) gain.gain.setValueAtTime(level, at + duration * .68);
    gain.gain.exponentialRampToValueAtTime(.00001, at + duration);
    gain.connect(stereo); stereo.connect(mix); stereo.connect(room);
    return { gain, stereo };
  }
  function oscillator(at: number, duration: number, frequency: number, to: number, level: number, type: OscillatorType = "sine", pan = 0, sustain = false) {
    const oscillator = context.createOscillator();
    const { gain } = envelope(at, duration, level, sustain ? .4 : .012, sustain, pan);
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
    oscillator.connect(gain); oscillator.start(at); oscillator.stop(at + duration + .01);
  }
  function air(at: number, duration: number, frequency: number, to: number, level: number, pan = 0, type: BiquadFilterType = "bandpass") {
    const source = context.createBufferSource(), filter = context.createBiquadFilter();
    const { gain, stereo } = envelope(at, duration, level, .18, true, pan);
    source.buffer = noise; source.loop = true;
    filter.type = type; filter.Q.value = .7;
    filter.frequency.setValueAtTime(frequency, at); filter.frequency.exponentialRampToValueAtTime(to, at + duration);
    stereo.pan.linearRampToValueAtTime(-pan, at + duration);
    source.connect(filter).connect(gain); source.start(at, random() * 2); source.stop(at + duration + .01);
  }
  function bell(at: number, duration: number, frequency: number, level: number, pan = 0) {
    for (const [ratio, volume] of [[1, 1], [2.002, .32], [3.01, .09]]) oscillator(at, duration / Math.sqrt(ratio), frequency * ratio, frequency * ratio * .997, level * volume, "sine", pan);
  }
  function burst(at: number, level: number, pan: number) {
    oscillator(at, .55, 115 + random() * 15, 48, level * .7, "sine", pan);
    air(at, 1.4, 1250, 240, level * 1.6, pan, "lowpass");
    for (let i = 0; i < 13; i++) {
      const t = at + .15 + i * .12 + random() * .07;
      air(t, .045 + random() * .09, 1400 + random() * 2300, 650 + random() * 800, level * (.24 + random() * .22) * (1 - i / 16), pan + (random() - .5) * .3);
    }
  }
  for (const cue of [...score.common, ...score.endings[id]]) {
    const at = cue.at, duration = cue.duration, level = db(cue.db), pan = cue.pan ?? 0;
    const frequency = cue.frequency ?? 440, to = cue.to ?? frequency;
    switch (cue.kind) {
      case "pad":
        for (const [i, note] of (cue.notes ?? []).entries()) {
          oscillator(at, duration, note, note * 1.002, level / 4, "triangle", i % 2 ? .5 : -.5, true);
          oscillator(at, duration, note * 1.004, note * 1.001, level / 7, "sine", i % 2 ? -.5 : .5, true);
        }
        break;
      case "rotor":
        for (const [i, f] of [63, 65.4, 98.2, 131].entries()) oscillator(at, duration, f, f * 1.25, level * (i > 1 ? .12 : .3), i > 1 ? "sine" : "triangle", i % 2 ? .5 : -.5, true);
        air(at, duration, 330, 600, level * .5, .4, "lowpass");
        break;
      case "bell": bell(at, duration, frequency, level, pan); break;
      case "chord": for (const [i, f] of (cue.notes ?? []).entries()) bell(at + i * .08, duration - i * .08, f, level / 3, (i - 1.5) * .25); break;
      case "whoosh": air(at, duration, frequency, to, level * 2, pan); break;
      case "salvo":
        air(at, 1.75, 300, 1800, level * .9, pan);
        oscillator(at, 1.65, 400 + random() * 90, 1300 + random() * 250, level * .13, "sine", pan);
        burst(at + 1.75, level, pan);
        break;
      case "impact":
        oscillator(at, .95, 155, 43, level * .8, "sine");
        oscillator(at + .03, .6, 240, 75, level * .2, "triangle", -.15);
        air(at, duration, 850, 120, level * 2, 0, "lowpass");
        break;
      case "boing": {
        const oscillator = context.createOscillator(), { gain } = envelope(at, duration, level, .012, false, pan);
        oscillator.type = "sine";
        const curve = Float32Array.from({ length: 100 }, (_, i) => frequency + Math.sin(i / 99 * Math.PI * 6) * 110 * Math.exp(-i / 35));
        oscillator.frequency.setValueCurveAtTime(curve, at, duration);
        oscillator.connect(gain); oscillator.start(at); oscillator.stop(at + duration);
        break;
      }
      case "clatter":
        for (let i = 0; i < 18; i++) bell(at + i * .19 + random() * .12, .15 + random() * .25, 260 + random() * 950, level * (.5 + random() * .5) * (1 - i / 24), random() * 1.6 - .8);
        break;
      case "comet":
        oscillator(at, duration, frequency, to, level * .44, "sine", pan, true);
        air(at, duration, frequency, to, level * 1.4, pan);
        break;
      case "scratch":
        air(at, duration, 2500, 450, level * 1.8, 0);
        oscillator(at, duration, 900, 170, level * .4, "triangle");
        break;
      default: throw new Error(`Unknown sound cue: ${cue.kind}`);
    }
  }
  return context.startRendering();
}

export function wavBytes(buffer: AudioBuffer) {
  const bytes = new ArrayBuffer(44 + buffer.length * 4), view = new DataView(bytes);
  const string = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  string(0, "RIFF"); view.setUint32(4, bytes.byteLength - 8, true); string(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true);
  view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true);
  string(36, "data"); view.setUint32(40, bytes.byteLength - 44, true);
  const left = buffer.getChannelData(0), right = buffer.getChannelData(1);
  for (let i = 0; i < buffer.length; i++) {
    view.setInt16(44 + i * 4, Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), true);
    view.setInt16(46 + i * 4, Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), true);
  }
  return new Uint8Array(bytes);
}
