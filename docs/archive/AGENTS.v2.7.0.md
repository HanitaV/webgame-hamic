# Quy ước cho tác tử / người sửa mã

- Đọc `docs/GDD.md` trước khi đổi luật chơi, sao, thành tựu hay câu chữ.
- Nội dung nằm trong `web/public/data`. Thêm màn = thêm dữ liệu, không viết cứng trong TS.
- Mọi chuỗi giao diện qua `t("khóa")` trong `web/public/data/i18n/vi.json`. `npm run check:strings` bắt khóa thiếu.
- Luật chấm ở `web/src/puzzles/logic` phải thuần (không DOM, không ngẫu nhiên). Sửa luật thì chạy `npm run check:answers`.
- Dữ liệu sinh tự động chỉ sửa qua `content/gen_levels.py`, rồi chạy lại để cập nhật `qa_report.json`. Lint "Dạo chơi" (≤ 20 từ, ≤ 3 số mỗi câu, cấm thuật ngữ) phải ra 0 vi phạm.
- Trước khi giao: `npm run check && npm run build`, rồi `npm run capture` (cần Playwright) và xem ảnh ở 844×390.

## Giao diện (2.3)

- Phong cách: đêm hội ánh sáng hiện đại. Nền đêm `#070912`, panel kính mờ viền mảnh, một màu nhấn vàng `#ffd25e` cho hành động chính và vật đã sáng; mỗi mạch dùng màu riêng của nó trên đèn.
- Một phông duy nhất: Be Vietnam Pro (đóng gói kèm, chạy offline), 800 cho tiêu đề, 600 cho nút.
- Token màu, bo góc, khoảng cách ở đầu `web/src/style.css`. Không thêm màu ngoài token.
- Nút dùng `btn(label, onClick, "primary|ghost|danger|small|big|wide", attrs, icon)` trong `ui/dom.ts`; biểu tượng là SVG nét trong `ICONS`.
- Canvas dùng bảng màu `INK` và các hàm `polyline / dot / ring / arrow / roundRect` trong `ui/widgets.ts`; phát sáng tắt theo cài đặt "Giảm hiệu ứng ánh sáng".
- Bố cục ưu tiên màn ngang thấp (`@media (max-height: 520px)`).
- Không nhấp nháy > 3 lần/giây, không đồng hồ đếm ngược, không lửa hay khói thật. Cảnh sa bàn "nổ" hoạt hình ở kết cục hài (GDD 5.4) được phép nếu: khối rơi chậm, không người, không chớp sáng, có nút bỏ qua, tôn trọng "Giảm hiệu ứng ánh sáng".

## Bản đồ USSH × HUS

- Tên, vị trí, gắn mạch: `web/public/data/map.json` (tọa độ theo `legacy/campus/data/campus.layout.json`). Không viết cứng trong `scene/world.ts`.
- Mô hình `web/public/models/campus.glb` sinh bằng `node web/scripts/build-map.mjs` (cần `@gltf-transform/core`, `@gltf-transform/functions`, `@gltf-transform/extensions`, `meshoptimizer`). Sửa hình khối thì sửa `legacy/campus/scripts/build_blockout.py`, sinh lại blockout rồi chạy build-map.
- Bản đồ là ước lượng. Giữ `mapVerified: false` đến khi CLB xác nhận. Không thêm logo trường.
