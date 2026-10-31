/**
 * Versioned, defensive persistence over localStorage.
 *
 * - Every record is `{ version, savedAt, data }`.
 * - On load: parse → migrate up to the current version → merge over defaults. A record that fails
 *   falls back to the previous good copy (`<key>:bak`), then to defaults.
 * - On save: the previous record is kept as `<key>:bak` before the new one is written.
 * - Storage can be missing or throw (private windows, blocked site data); the game keeps working
 *   from memory and `ok` turns false so the UI can say saving is off.
 */

export interface Envelope<T> {
  version: number;
  savedAt: number;
  data: T;
}

/** Turns data saved at version `n` into version `n + 1`. Keyed by `n`. */
export type Migrations = Record<number, (data: Record<string, unknown>) => Record<string, unknown>>;

export interface StoreOptions<T> {
  key: string;
  version: number;
  defaults: () => T;
  migrations?: Migrations;
  /** Fix or reject loaded data. Return null to treat the record as broken. */
  validate?: (data: T) => T | null;
  /** Coalesce writes made within this many ms (default 250). */
  throttleMs?: number;
}

type Listener<T> = (data: T, changed: (keyof T)[]) => void;

function storageAvailable(): Storage | null {
  try {
    const probe = "__probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export class Store<T extends object> {
  readonly ok: boolean;
  private storage: Storage | null;
  private value: T;
  private listeners = new Set<Listener<T>>();
  private timer: number | null = null;

  constructor(private options: StoreOptions<T>) {
    this.storage = storageAvailable();
    this.ok = this.storage !== null;
    this.value = this.load();
    window.addEventListener("pagehide", () => this.flush());
  }

  get(): Readonly<T> {
    return this.value;
  }

  /** Shallow-merge a patch, notify listeners and schedule a save. */
  set(patch: Partial<T>) {
    const changed = (Object.keys(patch) as (keyof T)[]).filter(
      (k) => JSON.stringify(this.value[k]) !== JSON.stringify(patch[k]),
    );
    if (changed.length === 0) return;
    this.value = { ...this.value, ...patch };
    this.schedule();
    for (const listener of [...this.listeners]) listener(this.value, changed);
  }

  /** Replace with defaults (used by "reset" buttons). */
  reset() {
    const before = this.value;
    this.value = this.options.defaults();
    const changed = (Object.keys(this.value) as (keyof T)[]).filter(
      (k) => JSON.stringify(before[k]) !== JSON.stringify(this.value[k]),
    );
    this.flush(true);
    for (const listener of [...this.listeners]) listener(this.value, changed);
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Write now. `force` writes even when nothing is pending. */
  flush(force = false) {
    if (this.timer === null && !force) return;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    if (!this.storage) return;
    const record: Envelope<T> = { version: this.options.version, savedAt: Date.now(), data: this.value };
    try {
      const previous = this.storage.getItem(this.options.key);
      if (previous) this.storage.setItem(`${this.options.key}:bak`, previous);
      this.storage.setItem(this.options.key, JSON.stringify(record));
    } catch (error) {
      console.warn(`[storage] could not save ${this.options.key}`, error);
    }
  }

  private schedule() {
    if (this.timer !== null) return;
    this.timer = window.setTimeout(() => this.flush(), this.options.throttleMs ?? 250);
  }

  private load(): T {
    const defaults = this.options.defaults();
    if (!this.storage) return defaults;
    for (const key of [this.options.key, `${this.options.key}:bak`]) {
      const data = this.read(key, defaults);
      if (data) return data;
    }
    return defaults;
  }

  private read(key: string, defaults: T): T | null {
    let raw: string | null;
    try {
      raw = this.storage!.getItem(key);
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<Envelope<Record<string, unknown>>>;
      if (typeof parsed !== "object" || parsed === null || typeof parsed.data !== "object" || parsed.data === null) return null;
      let version = Number(parsed.version) || 0;
      if (version > this.options.version) {
        // Saved by a newer build: keep what we understand, never crash.
        console.warn(`[storage] ${key} is from a newer version (${version}); reading known fields only`);
      }
      let data = parsed.data;
      while (version < this.options.version) {
        const step = this.options.migrations?.[version];
        if (step) data = step(data);
        version += 1;
      }
      const merged = { ...defaults, ...(data as Partial<T>) } as T;
      return this.options.validate ? this.options.validate(merged) : merged;
    } catch {
      return null;
    }
  }
}
