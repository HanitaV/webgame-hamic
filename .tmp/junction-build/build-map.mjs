/**
 * Build the in-game campus map (web/public/models/campus.glb) from the USSH × HUS blockout in
 * legacy/campus/assets/models/campus_blockout.glb.
 *
 * The blockout has ~1100 separate meshes (one per building floor and colour). Drawing that on a
 * phone is too many draw calls, so meshes are grouped per building (or per category for roads,
 * trees, props), joined by material, welded, quantized and meshopt-compressed. Each group node keeps
 * `extras.group` (building id such as HUS_T5, or a category) so the game can light one building.
 *
 * Needs the dev tools in a scratch folder or the project: @gltf-transform/{core,functions,extensions}
 * and meshoptimizer.  Run:  node scripts/build-map.mjs [in.glb] [out.glb]
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, join, prune, quantize, weld, reorder, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { statSync } from "node:fs";

const input = process.argv[2] ?? "../legacy/campus/assets/models/campus_blockout.glb";
const output = process.argv[3] ?? "public/models/campus.glb";

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(input);
const root = doc.getRoot();
const scene = root.getDefaultScene() ?? root.listScenes()[0];

function groupOf(node) {
  const e = node.getExtras() ?? {};
  if (e.building_id) return String(e.building_id);
  const name = node.getName();
  if (/_GATE/.test(name)) return name.startsWith("HUS") ? "HUS_GATE" : "USSH_GATE";
  if (name.startsWith("HUS_LINK")) return "HUS_LINK";
  if (e.kind === "surface") return "surface";
  if (e.kind === "prop" || name.startsWith("props")) return name.includes("lamps") ? "lamps" : "props";
  if (name.startsWith("tree")) return "trees";
  if (name.startsWith("railway") || e.kind === "pillar" || e.kind === "railway") return "railway";
  if (name.startsWith("BOUNDARY")) return "boundary";
  if (name.startsWith("vine")) return "vines";
  return "misc";
}

const groups = new Map();
for (const node of scene.listChildren()) {
  if (!node.getMesh() && node.listChildren().length === 0) continue;
  const key = groupOf(node);
  let g = groups.get(key);
  if (!g) {
    g = doc.createNode(`G_${key}`).setExtras({ group: key });
    groups.set(key, g);
    scene.addChild(g);
  }
  scene.removeChild(node);
  g.addChild(node);
}

await doc.transform(
  dedup(),
  join({ keepNamed: false }),
  weld(),
  prune(),
  reorder({ encoder: MeshoptEncoder }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);
await io.write(output, doc);
const meshes = root.listMeshes().reduce((s, m) => s + m.listPrimitives().length, 0);
console.log(`build-map: ${groups.size} nhóm, ${meshes} primitive, ${(statSync(output).size / 1e6).toFixed(2)} MB → ${output}`);
