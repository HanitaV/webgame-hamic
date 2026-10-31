import { decisionAtTime } from "./timeline";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(a: number, b: number, x: number): number {
  const u = clamp01((x - a) / Math.max(1e-6, b - a));
  return u * u * (3 - 2 * u);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  lineWidth = 2,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export class TrailerHudRenderer {
  private logo: HTMLImageElement | null = null;

  async init(baseUrl: string): Promise<void> {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => {
        this.logo = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = `${baseUrl}assets/hamic-logo.png`;
    });
  }

  private drawLogoBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 210, 94, 0.22)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffd25e";
    ctx.stroke();

    if (this.logo) {
      ctx.drawImage(this.logo, cx - radius, cy - radius, radius * 2, radius * 2);
    }
    ctx.restore();
  }

  private drawTopHeader(ctx: CanvasRenderingContext2D, t: number) {
    // Persistent subtle top-left brand pill
    roundRect(
      ctx,
      64,
      44,
      390,
      58,
      29,
      "rgba(10, 14, 28, 0.82)",
      "rgba(255, 210, 94, 0.38)",
      2,
    );
    this.drawLogoBadge(ctx, 96, 73, 20);
    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 20px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("CLB TOÁN TIN HAMIC", 128, 66);
    ctx.fillStyle = "#9aa3c2";
    ctx.font = '600 13px "Be Vietnam Pro", sans-serif';
    ctx.fillText("ĐÊM TOÁN TIN • USSH × HUS", 128, 86);

    // Top-right timecode / mode indicator
    roundRect(
      ctx,
      1610,
      44,
      246,
      54,
      27,
      "rgba(10, 14, 28, 0.78)",
      "rgba(255, 255, 255, 0.16)",
      1.5,
    );
    const isDanger = t >= 32.75 && t < 47.25;
    ctx.beginPath();
    ctx.arc(1640, 71, 7, 0, Math.PI * 2);
    ctx.fillStyle = isDanger ? "#ff6b81" : "#5eeaa0";
    ctx.fill();
    ctx.fillStyle = "#eef1fb";
    ctx.font = '700 16px "Be Vietnam Pro", monospace';
    ctx.textAlign = "left";
    ctx.fillText(isDanger ? "SIM: OVERDRIVE" : "SIM: ACTIVE", 1658, 72);
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    const scaleX = width / 1920;
    const scaleY = height / 1080;
    ctx.scale(scaleX, scaleY);

    // Subtle cinematic vignette at edges
    const grad = ctx.createRadialGradient(960, 540, 520, 960, 540, 1120);
    grad.addColorStop(0, "rgba(7, 9, 18, 0)");
    grad.addColorStop(1, "rgba(5, 7, 15, 0.42)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    if (t < 57.15) {
      this.drawTopHeader(ctx, t);
    }

    if (t < 3.8) {
      this.drawScene01Hook(ctx, t);
    } else if (t < 7.8) {
      this.drawScene02Mission(ctx, t);
    } else if (t < 15.8) {
      this.drawScene03Incidents(ctx, t);
    } else if (t < 31.0) {
      this.drawScene04Decisions(ctx, t);
    } else if (t < 35.0) {
      this.drawScene05RiskChoice(ctx, t);
    } else if (t < 38.0) {
      this.drawScene06Countdown(ctx, t);
    } else if (t < 46.0) {
      this.drawScene07Climax(ctx, t);
    } else if (t < 49.8) {
      this.drawScene08Disclaimer(ctx, t);
    } else if (t < 55.65) {
      this.drawScene09Announcement(ctx, t);
    } else {
      this.drawScene10SplitAndEndCard(ctx, t);
    }

    ctx.restore();
  }

  private drawScene01Hook(ctx: CanvasRenderingContext2D, t: number) {
    const enter = smoothstep(0.15, 0.85, t);
    const exit = 1 - smoothstep(3.2, 3.75, t);
    const alpha = enter * exit;
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    const yOff = (1 - enter) * 28;
    ctx.translate(0, yOff);

    roundRect(
      ctx,
      410,
      140,
      1100,
      195,
      28,
      "rgba(10, 14, 28, 0.84)",
      "rgba(255, 210, 94, 0.65)",
      3,
    );

    this.drawLogoBadge(ctx, 515, 237, 54);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#5ad8ff";
    ctx.font = '800 22px "Be Vietnam Pro", sans-serif';
    ctx.fillText("CÂU LẠC BỘ TOÁN TIN HAMIC", 595, 192);

    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 58px "Be Vietnam Pro", sans-serif';
    ctx.fillText("MỘT NGÀY Ở HAMIC?", 595, 254);

    ctx.restore();
  }

  private drawScene02Mission(ctx: CanvasRenderingContext2D, t: number) {
    const alpha = smoothstep(3.85, 4.3, t) * (1 - smoothstep(7.35, 7.78, t));
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    roundRect(
      ctx,
      460,
      126,
      1000,
      154,
      24,
      "rgba(10, 14, 28, 0.86)",
      "rgba(90, 216, 255, 0.6)",
      2.5,
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 42px "Be Vietnam Pro", sans-serif';
    ctx.fillText("ĐÊM HỘI SẮP BẮT ĐẦU", 960, 174);

    // Route progress bar HUS -> USSH
    const u = clamp01((t - 3.9) / 3.6);
    ctx.fillStyle = "#5ad8ff";
    ctx.font = '800 24px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("HUS (Tự Nhiên)", 710, 236);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd25e";
    ctx.fillText("USSH (Nhân Văn)", 1210, 236);

    roundRect(ctx, 735, 226, 450, 18, 9, "rgba(255,255,255,0.14)");
    roundRect(ctx, 735, 226, Math.max(24, 450 * u), 18, 9, "#ffd25e");
    ctx.beginPath();
    ctx.arc(735 + 450 * u, 235, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#5ad8ff";
    ctx.fill();

    ctx.restore();
  }

  private drawScene03Incidents(ctx: CanvasRenderingContext2D, t: number) {
    ctx.save();
    if (t < 9.65) {
      // Shot 3A: Đèn lệch nhịp
      roundRect(
        ctx,
        430,
        125,
        1060,
        168,
        22,
        "rgba(14, 18, 34, 0.88)",
        "rgba(255, 107, 129, 0.75)",
        3,
      );
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 22px "Be Vietnam Pro", sans-serif';
      ctx.fillText("SỰ CỐ 01 / 04 • MẠCH ĐÈN QUẢNG TRƯỜNG", 960, 165);
      ctx.fillStyle = "#eef1fb";
      ctx.font = '800 38px "Be Vietnam Pro", sans-serif';
      ctx.fillText("⚠️ HÀNG ĐÈN LỆCH ĐÚNG 1 NHỊP!", 960, 212);

      for (let i = 0; i < 7; i++) {
        const lx = 660 + i * 100;
        const isBad = i === 5;
        roundRect(
          ctx,
          lx - 34,
          240,
          68,
          34,
          10,
          isBad ? "rgba(255, 107, 129, 0.28)" : "rgba(255, 210, 94, 0.2)",
          isBad ? "#ff6b81" : "#ffd25e",
          2,
        );
        ctx.fillStyle = isBad ? "#ff6b81" : "#ffd25e";
        ctx.font = '800 16px "Be Vietnam Pro", monospace';
        ctx.fillText(isBad ? "LỆCH!" : `#${i + 1} OK`, lx, 258);
      }
    } else if (t < 12.05) {
      // Shot 3B: Hai file trùng tên nhưng nội dung khác nhau
      roundRect(
        ctx,
        520,
        118,
        880,
        92,
        18,
        "rgba(14, 18, 34, 0.88)",
        "rgba(255, 107, 129, 0.75)",
        2.5,
      );
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 32px "Be Vietnam Pro", sans-serif';
      ctx.fillText("SỰ CỐ 02 / 04 • HAI FILE TRÙNG TÊN — NỘI DUNG KHÁC NHAU!", 960, 168);

      // Left & Right File Diff Panels
      const files = [
        {
          x: 180,
          folder: "/hus_stage/kich_ban_den.json",
          line2: '  "phase_offset": 0,',
          line3: '  "firework_cap": 70',
          border: "#5ad8ff",
          bad: false,
        },
        {
          x: 1020,
          folder: "/ussh_yard/kich_ban_den.json",
          line2: '  "phase_offset": +1, // LỆCH!',
          line3: '  "firework_cap": 999 // SAI!',
          border: "#ff6b81",
          bad: true,
        },
      ];
      for (const f of files) {
        roundRect(ctx, f.x, 240, 720, 230, 20, "rgba(10, 14, 28, 0.9)", f.border, 3);
        ctx.textAlign = "left";
        ctx.fillStyle = f.border;
        ctx.font = '800 22px "Be Vietnam Pro", monospace';
        ctx.fillText(`📄 ${f.folder}`, f.x + 28, 284);
        ctx.fillStyle = "#9aa3c2";
        ctx.font = '600 21px "Be Vietnam Pro", monospace';
        ctx.fillText("{", f.x + 28, 326);
        roundRect(
          ctx,
          f.x + 22,
          344,
          676,
          76,
          10,
          f.bad ? "rgba(255, 107, 129, 0.22)" : "rgba(94, 234, 160, 0.16)",
        );
        ctx.fillStyle = f.bad ? "#ff6b81" : "#5eeaa0";
        ctx.fillText(f.line2, f.x + 36, 370);
        ctx.fillText(f.line3, f.x + 36, 404);
        ctx.fillStyle = "#9aa3c2";
        ctx.fillText("}", f.x + 28, 444);
      }
    } else if (t < 13.6) {
      // Shot 3C: Gương đặt ngược
      roundRect(
        ctx,
        450,
        125,
        1020,
        145,
        22,
        "rgba(14, 18, 34, 0.88)",
        "rgba(255, 107, 129, 0.75)",
        3,
      );
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 22px "Be Vietnam Pro", sans-serif';
      ctx.fillText("SỰ CỐ 03 / 04 • ĐÀI GƯƠNG NHÀ T1", 960, 164);
      ctx.fillStyle = "#eef1fb";
      ctx.font = '800 38px "Be Vietnam Pro", sans-serif';
      ctx.fillText("GƯƠNG ĐẶT NGƯỢC — CHÙM SÁNG BẮN LỆCH ĐÍCH!", 960, 210);
      ctx.fillStyle = "#ffd25e";
      ctx.font = '700 20px "Be Vietnam Pro", monospace';
      ctx.fillText("Vector phản xạ v' = R_sai · v   (Sai góc Δθ = 90°)", 960, 248);
    } else {
      // Shot 3D: 404 NOTE NOT FOUND & Bản chốt
      roundRect(
        ctx,
        420,
        122,
        1080,
        185,
        24,
        "rgba(14, 18, 34, 0.9)",
        "rgba(255, 107, 129, 0.85)",
        3,
      );
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 48px "Be Vietnam Pro", monospace';
      ctx.fillText("404 NOTE NOT FOUND", 960, 178);
      ctx.fillStyle = "#eef1fb";
      ctx.font = '700 28px "Be Vietnam Pro", sans-serif';
      ctx.fillText("Lời ghi biến mất — Chẳng ai nhớ đã chốt bản nào!", 960, 230);

      const badges = ["chot_v1.json ?", "chot_FINAL.json ?", "chot_REAL_v3.json ?"];
      badges.forEach((b, i) => {
        const bx = 560 + i * 280;
        roundRect(ctx, bx, 256, 240, 38, 12, "rgba(255, 210, 94, 0.16)", "#ffd25e", 1.5);
        ctx.fillStyle = "#ffd25e";
        ctx.font = '700 17px "Be Vietnam Pro", monospace';
        ctx.fillText(b, bx + 120, 276);
      });
    }
    ctx.restore();
  }

  private drawScene04Decisions(ctx: CanvasRenderingContext2D, t: number) {
    const shot = decisionAtTime(t);
    ctx.save();

    // Top 8-step decision progress strip
    roundRect(
      ctx,
      360,
      118,
      1200,
      68,
      20,
      "rgba(10, 14, 28, 0.86)",
      "rgba(255, 255, 255, 0.18)",
      2,
    );
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 22px "Be Vietnam Pro", sans-serif';
    ctx.fillText("8 QUYẾT ĐỊNH ĐANG CHỜ:", 392, 153);

    for (let i = 1; i <= 8; i++) {
      const bx = 695 + (i - 1) * 104;
      const active = i === shot.index;
      const done = i < shot.index;
      roundRect(
        ctx,
        bx,
        132,
        92,
        40,
        12,
        active
          ? "rgba(255, 210, 94, 0.28)"
          : done
            ? "rgba(94, 234, 160, 0.2)"
            : "rgba(255, 255, 255, 0.07)",
        active ? "#ffd25e" : done ? "#5eeaa0" : "rgba(255,255,255,0.15)",
        active ? 2.5 : 1.5,
      );
      ctx.textAlign = "center";
      ctx.fillStyle = active ? "#ffd25e" : done ? "#5eeaa0" : "#9aa3c2";
      ctx.font = '800 18px "Be Vietnam Pro", monospace';
      ctx.fillText(`0${i}/08`, bx + 46, 153);
    }

    // Main Math / CS HUD Card for current decision
    roundRect(
      ctx,
      110,
      212,
      820,
      250,
      24,
      "rgba(10, 14, 28, 0.88)",
      shot.color,
      3,
    );
    roundRect(ctx, 138, 236, 128, 42, 12, shot.color);
    ctx.fillStyle = "#070912";
    ctx.font = '800 22px "Be Vietnam Pro", monospace';
    ctx.textAlign = "center";
    ctx.fillText(shot.badge, 202, 258);

    ctx.textAlign = "left";
    ctx.fillStyle = "#eef1fb";
    ctx.font = '800 34px "Be Vietnam Pro", sans-serif';
    ctx.fillText(shot.title, 284, 258);

    ctx.fillStyle = shot.color;
    ctx.font = '700 22px "Be Vietnam Pro", sans-serif';
    ctx.fillText(shot.subtitle, 140, 312);

    // Math formula box
    roundRect(
      ctx,
      138,
      340,
      764,
      96,
      16,
      "rgba(255, 255, 255, 0.06)",
      "rgba(255, 255, 255, 0.16)",
      1.5,
    );
    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 28px "Be Vietnam Pro", monospace';
    ctx.fillText(shot.formula, 166, 390);

    // Special right-side interactive widget for key shots
    if (shot.index === 1) {
      // 2x2 Rotation Matrix visual
      roundRect(ctx, 1340, 212, 470, 220, 22, "rgba(10,14,28,0.86)", "#5ad8ff", 2.5);
      ctx.fillStyle = "#5ad8ff";
      ctx.font = '800 22px "Be Vietnam Pro", sans-serif';
      ctx.fillText("MA TRẬN QUAY Rᵀ (CHUẨN HÓA)", 1372, 252);
      ctx.fillStyle = "#eef1fb";
      ctx.font = '800 34px "Be Vietnam Pro", monospace';
      ctx.fillText("┌  0   1 ┐ ┌ vx ┐   ┌  vy ┐", 1372, 315);
      ctx.fillText("└ -1   0 ┘ └ vy ┘ = └ -vx ┘", 1372, 365);
      ctx.fillStyle = "#5eeaa0";
      ctx.font = '700 20px "Be Vietnam Pro", sans-serif';
      ctx.fillText("✓ Điểm đích hội tụ: Sai số 0.00m", 1372, 408);
    } else if (shot.index === 2) {
      // Calculus curve widget
      roundRect(ctx, 1320, 212, 490, 230, 22, "rgba(10,14,28,0.86)", "#ff9a52", 2.5);
      ctx.fillStyle = "#ffd25e";
      ctx.font = '700 20px "Be Vietnam Pro", monospace';
      ctx.fillText("TRẦN AN TOÀN: H_max = 70m", 1350, 252);
      ctx.strokeStyle = "#ff6b81";
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(1350, 275);
      ctx.lineTo(1775, 275);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#5eeaa0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      const prog = clamp01((t - 18.5) / 2.1);
      for (let i = 0; i <= 40; i++) {
        const u = (i / 40) * prog;
        const px = 1350 + u * 425;
        const py = 410 - 132 * (1 - Math.exp(-3.2 * u));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (shot.index === 8) {
      // Tempting extra firework prompt card
      roundRect(ctx, 1240, 212, 570, 230, 22, "rgba(26, 12, 28, 0.9)", "#ff6b81", 3);
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 26px "Be Vietnam Pro", sans-serif';
      ctx.fillText("⚠️ TÙY CHỌN MẠO HIỂM (CHƯA KIỂM THỬ)", 1272, 262);
      ctx.fillStyle = "#eef1fb";
      ctx.font = '700 28px "Be Vietnam Pro", sans-serif';
      ctx.fillText("Thêm +3 chùm pháo đại lễ vào lõi?", 1272, 316);
      ctx.fillStyle = "#ffd25e";
      ctx.font = '800 24px "Be Vietnam Pro", monospace';
      ctx.fillText(">> Hệ số xung lực: 3.4x giới hạn", 1272, 372);
    }

    ctx.restore();
  }

  private drawScene05RiskChoice(ctx: CanvasRenderingContext2D, t: number) {
    ctx.save();
    const clicked = t >= 32.75;
    const clickAge = Math.max(0, t - 32.75);

    // Interactive Decision Modal
    roundRect(
      ctx,
      460,
      150,
      1000,
      360,
      28,
      "rgba(10, 14, 28, 0.92)",
      clicked ? "#ff6b81" : "#ffd25e",
      3.5,
    );

    ctx.textAlign = "center";
    ctx.fillStyle = "#9aa3c2";
    ctx.font = '700 20px "Be Vietnam Pro", monospace';
    ctx.fillText("CẤU HÌNH CUỐI CÙNG TRƯỚC GIỜ G • CIRCUIT #07", 960, 198);

    ctx.fillStyle = "#eef1fb";
    ctx.font = '800 38px "Be Vietnam Pro", sans-serif';
    ctx.fillText("CHỌN ĐẠI MỘT TÍ CHẮC CHẲNG SAO NHỈ?", 960, 250);

    // Option 1: Safe
    roundRect(
      ctx,
      520,
      295,
      410,
      96,
      18,
      "rgba(255, 255, 255, 0.06)",
      "rgba(255, 255, 255, 0.2)",
      2,
    );
    ctx.fillStyle = "#9aa3c2";
    ctx.font = '700 24px "Be Vietnam Pro", sans-serif';
    ctx.fillText("GIỮ MỨC AN TOÀN (70m)", 725, 344);

    // Option 2: [THÊM PHÁO] button
    const btnScale = clicked ? 1 + Math.sin(Math.min(1, clickAge * 4) * Math.PI) * 0.06 : 1;
    ctx.save();
    ctx.translate(1195, 343);
    ctx.scale(btnScale, btnScale);
    roundRect(
      ctx,
      -205,
      -48,
      410,
      96,
      18,
      clicked ? "#ff6b81" : "#ffd25e",
      "#eef1fb",
      3,
    );
    ctx.fillStyle = "#070912";
    ctx.font = '800 28px "Be Vietnam Pro", sans-serif';
    ctx.fillText("🔥 [ THÊM PHÁO! ]", 0, 2);
    ctx.restore();

    // Animated Cursor moving to click [THÊM PHÁO] at 32.75s
    const curProgress = smoothstep(31.2, 32.65, t);
    const curX = 820 + curProgress * 395;
    const curY = 470 - curProgress * 115;
    if (clickAge > 0 && clickAge < 0.7) {
      ctx.beginPath();
      ctx.arc(curX, curY, 18 + clickAge * 85, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 210, 94, ${1 - clickAge / 0.7})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    // Draw clean cursor arrow
    ctx.save();
    ctx.translate(curX, curY);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 34);
    ctx.lineTo(10, 26);
    ctx.lineTo(18, 42);
    ctx.lineTo(25, 38);
    ctx.lineTo(17, 22);
    ctx.lineTo(28, 22);
    ctx.closePath();
    ctx.fillStyle = "#eef1fb";
    ctx.fill();
    ctx.strokeStyle = "#070912";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Comedic Status Badges after click: "Risk level: 99%" and "Looks fine :)"
    if (clicked) {
      const pop = smoothstep(32.78, 33.15, t);
      ctx.save();
      ctx.globalAlpha = pop;
      roundRect(
        ctx,
        520,
        420,
        410,
        64,
        16,
        "rgba(255, 107, 129, 0.24)",
        "#ff6b81",
        2.5,
      );
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 28px "Be Vietnam Pro", monospace';
      ctx.fillText("⚠️ Risk level: 99%", 725, 453);

      roundRect(
        ctx,
        990,
        420,
        410,
        64,
        16,
        "rgba(94, 234, 160, 0.22)",
        "#5eeaa0",
        2.5,
      );
      ctx.fillStyle = "#ffd25e";
      ctx.font = '800 28px "Be Vietnam Pro", monospace';
      ctx.fillText("Looks fine :)", 1195, 453);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawScene06Countdown(ctx: CanvasRenderingContext2D, t: number) {
    ctx.save();
    let label = "3";
    let sub = "KHỞI ĐỘNG LÕI ÁNH SÁNG...";
    let accent = "#5ad8ff";
    if (t >= 37.0) {
      label = "CHẠY MÔ PHỎNG!";
      sub = "KÍCH HOẠT TOÀN BỘ 7 MẠCH • USSH × HUS";
      accent = "#ffd25e";
    } else if (t >= 36.25) {
      label = "1";
      sub = "NẠP XUNG LỰC PHÁO ĐẠI LỄ...";
      accent = "#ff6b81";
    } else if (t >= 35.6) {
      label = "2";
      sub = "ĐỒNG BỘ DÀN DRONE KỶ NIỆM...";
      accent = "#ffd25e";
    }

    const isRun = t >= 37.0;
    roundRect(
      ctx,
      isRun ? 410 : 710,
      145,
      isRun ? 1100 : 500,
      230,
      32,
      "rgba(10, 14, 28, 0.86)",
      accent,
      4,
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = accent;
    ctx.font = `800 ${isRun ? 82 : 124}px "Be Vietnam Pro", sans-serif`;
    ctx.fillText(label, 960, 238);

    ctx.fillStyle = "#eef1fb";
    ctx.font = '700 24px "Be Vietnam Pro", sans-serif';
    ctx.fillText(sub, 960, 332);

    ctx.restore();
  }

  private drawScene07Climax(ctx: CanvasRenderingContext2D, t: number) {
    ctx.save();
    const husAlt = Math.min(85, Math.round(Math.max(0, t - 38.1) * 18));
    const usshAlt = Math.min(72, Math.round(Math.max(0, t - 41.2) * 17));

    // Top Center Alert Banner
    roundRect(
      ctx,
      420,
      118,
      1080,
      115,
      22,
      "rgba(24, 12, 26, 0.88)",
      "#ff6b81",
      3,
    );
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 22px "Be Vietnam Pro", monospace';
    ctx.fillText(
      t < 41.2
        ? "⚠️ CẢNH BÁO MÔ PHỎNG: LỆCH HỆ SỐ ĐẨY (E2 ENDING)"
        : "🚀 KẾT CỤC HÀI E2: TRẠM PHÓNG LIÊN TRƯỜNG!",
      960,
      152,
    );
    ctx.fillStyle = "#eef1fb";
    ctx.font = '800 36px "Be Vietnam Pro", sans-serif';
    const headline =
      t < 41.2
        ? "KHOAN! HUS BẬT KHỎI MẶT ĐẤT TRƯỚC!"
        : t < 43.7
          ? "HUS BAY TRƯỚC — USSH BAY THEO!"
          : "AI BẢO THÊM PHÁO ĐẤY?!";
    ctx.fillText(headline, 960, 198);

    // Telemetry card for HUS (Right / East side)
    roundRect(
      ctx,
      1370,
      260,
      480,
      110,
      18,
      "rgba(10, 14, 28, 0.85)",
      "#ffd25e",
      2.5,
    );
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 26px "Be Vietnam Pro", sans-serif';
    ctx.fillText("🚀 KHỐI NHÀ HUS: ĐÃ PHÓNG", 1400, 300);
    ctx.fillStyle = "#eef1fb";
    ctx.font = '700 22px "Be Vietnam Pro", monospace';
    ctx.fillText(`Độ cao mô phỏng: +${husAlt}m ▲`, 1400, 340);

    // Telemetry card for USSH (Left / West side)
    roundRect(
      ctx,
      70,
      260,
      490,
      110,
      18,
      "rgba(10, 14, 28, 0.85)",
      usshAlt > 0 ? "#5ad8ff" : "rgba(255,255,255,0.22)",
      2.5,
    );
    ctx.fillStyle = usshAlt > 0 ? "#5ad8ff" : "#9aa3c2";
    ctx.font = '800 26px "Be Vietnam Pro", sans-serif';
    ctx.fillText(
      usshAlt > 0 ? "🛸 KHỐI NHÀ USSH: BAY THEO!" : "⏳ KHỐI NHÀ USSH: ĐANG RUNG...",
      100,
      300,
    );
    ctx.fillStyle = "#eef1fb";
    ctx.font = '700 22px "Be Vietnam Pro", monospace';
    ctx.fillText(
      usshAlt > 0 ? `Độ cao mô phỏng: +${usshAlt}m ▲` : "Trạng thái: Chờ xung lực lan sang",
      100,
      340,
    );

    ctx.restore();
  }

  private drawScene08Disclaimer(ctx: CanvasRenderingContext2D, t: number) {
    ctx.save();
    const isRewind = t >= 47.25;

    roundRect(
      ctx,
      310,
      135,
      1300,
      195,
      26,
      "rgba(10, 14, 28, 0.9)",
      "#5eeaa0",
      3,
    );

    ctx.textAlign = "center";
    ctx.fillStyle = "#5eeaa0";
    ctx.font = '800 26px "Be Vietnam Pro", monospace';
    ctx.fillText(
      isRewind ? "⏪ REWIND — KHÔI PHỤC NGUYÊN TRẠNG MÔ HÌNH" : "⏸ PAUSE — SIMULATION ONLY",
      960,
      182,
    );

    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 36px "Be Vietnam Pro", sans-serif';
    ctx.fillText("Đây chỉ là hoạt hình mô phỏng.", 960, 236);

    ctx.fillStyle = "#eef1fb";
    ctx.font = '700 32px "Be Vietnam Pro", sans-serif';
    ctx.fillText("Hai trường ngoài đời vẫn nguyên vẹn.", 960, 288);

    ctx.restore();
  }

  private drawScene09Announcement(ctx: CanvasRenderingContext2D, t: number) {
    const enter = smoothstep(49.85, 50.45, t);
    ctx.save();
    ctx.globalAlpha = enter;

    roundRect(
      ctx,
      280,
      625,
      1360,
      245,
      28,
      "rgba(10, 14, 28, 0.88)",
      "#ffd25e",
      3.5,
    );

    this.drawLogoBadge(ctx, 405, 748, 74);

    // Date pill
    roundRect(ctx, 515, 648, 290, 44, 22, "#ffd25e");
    ctx.textAlign = "center";
    ctx.fillStyle = "#070912";
    ctx.font = '800 22px "Be Vietnam Pro", sans-serif';
    ctx.fillText("CÔNG BỐ 01.11", 660, 671);

    ctx.textAlign = "left";
    ctx.fillStyle = "#5ad8ff";
    ctx.font = '700 22px "Be Vietnam Pro", sans-serif';
    ctx.fillText("SỰ KIỆN TƯƠNG TÁC TRỰC TIẾP • USSH × HUS", 828, 671);

    ctx.fillStyle = "#ffd25e";
    ctx.font = '800 62px "Be Vietnam Pro", sans-serif';
    ctx.fillText("ĐÊM TOÁN TIN", 515, 738);

    ctx.fillStyle = "#eef1fb";
    ctx.font = '700 28px "Be Vietnam Pro", sans-serif';
    ctx.fillText("📍 Gian hàng Câu lạc bộ Toán Tin Hamic", 515, 794);

    ctx.fillStyle = "#5eeaa0";
    ctx.font = '700 25px "Be Vietnam Pro", sans-serif';
    ctx.fillText("✨ Sự kiện Chào Tân HUS — Cơ sở Nguyễn Trãi", 515, 836);

    ctx.restore();
  }

  private drawScene10SplitAndEndCard(ctx: CanvasRenderingContext2D, t: number) {
    ctx.save();

    // Part A: Split-screen comparison overlays (55.65s -> 57.6s)
    const endCardBlend = smoothstep(57.15, 57.65, t);
    if (endCardBlend < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - endCardBlend;

      // Vertical Glowing Divider at x = 960
      ctx.strokeStyle = "#ffd25e";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(960, 0);
      ctx.lineTo(960, 1080);
      ctx.stroke();

      // Left Card: Festive Show
      roundRect(
        ctx,
        90,
        140,
        740,
        130,
        22,
        "rgba(10, 14, 28, 0.88)",
        "#ffd25e",
        3,
      );
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd25e";
      ctx.font = '800 38px "Be Vietnam Pro", sans-serif';
      ctx.fillText("✨ THẮP SÁNG ĐÊM HỘI", 460, 192);
      ctx.fillStyle = "#eef1fb";
      ctx.font = '600 22px "Be Vietnam Pro", sans-serif';
      ctx.fillText("Kết cục E1 / E3: Cầu ánh sáng & 70 Drone", 460, 238);

      // Right Card: Launch Pad
      roundRect(
        ctx,
        1090,
        140,
        740,
        130,
        22,
        "rgba(24, 12, 26, 0.88)",
        "#ff6b81",
        3,
      );
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 38px "Be Vietnam Pro", sans-serif';
      ctx.fillText("🚀 HAY TRẠM PHÓNG?", 1460, 192);
      ctx.fillStyle = "#eef1fb";
      ctx.font = '600 22px "Be Vietnam Pro", sans-serif';
      ctx.fillText("Kết cục E2: HUS bay trước, USSH bay theo!", 1460, 238);

      // Center OR badge
      roundRect(ctx, 885, 172, 150, 64, 32, "#ffd25e", "#070912", 4);
      ctx.fillStyle = "#070912";
      ctx.font = '800 28px "Be Vietnam Pro", sans-serif';
      ctx.fillText("HOẶC", 960, 205);

      ctx.restore();
    }

    // Part B: Final End Card (held cleanly through 59.00s)
    if (endCardBlend > 0.01) {
      ctx.save();
      ctx.globalAlpha = endCardBlend;

      // Rich night backdrop overlay so the final card is bold, legible, and iconic
      ctx.fillStyle = "rgba(7, 9, 18, 0.78)";
      ctx.fillRect(0, 0, 1920, 1080);

      roundRect(
        ctx,
        200,
        110,
        1520,
        790,
        36,
        "rgba(12, 16, 32, 0.94)",
        "#ffd25e",
        4,
      );

      this.drawLogoBadge(ctx, 960, 245, 78);

      ctx.textAlign = "center";
      ctx.fillStyle = "#5ad8ff";
      ctx.font = '800 26px "Be Vietnam Pro", sans-serif';
      ctx.fillText("CÂU LẠC BỘ TOÁN TIN HAMIC • TRÒ CHƠI TƯƠNG TÁC", 960, 365);

      ctx.fillStyle = "#ffd25e";
      ctx.font = '800 72px "Be Vietnam Pro", sans-serif';
      ctx.fillText("ĐÊM TOÁN TIN", 960, 445);

      ctx.fillStyle = "#eef1fb";
      ctx.font = '800 44px "Be Vietnam Pro", sans-serif';
      ctx.fillText("BẠN SẼ CHỌN KẾT CỤC NÀO?", 960, 525);

      // Dual option pills on End Card
      roundRect(ctx, 320, 575, 590, 84, 20, "rgba(255, 210, 94, 0.18)", "#ffd25e", 2.5);
      ctx.fillStyle = "#ffd25e";
      ctx.font = '800 30px "Be Vietnam Pro", sans-serif';
      ctx.fillText("✨ THẮP SÁNG ĐÊM HỘI", 615, 618);

      roundRect(ctx, 1010, 575, 590, 84, 20, "rgba(255, 107, 129, 0.2)", "#ff6b81", 2.5);
      ctx.fillStyle = "#ff6b81";
      ctx.font = '800 30px "Be Vietnam Pro", sans-serif';
      ctx.fillText("🚀 BIẾN THÀNH TRẠM PHÓNG", 1305, 618);

      // Event Info Footer Box
      roundRect(
        ctx,
        320,
        695,
        1280,
        155,
        22,
        "rgba(255, 255, 255, 0.06)",
        "rgba(90, 216, 255, 0.45)",
        2,
      );
      ctx.fillStyle = "#5eeaa0";
      ctx.font = '800 32px "Be Vietnam Pro", sans-serif';
      ctx.fillText(
        "📅 CÔNG BỐ NGÀY 01.11 • TẠI GIAN HÀNG CLB TOÁN TIN HAMIC",
        960,
        746,
      );
      ctx.fillStyle = "#eef1fb";
      ctx.font = '700 28px "Be Vietnam Pro", sans-serif';
      ctx.fillText(
        "📍 Cơ sở Nguyễn Trãi — Sự kiện Chào Tân của HUS",
        960,
        802,
      );

      ctx.restore();
    }

    ctx.restore();
  }
}
