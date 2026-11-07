import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const A = ['Attack', 'Ranged', 'Arcane'] as const;
const selfHit = (n: number) => ({ kind: 'damage' as const, element: 'physical' as const, scaling: { stat: 'maxHp' as const, ratio: n / 100 }, target: 'self' as const });
/** The Fatedealer draws, holds and bets. Fortune is the table's stake; risky plays can also cost HP. */
export const FATEDEALER_SKILLS = [
  act('draw-card', 'Draw a Card', 'Draw: 130% MAG arcane damage and a boon of +15% damage and +12% crit for 2 turns. Gain 14 Fortune.', { el: 'arcane', to: 'enemy', tags: [...A, 'Builder'], dmg: ['m', 1.3, 0.1], gen: ['fortune', 14], fx: [buff('card-damage', 2, [{ stat: 'damageBonus', type: 'flat', value: 15 }]), buff('card-crit', 2, [{ stat: 'critChance', type: 'flat', value: 12 }])] }),
  act('hold-the-card', 'Hold the Card', 'Hold: +25% crit chance and +15% accuracy for 3 turns. Gain 10 Fortune.', { el: 'arcane', to: 'self', tags: ['Buff'], cd: 3, fx: [buff('held-card', 3, [{ stat: 'critChance', type: 'flat', value: 25 }, { stat: 'accuracy', type: 'flat', value: 15 }]), gain('fortune', 10)] }),
  act('all-in', 'All In', 'Spend 30 Fortune and pay 10% HP: 380% MAG arcane damage that always crits.', { el: 'arcane', to: 'enemy', tags: [...A], cd: 3, res: ['fortune', 30], dmg: ['m', 3.8, 0.25], crit: true, fx: [selfHit(10)] }),
  act('double-down', 'Double Down', 'Spend 20 Fortune: 150% MAG twice at the same foe.', { el: 'arcane', to: 'enemy', tags: [...A], cd: 2, res: ['fortune', 20], dmg: ['m', 1.5, 0.1, 2] }),
  act('read-the-table', 'Read the Table', 'Spend 15 Fortune: every enemy is Marked and Slowed for 2 turns.', { el: 'arcane', to: 'allEnemies', tags: ['Debuff', 'Arcane', 'Mark', 'AoE'], cd: 3, res: ['fortune', 15], fx: [status('marked', 2, { target: 'allEnemies' }), status('slow', 2, { target: 'allEnemies' })] }),
  act('stack-the-deck', 'Stack the Deck', 'Spend 20 Fortune: you gain Haste for 3 turns and +15% crit.', { el: 'arcane', to: 'self', tags: ['Buff', 'Arcane'], cd: 4, res: ['fortune', 20], fx: [status('haste', 3, { target: 'self' }), buff('stacked', 3, [{ stat: 'critChance', type: 'flat', value: 15 }])] }),
  act('fortune-teller', 'Fortune’s Glimpse', 'Spend 15 Fortune: see what is coming: +20% dodge for 3 turns and a 10% shield.', { el: 'arcane', to: 'self', tags: ['Buff', 'Arcane', 'Defensive'], cd: 3, res: ['fortune', 15], fx: [buff('glimpse', 3, [{ stat: 'dodge', type: 'flat', value: 20 }]), shieldPct(10)] }),
  act('delay-the-turn', 'Delay the Turn', 'Spend 20 Fortune: 110% MAG, and the foe’s next turn is pushed back.', { el: 'arcane', to: 'enemy', tags: [...A, 'Time'], cd: 3, res: ['fortune', 20], dmg: ['m', 1.1, 0.08], fx: [{ kind: 'timeShift', turns: 1, target: 'target' }] }),
  act('palm-flick', 'Sleight of Hand', 'A quick palm: 120% MAG and you gain Stealth for a turn. Gain 10 Fortune.', { el: 'arcane', to: 'enemy', tags: [...A, 'Builder'], cd: 2, dmg: ['m', 1.2, 0.09], gen: ['fortune', 10], fx: [status('stealth', 1, { target: 'self' })] }),
  act('palmed-ace', 'Palmed Ace', 'Spend 25 Fortune: 260% MAG; the foe is Confused for 2 turns.', { el: 'arcane', to: 'enemy', tags: [...A], cd: 3, res: ['fortune', 25], dmg: ['m', 2.6, 0.2], fx: [status('confuse', 2)] }),
  spec('high-stakes', 'High Stakes', 'Spend 30 Fortune and pay 12% HP: 400% MAG that always crits.', { el: 'arcane', to: 'enemy', tags: [...A], cd: 3, res: ['fortune', 30], dmg: ['m', 4.0, 0.25], crit: true, fx: [selfHit(12)] }),
  spec('foretold-ending', 'Foretold Ending', 'Spend 25 Fortune: 220% MAG; the foe’s next two turns are pushed back.', { el: 'arcane', to: 'enemy', tags: [...A, 'Time'], cd: 4, res: ['fortune', 25], dmg: ['m', 2.2, 0.16], fx: [status('slow', 3), { kind: 'timeShift', turns: 2, target: 'target' }] }),
  spec('marked-deck', 'Marked Deck', 'Spend 25 Fortune: three cards of 130% MAG at random enemies, each Confusing or Cursing.', { el: 'arcane', to: 'randomEnemies', tags: [...A, 'AoE'], cd: 3, res: ['fortune', 25], dmg: ['m', 1.3, 0.1, 3], fx: [status('confuse', 2, { chance: 45 }), status('curse', 2, { chance: 45 })] }),
  ult('house-always-wins', 'The House Always Wins', 'The odds were never yours: 340% MAG to every enemy, all Marked; Fortune fills.', { el: 'arcane', to: 'allEnemies', tags: [...A, 'AoE'], dmg: ['m', 3.4, 0], fx: [status('marked', 3, { target: 'allEnemies' }), gain('fortune', 100)] }),
  ult('last-hand', 'The Last Hand', 'One card: 450% MAG to a single foe that cannot miss, and you heal 15%.', { el: 'arcane', to: 'enemy', tags: [...A], dmg: ['m', 4.5, 0], crit: true, fx: [healPct(15)] }),
  ult('read-the-end', 'Read the End', 'You turn the last page: 300% MAG to every enemy, all Slowed and Cursed.', { el: 'arcane', to: 'allEnemies', tags: [...A, 'AoE', 'Time'], dmg: ['m', 3.0, 0], fx: [status('slow', 3, { target: 'allEnemies' }), status('curse', 3, { target: 'allEnemies' })] }),
  ult('fatedealers-deck', 'The Fatedealer’s Deck', 'The whole deck falls: 320% MAG to every enemy, a Held Card boon and Fortune fills.', { el: 'arcane', to: 'allEnemies', tags: [...A, 'AoE'], dmg: ['m', 3.2, 0], fx: [gain('fortune', 100), buff('whole-deck', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }, { stat: 'critChance', type: 'flat', value: 15 }])] }),
];
const SK = FATEDEALER_SKILLS;
export const FATEDEALER_TREE = liteTree('fatedealer', SK, [
  { id: 'draw', name: 'The Draw', color: '#c8a838', desc: 'Everything is a card until it is a consequence.', a: 'draw-card', b: 'hold-the-card', stats: ['magicAttack', 'critChance', 'resourceGain', 'luk'], names: ['Quick Shuffle', 'Fine Cut', 'Steady Hands', 'Lucky Streak', 'Good Draw', 'Held Breath', 'Counted Cards', 'Long Odds', 'A Card for Every Occasion', 'Master of the Deck'] },
  { id: 'stakes', name: 'The Stakes', color: '#d84a4a', desc: 'Never bet what you cannot lose. Always bet what you can.', a: 'all-in', b: 'double-down', stats: ['damageBonus', 'magicAttack', 'accuracy', 'int'], names: ['Bold Bet', 'Cold Nerve', 'Poker Face', 'Raised Eyebrow', 'High Roller', 'Pot Odds', 'Ante Up', 'Slow Play', 'Nothing Left to Lose', 'The Gambler’s Edge'] },
  { id: 'oracle', name: 'The Oracle', color: '#7a5ac8', desc: 'The future is a well-marked deck.', a: 'read-the-table', b: 'delay-the-turn', stats: ['statusChance', 'cooldownReduction', 'wis', 'speed'], names: ['Tea Leaves', 'Crystal Glass', 'Spreads', 'Quiet Hour', 'Read of the Room', 'Turning Card', 'Slow Hand', 'Twice-Told', 'The Future Was Marked', 'Oracle of the Table'] },
  { id: 'trickster', name: 'The Trick', color: '#38a888', desc: 'It was always in the other hand.', a: 'palm-flick', b: 'palmed-ace', stats: ['dodge', 'critChance', 'speed', 'dex'], names: ['Nimble Fingers', 'Quick Draw', 'Cold Smile', 'Loose Sleeve', 'Marked Card', 'Hidden Ace', 'Wrong Hand', 'Off the Bottom', 'Never in the First Hand', 'Trickster’s Grin'] },
  { id: 'fates', name: 'The Fates', color: '#a89868', desc: 'A card for every road.', a: 'stack-the-deck', b: 'fortune-teller', stats: ['luk', 'maxHp', 'dodge', 'magicResist'], names: ['Fair Warning', 'Soft Landing', 'Fine Print', 'Good Omen', 'Stacked Odds', 'Clear Glimpse', 'Quiet Table', 'Reserved Seat', 'The Table Is Yours', 'Fate-Dealer'] },
]);
export const FATEDEALER_SPECS = liteSpecs(SK, [
  { id: 'gambit', name: 'Gambit', color: '#d84a4a', desc: 'Everything on one card.', skill: 'high-stakes', ult: 'last-hand', stats: ['damageBonus', 'critChance', 'magicAttack'], names: ['Raise', 'Bluff', 'Cold Sweat', 'High Card', 'Last Chip', 'Burning Bridge', 'Stare Down', 'Gambit Ascendant'] },
  { id: 'oracle2', name: 'Oracle', color: '#7a5ac8', desc: 'You have already seen how this ends. It was fine.', skill: 'foretold-ending', ult: 'read-the-end', stats: ['cooldownReduction', 'statusChance', 'wis'], names: ['Early Hour', 'Slow Count', 'Reading Light', 'Turned Card', 'Held Fate', 'Clear Omen', 'Seen It', 'Oracle Ascendant'] },
  { id: 'trickster2', name: 'Trickster', color: '#d84aa8', desc: 'The Vex have been very good to you.', skill: 'marked-deck', ult: 'house-always-wins', stats: ['luk', 'critChance', 'statusChance'], names: ['Odd Cards', 'Loose Edge', 'Strange Hand', 'Vex Whisper', 'Wild Card', 'Joker', 'House Rules', 'Trickster Ascendant'] },
]);

export const FATEDEALER: GreaterClass = {
  def: {
    id: 'fatedealer', name: 'Fatedealer', tagline: 'Every hand is a prophecy. Most of them lose.',
    description: 'A card-caster who draws, holds and bets in battle. Cards use their own combat numbers, separate from the Pantheon Cards collection.',
    playstyle: 'Draw to build Fortune and a random boon, hold for crit, then bet it: All In and High Stakes pay in HP for huge hits. Oracle bends the order of turns, Trickster cheats.',
    role: 'Caster / gambler', difficulty: 3, color: '#c8a838',
    mechanic: { name: 'Fortune and the Deck', description: 'Draws build Fortune. Bets spend it, some for HP, all for huge damage. Cards are battle-only and never change your Pantheon Cards collection.' },
    trait: traitOf('Lucky Hands', [['luk', 4]], '+4 LUK', 'magicAttack', 1.15),
    resource: 'fortune',
    baseStats: { str: 3, dex: 6, int: 6, vit: 5, wis: 4, luk: 8, fai: 2, cha: 8 },
    growth: { str: 0.3, dex: 0.9, int: 1.0, vit: 0.8, wis: 0.5, luk: 1.3, fai: 0.2, cha: 0.8 },
    weapons: ['wand', 'dagger', 'rapier', 'throwing', 'orb'], armor: ['cloth', 'leather'],
    startingSkills: ['draw-card', 'all-in'], ultimate: 'fatedealers-deck', defaultRow: 'back',
  },
  resource: { id: 'fortune', name: 'Fortune', max: 100, start: 15, decayPerTurn: 1, color: '#e8c838', description: 'Draws build it. Bets and reads spend it.', gains: { onHitDealt: 2 } },
  skills: SK, tree: FATEDEALER_TREE, specs: FATEDEALER_SPECS,
  mentor: mentorOf('mentor-fatedealer', 'Madame Oriel Kast', 'Has never lost a hand she did not intend to. Has intended to, twice.', 'Thrown Card', ['#a88838', '#e8d8a8'], ['mentor-vanish', 'dirty-stab'], 'arcane'),
  trial: { quote: 'Cut the deck. No, not that one. The one I did not set out.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Land 10 critical hits', 10, { event: 'crit' }), line: 'Land ten critical hits. The deck does not give them. You do.' },
  mentorNpc: { name: 'Madame Oriel Kast', race: 'elf', portrait: 1, color: '#a88838', greeting: '“A seat. A stake. A small tell about your left eye. I will wait.”' },
  kit: kitOf('wand-t1', 'cloth-chest-t1', 'cloth-boots-t1'),
  art: emblem('diamond', '#7a5a18', '#e8c838'),
  questline: ['morrath', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['A Seat at the Table', 'The Marked Deck', 'The Warren Game', 'A Hand Against the House', 'The Last Hand'], ['“Morrath keeps the ledger of every bet. Go to the shrine and place your first.”', '“A deck in the market is marked. Find the mark, and then find who marked it.”', '“The goblins are playing for something in the warren. Sit in.”', '“A house wins every hand but one. Play it.”', '“Every Fatedealer is dealt one hand that matters. Come and see yours.”'], '“What do you hold?”', '“Nothing, and that is the hand.”', '“A reason to fold.”', '“A little more than I have admitted.”', 'Keeper of the Last Hand'],
  legendary: { id: 'deck-of-no-return', name: 'Deck of No Return', rarity: 'legendary', baseId: 'wand-t4', level: 25, requirements: { classes: ['fatedealer'] }, modifiers: [{ stat: 'magicAttack', type: 'percent', value: 12 }, { stat: 'critChance', type: 'flat', value: 6 }], triggers: [trg('deck-draw', 'onCrit', [gain('fortune', 4)])], effectText: ['Critical hits give 4 Fortune.'], lore: 'Fifty-two cards, and the fifty-third is yours.' },
};
