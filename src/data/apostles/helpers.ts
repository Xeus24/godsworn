import type { EffectSpec, TriggeredEffect } from '../../engine/effects/types';
import type { ApostleDef, BlessingDef } from '../../engine/gods/types';
import type { SkillTag } from '../skillTags';
import type { SkillDef } from '../../engine/skills/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { Element } from '../../engine/stats/types';
import type { ApostleSpec } from '../trees/builder';

/** Everything one god's Apostleship adds. */
export interface ApostleContent extends Omit<ApostleDef, 'avatar'> {
  skills: SkillDef[];
  avatar: SkillDef;
  blessing: BlessingDef;
  tree: ApostleSpec;
}

/** Apostle tree skills: 5 ranks, independent of class (most scale with Divine Power). */
export const rite = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'apostle', maxRank: 5 });

/**
 * A Divine Avatar: an ultimate that transforms the apostle for 3 turns
 * (the `avatar:<god>` buff, drawn as a halo in battle) and unleashes the
 * god's power on every enemy.
 */
export function avatar(a: {
  id: string;
  name: string;
  description: string;
  element: Element;
  tags: SkillTag[];
  damage: number;
  buff: ModifierSpec[];
  effects: EffectSpec[];
}): SkillDef {
  const god = a.id.replace('avatar-', '');
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    source: 'avatar',
    maxRank: 1,
    tags: a.tags,
    element: a.element,
    targeting: 'allEnemies',
    cost: {},
    cooldown: 0,
    ultimate: true,
    damage: { stat: 'divinePower', multiplier: a.damage, perRank: 0 },
    effects: [{ kind: 'buff', id: `avatar:${god}`, duration: 3, modifiers: a.buff, target: 'self' }, ...a.effects],
  };
}

/** The Divine-rarity blessing an Apostle receives (apostles get an extra blessing slot for it). */
export function divineBlessing(god: string, name: string, description: string, modifiers: ModifierSpec[], triggers?: TriggeredEffect[], flags?: string[]): BlessingDef {
  return { id: `${god}-divine`, god, name, kind: 'major', rarity: 'divine', minTier: 'apostle', description, modifiers, ...(triggers ? { triggers } : {}), ...(flags ? { flags } : {}) };
}
