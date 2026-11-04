import { content } from '../../data';
import { GRUDGE } from '../../data/realm/grudge';
import type { Battle } from '../combat/battle';
import type { EncounterDef } from '../combat/types';
import { MAX_COMMISSIONS, eventsIn, generateChronicle, isDone, offered, take as takeCommission } from '../realm/chronicle';
import { createRealmState } from '../realm/types';
import { FORTUNES } from '../../data/realm/fortunes';
import { fortuneOf, innMult, isFallen, lift, priceMult, tick as fortunesTick, tierOf } from '../realm/fortunes';
import { TROPHY } from '../../data/trophies';
import { createItem, generateGear } from '../items/generate';
import { itemName } from '../items/naming';
import { SOULBOUND } from '../../data/soulbound';
import { addCreature, gainXp, movesKnown } from '../realm/ranch';
import { FINALE_MERCY, MERCY_TIERS } from '../../data/mercy';
import { ECHOES } from '../../data/realm/echoes';
import { decorate, forge, fullName, grudgeBounty, hierarchy, mark, rankTitle, scheme, slay } from '../realm/grudge';
import type { GrudgeEntry, RealmState } from '../realm/types';
import { festivalOn } from '../realm/wheel';
import { doDeed, marrowRewards, talk as marrowTalk, wait as marrowWait, type MarrowResult } from '../realm/marrow';
import type { MarrowPlace } from '../../data/realm/marrow';
import type { GameSession } from './gameState';

/** How many days of scheming one long rest or voyage can run (a year away does not run a year of them). */
const MAX_DAYS_AT_ONCE = 14;
/** Foes that never become Grudgebound: the story's own bosses and their guards. */
const UNMARKED_TIERS = new Set(['boss', 'worldBoss', 'miniboss', 'punisher']);

/**
 * The living world of Vael (Innovation Pack, section A): the Grudgebound, and later the Turning Wheel, the Three
 * Days of Marrow, Fortunes of the Realm, Echoes of the Fallen and the Chronicle of Ages.
 */
export class RealmActions {
  constructor(private readonly s: GameSession) {
    // Every new save gets its own three hundred years. Older saves are given theirs the first time they load.
    if (s.state.realm.chronicle.events.length === 0) s.state.realm.chronicle = generateChronicle(s.state.seed);
  }

  get state(): RealmState {
    return this.s.state.realm;
  }

  // ------------------------------------------------------------ the Grudgebound

  /** A wandering fight may be led by one of the region's Grudgebound. */
  decorate(encounter: EncounterDef, zone: string): EncounterDef {
    return decorate(this.state.grudge, encounter, zone, this.s.player.name, this.s.rng);
  }

  /** The Grudgebound of a region, top of the order first. */
  grudgebound(zone: string): GrudgeEntry[] {
    return hierarchy(this.state.grudge, zone);
  }

  /** Days pass: every region's pecking order schemes. */
  onDays(days: number): void {
    this.s.heart.onDay();
    const today = festivalOn(this.s.state.clock.day);
    if (today) this.s.bus.emit('toast', { kind: 'quest', text: `Today is ${today.name}, the feast of ${content.gods.get(today.god).name}. Find it in ${content.towns.get(today.town).name}.` });
    for (let i = 0; i < Math.min(days, MAX_DAYS_AT_ONCE); i++) {
      const day = this.s.state.clock.day - days + i + 1;
      const news = fortunesTick(this.state.fortunes, this.state.grudge, this.s.player, day, this.s.rng);
      if (news[0]) this.s.bus.emit('toast', { kind: 'warning', text: news[0] });
      const lines = scheme(this.state.grudge, day, this.s.rng);
      const first = lines[0];
      if (first && i === Math.min(days, MAX_DAYS_AT_ONCE) - 1) this.s.bus.emit('toast', { kind: 'info', text: `Word on the road: ${first}` });
    }
  }

  /** After a fight: foes that beat you or were run from get named; Grudgebound you killed are put down. */
  afterBattle(b: Battle): void {
    const day = this.s.state.clock.day;
    const st = this.state.grudge;
    for (const x of b.combatants) {
      if (x.side !== 'enemy' || !x.grudgeId || x.alive) continue;
      const g = st.entries[x.grudgeId];
      if (!g || g.slain !== undefined) continue;
      slay(st, g.id, day);
      const bounty = grudgeBounty(g, x.level);
      this.s.addGold(bounty.gold, 'grudge');
      this.s.grantXp(bounty.xp);
      this.s.bus.emit('toast', { kind: 'quest', text: `${fullName(g)}, ${rankTitle(g.rank)}, is dead. The road pays ${bounty.gold} gold.` });
    }
    this.bindAfter(b);
    this.trophyAfter(b);
    if (b.outcome === 'defeat') this.recordDeath(b);
    if (b.outcome === 'victory') this.countKills(b);
    if (b.isBoss || !b.encounterId.startsWith('wild:')) return;
    const zone = b.encounterId.slice('wild:'.length);
    if (!content.zones.find(zone)) return;
    if (b.outcome !== 'defeat' && b.outcome !== 'fled') return;
    const alive = b.combatants.filter((x) => x.side === 'enemy' && x.alive && x.kind === 'enemy' && x.enemyId && !UNMARKED_TIERS.has(x.tier));
    if (!alive.length) return;
    // The Grudgebound among them, or else the toughest one standing.
    const lead = alive.find((x) => x.grudgeId) ?? [...alive].sort((p, q) => q.level - p.level)[0];
    if (!lead?.enemyId) return;
    const beat = b.outcome === 'defeat';
    if (!beat && !lead.grudgeId && !this.s.rng.chance(GRUDGE.markOnFlee)) return;
    const result = mark(st, zone, lead.enemyId, lead.grudgeId, beat ? 'beat' : 'fled', day, this.s.rng);
    if (!result) return;
    const { entry, fresh } = result;
    this.s.bus.emit('toast', { kind: 'warning', text: fresh ? `${fullName(entry)} has your scent now. The whisper gave it a name.` : `${fullName(entry)} grows another scar. It remembers.` });
  }

  /** For tests and the debug panel: forges a Grudgebound outright. */
  forge(zone: string, enemyId: string, cause: GrudgeEntry['cause'] = 'beat'): GrudgeEntry | null {
    return forge(this.state.grudge, zone, enemyId, cause, this.s.state.clock.day, this.s.rng);
  }

  // ------------------------------------------------------------ the Three Days of Marrow

  private marrowEnd(result: MarrowResult): MarrowResult {
    if (result.ok && (result.ended === 'mended' || result.ended === 'emptied')) {
      const r = marrowRewards(result.ended);
      this.s.addGold(r.gold, 'marrow');
      this.s.grantXp(r.xp);
      this.s.devotion.apply(r.favor as Record<string, number>, 'quest');
      if (result.ended === 'mended') this.s.bus.emit('toast', { kind: 'level', text: 'Marrow is mended. The loop is broken for good.' });
      else this.s.bus.emit('toast', { kind: 'level', text: 'Marrow is emptied, but alive. The loop is broken.' });
      this.s.setFlag(`marrow-${result.ended}`, true);
      this.s.bus.emit('stateChanged', { reason: 'marrow' });
    }
    return result;
  }

  marrowTalk(villager: string, place: MarrowPlace): MarrowResult {
    const r = this.marrowEnd(marrowTalk(this.state.marrow, villager, place));
    this.s.bus.emit('stateChanged', { reason: 'marrow' });
    return r;
  }

  marrowDeed(deed: string, place: MarrowPlace): MarrowResult {
    const r = this.marrowEnd(doDeed(this.state.marrow, deed, place));
    this.s.bus.emit('stateChanged', { reason: 'marrow' });
    return r;
  }

  marrowWait(): MarrowResult {
    const r = marrowWait(this.state.marrow);
    this.s.bus.emit('stateChanged', { reason: 'marrow' });
    return r;
  }


  // ------------------------------------------------------------ Fortunes of the Realm

  priceMult(town: string): number {
    return priceMult(this.state.fortunes, town);
  }

  innMult(town: string): number {
    return innMult(this.state.fortunes, town);
  }

  isFallen(town: string): boolean {
    return isFallen(this.state.fortunes, town);
  }

  /** Raises (or lowers) a town's prosperity; a change of fortune is news. */
  lift(town: string, amount: number): void {
    const line = lift(this.state.fortunes, town, amount, this.s.state.clock.day);
    if (line) this.s.bus.emit('toast', { kind: amount >= 0 ? 'quest' : 'warning', text: line });
  }

  fortune(town: string) {
    const f = fortuneOf(this.state.fortunes, town);
    return { ...f, tier: tierOf(f) };
  }

  fundCost(): number {
    return FORTUNES.fundCostPerLevel * Math.max(5, this.s.player.level);
  }

  /** Gives gold to the town's repairs. */
  fund(town: string): { ok: boolean; reason?: string } {
    const cost = this.fundCost();
    if (!this.s.spendGold(cost, 'fortune')) return { ok: false, reason: `Repairs need ${cost} gold.` };
    this.lift(town, FORTUNES.fundGain);
    this.s.bus.emit('stateChanged', { reason: 'fortune' });
    return { ok: true };
  }

  // ------------------------------------------------------------ Echoes of the Fallen

  /** A lore page was found: if it is an echo, remember it. */
  onLore(id: string): void {
    const echo = ECHOES.find((e) => e.id === id);
    if (!echo || this.state.echoes.found[id] !== undefined) return;
    this.state.echoes.found[id] = this.s.state.clock.day;
    this.s.heart.tale();
    this.s.bus.emit('toast', { kind: 'info', text: `An echo of ${echo.name} stirs. It can be heard again in the Codex.` });
  }

  /** The echo's replay: choose `a`, `b` or (in the Barrows) `talk`. The first time pays a little XP. */
  replay(id: string, choice: 'a' | 'b' | 'talk'): { ok: boolean; text: string; xp?: number } {
    const echo = ECHOES.find((e) => e.id === id);
    if (!echo || this.state.echoes.found[id] === undefined) return { ok: false, text: 'You have not found that echo.' };
    if (choice === 'talk' && !echo.talk) return { ok: false, text: 'It does not answer.' };
    const first = this.state.echoes.replays[id] === undefined;
    this.state.echoes.replays[id] = choice;
    let xp: number | undefined;
    if (first) {
      xp = Math.round(this.s.player.level * 40);
      this.s.grantXp(xp);
    }
    const text = choice === 'talk' ? (echo.talk as [string, string])[1] : echo.replay[choice][1];
    this.s.bus.emit('stateChanged', { reason: 'echo' });
    return { ok: true, text, ...(xp ? { xp } : {}) };
  }

  /** On arriving in a region: in a later run, your own earlier defeats there are heard again. */
  onArrive(zone: string): void {
    const e = this.state.echoes;
    if (e.lastZone === zone) return;
    e.lastZone = zone;
    this.hearTale(zone);
    if (this.s.state.ngPlus <= 0) return;
    const mine = (this.s.state.legacy.echoes ?? []).filter((d) => d.zone === zone && !e.heard.includes(`${d.zone}:${d.day}:${d.name}`));
    for (const d of mine.slice(0, 2)) {
      e.heard.push(`${d.zone}:${d.day}:${d.name}`);
      const cls = content.classes.find(d.classId)?.name ?? d.classId;
      this.s.bus.emit('toast', { kind: 'warning', text: `You hear your own voice here, from another life: ${d.name}, a level ${d.level} ${cls}, fell to ${d.by}. “Not like this. Not here.”` });
    }
  }

  private recordDeath(b: Battle): void {
    const killer = b.combatants.filter((x) => x.side === 'enemy' && x.alive).sort((p, q) => q.level - p.level)[0];
    const zone = b.encounterId.startsWith('wild:') ? b.encounterId.slice('wild:'.length) : this.s.world.zone.id;
    const e = this.state.echoes;
    e.deaths.push({ name: this.s.player.name, classId: this.s.player.classes[0]?.classId ?? 'warrior', level: this.s.player.level, zone, by: killer?.name ?? 'something unseen', day: this.s.state.clock.day });
    if (e.deaths.length > 12) e.deaths.shift();
  }

  /** New Game+ begins: your defeats are kept as echoes, and the realm starts over. */
  newCycle(): void {
    const keep = this.state.echoes;
    const legacy = (this.s.state.legacy.echoes ??= []);
    legacy.push(...keep.deaths);
    if (legacy.length > 40) legacy.splice(0, legacy.length - 40);
    const fresh = createRealmState();
    fresh.echoes.found = keep.found;
    fresh.echoes.replays = keep.replays;
    fresh.chronicle = generateChronicle((this.s.state.seed + this.s.state.ngPlus * 7919) >>> 0);
    this.s.state.realm = fresh;
  }

  // ------------------------------------------------------------ the Chronicle of Ages

  get chronicle() {
    return this.state.chronicle;
  }

  /** On arriving in a region you hear a tale of it, if there is one you do not yet know. */
  private hearTale(zone: string): void {
    const ch = this.state.chronicle;
    const next = eventsIn(ch, zone).find((e) => ch.known[e.id] === undefined);
    if (!next) return;
    ch.known[next.id] = 1;
    this.s.bus.emit('toast', { kind: 'info', text: `A tale told in ${content.zones.get(zone).name}: ${next.title}. Its ruin is somewhere in the region.` });
  }

  /** A ruin: the full account, and a little something for the finding. */
  visitRuin(zone: string, index: number): string {
    const ch = this.state.chronicle;
    const event = eventsIn(ch, zone)[index];
    if (!event) return 'Bare stones, and grass that has long since forgotten what they were.';
    const first = ch.known[event.id] !== 2;
    if (first) this.s.heart.tale();
    ch.known[event.id] = 2;
    for (const c of ch.commissions) if (c.event === event.id) c.visited = true;
    this.checkCommissions();
    let reward = '';
    if (first) {
      const gold = this.s.player.level * 15;
      this.s.addGold(gold, 'chronicle');
      this.s.grantXp(this.s.player.level * 60);
      reward = ` (${gold} gold from the rubble)`;
    }
    this.s.bus.emit('stateChanged', { reason: 'chronicle' });
    return `${event.place}: ${event.text}${reward}`;
  }

  private countKills(b: Battle): void {
    const ch = this.state.chronicle;
    if (!ch.commissions.length) return;
    const zone = b.encounterId.startsWith('wild:') ? b.encounterId.slice('wild:'.length) : this.s.world.zone.id;
    const n = b.tally.kills.length;
    for (const c of ch.commissions) {
      const e = ch.events.find((x) => x.id === c.event);
      if (e && e.zone === zone) c.slain = Math.min(c.need, c.slain + n);
    }
    this.checkCommissions();
  }

  commissionsOffered() {
    return offered(this.state.chronicle);
  }

  takeCommission(eventId: string): { ok: boolean; reason?: string } {
    const r = takeCommission(this.state.chronicle, eventId);
    if (!r.ok) return r;
    this.s.bus.emit('stateChanged', { reason: 'chronicle' });
    return { ok: true };
  }

  private checkCommissions(): void {
    const ch = this.state.chronicle;
    for (const c of [...ch.commissions]) {
      if (!isDone(c)) continue;
      const e = ch.events.find((x) => x.id === c.event);
      ch.commissions = ch.commissions.filter((x) => x !== c);
      ch.completed.push(c.event);
      const gold = this.s.player.level * 50;
      this.s.addGold(gold, 'chronicle');
      this.s.grantXp(this.s.player.level * 150);
      if (e) this.s.devotion.apply({ [e.god]: 15 }, 'quest');
      this.s.bus.emit('toast', { kind: 'quest', text: `Commission done: ${e?.title ?? 'a chronicle commission'}. ${gold} gold from the Chroniclers.` });
    }
  }

  readonly maxCommissions = MAX_COMMISSIONS;

  // ------------------------------------------------------------ Hesha's Mercy

  /** Foes spared through Talk are remembered: a count that the story reads, and Hesha's favor. */
  mercy(b: Battle): void {
    const flags = this.s.state.flags;
    for (const m of b.tally.mercy) {
      flags['mercy'] = Number(flags['mercy'] ?? 0) + (m.boss ? 2 : 1);
      if (m.boss) flags['mercy-bosses'] = Number(flags['mercy-bosses'] ?? 0) + 1;
      flags[`spared-${m.enemyId}`] = true;
      if (FINALE_MERCY[m.enemyId]) flags['mercy-finale'] = true;
      this.s.devotion.apply({ hesha: m.boss ? 8 : 3 }, 'quest');
    }
    const n = Number(flags['mercy'] ?? 0);
    const before = n - b.tally.mercy.reduce((a, m) => a + (m.boss ? 2 : 1), 0);
    for (const t of MERCY_TIERS) if (before < t.min && n >= t.min) this.s.bus.emit('toast', { kind: 'favor', text: `${t.name}: ${t.text}` });
  }

  // ------------------------------------------------------------ Soulbinding

  get ranch() {
    return this.state.ranch;
  }

  /** The creature that fights beside you, as battle setup wants it. */
  activeCreature(): { id: string; enemyId: string; name: string; level: number; stage: number; moves: number } | undefined {
    const c = this.ranch.creatures.find((x) => x.id === this.ranch.active);
    return c ? { id: c.id, enemyId: c.enemyId, name: c.name, level: c.level, stage: c.stage, moves: movesKnown(c) } : undefined;
  }

  /** After a fight: creatures bound are welcomed to the ranch, and the one that fought earns its keep. */
  private bindAfter(b: Battle): void {
    const zone = b.encounterId.startsWith('wild:') ? b.encounterId.slice('wild:'.length) : this.s.world.zone.id;
    for (const t of b.tally.bound) {
      const c = addCreature(this.ranch, t.enemyId, t.level, zone, this.s.state.clock.day);
      this.s.bus.emit('toast', { kind: 'quest', text: c ? `${c.name} joins your ranch (level ${c.level}).` : `Your ranch is full. ${t.name} slips the seal and runs.` });
    }
    const fought = b.combatants.find((x) => x.soulboundId);
    const creature = fought ? this.ranch.creatures.find((x) => x.id === fought.soulboundId) : undefined;
    if (creature && b.outcome === 'victory') {
      const bosses = b.tally.kills.filter((k) => k.tier === 'boss' || k.tier === 'worldBoss').length;
      const r = gainXp(creature, SOULBOUND.xpPerBattle + SOULBOUND.xpPerLevel * creature.level + bosses * 3 * SOULBOUND.xpPerBattle, this.s.player.level);
      if (r.evolved) this.s.bus.emit('toast', { kind: 'level', text: `${creature.name} evolves!` });
      else if (r.levels) this.s.bus.emit('toast', { kind: 'level', text: `${creature.name} reaches level ${creature.level}.` });
    }
  }

  setActive(id: string | undefined): void {
    if (id === undefined || this.ranch.creatures.some((c) => c.id === id)) this.ranch.active = id;
    this.s.bus.emit('stateChanged', { reason: 'ranch' });
  }

  release(id: string): void {
    this.ranch.creatures = this.ranch.creatures.filter((c) => c.id !== id);
    if (this.ranch.active === id) this.ranch.active = this.ranch.creatures[0]?.id;
    this.s.bus.emit('stateChanged', { reason: 'ranch' });
  }

  feedCost(): number {
    return SOULBOUND.feedGoldPerLevel * Math.max(5, this.s.player.level);
  }

  /** A treat: a little experience, for gold. */
  feed(id: string): { ok: boolean; reason?: string } {
    const c = this.ranch.creatures.find((x) => x.id === id);
    if (!c) return { ok: false, reason: 'No such creature.' };
    if (c.level >= this.s.player.level) return { ok: false, reason: 'It has grown as far as you have.' };
    if (!this.s.spendGold(this.feedCost(), 'ranch')) return { ok: false, reason: `A treat costs ${this.feedCost()} gold.` };
    const r = gainXp(c, SOULBOUND.feedXp, this.s.player.level);
    if (r.evolved) this.s.bus.emit('toast', { kind: 'level', text: `${c.name} evolves!` });
    this.s.bus.emit('stateChanged', { reason: 'ranch' });
    return { ok: true };
  }

  expandCost(): number {
    return SOULBOUND.ranch.expandCost;
  }

  expand(): { ok: boolean; reason?: string } {
    if (this.ranch.capacity >= SOULBOUND.ranch.maxCapacity) return { ok: false, reason: 'The ranch cannot grow any larger.' };
    if (!this.s.spendGold(this.expandCost(), 'ranch')) return { ok: false, reason: `New pens cost ${this.expandCost()} gold.` };
    this.ranch.capacity += SOULBOUND.ranch.expandBy;
    this.s.bus.emit('stateChanged', { reason: 'ranch' });
    return { ok: true };
  }

  // ------------------------------------------------------------ Trophy Forging

  /** The parts broken off a boss that fell are yours. */
  private trophyAfter(b: Battle): void {
    if (b.outcome !== 'victory') return;
    for (const p of b.tally.parts) {
      const boss = b.combatants.find((x) => x.enemyId === p.enemyId && x.side === 'enemy');
      if (!boss || boss.alive) continue;
      const item = createItem('boss-trophy', 1, () => this.s.newUid());
      item.trophy = { boss: p.enemyId, part: p.part };
      item.itemLevel = boss.level;
      this.s.items.give(item);
      this.s.bus.emit('toast', { kind: 'loot', text: `Trophy: ${itemName(item)}.` });
    }
  }

  /** Trophies in the bags and stash, by boss and part. */
  trophies(): { boss: string; parts: string[] }[] {
    const held = new Map<string, Set<string>>();
    const all = [...this.s.state.inventory.slots, ...this.s.state.stash.tabs.flatMap((t) => t.slots)];
    for (const it of all) if (it?.trophy) (held.get(it.trophy.boss) ?? held.set(it.trophy.boss, new Set()).get(it.trophy.boss)!).add(it.trophy.part);
    return [...held.entries()].map(([boss, parts]) => ({ boss, parts: [...parts] }));
  }

  forgeCost(bossId: string): number {
    return TROPHY.forgeGoldPerLevel * content.enemies.get(bossId).level;
  }

  /** Turns a boss's three parts into a weapon and armor that carry its name. */
  forgeTrophies(bossId: string): { ok: boolean; reason?: string; weapon?: string; armor?: string } {
    if (!this.s.world.inTown()) return { ok: false, reason: 'Thalor’s smiths work in town.' };
    const boss = content.enemies.find(bossId);
    if (!boss) return { ok: false, reason: 'Unknown boss.' };
    const set = this.trophies().find((t) => t.boss === bossId);
    if (!set || set.parts.length < TROPHY.parts) return { ok: false, reason: `Needs all three of ${boss.name}’s parts.` };
    const cost = this.forgeCost(bossId);
    if (this.s.state.gold < cost) return { ok: false, reason: `The forge asks ${cost} gold.` };
    const inv = this.s.state.inventory;
    const taken = new Set<string>();
    const places = [...inv.slots.map((_, i) => ({ list: inv.slots, i })), ...this.s.state.stash.tabs.flatMap((t) => t.slots.map((_, i) => ({ list: t.slots, i })))];
    for (const { list, i } of places) {
      const it = list[i];
      if (it?.trophy?.boss === bossId && !taken.has(it.trophy.part)) {
        taken.add(it.trophy.part);
        list[i] = null;
      }
    }
    this.s.spendGold(cost, 'forge');
    const p = this.s.player;
    const mk = (rarity: typeof TROPHY.weaponRarity | typeof TROPHY.armorRarity, category: 'weapon' | 'armor') => {
      const item = generateGear({ rng: this.s.rng, itemLevel: Math.max(boss.level, 1), newUid: () => this.s.newUid(), ngPlus: this.s.state.ngPlus, favorClassId: p.classes[0]?.classId }, { rarity, categories: [category] });
      item.label = `${boss.name}’s ${content.items.get(item.baseId).name}`;
      item.identified = true;
      this.s.items.give(item);
      return itemName(item);
    };
    const weapon = mk(TROPHY.weaponRarity, 'weapon');
    const armor = mk(TROPHY.armorRarity, 'armor');
    this.s.bus.emit('toast', { kind: 'loot', text: `Forged: ${weapon} and ${armor}.` });
    this.s.bus.emit('stateChanged', { reason: 'forge' });
    return { ok: true, weapon, armor };
  }
}
