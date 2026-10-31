> **Bản 2.8.0 (31/10/2026):** cốt truyện đại tu thành "Vì sao đèn lệch?" (15 điểm dừng, 12 NPC, 12 câu đố và minigame nối vào truyện, 8 quyết định). Kết cục E1–E6 do lựa chọn của người chơi quyết định; trọng số trong `config.json → endings` được chỉnh để khoảng 70% tổ hợp lựa chọn dẫn tới E2 (không quay ngẫu nhiên). Chi tiết: [STORY_BIBLE.md](STORY_BIBLE.md), [ENDINGS.md](ENDINGS.md). Thêm joystick ảo, HUD gọn cho màn ngang thấp, bản đồ nhỏ, lịch sử thoại, công thức KaTeX, tự hạ chất lượng trên máy yếu.

> **Nới lỏng nguyên tắc nội dung (bản hiện hành):** GDD chuyển từ "bắt buộc, chỉ Toán – Tin" sang "định hướng". Phần lõi vẫn là Toán – Tin do HAMIC tự kiểm. Cốt truyện, NPC hư cấu, tên trường và tòa nhà, và một vài chi tiết đời sống CLB, kể cả nhắc ngắn đến thời chung mái nhà Đại học Tổng hợp Hà Nội, được phép khi giữ đúng các điều kiện ở mục 2.1. Các mục 2.1 và 12.2 đã được sửa theo. Khi nội dung game và GDD lệch nhau, ghi vào CHANGELOG rồi cập nhật GDD sau, không chặn việc làm game.

> **Điều chỉnh tiến trình:** bỏ khóa thời gian. Tám bàn giao có thao tác kiểm tra, nối vào từng chặng và ba cảnh tổng duyệt tuần tự tạo thời lượng chơi mục tiêu khoảng 10 phút. Không ép chờ. Xem WALKTHROUGH.

> **Bổ sung 2.6:** câu chuyện bắt đầu cuối chiều và tối dần theo chặng. Camera giữ khoảng cách, làm mờ tòa nhà che nhân vật. Có thể trò chuyện với mọi NPC ở gần. Lời thoại được biên tập bằng Humanizer; xem [WALKTHROUGH bản 2.7](archive/WALKTHROUGH.v2.7.0.md); luồng 2.8 ở [WALKTHROUGH.md](WALKTHROUGH.md).

> **Bổ sung 2.5:** ưu tiên nhập vai và cốt truyện, chọn nhịp chơi ở menu, hội thoại phân nhánh, nhật ký và nội dung riêng cho các mode. Chi tiết có ưu tiên tại [WALKTHROUGH bản 2.7](archive/WALKTHROUGH.v2.7.0.md).

> **Cập nhật lối chơi theo yêu cầu 2.4 (30/10/2026):** phần Hành trình cũ dưới đây được giữ làm tài liệu các câu đố. Vòng chơi chính mới là đi bộ nhận nhiệm vụ trong khuôn viên; mô tả 2.4 tại [WALKTHROUGH.md](WALKTHROUGH.md) có ưu tiên với cốt truyện, NPC và kết cục. Quy định không áp lực thời gian, không cháy nổ và không chớp nhanh vẫn áp dụng. Nhân vật đều hư cấu, không đại diện phát ngôn chính thức của đơn vị.

# TÀI LIỆU THIẾT KẾ GAME (GDD) — PHIÊN BẢN 2.2 (cập nhật đến 2.8.0)

## "HỘI TỤ 70" — LỄ HỘI ÁNH SÁNG CỦA CLB TOÁN TIN (HAMIC)

| Mục | Nội dung |
|---|---|
| Đơn vị thực hiện | CLB Toán Tin (HAMIC) |
| Phiên bản | 2.2, thêm chế độ Dạo chơi cho người không chuyên Toán – Tin (trên nền 2.1: sinh nội dung tự động có kiểm chứng kép; 2.0: thiết kế lại hoàn toàn) |
| Ngày lập | 30/10/2026 |
| Thể loại | Puzzle trên web, học qua thao tác, ngắn gọn |
| Nền tảng | Trình duyệt (máy tính, điện thoại); có bản chạy ngoại tuyến cho máy trình diễn tại sự kiện |
| Thời lượng | Chế độ Khách 5 phút; hoàn thành toàn bộ khoảng 60–90 phút |
| Nguyên tắc nội dung | Phần học là kiến thức Toán – Tin do HAMIC tự làm và tự kiểm. Cốt truyện và bối cảnh có thể chạm tới đời sống CLB, trường và lịch sử ở mức nền, theo mục 2.1 |

**Quy ước.** `[ĐỀ XUẤT]` là thiết kế mới; `[XÁC MINH]` là điều cần đối chiếu trước khi dùng. Số trong ngoặc vuông như [1] trỏ tới mục Nguồn tham khảo.

---

## 1. ĐỀ XUẤT TÓM TẮT

**Ý tưởng một câu:** người chơi là một kỹ sư ánh sáng thực tập của HAMIC, thắp lại **bảy mạch ánh sáng** cho đêm lễ hội mừng 70 năm bằng cách *giải các câu đố Toán – Tin có thật*; mỗi mạch là một chủ đề, và cả bảy mạch cùng **hội tụ** về con số 70.

**Vì sao thiết kế này phù hợp với HAMIC:**

| Đặc điểm | Lợi ích |
|---|---|
| Mọi câu đố là phép tính hoặc thao tác có đáp án kiểm chứng được | HAMIC tự làm và tự kiểm, không cần chuyên gia ngoài ngành |
| Số 70 là sợi chỉ xuyên suốt, gắn với toán (70 = 2·5·7, C(8,4) = 70, số kỳ lạ nhỏ nhất) | Mừng 70 năm bằng chính ngôn ngữ của CLB; lịch sử chỉ cần ở mức một câu nền |
| Nhân vật đều hư cấu, không đại diện phát ngôn của đơn vị nào; nhắc đến đơn vị khác chỉ với thái độ trân trọng | Giữ rủi ro phản cảm ở mức thấp mà vẫn có cốt truyện |
| Câu đố là "tương tác có phản hồi" thay vì trắc nghiệm | Người không học Toán vẫn chơi được nhờ trực quan và gợi ý |
| Mỗi dạng câu đố là một mô-đun độc lập, dữ liệu viết bằng JSON | Chia việc cho nhiều thành viên; mở rộng sau sự kiện |

**Các hướng đã cân nhắc và loại:** (a) trắc nghiệm có cốt truyện, vì nhàm và dễ đoán đáp án; (b) game xây dựng khuôn viên, vì khối lượng đồ họa và cân bằng lớn; (c) game hành động, vì không phù hợp nội dung học thuật.

---

## 2. NGUYÊN TẮC THIẾT KẾ

### 2.1. Nguyên tắc nội dung (định hướng, đã nới lỏng) `[ĐỀ XUẤT]`

1. **Lõi là Toán – Tin.** Phần câu đố và kiến thức học phải là Toán – Tin đã kiểm tra. Cốt truyện, hội thoại và bối cảnh được phép nhắc tới trường, đơn vị bạn và lịch sử ở mức nền (một hai câu), miễn là chính xác, trân trọng, không chọn phe và có người của CLB xem qua. Không đưa nội dung triết học hay học thuật ngành khác vào phần câu đố. Lời chúc 70 năm vẫn là một dòng cố định (mục 11.3).
2. **Không chế giễu ai.** Hài hước chỉ nhắm vào *tình huống kỹ thuật* trong game.
3. **Không gắn nhãn tính cách cho người chơi.** Phản hồi mô tả hệ quả của lựa chọn, không đánh giá con người.
4. **Sai là một phần của học.** Mạch chưa ổn chỉ chuyển xám và hiện số liệu; không có lửa, khói thật hay âm nổ lớn. Ngoại lệ có chủ đích: các kết cục hài ở mục 5.4 được phép có cảnh sa bàn "nổ" dạng hoạt hình.
5. **Không thành tựu tiêu cực.** Nghiên cứu thiết kế thành tựu khuyến nghị tránh vì làm người chơi mất cảm giác năng lực và dễ đổ lỗi cho game [4].
6. **Không dùng người thật, logo, ảnh chụp, nhạc có bản quyền.** Nhân vật (Tia, người chơi và các NPC trong khuôn viên) đều hư cấu, không đại diện phát ngôn chính thức của CLB hay trường.
7. **Giữ độ chính xác Toán – Tin tuyệt đối.** Mọi đáp án phải qua kiểm tra chéo (mục 12.2).
8. **Không áp lực thời gian bắt buộc.** Không có đồng hồ đếm ngược trong màn chơi.

### 2.2. Nguyên tắc thiết kế thành tựu và phản hồi

| Nguyên tắc | Nguồn | Áp dụng |
|---|---|---|
| Ưu tiên thành tựu đo lường hơn chỉ hoàn thành, để người chơi nhận phản hồi về mức độ làm tốt | [4] | Hệ thống sao ba tiêu chí (mục 3.3) |
| Thành tựu củng cố cơ chế chính và dạy người chơi điều mới | [5] | Mọi thành tựu gắn với một khái niệm hoặc thao tác |
| Đa dạng loại thành tựu, kể cả ẩn và tăng dần | [5] [6] | Mục 7 |
| Không bắt người chơi gom đồ vô nghĩa | [5] | Không có vật phẩm sưu tầm ngoài "sự thật về 70" (7 mục, mỗi mục là một kiến thức) |

---

## 3. HỆ THỐNG CỐT LÕI

### 3.1. Vòng lặp một màn chơi `[ĐỀ XUẤT]`

```
Đọc đề (một câu) -> Thao tác trên sa bàn (kéo thanh trượt, đặt gương, ghép khối lệnh...)
   -> Bấm "Chạy thử" -> Quan sát hệ quả bằng ánh sáng -> Điều chỉnh -> Đạt mục tiêu
   -> Nhận sao -> Mạch sáng thêm
```

Người chơi có thể chạy thử không giới hạn số lần.

### 3.2. Cấu trúc tiến trình

- **7 mạch** (chương), mỗi mạch có 3–5 màn; tổng 23 màn (mục 4).
- Màn mở theo thứ tự trong từng mạch; các mạch mở tự do sau mạch 1 (không khóa cứng) để người chơi thử mạch mình thích.
- **Đêm Hội tụ** (màn cuối) mở khi hoàn thành các mạch 1, 2 và 3 (bản rút gọn, Must). Mỗi mạch hoàn thành thêm làm màn trình diễn đẹp hơn (mục 4.7).

### 3.3. Hệ thống sao (đo lường, không phạt) `[ĐỀ XUẤT]`

Mỗi màn có tối đa 3 sao, ứng với ba tiêu chí độc lập:

| Sao | Tiêu chí | Ví dụ |
|---|---|---|
| ★ Hoàn thành | Đạt mục tiêu của đề | Pháo hoa dừng ở 70 m |
| ★ Chính xác | Đạt ngưỡng chặt hơn hoặc đáp án tối ưu | Sai số ≤ 0,5 m; chọn đường đi ngắn nhất |
| ★ Gọn | Dùng ít thao tác hơn ngưỡng cho trước | Dùng ít khối lệnh nhất |

- Tổng sao tối đa: 23 màn × 3 = 69 sao. **Sao thứ 70 ("Sao Hội tụ")** được trao khi cả 7 mạch đã sáng, để gắn với con số 70.
- Không có thời gian trong tiêu chí sao. Dùng gợi ý không làm mất sao.
- Sao chỉ để người chơi tự theo dõi tiến bộ; không dùng để xếp hạng.

### 3.4. Gợi ý ba bậc

| Bậc | Nội dung |
|---|---|
| 1 | Nhắc khái niệm liên quan |
| 2 | Chỉ hướng giải |
| 3 | Làm mẫu một bước |

Gợi ý miễn phí, không giới hạn. Thành tựu "Tự lực" là tự nguyện (mục 7).

### 3.5. Phản hồi khi chưa đạt

Mạch chưa ổn: các đèn chuyển xám, hiển thị số liệu và một dòng gợi ý của Tia (ví dụ "Độ cao đang tiến tới giá trị này, mình thử đổi tham số xem"). Không có hình phạt, không mất tiến độ.

---

## 4. NỘI DUNG: BẢY MẠCH ÁNH SÁNG

| Mạch | Tên | Chủ đề | Số màn | Ưu tiên |
|---|---|---|---|---|
| 1 | Hội tụ | Giải tích: giới hạn, chuỗi, liên tục | 4 | Must |
| 2 | Gương | Đại số tuyến tính: ma trận biến đổi | 4 | Must |
| 3 | Dàn drone | Nhập môn lập trình: khối lệnh | 5 | Must |
| 4 | Dây đèn | Đồ thị: đường đi ngắn nhất, cây khung, đường Euler | 3 | Should |
| 5 | Ổ khóa | Số học: đồng dư | 3 | Could |
| 6 | Xếp đèn | Tổ hợp: đếm cách | 3 | Could |
| 7 | Đêm Hội tụ | Tổng hợp | 1 | Must (bản rút gọn) |

### 4.1. Mạch 1. Hội tụ (Giải tích)

| Màn | Đề | Cách chơi | Đáp án và kiểm chứng |
|---|---|---|---|
| 1.1 | Pháo hoa phải dừng ở 70 m | Cho h(t) = a·(1 − e^(−bt)); kéo thanh trượt chọn a, b | Giới hạn khi t → ∞ là a, nên a = 70. ★ Chính xác: sau 3 s cách 70 m không quá 0,5 m, tức 70·e^(−3b) ≤ 0,5 ⇔ b ≥ ln140/3 ≈ 1,647. Bước chỉnh b là 0,05 nên đáp án nhỏ nhất b = 1,65: 70·e^(−4,95) ≈ 0,496 m. b = 1,60 cho ≈ 0,576 m, không đạt |
| 1.2 | Dải đèn bật dần | Đèn thứ n có độ sáng (1/2)ⁿ; chọn số đèn bật | Tổng N đèn là 1 − 2^(−N). ≥ 0,99 khi N = 7 (0,9922); N = 6 chỉ được 0,984 |
| 1.3 | Lấp điểm tối | f(x) = (x² − 49)/(x − 7) có "điểm tối" tại x = 7; chọn giá trị f(7) để đường sáng liền mạch | Với x ≠ 7, f(x) = x + 7, nên giới hạn khi x → 7 bằng 14. Chọn f(7) = 14 |
| 1.4 | Chọn hàm tiệm cận | Chọn tất cả hàm có giới hạn 70 khi x → ∞ trong: A) 70x/(x+1); B) 70(1 − e^(−x)); C) 70x; D) 70·sin x; E) 70 + 1/x | Đúng: A, B, E. C tiến tới vô cực; D không có giới hạn |

### 4.2. Mạch 2. Gương (Đại số tuyến tính)

Người chơi đặt "gương" là các ma trận 2×2 để đưa tia sáng tới mục tiêu. Ma trận cho sẵn:

```
Xoay 90°:           R = [ 0  -1 ]     Đối xứng qua y = x:   S = [ 0  1 ]
                        [ 1   0 ]                                [ 1  0 ]
Đối xứng qua trục x: F = [ 1   0 ]
                        [ 0  -1 ]
```

| Màn | Đề | Đáp án và kiểm chứng |
|---|---|---|
| 2.1 | Đưa tia (1, 0) tới hướng (0, 1) | Dùng R: R·(1,0) = (0,1) |
| 2.2 | Đưa tia (2, 1) tới hướng (1, 2) | Dùng S: S·(2,1) = (1,2) |
| 2.3 | Đặt hai gương theo đúng *thứ tự* để đưa tia (1, 0) tới (0, −1) | R rồi F: R(1,0) = (0,1), F(0,1) = (0,−1). Ma trận gộp F·R = [[0,−1],[−1,0]]. Đảo thứ tự (F rồi R) cho (0,1), sai. Ghi nhận phép nhân ma trận không giao hoán: R·F = [[0,1],[1,0]] khác F·R |
| 2.4 | Tia đang chúc xuống đất, sửa thế nào? | Tia (1,0) xoay 60° phải đi lên (1/2, √3/2); nếu hệ thống lỡ dùng Rᵀ thì đi xuống (1/2, −√3/2). Với ma trận xoay, Rᵀ = R⁻¹ nên áp nhầm Rᵀ là xoay ngược chiều. Kiểm tra det = 1; nhân cả ma trận lên 70 lần làm det = 70² = 4900 (với 2×2), không còn là phép xoay thuần túy |

### 4.3. Mạch 3. Dàn drone (khối lệnh)

Người chơi ghép khối: *di chuyển*, *đặt đèn*, *lặp n lần*, *nếu – ngược lại*, *biến*, *cộng*. Chạy thử hiển thị drone bay theo chương trình.

| Màn | Đề | Đáp án và kiểm chứng |
|---|---|---|
| 3.1 | Xếp 7 đèn thẳng hàng | Lặp 7 lần {đặt đèn; di chuyển 1} |
| 3.2 | Xếp 70 drone thành 7 hàng × 10 cột | Hai vòng lặp lồng nhau: lặp 7 {lặp 10 {đặt; sang phải}; xuống hàng}; 7 × 10 = 70 |
| 3.3 | Tô màu theo chẵn lẻ | Với mỗi i: nếu i mod 2 = 0 thì màu A, ngược lại màu B |
| 3.4 | Cấp năng lượng bằng tổng 1 + 2 + … + 70 | Dùng biến tổng. Kết quả 70·71/2 = **2485** |
| 3.5 | Tìm lỗi "lệch một" | Chương trình lặp từ 1 đến 69 cho tổng 2415 (= 2485 − 70); sửa giới hạn lặp thành 70 |

Ghi chú: mô phỏng ở màn 3.5 chỉ lật cờ cảnh báo, không hiển thị hậu quả phá hủy.

### 4.4. Mạch 4. Dây đèn (Đồ thị) — Should

Đồ thị 5 đỉnh A–E, trọng số cạnh:

```
A–B 4,  A–C 2,  C–B 1,  B–D 5,  C–D 8,  D–E 3,  B–E 7,  C–E 12
```

| Màn | Đề | Đáp án và kiểm chứng |
|---|---|---|
| 4.1 | Đường dây ngắn nhất từ A tới E | A–C–B–E = 2 + 1 + 7 = **10**. Các đường khác: A–B–E 11, A–C–B–D–E 11, A–B–D–E 12, A–C–D–E 13, A–C–E 14 |
| 4.2 | Nối mọi đèn với tổng dây ít nhất | Cây khung nhỏ nhất (Kruskal): C–B 1, A–C 2, D–E 3, B–D 5. Tổng **11** (A–B bị bỏ vì tạo chu trình) |
| 4.3 | Đi qua mỗi dây đúng một lần | Bậc các đỉnh: A 2, B 4, C 4, D 3, E 3; đúng hai đỉnh bậc lẻ là D, E nên có đường Euler đi từ D tới E |

### 4.5. Mạch 5. Ổ khóa (Số học) — Could

Ba ổ khóa ứng với các thừa số của 70 = 2·5·7.

| Màn | Đề | Đáp án |
|---|---|---|
| 5.1 | Tìm n trong 0..69 sao cho n ≡ 1 (mod 2), n ≡ 2 (mod 5), n ≡ 3 (mod 7) | n = **17** (kiểm tra: 17 mod 2 = 1, mod 5 = 2, mod 7 = 3; nghiệm duy nhất modulo 70) |
| 5.2 | Trong 1..70, số nào chia hết cho cả 2, 5 và 7? | Chỉ **70** |
| 5.3 | Lễ hội diễn ra hôm nay, 70 ngày sau là thứ mấy so với hôm nay? | 70 = 10 tuần nên **cùng thứ** |

### 4.6. Mạch 6. Xếp đèn (Tổ hợp) — Could

| Màn | Đề | Đáp án |
|---|---|---|
| 6.1 | Chọn 4 trong 8 đèn để bật, có bao nhiêu cách? | C(8,4) = 8!/(4!·4!) = 40320/576 = **70** |
| 6.2 | Xếp 3 đèn khác màu thành hàng từ 5 màu | 5·4·3 = **60** |
| 6.3 | Số đường ngắn nhất đi trên lưới 4×4 ô vuông từ góc dưới trái tới góc trên phải (chỉ sang phải hoặc lên) | Chọn 4 bước "lên" trong 8 bước: C(8,4) = **70** |

### 4.7. Mạch 7. Đêm Hội tụ (màn cuối)

Một bài tổng hợp ba bước ngắn, mỗi bước lấy một dạng đã học:
1. Chọn hàm cho pháo hoa dừng ở 70 m (dạng mạch 1).
2. Đặt gương để các tia gặp nhau tại một điểm (dạng mạch 2).
3. Ghép khối lệnh để dàn drone xếp thành chữ số "70" (dạng mạch 3).

Sau khi xong, chạy **màn trình diễn**: pháo hoa, tia sáng và drone mà *chính người chơi vừa làm* cùng hội tụ vào chữ "70". Màn trình diễn có nhiều mức đẹp hơn theo số mạch đã sáng, nhưng mọi người chơi đều thấy một màn trình diễn hoàn chỉnh (các kết cục hài ở mục 5.4 là ngoại lệ có chủ đích).

---

## 5. KHÔNG GIAN, TRÌNH DIỄN VÀ PHẦN THƯỞNG

### 5.1. Sa bàn ánh sáng `[ĐÃ SỬA 2.3]` `[XÁC MINH]`

> **Thay đổi ở bản 2.3 (quyết định của nhóm làm game):** bản 2.2 đề xuất sa bàn trừu tượng, không tên tòa nhà, không bản đồ thật. Bản 2.3 thay bằng **bản đồ khối khuôn viên 334–336 Nguyễn Trãi (USSH × HUS) ban đêm, có tên trường và tên tòa nhà**. Lý do giữ nguyên rủi ro cũ: bản đồ là *ước lượng* (bố cục theo sơ đồ chỉ dẫn, kích thước bằng đơn vị game, chưa đo đạc), nên **phải có người của CLB xác nhận** trước khi phát hành (Phụ lục, mục 6).

- Sa bàn là bản đồ khối hai trường USSH và HUS vào ban đêm, góc nhìn từ trên cao, nhãn tên trường và tên tòa nhà (Nhà B, C, D, E, G, H; Nhà T1–T5, Nhà Chuyên đề).
- Mỗi mạch gắn với một tòa nhà; mạch sáng thì tòa nhà đó bừng màu của mạch, có đèn pha lê trên mái và cột sáng lên trời. Mạch 7 (Đêm Hội tụ) là lõi sáng phía trên bãi cỏ HUS; lõi sáng thêm theo mỗi mạch.
- Màn trình diễn (mục 4.7) diễn ra trên bãi cỏ HUS: tia sáng từ các tòa nhà đã sáng hội tụ về lõi, drone xếp chữ "70".
- Không dùng logo trường, ảnh chụp thật hay người thật. Chỉ dùng chữ "HUS", "USSH" và tên tòa nhà dạng nhãn.
- Toàn bộ vị trí, tên và gắn mạch nằm trong `web/public/data/map.json`; sửa tệp này không cần sửa mã. Cờ `mapVerified` để `false` đến khi CLB xác nhận; khi còn `false`, màn hình chính ghi "bản đồ ước lượng, chờ CLB xác nhận".
- Dữ liệu gốc của bản đồ: `legacy/campus/data/campus.layout.json` (ghi rõ nguồn và mức tin cậy từng tòa nhà).

### 5.2. Phần thưởng (chỉ trang trí) `[ĐỀ XUẤT]`

Mẫu pháo hoa, bảng màu ánh sáng, kiểu drone. Không ảnh hưởng độ khó hay tiến trình.

### 5.3. "7 sự thật về số 70" (Sổ tay) `[ĐỀ XUẤT]`

Mỗi sự thật mở khi hoàn thành một mạch và là kiến thức Toán đã được kiểm chứng:

| Mạch | Sự thật | Kiểm chứng và nguồn |
|---|---|---|
| 1 | 70 là giới hạn mà mọi tia pháo hoa trong game hướng tới | Do game đặt ra, không phải dữ kiện bên ngoài |
| 2 | Ma trận xoay có Rᵀ = R⁻¹ và det = 1 | Kiến thức Đại số tuyến tính chuẩn |
| 3 | 1 + 2 + … + 70 = 2485 | 70·71/2 |
| 4 | Đồ thị có đúng hai đỉnh bậc lẻ thì có đường đi qua mỗi cạnh một lần | Định lý Euler về đường Euler |
| 5 | 70 = 2 · 5 · 7, tích ba số nguyên tố phân biệt | Phân tích ra thừa số nguyên tố |
| 6 | C(8,4) = 70 | 8!/(4!·4!) |
| 7 | **70 là số kỳ lạ (weird number) nhỏ nhất**: các ước thực sự 1, 2, 5, 7, 10, 14, 35 có tổng 74 (lớn hơn 70) nhưng không tập con nào cộng lại bằng 70 | [1] [2] [3] |

---

### 5.4. Kết cục `[ĐỀ XUẤT]`

Cuối cốt truyện, game chọn một trong nhiều kết cục. Tất cả diễn ra trên sa bàn mô phỏng, không có người trong cảnh, luôn có nút bỏ qua, chơi lại và "Thử lần quay khác".

| Mã | Kết cục | Tỉ lệ mục tiêu (trên mọi tổ hợp lựa chọn) | Ghi chú |
|---|---|---|---|
| E1 | Pháo hoa mừng 70 năm HUS | 12% | Kết cục chính thức: tia sáng, pháo hoa và drone hội tụ thành chữ 70 |
| E2 | Sa bàn nổ tung (HUS và USSH) | 70% | Kết cục hài: các khối tòa nhà rời nhau, rơi chậm, hoa giấy; có ba biến thể theo nguyên nhân |
| E3 | Cầu ánh sáng Tự nhiên – Nhân văn | 6% | Tia sáng nối hai trường |
| E4 | Drone xếp thành "07" | 4% | Kết cục hài nhẹ |
| E5 | Pháo hoa bay mãi không dừng | 4% | Chơi chữ với giới hạn: hàm không hội tụ về 70 |
| E6 | Số kỳ lạ (bí mật) | 4% | Chỉ mở khi đã thu đủ 7 sự thật về 70; nếu chưa đủ, tỉ lệ này dồn về E1 |

Quy tắc:
- **[ĐÃ SỬA 2.8]** Kết cục do lựa chọn của người chơi quyết định, không quay ngẫu nhiên. Mỗi phương án của tám quyết định có trọng số rủi ro (`config.json → endings.risk`); tổng ≥ `endings.threshold` thì ra E2. Trọng số được chỉnh để khoảng 70% tổ hợp lựa chọn dẫn tới E2; `npm run check:answers` duyệt mọi tổ hợp và báo lỗi nếu lệch `endings.target`.
- Nguyên nhân hiển thị của E2 là sai sót gốc nặng nhất người chơi để lại: nhầm phiên bản, thiếu tệp ghi chú, hai nhóm hiểu khác nhau về bản chốt; nếu cả ba đã sửa thì biến thể "thêm một chùm". Dòng thời gian cuối game nêu từng lựa chọn và lựa chọn nào góp vào sự cố.
- Nút "Chọn lại từ tổng duyệt" thay cho "Thử lần quay khác": giữ mọi lựa chọn trước đó, chọn lại hai quyết định cuối.
- Có "Thư viện kết cục" xem lại các kết cục đã gặp và thành tựu "Gặp đủ kết cục" (không phạt, không thành tựu tiêu cực).
- Cảnh nổ: hoạt hình các khối, rơi chậm, hoa giấy; không lửa, khói thật, người, tiếng nổ lớn hay chớp sáng; tôn trọng "Giảm hiệu ứng ánh sáng" (chuyển sang mờ dần); chú thích rõ đây là sa bàn mô phỏng. Công tắc `endings.boom.enabled` cho phép tắt E2 ở nơi trình diễn cần.
- Cần người có trách nhiệm của CLB đồng ý cảnh nổ có tên HUS và USSH trước khi phát hành (thêm vào Phụ lục).

---

## 6. CHẾ ĐỘ CHƠI

| Chế độ | Mô tả | Ưu tiên |
|---|---|---|
| Hành trình | Chơi đủ 7 mạch, theo tiến độ riêng | Must |
| Khách | Bản 5 phút tại sự kiện: 3 màn chọn lọc (1.2, 2.1, 3.2) rồi chạy màn trình diễn; tự đặt lại sau thời gian không thao tác; không cần đọc hướng dẫn dài | Must nếu có điểm trình diễn |
| Phòng thí nghiệm | Tự do thử từng dạng câu đố (đồ thị hàm, gương, khối lệnh) không có đề bài, để khám phá | Should |
| Dạo chơi | Dành cho người không chuyên Toán – Tin: không công thức, không thuật ngữ, chơi bằng kéo thả và thanh trượt, kết quả hiện ngay bằng hình (mục 6.1) | Should (nên đưa lên Must nếu điểm trình diễn đón nhiều người ngoài ngành) |
| Thử thách hằng ngày | Mỗi ngày một bộ 3 màn sinh từ hạt giống (seed) theo ngày, mọi người cùng ngày có cùng đề; không chuỗi ngày, không phạt khi bỏ lỡ (mục 10.4) | Should |
| Luyện tập vô hạn | Chọn mạch và độ khó, game sinh màn mới từ hạt giống ngẫu nhiên; có thể nhập lại hạt giống để chơi lại đúng màn đó | Should |

Không có bảng xếp hạng công khai.

### 6.1. Chế độ Dạo chơi (cho người không chuyên Toán – Tin) `[ĐỀ XUẤT]`

**Đối tượng.** Sinh viên các ngành khác, cựu sinh viên, khách mời, phụ huynh, học sinh phổ thông. Không giả định biết giới hạn, ma trận, đồ thị hay lập trình.

**Nguyên tắc riêng.**

1. Không hiện công thức, ký hiệu hay thuật ngữ trong đề bài và gợi ý. Thuật ngữ chỉ xuất hiện trong thẻ "Muốn biết tên gọi?" mà người chơi tự mở, sau khi đã giải xong.
2. Người chơi thao tác bằng hình: kéo, thả, trượt, bấm chọn. Không phải gõ số hay viết lệnh.
3. Kết quả của mỗi thao tác hiện ngay trên màn hình (đèn sáng dần, đường đi được tô màu) nên thử và sai đều rẻ.
4. Chỉ dùng mức khó 1–2 của bộ sinh; mỗi màn có đủ ba bậc gợi ý và gợi ý bậc 3 cho thẳng cách làm.
5. Không có sao "Gọn" (đếm khối lệnh) hay yêu cầu tối ưu; chỉ có "Hoàn thành" và "Chính xác".
6. Không so sánh với người khác và không dùng lời gợi ý ngụ ý "dễ" hay "cho người mới" ở trong game, để người chơi không thấy mình bị xếp loại. Tên chế độ là "Dạo chơi", không phải "Cơ bản".

**Cách diễn đạt lại từng dạng câu đố bằng tình huống đời thường.**

| Mô-đun | Dạng trong Dạo chơi | Người chơi làm gì |
|---|---|---|
| `plot-limit` | "Pháo hoa dừng đúng độ cao": kéo hai thanh trượt (độ cao đích, độ nhanh dừng) để quả pháo lên sát vạch rồi chậm lại | Trượt và quan sát |
| `series` | "Rót nước chia đôi": mỗi lần rót một nửa phần còn lại; hỏi sau mấy lần thì gần đầy | Bấm rót, xem mực nước |
| `removable` | "Lấp lỗ trên đường": đồ thị có một điểm thiếu, người chơi chọn giá trị lấp cho mượt | Kéo viên gạch tới lỗ |
| `pick-limit` | "Đường đi tới đâu?": chọn các đường cong thực sự dẫn tới vạch đích | Bấm chọn |
| `beam-order` | "Xếp gương": đặt hai gương theo thứ tự để tia sáng tới đúng ô; thử đổi thứ tự thấy kết quả khác | Kéo thả gương |
| `transpose-bug` | "Tia lệch hướng": tia quay sai chiều, người chơi bấm nút đảo chiều | Bấm một nút |
| `block-vm` | "Dàn đèn theo lệnh": ghép khối lệnh có hình ảnh (lặp, đếm) để xếp hàng đèn; không có khái niệm biến | Kéo khối |
| `graph` | "Nối dây đèn": nối các điểm sáng sao cho ngắn nhất hoặc tốn ít dây nhất | Vẽ đường |
| `modular` | "Chu kỳ đèn nháy": các đèn nháy với chu kỳ khác nhau, tìm lúc cùng sáng | Trượt thời gian |
| `count` | "Xếp ghế": đếm số cách xếp bằng cách xem cây lựa chọn mở dần | Bấm từng nhánh |

Cả mười dạng đều dùng chung bộ sinh, đáp án và phép kiểm chứng ở mục 10.4. Chỉ thay lớp trình bày và mẫu câu, nên không tăng khối lượng kiểm đáp án.

**Nội dung kèm theo.**

- Thẻ "Muốn biết tên gọi?" sau mỗi màn: một câu gọi tên khái niệm (ví dụ "người ta gọi chuyện này là giới hạn") và một mẫu hình khuyến khích đọc thêm, không bắt buộc.
- Sổ tay hiện các mục "sự thật về n" ở dạng một câu đơn giản, không dùng thuật ngữ; mục "70 là số kỳ lạ" kèm hình minh họa các ước.
- Phần thưởng và màn trình diễn "Đêm Hội tụ" dùng chung với Hành trình; người chơi Dạo chơi mở được đêm hội sau 3 mạch tùy chọn.
- Có thể chuyển sang Hành trình bất cứ lúc nào; tiến độ và sao được giữ nguyên với những màn trùng nhau.

**Kiểm soát chất lượng riêng cho Dạo chơi.** Mẫu câu cần qua bộ quét "mức dễ đọc":

| Quy tắc | Ngưỡng |
|---|---|
| Độ dài câu | Tối đa 20 từ |
| Danh sách thuật ngữ cấm trong đề và gợi ý | giới hạn, ma trận, đồ thị, đỉnh, cạnh, hàm, đạo hàm, modulo, tổ hợp, biến, vòng lặp, thuật toán (và dạng không dấu) |
| Chữ số trong một câu | Tối đa 3 số |
| Kiểm tay | Hai người ngoài ngành đọc 10 màn mẫu; họ phải giải thích lại được yêu cầu bằng lời của mình |

Quy tắc đầu và thứ hai do máy quét (cần bổ sung vào `lint()` trong `gen_levels.py` một danh sách riêng cho chế độ này; chưa làm ở bản 2.2 này); quy tắc cuối do người làm ở bước R3.

**Cấu hình.** Thêm `levels_casual/*.json` (mẫu câu và lớp trình bày), `casual_glossary.json` (nội dung thẻ "Muốn biết tên gọi?"), và cờ `casual.enabled` trong `config.json`.

---

## 7. THÀNH TỰU

Loại: **HT** = hoàn thành; **ĐL** = đo lường; **TD** = tăng dần. Tất cả đều mang ý tích cực; không có thành tựu "phạt".

| Mã | Tên | Điều kiện | Loại | Hiển thị |
|---|---|---|---|---|
| A01 | Bật công tắc đầu tiên | Hoàn thành màn 1.1 | HT | Hiện |
| A02 | Chính xác đến nửa mét | Đạt ★ Chính xác ở màn 1.1 | ĐL | Hiện |
| A03 | Lấp điểm tối | Hoàn thành màn 1.3 | HT | Hiện |
| A04 | Mạch Hội tụ sáng | Hoàn thành mạch 1 | HT | Hiện |
| A05 | Gương đúng chiều | Hoàn thành mạch 2 | HT | Hiện |
| A06 | Thứ tự quan trọng | Hoàn thành màn 2.3 và thử cả hai thứ tự trong Phòng thí nghiệm | HT | Ẩn |
| A07 | Dàn drone đủ 70 | Hoàn thành màn 3.2 | HT | Hiện |
| A08 | Gọn như dòng lệnh | Đạt ★ Gọn ở cả 5 màn mạch 3 | TD (n/5) | Hiện |
| A09 | Bắt lỗi lệch một | Hoàn thành màn 3.5 | HT | Hiện |
| A10 | Đường dây ngắn nhất | Hoàn thành màn 4.1 (Should) | HT | Hiện |
| A11 | Đủ bảy mạch | Sáng cả 7 mạch (nhận Sao Hội tụ) | HT | Hiện |
| A12 | Đêm Hội tụ | Xem màn trình diễn lần đầu | HT | Hiện |
| A13 | Ba sao cả mạch | Đạt 3 sao ở mọi màn của một mạch | HT | Hiện |
| A14 | Tự lực | Hoàn thành một mạch không dùng gợi ý | HT | Hiện |
| A15 | Bảy sự thật | Mở đủ 7 mục "sự thật về 70" | TD (n/7) | Hiện |
| A16 | Bảy mươi lần thử | Bấm "Chạy thử" tổng cộng 70 lần | TD (n/70) | Ẩn |
| A17 | Đúng 70 | Đặt được giá trị đúng bằng 70 trong Phòng thí nghiệm | HT | Ẩn |
| A18 | Lan tỏa ánh sáng | Xuất "Thẻ Hội tụ" lần đầu | HT | Hiện |
| A23 | Dạo chơi trọn vẹn | Hoàn thành 5 màn trong chế độ Dạo chơi | TD (n/5) | Hiện |
| A24 | Thử cho biết | Mở một thẻ "Muốn biết tên gọi?" | HT | Hiện |
| A25 | Bước sang hành trình | Chuyển từ Dạo chơi sang Hành trình và hoàn thành một màn | HT | Ẩn |
| A19 | Màn của riêng bạn | Hoàn thành một màn Luyện tập vô hạn | HT | Hiện |
| A20 | Hạt giống đẹp | Nhập lại hạt giống để chơi lại một màn | HT | Ẩn |
| A21 | Mười ngày rực sáng | Hoàn thành Thử thách hằng ngày tổng cộng 10 ngày (không cần liên tiếp) | TD (n/10) | Hiện |
| A22 | Nhà sưu tầm số | Mở 70 mục trong Sổ tay "sự thật về n" | TD (n/70) | Hiện |
| A26 | Gặp đủ kết cục | Gặp cả sáu kết cục của Đêm Hội tụ (bản 2.8) | TD (n/6) | Hiện |
| A27 | Hỏi đủ chuyện | Hỏi 20 chủ đề với các NPC | TD (n/20) | Hiện |
| A28 | Gỡ đúng nguyên nhân | Chỉ ra đúng ba sai sót nhỏ ở bảng đối chiếu | HT | Hiện |
| A29 | Giữ trọn lời ghi | Giữ nguyên lời ghi của người góp ảnh | HT | Hiện |
| A30 | Thắp sáng lối đi | Thắp 7 đèn lối đi | TD (n/7) | Hiện |

Có 30 thành tựu (A23–A25 thuộc chế độ Dạo chơi; A26–A30 thuộc cốt truyện 2.8, đều tích cực, không phạt). A19–A22 mới ở bản 2.1; A21 đếm tổng số ngày, không đếm chuỗi liên tiếp, để không tạo áp lực phải chơi mỗi ngày.

---

## 8. CÀI ĐẶT, CẤU HÌNH VÀ CHIA SẺ

### 8.1. Cài đặt người chơi `[ĐỀ XUẤT]`

| Nhóm | Tùy chọn |
|---|---|
| Âm thanh | Âm lượng nhạc, hiệu ứng, giọng nói riêng |
| Hiển thị | Cỡ chữ; bảng màu thân thiện người khiếm sắc; giảm chuyển động; giảm hiệu ứng ánh sáng; chất lượng đồ họa thấp |
| Chơi | Chế độ hỗ trợ (tăng ngưỡng sai số, nhắc gợi ý chủ động); bật/tắt thông báo thành tựu |
| Dữ liệu | Xóa tiến độ; xuất/nhập tiến độ dưới dạng tệp |

### 8.2. Cấu hình cho người làm game (config) `[ĐỀ XUẤT]`

Toàn bộ nội dung nằm trong các tệp JSON, không cần sửa mã:

| Tệp | Nội dung |
|---|---|
| `config.json` | Chế độ (Hành trình/Khách), thời gian tự đặt lại, bật/tắt mạch, dòng chúc mừng, ngưỡng sai số mặc định |
| `levels/*.json` | Định nghĩa từng màn: loại câu đố, tham số, đáp án/ngưỡng sao, văn bản gợi ý |
| `achievements.json` | Điều kiện và tên thành tựu |
| `facts.json` | 7 sự thật về 70 (viết tay, đã kiểm) |
| `levels_generated.json` | Màn chơi sinh tự động, mỗi màn kèm danh sách phép kiểm chứng độc lập (mục 10.4) |
| `facts_generated.json` | "Sự thật về n" cho n = 1..200, sinh từ công thức và đối chiếu vét cạn |
| `qa_report.json` | Báo cáo kiểm chứng: số màn sinh/loại/trùng, số phép kiểm, vi phạm từ cấm, kết quả đối chiếu đáp án mục 4 |
| `i18n/vi.json` | Mọi chuỗi giao diện |

### 8.3. Chia sẻ `[ĐỀ XUẤT]`

- **Thẻ Hội tụ:** một ảnh tạo ngay trong trình duyệt, gồm tên game, số sao, mạch đã sáng và biệt danh tùy chọn. Xuất ảnh để lưu, hoặc gọi hộp chia sẻ của hệ điều hành nếu có.
- **Không** tải dữ liệu người chơi lên máy chủ; thẻ chỉ lưu ở thiết bị.
- **Mã lời giải** (Could): chuỗi văn bản ngắn mô tả lời giải một màn, để bạn bè so sánh. Mã không chứa thông tin cá nhân.
- Biệt danh do người chơi tự nhập; có lọc từ ngữ không phù hợp ở mức cơ bản và có thể để trống.

---

## 9. GIAO DIỆN VÀ TRỢ NĂNG

### 9.1. Giao diện `[ĐỀ XUẤT]`

| Màn hình | Thành phần |
|---|---|
| Sảnh | Sa bàn với bảy mạch; số sao; nút Chế độ Khách; nút Cài đặt |
| Màn chơi | Đề (một câu), vùng thao tác, nút Chạy thử, nút Gợi ý, nút Về sảnh |
| Kết quả | Ba sao, phản hồi của Tia, nút Thử lại / Màn tiếp |
| Sổ tay | 7 sự thật; các khái niệm đã gặp |
| Thành tựu | Danh sách, tiến độ |

Nguyên tắc: một việc chính mỗi màn hình, nút chữ rõ ràng, thao tác cảm ứng đủ lớn.

### 9.2. Trợ năng

- Phụ đề và cỡ chữ lớn.
- Không dựa riêng vào màu để truyền thông tin (luôn kèm hình dạng hoặc nhãn).
- Hiệu ứng ánh sáng: không nhấp nháy quá ba lần mỗi giây; vùng sáng lớn đổi màu chậm; có tùy chọn giảm hiệu ứng.
- Điều khiển được bằng chuột, bàn phím và chạm.
- Tham chiếu tiêu chuẩn: WCAG 2.2 của W3C (các tiêu chí 1.4.1, 2.2.1, 2.3.1) `[XÁC MINH]` tại w3.org.

---

## 10. KỸ THUẬT

### 10.1. Kiến trúc mô-đun `[ĐỀ XUẤT]` `[XÁC MINH]`

Mỗi dạng câu đố là một mô-đun độc lập với giao diện chung:

```
PuzzleModule {
  id:        "plot-limit" | "matrix-beam" | "block-vm" | "graph" | "modular" | "count"
  render(level, container)   // vẽ và nhận thao tác
  evaluate(level, solution)  // trả { ok, error, stars: [bool, bool, bool], message }
}
```

- Giao diện, lưu tiến độ, thành tựu, cài đặt dùng chung cho mọi mô-đun.
- Công nghệ cụ thể (Canvas 2D hay WebGL cho sa bàn) do nhóm kỹ thuật chọn. Gợi ý: câu đố vẽ bằng Canvas 2D; chỉ sa bàn và màn trình diễn dùng 3D; chạy được ngoại tuyến.
- Lưu tiến độ cục bộ trên thiết bị; không thu thập dữ liệu cá nhân.

### 10.2. Ví dụ dữ liệu màn chơi

```json
{
  "id": "1.1",
  "module": "plot-limit",
  "prompt": "Pháo hoa phải dừng gần 70 m.",
  "model": "h(t) = a*(1 - exp(-b*t))",
  "params": { "a": {"min": 0, "max": 100, "step": 1}, "b": {"min": 0.1, "max": 3, "step": 0.05} },
  "star1": { "limit": 70 },
  "star2": { "at": 3, "maxError": 0.5 },
  "star3": null,
  "hints": ["hint_1_1_a", "hint_1_1_b", "hint_1_1_c"]
}
```

```json
{
  "id": "3.4",
  "module": "block-vm",
  "prompt": "Tính tổng 1 + 2 + ... + 70.",
  "goal": { "variable": "tong", "equals": 2485 },
  "star3": { "maxBlocks": 6 }
}
```

### 10.3. Kiểm thử đáp án (đối chiếu mục 4) `[ĐỀ XUẤT]`

Mỗi `evaluate` có kiểm thử đơn vị với các cặp đầu vào – đầu ra sau:

| Màn | Đầu vào | Kết quả mong đợi |
|---|---|---|
| 1.1 | a = 70, b = 1,65 | ★ Chính xác đạt (sai số ≈ 0,496 m) |
| 1.1 | a = 70, b = 1,60 | ★ Chính xác không đạt (≈ 0,576 m) |
| 1.2 | N = 6 / N = 7 | Không đạt (0,984) / đạt (0,9922) |
| 1.3 | f(7) = 14 | Đạt |
| 1.4 | {A, B, E} | Đạt; thiếu hoặc thừa đều không đạt |
| 2.3 | R rồi F / F rồi R | Đạt / không đạt |
| 3.4 | Chương trình tính tổng 1..70 | tong = 2485 |
| 3.5 | Lặp 1..69 | tong = 2415, báo lỗi lệch một |
| 4.1 | Đường A–C–B–E | Đạt, tổng 10 |
| 4.2 | Cây khung C–B, A–C, D–E, B–D | Đạt, tổng 11 |
| 5.1 | n = 17 | Đạt |
| 6.1 | 70 | Đạt |
| 6.2 | 60 | Đạt |

---

### 10.4. Sinh nội dung tự động có kiểm chứng kép `[ĐỀ XUẤT]` `[XÁC MINH]`

**Mục đích.** Tăng số lượng màn chơi mà không tăng khối lượng duyệt của người. Chỉ dùng cho những dạng có đáp án tính được chính xác bằng máy. Không sinh nội dung diễn giải, lịch sử hay nhận xét về con người.

**Nguyên tắc.**

1. Mỗi đáp án được tính bằng ít nhất hai cách độc lập (công thức và vét cạn/mô phỏng). Hai cách lệch nhau thì màn bị loại, không sửa tay.
2. Văn bản sinh từ mẫu câu cố định, chỉ điền số do máy tính.
3. Mọi văn bản đi qua bộ quét từ cấm và giới hạn độ dài.
4. Hạt giống (seed) xác định: cùng seed cho cùng màn, nên có thể chơi lại, so sánh và kiểm tra lại.
5. Mỗi lần sinh ghi mã băm SHA-256 của kết quả để phát hiện thay đổi ngoài ý muốn.

**Các bộ sinh (10 mô-đun, 5 mức khó).**

| Mô-đun | Mạch | Cách tính thứ nhất | Cách tính thứ hai |
|---|---|---|---|
| `plot-limit` | 1 | Công thức logarit, làm tròn lên bước 0,05 | Quét lưới giá trị b |
| `series` | 1 | Tổng cấp số nhân bằng phân số chính xác | Cộng từng số hạng; công thức logarit cho N |
| `removable` | 1 | Chia đa thức (Horner) | Tính số học giới hạn hai phía |
| `pick-limit` | 1 | Phân loại giới hạn bằng số | Đối chiếu dạng đã biết (vô cực, không tồn tại, hữu hạn) |
| `beam-order` | 2 | Nhân ma trận 2×2 | Thử mọi hoán vị gương, kiểm tra thứ tự có ảnh hưởng |
| `transpose-bug` | 2 | Ma trận quay theo bộ ba Pytago | Kiểm tra Rᵀ = R⁻¹ và định thức |
| `block-vm` | 3 | Trình thông dịch khối lệnh | Công thức đóng; đếm khối cho ★ Gọn; lỗi lệch một |
| `graph` | 4 | Dijkstra, Kruskal, quy tắc bậc lẻ (Euler) | Floyd–Warshall, Prim, quay lui |
| `modular` | 5 | Công thức (CRT, thứ trong tuần, chữ số cuối) | Duyệt toàn bộ |
| `count` | 6 | Công thức tổ hợp | Quy hoạch động và duyệt đường đi |

**"Sự thật về n" (n = 1..200).** Phân tích thừa số, số ước, tổng ước, số dư/thiếu/hoàn hảo, số kỳ lạ (weird). Số ước và tổng ước tính bằng công thức rồi đối chiếu vét cạn. Số kỳ lạ kiểm bằng bài toán tổng tập con; với n < 10000 kết quả phải trùng dãy A006037 (70, 836, 4030, 5830, 7192, 7912, 9272) [3]. Đây là bộ mục cho Sổ tay mở rộng và thành tựu A22.

**Kết quả chạy thật (`gen_levels.py --per-cell 6`, ngày 30/10/2026).**

| Chỉ số | Giá trị |
|---|---|
| Đáp án viết tay trong GDD được máy kiểm lại (`verify_core`) | 30/30 đạt |
| Màn sinh ra (sau loại trùng) | 266 |
| "Sự thật về n" | 200 |
| Phép kiểm độc lập ghi lại | 445 |
| Chuỗi văn bản đã quét từ cấm | 1264, vi phạm 0 |
| Màn bị loại do hai cách tính lệch nhau | 0 |
| Tính xác định | Hai lần chạy cùng tham số cho cùng mã băm |
| SHA-256 `levels_generated.json` | `ae07d794c48bf2c06c2a3aadea6f5fca07068aa634939f43cb934df857c0153f` |

Một số ô (mô-đun × mức khó) ra ít hơn 6 màn do trùng lặp sau khi loại; có thể tăng `--per-cell` để bù.

**Giới hạn cần biết.**

- Văn bản trong tệp sinh ra hiện viết không dấu (chuỗi ASCII) để tránh lỗi mã hóa trong mã nguồn. Trước khi phát hành cần một bước chuyển sang có dấu qua tệp `i18n/vi.json`; việc này là người đọc lại các mẫu câu, không phải từng màn.
- Việc không bị loại cho thấy hai cách tính nhất quán, không chứng minh mẫu câu hay hình thức trình bày dễ hiểu. Phần đó vẫn cần mẫu duyệt ở mục 12.1b và chơi thử R3.
- Mức khó chỉ là ước lượng theo tham số (độ lớn số, số bước); cần chơi thử để hiệu chỉnh.

---

## 11. HÌNH ẢNH, ÂM THANH, NGÔN NGỮ

### 11.1. Hình ảnh
Phong cách đêm tối với đường nét phát sáng, khối hình học đơn giản; màu có độ tương phản cao. Tia là một đốm sáng có biểu cảm đơn giản (hai điểm mắt), không hình người, không giới tính.

### 11.2. Âm thanh
Nhạc điện tử nhẹ do CLB hoặc bạn bè sáng tác, hoặc nhạc có giấy phép sử dụng phù hợp; tiếng chạm nhẹ khi mạch sáng; không âm thanh lớn hay tiếng nổ. Có thể tắt toàn bộ.

### 11.3. Ngôn ngữ
- Tiếng Việt có dấu đầy đủ; câu ngắn, thân thiện, không tiếng lóng xúc phạm.
- Một dòng chúc cố định ở màn hình cuối, ví dụ: "Chúc mừng 70 năm Trường Đại học Khoa học Tự nhiên" `[XÁC MINH]` với CLB và nhà trường về câu chữ chính thức. Mốc 1956 là gốc của "70 năm" theo các nguồn đã tra [7] [8], nhưng game không kể lịch sử.
- Phần ghi công chỉ nêu tên CLB HAMIC và những đơn vị hoặc cá nhân đã đồng ý được nêu tên.

---

## 12. QUY TRÌNH VÀ KIỂM TRA

### 12.1. Ba bước, đều làm được trong HAMIC

| Bước | Nội dung | Người làm |
|---|---|---|
| R1 | Chạy `gen_levels.py`: `verify_core` phải báo toàn bộ PASS và `qa_report.json` phải có 0 vi phạm. Đáp án viết tay trong mục 4 vẫn được một người kiểm tính tay độc lập | Một thành viên chạy, một thành viên đọc báo cáo |
| R2 | Rà soát tính nhạy cảm theo danh sách dưới | Ít nhất hai thành viên không trực tiếp viết nội dung |
| R3 | Chơi thử với người ngoài CLB, gồm ít nhất một bạn không học Toán – Tin | Nhóm kiểm thử |

### 12.1b. Phân công rà soát khi có nội dung sinh tự động `[ĐỀ XUẤT]`

Người không phải duyệt từng màn sinh ra. Việc duyệt dồn vào những thứ ít và cố định:

| Đối tượng duyệt | Số lượng | Lý do đủ |
|---|---|---|
| Mẫu câu (template) của mỗi mô-đun | khoảng 10 mô-đun, vài câu mỗi mô-đun | Mọi màn sinh ra dùng lại đúng các mẫu này; con số điền vào do máy tính và đã đối chiếu hai cách |
| Danh sách từ cấm | 1 tệp | Máy tự quét toàn bộ văn bản sinh ra (cả bản có dấu lẫn không dấu) |
| Mẫu ngẫu nhiên | 20–30 màn | Đọc nhanh để bắt lỗi văn phong mà máy không thấy |
| Báo cáo `qa_report.json` | 1 tệp | Phải có 0 màn bị loại do lệch kết quả giữa hai cách tính, hoặc đã giải thích được lý do |

Nếu một mẫu bị phát hiện lỗi, chỉ sửa mẫu rồi sinh lại; không cần sửa từng màn.

### 12.2. Danh sách kiểm tra tính nhạy cảm

- [ ] Không câu chữ nào chế giễu, so sánh hơn kém hoặc đánh giá người chơi.
- [ ] Không thành tựu hay phản hồi mang tính chê hay phạt.
- [ ] Không lửa, khói thật hay tiếng nổ lớn. Cảnh sa bàn "nổ" ở mục 5.4 đúng điều kiện: hoạt hình khối, rơi chậm, không người, không chớp sáng, có nút bỏ qua.
- [ ] Hiệu ứng ánh sáng không nhấp nháy quá ba lần mỗi giây.
- [ ] Không logo, ảnh người thật.
- [ ] Bản đồ khuôn viên và tên tòa nhà (USSH, HUS) đã được người của CLB đối chiếu và xác nhận; sau đó đặt `mapVerified: true` trong `map.json`. *(Bản 2.3 dùng bản đồ thật, thay cho mục "không bản đồ hay tên địa điểm thật" của bản 2.2.)*
- [ ] Chi tiết lịch sử hoặc đơn vị bạn (nếu có) chính xác, ngắn, trân trọng, và đã được người của CLB xem qua.
- [ ] Nhạc và hình ảnh tự làm hoặc có giấy phép.
- [ ] Dòng chúc 70 năm đã được xác nhận câu chữ.

---

## 13. PHẠM VI VÀ LỘ TRÌNH

| Mức | Hạng mục |
|---|---|
| Must | Mạch 1, 2, 3; màn Đêm Hội tụ rút gọn; hệ thống sao và gợi ý; sa bàn và màn trình diễn; Chế độ Khách; cài đặt và trợ năng; thẻ chia sẻ; kiểm thử đáp án R1 |
| Should | Chế độ Dạo chơi (5 dạng đầu: `plot-limit`, `series`, `beam-order`, `graph`, `count`), thành tựu A23–A25; Mạch 4; Sổ tay; thành tựu A01–A15; Phòng thí nghiệm; Thử thách hằng ngày; Luyện tập vô hạn; Sổ tay "sự thật về n"; thành tựu A19–A22 |
| Could | Mạch 5, 6; thành tựu ẩn; mã lời giải; mở rộng màn trình diễn |
| Won't (giai đoạn này) | Trình soạn màn cho người chơi, nhiều người chơi, bảng xếp hạng, bản tiếng Anh |

| Mốc | Nội dung |
|---|---|
| M0 | Chốt phạm vi và bộ đáp án đã kiểm tra chéo |
| M1 | Khung chung (sảnh, lưu tiến độ, sao, gợi ý) và một mô-đun chơi được (`plot-limit`) |
| M2 | Mạch 1, 2, 3 hoàn chỉnh; Chế độ Khách |
| M3 | Đêm Hội tụ và màn trình diễn; thẻ chia sẻ; cài đặt, trợ năng |
| M4 | Lớp trình bày Dạo chơi và bộ quét mức dễ đọc; Mạch 4, Sổ tay, thành tựu; nhúng bộ sinh màn (mục 10.4), Thử thách hằng ngày, Luyện tập vô hạn; chơi thử R3; sửa lỗi |
| M5 | Chạy thử trên máy trình diễn; phát hành |

Ngày cụ thể do CLB đặt theo lịch sự kiện.

### Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Câu đố khó với người không học Toán | Chế độ Khách chỉ dùng màn dễ; gợi ý ba bậc; chế độ hỗ trợ |
| Sai đáp án | R1: kiểm thử tự động cộng kiểm tra chéo |
| Khối lượng đồ họa 3D | Bản đồ khối đơn giản, nén (≈ 2,2 MB), gộp lưới theo tòa nhà; câu đố 2D |
| Sai tên hoặc vị trí tòa nhà trên bản đồ | CLB đối chiếu trước khi phát hành; sửa trong `map.json`; nhãn "bản đồ ước lượng" khi chưa xác nhận |
| Chạy chậm trên máy trình diễn | Tùy chọn chất lượng thấp; thử sớm trên máy thật |
| Hiểu nhầm là chê hay chọn phe | Mục 2.1; chi tiết lịch sử chỉ ở mức nền và được CLB xem; R2 |

---

## 14. NGUỒN THAM KHẢO

**Toán (số 70)**
1. Wikipedia, "Weird number": 70 là số kỳ lạ nhỏ nhất; các ước thực sự 1, 2, 5, 7, 10, 14, 35 có tổng 74 nhưng không tập con nào có tổng bằng 70. https://en.wikipedia.org/wiki/Weird_number
2. Wolfram MathWorld, "Weird Number": nêu cùng kết quả và dãy A006037. https://mathworld.wolfram.com/WeirdNumber.html
3. OEIS, dãy A006037 (Weird numbers), số hạng đầu là 70. https://oeis.org/A006037

**Thiết kế thành tựu**
4. Lucas Blair, "The Cake Is Not a Lie: How to Design Effective Achievements" (loạt 3 phần), Game Developer: tránh thành tựu tiêu cực; ưu tiên thành tựu đo lường. https://www.gamedeveloper.com/design/the-cake-is-not-a-lie-how-to-design-effective-achievements-part-3
5. Paradox Interactive, "Achievement design guidelines": thành tựu củng cố cơ chế chính, dạy người chơi, đa dạng, không biến thành việc nhàm chán. https://admin-forum.paradoxplaza.com/forum/threads/paradox-achievement-design-guidelines.504499
6. AccelByte, tài liệu dịch vụ Achievements: thành tựu tăng dần, thành tựu ẩn. https://docs.accelbyte.io/gaming-services/modules/online/achievements/

**Bối cảnh 70 năm (chỉ để xác nhận mốc, không dùng làm nội dung game)**
7. Wikipedia, "VNU University of Science": tên cũ giai đoạn 1956–1995 là Trường ĐH Tổng hợp Hà Nội. https://en.wikipedia.org/wiki/VNU_University_of_Science
8. Vietnamnet, phỏng vấn Hiệu trưởng ĐH Khoa học Tự nhiên: ĐH Tổng hợp Hà Nội ra đời năm 1956, là tiền thân của trường. https://vietnamnet.vn/dh-khoa-hoc-tu-nhien-xay-dung-chinh-sach-giu-chan-nhan-tai-726747.html

**Tiêu chuẩn chưa tra lại trong lần này:** W3C WCAG 2.2 (1.4.1, 2.2.1, 2.3.1) `[XÁC MINH]` tại w3.org.

---

## PHỤ LỤC. VIỆC CẦN CLB XÁC NHẬN

1. Tên game ("Hội tụ 70") và dòng chúc 70 năm có dùng đúng như đề xuất không?
2. Hình thức phát hành chính: điểm trình diễn tại sự kiện, web cá nhân, hay cả hai? Cấu hình máy trình diễn và có cảm ứng không?
3. Ngày trình diễn và số người làm kỹ thuật, đồ họa, nội dung để chốt lại các mức Must/Should/Could.
4. Có muốn giữ mạch 5 và 6 (số học, tổ hợp) trong bản đầu không, hay để sau sự kiện?
5. Công nghệ dùng cho sa bàn 3D và câu đố (nhóm kỹ thuật chọn).
6. Bản đồ USSH × HUS (bản 2.3): tên và vị trí các tòa nhà có đúng không? Việc gắn mạch với tòa nhà (`anchors` trong `map.json`: 1 → T1, 2 → Nhà E, 3 → T5, 4 → Nhà C, 5 → T3, 6 → T4, 7 → bãi cỏ HUS) có phù hợp không? Có được phép hiển thị tên trường USSH trong game của CLB không?
7. Bản 2.8: đồng ý cho cảnh kết cục E2 "sa bàn nổ tung" (hoạt hình, có tên HUS và USSH, có chú thích "Đây là sa bàn mô phỏng. Khuôn viên thật vẫn nguyên vẹn.")? Nếu không, đặt `endings.boom.enabled = false`.
8. Bản 2.8: xác nhận hai chi tiết lịch sử nền trong lời thoại: hai trường cùng tên Đại học Tổng hợp Hà Nội giai đoạn 1956–1995; câu nhắc bài lượng – chất trong môn triết học năm nhất.
9. Bản 2.8: xác nhận tên ngắn của các điểm dừng dùng trong lời thoại (`map.json → walk.nodes[].short`) cùng với bản đồ (`mapVerified`).
10. Dòng chúc 70 năm (`config.json → greeting`, đang `greetingVerified: false`).
11. Mức 70% tổ hợp lựa chọn ra E2 có phù hợp không, hay nên tăng `endings.threshold` để giảm?
