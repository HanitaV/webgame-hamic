# Cutscene kết thúc

Sáu phim riêng, mỗi phim 16 giây, 1920×1080, 30 hình/giây. Dựng từ mô hình khuôn viên và mã Three.js của dự án; không dùng video bên ngoài. Bản đồ vẫn là ước lượng, không đổi `mapVerified`.

Mở đầu mỗi cảnh có sáu quadcopter với thân trắng, bốn tay đòn, vòng bảo vệ cánh quạt, càng đáp và bộ đèn dưới bụng. Ban đầu thấy rõ máy bay; đèn chuyển từ trắng sang màu từng mạch, drone bay lên và máy quay kéo ra xa. Từ giây 6,2–8,8, thân máy mờ dần trong khi đèn được giữ liên tục tại cùng vị trí, trở thành điểm sáng. Đoạn trình diễn riêng của từng ending bắt đầu sau 3,6 giây. E2 cho drone rời khu vực trước khi các khối nhà bung.

Trong lúc đi bộ, có hai drone thử đèn cạnh cổng và ba chiếc ở bãi cỏ. Vị trí và nhãn nằm trong `map.json → drone.stations`, lấy mốc từ node bản đồ. Khi giảm đồ họa, chỉ hiện một drone tại mỗi trạm.

Model dùng chung là `public/models/show-drone.glb`, sinh từ `src/scene/drone.ts` bằng `npm run build:drone`. Model có bốn rotor riêng, đèn riêng để đổi màu; không dùng tài sản ngoài dự án. Cánh quay chậm, không chớp đèn. Bật giảm chuyển động sẽ dừng cánh và nhấp nhô, bật giảm ánh sáng sẽ hạ đèn.

| Ending | Dàn cảnh |
|---|---|
| E1 | Máy quay hạ chậm về phía sân. Các loạt pháo hình quạt mở thành chùm cúc và liễu rủ. Đèn từ các nhà hội tụ, drone ghép 70. |
| E2 | Góc rộng xoay nhẹ. Tại giây 5,2, vòng xung lực vàng/xanh lan trên mặt đất, tia ngắn và mảnh màu bật ra, máy quay rung nhẹ rồi ổn định. Mỗi tòa nhà giữ nguyên hình khối, bay lên rồi hạ chậm giữa hoa giấy. Không có lửa, khói, người hay chớp sáng. Nguyên nhân và chú thích mô hình hiện bằng giao diện game. |
| E3 | Góc rộng bao quát hai trường. Cầu gồm nhiều dải sáng song song dần hiện ra; pháo ở hai đầu đáp lại nhau lệch một nhịp. |
| E4 | Đội hình drone ban đầu quay lưng về người xem, sau đó xoay để lộ 07. Pháo kết bằng một màn liễu vàng rủ, giữ đội hình sai để người chơi nhận ra. |
| E5 | Các loạt sao chổi bay lên liên tục, không tỏa chùm. Máy quay ngước dần, khuôn viên rời khỏi khung hình. |
| E6 | Hai loạt pháo mở màn rồi tắt dần. Drone tách thành các cụm ước 1, 2, 5, 7, 10, 14, 35, thử kéo về giữa rồi giãn ra trong các vòng quỹ đạo. Không ghép thành 70. |

## Hình ảnh

Nền đêm, vàng ấm, màu của từng mạch và điểm trắng dịu. Tia pháo là các dải liên tục, có vận tốc, lực cản, trọng lực và đuôi mờ; không dùng các chấm tròn để thể hiện chùm pháo. Bloom chỉ dùng trong bản render. Không nhấp nháy, không phủ trắng màn hình; các loạt pháo cách nhau ít nhất 0,9 giây.

## Render lại

Từ thư mục `web`, mở `npm run dev`, rồi chạy `npm run render:cinematics` ở tiến trình khác. Cần Chrome, FFmpeg và GPU hỗ trợ WebGL2. Công cụ từ chối SwiftShader/software renderer, ghi rõ GPU thực tế vào `public/cinematics/provenance.json`.

- Xem khung hình trước: `$env:PREVIEW='1'; npm run render:cinematics` (PowerShell). Bỏ biến PREVIEW trước khi xuất video.
- Chỉ dựng một số phim: `$env:ENDINGS='E1,E3'; npm run render:cinematics`.
- Nguồn dựng: `src/scene/world.ts`, `src/scene/fireworks.ts`, `src/render-cinematics.ts`.
- Công cụ xuất: `scripts/render-cinematics.mjs`. Hình được raster bằng GPU với đồng hồ cố định, sau đó mã hóa H.264 bằng FFmpeg. Trên máy RTX 3060 hiện tại, driver NVENC cũ hơn API của FFmpeg nên dùng libx264 để mã hóa; không cài hay thay driver.

## Phát trong game

Đường dẫn phim, ảnh đầu và âm thanh nằm trong `public/data/config.json → cinematics`. Chỉ tải tài sản của ending được chọn. Video phát inline bên dưới giao diện, không có controls, PiP, fullscreen hoặc nút play của trình duyệt. Phần tử video luôn muted để tự chạy; bản âm thanh riêng được phát đồng bộ qua bus SFX của game, theo âm lượng/tắt tiếng hiện hành. Bản MP4 cũng ghép AAC để xem trực tiếp ngoài game có tiếng. Khung cuối giữ làm nền cho bảng kết quả. Rời màn, chơi lại hoặc tua lại sẽ hủy phim và âm thanh.

Trong lúc phim hiện, dừng render cảnh 3D để tránh chạy cả hai. Nếu phim lỗi, chậm tải hoặc autoplay bị chặn, game dùng lại cảnh Three.js. Khi bật Giảm hiệu ứng ánh sáng hoặc Giảm chuyển động, luôn dùng cảnh trực tiếp đã giảm hiệu ứng, không phát phim đầy đủ. Nút Bỏ qua hoạt động với cả hai cách.

## Âm thanh

Tất cả âm thanh được tổng hợp riêng cho dự án: dao động nhiều lớp, nhiễu lọc, tiếng lách tách có biến thể và phòng vang stereo sinh bằng thuật toán. Không dùng bản nhạc hoặc mẫu âm thanh bên ngoài.

| Ending | Các lớp SFX |
|---|---|
| Chung | Rotor drone, chuông bật đèn lần lượt, gió nâng đội hình, nền hòa âm rất nhẹ. |
| E1 | Vút bay theo loạt, tiếng pháo trầm mềm và đuôi lách tách, hợp âm kết. |
| E2 | Âm tích lực, cú bụp trầm đúng giây 5,2, âm nảy đàn hồi, tiếng các khối chạm/rơi và hoa giấy. |
| E3 | Pháo đáp nhau trái/phải, dải gió đi qua cầu, hòa âm ngân sáng. |
| E4 | Gió khi xoay đội hình, tiếng trượt ngắn và hai nốt hài khi lộ 07. |
| E5 | Những tiếng vút và huýt gió lên cao liên tục, không có tiếng pháo tỏa chùm. |
| E6 | Bảy tiếng chuông stereo khi từng cụm ước hiện ra, hợp âm cuối còn lửng. |

Cue nằm trong `public/data/ending-audio.json`, nguồn tổng hợp tại `src/core/ending-score.ts`. Mỗi track chuẩn hóa hai lượt về khoảng -20 LUFS, trần true peak -2 dBTP; kiểm lại bản AAC sau mã hóa và lưu số đo ở `public/audio/endings/provenance.json`. Những cú impact được lọc mềm, không có tiếng nổ thật lớn.

Sau khi chạy dev server: `npm run render:ending-audio`, rồi `npm run mux:ending-audio`. Khi render lại hình, chạy lại bước mux để MP4 có tiếng. Trong game, `src/core/ending-audio.ts` đồng bộ bằng thời gian media; pause, seek, lỗi tải, ẩn trang và bỏ qua đều ngắt/resync âm thanh. Cảnh trực tiếp cũng dùng cùng track theo đồng hồ của cảnh. Chỉ giữ tối đa hai track đã giải mã trong cache.
