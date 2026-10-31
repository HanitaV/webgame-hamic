/** Soft textures drawn in code for the 3D scene (no image files, no licences to track). */

import * as THREE from "three";

/** Radial glow used for halos and sparks. */
export function glowTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.75)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Fine polar grid for the platform top. */
export function platformTexture(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, "#1a1f38");
  grd.addColorStop(0.7, "#10142a");
  grd.addColorStop(1, "#0b0e1f");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "rgba(140,160,255,0.10)";
  g.lineWidth = 1.5;
  for (let k = 1; k <= 8; k += 1) { g.beginPath(); g.arc(r, r, (r * k) / 8.4, 0, Math.PI * 2); g.stroke(); }
  for (let k = 0; k < 28; k += 1) {
    const a = (k / 28) * Math.PI * 2;
    g.beginPath(); g.moveTo(r + Math.cos(a) * r * 0.12, r + Math.sin(a) * r * 0.12); g.lineTo(r + Math.cos(a) * r * 0.95, r + Math.sin(a) * r * 0.95); g.stroke();
  }
  g.strokeStyle = "rgba(255,210,94,0.35)";
  g.lineWidth = 3;
  g.beginPath(); g.arc(r, r, r * 0.97, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
