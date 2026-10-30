# USSH × HUS — bộ nguyên liệu dựng cảnh 3D bằng CLI

Mục tiêu: map khối đơn giản ở cơ sở 334–336 Nguyễn Trãi, Hà Nội, dùng cho web game indie hoặc video hài. Ưu tiên nhìn ra địa điểm, sửa dễ, tải nhẹ. Không cần texture sát thực tế.

## Bắt đầu nhanh

1. Giải nén toàn bộ ZIP vào một thư mục riêng.
2. Mở terminal tại thư mục `ussh_hus_cli_kit` và mở AI coding CLI bạn đang dùng.
3. Dán nội dung `START_HERE.txt` vào CLI. Prompt chi tiết ở `prompts/BUILD_WITH_CLI.md`.
4. CLI sẽ đọc ảnh, dữ liệu, mô hình mẫu, rồi tạo project web trong thư mục `web/`. Không cần tải đủ ảnh trên mạng mới bắt đầu được.

Có sẵn **7 file GLB**: cảnh bố cục nháp và 6 mẫu rời (khối nhà, mái, cây, ghế, cổng, xe máy đồ chơi). Đây là tài sản khởi đầu để CLI sửa tiếp; chưa phải bản tái dựng chính xác khuôn viên. Có hai preview để nhìn ngay bố cục nháp.

## Các file quan trọng

- `assets/references/user/`: hai ảnh gốc bạn gửi, đã đổi tên dễ dùng trong terminal.
- `assets/references/web/`: bảy ảnh bổ sung. Bản ZIP ban đầu không có chúng vì lần tải lúc đóng gói trả HTTP 403. Trên máy này `python scripts/download_references.py` đã tải đủ; xem `data/reference_download_report.json`.
- `web/`: app Vite + TypeScript + Three.js. Cách chạy và thư mục build nằm ở `web/README.md`.
- `data/sources.json`: nguồn ảnh, năm, loại ảnh và đường dẫn đích; tách rõ phối cảnh thiết kế và ảnh thực tế.
- `data/campus.layout.json`: vị trí, kích thước, số tầng **ước lượng bằng đơn vị game**, cùng bảng phòng ban theo tầng của HUS (`programs`); sửa ở đây rồi dựng lại.
- `data/interiors.json`: phòng, cầu thang, nhãn theo tầng do `build_blockout.py` sinh ra; app web đọc file này.
- `docs/map/hus_directory.png`: bảng chỉ dẫn HUS có phòng ban theo tầng — căn cứ cho tầng và phòng.
- `assets/models/campus_blockout.glb`: cảnh nháp có đường, nhà, cây, ghế, cổng, đường sắt trên cao cách điệu.
- `assets/signs.svg`: biển tên vector tự tạo; có thể rasterize để dùng làm texture.
- `scripts/build_blockout.py`: sinh GLB bằng Python chuẩn, không cần cài thư viện ngoài.
- `scripts/blender_scene.py`: nhập GLB, tạo camera/ánh sáng, lưu `.blend` và render ảnh nếu có Blender.
- `docs/ASSET_STATUS.md`: những gì đã có và những gì chưa được kiểm chứng.
- `docs/RESEARCH_NOTES.md`: kết quả nghiên cứu và giới hạn tư liệu.
- `SHA256SUMS.txt`: checksum các file trong gói, trừ chính file checksum.

## Chạy trực tiếp không qua AI

Sinh lại toàn bộ GLB:

```sh
python scripts/build_blockout.py
```

Tải bổ sung 7 ảnh nguồn bằng Python (tùy website có cho tải hay không):

```sh
python scripts/download_references.py
```

Script dùng Python chuẩn, bỏ qua ảnh đã tồn tại, lưu kết quả từng nguồn vào `data/reference_download_report.json`. Nếu bị chặn, mở link trong `data/sources.json` bằng trình duyệt và lưu thủ công vào đúng `local_path`. Không cần đăng nhập hay API key.

Nếu đã cài Blender và lệnh `blender` có trong PATH:

```sh
blender --background --python scripts/blender_scene.py
```

Kết quả ở `output/campus_blockout.blend` và `output/overview_blender.png`. Trên Windows cũng có thể mở Blender → Scripting → mở `scripts/blender_scene.py` → Run Script. Bước này chưa được chạy kiểm chứng trong môi trường đóng gói vì không có Blender.

## Chạy bản web

Từ thư mục `web/`:

```sh
npm install
npm run dev
```

Build tĩnh: `npm run build`, kết quả ở `web/dist/`. Xem `web/README.md`. App không cần ảnh mạng lúc chạy.

Đọc phần hướng dẫn sửa vật liệu/camera trong prompt trước khi làm video. Script Blender vẫn ở `scripts/blender_scene.py`. Lệnh `blender` chưa được chạy trên máy này, nên chưa có file `.blend` hay ảnh render từ Blender.

## Tạo lại preview (tùy chọn)

Preview đã có sẵn. Nếu muốn render lại bằng CPU sau khi sửa model: cài Pillow và NumPy trong môi trường Python của bạn, rồi chạy `python scripts/render_previews.py`. Hai thư viện này chỉ cần cho preview; script sinh GLB và tải ảnh dùng Python chuẩn. Chạy `python scripts/validate_assets.py` để kiểm tra cấu trúc GLB.

## Giới hạn cần biết

Bản đang chạy lấy vị trí tương đối từ `docs/map/ussh.png`, `docs/map/hus.png` và `docs/map/hus_directory.png`. Tầng và phòng ban HUS theo bảng chỉ dẫn; thứ tự phòng trên một tầng là máy xếp. Nhà USSH là khối kín. Kích thước, chiều cao, cổng và cây vẫn là ước lượng, không phải mét đo được. Preview cũ trong `previews/` là hình của mô hình nháp ban đầu, không phải bản đồ hiện tại.

Ảnh tham khảo để đối chiếu khi dựng, không được app mặc định tải làm nền hay texture. Ghi nhận nguồn tại `docs/CREDITS.md`.
