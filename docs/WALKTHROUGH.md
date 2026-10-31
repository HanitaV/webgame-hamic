# Hướng dẫn chơi — Đêm Toán Tin, bản 2.8.0

Tài liệu mô tả luồng chơi mới, các nhánh và cách đạt từng kết cục. Thiết kế đầy đủ ở [STORY_BIBLE.md](STORY_BIBLE.md); luật kết cục ở [ENDINGS.md](ENDINGS.md).

## Luồng chính

1. Màn tiêu đề: chọn nhịp chơi (Cốt truyện, Cân bằng, Thử thách), bấm Bắt đầu. Dòng "Lần trước" cho biết việc đang dở.
2. Lời mở đầu ở cổng HUS: chị Chủ nhiệm báo bản chạy thử bị lệch. Chọn cách làm việc: hỏi chuyện mọi người (listen) hoặc kiểm từng thông số (build).
3. Đi qua 15 điểm dừng theo thứ tự. HUD ghi việc tiếp theo và nơi cần tới; nút Đi tới dẫn đường, bản đồ nhỏ đánh dấu NPC cần gặp. Đi lòng vòng hơn 75 giây thì đài nhắc chỗ cần tới.
4. Mỗi điểm dừng: hội thoại → câu đố hoặc minigame → quyết định (nếu có) → Sổ ghi bằng chứng, vật phẩm, sự thật mới.
5. Sau điểm dừng cuối, bấm Chạy Đêm Hội tụ (hoặc nói với chị Chủ nhiệm). Cảnh kết cục chạy trên mô hình, có nút Bỏ qua cảnh; sau đó là bảng kết cục, hiện mã E1–E6, tên kết cục và thông số lượt chơi: điểm rủi ro, số quyết định, sự thật, bằng chứng, đèn và thời gian chơi. Dòng thời gian ghi phương án đã chọn và số điểm rủi ro tương ứng.

Thời lượng ước lượng: 20–25 phút cho chuỗi chính; thêm 5–10 phút nếu hỏi hết chủ đề và thắp đèn lối đi.

## Từng điểm dừng và lời giải

| # | Điểm dừng | Gặp ai, ở đâu | Câu đố / minigame | Lời giải (mức Cân bằng) | Quyết định |
|---|---|---|---|---|---|
| 1 | Hai bản cùng tên | Minh · Cổng HUS | Hai bản cùng tên (mới) | Chọn ba dòng phao_hoa.b, guong.thu_tu, den.so_luong. | `version` |
| 2 | Căn dải sáng | Thành viên Ban Học tập · Sân cỏ Nhà T | Căn dải sáng | a = 70; b nhỏ nhất đạt ★2 là 1,65 (màn 1.1). | `firework` |
| 3 | Dải đèn bật dần | Hà · Sân cỏ Nhà T | Dải đèn bật dần | N = 7 đèn (1 − 2⁻⁷ ≈ 0,992). | `ha` |
| 4 | Chỉnh hướng chiếu | Thành viên Ban Học tập · Sân cỏ Nhà T | Chỉnh hướng chiếu | R rồi F (màn 2.3); đảo thứ tự cho hướng sai. | — |
| 5 | Báo cáo ở T3 | Chị Chủ nhiệm HAMIC · Nhà T3 · trạm máy chủ | Hội thoại | Chỉ hội thoại. | — |
| 6 | Mở tủ tư liệu | Nam · Lối qua Căng tin | Ba ổ khóa | Mã 17 (17 mod 2 = 1, mod 5 = 2, mod 7 = 3). | — |
| 7 | Bắt lỗi đồng bộ | Vy · Lối sang USSH | Bắt lỗi đồng bộ (mới) | Bật _ghichu, tắt video-thu, để _tam tắt. | `notes` |
| 8 | Đường chuyển tư liệu | Vy · Lối sang USSH | graph trên lối đi map.json (tái dùng) | T3 → Căng tin → Nhà E → Sân USSH → Nhà C, 13 phút. | — |
| 9 | Bộ ảnh bên USSH | Đại diện sinh viên USSH · Nhà E · điểm dữ liệu | Hội thoại | Chỉ hội thoại. | — |
| 10 | Ghép ảnh với lời ghi | Linh · Nhà E · điểm dữ liệu | Ghép ảnh với lời ghi (mới) | Ảnh 1 – thư viện, Ảnh 2 – gốc cây, Ảnh 3 – chữa bài, Ảnh 4 – văn nghệ. | `captions` |
| 11 | Nhịp chữ và hiệu ứng | An · Sân USSH | Nhịp chữ và hiệu ứng (mới) | Hiện chữ trong khoảng 1,2–3 giây, giữ chữ ít nhất 3 giây. | — |
| 12 | Chọn bốn cảnh trong tám | Bảo · Nhà C / Sân khấu | Chọn bốn cảnh trong tám | C(8,4) = 70 (màn 6.1). | — |
| 13 | Dàn drone chữ 70 | Điều phối sân khấu USSH · Nhà C / Sân khấu | Dàn drone chữ 70 | Lặp 7 { lặp 10 { đặt; sang phải }; xuống hàng } (màn 3.2). | `drones` |
| 14 | Thứ tự tổng duyệt | Đức · Nhà T3 · trạm máy chủ | Thứ tự tổng duyệt (mới) | Một thứ tự đúng: điện, đèn nền, gương, drone, pháo, chữ. | `final` |
| 15 | Đối chiếu bằng chứng | Chị Chủ nhiệm HAMIC · Nhà T3 · trạm máy chủ | Đối chiếu bằng chứng (mới) | Ba thẻ thật: bản trùng tên, mẫu đồng bộ, hai bản lịch. | `bursts` |

Mức Cốt truyện dùng đề dễ hơn và lời dẫn không thuật ngữ; mức Thử thách thay vài câu đố bằng màn sinh tự động khó hơn (ghi ở cột màn của STORY_BIBLE). Gợi ý ba bậc luôn miễn phí.

## Việc phụ

- Trò chuyện với mọi NPC: thoại đổi theo chương và nhắc lại lựa chọn cũ của bạn; mỗi người có 2–3 chủ đề hỏi (26 chủ đề, hỏi 20 để mở thành tựu).
- Chủ đề "Số kỳ lạ" của Ban Học tập mở ở Chương III khi đã có 6 sự thật về 70; hỏi xong được sự thật thứ bảy và phương án E6 ở bước cuối.
- Thắp đèn lối đi: mỗi điểm dừng có một cột đèn; đứng gần rồi bấm Thắp đèn (phím L). Thắp 7 đèn để mở thành tựu.
- Nhóm (tin nhắn): các bạn bình luận theo tiến trình và theo lựa chọn của bạn.
- Sổ: Bằng chứng, Vật phẩm, Dòng thời gian, Sự thật về 70, Đèn lối đi, Kết cục, Lịch sử thoại.

## Cách đạt từng kết cục

Kết cục tính từ tám quyết định (không ngẫu nhiên). Tổng rủi ro ≥ 18 thì ra E2.

| Mã | Kết cục | Một cách đạt | Tỉ lệ trên mọi tổ hợp |
|---|---|---|---|
| E1 | Đêm Hội tụ | Chọn A ở cả tám quyết định. | 1.65% |
| E2 | Sự cố mô hình: nổ tung | Ví dụ: version B, notes B, captions C, final B, ha C, bursts B (tổng 50). | 95.03% |
| E3 | Cầu ánh sáng Tự nhiên – Nhân văn | Chọn A ở mọi quyết định, riêng ha chọn B (tổng 1, giữ lời ghi). | 1.37% |
| E4 | Drone xếp thành 07 | Chọn A ở mọi quyết định, riêng drones chọn B. | 0.65% |
| E5 | Pháo hoa bay mãi | Chọn A ở mọi quyết định, riêng firework chọn B. | 0.65% |
| E6 | Số kỳ lạ | Hỏi chủ đề Số kỳ lạ ở Chương III, chọn A ở mọi quyết định, bursts chọn C. | 0.65% |

Bảng kết cục có dòng thời gian nhân quả, mười hai lời kết NPC, nút Chọn lại từ tổng duyệt (giữ mọi lựa chọn trước, chọn lại hai quyết định cuối), Chơi lại từ đầu và Thư viện kết cục. Thư viện giữ qua các lượt chơi.

## Bản lưu

- Tiến độ lưu tự động trên thiết bị (localStorage, `hoitu70:story`, version 4); tải lại trang chơi tiếp đúng điểm dừng.
- Bản lưu của bản 2.7 (version 3) được chuyển sang điểm dừng tương ứng; game báo một dòng khi mở lại.
- Chơi lại từ đầu giữ Thư viện kết cục.
