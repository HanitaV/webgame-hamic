export interface Solid {
  id: string;
  min: [number, number, number];
  max: [number, number, number];
}

/** Body band used for walk collision, relative to the floor the player stands on. */
const BODY_LOW = 0.2;
const BODY_HIGH = 1.7;

/** Sweep the body vertically to stop at ceilings and land on solid tops. */
export function verticalStep(y: number, velocity: number, dt: number, x: number, z: number, solids: readonly Solid[], radius: number, floorY: number) {
  velocity -= 18 * dt;
  let nextY = y + velocity * dt;
  let grounded = false;
  for (const solid of solids) {
    if (x < solid.min[0] - radius || x > solid.max[0] + radius || z < solid.min[2] - radius || z > solid.max[2] + radius) continue;
    if (velocity > 0 && y + BODY_HIGH <= solid.min[1] && nextY + BODY_HIGH >= solid.min[1]) {
      nextY = solid.min[1] - BODY_HIGH;
    } else if (velocity <= 0 && y >= solid.max[1] - 0.001 && nextY <= solid.max[1]) {
      nextY = solid.max[1];
      grounded = true;
    }
  }
  if (nextY <= floorY) {
    nextY = floorY;
    grounded = true;
  }
  if (grounded || nextY < y && velocity > 0 || velocity > 0 && nextY < y + velocity * dt) velocity = 0;
  return { y: nextY, velocity, grounded };
}

export function hitsSolid(x: number, z: number, solid: Solid, radius: number, baseY = 0): boolean {
  if (solid.max[1] <= baseY + BODY_LOW || solid.min[1] >= baseY + BODY_HIGH) return false;
  return (
    x >= solid.min[0] - radius &&
    x <= solid.max[0] + radius &&
    z >= solid.min[2] - radius &&
    z <= solid.max[2] + radius
  );
}

export function blocked(x: number, z: number, solids: readonly Solid[], radius: number, baseY = 0): boolean {
  for (const solid of solids) {
    if (hitsSolid(x, z, solid, radius, baseY)) return true;
  }
  return false;
}

/** Slide on X then Z so a wall stops one axis without freezing the other. */
export function slide(
  x: number,
  z: number,
  dx: number,
  dz: number,
  solids: readonly Solid[],
  radius: number,
  baseY = 0,
): { x: number; z: number } {
  let nx = x + dx;
  let nz = z;
  if (blocked(nx, nz, solids, radius, baseY)) nx = x;
  nz = z + dz;
  if (blocked(nx, nz, solids, radius, baseY)) nz = z;
  return { x: nx, z: nz };
}

/**
 * Yaw for an object whose front is local -Z.
 * Check: direction (0, -1) → 0; direction (1, 0) → -π/2.
 */
export function yawFacing(dirX: number, dirZ: number): number {
  return Math.atan2(-dirX, -dirZ);
}
