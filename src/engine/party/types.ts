import type { Character } from '../character/types';
import type { TriggeredEffect } from '../effects/types';
import type { FavorDeed } from '../gods/types';
import type { ModifierSpec } from '../stats/modifiers';
import type { Cond } from '../quests/types';

/** One node of a companion's bond tree: a perk for that companion. */
export interface BondNodeDef {
  id: string;
  name: string;
  description: string;
  modifiers?: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
}

/** A bond tier opens at an approval threshold: pick one of its two perks. */
export interface BondTierDef {
  approval: number;
  options: [BondNodeDef, BondNodeDef];
}

export interface CompanionDef {
  id: string;
  name: string;
  title: string;
  raceId: string;
  classId: string;
  birthSignId: string;
  portrait: number;
  /** The god they follow: they approve when you earn its favor, and frown on its rival's. */
  god: string;
  /** Where they wait when not in your party (and where you meet them). */
  town: string;
  bio: string;
  /** Specialization taken at class level 20. */
  specialization: string;
  /** Approval when recruited. */
  startApproval: number;
  likes: FavorDeed[];
  dislikes: FavorDeed[];
  /** Four tiers of two perks each. */
  bond: BondTierDef[];
  /** The fifth perk, earned by finishing their personal quest. */
  oath: BondNodeDef;
  recruitQuest: string;
  personalQuest: string;
  /** The five quests of their personal line, in order (recruit first, oath last). */
  line: string[];
  /** The loyalty skill: a perk that works while they are devoted to you (75 approval). */
  loyalty: BondNodeDef;
  /** What makes them walk out besides low approval (a betrayal, a line crossed). */
  leaves: { cond: Cond; text: string };
  /** Evenings at the camp: three scenes as their trust grows. */
  scenes: boolean;
}

export interface CompanionState {
  id: string;
  character: Character;
  /** -100..100. At or below the leaving threshold they walk out. */
  approval: number;
  /** Chosen bond perks (node ids). */
  bonds: string[];
  inParty: boolean;
  /** They left over low approval and wait in their town to be won back. */
  left: boolean;
  /** Their personal quest is done: the oath perk is theirs. */
  oath: boolean;
  /** Tree points are spent automatically; off means the player allocates them on the Party screen. */
  autoTree: boolean;
  /** Camp scenes seen (0-3): evenings at the camp, each opening as their trust grows. */
  scenes: number;
  /** The in-game day of the last chat at camp (one a day each). */
  lastTalk: number;
  /** How many banter lines they have said, to move through them in order. */
  banter: number;
}

export interface PartyState {
  companions: Record<string, CompanionState>;
}

export function createPartyState(): PartyState {
  return { companions: {} };
}
