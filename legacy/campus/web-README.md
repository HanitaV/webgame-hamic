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

Trò chơi mở ở màn hình chính: **Vào sân** (đi bộ), **Xem bản đồ** (quay quanh), **Xem quay cảnh**, **Thành tựu**, **Cài đặt**.

- Đi bộ: WASD hoặc phím mũi tên, Space để nhảy. Bấm vào cảnh để khoá chuột và nhìn; Esc thả chuột và mở menu tạm dừng. Trên màn cảm ứng có nút tròn Đi, vùng Nhìn và nút Nhảy.
- Bản đồ: kéo để xoay, lăn để phóng, kéo chuột phải để dịch. Toàn cảnh / USSH / HUS ở góc trái trên. Bảng "Tầng HUS" bên phải cắt mọi nhà HUS tới tầng đã chọn và hiện tên phòng ban tầng đó; "Cả nhà" hiện lại mái. Bấm bản đồ nhỏ để bay tới chỗ đó.
- Quay cảnh: 18 giây, thanh dưới có tạm dừng / phát và về đầu.
- Phím tắt: 1 đi bộ, 2 bản đồ, 3 quay cảnh, Esc hoặc P mở menu, H ẩn/hiện giao diện. Trong nhà HUS, ô vàng là cầu thang: E lên, Q xuống (hoặc nút Lên/Xuống).
- Menu tạm dừng: Tiếp tục, Cách chơi, Thành tựu, Cài đặt, Chia sẻ, Ẩn giao diện, Chơi lại từ cổng HUS, Về màn hình chính. Khi menu mở, trò chơi dừng (nhân vật, quay cảnh, đồng hồ).
- Cài đặt (tự lưu): chất lượng đồ hoạ Nhẹ/Đẹp, hiện cây, cho giờ trôi và giờ trong ngày, nhãn nhà/phòng, nhãn cây, cỡ chữ giao diện, độ nhạy khi nhìn, đảo trục dọc, giảm chuyển động. Mục Gỡ lỗi (khung va chạm) chỉ hiện khi chạy `npm run dev` hoặc mở với `?debug`.
- Deadline: bắt đầu ở cổng HUS, nhặt 3 tờ rồi ra cổng USSH hoặc HUS. Đồng hồ ván chạy khi đi bộ; kỷ lục được lưu. Trò chơi giả.
- `?play=walk|orbit|cine` bỏ qua màn hình chính (dùng cho script chụp ảnh).

Ghi chú trên màn hình: bản đồ cách điệu, bố cục ước lượng.

## Cấu trúc giao diện và nền để mở rộng

```
src/
  main.ts            cảnh 3D, điều khiển, logic deadline; phát sự kiện, không đụng DOM giao diện
  config.ts          cấu hình tĩnh: tên, phiên bản, cờ tính năng, khoá lưu trữ, phím mặc định
  i18n.ts            chuỗi giao diện (tiếng Việt) và t("khoá", {biến})
  core/events.ts     bus sự kiện có kiểu: mode, place, deadline, won, hour, cine, achievement, toast…
  core/storage.ts    lưu localStorage có version, migration, bản .bak dự phòng, chạy được khi bị chặn
  ui/interface.ts    màn hình chính, HUD, toast, gợi ý; nghe sự kiện, gọi lại game qua GameControls
  ui/screens.ts      chồng màn hình trên <dialog>: push/pop, Esc đóng màn trên cùng, trả focus
  ui/settings.ts     kiểu Settings + danh sách mục; màn Cài đặt tự vẽ từ danh sách
  ui/achievements.ts danh sách thành tựu, tiến trình đã lưu, luật mở khoá theo sự kiện
  ui/share.ts        lời mời, liên kết, Web Share API / clipboard, chụp ảnh canvas
  ui/dom.ts          hàm DOM nhỏ và bộ icon SVG
```

- **Thêm một cài đặt:** thêm trường vào `Settings` và `defaults()`, thêm một dòng vào `SECTIONS` (toggle / choice / range) — màn Cài đặt tự vẽ và tự lưu; xử lý trong `applySettings` ở `main.ts` hoặc `settings.subscribe`.
- **Thêm một thành tựu:** thêm vào `ACHIEVEMENTS` (có `target` nếu đếm), rồi trong `wireAchievements` gọi `unlock(id)` / `advance(id, n)` từ sự kiện phù hợp. Màn Thành tựu, toast và bộ đếm tự cập nhật.
- **Thêm sự kiện game:** khai báo trong `GameEvents` (`core/events.ts`), `bus.emit` trong `main.ts`, `bus.on` ở nơi cần.
- **Thêm một màn hình:** thêm `<dialog id="scr-…" class="sheet">` vào `index.html`, thêm id vào `ScreenId`, `screens.register(...)` trong `interface.ts`, mở bằng `screens.push(id)`.
- **Đổi phím:** `DEFAULT_BINDINGS` trong `config.ts`. Người chơi ghi đè qua `settings.bindings` (chưa có màn đổi phím; chỉ cần ghi vào đó).
- **Tắt một tính năng:** `FLAGS` trong `config.ts`; phần tử có `data-feature="…"` tự ẩn.
- **Thêm ngôn ngữ:** chép từ điển `vi` trong `i18n.ts`, dịch, đăng ký trong `dictionaries`, rồi thêm lựa chọn `language` vào `SECTIONS`. Chữ tĩnh trong `index.html` hiện vẫn viết thẳng tiếng Việt.
- Dữ liệu người chơi nằm ở `localStorage` khoá `ussh-hus:settings` và `ussh-hus:progress` (mỗi khoá có `:bak`). Đổi cấu trúc thì tăng `version` trong store và thêm hàm vào `migrations`.

Hướng thiết kế: biển chỉ dẫn trong trường — bảng tối trung tính, chữ trắng, góc vuông nhẹ, một font Be Vietnam Pro (đóng gói qua `@fontsource`, không tải từ mạng), một màu nhấn là vàng của tờ deadline (chỉ dùng cho deadline và thành tựu). Đỏ USSH và xanh HUS chỉ xuất hiện trên dữ liệu bản đồ.
