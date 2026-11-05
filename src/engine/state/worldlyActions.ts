import { content } from '../../data';
import { ALMANAC, ARC_TEXT, BATTLE_DREAMS, DISTORTIONS, DREAMS, FOSSILS, GOODS, LOST_TONGUES, MEMORY_DREAMS, MUSEUM, PROPHECY_DREAMS, RUMORS, RUMOR_RULES, TABLETS, TONGUES, TRADE, WINGS, type ArcKind } from '../../data/worldly';
import { Rng } from '../core/rng';
import { characterStats } from '../character/stats';
import { generalRank } from '../skills/general';
import { countHeld, takeHeld } from '../items/inventory';
import { createWorldly, type Rumor, type WorldlyState } from '../realm/marvels';
import { priceMult as fortunePrice } from '../realm/fortunes';
import { dateOf, nextFestival } from '../realm/wheel';
import { seasonOf } from '../realm/pilgrimage';
import { hasAirship, shipLevel } from '../world/ship';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type WResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): WResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
const KINDS: ArcKind[] = ['marry', 'retire', 'promoted', 'moved', 'child', 'passed'];

export interface Arc { npc: string; name: string; town: string; kind: ArcKind; year: number; age: number; other: string; text: string }

/**
 * The Calendar of Vael (88), the Rumor Mill (89), Trade Winds (93), the Grand Museum (94), Lost Tongues (97) and Lyssara's Dreams (98).
 * State: `realm.marvels.worldly`; rumor prices are mirrored on the hero (`world.rumorMult`) so the shop code can read them.
 */
export class WorldlyActions {
  constructor(private readonly s: GameSession) {
    s.specials['lyssara'] = (_a, won) => this.dreamFought(won);
    s.bus.on('timeChanged', (e) => {
      this.daily(e.day);
      if (e.hour === 6) this.dream(e.day);
    });
  }

  get w(): WorldlyState {
    const m = this.s.state.realm.marvels;
    return (m.worldly ??= createWorldly());
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
    for (const wing of WINGS) if (this.w.museum.claimed.includes(wing.id)) out.push(...wing.relic.mods);
    return out;
  }

  private daily(day: number): void {
    const w = this.w;
    // Rumors travel.
    const towns = content.towns.all().map((t) => t.id);
    const mult: Record<string, number> = {};
    for (const r of w.rumors) {
      const tpl = RUMORS.find((x) => x.id === r.tpl)!;
      const age = day - r.born;
      while (r.reached.length < Math.min(RUMOR_RULES.maxHops, 1 + Math.floor(age / 2))) {
        const o = towns.indexOf(r.origin);
        const step = Math.ceil(r.reached.length / 2) * (r.reached.length % 2 ? 1 : -1);
        const next = towns[(((o + step) % towns.length) + towns.length) % towns.length];
        if (next && !r.reached.includes(next)) r.reached.push(next);
        else break;
      }
      if (tpl.price) r.reached.forEach((t, i) => { if (day - (r.born + i * 2) <= RUMOR_RULES.priceDays) mult[t] = (mult[t] ?? 1) * (1 + tpl.price! / 100); });
    }
    w.rumors = w.rumors.filter((r) => day - r.born <= RUMOR_RULES.maxHops * 2 + RUMOR_RULES.priceDays);
    (this.s.player.world as { rumorMult?: Record<string, number> }).rumorMult = mult;
    // A new year in Vael.
    const year = dateOf(day).year;
    if (year > w.yearSeen) {
      w.yearSeen = year;
      const news = this.arcs().filter((a) => a.year === year).slice(0, 3);
      this.note(`A new year in Vael (year ${year}).${news.length ? ` ${news[0]!.text}` : ''}`, 'info');
    }
  }

  // ------------------------------------------------------------------ 88: The Calendar of Vael

  /** Thirty-two townspeople whose lives move on: marrying, retiring, moving, having children, and, in time, passing. */
  arcs(): Arc[] {
    const people = content.npcs.all().filter((n) => n.place === 'people' && n.town && !n.companion).sort((a, b) => a.id.localeCompare(b.id));
    const out: Arc[] = [];
    for (let i = 0; i < Math.min(ALMANAC.arcs, people.length); i++) {
      const n = people[Math.floor((i * people.length) / ALMANAC.arcs)]!;
      const h = hash(`arc:${n.id}`);
      const age = 20 + (h % 50);
      let kind = KINDS[(h >>> 4) % (KINDS.length - 1)] as ArcKind;
      const year = ALMANAC.firstYear + 1 + ((h >>> 8) % (ALMANAC.lastYear - 1));
      if (age + year > 62 && (h >>> 12) % 2 === 0 && year >= ALMANAC.passedFromYear) kind = 'passed';
      const mates = people.filter((p) => p.town === n.town && p.id !== n.id);
      const dest = content.towns.all().filter((t) => t.id !== n.town);
      const other = kind === 'marry' ? (mates[(h >>> 16) % Math.max(1, mates.length)]?.name ?? 'a traveller') : kind === 'moved' ? (dest[(h >>> 16) % dest.length]?.name ?? 'the coast') : '';
      out.push({ npc: n.id, name: n.name, town: n.town as string, kind, year, age, other, text: ARC_TEXT[kind](n.name, other) });
    }
    return out;
  }

  /** What has become of a townsperson by the current year, if anything. */
  status(npcId: string): string | undefined {
    const year = dateOf(this.s.state.clock.day).year;
    const a = this.arcs().find((x) => x.npc === npcId && x.year <= year);
    if (!a) return undefined;
    return { marry: `married ${a.other}`, retire: 'retired', promoted: 'promoted', moved: `moved to ${a.other}`, child: 'a new parent', passed: 'passed away' }[a.kind];
  }

  almanac(): Arc[] {
    const year = dateOf(this.s.state.clock.day).year;
    return this.arcs().filter((a) => a.year <= year).sort((a, b) => b.year - a.year);
  }

  // ------------------------------------------------------------------ 89: The Rumor Mill

  /** Plant a (false) rumor in a town: a Charisma roll decides whether it takes. It travels, and is worse when it comes back. */
  plant(tpl: string): WResult {
    const t = RUMORS.find((x) => x.id === tpl);
    const town = this.s.world.inTown();
    if (!t) return fail('No such rumor.');
    if (!town) return fail('Rumors are planted in towns.');
    if (this.w.rumors.length >= RUMOR_RULES.maxActive) return fail('Too many rumors are loose already.');
    const cha = characterStats(this.s.player).cha;
    const chance = Math.min(0.95, RUMOR_RULES.plantBase + (cha - 10) * RUMOR_RULES.plantPerCha);
    const rng = new Rng(hash(`plant:${tpl}:${town}:${this.s.state.clock.day}`));
    if (!rng.chance(chance)) return { ok: true, text: 'Nobody believes you. You hear the same rumor from someone else an hour later, with your face in it.' };
    this.w.rumors.push({ id: `${tpl}@${town}@${this.s.state.clock.day}`, tpl, origin: town, reached: [town], born: this.s.state.clock.day, planted: true });
    this.changed('rumor');
    return { ok: true, text: 'The rumor takes. By evening it has a life of its own.' };
  }

  text(r: Rumor): string {
    const tpl = RUMORS.find((x) => x.id === r.tpl)!;
    return r.reached.length >= RUMOR_RULES.distortAt ? DISTORTIONS.reduce((t, [re, rep]) => t.replace(re, rep), tpl.text) : tpl.text;
  }

  // ------------------------------------------------------------------ 93: Trade Winds

  quote(town: string, good: string, day = this.s.state.clock.day): number {
    const g = GOODS.find((x) => x.id === good)!;
    const fixed = 1 + (((hash(`${town}:${good}`) % 1000) / 1000) * 2 - 1) * TRADE.townVar;
    const noise = 1 + (((hash(`${town}:${good}:${Math.floor(day / TRADE.noiseDays)}`) % 1000) / 1000) * 2 - 1) * TRADE.noise;
    return Math.max(1, Math.round(g.base * fixed * noise * fortunePrice(this.s.state.realm.fortunes, town)));
  }

  capacity(): number {
    return TRADE.baseCapacity + shipLevel(this.s.player) * TRADE.perShipLevel + (hasAirship(this.s.player) ? TRADE.airship : 0);
  }

  held(): number {
    return Object.values(this.w.cargo).reduce((a, c) => a + c.qty, 0);
  }

  buyGood(good: string, qty: number): WResult {
    const town = this.s.world.inTown();
    if (!town) return fail('Goods are traded in towns.');
    if (!GOODS.some((g) => g.id === good) || qty < 1) return fail('No such goods.');
    if (this.held() + qty > this.capacity()) return fail(`Your hold takes ${this.capacity()} in all.`);
    const price = Math.round(this.quote(town, good) * (1 + TRADE.spread));
    if (this.s.state.gold < price * qty) return fail(`That costs ${price * qty} gold.`);
    this.s.spendGold(price * qty, 'trade');
    const c = (this.w.cargo[good] ??= { qty: 0, paid: 0 });
    c.qty += qty;
    c.paid += price * qty;
    this.s.bus.emit('stateChanged', { reason: 'trade' });
    return { ok: true, text: `Bought ${qty} for ${price * qty} gold.` };
  }

  sellGood(good: string, qty: number): WResult {
    const town = this.s.world.inTown();
    const c = this.w.cargo[good];
    if (!town) return fail('Goods are traded in towns.');
    if (!c || c.qty < qty || qty < 1) return fail('You do not hold that many.');
    const price = Math.round(this.quote(town, good) * (1 - TRADE.spread));
    const cost = Math.round((c.paid * qty) / c.qty);
    this.s.addGold(price * qty, 'trade');
    c.qty -= qty;
    c.paid -= cost;
    if (c.qty === 0) delete this.w.cargo[good];
    this.w.profit += price * qty - cost;
    if (this.w.profit >= TRADE.titleProfit && !this.s.player.devotion.titles.includes(TRADE.title)) this.s.player.devotion.titles.push(TRADE.title);
    this.s.bus.emit('stateChanged', { reason: 'trade' });
    return { ok: true, text: `Sold ${qty} for ${price * qty} gold (${price * qty - cost >= 0 ? '+' : ''}${price * qty - cost}).` };
  }

  // ------------------------------------------------------------------ 94: The Grand Museum

  progress(wing: string): number {
    const s = this.s;
    switch (wing) {
      case 'curiosities': return this.w.museum.donated.length;
      case 'fish': return Object.keys(s.state.minigames.fish).length;
      case 'fossils': return this.w.museum.fossils.length;
      case 'cards': return Object.values(s.state.minigames.cards).filter((n) => n > 0).length;
      case 'trophies': return content.enemies.filter((e) => ['boss', 'worldBoss', 'miniboss'].includes(e.tier) && (s.player.bestiary[e.id] ?? 0) > 0).length;
      case 'art': return s.wonders.w.painter.done.length;
      default: return 0;
    }
  }

  /** A fossil from a dig (called by Ruins Excavation). */
  foundFossil(): void {
    const f = FOSSILS.filter((x) => !this.w.museum.fossils.includes(x));
    if (!f.length || !this.s.rng.chance(MUSEUM.fossilChance)) return;
    const pick = this.s.rng.pick(f);
    this.w.museum.fossils.push(pick);
    this.note(`A fossil in the dig: ${pick}.`, 'loot');
  }

  /** Curiosities you carry that the museum does not have yet. */
  donatable(): { id: string; name: string }[] {
    return content.items.filter((b) => b.category === 'curiosity' && !this.w.museum.donated.includes(b.id) && countHeld(this.s.state, b.id) > 0).map((b) => ({ id: b.id, name: b.name }));
  }

  donate(id: string): WResult {
    if (this.s.world.inTown() !== MUSEUM.town) return fail(`The Grand Museum is in ${content.towns.get(MUSEUM.town).name}.`);
    if (this.w.museum.donated.includes(id) || !takeHeld(this.s.state, id, 1)) return fail('You cannot donate that.');
    this.w.museum.donated.push(id);
    this.s.bus.emit('stateChanged', { reason: 'museum' });
    return { ok: true, text: 'The Collector takes it with both hands and a small cry.' };
  }

  claim(wingId: string): WResult {
    const wing = WINGS.find((x) => x.id === wingId);
    if (!wing) return fail('No such wing.');
    if (this.s.world.inTown() !== MUSEUM.town) return fail(`The Grand Museum is in ${content.towns.get(MUSEUM.town).name}.`);
    if (this.w.museum.claimed.includes(wingId)) return fail('Already claimed.');
    if (this.progress(wingId) < wing.target) return fail(`The wing needs ${wing.target}.`);
    this.w.museum.claimed.push(wingId);
    if (WINGS.every((x) => this.w.museum.claimed.includes(x.id)) && !this.s.player.devotion.titles.includes(MUSEUM.title)) this.s.player.devotion.titles.push(MUSEUM.title);
    this.changed('museum');
    return { ok: true, text: `${wing.relic.name} is yours.` };
  }

  // ------------------------------------------------------------------ 97: Lost Tongues

  tongueTier(): number {
    return Math.min(TONGUES.length, generalRank(this.s.player, 'read-ancient-script'));
  }

  decipher(zone: string): WResult {
    const t = TABLETS.find((x) => x.zone === zone);
    if (!t) return fail('No tablet there.');
    if (this.s.world.zone.id !== zone) return fail('You must stand in that region.');
    if (this.w.tablets.includes(zone)) return fail('You have read it.');
    if (this.tongueTier() < t.tier) return fail(`It is written in ${TONGUES[t.tier - 1]}. You read ${this.tongueTier() ? TONGUES[this.tongueTier() - 1] : 'nothing of the kind'}.`);
    this.w.tablets.push(zone);
    const lvl = this.s.player.level;
    this.s.addGold(LOST_TONGUES.goldPerLevel * lvl, 'tablet');
    this.s.grantXp(LOST_TONGUES.xpPerLevel * lvl, true);
    this.s.devotion.apply({ [LOST_TONGUES.favorGod]: LOST_TONGUES.favor }, 'tablet', true, true);
    if (this.w.tablets.length >= TABLETS.length && !this.s.player.devotion.titles.includes(LOST_TONGUES.title)) this.s.player.devotion.titles.push(LOST_TONGUES.title);
    this.s.bus.emit('stateChanged', { reason: 'tablet' });
    return { ok: true, text: `The tablet gives up its meaning: +${LOST_TONGUES.goldPerLevel * lvl} gold and experience.` };
  }

  // ------------------------------------------------------------------ 98: Lyssara's Dreams

  private dream(day: number): void {
    const w = this.w;
    if (w.dream?.day === day) return;
    const rng = new Rng(hash(`dream:${day}:${this.s.player.name}`));
    if (!rng.chance(DREAMS.chance)) return;
    w.dream = { n: rng.int(0, PROPHECY_DREAMS.length + BATTLE_DREAMS.length + MEMORY_DREAMS.length - 1), day, done: false };
    this.note('You dreamed. It stays with you.', 'info');
    this.s.bus.emit('stateChanged', { reason: 'dream' });
  }

  describe(): { kind: 'prophecy' | 'battle' | 'memory'; text: string } | undefined {
    const d = this.w.dream;
    if (!d) return undefined;
    const p = PROPHECY_DREAMS.length;
    const b = BATTLE_DREAMS.length;
    if (d.n < p) {
      const f = nextFestival(d.day);
      const god = seasonOf(d.day + 8).def.god;
      return { kind: 'prophecy', text: PROPHECY_DREAMS[d.n]!.replace('{festival}', `${f.festival.name} (in ${f.inDays} days)`).replace('{god}', content.gods.get(god).name) };
    }
    if (d.n < p + b) return { kind: 'battle', text: BATTLE_DREAMS[d.n - p]! };
    const comps = content.companions.all();
    const c = comps[(d.n - p - b) % comps.length]!;
    return { kind: 'memory', text: MEMORY_DREAMS[d.n - p - b]!.replace('{name}', c.name) };
  }

  /** Face the dream (battle dreams), or take its gift (the others). */
  resolveDream(): WResult {
    const d = this.w.dream;
    const info = this.describe();
    if (!d || !info || d.done) return fail('No dream waits.');
    if (info.kind === 'battle') {
      const lvl = this.s.player.level;
      const pool = content.enemies.filter((e) => (e.types.includes('nightmare') || e.types.includes('spirit')) && e.tier === 'normal' && Math.abs(e.level - lvl) <= 14);
      if (pool.length < 2) return fail('The dream slips away.');
      const rng = new Rng(hash(`lyssara:${d.day}`));
      const res = this.s.endgame.startSpecial({ module: 'lyssara', ref: String(d.n), label: 'A dream of Lyssara', level: lvl, waves: [[rng.pick(pool).id, rng.pick(pool).id]], boss: rng.pick(pool).id, threat: 4 });
      return res.ok ? { ok: true } : res;
    }
    d.done = true;
    this.w.dreams++;
    let text = 'The dream settles into memory.';
    if (info.kind === 'memory') {
      const comps = content.companions.all();
      const c = comps[(d.n - PROPHECY_DREAMS.length - BATTLE_DREAMS.length) % comps.length]!;
      if (this.s.state.party.companions[c.id]) this.s.party.adjust(c.id, DREAMS.approval);
      text = `${c.name} seems a little closer.`;
    }
    this.titleCheck();
    this.s.bus.emit('stateChanged', { reason: 'dream' });
    return { ok: true, text };
  }

  private dreamFought(won: boolean): void {
    const d = this.w.dream;
    if (!d) return;
    if (won) {
      d.done = true;
      this.w.dreams++;
      this.w.shards++;
      const gold = DREAMS.shardGoldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'dream');
      this.note(`You wake with a shard of the dream in your hand: +${gold} gold.`, 'level');
      this.titleCheck();
    } else this.note('The dream shakes you awake. It will be back.', 'warning');
    this.s.bus.emit('stateChanged', { reason: 'dream' });
  }

  private titleCheck(): void {
    if (this.w.dreams >= DREAMS.titleAt && !this.s.player.devotion.titles.includes(DREAMS.title)) this.s.player.devotion.titles.push(DREAMS.title);
  }
}
