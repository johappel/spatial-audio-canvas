// Generischer, typsicherer Event-Bus (Publish/Subscribe).
// Entkoppelt Features voneinander: Plugins und Kernmodule kommunizieren
// ueber Events statt ueber direkte Abhaengigkeiten.

export type Listener<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(type: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener as Listener<unknown>);
    return () => this.off(type, listener);
  }

  off<K extends keyof Events>(type: K, listener: Listener<Events[K]>): void {
    this.listeners.get(type)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    this.listeners.get(type)?.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error('[EventBus] Listener-Fehler fuer', String(type), error);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}