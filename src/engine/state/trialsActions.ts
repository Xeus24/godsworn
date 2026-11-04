import { content } from '../../data';
import { festivalOn } from '../realm/wheel';
import { DIVING, DREAMS, FEARS, HUNTS, ISLANDS, QUARRIES, RIVALS, SKY, TILTS, TOURNAMENT, WRECKS, type Tilt } from '../../data/trials';
import { ZONE_WATERS } from '../../data/minigames/fish';
import { dateOf } from '../realm/wheel';
import { Rng } from '../core/rng';
import type { GauntletState } from '../endgame/types';
import { createItem } from '../items/generate';
import { createTrials, type TrialsState } from '../realm/marvels';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type TResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): TResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

/**
 * Duel Tournaments (43), Dreamscape Dungeons (55), Moon-Blood Hunts (56), Shipwreck Diving (57) and Sky Islands (54).
 * The first three run on the generic special gauntlet. State: `realm.marvels.trials`.
 */
export class TrialsActions {
  constructor(private readonly s: GameSession) {
    s.specials['tournament'] = (a, won) => this.tournamentEnded(a, won);
    s.specials['dream'] = (a, won) => this.dreamEnded(a, won);
    s.specials['hunt'] = (a, won) => this.huntEnded(a, won);
  }

  get t(): TrialsState {
    const m = this.s.state.realm.marvels;
    return (m.trials ??= createTrials());
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const id of Object.keys(this.t.dreams)) if ((this.t.dreams[id] ?? 0) > 0) out.push(DREAMS.mod);
    for (const isl of ISLANDS) if (this.t.islands[isl.id]?.solved) out.push(...isl.reward);
    return out;
  }

  /** Enemies of the given creature types near a level, widening the band until there are enough. */
  private foes(types: readonly string[], level: number, tiers: readonly string[], want = 3): string[] {
    for (let band = 8; band <= 60; band += 12) {
      const pool = content.enemies.filter((e) => e.types.some((t) => types.includes(t)) && tiers.includes(e.tier) && !e.types.includes('mentor') && !e.types.includes('follower') && Math.abs(e.level - level) <= band);
      if (pool.length >= want) return pool.map((e) => e.id);
    }
    return content.enemies.filter((e) => tiers.includes(e.tier) && Math.abs(e.level - level) <= 30).map((e) => e.id);
  }

  // ------------------------------------------------------------------ 43: Duel Tournaments

  tournamentOpen(): TResult {
    const day = this.s.state.clock.day;
    const f = festivalOn(day);
    if (f?.id !== TOURNAMENT.festival) return fail('The Hundred Duels are held once a year, on their festival day.');
    if (!this.s.world.inTown()) return fail('Enter your name in a town.');
    if (this.s.player.level < TOURNAMENT.minLevel) return fail(`Entrants must be level ${TOURNAMENT.minLevel}.`);
    if (this.t.tournament.entered === dateOf(day).year) return fail('You have entered this year’s bracket already.');
    return { ok: true };
  }

  enterTournament(): TResult {
    const open = this.tournamentOpen();
    if (!open.ok) return open;
    const year = dateOf(this.s.state.clock.day).year;
    const rng = new Rng(hash(`tournament:${year}:${this.s.player.name}`));
    const rivals = rng.sample(RIVALS, TOURNAMENT.rounds);
    const pool = this.foes(['humanoid'], this.s.player.level, ['normal', 'elite']);
    const picks = rivals.map(() => rng.pick(pool));
    const r = this.s.endgame.startSpecial({
      module: 'tournament',
      ref: String(year),
      label: `The Hundred Duels (${rivals.join(', ')})`,
      level: this.s.player.level + TOURNAMENT.rivalLevelBonus,
      waves: picks.slice(0, TOURNAMENT.rounds - 1).map((id) => [id]),
      boss: picks[TOURNAMENT.rounds - 1] as string,
      threat: 10,
    });
    if (!r.ok) return r;
    this.t.tournament.entered = year;
    this.t.tournament.bracket = { year, rivals };
    this.s.bus.emit('stateChanged', { reason: 'tournament' });
    return { ok: true, text: `You face ${rivals[0]} in the quarter-final.` };
  }

  private tournamentEnded(a: GauntletState, won: boolean): void {
    const rounds = won ? TOURNAMENT.rounds : a.wave;
    this.t.tournament.rounds += rounds;
    const gold = TOURNAMENT.goldPerLevelPerRound * this.s.player.level * rounds;
    if (gold) this.s.addGold(gold, 'tournament');
    if (won) {
      const year = this.t.tournament.bracket?.year ?? dateOf(this.s.state.clock.day).year;
      if (!this.t.tournament.champion.includes(year)) this.t.tournament.champion.push(year);
      const prize = TOURNAMENT.champion.goldPerLevel * this.s.player.level;
      this.s.addGold(prize, 'tournament');
      if (!this.s.player.devotion.titles.includes(TOURNAMENT.champion.title)) this.s.player.devotion.titles.push(TOURNAMENT.champion.title);
      this.note(`Champion of the Hundred Duels! +${gold + prize} gold.`, 'level');
    } else this.note(`Knocked out after ${rounds} round${rounds === 1 ? '' : 's'}: +${gold} gold.`, rounds ? 'info' : 'warning');
    this.changed('tournament');
  }

  // ------------------------------------------------------------------ 55: Dreamscape Dungeons

  fearOf(companion: string): (typeof FEARS)[number] | undefined {
    return FEARS.find((f) => f.companion === companion);
  }

  recruited(): string[] {
    return FEARS.filter((f) => { const c = this.s.state.party.companions[f.companion]; return !!c && !c.left; }).map((f) => f.companion);
  }

  enterDream(companion: string): TResult {
    const fear = this.fearOf(companion);
    if (!fear) return fail('No such friend.');
    const c = this.s.state.party.companions[companion];
    if (!c || c.left) return fail('They are not with you.');
    if (!this.s.world.inTown()) return fail('Dreams are entered at an inn, in a town.');
    const rng = new Rng(hash(`dream:${companion}:${this.t.dreams[companion] ?? 0}`));
    const lvl = this.s.player.level;
    const common = this.foes(fear.types, lvl, ['normal']);
    const big = this.foes(fear.types, lvl, ['elite', 'champion', 'boss', 'miniboss'], 1);
    const wave = (n: number): string[] => Array.from({ length: n }, () => rng.pick(common));
    const r = this.s.endgame.startSpecial({ module: 'dream', ref: companion, label: `${content.companions.get(companion).name}’s dream: ${fear.fear}`, level: lvl + 1, waves: [wave(2), wave(3), wave(3)], boss: rng.pick(big), threat: 8 });
    return r.ok ? { ok: true, text: fear.text } : r;
  }

  private dreamEnded(a: GauntletState, won: boolean): void {
    const id = a.special?.ref ?? '';
    const fear = this.fearOf(id);
    if (!won || !fear) {
      this.note('You wake with the dream still pressing at your ribs.', 'warning');
      return;
    }
    const first = !(this.t.dreams[id] ?? 0);
    this.t.dreams[id] = (this.t.dreams[id] ?? 0) + 1;
    if (first) {
      this.s.party.adjust(id, DREAMS.approval);
      this.note(fear.reward, 'level');
      if (Object.values(this.t.dreams).filter((n) => n > 0).length >= FEARS.length && !this.s.player.devotion.titles.includes(DREAMS.title)) this.s.player.devotion.titles.push(DREAMS.title);
    } else this.note('The dream goes quiet again.', 'info');
    this.changed('dream');
  }

  // ------------------------------------------------------------------ 56: Moon-Blood Hunts

  bloodMoon(): boolean {
    return this.s.timeOfDay === 'night' && (this.s.world.weatherNow() === 'blood-moon' || this.s.pilgrimage.rule('bloodMoon'));
  }

  startHunt(id: string): TResult {
    const q = QUARRIES.find((x) => x.id === id);
    if (!q) return fail('No such quarry.');
    if (!this.bloodMoon()) return fail('They walk only under a Blood Moon, at night.');
    if (this.s.player.level < HUNTS.minLevel) return fail(`Hunters must be level ${HUNTS.minLevel}.`);
    const lvl = this.s.player.level;
    const rng = new Rng(hash(`hunt:${id}:${this.s.state.clock.day}`));
    const kin = this.foes(q.types, lvl, ['normal']);
    const big = this.foes(q.types, lvl, ['elite', 'champion', 'boss', 'miniboss'], 1);
    const r = this.s.endgame.startSpecial({ module: 'hunt', ref: id, label: `Moon-Blood Hunt: ${q.name}`, level: lvl + 2, waves: [[rng.pick(kin), rng.pick(kin)], [rng.pick(kin), rng.pick(kin), rng.pick(kin)]], boss: rng.pick(big), threat: 12 + QUARRIES.indexOf(q) * 2 });
    return r.ok ? { ok: true, text: q.text } : r;
  }

  private huntEnded(a: GauntletState, won: boolean): void {
    const q = QUARRIES.find((x) => x.id === a.special?.ref);
    if (!won || !q) {
      this.note('The red moon watches you leave. The quarry is still out there.', 'warning');
      return;
    }
    this.t.hunts[q.id] = (this.t.hunts[q.id] ?? 0) + 1;
    const gold = Math.round(HUNTS.goldPerLevel * this.s.player.level * (1 + QUARRIES.indexOf(q) * 0.1));
    this.s.items.receiveLoot([createItem('rift-map', HUNTS.riftMaps, () => this.s.newUid())], gold);
    this.note(`${q.name} is down: +${gold} gold and a Rift Map.`, 'level');
    if (Object.values(this.t.hunts).filter((n) => n > 0).length >= QUARRIES.length && !this.s.player.devotion.titles.includes(HUNTS.title)) this.s.player.devotion.titles.push(HUNTS.title);
    this.changed('hunt');
  }

  // ------------------------------------------------------------------ 57: Shipwreck Diving

  /** Wrecks you can reach here: the sea beside the region you are in. */
  wrecksHere(): typeof WRECKS {
    const zone = this.s.world.zone.id;
    return WRECKS.filter((w) => w.zone === zone && (ZONE_WATERS[zone] ?? []).length > 0);
  }

  startDive(id: string): TResult {
    const w = WRECKS.find((x) => x.id === id);
    if (!w) return fail('No such wreck.');
    if (this.t.dives.active) return fail('You are already under.');
    if (this.s.world.zone.id !== w.zone) return fail('That wreck lies in another region.');
    if (this.s.player.level < DIVING.minLevel) return fail(`Divers must be level ${DIVING.minLevel}.`);
    this.t.dives.active = { wreck: id, air: DIVING.air, haul: 0, seed: this.s.rng.int(1, 1e9), turn: 0, log: [`You go down to ${w.name}. ${w.text}`] };
    this.s.bus.emit('stateChanged', { reason: 'dive' });
    return { ok: true };
  }

  /** One breath of the dive: shallow search (safe, small), deep search (costly, rich, risky), or back up with the haul. */
  diveStep(action: 'shallow' | 'deep' | 'surface'): TResult {
    const d = this.t.dives.active;
    if (!d) return fail('You are not diving.');
    const w = WRECKS.find((x) => x.id === d.wreck)!;
    if (action === 'surface') return this.surface(false);
    const rng = new Rng(d.seed + d.turn * 31);
    d.turn++;
    const cost = action === 'deep' ? 2 : 1;
    d.air -= cost;
    let line: string;
    if (action === 'shallow') {
      if (rng.chance(0.08)) {
        d.air -= 1;
        line = 'A moray objects. You lose a breath getting away.';
      } else if (rng.chance(0.7)) {
        const g = DIVING.goldPerDepth * w.depth * rng.int(1, 2);
        d.haul += g;
        line = `Among the planking: ${g} gold worth of salvage.`;
      } else line = 'Silt and old rope.';
    } else if (rng.chance(0.2)) {
      const lost = Math.floor(d.haul / 4);
      d.haul -= lost;
      line = `The wreck shifts. Some of your haul is gone (${lost}).`;
    } else if (rng.chance(0.55)) {
      const g = DIVING.goldPerDepth * w.depth * rng.int(3, 5);
      d.haul += g;
      line = `Deep in the hold: ${g} gold worth of cargo.`;
      if (rng.chance(DIVING.shardChance)) this.s.relics.grantShard();
    } else line = 'The hold is empty, and very dark.';
    d.log.push(line);
    if (d.air <= 0) return this.surface(true);
    this.s.bus.emit('stateChanged', { reason: 'dive' });
    return { ok: true, text: `${line} (${d.air} breaths left)` };
  }

  private surface(panic: boolean): TResult {
    const d = this.t.dives.active!;
    const w = WRECKS.find((x) => x.id === d.wreck)!;
    const gold = panic ? Math.floor(d.haul / 2) : d.haul;
    delete this.t.dives.active;
    this.t.dives.best[w.id] = Math.max(this.t.dives.best[w.id] ?? 0, gold);
    if (gold) this.s.addGold(gold, 'diving');
    this.s.advanceTime(60);
    if (Object.values(this.t.dives.best).filter((n) => n > 0).length >= WRECKS.length && !this.s.player.devotion.titles.includes(DIVING.title)) this.s.player.devotion.titles.push(DIVING.title);
    this.changed('dive');
    return { ok: true, text: panic ? `Out of air: you claw to the surface with half your haul (${gold} gold).` : `You surface with ${gold} gold.` };
  }

  // ------------------------------------------------------------------ 54: Sky Islands

  private pattern(id: string): Tilt[] {
    const rng = new Rng(hash(`sky:${id}`));
    return Array.from({ length: SKY.steps }, () => rng.pick(TILTS));
  }

  skyOpen(): boolean {
    return !!this.s.player.world.ship?.airship;
  }

  /** What the island shows of its pattern: one more step is revealed for every failed try. */
  hint(id: string): string[] {
    const p = this.pattern(id);
    const known = Math.min(SKY.steps, this.t.islands[id]?.attempts ?? 0);
    return p.map((tilt, i) => (i < known ? `Step ${i + 1}: the island leans ${tilt}.` : `Step ${i + 1}: unknown.`));
  }

  tryIsland(id: string, seq: Tilt[]): TResult {
    const isl = ISLANDS.find((x) => x.id === id);
    if (!isl) return fail('No such island.');
    if (!this.skyOpen()) return fail('Only an airship can reach the Sky Islands.');
    if (this.s.player.level < isl.minLevel) return fail(`Level ${isl.minLevel} to land here.`);
    const st = (this.t.islands[id] ??= { attempts: 0, solved: false });
    if (st.solved) return fail('You have walked this island.');
    if (seq.length !== SKY.steps || seq.some((x) => !TILTS.includes(x))) return fail(`Choose ${SKY.steps} tilts.`);
    const p = this.pattern(id);
    const right = seq.filter((x, i) => x === p[i]).length;
    this.s.advanceTime(90);
    if (right < SKY.steps) {
      st.attempts++;
      this.s.bus.emit('stateChanged', { reason: 'sky' });
      return { ok: true, text: `You are flung off the island (${right} of ${SKY.steps} tilts were right). It gives something away.` };
    }
    st.solved = true;
    const gold = isl.goldPerLevel * this.s.player.level;
    this.s.addGold(gold, 'sky-island');
    this.s.relics.grantShard();
    if (ISLANDS.every((x) => this.t.islands[x.id]?.solved) && !this.s.player.devotion.titles.includes(SKY.title)) this.s.player.devotion.titles.push(SKY.title);
    this.changed('sky');
    return { ok: true, text: `The island settles and lets you walk it. +${gold} gold and a gift of the air.` };
  }
}
