import type { ModifierSpec } from '../engine/stats/modifiers';

/** Tabletop Rules data (Section I-6, R26): Boons, the God's Nod triggers and which stat saves against which status. */

// ------------------------------------------------------------------ 194: Boons
export interface Boon { id: string; name: string; text: string; modifiers: ModifierSpec[] }
const lab: Record<string, string> = {
  physicalAttack: 'physical attack', magicAttack: 'magic attack', maxHp: 'max HP', maxMp: 'max MP', defense: 'defense', magicResist: 'magic resist', critChance: 'crit chance', dodge: 'dodge', speed: 'speed',
  accuracy: 'accuracy', statusResist: 'status resist', statusChance: 'status chance', damageBonus: 'damage', cooldownReduction: 'cooldown reduction', resourceGain: 'resource gain', goldFind: 'gold found',
  magicFind: 'magic find', healingPower: 'healing power', lifesteal: 'lifesteal', hpRegen: 'HP regen', xpGain: 'XP', blessingPower: 'blessing power', fireDamage: 'fire damage', iceDamage: 'ice damage',
  lightningDamage: 'lightning damage', natureDamage: 'nature damage', holyDamage: 'holy damage', shadowDamage: 'shadow damage', arcaneDamage: 'arcane damage', earthDamage: 'earth damage',
};
const PCT = new Set(['physicalAttack', 'magicAttack', 'maxHp', 'maxMp', 'defense', 'magicResist']);
// prettier-ignore
const ROWS: [theme: string, names: string[], stats: [string, number][]][] = [
  ['Martial', ['Drilled', 'Heavy-Handed', 'Shield-Trained', 'Battle-Hardened', 'Veteran'], [['physicalAttack', 6], ['damageBonus', 4], ['defense', 6], ['maxHp', 6], ['critChance', 4]]],
  ['Arcane', ['Studied', 'Spell-Lettered', 'Warded', 'Deep-Wellspring', 'Archmage-Taught'], [['magicAttack', 6], ['cooldownReduction', 5], ['magicResist', 6], ['maxMp', 8], ['arcaneDamage', 6]]],
  ['Guardian', ['Steadfast', 'Interposing', 'Unflinching', 'Bulwark', 'Last Wall'], [['defense', 8], ['statusResist', 6], ['hpRegen', 3], ['maxHp', 8], ['magicResist', 8]]],
  ['Wanderer', ['Swift-Footed', 'Pathfinder', 'Weather-Wise', 'Long-Winded', 'Roadwise'], [['speed', 6], ['dodge', 4], ['xpGain', 4], ['hpRegen', 2], ['goldFind', 6]]],
  ['Scholar', ['Bookish', 'Cross-Referencing', 'Lore-Keeper', 'Wise Counsel', 'Footnote-Fiend'], [['xpGain', 4], ['magicFind', 6], ['statusChance', 5], ['magicAttack', 4], ['cooldownReduction', 4]]],
  ['Devout', ['Pious', 'Candle-Bearer', 'Saint-Touched', 'Blessed Hands', 'Beloved'], [['blessingPower', 6], ['holyDamage', 6], ['healingPower', 6], ['statusResist', 5], ['blessingPower', 10]]],
  ['Rogue', ['Light-Fingered', 'Shadowed', 'Back-Alley', 'Knife-Wise', 'Cutpurse Royal'], [['dodge', 4], ['critChance', 5], ['shadowDamage', 6], ['goldFind', 8], ['damageBonus', 5]]],
  ['Healer', ['Gentle-Handed', 'Herb-Wife', 'Field Surgeon', 'Well-Tended', 'Miracle Worker'], [['healingPower', 6], ['hpRegen', 3], ['lifesteal', 3], ['maxHp', 5], ['healingPower', 10]]],
  ['Beast', ['Wild-Eyed', 'Pack-Runner', 'Thick-Furred', 'Claw-Quick', 'Apex'], [['accuracy', 6], ['speed', 5], ['natureDamage', 6], ['dodge', 5], ['damageBonus', 6]]],
  ['Merchant', ['Shrewd', 'Haggler', 'Well-Connected', 'Tallymaster', 'Guild-Favored'], [['goldFind', 8], ['magicFind', 5], ['xpGain', 3], ['goldFind', 12], ['magicFind', 8]]],
  ['Survivor', ['Scarred', 'Wiry', 'Hard-Won', 'Cockroach', 'Unkillable'], [['maxHp', 5], ['hpRegen', 2], ['statusResist', 6], ['defense', 5], ['lifesteal', 4]]],
  ['Elementalist', ['Ember-Tongued', 'Frost-Kissed', 'Storm-Called', 'Stone-Hearted', 'Four-Winds'], [['fireDamage', 6], ['iceDamage', 6], ['lightningDamage', 6], ['earthDamage', 6], ['resourceGain', 8]]],
];
export const BOONS: Boon[] = ROWS.flatMap(([theme, names, stats]) =>
  names.map((n, i): Boon => {
    const [stat, value] = stats[i] as [string, number];
    return {
      id: `boon-${theme.toLowerCase()}-${i + 1}`, name: `${theme}: ${n}`,
      text: `+${value}${stat === 'speed' || stat === 'accuracy' || stat === 'hpRegen' ? '' : '%'} ${lab[stat] ?? stat}.`,
      modifiers: [{ stat, type: PCT.has(stat) ? 'percent' : 'flat', value } as ModifierSpec],
    };
  }),
);
/** A Boon every four levels, or two stat points instead. */
export const BOON_EVERY = 4;
export const STAT_POINTS_INSTEAD = 2;

// ------------------------------------------------------------------ 193: the God's Nod
export const NOD_MAX = 3;
export type NodEvent = 'boss' | 'quest' | 'level' | 'victory' | 'rest' | 'favor' | 'gold';
/** What earns a Nod for each Ideal, Bond and Flaw (once a day for each): acting in character. */
// prettier-ignore
export const NOD_EVENTS: Record<string, NodEvent> = {
  mercy: 'rest', glory: 'boss', order: 'quest', freedom: 'victory', knowledge: 'level', tradition: 'rest', charity: 'gold', ambition: 'level', honor: 'quest', craft: 'victory', change: 'victory', faith: 'favor',
  family: 'rest', 'order-sworn': 'victory', teacher: 'level', 'lost-home': 'quest', rival: 'boss', debt: 'gold', 'dead-promise': 'quest', 'craft-bond': 'victory', town: 'quest', prisoner: 'boss', heirloom: 'quest', favor: 'favor',
  greed: 'gold', pride: 'boss', wrath: 'victory', cowardice: 'rest', gluttony: 'rest', vanity: 'boss', curiosity: 'level', secrecy: 'quest', recklessness: 'victory', stubborn: 'quest', sloth: 'rest', grudge: 'boss',
};

// ------------------------------------------------------------------ 195: Saving Throws
/** The stat that saves against each hostile status. */
// prettier-ignore
export const SAVE_STAT: Record<string, 'str' | 'dex' | 'vit' | 'wis'> = {
  stun: 'vit', freeze: 'vit', slow: 'vit', entangle: 'str', mired: 'str', petrify: 'vit', bleed: 'vit', poison: 'vit', burn: 'dex', blind: 'dex',
  charm: 'wis', fear: 'wis', confuse: 'wis', silence: 'wis', curse: 'wis', doom: 'wis', sleep: 'wis', corruption: 'vit', weaken: 'vit', vulnerable: 'wis',
};
export const saveStatFor = (statusId: string): 'str' | 'dex' | 'vit' | 'wis' => SAVE_STAT[statusId] ?? 'vit';

// ------------------------------------------------------------------ 198: Last Breath / 199: rests
export const LAST_BREATH = { rolls: 3, dc: 10 };
export const BREATHER = { hpPct: 40, mpPct: 40, minutes: 60, perDay: 2 };
