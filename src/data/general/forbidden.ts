import type { GeneralSkillDef } from '../../engine/skills/generalTypes';
import type { SkillDef } from '../../engine/skills/types';
import { flat } from '../trees/builder';

const rite = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'general', maxRank: 5 });
const mag = (multiplier: number) => ({ stat: 'magicAttack' as const, multiplier, perRank: multiplier * 0.08 });
const atk = (multiplier: number) => ({ stat: 'physicalAttack' as const, multiplier, perRank: multiplier * 0.08 });

/** Battle skills taught by Forbidden general skills: strong, and every one costs something. */
export const FORBIDDEN_COMBAT_SKILLS: SkillDef[] = [
  rite({ id: 'f-void-pact', name: 'Void Pact', description: 'Pay 12% of your max HP: 240% MAG void damage to one enemy, which becomes Vulnerable.', tags: ['Spell', 'Void', 'Curse'], element: 'void', targeting: 'enemy', cost: { hpPct: 12 }, cooldown: 2, damage: mag(2.4), effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] }),
  rite({ id: 'f-unmake', name: 'Unmake', description: '120% MAG void damage to every enemy, Corrupting them; you are Weakened for 2 turns.', tags: ['Spell', 'Void', 'AoE'], element: 'void', targeting: 'allEnemies', cost: { mp: 18 }, cooldown: 4, damage: mag(1.2), effects: [{ kind: 'applyStatus', status: 'corruption', duration: 3 }, { kind: 'applyStatus', status: 'weaken', duration: 2, target: 'self' }] }),
  rite({ id: 'f-devour-name', name: 'Devour Name', description: '170% ATK void damage; heal 12% of your max HP. Pay 8% of your max HP to use.', tags: ['Attack', 'Melee', 'Void'], element: 'void', targeting: 'enemy', cost: { hpPct: 8 }, cooldown: 2, damage: atk(1.7), effects: [{ kind: 'heal', percentMaxHp: 12, target: 'self' }] }),
  rite({ id: 'f-blasphemy', name: 'Blasphemy', description: 'Curse and Silence every enemy for 2 turns; you are Cursed for 2 turns too.', tags: ['Spell', 'Curse', 'Void'], element: 'void', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'applyStatus', status: 'curse', duration: 2 }, { kind: 'applyStatus', status: 'silence', duration: 2, chance: 70 }, { kind: 'applyStatus', status: 'curse', duration: 2, target: 'self' }] }),
];

const forbidden = (heresy: number, s: Omit<GeneralSkillDef, 'category' | 'rarity' | 'maxRank' | 'heresy'>): GeneralSkillDef => ({ ...s, heresy, category: 'forbidden', rarity: 'relic', maxRank: 5 });

/**
 * Forbidden general skills: the Nameless One's gifts. Their tomes are sold
 * only by the Black Market, to those whose heresy runs deep enough, and
 * only a heretic of that tier may learn them. Each passive has a price.
 */
export const FORBIDDEN_SKILLS: GeneralSkillDef[] = [
  forbidden(0, { id: 'forbidden-void-pact', name: 'Void Pact', description: 'Void Pact in battle. Passive: +3% void damage per rank.', combatSkill: 'f-void-pact', passive: [flat('voidDamage', 3)] }),
  forbidden(0, { id: 'forbidden-margin-walker', name: 'Margin Walker', description: 'Passive: +1 dodge and +4 void resistance per rank, but 3% less Favor Gain per rank.', passive: [flat('dodge', 1), flat('voidResist', 4), flat('favorGain', -3)] }),
  forbidden(1, { id: 'forbidden-unmake', name: 'Unmake', description: 'Unmake in battle. Passive: +2% damage per rank, but 2% less healing received per rank.', combatSkill: 'f-unmake', passive: [flat('damageBonus', 2), flat('healingReceived', -2)] }),
  forbidden(1, { id: 'forbidden-devour-name', name: 'Devour Name', description: 'Devour Name in battle. Passive: +1% lifesteal per rank.', combatSkill: 'f-devour-name', passive: [flat('lifesteal', 1)] }),
  forbidden(1, { id: 'forbidden-godless', name: 'Godless', description: 'Passive: +3% damage per rank, but 6% less Favor Gain and 3% less Blessing Power per rank.', passive: [flat('damageBonus', 3), flat('favorGain', -6), flat('blessingPower', -3)] }),
  forbidden(2, { id: 'forbidden-blasphemy', name: 'Blasphemy', description: 'Blasphemy in battle. Passive: +4 status chance per rank.', combatSkill: 'f-blasphemy', passive: [flat('statusChance', 4)] }),
  forbidden(2, { id: 'forbidden-unwritten-flesh', name: 'Unwritten Flesh', description: 'Passive: +4% max HP and +2 status resistance per rank, but 3% less healing received per rank.', passive: [{ stat: 'maxHp', type: 'percent', value: 4 }, flat('statusResist', 2), flat('healingReceived', -3)] }),
  forbidden(2, { id: 'forbidden-crown-of-nothing', name: 'Crown of Nothing', description: 'Passive: +5% crit damage and +1% crit chance per rank, but 2% more damage taken per rank.', passive: [flat('critDamage', 5), flat('critChance', 1), flat('damageTaken', 2)] }),
];
