# Trailer Đêm Toán Tin: kịch bản Facebook Story (bản 2)

Biên soạn cho fanpage CLB Toán Tin HAMIC · 31/10/2026 · Thời lượng 58 giây · khung 9:16, 1080 × 1920

## 1. Tóm tắt

- Trailer dài 58 giây, khung dọc 9:16, tiếng Việt, có phụ đề vì nhiều người xem không bật tiếng.
- Lời đọc bản 3 có 201 âm tiết, khoảng 63–65 giây ở tốc độ 3,1–3,2 âm tiết mỗi giây, vượt giới hạn 58 giây. Cần rút xuống khoảng 133–150 âm tiết (xem mục 6). Phần còn lại dành cho hình ảnh, khoảng lặng và chữ trên màn hình.
- Chỉ dùng cảnh quay từ chính bản game. Không dùng logo, ảnh thật hay tiếng nổ thật.

## 2. Điều kiện trước khi đăng

1. **CLB xác nhận cảnh nổ có tên HUS và USSH.** Đây là mục đang chờ xác nhận trong phụ lục GDD. Nếu chưa được duyệt, thay dòng chữ lớn bằng “NỔ TUNG CẢ SA BÀN?!”.
2. **Đổi tên game.** Trailer dùng “Đêm Toán Tin”, nhưng bản game hiện vẫn ghi “Hội tụ 70”. Cần đổi tên trong game trước khi đăng, hoặc đổi lại tên trong trailer.
3. **Logo và áo đồng phục.** Nhân vật trong game có áo in chữ HUS và HAMIC, vẽ theo ảnh trong docs/assets (web/src/scene/walking.ts). Ràng buộc của dự án cấm logo thật, nên cần CLB xác nhận hoặc tránh quay cận các áo này.
4. **Nhạc nền.** Dự án chưa có nhạc. Dùng nhạc có giấy phép rõ ràng hoặc nhạc CLB tự làm. Hai tên nhạc trong bản thiết kế cũ (“Exploration Theme”, “Heavenly Loop”) không có trong dự án và chưa rõ giấy phép.
5. **Giọng đọc.** Dùng giọng dựng sẵn của nền tảng TTS. Không nhái giọng người thật khi chưa có sự đồng ý của họ.
6. **Giới hạn thời lượng.** Một nguồn công khai ghi giới hạn 60 giây cho video Story đăng qua Page. Hãy kiểm tra trên ứng dụng trước khi đăng. Bản 58 giây nằm trong giới hạn đó.

## 3. Nguồn hình và âm thanh

- **Dự án không có tệp video hay âm thanh.** Thư mục cinematics và audio không tồn tại, nên các tệp E2.mp4, E2.m4a... trong bản thiết kế cũ không dùng được.
- **Quay từ game.** Các kết cục được dựng trực tiếp bằng Three.js (web/src/scene/world.ts, hàm playShow). Chạy bản preview ở cửa sổ 1920 × 1080, mở Hack mode (Ctrl+Shift+H) để chọn E1, E2, E3 rồi quay màn hình.
- **Âm thanh.** Âm thanh trong game được tổng hợp bằng WebAudio (web/src/core/audio.ts), không có tệp âm thanh. Có thể thu tiếng từ game hoặc làm hiệu ứng riêng.
- **Khung 9:16.** Quay ngang 16:9 rồi đặt vào giữa khung dọc. Nền mờ lấy từ chính cảnh đó. Nếu muốn chia đôi màn hình như bản cũ, cần quay hai góc máy khác nhau, không cắt từ một khung.
- **An toàn hình ảnh.** Không chớp quá 3 lần mỗi giây, không lửa khói thật, không người thật. Cảnh nổ chạy chậm và có hoa giấy.

## 4. Vùng an toàn trên khung dọc

- 0–250 px: để trống cho ảnh đại diện và thanh tiến trình của Story.
- 260–440 px: tiêu đề “ĐÊM TOÁN TIN” (Be Vietnam Pro 800).
- 440–1280 px: hình ảnh chính.
- 1320–1560 px: phụ đề, mỗi nhịp 4–6 chữ.
- 1620–1920 px: để trống cho khung trả lời và nhãn liên kết.

## 5. Phân cảnh

*Bảng dưới được tính cho lời đọc 145 âm tiết cũ. Cần cập nhật lại mốc giây sau khi chốt lời ở mục 6.*

| Mốc (giây) | Hình | Âm thanh | Chữ trên màn hình |
| --- | --- | --- | --- |
| 0:00–0:05 | Nhá 1 giây cảnh nổ (E2 quay từ game), rồi cắt về sa bàn ban đêm | Lời 1 | “Giao sa bàn cho thành viên mới” |
| 0:05–0:18 | Nhân vật đi từ cổng HUS qua sân cỏ tới Nhà E. Ba cảnh giải đố ngắn: hai bản cùng tên, xếp gương, thư mục \_ghichu | Tiếng bước chân; lời 2 | Tên từng minigame hiện khi vào cảnh |
| 0:18–0:26 | Cửa sổ quyết định, mỗi lựa chọn có thẻ điểm rủi ro | Lời 3 | “Tám quyết định nhỏ” |
| 0:26,0–0:26,8 | Màn đen (không chớp) | Lặng | — |
| 0:26,8–0:33 | Cảnh E2: khối nhà rơi chậm, hoa giấy | Lời 4 | “NỔ TUNG CẢ SA BÀN?!” (hoặc tên HUS, USSH nếu CLB duyệt) |
| 0:33–0:36 | Giữ cảnh nổ cho người xem thấy rõ | Lặng 0,5 giây, nhạc nhỏ | — |
| 0:36–0:40,8 | Chú thích trong game | Lời 5 | “Khuôn viên thật vẫn nguyên vẹn”; tùy chọn: “Khoảng 70% cách chọn dẫn tới cảnh này” |
| 0:40,8–0:56 | E3 cầu ánh sáng (0:40–0:48), rồi E1 pháo hoa và drone xếp số 70 (0:48–0:56) | Lời 6 (từ 0:40,8) | “Đêm Toán Tin”; “Công bố 1/11 · Gian hàng HAMIC · Cơ sở Nguyễn Trãi” (cần CLB xác nhận) |
| 0:56–0:58 | Màn tên game, dòng phụ “Chơi trên điện thoại ngang” | Nhạc kết | “Bấm liên kết để chơi” |

## 6. Kịch bản lời đọc (201 âm tiết, cần rút gọn)

1. 1 ngày của thành viên Câu lạc bộ Toán tin Ha-mích có gì?
2. Trong tựa game “Đêm Toán Tin”, bạn đóng vai là 1 thành viên của câu lạc bộ toán tin ha mích chạy khắp hai trường để setup cho ngày hội chào tân của HUS và giải quyết các vấn đề như tìm vì sao đèn lệch, Hai file trùng tên, gương đặt ngược, lời ghi cũ thì biến mất và ti tỷ thứ khác nữa!
3. Tám quyết định nhỏ xíu cần áp dụng kiến thức của Đại số tuyến tính, giải tích, tin học,... . Chọn đại, hay thêm một chùm pháo cho vui? Chạy thử nào!

*Ngắt 0,8 giây*

4. Khoan đã! Sai vài con số, mà cả hai dãy nhà bung khỏi mặt đất rồi bay lên trời?!

*Ngắt 0,5 giây*

5. Bình tĩnh, đây chỉ là mô phỏng. Khuôn viên thật vẫn nguyên vẹn.
6. Đêm Toán Tin sẽ được Công bố vào ngày 1 tháng 11 tại Gian hàng Câu lạc bộ Toán tin Ha-mích ở cơ sở Nguyễn Trãi - nơi tổ chức sự kiện chào tân của HUS. Bạn sẽ thắp sáng đêm hội, hay làm nổ tức HUS và USSH?

Khi đưa vào công cụ TTS, chỉ đưa phần lời, không đưa chữ “ngắt”. Các khoảng lặng thêm trong trình dựng video. Tốc độ đọc khoảng 1,0–1,05.

**Đề xuất rút gọn (133 âm tiết, khoảng 43 giây), để bạn chọn:**

1. Một ngày của thành viên Câu lạc bộ Toán tin Ha-mích có gì?
2. Bạn chạy khắp hai trường tìm vì sao đèn lệch: hai file trùng tên, gương đặt ngược, lời ghi cũ biến mất!
3. Tám quyết định nhỏ xíu, dùng đại số tuyến tính, giải tích, tin học. Chọn đại, hay thêm một chùm pháo cho vui? Chạy thử nào!
4. Khoan đã! Sai vài con số, mà cả hai dãy nhà bung khỏi mặt đất rồi bay lên trời?!
5. Bình tĩnh, đây chỉ là mô phỏng. Khuôn viên thật vẫn nguyên vẹn.
6. Đêm Toán Tin công bố ngày 1 tháng 11 tại gian hàng CLB Toán tin Ha-mích, cơ sở Nguyễn Trãi. Bạn sẽ thắp sáng đêm hội, hay làm nổ tức HUS và USSH?