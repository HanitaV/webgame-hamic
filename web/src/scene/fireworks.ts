import * as THREE from "three";
import type { EndingId } from "../puzzles/logic/story";

/** Continuous, ballistic ribbons. Each shell is a bouquet of long sparks, never billboard dots.
 * Positions and fading run on the GPU; only one time uniform changes per frame.
 * No flashes, blinking or random flicker. Salvos are separated by at least 0.9 seconds. */
export function fireworkBouquets(center: THREE.Vector3, palette: THREE.Color[], ending: EndingId | undefined, low: boolean) {
  let seed = 70131;
  const random = () => { seed = Math.imul(1664525, seed) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
  const position: number[] = [], velocity: number[] = [], color: number[] = [], timing: number[] = [];
  const gold = new THREE.Color("#ffd25e"), white = new THREE.Color("#eef1fb");
  // mode: 0 = airburst, 1 = ascending comet. trail: normalized position along the ribbon.
  const ribbon = (origin: THREE.Vector3, vel: THREE.Vector3, c: THREE.Color, start: number, life: number, mode: number) => {
    const segments = low ? 8 : 18;
    for (let s = 0; s < segments; s++) for (const tail of [s / segments, (s + 1) / segments]) {
      position.push(origin.x, origin.y, origin.z);
      velocity.push(vel.x, vel.y, vel.z);
      color.push(c.r, c.g, c.b);
      timing.push(start, life, tail, mode);
    }
  };
  if (ending !== "E2") {
    const waves = ending === "E5" ? [0.2, 1.3, 2.4, 4.5, 6.2, 7.8] : ending === "E6" ? [.25, 1.35] : [0.25, 1.35, 3.8, 5.2, 6.5];
    waves.forEach((time, wave) => {
      const shells = low ? 3 : wave >= 3 ? 5 : 3;
      for (let shell = 0; shell < shells; shell++) {
        const fan = (shell / (shells - 1) - .5);
        const launch = time + Math.abs(fan) * .12;
        const flight = 1.65 + random() * .2;
        const x = fan * (wave % 2 ? 25 : 20);
        const height = 23 + (1 - Math.abs(fan) * 2) * 4 + random() * 1.8;
        const origin = center.clone().add(new THREE.Vector3(fan * 4, .6, -4));
        const target = center.clone().add(new THREE.Vector3(x, height, -6 - random() * 5));
        const comet = target.clone().sub(origin).divideScalar(flight);
        comet.y += .7 * flight;
        const c = wave % 2 ? palette[(wave + shell) % palette.length] : gold;
        // Closely packed strands form one bright tapered launch trail.
        for (let j = 0; j < (low ? 2 : 5); j++) {
          const o = origin.clone().add(new THREE.Vector3((random() - .5) * .09, 0, (random() - .5) * .09));
          ribbon(o, comet, j ? gold : white, launch, ending === "E5" ? 9 : flight, 1);
        }
        if (ending === "E5") continue;
        const spokes = low ? 100 : wave >= 3 ? 260 : 200;
        for (let i = 0; i < spokes; i++) {
          // Golden-angle distribution avoids rings and the evenly spaced 'dot ball' look.
          const z = 1 - 2 * (i + .5) / spokes;
          const radius = Math.sqrt(1 - z * z), theta = i * 2.399963;
          const speed = 3.2 + random() * 3.7;
          const v = new THREE.Vector3(Math.cos(theta) * radius * speed, z * speed * .9 + .9, Math.sin(theta) * radius * speed * .6);
          const tint = c.clone().lerp(gold, wave % 2 ? .2 : .65).lerp(white, random() * .24);
          ribbon(target, v, tint, launch + flight + random() * .055, 2.5 + random() * 1.2, 0);
          // Fine split tips give the bouquet a feathery, willow-like silhouette.
          if (!low && i % 3 === 0) ribbon(target, v.clone().multiplyScalar(.84), gold, launch + flight + .22, 3.9, 0);
        }
      }
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("aVelocity", new THREE.Float32BufferAttribute(velocity, 3));
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(color, 3));
  geometry.setAttribute("aTiming", new THREE.Float32BufferAttribute(timing, 4));
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uStrength: { value: .9 } },
    vertexShader: `
      attribute vec3 aVelocity;
      attribute vec3 aColor;
      attribute vec4 aTiming;
      uniform float uTime;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float age = uTime - aTiming.x;
        float life = aTiming.y;
        float tail = aTiming.z;
        float comet = aTiming.w;
        float t = max(0., age - tail * mix(.62, .46, comet));
        float travel = (1. - exp(-.42 * t)) / .42;
        vec3 p = position + aVelocity * mix(travel, t, comet);
        p.y -= mix(.72, .7, comet) * t * t;
        float fade = smoothstep(0., .14, age) * (1. - smoothstep(life * .48, life, age));
        vAlpha = age >= 0. && age <= life ? fade * pow(1. - tail, .8) : 0.;
        vColor = aColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: `
      uniform float uStrength;
      varying vec3 vColor;
      varying float vAlpha;
      void main() { gl_FragColor = vec4(vColor * 2.4, vAlpha * uStrength); }`,
  });
  const mesh = new THREE.LineSegments(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return { mesh, update: (time: number) => { material.uniforms.uTime.value = time; } };
}
