import { content } from '../../data';
import type { XpMode } from '../character/multiclassTypes';
import { addClass, recordTrial, setXpSplit, unlockHybrid, type MulticlassResult } from '../character/multiclass';
import type { GameSession } from './gameState';

/** Class trainers, the XP split and hybrid prestige classes on a running game. */
export class MulticlassActions {
  constructor(private readonly s: GameSession) {}

  private done(result: MulticlassResult, reason: string): MulticlassResult {
    if (result.ok) this.s.bus.emit('stateChanged', { reason });
    return result;
  }

  addClass(classId: string): MulticlassResult {
    const result = addClass(this.s.player, classId, this.s.state.ngPlus);
    if (result.ok) {
      const name = content.classes.get(classId).name;
      this.s.bus.emit('toast', { kind: 'level', text: `You take up the ${name} class. It gets 25% of class XP; change the split on the character sheet.` });
    }
    return this.done(result, 'multiclass');
  }

  setSplit(weights: number[]): MulticlassResult {
    return this.done(setXpSplit(this.s.player, weights), 'xpSplit');
  }

  setMode(mode: XpMode): MulticlassResult {
    this.s.player.xpMode = mode;
    return this.done({ ok: true }, 'xpSplit');
  }

  unlockHybrid(hybridId: string): MulticlassResult {
    const result = unlockHybrid(this.s.player, hybridId);
    if (result.ok) this.s.bus.emit('toast', { kind: 'level', text: `Hybrid unlocked: ${content.hybrids.get(hybridId).name}! Its tree is in the Skills screen.` });
    return this.done(result, 'hybrid');
  }

  /** Called after a victory: marks trials as won and says what they unlock. */
  recordVictory(encounterId: string | undefined): boolean {
    if (!encounterId || !recordTrial(this.s.player, encounterId)) return false;
    const trial = content.classTrials.all().find((t) => t.encounter === encounterId);
    const hybrid = content.hybrids.all().find((h) => h.trial === encounterId);
    const what = trial ? `the ${content.classes.get(trial.classId).name} class` : hybrid ? `the ${hybrid.name} hybrid` : 'a new path';
    this.s.bus.emit('toast', { kind: 'level', text: `Trial won! You may now take up ${what} at the trainers.` });
    return true;
  }
}
