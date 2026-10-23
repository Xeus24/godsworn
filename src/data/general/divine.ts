import type { GeneralSkillDef } from '../../engine/skills/generalTypes';
import type { SkillDef } from '../../engine/skills/types';
import { flat, pct } from '../trees/builder';

const rite = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'general', maxRank: 5 });
const scaling = (multiplier: number) => ({ stat: 'divinePower' as const, multiplier, perRank: multiplier * 0.08 });

/** Battle skills taught by Divine general skills (they scale with Divine Power). */
export const DIVINE_COMBAT_SKILLS: SkillDef[] = [
  rite({ id: 'd-sunlance', name: 'Sunlance', description: 'A lance of sunlight for 150% Divine Power holy damage.', tags: ['Spell', 'Holy', 'Divine'], element: 'holy', targeting: 'enemy', cost: { mp: 10 }, cooldown: 2, damage: scaling(1.5) }),
  rite({ id: 'd-last-rites', name: 'Last Rites', description: '120% Divine Power shadow damage and Curse for 2 turns.', tags: ['Spell', 'Shadow', 'Divine'], element: 'shadow', targeting: 'enemy', cost: { mp: 10 }, cooldown: 3, damage: scaling(1.2), effects: [{ kind: 'applyStatus', status: 'curse', duration: 2 }] }),
  rite({ id: 'd-war-god', name: 'Avatar of War', description: '+30% damage and Berserk for 3 turns.', tags: ['Buff', 'Divine', 'Shout'], element: 'physical', targeting: 'self', cost: { mp: 12 }, cooldown: 6, effects: [{ kind: 'buff', id: 'd-war-god', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 30 }] }, { kind: 'applyStatus', status: 'berserk', duration: 3 }] }),
  rite({ id: 'd-wild-call', name: 'Wild Call', description: 'Summon a spirit stag and Regenerate for 3 turns.', tags: ['Summon', 'Nature', 'Divine'], element: 'nature', targeting: 'self', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'summon', summonId: 'spirit-stag' }, { kind: 'applyStatus', status: 'regen', duration: 3 }] }),
  rite({ id: 'd-coin-flip', name: 'Coin Flip', description: '150% Divine Power arcane damage, with a 50% chance to slip into Stealth.', tags: ['Spell', 'Arcane', 'Divine'], element: 'arcane', targeting: 'enemy', cost: { mp: 8 }, cooldown: 2, damage: scaling(1.5), effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, chance: 50, target: 'self' }] }),
  rite({ id: 'd-forge-strike', name: 'Forge Strike', description: '160% Divine Power fire damage that Burns and shields you for 10% of max HP.', tags: ['Attack', 'Melee', 'Fire', 'Divine'], element: 'fire', targeting: 'enemy', cost: { mp: 10 }, cooldown: 2, damage: scaling(1.6), effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }, { kind: 'shield', percentMaxHp: 10, target: 'self' }] }),
  rite({ id: 'd-maelstrom', name: 'Maelstrom', description: '90% Divine Power lightning damage to every enemy; they are Wet.', tags: ['Spell', 'Lightning', 'Divine', 'AoE'], element: 'lightning', targeting: 'allEnemies', cost: { mp: 16 }, cooldown: 3, damage: scaling(0.9), effects: [{ kind: 'applyStatus', status: 'wet', duration: 2 }] }),
  rite({ id: 'd-revelation', name: 'Revelation', description: '130% Divine Power arcane damage; restore 15 MP.', tags: ['Spell', 'Arcane', 'Divine'], element: 'arcane', targeting: 'enemy', cost: { mp: 6 }, cooldown: 2, damage: scaling(1.3), effects: [{ kind: 'restoreMp', amount: 15, target: 'self' }] }),
  rite({ id: 'd-hearthlight', name: 'Hearthlight', description: 'Heal the party for 100% Divine Power and grant Divine Protection for 1 turn.', tags: ['Spell', 'Heal', 'Holy', 'Divine', 'AoE'], element: 'holy', targeting: 'allAllies', cost: { mp: 16 }, cooldown: 4, heal: scaling(1), effects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 1 }] }),
  rite({ id: 'd-golden-guard', name: 'Golden Guard', description: 'A shield of 25% max HP; steal 10 gold.', tags: ['Buff', 'Divine'], element: 'physical', targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'shield', percentMaxHp: 25 }, { kind: 'gold', amount: 10 }] }),
];

const divine = (god: string, s: Omit<GeneralSkillDef, 'category' | 'rarity' | 'maxRank' | 'god'>): GeneralSkillDef => ({ ...s, god, category: 'divine', rarity: 'divine', maxRank: 5 });

/**
 * One Divine general skill per god. They can only be learned while that god
 * blesses you, and their scriptures are bought with favor at the god's shrine.
 */
export const DIVINE_SKILLS: GeneralSkillDef[] = [
  divine('solenne', { id: 'rite-of-dawn', name: 'Rite of Dawn', description: 'Sunlance in battle. Passive: +2% holy damage per rank.', combatSkill: 'd-sunlance', passive: [flat('holyDamage', 2)] }),
  divine('morrath', { id: 'rite-of-endings', name: 'Rite of Endings', description: 'Last Rites in battle. Passive: +2% shadow damage per rank.', combatSkill: 'd-last-rites', passive: [flat('shadowDamage', 2)] }),
  divine('kael', { id: 'rite-of-war', name: 'Rite of War', description: 'Avatar of War in battle. Passive: +1 STR per rank.', combatSkill: 'd-war-god', passive: [flat('str', 1)] }),
  divine('ysolde', { id: 'rite-of-the-hunt', name: 'Rite of the Hunt', description: 'Wild Call in battle. Passive: +1 DEX per rank.', combatSkill: 'd-wild-call', passive: [flat('dex', 1)] }),
  divine('vex', { id: 'rite-of-chance', name: 'Rite of Chance', description: 'Coin Flip in battle. Passive: +1 LUK per rank.', combatSkill: 'd-coin-flip', passive: [flat('luk', 1)] }),
  divine('thalor', { id: 'rite-of-the-forge', name: 'Rite of the Forge', description: 'Forge Strike in battle. Passive: +2% defense per rank.', combatSkill: 'd-forge-strike', passive: [pct('defense', 2)] }),
  divine('nymira', { id: 'rite-of-storms', name: 'Rite of Storms', description: 'Maelstrom in battle. Passive: +2% lightning damage per rank.', combatSkill: 'd-maelstrom', passive: [flat('lightningDamage', 2)] }),
  divine('aurelis', { id: 'rite-of-knowing', name: 'Rite of Knowing', description: 'Revelation in battle. Passive: +1 INT per rank.', combatSkill: 'd-revelation', passive: [flat('int', 1)] }),
  divine('hesha', { id: 'rite-of-mercy', name: 'Rite of Mercy', description: 'Hearthlight in battle. Passive: +3 healing power per rank.', combatSkill: 'd-hearthlight', passive: [flat('healingPower', 3)] }),
  divine('grimvald', { id: 'rite-of-tithes', name: 'Rite of Tithes', description: 'Golden Guard in battle. Passive: +4% gold find per rank.', combatSkill: 'd-golden-guard', passive: [flat('goldFind', 4)] }),
];
