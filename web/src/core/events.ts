/** Typed event bus: gameplay emits, achievements / toasts / scene listen. */

export interface GameEvents {
  run: { levelId: string; ok: boolean };
  levelDone: { levelId: string; stars: [boolean, boolean, boolean]; mode: string };
  circuitLit: { circuit: number; mode: string };
  achievement: { id: string };
  toast: { title: string; text: string; kind?: "achievement" | "info" };
  progress: Record<string, never>;
  settings: { changed: string[] };
}

type Handler<T> = (payload: T) => void;

class Bus<E extends object> {
  private map = new Map<keyof E, Set<Handler<never>>>();
  on<K extends keyof E>(k: K, h: Handler<E[K]>) {
    if (!this.map.has(k)) this.map.set(k, new Set());
    this.map.get(k)!.add(h as Handler<never>);
    return () => this.map.get(k)!.delete(h as Handler<never>);
  }
  emit<K extends keyof E>(k: K, p: E[K]) {
    for (const h of [...(this.map.get(k) ?? [])]) {
      try { (h as Handler<E[K]>)(p); } catch (e) { console.error(`[bus] ${String(k)}`, e); }
    }
  }
}

export const bus = new Bus<GameEvents>();
