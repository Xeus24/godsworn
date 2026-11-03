import { content, type Content } from '../../data';
import { GRUDGE, GRUDGE_EPITHETS, GRUDGE_NAMES, GRUDGE_RANKS, GRUDGE_REASONS, GRUDGE_SCHEMES, GRUDGE_SLOTS } from '../../data/realm/grudge';
import type { Rng } from '../core/rng';
import type { EncounterDef } from '../combat/types';
import type { GrudgeEntry, GrudgeLogEntry, GrudgeState } from './types';

export const rankTitle = (rank: number): string => GRUDGE_RANKS.find((r) => r.rank === rank)?.title ?? 'Upstart';
export const fullName = (g: GrudgeEntry): string => `${g.name} ${g.epithet}`;

/** The live Grudgebound of a region, top of the order first. */
export function hierarchy(st: GrudgeState, zone: string): GrudgeEntry[] {
  return Object.values(st.entries)
    .filter((g) => g.zone === zone && g.slain === undefined)
    .sort((a, b) => a.rank - b.rank);
}

/** Extra HP and damage (percent) its scars and standing give it. */
export const grudgeThreat = (g: GrudgeEntry): number => GRUDGE.base + g.scars * GRUDGE.perScar + (GRUDGE_SLOTS - g.rank) * GRUDGE.perPlace;

/** Levels above the region's ordinary fights: one for every two scars. */
export const grudgeLevelBonus = (g: GrudgeEntry): number => Math.floor(g.scars / 2);

/** What it is worth to put down: gold and XP scale with how high it stood. */
export const grudgeBounty = (g: GrudgeEntry, level: number): { gold: number; xp: number } => {
  const standing = GRUDGE_SLOTS + 1 - g.rank;
  return { gold: Math.round(level * GRUDGE.bountyPerLevel * (1 + standing / 5) * (1 + g.scars / 4)), xp: Math.round(level * 18 * (1 + standing / 4)) };
};

const pick = <T>(list: readonly T[], rng: Rng): T => list[rng.int(0, list.length - 1)] as T;

/** Re-numbers the live Grudgebound of a region 1..n in their current order. */
function tidy(st: GrudgeState, zone: string): void {
  hierarchy(st, zone).forEach((g, i) => (g.rank = i + 1));
}

function logLine(st: GrudgeState, day: number, zone: string, text: string): void {
  const line: GrudgeLogEntry = { day, zone, text };
  st.log.unshift(line);
  if (st.log.length > 60) st.log.length = 60;
}

const fill = (template: string, vars: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

function uniqueName(st: GrudgeState, rng: Rng): { name: string; epithet: string } {
  const taken = new Set(Object.values(st.entries).map(fullName));
  for (let i = 0; i < 200; i++) {
    const name = pick(GRUDGE_NAMES, rng);
    const epithet = pick(GRUDGE_EPITHETS, rng);
    if (!taken.has(`${name} ${epithet}`)) return { name, epithet };
  }
  return { name: pick(GRUDGE_NAMES, rng), epithet: `the ${st.next}th` };
}

/** Forges a Grudgebound of `enemyId` at the bottom of the region's order; null when the order is full or the foe is not marked. */
export function forge(st: GrudgeState, zone: string, enemyId: string, cause: GrudgeEntry['cause'], day: number, rng: Rng, c: Content = content): GrudgeEntry | null {
  const live = hierarchy(st, zone);
  if (live.length >= GRUDGE_SLOTS) return null;
  const def = c.enemies.get(enemyId);
  const affixes = c.eliteAffixes.all().map((a) => a.id);
  const traits: string[] = [];
  const want = cause === 'upstart' ? 0 : 1;
  while (traits.length < want && affixes.length) {
    const a = pick(affixes, rng);
    if (!traits.includes(a)) traits.push(a);
  }
  const { name, epithet } = uniqueName(st, rng);
  const entry: GrudgeEntry = {
    id: `grudge-${st.next++}`,
    name,
    epithet,
    zone,
    enemyId: def.id,
    rank: live.length + 1,
    scars: cause === 'upstart' ? 0 : 1,
    beat: cause === 'beat' ? 1 : 0,
    fled: cause === 'fled' ? 1 : 0,
    traits,
    cause,
    born: day,
  };
  st.entries[entry.id] = entry;
  return entry;
}

/** The foe that beat the party, or was run from, gets a name. Returns the Grudgebound and whether it is new. */
export function mark(st: GrudgeState, zone: string, enemyId: string, existing: string | undefined, cause: 'beat' | 'fled', day: number, rng: Rng, c: Content = content): { entry: GrudgeEntry; fresh: boolean } | null {
  const known = existing ? st.entries[existing] : undefined;
  if (known && known.slain === undefined) {
    known.scars = Math.min(GRUDGE.maxScars, known.scars + 1);
    if (cause === 'beat') known.beat++;
    else known.fled++;
    // Beating you is how it climbs: it takes the place above if the one there has fewer scars.
    const above = hierarchy(st, zone).find((g) => g.rank === known.rank - 1);
    if (cause === 'beat' && above && above.scars <= known.scars) {
      [above.rank, known.rank] = [known.rank, above.rank];
      logLine(st, day, zone, fill(pick(GRUDGE_SCHEMES.topple, rng), { a: fullName(known), b: fullName(above) }));
    }
    return { entry: known, fresh: false };
  }
  const entry = forge(st, zone, enemyId, cause, day, rng, c);
  if (!entry) return null;
  logLine(st, day, zone, cause === 'beat' ? `${fullName(entry)} has been named for beating you in ${zone}.` : `${fullName(entry)} has been named for the fight you ran from in ${zone}.`);
  return { entry, fresh: true };
}

/** A Grudgebound that has been put down by the hero. */
export function slay(st: GrudgeState, id: string, day: number, by = 'hero'): void {
  const g = st.entries[id];
  if (!g || g.slain !== undefined) return;
  g.slain = day;
  g.slainBy = by;
  if (by === 'hero') st.slain++;
  tidy(st, g.zone);
}

/** One day of scheming in every region that has Grudgebound. Returns the new lines of the ledger. */
export function scheme(st: GrudgeState, day: number, rng: Rng, c: Content = content): string[] {
  const out: string[] = [];
  const zones = new Set(Object.values(st.entries).filter((g) => g.slain === undefined).map((g) => g.zone));
  for (const zone of zones) {
    const live = hierarchy(st, zone);
    if (live.length < GRUDGE_SLOTS && rng.chance(GRUDGE.upstartChance)) {
      const z = c.zones.find(zone);
      const group = z && z.encounters.length ? pick(z.encounters, rng) : undefined;
      const enemyId = group?.enemies[0] ? c.enemies.find(group.enemies[0].enemyId)?.id : undefined;
      const born = enemyId ? forge(st, zone, enemyId, 'upstart', day, rng, c) : null;
      if (born) {
        const text = fill(pick(GRUDGE_SCHEMES.upstart, rng), { a: fullName(born) });
        logLine(st, day, zone, text);
        out.push(text);
      }
    }
    if (live.length >= 2 && rng.chance(GRUDGE.stirChance)) {
      const i = rng.int(1, live.length - 1);
      const lower = live[i] as GrudgeEntry;
      const upper = live[i - 1] as GrudgeEntry;
      // The challenger's odds: scars, with a little luck.
      const chance = 0.35 + (lower.scars - upper.scars) * 0.08;
      if (rng.chance(Math.min(0.8, Math.max(0.1, chance)))) {
        if (rng.chance(GRUDGE.slayShare)) {
          upper.slain = day;
          upper.slainBy = lower.id;
          lower.scars = Math.min(GRUDGE.maxScars, lower.scars + 1);
          tidy(st, zone);
          const text = fill(pick(GRUDGE_SCHEMES.slay, rng), { a: fullName(lower), b: fullName(upper) });
          logLine(st, day, zone, text);
          out.push(text);
        } else {
          [upper.rank, lower.rank] = [lower.rank, upper.rank];
          lower.scars = Math.min(GRUDGE.maxScars, lower.scars + 1);
          const text = fill(pick(GRUDGE_SCHEMES.topple, rng), { a: fullName(lower), b: fullName(upper) });
          logLine(st, day, zone, text);
          out.push(text);
        }
      } else {
        const text = fill(pick(GRUDGE_SCHEMES.gloat, rng), { a: fullName(lower) });
        logLine(st, day, zone, text);
        out.push(text);
      }
    }
  }
  return out;
}

/** Possibly puts one of the region's Grudgebound at the head of a wandering encounter. */
export function decorate(st: GrudgeState, encounter: EncounterDef, zone: string, heroName: string, rng: Rng): EncounterDef {
  const live = hierarchy(st, zone);
  if (!live.length || encounter.isBoss) return encounter;
  if (!rng.chance(Math.min(GRUDGE.appearCap, live.length * GRUDGE.appearPerEntry))) return encounter;
  // The higher ones are rarer: a rank-1 warlord turns up a tenth as often as an upstart.
  const g = live.length === 1 ? (live[0] as GrudgeEntry) : (() => {
    const weights = live.map((x) => 1 + (GRUDGE_SLOTS - x.rank) * 0.2 + 0.1);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng.float(0, total);
    for (const [i, w] of weights.entries()) {
      roll -= w;
      if (roll <= 0) return live[i] as GrudgeEntry;
    }
    return live[0] as GrudgeEntry;
  })();
  const reasons = g.cause === 'fled' ? GRUDGE_REASONS.fled : GRUDGE_REASONS.beat;
  const lead = {
    enemyId: g.enemyId,
    tier: 'champion' as const,
    grudge: { id: g.id, name: fullName(g), threat: grudgeThreat(g), levelBonus: grudgeLevelBonus(g), traits: g.traits, line: fill(pick(reasons, rng), { name: heroName }), rank: g.rank },
  };
  return { ...encounter, name: `${fullName(g)}, ${rankTitle(g.rank)} of the road`, enemies: [lead, ...encounter.enemies.slice(0, 2)] };
}
