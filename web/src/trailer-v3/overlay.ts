/**
 * Hamic Trailer V3 — Deterministic Frame-Locked Overlay (9:16 Safe Zone & 16:9 Companion)
 * =======================================================================================
 * Applies:
 * - `short-form-video`: Center 900x1400 safe zone (top 120px, bottom 320px, right 120px clear),
 *   Frame-0 hook text, and Frame-1769 -> Frame-0 loop seam match.
 * - `caption-animation`: Verified acoustic word-level tokens, 1-4 word pages, per-word spring pop,
 *   single `#ffd25e` active-word highlight, 62px ExtraBold Be Vietnam Pro with heavy stroke.
 * - `countdown-video`: Frame-derived 3->2->1 odometer/flip countdown paired to 3 physical objects.
 * - `lower-thirds`: Clean 2-line hierarchy for the 01/11 Hamic announcement & location reveal.
 */

import {
  AspectMode,
  CAPTION_PAGES,
  FPS,
  RenderOverlayMode,
  clamp01,
  easeOutCubic,
  getCountdownState,
  rangeProgress,
  springPop,
} from "./timeline";

interface SpeedrunStepMeta {
  code: string;
  title: string;
  instrument: string;
  startSec: number;
  endSec: number;
}

const SPEEDRUN_STEPS: SpeedrunStepMeta[] = [
  { code: "01/08", title: "ĐỒNG BỘ CHUỖI LED #6", instrument: "Chu kỳ T = BCNN(2, 3, 6)", startSec: 13.0, endSec: 15.0 },
  { code: "02/08", title: "MA TRẬN XOAY GƯƠNG", instrument: "R(θ) · n̂ → Khớp tâm sân khấu", startSec: 15.0, endSec: 16.4 },
  { code: "03/08", title: "ĐẠO HÀM QUỸ ĐẠO PHÁO", instrument: "dy/dx = 0 tại đỉnh y = 26m", startSec: 16.4, endSec: 18.2 },
  { code: "04/08", title: "ĐỒ THỊ NỐI LỐI ĐI", instrument: "Dijkstra · Đường ngắn nhất HUS ↔ USSH", startSec: 18.2, endSec: 19.8 },
  { code: "05/08", title: "KHÓA BĂM SHA-256", instrument: "Loại bỏ bản sao xung đột", startSec: 19.8, endSec: 21.0 },
  { code: "06/08", title: "KHÔI PHỤC GÓI TIN _ghichu", instrument: "Cầu ánh sáng liên thông hai trường", startSec: 21.0, endSec: 22.2 },
  { code: "07/08", title: "70 DRONE VÀO ĐỘI HÌNH", instrument: "Tọa độ cực (r, φ) khóa biểu tượng 70", startSec: 22.2, endSec: 23.8 },
  { code: "08/08", title: "KHỚP KHUNG ẢNH KỶ NIỆM", instrument: "Song ánh 1-1 · Sân E USSH", startSec: 23.8, endSec: 25.2 },
];

export class TrailerV3Overlay {
  private root: HTMLElement;
  private topRegion: HTMLElement;
  private centerCardRegion: HTMLElement;
  private captionRegion: HTMLElement;

  constructor(
    mount: HTMLElement,
    private aspectMode: AspectMode,
    private overlayMode: RenderOverlayMode,
    width = aspectMode === "9x16" ? 1080 : 1920,
    height = aspectMode === "9x16" ? 1920 : 1080
  ) {
    mount.innerHTML = "";
    this.injectStyles();

    this.root = document.createElement("div");
    this.root.className = `v3-overlay v3-${aspectMode} v3-mode-${overlayMode}`;

    this.topRegion = document.createElement("div");
    this.topRegion.className = "v3-top-region";

    this.centerCardRegion = document.createElement("div");
    this.centerCardRegion.className = "v3-center-region";

    this.captionRegion = document.createElement("div");
    this.captionRegion.className = "v3-caption-region";

    this.root.append(this.topRegion, this.centerCardRegion, this.captionRegion);
    mount.appendChild(this.root);
    this.syncViewport(width, height);
  }

  syncViewport(width: number, _height: number): void {
    const designW = this.aspectMode === "9x16" ? 1080 : 1920;
    const scale = width / designW;
    this.root.style.transform = Math.abs(scale - 1) < 1e-3 ? "none" : `scale(${scale.toFixed(5)})`;
  }

  private injectStyles(): void {
    if (document.getElementById("trailer-v3-overlay-styles")) return;
    const style = document.createElement("style");
    style.id = "trailer-v3-overlay-styles";
    style.textContent = `
      .v3-overlay {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        pointer-events: none;
        font-family: "Be Vietnam Pro", system-ui, -apple-system, sans-serif;
        color: #f8fafc;
        overflow: hidden;
        user-select: none;
      }
      .v3-overlay.v3-9x16 {
        width: 1080px;
        height: 1920px;
      }
      .v3-overlay.v3-16x9 {
        width: 1920px;
        height: 1080px;
      }
      /* 9:16 Safe Box: center 900x1400 (left 90px, right 90px+30px rail pad, top 140px, bottom 360px) */
      .v3-9x16 .v3-top-region {
        position: absolute;
        top: 144px;
        left: 84px;
        width: 876px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
      }
      .v3-9x16 .v3-center-region {
        position: absolute;
        top: 420px;
        left: 84px;
        width: 876px;
        height: 780px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
      }
      .v3-9x16 .v3-caption-region {
        position: absolute;
        bottom: 368px;
        left: 76px;
        width: 892px;
        min-height: 168px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      }

      /* 16:9 Recomposed Companion Layout */
      .v3-16x9 .v3-top-region {
        position: absolute;
        top: 56px;
        left: 96px;
        width: 1100px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .v3-16x9 .v3-center-region {
        position: absolute;
        top: 190px;
        left: 160px;
        width: 1600px;
        height: 620px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
      }
      .v3-16x9 .v3-caption-region {
        position: absolute;
        bottom: 68px;
        left: 210px;
        width: 1500px;
        min-height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      }

      /* Hook Banner (Frame 0 & Loop Seam) */
      .v3-hook-banner {
        background: rgba(7, 9, 18, 0.88);
        border: 3px solid #fb7185;
        border-left: 12px solid #ffd25e;
        border-radius: 22px;
        padding: 18px 28px;
        box-shadow: 0 18px 44px rgba(0, 0, 0, 0.72), 0 0 28px rgba(251, 113, 133, 0.35);
      }
      .v3-hook-kicker {
        font-size: 23px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #ffd25e;
        margin-bottom: 4px;
      }
      .v3-hook-title {
        font-size: 54px;
        font-weight: 800;
        line-height: 1.08;
        color: #ffffff;
        text-shadow: 0 4px 16px rgba(0,0,0,0.85);
      }

      /* Compact Top Status / Glitch / Speedrun Pill */
      .v3-pill-card {
        background: rgba(7, 9, 18, 0.86);
        border: 2.5px solid rgba(255, 210, 94, 0.65);
        border-radius: 18px;
        padding: 14px 24px;
        box-shadow: 0 14px 32px rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .v3-pill-badge {
        background: #ffd25e;
        color: #070912;
        font-size: 28px;
        font-weight: 800;
        padding: 6px 16px;
        border-radius: 12px;
        font-variant-numeric: tabular-nums;
      }
      .v3-pill-badge.err {
        background: #fb7185;
        color: #070912;
      }
      .v3-pill-badge.ok {
        background: #34d399;
        color: #070912;
      }
      .v3-pill-body {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .v3-pill-title {
        font-size: 30px;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.15;
      }
      .v3-pill-sub {
        font-size: 22px;
        font-weight: 600;
        color: #38bdf8;
      }

      /* Frame-Exact Countdown Card (countdown-video skill) */
      .v3-countdown-wrap {
        display: flex;
        align-items: center;
        gap: 24px;
        background: rgba(7, 9, 18, 0.90);
        border: 3px solid var(--cd-accent, #ffd25e);
        border-radius: 26px;
        padding: 16px 28px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 32px rgba(255, 210, 94, 0.28);
      }
      .v3-cd-slot {
        position: relative;
        width: 118px;
        height: 124px;
        background: #0d1326;
        border: 2px solid rgba(255,255,255,0.18);
        border-radius: 18px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        font-variant-numeric: tabular-nums;
      }
      .v3-cd-digit {
        position: absolute;
        font-size: 86px;
        font-weight: 800;
        color: var(--cd-accent, #ffd25e);
        line-height: 1;
        text-shadow: 0 4px 18px rgba(0,0,0,0.9);
      }
      .v3-cd-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .v3-cd-kicker {
        font-size: 21px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: var(--cd-accent, #ffd25e);
      }
      .v3-cd-target {
        font-size: 32px;
        font-weight: 800;
        color: #ffffff;
      }
      .v3-cd-sub {
        font-size: 22px;
        font-weight: 600;
        color: #cbd5e1;
      }

      /* Simulation Relief Stamp (43.0 - 46.5s) */
      .v3-sim-stamp {
        background: rgba(7, 9, 18, 0.92);
        border: 4px solid #34d399;
        border-radius: 26px;
        padding: 22px 36px;
        text-align: center;
        box-shadow: 0 24px 60px rgba(0,0,0,0.82), 0 0 36px rgba(52, 211, 153, 0.35);
      }
      .v3-sim-title {
        font-size: 50px;
        font-weight: 800;
        color: #34d399;
        letter-spacing: 0.04em;
        line-height: 1.1;
      }
      .v3-sim-sub {
        margin-top: 8px;
        font-size: 28px;
        font-weight: 600;
        color: #f8fafc;
      }

      /* 3-Phase Outro Announcement & CTA Cards (46.5 - 58.35s) */
      .v3-outro-card {
        width: 100%;
        background: rgba(7, 9, 18, 0.90);
        border: 3px solid rgba(255, 210, 94, 0.82);
        border-radius: 28px;
        padding: 26px 32px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.84), 0 0 40px rgba(255, 210, 94, 0.22);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
      }
      .v3-outro-header {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .v3-outro-logo {
        width: 58px;
        height: 58px;
        border-radius: 14px;
        object-fit: contain;
        background: rgba(255,255,255,0.06);
        padding: 4px;
        border: 1.5px solid rgba(255, 210, 94, 0.5);
      }
      .v3-outro-brand {
        font-size: 28px;
        font-weight: 800;
        color: #ffd25e;
        letter-spacing: 0.06em;
      }
      .v3-outro-headline {
        font-size: 56px;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.08;
      }
      .v3-outro-date-pill {
        background: #ffd25e;
        color: #070912;
        font-size: 28px;
        font-weight: 800;
        padding: 8px 24px;
        border-radius: 999px;
      }
      .v3-outro-loc-line1 {
        font-size: 38px;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.18;
      }
      .v3-outro-loc-line2 {
        font-size: 30px;
        font-weight: 700;
        color: #38bdf8;
      }
      .v3-choice-grid {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin-top: 6px;
      }
      .v3-choice-box {
        background: rgba(15, 23, 42, 0.92);
        border: 2.5px solid rgba(148, 163, 184, 0.45);
        border-radius: 20px;
        padding: 18px 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .v3-choice-box.active-save {
        border-color: #34d399;
        background: rgba(6, 78, 59, 0.55);
        box-shadow: 0 0 28px rgba(52, 211, 153, 0.38);
      }
      .v3-choice-box.active-launch {
        border-color: #fb7185;
        background: rgba(136, 19, 55, 0.55);
        box-shadow: 0 0 28px rgba(251, 113, 133, 0.42);
      }
      .v3-choice-tag {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #ffd25e;
      }
      .v3-choice-label {
        font-size: 29px;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.15;
      }

      /* Word-Timed Captions (caption-animation skill) */
      .v3-caption-line {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 14px 16px;
        padding: 10px 20px;
      }
      .v3-word {
        display: inline-block;
        font-size: 62px;
        font-weight: 800;
        line-height: 1.14;
        color: #ffffff;
        paint-order: stroke fill;
        -webkit-text-stroke: 11px #070912;
        text-shadow: 0 6px 18px rgba(0, 0, 0, 0.92);
        padding: 2px 8px;
        border-radius: 12px;
      }
      .v3-16x9 .v3-word {
        font-size: 48px;
        -webkit-text-stroke: 9px #070912;
      }
      .v3-word.active {
        color: #ffd25e;
        background: rgba(7, 9, 18, 0.72);
      }
    `;
    document.head.appendChild(style);
  }

  update(frame: number, sourceFrame: number = frame): void {
    const t = frame / FPS;
    const timeMs = sourceFrame / FPS * 1000;

    this.renderTopAndCenterRegions(frame, t);
    this.renderWordTimedCaptions(timeMs);
  }

  private renderTopAndCenterRegions(frame: number, t: number): void {
    this.topRegion.innerHTML = "";
    this.centerCardRegion.innerHTML = "";

    // 1. Frame 0 Hook Banner (0.0 - 3.0s) AND Loop Seam Match (58.35 - 59.0s)
    if (t < 3.05 || t >= 58.35) {
      const pop = t < 3.05 ? 1.0 : easeOutCubic(rangeProgress(t, 58.35, 58.85));
      const banner = document.createElement("div");
      banner.className = "v3-hook-banner";
      banner.style.transform = `scale(${0.92 + 0.08 * pop})`;
      banner.style.opacity = String(pop);
      banner.innerHTML = `
        <div class="v3-hook-kicker">⚠️ CẢNH BÁO MÔ PHỎNG · HAMIC</div>
        <div class="v3-hook-title">ĐỪNG BẤM NÚT ĐÓ!</div>
      `;
      this.topRegion.appendChild(banner);
      return;
    }

    // 2. Cold open second beat (3.05 - 6.3s)
    if (t < 6.3) {
      const isRewind = t >= 5.55;
      this.topRegion.appendChild(
        this.makePill(
          isRewind ? "⏪ TUA LẠI" : "SỰ CỐ KÉP",
          isRewind ? "QUAY VỀ TRƯỚC GIỜ BẤM NÚT" : "HUS NỔ TRƯỚC · USSH NỔ THEO!",
          isRewind ? "Kiểm tra 4 lỗi vật lý trên sân khấu" : "Mô phỏng quá tải · Vỡ tung từng khối",
          isRewind ? "ok" : "err"
        )
      );
      return;
    }

    // 3. Rewind & 4 Physical Glitches (6.3 - 13.0s)
    if (t < 13.0) {
      let badge = "4 LỖI";
      let title = "HỆ THỐNG TRƯỚC GIỜ G";
      let sub = "Sân khấu trung tâm đang lệch pha";
      if (t >= 8.85 && t < 9.75) {
        badge = "LỖI 01";
        title = "ĐÈN LED #6 LOẠN NHỊP";
        sub = "Lệch pha chu kỳ trên tháp đèn sân khấu";
      } else if (t >= 9.75 && t < 10.65) {
        badge = "LỖI 02";
        title = "FILE KỊCH BẢN TRÙNG TÊN";
        sub = "kich_ban_v2.json ≠ kich_ban_FINAL.json";
      } else if (t >= 10.65 && t < 11.35) {
        badge = "LỖI 03";
        title = "GƯƠNG PHẢN XẠ NGƯỢC";
        sub = "Tia laser lệch khỏi tâm huy hiệu sân khấu";
      } else if (t >= 11.35) {
        badge = "LỖI 04";
        title = "GHI CHÚ _ghichu BỐC HƠI";
        sub = "Mất gói tin kết nối hai trường HUS ↔ USSH";
      }
      this.topRegion.appendChild(this.makePill(badge, title, sub, "err"));
      return;
    }

    // 4. 8-Decision Speedrun (13.0 - 25.2s)
    if (t < 25.2) {
      const step =
        SPEEDRUN_STEPS.find((s) => t >= s.startSec && t < s.endSec) ??
        SPEEDRUN_STEPS[SPEEDRUN_STEPS.length - 1];
      const pop = springPop(t - step.startSec, 220, 14, 0.6);
      const pill = this.makePill(step.code, step.title, step.instrument, "gold");
      pill.style.transform = `scale(${0.88 + 0.12 * clamp01(pop)})`;
      this.topRegion.appendChild(pill);
      return;
    }

    // 5. Calm Apparent-Success Beat (25.2 - 27.1s)
    if (t < 27.1) {
      this.topRegion.appendChild(
        this.makePill(
          "08/08 ✓",
          "TẤT CẢ MẠCH ĐÃ KHỚP",
          "Sân khấu HUS × USSH sẵn sàng khai màn",
          "ok"
        )
      );
      return;
    }

    // 6. Misclick Button Staged (27.1 - 30.10s)
    if (t < 30.10) {
      const clicked = t >= 29.74;
      this.topRegion.appendChild(
        this.makePill(
          clicked ? "ĐÃ BẤM!" : "NÚT LẠ?",
          clicked ? "[THÊM PHÁO ×1000]" : "PHÁT HIỆN NÚT [THÊM PHÁO]",
          clicked ? "Đang nạp xung lực vào nền móng..." : "Chưa kiểm định trong kịch bản chính",
          clicked ? "err" : "gold"
        )
      );
      return;
    }

    // 7. Frame-Exact 3 -> 2 -> 1 Countdown (30.10 - 33.00s) (`countdown-video` skill)
    const cd = getCountdownState(frame);
    if (cd) {
      const wrap = document.createElement("div");
      wrap.className = "v3-countdown-wrap";
      wrap.style.setProperty("--cd-accent", cd.accentColor);
      const currY = (1 - cd.flipProgress) * 100;
      const prevY = -cd.flipProgress * 100;
      wrap.innerHTML = `
        <div class="v3-cd-slot">
          <span class="v3-cd-digit" style="transform: translateY(${prevY}%); opacity: ${1 - cd.flipProgress}">${cd.prevDigit}</span>
          <span class="v3-cd-digit" style="transform: translateY(${currY}%); opacity: ${cd.flipProgress}">${cd.digit}</span>
        </div>
        <div class="v3-cd-meta">
          <div class="v3-cd-kicker">ĐẾM NGƯỢC KÍCH HOẠT</div>
          <div class="v3-cd-target">${cd.targetName}</div>
          <div class="v3-cd-sub">${cd.targetSub}</div>
        </div>
      `;
      this.topRegion.appendChild(wrap);
      return;
    }

    // 8. Actual Disaster (33.0 - 43.0s)
    if (t < 43.0) {
      if (t < 35.0) {
        this.topRegion.appendChild(
          this.makePill("CẢNH BÁO", "NỀN SÂN RUNG CHẤN", "Xung lực pháo nén thẳng xuống móng nhà", "err")
        );
      } else if (t < 37.2) {
        this.topRegion.appendChild(
          this.makePill("PHÁT NỔ #1", "KHỐI NHÀ HUS NỔ TUNG TRƯỚC!", "Vỡ vụn hàng ngàn khối · Sóng xung kích lan rộng", "err")
        );
      } else if (t < 39.6) {
        this.topRegion.appendChild(
          this.makePill("PHÁT NỔ #2", "USSH NỔ TUNG THEO SAU!", "Sóng xung kích kích nổ dây chuyền sang Nhân Văn", "err")
        );
      } else {
        this.topRegion.appendChild(
          this.makePill("QUÁ TẢI VẬT LÝ", "CẢ HAI TRƯỜNG NỔ TUNG!", "Khi bấm nhầm nút [THÊM PHÁO ×1000]", "gold")
        );
      }
      return;
    }

    // 9. Relief & Fast Rollback (43.0 - 46.5s)
    if (t < 46.5) {
      const pop = springPop(t - 43.0, 200, 13, 0.7);
      const stamp = document.createElement("div");
      stamp.className = "v3-sim-stamp";
      stamp.style.transform = `scale(${0.86 + 0.14 * clamp01(pop)})`;
      stamp.innerHTML = `
        <div class="v3-sim-title">CHỈ LÀ MÔ PHỎNG</div>
        <div class="v3-sim-sub">Hai trường ngoài đời vẫn nguyên vẹn 100%</div>
      `;
      this.topRegion.appendChild(stamp);
      return;
    }

    // 10. Event Reveal & Choice (46.5 - 58.35s)
    if (t < 49.8) {
      // Phase 1: Announcement Date (01/11) + Title (max 2 headline lines)
      const pop = springPop(t - 46.5, 190, 14, 0.7);
      const card = document.createElement("div");
      card.className = "v3-outro-card";
      card.style.transform = `scale(${0.9 + 0.1 * clamp01(pop)})`;
      card.innerHTML = `
        <div class="v3-outro-header">
          <img class="v3-outro-logo" src="/assets/hamic-logo.png" alt="HAMIC" />
          <span class="v3-outro-brand">CLB TOÁN TIN HAMIC</span>
        </div>
        <div class="v3-outro-headline">ĐÊM TOÁN TIN</div>
        <div class="v3-outro-date-pill">CÔNG BỐ THÔNG TIN · 01/11</div>
      `;
      this.centerCardRegion.appendChild(card);
    } else if (t < 53.9) {
      // Phase 2: Location Card (HAMIC Booth at HUS Welcome Event, Nguyễn Trãi Campus)
      const pop = springPop(t - 49.8, 190, 14, 0.7);
      const card = document.createElement("div");
      card.className = "v3-outro-card";
      card.style.transform = `scale(${0.9 + 0.1 * clamp01(pop)})`;
      card.innerHTML = `
        <div class="v3-outro-header">
          <img class="v3-outro-logo" src="/assets/hamic-logo.png" alt="HAMIC" />
          <span class="v3-outro-brand">ĐIỂM HẸN CÔNG BỐ 01/11</span>
        </div>
        <div class="v3-outro-loc-line1">Gian hàng CLB Toán Tin HAMIC</div>
        <div class="v3-outro-loc-line2">Sự kiện Chào tân HUS · Cơ sở Nguyễn Trãi</div>
      `;
      this.centerCardRegion.appendChild(card);
    } else {
      // Phase 3: 2-Outcome Choice CTA (53.9 - 58.35s)
      const pop = springPop(t - 53.9, 190, 14, 0.7);
      const highlightSave = t >= 54.45 && t < 55.25;
      const highlightLaunch = t >= 55.25;
      const card = document.createElement("div");
      card.className = "v3-outro-card";
      card.style.transform = `scale(${0.92 + 0.08 * clamp01(pop)})`;
      card.innerHTML = `
        <div class="v3-outro-header">
          <img class="v3-outro-logo" src="/assets/hamic-logo.png" alt="HAMIC" />
          <span class="v3-outro-brand">ĐÊM TOÁN TIN · CÔNG BỐ 01/11</span>
        </div>
        <div class="v3-choice-grid">
          <div class="v3-choice-box ${highlightSave ? "active-save" : ""}">
            <span class="v3-choice-tag">KẾT CỤC A</span>
            <span class="v3-choice-label">CỨU ĐÊM HỘI</span>
          </div>
          <div class="v3-choice-box ${highlightLaunch ? "active-launch" : ""}">
            <span class="v3-choice-tag">KẾT CỤC B</span>
            <span class="v3-choice-label">CHO NỔ CẢ HAI TRƯỜNG</span>
          </div>
        </div>
      `;
      this.centerCardRegion.appendChild(card);
    }
  }

  private renderWordTimedCaptions(timeMs: number): void {
    this.captionRegion.innerHTML = "";
    if (this.overlayMode === "clean") return;

    // Phrase cues use source pauses. No fabricated word-by-word highlights.
    const page = CAPTION_PAGES.find(p => timeMs >= p.startMs && timeMs < p.endMs);
    if (!page) return;
    const lineEl = document.createElement("div");
    lineEl.className = "v3-caption-line";
    const span = document.createElement("span");
    span.className = "v3-word";
    span.textContent = page.text;
    lineEl.appendChild(span);

    this.captionRegion.appendChild(lineEl);
  }

  private makePill(
    badge: string,
    title: string,
    sub: string,
    kind: "gold" | "err" | "ok"
  ): HTMLElement {
    const el = document.createElement("div");
    el.className = "v3-pill-card";
    const badgeClass =
      kind === "err" ? "v3-pill-badge err" : kind === "ok" ? "v3-pill-badge ok" : "v3-pill-badge";
    el.innerHTML = `
      <span class="${badgeClass}">${badge}</span>
      <div class="v3-pill-body">
        <div class="v3-pill-title">${title}</div>
        <div class="v3-pill-sub">${sub}</div>
      </div>
    `;
    return el;
  }
}
