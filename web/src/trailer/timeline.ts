/**
 * Fixed-clock timeline & voice synchronization data for the 59.00-second (1,770 frames @ 30 FPS) HAMIC Trailer.
 */

export const TRAILER_FPS = 30;
export const TRAILER_DURATION = 59.0;
export const TRAILER_TOTAL_FRAMES = 1770;

export interface TrailerSceneDef {
  id: string;
  number: number;
  title: string;
  start: number;
  end: number;
}

export const TRAILER_SCENES: TrailerSceneDef[] = [
  { id: "S01", number: 1,  title: "HOOK — MỘT NGÀY Ở HAMIC?",             start: 0.0,   end: 3.8 },
  { id: "S02", number: 2,  title: "NHIỆM VỤ — CHẠY GIỮA HUS VÀ USSH",       start: 3.8,   end: 7.8 },
  { id: "S03", number: 3,  title: "BỐN SỰ CỐ — ĐIỀU TRA LỖI",               start: 7.8,   end: 15.8 },
  { id: "S04", number: 4,  title: "TÁM QUYẾT ĐỊNH — 01/08 ĐẾN 08/08",       start: 15.8,  end: 31.0 },
  { id: "S05", number: 5,  title: "CHỌN ĐẠI — RISK LEVEL 99%",              start: 31.0,  end: 35.0 },
  { id: "S06", number: 6,  title: "CHẠY MÔ PHỎNG — 3... 2... 1...",         start: 35.0,  end: 38.0 },
  { id: "S07", number: 7,  title: "SỰ CỐ E2 — HUS BAY TRƯỚC, USSH BAY THEO", start: 38.0,  end: 46.0 },
  { id: "S08", number: 8,  title: "BÌNH TĨNH — CHỈ LÀ MÔ PHỎNG",            start: 46.0,  end: 49.8 },
  { id: "S09", number: 9,  title: "THÔNG BÁO SỰ KIỆN — CÔNG BỐ 01.11",      start: 49.8,  end: 55.65 },
  { id: "S10", number: 10, title: "FINAL CTA — BẠN SẼ CHỌN KẾT CỤC NÀO?",   start: 55.65, end: 59.0 },
];

export interface DecisionShotDef {
  index: number;
  badge: string;
  id: "ha" | "firework" | "final" | "version" | "notes" | "drones" | "captions" | "bursts";
  start: number;
  end: number;
  title: string;
  subtitle: string;
  formula: string;
  actionLabel: string;
  resultLabel: string;
  color: string;
}

export const DECISION_SHOTS: DecisionShotDef[] = [
  {
    index: 1,
    badge: "01/08",
    id: "ha",
    start: 15.80,
    end: 19.35,
    title: "CĂN CHÙM SÁNG & DẢI ĐÈN",
    subtitle: "Đại số tuyến tính · Phép xoay gương 2×2",
    formula: "R · [1, 0]ᵀ = [0, 1]ᵀ   (det R = 1)",
    actionLabel: "Đặt ma trận xoay R = [[0, −1], [1, 0]]",
    resultLabel: "✓ Tia sáng khóa chuẩn mục tiêu!",
    color: "#ffd25e",
  },
  {
    index: 2,
    badge: "02/08",
    id: "firework",
    start: 19.35,
    end: 21.25,
    title: "CHỈNH ĐƯỜNG BAY PHÁO HOA",
    subtitle: "Giải tích · Giới hạn tiệm cận độ cao",
    formula: "lim(t→∞) 70·(1 − e^(−1.65t)) = 70 m",
    actionLabel: "Chốt tham số hội tụ a = 70, b = 1.65",
    resultLabel: "✓ Quỹ đạo dừng chuẩn ở 70 m!",
    color: "#5ad8ff",
  },
  {
    index: 3,
    badge: "03/08",
    id: "final",
    start: 21.25,
    end: 22.90,
    title: "LẦN ĐƯỜNG ĐI BẰNG ĐỒ THỊ",
    subtitle: "Lý thuyết đồ thị · Đường đi ngắn nhất HUS ⇄ USSH",
    formula: "d(A → C → B → E) = 2 + 1 + 7 = 10",
    actionLabel: "Đồng bộ lộ trình & bản chốt lịch #4",
    resultLabel: "✓ Tuyến cáp quang nối thông hai trường!",
    color: "#5eeaa0",
  },
  {
    index: 4,
    badge: "04/08",
    id: "version",
    start: 22.90,
    end: 24.30,
    title: "SO SÁNH HAI PHIÊN BẢN TRÙNG TÊN",
    subtitle: "An toàn dữ liệu · Đối chiếu mã băm SHA-256",
    formula: "hash(USB_A) == #70A9  ≠  hash(USB_B) #OLD3",
    actionLabel: "Loại bản đèn cũ trùng tên ở Cổng HUS",
    resultLabel: "✓ Khớp mã băm với máy chủ T3!",
    color: "#ffd25e",
  },
  {
    index: 5,
    badge: "05/08",
    id: "notes",
    start: 24.30,
    end: 25.55,
    title: "TÌM LỖI ĐỒNG BỘ DỮ LIỆU",
    subtitle: "Đồng bộ tệp · Khôi phục thư mục _ghichu",
    formula: "sync.include.push(\"/_ghichu/*.md\") → 70/70",
    actionLabel: "Bổ sung _ghichu vào mẫu đồng bộ chung",
    resultLabel: "✓ Lời ghi chú đã về đủ bên USSH!",
    color: "#5ad8ff",
  },
  {
    index: 6,
    badge: "06/08",
    id: "drones",
    start: 25.55,
    end: 26.75,
    title: "XẾP ĐỘI HÌNH 70 DRONE",
    subtitle: "Thuật toán · Hai vòng lặp lồng nhau 7 × 10",
    formula: "for r in 1..7: for c in 1..10 → 70 DRONES",
    actionLabel: "Xoay góc nhìn chuẩn phía khán giả sân cỏ",
    resultLabel: "✓ Đội hình chữ \"70\" sáng rực trên bầu trời!",
    color: "#9b8cff",
  },
  {
    index: 7,
    badge: "07/08",
    id: "captions",
    start: 26.75,
    end: 27.80,
    title: "GHÉP CHÚ THÍCH BỘ ẢNH TƯ LIỆU",
    subtitle: "Tư liệu USSH × HUS · Giữ trọn lời ghi gốc",
    formula: "match(photo[i], caption[i]) → 100% VALID",
    actionLabel: "Giữ nguyên văn lời ghi của người góp ảnh",
    resultLabel: "✓ Kết nối ký ức Tự nhiên – Nhân văn!",
    color: "#5eeaa0",
  },
  {
    index: 8,
    badge: "08/08",
    id: "bursts",
    start: 27.80,
    end: 31.00,
    title: "QUYẾT ĐỊNH SỐ CHÙM PHÁO CUỐI",
    subtitle: "Trạm máy chủ Nhà T3 · Tham số trình diễn cuối",
    formula: "Risk = Σ w_i  (Threshold E2 = 18)",
    actionLabel: "Có nên thêm một chùm pháo nữa không?",
    resultLabel: "⚠️ Nút [THÊM PHÁO] đang nhấp nháy...",
    color: "#ff6b81",
  },
];

export function sceneAtTime(time: number): TrailerSceneDef {
  for (const s of TRAILER_SCENES) {
    if (time >= s.start && time < s.end) return s;
  }
  return TRAILER_SCENES[TRAILER_SCENES.length - 1];
}

export function decisionAtTime(time: number): DecisionShotDef {
  for (const d of DECISION_SHOTS) {
    if (time >= d.start && time < d.end) return d;
  }
  return DECISION_SHOTS[DECISION_SHOTS.length - 1];
}
