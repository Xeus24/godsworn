import { content } from '../../data';
import { BALL, BALLS, BARDS, BARD_MODS, CARAVAN, CRIMES, GHOSTS, GRIEVANCES, INNS, OUTFITS, ROAD_EVENTS, SONGS, SUSPICION, WANTED, WEATHER_MAGIC } from '../../data/road';
import type { GauntletState } from '../endgame/types';
import { Rng } from '../core/rng';
import { characterStats } from '../character/stats';
import { createRoad, type RoadState } from '../realm/marvels';
import { evaluate } from '../quests/conditions';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type OResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): OResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

/**
 * Wanted (49), Masquerade Balls (50), Pilgrim Caravans (40), Weather Magic (47), Haunted Inns (44) and Bardic Legends (45).
 * Wanted and Masquerade share one outfit and suspicion system (R14). State: `realm.marvels.road`.
 */
export class RoadActions {
  constructor(private readonly s: GameSession) {
    s.specials['hunter'] = (a, won) => this.hunterEnded(a, won);
    s.bus.on('zoneEntered', () => this.maybeHunter());
    s.bus.on('timeChanged', () => {
      this.cool();
      this.updateSongs();
    });
  }

  get o(): RoadState {
    const m = this.s.state.realm.marvels;
    return (m.road ??= createRoad());
  }

  private note(text: string, kind: 'level' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  /** What the road gives the hero: Bardic Legends lift Charisma and bargaining. */
  mods(): ModifierSpec[] {
    const n = this.o.songs.length;
    const out: ModifierSpec[] = [];
    const cha = Math.floor(n / BARDS.perCha);
    const barter = Math.floor(n / BARDS.perBarter);
    for (let i = 0; i < cha; i++) out.push(BARD_MODS.cha);
    for (let i = 0; i < barter; i++) out.push(BARD_MODS.barter);
    return out;
  }

  // ------------------------------------------------------------------ 49: Wanted

  wantedLevel(): number {
    return Math.min(WANTED.maxLevel, Math.ceil(this.o.heat / WANTED.perLevel));
  }

  /** A crime. Heat rises; the watch remembers for a while. */
  commit(crimeId: string): void {
    const c = CRIMES.find((x) => x.id === crimeId);
    if (!c) return;
    const heat = this.s.civic.heatFor(c.id);
    if (heat <= 0) return;
    const before = this.wantedLevel();
    this.o.heat += heat;
    this.o.lastCrime = this.s.state.clock.day;
    const after = this.wantedLevel();
    if (after > before) this.note(`Wanted: ${'★'.repeat(after)} (${c.name}).`, 'warning');
    if (after >= WANTED.maxLevel && !this.s.player.devotion.titles.includes(WANTED.title)) this.s.player.devotion.titles.push(WANTED.title);
    this.s.bus.emit('stateChanged', { reason: 'wanted' });
    this.s.civic.crimeSeen(c.id, heat);
  }

  /** Heat cools while you keep your head down; suspicion fades with the days. */
  private cool(): void {
    const day = this.s.state.clock.day;
    const o = this.o;
    if (o.heat > 0 && day - o.lastCrime >= WANTED.coolDays) {
      o.heat = Math.max(0, o.heat - Math.floor((day - o.lastCrime) / WANTED.coolDays));
      o.lastCrime = day;
    }
    if (o.suspicionDay !== day) {
      o.suspicion = Math.max(0, o.suspicion - SUSPICION.coolPerDay * Math.max(1, day - o.suspicionDay));
      o.suspicionDay = day;
    }
  }

  /** Each region you enter, a hunter may find you if you are Wanted. */
  private maybeHunter(): void {
    const lvl = this.wantedLevel();
    if (lvl < 1 || this.o.hunter) return;
    if (this.s.rng.chance(WANTED.hunterChance * lvl)) {
      this.o.hunter = { level: lvl };
      this.note('A bounty hunter has your scent. Face them in a town, or pay the fine.', 'warning');
      this.s.bus.emit('stateChanged', { reason: 'hunter' });
    }
  }

  fine(): number {
    return WANTED.fineGoldPerLevel * this.s.player.level * Math.max(1, this.wantedLevel());
  }

  /** Pay the watch off: heat is wiped and the hunter called off. */
  payFine(): OResult {
    if (this.wantedLevel() < 1) return fail('Nobody is looking for you.');
    if (!this.s.world.inTown()) return fail('The watch takes fines in towns.');
    const f = this.fine();
    if (this.s.state.gold < f) return fail(`The fine is ${f} gold.`);
    this.s.spendGold(f, 'fine');
    this.o.heat = 0;
    delete this.o.hunter;
    this.changed('wanted');
    return { ok: true, text: `Paid ${f} gold. The watch lets it lie.` };
  }

  /** Face the hunter (fought as a short run of humanoids). */
  faceHunter(): OResult {
    const h = this.o.hunter;
    if (!h) return fail('No hunter is on your trail.');
    const rng = new Rng(hash(`hunter:${this.s.state.clock.day}:${h.level}`));
    const pool = content.enemies.filter((e) => e.types.includes('humanoid') && e.tier === 'normal' && Math.abs(e.level - this.s.player.level) <= 12);
    const wave = (n: number): string[] => (pool.length ? Array.from({ length: n }, () => rng.pick(pool).id) : []);
    const r = this.s.endgame.startSpecial({ module: 'hunter', ref: String(h.level), label: 'The Bounty Hunters', level: this.s.player.level + h.level, waves: [wave(1 + Math.min(2, h.level)), wave(2 + Math.min(2, h.level))], threat: h.level * 6 });
    return r.ok ? { ok: true } : { ok: false, reason: r.reason };
  }

  private hunterEnded(a: GauntletState, won: boolean): void {
    if (won) {
      const lvl = this.o.hunter?.level ?? 1;
      const gold = WANTED.bountyGoldPerLevel * this.s.player.level * lvl;
      this.s.addGold(gold, 'hunter');
      this.o.heat = Math.max(0, this.o.heat - WANTED.heatOnWin);
      delete this.o.hunter;
      this.note(`The hunters are beaten. Their purse is yours: +${gold} gold.`, 'level');
    } else this.note('The hunters take what you carry and leave you alive. They will be back.', 'warning');
    if (!won) {
      const loss = Math.min(this.s.state.gold, this.fine() / 2);
      if (loss > 0) this.s.spendGold(Math.round(loss), 'hunter');
    }
    void a;
    this.changed('wanted');
  }

  // ------------------------------------------------------------------ 50: Masquerade Balls (and disguises)

  buyOutfit(id: string): OResult {
    const out = OUTFITS.find((x) => x.id === id);
    if (!out) return fail('No such outfit.');
    if (!this.s.world.inTown()) return fail('Tailors work in towns.');
    if (this.s.state.gold < out.cost) return fail(`It costs ${out.cost} gold.`);
    this.s.spendGold(out.cost, 'outfit');
    this.o.outfit = id;
    this.changed('outfit');
    return { ok: true, text: `You are dressed as ${out.name}.` };
  }

  /** Suspicion in towns: your Wanted level, less what the outfit covers. */
  townSuspicion(): number {
    const cover = OUTFITS.find((x) => x.id === this.o.outfit)?.cover ?? 0;
    return Math.max(0, Math.min(SUSPICION.max, this.o.suspicion + this.wantedLevel() * SUSPICION.wantedPerLevel - cover));
  }

  ballsOpen(town: string): typeof BALLS {
    const day = this.s.state.clock.day;
    return BALLS.filter((b) => b.town === town && (this.o.balls[b.id] === undefined || day - (this.o.balls[b.id] as number) >= BALL.yearDays));
  }

  /** Walk a ball: each stage is a roll of the stat against its difficulty, harder with suspicion and softer in the dress the ball wants. */
  attendBall(id: string): OResult {
    const ball = BALLS.find((b) => b.id === id);
    if (!ball) return fail('No such ball.');
    if (this.s.world.inTown() !== ball.town) return fail('That ball is in another town.');
    if (!this.ballsOpen(ball.town).some((b) => b.id === id)) return fail('You have already been to this year’s ball.');
    const dressed = this.o.outfit === ball.dress;
    const rng = new Rng(hash(`${id}:${this.s.state.clock.day}:${this.s.player.name}`));
    const stats = characterStats(this.s.player) as unknown as Record<string, number>;
    const log: string[] = [];
    let susp = this.townSuspicion();
    for (const stage of ball.stages) {
      const dc = stage.dc + susp * BALL.extraDcPerSuspicion - (dressed ? 3 : 0);
      const roll = rng.int(1, 20) + Math.floor((stats[stage.stat] ?? 10) / 2) - 3;
      const win = roll >= dc;
      log.push(`${stage.text} ${win ? '✓' : '✗'}`);
      if (!win) {
        susp += BALL.failSuspicion;
        if (susp >= SUSPICION.max) {
          this.o.suspicion = Math.min(SUSPICION.max, this.o.suspicion + 25);
          this.o.balls[id] = this.s.state.clock.day;
          this.s.advanceTime(180);
          this.changed('ball');
          return { ok: true, text: `${log.join(' ')} You are unmasked, and shown out.` };
        }
      }
    }
    const gold = ball.goldPerLevel * this.s.player.level;
    this.s.addGold(gold, 'masquerade');
    this.o.balls[id] = this.s.state.clock.day;
    this.s.advanceTime(240);
    this.o.suspicion = Math.max(0, this.o.suspicion - 10);
    if (BALLS.every((b) => this.o.balls[b.id] !== undefined) && !this.s.player.devotion.titles.includes(BALL.title)) this.s.player.devotion.titles.push(BALL.title);
    this.changed('ball');
    return { ok: true, text: `${log.join(' ')} The seal is yours, and so is ${gold} gold.` };
  }

  // ------------------------------------------------------------------ 40: Pilgrim Caravans

  caravanTowns(): { id: string; name: string }[] {
    return content.towns.all().map((t) => ({ id: t.id, name: t.name }));
  }

  /** Legs between two towns, by their order in the world. */
  legsBetween(a: string, b: string): number {
    const towns = content.towns.all().map((t) => t.id);
    return Math.max(1, Math.min(CARAVAN.maxLegs, Math.abs(towns.indexOf(a) - towns.indexOf(b))));
  }

  startCaravan(to: string): OResult {
    const from = this.s.world.inTown();
    if (!from) return fail('Caravans gather in towns.');
    if (this.o.caravan) return fail('You are already escorting a caravan.');
    if (this.s.player.level < CARAVAN.minLevel) return fail(`Caravan masters want escorts of level ${CARAVAN.minLevel}.`);
    if (!content.towns.find(to) || to === from) return fail('Choose another town.');
    this.o.caravan = { from, to, legs: this.legsBetween(from, to), done: 0, hp: CARAVAN.startHp, cargo: 1, log: [`The caravan leaves ${content.towns.get(from).name} for ${content.towns.get(to).name}.`] };
    this.s.bus.emit('stateChanged', { reason: 'caravan' });
    return { ok: true };
  }

  /** One day on the road: an event, resolved by your party’s strength against its danger. */
  march(): OResult {
    const c = this.o.caravan;
    if (!c) return fail('No caravan.');
    this.s.advanceTime(CARAVAN.marchMinutes);
    const rng = new Rng(hash(`caravan:${c.from}:${c.to}:${c.done}:${this.s.state.clock.day}`));
    const ev = rng.pick(ROAD_EVENTS);
    const strength = Math.min(0.9, 0.45 + (this.s.player.level - 10) * 0.01 + this.s.party.battleMembers().length * 0.08);
    const win = ev.danger === 0 || rng.chance(strength - ev.danger * 0.1);
    let line = ev.text;
    if (ev.kind === 'find' && win) {
      const gold = 30 + this.s.player.level * 2;
      this.s.addGold(gold, 'caravan');
      line += ` You find ${gold} gold.`;
    } else if (ev.danger > 0) {
      if (win) line += ' You see to it, and the caravan rolls on.';
      else {
        c.hp = Math.max(0, c.hp - ev.danger * 12);
        line += ` It costs the caravan dearly (${c.hp}% intact).`;
      }
    }
    c.log.push(line);
    c.done++;
    if (c.hp <= 0) {
      delete this.o.caravan;
      this.note('The caravan is lost on the road. The pilgrims go home.', 'warning');
      this.changed('caravan');
      return { ok: true, text: 'The caravan was lost.' };
    }
    if (c.done >= c.legs) {
      const pay = Math.round(CARAVAN.goldPerLevelPerLeg * this.s.player.level * c.legs * (c.hp / 100));
      this.s.addGold(pay, 'caravan');
      this.o.caravans++;
      delete this.o.caravan;
      this.note(`The caravan reaches ${content.towns.get(c.to).name}: +${pay} gold.`, 'level');
      this.changed('caravan');
      return { ok: true, text: `Arrived: +${pay} gold.` };
    }
    this.s.bus.emit('stateChanged', { reason: 'caravan' });
    return { ok: true, text: line };
  }

  // ------------------------------------------------------------------ 47: Weather Magic

  weatherCost(): number {
    return WEATHER_MAGIC.goldPerTier * Math.max(1, this.s.world.zone.order);
  }

  castWeather(id: string): OResult {
    if (!WEATHER_MAGIC.ids.includes(id)) return fail('No such weather.');
    if (this.s.player.level < WEATHER_MAGIC.minLevel) return fail(`Weather-working needs level ${WEATHER_MAGIC.minLevel}.`);
    if (this.o.castDay === this.s.state.clock.day) return fail('You have worked the sky today already.');
    if (!content.weather.find(id)) return fail('That weather is not known here.');
    const cost = this.weatherCost();
    if (this.s.state.gold < cost) return fail(`The working costs ${cost} gold in offerings.`);
    this.s.spendGold(cost, 'weather-magic');
    this.s.world.forceWeather(id, WEATHER_MAGIC.hours);
    this.o.castDay = this.s.state.clock.day;
    this.s.bus.emit('stateChanged', { reason: 'weather' });
    return { ok: true, text: `The sky turns to ${content.weather.get(id).name} for ${WEATHER_MAGIC.hours} hours.` };
  }

  // ------------------------------------------------------------------ 44: Haunted Inns

  ghostOf(town: string): { name: string; grievance: (typeof GRIEVANCES)[number] } | undefined {
    const i = content.towns.all().findIndex((t) => t.id === town);
    if (i < 0) return undefined;
    const base = GRIEVANCES[i % GRIEVANCES.length] as (typeof GRIEVANCES)[number];
    // Each inn lists the answers in its own order, so the right one is not always first.
    const k = i % 3;
    const options = [0, 1, 2].map((j) => base.options[(j + k) % 3]) as [string, string, string];
    const right = ((base.right - k + 3) % 3) as 0 | 1 | 2;
    return { name: GHOSTS[i % GHOSTS.length] as string, grievance: { ...base, options, right } };
  }

  inn(town: string): { clues: number[]; rest: boolean } {
    return (this.o.inns[town] ??= { clues: [], rest: false });
  }

  /** Spend an evening at the inn: one new clue a day, up to three. */
  listen(): OResult {
    const town = this.s.world.inTown();
    if (!town) return fail('The inns are in towns.');
    const g = this.ghostOf(town);
    if (!g) return fail('No tale here.');
    const inn = this.inn(town);
    if (inn.rest) return fail(`${g.name} is at rest.`);
    const day = this.s.state.clock.day;
    if (inn.clues.includes(day)) return fail('You have listened today.');
    if (inn.clues.length >= 3) return fail('You know enough; it is time to answer.');
    inn.clues.push(day);
    this.s.advanceTime(120);
    this.s.bus.emit('stateChanged', { reason: 'inn' });
    return { ok: true, text: g.grievance.clues[inn.clues.length - 1] };
  }

  resolve(option: number): OResult {
    const town = this.s.world.inTown();
    const g = town ? this.ghostOf(town) : undefined;
    if (!town || !g) return fail('The inns are in towns.');
    const inn = this.inn(town);
    if (inn.rest) return fail('At rest.');
    if (inn.clues.length < 3) return fail('You have not heard the whole story.');
    if (option !== g.grievance.right) {
      inn.clues = [];
      this.s.bus.emit('stateChanged', { reason: 'inn' });
      return { ok: true, text: `${g.name} will not be answered that way. The story begins again tomorrow.` };
    }
    inn.rest = true;
    const gold = INNS.reward * this.s.player.level;
    this.s.addGold(gold, 'inn-ghost');
    this.s.devotion.apply({ [INNS.god]: INNS.favor }, 'inn-ghost', true);
    if (content.towns.all().every((t) => this.o.inns[t.id]?.rest) && !this.s.player.devotion.titles.includes(INNS.title)) this.s.player.devotion.titles.push(INNS.title);
    this.changed('inn');
    return { ok: true, text: `${g.grievance.outro} (+${gold} gold and Morrath's favor)` };
  }

  // ------------------------------------------------------------------ 45: Bardic Legends

  private updateSongs(): void {
    for (const sg of SONGS) {
      if (this.o.songs.includes(sg.id) || !evaluate(this.s.state, sg.cond)) continue;
      this.o.songs.push(sg.id);
      this.note(`A bard has made a song of you: “${sg.name}”.`, 'level');
      if (this.o.songs.length >= SONGS.length && !this.s.player.devotion.titles.includes(BARDS.title)) this.s.player.devotion.titles.push(BARDS.title);
      this.changed('songs');
    }
  }

  songs(): typeof SONGS {
    this.updateSongs();
    return SONGS.filter((x) => this.o.songs.includes(x.id));
  }

  /** What the townsfolk say to you, from the songs they have heard (a different one each day). */
  reaction(town: string): string | undefined {
    const known = this.songs();
    if (!known.length) return undefined;
    return known[hash(`${town}:${this.s.state.clock.day}`) % known.length]!.reaction;
  }
}
