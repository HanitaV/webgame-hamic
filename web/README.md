# USSH × HUS — bản đồ web

Bản đồ khối đơn giản của cơ sở 334–336 Nguyễn Trãi (USSH và HUS, Hà Nội). Không phải số đo, không phải USSH TP.HCM, HUS 19 Lê Thánh Tông hay cơ sở Mễ Trì.

App dùng Vite, TypeScript và Three.js. Không có backend. Lúc chạy không tải thư viện hay ảnh từ mạng: model, dữ liệu và logo HUS (`hus_logo.svg`) nằm trong `public/assets/`, được copy từ thư mục kit bằng `scripts/sync-assets.mjs` (chạy lại trước `dev` và `build`).

## Chạy local

Từ thư mục `web/`:

```sh
npm install
npm run dev
```

Vite mở ở `http://127.0.0.1:5173/`.

## Build tĩnh

```sh
npm run build
npm run preview
```

`vite.config.ts` đặt `base: './'`, `build.outDir` là `dist`, `build.assetsDir` là `static`. Bản build nằm ở `web/dist/`: `index.html`, JS/CSS trong `dist/static/`, còn GLB và JSON trong `dist/assets/`. Đường dẫn asset đi qua `import.meta.env.BASE_URL`, nên bản static có thể nằm trong một thư mục con. `npm run preview` phục vụ đúng bản `dist` tại `http://127.0.0.1:4173/`.

`npm run check:motion` chạy bài kiểm tra hướng đi và va chạm (kể cả theo tầng) ngoài trình duyệt.

`node scripts/capture.mjs` cần `npm run preview` đang chạy và một Chrome/Chromium; đặt `CHROME_PATH` nếu không nằm ở đường dẫn mặc định của hệ điều hành.

## Sửa bố cục

Sửa `data/campus.layout.json` ở thư mục gốc kit (nhà, tầng, sảnh, cửa ở `buildings`; phòng ban theo tầng ở `programs`), rồi từ gốc chạy `python scripts/build_blockout.py`. Script sinh GLB, `data/collision.json` và `data/interiors.json`, và dừng lại nếu có phòng không tới được. Chỉ đổi điểm camera hoặc đường quay cảnh thì không cần sinh lại GLB; `npm run dev` hoặc `npm run build` sẽ copy JSON mới.

## Thao tác

- Quay quanh: kéo để xoay, lăn để phóng, kéo phải để dịch.
- Đi bộ: WASD, Space để nhảy. Click vào sân để khóa chuột, Esc để thả. Trên màn hẹp hoặc cảm ứng có vùng Đi, Nhìn và nút Nhảy; không khóa chuột lúc vừa mở trang.
- Toàn cảnh / USSH / HUS đặt lại camera. Quay cảnh chạy 18 giây, có tạm dừng và về đầu.
- Tầng HUS: "Cả nhà" hiện nguyên nhà và mái; bấm 1–7 để cắt mọi nhà HUS tới tầng đó và hiện tên phòng ban của tầng đó.
- Trong nhà HUS khi đi bộ: tầng trên tự ẩn, số phòng gần nhất hiện quanh người chơi. Ô vàng là cầu thang: E lên, Q xuống (hoặc nút Lên/Xuống).
- Nhà USSH là khối kín, không vào được.
- Giờ: kéo thanh Giờ, hoặc bấm Ngày / Đêm; "Dừng giờ" / "Chạy giờ" bật tắt chu kỳ (một ngày = 6 phút).
- Camera đi bộ tự rút ngắn hoặc nâng lên khi vướng tường, không nhìn xuyên tường.
- Mặc định đồ hoạ nhẹ. Ô "Đồ hoạ đẹp" bật bóng đổ, vân bề mặt bằng shader, trời có mây và đèn điểm (nặng hơn).
- Bản đồ nhỏ ở góc: mũi tên là nhân vật khi đi bộ; khi quay quanh, bấm vào bản đồ để đưa camera tới đó.
- Ẩn giao diện (hoặc phím H) chỉ giấu bảng, không xóa cây khỏi dữ liệu.
- Bắt đầu ở cổng HUS. Nhặt 3 tờ deadline rồi ra cổng USSH hoặc HUS. Đó là trò chơi giả.

Ghi chú trên màn hình: bản đồ cách điệu, bố cục ước lượng.
