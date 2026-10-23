import type { SkillDef } from '../../engine/skills/types';
import { flat, more, pct, tag, type SpecBranchSpec } from './builder';

const ult = (s: Omit<SkillDef, 'source' | 'maxRank' | 'cost' | 'cooldown' | 'ultimate'>): SkillDef => ({ ...s, source: 'ultimate', maxRank: 1, cost: {}, cooldown: 0, ultimate: true });
const spec = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'specialization', maxRank: 5 });

export const MARTIAL_SPEC_SKILLS: SkillDef[] = [
  // Warrior
  spec({ id: 'frenzied-assault', name: 'Frenzied Assault', description: 'Three savage blows for 70% ATK each; heal 4% of max HP.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: { resource: { id: 'rage', amount: 30 } }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 0.7, perRank: 0.06, hits: 3 }, effects: [{ kind: 'heal', percentMaxHp: 4, target: 'self' }] }),
  ult({ id: 'bloodstorm', name: 'Bloodstorm', description: 'A storm of blades: 300% ATK to every enemy, heal 20% of max HP and go Berserk.', tags: ['Attack', 'Melee', 'Physical', 'AoE'], element: 'physical', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 3, perRank: 0 }, effects: [{ kind: 'heal', percentMaxHp: 20, target: 'self' }, { kind: 'applyStatus', status: 'berserk', duration: 3, target: 'self' }] }),
  spec({ id: 'crusader-strike', name: 'Crusader Strike', description: 'A holy strike for 160% ATK as holy damage; heal 5% of max HP.', tags: ['Attack', 'Melee', 'Holy', 'Divine'], element: 'holy', targeting: 'enemy', cost: { mp: 8 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.6, perRank: 0.12 }, effects: [{ kind: 'heal', percentMaxHp: 5, target: 'self' }] }),
  ult({ id: 'hammer-of-heaven', name: 'Hammer of Heaven', description: 'A hammer of light: 220% ATK holy damage to every enemy and Divine Protection for the party.', tags: ['Attack', 'Holy', 'Divine', 'AoE'], element: 'holy', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 2.2, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 2, target: 'allAllies' }] }),
  spec({ id: 'rallying-banner', name: 'Rallying Banner', description: 'Plant a banner: the party gains +15% damage and +15% defense for 3 turns.', tags: ['Buff', 'Shout', 'AoE'], element: 'physical', targeting: 'allAllies', cost: { resource: { id: 'rage', amount: 20 } }, cooldown: 5, effects: [{ kind: 'buff', id: 'rallying-banner', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'defense', type: 'percent', value: 15 }] }] }),
  ult({ id: 'grand-offensive', name: 'Grand Offensive', description: 'Lead the charge: 200% ATK to every enemy (30% Stun) and Haste the party.', tags: ['Attack', 'Melee', 'Physical', 'AoE', 'Shout'], element: 'physical', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 2, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 30 }, { kind: 'applyStatus', status: 'haste', duration: 2, target: 'allAllies' }] }),
  // Rogue
  spec({ id: 'assassinate', name: 'Assassinate', description: 'Spend 3 Combo Points: a perfect strike for 260% ATK that always crits.', tags: ['Attack', 'Melee', 'Physical', 'Finisher'], element: 'physical', targeting: 'enemy', cost: { resource: { id: 'combo', amount: 3 } }, cooldown: 3, alwaysCrit: true, damage: { stat: 'physicalAttack', multiplier: 2.6, perRank: 0.18 } }),
  ult({ id: 'thousand-cuts', name: 'Thousand Cuts', description: 'Ten flashing cuts on one enemy, 50% ATK each, every one a critical hit.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', alwaysCrit: true, damage: { stat: 'physicalAttack', multiplier: 0.5, perRank: 0, hits: 10 } }),
  spec({ id: 'shadow-step', name: 'Shadow Step', description: 'Step through shadow to any enemy for 140% ATK shadow damage, then enter Stealth.', tags: ['Attack', 'Melee', 'Shadow', 'Movement'], element: 'shadow', targeting: 'enemy', cost: {}, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 1.4, perRank: 0.1 }, effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self' }], generates: { resource: 'combo', amount: 1 } }),
  ult({ id: 'shadow-storm', name: 'Shadow Storm', description: 'Shadows erupt: 250% ATK shadow damage to every enemy, and you vanish into Stealth.', tags: ['Attack', 'Shadow', 'AoE'], element: 'shadow', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 2.5, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'stealth', duration: 2, target: 'self' }] }),
  spec({ id: 'flourish', name: 'Flourish', description: 'A dazzling strike for 180% ATK; you Taunt enemies and gain +15% dodge.', tags: ['Attack', 'Melee', 'Physical', 'Builder'], element: 'physical', targeting: 'enemy', cost: {}, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 1.8, perRank: 0.12 }, effects: [{ kind: 'applyStatus', status: 'taunt', duration: 1, target: 'self' }, { kind: 'buff', id: 'flourish', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 15 }], target: 'self' }], generates: { resource: 'combo', amount: 1 } }),
  ult({ id: 'grand-flourish', name: 'Grand Flourish', description: 'A whirlwind performance: six strikes of 80% ATK at random enemies; the party gains +20% crit for 2 turns.', tags: ['Attack', 'Melee', 'Physical', 'AoE'], element: 'physical', targeting: 'randomEnemies', damage: { stat: 'physicalAttack', multiplier: 0.8, perRank: 0, hits: 6 }, effects: [{ kind: 'buff', id: 'grand-flourish', duration: 2, modifiers: [{ stat: 'critChance', type: 'flat', value: 20 }], target: 'allAllies' }] }),
  // Ranger
  spec({ id: 'bestial-wrath', name: 'Bestial Wrath', description: 'Drive your pack wild: the party (and every pet) deals +30% damage for 3 turns.', tags: ['Buff', 'Pet', 'Shout', 'AoE'], element: 'nature', targeting: 'allAllies', cost: { mp: 12 }, cooldown: 5, effects: [{ kind: 'buff', id: 'bestial-wrath', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 30 }] }] }),
  ult({ id: 'stampede', name: 'Stampede', description: 'A stampede of spirit beasts: 220% ATK nature damage to every enemy, and a spirit stag joins you.', tags: ['Attack', 'Nature', 'Pet', 'AoE'], element: 'nature', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 2.2, perRank: 0 }, effects: [{ kind: 'summon', summonId: 'spirit-stag' }] }),
  spec({ id: 'deadly-aim', name: 'Deadly Aim', description: 'Spend 3 Focus: a devastating shot for 280% ATK. Heavy stagger.', tags: ['Attack', 'Ranged', 'Projectile', 'Physical'], element: 'physical', targeting: 'enemy', cost: { resource: { id: 'focus', amount: 3 } }, cooldown: 2, stagger: 2, damage: { stat: 'physicalAttack', multiplier: 2.8, perRank: 0.18 } }),
  ult({ id: 'final-arrow', name: 'Final Arrow', description: 'One perfect arrow: 600% ATK, always a critical hit.', tags: ['Attack', 'Ranged', 'Projectile', 'Physical'], element: 'physical', targeting: 'enemy', alwaysCrit: true, damage: { stat: 'physicalAttack', multiplier: 6, perRank: 0 } }),
  spec({ id: 'entangling-roots', name: 'Entangling Roots', description: 'Roots grip every enemy: 80% ATK nature damage, Slow, and a chance to Stun.', tags: ['Attack', 'Nature', 'AoE'], element: 'nature', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 0.8, perRank: 0.07 }, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }, { kind: 'applyStatus', status: 'stun', duration: 1, chance: 25 }] }),
  ult({ id: 'wrath-of-nature', name: 'Wrath of Nature', description: 'The forest rises: 250% ATK nature damage to every enemy with heavy Poison, and the party regenerates.', tags: ['Attack', 'Nature', 'AoE'], element: 'nature', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 2.5, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 3 }, { kind: 'applyStatus', status: 'regen', duration: 3, target: 'allAllies' }] }),
  // Monk
  spec({ id: 'seven-sided-strike', name: 'Seven-Sided Strike', description: 'Spend 3 Chi: strike seven times at random enemies for 45% ATK each.', tags: ['Attack', 'Melee', 'Physical', 'AoE'], element: 'physical', targeting: 'randomEnemies', cost: { resource: { id: 'chi', amount: 3 } }, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 0.45, perRank: 0.04, hits: 7 } }),
  ult({ id: 'fists-of-fury', name: 'Fists of Fury', description: 'Sixteen strikes on one enemy, 40% ATK each.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', stagger: 2, damage: { stat: 'physicalAttack', multiplier: 0.4, perRank: 0, hits: 16 } }),
  spec({ id: 'spirit-palm', name: 'Spirit Palm', description: 'A palm of spirit force for 180% ATK arcane damage; heal 10% of max HP and gain 1 Chi.', tags: ['Attack', 'Melee', 'Arcane', 'Heal'], element: 'arcane', targeting: 'enemy', cost: { mp: 8 }, cooldown: 2, damage: { stat: 'physicalAttack', multiplier: 1.8, perRank: 0.12 }, effects: [{ kind: 'heal', percentMaxHp: 10, target: 'self' }], generates: { resource: 'chi', amount: 1 } }),
  ult({ id: 'nirvana', name: 'Nirvana', description: 'Perfect calm: heal 60% of max HP, gain Divine Protection and full Chi, and strike every enemy for 150% ATK.', tags: ['Attack', 'Arcane', 'Heal', 'AoE'], element: 'arcane', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 1.5, perRank: 0 }, effects: [{ kind: 'heal', percentMaxHp: 60, target: 'self' }, { kind: 'applyStatus', status: 'divine-protection', duration: 2, target: 'self' }, { kind: 'gainResource', resource: 'chi', amount: 5 }] }),
  spec({ id: 'cyclone-kick', name: 'Cyclone Kick', description: 'Spend 1 Chi: a spinning kick through the front row for 130% ATK; gain +10% dodge.', tags: ['Attack', 'Melee', 'Physical', 'AoE'], element: 'physical', targeting: 'frontRow', cost: { resource: { id: 'chi', amount: 1 } }, cooldown: 2, damage: { stat: 'physicalAttack', multiplier: 1.3, perRank: 0.1 }, effects: [{ kind: 'buff', id: 'cyclone-kick', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 10 }], target: 'self' }] }),
  ult({ id: 'tempest-dance', name: 'Tempest Dance', description: 'A dance like a storm: ten strikes of 50% ATK at random enemies, and you are Hasted.', tags: ['Attack', 'Melee', 'Physical', 'AoE'], element: 'physical', targeting: 'randomEnemies', damage: { stat: 'physicalAttack', multiplier: 0.5, perRank: 0, hits: 10 }, effects: [{ kind: 'applyStatus', status: 'haste', duration: 3, target: 'self' }] }),
];

export const MARTIAL_SPEC_BRANCHES: Record<string, SpecBranchSpec[]> = {
  warrior: [
    {
      id: 'berserker', name: 'Berserker', color: '#d22d3c', description: 'Unbound fury: the closer to death, the deadlier.', ultimate: 'bloodstorm', skill: 'frenzied-assault',
      mods: [
        { name: 'Blood Spray', patch: { description: 'Frenzied Assault causes Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3, stacks: 2 }] } },
        { name: 'Endless Frenzy', patch: { description: 'One more blow, 30% more Rage.', hitsAdd: 1, costMult: 1.3 } },
      ],
      minors: [{ name: 'Savage', mods: [flat('damageBonus', 3)] }, { name: 'Bloodletter', mods: [flat('lifesteal', 1)] }, { name: 'Brutality', mods: [flat('critDamage', 6)] }],
      notables: [{ name: 'Unstoppable Rage', mods: [flat('resourceGain', 20)], flags: ['immune:fear'] }, { name: 'Death Wish', mods: [flat('damageBonus', 30, { kind: 'hpBelow', pct: 50 })], text: '+30% damage below 50% HP.' }],
      choice: [{ name: 'Bloodbath', text: 'Kills heal 10% of max HP.', triggers: [{ id: 'berserker-bloodbath', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 10, target: 'self' }] }] }, { name: 'Rampant', mods: [flat('speed', 6)] }],
      capstone: { name: 'Undying Rage', mods: [flat('damageBonus', 15)], flags: ['reviveOnce'] },
    },
    {
      id: 'paladin', name: 'Paladin', color: '#ffd54a', description: 'A holy warrior: steel and faith as one.', ultimate: 'hammer-of-heaven', skill: 'crusader-strike',
      mods: [
        { name: 'Judgement Strike', patch: { description: 'Crusader Strike deals 30% more damage.', powerMult: 1.3 } },
        { name: 'Blessed Strike', patch: { description: 'Crusader Strike grants Divine Protection for 1 turn.', addEffects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 1, target: 'self' }] } },
      ],
      minors: [{ name: 'Holy Edge', mods: [flat('holyDamage', 4)] }, { name: 'Shield of Faith', mods: [pct('defense', 4)] }, { name: 'Devout', mods: [flat('fai', 2)] }],
      notables: [{ name: 'Aura of Devotion', mods: [more('damageTaken', -8)] }, { name: 'Holy Avenger', mods: [flat('damageBonus', 25, { kind: 'any', of: [{ kind: 'targetType', enemyType: 'undead' }, { kind: 'targetType', enemyType: 'cultist' }] })], text: '+25% damage against undead and cultists.' }],
      choice: [{ name: 'Righteous Fury', mods: [flat('holyDamage', 20)] }, { name: 'Guardian', mods: [pct('maxHp', 12)] }],
      capstone: { name: 'Lay on Hands', text: 'The first time you fall below 30% HP each battle, heal 50%.', triggers: [{ id: 'paladin-lay-on-hands', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'heal', percentMaxHp: 50, target: 'self' }] }] },
    },
    {
      id: 'warlord', name: 'Warlord', color: '#8a96a8', description: 'A commander who wins battles before they start.', ultimate: 'grand-offensive', skill: 'rallying-banner',
      mods: [
        { name: 'War Banner', patch: { description: 'Rallying Banner also Hastes the party.', addEffects: [{ kind: 'applyStatus', status: 'haste', duration: 2 }] } },
        { name: 'Iron Banner', patch: { description: 'Rallying Banner also shields the party for 10% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 10 }] } },
      ],
      minors: [{ name: 'Commanding', mods: [flat('damageBonus', 2)] }, { name: 'Disciplined', mods: [pct('defense', 3)] }, { name: 'Tactics', mods: [flat('cooldownReduction', 1)] }],
      notables: [{ name: 'Inspiring Leader', mods: [flat('damageBonus', 10)] }, { name: 'Field Marshal', flags: ['firstStrike'] }],
      choice: [{ name: 'Phalanx', mods: [pct('defense', 15)] }, { name: 'Spearhead', mods: [flat('critChance', 6)] }],
      capstone: { name: 'Supreme Commander', text: 'The party starts every battle with +20% damage for 3 turns.', triggers: [{ id: 'warlord-supreme', trigger: 'onCombatStart', effects: [{ kind: 'buff', id: 'supreme-commander', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }], target: 'allAllies' }] }] },
    },
  ],
  rogue: [
    {
      id: 'assassin', name: 'Assassin', color: '#a8232f', description: 'One target. One strike. No witnesses.', ultimate: 'thousand-cuts', skill: 'assassinate',
      mods: [
        { name: 'Silent Kill', patch: { description: 'Assassinate puts you back in Stealth.', addEffects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self' }] } },
        { name: 'Deathblow', patch: { description: '30% more damage, costs 5 Combo Points.', powerMult: 1.3, costMult: 1.67 } },
      ],
      minors: [{ name: 'Ruthless', mods: [flat('critDamage', 6)] }, { name: 'Precise', mods: [flat('critChance', 1)] }, { name: 'Honed', mods: [pct('physicalAttack', 3)] }],
      notables: [{ name: 'Lethal Precision', flags: ['critsIgnoreDefense'] }, { name: 'Shadowstrike', mods: [flat('damageBonus', 30, { kind: 'hasStatus', status: 'stealth' })], text: '+30% damage while in Stealth.' }],
      choice: [{ name: 'Contract Killer', flags: ['bonusVsBosses'] }, { name: 'Marked for Death', text: 'Crits make the target Vulnerable.', triggers: [{ id: 'assassin-marked', trigger: 'onCrit', effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] }] }],
      capstone: { name: 'Angel of Death', mods: [flat('critDamage', 30)], flags: ['executioner'] },
    },
    {
      id: 'shadowdancer', name: 'Shadowdancer', color: '#5a3a8a', description: 'Never where the blade falls.', ultimate: 'shadow-storm', skill: 'shadow-step',
      mods: [
        { name: 'Umbral Blade', patch: { description: 'Shadow Step deals 25% more damage.', powerMult: 1.25 } },
        { name: 'Shadow Veil', patch: { description: 'Shadow Step grants +15% dodge for 2 turns.', addEffects: [{ kind: 'buff', id: 'shadow-veil', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 15 }], target: 'self' }] } },
      ],
      minors: [{ name: 'Elusive', mods: [flat('dodge', 1)] }, { name: 'Umbral', mods: [flat('shadowDamage', 4)] }, { name: 'Light Feet', mods: [flat('speed', 1)] }],
      notables: [{ name: 'Dance of Shadows', text: 'Dodging puts you in Stealth.', triggers: [{ id: 'shadowdancer-dance', trigger: 'onDodge', effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self' }] }] }, { name: 'Night Blade', flags: ['strongerAtNight'] }],
      choice: [{ name: 'Evasion Mastery', mods: [flat('dodge', 8)] }, { name: 'Smoke and Mirrors', text: '25% chance to Blind attackers.', triggers: [{ id: 'shadowdancer-mirrors', trigger: 'onDamageTaken', chance: 25, effects: [{ kind: 'applyStatus', status: 'blind', duration: 2, target: 'target' }] }] }],
      capstone: { name: 'One with Darkness', mods: [flat('shadowDamage', 25)], flags: ['stealthOnCombatStart'] },
    },
    {
      id: 'swashbuckler', name: 'Swashbuckler', color: '#e8a83a', description: 'Style, luck and a dazzling blade.', ultimate: 'grand-flourish', skill: 'flourish',
      mods: [
        { name: 'Dazzling Flourish', patch: { description: 'Flourish Blinds the target.', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2 }] } },
        { name: 'Flashy', patch: { description: 'Flourish earns 15 gold.', addEffects: [{ kind: 'gold', amount: 15 }] } },
      ],
      minors: [{ name: 'Fortunate', mods: [flat('luk', 2)] }, { name: 'Flair', mods: [flat('critChance', 1)] }, { name: 'Plunder', mods: [flat('goldFind', 4)] }],
      notables: [{ name: 'Panache', mods: [flat('damageBonus', 15, { kind: 'hpAbove', pct: 70 })], text: '+15% damage above 70% HP.' }, { name: 'Lucky Devil', text: 'Dodging earns 10 gold.', triggers: [{ id: 'swash-lucky', trigger: 'onDodge', effects: [{ kind: 'gold', amount: 10 }] }] }],
      choice: [{ name: 'Dueling', mods: [flat('accuracy', 10), flat('critChance', 3)] }, { name: 'Brawler', mods: [pct('maxHp', 10)] }],
      capstone: { name: 'Legend of the Seas', mods: [flat('luk', 20), flat('critDamage', 20)] },
    },
  ],
  ranger: [
    {
      id: 'beastmaster', name: 'Beastmaster', color: '#a0805a', description: 'The pack is the weapon.', ultimate: 'stampede', skill: 'bestial-wrath',
      mods: [
        { name: 'Pack Hunt', patch: { description: 'Bestial Wrath also calls a wolf.', addEffects: [{ kind: 'summon', summonId: 'wolf-companion' }] } },
        { name: 'Feral Roar', patch: { description: 'Bestial Wrath may Fear every enemy.', addEffects: [{ kind: 'applyStatus', status: 'fear', duration: 1, chance: 30, target: 'allEnemies' }] } },
      ],
      minors: [{ name: 'Pack Bond', mods: [flat('damageBonus', 8, tag('Pet'))] }, { name: 'Thick Fur', mods: [flat('vit', 2)] }, { name: 'Wild Hide', mods: [flat('natureResist', 4)] }],
      notables: [{ name: 'Primal Fury', mods: [flat('damageBonus', 20, tag('Pet'))] }, { name: 'Wild Kinship', flags: ['extraSummon'] }],
      choice: [{ name: 'Alpha Bond', mods: [more('damageTaken', -10)] }, { name: 'Savage Pack', mods: [flat('critChance', 5)] }],
      capstone: { name: 'King of the Wild', text: 'A second wolf joins every battle.', triggers: [{ id: 'beastmaster-king', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'wolf-companion' }] }] },
    },
    {
      id: 'sharpshooter', name: 'Sharpshooter', color: '#c9a227', description: 'Patience, then one perfect shot.', ultimate: 'final-arrow', skill: 'deadly-aim',
      mods: [
        { name: 'Kill Shot', patch: { description: 'Deadly Aim always crits, +1 cooldown.', alwaysCrit: true, cooldownDelta: 1 } },
        { name: 'Penetrating Shot', patch: { description: 'Deadly Aim hits every enemy for 60% of its damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
      ],
      minors: [{ name: 'Lethal', mods: [flat('critDamage', 6)] }, { name: 'Steady', mods: [flat('accuracy', 3)] }, { name: 'Nimble', mods: [flat('dex', 2)] }],
      notables: [{ name: 'Bullseye', mods: [flat('critChance', 8, tag('Ranged'))], text: '+8% crit chance with Ranged skills.' }, { name: 'Patience', mods: [flat('damageBonus', 25, { kind: 'resourceAtLeast', resource: 'focus', amount: 4 })], text: '+25% damage with at least 4 Focus.' }],
      choice: [{ name: 'Long Range', flags: ['bonusVsBosses'] }, { name: 'Rapid Fire', mods: [flat('speed', 6)] }],
      capstone: { name: 'Perfect Shot', mods: [flat('critDamage', 30)], flags: ['critsIgnoreDefense'] },
    },
    {
      id: 'warden', name: 'Warden', color: '#3f8a4a', description: 'Guardian of the wild places.', ultimate: 'wrath-of-nature', skill: 'entangling-roots',
      mods: [
        { name: 'Thorned Roots', patch: { description: 'Entangling Roots cause Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3 }] } },
        { name: 'Binding Roots', patch: { description: 'Entangling Roots Stun far more often.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 40 }] } },
      ],
      minors: [{ name: 'Bark', mods: [pct('defense', 4)] }, { name: 'Sap', mods: [flat('hpRegen', 2)] }, { name: 'Wildwood', mods: [flat('natureDamage', 4)] }],
      notables: [{ name: 'Barkskin', mods: [more('damageTaken', -10)] }, { name: 'Guardian of the Grove', text: 'The first time you fall below 30% HP each battle, gain Regen and a shield worth 20% of max HP.', triggers: [{ id: 'warden-grove', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'applyStatus', status: 'regen', duration: 3, target: 'self' }, { kind: 'shield', percentMaxHp: 20, target: 'self' }] }] }],
      choice: [{ name: 'Thornguard', text: '30% chance to lash attackers for 50% ATK.', triggers: [{ id: 'warden-thornguard', trigger: 'onDamageTaken', chance: 30, effects: [{ kind: 'damage', element: 'nature', scaling: { stat: 'physicalAttack', ratio: 0.5 }, target: 'target' }] }] }, { name: 'Verdant', mods: [flat('healingReceived', 25)] }],
      capstone: { name: 'Heart of the Forest', mods: [pct('maxHp', 15), flat('hpRegen', 15)] },
    },
  ],
  monk: [
    {
      id: 'grandmaster', name: 'Grandmaster', color: '#e8772e', description: 'Perfection of the fist.', ultimate: 'fists-of-fury', skill: 'seven-sided-strike',
      mods: [
        { name: 'Focused Strikes', patch: { description: 'All strikes hit your chosen target for 10% more.', targeting: 'enemy', powerMult: 1.1 } },
        { name: 'Whirling Strikes', patch: { description: 'Two more strikes at 80% damage.', hitsAdd: 2, powerMult: 0.8 } },
      ],
      minors: [{ name: 'Conditioning', mods: [pct('physicalAttack', 3)] }, { name: 'Pressure Points', mods: [flat('critChance', 1)] }, { name: 'Power', mods: [flat('str', 2)] }],
      notables: [{ name: 'Perfect Form', mods: [flat('accuracy', 10), flat('critChance', 4)] }, { name: 'Iron Fists', mods: [flat('critDamage', 20)] }],
      choice: [{ name: 'Combo Breaker', text: 'Crits grant 1 Chi.', triggers: [{ id: 'grandmaster-combo', trigger: 'onCrit', effects: [{ kind: 'gainResource', resource: 'chi', amount: 1 }] }] }, { name: 'Steel Body', mods: [pct('defense', 15)] }],
      capstone: { name: 'True Grandmaster', mods: [flat('damageBonus', 20)], flags: ['firstStrike'] },
    },
    {
      id: 'mystic', name: 'Mystic', color: '#9fd8ff', description: 'Spirit made flesh: healing and inner light.', ultimate: 'nirvana', skill: 'spirit-palm',
      mods: [
        { name: 'Radiant Palm', patch: { description: 'Spirit Palm deals holy damage.', element: 'holy', addTags: ['Holy'] } },
        { name: 'Soothing Palm', patch: { description: 'Spirit Palm also grants Regen.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3, target: 'self' }] } },
      ],
      minors: [{ name: 'Clarity', mods: [flat('wis', 2)] }, { name: 'Spirit Force', mods: [flat('arcaneDamage', 4)] }, { name: 'Renewal', mods: [flat('healingReceived', 4)] }],
      notables: [{ name: 'Inner Light', mods: [flat('hpRegen', 10)] }, { name: 'Transcendent', mods: [flat('statusResist', 15)] }],
      choice: [{ name: 'Spirit Guardian', text: 'The first time you fall below 30% HP each battle, gain a shield worth 30% of max HP.', triggers: [{ id: 'mystic-guardian', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'shield', percentMaxHp: 30, target: 'self' }] }] }, { name: 'Third Eye', mods: [flat('critChance', 6)] }],
      capstone: { name: 'Enlightened One', mods: [pct('maxHp', 15), flat('damageBonus', 10), flat('resourceGain', 20)] },
    },
    {
      id: 'wind-dancer', name: 'Wind Dancer', color: '#c8e8f0', description: 'Untouchable as the wind.', ultimate: 'tempest-dance', skill: 'cyclone-kick',
      mods: [
        { name: 'Gale Kick', patch: { description: 'Cyclone Kick hits every enemy for 80% of its damage.', targeting: 'allEnemies', powerMult: 0.8 } },
        { name: 'Wind Wall', patch: { description: 'Cyclone Kick grants another +15% dodge.', addEffects: [{ kind: 'buff', id: 'wind-wall', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 15 }], target: 'self' }] } },
      ],
      minors: [{ name: 'Swift', mods: [flat('speed', 1)] }, { name: 'Weightless', mods: [flat('dodge', 1)] }, { name: 'Grace', mods: [flat('dex', 2)] }],
      notables: [{ name: 'Featherfall', mods: [flat('dodge', 8)] }, { name: 'Tailwind', mods: [more('speed', 10)] }],
      choice: [{ name: 'Gust', text: 'Dodging may strike back for 60% ATK.', triggers: [{ id: 'wind-gust', trigger: 'onDodge', chance: 50, effects: [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 0.6 }, target: 'target' }] }] }, { name: 'Zephyr', text: 'Begin every battle Hasted.', triggers: [{ id: 'wind-zephyr', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }] }] }],
      capstone: { name: 'Eye of the Hurricane', mods: [flat('dodge', 10)], flags: ['firstStrike'] },
    },
  ],
};

