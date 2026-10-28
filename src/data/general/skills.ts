import type { EffectSpec } from '../../engine/effects/types';
import type { GeneralSkillDef } from '../../engine/skills/generalTypes';
import type { SkillDef } from '../../engine/skills/types';
import type { RarityId } from '../../engine/items/types';
import { flat, pct } from '../trees/builder';

/** General combat skills rank up to 10, so per-rank scaling is gentler than class skills. */
export function combat(s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef {
  return { ...s, source: 'general', maxRank: 10 };
}

export const dmg = (stat: 'physicalAttack' | 'magicAttack' | 'divinePower', multiplier: number, perRank = multiplier * 0.06, hits?: number) => ({
  stat,
  multiplier,
  perRank,
  ...(hits ? { hits } : {}),
});
export const status = (s: string, duration: number, chance?: number, target?: 'self' | 'target' | 'allEnemies' | 'allAllies'): EffectSpec => ({
  kind: 'applyStatus',
  status: s,
  duration,
  ...(chance !== undefined ? { chance } : {}),
  ...(target ? { target } : {}),
});

// ---------------------------------------------------------------- battle skills

export const GENERAL_COMBAT_SKILLS: SkillDef[] = [
  // Combat
  combat({ id: 'g-second-wind', name: 'Second Wind', description: 'Catch your breath: heal 20% of max HP.', tags: ['Heal', 'Buff'], element: 'physical', targeting: 'self', cost: {}, cooldown: 6, effects: [{ kind: 'heal', percentMaxHp: 20 }] }),
  combat({ id: 'g-cleave', name: 'Cleave', description: 'Sweep the enemy front row for 85% ATK.', tags: ['Attack', 'Melee', 'Physical', 'AoE'], element: 'physical', targeting: 'frontRow', cost: { mp: 6 }, cooldown: 2, damage: dmg('physicalAttack', 0.85) }),
  combat({ id: 'g-throw-dagger', name: 'Throw Dagger', description: 'Throw a dagger at any enemy for 80% ATK.', tags: ['Attack', 'Ranged', 'Projectile', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 3 }, cooldown: 1, damage: dmg('physicalAttack', 0.8) }),
  combat({ id: 'g-taunt', name: 'Taunt', description: 'Goad the enemy: they must target you for 2 turns. Gain +20% defense.', tags: ['Buff', 'Shout'], element: 'physical', targeting: 'self', cost: {}, cooldown: 4, effects: [status('taunt', 2), { kind: 'buff', id: 'g-taunt', duration: 2, modifiers: [{ stat: 'defense', type: 'percent', value: 20 }] }] }),
  combat({ id: 'g-power-attack', name: 'Power Attack', description: 'A heavy, telegraphed blow for 150% ATK.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 5 }, cooldown: 2, stagger: 1.5, damage: dmg('physicalAttack', 1.5) }),
  combat({ id: 'g-rend', name: 'Rend', description: 'A tearing cut for 70% ATK and 2 stacks of Bleed.', tags: ['Attack', 'Melee', 'Physical', 'DoT'], element: 'physical', targeting: 'enemy', cost: { mp: 4 }, cooldown: 2, damage: dmg('physicalAttack', 0.7), effects: [status('bleed', 3)] }),
  combat({ id: 'g-double-strike', name: 'Double Strike', description: 'Two quick strikes for 65% ATK each.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 5 }, cooldown: 1, damage: dmg('physicalAttack', 0.65, 0.04, 2) }),
  combat({ id: 'g-execute', name: 'Execute', description: 'A finishing blow for 120% ATK that always crits.', tags: ['Attack', 'Melee', 'Physical', 'Finisher'], element: 'physical', targeting: 'enemy', cost: { mp: 8 }, cooldown: 3, alwaysCrit: true, damage: dmg('physicalAttack', 1.2) }),
  combat({ id: 'g-kick', name: 'Kick', description: 'A boot to the face for 60% ATK that may Silence.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: {}, cooldown: 3, damage: dmg('physicalAttack', 0.6), effects: [status('silence', 1, 60)] }),
  combat({ id: 'g-charge', name: 'Charge', description: 'Charge any enemy, even in the back row, for 120% ATK. May Stun.', tags: ['Attack', 'Melee', 'Physical', 'Movement'], element: 'physical', targeting: 'enemy', cost: { mp: 6 }, cooldown: 3, damage: dmg('physicalAttack', 1.2), effects: [status('stun', 1, 25)] }),
  combat({ id: 'g-hamstring', name: 'Hamstring', description: 'A crippling cut for 60% ATK that Slows.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 3 }, cooldown: 2, damage: dmg('physicalAttack', 0.6), effects: [status('slow', 2)] }),
  combat({ id: 'g-disarm', name: 'Disarm', description: 'Knock the weapon aside: Weaken for 2 turns.', tags: ['Attack', 'Melee', 'Debuff'], element: 'physical', targeting: 'enemy', cost: { mp: 5 }, cooldown: 4, damage: dmg('physicalAttack', 0.4), effects: [status('weaken', 2)] }),
  combat({ id: 'g-feint', name: 'Feint', description: 'A false opening leaves the target Vulnerable.', tags: ['Attack', 'Melee', 'Debuff'], element: 'physical', targeting: 'enemy', cost: { mp: 4 }, cooldown: 3, damage: dmg('physicalAttack', 0.5), effects: [status('vulnerable', 2)] }),
  combat({ id: 'g-brace', name: 'Brace', description: 'Set your feet: +35% defense for 2 turns.', tags: ['Buff'], element: 'physical', targeting: 'self', cost: {}, cooldown: 4, effects: [{ kind: 'buff', id: 'g-brace', duration: 2, modifiers: [{ stat: 'defense', type: 'percent', value: 35 }] }] }),
  combat({ id: 'g-battle-cry', name: 'Battle Cry', description: 'A war cry: +15% damage for 3 turns.', tags: ['Buff', 'Shout'], element: 'physical', targeting: 'self', cost: {}, cooldown: 5, effects: [{ kind: 'buff', id: 'g-battle-cry', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }] }] }),
  combat({ id: 'g-parry', name: 'Parry', description: 'Ready your guard: +25% dodge for 1 turn.', tags: ['Buff'], element: 'physical', targeting: 'self', cost: {}, cooldown: 3, effects: [{ kind: 'buff', id: 'g-parry', duration: 1, modifiers: [{ stat: 'dodge', type: 'flat', value: 25 }] }] }),
  // Elemental
  combat({ id: 'g-spark', name: 'Spark', description: 'A crackling spark for 110% MAG lightning.', tags: ['Spell', 'Lightning'], element: 'lightning', targeting: 'enemy', cost: { mp: 5 }, cooldown: 0, damage: dmg('magicAttack', 1.1) }),
  combat({ id: 'g-frost-ring', name: 'Frost Ring', description: 'A ring of frost: 60% MAG ice to every enemy, Slowing them.', tags: ['Spell', 'Ice', 'AoE'], element: 'ice', targeting: 'allEnemies', cost: { mp: 12 }, cooldown: 3, damage: dmg('magicAttack', 0.6), effects: [status('slow', 2)] }),
  combat({ id: 'g-stone-skin', name: 'Stone Skin', description: 'Harden your skin: +40% defense for 3 turns.', tags: ['Spell', 'Buff', 'Nature'], element: 'nature', targeting: 'self', cost: { mp: 8 }, cooldown: 5, effects: [{ kind: 'buff', id: 'g-stone-skin', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 40 }] }] }),
  combat({ id: 'g-flame-jet', name: 'Flame Jet', description: 'A jet of fire for 100% MAG that may Burn.', tags: ['Spell', 'Fire'], element: 'fire', targeting: 'enemy', cost: { mp: 6 }, cooldown: 0, damage: dmg('magicAttack', 1), effects: [status('burn', 2, 40)] }),
  combat({ id: 'g-snowball', name: 'Snowball', description: 'A cheap, cold surprise: 70% MAG ice and Slow.', tags: ['Spell', 'Ice', 'Projectile'], element: 'ice', targeting: 'enemy', cost: { mp: 3 }, cooldown: 1, damage: dmg('magicAttack', 0.7), effects: [status('slow', 1)] }),
  combat({ id: 'g-acid-splash', name: 'Acid Splash', description: '80% MAG nature damage that leaves the target Vulnerable.', tags: ['Spell', 'Nature', 'Poison'], element: 'nature', targeting: 'enemy', cost: { mp: 7 }, cooldown: 2, damage: dmg('magicAttack', 0.8), effects: [status('vulnerable', 2, 60)] }),
  combat({ id: 'g-umbral-bolt', name: 'Umbral Bolt', description: 'A bolt of shadow for 115% MAG.', tags: ['Spell', 'Shadow', 'Projectile'], element: 'shadow', targeting: 'enemy', cost: { mp: 6 }, cooldown: 0, damage: dmg('magicAttack', 1.15) }),
  combat({ id: 'g-arcane-blast', name: 'Arcane Blast', description: 'Raw arcane force for 140% MAG.', tags: ['Spell', 'Arcane'], element: 'arcane', targeting: 'enemy', cost: { mp: 10 }, cooldown: 2, damage: dmg('magicAttack', 1.4) }),
  combat({ id: 'g-earthquake', name: 'Earthquake', description: 'The ground heaves: 70% MAG physical to every enemy, may Stun.', tags: ['Spell', 'Physical', 'AoE'], element: 'physical', targeting: 'allEnemies', cost: { mp: 16 }, cooldown: 4, stagger: 1.5, damage: dmg('magicAttack', 0.7), effects: [status('stun', 1, 15)] }),
  combat({ id: 'g-lightning-rod', name: 'Lightning Rod', description: 'Soak the target (Wet), then strike it with 80% MAG lightning.', tags: ['Spell', 'Lightning'], element: 'lightning', targeting: 'enemy', cost: { mp: 8 }, cooldown: 3, damage: dmg('magicAttack', 0.8), effects: [status('wet', 2)] }),
  combat({ id: 'g-fire-shield', name: 'Fire Shield', description: 'Wreathe yourself in flame: +30% fire resist and a shield worth 80% MAG.', tags: ['Spell', 'Fire', 'Buff'], element: 'fire', targeting: 'self', cost: { mp: 10 }, cooldown: 5, effects: [{ kind: 'shield', scaling: { stat: 'magicAttack', ratio: 0.8 } }, { kind: 'buff', id: 'g-fire-shield', duration: 3, modifiers: [{ stat: 'fireResist', type: 'flat', value: 30 }] }] }),
  combat({ id: 'g-mana-spring', name: 'Mana Spring', description: 'Draw on the ley lines: restore 30 MP.', tags: ['Spell', 'Arcane'], element: 'arcane', targeting: 'self', cost: {}, cooldown: 5, effects: [{ kind: 'restoreMp', amount: 30 }] }),
  combat({ id: 'g-elemental-ward', name: 'Elemental Ward', description: '+25% fire, ice and lightning resist for 3 turns.', tags: ['Spell', 'Buff', 'Arcane'], element: 'arcane', targeting: 'self', cost: { mp: 8 }, cooldown: 5, effects: [{ kind: 'buff', id: 'g-elemental-ward', duration: 3, modifiers: [{ stat: 'fireResist', type: 'flat', value: 25 }, { stat: 'iceResist', type: 'flat', value: 25 }, { stat: 'lightningResist', type: 'flat', value: 25 }] }] }),
  combat({ id: 'g-ember-rain', name: 'Ember Rain', description: 'Embers fall on random enemies: 3 strikes of 50% MAG fire.', tags: ['Spell', 'Fire', 'AoE'], element: 'fire', targeting: 'randomEnemies', cost: { mp: 10 }, cooldown: 2, damage: dmg('magicAttack', 0.5, 0.03, 3) }),
  combat({ id: 'g-thornburst', name: 'Thornburst', description: 'Thorns erupt under the front row: 75% MAG nature, may Poison.', tags: ['Spell', 'Nature', 'AoE'], element: 'nature', targeting: 'frontRow', cost: { mp: 9 }, cooldown: 2, damage: dmg('magicAttack', 0.75), effects: [status('poison', 3, 40)] }),
  // Utility
  combat({ id: 'g-pickpocket', name: 'Pickpocket', description: 'Lift gold from an enemy while striking for 30% ATK. Most foes can be robbed once; bosses cannot. Counts toward the thief’s secret.', tags: ['Attack', 'Melee'], element: 'physical', targeting: 'enemy', cost: {}, cooldown: 3, damage: dmg('physicalAttack', 0.3, 0.01), effects: [{ kind: 'steal', gold: 20 }] }),
  combat({ id: 'g-sprint', name: 'Sprint', description: 'Haste yourself for 2 turns.', tags: ['Buff', 'Movement'], element: 'physical', targeting: 'self', cost: {}, cooldown: 5, effects: [status('haste', 2)] }),
  combat({ id: 'g-smoke-screen', name: 'Smoke Screen', description: 'Blind every enemy (60% chance).', tags: ['Debuff', 'AoE'], element: 'physical', targeting: 'allEnemies', cost: { mp: 8 }, cooldown: 5, effects: [status('blind', 2, 60)] }),
  combat({ id: 'g-disguise', name: 'Disguise', description: 'Blend in: Stealth for 2 turns.', tags: ['Buff'], element: 'physical', targeting: 'self', cost: { mp: 6 }, cooldown: 6, effects: [status('stealth', 2)] }),
  combat({ id: 'g-distraction', name: 'Distraction', description: 'A clever trick that may Charm the target into attacking its allies.', tags: ['Debuff'], element: 'arcane', targeting: 'enemy', cost: { mp: 8 }, cooldown: 5, effects: [status('charm', 1, 45)] }),
  // Survival
  combat({ id: 'g-first-aid', name: 'First Aid', description: 'Patch up an ally: heal 18% of max HP and stop Bleeding.', tags: ['Heal'], element: 'nature', targeting: 'ally', cost: {}, cooldown: 3, effects: [{ kind: 'heal', percentMaxHp: 18 }, { kind: 'removeStatus', status: 'bleed' }] }),
  combat({ id: 'g-bandage', name: 'Bandage', description: 'Bind your wounds: Regen for 3 turns.', tags: ['Heal'], element: 'nature', targeting: 'self', cost: {}, cooldown: 4, effects: [status('regen', 3)] }),
  combat({ id: 'g-herbal-remedy', name: 'Herbal Remedy', description: 'Cure Poison and Curse, and heal 8% of max HP.', tags: ['Heal', 'Nature'], element: 'nature', targeting: 'self', cost: { mp: 4 }, cooldown: 3, effects: [{ kind: 'removeStatus', status: 'poison' }, { kind: 'removeStatus', status: 'curse' }, { kind: 'heal', percentMaxHp: 8 }] }),
];

// ---------------------------------------------------------------- general skills

type Spec = Omit<GeneralSkillDef, 'maxRank' | 'rarity'> & { rarity?: RarityId; maxRank?: number };

/** Ranks 1-10 unless a skill has nothing to scale (a single-rank flag). */
const C = (s: Spec): GeneralSkillDef => ({ rarity: 'common', maxRank: 10, ...s });

export const GENERAL_SKILLS: GeneralSkillDef[] = [
  // ---- Combat (18) ----
  C({ id: 'second-wind', name: 'Second Wind', category: 'combat', description: 'A battle heal you can use without MP.', combatSkill: 'g-second-wind' }),
  C({ id: 'cleave', name: 'Cleave', category: 'combat', description: 'Hit the whole front row.', combatSkill: 'g-cleave' }),
  C({ id: 'throw-dagger', name: 'Throw Dagger', category: 'combat', description: 'A ranged attack for melee fighters.', combatSkill: 'g-throw-dagger' }),
  C({ id: 'taunt', name: 'Taunt', category: 'combat', rarity: 'uncommon', description: 'Force enemies to attack you.', combatSkill: 'g-taunt' }),
  C({ id: 'power-attack', name: 'Power Attack', category: 'combat', description: 'One heavy blow.', combatSkill: 'g-power-attack' }),
  C({ id: 'rend', name: 'Rend', category: 'combat', rarity: 'uncommon', description: 'Bleed your enemies.', combatSkill: 'g-rend' }),
  C({ id: 'double-strike', name: 'Double Strike', category: 'combat', rarity: 'uncommon', description: 'Two quick blows.', combatSkill: 'g-double-strike' }),
  C({ id: 'execute', name: 'Execute', category: 'combat', rarity: 'rare', description: 'A guaranteed critical hit.', combatSkill: 'g-execute', requirements: { level: 12 } }),
  C({ id: 'kick', name: 'Kick', category: 'combat', description: 'Interrupt casters with a Silence.', combatSkill: 'g-kick' }),
  C({ id: 'charge', name: 'Charge', category: 'combat', rarity: 'uncommon', description: 'Reach the back row.', combatSkill: 'g-charge' }),
  C({ id: 'hamstring', name: 'Hamstring', category: 'combat', description: 'Slow the fast ones down.', combatSkill: 'g-hamstring' }),
  C({ id: 'disarm', name: 'Disarm', category: 'combat', rarity: 'uncommon', description: 'Weaken a dangerous foe.', combatSkill: 'g-disarm' }),
  C({ id: 'feint', name: 'Feint', category: 'combat', rarity: 'uncommon', description: 'Set up a big hit with Vulnerable.', combatSkill: 'g-feint' }),
  C({ id: 'brace', name: 'Brace', category: 'combat', description: 'A quick defensive stance.', combatSkill: 'g-brace' }),
  C({ id: 'battle-cry', name: 'Battle Cry', category: 'combat', rarity: 'uncommon', description: 'A short damage boost.', combatSkill: 'g-battle-cry' }),
  C({ id: 'parry', name: 'Parry', category: 'combat', description: 'Dodge the next blow.', combatSkill: 'g-parry' }),
  C({ id: 'weapon-mastery', name: 'Weapon Mastery', category: 'combat', rarity: 'rare', description: 'Passive: +2% physical attack per rank.', passive: [pct('physicalAttack', 2)], requirements: { level: 8 } }),
  C({ id: 'combat-reflexes', name: 'Combat Reflexes', category: 'combat', rarity: 'rare', description: 'Passive: +0.5 crit chance and +0.4 dodge per rank.', passive: [flat('critChance', 0.5), flat('dodge', 0.4)], requirements: { level: 10 } }),
  // ---- Elemental (16) ----
  C({ id: 'spark', name: 'Spark', category: 'elemental', description: 'A basic lightning spell.', combatSkill: 'g-spark' }),
  C({ id: 'frost-ring', name: 'Frost Ring', category: 'elemental', rarity: 'uncommon', description: 'Slow every enemy.', combatSkill: 'g-frost-ring' }),
  C({ id: 'stone-skin', name: 'Stone Skin', category: 'elemental', description: 'Turn your skin to stone.', combatSkill: 'g-stone-skin' }),
  C({ id: 'flame-jet', name: 'Flame Jet', category: 'elemental', description: 'A basic fire spell.', combatSkill: 'g-flame-jet' }),
  C({ id: 'snowball', name: 'Snowball', category: 'elemental', description: 'A cheap, slowing spell.', combatSkill: 'g-snowball' }),
  C({ id: 'acid-splash', name: 'Acid Splash', category: 'elemental', rarity: 'uncommon', description: 'Melt armor with acid.', combatSkill: 'g-acid-splash' }),
  C({ id: 'umbral-bolt', name: 'Umbral Bolt', category: 'elemental', rarity: 'uncommon', description: 'A basic shadow spell.', combatSkill: 'g-umbral-bolt' }),
  C({ id: 'arcane-blast', name: 'Arcane Blast', category: 'elemental', rarity: 'rare', description: 'A powerful arcane spell.', combatSkill: 'g-arcane-blast', requirements: { stats: { int: 20 } } }),
  C({ id: 'earthquake', name: 'Earthquake', category: 'elemental', rarity: 'epic', description: 'Shake every enemy.', combatSkill: 'g-earthquake', requirements: { level: 20, stats: { int: 30 } } }),
  C({ id: 'lightning-rod', name: 'Lightning Rod', category: 'elemental', rarity: 'rare', description: 'Soak and shock in one cast.', combatSkill: 'g-lightning-rod' }),
  C({ id: 'fire-shield', name: 'Fire Shield', category: 'elemental', rarity: 'rare', description: 'A flaming shield.', combatSkill: 'g-fire-shield' }),
  C({ id: 'mana-spring', name: 'Mana Spring', category: 'elemental', rarity: 'uncommon', description: 'Restore MP in battle.', combatSkill: 'g-mana-spring' }),
  C({ id: 'elemental-ward', name: 'Elemental Ward', category: 'elemental', rarity: 'rare', description: 'Resist the elements.', combatSkill: 'g-elemental-ward' }),
  C({ id: 'ember-rain', name: 'Ember Rain', category: 'elemental', rarity: 'rare', description: 'Fire rains on random foes.', combatSkill: 'g-ember-rain' }),
  C({ id: 'thornburst', name: 'Thornburst', category: 'elemental', rarity: 'uncommon', description: 'Thorns under the front row.', combatSkill: 'g-thornburst' }),
  C({ id: 'elemental-affinity', name: 'Elemental Affinity', category: 'elemental', rarity: 'epic', description: 'Passive: +2% fire, ice and lightning damage per rank.', passive: [flat('fireDamage', 2), flat('iceDamage', 2), flat('lightningDamage', 2)], requirements: { level: 15 } }),
  // ---- Utility (17) ----
  C({ id: 'appraise', name: 'Appraise', category: 'utility', rarity: 'uncommon', description: 'Identify items without scrolls. Higher ranks identify rarer items (Epic at rank 1, Legendary at 2, Mythic at 6, Relic at 10). Passive: +1% magic find per rank.', passive: [flat('magicFind', 1)], utility: { kind: 'appraise', perRank: 1 } }),
  C({ id: 'pickpocket', name: 'Pickpocket', category: 'utility', description: 'Steal gold from enemies in battle.', combatSkill: 'g-pickpocket' }),
  C({ id: 'sprint', name: 'Sprint', category: 'utility', description: 'A burst of speed in battle. Passive: +0.5 speed per rank.', combatSkill: 'g-sprint', passive: [flat('speed', 0.5)] }),
  C({ id: 'smoke-screen', name: 'Smoke Screen', category: 'utility', rarity: 'uncommon', description: 'Blind every enemy.', combatSkill: 'g-smoke-screen' }),
  C({ id: 'disguise', name: 'Disguise', category: 'utility', rarity: 'rare', description: 'Vanish from sight.', combatSkill: 'g-disguise' }),
  C({ id: 'distraction', name: 'Distraction', category: 'utility', rarity: 'rare', description: 'Turn an enemy against its friends.', combatSkill: 'g-distraction' }),
  C({ id: 'treasure-hunter', name: 'Treasure Hunter', category: 'utility', rarity: 'rare', description: 'Passive: +3% gold find and +2% magic find per rank.', passive: [flat('goldFind', 3), flat('magicFind', 2)] }),
  C({ id: 'lucky-star', name: 'Lucky Star', category: 'utility', rarity: 'uncommon', description: 'Passive: +1 LUK per rank.', passive: [flat('luk', 1)] }),
  C({ id: 'fast-learner', name: 'Fast Learner', category: 'utility', rarity: 'rare', description: 'Passive: +2% XP per rank.', passive: [flat('xpGain', 2)] }),
  C({ id: 'haggle', name: 'Haggle', category: 'utility', description: 'Buy for 1% less and sell for 2% more per rank.', utility: { kind: 'haggle', perRank: 1 } }),
  C({ id: 'lockpicking', name: 'Lockpicking', category: 'utility', rarity: 'uncommon', description: 'Open locked chests without a key: 10% chance per rank (100% at rank 10); a failed attempt can be retried after a battle.', utility: { kind: 'lockpicking', perRank: 10 } }),
  C({ id: 'detect-traps', name: 'Detect Traps', category: 'utility', description: 'Spot and disarm chest traps: 10% chance per rank.', utility: { kind: 'detectTraps', perRank: 10 } }),
  C({ id: 'scavenging', name: 'Scavenging', category: 'utility', description: 'After a victory, 6% chance per rank to scavenge extra materials.', utility: { kind: 'scavenging', perRank: 6 } }),
  C({ id: 'tinkering', name: 'Tinkering', category: 'utility', rarity: 'uncommon', description: 'Gear has an 8% chance per rank to take no wear in a battle.', utility: { kind: 'tinkering', perRank: 8 } }),
  C({ id: 'quick-hands', name: 'Quick Hands', category: 'utility', rarity: 'uncommon', description: 'Passive: +0.5% cooldown reduction per rank.', passive: [flat('cooldownReduction', 0.5)] }),
  C({ id: 'keen-eye', name: 'Keen Eye', category: 'utility', description: 'Passive: +1 accuracy per rank.', passive: [flat('accuracy', 1)] }),
  C({ id: 'silver-tongue', name: 'Silver Tongue', category: 'utility', rarity: 'rare', description: 'Passive: +3% favor gain per rank.', passive: [flat('favorGain', 3)] }),
  // ---- Survival (15) ----
  C({ id: 'first-aid', name: 'First Aid', category: 'survival', description: 'Heal an ally and stop Bleeding.', combatSkill: 'g-first-aid' }),
  C({ id: 'bandage', name: 'Bandage', category: 'survival', description: 'Regenerate over a few turns.', combatSkill: 'g-bandage' }),
  C({ id: 'herbal-remedy', name: 'Herbal Remedy', category: 'survival', rarity: 'uncommon', description: 'Cure Poison and Curse.', combatSkill: 'g-herbal-remedy' }),
  C({ id: 'foraging', name: 'Foraging', category: 'survival', description: 'After a victory, 8% chance per rank to forage herbs.', utility: { kind: 'foraging', perRank: 8 } }),
  C({ id: 'camping', name: 'Camping', category: 'survival', rarity: 'uncommon', description: 'Rest faster at camp (-30 minutes per rank) and wake Well Rested (+1% damage per rank for 3 battles).', utility: { kind: 'camping', perRank: 1 } }),
  C({ id: 'armor-training', name: 'Armor Training', category: 'survival', rarity: 'rare', maxRank: 1, description: 'Wear any armor your classes allow without the off-class speed penalty.', flags: ['armorTraining'], requirements: { level: 15 } }),
  C({ id: 'toughness', name: 'Toughness', category: 'survival', description: 'Passive: +2% max HP per rank.', passive: [pct('maxHp', 2)] }),
  C({ id: 'endurance', name: 'Endurance', category: 'survival', description: 'Passive: +2 HP regeneration per rank.', passive: [flat('hpRegen', 2)] }),
  C({ id: 'iron-stomach', name: 'Iron Stomach', category: 'survival', description: 'Passive: +3% nature resist per rank.', passive: [flat('natureResist', 3)] }),
  C({ id: 'cold-blooded', name: 'Cold Resistance', category: 'survival', description: 'Passive: +3% ice resist per rank.', passive: [flat('iceResist', 3)] }),
  C({ id: 'fire-walker', name: 'Fire Walker', category: 'survival', description: 'Passive: +3% fire resist per rank.', passive: [flat('fireResist', 3)] }),
  C({ id: 'survival-instinct', name: 'Survival Instinct', category: 'survival', rarity: 'rare', description: 'Passive: +1.5% status resist per rank.', passive: [flat('statusResist', 1.5)] }),
  C({ id: 'tracker', name: 'Tracker', category: 'survival', rarity: 'uncommon', description: 'Passive: +2% damage against beasts per rank.', passive: [flat('damageBonus', 2, { kind: 'targetType', enemyType: 'beast' })] }),
  C({ id: 'monster-hunter', name: 'Monster Hunter', category: 'survival', rarity: 'epic', description: 'Passive: +2% damage against undead, plants and constructs per rank.', passive: [flat('damageBonus', 2, { kind: 'any', of: ['undead', 'plant', 'construct'].map((t) => ({ kind: 'targetType' as const, enemyType: t })) })], requirements: { level: 15 } }),
  C({ id: 'meditation-practice', name: 'Meditation', category: 'survival', rarity: 'uncommon', description: 'Passive: +1 MP regeneration per rank.', passive: [flat('mpRegen', 1)] }),
];
