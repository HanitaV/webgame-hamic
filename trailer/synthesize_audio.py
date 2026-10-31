#!/usr/bin/env python3
"""
Procedural synthesis of the 59.00s HAMIC Trailer BGM & SFX stem (matching web/src/core/ending-score.ts),
followed by sidechain ducking against trailer/audio/voice_59s.wav and two-pass EBU R128 loudness normalization.
Zero external copyrighted music; 100% original procedural synthesis.
"""
import json
import math
import os
import random
import struct
import subprocess
import wave

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AUDIO_DIR = os.path.join(ROOT, "trailer", "audio")
SR = 48000
DURATION = 59.0
N_SAMPLES = int(SR * DURATION)

def synthesize_bgm_and_sfx():
    left = [0.0] * N_SAMPLES
    right = [0.0] * N_SAMPLES
    rng = random.Random(70149)

    def add_tone(at: float, dur: float, f0: float, f1: float, amp: float, kind: str = "sine", pan: float = 0.0, attack: float = 0.015):
        s_idx = max(0, int(at * SR))
        e_idx = min(N_SAMPLES, int((at + dur) * SR))
        if e_idx <= s_idx:
            return
        l_gain = amp * math.cos((pan + 1.0) * math.pi * 0.25)
        r_gain = amp * math.sin((pan + 1.0) * math.pi * 0.25)
        phase = 0.0
        n = e_idx - s_idx
        att_samples = max(1, int(min(attack, dur * 0.35) * SR))
        for i in range(n):
            u = i / n
            freq = f0 * ((f1 / f0) ** u) if f0 > 0 and f1 > 0 else f0
            phase += (2.0 * math.pi * freq) / SR
            if kind == "sine":
                val = math.sin(phase)
            elif kind == "triangle":
                val = (2.0 / math.pi) * math.asin(math.sin(phase))
            elif kind == "softsquare":
                val = math.tanh(2.2 * math.sin(phase))
            else:
                val = math.sin(phase)
            if i < att_samples:
                env = i / att_samples
            else:
                env = math.pow(1.0 - (i - att_samples) / max(1, n - att_samples), 1.65)
            s = val * env
            left[s_idx + i] += s * l_gain
            right[s_idx + i] += s * r_gain

    def add_bell(at: float, dur: float, freq: float, amp: float, pan: float = 0.0):
        for ratio, weight in ((1.0, 1.0), (2.001, 0.28), (3.004, 0.07)):
            add_tone(at, dur / math.sqrt(ratio), freq * ratio, freq * ratio * 0.998, amp * weight, "sine", pan, 0.010)

    def add_chord(at: float, dur: float, notes: list[float], amp: float):
        for idx, f in enumerate(notes):
            pan = (idx - (len(notes) - 1) / 2.0) * 0.28
            add_tone(at, dur, f, f * 1.001, amp * 0.55, "sine", pan, 0.18)
            add_tone(at, dur, f * 2.0, f * 1.999, amp * 0.18, "triangle", -pan, 0.22)

    def add_whoosh(at: float, dur: float, f0: float, f1: float, amp: float, pan0: float = -0.4, pan1: float = 0.4):
        s_idx = max(0, int(at * SR))
        e_idx = min(N_SAMPLES, int((at + dur) * SR))
        if e_idx <= s_idx:
            return
        n = e_idx - s_idx
        lp = 0.0
        bp = 0.0
        for i in range(n):
            u = i / n
            freq = f0 * ((f1 / f0) ** u)
            alpha = min(0.65, (2.0 * math.pi * freq) / SR)
            w = rng.uniform(-1.0, 1.0)
            lp += alpha * (w - lp)
            bp += alpha * (lp - bp)
            env = math.sin(u * math.pi) ** 1.3
            pan = pan0 + (pan1 - pan0) * u
            l_gain = amp * math.cos((pan + 1.0) * math.pi * 0.25)
            r_gain = amp * math.sin((pan + 1.0) * math.pi * 0.25)
            s = (lp - bp) * env * 1.8
            left[s_idx + i] += s * l_gain
            right[s_idx + i] += s * r_gain
        add_tone(at, dur, max(90.0, f0 * 0.5), min(900.0, f1 * 0.45), amp * 0.35, "sine", (pan0 + pan1) * 0.5, dur * 0.25)

    def add_boing(at: float, dur: float, freq: float, amp: float, pan: float = 0.0):
        s_idx = max(0, int(at * SR))
        e_idx = min(N_SAMPLES, int((at + dur) * SR))
        n = e_idx - s_idx
        phase = 0.0
        for i in range(n):
            t_loc = i / SR
            u = i / n
            lfo = math.sin(2.0 * math.pi * 6.2 * t_loc) * 68.0 * math.exp(-3.2 * u)
            f = freq * (1.0 + 0.08 * math.sin(u * math.pi)) + lfo
            phase += (2.0 * math.pi * f) / SR
            env = min(1.0, i / (0.012 * SR)) * ((1.0 - u) ** 1.5)
            val = math.sin(phase) * env * amp
            left[s_idx + i] += val * (0.7 - 0.25 * pan)
            right[s_idx + i] += val * (0.7 + 0.25 * pan)

    def add_firework_salvo(at: float, amp: float, pan: float = 0.0):
        add_whoosh(at, 0.85, 320.0, 1180.0, amp * 0.40, pan * 0.5, pan)
        add_tone(at, 0.80, 380.0, 1020.0, amp * 0.25, "sine", pan, 0.08)
        burst_t = at + 0.82
        add_tone(burst_t, 0.52, 130.0, 44.0, amp * 0.85, "sine", pan, 0.012)
        add_tone(burst_t + 0.01, 0.35, 210.0, 68.0, amp * 0.35, "triangle", pan * 0.7, 0.012)
        sparkle = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98]
        for k in range(9):
            st = burst_t + 0.08 + k * 0.085 + rng.uniform(0.0, 0.03)
            note = sparkle[(k + rng.randint(0, 2)) % len(sparkle)]
            add_bell(st, 0.22, note, amp * 0.16 * (1.0 - k / 11.0), max(-0.9, min(0.9, pan + rng.uniform(-0.35, 0.35))))

    # 1. Upbeat Electronic Pulse & Harmonic Progression across scenes
    # Scene 01-02 (0.0 - 7.8s): Curious, energetic synth pulse (120 BPM = 0.5s beat, 0.25s 8th note)
    arp_notes_curious = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 392.00]
    t = 0.0
    step_idx = 0
    while t < 7.75:
        note = arp_notes_curious[step_idx % len(arp_notes_curious)]
        add_tone(t, 0.20, note, note, 0.042, "triangle", (step_idx % 3 - 1) * 0.25, 0.01)
        if step_idx % 2 == 0:
            add_tone(t, 0.22, note * 0.5, note * 0.5, 0.055, "sine", 0.0, 0.01)
        t += 0.25
        step_idx += 1

    # Opening spark chime + aerial swoop whoosh
    add_bell(0.12, 1.4, 523.25, 0.12, -0.2)
    add_bell(0.35, 1.4, 783.99, 0.12, 0.2)
    add_bell(0.60, 1.6, 1046.50, 0.14, 0.0)
    add_whoosh(0.85, 2.2, 220.0, 960.0, 0.09, -0.5, 0.5)
    add_whoosh(3.80, 1.5, 280.0, 1100.0, 0.08, 0.4, -0.4)

    # Scene 03 (7.8 - 15.8s): Investigation rhythm + 4 distinct glitch/error SFX
    arp_investigate = [220.00, 261.63, 329.63, 311.13, 220.00, 293.66, 349.23, 329.63]
    t = 7.80
    step_idx = 0
    while t < 15.75:
        note = arp_investigate[step_idx % len(arp_investigate)]
        add_tone(t, 0.18, note, note, 0.038, "triangle", (step_idx % 2 - 0.5) * 0.3, 0.008)
        t += 0.22
        step_idx += 1

    # Shot 3A: LED sequence 1..5 then #6 error buzz
    for k, lt in enumerate([8.00, 8.22, 8.44, 8.66, 8.88]):
        add_bell(lt, 0.25, 440.0 + k * 55.0, 0.08, -0.5 + k * 0.2)
    # #6 desync error buzz at 9.10s
    add_tone(9.10, 0.36, 155.56, 110.0, 0.14, "softsquare", 0.35, 0.006)
    add_tone(9.12, 0.34, 220.00, 146.8, 0.10, "softsquare", -0.35, 0.006)

    # Shot 3B: Two files diff alert at 10.45s
    add_bell(9.85, 0.20, 587.33, 0.08, -0.3)
    add_tone(10.55, 0.32, 311.13, 207.65, 0.12, "softsquare", 0.0, 0.008)

    # Shot 3C: Mirror laser deflection zing at 12.35s
    add_tone(12.25, 0.42, 1320.0, 290.0, 0.12, "triangle", 0.4, 0.005)

    # Shot 3D: 404 Note Not Found power-down + question bells at 13.85s & 14.8s
    add_tone(13.85, 0.45, 620.0, 140.0, 0.12, "sine", -0.3, 0.01)
    add_bell(14.85, 0.35, 493.88, 0.09, 0.3)
    add_bell(15.10, 0.40, 466.16, 0.09, -0.3)

    # Scene 04 (15.8 - 31.0s): Accelerating 8-Decision Montage
    decision_cuts = [16.90, 19.35, 21.25, 22.90, 24.30, 25.55, 26.75, 27.80]
    scale_up = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]
    for idx, ct in enumerate(decision_cuts):
        base_f = scale_up[idx]
        # Crisp UI lock-in chime + whoosh at each decision
        add_whoosh(ct - 0.06, 0.28, 300.0 + idx * 45.0, 950.0 + idx * 80.0, 0.07, -0.3, 0.3)
        add_bell(ct + 0.04, 0.45, base_f * 2.0, 0.10, (idx % 2 - 0.5) * 0.4)
        add_bell(ct + 0.14, 0.55, base_f * 2.5, 0.09, -(idx % 2 - 0.5) * 0.4)

    t = 15.80
    step_idx = 0
    while t < 30.85:
        prog = (t - 15.80) / 15.20
        step_dur = 0.21 - 0.05 * prog
        note = scale_up[step_idx % len(scale_up)] * (1.0 if step_idx % 2 == 0 else 1.5)
        add_tone(t, step_dur * 0.85, note, note, 0.036 + 0.015 * prog, "triangle", math.sin(step_idx) * 0.3, 0.008)
        if step_idx % 4 == 0:
            add_tone(t, step_dur * 1.4, note * 0.5, note * 0.5, 0.05, "sine", 0.0, 0.01)
        t += step_dur
        step_idx += 1

    # Scene 05 (31.0 - 35.0s): "Chọn đại" hesitation, button click at 32.75s, Risk 99% alarm
    add_bell(31.40, 0.18, 880.0, 0.07, -0.2)
    add_bell(32.10, 0.18, 987.77, 0.07, 0.2)
    # Big button click at 32.75s
    add_tone(32.75, 0.06, 1400.0, 420.0, 0.18, "softsquare", 0.0, 0.002)
    add_tone(32.81, 0.14, 520.0, 1040.0, 0.14, "triangle", 0.0, 0.004)
    # Risk 99% rising gauge + "Looks fine :)" quirky two-note ding at 33.4s - 34.4s
    add_whoosh(32.85, 1.15, 220.0, 1450.0, 0.09, -0.4, 0.4)
    add_bell(33.95, 0.45, 783.99, 0.11, -0.25)
    add_bell(34.18, 0.65, 1046.50, 0.12, 0.25)

    # Scene 06 (35.0 - 38.0s): Countdown 3 - 2 - 1 - Chạy mô phỏng! (then silence drop at 37.75-38.00s)
    for cd_t, cd_f in ((35.08, 440.0), (35.78, 554.37), (36.48, 659.25)):
        add_bell(cd_t, 0.48, cd_f, 0.13, 0.0)
        add_tone(cd_t, 0.35, cd_f * 0.5, cd_f * 0.5, 0.09, "sine", 0.0, 0.01)
    # "Chạy mô phỏng!" charge sweep 36.8 -> 37.75s
    add_whoosh(36.75, 0.95, 180.0, 1500.0, 0.12, -0.5, 0.5)

    # Scene 07 (38.0 - 46.0s): E2 Cartoon Liftoff!
    # 38.00s: HUS lifts off FIRST (soft low impact + cartoon boing + clatter)
    add_tone(38.00, 0.85, 138.0, 40.0, 0.24, "sine", 0.2, 0.014)
    add_tone(38.02, 0.55, 210.0, 62.0, 0.12, "triangle", -0.2, 0.014)
    add_boing(38.28, 1.50, 196.0, 0.14, 0.35)
    add_whoosh(38.35, 2.20, 240.0, 980.0, 0.09, 0.2, 0.5)

    # 41.20s: USSH lifts off SECOND (second cartoon pop + higher boing + playful clatter)
    add_tone(41.20, 0.75, 152.0, 46.0, 0.20, "sine", -0.3, 0.014)
    add_boing(41.42, 1.45, 246.94, 0.14, -0.35)
    add_whoosh(41.50, 2.10, 280.0, 1120.0, 0.09, -0.5, -0.1)

    # Playful xylophone/bell clatter & comedic bass bounce during 38.5 - 45.8s
    clatter_notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]
    for i in range(22):
        ct = 38.55 + i * 0.32 + rng.uniform(0.0, 0.06)
        if ct < 45.85:
            cn = clatter_notes[(i * 3 + rng.randint(0, 2)) % len(clatter_notes)] * (1.5 if i % 4 == 0 else 1.0)
            add_bell(ct, 0.24, cn, 0.075 * (1.0 - i / 30.0), rng.uniform(-0.6, 0.6))

    # Scene 08 (46.0 - 49.8s): Freeze frame stamp at 46.05s + Rewind whoosh at 47.35 - 49.55s
    add_bell(46.05, 0.65, 523.25, 0.11, 0.0)
    # Rewind sound effect (47.35 - 49.50s)
    add_whoosh(47.35, 2.05, 1450.0, 220.0, 0.12, 0.5, -0.5)
    for k in range(10):
        rt = 47.40 + k * 0.19
        rf = 1100.0 - k * 75.0
        add_tone(rt, 0.14, rf, rf * 0.85, 0.065, "triangle", 0.4 - k * 0.08, 0.005)
    # Soft landing chord at 49.45s
    add_chord(49.40, 1.2, [261.63, 329.63, 392.00, 523.25], 0.09)

    # Scene 09 & 10 (49.8 - 59.0s): Grand Festival Announcement & Final CTA
    add_chord(49.85, 4.8, [261.63, 329.63, 392.00, 493.88, 587.33], 0.085)
    add_chord(54.50, 4.4, [261.63, 329.63, 392.00, 523.25, 659.25], 0.095)

    # Bright celebratory arp under S09-S10
    fest_notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25]
    t = 50.0
    step_idx = 0
    while t < 58.2:
        fn = fest_notes[step_idx % len(fest_notes)]
        add_bell(t, 0.32, fn, 0.045, math.sin(step_idx * 0.9) * 0.35)
        t += 0.24
        step_idx += 1

    # Soft firework salvos in S09 & S10
    for fw_t, fw_pan in ((50.15, -0.45), (51.90, 0.45), (53.80, -0.30), (55.70, 0.35), (57.10, 0.0)):
        add_firework_salvo(fw_t, 0.11, fw_pan)

    # Final resolving shimmer chord at 57.6 -> 59.0s
    add_chord(57.55, 1.42, [261.63, 392.00, 523.25, 659.25, 783.99], 0.11)

    # Smooth fade-out on last 0.18s so frame 1769 ends cleanly without pop
    fade_samples = int(0.18 * SR)
    for i in range(fade_samples):
        idx = N_SAMPLES - fade_samples + i
        g = 0.5 * (1.0 + math.cos(math.pi * i / fade_samples))
        left[idx] *= g
        right[idx] *= g

    bgm_wav = os.path.join(AUDIO_DIR, "sfx_bgm_59s.wav")
    with wave.open(bgm_wav, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        buf = bytearray(N_SAMPLES * 4)
        for i in range(N_SAMPLES):
            l16 = int(round(max(-0.95, min(0.95, left[i])) * 32767))
            r16 = int(round(max(-0.95, min(0.95, right[i])) * 32767))
            struct.pack_into("<hh", buf, i * 4, l16, r16)
        wf.writeframes(buf)

    print(f"Synthesized 59.00s stereo BGM + SFX track: {bgm_wav}")
    return bgm_wav

def mix_and_normalize(bgm_wav: str, voice_wav: str):
    raw_mix_wav = os.path.join(AUDIO_DIR, "_raw_mix_59s.wav")
    master_wav = os.path.join(AUDIO_DIR, "trailer_master_59s.wav")
    master_m4a = os.path.join(AUDIO_DIR, "trailer_master_59s.m4a")

    # Mix with sidechain ducking: BGM ducks smoothly whenever voice is speaking
    filter_complex = (
        "[1:a]highpass=f=85,trebl=g=1.5:f=4200,volume=1.35,asplit=2[vo][sc];"
        "[0:a]volume=0.82[bg];"
        "[bg][sc]sidechaincompress=threshold=0.025:ratio=4.5:attack=15:release=260:makeup=1.0[bg_duck];"
        "[bg_duck][vo]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.88[out]"
    )
    # Wait: check if 'trebl' is 'treble' in ffmpeg
    filter_complex = filter_complex.replace("trebl=", "treble=")

    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", bgm_wav, "-i", voice_wav,
        "-filter_complex", filter_complex,
        "-map", "[out]", "-ar", "48000", "-ac", "2", "-t", "59",
        raw_mix_wav
    ], check=True)

    # Two-pass EBU R128 loudness normalization to -16 LUFS, true peak -1.8 dBTP
    target_i = -16.0
    target_tp = -1.8
    target_lra = 9.0
    ln_base = f"loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}"
    res1 = subprocess.run([
        "ffmpeg", "-hide_banner", "-y", "-i", raw_mix_wav,
        "-af", f"{ln_base}:print_format=json", "-f", "null", "-"
    ], capture_output=True, text=True, encoding="utf-8")
    stderr1 = res1.stderr
    measured = json.loads(stderr1[stderr1.rfind("{"):stderr1.rfind("}") + 1])

    ln_pass2 = (
        f"{ln_base}:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
        f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:"
        f"offset={measured['target_offset']}:linear=true"
    )
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", raw_mix_wav, "-af", ln_pass2, "-ar", "48000", "-ac", "2", "-t", "59",
        master_wav
    ], check=True)
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", master_wav, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", "59",
        "-movflags", "+faststart", master_m4a
    ], check=True)
    os.remove(raw_mix_wav)

    res_check = subprocess.run([
        "ffmpeg", "-hide_banner", "-y", "-i", master_m4a,
        "-af", "ebur128=peak=true", "-f", "null", "-"
    ], capture_output=True, text=True, encoding="utf-8")
    summary = res_check.stderr[res_check.stderr.rfind("Summary:"):]
    print("Master Audio Loudness Verification:\n" + summary.strip())

if __name__ == "__main__":
    bgm_file = synthesize_bgm_and_sfx()
    voice_file = os.path.join(AUDIO_DIR, "voice_59s.wav")
    mix_and_normalize(bgm_file, voice_file)
