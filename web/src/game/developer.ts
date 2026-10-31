// Session-only unlocks: never award real stars or overwrite the player's save.
let active = new URLSearchParams(location.search).get("hack") === "70";
export const developerMode = () => active;
export function toggleDeveloper() { active = !active; return active; }
