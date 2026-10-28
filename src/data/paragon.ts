import type { ModifierSpec } from '../engine/stats/modifiers';
import type { StatId } from '../engine/stats/types';
import type { DifficultyId } from './difficulty';
import { ELEMENTS } from '../engine/stats/types';

/**
 * Paragon board: after the level cap, each level grants one point to spend
 * here. Every node is a small, repeatable universal bonus.
 */
export type ParagonBoard = 'offense' | 'defense' | 'utility' | 'divine';
export const PARAGON_BOARDS: { id: ParagonBoard; name: string; blurb: string }[] = [
  { id: 'offense', name: 'Offense', blurb: 'Damage, criticals and the elements.' },
  { id: 'defense', name: 'Defense', blurb: 'Health, armor and resistances.' },
  { id: 'utility', name: 'Utility', blurb: 'Gold, experience, speed and cunning.' },
  { id: 'divine', name: 'Divine', blurb: 'Healing, blessings and favor.' },
];

export interface ParagonNodeDef {
  id: string;
  board: ParagonBoard;
  /** Points that must already be spent on this board before this node opens (deeper tiers). */
  gate: number;
  name: string;
  description: string;
  maxRank: number;
  /** Applied once per rank. */
  perRank: ModifierSpec[];
  /** Only heroes who swore their oath on this difficulty or higher can spend points here. */
  minDifficulty?: DifficultyId;
}

const CORE_NODES: ParagonNodeDef[] = [
  { id: 'might', board: 'offense', gate: 0, name: 'Might', description: '+1 STR per rank', maxRank: 50, perRank: [{ stat: 'str', type: 'flat', value: 1 }] },
  { id: 'finesse', board: 'offense', gate: 0, name: 'Finesse', description: '+1 DEX per rank', maxRank: 50, perRank: [{ stat: 'dex', type: 'flat', value: 1 }] },
  { id: 'intellect', board: 'offense', gate: 0, name: 'Intellect', description: '+1 INT per rank', maxRank: 50, perRank: [{ stat: 'int', type: 'flat', value: 1 }] },
  { id: 'fortitude', board: 'defense', gate: 0, name: 'Fortitude', description: '+1 VIT per rank', maxRank: 50, perRank: [{ stat: 'vit', type: 'flat', value: 1 }] },
  { id: 'insight', board: 'utility', gate: 0, name: 'Insight', description: '+1 WIS per rank', maxRank: 50, perRank: [{ stat: 'wis', type: 'flat', value: 1 }] },
  { id: 'fortune', board: 'utility', gate: 0, name: 'Fortune', description: '+1 LUK per rank', maxRank: 50, perRank: [{ stat: 'luk', type: 'flat', value: 1 }] },
  { id: 'devotion', board: 'divine', gate: 0, name: 'Devotion', description: '+1 FAI per rank', maxRank: 50, perRank: [{ stat: 'fai', type: 'flat', value: 1 }] },
  { id: 'vigor', board: 'defense', gate: 0, name: 'Vigor', description: '+1% max HP per rank', maxRank: 30, perRank: [{ stat: 'maxHp', type: 'percent', value: 1 }] },
  { id: 'precision', board: 'offense', gate: 0, name: 'Precision', description: '+0.2% crit chance per rank', maxRank: 25, perRank: [{ stat: 'critChance', type: 'flat', value: 0.2 }] },
  { id: 'swiftness', board: 'utility', gate: 0, name: 'Swiftness', description: '+1 speed per rank', maxRank: 10, perRank: [{ stat: 'speed', type: 'flat', value: 1 }] },
  { id: 'prosperity', board: 'utility', gate: 0, name: 'Prosperity', description: '+1% gold find per rank', maxRank: 50, perRank: [{ stat: 'goldFind', type: 'flat', value: 1 }] },
  { id: 'treasure-sense', board: 'utility', gate: 0, name: 'Treasure Sense', description: '+0.5% magic find per rank', maxRank: 50, perRank: [{ stat: 'magicFind', type: 'flat', value: 0.5 }] },
  {
    id: 'warding',
    board: 'defense',
    gate: 0,
    name: 'Warding',
    description: '+0.5% to all resistances per rank',
    maxRank: 40,
    perRank: ELEMENTS.map((e): ModifierSpec => ({ stat: `${e}Resist`, type: 'flat', value: 0.5 })),
  },
  // Difficulty-gated nodes: the harder the oath, the stronger the late-game options.
  { id: 'grit', board: 'defense', gate: 0, name: 'Grit', description: '-0.3% damage taken per rank. Hard or higher.', maxRank: 40, minDifficulty: 'hard', perRank: [{ stat: 'damageTaken', type: 'flat', value: -0.3 }] },
  { id: 'ferocity', board: 'offense', gate: 0, name: 'Ferocity', description: '+0.6% damage per rank. Hard or higher.', maxRank: 40, minDifficulty: 'hard', perRank: [{ stat: 'damageBonus', type: 'flat', value: 0.6 }] },
  { id: 'legend-lore', board: 'divine', gate: 0, name: 'Legend Lore', description: '+0.5% XP gain and +0.5% favor gain per rank. Legendary or higher.', maxRank: 40, minDifficulty: 'legendary', perRank: [{ stat: 'xpGain', type: 'flat', value: 0.5 }, { stat: 'favorGain', type: 'flat', value: 0.5 }] },
  { id: 'killing-edge', board: 'offense', gate: 0, name: 'Killing Edge', description: '+1% crit damage per rank. Legendary or higher.', maxRank: 40, minDifficulty: 'legendary', perRank: [{ stat: 'critDamage', type: 'flat', value: 1 }] },
  { id: 'defiance', board: 'defense', gate: 0, name: 'Defiance', description: '+0.1% lifesteal and -0.4% damage taken per rank. Impossible only.', maxRank: 25, minDifficulty: 'impossible', perRank: [{ stat: 'lifesteal', type: 'flat', value: 0.1 }, { stat: 'damageTaken', type: 'flat', value: -0.4 }] },
  { id: 'godslayer', board: 'offense', gate: 0, name: 'Godslayer', description: '+1.2% damage and +0.2% crit chance per rank. Impossible only.', maxRank: 25, minDifficulty: 'impossible', perRank: [{ stat: 'damageBonus', type: 'flat', value: 1.2 }, { stat: 'critChance', type: 'flat', value: 0.2 }] },
];

type Fam = [name: string, stat: StatId, type: 'flat' | 'percent', perRank: number, unit: string, extra?: [StatId, 'flat' | 'percent', number]];

/** Five tiers of every family: each deeper tier opens after more points on its board and is stronger per rank. */
const TIERS: { suffix: string; gate: number; mult: number }[] = [
  { suffix: 'I', gate: 0, mult: 1 },
  { suffix: 'II', gate: 15, mult: 1.5 },
  { suffix: 'III', gate: 40, mult: 2 },
  { suffix: 'IV', gate: 80, mult: 2.5 },
  { suffix: 'V', gate: 140, mult: 3 },
];

const FAMILIES: Record<ParagonBoard, Fam[]> = {
  offense: [
    ['Brawn', 'physicalAttack', 'percent', 0.4, '% physical attack'],
    ['Sorcery', 'magicAttack', 'percent', 0.4, '% magic attack'],
    ['Edge', 'critChance', 'flat', 0.15, '% crit chance'],
    ['Cruelty', 'critDamage', 'flat', 0.8, '% crit damage'],
    ['Pyre', 'fireDamage', 'flat', 0.6, '% fire damage'],
    ['Rime', 'iceDamage', 'flat', 0.6, '% ice damage'],
    ['Tempest', 'lightningDamage', 'flat', 0.6, '% lightning damage'],
    ['Umbra', 'shadowDamage', 'flat', 0.6, '% shadow damage'],
    ['Verdancy', 'natureDamage', 'flat', 0.6, '% nature damage'],
    ['Aim', 'accuracy', 'flat', 0.6, ' accuracy'],
    ['Breaker', 'shieldPierce', 'flat', 0.5, '% shield pierce'],
  ],
  defense: [
    ['Hardiness', 'maxHp', 'percent', 0.5, '% max HP'],
    ['Bulwark', 'defense', 'percent', 0.5, '% defense'],
    ['Aegis', 'magicResist', 'percent', 0.5, '% magic resist'],
    ['Evasion', 'dodge', 'flat', 0.3, ' dodge'],
    ['Recovery', 'hpRegen', 'flat', 0.8, ' HP regeneration'],
    ['Resolve', 'statusResist', 'flat', 0.8, '% status resist'],
    ['Ember Ward', 'fireResist', 'flat', 0.8, '% fire resist'],
    ['Frost Ward', 'iceResist', 'flat', 0.8, '% ice resist'],
    ['Storm Ward', 'lightningResist', 'flat', 0.8, '% lightning resist'],
    ['Gloom Ward', 'shadowResist', 'flat', 0.8, '% shadow resist'],
    ['Steadfast', 'damageTaken', 'flat', -0.15, '% damage taken'],
  ],
  utility: [
    ['Scholar', 'xpGain', 'flat', 0.4, '% XP'],
    ['Plunder', 'goldFind', 'flat', 0.8, '% gold find'],
    ['Delving', 'magicFind', 'flat', 0.4, '% magic find'],
    ['Tempo', 'cooldownReduction', 'flat', 0.3, '% cooldown reduction'],
    ['Wellspring', 'maxMp', 'percent', 0.5, '% max MP'],
    ['Flow', 'mpRegen', 'flat', 0.3, ' MP regeneration'],
    ['Fleet', 'speed', 'percent', 0.3, '% speed'],
    ['Haggler', 'barter', 'flat', 0.3, '% barter'],
    ['Silver Voice', 'cha', 'flat', 0.5, ' CHA'],
    ['Clover', 'luk', 'flat', 0.5, ' LUK'],
    ['Dexterity', 'dex', 'flat', 0.5, ' DEX'],
  ],
  divine: [
    ['Mercy', 'healingPower', 'flat', 0.8, '% healing power'],
    ['Radiance', 'divinePower', 'percent', 0.5, '% divine power'],
    ['Sanctity', 'holyResist', 'flat', 0.8, '% holy resist'],
    ['Blessing', 'blessingPower', 'flat', 0.8, '% blessing power'],
    ['Piety', 'favorGain', 'flat', 0.8, '% favor gain'],
    ['Smiting', 'holyDamage', 'flat', 0.6, '% holy damage'],
    ['Warded Soul', 'statusResist', 'flat', 0.6, '% status resist'],
    ['Succor', 'hpRegen', 'flat', 0.6, ' HP regeneration'],
    ['Void Ward', 'voidResist', 'flat', 0.8, '% void resist'],
    ['Faith', 'fai', 'flat', 0.5, ' FAI'],
    ['Grace', 'maxHp', 'percent', 0.4, '% max HP'],
    ['Zeal', 'damageBonus', 'flat', 0.3, '% damage'],
  ],
};

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmt = (n: number): string => String(Math.round(n * 100) / 100);

const GENERATED: ParagonNodeDef[] = (Object.keys(FAMILIES) as ParagonBoard[]).flatMap((board) =>
  FAMILIES[board].flatMap(([name, stat, type, base, unit]) =>
    TIERS.map((tier): ParagonNodeDef => {
      const per = Math.round(base * tier.mult * 100) / 100;
      return {
        id: `${board}-${slug(name)}-${tier.suffix.toLowerCase()}`,
        board,
        gate: tier.gate,
        name: `${name} ${tier.suffix}`,
        description: `${per > 0 ? '+' : ''}${fmt(per)}${unit} per rank.${tier.gate ? ` Opens after ${tier.gate} points on the ${board} board.` : ''}`,
        maxRank: 5,
        perRank: [{ stat, type, value: per }],
      };
    }),
  ),
);

/** Four boards of 60 nodes: the original nodes plus five tiers of every family, filled to 60. */
export const PARAGON_NODES: ParagonNodeDef[] = (() => {
  const out: ParagonNodeDef[] = [...CORE_NODES];
  for (const board of PARAGON_BOARDS.map((b) => b.id)) {
    const have = out.filter((n) => n.board === board).length;
    out.push(...GENERATED.filter((n) => n.board === board).slice(0, 60 - have));
  }
  return out;
})();
