/**
 * Joystick ảo cho màn đi bộ: kéo núm trong vòng tròn, hướng kéo là hướng đi, độ lệch là tốc độ.
 * Dùng được bằng ngón tay và chuột; bàn phím vẫn dùng WASD/mũi tên. Có vùng chết nhỏ ở giữa.
 */

import { el } from "./dom";

export function joystick(label: string, onMove: (x: number, z: number) => void) {
  const knob = el("span", { class: "joy-knob" });
  const root = el("div", { class: "joystick", role: "application", "aria-label": label }, el("span", { class: "joy-ring" }), knob);
  let id: number | null = null, cx = 0, cy = 0, r = 1;
  const move = (e: PointerEvent) => {
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > r) { dx *= r / d; dy *= r / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const m = Math.min(1, d / r);
    if (m < 0.15) onMove(0, 0);
    else onMove((dx / r), (dy / r));
  };
  const end = () => {
    id = null; root.classList.remove("active");
    knob.style.transform = "";
    onMove(0, 0);
  };
  root.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const rect = root.getBoundingClientRect();
    cx = rect.left + rect.width / 2; cy = rect.top + rect.height / 2; r = rect.width / 2 - 14;
    id = e.pointerId; root.setPointerCapture(e.pointerId); root.classList.add("active");
    move(e);
  });
  root.addEventListener("pointermove", (e) => { if (e.pointerId === id) move(e); });
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  root.addEventListener("lostpointercapture", end);
  return { root, release: end };
}
