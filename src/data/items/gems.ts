import type { GemDef } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';

const GRADES = [
  { name: 'Chipped', level: 1, mult: 1 },
  { name: 'Flawed', level: 12, mult: 2 },
  { name: 'Clear', level: 25, mult: 3 },
  { name: 'Flawless', level: 40, mult: 4.5 },
  { name: 'Perfect', level: 55, mult: 6.5 },
];

/** Each gem gives a different bonus depending on where it is socketed. */
interface GemProfile {
  type: string;
  name: string;
  weapon: [StatId, number];
  armor: [StatId, number];
  jewelry: [StatId, number];
}

const PROFILES: GemProfile[] = [
  { type: 'ruby', name: 'Ruby', weapon: ['fireDamage', 4], armor: ['maxHp', 12], jewelry: ['str', 2] },
  { type: 'sapphire', name: 'Sapphire', weapon: ['iceDamage', 4], armor: ['maxMp', 8], jewelry: ['int', 2] },
  { type: 'topaz', name: 'Topaz', weapon: ['lightningDamage', 4], armor: ['magicFind', 3], jewelry: ['dex', 2] },
  { type: 'emerald', name: 'Emerald', weapon: ['natureDamage', 4], armor: ['dodge', 0.8], jewelry: ['luk', 2] },
  { type: 'diamond', name: 'Diamond', weapon: ['holyDamage', 4], armor: ['magicResist', 3], jewelry: ['fai', 2] },
  { type: 'amethyst', name: 'Amethyst', weapon: ['shadowDamage', 4], armor: ['vit', 2], jewelry: ['wis', 2] },
  { type: 'onyx', name: 'Onyx', weapon: ['lifesteal', 0.8], armor: ['hpRegen', 2], jewelry: ['critDamage', 4] },
];

const mod = ([stat, value]: [StatId, number], mult: number): ModifierSpec[] => [
  { stat, type: 'flat', value: Math.round(value * mult * 10) / 10 },
];

export const GEMS: GemDef[] = PROFILES.flatMap((p) =>
  GRADES.map(
    (g, i): GemDef => ({
      id: `${p.type}-${i + 1}`,
      name: `${g.name} ${p.name}`,
      category: 'gem',
      gemType: p.type,
      grade: i + 1,
      level: g.level,
      value: Math.round(30 * Math.pow(3, i)),
      stack: 99,
      weapon: mod(p.weapon, g.mult),
      armor: mod(p.armor, g.mult),
      jewelry: mod(p.jewelry, g.mult),
    }),
  ),
);
