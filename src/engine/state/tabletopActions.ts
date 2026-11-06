import { content } from '../../data';
import { BOONS, BOON_EVERY, BREATHER, NOD_EVENTS, NOD_MAX, STAT_POINTS_INSTEAD, type NodEvent } from '../../data/tabletop';
import { characterStats } from '../character/stats';
import { attitudeIndex } from '../world/prejudice';
import { createTabletop, type TabletopState } from '../realm/marvels';
import { check, combine, dcForMin, describeRoll, statMod, type Roll, type RollMode } from '../tabletop/dice';
import type { GameSession } from './gameState';

export type TResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): TResult => ({ ok: false, reason });

/**
 * The Tabletop Rules (Section I-6, R26): an optional per-save mode (items 190-199 and 210). Everything here is inert unless the hero chose it at creation.
 * State: `realm.marvels.tabletop`; the Boons and the toggle live on the character.
 */
export class TabletopActions {
  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('questComplete', () => this.earn('quest'));
    bus.on('enemyKilled', (e) => e.tier === 'boss' || e.tier === 'worldBoss' ? this.earn('boss') : undefined);
    bus.on('combatEnded', (e) => (e.result === 'victory' ? this.earn('victory') : undefined));
    bus.on('levelUp', (e) => (e.characterId === s.player.id && e.classId === undefined ? this.earn('level') : undefined));
    bus.on('favorChanged', (e) => (e.current > e.previous ? this.earn('favor') : undefined));
    bus.on('goldChanged', (e) => (e.amount >= 100 ? this.earn('gold') : undefined));
    bus.on('stateChanged', (e) => (e.reason === 'rest' ? this.earn('rest') : undefined));
  }

  /** Is the Tabletop Rules mode on for this save? */
  get on(): boolean {
    return this.s.player.tabletop === true;
  }

  get t(): TabletopState {
    const m = this.s.state.realm.marvels;
    return (m.tabletop ??= createTabletop());
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  // ------------------------------------------------------------------ 191, 192: the Fate Die and Favored / Forsaken

  /** Why a roll on this stat is Favored or Forsaken right now: Divine Moods, wounds and Blood Prejudice (flanking is added by the battle). */
  advantage(stat: string): { mode: RollMode; reasons: string[] } {
    const sources: RollMode[] = [];
    const reasons: string[] = [];
    const p = this.s.player;
    const god = p.devotion.patron;
    if (god) {
      const mood = this.s.fellowship.moodIndex(god);
      if (mood >= 3) { sources.push('favored'); reasons.push(`${content.gods.get(god).name} is ${mood === 4 ? 'exalted' : 'pleased'}`); }
      else if (mood <= 0) { sources.push('forsaken'); reasons.push(`${content.gods.get(god).name} is wrathful`); }
    }
    const wounds = this.s.state.realm.marvels.fellowship?.wounds ?? [];
    if (['str', 'dex', 'vit'].includes(stat) && wounds.some((w) => w.until > this.day)) { sources.push('forsaken'); reasons.push('a wound hampers you'); }
    const town = this.s.world.inTown();
    if (stat === 'cha' && town) {
      const a = attitudeIndex(p, town);
      if (a >= 4) { sources.push('favored'); reasons.push('the town welcomes your people'); }
      else if (a <= 0) { sources.push('forsaken'); reasons.push('the town distrusts your people'); }
    }
    return { mode: combine(sources), reasons };
  }

  /** Roll a stat check against a DC. Stores the roll for the display. */
  roll(stat: 'str' | 'dex' | 'int' | 'vit' | 'wis' | 'luk' | 'fai' | 'cha', dc: number, label = 'Fate Die', bonus = 0): Roll {
    const p = this.s.player;
    const mod = statMod(characterStats(p)[stat], p.level) + bonus;
    const { mode, reasons } = this.advantage(stat);
    const r = check(this.s.rng, mod, dc, mode);
    this.t.lastRoll = { ...r, label: `${label} (${stat.toUpperCase()})` };
    this.s.bus.emit('toast', { kind: r.success ? 'info' : 'warning', text: `${describeRoll(r, this.t.lastRoll.label)}${reasons.length ? ` · ${reasons.join(', ')}` : ''}` });
    return r;
  }

  /** The DC a stat requirement of `min` becomes. */
  dc(min: number): number {
    return dcForMin(min);
  }

  // ------------------------------------------------------------------ 193: the God's Nod

  get nods(): number {
    return this.t.nods;
  }

  /** Acting in line with an Ideal, Bond or Flaw earns a Nod, once a day for each. */
  earn(event: NodEvent): void {
    if (!this.on) return;
    const pers = this.s.player.personality;
    if (!pers) return;
    for (const id of [pers.ideal, pers.bond, pers.flaw]) {
      if (!id || NOD_EVENTS[id] !== event || this.t.nodDays[id] === this.day || this.t.nods >= NOD_MAX) continue;
      this.t.nodDays[id] = this.day;
      this.t.nods++;
      this.s.bus.emit('toast', { kind: 'favor', text: `The gods nod: you acted as ${id.replace(/-/g, ' ')}. God’s Nod ${this.t.nods}/${NOD_MAX}.` });
    }
  }

  /** Spend a Nod: true if one was held. */
  spendNod(): boolean {
    if (this.t.nods <= 0) return false;
    this.t.nods--;
    this.s.bus.emit('stateChanged', { reason: 'nod' });
    return true;
  }

  // ------------------------------------------------------------------ 194: Boons

  get boonsPending(): number {
    if (!this.on) return 0;
    const p = this.s.player;
    return Math.max(0, Math.floor(p.level / BOON_EVERY) - (p.boons?.length ?? 0) - (p.boonStatPicks ?? 0));
  }

  takeBoon(id: string): TResult {
    const boon = BOONS.find((b) => b.id === id);
    if (!boon) return fail('No such Boon.');
    if (this.boonsPending <= 0) return fail('You have no Boon to take.');
    const p = this.s.player;
    if (p.boons?.includes(id)) return fail('You already have that Boon.');
    p.boons = [...(p.boons ?? []), id];
    this.s.bus.emit('stateChanged', { reason: 'boon' });
    return { ok: true, text: `Boon: ${boon.name}.` };
  }

  takeStatPoints(): TResult {
    if (this.boonsPending <= 0) return fail('You have no Boon to trade.');
    const p = this.s.player;
    p.boonStatPicks = (p.boonStatPicks ?? 0) + 1;
    p.attributePoints += STAT_POINTS_INSTEAD;
    this.s.bus.emit('stateChanged', { reason: 'boon' });
    return { ok: true, text: `+${STAT_POINTS_INSTEAD} stat points.` };
  }

  // ------------------------------------------------------------------ 199: Breather and Night's Rest

  get breathersLeft(): number {
    const b = this.t.breathers;
    return b.day === this.day ? Math.max(0, BREATHER.perDay - b.n) : BREATHER.perDay;
  }

  /** A short rest: some HP and MP back, an hour gone, twice a day. The full rest is the Night's Rest (camp or inn). */
  breather(): TResult {
    if (!this.on) return fail('The Breather belongs to the Tabletop Rules.');
    if (this.breathersLeft <= 0) return fail('You have taken two Breathers today. A Night’s Rest is needed.');
    const p = this.s.player;
    const st = characterStats(p);
    p.hp = Math.min(st.maxHp, p.hp + Math.round((st.maxHp * BREATHER.hpPct) / 100));
    p.mp = Math.min(st.maxMp, p.mp + Math.round((st.maxMp * BREATHER.mpPct) / 100));
    const b = this.t.breathers;
    this.t.breathers = { day: this.day, n: (b.day === this.day ? b.n : 0) + 1 };
    this.s.advanceTime(BREATHER.minutes);
    this.s.bus.emit('stateChanged', { reason: 'breather' });
    return { ok: true, text: `You take a Breather: ${BREATHER.hpPct}% of your health and mana return.` };
  }

  /** The full rest resets the day's Breathers. (Camp, inn and home rests all call this.) */
  nightsRest(): void {
    if (this.on) this.t.breathers = { day: this.day, n: 0 };
  }

  // ------------------------------------------------------------------ 210: Passive Perception

  /** 10 + half WIS + proficiency. */
  get passivePerception(): number {
    const p = this.s.player;
    return 10 + statMod(characterStats(p).wis, p.level);
  }
}
