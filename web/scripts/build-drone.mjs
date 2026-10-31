import { writeFile, mkdir } from "node:fs/promises";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { buildDroneModel } from "../src/scene/drone.ts";

// GLTFExporter uses this browser adapter only to package binary buffers.
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
  async readAsDataURL(blob) { this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`; this.onloadend?.(); }
};
const glb = await new GLTFExporter().parseAsync(buildDroneModel(), { binary: true });
await mkdir(new URL("../public/models/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/models/show-drone.glb", import.meta.url), Buffer.from(glb));
console.log(`show-drone.glb: ${glb.byteLength} bytes`);
