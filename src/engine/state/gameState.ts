import { content } from '../../data';
import { MULTICLASS, PROGRESSION } from '../../data/progression';
import { allocateAttribute, respecAttributes, respecCost, type AttributeResult } from '../character/attributes';
import { spendParagonPoint } from '../character/paragon';
import { changeDifficulty, type DifficultyChange } from '../character/difficultyChange';
import type { DifficultyId } from '../../data/difficulty';
import { grantXp, type XpResult } from '../character/progression';
import { characterStats, restoreFull } from '../character/stats';
import type { Character } from '../character/types';
import { createGameEventBus, type GameEventBus } from '../core/gameEvents';
import { Rng } from '../core/rng';
import { TriggerSystem } from '../effects/triggers';
import { createItem } from '../items/generate';
import { contractSpirits } from '../skills/spirits';
import { learnGeneral } from '../skills/general';
import { addItem, createInventory, createStash, type Inventory, type Stash } from '../items/inventory';
import type { ItemCategory, ItemInstance } from '../items/types';
import { DEFAULT_LOOT_FILTER, type LootFilterSettings } from '../items/lootFilter';
import { applyStartingKit } from '../items/use';
import { SPEC_LEVEL } from '../skills/specs';
import type { PrimaryStat } from '../stats/types';
import { advanceClock, createClock, hourOf, timeOfDay, type GameClock } from './clock';
import { DevotionActions } from './devotionActions';
import { EconomyActions } from './economyActions';
import type { EconomyState } from '../economy/types';
import { GeneralActions } from './generalActions';
import { ItemActions } from './itemActions';
import type { Loadout } from './loadoutActions';
import { MulticlassActions } from './multiclassActions';
import { TreeActions } from './treeActions';
import { WorldActions } from './worldActions';
import { QuestActions } from './questActions';
import { PartyActions } from './partyActions';
import { AchievementActions } from './achievementActions';
import { EndgameActions } from './endgameActions';
import { createEndgameState, type EndgameState } from '../endgame/types';
import { createQuestState, type QuestState } from '../quests/types';
import { createPartyState, type PartyState } from '../party/types';
import type { WorldState } from '../world/types';
import { createWorldState } from '../world/world';

export const GAME_NAME = 'Godsworn';
/** Bumped whenever the saved shape changes; save migrations key off this. */
export const SAVE_VERSION = 18;

export interface SaveMeta {
  game: typeof GAME_NAME;
  version: number;
  createdAt: number;
  playTimeMs: number;
}

/** Lifetime counters for the statistics page and achievements. */
export interface GameStats {
  kills: number;
  battlesWon: number;
  battlesLost: number;
  battlesFled: number;
  deaths: number;
  highestHit: number;
  elitesKilled: number;
  championsKilled: number;
  /** Minibosses and bosses. */
  bossesKilled: number;
  worldBossesKilled: number;
  punishersKilled: number;
  /** Bosses slain after they enraged. */
  enragedKilled: number;
  /** Boss wind-ups broken before they landed. */
  interrupts: number;
  crits: number;
  interventions: number;
  goldEarned: number;
  goldSpent: number;
  itemsLooted: number;
  consumablesUsed: number;
}

/** Counters that hold numbers (every one of them, today). */
export type LifetimeStat = keyof GameStats;

export function createGameStats(): GameStats {
  return {
    kills: 0,
    battlesWon: 0,
    battlesLost: 0,
    battlesFled: 0,
    deaths: 0,
    highestHit: 0,
    elitesKilled: 0,
    championsKilled: 0,
    bossesKilled: 0,
    worldBossesKilled: 0,
    punishersKilled: 0,
    enragedKilled: 0,
    interrupts: 0,
    crits: 0,
    interventions: 0,
    goldEarned: 0,
    goldSpent: 0,
    itemsLooted: 0,
    consumablesUsed: 0,
  };
}

/** Everything that is saved. Plain JSON data only. */
export interface GameState {
  meta: SaveMeta;
  seed: number;
  rngState: number;
  clock: GameClock;
  flags: Record<string, boolean | number | string>;
  player: Character;
  gold: number;
  levelCap: number;
  /** New Game+ tier; 0 for a first playthrough. */
  ngPlus: number;
  inventory: Inventory;
  stash: Stash;
  /** Loot that did not fit in the bags, held until claimed (oldest dropped past OVERFLOW_MAX). */
  overflow: ItemInstance[];
  /** Item categories sent to the stash automatically on arriving in a town. */
  stashRules: ItemCategory[];
  /** Saved equipment sets: name -> slot -> item uid. */
  loadouts: Record<string, Loadout>;
  /** Counter for item uids. */
  nextUid: number;
  lootFilter: LootFilterSettings;
  stats: GameStats;
  /** Set when a Hardcore hero dies; the save can no longer be played. */
  gameOver: boolean;
  /** Where you are and what you have seen and done in the world. */
  world: WorldState;
  /** Shop purchases today and the buyback list. */
  economy: EconomyState;
  /** Quests taken, done and failed, and the story's ending. */
  quests: QuestState;
  /** Companions recruited, their approval, bonds and gear. */
  party: PartyState;
  /** Achievements earned: id -> in-game day. */
  achievements: Record<string, number>;
  /** Items found per rarity. */
  rarityFound: Record<string, number>;
  /** What earlier playthroughs left behind: endings reached (`id` or `id:god`). */
  legacy: { endings: string[] };
  /** Rifts and the Boss Rush: the run in progress and your records. */
  endgame: EndgameState;
}

export function createGameState(seed: number, player: Character, now = Date.now()): GameState {
  return {
    meta: { game: GAME_NAME, version: SAVE_VERSION, createdAt: now, playTimeMs: 0 },
    seed: seed >>> 0,
    rngState: seed >>> 0,
    clock: createClock(),
    flags: {},
    player,
    gold: PROGRESSION.startingGold,
    levelCap: PROGRESSION.levelCap,
    ngPlus: 0,
    inventory: createInventory(),
    stash: createStash(),
    overflow: [],
    stashRules: [],
    loadouts: {},
    nextUid: 0,
    lootFilter: { ...DEFAULT_LOOT_FILTER },
    stats: createGameStats(),
    gameOver: false,
    world: createWorldState(),
    economy: { bought: {}, buyback: [] },
    quests: createQuestState(),
    party: createPartyState(),
    achievements: {},
    rarityFound: {},
    legacy: { endings: [] },
    endgame: createEndgameState(),
  };
}

/**
 * Runtime wrapper around the saved state: the live RNG, the event bus and
 * the trigger registry. One per running game. Methods here mutate state
 * through the engine modules and announce the results as events.
 */
export class GameSession {
  readonly bus: GameEventBus;
  readonly rng: Rng;
  readonly triggers: TriggerSystem;
  readonly items: ItemActions;
  readonly trees: TreeActions;
  readonly general: GeneralActions;
  readonly multiclass: MulticlassActions;
  readonly devotion: DevotionActions;
  readonly world: WorldActions;
  readonly economy: EconomyActions;
  readonly quests: QuestActions;
  readonly party: PartyActions;
  readonly achievements: AchievementActions;
  readonly endgame: EndgameActions;

  constructor(public state: GameState) {
    this.bus = createGameEventBus();
    this.rng = new Rng(state.rngState);
    this.triggers = new TriggerSystem(this.rng);
    this.items = new ItemActions(this);
    this.trees = new TreeActions(this);
    this.general = new GeneralActions(this);
    this.multiclass = new MulticlassActions(this);
    this.devotion = new DevotionActions(this);
    this.world = new WorldActions(this);
    this.economy = new EconomyActions(this);
    this.party = new PartyActions(this);
    this.quests = new QuestActions(this);
    this.achievements = new AchievementActions(this);
    this.endgame = new EndgameActions(this);
    this.world.look();
    this.bus.on('goldChanged', ({ amount, reason }) => {
      if (amount > 0) this.state.stats.goldEarned += amount;
      else if (reason !== 'defeat') this.state.stats.goldSpent -= amount;
    });
    this.bus.on('itemLooted', ({ rarity }) => {
      this.state.stats.itemsLooted++;
      this.state.rarityFound[rarity] = (this.state.rarityFound[rarity] ?? 0) + 1;
    });
  }

  /** Starts a new game and hands the hero their class's starting kit. */
  static newGame(seed: number, player: Character): GameSession {
    const session = new GameSession(createGameState(seed, player));
    const classId = player.classes[0]?.classId;
    const kit = classId ? content.startingKits[classId] : undefined;
    if (kit) {
      const result = applyStartingKit(player, session.state.inventory, kit, () => session.newUid());
      if (!result.ok) throw new Error(`Starting kit failed: ${result.reason}`);
    }
    const bg = player.backgroundId ? content.backgrounds.find(player.backgroundId) : undefined;
    if (bg) {
      addItem(session.state.inventory, createItem(bg.item.itemId, bg.item.qty, () => session.newUid()));
      learnGeneral(player, bg.skill);
    }
    session.checkSpirits();
    // Begin at full HP and MP with the starting gear on.
    restoreFull(session.player);
    session.bus.emit('gameStarted', { seed: session.state.seed });
    // The story begins at once.
    session.quests.refresh();
    return session;
  }

  /** A Summoner contracts every spirit whose feat is now met. */
  checkSpirits(): void {
    for (const s of contractSpirits(this.player)) this.bus.emit('toast', { kind: 'quest', text: `A spirit answers: ${s.name} will fight beside you.` });
  }

  /** A fresh, unique item id for this save. */
  newUid(): string {
    this.state.nextUid++;
    return `i${this.state.nextUid}`;
  }

  get player(): Character {
    return this.state.player;
  }

  /** Copies live runtime values into the state before saving. */
  snapshot(): GameState {
    this.state.rngState = this.rng.state;
    return structuredClone(this.state);
  }

  advanceTime(minutes: number): void {
    const { clock } = advanceClock(this.state.clock, minutes);
    const hourChanged = hourOf(clock) !== hourOf(this.state.clock) || clock.day !== this.state.clock.day;
    const daysPassed = clock.day - this.state.clock.day;
    this.state.clock = clock;
    if (daysPassed > 0) this.items.reliquaryDays(Math.min(daysPassed, 30));
    if (hourChanged) this.bus.emit('timeChanged', { day: clock.day, hour: hourOf(clock) });
  }

  get timeOfDay(): 'day' | 'night' {
    return timeOfDay(this.state.clock);
  }

  setFlag(key: string, value: boolean | number | string): void {
    this.state.flags[key] = value;
  }

  /** Grants XP, applying the XP Gain stat unless `raw` is set. */
  grantXp(amount: number, raw = false): XpResult {
    const p = this.player;
    const bonus = raw ? 0 : characterStats(p).xpGain;
    const total = Math.floor(amount * (1 + bonus / 100));
    const result = grantXp(p, total, this.state.levelCap);
    this.bus.emit('xpGained', { characterId: p.id, amount: total });
    this.party.shareXp(total);
    for (const level of result.levels) this.bus.emit('levelUp', { characterId: p.id, level });
    if (result.levels.length > 0) this.checkSpirits();
    if (result.levels.length > 0) {
      // One toast per grant, however many levels it covered.
      this.bus.emit('toast', { kind: 'level', text: `Level ${p.level}! +${result.attributePoints} attribute points.` });
    }
    for (const cl of result.classLevels) {
      this.bus.emit('levelUp', { characterId: p.id, classId: cl.classId, level: cl.level });
      if (cl.level === SPEC_LEVEL) {
        this.bus.emit('toast', { kind: 'level', text: `${content.classes.get(cl.classId).name} ${SPEC_LEVEL}: choose a specialization in the Skills screen!` });
      }
    }
    if (result.levels.includes(MULTICLASS.secondaryLevel) && p.classes.length === 1) {
      this.bus.emit('toast', { kind: 'level', text: `Level ${MULTICLASS.secondaryLevel}: you may take a second class! Win a trial at the Proving Grounds.` });
    }
    if (result.levels.length > 0) this.devotion.evolveWeapons();
    const slots = this.general.growSlots();
    if (slots > 0) this.bus.emit('toast', { kind: 'level', text: `+${slots} general skill slot${slots > 1 ? 's' : ''}.` });
    if (result.paragonLevels.length > 0) {
      const n = result.paragonLevels.length;
      this.bus.emit('toast', { kind: 'level', text: `Paragon level ${p.paragonLevel}! +${n} paragon point${n > 1 ? 's' : ''}.` });
    }
    if (result.racialSkillPoints > 0) {
      const n = result.racialSkillPoints;
      this.bus.emit('toast', { kind: 'level', text: `Adaptable: +${n} bonus skill point${n > 1 ? 's' : ''}.` });
    }
    return result;
  }

  addGold(amount: number, reason: string): void {
    const delta = Math.floor(amount);
    if (delta === 0) return;
    this.state.gold = Math.max(0, this.state.gold + delta);
    this.bus.emit('goldChanged', { amount: delta, total: this.state.gold, reason });
  }

  /** Returns false (and changes nothing) if the player cannot afford it. */
  spendGold(amount: number, reason: string): boolean {
    const cost = Math.ceil(amount);
    if (cost < 0 || this.state.gold < cost) return false;
    this.addGold(-cost, reason);
    return true;
  }

  allocate(stat: PrimaryStat, points = 1): AttributeResult {
    return allocateAttribute(this.player, stat, points);
  }

  respec(): AttributeResult {
    const cost = respecCost(this.player);
    if (this.state.gold < cost) return { ok: false, reason: `Respec costs ${cost} gold.` };
    const result = respecAttributes(this.player);
    if (result.ok) this.spendGold(cost, 'respec');
    return result;
  }

  /** Switches difficulty (not for Hardcore heroes, and Impossible is neither entered nor left). */
  setDifficulty(to: DifficultyId): DifficultyChange {
    const result = changeDifficulty(this.player, to);
    if (result.ok) this.bus.emit('toast', { kind: 'info', text: `Difficulty is now ${to}.` });
    return result;
  }

  spendParagon(nodeId: string): AttributeResult {
    return spendParagonPoint(this.player, nodeId);
  }
}
