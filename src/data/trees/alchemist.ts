import type { SpecBranchSpec } from './builder';
import { buildTree } from './builder';
import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, cleanse, gain, healPct, md, mn, pas, shieldPct, spec, status, trg, ult } from './kit';
import { MENTOR_BASE } from './mentorBase';

export const ALCHEMIST_SKILLS = [
  act('flask-of-fire', 'Flask of Fire', 'Brew, 2 Reagents: hurl a burning flask for 170% MAG fire damage and Burn.', { el: 'fire', to: 'enemy', tags: ['Attack', 'Fire', 'DoT', 'Brew', 'Projectile'], cd: 1, res: ['reagents', 2], dmg: ['m', 1.7, 0.12], fx: [status('burn', 3)] }),
  act('frost-grenade', 'Frost Grenade', 'Brew, 3 Reagents: a grenade of cold for 120% MAG ice damage to every enemy and Slow.', { el: 'ice', to: 'allEnemies', tags: ['Attack', 'Ice', 'AoE', 'Brew', 'Projectile'], cd: 2, res: ['reagents', 3], dmg: ['m', 1.2, 0.09], fx: [status('slow', 2)] }),
  act('mutagen-might', 'Mutagen of Might', 'Brew, 3 Reagents: +30% physical attack and +15% damage for 3 turns, but you take 10% more damage.', { el: 'physical', to: 'self', tags: ['Buff', 'Brew'], cd: 4, res: ['reagents', 3], fx: [buff('mutagen-might', 3, [{ stat: 'physicalAttack', type: 'percent', value: 30 }, { stat: 'damageBonus', type: 'flat', value: 15 }, { stat: 'damageTaken', type: 'more', value: 10 }])] }),
  act('mutagen-swiftness', 'Mutagen of Swiftness', 'Brew, 2 Reagents: +15 speed and +15% dodge for 3 turns.', { el: 'nature', to: 'self', tags: ['Buff', 'Brew'], cd: 4, res: ['reagents', 2], fx: [buff('mutagen-swiftness', 3, [{ stat: 'speed', type: 'flat', value: 15 }, { stat: 'dodge', type: 'flat', value: 15 }])] }),
  act('restorative-draught', 'Restorative Draught', 'Brew, 2 Reagents: heal an ally for 150% MAG and cleanse Poison.', { el: 'nature', to: 'ally', tags: ['Heal', 'Brew'], cd: 1, res: ['reagents', 2], heal: ['m', 1.5, 0.12], fx: [cleanse('poison')] }),
  act('antidote-mist', 'Antidote Mist', 'Brew, 2 Reagents: a curative mist cleanses Poison, Bleed and Burn from the whole party and heals 6%.', { el: 'nature', to: 'allAllies', tags: ['Heal', 'Brew', 'AoE'], cd: 3, res: ['reagents', 2], fx: [cleanse('poison', 'allAllies'), cleanse('bleed', 'allAllies'), cleanse('burn', 'allAllies'), healPct(6, 'allAllies')] }),
  act('quicksilver-tonic', 'Quicksilver Tonic', 'Brew, 3 Reagents: an ally is Hasted for 3 turns and their cooldowns drop by 1.', { el: 'arcane', to: 'ally', tags: ['Buff', 'Brew'], cd: 4, res: ['reagents', 3], fx: [status('haste', 3), { kind: 'reduceCooldowns', turns: 1 }] }),
  act('philosophers-gambit', 'Philosopher’s Gambit', 'Brew, 4 Reagents: a volatile transmutation: 280% MAG arcane damage, and 60 gold spun from the residue.', { el: 'arcane', to: 'enemy', tags: ['Attack', 'Arcane', 'Brew'], cd: 3, res: ['reagents', 4], dmg: ['m', 2.8, 0.2], fx: [{ kind: 'gold', amount: 60 }] }),
  spec('cluster-bomb', 'Cluster Bomb', 'Brew, 3 Reagents: three bomblets at random enemies for 100% MAG fire damage each.', { el: 'fire', to: 'randomEnemies', tags: ['Attack', 'Fire', 'AoE', 'Brew', 'Projectile'], cd: 2, res: ['reagents', 3], dmg: ['m', 1, 0.08, 3] }),
  ult('carpet-of-fire', 'Carpet of Fire', 'The whole field burns: 280% MAG fire damage to every enemy and Burn that stacks.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'AoE', 'Brew'], dmg: ['m', 2.8, 0], fx: [status('burn', 4, { stacks: 2 })] }),
  spec('chimeric-surge', 'Chimeric Surge', 'Brew, 4 Reagents: for 3 turns you gain +40% physical attack, +20 speed and 20% lifesteal, and take 15% more damage.', { el: 'nature', to: 'self', tags: ['Buff', 'Brew'], cd: 5, res: ['reagents', 4], fx: [buff('chimeric-surge', 3, [{ stat: 'physicalAttack', type: 'percent', value: 40 }, { stat: 'speed', type: 'flat', value: 20 }, { stat: 'lifesteal', type: 'flat', value: 20 }, { stat: 'damageTaken', type: 'more', value: 15 }])] }),
  ult('perfect-form', 'Perfect Form', 'The mutation stabilizes: heal 40%, +50% damage and +20% defense for 4 turns, and 200% ATK to every enemy.', { el: 'nature', to: 'allEnemies', tags: ['Attack', 'Nature', 'Heal', 'AoE', 'Brew'], dmg: ['p', 2, 0], fx: [healPct(40), buff('perfect-form', 4, [{ stat: 'damageBonus', type: 'flat', value: 50 }, { stat: 'defense', type: 'percent', value: 20 }], 'self')] }),
  spec('panacea', 'Panacea', 'Brew, 4 Reagents: heal the party for 120% MAG, cleanse every harmful status and shield for 10%.', { el: 'nature', to: 'allAllies', tags: ['Heal', 'Brew', 'AoE'], cd: 4, res: ['reagents', 4], heal: ['m', 1.2, 0.1], fx: [cleanse('poison', 'allAllies'), cleanse('bleed', 'allAllies'), cleanse('burn', 'allAllies'), cleanse('curse', 'allAllies'), shieldPct(10, 'allAllies')] }),
  ult('elixir-of-life', 'Elixir of Life', 'The final brew: the party is healed for 60%, fallen allies’ pain is gone, and everyone gains Regeneration and Divine Protection.', { el: 'nature', to: 'allAllies', tags: ['Heal', 'Brew', 'AoE'], fx: [healPct(60, 'allAllies'), status('regen', 4, { target: 'allAllies' }), status('divine-protection', 2, { target: 'allAllies' })] }),
  ult('grand-alembic', 'Grand Alembic', 'Everything at once: 250% MAG fire damage to every enemy, the party is healed for 20% and gains +20% damage for 3 turns.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'Heal', 'AoE', 'Brew'], dmg: ['m', 2.5, 0], fx: [healPct(20, 'allAllies'), buff('grand-alembic', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies')] }),
];

export const ALCHEMIST_TREE = buildTree('alchemist', [
  {
    id: 'bombcraft', name: 'Bombcraft', color: '#e8683a', description: 'Fire, frost and a very short fuse.',
    a: { skill: 'flask-of-fire', starting: true },
    aMods: [md('Napalm', 'Flask of Fire hits 20% harder.', { powerMult: 1.2 }), md('Splash Flask', 'Flask of Fire also burns every other enemy.', { addEffects: [status('burn', 2, { target: 'allEnemies' })] })],
    b: { skill: 'frost-grenade' },
    bMods: [md('Cold Snap', 'Frost Grenade may Freeze.', { addEffects: [status('freeze', 1, { chance: 25 })] }), md('Bigger Boom', 'Frost Grenade hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Steady Hand', 'accuracy', 2), mn('Volatile', 'fireDamage', 3), mn('Brittle Glass', 'critDamage', 6), mn('Reagent Pouch', 'resourceGain', 6)],
    notables: [pas('Pyromaniac', 'Burning enemies take 10% more damage from you.', [['fireDamage', 6]]), pas('Chain Reaction', 'Kills refund 1 Reagent.', [['resourceGain', 6]], [trg('alchemist-chain-reaction', 'onKill', [gain('reagents', 1)])])],
    choice: [pas('Shaped Charge', '+12% crit damage.', [['critDamage', 12]]), pas('Wide Blast', '+8% damage to enemies in the back row.', [['damageBonus', 6]])],
    keystone: pas('Unstable Mixture', '+25% damage, but you take 10% more damage.', [['damageBonus', 25], ['damageTaken', 10, 'm']]),
    capstone: pas('Master Grenadier', 'Bombs refund a Reagent 20% of the time.', [['magicAttack', 12, 'p']], [trg('alchemist-master-grenadier', 'onSkillCast', [gain('reagents', 1)], { chance: 20, condition: { kind: 'skillTag', tag: 'Brew' } })]),
  },
  {
    id: 'mutations', name: 'Mutations', color: '#6ab84a', description: 'Change yourself, for a while, at a cost.',
    a: { skill: 'mutagen-might' },
    aMods: [md('Steady Dose', 'Mutagen of Might costs a third fewer Reagents.', { costMult: 0.67 }), md('Bitter Dose', 'Mutagen of Might also heals you for 10%.', { addEffects: [healPct(10)] })],
    b: { skill: 'mutagen-swiftness' },
    bMods: [md('Quicker Dose', 'Mutagen of Swiftness recovers a turn sooner.', { cooldownDelta: -1 }), md('Dosed Reflexes', 'Mutagen of Swiftness also grants +10% crit chance.', { addEffects: [buff('dosed-reflexes', 3, [{ stat: 'critChance', type: 'flat', value: 10 }], 'self')] })],
    minors: [mn('Iron Gut', 'statusResist', 4), mn('Thick Blood', 'maxHp', 3, 'p'), mn('Quick Reflexes', 'speed', 2), mn('Hardened', 'defense', 3, 'p')],
    notables: [pas('Tolerance', 'Mutagen drawbacks are 40% weaker.', [['damageTaken', -4, 'm']]), pas('Adrenal Surge', '+10% damage while your HP is above 70%.', [['damageBonus', 6]])],
    choice: [pas('Regenerative', 'Heal 2% of max HP each turn.', [['hpRegen', 2]]), pas('Berserk Mutation', '+10% crit chance.', [['critChance', 10]])],
    keystone: pas('Beast Within', '+35% physical attack and +10% lifesteal, but no healing from other sources.', [['physicalAttack', 35, 'p'], ['lifesteal', 10], ['healingReceived', -100]]),
    capstone: pas('Perfected Mutation', 'Mutagens last a turn longer.', [['maxHp', 12, 'p']]),
  },
  {
    id: 'remedies', name: 'Remedies', color: '#4ab8a8', description: 'The cure is a craft: teas, tinctures and timing.',
    a: { skill: 'restorative-draught', starting: true },
    aMods: [md('Stronger Draught', 'Restorative Draught heals 25% more.', { powerMult: 1.25 }), md('Soothing Draught', 'Restorative Draught also grants Regeneration.', { addEffects: [status('regen', 3)] })],
    b: { skill: 'antidote-mist' },
    bMods: [md('Wider Mist', 'Antidote Mist heals another 6% for the party.', { addEffects: [healPct(6, 'allAllies')] }), md('Fast Mist', 'Antidote Mist recovers a turn sooner.', { cooldownDelta: -1 })],
    minors: [mn('Herbalism', 'healingPower', 4), mn('Clean Hands', 'statusResist', 4), mn('Dried Herbs', 'resourceGain', 5), mn('Mortar and Pestle', 'mpRegen', 1)],
    notables: [pas('Bedside Manner', 'Healed allies take 8% less damage.', [['healingPower', 8]]), pas('Triage', 'Heal 20% more on allies below 50% HP.', [['healingPower', 6]])],
    choice: [pas('Apothecary’s Eye', '+12% healing power.', [['healingPower', 12]]), pas('Second Dose', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    keystone: pas('Miracle Cure', '+35% healing power, but 15% less damage dealt.', [['healingPower', 35], ['damageBonus', -15]]),
    capstone: pas('Master Apothecary', 'Healing refunds a Reagent 20% of the time.', [['healingPower', 12]], [trg('alchemist-master-apothecary', 'onHeal', [gain('reagents', 1)], { chance: 20 })]),
  },
  {
    id: 'transmutation', name: 'Transmutation', color: '#c8a84a', description: 'Turning one thing into another, usually money.',
    a: { skill: 'quicksilver-tonic' },
    aMods: [md('Quicker Silver', 'Quicksilver Tonic recovers a turn sooner.', { cooldownDelta: -1 }), md('Silver Shield', 'Quicksilver Tonic also shields the ally for 10%.', { addEffects: [shieldPct(10, 'target')] })],
    b: { skill: 'philosophers-gambit' },
    bMods: [md('Rich Residue', 'Philosopher’s Gambit spins 60 more gold.', { addEffects: [{ kind: 'gold', amount: 60 }] }), md('Bright Reaction', 'Philosopher’s Gambit hits 20% harder.', { powerMult: 1.2 })],
    minors: [mn('Gold Eye', 'goldFind', 6), mn('Alchemy', 'magicAttack', 3, 'p'), mn('Quick Fingers', 'cooldownReduction', 2), mn('Lucky Mixture', 'magicFind', 4)],
    notables: [pas('Lead to Gold', '+15% gold find.', [['goldFind', 15]]), pas('Reagent Reuse', 'Brew skills have a 15% chance to cost nothing.', [['resourceGain', 8]])],
    choice: [pas('Catalyst', '+10% cooldown reduction.', [['cooldownReduction', 10]]), pas('Transmuter’s Luck', '+8% crit chance.', [['critChance', 8]])],
    keystone: pas('Philosopher’s Stone', '+15% resource gain, but 10% less max HP.', [['maxHp', -10, 'p'], ['resourceGain', 15]]),
    capstone: pas('The Great Work', '+12% magic attack, +10% cooldown reduction.', [['magicAttack', 12, 'p'], ['cooldownReduction', 10]]),
  },
]);

export const ALCHEMIST_SPECS: SpecBranchSpec[] = [
  {
    id: 'grenadier', name: 'Grenadier', color: '#f08a3a', description: 'Fire everywhere, ideally away from you.', ultimate: 'carpet-of-fire', skill: 'cluster-bomb',
    mods: [md('More Bomblets', 'Cluster Bomb throws one more bomblet.', { hitsAdd: 1 }), md('Sticky Bombs', 'Cluster Bomb also Burns.', { addEffects: [status('burn', 3)] })],
    minors: [mn('Fuse Master', 'cooldownReduction', 3), mn('Blast Radius', 'fireDamage', 4), mn('Demolition', 'critDamage', 8)],
    notables: [pas('Shrapnel', 'Bombs cause Bleed.', [['damageBonus', 5]]), pas('Burn Notice', '+10% damage to Burning enemies.', [['fireDamage', 8]])],
    choice: [pas('Heavy Charges', '+12% damage.', [['damageBonus', 12]]), pas('Light Fuses', '+8% cooldown reduction.', [['cooldownReduction', 8]])],
    capstone: pas('Sapper-General', '+15% magic attack; bombs may throw twice.', [['magicAttack', 15, 'p']]),
  },
  {
    id: 'mutagenist', name: 'Mutagenist', color: '#58c848', description: 'Make yourself a weapon, at some cost.', ultimate: 'perfect-form', skill: 'chimeric-surge',
    mods: [md('Longer Surge', 'Chimeric Surge also heals you for 10%.', { addEffects: [healPct(10)] }), md('Harsher Surge', 'Chimeric Surge hits you harder: +10% damage.', { addEffects: [buff('harsher-surge', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'self')] })],
    minors: [mn('Hardy', 'maxHp', 4, 'p'), mn('Feral', 'physicalAttack', 4, 'p'), mn('Quick', 'speed', 3)],
    notables: [pas('Beast Blood', '+12% lifesteal while buffed by a mutagen.', [['lifesteal', 4]]), pas('Reckless Chemistry', '+15% damage, +10% damage taken.', [['damageBonus', 10], ['damageTaken', 6, 'm']])],
    choice: [pas('Tough Hide', '+15% defense.', [['defense', 15, 'p']]), pas('Raging Blood', '+10% crit chance.', [['critChance', 10]])],
    capstone: pas('The Final Form', '+15% physical attack, +12% max HP.', [['physicalAttack', 15, 'p'], ['maxHp', 12, 'p']]),
  },
  {
    id: 'apothecary', name: 'Apothecary', color: '#38c8b8', description: 'Heal the whole party before it knows it’s hurt.', ultimate: 'elixir-of-life', skill: 'panacea',
    mods: [md('Stronger Panacea', 'Panacea heals 25% more.', { powerMult: 1.25 }), md('Long Panacea', 'Panacea also grants Regeneration.', { addEffects: [status('regen', 3, { target: 'allAllies' })] })],
    minors: [mn('Pharmacopoeia', 'healingPower', 5), mn('Clean Room', 'statusResist', 5), mn('Distillate', 'mpRegen', 1)],
    notables: [pas('Patient Care', 'Heal 3% of max HP for all allies each turn.', [['healingPower', 8]]), pas('Cure-All', 'Healing removes a harmful status 30% of the time.', [['healingPower', 6]])],
    choice: [pas('Potent', '+15% healing power.', [['healingPower', 15]]), pas('Prepared', '+10% cooldown reduction.', [['cooldownReduction', 10]])],
    capstone: pas('Physician of the Realm', '+20% healing power and healing grants Regeneration.', [['healingPower', 20]]),
  },
];

export const ALCHEMIST: GreaterClass = {
  def: {
    id: 'alchemist', name: 'Alchemist', tagline: 'Everything is a reagent, if you’re brave enough.',
    description: 'A brewer who throws bombs, drinks mutagens and mends allies, spending Reagents on every flask.',
    playstyle: 'Reagents build with every blow and kill. Spend them on brews: bombs for damage, mutagens for self-buffs, remedies for healing and transmutations for tricks.',
    role: 'Utility / versatile', difficulty: 2, color: '#6ab84a',
    mechanic: { name: 'Reagents and Brewing', description: 'Reagents build as you fight. Every Brew skill spends them: pick between bombs, mutagens, remedies and transmutations as the fight demands.' },
    trait: { name: 'Practiced Hands', description: '95% more max HP, 30% less damage taken, +25% damage, +10% crit damage and 6% lifesteal.', modifiers: [{ stat: 'lifesteal', type: 'flat', value: 6 }, { stat: 'maxHp', type: 'more', value: 95 }, { stat: 'damageTaken', type: 'more', value: -30 }, { stat: 'damageBonus', type: 'flat', value: 25 }, { stat: 'critDamage', type: 'flat', value: 10 }] },
    resource: 'reagents',
    baseStats: { str: 3, dex: 6, int: 8, vit: 5, wis: 6, luk: 4, fai: 2, cha: 4 },
    growth: { str: 0.3, dex: 0.8, int: 1.5, vit: 0.8, wis: 0.9, luk: 0.5, fai: 0.2, cha: 0.5 },
    weapons: ['dagger', 'throwing', 'wand', 'staff'], armor: ['cloth', 'leather'],
    startingSkills: ['flask-of-fire', 'restorative-draught'], ultimate: 'grand-alembic', defaultRow: 'back',
  },
  resource: { id: 'reagents', name: 'Reagents', max: 12, start: 4, decayPerTurn: 0, color: '#6ab84a', description: 'Gathered as you fight. Every brew spends them.', gains: { onBasicAttack: 1, onEnemyDeath: 2 } },
  skills: ALCHEMIST_SKILLS, tree: ALCHEMIST_TREE, specs: ALCHEMIST_SPECS,
  mentor: { ...MENTOR_BASE, id: 'mentor-alchemist', name: 'Apothecary Dunmore Pell', row: 'back', ai: 'caster', stats: { hp: 66, attack: 8, magic: 17, defense: 6, magicResist: 9, speed: 12 }, resists: { fire: 30, nature: 30 }, skills: [{ id: 'mentor-meteor', weight: 2 }, { id: 'mend-ally' }, { id: 'goblin-hex' }], basicAttack: { element: 'fire', ranged: true, magic: true, name: 'Thrown Flask' }, description: 'Missing two eyebrows and one opinion of safety.', palette: { main: '#5a8a3a', accent: '#e8a830' } },
  trial: { quote: 'Everything is a poison. The question is the dose.', support: [{ enemyId: 'goblin-cutthroat' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles, and write down what you used.' },
  mentorNpc: { name: 'Apothecary Dunmore Pell', race: 'gnome', portrait: 5, color: '#5a8a3a', greeting: '“Don’t touch that. Or that. That one’s fine. Touch that one. Gently.”' },
  kit: [{ itemId: 'dagger-t1', equip: true }, { itemId: 'leather-chest-t1', equip: true }, { itemId: 'leather-gloves-t1', equip: true }, { itemId: 'health-potion-minor', qty: 4 }, { itemId: 'mana-potion-minor', qty: 2 }, { itemId: 'scroll-of-identify', qty: 1 }, { itemId: 'hearty-stew', qty: 1 }],
  art: { rows: ['....gggg....', '....gGGg....', '.....gg.....', '....gGGg....', '...gGggGg...', '..gGGGGGGg..', '..gGGyyGGg..', '..gGGyyGGg..', '...gGGGGg...', '....gggg....', '............', '............'], colors: { g: '#3a6a2a', G: '#7ac85a', y: '#f0d050' } },
  questline: ['hesha', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['Mortar and Pestle', 'The Spoiled Batch', 'A Warren of Fumes', 'The Poisoner’s Rival', 'The Great Work'], ['“Every alchemist begins by grinding something for someone who didn’t ask. Go to Hesha’s shrine and grind an honest offering.”', '“A bad batch of tonic has sickened a caravan. Find what spoiled it and put it right.”', '“The goblins brew something in their warren. I want to know what, and whether it is legal.”', '“A rival has been selling my recipes. Persuade them otherwise, loudly.”', '“The Great Work is a myth. I would like to show you why it isn’t.”'], '“All alchemy is a promise: take this, and become something else. What will you promise?”', '“That it will work. And that I will be there when it doesn’t.”', '“A salesman’s tongue and a scholar’s wrists. Both are rare, and together, impossible.”', '“I’ll take the risk.”', 'Keeper of the Great Work'],
  legendary: { id: 'philosophers-satchel', name: 'Philosopher’s Satchel', rarity: 'legendary', baseId: 'dagger-t4', level: 25, requirements: { classes: ['alchemist'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'resourceGain', type: 'flat', value: 25 }], triggers: [trg('satchel-spare', 'onSkillCast', [gain('reagents', 1)], { chance: 25, condition: { kind: 'skillTag', tag: 'Brew' } }), trg('satchel-fix', 'onTurnStart', [healPct(2)])], effectText: ['25% chance when you brew to refund 1 Reagent', 'Heal 2% of max HP at the start of each of your turns'], lore: 'It has always had one more pocket than you counted.' },
};
