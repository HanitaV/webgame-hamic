# Ghi chú nghiên cứu — 29/10/2026

## Phạm vi

USSH 336 Nguyễn Trãi và HUS 334 Nguyễn Trãi, Hà Nội, đúng khu vực trong hai ảnh người dùng gửi. Nghiên cứu tập trung làm cảnh khối đơn giản cho game/video, không khảo sát kiến trúc.

## Kết quả có ích

1. Thông báo thi USSH 2025 có sơ đồ chung 334–336. Nguồn này giúp đối chiếu hai khu khi tải/đọc được ảnh.
2. Thông báo thi USSH 2022 có sơ đồ tên nhà A/B/C/E/G/I và các lối vào. Không coi tuổi đời sơ đồ là bằng chứng hiện trạng 2026.
3. HUS công bố ảnh nhìn từ trên xuống có nhãn T1/T3/T4/T5 và nhà G USSH trong hướng dẫn thi năm 2021.
4. Bài cải tạo USSH ngày 21/10/2024 mô tả trục đường từ cổng đến sân E, nhà C và giàn hoa giấy, kèm phối cảnh thiết kế. Bài ghi thời gian dự kiến triển khai tháng 10/2024 đến tháng 2/2025; không suy ra đã hoàn công đúng thiết kế chỉ từ lịch dự kiến.
5. Thông báo thi USSH tháng 5/2026 có sơ đồ phòng thi A-B/B-C/C/G/I. Đây là tài liệu phòng thi, không tự động xác nhận mọi footprint trong mô hình seed.
6. Bài HUS nhập học K70 năm 2025 có ảnh sảnh trường để tham khảo màu và mặt tiền.

URL đầy đủ nằm ở `data/sources.json`, không phụ thuộc ID trích dẫn của cuộc chat.

## Cách dùng tư liệu

Ảnh vệ tinh → ước lượng vị trí và dáng footprint. Sơ đồ có nhãn → kiểm chứng tên nhà. Ảnh mặt đất → nhịp cửa sổ, màu và dấu hiệu nhận diện. Mặt khuất và phần cây che → khối đơn giản, ghi là ước lượng. Không cần dựng nhiều chi tiết bị camera che.

## Phương án kỹ thuật

Dùng dữ liệu scene làm nguồn gốc duy nhất, sinh GLB, rồi dùng GLB cho Three.js và Blender. Vật liệu màu phẳng; các khối nhà không cần UV. Khi làm web, gộp hoặc instance các mesh lặp để giảm draw calls. Blender dùng để bố trí camera và render video nếu cần.

## Những gì chưa được làm

Mô hình seed chưa được canh khớp pixel hay gán tên nhà theo các sơ đồ bên ngoài. Các ảnh web đã tìm thấy qua tra cứu nhưng việc tải bytes về môi trường đóng gói bị chặn. Không có số đo khảo sát, bản vẽ kiến trúc hay suy luận chiều cao từ bóng đổ. Những điều này không cản trở một bản demo hài với khối đơn giản.

## Bổ sung 30/10/2026 — tầng và phòng HUS

- Bảng "Sơ đồ chỉ dẫn" HUS (người dùng gửi, `docs/map/hus_directory.png`) liệt kê phòng ban theo tầng: T1 tầng 1–4 (Kế hoạch – Tài chính, các văn phòng khoa, Ban Giám hiệu, Đào tạo, Sau đại học…), T2 tầng 2 và 5, T3 tầng 2/3/5, T4 tầng 1–5, T5 tầng 1–7 (tầng 7: Giảng đường lớn, Thư viện), tòa Chuyên đề tầng 1–4. Đây là căn cứ cho số tầng và tầng của từng phòng ban. Bảng không ghi năm.
- Danh sách phòng thí nghiệm mở cửa trên vnu.edu.vn (2014) cho thêm số phòng PTN ở T1, T2, T3, T5. Có hai chỗ trùng số (T2 106; T3 104–105), ghi gộp. Có thể đã cũ.
- Trang liên hệ Phòng Quản trị – Bảo vệ (P.309–312 nhà T1) và Khoa Sinh học (P.427 nhà T1) khớp với bảng chỉ dẫn.
- Hướng dẫn thi lớp 10 Chuyên KHTN 2021: thí sinh vào T1, T5 qua cổng 334; phòng thi ở T1 tầng 4 và T5 tầng 1.
- Không tìm được bản vẽ mặt bằng từng tầng. Vì vậy thứ tự phòng dọc hành lang, vị trí cầu thang và kích thước vẫn là ước lượng; số phòng chỉ cho biết tầng.
