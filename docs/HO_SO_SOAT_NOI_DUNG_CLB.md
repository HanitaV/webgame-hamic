# HỒ SƠ SOÁT NỘI DUNG TOÀN TẬP — WEB GAME KỶ NIỆM 70 NĂM (1956–2026)

> **Tài liệu trình Ban Chủ nhiệm & Ban Nội dung Câu lạc bộ Toán Tin (HAMIC) — Trường ĐHKHTN, ĐHQGHN**
> - **Tên hiển thị trong cấu hình hiện tại (`config.json` / `vi.json`):** `Đêm Toán Tin` (Tên truyền thông / trailer đề xuất: `Đêm Toán Tin`)
> - **Phiên bản dữ liệu:** `2.8.0` (bản mở rộng học thuật 2.9.0 — Ngày xuất hồ sơ: 31/10/2026)
> - **Mục đích tài liệu:** Cung cấp **100% văn bản, kịch bản, lời thoại, câu đố, công thức toán học, thông tin lịch sử, mô tả hình ảnh/âm thanh, thành tựu, bảng phấn nội thất và các kỷ vật ẩn** đang có trong mã nguồn trò chơi để CLB rà soát, chỉnh sửa và phê duyệt trước khi công bố tại gian hàng.
> - **Nguồn trích xuất:** Trích xuất trực tiếp và nguyên văn từ `web/public/data/*.json` (`story.json`, `i18n/vi.json`, `map.json`, `levels/circuits.json`, `facts.json`, `achievements.json`, `config.json`, `casual_glossary.json`, `music.json`, `qa_report.json`) và `content/gen_levels.py`.

---

## MỤC LỤC

1. [PHẦN I. THÔNG TIN CHUNG, TUYÊN BỐ GIẢ ĐỊNH & DANH MỤC XIN Ý KIẾN CLB (CHECKLIST R2)](#phần-i-thông-tin-chung-tuyên-bố-giả-định--danh-mục-xin-ý-kiến-clb-checklist-r2)
2. [PHẦN II. KỊCH BẢN CỐT TRUYỆN CHÍNH: "VÌ SAO ĐÈN LỆCH?" (MỞ ĐẦU, 5 CHƯƠNG, 16 ĐIỂM DỪNG, 8 QUYẾT ĐỊNH, 20 TIN NHẮN)](#phần-ii-kịch-bản-cốt-truyện-chính-vì-sao-đèn-lệch)
3. [PHẦN III. HỆ THỐNG 6 KẾT CỤC (E1–E6), BẢNG PHÂN BỐ XÁC SUẤT & KỊCH BẢN CUTSCENE](#phần-iii-hệ-thống-6-kết-cục-e1e6-bảng-phân-bố-xác-suất--kịch-bản-cutscene)
4. [PHẦN IV. HỒ SƠ CHI TIẾT & TOÀN BỘ LỜI THOẠI CỦA 16 NHÂN VẬT (NPC)](#phần-iv-hồ-sơ-chi-tiết--toàn-bộ-lời-thoại-của-16-nhân-vật-npc)
5. [PHẦN V. NỘI DUNG HỌC THUẬT: 7 MẠCH ÁNH SÁNG (23 MÀN), 4 NHIỆM VỤ PHỤ, CHẾ ĐỘ DẠO CHƠI & 266 MÀN TỰ ĐỘNG](#phần-v-nội-dung-học-thuật-7-mạch-ánh-sáng-23-màn-4-nhiệm-vụ-phụ-chế-độ-dạo-chơi--266-màn-tự-động)
6. [PHẦN VI. KHÔNG GIAN KHUÔN VIÊN USSH × HUS, 19 ĐÈN LỐI ĐI, 13 BẢNG PHẤN, 15 KỶ VẬT ẨN & NỘI THẤT](#phần-vi-không-gian-khuôn-viên-ussh--hus-19-đèn-lối-đi-13-bảng-phấn-15-kỷ-vật-ẩn--nội-thất)
7. [PHẦN VII. SỔ TAY "SỰ THẬT VỀ 70", 34 THÀNH TỰU, ÂM NHẠC & CHUỖI GIAO DIỆN HỆ THỐNG](#phần-vii-sổ-tay-sự-thật-về-70-34-thành-tựu-âm-nhạc--chuỗi-giao-diện-hệ-thống)

---

## PHẦN I. THÔNG TIN CHUNG, TUYÊN BỐ GIẢ ĐỊNH & DANH MỤC XIN Ý KIẾN CLB (CHECKLIST R2)

### 1.1. Thông tin định danh & Văn bản hiển thị ngoài màn hình chính

| Hạng mục | Khóa dữ liệu | Nội dung hiển thị nguyên văn trong game |
| :--- | :--- | :--- |
| **Tên trò chơi (cấu hình)** | `config.title` | **Đêm Toán Tin** |
| **Logo hiển thị màn hình chính** | `title.logoLead` + `title.logoAccent` | **Đêm Toán Tin** |
| **Lời dẫn màn hình chính** | `title.lead` | Đi dạo cùng HAMIC và các bạn USSH, chuẩn bị mô hình ánh sáng mừng 70 năm. |
| **Đơn vị thực hiện** | `config.credits` / `hamic.sub` | CLB Toán Tin (HAMIC) (HUS Applied Mathematics & Informatics Club) |
| **Lời chúc chính thức** | `config.greeting` | **Chúc mừng 70 năm Trường Đại học Khoa học Tự nhiên** |
| **Tuyên bố câu chuyện giả định** | `notice.fiction` | mọi chi tiết trong trò chơi là tình huống giả định, không áp dụng hay sử dụng vào bất kì mục đích nào trong thực tế |
| **Thông báo cơ chế lựa chọn** | `notice.choices` | mọi lựa chọn của bạn đều ảnh hưởng tới ending |
| **Cảnh báo bản đồ mô phỏng** | `title.mapDraft` | đây là mô phỏng, không phải thật |
| **Mô tả biểu trưng HAMIC** | `hamic.signsAria` / `hamic.binaryTip` | Dấu hiệu CLB Toán Tin HAMIC: Toán học A+, Nguồn Tin học và Toán ứng dụng $ — Mã nhị phân ASCII vòng ngoài biểu trưng: H · A · M · I · C |

**Các câu khẩu hiệu ngẫu nhiên trên màn hình chính (`config.splashes`):**
1. *"70 = 2·5·7!"*
2. *"C(8, 4) = 70!"*
3. *"1 + 2 + … + 70 = 2485!"*
4. *"70 là số kỳ lạ!"*
5. *"det R = 1!"*
6. *"17 ≡ 3 (mod 7)!"*
7. *"Thử thêm lần nữa!"*
8. *"Ánh sáng hội tụ!"*
9. *"7 × 10 = 70!"*

### 1.2. Phiếu rà soát & xin ý kiến phê duyệt của CLB HAMIC (12 hạng mục)

Ban Chủ nhiệm và Ban Nội dung CLB vui lòng kiểm tra và đánh dấu xác nhận vào các mục dưới đây:

| STT | Hạng mục cần soát | Nội dung hiện tại trong bản dựng | Trạng thái / Ghi chú xin ý kiến CLB |
| :---: | :--- | :--- | :--- |
| **1** | **Tên chính thức của game** | Trong mã nguồn đang để **`Hội tụ 70`** (`app.title`), còn kịch bản truyền thông gọi là **`Đêm Toán Tin`**. | [ ] Giữ `Hội tụ 70` / [ ] Đổi thành `Đêm Toán Tin` |
| **2** | **Câu chúc kỷ niệm 70 năm** | *"Chúc mừng 70 năm truyền thống Đại học Tổng hợp Hà Nội — ĐHKHTN & ĐHKHXH&NV (1956–2026) · CLB Toán Tin HAMIC"* (`greetingVerified: false`) | [ ] Duyệt nguyên văn / [ ] Chỉnh sửa câu chữ |
| **3** | **Thông tin lịch sử 1956–1995–2026** | Nhắc mốc thành lập Trường ĐH Tổng hợp Hà Nội (1956) tại cụm Thượng Đình – Thanh Xuân (334–336 Nguyễn Trãi) và mốc tách thành ĐHKHTN (HUS) & ĐHKHXH&NV (USSH) năm 1995. | [ ] Xác nhận thông tin lịch sử chính xác |
| **4** | **Bản đồ 3D & Tên 13 tòa nhà** | Đang gắn nhãn `mapVerified: false` (*"Bản đồ ước lượng — chờ CLB xác nhận vị trí"*). Gồm HUS (`T1`–`T5`, `Nhà Chuyên đề`, `Nhà ăn`) và USSH (`Nhà B, C, D, E, G, H`). | [ ] Duyệt tên gọi & vị trí tương đối các tòa nhà |
| **5** | **Chữ HUS / HAMIC trên mô hình** | Trên nóc tòa `T5` có bảng chữ `HUS` phát sáng; áo nhân vật có chữ `HUS` / `HAMIC` cách điệu (không dùng quốc huy hay logo đồ họa chính thức của trường). | [ ] Cho phép giữ bảng chữ `HUS` & áo `HAMIC` |
| **6** | **Kịch bản & 16 Nhân vật hư cấu** | Tất cả 16 nhân vật (Minh, Lan, Tùng, Cô Hạnh, An, Hà, Linh, Nam, Vy, Đức, Bảo, Khang, Thảo, Kiên, Quỳnh, Long) đều là nhân vật hư cấu phục vụ cốt truyện lắp đèn sa bàn. | [ ] Xác nhận không trùng/ám chỉ cá nhân nhạy cảm |
| **7** | **Kết cục hài E2 ("Nổ mô hình sa bàn") & Tỉ lệ 95,03%** | Khi tổng điểm rủi ro `risk >= 18` (chiếm **95,03%** tức 2.771/2.916 tổ hợp chọn), các khối nhà **trên bàn sa bàn** nảy chậm trong 3 giây kèm pháo giấy, có hộp thoại giải thích lỗi kỹ thuật và dòng chữ cố định: *"Chỉ mô hình trên bàn nhảy thôi — khuôn viên thật vẫn nguyên vẹn."* | [ ] Duyệt hiệu ứng hài E2 và tỉ lệ xuất hiện |
| **8** | **15 Kỷ vật ẩn (Easter Eggs) nhắc trường bạn** | Có nhắc vui tới *Giáo trình Giải tích I Bách Khoa (HUST)*, *Bộ Toán cao cấp ĐHQGHN*, *Cục đá UET lưu lạc Thanh Xuân*, *Máy tính Casio fx-580VN X*, *Giáo sư Mèo Vàng T5*, *Vịt cao su gỡ lỗi T5*, *Trà đá 3.000đ căng tin*... với tinh thần giao lưu học thuật thân thiện. | [ ] Duyệt toàn bộ 15 kỷ vật ẩn |
| **9** | **13 Bảng phấn & Biển giới thiệu tòa nhà** | Mỗi sảnh tòa nhà có một bảng phấn ghi công thức đặc trưng (Giải tích, ĐSTT, XSTK, Quang học, Máy chủ, Ngôn ngữ học, Triết học – Logic, Xã hội học, Lịch sử 1956...) kèm lời nhắn của HAMIC. | [ ] Duyệt nội dung 13 bảng phấn |
| **10** | **Nội dung Toán – Tin (23 màn chính + 4 nhiệm vụ phụ + 266 màn tự động)** | Tất cả đáp án đều được kiểm chứng tự động (`npm run check:answers`, `qa_report.json`: 30/30 `verify_core`, 445 phép kiểm độc lập, 0 lỗi). | [ ] Ban Chuyên môn xác nhận nội dung toán học |
| **11** | **Chế độ Dạo chơi (Casual) cho khách ngoài ngành** | Tắt toàn bộ ký hiệu/thuật ngữ chuyên ngành (`mod`, `GCD`, `LCM`, `ma trận`, `cấp số`...), mỗi câu ≤ 20 từ và ≤ 3 con số. | [ ] Duyệt văn phong chế độ Dạo chơi |
| **12** | **Âm nhạc & Bản quyền tài sản** | 5 bản nhạc nền đều thuộc phạm vi công cộng `CC0-1.0` (OpenGameArt); hiệu ứng âm thanh tổng hợp bằng WebAudio; hình ảnh 3D dựng thủ tục. | [ ] Xác nhận hồ sơ bản quyền (`CREDITS.md`) |

---

## PHẦN II. KỊCH BẢN CỐT TRUYỆN CHÍNH: "VÌ SAO ĐÈN LỆCH?"

### 2.1. Tổng quan cốt truyện, 3 Chế độ độ khó & 2 Nhánh phong cách làm việc

- **Tên cốt truyện (`story.title`):** **Vì sao đèn lệch?**
- **Lời dẫn tổng quan (`story.intro`):** Bạn mới vào HAMIC được vài hôm. Tối nay chạy thử mô hình khuôn viên mừng 70 năm, nhưng bản chạy thử chiều nay lệch một đoạn. Chị Chủ nhiệm nhờ bạn đi một vòng hai trường tìm nguyên nhân.

#### Ba mức độ khó khi bắt đầu (`story.difficulties`):

| Mã | Tên chế độ | Mô tả chi tiết | Cấp độ bài sinh tự động | Tối đa chế độ Dạo chơi | Luyện tập | Hỗ trợ tự động (`assist`) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `easy` | **Cốt truyện** | Ưu tiên tình huống, gợi ý rõ; câu đố phụ mức 1–2. | `[1, 2]` | `1` | `1` | Có |
| `normal` | **Cân bằng** | Câu chuyện và thử nghiệm ngắn; câu đố phụ mức 2–3. | `[2, 3]` | `2` | `3` | Không |
| `hard` | **Thử thách** | Tự suy luận cấu hình, thêm phương án; câu đố phụ mức 4–5. | `[4, 5]` | `2` | `5` | Không |

### 2.2. Toàn văn Mở đầu (Prologue) & Lựa chọn Phong cách làm việc (`bondChoice`)

**Lời thoại mở đầu (`story.prologue`):**
- **Kể:** "Chiều muộn ở khuôn viên Cổng HUS nối thông sang Nhân văn. Chỉ còn vài tiếng nữa là tới Đêm Hội tụ kỷ niệm 70 năm, vậy mà trên mô hình tổng duyệt các chùm đèn vẫn lệch nhau mỗi nơi một kiểu."
- **Chị Chủ nhiệm HAMIC:** "Cậu tới đúng lúc lắm. Tớ vừa chạy thử bản dựng chung thì thấy pháo sáng, gương phản xạ và cả dàn drone đều lệch nhẹ so với bản thiết kế gốc."
- **Chị Chủ nhiệm HAMIC:** "Không có lỗi nào quá nghiêm trọng đâu, chủ yếu là mấy tệp cấu hình và ghi chú truyền tay nhau qua nhiều ca trực nên bị vênh thông số. Cậu chịu khó đi một vòng quanh hai trường, gặp từng bạn phụ trách để rà lại nhé."
- **Kể:** "Bạn nhận cuốn sổ tay từ chị Lan. Từ cổng Tự nhiên tới các dãy nhà bên Nhân văn, cả khuôn viên rộng lớn đang mở ra chờ bạn khám phá."

**Câu hỏi chọn phong cách làm việc (`story.bondChoice.prompt`):** *Trước khi bắt đầu chuyến rà soát quanh hai trường, bạn muốn ưu tiên cách làm việc nào?*
- **Nhánh `listen`:** "Trò chuyện kỹ với từng người để hiểu ngọn ngành câu chuyện phía sau mỗi cụm đèn"
  - *Phản hồi của Chị Chủ nhiệm HAMIC:* "Cách đó hay đấy. Nhiều khi thông số lệch là do mọi người ngại sửa ghi chú kỷ niệm của nhau, cậu cứ lắng nghe kỹ là sẽ gỡ được hết."
- **Nhánh `build`:** "Đối chiếu thẳng vào số liệu, nhật ký tệp và công thức kỹ thuật ở từng trạm"
  - *Phản hồi của Chị Chủ nhiệm HAMIC:* "Chuẩn phong cách kỹ thuật luôn. Cậu cứ cầm sổ đối chiếu từng con số tại hiện trường, chỗ nào lệch công thức là nhìn ra ngay."

### 2.3. Tổng quan 5 Chương (`story.chapters`)

| Thứ tự | Mã chương | Tên chương | Mốc thời gian (`time`) | Thông điệp chuyển chương (`travel`) |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `ch0` | **Mở đầu · Hai chiếc USB** | Mốc `0` | Minh đang đợi ở Cổng HUS. |
| 2 | `ch1` | **Chương I · Ánh sáng còn thiếu** | Mốc `1` | Ban Học tập và Hà đang chỉnh đèn ở Sân cỏ Nhà T. |
| 3 | `ch2a` | **Chương II · Qua Lối qua Căng tin** | Mốc `3` | Đi qua lối Lối qua Căng tin tìm tệp ghi chú. |
| 4 | `ch2b` | **Chương II · Bên USSH** | Mốc `4` | Các bạn USSH giữ bộ ảnh và lịch sân khấu. |
| 5 | `ch3` | **Chương III · Cùng bật sáng** | Mốc `5` | Về Nhà T3 · trạm máy chủ tổng duyệt và chốt nguyên nhân. |

### 2.4. Toàn văn 16 Điểm dừng Cốt truyện (`s0` đến `s14`, bao gồm `s11b`)

#### Điểm dừng 1/16 — `s0`: Hai bản cùng tên

- **Chương:** `ch0` — **Mở đầu · Hai chiếc USB**
- **NPC phụ trách:** **Minh · nhóm đón khách** (`minh`)
- **Mục tiêu (`objective`):** Nghe Minh kể về hai chiếc USB
- **Bằng chứng thu được:** `versions` (**Hai bản cùng tên**)
- **Vật phẩm nhận được:** `card` (**Thẻ thành viên HAMIC**)
- **Quyết định ngay tại điểm dừng:** `version` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Minh · nhóm đón khách:** "Cậu là bạn mới hả? Cứu tớ với. Hai người gửi hai USB, tệp nào cũng tên mo-hinh-final."
- **Bạn · thành viên mới HAMIC:** "Chị bảo bản đã duyệt có mã băm bắt đầu bằng 3f70."
- **Minh · nhóm đón khách:** "Thế thì dễ rồi. Mà khoan, bản thứ hai sửa lúc 16 giờ 40, muộn hơn. Cậu so giúp tớ hai bản khác nhau chỗ nào nhé."

**2) Cảnh nhánh theo Phong cách làm việc (`bondScenes.s0`):**
- **Nhánh `listen` (Lắng nghe chuyện cũ)** *(Điểm tin cậy: `{"minh": 1}`)*:
  - **Minh · nhóm đón khách:** "Tớ kể cậu nghe: hôm đầu vào nhóm tớ cũng cầm nhầm USB của chị. Chị chỉ bảo, lần sau nhìn mã băm."
  - **Bạn · thành viên mới HAMIC:** "Mã băm là gì vậy?"
  - **Minh · nhóm đón khách:** "Là dấu vân tay của tệp. Đổi một chữ là đổi hết."
- **Nhánh `build` (Bắt tay dựng thử)** *(Mở thêm bằng chứng: `hashTip` (**Giờ sửa và mã băm**))*:
  - **Bạn · thành viên mới HAMIC:** "Cho mình xem thông tin tệp trước đã."
  - **Minh · nhóm đón khách:** "Đây, có giờ sửa và mã băm. Cậu tính so cả hai à?"
  - **Bạn · thành viên mới HAMIC:** "Ừ. Giờ sửa có thể đổi khi chép tệp, mã băm thì không."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = versions` — So hai bản cùng tên):**
- **Đề bài chính (`prompt`):** Bấm vào những dòng của Bản 2 khác với Bản 1. Xong thì bấm Kiểm tra.
- **Đề bài rút gọn cho chế độ Kể chuyện (`promptEasy`):** *Bấm vào những dòng ở cột phải khác cột trái. Có đúng ba chỗ khác.*
- **Hai tệp cấu hình cần đối chiếu (`files`):**
  - **Tệp #1: `Bản 1 · mo-hinh-final`** — *Sửa lúc 15:02 · mã băm 3f70a1*:
    - `tieu_de = Dem Toan Tin`
    - `phao_hoa.a = 70`
    - `phao_hoa.b = 1,65`
    - `guong.thu_tu = R, F`
    - `den.so_luong = 7`
    - `ghi_chu = _ghichu/`
    - `lich = ban-4`
  - **Tệp #2: `Bản 2 · mo-hinh-final`** — *Sửa lúc 16:40 · mã băm 9c21e4*:
    - `tieu_de = Dem Toan Tin`
    - `phao_hoa.a = 70`
    - `phao_hoa.b = 1,20`
    - `guong.thu_tu = F, R`
    - `den.so_luong = 6`
    - `ghi_chu = _ghichu/`
    - `lich = ban-4`
- **Ba bậc gợi ý chuẩn (`hints`):**
  - *Gợi ý 1:* Đọc từng cặp dòng cùng hàng, bắt đầu từ trên xuống.
  - *Gợi ý 2:* Chú ý các con số và thứ tự chữ cái sau dấu bằng.
  - *Gợi ý 3:* Ba dòng khác nhau là phao_hoa.b, guong.thu_tu và den.so_luong.
- **Ba bậc gợi ý chế độ Kể chuyện (`hintsEasy`):**
  - *Gợi ý dễ 1:* So từng hàng ngang một.
  - *Gợi ý dễ 2:* Nhìn kỹ các con số.
  - *Gợi ý dễ 3:* Chỗ khác nằm ở hàng ba, bốn và năm.
- **Thông báo khi giải xong (`success`):** "Đúng ba chỗ khác. Bản 2 có độ dừng pháo nhỏ hơn, gương đảo thứ tự và thiếu một đèn."

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Minh · nhóm đón khách:** "Ơ, bản 2 giống bản đèn cũ của Hà hôm trước. Cậu cứ lên Sân cỏ Nhà T hỏi Hà với Ban Học tập nhé."

---

#### Điểm dừng 2/16 — `s1`: Căn dải sáng

- **Chương:** `ch1` — **Chương I · Ánh sáng còn thiếu**
- **NPC phụ trách:** **Thành viên Ban Học tập** (`math`)
- **Mục tiêu (`objective`):** Gặp Ban Học tập ở Sân cỏ Nhà T
- **Bằng chứng thu được:** `height` (**Pháo hoa dừng thấp**)
- **Quyết định ngay tại điểm dừng:** `firework` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Thành viên Ban Học tập:** "Cậu là bạn mới chị nhắc đúng không? Dải pháo hoa chiều nay dừng thấp, cả sân nhìn thấy hụt."
- **Bạn · thành viên mới HAMIC:** "Bản 2 ở cổng có phao_hoa.b nhỏ hơn bản đã duyệt."
- **Thành viên Ban Học tập:** "Thế thì khớp. b nhỏ thì pháo lên chậm, ba giây chưa tới đích. Mình chỉnh lại trên mô phỏng nhé."

**2) Cảnh nhánh theo Phong cách làm việc (`bondScenes.s1`):**
- **Nhánh `listen` (Lắng nghe chuyện cũ)** *(Điểm tin cậy: `{"math": 1}`)*:
  - **Thành viên Ban Học tập:** "Hồi mới vào, tớ ngồi cả buổi mà pháo vẫn hụt. Chị bảo: nhìn đồ thị, đừng nhìn số."
  - **Bạn · thành viên mới HAMIC:** "Nhìn đồ thị thì thấy gì?"
  - **Thành viên Ban Học tập:** "Thấy nó tiến sát vạch đến đâu. Cậu thử là biết."
- **Nhánh `build` (Bắt tay dựng thử)** *(Mở thêm bằng chứng: `bTable` (**Bảng b thử nghiệm**))*:
  - **Bạn · thành viên mới HAMIC:** "h(t) = a(1 − e^(−bt)). a quyết định đích, b quyết định nhanh chậm đúng không?"
  - **Thành viên Ban Học tập:** "Chuẩn. Đích lấy a, tốc độ lấy b. Cậu đọc đề kỹ ghê."
  - **Thành viên Ban Học tập:** "Tớ đưa cậu bảng b thử nghiệm của tớ, đỡ dò."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = level` — Căn dải sáng):**
- **Ghi chú dẫn nhập (`note`):** Pháo hoa trên mô hình phải dừng sát vạch và lên đủ nhanh. Chỉnh hai tham số rồi chạy thử.
- **Màn chơi Mạch ánh sáng được gọi theo độ khó (`levels`):** Dễ: `plot-limit-d1-s1003` | Chuẩn: `1.1` | Thử thách: `plot-limit-d5-s5001` (Xem chi tiết đề bài & đáp án tại Phần V).

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Thành viên Ban Học tập:** "Ghi lại nhé: dải sáng chiều nay lệch vì b sai, không phải máy hỏng. Hà đang kiểm dải đèn bên kia."

---

#### Điểm dừng 3/16 — `s2`: Dải đèn bật dần

- **Chương:** `ch1` — **Chương I · Ánh sáng còn thiếu**
- **NPC phụ trách:** **Hà · nhóm kỹ thuật** (`ha`)
- **Mục tiêu (`objective`):** Hà đang kiểm dải đèn ở Sân cỏ Nhà T
- **Bằng chứng thu được:** `oldLamp` (**Sáu đèn chưa đủ**)
- **Quyết định ngay tại điểm dừng:** `ha` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Hà · nhóm kỹ thuật:** "Cậu hỏi bản đèn cũ à? Mình... đúng là mình lưu lại bản cũ hôm trước, quên đổi tên."
- **Hà · nhóm kỹ thuật:** "Bản cũ chỉ bật sáu đèn. Mình tưởng thế là đủ sáng rồi."
- **Bạn · thành viên mới HAMIC:** "Mình đếm thử cùng Hà nhé. Cần bao nhiêu đèn mới đạt ngưỡng?"

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = level` — Dải đèn bật dần):**
- **Ghi chú dẫn nhập (`note`):** Mỗi đèn sáng bằng nửa đèn trước. Tìm số đèn ít nhất để dải sáng đạt ngưỡng.
- **Màn chơi Mạch ánh sáng được gọi theo độ khó (`levels`):** Dễ: `series-d1-s101004` | Chuẩn: `1.2` | Thử thách: `series-d4-s104000` (Xem chi tiết đề bài & đáp án tại Phần V).

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Hà · nhóm kỹ thuật:** "Cảm ơn cậu. Còn hướng chiếu thì Ban Học tập rành hơn mình."

---

#### Điểm dừng 4/16 — `s3`: Chỉnh hướng chiếu

- **Chương:** `ch1` — **Chương I · Ánh sáng còn thiếu**
- **NPC phụ trách:** **Thành viên Ban Học tập** (`math`)
- **Mục tiêu (`objective`):** Quay lại Ban Học tập để kiểm hướng chiếu
- **Bằng chứng thu được:** `order` (**Thứ tự gương**)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Thành viên Ban Học tập:** "Ở cụm gương Sân cỏ Nhà T này, mỗi tấm gương thực chất là một phép biến đổi tuyến tính $x \mapsto Ax$ trong mặt phẳng $\mathbb{R}^2$. Có bạn vừa đảo thứ tự hai tấm gương vì nghĩ đặt tấm nào trước cũng ra cùng một tia."
- **Bạn · thành viên mới HAMIC:** "Trong Đại số tuyến tính, phép nhân hai ma trận biến đổi đâu có tính chất giao hoán $AB = BA$ đâu nhỉ?"
- **Thành viên Ban Học tập:** "Đúng rồi! Quay trước rồi lấy đối xứng cho ra ma trận tích hoàn toàn khác với lấy đối xứng trước rồi mới quay. Cậu xếp lại thứ tự các phép biến đổi trên giá gương giúp tớ nhé."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = level` — Chỉnh hướng chiếu):**
- **Ghi chú dẫn nhập (`note`):** Đặt hai gương theo đúng thứ tự để tia sáng ra đúng hướng. Thử cả thứ tự ngược lại xem.
- **Màn chơi Mạch ánh sáng được gọi theo độ khó (`levels`):** Dễ: `beam-order-d1-s401003` | Chuẩn: `2.3` | Thử thách: `beam-order-d4-s404001` (Xem chi tiết đề bài & đáp án tại Phần V).

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Thành viên Ban Học tập:** "Tia sáng bắn trúng tâm thu rồi. À, nếu tiện đường đi qua Nhà T4, HUS, cậu ghé gặp Quỳnh nhé, bạn ấy đang giữ bảng ma trận quay trực giao và định thức của dàn chiếu đấy."

---

#### Điểm dừng 5/16 — `s4`: Báo cáo ở Nhà T3 · trạm máy chủ

- **Chương:** `ch1` — **Chương I · Ánh sáng còn thiếu**
- **NPC phụ trách:** **Chị Chủ nhiệm HAMIC** (`chief`)
- **Mục tiêu (`objective`):** Về Nhà T3 · trạm máy chủ báo chị Chủ nhiệm
- **Vật phẩm nhận được:** `synclist` (**Danh sách đồng bộ**)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Chị Chủ nhiệm HAMIC:** "Em về rồi. Bản 2 là bản đèn cũ được lưu lại à? Ừ, chuyện đó hay xảy ra lắm."
- **Chị Chủ nhiệm HAMIC:** "Nhưng chị vẫn thấy lạ: chữ chúc mừng không hiện lời ghi. Lời ghi nằm trong thư mục _ghichu."
- **Chị Chủ nhiệm HAMIC:** "Danh sách tệp cần đồng bộ đây. Tệp ghi chú gốc Nam cất trong tủ ở Lối qua Căng tin. Em qua lấy giúp chị."

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Chị Chủ nhiệm HAMIC:** "Tủ có khóa số. Nam nhớ cách mở hơi lằng nhằng, em chịu khó nhé."

---

#### Điểm dừng 6/16 — `s5`: Mở tủ tư liệu

- **Chương:** `ch2a` — **Chương II · Qua Lối qua Căng tin**
- **NPC phụ trách:** **Nam · người chuyển tư liệu** (`nam`)
- **Mục tiêu (`objective`):** Tìm Nam ở lối Lối qua Căng tin
- **Bằng chứng thu được:** `notesFile` (**Tệp ghi chú gốc**)
- **Vật phẩm nhận được:** `notes` (**Thư mục _ghichu**)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Nam · người chuyển tư liệu:** "Tủ à? Mã là số ngày ghi trên ảnh đầu tiên, mà tôi quên mất ngày rồi."
- **Nam · người chuyển tư liệu:** "Tôi chỉ nhớ ba ổ khóa: chia 2 dư 1, chia 5 dư 2, chia 7 dư 3. Số đó nhỏ hơn 70."
- **Bạn · thành viên mới HAMIC:** "Ba điều kiện cùng lúc thì chỉ có một số thôi. Để mình tìm."

**2) Cảnh nhánh theo Phong cách làm việc (`bondScenes.s5`):**
- **Nhánh `listen` (Lắng nghe chuyện cũ)** *(Điểm tin cậy: `{"nam": 1}`)*:
  - **Nam · người chuyển tư liệu:** "Tủ này có từ hồi tôi chưa vào. Mấy khóa trước để lại cả hộp bút với bản vẽ cũ."
  - **Bạn · thành viên mới HAMIC:** "Bản vẽ cũ của gì vậy?"
  - **Nam · người chuyển tư liệu:** "Mô hình năm nào đó. Ông mở được tủ thì xem luôn."
- **Nhánh `build` (Bắt tay dựng thử)** *(Mở thêm bằng chứng: `crtTip` (**Ba ổ khóa**))*:
  - **Bạn · thành viên mới HAMIC:** "Ba ổ khóa chia 2, 5, 7. Nhân lại là 70, nên chỉ có một số nhỏ hơn 70 thỏa cả ba."
  - **Nam · người chuyển tư liệu:** "Ông nói gì tôi không hiểu lắm, nhưng nghe chắc chắn đấy."
  - **Bạn · thành viên mới HAMIC:** "Chỉ cần thử các số lẻ chia 5 dư 2 thôi."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = level` — Ba ổ khóa):**
- **Ghi chú dẫn nhập (`note`):** Mã tủ thỏa ba ổ khóa cùng lúc. Tìm số đó.
- **Màn chơi Mạch ánh sáng được gọi theo độ khó (`levels`):** Dễ: `5.1` | Chuẩn: `5.1` | Thử thách: `modular-d4-s804000` (Xem chi tiết đề bài & đáp án tại Phần V).

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Nam · người chuyển tư liệu:** "Mở rồi! Thư mục _ghichu đây. Ơ, sao bản đồng bộ trên Nhà T3 · trạm máy chủ lại không có nó nhỉ?"
- **Nam · người chuyển tư liệu:** "Vy ở Lối sang USSH quản danh sách đồng bộ. Ông hỏi Vy xem."

---

#### Điểm dừng 7/16 — `s6`: Bắt lỗi đồng bộ

- **Chương:** `ch2a` — **Chương II · Qua Lối qua Căng tin**
- **NPC phụ trách:** **Vy · nhóm kiểm tra** (`vy`)
- **Mục tiêu (`objective`):** Vy giữ danh sách đồng bộ ở Lối sang USSH
- **Bằng chứng thu được:** `sync` (**Mẫu đồng bộ**)
- **Quyết định ngay tại điểm dừng:** `notes` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Vy · nhóm kiểm tra:** "Danh sách đồng bộ lấy từ mẫu chung của nhóm. Mình chưa sửa gì cả."
- **Bạn · thành viên mới HAMIC:** "Thư mục _ghichu không lên được Nhà T3 · trạm máy chủ."
- **Vy · nhóm kiểm tra:** "Vậy chạy thử đi. Bật tắt từng thư mục, xem tệp nào tới, tệp nào thiếu."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = sync` — Bắt lỗi đồng bộ):**
- **Đề bài chính (`prompt`):** Bật đủ thư mục cần cho buổi diễn, tắt thư mục không cần, rồi bấm Chạy thử.
- **Đề bài rút gọn cho chế độ Kể chuyện (`promptEasy`):** *Bật thư mục cần cho buổi diễn. Tắt thư mục thừa. Rồi bấm Chạy thử.*
- **Quy tắc chọn thư mục (`rule`):** Mẫu chung bỏ qua mọi thư mục có tên bắt đầu bằng dấu gạch dưới.
- **Trạng thái chọn ban đầu (`start`):** `['anh', 'amthanh', 'cauhinh', 'video']`
- **Danh sách 6 thư mục (`folders`):**
  - `anh` — **anh/** (Ảnh trình chiếu) → **CẦN GIỮ (`need`)**
  - `amthanh` — **am-thanh/** (Nhạc và tiếng chạm) → **CẦN GIỮ (`need`)**
  - `cauhinh` — **cau-hinh/** (Thông số đèn và pháo) → **CẦN GIỮ (`need`)**
  - `ghichu` — **_ghichu/** (Lời ghi cho từng ảnh) → **CẦN GIỮ (`need`)**
  - `tam` — **_tam/** (Tệp tạm khi biên tập) → Tệp rác/tạm (`junk` — cần bỏ chọn)
  - `video` — **video-thu/** (Video thử, rất nặng) → Tệp rác/tạm (`junk` — cần bỏ chọn)
- **Ba bậc gợi ý chuẩn (`hints`):**
  - *Gợi ý 1:* Đọc mô tả từng thư mục: buổi diễn cần gì?
  - *Gợi ý 2:* Lời ghi cho ảnh nằm trong một thư mục đang tắt.
  - *Gợi ý 3:* Bật _ghichu, tắt video-thu, để _tam tắt.
- **Ba bậc gợi ý chế độ Kể chuyện (`hintsEasy`):**
  - *Gợi ý dễ 1:* Đọc dòng mô tả của từng thư mục.
  - *Gợi ý dễ 2:* Lời ghi của ảnh đang bị tắt.
  - *Gợi ý dễ 3:* Bật _ghichu và tắt video-thu.
- **Thông báo khi giải xong (`success`):** "Đủ bốn thư mục cần, không mang theo tệp thừa. Vậy là mẫu chung bỏ sót _ghichu."

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Vy · nhóm kiểm tra:** "Còn chuyện chuyển tệp sang Nhà E · điểm dữ liệu. Đi đường nào nhanh nhất, cậu xem cùng mình."

---

#### Điểm dừng 8/16 — `s7`: Đường chuyển tư liệu

- **Chương:** `ch2a` — **Chương II · Qua Lối qua Căng tin**
- **NPC phụ trách:** **Vy · nhóm kiểm tra** (`vy`)
- **Mục tiêu (`objective`):** Cùng Vy chọn đường chuyển tệp
- **Bằng chứng thu được:** `route` (**Đường chuyển tệp**)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Vy · nhóm kiểm tra:** "Tệp phải tới tay người trực sân khấu ở Nhà C / Sân khấu. Mình đã đo thời gian đi bộ từng đoạn."
- **Vy · nhóm kiểm tra:** "Có đoạn ngắn nhưng phải vòng qua cổng phụ. Đừng chọn theo cảm giác nhé."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = mapgraph` — Đường chuyển tư liệu):**
- **Ghi chú dẫn nhập (`note`):** Vy đã đo số phút đi bộ ước lượng của từng đoạn; sơ đồ vẽ giản lược, không theo tỉ lệ.
- **Đề bài chính (`prompt`):** Chọn các đoạn tạo thành đường nhanh nhất từ Nhà T3 · trạm máy chủ tới Nhà C / Sân khấu.
- **Điểm xuất phát (`from`):** `t3` (Nhà T3 · trạm máy chủ) → **Điểm đích (`to`):** `c` (Nhà C / Sân khấu)
- **Danh sách các cạnh và trọng số thời gian (`edges`):** `[["t3", "canteen", 3], ["canteen", "cross", 2], ["cross", "e", 2], ["e", "court", 3], ["court", "c", 4], ["t3", "cross", 6], ["canteen", "e", 3], ["cross", "court", 6], ["e", "c", 8], ["rear", "t3", 2], ["lawn", "rear", 2], ["lawn", "c", 16]]`
- **Ba bậc gợi ý chuẩn (`hints`):**
  - *Gợi ý 1:* Cộng số phút của từng đoạn trên một đường.
  - *Gợi ý 2:* Đi thẳng qua Lối sang chưa chắc nhanh nhất; thử nhánh Lối qua Căng tin – Nhà E · điểm dữ liệu.
  - *Gợi ý 3:* Đường nhanh nhất: Nhà T3 · trạm máy chủ, Lối qua Căng tin, Nhà E · điểm dữ liệu, Sân USSH, Nhà C / Sân khấu, tổng 13 phút.

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Vy · nhóm kiểm tra:** "Mười ba phút. Cậu sang Nhà E · điểm dữ liệu trước nhé, các bạn USSH đang giữ bộ ảnh."

---

#### Điểm dừng 9/16 — `s8`: Bộ ảnh bên USSH

- **Chương:** `ch2b` — **Chương II · Bên USSH**
- **NPC phụ trách:** **Đại diện sinh viên USSH** (`history`)
- **Mục tiêu (`objective`):** Gặp đại diện sinh viên USSH ở Nhà E · điểm dữ liệu
- **Vật phẩm nhận được:** `photos` (**Bộ ảnh cựu sinh viên**)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Đại diện sinh viên USSH:** "Chào bạn HAMIC! Bộ ảnh này do các anh chị cựu sinh viên góp, mỗi ảnh có một lời ghi riêng."
- **Đại diện sinh viên USSH:** "Hồi trước năm 1995, hai trường mình còn chung tên Đại học Tổng hợp Hà Nội. Ảnh cũ nên có chỗ chung."
- **Bạn · thành viên mới HAMIC:** "Lời ghi nằm trong thư mục _ghichu mà Nhà T3 · trạm máy chủ chưa nhận được."
- **Đại diện sinh viên USSH:** "Vậy bạn gặp Linh nhé. Linh ghép ảnh với lời ghi."

**2) Cảnh nhánh theo Phong cách làm việc (`bondScenes.s8`):**
- **Nhánh `listen` (Lắng nghe chuyện cũ)** *(Điểm tin cậy: `{"history": 1, "linh": 1}`)*:
  - **Đại diện sinh viên USSH:** "Có một anh cựu sinh viên gửi ảnh kèm thư tay. Anh viết: ảnh mờ rồi, nhưng nhớ thì không mờ."
  - **Bạn · thành viên mới HAMIC:** "Lời ghi trong ảnh là của anh ấy à?"
  - **Đại diện sinh viên USSH:** "Ừ. Nên bọn mình mới muốn giữ nguyên."
- **Nhánh `build` (Bắt tay dựng thử)** *(Mở thêm bằng chứng: `frameTip` (**Khung chữ**))*:
  - **Bạn · thành viên mới HAMIC:** "Khung chữ trên mô hình rộng bao nhiêu ký tự?"
  - **Đại diện sinh viên USSH:** "Khoảng sáu mươi. Lời ghi dài nhất có năm mươi tư."
  - **Bạn · thành viên mới HAMIC:** "Vậy vừa khung, không cần rút gọn."

---

#### Điểm dừng 10/16 — `s9`: Ghép ảnh với lời ghi

- **Chương:** `ch2b` — **Chương II · Bên USSH**
- **NPC phụ trách:** **Linh · nhóm tư liệu** (`linh`)
- **Mục tiêu (`objective`):** Linh ở Nhà E · điểm dữ liệu ghép ảnh với lời ghi
- **Bằng chứng thu được:** `captions` (**Lời ghi đi theo ảnh**)
- **Quyết định ngay tại điểm dừng:** `captions` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Linh · nhóm tư liệu:** "Tệp ghi chú đây rồi! Nhưng thứ tự bị xáo, mình không chắc lời nào của ảnh nào."
- **Linh · nhóm tư liệu:** "Mỗi lời ghi là chữ của người góp ảnh. Mình không muốn sửa giọng của họ."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = captions` — Ghép ảnh với lời ghi):**
- **Đề bài chính (`prompt`):** Chọn một ảnh rồi chọn lời ghi hợp với ảnh đó. Ghép đủ bốn cặp rồi bấm Kiểm tra.
- **Đề bài rút gọn cho chế độ Kể chuyện (`promptEasy`):** *Chọn một ảnh, rồi chọn câu hợp với ảnh. Ghép đủ bốn cặp.*
- **Danh sách 4 bức ảnh tư liệu (`photos`) và chú thích khớp đúng (`captions`):**
  - Ảnh `p1` (**Ảnh 1 · Hai bạn bên giá sách**) ↔ Chú thích `c1`: *"Mùa thi, thư viện lúc nào cũng hết chỗ ngồi."*
  - Ảnh `p2` (**Ảnh 2 · Sân có cây bàng lớn**) ↔ Chú thích `c2`: *"Gốc cây này là chỗ hẹn của cả khóa."*
  - Ảnh `p3` (**Ảnh 3 · Bảng đen kín chữ**) ↔ Chú thích `c3`: *"Giờ chữa bài, thầy để nguyên bảng cho cả lớp chép."*
  - Ảnh `p4` (**Ảnh 4 · Đêm văn nghệ ngoài trời**) ↔ Chú thích `c4`: *"Đêm văn nghệ chung, hai khoa ngồi kín sân."*
- **Ba bậc gợi ý chuẩn (`hints`):**
  - *Gợi ý 1:* Tìm trong lời ghi một vật xuất hiện trong ảnh.
  - *Gợi ý 2:* Thư viện đi với giá sách, chữa bài đi với bảng đen.
  - *Gợi ý 3:* Ảnh 2 là gốc cây chỗ hẹn, ảnh 4 là đêm văn nghệ.
- **Ba bậc gợi ý chế độ Kể chuyện (`hintsEasy`):**
  - *Gợi ý dễ 1:* Tìm đồ vật giống nhau trong ảnh và câu.
  - *Gợi ý dễ 2:* Giá sách đi với thư viện.
  - *Gợi ý dễ 3:* Cây đi với chỗ hẹn, sân khấu đi với văn nghệ.
- **Thông báo khi giải xong (`success`):** "Bốn cặp đều khớp. Lời ghi giữ nguyên chữ của người góp ảnh."

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Linh · nhóm tư liệu:** "An đang ngồi ở Sân USSH xem thử phần chữ. Cậu ghé qua hỏi An thấy thế nào nhé."

---

#### Điểm dừng 11/16 — `s10`: Nhịp chữ và hiệu ứng

- **Chương:** `ch2b` — **Chương II · Bên USSH**
- **NPC phụ trách:** **An · sinh viên ghé xem** (`an`)
- **Mục tiêu (`objective`):** An đang xem thử phần chữ ở Sân USSH
- **Bằng chứng thu được:** `timing` (**Nhịp chữ**)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **An · sinh viên ghé xem:** "Mình học Văn, ghé xem cho vui thôi. Mà thật lòng nhé, chữ hiện lúc pháo còn đang nổ, mình chưa đọc kịp đã tắt."
- **Bạn · thành viên mới HAMIC:** "Vậy chỉnh lúc chữ hiện và thời gian giữ chữ."
- **An · sinh viên ghé xem:** "Mình đọc chậm lắm. Ba chữ một giây là cùng."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = timing` — Nhịp chữ và hiệu ứng):**
- **Đề bài chính (`prompt`):** Hiệu ứng cần 1,2 giây để ổn định. Câu chúc có 9 chữ, khán giả đọc 3 chữ mỗi giây. Cảnh dài 6 giây.
- **Đề bài rút gọn cho chế độ Kể chuyện (`promptEasy`):** *Chữ phải hiện sau khi pháo đứng yên. Chữ phải ở lại đủ lâu để đọc hết.*
- **Thông số kỹ thuật:** Thời gian pháo bay lên `rise = 1.2s`, Tổng thời lượng cảnh `total = 6s`, Độ dài câu chữ `words = 9 từ`, Tốc độ đọc `rate = 3 từ/s` (cần giữ tối thiểu `3,0s`).
- **Thanh trượt Độ trễ bật chữ (`delay`):** `{'min': 0, 'max': 4, 'step': 0.1, 'start': 0.4}` (Chuẩn: đặt `delay = 1,2s` đúng lúc pháo nở).
- **Thanh trượt Thời gian giữ chữ (`hold`):** `{'min': 1, 'max': 5, 'step': 0.1, 'start': 2}` (Chuẩn: đặt `hold >= 3,0s` và `delay + hold <= 5,5s`).
- **Ba bậc gợi ý chuẩn (`hints`):**
  - *Gợi ý 1:* Chữ phải hiện sau khi hiệu ứng ổn định.
  - *Gợi ý 2:* Thời gian giữ chữ ít nhất bằng số chữ chia tốc độ đọc.
  - *Gợi ý 3:* Hiện chữ trong khoảng 1,2 đến 3 giây, giữ ít nhất 3 giây.
- **Ba bậc gợi ý chế độ Kể chuyện (`hintsEasy`):**
  - *Gợi ý dễ 1:* Kéo thanh trên để chữ hiện muộn hơn.
  - *Gợi ý dễ 2:* Kéo thanh dưới để chữ ở lại lâu hơn.
  - *Gợi ý dễ 3:* Chờ hơn một giây mới hiện, giữ chữ ba giây.
- **Thông báo khi giải xong (`success`):** "Chữ hiện khi pháo đã đứng yên và ở lại đủ lâu để đọc hết."

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **An · sinh viên ghé xem:** "Giờ thì đọc kịp rồi. Bên Nhà C / Sân khấu đang xếp cảnh, cậu sang xem đi."

---

#### Điểm dừng 12/16 — `s11`: Chọn bốn cảnh trong tám

- **Chương:** `ch2b` — **Chương II · Bên USSH**
- **NPC phụ trách:** **Bảo · trực sân khấu** (`bao`)
- **Mục tiêu (`objective`):** Bảo trực sân khấu ở Nhà C / Sân khấu

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Bảo · trực sân khấu:** "Em đến đúng lúc. Có tám cảnh ảnh, đêm diễn chỉ chiếu được bốn."
- **Bảo · trực sân khấu:** "Anh muốn biết có bao nhiêu cách chọn, để còn chia cho các nhóm xem thử."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = level` — Chọn bốn cảnh trong tám):**
- **Ghi chú dẫn nhập (`note`):** Đếm số cách chọn cảnh. Thứ tự chọn không quan trọng.
- **Màn chơi Mạch ánh sáng được gọi theo độ khó (`levels`):** Dễ: `count-d1-s901000` | Chuẩn: `6.1` | Thử thách: `6.3` (Xem chi tiết đề bài & đáp án tại Phần V).

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Bảo · trực sân khấu:** "Bảy mươi cách, nghe cứ như cố ý. Anh gửi cho điều phối sân khấu luôn."

---

#### Điểm dừng 13/16 — `s11b`: Nhà T4: ma trận chuyển vị & định thức

- **Chương:** `ch2b` — **Chương II · Bên USSH**
- **NPC phụ trách:** **Quỳnh · K70 Toán học (ĐSTT)** (`quynh`)
- **Mục tiêu (`objective`):** Ghé Nhà T4, HUS gặp Quỳnh để kiểm tra ma trận xoay trực giao và định thức trước khi nạp lên dàn drone

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Quỳnh · K70 Toán học (ĐSTT):** "May quá cậu ghé qua Nhà T4, HUS. Tớ vừa rà lại mô-đun biến đổi tuyến tính của dàn chiếu và phát hiện một chỗ rất dễ nhầm giữa ma trận quay $R$ với ma trận chuyển vị $R^T$."
- **Bạn · thành viên mới HAMIC:** "Hồi chiều ở bãi cỏ, Hải cũng nhắc chuyện thứ tự nhân hai ma trận không giao hoán. Còn bên này bị lệch thế nào hả Quỳnh?"
- **Quỳnh · K70 Toán học (ĐSTT):** "Trong Đại số tuyến tính, ma trận quay $R$ là ma trận trực giao có $\det(R) = 1$, nên chuyển vị $R^T$ chính là nghịch đảo $R^{-1}$. Nếu nạp nhầm $R^T$, góc quay bị đảo ngược làm tia chúi xuống đất, còn nếu nhân toàn bộ ma trận lên $k$ lần thì $\det(kR) = k^2\det(R)$ làm biến dạng cả khung hình. Cậu tính thử cùng tớ nhé."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = level` — Kiểm tra ma trận chuyển vị $R^T$ và định thức $\det(kR)$):**
- **Ghi chú dẫn nhập (`note`):** Áp dụng tính chất ma trận trực giao $R^T = R^{-1}$ và định thức cấp 2 $\det(kR) = k^2\det(R)$ để tìm tọa độ ảnh và kiểm chứng phép co giãn.
- **Màn chơi Mạch ánh sáng được gọi theo độ khó (`levels`):** Dễ: `transpose-bug-d1-s501000` | Chuẩn: `2.4` | Thử thách: `transpose-bug-d4-s504001` (Xem chi tiết đề bài & đáp án tại Phần V).

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Quỳnh · K70 Toán học (ĐSTT):** "Chuẩn rồi đó. Nhớ kỹ vụ chuyển vị $R^T$ làm lật ngược chiều quay nhé, lát nữa cậu sang Nhà C / Sân khấu gặp chị Mai bên sân khấu kiểu gì cũng đụng đúng tham số này trên bảng điều khiển drone."

---

#### Điểm dừng 14/16 — `s12`: Dàn drone chữ 70

- **Chương:** `ch2b` — **Chương II · Bên USSH**
- **NPC phụ trách:** **Điều phối sân khấu USSH** (`stage`)
- **Mục tiêu (`objective`):** Điều phối sân khấu USSH đang xếp drone
- **Vật phẩm nhận được:** `program` (**Chương trình drone**)
- **Quyết định ngay tại điểm dừng:** `drones` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Điều phối sân khấu USSH:** "Bạn HAMIC đây rồi. Cảnh mở màn cần 70 drone xếp 7 hàng, mỗi hàng 10 chiếc."
- **Điều phối sân khấu USSH:** "Bạn viết chương trình giúp mình nhé. Lặp lồng nhau là gọn nhất."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = level` — Dàn drone chữ 70):**
- **Ghi chú dẫn nhập (`note`):** Ghép khối lệnh để xếp đủ 70 drone thành 7 hàng × 10 cột.
- **Màn chơi Mạch ánh sáng được gọi theo độ khó (`levels`):** Dễ: `3.2` | Chuẩn: `3.2` | Thử thách: `block-vm-d4-s604002` (Xem chi tiết đề bài & đáp án tại Phần V).

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Điều phối sân khấu USSH:** "Chương trình chạy rồi. Bạn mang lịch cảnh về cho Đức ở Nhà T3 · trạm máy chủ nhé."

---

#### Điểm dừng 15/16 — `s13`: Thứ tự tổng duyệt

- **Chương:** `ch3` — **Chương III · Cùng bật sáng**
- **NPC phụ trách:** **Đức · phụ trách tổng duyệt** (`duc`)
- **Mục tiêu (`objective`):** Về Nhà T3 · trạm máy chủ gặp Đức
- **Bằng chứng thu được:** `schedule` (**Hai bản lịch**)
- **Vật phẩm nhận được:** `schedule` (**Lịch tổng duyệt**)
- **Quyết định ngay tại điểm dừng:** `final` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Đức · phụ trách tổng duyệt:** "Em về rồi. Anh đang xếp thứ tự tổng duyệt, cảnh nào cũng cần cảnh khác xong trước."
- **Đức · phụ trách tổng duyệt:** "Xếp sai là drone bay khi gương còn chưa căn. Em xếp giúp anh."

**2) Cảnh nhánh theo Phong cách làm việc (`bondScenes.s13`):**
- **Nhánh `listen` (Lắng nghe chuyện cũ)** *(Điểm tin cậy: `{"duc": 1}`)*:
  - **Đức · phụ trách tổng duyệt:** "Năm ngoái tổng duyệt, anh run đến mức bấm nhầm nút tắt đèn cả sân."
  - **Bạn · thành viên mới HAMIC:** "Rồi sao nữa anh?"
  - **Đức · phụ trách tổng duyệt:** "Cả sân cười. Chị bật lại, bảo: lỗi lúc tổng duyệt là lỗi tốt."
- **Nhánh `build` (Bắt tay dựng thử)** *(Mở thêm bằng chứng: `depTip` (**Bảng phụ thuộc**))*:
  - **Bạn · thành viên mới HAMIC:** "Anh có bảng phụ thuộc giữa các cảnh không?"
  - **Đức · phụ trách tổng duyệt:** "Có, anh vẽ tay đây. Mũi tên chỉ cảnh nào cần cảnh nào."
  - **Bạn · thành viên mới HAMIC:** "Vậy tìm cảnh không cần gì trước, rồi gỡ dần."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = topo` — Thứ tự tổng duyệt):**
- **Đề bài chính (`prompt`):** Bấm lần lượt các bước theo thứ tự chạy. Bước nào cũng phải chạy sau những bước nó cần.
- **Đề bài rút gọn cho chế độ Kể chuyện (`promptEasy`):** *Bấm các bước theo thứ tự. Mỗi bước có ghi bước cần làm trước.*
- **Các bước quy trình cần sắp xếp thứ tự topo (`steps`):**
  - Bước `dien`: **Kiểm tra điện** *(Yêu cầu xong trước: Không (bước khởi đầu))*
  - Bước `nen`: **Bật đèn nền** *(Yêu cầu xong trước: `dien`)*
  - Bước `guong`: **Căn gương** *(Yêu cầu xong trước: `nen`)*
  - Bước `drone`: **Thả drone** *(Yêu cầu xong trước: `dien`)*
  - Bước `phao`: **Bắn pháo hoa** *(Yêu cầu xong trước: `guong`, `drone`)*
  - Bước `chu`: **Hiện chữ chúc mừng** *(Yêu cầu xong trước: `phao`)*
- **Ba bậc gợi ý chuẩn (`hints`):**
  - *Gợi ý 1:* Bước không cần bước nào thì làm trước.
  - *Gợi ý 2:* Pháo hoa cần gương và drone đã xong.
  - *Gợi ý 3:* Một thứ tự đúng: điện, đèn nền, gương, drone, pháo, chữ.
- **Ba bậc gợi ý chế độ Kể chuyện (`hintsEasy`):**
  - *Gợi ý dễ 1:* Tìm bước không cần gì trước.
  - *Gợi ý dễ 2:* Pháo hoa đi sau gương và drone.
  - *Gợi ý dễ 3:* Bắt đầu bằng kiểm tra điện.
- **Thông báo khi giải xong (`success`):** "Mọi bước đều chạy sau những bước nó cần."

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Đức · phụ trách tổng duyệt:** "Xong. Chị đang đợi em đối chiếu bằng chứng đấy."

---

#### Điểm dừng 16/16 — `s14`: Đối chiếu bằng chứng

- **Chương:** `ch3` — **Chương III · Cùng bật sáng**
- **NPC phụ trách:** **Chị Chủ nhiệm HAMIC** (`chief`)
- **Mục tiêu (`objective`):** Chốt nguyên nhân với chị Chủ nhiệm ở Nhà T3 · trạm máy chủ
- **Quyết định ngay tại điểm dừng:** `bursts` (Xem chi tiết tại Mục 2.5)

**1) Lời thoại mở đầu điểm dừng (`lines`):**
- **Chị Chủ nhiệm HAMIC:** "Em đi một vòng rồi. Giờ mình bày hết ra bàn, xem đèn lệch vì đâu."
- **Chị Chủ nhiệm HAMIC:** "Có người trong nhóm đoán là ai đó cố ý. Chị không tin lắm. Em chọn giúp chị những nguyên nhân thật."

**3) Hoạt động tương tác / Câu đố tại chỗ (`activity.type = causes` — Đối chiếu bằng chứng):**
- **Đề bài chính (`prompt`):** Chọn đúng những thẻ là nguyên nhân thật của bản chạy thử bị lệch.
- **Đề bài rút gọn cho chế độ Kể chuyện (`promptEasy`):** *Chọn những thẻ có bằng chứng trong Sổ của bạn.*
- **Các thẻ nguyên nhân cần phân loại (`cards`):**
  - Thẻ `version` (**NGUYÊN NHÂN THẬT (`real = true`)**): *"Bản đèn cũ được lưu lại, trùng tên với bản đã duyệt"*
  - Thẻ `notes` (**NGUYÊN NHÂN THẬT (`real = true`)**): *"Mẫu đồng bộ bỏ qua thư mục _ghichu"*
  - Thẻ `schedule` (**NGUYÊN NHÂN THẬT (`real = true`)**): *"Hai nhóm dùng hai bản lịch khác nhau, ai cũng tưởng đã chốt"*
  - Thẻ `sabotage` (Nguyên nhân giả / tin đồn (`real = false`)): *"Có người cố tình sửa cấu hình"*
  - Thẻ `hardware` (Nguyên nhân giả / tin đồn (`real = false`)): *"Máy bắn pháo hoa bị hỏng"*
  - Thẻ `heavy` (Nguyên nhân giả / tin đồn (`real = false`)): *"Mô hình quá nặng nên máy chạy chậm"*
- **Ba bậc gợi ý chuẩn (`hints`):**
  - *Gợi ý 1:* Mỗi nguyên nhân thật đều có một bằng chứng trong Sổ.
  - *Gợi ý 2:* Không bằng chứng nào cho thấy máy hỏng hay có người phá.
  - *Gợi ý 3:* Ba nguyên nhân: bản trùng tên, mẫu đồng bộ, hai bản lịch.
- **Ba bậc gợi ý chế độ Kể chuyện (`hintsEasy`):**
  - *Gợi ý dễ 1:* Mở Sổ xem lại bằng chứng.
  - *Gợi ý dễ 2:* Không ai cố ý làm hỏng.
  - *Gợi ý dễ 3:* Chọn ba thẻ đầu tiên.
- **Thông báo khi giải xong (`success`):** "Ba sai sót nhỏ cộng dồn. Không ai cố ý, chỉ là ai cũng vội một chút."

**4) Lời thoại sau khi hoàn thành hoạt động (`after`):**
- **Chị Chủ nhiệm HAMIC:** "Được rồi. Mình chạy thử Đêm Hội tụ nhé. Em bấm nút đi."

---

### 2.5. Toàn văn 8 Quyết định Cốt truyện (`story.decisions` & `config.endings.risk`)

> **Lưu ý cơ chế:** Trò chơi không báo "đúng / sai" khi người chơi chọn. Mỗi lựa chọn cộng điểm rủi ro kỹ thuật (`risk` cấu hình trong `config.json`) và điểm tin cậy (`trust` với từng NPC), đồng thời hiển thị phản hồi trực tiếp và ghi nhận hệ quả vào Sổ tay.

#### Quyết định 1/8 — `version` (tại điểm dừng `s0` — Người hỏi: Minh · nhóm đón khách)
- **Câu hỏi tình huống (`prompt`):** **Minh hỏi: gửi bản nào về Nhà T3 · trạm máy chủ?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Gửi Bản 1, mã băm 3f70a1 khớp với bản chị đã duyệt.** | `+0` | `{"minh": 1, "chief": 1}` | "Minh gửi Bản 1 và ghi mã băm vào tin nhắn." | Bản về Nhà T3 · trạm máy chủ khớp mã băm với bản đã duyệt. |
| **`B`** | **Gửi Bản 2, giờ sửa muộn hơn chắc là mới hơn.** | `+15` | `{}` | "Minh gửi Bản 2. Giờ sửa muộn nhất, nghe hợp lý." | Bản đèn cũ của Hà, có giờ sửa muộn hơn, được đưa lên mô hình. |
| **`C`** | **Gửi cả hai, để Nhà T3 · trạm máy chủ tự chọn.** | `+4` | `{"minh": 1}` | "Minh gửi cả hai bản kèm một dòng: chưa rõ bản nào." | Hai bản cùng tên về Nhà T3 · trạm máy chủ, người nhận phải tự đoán. |

#### Quyết định 2/8 — `firework` (tại điểm dừng `s1` — Người hỏi: Thành viên Ban Học tập)
- **Câu hỏi tình huống (`prompt`):** **Ban Học tập hỏi: có người muốn pháo bay cao mãi cho hoành tráng. Bạn chọn sao?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Giữ hàm dừng ở 70 m như đã căn.** | `+0` | `{"math": 1}` | "Ban Học tập lưu lại cấu hình vừa chỉnh." | Pháo hoa giữ hàm hội tụ về 70 m. |
| **`B`** | **Thêm hệ số cho pháo vút lên không dừng.** | `+9` | `{}` | "Ban Học tập nhún vai: thử xem sao, nhưng tớ ghi chú lại đấy." | Pháo hoa được đổi sang hàm không hội tụ. |

#### Quyết định 3/8 — `ha` (tại điểm dừng `s2` — Người hỏi: Hà · nhóm kỹ thuật)
- **Câu hỏi tình huống (`prompt`):** **Hà ngập ngừng: có nên nói với chị chuyện bản đèn cũ không?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Hà tự báo chị nhé, mình đi cùng.** | `+0` | `{"ha": 2, "chief": 1}` | "Hà gật đầu, nhắn chị ngay trước mặt bạn." | Hà báo lỗi sớm, chị biết bản đèn cũ đang lẫn trong thư mục. |
| **`B`** | **Để mình sửa lặng lẽ, khỏi nói ai.** | `+1` | `{"ha": 1}` | "Hà thở phào, nhưng trên Nhà T3 · trạm máy chủ không ai biết có bản cũ." | Lỗi được sửa trên máy Hà, các máy khác vẫn giữ bản cũ. |
| **`C`** | **Cứ để vậy, chắc không sao.** | `+2` | `{}` | "Hà cười gượng rồi quay lại với dải đèn." | Bản đèn cũ vẫn nằm lẫn, không ai được báo. |

#### Quyết định 4/8 — `notes` (tại điểm dừng `s6` — Người hỏi: Vy · nhóm kiểm tra)
- **Câu hỏi tình huống (`prompt`):** **Vy hỏi: sửa mẫu chung thì cả nhóm phải đồng bộ lại. Làm thế nào?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Sửa mẫu chung và báo cả nhóm đồng bộ lại.** | `+0` | `{"vy": 2}` | "Vy sửa mẫu, nhắn cả nhóm. Vài người kêu, nhưng ai cũng làm." | Mẫu đồng bộ có _ghichu, máy Nhà T3 · trạm máy chủ nhận đủ lời ghi. |
| **`B`** | **Chỉ sửa trên máy này thôi, chắc đủ.** | `+13` | `{}` | "Vy sửa trên máy của mình. Máy Nhà T3 · trạm máy chủ vẫn dùng mẫu cũ." | Máy Nhà T3 · trạm máy chủ vẫn dùng mẫu cũ và không nhận lời ghi. |
| **`C`** | **Chép tay lời ghi vào bản chính, khỏi đụng mẫu.** | `+13` | `{"vy": 1}` | "Vy chép vài dòng vào bản chính. Còn sót hay không thì chưa biết." | Lời ghi được chép tay, có thể sót vài dòng. |

#### Quyết định 5/8 — `captions` (tại điểm dừng `s9` — Người hỏi: Linh · nhóm tư liệu)
- **Câu hỏi tình huống (`prompt`):** **Khung chữ trên mô hình hơi chật. Linh hỏi bạn xử lý lời ghi thế nào?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Giữ nguyên lời ghi, đặt cạnh ảnh.** | `+0` | `{"linh": 2, "history": 1}` | "Linh đặt lời ghi cạnh ảnh, không sửa chữ nào." | Lời ghi được giữ nguyên chữ của người góp ảnh. |
| **`B`** | **Rút gọn lời ghi cho vừa khung.** | `+3` | `{}` | "Linh cắt bớt chữ, mặt hơi buồn." | Lời ghi bị rút gọn, mất vài chi tiết. |
| **`C`** | **Bỏ lời ghi, chỉ chiếu ảnh.** | `+5` | `{}` | "Linh im lặng xóa phần lời ghi." | Ảnh được chiếu không kèm lời ghi. |

#### Quyết định 6/8 — `drones` (tại điểm dừng `s12` — Người hỏi: Điều phối sân khấu USSH)
- **Câu hỏi tình huống (`prompt`):** **Điều phối sân khấu hỏi: bản vẽ chữ 70 nhìn từ phía nào?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Nhìn từ phía khán giả.** | `+0` | `{"stage": 1}` | "Điều phối đánh số drone từ trái sang theo mắt khán giả." | Drone xếp theo hướng nhìn của khán giả. |
| **`B`** | **Nhìn từ phía sân khấu.** | `+9` | `{}` | "Điều phối đánh số theo phía sân khấu. Nghe cũng hợp lý." | Drone xếp theo hướng sân khấu, khán giả nhìn ngược lại. |

#### Quyết định 7/8 — `final` (tại điểm dừng `s13` — Người hỏi: Đức · phụ trách tổng duyệt)
- **Câu hỏi tình huống (`prompt`):** **Đức nói bản lịch 3 chắc chốt rồi. Bạn làm gì?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Nhắn cả nhóm xác nhận bản chốt kèm mã băm.** | `+0` | `{"duc": 1, "bao": 1, "stage": 1}` | "Cả nhóm trả lời: bản chốt là bản 4. Đức đổi ngay." | Cả nhóm xác nhận cùng một bản lịch. |
| **`B`** | **Tin lời Đức, bản 3 chắc chốt rồi.** | `+9` | `{}` | "Đức gật gù. Bên sân khấu vẫn đang cầm bản 4." | Nhà T3 · trạm máy chủ dùng bản lịch 3, sân khấu USSH dùng bản 4. |
| **`C`** | **Chỉ hỏi riêng Bảo cho nhanh.** | `+8` | `{"bao": 1}` | "Bảo bảo bản 4. Nhưng điều phối sân khấu chưa ai hỏi." | Chỉ hai người biết bản chốt, những người khác đoán. |

#### Quyết định 8/8 — `bursts` (tại điểm dừng `s14` — Người hỏi: Chị Chủ nhiệm HAMIC)
- **Câu hỏi tình huống (`prompt`):** **Chị hỏi lần cuối: dàn pháo hoa xếp thế nào?**

| Phương án | Nội dung lựa chọn (`text`) | Điểm Rủi ro (`risk`) | Điểm Tin cậy (`trust`) | Phản hồi trực tiếp của NPC (`reply`) | Hệ quả ghi nhận (`effect`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **`A`** | **Giữ đúng kịch bản 70 chùm.** | `+0` | `{"chief": 1}` | "Chị gật đầu: đúng kịch bản." | Pháo hoa giữ đúng kịch bản. |
| **`B`** | **Thêm một chùm cho vui.** | `+6` | `{}` | "Chị cười: ai cũng muốn thêm một chùm." | Kịch bản pháo hoa có thêm chùm ngoài dự kiến. |
| **`C`** | **Xếp pháo theo các ước của 70.** | `+8` | `{"math": 1}` | "Chị tròn mắt: 1, 2, 5, 7, 10, 14, 35? Thử xem." | Pháo hoa được xếp theo các ước thực sự của 70. |

### 2.6. Danh mục 15 Bằng chứng (`story.evidence`) & 6 Vật phẩm (`story.items`) trong Sổ tay

#### A. 15 Mảnh bằng chứng kỹ thuật & tư liệu (`evidence`):

| STT | Mã bằng chứng | Tiêu đề (`title`) | Nội dung chi tiết lưu trong Sổ tay (`text`) |
| :---: | :--- | :--- | :--- |
| 1 | `versions` | **Hai bản cùng tên** | Bản 2 sửa muộn hơn nhưng là bản đèn cũ: b = 1,20, gương F rồi R, chỉ sáu đèn. |
| 2 | `height` | **Pháo hoa dừng thấp** | Với $h(t) = 70(1 - e^{-bt})$ và $b = 1{,}20$, sau 3 giây pháo còn cách đích $70e^{-3,6} \approx 1{,}9$ m. Cần $70e^{-3b} \le 0{,}5$, tức $b \ge \ln 140 / 3 \approx 1{,}65$. |
| 3 | `oldLamp` | **Sáu đèn chưa đủ** | Tổng $\sum_{n=1}^{N} 2^{-n} = 1 - 2^{-N}$: sáu đèn chỉ đạt $98{,}4\%$, cần $N = 7$ để vượt $99\%$. |
| 4 | `order` | **Thứ tự gương** | $F R \ne R F$: đặt F trước R cho tia ra hướng khác R trước F. Phép nhân ma trận không giao hoán. |
| 5 | `notesFile` | **Tệp ghi chú gốc** | Thư mục _ghichu nằm trong tủ của Nam, đầy đủ lời ghi cho bốn ảnh. |
| 6 | `sync` | **Mẫu đồng bộ** | Viết theo đại số quan hệ, mẫu chung lấy $\sigma_{\text{tên} \,\text{NOT LIKE}\, \text{'\_\%'}}(\text{ThuMuc})$, nên _ghichu không lên Nhà T3 · trạm máy chủ. |
| 7 | `route` | **Đường chuyển tệp** | Đường nhanh nhất từ Nhà T3 · trạm máy chủ tới Nhà C / Sân khấu mất 13 phút: Nhà T3 · trạm máy chủ, Lối qua Căng tin, Nhà E · điểm dữ liệu, Sân USSH, Nhà C / Sân khấu. Tìm bằng thuật toán Dijkstra:
[[algo]]
gán $d[\text{Nhà T3 · trạm máy chủ}] = 0$, các đỉnh khác $d = \infty$
trong khi còn đỉnh chưa xét
  chọn đỉnh $u$ chưa xét có $d[u]$ nhỏ nhất
  với mỗi đoạn $(u, v)$ dài $w$
    nếu $d[u] + w < d[v]$ thì gán $d[v] = d[u] + w$
trả về $d[\text{Nhà C / Sân khấu}] = 13$
[[/algo]] |
| 8 | `captions` | **Lời ghi đi theo ảnh** | Mỗi ảnh có một lời ghi của người góp ảnh; thiếu tệp ghi chú thì chữ không hiện. |
| 9 | `timing` | **Nhịp chữ** | Chữ hiện trước khi pháo đứng yên thì khán giả không kịp đọc. |
| 10 | `schedule` | **Hai bản lịch** | Đức dùng lịch bản 3, sân khấu USSH dùng bản 4. Ai cũng tưởng bản mình là bản chốt. |
| 11 | `hashTip` | **Giờ sửa và mã băm** | Giờ sửa đổi khi chép tệp; mã băm chỉ đổi khi nội dung đổi. |
| 12 | `bTable` | **Bảng b thử nghiệm** | b = 1,60 sau 3 giây lệch khoảng 0,58 m; b = 1,65 lệch khoảng 0,50 m. |
| 13 | `crtTip` | **Ba ổ khóa** | Định lý số dư Trung Hoa: vì $2 \cdot 5 \cdot 7 = 70$, hệ $x \equiv 1 \pmod 2$, $x \equiv 2 \pmod 5$, $x \equiv 3 \pmod 7$ có đúng một nghiệm trong $0..69$. |
| 14 | `frameTip` | **Khung chữ** | Khung chữ chứa khoảng 60 ký tự; lời ghi dài nhất có 54 ký tự. |
| 15 | `depTip` | **Bảng phụ thuộc** | Sắp xếp tô-pô (thuật toán Kahn):
[[algo]]
thêm mọi bước không cần bước nào vào hàng đợi $Q$
trong khi $Q$ khác rỗng
  lấy bước $u$ ra khỏi $Q$, ghi vào thứ tự
  với mỗi bước $v$ cần $u$: xóa mũi tên $u \to v$
    nếu $v$ hết mũi tên vào thì thêm $v$ vào $Q$
[[/algo]] |

#### B. 6 Vật phẩm cốt truyện (`items`):

| STT | Mã vật phẩm | Tên vật phẩm (`title`) | Mô tả chi tiết (`text`) |
| :---: | :--- | :--- | :--- |
| 1 | `card` | **Thẻ thành viên HAMIC** | Tấm thẻ còn mới, tên bạn viết tay. |
| 2 | `synclist` | **Danh sách đồng bộ** | Danh sách tệp Nhà T3 · trạm máy chủ cần nhận, in từ mẫu chung. |
| 3 | `notes` | **Thư mục _ghichu** | Bản gốc lời ghi cho bốn ảnh, lấy từ tủ của Nam. |
| 4 | `photos` | **Bộ ảnh cựu sinh viên** | Bốn ảnh vẽ lại từ ảnh cũ do cựu sinh viên góp. |
| 5 | `program` | **Chương trình drone** | Hai vòng lặp lồng nhau: 7 hàng, mỗi hàng 10 drone. |
| 6 | `schedule` | **Lịch tổng duyệt** | Sáu bước theo thứ tự chạy, bước nào cũng sau bước nó cần. |

### 2.7. Toàn văn 20 Tin nhắn Nhóm dự án (`story.messages`)

| STT | Mã tin | Điều kiện xuất hiện (`requires`) | Người gửi (`speaker`) | Nội dung tin nhắn nguyên văn (`text`) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `m0` | `intro` | **Chị Chủ nhiệm HAMIC** | "Chào mừng bạn mới vào nhóm Đêm Toán Tin! Ai gặp bạn ấy thì giúp một tay nhé." |
| 2 | `m1a` | `dec:version:A` | **Chị Chủ nhiệm HAMIC** | "Bản về Nhà T3 · trạm máy chủ khớp mã 3f70a1. Cảm ơn Minh và bạn mới." |
| 3 | `m1b` | `dec:version:B` | **Đức · phụ trách tổng duyệt** | "Bản này giờ sửa mới nhất nhỉ, anh nạp luôn lên mô hình." |
| 4 | `m1c` | `dec:version:C` | **Chị Chủ nhiệm HAMIC** | "Hai bản cùng tên à? Để chị mở từng bản xem." |
| 5 | `m2a` | `dec:ha:A` | **Hà · nhóm kỹ thuật** | "Chị ơi, bản 2 là bản đèn cũ em lưu lại. Em xin lỗi, em sửa ngay." |
| 6 | `m2b` | `dec:firework:B` | **Thành viên Ban Học tập** | "Có người muốn pháo bay mãi. Tớ để nguyên ghi chú ở cấu hình nhé." |
| 7 | `m3` | `done:s3` | **Thành viên Ban Học tập** | "Dải sáng và gương ổn rồi. Bạn mới đang về Nhà T3 · trạm máy chủ." |
| 8 | `m4` | `done:s4` | **Chị Chủ nhiệm HAMIC** | "Nam ơi, tủ ở Lối qua Căng tin còn khóa không? Bạn mới qua lấy tệp ghi chú." |
| 9 | `m5a` | `dec:notes:A` | **Vy · nhóm kiểm tra** | "Mẫu đồng bộ đã thêm _ghichu. Mọi người bấm đồng bộ lại giúp mình." |
| 10 | `m5b` | `dec:notes:B` | **Vy · nhóm kiểm tra** | "Mình sửa danh sách trên máy mình rồi." |
| 11 | `m5c` | `dec:notes:C` | **Vy · nhóm kiểm tra** | "Lời ghi được chép tay vào bản chính. Ai thấy thiếu thì báo." |
| 12 | `m6` | `done:s8` | **Đại diện sinh viên USSH** | "Bên mình gửi bộ ảnh rồi. Nhờ HAMIC giữ lời ghi giúp nhé." |
| 13 | `m7a` | `dec:captions:A` | **Linh · nhóm tư liệu** | "Lời ghi nằm cạnh ảnh, nguyên chữ. Cảm ơn bạn HAMIC!" |
| 14 | `m7b` | `dec:captions:B` | **Linh · nhóm tư liệu** | "Lời ghi được rút gọn cho vừa khung." |
| 15 | `m7c` | `dec:captions:C` | **Linh · nhóm tư liệu** | "Ảnh sẽ chiếu không kèm lời ghi." |
| 16 | `m8` | `done:s12` | **Điều phối sân khấu USSH** | "Chương trình drone chạy xong. Lịch cảnh gửi về Nhà T3 · trạm máy chủ." |
| 17 | `m9a` | `dec:final:A` | **Đức · phụ trách tổng duyệt** | "Cả nhóm xác nhận: bản chốt là lịch bản 4." |
| 18 | `m9b` | `dec:final:B` | **Bảo · trực sân khấu** | "Ơ, anh tưởng anh Đức chốt bản 4 rồi?" |
| 19 | `m9c` | `dec:final:C` | **Điều phối sân khấu USSH** | "Bản chốt là bản mấy vậy mọi người? Mình đang cầm bản 4." |
| 20 | `m10` | `done:s14` | **Chị Chủ nhiệm HAMIC** | "Mọi người vào chỗ. Mình chạy thử Đêm Hội tụ!" |

---

## PHẦN III. HỆ THỐNG 6 KẾT CỤC (`E1`–`E6`), BẢNG PHÂN BỐ XÁC SUẤT & KỊCH BẢN CUTSCENE

### 3.1. Quy tắc tính Kết cục & Bảng phân bố xác suất trên 2.916 tổ hợp

- **Ngưỡng rủi ro kích hoạt kết cục hài E2 (`config.endings.threshold`):** **`risk >= 18`**
- **Bảng trọng số rủi ro của từng quyết định (`config.endings.risk`):**
  - Quyết định `version`: `{"A": 0, "B": 15, "C": 4}`
  - Quyết định `firework`: `{"A": 0, "B": 9}`
  - Quyết định `ha`: `{"A": 0, "B": 1, "C": 2}`
  - Quyết định `notes`: `{"A": 0, "B": 13, "C": 13}`
  - Quyết định `captions`: `{"A": 0, "B": 3, "C": 5}`
  - Quyết định `drones`: `{"A": 0, "B": 9}`
  - Quyết định `final`: `{"A": 0, "B": 9, "C": 8}`
  - Quyết định `bursts`: `{"A": 0, "B": 6, "C": 8}`

- **Bảng thống kê phân bố thực tế trên toàn bộ $3^6 \times 2 \times 2 = 2.916$ tổ hợp lựa chọn (được kiểm tra tự động bởi `npm run check:answers`):**

| Mã kết cục | Tên kết cục | Cảnh 3D (`scene`) | Số tổ hợp | Tỉ lệ (%) | Điều kiện kích hoạt tóm tắt |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **E1** | **Hai bờ chung một nhịp sáng** | `show` | 48 | **1,65%** | Tổng rủi ro `< 18`, không phạm 3 lỗi gốc (`version=A`, `notes=A`, `final=A`), chọn giữ giao ước hai bờ (`ha=A`, `captions=A`, `bursts=A`). |
| **E2** | **Nổ tung cả 2 trường (chỉ trên mô hình!)** | `boom` | 2.771 | **95,03%** | Tổng điểm rủi ro **`risk >= 18`**. Gồm 4 biến thể nguyên nhân: *Thiếu tệp ghi chú* (`notes`, 1.284 tổ hợp), *Nhầm phiên bản* (`version`, 1.042 tổ hợp), *Hai bản chốt cùng chạy* (`final`, 390 tổ hợp), *Thêm một chùm cho vui* (`extra`, 55 tổ hợp). |
| **E3** | **Cầu sáng nối hai cổng** | `bridge` | 40 | **1,37%** | Tổng rủi ro `< 18`, ưu tiên kết nối không gian hai bờ (`ha=A` hoặc `captions=A` với biến thể nhịp cầu sáng). |
| **E4** | **0 → 70 → ∞** | `07` | 19 | **0,65%** | Tổng rủi ro `< 18`, chọn phương án nhịp số học / thử nghiệm độc lập (`bursts=A`, nhánh kỹ thuật). |
| **E5** | **Đêm hội không muốn tắt** | `forever` | 19 | **0,65%** | Tổng rủi ro `< 18`, chọn kéo dài nhịp hội và giữ đèn lối đi ấm áp. |
| **E6** | **70 điều kỳ lạ** | `weird` | 19 | **0,65%** | Tổng rủi ro `< 18`, đã mở đủ 7 sự thật về số 70 (`unlock.E6.facts = 7`) hoặc chọn nhánh trình chiếu 70 sự thật thú vị. |
| **Tổng** | | | **2.916** | **100,00%** | |

### 3.2. Toàn văn Lời thoại, Biến thể & Gợi ý mở khóa của 6 Kết cục (`story.endings`)

#### Kết cục `E1`: Đêm Hội tụ (Mã cảnh 3D: `show`)
- **Gợi ý mở khóa (`hint`):** *Chơi cẩn thận, giữ đúng kịch bản.*

**Lời thoại trong cảnh kết cục (`lines`):**
- **Chị Chủ nhiệm HAMIC:** "Đèn khớp, chữ hiện đủ, drone xếp đúng chữ 70. Cảm ơn mọi người."
- **Đại diện sinh viên USSH:** "Bên mình đọc rõ từng lời ghi. Để mình chụp lại gửi người góp ảnh."

#### Kết cục `E2`: Sự cố mô hình: nổ tung (Mã cảnh 3D: `boom`)
- **Chú thích an toàn cố định trên màn hình (`caption`):** **"Đây là mô hình trên máy tính. Khuôn viên thật vẫn nguyên vẹn."**
- **Gợi ý mở khóa (`hint`):** *Để lại vài sai sót nhỏ cộng dồn.*

**Lời thoại trong cảnh kết cục (`lines`):**
- **An · sinh viên ghé xem:** "Ơ... các tòa nhà đang bay lên à?"
- **Chị Chủ nhiệm HAMIC:** "May mà mới chạy trên máy. Chị còn bản sao, mình mở lại nhé."

**4 Biến thể chẩn đoán nguyên nhân của Kết cục `E2` (`variants`):**
- **Biến thể `version` — Nhầm phiên bản:**
  - **Minh · nhóm đón khách:** "Hai bản cùng tên, tớ gửi nhầm bản đèn cũ."
- **Biến thể `notes` — Thiếu tệp ghi chú:**
  - **Vy · nhóm kiểm tra:** "Thư mục ghi chú không nằm trong danh sách lấy."
- **Biến thể `final` — Hai bản chốt:**
  - **Đức · phụ trách tổng duyệt:** "Anh tưởng bản đó đã chốt rồi."
- **Biến thể `extra` — Thêm một chùm:**
  - **Chị Chủ nhiệm HAMIC:** "Pháo hoa quá liều vì ai cũng muốn thêm một chùm."

#### Kết cục `E3`: Cầu ánh sáng Tự nhiên – Nhân văn (Mã cảnh 3D: `bridge`)
- **Gợi ý mở khóa (`hint`):** *Giữ nguyên lời ghi, dù vài chỗ khác chưa hoàn hảo.*

**Lời thoại trong cảnh kết cục (`lines`):**
- **Linh · nhóm tư liệu:** "Tia sáng nối hai trường kìa! Lời ghi chạy dọc theo cầu."
- **Đại diện sinh viên USSH:** "Mình chụp lại gửi người góp ảnh ngay."

#### Kết cục `E4`: Drone xếp thành 07 (Mã cảnh 3D: `07`)
- **Gợi ý mở khóa (`hint`):** *Hỏi kỹ bản vẽ nhìn từ phía nào.*

**Lời thoại trong cảnh kết cục (`lines`):**
- **An · sinh viên ghé xem:** "Từ chỗ mình nhìn thì là 07."
- **Điều phối sân khấu USSH:** "Bản vẽ nhìn từ sân khấu. Sửa một phím là xong."

#### Kết cục `E5`: Pháo hoa bay mãi (Mã cảnh 3D: `forever`)
- **Gợi ý mở khóa (`hint`):** *Pháo hoa cần một đích để dừng.*

**Lời thoại trong cảnh kết cục (`lines`):**
- **Thành viên Ban Học tập:** "Hàm này không hội tụ! Pháo cứ lên mãi."
- **Chị Chủ nhiệm HAMIC:** "Mai mình giữ hàm cũ nhé. Đẹp mà không dừng thì cũng hơi lo."

#### Kết cục `E6`: Số kỳ lạ (Mã cảnh 3D: `weird`)
- **Gợi ý mở khóa (`hint`):** *Gom đủ bảy sự thật về 70.*

**Lời thoại trong cảnh kết cục (`lines`):**
- **Thành viên Ban Học tập:** "Pháo tách thành 1, 2, 5, 7, 10, 14, 35. Cộng lại 74, mà không nhóm nào ra đúng 70."
- **Chị Chủ nhiệm HAMIC:** "Chị không ngờ con số của mình lại kỳ lạ thế."

### 3.3. Kịch bản Hình ảnh 3D & Lớp Âm thanh SFX của 6 Cutscene (`docs/CINEMATICS.md`)

| Mã | Thời lượng | Diễn biến hình ảnh 3D / Video 16 giây (`1280×720`, 24fps) | Lớp âm thanh tổng hợp (WebAudio / WAV) |
| :---: | :---: | :--- | :--- |
| **E1** | 16s | Toàn cảnh hai trường lên đèn vàng ấm; cổng vòm sáng nhịp 70; 70 drone xếp số `70` trên bầu trời; pháo hoa dừng chuẩn ở vạch 70 m. | Hợp âm trưởng ấm (C–G–Am–F) + tiếng chuông gió + tiếng pháo hoa mềm ở 4s, 8s, 12s. |
| **E2** | 16s | Đèn nháy lệch nhịp, các khối mô hình trên bàn sa bàn nảy chậm lên trong 3 giây kèm pháo giấy nhiều màu (không khói đen, không lửa, không người), sau đó hiện biển *"Chỉ trên mô hình!"*. | Nhịp trống dồn hài hước + tiếng *boing* lò xo trầm + tiếng pháo giấy *pop* nhẹ. |
| **E3** | 16s | Camera lướt dọc dải đèn kết nối từ Nhà E (USSH) qua cổng giao sang Nhà T3 (HUS), tạo thành cây cầu ánh sáng liền mạch. | Giai điệu piano & pad du dương hai bè trái–phải hòa vào nhau ở giây thứ 8. |
| **E4** | 16s | Đường biểu diễn hàm $h(t) = 70(1 - e^{-bt})$ vẽ bằng hạt sáng vàng chạy từ `0` lên chạm vạch `70` rồi mở rộng ra ký hiệu `∞`. | Âm arpeggio điện tử tăng dần cao độ theo đường cong giới hạn, ngân sáng ở đỉnh. |
| **E5** | 16s | 19 ngọn đèn lối đi lần lượt ấm sáng quanh sân cỏ, các cửa sổ giảng đường lung linh ánh vàng dịu như đêm trò chuyện không muốn tắt. | Tiếng guitar thùng ấm áp + tiếng gió đêm nhẹ qua hàng cây Thanh Xuân. |
| **E6** | 16s | Các con số ước của 70 (`1, 2, 5, 7, 10, 14, 35, 70`) và hình lục giác xoay quanh đài phun nước trước khi hội tụ thành chùm sáng đa sắc. | Giai điệu chuông marimba vui tươi theo nhịp 5/4 và hợp âm `2–5–7`. |

---

## PHẦN IV. HỒ SƠ CHI TIẾT & TOÀN BỘ LỜI THOẠI CỦA 16 NHÂN VẬT (NPC)

### 4.1. Bảng tổng quan 16 NPC trên bản đồ (`map.walk.characters` & `story.npcs`)

| STT | Mã NPC | Tên & Vai trò hiển thị (`story.npc.<id>`) | Vị trí mặc định (`node`) | Màu đại diện | Vị trí thay đổi theo chương (`chapters`) |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | `chief` | **Chị Chủ nhiệm HAMIC** | `t3` | `#ffd25e` | Cố định tại `t3` |
| 2 | `math` | **Thành viên Ban Học tập** | `lawn` | `#5ad8ff` | Cố định tại `lawn` |
| 3 | `history` | **Đại diện sinh viên USSH** | `e` | `#5eeaa0` | Cố định tại `e` |
| 4 | `stage` | **Điều phối sân khấu USSH** | `c` | `#5eeaa0` | Cố định tại `c` |
| 5 | `minh` | **Minh · nhóm đón khách** | `gate` | `#5ad8ff` | `ch2a`→`{'node': 'rear', 'offset': [2.5, 0]}`, `ch2b`→`{'node': 'rear', 'offset': [2.5, 0]}`, `ch3`→`{'node': 'rear', 'offset': [2.5, 0]}` |
| 6 | `ha` | **Hà · nhóm kỹ thuật** | `lawn` | `#5eeaa0` | `ch3`→`{'node': 't3', 'offset': [0, 2.6]}` |
| 7 | `nam` | **Nam · người chuyển tư liệu** | `canteen` | `#ffd25e` | Cố định tại `canteen` |
| 8 | `linh` | **Linh · nhóm tư liệu** | `e` | `#5ad8ff` | `ch3`→`{'node': 'court', 'offset': [2.5, 1.5]}` |
| 9 | `an` | **An · sinh viên ghé xem** | `court` | `#5eeaa0` | `ch3`→`{'node': 'lawn', 'offset': [-2.5, 2]}` |
| 10 | `bao` | **Bảo · trực sân khấu** | `c` | `#ffd25e` | Cố định tại `c` |
| 11 | `vy` | **Vy · nhóm kiểm tra** | `cross` | `#5ad8ff` | Cố định tại `cross` |
| 12 | `duc` | **Đức · phụ trách tổng duyệt** | `t3` | `#5eeaa0` | Cố định tại `t3` |
| 13 | `thao` | **Thảo · K70 Toán Tin (XSTK)** | `t1` | `#5ad8ff` | `ch0`→`{'node': 't1', 'offset': [4, 0]}` |
| 14 | `kien` | **Kiên · K69 Khoa học dữ liệu (XSTK)** | `t5` | `#ffd25e` | `ch0`→`{'node': 't5', 'offset': [-4, 0]}` |
| 15 | `quynh` | **Quỳnh · K70 Toán học (ĐSTT)** | `t4` | `#5ad8ff` | `ch0`→`{'node': 't4', 'offset': [4, 0]}`, `ch2b`→`{'node': 't4', 'offset': [4, 0]}` |
| 16 | `long` | **Long · K69 Xã hội học (Thống kê)** | `d` | `#5eeaa0` | `ch0`→`{'node': 'd', 'offset': [-4, 0]}` |

### 4.2. Toàn văn Chủ đề hỏi (`topics`), Thoại theo chương (`ambient`), Thoại gọi lại (`callbacks`) & Lời kết (`epilogue`) của từng NPC

#### 1. NPC `chief` — Chị Chủ nhiệm HAMIC (Điểm đứng gốc: `t3`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `seventy` — Câu hỏi:** *"Vì sao lại là 70?"* *(Mở sẵn từ đầu)*
  - **Chị Chủ nhiệm HAMIC:** "Trường mình tròn 70 năm. Nhóm chọn con số này vì nó vừa là tuổi trường, vừa có nhiều chuyện để kể bằng toán."
- **Chủ đề `backup` — Câu hỏi:** *"Bản sao lưu"* *(Điều kiện mở: `done:s4`)*
  - **Chị Chủ nhiệm HAMIC:** "Chị luôn giữ một bản sao. Chạy hỏng trên máy thì mở lại được, đó là lý do mình chạy thử trước."
- **Chủ đề `ussh` — Câu hỏi:** *"Các bạn USSH"* *(Điều kiện mở: `done:s9`)*
  - **Chị Chủ nhiệm HAMIC:** "Bên Nhân văn góp ảnh và lời ghi. Mình lo ánh sáng, họ lo câu chuyện. Thiếu bên nào cũng hụt."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Chị đang đợi em ở đây. Không vội đâu."
- **Chương `ch1`:** "Em cứ hỏi Ban Học tập, bạn ấy giải thích dễ hiểu lắm."
- **Chương `ch2a`:** "Tệp ghi chú mà mất thì chữ hiện trống trơn, chị lo nhất chỗ đó."
- **Chương `ch2b`:** "Bên USSH dễ thương lắm, em cứ hỏi thoải mái."
- **Chương `ch3`:** "Mình gần xong rồi. Em kiểm lại Sổ trước khi chốt nhé."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:ha:A``)*: "Hà nhắn chị rồi. Báo sớm thế là tốt, sửa một chỗ đỡ hơn sửa mười chỗ."
- **Callback #2** *(Khi có ``dec:version:C``)*: "Hai bản cùng về đây, chị phải tự mở từng bản. Lần sau ghi rõ giúp chị nhé."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Em đi một vòng mà ai cũng nhắc tên em. Năm sau chị giao em phụ trách người mới đấy."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn em. Lần sau mình rút kinh nghiệm thêm một chút nhé."

---

#### 2. NPC `math` — Thành viên Ban Học tập (Điểm đứng gốc: `lawn`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `limit` — Câu hỏi:** *"Giới hạn là gì?"* *(Mở sẵn từ đầu)*
  - **Thành viên Ban Học tập:** "Là chỗ một đại lượng tiến sát tới mà có thể không bao giờ chạm. Pháo hoa của mình tiến sát 70 m."
- **Chủ đề `newbie` — Câu hỏi:** *"Hồi mới vào"* *(Mở sẵn từ đầu)*
  - **Thành viên Ban Học tập:** "Năm ngoái tớ cũng được chị giao căn pháo hoa. Tớ chỉnh sai ba lần, chị chỉ cười rồi đưa bản sao."
- **Chủ đề `weird` — Câu hỏi:** *"Số kỳ lạ"* *(Điều kiện mở: `chapter:ch3`)*
  - **Thành viên Ban Học tập:** "Cậu biết không, 70 là số kỳ lạ nhỏ nhất. Các ước thực sự cộng lại được 74, nhưng chọn kiểu gì cũng không ra đúng 70."
  - **Thành viên Ban Học tập:** "Cậu đã gom đủ sáu sự thật về 70, đây là sự thật thứ bảy."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Tớ đang căn pháo hoa ở Sân cỏ Nhà T."
- **Chương `ch1`:** "Gặp tớ ở Sân cỏ Nhà T nhé, mô phỏng mở sẵn rồi."
- **Chương `ch2a`:** "Cậu đi tìm tệp ghi chú à? Nhớ xem danh sách đồng bộ."
- **Chương `ch2b`:** "Ảnh bên USSH đẹp lắm, tớ xem trước rồi."
- **Chương `ch3`:** "Tổng duyệt rồi! Hỏi tớ chuyện số 70 đi, có một điều hay lắm."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:firework:B``)*: "Cái hệ số cho pháo bay mãi ấy, tớ vẫn hơi lo. Hàm không hội tụ thì không dừng đâu."
- **Callback #2** *(Khi có ``dec:firework:A``)*: "Pháo dừng đúng 70 m rồi. Nhìn đồ thị tiến sát vạch mà sướng."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Cậu học nhanh thật. Năm sau cậu căn pháo, tớ đứng xem thôi."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn cậu đã ghé Sân cỏ Nhà T. Có gì về giới hạn cứ hỏi tớ."

---

#### 3. NPC `history` — Đại diện sinh viên USSH (Điểm đứng gốc: `e`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `shared` — Câu hỏi:** *"Thời chung mái nhà"* *(Mở sẵn từ đầu)*
  - **Đại diện sinh viên USSH:** "Từ 1956 đến 1995, hai trường là một, cùng tên Đại học Tổng hợp Hà Nội. Ảnh cũ nên có góc sân chung. Chi tiết thì bạn hỏi thêm người của CLB nhé."
- **Chủ đề `donors` — Câu hỏi:** *"Người góp ảnh"* *(Điều kiện mở: `done:s8`)*
  - **Đại diện sinh viên USSH:** "Các anh chị cựu sinh viên gửi ảnh qua nhóm. Ai cũng dặn một câu: giữ lời ghi giúp họ."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Bên mình chuẩn bị ảnh ở Nhà E · điểm dữ liệu."
- **Chương `ch1`:** "Bạn HAMIC sang thì ghé Nhà E · điểm dữ liệu nhé."
- **Chương `ch2a`:** "Mình vẫn đang đợi tệp ghi chú từ Nhà T3 · trạm máy chủ."
- **Chương `ch2b`:** "Linh ghép ảnh cẩn thận lắm, bạn cứ tin."
- **Chương `ch3`:** "Tối nay mình ngồi xem cùng các bạn HAMIC."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:captions:A``)*: "Linh kể bạn giữ nguyên lời ghi. Mình nhắn người góp ảnh rồi, ai cũng vui."
- **Callback #2** *(Khi có ``dec:captions:C``)*: "Ảnh mà không có lời ghi thì người góp ảnh hơi buồn. Nhưng mình hiểu khung chật."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Cảm ơn bạn đã giữ trọn lời ghi. Năm sau hai bên mình lại làm chung nhé."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn bạn HAMIC. Lần sau mình gửi lời ghi sớm hơn."

---

#### 4. NPC `stage` — Điều phối sân khấu USSH (Điểm đứng gốc: `c`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `plan` — Câu hỏi:** *"Lịch sân khấu"* *(Mở sẵn từ đầu)*
  - **Điều phối sân khấu USSH:** "Mình giữ lịch bản 4. Ai sửa gì cũng phải nhắn mình, không thì sân khấu chạy một kiểu, Nhà T3 · trạm máy chủ chạy một kiểu."
- **Chủ đề `view` — Câu hỏi:** *"Nhìn từ phía nào?"* *(Điều kiện mở: `done:s11`)*
  - **Điều phối sân khấu USSH:** "Bản vẽ sân khấu hay vẽ theo mắt người đứng trên sân khấu. Khán giả thì đứng ngược lại, trái thành phải."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Sân khấu USSH ở Nhà C / Sân khấu, khi nào rảnh ghé chơi."
- **Chương `ch1`:** "Mình đang dựng khung sân khấu."
- **Chương `ch2a`:** "Bên mình chờ lịch cảnh từ Nhà T3 · trạm máy chủ."
- **Chương `ch2b`:** "Drone sẵn sàng, chỉ thiếu chương trình."
- **Chương `ch3`:** "Tổng duyệt thì mình đứng cạnh Bảo."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:drones:B``)*: "Mình đánh số drone theo phía sân khấu rồi. Mong là không ai đứng nhìn ngược."
- **Callback #2** *(Khi có ``dec:final:A``)*: "Cả nhóm xác nhận bản 4 rồi. Lần đầu mình thấy lịch khớp hết."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Bạn làm việc với sân khấu dễ chịu lắm. Lần sau mình xin bạn sang phụ."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn bạn. Hẹn gặp lại ở buổi diễn thật."

---

#### 5. NPC `minh` — Minh · nhóm đón khách (Điểm đứng gốc: `gate`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `usb` — Câu hỏi:** *"Hai chiếc USB"* *(Mở sẵn từ đầu)*
  - **Minh · nhóm đón khách:** "Một bạn đưa tớ lúc trưa, một bạn đưa lúc chiều. Tên giống hệt nhau nên tớ cứ tưởng là một."
- **Chủ đề `guests` — Câu hỏi:** *"Đón khách"* *(Điều kiện mở: `done:s4`)*
  - **Minh · nhóm đón khách:** "Tối nay có cả cựu sinh viên về. Tớ tập chào ba kiểu rồi, chưa kiểu nào ổn."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Tớ ở cổng, cần gì cứ gọi."
- **Chương `ch1`:** "Tớ vẫn đứng cổng đón khách, cậu đi tiếp đi."
- **Chương `ch2a`:** "Tớ chuyển ra Lối sau sân cỏ đón đoàn USSH."
- **Chương `ch2b`:** "Đoàn USSH sắp sang, tớ đợi ở Lối sau sân cỏ."
- **Chương `ch3`:** "Tớ đứng Lối sau sân cỏ dẫn khách vào chỗ ngồi."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:version:A``)*: "Mã băm đúng là cứu tinh. Tớ ghi vào sổ tay rồi, lần sau so mã trước."
- **Callback #2** *(Khi có ``dec:version:B``)*: "Giờ sửa muộn hơn mà lại là bản cũ. Tớ vẫn chưa hiểu sao lại thế."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Tớ sẽ nhớ chuyện mã băm cả đời. Cảm ơn cậu nhiều."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn cậu đã ghé cổng. Tớ đi đón khách tiếp đây."

---

#### 6. NPC `ha` — Hà · nhóm kỹ thuật (Điểm đứng gốc: `lawn`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `oldlamp` — Câu hỏi:** *"Bản đèn cũ"* *(Mở sẵn từ đầu)*
  - **Hà · nhóm kỹ thuật:** "Mình lưu bản cũ để so, rồi quên đổi tên. Ai ngờ nó lại đi theo USB của người khác."
- **Chủ đề `afraid` — Câu hỏi:** *"Ngại báo lỗi"* *(Điều kiện mở: `done:s2`)*
  - **Hà · nhóm kỹ thuật:** "Mình sợ bị nghĩ là làm ẩu. Nhưng nghĩ lại, chị chưa bao giờ trách ai vì báo lỗi."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Mình đang dò dải đèn ở Sân cỏ Nhà T."
- **Chương `ch1`:** "Cậu cần gì về dải đèn cứ hỏi mình."
- **Chương `ch2a`:** "Mình vẫn ở Sân cỏ Nhà T, kiểm thêm lần nữa."
- **Chương `ch2b`:** "Mình nghe nói bên USSH đẹp lắm."
- **Chương `ch3`:** "Mình lên Nhà T3 · trạm máy chủ rồi, đứng xem tổng duyệt."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:ha:A``)*: "Báo xong nhẹ cả người. Chị còn cảm ơn mình nữa."
- **Callback #2** *(Khi có ``dec:ha:B``)*: "Máy mình sửa rồi. Mà các máy khác thì sao nhỉ..."
- **Callback #3** *(Khi có ``dec:ha:C``)*: "Mình vẫn chưa nói với ai. Chắc không sao đâu nhỉ?"

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Nhờ cậu mà mình dám nói. Lần sau mình báo luôn, không chờ ai hỏi."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn cậu đã đếm đèn cùng mình."

---

#### 7. NPC `nam` — Nam · người chuyển tư liệu (Điểm đứng gốc: `canteen`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `locker` — Câu hỏi:** *"Tủ tư liệu"* *(Mở sẵn từ đầu)*
  - **Nam · người chuyển tư liệu:** "Tủ này của nhóm từ mấy khóa trước. Mã số ai đặt thì tôi chịu, chỉ biết ba ổ khóa."
- **Chủ đề `food` — Câu hỏi:** *"Lối qua Căng tin có gì ngon?"* *(Mở sẵn từ đầu)*
  - **Nam · người chuyển tư liệu:** "Bánh mì trứng gần cửa. Ăn xong rồi hẵng tính ổ khóa."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Tôi ngồi Lối qua Căng tin canh tủ."
- **Chương `ch1`:** "Tôi vẫn ở Lối qua Căng tin."
- **Chương `ch2a`:** "Ông cần mở tủ hả? Lại đây."
- **Chương `ch2b`:** "Tệp ghi chú ông mang đi rồi, tôi ăn nốt cái bánh."
- **Chương `ch3`:** "Tối tôi qua xem, nhớ giữ chỗ."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:notes:A``)*: "Vy nhắn cả nhóm đồng bộ lại. Tôi bấm rồi nhé, nhanh lắm."
- **Callback #2** *(Khi có ``dec:notes:B``)*: "Vy bảo chỉ sửa trên máy Vy. Máy Nhà T3 · trạm máy chủ có nhận không thì tôi không biết."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Ông nhanh hơn tôi nghĩ. Lần sau tôi mời ông bánh mì."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn ông. Tủ tôi khóa lại rồi."

---

#### 8. NPC `linh` — Linh · nhóm tư liệu (Điểm đứng gốc: `e`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `why` — Câu hỏi:** *"Vì sao giữ lời ghi?"* *(Mở sẵn từ đầu)*
  - **Linh · nhóm tư liệu:** "Mỗi lời ghi là một người. Sửa câu chữ là sửa luôn ký ức của họ."
- **Chủ đề `quantity` — Câu hỏi:** *"Nhỏ mà thành lớn"* *(Điều kiện mở: `done:s9`)*
  - **Linh · nhóm tư liệu:** "Môn triết năm nhất có bài lượng và chất. Mình hay nghĩ tới nó khi thấy mấy lỗi nhỏ cộng lại thành chuyện lớn."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Mình ở Nhà E · điểm dữ liệu với bộ ảnh."
- **Chương `ch1`:** "Mình chờ tệp ghi chú ở Nhà E · điểm dữ liệu."
- **Chương `ch2a`:** "Nghe nói tệp ghi chú ở Lối qua Căng tin à?"
- **Chương `ch2b`:** "Mình ghép ảnh ở Nhà E · điểm dữ liệu, cậu ghé nhé."
- **Chương `ch3`:** "Mình ra Sân USSH xem tổng duyệt."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:captions:A``)*: "Lời ghi vẫn nguyên chữ. Mình đọc lại mà muốn khóc."
- **Callback #2** *(Khi có ``dec:captions:B``)*: "Lời ghi ngắn hơn rồi. Đọc lên vẫn được, nhưng thiếu thiếu."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Cảm ơn cậu đã đứng về phía lời ghi. Mình sẽ kể với người góp ảnh."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn cậu đã ghé Nhà E · điểm dữ liệu."

---

#### 9. NPC `an` — An · sinh viên ghé xem (Điểm đứng gốc: `court`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `seat` — Câu hỏi:** *"Nhìn từ ghế khán giả"* *(Mở sẵn từ đầu)*
  - **An · sinh viên ghé xem:** "Mình không biết toán nhiều. Mình chỉ biết chỗ nào đẹp, chỗ nào khó đọc."
- **Chủ đề `major` — Câu hỏi:** *"Bạn học gì?"* *(Mở sẵn từ đầu)*
  - **An · sinh viên ghé xem:** "Mình học Văn bên USSH. Ghé xem vì bạn cùng phòng làm sân khấu."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Mình chỉ đi ngang thôi."
- **Chương `ch1`:** "Bên Sân cỏ Nhà T sáng ghê."
- **Chương `ch2a`:** "Mình nghe nói có tủ khóa số, hay thế."
- **Chương `ch2b`:** "Mình ngồi Sân USSH xem thử phần chữ."
- **Chương `ch3`:** "Mình ra Sân cỏ Nhà T ngồi xem tổng duyệt."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``done:s10``)*: "Giờ chữ hiện chậm hơn, mình đọc hết rồi. Thích ghê."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Cảm ơn bạn đã hỏi ý mình. Mình thấy như được làm cùng."
- **Bản tiêu chuẩn (`plain`):** "Chúc buổi diễn suôn sẻ nhé."

---

#### 10. NPC `bao` — Bảo · trực sân khấu (Điểm đứng gốc: `c`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `choose` — Câu hỏi:** *"Chọn bốn trong tám"* *(Mở sẵn từ đầu)*
  - **Bảo · trực sân khấu:** "Anh đếm tay ra bảy mươi mà không tin, phải nhờ người kiểm lại."
- **Chủ đề `v3` — Câu hỏi:** *"Lịch bản 3"* *(Điều kiện mở: `done:s12`)*
  - **Bảo · trực sân khấu:** "Anh tưởng anh Đức chốt rồi. Anh Đức lại tưởng anh chốt. Thế đấy."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Anh ở Nhà C / Sân khấu trực sân khấu."
- **Chương `ch1`:** "Bên sân khấu chưa cần gì đâu em."
- **Chương `ch2a`:** "Anh chờ lịch cảnh."
- **Chương `ch2b`:** "Em ghé Nhà C / Sân khấu nhé, anh có việc nhờ."
- **Chương `ch3`:** "Anh đứng cạnh điều phối, có gì gọi anh."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:final:A``)*: "Cả nhóm xác nhận bản 4. Lần sau anh nhắn hỏi trước, không đoán nữa."
- **Callback #2** *(Khi có ``dec:final:C``)*: "Em hỏi riêng anh thôi à? Anh bảo bản 4, mà không biết điều phối biết chưa."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Em làm anh nhớ ra cách làm việc nhóm. Cảm ơn em."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn em nhé. Hẹn tối nay."

---

#### 11. NPC `vy` — Vy · nhóm kiểm tra (Điểm đứng gốc: `cross`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `list` — Câu hỏi:** *"Danh sách đồng bộ"* *(Mở sẵn từ đầu)*
  - **Vy · nhóm kiểm tra:** "Mẫu đó có từ năm ngoái. Ai đặt luật bỏ dấu gạch dưới thì mình không rõ, chắc để né tệp tạm."
- **Chủ đề `twice` — Câu hỏi:** *"Kiểm tra hai lần"* *(Điều kiện mở: `done:s6`)*
  - **Vy · nhóm kiểm tra:** "Mình luôn chạy thử trước khi gửi. Lần này mình quên đúng một lần."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Mình ở Lối sang USSH."
- **Chương `ch1`:** "Mình đang kiểm danh sách đồng bộ."
- **Chương `ch2a`:** "Có việc về đồng bộ thì gặp mình."
- **Chương `ch2b`:** "Tệp sang Nhà E · điểm dữ liệu rồi chứ?"
- **Chương `ch3`:** "Mình đứng xem log trong lúc tổng duyệt."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:notes:A``)*: "Mẫu chung sửa rồi. Mình thêm một dòng ghi chú để năm sau ai cũng hiểu."
- **Callback #2** *(Khi có ``dec:notes:C``)*: "Chép tay thì mình không chắc đủ. Mình sẽ đối chiếu lại sau buổi diễn."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Cậu cẩn thận như mình. Lần sau mình rủ cậu soát mẫu cùng."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn cậu. Mình ghi chú lại lần này."

---

#### 12. NPC `duc` — Đức · phụ trách tổng duyệt (Điểm đứng gốc: `t3`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `rehearse` — Câu hỏi:** *"Tổng duyệt"* *(Mở sẵn từ đầu)*
  - **Đức · phụ trách tổng duyệt:** "Anh phụ trách tổng duyệt năm thứ hai rồi. Năm nào cũng có một bất ngờ."
- **Chủ đề `final` — Câu hỏi:** *"Bản chốt"* *(Điều kiện mở: `done:s13`)*
  - **Đức · phụ trách tổng duyệt:** "Bản chốt là bản mà cả nhóm cùng nói là chốt. Anh vừa mới hiểu ra điều đó."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Anh ở Nhà T3 · trạm máy chủ, đang soạn lịch."
- **Chương `ch1`:** "Anh bận soạn lịch, có gì em cứ đi tiếp."
- **Chương `ch2a`:** "Anh vẫn đang đợi lịch bên sân khấu."
- **Chương `ch2b`:** "Anh nghe nói drone sắp xong."
- **Chương `ch3`:** "Mình tổng duyệt thôi em."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:final:B``)*: "Bản 3 chắc ổn mà. Anh đã chạy thử bản đó một lần rồi."
- **Callback #2** *(Khi có ``dec:final:A``)*: "May em nhắn cả nhóm. Anh suýt chạy bản 3."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Em giúp anh nhiều hơn em nghĩ. Năm sau tổng duyệt em đứng cạnh anh nhé."
- **Bản tiêu chuẩn (`plain`):** "Cảm ơn em. Lần sau anh soát lịch kỹ hơn."

---

#### 13. NPC `thao` — Thảo · K70 Toán Tin (XSTK) (Điểm đứng gốc: `t1`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `sample` — Câu hỏi:** *"Không gian mẫu và chọn mẫu không hoàn lại"* *(Mở sẵn từ đầu)*
  - **Thảo · K70 Toán Tin (XSTK):** "Khi kiểm định một lô bóng đèn, tụi mình lấy ngẫu nhiên $k$ bóng từ $n$ bóng mà không trả lại. Thứ tự lấy không quan trọng nên cỡ mẫu là tổ hợp $C_n^k$, còn nếu phân công từng bóng vào từng kênh ưu tiên khác nhau thì mới dùng chỉnh hợp $A_n^k$."
- **Chủ đề `bayes` — Câu hỏi:** *"Công thức xác suất đầy đủ và Bayes"* *(Điều kiện mở: `done:s2`)*
  - **Thảo · K70 Toán Tin (XSTK):** "Đèn gửi từ ba xưởng về kho chung nên lúc phát hiện một bóng bị lệch pha, tụi mình dùng công thức Bayes để tính xác suất hậu nghiệm xem bóng đó thuộc lô nào cao nhất rồi mới khoanh vùng kiểm tra."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Tớ đang lập bảng kiểm định xác suất cổ điển cho từng thùng cảm biến mới chở tới Sảnh Nhà T1, HUS."
- **Chương `ch1`:** "Mấy bài chọn mẫu không hoàn lại ở Sảnh Nhà T1, HUS nhìn vậy mà giúp tiết kiệm bao nhiêu công tháo lắp bóng đèn."
- **Chương `ch2a`:** "Nếu ghép xác suất chuyển trạng thái với số bước đi trên lưới tọa độ, mình tính ngay được số quỹ đạo truyền tin không vướng điểm nhiễu."
- **Chương `ch2b`:** "Chiều muộn rồi, tớ đang chạy nốt vòng lặp lọc các kết cục chẵn trên không gian mẫu để đối chiếu với bảng của Bảo."
- **Chương `ch3`:** "Tối nay đèn bật đồng loạt, xác suất cả bảy mạch cùng thông suốt đã tiến sát 1 rồi."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:ha:A``)*: "Nhờ cậu giữ chuẩn 7 đèn cho cụm của Hà mà cỡ mẫu kiểm định của tớ ở sảnh T1 khớp y hệt thiết kế ban đầu."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Cuốn sổ kiểm định xác suất của Thảo kín đặc những ghi chú cậu và cô ấy cùng bấm máy ở sảnh T1."
- **Bản tiêu chuẩn (`plain`):** "Thảo thu dọn bàn kiểm định ở sảnh T1, cẩn thận đánh dấu từng lô đèn đạt chuẩn."

---

#### 14. NPC `kien` — Kiên · K69 Khoa học dữ liệu (XSTK) (Điểm đứng gốc: `t5`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `cdf` — Câu hỏi:** *"Hàm phân phối tích lũy mũ F(t)"* *(Mở sẵn từ đầu)*
  - **Kiên · K69 Khoa học dữ liệu (XSTK):** "Thời gian đáp ứng của mạch ổn áp tuân theo phân phối mũ với hàm phân phối tích lũy $F(t) = 1 - e^{-bt}$. Khi nhân với độ cao trần $a$, đường cong độ cao $h(t) = a(1 - e^{-bt})$ có phần đuôi $a e^{-bt}$ giảm nhanh về 0."
- **Chủ đề `poisson` — Câu hỏi:** *"Chuỗi hình học và xấp xỉ Poisson"* *(Điều kiện mở: `done:s1`)*
  - **Kiên · K69 Khoa học dữ liệu (XSTK):** "Mỗi xung truyền thử độc lập có xác suất rơi vào phần dư là $q$. Cộng tích lũy $N$ bước đầu chính là tổng riêng chuỗi hình học, chỉ cần phần đuôi $q^N$ nhỏ hơn ngưỡng $1 - p$ là tín hiệu hội tụ đủ độ tin cậy."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Ở Nhà T5, HUS tụi tớ đang mô phỏng hàm phân phối tích lũy và giới hạn tiệm cận cho các cụm pháo sáng."
- **Chương `ch1`:** "Cậu để ý phần đuôi $e^{-bt}$ nhé, tốc độ $b$ nhích lên một chút là sai số sau vài giây giảm đi rất nhanh."
- **Chương `ch2a`:** "Có những hàm mật độ nhìn qua tưởng bị đứt tại một điểm, nhưng khử dạng vô định $0/0$ xong là đường cong lại liền mạch."
- **Chương `ch2b`:** "Khi cỡ mẫu $x$ tiến ra vô cùng, mấy thành phần nhiễu dạng $1/x$ hay $\sin(x)/x$ đều tắt dần về 0 hết."
- **Chương `ch3`:** "Đường cong thực nghiệm trên màn hình Nhà T5, HUS đã bám sát đường tiệm cận lý thuyết rồi."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:firework:A``)*: "Tham số tốc độ hội tụ $b = 1{,}65$ cậu chốt với Hải làm đồ thị phân phối ở phòng máy T5 đẹp như sách giáo trình."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Kiên in tặng cậu tờ đồ thị hội tụ có chữ ký của cả nhóm mô phỏng dữ liệu nhà T5."
- **Bản tiêu chuẩn (`plain`):** "Kiên lưu lại bộ tham số phân phối mũ vào máy chủ nhà T5 trước khi ra sân xem pháo."

---

#### 15. NPC `quynh` — Quỳnh · K70 Toán học (ĐSTT) (Điểm đứng gốc: `t4`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `basis` — Câu hỏi:** *"Phép biến đổi tuyến tính và ma trận chính tắc"* *(Mở sẵn từ đầu)*
  - **Quỳnh · K70 Toán học (ĐSTT):** "Mỗi tấm gương hay bộ xoay pha trong $\mathbb{R}^2$ đều tương ứng với một ma trận chính tắc $A$ cấp $2\times 2$. Muốn biết tia sáng đi đâu, mình chỉ cần xem ảnh của hai vectơ cơ sở qua phép biến đổi $x \mapsto Ax$."
- **Chủ đề `orthogonal` — Câu hỏi:** *"Ma trận trực giao và định thức cấp 2"* *(Điều kiện mở: `done:s3`)*
  - **Quỳnh · K70 Toán học (ĐSTT):** "Phép quay bảo toàn độ dài và góc nên ma trận của nó trực giao, có định thức bằng 1 và $R^T R = I$. Nhiều bạn hay quên rằng nhân ma trận cấp 2 với hằng số $k$ sẽ làm định thức nhân lên $k^2$ chứ không phải $k$."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Tớ đang căn lại hệ trục tọa độ $\mathbb{R}^2$ cho mấy giá gương đặt quanh Nhà T4, HUS."
- **Chương `ch1`:** "Nhân hai ma trận biến đổi hình học mà đảo thứ tự là tia sáng bắn sang hướng khác liền vì $AB \ne BA$."
- **Chương `ch2a`:** "Bên Nhà T4, HUS tụi tớ vừa lập xong bảng tra nhanh ma trận đối xứng trục và ma trận quay góc vuông."
- **Chương `ch2b`:** "Đội hình drone thực chất là một tập điểm chịu phép biến đổi tuyến tính, lệch chuyển vị một cái là chữ bị lật gương ngay."
- **Chương `ch3`:** "Toàn bộ các phép biến đổi ma trận từ T4 sang sân trung tâm đã khóa đúng cơ sở trực chuẩn."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``done:s11b``)*: "May mà cậu cùng tớ kiểm tra kỹ phép chuyển vị $R^T$ ở Nhà T4, HUS, nên bảng thông số gửi sang sân khấu rõ ràng hẳn."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Quỳnh vẫy tay gọi cậu từ hàng ghế đầu bên sảnh T4, chỉ lên những tia sáng giao nhau đúng tâm điểm trên bầu trời."
- **Bản tiêu chuẩn (`plain`):** "Quỳnh cất tập nháp Đại số tuyến tính vào cặp, ngước nhìn chùm sáng hội tụ trên bãi cỏ."

---

#### 16. NPC `long` — Long · K69 Xã hội học (Thống kê) (Điểm đứng gốc: `d`)

**A. Các chủ đề người chơi có thể hỏi trực tiếp (`topics`):**
- **Chủ đề `survey` — Câu hỏi:** *"Khảo sát mẫu liên trường và chu kỳ đồng dư"* *(Mở sẵn từ đầu)*
  - **Long · K69 Xã hội học (Thống kê):** "Nhóm Xã hội học tụi tớ đặt các trạm đếm lưu lượng người xem ở cả bên Nhân văn lẫn Tự nhiên. Mỗi trạm gửi báo cáo theo một chu kỳ nguyên tố cùng nhau, nên dùng Định lý Thặng dư Trung Hoa là tìm ra ngay thời điểm đồng bộ."
- **Chủ đề `corridor` — Câu hỏi:** *"Cây khung nhỏ nhất nối hai khuôn viên"* *(Điều kiện mở: `done:s7`)*
  - **Long · K69 Xã hội học (Thống kê):** "Khi kéo cáp tín hiệu qua cổng nối hai trường, bài toán thực chất là tìm cây khung nhỏ nhất hoặc đường đi ngắn nhất trên đồ thị có trọng số để độ trễ truyền mẫu thấp nhất."

**B. Lời thoại bối cảnh khi gặp ở từng chương (`ambient`):**
- **Chương `ch0`:** "Tớ đang tổng hợp phiếu khảo sát lưu lượng sinh viên đi lại quanh Sân Nhà D, USSH."
- **Chương `ch1`:** "Từ Sân Nhà D, USSH đi vòng qua Nhà B, Nhà C rồi sang cổng nối bên Tự nhiên bây giờ thông suốt hết cả khu rồi."
- **Chương `ch2a`:** "Đồng bộ chu kỳ lấy mẫu bằng đồng dư giúp hai đầu cầu USSH và HUS khớp nhịp mà không cần đường truyền riêng."
- **Chương `ch2b`:** "Tụi tớ vừa đo lại trọng số các tuyến cáp quanh sân Nhân văn để chọn lộ trình ít suy hao nhất."
- **Chương `ch3`:** "Dòng người từ hai trường đang đổ về sân trung tâm đúng như phân phối mẫu tụi tớ dự báo chiều nay."

**C. Lời thoại nhắc lại quyết định của người chơi (`callbacks`):**
- **Callback #1** *(Khi có ``dec:captions:A``)*: "Bộ chú thích ảnh cậu đối chiếu cùng Linh giúp phiếu khảo sát lịch sử giao lưu ở sân Nhà D chuẩn xác từng mốc năm."

**D. Lời kết ở cuối game (`epilogue`):**
- **Bản gắn kết cao (`warm`):** "Long gửi cho cậu bản đồ nhiệt lưu lượng đêm hội, kèm lời hẹn hôm nào sang cà phê quanh sân Nhà D."
- **Bản tiêu chuẩn (`plain`):** "Long đứng ở góc sân trung tâm, mỉm cười nhìn dòng sinh viên hai trường hòa vào nhau dưới ánh đèn."

---

## PHẦN V. NỘI DUNG HỌC THUẬT: 7 MẠCH ÁNH SÁNG (23 MÀN), 4 NHIỆM VỤ PHỤ, CHẾ ĐỘ DẠO CHƠI & 266 MÀN TỰ ĐỘNG

### 5.1. Phương pháp Tư duy Toán học hiển thị trong màn chơi (`thinking.*`)

| Khóa giao diện | Nội dung hướng dẫn tư duy hiển thị cho người chơi |
| :--- | :--- |
| `thinking.activity.captions` | Bấm chọn một bức ảnh bên trái trước, sau đó đọc kỹ mốc năm và địa điểm trong lời ghi bên phải để ghép đúng cặp. |
| `thinking.activity.causes` | Chỉ chọn những nguyên nhân có số liệu và bằng chứng thực tế trong sổ tay; bỏ qua các tin đồn hoặc suy đoán cảm tính. |
| `thinking.activity.sync` | Đọc kỹ quy tắc đồng bộ: bật tất cả các thư mục dữ liệu chính thức cần cho đêm hội và tắt các thư mục nháp, bản sao lưu cũ hoặc tệp tạm. |
| `thinking.activity.timing` | Kéo thanh Độ trễ sao cho chữ bắt đầu hiện sau khi hiệu ứng đã lên sáng ổn định, và kéo Thời lượng giữ sao cho người xem đọc kịp hết số từ trước khi hiệu ứng tắt. |
| `thinking.activity.topo` | Tìm bước công việc không phụ thuộc vào bước nào (hoặc mọi bước đứng trước nó đã được chọn) để bấm xếp vào hàng trước. |
| `thinking.activity.versions` | So sánh từng dòng từ trên xuống dưới giữa hai tệp: dòng nào có con số hoặc ký hiệu khác với bản bên trái thì bấm chọn dòng đó. |
| `thinking.beam-order` | Phương pháp biến đổi tuyến tính: Gương đặt ở ô 1 tác động lên tia sáng trước, rồi kết quả mới đi qua gương ở ô 2 (vì tích ma trận $AB \ne BA$). Hãy nhìn hướng tia vào, thử đặt gương đầu tiên rồi bấm Chạy thử để quan sát tia trung gian. |
| `thinking.block-vm` | Phương pháp lập trình từng bước: (1) Khởi tạo biến kết quả bằng 0 trước vòng lặp. (2) Đặt vòng lặp chạy đúng từ cận đầu tới cận cuối. (3) Bên trong vòng lặp, cộng dồn biểu thức hoặc kiểm tra điều kiện chẵn lẻ. |
| `thinking.count` | Phương pháp đếm: Chọn tập con không phân biệt thứ tự dùng tổ hợp $C_n^k$; xếp hàng có thứ tự dùng chỉnh hợp $A_n^k$; còn đếm đường trên lưới thì số đường tới mỗi nút bằng tổng số đường từ nút ngay bên trái và nút ngay bên dưới cộng lại. |
| `thinking.finale` | Quan sát gợi ý đầu tiên bên dưới và điều chỉnh thông số cho khớp với giá trị mục tiêu của mạch. |
| `thinking.graph` | Phương pháp đồ thị: Với Đường ngắn nhất, ưu tiên đi qua các cạnh có trọng số nhỏ nối từ đỉnh đầu tới đỉnh đích. Với Cây khung nhỏ nhất, chọn lần lượt các cạnh nhẹ nhất mà không tạo vòng khép kín. Với Euler, đếm số cạnh nối vào mỗi đỉnh để tìm các đỉnh bậc lẻ. |
| `thinking.modular` | Phương pháp đồng dư: Với hệ CRT, liệt kê các số chia cho mô-đun lớn nhất dư đúng số dư của nó, rồi thử chia cho hai mô-đun còn lại. Với thứ trong tuần, lấy số ngày chia 7 lấy phần dư. Với chữ số tận cùng, nhân nhẩm chu kỳ lặp tối đa 4 bước của chữ số hàng đơn vị. |
| `thinking.pick-limit` | Phương pháp xét dáng điệu khi $x \to \infty$: Các số hạng dạng $1/x$, $e^{-x}$, $\sin(x)/x$ đều tiến về 0; phân thức bậc tử bằng bậc mẫu thì tiến về tỉ số hệ số bậc cao nhất; còn hàm $a x$ (tăng mãi) hay $\sin x$ (dao động) thì loại ngay. |
| `thinking.plot-limit` | Phương pháp 2 bước: (1) Kéo thanh Độ cao đích $a$ đúng bằng vạch mục tiêu vì $\lim_{t\to\infty} h(t) = a$. (2) Tăng dần tốc độ $b$ cho đến khi phần đuôi $a e^{-bT}$ tại mốc thời gian $T$ nhỏ hơn hoặc bằng sai số cho phép. |
| `thinking.removable` | Phương pháp khử dạng vô định $0/0$: Thay $x = c$ làm mẫu bằng 0, nên tử số chắc chắn chứa nhân tử $(x - c)$. Hãy phân tích tử số thành $(x - c)(x + d)$, rút gọn $(x - c)$ rồi thay $x = c$ vào $(x + d)$ để được giá trị liên tục. |
| `thinking.series` | Phương pháp cộng tích lũy: Mỗi bước đóng góp thêm $q^n$, làm phần còn thiếu giảm theo lũy thừa $q^N$. Bạn chỉ cần tăng số bước $N$ lên từng đơn vị cho tới khi vạch phần trăm chạm hoặc vượt ngưỡng yêu cầu. |
| `thinking.transpose-bug` | Phương pháp ma trận trực giao & định thức: (1) Ma trận chuyển vị $R^T$ quay ngược chiều với $R$, nên giữ nguyên hoành độ $x$ và đổi dấu tung độ $y$. (2) Nhân ma trận cấp 2 với $k$ làm định thức tăng $k^2$ lần ($\det(kR) = k^2$), nên không thể sửa lỗi ngược chiều. |

### 5.2. Toàn văn 7 Mạch Ánh Sáng, 23 Màn chơi chính & 3 Bước Màn Kết (`levels/circuits.json`)

#### Mạch 1: Hội tụ — *Giải tích: giới hạn, chuỗi, liên tục*
- **Độ ưu tiên:** `Must` | **Màu nhận diện:** `#ffd23f` | **Danh sách màn:** `1.1, 1.2, 1.3, 1.4`

##### Màn `1.1`: Pháo hoa dừng ở 70 m (Mô-đun: `plot-limit`)
- **Đề bài (`prompt`):** Pháo hoa phải dừng ở 70 m. Độ cao là h(t) = a·(1 − e^(−bt)); kéo thanh trượt chọn a và b.
- **Dữ liệu đầu vào (`data`):** `{"T": 3, "eps": 0.5, "target": 70, "a_range": [0, 100], "a_step": 1, "b_range": [0.1, 3], "b_step": 0.05}`
- **Đáp án chuẩn (`answer`):** `{"a": 70, "b_min": 1.65}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Pháo dừng ở 70 m* | 2★: *Sau 3 s cách 70 m không quá 0,5 m* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Khi t rất lớn, e^(−bt) tiến về 0. Vậy h(t) tiến tới giá trị nào?
  - *Gợi ý 2:* Giới hạn của h(t) khi t → ∞ là a, nên đặt a = 70. Sai số sau 3 s là 70·e^(−3b).
  - *Gợi ý 3:* Cần 70·e^(−3b) ≤ 0,5, tức b ≥ ln140/3 ≈ 1,647. Bước chỉnh là 0,05 nên chọn b = 1,65.

##### Màn `1.2`: Dải đèn bật dần (Mô-đun: `series`)
- **Đề bài (`prompt`):** Đèn thứ n có độ sáng (1/2)ⁿ. Bật ít nhất mấy đèn đầu tiên để tổng độ sáng đạt 0,99?
- **Dữ liệu đầu vào (`data`):** `{"q": "1/2", "percent": 99}`
- **Đáp án chuẩn (`answer`):** `{"N": 7}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Tổng độ sáng đạt 0,99* | 2★: *Dùng đúng số đèn ít nhất* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Mỗi đèn sáng bằng một nửa đèn trước. Tổng của N đèn đầu là 1 − 2^(−N).
  - *Gợi ý 2:* Cần 1 − 2^(−N) ≥ 0,99, tức 2^(−N) ≤ 0,01.
  - *Gợi ý 3:* 2^(−6) ≈ 0,0156 chưa đủ; 2^(−7) ≈ 0,0078 đủ. Bật 7 đèn: tổng 0,9922.

##### Màn `1.3`: Lấp điểm tối (Mô-đun: `removable`)
- **Đề bài (`prompt`):** f(x) = (x² − 49)/(x − 7) có điểm tối tại x = 7. Chọn giá trị f(7) để đường sáng liền mạch.
- **Dữ liệu đầu vào (`data`):** `{"c": 7, "numerator": [1, 0, -49]}`
- **Đáp án chuẩn (`answer`):** `{"value": 14}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đường sáng liền mạch* | 2★: *Giá trị đúng tuyệt đối* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Tại x = 7 mẫu số bằng 0. Thử phân tích tử số thành tích.
  - *Gợi ý 2:* x² − 49 = (x − 7)(x + 7).
  - *Gợi ý 3:* Với x ≠ 7, f(x) = x + 7, nên giới hạn khi x → 7 bằng 14. Chọn f(7) = 14.

##### Màn `1.4`: Chọn hàm tiệm cận (Mô-đun: `pick-limit`)
- **Đề bài (`prompt`):** Chọn tất cả hàm có giới hạn bằng 70 khi x → ∞.
- **Dữ liệu đầu vào (`data`):** `{"target": 70, "options": [{"label": "A", "f": "70x/(x + 1)", "limit": 70}, {"label": "B", "f": "70(1 − e^(−x))", "limit": 70}, {"label": "C", "f": "70x", "limit": "inf"}, {"label": "D", "f": "70·sin x", "limit": "dne"}, {"label": "E", "f": "70 + 1/x", "limit": 70}]}`
- **Đáp án chuẩn (`answer`):** `{"correct": ["A", "B", "E"]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Chọn đúng cả tập hàm* | 2★: *Không thừa không thiếu* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Có ba kiểu: tiến tới một số, tiến tới vô cực, hoặc dao động mãi không dừng.
  - *Gợi ý 2:* 70x tăng mãi; 70·sin x dao động giữa −70 và 70 nên không có giới hạn.
  - *Gợi ý 3:* Đáp án: A, B, E.

---

#### Mạch 2: Gương — *Đại số tuyến tính: ma trận biến đổi*
- **Độ ưu tiên:** `Must` | **Màu nhận diện:** `#55e0ff` | **Danh sách màn:** `2.1, 2.2, 2.3, 2.4`

##### Màn `2.1`: Gương đầu tiên (Mô-đun: `beam-order`)
- **Đề bài (`prompt`):** Đưa tia (1, 0) tới hướng (0, 1). Đặt 1 gương.
- **Dữ liệu đầu vào (`data`):** `{"vector": [1, 0], "target": [0, 1], "mirrors": ["R90", "FX"], "slots": 1}`
- **Đáp án chuẩn (`answer`):** `{"orders": [["R90"]]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Tia tới đúng hướng* | 2★: *Dùng đúng gương* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Mỗi gương là một ma trận 2×2 nhân với vectơ tia.
  - *Gợi ý 2:* Muốn (1, 0) thành (0, 1) là quay ngược chiều kim đồng hồ 90°.
  - *Gợi ý 3:* Dùng R: R·(1, 0) = (0, 1).

##### Màn `2.2`: Đổi chỗ hai tọa độ (Mô-đun: `beam-order`)
- **Đề bài (`prompt`):** Đưa tia (2, 1) tới hướng (1, 2). Đặt 1 gương.
- **Dữ liệu đầu vào (`data`):** `{"vector": [2, 1], "target": [1, 2], "mirrors": ["R90", "FD", "FX"], "slots": 1}`
- **Đáp án chuẩn (`answer`):** `{"orders": [["FD"]]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Tia tới đúng hướng* | 2★: *Dùng đúng gương* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* So sánh (2, 1) và (1, 2): hai tọa độ đổi chỗ cho nhau.
  - *Gợi ý 2:* Phép đối xứng qua đường y = x đổi chỗ x và y.
  - *Gợi ý 3:* Dùng S: S·(2, 1) = (1, 2).

##### Màn `2.3`: Thứ tự quan trọng (Mô-đun: `beam-order`)
- **Đề bài (`prompt`):** Đặt hai gương theo đúng thứ tự để đưa tia (1, 0) tới (0, −1).
- **Dữ liệu đầu vào (`data`):** `{"vector": [1, 0], "target": [0, -1], "mirrors": ["R90", "FX"], "slots": 2}`
- **Đáp án chuẩn (`answer`):** `{"orders": [["R90", "FX"]]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Tia tới đúng hướng* | 2★: *Đúng thứ tự gương* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Gương đặt trước tác dụng trước. Phép nhân ma trận không giao hoán.
  - *Gợi ý 2:* Thử cả hai thứ tự và xem tia ra ở đâu.
  - *Gợi ý 3:* R rồi F: R(1, 0) = (0, 1), F(0, 1) = (0, −1). Đảo thứ tự cho (0, 1).

##### Màn `2.4`: Tia chúc xuống đất (Mô-đun: `transpose-bug`)
- **Đề bài (`prompt`):** Tia (1, 0) cần xoay 60° để đi lên. Hệ thống lỡ dùng Rᵀ thay cho R. Tia đi đâu, và nhân cả ma trận lên 70 lần có sửa được không?
- **Dữ liệu đầu vào (`data`):** `{"angle": 60, "d": [1, 0], "scale": 70}`
- **Đáp án chuẩn (`answer`):** `{"up": ["1/2", "√3/2"], "down": ["1/2", "−√3/2"], "detScaled": 4900, "scalingFixes": false}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Tìm ra lỗi và cách sửa* | 2★: *Tính đúng định thức* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Với ma trận xoay, Rᵀ chính là R⁻¹: áp nhầm Rᵀ là xoay ngược chiều.
  - *Gợi ý 2:* R·(1, 0) = (1/2, √3/2) đi lên; Rᵀ·(1, 0) = (1/2, −√3/2) đi xuống.
  - *Gợi ý 3:* det R = 1; nhân cả ma trận 2×2 lên 70 lần cho det = 70² = 4900, không còn là phép xoay.

---

#### Mạch 3: Dàn drone — *Nhập môn lập trình: khối lệnh*
- **Độ ưu tiên:** `Must` | **Màu nhận diện:** `#7cff6b` | **Danh sách màn:** `3.1, 3.2, 3.3, 3.4, 3.5`

##### Màn `3.1`: Bảy đèn thẳng hàng (Mô-đun: `block-vm`)
- **Đề bài (`prompt`):** Ghép khối lệnh để drone xếp 7 đèn thẳng hàng.
- **Dữ liệu đầu vào (`data`):** `{"kind": "lights", "grid": [10, 7], "pattern": [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0]], "palette": ["repeat", "place", "move"]}`
- **Đáp án chuẩn (`answer`):** `{"solution": [{"t": "repeat", "n": 7, "body": [{"t": "place"}, {"t": "move", "dir": "right"}]}]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đủ 7 đèn* | 2★: *Không thừa đèn* | 3★: *Dùng tối đa 3 khối*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Một đèn cần hai việc: đặt đèn rồi di chuyển sang bên.
  - *Gợi ý 2:* Thay vì ghép 14 khối, dùng khối Lặp.
  - *Gợi ý 3:* Lặp 7 lần { Đặt đèn; Sang phải }.

##### Màn `3.2`: Dàn 70 drone (Mô-đun: `block-vm`)
- **Đề bài (`prompt`):** Xếp 70 drone thành 7 hàng × 10 cột.
- **Dữ liệu đầu vào (`data`):** `{"kind": "lights", "grid": [10, 7], "pattern": "rect:10x7", "palette": ["repeat", "place", "move", "newline"]}`
- **Đáp án chuẩn (`answer`):** `{"solution": [{"t": "repeat", "n": 7, "body": [{"t": "repeat", "n": 10, "body": [{"t": "place"}, {"t": "move", "dir": "right"}]}, {"t": "newline"}]}]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đủ 70 drone* | 2★: *Không thừa drone* | 3★: *Dùng tối đa 5 khối*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Một hàng là 10 lần đặt đèn và sang phải.
  - *Gợi ý 2:* Đặt vòng lặp một hàng vào trong một vòng lặp khác, thêm Xuống hàng.
  - *Gợi ý 3:* Lặp 7 lần { Lặp 10 lần { Đặt đèn; Sang phải }; Xuống hàng }. 7 × 10 = 70.

##### Màn `3.3`: Tô màu chẵn lẻ (Mô-đun: `block-vm`)
- **Đề bài (`prompt`):** Với i từ 1 đến 10, đèn thứ i có màu A nếu i chẵn, màu B nếu i lẻ.
- **Dữ liệu đầu vào (`data`):** `{"kind": "lights", "grid": [10, 7], "pattern": "parity:10", "palette": ["for", "ifEven", "color", "place", "move"]}`
- **Đáp án chuẩn (`answer`):** `{"solution": [{"t": "for", "v": "i", "from": 1, "to": 10, "body": [{"t": "ifEven", "v": "i", "body": [{"t": "color", "c": "A"}], "else": [{"t": "color", "c": "B"}]}, {"t": "place"}, {"t": "move", "dir": "right"}]}]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đủ 10 đèn đúng màu* | 2★: *Không thừa đèn* | 3★: *Dùng tối đa 6 khối*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* i chẵn khi i chia 2 dư 0.
  - *Gợi ý 2:* Trong vòng Đếm i, đặt khối Nếu i chẵn để chọn màu trước khi đặt đèn.
  - *Gợi ý 3:* Đếm i từ 1 đến 10 { Nếu i chẵn { Màu A } ngược lại { Màu B }; Đặt đèn; Sang phải }.

##### Màn `3.4`: Cấp năng lượng (Mô-đun: `block-vm`)
- **Đề bài (`prompt`):** Cấp năng lượng bằng tổng 1 + 2 + … + 70. Lưu kết quả vào biến tong.
- **Dữ liệu đầu vào (`data`):** `{"kind": "var", "variable": "tong", "palette": ["set", "for", "addVar"]}`
- **Đáp án chuẩn (`answer`):** `{"expected": 2485, "solution": [{"t": "set", "v": "tong", "value": 0}, {"t": "for", "v": "i", "from": 1, "to": 70, "body": [{"t": "addVar", "v": "tong", "src": "i"}]}]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *tong = 2485* | 2★: *Đúng giá trị* | 3★: *Dùng tối đa 6 khối*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Dùng một biến tổng, bắt đầu từ 0.
  - *Gợi ý 2:* Đếm i từ 1 đến 70 và cộng i vào tong.
  - *Gợi ý 3:* Kết quả phải là 70·71/2 = 2485.

##### Màn `3.5`: Lỗi lệch một (Mô-đun: `block-vm`)
- **Đề bài (`prompt`):** Chương trình tính 1 + … + 70 nhưng cho 2415. Tìm lỗi và sửa.
- **Dữ liệu đầu vào (`data`):** `{"kind": "var", "variable": "tong", "palette": ["set", "for", "addVar"], "start": [{"t": "set", "v": "tong", "value": 0}, {"t": "for", "v": "i", "from": 1, "to": 69, "body": [{"t": "addVar", "v": "tong", "src": "i"}]}], "offByOne": {"buggyResult": 2415, "missing": 70}}`
- **Đáp án chuẩn (`answer`):** `{"expected": 2485, "solution": [{"t": "set", "v": "tong", "value": 0}, {"t": "for", "v": "i", "from": 1, "to": 70, "body": [{"t": "addVar", "v": "tong", "src": "i"}]}]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *tong = 2485* | 2★: *Đúng giá trị* | 3★: *Dùng tối đa 3 khối*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Bấm Chạy thử và so với 2485: thiếu bao nhiêu?
  - *Gợi ý 2:* Thiếu đúng 70, là số hạng cuối cùng.
  - *Gợi ý 3:* Vòng lặp dừng ở 69. Sửa giới hạn thành 70.

---

#### Mạch 4: Dây đèn — *Đồ thị: đường đi ngắn nhất, cây khung, đường Euler*
- **Độ ưu tiên:** `Should` | **Màu nhận diện:** `#ff9b3d` | **Danh sách màn:** `4.1, 4.2, 4.3`

##### Màn `4.1`: Đường dây ngắn nhất (Mô-đun: `graph`)
- **Đề bài (`prompt`):** Nối đường dây ngắn nhất từ A tới E.
- **Dữ liệu đầu vào (`data`):** `{"n": 5, "task": "shortest", "from": "A", "to": "E", "edges": [[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8], [3, 4, 3], [1, 4, 7], [2, 4, 12]]}`
- **Đáp án chuẩn (`answer`):** `{"length": 10, "path": ["A", "C", "B", "E"]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Có đường nối A tới E* | 2★: *Đường ngắn nhất* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Cộng trọng số các dây trên mỗi đường đi rồi so sánh.
  - *Gợi ý 2:* Đi vòng qua C rồi B có thể rẻ hơn đi thẳng A–B.
  - *Gợi ý 3:* A–C–B–E = 2 + 1 + 7 = 10.

##### Màn `4.2`: Nối mọi đèn (Mô-đun: `graph`)
- **Đề bài (`prompt`):** Chọn dây để mọi đèn được nối với nhau, tổng độ dài ít nhất.
- **Dữ liệu đầu vào (`data`):** `{"n": 5, "task": "mst", "edges": [[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8], [3, 4, 3], [1, 4, 7], [2, 4, 12]]}`
- **Đáp án chuẩn (`answer`):** `{"total": 11, "edges": [["C", "B", 1], ["A", "C", 2], ["D", "E", 3], ["B", "D", 5]]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Mọi đèn được nối, không vòng kín* | 2★: *Tổng dây ít nhất* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* 5 đèn cần đúng 4 dây để nối hết mà không tạo vòng.
  - *Gợi ý 2:* Lấy dây ngắn nhất trước; bỏ dây nào tạo chu trình (Kruskal).
  - *Gợi ý 3:* C–B 1, A–C 2, D–E 3, B–D 5. Tổng 11; A–B bị bỏ vì tạo chu trình.

##### Màn `4.3`: Đi qua mỗi dây một lần (Mô-đun: `graph`)
- **Đề bài (`prompt`):** Có đi được qua mỗi dây đúng một lần không? Nếu có, bắt đầu và kết thúc ở đâu?
- **Dữ liệu đầu vào (`data`):** `{"n": 5, "task": "euler", "edges": [[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8], [3, 4, 3], [1, 4, 7], [2, 4, 12]]}`
- **Đáp án chuẩn (`answer`):** `{"class": "path", "oddVertices": ["D", "E"]}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đúng có/không* | 2★: *Đúng điểm đầu và cuối* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Đếm số dây nối vào mỗi đèn (bậc của đỉnh).
  - *Gợi ý 2:* Có đường đi qua mỗi dây một lần khi có 0 hoặc 2 đỉnh bậc lẻ.
  - *Gợi ý 3:* Bậc: A 2, B 4, C 4, D 3, E 3. Đi được, từ D tới E.

---

#### Mạch 5: Ổ khóa — *Số học: đồng dư*
- **Độ ưu tiên:** `Could` | **Màu nhận diện:** `#ff6bd5` | **Danh sách màn:** `5.1, 5.2, 5.3`

##### Màn `5.1`: Ba ổ khóa (Mô-đun: `modular`)
- **Đề bài (`prompt`):** Tìm n trong 0..69 sao cho n ≡ 1 (mod 2), n ≡ 2 (mod 5), n ≡ 3 (mod 7).
- **Dữ liệu đầu vào (`data`):** `{"kind": "crt", "moduli": [2, 5, 7], "residues": [1, 2, 3]}`
- **Đáp án chuẩn (`answer`):** `{"x": 17, "M": 70}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Mở cả ba ổ* | 2★: *Nghiệm đúng* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* 70 = 2·5·7, nên có đúng một nghiệm trong 0..69.
  - *Gợi ý 2:* Số chia 7 dư 3: 3, 10, 17, 24, … Lọc tiếp theo mod 5 và mod 2.
  - *Gợi ý 3:* n = 17: 17 mod 2 = 1, 17 mod 5 = 2, 17 mod 7 = 3.

##### Màn `5.2`: Chia hết cho cả ba (Mô-đun: `modular`)
- **Đề bài (`prompt`):** Trong 1..70, số nào chia hết cho cả 2, 5 và 7?
- **Dữ liệu đầu vào (`data`):** `{"kind": "number", "min": 1, "max": 70}`
- **Đáp án chuẩn (`answer`):** `{"x": 70}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Mở ổ khóa* | 2★: *Đúng số* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Chia hết cho cả 2, 5, 7 nghĩa là chia hết cho tích của chúng.
  - *Gợi ý 2:* 2·5·7 = 70.
  - *Gợi ý 3:* Chỉ có 70.

##### Màn `5.3`: Bảy mươi ngày sau (Mô-đun: `modular`)
- **Đề bài (`prompt`):** Lễ hội diễn ra hôm nay. 70 ngày sau là thứ mấy so với hôm nay?
- **Dữ liệu đầu vào (`data`):** `{"kind": "choice", "options": ["Cùng thứ với hôm nay", "Sau hôm nay 1 thứ", "Sau hôm nay 3 thứ", "Trước hôm nay 1 thứ"]}`
- **Đáp án chuẩn (`answer`):** `{"index": 0}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Mở ổ khóa* | 2★: *Đúng thứ* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Cứ 7 ngày thì quay lại cùng thứ.
  - *Gợi ý 2:* 70 chia 7 dư bao nhiêu?
  - *Gợi ý 3:* 70 = 10 tuần, dư 0, nên cùng thứ.

---

#### Mạch 6: Xếp đèn — *Tổ hợp: đếm cách*
- **Độ ưu tiên:** `Could` | **Màu nhận diện:** `#b48cff` | **Danh sách màn:** `6.1, 6.2, 6.3`

##### Màn `6.1`: Chọn 4 trong 8 (Mô-đun: `count`)
- **Đề bài (`prompt`):** Chọn 4 trong 8 đèn để bật. Có bao nhiêu cách?
- **Dữ liệu đầu vào (`data`):** `{"kind": "comb", "n": 8, "k": 4}`
- **Đáp án chuẩn (`answer`):** `{"count": 70}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đếm đúng* | 2★: *Đúng số cách* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Thứ tự chọn không quan trọng.
  - *Gợi ý 2:* Dùng C(8, 4) = 8!/(4!·4!).
  - *Gợi ý 3:* 40320/576 = 70.

##### Màn `6.2`: Ba đèn khác màu (Mô-đun: `count`)
- **Đề bài (`prompt`):** Xếp 3 đèn khác màu thành hàng, chọn từ 5 màu. Có bao nhiêu cách?
- **Dữ liệu đầu vào (`data`):** `{"kind": "perm", "n": 5, "k": 3}`
- **Đáp án chuẩn (`answer`):** `{"count": 60}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đếm đúng* | 2★: *Đúng số cách* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Thứ tự quan trọng và không lặp màu.
  - *Gợi ý 2:* Đèn đầu có 5 lựa chọn, đèn thứ hai 4, đèn thứ ba 3.
  - *Gợi ý 3:* 5·4·3 = 60.

##### Màn `6.3`: Đường trên lưới (Mô-đun: `count`)
- **Đề bài (`prompt`):** Lưới 4 × 4 ô vuông: đếm đường ngắn nhất từ góc dưới trái tới góc trên phải (chỉ sang phải hoặc lên).
- **Dữ liệu đầu vào (`data`):** `{"kind": "grid", "W": 4, "H": 4}`
- **Đáp án chuẩn (`answer`):** `{"count": 70}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Đếm đúng* | 2★: *Đúng số đường* | 3★: *Đạt trong tối đa 3 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Mỗi đường gồm 4 bước sang phải và 4 bước lên.
  - *Gợi ý 2:* Chọn vị trí 4 bước lên trong 8 bước.
  - *Gợi ý 3:* C(8, 4) = 70.

---

#### Mạch 7: Đêm Hội tụ — *Tổng hợp*
- **Độ ưu tiên:** `Must` | **Màu nhận diện:** `#ffffff` | **Danh sách màn:** `7.1`

##### Màn `7.1`: Đêm Hội tụ (Mô-đun: `finale`)
- **Đề bài (`prompt`):** Ba bước cuối: pháo hoa, gương, dàn drone. Xong là bắt đầu màn trình diễn.
- **Dữ liệu đầu vào (`data`):** `{"steps": ["7.1a", "7.1b", "7.1c"]}`
- **Đáp án chuẩn (`answer`):** `{}`
- **Tiêu chí 3 Sao (`starText`):** 1★: *Hoàn thành ba bước* | 2★: *Cả ba bước đều chính xác* | 3★: *Tổng tối đa 6 lần chạy thử*
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Mỗi bước có gợi ý riêng.
  - *Gợi ý 2:* Mỗi bước có gợi ý riêng.
  - *Gợi ý 3:* Mỗi bước có gợi ý riêng.

---

#### Ba bước tổng hợp của Màn Kết `7.1` (`finaleSteps` trong `circuits.json`):

##### Bước `7.1a`: Bước 1 · Pháo hoa (Mô-đun: `pick-limit`)
- **Đề bài (`prompt`):** Chọn các hàm đưa pháo hoa dừng ở 70 m khi t → ∞.
- **Dữ liệu (`data`):** `{"target": 70, "options": [{"label": "A", "f": "70(1 − e^(−x))", "limit": 70}, {"label": "B", "f": "70x", "limit": "inf"}, {"label": "C", "f": "80(1 − e^(−x))", "limit": 80}, {"label": "D", "f": "70·sin x", "limit": "dne"}, {"label": "E", "f": "(70x² + 1)/(x² + 2)", "limit": 70}]}`
- **Đáp án (`answer`):** `{"correct": ["A", "E"]}`
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Hàm nào tiến tới đúng 70?
  - *Gợi ý 2:* C tiến tới 80; B tăng mãi; D dao động.
  - *Gợi ý 3:* Đáp án: A, E.

##### Bước `7.1b`: Bước 2 · Gương (Mô-đun: `beam-order`)
- **Đề bài (`prompt`):** Tia đang đi lên (0, 1). Đặt hai gương để tia quay về (−1, 0), gặp các tia khác ở tâm.
- **Dữ liệu (`data`):** `{"vector": [0, 1], "target": [-1, 0], "mirrors": ["FX", "R90"], "slots": 2}`
- **Đáp án (`answer`):** `{"orders": [["R90", "FX"]]}`
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Thử cả hai thứ tự.
  - *Gợi ý 2:* R·(0, 1) = (−1, 0).
  - *Gợi ý 3:* R rồi F: F giữ nguyên (−1, 0).

##### Bước `7.1c`: Bước 3 · Dàn drone (Mô-đun: `block-vm`)
- **Đề bài (`prompt`):** Chỉnh các con số trong chương trình để dàn drone xếp thành chữ số 70.
- **Dữ liệu (`data`):** `{"kind": "lights", "grid": [9, 7], "pattern": "digits:70", "palette": [], "lockStructure": true, "start": [{"t": "repeat", "n": 1, "body": [{"t": "place"}, {"t": "move", "dir": "right"}]}, {"t": "place"}, {"t": "repeat", "n": 1, "body": [{"t": "move", "dir": "down"}, {"t": "place"}]}, {"t": "repeat", "n": 1, "body": [{"t": "move", "dir": "up"}]}, {"t": "repeat", "n": 1, "body": [{"t": "move", "dir": "right"}]}, {"t": "repeat", "n": 1, "body": [{"t": "place"}, {"t": "move", "dir": "right"}]}, {"t": "place"}, {"t": "repeat", "n": 1, "body": [{"t": "move", "dir": "down"}, {"t": "place"}]}, {"t": "repeat", "n": 1, "body": [{"t": "move", "dir": "left"}, {"t": "place"}]}, {"t": "repeat", "n": 1, "body": [{"t": "move", "dir": "up"}, {"t": "place"}]}]}`
- **Đáp án (`answer`):** `{"solution": [{"t": "repeat", "n": 2, "body": [{"t": "place"}, {"t": "move", "dir": "right"}]}, {"t": "place"}, {"t": "repeat", "n": 4, "body": [{"t": "move", "dir": "down"}, {"t": "place"}]}, {"t": "repeat", "n": 4, "body": [{"t": "move", "dir": "up"}]}, {"t": "repeat", "n": 2, "body": [{"t": "move", "dir": "right"}]}, {"t": "repeat", "n": 2, "body": [{"t": "place"}, {"t": "move", "dir": "right"}]}, {"t": "place"}, {"t": "repeat", "n": 4, "body": [{"t": "move", "dir": "down"}, {"t": "place"}]}, {"t": "repeat", "n": 2, "body": [{"t": "move", "dir": "left"}, {"t": "place"}]}, {"t": "repeat", "n": 3, "body": [{"t": "move", "dir": "up"}, {"t": "place"}]}]}`
- **Ba bậc gợi ý (`hints`):**
  - *Gợi ý 1:* Mỗi chữ số cao 5 đèn, rộng 3 đèn.
  - *Gợi ý 2:* Cạnh ngang 3 đèn: 2 lần đặt và sang phải, rồi đặt thêm 1.
  - *Gợi ý 3:* Số lặp lần lượt: 2, 4, 4, 2, 2, 4, 2, 3.

---

### 5.3. Toàn văn 4 Chuỗi Nhiệm vụ phụ Học thuật (`story.sidequests` — 13 chặng)

#### Chuỗi nhiệm vụ phụ 1/4 — `sq_xstk_comb`: Kiểm định lô cảm biến & Không gian mẫu
- **Học phần liên kết (`course`):** **XSTK MAT1101 · Chương 0 & Chương 1 (D01–D03)**
- **NPC phụ trách:** **Thảo · K70 Toán Tin (XSTK)** (`thao`)
- **Tóm tắt nội dung (`summary`):** Cùng Thảo ở sảnh Nhà T1 xác định cỡ không gian mẫu khi chọn ngẫu nhiên không hoàn lại cảm biến ($C_n^k$), phân công kênh ưu tiên ($A_n^k$) và lập trình lọc biến cố trên không gian mẫu.
- **Mô-đun toán học sử dụng (`modules`):** `count, block-vm`
- **Phần thưởng khi hoàn thành (`rewardText`):** "Đã hoàn thành chuyên đề XSTK Tổ hợp & Không gian mẫu cùng Thảo! Bạn có thể mở Kho 266 câu hỏi để luyện thêm 53 bài Tổ hợp và Thống kê mẫu."

##### Chặng 1/3 — `sq1_1`: Chặng 1: Chọn mẫu kiểm định không hoàn lại (D01)
- **Lời dẫn của NPC trước khi giải (`intro`):** "Từ lô cảm biến tại sảnh T1, hãy tính số cách lấy ngẫu nhiên một mẫu kiểm định không phân biệt thứ tự theo công thức tổ hợp $C_n^k$."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "count-d1-s901000", "normal": "count-d2-s902000", "hard": "count-d4-s904000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Cỡ không gian mẫu tổ hợp đã khớp! Giờ mình sang bước phân công kênh tần số ưu tiên nhé."

##### Chặng 2/3 — `sq1_2`: Chặng 2: Phân công kênh tần số ưu tiên (D01)
- **Lời dẫn của NPC trước khi giải (`intro`):** "Mỗi trạm thu phát nhận một kênh khác nhau có phân biệt thứ tự ưu tiên. Hãy tính số cấu hình chỉnh hợp $A_n^k$."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "count-d1-s901001", "normal": "count-d2-s902001", "hard": "count-d4-s904001"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Số cấu hình chỉnh hợp chuẩn xác rồi! Còn bước cuối là chạy vòng lặp lọc biến cố thuận lợi trên không gian mẫu."

##### Chặng 3/3 — `sq1_3`: Chặng 3: Đếm kết cục thuận lợi cho biến cố chẵn
- **Lời dẫn của NPC trước khi giải (`intro`):** "Lập trình duyệt qua không gian mẫu $1..n$ và đếm số kết cục thuận lợi cho biến cố chỉ số chẵn vào biến đếm."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "block-vm-d1-s601002", "normal": "block-vm-d2-s602002", "hard": "block-vm-d4-s604002"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Tuyệt vời, bảng kiểm định mẫu của sảnh T1 đã hoàn tất!"

---

#### Chuỗi nhiệm vụ phụ 2/4 — `sq_xstk_dist`: Hàm phân phối mũ, Chuỗi hình học & Tiệm cận
- **Học phần liên kết (`course`):** **XSTK MAT1101 · Chương 2 (D04, D07) & Giải tích 1**
- **NPC phụ trách:** **Kiên · K69 Khoa học dữ liệu (XSTK)** (`kien`)
- **Tóm tắt nội dung (`summary`):** Cùng Kiên ở Nhà T5 hiệu chỉnh hàm phân phối tích lũy mũ $F(t) = 1 - e^{-bt}$, tính số phép thử độc lập của phân phối hình học, khử điểm gián đoạn mật độ và khảo sát tiệm cận khi cỡ mẫu lớn.
- **Mô-đun toán học sử dụng (`modules`):** `plot-limit, series, removable, pick-limit`
- **Phần thưởng khi hoàn thành (`rewardText`):** "Đã hoàn thành chuyên đề XSTK Phân phối & Giới hạn cùng Kiên! Bạn có thể mở Kho 266 câu hỏi để luyện toàn bộ 101 bài Phân phối mũ, Chuỗi và Giới hạn."

##### Chặng 1/4 — `sq2_1`: Chặng 1: Tiệm cận hàm phân phối mũ (D07)
- **Lời dẫn của NPC trước khi giải (`intro`):** "Đặt trần hội tụ $a$ và tốc độ $b$ cho đường cong $h(t) = a(1 - e^{-bt})$ sao cho xác suất phần đuôi sau thời gian $T$ nằm trong ngưỡng cho phép."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "plot-limit-d1-s1000", "normal": "plot-limit-d2-s2000", "hard": "plot-limit-d4-s4000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Đường cong phân phối mũ đã bám sát ngưỡng! Tiếp theo mình tính số bước truyền thử độc lập nhé."

##### Chặng 2/4 — `sq2_2`: Chặng 2: Chuỗi phép thử truyền tin hình học (D04)
- **Lời dẫn của NPC trước khi giải (`intro`):** "Tìm số phép thử độc lập nhỏ nhất $N$ để tổng xác suất tích lũy vượt ngưỡng yêu cầu của tổng hội tụ."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "series-d1-s101000", "normal": "series-d2-s102000", "hard": "series-d4-s104000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Số bước hội tụ rất gọn! Giờ mình xử lý điểm gián đoạn của hàm cường độ tín hiệu."

##### Chặng 3/4 — `sq2_3`: Chặng 3: Khử gián đoạn hàm cường độ tín hiệu
- **Lời dẫn của NPC trước khi giải (`intro`):** "Khử dạng vô định $0/0$ bằng cách phân tích nhân tử tử số để hàm tín hiệu liên tục tại điểm gián đoạn."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "removable-d1-s201000", "normal": "removable-d2-s202000", "hard": "removable-d4-s204000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Đường tín hiệu đã liền mạch, còn chặng cuối là phân loại các hàm hội tụ khi cỡ mẫu tiến ra vô cực."

##### Chặng 4/4 — `sq2_4`: Chặng 4: Hội tụ khi cỡ mẫu tiến ra vô cực
- **Lời dẫn của NPC trước khi giải (`intro`):** "Chọn đúng tất cả các hàm hội tụ về hằng số mục tiêu khi $x \to \infty$, loại bỏ các hàm phân kỳ hoặc dao động."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "pick-limit-d1-s301000", "normal": "pick-limit-d2-s302000", "hard": "pick-limit-d4-s304000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Cả bốn mô hình phân phối và giới hạn tại phòng máy T5 đã khớp hoàn toàn!"

---

#### Chuỗi nhiệm vụ phụ 3/4 — `sq_dstt_lin`: Biến đổi tuyến tính, Ma trận trực giao & Định thức
- **Học phần liên kết (`course`):** **Đại số tuyến tính · Chương 1–4 (HUS)**
- **NPC phụ trách:** **Quỳnh · K70 Toán học (ĐSTT)** (`quynh`)
- **Tóm tắt nội dung (`summary`):** Cùng Quỳnh ở Nhà T4 thực hành ghép thứ tự các phép biến đổi tuyến tính trong $\mathbb{R}^2$ ($AB \ne BA$), kiểm tra ma trận chuyển vị trực giao $R^T = R^{-1}$ và định thức $\det(kR) = k^2\det(R)$.
- **Mô-đun toán học sử dụng (`modules`):** `beam-order, transpose-bug`
- **Phần thưởng khi hoàn thành (`rewardText`):** "Đã hoàn thành chuyên đề Đại số tuyến tính cùng Quỳnh! Bạn có thể mở Kho 266 câu hỏi để luyện toàn bộ 53 bài Biến đổi tuyến tính và Định thức."

##### Chặng 1/3 — `sq3_1`: Chặng 1: Hợp thành hai phép biến đổi tuyến tính
- **Lời dẫn của NPC trước khi giải (`intro`):** "Sắp xếp hai phép biến đổi ma trận (quay và đối xứng) theo đúng thứ tự tác động để đưa vectơ đầu vào tới vectơ đích."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "beam-order-d1-s401000", "normal": "beam-order-d2-s402000", "hard": "beam-order-d4-s404000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Thứ tự tác động chuẩn rồi! Giờ mình kiểm tra lỗi nạp nhầm ma trận chuyển vị $R^T$."

##### Chặng 2/3 — `sq3_2`: Chặng 2: Ma trận chuyển vị trực giao & Định thức
- **Lời dẫn của NPC trước khi giải (`intro`):** "Tính ảnh của vectơ khi áp nhầm $R^T$ thay cho $R$, đồng thời tính $\det(kR) = k^2\det(R)$ để chứng minh phép vị tự không sửa được chiều quay."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "transpose-bug-d1-s501001", "normal": "transpose-bug-d2-s502000", "hard": "transpose-bug-d4-s504003"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Rất rõ ràng! Chặng cuối mình thử thách với hệ gương không giao hoán phức tạp hơn nhé."

##### Chặng 3/3 — `sq3_3`: Chặng 3: Tính không giao hoán của tích ma trận
- **Lời dẫn của NPC trước khi giải (`intro`):** "Tìm đúng hoán vị của các phép biến đổi tuyến tính để tia sáng đi trúng đích trong $\mathbb{R}^2$."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "beam-order-d1-s401001", "normal": "beam-order-d3-s403000", "hard": "beam-order-d5-s405000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Hệ gương thí nghiệm ở sân T4 đã hội tụ chuẩn xác!"

---

#### Chuỗi nhiệm vụ phụ 4/4 — `sq_xstk_net`: Đồng bộ chu kỳ lấy mẫu & Mạng truyền dẫn liên trường
- **Học phần liên kết (`course`):** **Thống kê thực nghiệm & Toán rời rạc**
- **NPC phụ trách:** **Long · K69 Xã hội học (Thống kê)** (`long`)
- **Tóm tắt nội dung (`summary`):** Cùng Long ở sân Nhà D đồng bộ lịch thu mẫu giữa các trạm bằng hệ phương trình đồng dư (CRT) và tối ưu hóa mạng cáp truyền dữ liệu nối hai trường USSH – HUS.
- **Mô-đun toán học sử dụng (`modules`):** `modular, graph`
- **Phần thưởng khi hoàn thành (`rewardText`):** "Đã hoàn thành chuyên đề Đồng dư & Mạng liên trường cùng Long! Bạn có thể mở Kho 266 câu hỏi để luyện toàn bộ 59 bài Số học đồng dư và Đồ thị."

##### Chặng 1/3 — `sq4_1`: Chặng 1: Đồng bộ chu kỳ lấy mẫu (CRT)
- **Lời dẫn của NPC trước khi giải (`intro`):** "Tìm thời điểm $x$ thỏa mãn đồng thời các chu kỳ lấy mẫu theo Định lý Thặng dư Trung Hoa."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "modular-d1-s801000", "normal": "modular-d2-s802000", "hard": "modular-d4-s804000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Chu kỳ lấy mẫu giữa các trạm đã khớp! Tiếp theo mình tìm lộ trình truyền tin có độ trễ nhỏ nhất."

##### Chặng 2/3 — `sq4_2`: Chặng 2: Lộ trình truyền mẫu ngắn nhất
- **Lời dẫn của NPC trước khi giải (`intro`):** "Trên đồ thị mạng trạm đo, hãy chọn đường đi nối từ trạm đầu tới trạm đích có tổng độ trễ nhỏ nhất."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "graph-d1-s701000", "normal": "graph-d2-s702000", "hard": "graph-d4-s704000"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Đường truyền chính đã thông! Còn bước cuối là chọn cây khung nhỏ nhất nối toàn bộ trạm cảm biến."

##### Chặng 3/3 — `sq4_3`: Chặng 3: Cây khung nhỏ nhất nối mạng trạm đo
- **Lời dẫn của NPC trước khi giải (`intro`):** "Chọn $n - 1$ tuyến cáp nhẹ nhất theo thuật toán Kruskal để kết nối mọi trạm mà không tạo chu trình."
- **Mã bài toán theo độ khó (`levels`):** `{"easy": "graph-d1-s701001", "normal": "graph-d2-s702001", "hard": "graph-d4-s704001"}`
- **Lời bình giải thích ý nghĩa sau khi hoàn thành (`after`):** "Toàn bộ mạng khảo sát liên trường từ sân Nhà D sang bên Tự nhiên đã hoàn chỉnh!"

---

### 5.4. Chế độ "Dạo chơi" (Casual Mode) & Thẻ "Muốn biết tên gọi?" (`casual_glossary.json`)

- **Mục đích:** Dành cho khách tham quan gian hàng, cựu sinh viên hoặc người chơi thuộc các ngành Khoa học Xã hội & Nhân văn muốn trải nghiệm trọn vẹn trò chơi mà không gặp rào cản ký hiệu Toán – Tin.
- **Quy tắc kiểm duyệt tự động (`CASUAL_BANNED` trong `content/gen_levels.py`):**
  - Mỗi câu dài **tối đa 20 từ**, chứa **tối đa 3 con số**.
  - **Cấm tuyệt đối 12 thuật ngữ chuyên ngành:** `modulo`, `mod`, `GCD`, `LCM`, `cấp số`, `tổ hợp`, `chỉnh hợp`, `đồng dư`, `nguyên tố cùng nhau`, `nhị phân`, `phân hoạch`, `ma trận`.

**Toàn văn 5 Thẻ "Muốn biết tên gọi?" (`casual_glossary.json`):**

| STT | Mã mô-đun | Tên khái niệm (`name`) | Giải thích bằng ngôn ngữ đời thường (`text`) | Gợi ý đọc thêm (`more`) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `plot-limit` | **Giới hạn** | Người ta gọi chuyện này là giới hạn: khi thời gian trôi mãi, độ cao tiến sát một con số mà không vượt qua. | *Đọc thêm: chương Giới hạn trong giáo trình Giải tích I.* |
| 2 | `series` | **Chuỗi số** | Người ta gọi chuyện này là chuỗi hình học: cộng mãi các phần nhỏ dần thì tổng tiến tới một giá trị hữu hạn. | *Đọc thêm: chuỗi số và tổng cấp số nhân.* |
| 3 | `beam-order` | **Ma trận và phép nhân không giao hoán** | Mỗi tấm gương là một ma trận. Đặt gương theo thứ tự khác nhau là nhân ma trận theo thứ tự khác nhau, và kết quả có thể khác. | *Đọc thêm: phép biến đổi tuyến tính trong Đại số tuyến tính.* |
| 4 | `graph` | **Đồ thị** | Người ta gọi mạng đèn và dây là đồ thị. Tìm đường ngắn nhất dùng thuật toán Dijkstra; nối mọi đèn rẻ nhất là cây khung nhỏ nhất. | *Đọc thêm: Toán rời rạc, phần đồ thị.* |
| 5 | `count` | **Tổ hợp** | Người ta gọi phép đếm này là tổ hợp (không quan tâm thứ tự) hoặc chỉnh hợp (có quan tâm thứ tự). | *Đọc thêm: Toán rời rạc, phần đếm.* |

### 5.5. Toàn văn Lời dẫn của 6 Chế độ chơi phụ (`story.modes`)

#### Chế độ `casual`: Dạo chơi · thắp đèn bên lối đi
- **NPC dẫn chuyện (`speaker`):** **Thành viên Ban Học tập**
- **Lời mở đầu (`intro`):** "Mấy cụm đèn dọc lối đi chưa thử xong. Cậu chọn một cụm giúp mình nhé."
- **Mục tiêu (`goal`):** Thử đủ ba bản để thắp một cụm. Dạo chơi dùng mức 1 hoặc 2. Nhịp Cốt truyện chỉ dùng mức 1.
- **Lời kết chế độ (`payoff`):** "Thắp đủ ba cụm thì mình chạy Đêm Hội tụ được rồi."
- **Các bàn hoạt động chi tiết trong chế độ này (`activities`):**
  - **Hoạt động `1` — Ngọn đèn ở chỗ hẹn:**
    - *Mở đầu:* "Bạn Ban Học tập nhờ bạn thử cụm đèn tại nơi mọi người thường chờ nhau."
    - *Khi hoàn thành:* "Lối hẹn đã có thêm một bản thử mới. Bạn ấy giữ chỗ cho người tới sau."
  - **Hoạt động `2` — Dải sáng qua ô cửa:**
    - *Mở đầu:* "Một bạn USSH muốn nhìn thấy ánh sáng từ cửa sổ bên kia. Cùng thử đường đi của tia nhé."
    - *Khi hoàn thành:* "Bạn ấy nhắn đã nhìn thấy dải sáng đi qua ô cửa."
  - **Hoạt động `4` — Lối nối hai nhóm:**
    - *Mở đầu:* "Điều phối muốn mắc một đường đèn giúp khách tìm đúng chỗ hẹn."
    - *Khi hoàn thành:* "Nhóm trực có thêm một lối nối rõ ràng để chỉ cho khách."
  - **Hoạt động `6` — Những chỗ ngồi còn trống:**
    - *Mở đầu:* "Bạn phụ trách sân khấu đang sắp những điểm sáng cho khách. Thử một cách bố trí nhé."
    - *Khi hoàn thành:* "Một cách bố trí mới đã được cất vào sổ của nhóm sân khấu."

#### Chế độ `daily`: Lời nhắn hôm nay từ nhóm trực
- **NPC dẫn chuyện (`speaker`):** **Chị Chủ nhiệm HAMIC**
- **Lời mở đầu (`intro`):** "Nhóm trực để lại ba mục cần kiểm tra hôm nay. Em chọn một mục làm trước nhé."
- **Mục tiêu (`goal`):** Hoàn thành ba bản kiểm của hôm nay ở nhịp chơi đã chọn. Cùng ngày và cùng độ khó sẽ nhận cùng nội dung.
- **Lời kết chế độ (`payoff`):** "Làm xong cả ba mục, em có thể đánh dấu bàn giao cho nhóm ngày mai."
- **Các bàn hoạt động chi tiết trong chế độ này (`activities`):**
  - **Hoạt động `0` — Mở bản ghi của ca trực:**
    - *Mở đầu:* "Chị để mục cần thử trước ở đây. Em làm xong thì lưu kết quả giúp chị."
    - *Khi hoàn thành:* "Đã lưu kết quả đầu ca."
  - **Hoạt động `1` — Đối chiếu lời bàn giao:**
    - *Mở đầu:* "Nhóm hôm trước đã gửi kết quả. Cậu giúp kiểm tra thêm một cách trước khi dùng lại nhé."
    - *Khi hoàn thành:* "Đã lưu bản đối chiếu với kết quả nhóm trước gửi."
  - **Hoạt động `2` — Để lại một bản rõ ràng:**
    - *Mở đầu:* "Phần cuối của ca trực: lưu một kết quả có thể tiếp nối vào ngày mai."
    - *Khi hoàn thành:* "Đủ ba mục rồi. Nhóm ca sau có thể mở lại các kết quả này."

#### Chế độ `practice`: Buổi tập trước khi gặp lại cả nhóm
- **NPC dẫn chuyện (`speaker`):** **Thành viên Ban Học tập**
- **Lời mở đầu (`intro`):** "Cậu muốn thử lại phần nào? Chọn ở đây nhé, mình cùng xem."
- **Mục tiêu (`goal`):** Chọn một kỹ năng và mức 1–5. Nhịp chơi ở menu đặt mức bắt đầu; cậu vẫn tự đổi được tại đây.
- **Lời kết chế độ (`payoff`):** "Bản làm xong sẽ mở thêm ghi chép trong sổ tay. Muốn đổi bài thì chọn bản khác."
- **Các bàn hoạt động chi tiết trong chế độ này (`activities`):**
  - **Hoạt động `plot-limit` — Dải sáng có điểm dừng:**
    - *Mở đầu:* "Cậu thử thay đổi độ cao và tốc độ. Mình muốn tìm một dải sáng ai cũng kịp nhìn thấy."
    - *Khi hoàn thành:* "Bản thử độ cao đã lưu. Cậu có thể đổi tốc độ rồi so sánh thêm."
  - **Hoạt động `series` — Từng điểm sáng góp lại:**
    - *Mở đầu:* "Một đèn nhỏ chưa làm nên cả dải. Cùng thử xem từng phần góp vào nhau thế nào."
    - *Khi hoàn thành:* "Đã lưu tổng của bản thử này. Thêm hoặc bớt đèn để xem phần góp thay đổi thế nào nhé."
  - **Hoạt động `removable` — Nối lại chỗ gián đoạn:**
    - *Mở đầu:* "Có một chỗ nối đang bị bỏ trống. Ta cùng tìm xem đường nét nên tiếp tục ở đâu."
    - *Khi hoàn thành:* "Chỗ nối đã được ghi lại. Cậu thử một vị trí khác cũng được."
  - **Hoạt động `pick-limit` — Đường nét đang đi về đâu?:**
    - *Mở đầu:* "Nhìn các đường này trước nhé. Cậu thử chọn xem chúng đang tiến về đâu."
    - *Khi hoàn thành:* "Đã lưu các đường cậu chọn. Muốn xem lại thì mở bản này trong lượt thử sau."
  - **Hoạt động `beam-order` — Thứ tự của những lần đổi hướng:**
    - *Mở đầu:* "Mình đổi chỗ hai tấm gương và thấy ánh sáng khác đi. Cậu cùng thử lại nhé."
    - *Khi hoàn thành:* "Thứ tự gương đã lưu. Giờ thử đảo hai gương xem có ra cùng kết quả không."
  - **Hoạt động `transpose-bug` — Lần theo hướng đã quay:**
    - *Mở đầu:* "Bạn phụ trách muốn đưa tia sáng trở lại hướng cũ. Cùng tìm phép đổi phù hợp."
    - *Khi hoàn thành:* "Đã lưu hướng vừa tìm. Cậu thử đưa tia trở lại hướng ban đầu nhé."
  - **Hoạt động `block-vm` — Một đội hình biết lặp lại:**
    - *Mở đầu:* "Nhóm sân khấu muốn dùng ít chỉ dẫn mà vẫn xếp đủ đội hình. Cậu cùng thử nhé."
    - *Khi hoàn thành:* "Đội hình và chỉ dẫn đã lưu. Cậu thử rút bớt một khối xem còn xếp đủ không."
  - **Hoạt động `graph` — Chọn lối mắc đèn:**
    - *Mở đầu:* "Mình cần nối các điểm hẹn bằng đường đèn. Cậu thử tìm một lối phù hợp nhé."
    - *Khi hoàn thành:* "Lối nối đã lưu. Cậu muốn thử cách mắc khác thì mở thêm một bản nhé."
  - **Hoạt động `modular` — Nhịp lặp của một buổi diễn:**
    - *Mở đầu:* "Các đèn lặp theo chu kỳ. Cậu thử tìm lúc chúng gặp nhau ở nhịp cần dùng nhé."
    - *Khi hoàn thành:* "Đã ghi lại nhịp trùng nhau. Lần thử tới mình đổi chu kỳ xem sao."
  - **Hoạt động `count` — Đếm các cách xếp:**
    - *Mở đầu:* "Nhóm còn phân vân giữa nhiều cách xếp điểm sáng. Cậu giúp đếm để không bỏ sót nhé."
    - *Khi hoàn thành:* "Số cách xếp đã lưu. Cậu có thể thử đổi số điểm sáng hoặc số chỗ cần chọn."

#### Chế độ `guest`: Một lời mời ở cổng trường
- **NPC dẫn chuyện (`speaker`):** **Chị Chủ nhiệm HAMIC**
- **Lời mở đầu (`intro`):** "Cậu ghé chơi à? Có ba việc nhỏ này, thử cùng bọn mình rồi xem mô hình nhé."
- **Mục tiêu (`goal`):** Thử ba chặng đã được chọn sẵn; có gợi ý và không cần tạo bản lưu.
- **Lời kết chế độ (`payoff`):** "Xong ba chặng là tới màn trình diễn. Rời chế độ này sẽ xóa tiến độ của khách."
- **Các bàn hoạt động chi tiết trong chế độ này (`activities`):**
  - **Hoạt động `0` — Một dải đèn để chào bạn:**
    - *Mở đầu:* "Bạn Ban Học tập đang thử một dải đèn. Bạn ấy nhờ bạn chọn giúp."
    - *Khi hoàn thành:* "Bạn ấy lưu dải đèn vừa thử rồi chuyển bạn sang phần hướng chiếu."
  - **Hoạt động `1` — Một hướng sáng chung:**
    - *Mở đầu:* "Các bạn đang căn hướng để ánh sáng gặp nhau. Bạn thử giúp một hướng nhé."
    - *Khi hoàn thành:* "Hướng chiếu đã lưu. Còn một lượt xếp đội hình nữa."
  - **Hoạt động `2` — Lời mời cùng bật sáng:**
    - *Mở đầu:* "Chị Chủ nhiệm nhờ bạn gửi đội hình điểm sáng cuối cùng, rồi cùng xem mô hình."
    - *Khi hoàn thành:* "Đội hình đã sẵn sàng. Chị Chủ nhiệm gọi mọi người lại xem mô hình."

#### Chế độ `journey`: Tập bản thử của nhóm
- **NPC dẫn chuyện (`speaker`):** **Chị Chủ nhiệm HAMIC**
- **Lời mở đầu (`intro`):** "Các bản thử nằm ở đây nhé. Em muốn xem kỹ phần nào các bạn vừa nhắc thì mở mạch đó."
- **Mục tiêu (`goal`):** Đi qua các mạch theo tiến độ riêng. Cốt truyện là lựa chọn chính ở menu; các mạch này là phần mở rộng tự chọn.
- **Lời kết chế độ (`payoff`):** "Mạch hoàn thành sẽ mở ghi chép và thêm đèn cho màn diễn. Em có thể quay về cốt truyện bất cứ lúc nào."

#### Chế độ `lab`: Phòng máy vẫn còn sáng
- **NPC dẫn chuyện (`speaker`):** **Chị Chủ nhiệm HAMIC**
- **Lời mở đầu (`intro`):** "Máy còn mở đây. Em cứ đổi thông số rồi chạy thử, chị để sẵn bản gốc rồi."
- **Mục tiêu (`goal`):** Tự thử đồ thị, hướng sáng hoặc khối lệnh. Không chấm sao, không yêu cầu hoàn thành.
- **Lời kết chế độ (`payoff`):** "Thử xong thì quay về câu chuyện, hoặc đổi sang một bàn khác."
- **Các bàn hoạt động chi tiết trong chế độ này (`activities`):**
  - **Hoạt động `plot` — Bàn thử dải sáng:**
    - *Mở đầu:* "Thử thay đổi một thông số rồi quan sát, chưa cần chọn đáp án."
    - *Khi hoàn thành:* ""
  - **Hoạt động `beam` — Bàn thử gương:**
    - *Mở đầu:* "Đổi thứ tự gương và so sánh hai đường đi của ánh sáng."
    - *Khi hoàn thành:* ""
  - **Hoạt động `blocks` — Bàn thử đội hình:**
    - *Mở đầu:* "Ghép vài chỉ dẫn rồi chạy thử xem đội hình xếp ra sao."
    - *Khi hoàn thành:* ""

### 5.6. Hệ thống Sinh màn tự động (`content/gen_levels.py` — 266 màn) & Báo cáo Kiểm định (`qa_report.json`)

- **Tổng số màn sinh tự động (`qa_report.levels`):** **`266` màn** (`levels/generated.json`)
- **Tổng số sự thật về số $n$ sinh tự động (`qa_report.facts`):** **`200` mục** (`facts_generated.json`)
- **Kết quả chạy kiểm chứng cốt lõi (`verify_core_pass`):** **`30`** (`30/30` bài kiểm định chuẩn đạt 100%).
- **Tổng số phép kiểm tra solver độc lập (`independent_checks_recorded`):** **`445` phép kiểm**.
- **Số chuỗi văn bản đã quét kiểm duyệt từ cấm (`text_strings_linted`):** **`1448` chuỗi** → Số vi phạm (`lint_violations`): **`0`**.
- **Số màn chế độ Dạo chơi đã kiểm định (`casual_levels`):** **`46` màn** (`184` câu) → Số vi phạm quy tắc Dạo chơi (`casual_lint_violations`): **`0`**.

**Bảng phân bổ 266 màn tự động theo 10 Mô-đun (`qa_report.per_module` & `casual_by_module`):**

| Mô-đun | Tổng số màn | Số màn có bản Dạo chơi | Phân bổ theo độ khó `[d1, d2, d3, d4, d5]` |
| :--- | :---: | :---: | :---: |
| `plot-limit` | **{'generated': 26, 'rejected': 0, 'duplicate': 4}** | `9` | `[]` |
| `series` | **{'generated': 16, 'rejected': 0, 'duplicate': 14}** | `6` | `[]` |
| `removable` | **{'generated': 29, 'rejected': 0, 'duplicate': 1}** | `0` | `[]` |
| `pick-limit` | **{'generated': 30, 'rejected': 0, 'duplicate': 0}** | `0` | `[]` |
| `beam-order` | **{'generated': 30, 'rejected': 0, 'duplicate': 0}** | `12` | `[]` |
| `transpose-bug` | **{'generated': 23, 'rejected': 0, 'duplicate': 7}** | `0` | `[]` |
| `block-vm` | **{'generated': 24, 'rejected': 0, 'duplicate': 6}** | `0` | `[]` |
| `graph` | **{'generated': 30, 'rejected': 0, 'duplicate': 0}** | `8` | `[]` |
| `modular` | **{'generated': 29, 'rejected': 0, 'duplicate': 1}** | `0` | `[]` |
| `count` | **{'generated': 29, 'rejected': 0, 'duplicate': 1}** | `11` | `[]` |

---

## PHẦN VI. KHÔNG GIAN KHUÔN VIÊN USSH × HUS, 19 ĐÈN LỐI ĐI, 13 BẢNG PHẤN, 15 KỶ VẬT ẨN & NỘI THẤT

### 6.1. Danh sách 2 Trường, 13 Tòa nhà & 19 Điểm dừng bản đồ (`map.json`)

#### A. Hai trường thành viên (`map.campuses`):
- **`USSH` — Trường ĐH Khoa học Xã hội và Nhân văn ():** Màu nhận diện `None`.
- **`HUS` — Trường ĐH Khoa học Tự nhiên ():** Màu nhận diện `None`.

#### B. 13 Tòa nhà trên sa bàn (`map.buildings`):

| STT | Mã tòa (`id`) | Tên trên bản đồ (`name`) | Có thể đi vào sảnh (`enterable`) | Kiểu nội thất (`interiorKind`) | Tiêu đề sảnh (`interiorTitle`) |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | `USSH_B` | `B ( USSH )` | Sân ngoài | `lecture` | **Giảng đường Nhà B · Hội thảo Nhân văn** |
| 2 | `USSH_C` | `C ( USSH )` | Sân ngoài | `archive` | **Giảng đường Nhà C · Báo chí & Truyền thông** |
| 3 | `USSH_H` | `H ( USSH )` | Sân ngoài | `lecture` | **Giảng đường Nhà H · Khoa Lịch sử** |
| 4 | `USSH_D` | `D ( USSH )` | Sân ngoài | `lab` | **Nhà D · Phòng Mạng lưới & Tư liệu liên tòa** |
| 5 | `USSH_E` | `E ( USSH )` | Sân ngoài | `archive` | **Nhà E · Phòng truyền thống Nhân văn** |
| 6 | `USSH_G` | `G ( USSH )` | Sân ngoài | `lecture` | **Giảng đường Nhà G · Ngôn ngữ & Văn hóa** |
| 7 | `HUS_T1` | `T1 ( HUS )` | **Có** | `lecture` | **Giảng đường T1 · Giải tích & Xác suất** |
| 8 | `HUS_T2` | `T2 ( HUS )` | **Có** | `lecture` | **Giảng đường T2 · Toán cao cấp ĐHQGHN** |
| 9 | `HUS_T3` | `T3 ( HUS )` | **Có** | `lab` | **Phòng thực hành T3 · Đại số tuyến tính** |
| 10 | `HUS_T4` | `T4 ( HUS )` | **Có** | `lab` | **Phòng quang học T4 · Ma trận trực giao** |
| 11 | `HUS_T5` | `T5 ( HUS )` | **Có** | `lecture` | **Giảng đường T5 · Xác suất thống kê MAT1101** |
| 12 | `HUS_CANTEEN` | `Căng tin ( HUS )` | **Có** | `hall` | **Căng tin HUS · Khu nhà ăn sinh viên** |
| 13 | `HUS_SPECIAL` | `Nhà Chuyên đề ( HUS )` | **Có** | `hall` | **Nhà Chuyên đề · Trạm điều phối Đêm Toán Tin** |

#### C. 19 Điểm dừng bước chân trên bản đồ (`map.walk.nodes`):

| STT | Mã nút (`id`) | Tòa nhà liên kết (`building`) | Tọa độ `(x, z)` | Tên đầy đủ (`label`) | Tên rút gọn (`short`) |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 1 | `gate` | `—` | `(106.6, -8.2)` | **Cổng HUS** | cổng HUS |
| 2 | `axis` | `—` | `(106.6, -145)` | **Lối đi Nhà T1 – T2** | lối T1 – T2 |
| 3 | `lawn` | `—` | `(106.6, -167)` | **Sân cỏ Nhà T** | sân cỏ Nhà T |
| 4 | `rear` | `—` | `(106.6, -196)` | **Lối sau sân cỏ** | lối sau sân cỏ |
| 5 | `t3` | `—` | `(65.52, -196)` | **Nhà T3 · trạm máy chủ** | T3 |
| 6 | `canteen` | `—` | `(15, -196)` | **Lối qua Căng tin** | Căng tin |
| 7 | `cross` | `—` | `(-10, -175)` | **Lối sang USSH** | lối sang USSH |
| 8 | `e` | `—` | `(-48.49, -175)` | **Nhà E · điểm dữ liệu** | Nhà E |
| 9 | `court` | `—` | `(-100, -175)` | **Sân USSH** | sân USSH |
| 10 | `c` | `—` | `(-104, -101.4)` | **Nhà C / Sân khấu** | Nhà C |
| 11 | `t1` | `—` | `(106.6, -56)` | **Sảnh Nhà T1, HUS** | sảnh Nhà T1 |
| 12 | `t2` | `—` | `(106.6, -120)` | **Sân Nhà T2, HUS** | sân Nhà T2 |
| 13 | `t4` | `—` | `(152.88, -196)` | **Nhà T4, HUS** | Nhà T4 |
| 14 | `t5` | `—` | `(168, -154.44)` | **Nhà T5, HUS** | Nhà T5 |
| 15 | `special` | `—` | `(192, -38)` | **Nhà Chuyên đề, HUS** | Nhà Chuyên đề |
| 16 | `h` | `—` | `(-84.24, -64)` | **Nhà H, USSH** | Nhà H |
| 17 | `g` | `—` | `(-46.28, -183.59)` | **Nhà G, USSH** | Nhà G |
| 18 | `d` | `—` | `(-173.68, -175)` | **Sân Nhà D, USSH** | sân Nhà D |
| 19 | `b` | `—` | `(-192, -101.4)` | **Hành lang Nhà B, USSH** | Nhà B |

### 6.2. Toàn văn 19 Ghi chú Đèn lối đi (`story.lamps.notes.*`)

- **Tiêu đề hệ thống đèn (`story.lamps.title`):** **Thắp đèn lối đi**
- **Tiến độ thắp đèn (`story.lamps.totalProgress`):** *Đã thắp {n}/{total} ngọn đèn lối đi khắp hai khuôn viên.*
- **Tiêu đề khi thắp đủ 19/19 đèn (`story.lamps.all19Title`):** **Vòng sáng liên trường khép kín (19/19)**
- **Thông báo bộ đàm khi đủ 19/19 đèn (`story.lamps.all19Radio`):** **"Đài điều phối: Cả 19 ngọn đèn lối đi giữa hai trường đều đã sáng! Nhìn xuống bản đồ nhỏ mà xem — một vòng sáng khép kín tuyệt đẹp."**
- **Ghi chú Sổ tay khi đủ 19/19 đèn (`story.lamps.all19Note`):** "Toàn bộ 19 cột đèn từ cổng Tự nhiên qua lối sang căng-tin đến các giảng đường Nhân văn đã nối thành một mạch sáng vàng ấm áp trên bản đồ nhỏ."

| STT | Mã đèn / Nút | Địa điểm | Toàn văn lời ghi chú dưới chân đèn (`note`) |
| :---: | :--- | :--- | :--- |
| 1 | `gate` | Cổng HUS | "Cổng HUS: nhóm đón khách tập chào ở đây mỗi chiều." |
| 2 | `axis` | Lối đi Nhà T1 – T2 | "Lối đi Nhà T1 – T2: đèn ở đây sáng lên đầu tiên mỗi buổi chạy thử." |
| 3 | `lawn` | Sân cỏ Nhà T | "Sân cỏ Nhà T: chỗ đặt lõi sáng của Đêm Hội tụ." |
| 4 | `rear` | Lối sau sân cỏ | "Lối sau sân cỏ: đường tắt quen của nhóm kỹ thuật." |
| 5 | `t3` | Nhà T3 · trạm máy chủ | "Nhà T3 · trạm máy chủ: máy chủ chạy mô hình đặt ở đây." |
| 6 | `canteen` | Lối qua Căng tin | "Lối qua Căng tin: tủ tư liệu của nhóm nằm ở góc trong." |
| 7 | `cross` | Lối sang USSH | "Lối sang USSH: hai trường chỉ cách nhau vài bước chân." |
| 8 | `e` | Nhà E · điểm dữ liệu | "Nhà E · điểm dữ liệu: bộ ảnh cựu sinh viên được giữ ở đây." |
| 9 | `court` | Sân USSH | "Sân USSH: chỗ khán giả ngồi xem thử." |
| 10 | `c` | Nhà C / Sân khấu | "Nhà C / Sân khấu: sân khấu và dàn drone." |
| 11 | `t1` | Sảnh Nhà T1, HUS | "Đèn vòm sảnh T1 ấm dần lên, soi rõ bảng thông báo lịch thi Giải tích và Đại số tuyến tính." |
| 12 | `t2` | Sân Nhà T2, HUS | "Ánh đèn hắt qua hàng cột T2 xuống lối gạch nối thẳng ra bãi cỏ trung tâm." |
| 13 | `t4` | Nhà T4, HUS | "Góc sân T4 sáng hẳn, mấy tấm gương thử nghiệm của nhóm Toán phản chiếu lấp lánh." |
| 14 | `t5` | Nhà T5, HUS | "Cột đèn cạnh tòa T5 bật sáng, soi rõ dãy phòng máy vẫn còn sinh viên ngồi chạy mô phỏng." |
| 15 | `special` | Nhà Chuyên đề, HUS | "Khoảng sân trước Nhà Chuyên đề rực lên màu vàng ấm giữa hàng cây xà cừ." |
| 16 | `h` | Nhà H, USSH | "Đèn trước hiên Nhà H sáng dịu, nhìn thẳng ra lối đi lát gạch bên Nhân văn." |
| 17 | `g` | Nhà G, USSH | "Ngọn đèn góc Nhà G bật lên, nối liền dải sáng từ Nhà E sang sân trong." |
| 18 | `d` | Sân Nhà D, USSH | "Sân Nhà D sáng rõ từng dãy ghế đá nơi nhóm khảo sát hay ngồi tổng hợp phiếu." |
| 19 | `b` | Hành lang Nhà B, USSH | "Dãy hành lang dài của Nhà B lên đèn, khép kín vòng ánh sáng phía tây khuôn viên." |

### 6.3. Toàn văn 13 Bảng phấn Chuyên đề & Biển giới thiệu Sảnh Tòa nhà (`story.interior.*`)

#### 1. Tòa `HUS_T1` — Giảng đường T1 · Giải tích & Xác suất
- **Tiêu đề bảng phấn (`boardTitle`):** **GIẢI TÍCH I (MAT1091) & XÁC SUẤT**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `lim (sin x)/x = 1 · Khai triển Taylor - Maclaurin · Công thức Bayes P(A|B)`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú HAMIC: Với phép lặp tâm co và định lý giá trị trung gian, chỉ cần hàm liên tục đổi dấu trên đoạn $[a, b]$ là chắc chắn hội tụ về điểm đặt đèn."

#### 2. Tòa `HUS_T2` — Giảng đường T2 · Toán cao cấp ĐHQGHN
- **Tiêu đề bảng phấn (`boardTitle`):** **TOÁN CAO CẤP ĐHQGHN (A1 - A2 - A3)**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Định lý Lagrange f(b)-f(a) = f'(c)(b-a) · Chuỗi lũy thừa & Hội tụ đều`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú HAMIC: Tích hai phép đối xứng trục tạo thành một phép quay góc gấp đôi góc giữa hai gương — thứ tự nhân ma trận quyết định hướng tia sáng ($AB \neq BA$)."

#### 3. Tòa `HUS_T3` — Phòng thực hành T3 · Đại số tuyến tính
- **Tiêu đề bảng phấn (`boardTitle`):** **ĐẠI SỐ TUYẾN TÍNH & HÌNH HỌC GIẢI TÍCH**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Ánh xạ tuyến tính x ↦ Ax · Không giao hoán AB ≠ BA trên không gian R²`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú HAMIC: Hai biến cố độc lập nối tiếp có xác suất tích $P(A \cap B) = P(A)P(B)$, còn mạch dự phòng song song giảm xác suất hỏng về $(1-p_1)(1-p_2)$."

#### 4. Tòa `HUS_T4` — Phòng quang học T4 · Ma trận trực giao
- **Tiêu đề bảng phấn (`boardTitle`):** **MA TRẬN TRỰC GIAO & ĐỊNH THỨC**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Ma trận quay R^T = R^(-1) · Hệ thức định thức cấp 2: det(kR) = k² det(R)`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú HAMIC: Ma trận đối xứng thực luôn chéo hóa trực giao được ($A = Q\Lambda Q^T$), giúp tách các trục dao động và chùm sáng độc lập."

#### 5. Tòa `HUS_T5` — Giảng đường T5 · Xác suất thống kê MAT1101
- **Tiêu đề bảng phấn (`boardTitle`):** **XÁC SUẤT THỐNG KÊ (MAT1101)**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Phân phối mũ f(x) = λe^(-λx) · Kỳ vọng E(X) & Độ tin cậy hệ thống`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú HAMIC: Phân phối mũ có tính không nhớ $P(X > s + t \mid X > s) = P(X > t)$ — mô hình nền tảng cho độ tin cậy cụm máy chủ và đèn sân khấu."

#### 6. Tòa `HUS_SPECIAL` — Nhà Chuyên đề · Trạm điều phối Đêm Toán Tin
- **Tiêu đề bảng phấn (`boardTitle`):** **TRẠM ĐIỀU PHỐI ÁNH SÁNG ĐÊM TOÁN TIN**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Đồng bộ 6 mạch nhánh về lõi trung tâm · Kiểm tra pha và độ trễ tín hiệu`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú điều phối: Sáu mạch nhánh hội tụ về tháp trung tâm khi độ lệch pha bằng $0$ và tổng công suất khớp ngưỡng thiết kế $70$ đơn vị."

#### 7. Tòa `HUS_CANTEEN` — Căng tin HUS · Khu nhà ăn sinh viên
- **Tiêu đề bảng phấn (`boardTitle`):** **THỰC ĐƠN SINH VIÊN & GIẢI KHÁT HUS**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Cơm suất · Bún phở · Bánh mì · Trà đá đồng giá`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú bên quầy: Bài toán cái túi (Knapsack) phiên bản giờ nghỉ trưa — tối ưu năng lượng ôn thi với ngân sách sinh viên và một ly trà đá 3.000đ."

#### 8. Tòa `USSH_B` — Giảng đường Nhà B · Hội thảo Nhân văn
- **Tiêu đề bảng phấn (`boardTitle`):** **HỘI THẢO KHOA HỌC SINH VIÊN NHÂN VĂN**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Di sản văn hóa đô thị · Giao lưu học thuật Tự nhiên và Nhân văn`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú liên ngành: Ký hiệu logic mệnh đề giúp làm rõ cấu trúc lập luận trong cả toán học hình thức lẫn phân tích diễn ngôn triết học."

#### 9. Tòa `USSH_C` — Giảng đường Nhà C · Báo chí & Truyền thông
- **Tiêu đề bảng phấn (`boardTitle`):** **KỊCH BẢN SÂN KHẤU & BIÊN TẬP PHỤ ĐỀ**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Khớp mốc thời gian âm thanh · Kiểm chứng chú thích ảnh tư liệu 70 năm`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú biên tập: Đồng bộ khung hình $24\text{ fps}$ với nhịp nhạc sân khấu là bài toán bội chung nhỏ nhất giữa chu kỳ âm thanh và ánh sáng."

#### 10. Tòa `USSH_D` — Nhà D · Phòng Mạng lưới & Tư liệu liên tòa
- **Tiêu đề bảng phấn (`boardTitle`):** **MẠNG LƯỚI KẾT NỐI & ĐỘ TIN CẬY ĐƯỜNG TRUYỀN**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Cây khung nhỏ nhất nối các nhà · Xác suất hoạt động mạch song song - nối tiếp`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú mạng lưới: Thuật toán Kruskal và Prim đều tìm cây khung nhỏ nhất giúp nối cáp tín hiệu liên tòa tiết kiệm nhất mà không tạo chu trình thừa."

#### 11. Tòa `USSH_E` — Nhà E · Phòng truyền thống Nhân văn
- **Tiêu đề bảng phấn (`boardTitle`):** **PHÒNG TRUYỀN THỐNG ĐẠI HỌC TỔNG HỢP (1956 - 2026)**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Lịch sử cơ sở Thượng Đình - Thanh Xuân · Hai trường chung một gốc Tổng hợp`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú lịch sử: Từ lễ khai giảng năm 1956 tại Thượng Đình đến nay, truyền thống học thuật cơ bản vẫn nối liền hai khuôn viên sát vách."

#### 12. Tòa `USSH_G` — Giảng đường Nhà G · Ngôn ngữ & Văn hóa
- **Tiêu đề bảng phấn (`boardTitle`):** **ĐỐI CHIẾU VĂN BẢN & NGÔN NGỮ HỌC**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Chuẩn hóa thuật ngữ thuyết minh · Bản tin kỷ niệm 70 năm`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú ngôn ngữ: Thống kê tần suất âm tiết và entropy Shannon giúp nhận diện phong cách văn bản và kiểm chứng bản thảo tư liệu."

#### 13. Tòa `USSH_H` — Giảng đường Nhà H · Khoa Lịch sử
- **Tiêu đề bảng phấn (`boardTitle`):** **BIÊN NIÊN SỬ KHU ĐẠI HỌC THANH XUÂN**
- **Công thức / Nội dung trên bảng (`boardFormula`):** `Các mốc phát triển từ năm 1956 · Phục dựng sơ đồ khuôn viên qua tư liệu gốc`
- **Lời ghi chú của CLB HAMIC (`note`):** "Ghi chú sử liệu: Phép tam giác đạc cổ điển kết hợp bản đồ địa chính giúp phục dựng chính xác vị trí các dãy giảng đường qua 7 thập kỷ."

### 6.4. Toàn văn 15 Kỷ vật ẩn (Easter Eggs — `map.walk.easterEggs` & `story.egg.*`)

- **Nhãn tiến độ (`story.egg.kicker`):** **Kỷ vật ẩn giấu · Đã tìm thấy {n}/{max}**
- **Hướng dẫn tìm (`story.egg.hint`):** *Hãy đi bộ tới địa điểm này hoặc bước vào bên trong giảng đường để tìm kỷ vật.*

#### Kỷ vật 1/15 — `egg_hust_gt1`: Giáo trình Giải tích I của Bách Khoa (HUST)
- **Vị trí đặt (`place`):** Bên trong Giảng đường Nhà T1, HUS *(Tòa `HUS_T1`, kiểu mô hình `book_red`)*
- **Câu chuyện bối cảnh (`lore`):** Một cuốn Giáo trình Giải tích I bìa xanh sẫm dày cộp của Đại học Bách Khoa Hà Nội được trưng bày trên bàn gần cửa giảng đường T1. Trang đầu có dòng chữ viết tay: 'Sinh viên Toán Tin Bách Khoa sang 334 Nguyễn Trãi học ké, lỡ để quên sách xin các bạn Tự nhiên giữ hộ'. Giữa các trang kẹp đầy giấy nháp khai triển Taylor, tích phân suy rộng và bảng so sánh cách trình bày ngôn ngữ $\varepsilon - \delta$ của hai trường.
- **Lời bình dí dỏm (`quip`):** *"Ghi chú lề trang 70: 'Định lý kẹp ở Bách Khoa hay ở Tự nhiên thì cuối kỳ vẫn cứu sinh viên qua môn như nhau.'"*

#### Kỷ vật 2/15 — `egg_vnu_tcc`: Bộ giáo trình Toán cao cấp ĐHQGHN (Tập 1, 2, 3)
- **Vị trí đặt (`place`):** Bên trong Giảng đường Nhà T2, HUS *(Tòa `HUS_T2`, kiểu mô hình `book_stack`)*
- **Câu chuyện bối cảnh (`lore`):** Bộ ba cuốn Toán cao cấp kinh điển của Nhà xuất bản Đại học Quốc gia Hà Nội xếp chồng ngay ngắn trên bàn học: Tập 1 Đại số tuyến tính, Tập 2 Giải tích một biến, Tập 3 Giải tích nhiều biến và Phương trình vi phân. Gáy sách đã sờn vì truyền tay qua nhiều thế hệ sinh viên từ thời giảng đường còn dùng bảng đen phấn trắng.
- **Lời bình dí dỏm (`quip`):** *"Thẻ đánh dấu trang kẹp ở chương Ma trận trực giao: 'Nhớ kiểm tra $R^T R = I$ trước khi nộp bài, nhầm một dấu trừ là bay mất câu 2 điểm.'"*

#### Kỷ vật 3/15 — `egg_uet_rock`: Cục đá UET phiên bản lưu lạc Thanh Xuân
- **Vị trí đặt (`place`):** Góc bãi cỏ giao thoa lối sang Nhà ăn *(Tòa `None`, kiểu mô hình `uet_rock`)*
- **Câu chuyện bối cảnh (`lore`):** Một khối đá trắng bất đối xứng, mặt trước khắc tên Trường Đại học Công nghệ, mặt bên ghi lời nhắn về sáng tạo, đặt giữa lối cỏ, nhìn quen hệt như 'Hòn đá UET' nổi tiếng của Trường Đại học Công nghệ (ĐHQGHN) bên Cầu Giấy. Nhóm sinh viên công nghệ dựng mô hình đá kỷ niệm này ở cơ sở Nguyễn Trãi dịp 70 năm để nhắc về những khoa công nghệ từng khởi nguồn từ mái trường Tổng hợp.
- **Lời bình dí dỏm (`quip`):** *"Mảnh giấy dán dưới chân đá: 'Chạm vào đá 3 lần trước giờ thi Xác suất thống kê và Cấu trúc dữ liệu để bấm Casio không lệch, chạy code xanh ngay lần đầu.'"*

#### Kỷ vật 4/15 — `egg_casio_fx580`: Máy tính Casio fx-580VN X bật sẵn chế độ MATRIX
- **Vị trí đặt (`place`):** Bên trong Phòng thực hành Nhà T3, HUS *(Tòa `HUS_T3`, kiểu mô hình `casio`)*
- **Câu chuyện bối cảnh (`lore`):** Chiếc máy tính bỏ túi quen thuộc của sinh viên khối khoa học tự nhiên đang nằm mở nắp trên bàn thí nghiệm T3. Màn hình LCD vẫn hiện ma trận MatA cấp $3 \times 3$ cùng phép tính $\det(\text{MatA})$ và bảng khảo sát hàm số TABLE. Mặt trong nắp trượt dán tờ giấy nhỏ ghi phím tắt chuyển nhanh giữa thống kê một biến và phân phối chuẩn.
- **Lời bình dí dỏm (`quip`):** *"Dòng chữ bút xóa sau lưng máy: 'Chiếc máy đã chinh chiến qua 4 mùa Giải tích, 2 mùa Xác suất và 1 đêm dựng đèn Hội tụ. Mượn bấm xong nhớ trả tại bàn.'"*

#### Kỷ vật 5/15 — `egg_ussh_chronicle`: Kỷ yếu Đại học Tổng hợp Hà Nội 1956 & Tập san Nhân văn
- **Vị trí đặt (`place`):** Điểm trưng bày ngoài Nhà E, USSH *(Tòa `None`, kiểu mô hình `chronicle`)*
- **Câu chuyện bối cảnh (`lore`):** Cuốn kỷ yếu bìa vải mở sẵn ở trang ảnh chụp lễ khai giảng khóa đầu tiên năm 1956 của Trường Đại học Tổng hợp Hà Nội, tiền thân chung của cả Trường ĐH Khoa học Tự nhiên (HUS) và Trường ĐH Khoa học Xã hội & Nhân văn (USSH). Bên cạnh là bản vẽ tay sơ đồ khu giảng đường Thượng Đình qua từng thập kỷ.
- **Lời bình dí dỏm (`quip`):** *"Chú thích viết bằng bút mực tím: 'Hai trường chung một hàng xà cừ cổ thụ, chỉ cách nhau một quãng sân căng-tin.'"*

#### Kỷ vật 6/15 — `egg_canteen_icedtea`: Ly trà đá 3.000đ & Tờ nháp Bí kíp qua môn
- **Vị trí đặt (`place`):** Bàn góc khu Nhà ăn sinh viên *(Tòa `None`, kiểu mô hình `iced_tea`)*
- **Câu chuyện bối cảnh (`lore`):** Dưới đáy hai ly trà đá mát lạnh ở khu căng-tin là tờ giấy A4 gấp tư chi chít chữ của một nhóm sinh viên vừa ăn trưa vừa ôn thi: mặt trước tóm tắt 7 dạng giới hạn vô định, mặt sau vẽ sơ đồ cây công thức xác suất đầy đủ và công thức Bayes cho bài toán kiểm định hai kho linh kiện.
- **Lời bình dí dỏm (`quip`):** *"Góc tờ giấy đóng khung câu khẩu hiệu: 'Một ly trà đá cộng thêm hai bộ đề cương HAMIC là đủ bình tĩnh bước vào phòng thi.'"*

#### Kỷ vật 7/15 — `egg_cat_dean`: Giáo sư Mèo Vàng thường trực giảng đường Nhà T5
- **Vị trí đặt (`place`):** Bên trong sảnh tầng 1 Nhà T5, HUS *(Tòa `HUS_T5`, kiểu mô hình `cat`)*
- **Câu chuyện bối cảnh (`lore`):** Chú mèo vàng quen mặt của khu giảng đường Tự nhiên đang nằm cuộn tròn ngủ ngon lành ngay bàn đầu Nhà T5. Sinh viên vẫn đùa rằng chú mèo này đã dự thính đủ cả Giải tích 1, Đại số tuyến tính lẫn Xác suất thống kê suốt mấy khóa liền mà chưa từng vắng buổi điểm danh nào.
- **Lời bình dí dỏm (`quip`):** *"Thẻ đeo cổ ghi: 'Trợ giảng danh dự Nhà T5. Nhận thù lao bằng cá khô hoặc điểm A môn Toán.'"*

#### Kỷ vật 8/15 — `egg_ussh_film_reel`: Máy đánh chữ cổ & Cuộn phim tư liệu Nhà C
- **Vị trí đặt (`place`):** Điểm trưng bày ngoài Nhà C, USSH *(Tòa `None`, kiểu mô hình `film_reel`)*
- **Câu chuyện bối cảnh (`lore`):** Chiếc máy đánh chữ cơ học đặt cạnh cuộn phim tư liệu 16mm ghi lại những buổi dạ hội sinh viên và đêm thơ nhạc kịch tại sân Nhân văn từ thập niên 1980. Tờ giấy kẹp trên trục lăn vẫn còn dòng tiêu đề đang gõ dở cho bản tin đặc biệt Đêm Toán Tin kỷ niệm 70 năm.
- **Lời bình dí dỏm (`quip`):** *"Nhãn dán bên hông máy: 'Máy đánh chữ cơ học không có phím Undo, hãy cẩn thận như khi chốt thông số tổng duyệt.'"*

#### Kỷ vật 9/15 — `egg_t4_prism`: Lăng kính quang phổ & Phiếu đo bước sóng Nhà T4
- **Vị trí đặt (`place`):** Sảnh tầng 1 Nhà T4, HUS *(Tòa `HUS_T4`, kiểu mô hình `prism`)*
- **Câu chuyện bối cảnh (`lore`):** Một khối lăng kính thủy tinh quang học đặt trên tấm nhung đen ngay bàn trưng bày sảnh T4, tán sắc ánh đèn hành lang thành bảy dải màu rõ nét. Cạnh đế lăng kính là phiếu ghi góc lệch cực tiểu $D_m$ và công thức chiết suất $n = \frac{\sin((A + D_m)/2)}{\sin(A/2)}$ của nhóm sinh viên Vật lý - Toán Tin dùng để căn màu đèn sân khấu.
- **Lời bình dí dỏm (`quip`):** *"Ghi chú viết chì ở góc phiếu: 'Bảy sắc cầu vồng hội tụ lại thành ánh sáng trắng — giống hệt bảy mạch câu đố gom về tháp trung tâm đêm nay.'"*

#### Kỷ vật 10/15 — `egg_special_logbook`: Sổ trực tổng duyệt Đêm Hội tụ của CLB HAMIC
- **Vị trí đặt (`place`):** Bên trong sảnh Nhà Chuyên đề, HUS *(Tòa `HUS_SPECIAL`, kiểu mô hình `logbook`)*
- **Câu chuyện bối cảnh (`lore`):** Cuốn sổ bìa cứng gáy vàng ghi kín nhật ký chuẩn bị của các ban chuyên môn CLB Toán Tin HAMIC: từ sơ đồ kéo dây tín hiệu qua sân cỏ, bảng phân ca trực bộ đàm, đến danh sách 70 sự thật toán học thú vị chọn lọc để giới thiệu cho khách tham quan.
- **Lời bình dí dỏm (`quip`):** *"Dòng chữ ký cuối trang trực tối nay: 'Mọi phép thử trên giấy đã xong — giờ đến lượt người điều phối thắp sáng toàn khuôn viên!'"*

#### Kỷ vật 11/15 — `egg_t5_duck`: Chú vịt cao su gỡ lỗi (Rubber Duck Debugging)
- **Vị trí đặt (`place`):** Phòng máy chủ 101, tầng 1 Nhà T5, HUS *(Tòa `HUS_T5`, kiểu mô hình `duck`)*
- **Câu chuyện bối cảnh (`lore`):** Giữa hai dãy tủ rack máy chủ mát lạnh của phòng 101 Nhà T5 có một chú vịt vàng nhỏ ngồi nghiêm chỉnh cạnh màn hình terminal. Theo truyền thống kinh điển của dân lập trình, mỗi khi thuật toán bị lệch chỉ số $i = 0$ hay lặp vô hạn, chỉ cần bình tĩnh giải thích từng dòng lệnh cho chú vịt nghe là sẽ tự nhìn ra chỗ sai.
- **Lời bình dí dỏm (`quip`):** *"Mảnh nhãn dán dưới chân vịt: 'Chuyên gia thẩm định độ phức tạp $O(n \log n)$ — chỉ lắng nghe, không phán xét, bắt lỗi off-by-one cực nhạy.'"*

#### Kỷ vật 12/15 — `egg_ussh_b_logic`: Bảng phấn mini Triết học × Logic mệnh đề
- **Vị trí đặt (`place`):** Góc hành lang ngoài Giảng đường Nhà B, USSH *(Tòa `None`, kiểu mô hình `chalk_board`)*
- **Câu chuyện bối cảnh (`lore`):** Tấm bảng gỗ nhỏ dựng bên hiên Nhà B ghi song song hai cột phấn màu: một bên là tam đoạn luận cổ điển của Aristotle trong giờ Triết học đại cương, bên kia là bảng chân trị của phép kéo theo $(P \Rightarrow Q) \land (Q \Rightarrow R) \Rightarrow (P \Rightarrow R)$ do một bạn sinh viên Toán Tin sang giao lưu viết tặng.
- **Lời bình dí dỏm (`quip`):** *"Dòng phấn vàng dưới đáy bảng: 'Ngôn từ cho ta chiều sâu ý nghĩa, ký hiệu cho ta độ chính xác của suy luận.'"*

#### Kỷ vật 13/15 — `egg_ussh_d_survey`: Tập phiếu điền dã Xã hội học & Biểu đồ kiểm định
- **Vị trí đặt (`place`):** Bàn trưng bày ngoài Nhà D, USSH *(Tòa `None`, kiểu mô hình `survey_stack`)*
- **Câu chuyện bối cảnh (`lore`):** Chồng phiếu khảo sát đời sống sinh viên khu Thanh Xuân được buộc gọn bằng dây gai, đặt dưới chiếc kính lúp đồng. Trang tổng kết đính kèm biểu đồ cột tần suất và phép kiểm định khi-bình phương $\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}$ do nhóm liên ngành Xã hội học - Thống kê cùng xử lý số liệu.
- **Lời bình dí dỏm (`quip`):** *"Lời phê bút xanh bên lề: 'Mẫu khảo sát $n = 700$ sinh viên hai trường: $94\%$ đồng ý rằng lối thông qua căng-tin là tuyến đường huyết mạch nhất.'"*

#### Kỷ vật 14/15 — `egg_ussh_g_cipher`: Đĩa xoay đối chiếu ngữ âm & Mật mã dịch vòng
- **Vị trí đặt (`place`):** Không gian trưng bày ngoài Nhà G, USSH *(Tòa `None`, kiểu mô hình `cipher_disk`)*
- **Câu chuyện bối cảnh (`lore`):** Hai vòng đĩa đồng đồng tâm khắc bảng chữ cái và ký hiệu phiên âm quốc tế IPA, dùng trong trò chơi giải mã ngôn ngữ của sinh viên Khoa Ngôn ngữ học. Khi xoay đĩa trong lệch đi $k$ nấc, mỗi chữ cái biến đổi theo phép đồng dư $E_k(x) \equiv (x + k) \pmod{26}$ — chiếc cầu nối cổ điển giữa ngôn ngữ học và mật mã học số học.
- **Lời bình dí dỏm (`quip`):** *"Vạch chuẩn trên vành đĩa đang dừng ở độ lệch $k = 18 \equiv 70 \pmod{26}$!"*

#### Kỷ vật 15/15 — `egg_ussh_h_map1956`: Bản đồ địa chính Thượng Đình 1956 & Ống nhòm trắc địa
- **Vị trí đặt (`place`):** Sân trước Giảng đường Nhà H, USSH *(Tòa `None`, kiểu mô hình `old_map`)*
- **Câu chuyện bối cảnh (`lore`):** Tấm bản đồ giấy dó ngả màu nắng trải dưới thước đồng và ống nhòm ngắm góc, tái hiện bình đồ khu học xá Thượng Đình - Thanh Xuân thuở mới dựng trường năm 1956. Các đường ngắm phương vị từ tháp nước cũ sang dãy giảng đường đầu tiên được ghi chú tỉ mỉ bằng độ, phút, giây.
- **Lời bình dí dỏm (`quip`):** *"Góc bản đồ đóng dấu kỷ niệm: 'Bảy mươi năm đổi thay kiến trúc, tọa độ tri thức vẫn hội tụ về một tâm.'"*

#### Tương tác đặc biệt với "Giáo sư Mèo Vàng Nhà T5" (`story.egg.petCat` — Gãi cằm Giáo sư Mèo Vàng):
- **Lần gãi cằm #1 (`story.egg.catPurr.0`):** "Giáo sư Mèo Vàng khẽ rừ rừ ba nhịp trầm ấm, đuôi quấn gọn quanh cuốn vở bài tập Xác suất thống kê."
- **Lần gãi cằm #2 (`story.egg.catPurr.1`):** "Chú mèo nheo mắt nhìn bạn như muốn nhắc: "Định lý giới hạn trung tâm cần mẫu đủ lớn, còn mèo thì chỉ cần nắng ấm sảnh T5.""
- **Lần gãi cằm #3 (`story.egg.catPurr.2`):** "Một tiếng kêu khẽ vang lên đầy hài lòng — coi như bạn vừa được cộng một điểm chuyên cần danh dự từ sảnh Nhà T5!"
- **Lần gãi cằm #4 (`story.egg.catPurr.3`):** "Mèo Vàng duỗi chân trước chạm nhẹ vào góc trang 70 rồi lại cuộn tròn ngủ tiếp giữa hành lang yên tĩnh."

### 6.5. Nội thất Tầng trệt: Giấy nhắn cửa phòng, Phòng máy chủ, Bàn thí nghiệm & Trạm Drone

#### A. 5 Giấy nhắn dán trên cửa Văn phòng Bộ môn (`story.space.officeNoteTitle` — Lời nhắn từ bộ môn):
- **Giấy nhắn #1 (`story.space.officeNote.0`):** "Thầy sang giảng đường T1 chấm bài tập lớn Giải tích. Sinh viên nộp báo cáo vui lòng kẹp ngay ngắn vào khay gỗ cạnh cửa nhé!"
- **Giấy nhắn #2 (`story.space.officeNote.1`):** "Nhóm trực CLB Toán Tin HAMIC đang ở sân trung tâm thử đèn cho Đêm Hội tụ. Cần mượn phấn màu hay thước thẳng cứ nhắn trên bộ đàm!"
- **Giấy nhắn #3 (`story.space.officeNote.2`):** "Nhắc nhẹ trước tuần thi giữa kỳ: Kiểm tra kỹ điều kiện biên $n = 0$ và dấu của định thức trước khi đóng quyển bài làm."
- **Giấy nhắn #4 (`story.space.officeNote.3`):** "Cán bộ phụ trách phòng đang họp chuyên đề liên trường bên Nhà E Nhân văn. Hẹn các bạn sinh viên vào ca trực đầu giờ chiều."
- **Giấy nhắn #5 (`story.space.officeNote.4`):** "Góc chia sẻ sách cũ: Ai mượn cuốn Bài tập Đại số tuyến tính nhớ giữ nguyên tờ nháp chứng minh Bổ đề Schur ở trang 70."

#### B. Cụm máy chủ Phòng 101 Nhà T5 (`story.space.serverTitle` — Cụm máy chủ mô phỏng ánh sáng) & Bàn thí nghiệm (`story.space.labTitle` — Góc thử nghiệm mô hình trực quan):
- **Trạng thái máy chủ (`story.space.serverStatus`):** `Phòng máy {room} · Nhiệt độ hành lang lạnh $19{,}5^\circ\text{C}$ · Tải cụm nút: $70\%$ ổn định.`
- **Nhật ký máy chủ (`story.space.serverLog`):** "Nhật ký tiến trình: Đang kiểm thử định tuyến cây khung nhỏ nhất và mô phỏng Monte Carlo $10^6$ chùm tia cho sân khấu Đêm Hội tụ. Mọi nút tính toán đều xanh."
- **Nội dung bàn thí nghiệm (`story.space.labBody`):** Trên bàn thực hành bày sẵn giá gương phẳng, bộ chia tia và bảng ghi số liệu hội tụ. Bạn có thể mở ngay **Phòng thí nghiệm** để tự tay xoay gương, đổi tham số và quan sát quỹ đạo tia sáng theo thời gian thực.

#### C. Trạm thử nghiệm Drone (`story.drone.station` — Drone biểu diễn · đang thử đèn):
- **Đội hình #1 (`story.drone.mode.0` — Lượn nhịp tuần tự):** "Trạm drone thử nghiệm: Đã chuyển về chế độ bay tuần tự tiêu chuẩn."
- **Đội hình #2 (`story.drone.mode.1` — Tam giác đồng pha):** "Trạm drone thử nghiệm: Ba drone khóa pha tạo mặt phẳng tam giác cân trên bãi cỏ!"
- **Đội hình #3 (`story.drone.mode.2` — Sóng 7 sắc mạch):** "Trạm drone thử nghiệm: Kích hoạt dải màu 7 mạch luân phiên theo chu kỳ lượng giác!"

### 6.6. Các Bí mật Hạt giống Kỷ niệm (Seeds) & Hợp âm `2–5–7`

| Hạt giống / Tương tác | Khóa dữ liệu | Toàn văn thông điệp bí mật mở khóa |
| :---: | :--- | :--- |
| Hạt giống **`17`** | `practice.secret.17` | "Hạt giống 17 — Năm thành lập CLB Toán Tin HAMIC (17 năm đồng hành học thuật)!" |
| Hạt giống **`70`** | `practice.secret.70` | "Hạt giống 70 — Kỷ niệm 70 năm truyền thống từ mái trường Đại học Tổng hợp (2 × 5 × 7)!" |
| Hạt giống **`836`** | `practice.secret.836` | "Hạt giống 836 — Số kỳ lạ (weird number) thứ hai ngay sau 70!" |
| Hạt giống **`1956`** | `practice.secret.1956` | "Hạt giống 1956 — Năm khai giảng khóa đầu tiên Trường Đại học Tổng hợp Hà Nội!" |
| Hạt giống **`2026`** | `practice.secret.2026` | "Hạt giống 2026 — Đêm Hội tụ ánh sáng kết nối hai trường Tự nhiên × Nhân văn!" |
| Hạt giống **`2485`** | `practice.secret.2485` | "Hạt giống 2485 — Bài toán tổng bình phương kim tự tháp cannonball của Lucas ($1^2 + 2^2 + \dots + 24^2 = 70^2$)!" |
| Hợp âm **`2–5–7`** (Mạch 6) | `story.easter.chord257` | "Tín hiệu ẩn từ tháp Hội tụ: $2 \times 5 \times 7 = 70$ — ba thừa số nguyên tố phân biệt cùng hòa âm trên bầu trời sân cỏ trung tâm!" *(Toast: "2 × 5 × 7 = 70! Tháp trung tâm và dàn drone vừa ngân vang hợp âm Hội tụ.")* |
| Bấm 7 lần vào tiêu đề 70 năm | `title.easter70` | "70 = 2 × 5 × 7 — số sphenic nhỏ thứ hai và số kỳ lạ (weird number) nhỏ nhất trong số học!" |

---

## PHẦN VII. SỔ TAY "SỰ THẬT VỀ 70", 34 THÀNH TỰU, ÂM NHẠC & CHUỖI GIAO DIỆN HỆ THỐNG

### 7.1. Toàn văn 7 Sự thật cốt lõi về số 70 (`facts.json`)

#### Sự thật #1 (Mạch 1): Đích của pháo hoa
- **Nội dung bản Chuẩn (`text`):** 70 là giới hạn mà mọi tia pháo hoa trong game hướng tới: $h(t) = 70\,(1 - e^{-bt}) \to 70$ khi $t \to \infty$.
- **Nội dung bản Dạo chơi (`casual`):** *Pháo hoa trong game càng bay càng sát vạch 70 mét.*
- **Nguồn đối chiếu (`source`):** Do game đặt ra, không phải dữ kiện bên ngoài

#### Sự thật #2 (Mạch 2): Gương xoay giữ nguyên độ lớn
- **Nội dung bản Chuẩn (`text`):** Ma trận xoay $R$ có $R^{\mathsf T} = R^{-1}$ và $\det R = 1$.
- **Nội dung bản Dạo chơi (`casual`):** *Gương xoay chỉ đổi hướng tia, không làm tia dài hay ngắn đi.*
- **Nguồn đối chiếu (`source`):** Kiến thức Đại số tuyến tính chuẩn

#### Sự thật #3 (Mạch 3): Tổng đến 70
- **Nội dung bản Chuẩn (`text`):** $1 + 2 + \dots + 70 = \dfrac{70 \cdot 71}{2} = 2485$.
- **Nội dung bản Dạo chơi (`casual`):** *Cộng các số từ 1 tới 70 được 2485.*
- **Nguồn đối chiếu (`source`):** Công thức 70·71/2

#### Sự thật #4 (Mạch 4): Đi qua mỗi dây một lần
- **Nội dung bản Chuẩn (`text`):** Đồ thị liên thông có đúng hai đỉnh bậc lẻ thì có đường đi qua mỗi cạnh đúng một lần, bắt đầu và kết thúc ở hai đỉnh đó.
- **Nội dung bản Dạo chơi (`casual`):** *Nếu đúng hai đèn có số dây lẻ, ta đi hết mọi dây một lần, từ đèn này tới đèn kia.*
- **Nguồn đối chiếu (`source`):** Định lý Euler về đường Euler

#### Sự thật #5 (Mạch 5): Ba thừa số
- **Nội dung bản Chuẩn (`text`):** $70 = 2 \cdot 5 \cdot 7$, tích của ba số nguyên tố phân biệt.
- **Nội dung bản Dạo chơi (`casual`):** *70 = 2 · 5 · 7, và không tách nhỏ hơn được nữa.*
- **Nguồn đối chiếu (`source`):** Phân tích ra thừa số nguyên tố

#### Sự thật #6 (Mạch 6): Chọn 4 trong 8
- **Nội dung bản Chuẩn (`text`):** $\binom{8}{4} = \dfrac{8!}{4!\,4!} = 70$.
- **Nội dung bản Dạo chơi (`casual`):** *Có đúng 70 cách bật 4 trong 8 đèn.*
- **Nguồn đối chiếu (`source`):** 8!/(4!·4!)

#### Sự thật #7 (Mạch 7): Số kỳ lạ nhỏ nhất
- **Nội dung bản Chuẩn (`text`):** 70 là số kỳ lạ (weird number) nhỏ nhất: các ước thực sự $1, 2, 5, 7, 10, 14, 35$ có tổng $74 > 70$, nhưng không tập con nào cộng lại bằng 70.
- **Nội dung bản Dạo chơi (`casual`):** *Các số chia hết 70 (trừ 70) cộng lại được 74, nhưng chọn kiểu gì cũng không ra đúng 70.*
- **Nguồn đối chiếu (`source`):** [1] Wikipedia "Weird number"; [2] Wolfram MathWorld "Weird Number"; [3] OEIS A006037

### 7.2. Toàn bộ 34 Thành tựu (`achievements.json` — `A01` đến `A34`)

| Mã | Phân loại (`type`) | Ẩn? | Điều kiện mở khóa (`rule`) | Tên thành tựu (`name`) | Mô tả chi tiết (`desc`) |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **`A01`** | `HT` | Hiện | `{"kind": "levelDone", "level": "1.1"}` | **Bật công tắc đầu tiên** | Hoàn thành màn 1.1. |
| **`A02`** | `DL` | Hiện | `{"kind": "levelStar", "level": "1.1", "star": 2}` | **Chính xác đến nửa mét** | Đạt ★ Chính xác ở màn 1.1. |
| **`A03`** | `HT` | Hiện | `{"kind": "levelDone", "level": "1.3"}` | **Lấp điểm tối** | Hoàn thành màn 1.3. |
| **`A04`** | `HT` | Hiện | `{"kind": "circuitLit", "circuit": 1}` | **Mạch Hội tụ sáng** | Hoàn thành mạch 1. |
| **`A05`** | `HT` | Hiện | `{"kind": "circuitLit", "circuit": 2}` | **Gương đúng chiều** | Hoàn thành mạch 2. |
| **`A06`** | `HT` | Ẩn | `{"kind": "all", "of": [{"kind": "levelDone", "level": "2.3"}, {"kind": "flag", "flag": "labBothOrders"}]}` | **Thứ tự quan trọng** | Hoàn thành màn 2.3 và thử cả hai thứ tự gương trong Phòng thí nghiệm. |
| **`A07`** | `HT` | Hiện | `{"kind": "levelDone", "level": "3.2"}` | **Dàn drone đủ 70** | Hoàn thành màn 3.2. |
| **`A08`** | `TD` | Hiện | `{"kind": "circuitStarCount", "circuit": 3, "star": 3}` | **Gọn như dòng lệnh** | Đạt ★ Gọn ở cả 5 màn mạch 3. |
| **`A09`** | `HT` | Hiện | `{"kind": "levelDone", "level": "3.5"}` | **Bắt lỗi lệch một** | Hoàn thành màn 3.5. |
| **`A10`** | `HT` | Hiện | `{"kind": "levelDone", "level": "4.1"}` | **Đường dây ngắn nhất** | Hoàn thành màn 4.1. |
| **`A11`** | `HT` | Hiện | `{"kind": "allCircuitsLit"}` | **Đủ bảy mạch** | Sáng cả 7 mạch và nhận Sao Hội tụ. |
| **`A12`** | `HT` | Hiện | `{"kind": "flag", "flag": "showSeen"}` | **Đêm Hội tụ** | Xem màn trình diễn lần đầu. |
| **`A13`** | `HT` | Hiện | `{"kind": "anyCircuitAllStars"}` | **Ba sao cả mạch** | Đạt 3 sao ở mọi màn của một mạch. |
| **`A14`** | `HT` | Hiện | `{"kind": "anyCircuitNoHints"}` | **Tự lực** | Hoàn thành một mạch không dùng gợi ý. |
| **`A15`** | `TD` | Hiện | `{"kind": "coreFacts"}` | **Bảy sự thật** | Mở đủ 7 mục "sự thật về 70". |
| **`A16`** | `TD` | Ẩn | `{"kind": "counter", "counter": "runs"}` | **Bảy mươi lần thử** | Bấm "Chạy thử" tổng cộng 70 lần. |
| **`A17`** | `HT` | Ẩn | `{"kind": "flag", "flag": "lab70"}` | **Đúng 70** | Đặt được giá trị đúng bằng 70 trong Phòng thí nghiệm. |
| **`A18`** | `HT` | Hiện | `{"kind": "flag", "flag": "cardExported"}` | **Lan tỏa ánh sáng** | Xuất "Thẻ Hội tụ" lần đầu. |
| **`A23`** | `TD` | Hiện | `{"kind": "counter", "counter": "casualDone"}` | **Dạo chơi trọn vẹn** | Hoàn thành 5 màn trong chế độ Dạo chơi. |
| **`A24`** | `HT` | Hiện | `{"kind": "flag", "flag": "glossaryOpened"}` | **Thử cho biết** | Mở một thẻ "Muốn biết tên gọi?". |
| **`A25`** | `HT` | Ẩn | `{"kind": "flag", "flag": "casualToJourney"}` | **Bước sang hành trình** | Chuyển từ Dạo chơi sang Hành trình và hoàn thành một màn. |
| **`A19`** | `HT` | Hiện | `{"kind": "flag", "flag": "practiceDone"}` | **Màn của riêng bạn** | Hoàn thành một màn Luyện tập vô hạn. |
| **`A20`** | `HT` | Ẩn | `{"kind": "flag", "flag": "seedReplay"}` | **Hạt giống đẹp** | Nhập lại hạt giống để chơi lại một màn. |
| **`A21`** | `TD` | Hiện | `{"kind": "dailyDays"}` | **Mười ngày rực sáng** | Hoàn thành Thử thách hằng ngày tổng cộng 10 ngày (không cần liên tiếp). |
| **`A22`** | `TD` | Hiện | `{"kind": "factsN"}` | **Nhà sưu tầm số** | Mở 70 mục trong Sổ tay "sự thật về n". |
| **`A26`** | `TD` | Hiện | `{"kind": "storyEndings"}` | **Gặp đủ kết cục** | Gặp cả sáu kết cục của Đêm Hội tụ. Thư viện kết cục có gợi ý cách đạt. |
| **`A27`** | `TD` | Hiện | `{"kind": "storyTopics"}` | **Hỏi đủ chuyện** | Hỏi 20 chủ đề với các bạn trong khuôn viên. |
| **`A28`** | `HT` | Hiện | `{"kind": "storyFlag", "flag": "done:s14"}` | **Gỡ đúng nguyên nhân** | Chỉ ra đúng ba sai sót nhỏ khiến bản chạy thử bị lệch. |
| **`A29`** | `HT` | Hiện | `{"kind": "storyFlag", "flag": "dec:captions:A"}` | **Giữ trọn lời ghi** | Giữ nguyên lời ghi của người góp ảnh. |
| **`A30`** | `TD` | Hiện | `{"kind": "storyLamps"}` | **Thắp sáng lối đi** | Thắp 7 ngọn đèn lối đi trong khuôn viên. |
| **`A31`** | `TD` | Hiện | `{"kind": "storyEggs"}` | **Người giữ ký ức hai trường** | Khám phá 8 kỷ vật ẩn trên khuôn viên hai trường. |
| **`A32`** | `TD` | Hiện | `{"kind": "storySidequests"}` | **Bạn đồng hành học thuật** | Hoàn thành cả 4 chuỗi nhiệm vụ phụ cùng các bạn sinh viên. |
| **`A33`** | `HT` | Ẩn | `{"kind": "storyLamps"}` | **Không một góc tối** | Thắp sáng toàn bộ 19 ngọn đèn lối đi khắp hai trường Tự nhiên và Nhân văn. |
| **`A34`** | `TD` | Hiện | `{"kind": "storyBoards"}` | **Đọc hết bảng phấn** | Đọc bảng chuyên đề hoặc biển giới thiệu tại 6 tòa nhà trong khuôn viên. |

### 7.3. Danh mục Âm nhạc (`music.json`) & Bản quyền Tài sản (`CREDITS.md`)

| STT | Chương (`chapter`) | Tên bản nhạc (`title`) | Nghệ sĩ (`artist`) | Giấy phép | Tệp âm thanh (`src`) | Nguồn (`source`) |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | `ch0` | **blu** | Zachz Winner | `NCS` | `audio/bgm/Zachz Winner - blu ｜ Pluggnb ｜ NCS - Copyright Free Music-pQ3zOvVrUnY.m4a` | https://www.youtube.com/watch?v=pQ3zOvVrUnY |
| 2 | `ch1` | **Puzzle** | RetroVision | `NCS` | `audio/bgm/RetroVision - Puzzle ｜ Future House ｜ NCS - Copyright Free Music-TN_8D-79BZg.m4a` | https://www.youtube.com/watch?v=TN_8D-79BZg |
| 3 | `ch2a` | **Imaginary Friends** | Laszlo | `NCS` | `audio/bgm/Laszlo - Imaginary Friends ｜ House ｜ NCS - Copyright Free Music-pXppQviIKCc.m4a` | https://www.youtube.com/watch?v=pXppQviIKCc |
| 4 | `ch2b` | **Entropy** | Distrion & Alex Skrindo | `NCS` | `audio/bgm/Distrion & Alex Skrindo - Entropy ｜ House ｜ NCS - Copyright Free Music-iaKgF1Vf5bQ.m4a` | https://www.youtube.com/watch?v=iaKgF1Vf5bQ |
| 5 | `ch3` | **Skyline** | Kovan & Electro-Light | `NCS` | `audio/bgm/Kovan & Electro-Light - Skyline ｜ House ｜ NCS - Copyright Free Music-FseAiTb8Se0.m4a` | https://www.youtube.com/watch?v=FseAiTb8Se0 |

### 7.4. Phụ lục: Các chuỗi Giao diện, Hướng dẫn & Tương tác còn lại trong `vi.json`

Dưới đây là toàn bộ các chuỗi hướng dẫn điều khiển, thông báo trạng thái, nhãn nút bấm, cài đặt và câu thoại phụ còn lại trong `vi.json` (chưa xuất hiện ở các bảng trên) để Ban Nội dung kiểm tra chính tả tiếng Việt 100%:

| Khóa (`key`) | Văn bản hiển thị (`value`) |
| :--- | :--- |
| `_note` | Mọi chuỗi giao diện (GDD 2.3 mục 8.2). Biến dạng {n} do game điền. |
| `ach.hidden` | Thành tựu ẩn |
| `ach.hiddenDesc` | Chơi tiếp để biết. |
| `ach.locked` | Chưa đạt |
| `beam.empty` | Ô trống |
| `beam.order` | Thứ tự gương (chạm để gỡ): |
| `beam.out` | Tia ra |
| `beam.palette` | Gương có sẵn |
| `beam.pick` | Chạm gương để đặt vào hàng: |
| `beam.remove` | Gỡ |
| `beam.sequence` | Thứ tự gương |
| `bgm.close` | Thu gọn bảng nhạc |
| `bgm.ending` | Nhường âm thanh cho màn diễn |
| `bgm.error` | Không tải được nhạc · chạm để thử lại |
| `bgm.help` | Nhạc nền nhỏ, đổi theo chương. Tắt nhạc không ảnh hưởng tiếng hiệu ứng. |
| `bgm.muted` | Âm thanh đang tắt |
| `bgm.off` | Tắt nhạc |
| `bgm.on` | Bật nhạc |
| `bgm.open` | Mở bảng nhạc |
| `bgm.paused` | Đã tắt nhạc |
| `bgm.playing` | Đang phát |
| `bgm.title` | Nhạc nền |
| `bgm.volume` | Âm lượng nhạc nền |
| `bgm.waiting` | Chạm để nghe nhạc |
| `blk.add` | Cộng |
| `blk.clear` | Làm lại từ đầu |
| `blk.color` | Màu |
| `blk.count` | Đang dùng {n} khối (★ Gọn: tối đa {max}) |
| `blk.countFree` | Đang dùng {n} khối |
| `blk.delete` | Xoá khối |
| `blk.dir` | Hướng |
| `blk.dir.down` | Xuống |
| `blk.dir.left` | Sang trái |
| `blk.dir.right` | Sang phải |
| `blk.dir.up` | Lên |
| `blk.drone` | drone |
| `blk.else` | Ngược lại |
| `blk.even` | chẵn |
| `blk.for` | Đếm |
| `blk.from` | từ |
| `blk.goal` | Cần {v} = {n} |
| `blk.here` | ▸ khối mới vào đây |
| `blk.if` | Nếu |
| `blk.inside` | Bên trong |
| `blk.into` | vào |
| `blk.locked` | Chỉ chỉnh các con số. Chạm số để sửa. |
| `blk.newline` | Xuống hàng |
| `blk.palette` | Khối lệnh |
| `blk.pick` | Chạm khối để thêm vào chỗ đang chọn: |
| `blk.place` | Đặt đèn |
| `blk.program` | Chương trình |
| `blk.putHere` | + chọn chỗ này |
| `blk.repeat` | Lặp |
| `blk.runToSee` | Bấm Chạy thử để xem |
| `blk.set` | Đặt |
| `blk.then` | Khi đúng |
| `blk.tile.addConst` | Cộng số |
| `blk.tile.addLinear` | Cộng a + d·i |
| `blk.tile.addVar` | Cộng i |
| `blk.tile.color` | Màu |
| `blk.tile.for` | Đếm i |
| `blk.tile.ifEven` | Nếu i chẵn |
| `blk.tile.move` | Di chuyển |
| `blk.tile.newline` | Xuống hàng |
| `blk.tile.place` | Đặt đèn |
| `blk.tile.repeat` | Lặp n lần |
| `blk.tile.set` | Đặt biến |
| `blk.times` | Số lần lặp |
| `blk.timesSuffix` | lần |
| `blk.to` | đến |
| `blk.up` | Đưa lên |
| `blk.value` | Giá trị |
| `blk.var` | Biến |
| `blk.vars` | Biến: |
| `book.core` | 7 sự thật về 70 ({n}/7) |
| `book.divisors` | Các ước thực sự của 70 |
| `book.locked` | Thắp mạch {n} để mở |
| `book.lockedN` | {n}, chưa mở |
| `book.n` | Sự thật về n |
| `book.nCount` | Đã mở {n}/{max} mục. Mỗi màn hoàn thành mở thêm một mục. |
| `book.pickN` | Chạm một số đã mở để đọc. |
| `book.source` | Nguồn: {s} |
| `boot.world` | Đang dựng mô hình… |
| `card.anon` | Kỹ sư ánh sáng thực tập của HAMIC |
| `card.badName` | Biệt danh này chưa dùng được, thử tên khác nhé. |
| `card.by` | Kỹ sư ánh sáng: {name} |
| `card.explorerBadge` | Người giữ ký ức khuôn viên · Đêm Toán Tin |
| `card.lit` | {n}/{max} mạch đã sáng |
| `card.nickname` | Biệt danh (có thể để trống) |
| `card.placeholder` | Ví dụ: Kỹ sư ánh sáng |
| `card.preview` | Xem trước Thẻ Hội tụ |
| `card.privacy` | Thẻ chỉ được tạo trên máy bạn. Game không gửi dữ liệu lên máy chủ. |
| `card.save` | Lưu ảnh |
| `card.saved` | Đã lưu Thẻ Hội tụ |
| `card.share` | Chia sẻ… |
| `card.shareText` | Mình vừa thắp sáng các mạch trong Đêm Toán Tin. |
| `casual.circuit.1` | Pháo hoa và rót nước |
| `casual.circuit.2` | Xếp gương |
| `casual.circuit.4` | Nối dây đèn |
| `casual.circuit.6` | Xếp ghế |
| `casual.finale` | Đêm Hội tụ |
| `casual.finaleNote` | Đêm Hội tụ mở khi {n} khu đã sáng. |
| `casual.glossaryBtn` | Muốn biết tên gọi? |
| `casual.intro` | Không cần công thức. Kéo, chạm, xem ánh sáng thay đổi. Mỗi khu sáng sau 3 màn. |
| `casual.lit` | Đã sáng |
| `casual.next` | Màn khác |
| `casual.progress` | {n}/{max} màn |
| `casual.toJourney` | Xem bản vẽ kỹ thuật |
| `count.combLabel` | chọn {k} trong {n} đèn |
| `count.permLabel` | xếp {k} đèn từ {n} màu |
| `count.pick` | Chọn đáp án |
| `count.ways` | Số cách |
| `daily.date` | Ngày {d} |
| `daily.days` | Đã hoàn thành {n} ngày. |
| `daily.done` | Xong thử thách hôm nay. |
| `daily.intro` | Ba màn hôm nay, mọi người cùng ngày có cùng đề. Bỏ lỡ ngày nào cũng không sao. |
| `daily.notYet` | Giải cả ba màn để tính một ngày. |
| `finale.card` | Tạo Thẻ Hội tụ |
| `finale.circuits` | {n} mạch cùng hội tụ về 70. |
| `finale.intro` | Ba bước: pháo hoa, gương, dàn drone. Xong là màn trình diễn bắt đầu. |
| `finale.next` | Bước tiếp |
| `finale.nextStep` | Ánh sáng đang hội tụ. Sang bước tiếp theo. |
| `finale.showing` | Đêm Hội tụ |
| `finale.star70` | Đủ bảy mạch: nhận Sao Hội tụ, ngôi sao thứ 70! |
| `finale.start` | Bắt đầu |
| `finale.stepDone` | Xong bước {n} |
| `finale.title` | Đêm Hội tụ |
| `finale.watch` | Xem màn trình diễn |
| `g.circuit` | Được, và quay về chỗ cũ |
| `g.clear` | Bỏ chọn hết |
| `g.ends` | Đầu và cuối: {e} |
| `g.eulerQ` | Đi qua mỗi dây đúng một lần? |
| `g.none` | Không đi được |
| `g.path` | Được, từ một đèn tới đèn khác |
| `g.summary` | Đã chọn {k} dây, tổng {total} |
| `g.tapEnds` | Nếu đi được từ một đèn tới đèn khác, chạm hai đèn đầu và cuối. |
| `g.tapWire` | Chạm vào dây để chọn hoặc bỏ chọn. |
| `g.tapWireCasual` | Chạm vào dây để nối. Chạm lần nữa để gỡ. |
| `guest.again` | Người tiếp theo |
| `guest.exit` | Thoát chế độ Khách |
| `guest.intro` | Chào bạn! Ba màn ngắn ({n} màn), không cần biết công thức, rồi xem pháo hoa và dàn drone. |
| `guest.next` | Màn {n}/{max} |
| `guest.note` | Máy tự quay về màn này sau {s} giây không ai chạm. |
| `guest.quit` | Về đầu |
| `guest.show` | Xem màn trình diễn |
| `guest.start` | Bắt đầu |
| `hamic.logoAlt` | Biểu trưng CLB Toán Tin HAMIC |
| `journey.backToCircuits` | Về danh sách mạch |
| `journey.circuit` | Mạch |
| `journey.circuits` | Bảy mạch ánh sáng |
| `journey.finaleLocked` | Mở khi mạch 1, 2, 3 đã sáng |
| `journey.finaleNeed` | Thắp sáng mạch 1, 2 và 3 để mở Đêm Hội tụ. Mạch nào sáng thêm, màn trình diễn đẹp thêm. |
| `journey.finaleReady` | Ba bước ngắn rồi xem màn trình diễn của chính bạn. |
| `journey.lit` | Đã sáng |
| `journey.locked` | chưa mở |
| `journey.lockedHint` | Thắp mạch 1 để mở các mạch khác. |
| `journey.place` | Tại {name} · {campus} |
| `journey.play` | Chơi màn {id} |
| `journey.playFinale` | Vào Đêm Hội tụ |
| `lab.intro.beam` | Đặt tối đa 3 gương. Đổi thứ tự xem tia ra khác không. |
| `lab.intro.blocks` | Ghép khối tự do rồi chạy thử. |
| `lab.intro.plot` | Kéo a và b để xem h(t) = a·(1 − e^(−bt)) tiến tới đâu. |
| `lab.prompt` | Không có đề. Thử tự do và xem điều gì xảy ra. |
| `lab.ran` | {n} đèn sáng. Biến: {v} |
| `lab.seventy` | Đúng 70! |
| `lab.tab.beam` | Gương |
| `lab.tab.blocks` | Khối lệnh |
| `lab.tab.plot` | Đồ thị hàm |
| `level.circuitLit` | Mạch {name} sáng! |
| `level.done` | Hoàn thành! |
| `level.hint` | Gợi ý {n}/{max} |
| `level.hintKey` | Gợi ý |
| `level.hintTitle` | Gợi ý của Tia |
| `level.moreHint` | Gợi ý tiếp |
| `level.next` | Màn tiếp |
| `level.noMoreHint` | Hết gợi ý. Dùng gợi ý không làm mất sao. |
| `level.retry` | Thử lại |
| `level.run` | Chạy thử |
| `level.stage` | Mô hình |
| `level.thinkingStep1` | Bước khởi đầu |
| `level.thinkingTitle` | Hỗ trợ tư duy (Chế độ Dễ) |
| `level.tiaStart` | Thao tác rồi bấm Chạy thử. Thử bao nhiêu lần cũng được. |
| `mod.digit` | Chữ số tận cùng |
| `mod.number` | Số |
| `mod.pick` | Chọn đáp án |
| `module.beam-order` | Xếp gương |
| `module.block-vm` | Khối lệnh |
| `module.count` | Xếp đèn |
| `module.finale` | Đêm Hội tụ |
| `module.graph` | Dây đèn |
| `module.modular` | Ổ khóa |
| `module.pick-limit` | Chọn hàm tiệm cận |
| `module.plot-limit` | Pháo hoa dừng đúng độ cao |
| `module.removable` | Lấp điểm tối |
| `module.series` | Dải đèn bật dần |
| `module.transpose-bug` | Tia lệch hướng |
| `notice.title` | Lưu ý trước khi chơi |
| `pick.options` | Các hàm để chọn |
| `practice.another` | Màn khác |
| `practice.diff` | Mức khó |
| `practice.intro` | Chọn dạng và mức khó; mỗi màn có hạt giống riêng để chơi lại đúng màn đó. Màn lấy từ bộ 266 màn đã kiểm chứng kép. |
| `practice.module` | Dạng câu đố |
| `practice.new` | Màn mới |
| `practice.noSeed` | Không có màn nào với hạt giống {n}. |
| `practice.pool` | {n} màn ở dạng và mức này. |
| `practice.secretTitle` | Hạt giống kỷ niệm mở khóa |
| `practice.seed` | Nhập hạt giống |
| `practice.seedTitle` | Hạt giống |
| `priority.Could` | có thể có |
| `priority.Must` | bắt buộc |
| `priority.Should` | nên có |
| `rotate.text` | Đêm Toán Tin chỉ chơi ở màn hình ngang. Xoay điện thoại, và tắt khóa xoay nếu cần. |
| `rotate.title` | Xoay ngang để chơi |
| `series.lamps` | Số đèn bật |
| `series.pours` | Số lần rót |
| `set.assist` | Chế độ hỗ trợ |
| `set.assistHelp` | Nới ngưỡng sai số gấp đôi và tự mở gợi ý sau 2 lần chưa đạt. |
| `set.audio` | Âm thanh |
| `set.autoQuality` | Tự hạ chất lượng khi máy chậm |
| `set.autoQualityHelp` | Đo tốc độ khung hình lúc đầu; nếu máy chạy chậm, tự bật đồ họa thấp. |
| `set.colorblind` | Màu cho người khiếm sắc |
| `set.colorblindHelp` | Đổi bảng màu đèn sang cam và xanh dương. Sao và đèn luôn kèm hình dạng, không chỉ dựa vào màu. |
| `set.data` | Dữ liệu |
| `set.display` | Hiển thị |
| `set.export` | Xuất tiến độ ra tệp |
| `set.exported` | Đã lưu tệp tiến độ |
| `set.haptics` | Rung nhẹ |
| `set.hapticsHelp` | Điện thoại rung rất ngắn khi xong một việc trong truyện. |
| `set.hover` | Di chuột hoặc chọn một mục để xem giải thích. |
| `set.import` | Nhập tiến độ từ tệp |
| `set.importFail` | Tệp không đúng định dạng của Đêm Toán Tin |
| `set.importOk` | Đã nhập tiến độ |
| `set.lights` | Giảm hiệu ứng ánh sáng |
| `set.lightsHelp` | Đèn và pháo hoa dịu hơn, không có nhịp thở sáng. |
| `set.low` | Đồ hoạ thấp |
| `set.lowHelp` | Ít điểm ảnh và hạt hơn, hợp với máy yếu. |
| `set.motion` | Giảm chuyển động |
| `set.motionHelp` | Tắt camera bay, nhún, trượt. "Theo máy" làm theo cài đặt hệ điều hành. |
| `set.mute` | Tắt toàn bộ âm thanh |
| `set.muteHelp` | Tắt mọi âm thanh của game. |
| `set.noStorage` | Trình duyệt đang chặn lưu trữ: tiến độ chỉ giữ trong lần mở này. |
| `set.play` | Chơi |
| `set.reset` | Xoá tiến độ |
| `set.resetDone` | Đã xoá tiến độ |
| `set.resetText` | Toàn bộ sao, mạch đã sáng, sổ tay và thành tựu trên thiết bị này sẽ bị xoá. Không lấy lại được trừ khi bạn đã xuất tệp. |
| `set.resetTitle` | Xoá tiến độ? |
| `set.resetYes` | Xoá sao, mạch, sổ tay và thành tựu |
| `set.sfx` | Âm hiệu ứng |
| `set.sfxHelp` | Tiếng chạm, tiếng chuông khi đạt, hợp âm khi mạch sáng. Game chưa có nhạc nền và giọng nói. |
| `set.text` | Cỡ chữ |
| `set.textHelp` | Phóng to chữ giao diện và đề bài. |
| `set.toasts` | Thông báo thành tựu |
| `set.toastsHelp` | Hiện thẻ nhỏ ở góc khi đạt thành tựu. |
| `set.val.100` | Vừa |
| `set.val.115` | Lớn |
| `set.val.130` | Rất lớn |
| `set.val.off` | Tắt |
| `set.val.on` | Bật |
| `set.val.system` | Theo máy |
| `star.blocks` | Dùng tối đa {n} khối |
| `star.done` | Đạt mục tiêu |
| `star.precise` | Chính xác |
| `star.runs` | Đạt trong tối đa {n} lần chạy thử |
| `story.ambient.title` | Gặp nhau trong sân |
| `story.anniversary` | 70 NĂM HUS |
| `story.board.hint` | Ghé sảnh tòa nhà hoặc điểm dừng bên ngoài để đọc nội dung bảng chuyên đề. |
| `story.board.inspect` | Đọc bảng phấn chuyên đề |
| `story.board.inspectPlaque` | Đọc biển giới thiệu tòa nhà |
| `story.board.kicker` | Bảng chuyên đề khuôn viên · {n}/{max} |
| `story.board.openLab` | Thử trong Phòng thí nghiệm |
| `story.brief.after` | Sau khi hoàn thành |
| `story.brief.goal` | Việc nhóm đang chờ |
| `story.brief.story` | Quay về câu chuyện |
| `story.close` | Để sau |
| `story.dialogue.close` | Tạm dừng cuộc trò chuyện |
| `story.dialogue.next` | Nghe tiếp |
| `story.difficulty` | Nhịp chơi & độ khó |
| `story.down` | Đi xuống |
| `story.drone.launch` | Drone bật đèn, chuẩn bị bay vào đội hình… |
| `story.drone.switchMode` | Đổi đội hình drone: {mode} |
| `story.easter.chord257Title` | Mật mã thừa số nguyên tố 2 · 5 · 7 |
| `story.egg.noteTitle` | Ghi chú bên lề của sinh viên |
| `story.egg.toastTitle` | Phát hiện kỷ vật ẩn! |
| `story.egg.unfound` | Chưa khám phá |
| `story.hack` | Hack mode · chỉ phiên này |
| `story.hackOff` | Đã tắt Hack mode |
| `story.hackOn` | Đã bật Hack mode |
| `story.lamps.all19Toast` | Đã thắp sáng trọn vẹn 19/19 đèn lối đi hai trường! |
| `story.left` | Đi trái |
| `story.map.campusOutside` | Bản đồ khuôn viên hiện khi ra ngoài |
| `story.map.canvas` | Bản đồ khuôn viên. Chạm để chọn điểm đến. |
| `story.map.follow` | Theo bạn |
| `story.map.followLabel` | Bản đồ quanh bạn, hướng Bắc ở trên. Chạm để chọn điểm đến. |
| `story.map.hint` | Chạm để chọn điểm đến |
| `story.map.indoors` | Đang ở trong nhà |
| `story.map.north` | B ↑ |
| `story.map.overview` | Toàn khu |
| `story.map.overviewLabel` | Toàn cảnh khuôn viên, hướng Bắc ở trên. Chạm để chọn điểm đến. |
| `story.map.waypoint` | Đã đánh dấu điểm đến |
| `story.map.zoomIn` | + |
| `story.map.zoomInLabel` | Phóng to bản đồ |
| `story.map.zoomOut` | − |
| `story.map.zoomOutLabel` | Thu nhỏ bản đồ |
| `story.menu` | Góc mở rộng · các bản thử |
| `story.modeDifficulty` | Nhịp đang chọn: {name} |
| `story.newgame` | Bắt đầu một câu chuyện mới |
| `story.newgame.confirm` | Bắt đầu lại câu chuyện |
| `story.newgame.note` | Bản ghi câu chuyện hiện tại sẽ được bắt đầu lại. Tiến độ các mode phụ được giữ. |
| `story.perf` | Tiết kiệm hiệu năng |
| `story.perf.help` | Giảm độ phân giải, số sinh viên nền và chuyển động. NPC nhiệm vụ luôn giữ đủ. |
| `story.play` | Bắt đầu câu chuyện |
| `story.prologue.title` | Chiều trước buổi chạy thử |
| `story.prop.uet.motto` | Khát khao <br> Sáng tạo <br> Vươn tới <br> Thế giới |
| `story.prop.uet.name` | ĐẠI HỌC QUỐC GIA HÀ NỘI <br> TRƯỜNG <br> ĐẠI HỌC <br> CÔNG NGHỆ |
| `story.radio` | Tin nhắn trong nhóm dự án |
| `story.resume` | Tiếp tục câu chuyện |
| `story.right` | Đi phải |
| `story.space.backHall` | Trở lại hành lang |
| `story.space.cancel` | Ở lại đây |
| `story.space.confirm` | Xác nhận đi vào |
| `story.space.confirmBody` | Xác nhận để tải bản đồ bên trong. Bạn có thể quay lại qua cửa vừa vào. |
| `story.space.confirmTitle` | Chuyển không gian |
| `story.space.connected` | Hành lang liên thông: T1 ↔ T5 ↔ T4 ↔ T3 |
| `story.space.corridor` | Hành lang · {name} |
| `story.space.enterRoom` | Vào {name} |
| `story.space.inspectLab` | Xem bàn thí nghiệm chuyên đề |
| `story.space.inspectServer` | Xem bảng trạng thái cụm máy chủ |
| `story.space.labKicker` | Bàn thực hành mở · HUS |
| `story.space.mapHint` | Bấm sơ đồ để đi. Chấm vàng là cửa phòng. |
| `story.space.officeClosed` | Văn phòng · Không được vào |
| `story.space.officeNoteKicker` | Giấy nhắn dán trên cửa phòng |
| `story.space.readOfficeNote` | Đọc giấy nhắn trên cửa |
| `story.space.roomName` | {type} {num} |
| `story.space.serverKicker` | Trạm tính toán hiệu năng cao · HUS |
| `story.space.t1.east` | Cánh Đông T1 |
| `story.space.t1.west` | Cánh Tây T1 |
| `story.space.t2.east` | Cánh Đông T2 |
| `story.space.t2.west` | Cánh Tây T2 |
| `story.space.type.classroom` | Phòng học |
| `story.space.type.exhibit` | Phòng trưng bày |
| `story.space.type.lab` | Phòng thí nghiệm |
| `story.space.type.lecture` | Giảng đường |
| `story.space.type.library` | Thư viện |
| `story.space.type.lounge` | Phòng sinh hoạt |
| `story.space.type.meeting` | Phòng họp |
| `story.space.type.office` | Văn phòng |
| `story.space.type.server` | Phòng máy chủ |
| `story.space.type.wc` | Nhà vệ sinh |
| `story.stops.s7.activity.short.canteen` | {place:canteen} |
| `story.stops.s7.activity.short.court` | {Place:court} |
| `story.stops.s7.activity.short.cross` | Lối sang |
| `story.stops.s7.activity.short.e` | {place:e} |
| `story.stops.s7.activity.short.lawn` | {Place:lawn} |
| `story.stops.s7.activity.short.rear` | {Place:rear} |
| `story.talk` | Trò chuyện · E |
| `story.time.day` | Cuối buổi chiều |
| `story.time.dusk` | Chạng vạng |
| `story.time.night` | Trời đã tối |
| `story.time.sunset` | Nắng sắp tắt |
| `story.title.focus` | Ghé {place:t3} nhận việc, rồi đi một vòng cùng các bạn HAMIC và USSH. |
| `story.travel` | Đi tới nhiệm vụ |
| `story.ui.again` | Chơi lại từ đầu |
| `story.ui.asked` | Đã hỏi |
| `story.ui.autoLow` | Máy đang chạy chậm nên game đã bật đồ họa thấp. Có thể tắt trong Cài đặt. |
| `story.ui.back` | Quay lại |
| `story.ui.backToStory` | Về truyện |
| `story.ui.bondNote.build` | Bạn chọn kiểm từng thông số. |
| `story.ui.bondNote.listen` | Bạn chọn hỏi chuyện mọi người. |
| `story.ui.bondTag.build` | Ghi chú kỹ thuật |
| `story.ui.capacity` | {count} chỗ ngồi |
| `story.ui.captions.paired` | Đã ghép {n}/{max} |
| `story.ui.captions.pickPhoto` | Chọn ảnh trước |
| `story.ui.captions.wrong` | Có {n} cặp chưa khớp. |
| `story.ui.cause` | Nguyên nhân hiển thị: {name} |
| `story.ui.causes.extra` | Có thẻ không có bằng chứng. |
| `story.ui.causes.missing` | Còn nguyên nhân thật chưa chọn. |
| `story.ui.causes.pick` | Đã chọn {n} |
| `story.ui.chapterDone` | Đã ghi vào Sổ |
| `story.ui.chat` | Nhóm ({n}) |
| `story.ui.chatEmpty` | Chưa có tin nhắn. |
| `story.ui.chatTitle` | Nhóm Đêm Toán Tin |
| `story.ui.check` | Kiểm tra |
| `story.ui.close` | Đóng |
| `story.ui.continue` | Tiếp tục |
| `story.ui.decide` | Bạn quyết định |
| `story.ui.decisionLocked` | Cần đủ 7 sự thật về 70 |
| `story.ui.devEndings` | Xem thẳng kết cục |
| `story.ui.devJump` | Nhảy tới việc |
| `story.ui.devVariant` | E2 · {name} |
| `story.ui.done` | Đã xong chuỗi chính |
| `story.ui.empty` | Chưa có gì ở đây. |
| `story.ui.ending` | Kết cục {id} |
| `story.ui.enterBuilding` | Vào {name} |
| `story.ui.epilogues` | Lời kết của mọi người |
| `story.ui.evidenceNew` | Bằng chứng mới |
| `story.ui.exitBuilding` | Ra sân trường |
| `story.ui.explorerPostcard` | Dấu ấn dạo bước khuôn viên: đã lưu giữ {eggs} kỷ vật và thắp sáng {lamps} đèn lối đi giữa hai trường. |
| `story.ui.factNew` | Sự thật mới về 70 |
| `story.ui.far` | Lại gần một bạn để trò chuyện |
| `story.ui.finale` | Chạy Đêm Hội tụ |
| `story.ui.finaleLocked` | Hoàn thành các việc chính trước đã. |
| `story.ui.goTo` | Đi tới {place} |
| `story.ui.hint` | Gợi ý ({n}/{max}) |
| `story.ui.hintTitle` | Gợi ý |
| `story.ui.home` | Về menu |
| `story.ui.inside` | Đang ở trong: {name} |
| `story.ui.inspectEgg` | Khám phá: {name} |
| `story.ui.itemNew` | Vật phẩm mới |
| `story.ui.joystick` | Cần điều khiển: kéo để đi |
| `story.ui.keys` | Phím: WASD hoặc mũi tên để đi, E trò chuyện, L thắp đèn, J mở Sổ, M bản đồ. |
| `story.ui.lamp` | Thắp đèn |
| `story.ui.lampCount` | Đèn lối đi {n}/{max} |
| `story.ui.lampDone` | Đủ {n} đèn. Lối đi sáng rồi! |
| `story.ui.lampLit` | Đèn đã sáng |
| `story.ui.lastTime` | Lần trước: {title} · {place} |
| `story.ui.later` | Để sau |
| `story.ui.legacy` | Bản lưu cũ đã được chuyển sang cốt truyện mới. Những việc trước đó được tính với lựa chọn mặc định. |
| `story.ui.levelNote` | Câu đố trong truyện |
| `story.ui.levelPayoff` | Quay lại truyện để báo kết quả cho mọi người. |
| `story.ui.library` | Thư viện kết cục |
| `story.ui.libraryCount` | Đã gặp {n}/{max} kết cục |
| `story.ui.libraryHint` | Gợi ý: {hint} |
| `story.ui.libraryLocked` | Chưa gặp |
| `story.ui.loadingRoom` | Đang tải bản đồ… |
| `story.ui.logEmpty` | Chưa có câu thoại nào trong phiên này. |
| `story.ui.map` | Bản đồ |
| `story.ui.more` | Thêm |
| `story.ui.near` | Gần: {name} |
| `story.ui.noTopics` | Chưa có chủ đề mới. |
| `story.ui.notebook` | Sổ ({n}) |
| `story.ui.nudge` | {name} đang đợi ở {place}. Bấm Đi tới để được dẫn đường. |
| `story.ui.progress` | Việc {n}/{max} |
| `story.ui.questionBank` | Kho 266 câu hỏi chuyên đề |
| `story.ui.reduced` | Giảm hiệu ứng ánh sáng: cảnh chuyển sang mờ dần. |
| `story.ui.reset` | Làm lại |
| `story.ui.retry` | Chưa khớp. Xem lại rồi thử tiếp, không mất gì cả. |
| `story.ui.rewind` | Chọn lại từ tổng duyệt |
| `story.ui.roomEstimate` | đây là mô phỏng, không phải thật |
| `story.ui.roomLoadFailed` | Chưa tải được phòng. Bạn có thể thử lại. |
| `story.ui.run` | Chạy thử |
| `story.ui.showing` | Đêm Hội tụ đang chạy thử trên mô hình… |
| `story.ui.sidequest` | Nhiệm vụ phụ |
| `story.ui.sidequestReplay` | Làm lại chặng |
| `story.ui.sidequestStart` | Làm nhiệm vụ |
| `story.ui.skip` | Bỏ qua cảnh |
| `story.ui.startActivity` | Bắt đầu |
| `story.ui.stats.boomDisabled` | Kết cục E2 đang tắt. Điểm rủi ro vẫn được cộng từ các lựa chọn. |
| `story.ui.stats.contribution` | +{n} điểm rủi ro |
| `story.ui.stats.count` | {n}/{max} |
| `story.ui.stats.decisions` | Quyết định đã chọn |
| `story.ui.stats.duration` | {minutes} phút {seconds} giây |
| `story.ui.stats.evidence` | Bằng chứng đã thu |
| `story.ui.stats.facts` | Sự thật đã tìm |
| `story.ui.stats.lamps` | Đèn đã thắp |
| `story.ui.stats.preview` | Đang xem thử kết cục. Thông số bên dưới thuộc lượt chơi hiện tại. |
| `story.ui.stats.risk` | Điểm rủi ro |
| `story.ui.stats.threshold` | Từ {n} điểm rủi ro sẽ dẫn tới E2. Điểm này là tổng từ các lựa chọn, không phải phần trăm. |
| `story.ui.stats.time` | Thời gian chơi |
| `story.ui.stats.title` | Thông số lượt chơi |
| `story.ui.sync.junk` | Mang theo thừa: {list} |
| `story.ui.sync.missing` | Thiếu: {list} |
| `story.ui.sync.off` | Bỏ qua |
| `story.ui.sync.on` | Đồng bộ |
| `story.ui.sync.rule` | Ghi chú của mẫu chung |
| `story.ui.tab.boards` | Bảng phấn |
| `story.ui.tab.eggs` | Kỷ vật ẩn |
| `story.ui.tab.endings` | Kết cục |
| `story.ui.tab.evidence` | Bằng chứng |
| `story.ui.tab.facts` | Sự thật về 70 |
| `story.ui.tab.items` | Vật phẩm |
| `story.ui.tab.lamps` | Đèn lối đi |
| `story.ui.tab.log` | Lịch sử thoại |
| `story.ui.tab.sidequests` | Nhiệm vụ phụ |
| `story.ui.tab.timeline` | Dòng thời gian |
| `story.ui.talkTo` | Nói với {name} |
| `story.ui.timeline` | Dòng thời gian nhân quả |
| `story.ui.timing.delay` | Chữ hiện sau (giây) |
| `story.ui.timing.early` | Chữ hiện khi hiệu ứng chưa ổn định. |
| `story.ui.timing.effect` | Hiệu ứng |
| `story.ui.timing.hold` | Giữ chữ trong (giây) |
| `story.ui.timing.long` | Chữ còn hiện khi cảnh đã hết. |
| `story.ui.timing.short` | Chữ tắt trước khi đọc hết. |
| `story.ui.timing.text` | Chữ |
| `story.ui.topics` | Chủ đề hỏi |
| `story.ui.topo.bad` | {step} chạy trước khi {need} xong. |
| `story.ui.topo.needs` | cần: {list} |
| `story.ui.topo.order` | Thứ tự: {list} |
| `story.ui.usshExterior` | USSH chỉ tham quan bên ngoài: chưa có bản thiết kế. |
| `story.ui.versions.count` | Có {n} dòng khác nhau. |
| `story.ui.versions.diff` | Đã chọn {n} dòng |
| `story.ui.versions.extra` | Có dòng giống nhau đang bị chọn. |
| `story.ui.versions.missing` | Còn dòng khác nhau chưa chọn. |
| `story.up` | Đi lên |
| `tb.down` | Hướng xuống |
| `tb.no` | Không |
| `tb.q1` | Áp nhầm Rᵀ thì tia đi về đâu? |
| `tb.q2` | Nhân cả ma trận lên {k} lần có sửa được không? |
| `tb.q3` | det({k}·R) bằng bao nhiêu? |
| `tb.same` | Giữ nguyên |
| `tb.up` | Hướng lên |
| `tb.yes` | Có |
| `thinking.activity.captions` | Bấm chọn một bức ảnh bên trái trước, sau đó đọc kỹ mốc năm và địa điểm trong lời ghi bên phải để ghép đúng cặp. |
| `thinking.activity.causes` | Chỉ chọn những nguyên nhân có số liệu và bằng chứng thực tế trong sổ tay; bỏ qua các tin đồn hoặc suy đoán cảm tính. |
| `thinking.activity.sync` | Đọc kỹ quy tắc đồng bộ: bật tất cả các thư mục dữ liệu chính thức cần cho đêm hội và tắt các thư mục nháp, bản sao lưu cũ hoặc tệp tạm. |
| `thinking.activity.timing` | Kéo thanh Độ trễ sao cho chữ bắt đầu hiện sau khi hiệu ứng đã lên sáng ổn định, và kéo Thời lượng giữ sao cho người xem đọc kịp hết số từ trước khi hiệu ứng tắt. |
| `thinking.activity.topo` | Tìm bước công việc không phụ thuộc vào bước nào (hoặc mọi bước đứng trước nó đã được chọn) để bấm xếp vào hàng trước. |
| `thinking.activity.versions` | So sánh từng dòng từ trên xuống dưới giữa hai tệp: dòng nào có con số hoặc ký hiệu khác với bản bên trái thì bấm chọn dòng đó. |
| `thinking.beam-order` | Phương pháp biến đổi tuyến tính: Gương đặt ở ô 1 tác động lên tia sáng trước, rồi kết quả mới đi qua gương ở ô 2 (vì tích ma trận $AB \ne BA$). Hãy nhìn hướng tia vào, thử đặt gương đầu tiên rồi bấm Chạy thử để quan sát tia trung gian. |
| `thinking.block-vm` | Phương pháp lập trình từng bước: (1) Khởi tạo biến kết quả bằng 0 trước vòng lặp. (2) Đặt vòng lặp chạy đúng từ cận đầu tới cận cuối. (3) Bên trong vòng lặp, cộng dồn biểu thức hoặc kiểm tra điều kiện chẵn lẻ. |
| `thinking.count` | Phương pháp đếm: Chọn tập con không phân biệt thứ tự dùng tổ hợp $C_n^k$; xếp hàng có thứ tự dùng chỉnh hợp $A_n^k$; còn đếm đường trên lưới thì số đường tới mỗi nút bằng tổng số đường từ nút ngay bên trái và nút ngay bên dưới cộng lại. |
| `thinking.finale` | Quan sát gợi ý đầu tiên bên dưới và điều chỉnh thông số cho khớp với giá trị mục tiêu của mạch. |
| `thinking.graph` | Phương pháp đồ thị: Với Đường ngắn nhất, ưu tiên đi qua các cạnh có trọng số nhỏ nối từ đỉnh đầu tới đỉnh đích. Với Cây khung nhỏ nhất, chọn lần lượt các cạnh nhẹ nhất mà không tạo vòng khép kín. Với Euler, đếm số cạnh nối vào mỗi đỉnh để tìm các đỉnh bậc lẻ. |
| `thinking.modular` | Phương pháp đồng dư: Với hệ CRT, liệt kê các số chia cho mô-đun lớn nhất dư đúng số dư của nó, rồi thử chia cho hai mô-đun còn lại. Với thứ trong tuần, lấy số ngày chia 7 lấy phần dư. Với chữ số tận cùng, nhân nhẩm chu kỳ lặp tối đa 4 bước của chữ số hàng đơn vị. |
| `thinking.pick-limit` | Phương pháp xét dáng điệu khi $x \to \infty$: Các số hạng dạng $1/x$, $e^{-x}$, $\sin(x)/x$ đều tiến về 0; phân thức bậc tử bằng bậc mẫu thì tiến về tỉ số hệ số bậc cao nhất; còn hàm $a x$ (tăng mãi) hay $\sin x$ (dao động) thì loại ngay. |
| `thinking.plot-limit` | Phương pháp 2 bước: (1) Kéo thanh Độ cao đích $a$ đúng bằng vạch mục tiêu vì $\lim_{t\to\infty} h(t) = a$. (2) Tăng dần tốc độ $b$ cho đến khi phần đuôi $a e^{-bT}$ tại mốc thời gian $T$ nhỏ hơn hoặc bằng sai số cho phép. |
| `thinking.removable` | Phương pháp khử dạng vô định $0/0$: Thay $x = c$ làm mẫu bằng 0, nên tử số chắc chắn chứa nhân tử $(x - c)$. Hãy phân tích tử số thành $(x - c)(x + d)$, rút gọn $(x - c)$ rồi thay $x = c$ vào $(x + d)$ để được giá trị liên tục. |
| `thinking.series` | Phương pháp cộng tích lũy: Mỗi bước đóng góp thêm $q^n$, làm phần còn thiếu giảm theo lũy thừa $q^N$. Bạn chỉ cần tăng số bước $N$ lên từng đơn vị cho tới khi vạch phần trăm chạm hoặc vượt ngưỡng yêu cầu. |
| `thinking.transpose-bug` | Phương pháp ma trận trực giao & định thức: (1) Ma trận chuyển vị $R^T$ quay ngược chiều với $R$, nên giữ nguyên hoành độ $x$ và đổi dấu tung độ $y$. (2) Nhân ma trận cấp 2 với $k$ làm định thức tăng $k^2$ lần ($\det(kR) = k^2$), nên không thể sửa lỗi ngược chiều. |
| `title.achievements` | Thành tựu |
| `title.achievementsSub` | {n}/{max} đã đạt |
| `title.card` | Thẻ Hội tụ |
| `title.casual` | Dạo chơi |
| `title.daily` | Thử thách hôm nay |
| `title.dailySub` | Nhận ca trực của hôm nay |
| `title.easter70Title` | Hợp âm sphenic 70 |
| `title.guest` | Chế độ Khách |
| `title.journey` | Bản vẽ kỹ thuật |
| `title.journeySub` | Các mạch câu đố tự chọn |
| `title.lab` | Phòng thí nghiệm |
| `title.labSub` | Phòng máy sau giờ diễn |
| `title.litAria` | {n} trên {max} mạch đã sáng |
| `title.menu` | Menu chính |
| `title.noSave` | trình duyệt chặn lưu tiến độ |
| `title.notebook` | Sổ tay |
| `title.notebookSub` | {n}/7 sự thật về 70 |
| `title.practice` | Luyện tập |
| `title.practiceSub` | Cùng đồng đội thử thêm |
| `title.settings` | Cài đặt |
| `title.settingsSub` | Âm thanh, hiển thị, trợ năng |
| `title.starsAria` | {n} trên {max} sao |
| `title.version` | bản {v} |
| `toast.achievement` | Đạt thành tựu! |
| `toast.factText` | Một sự thật về 70 vừa mở. |
| `toast.factTitle` | Sổ tay có mục mới |
| `ui.back` | Quay lại |
| `ui.cancel` | Huỷ |
| `ui.close` | Đóng |
| `ui.done` | Xong |
| `ui.home` | Màn hình chính |
| `ui.keep` | Giữ lại |
| `ui.keypad` | Nhập số |
| `ui.minus` | Giảm |
| `ui.off` | Tắt |
| `ui.ok` | Xong |
| `ui.on` | Bật |
| `ui.plus` | Tăng |
| `ui.replay` | Làm lại |

---

*Hồ sơ được trích xuất tự động và đối chiếu toàn phần từ dữ liệu nguồn của dự án để phục vụ công tác kiểm duyệt nội dung của CLB Toán Tin HAMIC.*