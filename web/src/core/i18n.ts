/** Interface strings live in public/data/i18n/vi.json (GDD 8.2). Call t(key, vars) with {n}-style placeholders. */

import { DATA } from "./data";

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = DATA?.strings?.[key] ?? key;
  if (s.includes("{place:") || s.includes("{Place:")) s = s.replace(/\{([pP])lace:([a-z0-9]+)\}/g, (_, p: string, id: string) => {
    const node = DATA?.map?.walk.nodes.find((n) => n.id === id) as { short?: string } | undefined;
    const name = DATA?.strings?.[node?.short ?? ""] ?? id;
    return p === "P" ? name.charAt(0).toLocaleUpperCase("vi") + name.slice(1) : name;
  });
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export const num = (x: number, digits = 2) => {
  if (!Number.isFinite(x)) return String(x);
  const r = Math.round(x * 10 ** digits) / 10 ** digits;
  return String(r).replace(".", ",");
};
