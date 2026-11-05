import type { SkillDef } from '../../engine/skills/types';
import type { SkillTreeDef } from '../../engine/skills/treeTypes';
import type { StatId } from '../../engine/stats/types';
import type { BranchSpec, MinorSpec, ModSpec, PassiveSpec, SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import { healPct, md, mn, pas, shieldPct } from './kit';

/**
 * Compact class-tree factory for the Tabletop Tradition classes (Section I). A branch is a table row:
 * its two skills, four theme stats and ten node names. The skill-modifier nodes and the stat
 * passives are generated from the skills and stats, so a class is its skills plus a few table lines.
 */
const PCT = new Set<string>(['maxHp', 'physicalAttack', 'magicAttack', 'defense', 'magicResist', 'divinePower']);
const LABEL: Record<string, string> = {
  str: 'STR', dex: 'DEX', int: 'INT', vit: 'VIT', wis: 'WIS', luk: 'LUK', fai: 'FAI', cha: 'CHA', maxHp: 'max HP', physicalAttack: 'physical attack',
  magicAttack: 'magic attack', defense: 'defense', magicResist: 'magic resist', divinePower: 'divine power', critChance: 'crit chance', dodge: 'dodge', speed: 'speed',
  accuracy: 'accuracy', statusResist: 'status resist', statusChance: 'status chance', damageBonus: 'damage', cooldownReduction: 'cooldown reduction', resourceGain: 'resource gain',
  goldFind: 'gold found', magicFind: 'magic find', healingPower: 'healing power', lifesteal: 'lifesteal', hpRegen: 'HP regen', ultimateGain: 'ultimate gain',
  fireDamage: 'fire damage', iceDamage: 'ice damage', lightningDamage: 'lightning damage', natureDamage: 'nature damage', holyDamage: 'holy damage', shadowDamage: 'shadow damage',
  arcaneDamage: 'arcane damage', voidDamage: 'void damage', earthDamage: 'earth damage', physicalDamage: 'physical damage', blessingPower: 'blessing power', xpGain: 'XP',
};
const ATTR = new Set<string>(['str', 'dex', 'int', 'vit', 'wis', 'luk', 'fai', 'cha']);

const label = (s: string): string => LABEL[s] ?? s;
/** One stat change as a passive: +n percent for percent stats, +n flat otherwise. */
const line = (s: StatId, n: number): string => `${n < 0 ? '' : '+'}${n}${ATTR.has(s) || s === 'speed' || s === 'accuracy' ? '' : '%'} ${label(s)}`;
const pasOf = (name: string, mods: [StatId, number][], extra?: string): PassiveSpec =>
  pas(name, `${mods.map(([s, n]) => line(s, n)).join(', ')}.${extra ? ` ${extra}` : ''}`, mods.map(([s, n]) => [s, n, PCT.has(s) ? 'p' : 'f'] as [StatId, number, 'p' | 'f']));
const minorOf = (name: string, s: StatId): MinorSpec => mn(name, s, ATTR.has(s) ? 2 : PCT.has(s) ? 3 : s === 'critChance' || s === 'dodge' || s === 'speed' || s === 'accuracy' ? 2 : 3, PCT.has(s) ? 'p' : 'f');

/** Two skill-modifier nodes for a skill, picked from what the skill actually has. */
export function modsFor(sk: SkillDef): [ModSpec, ModSpec] {
  const n = sk.name;
  const cost = sk.cost?.resource;
  const power = sk.damage || sk.heal;
  const first = power ? md(`Heavier ${n}`, `${n} hits 20% harder.`, { powerMult: 1.2 }) : md(`Mended ${n}`, `${n} also heals 6%.`, { addEffects: [healPct(6)] });
  const second = cost
    ? md(`Frugal ${n}`, `${n} costs 25% less.`, { costMult: 0.75 })
    : sk.cooldown >= 2
      ? md(`Quicker ${n}`, `${n} recovers a turn sooner.`, { cooldownDelta: -1 })
      : md(`Guarded ${n}`, `${n} also shields you for 6% max HP.`, { addEffects: [shieldPct(6)] });
  return [first, second];
}

export interface BranchLite {
  id: string;
  name: string;
  color: string;
  desc: string;
  a: string;
  b: string;
  /** Four theme stats: minors use all four, passives the first four in order. */
  stats: [StatId, StatId, StatId, StatId];
  /** Ten names: four minors, two notables, two choices, keystone, capstone. */
  names: string[];
}

export interface SpecLite {
  id: string;
  name: string;
  color: string;
  desc: string;
  skill: string;
  ult: string;
  stats: [StatId, StatId, StatId];
  /** Eight names: three minors, two notables, two choices, capstone. */
  names: string[];
}

export function liteBranch(skills: SkillDef[], l: BranchLite, firstStarts = true): BranchSpec {
  const find = (id: string): SkillDef => {
    const s = skills.find((x) => x.id === id);
    if (!s) throw new Error(`tabletop: unknown skill ${id}`);
    return s;
  };
  const [s0, s1, s2, s3] = l.stats;
  const N = l.names;
  return {
    id: l.id, name: l.name, color: l.color, description: l.desc,
    a: { skill: l.a, ...(firstStarts ? { starting: true } : {}) },
    aMods: modsFor(find(l.a)),
    b: { skill: l.b },
    bMods: modsFor(find(l.b)),
    minors: [minorOf(N[0] as string, s0), minorOf(N[1] as string, s1), minorOf(N[2] as string, s2), minorOf(N[3] as string, s3)],
    notables: [pasOf(N[4] as string, [[s0, 8]]), pasOf(N[5] as string, [[s1, 8]])],
    choice: [pasOf(N[6] as string, [[s2, 8]]), pasOf(N[7] as string, [[s3, 8]])],
    keystone: pasOf(N[8] as string, [['damageBonus', 20], ['defense', -10]]),
    capstone: pasOf(N[9] as string, [[s0, 12], [s1, 8]]),
  };
}

export function liteSpec(skills: SkillDef[], l: SpecLite): SpecBranchSpec {
  const sk = skills.find((x) => x.id === l.skill);
  if (!sk) throw new Error(`tabletop: unknown spec skill ${l.skill}`);
  const [s0, s1, s2] = l.stats;
  const N = l.names;
  return {
    id: l.id, name: l.name, color: l.color, description: l.desc, ultimate: l.ult, skill: l.skill,
    mods: modsFor(sk),
    minors: [minorOf(N[0] as string, s0), minorOf(N[1] as string, s1), minorOf(N[2] as string, s2)],
    notables: [pasOf(N[3] as string, [[s0, 8]]), pasOf(N[4] as string, [[s1, 8]])],
    choice: [pasOf(N[5] as string, [[s2, 10]]), pasOf(N[6] as string, [['damageBonus', 8]])],
    capstone: pasOf(N[7] as string, [[s0, 15], [s1, 10]]),
  };
}

export function liteTree(classId: string, skills: SkillDef[], branches: BranchLite[]): SkillTreeDef {
  return buildTree(classId, branches.map((b) => liteBranch(skills, b)));
}
export const liteSpecs = (skills: SkillDef[], specs: SpecLite[]): SpecBranchSpec[] => specs.map((s) => liteSpec(skills, s));

// ---------------------------------------------------------------- shared class boilerplate

import type { EnemyDef } from '../../engine/combat/types';
import type { StartingKitItem } from '../items/loot';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import { MENTOR_BASE } from './mentorBase';

/** The standard Greater-class trait: tanky, hard-hitting, plus a few class bonuses. */
export function traitOf(name: string, extra: [string, number][], text: string): { name: string; description: string; modifiers: ModifierSpec[] } {
  return {
    name,
    description: `95% more max HP, 30% less damage taken, 35% more physical attack, +40% damage${text ? `, ${text}` : ''}.`,
    modifiers: [
      { stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'physicalAttack', type: 'more', value: 35 }, { stat: 'damageBonus', type: 'flat', value: 40 },
      ...extra.map(([stat, value]) => ({ stat, type: 'flat', value }) as ModifierSpec),
    ],
  };
}

export function mentorOf(id: string, name: string, desc: string, basic: string, palette: [string, string], skills: string[], element: 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'arcane' = 'physical'): EnemyDef {
  return {
    ...MENTOR_BASE, id, name, row: 'front', stats: { hp: 70, attack: 17, magic: 8, defense: 8, magicResist: 7, speed: 11, dodge: 8, critChance: 8 },
    skills: skills.map((s, i) => ({ id: s, ...(i === 0 ? { weight: 2 } : {}) })), basicAttack: { element, ranged: false, name: basic }, description: desc, palette: { main: palette[0], accent: palette[1] },
  };
}

export const kitOf = (weapon: string, body: string, boots: string, extra: StartingKitItem[] = []): StartingKitItem[] => [
  { itemId: weapon, equip: true }, ...extra, { itemId: body, equip: true }, { itemId: boots, equip: true },
  { itemId: 'health-potion-minor', qty: 3 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 2 },
];

/** A 12x12 emblem from a small seed: a ring, a cross, a diamond or a flame. */
const EMBLEMS: Record<string, string[]> = {
  cross: ['.....rr.....', '.....rr.....', '.....rr.....', '..rrrRRrrr..', '..rrrRRrrr..', '.....rr.....', '.....rr.....', '.....rr.....', '.....rr.....', '............', '............', '............'],
  flame: ['.....r......', '....rr......', '....rRr.....', '...rRRr.....', '...rRRRr....', '..rRRRRr....', '..rRRRRRr...', '..rRRRRRr...', '...rRRRr....', '....rrr.....', '............', '............'],
  diamond: ['.....rr.....', '....rRRr....', '...rRRRRr...', '..rRRRRRRr..', '...rRRRRr...', '....rRRr....', '.....rr.....', '............', '............', '............', '............', '............'],
  ring: ['....rrrr....', '...rRRRRr...', '..rR....Rr..', '..rR....Rr..', '..rR....Rr..', '..rR....Rr..', '...rRRRRr...', '....rrrr....', '............', '............', '............', '............'],
  wave: ['............', '..rr....rr..', '.rRRr..rRRr.', 'rR..rrrR..Rr', '............', '..rr....rr..', '.rRRr..rRRr.', 'rR..rrrR..Rr', '............', '............', '............', '............'],
};
export const emblem = (kind: keyof typeof EMBLEMS, dark: string, light: string): { rows: string[]; colors: Record<string, string> } => ({ rows: EMBLEMS[kind] as string[], colors: { r: dark, R: light } });
