/**
 * Typed publish/subscribe bus. The engine emits events; UI, achievements,
 * quests and god-favor systems subscribe to them without the emitter knowing.
 */
export type Listener<P> = (payload: P) => void;

export class EventBus<Events extends object> {
  private listeners = new Map<keyof Events, Set<Listener<never>>>();
  private errorHandler: (error: unknown, event: keyof Events) => void;

  constructor(onError?: (error: unknown, event: keyof Events) => void) {
    this.errorHandler =
      onError ?? ((error, event) => console.error(`[EventBus] listener for "${String(event)}" threw`, error));
  }

  /** Subscribes and returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const off = this.on(event, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<never>);
  }

  /**
   * Calls every listener in subscription order. A throwing listener is
   * reported and does not stop the others.
   */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of [...set]) {
      try {
        (listener as Listener<Events[K]>)(payload);
      } catch (error) {
        this.errorHandler(error, event);
      }
    }
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
  }
}
