import { content } from '../../data';
import { ALL_ENDINGS } from '../../data/story';
import { DIVINE_SEASONS, FATE_HINTS, OMENS, SEASONS, SPLITS, VEX_CODES, type OmenDef } from '../../data/pilgrimage';
import { completion, overallCompletion } from '../achievements/completion';
import { Rng } from '../core/rng';
import { restoreFull } from '../character/stats';
import { CARDS } from '../../data/minigames/cards';
import { giveCard } from '../minigames/cardGame';
import { createItem } from '../items/generate';
import { evaluate } from '../quests/conditions';
import { omenById, omenMods, omenRule, omensOf, seasonOf, unfairOmens, type PilgrimageState } from '../realm/pilgrimage';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type PResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): PResult => ({ ok: false, reason });

const BIG_FOES = new Set(['elite', 'champion', 'boss', 'miniboss', 'worldBoss', 'punisher']);

/**
 * The Endless Pilgrimage (Innovation Pack, section E): Divine Seasons (29), Omens (31) and the Chronicler's Tools (32), plus the Fates
 * board (34). The Trial of the Day (30) lives with the other gauntlets in EndgameActions. State lives in `realm.pilgrimage`.
 */
export class PilgrimageActions {
  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('combatEnded', (e) => {
      if (e.result === 'victory') this.count('battles', 1);
    });
    bus.on('enemyKilled', (e) => {
      if (BIG_FOES.has(e.tier)) this.count('champions', 1);
    });
    bus.on('favorChanged', (e) => {
      if (e.god === this.season.def.god && e.current > e.previous) this.count('favor', e.current - e.previous);
    });
    bus.on('zoneEntered', (e) => {
      const st = this.sync();
      if (!st.zones.includes(e.zoneId)) {
        st.zones.push(e.zoneId);
        this.count('zones', 0, st.zones.length);
      }
    });
    bus.on('timeChanged', () => this.tick());
  }

  get p(): PilgrimageState {
    return this.s.state.realm.pilgrimage;
  }

  get season() {
    return seasonOf(this.s.state.clock.day);
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  // ------------------------------------------------------------------ 29: Divine Seasons

  /** The current season’s counters, reset when a new god rises. */
  private sync(): PilgrimageState['season'] {
    const cur = this.season.key;
    if (this.p.season.key !== cur) this.p.season = { key: cur, progress: {}, zones: [], paid: false };
    return this.p.season;
  }

  private count(task: string, by: number, set?: number): void {
    const st = this.sync();
    st.progress[task] = set ?? (st.progress[task] ?? 0) + by;
    this.checkSeason();
  }

  seasonProgress(): { id: string; text: string; count: number; have: number }[] {
    const st = this.sync();
    return SEASONS.tasks.map((t) => ({ id: t.id, text: t.text, count: t.count, have: Math.min(t.count, st.progress[t.id] ?? 0) }));
  }

  private checkSeason(): void {
    const st = this.p.season;
    if (st.paid || !this.seasonProgress().every((t) => t.have >= t.count)) return;
    st.paid = true;
    this.p.completed++;
    const gold = SEASONS.goldPerLevel * this.s.player.level;
    this.s.addGold(gold, 'pilgrimage');
    this.s.devotion.apply({ [this.season.def.god]: SEASONS.favor }, 'pilgrimage');
    this.note(`The pilgrimage of ${this.season.def.name} is done: +${gold} gold and favor with ${content.gods.get(this.season.def.god).name}.`, 'level');
    if (this.p.completed >= DIVINE_SEASONS.length && !this.s.player.devotion.titles.includes(SEASONS.title)) {
      this.s.player.devotion.titles.push(SEASONS.title);
      this.note(`Fourteen pilgrimages. Title earned: ${SEASONS.title}.`, 'level');
    }
    this.s.bus.emit('stateChanged', { reason: 'pilgrimage' });
  }

  /** The party and enemy modifiers of the ascendant god, plus every active omen. Used for ordinary fights. */
  partyMods(): ModifierSpec[] {
    return [...this.season.def.party, ...omenMods(this.active()).party];
  }

  enemyMods(): ModifierSpec[] {
    return [...this.season.def.enemy, ...omenMods(this.active()).enemy];
  }

  // ------------------------------------------------------------------ 31: Omens

  active(): string[] {
    return omensOf(this.s.player);
  }

  rule(rule: string): boolean {
    return omenRule(this.active(), rule);
  }

  /** The encounter-rate multiplier of Busy Roads and Quiet Roads. */
  encounterMult(): number {
    return (this.rule('busyRoads') ? 2 : 1) * (this.rule('quietRoads') ? 0.5 : 1);
  }

  /** Whether achievements are switched off: an unfair omen is on, or a code was used. */
  achievementsOff(): boolean {
    return this.p.cheated || unfairOmens(this.active());
  }

  toggleOmen(id: string): PResult {
    const def = omenById(id);
    if (!def) return fail('No such omen.');
    const on = this.p.omens.includes(id);
    this.p.omens = on ? this.p.omens.filter((x) => x !== id) : [...this.p.omens, id];
    this.syncOmens();
    this.s.bus.emit('stateChanged', { reason: 'omens' });
    return { ok: true, text: on ? `${def.name} is lifted.` : `${def.name} is upon the world.${def.fair ? '' : ' Achievements are off while it lasts.'}` };
  }

  /** Keeps the hero's copy (read by combat setup and the UI) in step with the saved list. */
  syncOmens(): void {
    (this.s.player.world as { omens?: string[] }).omens = [...this.p.omens];
  }

  omenDefs(): OmenDef[] {
    return OMENS;
  }

  // ------------------------------------------------------------------ 32: Chronicler's Tools

  /** Splits are timed against play time the first time their condition is true. */
  tick(): void {
    for (const sp of SPLITS) if (this.p.splits[sp.id] === undefined && evaluate(this.s.state, sp.cond)) this.p.splits[sp.id] = this.s.state.meta.playTimeMs;
  }

  /** The 100% tracker: how much of everything there is to do is done. */
  completionPct(): number {
    return overallCompletion(completion(this.s.state));
  }

  codesOpen(): boolean {
    return (this.s.state.legacy.clears?.length ?? 0) > 0 || this.s.state.flags['storyComplete'] === true;
  }

  /** A Vex Code: a prank by the goddess of luck. Opens after the story has been finished once; switches achievements off for this save. */
  enterCode(raw: string): PResult {
    if (!this.codesOpen()) return fail('Vex only whispers codes to heroes who have finished the story once.');
    const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const def = VEX_CODES.find((c) => c.code === code);
    if (!def) return fail('Nothing happens. Somewhere, a goddess is giggling.');
    if (this.p.codes.includes(code)) return fail('Already spent.');
    const s = this.s;
    switch (def.kind) {
      case 'gold':
        s.addGold(def.amount ?? 0, 'vex-code');
        break;
      case 'xp':
        s.grantXp(def.amount ?? 0, true);
        break;
      case 'favor':
        s.devotion.apply(Object.fromEntries(content.gods.all().filter((x) => x.id !== 'nameless').map((g) => [g.id, def.amount ?? 0])), 'vex-code', true);
        break;
      case 'heal':
        s.party.restoreAll();
        restoreFull(s.player);
        break;
      case 'item':
        s.items.receiveLoot([createItem(def.item as string, def.amount ?? 1, () => s.newUid())], 0);
        break;
      case 'cards': {
        const rng = new Rng(s.rng.int(1, 1e9));
        for (let i = 0; i < (def.amount ?? 1); i++) giveCard(s.state.minigames, rng.pick(CARDS).id);
        break;
      }
      case 'day':
        s.advanceTime((def.amount ?? 1) * 24 * 60);
        break;
      case 'omen':
        if (!this.p.omens.includes(def.omen as string)) this.p.omens.push(def.omen as string);
        this.syncOmens();
        break;
    }
    this.p.codes.push(code);
    this.p.cheated = true;
    this.note(def.text, 'quest');
    s.bus.emit('stateChanged', { reason: 'vex-code' });
    return { ok: true, text: def.text };
  }

  // ------------------------------------------------------------------ 34: Fates

  /** Every ending, and whether any of your playthroughs has reached it. */
  fates(): { id: string; name: string; reached: boolean; hint: string }[] {
    const seen = new Set(this.s.state.legacy.endings.map((e) => e.split(':')[0]));
    return ALL_ENDINGS.map((e) => ({ id: e.id, name: e.name, reached: seen.has(e.id), hint: FATE_HINTS[e.id] ?? '' }));
  }
}
