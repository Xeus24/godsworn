import type { PrimaryStats } from '../stats/types';

export type ClassSlot = 'primary' | 'secondary' | 'tertiary';

/** Progress in one class. A character has one per class they have taken. */
export interface ClassProgress {
  classId: string;
  slot: ClassSlot;
  level: number;
  xp: number;
  /** Unspent skill points, usable only in this class's tree. */
  skillPoints: number;
}

export interface Character {
  id: string;
  name: string;
  /** Portrait variant index for the race's portrait set. */
  portrait: number;
  raceId: string;
  birthSignId: string;
  hardcore: boolean;

  /** Character level: drives HP/MP formulas, attribute points and the cap. */
  level: number;
  xp: number;
  classes: ClassProgress[];
  /**
   * Share of class XP per class, in the same order as `classes`
   * (e.g. [75, 25]). Values are relative weights.
   */
  xpSplit: number[];

  /** Attribute points the player has spent, per stat. */
  allocated: PrimaryStats;
  attributePoints: number;

  paragonLevel: number;
  paragonXp: number;
  paragonPoints: number;
  /** Ranks per paragon node id. */
  paragon: Record<string, number>;

  /** Known active skills: skill id -> rank. */
  skills: Record<string, number>;

  /** Current HP and MP. Max values come from calculateStats. */
  hp: number;
  mp: number;
}
