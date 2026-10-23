import { createGameEventBus, type GameEventBus } from '../core/gameEvents';
import { Rng } from '../core/rng';
import { TriggerSystem } from '../effects/triggers';
import { advanceClock, createClock, hourOf, type GameClock } from './clock';

export const GAME_NAME = 'Godsworn';
/** Bumped whenever the saved shape changes; save migrations key off this. */
export const SAVE_VERSION = 1;

export interface SaveMeta {
  game: typeof GAME_NAME;
  version: number;
  createdAt: number;
  playTimeMs: number;
}

/** Everything that is saved. Plain JSON data only. */
export interface GameState {
  meta: SaveMeta;
  seed: number;
  rngState: number;
  clock: GameClock;
  flags: Record<string, boolean | number | string>;
}

export function createGameState(seed: number, now = Date.now()): GameState {
  return {
    meta: { game: GAME_NAME, version: SAVE_VERSION, createdAt: now, playTimeMs: 0 },
    seed: seed >>> 0,
    rngState: seed >>> 0,
    clock: createClock(),
    flags: {},
  };
}

/**
 * Runtime wrapper around the saved state: the live RNG, the event bus and
 * the trigger registry. One per running game.
 */
export class GameSession {
  readonly bus: GameEventBus;
  readonly rng: Rng;
  readonly triggers: TriggerSystem;

  constructor(public state: GameState) {
    this.bus = createGameEventBus();
    this.rng = new Rng(state.rngState);
    this.triggers = new TriggerSystem(this.rng);
  }

  static newGame(seed: number): GameSession {
    const session = new GameSession(createGameState(seed));
    session.bus.emit('gameStarted', { seed: session.state.seed });
    return session;
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

  setFlag(key: string, value: boolean | number | string): void {
    this.state.flags[key] = value;
  }
}
