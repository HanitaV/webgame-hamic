import * as THREE from "three";

/** A toy-model 'pop': expanding ink rings and tumbling colored chips. No fire, smoke or flash. */
export function endingImpact(center: THREE.Vector3, low: boolean) {
  const group = new THREE.Group(); group.name = "E2_cartoon_impact";
  const rings = Array.from({ length: 3 }, (_, i) => {
    const material = new THREE.MeshBasicMaterial({ color: i === 1 ? "#5ad8ff" : "#ffd25e", transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(.965, 1, 100), material);
    mesh.position.copy(center).setY(.3 + i * .08); mesh.rotation.x = -Math.PI / 2; group.add(mesh);
    return mesh;
  });
  const count = low ? 36 : 110;
  const chips = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .1, .28), new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, depthWrite: false }), count);
  chips.frustumCulled = false; group.add(chips);
  let seed = 7002;
  const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
  const palette = ["#ffd25e", "#5ad8ff", "#ff6b81", "#eef1fb", "#5eeaa0"];
  const trajectories = Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2, speed = 3 + random() * 8;
    chips.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    return { velocity: new THREE.Vector3(Math.cos(angle) * speed, 4 + random() * 7, Math.sin(angle) * speed), size: .5 + random() * 1.4, spin: random() * 3 };
  });
  const transform = new THREE.Object3D();
  const rayPositions = new Float32Array(48 * 6);
  const rayGeometry = new THREE.BufferGeometry(); rayGeometry.setAttribute("position", new THREE.BufferAttribute(rayPositions, 3));
  const rays = new THREE.LineSegments(rayGeometry, new THREE.LineBasicMaterial({ color: "#ffd25e", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  rays.frustumCulled = false; group.add(rays);
  return { group, update(age: number, reduced: boolean) {
    group.visible = !reduced && age >= -.7 && age < 4;
    if (!group.visible) return;
    rings.forEach((ring, i) => {
      const t = age - i * .55;
      ring.visible = t > 0 && t < 2;
      ring.scale.setScalar(.8 + Math.max(0, t) * 24);
      (ring.material as THREE.MeshBasicMaterial).opacity = .46 * THREE.MathUtils.smoothstep(t, 0, .18) * (1 - THREE.MathUtils.smoothstep(t, .5, 2));
    });
    chips.visible = age >= 0;
    (chips.material as THREE.MeshLambertMaterial).opacity = .95 * THREE.MathUtils.smoothstep(age, 0, .16) * (1 - THREE.MathUtils.smoothstep(age, 2, 4));
    trajectories.forEach((chip, i) => {
      const t = Math.max(0, age);
      transform.position.copy(center).addScaledVector(chip.velocity, t);
      transform.position.y = center.y + 1 + chip.velocity.y * t - 1.35 * t * t;
      transform.rotation.set(chip.spin + t * .7, chip.spin + t * .4, t * .5);
      transform.scale.setScalar(chip.size);
      transform.updateMatrix(); chips.setMatrixAt(i, transform.matrix);
    });
    chips.instanceMatrix.needsUpdate = true;
    rays.visible = age > 0 && age < 1.8;
    (rays.material as THREE.LineBasicMaterial).opacity = .65 * THREE.MathUtils.smoothstep(age, 0, .18) * (1 - THREE.MathUtils.smoothstep(age, .55, 1.8));
    const rayAttribute = rayGeometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < 48; i++) {
      const velocity = trajectories[i % count].velocity;
      for (let end = 0; end < 2; end++) {
        const t = Math.max(0, age - (end ? 0 : .16));
        rayAttribute.setXYZ(i * 2 + end, center.x + velocity.x * t, center.y + 1 + velocity.y * t - 1.35 * t * t, center.z + velocity.z * t);
      }
    }
    rayAttribute.needsUpdate = true;
  } };
}
