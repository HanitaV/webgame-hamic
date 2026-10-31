import { MathUtils, Vector3 } from "three";

/** Fit the clipped room into the space below the HUD, using the real perspective. */
export function frameRoom(
  rect: number[], sourceCenter: [number, number], origin: number,
  fov: number, aspect: number, viewportHeight: number,
  position: Vector3, target: Vector3,
) {
  const [x0, z0, x1, z1] = rect;
  const center = new Vector3(origin + (x0 + x1) / 2 - sourceCenter[0], .75, (z0 + z1) / 2 - sourceCenter[1]);
  const direction = new Vector3(0, 1, .65).normalize();
  const up = new Vector3(0, direction.z, -direction.y);
  const tan = Math.tan(MathUtils.degToRad(fov) / 2);
  const top = Math.min(150, viewportHeight * .4);
  const bottom = Math.min(38, viewportHeight * .1);
  const maxY = 1 - 2 * top / viewportHeight;
  const minY = -1 + 2 * bottom / viewportHeight;
  const offsetY = (maxY + minY) / 2;
  let distance = 1;
  for (const x of [x0, x1]) for (const y of [0, 1.5]) for (const z of [z0, z1]) {
    const corner = new Vector3(origin + x - sourceCenter[0], y, z - sourceCenter[1]).sub(center);
    const depth = corner.dot(direction), vertical = corner.dot(up);
    distance = Math.max(distance,
      Math.abs(corner.x) / (.9 * tan * aspect) + depth,
      (vertical + maxY * depth * tan) / ((maxY - offsetY) * tan),
      (-vertical - minY * depth * tan) / ((offsetY - minY) * tan),
    );
  }
  distance *= 1.06;
  target.copy(center).addScaledVector(up, -offsetY * distance * tan);
  position.copy(target).addScaledVector(direction, distance);
}
