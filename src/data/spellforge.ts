import type { Element } from '../engine/stats/types';
import type { Arcanum } from './tabletop';

/**
 * Spellforging (Section I-7c, item 218): a custom spell is an Arcanum, a shape, an element and a rider. Its Circle is the sum of what
 * went in (a hero may forge up to `maxCircle(level)`), it costs spell-ink and gold to forge, and from Circle 5 each cast burns a spell-ink
 * under the Tabletop Rules.
 */
export interface Shape { id: string; name: string; circle: number; to: 'enemy' | 'frontRow' | 'allEnemies' | 'self'; mult: number; cd: number; text: string }
export const SHAPES: Shape[] = [
  { id: 'bolt', name: 'Bolt', circle: 1, to: 'enemy', mult: 1.3, cd: 1, text: 'one target' },
  { id: 'lance', name: 'Lance', circle: 3, to: 'enemy', mult: 2.2, cd: 2, text: 'one target, hard' },
  { id: 'wave', name: 'Wave', circle: 2, to: 'frontRow', mult: 1.1, cd: 2, text: 'the front row' },
  { id: 'burst', name: 'Burst', circle: 3, to: 'allEnemies', mult: 0.9, cd: 3, text: 'every enemy' },
  { id: 'nova', name: 'Nova', circle: 5, to: 'allEnemies', mult: 1.6, cd: 4, text: 'every enemy, hard' },
  { id: 'ward', name: 'Ward', circle: 2, to: 'self', mult: 0, cd: 3, text: 'a shield on you (no damage)' },
];

export const FORGE_ELEMENTS: Element[] = ['fire', 'ice', 'lightning', 'nature', 'holy', 'shadow', 'arcane', 'void', 'earth'];

export interface Rider { id: string; name: string; circle: number; text: string }
export const RIDERS: Rider[] = [
  { id: 'plain', name: 'No rider', circle: 0, text: 'just the spell' },
  { id: 'slow', name: 'Slowing', circle: 1, text: 'the target is slowed' },
  { id: 'weaken', name: 'Weakening', circle: 1, text: 'the target is weakened' },
  { id: 'siphon', name: 'Siphoning', circle: 1, text: 'you heal for 8% max HP' },
  { id: 'vuln', name: 'Exposing', circle: 2, text: 'the target is left vulnerable' },
  { id: 'stun', name: 'Stunning', circle: 2, text: '35% to stun the target' },
  { id: 'haste', name: 'Quickening', circle: 2, text: 'you are hasted for 2 turns' },
  { id: 'fear', name: 'Dreadful', circle: 2, text: 'the target may flee in fear' },
];

/** What each Arcanum adds to a forged spell (and how many Circles it costs). */
export const ARCANA_PERK: Record<Arcanum, { circle: number; text: string }> = {
  Warding: { circle: 0, text: 'a shield of 6% max HP on you' },
  Calling: { circle: 0, text: 'your skills cool by 1 turn' },
  Seeing: { circle: 0, text: '40% to leave the target vulnerable' },
  Binding: { circle: 0, text: '40% to entangle the target' },
  Veiling: { circle: 0, text: '50% to slip into stealth' },
  Unmaking: { circle: 0, text: 'the target bleeds for 3 turns (60%)' },
  Shaping: { circle: 0, text: '+20% power' },
  Ending: { circle: 1, text: '+35% power, one turn longer to recover' },
};

export const maxCircle = (level: number): number => Math.min(8, 1 + Math.floor(level / 5));
export const maxForged = (level: number): number => 3 + Math.floor(level / 10);
export const forgeCost = (circle: number): { gold: number; ink: number } => ({ gold: 40 * circle * circle, ink: circle });
export const castCost = (circle: number): number => 4 * circle + 2;
export const INK_PRICE = 60;
export const REAGENT_FROM_CIRCLE = 5;
export const INK = { id: 'spell-ink', name: 'Spell-Ink', category: 'material', kind: 'divine', tier: 3, level: 1, value: 40, stack: 99, description: 'Lampblack ground with a little of a dead star. Every forged spell is written in it.' } as const;
