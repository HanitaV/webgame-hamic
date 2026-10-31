import * as THREE from "three";

/**
 * Minecraft-flavoured sky: gradient dome, square sun and moon, pixel stars, flat blocky clouds.
 * Colours are written straight to the sRGB canvas, so the values below are display colours.
 */

const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const skyFragment = /* glsl */ `
uniform vec3 uSun;
uniform float uDay;
uniform float uDusk;
varying vec3 vDir;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// 1 inside a square disc centred on 'body' (angular half-size 'size'); also returns pixel coords.
float square(vec3 d, vec3 body, float size, out vec2 cell) {
  cell = vec2(0.0);
  float c = dot(d, body);
  if (c <= 0.0) return 0.0;
  vec3 up = abs(body.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 u = normalize(cross(up, body));
  vec3 v = cross(body, u);
  vec2 p = vec2(dot(d, u), dot(d, v)) / c;
  cell = floor((p / size + 1.0) * 4.0);
  return step(max(abs(p.x), abs(p.y)), size);
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 dayTop = vec3(0.42, 0.64, 0.96);
  vec3 dayHor = vec3(0.76, 0.86, 0.95);
  vec3 nightTop = vec3(0.012, 0.02, 0.06);
  vec3 nightHor = vec3(0.05, 0.08, 0.17);
  float t = pow(clamp(h, 0.0, 1.0), 0.5);
  vec3 col = mix(mix(nightHor, dayHor, uDay), mix(nightTop, dayTop, uDay), t);
  vec2 flatSun = normalize(uSun.xz + vec2(1e-4));
  float toward = max(dot(normalize(d.xz + vec2(1e-4)), flatSun), 0.0);
  float band = exp(-abs(h) * 5.0);
  col = mix(col, vec3(1.0, 0.55, 0.28), uDusk * band * (0.25 + 0.75 * pow(toward, 3.0)));
  col = mix(col, col * 0.7, clamp(-h * 3.0, 0.0, 1.0));
  // Soft halo, then the square sun.
  col += vec3(1.0, 0.82, 0.55) * pow(max(dot(d, uSun), 0.0), 90.0) * 0.45 * max(uDay, uDusk);
  vec2 cell;
  float s = square(d, uSun, 0.05, cell);
  col = mix(col, vec3(1.0, 0.97, 0.78), s);
  float m = square(d, -uSun, 0.04, cell);
  float crater = step(0.72, hash3(vec3(cell, 3.0)));
  col = mix(col, vec3(0.88, 0.9, 0.95) * (1.0 - 0.22 * crater), m);
  // Pixel stars: sparse cells on a direction grid, only above the horizon.
  vec3 q = floor(d * 160.0);
  float star = step(0.9972, hash3(q)) * step(0.02, h);
  col += star * (1.0 - uDay) * (0.6 + 0.4 * hash3(q + 7.0));
  gl_FragColor = vec4(col, 1.0);
}`;

const cloudVertex = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const cloudFragment = /* glsl */ `
uniform float uTime;
uniform float uDay;
uniform float uDusk;
uniform vec3 uCam;
varying vec3 vW;
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec2 p = vW.xz + vec2(uTime * 2.5, uTime * 0.6);
  vec2 cell = floor(p / 16.0);
  float n = vn(cell * 0.16) * 0.65 + vn(cell * 0.43 + 11.0) * 0.35;
  float a = step(0.6, n);
  float dist = length(vW.xz - uCam.xz);
  a *= 1.0 - smoothstep(420.0, 900.0, dist);
  vec3 c = mix(vec3(0.18, 0.2, 0.28), vec3(1.0), uDay);
  c = mix(c, vec3(1.0, 0.72, 0.55), uDusk * 0.5);
  gl_FragColor = vec4(c, a * 0.8);
}`;

export interface SkyState {
  hour: number;
  sun: THREE.Vector3;
  day: number;
  dusk: number;
  horizon: THREE.Color;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class Sky {
  readonly dome: THREE.Mesh;
  readonly clouds: THREE.Mesh;
  private skyUniforms = { uSun: { value: new THREE.Vector3(0, 1, 0) }, uDay: { value: 1 }, uDusk: { value: 0 } };
  private cloudUniforms = {
    uTime: { value: 0 },
    uDay: { value: 1 },
    uDusk: { value: 0 },
    uCam: { value: new THREE.Vector3() },
  };

  constructor(scene: THREE.Scene) {
    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: this.skyUniforms,
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: true,
        fog: false,
      }),
    );
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    this.dome.name = "sky";
    scene.add(this.dome);

    const cloudGeometry = new THREE.PlaneGeometry(2000, 2000);
    cloudGeometry.rotateX(-Math.PI / 2);
    this.clouds = new THREE.Mesh(
      cloudGeometry,
      new THREE.ShaderMaterial({
        uniforms: this.cloudUniforms,
        vertexShader: cloudVertex,
        fragmentShader: cloudFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    this.clouds.position.y = 120;
    this.clouds.name = "clouds";
    scene.add(this.clouds);
  }

  /** hour 0–24. Sunrise in the east (+X) at 6, overhead at 12, sets in the west at 18. */
  static state(hour: number): SkyState {
    const a = ((hour - 6) / 12) * Math.PI;
    const sun = new THREE.Vector3(Math.cos(a), Math.sin(a), 0.32).normalize();
    const day = smooth(-0.12, 0.22, sun.y);
    const dusk = 1 - smooth(0.0, 0.32, Math.abs(sun.y));
    const horizon = new THREE.Color().setRGB(0.05, 0.08, 0.17, THREE.SRGBColorSpace);
    horizon.lerp(new THREE.Color().setRGB(0.76, 0.86, 0.95, THREE.SRGBColorSpace), day);
    horizon.lerp(new THREE.Color().setRGB(0.95, 0.62, 0.42, THREE.SRGBColorSpace), dusk * 0.35);
    return { hour, sun, day, dusk, horizon };
  }

  update(state: SkyState, time: number, camera: THREE.Camera) {
    camera.getWorldPosition(this.cloudUniforms.uCam.value);
    this.dome.position.copy(this.cloudUniforms.uCam.value);
    this.dome.scale.setScalar(950);
    this.clouds.position.x = this.cloudUniforms.uCam.value.x;
    this.clouds.position.z = this.cloudUniforms.uCam.value.z;
    this.skyUniforms.uSun.value.copy(state.sun);
    this.skyUniforms.uDay.value = state.day;
    this.skyUniforms.uDusk.value = state.dusk;
    this.cloudUniforms.uTime.value = time;
    this.cloudUniforms.uDay.value = state.day;
    this.cloudUniforms.uDusk.value = state.dusk;
  }
}
