# Thay đổi

## Chưa phát hành

- Đổi tên dự án và tên game từ "Hội tụ 70" sang "Đêm Toán Tin" (`dem-toan-tin`) trên màn hình khởi động, màn hình chính, thẻ chia sẻ, nhóm chat trong truyện, manifest PWA và bộ tài liệu thiết kế; vẫn tương thích ngược khi nhập tệp tiến độ cũ.

- Mở rộng tương tác khuôn viên và Easter Egg liên trường USSH × HUS: thêm đọc bảng phấn chuyên đề / biển giới thiệu tòa nhà (có công thức KaTeX, lối tắt sang Phòng thí nghiệm và thẻ Sổ tay riêng), đọc giấy nhắn trên cửa phòng bộ môn, xem trạng thái cụm máy chủ và bàn thí nghiệm trong phòng con, đổi 3 đội hình bay tại trạm thử drone, gãi cằm Giáo sư Mèo Vàng Nhà T5, hiệu ứng vòng sáng khép kín khi thắp đủ 19/19 đèn lối đi, 7 kỷ vật 3D mới (nâng tổng lên 15 khắp hai trường và phòng máy chủ), hợp âm ẩn `2–5–7` và logo `70`, hạt giống kỷ niệm (`17`, `70`, `836`, `1956`, `2026`, `2485`), huy hiệu kỷ niệm trên Thẻ Hội tụ cùng 4 thành tựu mới (`A31`–`A34`).

- E2 thêm vòng xung lực, tia bật, mảnh màu và rung máy quay nhẹ đồng bộ cú bung ở giây 5,2. Sáu ending có SFX stereo riêng: rotor, bật đèn, bay vút, pháo/chạm khối, chuông và nhịp hài. Audio chuẩn hóa hai lượt, qua bus SFX, theo pause/seek/volume/mute/bỏ qua; MP4 cũng có AAC khi xem ngoài game.

- Thêm model quadcopter GLB dùng chung cho trạm thử drone trong lúc chơi và đoạn đầu cả sáu ending. Cutscene kéo dài 16 giây để thấy rõ thân máy, đèn đổi màu, quá trình bay lên và thu nhỏ thành điểm sáng; render lại toàn bộ phim.

- Sáu cutscene ending riêng, render bằng GPU thành video nền 1080p. Pháo hoa chuyển từ chấm tròn sang các loạt chùm tia có đuôi; E2 giữ nguyên khối nhà khi bung, E3 có cầu dải sáng và pháo đáp nhau, E4 lộ đội hình 07, E5 sao chổi bay mãi, E6 các cụm ước có quỹ đạo riêng. Video không hiện trình phát; có bỏ qua, tự chuyển về cảnh trực tiếp khi lỗi hoặc bật giảm hiệu ứng.

- Màn kết thúc hiện rõ mã và tên kết cục, bảng thông số lượt chơi và điểm rủi ro của từng lựa chọn. Khi bảng mở, giữ tiêu đề ở đầu để người chơi thấy ngay kết cục nhận được.

## 2.8.0 — Thay bộ tài liệu, nới lỏng GDD, thêm hệ thống nhiều kết cục

### Tài liệu
- Bộ tài liệu mới: `AGENTS.md`, `docs/GDD.md` (nới lỏng mục 2.1, thêm mục 5.4 Kết cục), `docs/ENDINGS.md`, `docs/STORY_PLAN.md`. Bản cũ lưu ở `docs/archive/` (gói nhận về đã chứa sẵn bộ mới, không có thư mục `_incoming/`; ghi chú trong `docs/archive/README.md`).
- Mới: `docs/STORY_BIBLE.md` (sinh từ dữ liệu). Viết lại `docs/WALKTHROUGH.md`, `README.md`. GDD: ghi chú 2.8, mục 5.4 theo lựa chọn, thành tựu A26–A30, Phụ lục thêm 5 việc cần CLB xác nhận.
- Quyết định của người phụ trách (31/10): tỉ lệ khoảng 70% cho E2 đạt bằng cách chỉnh thông số để khoảng 70% tổ hợp lựa chọn dẫn tới E2, không quay ngẫu nhiên. ENDINGS.md đã ghi chú thay thế mục 2.

### Cốt truyện "Vì sao đèn lệch?"
- 5 chương, 15 điểm dừng trên 10 node của `map.json`; ba sai sót nhỏ cộng dồn (nhầm phiên bản, thiếu tệp ghi chú, hai bản chốt), không phản diện.
- 12 NPC có giọng riêng, vị trí đổi theo chương, 26 chủ đề hỏi, thoại theo từng chương (60 câu không trùng), câu gọi lại lựa chọn cũ, 24 lời kết theo độ thân thiết (chỉ cộng, không trừ).
- Nhánh listen/build: một cảnh riêng mỗi chương; build thêm ghi chú kỹ thuật vào Sổ, listen tăng thân thiết.
- 8 quyết định có hệ quả: tin nhắn nhóm, thoại gọi lại, dòng thời gian nhân quả, kết cục. Sổ: bằng chứng, vật phẩm, dòng thời gian, 7 sự thật về 70, đèn lối đi, kết cục, lịch sử thoại.
- Tên địa điểm trong lời thoại viết bằng `{place:id}`, lấy từ `map.json → walk.nodes[].short`.

### Minigame
- Tái dùng 7 câu đố có sẵn ở đúng điểm dừng, ba mức khó (dễ: đề Dạo chơi; khó: màn sinh tự động): giới hạn 1.1, chuỗi 1.2, gương 2.3, đồng dư 5.1, tổ hợp 6.1, khối lệnh 3.2, đường đi ngắn nhất dựng từ chính lối đi của `map.json`.
- 6 minigame mới qua `activity.type`: hai bản cùng tên, bắt lỗi đồng bộ, ghép ảnh với lời ghi, nhịp chữ và hiệu ứng, thứ tự tổng duyệt (tô-pô), đối chiếu bằng chứng. Thay hẳn khuôn "sắp 4 thẻ". Việc phụ: thắp 10 đèn lối đi.
- Luật chấm thuần trong `puzzles/logic/activities.ts`, có ca kiểm đúng/sai/mọi đáp án hợp lệ.

### Kết cục
- `pickEnding` tất định từ 8 quyết định; trọng số rủi ro và ngưỡng ở `config.json → endings`. Duyệt 2.916 tổ hợp: E1 10,87%, E2 70,30%, E3 5,52%, E4 4,29%, E5 4,29%, E6 4,73%.
- Cảnh 3D: E1 trình diễn đầy đủ; E2 khối tòa nhà tách ra, bay lên chậm rồi rơi chậm, hoa giấy, chú thích mô hình trên máy tính, mờ dần khi giảm hiệu ứng; E3 cầu ánh sáng; E4 drone "07"; E5 pháo bay mãi; E6 các cụm ước của 70. Nút Bỏ qua cảnh.
- Ba biến thể nguyên nhân E2 và biến thể "thêm một chùm"; "Chọn lại từ tổng duyệt" thay "Thử lần quay khác"; Thư viện kết cục giữ qua các lượt; thành tựu A26 Gặp đủ kết cục (cùng A27–A30). Hack mode xem thẳng mọi kết cục.

### Giao diện, trải nghiệm, máy yếu
- Joystick ảo (tốc độ theo độ lệch) thay bốn nút mũi tên; nút hành động lớn cho ngón cái; HUD gọn cho màn ngang thấp (nút biểu tượng có nhãn cho trình đọc màn hình, mục Thêm gập lại).
- Bản đồ nhỏ (bấm để được dẫn đường), lời nhắc khi đi lòng vòng, rung nhẹ khi xong việc (tắt được), dòng "Lần trước" ở màn tiêu đề, lịch sử thoại.
- Tự hạ chất lượng: máy ≤ 2 nhân hoặc ≤ 2 GB, hay dưới ~25 khung/giây trong 6 giây đầu thì bật đồ họa thấp (tắt được trong Cài đặt). KaTeX chỉ tải khi có công thức.
- Công thức KaTeX (đóng gói, chạy offline) cho Toán, đại số quan hệ (CSDL), giả mã thuật toán `[[algo]]`; sự thật về 70 và bằng chứng viết lại bằng công thức.
- PWA: cache `hoitu70-v2.8.0`, tải trước dữ liệu và mô hình để chạy offline.

### Hạ tầng và kiểm thử
- `StoryState` version 4; migration từ version 3 (bản 2.7) nhảy tới điểm dừng tương ứng, giữ bond và thời gian chơi. Cờ, bằng chứng, sự thật, thân thiết suy ra từ trạng thái.
- `check:answers`: 1.219 phép kiểm, gồm không trạng thái kẹt, tỉ lệ kết cục, E6/boom, tua lại, migration, minigame. `check:strings`: thêm khóa mồ côi `story.*`, lint lời dẫn mức dễ, mã `{place:id}`.
- `npm run test:story` (Playwright): đi hết truyện với bond listen/build, ba mức khó, tải lại giữa chừng, tua lại, bản lưu 2.7, xem mọi kết cục bằng Hack mode. `capture.mjs` chụp từng chương, minigame, Sổ, mọi kết cục.
- Kết quả nền trước khi sửa: `check` 1.142 đạt, build thành công.
- Kết quả khi giao: `check:answers` 1.219 đạt / 0 lỗi; `check:strings` 0 khóa thiếu, 0 khóa mồ côi, 0 vi phạm lint; `build` thành công; `test:story` 29 đạt / 0 lỗi / 0 lỗi console; `capture` 101 ảnh ở 844×390, 1280×800 và dọc, 0 lỗi console.

### Giới hạn đã biết
- Thời lượng 20–25 phút là ước lượng theo số bước; cần chơi thử R3.
- Màn chơi riêng (graph, khối lệnh) vẫn chủ yếu dùng chuột/chạm như bản trước.
- Bản đồ, chi tiết lịch sử nền, dòng chúc và cảnh E2 có tên trường chờ CLB xác nhận.

## 2.7 — Sân trường và buổi tổng duyệt

- Cả ba kết cục truyện cần tối thiểu 600 giây hoạt động, lưu/tải lại được, và tám phần bàn giao mới.
- Thêm tám NPC bàn giao, sổ theo dõi, nhánh nhận xét và ba tình huống tổng duyệt.
- Thêm 48 sinh viên nền đi lại/đứng nhóm; cấu hình nhẹ giữ 12. Mười hai NPC tương tác luôn hiện đầy đủ.
- Nút tiết kiệm hiệu năng ngay menu, dùng chung cài đặt đồ họa thấp và giảm pixel ratio.

## 2.6 — Lời thoại, camera và tương tác

- Biên tập lời thoại bằng Humanizer, giữ dữ kiện và đáp án; thay các câu rút bài học lặp lại bằng trao đổi cụ thể của từng NPC.
- Camera giữ khoảng cách, nhà chắn tầm nhìn mờ đi rồi trở về vật liệu gốc. Dò khung bao tính sẵn thay cho tam giác; nhân vật vẫn hiện rõ.
- Sửa vùng tương tác theo vị trí NPC, thêm bấm/chạm vào nhân vật và trò chuyện ngoài nhiệm vụ. Bỏ lớp giao diện chặn canvas ở màn đi bộ.
- Ánh sáng chuyển từ chiều sang tối theo tiến độ, khôi phục khi tải lại và dùng đêm cho màn diễn.

## 2.5 — Câu chuyện và nhịp chơi

- Chỉnh chiều cao nhân vật theo tỷ lệ layout; camera gần, thu khoảng cách khi bị che và nhãn NPC chỉ hiện gần.
- Chọn Cốt truyện / Cân bằng / Thử thách từ menu, lưu lựa chọn và áp dụng cho biến thể nhiệm vụ, nhóm màn hằng ngày, mức luyện tập và hỗ trợ.
- Thêm mở đầu, động cơ của người chơi, sáu cảnh trò chuyện, sáu nhánh hỏi thêm, nhật ký và lời nhắn giữa chặng. Lời kết nhắc lại cách người chơi đã tham gia.
- Thêm lời giao việc/hồi đáp cho các mode phụ; lưu câu chuyện cũ tự nhập phiên bản 2. Tách hoàn thành hằng ngày theo độ khó nhưng giữ số ngày lịch duy nhất.
- Kiểm tra biến thể, nội dung mode, tỷ lệ hình học, nhập bản lưu và luồng hội thoại bằng Playwright.

## Đi dạo làm nhiệm vụ (2.4)

- Vòng chơi đi bộ từ cổng HUS, gặp NPC ở T3, sân cỏ và USSH; 5 lựa chọn, 3 kết cục, lưu tiến độ và chơi lại. Điều khiển WASD/mũi tên/cảm ứng, tự dẫn đường và camera theo người chơi.
- 4 NPC low-poly tự dựng, có trang phục, đạo cụ và tên theo dữ liệu. Điểm gặp ở ngoài tòa nhà; tuyến đi có giới hạn, bản đồ vẫn là ước lượng.
- Hack mode ẩn bằng Ctrl+Shift+H hoặc ?hack=70; mở khóa trong bộ nhớ riêng, kiểm thử từng task và xem ba kết cục. Hướng dẫn trong README.
- Kịch bản chỉnh kiến thức ma trận/giới hạn, bỏ đếm ngược/cháy nổ/chớp nhanh. Hiệu ứng đa sắc ổn định và mô hình trôi nhẹ có hỗ trợ giảm chuyển động/ánh sáng.
- Quét khóa dịch cả dữ liệu nhiệm vụ/NPC; sửa đường dẫn script trên Windows; thêm kiểm tra 32 tổ hợp kết cục và Playwright cho luồng đi bộ.

## 2.3.0

### Mô hình là bản đồ USSH × HUS (sửa GDD 5.1)
- Thay mô hình trừu tượng bằng bản đồ khối hai trường ban đêm, có nhãn tên trường và tên tòa nhà. Mô hình lấy từ `legacy/campus`, nén bằng `web/scripts/build-map.mjs` (10,7 MB → 2,2 MB, ~1100 lưới → ~400 lượt vẽ, vật liệu Lambert cho điện thoại).
- Mỗi mạch gắn một tòa nhà (`web/public/data/map.json`); mạch sáng thì tòa nhà bừng màu, có pha lê trên mái và cột sáng. Lõi mạch 7 ở trên bãi cỏ HUS; màn trình diễn diễn ra tại đây.
- Hành trình ghi vị trí mạch ("Tại Nhà T5 · HUS") và đưa camera tới tòa nhà đó.
- GDD 5.1, danh sách kiểm tra 12.2, bảng rủi ro và Phụ lục đã sửa theo quyết định này. **Cần CLB xác nhận bản đồ**; trước đó `mapVerified: false` và màn hình chính ghi "bản đồ ước lượng, chờ CLB xác nhận".

### Bố cục máy tính
- Khung giữa rộng tối đa 1320px; cột điều khiển màn chơi và danh sách mạch cố định 400px; panel ôm nội dung thay vì kéo dài; chữ, thẻ chế độ, ô màn chơi lớn hơn; gợi ý phím (Enter, H, Esc) khi dùng chuột và bàn phím.

### Giao diện hiện đại (thay phong cách khối)
- Bỏ toàn bộ giao diện kiểu Minecraft (texture pixel, phông VT323, viền khối).
- Phong cách mới: nền đêm, panel kính mờ bo góc, nút vàng phát sáng cho hành động chính, bộ biểu tượng SVG nét, sao vector, đèn mạch dạng quả cầu sáng.
- Màn chính: khối giới thiệu bên trái (tên, mô tả, Hành trình / Dạo chơi, thanh tiến độ sao + 7 đèn mạch), lưới 6 thẻ chế độ bên phải.
- Màn trình diễn vẽ số "70" bằng drone theo phông 5×7 (rõ hơn phông 3×5 cũ).
- Canvas màn chơi: đường cong mượt, điểm phát sáng, nhãn trọng số dạng viên thuốc, lưới chấm.
- Thẻ Hội tụ (ảnh chia sẻ) vẽ lại theo phong cách mới.
- Sửa: tab Sổ tay tràn trên điện thoại, tên thẻ chế độ bị xuống dòng.

### Từ đợt cập nhật GDD v2.2
- Điện thoại bắt buộc chơi ngang.
- 7 mạch, 23 màn, sao ★ Hoàn thành / ★ Chính xác / ★ Gọn, gợi ý 3 bậc, Dạo chơi, Thử thách hằng ngày, Luyện tập, Phòng thí nghiệm, Sổ tay, thành tựu A01–A25, Cài đặt, Thẻ Hội tụ, Chế độ Khách.
- `gen_levels.py` 2.3: chuỗi tiếng Việt có dấu, thêm lời dẫn "Dạo chơi" (46 màn) kèm lint; đáp án, dữ liệu, sao và seed giữ nguyên so với 2.2. SHA-256 dữ liệu mới: `0309be6f9942ff1731c0ec063a55bf1d20e30b7ef5abfbfce525155b12fcb118` (R1 của bản 2.2 vẫn tái lập đúng `ae07d794…`).
- `npm run check`: 937 phép kiểm đáp án + kiểm khóa chuỗi.

### Giới hạn đã biết
- Chưa có nhạc nền / giọng đọc (không có tài nguyên âm thanh), chỉ có hiệu ứng âm WebAudio.
- Luyện tập lấy từ 266 màn đã kiểm chứ không sinh trực tiếp trên máy.
- Dạo chơi dùng trắc nghiệm cho bài đếm; chưa có bản Dạo chơi cho Euler, chuyển vị, khối lệnh.
- Câu chúc màn cuối chờ xác nhận.
- Bản đồ USSH × HUS là ước lượng, chờ CLB xác nhận tên và vị trí.
- Mới kiểm trên Chromium giả lập (844×390, 1280×800, dọc 390×844), chưa thử trên điện thoại thật.
