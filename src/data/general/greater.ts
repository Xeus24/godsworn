import type { GeneralSkillDef } from '../../engine/skills/generalTypes';
import type { RarityId } from '../../engine/items/types';
import type { SkillDef } from '../../engine/skills/types';
import { flat, pct } from '../trees/builder';
import { combat, dmg, status } from './skills';

type Spec = Omit<GeneralSkillDef, 'maxRank' | 'rarity'> & { rarity?: RarityId; maxRank?: number };
const G = (s: Spec): GeneralSkillDef => ({ rarity: 'uncommon', maxRank: 10, ...s });
const buff = (id: string, duration: number, modifiers: { stat: never | string; type: 'flat' | 'percent' | 'more'; value: number }[], target: 'self' | 'allAllies' = 'self') =>
  ({ kind: 'buff' as const, id, duration, modifiers: modifiers as never, target });

// ---------------------------------------------------------------- battle skills

export const GREATER_GENERAL_COMBAT: SkillDef[] = [
  // Defensive
  combat({ id: 'g-shield-wall', name: 'Shield Wall', description: 'Take 35% less damage for 2 turns and draw every attack.', tags: ['Buff', 'Defensive'], element: 'physical', targeting: 'self', cost: { mp: 6 }, cooldown: 5, effects: [buff('g-shield-wall', 2, [{ stat: 'damageTaken', type: 'more', value: -35 }]), status('taunt', 2)] }),
  combat({ id: 'g-fortify', name: 'Fortify', description: 'Shield yourself for 25% of max HP.', tags: ['Buff', 'Defensive'], element: 'physical', targeting: 'self', cost: { mp: 8 }, cooldown: 5, effects: [{ kind: 'shield', percentMaxHp: 25 }] }),
  combat({ id: 'g-deflect', name: 'Deflect', description: 'Ward against spells: +60% magic resist and +30% dodge for 2 turns.', tags: ['Buff', 'Defensive', 'Arcane'], element: 'arcane', targeting: 'self', cost: { mp: 6 }, cooldown: 4, effects: [buff('g-deflect', 2, [{ stat: 'magicResist', type: 'percent', value: 60 }, { stat: 'dodge', type: 'flat', value: 30 }])] }),
  combat({ id: 'g-rally', name: 'Rally', description: 'Heal the party for 10% of max HP and give +10% defense for 3 turns.', tags: ['Heal', 'Buff', 'Shout', 'AoE'], element: 'holy', targeting: 'allAllies', cost: { mp: 10 }, cooldown: 5, effects: [{ kind: 'heal', percentMaxHp: 10, target: 'allAllies' }, buff('g-rally', 3, [{ stat: 'defense', type: 'percent', value: 10 }], 'allAllies')] }),
  combat({ id: 'g-stand-firm', name: 'Stand Firm', description: 'Cleanse Stun, Slow and Fear and resist further status effects (+40%) for 2 turns.', tags: ['Buff', 'Defensive'], element: 'physical', targeting: 'self', cost: { mp: 5 }, cooldown: 5, effects: [{ kind: 'removeStatus', status: 'stun', target: 'self' }, { kind: 'removeStatus', status: 'slow', target: 'self' }, { kind: 'removeStatus', status: 'fear', target: 'self' }, buff('g-stand-firm', 2, [{ stat: 'statusResist', type: 'flat', value: 40 }])] }),
  // Lost arts
  combat({ id: 'g-moonlit-step', name: 'Moonlit Step', description: 'The old elven dance: Haste for 2 turns and +40% dodge.', tags: ['Buff', 'Movement'], element: 'arcane', targeting: 'self', cost: { mp: 6 }, cooldown: 5, effects: [status('haste', 2), buff('g-moonlit-step', 2, [{ stat: 'dodge', type: 'flat', value: 40 }])] }),
  combat({ id: 'g-ancestral-roar', name: 'Ancestral Roar', description: 'The party gains +20% damage for 3 turns and every enemy may Fear (40%).', tags: ['Buff', 'Shout', 'AoE'], element: 'physical', targeting: 'allAllies', cost: { mp: 8 }, cooldown: 6, effects: [buff('g-ancestral-roar', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies'), { kind: 'applyStatus', status: 'fear', duration: 1, chance: 40, target: 'allEnemies' }] }),
  combat({ id: 'g-feral-rend', name: 'Feral Rend', description: 'Three raking blows for 55% ATK each; they Bleed.', tags: ['Attack', 'Melee', 'Physical', 'DoT'], element: 'physical', targeting: 'enemy', cost: { mp: 6 }, cooldown: 3, damage: dmg('physicalAttack', 0.55, 0.04, 3), effects: [status('bleed', 3)] }),
  combat({ id: 'g-halo-flicker', name: 'Halo Flicker', description: 'A nephilim’s halo flares: shield yourself for 15% and Blind every enemy (50%).', tags: ['Buff', 'Holy', 'AoE'], element: 'holy', targeting: 'self', cost: { mp: 8 }, cooldown: 5, effects: [{ kind: 'shield', percentMaxHp: 15 }, { kind: 'applyStatus', status: 'blind', duration: 2, chance: 50, target: 'allEnemies' }] }),
  combat({ id: 'g-glamour', name: 'Glamour', description: 'A fae trick: Charm an enemy (50%) and vanish into Stealth.', tags: ['Debuff', 'Arcane'], element: 'arcane', targeting: 'enemy', cost: { mp: 8 }, cooldown: 5, effects: [status('charm', 1, 50), status('stealth', 2, undefined, 'self')] }),
  combat({ id: 'g-phalanx-drill', name: 'Phalanx Drill', description: 'Soldier’s drill: the party takes 15% less damage and gains +10% defense for 3 turns.', tags: ['Buff', 'Defensive', 'AoE'], element: 'physical', targeting: 'allAllies', cost: { mp: 8 }, cooldown: 5, effects: [buff('g-phalanx-drill', 3, [{ stat: 'damageTaken', type: 'more', value: -15 }, { stat: 'defense', type: 'percent', value: 10 }], 'allAllies')] }),
  // Legendary techniques
  combat({ id: 'g-rime-lance', name: 'Rime Lance', description: 'A lance of drake-frost: 260% MAG ice damage; Freeze (35%).', tags: ['Spell', 'Ice'], element: 'ice', targeting: 'enemy', cost: { mp: 20 }, cooldown: 6, damage: dmg('magicAttack', 2.6, 0.12), effects: [status('freeze', 1, 35)] }),
  combat({ id: 'g-tempest-call', name: 'Tempest Call', description: 'Call the eye of the storm: 140% MAG lightning to every enemy; Stun (25%).', tags: ['Spell', 'Lightning', 'AoE'], element: 'lightning', targeting: 'allEnemies', cost: { mp: 24 }, cooldown: 7, damage: dmg('magicAttack', 1.4, 0.08), effects: [status('stun', 1, 25)] }),
  combat({ id: 'g-ember-breath', name: 'Ember Breath', description: 'A cone of drake-fire: 150% MAG fire to every enemy; Burn.', tags: ['Spell', 'Fire', 'AoE'], element: 'fire', targeting: 'allEnemies', cost: { mp: 24 }, cooldown: 7, damage: dmg('magicAttack', 1.5, 0.08), effects: [status('burn', 3)] }),
  combat({ id: 'g-grave-bargain', name: 'Grave Bargain', description: 'A king’s bargain: 220% MAG shadow damage; heal for 12% of max HP; Curse.', tags: ['Spell', 'Shadow'], element: 'shadow', targeting: 'enemy', cost: { mp: 20 }, cooldown: 6, damage: dmg('magicAttack', 2.2, 0.1), effects: [{ kind: 'heal', percentMaxHp: 12, target: 'self' }, status('curse', 3)] }),
  combat({ id: 'g-crimson-tithe', name: 'Crimson Tithe', description: 'Take what the pages are owed: 200% ATK physical damage; heal for 15% of max HP.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 16 }, cooldown: 6, damage: dmg('physicalAttack', 2, 0.1), effects: [{ kind: 'heal', percentMaxHp: 15, target: 'self' }] }),
  combat({ id: 'g-fiftieth-mark', name: 'The Fiftieth Mark', description: 'Never seen, never counted: 230% ATK physical that always crits.', tags: ['Attack', 'Melee', 'Physical', 'Finisher'], element: 'physical', targeting: 'enemy', cost: { mp: 16 }, cooldown: 6, alwaysCrit: true, damage: dmg('physicalAttack', 2.3, 0.1) }),
  combat({ id: 'g-all-beds', name: 'Every Bed in the World', description: 'Everyone lies down: every enemy may fall Stunned (50%) and you recover 15% of max HP.', tags: ['Debuff', 'AoE', 'Arcane'], element: 'arcane', targeting: 'allEnemies', cost: { mp: 20 }, cooldown: 7, effects: [status('stun', 2, 50), { kind: 'heal', percentMaxHp: 15, target: 'self' }] }),
  combat({ id: 'g-last-tableau', name: 'The Last Tableau', description: 'The final scene: 120% ATK to every enemy, Charmed (35%) and Slowed.', tags: ['Attack', 'AoE', 'Arcane'], element: 'arcane', targeting: 'allEnemies', cost: { mp: 22 }, cooldown: 7, damage: dmg('physicalAttack', 1.2, 0.07), effects: [status('charm', 1, 35), status('slow', 2)] }),
  combat({ id: 'g-riddle-crown', name: 'Riddle of the Crown', description: 'Ask the question nobody answers: 180% MAG void damage; Silence and Weaken.', tags: ['Spell', 'Void'], element: 'void', targeting: 'enemy', cost: { mp: 18 }, cooldown: 6, damage: dmg('magicAttack', 1.8, 0.1), effects: [status('silence', 2), status('weaken', 2)] }),
  combat({ id: 'g-empty-court', name: 'The Empty Court', description: 'A court of nothing bows: 110% ATK void to every enemy and Fear.', tags: ['Attack', 'AoE', 'Void'], element: 'void', targeting: 'allEnemies', cost: { mp: 22 }, cooldown: 7, damage: dmg('physicalAttack', 1.1, 0.07), effects: [status('fear', 2)] }),
  // Grimoire pages for classes whose own skills spend a class resource
  combat({ id: 'g-hurled-flask', name: 'Hurled Flask', description: 'The alchemist’s staple: a flask of fire for 140% MAG fire damage; Burn.', tags: ['Spell', 'Fire', 'Projectile'], element: 'fire', targeting: 'enemy', cost: { mp: 10 }, cooldown: 2, damage: dmg('magicAttack', 1.4, 0.09), effects: [status('burn', 3)] }),
  combat({ id: 'g-wild-bloom', name: 'Wild Bloom', description: 'The druid’s favorite: a bloom that mends. Heal an ally for 120% MAG and Regenerate.', tags: ['Heal', 'Nature'], element: 'nature', targeting: 'ally', cost: { mp: 10 }, cooldown: 2, heal: dmg('magicAttack', 1.2, 0.08), effects: [status('regen', 3)] }),
  // Masters
  combat({ id: 'g-iron-lotus', name: 'Iron Lotus', description: 'Master Ren’s lesson: strike 4 times for 45% ATK each; each hit may Stun (10%).', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 10 }, cooldown: 4, damage: dmg('physicalAttack', 0.45, 0.04, 4), effects: [status('stun', 1, 10)] }),
  combat({ id: 'g-pale-flame', name: 'Pale Flame', description: 'A cold fire that does not warm: 190% MAG fire; ignores half of the target’s magic resist.', tags: ['Spell', 'Fire'], element: 'fire', targeting: 'enemy', cost: { mp: 14 }, cooldown: 4, damage: dmg('magicAttack', 1.9, 0.1), effects: [status('burn', 2)] }),
  combat({ id: 'g-hushed-arrow', name: 'Hushed Arrow', description: 'Loosed between heartbeats: 210% ATK physical from Stealth; Blind.', tags: ['Attack', 'Ranged', 'Projectile', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 12 }, cooldown: 4, damage: dmg('physicalAttack', 2.1, 0.1), effects: [status('blind', 2)] }),
  combat({ id: 'g-tide-turned', name: 'Tide Turned', description: 'Fisherwoman’s trick: heal the party for 14% and Cleanse Slow and Curse.', tags: ['Heal', 'AoE', 'Nature'], element: 'nature', targeting: 'allAllies', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'heal', percentMaxHp: 14, target: 'allAllies' }, { kind: 'removeStatus', status: 'slow', target: 'allAllies' }, { kind: 'removeStatus', status: 'curse', target: 'allAllies' }] }),
  combat({ id: 'g-dwarven-reckoning', name: 'Dwarven Reckoning', description: 'A debt, repaid in stone: 240% ATK physical; heavy stagger.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: { mp: 12 }, cooldown: 4, stagger: 2, damage: dmg('physicalAttack', 2.4, 0.1) }),
  combat({ id: 'g-saints-patience', name: 'Saint’s Patience', description: 'A prayer held for ten years: heal the party for 20% and shield them for 10%.', tags: ['Heal', 'Holy', 'AoE'], element: 'holy', targeting: 'allAllies', cost: { mp: 18 }, cooldown: 6, effects: [{ kind: 'heal', percentMaxHp: 20, target: 'allAllies' }, { kind: 'shield', percentMaxHp: 10, target: 'allAllies' }] }),
  combat({ id: 'g-wolf-pact', name: 'Wolf Pact', description: 'A wolf of the old pack fights beside you.', tags: ['Summon', 'Pet', 'Nature'], element: 'nature', targeting: 'self', cost: { mp: 12 }, cooldown: 5, effects: [{ kind: 'summon', summonId: 'wolf-companion' }] }),
  combat({ id: 'g-drowned-bell', name: 'The Drowned Bell', description: 'A bell tolls under the sea: 100% MAG shadow to every enemy; Silence (50%).', tags: ['Spell', 'Shadow', 'AoE'], element: 'shadow', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 5, damage: dmg('magicAttack', 1, 0.06), effects: [status('silence', 2, 50)] }),
];

// ---------------------------------------------------------------- general skills

export const GREATER_GENERAL_SKILLS: GeneralSkillDef[] = [
  // ---- Defensive (14) ----
  G({ id: 'shield-wall', name: 'Shield Wall', category: 'defensive', description: 'Take less damage and draw attacks.', combatSkill: 'g-shield-wall' }),
  G({ id: 'fortify', name: 'Fortify', category: 'defensive', description: 'A shield from nowhere.', combatSkill: 'g-fortify', rarity: 'common' }),
  G({ id: 'deflect', name: 'Deflect', category: 'defensive', description: 'Turn spells aside.', combatSkill: 'g-deflect', rarity: 'rare' }),
  G({ id: 'rally', name: 'Rally', category: 'defensive', description: 'Heal and harden the party.', combatSkill: 'g-rally', rarity: 'rare' }),
  G({ id: 'stand-firm', name: 'Stand Firm', category: 'defensive', description: 'Shrug off crowd control.', combatSkill: 'g-stand-firm' }),
  G({ id: 'plate-discipline', name: 'Plate Discipline', category: 'defensive', description: 'Passive: +2% defense per rank.', passive: [pct('defense', 2)], rarity: 'common' }),
  G({ id: 'ward-mastery', name: 'Ward Mastery', category: 'defensive', description: 'Passive: +2% magic resist per rank.', passive: [pct('magicResist', 2)] }),
  G({ id: 'shrug-it-off', name: 'Shrug It Off', category: 'defensive', description: 'Passive: -0.5% damage taken per rank.', passive: [flat('damageTaken', -0.5)], rarity: 'rare', requirements: { level: 10 } }),
  G({ id: 'dodge-training', name: 'Dodge Training', category: 'defensive', description: 'Passive: +0.6 dodge per rank.', passive: [flat('dodge', 0.6)] }),
  G({ id: 'second-skin', name: 'Second Skin', category: 'defensive', description: 'Passive: +2% status resist per rank.', passive: [flat('statusResist', 2)] }),
  G({ id: 'bulwark-training', name: 'Bulwark Training', category: 'defensive', description: 'Passive: +1.5% max HP and +1% defense per rank.', passive: [pct('maxHp', 1.5), pct('defense', 1)], rarity: 'rare' }),
  G({ id: 'hardened-will', name: 'Hardened Will', category: 'defensive', description: 'Passive: +1.5% status resist and +0.5 MP regeneration per rank.', passive: [flat('statusResist', 1.5), flat('mpRegen', 0.5)], rarity: 'rare' }),
  G({ id: 'unbroken', name: 'Unbroken', category: 'defensive', description: 'Passive: +3 HP regeneration and +1% max HP per rank.', passive: [flat('hpRegen', 3), pct('maxHp', 1)], rarity: 'epic', requirements: { level: 20 } }),
  G({ id: 'elemental-bulwark', name: 'Elemental Bulwark', category: 'defensive', description: 'Passive: +1.5% resistance to fire, ice and lightning per rank.', passive: [flat('fireResist', 1.5), flat('iceResist', 1.5), flat('lightningResist', 1.5)], rarity: 'epic' }),
  // ---- Social (12) ----
  G({ id: 'persuade', name: 'Persuade', category: 'social', description: 'Passive: +1 CHA per rank, for dialogue checks and prices.', passive: [flat('cha', 1)] }),
  G({ id: 'intimidate', name: 'Intimidate', category: 'social', description: 'Passive: +1 CHA and +0.5% damage per rank.', passive: [flat('cha', 1), flat('damageBonus', 0.5)] }),
  G({ id: 'deceive', name: 'Deceive', category: 'social', description: 'Passive: +1 CHA and +0.4 dodge per rank.', passive: [flat('cha', 1), flat('dodge', 0.4)] }),
  G({ id: 'barter', name: 'Barter', category: 'social', description: 'Passive: +1.5% shop barter per rank (shops pay a little more and charge a little less).', passive: [flat('barter', 1.5)] }),
  G({ id: 'diplomacy', name: 'Diplomacy', category: 'social', description: 'Passive: +2% favor gain and +1 CHA per rank.', passive: [flat('favorGain', 2), flat('cha', 1)], rarity: 'rare' }),
  G({ id: 'leadership', name: 'Leadership', category: 'social', description: 'Passive: +1% damage and +1% max HP per rank.', passive: [flat('damageBonus', 1), pct('maxHp', 1)], rarity: 'rare', requirements: { stats: { cha: 15 } } }),
  G({ id: 'charm', name: 'Charm', category: 'social', description: 'Passive: +1 CHA and +0.5 LUK per rank.', passive: [flat('cha', 1), flat('luk', 0.5)] }),
  G({ id: 'etiquette', name: 'Etiquette', category: 'social', description: 'Passive: +1 CHA and +1% barter per rank.', passive: [flat('cha', 1), flat('barter', 1)], rarity: 'common' }),
  G({ id: 'oratory', name: 'Oratory', category: 'social', description: 'Passive: +3% favor gain per rank.', passive: [flat('favorGain', 3)], rarity: 'rare' }),
  G({ id: 'gossip', name: 'Gossip', category: 'social', description: 'Passive: +1.5% XP per rank; people tell you things.', passive: [flat('xpGain', 1.5)] }),
  G({ id: 'bluff', name: 'Bluff', category: 'social', description: 'Passive: +0.4 crit chance and +1 CHA per rank.', passive: [flat('critChance', 0.4), flat('cha', 1)] }),
  G({ id: 'negotiator', name: 'Negotiator', category: 'social', description: 'Passive: +2% gold find and +1% barter per rank.', passive: [flat('goldFind', 2), flat('barter', 1)], rarity: 'rare' }),
  // ---- Exploration (4; Lockpicking and Detect Traps are Utility skills that gate too) ----
  G({ id: 'swimming', name: 'Swimming', category: 'exploration', description: 'Reach caches beneath the waterline. Rank gates how deep.', utility: { kind: 'swimming', perRank: 1 }, rarity: 'common' }),
  G({ id: 'climbing', name: 'Climbing', category: 'exploration', description: 'Reach caches on cliffs and ruins. Rank gates how steep.', utility: { kind: 'climbing', perRank: 1 }, rarity: 'common' }),
  G({ id: 'read-ancient-script', name: 'Read Ancient Script', category: 'exploration', description: 'Read sealed inscriptions and open the doors they guard.', utility: { kind: 'ancientScript', perRank: 1 } }),
  G({ id: 'animal-speech', name: 'Animal Speech', category: 'exploration', description: 'Ask the locals where the old burrows are.', utility: { kind: 'animalSpeech', perRank: 1 } }),
  // ---- Lost arts (12) ----
  G({ id: 'moonlit-step', name: 'Moonlit Step', category: 'lost', description: 'An elven dance of haste.', combatSkill: 'g-moonlit-step', rarity: 'rare', requirements: { races: ['elf', 'wood-elf'] } }),
  G({ id: 'ancestral-roar', name: 'Ancestral Roar', category: 'lost', description: 'An orcish war-rite.', combatSkill: 'g-ancestral-roar', rarity: 'rare', requirements: { races: ['orc'] } }),
  G({ id: 'feral-rend', name: 'Feral Rend', category: 'lost', description: 'Claws the civilized forgot.', combatSkill: 'g-feral-rend', rarity: 'rare', requirements: { races: ['beastkin'] } }),
  G({ id: 'halo-flicker', name: 'Halo Flicker', category: 'lost', description: 'A nephilim’s light, flared on purpose.', combatSkill: 'g-halo-flicker', rarity: 'rare', requirements: { races: ['nephilim'] } }),
  G({ id: 'glamour', name: 'Glamour', category: 'lost', description: 'A fae trick of the eye.', combatSkill: 'g-glamour', rarity: 'rare', requirements: { races: ['fae'] } }),
  G({ id: 'phalanx-drill', name: 'Phalanx Drill', category: 'lost', description: 'What the sergeants never wrote down.', combatSkill: 'g-phalanx-drill', rarity: 'rare', requirements: { backgrounds: ['soldier'] } }),
  G({ id: 'runeforged-hide', name: 'Runeforged Hide', category: 'lost', description: 'Passive: +2.5% defense and +2% max HP per rank.', passive: [pct('defense', 2.5), pct('maxHp', 2)], rarity: 'rare', requirements: { races: ['dwarf'] } }),
  G({ id: 'indomitable-spirit', name: 'Indomitable Spirit', category: 'lost', description: 'Passive: +3% XP and +1% max HP per rank.', passive: [flat('xpGain', 3), pct('maxHp', 1)], rarity: 'rare', requirements: { races: ['human'] } }),
  G({ id: 'step-between', name: 'Step Between', category: 'lost', description: 'Passive: +0.8 dodge and +0.4 crit chance per rank.', passive: [flat('dodge', 0.8), flat('critChance', 0.4)], rarity: 'rare', requirements: { races: ['shadekin'] } }),
  G({ id: 'alley-instincts', name: 'Alley Instincts', category: 'lost', description: 'Passive: +0.8 dodge and +2% gold find per rank.', passive: [flat('dodge', 0.8), flat('goldFind', 2)], rarity: 'rare', requirements: { backgrounds: ['street-urchin'] } }),
  G({ id: 'marginalia', name: 'Marginalia', category: 'lost', description: 'Passive: +2% magic attack and +1% cooldown reduction per rank.', passive: [pct('magicAttack', 2), flat('cooldownReduction', 1)], rarity: 'rare', requirements: { backgrounds: ['scholar'] } }),
  G({ id: 'sea-legs', name: 'Sea Legs', category: 'lost', description: 'Passive: +3% ice resist, +3% lightning resist and +1% speed per rank.', passive: [flat('iceResist', 3), flat('lightningResist', 3), pct('speed', 1)], rarity: 'rare', requirements: { backgrounds: ['sailor'] } }),
  // ---- Legendary techniques (10; each is guarded by a secret boss) ----
  G({ id: 'rime-lance', name: 'Rime Lance', category: 'legendary', description: 'Taught by the Rime drake’s last breath.', combatSkill: 'g-rime-lance', rarity: 'legendary', requirements: { level: 30 } }),
  G({ id: 'tempest-call', name: 'Tempest Call', category: 'legendary', description: 'The eye of the storm answers.', combatSkill: 'g-tempest-call', rarity: 'legendary', requirements: { level: 30 } }),
  G({ id: 'ember-breath', name: 'Ember Breath', category: 'legendary', description: 'A drake’s fire, borrowed.', combatSkill: 'g-ember-breath', rarity: 'legendary', requirements: { level: 30 } }),
  G({ id: 'grave-bargain', name: 'Grave Bargain', category: 'legendary', description: 'A dead king’s terms.', combatSkill: 'g-grave-bargain', rarity: 'legendary', requirements: { level: 30 } }),
  G({ id: 'crimson-tithe', name: 'Crimson Tithe', category: 'legendary', description: 'The Red Library collects.', combatSkill: 'g-crimson-tithe', rarity: 'legendary', requirements: { level: 28 } }),
  G({ id: 'fiftieth-mark', name: 'The Fiftieth Mark', category: 'legendary', description: 'The counting house’s last entry.', combatSkill: 'g-fiftieth-mark', rarity: 'legendary', requirements: { level: 28 } }),
  G({ id: 'all-beds', name: 'Every Bed in the World', category: 'legendary', description: 'The Insomniac’s only secret.', combatSkill: 'g-all-beds', rarity: 'legendary', requirements: { level: 28 } }),
  G({ id: 'last-tableau', name: 'The Last Tableau', category: 'legendary', description: 'The final puppet’s final scene.', combatSkill: 'g-last-tableau', rarity: 'legendary', requirements: { level: 28 } }),
  G({ id: 'riddle-crown', name: 'Riddle of the Crown', category: 'legendary', description: 'A question without an answer.', combatSkill: 'g-riddle-crown', rarity: 'legendary', requirements: { level: 32 } }),
  G({ id: 'empty-court', name: 'The Empty Court', category: 'legendary', description: 'Nobody bows to nobody.', combatSkill: 'g-empty-court', rarity: 'legendary', requirements: { level: 32 } }),
  // ---- Masters (15; each is taught by a hidden master after a challenge) ----
  G({ id: 'iron-lotus', name: 'Iron Lotus', category: 'master', description: 'Four blooming strikes.', combatSkill: 'g-iron-lotus', rarity: 'epic' }),
  G({ id: 'pale-flame', name: 'Pale Flame', category: 'master', description: 'A fire that does not warm.', combatSkill: 'g-pale-flame', rarity: 'epic' }),
  G({ id: 'hushed-arrow', name: 'Hushed Arrow', category: 'master', description: 'Loosed between heartbeats.', combatSkill: 'g-hushed-arrow', rarity: 'epic' }),
  G({ id: 'tide-turned', name: 'Tide Turned', category: 'master', description: 'The sea’s own mending.', combatSkill: 'g-tide-turned', rarity: 'epic' }),
  G({ id: 'dwarven-reckoning', name: 'Dwarven Reckoning', category: 'master', description: 'A debt repaid in stone.', combatSkill: 'g-dwarven-reckoning', rarity: 'epic' }),
  G({ id: 'saints-patience', name: 'Saint’s Patience', category: 'master', description: 'A prayer held ten years.', combatSkill: 'g-saints-patience', rarity: 'epic' }),
  G({ id: 'wolf-pact', name: 'Wolf Pact', category: 'master', description: 'A wolf of the old pack.', combatSkill: 'g-wolf-pact', rarity: 'epic' }),
  G({ id: 'drowned-bell', name: 'The Drowned Bell', category: 'master', description: 'A bell tolls beneath the sea.', combatSkill: 'g-drowned-bell', rarity: 'epic' }),
  G({ id: 'masters-grip', name: 'Master’s Grip', category: 'master', description: 'Passive: +3% physical attack and +1 crit chance per rank.', passive: [pct('physicalAttack', 3), flat('critChance', 1)], rarity: 'epic' }),
  G({ id: 'masters-spark', name: 'Master’s Spark', category: 'master', description: 'Passive: +3% magic attack and +1% cooldown reduction per rank.', passive: [pct('magicAttack', 3), flat('cooldownReduction', 1)], rarity: 'epic' }),
  G({ id: 'masters-calm', name: 'Master’s Calm', category: 'master', description: 'Passive: +2% max HP and +2% status resist per rank.', passive: [pct('maxHp', 2), flat('statusResist', 2)], rarity: 'epic' }),
  G({ id: 'masters-eye', name: 'Master’s Eye', category: 'master', description: 'Passive: +1.5 accuracy and +8% crit damage per rank.', passive: [flat('accuracy', 1.5), flat('critDamage', 8)], rarity: 'epic' }),
  G({ id: 'masters-luck', name: 'Master’s Luck', category: 'master', description: 'Passive: +2 LUK and +2% magic find per rank.', passive: [flat('luk', 2), flat('magicFind', 2)], rarity: 'epic' }),
  G({ id: 'masters-faith', name: 'Master’s Faith', category: 'master', description: 'Passive: +3% divine power and +2% healing power per rank.', passive: [pct('divinePower', 3), flat('healingPower', 2)], rarity: 'epic' }),
  G({ id: 'masters-stride', name: 'Master’s Stride', category: 'master', description: 'Passive: +1% speed and +0.6 dodge per rank.', passive: [pct('speed', 1), flat('dodge', 0.6)], rarity: 'epic' }),
  // ---- More combat and survival (4) ----
  G({ id: 'battle-trance', name: 'Battle Trance', category: 'combat', description: 'Passive: +1.5% damage and +0.5% lifesteal per rank.', passive: [flat('damageBonus', 1.5), flat('lifesteal', 0.5)], rarity: 'epic', requirements: { level: 18 } }),
  G({ id: 'spell-focus', name: 'Spell Focus', category: 'combat', description: 'Passive: +2% magic attack and +1% MP per rank.', passive: [pct('magicAttack', 2), pct('maxMp', 1)], rarity: 'rare', requirements: { level: 10 } }),
  G({ id: 'wilderness-lore', name: 'Wilderness Lore', category: 'survival', description: 'Passive: +2% nature resist and +1% max HP per rank.', passive: [flat('natureResist', 2), pct('maxHp', 1)] }),
  G({ id: 'veteran', name: 'Veteran', category: 'survival', description: 'Passive: +1% XP and +1% defense per rank.', passive: [flat('xpGain', 1), pct('defense', 1)], rarity: 'rare' }),
];

/** Which secret boss guards which Legendary technique (the skillbook drops until it is learned). */
export const GUARDED_TECHNIQUES: Record<string, string> = {
  'elder-drake-rime': 'rime-lance',
  'elder-drake-tempest': 'tempest-call',
  'elder-drake-ember': 'ember-breath',
  'elder-drake-grave': 'grave-bargain',
  'sanguine-archivist': 'crimson-tithe',
  'tally-keeper': 'fiftieth-mark',
  'the-insomniac': 'all-beds',
  'the-last-puppet': 'last-tableau',
  'crown-warden': 'riddle-crown',
  'hollow-courtier': 'empty-court',
};
