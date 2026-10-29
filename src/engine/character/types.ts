import type { AppearanceState } from '../items/appearance';
import type { DifficultyId } from '../../data/difficulty';
import type { EquipSlot, ItemInstance } from '../items/types';
import type { CraftingState } from '../economy/types';
import type { Devotion } from '../gods/types';
import type { GeneralSkillProgress } from '../skills/generalTypes';
import type { ClassTreeState } from '../skills/treeTypes';
import type { ModifierSpec } from '../stats/modifiers';
import type { PrimaryStats } from '../stats/types';
import type { WorldProgress } from '../world/types';
import type { XpMode } from './multiclassTypes';

/** A buff that lasts a number of battles (elixirs, food, minor blessings). */
export interface TimedBuff {
  id: string;
  name: string;
  modifiers: ModifierSpec[];
  battlesLeft: number;
  /** Minor blessings carry their god. */
  god?: string;
}

export type ClassSlot = 'primary' | 'secondary' | 'tertiary';

/** Progress in one class. A character has one per class they have taken. */
export interface ClassProgress {
  classId: string;
  slot: ClassSlot;
  level: number;
  xp: number;
  /** Skill points earned by this class (levels, bonuses, tomes). Spent points live in the tree builds. */
  skillPoints: number;
  /** Specialization chosen at class level 20. */
  specialization?: string;
}

export interface Character {
  id: string;
  name: string;
  /** Portrait variant index for the race's portrait set. */
  portrait: number;
  raceId: string;
  /** Who the hero was before the oath (data/backgrounds.ts); absent on older saves. */
  backgroundId?: string;
  birthSignId: string;
  hardcore: boolean;
  /** Challenge modes chosen at creation (see data/challenges.ts). */
  challenges: string[];
  /** Pets and mounts owned, and the ones out with you. */
  stable: { pets: string[]; mounts: string[]; pet?: string; mount?: string };
  /** Chosen at creation; scales enemies, rewards and unlocks paragon nodes. */
  difficulty: DifficultyId;
  /** Transmog, dyes and portrait frame. */
  appearance: AppearanceState;
  /** Achievement points earned so far (see the milestone bonuses in data/achievements.ts). */
  achievementPoints: number;

  /** Character level: drives HP/MP formulas, attribute points and the cap. */
  level: number;
  xp: number;
  classes: ClassProgress[];
  /**
   * Share of class XP per class, in the same order as `classes`
   * (e.g. [75, 25]). Values are relative weights.
   */
  xpSplit: number[];
  /** 'split' follows xpSplit; 'focus' gives all class XP to the lowest-level class. */
  xpMode: XpMode;
  /** Unlocked hybrid prestige classes (their trees are owned like class trees). */
  hybrids: string[];
  /** Trial encounters won (class trials and hybrid trials). */
  trialsWon: string[];
  /** Favor, patron, blessings and divine intervention. */
  devotion: Devotion;
  /** Faction reputation, house and world boss trophies. */
  world: WorldProgress;
  /** Professions, gathering skills and known recipes. */
  crafting: CraftingState;
  /** The earned title shown beside the name. */
  title?: string;
  /** Enemies met (enemy id -> kills; 0 = seen but never killed). */
  bestiary: Record<string, number>;

  /** Attribute points the player has spent, per stat. */
  allocated: PrimaryStats;
  attributePoints: number;

  paragonLevel: number;
  paragonXp: number;
  paragonPoints: number;
  /** Ranks per paragon node id. */
  paragon: Record<string, number>;

  /** Equipped items by slot. */
  equipment: Partial<Record<EquipSlot, ItemInstance>>;
  timedBuffs: TimedBuff[];

  /** Skills known outside the trees (starting, racial, skillbooks): skill id -> rank. */
  skills: Record<string, number>;
  /** Skill tree builds per class. */
  trees: Record<string, ClassTreeState>;
  /** Mastery XP per skill id (uses in battle). */
  mastery: Record<string, number>;
  /** Hidden classes the hero has unlocked (secret questlines): they can then be taken up as a secondary class. */
  unlockedClasses: string[];
  /** The base game's third class slot, opened by High Lector Amara's errand (NG+2 opens it too). */
  thirdSlot?: boolean;
  /** Bad-luck protection: bosses killed in a row without a special drop, per boss id. */
  badLuck?: Record<string, number>;
  /** The Legendary Codex: hand-made items (legendary and above) this character has held. */
  codexUniques?: string[];
  /** Enemy types the hero has stolen from (the Hollow Hand's secret). */
  stolen: string[];
  /** Skills evolved into a stronger form: base skill id -> evolved skill id (data/evolutions.ts). */
  evolved: Record<string, string>;
  /** Known general skills (from skillbooks and Grimoires). */
  generalSkills: Record<string, GeneralSkillProgress>;
  /** Slotted general skills (only slotted ones are active). */
  generalSlots: (string | null)[];
  /** Extra general slots from achievements and apostleship (later phases). */
  bonusGeneralSlots: number;

  /** Current HP and MP. Max values come from calculateStats. */
  hp: number;
  mp: number;
}
