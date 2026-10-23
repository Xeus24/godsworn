import { flat, more, pct, tag } from '../trees/builder';
import { avatar, divineBlessing, rite, type ApostleContent } from './helpers';

/** Apostles of Thalor, Nymira, Aurelis, Hesha and Grimvald. */
export const APOSTLES_B: ApostleContent[] = [
  {
    god: 'thalor',
    skills: [
      rite({ id: 'hammerfall', name: 'Hammerfall', description: 'A forge-hot blow for 130% ATK + 60% Divine Power fire damage. Heavy stagger.', tags: ['Attack', 'Melee', 'Fire', 'Divine'], element: 'fire', targeting: 'enemy', cost: { mp: 8 }, cooldown: 1, stagger: 2, damage: { stat: 'physicalAttack', multiplier: 1.3, perRank: 0.1 }, effects: [{ kind: 'damage', element: 'fire', scaling: { stat: 'divinePower', ratio: 0.6 } }] }),
      rite({ id: 'anvil-ward', name: 'Anvil Ward', description: 'Shield yourself for 30% of max HP and gain +25% defense for 3 turns.', tags: ['Buff', 'Fire', 'Divine'], element: 'fire', targeting: 'self', cost: { mp: 12 }, cooldown: 4, effects: [{ kind: 'shield', percentMaxHp: 30 }, { kind: 'buff', id: 'anvil-ward', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 25 }] }] }),
    ],
    avatar: avatar({ id: 'avatar-thalor', name: 'Avatar of the Forge', description: 'Become the Anvil-Father for 3 turns: +40% damage and +50% defense; every enemy takes 180% Divine Power fire damage and Burns.', element: 'fire', tags: ['Fire', 'Divine', 'AoE'], damage: 1.8, buff: [flat('damageBonus', 40), pct('defense', 50)], effects: [{ kind: 'applyStatus', status: 'burn', duration: 3, target: 'allEnemies' }] }),
    weapon: { type: 'warhammer', names: ['Firstforged', 'Firstforged, Tempered', 'Firstforged, White-Hot', 'Firstforged, the Anvil-Father'], lore: 'The first thing ever made, and still the best.' },
    blessing: divineBlessing('thalor', 'Forgeborn', 'Take 12% less damage; hits have a 25% chance to Burn.', [pct('defense', 20), more('damageTaken', -12)], [{ id: 'forgeborn-burn', trigger: 'onHit', chance: 25, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] }]),
    tree: {
      id: 'forgeborn', name: 'Forgeborn', color: '#e8772e', description: 'The steady fire of Thalor.',
      a: { skill: 'hammerfall' },
      aMods: [
        { name: 'Shatterhammer', patch: { description: 'Also makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
        { name: 'Molten Strike', patch: { description: 'Burns, +20% MP cost.', costMult: 1.2, addEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] } },
      ],
      b: { skill: 'anvil-ward' },
      bMods: [
        { name: 'Reforged', patch: { description: 'Also heals 15% of max HP.', addEffects: [{ kind: 'heal', percentMaxHp: 15 }] } },
        { name: 'Slag Armor', patch: { description: 'Also Burns every enemy.', addEffects: [{ kind: 'applyStatus', status: 'burn', duration: 2, target: 'allEnemies' }] } },
      ],
      notables: [{ name: 'Master Smith', flags: ['armorTraining'], mods: [pct('defense', 10)] }, { name: 'Wildfire', flags: ['burnSpreadsOnDeath'] }],
      choice: [{ name: 'Hammer of the Forge', mods: [pct('physicalAttack', 12)] }, { name: 'Anvil of the Forge', mods: [pct('maxHp', 12)] }],
      keystone: { name: 'Forge Heart', text: 'Keystone: take 15% less damage, -8 speed.', mods: [more('damageTaken', -15), flat('speed', -8)] },
      capstone: { name: 'Unbreakable', text: 'Start every battle with a shield of 25% max HP.', triggers: [{ id: 'unbreakable', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 25, target: 'self' }] }] },
    },
  },
  {
    god: 'nymira',
    skills: [
      rite({ id: 'tidal-surge', name: 'Tidal Surge', description: 'A wave for 100% Divine Power ice damage to every enemy; they are Wet.', tags: ['Spell', 'Ice', 'Divine', 'AoE'], element: 'ice', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 2, damage: { stat: 'divinePower', multiplier: 1, perRank: 0.08 }, effects: [{ kind: 'applyStatus', status: 'wet', duration: 2 }] }),
      rite({ id: 'stormlash', name: 'Stormlash', description: '180% Divine Power lightning damage; 20% chance to Stun.', tags: ['Spell', 'Lightning', 'Divine'], element: 'lightning', targeting: 'enemy', cost: { mp: 10 }, cooldown: 1, damage: { stat: 'divinePower', multiplier: 1.8, perRank: 0.12 }, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 20 }] }),
    ],
    avatar: avatar({ id: 'avatar-nymira', name: 'Avatar of the Tempest', description: 'Become the Mother of Tides for 3 turns: +40% damage and Haste; every enemy takes 200% Divine Power lightning damage and may Freeze.', element: 'lightning', tags: ['Lightning', 'Divine', 'AoE'], damage: 2, buff: [flat('damageBonus', 40), pct('speed', 20)], effects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, chance: 40, target: 'allEnemies' }] }),
    weapon: { type: 'spear', names: ['Tidecaller’s Trident', 'Tidecaller’s Trident, Rising', 'Tidecaller’s Trident, Storm-Crowned', 'Tidecaller’s Trident, Mother of Tides'], lore: 'Pull it from the sea and the sea comes with it.' },
    blessing: divineBlessing('nymira', 'Stormborn', 'Each turn, 30% chance to strike a random enemy with lightning (80% Divine Power).', [flat('lightningDamage', 25), flat('iceDamage', 25)], [{ id: 'stormborn-bolt', trigger: 'onTurnStart', chance: 30, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'divinePower', ratio: 0.8 }, target: 'randomEnemy' }] }]),
    tree: {
      id: 'stormborn', name: 'Stormborn', color: '#3fa7d6', description: 'The restless sea of Nymira.',
      a: { skill: 'tidal-surge' },
      aMods: [
        { name: 'Undertow', patch: { description: 'Also Slows.', addEffects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] } },
        { name: 'Frozen Wave', patch: { description: 'May Freeze (25%).', addEffects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, chance: 25 }] } },
      ],
      b: { skill: 'stormlash' },
      bMods: [
        { name: 'Forked Lash', patch: { description: 'Hits every enemy for 55% of the damage.', targeting: 'allEnemies', powerMult: 0.55, addTags: ['AoE'] } },
        { name: 'Thunderhead', patch: { description: '+30% damage, +40% MP cost.', powerMult: 1.3, costMult: 1.4 } },
      ],
      notables: [{ name: 'Shatterstorm', flags: ['shatterAlways'] }, { name: 'Eye of the Storm', text: 'Lightning and Ice skills deal 15% more damage.', mods: [flat('damageBonus', 15, { kind: 'any', of: [tag('Lightning'), tag('Ice')] })] }],
      choice: [{ name: 'Tempest', mods: [flat('speed', 5)] }, { name: 'Deep Water', mods: [flat('mpRegen', 6)] }],
      keystone: { name: 'Riptide', text: 'Keystone: +30% lightning and ice damage, -20% defense.', mods: [flat('lightningDamage', 30), flat('iceDamage', 30), pct('defense', -20)] },
      capstone: { name: 'Mother of Tides', flags: ['spellEcho'], mods: [flat('lightningDamage', 15), flat('iceDamage', 15)] },
    },
  },
  {
    god: 'aurelis',
    skills: [
      rite({ id: 'word-of-unmaking', name: 'Word of Unmaking', description: '180% Divine Power arcane damage; Silences (40%).', tags: ['Spell', 'Arcane', 'Divine'], element: 'arcane', targeting: 'enemy', cost: { mp: 10 }, cooldown: 1, damage: { stat: 'divinePower', multiplier: 1.8, perRank: 0.12 }, effects: [{ kind: 'applyStatus', status: 'silence', duration: 1, chance: 40 }] }),
      rite({ id: 'the-thousand-pages', name: 'The Thousand Pages', description: 'Pages whirl around you: restore 30 MP, reduce cooldowns by 2, and +20% damage for 2 turns.', tags: ['Buff', 'Arcane', 'Divine'], element: 'arcane', targeting: 'self', cost: {}, cooldown: 5, effects: [{ kind: 'restoreMp', amount: 30 }, { kind: 'reduceCooldowns', turns: 2 }, { kind: 'buff', id: 'thousand-pages', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }] }] }),
    ],
    avatar: avatar({ id: 'avatar-aurelis', name: 'Avatar of Knowing', description: 'Become the Thousand-Page for 3 turns: +50% damage and +5 MP regeneration; every enemy takes 200% Divine Power arcane damage and is Silenced.', element: 'arcane', tags: ['Arcane', 'Divine', 'AoE'], damage: 2, buff: [flat('damageBonus', 50), flat('mpRegen', 5)], effects: [{ kind: 'applyStatus', status: 'silence', duration: 1, target: 'allEnemies' }] }),
    weapon: { type: 'staff', names: ['Margin of Stars', 'Margin of Stars, Annotated', 'Margin of Stars, Illuminated', 'Margin of Stars, the Thousand-Page'], lore: 'Someone wrote the answers in the margin. All of them.' },
    blessing: divineBlessing('aurelis', 'Lorebound', '20% chance for spells to cast twice; +10% cooldown reduction.', [flat('arcaneDamage', 30), flat('cooldownReduction', 10)], undefined, ['spellEcho']),
    tree: {
      id: 'lorebound', name: 'Lorebound', color: '#6f7ff0', description: 'The endless curiosity of Aurelis.',
      a: { skill: 'word-of-unmaking' },
      aMods: [
        { name: 'Erasure', patch: { description: 'Also makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
        { name: 'Recitation', patch: { description: 'One more hit, +50% MP cost.', hitsAdd: 1, costMult: 1.5 } },
      ],
      b: { skill: 'the-thousand-pages' },
      bMods: [
        { name: 'Footnotes', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } },
        { name: 'Glossary', patch: { description: 'Also shields you for 15% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 15 }] } },
      ],
      notables: [{ name: 'Echoing Word', flags: ['spellEcho'] }, { name: 'Scholar', text: 'Spells deal 15% more damage.', mods: [flat('damageBonus', 15, tag('Spell'))] }],
      choice: [{ name: 'Insight', mods: [flat('xpGain', 15)] }, { name: 'Focus', mods: [pct('maxMp', 20)] }],
      keystone: { name: 'Forbidden Knowledge', text: 'Keystone: +35% arcane damage, -15% max HP.', mods: [flat('arcaneDamage', 35), pct('maxHp', -15)] },
      capstone: { name: 'Omniscience', text: 'Skills have a 25% chance to reduce your cooldowns by 1.', triggers: [{ id: 'omniscience', trigger: 'onSkillCast', chance: 25, effects: [{ kind: 'reduceCooldowns', turns: 1 }] }] },
    },
  },
  {
    god: 'hesha',
    skills: [
      rite({ id: 'mercy-of-the-hearth', name: 'Mercy of the Hearth', description: 'Heal the party for 120% Divine Power and remove Poison and Bleed.', tags: ['Spell', 'Heal', 'Holy', 'Divine', 'AoE'], element: 'holy', targeting: 'allAllies', cost: { mp: 14 }, cooldown: 2, heal: { stat: 'divinePower', multiplier: 1.2, perRank: 0.1 }, effects: [{ kind: 'removeStatus', status: 'poison' }, { kind: 'removeStatus', status: 'bleed' }] }),
      rite({ id: 'gentle-rebuke', name: 'Gentle Rebuke', description: '130% Divine Power holy damage that Weakens; heal 8% of max HP.', tags: ['Spell', 'Holy', 'Divine'], element: 'holy', targeting: 'enemy', cost: { mp: 8 }, cooldown: 1, damage: { stat: 'divinePower', multiplier: 1.3, perRank: 0.1 }, effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }, { kind: 'heal', percentMaxHp: 8, target: 'self' }] }),
    ],
    avatar: avatar({ id: 'avatar-hesha', name: 'Avatar of the Hearth', description: 'Become the Keeper of the Hearth for 3 turns: take 40% less damage and gain +30 healing power; every enemy takes 150% Divine Power holy damage, and you heal fully.', element: 'holy', tags: ['Holy', 'Heal', 'Divine', 'AoE'], damage: 1.5, buff: [more('damageTaken', -40), flat('healingPower', 30)], effects: [{ kind: 'heal', percentMaxHp: 100, target: 'self' }] }),
    weapon: { type: 'staff', names: ['Hearthstaff', 'Hearthstaff, Kindled', 'Hearthstaff, Ever-Lit', 'Hearthstaff, Keeper of the Hearth'], lore: 'Warm in winter. Warmer in battle.' },
    blessing: divineBlessing('hesha', 'Hearthbound', 'Heal 6% of max HP at the start of each turn; half of overhealing becomes a shield.', [flat('healingPower', 30), pct('maxHp', 15)], [{ id: 'hearthbound-heal', trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: 6, target: 'self' }] }], ['overhealShield']),
    tree: {
      id: 'hearthbound', name: 'Hearthbound', color: '#f2a06b', description: 'The tireless kindness of Hesha.',
      a: { skill: 'mercy-of-the-hearth' },
      aMods: [
        { name: 'Warm Embrace', patch: { description: 'Also Regenerates the party.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }] } },
        { name: 'Shelter', patch: { description: 'Also shields the party for 10% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 10 }] } },
      ],
      b: { skill: 'gentle-rebuke' },
      bMods: [
        { name: 'Firm Hand', patch: { description: 'May Stun (25%).', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 25 }] } },
        { name: 'Kind Word', patch: { description: 'Heals twice as much.', addEffects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }] } },
      ],
      notables: [{ name: 'Overflowing Cup', flags: ['overhealShield'] }, { name: 'Banked Fire', text: 'Heal 4% of max HP each turn.', triggers: [{ id: 'banked-fire', trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: 4, target: 'self' }] }] }],
      choice: [{ name: 'Nurse', mods: [flat('healingPower', 20)] }, { name: 'Guardian', mods: [more('damageTaken', -10)] }],
      keystone: { name: 'Pacifist’s Vow', text: 'Keystone: +40 healing power, -20% damage.', mods: [flat('healingPower', 40), flat('damageBonus', -20)] },
      capstone: { name: 'Hearth Eternal', flags: ['reviveOnce'], mods: [pct('maxHp', 10)] },
    },
  },
  {
    god: 'grimvald',
    skills: [
      rite({ id: 'golden-rebuke', name: 'Golden Rebuke', description: 'A strike of solid gold for 120% ATK + 60% Divine Power; steal 10 gold.', tags: ['Attack', 'Melee', 'Physical', 'Divine'], element: 'physical', targeting: 'enemy', cost: { mp: 8 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.2, perRank: 0.08 }, effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'divinePower', ratio: 0.6 } }, { kind: 'gold', amount: 10 }] }),
      rite({ id: 'audit', name: 'Audit', description: 'Every enemy is Weakened and Vulnerable for 2 turns; you gain a shield of 20% max HP.', tags: ['Debuff', 'Divine', 'AoE'], element: 'physical', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 4, effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }, { kind: 'applyStatus', status: 'vulnerable', duration: 2 }, { kind: 'shield', percentMaxHp: 20, target: 'self' }] }),
    ],
    avatar: avatar({ id: 'avatar-grimvald', name: 'Avatar of Wealth', description: 'Become the Golden Scale for 3 turns: +40% damage and a golden shield; every enemy takes 160% Divine Power and you gain 50 gold.', element: 'physical', tags: ['Physical', 'Divine', 'AoE'], damage: 1.6, buff: [flat('damageBonus', 40), pct('defense', 30)], effects: [{ kind: 'shield', percentMaxHp: 30, target: 'self' }, { kind: 'gold', amount: 50 }] }),
    weapon: { type: 'axe', names: ['Ledger’s Edge', 'Ledger’s Edge, Audited', 'Ledger’s Edge, Compounded', 'Ledger’s Edge, the Golden Scale'], lore: 'Every swing is entered into the books.' },
    blessing: divineBlessing('grimvald', 'Goldbound', 'Kills grant 15 gold; +50% gold find and +30% magic find.', [flat('goldFind', 50), flat('magicFind', 30)], [{ id: 'goldbound-kill', trigger: 'onKill', effects: [{ kind: 'gold', amount: 15 }] }]),
    tree: {
      id: 'goldbound', name: 'Goldbound', color: '#c9a227', description: 'The careful fortune of Grimvald.',
      a: { skill: 'golden-rebuke' },
      aMods: [
        { name: 'Collections', patch: { description: 'Steals 20 more gold.', addEffects: [{ kind: 'gold', amount: 20 }] } },
        { name: 'Heavy Coin', patch: { description: '+30% damage, +30% MP cost.', powerMult: 1.3, costMult: 1.3 } },
      ],
      b: { skill: 'audit' },
      bMods: [
        { name: 'Penalty Clause', patch: { description: 'Also Slows every enemy.', addEffects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] } },
        { name: 'Insured', patch: { description: 'The shield doubles.', addEffects: [{ kind: 'shield', percentMaxHp: 20, target: 'self' }] } },
      ],
      notables: [{ name: 'Interest', text: 'Kills grant 10 gold.', triggers: [{ id: 'interest', trigger: 'onKill', effects: [{ kind: 'gold', amount: 10 }] }] }, { name: 'Appraiser', mods: [flat('magicFind', 25)] }],
      choice: [{ name: 'Investor', mods: [flat('xpGain', 10), flat('goldFind', 20)] }, { name: 'Banker', mods: [pct('defense', 15)] }],
      keystone: { name: 'Greed', text: 'Keystone: +60% gold find and +20% damage, but take 10% more damage.', mods: [flat('goldFind', 60), flat('damageBonus', 20), more('damageTaken', 10)] },
      capstone: { name: 'The Golden Scale', text: 'Start every battle with a shield of 20% max HP.', mods: [flat('goldFind', 30)], triggers: [{ id: 'golden-scale-cap', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 20, target: 'self' }] }] },
    },
  },
];
