import { GREATER_PANTHEON } from './godsGreater';
import type { FavorDeed, InterventionDef, OfferingPrefs, PrayerDef } from '../engine/gods/types';

/**
 * How each god of the pantheon relates to the player: what they like and
 * dislike, who they quarrel with, what offerings they value, what they do
 * when prayed to in battle and how they intervene. The Nameless One has no
 * entry: it is discovered in NG+ (Phase 14).
 */
export interface PantheonDef {
  id: string;
  alignment: string;
  personality: string;
  rivals: string[];
  allies: string[];
  likes: FavorDeed[];
  dislikes: FavorDeed[];
  offerings: OfferingPrefs;
  prayer: PrayerDef;
  intervention: InterventionDef;
  shrine: string;
  temple: string;
}

const BASE_PANTHEON: PantheonDef[] = [
  {
    id: 'solenne', alignment: 'Lawful Good', personality: 'Stern, fair and impossible to fool.', rivals: ['morrath'], allies: ['hesha'],
    shrine: 'Sunstone Shrine', temple: 'Cathedral of the Open Eye',
    likes: [
      { event: 'kill', enemyType: 'undead', amount: 3, text: 'Smiting the undead' },
      { event: 'kill', enemyType: 'cultist', amount: 3, text: 'Ending cultists' },
      { event: 'skillTag', tag: 'Holy', amount: 0.5, cap: 3, text: 'Wielding holy light' },
      { event: 'battleWon', timeOfDay: 'day', amount: 1, text: 'Victories under the sun' },
      { event: 'questDone', amount: 4, text: 'Helping people in need' },
    ],
    dislikes: [
      { event: 'summon', amount: -2, cap: -6, text: 'Raising the dead' },
      { event: 'battleFled', amount: -2, text: 'Fleeing from evil' },
    ],
    offerings: { goldPerFavor: 40, itemValuePerFavor: 20, categories: { weapon: 1.5, armor: 1.5 }, text: 'Values arms and armor for her crusaders.' },
    prayer: { name: 'Sunburst', description: 'Holy light sears every enemy (60% Divine Power).', cost: 15, effects: [{ kind: 'damage', element: 'holy', scaling: { stat: 'divinePower', ratio: 0.6 }, target: 'allEnemies' }] },
    intervention: { name: 'The Unclouded Eye', text: 'Solenne’s gaze burns every enemy as she raises you.', effects: [{ kind: 'damage', element: 'holy', scaling: { stat: 'divinePower', ratio: 2 }, target: 'allEnemies' }] },
  },
  {
    id: 'morrath', alignment: 'True Neutral', personality: 'Patient, quiet, and not cruel: endings are simply owed.', rivals: ['solenne'], allies: ['vex'],
    shrine: 'Raven Cairn', temple: 'House of the Last Door',
    likes: [
      { event: 'kill', tiers: ['elite', 'champion', 'miniboss', 'boss', 'worldBoss'], amount: 5, text: 'Felling mighty foes' },
      { event: 'summon', amount: 2, cap: 6, text: 'Raising the dead' },
      { event: 'skillTag', tag: 'Shadow', amount: 0.5, cap: 3, text: 'Shadow arts' },
      { event: 'battleWon', timeOfDay: 'night', amount: 1, text: 'Victories by night' },
    ],
    dislikes: [
      { event: 'heal', amount: -0.25, cap: -3, text: 'Cheating death with healing' },
      { event: 'skillTag', tag: 'Holy', amount: -0.5, cap: -3, text: 'Holy light' },
    ],
    offerings: { goldPerFavor: 50, itemValuePerFavor: 15, categories: { curiosity: 3, gem: 1.5 }, text: 'Collects the strange things the dead leave behind.' },
    prayer: { name: 'Death’s Toll', description: 'Curse and Weaken every enemy for 2 turns.', cost: 15, effects: [{ kind: 'applyStatus', status: 'curse', duration: 2, target: 'allEnemies' }, { kind: 'applyStatus', status: 'weaken', duration: 2, target: 'allEnemies' }] },
    intervention: { name: 'Not Yet', text: 'Morrath turns you away from the Last Door, and the shadows take payment from your foes.', effects: [{ kind: 'damage', element: 'shadow', scaling: { stat: 'divinePower', ratio: 1.5 }, target: 'allEnemies' }, { kind: 'applyStatus', status: 'fear', duration: 1, target: 'allEnemies' }] },
  },
  {
    id: 'kael', alignment: 'Chaotic Neutral', personality: 'Loud, proud and only impressed by courage.', rivals: ['hesha'], allies: ['thalor'],
    shrine: 'Banner Stone', temple: 'Hall of the Red Banner',
    likes: [
      { event: 'battleWon', amount: 2, text: 'Winning battles' },
      { event: 'kill', tiers: ['elite', 'champion', 'miniboss', 'boss', 'worldBoss'], amount: 4, text: 'Defeating champions' },
      { event: 'crit', amount: 0.5, cap: 3, text: 'Mighty blows' },
    ],
    dislikes: [
      { event: 'battleFled', amount: -5, text: 'Cowardice' },
      { event: 'battleLost', amount: -3, text: 'Defeat' },
    ],
    offerings: { goldPerFavor: 50, itemValuePerFavor: 15, categories: { weapon: 2.5 }, text: 'Loves good weapons above all things.' },
    prayer: { name: 'Battle Cry', description: '+25% damage for you for 3 turns, and you gain Haste.', cost: 15, effects: [{ kind: 'buff', id: 'kael-battle-cry', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25 }], target: 'self' }, { kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }] },
    intervention: { name: 'Not Like This', text: 'Kael refuses you a coward’s death: you rise in a red rage.', effects: [{ kind: 'applyStatus', status: 'berserk', duration: 3, target: 'self' }, { kind: 'buff', id: 'kael-red-rage', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 50 }], target: 'self' }] },
  },
  {
    id: 'ysolde', alignment: 'Neutral Good', personality: 'Wild and generous, but she never forgives waste.', rivals: ['thalor'], allies: ['nymira'],
    shrine: 'Antler Grove', temple: 'The Green Hour Lodge',
    likes: [
      { event: 'kill', enemyType: 'beast', amount: 2, text: 'Hunting beasts' },
      { event: 'skillTag', tag: 'Nature', amount: 0.5, cap: 3, text: 'Nature magic' },
      { event: 'skillTag', tag: 'Ranged', amount: 0.25, cap: 2, text: 'The bow' },
    ],
    dislikes: [
      { event: 'salvage', amount: -1, text: 'Wasteful salvaging' },
      { event: 'skillTag', tag: 'Fire', amount: -0.25, cap: -2, text: 'Wildfire' },
    ],
    offerings: { goldPerFavor: 60, itemValuePerFavor: 10, materialKinds: { herb: 3, leather: 3 }, categories: { consumable: 1.5 }, text: 'Accepts herbs, hides and food with joy.' },
    prayer: { name: 'Huntress’s Mark', description: 'Mark every enemy Vulnerable and Slow them for 2 turns.', cost: 15, effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2, target: 'allEnemies' }, { kind: 'applyStatus', status: 'slow', duration: 2, target: 'allEnemies' }] },
    intervention: { name: 'The Green Hour', text: 'Vines bind your foes as the forest closes your wounds.', effects: [{ kind: 'applyStatus', status: 'regen', duration: 3, target: 'self' }, { kind: 'applyStatus', status: 'stun', duration: 1, target: 'allEnemies' }] },
  },
  {
    id: 'vex', alignment: 'Chaotic Neutral', personality: 'Laughs at everything, especially you.', rivals: ['grimvald'], allies: ['morrath'],
    shrine: 'Crooked Coin', temple: 'The House Always Wins',
    likes: [
      { event: 'crit', amount: 1, cap: 4, text: 'Lucky strikes' },
      { event: 'goldStolen', amount: 2, cap: 6, text: 'Stealing' },
      { event: 'identify', amount: 1, text: 'Uncovering the unknown' },
      { event: 'gamble', amount: 3, text: 'Gambling' },
    ],
    dislikes: [
      { event: 'rest', amount: -2, text: 'Boring caution' },
      { event: 'battleLost', amount: -1, text: 'Losing (badly)' },
    ],
    offerings: { goldPerFavor: 25, itemValuePerFavor: 25, categories: { gem: 2, rune: 2 }, text: 'Will take anything shiny. Especially gold.' },
    prayer: { name: 'Loaded Dice', description: '+30 crit chance and +15 dodge for 3 turns.', cost: 15, effects: [{ kind: 'buff', id: 'vex-loaded-dice', duration: 3, modifiers: [{ stat: 'critChance', type: 'flat', value: 30 }, { stat: 'dodge', type: 'flat', value: 15 }], target: 'self' }] },
    intervention: { name: 'Double or Nothing', text: 'Vex flips a coin for your life. It lands on its edge.', effects: [{ kind: 'applyStatus', status: 'stealth', duration: 2, target: 'self' }, { kind: 'gold', amount: 50 }] },
  },
  {
    id: 'thalor', alignment: 'Lawful Neutral', personality: 'Gruff and practical. Respects good work.', rivals: ['ysolde'], allies: ['kael'],
    shrine: 'Anvil Shrine', temple: 'The Great Forge',
    likes: [
      { event: 'socket', amount: 4, text: 'Improving your gear' },
      { event: 'craft', amount: 2, cap: 6, text: 'Crafting' },
      { event: 'salvage', amount: 1, text: 'Reclaiming metal' },
      { event: 'skillTag', tag: 'Fire', amount: 0.5, cap: 3, text: 'Fire' },
    ],
    dislikes: [
      { event: 'itemBroken', amount: -3, text: 'Neglecting your gear' },
      { event: 'skillTag', tag: 'Ice', amount: -0.25, cap: -2, text: 'Cold that cracks steel' },
    ],
    offerings: { goldPerFavor: 50, itemValuePerFavor: 10, materialKinds: { ore: 3, wood: 1.5 }, categories: { armor: 1.5 }, text: 'Loves rare ores and well-made armor.' },
    prayer: { name: 'Forge-Blessed', description: 'A shield of 20% max HP and +30% defense for 3 turns.', cost: 15, effects: [{ kind: 'shield', percentMaxHp: 20, target: 'self' }, { kind: 'buff', id: 'thalor-forge-blessed', duration: 3, modifiers: [{ stat: 'defense', type: 'percent', value: 30 }], target: 'self' }] },
    intervention: { name: 'Tempered', text: 'Thalor reforges you in the heat of battle.', effects: [{ kind: 'shield', percentMaxHp: 40, target: 'self' }, { kind: 'damage', element: 'fire', scaling: { stat: 'divinePower', ratio: 1.5 }, target: 'allEnemies' }] },
  },
  {
    id: 'nymira', alignment: 'Chaotic Good', personality: 'Moody as the sea and twice as deep.', rivals: ['aurelis'], allies: ['ysolde'],
    shrine: 'Tide Pool Shrine', temple: 'The Storm Lighthouse',
    likes: [
      { event: 'kill', elements: ['lightning', 'ice'], amount: 2, text: 'Storm-struck kills' },
      { event: 'skillTag', tag: 'Lightning', amount: 0.5, cap: 3, text: 'Lightning' },
      { event: 'skillTag', tag: 'Ice', amount: 0.5, cap: 3, text: 'Frost' },
    ],
    dislikes: [
      { event: 'skillTag', tag: 'Fire', amount: -0.5, cap: -3, text: 'Fire' },
      { event: 'rest', amount: -1, text: 'Staying ashore' },
    ],
    offerings: { goldPerFavor: 50, itemValuePerFavor: 15, categories: { gem: 2, consumable: 1.25 }, text: 'Pearls, gems and things from the deep.' },
    prayer: { name: 'Call the Storm', description: 'Lightning strikes every enemy (50% Divine Power) and soaks them Wet.', cost: 15, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'divinePower', ratio: 0.5 }, target: 'allEnemies' }, { kind: 'applyStatus', status: 'wet', duration: 2, target: 'allEnemies' }] },
    intervention: { name: 'The Tide Turns', text: 'A wave of cold water lifts you to your feet and drags your foes under.', effects: [{ kind: 'applyStatus', status: 'freeze', duration: 1, target: 'allEnemies' }, { kind: 'restoreMp', amount: 50, target: 'self' }] },
  },
  {
    id: 'aurelis', alignment: 'Lawful Neutral', personality: 'Curious, precise, a little absent-minded.', rivals: ['nymira'], allies: ['grimvald'],
    shrine: 'Lectern Shrine', temple: 'The Thousand-Page Library',
    likes: [
      { event: 'bookRead', amount: 10, text: 'Reading skillbooks' },
      { event: 'identify', amount: 2, text: 'Uncovering secrets' },
      { event: 'skillTag', tag: 'Arcane', amount: 0.5, cap: 3, text: 'Arcane study' },
    ],
    dislikes: [
      { event: 'battleFled', amount: -1, text: 'Abandoning an experiment' },
      { event: 'salvage', amount: -0.5, text: 'Destroying craftsmanship' },
    ],
    offerings: { goldPerFavor: 60, itemValuePerFavor: 10, categories: { book: 3, curiosity: 2 }, text: 'Books, scrolls and curiosities.' },
    prayer: { name: 'Arcane Insight', description: 'Restore 40 MP and reduce your cooldowns by 2.', cost: 15, effects: [{ kind: 'restoreMp', amount: 40, target: 'self' }, { kind: 'reduceCooldowns', turns: 2 }] },
    intervention: { name: 'Footnote', text: 'Aurelis amends the record: you did not die after all.', effects: [{ kind: 'restoreMp', amount: 100, target: 'self' }, { kind: 'reduceCooldowns', turns: 5 }] },
  },
  {
    id: 'hesha', alignment: 'Neutral Good', personality: 'Warm, tired and endlessly kind.', rivals: ['kael'], allies: ['solenne'],
    shrine: 'Hearthstone', temple: 'The Ever-Lit Hall',
    likes: [
      { event: 'heal', amount: 0.5, cap: 4, text: 'Healing' },
      { event: 'rest', amount: 3, text: 'Resting and caring for yourself' },
      { event: 'skillTag', tag: 'Heal', amount: 0.5, cap: 3, text: 'Healing magic' },
      { event: 'mercy', amount: 10, noEdict: true, text: 'Sparing a beaten foe' },
    ],
    dislikes: [
      { event: 'kill', enemyType: 'humanoid', amount: -0.5, cap: -3, text: 'Killing people' },
      { event: 'summon', amount: -1, cap: -3, text: 'Disturbing the dead' },
    ],
    offerings: { goldPerFavor: 40, itemValuePerFavor: 15, categories: { consumable: 2.5 }, text: 'Food, potions and gold for the poor.' },
    prayer: { name: 'Hearth’s Warmth', description: 'Heal 30% of max HP and cure Poison, Bleed and Burn.', cost: 15, effects: [{ kind: 'heal', percentMaxHp: 30, target: 'self' }, { kind: 'removeStatus', status: 'poison', target: 'self' }, { kind: 'removeStatus', status: 'bleed', target: 'self' }, { kind: 'removeStatus', status: 'burn', target: 'self' }] },
    intervention: { name: 'Mercy', text: 'Hesha holds you close until the pain passes.', effects: [{ kind: 'heal', percentMaxHp: 100, target: 'self' }, { kind: 'applyStatus', status: 'divine-protection', duration: 2, target: 'self' }] },
  },
  {
    id: 'grimvald', alignment: 'Lawful Neutral', personality: 'Shrewd and polite. Everything has a price.', rivals: ['vex'], allies: ['aurelis'],
    shrine: 'Counting Stone', temple: 'The Golden Exchange',
    likes: [
      { event: 'goldLooted', amount: 1, cap: 10, text: 'Earning gold (per 100)' },
      { event: 'battleWon', amount: 0.5, text: 'Profitable work' },
    ],
    dislikes: [
      { event: 'battleLost', amount: -3, text: 'Losing money' },
      { event: 'goldStolen', amount: -1, cap: -3, text: 'Theft' },
    ],
    offerings: { goldPerFavor: 15, itemValuePerFavor: 20, categories: { gem: 1.5 }, text: 'Gold. Honest, countable gold.' },
    prayer: { name: 'Tithe', description: 'Shield 25% of max HP and gain +20% gold find for this battle.', cost: 15, effects: [{ kind: 'shield', percentMaxHp: 25, target: 'self' }, { kind: 'buff', id: 'grimvald-tithe', duration: 99, modifiers: [{ stat: 'goldFind', type: 'flat', value: 20 }], target: 'self' }] },
    intervention: { name: 'Debt Forgiven', text: 'Grimvald writes off your death as a bad debt.', effects: [{ kind: 'shield', percentMaxHp: 50, target: 'self' }, { kind: 'gold', amount: 100 }] },
  },
];

/** The new gods name their rivals and allies; the old gods return the favor so every link is mutual. */
export const PANTHEON: PantheonDef[] = (() => {
  const all = [...BASE_PANTHEON, ...GREATER_PANTHEON];
  for (const g of GREATER_PANTHEON) {
    for (const r of g.rivals) {
      const other = all.find((p) => p.id === r);
      if (other && !other.rivals.includes(g.id)) other.rivals.push(g.id);
    }
    for (const a of g.allies) {
      const other = all.find((p) => p.id === a);
      if (other && !other.allies.includes(g.id)) other.allies.push(g.id);
    }
  }
  return all;
})();
