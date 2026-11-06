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

// ------------------------------------------------------------------ 201: Circles and the Eight Arcana
import type { SkillDef } from '../engine/skills/types';
export const ARCANA = ['Warding', 'Calling', 'Seeing', 'Binding', 'Veiling', 'Unmaking', 'Shaping', 'Ending'] as const;
export type Arcanum = (typeof ARCANA)[number];
export const ARCANA_TEXT: Record<Arcanum, string> = {
  Warding: 'Shields, wards and mending: keeping a thing whole.',
  Calling: 'Summons, spirits and companions: asking for company.',
  Seeing: 'Marks, foresight and time: knowing what comes.',
  Binding: 'Curses, snares and compulsions: making a thing stay.',
  Veiling: 'Stealth, evasion and illusion: being somewhere else.',
  Unmaking: 'Decay, shadow and the void: taking a thing apart.',
  Shaping: 'Fire, frost, stone and storm: moving the world about.',
  Ending: 'Finishers and ultimates: saying the last word.',
};
/** The school a spell belongs to, from its tags and element. */
export function arcanaOf(s: Pick<SkillDef, 'tags' | 'element' | 'ultimate' | 'effects'>): Arcanum {
  const t = s.tags as readonly string[];
  if (s.ultimate || t.includes('Finisher')) return 'Ending';
  if (t.some((x) => ['Summon', 'Pet', 'Spirit', 'Totem'].includes(x))) return 'Calling';
  if (t.some((x) => ['Stealth', 'Movement'].includes(x)) || s.effects?.some((e) => e.kind === 'applyStatus' && e.status === 'stealth')) return 'Veiling';
  if (t.some((x) => ['Mark', 'Time', 'Sigil'].includes(x))) return 'Seeing';
  if (t.some((x) => ['Curse', 'Debuff', 'Pact'].includes(x))) return 'Binding';
  if (t.some((x) => ['Defensive', 'Heal', 'Buff'].includes(x))) return 'Warding';
  if (['void', 'shadow'].includes(s.element) || t.some((x) => ['DoT', 'Poison'].includes(x))) return 'Unmaking';
  return 'Shaping';
}
/** The Circle of a spell, 0 (a free Murmur) to 9 (an ultimate). */
export function circleOf(s: Pick<SkillDef, 'id' | 'ultimate' | 'damage' | 'heal' | 'cooldown' | 'cost' | 'tags'>): number {
  if (s.id.startsWith('g-murmur-')) return 0;
  if (s.ultimate) return 9;
  const power = s.damage ? s.damage.multiplier * (s.damage.hits ?? 1) : s.heal ? s.heal.multiplier : 1;
  const score = power * 1.6 + s.cooldown * 0.7 + (s.cost.mp ?? 0) / 8 + (s.cost.resource ? 1 : 0);
  return Math.max(1, Math.min(8, Math.floor(score)));
}

// ------------------------------------------------------------------ 204: Costly Reagents
/** Major spells that consume a rare reagent each cast (Tabletop Rules). */
export const REAGENTS: Record<string, { itemId: string; qty: number; name: string }> = {
  resurrection: { itemId: 'sun-pearl', qty: 1, name: 'Sun Pearl' },
};
export const SUN_PEARL = { id: 'sun-pearl', name: 'Sun Pearl', category: 'material', kind: 'divine', tier: 5, level: 1, value: 500, stack: 99, description: 'A pearl grown in a sunlit pool. Resurrection will not be cast without one.' } as const;

// ------------------------------------------------------------------ 202, 208: Rites
export interface RiteDef { id: string; name: string; minutes: number; text: string }
export const RITES: RiteDef[] = [
  { id: 'detect', name: 'Detect Magic', minutes: 30, text: 'Slow and quiet: +10% magic find for your next three battles.' },
  { id: 'commune', name: 'Commune', minutes: 60, text: 'An hour with your patron: +12 favor, once a day.' },
  { id: 'identify', name: 'Identify', minutes: 10, text: 'Study everything you carry: every unknown item is identified.' },
  { id: 'safe-camp', name: 'Safe Camp', minutes: 60, text: 'Ward the site: 15% HP and MP back and Well Rested for three battles.' },
  { id: 'find-familiar', name: 'Find Familiar', minutes: 60, text: 'Call an owl scout: it fights beside you for your next five battles and delivers a touch of healing.' },
];
export const OWL = {
  id: 'owl-familiar', name: 'Owl Familiar', family: 'beast', types: ['beast', 'summon', 'familiar'], stats: { hp: 35, attack: 4, magic: 6, defense: 3, magicResist: 6, speed: 15 }, ownerPowerShare: 0.5,
  skills: [{ id: 'mend' }], basicAttack: { element: 'physical', ranged: true, name: 'Talons' }, ai: 'support', palette: { main: '#8a7a5a', accent: '#e8d8a8' },
} as const;

// ------------------------------------------------------------------ 209: Between-Acts Downtime
export type Downtime = 'train' | 'craft' | 'carouse' | 'research' | 'business' | 'rumors';
export const DOWNTIME: { id: Downtime; name: string; perDayGold: number; text: string }[] = [
  { id: 'train', name: 'Training', perDayGold: 0, text: 'Drill with a master: each day is worth a tenth of a level in experience.' },
  { id: 'craft', name: 'Crafting', perDayGold: 0, text: 'Work at a bench: each day yields materials of your tier. Three days and 500 gold distil a Sun Pearl.' },
  { id: 'carouse', name: 'Carousing', perDayGold: 30, text: 'Spend 30 gold a day among the taverns; a CHA check may leave you Well Rested and in favor with the Regulars.' },
  { id: 'research', name: 'Research', perDayGold: 0, text: 'Libraries and old letters: an INT check turns a day into half a level of experience.' },
  { id: 'business', name: 'Running a Business', perDayGold: 0, text: 'Mind a stall: earn gold each day, more on a good roll.' },
  { id: 'rumors', name: 'Chasing Rumors', perDayGold: 10, text: 'Ask around for 10 gold a day; a WIS check turns up a find (an item and a little favor).' },
];
export const DOWNTIME_MAX_DAYS = 7;
