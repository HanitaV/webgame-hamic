# Hướng dẫn cho AI coding CLI

Đây là bộ nguyên liệu cho project 3D USSH/HUS. Nhiệm vụ đầy đủ: `prompts/BUILD_WITH_CLI.md`. Mở các ảnh cục bộ để quan sát trước khi sửa bố cục.

- Phạm vi: USSH 336 và HUS 334 Nguyễn Trãi, Hà Nội. Không lấy nhầm USSH TP.HCM, HUS 19 Lê Thánh Tông, hay cơ sở Mễ Trì.
- Mục tiêu: vui, nhanh, khối đơn giản; dựng vị trí tương đối và dấu hiệu nhận diện.
- `data/campus.layout.json` là bố cục nháp, không phải số đo. Dùng làm điểm bắt đầu, không xem đó là bằng chứng vị trí thật.
- Tên khối `USSH_BLOCK_*`/`HUS_BLOCK_*` chưa khớp tên nhà thật. Chỉ gán tên A/B/C/E/G/I hoặc T1/T3/T4/T5 khi có sơ đồ/ảnh xác nhận. Nếu thiếu bằng chứng, giữ tên trung tính.
- Ảnh mạng thiếu không được khiến project ngừng hoạt động. Không đưa nội dung HTML lỗi vào file ảnh.
- Tạo web trong `web/`; giữ nguồn ảnh, dữ liệu và script gốc có thể tái tạo. Chỉ sửa file layout khi đang chủ động cải thiện bố cục; ghi rõ căn cứ và phần còn ước lượng.
- Model bên trong chỉ chứa hình học + màu, không có texture hay font phụ thuộc mạng.
- Không cần backend, tài khoản, thanh toán hay deploy. Không tự đẩy Git, publish hoặc ghi đè project ngoài thư mục này.
- Thông báo thẳng điều đã chạy kiểm tra, điều chưa chạy và các giới hạn. Không tuyên bố đã render Blender nếu chưa thực thi.
- Skill cho agent nằm trong `.claude/skills/` (Claude Code) và `.agents/skills/` (Codex, Cursor, Gemini CLI, Copilot): 78 skill của [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) (Apache-2.0, bắt đầu bằng `router`) và `design-taste-frontend` của [taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT). Giấy phép đi kèm trong cùng thư mục. Với giao diện game này: `game-ui-ux`, `design-taste-frontend` (phần app screens), `save-systems`, `input-systems`, `threejs-scene-setup`.
