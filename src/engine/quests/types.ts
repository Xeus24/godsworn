import type { EnemyTier } from '../combat/types';
import type { DeedEvent, DevotionTier, FavorDeed, GodRelation } from '../gods/types';
import type { RarityId } from '../items/types';
import type { PrimaryStat } from '../stats/types';
import type { EntityKind } from '../world/types';
import type { LifetimeStat } from '../state/gameState';

// ---------------------------------------------------------------- conditions

/**
 * A test on the game state, used by quest availability, dialogue choices,
 * conversation topics and story branches.
 */
export type Cond =
  | { kind: 'level'; min: number }
  | { kind: 'class'; classId: string }
  | { kind: 'race'; raceId: string }
  | { kind: 'stat'; stat: PrimaryStat; min: number }
  | { kind: 'favor'; god: string; tier: DevotionTier }
  /** Apostle of this god, or of any god when `god` is omitted. */
  | { kind: 'apostle'; god?: string }
  | { kind: 'trialStage'; god: string; min: number }
  | { kind: 'rep'; faction: string; min: number }
  | { kind: 'item'; itemId: string; count?: number }
  | { kind: 'gold'; min: number }
  /** A flag is set (truthy), or equals `value`. */
  | { kind: 'flag'; flag: string; value?: boolean | number | string }
  /** A numeric flag (counter) is at least `min`. */
  | { kind: 'counter'; flag: string; min: number }
  | { kind: 'quest'; quest: string; state: 'active' | 'complete' | 'notStarted'; stage?: string }
  | { kind: 'companion'; companion: string; state: 'recruited' | 'inParty'; minApproval?: number }
  | { kind: 'trialWon'; encounter: string }
  | { kind: 'hybridOpen'; hybrid: string }
  | { kind: 'dungeonCleared'; dungeon: string }
  | { kind: 'lore'; count: number }
  | { kind: 'time'; time: 'day' | 'night' }
  /** A lifetime counter (kills, bosses slain, gold earned...) is at least `min`. */
  | { kind: 'lifetime'; stat: LifetimeStat; min: number }
  /** Bestiary entries met, or mastered. */
  | { kind: 'bestiary'; seen?: number; mastered?: number }
  /** Kills of one enemy (from the bestiary). */
  | { kind: 'killed'; enemy: string; min?: number }
  /** A Slayer rank against a creature type, or against any type when omitted. */
  | { kind: 'slayer'; enemyType?: string; rank: number }
  /** Quests completed (repeats count), optionally of one kind. */
  | { kind: 'questsDone'; questKind?: QuestKind; min: number }
  /** The story reached an ending (a particular one, or any). */
  | { kind: 'ending'; ending?: string }
  /** Gods at or above a favor tier. */
  | { kind: 'favorCount'; tier: DevotionTier; min: number }
  | { kind: 'classes'; min: number }
  | { kind: 'hybrids'; min: number }
  | { kind: 'specialization' }
  | { kind: 'paragon'; min: number }
  /** Skills at full mastery. */
  | { kind: 'mastered'; min: number }
  /** Companions recruited (and still with you), optionally at an approval. */
  | { kind: 'companions'; min: number; minApproval?: number }
  | { kind: 'dungeons'; min: number }
  | { kind: 'waypoints'; min: number }
  /** Zones set foot in. */
  | { kind: 'zones'; min: number }
  | { kind: 'house' }
  /** Items of a rarity found. */
  | { kind: 'rarity'; rarity: RarityId; min?: number }
  /** Any crafting profession at a level. */
  | { kind: 'profession'; level: number }
  | { kind: 'achievements'; min: number }
  | { kind: 'hardcore' }
  /** Playing under a challenge mode. */
  | { kind: 'challenge'; challenge: string }
  /** Highest Rift tier cleared. */
  | { kind: 'riftTier'; min: number }
  /** Boss Rush: full clears, or bosses beaten in one run. */
  | { kind: 'bossRush'; clears?: number; best?: number }
  /** Defending a second god (the Defender path). */
  | { kind: 'defender' }
  /** Different endings reached across all playthroughs. */
  | { kind: 'endingsSeen'; min: number }
  /** A New Game+ tier at least `min`. */
  | { kind: 'ngPlus'; min: number }
  /** Heresy at least `min` (or below `max`). */
  | { kind: 'heresy'; min?: number; max?: number }
  | { kind: 'all'; conds: Cond[] }
  | { kind: 'any'; conds: Cond[] }
  | { kind: 'not'; cond: Cond };

// ---------------------------------------------------------------- places

/**
 * Where a quest marker sits on a map: a few steps from an anchor (an entity
 * of some kind, or an arrival point). Resolved deterministically, so markers
 * never move between loads.
 */
export interface Spot {
  map: string;
  near: { kind: EntityKind; ref?: string } | 'west' | 'east' | 'entrance' | 'center';
  /** Steps from the anchor (default 3). */
  distance?: number;
  label: string;
  /** Objectives with the same key share one tile (a talk and the fight that may follow it). */
  key?: string;
}

// ---------------------------------------------------------------- objectives

interface ObjectiveBase {
  id: string;
  /** Journal line, e.g. "Slay giant rats". */
  text: string;
}

export type ObjectiveDef = ObjectiveBase &
  (
    | { kind: 'kill'; count: number; enemyId?: string; enemyType?: string; tiers?: EnemyTier[]; zone?: string }
    /** Carry the items; they are handed over when the stage completes (unless `keep`). */
    | { kind: 'collect'; itemId: string; count: number; keep?: boolean }
    /** Bring the items to an NPC and hand them over. */
    | { kind: 'deliver'; itemId: string; count: number; npc: string }
    /** Speak with an NPC: in town, or at a marker in the field (`at`). `dialogue` runs instead of a plain line. */
    | { kind: 'talk'; npc: string; at?: Spot; dialogue?: string }
    | { kind: 'visit'; at: Spot }
    /**
     * Win a fight: at a marker (`at`), from a dialogue, or anywhere the
     * encounter is fought (class trials in the arena). `waves` victories are needed.
     */
    | { kind: 'fight'; encounter: string; at?: Spot; waves?: number }
    /** An NPC (fighting beside you as `guest`) must reach `to` alive. If they fall, the quest fails. */
    | { kind: 'escort'; guest: string; npc: string; to: Spot }
    /** Slay the dungeon's boss. */
    | { kind: 'clear'; dungeon: string }
    /** Light every rune stone of the dungeon. */
    | { kind: 'runes'; dungeon: string }
    /** Touch the stones in the right order (by index into `stones`); a wrong stone starts the sequence over. */
    | { kind: 'sequence'; stones: Spot[]; order: number[] }
    /** Do something the gods could notice (kills, crits, books read...). */
    | { kind: 'deed'; deed: Omit<FavorDeed, 'amount' | 'text'>; count: number }
    /** Reach a state (a favor tier, a won trial...). */
    | { kind: 'state'; cond: Cond }
  );

export type ObjectiveKind = ObjectiveDef['kind'];

// ---------------------------------------------------------------- actions

/** Something a dialogue choice or a finished stage does to the game. */
export type ActionDef =
  | { kind: 'startQuest'; quest: string }
  | { kind: 'setFlag'; flag: string; value?: boolean | number | string }
  | { kind: 'addCounter'; flag: string; amount?: number }
  | { kind: 'giveItem'; itemId: string; qty?: number }
  | { kind: 'takeItem'; itemId: string; qty?: number }
  /** Positive gives gold, negative takes it. */
  | { kind: 'gold'; amount: number }
  | { kind: 'favor'; god: string; amount: number }
  | { kind: 'rep'; faction: string; amount: number }
  | { kind: 'approval'; companion: string; amount: number }
  | { kind: 'recruit'; companion: string }
  | { kind: 'deed'; event: DeedEvent; count?: number }
  /** Starts a fight once the conversation closes. */
  | { kind: 'fight'; encounter: string }
  | { kind: 'completeObjective'; quest: string; objective: string }
  | { kind: 'failQuest'; quest: string }
  | { kind: 'ending'; ending: string }
  | { kind: 'title'; title: string }
  | { kind: 'restore' }
  | { kind: 'toast'; text: string }
  /** The companion's personal quest is done: their oath perk is earned. */
  | { kind: 'oath'; companion: string }
  /** Hands in a stage at its turn-in NPC (used by the generated quest dialogue). */
  | { kind: 'turnIn'; quest: string }
  /** Hands over a delivery (used by the generated quest dialogue). */
  | { kind: 'deliver'; quest: string; objective: string }
  /** Heresy toward the Nameless One (negative forgives it). */
  | { kind: 'heresy'; amount: number }
  /** Pantheon politics: two gods become rivals, allies, or set their feud aside. */
  | { kind: 'politics'; a: string; b: string; relation: GodRelation };

// ---------------------------------------------------------------- quests

export interface StageDef {
  id: string;
  /** Journal text while the stage is current. */
  text: string;
  objectives: ObjectiveDef[];
  /** In-game hours to finish this stage; the quest fails when they run out. */
  hours?: number;
  /** Finish by speaking to this NPC once every objective is done. */
  turnIn?: string;
  /** What the turn-in NPC says. */
  turnInText?: string;
  /** Next stage: an id, the first branch whose condition holds, or 'complete'. Default: the next stage listed, and after the last the quest completes. */
  next?: string | { cond: Cond; stage: string }[];
  /** Applied when the stage begins (hand over a letter, set a flag...). */
  onStart?: ActionDef[];
  /** Applied when the stage completes. */
  onComplete?: ActionDef[];
}

export type QuestKind = 'main' | 'twilight' | 'side' | 'god' | 'class' | 'hybrid' | 'faction' | 'companion' | 'bounty';

export interface RewardDef {
  /** Share of the quest level's XP-to-next-level (0.3 = 30% of a level). */
  xp?: number;
  /** Gold per quest level. */
  gold?: number;
  items?: { itemId: string; qty?: number }[];
  /** Random gear of this rarity at the quest's level. */
  gear?: { rarity: RarityId; count?: number };
  favor?: Record<string, number>;
  rep?: Record<string, number>;
  /** Skill points for the primary class. */
  skillPoints?: number;
  title?: string;
}

export interface QuestDef {
  id: string;
  name: string;
  kind: QuestKind;
  /** Recommended level: also scales XP and gold rewards. */
  level: number;
  zone?: string;
  /** NPC who offers it. */
  giver?: string;
  /** Offered on this town's quest board instead of by an NPC. */
  board?: string;
  /** Offer text and journal summary. */
  summary: string;
  requires?: Cond;
  /** Starts by itself as soon as `requires` holds (main story chapters, trials). */
  auto?: boolean;
  /** Can be taken again the next in-game day (bounties). */
  repeatable?: boolean;
  stages: StageDef[];
  rewards: RewardDef;
  /** Shown when the quest completes. */
  epilogue?: string;
}

// ---------------------------------------------------------------- dialogue

export interface ChoiceDef {
  text: string;
  cond?: Cond;
  /** Hidden when the condition fails, instead of shown greyed out with its requirement. */
  hideLocked?: boolean;
  /** Node to go to; omitted ends this conversation thread. */
  next?: string;
  actions?: ActionDef[];
  /** Ends without completing the talk objective this dialogue belongs to ("not yet"). */
  leave?: boolean;
}

export interface DialogueNode {
  /** An NPC id, 'hero' or 'narrator'. Default: the NPC being spoken to. */
  speaker?: string;
  /** May use {hero}, {patron}, {apostle} and {class}. */
  text: string;
  /** Applied when the node is shown. */
  actions?: ActionDef[];
  /** No choices: a single Continue to `next`, or the end. */
  choices?: ChoiceDef[];
  next?: string;
}

export interface DialogueDef {
  id: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

/** Where an NPC can be found. */
export type NpcPlace = 'people' | 'temple' | 'arena' | 'field';

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  /** Home town; arena NPCs (class mentors) are found in every town's arena. */
  town?: string;
  place: NpcPlace;
  race: string;
  portrait: number;
  color: string;
  greeting: string;
  /** Extra conversations, offered while their condition holds. */
  topics?: { id: string; text: string; dialogue: string; cond?: Cond; once?: boolean }[];
  /** A companion's own NPC (talk to them from the Party screen once recruited). */
  companion?: string;
}

export interface EndingDef {
  id: string;
  name: string;
  text: string;
  /** Extra paragraph for the Apostle of each god. */
  godText?: Record<string, string>;
  /** Title earned with this ending. */
  title?: string;
}

// ---------------------------------------------------------------- state

export interface QuestProgress {
  stage: string;
  /** Progress per objective id in the current stage (sequence: stones touched in order). */
  progress: Record<string, number>;
  /** In-game minute the stage began. */
  stageStarted: number;
}

export interface QuestState {
  active: Record<string, QuestProgress>;
  /** Times each quest was completed. */
  completed: Record<string, number>;
  /** In-game day each quest was last completed (repeatable quests return the next day). */
  completedDay: Record<string, number>;
  failed: string[];
  tracked?: string;
  /** Conversation topics already used (once-only topics). */
  topicsSeen: string[];
  /** The story's ending, once reached. */
  ending?: { id: string; god?: string; day: number; seen: boolean };
}

export function createQuestState(): QuestState {
  return { active: {}, completed: {}, completedDay: {}, failed: [], topicsSeen: [] };
}
