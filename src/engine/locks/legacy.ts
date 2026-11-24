import { content, type Content } from '../../data';

/**
 * What a save from before save version 27 could already see, under the rules it was written with:
 * every Codex > Realm and Heart page from level 10 (or once past the story's first end), the Pantheon
 * and Party from level 3, Pastimes from level 2, the Workshop and the Market from the start, and
 * dungeons that shift between visits. The locks that gate those now are opened for such a save,
 * quietly, and their guides are settled as seen: an existing hero loses nothing it had.
 */
export function legacyLocks(level: number, pastFirstEnd: boolean, c: Content = content): string[] {
  const at = (min: number): boolean => pastFirstEnd || level >= min;
  const out = new Set<string>();
  for (const sys of c.systems.all()) {
    if (sys.entries.some((e) => e.startsWith('realm:') || e.startsWith('heart:') || e.startsWith('games:')) && at(10)) out.add(sys.lock);
  }
  const fixed: [string, number][] = [
    ['reveal:tab:pantheon', 3],
    ['reveal:tab:party', 3],
    ['reveal:town:pastimes', 2],
    ['reveal:codex:realm', 10],
    ['reveal:codex:heart', 10],
    ['system:workshop', 1],
    ['system:market', 1],
    ['system:living', 1],
  ];
  for (const [id, min] of fixed) if (c.locks.find(id) && at(min)) out.add(id);
  return [...out];
}
