import type { GeneralSkillDef } from '../../engine/skills/generalTypes';
import type { SkillDef } from '../../engine/skills/types';
import { combat, dmg, status } from './skills';

/**
 * Murmurs (Tabletop Rules, item 200): free basic spells that grow with level. Casters learn two at the start, a third at level 5
 * and a fourth at level 11 (granted by `TabletopActions.syncMurmurs`); their rank rises with level.
 */
export const MURMURS: { id: string; from: number }[] = [
  { id: 'murmur-spark', from: 1 },
  { id: 'murmur-mend', from: 1 },
  { id: 'murmur-chill', from: 5 },
  { id: 'murmur-ward', from: 11 },
];

export const MURMUR_COMBAT: SkillDef[] = [
  combat({ id: 'g-murmur-spark', name: 'Spark of Thought', description: 'A free murmur: a spit of raw force, 70% MAG arcane. Grows with level.', tags: ['Spell', 'Arcane', 'Murmur'], element: 'arcane', targeting: 'enemy', cost: {}, cooldown: 0, damage: dmg('magicAttack', 0.7, 0.1) }),
  combat({ id: 'g-murmur-mend', name: 'Murmur of Mending', description: 'A free murmur: heal an ally for 12% of max HP.', tags: ['Spell', 'Heal', 'Murmur'], element: 'holy', targeting: 'ally', cost: {}, cooldown: 2, effects: [{ kind: 'heal', percentMaxHp: 12, target: 'target' }] }),
  combat({ id: 'g-murmur-chill', name: 'Cold Whisper', description: 'A free murmur: 55% MAG ice and a chance to Slow.', tags: ['Spell', 'Ice', 'Murmur'], element: 'ice', targeting: 'enemy', cost: {}, cooldown: 1, damage: dmg('magicAttack', 0.55, 0.08), effects: [status('slow', 2, 35)] }),
  combat({ id: 'g-murmur-ward', name: 'Warding Murmur', description: 'A free murmur: a shield of 8% max HP.', tags: ['Spell', 'Buff', 'Arcane', 'Murmur'], element: 'arcane', targeting: 'self', cost: {}, cooldown: 3, effects: [{ kind: 'shield', percentMaxHp: 8, target: 'self' }] }),
];

const M = (id: string, name: string, description: string, combatSkill: string): GeneralSkillDef => ({ id, name, category: 'elemental', description, rarity: 'common', maxRank: 10, combatSkill });
export const MURMUR_GENERAL: GeneralSkillDef[] = [
  M('murmur-spark', 'Spark of Thought', 'A free basic spell (Tabletop Rules).', 'g-murmur-spark'),
  M('murmur-mend', 'Murmur of Mending', 'A free basic heal (Tabletop Rules).', 'g-murmur-mend'),
  M('murmur-chill', 'Cold Whisper', 'A free basic frost (Tabletop Rules).', 'g-murmur-chill'),
  M('murmur-ward', 'Warding Murmur', 'A free basic ward (Tabletop Rules).', 'g-murmur-ward'),
];
