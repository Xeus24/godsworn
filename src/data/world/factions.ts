import type { FactionDef, FactionRank } from '../../engine/world/types';
import { flat, pct } from '../trees/builder';

const ranks = (perks: [FactionRank['modifiers'], FactionRank['modifiers'], FactionRank['modifiers'], FactionRank['modifiers']]): FactionRank[] => [
  { name: 'Stranger', rep: 0, modifiers: [] },
  { name: 'Associate', rep: 100, modifiers: [] },
  { name: 'Member', rep: 300, modifiers: perks[0] },
  { name: 'Veteran', rep: 700, modifiers: perks[1] },
  { name: 'Champion', rep: 1500, modifiers: perks[2] },
  { name: 'Legend', rep: 3000, modifiers: perks[3] },
];

/**
 * Seven factions (the Lantern Concord and the Cog & Anvil Union joined in phase 18). Reputation grows from the deeds they like (and shrinks
 * from those they dislike); their rivals lose half of it. Gaining
 * reputation also earns their god a little favor.
 */
export const FACTIONS: FactionDef[] = [
  {
    id: 'order-of-dawn', name: 'Order of the Dawn', hall: 'brightwater', god: 'solenne', rivals: [],
    description: 'Knights and priests sworn to hunt the undead and the cults that raise them.',
    likes: [{ event: 'kill', enemyType: 'undead', amount: 3, text: 'Slaying the undead' }, { event: 'kill', enemyType: 'cultist', amount: 4, text: 'Ending cultists' }, { event: 'skillTag', tag: 'Holy', amount: 0.5, cap: 3, text: 'Holy magic' }],
    dislikes: [{ event: 'summon', amount: -2, cap: -6, text: 'Raising the dead' }],
    ranks: ranks([[flat('holyDamage', 5)], [flat('holyDamage', 10), pct('maxHp', 3)], [flat('holyDamage', 15), pct('maxHp', 5)], [flat('holyDamage', 20), pct('maxHp', 8), flat('statusResist', 10)]]),
  },
  {
    id: 'wardens', name: 'Wardens of the Wild', hall: 'thornwick', god: 'ysolde', rivals: [],
    description: 'Rangers who keep the wild places wild, and the monsters in them in check.',
    likes: [{ event: 'kill', enemyType: 'beast', amount: 2, text: 'Culling beasts' }, { event: 'kill', enemyType: 'plant', amount: 2, text: 'Felling blighted trees' }, { event: 'skillTag', tag: 'Nature', amount: 0.5, cap: 3, text: 'Nature magic' }],
    dislikes: [{ event: 'salvage', amount: -1, text: 'Waste' }],
    ranks: ranks([[flat('natureDamage', 5)], [flat('natureDamage', 10), flat('dodge', 2)], [flat('natureDamage', 15), flat('dodge', 4)], [flat('natureDamage', 20), flat('dodge', 6), flat('hpRegen', 5)]]),
  },
  {
    id: 'iron-legion', name: 'The Iron Legion', hall: 'sandhaven', god: 'kael', rivals: ['thieves-den'],
    description: 'Mercenaries with a code: get paid, win, never run.',
    likes: [{ event: 'battleWon', amount: 1, text: 'Winning fights' }, { event: 'kill', enemyType: 'bandit', amount: 3, text: 'Hunting bandits' }, { event: 'kill', tiers: ['elite', 'champion', 'miniboss', 'boss', 'worldBoss'], amount: 4, text: 'Beating champions' }],
    dislikes: [{ event: 'battleFled', amount: -4, text: 'Running' }],
    ranks: ranks([[pct('defense', 3)], [pct('defense', 6), flat('critDamage', 5)], [pct('defense', 9), flat('critDamage', 10)], [pct('defense', 12), flat('critDamage', 15), flat('damageBonus', 5)]]),
  },
  {
    id: 'mages-guild', name: 'The Mages’ Guild', hall: 'frosthold', god: 'aurelis', rivals: [],
    description: 'Scholars of the arcane, collectors of books, settlers of arguments with fireballs.',
    likes: [{ event: 'skillTag', tag: 'Spell', amount: 0.5, cap: 4, text: 'Spellcasting' }, { event: 'bookRead', amount: 15, text: 'Reading skillbooks' }, { event: 'identify', amount: 2, text: 'Identifying artifacts' }],
    dislikes: [{ event: 'salvage', amount: -0.5, text: 'Destroying enchanted gear' }],
    ranks: ranks([[flat('magicAttack', 3)], [pct('magicAttack', 4), pct('maxMp', 5)], [pct('magicAttack', 7), pct('maxMp', 8)], [pct('magicAttack', 10), pct('maxMp', 12), flat('cooldownReduction', 3)]]),
  },
  {
    id: 'thieves-den', name: 'The Thieves’ Den', hall: 'saltmere', god: 'vex', rivals: ['iron-legion'],
    description: 'A guild of thieves, fences and very polite liars.',
    likes: [{ event: 'goldStolen', amount: 3, cap: 9, text: 'Stealing' }, { event: 'crit', amount: 0.5, cap: 3, text: 'Clean, precise work' }, { event: 'goldLooted', amount: 1, cap: 5, text: 'Turning a profit (per 100 gold)' }],
    dislikes: [{ event: 'battleLost', amount: -2, text: 'Getting caught' }],
    ranks: ranks([[flat('goldFind', 5)], [flat('goldFind', 10), flat('critChance', 2)], [flat('goldFind', 15), flat('critChance', 4)], [flat('goldFind', 25), flat('critChance', 6), flat('magicFind', 10)]]),
  },
  {
    id: 'lantern-concord', name: 'The Lantern Concord', hall: 'lampfall', god: 'mirrin', rivals: [],
    description: 'Lamplighters and trail-wardens who keep the roads lit and remember everyone who walked them.',
    likes: [{ event: 'kill', enemyType: 'undead', amount: 2, text: 'Laying the dead to rest' }, { event: 'heal', amount: 0.3, cap: 2, text: 'Healing' }, { event: 'rest', amount: 1, text: 'Resting at a lit camp' }, { event: 'questDone', amount: 3, text: 'Finishing what you start' }],
    dislikes: [{ event: 'battleFled', amount: -2, text: 'Leaving the lost behind' }],
    ranks: ranks([[flat('statusResist', 5)], [flat('statusResist', 10), flat('dodge', 2)], [flat('statusResist', 15), flat('dodge', 4), pct('maxHp', 3)], [flat('statusResist', 20), flat('dodge', 6), pct('maxHp', 6), flat('hpRegen', 3)]]),
  },
  {
    id: 'cog-union', name: 'The Cog & Anvil Union', hall: 'ratchet', god: 'ordrun', rivals: [],
    description: 'Foundry workers, Forged and a few stubborn foremen who agree on exactly one thing: nobody works to death.',
    likes: [{ event: 'kill', enemyType: 'construct', amount: 2, text: 'Breaking rogue machines' }, { event: 'craft', amount: 1, cap: 3, text: 'Honest work' }, { event: 'goldLooted', amount: 0.5, cap: 2, text: 'Getting paid' }],
    dislikes: [{ event: 'salvage', amount: -1, text: 'Waste' }, { event: 'battleLost', amount: -1, text: 'Dropping the line' }],
    ranks: ranks([[pct('defense', 3)], [pct('defense', 6), pct('maxHp', 3)], [pct('defense', 9), pct('maxHp', 5)], [pct('defense', 12), pct('maxHp', 8), flat('damageBonus', 5)]]),
  },
];
