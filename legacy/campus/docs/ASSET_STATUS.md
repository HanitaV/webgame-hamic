# Trạng thái nguyên liệu

## Có sẵn trong ZIP

- 2 ảnh gốc do người dùng cung cấp, tên file đã chuẩn hóa, không chỉnh sửa nội dung.
- 1 GLB cảnh khối nháp với 14 khối nhà trung tính, sân, đường, cây và đồ trang trí.
- 6 GLB mẫu rời: khối đơn vị, mái hai dốc, cây, ghế, cổng trống, xe máy cách điệu.
- 1 SVG biển tên do bộ kit tạo; không phải logo chính thức.
- Dữ liệu layout JSON; mọi tọa độ/kích thước là ước lượng.
- Prompt xây dựng chính, prompt vòng sửa, hướng dẫn CLI và script tái tạo.
- Preview tổng quan và từ trên xuống do bộ kit tạo từ cùng layout; không là ảnh hiện trạng trường.

## Ảnh website

Môi trường đóng gói trả HTTP 403 và không nhét trang lỗi vào file ảnh. Lần chạy `python scripts/download_references.py` sau đó tải đủ 7 ảnh vào `assets/references/web/`. Chi tiết ở `data/reference_download_report.json`. Phối cảnh 2024 vẫn là thiết kế, không phải hiện trạng.

## Đã dựng trên máy này

- `data/campus.layout.json` và `assets/models/campus_blockout.glb` lấy vị trí tương đối từ `docs/map/ussh.png` và `docs/map/hus.png`. Kích thước vẫn là ước lượng. Chi tiết ở `output/CHANGELOG.md`.
- App web nằm ở `web/`. Cách chạy ở `web/README.md`.
- Ảnh kiểm tra trình duyệt headless nằm ở `output/shots/`.

## Bản dựng 30/10/2026

- Nhà USSH là khối kín. Nhà HUS có tầng (T1 4, T2–T4 5, T5 7, Chuyên đề 4), 438 phòng sinh theo hành lang, 12 sảnh cầu thang, cầu T1–T2 tầng 2–3, trục đi rộng 18 đơn vị từ cổng qua T1, T2 ra vườn. Không có nhà vệ sinh. Chi tiết và lệnh đã chạy ở `output/CHANGELOG.md`.
- Phòng ban theo tầng lấy từ bảng chỉ dẫn HUS; thứ tự phòng trên tầng là máy xếp.
- Lần 2: WC ở các vị trí biểu tượng WC trên bảng chỉ dẫn (37 phòng), trời ngày/đêm bằng shader, vân bề mặt bằng shader theo toạ độ (không texture ảnh), logo HUS (file người dùng gửi, `assets/logo/hus_logo.svg`) trên mặt T5 nhìn ra sân, camera không xuyên tường.

## Chưa xác minh / chưa có

- Số đo thật: tâm khối, dài, rộng, cao, mái và mặt đứng vẫn là ước lượng.
- Mô hình .blend: script có ở `scripts/blender_scene.py` nhưng Blender chưa được chạy trên máy này. Không có ảnh render Blender và không có video MP4.
- Không có texture từ Google Maps, mesh trích xuất từ Google Earth hay nội thất đo thực tế.

Xem `data/validation_report.json` để biết việc kiểm tra thực sự đã chạy cho bộ kit này.
