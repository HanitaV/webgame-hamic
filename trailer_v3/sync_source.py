"""Rebuild V3 from the complete, uncut ElevenLabs take (no speech retiming).

Phrase boundaries follow the source's audible pauses / silencedetect -35dB.
These are phrase cues, not ASR word timestamps. Do not invent karaoke timings.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V3 = ROOT / 'trailer_v3'
FFBIN = Path.home() / 'AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin'
FFMPEG = shutil.which('ffmpeg') or str(FFBIN / 'ffmpeg.exe')
SOURCE = V3 / 'audio/ElevenLabs_2026-10-31T16_19_32_Phan Hưng - Professional & Clear_pvc_sp100_s50_sb75_v4.mp3'
FPS = 30
DURATION = 1820 / FPS
# source seconds -> existing animation seconds. Preserve the choreography while
# placing every task, cut, countdown and blast in the voiceover's timebase.
ANCHORS = [
    [0, 0], [1.125, 1.0], [1.869, 1.8], [3.314, 2.85], [3.884, 3.1],
    [5.513, 5.65], [6.262, 6.3], [8.909, 8.7], [10.134, 9.75],
    [11.460, 10.65], [12.746, 11.35], [14.270, 12.45],
    [15.987, 13.0], [17.552, 15.0], [19.179, 16.4], [21.172, 18.2],
    [23.110, 19.8], [24.802, 21.0], [26.418, 22.2], [28.182, 23.8],
    [29.857, 25.2], [30.683, 27.1], [33.60, 29.74],
    [34.311, 30.10], [35.045, 31.08], [35.727, 32.02], [36.248, 32.72],
    [36.919, 33.0], [39.058, 35.0], [40.479, 37.15], [42.040, 39.6],
    [45.149, 43.0], [49.547, 46.5], [53.829, 49.8],
    [56.808, 53.9], [57.544, 54.45], [58.630, 55.25], [60.345, 58.15],
    [DURATION, 59.0],
]
CUES = [
    (0, .804, 'ĐỪNG BẤM NÚT ĐÓ!'),
    (1.125, 1.409, 'BÙM!'), (1.869, 2.821, 'HUS nổ trước!'),
    (3.314, 3.486, 'Ủa,'), (3.884, 5.067, 'USSH cũng nổ theo?!'),
    (5.513, 5.789, 'Tua lại!'), (6.262, 7.197, 'Đêm hội chưa bắt đầu,'),
    (7.427, 8.578, 'hệ thống đã báo bốn lỗi!'),
    (8.909, 9.727, 'Đèn LED loạn nhịp!'), (10.134, 11.172, 'File kịch bản trùng tên!'),
    (11.460, 12.269, 'Gương phản xạ ngược!'), (12.746, 13.174, 'Ghi chú...'),
    (13.463, 13.878, 'bốc hơi!'), (14.271, 14.766, 'Tám nhiệm vụ!'),
    (14.965, 15.571, 'Speedrun!'),
    (15.987, 17.163, 'Một: đồng bộ đèn LED!'),
    (17.552, 18.858, 'Hai: ma trận xoay gương!'),
    (19.179, 20.885, 'Ba: đạo hàm chỉnh quỹ đạo pháo!'),
    (21.172, 22.717, 'Bốn: đồ thị tìm lối ngắn nhất!'),
    (23.110, 24.535, 'Năm: mã băm, xóa trùng!'),
    (24.802, 26.128, 'Sáu: khôi phục ghi chú!'),
    (26.418, 27.864, 'Bảy: bảy mươi drone vào đội hình!'),
    (28.182, 29.476, 'Tám: ghép khung ảnh kỷ niệm!'),
    (29.857, 30.139, 'Xong!'), (30.683, 31.504, 'Ơ, nút gì đây?'),
    (31.916, 32.587, 'THÊM PHÁO?'), (32.997, 33.891, 'Bấm thử thôi mà!'),
    (34.311, 34.625, 'Ba...'), (35.045, 35.378, 'hai...'),
    (35.727, 35.912, 'một...'), (36.248, 36.475, 'BẮN!'),
    (36.919, 37.131, 'Khoan,'), (37.441, 38.684, 'sao nền sân rung dữ vậy?!'),
    (39.058, 40.161, 'HUS nổ tung trước!'), (40.479, 41.738, 'USSH cũng nổ theo!'),
    (42.040, 43.021, 'Cả hai trường nổ tung!'),
    (43.410, 44.733, 'Ai tăng lực pháo lên một nghìn vậy?!'),
    (45.149, 45.616, 'Bình tĩnh!'), (45.941, 47.133, 'Đây chỉ là game mô phỏng.'),
    (47.565, 48.926, 'Hai trường ngoài đời vẫn nguyên vẹn.'),
    (49.547, 50.491, 'Ngày mùng một tháng mười một,'),
    (50.852, 52.382, 'HAMIC trình làng Đêm Toán Tin'),
    (52.525, 53.486, 'tại gian hàng câu lạc bộ,'),
    (53.829, 55.411, 'trong sự kiện Chào Tân HUS,'),
    (55.610, 56.398, 'cơ sở Nguyễn Trãi.'),
    (56.808, 57.141, 'Còn bạn?'), (57.544, 58.242, 'Cứu đêm hội...'),
    (58.630, 60.345, 'hay cho cả hai trường NỔ TUNG?!'),
]

def stamp(ms, sep=','):
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, milli = divmod(rem, 1000)
    return f'{h:02}:{m:02}:{s:02}{sep}{milli:03}'

def main():
    pages = []
    for i, (start, end, text) in enumerate(CUES):
        # Hold through a short pause, never overlap the next phrase.
        next_start = CUES[i + 1][0] if i + 1 < len(CUES) else DURATION
        pages.append(dict(pageIndex=i, clauseId=i+1, section='source', text=text,
                          startMs=round(start*1000),
                          endMs=round(min(end+.10, next_start)*1000), tokens=[]))
    data = dict(source=SOURCE.name, timingMethod='source-pause phrase cues; no word interpolation',
                durationSec=DURATION, fps=FPS, totalFrames=1820, anchors=ANCHORS,
                tokens=[], pages=pages)
    for p in [V3/'captions/words.json', ROOT/'web/src/trailer-v3/words-data.json']:
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf8')
    (V3/'timeline.json').write_text(json.dumps(dict(
        source=SOURCE.name, durationSec=DURATION, fps=FPS, totalFrames=1820,
        audioPolicy='Complete source at 1x, starting at t=0; no clause splicing',
        anchors=[dict(sourceSec=a, storyboardSec=b) for a,b in ANCHORS],
        captions=pages), ensure_ascii=False, indent=2), encoding='utf8')
    (V3/'beat_markers.json').write_text(json.dumps(dict(
        timebase='source audio seconds',
        tasks=[15.987,17.552,19.179,21.172,23.110,24.802,26.418,28.182],
        countdown=[34.311,35.045,35.727,36.248],
        explosions=[1.125,3.884,39.058,40.479,42.040],
        relief=45.149, event=49.547, cta=56.808), indent=2), encoding='utf8')
    (V3/'VOICE_FOR_TTS.txt').write_text('\n'.join(c[2] for c in CUES)+'\n', encoding='utf8')
    (V3/'approved_text.json').write_text(json.dumps(dict(
        source='User supplied script', phrases=[c[2] for c in CUES]),
        ensure_ascii=False, indent=2), encoding='utf8')
    for ext, sep in [('srt', ','), ('vtt', '.')]:
        blocks = ['WEBVTT\n'] if ext == 'vtt' else []
        for i, p in enumerate(pages):
            blocks.append(f"{i+1}\n{stamp(p['startMs'],sep)} --> {stamp(p['endMs'],sep)}\n{p['text']}\n")
        (V3/f'captions/captions.{ext}').write_text('\n'.join(blocks), encoding='utf8')
    if '--metadata-only' in sys.argv:
        return
    # Speech remains complete at 1x; music is ducked by the same source voice.
    bgm = next((V3/'audio').glob('Zachz*.m4a'))
    subprocess.run([FFMPEG, '-y', '-v', 'error', '-i', str(SOURCE), '-stream_loop', '-1',
        '-i', str(bgm), '-filter_complex',
        '[0:a]aresample=48000,apad,asplit=2[voice][key];'
        '[1:a]aresample=48000,volume=0.10[bg];'
        '[bg][key]sidechaincompress=threshold=0.025:ratio=8:attack=10:release=180[duck];'
        '[voice][duck]amix=inputs=2:normalize=0,alimiter=limit=0.95[out]',
        '-map','[out]','-t',str(DURATION),'-ac','2','-c:a','pcm_s16le',
        str(V3/'audio/master_synced.wav')], check=True)
    print(f'Wrote {len(pages)} phrase cues; uncut source; {DURATION:.3f}s / 1820 frames.')

if __name__ == '__main__':
    main()
