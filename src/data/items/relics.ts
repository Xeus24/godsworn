import type { UniqueItemDef } from '../../engine/items/types';
import { SAINT_RELIC } from '../saints';

/**
 * Relics: ancient artifacts with an active ability and lore. Each starts
 * dormant and awakens after its owner completes a deed while wearing it.
 */
export const RELICS: UniqueItemDef[] = [
  SAINT_RELIC,
  {
    id: 'shard-of-the-first-dawn', name: 'Shard of the First Dawn', rarity: 'relic', baseId: 'ancient-relic', level: 10,
    modifiers: [{ stat: 'divinePower', type: 'percent', value: 10 }, { stat: 'holyDamage', type: 'flat', value: 10 }],
    activeAbility: { name: 'First Light', description: 'Holy light sears all enemies for 120% DIV.', effects: [{ kind: 'damage', element: 'holy', scaling: { stat: 'divinePower', ratio: 1.2 }, target: 'allEnemies' }], cooldown: 5 },
    awakening: { description: 'Slay 50 undead while wearing it.', event: 'enemyKilled', enemyType: 'undead', count: 50, modifiers: [{ stat: 'holyDamage', type: 'flat', value: 20 }], effectText: '+20% holy damage' },
    effectText: ['A splinter of the sun from the morning the world began'],
    lore: 'Solenne’s priests say it was the first thing the light ever touched.',
  },
  {
    id: 'horn-of-kael', name: 'Horn of Kael', rarity: 'relic', baseId: 'ancient-relic', level: 10,
    modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 10 }],
    activeAbility: { name: 'Call to Arms', description: 'The party deals +25% damage for 3 turns.', effects: [{ kind: 'buff', id: 'call-to-arms', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25 }], target: 'allAllies' }], cooldown: 6 },
    awakening: { description: 'Win 25 battles while wearing it.', event: 'combatWon', count: 25, modifiers: [{ stat: 'critDamage', type: 'flat', value: 30 }], effectText: '+30% crit damage' },
    effectText: ['Blown before the first war, it has never sounded a retreat'],
  },
  {
    id: 'eye-of-morrath', name: 'Eye of Morrath', rarity: 'relic', baseId: 'ancient-relic', level: 15,
    modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 15 }],
    activeAbility: { name: 'The Last Look', description: 'Curse and Fear a target for 2 turns.', effects: [{ kind: 'applyStatus', status: 'curse', duration: 2, target: 'target' }, { kind: 'applyStatus', status: 'fear', duration: 2, target: 'target' }], cooldown: 4 },
    awakening: { description: 'Slay 5 bosses while wearing it.', event: 'bossKilled', count: 5, modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 25 }, { stat: 'lifesteal', type: 'flat', value: 4 }], effectText: '+25% shadow damage, +4% lifesteal' },
    effectText: ['It watches the dying, and they watch back'],
  },
  {
    id: 'gamblers-bones', name: "The Gambler's Bones", rarity: 'relic', baseId: 'ancient-relic', level: 10,
    modifiers: [{ stat: 'luk', type: 'flat', value: 8 }],
    activeAbility: { name: 'Roll the Bones', description: '+50% crit chance for 1 turn.', effects: [{ kind: 'buff', id: 'roll-the-bones', duration: 1, modifiers: [{ stat: 'critChance', type: 'flat', value: 50 }], target: 'self' }], cooldown: 5 },
    awakening: { description: 'Land 200 critical hits while wearing it.', event: 'critLanded', count: 200, modifiers: [{ stat: 'magicFind', type: 'flat', value: 30 }, { stat: 'critChance', type: 'flat', value: 5 }], effectText: '+30% magic find, +5% crit chance' },
    effectText: ['Carved from the knucklebones of a man who bet against Vex'],
  },
  {
    id: 'anvil-of-thalor', name: 'Anvil of Thalor', rarity: 'relic', baseId: 'ancient-relic', level: 15,
    modifiers: [{ stat: 'defense', type: 'percent', value: 10 }],
    activeAbility: { name: 'Forged Anew', description: 'Gain a shield worth 25% of max HP.', effects: [{ kind: 'shield', percentMaxHp: 25, target: 'self' }], cooldown: 5 },
    awakening: { description: 'Defeat 150 enemies while wearing it.', event: 'enemyKilled', count: 150, modifiers: [{ stat: 'armor', type: 'percent', value: 20 }, { stat: 'fireResist', type: 'flat', value: 20 }], effectText: '+20% armor, +20% fire resist' },
    effectText: ['A palm-sized anvil that rings when struck by any blade'],
  },
  {
    id: 'tidestone-of-nymira', name: 'Tidestone of Nymira', rarity: 'relic', baseId: 'ancient-relic', level: 20,
    modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 15 }],
    activeAbility: { name: 'Riptide', description: 'Drench all enemies (Wet) and strike them with lightning for 80% MAG.', effects: [{ kind: 'applyStatus', status: 'wet', duration: 2, target: 'allEnemies' }, { kind: 'damage', element: 'lightning', scaling: { stat: 'magicAttack', ratio: 0.8 }, target: 'allEnemies' }], cooldown: 5 },
    awakening: { description: 'Defeat 100 enemies while wearing it.', event: 'enemyKilled', count: 100, modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 25 }, { stat: 'iceDamage', type: 'flat', value: 15 }], effectText: '+25% lightning, +15% ice damage' },
    effectText: ['Always damp. Always humming like a distant storm'],
  },
  {
    id: 'hearthstone-of-hesha', name: 'Hearthstone of Hesha', rarity: 'relic', baseId: 'ancient-relic', level: 10,
    modifiers: [{ stat: 'healingPower', type: 'flat', value: 15 }],
    activeAbility: { name: 'Come Home', description: 'Heal the whole party for 30% of max HP.', effects: [{ kind: 'heal', percentMaxHp: 30, target: 'allAllies' }], cooldown: 6 },
    awakening: { description: 'Heal allies 100 times while wearing it.', event: 'healed', count: 100, modifiers: [{ stat: 'healingPower', type: 'flat', value: 25 }, { stat: 'hpRegen', type: 'flat', value: 10 }], effectText: '+25% healing power, +10 HP per turn' },
    effectText: ['Warm in your hand, like a hearth seen through a window on a cold night'],
  },
  {
    id: 'ysoldes-antler', name: "Ysolde's Antler", rarity: 'relic', baseId: 'ancient-relic', level: 15,
    modifiers: [{ stat: 'natureDamage', type: 'flat', value: 15 }, { stat: 'dex', type: 'flat', value: 5 }],
    activeAbility: { name: 'Call the Hunt', description: 'Summon a spirit stag to fight beside you.', effects: [{ kind: 'summon', summonId: 'spirit-stag' }], cooldown: 7 },
    awakening: { description: 'Hunt 75 beasts while wearing it.', event: 'enemyKilled', enemyType: 'beast', count: 75, modifiers: [{ stat: 'natureDamage', type: 'flat', value: 25 }, { stat: 'speed', type: 'flat', value: 4 }], effectText: '+25% nature damage, +4 speed' },
    effectText: ['Shed by the white stag that only the worthy ever see'],
  },
  {
    id: 'grimvalds-ledger', name: "Grimvald's Ledger", rarity: 'relic', baseId: 'ancient-relic', level: 10,
    modifiers: [{ stat: 'goldFind', type: 'flat', value: 30 }],
    activeAbility: { name: 'Collect the Debt', description: 'Weaken the target, make it Vulnerable, and pocket 25 gold.', effects: [{ kind: 'applyStatus', status: 'weaken', duration: 3, target: 'target' }, { kind: 'applyStatus', status: 'vulnerable', duration: 3, target: 'target' }, { kind: 'gold', amount: 25 }], cooldown: 5 },
    awakening: { description: 'Pray at shrines 30 times while carrying it.', event: 'prayed', count: 30, modifiers: [{ stat: 'goldFind', type: 'flat', value: 40 }, { stat: 'magicFind', type: 'flat', value: 15 }], effectText: '+40% gold find, +15% magic find' },
    effectText: ['Every debt ever owed, in very small handwriting'],
  },
  {
    id: 'page-of-the-thousand', name: 'The Thousandth Page', rarity: 'relic', baseId: 'ancient-relic', level: 20,
    modifiers: [{ stat: 'magicAttack', type: 'percent', value: 10 }, { stat: 'cooldownReduction', type: 'flat', value: 5 }],
    activeAbility: { name: 'Turn the Page', description: 'Reduce all cooldowns by 2 turns and restore 50 MP.', effects: [{ kind: 'reduceCooldowns', turns: 2 }, { kind: 'restoreMp', amount: 50 }], cooldown: 6 },
    awakening: { description: 'Win 40 battles while wearing it.', event: 'combatWon', count: 40, modifiers: [{ stat: 'cooldownReduction', type: 'flat', value: 8 }, { stat: 'xpGain', type: 'flat', value: 10 }], effectText: '+8% cooldown reduction, +10% XP' },
    effectText: ['Torn from Aurelis’s own book. The words rearrange when you are not looking'],
  },
];
