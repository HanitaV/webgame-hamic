# Hội tụ 70

Game kể chuyện và khám phá khuôn viên USSH × HUS, bản 2.7. Bạn là thành viên mới HAMIC, đi gặp các bạn trong nhóm để mang ánh sáng và ký ức về cho buổi diễn. Có hội thoại, nhật ký, ba nhịp chơi và ba kết cục. Các câu đố Toán – Tin nằm trong phần việc của câu chuyện và các mode mở rộng tự chọn.

![Màn hình chính](docs/screenshots/phone-title.png)

## Chạy

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm run check      # kiểm đáp án/nội dung (1129 phép) + kiểm chuỗi giao diện
npm run build      # tsc + vite → web/dist (tĩnh, chạy offline)
```

Sinh lại dữ liệu màn chơi (Python 3, không cần thư viện ngoài):

```bash
python3 content/gen_levels.py --out web/public/data   # 266 màn, 445 phép kiểm, lint chuỗi, sha256 cố định
```

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `web/` | Game (Vite + TypeScript + Three.js). Không backend, không gửi dữ liệu. |
| `web/public/data/` | Toàn bộ nội dung dạng dữ liệu: `config.json`, `levels/circuits.json`, `achievements.json`, `facts.json`, `i18n/vi.json`, dữ liệu sinh tự động. |
| `web/src/puzzles/logic/` | Luật chấm thuần (không DOM), được `check-answers` kiểm độc lập. |
| `web/src/puzzles/views/`, `web/src/ui/` | Giao diện. |
| `content/` | `gen_levels.py` (2.3) và bản dữ liệu gốc v2.2 để đối chiếu. |
| `docs/` | GDD, ảnh chụp màn hình. |
| `legacy/campus/` | Game khám phá khuôn viên cũ và dữ liệu gốc của bản đồ; không còn được build. Bản đồ trong game sinh từ đây bằng `web/scripts/build-map.mjs`. |
| `.claude/skills`, `.agents/skills` | Skill gamedev + taste-skill cho tác tử AI (kèm giấy phép gốc). |

## Ràng buộc nội dung (từ GDD)

- Câu chuyện hư cấu về nhóm HAMIC và các bạn USSH; kiến thức Toán – Tin và ví dụ khái niệm được tách khỏi khẳng định về sự kiện thật. Không người thật, không logo.
- Mô hình là bản đồ khối USSH × HUS có tên tòa nhà (đổi so với GDD 2.2, xem `docs/GDD.md` mục 5.1). Bản đồ là ước lượng, cần CLB xác nhận rồi đặt `mapVerified: true` trong `web/public/data/map.json`.
- Không đếm ngược, không thành tựu tiêu cực, không hình ảnh phá hủy/cháy/nổ.
- Hiệu ứng sáng không nhấp nháy quá 3 lần/giây; có tùy chọn giảm ánh sáng, giảm chuyển động, màu cho người khiếm sắc.
- Điện thoại chỉ chơi ngang (màn che khi cầm dọc, khóa hướng khi vào toàn màn hình).
- Câu chúc ở màn cuối còn chờ xác nhận (`greetingVerified: false` trong `config.json`).

Xem `CHANGELOG.md` cho thay đổi theo phiên bản, `AGENTS.md` cho quy ước khi sửa mã.


## Đi dạo làm nhiệm vụ · bản mô phỏng 70 năm

Bấm **Bắt đầu câu chuyện** hoặc **Tiếp tục câu chuyện** ở màn chính. Đi bằng **WASD / mũi tên**, nút cảm ứng, hoặc **Đi tới nhiệm vụ** để nhân vật tự đi theo tuyến. Tới gần NPC rồi bấm **E / Trò chuyện**. Đi từ cổng HUS tới T3, ra sân cỏ, qua lối Căng tin sang Nhà E và sân khấu USSH, rồi về T3 chạy mô phỏng. Năm lựa chọn được lưu tự động, có ba kết cục và nút chơi lại. Các câu đố cũ nằm ở **Bản vẽ kỹ thuật**.

Xem [kịch bản và thiết kế NPC](docs/WALKTHROUGH.md). Tọa độ là ước lượng; nhân vật và sự cố là hư cấu. Không có đếm ngược, cháy nổ hay chớp màu nhanh.

## Hack mode / Developer mode (ẩn)

Không có nút bật trong menu. Nhấn **Ctrl + Shift + H** để bật/tắt, hoặc mở trang với **`?hack=70`** (ví dụ `http://localhost:5173/?hack=70`). Khi bật bằng phím tắt, game quay về màn chính. Bật qua URL có hiệu lực mỗi lần tải URL đó; bỏ tham số để trở lại chế độ thường.

Hack mode mở toàn bộ màn câu đố, sao, các mạch, màn diễn, sổ tay và thành tựu trong phiên hiện tại. Mở câu chuyện để thấy ba nút xem thử kết cục mà không cần làm task. Tiến độ mở khóa và lựa chọn nhiệm vụ trong Hack mode chỉ ở bộ nhớ, không ghi đè bản lưu thật. Mục “Kiểm thử từng nhiệm vụ” cho chọn và đi tới bất kỳ trạm nào. Đây là tiện ích kiểm thử phía trình duyệt, không phải cơ chế bảo mật.


## Câu chuyện và độ khó (2.5)

Chọn **Cốt truyện / Cân bằng / Thử thách** ngay màn bắt đầu. Cốt truyện dùng lựa chọn tình huống và gợi ý; Cân bằng thêm kiểm tra ngắn; Thử thách có ba phương án cần suy luận. Độ khó được nhớ sau khi tải lại. Đổi mức không xóa các quyết định đã lưu.

Câu chuyện có lời mở đầu, động cơ của nhân vật, hội thoại nhiều lượt, câu hỏi thêm dành cho NPC, lời nhắn trên đường đi và **Nhật ký dự án**. Kết thúc thay đổi cả theo cấu hình lẫn những cuộc trò chuyện đã tham gia. **Tiếp tục câu chuyện** giữ tiến độ; **Bắt đầu một câu chuyện mới** chỉ đặt lại phần truyện sau khi xác nhận. Bản lưu cũ tự chuyển sang định dạng mới.

Các mode phụ trở thành phần việc của cùng nhóm: thắp đèn ở Dạo chơi, ca trực hằng ngày, buổi tập kỹ năng, ba chặng chào khách và phòng máy tự thử. Hằng ngày và Luyện tập dùng nhóm mức theo lựa chọn ở menu. Dạo chơi luôn giữ mức dễ đọc 1–2; Khách và các bản vẽ viết tay giữ nội dung cố định. Xem bảng chi tiết trong [WALKTHROUGH](docs/WALKTHROUGH.md).

Nhân vật và NPC đã dùng tỷ lệ 1,75 đơn vị layout thay vì cao gần bằng tòa nhà. Camera theo gần và tránh hình học che tầm nhìn. Bộ kiểm thử yêu cầu Node 22.15 trở lên.


## Lời thoại, tương tác và ánh sáng (2.6)

Lời thoại đã được biên tập bằng skill Humanizer: các bạn trao đổi việc đang làm, hỏi lại chỗ chưa rõ, có giọng riêng. Các công thức, đáp án và thông tin lịch sử được giữ nguyên.

Tới gần một NPC rồi dùng **E**, **Trò chuyện** hoặc **chạm/bấm vào nhân vật**. Khoảng cách được tính từ NPC thật. Có thể nói chuyện với NPC ngoài chặng hiện tại; những cuộc gặp ấy không làm nhảy nhiệm vụ. Tên người ở gần xuất hiện dưới nút trò chuyện.

Camera giữ khoảng cách khi tòa nhà che nhân vật. Khối nhà đó mờ đi và trở lại như cũ sau khi đi qua; người chơi vẫn hiện rõ. Khung bao tòa nhà được tính sẵn để tránh dò toàn bộ tam giác mỗi khung hình.

Câu chuyện bắt đầu lúc còn nắng. Trời ngả chiều sau khi thử độ cao, chạng vạng bên USSH, rồi tối khi trở về T3. Đèn sân và sao hiện dần theo đó. Ánh sáng theo tiến độ, không theo đồng hồ thật; tải lại giữ đúng chặng đang chơi. Các màn diễn luôn dùng ánh sáng ban đêm, rồi trả về thời điểm của câu chuyện khi rời màn.


## Tiến trình bàn giao và tổng duyệt

Không có đồng hồ hay khóa kết cục theo số phút. Mục tiêu thời lượng khoảng 10 phút đến từ các chặng đi bộ, tám cuộc gặp có thao tác xếp việc, năm quyết định chính và ba cảnh tổng duyệt. Người đọc nhanh có thể hoàn thành sớm hơn; không bắt đứng chờ.

Các phần bàn giao nối theo thứ tự Minh → Hà → Nam → Linh → An → Bảo → Vy → Đức. Mỗi chặng mở các việc tương ứng trước khi tiếp tục nhiệm vụ chính. Mỗi cuộc gặp có bốn bước cần xếp đúng thứ tự và xác nhận; chọn sai được xếp lại. Ba cảnh tổng duyệt chạy lần lượt, lưu sau mỗi cảnh. Cả ba kết cục dùng cùng tiến trình, chỉ nút xem thử Hack mode bỏ qua.

Menu có Tiết kiệm hiệu năng: 12 thay vì 48 sinh viên nền, giảm độ phân giải và chuyển động. Luôn giữ đủ 12 NPC tương tác. Bản lưu cũ giữ các bàn giao đã hoàn tất; thời gian cũ không còn được sử dụng.
