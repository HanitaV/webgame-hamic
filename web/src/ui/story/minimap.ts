/**
 * Bản đồ nhỏ góc phải trên: lối đi (map.json → walk), vị trí người chơi, việc tiếp theo, đèn đã thắp.
 * Vẽ bằng canvas 2D, cập nhật 5 lần/giây để nhẹ cho máy yếu. Bấm vào một điểm để được dẫn đường tới đó.
 */

import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { walkPosition, walkTo } from "../../scene/walking";
import { el } from "../dom";
import { INK } from "../widgets";

export function minimap(getTarget: () => string | null, getLamps: () => readonly string[], getNpcs: () => { node: string; main: boolean }[]) {
  const canvas = el("canvas", { class: "minimap-canvas", width: 220, height: 150, role: "img", "aria-label": t("story.ui.map") }) as HTMLCanvasElement;
  const root = el("div", { class: "minimap panel" }, canvas);
  const g = canvas.getContext("2d")!;
  const m = DATA.map, nodes = m.walk.nodes;
  const xs = nodes.map((n) => n.x), zs = nodes.map((n) => n.z);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const W = canvas.width, H = canvas.height, pad = 14;
  // Nhìn từ cổng HUS vào trong: x sang phải, z âm (sâu trong trường) lên trên.
  const px = (x: number) => pad + ((x - x0) / (x1 - x0)) * (W - 2 * pad);
  const pz = (z: number) => pad + ((z - z0) / (z1 - z0)) * (H - 2 * pad);
  const at = (id: string) => nodes.find((n) => n.id === id)!;
  const draw = () => {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = 3; g.lineCap = "round";
    for (const [a, b] of m.walk.edges) { g.beginPath(); g.moveTo(px(at(a).x), pz(at(a).z)); g.lineTo(px(at(b).x), pz(at(b).z)); g.stroke(); }
    const lamps = getLamps();
    for (const n of nodes) {
      g.fillStyle = lamps.includes(n.id) ? INK.light : INK.grey;
      g.beginPath(); g.arc(px(n.x), pz(n.z), 3, 0, Math.PI * 2); g.fill();
    }
    for (const npc of getNpcs()) {
      const n = at(npc.node); g.fillStyle = npc.main ? INK.light : INK.lightB;
      g.beginPath(); g.arc(px(n.x) + 5, pz(n.z) - 5, npc.main ? 4 : 2.5, 0, Math.PI * 2); g.fill();
    }
    const target = getTarget();
    if (target) { const n = at(target); g.strokeStyle = INK.light; g.lineWidth = 2; g.beginPath(); g.arc(px(n.x), pz(n.z), 8, 0, Math.PI * 2); g.stroke(); }
    const p = walkPosition();
    if (p) {
      const x = p.x / m.scale + m.origin[0], z = p.z / m.scale + m.origin[1];
      g.fillStyle = INK.good; g.strokeStyle = INK.bg; g.lineWidth = 2;
      g.beginPath(); g.arc(px(x), pz(z), 5, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  };
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    let best: string | null = null, bd = 16;
    for (const n of nodes) { const d = Math.hypot(px(n.x) - x, pz(n.z) - y); if (d < bd) { bd = d; best = n.id; } }
    if (best) walkTo(best);
  });
  const timer = window.setInterval(draw, 200);
  return { root, draw, destroy: () => clearInterval(timer) };
}
