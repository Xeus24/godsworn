import { TECHNIQUE_CLASSES, TECHNIQUE_ORDER, TECHNIQUE_RULES } from '../../data/general/techniques';
import type { GameSession } from './gameState';

/**
 * Battle Techniques (Section I-7b, item 212): martial heroes (Warrior, Knight, Brawler, Marshal) learn the 24 techniques in order,
 * four at the start and one more every few levels. They are general combat skills that need no General slot (see `generalCombatSkills`).
 */
export class TechniqueActions {
  constructor(private readonly s: GameSession) {
    s.bus.on('levelUp', (e) => (e.characterId === s.player.id && e.classId === undefined ? this.sync() : undefined));
    s.bus.on('zoneEntered', () => this.sync());
  }

  /** Is the hero one of the martial classes? */
  get martial(): boolean {
    return this.s.player.classes.some((c) => (TECHNIQUE_CLASSES as readonly string[]).includes(c.classId));
  }

  /** How many techniques the hero knows at this level. */
  known(level = this.s.player.level): number {
    return Math.min(TECHNIQUE_ORDER.length, TECHNIQUE_RULES.knownAt1 + Math.floor(level / TECHNIQUE_RULES.everyLevels));
  }

  sync(): void {
    if (!this.martial) return;
    const p = this.s.player;
    const rank = Math.max(1, Math.min(10, 1 + Math.floor(p.level / 6)));
    for (const id of TECHNIQUE_ORDER.slice(0, this.known())) {
      const have = p.generalSkills[id];
      if (have) have.rank = Math.max(have.rank, rank);
      else p.generalSkills[id] = { rank, xp: 0 };
    }
  }
}
