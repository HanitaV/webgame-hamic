/**
 * 2D map in a corner: campus outline, buildings, gates, deadlines, and where the player or camera is.
 * The static layer is drawn once to an offscreen canvas; each update only redraws markers.
 */

type Rect = [number, number, number, number];

export interface MapBuilding {
  id: string;
  group: string;
  campus: string;
  access: string;
  footprint: Rect;
  name: string;
}

export interface MapSurface {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

export interface MapMarker {
  x: number;
  z: number;
  heading?: number;
  label?: string;
}


const SURFACE_FILL: Record<string, string> = {
  road: "#7b8487",
  paving: "#e2ddcf",
  axis: "#eee7d6",
  parking: "#b9bbb4",
  garden: "#9dbd88",
};

function shortName(b: MapBuilding) {
  if (b.campus === "USSH") {
    const m = b.name.match(/Nhà (\S+)/);
    if (m) return m[1];
    return b.name === "Căng tin" ? "CT" : "";
  }
  if (/^T\d$/.test(b.group)) return b.group;
  if (b.group === "SPECIAL") return "CĐ";
  if (b.group === "CANTEEN") return "CT";
  return "";
}

export class Minimap {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private base: HTMLCanvasElement;
  private scale = 1;
  private dpr = 1;
  private size = { w: 0, h: 0 };

  constructor(
    host: HTMLElement,
    private buildings: MapBuilding[],
    private surfaces: MapSurface[],
    private gates: { label: string; center_xz: [number, number]; campus: string }[],
    private links: { rect: Rect }[],
    private bounds: { x0: number; z0: number; x1: number; z1: number },
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", "Bản đồ nhỏ USSH và HUS");
    host.append(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
    this.base = document.createElement("canvas");
  }

  /** Map coordinates → canvas pixels (CSS px). North (−Z) is up, east (+X) is right. */
  toMap(x: number, z: number): [number, number] {
    return [(x - this.bounds.x0) * this.scale, (z - this.bounds.z0) * this.scale];
  }

  /** Canvas CSS px → world X/Z. */
  toWorld(px: number, py: number): [number, number] {
    return [px / this.scale + this.bounds.x0, py / this.scale + this.bounds.z0];
  }

  resize(width: number) {
    const w = Math.round(width);
    const h = Math.round((w * (this.bounds.z1 - this.bounds.z0)) / (this.bounds.x1 - this.bounds.x0));
    if (w === this.size.w && h === this.size.h) return;
    this.size = { w, h };
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.scale = w / (this.bounds.x1 - this.bounds.x0);
    for (const c of [this.canvas, this.base]) {
      c.width = Math.round(w * this.dpr);
      c.height = Math.round(h * this.dpr);
    }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.drawBase();
  }

  private rect(g: CanvasRenderingContext2D, r: Rect) {
    const [ax, ay] = this.toMap(r[0], r[1]);
    const [bx, by] = this.toMap(r[2], r[3]);
    g.fillRect(ax, ay, bx - ax, by - ay);
  }

  private drawBase() {
    const g = this.base.getContext("2d")!;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.fillStyle = "#c9d3b6";
    g.fillRect(0, 0, this.size.w, this.size.h);
    for (const s of this.surfaces) {
      const fill = SURFACE_FILL[s.color];
      if (!fill || s.position[1] > 1) continue;
      g.fillStyle = fill;
      const [x, , z] = s.position;
      const [w, , d] = s.size;
      this.rect(g, [x - w / 2, z - d / 2, x + w / 2, z + d / 2]);
    }
    for (const b of this.buildings) {
      g.fillStyle = b.campus === "USSH" ? "#b7676a" : b.access === "open" ? "#3f6f8c" : "#7d93a3";
      if (b.id === "USSH_STAGE") g.fillStyle = "#c4473a";
      this.rect(g, b.footprint);
    }
    g.fillStyle = "#3f6f8c";
    for (const link of this.links) this.rect(g, link.rect);
    // Names, once per group, at the centre of its largest part.
    const seen = new Map<string, { b: MapBuilding; area: number }>();
    for (const b of this.buildings) {
      const label = shortName(b);
      if (!label) continue;
      const area = (b.footprint[2] - b.footprint[0]) * (b.footprint[3] - b.footprint[1]);
      const key = `${b.campus}:${label}`;
      const prev = seen.get(key);
      if (!prev || area > prev.area) seen.set(key, { b, area });
    }
    g.font = `600 ${Math.max(8, Math.round(9 * (this.size.w / 240)))}px system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const [key, { b }] of seen) {
      const label = key.split(":")[1];
      const [cx, cy] = this.toMap((b.footprint[0] + b.footprint[2]) / 2, (b.footprint[1] + b.footprint[3]) / 2);
      g.fillStyle = "#ffffff";
      g.fillText(label, cx, cy);
    }
    for (const gate of this.gates) {
      const [gx, gy] = this.toMap(gate.center_xz[0], gate.center_xz[1]);
      g.fillStyle = gate.campus === "HUS" ? "#355e76" : "#943c3c";
      g.fillRect(gx - 5, gy - 2, 10, 4);
    }
    g.strokeStyle = "rgba(28,36,48,0.35)";
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, this.size.w - 1, this.size.h - 1);
  }

  /** player: walker or camera target; view: optional camera position for a sight line; dots: deadlines. */
  draw(player: MapMarker, dots: { x: number; z: number }[], highlight: string | null, view?: { x: number; z: number }) {
    const g = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.drawImage(this.base, 0, 0);
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (highlight) {
      g.strokeStyle = "#ffd23f";
      g.lineWidth = 2;
      for (const b of this.buildings) {
        if (b.group !== highlight || b.access !== "open") continue;
        const [ax, ay] = this.toMap(b.footprint[0], b.footprint[1]);
        const [bx, by] = this.toMap(b.footprint[2], b.footprint[3]);
        g.strokeRect(ax, ay, bx - ax, by - ay);
      }
    }
    for (const d of dots) {
      const [x, y] = this.toMap(d.x, d.z);
      g.fillStyle = "#ffe14a";
      g.strokeStyle = "#8a6a10";
      g.lineWidth = 1;
      g.fillRect(x - 3, y - 3, 6, 6);
      g.strokeRect(x - 3, y - 3, 6, 6);
    }
    const [px, py] = this.toMap(player.x, player.z);
    if (view) {
      const [vx, vy] = this.toMap(view.x, view.z);
      g.strokeStyle = "rgba(255,77,46,0.6)";
      g.setLineDash([3, 3]);
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(vx, vy);
      g.lineTo(px, py);
      g.stroke();
      g.setLineDash([]);
    }
    g.save();
    g.translate(px, py);
    if (player.heading !== undefined) {
      // heading is the walker's yaw: forward = (−sin, −cos) in X/Z, which is "up" on the map at yaw 0.
      g.rotate(-player.heading);
      g.fillStyle = "#ff4d2e";
      g.strokeStyle = "#ffffff";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(0, -8);
      g.lineTo(5.5, 6);
      g.lineTo(0, 3);
      g.lineTo(-5.5, 6);
      g.closePath();
      g.fill();
      g.stroke();
    } else {
      g.fillStyle = "#ff4d2e";
      g.strokeStyle = "#ffffff";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(0, 0, 4.5, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.restore();
  }
}
