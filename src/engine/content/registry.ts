/**
 * Read-only lookup table for one kind of content (classes, items, gods...).
 * Construction validates that every id is non-empty and unique.
 */
export class ContentTable<T extends { id: string }> {
  private readonly byId = new Map<string, T>();

  constructor(
    readonly kind: string,
    entries: readonly T[],
  ) {
    for (const entry of entries) {
      if (!entry.id) throw new ContentError(`${kind}: entry with empty id`);
      if (this.byId.has(entry.id)) throw new ContentError(`${kind}: duplicate id "${entry.id}"`);
      this.byId.set(entry.id, entry);
    }
  }

  get(id: string): T {
    const entry = this.byId.get(id);
    if (!entry) throw new ContentError(`${this.kind}: unknown id "${id}"`);
    return entry;
  }

  find(id: string): T | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  all(): T[] {
    return [...this.byId.values()];
  }

  ids(): string[] {
    return [...this.byId.keys()];
  }

  get size(): number {
    return this.byId.size;
  }

  filter(predicate: (entry: T) => boolean): T[] {
    return this.all().filter(predicate);
  }
}

export class ContentError extends Error {
  override name = 'ContentError';
}

/**
 * Collects reference problems across tables (e.g. a skill pointing at a
 * status that does not exist) so content validation reports all of them at
 * once instead of stopping at the first.
 */
export class ContentValidator {
  readonly problems: string[] = [];

  ref(table: { has(id: string): boolean; kind: string }, id: string, where: string): void {
    if (!table.has(id)) this.problems.push(`${where}: unknown ${table.kind} "${id}"`);
  }

  check(ok: boolean, message: string): void {
    if (!ok) this.problems.push(message);
  }

  throwIfInvalid(): void {
    if (this.problems.length > 0) {
      throw new ContentError(`Content validation failed:\n  ${this.problems.join('\n  ')}`);
    }
  }
}
