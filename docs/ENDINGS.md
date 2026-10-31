# Hệ thống nhiều kết cục "Hội tụ 70"

> **Cập nhật 2.8.0 (yêu cầu của người phụ trách, ưu tiên hơn mọi mô tả bên dưới):** tỉ lệ khoảng 70% cho E2 đạt được bằng cách **chỉnh thông số game để khoảng 70% tổ hợp lựa chọn của người chơi dẫn tới E2**, không dùng vòng quay, hạt giống hay nút "Thử lần quay khác". Mỗi phương án của tám quyết định có trọng số rủi ro trong `config.json → endings.risk`; tổng ≥ `threshold` thì ra E2. Kết quả duyệt mọi tổ hợp (2916): E1 10,87%, E2 70,30%, E3 5,52%, E4 4,29%, E5 4,29%, E6 4,73%. Ba sai sót gốc cùng các lựa chọn nhỏ đủ vượt ngưỡng mà không cần các lựa chọn đặc biệt. Chi tiết và bảng trọng số: `docs/STORY_BIBLE.md` mục 6. Nút "Thử lần quay khác" được thay bằng "Chọn lại từ tổng duyệt".

Bản này thay phần "ma trận kết cục" trong file đại tu trước. Hai kết cục bạn yêu cầu là **E1 Pháo hoa mừng 70 năm HUS** và **E2 Sa bàn nổ tung HUS và USSH (khoảng 70%)**; các kết cục còn lại là gợi ý thêm.

## 1. Danh sách kết cục

| Mã | Tên gợi ý | Tỉ lệ (mục tiêu) | Mô tả cảnh | Điều kiện (bản 2.8: xem STORY_BIBLE mục 6) |
|---|---|---|---|---|
| E1 | Đêm Hội tụ | 12% | Tia sáng từ các tòa nhà hội tụ về bãi cỏ HUS, pháo hoa và drone xếp chữ 70, dòng chúc "Chúc mừng 70 năm Trường Đại học Khoa học Tự nhiên" | Mặc định |
| E2 | Sự cố sa bàn: nổ tung | 70% | Pháo hoa quá liều, các khối tòa nhà HUS và USSH rời nhau, rơi chậm như phim quay chậm, hoa giấy rơi xuống; chị Chủ nhiệm: "May mà mới chạy trên máy, chị còn bản sao." | Mặc định; có 3 biến thể theo nguyên nhân (mục 3) |
| E3 | Cầu ánh sáng Tự nhiên – Nhân văn | 6% | Tia sáng nối hai trường thành một nhịp cầu; bạn USSH chụp lại gửi người góp ảnh | Mặc định (dùng lại kết cục `good` hiện có) |
| E4 | Drone xếp thành "07" | 4% | Drone xếp ngược thành 07, cả nhóm cười, sửa lại một phím | Mặc định |
| E5 | Pháo hoa bay mãi | 4% | Pháo hoa không dừng ở 70 m mà bay thẳng lên trời: "hàm này không hội tụ!" | Mặc định, chơi chữ với giới hạn |
| E6 | Số kỳ lạ | 4% | Pháo hoa tách thành các ước 1, 2, 5, 7, 10, 14, 35 mà không ghép lại thành 70 được (70 là số kỳ lạ nhỏ nhất, GDD 5.3) | Chỉ khi đã thu đủ 7 sự thật; nếu chưa đủ, 4% dồn về E1 |

Gợi ý thêm nếu muốn mở rộng (chưa tính vào tỉ lệ):

| Mã | Ý tưởng |
|---|---|
| E7 | **Sa bàn xoay 90°:** toàn bộ khuôn viên xoay theo ma trận R, nhà E nằm ngang; nhắc lại bài hướng chiếu |
| E8 | **Mất điện, sáng bằng đèn điện thoại:** sa bàn tắt, khán giả cùng bật đèn, tạo đom đóm chữ 70 (kết cục ấm) |
| E9 | **Tua lại (rewind):** sau khi nổ, chị Chủ nhiệm khôi phục bản sao, thời gian chạy ngược về cổng HUS, người chơi nhận một "lượt thử mới" |
| E10 | **Khuôn viên đa sắc:** T3 hồng hết (kết cục `neutral` hiện có), nhắc ghép nhầm bảng màu |
| E11 | **Nhà E bay lên** (kết cục `oops` hiện có), dùng làm biến thể hài của E2 |
| E12 | **Kết cục của An:** khán giả thử xem xong nói điều bất ngờ làm cả nhóm đổi chương trình |

## 2. Cách chọn kết cục với tỉ lệ 70% (bản 2.8: theo lựa chọn)

1. Luật nằm trong `web/public/data/config.json`:
```json
"endings": {
  "boom": { "enabled": true },
  "threshold": 18,
  "risk": { "version": {"A":0,"B":6,"C":2}, "firework": {"A":0,"B":10}, "ha": {"A":0,"B":1,"C":2}, "notes": {"A":0,"B":3,"C":3},
            "captions": {"A":0,"B":2,"C":3}, "drones": {"A":0,"B":10}, "final": {"A":0,"B":3,"C":2}, "bursts": {"A":0,"B":2,"C":8} },
  "target": { "E1": 12, "E2": 70, "E3": 6, "E4": 4, "E5": 4, "E6": 4 },
  "tolerance": { "E2": 2, "other": 3 },
  "unlock": { "E6": { "facts": 7 } }
}
```
2. Hàm thuần `pickEnding(story, rules, decisions, facts)` trong `puzzles/logic/story.ts`: tổng rủi ro ≥ ngưỡng → E2; sau đó E5 (pháo không hội tụ), E4 (drone nhìn từ sân khấu), E6 (xếp pháo theo các ước, cần 7 sự thật; chưa đủ thì về E1), E3 (giữ nguyên lời ghi và còn sai sót nhỏ), còn lại E1. Cùng lựa chọn luôn cho cùng kết cục.
3. `npm run check:answers` duyệt mọi tổ hợp và báo lỗi nếu tỉ lệ lệch `target` quá `tolerance`; kiểm thêm: E6 không ra khi chưa đủ 7 sự thật, `boom.enabled = false` thì không bao giờ ra E2.
4. Người chơi cẩn thận (chọn an toàn cả tám lần) không gặp E2. Muốn giảm tần suất E2 thì tăng `threshold` rồi chạy lại kiểm thử.

## 3. Ba biến thể nguyên nhân của E2

| Biến thể | Nguyên nhân (từ lựa chọn trong truyện) | Thoại đại diện |
|---|---|---|
| E2a | Nhầm phiên bản "hai bản cùng tên" | Minh: "Hai bản cùng tên, tớ gửi nhầm bản chạy nhanh." |
| E2b | Tệp ghi chú bị bỏ sót khi đồng bộ | Vy: "Thư mục ghi chú không nằm trong danh sách lấy." |
| E2c | Hai nhóm hiểu khác nhau về bản chốt | Đức: "Mình tưởng bản đó đã chốt rồi." |

Biến thể hiển thị là sai sót gốc có trọng số lớn nhất người chơi để lại. Nếu người chơi đã sửa đúng cả ba mà vẫn vượt ngưỡng (do các lựa chọn khác), E2 dùng biến thể hài thuần túy: "pháo hoa quá liều vì ai cũng muốn thêm một chùm". Nguyên nhân cuối luôn được hiển thị trong dòng thời gian để kết cục không cảm giác ngẫu nhiên vô nghĩa.

## 4. Điều kiện an toàn cho cảnh nổ

- Hoạt hình khối, rơi chậm, hoa giấy; không lửa, khói thật, người trong cảnh, tiếng nổ lớn hay chớp sáng. Không nhấp nháy quá 3 lần/giây.
- Có nút "Bỏ qua" ngay từ đầu cảnh, và tôn trọng "Giảm hiệu ứng ánh sáng" (đổi thành mờ dần).
- Chú thích rõ: "Đây là sa bàn mô phỏng. Khuôn viên thật vẫn nguyên vẹn."
- Công tắc `endings.boom.enabled` để tắt E2 ở nơi trình diễn cần.
- Vì cảnh có tên HUS và USSH, nên xin người có trách nhiệm của CLB đồng ý trước khi phát hành (đã thêm vào GDD 5.4).

## 5. Các tệp đã sửa kèm theo

- `GDD.md`: mục 2.1 điều 4, mục 4.7, mục 12.2, thêm mục 5.4 "Kết cục".
- `AGENTS.md`: dòng cấm cháy nổ được thay bằng quy tắc có điều kiện cho cảnh nổ hoạt hình.

## 6. Prompt giao cho tác tử (dùng sau "Bối cảnh chung" trong file trước; thay cho phần kết cục của Prompt 5)

````
Nhiệm vụ: cài hệ thống nhiều kết cục theo docs/GDD.md mục 5.4 (đã sửa) và ENDINGS.md. Đọc thêm: web/src/ui/screens/finale.ts, web/src/puzzles/logic/story.ts (storyEnding), web/public/data/story.json (endings), web/public/data/config.json, web/src/scene/world.ts, web/src/scene/atmosphere.ts.

Việc cần làm:
1. Dữ liệu: thêm endings vào config.json (weights, boom.enabled, unlock) và mô tả các kết cục E1–E6 trong story.json (tên, thoại, cảnh, biến thể E2a/E2b/E2c); mọi chuỗi qua t() trong vi.json. Giữ các kết cục good, neutral, oops cũ làm nguồn thoại cho E3, E10, E11.
2. Logic thuần trong puzzles/logic/story.ts: pickEnding(weights, seed, unlocked) dùng bộ sinh số giả ngẫu nhiên có hạt giống; chuẩn hóa trọng số khi kết cục chưa mở (dồn về E1); chọn biến thể E2 từ cờ lựa chọn trong truyện (nhầm phiên bản, thiếu ghi chú, hiểu khác bản chốt; nếu không có cờ nào thì biến thể hài "thêm một chùm"). Thêm ca kiểm vào check-answers: cùng seed cho cùng kết cục; phân phối trên nhiều seed gần đúng trọng số; E6 không ra khi chưa đủ 7 sự thật; boom.enabled=false thì không bao giờ ra E2.
3. StoryState: thêm endingSeed và endingsSeen; tăng version, viết migration từ version hiện tại, sửa validate; bản lưu cũ vẫn mở được. Nút "Thử lần quay khác" tạo seed mới, không xóa tiến trình khác.
4. Cảnh nổ (E2) trong scene: các khối tòa nhà HUS và USSH (lấy từ map.json) tách ra, rơi chậm, hoa giấy; không lửa, khói thật, người, tiếng nổ lớn hay chớp sáng; không nhấp nháy quá 3 lần/giây; có nút Bỏ qua; với "Giảm hiệu ứng ánh sáng" thì chuyển sang mờ dần; chú thích "Đây là sa bàn mô phỏng. Khuôn viên thật vẫn nguyên vẹn." Âm thanh nhẹ (không tiếng nổ lớn).
5. Các cảnh E1, E3–E6: tái dùng màn trình diễn và cảnh có sẵn khi có thể, thêm biến thể nhỏ (drone xếp "07", pháo hoa bay lên, ước số tách rời).
6. Màn kết: dòng thời gian nhân quả (lựa chọn nào dẫn tới nguyên nhân nào), nút Chơi lại, nút Thử lần quay khác, mở Thư viện kết cục; thành tựu "Gặp đủ kết cục" thêm vào achievements.json (không phạt).
7. Giữ Hack mode: cho phép chọn thẳng kết cục để xem thử.
8. Cập nhật CHANGELOG.md, docs/WALKTHROUGH.md; chạy npm run check && npm run build, rồi npm run capture và xem ảnh từng kết cục ở 844×390. Báo cáo kết cục nào chưa đạt và vì sao.
````
