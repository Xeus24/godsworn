import { content } from '../../data';
import { HOLDINGS, type HoldingDef } from '../../data/holdings';
import { createGrace, type GraceState } from '../realm/marvels';
import { restoreFull } from '../character/stats';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type GResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): GResult => ({ ok: false, reason });
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** Section I-7c: Holdings (221) and Divine Intervention's weekly call and Last Prayer (222). State: `realm.marvels.grace`. */
export class GraceActions {
  static readonly WEEK = 7;

  constructor(private readonly s: GameSession) {
    const sync = (): void => this.sync();
    s.bus.on('favorChanged', sync);
    s.bus.on('levelUp', sync);
    s.bus.on('timeChanged', sync);
    s.bus.on('stateChanged', (e) => (e.reason === 'patron' ? sync() : undefined));
  }

  get t(): GraceState {
    const m = this.s.state.realm.marvels;
    return (m.grace ??= createGrace());
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  // ------------------------------------------------------------------ 222: Divine Intervention

  private mood(): number {
    const god = this.s.player.devotion.patron;
    return god ? this.s.fellowship.moodIndex(god) : 0;
  }

  /** The chance (%) a god answers: level and the god’s mood. */
  callChance(): number {
    return clamp(Math.round(25 + this.s.player.level * 0.7 + this.mood() * 9), 5, 90);
  }

  /** The Last Prayer’s chance (%); kept on the character so a battle can read it. */
  lastPrayerChance(): number {
    return clamp(Math.round(45 + this.mood() * 10 + this.s.player.level * 0.4), 30, 95);
  }

  /** Keeps the Last Prayer chance on the character current. */
  sync(): void {
    const d = this.s.player.devotion;
    const want = d.patron && !d.lastPrayerUsed ? this.lastPrayerChance() : undefined;
    if (d.lastPrayerChance !== want) d.lastPrayerChance = want;
  }

  get callReady(): boolean {
    return this.day - this.t.lastCall >= GraceActions.WEEK;
  }

  get daysToCall(): number {
    return Math.max(0, GraceActions.WEEK - (this.day - this.t.lastCall));
  }

  /** Once a week, call on your patron: if they answer you are restored and blessed for three battles. */
  callOnGod(): GResult {
    const p = this.s.player;
    const god = p.devotion.patron;
    if (!god) return fail('You have no patron to call on.');
    if (!this.callReady) return fail(`Your god has been called on this week: ${this.daysToCall} day${this.daysToCall === 1 ? '' : 's'} left.`);
    this.t.lastCall = this.day;
    const name = content.gods.get(god).name;
    if (!this.s.rng.percent(this.callChance())) {
      this.changed('grace');
      return { ok: true, text: `You call on ${name}. The answer is silence (${this.callChance()}% was the chance). Try again in a week.` };
    }
    restoreFull(p);
    this.s.afflictions.addWeary(-2, 'Your god lifts the weight.');
    this.s.afflictions.addWhisper(-30, 'A clean wind clears your head.');
    p.timedBuffs = [...p.timedBuffs.filter((b) => b.id !== 'divine-aid'), { id: 'divine-aid', name: `Aid of ${name}`, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 12 }, { stat: 'defense', type: 'percent', value: 12 }, { stat: 'hpRegen', type: 'flat', value: 3 }], battlesLeft: 3, god }];
    this.t.answered++;
    this.changed('grace');
    return { ok: true, text: `${name} answers. You are made whole, and blessed for three battles.` };
  }

  // ------------------------------------------------------------------ 221: Holdings

  holding(classId: string): HoldingDef | undefined {
    return HOLDINGS.find((h) => h.classId === classId);
  }

  levelOf(classId: string): number {
    return this.t.holdings[classId] ?? 0;
  }

  /** The holdings the hero may build: those of their own classes. */
  mine(): HoldingDef[] {
    return this.s.player.classes.map((c) => this.holding(c.classId)).filter((h): h is HoldingDef => h !== undefined);
  }

  /** Why the next level cannot be built yet, or undefined if it can. */
  why(classId: string): string | undefined {
    const h = this.holding(classId);
    if (!h) return 'No such building.';
    if (!this.s.player.classes.some((c) => c.classId === classId)) return 'Only your own classes have a hall here.';
    const lvl = this.levelOf(classId);
    if (lvl >= 3) return 'It is as grand as it will be.';
    if (!this.s.realm.inEmberfall()) return 'You build in Ashfold, which is becoming Emberfall.';
    if (lvl >= 1 && this.s.state.flags[`holding-done:${classId}:${lvl + 1}`] !== true) return 'The ground must be made safe first: see the Holdings quest.';
    const [gold, timber, stone] = h.costs[lvl] as [number, number, number];
    const v = this.s.realm.village;
    if (this.s.state.gold < gold) return `It costs ${gold} gold.`;
    if (v.timber < timber) return `It needs ${timber} timber (the village has ${v.timber}).`;
    if (v.stone < stone) return `It needs ${stone} stone (the village has ${v.stone}).`;
    return undefined;
  }

  build(classId: string): GResult {
    const reason = this.why(classId);
    if (reason) return fail(reason);
    const h = this.holding(classId) as HoldingDef;
    const lvl = this.levelOf(classId);
    const [gold, timber, stone] = h.costs[lvl] as [number, number, number];
    this.s.spendGold(gold, 'holding');
    const v = this.s.realm.village;
    v.timber -= timber;
    v.stone -= stone;
    this.t.holdings[classId] = lvl + 1;
    if (lvl + 1 < 3) this.s.setFlag(`holding-open:${classId}:${lvl + 2}`, true);
    this.changed('holding');
    return { ok: true, text: `${h.name} ${lvl === 0 ? 'is built' : `is raised to level ${lvl + 1}`}.` };
  }

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const [classId, lvl] of Object.entries(this.t.holdings)) {
      const h = this.holding(classId);
      if (h && lvl > 0) out.push(...(h.mods[lvl - 1] as ModifierSpec[]));
    }
    return out;
  }
}
