/**
 * Thẻ Hội tụ (GDD 8.3): an image made in the browser with the game name, stars, lit circuits and an
 * optional nickname. Saved on the device or handed to the OS share sheet; nothing is uploaded.
 */

import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { P, allLit, journeyStars, maxStars, setFlag } from "../../game/progress";
import { settings } from "../../game/settings";
import { storyProgress } from "../../game/story";
import { btn, el, hamicChip } from "../dom";
import { toast } from "../overlay";
import { back } from "../router";

let cachedMark: HTMLImageElement | null | undefined;
function loadHamicMark(): Promise<HTMLImageElement | null> {
  if (cachedMark !== undefined) return Promise.resolve(cachedMark);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { cachedMark = img; resolve(img); };
    img.onerror = () => { cachedMark = null; resolve(null); };
    img.src = "./assets/hamic-mark.png";
  });
}

/** Basic word filter for nicknames (GDD 8.3), compared without diacritics. */
/** Compared without diacritics: words with no innocent look-alike. */
const BLOCK_PLAIN = ["dm", "dmm", "dcm", "dkm", "dit", "vcl", "vl", "clgt", "fuck", "shit", "bitch", "dick", "sex"];
/** Compared with diacritics: plain forms collide with ordinary words (các, lớn, đeo, ngủ). */
const BLOCK_EXACT = ["lồn", "cặc", "buồi", "đéo", "ngu", "đĩ"];
const strip = (s: string) => s.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "");

export function nicknameOk(name: string) {
  const plain = ` ${strip(name).split(/[^a-z0-9]+/).filter(Boolean).join(" ")} `;
  const exact = ` ${name.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(" ")} `;
  return !BLOCK_PLAIN.some((b) => plain.includes(` ${b} `)) && !BLOCK_EXACT.some((b) => exact.includes(` ${b} `));
}

export async function drawCard(canvas: HTMLCanvasElement, nickname: string) {
  const [, mark] = await Promise.all([
    document.fonts.load('800 64px "Be Vietnam Pro"'),
    loadHamicMark(),
  ]);
  const W = 1200, H = 630;
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext("2d")!;
  const F = (w: number, px: number) => `${w} ${px}px "Be Vietnam Pro", system-ui, sans-serif`;
  // night background infused with HAMIC burgundy & royal-navy ambient tones + gold convergence glow
  g.fillStyle = "#070912"; g.fillRect(0, 0, W, H);
  const burg = g.createRadialGradient(140, 90, 0, 140, 90, 560);
  burg.addColorStop(0, "rgba(142,25,43,0.34)"); burg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = burg; g.fillRect(0, 0, W, H);
  const navy = g.createRadialGradient(1060, 540, 0, 1060, 540, 540);
  navy.addColorStop(0, "rgba(27,69,136,0.30)"); navy.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = navy; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(900, 330, 0, 900, 330, 520);
  glow.addColorStop(0, "rgba(255,210,94,0.22)"); glow.addColorStop(0.5, "rgba(43,176,246,0.08)"); glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // top HAMIC tricolor ribbon
  const rib = g.createLinearGradient(0, 0, W, 0);
  rib.addColorStop(0, "#d41e3a"); rib.addColorStop(0.36, "#f59227"); rib.addColorStop(0.68, "#ffd25e"); rib.addColorStop(1, "#2bb0f6");
  g.fillStyle = rib; g.fillRect(0, 0, W, 5);
  let s = 70;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 160; i += 1) { g.fillStyle = `rgba(223,230,255,${0.2 + rnd() * 0.6})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 1.6 + 0.3, 0, Math.PI * 2); g.fill(); }
  // seven lamps on a ring, lines converging to the centre
  const lit = new Set([...P.get().lit, ...P.get().casualLit]);
  const cx = 900, cy = 330, R = 170;
  DATA.circuits.forEach((c, i) => {
    const a = -Math.PI / 2 + (i / DATA.circuits.length) * Math.PI * 2;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    const on = lit.has(c.id);
    g.strokeStyle = on ? c.color : "rgba(255,255,255,0.08)"; g.lineWidth = on ? 2.5 : 1.5;
    g.save(); if (on) { g.shadowColor = c.color; g.shadowBlur = 18; }
    g.beginPath(); g.moveTo(x, y); g.lineTo(cx, cy); g.stroke();
    g.fillStyle = on ? c.color : "#1b2038"; g.beginPath(); g.arc(x, y, 24, 0, Math.PI * 2); g.fill();
    g.restore();
    g.fillStyle = on ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.12)"; g.beginPath(); g.arc(x - 6, y - 7, 7, 0, Math.PI * 2); g.fill();
    g.font = F(600, 18); g.fillStyle = on ? "#eef1fb" : "#6c7594"; g.textAlign = "center";
    g.fillText(c.name, x, y + (Math.sin(a) > 0.3 ? 50 : -36));
  });
  g.save(); g.shadowColor = "#ffd25e"; g.shadowBlur = 40;
  g.fillStyle = "#ffd25e"; g.beginPath(); g.arc(cx, cy, 34, 0, Math.PI * 2); g.fill(); g.restore();
  g.font = F(800, 30); g.fillStyle = "#2a1d00"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("70", cx, cy + 1);
  // HAMIC header lockup + signs
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  let headerX = 72;
  if (mark) {
    g.drawImage(mark, 68, 56, 68, 68);
    headerX = 150;
  }
  g.font = F(700, 23); g.fillStyle = "#ffd25e"; g.fillText(DATA.config.credits, headerX, 86);
  const credW = g.measureText(DATA.config.credits).width;
  g.font = F(500, 16); g.fillStyle = "#a1a9c6"; g.fillText(t("hamic.sub"), headerX, 112);
  // HAMIC signs pill (A+ · $)
  g.font = F(800, 17);
  const sx0 = headerX + credW + 14;
  g.fillStyle = "rgba(212,30,58,0.2)"; g.strokeStyle = "rgba(212,30,58,0.5)"; g.lineWidth = 1.5;
  g.beginPath(); g.roundRect(sx0, 64, 42, 28, 14); g.fill(); g.stroke();
  g.fillStyle = "#ff5c77"; g.textAlign = "center"; g.fillText("A+", sx0 + 21, 84);
  g.fillStyle = "rgba(245,146,39,0.2)"; g.strokeStyle = "rgba(245,146,39,0.5)";
  g.beginPath(); g.roundRect(sx0 + 50, 64, 34, 28, 14); g.fill(); g.stroke();
  g.fillStyle = "#ffb84d"; g.fillText("$", sx0 + 67, 84);
  g.textAlign = "left";
  g.font = F(800, 74); g.fillStyle = "#eef1fb";
  const lead = t("title.logoLead");
  g.fillText(lead, 66, 222);
  const leadW = g.measureText(`${lead} `).width;
  g.save(); g.shadowColor = "#ffd25e"; g.shadowBlur = 30; g.fillStyle = "#ffd25e"; g.fillText(t("title.logoAccent"), 66 + leadW, 222); g.restore();
  g.font = F(500, 30); g.fillStyle = "#d6dbee";
  g.fillText(nickname ? t("card.by", { name: nickname }) : t("card.anon"), 72, 290);
  // stars pill
  g.fillStyle = "rgba(255,210,94,0.12)"; g.strokeStyle = "rgba(255,210,94,0.5)"; g.lineWidth = 2;
  g.beginPath(); g.roundRect(72, 340, 300, 84, 42); g.fill(); g.stroke();
  g.font = F(800, 44); g.fillStyle = "#ffd25e"; g.fillText(`★ ${journeyStars()}/${maxStars()}`, 104, 398);
  g.font = F(500, 24); g.fillStyle = "#9aa3bf";
  g.fillText(t("card.lit", { n: lit.size, max: DATA.circuits.length }), 72, 480);
  const st = storyProgress.get();
  if (allLit() || st.endingsSeen.includes("E6") || (st.eggs?.length ?? 0) >= 8 || st.lamps.length >= 19) {
    g.font = F(600, 20); g.fillStyle = "#ffd25e";
    g.fillText(`✦ ${t("card.explorerBadge")}`, 72, 532);
    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI * 0.78 + (i / 7) * Math.PI * 0.56;
      const sx = cx + Math.cos(a) * (R + 44), sy = cy + Math.sin(a) * (R + 44);
      g.fillStyle = "rgba(255,210,94,0.75)";
      g.beginPath(); g.arc(sx, sy, i === 3 || i === 4 ? 3.2 : 2.2, 0, Math.PI * 2); g.fill();
    }
  }
  // HAMIC ASCII binary signature footer
  g.font = '700 15px ui-monospace, "SF Mono", Menlo, monospace';
  g.textAlign = "left";
  const bytes = ["01001000", "01000001", "01001101", "01001001", "01000011"];
  let bx = 72;
  bytes.forEach((b, i) => {
    g.fillStyle = i % 2 === 0 ? "rgba(245,146,39,0.78)" : "rgba(255,92,119,0.82)";
    g.fillText(b, bx, 584);
    bx += g.measureText(b).width + 12;
  });
}

export function screenShare(root: HTMLElement) {
  const canvas = el("canvas", { class: "card-preview", role: "img", "aria-label": t("card.preview") }) as HTMLCanvasElement;
  const input = el("input", { type: "text", class: "field", maxlength: 24, value: settings.get().nickname, "aria-label": t("card.nickname"), placeholder: t("card.placeholder") }) as HTMLInputElement;
  const status = el("p", { class: "muted", role: "status" });
  const redraw = () => {
    const name = input.value.trim();
    if (!nicknameOk(name)) { status.textContent = t("card.badName"); return false; }
    status.textContent = "";
    settings.set({ nickname: name });
    void drawCard(canvas, name);
    return true;
  };
  input.addEventListener("input", redraw);
  const blob = () => new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  const save = async () => {
    if (!redraw()) return;
    await drawCard(canvas, input.value.trim());
    const b = await blob();
    if (!b) return;
    const a = el("a", { href: URL.createObjectURL(b), download: "the-dem-toan-tin.png" });
    document.body.append(a); a.click(); a.remove();
    setFlag("cardExported");
    toast(t("card.saved"), "", "info");
  };
  const share = async () => {
    if (!redraw()) return;
    await drawCard(canvas, input.value.trim());
    const b = await blob();
    if (!b) return;
    const file = new File([b], "the-dem-toan-tin.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: DATA.config.title, text: t("card.shareText") });
      else { await save(); return; }
      setFlag("cardExported");
    } catch { /* user closed the sheet */ }
  };
  redraw();
  root.append(el("div", { class: "screen share-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.card") }), hamicChip()),
    el("div", { class: "two-pane share-pane" },
      el("div", { class: "stage-frame card-wrap" }, canvas),
      el("div", { class: "panel dark" },
        el("label", { class: "ctl-label", text: t("card.nickname") }), input,
        el("p", { class: "muted small", text: t("card.privacy") }),
        btn(t("card.save"), () => void save(), "primary wide"),
        typeof navigator.share === "function" ? btn(t("card.share"), () => void share(), "wide") : null,
        status))));
}
