import type { EncounterDef, EnemyDef } from '../../engine/combat/types';
import type { ApostleDef, EdictDef } from '../../engine/gods/types';
import type { UniqueItemDef } from '../../engine/items/types';
import type { SkillDef } from '../../engine/skills/types';
import type { SkillTreeDef } from '../../engine/skills/treeTypes';
import { GODS } from '../gods';
import { PANTHEON } from '../pantheon';
import { buildApostleTree } from '../trees/builder';
import { APOSTLES_A } from './apostlesA';
import { APOSTLES_B } from './apostlesB';

const CONTENT = [...APOSTLES_A, ...APOSTLES_B];
const godOf = (id: string) => GODS.find((g) => g.id === id) as (typeof GODS)[number];

export const APOSTLES: ApostleDef[] = CONTENT.map((a) => ({ god: a.god, avatar: a.avatar.id, weapon: a.weapon }));
export const APOSTLE_SKILLS: SkillDef[] = CONTENT.flatMap((a) => [...a.skills, a.avatar]);
export const APOSTLE_BLESSINGS = CONTENT.map((a) => a.blessing);
/** Apostle trees (id `apostle-<god>`); active node names are filled in by finalizeTrees. */
export const APOSTLE_TREES: SkillTreeDef[] = CONTENT.map((a) => buildApostleTree(godOf(a.god), a.tree));

/** Divine weapon stages: base tier and the character level that evolves it. */
export const WEAPON_STAGES = [
  { tier: 3, level: 1 },
  { tier: 4, level: 30 },
  { tier: 5, level: 45 },
  { tier: 6, level: 60 },
] as const;

/**
 * Each Apostle's god-bound weapon, one unique per evolution stage
 * (`divine-weapon-<god>-<stage>`). It grows in element damage, favored
 * stat and Divine Power, and from stage 3 strikes with its god's element.
 */
export const DIVINE_WEAPONS: UniqueItemDef[] = CONTENT.flatMap((a) => {
  const god = godOf(a.god);
  const stat = god.favoredStats[0] ?? 'fai';
  return WEAPON_STAGES.map((st, i): UniqueItemDef => ({
    id: `divine-weapon-${a.god}-${i + 1}`,
    name: a.weapon.names[i] as string,
    rarity: 'divine',
    baseId: `${a.weapon.type}-t${st.tier}`,
    level: st.level,
    noDrop: true,
    requirements: { apostleOf: a.god },
    modifiers: [
      { stat: `${god.element}Damage` as never, type: 'flat', value: [15, 25, 35, 50][i] as number },
      { stat, type: 'flat', value: [6, 10, 14, 20][i] as number },
      { stat: 'divinePower', type: 'percent', value: [10, 15, 20, 30][i] as number },
    ],
    ...(i >= 2
      ? { triggers: [{ id: `divine-weapon-${a.god}-smite`, trigger: 'onHit' as const, chance: 20, cooldown: 1, effects: [{ kind: 'damage' as const, element: god.element, scaling: { stat: 'divinePower' as const, ratio: i === 3 ? 0.8 : 0.5 } }] }] }
      : {}),
    effectText: [`God-bound: only ${god.name}'s Apostle may wield it, whatever their class`, `Evolves at levels ${WEAPON_STAGES.slice(1).map((s) => s.level).join(', ')}`, ...(i >= 2 ? [`20% chance on hit to strike with ${god.name}'s power`] : [])],
    lore: a.weapon.lore,
  }));
});

/** Each god's Aspect: the boss of the last stage of its Trial of Apostleship. */
export const ASPECTS: EnemyDef[] = GODS.filter((g) => !g.hidden).map((g) => ({
  id: `aspect-${g.id}`,
  name: `Aspect of ${g.name}`,
  family: 'spirit',
  types: ['spirit', 'divine'],
  level: 30,
  tier: 'boss',
  row: 'front',
  stats: { hp: 60, attack: 12, magic: 13, defense: 8, magicResist: 10, speed: 12, critChance: 8 },
  resists: { [g.element]: 60 },
  skills: [{ id: `wrath-of-${g.id}`, weight: 2 }, { id: `judgement-of-${g.id}`, weight: 2 }],
  basicAttack: { element: g.element, ranged: false, magic: true, name: 'Divine Hand' },
  ai: 'aggressive',
  xp: 80,
  lootTable: 'boss',
  description: `${g.name} wears a body for you, to see what you are made of.`,
  palette: { main: g.color, accent: '#ffffff' },
}));

/** A heavy single-target hit for each Aspect. */
export const ASPECT_SKILLS: SkillDef[] = GODS.filter((g) => !g.hidden).map((g) => ({
  id: `judgement-of-${g.id}`,
  name: `Judgement of ${g.name}`,
  description: 'A single, overwhelming blow of divine power.',
  source: 'enemy',
  maxRank: 5,
  tags: ['Spell', 'Divine'],
  element: g.element,
  targeting: 'enemy',
  cost: {},
  cooldown: 2,
  stagger: 2,
  damage: { stat: 'magicAttack', multiplier: 1.6, perRank: 0.1 },
}));

/** The three stages of each god's Trial of Apostleship (levels scale to the hero when fought). */
export const APOSTLE_TRIALS: EncounterDef[] = GODS.filter((g) => !g.hidden).flatMap((g): EncounterDef[] => [
  { id: `apostle-trial-${g.id}-1`, name: `Trial of ${g.name}: the Ordeal`, description: `Two heralds test whether ${g.name} chose well.`, level: 30, canFlee: true, enemies: [{ enemyId: `punisher-${g.id}` }, { enemyId: `punisher-${g.id}` }] },
  { id: `apostle-trial-${g.id}-2`, name: `Trial of ${g.name}: the Gauntlet`, description: 'Three heralds, one after another, all at once.', level: 30, canFlee: true, enemies: [{ enemyId: `punisher-${g.id}` }, { enemyId: `punisher-${g.id}` }, { enemyId: `punisher-${g.id}` }] },
  { id: `apostle-trial-${g.id}-3`, name: `Trial of ${g.name}: the Aspect`, description: `${g.name} comes in person. Kneel afterwards, not before.`, level: 30, canFlee: false, isBoss: true, enemies: [{ enemyId: `aspect-${g.id}` }, { enemyId: `punisher-${g.id}` }] },
]);

/**
 * Divine Edicts: each like of a god becomes an edict to do it a number of
 * times within 20 battles (about 12 favor's worth of the deed, 1-20 times).
 */
export const EDICTS: EdictDef[] = PANTHEON.flatMap((p) =>
  p.likes.flatMap((like, i): EdictDef[] => {
    if (like.noEdict) return [];
    const count = Math.max(1, Math.min(20, Math.round(12 / like.amount)));
    return [{ id: `${p.id}-edict-${i}`, god: p.id, text: `${like.text}: ${count} time${count === 1 ? '' : 's'}`, deed: like, count, battles: 20 }];
  }),
);
