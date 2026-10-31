/**
 * Typed event bus. Gameplay emits; HUD, achievements and saves listen.
 * The HUD never reads game state per frame: it redraws when one of these fires.
 */

export type Mode = "orbit" | "walk" | "cine";

export interface GameEvents {
  /** Camera mode changed. */
  mode: { mode: Mode };
  /** Title screen shown or left. */
  title: { open: boolean };
  /** Where the walker is: building group ("" outside), floor and readable name. */
  place: { group: string; name: string; level: number; stair: StairInfo | null };
  /** Deadline papers picked up in the current run. */
  deadline: { collected: number; total: number };
  /** All papers handed in at a gate. */
  won: { seconds: number };
  /** A new run started (reset or first load). */
  run: { total: number };
  /** Elapsed run time, emitted about once a second while walking. */
  runTime: { seconds: number };
  /** Clock changed (about twice a second while running, or on a manual change). */
  hour: { hour: number; running: boolean };
  /** HUS floor shown in the orbit view; null is the whole building. */
  floorView: { floor: number | null; max: number };
  /** Cinematic progress. */
  cine: { time: number; duration: number; playing: boolean };
  /** Cinematic reached its end. */
  cineEnd: Record<string, never>;
  /** Pointer lock taken or released in walk mode. */
  pointerLock: { locked: boolean };
  /** Achievement unlocked (after it is saved). */
  achievement: { id: string };
  /** A short message for the toast line. */
  toast: { text: string; detail?: string; kind?: "info" | "achievement" | "error" };
}

export interface StairInfo {
  name: string;
  level: number;
  top: number;
  canUp: boolean;
  canDown: boolean;
}

type Handler<T> = (payload: T) => void;

export class EventBus<E extends object> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();
  private muted = 0;

  on<K extends keyof E>(name: K, handler: Handler<E[K]>): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(handler as Handler<never>);
    return () => set!.delete(handler as Handler<never>);
  }

  emit<K extends keyof E>(name: K, payload: E[K]) {
    if (this.muted > 0) return;
    const set = this.handlers.get(name);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        (handler as Handler<E[K]>)(payload);
      } catch (error) {
        console.error(`[events] ${String(name)}`, error);
      }
    }
  }

  /** Run `fn` with every emit dropped (self-tests move the player without counting it as play). */
  silently<T>(fn: () => T): T {
    this.muted += 1;
    try {
      return fn();
    } finally {
      this.muted -= 1;
    }
  }
}

export const bus = new EventBus<GameEvents>();
