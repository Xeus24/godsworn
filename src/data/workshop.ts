import type { ModifierSpec } from '../engine/stats/modifiers';

/** Kits (Section I-7c, item 219) and Hirelings (item 220). Compact tables; the rules live in `engine/state/workshopActions.ts`. */

// ------------------------------------------------------------------ 219: Kits
export interface KitDef {
  id: string;
  name: string;
  /** The stat that makes the kit's check. */
  stat: 'str' | 'dex' | 'int' | 'vit' | 'wis' | 'cha';
  price: number;
  /** What a proficient owner gains while carrying it. */
  mods: ModifierSpec[];
  passive: string;
  /** What a day's work with it makes: an item, or gold per level. */
  makes: { itemId: string; name: string } | { gold: number; name: string };
  text: string;
}
const m = (stat: string, value: number, type: 'flat' | 'percent' = 'flat'): ModifierSpec => ({ stat, type, value }) as ModifierSpec;
// prettier-ignore
export const KITS: KitDef[] = [
  { id: 'thieves', name: 'Thieves’ Kit', stat: 'dex', price: 120, mods: [m('dodge', 2)], passive: '+2% dodge', makes: { gold: 14, name: 'a purse worth of loose coin' }, text: 'Picks, wire and a hooked file. Work the back doors of town for loose coin.' },
  { id: 'herbalist', name: 'Herbalist’s Kit', stat: 'wis', price: 100, mods: [m('hpRegen', 1)], passive: '+1 HP regeneration', makes: { itemId: 'health-potion-minor', name: 'a health potion' }, text: 'Shears, jars and a very patient attitude. Brew a health potion.' },
  { id: 'forger', name: 'Forger’s Kit', stat: 'int', price: 160, mods: [m('goldFind', 4)], passive: '+4% gold found', makes: { gold: 18, name: 'a convincing receipt' }, text: 'Seals, inks and fine pens. Everything it makes is, technically, a copy.' },
  { id: 'navigator', name: 'Navigator’s Kit', stat: 'wis', price: 130, mods: [m('speed', 3, 'percent')], passive: '+3% speed', makes: { itemId: 'scroll-of-escape', name: 'a scroll of escape' }, text: 'A sextant, a compass and a chart with someone else’s notes. Mark a scroll of escape.' },
  { id: 'disguise', name: 'Disguise Kit', stat: 'cha', price: 140, mods: [m('statusResist', 3)], passive: '+3% status resist', makes: { gold: 16, name: 'coin from a borrowed face' }, text: 'Paints, wigs and a surprisingly good beard. Pass for someone richer.' },
  { id: 'alchemist', name: 'Alchemist’s Kit', stat: 'int', price: 150, mods: [m('maxMp', 4, 'percent')], passive: '+4% max MP', makes: { itemId: 'mana-potion-minor', name: 'a mana potion' }, text: 'Glass, flame and a good deal of regret. Distil a mana potion.' },
  { id: 'cook', name: 'Cook’s Kit', stat: 'vit', price: 90, mods: [m('maxHp', 3, 'percent')], passive: '+3% max HP', makes: { itemId: 'hearty-stew', name: 'a hearty stew' }, text: 'One good pot and a spoon with a history. Simmer a hearty stew.' },
  { id: 'smith', name: 'Smith’s Tools', stat: 'str', price: 140, mods: [m('defense', 3, 'percent')], passive: '+3% defense', makes: { itemId: 'oil-flask', name: 'a flask of oil' }, text: 'Tongs, a small hammer and a stool. Pour a flask of oil.' },
  { id: 'calligrapher', name: 'Calligrapher’s Kit', stat: 'int', price: 110, mods: [m('xpGain', 3)], passive: '+3% XP', makes: { itemId: 'scroll-of-identify', name: 'a scroll of identify' }, text: 'Nibs, vellum and a ruler that cannot be trusted. Copy a scroll of identify.' },
  { id: 'tinker', name: 'Tinker’s Tools', stat: 'dex', price: 170, mods: [m('accuracy', 3)], passive: '+3 accuracy', makes: { itemId: 'fire-bomb', name: 'a fire bomb' }, text: 'Springs, wire and good hands. Assemble a fire bomb (carefully).' },
  { id: 'brewer', name: 'Brewer’s Kit', stat: 'vit', price: 130, mods: [m('statusResist', 2), m('maxHp', 2, 'percent')], passive: '+2% status resist, +2% max HP', makes: { itemId: 'elixir-of-iron', name: 'an elixir of iron' }, text: 'A copper kettle and a crock of something that is alive. Brew an elixir of iron.' },
  { id: 'jeweler', name: 'Jeweler’s Kit', stat: 'cha', price: 180, mods: [m('magicFind', 4)], passive: '+4% magic find', makes: { gold: 22, name: 'a reset stone' }, text: 'Loupe, pliers and a bright light. Reset a stone for coin.' },
];
/** Proficiencies each base class starts with (everyone else starts with the Herbalist’s and Cook’s Kits). */
export const CLASS_KITS: Record<string, string[]> = {
  warrior: ['smith', 'cook'], mage: ['alchemist', 'calligrapher'], rogue: ['thieves', 'disguise'], cleric: ['herbalist', 'calligrapher'],
  ranger: ['herbalist', 'navigator'], necromancer: ['alchemist', 'forger'], monk: ['brewer', 'herbalist'], bard: ['disguise', 'jeweler'],
};
export const DEFAULT_KITS = ['herbalist', 'cook'];
export const KIT_TRAIN_PRICE = 150;
export const KIT_DC = 11;

// ------------------------------------------------------------------ 220: Hirelings
export interface HirelingDef {
  id: string;
  name: string;
  hire: number;
  /** Per level: modifiers (value is multiplied by the level) and the wage grows with it. */
  perLevel: ModifierSpec[];
  perk: string;
  text: string;
}
// prettier-ignore
export const HIRELINGS: HirelingDef[] = [
  { id: 'porter', name: 'Porter', hire: 120, perLevel: [m('goldFind', 2)], perk: '+2% gold found a level', text: 'Carries the sacks and counts the coins twice.' },
  { id: 'guard', name: 'Guard', hire: 160, perLevel: [m('defense', 1.5, 'percent'), m('maxHp', 1, 'percent')], perk: '+1.5% defense, +1% max HP a level', text: 'Walks one pace behind with a spear.' },
  { id: 'guide', name: 'Guide', hire: 150, perLevel: [m('speed', 1, 'percent')], perk: '+1% speed a level, and the road wears you down more slowly', text: 'Knows the short way and the better way.' },
  { id: 'scholar', name: 'Scholar', hire: 170, perLevel: [m('xpGain', 1), m('magicFind', 1)], perk: '+1% XP and magic find a level', text: 'Reads aloud to you from the wrong book.' },
  { id: 'cook', name: 'Cook', hire: 110, perLevel: [m('hpRegen', 0.3), m('maxHp', 1, 'percent')], perk: '+0.3 HP regeneration, +1% max HP a level', text: 'Complains about the stew while making it better.' },
  { id: 'scout', name: 'Scout', hire: 140, perLevel: [m('dodge', 0.8), m('accuracy', 0.8)], perk: '+0.8 dodge and accuracy a level', text: 'Goes ahead, comes back, and says nothing about what they saw.' },
];
export const HIRELING = { maxLevel: 10, xpPerLevel: 5, wageBase: 5, wagePerLevel: 3, moraleStart: 70, moraleWin: 4, moraleLoss: 12, moraleUnpaid: 25, moraleLow: 40, guideMarch: 0.5 };
