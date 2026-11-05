import { content } from '../../data';
import { BREAK, COUNCIL, DISTRICTS, HALL, HALLS, JAILBREAKS, LAW, LAWS, LAW_MODS, LAW_MULTS, RAID, RAIDERS, STANCES, SUNDER, SUNDER_LINES, TOWN_LAWS, type RaiderDef } from '../../data/civic';
import { CRIMES, OUTFITS } from '../../data/road';
import { FORTUNES } from '../../data/realm/fortunes';
import type { GauntletState } from '../endgame/types';
import { Rng } from '../core/rng';
import { characterStats } from '../character/stats';
import { bondRank, heartOf } from '../heart/heart';
import { createCivic, type CivicState } from '../realm/marvels';
import { fortuneOf, lift } from '../realm/fortunes';
import { dateOf } from '../realm/wheel';
import { repOf } from '../world/factions';
import { investmentLevel } from '../world/investments';
import { shipLevel } from '../world/ship';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type CResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): CResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/**
 * Laws and Crimes (90), Disguises (91), the Crown Council (92), the Sundering (95) and Sea and Sky Grudgebound (96).
 * Crimes feed the Wanted heat of `RoadActions`; outfits and suspicion are the road's too (R14). State: `realm.marvels.civic`.
 */
export class CivicActions {
  constructor(private readonly s: GameSession) {
    s.specials['seasky'] = (a, won) => this.raidEnded(a, won);
    s.bus.on('timeChanged', (e) => this.daily(e.day));
  }

  get c(): CivicState {
    const m = this.s.state.realm.marvels;
    return (m.civic ??= createCivic());
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

  /** What the Council's laws and the slain raiders give the hero. */
  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    const laws = this.laws();
    for (const [i, law] of LAWS.entries()) {
      const table = LAW_MODS[law.id as keyof typeof LAW_MODS] as readonly (ModifierSpec | undefined)[] | undefined;
      const mod = table?.[laws[i] as number];
      if (mod) out.push(mod);
    }
    for (const r of RAIDERS) if (this.c.raiders[r.id]?.slain !== undefined) out.push(r.mod);
    return out;
  }

  private daily(day: number): void {
    const c = this.c;
    const year = dateOf(day).year;
    if (year > c.year) {
      c.year = year;
      this.election(year);
    }
    if (this.s.state.flags[SUNDER.flag] && !c.sundering) this.sunder(day);
  }

  // ------------------------------------------------------------------ 90: Laws and Crimes

  law(town: string): { ruler: string; strict: 0 | 1 | 2; legal: string[] } {
    return TOWN_LAWS[town] ?? { ruler: 'The local reeve', strict: 1, legal: [] };
  }

  /** The heat a crime would earn here: nothing where it is legal, a little more under harsh rulers. */
  heatFor(crimeId: string): number {
    const def = CRIMES.find((x) => x.id === crimeId);
    if (!def) return 0;
    const town = this.s.world.inTown();
    if (!town) return def.heat;
    const l = this.law(town);
    return l.legal.includes(crimeId) ? 0 : def.heat + (l.strict === 2 ? 1 : 0);
  }

  /** Called by the road after a crime is booked: serious crimes done in town may be seen, and the watch takes you in. */
  crimeSeen(crimeId: string, heat: number): void {
    const c = this.c;
    c.record[crimeId] = (c.record[crimeId] ?? 0) + 1;
    const town = this.s.world.inTown();
    if (!town || c.jail || heat < 2) return;
    const l = this.law(town);
    const chance = clamp((LAW.baseCatch + this.s.road.townSuspicion() * LAW.perSuspicion + this.s.road.wantedLevel() * LAW.perWanted + l.strict * LAW.perStrict) * this.watchMult(), 0, LAW.maxCatch);
    const total = Object.values(c.record).reduce((a, b) => a + b, 0);
    if (new Rng(hash(`caught:${this.s.state.clock.day}:${crimeId}:${total}`)).chance(chance)) this.arrest(town, heat);
  }

  arrest(town: string, heat: number): void {
    const c = this.c;
    const days = LAW.sentenceBase + heat * LAW.sentencePerHeat + this.law(town).strict;
    c.jail = { town, day: this.s.state.clock.day, days };
    c.arrests++;
    this.note(`The watch of ${content.towns.get(town).name} takes you in: ${days} days in the cells.`, 'warning');
    this.changed('arrest');
  }

  jailed(): boolean {
    return this.c.jail !== undefined;
  }

  bailCost(): number {
    return this.c.jail ? this.c.jail.days * LAW.bailPerDayPerLevel * this.s.player.level : 0;
  }

  payBail(): CResult {
    const j = this.c.jail;
    if (!j) return fail('You are not held.');
    const cost = this.bailCost();
    if (!this.s.spendGold(cost, 'bail')) return fail(`Bail is ${cost} gold.`);
    delete this.c.jail;
    this.s.road.o.heat = Math.max(0, this.s.road.o.heat - 1);
    this.changed('bail');
    return { ok: true, text: `Bail paid: ${cost} gold. The cell door opens.` };
  }

  serveTime(): CResult {
    const j = this.c.jail;
    if (!j) return fail('You are not held.');
    delete this.c.jail;
    this.s.advanceTime(j.days * 1440);
    this.s.road.o.heat = Math.max(0, this.s.road.o.heat - j.days);
    this.changed('sentence');
    return { ok: true, text: `You serve ${j.days} days. The watch lets the record cool.` };
  }

  /** One of three ways out of the cells. Each stage is a roll; the guard’s tabard helps; the first time a route works it pays and tells its story. */
  escape(routeId: string): CResult {
    const j = this.c.jail;
    const route = JAILBREAKS.find((x) => x.id === routeId);
    if (!j) return fail('You are not held.');
    if (!route) return fail('No such way out.');
    const disguised = OUTFITS.find((x) => x.id === this.s.road.o.outfit)?.faction === 'wardens';
    const log: string[] = [];
    for (const [i, st] of route.stages.entries()) {
      const win = this.roll(`${routeId}:${i}:${this.s.state.clock.day}:${this.c.arrests}:${this.s.player.name}`, st.stat) + (disguised ? BREAK.disguiseBonus : 0) >= st.dc;
      log.push(`${st.text} ${win ? '✓' : '✗'}`);
      if (!win) {
        j.days += BREAK.failDays;
        this.changed('escape');
        return { ok: true, text: `${log.join(' ')} You are caught and the sentence grows by ${BREAK.failDays} days.` };
      }
    }
    delete this.c.jail;
    this.s.road.o.heat += BREAK.heat;
    this.s.road.o.lastCrime = this.s.state.clock.day;
    let extra = '';
    if (!this.c.escapes.includes(routeId)) {
      this.c.escapes.push(routeId);
      const gold = route.goldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'jailbreak');
      extra = ` ${route.lore} (+${gold} gold)`;
      if (this.c.escapes.length === JAILBREAKS.length) this.title(BREAK.title);
    }
    this.changed('escape');
    return { ok: true, text: `${log.join(' ')} You are out, and the watch is already looking.${extra}` };
  }

  /** Lift a purse: Dexterity against a watchful street. Either way it is theft. */
  pilfer(): CResult {
    const town = this.s.world.inTown();
    if (!town) return fail('Pockets are picked in towns.');
    if (this.c.jail) return fail('You are in a cell.');
    const day = this.s.state.clock.day;
    const dc = 12 + this.s.road.townSuspicion() * 0.1 + this.law(town).strict * 2;
    const win = this.roll(`pilfer:${day}:${this.c.record['theft'] ?? 0}:${town}`, 'dex') >= dc;
    const gold = win ? LAW.pilferGoldPerLevel * this.s.player.level : 0;
    if (gold) this.s.addGold(gold, 'theft');
    this.s.road.commit(LAW.pilferHeat);
    return { ok: true, text: win ? `A purse comes away in your hand: +${gold} gold.` : 'A hand closes on your wrist. You wriggle free, empty-handed.' };
  }

  watchMult(): number {
    return LAW_MULTS.curfew[this.laws()[1] ?? 1] ?? 1;
  }

  // ------------------------------------------------------------------ 91: Disguises

  hallOpen(faction: string): boolean {
    const d = this.c.halls[faction];
    return d === undefined || this.s.state.clock.day - d >= HALL.yearDays;
  }

  /** Slip into a faction hall. The right outfit is the key; anything else must pass on a roll, and a failure is trespass. */
  infiltrate(faction: string): CResult {
    const hall = HALLS.find((h) => h.faction === faction);
    if (!hall) return fail('No such hall.');
    if (this.c.jail) return fail('You are in a cell.');
    if (this.s.world.inTown() !== hall.town) return fail(`${hall.name} is in ${content.towns.get(hall.town).name}.`);
    if (!this.hallOpen(faction)) return fail('You have been in this year already; the locks have changed.');
    const o = this.s.road.o;
    const outfit = OUTFITS.find((x) => x.id === o.outfit);
    const susp = this.s.road.townSuspicion();
    const matched = outfit?.faction === faction && susp < HALL.matchSuspicionLimit;
    const dc = HALL.dc - Math.floor((outfit?.cover ?? 0) * HALL.coverDc) + susp * 0.08;
    const pass = matched || this.roll(`hall:${faction}:${this.s.state.clock.day}:${this.s.player.name}`, 'dex') >= dc;
    if (!pass) {
      o.suspicion = Math.min(100, o.suspicion + HALL.failSuspicion);
      this.s.road.commit('trespass');
      this.changed('hall');
      return { ok: true, text: `The guards at ${hall.name} look twice, and then a third time. You are shown the street.` };
    }
    const gold = HALL.goldPerLevel * this.s.player.level;
    this.s.addGold(gold, 'hall');
    this.c.halls[faction] = this.s.state.clock.day;
    if (HALLS.every((h) => this.c.halls[h.faction] !== undefined)) this.title(HALL.title);
    this.changed('hall');
    return { ok: true, text: `${matched ? 'The guards salute' : 'The guards wave you through'}. ${hall.secret} (+${gold} gold)` };
  }

  // ------------------------------------------------------------------ 92: The Crown Council

  /** The option (0-2) the ruling faction has written for each law. */
  laws(): number[] {
    return STANCES[this.c.ruler] ?? STANCES[COUNCIL.firstRuler] as number[];
  }

  taxMult = (): number => LAW_MULTS.taxes[this.laws()[0] ?? 1] ?? 1;
  tariffMult = (): number => LAW_MULTS.tariffs[this.laws()[4] ?? 1] ?? 1;

  /** A faction's support in a district this year, before the vote's chance and noise. */
  support(district: string, faction: string): number {
    const d = DISTRICTS.find((x) => x.id === district);
    if (!d) return 0;
    const rep = Math.min(COUNCIL.repMax, Math.floor(Math.max(0, repOf(this.s.player, faction)) / COUNCIL.repPer));
    return (d.lean[faction] ?? COUNCIL.baseSupport) + rep + (this.c.backing[district]?.[faction] ?? 0);
  }

  factions(): string[] {
    return Object.keys(STANCES);
  }

  private election(year: number): void {
    const c = this.c;
    const tally: Record<string, number> = {};
    for (const d of DISTRICTS) {
      const rng = new Rng(hash(`election:${year}:${d.id}`));
      let best = '';
      let top = -1;
      for (const f of this.factions()) {
        const score = this.support(d.id, f) + rng.int(0, COUNCIL.noise);
        if (score > top) {
          top = score;
          best = f;
        }
      }
      c.seats[d.id] = best;
      tally[best] = (tally[best] ?? 0) + 1;
    }
    const most = Math.max(...Object.values(tally));
    const leaders = Object.keys(tally).filter((f) => tally[f] === most);
    c.ruler = leaders.includes(c.ruler) ? c.ruler : (leaders[0] as string);
    c.used = {};
    c.backing = {};
    const name = content.factions.get(c.ruler).name;
    this.note(`The Crown Council is seated: ${name} holds ${most} of ${DISTRICTS.length} seats and writes the laws.`, 'quest');
    this.changed('election');
  }

  private campaignOk(district: string, faction: string, method: string): CResult | undefined {
    if (this.s.world.inTown() !== 'aurelane') return fail('The districts are canvassed in Aurelane.');
    if (this.c.jail) return fail('You are in a cell.');
    if (!DISTRICTS.some((d) => d.id === district)) return fail('No such district.');
    if (!this.factions().includes(faction)) return fail('No such faction.');
    if (this.c.used[district]?.includes(method)) return fail('You have already done that here this year.');
    return undefined;
  }

  private back(district: string, faction: string, method: string, amount: number): void {
    const c = this.c;
    (c.used[district] ??= []).push(method);
    const row = (c.backing[district] ??= {});
    row[faction] = (row[faction] ?? 0) + amount;
    this.changed('campaign');
  }

  /** A Charisma roll on the doorsteps. */
  canvass(district: string, faction: string): CResult {
    const bad = this.campaignOk(district, faction, 'canvass');
    if (bad) return bad;
    this.s.advanceTime(120);
    const win = this.roll(`canvass:${district}:${faction}:${this.s.state.clock.day}`, 'cha') >= COUNCIL.canvassDc + Math.floor(this.s.road.townSuspicion() / 10);
    this.back(district, faction, 'canvass', win ? COUNCIL.canvass : COUNCIL.canvassFail);
    return { ok: true, text: win ? 'The doorsteps open to you.' : 'Doors close politely. A few listen.' };
  }

  /** People who trust you speak for your choice. */
  kindred(district: string, faction: string): CResult {
    const bad = this.campaignOk(district, faction, 'kindred');
    if (bad) return bad;
    const bonds = Object.values(heartOf(this.s.player).bonds).filter((p) => bondRank(p) >= COUNCIL.kindredRank).length;
    if (!bonds) return fail(`You need a Kindred Bond of rank ${COUNCIL.kindredRank} or more to speak for you.`);
    this.back(district, faction, 'kindred', COUNCIL.kindred * Math.min(2, bonds));
    return { ok: true, text: 'Someone who knows you speaks up, and the district listens.' };
  }

  bribeCost(): number {
    return COUNCIL.bribeGoldPerLevel * this.s.player.level;
  }

  /** Gold into the right hands. It works, and it is a crime. */
  bribe(district: string, faction: string): CResult {
    const bad = this.campaignOk(district, faction, 'bribe');
    if (bad) return bad;
    if (!this.s.spendGold(this.bribeCost(), 'bribe')) return fail(`It costs ${this.bribeCost()} gold.`);
    this.s.road.o.suspicion = Math.min(100, this.s.road.o.suspicion + COUNCIL.bribeSuspicion);
    this.back(district, faction, 'bribe', COUNCIL.bribe);
    this.s.road.commit('bribery');
    return { ok: true, text: 'The envelope vanishes. So, for the moment, does the objection.' };
  }

  // ------------------------------------------------------------------ 95: The Sundering

  /** How well a town stands when the Bell rings: its prosperity, your businesses there and, for the capital, its walls. */
  resilience(town: string): number {
    const f = fortuneOf(this.s.state.realm.fortunes, town);
    if (f.fallen !== undefined) return 0;
    const invested = content.investments.filter((i) => i.town === town).reduce((n, i) => n + investmentLevel(this.s.player, i.id), 0);
    return f.prosperity + invested * SUNDER.perInvestmentLevel + (town === 'aurelane' ? SUNDER.capitalBonus : 0);
  }

  private sunder(day: number): void {
    const st = this.s.state.realm.fortunes;
    const towns: Record<string, 'intact' | 'damaged' | 'fallen'> = {};
    for (const t of content.towns.all()) {
      const score = this.resilience(t.id);
      const fate = score >= SUNDER.intact ? 'intact' : score >= SUNDER.damaged ? 'damaged' : 'fallen';
      towns[t.id] = fate;
      const f = fortuneOf(st, t.id);
      if (fate === 'fallen') lift(st, t.id, -200, day);
      else if (fate === 'damaged') lift(st, t.id, Math.min(0, SUNDER.damagedProsperity - f.prosperity), day);
      else lift(st, t.id, SUNDER.intactBoost, day);
      this.note(SUNDER_LINES[fate](t.name), fate === 'intact' ? 'info' : 'warning');
    }
    this.c.sundering = { day, towns };
    this.changed('sundering');
  }

  rebuildCost(town: string): number {
    const fate = this.c.sundering?.towns[town];
    if (fate !== 'damaged' && fate !== 'fallen') return 0;
    return (fate === 'damaged' ? SUNDER.rebuildDamagedPerLevel : SUNDER.rebuildFallenPerLevel) * this.s.player.level;
  }

  rebuild(town: string): CResult {
    const sd = this.c.sundering;
    const fate = sd?.towns[town];
    if (!sd || (fate !== 'damaged' && fate !== 'fallen')) return fail('There is nothing to rebuild there.');
    if (this.s.world.inTown() !== town) return fail('You must stand in the town to raise it.');
    const cost = this.rebuildCost(town);
    if (!this.s.spendGold(cost, 'rebuild')) return fail(`It costs ${cost} gold.`);
    const st = this.s.state.realm.fortunes;
    const f = fortuneOf(st, town);
    const day = this.s.state.clock.day;
    if (fate === 'fallen') {
      lift(st, town, FORTUNES.rise - f.prosperity, day);
      sd.towns[town] = 'damaged';
    } else {
      lift(st, town, SUNDER.rebuildLift, day);
      sd.towns[town] = 'intact';
    }
    if (Object.values(sd.towns).every((x) => x === 'intact')) this.title(SUNDER.title);
    this.changed('rebuild');
    return { ok: true, text: `${content.towns.get(town).name} is ${sd.towns[town] === 'intact' ? 'whole again' : 'lived in again'}.` };
  }

  // ------------------------------------------------------------------ 96: Sea and Sky Grudgebound

  raider(id: string): { scars: number; beaten: number; slain?: number; hunting: boolean } {
    return (this.c.raiders[id] ??= { scars: 0, beaten: 0, hunting: false });
  }

  /** A sea or sky battle has ended: losses and flights teach the raiders your ship. */
  voyageEnded(outcome: 'victory' | 'defeat' | 'fled' | 'ongoing', by: 'ship' | 'airship'): void {
    const def = RAIDERS.find((x) => x.by === by);
    if (!def) return;
    const r = this.raider(def.id);
    if (r.slain !== undefined) return;
    const add = outcome === 'defeat' ? RAID.scarOnDefeat : outcome === 'fled' ? RAID.scarOnFlee : 0;
    if (!add) return;
    r.scars = Math.min(def.maxScars, r.scars + add);
    if (r.scars >= def.hunts) {
      const first = !r.hunting;
      r.hunting = true;
      const line = def.lines[Math.min(def.lines.length - 1, Math.floor((r.scars - def.hunts) / 2))] as string;
      if (first || r.scars % 2 === 0) this.note(line, 'warning');
    }
    this.changed('raider');
  }

  /** Face the raider at the Saltmere docks. A run of its crew, then the captain’s own guard. */
  face(id: string): CResult {
    const def = RAIDERS.find((x) => x.id === id);
    if (!def) return fail('No such raider.');
    const r = this.raider(id);
    if (r.slain !== undefined) return fail(`${def.name} is dead.`);
    if (!r.hunting) return fail(`${def.name} is not hunting you yet.`);
    if (this.s.world.inTown() !== 'saltmere') return fail('They will meet you at the Saltmere docks.');
    const rng = new Rng(hash(`raid:${id}:${this.s.state.clock.day}:${r.scars}`));
    const level = this.s.player.level + Math.floor(r.scars / RAID.baseLevelPerScars);
    const pool = content.enemies.filter((e) => e.types.includes('humanoid') && e.tier === 'normal' && Math.abs(e.level - this.s.player.level) <= 12);
    const elites = content.enemies.filter((e) => e.types.includes('humanoid') && e.tier === 'elite' && Math.abs(e.level - this.s.player.level) <= 14);
    const wave = (n: number): string[] => (pool.length ? Array.from({ length: n }, () => rng.pick(pool).id) : []);
    const memory = Math.floor((this.s.player.world.ship?.voyages ?? 0) / 10) + shipLevel(this.s.player);
    const crew = def.crew[r.scars % def.crew.length] as string;
    const res = this.s.endgame.startSpecial({
      module: 'seasky', ref: id, label: `${def.name}: ${crew} and the crew`, level,
      waves: [wave(2 + Math.min(2, Math.floor(r.scars / 3))), wave(3 + Math.min(2, Math.floor(r.scars / 3)))],
      ...(elites.length ? { boss: rng.pick(elites).id } : {}), threat: r.scars * RAID.threatPerScar + memory,
    });
    return res.ok ? { ok: true } : { ok: false, reason: res.reason };
  }

  private raidEnded(a: GauntletState, won: boolean): void {
    const id = a.special?.ref ?? '';
    const def = RAIDERS.find((x) => x.id === id) as RaiderDef | undefined;
    if (!def) return;
    const r = this.raider(id);
    if (won) {
      r.slain = this.s.state.clock.day;
      r.hunting = false;
      r.beaten++;
      const gold = Math.round(def.bountyGoldPerLevel * this.s.player.level * (1 + r.scars / 4));
      this.s.addGold(gold, 'raider');
      this.s.grantXp(RAID.xpPerLevel * this.s.player.level, true);
      this.title(def.title);
      this.note(`${def.name} is down. +${gold} gold. ${def.modText}`, 'level');
    } else {
      r.scars = Math.min(def.maxScars, r.scars + 1);
      const loss = Math.round(this.s.state.gold * RAID.loseGoldShare);
      if (loss > 0) this.s.spendGold(loss, 'raider');
      this.note(`${def.name}’s crew strip the deck of ${loss} gold and let you live. They are not done with you.`, 'warning');
    }
    this.changed('raider');
  }
}
