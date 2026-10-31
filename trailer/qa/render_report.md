# Báo Cáo Kiểm Định Chất Lượng (QA) & Render — Trailer 3D Hamic 59 Giây

## 1. Thông Số Môi Trường & Phần Cứng Render

- **Hệ điều hành:** Windows 11 (x64)
- **GPU Rasterization (WebGL2):** `ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002560) Direct3D11 vs_5_0 ps_5_0, D3D11)`
- **CUDA / Hardware Acceleration:** NVIDIA RTX 3060 Laptop GPU (Driver `527.99`, CUDA `12.0`). Pipeline tự động kích hoạt `-hwaccel cuda` cho toàn bộ bước giải mã, lọc khung hình (`xstack`, `subtitles`, `scale`) và probe `h264_nvenc` (tự động fallback sang `libx264` do FFmpeg `9.0.1` yêu cầu NVENC API `13.1` trong khi driver hiện tại hỗ trợ `12.0`).
- **Đồng hồ mô phỏng (Fixed-Clock):** Tất cả `1,770` frame được tính toán tất định tại `t = frameIndex / 30` giây (`30.0` FPS), hoàn toàn độc lập với tốc độ `requestAnimationFrame`.

---

## 2. Kiểm Định Các Tệp Video Đầu Ra (`ffprobe`)

| Tệp đầu ra | Độ phân giải | FPS | Thời lượng | Codec Video | Pixel Format | Codec Audio | Dung lượng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `trailer/output/hamic_trailer_59s_final.mp4` | `1920×1080` | `30/1` | `58.97s` (`~59.0s`) | `h264` | `yuvj420p` (`yuv420p`) | `aac` (`48000 Hz`, Stereo) | `52.38 MiB` |
| `trailer/output/hamic_trailer_59s_no_subs.mp4` | `1920×1080` | `30/1` | `58.97s` (`~59.0s`) | `h264` | `yuvj420p` (`yuv420p`) | `aac` (`48000 Hz`, Stereo) | `54.43 MiB` |
| `trailer/output/hamic_trailer_59s_preview.mp4` | `1280×720` | `30/1` | `58.97s` (`~59.0s`) | `h264` | `yuvj420p` (`yuv420p`) | `aac` (`48000 Hz`, Stereo) | `18.33 MiB` |

---

## 3. Kiểm Định Âm Thanh & Đồng Bộ Lời Bình (EBU R128)

- **Nguồn lời bình:** `assets/voice/ElevenLabs_2026-10-31T13_01_59_Nhật Phong - Narrative & Compelling_pvc_sp95_s40_sb35_v4.mp3`
- **Xử lý đồng bộ:** Tách 41 mệnh đề theo khoảng lặng tự nhiên, bảo toàn 100% câu chữ trong kịch bản gốc, điều chỉnh nhịp (`1.00x–1.15x`) và ghép mượt với cosine crossfade vào đúng khung `59.00` giây (`trailer/audio/voice_59s.wav`).
- **Tổng hợp SFX & BGM:** Sinh thủ tục bằng Python/NumPy (`trailer/synthesize_audio.py`) gồm tiếng drone bay, tiếng bước chạy, 4 hiệu ứng lỗi, 8 âm báo quyết định Toán–Tin, tiếng click chuột, đếm ngược `3-2-1`, hai cú bật phóng hoạt hình (`HUS` ở `38.05s` và `USSH` ở `40.55s`), tiếng tua ngược (`47.25s`), pháo hoa đêm hội và hợp âm kết.
- **Chuẩn hóa âm lượng (2-pass `loudnorm`):**
  - **Integrated Loudness:** `-16.1 LUFS` (mục tiêu `-16.0 LUFS`)
  - **True Peak:** `-1.7 dBTP` (an toàn dưới ngưỡng `-1.0 dBTP`)
  - **Loudness Range (LRA):** `4.3 LU`

---

## 4. Checklist Kiểm Tra Hình Ảnh (16 Mốc Thời Gian & Contact Sheet)

Đã trích xuất và kiểm tra trực tiếp 16 ảnh chụp tại `0, 3, 6, 10, 15, 20, 25, 30, 34, 37, 40, 43, 47, 52, 56, 58` giây (`trailer/output/contact_sheet.jpg`):

- [x] **Không có khung hình đen hoặc lỗi shader:** Toàn bộ 16 mốc và `1,770` frame đều hiển thị rõ nét trên nền đêm `#070912` với hiệu ứng `UnrealBloomPass`.
- [x] **Thương hiệu Hamic:** Đã cập nhật toàn bộ hiển thị văn bản trên HUD, phụ đề và thẻ sự kiện thành **`Hamic`** / **`HAMIC`** theo đúng yêu cầu.
- [x] **Không cắt chữ / tràn lề:** Tất cả bảng HUD, công thức Toán–Tin và phụ đề tiếng Việt sử dụng phông `Be Vietnam Pro` nằm gọn trong vùng an toàn (`safe margin`).
- [x] **Đúng thứ tự cao trào hài E2 (Scene 07):**
  - Ở `t = 40.0s` (`qa_40s.jpg`): Toàn bộ khối nhà **HUS bay lên trước** kèm vòng đẩy phát sáng, trong khi **USSH vẫn nằm trên mặt đất** chờ xung lực lan sang.
  - Ở `t = 43.0s` (`qa_43s.jpg`): Toàn bộ khối nhà **USSH bật lên bay theo HUS** giữa trời hoa giấy và dàn drone lượn vòng tránh tòa nhà.
- [x] **Tuyên bố mô phỏng an toàn (Scene 08, `qa_47s.jpg`):** Hiển thị rõ ràng dòng chữ `Đây chỉ là hoạt hình mô phỏng. Hai trường ngoài đời vẫn nguyên vẹn.` kèm hiệu ứng tua ngược (`⏪ REWIND`) đưa hai trường về nguyên trạng.
- [x] **Thông tin sự kiện chính xác (Scene 09 & 10, `qa_52s.jpg`, `qa_58s.jpg`):** Hiển thị đầy đủ `ĐÊM TOÁN TIN`, `CÔNG BỐ 01.11`, `Gian hàng Câu lạc bộ Toán Tin Hamic`, `Sự kiện Chào Tân HUS — Cơ sở Nguyễn Trãi` và logo CLB.
- [x] **Kiểm tra hồi quy dự án (`npm run check && npm run build`):** `1239` bài kiểm tra đáp án đạt (`0` lỗi), `0` khóa chuỗi thiếu, build production thành công.
