/** North-up, player-follow minimap for free campus exploration. */
import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { walkPosition, walkToPoint, roomState, walkToWorldPoint } from "../../scene/walking";
import { btn, el } from "../dom";
import { INK, arrow, dot, polyline, ring, roundRect } from "../widgets";

export function minimap(getTarget: () => string | null, getLamps: () => readonly string[], getNpcs: () => { node: string; main: boolean; sidequest?: boolean }[]) {
  const W = 220, H = 150, pad = 12;
  const canvas = el("canvas", { class: "minimap-canvas", width: W * 2, height: H * 2, role: "img", "aria-label": t("story.map.canvas") }) as HTMLCanvasElement;
  const g = canvas.getContext("2d")!;
  g.scale(2, 2);
  const m = DATA.map, nodes = m.walk.nodes;
  const bounds = {
    x0: Math.min(...m.buildings.map(b => b.x - (b.w ?? 0) / 2), ...nodes.map(n => n.x)) - 12,
    x1: Math.max(...m.buildings.map(b => b.x + (b.w ?? 0) / 2), ...nodes.map(n => n.x)) + 12,
    z0: Math.min(...m.buildings.map(b => b.z - (b.d ?? 0) / 2), ...nodes.map(n => n.z)) - 12,
    z1: Math.max(...m.buildings.map(b => b.z + (b.d ?? 0) / 2), ...nodes.map(n => n.z)) + 12,
  };
  let overview = false, zoom = 1, scale = 1, cx = 0, cz = 0, heading = -Math.PI / 2;
  let last: { x: number; z: number } | null = null;
  let waypoint: { x: number; z: number } | null = null;
  let indoors = false;
  const at = (id: string) => nodes.find(n => n.id === id);
  const px = (x: number) => W / 2 + (x - cx) * scale;
  const pz = (z: number) => H / 2 + (z - cz) * scale;
  const visible = (x: number, y: number) => x >= pad && x <= W - pad && y >= pad && y <= H - pad;
  const mode = btn(t("story.map.overview"), () => { overview = !overview; draw(); }, "ghost small", { "data-map-mode": true });
  const less = btn(t("story.map.zoomOut"), () => { overview = false; zoom = Math.max(.65, zoom / 1.4); draw(); }, "ghost small", { "data-map-zoom": "out", "aria-label": t("story.map.zoomOutLabel") });
  const more = btn(t("story.map.zoomIn"), () => { overview = false; zoom = Math.min(3, zoom * 1.4); draw(); }, "ghost small", { "data-map-zoom": "in", "aria-label": t("story.map.zoomInLabel") });
  const header = el("div", { class: "minimap-tools" }, mode, less, more);
  const status = el("small", { class: "minimap-status", text: t("story.map.hint") });
  const root = el("section", { class: "minimap panel", "aria-label": t("story.ui.map") }, header, canvas, status);
  // Keep map input from activating world click/keyboard controls underneath it.
  root.addEventListener("pointerdown", e => e.stopPropagation());
  root.addEventListener("click", e => e.stopPropagation());
  root.addEventListener("keydown", e => e.stopPropagation());
  const draw = () => {
    if (root.hidden || document.hidden || root.closest(".is-collapsed")) return;
    const p = walkPosition();
    const player = p ? { x: p.x / m.scale + m.origin[0], z: p.z / m.scale + m.origin[1] } : null;
    indoors = !!player && (player.x < bounds.x0 - 20 || player.x > bounds.x1 + 20 || player.z < bounds.z0 - 20 || player.z > bounds.z1 + 20);
    mode.textContent = t(overview ? "story.map.follow" : "story.map.overview");
    mode.setAttribute("aria-pressed", String(overview));
    less.disabled = indoors || (!overview && zoom <= .65);
    more.disabled = indoors || (!overview && zoom >= 3);
    mode.disabled = indoors;
    g.clearRect(0, 0, W, H);
    roundRect(g, 0, 0, W, H, 8, INK.bg);
    g.font = '600 10px "Be Vietnam Pro", sans-serif';
    if (indoors) {
      const room=roomState().room;
      if(!room?.sourceCenter || !p){status.textContent=t("story.map.campusOutside");return;}
      const [sx,sz]=room.sourceCenter;
      const clip=room.clipRect??[sx-room.width/2,sz-room.depth/2,sx+room.width/2,sz+room.depth/2];
      cx=(clip[0]+clip[2])/2;cz=(clip[1]+clip[3])/2;
      scale=Math.min((W-pad*2)/(clip[2]-clip[0]),(H-pad*2)/(clip[3]-clip[1]));
      for(const r of room.regions??[])roundRect(g,px(Math.max(r[0],clip[0])),pz(Math.max(r[1],clip[1])),Math.max(0,Math.min(r[2],clip[2])-Math.max(r[0],clip[0]))*scale,Math.max(0,Math.min(r[3],clip[3])-Math.max(r[1],clip[1]))*scale,1,INK.grid);
      for(const r of room.rooms??[]){
        roundRect(g,px(r.rect[0]),pz(r.rect[1]),(r.rect[2]-r.rect[0])*scale,(r.rect[3]-r.rect[1])*scale,1,INK.grey,INK.dim);
        dot(g,px(r.approach[0]),pz(r.approach[1]),2,INK.light,0);
      }
      for(const s of room.furniture??[])roundRect(g,px(s.min[0]),pz(s.min[2]),(s.max[0]-s.min[0])*scale,(s.max[2]-s.min[2])*scale,1,INK.grey,INK.dim);
      for(const id of room.connectedBuildings??[]){
        const part=room.buildingRegions?.filter(r=>r.building===id).sort((a,b)=>(b.rect[2]-b.rect[0])*(b.rect[3]-b.rect[1])-(a.rect[2]-a.rect[0])*(a.rect[3]-a.rect[1]))[0];
        if(!part)continue;
        const r=part.rect;g.fillStyle=INK.text;g.textAlign="center";
        g.fillText(t(part.title),px((r[0]+r[2])/2),pz((r[1]+r[3])/2)-4);
      }
      dot(g,px(p.x-1000+sx),pz(p.z+sz),3,INK.good,0);
      status.textContent=t("story.space.mapHint");
      canvas.setAttribute("aria-label",t("story.map.indoors"));
      last = null; return;
    }
    if (player && last && Math.hypot(player.x - last.x, player.z - last.z) > .15 && Math.hypot(player.x - last.x, player.z - last.z) < 30) heading = Math.atan2(player.z - last.z, player.x - last.x);
    last = player;
    if (waypoint && player && Math.hypot(waypoint.x - player.x, waypoint.z - player.z) < 3) waypoint = null;
    if (overview || !player) {
      cx = (bounds.x0 + bounds.x1) / 2; cz = (bounds.z0 + bounds.z1) / 2;
      scale = Math.min((W - pad * 2) / (bounds.x1 - bounds.x0), (H - pad * 2) / (bounds.z1 - bounds.z0));
    } else { cx = player.x; cz = player.z; scale = (W - pad * 2) / (220 / zoom); }
    g.save(); g.beginPath(); g.rect(pad, pad, W - pad * 2, H - pad * 2); g.clip();
    for (let x = Math.ceil((cx - W / 2 / scale) / 20) * 20; px(x) < W; x += 20) polyline(g, [[px(x), 0], [px(x), H]], INK.grid, 1, 0);
    for (let z = Math.ceil((cz - H / 2 / scale) / 20) * 20; pz(z) < H; z += 20) polyline(g, [[0, pz(z)], [W, pz(z)]], INK.grid, 1, 0);
    // Paths are subtle landmarks; they no longer look like a mandatory node graph.
    const allLitLamps = getLamps().length >= Object.keys(DATA.story.lamps.notes).length;
    for (const [a, b] of m.walk.edges) { const n = at(a), q = at(b); if (n && q) polyline(g, [[px(n.x), pz(n.z)], [px(q.x), pz(q.z)]], allLitLamps ? INK.light : INK.axis, allLitLamps ? 2.2 : 2, 0); }
    for (const b of m.buildings) {
      const bw = (b.w ?? 20) * scale, bd = (b.d ?? 16) * scale;
      for (const r of b.footprints ?? [[b.x-(b.w??20)/2,b.z-(b.d??16)/2,b.x+(b.w??20)/2,b.z+(b.d??16)/2]])
        roundRect(g,px(r[0]),pz(r[1]),(r[2]-r[0])*scale,(r[3]-r[1])*scale,2,INK.grey,INK.dim);
      if (!overview && visible(px(b.x), pz(b.z)) && bw > 20 && bd > 10) {
        g.fillStyle = INK.text; g.textAlign = "center"; g.fillText(b.id.split("_").slice(1).join(" "), px(b.x), pz(b.z) + 3, bw - 4);
      }
      if (b.enterable) for (const door of b.entrances ?? []) roundRect(g, px(door.position[0])-2, pz(door.position[1])-2,4,4,1,INK.lightB);
    }
    for (const id of getLamps()) { const n = at(id); if (n) dot(g, px(n.x), pz(n.z), 2, INK.light, 0); }
    for (const npc of getNpcs()) {
      const n = at(npc.node); if (!n) continue;
      dot(g, px(n.x) + 3, pz(n.z) - 3, npc.main ? 3.5 : 2.5, npc.main ? INK.light : npc.sidequest ? INK.good : INK.lightB, 0);
    }
    for (const egg of m.walk.easterEggs ?? []) {
      if (!overview && !egg.building) ring(g, px(egg.x), pz(egg.z), 2, INK.dim, 1);
    }
    const target = getTarget(), quest = target ? at(target) : null;
    const destination = waypoint ?? quest;
    if (destination) {
      const x = px(destination.x), y = pz(destination.z);
      if (visible(x, y)) { ring(g, x, y, 6, INK.light, 2); dot(g, x, y, 1.5, INK.light, 0); }
      else {
        const dx = x - W / 2, dy = y - H / 2;
        const f = Math.min((W / 2 - pad - 7) / Math.max(.001, Math.abs(dx)), (H / 2 - pad - 7) / Math.max(.001, Math.abs(dy)));
        const ex = W / 2 + dx * f, ey = H / 2 + dy * f;
        arrow(g, ex - dx / Math.hypot(dx, dy) * 8, ey - dy / Math.hypot(dx, dy) * 8, ex, ey, INK.light, 2, 0);
      }
    }
    if (player) {
      const x = px(player.x), y = pz(player.z);
      ring(g, x, y, 7, INK.bg, 4); dot(g, x, y, 4, INK.good, 0);
      polyline(g, [[x + Math.cos(heading - .5) * 9, y + Math.sin(heading - .5) * 9], [x + Math.cos(heading) * 13, y + Math.sin(heading) * 13], [x + Math.cos(heading + .5) * 9, y + Math.sin(heading + .5) * 9]], INK.good, 2, 0);
    }
    g.restore();
    g.textAlign = "left"; g.fillStyle = INK.text; g.fillText(t("story.map.north"), 5, 11);
    status.textContent = waypoint ? t("story.map.waypoint") : t("story.map.hint");
    canvas.setAttribute("aria-label", t(overview ? "story.map.overviewLabel" : "story.map.followLabel"));
  };
  canvas.addEventListener("click", e => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    if (!visible(x, y)) return;
    let mx = cx + (x - W / 2) / scale, mz = cz + (y - H / 2) / scale;
    if(indoors){
      const room=roomState().room;if(!room?.sourceCenter)return;
      const door=room.rooms?.find(r=>Math.hypot(px(r.approach[0])-x,pz(r.approach[1])-y)<6);
      if(door)[mx,mz]=door.approach;
      walkToWorldPoint(1000+mx-room.sourceCenter[0],mz-room.sourceCenter[1]);return;
    }
    const door = m.buildings.flatMap(b=>b.entrances ?? []).sort((a,b)=>Math.hypot(px(a.position[0])-x,pz(a.position[1])-y)-Math.hypot(px(b.position[0])-x,pz(b.position[1])-y))[0];
    if (door && Math.hypot(px(door.position[0])-x,pz(door.position[1])-y)<5) [mx,mz]=door.position;
    waypoint = { x: mx, z: mz }; walkToPoint(mx, mz); draw();
  });
  const timer = window.setInterval(draw, 200);
  return { root, draw, destroy: () => clearInterval(timer) };
}
