# Nhiệm vụ: tạo cảnh 3D USSH × HUS để chơi trên web và tái dùng làm video hài

Bạn là coding agent có quyền đọc/ghi trong thư mục project và chạy các lệnh local cần thiết. Hãy triển khai đến khi có bản chạy được và kết quả kiểm tra. Không chỉ đưa ra lời khuyên hoặc kế hoạch.

## 1. Ý định và mức độ chi tiết

Dựng chung khu USSH 336 và HUS 334 Nguyễn Trãi, Hà Nội thành một map 3D low-poly, màu phẳng, hình khối đơn giản. Người quen trường nhìn vào có cảm giác "tòa này ở chỗ này". Chủ đích là một web game indie hoặc video hài giải trí, không cần tái dựng kiến trúc chính xác, không cần texture chụp thật, không cần nội thất toàn bộ trường.

Ưu tiên theo thứ tự: chạy được → bố cục tương đối hợp lý → địa điểm nhận ra được → sửa nhanh → đẹp hơn. Dành công cho cổng/biển tên, đường vào, sân và vài khối nhà chính. Không triển khai hệ thống phức tạp không giúp demo.

## 2. Đọc các nguyên liệu trước khi làm

- `README_VI.md`, `docs/RESEARCH_NOTES.md`, `docs/ASSET_STATUS.md`.
- Quan sát `assets/references/user/campus_map_user.png` và `campus_satellite_user.png`. Đọc cả ảnh thay vì chỉ tên file.
- `data/sources.json` ghi link nguồn và loại ảnh. Nếu có mạng, thử chạy `python scripts/download_references.py` một lần; sau đó đọc report. Nếu thất bại, tiếp tục bằng ảnh cục bộ, không hỏi người dùng tải ảnh mới để có thể bắt đầu.
- Xem `previews/overview_seed.png` và `previews/topdown_seed.png` để hiểu seed. Hai ảnh này do bộ kit tự render, KHÔNG là ảnh xác nhận hiện trạng.
- `data/campus.layout.json` và `assets/models/campus_blockout.glb` là bố cục nháp có sẵn. Tất cả vị trí/chiều cao là ước lượng, có cả lựa chọn thiết kế để demo đi lại được. Chưa có tên nhà thật gán cho từng khối.

Không trộn tư liệu cơ sở 19 Lê Thánh Tông hoặc Mễ Trì vào Nguyễn Trãi. Phối cảnh cải tạo nhà C/đường vào sân E là thiết kế được công bố năm 2024; không gọi nó là ảnh chụp sau thi công. Sơ đồ 2021/2022 không tự động là hiện trạng 2026.

## 3. Chốt dữ liệu và scene

Đọc sơ đồ và ảnh để cải thiện seed khi có căn cứ. Giữ vị trí tương đối của khu USSH, HUS, mặt đường Nguyễn Trãi, khoảng sân và các trục đường nhìn được. Chỉ gán tên nhà thật khi đọc được nhãn trên ảnh/sơ đồ tương ứng; nếu chưa chắc, giữ neutral ID.

Mọi cấu hình tòa nhà nên nằm ở dữ liệu: id, campus, center_xz, size_xz, height, wall, roof, roof_color, verified_name, confidence, source_ids. Không dùng một bức ảnh tưởng tượng để khẳng định số đo. Giữ chiều cao theo tương quan dễ nhận biết; đơn vị seed là đơn vị game, không phải mét đo.

Có thể sửa `scripts/build_blockout.py` hoặc viết generator tương đương. Chọn một nguồn dữ liệu gốc duy nhất để tránh web và Blender dùng hai bố cục khác nhau. Nếu sửa layout, sinh lại GLB trước khi đóng gói đầu ra. Seed đã có nhà, mái, cửa sổ, cây ít mặt, ghế đá, cổng giả lập, xe máy đồ chơi và một đoạn đường sắt trên cao cách điệu.

Cổng nên có biển USSH và HUS đọc được; không cần logo chính thức. Thêm tên nhà ở mức vừa đủ nếu đã xác minh. Có sẵn `assets/signs.svg` để làm nền tảng. Không đưa nguyên ảnh bản đồ/ảnh người vào vật liệu cảnh. Có thể tăng nhẹ độ rộng lối đi hoặc kích thước biển để game dễ chơi; đánh dấu đó là lựa chọn thiết kế.

## 4. Bản web bắt buộc

Tạo project ở `web/`. Dùng Vite + TypeScript + Three.js; không cần React nếu không giúp giảm việc. Cài dependency theo phiên bản đang truy xuất được, lưu lockfile. Dùng tài liệu chính thức khi cần kiểm tra API. Không tải thư viện từ CDN lúc app chạy; bundle qua npm.

Bắt đầu bằng GLB cục bộ. Sao chép các model cần dùng vào `web/public/assets/` bằng script đồng bộ có thể chạy lại. Không để app runtime truy cập ra ngoài project để tìm model. Giữ màu và tương quan theo source scene; tránh tự đổi toàn bộ thành voxel hay kiến trúc fantasy.

Thiết lập `base: './'` để bản build static dễ host trong subdirectory. Mọi đường dẫn asset dùng cơ chế base URL của Vite hoặc URL tương đối phù hợp; không hardcode `/assets/...` làm hỏng GitHub Pages. Cấu hình thư mục output rõ trong README của web.

Bản đầu gồm:

1. Camera tổng quan có xoay, zoom và pan bằng chuột/touch.
2. Chế độ đi bộ đơn giản: WASD, chuột để nhìn khi người dùng chủ động click, Esc thoát pointer lock. Giữ camera trên mặt đất; va chạm AABB với thân nhà là đủ. Không cần physics engine, cầu thang hay nhảy trong bản đầu.
3. Nếu có pointer lock, giao diện phải hướng dẫn thao tác và không tự chiếm chuột khi vừa tải trang. Đi bộ mobile có thể dùng nút/joystick đơn giản, hoặc giữ chế độ orbit usable và nói rõ giới hạn.
4. Nút "USSH", "HUS", "Toàn cảnh" đặt lại camera ở các vị trí dễ nhận diện.
5. Bật/tắt nhãn tòa nhà và cây. Nếu ẩn cây để xem bố cục, không được xóa cây khỏi dữ liệu gốc.
6. Chế độ "Quay cảnh": camera di chuyển chậm theo một đường ngắn qua cổng/sân; có pause/reset và nút ẩn UI. Timeline phải có thời gian xác định để quay lại được, không dựa vào tăng frame không kiểm soát.
7. Một nhân vật hình capsule hoặc hộp với màu nổi để thử di chuyển, không cần rig hay animation phức tạp.
8. Một nhiệm vụ hài rất nhỏ: nhặt 3 "deadline" ở các điểm đi đến được rồi về cổng. Đây là game giả lập, không gắn với tuyên bố đời thật về trường hay người cụ thể.
9. UI tiếng Việt, ngắn, dùng phông hệ thống; thông báo tải/lỗi model và nút thử lại. Có ghi chú nhỏ "Bản đồ cách điệu, bố cục ước lượng" ở màn hình giới thiệu hoặc mục thông tin.

Chất lượng hình: nền sáng, ánh sáng dịu, cửa sổ tối, mái đỏ/xanh dịu, cây đơn giản. Camera mặc định nên thấy đủ cả hai trường. Hạn chế shadow map lớn, postprocessing và texture nặng. Đặt pixel ratio có trần hợp lý. Với nhiều cây/cửa sổ lặp, dùng instancing hoặc gộp mesh nếu cần; tránh hàng nghìn draw calls chỉ vì seed chia từng cửa sổ thành node.

## 5. Blender và video

Giữ khả năng tái dùng cùng GLB cho Blender. Đã có `scripts/blender_scene.py` để nhập scene và lưu/render ảnh. Kiểm tra phiên bản Blender thực sự có trước khi chạy.

Nếu Blender được cài: thực thi script, kiểm tra kết quả .blend và ảnh render; thêm 3 camera (tổng quan, cổng USSH, sân HUS) và một camera animation ngắn 8–12 giây nếu làm được trong phạm vi gọn. Camera/đèn cần theo hệ tọa độ Z-up của Blender sau khi nhập GLB, không dùng nhầm vị trí Y-up từ Three.js. Lưu .blend vào `output/` và ghi chính xác đã render những gì.

Nếu không có Blender: vẫn hoàn thành web và GLB, giữ script cùng hướng dẫn chạy Blender; ghi "chưa chạy Blender ở môi trường này". Không bắt cài Blender mới cho phép xem demo. Xuất video MP4 không bắt buộc; không được gọi ảnh preview hay camera path là video đã render.

## 6. Kiểm tra kết quả

- Chạy generator và kiểm tra GLB có thể tải, vật liệu hiện, mặt nhà không bị mất do winding/backface.
- Chạy typecheck nếu project đã cấu hình, và `npm run build`.
- Nếu có trình duyệt tự động, mở app từ server local, kiểm tra console không lỗi, chụp tối thiểu 3 ảnh: tổng quan, USSH, HUS. Không chỉ chụp màn hình trống hoặc cảnh loading.
- Thử đổi chế độ orbit/walk/cinematic, kiểm tra Esc, reset camera, va chạm và vị trí 3 vật phẩm đi đến được.
- Thử kích thước desktop và điện thoại. Không tuyên bố đã test thiết bị thật nếu chỉ giả lập viewport.
- Bản build static không cần backend, không phụ thuộc ảnh tham khảo trên website trường.
- Nếu không có browser, báo rõ giới hạn và ghi các lệnh build đã chạy, không bịa screenshot.

## 7. Đầu ra và cách kết thúc

Giữ source code đầy đủ, layout có thể sửa, model GLB, script generator, script Blender, README chạy local/build static, danh sách nguồn và các ảnh kiểm tra thực sự đã chụp.

Tạo `output/CHANGELOG.md` nêu: sửa bố cục nào, dựa vào ảnh nào, vị trí/tên nào còn ước lượng, lệnh nào chạy thành công và phần chưa kiểm chứng. Không sao chép placeholder "PASS" thay cho kết quả thực.

Không deploy, không publish và không push Git khi chưa được yêu cầu. Hoàn thành công việc local được ủy quyền. Câu trả lời cuối ngắn: file/project nằm ở đâu, lệnh chạy, điều đã test, giới hạn đáng chú ý.
