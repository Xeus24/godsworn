import { content, type Content } from '../../data';
import { FORTUNE_NEWS, FORTUNES, FORTUNE_TIERS, RAID_LINES, type FortuneTier } from '../../data/realm/fortunes';
import type { Rng } from '../core/rng';
import type { Character } from '../character/types';
import { investmentLevel } from '../world/investments';
import { fullName, hierarchy } from './grudge';
import type { FortunesState, GrudgeState, TownFortune } from './types';

const clamp = (n: number): number => Math.min(100, Math.max(0, n));
const fill = (t: string, v: Record<string, string>): string => t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export const startOf = (town: string): number => FORTUNES.starts[town] ?? FORTUNES.baseline;

/** A town's record, created on first look at its starting prosperity. */
export function fortuneOf(st: FortunesState, town: string): TownFortune {
  return (st.towns[town] ??= { prosperity: startOf(town), raids: 0 });
}

export function tierOf(f: TownFortune): FortuneTier {
  if (f.fallen !== undefined) return FORTUNE_TIERS[0] as FortuneTier;
  return [...FORTUNE_TIERS].reverse().find((t) => f.prosperity >= t.from && t.id !== 'fallen') ?? (FORTUNE_TIERS[1] as FortuneTier);
}

function news(st: FortunesState, day: number, town: string, text: string): void {
  st.log.unshift({ day, zone: town, text });
  if (st.log.length > 40) st.log.length = 40;
}

/** Raises (or lowers, if negative) a town's prosperity. Returns a line if its fortune changed enough to be news. */
export function lift(st: FortunesState, town: string, amount: number, day: number, c: Content = content): string | undefined {
  const f = fortuneOf(st, town);
  const before = tierOf(f);
  f.prosperity = clamp(f.prosperity + amount);
  const name = c.towns.get(town).name;
  if (f.fallen === undefined && f.prosperity <= 0) {
    f.fallen = day;
    const text = fill(FORTUNE_NEWS.fell[0] as string, { town: name });
    news(st, day, town, text);
    return text;
  }
  if (f.fallen !== undefined && f.prosperity >= FORTUNES.rise) {
    delete f.fallen;
    const text = fill(FORTUNE_NEWS.rose[0] as string, { town: name });
    news(st, day, town, text);
    return text;
  }
  const after = tierOf(f);
  if (after.id !== before.id && f.fallen === undefined) {
    const text = after.id === 'flourishing' ? fill(FORTUNE_NEWS.flourishing[0] as string, { town: name }) : after.id === 'struggling' ? fill(FORTUNE_NEWS.slump[0] as string, { town: name }) : `${name} is now ${after.name}.`;
    news(st, day, town, text);
    return text;
  }
  return undefined;
}

/** One day for every town: the pull of its record, its investments, and raids by the Grudgebound of its region. Returns news lines. */
export function tick(st: FortunesState, grudge: GrudgeState, char: Character, day: number, rng: Rng, c: Content = content): string[] {
  const out: string[] = [];
  for (const town of c.towns.all()) {
    const f = fortuneOf(st, town.id);
    if (f.fallen === undefined) {
      // Back toward where it began, and up with every investment you hold there.
      const home = startOf(town.id);
      const pull = Math.sign(home - f.prosperity) * Math.min(FORTUNES.drift, Math.abs(home - f.prosperity));
      const invested = c.investments.filter((i) => i.town === town.id).reduce((n, i) => n + investmentLevel(char, i.id), 0);
      const note = lift(st, town.id, pull + invested * FORTUNES.perInvestmentLevel, day, c);
      if (note) out.push(note);
    }
    // Raids: the top Grudgebound of the region, if scarred enough, comes for the town.
    const top = hierarchy(grudge, town.zone)[0];
    if (top && top.scars >= FORTUNES.raidScars && rng.chance(top.scars * FORTUNES.raidChancePerScar)) {
      const damage = FORTUNES.raidDamage * (1 + top.scars / 4) * (1 - f.prosperity / 200);
      f.raids++;
      const text = fill(RAID_LINES[rng.int(0, RAID_LINES.length - 1)] as string, { raider: fullName(top), town: town.name });
      news(st, day, town.id, text);
      out.push(text);
      const fell = lift(st, town.id, -damage, day, c);
      if (fell) out.push(fell);
    }
  }
  return out;
}

export const priceMult = (st: FortunesState, town: string): number => tierOf(fortuneOf(st, town)).prices;
export const innMult = (st: FortunesState, town: string): number => tierOf(fortuneOf(st, town)).inn;
export const isFallen = (st: FortunesState, town: string): boolean => fortuneOf(st, town).fallen !== undefined;
