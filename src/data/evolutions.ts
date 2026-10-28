import type { EffectSpec } from '../engine/effects/types';
import type { SkillDef } from '../engine/skills/types';

/**
 * Skill evolutions: a skill at Grandmaster mastery (10) becomes a stronger, renamed form once the
 * class's questline has reached the quest that teaches it. The evolved skill replaces the base one
 * everywhere (hotbar, tree, mastery); the base skill's tree node still earns the ranks.
 */
export interface EvolutionDef {
  id: string;
  classId: string;
  from: string;
  /** Quest that must be complete (a class questline step). */
  quest: string;
  name: string;
  description: string;
  /** Multiplies the base skill's damage or heal power. */
  power: number;
  addEffects: EffectSpec[];
}

type Row = [classId: string, from: string, quest: number, id: string, name: string, description: string, power: number, add: EffectSpec[]];

const status = (s: string, d: number): EffectSpec => ({ kind: 'applyStatus', status: s, duration: d });
const healSelf = (pct: number): EffectSpec => ({ kind: 'heal', percentMaxHp: pct, target: 'self' });

const ROWS: Row[] = [
  ['warrior', 'heavy-strike', 3, 'sundering-blow', 'Sundering Blow', 'A blow that breaks armor as well as bone: Weaken.', 1.4, [status('weaken', 3)]],
  ['warrior', 'mortal-strike', 4, 'executioners-verdict', 'Executioner’s Verdict', 'The sentence is passed before the swing: Vulnerable.', 1.35, [status('vulnerable', 3)]],
  ['warrior', 'whirlwind', 5, 'cyclone-of-ruin', 'Cyclone of Ruin', 'A storm of steel that leaves every enemy bleeding.', 1.4, [status('bleed', 3)]],
  ['mage', 'firebolt', 3, 'phoenix-bolt', 'Phoenix Bolt', 'The fire remembers how to rise: Burn, and you recover 5% HP.', 1.4, [status('burn', 3), healSelf(5)]],
  ['mage', 'frost-nova', 4, 'absolute-zero', 'Absolute Zero', 'Cold past all warmth: Freeze.', 1.35, [status('freeze', 2)]],
  ['mage', 'chain-lightning', 5, 'stormcallers-arc', 'Stormcaller’s Arc', 'The storm answers by name: Slow.', 1.4, [status('slow', 2)]],
  ['rogue', 'backstab', 3, 'nightfall-stab', 'Nightfall Stab', 'A strike from the exact second the lamp goes out: Bleed.', 1.4, [status('bleed', 3)]],
  ['rogue', 'eviscerate', 4, 'red-ledger', 'Red Ledger', 'Every debt collected in full: Vulnerable.', 1.35, [status('vulnerable', 3)]],
  ['rogue', 'fan-of-knives', 5, 'ten-thousand-cuts', 'Ten Thousand Cuts', 'The air itself is a blade: Bleed.', 1.4, [status('bleed', 3)]],
  ['cleric', 'smite', 3, 'judgement', 'Judgement', 'Holy wrath, weighed first: Weaken.', 1.4, [status('weaken', 3)]],
  ['cleric', 'holy-fire', 4, 'sunfire-pyre', 'Sunfire Pyre', 'A pillar of noon: Burn.', 1.4, [status('burn', 3)]],
  ['cleric', 'holy-nova', 5, 'radiant-dawn', 'Radiant Dawn', 'The light arrives all at once: Blind.', 1.35, [status('blind', 2)]],
  ['ranger', 'aimed-shot', 3, 'dead-eye-shot', 'Dead-Eye Shot', 'One arrow, no doubt.', 1.45, []],
  ['ranger', 'arrow-barrage', 4, 'storm-of-feathers', 'Storm of Feathers', 'The sky rains fletching: Bleed.', 1.35, [status('bleed', 3)]],
  ['ranger', 'serpent-sting', 5, 'wyrm-venom', 'Wyrm Venom', 'A venom older than the bow: Poison.', 1.4, [status('poison', 4)]],
  ['necromancer', 'soul-bolt', 3, 'soul-rend', 'Soul Rend', 'Tears something loose and keeps it: you recover 6% HP.', 1.4, [healSelf(6)]],
  ['necromancer', 'bone-spear', 4, 'ossuary-lance', 'Ossuary Lance', 'A spear of a hundred small bones: Bleed.', 1.4, [status('bleed', 3)]],
  ['necromancer', 'death-coil', 5, 'reapers-coil', 'Reaper’s Coil', 'Death reaches back: Fear.', 1.35, [status('fear', 2)]],
  ['monk', 'palm-strike', 3, 'echoing-palm', 'Echoing Palm', 'The echo hits second: Slow.', 1.4, [status('slow', 2)]],
  ['monk', 'crane-kick', 4, 'rising-phoenix-kick', 'Rising Phoenix Kick', 'A kick that lifts the whole fight: Burn.', 1.35, [status('burn', 3)]],
  ['monk', 'viper-strike', 5, 'dragons-fang', 'Dragon’s Fang', 'Old venom in a quick hand: Poison.', 1.4, [status('poison', 4)]],
  ['bard', 'discordant-note', 3, 'shattering-chord', 'Shattering Chord', 'A note that breaks glass and concentration: Silence.', 1.4, [status('silence', 2)]],
  ['bard', 'cacophony', 4, 'crescendo-of-ruin', 'Crescendo of Ruin', 'It rises, and rises, and does not stop: Fear.', 1.35, [status('fear', 2)]],
  ['bard', 'dazzling-display', 5, 'blinding-overture', 'Blinding Overture', 'The curtain rises on pure light: Blind.', 1.35, [status('blind', 2)]],
];

export const EVOLUTIONS: EvolutionDef[] = ROWS.map(([classId, from, q, id, name, description, power, addEffects]) => ({ id, classId, from, quest: `cl-${classId}-${q}`, name, description, power, addEffects }));

/** The evolved skills themselves: the base skill with more power, extra effects and a new name. */
export function evolvedSkills(base: (id: string) => SkillDef): SkillDef[] {
  return EVOLUTIONS.map((e) => {
    const b = base(e.from);
    return {
      ...b,
      id: e.id,
      name: e.name,
      description: e.description,
      tags: [...new Set([...b.tags, 'Evolved'])] as SkillDef['tags'],
      ...(b.damage ? { damage: { ...b.damage, multiplier: b.damage.multiplier * e.power, perRank: b.damage.perRank * e.power } } : {}),
      ...(b.heal ? { heal: { ...b.heal, multiplier: b.heal.multiplier * e.power, perRank: b.heal.perRank * e.power } } : {}),
      effects: [...(b.effects ?? []), ...e.addEffects],
    };
  });
}
