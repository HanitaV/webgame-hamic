import * as THREE from "three";

/**
 * World-space procedural surfaces. The GLB has no UVs or textures (kit rule), so walls, roofs,
 * grass, paving and wood get their detail from a few lines of GLSL keyed by the material's
 * extras.pattern, which scripts/build_blockout.py writes per colour.
 */

export const PATTERN_ID: Record<string, number> = {
  plaster: 1,
  roof_tiles: 2,
  grass: 3,
  paving: 4,
  paving_large: 5,
  asphalt: 6,
  brick: 7,
  wood: 8,
  wood_floor: 9,
  floor_tiles: 10,
  floor_small: 11,
  concrete: 12,
  leaves: 13,
  bark: 14,
  glass: 15,
  glass_lit: 15,
  glow: 0,
};

const common = /* glsl */ `
varying vec3 vWPos;
varying vec3 vWNorm;
float sh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float sh3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }
float svn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(sh(i), sh(i + vec2(1, 0)), f.x), mix(sh(i + vec2(0, 1)), sh(i + vec2(1, 1)), f.x), f.y);
}
float sfbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * svn(p); p *= 2.03; a *= 0.5; }
  return s;
}
vec2 faceUV(vec3 p, vec3 n) {
  vec3 a = abs(n);
  if (a.y > a.x && a.y > a.z) return p.xz;
  if (a.x > a.z) return p.zy;
  return p.xy;
}
float grout(vec2 uv, float size, float line) {
  vec2 g = fract(uv / size);
  return step(line, g.x) * step(line, g.y);
}
float surfacePattern(vec3 p, vec3 n) {
  vec2 uv = faceUV(p, n);
  float f = 1.0;
#if PATTERN == 1
  f = 0.93 + 0.1 * sfbm(uv * 1.3);
  f *= 0.9 + 0.1 * smoothstep(0.0, 1.4, mod(p.y, 3.6));
#elif PATTERN == 2
  float along = abs(n.x) > abs(n.z) ? p.z : p.x;
  float rows = p.y * 2.8;
  float row = floor(rows);
  float r = fract(rows);
  float s = fract(along * 1.5 + row * 0.5);
  f = 0.8 + 0.2 * smoothstep(0.0, 0.22, r);
  f *= 0.86 + 0.14 * smoothstep(0.0, 0.07, s) * smoothstep(1.0, 0.93, s);
  f *= 0.9 + 0.14 * sh(vec2(row, floor(along * 1.5 + row * 0.5)));
  if (abs(n.y) > 0.98) f = 0.85 + 0.1 * sfbm(uv * 0.8);
#elif PATTERN == 3
  f = 0.8 + 0.22 * sh(floor(uv * 2.0)) + 0.18 * (sfbm(uv * 0.06) - 0.5);
#elif PATTERN == 4
  f = mix(0.8, 0.95 + 0.07 * sh(floor(uv / 1.1)), grout(uv, 1.1, 0.05));
#elif PATTERN == 5
  f = mix(0.84, 0.96 + 0.05 * sh(floor(uv / 2.2)), grout(uv, 2.2, 0.03));
  f *= 0.95 + 0.08 * sfbm(uv * 0.4);
#elif PATTERN == 6
  f = 0.88 + 0.1 * sh(floor(uv * 9.0)) + 0.1 * (sfbm(uv * 0.25) - 0.5);
#elif PATTERN == 7
  float along = abs(n.x) > abs(n.z) ? p.z : p.x;
  float brow = floor(p.y / 0.27);
  float bx = along / 0.62 + 0.5 * mod(brow, 2.0);
  float mortar = 1.0 - step(0.12, fract(p.y / 0.27)) * step(0.06, fract(bx));
  f = mix(0.86 + 0.18 * sh(vec2(floor(bx), brow)), 1.3, mortar);
#elif PATTERN == 8
  f = 0.88 + 0.07 * sin(uv.x * 9.0 + sfbm(uv * vec2(0.8, 5.0)) * 7.0) + 0.06 * sfbm(uv * vec2(0.6, 7.0));
#elif PATTERN == 9
  float plank = floor(uv.y / 0.28);
  float seam = step(0.07, fract(uv.y / 0.28)) * step(0.015, fract(uv.x / 1.7 + plank * 0.37));
  f = (0.86 + 0.14 * sh(vec2(plank, floor(uv.x / 1.7 + plank * 0.37)))) * mix(0.8, 1.0, seam);
  f *= 0.95 + 0.05 * sin(uv.x * 14.0 + sfbm(uv * 3.0) * 4.0);
#elif PATTERN == 10
  f = mix(0.83, 0.94 + 0.06 * mod(floor(uv.x / 0.8) + floor(uv.y / 0.8), 2.0), grout(uv, 0.8, 0.04));
#elif PATTERN == 11
  f = mix(0.86, 0.97 + 0.03 * sh(floor(uv / 0.32)), grout(uv, 0.32, 0.07));
#elif PATTERN == 12
  f = 0.86 + 0.16 * sfbm(uv * 0.5) + 0.05 * sh(floor(uv * 5.0));
#elif PATTERN == 13
  f = 0.62 + 0.55 * sh3(floor(p * 2.3));
#elif PATTERN == 14
  f = 0.78 + 0.28 * sh(floor(vec2((p.x + p.z) * 5.0, p.y * 1.6)));
#elif PATTERN == 15
  f = 0.9 + 0.3 * smoothstep(0.2, 1.0, fract(p.y / 3.6 + 0.35)) + 0.1 * sh(floor(vec2(p.x + p.z, p.y) * 0.4));
#endif
  return f;
}
`;

/** Turn the procedural detail on or off. Off compiles PATTERN 0, which multiplies by 1 and costs nothing. */
export function setSurfaceDetail(material: THREE.MeshStandardMaterial, on: boolean) {
  const id = material.userData.patternId as number | undefined;
  if (!id) return;
  const value = on ? id : 0;
  material.defines = { ...(material.defines ?? {}), PATTERN: value };
  material.customProgramCacheKey = () => `surface-${value}`;
  material.needsUpdate = true;
}

export function patchSurface(material: THREE.MeshStandardMaterial, pattern: string, on = true) {
  const id = PATTERN_ID[pattern] ?? 1;
  if (id === 0) return;
  material.userData.patternId = id;
  material.defines = { ...(material.defines ?? {}), PATTERN: on ? id : 0 };
  if (pattern.startsWith("glass")) {
    material.roughness = 0.35;
    material.metalness = 0.15;
  }
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNorm;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNorm = normalize(mat3(modelMatrix) * objectNormal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + common)
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= surfacePattern(vWPos, normalize(vWNorm));");
  };
  material.customProgramCacheKey = () => `surface-${on ? id : 0}`;
  material.needsUpdate = true;
}
