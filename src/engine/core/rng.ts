/**
 * Seedable pseudo-random number generator (mulberry32).
 *
 * Every random roll in the engine (combat, loot, encounters) goes through an
 * Rng instance so a given seed always reproduces the same outcome. The full
 * generator state is a single uint32, which makes it trivial to save.
 */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** Current internal state; store this in save files. */
  get state(): number {
    return this.s;
  }

  set state(value: number) {
    this.s = value >>> 0;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    // mulberry32: add a Weyl constant, then two xorshift-multiply rounds.
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max], both inclusive. */
  int(min: number, max: number): number {
    if (max < min) throw new RangeError(`Rng.int: max (${max}) < min (${min})`);
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Uniform float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** True with the given probability (0..1). */
  chance(probability: number): boolean {
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return this.next() < probability;
  }

  /** True with the given percentage (0..100). */
  percent(pct: number): boolean {
    return this.chance(pct / 100);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Rng.pick: empty array');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /**
   * Weighted selection. Entries with weight <= 0 are never picked.
   * Throws if no entry has positive weight.
   */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    let total = 0;
    for (const item of items) total += Math.max(0, weightOf(item));
    if (total <= 0) throw new RangeError('Rng.weighted: no positive weights');
    let roll = this.next() * total;
    for (const item of items) {
      const w = Math.max(0, weightOf(item));
      if (w <= 0) continue;
      roll -= w;
      if (roll < 0) return item;
    }
    // Floating point fallback: return the last positive-weight item.
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i] as T;
      if (weightOf(item) > 0) return item;
    }
    throw new RangeError('Rng.weighted: unreachable');
  }

  /** Returns a shuffled copy (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }

  /** Picks `count` distinct items (or all of them if fewer exist). */
  sample<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, Math.max(0, count));
  }

  /**
   * Derives an independent child generator. Consumes one roll from this
   * generator so repeated forks with the same label still differ.
   */
  fork(label = ''): Rng {
    const base = Math.floor(this.next() * 4294967296);
    return new Rng((base ^ hashString(label)) >>> 0);
  }
}

/** FNV-1a 32-bit string hash, used to derive seeds from labels. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
