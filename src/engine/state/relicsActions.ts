import { content } from '../../data';
import { DIVINE_SEASONS } from '../../data/pilgrimage';
import { BAZAAR, BROKEN_RELICS, EXCAVATION, HEIRLOOM, HEIRLOOMS, RESTORATION, STATUES, STATUE_BUFFS } from '../../data/relicsLand';
import { Rng } from '../core/rng';
import { createItem } from '../items/generate';
import { createRelics, type RelicsState } from '../realm/marvels';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type RResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): RResult => ({ ok: false, reason });
const BIG = new Set(['elite', 'champion', 'boss', 'miniboss', 'worldBoss', 'punisher']);

/** Cursed Heirlooms (37), the Wandering Bazaar (38), Ruins Excavation (46), Hero Statues (58) and Relic Restoration (53). State: `realm.marvels.relics`. */
export class RelicsActions {
  constructor(private readonly s: GameSession) {
    s.bus.on('enemyKilled', (e) => {
      if (BIG.has(e.tier) && this.s.rng.chance(RESTORATION.dropChance)) this.grantShard();
    });
    s.bus.on('zoneEntered', () => this.s.wonders.refresh());
    s.bus.on('timeChanged', () => this.checkHeirlooms());
  }

  get r(): RelicsState {
    const m = this.s.state.realm.marvels;
    return (m.relics ??= createRelics());
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  /** What these give the hero: curses on carried heirlooms, lifted ones for good, restored relics, temples and the statue of this region. */
  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const hl of HEIRLOOMS) {
      const st = this.r.heirlooms[hl.id];
      if (!st) continue;
      if (st.lifted) out.push(...hl.lifted);
      else if (st.carried) out.push(...hl.curse);
    }
    for (const id of this.r.restored) out.push(...(BROKEN_RELICS.find((x) => x.id === id)?.mods ?? []));
    for (const t of this.r.temples) {
      const god = t.split(':')[1];
      out.push(...(DIVINE_SEASONS.find((d) => d.god === god)?.party ?? []).map((m) => ({ ...m, value: Math.round(m.value * 5) / 10 }) as ModifierSpec));
    }
    const zone = this.s.world.zone.id;
    if (this.r.statues.includes(zone)) out.push(...this.statueBuff(zone).mods);
    return out;
  }

  // ------------------------------------------------------------------ 37: Cursed Heirlooms

  /** Heirlooms turn up as you grow: found on the first day you are the right level. */
  private checkHeirlooms(): void {
    for (const hl of HEIRLOOMS) {
      if (this.r.heirlooms[hl.id] || this.s.player.level < hl.level) continue;
      this.r.heirlooms[hl.id] = { carried: false, from: {}, lifted: false };
      this.note(`${hl.name} has found its way to you. ${hl.text}`, 'quest');
    }
  }

  heirlooms(): { def: (typeof HEIRLOOMS)[number]; carried: boolean; lifted: boolean; have: number }[] {
    this.checkHeirlooms();
    const tally = this.s.faith.f.tally;
    return HEIRLOOMS.filter((hl) => this.r.heirlooms[hl.id]).map((hl) => {
      const st = this.r.heirlooms[hl.id]!;
      return { def: hl, carried: st.carried, lifted: st.lifted, have: st.lifted ? hl.task.count : Math.min(hl.task.count, (tally[hl.task.counter] ?? 0) - (st.from[hl.task.counter] ?? 0)) };
    });
  }

  carry(id: string, on: boolean): RResult {
    const st = this.r.heirlooms[id];
    if (!st) return fail('You do not have it.');
    if (st.lifted) return fail('Its curse is lifted; it is yours for good.');
    if (on) {
      if (Object.values(this.r.heirlooms).filter((x) => x.carried && !x.lifted).length >= HEIRLOOM.carry) return fail(`You can carry only ${HEIRLOOM.carry} cursed things at once.`);
      st.carried = true;
      st.from = { ...this.s.faith.f.tally };
    } else st.carried = false;
    this.changed('heirloom');
    return { ok: true };
  }

  /** Called on the tally moving; lifts any heirloom whose task is met. */
  private checkLift(): void {
    for (const row of this.heirlooms()) {
      if (!row.carried || row.lifted || row.have < row.def.task.count) continue;
      const st = this.r.heirlooms[row.def.id]!;
      st.lifted = true;
      st.carried = false;
      this.note(`The curse on ${row.def.name} lifts. It is a Legendary now.`, 'level');
      if (HEIRLOOMS.every((x) => this.r.heirlooms[x.id]?.lifted) && !this.s.player.devotion.titles.includes(HEIRLOOM.title)) this.s.player.devotion.titles.push(HEIRLOOM.title);
      this.changed('heirloom');
    }
  }

  /** Re-check after any change in the tally (called by the faith tally). */
  tallyMoved(): void {
    this.checkLift();
  }

  // ------------------------------------------------------------------ 53: Relic Restoration

  grantShard(): void {
    const id = this.s.rng.pick(BROKEN_RELICS.filter((x) => !this.r.restored.includes(x.id))).id;
    if (!id) return;
    this.r.shards[id] = Math.min(RESTORATION.shards, (this.r.shards[id] ?? 0) + 1);
    this.note(`A shard of ${BROKEN_RELICS.find((x) => x.id === id)!.name}.`, 'loot');
    this.s.bus.emit('stateChanged', { reason: 'relic-shard' });
  }

  restore(id: string): RResult {
    const def = BROKEN_RELICS.find((x) => x.id === id);
    if (!def) return fail('No such relic.');
    if (this.r.restored.includes(id)) return fail('It is whole already.');
    if ((this.r.shards[id] ?? 0) < RESTORATION.shards) return fail(`You need ${RESTORATION.shards} shards.`);
    const cost = RESTORATION.cost * (this.r.restored.length + 1);
    if (this.s.state.gold < cost) return fail(`Mending costs ${cost} gold.`);
    this.s.spendGold(cost, 'relic-restoration');
    this.r.restored.push(id);
    if (this.r.restored.length >= BROKEN_RELICS.length && !this.s.player.devotion.titles.includes(RESTORATION.title)) this.s.player.devotion.titles.push(RESTORATION.title);
    this.changed('relic');
    return { ok: true, text: `${def.name} is whole.` };
  }

  // ------------------------------------------------------------------ 46: Ruins Excavation

  /** One buried temple in each region, to a god in turn. */
  sites(): { zone: string; name: string; god: string; id: string }[] {
    return content.zones.all().filter((z) => !z.ngPlus).map((z, i) => {
      const god = DIVINE_SEASONS[i % DIVINE_SEASONS.length]!.god;
      return { zone: z.id, name: `The Buried Temple of ${content.gods.get(god).name} (${z.name})`, god, id: `${z.id}:${god}` };
    });
  }

  dig(id: string): RResult {
    const site = this.sites().find((x) => x.id === id);
    if (!site) return fail('No such site.');
    if (this.s.world.zone.id !== site.zone) return fail('You must be in that region.');
    if (this.r.temples.includes(id)) return fail('It is already restored.');
    if (this.s.state.gold < EXCAVATION.digGold) return fail(`Labourers cost ${EXCAVATION.digGold} gold a dig.`);
    this.s.spendGold(EXCAVATION.digGold, 'excavation');
    this.s.advanceTime(EXCAVATION.digMinutes);
    const n = (this.r.dug[id] = (this.r.dug[id] ?? 0) + 1);
    if (n < EXCAVATION.digs) {
      this.s.bus.emit('stateChanged', { reason: 'dig' });
      return { ok: true, text: `Dig ${n} of ${EXCAVATION.digs}: stone, then older stone.` };
    }
    this.r.temples.push(id);
    this.s.devotion.apply({ [site.god]: EXCAVATION.favor }, 'excavation', true);
    if (this.s.rng.chance(EXCAVATION.shardChance)) this.grantShard();
    if (this.r.temples.length >= 10 && !this.s.player.devotion.titles.includes(EXCAVATION.title)) this.s.player.devotion.titles.push(EXCAVATION.title);
    this.changed('temple');
    return { ok: true, text: `${site.name} stands again. Its god is pleased.` };
  }

  // ------------------------------------------------------------------ 58: Hero Statues

  statueBuff(zone: string): (typeof STATUE_BUFFS)[number] {
    const idx = content.zones.all().filter((z) => !z.ngPlus).findIndex((z) => z.id === zone);
    return STATUE_BUFFS[Math.max(0, idx) % STATUE_BUFFS.length]!;
  }

  statueCost(zone: string): number {
    return STATUES.goldPerLevel * (content.zones.get(zone).levels[1] ?? 10);
  }

  raiseStatue(zone: string): RResult {
    if (this.r.statues.includes(zone)) return fail('A statue stands there already.');
    if (!this.s.world.inTown()) return fail('Masons work in towns.');
    if (this.s.world.zone.id !== zone) return fail('Raise it in the region it honours.');
    if (this.s.player.level < content.zones.get(zone).levels[0]) return fail('You have not earned a statue here yet.');
    const cost = this.statueCost(zone);
    if (this.s.state.gold < cost) return fail(`A statue costs ${cost} gold.`);
    this.s.spendGold(cost, 'statue');
    this.r.statues.push(zone);
    if (this.r.statues.length >= STATUES.titleAt && !this.s.player.devotion.titles.includes(STATUES.title)) this.s.player.devotion.titles.push(STATUES.title);
    this.changed('statue');
    return { ok: true, text: `Your statue rises. ${this.statueBuff(zone).name} lives here now.` };
  }

  // ------------------------------------------------------------------ 38: The Wandering Bazaar

  bazaarOpen(): boolean {
    return this.s.world.weatherNow() === BAZAAR.weather && !this.s.world.inTown();
  }

  /** Eight goods, different each foggy day. */
  bazaarStock(day = this.s.state.clock.day): { id: string; name: string; price: number; key: string }[] {
    const pool = content.items.filter((b) => ['consumable', 'gem', 'rune', 'curiosity'].includes(b.category));
    const rng = new Rng(day * 9973 + 11);
    return rng.sample(pool, BAZAAR.stock).map((b, i) => ({ id: b.id, name: b.name, price: Math.max(BAZAAR.minPrice, Math.round(((b as { value?: number }).value ?? 40) * BAZAAR.markup)), key: `${day}:${i}` }));
  }

  buyBazaar(key: string): RResult {
    if (!this.bazaarOpen()) return fail('The Bazaar is only there in the fog, on the open road.');
    const g = this.bazaarStock().find((x) => x.key === key);
    if (!g) return fail('That stall is gone.');
    if (this.r.bought.includes(key)) return fail('Already bought.');
    if (this.s.state.gold < g.price) return fail(`It costs ${g.price} gold.`);
    this.s.spendGold(g.price, 'bazaar');
    this.s.items.receiveLoot([createItem(g.id, 1, () => this.s.newUid())], 0);
    this.r.bought.push(key);
    this.s.bus.emit('stateChanged', { reason: 'bazaar' });
    return { ok: true, text: `${g.name}, for ${g.price} gold.` };
  }
}
