import type { SkillDef } from '../../engine/skills/types';
import { flat, more, pct, tag, targetHas, targetHasAny, type SpecBranchSpec } from './builder';

const ult = (s: Omit<SkillDef, 'source' | 'maxRank' | 'cost' | 'cooldown' | 'ultimate'>): SkillDef => ({ ...s, source: 'ultimate', maxRank: 1, cost: {}, cooldown: 0, ultimate: true });
const spec = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ ...s, source: 'specialization', maxRank: 5 });

export const ARCANE_SPEC_SKILLS: SkillDef[] = [
  // Mage
  spec({ id: 'meteor', name: 'Meteor', description: 'Call down a meteor for 260% MAG fire damage. Heavy stagger.', tags: ['Spell', 'Fire'], element: 'fire', targeting: 'enemy', cost: { mp: 22 }, cooldown: 3, stagger: 2, damage: { stat: 'magicAttack', multiplier: 2.6, perRank: 0.18 } }),
  ult({ id: 'sunfall', name: 'Sunfall', description: 'Drop a piece of the sun: 320% MAG fire to every enemy with 3 stacks of Burn.', tags: ['Spell', 'Fire', 'AoE'], element: 'fire', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 3.2, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3, stacks: 3 }] }),
  spec({ id: 'time-warp', name: 'Time Warp', description: 'Bend time: gain Haste and reduce all your cooldowns by 1.', tags: ['Spell', 'Arcane', 'Buff'], element: 'arcane', targeting: 'self', cost: { mp: 10 }, cooldown: 5, effects: [{ kind: 'applyStatus', status: 'haste', duration: 3 }, { kind: 'reduceCooldowns', turns: 1 }] }),
  ult({ id: 'time-stop', name: 'Time Stop', description: 'Freeze time: Stun every enemy, Haste the party and reduce your cooldowns by 3.', tags: ['Spell', 'Arcane', 'AoE', 'Debuff'], element: 'arcane', targeting: 'allEnemies', effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }, { kind: 'applyStatus', status: 'haste', duration: 3, target: 'allAllies' }, { kind: 'reduceCooldowns', turns: 3 }] }),
  spec({ id: 'storm-surge', name: 'Storm Surge', description: 'A surge of storm water and lightning: 100% MAG lightning to every enemy, may soak them (Wet).', tags: ['Spell', 'Lightning', 'AoE'], element: 'lightning', targeting: 'allEnemies', cost: { mp: 16 }, cooldown: 2, damage: { stat: 'magicAttack', multiplier: 1, perRank: 0.08 }, effects: [{ kind: 'applyStatus', status: 'wet', duration: 2, chance: 50 }] }),
  ult({ id: 'maelstrom', name: 'Maelstrom', description: 'A raging maelstrom: every enemy is soaked, then eight bolts of 70% MAG lightning strike at random.', tags: ['Spell', 'Lightning', 'AoE'], element: 'lightning', targeting: 'randomEnemies', damage: { stat: 'magicAttack', multiplier: 0.7, perRank: 0, hits: 8 }, effects: [{ kind: 'applyStatus', status: 'wet', duration: 3, target: 'allEnemies' }] }),
  // Cleric
  spec({ id: 'condemn', name: 'Condemn', description: 'Pronounce judgement: 220% DIV holy damage and Vulnerable.', tags: ['Spell', 'Holy', 'Divine'], element: 'holy', targeting: 'enemy', cost: { mp: 12 }, cooldown: 2, damage: { stat: 'divinePower', multiplier: 2.2, perRank: 0.15 }, effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] }),
  ult({ id: 'final-judgement', name: 'Final Judgement', description: 'The gods’ verdict: 300% DIV holy damage to every enemy.', tags: ['Spell', 'Holy', 'Divine', 'AoE'], element: 'holy', targeting: 'allEnemies', damage: { stat: 'divinePower', multiplier: 3, perRank: 0 } }),
  spec({ id: 'foresight', name: 'Foresight', description: 'See what comes: the party gains +15% dodge and +10% crit chance for 3 turns.', tags: ['Spell', 'Divine', 'Buff', 'AoE'], element: 'holy', targeting: 'allAllies', cost: { mp: 12 }, cooldown: 5, effects: [{ kind: 'buff', id: 'foresight', duration: 3, modifiers: [{ stat: 'dodge', type: 'flat', value: 15 }, { stat: 'critChance', type: 'flat', value: 10 }] }] }),
  ult({ id: 'divine-prophecy', name: 'Divine Prophecy', description: 'Fate bends: heal the party for 50% of max HP, then grant Divine Protection and Haste.', tags: ['Spell', 'Heal', 'Divine', 'AoE'], element: 'holy', targeting: 'allAllies', effects: [{ kind: 'heal', percentMaxHp: 50 }, { kind: 'applyStatus', status: 'divine-protection', duration: 2 }, { kind: 'applyStatus', status: 'haste', duration: 2 }] }),
  spec({ id: 'sacred-renewal', name: 'Sacred Renewal', description: 'A great heal for 250% DIV that cleanses Poison, Burn and Bleed.', tags: ['Spell', 'Heal', 'Holy', 'Divine'], element: 'holy', targeting: 'ally', cost: { mp: 14 }, cooldown: 2, heal: { stat: 'divinePower', multiplier: 2.5, perRank: 0.18 }, effects: [{ kind: 'removeStatus', status: 'poison' }, { kind: 'removeStatus', status: 'burn' }, { kind: 'removeStatus', status: 'bleed' }] }),
  ult({ id: 'resurrection', name: 'Resurrection', description: 'Life without limit: fully heal the party and grant Regen and Divine Protection.', tags: ['Spell', 'Heal', 'Holy', 'Divine', 'AoE'], element: 'holy', targeting: 'allAllies', effects: [{ kind: 'heal', percentMaxHp: 100 }, { kind: 'applyStatus', status: 'regen', duration: 3 }, { kind: 'applyStatus', status: 'divine-protection', duration: 2 }] }),
  // Necromancer
  spec({ id: 'soul-frost', name: 'Soul Frost', description: 'Grave-cold for 170% MAG ice damage that Slows. Harvests a Soul Shard.', tags: ['Spell', 'Ice', 'Shadow'], element: 'ice', targeting: 'enemy', cost: { mp: 9 }, cooldown: 1, damage: { stat: 'magicAttack', multiplier: 1.7, perRank: 0.12 }, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }], generates: { resource: 'soulShards', amount: 1 } }),
  ult({ id: 'eternal-winter', name: 'Eternal Winter', description: 'The cold of the grave: 260% MAG ice to every enemy, with a 50% chance to Freeze.', tags: ['Spell', 'Ice', 'AoE'], element: 'ice', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 2.6, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, chance: 50 }] }),
  spec({ id: 'raise-bone-golem', name: 'Raise Bone Golem', description: 'Spend 2 Soul Shards to raise a hulking Bone Golem.', tags: ['Spell', 'Summon', 'Shadow'], element: 'shadow', targeting: 'self', cost: { mp: 12, resource: { id: 'soulShards', amount: 2 } }, cooldown: 6, effects: [{ kind: 'summon', summonId: 'bone-golem' }] }),
  ult({ id: 'bone-apocalypse', name: 'Bone Apocalypse', description: 'A storm of bone: 240% MAG physical to every enemy, and a Bone Golem rises.', tags: ['Spell', 'Physical', 'Summon', 'AoE'], element: 'physical', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 2.4, perRank: 0 }, effects: [{ kind: 'summon', summonId: 'bone-golem' }] }),
  spec({ id: 'plague-bomb', name: 'Plague Bomb', description: 'Burst a sack of plague over every enemy: 60% MAG nature, 3 stacks of Poison and a Curse.', tags: ['Spell', 'Nature', 'Poison', 'AoE', 'Curse'], element: 'nature', targeting: 'allEnemies', cost: { mp: 18 }, cooldown: 3, damage: { stat: 'magicAttack', multiplier: 0.6, perRank: 0.05 }, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 3 }, { kind: 'applyStatus', status: 'curse', duration: 3 }] }),
  ult({ id: 'black-death', name: 'Black Death', description: 'The great plague: 200% MAG nature to every enemy, 5 stacks of Poison and a Curse.', tags: ['Spell', 'Nature', 'Poison', 'AoE'], element: 'nature', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 2, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 5 }, { kind: 'applyStatus', status: 'curse', duration: 3 }] }),
  // Bard
  spec({ id: 'masterpiece', name: 'Masterpiece', description: 'A virtuoso solo for 240% MAG arcane damage. Builds 30 Verse.', tags: ['Spell', 'Song', 'Arcane'], element: 'arcane', targeting: 'enemy', cost: { mp: 14 }, cooldown: 3, damage: { stat: 'magicAttack', multiplier: 2.4, perRank: 0.16 }, generates: { resource: 'verse', amount: 30 } }),
  ult({ id: 'symphony-of-destruction', name: 'Symphony of Destruction', description: 'The final movement: 300% MAG arcane damage to every enemy.', tags: ['Spell', 'Song', 'Arcane', 'AoE'], element: 'arcane', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 3, perRank: 0 } }),
  spec({ id: 'war-chant', name: 'War Chant', description: 'A pounding chant: the party gains +20% damage and +10% crit chance for 3 turns. Builds 20 Verse.', tags: ['Song', 'Buff', 'Shout', 'AoE'], element: 'physical', targeting: 'allAllies', cost: { mp: 12 }, cooldown: 4, effects: [{ kind: 'buff', id: 'war-chant', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'critChance', type: 'flat', value: 10 }] }], generates: { resource: 'verse', amount: 20 } }),
  ult({ id: 'ragnarok-chorus', name: 'Ragnarok Chorus', description: 'A chorus to end the world: 250% MAG physical to every enemy, and the whole party goes Berserk.', tags: ['Song', 'Physical', 'AoE', 'Shout'], element: 'physical', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 2.5, perRank: 0 }, effects: [{ kind: 'applyStatus', status: 'berserk', duration: 3, target: 'allAllies' }] }),
  spec({ id: 'misdirect', name: 'Misdirect', description: 'A sleight of hand that may Charm the target (60%) and Blinds it.', tags: ['Spell', 'Arcane', 'Debuff'], element: 'arcane', targeting: 'enemy', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'applyStatus', status: 'charm', duration: 1, chance: 60 }, { kind: 'applyStatus', status: 'blind', duration: 2 }] }),
  ult({ id: 'grand-illusion', name: 'Grand Illusion', description: 'Nothing is real: every enemy may be Charmed (70%), and the party vanishes into Stealth.', tags: ['Spell', 'Arcane', 'AoE', 'Debuff'], element: 'arcane', targeting: 'allEnemies', effects: [{ kind: 'applyStatus', status: 'charm', duration: 1, chance: 70 }, { kind: 'applyStatus', status: 'stealth', duration: 1, target: 'allAllies' }] }),
];

export const ARCANE_SPEC_BRANCHES: Record<string, SpecBranchSpec[]> = {
  mage: [
    {
      id: 'pyromancer', name: 'Pyromancer', color: '#ff6a2a', description: 'Fire, and nothing but fire.', ultimate: 'sunfall', skill: 'meteor',
      mods: [
        { name: 'Meteor Shower', patch: { description: 'Three smaller meteors at random enemies for 45% each.', targeting: 'randomEnemies', hitsAdd: 2, powerMult: 0.45 } },
        { name: 'Impact', patch: { description: 'Meteor may Stun.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 50 }] } },
      ],
      minors: [{ name: 'Fire Lore', mods: [flat('fireDamage', 5)] }, { name: 'Searing', mods: [flat('critDamage', 6)] }, { name: 'Firepower', mods: [pct('magicAttack', 3)] }],
      notables: [{ name: 'Fire Within', text: '25% chance on hit to Burn.', triggers: [{ id: 'pyro-fire-within', trigger: 'onHit', chance: 25, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] }] }, { name: 'Hellfire', mods: [flat('fireDamage', 15)] }],
      choice: [{ name: 'Ignite', flags: ['dotsCanCrit'] }, { name: 'Living Bomb', flags: ['burnSpreadsOnDeath'] }],
      capstone: { name: 'Lord of Flame', text: 'Fire crits explode on every enemy for 30% MAG.', mods: [flat('fireDamage', 25)], triggers: [{ id: 'pyro-lord', trigger: 'onCrit', condition: { kind: 'element', element: 'fire' }, effects: [{ kind: 'damage', element: 'fire', scaling: { stat: 'magicAttack', ratio: 0.3 }, target: 'allEnemies' }] }] },
    },
    {
      id: 'chronomancer', name: 'Chronomancer', color: '#5fd1e4', description: 'Master of time: act more, wait less.', ultimate: 'time-stop', skill: 'time-warp',
      mods: [
        { name: 'Accelerate', patch: { description: 'Time Warp also restores 20 MP.', addEffects: [{ kind: 'restoreMp', amount: 20 }] } },
        { name: 'Slow Time', patch: { description: 'Time Warp Slows every enemy.', addEffects: [{ kind: 'applyStatus', status: 'slow', duration: 2, target: 'allEnemies' }] } },
      ],
      minors: [{ name: 'Quickening', mods: [flat('speed', 1)] }, { name: 'Haste Magic', mods: [flat('cooldownReduction', 1)] }, { name: 'Timeless Mind', mods: [pct('maxMp', 4)] }],
      notables: [{ name: 'Temporal Flux', mods: [flat('cooldownReduction', 8)] }, { name: 'Borrowed Moments', text: 'Begin every battle Hasted.', triggers: [{ id: 'chrono-borrowed', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }] }] }],
      choice: [{ name: 'Rewind', flags: ['reviveOnce'] }, { name: 'Accelerated', mods: [more('speed', 12)] }],
      capstone: { name: 'Master of Time', text: 'Skills have a 20% chance to reduce your cooldowns by 1.', triggers: [{ id: 'chrono-master', trigger: 'onSkillCast', chance: 20, effects: [{ kind: 'reduceCooldowns', turns: 1 }] }] },
    },
    {
      id: 'stormcaller', name: 'Stormcaller', color: '#3fa7d6', description: 'Ride the storm: soak, then strike.', ultimate: 'maelstrom', skill: 'storm-surge',
      mods: [
        { name: 'Tidal Surge', patch: { description: 'Storm Surge always soaks (Wet).', replaceEffects: [{ kind: 'applyStatus', status: 'wet', duration: 2 }] } },
        { name: 'Static Surge', patch: { description: 'Storm Surge may Stun.', addEffects: [{ kind: 'applyStatus', status: 'stun', duration: 1, chance: 20 }] } },
      ],
      minors: [{ name: 'Charged', mods: [flat('lightningDamage', 5)] }, { name: 'Gale', mods: [flat('speed', 1)] }, { name: 'Flash', mods: [flat('critChance', 1)] }],
      notables: [{ name: 'Overload', mods: [flat('damageBonus', 25, targetHas('wet'))], text: '+25% damage against Wet enemies.' }, { name: 'Storm Shield', text: '25% chance to shock attackers for 40% MAG.', triggers: [{ id: 'storm-shield', trigger: 'onDamageTaken', chance: 25, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'magicAttack', ratio: 0.4 }, target: 'target' }] }] }],
      choice: [{ name: 'Lightning Reflexes', mods: [flat('dodge', 6)] }, { name: 'Thunderlord', mods: [flat('lightningDamage', 20)] }],
      capstone: { name: 'Avatar of Storms', mods: [flat('lightningDamage', 20)], flags: ['immune:stun'] },
    },
  ],
  cleric: [
    {
      id: 'inquisitor', name: 'Inquisitor', color: '#ffb84a', description: 'Hunter of heretics. The light that burns.', ultimate: 'final-judgement', skill: 'condemn',
      mods: [
        { name: 'Purge', patch: { description: 'Condemn may Silence.', addEffects: [{ kind: 'applyStatus', status: 'silence', duration: 1, chance: 50 }] } },
        { name: 'Zealous Condemnation', patch: { description: 'Condemn deals 30% more damage.', powerMult: 1.3 } },
      ],
      minors: [{ name: 'Brand', mods: [flat('holyDamage', 5)] }, { name: 'Conviction', mods: [pct('divinePower', 3)] }, { name: 'Scrutiny', mods: [flat('critChance', 1)] }],
      notables: [{ name: 'Heretic Hunter', mods: [flat('damageBonus', 25, { kind: 'targetType', enemyType: 'humanoid' })], text: '+25% damage against humanoids.' }, { name: 'Unyielding Faith', flags: ['immune:fear'] }],
      choice: [{ name: 'Scourge', text: '20% chance on hit to Burn.', triggers: [{ id: 'inquisitor-scourge', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] }] }, { name: 'Interrogation', mods: [flat('statusChance', 15)] }],
      capstone: { name: 'Grand Inquisitor', mods: [flat('holyDamage', 25)], flags: ['bonusVsBosses'] },
    },
    {
      id: 'oracle', name: 'Oracle', color: '#c8b8ff', description: 'She sees the blow before it falls.', ultimate: 'divine-prophecy', skill: 'foresight',
      mods: [
        { name: 'Prophecy', patch: { description: 'Foresight also grants Regen.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }] } },
        { name: 'Clairvoyance', patch: { description: 'Foresight restores 20 MP.', addEffects: [{ kind: 'restoreMp', amount: 20, target: 'self' }] } },
      ],
      minors: [{ name: 'Insight', mods: [flat('wis', 2)] }, { name: 'Gentle Hands', mods: [flat('healingPower', 4)] }, { name: 'Calm', mods: [flat('mpRegen', 1)] }],
      notables: [{ name: 'Premonition', flags: ['reviveOnce'] }, { name: 'Omen', text: 'The party starts every battle with +10% dodge for 3 turns.', triggers: [{ id: 'oracle-omen', trigger: 'onCombatStart', effects: [{ kind: 'buff', id: 'omen', duration: 3, modifiers: [{ stat: 'dodge', type: 'flat', value: 10 }], target: 'allAllies' }] }] }],
      choice: [{ name: 'Fate Weaver', mods: [flat('luk', 10)] }, { name: 'Seer', mods: [flat('cooldownReduction', 6)] }],
      capstone: { name: 'Voice of the Gods', mods: [flat('healingPower', 30), flat('blessingPower', 30)] },
    },
    {
      id: 'saint', name: 'Saint', color: '#fff0c0', description: 'Mercy made flesh. No one dies on her watch.', ultimate: 'resurrection', skill: 'sacred-renewal',
      mods: [
        { name: 'Radiant Renewal', patch: { description: 'Sacred Renewal heals every ally for 50% of its power.', targeting: 'allAllies', powerMult: 0.5, addTags: ['AoE'] } },
        { name: 'Blessed Renewal', patch: { description: 'Sacred Renewal also shields for 15% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 15 }] } },
      ],
      minors: [{ name: 'Compassion', mods: [flat('healingPower', 5)] }, { name: 'Vitality', mods: [pct('maxHp', 3)] }, { name: 'Faith', mods: [flat('fai', 2)] }],
      notables: [{ name: 'Halo', mods: [flat('healingReceived', 20)] }, { name: 'Beacon', text: 'Healing others also heals you for 4% of max HP.', triggers: [{ id: 'saint-beacon', trigger: 'onHeal', effects: [{ kind: 'heal', percentMaxHp: 4, target: 'self' }] }] }],
      choice: [{ name: 'Selfless', mods: [flat('healingPower', 25)] }, { name: 'Sanctified', mods: [flat('holyResist', 30), flat('shadowResist', 20)] }],
      capstone: { name: 'Living Saint', text: 'At the start of your turn, every ally heals 6% of max HP.', triggers: [{ id: 'saint-living', trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: 6, target: 'allAllies' }] }] },
    },
  ],
  necromancer: [
    {
      id: 'lich', name: 'Lich', color: '#8fe3ff', description: 'Undeath, frost and endless spellcraft.', ultimate: 'eternal-winter', skill: 'soul-frost',
      mods: [
        { name: 'Frozen Soul', patch: { description: 'Soul Frost may Freeze.', addEffects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, chance: 30 }] } },
        { name: 'Phylactery Drain', patch: { description: 'Soul Frost heals you for 8% of max HP.', addEffects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }] } },
      ],
      minors: [{ name: 'Necromantic Power', mods: [pct('magicAttack', 3)] }, { name: 'Grave Frost', mods: [flat('iceDamage', 4)] }, { name: 'Shadowcraft', mods: [flat('shadowDamage', 4)] }],
      notables: [{ name: 'Phylactery', flags: ['reviveOnce'] }, { name: 'Undeath', mods: [flat('natureResist', 40)], flags: ['immune:poison'] }],
      choice: [{ name: 'Cold Embrace', mods: [flat('damageBonus', 25, targetHasAny('slow', 'freeze'))], text: '+25% damage against Slowed or Frozen enemies.' }, { name: 'Arcane Undeath', mods: [pct('maxMp', 20)] }],
      capstone: { name: 'Archlich', mods: [pct('magicAttack', 20)], flags: ['spellEcho'] },
    },
    {
      id: 'bonelord', name: 'Bonelord', color: '#e8e0c8', description: 'An army of bone, and a golem to lead it.', ultimate: 'bone-apocalypse', skill: 'raise-bone-golem',
      mods: [
        { name: 'Reinforced Golem', patch: { description: 'Raise Bone Golem has 2 less cooldown.', cooldownDelta: -2 } },
        { name: 'Bone Wall', patch: { description: 'Raising the golem also shields you for 20% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 20, target: 'self' }] } },
      ],
      minors: [{ name: 'Commander', mods: [flat('damageBonus', 8, tag('Summon'))] }, { name: 'Bone Plates', mods: [pct('defense', 4)] }, { name: 'Marrow', mods: [flat('vit', 2)] }],
      notables: [{ name: 'Bone Shield', mods: [more('damageTaken', -10)] }, { name: 'Ossuary', text: 'Kills grant an extra Soul Shard.', triggers: [{ id: 'bonelord-ossuary', trigger: 'onKill', effects: [{ kind: 'gainResource', resource: 'soulShards', amount: 1 }] }] }],
      choice: [{ name: 'Legion', flags: ['extraSummon'] }, { name: 'Marrowlord', mods: [flat('damageBonus', 25, tag('Summon'))] }],
      capstone: { name: 'Lord of the Ossuary', text: 'Two skeleton warriors rise at the start of every battle.', triggers: [{ id: 'bonelord-lord', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'skeleton-warrior' }, { kind: 'summon', summonId: 'skeleton-warrior' }] }] },
    },
    {
      id: 'plaguebringer', name: 'Plaguebringer', color: '#7fd13b', description: 'Sickness that spreads, stacks and never stops.', ultimate: 'black-death', skill: 'plague-bomb',
      mods: [
        { name: 'Virulent Bomb', patch: { description: 'Plague Bomb also Weakens.', addEffects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }] } },
        { name: 'Concentrated', patch: { description: 'Plague Bomb deals 50% more damage.', powerMult: 1.5 } },
      ],
      minors: [{ name: 'Pestilence', mods: [flat('natureDamage', 5)] }, { name: 'Infectious', mods: [flat('statusChance', 3)] }, { name: 'Morbid Study', mods: [flat('int', 2)] }],
      notables: [{ name: 'Spreading Sickness', text: 'Kills spread 2 stacks of Poison to every enemy.', triggers: [{ id: 'plague-spread', trigger: 'onKill', effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2, target: 'allEnemies' }] }] }, { name: 'Rotting Touch', text: '25% chance on hit to Poison.', triggers: [{ id: 'plague-touch', trigger: 'onHit', chance: 25, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3 }] }] }],
      choice: [{ name: 'Necrotic Plague', flags: ['dotsCanCrit'] }, { name: 'Carrier', mods: [flat('natureResist', 30)], flags: ['immune:poison'] }],
      capstone: { name: 'Herald of Pestilence', mods: [flat('natureDamage', 25), flat('statusChance', 15)] },
    },
  ],
  bard: [
    {
      id: 'virtuoso', name: 'Virtuoso', color: '#e98ad6', description: 'Pure musical genius, sharp enough to cut.', ultimate: 'symphony-of-destruction', skill: 'masterpiece',
      mods: [
        { name: 'Encore Performance', patch: { description: 'Masterpiece plays twice for 70% each.', hitsAdd: 1, powerMult: 0.7 } },
        { name: 'Crescendo Strike', patch: { description: 'Masterpiece makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
      ],
      minors: [{ name: 'Resonance', mods: [pct('magicAttack', 3)] }, { name: 'Perfect Timing', mods: [flat('critChance', 1)] }, { name: 'Genius', mods: [flat('int', 2)] }],
      notables: [{ name: 'Perfect Pitch', mods: [flat('critDamage', 20)] }, { name: 'Showmanship', text: 'Kills grant 25 Verse.', triggers: [{ id: 'virtuoso-show', trigger: 'onKill', effects: [{ kind: 'gainResource', resource: 'verse', amount: 25 }] }] }],
      choice: [{ name: 'Prodigy', mods: [flat('cooldownReduction', 6)] }, { name: 'Maestro', mods: [pct('magicAttack', 12)] }],
      capstone: { name: 'Living Legend', mods: [pct('magicAttack', 15)], flags: ['spellEcho'] },
    },
    {
      id: 'skald', name: 'Skald', color: '#c0392b', description: 'War-singer of the north. Songs that make heroes.', ultimate: 'ragnarok-chorus', skill: 'war-chant',
      mods: [
        { name: 'Chant of Blood', patch: { description: 'War Chant also grants +5% lifesteal.', addEffects: [{ kind: 'buff', id: 'chant-of-blood', duration: 3, modifiers: [{ stat: 'lifesteal', type: 'flat', value: 5 }] }] } },
        { name: 'Chant of Iron', patch: { description: 'War Chant also grants +20% defense.', addEffects: [{ kind: 'buff', id: 'chant-of-iron', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 20 }] }] } },
      ],
      minors: [{ name: 'Warcry', mods: [flat('damageBonus', 2)] }, { name: 'Hardy', mods: [flat('vit', 2)] }, { name: 'Strong Voice', mods: [flat('str', 2)] }],
      notables: [{ name: 'Saga Teller', mods: [flat('resourceGain', 25)] }, { name: 'Heroic Verse', text: 'Song skills give the party +10% damage for 2 turns.', triggers: [{ id: 'skald-verse', trigger: 'onSkillCast', condition: tag('Song'), effects: [{ kind: 'buff', id: 'heroic-verse', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 10 }], target: 'allAllies' }] }] }],
      choice: [{ name: 'Berserker Song', mods: [flat('damageBonus', 15), pct('defense', -10)] }, { name: 'Shieldsong', text: 'Every ally begins battle shielded for 15% of max HP.', triggers: [{ id: 'skald-shieldsong', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 15, target: 'allAllies' }] }] }],
      capstone: { name: 'Voice of Valhalla', text: 'Start every battle with the Song of Valor playing and the party Hasted.', triggers: [{ id: 'skald-valhalla', trigger: 'onCombatStart', effects: [{ kind: 'startSong', song: 'valor' }, { kind: 'applyStatus', status: 'haste', duration: 2, target: 'allAllies' }] }] },
    },
    {
      id: 'trickster', name: 'Trickster', color: '#9a5ae8', description: 'Nothing is what it seems.', ultimate: 'grand-illusion', skill: 'misdirect',
      mods: [
        { name: 'Confusion', patch: { description: 'Misdirect affects every enemy.', targeting: 'allEnemies', addTags: ['AoE'] } },
        { name: 'Mirror Image', patch: { description: 'Misdirect puts you in Stealth.', addEffects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self' }] } },
      ],
      minors: [{ name: 'Lucky', mods: [flat('luk', 2)] }, { name: 'Slippery', mods: [flat('dodge', 1)] }, { name: 'Tricky', mods: [flat('statusChance', 3)] }],
      notables: [{ name: 'Sleight of Hand', text: '15% chance on hit to steal 8 gold.', triggers: [{ id: 'trickster-sleight', trigger: 'onHit', chance: 15, effects: [{ kind: 'gold', amount: 8 }] }] }, { name: 'Now You See Me', text: 'Dodging puts you in Stealth.', triggers: [{ id: 'trickster-nysm', trigger: 'onDodge', effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self' }] }] }],
      choice: [{ name: 'Jester', text: '25% chance to Charm attackers.', triggers: [{ id: 'trickster-jester', trigger: 'onDamageTaken', chance: 25, effects: [{ kind: 'applyStatus', status: 'charm', duration: 1, target: 'target' }] }] }, { name: 'Escape Artist', mods: [flat('dodge', 8)] }],
      capstone: { name: 'Master of Illusion', text: 'Crits may Charm the target.', flags: ['stealthOnCombatStart'], triggers: [{ id: 'trickster-master', trigger: 'onCrit', chance: 30, effects: [{ kind: 'applyStatus', status: 'charm', duration: 1 }] }] },
    },
  ],
};
