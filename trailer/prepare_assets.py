#!/usr/bin/env python3
"""
Prepare voice audio, exact timeline.json, voice_script.txt, and Vietnamese subtitles (.srt & .ass)
for the 59.00-second (1,770 frames @ 30 FPS) HAMIC Trailer.
"""
import glob
import json
import math
import os
import subprocess
import wave
import struct

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TRAILER_DIR = os.path.join(ROOT, "trailer")
AUDIO_DIR = os.path.join(TRAILER_DIR, "audio")
SUB_DIR = os.path.join(TRAILER_DIR, "subtitles")
OUTPUT_DIR = os.path.join(TRAILER_DIR, "output")
QA_DIR = os.path.join(TRAILER_DIR, "qa")

for d in (TRAILER_DIR, AUDIO_DIR, SUB_DIR, OUTPUT_DIR, QA_DIR, os.path.join(QA_DIR, "frames")):
    os.makedirs(d, exist_ok=True)

OFFICIAL_SCRIPT = """Một ngày của thành viên Câu lạc bộ Toán Tin Hamic có gì ?

Hôm nay, bạn phải chạy giữa HUS và USSH để cứu một đêm hội sắp bắt đầu.

Đầu tiên, hàng đèn lệch đúng một nhịp. Rồi hai file trùng tên nhưng nội dung khác nhau. Gương đặt ngược, lời ghi biến mất, và bản chốt... chẳng ai nhớ đã chốt bản nào!

Tám quyết định đang chờ. Kiểm tra ma trận để căn lại chùm sáng. Dùng giải tích để chỉnh đường bay. Lần theo đường đi bằng đồ thị. Tìm lỗi đồng bộ trong đống dữ liệu. Xếp drone, ghép chú thích, rồi thử xem... có nên thêm một chùm pháo nữa không?

Chọn đại một tí chắc chẳng sao nhỉ?

Ba... hai... một... Chạy mô phỏng!

Khoan! Sao một con số sai lại khiến cả hai dãy nhà bật khỏi mặt đất? HUS bay trước, USSH bay theo! Ai bảo thêm pháo đấy?!

Yên tâm, đây chỉ là hoạt hình mô phỏng. Hai trường ngoài đời vẫn nguyên vẹn.

Đêm Toán Tin sẽ được công bố ngày mùng một tháng mười một, tại gian hàng Câu lạc bộ Toán Tin Hamic, cơ sở Nguyễn Trãi tại sự kiện chào tân của HUS.

Giờ đến lượt bạn: thắp sáng đêm hội... hay biến hai trường thành trạm phóng?
"""

with open(os.path.join(TRAILER_DIR, "voice_script.txt"), "w", encoding="utf-8") as f:
    f.write(OFFICIAL_SCRIPT)

# Exact 41 speech segments from ElevenLabs_2026-10-31T13_01_59_Nhật Phong...v4.mp3 (63.791s)
# Each entry: (id, scene_id, orig_start, orig_end, target_start, tempo, text)
RAW_SEGMENTS = [
    # SCENE 01 — HOOK (0.00 - 3.80s)
    (1,  "S01",  0.000,  2.562,  0.18, 1.03, "Một ngày của thành viên Câu lạc bộ Toán Tin Hamic"),
    (2,  "S01",  3.169,  3.508,  2.95, 1.00, "có gì?"),

    # SCENE 02 — NHIỆM VỤ (3.80 - 7.80s)
    (3,  "S02",  3.844,  6.163,  3.88, 1.05, "Hôm nay, bạn phải chạy giữa HUS và USSH"),
    (4,  "S02",  6.344,  7.822,  6.22, 1.05, "để cứu một đêm hội sắp bắt đầu."),

    # SCENE 03 — BỐN SỰ CỐ (7.80 - 15.80s)
    (5,  "S03",  8.396,  8.789,  7.92, 1.08, "Đầu tiên,"),
    (6,  "S03",  9.189,  9.730,  8.38, 1.08, "hàng đèn lệch"),
    (7,  "S03",  9.895, 10.353,  8.96, 1.08, "đúng một nhịp."),
    (8,  "S03", 10.918, 13.417,  9.68, 1.12, "Rồi hai file trùng tên nhưng nội dung khác nhau."),
    (9,  "S03", 13.863, 14.445, 12.12, 1.10, "Gương đặt ngược,"),
    (10, "S03", 14.865, 15.609, 12.82, 1.10, "lời ghi biến mất,"),
    (11, "S03", 16.079, 16.838, 13.68, 1.10, "và bản chốt..."),
    (12, "S03", 17.229, 18.573, 14.48, 1.10, "chẳng ai nhớ đã chốt bản nào!"),

    # SCENE 04 — TÁM QUYẾT ĐỊNH (15.80 - 31.00s)
    (13, "S04", 19.089, 20.092, 15.95, 1.00, "Tám quyết định đang chờ."),
    (14, "S04", 20.516, 22.413, 17.20, 1.00, "Kiểm tra ma trận để căn lại chùm sáng."),
    (15, "S04", 22.827, 24.313, 19.45, 1.00, "Dùng giải tích để chỉnh đường bay."),
    (16, "S04", 24.727, 26.023, 21.30, 1.00, "Lần theo đường đi bằng đồ thị."),
    (17, "S04", 26.448, 28.001, 22.95, 1.00, "Tìm lỗi đồng bộ trong đống dữ liệu."),
    (18, "S04", 28.400, 28.994, 25.60, 1.00, "Xếp drone,"),
    (19, "S04", 29.264, 29.754, 26.80, 1.00, "ghép chú thích,"),
    (20, "S04", 30.173, 31.032, 27.85, 1.00, "rồi thử xem..."),
    (21, "S04", 31.415, 32.883, 28.95, 1.00, "có nên thêm một chùm pháo nữa không?"),

    # SCENE 05 — CHỌN ĐẠI (31.00 - 35.00s)
    (22, "S05", 33.302, 34.987, 31.15, 1.00, "Chọn đại một tí chắc chẳng sao nhỉ?"),

    # SCENE 06 — CHẠY MÔ PHỎNG (35.00 - 38.00s)
    (23, "S06", 35.535, 35.833, 35.08, 1.00, "Ba..."),
    (24, "S06", 36.253, 36.560, 35.78, 1.00, "hai..."),
    (25, "S06", 36.950, 37.131, 36.48, 1.00, "một..."),
    (26, "S06", 37.556, 38.139, 37.05, 1.00, "Chạy mô phỏng!"),

    # SCENE 07 — SỰ CỐ E2 (38.00 - 46.00s)
    (27, "S07", 38.590, 38.841, 38.12, 1.00, "Khoan!"),
    (28, "S07", 39.280, 42.014, 38.65, 1.00, "Sao một con số sai lại khiến cả hai dãy nhà bật khỏi mặt đất?"),
    (29, "S07", 42.467, 43.335, 41.68, 1.00, "HUS bay trước,"),
    (30, "S07", 43.723, 44.800, 42.82, 1.00, "USSH bay theo!"),
    (31, "S07", 45.204, 46.037, 44.25, 1.00, "Ai bảo thêm pháo đấy?!"),

    # SCENE 08 — BÌNH TĨNH (46.00 - 49.80s)
    (32, "S08", 46.521, 47.140, 46.08, 1.05, "Yên tâm,"),
    (33, "S08", 47.429, 48.720, 46.82, 1.05, "đây chỉ là hoạt hình mô phỏng."),
    (34, "S08", 49.076, 50.560, 48.22, 1.05, "Hai trường ngoài đời vẫn nguyên vẹn."),

    # SCENE 09 — THÔNG BÁO SỰ KIỆN (49.80 - 55.65s)
    (35, "S09", 51.034, 53.436, 49.90, 1.15, "Đêm Toán Tin sẽ được công bố ngày mùng một tháng mười một,"),
    (36, "S09", 53.765, 55.448, 52.12, 1.15, "tại gian hàng Câu lạc bộ Toán Tin Hamic,"),
    (37, "S09", 55.803, 56.648, 53.70, 1.15, "cơ sở Nguyễn Trãi"),
    (38, "S09", 56.964, 58.662, 54.52, 1.15, "tại sự kiện chào tân của HUS."),

    # SCENE 10 — FINAL CTA (55.65 - 59.00s)
    (39, "S10", 59.131, 59.938, 55.85, 1.14, "Giờ đến lượt bạn:"),
    (40, "S10", 60.435, 61.367, 56.68, 1.14, "thắp sáng đêm hội..."),
    (41, "S10", 61.774, 63.537, 57.60, 1.14, "hay biến hai trường thành trạm phóng?"),
]

SCENES = [
    {
        "id": "S01",
        "title": "HOOK — MỘT NGÀY Ở HAMIC?",
        "start": 0.0,
        "end": 3.8,
        "startFrame": 0,
        "endFrame": 114,
        "voice": "Một ngày của thành viên Câu lạc bộ Toán Tin Hamic có gì ?",
        "camera": "Aerial establishing shot over USSH × HUS night campus -> energetic dolly-in toward central core",
        "visual": "Night campus awakens with golden spark, 6 circuit beacons ignite sequentially, HAMIC logo and title card."
    },
    {
        "id": "S02",
        "title": "NHIỆM VỤ — CHẠY GIỮA HUS VÀ USSH",
        "start": 3.8,
        "end": 7.8,
        "startFrame": 114,
        "endFrame": 234,
        "voice": "Hôm nay, bạn phải chạy giữa HUS và USSH để cứu một đêm hội sắp bắt đầu.",
        "camera": "Dynamic low-altitude tracking shot following the low-poly HAMIC runner from HUS across to USSH",
        "visual": "Glowing golden-cyan light path connects HUS to USSH; student character runs past NPCs; ĐÊM HỘI SẮP BẮT ĐẦU HUD."
    },
    {
        "id": "S03",
        "title": "BỐN SỰ CỐ — ĐIỀU TRA LỖI",
        "start": 7.8,
        "end": 15.8,
        "startFrame": 234,
        "endFrame": 474,
        "voice": "Đầu tiên, hàng đèn lệch đúng một nhịp. Rồi hai file trùng tên nhưng nội dung khác nhau. Gương đặt ngược, lời ghi biến mất, và bản chốt... chẳng ai nhớ đã chốt bản nào!",
        "camera": "4 rapid-cut action shots across HUS lawn, HUS gate, mirror roof, and USSH archive",
        "visual": "Shot A (7.8-9.65s): LED pillar #6 fires out of beat in red. Shot B (9.65-12.05s): Two floating 3D files with same name but mismatched line 4. Shot C (12.05-13.6s): Reversed 3D mirror deflects laser beam off-target with red vector. Shot D (13.6-15.8s): Note board dissolves into 404 NOTE NOT FOUND & conflicting final schedules."
    },
    {
        "id": "S04",
        "title": "TÁM QUYẾT ĐỊNH — MONTAGE 01/08 ĐẾN 08/08",
        "start": 15.8,
        "end": 31.0,
        "startFrame": 474,
        "endFrame": 930,
        "voice": "Tám quyết định đang chờ. Kiểm tra ma trận để căn lại chùm sáng. Dùng giải tích để chỉnh đường bay. Lần theo đường đi bằng đồ thị. Tìm lỗi đồng bộ trong đống dữ liệu. Xếp drone, ghép chú thích, rồi thử xem... có nên thêm một chùm pháo nữa không?",
        "camera": "Fast whip-pans and orbits across the 8 decision stations with 3D mathematical overlays",
        "visual": "01/08 ha (2x2 matrix beam alignment), 02/08 firework (calculus limit trajectory to 70m), 03/08 final (shortest path graph on campus), 04/08 version (hash comparison), 05/08 notes (_ghichu sync fix), 06/08 drones (7x10=70 formation), 07/08 captions (USSH photo-caption match), 08/08 bursts (tempting extra firework option)."
    },
    {
        "id": "S05",
        "title": "CHỌN ĐẠI — RISK LEVEL 99%",
        "start": 31.0,
        "end": 35.0,
        "startFrame": 930,
        "endFrame": 1050,
        "voice": "Chọn đại một tí chắc chẳng sao nhỉ?",
        "camera": "Tense push-in on decision console + micro-shake on click",
        "visual": "Cursor hesitates, clicks THÊM PHÁO, system gauges overload, fictional trailer HUD shows 'Risk level: 99%' and 'Looks fine :)'."
    },
    {
        "id": "S06",
        "title": "CHẠY MÔ PHỎNG — COUNTDOWN 3 - 2 - 1",
        "start": 35.0,
        "end": 38.0,
        "startFrame": 1050,
        "endFrame": 1140,
        "voice": "Ba... hai... một... Chạy mô phỏng!",
        "camera": "Wide panoramic shot of both HUS and USSH campuses",
        "visual": "Countdown 3 -> 2 -> 1 -> CHẠY MÔ PHỎNG! Beams from all buildings converge into the core, energy ring sweeps across ground, audio ducks before impact."
    },
    {
        "id": "S07",
        "title": "SỰ CỐ E2 — HUS BAY TRƯỚC, USSH BAY THEO",
        "start": 38.0,
        "end": 46.0,
        "startFrame": 1140,
        "endFrame": 1380,
        "voice": "Khoan! Sao một con số sai lại khiến cả hai dãy nhà bật khỏi mặt đất? HUS bay trước, USSH bay theo! Ai bảo thêm pháo đấy?!",
        "camera": "Wide two-campus framing with tilt-up following the rising buildings",
        "visual": "Cartoon ink-ring pop at 38.0s. HUS buildings detach and float upward FIRST (38.15-41.2s), then USSH buildings launch upward SECOND (41.2-46.0s). Drones swerve to dodge rising buildings; colorful confetti rains in background."
    },
    {
        "id": "S08",
        "title": "BÌNH TĨNH — CHỈ LÀ MÔ PHỎNG & REWIND",
        "start": 46.0,
        "end": 49.8,
        "startFrame": 1380,
        "endFrame": 1494,
        "voice": "Yên tâm, đây chỉ là hoạt hình mô phỏng. Hai trường ngoài đời vẫn nguyên vẹn.",
        "camera": "Freeze-frame at peak float height -> smooth rewind pull-back",
        "visual": "Freeze frame with 'SIMULATION ONLY — CHỈ LÀ MÔ PHỎNG' and 'Đây chỉ là hoạt hình mô phỏng. Hai trường ngoài đời vẫn nguyên vẹn.' Then buildings smoothly rewind back to ground and campus lights restore."
    },
    {
        "id": "S09",
        "title": "THÔNG BÁO SỰ KIỆN — CÔNG BỐ 01.11",
        "start": 49.8,
        "end": 55.65,
        "startFrame": 1494,
        "endFrame": 1670,
        "voice": "Đêm Toán Tin sẽ được công bố ngày mùng một tháng mười một, tại gian hàng Câu lạc bộ Toán Tin Hamic, cơ sở Nguyễn Trãi tại sự kiện chào tân của HUS.",
        "camera": "Majestic crane pull-back revealing full E3 light bridge, E1 golden fireworks, and 70 drone formation",
        "visual": "Bridge of light connects HUS and USSH, golden fireworks bloom, HAMIC logo and motion typography: CÔNG BỐ 01.11 / ĐÊM TOÁN TIN / Gian hàng CLB Toán Tin Hamic / Sự kiện Chào Tân HUS — Cơ sở Nguyễn Trãi."
    },
    {
        "id": "S10",
        "title": "FINAL CTA — BẠN SẼ CHỌN KẾT CỤC NÀO?",
        "start": 55.65,
        "end": 59.0,
        "startFrame": 1670,
        "endFrame": 1770,
        "voice": "Giờ đến lượt bạn: thắp sáng đêm hội... hay biến hai trường thành trạm phóng?",
        "camera": "Dual-camera 3D split screen (Left: Festive Show, Right: Launching Campus) with solid End Card",
        "visual": "Split screen comparing Festive Campus vs Toy Rocket Campus, centered HAMIC logo and 'BẠN SẼ CHỌN KẾT CỤC NÀO?' held cleanly until 59.00s."
    }
]

SUBTITLES = [
    (0.18,  3.55, "Một ngày của thành viên CLB Toán Tin Hamic có gì?"),
    (3.88,  7.65, "Hôm nay, bạn phải chạy giữa HUS và USSH\nđể cứu một đêm hội sắp bắt đầu."),
    (7.92,  9.60, "Đầu tiên, hàng đèn lệch đúng một nhịp."),
    (9.68, 12.05, "Rồi hai file trùng tên nhưng nội dung khác nhau."),
    (12.12, 15.72, "Gương đặt ngược, lời ghi biến mất,\nvà bản chốt... chẳng ai nhớ đã chốt bản nào!"),
    (15.95, 17.15, "Tám quyết định đang chờ."),
    (17.20, 19.35, "Kiểm tra ma trận để căn lại chùm sáng."),
    (19.45, 21.20, "Dùng giải tích để chỉnh đường bay."),
    (21.30, 22.85, "Lần theo đường đi bằng đồ thị."),
    (22.95, 25.45, "Tìm lỗi đồng bộ trong đống dữ liệu."),
    (25.60, 27.75, "Xếp drone, ghép chú thích,"),
    (27.85, 30.85, "rồi thử xem... có nên thêm một chùm pháo nữa không?"),
    (31.15, 34.60, "Chọn đại một tí chắc chẳng sao nhỉ?"),
    (35.05, 37.85, "Ba... hai... một... Chạy mô phỏng!"),
    (38.10, 41.55, "Khoan! Sao một con số sai lại khiến\ncả hai dãy nhà bật khỏi mặt đất?"),
    (41.68, 44.10, "HUS bay trước, USSH bay theo!"),
    (44.25, 45.80, "Ai bảo thêm pháo đấy?!"),
    (46.08, 49.68, "Yên tâm, đây chỉ là hoạt hình mô phỏng.\nHai trường ngoài đời vẫn nguyên vẹn."),
    (49.90, 53.62, "Đêm Toán Tin sẽ được công bố ngày 01/11\ntại gian hàng CLB Toán Tin Hamic,"),
    (53.70, 55.60, "cơ sở Nguyễn Trãi — sự kiện chào tân của HUS."),
    (55.85, 58.90, "Giờ đến lượt bạn: thắp sáng đêm hội...\nhay biến hai trường thành trạm phóng?"),
]

def fmt_srt_time(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    ms %= 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def fmt_ass_time(seconds: float) -> str:
    cs = int(round(seconds * 100))
    h = cs // 360000
    cs %= 360000
    m = cs // 6000
    cs %= 6000
    s = cs // 100
    cs %= 100
    return f"{h:01d}:{m:02d}:{s:02d}.{cs:02d}"

srt_lines = []
for i, (st, en, text) in enumerate(SUBTITLES, 1):
    srt_lines.append(f"{i}\n{fmt_srt_time(st)} --> {fmt_srt_time(en)}\n{text}\n")

with open(os.path.join(SUB_DIR, "trailer.srt"), "w", encoding="utf-8") as f:
    f.write("\n".join(srt_lines))

ass_header = """[Script Info]
Title: HAMIC Trailer 59s Vietnamese Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Be Vietnam Pro,40,&H00FBF1EE,&H005ED2FF,&H00120907,&H96120907,-1,0,0,0,100,100,0,0,3,2.5,1.5,2,80,80,32,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ass_events = []
for st, en, text in SUBTITLES:
    clean_txt = text.replace("\n", "\\N")
    ass_events.append(f"Dialogue: 0,{fmt_ass_time(st)},{fmt_ass_time(en)},Default,,0,0,0,,{clean_txt}")

with open(os.path.join(SUB_DIR, "trailer.ass"), "w", encoding="utf-8") as f:
    f.write(ass_header + "\n".join(ass_events) + "\n")

def build_voice_track():
    voice_files = glob.glob(os.path.join(ROOT, "assets", "voice", "*.mp3"))
    if not voice_files:
        print("WARNING: No voice file found! Creating silent placeholder.")
        return False, None

    voice_path = voice_files[0]
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", voice_path],
        capture_output=True, text=True, encoding="utf-8"
    )
    info = json.loads(probe.stdout)
    raw_duration = float(info["format"]["duration"])
    print(f"Found voice file: {os.path.basename(voice_path)} (raw duration: {raw_duration:.3f}s)")

    # Decode raw voice to 48kHz mono float/int16 WAV first
    raw_wav = os.path.join(AUDIO_DIR, "_raw_voice.wav")
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", voice_path, "-ar", "48000", "-ac", "1", raw_wav],
        check=True
    )

    sr = 48000
    total_samples = 59 * sr
    master = [0.0] * total_samples

    # Check if this is the 63.79s official v4 voice file (within 1.5s tolerance)
    if abs(raw_duration - 63.791) < 1.5:
        print("Using calibrated 41-segment natural prosody alignment -> 59.00s...")
        for seg_id, sc_id, o_start, o_end, t_start, tempo, txt in RAW_SEGMENTS:
            pad_s = max(0.0, o_start - 0.03)
            pad_e = min(raw_duration, o_end + 0.04)
            seg_wav = os.path.join(AUDIO_DIR, f"_seg_{seg_id:02d}.wav")
            af_chain = f"atrim=start={pad_s:.4f}:end={pad_e:.4f},asetpts=PTS-STARTPTS"
            if abs(tempo - 1.0) > 0.005:
                af_chain += f",atempo={tempo:.4f}"
            subprocess.run(
                ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", raw_wav, "-af", af_chain, "-ar", str(sr), "-ac", "1", seg_wav],
                check=True
            )
            with wave.open(seg_wav, "rb") as wf:
                n_frames = wf.getnframes()
                raw_bytes = wf.readframes(n_frames)
                samples = struct.unpack(f"<{n_frames}h", raw_bytes)
            fade_len = min(int(0.018 * sr), n_frames // 4)
            dst_start = int(round((t_start - 0.02) * sr))
            for i, val in enumerate(samples):
                idx = dst_start + i
                if 0 <= idx < total_samples:
                    env = 1.0
                    if i < fade_len:
                        env = 0.5 * (1.0 - math.cos(math.pi * i / fade_len))
                    elif i >= n_frames - fade_len:
                        env = 0.5 * (1.0 - math.cos(math.pi * (n_frames - 1 - i) / fade_len))
                    master[idx] += (val / 32768.0) * env
            os.remove(seg_wav)
    else:
        # Generic fallback if user replaces voice file with a different recording
        tempo = max(0.85, min(1.25, raw_duration / 58.2)) if raw_duration > 58.5 else 1.0
        print(f"Custom voice duration {raw_duration:.2f}s -> applying uniform tempo {tempo:.4f}x")
        adj_wav = os.path.join(AUDIO_DIR, "_adj_voice.wav")
        af = f"atempo={tempo:.4f}" if abs(tempo - 1.0) > 0.005 else "anull"
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", raw_wav, "-af", af, "-ar", str(sr), "-ac", "1", adj_wav],
            check=True
        )
        with wave.open(adj_wav, "rb") as wf:
            n_frames = wf.getnframes()
            samples = struct.unpack(f"<{n_frames}h", wf.readframes(n_frames))
            for i in range(min(n_frames, total_samples)):
                master[i] = samples[i] / 32768.0
        os.remove(adj_wav)

    os.remove(raw_wav)

    out_wav = os.path.join(AUDIO_DIR, "voice_59s.wav")
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        buf = bytearray(total_samples * 4)
        for i, v in enumerate(master):
            clamped = max(-0.98, min(0.98, v))
            s16 = int(round(clamped * 32767))
            struct.pack_into("<hh", buf, i * 4, s16, s16)
        wf.writeframes(buf)

    print(f"Saved aligned 59.00s stereo voice track: {out_wav}")
    return True, voice_path

ok, voice_src = build_voice_track()

timeline_segments = []
for seg_id, sc_id, o_start, o_end, t_start, tempo, txt in RAW_SEGMENTS:
    dur = (o_end - o_start) / tempo
    timeline_segments.append({
        "id": seg_id,
        "scene": sc_id,
        "sourceStart": round(o_start, 3),
        "sourceEnd": round(o_end, 3),
        "start": round(t_start, 3),
        "end": round(t_start + dur, 3),
        "duration": round(dur, 3),
        "tempo": tempo,
        "text": txt
    })

timeline_data = {
    "title": "Trailer Animation CLB Toán Tin Hamic — Đêm Toán Tin",
    "durationSeconds": 59.0,
    "fps": 30,
    "totalFrames": 1770,
    "voiceSource": os.path.basename(voice_src) if voice_src else "VOICE_PENDING",
    "voiceRawDurationSeconds": 63.791,
    "voiceAlignedDurationSeconds": 59.0,
    "qaTimestamps": [0, 3, 6, 10, 15, 20, 25, 30, 34, 37, 40, 43, 47, 52, 56, 58],
    "scenes": SCENES,
    "decisions": [
        {"index": "01/08", "id": "ha",       "start": 16.9, "end": 19.35, "topic": "Đại số tuyến tính: Ma trận gương 2×2"},
        {"index": "02/08", "id": "firework", "start": 19.35, "end": 21.25, "topic": "Giải tích: Giới hạn đường bay 70 m"},
        {"index": "03/08", "id": "final",    "start": 21.25, "end": 22.90, "topic": "Lý thuyết đồ thị: Đường đi ngắn nhất HUS–USSH"},
        {"index": "04/08", "id": "version",  "start": 22.90, "end": 24.30, "topic": "Đối chiếu mã băm hai phiên bản trùng tên"},
        {"index": "05/08", "id": "notes",    "start": 24.30, "end": 25.55, "topic": "Khôi phục quy tắc đồng bộ thư mục _ghichu"},
        {"index": "06/08", "id": "drones",   "start": 25.55, "end": 26.75, "topic": "Lập trình khối lệnh: Đội hình 70 drone (7×10)"},
        {"index": "07/08", "id": "captions", "start": 26.75, "end": 27.80, "topic": "Ghép chú thích tư liệu ảnh USSH"},
        {"index": "08/08", "id": "bursts",   "start": 27.80, "end": 31.00, "topic": "Quyết định số chùm pháo hoa cuối cùng"}
    ],
    "voiceSegments": timeline_segments,
    "subtitles": [{"index": i + 1, "start": s, "end": e, "text": t} for i, (s, e, t) in enumerate(SUBTITLES)]
}

with open(os.path.join(TRAILER_DIR, "timeline.json"), "w", encoding="utf-8") as f:
    json.dump(timeline_data, f, ensure_ascii=False, indent=2)

print("Generated trailer/timeline.json, trailer/voice_script.txt, trailer/subtitles/trailer.srt & trailer.ass")
