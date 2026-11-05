import { content } from '../../data';
import { ARCHIVE, CONCLAVE, DOMAINS, EPILOGUE, FADE, FLOCK, GOD_ZONES, PRAYERS, RITES, UNSWORN, WAR, type Rite } from '../../data/twilight';
import type { GauntletState } from '../endgame/types';
import { Rng } from '../core/rng';
import { characterStats } from '../character/stats';
import { createTwilight, type TwilightState } from '../realm/marvels';
import { lift, fortuneOf } from '../realm/fortunes';
import { hierarchy } from '../realm/grudge';
import { silenceFestivals } from '../realm/wheel';
import { investmentLevel } from '../world/investments';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type XResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): XResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);

/**
 * The late game: Twilight Scars (157), the Twilight of the Wheel (158), the Last Rites (159), the Unsworn Ending (160), Your Flock (161),
 * the Grudgebound Conclave (163) and the War of the Wheel (164). State: `realm.marvels.twilight`.
 */
export class TwilightActions {
  constructor(private readonly s: GameSession) {
    s.specials['twilight'] = (a, won) => this.fought(a, won);
    s.bus.on('timeChanged', (e) => this.daily(e.day));
  }

  get t(): TwilightState {
    const m = this.s.state.realm.marvels;
    return (m.twilight ??= createTwilight());
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  private title(t: string): void {
    if (!this.s.player.devotion.titles.includes(t)) this.s.player.devotion.titles.push(t);
  }

  private roll(seed: string, stat: string): number {
    const stats = characterStats(this.s.player) as unknown as Record<string, number>;
    return new Rng(hash(seed)).int(1, 20) + Math.floor((stats[stat] ?? 10) / 2) - 3;
  }

  ng(): boolean {
    return this.s.state.ngPlus >= 1;
  }

  mods(): ModifierSpec[] {
    return Object.entries(this.t.rites).filter(([, r]) => r === 'inherited').map(([g]) => DOMAINS[g]![1]);
  }

  // ------------------------------------------------------------------ 157-158: scars and the Wheel

  gods(): string[] {
    return Object.keys(GOD_ZONES);
  }

  /** How far a god has faded, 0 to 100. Saved gods are restored; released and inherited ones are gone. */
  fade(god: string): number {
    const rite = this.t.rites[god];
    if (rite === 'saved') return 0;
    if (rite) return 100;
    if (!this.ng() || !this.t.start) return 0;
    return Math.min(100, Math.max(0, Math.floor((this.s.state.clock.day - this.t.start) / FADE.daysPerPoint)));
  }

  scar(god: string): string {
    const f = this.fade(god);
    const hit = [...FADE.stages].reverse().find(([n]) => f >= n);
    return hit ? hit[1] : 'The region is unmarked, for now.';
  }

  dying(god: string): boolean {
    return !this.t.rites[god] && this.fade(god) >= FADE.dying;
  }

  /** Kindred Bonds with a fading god stop growing. */
  frozen(god: string): boolean {
    return this.fade(god) >= FADE.bondFrozenAt && this.t.rites[god] !== 'saved';
  }

  townsOf(god: string): string[] {
    return content.towns.all().filter((t) => t.temple.includes(god)).map((t) => t.id);
  }

  private daily(day: number): void {
    const t = this.t;
    if (this.ng() && !t.start) t.start = day;
    silenceFestivals(new Set(this.gods().filter((g) => this.t.rites[g] !== 'saved' && this.fade(g) >= FADE.festivalGoneAt)));
    if (this.ng() && t.start && t.flock.day !== day) {
      const st = this.s.state.realm.fortunes;
      for (const g of this.gods()) {
        const f = this.fade(g);
        if (f < FADE.stages[0]![0] || this.t.rites[g]) continue;
        for (const town of this.townsOf(g)) if (fortuneOf(st, town).prosperity > 15 && !fortuneOf(st, town).fallen) lift(st, town, -FADE.townLossPerDay * (f / 100), day);
      }
    }
    this.flockDaily(day);
    this.conclaveDaily(day);
  }

  // ------------------------------------------------------------------ 159: the Last Rites

  rite(god: string, choice: Rite): XResult {
    if (!GOD_ZONES[god]) return fail('No such god.');
    if (this.t.rites[god]) return fail('Their rites are done.');
    if (!this.dying(god)) return fail(`${cap(god)} is not dying yet (fade ${this.fade(god)} of ${FADE.dying}).`);
    const name = content.gods.get(god).name;
    this.t.rites[god] = choice;
    const day = this.s.state.clock.day;
    if (choice === 'saved') this.s.devotion.apply({ [god]: RITES.reviveFavor }, 'last rites');
    if (choice === 'released') for (const town of this.townsOf(god)) lift(this.s.state.realm.fortunes, town, RITES.releaseProsperity, day);
    this.t.slides[god] = EPILOGUE[choice](name);
    if (this.gods().every((g) => this.t.rites[g])) this.title('Keeper of the Last Rites');
    this.changed('rites');
    return { ok: true, text: `${name}: ${choice}. ${this.t.slides[god]![0]}` };
  }

  /** An inherited god’s enemies become yours: their Aspect can be fought again for a prize. */
  domainTrial(god: string): XResult {
    if (this.t.rites[god] !== 'inherited') return fail('You have not inherited that god.');
    const id = `aspect-${god}`;
    if (!content.enemies.find(id)) return fail('Their Aspect is gone.');
    const r = this.s.endgame.startSpecial({ module: 'twilight', ref: `domain:${god}`, label: `${content.gods.get(god).name}’s old enemy`, level: this.s.player.level + 1, waves: [], boss: id, threat: 0 });
    return r.ok ? { ok: true, text: 'The old enemy answers.' } : { ok: false, reason: r.reason };
  }

  // ------------------------------------------------------------------ 160: the Unsworn Ending

  canUnsworn(): XResult {
    if (this.t.unsworn.done) return fail('You have already walked it.');
    if (this.s.state.flags['forsworn'] !== true) return fail('Only the Forsworn can walk the Unsworn King’s path.');
    if (this.s.oaths.o.pages.length < UNSWORN.needsPages) return fail(`You have ${this.s.oaths.o.pages.length} of the ${UNSWORN.needsPages} Lineage pages.`);
    if (!this.s.oaths.cipherDone()) return fail('The Cipher is not whole.');
    return { ok: true, text: '' };
  }

  walkUnsworn(): XResult {
    const ok = this.canUnsworn();
    if (!ok.ok) return ok;
    const u = this.t.unsworn;
    if (u.step < UNSWORN.steps.length) return { ok: true, text: UNSWORN.steps[u.step++] as string };
    const r = this.s.endgame.startSpecial({ module: 'twilight', ref: 'unsworn', label: 'The Last Refusal', level: this.s.player.level + 2, waves: [], boss: 'dread-king', threat: 6 });
    return r.ok ? { ok: true, text: 'The last of the gods’ champions bars the doorway.' } : { ok: false, reason: r.reason };
  }

  // ------------------------------------------------------------------ 161: Your Flock

  flockOn(): boolean {
    return this.ng() || this.t.flock.on;
  }

  private flockDaily(day: number): void {
    const fl = this.t.flock;
    if (!this.flockOn() || fl.day === day) return;
    if (!fl.on) {
      fl.on = true;
      fl.followers = FLOCK.start;
    }
    fl.day = day;
    fl.prayers = fl.prayers.filter((p) => {
      if (day - p.day < FLOCK.expireDays) return true;
      fl.lost++;
      fl.followers = Math.max(0, fl.followers - FLOCK.driftLoss);
      this.note('A prayer went unanswered, and a follower drifts away.', 'warning');
      return false;
    });
    const rng = new Rng(hash(`prayer:${day}`));
    if (fl.prayers.length < FLOCK.maxPrayers && fl.followers > 0 && rng.chance(FLOCK.prayerChance)) {
      const free = PRAYERS.filter((p) => !fl.prayers.some((x) => x.id === p.id));
      fl.prayers.push({ id: rng.pick(free).id, day });
    }
    this.s.state.realm.village.coffers += fl.followers * FLOCK.tithePerFollower;
  }

  prayer(id: string) {
    return PRAYERS.find((p) => p.id === id);
  }

  /** Answer a prayer: pay, roll, or simply go. Answering brings followers; every second one adds a believer. */
  answer(id: string): XResult {
    const fl = this.t.flock;
    const p = this.prayer(id);
    const at = fl.prayers.findIndex((x) => x.id === id);
    if (!p || at < 0) return fail('That prayer is not waiting.');
    if (p.kind === 'gold') {
      const cost = (p.cost ?? 5) * this.s.player.level;
      if (!this.s.spendGold(cost, 'flock')) return fail(`It costs ${cost} gold.`);
    } else if (p.kind === 'check' && this.roll(`flock:${id}:${this.s.state.clock.day}`, p.stat ?? 'cha') < (p.dc ?? 12)) {
      fl.prayers.splice(at, 1);
      fl.lost++;
      return { ok: true, text: 'You try, and it does not go well. They thank you anyway, a little less.' };
    }
    fl.prayers.splice(at, 1);
    fl.answered++;
    if (fl.answered % FLOCK.growEvery === 0) fl.followers++;
    this.s.grantXp(5 * this.s.player.level, true);
    if (fl.followers >= FLOCK.titleAt) this.title(FLOCK.title);
    this.changed('flock');
    return { ok: true, text: `Answered: ${p.text} Your flock is ${fl.followers}.` };
  }

  // ------------------------------------------------------------------ 163: the Grudgebound Conclave

  regionsWithGrudge(): string[] {
    const g = this.s.state.realm.grudge;
    return [...new Set(content.zones.all().map((z) => z.id))].filter((z) => hierarchy(g, z).length > 0);
  }

  conclaveOn(): boolean {
    return this.s.player.level >= WAR.minLevel && this.regionsWithGrudge().length >= CONCLAVE.minRegions;
  }

  strength(town: string): number {
    const zone = content.towns.get(town).zone;
    const live = hierarchy(this.s.state.realm.grudge, zone);
    return CONCLAVE.base + live.reduce((n, g) => n + g.scars * CONCLAVE.strengthPerScar, 0) + this.regionsWithGrudge().length;
  }

  /** What the town can raise: Fortunes, Renown, your businesses and the companions who stand with it. */
  defense(town: string): number {
    const p = this.s.player;
    const invested = content.investments.filter((i) => i.town === town).reduce((n, i) => n + investmentLevel(p, i.id), 0);
    return fortuneOf(this.s.state.realm.fortunes, town).prosperity / CONCLAVE.prosperityDiv + (p.world.renown?.[town] ?? 0) / CONCLAVE.renownDiv + this.s.party.recruited().length * CONCLAVE.defendPerCompanion + invested * 2;
  }

  private conclaveDaily(day: number): void {
    const c = this.t.conclave;
    if (!this.conclaveOn() || c.day === day) return;
    c.day = day;
    if (c.active && day - c.active.day >= CONCLAVE.autoAfterDays) {
      this.delegate();
      return;
    }
    if (!c.active && day % CONCLAVE.everyDays === 0) {
      const towns = content.towns.all();
      const town = towns[c.at % towns.length]!.id;
      c.at++;
      c.active = { town, day, strength: this.strength(town) };
      this.note(`The Conclave marches on ${content.towns.get(town).name}.`, 'warning');
    }
  }

  private resolve(town: string, won: boolean): void {
    const c = this.t.conclave;
    delete c.active;
    const st = this.s.state.realm.fortunes;
    const day = this.s.state.clock.day;
    if (won) {
      c.repelled++;
      lift(st, town, CONCLAVE.win, day);
      const gold = CONCLAVE.goldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'conclave');
      if (c.repelled >= CONCLAVE.repelledTitleAt) this.title(CONCLAVE.title);
      this.note(`The Conclave is thrown back from ${content.towns.get(town).name}. (+${gold} gold)`, 'level');
    } else {
      c.lost.push(town);
      lift(st, town, -CONCLAVE.loss, day);
      this.note(`${content.towns.get(town).name} suffers under the Conclave.`, 'warning');
    }
    this.changed('conclave');
  }

  /** Leave it to the town: its defense against the Conclave’s strength, with a little luck. */
  delegate(): XResult {
    const a = this.t.conclave.active;
    if (!a) return fail('No town is under attack.');
    const luck = new Rng(hash(`conclave:${a.town}:${a.day}`)).int(-4, 4);
    const won = this.defense(a.town) + luck >= a.strength;
    this.resolve(a.town, won);
    return { ok: true, text: won ? 'The town holds without you.' : 'The town cannot hold without you.' };
  }

  /** Lead the defense yourself: the Grudgebound of the region against you and your companions. */
  defend(): XResult {
    const a = this.t.conclave.active;
    if (!a) return fail('No town is under attack.');
    if (this.s.world.inTown() !== a.town) return fail(`Go to ${content.towns.get(a.town).name} to lead the defense.`);
    const live = hierarchy(this.s.state.realm.grudge, content.towns.get(a.town).zone).slice(0, 3).map((g) => g.enemyId);
    const ids = live.length ? live : ['meadow-wolf'];
    const r = this.s.endgame.startSpecial({ module: 'twilight', ref: `conclave:${a.town}`, label: `The Conclave at ${content.towns.get(a.town).name}`, level: this.s.player.level + 1, waves: [ids, ids], threat: Math.round(a.strength / 3) });
    return r.ok ? { ok: true, text: 'The Conclave is at the gate.' } : { ok: false, reason: r.reason };
  }

  // ------------------------------------------------------------------ 164: the War of the Wheel

  /** Three parties, three fronts. Each turn you lead one; the others fight on their own. */
  warStart(): XResult {
    if (this.s.player.level < WAR.minLevel) return fail(`The war is for heroes of level ${WAR.minLevel}.`);
    if (this.t.war.active) return fail('The war is under way.');
    const comps = this.s.party.recruited();
    const approval = comps.length ? comps.reduce((n, c) => n + c.approval, 0) / comps.length : 20;
    const flock = this.t.flock.followers;
    this.t.war.active = {
      turn: 0, seed: hash(`war:${this.s.player.name}:${this.s.state.clock.day}`), log: [],
      fronts: [{ ours: WAR.ours + this.s.player.level, enemy: WAR.enemy }, { ours: 40 + approval + comps.length * 10, enemy: WAR.enemy }, { ours: 30 + flock * 3, enemy: WAR.enemy }],
    };
    return { ok: true, text: `The War of the Wheel begins on three fronts: ${WAR.fronts.join(', ')}.` };
  }

  /** Lead one front this turn (0, 1 or 2). */
  warLead(front: number): XResult {
    const war = this.t.war.active;
    if (!war) return fail('No war is being fought.');
    if (front < 0 || front > 2) return fail('No such front.');
    const rng = new Rng(war.seed + war.turn * 31);
    for (const [i, f] of war.fronts.entries()) {
      if (f.ours <= 0 || f.enemy <= 0) continue;
      const lead = i === front ? WAR.lead : 1;
      const hit = Math.round((f.ours * 0.25 * lead * rng.float(0.6, 1.2)) / 1);
      const back = Math.round((f.enemy * 0.22 * (i === front ? 0.7 : 1) * rng.float(0.6, 1.2)));
      f.enemy = Math.max(0, f.enemy - hit);
      f.ours = Math.max(0, f.ours - back);
    }
    war.turn++;
    const held = war.fronts.filter((f) => f.ours > 0).length;
    const won = war.fronts.every((f) => f.enemy <= 0);
    if (won || war.turn >= WAR.turns || held < 2) {
      delete this.t.war.active;
      const victory = won || (war.fronts.filter((f) => f.enemy <= 0).length >= 2 && held >= 2);
      if (victory) {
        this.t.war.wins++;
        const gold = WAR.goldPerLevel * this.s.player.level;
        this.s.addGold(gold, 'war');
        this.title(WAR.title);
        this.changed('war');
        return { ok: true, text: `The war is won on ${war.turn} turns. (+${gold} gold)` };
      }
      return { ok: true, text: `The war is lost on turn ${war.turn}. The Wheel turns on without the victory.` };
    }
    return { ok: true, text: `Turn ${war.turn}: ${war.fronts.map((f, i) => `${['Host', 'Wing', 'Walls'][i]} ${f.ours}/${f.enemy}`).join(', ')}.` };
  }

  // ------------------------------------------------------------------ fights

  private fought(a: GauntletState, won: boolean): void {
    const ref = a.special?.ref ?? '';
    if (ref.startsWith('conclave:')) this.resolve(ref.slice(9), won);
    else if (ref.startsWith('domain:') && won) {
      const gold = RITES.aspectGoldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'domain');
      this.t.trials[ref] = (this.t.trials[ref] ?? 0) + 1;
      this.note(`An old enemy of ${cap(ref.slice(7))} falls to you. (+${gold} gold)`, 'level');
    } else if (ref === 'unsworn' && won && !this.t.unsworn.done) {
      this.t.unsworn.done = true;
      this.s.quests.reachEnding('unsworn-ending');
      this.s.bus.emit('stateChanged', { reason: 'unsworn' });
    } else if (!won) this.note('You do not prevail. The doorway stays shut for now.', 'warning');
    void ARCHIVE;
  }
}
