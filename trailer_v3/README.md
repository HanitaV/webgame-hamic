# Trailer V3 — bản đồng bộ audio gốc

Bản mới dùng trọn file `audio/ElevenLabs_2026-10-31T16_19_32_Phan Hưng - Professional & Clear_pvc_sp100_s50_sb75_v4.mp3`, bắt đầu tại giây 0, tốc độ 1×. Audio gốc dài 60,604 giây; video dài 60,667 giây (1.820 khung hình ở 30 fps), có đệm cuối để đủ khung hình.

## Video mới

- `output/Hamic_Trailer_V3_Reels_synced.mp4`: dọc 1080×1920, có sub.
- `output/Hamic_Trailer_V3_Reels_synced_clean.mp4`: dọc 1080×1920, không sub lời đọc.
- `output/Hamic_Trailer_V3_16x9_synced.mp4`: ngang 1920×1080, có sub.
- `preview/preview_720p.mp4`: xem nhanh bản mới.
- `captions/captions.srt` và `captions/captions.vtt`: phụ đề rời theo cùng mốc thời gian.

Các video mang tên `59s` và `Hamic_Trailer_V3_16x9.mp4` là bản cũ, được giữ lại để đối chiếu. Dùng các file có hậu tố `synced`.

## Cách dựng lại

Chạy từ thư mục gốc, với Python, FFmpeg, Node và các dependency trong `web` đã có sẵn:

```powershell
python trailer_v3/build_audio_and_captions.py
node web/scripts/render-trailer-v3.mjs --gate A
node web/scripts/render-trailer-v3.mjs --gate C
node web/scripts/render-trailer-v3.mjs --gate B
```

FFmpeg cần có trong PATH khi chạy Node. Script Python cũng tìm được bản FFmpeg cài bằng WinGet trên máy này.

`sync_source.py` là nguồn duy nhất của các mốc audio, cụm phụ đề và bảng ánh xạ thời gian. Script sinh `timeline.json`, `beat_markers.json`, script lời đọc và dữ liệu phụ đề cho renderer. Lệnh cũ `build_audio_and_captions.py` chuyển tiếp sang script mới; không còn cắt ghép câu theo kịch bản cũ.

Cảnh 3D, camera và thẻ nội dung dùng chung bảng ánh xạ từ audio gốc sang các động tác của storyboard. Sub dùng trực tiếp thời gian audio gốc, không qua ánh xạ này. Các mốc gắn với khoảng ngắt âm trong file nguồn; sub hiển thị theo cụm câu, không giả lập thời điểm từng từ. Không có ASR/forced alignment khả dụng trong môi trường này.

Giọng đọc được giữ nguyên, nhạc nền hạ tự động khi có lời. Không dùng lại track SFX cũ vì các mốc hiệu ứng của track đó thuộc timeline cũ. Cảnh 3D chạy trên NVIDIA RTX 3060; FFmpeg dùng CUDA decode. NVENC của FFmpeg 9 yêu cầu driver mới hơn driver 527.99 hiện cài, nên encoder dùng libx264 và ghi rõ điều này trong log.

`qa/sync-render-*.log`, `qa/gate_a_telemetry.json`, `qa/contact_sheet.jpg` và `qa/QA_REPORT.md` lưu kết quả kiểm tra.
