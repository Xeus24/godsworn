import type { EffectSpec } from '../engine/effects/types';
import type { SkillDef } from '../engine/skills/types';
import type { Element } from '../engine/stats/types';

type Atk = 'physicalAttack' | 'magicAttack' | 'divinePower';
type Kind = 'strike' | 'aoe' | 'support';

/** [partner, partner, name, flavor, element, scaling stat, kind, status]. A partner is a class id or a companion id. */
type Row = [string, string, string, string, Element, Atk, Kind, string];

const ROWS: Row[] = [
  // Companion pairs.
  ['aldric', 'korga', 'Shield and Sunlight', 'Korga takes the blow and Aldric answers it with noon.', 'holy', 'physicalAttack', 'strike', 'blind'],
  ['fenn', 'ilyra', 'Arrowstorm Weave', 'Ilyra bends the wind round every arrow Fenn looses.', 'arcane', 'magicAttack', 'aoe', 'slow'],
  ['sable', 'marisol', 'Silent Ballad', 'A song only the target can hear, and a knife only they cannot see.', 'shadow', 'physicalAttack', 'strike', 'fear'],
  ['korga', 'ilyra', 'Steel Meets Star', 'Korga’s blade, and a falling star riding it.', 'fire', 'physicalAttack', 'strike', 'burn'],
  ['aldric', 'fenn', 'Hunter’s Benediction', 'A blessing on every arrow in the quiver.', 'holy', 'physicalAttack', 'support', 'regen'],
  ['sable', 'fenn', 'Crossfire', 'One from the dark, one from the trees.', 'physical', 'physicalAttack', 'strike', 'vulnerable'],
  ['korga', 'sable', 'Back to Back', 'Two blades, no blind spots.', 'physical', 'physicalAttack', 'aoe', 'bleed'],
  ['ilyra', 'marisol', 'Resonance', 'A spell sung until the room hums with it.', 'arcane', 'magicAttack', 'aoe', 'silence'],
  ['aldric', 'marisol', 'Hymn of the Drowned', 'A priest’s prayer and a siren’s dirge, in harmony.', 'holy', 'divinePower', 'support', 'regen'],
  ['aldric', 'ilyra', 'Twin Lights', 'Two kinds of radiance, one target.', 'holy', 'magicAttack', 'strike', 'blind'],
  // Class pairs.
  ['warrior', 'mage', 'Spellsteel Volley', 'The warrior cuts; the mage makes the cut explode.', 'arcane', 'physicalAttack', 'strike', 'vulnerable'],
  ['warrior', 'rogue', 'Opening and Closing', 'One draws the guard; the other ends it.', 'physical', 'physicalAttack', 'strike', 'bleed'],
  ['mage', 'cleric', 'Light and Flame', 'Two schools meet, politely, on a target.', 'fire', 'magicAttack', 'aoe', 'burn'],
  ['rogue', 'ranger', 'Hunter’s Mark', 'A shadow marks the quarry; an arrow collects.', 'physical', 'physicalAttack', 'strike', 'vulnerable'],
  ['monk', 'bard', 'Drum and Palm', 'Every strike lands on the beat.', 'physical', 'physicalAttack', 'strike', 'stun'],
  ['necromancer', 'cleric', 'Dust and Dawn', 'The grave opens, and the sun looks in.', 'shadow', 'magicAttack', 'aoe', 'weaken'],
  ['knight', 'druid', 'Oak and Iron', 'A shield wall that puts down roots.', 'nature', 'physicalAttack', 'support', 'regen'],
  ['knight', 'warrior', 'Phalanx Charge', 'Two shields, one direction.', 'physical', 'physicalAttack', 'aoe', 'stun'],
  ['druid', 'shaman', 'Grove and Ancestors', 'The forest and the dead, in agreement.', 'nature', 'magicAttack', 'aoe', 'slow'],
  ['warlock', 'summoner', 'Pact and Call', 'Two bargains collected at once.', 'shadow', 'magicAttack', 'strike', 'curse'],
  ['alchemist', 'artificer', 'Volatile Compound', 'A flask in a fine-tooled launcher.', 'fire', 'magicAttack', 'aoe', 'burn'],
  ['chronomancer', 'inkweaver', 'Written in Time', 'A sigil drawn in the second before.', 'arcane', 'magicAttack', 'strike', 'slow'],
  ['dancer', 'witchhunter', 'Silver Pirouette', 'A spin with a silver edge.', 'holy', 'physicalAttack', 'strike', 'weaken'],
  ['geomancer', 'shaman', 'Stone Ancestors', 'The ground itself remembers its dead.', 'physical', 'magicAttack', 'aoe', 'stun'],
  ['monk', 'warrior', 'Fist and Blade', 'A combination without a gap.', 'physical', 'physicalAttack', 'strike', 'weaken'],
  ['mage', 'necromancer', 'Bone Lightning', 'Lightning through a rib cage.', 'lightning', 'magicAttack', 'aoe', 'stun'],
  ['ranger', 'druid', 'Thorn Volley', 'Every arrow flowers on arrival.', 'nature', 'physicalAttack', 'aoe', 'bleed'],
  ['bard', 'dancer', 'Grand Finale', 'The curtain call every audience was promised.', 'arcane', 'magicAttack', 'support', 'haste'],
  ['cleric', 'knight', 'Vow Kept', 'A shield, a prayer and an unbroken promise.', 'holy', 'divinePower', 'support', 'regen'],
  ['rogue', 'warlock', 'Stolen Pact', 'A debt picked from someone else’s pocket.', 'shadow', 'physicalAttack', 'strike', 'curse'],
  ['summoner', 'druid', 'Wild Call', 'Every creature in earshot answers.', 'nature', 'magicAttack', 'aoe', 'weaken'],
  ['artificer', 'chronomancer', 'Clockwork Strike', 'A machine that has already fired.', 'arcane', 'physicalAttack', 'strike', 'slow'],
];

const slug = (s: string): string => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);
const ATK: Record<Atk, string> = { physicalAttack: 'ATK', magicAttack: 'MAG', divinePower: 'Divine Power' };

function team([a, b, name, flavor, el, atk, kind, status]: Row): SkillDef {
  const base = { id: `team-${slug(name)}`, name, source: 'team' as const, maxRank: 1, element: el, team: [a, b] as [string, string], cost: {}, cooldown: 6 };
  const tag = cap(el) as never;
  if (kind === 'strike') {
    return { ...base, description: `${flavor} Two hits of 120% ${ATK[atk]} ${el} damage; ${cap(status)} (60%).`, tags: ['Attack', 'Team', tag], targeting: 'enemy', damage: { stat: atk, multiplier: 1.2, perRank: 0, hits: 2 }, effects: [{ kind: 'applyStatus', status, duration: 2, chance: 60 }] };
  }
  if (kind === 'aoe') {
    return { ...base, description: `${flavor} 140% ${ATK[atk]} ${el} damage to every enemy; ${cap(status)} (50%).`, tags: ['Attack', 'AoE', 'Team', tag], targeting: 'allEnemies', damage: { stat: atk, multiplier: 1.4, perRank: 0 }, effects: [{ kind: 'applyStatus', status, duration: 2, chance: 50 }] };
  }
  const effects: EffectSpec[] = [
    { kind: 'heal', percentMaxHp: 15, target: 'allAllies' },
    { kind: 'buff', id: `${base.id}-buff`, duration: 3, target: 'allAllies', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 18 }, { stat: 'defense', type: 'percent', value: 10 }] },
    { kind: 'applyStatus', status, duration: 3, target: 'allAllies' },
  ];
  return { ...base, description: `${flavor} Heal the party for 15% of max HP; +18% damage and +10% defense for 3 turns; ${cap(status)}.`, tags: ['Buff', 'AoE', 'Team', tag], targeting: 'allAllies', effects };
}

/** Dual techniques: either partner may use one while the other stands beside them in the party. */
export const TEAM_SKILLS: SkillDef[] = ROWS.map(team);
