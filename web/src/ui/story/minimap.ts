/**
 * Bản đồ nhỏ góc phải trên: lối đi (map.json → walk), vị trí người chơi, việc tiếp theo, đèn đã thắp.
 * Vẽ bằng canvas 2D, cập nhật 5 lần/giây để nhẹ cho máy yếu. Bấm vào một điểm để được dẫn đường tới đó.
 */

import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { walkPosition, walkTo, walkToPoint } from "../../scene/walking";
import { el } from "../dom";
import { INK } from "../widgets";

export function minimap(getTarget: () => string | null, getLamps: () => readonly string[], getNpcs: () => { node: string; main: boolean; sidequest?: boolean }[]) {
  const canvas = el("canvas", { class: "minimap-canvas", width: 220, height: 150, role: "img", "aria-label": t("story.ui.map") }) as HTMLCanvasElement;
  const root = el("div", { class: "minimap panel" }, canvas);
  const g = canvas.getContext("2d")!;
  const m = DATA.map, nodes = m.walk.nodes;
  const xs = nodes.map((n) => n.x), zs = nodes.map((n) => n.z);
  const [x0, x1, z0, z1] = [Math.min(...xs) - 18, Math.max(...xs) + 18, Math.min(...zs) - 14, Math.max(...zs) + 14];
  const W = canvas.width, H = canvas.height, pad = 12;
  // Nhìn từ cổng HUS vào trong: x sang phải, z âm (sâu trong trường) lên trên.
  const px = (x: number) => pad + ((x - x0) / (x1 - x0)) * (W - 2 * pad);
  const pz = (z: number) => pad + ((z - z0) / (z1 - z0)) * (H - 2 * pad);
  const unpx = (cx: number) => x0 + ((cx - pad) / (W - 2 * pad)) * (x1 - x0);
  const unpz = (cy: number) => z0 + ((cy - pad) / (H - 2 * pad)) * (z1 - z0);
  const at = (id: string) => nodes.find((n) => n.id === id)!;
  const draw = () => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.07)";
    for (const b of m.buildings) {
      g.fillRect(px(b.x) - 4, pz(b.z) - 3, 8, 6);
    }
    g.strokeStyle = "rgba(255,255,255,.24)"; g.lineWidth = 2.2; g.lineCap = "round";
    for (const [a, b] of m.walk.edges) { g.beginPath(); g.moveTo(px(at(a).x), pz(at(a).z)); g.lineTo(px(at(b).x), pz(at(b).z)); g.stroke(); }
    const lamps = getLamps();
    for (const n of nodes) {
      g.fillStyle = lamps.includes(n.id) ? INK.light : INK.grey;
      g.beginPath(); g.arc(px(n.x), pz(n.z), 2.8, 0, Math.PI * 2); g.fill();
    }
    for (const npc of getNpcs()) {
      const n = at(npc.node);
      if (!n) continue;
      g.fillStyle = npc.main ? INK.light : npc.sidequest ? INK.good : INK.lightB;
      g.beginPath(); g.arc(px(n.x) + 4, pz(n.z) - 4, npc.main ? 4 : npc.sidequest ? 3.4 : 2.5, 0, Math.PI * 2); g.fill();
    }
    const target = getTarget();
    if (target) { const n = at(target); if (n) { g.strokeStyle = INK.light; g.lineWidth = 2; g.beginPath(); g.arc(px(n.x), pz(n.z), 7.5, 0, Math.PI * 2); g.stroke(); } }
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
    let best: string | null = null, bd = 12;
    for (const n of nodes) { const d = Math.hypot(px(n.x) - x, pz(n.z) - y); if (d < bd) { bd = d; best = n.id; } }
    if (best) walkTo(best);
    else walkToPoint(unpx(x), unpz(y));
  });
  const timer = window.setInterval(draw, 200);
  return { root, draw, destroy: () => clearInterval(timer) };
}
