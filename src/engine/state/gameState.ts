import { content } from '../../data';
import { MULTICLASS, PROGRESSION } from '../../data/progression';
import { allocateAttribute, respecAttributes, respecCost, type AttributeResult } from '../character/attributes';
import { spendParagonPoint } from '../character/paragon';
import { grantXp, type XpResult } from '../character/progression';
import { characterStats } from '../character/stats';
import type { Character } from '../character/types';
import { createGameEventBus, type GameEventBus } from '../core/gameEvents';
import { Rng } from '../core/rng';
import { TriggerSystem } from '../effects/triggers';
import { createInventory, createStash, type Inventory, type Stash } from '../items/inventory';
import { DEFAULT_LOOT_FILTER, type LootFilterSettings } from '../items/lootFilter';
import { applyStartingKit } from '../items/use';
import { SPEC_LEVEL } from '../skills/specs';
import type { PrimaryStat } from '../stats/types';
import { advanceClock, createClock, hourOf, timeOfDay, type GameClock } from './clock';
import { GeneralActions } from './generalActions';
import { ItemActions } from './itemActions';
import { MulticlassActions } from './multiclassActions';
import { TreeActions } from './treeActions';

export const GAME_NAME = 'Godsworn';
/** Bumped whenever the saved shape changes; save migrations key off this. */
export const SAVE_VERSION = 7;

export interface SaveMeta {
  game: typeof GAME_NAME;
  version: number;
  createdAt: number;
  playTimeMs: number;
}

/** Lifetime counters for the stats screen and achievements. */
export interface GameStats {
  kills: number;
  battlesWon: number;
  battlesLost: number;
  battlesFled: number;
  deaths: number;
  highestHit: number;
}

export function createGameStats(): GameStats {
  return { kills: 0, battlesWon: 0, battlesLost: 0, battlesFled: 0, deaths: 0, highestHit: 0 };
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
  /** Counter for item uids. */
  nextUid: number;
  lootFilter: LootFilterSettings;
  stats: GameStats;
  /** Set when a Hardcore hero dies; the save can no longer be played. */
  gameOver: boolean;
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
    nextUid: 0,
    lootFilter: { ...DEFAULT_LOOT_FILTER },
    stats: createGameStats(),
    gameOver: false,
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

  constructor(public state: GameState) {
    this.bus = createGameEventBus();
    this.rng = new Rng(state.rngState);
    this.triggers = new TriggerSystem(this.rng);
    this.items = new ItemActions(this);
    this.trees = new TreeActions(this);
    this.general = new GeneralActions(this);
    this.multiclass = new MulticlassActions(this);
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
    session.bus.emit('gameStarted', { seed: session.state.seed });
    return session;
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
    this.state.clock = clock;
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
    for (const level of result.levels) this.bus.emit('levelUp', { characterId: p.id, level });
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

  spendParagon(nodeId: string): AttributeResult {
    return spendParagonPoint(this.player, nodeId);
  }
}
