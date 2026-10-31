# Pipeline Sản Xuất Trailer Hoạt Hình 3D Hamic — 59 Giây

Thư mục này chứa toàn bộ kịch bản, bảng phân cảnh, phụ đề, âm thanh master, báo cáo QA và video đầu ra cho trailer hoạt hình 3D dài **59.00 giây (`1,770` frame @ `30` FPS)** của trò chơi tương tác **Đêm Toán Tin** (**Câu lạc bộ Toán Tin Hamic** — `USSH × HUS`).

---

## 1. Cấu Trúc Thư Mục & Mã Nguồn

```text
webgame-hamic/
├── trailer/
│   ├── output/
│   │   ├── hamic_trailer_59s_final.mp4      # Bản chính thức 1920x1080 @ 30fps (có phụ đề tiếng Việt)
│   │   ├── hamic_trailer_59s_no_subs.mp4    # Bản sạch 1920x1080 @ 30fps (không phụ đề)
│   │   ├── hamic_trailer_59s_preview.mp4    # Bản xem nhanh 1280x720 @ 30fps
│   │   └── contact_sheet.jpg                # Lưới 4x4 gồm 16 mốc kiểm tra hình ảnh
│   ├── qa/
│   │   ├── render_report.md                 # Báo cáo kỹ thuật GPU, FFprobe, EBU R128 & QA
│   │   └── frames/                          # 16 ảnh chụp QA (0s, 3s, ..., 58s) ở 1920x1080
│   ├── subtitles/
│   │   ├── trailer.srt                      # Phụ đề chuẩn SubRip (.srt)
│   │   └── trailer.ass                      # Phụ đề Advanced SubStation Alpha (.ass)
│   ├── audio/
│   │   ├── voice_59s.wav                    # Voiceover đã căn chuẩn nhịp 59.00s (48kHz stereo)
│   │   ├── sfx_bgm_59s.wav                  # Nhạc nền điện tử + SFX thủ tục 59.00s
│   │   ├── trailer_master_59s.wav           # Bản trộn master (-16.1 LUFS, -1.7 dBTP, ducking)
│   │   └── trailer_master_59s.m4a           # Bản trộn master AAC 192kbps
│   ├── prepare_assets.py                    # Script phân tích voice, căn timecode & sinh SRT/ASS/timeline
│   ├── synthesize_audio.py                  # Script tổng hợp BGM + SFX, sidechain ducking & chuẩn hóa LUFS
│   ├── timeline.json                        # Dữ liệu timecode chi tiết của 10 scene & 21 câu thoại
│   ├── storyboard.md                        # Bảng phân cảnh đạo diễn chi tiết
│   ├── voice_script.txt                     # Lời bình chuẩn của trailer
│   └── README.md                            # Tài liệu hướng dẫn này
└── web/
    ├── render-trailer.html                  # Trang entry offline dùng riêng cho việc xuất trailer
    ├── scripts/
    │   └── render-trailer.mjs               # Pipeline Playwright + GPU WebGL2 + CUDA/FFmpeg
    └── src/trailer/
        ├── main.ts                          # Khởi tạo scene, font Be Vietnam Pro & window.__trailer
        ├── director.ts                      # Điều phối fixed-clock (frameIndex / 30), Bloom & Split-Screen
        ├── camera.ts                        # Spline camera & easing không xuyên vật thể cho 10 scene
        ├── shots.ts                         # Dựng & cập nhật 3D rig (HUS bay trước, USSH bay theo, 8 quyết định...)
        ├── hud.ts                           # Motion graphics 2D, công thức Toán-Tin, hộp thoại lựa chọn & End Card
        └── timeline.ts                      # Định nghĩa mốc thời gian 10 scene và 8 quyết định
```

---

## 2. Hướng Dẫn Render Lại Từ Đầu

Yêu cầu môi trường:
- **Node.js** `>= 20`, **Python** `>= 3.10`, **FFmpeg** (có trong `PATH`), trình duyệt **Google Chrome** và GPU rời hỗ trợ WebGL2 / D3D11.

### Bước 1: Chuẩn bị Voice, Timeline & Phụ đề
```powershell
python -X utf8 trailer/prepare_assets.py
```

### Bước 2: Tổng hợp BGM + SFX & Trộn Audio Master (`-16 LUFS`)
```powershell
python -X utf8 trailer/synthesize_audio.py
```

### Bước 3: Kiểm tra nhanh 16 khung hình QA & Contact Sheet (`~10 giây`)
```powershell
cd web
node scripts/render-trailer.mjs --qa-only
```

### Bước 4: Render toàn bộ 1.770 frame (`59.00s`) ra 3 file MP4 hoàn chỉnh
```powershell
cd web
node scripts/render-trailer.mjs
```

---

## 3. Thay Thế File Voice Mới Mà Không Cần Viết Lại Animation

Nếu có bản thu âm mới:
1. Đặt file `.mp3` hoặc `.wav` mới vào `assets/voice/` và cập nhật đường dẫn `VOICE_SRC` trong `trailer/prepare_assets.py`.
2. Chạy lại `python -X utf8 trailer/prepare_assets.py` và `python -X utf8 trailer/synthesize_audio.py` để tự động đồng bộ lại `voice_59s.wav` và `trailer_master_59s.wav`.
3. Chạy `cd web; node scripts/render-trailer.mjs` để xuất lại bộ 3 video MP4.

