import { EventBus } from './events';

/**
 * Every event the engine publishes. Payloads carry ids rather than objects
 * so listeners look up current state themselves.
 */
export interface GameEvents {
  gameStarted: { seed: number };
  levelUp: { characterId: string; classId?: string; level: number };
  xpGained: { characterId: string; amount: number };
  itemLooted: { itemId: string; baseId: string; rarity: string };
  itemEquipped: { characterId: string; itemId: string; slot: string };
  goldChanged: { amount: number; total: number; reason: string };
  favorChanged: { god: string; previous: number; current: number; reason: string };
  devotionTierChanged: { god: string; previous: string; current: string };
  blessingGranted: { god: string; blessingId: string };
  blessingExpired: { god: string; blessingId: string };
  apostleAscension: { god: string };
  apostasy: { god: string };
  questStarted: { questId: string };
  questProgress: { questId: string; objectiveId: string; progress: number; required: number };
  questComplete: { questId: string };
  skillLearned: { characterId: string; skillId: string; rank: number };
  achievementUnlocked: { achievementId: string };
  combatStarted: { encounterId: string };
  combatEnded: { encounterId: string; result: 'victory' | 'defeat' | 'fled' };
  enemyKilled: { enemyId: string; tier: string };
  zoneEntered: { zoneId: string };
  timeChanged: { day: number; hour: number };
  /** Generic "something changed, redraw" signal for UI (debug cheats, respecs...). */
  stateChanged: { reason: string };
  toast: { kind: 'info' | 'loot' | 'level' | 'favor' | 'blessing' | 'quest' | 'warning' | 'achievement'; text: string };
}

export type GameEventBus = EventBus<GameEvents>;

export function createGameEventBus(): GameEventBus {
  return new EventBus<GameEvents>();
}
