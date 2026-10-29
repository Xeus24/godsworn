import type { ModifierSpec } from '../engine/stats/modifiers';
import { flat, more, pct } from './trees/builder';

/**
 * The endgame beyond Rifts and the Boss Rush (expansion phase 19d): the Endless Spire, the Divine Trials, the
 * Arena Champions league and the weekly seeded run. Each is a gauntlet fought in a row with no real rest (see
 * engine/state/endgameActions.ts); these are their numbers.
 */

/** The Endless Spire: floors without end, harder each time, a guardian every fifth, a new twist every fifth. */
export const SPIRE = {
  minLevel: 50,
  guardianEvery: 5,
  affixEvery: 5,
  maxAffixes: 4,
  threatPerFloor: 4,
  levelEvery: 4,
  goldPerLevelPerFloor: 4,
};

/** The Arena Champions league: a season of eight champions; win it and you climb a rank. */
export const LEAGUE = {
  minLevel: 40,
  ranks: ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grand Master', 'Champion'],
  fightsPerSeason: 8,
  goldPerLevelPerRank: 30,
  respitePct: 25,
};

/** The weekly seeded run: the same six fights and three twists for everyone this week. */
export const WEEKLY = {
  minLevel: 50,
  fights: 6,
  affixes: 3,
  goldPerLevel: 80,
  riftMaps: 2,
  respitePct: 20,
};

export interface DivineTrialDef {
  god: string;
  name: string;
  description: string;
  enemy: ModifierSpec[];
  party: ModifierSpec[];
  /** The title earned for clearing every trial. */
  levelBonus: number;
}

/** One trial for each god: you face their Aspect, with a theme. Needs the god's regard (Acknowledged favor). */
const t = (god: string, name: string, description: string, enemy: ModifierSpec[], party: ModifierSpec[] = []): DivineTrialDef => ({ god, name, description, enemy, party, levelBonus: 2 });

export const DIVINE_TRIALS: DivineTrialDef[] = [
  t('solenne', 'The Trial of Noon', 'The Aspect fights in blinding light: it deals 25% more holy damage and has 30% more health.', [flat('holyDamage', 25), pct('maxHp', 30)]),
  t('morrath', 'The Trial of the Last Hour', 'The Aspect is patient: it heals 3% a turn and resists your statuses.', [flat('hpRegen', 3), flat('statusResist', 30)]),
  t('kael', 'The Trial of the Ring', 'The Aspect hits harder every turn it is alive: 20% more damage, and your party has 10% less defense.', [more('damageBonus', 20)], [pct('defense', -10)]),
  t('ysolde', 'The Trial of the Heartwood', 'The Aspect is rooted deep: 40% more health, and it heals when you do not.', [pct('maxHp', 40), flat('hpRegen', 2)]),
  t('vex', 'The Trial of the Third Card', 'The Aspect cheats: it is 25% faster and has +15 dodge.', [pct('speed', 25), flat('dodge', 15)]),
  t('thalor', 'The Trial of the Anvil', 'The Aspect is forged: 35% more defense and 20% more damage.', [pct('defense', 35), more('damageBonus', 20)]),
  t('nymira', 'The Trial of the Rising Tide', 'The Aspect drowns the field: your party is 12% slower, and it deals 20% more lightning and ice damage.', [flat('lightningDamage', 20), flat('iceDamage', 20)], [pct('speed', -12)]),
  t('aurelis', 'The Trial of the Index', 'The Aspect knows your habits: +20% critical chance and +30% critical damage.', [flat('critChance', 20), flat('critDamage', 30)]),
  t('hesha', 'The Trial of the Hearth', 'The Aspect is warm and will not let go: it steals 6% life and has 25% more health.', [flat('lifesteal', 6), pct('maxHp', 25)]),
  t('grimvald', 'The Trial of the Ledger', 'The Aspect collects: your party finds no gold here, and it has 30% more health and a 15% damage premium.', [pct('maxHp', 30), more('damageBonus', 15)], [more('goldFind', -100)]),
  t('lyssara', 'The Trial of the Long Night', 'The Aspect dreams you: it deals 25% more arcane and shadow damage, and your party has 8% less accuracy.', [flat('arcaneDamage', 25), flat('shadowDamage', 25)], [pct('accuracy', -8)]),
  t('ordrun', 'The Trial of the Mountain', 'The Aspect does not move: 50% more health, 25% more defense, and 15% slower.', [pct('maxHp', 50), pct('defense', 25), pct('speed', -15)]),
  t('seraphel', 'The Trial of the Open Sky', 'The Aspect is everywhere: +20 dodge, 20% faster, and it deals 20% more lightning damage.', [flat('dodge', 20), pct('speed', 20), flat('lightningDamage', 20)]),
  t('mirrin', 'The Trial of the Moment Between', 'The Aspect remembers what you did: your party deals 10% less damage, and it has +10% crit.', [flat('critChance', 10), pct('maxHp', 20)], [more('damageBonus', -10)]),
];
