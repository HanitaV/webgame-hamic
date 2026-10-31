/**
 * Interface strings. Vietnamese is the only language today; to add one, copy `vi`, translate the
 * values, register it in `dictionaries` and expose a `language` setting.
 * Use `{name}` placeholders; `t("run.best", { time: "1:42" })`.
 */

const vi = {
  "boot.loading": "Đang dựng sân",
  "boot.data": "Đang đọc dữ liệu sân",
  "boot.model": "Đang tải mô hình",
  "boot.error": "Không tải được sân. Kiểm tra mạng rồi thử lại.",
  "boot.retry": "Thử lại",

  "title.lead": "Sân trường 334–336 Nguyễn Trãi dựng bằng khối. Nhặt ba tờ deadline rồi nộp ở cổng.",
  "title.play": "Vào sân",
  "title.continue": "Chơi tiếp",
  "title.explore": "Xem bản đồ",
  "title.cine": "Xem quay cảnh",
  "title.achievements": "Thành tựu",
  "title.settings": "Cài đặt",
  "title.about": "Giới thiệu và nguồn",
  "title.note": "Bố cục ước lượng, không phải sơ đồ đo đạc.",
  "title.best": "Kỷ lục {time}",

  "mode.walk": "Đi bộ",
  "mode.orbit": "Bản đồ",
  "mode.cine": "Quay cảnh",
  "hud.menu": "Menu",
  "hud.outside": "Ngoài sân",
  "hud.floor": "Tầng {n}",
  "hud.overview": "Toàn cảnh",
  "hud.floors": "Tầng HUS",
  "hud.floorAll": "Cả nhà",
  "hud.floorPick": "Cắt nhà HUS tới tầng {n}",
  "hud.mapHint": "Bấm bản đồ để bay tới",
  "hud.reveal": "Hiện giao diện",

  "run.title": "Deadline",
  "run.todo": "Nhặt ba tờ trong sân",
  "run.left": "Còn {n} tờ",
  "run.deliver": "Đủ rồi. Ra cổng USSH hoặc HUS để nộp",
  "run.done": "Đã nộp trong {time}",
  "run.again": "Chơi lại",

  "stair.up": "Lên",
  "stair.down": "Xuống",
  "stair.where": "{name} · tầng {level}/{top}",

  "cine.play": "Phát",
  "cine.pause": "Tạm dừng",
  "cine.restart": "Về đầu",

  "hint.walkLocked": "WASD để đi · chuột để nhìn · Space nhảy · Esc mở menu",
  "hint.walk": "WASD để đi · bấm vào cảnh để nhìn bằng chuột · Space nhảy",
  "hint.walkTouch": "Kéo nút trái để đi, kéo bên phải để nhìn",
  "hint.orbit": "Kéo để xoay · lăn để phóng · kéo chuột phải để dịch",
  "hint.orbitTouch": "Một ngón để xoay · hai ngón để phóng và dịch",
  "hint.cine": "Camera chạy theo đường dựng sẵn, 18 giây",

  "pause.title": "Tạm dừng",
  "pause.resume": "Tiếp tục",
  "pause.howto": "Cách chơi",
  "pause.share": "Chia sẻ",
  "pause.restart": "Chơi lại từ cổng HUS",
  "pause.home": "Về màn hình chính",

  "settings.title": "Cài đặt",
  "settings.saved": "Đã lưu",
  "settings.notSaved": "Trình duyệt chặn lưu trữ: cài đặt chỉ giữ trong lần mở này.",
  "settings.reset": "Đặt lại cài đặt",
  "settings.resetDone": "Đã đặt lại cài đặt",

  "ach.title": "Thành tựu",
  "ach.count": "{n} trên {total}",
  "ach.locked": "Chưa mở",
  "ach.hidden": "Thành tựu ẩn",
  "ach.hiddenDesc": "Chơi tiếp để biết.",
  "ach.unlocked": "Mở thành tựu",
  "ach.progress": "{n}/{total}",
  "ach.reset": "Xoá tiến trình",
  "ach.resetConfirm": "Xoá toàn bộ thành tựu và kỷ lục? Không lấy lại được.",
  "ach.resetYes": "Xoá thành tựu và kỷ lục",
  "ach.resetNo": "Giữ lại",
  "ach.resetDone": "Đã xoá thành tựu và kỷ lục",

  "share.title": "Chia sẻ",
  "share.preview": "Nội dung sẽ gửi",
  "share.native": "Chia sẻ…",
  "share.copy": "Chép liên kết và lời mời",
  "share.copied": "Đã chép vào bộ nhớ tạm",
  "share.copyFail": "Không chép được. Bôi đen đoạn trên để chép tay.",
  "share.shot": "Tải ảnh màn hình",
  "share.shotDone": "Đã lưu ảnh",
  "share.textWon": "Mình nộp đủ 3 deadline ở sân USSH × HUS trong {time}. Thử nhanh hơn không?",
  "share.textPlay": "Đi một vòng sân USSH × HUS (334–336 Nguyễn Trãi) dựng bằng khối, nhặt deadline rồi nộp ở cổng.",

  "about.title": "Giới thiệu và nguồn",
  "howto.title": "Cách chơi",
  "close": "Đóng",
  "back": "Quay lại",
} as const;

export type StringKey = keyof typeof vi;

const dictionaries: Record<string, Record<StringKey, string>> = { vi };
let current: Record<StringKey, string> = dictionaries.vi;

export function setLanguage(lang: string) {
  current = dictionaries[lang] ?? dictionaries.vi;
  document.documentElement.lang = dictionaries[lang] ? lang : "vi";
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let text: string = current[key] ?? vi[key] ?? key;
  if (vars) for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

/** 95 → "1:35". */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
