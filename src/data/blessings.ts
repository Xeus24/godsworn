import type { BlessingDef } from '../engine/gods/types';
import { flat, more, pct, tag } from './trees/builder';

type Spec = Omit<BlessingDef, 'kind' | 'god'>;

/** Minor blessings last 10 battles and cost favor at a shrine. */
const minor = (god: string, s: Omit<Spec, 'rarity'> & { rarity?: Spec['rarity'] }): BlessingDef => ({ rarity: 'common', battles: 10, favorCost: 20, ...s, god, kind: 'minor' });
/** Major blessings are offered at devotion tiers: 3 uncommon (Acknowledged), 1 rare (Favored), 1 epic (Devoted), 1 legendary (Exalted). */
const major = (god: string, s: Spec): BlessingDef => ({ ...s, god, kind: 'major' });

export const BLESSINGS: BlessingDef[] = [
  // ---------------- Solenne ----------------
  minor('solenne', { id: 'solenne-dawn', name: 'Dawnlight', description: '+15% holy damage.', modifiers: [flat('holyDamage', 15)] }),
  minor('solenne', { id: 'solenne-ward', name: 'Ward of Day', description: '+10% defense.', modifiers: [pct('defense', 10)] }),
  minor('solenne', { id: 'solenne-judgement', name: 'Judgement', rarity: 'uncommon', favorCost: 30, description: '+20% damage against undead.', modifiers: [flat('damageBonus', 20, { kind: 'targetType', enemyType: 'undead' })] }),
  major('solenne', { id: 'solenne-radiance', name: 'Radiance', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% holy damage and +5 FAI.', modifiers: [flat('holyDamage', 10), flat('fai', 5)] }),
  major('solenne', { id: 'solenne-vigil', name: 'Vigil', rarity: 'uncommon', minTier: 'acknowledged', description: '+8% max HP.', modifiers: [pct('maxHp', 8)] }),
  major('solenne', { id: 'solenne-justice', name: 'Swift Justice', rarity: 'rare', minTier: 'favored', description: '20% chance on hit to deal bonus holy damage (40% Divine Power).', modifiers: [], triggers: [{ id: 'bless-solenne-justice', trigger: 'onHit', chance: 20, cooldown: 1, effects: [{ kind: 'damage', element: 'holy', scaling: { stat: 'divinePower', ratio: 0.4 } }] }] }),
  major('solenne', { id: 'solenne-daybreak', name: 'Daybreak', rarity: 'uncommon', minTier: 'acknowledged', description: '20% more damage during the day.', modifiers: [], flags: ['strongerByDay'] }),
  major('solenne', { id: 'solenne-aegis', name: 'Aegis of Dawn', rarity: 'epic', minTier: 'devoted', description: 'Start every battle with Divine Protection for 1 turn and +15% holy damage.', modifiers: [flat('holyDamage', 15)], triggers: [{ id: 'bless-solenne-aegis', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'divine-protection', duration: 1, target: 'self' }] }] }),
  major('solenne', { id: 'solenne-sun', name: 'The Unclouded Eye', rarity: 'legendary', minTier: 'exalted', description: '+25% holy damage; your critical hits ignore half of defense.', modifiers: [flat('holyDamage', 25)], flags: ['critsIgnoreDefense'] }),
  // ---------------- Morrath ----------------
  minor('morrath', { id: 'morrath-shade', name: 'Shade', description: '+15% shadow damage.', modifiers: [flat('shadowDamage', 15)] }),
  minor('morrath', { id: 'morrath-chill', name: 'Grave Chill', description: '+10 status chance.', modifiers: [flat('statusChance', 10)] }),
  minor('morrath', { id: 'morrath-toll', name: 'The Toll', rarity: 'uncommon', favorCost: 30, description: '+20% damage against enemies below 50% HP.', modifiers: [flat('damageBonus', 20, { kind: 'targetHpBelow', pct: 50 })] }),
  major('morrath', { id: 'morrath-raven', name: 'Raven’s Eye', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% shadow damage and +5 INT.', modifiers: [flat('shadowDamage', 10), flat('int', 5)] }),
  major('morrath', { id: 'morrath-patience', name: 'Patience of the Grave', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% status resist.', modifiers: [flat('statusResist', 10)] }),
  major('morrath', { id: 'morrath-harvest', name: 'Soul Harvest', rarity: 'rare', minTier: 'favored', description: 'Kills restore 10% of max HP.', modifiers: [], triggers: [{ id: 'bless-morrath-harvest', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 10, target: 'self' }] }] }),
  major('morrath', { id: 'morrath-night', name: 'Nightfall', rarity: 'uncommon', minTier: 'acknowledged', description: '20% more damage at night.', modifiers: [], flags: ['strongerAtNight'] }),
  major('morrath', { id: 'morrath-legion', name: 'Legion of the Last Door', rarity: 'epic', minTier: 'devoted', description: 'Summoning skills raise one extra minion.', modifiers: [flat('shadowDamage', 10)], flags: ['extraSummon'] }),
  major('morrath', { id: 'morrath-door', name: 'Keeper’s Reprieve', rarity: 'legendary', minTier: 'exalted', description: 'Once per battle, survive a killing blow with 1 HP; +15% shadow damage.', modifiers: [flat('shadowDamage', 15)], flags: ['reviveOnce'] }),
  // ---------------- Kael ----------------
  minor('kael', { id: 'kael-fury', name: 'Fury', description: '+10% damage.', modifiers: [flat('damageBonus', 10)] }),
  minor('kael', { id: 'kael-blade', name: 'Keen Blade', description: '+15% crit damage.', modifiers: [flat('critDamage', 15)] }),
  minor('kael', { id: 'kael-glory', name: 'Glory', rarity: 'uncommon', favorCost: 30, description: '+20% damage while above 50% HP.', modifiers: [flat('damageBonus', 20, { kind: 'hpAbove', pct: 50 })] }),
  major('kael', { id: 'kael-strength', name: 'Strength of the Banner', rarity: 'uncommon', minTier: 'acknowledged', description: '+6 STR.', modifiers: [flat('str', 6)] }),
  major('kael', { id: 'kael-veteran', name: 'Veteran', rarity: 'uncommon', minTier: 'acknowledged', description: '+5% crit chance.', modifiers: [flat('critChance', 5)] }),
  major('kael', { id: 'kael-first-blood', name: 'First Blood', rarity: 'rare', minTier: 'favored', description: 'Always act first in the opening round.', modifiers: [], flags: ['firstStrike'] }),
  major('kael', { id: 'kael-warlust', name: 'Warlust', rarity: 'uncommon', minTier: 'acknowledged', description: 'Kills grant +20% damage for 2 turns.', modifiers: [], triggers: [{ id: 'bless-kael-warlust', trigger: 'onKill', effects: [{ kind: 'buff', id: 'kael-warlust', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 20 }], target: 'self' }] }] }),
  major('kael', { id: 'kael-champion', name: 'Champion', rarity: 'epic', minTier: 'devoted', description: 'Deal 25% more damage to bosses; +10% damage.', modifiers: [flat('damageBonus', 10)], flags: ['bonusVsBosses'] }),
  major('kael', { id: 'kael-red-banner', name: 'The Red Banner', rarity: 'legendary', minTier: 'exalted', description: '+20% damage and +15% crit damage; attacks on enemies below 20% HP always crit.', modifiers: [flat('damageBonus', 20), flat('critDamage', 15)], flags: ['executioner'] }),
  // ---------------- Ysolde ----------------
  minor('ysolde', { id: 'ysolde-thorn', name: 'Thorn', description: '+15% nature damage.', modifiers: [flat('natureDamage', 15)] }),
  minor('ysolde', { id: 'ysolde-stalk', name: 'Stalker', description: '+8 dodge.', modifiers: [flat('dodge', 8)] }),
  minor('ysolde', { id: 'ysolde-hunt', name: 'The Hunt', rarity: 'uncommon', favorCost: 30, description: '+20% damage against beasts.', modifiers: [flat('damageBonus', 20, { kind: 'targetType', enemyType: 'beast' })] }),
  major('ysolde', { id: 'ysolde-grace', name: 'Grace of the Deer', rarity: 'uncommon', minTier: 'acknowledged', description: '+6 DEX.', modifiers: [flat('dex', 6)] }),
  major('ysolde', { id: 'ysolde-eye', name: 'Hunter’s Eye', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% damage with Ranged skills.', modifiers: [flat('damageBonus', 10, tag('Ranged'))] }),
  major('ysolde', { id: 'ysolde-venom', name: 'Green Venom', rarity: 'rare', minTier: 'favored', description: '20% chance on hit to Poison.', modifiers: [], triggers: [{ id: 'bless-ysolde-venom', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3 }] }] }),
  major('ysolde', { id: 'ysolde-wild', name: 'Wild Heart', rarity: 'uncommon', minTier: 'acknowledged', description: '+4 HP regeneration and +5% speed.', modifiers: [flat('hpRegen', 4), pct('speed', 5)] }),
  major('ysolde', { id: 'ysolde-pack', name: 'Mother of the Pack', rarity: 'epic', minTier: 'devoted', description: 'A spirit stag joins you at the start of every battle.', modifiers: [], triggers: [{ id: 'bless-ysolde-pack', trigger: 'onCombatStart', effects: [{ kind: 'summon', summonId: 'spirit-stag' }] }] }),
  major('ysolde', { id: 'ysolde-moon', name: 'The Antlered Moon', rarity: 'legendary', minTier: 'exalted', description: '+25% nature damage; damage over time can crit.', modifiers: [flat('natureDamage', 25)], flags: ['dotsCanCrit'] }),
  // ---------------- Vex ----------------
  minor('vex', { id: 'vex-luck', name: 'Beginner’s Luck', description: '+5 LUK.', modifiers: [flat('luk', 5)] }),
  minor('vex', { id: 'vex-trick', name: 'Sleight', description: '+6% crit chance.', modifiers: [flat('critChance', 6)] }),
  minor('vex', { id: 'vex-jackpot', name: 'Jackpot', rarity: 'uncommon', favorCost: 30, description: '+30% gold find and +20% magic find.', modifiers: [flat('goldFind', 30), flat('magicFind', 20)] }),
  major('vex', { id: 'vex-fortune', name: 'Fortune’s Favorite', rarity: 'uncommon', minTier: 'acknowledged', description: '+15% magic find.', modifiers: [flat('magicFind', 15)] }),
  major('vex', { id: 'vex-quick', name: 'Quick Fingers', rarity: 'uncommon', minTier: 'acknowledged', description: '+5 dodge and +2 speed.', modifiers: [flat('dodge', 5), flat('speed', 2)] }),
  major('vex', { id: 'vex-gamble', name: 'Gambler’s Edge', rarity: 'rare', minTier: 'favored', description: '+25% crit damage, but -5 accuracy.', modifiers: [flat('critDamage', 25), flat('accuracy', -5)] }),
  major('vex', { id: 'vex-vanish', name: 'Now You Don’t', rarity: 'uncommon', minTier: 'acknowledged', description: 'Begin every battle in Stealth.', modifiers: [], flags: ['stealthOnCombatStart'] }),
  major('vex', { id: 'vex-coin', name: 'Two-Faced Coin', rarity: 'epic', minTier: 'devoted', description: 'Critical hits have a 25% chance to steal 5 gold and reduce your cooldowns by 1.', modifiers: [flat('critChance', 5)], triggers: [{ id: 'bless-vex-coin', trigger: 'onCrit', chance: 25, effects: [{ kind: 'gold', amount: 5 }, { kind: 'reduceCooldowns', turns: 1 }] }] }),
  major('vex', { id: 'vex-smile', name: 'The Smiling Coin', rarity: 'legendary', minTier: 'exalted', description: '+10 LUK, +10% crit chance and +25% magic find.', modifiers: [flat('luk', 10), flat('critChance', 10), flat('magicFind', 25)] }),
  // ---------------- Thalor ----------------
  minor('thalor', { id: 'thalor-ember', name: 'Ember', description: '+15% fire damage.', modifiers: [flat('fireDamage', 15)] }),
  minor('thalor', { id: 'thalor-plate', name: 'Tempered Plate', description: '+12% defense.', modifiers: [pct('defense', 12)] }),
  minor('thalor', { id: 'thalor-edge', name: 'Honed Edge', rarity: 'uncommon', favorCost: 30, description: '+10% physical attack.', modifiers: [pct('physicalAttack', 10)] }),
  major('thalor', { id: 'thalor-sinew', name: 'Iron Sinew', rarity: 'uncommon', minTier: 'acknowledged', description: '+4 STR and +4 VIT.', modifiers: [flat('str', 4), flat('vit', 4)] }),
  major('thalor', { id: 'thalor-anvil', name: 'Anvil Skin', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% defense.', modifiers: [pct('defense', 10)] }),
  major('thalor', { id: 'thalor-forge', name: 'Forgefire', rarity: 'rare', minTier: 'favored', description: '20% chance on hit to Burn.', modifiers: [], triggers: [{ id: 'bless-thalor-forge', trigger: 'onHit', chance: 20, effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }] }] }),
  major('thalor', { id: 'thalor-mastercraft', name: 'Mastercraft', rarity: 'uncommon', minTier: 'acknowledged', description: 'No speed penalty for off-class armor; +5% max HP.', modifiers: [pct('maxHp', 5)], flags: ['armorTraining'] }),
  major('thalor', { id: 'thalor-bulwark', name: 'Bulwark', rarity: 'epic', minTier: 'devoted', description: 'Take 10% less damage.', modifiers: [more('damageTaken', -10)] }),
  major('thalor', { id: 'thalor-father', name: 'The Anvil-Father', rarity: 'legendary', minTier: 'exalted', description: '+20% defense, +20% fire damage, and Burns spread when burning enemies die.', modifiers: [pct('defense', 20), flat('fireDamage', 20)], flags: ['burnSpreadsOnDeath'] }),
  // ---------------- Nymira ----------------
  minor('nymira', { id: 'nymira-spark', name: 'Spark', description: '+15% lightning damage.', modifiers: [flat('lightningDamage', 15)] }),
  minor('nymira', { id: 'nymira-frost', name: 'Sea Frost', description: '+15% ice damage.', modifiers: [flat('iceDamage', 15)] }),
  minor('nymira', { id: 'nymira-tide', name: 'High Tide', rarity: 'uncommon', favorCost: 30, description: '+3 MP regeneration.', modifiers: [flat('mpRegen', 3)] }),
  major('nymira', { id: 'nymira-current', name: 'Current', rarity: 'uncommon', minTier: 'acknowledged', description: '+3 speed.', modifiers: [flat('speed', 3)] }),
  major('nymira', { id: 'nymira-depths', name: 'The Depths', rarity: 'uncommon', minTier: 'acknowledged', description: '+6 INT.', modifiers: [flat('int', 6)] }),
  major('nymira', { id: 'nymira-squall', name: 'Squall', rarity: 'rare', minTier: 'favored', description: 'Lightning skills deal 20% more damage.', modifiers: [flat('damageBonus', 20, tag('Lightning'))] }),
  major('nymira', { id: 'nymira-shatter', name: 'Shatterstorm', rarity: 'uncommon', minTier: 'acknowledged', description: 'Ice damage against Burning enemies always Shatters; +10% ice damage.', modifiers: [flat('iceDamage', 10)], flags: ['shatterAlways'] }),
  major('nymira', { id: 'nymira-eye', name: 'Eye of the Hurricane', rarity: 'epic', minTier: 'devoted', description: 'Each turn, 25% chance to strike a random enemy with lightning (60% Divine Power).', modifiers: [], triggers: [{ id: 'bless-nymira-eye', trigger: 'onTurnStart', chance: 25, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'divinePower', ratio: 0.6 }, target: 'randomEnemy' }] }] }),
  major('nymira', { id: 'nymira-mother', name: 'Mother of Tides', rarity: 'legendary', minTier: 'exalted', description: '+20% lightning and ice damage, and 20% chance for spells to cast twice.', modifiers: [flat('lightningDamage', 20), flat('iceDamage', 20)], flags: ['spellEcho'] }),
  // ---------------- Aurelis ----------------
  minor('aurelis', { id: 'aurelis-rune', name: 'Rune-Lit', description: '+15% arcane damage.', modifiers: [flat('arcaneDamage', 15)] }),
  minor('aurelis', { id: 'aurelis-focus', name: 'Focus', description: '+10% max MP.', modifiers: [pct('maxMp', 10)] }),
  minor('aurelis', { id: 'aurelis-study', name: 'Studious', rarity: 'uncommon', favorCost: 30, description: '+15% XP.', modifiers: [flat('xpGain', 15)] }),
  major('aurelis', { id: 'aurelis-mind', name: 'Bright Mind', rarity: 'uncommon', minTier: 'acknowledged', description: '+4 INT and +4 WIS.', modifiers: [flat('int', 4), flat('wis', 4)] }),
  major('aurelis', { id: 'aurelis-margins', name: 'Marginalia', rarity: 'uncommon', minTier: 'acknowledged', description: '+3% cooldown reduction.', modifiers: [flat('cooldownReduction', 3)] }),
  major('aurelis', { id: 'aurelis-library', name: 'Living Library', rarity: 'rare', minTier: 'favored', description: '+10% XP and +2 MP regeneration.', modifiers: [flat('xpGain', 10), flat('mpRegen', 2)] }),
  major('aurelis', { id: 'aurelis-arcanum', name: 'Arcanum', rarity: 'uncommon', minTier: 'acknowledged', description: 'Spells deal 15% more damage.', modifiers: [flat('damageBonus', 15, tag('Spell'))] }),
  major('aurelis', { id: 'aurelis-echo', name: 'Echoing Word', rarity: 'epic', minTier: 'devoted', description: '20% chance for spells to cast a second time for free.', modifiers: [], flags: ['spellEcho'] }),
  major('aurelis', { id: 'aurelis-page', name: 'The Thousand-Page', rarity: 'legendary', minTier: 'exalted', description: '+25% arcane damage, +10% magic attack and +5% cooldown reduction.', modifiers: [flat('arcaneDamage', 25), pct('magicAttack', 10), flat('cooldownReduction', 5)] }),
  // ---------------- Hesha ----------------
  minor('hesha', { id: 'hesha-warmth', name: 'Warmth', description: '+3 HP regeneration.', modifiers: [flat('hpRegen', 3)] }),
  minor('hesha', { id: 'hesha-care', name: 'Gentle Hands', description: '+15 healing power.', modifiers: [flat('healingPower', 15)] }),
  minor('hesha', { id: 'hesha-home', name: 'Home Cooking', rarity: 'uncommon', favorCost: 30, description: '+10% max HP.', modifiers: [pct('maxHp', 10)] }),
  major('hesha', { id: 'hesha-kindness', name: 'Kindness', rarity: 'uncommon', minTier: 'acknowledged', description: '+4 WIS and +4 FAI.', modifiers: [flat('wis', 4), flat('fai', 4)] }),
  major('hesha', { id: 'hesha-shelter', name: 'Shelter', rarity: 'uncommon', minTier: 'acknowledged', description: '+10% healing received.', modifiers: [flat('healingReceived', 10)] }),
  major('hesha', { id: 'hesha-mercy', name: 'Merciful', rarity: 'rare', minTier: 'favored', description: 'Half of your overhealing becomes a shield.', modifiers: [], flags: ['overhealShield'] }),
  major('hesha', { id: 'hesha-ember', name: 'Banked Embers', rarity: 'uncommon', minTier: 'acknowledged', description: 'Heal 5% of max HP at the start of each turn.', modifiers: [], triggers: [{ id: 'bless-hesha-ember', trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: 5, target: 'self' }] }] }),
  major('hesha', { id: 'hesha-hearth', name: 'Hearthguard', rarity: 'epic', minTier: 'devoted', description: 'The first time you fall below 30% HP each battle, heal 40%.', modifiers: [], triggers: [{ id: 'bless-hesha-hearth', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'heal', percentMaxHp: 40, target: 'self' }] }] }),
  major('hesha', { id: 'hesha-keeper', name: 'Keeper of the Hearth', rarity: 'legendary', minTier: 'exalted', description: '+25 healing power, +15% max HP, and take 8% less damage.', modifiers: [flat('healingPower', 25), pct('maxHp', 15), more('damageTaken', -8)] }),
  // ---------------- Grimvald ----------------
  minor('grimvald', { id: 'grimvald-coin', name: 'Lucky Coin', description: '+25% gold find.', modifiers: [flat('goldFind', 25)] }),
  minor('grimvald', { id: 'grimvald-ledger', name: 'Balanced Ledger', description: '+5% defense and +5% damage.', modifiers: [pct('defense', 5), flat('damageBonus', 5)] }),
  minor('grimvald', { id: 'grimvald-interest', name: 'Compound Interest', rarity: 'uncommon', favorCost: 30, description: '+15% magic find.', modifiers: [flat('magicFind', 15)] }),
  major('grimvald', { id: 'grimvald-purse', name: 'Heavy Purse', rarity: 'uncommon', minTier: 'acknowledged', description: '+20% gold find.', modifiers: [flat('goldFind', 20)] }),
  major('grimvald', { id: 'grimvald-scale', name: 'Fair Scale', rarity: 'uncommon', minTier: 'acknowledged', description: '+5 LUK.', modifiers: [flat('luk', 5)] }),
  major('grimvald', { id: 'grimvald-investment', name: 'Investment', rarity: 'rare', minTier: 'favored', description: '+10% XP and +10% gold find.', modifiers: [flat('xpGain', 10), flat('goldFind', 10)] }),
  major('grimvald', { id: 'grimvald-vault', name: 'Vault', rarity: 'uncommon', minTier: 'acknowledged', description: 'Start every battle with a shield of 15% max HP.', modifiers: [], triggers: [{ id: 'bless-grimvald-vault', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] }] }),
  major('grimvald', { id: 'grimvald-dividend', name: 'Dividend', rarity: 'epic', minTier: 'devoted', description: 'Kills grant 10 gold.', modifiers: [flat('goldFind', 10)], triggers: [{ id: 'bless-grimvald-dividend', trigger: 'onKill', effects: [{ kind: 'gold', amount: 10 }] }] }),
  major('grimvald', { id: 'grimvald-golden', name: 'The Golden Scale', rarity: 'legendary', minTier: 'exalted', description: '+40% gold find, +25% magic find and +10% damage.', modifiers: [flat('goldFind', 40), flat('magicFind', 25), flat('damageBonus', 10)] }),
];
