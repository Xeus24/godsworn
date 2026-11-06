import { content } from '../../data';
import { ARCANA_PERK, FORGE_ELEMENTS, RIDERS, SHAPES, castCost, type Rider, type Shape } from '../../data/spellforge';
import { ARCANA, REAGENTS, type Arcanum } from '../../data/tabletop';
import { REAGENT_FROM_CIRCLE, INK } from '../../data/spellforge';
import type { EffectSpec } from '../effects/types';
import type { Element } from '../stats/types';
import type { SkillDef } from './types';

/** A forged spell's id carries its recipe: `forge:Arcanum:shape:element:rider`. */
export const forgeId = (arcanum: Arcanum, shape: string, element: Element, rider: string): string => `forge:${arcanum}:${shape}:${element}:${rider}`;

export interface Recipe { arcanum: Arcanum; shape: Shape; element: Element; rider: Rider }

export function parseForgeId(id: string): Recipe | undefined {
  const [tag, a, s, e, r] = id.split(':');
  const shape = SHAPES.find((x) => x.id === s);
  const rider = RIDERS.find((x) => x.id === r);
  if (tag !== 'forge' || !(ARCANA as readonly string[]).includes(a as string) || !shape || !rider || !FORGE_ELEMENTS.includes(e as Element)) return undefined;
  return { arcanum: a as Arcanum, shape, element: e as Element, rider };
}

export const circleOfRecipe = (r: Recipe): number => r.shape.circle + r.rider.circle + ARCANA_PERK[r.arcanum].circle;

function riderEffects(r: Rider): EffectSpec[] {
  switch (r.id) {
    case 'slow': return [{ kind: 'applyStatus', status: 'slow', duration: 2 }];
    case 'weaken': return [{ kind: 'applyStatus', status: 'weaken', duration: 3 }];
    case 'siphon': return [{ kind: 'heal', percentMaxHp: 8, target: 'self' }];
    case 'vuln': return [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }];
    case 'stun': return [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 35 }];
    case 'haste': return [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }];
    case 'fear': return [{ kind: 'applyStatus', status: 'fear', duration: 2, chance: 60 }];
    default: return [];
  }
}

function arcanaEffects(a: Arcanum): EffectSpec[] {
  switch (a) {
    case 'Warding': return [{ kind: 'shield', percentMaxHp: 6, target: 'self' }];
    case 'Calling': return [{ kind: 'reduceCooldowns', turns: 1 }];
    case 'Seeing': return [{ kind: 'applyStatus', status: 'vulnerable', duration: 2, chance: 40 }];
    case 'Binding': return [{ kind: 'applyStatus', status: 'entangle', duration: 2, chance: 40 }];
    case 'Veiling': return [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self', chance: 50 }];
    case 'Unmaking': return [{ kind: 'applyStatus', status: 'bleed', duration: 3, chance: 60 }];
    default: return [];
  }
}

/** Builds the spell for a recipe. */
export function forgedSkill(id: string): SkillDef | undefined {
  const r = parseForgeId(id);
  if (!r) return undefined;
  const circle = circleOfRecipe(r);
  const power = r.arcanum === 'Shaping' ? 1.2 : r.arcanum === 'Ending' ? 1.35 : 1;
  const ward = r.shape.to === 'self';
  const name = `${r.rider.id === 'plain' ? '' : `${r.rider.name} `}${r.element[0]?.toUpperCase()}${r.element.slice(1)} ${r.shape.name} (${r.arcanum})`;
  return {
    id, name, source: 'general', maxRank: 10,
    description: `Forged, Circle ${circle}: ${r.shape.text}, ${r.element}; ${r.rider.text}; ${ARCANA_PERK[r.arcanum].text}.`,
    tags: ['Spell', r.arcanum === 'Warding' || ward ? 'Buff' : 'Attack', ...(ward ? ['Defensive'] : []), 'Forged'] as SkillDef['tags'],
    element: r.element, targeting: r.shape.to, cost: { mp: castCost(circle) }, cooldown: r.shape.cd + (r.arcanum === 'Ending' ? 1 : 0),
    ...(ward ? {} : { damage: { stat: 'magicAttack' as const, multiplier: Math.round(r.shape.mult * power * 100) / 100, perRank: Math.round(r.shape.mult * power * 6) / 100 } }),
    effects: [...(ward ? [{ kind: 'shield', percentMaxHp: 18, target: 'self' } as EffectSpec] : []), ...riderEffects(r.rider), ...arcanaEffects(r.arcanum)],
  };
}

/** Makes sure a forged spell exists in the content table (and its reagent, from Circle 5), then returns it. */
export function ensureForged(id: string): SkillDef | undefined {
  const have = content.skills.find(id);
  if (have) return have;
  const sk = forgedSkill(id);
  const r = parseForgeId(id);
  if (!sk || !r) return undefined;
  content.skills.register(sk);
  if (circleOfRecipe(r) >= REAGENT_FROM_CIRCLE) REAGENTS[id] = { itemId: INK.id, qty: 1, name: INK.name };
  return sk;
}
