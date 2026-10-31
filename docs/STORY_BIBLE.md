# STORY BIBLE — "Vì sao đèn lệch?" (Đêm Toán Tin, bản 2.8.0)

Tài liệu thiết kế cốt truyện, sinh từ `web/public/data/story.json`, `i18n/vi.json`, `map.json` và `config.json` (mục `endings`). Khi dữ liệu và tài liệu lệch nhau, dữ liệu là bản đúng; chạy lại công cụ soạn thảo hoặc sửa tay mục tương ứng.

## 0. Quyết định mặc định đã tự đặt

- Xương sống: điều tra "Vì sao mô hình chạy thử bị lệch một đoạn?". Nguyên nhân là ba sai sót nhỏ cộng dồn, không có phản diện.
- Thời lượng chuỗi chính mục tiêu 20–25 phút (15 điểm dừng, 12 minigame/câu đố, 1 bảng đối chiếu). Không có khóa thời gian hay đồng hồ đếm ngược.
- Kết cục do lựa chọn quyết định hoàn toàn, không quay ngẫu nhiên (yêu cầu bổ sung của người phụ trách, thay cho mục 2 của ENDINGS.md bản đầu). Trọng số rủi ro được chỉnh để khoảng 70% tổ hợp lựa chọn dẫn tới E2.
- E1 là kết cục của lượt chơi không để lại rủi ro nào; E3 dành cho người giữ nguyên lời ghi nhưng còn sai sót nhỏ; E6 cần đủ bảy sự thật về 70 và một lựa chọn riêng ở bước cuối.
- Chi tiết lịch sử chỉ ở mức nền (một câu về thời chung tên Đại học Tổng hợp Hà Nội 1956–1995, một câu nhắc bài lượng – chất). Cần CLB xác nhận trước khi phát hành.
- Tên địa điểm trong lời thoại viết bằng mã `{place:id}`, lấy tên ngắn từ `map.json` (`walk.nodes[].short`); sửa tên ở map là lời thoại tự đổi.
- Bản lưu version 3 (bản 2.7) được chuyển sang điểm dừng tương ứng; các lựa chọn bị bỏ qua lấy phương án an toàn.

## 1. Câu hỏi dẫn dắt và xương sống

Bạn mới vào HAMIC được vài hôm. Tối nay chạy thử mô hình mừng 70 năm, nhưng bản chạy thử chiều nay lệch một đoạn. Chị Chủ nhiệm nhờ bạn đi một vòng hai trường tìm nguyên nhân.

Ba sai sót gốc, mỗi sai sót có bằng chứng và một quyết định để sửa hoặc để lại:

| Sai sót | Bằng chứng | Quyết định liên quan | Biến thể E2 khi để lại |
|---|---|---|---|
| Nhầm phiên bản: bản đèn cũ trùng tên, giờ sửa muộn hơn | Hai bản cùng tên, Pháo hoa dừng thấp, Sáu đèn chưa đủ, Thứ tự gương | `version` (Minh) | Nhầm phiên bản |
| Thiếu tệp ghi chú: mẫu đồng bộ bỏ thư mục `_ghichu` | Tệp ghi chú gốc, Mẫu đồng bộ, Lời ghi đi theo ảnh | `notes` (Vy) | Thiếu tệp ghi chú |
| Hai nhóm hiểu khác nhau về bản chốt lịch | Hai bản lịch | `final` (Đức) | Hai bản chốt |

Ở bước cuối, bảng "Đối chiếu bằng chứng" yêu cầu chọn đúng ba nguyên nhân này và loại ba nguyên nhân giả (có người phá, máy hỏng, mô hình quá nặng).

## 2. Bản đồ chương và điểm dừng

### Mở đầu · Hai chiếc USB

Ánh sáng: bước 0 (map.json → atmosphere). Lời đài: Minh đang đợi ở cổng HUS.

| # | Điểm dừng | NPC · nơi | Câu đố / minigame | Quyết định | Tạo ra (bằng chứng, vật phẩm, sự thật) |
|---|---|---|---|---|---|
| 1 | Hai bản cùng tên (`s0`) | Minh · nhóm đón khách · Cổng HUS | Hai bản cùng tên (mới) | `version` | ev:versions, item:card, bond (nhánh listen/build) |

### Chương I · Ánh sáng còn thiếu

Ánh sáng: bước 1 (map.json → atmosphere). Lời đài: Ban Học tập và Hà đang chỉnh đèn ở sân cỏ Nhà T.

| # | Điểm dừng | NPC · nơi | Câu đố / minigame | Quyết định | Tạo ra (bằng chứng, vật phẩm, sự thật) |
|---|---|---|---|---|---|
| 2 | Căn dải sáng (`s1`) | Thành viên Ban Học tập · Sân cỏ Nhà T | Căn dải sáng: màn 1.1 (dễ plot-limit-d1-s1003, khó plot-limit-d5-s5001) | `firework` | ev:height, fact:1, bond (nhánh listen/build) |
| 3 | Dải đèn bật dần (`s2`) | Hà · nhóm kỹ thuật · Sân cỏ Nhà T | Dải đèn bật dần: màn 1.2 (dễ series-d1-s101004, khó series-d4-s104000) | `ha` | ev:oldLamp |
| 4 | Chỉnh hướng chiếu (`s3`) | Thành viên Ban Học tập · Sân cỏ Nhà T | Chỉnh hướng chiếu: màn 2.3 (dễ beam-order-d1-s401003, khó beam-order-d4-s404001) | — | ev:order, fact:2 |
| 5 | Báo cáo ở T3 (`s4`) | Chị Chủ nhiệm HAMIC · Nhà T3 · trạm máy chủ | Hội thoại | — | item:synclist |

### Chương II · Qua Căng tin

Ánh sáng: bước 3 (map.json → atmosphere). Lời đài: Đi qua lối Căng tin tìm tệp ghi chú.

| # | Điểm dừng | NPC · nơi | Câu đố / minigame | Quyết định | Tạo ra (bằng chứng, vật phẩm, sự thật) |
|---|---|---|---|---|---|
| 6 | Mở tủ tư liệu (`s5`) | Nam · người chuyển tư liệu · Lối qua Căng tin | Ba ổ khóa: màn 5.1 (dễ 5.1, khó modular-d4-s804000) | — | ev:notesFile, item:notes, fact:5, bond (nhánh listen/build) |
| 7 | Bắt lỗi đồng bộ (`s6`) | Vy · nhóm kiểm tra · Lối sang USSH | Bắt lỗi đồng bộ (mới) | `notes` | ev:sync |
| 8 | Đường chuyển tư liệu (`s7`) | Vy · nhóm kiểm tra · Lối sang USSH | graph trên lối đi map.json (tái dùng) | — | ev:route, fact:4 |

### Chương II · Bên USSH

Ánh sáng: bước 4 (map.json → atmosphere). Lời đài: Các bạn USSH giữ bộ ảnh và lịch sân khấu.

| # | Điểm dừng | NPC · nơi | Câu đố / minigame | Quyết định | Tạo ra (bằng chứng, vật phẩm, sự thật) |
|---|---|---|---|---|---|
| 9 | Bộ ảnh bên USSH (`s8`) | Đại diện sinh viên USSH · Nhà E · điểm dữ liệu | Hội thoại | — | item:photos, bond (nhánh listen/build) |
| 10 | Ghép ảnh với lời ghi (`s9`) | Linh · nhóm tư liệu · Nhà E · điểm dữ liệu | Ghép ảnh với lời ghi (mới) | `captions` | ev:captions |
| 11 | Nhịp chữ và hiệu ứng (`s10`) | An · sinh viên ghé xem · Sân USSH | Nhịp chữ và hiệu ứng (mới) | — | ev:timing |
| 12 | Chọn bốn cảnh trong tám (`s11`) | Bảo · trực sân khấu · Nhà C / Sân khấu | Chọn bốn cảnh trong tám: màn 6.1 (dễ count-d1-s901000, khó 6.3) | — | fact:6 |
| 13 | Dàn drone chữ 70 (`s12`) | Điều phối sân khấu USSH · Nhà C / Sân khấu | Dàn drone chữ 70: màn 3.2 (dễ 3.2, khó block-vm-d4-s604002) | `drones` | item:program, fact:3 |

### Chương III · Cùng bật sáng

Ánh sáng: bước 5 (map.json → atmosphere). Lời đài: Về T3 tổng duyệt và chốt nguyên nhân.

| # | Điểm dừng | NPC · nơi | Câu đố / minigame | Quyết định | Tạo ra (bằng chứng, vật phẩm, sự thật) |
|---|---|---|---|---|---|
| 14 | Thứ tự tổng duyệt (`s13`) | Đức · phụ trách tổng duyệt · Nhà T3 · trạm máy chủ | Thứ tự tổng duyệt (mới) | `final` | ev:schedule, item:schedule, bond (nhánh listen/build) |
| 15 | Đối chiếu bằng chứng (`s14`) | Chị Chủ nhiệm HAMIC · Nhà T3 · trạm máy chủ | Đối chiếu bằng chứng (mới) | `bursts` | — |

Mỗi điểm dừng tạo cờ `done:<id>`; cờ này được dùng để mở chủ đề hỏi và tin nhắn nhóm. Điểm dừng mở tuần tự, không có cổng thời gian; người chơi đi lại tự do, có nút "Đi tới", vòng chỉ đường và bản đồ nhỏ.

## 3. Đồ thị manh mối (cờ)

Cờ không được lưu riêng mà suy ra từ trạng thái (`deriveFlags` trong `puzzles/logic/story.ts`), nên tua lại hay nhập bản lưu cũ không bao giờ lệch.

| Cờ | Nơi tạo | Nơi dùng | Hệ quả |
|---|---|---|---|
| `dec:version:A` | Hai bản cùng tên | thoại gọi lại của Minh; tin nhắn m1a | Bản về T3 khớp mã băm với bản đã duyệt. |
| `dec:version:B` | Hai bản cùng tên | thoại gọi lại của Minh; tin nhắn m1b; rủi ro kết cục +6 | Bản đèn cũ của Hà, có giờ sửa muộn hơn, được đưa lên mô hình. |
| `dec:version:C` | Hai bản cùng tên | thoại gọi lại của Chị Chủ nhiệm HAMIC; tin nhắn m1c; rủi ro kết cục +2 | Hai bản cùng tên về T3, người nhận phải tự đoán. |
| `dec:firework:A` | Căn dải sáng | thoại gọi lại của Thành viên Ban Học tập | Pháo hoa giữ hàm hội tụ về 70 m. |
| `dec:firework:B` | Căn dải sáng | thoại gọi lại của Thành viên Ban Học tập; tin nhắn m2b; rủi ro kết cục +10; kết cục → E5 | Pháo hoa được đổi sang hàm không hội tụ. |
| `dec:ha:A` | Dải đèn bật dần | thoại gọi lại của Chị Chủ nhiệm HAMIC; thoại gọi lại của Hà; tin nhắn m2a | Hà báo lỗi sớm, chị biết bản đèn cũ đang lẫn trong thư mục. |
| `dec:ha:B` | Dải đèn bật dần | thoại gọi lại của Hà; rủi ro kết cục +1 | Lỗi được sửa trên máy Hà, các máy khác vẫn giữ bản cũ. |
| `dec:ha:C` | Dải đèn bật dần | thoại gọi lại của Hà; rủi ro kết cục +2 | Bản đèn cũ vẫn nằm lẫn, không ai được báo. |
| `dec:notes:A` | Bắt lỗi đồng bộ | thoại gọi lại của Nam; thoại gọi lại của Vy; tin nhắn m5a | Mẫu đồng bộ có _ghichu, máy T3 nhận đủ lời ghi. |
| `dec:notes:B` | Bắt lỗi đồng bộ | thoại gọi lại của Nam; tin nhắn m5b; rủi ro kết cục +3 | Máy T3 vẫn dùng mẫu cũ và không nhận lời ghi. |
| `dec:notes:C` | Bắt lỗi đồng bộ | thoại gọi lại của Vy; tin nhắn m5c; rủi ro kết cục +3 | Lời ghi được chép tay, có thể sót vài dòng. |
| `dec:captions:A` | Ghép ảnh với lời ghi | thoại gọi lại của Đại diện sinh viên USSH; thoại gọi lại của Linh; tin nhắn m7a; kết cục → E3 nếu còn sai sót nhỏ | Lời ghi được giữ nguyên chữ của người góp ảnh. |
| `dec:captions:B` | Ghép ảnh với lời ghi | thoại gọi lại của Linh; tin nhắn m7b; rủi ro kết cục +2 | Lời ghi bị rút gọn, mất vài chi tiết. |
| `dec:captions:C` | Ghép ảnh với lời ghi | thoại gọi lại của Đại diện sinh viên USSH; tin nhắn m7c; rủi ro kết cục +3 | Ảnh được chiếu không kèm lời ghi. |
| `dec:drones:A` | Dàn drone chữ 70 | dòng thời gian, độ thân thiết | Drone xếp theo hướng nhìn của khán giả. |
| `dec:drones:B` | Dàn drone chữ 70 | thoại gọi lại của Điều phối sân khấu USSH; rủi ro kết cục +10; kết cục → E4 | Drone xếp theo hướng sân khấu, khán giả nhìn ngược lại. |
| `dec:final:A` | Thứ tự tổng duyệt | thoại gọi lại của Điều phối sân khấu USSH; thoại gọi lại của Bảo; thoại gọi lại của Đức; tin nhắn m9a | Cả nhóm xác nhận cùng một bản lịch. |
| `dec:final:B` | Thứ tự tổng duyệt | thoại gọi lại của Đức; tin nhắn m9b; rủi ro kết cục +3 | T3 dùng bản lịch 3, sân khấu USSH dùng bản 4. |
| `dec:final:C` | Thứ tự tổng duyệt | thoại gọi lại của Bảo; tin nhắn m9c; rủi ro kết cục +2 | Chỉ hai người biết bản chốt, những người khác đoán. |
| `dec:bursts:A` | Đối chiếu bằng chứng | dòng thời gian, độ thân thiết | Pháo hoa giữ đúng kịch bản. |
| `dec:bursts:B` | Đối chiếu bằng chứng | rủi ro kết cục +2 | Kịch bản pháo hoa có thêm chùm ngoài dự kiến. |
| `dec:bursts:C` | Đối chiếu bằng chứng | rủi ro kết cục +8; kết cục → E6 (cần 7 sự thật) | Pháo hoa được xếp theo các ước thực sự của 70. |
| `done:s2` | Dải đèn bật dần | chủ đề Hà: Ngại báo lỗi | Mở thêm nội dung |
| `done:s3` | Chỉnh hướng chiếu | tin nhắn m3 | Mở thêm nội dung |
| `done:s4` | Báo cáo ở T3 | chủ đề Chị Chủ nhiệm HAMIC: Bản sao lưu; chủ đề Minh: Đón khách; tin nhắn m4 | Mở thêm nội dung |
| `done:s6` | Bắt lỗi đồng bộ | chủ đề Vy: Kiểm tra hai lần | Mở thêm nội dung |
| `done:s8` | Bộ ảnh bên USSH | chủ đề Đại diện sinh viên USSH: Người góp ảnh; tin nhắn m6 | Mở thêm nội dung |
| `done:s9` | Ghép ảnh với lời ghi | chủ đề Chị Chủ nhiệm HAMIC: Các bạn USSH; chủ đề Linh: Nhỏ mà thành lớn | Mở thêm nội dung |
| `done:s10` | Nhịp chữ và hiệu ứng | thoại gọi lại của An | Mở thêm nội dung |
| `done:s11` | Chọn bốn cảnh trong tám | chủ đề Điều phối sân khấu USSH: Nhìn từ phía nào? | Mở thêm nội dung |
| `done:s12` | Dàn drone chữ 70 | chủ đề Bảo: Lịch bản 3; tin nhắn m8 | Mở thêm nội dung |
| `done:s13` | Thứ tự tổng duyệt | chủ đề Đức: Bản chốt | Mở thêm nội dung |
| `done:s14` | Đối chiếu bằng chứng | tin nhắn m10 | Mở thêm nội dung |
| `chapter:ch3` | vào Chương III | chủ đề Số kỳ lạ (cần thêm 6 sự thật) | Mở sự thật thứ bảy và phương án E6 |

## 4. Hồ sơ 12 NPC

### Chị Chủ nhiệm HAMIC

- Gặp chính: Báo cáo ở T3, Đối chiếu bằng chứng.
- Vị trí theo chương: Mở đầu: Nhà T3 · trạm máy chủ; Chương I: Nhà T3 · trạm máy chủ; Chương II: Nhà T3 · trạm máy chủ; Chương II: Nhà T3 · trạm máy chủ; Chương III: Nhà T3 · trạm máy chủ.
- Chủ đề hỏi: Vì sao lại là 70?; Bản sao lưu (mở khi done:s4); Các bạn USSH (mở khi done:s9).
- Thoại theo chương: “Chị đang đợi em ở đây. Không vội đâu.” / “Em cứ hỏi Ban Học tập, bạn ấy giải thích dễ hiểu lắm.” / “Tệp ghi chú mà mất thì chữ hiện trống trơn, chị lo nhất chỗ đó.” / “Bên USSH dễ thương lắm, em cứ hỏi thoải mái.” / “Mình gần xong rồi. Em kiểm lại Sổ trước khi chốt nhé.”
- Gặp lại (gọi lại lựa chọn): [dec:ha:A] “Hà nhắn chị rồi. Báo sớm thế là tốt, sửa một chỗ đỡ hơn sửa mười chỗ.” / [dec:version:C] “Hai bản cùng về đây, chị phải tự mở từng bản. Lần sau ghi rõ giúp chị nhé.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Em đi một vòng mà ai cũng nhắc tên em. Năm sau chị giao em phụ trách người mới đấy.”
- Lời kết thường: “Cảm ơn em. Lần sau mình rút kinh nghiệm thêm một chút nhé.”

### Thành viên Ban Học tập

- Gặp chính: Căn dải sáng, Chỉnh hướng chiếu.
- Vị trí theo chương: Mở đầu: Sân cỏ Nhà T; Chương I: Sân cỏ Nhà T; Chương II: Sân cỏ Nhà T; Chương II: Sân cỏ Nhà T; Chương III: Sân cỏ Nhà T.
- Chủ đề hỏi: Giới hạn là gì?; Hồi mới vào; Số kỳ lạ (mở khi chapter:ch3).
- Thoại theo chương: “Tớ đang căn pháo hoa ở sân cỏ Nhà T.” / “Gặp tớ ở sân cỏ Nhà T nhé, mô phỏng mở sẵn rồi.” / “Cậu đi tìm tệp ghi chú à? Nhớ xem danh sách đồng bộ.” / “Ảnh bên USSH đẹp lắm, tớ xem trước rồi.” / “Tổng duyệt rồi! Hỏi tớ chuyện số 70 đi, có một điều hay lắm.”
- Gặp lại (gọi lại lựa chọn): [dec:firework:B] “Cái hệ số cho pháo bay mãi ấy, tớ vẫn hơi lo. Hàm không hội tụ thì không dừng đâu.” / [dec:firework:A] “Pháo dừng đúng 70 m rồi. Nhìn đồ thị tiến sát vạch mà sướng.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Cậu học nhanh thật. Năm sau cậu căn pháo, tớ đứng xem thôi.”
- Lời kết thường: “Cảm ơn cậu đã ghé sân cỏ Nhà T. Có gì về giới hạn cứ hỏi tớ.”

### Đại diện sinh viên USSH

- Gặp chính: Bộ ảnh bên USSH.
- Vị trí theo chương: Mở đầu: Nhà E · điểm dữ liệu; Chương I: Nhà E · điểm dữ liệu; Chương II: Nhà E · điểm dữ liệu; Chương II: Nhà E · điểm dữ liệu; Chương III: Nhà E · điểm dữ liệu.
- Chủ đề hỏi: Thời chung mái nhà; Người góp ảnh (mở khi done:s8).
- Thoại theo chương: “Bên mình chuẩn bị ảnh ở Nhà E.” / “Bạn HAMIC sang thì ghé Nhà E nhé.” / “Mình vẫn đang đợi tệp ghi chú từ T3.” / “Linh ghép ảnh cẩn thận lắm, bạn cứ tin.” / “Tối nay mình ngồi xem cùng các bạn HAMIC.”
- Gặp lại (gọi lại lựa chọn): [dec:captions:A] “Linh kể bạn giữ nguyên lời ghi. Mình nhắn người góp ảnh rồi, ai cũng vui.” / [dec:captions:C] “Ảnh mà không có lời ghi thì người góp ảnh hơi buồn. Nhưng mình hiểu khung chật.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Cảm ơn bạn đã giữ trọn lời ghi. Năm sau hai bên mình lại làm chung nhé.”
- Lời kết thường: “Cảm ơn bạn HAMIC. Lần sau mình gửi lời ghi sớm hơn.”

### Điều phối sân khấu USSH

- Gặp chính: Dàn drone chữ 70.
- Vị trí theo chương: Mở đầu: Nhà C / Sân khấu; Chương I: Nhà C / Sân khấu; Chương II: Nhà C / Sân khấu; Chương II: Nhà C / Sân khấu; Chương III: Nhà C / Sân khấu.
- Chủ đề hỏi: Lịch sân khấu; Nhìn từ phía nào? (mở khi done:s11).
- Thoại theo chương: “Sân khấu USSH ở Nhà C, khi nào rảnh ghé chơi.” / “Mình đang dựng khung sân khấu.” / “Bên mình chờ lịch cảnh từ T3.” / “Drone sẵn sàng, chỉ thiếu chương trình.” / “Tổng duyệt thì mình đứng cạnh Bảo.”
- Gặp lại (gọi lại lựa chọn): [dec:drones:B] “Mình đánh số drone theo phía sân khấu rồi. Mong là không ai đứng nhìn ngược.” / [dec:final:A] “Cả nhóm xác nhận bản 4 rồi. Lần đầu mình thấy lịch khớp hết.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Bạn làm việc với sân khấu dễ chịu lắm. Lần sau mình xin bạn sang phụ.”
- Lời kết thường: “Cảm ơn bạn. Hẹn gặp lại ở buổi diễn thật.”

### Minh · nhóm đón khách

- Gặp chính: Hai bản cùng tên.
- Vị trí theo chương: Mở đầu: Cổng HUS; Chương I: Cổng HUS; Chương II: Lối sau sân cỏ; Chương II: Lối sau sân cỏ; Chương III: Lối sau sân cỏ.
- Chủ đề hỏi: Hai chiếc USB; Đón khách (mở khi done:s4).
- Thoại theo chương: “Tớ ở cổng, cần gì cứ gọi.” / “Tớ vẫn đứng cổng đón khách, cậu đi tiếp đi.” / “Tớ chuyển ra lối sau sân cỏ đón đoàn USSH.” / “Đoàn USSH sắp sang, tớ đợi ở lối sau sân cỏ.” / “Tớ đứng lối sau sân cỏ dẫn khách vào chỗ ngồi.”
- Gặp lại (gọi lại lựa chọn): [dec:version:A] “Mã băm đúng là cứu tinh. Tớ ghi vào sổ tay rồi, lần sau so mã trước.” / [dec:version:B] “Giờ sửa muộn hơn mà lại là bản cũ. Tớ vẫn chưa hiểu sao lại thế.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Tớ sẽ nhớ chuyện mã băm cả đời. Cảm ơn cậu nhiều.”
- Lời kết thường: “Cảm ơn cậu đã ghé cổng. Tớ đi đón khách tiếp đây.”

### Hà · nhóm kỹ thuật

- Gặp chính: Dải đèn bật dần.
- Vị trí theo chương: Mở đầu: Sân cỏ Nhà T; Chương I: Sân cỏ Nhà T; Chương II: Sân cỏ Nhà T; Chương II: Sân cỏ Nhà T; Chương III: Nhà T3 · trạm máy chủ.
- Chủ đề hỏi: Bản đèn cũ; Ngại báo lỗi (mở khi done:s2).
- Thoại theo chương: “Mình đang dò dải đèn ở sân cỏ Nhà T.” / “Cậu cần gì về dải đèn cứ hỏi mình.” / “Mình vẫn ở sân cỏ Nhà T, kiểm thêm lần nữa.” / “Mình nghe nói bên USSH đẹp lắm.” / “Mình lên T3 rồi, đứng xem tổng duyệt.”
- Gặp lại (gọi lại lựa chọn): [dec:ha:A] “Báo xong nhẹ cả người. Chị còn cảm ơn mình nữa.” / [dec:ha:B] “Máy mình sửa rồi. Mà các máy khác thì sao nhỉ...” / [dec:ha:C] “Mình vẫn chưa nói với ai. Chắc không sao đâu nhỉ?”
- Lời kết khi thân (độ thân thiết ≥ 2): “Nhờ cậu mà mình dám nói. Lần sau mình báo luôn, không chờ ai hỏi.”
- Lời kết thường: “Cảm ơn cậu đã đếm đèn cùng mình.”

### Nam · người chuyển tư liệu

- Gặp chính: Mở tủ tư liệu.
- Vị trí theo chương: Mở đầu: Lối qua Căng tin; Chương I: Lối qua Căng tin; Chương II: Lối qua Căng tin; Chương II: Lối qua Căng tin; Chương III: Lối qua Căng tin.
- Chủ đề hỏi: Tủ tư liệu; Căng tin có gì ngon?.
- Thoại theo chương: “Tôi ngồi Căng tin canh tủ.” / “Tôi vẫn ở Căng tin.” / “Ông cần mở tủ hả? Lại đây.” / “Tệp ghi chú ông mang đi rồi, tôi ăn nốt cái bánh.” / “Tối tôi qua xem, nhớ giữ chỗ.”
- Gặp lại (gọi lại lựa chọn): [dec:notes:A] “Vy nhắn cả nhóm đồng bộ lại. Tôi bấm rồi nhé, nhanh lắm.” / [dec:notes:B] “Vy bảo chỉ sửa trên máy Vy. Máy T3 có nhận không thì tôi không biết.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Ông nhanh hơn tôi nghĩ. Lần sau tôi mời ông bánh mì.”
- Lời kết thường: “Cảm ơn ông. Tủ tôi khóa lại rồi.”

### Linh · nhóm tư liệu

- Gặp chính: Ghép ảnh với lời ghi.
- Vị trí theo chương: Mở đầu: Nhà E · điểm dữ liệu; Chương I: Nhà E · điểm dữ liệu; Chương II: Nhà E · điểm dữ liệu; Chương II: Nhà E · điểm dữ liệu; Chương III: Sân USSH.
- Chủ đề hỏi: Vì sao giữ lời ghi?; Nhỏ mà thành lớn (mở khi done:s9).
- Thoại theo chương: “Mình ở Nhà E với bộ ảnh.” / “Mình chờ tệp ghi chú ở Nhà E.” / “Nghe nói tệp ghi chú ở Căng tin à?” / “Mình ghép ảnh ở Nhà E, cậu ghé nhé.” / “Mình ra sân USSH xem tổng duyệt.”
- Gặp lại (gọi lại lựa chọn): [dec:captions:A] “Lời ghi vẫn nguyên chữ. Mình đọc lại mà muốn khóc.” / [dec:captions:B] “Lời ghi ngắn hơn rồi. Đọc lên vẫn được, nhưng thiếu thiếu.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Cảm ơn cậu đã đứng về phía lời ghi. Mình sẽ kể với người góp ảnh.”
- Lời kết thường: “Cảm ơn cậu đã ghé Nhà E.”

### An · sinh viên ghé xem

- Gặp chính: Nhịp chữ và hiệu ứng.
- Vị trí theo chương: Mở đầu: Sân USSH; Chương I: Sân USSH; Chương II: Sân USSH; Chương II: Sân USSH; Chương III: Sân cỏ Nhà T.
- Chủ đề hỏi: Nhìn từ ghế khán giả; Bạn học gì?.
- Thoại theo chương: “Mình chỉ đi ngang thôi.” / “Bên sân cỏ Nhà T sáng ghê.” / “Mình nghe nói có tủ khóa số, hay thế.” / “Mình ngồi sân USSH xem thử phần chữ.” / “Mình ra sân cỏ Nhà T ngồi xem tổng duyệt.”
- Gặp lại (gọi lại lựa chọn): [done:s10] “Giờ chữ hiện chậm hơn, mình đọc hết rồi. Thích ghê.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Cảm ơn bạn đã hỏi ý mình. Mình thấy như được làm cùng.”
- Lời kết thường: “Chúc buổi diễn suôn sẻ nhé.”

### Bảo · trực sân khấu

- Gặp chính: Chọn bốn cảnh trong tám.
- Vị trí theo chương: Mở đầu: Nhà C / Sân khấu; Chương I: Nhà C / Sân khấu; Chương II: Nhà C / Sân khấu; Chương II: Nhà C / Sân khấu; Chương III: Nhà C / Sân khấu.
- Chủ đề hỏi: Chọn bốn trong tám; Lịch bản 3 (mở khi done:s12).
- Thoại theo chương: “Anh ở Nhà C trực sân khấu.” / “Bên sân khấu chưa cần gì đâu em.” / “Anh chờ lịch cảnh.” / “Em ghé Nhà C nhé, anh có việc nhờ.” / “Anh đứng cạnh điều phối, có gì gọi anh.”
- Gặp lại (gọi lại lựa chọn): [dec:final:A] “Cả nhóm xác nhận bản 4. Lần sau anh nhắn hỏi trước, không đoán nữa.” / [dec:final:C] “Em hỏi riêng anh thôi à? Anh bảo bản 4, mà không biết điều phối biết chưa.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Em làm anh nhớ ra cách làm việc nhóm. Cảm ơn em.”
- Lời kết thường: “Cảm ơn em nhé. Hẹn tối nay.”

### Vy · nhóm kiểm tra

- Gặp chính: Bắt lỗi đồng bộ, Đường chuyển tư liệu.
- Vị trí theo chương: Mở đầu: Lối sang USSH; Chương I: Lối sang USSH; Chương II: Lối sang USSH; Chương II: Lối sang USSH; Chương III: Lối sang USSH.
- Chủ đề hỏi: Danh sách đồng bộ; Kiểm tra hai lần (mở khi done:s6).
- Thoại theo chương: “Mình ở lối sang USSH.” / “Mình đang kiểm danh sách đồng bộ.” / “Có việc về đồng bộ thì gặp mình.” / “Tệp sang Nhà E rồi chứ?” / “Mình đứng xem log trong lúc tổng duyệt.”
- Gặp lại (gọi lại lựa chọn): [dec:notes:A] “Mẫu chung sửa rồi. Mình thêm một dòng ghi chú để năm sau ai cũng hiểu.” / [dec:notes:C] “Chép tay thì mình không chắc đủ. Mình sẽ đối chiếu lại sau buổi diễn.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Cậu cẩn thận như mình. Lần sau mình rủ cậu soát mẫu cùng.”
- Lời kết thường: “Cảm ơn cậu. Mình ghi chú lại lần này.”

### Đức · phụ trách tổng duyệt

- Gặp chính: Thứ tự tổng duyệt.
- Vị trí theo chương: Mở đầu: Nhà T3 · trạm máy chủ; Chương I: Nhà T3 · trạm máy chủ; Chương II: Nhà T3 · trạm máy chủ; Chương II: Nhà T3 · trạm máy chủ; Chương III: Nhà T3 · trạm máy chủ.
- Chủ đề hỏi: Tổng duyệt; Bản chốt (mở khi done:s13).
- Thoại theo chương: “Anh ở T3, đang soạn lịch.” / “Anh bận soạn lịch, có gì em cứ đi tiếp.” / “Anh vẫn đang đợi lịch bên sân khấu.” / “Anh nghe nói drone sắp xong.” / “Mình tổng duyệt thôi em.”
- Gặp lại (gọi lại lựa chọn): [dec:final:B] “Bản 3 chắc ổn mà. Anh đã chạy thử bản đó một lần rồi.” / [dec:final:A] “May em nhắn cả nhóm. Anh suýt chạy bản 3.”
- Lời kết khi thân (độ thân thiết ≥ 2): “Em giúp anh nhiều hơn em nghĩ. Năm sau tổng duyệt em đứng cạnh anh nhé.”
- Lời kết thường: “Cảm ơn em. Lần sau anh soát lịch kỹ hơn.”

Độ thân thiết chỉ cộng, không trừ: +theo phương án quyết định, +1 mỗi chủ đề hỏi, +theo cảnh bond. Nó chỉ đổi lời kết, không hiện thành điểm số.

## 5. Nhánh listen / build

Ở lời mở đầu, người chơi chọn: “Dạ. Em sẽ hỏi chuyện từng người trước, chắc ai cũng biết một phần.” (listen) hoặc “Dạ. Em kiểm từng tệp, từng thông số một cho chắc.” (build). Mỗi chương có một cảnh riêng cho từng nhánh:

| Điểm dừng | listen | build |
|---|---|---|
| Hai bản cùng tên | Tớ kể cậu nghe: hôm đầu vào nhóm tớ cũng cầm nhầm USB của chị. Chị chỉ bảo, lần sau nhìn mã băm. Mã băm là gì vậy? Là dấu vân tay của tệp. Đổi một chữ là đổi hết. (thân thiết +) | Cho mình xem thông tin tệp trước đã. Đây, có giờ sửa và mã băm. Cậu tính so cả hai à? Ừ. Giờ sửa có thể đổi khi chép tệp, mã băm thì không. (thêm ghi chú kỹ thuật: Giờ sửa và mã băm) |
| Căn dải sáng | Hồi mới vào, tớ ngồi cả buổi mà pháo vẫn hụt. Chị bảo: nhìn đồ thị, đừng nhìn số. Nhìn đồ thị thì thấy gì? Thấy nó tiến sát vạch đến đâu. Cậu thử là biết. (thân thiết +) | h(t) = a(1 − e^(−bt)). a quyết định đích, b quyết định nhanh chậm đúng không? Chuẩn. Đích lấy a, tốc độ lấy b. Cậu đọc đề kỹ ghê. Tớ đưa cậu bảng b thử nghiệm của tớ, đỡ dò. (thêm ghi chú kỹ thuật: Bảng b thử nghiệm) |
| Mở tủ tư liệu | Tủ này có từ hồi tôi chưa vào. Mấy khóa trước để lại cả hộp bút với bản vẽ cũ. Bản vẽ cũ của gì vậy? Mô hình năm nào đó. Ông mở được tủ thì xem luôn. (thân thiết +) | Ba ổ khóa chia 2, 5, 7. Nhân lại là 70, nên chỉ có một số nhỏ hơn 70 thỏa cả ba. Ông nói gì tôi không hiểu lắm, nhưng nghe chắc chắn đấy. Chỉ cần thử các số lẻ chia 5 dư 2 thôi. (thêm ghi chú kỹ thuật: Ba ổ khóa) |
| Bộ ảnh bên USSH | Có một anh cựu sinh viên gửi ảnh kèm thư tay. Anh viết: ảnh mờ rồi, nhưng nhớ thì không mờ. Lời ghi trong ảnh là của anh ấy à? Ừ. Nên bọn mình mới muốn giữ nguyên. (thân thiết +) | Khung chữ trên mô hình rộng bao nhiêu ký tự? Khoảng sáu mươi. Lời ghi dài nhất có năm mươi tư. Vậy vừa khung, không cần rút gọn. (thêm ghi chú kỹ thuật: Khung chữ) |
| Thứ tự tổng duyệt | Năm ngoái tổng duyệt, anh run đến mức bấm nhầm nút tắt đèn cả sân. Rồi sao nữa anh? Cả sân cười. Chị bật lại, bảo: lỗi lúc tổng duyệt là lỗi tốt. (thân thiết +) | Anh có bảng phụ thuộc giữa các cảnh không? Có, anh vẽ tay đây. Mũi tên chỉ cảnh nào cần cảnh nào. Vậy tìm cảnh không cần gì trước, rồi gỡ dần. (thêm ghi chú kỹ thuật: Bảng phụ thuộc) |

## 6. Kết cục

Kết cục tính bằng hàm thuần `pickEnding` từ tám quyết định. Mỗi phương án có trọng số rủi ro (`config.json → endings.risk`), ngưỡng `threshold = 18`.

Thứ tự xét:

1. Tổng rủi ro ≥ ngưỡng → **E2** (trừ khi `endings.boom.enabled = false`). Nguyên nhân hiển thị là sai sót gốc có trọng số lớn nhất người chơi để lại; không có thì biến thể "thêm một chùm".
1. Chọn cho pháo bay mãi → **E5**.
1. Chọn bản vẽ drone nhìn từ sân khấu → **E4**.
1. Chọn xếp pháo theo các ước của 70 (chỉ hiện khi đủ 7 sự thật) → **E6**.
1. Giữ nguyên lời ghi và tổng rủi ro > 0 → **E3**.
1. Còn lại (kể cả lượt không có rủi ro nào) → **E1**.

| Mã | Kết cục | Cách đạt | Tỉ lệ trên mọi tổ hợp | Mục tiêu |
|---|---|---|---|---|
| E1 | Đêm Hội tụ | Chọn phương án an toàn ở cả tám quyết định, hoặc chỉ sai sót nhẹ mà không giữ nguyên lời ghi. | 10.87% | 12% |
| E2 | Sự cố mô hình: nổ tung | Để lại nhiều sai sót cho tới khi tổng rủi ro ≥ 18. | 70.30% | 70% |
| E3 | Cầu ánh sáng Tự nhiên – Nhân văn | Giữ nguyên lời ghi; còn vài sai sót nhỏ chưa tới ngưỡng. | 5.52% | 6% |
| E4 | Drone xếp thành 07 | Bản vẽ drone nhìn từ phía sân khấu; tổng rủi ro dưới ngưỡng. | 4.29% | 4% |
| E5 | Pháo hoa bay mãi | Cho pháo vút lên không dừng; tổng rủi ro dưới ngưỡng. | 4.29% | 4% |
| E6 | Số kỳ lạ | Hỏi Ban Học tập chủ đề Số kỳ lạ khi đã có 6 sự thật, rồi chọn xếp pháo theo các ước của 70. | 4.73% | 4% |

Tổng số tổ hợp: 2916. E2 theo nguyên nhân: Nhầm phiên bản 919, Thiếu tệp ghi chú 906, Hai bản chốt 180, Thêm một chùm 45. `npm run check:answers` duyệt lại toàn bộ và báo lỗi nếu tỉ lệ lệch mục tiêu quá dung sai (E2 ±2, còn lại ±3 điểm phần trăm).

### Bảng trọng số rủi ro

| Quyết định | NPC | Phương án | Rủi ro | Hệ quả |
|---|---|---|---|---|
| `version` | Minh | A. Gửi Bản 1, mã băm 3f70a1 khớp với bản chị đã duyệt.  | 0 | Bản về T3 khớp mã băm với bản đã duyệt. |
| `version` | Minh | B. Gửi Bản 2, giờ sửa muộn hơn chắc là mới hơn.  | 6 | Bản đèn cũ của Hà, có giờ sửa muộn hơn, được đưa lên mô hình. |
| `version` | Minh | C. Gửi cả hai, để T3 tự chọn.  | 2 | Hai bản cùng tên về T3, người nhận phải tự đoán. |
| `firework` | Thành viên Ban Học tập | A. Giữ hàm dừng ở 70 m như đã căn.  | 0 | Pháo hoa giữ hàm hội tụ về 70 m. |
| `firework` | Thành viên Ban Học tập | B. Thêm hệ số cho pháo vút lên không dừng. → E5 | 10 | Pháo hoa được đổi sang hàm không hội tụ. |
| `ha` | Hà | A. Hà tự báo chị nhé, mình đi cùng.  | 0 | Hà báo lỗi sớm, chị biết bản đèn cũ đang lẫn trong thư mục. |
| `ha` | Hà | B. Để mình sửa lặng lẽ, khỏi nói ai.  | 1 | Lỗi được sửa trên máy Hà, các máy khác vẫn giữ bản cũ. |
| `ha` | Hà | C. Cứ để vậy, chắc không sao.  | 2 | Bản đèn cũ vẫn nằm lẫn, không ai được báo. |
| `notes` | Vy | A. Sửa mẫu chung và báo cả nhóm đồng bộ lại.  | 0 | Mẫu đồng bộ có _ghichu, máy T3 nhận đủ lời ghi. |
| `notes` | Vy | B. Chỉ sửa trên máy này thôi, chắc đủ.  | 3 | Máy T3 vẫn dùng mẫu cũ và không nhận lời ghi. |
| `notes` | Vy | C. Chép tay lời ghi vào bản chính, khỏi đụng mẫu.  | 3 | Lời ghi được chép tay, có thể sót vài dòng. |
| `captions` | Linh | A. Giữ nguyên lời ghi, đặt cạnh ảnh. → E3 nếu còn sai sót nhỏ | 0 | Lời ghi được giữ nguyên chữ của người góp ảnh. |
| `captions` | Linh | B. Rút gọn lời ghi cho vừa khung.  | 2 | Lời ghi bị rút gọn, mất vài chi tiết. |
| `captions` | Linh | C. Bỏ lời ghi, chỉ chiếu ảnh.  | 3 | Ảnh được chiếu không kèm lời ghi. |
| `drones` | Điều phối sân khấu USSH | A. Nhìn từ phía khán giả.  | 0 | Drone xếp theo hướng nhìn của khán giả. |
| `drones` | Điều phối sân khấu USSH | B. Nhìn từ phía sân khấu. → E4 | 10 | Drone xếp theo hướng sân khấu, khán giả nhìn ngược lại. |
| `final` | Đức | A. Nhắn cả nhóm xác nhận bản chốt kèm mã băm.  | 0 | Cả nhóm xác nhận cùng một bản lịch. |
| `final` | Đức | B. Tin lời Đức, bản 3 chắc chốt rồi.  | 3 | T3 dùng bản lịch 3, sân khấu USSH dùng bản 4. |
| `final` | Đức | C. Chỉ hỏi riêng Bảo cho nhanh.  | 2 | Chỉ hai người biết bản chốt, những người khác đoán. |
| `bursts` | Chị Chủ nhiệm HAMIC | A. Giữ đúng kịch bản 70 chùm.  | 0 | Pháo hoa giữ đúng kịch bản. |
| `bursts` | Chị Chủ nhiệm HAMIC | B. Thêm một chùm cho vui.  | 2 | Kịch bản pháo hoa có thêm chùm ngoài dự kiến. |
| `bursts` | Chị Chủ nhiệm HAMIC | C. Xếp pháo theo các ước của 70. → E6 (cần 7 sự thật) | 8 | Pháo hoa được xếp theo các ước thực sự của 70. |

### Màn kết

- Cảnh 3D trên mô hình (E1 trình diễn đầy đủ; E2 khối tòa nhà tách ra, bay lên chậm rồi rơi chậm, hoa giấy; E3 cầu ánh sáng nối hai trường; E4 drone xếp 07; E5 pháo bay mãi; E6 drone tách thành các cụm 1, 2, 5, 7, 10, 14, 35).
- Nút "Bỏ qua cảnh" có ngay từ đầu. "Giảm hiệu ứng ánh sáng" hoặc "Giảm chuyển động" thì cảnh E2 chuyển sang mờ dần tại chỗ.
- E2 luôn có chú thích: “Đây là mô hình trên máy tính. Khuôn viên thật vẫn nguyên vẹn.”
- Bảng kết: lời thoại, nguyên nhân hiển thị (E2), dòng thời gian nhân quả (tám lựa chọn, đánh dấu mục góp vào sự cố), mười hai lời kết NPC.
- Nút: Chọn lại từ tổng duyệt (giữ mọi lựa chọn trước điểm dừng Thứ tự tổng duyệt), Chơi lại từ đầu, Thư viện kết cục, Về menu. Thư viện giữ qua các lượt chơi và có gợi ý cách đạt kết cục chưa gặp.

## 7. Minigame

| Minigame | Điểm dừng · NPC | Cơ chế | Luật chấm (hàm thuần) | Kiến thức | Trợ năng |
|---|---|---|---|---|---|
| So hai bản cùng tên | Hai bản cùng tên · Minh | Bấm các dòng của Bản 2 khác Bản 1 | `evalVersions`: tập chọn = tập dòng khác | Đối chiếu phiên bản, mã băm | nút bấm được bằng bàn phím, aria-pressed, gợi ý 3 bậc |
| Căn dải sáng | Căn dải sáng · Thành viên Ban Học tập | Màn chơi của mô-đun có sẵn | `evaluate` (puzzles/logic) | theo mô-đun | như màn chơi Hành trình |
| Dải đèn bật dần | Dải đèn bật dần · Hà | Màn chơi của mô-đun có sẵn | `evaluate` (puzzles/logic) | theo mô-đun | như màn chơi Hành trình |
| Chỉnh hướng chiếu | Chỉnh hướng chiếu · Thành viên Ban Học tập | Màn chơi của mô-đun có sẵn | `evaluate` (puzzles/logic) | theo mô-đun | như màn chơi Hành trình |
| Ba ổ khóa | Mở tủ tư liệu · Nam | Màn chơi của mô-đun có sẵn | `evaluate` (puzzles/logic) | theo mô-đun | như màn chơi Hành trình |
| Bắt lỗi đồng bộ | Bắt lỗi đồng bộ · Vy | Bật/tắt thư mục, Chạy thử | `evalSync`: bật đủ thư mục cần, không mang thư mục thừa (đúng một tập hợp lệ) | Điều kiện lọc, đại số quan hệ σ | nút bấm được bằng bàn phím, aria-pressed, gợi ý 3 bậc |
| Đường chuyển tư liệu | Đường chuyển tư liệu · Vy | Chọn các đoạn đường trên sơ đồ lối đi | `evalGraph` (task shortest), đề dựng từ map.json; ngắn nhất 13 phút | Đường đi ngắn nhất, Dijkstra | chạm/chuột trên sơ đồ (như màn graph của Hành trình), gợi ý 3 bậc |
| Ghép ảnh với lời ghi | Ghép ảnh với lời ghi · Linh | Chọn ảnh rồi chọn lời ghi | `evalCaptions`: đủ 4 cặp và đúng (1/24 hoán vị) | Giữ nguồn tư liệu | nút bấm được bằng bàn phím, aria-pressed, gợi ý 3 bậc |
| Nhịp chữ và hiệu ứng | Nhịp chữ và hiệu ứng · An | Hai thanh trượt: lúc hiện chữ, thời gian giữ | `evalTiming`: hiện ≥ 1,2 s, giữ ≥ số chữ / tốc độ đọc, kết thúc ≤ 6 s | Bất đẳng thức, thời lượng | nút bấm được bằng bàn phím, aria-pressed, gợi ý 3 bậc |
| Chọn bốn cảnh trong tám | Chọn bốn cảnh trong tám · Bảo | Màn chơi của mô-đun có sẵn | `evaluate` (puzzles/logic) | theo mô-đun | như màn chơi Hành trình |
| Dàn drone chữ 70 | Dàn drone chữ 70 · Điều phối sân khấu USSH | Màn chơi của mô-đun có sẵn | `evaluate` (puzzles/logic) | theo mô-đun | như màn chơi Hành trình |
| Thứ tự tổng duyệt | Thứ tự tổng duyệt · Đức | Bấm các bước theo thứ tự chạy | `evalTopo`: mọi bước sau các bước nó cần; mọi thứ tự tô-pô đều đạt | Sắp xếp tô-pô | nút bấm được bằng bàn phím, aria-pressed, gợi ý 3 bậc |
| Đối chiếu bằng chứng | Đối chiếu bằng chứng · Chị Chủ nhiệm HAMIC | Chọn thẻ nguyên nhân | `evalCauses`: đúng ba thẻ thật | Suy luận từ bằng chứng | nút bấm được bằng bàn phím, aria-pressed, gợi ý 3 bậc |

Mọi minigame: không đồng hồ, không phạt, thử lại không giới hạn, ba bậc gợi ý (mức Cốt truyện dùng lời dẫn đơn giản đã qua lint Dạo chơi), dùng được ở 844×390. Thắp đèn lối đi là việc phụ tự do: 10 đèn ở 10 điểm dừng, thắp 7 để mở thành tựu, mỗi đèn mở một ghi chú.

## 8. Schema và bản lưu

- `story.json` (version 4): `chapters`, `stops` (activity có `type`), `decisions`, `evidence`, `items`, `npcs` (vị trí theo chương, chủ đề, thoại theo chương, gọi lại, lời kết), `bondScenes`, `messages`, `lamps`, `endings`; giữ `difficulties`, `modes` cho các mode phụ.
- `config.json → endings`: `boom.enabled`, `threshold`, `risk`, `target`, `tolerance`, `unlock.E6.facts`.
- `StoryState` version 4 (localStorage `hoitu70:story`): `step`, `introSeen`, `bond`, `decisions`, `topics`, `lamps`, `activeSeconds`, `endingsSeen`, `lastEnding`, `chatSeen`, `legacyStep`. Migration 3 → 4 giữ `introSeen`, `bond`, `activeSeconds`, đổi `step` cũ thành `legacyStep`; màn đi bộ dùng `migrateLegacy` để nhảy tới điểm dừng tương ứng (0→1, 1→2, 2→5, 3→6, 4→9, 5→14, 6→15 theo số thứ tự).
- Hack mode (Ctrl+Shift+H hoặc `?hack=70`): xem thẳng sáu kết cục và ba biến thể E2, nhảy tới điểm dừng bất kỳ; chạy trên bản sao trong bộ nhớ.

## 9. Rủi ro và việc cần CLB xác nhận

- Cảnh E2 có tên HUS và USSH: cần người có trách nhiệm của CLB đồng ý trước khi phát hành; có thể tắt bằng `endings.boom.enabled`.
- Chi tiết lịch sử nền: hai trường cùng tên Đại học Tổng hợp Hà Nội giai đoạn 1956–1995 (nguồn [7][8] trong GDD); câu nhắc bài lượng – chất.
- Bản đồ và tên địa điểm (`mapVerified: false`), gồm tên ngắn dùng trong lời thoại.
- Dòng chúc 70 năm (`greetingVerified: false`).
- Tỉ lệ E2 70% theo yêu cầu: người chơi cẩn thận vẫn có thể tránh hoàn toàn; người chơi chọn tùy ý gặp E2 thường xuyên. Có thể hạ bằng cách tăng `threshold`.
- Thời lượng 20–25 phút là ước lượng theo số bước; cần chơi thử R3 để hiệu chỉnh.
