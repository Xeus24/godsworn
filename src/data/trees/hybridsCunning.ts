import type { SkillDef } from '../../engine/skills/types';
import { flat, more, pct, tag, type BranchSpec } from './builder';

const hybrid = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'hybrid', maxRank: 5 });

/** Signature skills of the six hybrids built on cunning, song and shadow. */
export const CUNNING_HYBRID_SKILLS: SkillDef[] = [
  // Shadow Reaper (Rogue + Necromancer)
  hybrid({ id: 'reaping-strike', name: 'Reaping Strike', description: 'A scythe-like cut for 160% ATK shadow damage; heal 6% of max HP.', tags: ['Attack', 'Melee', 'Shadow'], element: 'shadow', targeting: 'enemy', cost: { mp: 6 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.6, perRank: 0.1 }, effects: [{ kind: 'heal', percentMaxHp: 6, target: 'self' }], generates: { resource: 'combo', amount: 1 } }),
  hybrid({ id: 'mark-of-death', name: 'Mark of Death', description: 'Mark an enemy: 40% ATK shadow damage, Vulnerable for 2 turns and Cursed for 3.', tags: ['Debuff', 'Curse', 'Shadow'], element: 'shadow', targeting: 'enemy', cost: { mp: 10 }, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 0.4, perRank: 0.05 }, effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }, { kind: 'applyStatus', status: 'curse', duration: 3 }] }),
  // Spellthief (Rogue + Mage)
  hybrid({ id: 'siphon-strike', name: 'Siphon Strike', description: 'A quick cut for 140% ATK arcane damage that steals 8 MP.', tags: ['Attack', 'Melee', 'Arcane'], element: 'arcane', targeting: 'enemy', cost: {}, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.4, perRank: 0.1 }, effects: [{ kind: 'restoreMp', amount: 8, target: 'self' }], generates: { resource: 'combo', amount: 1 } }),
  hybrid({ id: 'mirror-image', name: 'Mirror Image', description: 'Vanish behind illusions: Stealth and +25 dodge for 2 turns.', tags: ['Buff', 'Arcane'], element: 'arcane', targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1 }, { kind: 'buff', id: 'mirror-image', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 25 }] }] }),
  // Blade Dancer (Rogue + Bard)
  hybrid({ id: 'dancing-blades', name: 'Dancing Blades', description: 'Four flashing cuts at random enemies, 55% ATK each.', tags: ['Attack', 'Melee', 'Physical', 'AoE'], element: 'physical', targeting: 'randomEnemies', cost: { mp: 6 }, cooldown: 2, damage: { stat: 'physicalAttack', multiplier: 0.55, perRank: 0.05, hits: 4 }, generates: { resource: 'combo', amount: 1 } }),
  hybrid({ id: 'tempo', name: 'Tempo', description: 'Quicken the music: the party is Hasted for 2 turns.', tags: ['Buff', 'Song', 'AoE'], element: 'physical', targeting: 'allAllies', cost: { mp: 12 }, cooldown: 5, effects: [{ kind: 'applyStatus', status: 'haste', duration: 2 }] }),
  // Wildsinger (Ranger + Bard)
  hybrid({ id: 'song-of-the-wild', name: 'Song of the Wild', description: 'The party gains +15% damage and Regenerates for 2 turns.', tags: ['Buff', 'Song', 'Nature', 'AoE'], element: 'nature', targeting: 'allAllies', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'buff', id: 'song-of-the-wild', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }] }, { kind: 'applyStatus', status: 'regen', duration: 2 }] }),
  hybrid({ id: 'thorn-volley', name: 'Thorn Volley', description: 'Four thorned arrows at random enemies, 55% ATK nature damage each (30% Poison).', tags: ['Attack', 'Ranged', 'Projectile', 'Nature'], element: 'nature', targeting: 'randomEnemies', cost: { mp: 8 }, cooldown: 2, damage: { stat: 'physicalAttack', multiplier: 0.55, perRank: 0.05, hits: 4 }, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, chance: 30 }] }),
  // Arcane Archer (Ranger + Mage)
  hybrid({ id: 'arcane-shot', name: 'Arcane Shot', description: 'A rune-tipped arrow for 170% ATK arcane damage; gain 1 Focus.', tags: ['Attack', 'Ranged', 'Projectile', 'Arcane'], element: 'arcane', targeting: 'enemy', cost: { mp: 6 }, cooldown: 1, damage: { stat: 'physicalAttack', multiplier: 1.7, perRank: 0.12 }, generates: { resource: 'focus', amount: 1 } }),
  hybrid({ id: 'arrow-nova', name: 'Arrow Nova', description: 'Arrows burst into arcane light: 90% ATK to every enemy.', tags: ['Attack', 'Ranged', 'Arcane', 'AoE'], element: 'arcane', targeting: 'allEnemies', cost: { mp: 14 }, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 0.9, perRank: 0.07 } }),
  // Plague Doctor (Cleric + Necromancer)
  hybrid({ id: 'plague-flask', name: 'Plague Flask', description: 'Hurl a flask: 60% MATK nature damage to every enemy and 2 stacks of Poison.', tags: ['Spell', 'Nature', 'Poison', 'AoE', 'DoT'], element: 'nature', targeting: 'allEnemies', cost: { mp: 12 }, cooldown: 3, damage: { stat: 'magicAttack', multiplier: 0.6, perRank: 0.05 }, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }] }),
  hybrid({ id: 'leech-cure', name: 'Leech Cure', description: 'Heal an ally for 120% MATK and draw out Poison.', tags: ['Spell', 'Heal', 'Nature'], element: 'nature', targeting: 'ally', cost: { mp: 10 }, cooldown: 2, heal: { stat: 'magicAttack', multiplier: 1.2, perRank: 0.1 }, effects: [{ kind: 'removeStatus', status: 'poison' }] }),
];

export const CUNNING_HYBRID_BRANCHES: Record<string, BranchSpec> = {
  'shadow-reaper': {
    id: 'shadow-reaper', name: 'Shadow Reaper', color: '#5a3a7a', description: 'An assassin who reaps souls for the grave.',
    a: { skill: 'reaping-strike' },
    aMods: [
      { name: 'Soul Harvest', patch: { description: 'Reaping Strike restores 10 MP.', addEffects: [{ kind: 'restoreMp', amount: 10, target: 'self' }] } },
      { name: 'Grim Sweep', patch: { description: 'Hits every enemy for 60% of the damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
    ],
    b: { skill: 'mark-of-death' },
    bMods: [
      { name: 'Lingering Doom', patch: { description: 'Mark of Death also Poisons (2 stacks).', addEffects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }] } },
      { name: 'Swift Doom', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } },
    ],
    minors: [{ name: 'Grave Edge', mods: [flat('shadowDamage', 4)] }, { name: 'Deathly Quick', mods: [flat('speed', 1)] }, { name: 'Cruel', mods: [flat('critDamage', 5)] }, { name: 'Soul Leech', mods: [flat('lifesteal', 1)] }],
    notables: [
      { name: 'Shroud of Night', flags: ['stealthOnCombatStart'] },
      { name: 'Harvest', text: 'Kills heal 8% of max HP and restore 10 MP.', triggers: [{ id: 'reaper-harvest', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }, { kind: 'restoreMp', amount: 10, target: 'self' }] }] },
    ],
    choice: [{ name: 'Reaper’s Toll', flags: ['executioner'] }, { name: 'Creeping Death', flags: ['dotsCanCrit'] }],
    keystone: { name: 'Dance with Death', text: 'Keystone: +35% damage below 50% HP, -20% max HP.', mods: [flat('damageBonus', 35, { kind: 'hpBelow', pct: 50 }), pct('maxHp', -20)] },
    capstone: { name: 'Harbinger', text: 'Your first two kills each battle raise a skeleton warrior.', triggers: [{ id: 'reaper-harbinger', trigger: 'onKill', limitPerCombat: 2, effects: [{ kind: 'summon', summonId: 'skeleton-warrior' }] }] },
  },
  spellthief: {
    id: 'spellthief', name: 'Spellthief', color: '#b070ff', description: 'Steals mana, gold and the occasional spell.',
    a: { skill: 'siphon-strike' },
    aMods: [
      { name: 'Arcane Larceny', patch: { description: 'Siphon Strike also steals 5 gold.', addEffects: [{ kind: 'gold', amount: 5 }] } },
      { name: 'Mana Burn', patch: { description: 'Siphon Strike may Silence (30%).', addEffects: [{ kind: 'applyStatus', status: 'silence', duration: 1, chance: 30 }] } },
    ],
    b: { skill: 'mirror-image' },
    bMods: [
      { name: 'Phantasm', patch: { description: 'Also +15 crit chance for 2 turns.', addEffects: [{ kind: 'buff', id: 'phantasm', duration: 2, modifiers: [{ stat: 'critChance', type: 'flat', value: 15 }] }] } },
      { name: 'Blink', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } },
    ],
    minors: [{ name: 'Quick Fingers', mods: [flat('speed', 1)] }, { name: 'Arcane Daggers', mods: [flat('arcaneDamage', 4)] }, { name: 'Sleight', mods: [flat('dodge', 1)] }, { name: 'Mana Thief', mods: [flat('mpRegen', 1)] }],
    notables: [
      { name: 'Spell Steal', text: 'Critical hits have a 40% chance to restore 10 MP.', triggers: [{ id: 'spellthief-steal', trigger: 'onCrit', chance: 40, effects: [{ kind: 'restoreMp', amount: 10, target: 'self' }] }] },
      { name: 'Vanishing Act', flags: ['stealthOnCombatStart'] },
    ],
    choice: [{ name: 'Arcane Assassin', mods: [flat('critDamage', 20)] }, { name: 'Trickery', mods: [flat('statusChance', 10)] }],
    keystone: { name: 'Mana Addict', text: 'Keystone: +30% damage, 20% less max HP.', mods: [flat('damageBonus', 30), more('maxHp', -20)] },
    capstone: { name: 'Grand Larceny', text: 'Kills steal 10 gold and reduce your cooldowns by 1.', triggers: [{ id: 'spellthief-larceny', trigger: 'onKill', effects: [{ kind: 'gold', amount: 10 }, { kind: 'reduceCooldowns', turns: 1 }] }] },
  },
  'blade-dancer': {
    id: 'blade-dancer', name: 'Blade Dancer', color: '#ff7a9a', description: 'Every fight is a performance, and every step a cut.',
    a: { skill: 'dancing-blades' },
    aMods: [
      { name: 'Whirling Steel', patch: { description: 'Two more cuts, +40% MP cost.', hitsAdd: 2, costMult: 1.4 } },
      { name: 'Crimson Dance', patch: { description: 'Dancing Blades causes Bleed.', addEffects: [{ kind: 'applyStatus', status: 'bleed', duration: 3 }] } },
    ],
    b: { skill: 'tempo' },
    bMods: [
      { name: 'Allegro', patch: { description: 'Also +10 crit chance for 2 turns.', addEffects: [{ kind: 'buff', id: 'allegro', duration: 2, modifiers: [{ stat: 'critChance', type: 'flat', value: 10 }] }] } },
      { name: 'Encore', patch: { description: '1 turn shorter cooldown.', cooldownDelta: -1 } },
    ],
    minors: [{ name: 'Light Feet', mods: [flat('dodge', 1)] }, { name: 'Flourish', mods: [flat('critChance', 1)] }, { name: 'Rhythm', mods: [flat('speed', 1)] }, { name: 'Graceful', mods: [flat('dex', 1)] }],
    notables: [
      { name: 'Riposte', text: 'Dodging an attack Hastes you for 1 turn.', triggers: [{ id: 'dancer-riposte', trigger: 'onDodge', cooldown: 2, effects: [{ kind: 'applyStatus', status: 'haste', duration: 1, target: 'self' }] }] },
      { name: 'Showstopper', text: 'Area skills deal 15% more damage.', mods: [flat('damageBonus', 15, tag('AoE'))] },
    ],
    choice: [{ name: 'Duelist', mods: [flat('critDamage', 15)] }, { name: 'Performer', mods: [flat('statusChance', 10)] }],
    keystone: { name: 'Reckless Grace', text: 'Keystone: +15 dodge, -25% max HP.', mods: [flat('dodge', 15), pct('maxHp', -25)] },
    capstone: { name: 'Endless Dance', text: 'Kills reduce your cooldowns by 1 and Haste you.', triggers: [{ id: 'dancer-endless', trigger: 'onKill', effects: [{ kind: 'reduceCooldowns', turns: 1 }, { kind: 'applyStatus', status: 'haste', duration: 1, target: 'self' }] }] },
  },
  wildsinger: {
    id: 'wildsinger', name: 'Wildsinger', color: '#5ac878', description: 'Sings the forest awake and the pack to the hunt.',
    a: { skill: 'song-of-the-wild' },
    aMods: [
      { name: 'Hunter’s Chorus', patch: { description: 'Also +10 crit chance.', addEffects: [{ kind: 'buff', id: 'hunters-chorus', duration: 2, modifiers: [{ stat: 'critChance', type: 'flat', value: 10 }] }] } },
      { name: 'Verdant Verse', patch: { description: 'Also shields the party for 8% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 8 }] } },
    ],
    b: { skill: 'thorn-volley' },
    bMods: [
      { name: 'Briar Storm', patch: { description: 'Two more arrows, +40% MP cost.', hitsAdd: 2, costMult: 1.4 } },
      { name: 'Venom Thorns', patch: { description: 'Always Poisons (2 stacks).', addEffects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }] } },
    ],
    minors: [{ name: 'Wild Rhythm', mods: [flat('speed', 1)] }, { name: 'Nature’s Voice', mods: [flat('natureDamage', 4)] }, { name: 'Keen Ear', mods: [flat('accuracy', 2)] }, { name: 'Sturdy Roots', mods: [pct('maxHp', 2)] }],
    notables: [
      { name: 'Call of the Pack', text: 'A spirit stag joins you at the start of every battle.', triggers: [{ id: 'wildsinger-pack', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'spirit-stag' }] }] },
      { name: 'Harmony of Thorns', text: 'Nature skills deal 15% more damage.', mods: [flat('damageBonus', 15, tag('Nature'))] },
    ],
    choice: [{ name: 'Wild Hunt', mods: [flat('critChance', 6)] }, { name: 'Grove Song', mods: [flat('hpRegen', 6)] }],
    keystone: { name: 'Feral Anthem', text: 'Keystone: +30% damage, but take 15% more damage.', mods: [flat('damageBonus', 30), more('damageTaken', 15)] },
    capstone: { name: 'Voice of the Wild', text: 'Each turn, 25% chance for the party to Regenerate.', triggers: [{ id: 'wildsinger-voice', trigger: 'onTurnStart', chance: 25, effects: [{ kind: 'applyStatus', status: 'regen', duration: 2, target: 'allAllies' }] }] },
  },
  'arcane-archer': {
    id: 'arcane-archer', name: 'Arcane Archer', color: '#6ab0ff', description: 'Every arrow a spell, every spell an arrow.',
    a: { skill: 'arcane-shot' },
    aMods: [
      { name: 'Seeking Shot', patch: { description: '+20% damage.', powerMult: 1.2 } },
      { name: 'Elemental Shot', patch: { description: 'Arcane Shot deals fire damage and Burns.', element: 'fire', addTags: ['Fire'], addEffects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] } },
    ],
    b: { skill: 'arrow-nova' },
    bMods: [
      { name: 'Frost Nova', patch: { description: 'Arrow Nova deals ice damage and Slows.', element: 'ice', addTags: ['Ice'], addEffects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] } },
      { name: 'Storm Nova', patch: { description: 'Arrow Nova deals lightning damage and may Stun (15%).', element: 'lightning', addTags: ['Lightning'], addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 15 }] } },
    ],
    minors: [{ name: 'Runed Arrows', mods: [flat('arcaneDamage', 4)] }, { name: 'Eagle Sight', mods: [flat('accuracy', 2)] }, { name: 'Mana Draw', mods: [flat('mpRegen', 1)] }, { name: 'Precision', mods: [flat('critChance', 1)] }],
    notables: [
      { name: 'Spell Arrows', text: 'Projectile skills deal 15% more damage.', mods: [flat('damageBonus', 15, tag('Projectile'))] },
      { name: 'Arcane Barrage', text: 'Critical hits have a 30% chance to fire free Arcane Missiles.', triggers: [{ id: 'archer-barrage', trigger: 'onCrit', chance: 30, cooldown: 1, effects: [{ kind: 'castSkill', skillId: 'arcane-missiles', target: 'target' }] }] },
    ],
    choice: [{ name: 'Sniper Mage', mods: [flat('critDamage', 20)] }, { name: 'Battle Caster', mods: [flat('speed', 4)] }],
    keystone: { name: 'Glass Quiver', text: 'Keystone: +30% damage, -25% defense.', mods: [flat('damageBonus', 30), pct('defense', -25)] },
    capstone: { name: 'Starfall', text: 'Open every battle with a free Arrow Nova.', triggers: [{ id: 'archer-starfall', trigger: 'onCombatStart', effects: [{ kind: 'castSkill', skillId: 'arrow-nova' }] }] },
  },
  'plague-doctor': {
    id: 'plague-doctor', name: 'Plague Doctor', color: '#8ab050', description: 'Cures and curses from the same bag.',
    a: { skill: 'plague-flask' },
    aMods: [
      { name: 'Virulent Brew', patch: { description: '+25% damage, +30% MP cost.', powerMult: 1.25, costMult: 1.3 } },
      { name: 'Blinding Fumes', patch: { description: 'Plague Flask may Blind (40%).', addEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2, chance: 40 }] } },
    ],
    b: { skill: 'leech-cure' },
    bMods: [
      { name: 'Bloodletting', patch: { description: 'Leech Cure also Regenerates.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }] } },
      { name: 'Panacea', patch: { description: 'Leech Cure also removes Curse.', addEffects: [{ kind: 'removeStatus', status: 'curse' }] } },
    ],
    minors: [{ name: 'Toxicology', mods: [flat('natureDamage', 4)] }, { name: 'Bedside Manner', mods: [flat('healingPower', 3)] }, { name: 'Beaked Mask', mods: [flat('statusResist', 3)] }, { name: 'Miasma', mods: [flat('statusChance', 1)] }],
    notables: [
      { name: 'Epidemic', flags: ['dotsCanCrit'] },
      { name: 'Contagion', text: 'Kills Poison every enemy (2 stacks).', triggers: [{ id: 'doctor-contagion', trigger: 'onKill', effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2, target: 'allEnemies' }] }] },
    ],
    choice: [{ name: 'Field Medic', mods: [flat('healingPower', 15)] }, { name: 'Pestilence', mods: [flat('natureDamage', 15)] }],
    keystone: { name: 'Hippocratic Breach', text: 'Keystone: +20 status chance, -30 healing power.', mods: [flat('statusChance', 20), flat('healingPower', -30)] },
    capstone: { name: 'Great Plague', text: 'Every battle opens with 3 stacks of Poison on every enemy.', triggers: [{ id: 'doctor-great-plague', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'poison', duration: 4, stacks: 3, target: 'allEnemies' }] }] },
  },
};
