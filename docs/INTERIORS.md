# Mặt bằng nội thất và va chạm theo model

Game dùng `legacy/campus/data/collision.json` và `interiors.json`, được sinh cùng `campus_blockout.glb` bởi `legacy/campus/scripts/build_blockout.py`. Không tạo vật cản từ hình chữ nhật bao toàn tòa nhà. `mapVerified` và nội thất vẫn chưa được xác minh thực địa: số tầng và công năng dựa trên tài liệu trong dự án, vị trí phòng là mô phỏng từ nguồn dựng model.

## Đồng bộ

Từ thư mục gốc chạy `python web/scripts/sync-campus.py` sau khi dựng lại blockout. Script:

- Chép các khối tường/cột/vách/bậc thang từ nguồn dựng model vào `web/public/data/campus-collision.json`, kèm SHA-256 model nguồn.
- Tách mesh tầng trệt của từng nhóm nhà HUS thành GLB riêng ở `web/public/models/interiors/`, giữ nguyên hình học, vật dụng, màu và kết cấu phòng của model.
- Xuất mặt bằng, vùng sàn, vách ngăn, phòng học, lab, văn phòng và sảnh từ nguồn vào `web/public/data/interiors/{nhóm}.json`.
- Lấy lỗ cửa tầng trệt từ layout. Cả T1 và T2 giữ sảnh giữa ở khuôn viên và có hai cửa chuyển cảnh ở cạnh Tây/Đông của sảnh. `entrances` là danh sách cửa; `entrance` giữ cửa mặc định để tương thích. `entryBarriers` ngăn đi thẳng vào phần nội thất, chừa lối xuyên giữa hai tòa.
- Ghép hình học có sẵn của cánh Đông T1, T5, T4 và T3 vào `east-network.glb`/`east-network.json`. Giữ vị trí, các cửa nối và vùng sàn từ layout; chỉ cắt phần Tây T1 khỏi model của cụm này. Mỗi cửa vào cụm dùng chung bản đồ, không tải lại khi đi qua ranh giới tòa.
- Chỗ nối được dựng từ nguồn `build_blockout.py`: T3–T4 căn cùng trục/rộng bằng hành lang; ba tiếp giáp có sàn liên tục phủ hết khoảng giữa hai mép tường. Các đoạn tường giáp tòa khác không mang cửa sổ hay chân tường mặt ngoài. `junctions` trong dữ liệu cụm ghi vị trí để kiểm tra đường đi thẳng qua từng mối nối.
- Sinh `data/interiors/rooms/*.json` cho từng phòng tầng trệt, giữ số phòng/loại phòng và điểm đứng ngoài cửa theo hành lang. Nội thất riêng lấy từ các model phòng rộng, thay vì cắt một ô nhỏ của model khuôn viên.

## Phòng rộng và vật cản

Kích thước, hàng/cột bàn ghế, lối đi cần giữ và camera nằm trong `web/public/data/room-layouts.json`. `legacy/campus/scripts/build_blockout.py` dựng model cùng hộp va chạm của từng bàn, ghế, bàn thí nghiệm, tủ, kệ, tủ máy và thiết bị. Sinh lại riêng các phòng bằng:

```sh
python legacy/campus/scripts/build_blockout.py --rooms-only
python web/scripts/sync-campus.py
```

Lệnh dựng blockout đầy đủ cũng sinh các phòng này. Các GLB nằm ở `legacy/campus/assets/models/rooms/`, bản thông số sinh ở `legacy/campus/data/room_templates.json`; đồng bộ sẽ chép model vào `web/public/models/interiors/rooms/` và áp dụng cho từng map phòng. Model khuôn viên/hành lang và các cửa nối giữ nguyên vì phòng rộng chỉ tải sau khi xác nhận vào cửa.

Lab rộng 22×26, phòng học và phòng máy 26×28, giảng đường 30×34 đơn vị game. Đây là kích thước mô phỏng để chơi, không phải diện tích thực. Giữ lối vào trống, lối giữa và lối quanh các dãy bàn. Phòng máy có máy tính, màn hình, bàn phím, ghế và tủ máy phía sau; lab có các bàn thí nghiệm, ghế, thiết bị và tủ. Camera theo người chơi trong phòng rộng, sơ đồ nhỏ hiển thị cả các vật cản để chọn lối đi.

Va chạm dùng toàn bộ mặt bằng chiếm chỗ của vật dụng, kể cả khoảng dưới mặt bàn/ghế. Bàn phím, joystick và bấm để đi dùng cùng `Navigation`, không đi xuyên bàn ghế hoặc tìm đường tới điểm bên trong chúng. Bấm tới điểm trống sẽ vòng qua vật cản. Vùng va chạm và hình học được sinh cùng nhau để không lệch vị trí.

USSH vẫn là khối đóng, không được vào. Các khối HUS không có lỗ cửa trong model cũng không tự thêm cửa.

## Di chuyển và tải

Va chạm chỉ lấy các khối giao với dải thân nhân vật trên tầng trệt (0,2–1,7 đơn vị nguồn); sàn và dầm phía trên cửa không khóa lối đi. Bán kính ngoài trời lấy từ dữ liệu dựng model và nhân đúng tỷ lệ scene. Bàn phím, joystick, bấm đất và tự đi đều dùng cùng truy vấn va chạm; chia bước để không bỏ qua tường mỏng. Tìm đường A* và làm gọn đường đều kiểm tra cửa và vách thật, không vòng theo footprint.

T1 và T2: đi xuyên sảnh giữa bình thường trên bản đồ khuôn viên; tới cạnh Tây/Đông → xác nhận → vào hành lang tương ứng. T3–T5: tới cửa → xác nhận → vào cụm hành lang liên thông. Cánh Đông T1 ↔ T5 ↔ T4 ↔ T3 đi liên tục qua cửa nối có sẵn, không cần trở ra sân. Cánh Tây T1 nối với phần ngang phía Tây T1; từ đó qua sảnh giữa ở map lớn để sang cánh Đông. Không thêm hành lang kín xuyên khoảng sân trống phía Tây trên ảnh sơ đồ.

Tại cửa phòng: bấm Vào → xác nhận → tải JSON phòng riêng và hiển thị hình học/vật dụng của phòng đó. Các phòng học, giảng đường, lab, văn phòng giữ công năng từ nguồn; không đổi toàn bộ tòa thành giảng đường. Sơ đồ nhỏ và tên hành lang cập nhật theo tòa đang đứng trong cụm liên thông.

Trở lại hành lang sẽ tải lại hành lang và đặt người chơi đúng trước cửa phòng vừa vào. Khi ra sân, đổi vị trí nhân vật trong hành lang về hệ tọa độ khuôn viên, rồi teleport ra cửa gần nhất có đường đi tới và có điểm đứng ngoài hợp lệ. Cụm liên thông xét mọi cửa T1 Đông/T5/T4/T3; hành lang riêng chỉ xét cửa thuộc vùng đi được của nó. Nếu gọi thoát khi còn trong phòng, dùng vị trí cửa phòng đã lưu trong hành lang. Mọi bước chuyển có thể hủy trước khi tải. Lỗi tải giữ nguyên không gian hiện tại, có thể thử lại. Yêu cầu tải cũ bị hủy khi rời màn chơi. Model nội thất chỉ được thay khi tải thành công; model cũ, geometry, material và texture nhãn được giải phóng khi thay/thoát.

Camera theo nhân vật, cắt tường phía trên cao độ 1,5 và cắt theo vùng phòng/cánh đang mở. Nhãn và dấu vàng chỉ cửa phòng gần đó; sơ đồ nhỏ hiển thị phòng/cửa và cho bấm để đi. Bảng nhiệm vụ thu gọn khi ở trong để nhìn mặt bằng trên màn ngang thấp. Va chạm giới hạn đúng vùng sàn/phòng và chặn cửa cho tới khi xác nhận.

Hiện chỉ có tầng trệt tương tác; cầu thang vẫn theo hình học/vật cản nguồn, chưa có chuyển tầng. Vật dụng trên model tổng thể khuôn viên vẫn là hình minh họa; trong các map phòng riêng, bàn ghế và thiết bị đều chặn di chuyển. Các phòng giữ đúng loại từ nguồn, không đổi toàn bộ T1/T2 thành giảng đường.

## Kiểm tra

Từ `web`: `npm run check`, `npm run check:campus-links`, `npm run build`, chạy `npm run preview`, sau đó `npm run test:rooms`, `node scripts/campus-links-e2e.mjs` và `npm run capture`. Kiểm tra lối xuyên T1/T2, hai bên hành lang, đường tới mọi cửa phòng, tải map phòng/quay lại đúng vị trí, và đi liên tục từ T1 qua T5/T4 tới T3. Ảnh ở `output/portals-capture` và `output/connected-campus`, khung 844×390.

`npm run check:furniture` kiểm tra đủ 101 map phòng rộng cùng 10 kiểu nội thất: cửa vào trống, lối đi chính thông, điểm trong vật thể bị chặn. `npm run test:furniture` đi thực tế qua lab/phòng học/phòng máy bằng trình duyệt, dùng phím đi vào bàn/ghế để xác nhận va chạm, kiểm tra bấm vào vật thể không đi xuyên, và quay lại hành lang; đồng thời xác nhận văn phòng vẫn đóng theo quy định hiện có. Ảnh ở `output/furniture-capture`, khung 844×390.

`npm run test:nearest-exit` kiểm tra vào ở T1 rồi ra gần T5, vào T5 rồi ra gần T3, đổi sang cửa T5 khác với cửa ban đầu, hai bên T2 và cánh Tây T1, thoát từ map phòng riêng, và gọi thoát nhiều lần khi đã ở ngoài. So sánh vị trí sau khi thoát với tọa độ cửa trong `map.json`; ảnh ở `output/nearest-exit`, khung 844×390.

Render trình duyệt dùng GPU qua ANGLE Direct3D 11. Three.js/WebGL không có backend CUDA; đồng bộ dữ liệu là tác vụ đọc/ghi GLB/JSON trên CPU.
