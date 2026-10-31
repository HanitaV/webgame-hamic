/**
 * Block editor (mạch 3). Tap a block in the palette to append it where the cursor is (the program,
 * or the inside of a Lặp / Đếm / Nếu block you tapped). Numbers open the keypad; variables, directions
 * and colours cycle on tap. "lockStructure" levels only let numbers change (Đêm Hội tụ).
 */

import { sfx } from "../../core/audio";
import { t } from "../../core/i18n";
import { reducedMotion } from "../../game/settings";
import { btn, el } from "../../ui/dom";
import { INK, dot, gridBg, keypad, pixelText, roundRect, stageCanvas } from "../../ui/widgets";
import { blockSetup, countBlocks, runProgram, type Block, type BlockType, type Dir, type RunResult } from "../logic/blocks";
import type { Mount } from "./types";

const DIRS: Dir[] = ["right", "down", "left", "up"];

function fresh(type: BlockType, vars: string[]): Block {
  const v = vars[0] ?? "s";
  switch (type) {
    case "repeat": return { t: "repeat", n: 2, body: [] };
    case "for": return { t: "for", v: "i", from: 1, to: 5, body: [] };
    case "place": return { t: "place" };
    case "move": return { t: "move", dir: "right" };
    case "newline": return { t: "newline" };
    case "color": return { t: "color", c: "A" };
    case "ifEven": return { t: "ifEven", v: "i", body: [], else: [] };
    case "set": return { t: "set", v, value: 0 };
    case "addVar": return { t: "addVar", v, src: "i" };
    case "addConst": return { t: "addConst", v, k: 1 };
    case "addLinear": return { t: "addLinear", v, a: 1, d: 1, src: "i" };
  }
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export const mountBlocks: Mount = (ctx) => {
  const { level, lab } = ctx;
  const setup = lab
    ? { palette: ["repeat", "for", "place", "move", "newline", "color", "ifEven", "set", "addVar", "addConst"] as BlockType[], start: [] as Block[], goal: null, maxBlocks: Infinity, grid: [12, 8] as [number, number], lockStructure: false }
    : blockSetup(level);
  const vars = lab ? ["s", "c", "t"] : setup.goal && setup.goal.type === "var" ? [setup.goal.v] : ["s"];
  const loopVars = ["i", "j"];
  let program: Block[] = clone(setup.start);
  /** Cursor: the list new blocks go into. */
  let cursor: Block[] = program;
  let run: RunResult | null = null;
  let anim = 1;
  let shown: boolean | null = null;

  const progEl = el("div", { class: "program", role: "tree", "aria-label": t("blk.program") });
  const counter = el("span", { class: "blk-count" });

  const changed = () => { run = null; shown = null; anim = 1; renderProgram(); c.render(); ctx.changed(); };

  function label(b: Block): (string | HTMLElement)[] {
    const num = (val: number, set: (n: number) => void, title: string, min = 0, max = 9999) => {
      const n = el("button", { type: "button", class: "blk-num", "aria-label": `${title} ${val}` });
      n.textContent = String(val);
      n.addEventListener("click", (e) => { e.stopPropagation(); keypad({ title, value: val, min, max, onDone: (v) => { set(v); changed(); } }); });
      return n;
    };
    const cyc = <T extends string>(val: T, all: T[], set: (v: T) => void, show: (v: T) => string, title: string) => {
      const n = el("button", { type: "button", class: "blk-cyc", "aria-label": `${title}: ${show(val)}` });
      n.textContent = show(val);
      if (!setup.lockStructure) n.addEventListener("click", (e) => { e.stopPropagation(); set(all[(all.indexOf(val) + 1) % all.length]); changed(); });
      return n;
    };
    const varNames = (v: string) => v;
    switch (b.t) {
      case "repeat": return [t("blk.repeat"), num(b.n, (v) => (b.n = v), t("blk.times"), 0, 200), t("blk.timesSuffix")];
      case "for": return [t("blk.for"), cyc(b.v, loopVars, (v) => (b.v = v), varNames, t("blk.var")), t("blk.from"), num(b.from, (v) => (b.from = v), t("blk.from"), -999, 9999), t("blk.to"), num(b.to, (v) => (b.to = v), t("blk.to"), -999, 9999)];
      case "place": return [t("blk.place")];
      case "move": return [cyc(b.dir, DIRS, (v) => (b.dir = v), (v) => t(`blk.dir.${v}`), t("blk.dir"))];
      case "newline": return [t("blk.newline")];
      case "color": return [t("blk.color"), cyc(b.c, ["A", "B"], (v) => (b.c = v), (v) => v, t("blk.color"))];
      case "ifEven": return [t("blk.if"), cyc(b.v, loopVars, (v) => (b.v = v), varNames, t("blk.var")), t("blk.even")];
      case "set": return [t("blk.set"), cyc(b.v, vars, (v) => (b.v = v), varNames, t("blk.var")), "=", num(b.value, (v) => (b.value = v), t("blk.value"), -9999, 9999)];
      case "addVar": return [t("blk.add"), cyc(b.src, loopVars, (v) => (b.src = v), varNames, t("blk.var")), t("blk.into"), cyc(b.v, vars, (v) => (b.v = v), varNames, t("blk.var"))];
      case "addConst": return [t("blk.add"), num(b.k, (v) => (b.k = v), t("blk.value"), -999, 999), t("blk.into"), cyc(b.v, vars, (v) => (b.v = v), varNames, t("blk.var"))];
      case "addLinear": return [t("blk.add"), "(", num(b.a, (v) => (b.a = v), "a", -999, 999), "+", num(b.d, (v) => (b.d = v), "d", -999, 999), "·", cyc(b.src, loopVars, (v) => (b.src = v), varNames, t("blk.var")), ")", t("blk.into"), cyc(b.v, vars, (v) => (b.v = v), varNames, t("blk.var"))];
    }
  }

  function listEl(list: Block[], depth: number, title: string): HTMLElement {
    const ul = el("div", { class: `blk-list${cursor === list ? " cursor" : ""}`, role: "group", "aria-label": title });
    list.forEach((b, i) => {
      const row = el("div", { class: `blk blk-${b.t}`, role: "treeitem" });
      const head = el("div", { class: "blk-head" }, ...label(b));
      if (!setup.lockStructure) {
        const tools = el("span", { class: "blk-tools" },
          btn("", () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; changed(); } }, "tiny ghost", { "aria-label": t("blk.up") }, "up"),
          btn("", () => { list.splice(i, 1); if (!contains(program, cursor)) cursor = program; changed(); }, "tiny ghost", { "aria-label": t("blk.delete") }, "trash"));
        head.append(tools);
      }
      row.append(head);
      if (b.t === "repeat" || b.t === "for") row.append(listEl(b.body, depth + 1, t("blk.inside")));
      if (b.t === "ifEven") {
        row.append(listEl(b.body, depth + 1, t("blk.then")));
        row.append(el("div", { class: "blk-else", text: t("blk.else") }));
        row.append(listEl(b.else, depth + 1, t("blk.else")));
      }
      ul.append(row);
    });
    if (!setup.lockStructure) {
      const drop = el("button", { type: "button", class: `blk-drop${cursor === list ? " active" : ""}`, text: cursor === list ? t("blk.here") : t("blk.putHere") });
      drop.addEventListener("click", (e) => { e.stopPropagation(); cursor = list; renderProgram(); });
      ul.append(drop);
    }
    return ul;
  }

  function contains(root: Block[], target: Block[]): boolean {
    if (root === target) return true;
    for (const b of root) {
      if ((b.t === "repeat" || b.t === "for") && contains(b.body, target)) return true;
      if (b.t === "ifEven" && (contains(b.body, target) || contains(b.else, target))) return true;
    }
    return false;
  }

  function renderProgram() {
    progEl.replaceChildren(listEl(program, 0, t("blk.program")));
    const used = countBlocks(program);
    counter.textContent = Number.isFinite(setup.maxBlocks) && !setup.lockStructure ? t("blk.count", { n: used, max: setup.maxBlocks }) : t("blk.countFree", { n: used });
  }

  if (!setup.lockStructure) {
    const pal = el("div", { class: "palette blocks", role: "group", "aria-label": t("blk.palette") });
    for (const type of setup.palette) {
      const b = el("button", { type: "button", class: `slot blk-tile blk-${type}`, text: t(`blk.tile.${type}`) });
      b.addEventListener("click", () => { cursor.push(fresh(type, vars)); sfx.place(); changed(); });
      pal.append(b);
    }
    ctx.controls.append(el("p", { class: "ctl-label", text: t("blk.pick") }), pal);
    ctx.controls.append(btn(t("blk.clear"), () => { program.splice(0, program.length, ...clone(setup.start)); cursor = program; changed(); }, "small"));
  } else {
    ctx.controls.append(el("p", { class: "ctl-label", text: t("blk.locked") }));
  }
  ctx.controls.append(counter);

  // stage: program on the left, drone field / variables on the right
  const split = el("div", { class: "blk-stage" });
  const field = el("div", { class: "blk-field" });
  split.append(progEl, field);
  ctx.stage.append(split);

  const [GW, GH] = setup.grid;
  const goalCells = setup.goal && setup.goal.type === "lights" ? setup.goal.cells : null;
  const c = stageCanvas(field, (g, w, h) => {
    gridBg(g, w, h, 1000);
    if (setup.goal && setup.goal.type === "var") {
      pixelText(g, t("blk.vars"), 16, 22, INK.dim, 14, "left", 600);
      const vs = run ? Object.entries(run.vars) : [];
      vs.forEach(([k, v], i) => {
        const goal = k === (setup.goal as { v: string }).v;
        roundRect(g, 12, 40 + i * 40, w - 24, 32, 10, goal ? "rgba(255,210,94,0.08)" : "rgba(255,255,255,0.04)", goal ? "rgba(255,210,94,0.4)" : undefined);
        pixelText(g, `${k} = ${v}`, 24, 56 + i * 40, goal ? (shown === false ? INK.grey : shown ? INK.good : INK.light) : INK.text, 17, "left", 700);
      });
      if (!run) pixelText(g, t("blk.runToSee"), 16, 56, INK.dim, 14);
      pixelText(g, t("blk.goal", { v: setup.goal.v, n: setup.goal.equals }), 16, h - 20, INK.target, 14, "left", 600);
      return;
    }
    const cell = Math.floor(Math.min((w - 20) / GW, (h - 20) / GH));
    const ox = Math.floor((w - cell * GW) / 2), oy = Math.floor((h - cell * GH) / 2);
    const R = cell * 0.32;
    for (let y = 0; y < GH; y += 1) for (let x = 0; x < GW; x += 1) dot(g, ox + x * cell + cell / 2, oy + y * cell + cell / 2, 2, "rgba(255,255,255,0.12)", 0);
    if (goalCells) {
      for (const [k, col] of goalCells) {
        const [x, y] = k.split(",").map(Number);
        g.strokeStyle = col === "B" ? "rgba(90,216,255,0.55)" : "rgba(255,210,94,0.45)";
        g.lineWidth = 1.5;
        g.setLineDash([3, 3]);
        g.beginPath(); g.arc(ox + x * cell + cell / 2, oy + y * cell + cell / 2, R + 2, 0, Math.PI * 2); g.stroke();
        g.setLineDash([]);
      }
    }
    const drone = (x: number, y: number) => {
      const cx = ox + x * cell + cell / 2, cy = oy + y * cell + cell / 2;
      roundRect(g, cx - cell * 0.28, cy - cell * 0.12, cell * 0.56, cell * 0.24, cell * 0.12, "#ffffff", undefined, 14);
    };
    if (run) {
      const upto = Math.floor(run.trace.length * anim);
      const placed = new Map<string, "A" | "B">();
      let pos = run.trace[0];
      for (let i = 0; i < upto && i < run.trace.length; i += 1) {
        pos = run.trace[i];
        if (pos.place) placed.set(`${pos.x},${pos.y}`, pos.place);
      }
      if (anim >= 1) for (const [k, v] of run.lights) placed.set(k, v);
      for (const [k, col] of placed) {
        const [x, y] = k.split(",").map(Number);
        const inGoal = !goalCells || goalCells.has(k);
        const color = shown === false && anim >= 1 ? INK.grey : !inGoal ? "#ff6b81" : col === "B" ? INK.lightB : INK.light;
        const cx = ox + x * cell + cell / 2, cy = oy + y * cell + cell / 2;
        if (col === "B") {
          // shape, not only colour: B is a diamond
          g.save();
          g.shadowColor = color; g.shadowBlur = 12; g.fillStyle = color;
          g.beginPath(); g.moveTo(cx, cy - R - 2); g.lineTo(cx + R + 2, cy); g.lineTo(cx, cy + R + 2); g.lineTo(cx - R - 2, cy); g.closePath(); g.fill();
          g.restore();
        } else dot(g, cx, cy, R, color, 12);
      }
      if (anim < 1) drone(pos.x, pos.y);
    } else {
      drone(0, 0);
      pixelText(g, t("blk.drone"), ox + cell / 2, oy + cell + 12, INK.dim, 12, "center");
    }
  });

  renderProgram();

  return {
    solution: () => ({ program: clone(program) }),
    show(res) {
      shown = res ? res.ok : null;
      run = res?.detail?.run ?? (res ? runProgram(program) : null);
      if (!res || !run || reducedMotion() || (setup.goal && setup.goal.type === "var")) { anim = 1; c.render(); return 0; }
      const dur = Math.min(2400, 300 + run.trace.length * 25);
      const start = performance.now();
      anim = 0;
      const tick = (now: number) => {
        anim = Math.min(1, (now - start) / dur);
        c.render();
        if (anim < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return dur;
    },
    destroy: () => c.destroy(),
  };
};
