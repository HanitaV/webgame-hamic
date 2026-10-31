# Bản mô phỏng 70 năm — vòng chơi 2.4

Vòng chơi chính: đi bộ → tới gần NPC → trò chuyện → chọn cấu hình → đọc phản hồi → tới trạm tiếp theo → trở về T3 → chạy mô hình. Các mạch câu đố cũ ở mục Bản vẽ kỹ thuật.

Người chơi là thành viên mới HAMIC. Chị Chủ nhiệm, thành viên Ban Học tập, đại diện tư liệu và điều phối sân khấu USSH đều là nhân vật hư cấu. Nội dung hợp tác là kịch bản game, không phải thông báo về dự án thật hay lời phát ngôn của trường.

| Chặng | NPC / nơi gặp | Nội dung |
|---|---|---|
| Mở đầu | Chị Chủ nhiệm / trước Nhà T3 | Nhận việc từ cổng HUS |
| 1.1 | Ban Học tập / sân cỏ HUS | Giới hạn 70 + 1/x |
| 1.2 | Ban Học tập / sân cỏ HUS | Nghịch đảo ma trận quay trực giao |
| 2.1 | Đại diện USSH / phía Nhà E | Giữ bản gốc, cấu trúc và nguồn tư liệu |
| 2.2 | Điều phối / Nhà C–Sân khấu | Lượng–chất và điểm nút; phân biệt với kỹ thuật mạng |
| 3 | Chị Chủ nhiệm / trước Nhà T3 | Kiểm tra chương trình và chạy thử |

Câu hỏi và liên kết nhiệm vụ nằm ở `web/public/data/story.json`; toàn bộ câu chữ ở `i18n/vi.json`. Tuyến đi, vị trí và vai trò NPC nằm ở `map.json`. NPC gặp ở điểm tiếp nhận ngoài tòa nhà; bản này không mô phỏng phòng máy bên trong. Tọa độ dựa trên layout cũ; vẫn là ước lượng và giữ `mapVerified: false`.

Di chuyển bằng WASD, mũi tên hoặc nút cảm ứng. Tuyến đường sáng giới hạn khu vực đi bộ để tránh xuyên tòa nhà. Nút “Đi tới nhiệm vụ” tự dẫn nhân vật đi bộ theo tuyến, không dịch chuyển tức thời. Tới gần mới dùng E / Trò chuyện. Tiến độ lưu sau mỗi lựa chọn; rời màn hoặc tải lại không mất các lựa chọn đã lưu. Nhân vật bắt đầu lại ở cổng sau khi tải lại trang.

Năm quyết định tạo đúng 32 tổ hợp. Đúng 5/5: bản giao hưởng; đúng 2–4/5: khuôn viên đa sắc; đúng 0–1/5: mô hình không trọng lực. Không đánh giá tính cách hay phạt người chơi. Sau kết cục có thể chơi lại riêng kịch bản, giữ tiến độ câu đố cũ.

Điều chỉnh so với bản kịch bản đề xuất: không có giới hạn 15 phút; dùng dải sáng thay hình ảnh cháy nổ; màu đa sắc giữ ổn định; khối nhà chỉ nâng và trôi nhẹ trong mô phỏng. Giảm chuyển động dùng vị trí tĩnh, giảm ánh sáng giảm độ phát sáng. Không dùng thông báo “stack overflow” như hệ quả toán học thực tế của lựa chọn sai. Chuyển vị chỉ là nghịch đảo trong ví dụ ma trận trực giao. Phần lượng–chất là câu hỏi khái niệm, không dùng làm quy tắc kỹ thuật mạng.

Mô hình NPC tự dựng bằng Three.js trong `scene/walking.ts`: hình khối low-poly, áo theo màu vai trò, chân có chuyển động khi đi, ba lô cho người chơi, máy tính bảng cho HAMIC, tập tài liệu cho USSH, búi tóc phân biệt Chủ nhiệm. Không dùng ảnh người thật, logo hay tài sản tải ngoài. Mô hình được tạo lúc chạy, không có tệp GLB NPC riêng.

Hack mode chỉ dành kiểm tra: mở các mạch, sao, sổ tay, thành tựu trong bản tiến độ bộ nhớ riêng; cho xem ngay ba kết cục ở màn đi dạo. Không ghi các mở khóa giả vào tiến độ thật. Cách kích hoạt ở README.


## Bản 2.5 — câu chuyện là luồng chính

Màn bắt đầu có ba nhịp chơi, lưu tại `hoitu70:play` và áp dụng cho lựa chọn tiếp theo khi tiếp tục câu chuyện:

| Nhịp | Câu chuyện | Các bản thử |
|---|---|---|
| Cốt truyện | Quyết định tình huống, gợi ý từ đồng đội; không cần đọc công thức | Hằng ngày lấy mức 1–2; Luyện tập mặc định 1; có hỗ trợ khi giải màn |
| Cân bằng | Câu hỏi ngắn gắn với phần việc | Hằng ngày lấy mức 2–3; Luyện tập mặc định 3 |
| Thử thách | Ba phương án, cần suy luận cấu hình và điều kiện | Hằng ngày lấy mức 4–5; Luyện tập mặc định 5 |

Dạo chơi luôn giữ ngôn ngữ dễ đọc và chỉ lấy màn có lớp Dạo chơi mức 1–2: nhịp Cốt truyện lấy mức 1, hai nhịp còn lại lấy mức 1–2. Bộ bản vẽ viết tay giữ đề gốc; nhịp Cốt truyện bật hỗ trợ, hai nhịp kia không đổi dữ kiện. Khách giữ ba màn chào đón cố định. Phòng máy không chấm điểm. Không mode nào thêm giới hạn thời gian.

Mở đầu có ba lượt kể và lựa chọn động cơ: muốn lắng nghe ký ức, hoặc muốn giúp nhóm hoàn thành. Mỗi NPC có cảnh hội thoại, lời đáp theo động cơ, một nhánh hỏi thêm, quyết định công việc và phản hồi về hệ quả. Nội dung giải thích kỹ thuật đặt trong mục mở rộng; phần phản hồi chính kể chuyện của nhóm. Kết cục nhắc lại động cơ và việc người chơi đã hỏi thêm hay chưa.

Nhật ký ghi vật bàn giao, ý nghĩa của cuộc gặp, hệ quả quyết định và những cuộc trò chuyện đã hỏi thêm. Lời nhắn nhóm xuất hiện trên đường tới điểm hẹn. Hệ thống lưu câu chuyện chuyển lên phiên bản 2, tự nhập tiến độ phiên bản 1; không bắt người chơi cũ làm lại. Menu có Tiếp tục và Bắt đầu mới; bắt đầu mới cần xác nhận và chỉ xóa câu chuyện. Hack mode dùng bản ghi thử riêng.

Các mode mở rộng có lời giao việc và hồi đáp riêng: Dạo chơi gồm bốn lời nhờ thắp đèn; Hằng ngày có ba phần của ca trực; Luyện tập có mười lời nhờ theo kỹ năng; Khách có ba chặng chào đón; Phòng máy có ba bàn thử. Các bản thử luôn có đường quay về câu chuyện. Tiến độ hằng ngày phân biệt độ khó trong khóa `d:<ngày>~<nhịp>:<màn>`, nhưng số ngày hoàn tất chỉ tính một lần cho mỗi ngày lịch.

### Tỷ lệ nhân vật và camera

Chiều cao nhân vật là 1,75 đơn vị layout (0,175 đơn vị cảnh khi `map.scale = 0.1`), so với tòa nhà khoảng 12–28 đơn vị layout. Tất cả NPC và người chơi dùng cùng tỷ lệ; nhãn tên nằm riêng để không làm sai kích thước hình học. Đây là tỷ lệ thiết kế, không phải phép đo người hoặc khuôn viên thật. Chiều cao, tốc độ, khoảng trò chuyện và thông số camera ở `map.json → walk.avatar`.

Camera theo gần người chơi, làm mờ tòa nhà che tầm nhìn và giữ nguyên khoảng cách; vòng dưới chân giúp nhận ra người chơi. Nhãn mô hình tổng quan được ẩn khi đang đi bộ, nhãn NPC chỉ hiện khi ở gần.

### Kiểm tra

`npm run check` quét cả khóa của hội thoại, biến thể độ khó, mode mở rộng và NPC; kiểm tra đủ biến thể và nhóm màn hợp lệ. Bộ chạy TypeScript dùng API Node tích hợp (Node 22.15+; kiểm tra trên Node 24), không cần tra tài khoản hệ điều hành. `npm run capture` kiểm tra toàn tuyến, các câu hỏi thêm, nhật ký, nhập bản lưu cũ, đổi độ khó, ca trực, ba kết cục và giảm hiệu ứng ở 844×390, kèm các màn cũ ở máy tính.


## Bản 2.6

Humanizer được dùng để rà lời thoại, tin nhắn, lời kết và phần kể trong các mode. Bỏ các câu rút bài học lặp lại và các đoạn nói chung về công sức tập thể. Chủ nhiệm giao việc cụ thể; bạn Ban Học tập nói thân mật; các bạn USSH nhắc giữ ảnh, nguồn và chú thích. Nhánh động cơ và các đáp án vẫn có ý nghĩa như trước. Nội dung lịch sử và công thức không đổi.

Tương tác dùng khoảng cách tới mô hình NPC thay cho tâm điểm nhiệm vụ. Nút Trò chuyện và phím E ưu tiên NPC đang giao việc nếu ở gần; nếu không thì chọn người gần nhất. Bấm lên nhân vật cũng dùng cùng kiểm tra khoảng cách. NPC ngoài chặng có lời nhắc riêng trước/sau bàn giao; không cập nhật quyết định của nhiệm vụ. Lớp nền che tối toàn màn hình được bỏ khỏi màn đi bộ và không chặn thao tác chạm xuống canvas.

`map.json → atmosphere` quy định ánh sáng ở các bước 0, 2, 3, 4, 5, 6: còn nắng, nắng thấp, hoàng hôn, chạng vạng, tối và tối cho buổi diễn. Bầu trời, sương, nguồn sáng và mức sáng của đèn/sao chuyển dần; Giảm chuyển động dùng trạng thái tĩnh của chặng. Khi tải lại, áp dụng ngay thời điểm của bản lưu. Màn diễn tạm dùng khung cuối rồi trả về thời điểm đang lưu.

`walk.avatar.camera.occlusionOpacity` quy định độ mờ của nhà chắn tầm nhìn. Ba đoạn nối camera tới các độ cao của người chơi kiểm tra khung bao đã lưu; chỉ nhóm nhà chắn tầm nhìn được đổi vật liệu tạm. Rời tầm che hoặc màn đi bộ sẽ trả vật liệu gốc. Camera không thu cánh tay theo, và nhân vật được vẽ rõ trên phần nhà đã mờ. Khung bao phù hợp mô hình tĩnh; nếu sau này cho nhà di chuyển trong lúc đi bộ, phải cập nhật lại khung bao.

Kiểm thử trình duyệt thêm trường hợp đứng dưới T1, đứng lệch khỏi tâm điểm hẹn, nói với NPC ngoài nhiệm vụ, dùng E/nút/chạm, trả vật liệu và ánh sáng cuối truyện. Đo phép dò trên Chrome chạy phần mềm để kiểm tra chi phí CPU; số đo này không đại diện tốc độ GPU của máy người chơi.

Trong phép thử Chrome headless dùng đồ họa phần mềm, lượt dò khung bao dưới T1 đo khoảng 0,12 ms sau khi ổn định. Phép dò tam giác trước đó có lúc lên khoảng 203 ms trên đoạn T1. Đây là chi phí CPU của phép dò, không phải số FPS cam kết cho máy người chơi. Các nút di chuyển có panel tối riêng để đọc được cả lúc trời sáng.


## Tiến trình bàn giao và tổng duyệt

Không có đồng hồ hay khóa kết cục theo số phút. Mục tiêu thời lượng khoảng 10 phút đến từ các chặng đi bộ, tám cuộc gặp có thao tác xếp việc, năm quyết định chính và ba cảnh tổng duyệt. Người đọc nhanh có thể hoàn thành sớm hơn; không bắt đứng chờ.

Các phần bàn giao nối theo thứ tự Minh → Hà → Nam → Linh → An → Bảo → Vy → Đức. Mỗi chặng mở các việc tương ứng trước khi tiếp tục nhiệm vụ chính. Mỗi cuộc gặp có bốn bước cần xếp đúng thứ tự và xác nhận; chọn sai được xếp lại. Ba cảnh tổng duyệt chạy lần lượt, lưu sau mỗi cảnh. Cả ba kết cục dùng cùng tiến trình, chỉ nút xem thử Hack mode bỏ qua.

Sinh viên nền không đi khứ hồi một đoạn: họ ngồi nói chuyện trên ghế, đứng thành nhóm, bấm điện thoại, và ra vào cửa giảng đường. Nhà không có phòng bên trong, nên người vào giảng đường khuất ở ngưỡng cửa rồi đi ra. Chỗ đứng của NPC nhiệm vụ không đổi.

Menu có Tiết kiệm hiệu năng: 12 thay vì 48 sinh viên nền, giảm độ phân giải và chuyển động. Luôn giữ đủ 12 NPC tương tác. Bản lưu cũ giữ các bàn giao đã hoàn tất; thời gian cũ không còn được sử dụng.
