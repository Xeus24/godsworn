import type { AiProfile } from '../engine/combat/types';
import type { UniqueItemDef } from '../engine/items/types';
import type { GeneralSkillDef } from '../engine/skills/generalTypes';
import type { SkillDef } from '../engine/skills/types';
import type { NpcDef } from '../engine/quests/types';
import type { ObjectiveDef } from '../engine/quests/types';
import { avatar, divineBlessing, rite, type ApostleContent } from './apostles/helpers';
import { major, minor } from './blessings';
import type { GodDef } from './gods';
import type { PantheonDef } from './pantheon';
import { flat, more, pct } from './trees/builder';
import { deed } from './story/helpers';

/**
 * The four new major gods of the Greater Pantheon. Each bundle carries everything the original ten have:
 * identity, likes and dislikes, a prayer and an intervention, nine blessings, an Apostle (rites, avatar,
 * weapon, tree), a follower, a Divine general skill, two Divine items and a priest with a temple.
 */
interface GreaterGod {
  god: GodDef;
  pantheon: PantheonDef;
  blessings: ReturnType<typeof minor>[];
  apostle: ApostleContent;
  follower: { name: string; ai: AiProfile; row: 'front' | 'back'; description: string };
  skill: { general: GeneralSkillDef; combat: SkillDef };
  items: UniqueItemDef[];
  priest: { npc: Omit<NpcDef, 'place' | 'greeting' | 'title'> & { greeting: string }; town: string };
  offering: [item: string, count: number, name: string];
  will: ObjectiveDef;
  glyph: string;
  zones: string[];
}

const req = (god: string, tier: 'favored' | 'devoted') => ({ favor: { god, tier } });
const divineSkill = (god: string, s: Omit<GeneralSkillDef, 'category' | 'rarity' | 'maxRank' | 'god'>): GeneralSkillDef => ({ category: 'divine', rarity: 'divine', maxRank: 5, god, ...s });
const combat = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'general', maxRank: 5 });
const power = (multiplier: number) => ({ stat: 'divinePower' as const, multiplier, perRank: multiplier * 0.08 });

const LYSSARA: GreaterGod = {
  god: { id: 'lyssara', name: 'Lyssara', epithet: 'the Moon Between Dreams', domain: 'Dreams & the Moon', element: 'ice', favoredStats: ['wis', 'luk'], color: '#9ab4ff', symbol: 'A crescent moon cradling a closed eye' },
  pantheon: {
    id: 'lyssara', alignment: 'Neutral Good', personality: 'Soft-spoken, unhurried and very hard to wake.', rivals: ['kael'], allies: ['morrath', 'hesha'],
    shrine: 'Moonwell', temple: 'The Quiet House',
    likes: [
      { event: 'rest', amount: 2, text: 'Resting well' },
      { event: 'battleWon', timeOfDay: 'night', amount: 1.5, text: 'Victories by moonlight' },
      { event: 'mercy', amount: 4, text: 'Sparing the sleeping and the beaten' },
      { event: 'skillTag', tag: 'Ice', amount: 0.5, cap: 3, text: 'Moonlit cold' },
    ],
    dislikes: [
      { event: 'battleWon', timeOfDay: 'day', amount: -0.5, cap: -2, text: 'Brawling in the glare of noon' },
      { event: 'goldStolen', amount: -3, cap: -6, text: 'Waking people to rob them' },
    ],
    offerings: { goldPerFavor: 45, itemValuePerFavor: 18, categories: { curiosity: 2, book: 2 }, text: 'Likes small strange things from dreams, and old books.' },
    prayer: { name: 'Lullaby of the Moon', description: 'Every enemy has a 60% chance to fall asleep for 2 turns (a hit wakes them).', cost: 15, effects: [{ kind: 'applyStatus', status: 'dream-sleep', duration: 2, chance: 60, target: 'allEnemies' }] },
    intervention: { name: 'Dreamed Away', text: 'Lyssara folds you into a dream; you wake whole, and the fight is slow to follow.', effects: [{ kind: 'heal', percentMaxHp: 40, target: 'self' }, { kind: 'applyStatus', status: 'slow', duration: 2, target: 'allEnemies' }] },
  },
  blessings: [
    minor('lyssara', { id: 'lyssara-moonlit', name: 'Moonlit', description: '+15% ice damage.', modifiers: [flat('iceDamage', 15)] }),
    minor('lyssara', { id: 'lyssara-lull', name: 'Lull', description: '+10 status chance.', modifiers: [flat('statusChance', 10)] }),
    minor('lyssara', { id: 'lyssara-lucid', name: 'Lucid', rarity: 'uncommon', favorCost: 30, description: '+20% damage against sleeping enemies.', modifiers: [flat('damageBonus', 20, { kind: 'targetHasStatus', status: 'dream-sleep' })] }),
    major('lyssara', { id: 'lyssara-tide', name: 'Tide of Sleep', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% ice damage and +5 WIS.', modifiers: [flat('iceDamage', 10), flat('wis', 5)] }),
    major('lyssara', { id: 'lyssara-rest', name: 'Deep Rest', rarity: 'uncommon', minTier: 'acknowledged', description: '+3 HP regeneration.', modifiers: [flat('hpRegen', 3)] }),
    major('lyssara', { id: 'lyssara-night', name: 'Moonrise', rarity: 'uncommon', minTier: 'acknowledged', description: '20% more damage at night.', modifiers: [], flags: ['strongerAtNight'] }),
    major('lyssara', { id: 'lyssara-silver', name: 'Silver Thread', rarity: 'rare', minTier: 'favored', description: '+10% status chance and +10% status resist.', modifiers: [flat('statusChance', 10), flat('statusResist', 10)] }),
    major('lyssara', { id: 'lyssara-lucidity', name: 'Waking Dream', rarity: 'epic', minTier: 'devoted', description: 'Start every battle with Haste for 1 turn; +15% ice damage.', modifiers: [flat('iceDamage', 15)], triggers: [{ id: 'bless-lyssara-lucidity', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 1, target: 'self' }] }] }),
    major('lyssara', { id: 'lyssara-moon', name: 'The Moon Between Dreams', rarity: 'legendary', minTier: 'exalted', description: '+25% ice damage; once per battle, survive a killing blow with 1 HP.', modifiers: [flat('iceDamage', 25)], flags: ['reviveOnce'] }),
  ],
  apostle: {
    god: 'lyssara',
    skills: [
      rite({ id: 'moonbeam', name: 'Moonbeam', description: 'A pale beam for 170% Divine Power ice damage; 30% chance to put the target to sleep.', tags: ['Spell', 'Ice', 'Divine'], element: 'ice', targeting: 'enemy', cost: { mp: 10 }, cooldown: 1, damage: { stat: 'divinePower', multiplier: 1.7, perRank: 0.12 }, effects: [{ kind: 'applyStatus', status: 'dream-sleep', duration: 2, chance: 30 }] }),
      rite({ id: 'moon-veil', name: 'Moon Veil', description: 'Shield yourself for 25% of max HP and slip into Stealth for 2 turns.', tags: ['Buff', 'Ice', 'Divine'], element: 'ice', targeting: 'self', cost: { mp: 12 }, cooldown: 4, effects: [{ kind: 'shield', percentMaxHp: 25 }, { kind: 'applyStatus', status: 'stealth', duration: 2, target: 'self' }] }),
    ],
    avatar: avatar({ id: 'avatar-lyssara', name: 'Avatar of the Moon', description: 'Become the Moon Between Dreams for 3 turns: +40% damage and +30 dodge; every enemy takes 180% Divine Power ice damage and may fall asleep.', element: 'ice', tags: ['Ice', 'Divine', 'AoE'], damage: 1.8, buff: [flat('damageBonus', 40), flat('dodge', 30)], effects: [{ kind: 'applyStatus', status: 'dream-sleep', duration: 2, chance: 50, target: 'allEnemies' }] }),
    weapon: { type: 'staff', names: ['Crescent Rod', 'Crescent Rod, Waxing', 'Crescent Rod, Full', 'Crescent Rod, the Moon Between Dreams'], lore: 'It is never quite where you left it, and always where you need it.' },
    blessing: divineBlessing('lyssara', 'Moonborn', 'Enemies start battle drowsy: 25% chance to Slow each. +20% ice damage and 10% less damage taken.', [flat('iceDamage', 20), more('damageTaken', -10)], [{ id: 'moonborn-drowse', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, chance: 25, target: 'allEnemies' }] }]),
    tree: {
      id: 'moonborn', name: 'Moonborn', color: '#9ab4ff', description: 'The quiet light of Lyssara.',
      a: { skill: 'moonbeam' },
      aMods: [{ name: 'Full Moon', patch: { description: '+25% damage, +30% MP cost.', powerMult: 1.25, costMult: 1.3 } }, { name: 'Lucid Beam', patch: { description: 'Also Weakens.', addEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] } }],
      b: { skill: 'moon-veil' },
      bMods: [{ name: 'Deeper Veil', patch: { description: 'Shields another 10%.', addEffects: [{ kind: 'shield', percentMaxHp: 10 }] } }, { name: 'Quick Dream', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } }],
      notables: [{ name: 'Sleepwalker', mods: [flat('dodge', 8)] }, { name: 'Night Shift', flags: ['strongerAtNight'] }],
      choice: [{ name: 'Silver Mind', mods: [pct('magicAttack', 12)] }, { name: 'Soft Step', mods: [flat('speed', 5)] }],
      keystone: { name: 'Eternal Night', text: 'Keystone: +20% damage at night is permanent, but -10% max HP.', mods: [flat('damageBonus', 15), pct('maxHp', -10)] },
      capstone: { name: 'Moon Between Dreams', text: 'Start every battle with a shield of 20% max HP.', triggers: [{ id: 'moon-between-dreams', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 20, target: 'self' }] }] },
    },
  },
  follower: { name: 'Moth of Lyssara', ai: 'caster', row: 'back', description: 'It drifts above the fight, shedding silver dust that makes the enemy yawn.' },
  skill: {
    combat: combat({ id: 'd-lullaby', name: 'Lullaby', description: '110% Divine Power ice damage; 50% chance to put the target to sleep.', tags: ['Spell', 'Ice', 'Divine'], element: 'ice', targeting: 'enemy', cost: { mp: 10 }, cooldown: 3, damage: power(1.1), effects: [{ kind: 'applyStatus', status: 'dream-sleep', duration: 2, chance: 50 }] }),
    general: divineSkill('lyssara', { id: 'rite-of-dreams', name: 'Rite of Dreams', description: 'Lullaby in battle. Passive: +2% ice damage per rank.', combatSkill: 'd-lullaby', passive: [flat('iceDamage', 2)] }),
  },
  items: [
    { id: 'crescent-of-lyssara', name: 'Crescent of Lyssara', rarity: 'divine', baseId: 'staff-t3', level: 20, requirements: req('lyssara', 'favored'), modifiers: [{ stat: 'iceDamage', type: 'flat', value: 20 }, { stat: 'wis', type: 'flat', value: 8 }], flags: ['strongerAtNight'], effectText: ['20% more damage at night'], lore: 'It hums, faintly, a tune you almost remember.' },
    { id: 'pillow-of-the-moon', name: 'Pillow of the Moon', rarity: 'divine', baseId: 'amulet-t4', level: 32, requirements: req('lyssara', 'devoted'), modifiers: [{ stat: 'hpRegen', type: 'flat', value: 6 }, { stat: 'statusResist', type: 'flat', value: 20 }], effectText: [], lore: 'Whoever sleeps on it wakes up having done something brave.' },
  ],
  priest: { npc: { id: 'sleepless-orsa', name: 'Sleepless Orsa', town: 'thornwick', race: 'elf', portrait: 2, color: '#9ab4ff', greeting: '“Hush. Somebody is dreaming in the next room, and I would hate to wake them with the wrong question.”' }, town: 'thornwick' },
  offering: ['faint-essence', 5, 'Faint Essence'],
  will: deed('d', 'Rest and sleep well (camp, inn or home)', 4, { event: 'rest' }),
  glyph: 'frost',
  zones: ['whisperwood', 'frostspire'],
};

const ORDRUN: GreaterGod = {
  god: { id: 'ordrun', name: 'Ordrun', epithet: 'the Unmoved', domain: 'Earth & Endurance', element: 'earth', favoredStats: ['vit', 'str'], color: '#a8844a', symbol: 'A square stone with a single crack mended in gold' },
  pantheon: {
    id: 'ordrun', alignment: 'Lawful Neutral', personality: 'Slow to speak, slower to move, impossible to argue with.', rivals: ['vex'], allies: ['thalor', 'solenne'],
    shrine: 'Standing Stone', temple: 'The Foundation',
    likes: [
      { event: 'battleWon', amount: 1.5, text: 'Winning, patiently' },
      { event: 'kill', tiers: ['elite', 'champion', 'miniboss', 'boss', 'worldBoss'], amount: 3, text: 'Outlasting great foes' },
      { event: 'craft', amount: 2, text: 'Building something that will stand' },
      { event: 'questDone', amount: 3, text: 'Finishing what you promised' },
    ],
    dislikes: [
      { event: 'battleFled', amount: -4, text: 'Giving up the ground' },
      { event: 'gamble', amount: -2, cap: -6, text: 'Trusting luck over work' },
    ],
    offerings: { goldPerFavor: 45, itemValuePerFavor: 18, categories: { armor: 2, gem: 1.5 }, materialKinds: { ore: 2 }, text: 'Respects armor, stone and ore.' },
    prayer: { name: 'Stone Stance', description: 'Shield yourself for 30% of max HP and take 25% less damage for 3 turns.', cost: 15, effects: [{ kind: 'shield', percentMaxHp: 30, target: 'self' }, { kind: 'buff', id: 'ordrun-stone-stance', duration: 3, modifiers: [{ stat: 'damageTaken', type: 'more', value: -25 }], target: 'self' }] },
    intervention: { name: 'Enduring', text: 'Ordrun sets his hand on your shoulder, and the ground itself holds you up.', effects: [{ kind: 'heal', percentMaxHp: 50, target: 'self' }, { kind: 'shield', percentMaxHp: 20, target: 'self' }] },
  },
  blessings: [
    minor('ordrun', { id: 'ordrun-stone', name: 'Stone', description: '+10% defense.', modifiers: [pct('defense', 10)] }),
    minor('ordrun', { id: 'ordrun-root', name: 'Root', description: '+10% max HP.', modifiers: [pct('maxHp', 10)] }),
    minor('ordrun', { id: 'ordrun-anvil', name: 'Anvil', rarity: 'uncommon', favorCost: 30, description: '+20% damage while above 50% HP.', modifiers: [flat('damageBonus', 20, { kind: 'hpAbove', pct: 50 })] }),
    major('ordrun', { id: 'ordrun-grit', name: 'Granite Grit', rarity: 'uncommon', minTier: 'acknowledged', description: '+8% max HP and +5 VIT.', modifiers: [pct('maxHp', 8), flat('vit', 5)] }),
    major('ordrun', { id: 'ordrun-wall', name: 'Living Wall', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% defense and +10% magic resist.', modifiers: [pct('defense', 10), pct('magicResist', 10)] }),
    major('ordrun', { id: 'ordrun-calm', name: 'Unmoved', rarity: 'uncommon', minTier: 'acknowledged', description: '+15% status resist.', modifiers: [flat('statusResist', 15)] }),
    major('ordrun', { id: 'ordrun-bedrock', name: 'Bedrock', rarity: 'rare', minTier: 'favored', description: 'Take 8% less damage.', modifiers: [more('damageTaken', -8)] }),
    major('ordrun', { id: 'ordrun-quake', name: 'Fault Line', rarity: 'epic', minTier: 'devoted', description: '15% chance on hit to Stun the target; +10% damage.', modifiers: [flat('damageBonus', 10)], triggers: [{ id: 'bless-ordrun-quake', trigger: 'onHit', chance: 15, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] }] }),
    major('ordrun', { id: 'ordrun-unmoved', name: 'The Unmoved', rarity: 'legendary', minTier: 'exalted', description: '+15% max HP and 12% less damage taken; once per battle, survive a killing blow with 1 HP.', modifiers: [pct('maxHp', 15), more('damageTaken', -12)], flags: ['reviveOnce'] }),
  ],
  apostle: {
    god: 'ordrun',
    skills: [
      rite({ id: 'landslide', name: 'Landslide', description: 'Stone falls on the front row: 120% ATK earth damage. Heavy stagger.', tags: ['Attack', 'Melee', 'Earth', 'Divine', 'AoE'], element: 'earth', targeting: 'frontRow', cost: { mp: 12 }, cooldown: 2, stagger: 2, damage: { stat: 'physicalAttack', multiplier: 1.2, perRank: 0.1 }, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] }),
      rite({ id: 'hold-the-line', name: 'Hold the Line', description: 'Shield yourself for 30% of max HP and gain +30% defense for 3 turns; enemies must target you.', tags: ['Buff', 'Divine', 'Defensive'], element: 'physical', targeting: 'self', cost: { mp: 12 }, cooldown: 4, effects: [{ kind: 'shield', percentMaxHp: 30 }, { kind: 'buff', id: 'hold-the-line', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 30 }], target: 'self' }, { kind: 'applyStatus', status: 'taunt', duration: 2, target: 'self' }] }),
    ],
    avatar: avatar({ id: 'avatar-ordrun', name: 'Avatar of the Mountain', description: 'Become the Unmoved for 3 turns: +35% damage and +50% defense; every enemy takes 170% Divine Power damage and is Slowed.', element: 'physical', tags: ['Divine', 'AoE'], damage: 1.7, buff: [flat('damageBonus', 35), pct('defense', 50)], effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, target: 'allEnemies' }] }),
    weapon: { type: 'warhammer', names: ['Keystone', 'Keystone, Set', 'Keystone, Bearing', 'Keystone, the Unmoved'], lore: 'It has never been dropped, because nothing has ever tried to take it from you.' },
    blessing: divineBlessing('ordrun', 'Mountainborn', 'Take 14% less damage; 20% chance to Stun on hit.', [pct('defense', 20), more('damageTaken', -14)], [{ id: 'mountainborn-stun', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] }]),
    tree: {
      id: 'mountainborn', name: 'Mountainborn', color: '#a8844a', description: 'The patience of Ordrun.',
      a: { skill: 'landslide' },
      aMods: [{ name: 'Rockfall', patch: { description: '+25% damage, +25% MP cost.', powerMult: 1.25, costMult: 1.25 } }, { name: 'Dust Cloud', patch: { description: 'Also Blinds.', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2 }] } }],
      b: { skill: 'hold-the-line' },
      bMods: [{ name: 'Deeper Footing', patch: { description: 'Shields another 10%.', addEffects: [{ kind: 'shield', percentMaxHp: 10 }] } }, { name: 'Quick Footing', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } }],
      notables: [{ name: 'Rooted', mods: [pct('defense', 10)] }, { name: 'Weight of Years', mods: [pct('maxHp', 8), flat('statusResist', 10)] }],
      choice: [{ name: 'Hammer of Ages', mods: [pct('physicalAttack', 12)] }, { name: 'Wall of Ages', mods: [pct('maxHp', 12)] }],
      keystone: { name: 'Immovable', text: 'Keystone: take 15% less damage, -8 speed.', mods: [more('damageTaken', -15), flat('speed', -8)] },
      capstone: { name: 'The Mountain Remains', text: 'Start every battle with a shield of 25% max HP.', triggers: [{ id: 'mountain-remains', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 25, target: 'self' }] }] },
    },
  },
  follower: { name: 'Cairn-Guard of Ordrun', ai: 'defensive', row: 'front', description: 'A pile of stones that insists it is a soldier. No one has argued the point.' },
  skill: {
    combat: combat({ id: 'd-stone-stance', name: 'Stone Stance', description: 'Shield yourself for 20% of max HP and gain +25% defense for 3 turns.', tags: ['Buff', 'Divine', 'Defensive'], element: 'physical', targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'shield', percentMaxHp: 20 }, { kind: 'buff', id: 'd-stone-stance', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 25 }], target: 'self' }] }),
    general: divineSkill('ordrun', { id: 'rite-of-endurance', name: 'Rite of Endurance', description: 'Stone Stance in battle. Passive: +2% max HP per rank.', combatSkill: 'd-stone-stance', passive: [pct('maxHp', 2)] }),
  },
  items: [
    { id: 'cornerstone', name: 'Cornerstone', rarity: 'divine', baseId: 'warhammer-t3', level: 20, requirements: req('ordrun', 'favored'), modifiers: [{ stat: 'physicalDamage', type: 'flat', value: 20 }, { stat: 'vit', type: 'flat', value: 8 }], effectText: ['A weapon that does not tire'], lore: 'Part of a wall that held for nine hundred years, and has not forgiven the tenth.' },
    { id: 'plinth-of-patience', name: 'Plinth of Patience', rarity: 'divine', baseId: 'shield-t4', level: 32, requirements: req('ordrun', 'devoted'), modifiers: [{ stat: 'defense', type: 'percent', value: 22 }, { stat: 'damageTaken', type: 'more', value: -6 }], effectText: [], lore: 'It does not shine. It is simply still there when everything else has stopped.' },
  ],
  priest: { npc: { id: 'foundation-keeper-dag', name: 'Keeper Dag', town: 'frosthold', race: 'dwarf', portrait: 3, color: '#a8844a', greeting: '“Sit if you like. Stand if you prefer. The stone will outlast the decision.”' }, town: 'frosthold' },
  offering: ['iron-ore', 8, 'Iron Ore'],
  will: deed('d', 'Build something that lasts (craft at the Workshop)', 4, { event: 'craft' }),
  glyph: 'fist',
  zones: ['sunken-caves', 'volcanic-rift'],
};

const SERAPHEL: GreaterGod = {
  god: { id: 'seraphel', name: 'Seraphel', epithet: 'the Open Road', domain: 'Wind & Freedom', element: 'lightning', favoredStats: ['dex', 'luk'], color: '#7ad8e8', symbol: 'A feather over an unlocked cage' },
  pantheon: {
    id: 'seraphel', alignment: 'Chaotic Good', personality: 'Restless, warm and constitutionally unable to be told what to do.', rivals: ['grimvald'], allies: ['ysolde', 'vex'],
    shrine: 'Windbell', temple: 'The Open Door',
    likes: [
      { event: 'mercy', amount: 4, text: 'Setting the beaten free' },
      { event: 'battleFled', amount: 1, cap: 3, text: 'Knowing when to leave' },
      { event: 'crit', amount: 0.5, cap: 3, text: 'Lightning strikes' },
      { event: 'gamble', amount: 1.5, cap: 4, text: 'Taking a chance' },
    ],
    dislikes: [
      { event: 'summon', amount: -1.5, cap: -4, text: 'Binding creatures to your will' },
      { event: 'socket', amount: -1, cap: -3, text: 'Locking things into place' },
    ],
    offerings: { goldPerFavor: 50, itemValuePerFavor: 20, categories: { curiosity: 2.5 }, text: 'Likes things that travel: feathers, maps, letters.' },
    prayer: { name: 'Free as the Wind', description: 'Gain Haste for 2 turns, and the party gains +20 dodge for 3 turns.', cost: 15, effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }, { kind: 'buff', id: 'seraphel-free', duration: 3, modifiers: [{ stat: 'dodge', type: 'flat', value: 20 }], target: 'allAllies' }] },
    intervention: { name: 'Carried Off', text: 'A gust lifts you clear; you land, breathless, with the wind at your back.', effects: [{ kind: 'heal', percentMaxHp: 35, target: 'self' }, { kind: 'applyStatus', status: 'haste', duration: 3, target: 'self' }] },
  },
  blessings: [
    minor('seraphel', { id: 'seraphel-gale', name: 'Gale', description: '+10% speed.', modifiers: [pct('speed', 10)] }),
    minor('seraphel', { id: 'seraphel-lift', name: 'Updraft', description: '+10 dodge.', modifiers: [flat('dodge', 10)] }),
    minor('seraphel', { id: 'seraphel-roam', name: 'Wanderlust', rarity: 'uncommon', favorCost: 30, description: '+20% lightning damage.', modifiers: [flat('lightningDamage', 20)] }),
    major('seraphel', { id: 'seraphel-feather', name: 'Light as a Feather', rarity: 'uncommon', minTier: 'acknowledged', description: '+8 dodge and +5 DEX.', modifiers: [flat('dodge', 8), flat('dex', 5)] }),
    major('seraphel', { id: 'seraphel-bolt', name: 'Thunderhead', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% lightning damage and +4% crit chance.', modifiers: [flat('lightningDamage', 10), flat('critChance', 4)] }),
    major('seraphel', { id: 'seraphel-free', name: 'Unshackled', rarity: 'uncommon', minTier: 'acknowledged', description: '+20% status resist.', modifiers: [flat('statusResist', 20)] }),
    major('seraphel', { id: 'seraphel-tailwind', name: 'Tailwind', rarity: 'rare', minTier: 'favored', description: 'Always act first in the opening round.', modifiers: [], flags: ['firstStrike'] }),
    major('seraphel', { id: 'seraphel-storm', name: 'Windwalker', rarity: 'epic', minTier: 'devoted', description: 'Each turn, 20% chance to strike a random enemy with lightning (60% Divine Power); +10% speed.', modifiers: [pct('speed', 10)], triggers: [{ id: 'bless-seraphel-storm', trigger: 'onTurnStart', chance: 20, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'divinePower', ratio: 0.6 }, target: 'randomEnemy' }] }] }),
    major('seraphel', { id: 'seraphel-road', name: 'The Open Road', rarity: 'legendary', minTier: 'exalted', description: '+20% lightning damage, +15 dodge and +10% speed.', modifiers: [flat('lightningDamage', 20), flat('dodge', 15), pct('speed', 10)] }),
  ],
  apostle: {
    god: 'seraphel',
    skills: [
      rite({ id: 'cutting-wind', name: 'Cutting Wind', description: 'A razor gust: 110% ATK + 50% Divine Power lightning damage to every enemy.', tags: ['Spell', 'Lightning', 'Divine', 'AoE'], element: 'lightning', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 2, damage: { stat: 'divinePower', multiplier: 1.1, perRank: 0.09 } }),
      rite({ id: 'slipstream', name: 'Slipstream', description: 'Ride the wind: Haste for 3 turns and +25 dodge for 2.', tags: ['Buff', 'Lightning', 'Divine', 'Movement'], element: 'lightning', targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'applyStatus', status: 'haste', duration: 3, target: 'self' }, { kind: 'buff', id: 'slipstream', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 25 }], target: 'self' }] }),
    ],
    avatar: avatar({ id: 'avatar-seraphel', name: 'Avatar of the Open Road', description: 'Become the Wind for 3 turns: +35% damage and Haste; every enemy takes 190% Divine Power lightning damage.', element: 'lightning', tags: ['Lightning', 'Divine', 'AoE'], damage: 1.9, buff: [flat('damageBonus', 35), pct('speed', 30)], effects: [{ kind: 'applyStatus', status: 'haste', duration: 3, target: 'self' }] }),
    weapon: { type: 'bow', names: ['Windpiercer', 'Windpiercer, Fledged', 'Windpiercer, Soaring', 'Windpiercer, the Open Road'], lore: 'It does not fly where it is aimed. It flies where it is needed.' },
    blessing: divineBlessing('seraphel', 'Windborn', 'Each turn, 25% chance to strike a random enemy with lightning (70% Divine Power). +20% lightning damage and +15 dodge.', [flat('lightningDamage', 20), flat('dodge', 15)], [{ id: 'windborn-bolt', trigger: 'onTurnStart', chance: 25, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'divinePower', ratio: 0.7 }, target: 'randomEnemy' }] }]),
    tree: {
      id: 'windborn', name: 'Windborn', color: '#7ad8e8', description: 'The restless road of Seraphel.',
      a: { skill: 'cutting-wind' },
      aMods: [{ name: 'Gale Force', patch: { description: '+25% damage, +25% MP cost.', powerMult: 1.25, costMult: 1.25 } }, { name: 'Static Gust', patch: { description: 'May Stun (20%).', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 20 }] } }],
      b: { skill: 'slipstream' },
      bMods: [{ name: 'Strong Current', patch: { description: 'Also shields you for 12% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 12 }] } }, { name: 'Quick Current', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } }],
      notables: [{ name: 'Free Spirit', mods: [flat('statusResist', 15), flat('dodge', 5)] }, { name: 'Tailwind', flags: ['firstStrike'] }],
      choice: [{ name: 'Sharp Gust', mods: [flat('critChance', 8)] }, { name: 'Soft Gust', mods: [pct('speed', 8)] }],
      keystone: { name: 'Nowhere to Be', text: 'Keystone: +15 dodge and +10% speed, -10% max HP.', mods: [flat('dodge', 15), pct('speed', 10), pct('maxHp', -10)] },
      capstone: { name: 'The Road Goes On', text: 'Start every battle with Haste for 2 turns.', triggers: [{ id: 'road-goes-on', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }] }] },
    },
  },
  follower: { name: 'Gust-Sprite of Seraphel', ai: 'aggressive', row: 'front', description: 'It is mostly a laugh, with a bolt of lightning to back it up.' },
  skill: {
    combat: combat({ id: 'd-gale', name: 'Gale', description: '90% Divine Power lightning damage to every enemy; 20% chance to Slow.', tags: ['Spell', 'Lightning', 'Divine', 'AoE'], element: 'lightning', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 3, damage: power(0.9), effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, chance: 20 }] }),
    general: divineSkill('seraphel', { id: 'rite-of-the-road', name: 'Rite of the Road', description: 'Gale in battle. Passive: +0.6 dodge per rank.', combatSkill: 'd-gale', passive: [flat('dodge', 0.6)] }),
  },
  items: [
    { id: 'wind-chime-of-seraphel', name: 'Wind-Chime of Seraphel', rarity: 'divine', baseId: 'amulet-t3', level: 20, requirements: req('seraphel', 'favored'), modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 15 }, { stat: 'dodge', type: 'flat', value: 8 }], effectText: [], lore: 'It rings only when someone, somewhere, has just opened a door.' },
    { id: 'cloak-of-open-roads', name: 'Cloak of Open Roads', rarity: 'divine', baseId: 'cloth-cloak-t4', level: 32, requirements: req('seraphel', 'devoted'), modifiers: [{ stat: 'speed', type: 'percent', value: 10 }, { stat: 'statusResist', type: 'flat', value: 20 }], effectText: [], lore: 'It has never been caught on anything, including the people trying to hold it.' },
  ],
  priest: { npc: { id: 'wanderer-pip', name: 'Wanderer Pip', town: 'sandhaven', race: 'gnome', portrait: 4, color: '#7ad8e8', greeting: '“Oh, are you leaving? Or arriving? It is the same door, you know. I keep forgetting which one I am.”' }, town: 'sandhaven' },
  offering: ['beast-fang', 6, 'Beast Fang'],
  will: deed('d', 'Land lightning-quick strikes (critical hits)', 10, { event: 'crit' }),
  glyph: 'star',
  zones: ['ashen-desert', 'stormcoast'],
};

const MIRRIN: GreaterGod = {
  god: { id: 'mirrin', name: 'Mirrin', epithet: 'the Keeper of What Was', domain: 'Memory & Time', element: 'arcane', favoredStats: ['int', 'wis'], color: '#d8b87a', symbol: 'An hourglass with a tiny door at its waist' },
  pantheon: {
    id: 'mirrin', alignment: 'True Neutral', personality: 'Gentle, exact and always a little bit already there.', rivals: ['morrath'], allies: ['aurelis', 'lyssara'],
    shrine: 'Hourglass Shrine', temple: 'The Archive of Hours',
    likes: [
      { event: 'bookRead', amount: 3, cap: 6, text: 'Learning what was written' },
      { event: 'identify', amount: 3, cap: 6, text: 'Uncovering what things were' },
      { event: 'questDone', amount: 2, text: 'Keeping an old promise' },
      { event: 'rest', amount: 1, text: 'Letting time pass properly' },
    ],
    dislikes: [
      { event: 'battleLost', amount: -2, text: 'Letting the story end early' },
      { event: 'itemBroken', amount: -2, cap: -6, text: 'Breaking things with a past' },
      { event: 'gamble', amount: -2, cap: -6, text: 'Gambling with what is already settled' },
    ],
    offerings: { goldPerFavor: 45, itemValuePerFavor: 16, categories: { book: 3, curiosity: 2 }, text: 'Treasures books, relics and anything with a date on it.' },
    prayer: { name: 'A Moment Borrowed', description: 'Take an extra turn immediately and Regenerate for 2 turns.', cost: 15, effects: [{ kind: 'timeShift', turns: -1, target: 'self' }, { kind: 'applyStatus', status: 'regen', duration: 2, target: 'self' }] },
    intervention: { name: 'It Has Not Happened Yet', text: 'Mirrin turns the hour back; the blow never lands, and you stand where you stood a breath ago.', effects: [{ kind: 'heal', percentMaxHp: 45, target: 'self' }, { kind: 'timeShift', turns: -1, target: 'self' }] },
  },
  blessings: [
    minor('mirrin', { id: 'mirrin-recall', name: 'Recall', description: '+10 accuracy.', modifiers: [flat('accuracy', 10)] }),
    minor('mirrin', { id: 'mirrin-patience', name: 'Patience', description: '+10% cooldown reduction.', modifiers: [flat('cooldownReduction', 10)] }),
    minor('mirrin', { id: 'mirrin-hindsight', name: 'Hindsight', rarity: 'uncommon', favorCost: 30, description: '+20% damage against enemies you have already hit.', modifiers: [flat('damageBonus', 20, { kind: 'targetHpBelow', pct: 90 })] }),
    major('mirrin', { id: 'mirrin-record', name: 'The Record', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% arcane damage and +5 INT.', modifiers: [flat('arcaneDamage', 10), flat('int', 5)] }),
    major('mirrin', { id: 'mirrin-memory', name: 'Long Memory', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% XP.', modifiers: [flat('xpGain', 10)] }),
    major('mirrin', { id: 'mirrin-hours', name: 'Spare Hours', rarity: 'uncommon', minTier: 'acknowledged', description: '+8% cooldown reduction and +2 MP regeneration.', modifiers: [flat('cooldownReduction', 8), flat('mpRegen', 2)] }),
    major('mirrin', { id: 'mirrin-echo', name: 'Echo of the Hour', rarity: 'rare', minTier: 'favored', description: 'Your spells have a chance to be cast twice.', modifiers: [], flags: ['spellEcho'] }),
    major('mirrin', { id: 'mirrin-fold', name: 'Folded Moment', rarity: 'epic', minTier: 'devoted', description: 'Start every battle with Haste for 2 turns; +15% arcane damage.', modifiers: [flat('arcaneDamage', 15)], triggers: [{ id: 'bless-mirrin-fold', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }] }] }),
    major('mirrin', { id: 'mirrin-hour', name: 'The Keeper of What Was', rarity: 'legendary', minTier: 'exalted', description: '+20% arcane damage and +15% cooldown reduction; once per battle, survive a killing blow with 1 HP.', modifiers: [flat('arcaneDamage', 20), flat('cooldownReduction', 15)], flags: ['reviveOnce'] }),
  ],
  apostle: {
    god: 'mirrin',
    skills: [
      rite({ id: 'hour-strike', name: 'Hour Strike', description: 'A blow that lands a moment before it is thrown: 160% Divine Power arcane damage; 25% chance to Slow.', tags: ['Spell', 'Arcane', 'Divine'], element: 'arcane', targeting: 'enemy', cost: { mp: 10 }, cooldown: 1, damage: { stat: 'divinePower', multiplier: 1.6, perRank: 0.12 }, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, chance: 25 }] }),
      rite({ id: 'recall-the-moment', name: 'Recall the Moment', description: 'Rewind: restore your best health of the last three turns and clear debuffs.', tags: ['Buff', 'Arcane', 'Divine'], element: 'arcane', targeting: 'self', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'rewind', target: 'self' }] }),
    ],
    avatar: avatar({ id: 'avatar-mirrin', name: 'Avatar of the Hour', description: 'Become the Keeper of What Was for 3 turns: +35% damage and 20% cooldown reduction; every enemy takes 170% Divine Power arcane damage and is Slowed. You act again at once.', element: 'arcane', tags: ['Arcane', 'Divine', 'AoE'], damage: 1.7, buff: [flat('damageBonus', 35), flat('cooldownReduction', 20)], effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, target: 'allEnemies' }, { kind: 'timeShift', turns: -1, target: 'self' }] }),
    weapon: { type: 'staff', names: ['Hourglass Staff', 'Hourglass Staff, Running', 'Hourglass Staff, Turned', 'Hourglass Staff, the Keeper'], lore: 'The sand inside does not fall. It remembers falling.' },
    blessing: divineBlessing('mirrin', 'Hourborn', 'Spells may echo; +20% arcane damage and 15% cooldown reduction.', [flat('arcaneDamage', 20), flat('cooldownReduction', 15)], undefined, ['spellEcho']),
    tree: {
      id: 'hourborn', name: 'Hourborn', color: '#d8b87a', description: 'The long memory of Mirrin.',
      a: { skill: 'hour-strike' },
      aMods: [{ name: 'Sharpened Hour', patch: { description: '+25% damage, +25% MP cost.', powerMult: 1.25, costMult: 1.25 } }, { name: 'Lingering Hour', patch: { description: 'Also Weakens.', addEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] } }],
      b: { skill: 'recall-the-moment' },
      bMods: [{ name: 'Fuller Recall', patch: { description: 'Also shields you for 12% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 12 }] } }, { name: 'Quick Recall', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } }],
      notables: [{ name: 'Perfect Recall', mods: [flat('cooldownReduction', 10), flat('accuracy', 6)] }, { name: 'Long Memory', mods: [flat('xpGain', 10), pct('magicAttack', 6)] }],
      choice: [{ name: 'Sharper Memory', mods: [pct('magicAttack', 12)] }, { name: 'Steadier Memory', mods: [pct('maxHp', 12)] }],
      keystone: { name: 'Everything at Once', text: 'Keystone: +20% cooldown reduction, -10% max HP.', mods: [flat('cooldownReduction', 20), pct('maxHp', -10)] },
      capstone: { name: 'It Has Already Happened', text: 'Start every battle with Haste for 2 turns.', triggers: [{ id: 'already-happened', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }] }] },
    },
  },
  follower: { name: 'Hour-Clerk of Mirrin', ai: 'caster', row: 'back', description: 'It keeps a ledger of the battle, and has been known to correct it.' },
  skill: {
    combat: combat({ id: 'd-borrowed-hour', name: 'Borrowed Hour', description: '120% Divine Power arcane damage; take an extra turn.', tags: ['Spell', 'Arcane', 'Divine'], element: 'arcane', targeting: 'enemy', cost: { mp: 14 }, cooldown: 5, damage: power(1.2), effects: [{ kind: 'timeShift', turns: -1, target: 'self' }] }),
    general: divineSkill('mirrin', { id: 'rite-of-hours', name: 'Rite of Hours', description: 'Borrowed Hour in battle. Passive: +0.5% cooldown reduction per rank.', combatSkill: 'd-borrowed-hour', passive: [flat('cooldownReduction', 0.5)] }),
  },
  items: [
    { id: 'hourglass-of-mirrin', name: 'Hourglass of Mirrin', rarity: 'divine', baseId: 'amulet-t3', level: 20, requirements: req('mirrin', 'favored'), modifiers: [{ stat: 'arcaneDamage', type: 'flat', value: 18 }, { stat: 'cooldownReduction', type: 'flat', value: 6 }], effectText: [], lore: 'Turn it over and the room gets very slightly older.' },
    { id: 'ledger-of-hours', name: 'Ledger of Hours', rarity: 'divine', baseId: 'tome-t4', level: 32, requirements: req('mirrin', 'devoted'), modifiers: [{ stat: 'magicAttack', type: 'percent', value: 15 }, { stat: 'xpGain', type: 'flat', value: 10 }], effectText: [], lore: 'Every name in it is spelled correctly, including the ones that have not happened yet.' },
  ],
  priest: { npc: { id: 'archivist-tamsin', name: 'Archivist Tamsin', town: 'brightwater', race: 'human', portrait: 5, color: '#d8b87a', greeting: '“You came right on time. Not early, not late. I do enjoy that in a visitor.”' }, town: 'brightwater' },
  offering: ['faint-essence', 6, 'Faint Essence'],
  will: deed('d', 'Uncover the past (identify items)', 4, { event: 'identify' }),
  glyph: 'scroll',
  zones: ['dark-citadel', 'meadowlands'],
};

export const GREATER_GOD_LIST: GreaterGod[] = [LYSSARA, ORDRUN, SERAPHEL, MIRRIN];
export const GREATER_GODS: GodDef[] = GREATER_GOD_LIST.map((g) => g.god);
export const GREATER_PANTHEON: PantheonDef[] = GREATER_GOD_LIST.map((g) => g.pantheon);
export const GREATER_BLESSINGS = GREATER_GOD_LIST.flatMap((g) => g.blessings);
export const GREATER_APOSTLES: ApostleContent[] = GREATER_GOD_LIST.map((g) => g.apostle);
export const GREATER_FOLLOWERS: Record<string, GreaterGod['follower']> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.god.id, g.follower]));
export const GREATER_DIVINE_COMBAT: SkillDef[] = GREATER_GOD_LIST.map((g) => g.skill.combat);
export const GREATER_DIVINE_SKILLS: GeneralSkillDef[] = GREATER_GOD_LIST.map((g) => g.skill.general);
export const GREATER_DIVINE_ITEMS: UniqueItemDef[] = GREATER_GOD_LIST.flatMap((g) => g.items);
export const GREATER_PRIEST_NPCS: NpcDef[] = GREATER_GOD_LIST.map((g) => ({ ...g.priest.npc, title: `Priest of ${g.god.name}`, place: 'temple' }));
export const GREATER_PRIESTS: Record<string, string> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.god.id, g.priest.npc.id]));
export const GREATER_OFFERINGS: Record<string, [string, number]> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.god.id, [g.offering[0], g.offering[1]]]));
export const GREATER_OFFERING_NAMES: Record<string, string> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.offering[0], g.offering[2]]));
export const GREATER_WILL: Record<string, ObjectiveDef> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.god.id, g.will]));
export const GREATER_GLYPHS: Record<string, string> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.god.id, g.glyph]));
/** Where each new god's temple stands, and which zones keep its shrines. */
export const GREATER_TEMPLES: Record<string, string> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.god.id, g.priest.town]));
export const GREATER_SHRINE_ZONES: Record<string, string[]> = Object.fromEntries(GREATER_GOD_LIST.map((g) => [g.god.id, g.zones]));
