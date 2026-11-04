import type { ModifierSpec } from '../../engine/stats/modifiers';

/**
 * Kindred Bonds (Innovation Pack, item 16). Twenty people and gods you can grow close to. Talking to them, finishing their errands
 * and (for the gods) praying and giving make a bond grow through ten ranks, and each rank gives something back: stat boons, a
 * recipe taught across the table, a skill, and a gift.
 */
export interface BondDef {
  id: string;
  kind: 'npc' | 'god';
  /** The NPC or god id. */
  ref: string;
  /** What they are to you, in a line. */
  blurb: string;
  /** The two stats their even-ranked boons raise. */
  stats: [string, string];
  recipe: string;
  skills: [string, string];
}

/** Points needed for ranks 1 to 10 (rank 1 is a stranger you have met). */
export const BOND_RANK_POINTS = [0, 4, 10, 20, 34, 52, 74, 100, 132, 170];
export const BOND_RANK_NAMES = ['Met', 'Acquainted', 'Familiar', 'Friendly', 'Trusted', 'Close', 'Confidant', 'Devoted', 'Kindred', 'Sworn'];

export const BOND_TALK_POINTS = 1;
export const BOND_QUEST_POINTS = 4;
export const BOND_PRAYER_POINTS = 1;
export const BOND_OFFERING_POINTS = 3;

const mod = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
/** The boons at ranks 2, 4, 6, 8 and 10 for a pair of stats. */
export function bondMods(def: BondDef, rank: number): ModifierSpec[] {
  const tiers = Math.floor(rank / 2);
  if (tiers === 0) return [];
  const [a, b] = def.stats;
  const big = (s: string): number => (['maxHp', 'defense', 'physicalAttack', 'magicAttack', 'divinePower', 'maxMp'].includes(s) ? 2 : s === 'goldFind' || s === 'magicFind' ? 3 : s === 'xpGain' ? 1.5 : 1);
  return [mod(a, Math.round(tiers * big(a) * 10) / 10, ['maxHp', 'defense', 'physicalAttack', 'magicAttack', 'divinePower', 'maxMp'].includes(a) ? 'more' : 'flat'), mod(b, Math.round(tiers * big(b) * 10) / 10, ['maxHp', 'defense', 'physicalAttack', 'magicAttack', 'divinePower', 'maxMp'].includes(b) ? 'more' : 'flat')];
}

// prettier-ignore
export const BONDS: BondDef[] = [
  { id: 'reyna', kind: 'npc', ref: 'captain-reyna', blurb: 'The Captain of the Brightwater watch, who has never once been wrong about a rumour and is bothered by it.', stats: ['defense', 'speed'], recipe: 'ingot-armor-6', skills: ['armor-training', 'leadership'] },
  { id: 'marta', kind: 'npc', ref: 'marta', blurb: 'Innkeeper of the Gilded Goose. Feeds everyone and keeps a ledger of whom.', stats: ['maxHp', 'hpRegen'], recipe: 'cook-hearthmothers-pie', skills: ['camping', 'gossip'] },
  { id: 'ysra', kind: 'npc', ref: 'warden-ysra', blurb: 'Warden of Thornwick, who speaks to the wood and has been told not to repeat it.', stats: ['accuracy', 'dodge'], recipe: 'make-spider-silk-snare', skills: ['tracker', 'animal-speech'] },
  { id: 'dara', kind: 'npc', ref: 'marshal-dara', blurb: 'Marshal of Sandhaven. Has seen every kind of mercenary and trusts the second kind.', stats: ['physicalAttack', 'critChance'], recipe: 'ingot-weapon-2', skills: ['intimidate', 'weapon-mastery'] },
  { id: 'quill-saltmere', kind: 'npc', ref: 'harbormaster-quill', blurb: 'Harbormaster of Saltmere. Everything that floats in is in her book.', stats: ['goldFind', 'speed'], recipe: 'cook-pepper-and-ember', skills: ['negotiator', 'sea-legs'] },
  { id: 'oriel', kind: 'npc', ref: 'archmage-oriel', blurb: 'The Archmage of the Frosthold Guild. Not cold. Merely at a lower temperature than you.', stats: ['magicAttack', 'cooldownReduction'], recipe: 'brew-mana-lesser', skills: ['meditation-practice', 'read-ancient-script'] },
  { id: 'ilreth', kind: 'npc', ref: 'chancellor-ilreth', blurb: 'Chancellor of Aurelane, who has read every law and found most of them wanting.', stats: ['xpGain', 'statusResist'], recipe: 'craft-jewelry-4', skills: ['diplomacy', 'etiquette'] },
  { id: 'borgrim', kind: 'npc', ref: 'thane-borgrim', blurb: 'Thane of the dwarf mountain. A very old argument that has put on armor.', stats: ['maxHp', 'defense'], recipe: 'ingot-weapon-2', skills: ['hardened-will', 'bulwark-training'] },
  { id: 'hilda', kind: 'npc', ref: 'forge-matron-hilda', blurb: 'Forge-Matron of Khazrum. Her rule: no hammer without a reason.', stats: ['physicalAttack', 'defense'], recipe: 'cut-ruby-5', skills: ['tinkering', 'quick-hands'] },
  { id: 'wick', kind: 'npc', ref: 'elder-wick', blurb: 'Elder of Lampfall. Keeps the lamps lit and the neighbours honest.', stats: ['magicResist', 'statusResist'], recipe: 'brew-holy-water', skills: ['survival-instinct', 'keen-eye'] },
  { id: 'lensmaster', kind: 'npc', ref: 'lensmaster-quill', blurb: 'Lensmaster of the Saltglass Flats. Sees clearly. Reports selectively.', stats: ['accuracy', 'magicFind'], recipe: 'cut-amethyst-3', skills: ['appraise', 'treasure-hunter'] },
  { id: 'maris', kind: 'npc', ref: 'harbor-queen-maris', blurb: 'Harbor-Queen of Pearlgate. Rules a drowned court by the simple means of being drier than anyone.', stats: ['lightningResist', 'dodge'], recipe: 'cook-moonlit-roast', skills: ['swimming', 'charm'] },
  { id: 'ulrik', kind: 'npc', ref: 'warchief-ulrik', blurb: 'Warchief of Briarhold. His tolls are manners and his manners are tolls.', stats: ['damageBonus', 'maxHp'], recipe: 'oil-oil-of-venom', skills: ['persuade', 'shrug-it-off'] },
  { id: 'lissel', kind: 'npc', ref: 'warden-lissel', blurb: 'Warden of the Mirewick lanterns, who counts them twice and the dead once.', stats: ['magicResist', 'hpRegen'], recipe: 'cook-moonpetal-tea', skills: ['foraging', 'detect-traps'] },
  { id: 'hesha-bond', kind: 'god', ref: 'hesha', blurb: 'Hearth and Mercy. She has never asked for a thing, and you owe her everything.', stats: ['healingPower', 'maxHp'], recipe: 'cook-hearty-stew', skills: ['iron-stomach', 'toughness'] },
  { id: 'thalor-bond', kind: 'god', ref: 'thalor', blurb: 'Forge and Craft. He judges you by what you have made, and is not unkind about it.', stats: ['physicalAttack', 'fireResist'], recipe: 'oil-oil-of-the-stormlord', skills: ['fire-walker', 'armor-training'] },
  { id: 'vex-bond', kind: 'god', ref: 'vex', blurb: 'Trickery and Luck. He is mostly telling the truth about almost everything.', stats: ['magicFind', 'critChance'], recipe: 'brew-elixir-of-the-miser', skills: ['bluff', 'lucky-star'] },
  { id: 'nymira-bond', kind: 'god', ref: 'nymira', blurb: 'Seas and Storms. She calls you the way the tide calls a boat.', stats: ['lightningResist', 'speed'], recipe: 'brew-elixir-of-the-storm', skills: ['cold-blooded', 'dodge-training'] },
  { id: 'mirrin-bond', kind: 'god', ref: 'mirrin', blurb: 'Memory and Time. Remembers you from a day you have not yet had.', stats: ['xpGain', 'cooldownReduction'], recipe: 'refine-radiant-essence', skills: ['fast-learner', 'oratory'] },
  { id: 'grimvald-bond', kind: 'god', ref: 'grimvald', blurb: 'Wealth and Trade. Fair, in the sense that he charges everybody.', stats: ['goldFind', 'xpGain'], recipe: 'craft-jewelry-1', skills: ['barter', 'haggle'] },
];
