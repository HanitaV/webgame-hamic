import { blocked, slide, verticalStep, yawFacing } from "../src/motion.ts";

const solids = [
  { id: "wall", min: [-10, 0, -30], max: [10, 14, -22] },
  { id: "sign", min: [-4, 4.2, -1], max: [4, 6.8, 1] },
];

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

assert(Math.abs(yawFacing(0, -1)) < 1e-6, "forward -Z should be yaw 0");
assert(Math.abs(yawFacing(1, 0) + Math.PI / 2) < 1e-6, "right should be yaw -pi/2");
assert(!blocked(0, -20, solids, 0.48), "point south of the wall is open");
assert(blocked(0, -21.6, solids, 0.48), "point inside the expanded wall is blocked");
assert(!blocked(0, 0, solids, 0.48), "elevated sign must not block walking");
assert(blocked(0, 0, solids, 0.48, 3.6), "on floor 2 the sign band is at body height and blocks");
assert(!blocked(0, -21.6, [{ id: "f2wall", min: [-10, 3.6, -30], max: [10, 7.2, -22] }], 0.48, 0), "a floor-2 wall must not block floor 1");
assert(blocked(0, -21.6, [{ id: "f2wall", min: [-10, 3.6, -30], max: [10, 7.2, -22] }], 0.48, 3.6), "a floor-2 wall blocks on floor 2");

const into = slide(0, -18, 0, -8, solids, 0.48);
assert(into.z > -21.6, "slide must not pass through the wall, got z=" + into.z);
assert(into.x === 0, "x should stay");

const along = slide(-9, -26, -4, 0, solids, 0.48);
assert(along.x < -9, "movement parallel to a wall should proceed, got " + along.x);

console.log("motion-check ok");

for (const floorY of [0, 3.6]) {
  let state = { y: floorY, velocity: 7, grounded: false };
  let peak = floorY;
  for (let i = 0; i < 120; i++) {
    state = verticalStep(state.y, state.velocity, 1 / 60, 20, 20, [], 0.48, floorY);
    peak = Math.max(peak, state.y);
  }
  assert(peak > floorY + 1, "jump rises above starting floor");
  assert(state.grounded && state.y === floorY && state.velocity === 0, "jump lands on starting floor");
}
const ceiling = [{ id: "ceiling", min: [-2, 2, -2], max: [2, 2.2, 2] }];
const headHit = verticalStep(0.2, 7, 0.05, 0, 0, ceiling, 0.48, 0);
assert(Math.abs(headHit.y - 0.3) < 1e-6 && headHit.velocity === 0, "ceiling stops upward motion");
const landing = verticalStep(2.3, -5, 0.05, 0, 0, ceiling, 0.48, 0);
assert(landing.y === 2.2 && landing.grounded, "fall lands on solid top");
console.log("jump-check ok");
