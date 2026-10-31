import { spawnSync } from "node:child_process";
import { readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../..", import.meta.url));
const endings = (process.env.ENDINGS ?? "E1,E2,E3,E4,E5,E6").split(",");
for (const id of endings) {
  const video = resolve(root, `web/public/cinematics/${id}.mp4`), audio = resolve(root, `web/public/audio/endings/${id}.m4a`), temporary = resolve(root, `output/ending-audio/${id}-mux.mp4`);
  const result = spawnSync(process.env.FFMPEG ?? "ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", video, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-t", "16", "-movflags", "+faststart", temporary], { windowsHide: true, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  await rename(temporary, video); console.log(`${id}: muxed AAC, original GPU-rendered video stream preserved`);
}
const path = resolve(root, "web/public/cinematics/provenance.json");
const provenance = JSON.parse(await readFile(path, "utf8"));
provenance.audio = "Original AAC soundtracks, public/audio/endings/provenance.json. Runtime uses the same separate stems through the SFX bus; video remains muted for inline autoplay.";
provenance.codec = "H.264 / yuv420p, CRF 19, faststart, AAC stereo";
await writeFile(path, JSON.stringify(provenance, null, 2));
