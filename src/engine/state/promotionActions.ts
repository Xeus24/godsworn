import { content } from '../../data';
import { PROMOTIONS, promotionOf, type PromotionDef } from '../../data/promotions';
import type { ClassProgress } from '../character/types';
import type { GauntletState } from '../endgame/types';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type KResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): KResult => ({ ok: false, reason });

/** Section K: Class Promotions. The tier lives on each of the hero's `ClassProgress` entries (`promotion`: 1 base, 2 or 3). */
export class PromotionActions {
  constructor(private readonly s: GameSession) {
    s.specials['promotion'] = (a, won) => this.fightEnded(a, won);
  }

  private classOf(classId: string): ClassProgress | undefined {
    return this.s.player.classes.find((c) => c.classId === classId);
  }

  tierOf(classId: string): number {
    return this.classOf(classId)?.promotion ?? 1;
  }

  /** The promotion this class would take next, if any. */
  next(classId: string): PromotionDef | undefined {
    return promotionOf(classId, this.tierOf(classId) + 1);
  }

  titleOf(classId: string): string | undefined {
    const t = this.tierOf(classId);
    return t > 1 ? promotionOf(classId, t)?.title : undefined;
  }

  /** Why the next promotion is not ready, or nothing. */
  why(classId: string): string | undefined {
    const p = this.next(classId);
    const c = this.classOf(classId);
    if (!p || !c) return this.tierOf(classId) >= 3 ? 'Fully promoted.' : 'You do not hold that class.';
    if (c.level < p.level) return `Reach class level ${p.level} in ${content.classes.get(classId).name} (now ${c.level}).`;
    return undefined;
  }

  begin(classId: string): KResult {
    const p = this.next(classId);
    const why = this.why(classId);
    if (!p || why) return fail(why ?? 'Nothing to take.');
    const waves = p.tier === 3 ? [[`promo-${classId}-2`]] : [];
    const r = this.s.endgame.startSpecial({ module: 'promotion', ref: p.id, label: `Trial of the ${p.title}`, level: p.level, waves, threat: 0, boss: p.enemy });
    return r.ok ? { ok: true, text: `The Shade of the ${p.title} rises.` } : fail(r.reason);
  }

  private fightEnded(a: GauntletState, won: boolean): void {
    const p = PROMOTIONS.find((x) => x.id === a.special?.ref);
    if (!p) return;
    const c = this.classOf(p.classId);
    if (won && c && this.tierOf(p.classId) < p.tier) {
      c.promotion = p.tier;
      if (!this.s.player.devotion.titles.includes(p.title)) this.s.player.devotion.titles.push(p.title);
      this.s.bus.emit('toast', { kind: 'level', text: `Promoted: you are ${p.title}. Two new skills and a new branch await in the ${content.classes.get(p.classId).name} tree.` });
      // The promotion's skill points: the branch is worth ten nodes, so grant a few to start it.
      c.skillPoints += 3;
      this.s.wonders.refresh();
    } else if (!won) this.s.bus.emit('toast', { kind: 'warning', text: 'Your Shade holds the field. The trial will wait.' });
    this.s.bus.emit('stateChanged', { reason: 'promotion' });
  }

  /** The stat boost of every promotion the hero has earned. */
  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const c of this.s.player.classes) for (let t = 2; t <= (c.promotion ?? 1); t++) out.push(...(promotionOf(c.classId, t)?.boon ?? []));
    return out;
  }
}
