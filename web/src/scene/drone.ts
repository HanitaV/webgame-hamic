import * as THREE from "three";

/** Original HAMIC show quadcopter. This factory is also the source for models/show-drone.glb. */
export function buildDroneModel() {
  const root = new THREE.Group(); root.name = "HAMIC_show_drone";
  const shell = new THREE.MeshStandardMaterial({ name: "drone_shell", color: "#eef1fb", roughness: .48, metalness: .28 });
  const frame = new THREE.MeshStandardMaterial({ name: "drone_frame", color: "#6f789a", roughness: .62, metalness: .3 });
  const dark = new THREE.MeshStandardMaterial({ name: "drone_dark", color: "#121629", roughness: .7, metalness: .1 });
  const gold = new THREE.MeshStandardMaterial({ name: "drone_trim", color: "#ffd25e", roughness: .4, metalness: .35 });
  const led = new THREE.MeshStandardMaterial({ name: "drone_led", color: "#eef1fb", emissive: "#eef1fb", emissiveIntensity: .1, roughness: .4 });
  const blade = new THREE.MeshStandardMaterial({ name: "drone_propeller", color: "#a1a9c6", transparent: true, opacity: .6, roughness: .8, side: THREE.DoubleSide });
  const add = (parent: THREE.Object3D, name: string, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const body = add(root, "white_flight_shell", new THREE.SphereGeometry(1, 16, 10), shell, 0, .04, 0); body.scale.set(.31, .14, .23);
  add(root, "flight_computer", new THREE.BoxGeometry(.34, .06, .27), dark, 0, -.055, 0);
  const trim = add(root, "gold_top_ring", new THREE.TorusGeometry(.16, .014, 6, 32), gold, 0, .17, 0); trim.rotation.x = Math.PI / 2;
  const diffuser = add(root, "light_diffuser", new THREE.SphereGeometry(1, 16, 10), led, 0, -.135, 0); diffuser.scale.set(.19, .07, .16);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, x = Math.cos(a) * .53, z = Math.sin(a) * .53;
    const arm = add(root, `arm_${i}`, new THREE.BoxGeometry(.56, .055, .067), frame, x * .53, .025, z * .53); arm.rotation.y = -a;
    add(root, `motor_${i}`, new THREE.CylinderGeometry(.061, .07, .13, 12), dark, x, .055, z);
    const guard = add(root, `rotor_guard_${i}`, new THREE.TorusGeometry(.235, .014, 6, 32), frame, x, .09, z); guard.rotation.x = Math.PI / 2;
    const rotor = new THREE.Group(); rotor.name = `rotor_${i}`; rotor.position.set(x, .14, z); root.add(rotor);
    add(rotor, "propeller_a", new THREE.BoxGeometry(.405, .008, .035), blade);
    add(rotor, "propeller_b", new THREE.BoxGeometry(.035, .008, .405), blade);
    add(rotor, "propeller_hub", new THREE.SphereGeometry(.032, 8, 6), gold);
    add(root, `navigation_light_${i}`, new THREE.SphereGeometry(.025, 8, 6), led, x, -.012, z);
  }
  for (const x of [-.2, .2]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, -.04, -.12), new THREE.Vector3(x, -.25, -.17), new THREE.Vector3(x, -.28, .18), new THREE.Vector3(x, -.04, .12)]);
    add(root, `landing_skid_${x}`, new THREE.TubeGeometry(curve, 14, .017, 6, false), dark);
  }
  add(root, "camera_gimbal", new THREE.BoxGeometry(.105, .07, .055), dark, 0, -.105, .23);
  const lens = add(root, "camera_lens", new THREE.CylinderGeometry(.026, .026, .023, 12), gold, 0, -.105, .27); lens.rotation.x = Math.PI / 2;
  return root;
}

export interface Drone {
  root: THREE.Group;
  update(time: number, color: THREE.Color, light: number, hull: number, moving: boolean): void;
}

/** Own materials per aircraft, shared geometry. Geometry survives the ending cleanup. */
export function createDrone(template: THREE.Group): Drone {
  const root = template.clone(true);
  const rotors: THREE.Object3D[] = [], materials = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  root.traverse(object => {
    if (/^rotor_\d$/.test(object.name)) rotors.push(object);
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.userData.droneSharedGeometry = true;
    const source = mesh.material as THREE.MeshStandardMaterial;
    let material = materials.get(source);
    if (!material) { material = source.clone(); material.transparent = true; materials.set(source, material); }
    mesh.material = material;
  });
  return { root, update(time, color, light, hull, moving) {
    root.visible = hull > .005;
    for (const rotor of rotors) rotor.rotation.y = moving ? time * 1.8 : 0;
    for (const material of materials.values()) {
      material.opacity = hull * (material.name === "drone_propeller" ? .6 : 1);
      material.depthWrite = hull > .9;
      if (material.name === "drone_led") {
        material.color.copy(color); material.emissive.copy(color); material.emissiveIntensity = .1 + light * 2.2;
      }
    }
  } };
}
