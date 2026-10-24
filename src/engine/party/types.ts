import type { Character } from '../character/types';
import type { TriggeredEffect } from '../effects/types';
import type { FavorDeed } from '../gods/types';
import type { ModifierSpec } from '../stats/modifiers';

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
}

export interface PartyState {
  companions: Record<string, CompanionState>;
}

export function createPartyState(): PartyState {
  return { companions: {} };
}
