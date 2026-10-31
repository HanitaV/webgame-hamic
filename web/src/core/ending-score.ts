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
  compressor.threshold.value = -10; compressor.knee.value = 14; compressor.ratio.value = 3;
  compressor.attack.value = .012; compressor.release.value = .24;
  const toneFilter = context.createBiquadFilter();
  toneFilter.type = "lowpass"; toneFilter.frequency.value = 7500; toneFilter.Q.value = .5;
  const fade = context.createGain();
  fade.gain.setValueAtTime(1, 0); fade.gain.setValueAtTime(1, 15.1); fade.gain.linearRampToValueAtTime(0, 15.98);
  mix.connect(toneFilter).connect(compressor).connect(fade).connect(context.destination);

  // Warm, damped stereo courtyard reverb without high-frequency white-noise fizz.
  const room = context.createConvolver(), wet = context.createGain();
  room.normalize = false; wet.gain.value = .22;
  const irLength = Math.floor(context.sampleRate * 1.6);
  const impulse = context.createBuffer(2, irLength, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const samples = impulse.getChannelData(channel);
    let lp1 = 0, lp2 = 0, hp = 0, prev = 0;
    const hpAlpha = 1 - (2 * Math.PI * 140) / context.sampleRate;
    for (let i = 0; i < irLength; i++) {
      const progress = i / irLength;
      const cutoff = 2400 * Math.pow(.22, progress);
      const alpha = Math.min(.65, (2 * Math.PI * cutoff) / context.sampleRate);
      const raw = random() * 2 - 1;
      lp1 += alpha * (raw - lp1);
      lp2 += alpha * (lp1 - lp2);
      hp = hpAlpha * (hp + lp2 - prev);
      prev = lp2;
      const fadeIn = Math.min(1, i / (context.sampleRate * .02));
      samples[i] = hp * fadeIn * Math.pow(1 - progress, 2.8) * .045;
    }
  }
  room.buffer = impulse; room.connect(wet).connect(mix);

  // Soft pink-filtered air source (-3 dB/oct + warm HF roll-off) so sweeps never hiss like static.
  const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
  const pink = noise.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, smooth = 0;
  for (let i = 0; i < pink.length; i++) {
    const w = random() * 2 - 1;
    b0 = .99765 * b0 + w * .099046;
    b1 = .96300 * b1 + w * .2965164;
    b2 = .57000 * b2 + w * 1.0526913;
    const raw = (b0 + b1 + b2 + w * .1848) * .16;
    smooth += .28 * (raw - smooth);
    pink[i] = Math.max(-.95, Math.min(.95, smooth));
  }
  const sparkleScale = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98, 1975.53];
  const clatterScale = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];

  function envelope(at: number, duration: number, level: number, attack: number, sustain: boolean, pan = 0, reverb = 1) {
    const gain = context.createGain(), stereo = context.createStereoPanner();
    const safeLevel = Math.max(.00002, level);
    const tAttack = at + Math.min(attack, duration * .3);
    const tEnd = at + duration;
    stereo.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(safeLevel, tAttack);
    if (sustain) {
      const tHold = Math.max(tAttack + .01, at + duration * .76);
      gain.gain.setValueAtTime(safeLevel * .92, tHold);
    }
    gain.gain.exponentialRampToValueAtTime(Math.max(.00001, safeLevel * .0015), Math.max(tAttack + .02, tEnd));
    gain.gain.linearRampToValueAtTime(0, tEnd + .02);
    gain.connect(stereo); stereo.connect(mix);
    if (reverb > 0) {
      const send = context.createGain(); send.gain.value = reverb;
      stereo.connect(send).connect(room);
    }
    return { gain, stereo, stopAt: tEnd + .025 };
  }
  function oscillator(at: number, duration: number, frequency: number, to: number, level: number, type: OscillatorType = "sine", pan = 0, sustain = false, attack?: number, cutoff?: number) {
    const osc = context.createOscillator();
    const { gain, stopAt } = envelope(at, duration, level, attack ?? (sustain ? .38 : .014), sustain, pan, frequency < 110 ? .25 : .85);
    osc.type = type; osc.frequency.setValueAtTime(Math.max(20, frequency), at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
    if (cutoff) {
      const lp = context.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.setValueAtTime(cutoff, at); lp.Q.value = .5;
      osc.connect(lp).connect(gain);
    } else osc.connect(gain);
    osc.start(at); osc.stop(stopAt);
  }
  function air(at: number, duration: number, frequency: number, to: number, level: number, pan = 0, type: BiquadFilterType = "bandpass", q = 2.2) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), ceiling = context.createBiquadFilter();
    const { gain, stereo, stopAt } = envelope(at, duration, level, Math.min(.22, duration * .28), true, pan, .35);
    source.buffer = noise; source.loop = true;
    filter.type = type; filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(40, frequency), at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), at + duration);
    ceiling.type = "lowpass"; ceiling.Q.value = .5;
    ceiling.frequency.value = Math.min(2000, Math.max(frequency, to) * 1.35 + 180);
    stereo.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, -pan)), at + duration);
    source.connect(filter).connect(ceiling).connect(gain);
    source.start(at, random() * 2.5); source.stop(stopAt);
  }
  function bell(at: number, duration: number, frequency: number, level: number, pan = 0) {
    for (const [ratio, volume] of [[1, 1], [2.001, .26], [3.004, .055]]) {
      oscillator(at, duration / Math.sqrt(ratio), frequency * ratio, frequency * ratio * .998, level * volume, "sine", pan, false, .012);
    }
  }
  function burst(at: number, level: number, pan: number) {
    oscillator(at, .62, 122 + random() * 12, 44, level * .72, "sine", pan, false, .016);
    oscillator(at + .01, .36, 195 + random() * 18, 68, level * .22, "sine", pan * .7, false, .014);
    air(at, .95, 520, 160, level * .16, pan, "lowpass", .8);
    for (let i = 0; i < 10; i++) {
      const t = at + .12 + i * .11 + random() * .05;
      const note = sparkleScale[(i + Math.floor(random() * 3)) % sparkleScale.length] * (.99 + random() * .02);
      const decay = 1 - i / 13;
      oscillator(t, .18 + random() * .16, note, note * .994, level * (.085 + random() * .045) * decay, "sine", pan + (random() - .5) * .45, false, .01);
    }
  }
  for (const cue of [...score.common, ...score.endings[id]]) {
    const at = cue.at, duration = cue.duration, level = db(cue.db), pan = cue.pan ?? 0;
    const frequency = cue.frequency ?? 440, to = cue.to ?? frequency;
    switch (cue.kind) {
      case "pad":
        for (const [i, note] of (cue.notes ?? []).entries()) {
          const side = i % 2 ? .42 : -.42;
          oscillator(at, duration, note, note * 1.0015, level * .65, "sine", side, true, .65);
          oscillator(at, duration, note * 2, note * 1.999, level * .22, "sine", -side, true, .75);
          oscillator(at, duration, note * 1.0025, note, level * .28, "triangle", side * .5, true, .7, 680);
        }
        break;
      case "rotor": {
        for (const [i, f] of [98, 147, 196].entries()) {
          const osc = context.createOscillator(), lfo = context.createOscillator(), lfoGain = context.createGain(), mod = context.createGain();
          const { gain, stopAt } = envelope(at, duration, level * (i === 0 ? .28 : i === 1 ? .18 : .09), .45, true, i % 2 ? .38 : -.38, .25);
          osc.type = "sine"; osc.frequency.setValueAtTime(f, at); osc.frequency.exponentialRampToValueAtTime(f * 1.18, at + duration);
          mod.gain.value = 1;
          lfo.type = "sine"; lfo.frequency.setValueAtTime(10.5 + i * 1.2, at); lfo.frequency.linearRampToValueAtTime(13.5 + i * 1.2, at + duration);
          lfoGain.gain.value = .09;
          lfo.connect(lfoGain).connect(mod.gain);
          osc.connect(mod).connect(gain);
          osc.start(at); lfo.start(at); osc.stop(stopAt); lfo.stop(stopAt);
        }
        air(at, duration, 240, 420, level * .07, .25, "lowpass", .8);
        break;
      }
      case "bell": bell(at, duration, frequency, level * 1.15, pan); break;
      case "chord":
        for (const [i, f] of (cue.notes ?? []).entries()) {
          const noteAt = at + i * .08, noteDur = Math.max(.4, duration - i * .08), notePan = (i - 1.5) * .25;
          bell(noteAt, noteDur, f, level * .52, notePan);
          oscillator(noteAt, noteDur, f, f * 1.001, level * .24, "sine", -notePan * .6, true, .28);
        }
        break;
      case "whoosh":
        air(at, duration, frequency, Math.min(1350, to), level * .22, pan, "bandpass", 2.4);
        oscillator(at, duration, Math.max(130, frequency * .85), Math.min(780, to * .48), level * .14, "sine", pan * .6, true, .32);
        break;
      case "salvo":
        air(at, 1.75, 280, 1150, level * .12, pan, "bandpass", 3.2);
        oscillator(at, 1.65, 360 + random() * 60, 980 + random() * 140, level * .15, "sine", pan, false, .18);
        burst(at + 1.75, level, pan);
        break;
      case "impact":
        oscillator(at, .95, 138, 40, level * .52, "sine", 0, false, .016);
        oscillator(at + .02, .58, 210, 62, level * .18, "sine", -.15, false, .015);
        oscillator(at + .01, .65, 96, 38, level * .15, "triangle", .12, false, .018, 240);
        air(at, Math.min(1.1, duration), 380, 110, level * .12, 0, "lowpass", .8);
        break;
      case "boing": {
        const osc = context.createOscillator(), lfo = context.createOscillator(), lfoDepth = context.createGain();
        const { gain, stopAt } = envelope(at, duration, level, .014, false, pan);
        osc.type = "sine"; osc.frequency.setValueAtTime(frequency, at);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.06, at + duration * .35);
        osc.frequency.exponentialRampToValueAtTime(frequency * .96, at + duration);
        lfo.type = "sine"; lfo.frequency.value = 5.6;
        lfoDepth.gain.setValueAtTime(72, at);
        lfoDepth.gain.exponentialRampToValueAtTime(2, at + duration);
        lfo.connect(lfoDepth).connect(osc.frequency);
        osc.connect(gain);
        osc.start(at); lfo.start(at); osc.stop(stopAt); lfo.stop(stopAt);
        break;
      }
      case "clatter":
        for (let i = 0; i < 16; i++) {
          const note = clatterScale[(i * 3 + Math.floor(random() * 3)) % clatterScale.length] * (i % 4 === 0 ? 1.5 : 1);
          bell(at + i * .21 + random() * .09, .2 + random() * .22, note, level * (.38 + random() * .28) * (1 - i / 22), random() * 1.3 - .65);
        }
        break;
      case "comet": {
        const top = Math.min(1380, to * .52);
        oscillator(at, duration, frequency, top, level * .34, "sine", pan, true, .28);
        oscillator(at + .04, duration * .92, frequency * 1.498, Math.min(1850, top * 1.5), level * .11, "sine", -pan * .5, true, .32);
        air(at, duration, Math.min(900, frequency), Math.min(1250, top), level * .1, pan, "bandpass", 3.4);
        break;
      }
      case "scratch":
        oscillator(at, duration, 680, 185, level * .42, "sine", 0, false, .012);
        oscillator(at, duration, 680, 185, level * .2, "triangle", .1, false, .012, 850);
        air(at, duration, 950, 280, level * .08, 0, "bandpass", 2.8);
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
