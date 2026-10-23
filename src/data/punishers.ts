import type { EnemyDef } from '../engine/combat/types';
import type { SkillDef } from '../engine/skills/types';
import { GODS } from './gods';

const ANGRY = GODS.filter((g) => !g.hidden);

/** Each god's wrath, used by its punisher. */
export const PUNISHER_SKILLS: SkillDef[] = ANGRY.map((g) => ({
  id: `wrath-of-${g.id}`,
  name: `Wrath of ${g.name}`,
  description: `${g.name}'s anger made manifest: strikes the whole party.`,
  source: 'enemy',
  maxRank: 5,
  tags: ['Spell', 'Divine', 'AoE'],
  element: g.element,
  targeting: 'allEnemies',
  cost: {},
  cooldown: 3,
  damage: { stat: 'magicAttack', multiplier: 0.9, perRank: 0.08 },
}));

/**
 * Divine punishers: sent by a god who hates you. One per god, themed by
 * its element and color. They join fights (see engine/gods/punishers.ts).
 */
export const PUNISHERS: EnemyDef[] = ANGRY.map((g) => ({
  id: `punisher-${g.id}`,
  name: `Herald of ${g.name}`,
  family: 'spirit',
  types: ['spirit', 'divine'],
  level: 1,
  tier: 'punisher',
  row: 'back',
  stats: { hp: 40, attack: 9, magic: 11, defense: 5, magicResist: 8, speed: 11 },
  resists: { [g.element]: 50 },
  skills: [{ id: `wrath-of-${g.id}`, weight: 2 }],
  basicAttack: { element: g.element, ranged: true, magic: true, name: 'Judgement' },
  ai: 'caster',
  xp: 30,
  lootTable: 'elite-enemy',
  description: `${g.name} has not forgotten. Neither has this.`,
  palette: { main: g.color, accent: '#ffffff' },
}));
