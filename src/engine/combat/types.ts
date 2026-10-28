import type { EffectSpec, TriggeredEffect } from '../effects/types';
import type { GearLook } from '../items/equipment';
import type { SkillPatch } from '../skills/treeTypes';
import type { StatInput } from '../stats/calculate';
import type { ModifierSpec } from '../stats/modifiers';
import type { Element } from '../stats/types';

export type Side = 'party' | 'enemy';
export type Row = 'front' | 'back';
export type CombatantKind = 'hero' | 'companion' | 'summon' | 'enemy';
export type AiProfile = 'aggressive' | 'defensive' | 'healer' | 'caster' | 'summoner' | 'assassin' | 'support';
export type EnemyTier = 'normal' | 'elite' | 'champion' | 'miniboss' | 'boss' | 'worldBoss' | 'punisher';

/** Level-1 combat numbers for an enemy or summon; they grow with level (see ENEMY_GROWTH). */
export interface CombatStatsDef {
  hp: number;
  attack: number;
  magic: number;
  defense: number;
  magicResist: number;
  speed: number;
  accuracy?: number;
  critChance?: number;
  dodge?: number;
}

export interface EnemySkillRef {
  id: string;
  /** Relative chance the AI considers this skill. Default 1. */
  weight?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  /** Sprite family (slime, beast, humanoid, undead, spirit, spider, plant...). */
  family: string;
  /** Creature types used by conditions, bestiary and relic deeds (beast, undead...). */
  types: string[];
  level: number;
  tier: EnemyTier;
  row: Row;
  stats: CombatStatsDef;
  /** Elemental resistances in %; negative = weakness. */
  resists?: Partial<Record<Element, number>>;
  modifiers?: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
  /** Basic attack is always available; these are extra. */
  skills: EnemySkillRef[];
  basicAttack: { element: Element; ranged: boolean; magic?: boolean; name: string };
  ai: AiProfile;
  /** XP at its own level before tier scaling. */
  xp: number;
  lootTable: string;
  /** A secret boss's guarded technique: the skillbook it drops, once, until learned. */
  teaches?: string;
  description: string;
  palette: { main: string; accent: string };
}

/** An elite affix: extra stats and tricks rolled onto elites and champion packs. */
export interface EliteAffixDef {
  id: string;
  /** Prefixed to the enemy's name ("Swift Dire Wolf"). */
  name: string;
  description: string;
  modifiers?: ModifierSpec[];
  triggers?: TriggeredEffect[];
  flags?: string[];
  /** Never rolled onto enemies of these types. */
  notFor?: string[];
}

/** One stage of a scripted boss fight, entered when its HP falls to `hpPct`. */
export interface BossPhaseDef {
  hpPct: number;
  name: string;
  /** Told in the log as the phase begins. */
  text: string;
  /** Permanent stat changes from this phase on. */
  modifiers?: ModifierSpec[];
  /** Applied once as the phase begins; untargeted effects hit the party. */
  effects?: EffectSpec[];
  /** Enemies that join the fight (no XP or loot of their own). */
  adds?: string[];
  /** Skills it can use from this phase on. */
  skills?: EnemySkillRef[];
}

/**
 * A telegraphed attack: the boss spends a turn winding up (the party sees
 * it coming), then unleashes the skill on its next turn. Breaking its
 * stagger bar in between interrupts it; Defending halves the hit.
 */
export interface BossTelegraphDef {
  skillId: string;
  /** Winds up on every Nth turn of its own. */
  every: number;
  /** First phase (index, 0 = the opening) it does this in. */
  fromPhase?: number;
  warning: string;
}

/** A boss's script, keyed by its enemy id. Bosses without one still enrage on the default timer. */
export interface BossScriptDef {
  id: string;
  phases: BossPhaseDef[];
  telegraphs: BossTelegraphDef[];
  /** Own turns before it enrages (default by tier, `BOSS.enrageTurns`). */
  enrageTurns?: number;
  enrageText?: string;
}

/** Allies summoned in battle (skeletons, the ranger's pet, spirit animals). Scale with the summoner. */
export interface SummonDef {
  id: string;
  name: string;
  family: string;
  types: string[];
  stats: CombatStatsDef;
  /** Share of the owner's attack/magic added to the summon's. */
  ownerPowerShare: number;
  skills: EnemySkillRef[];
  basicAttack: { element: Element; ranged: boolean; magic?: boolean; name: string };
  ai: AiProfile;
  /** Turns before it crumbles; undefined = lasts the whole battle. */
  duration?: number;
  palette: { main: string; accent: string };
}

export interface EncounterDef {
  id: string;
  name: string;
  description: string;
  level: number;
  enemies: { enemyId: string; row?: Row; level?: number; tier?: EnemyTier }[];
  canFlee: boolean;
  isBoss?: boolean;
  /** Extra HP and damage (percent) for every enemy (zone threat). */
  threat?: number;
  /** Quest fights that can come at any level (gods' tests): enemies match the hero's level. */
  scalesToHero?: boolean;
}

// ---------------------------------------------------------------- runtime

export interface StatusInstance {
  id: string;
  turns: number;
  stacks: number;
  sourceId: string;
  /** Attack power snapshot for damage-over-time. */
  power: number;
}

export interface BuffInstance {
  id: string;
  name: string;
  modifiers: ModifierSpec[];
  turns: number;
  sourceId: string;
}

export interface Combatant {
  id: string;
  name: string;
  side: Side;
  row: Row;
  kind: CombatantKind;
  level: number;
  /** Stats without combat buffs and statuses. */
  statInput: StatInput;
  hp: number;
  mp: number;
  /** Last computed maximums (refreshed whenever stats are computed). */
  maxHp: number;
  maxMp: number;
  /**
   * Percent-of-max-HP heals (regeneration) are divided by this. Party
   * scaling multiplies enemy HP to make them tougher, not to make them
   * regenerate faster.
   */
  healScale?: number;
  shield: number;
  /** Class resource and any others (rage, combo...). */
  resources: Record<string, number>;
  resourceId?: string;
  statuses: StatusInstance[];
  buffs: BuffInstance[];
  /** `general` marks a skill granted by a slotted general skill (trains that skill instead of mastery). */
  skills: { id: string; rank: number; patch?: SkillPatch; mastery?: number; general?: string }[];
  /** Heroes may only use skills on their hotbar (plus the ultimate and general skills). */
  hotbar?: string[];
  /** Turns until a skill (or `ability:trinket` / `ability:relic`) is ready. */
  cooldowns: Record<string, number>;
  ultimate: number;
  ultimateSkill?: string;
  /** An Apostle's Divine Avatar: an ultimate usable once per battle. */
  avatarSkill?: string;
  avatarUsed?: boolean;
  /** The Defender's second god's Avatar, usable once per battle as well. */
  avatarSkill2?: string;
  avatarUsed2?: boolean;
  stagger?: { value: number; max: number; brokenTurns: number };
  alive: boolean;
  flags: string[];
  triggers: { effect: TriggeredEffect; source: string }[];
  types: string[];
  tier: EnemyTier | 'party';
  ai: AiProfile;
  /** Scripted boss state: phase reached, the telegraphed skill being wound up, enrage. */
  boss?: { phase: number; charging?: string; enraged: boolean };
  /** Elite affixes rolled for this enemy. */
  affixes?: string[];
  /** Initiative: the combatant with the lowest value acts next. */
  nextAt: number;
  defending: boolean;
  stance?: string;
  /** Guarded by an ally: that ally takes `share` percent of the damage dealt to this unit. */
  guard?: { by: string; share: number; turns: number };
  /** The last skill used (for Echo). */
  lastSkill?: { id: string; rank: number; targetId?: string };
  /** A skill taken from an enemy, waiting to be cast. */
  borrowed?: { id: string; rank: number };
  /** Health at the start of recent turns (for Rewind). */
  hpHistory?: number[];
  songs: string[];
  classId?: string;
  basicAttack: { element: Element; ranged: boolean; magic: boolean; name: string };
  enemyId?: string;
  summonId?: string;
  ownerId?: string;
  /** Remaining turns for timed summons. */
  expiresIn?: number;
  xp: number;
  lootTable?: string;
  /** Fallen enemies leave a corpse that necromancy can consume. */
  corpse: boolean;
  reviveUsed: boolean;
  lowHpFired: boolean;
  turnsTaken: number;
  /** Visuals. */
  portrait?: { raceId: string; variant: number; color: string; look?: GearLook };
  sprite?: { family: string; main: string; accent: string };
  /** Weapon types in hand, for weaponType conditions. */
  weaponTypes: string[];
  /** The hero's patron god (for patron conditions and the Pray action). */
  patron?: string;
  /** Pray: spends favor with the patron for a divine effect. */
  prayer?: { god: string; name: string; description: string; effects: EffectSpec[]; cost: number; uses: number };
  /** Divine Intervention: a Devoted+ god may save the hero from death once. */
  intervention?: { god: string; name: string; text: string; effects: EffectSpec[]; chance: number; used: boolean };
  /** On-use abilities from equipped trinket and relic. */
  abilities: { slot: 'trinket' | 'relic'; name: string; description: string; effects: EffectSpec[]; cooldown: number }[];
}

export type Action =
  | { kind: 'attack'; actorId: string; targetId: string }
  | { kind: 'skill'; actorId: string; skillId: string; targetId?: string }
  | { kind: 'item'; actorId: string; itemId: string; targetId?: string }
  | { kind: 'ability'; actorId: string; slot: 'trinket' | 'relic'; targetId?: string }
  | { kind: 'defend'; actorId: string }
  | { kind: 'swap'; actorId: string }
  | { kind: 'flee'; actorId: string }
  | { kind: 'pray'; actorId: string; targetId?: string };

export type BattleEvent =
  | { type: 'turn'; actorId: string }
  | { type: 'action'; actorId: string; label: string; targets: string[] }
  | { type: 'damage'; sourceId?: string; targetId: string; amount: number; element: Element; crit: boolean; absorbed: number; dot?: boolean }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'miss'; sourceId: string; targetId: string }
  | { type: 'status'; targetId: string; statusId: string; on: boolean }
  | { type: 'resisted'; targetId: string; statusId: string }
  | { type: 'shield'; targetId: string; amount: number }
  | { type: 'death'; targetId: string }
  | { type: 'revive'; targetId: string }
  | { type: 'summon'; combatantId: string }
  | { type: 'break'; targetId: string }
  | { type: 'combo'; targetId: string; name: 'Shatter' | 'Conduct' }
  | { type: 'chain'; count: number }
  | { type: 'skip'; actorId: string; reason: string }
  | { type: 'resource'; targetId: string }
  | { type: 'flee'; success: boolean }
  | { type: 'log'; text: string }
  /** A scripted boss moment: winding up, a new phase, enraging, an interrupted attack. */
  | { type: 'boss'; actorId: string; moment: 'windUp' | 'phase' | 'enrage' | 'interrupt'; title: string; text: string }
  | { type: 'end'; outcome: BattleOutcome };

export type BattleOutcome = 'ongoing' | 'victory' | 'defeat' | 'fled';

/** What the battle tracked, for rewards, relic deeds and stats. */
export interface BattleTally {
  kills: { enemyId: string; level: number; tier: EnemyTier; types: string[]; xp: number; lootTable?: string; element?: Element; enraged?: boolean }[];
  /** Boss wind-ups the party broke. */
  interrupts: number;
  partyCrits: number;
  partyHeals: number;
  highestHit: number;
  goldFound: number;
  favor: { god: string; amount: number }[];
  /** Consumables used, by item id. */
  itemsUsed: Record<string, number>;
  /** Skill uses by heroes, for mastery. */
  skillUses: Record<string, number>;
  /** Enemy ids stolen from this battle. */
  stolen: string[];
  /** Uses of skills granted by general skills, keyed by general skill id, for training. */
  generalUses: Record<string, number>;
  /** Hero skill uses per tag (gods like or dislike some kinds of magic). */
  tagUses: Record<string, number>;
  /** Minions raised by the party. */
  summons: number;
  /** God that intervened to save the hero this battle. */
  intervention?: string;
}
