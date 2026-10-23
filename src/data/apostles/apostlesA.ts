import { flat, more, pct, tag } from '../trees/builder';
import { avatar, divineBlessing, rite, type ApostleContent } from './helpers';

/** Apostles of Solenne, Morrath, Kael, Ysolde and Vex. */
export const APOSTLES_A: ApostleContent[] = [
  {
    god: 'solenne',
    skills: [
      rite({ id: 'radiant-verdict', name: 'Radiant Verdict', description: 'Pass judgement: 170% Divine Power holy damage.', tags: ['Spell', 'Holy', 'Divine'], element: 'holy', targeting: 'enemy', cost: { mp: 10 }, cooldown: 1, damage: { stat: 'divinePower', multiplier: 1.7, perRank: 0.12 } }),
      rite({ id: 'sanctified-ground', name: 'Sanctified Ground', description: 'Holy ground: the party Regenerates and gains +20% holy damage for 3 turns.', tags: ['Buff', 'Holy', 'Divine', 'AoE'], element: 'holy', targeting: 'allAllies', cost: { mp: 14 }, cooldown: 4, effects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }, { kind: 'buff', id: 'sanctified-ground', duration: 3, modifiers: [{ stat: 'holyDamage', type: 'flat', value: 20 }] }] }),
    ],
    avatar: avatar({ id: 'avatar-solenne', name: 'Avatar of the Sun', description: 'Become the Unclouded Eye for 3 turns: +40% damage, +30% defense, and a blinding flare (200% Divine Power holy) on every enemy.', element: 'holy', tags: ['Holy', 'Divine', 'AoE'], damage: 2, buff: [flat('damageBonus', 40), pct('defense', 30)], effects: [{ kind: 'applyStatus', status: 'blind', duration: 2, target: 'allEnemies' }] }),
    weapon: { type: 'mace', names: ['Dawnbreaker', 'Dawnbreaker, Risen', 'Dawnbreaker, Zenith', 'Dawnbreaker, the Unclouded'], lore: 'It burns brightest in the hand of the faithful.' },
    blessing: divineBlessing('solenne', 'Sunsworn', 'Your hits have a 25% chance to call down a pillar of light (80% Divine Power).', [flat('holyDamage', 30)], [{ id: 'sunsworn-pillar', trigger: 'onHit', chance: 25, cooldown: 1, effects: [{ kind: 'damage', element: 'holy', scaling: { stat: 'divinePower', ratio: 0.8 } }] }]),
    tree: {
      id: 'sunsworn', name: 'Sunsworn', color: '#ffd54a', description: 'The blazing law of Solenne.',
      a: { skill: 'radiant-verdict' },
      aMods: [
        { name: 'Verdict of Fire', patch: { description: 'Radiant Verdict Burns.', addEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] } },
        { name: 'Final Verdict', patch: { description: '+30% damage, +40% MP cost.', powerMult: 1.3, costMult: 1.4 } },
      ],
      b: { skill: 'sanctified-ground' },
      bMods: [
        { name: 'Hallowed Aegis', patch: { description: 'Also shields the party for 10% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 10 }] } },
        { name: 'Consecration', patch: { description: 'Also Blinds every enemy.', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 1, target: 'allEnemies' }] } },
      ],
      notables: [{ name: 'Lawbringer', text: '+25% damage against undead and cultists.', mods: [flat('damageBonus', 25, { kind: 'any', of: [{ kind: 'targetType', enemyType: 'undead' }, { kind: 'targetType', enemyType: 'cultist' }] })] }, { name: 'Noon', flags: ['strongerByDay'] }],
      choice: [{ name: 'Sword of Law', mods: [flat('critDamage', 25)] }, { name: 'Shield of Law', mods: [more('damageTaken', -10)] }],
      keystone: { name: 'Zealot', text: 'Keystone: +30% holy damage, but -20% max MP.', mods: [flat('holyDamage', 30), pct('maxMp', -20)] },
      capstone: { name: 'Light Everlasting', flags: ['reviveOnce'], mods: [flat('holyDamage', 20)] },
    },
  },
  {
    god: 'morrath',
    skills: [
      rite({ id: 'reap-the-fallen', name: 'Reap the Fallen', description: '160% Divine Power shadow damage; heal 10% of max HP.', tags: ['Spell', 'Shadow', 'Divine'], element: 'shadow', targeting: 'enemy', cost: { mp: 10 }, cooldown: 1, damage: { stat: 'divinePower', multiplier: 1.6, perRank: 0.12 }, effects: [{ kind: 'heal', percentMaxHp: 10, target: 'self' }] }),
      rite({ id: 'raven-host', name: 'Raven Host', description: 'Raise two skeletons and Fear every enemy for 1 turn.', tags: ['Summon', 'Shadow', 'Divine'], element: 'shadow', targeting: 'self', cost: { mp: 16 }, cooldown: 5, effects: [{ kind: 'summon', summonId: 'skeleton-warrior' }, { kind: 'summon', summonId: 'skeleton-warrior' }, { kind: 'applyStatus', status: 'fear', duration: 1, target: 'allEnemies' }] }),
    ],
    avatar: avatar({ id: 'avatar-morrath', name: 'Avatar of the Last Door', description: 'Become Death’s keeper for 3 turns: +40% damage and 20% lifesteal; every enemy takes 180% Divine Power shadow damage and is Cursed.', element: 'shadow', tags: ['Shadow', 'Divine', 'AoE'], damage: 1.8, buff: [flat('damageBonus', 40), flat('lifesteal', 20)], effects: [{ kind: 'applyStatus', status: 'curse', duration: 3, target: 'allEnemies' }] }),
    weapon: { type: 'scythe', names: ['Last Light', 'Last Light, Unlit', 'Last Light, Eclipse', 'Last Light, the Final Door'], lore: 'Every life it ends was already owed.' },
    blessing: divineBlessing('morrath', 'Deathless', 'Kills restore 15% of max HP and summon a skeleton (twice per battle).', [flat('shadowDamage', 30)], [{ id: 'deathless-harvest', trigger: 'onKill', limitPerCombat: 2, effects: [{ kind: 'heal', percentMaxHp: 15, target: 'self' }, { kind: 'summon', summonId: 'skeleton-warrior' }] }]),
    tree: {
      id: 'deathless', name: 'Deathless', color: '#7d5ba6', description: 'The patient hand of Morrath.',
      a: { skill: 'reap-the-fallen' },
      aMods: [
        { name: 'Soul Toll', patch: { description: 'Also restores 10 MP.', addEffects: [{ kind: 'restoreMp', amount: 10, target: 'self' }] } },
        { name: 'Grim Harvest', patch: { description: 'Hits every enemy for 60% of the damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
      ],
      b: { skill: 'raven-host' },
      bMods: [
        { name: 'Bone Choir', patch: { description: 'Also shields you for 15% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] } },
        { name: 'Murder of Crows', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } },
      ],
      notables: [{ name: 'Gravecaller', flags: ['extraSummon'] }, { name: 'Midnight', flags: ['strongerAtNight'] }],
      choice: [{ name: 'Executioner of Souls', flags: ['executioner'] }, { name: 'Lingering End', flags: ['dotsCanCrit'] }],
      keystone: { name: 'Pact of Endings', text: 'Keystone: +35% shadow damage, -15% max HP.', mods: [flat('shadowDamage', 35), pct('maxHp', -15)] },
      capstone: { name: 'Keeper of the Door', text: 'Kills Fear every enemy for 1 turn.', triggers: [{ id: 'keeper-door', trigger: 'onKill', effects: [{ kind: 'applyStatus', status: 'fear', duration: 1, target: 'allEnemies' }] }] },
    },
  },
  {
    god: 'kael',
    skills: [
      rite({ id: 'banner-strike', name: 'Banner Strike', description: 'A war-god’s blow for 140% ATK + 60% Divine Power. Heavy stagger.', tags: ['Attack', 'Melee', 'Physical', 'Divine'], element: 'physical', targeting: 'enemy', cost: { mp: 8 }, cooldown: 1, stagger: 2, damage: { stat: 'physicalAttack', multiplier: 1.4, perRank: 0.1 }, effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'divinePower', ratio: 0.6 } }] }),
      rite({ id: 'warcry-of-kael', name: 'Warcry of Kael', description: 'The party gains +25% damage and Haste for 2 turns.', tags: ['Buff', 'Shout', 'Divine', 'AoE'], element: 'physical', targeting: 'allAllies', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'buff', id: 'warcry-of-kael', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25 }] }, { kind: 'applyStatus', status: 'haste', duration: 2 }] }),
    ],
    avatar: avatar({ id: 'avatar-kael', name: 'Avatar of War', description: 'Become the Red Banner for 3 turns: +60% damage and +20% crit chance, and strike every enemy for 180% Divine Power.', element: 'physical', tags: ['Physical', 'Divine', 'AoE'], damage: 1.8, buff: [flat('damageBonus', 60), flat('critChance', 20)], effects: [] }),
    weapon: { type: 'greatsword', names: ['Warbringer', 'Warbringer, Bloodied', 'Warbringer, Triumphant', 'Warbringer, the Red Banner'], lore: 'It has never been sheathed in defeat.' },
    blessing: divineBlessing('kael', 'Glorybound', 'Every kill grants +15% damage for the rest of the battle (up to 3 times).', [flat('damageBonus', 15), flat('critDamage', 20)], [{ id: 'glorybound-kill', trigger: 'onKill', limitPerCombat: 3, effects: [{ kind: 'buff', id: 'glorybound', duration: 99, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }], target: 'self' }] }]),
    tree: {
      id: 'glorybound', name: 'Glorybound', color: '#d9433b', description: 'The roaring heart of Kael.',
      a: { skill: 'banner-strike' },
      aMods: [
        { name: 'Sundering Banner', patch: { description: 'Also makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
        { name: 'Cleaving Banner', patch: { description: 'Hits the whole front row for 75% of the damage.', targeting: 'frontRow', powerMult: 0.75, addTags: ['AoE'] } },
      ],
      b: { skill: 'warcry-of-kael' },
      bMods: [
        { name: 'Unbroken Line', patch: { description: 'Also +20% defense for the party.', addEffects: [{ kind: 'buff', id: 'unbroken-line', duration: 2, modifiers: [{ stat: 'defense', type: 'percent', value: 20 }] }] } },
        { name: 'Bloodlust Chant', patch: { description: 'Also Berserk for you.', addEffects: [{ kind: 'applyStatus', status: 'berserk', duration: 2, target: 'self' }] } },
      ],
      notables: [{ name: 'Champion’s Pride', flags: ['bonusVsBosses'] }, { name: 'First to Fight', flags: ['firstStrike'] }],
      choice: [{ name: 'Berserker’s Oath', mods: [flat('damageBonus', 20, { kind: 'hpBelow', pct: 50 })] }, { name: 'Shieldwall Oath', mods: [pct('defense', 20)] }],
      keystone: { name: 'No Retreat', text: 'Keystone: +30% damage, -10% defense.', mods: [flat('damageBonus', 30), pct('defense', -10)] },
      capstone: { name: 'Banner of Kael', text: 'Start every battle with Haste and +20% damage for 3 turns.', triggers: [{ id: 'banner-of-kael', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }, { kind: 'buff', id: 'banner-of-kael', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }], target: 'self' }] }] },
    },
  },
  {
    god: 'ysolde',
    skills: [
      rite({ id: 'moonlit-arrow', name: 'Moonlit Arrow', description: 'A silver arrow for 120% ATK + 60% Divine Power nature damage that Poisons.', tags: ['Attack', 'Ranged', 'Projectile', 'Nature', 'Divine'], element: 'nature', targeting: 'enemy', cost: { mp: 8 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.2, perRank: 0.08 }, effects: [{ kind: 'damage', element: 'nature', scaling: { stat: 'divinePower', ratio: 0.6 } }, { kind: 'applyStatus', status: 'poison', duration: 3 }] }),
      rite({ id: 'call-of-the-wild-hunt', name: 'Call of the Wild Hunt', description: 'Summon two spirit stags; every enemy is Slowed.', tags: ['Summon', 'Pet', 'Nature', 'Divine'], element: 'nature', targeting: 'self', cost: { mp: 16 }, cooldown: 5, effects: [{ kind: 'summon', summonId: 'spirit-stag' }, { kind: 'summon', summonId: 'spirit-stag' }, { kind: 'applyStatus', status: 'slow', duration: 2, target: 'allEnemies' }] }),
    ],
    avatar: avatar({ id: 'avatar-ysolde', name: 'Avatar of the Hunt', description: 'Become the Antlered Moon for 3 turns: +40% damage, +20 dodge and Regen; every enemy takes 160% Divine Power nature damage and is Poisoned.', element: 'nature', tags: ['Nature', 'Divine', 'AoE'], damage: 1.6, buff: [flat('damageBonus', 40), flat('dodge', 20)], effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 3, target: 'allEnemies' }, { kind: 'applyStatus', status: 'regen', duration: 3, target: 'self' }] }),
    weapon: { type: 'bow', names: ['Moonbough', 'Moonbough, Waxing', 'Moonbough, Full', 'Moonbough, the Antlered Moon'], lore: 'Strung with a hair from the first stag.' },
    blessing: divineBlessing('ysolde', 'Wildborn', 'A spirit stag joins you each battle, and your hits have a 25% chance to Poison.', [flat('natureDamage', 30)], [{ id: 'wildborn-stag', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'spirit-stag' }] }, { id: 'wildborn-poison', trigger: 'onHit', chance: 25, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3 }] }]),
    tree: {
      id: 'wildborn', name: 'Wildborn', color: '#4fa34a', description: 'The green, hungry joy of Ysolde.',
      a: { skill: 'moonlit-arrow' },
      aMods: [
        { name: 'Silver Volley', patch: { description: 'Two more arrows, +50% MP cost.', hitsAdd: 2, costMult: 1.5 } },
        { name: 'Hunter’s Mark', patch: { description: 'Also makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
      ],
      b: { skill: 'call-of-the-wild-hunt' },
      bMods: [
        { name: 'Alpha Call', patch: { description: 'Also +20% damage for 3 turns.', addEffects: [{ kind: 'buff', id: 'alpha-call', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }], target: 'self' }] } },
        { name: 'Thornwall', patch: { description: 'Also shields you for 15% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] } },
      ],
      notables: [{ name: 'Pack Mother', flags: ['extraSummon'] }, { name: 'Predator', text: '+20% damage against beasts.', mods: [flat('damageBonus', 20, { kind: 'targetType', enemyType: 'beast' })] }],
      choice: [{ name: 'Huntress', mods: [flat('damageBonus', 15, tag('Ranged'))] }, { name: 'Grovekeeper', mods: [flat('hpRegen', 8)] }],
      keystone: { name: 'Feral', text: 'Keystone: +25 dodge, -20% max HP.', mods: [flat('dodge', 25), pct('maxHp', -20)] },
      capstone: { name: 'The Green Hour', text: 'Each turn, 25% chance to Poison every enemy.', triggers: [{ id: 'green-hour', trigger: 'onTurnStart', chance: 25, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, target: 'allEnemies' }] }] },
    },
  },
  {
    god: 'vex',
    skills: [
      rite({ id: 'loaded-fortune', name: 'Loaded Fortune', description: 'Flip a coin of fate: 160% Divine Power arcane damage that always crits.', tags: ['Spell', 'Arcane', 'Divine'], element: 'arcane', targeting: 'enemy', cost: { mp: 10 }, cooldown: 2, alwaysCrit: true, damage: { stat: 'divinePower', multiplier: 1.6, perRank: 0.12 } }),
      rite({ id: 'sleight-of-fate', name: 'Sleight of Fate', description: 'Vanish into Stealth, gain +30% crit chance for 2 turns, and steal 15 gold.', tags: ['Buff', 'Arcane', 'Divine'], element: 'arcane', targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1 }, { kind: 'buff', id: 'sleight-of-fate', duration: 2, modifiers: [{ stat: 'critChance', type: 'flat', value: 30 }] }, { kind: 'gold', amount: 15 }] }),
    ],
    avatar: avatar({ id: 'avatar-vex', name: 'Avatar of Chance', description: 'Become the Smiling Coin for 3 turns: +50% crit chance and +40% crit damage; every enemy takes 150% Divine Power arcane damage and may be Charmed.', element: 'arcane', tags: ['Arcane', 'Divine', 'AoE'], damage: 1.5, buff: [flat('critChance', 50), flat('critDamage', 40)], effects: [{ kind: 'applyStatus', status: 'charm', duration: 1, chance: 40, target: 'allEnemies' }] }),
    weapon: { type: 'dagger', names: ['Snake Eyes', 'Snake Eyes, Lucky', 'Snake Eyes, Charmed', 'Snake Eyes, the Smiling Coin'], lore: 'It always lands point first. Usually.' },
    blessing: divineBlessing('vex', 'Fortune’s Own', 'Critical hits have a 35% chance to reduce your cooldowns by 1 and steal 10 gold.', [flat('critChance', 10), flat('magicFind', 30)], [{ id: 'fortunes-own', trigger: 'onCrit', chance: 35, effects: [{ kind: 'reduceCooldowns', turns: 1 }, { kind: 'gold', amount: 10 }] }]),
    tree: {
      id: 'fortunes-own', name: 'Fortune’s Own', color: '#e05fb8', description: 'The grinning luck of Vex.',
      a: { skill: 'loaded-fortune' },
      aMods: [
        { name: 'Double Down', patch: { description: 'One more hit, +50% MP cost.', hitsAdd: 1, costMult: 1.5 } },
        { name: 'Weighted Coin', patch: { description: 'Also Charms (30%).', addEffects: [{ kind: 'applyStatus', status: 'charm', duration: 1, chance: 30 }] } },
      ],
      b: { skill: 'sleight-of-fate' },
      bMods: [
        { name: 'Cardsharp', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } },
        { name: 'Pickpocket’s Prayer', patch: { description: 'Steals 30 more gold.', addEffects: [{ kind: 'gold', amount: 30 }] } },
      ],
      notables: [{ name: 'Lucky Streak', text: 'Critical hits Haste you (cooldown 2).', triggers: [{ id: 'lucky-streak', trigger: 'onCrit', cooldown: 2, effects: [{ kind: 'applyStatus', status: 'haste', duration: 1, target: 'self' }] }] }, { name: 'Now You See Me', flags: ['stealthOnCombatStart'] }],
      choice: [{ name: 'High Roller', mods: [flat('critDamage', 30)] }, { name: 'Card Counter', mods: [flat('magicFind', 25), flat('goldFind', 25)] }],
      keystone: { name: 'All In', text: 'Keystone: +20% crit chance, -15 accuracy.', mods: [flat('critChance', 20), flat('accuracy', -15)] },
      capstone: { name: 'House Edge', text: 'Kills reduce your cooldowns by 1.', triggers: [{ id: 'house-edge', trigger: 'onKill', effects: [{ kind: 'reduceCooldowns', turns: 1 }] }] },
    },
  },
];

