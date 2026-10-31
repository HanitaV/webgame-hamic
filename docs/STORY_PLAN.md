# Kế hoạch đại tu cốt truyện "Hội tụ 70" (webgame-hamic v2.7.0)

> Lưu ý: mô tả kết cục trong tài liệu này đã bị thay bằng docs/ENDINGS.md; GDD đã được nới lỏng (docs/GDD.md).

Tài liệu gồm ba phần: (1) chẩn đoán cốt truyện hiện tại, (2) danh sách gợi ý đại tu, (3) bộ prompt giao cho tác tử lập trình. Mọi nhận xét về hiện trạng dựa trên các tệp trong bản zip bạn gửi; mình chưa chạy game, nên phần "cảm giác khi chơi" cần bạn xác nhận lại.

---

## 1. Chẩn đoán: vì sao cốt truyện đang "chắp vá"

| # | Vấn đề | Bằng chứng trong mã / dữ liệu |
|---|---|---|
| 1 | Hai hệ thống chạy song song, không nối nhau. Sáu nhiệm vụ cốt truyện chỉ là câu hỏi hai lựa chọn; 11 mô-đun câu đố thật (`plot-limit`, `beam-order`, `block-vm`, `graph`, `modular`, `count`…) nằm ở menu Hành trình, không xuất hiện trong lúc đi bộ. | `story.json` → `tasks[].choices` (2–3 lựa chọn); `levels/circuits.json` → 7 mạch, 23 màn |
| 2 | Tám "bàn giao" (`fieldwork`) và ba "tổng duyệt" (`rehearsal`) dùng đúng một khuôn: 4 câu thoại, 2 lựa chọn, rồi sắp 4 thẻ theo thứ tự. Lựa chọn chỉ đổi một câu trả lời, không để lại hệ quả. | `walk.ts` hàm `activity()`, `fieldChoices` chỉ lưu 0/1; `sequenceReady()` |
| 3 | Câu thoại "ambient" của 8 NPC phụ giống hệt nhau ("Cậu cứ làm việc đang nhận trước nhé…"). | `vi.json` các khóa `story.ambient.{minh,ha,nam,linh,an,bao,vy,duc}.*` |
| 4 | Kết cục chỉ phụ thuộc số câu đúng trong 5 câu (`storyEnding`: 5 → good, ≥2 → neutral, còn lại → oops). Kết cục "T3 hồng hết", "Nhà E bay lên" không liên quan đến lựa chọn nào của người chơi. | `puzzles/logic/story.ts` |
| 5 | Lựa chọn mở đầu "listen / build" chỉ đổi đúng một câu mỗi nhiệm vụ và một câu ở cuối. | `bondReply`, `finalReplies` |
| 6 | Không có câu hỏi dẫn dắt (vì sao đèn lệch? tư liệu USSH quan trọng thế nào?). Chủ đề "70" và "hội tụ", vốn là xương sống của GDD, hầu như vắng trong lời thoại. | `story.scene.*`, GDD mục 1 |
| 7 | Bản đồ có 10 điểm dừng nhưng sáu nhiệm vụ chỉ rải trên 4 điểm (`t3`, `lawn`, `e`, `c`); các điểm còn lại chủ yếu có NPC đứng chờ. Mỗi NPC gắn cố định một `node` trong `map.json`, không đổi theo tiến trình. | `map.json` → `walk.nodes`, `walk.characters` |
| 8 | Mâu thuẫn với GDD: GDD 2.1 ghi "không có nội dung lịch sử, văn hóa hay triết học", nhưng câu chuyện hiện có nhắc thời Đại học Tổng hợp Hà Nội và bài lượng – chất. Cần chốt hướng, xem mục 3 bên dưới. | `docs/GDD.md` đầu trang; `story.task.4`, `story.scene.3.0` |

---

## 2. Gợi ý đại tu

### A. Xương sống cốt truyện (chọn một)

**Phương án 1: "Vì sao đèn lệch?" (khuyến nghị).** Cả game là một cuộc điều tra nhỏ. Sa bàn chạy thử bị lệch một đoạn; mỗi điểm dừng cho một mảnh bằng chứng, cuối cùng người chơi ghép ra nguyên nhân thật. Ưu điểm lớn nhất: các mầm này đã có sẵn trong dữ liệu ("hai bản cùng tên", "tệp ghi chú bị bỏ sót khi đồng bộ", "chữ chưa kịp đọc"), chỉ cần nối chúng thành một chuỗi nhân quả thay vì vá thêm cảnh mới. Nguyên nhân cuối nên là ba sai sót nhỏ cộng dồn (nhầm phiên bản, thiếu tệp ghi chú, hai nhóm hiểu khác nhau về "bản chốt"), không có "kẻ xấu", đúng tinh thần CLB.

**Phương án 2: "Bảy mảnh ký ức hội tụ".** Mỗi mạch là một mảnh; ghép đủ bảy thì ra chữ 70. Hợp GDD 5.3 ("7 sự thật về số 70") nhưng ít kịch tính hơn.

**Phương án 3: "Một ngày làm thành viên mới".** Thiên về kể chuyện đời thường, ít câu đố hơn. Chỉ nên chọn nếu bạn muốn game nhẹ nhàng cho người ngoài ngành.

Có thể ghép: dùng phương án 1 làm trục, phương án 2 làm phần thưởng (mỗi mảnh bằng chứng mở một sự thật về 70 trong Sổ tay).

### B. Cấu trúc ba chương (theo phương án 1, dùng đúng các điểm dừng trong `map.json`)

| Chương | Địa điểm (node) | Việc chính | Câu đố / minigame | Bằng chứng thu được |
|---|---|---|---|---|
| Mở đầu | Cổng HUS (`gate`), Minh | Nhận thẻ, nghe "đèn lệch một đoạn", nhận Sổ bàn giao | Không có, chỉ hội thoại có chọn "listen / build" | Thẻ thành viên, câu hỏi dẫn dắt |
| I. Ánh sáng còn thiếu | Lối T1–T2 (`axis`), sân cỏ (`lawn`) | Đo độ cao dải sáng, kiểm hướng chiếu | `plot-limit`, `series`, `beam-order` | Số đo thật của dải sáng (lệch 0,x so với 70), thứ tự phép quay |
| II-a. Qua Căng tin | `canteen`, `cross` | Mở tủ đựng tệp, tìm đường chuyển tư liệu | `modular` (mã khóa lấy từ ngày trong chú thích ảnh), `graph` (đường đi trên chính đồ thị `walk.edges`) | Tệp ghi chú, tên người gửi đầu tiên |
| II-b. USSH | Nhà E (`e`), sân USSH (`court`), Nhà C (`c`) | Nhận tư liệu, giữ nguyên chú thích, xếp lịch cảnh | Ghép ảnh – chú thích; `count` (chọn 4 trong 8 cảnh = C(8,4) = 70 cách); `block-vm` | Bản gốc có ghi chú, danh sách tệp cần đồng bộ |
| III. Cùng bật sáng | T3 (`t3`) | Đối chiếu bằng chứng, chốt cấu hình, tổng duyệt, chạy Đêm Hội tụ | `7.1` (màn cuối) và sắp lịch tổng duyệt | Kết luận nguyên nhân, kết cục |

Thời lượng: hiện nhắm khoảng 10 phút (ghi chú "Điều chỉnh tiến trình" ở đầu `docs/GDD.md`). Với khung trên, 20 đến 25 phút là hợp lý; nên quyết định con số này trước khi viết nội dung.

### C. Liên kết giữa các task (cơ chế)

1. **Manh mối dùng chung.** Mỗi màn trả về một cờ (ví dụ `clue.height`, `clue.captionFile`, `clue.sender`). Cờ được dùng ở màn sau: mã khóa lấy từ ngày trong chú thích; người gửi đầu tiên là đầu mối để hỏi ở Nhà E.
2. **Vật phẩm trong Sổ.** Thẻ thành viên, tệp ghi chú, bản gốc, bản đã sửa. Một số hội thoại và cánh cửa chỉ mở khi có vật phẩm.
3. **Cổng tiến trình mềm.** NPC không nói "chưa đủ điều kiện" một cách cứng; họ nhờ mang thứ còn thiếu, và người chơi vẫn đi lại tự do (không timer, đúng quy định AGENTS.md).
4. **Gọi lại lựa chọn (callback).** Lựa chọn ở bàn giao 1 xuất hiện lại ở tổng duyệt hoặc kết cục: "Hôm trước cậu giữ cả hai bản, nhờ vậy giờ mới đối chiếu được."
5. **Tin nhắn nhóm.** Một khung tin nhắn ngắn cập nhật theo tiến trình, nơi NPC bổ sung tin giữa các chương và nhắc điểm hẹn tiếp theo.
6. **NPC di chuyển theo chương.** Linh sang sân USSH ở chương II, Đức chuyển từ T3 ra sân cỏ lúc tổng duyệt… (dữ liệu `node` theo chương thay vì cố định).
7. **Dòng thời gian cuối game.** Màn kết hiển thị chuỗi nhân quả: lựa chọn nào dẫn tới kết quả nào. Đây là chỗ biến "vá" thành "dệt".

### D. NPC: vai trò và cách tương tác

Giữ nguyên 12 nhân vật hiện có (tên trong `vi.json`, đều hư cấu, không đại diện đơn vị thật), nhưng cho mỗi người một mục tiêu riêng và ba nhịp xuất hiện: gặp lần 1, gặp lại (callback), chốt.

| NPC | Gợi ý vai trò | Quan hệ cặp |
|---|---|---|
| Chị Chủ nhiệm (t3) | Người giao việc, giữ bản sao lưu; lo cho cả nhóm | Tin tưởng Đức, tò mò về người mới |
| Thành viên Ban Học tập (lawn) | Thầy giáo nhỏ cho mạch 1–2; từng là người mới giống bạn | Cùng nhóm với Hà |
| Hà (lawn) | Giữ bản đèn cũ, ngại báo lỗi: nhánh "nói ra lỗi" | Nhờ Ban Học tập kiểm cùng |
| Minh (gate) | Người đón, nhắc về "hai bản cùng tên" | Chuyển lời từ cổng đến T3 |
| Nam (canteen) | Người chuyển tệp, giữ tin nhắn gửi | Đầu mối lần ngược người gửi |
| Vy (cross) | Người sửa lỗi đồng bộ (tệp ghi chú bị bỏ sót) | Cần Linh xác nhận |
| Đại diện USSH (e) + Linh (e) | Giữ tư liệu và lời ghi; không muốn bị sửa giọng | Linh gặp An ở sân |
| An (court) | Khán giả thử, nhìn bằng mắt người ngoài | Phản hồi Bảo về nhịp cảnh |
| Điều phối sân khấu + Bảo (c) | Lên lịch cảnh, rút bớt hoặc đổi thứ tự | Thương lượng với Linh về lời ghi |
| Đức (t3) | Phụ trách tổng duyệt, nhận bàn giao cuối | Gom bằng chứng từ mọi người |

Kiểu tương tác nên có thêm (ngoài "Trò chuyện" và "Hỏi"):
- **Chủ đề hỏi:** mỗi NPC có 2–3 chủ đề, mở dần theo tiến trình (thay cho một nút hỏi duy nhất).
- **Nhờ việc phụ:** nhiệm vụ nhỏ, không bắt buộc, trả thưởng bằng chi tiết cốt truyện hoặc mục Sổ tay, không bằng điểm.
- **Đưa vật phẩm:** đưa tệp, ảnh hoặc bản cho đúng người và nhận phản hồi khác nhau.
- **Đi cùng một đoạn:** một NPC theo sau trên đường từ Căng tin sang USSH và bình luận (giải thích đồ thị, chỉ đường).
- **Phản ứng theo hành động:** lời thoại thay đổi tùy bạn đã giữ hay bỏ ghi chú, đã báo lỗi hay giấu.
- **Thoại ambient riêng cho từng người** (ít nhất 3 câu xoay vòng theo chương), bỏ câu dùng chung hiện tại.
- Độ thân thiết (nếu có) chỉ mở thêm lời thoại, **không phạt** và không hiện thành điểm số.

### E. Minigame

Nguyên tắc: không đồng hồ đếm ngược, không nhấp nháy quá 3 lần/giây, không lửa hay khói thật, chơi tốt ở màn ngang 844×390 (AGENTS.md). Mỗi minigame 1–2 phút, có gợi ý ba bậc như các màn hiện có.

**Tái dùng mô-đun đã có (ít công, nhiều giá trị):**

| Minigame | Điểm dừng / NPC | Mô-đun | Gắn cốt truyện |
|---|---|---|---|
| Căn dải sáng | lawn / Ban Học tập | `plot-limit`, `series` | Đo độ cao thật, lệch bao nhiêu |
| Chỉnh hướng chiếu | lawn / Ban Học tập | `beam-order` | Thứ tự phép quay ảnh hưởng hướng tia |
| Tìm đường chuyển tư liệu | canteen, cross / Nam | `graph` | Dùng đúng đồ thị lối đi trong `map.json` (đường đi ngắn nhất, đường Euler) |
| Mở tủ tư liệu | canteen / Nam | `modular` | Mật mã suy ra từ ngày ghi trong chú thích |
| Chọn bốn cảnh trong tám | c / Bảo | `count` | C(8,4) = 70 cách; liên hệ trực tiếp với số 70 |
| Xếp dàn drone cho cảnh mở đầu | c / Điều phối sân khấu | `block-vm` | Cảnh có chữ "70" |

**Minigame mới (thay cho khuôn "sắp 4 thẻ" lặp lại):**

| Tên gợi ý | NPC | Cơ chế | Kiến thức Toán – Tin |
|---|---|---|---|
| Ghép ảnh với lời ghi | Linh | Kéo thả ảnh vào đúng chú thích; chọn đặt cạnh nhau hay cảnh riêng | Giữ nguồn, không cần công thức |
| Hai bản cùng tên | Minh | So sánh hai bản (số dòng, ngày, mã băm rút gọn), tìm điểm khác | Đối chiếu phiên bản, băm |
| Bắt lỗi đồng bộ | Vy | Bật/tắt từng thư mục trong danh sách, chạy thử, xem tệp nào thiếu | Logic điều kiện, gỡ lỗi |
| Thứ tự tổng duyệt | Đức | Xếp các cảnh có phụ thuộc ("cảnh B cần A xong") | Sắp xếp tô-pô (topological sort) |
| Nhịp chữ và hiệu ứng | An | Kéo thanh trượt chỉnh thời gian hiện chữ so với hiệu ứng | Biến thiên liên tục, thời lượng hợp lý |
| Thắp đèn lối đi | tự do | Lượm đèn nhỏ rải theo đường đi, mỗi đèn mở một mẩu tin trong Sổ | Khám phá, hỗ trợ chế độ Dạo chơi |

Tất cả minigame mới đi qua chung một giao diện `activity` có kiểu (`type`) trong `story.json`, chấm điểm bằng hàm thuần ở `puzzles/logic` (để `check:answers` kiểm được).

### F. Kết cục và hệ quả

- Thay công thức đếm câu đúng bằng **ma trận kết cục** dựa trên: số bằng chứng thu được, cách xử lý ba sai sót (báo hay giấu, đối chiếu hay đoán, giữ hay sửa lời ghi), và độ tin cậy từng NPC.
- **Đã thay bằng `ENDINGS.md`** (E1–E6, trong đó E2 nổ tung chiếm 70%). Ý cũ giữ lại: kết cục phải truy được về lựa chọn cụ thể.
- Cảnh chạy Đêm Hội tụ dùng lại đúng thứ người chơi đã làm (độ cao, góc, ảnh, lời ghi).
- Mười hai "lời kết ngắn" của NPC, mỗi người một câu phụ thuộc vào cách bạn đối xử với họ.
- Lựa chọn "listen / build" ở prologue phải đổi hẳn một nhánh thoại ở mỗi chương, không chỉ một câu.

### G. Nội dung phụ

- Sổ tay 7 sự thật về số 70 (GDD 5.3): mỗi sự thật mở khi thu đủ bằng chứng của mạch tương ứng, thay vì khi bấm xong màn.
- Thư viện "tư liệu USSH": ảnh (hình minh họa vẽ, không dùng ảnh thật của người thật) cùng lời ghi; mỗi mục mở trong Sổ.
- Thành tựu gắn với cốt truyện (không phạt): "Hỏi đủ chủ đề", "Gỡ đúng nguyên nhân", "Giữ trọn lời ghi".
- Thoại Dạo chơi: giữ lint hiện có (≤ 20 từ mỗi câu, ≤ 3 số, không thuật ngữ).

---

## 3. Cần bạn quyết trước khi giao việc (mình đã đặt mặc định trong prompt)

1. **Nội dung lịch sử và triết học:** GDD đã được nới lỏng (docs/GDD.md mục 2.1), nên chi tiết lịch sử chỉ cần ở mức nền và có CLB xem qua.
2. **Độ dài mục tiêu:** mặc định 20–25 phút cho chuỗi chính, vẫn không có bất kỳ khóa thời gian nào.
3. **Bản đồ:** `mapVerified` vẫn `false`; mọi lời thoại có tên tòa nhà phải đi qua `map.json`, không viết cứng, để dễ sửa khi CLB xác nhận.

---

## 4. Bộ prompt

Cách dùng: mở dự án bằng tác tử lập trình (Claude Code, Aider…), dán **Bối cảnh chung** trước, sau đó dán lần lượt từng prompt giai đoạn. Làm tuần tự; sau mỗi giai đoạn duyệt kết quả rồi mới sang giai đoạn tiếp.

### Bối cảnh chung (dán đầu mỗi phiên)

````
Bạn đang làm việc trong dự án webgame-hamic ("Hội tụ 70", v2.7.0), game puzzle web cho CLB Toán Tin HAMIC (Khoa Toán, HUS). Người chơi là thành viên mới đi bộ trong sa bàn 3D khuôn viên USSH × HUS, trò chuyện với NPC, nhận nhiệm vụ.

Đọc trước khi làm bất cứ điều gì: AGENTS.md, docs/GDD.md, docs/WALKTHROUGH.md, web/public/data/story.json, web/public/data/map.json, web/public/data/i18n/vi.json (các khóa story.*), web/src/game/story.ts, web/src/ui/screens/walk.ts, web/src/puzzles/logic/story.ts, web/public/data/levels/circuits.json.

Hiện trạng cần sửa (đã kiểm trong mã):
- Sáu nhiệm vụ cốt truyện (story.json → tasks) chỉ là câu hỏi 2–3 lựa chọn, không dùng 11 mô-đun câu đố thật.
- Tám bàn giao (fieldwork) và ba tổng duyệt (rehearsal) đều dùng một khuôn: 4 câu thoại, 2 lựa chọn, rồi sắp 4 thẻ (hàm activity() trong walk.ts). Lựa chọn không để lại hệ quả.
- Thoại ambient của 8 NPC phụ giống hệt nhau.
- Kết cục chỉ phụ thuộc số câu đúng (storyEnding trong puzzles/logic/story.ts).
- Lựa chọn bond (listen/build) chỉ đổi một câu.

Ràng buộc bắt buộc (từ AGENTS.md và GDD):
- Nội dung nằm trong web/public/data; thêm nội dung = thêm dữ liệu, không viết cứng trong TS. Tên tòa nhà, vị trí chỉ lấy từ map.json (mapVerified vẫn false).
- Mọi chuỗi giao diện qua t("khóa") trong web/public/data/i18n/vi.json; chạy npm run check:strings.
- Luật chấm trong web/src/puzzles/logic phải là hàm thuần (không DOM, không ngẫu nhiên); chạy npm run check:answers và bổ sung ca kiểm cho mọi luật mới.
- Dữ liệu sinh tự động chỉ sửa qua content/gen_levels.py. Lint chế độ Dạo chơi: câu ≤ 20 từ, ≤ 3 số, không thuật ngữ; phải ra 0 vi phạm.
- Không timer đếm ngược, không chớp > 3 lần/giây, không lửa hay khói thật. Cảnh sa bàn "nổ" hoạt hình chỉ ở kết cục E2 theo docs/GDD.md mục 5.4. Không phạt người chơi.
- Giao diện: dùng token màu, phông Be Vietnam Pro, hàm btn() và ICONS có sẵn; bố cục ưu tiên màn ngang 844×390; mobile chỉ chạy ngang.
- Nhân vật đều hư cấu, không đại diện phát ngôn của đơn vị thật. Không dùng logo trường, ảnh thật hay người thật.
- StoryState lưu ở localStorage (storySave, version 3): nếu thêm trường thì tăng version, viết migration và sửa validate; không làm mất tiến độ cũ.
- Viết lời thoại tiếng Việt tự nhiên, ngắn; dùng skill humanizer trong .aider-desk/skills/humanizer để rà lại giọng văn.
- Trước khi giao: npm run check && npm run build, sau đó npm run capture và xem ảnh ở 844×390. Cập nhật CHANGELOG.md, docs/GDD.md (kể cả mục nội dung và danh sách kiểm tra tính nhạy cảm), docs/WALKTHROUGH.md và web/public/sw.js nếu danh sách tệp cache đổi.

Mặc định đã chốt (nêu rõ nếu bạn đề xuất khác): thời lượng chuỗi chính 20–25 phút; GDD đã nới lỏng nên nhắc thời chung mái nhà Đại học Tổng hợp Hà Nội và bài lượng – chất được giữ ở mức nền, câu đố vẫn là Toán – Tin; nhờ CLB xác nhận chi tiết lịch sử trước khi phát hành. Kết cục theo docs/ENDINGS.md (ưu tiên hơn mọi mô tả kết cục khác trong tài liệu này).
````

### Prompt 1. Thiết kế (chưa viết mã)

````
Nhiệm vụ: đại tu cốt truyện thành một câu chuyện liền mạch. Ở giai đoạn này CHỈ viết tài liệu thiết kế, chưa sửa mã hay dữ liệu game.

Tạo docs/STORY_BIBLE.md gồm:
1. Câu hỏi dẫn dắt và xương sống: "Vì sao sa bàn chạy thử bị lệch một đoạn?". Nguyên nhân cuối là ba sai sót nhỏ cộng dồn (nhầm phiên bản "hai bản cùng tên", tệp ghi chú bị bỏ sót khi đồng bộ, hai nhóm hiểu khác nhau về "bản chốt"); không có phản diện. Dùng lại các mầm này đã có trong story.json (fieldwork, rehearsal).
2. Bản đồ chương: Mở đầu, I, II-a, II-b, III, gắn với các node trong map.json; mỗi điểm dừng ghi rõ NPC, minigame, bằng chứng thu được, cờ trạng thái tạo ra và cờ được tiêu thụ.
3. Đồ thị manh mối: bảng cờ (tên cờ, nơi tạo, nơi dùng, hệ quả hội thoại). Mọi cờ phải được dùng ít nhất một lần.
4. Hồ sơ 12 NPC (chief, math, history, stage, minh, ha, nam, linh, an, bao, vy, duc): mục tiêu, giọng nói, 3 nhịp xuất hiện (lần đầu, gặp lại, chốt), chủ đề hỏi (2–3), vật phẩm có thể nhận hoặc đưa, nơi đứng theo từng chương (có thể đổi node), quan hệ với NPC khác.
5. Kết cục: theo docs/ENDINGS.md (E1–E6, tỉ lệ trong config.json). Mô tả cách lựa chọn quyết định nguyên nhân hiển thị của E2 và "dòng thời gian nhân quả" ở màn kết.
6. Danh sách minigame: sáu cái tái dùng mô-đun (plot-limit/series, beam-order, graph trên chính walk.edges, modular, count, block-vm) và các cái mới (ghép ảnh với lời ghi, hai bản cùng tên, bắt lỗi đồng bộ, thứ tự tổng duyệt có phụ thuộc, nhịp chữ và hiệu ứng, thắp đèn lối đi). Với mỗi cái: điểm dừng, NPC, cơ chế, luật chấm (viết được thành hàm thuần), 3 bậc gợi ý, kiến thức Toán – Tin, thời lượng 1–2 phút, ghi chú trợ năng.
7. Đề xuất thay đổi schema story.json và StoryState (tách rõ phần dữ liệu và phần mã), kèm kế hoạch migration từ version 3.
8. Rủi ro và việc cần CLB xác nhận.

Kết thúc bằng danh sách câu hỏi mở (tối đa 5) rồi DỪNG chỉ khi gặp vướng mắc không tự quyết được; nếu không, ghi quyết định vào bible và làm tiếp. Không sửa tệp nào ngoài docs/STORY_BIBLE.md ở giai đoạn này.
````

### Prompt 2. Động cơ và dữ liệu (sau khi duyệt bible)

````
Dựa trên docs/STORY_BIBLE.md đã duyệt, xây phần hạ tầng cho cốt truyện mới. Chưa viết lời thoại hàng loạt.

1. Mở rộng schema story.json theo đúng bible: chương, điểm dừng, nhiệm vụ có kiểu (type: dialogue | puzzle | activity), cờ tạo ra/tiêu thụ, điều kiện mở (requires), NPC theo chương (vị trí đổi theo chapter), chủ đề hỏi, vật phẩm.
2. Mở rộng StoryState (tăng version, migration từ 3, validate): thêm clues/flags, items, trust theo NPC (số nguyên không âm, không phạt), chapter, topicsAsked. Tiến độ cũ phải còn dùng được.
3. Viết hàm thuần trong puzzles/logic/story.ts: kiểm điều kiện mở, tính kết cục từ ma trận, dựng dòng thời gian nhân quả. Thêm ca kiểm vào check-answers để mọi tổ hợp cờ cho ra kết cục xác định và không bao giờ cho ra trạng thái kẹt (không có cổng không thể mở).
4. Sửa walk.ts để: đọc NPC theo chương; mở puzzle thật của các mô-đun hiện có từ điểm dừng (tái dùng views/logic trong web/src/puzzles, không sao chép mã); có khung tin nhắn nhóm; có Sổ hiển thị bằng chứng, vật phẩm và dòng thời gian.
5. Giữ chế độ developerMode/Hack mode hoạt động (xem trước kết cục, nhảy chương).
6. Với dữ liệu hiện có, chỉ chuyển sang schema mới mà chưa đổi lời; game phải chạy được y như cũ trong giai đoạn này.

Chạy npm run check && npm run build. Liệt kê thay đổi theo tệp, nêu rõ phần nào chưa làm. Cập nhật CHANGELOG.md.
````

### Prompt 3. Nội dung và NPC

````
Dựa trên docs/STORY_BIBLE.md và hạ tầng mới, viết nội dung cốt truyện và hội thoại đầy đủ vào web/public/data/story.json và web/public/data/i18n/vi.json (khóa story.*).

Yêu cầu:
- Viết theo chương, theo đúng hồ sơ NPC trong bible: giọng riêng, mục tiêu riêng, ba nhịp xuất hiện, 2–3 chủ đề hỏi mỗi người, thoại ambient riêng xoay vòng theo chương (bỏ câu "Cậu cứ làm việc đang nhận trước nhé…" dùng chung).
- Lựa chọn của người chơi phải để lại hệ quả: đặt cờ, đổi thoại ở chương sau, đổi kết cục. Mỗi cờ trong bible phải được dùng.
- Lựa chọn bond listen/build phải dẫn tới nhánh thoại khác ở mỗi chương.
- Mười hai lời kết ngắn của NPC phụ thuộc vào cách người chơi đối xử.
- Mỗi câu thoại ≤ 3 câu ngắn; nhịp đối thoại tự nhiên, không rập khuôn "Cậu... nhé" lặp lại. Rà bằng skill humanizer.
- Giữ lời thoại chế độ Dạo chơi trong lint (≤ 20 từ, ≤ 3 số, không thuật ngữ).
- Câu đố giữ là Toán – Tin; lượng – chất và thời chung mái nhà Đại học Tổng hợp Hà Nội chỉ ở mức nền, chính xác, trân trọng.
- Tên địa điểm lấy từ map.json qua t("story.place.*"); không viết cứng tên tòa nhà.
- Dùng đúng vai hư cấu, không nói thay đơn vị thật.

Trước khi viết, in ra bảng kiểm: mỗi cờ - nơi tạo - nơi dùng - câu thoại bị ảnh hưởng. Sau khi viết, chạy npm run check:strings và kiểm không còn khóa mồ côi. Tạo thêm docs/WALKTHROUGH.md mục "Bản 2.8" mô tả luồng mới, các nhánh và kết cục.
````

### Prompt 4. Minigame

````
Cài đặt các minigame theo docs/STORY_BIBLE.md, mỗi cái nối vào điểm dừng và NPC đã định.

Phần A (tái dùng): nối các mô-đun plot-limit/series, beam-order, graph, modular, count, block-vm vào đúng điểm dừng; đề lấy từ levels hiện có hoặc cấu hình ngắn trong story.json (không viết cứng). Với graph, dựng đề từ chính walk.nodes và walk.edges của map.json; với modular, mã khóa suy ra từ ngày trong chú thích ảnh đã được người chơi thu được.

Phần B (mới): ghép ảnh với lời ghi; hai bản cùng tên; bắt lỗi đồng bộ; thứ tự tổng duyệt có phụ thuộc (kiểm bằng sắp xếp tô-pô); nhịp chữ và hiệu ứng (thanh trượt); thắp đèn lối đi. Tất cả dùng một giao diện activity có type trong story.json thay cho khuôn "sắp 4 thẻ" cũ. Mỗi cái:
- luật chấm là hàm thuần trong web/src/puzzles/logic với ca kiểm trong check-answers (đáp án đúng, sai, và mọi đáp án hợp lệ);
- ba bậc gợi ý, không bắt buộc thắng ngay, không timer, không phạt;
- điều khiển chạm và bàn phím, nhãn rõ cho trình đọc màn hình, tôn trọng "Giảm hiệu ứng ánh sáng";
- bố cục dùng được ở 844×390;
- mỗi lần hoàn thành ghi cờ/bằng chứng theo bible.

Chạy npm run check && npm run build, rồi npm run capture và xem ảnh từng minigame ở 844×390. Báo cáo minigame nào chưa đạt và vì sao.
````

### Prompt 5. Kết cục, kiểm thử và rà soát

````
Hoàn thiện và kiểm toàn bộ.

1. Cài hệ thống kết cục theo docs/ENDINGS.md (bỏ qua mọi mô tả ma trận kết cục cũ) và màn kết (dòng thời gian nhân quả, 12 lời kết NPC, cảnh E1 dùng lại độ cao/góc/ảnh/lời ghi người chơi đã tạo).
2. Viết kịch bản kiểm tự động (script Node hoặc Playwright trong web/scripts) đi hết các nhánh chính: bond listen và build, cả ba bậc khó, ba hạng kết cục. Xác nhận: không có trạng thái kẹt, không khóa tiến trình, tiến độ lưu và khôi phục đúng sau khi tải lại, tiến độ version 3 cũ còn mở được.
3. Kiểm thời lượng: ước lượng thời gian chơi của đường ngắn nhất và đường đầy đủ, báo cáo trong CHANGELOG.
4. Rà nội dung: lint Dạo chơi 0 vi phạm; không còn khóa vi.json mồ côi; lời thoại có tên tòa nhà đều lấy qua map.json; chi tiết lịch sử không dài hơn mức nền; lời thoại các NPC không trùng lặp ngoài ý muốn.
5. Cập nhật docs/GDD.md (nội dung, danh sách kiểm tra tính nhạy cảm, phụ lục việc cần CLB xác nhận), docs/WALKTHROUGH.md, CHANGELOG.md, tăng version trong package.json và config.json.
6. Chạy npm run check && npm run build && npm run capture; đính kèm danh sách ảnh đã xem.

Báo cáo ngắn: đã làm gì, chưa làm gì, rủi ro còn lại, việc cần CLB xác nhận.
````
