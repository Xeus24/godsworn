import type { EffectSpec } from '../engine/effects/types';
import type { QuestDef } from '../engine/quests/types';
import type { SkillDef } from '../engine/skills/types';
import type { BranchDef, TreeNodeDef } from '../engine/skills/treeTypes';
import type { ModifierSpec } from '../engine/stats/modifiers';
import type { Element } from '../engine/stats/types';
import { foes, type FoeRow } from './regions/foes';
import { all } from './story/helpers';
import { kill, stage } from './story/helpers';

/**
 * Section K: Class Promotions. Every class promotes twice: Tier 2 at class level 30 and Tier 3 at class level 60. A promotion is a
 * trial fight, a new title, a stat boost, two new skills and a 10-node tree branch. Everything below is generated from one table
 * (the title pair, the element and the attack stat of each class); the rules live in `engine/state/promotionActions.ts`.
 */

type Atk = 'p' | 'm' | 'd';
/** [class, Tier 2 title, Tier 3 title, element, attack stat] */
type Row = [classId: string, t2: string, t3: string, element: Element, atk: Atk];
// prettier-ignore
const ROWS: Row[] = [
  ['warrior', 'Warlord', 'Champion of Vael', 'physical', 'p'], ['mage', 'Archmage', 'Arcane Sovereign', 'arcane', 'm'], ['rogue', 'Shadowmaster', 'Nightsovereign', 'shadow', 'p'],
  ['cleric', 'Bishop', 'Living Saint', 'holy', 'd'], ['ranger', 'Warden-Captain', 'Huntsman Eternal', 'nature', 'p'], ['necromancer', 'Lich-Adept', 'Deathlord', 'shadow', 'm'],
  ['monk', 'Grand Adept', 'Ascended Fist', 'physical', 'p'], ['bard', 'Maestro', 'Voice of Legends', 'arcane', 'm'], ['knight', 'Knight-Captain', 'High Paladin of the Wheel', 'holy', 'p'],
  ['druid', 'Archdruid', 'Wildlord', 'nature', 'm'], ['warlock', 'Pactmaster', 'Archfiend-Bound', 'shadow', 'm'], ['summoner', 'Spirit Lord', 'Sovereign of Pacts', 'arcane', 'm'],
  ['alchemist', 'Master Alchemist', 'Philosopher Supreme', 'fire', 'm'], ['shaman', 'Elder Shaman', 'Ancestor-Voice', 'lightning', 'm'], ['chronomancer', 'Timelord', 'Eternal', 'arcane', 'm'],
  ['artificer', 'Master Artificer', 'Grand Machinist', 'fire', 'p'], ['dancer', 'Prima', 'Dance of Ages', 'physical', 'p'], ['inkweaver', 'Scrivener-Mage', 'Living Legend', 'arcane', 'm'],
  ['witchhunter', 'Inquisitor', 'Hammer of the Gods', 'holy', 'p'], ['geomancer', 'Earthshaper', 'Worldheart', 'earth', 'm'], ['vowknight', 'Oathlord', 'Sworn Eternal', 'holy', 'p'],
  ['wrathsworn', 'Berserker Chief', 'Wrath Incarnate', 'physical', 'p'], ['stillhand', 'Grandmaster', 'Enlightened One', 'physical', 'p'], ['wayfinder', 'Pathmaster', 'Warden of the Wilds', 'nature', 'p'],
  ['godblooded', 'Demigod-Born', 'Divine Scion', 'lightning', 'm'], ['ichorbound', 'Ichor Lord', 'Godblood Hunter', 'shadow', 'p'], ['fatedealer', 'High Roller', 'Hand of Fate', 'arcane', 'm'],
  ['mindwright', 'Mindlord', 'Overmind', 'arcane', 'm'], ['marshal', 'General', 'Lord Commander', 'physical', 'p'], ['corsair', 'Captain', 'Admiral of the Shattered Seas', 'physical', 'p'],
  ['brawler', 'Pit Champion', 'Undisputed', 'physical', 'p'], ['whisperknight', 'Hushlord', 'Voice Unheard', 'shadow', 'p'], ['hearthmaster', 'Master Cook', 'Heart of the Hearth', 'fire', 'm'],
  ['truthseeker', 'Chief Inspector', 'Oracle of the Plain Truth', 'arcane', 'p'], ['hedgewitch', 'Hedge Crone', 'Mother of the Wild Lane', 'nature', 'm'], ['soulblade', 'Blademaster', 'Edge Eternal', 'shadow', 'p'],
  ['facewright', 'Mask-Master', 'Face of Faces', 'shadow', 'p'], ['bellwarden', 'Bell-Captain', 'Great Bell Incarnate', 'holy', 'm'], ['hemomancer', 'Bloodlord', 'Crimson Sovereign', 'shadow', 'm'],
  ['hollowhand', 'Phantom Thief', 'Master of Nothing', 'shadow', 'p'], ['dreamwalker', 'Dreamlord', 'Sovereign of Sleep', 'arcane', 'm'], ['dragonsoul', 'Wyrm-Touched', 'Dragon Ascendant', 'fire', 'm'],
  ['puppeteer', 'Stringmaster', 'Hand of the Stage', 'shadow', 'm'], ['hollowking', 'Hollow Lord', 'King of Nothing', 'shadow', 'p'], ['oathbreaker', 'Forsworn Lord', 'Breaker of Heavens', 'shadow', 'p'],
  ['godslayer', 'Giant-Killer', 'Deicide Eternal', 'physical', 'p'], ['voidwalker', 'Rift-Lord', 'Void Sovereign', 'void', 'm'], ['celestial', 'Archangel', 'Star-Crowned', 'holy', 'd'],
];

export const PROMOTION = { levels: { 2: 30, 3: 60 } as Record<number, number>, branchGate: 3, tierNames: { 2: 'Tier 2', 3: 'Tier 3' } as Record<number, string> } as const;

export interface PromotionDef {
  id: string;
  classId: string;
  tier: 2 | 3;
  title: string;
  level: number;
  element: Element;
  atk: Atk;
  skills: [string, string];
  quest: string;
  enemy: string;
  boon: ModifierSpec[];
  branch: string;
}

const ATK_STAT = { p: 'physicalAttack', m: 'magicAttack', d: 'divinePower' } as const;
const ATK_SCALE = { p: 'physicalAttack', m: 'magicAttack', d: 'divinePower' } as const;
const m = (stat: string, value: number, type: 'flat' | 'percent' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

export const PROMOTIONS: PromotionDef[] = ROWS.flatMap(([classId, t2, t3, element, atk]) =>
  ([[2, t2], [3, t3]] as [2 | 3, string][]).map(([tier, title]): PromotionDef => ({
    id: `${classId}:${tier}`, classId, tier, title, level: PROMOTION.levels[tier] as number, element, atk,
    skills: [`promo-${classId}-${tier}-a`, `promo-${classId}-${tier}-b`],
    quest: `promo-${classId}-${tier}`, enemy: `promo-${classId}-${tier}`, branch: `${classId}.promo${tier}`,
    boon: tier === 2
      ? [m('maxHp', 6, 'percent'), m(ATK_STAT[atk], 4, 'percent')]
      : [m('maxHp', 8, 'percent'), m(ATK_STAT[atk], 6, 'percent'), m('damageBonus', 4)],
  })),
);
export const promotionOf = (classId: string, tier: number): PromotionDef | undefined => PROMOTIONS.find((p) => p.classId === classId && p.tier === tier);

// ------------------------------------------------------------------ skills

const STATUS: Record<string, string> = { physical: 'bleed', fire: 'burn', ice: 'freeze', lightning: 'slow', nature: 'poison', holy: 'blind', shadow: 'weaken', arcane: 'vulnerable', void: 'weaken', earth: 'slow' };
const ATTACK_WORDS = ['Verdict', 'Onslaught', 'Decree', 'Strike', 'Reckoning', 'Judgment'];
const SUPPORT_WORDS = ['Rally', 'Mantle', 'Bulwark', 'Blessing', 'Standard', 'Aegis'];
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);
const spin = (s: string): number => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
const possessive = (t: string): string => (t.endsWith('s') ? `${t}’` : `${t}’s`);

const skillsOf = (p: PromotionDef): SkillDef[] => {
  const t3 = p.tier === 3;
  const status: EffectSpec = { kind: 'applyStatus', status: STATUS[p.element] ?? 'weaken', duration: 2, chance: 50 };
  const strike: SkillDef = {
    id: p.skills[0], name: `${possessive(p.title)} ${ATTACK_WORDS[spin(p.id) % ATTACK_WORDS.length]}`, source: 'class', maxRank: 5,
    description: `A ${t3 ? 'crowning' : 'master'} stroke: ${t3 ? 260 : 200}% ${p.element} damage, with a 50% chance of ${STATUS[p.element]}.`,
    tags: ['Attack', p.atk === 'p' ? 'Melee' : 'Spell', cap(p.element) as never], element: p.element, targeting: 'enemy',
    cost: { mp: t3 ? 20 : 14 }, cooldown: 2, damage: { stat: ATK_SCALE[p.atk], multiplier: t3 ? 2.6 : 2, perRank: t3 ? 0.18 : 0.14 }, effects: [status],
  };
  const dmg = t3 ? 22 : 15;
  const second: SkillDef = {
    id: p.skills[1], name: `${possessive(p.title)} ${SUPPORT_WORDS[spin(p.id + 'b') % SUPPORT_WORDS.length]}`, source: 'class', maxRank: 5,
    description: `The whole party gains +${dmg}% damage and +${t3 ? 15 : 10}% defense for 3 turns, and you shield yourself for ${t3 ? 12 : 8}% of max HP.`,
    tags: ['Buff', 'AoE', cap(p.element) as never], element: p.element, targeting: 'allAllies', cost: { mp: t3 ? 24 : 18 }, cooldown: 5,
    effects: [
      { kind: 'buff', id: `${p.skills[1]}-buff`, duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: dmg }, { stat: 'defense', type: 'percent', value: t3 ? 15 : 10 }], target: 'allAllies' } as EffectSpec,
      { kind: 'shield', percentMaxHp: t3 ? 12 : 8, target: 'self' } as EffectSpec,
    ],
  };
  return [strike, second];
};
export const PROMOTION_SKILLS: SkillDef[] = PROMOTIONS.flatMap(skillsOf);

// ------------------------------------------------------------------ the 10-node branch

const LANE_W = 110;
const BRANCH_W = 4 * LANE_W + 80;
const TIER_H = 130;
type Slot = { key: string; kind: TreeNodeDef['kind']; tier: number; lane: number; parents?: string[] };
const SLOTS: Slot[] = [
  { key: 'a', kind: 'active', tier: 1, lane: 1 },
  { key: 'b', kind: 'active', tier: 1, lane: 2 },
  { key: 'm1', kind: 'minor', tier: 2, lane: 0, parents: ['a'] },
  { key: 'm2', kind: 'minor', tier: 2, lane: 1, parents: ['a', 'b'] },
  { key: 'm3', kind: 'minor', tier: 2, lane: 3, parents: ['b'] },
  { key: 'n1', kind: 'notable', tier: 3, lane: 1, parents: ['m1', 'm2'] },
  { key: 'n2', kind: 'notable', tier: 3, lane: 2, parents: ['m2', 'm3'] },
  { key: 'm4', kind: 'minor', tier: 4, lane: 1, parents: ['n1', 'n2'] },
  { key: 'k', kind: 'keystone', tier: 4, lane: 2, parents: ['n1', 'n2'] },
  { key: 'cap', kind: 'capstone', tier: 5, lane: 1, parents: ['m4', 'k'] },
];

/** The branch's definition, for the class's tree. */
export const promotionBranch = (p: PromotionDef): BranchDef => ({
  id: p.branch, classId: p.classId, name: `${p.title} (${PROMOTION.tierNames[p.tier]})`, color: p.tier === 2 ? '#c8a84a' : '#e8d070',
  description: `The ${p.title} promotion: two new skills and the powers that come with the title.`, tierGate: PROMOTION.branchGate, promotion: p.tier,
});

/** Its ten nodes, in the column after the class's own branches and specializations (`column`). */
export function promotionNodes(p: PromotionDef, column: number): TreeNodeDef[] {
  const id = (k: string): string => `${p.classId}.${p.branch.split('.')[1]}.${k}`;
  const atk = ATK_STAT[p.atk];
  const el = `${p.element}Damage`;
  const t = p.tier;
  const who = possessive(p.title);
  const minor = (name: string, mods: ModifierSpec[]): Partial<TreeNodeDef> => ({ name, maxRank: 3, modifiers: mods });
  const pass = (name: string, text: string, mods: ModifierSpec[]): Partial<TreeNodeDef> => ({ name, maxRank: 1, text, modifiers: mods });
  const body: Record<string, Partial<TreeNodeDef>> = {
    a: { name: p.skills[0], skill: p.skills[0], maxRank: 5 },
    b: { name: p.skills[1], skill: p.skills[1], maxRank: 5 },
    m1: minor(`${who} Might`, [m(atk, 3 * t - 3)]),
    m2: minor(`${who} Vigor`, [m('maxHp', 2 + t, 'percent')]),
    m3: minor(`${who} Edge`, [m(el, 2 * t)]),
    n1: pass(`${who} Command`, `+${6 * t}% ${p.element} damage.`, [m(el, 6 * t)]),
    n2: pass(`${who} Poise`, `+${2 * t}% damage and +${3 * t}% defense.`, [m('damageBonus', 2 * t), m('defense', 3 * t, 'percent')]),
    m4: minor(`${who} Resolve`, [m('statusResist', 3 * t - 2)]),
    k: pass(`${who} Gamble`, `Keystone: +${10 + 5 * t}% damage, -10% max HP.`, [m('damageBonus', 10 + 5 * t), m('maxHp', -10, 'percent')]),
    cap: pass(p.title, `+${5 * t}% ${p.atk === 'p' ? 'attack' : 'magic power'} and +${2 * t}% damage.`, [m(atk, 5 * t, 'percent'), m('damageBonus', 2 * t)]),
  };
  return SLOTS.map((s): TreeNodeDef => ({
    id: id(s.key), classId: p.classId, branch: p.branch, kind: s.kind, tier: s.tier, lane: s.lane, parents: (s.parents ?? []).map(id),
    x: column * BRANCH_W + 60 + s.lane * LANE_W, y: 70 + (s.tier - 1) * TIER_H,
    name: '', maxRank: 1, ...body[s.key],
  } as TreeNodeDef));
}

// ------------------------------------------------------------------ trial foes and quests

const role = (a: Atk): 'brute' | 'caster' => (a === 'p' ? 'brute' : 'caster');
const shade = (p: PromotionDef): FoeRow => [
  p.enemy, `Shade of the ${p.title}`, 'humanoid', ['humanoid', 'trial'], p.level, role(p.atk), p.element,
  p.atk === 'p' ? ['cleave', 'war-cry', ...(p.tier === 3 ? ['boss-enrage'] : [])] : ['crystal-shard', 'doom-mark', ...(p.tier === 3 ? ['boss-enrage'] : [])],
  'Mirrored Mastery', `Everything you could become, standing in your way.`, '#8a7a5a', '#f0e0a0',
];
export const PROMOTION_ENEMIES = [...foes(PROMOTIONS.filter((p) => p.tier === 2).map(shade), 'elite'), ...foes(PROMOTIONS.filter((p) => p.tier === 3).map(shade), 'elite')];

/** One quest per promotion: it opens at the class level, and is finished by beating the Shade (from the class's Promotion panel). */
export const PROMOTION_QUESTS: QuestDef[] = PROMOTIONS.map((p) => ({
  id: p.quest, name: `Trial of the ${p.title}`, kind: 'promotion', level: p.level, auto: true,
  requires: all({ kind: 'class', classId: p.classId }, { kind: 'level', min: p.level }),
  summary: `Prove yourself worthy of the title ${p.title}: beat your own Shade in the Promotion panel on the Character screen.`,
  stages: [stage('s', `Beat the Shade of the ${p.title}.`, [kill('k', `Beat the Shade of the ${p.title}`, 1, { enemyId: p.enemy })])],
  rewards: { xp: p.tier === 2 ? 0.6 : 1, gold: p.level * 10 },
  epilogue: `You are ${p.title}.`,
} satisfies QuestDef));
