import { content } from '../../data';
import { ALIGNED, AWAKEN, COMPASS_ID, COAT_ID, CROWN_ID, DEBTOR, DISHES, FORGE, GODFORGE, HAMMER_ID, HAMMER_STEPS, LANTERN_ID, MEALS, PET, PET_TALENT, RELIC_RULES, RING_ID, TALENTS, TALKING_RELICS, TRAIT_TEXT, WICKS, type Talent, type Trait } from '../../data/craft';
import type { Battle } from '../combat/battle';
import { Rng } from '../core/rng';
import { generateGear } from '../items/generate';
import { createCraft, type CraftState } from '../realm/marvels';
import { secretFlag } from '../world/secrets';
import { mapFor } from '../world/mapgen';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type KResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): KResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);

/**
 * Items and crafting (H-6a): Talking Relics (142), Relic Awakening (143), Legend Rumors (144), Pet Talents (145), Hearth Meals (146),
 * the Named Legendaries' own rules (147) and Godforge Relics (148). State: `realm.marvels.craft`.
 */
export class CraftActions {
  constructor(private readonly s: GameSession) {
    s.bus.on('timeChanged', (e) => this.daily(e.day));
  }

  get k(): CraftState {
    const m = this.s.state.realm.marvels;
    return (m.craft ??= createCraft());
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  /** Whether a unique item is worn. */
  worn(uniqueId: string): boolean {
    return Object.values(this.s.player.equipment).some((i) => i?.uniqueId === uniqueId);
  }

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const id of this.k.relics.carried) if ((this.k.relics.mood[id] ?? 0) > RELIC_RULES.sulkAt) out.push(TALKING_RELICS.find((r) => r.id === id)!.mod);
    for (let i = 0; i < this.k.defectors.length; i++) out.push({ stat: 'xpGain', type: 'more', value: 1 } as ModifierSpec);
    const talent = this.petTalent();
    if (talent === 'haggle') out.push(PET.haggle);
    if (talent === 'ward') out.push(PET.ward);
    if (talent === 'light') out.push({ stat: 'accuracy', type: 'flat', value: 3 } as ModifierSpec);
    if (this.worn(LANTERN_ID)) {
      const n = Math.min(WICKS.maxPassives, Math.floor(this.k.wicks.length / WICKS.perPassive));
      for (let i = 0; i < n; i++) out.push(WICKS.passives[i] as ModifierSpec);
    }
    return out;
  }

  private daily(day: number): void {
    const k = this.k;
    if (k.relics.day !== day) {
      for (const id of Object.keys(k.relics.mood)) k.relics.mood[id] = Math.sign(k.relics.mood[id]!) * Math.max(0, Math.abs(k.relics.mood[id]!) - RELIC_RULES.daily);
      k.relics.day = day;
    }
    if (this.worn(RING_ID) && k.debt !== day) {
      k.debt = day;
      const take = Math.floor(this.s.state.gold * DEBTOR.share);
      if (take > 0) {
        this.s.spendGold(take, 'debt');
        this.note(`The Debtor’s Ring takes its tithe: ${take} gold.`, 'warning');
      }
    }
    // The lantern gathers a wick for each town whose lights you have seen.
    const town = this.s.world.inTown();
    if (town && this.worn(LANTERN_ID)) this.addWick(`town:${town}`);
  }

  // ------------------------------------------------------------------ 142: Talking Relics

  take(id: string): KResult {
    const r = TALKING_RELICS.find((x) => x.id === id);
    if (!r) return fail('No such relic.');
    if (this.k.relics.owned.includes(id)) return fail('You already have it.');
    if (this.s.world.zone.id !== r.zone) return fail(`It lies in ${content.zones.get(r.zone).name}.`);
    if (this.s.player.level < r.lvl) return fail(`It wakes at level ${r.lvl}.`);
    this.k.relics.owned.push(id);
    this.k.relics.mood[id] = 0;
    if (this.k.relics.carried.length < RELIC_RULES.carry) this.k.relics.carried.push(id);
    this.changed('relic');
    return { ok: true, text: `${r.name} says: ${r.text}` };
  }

  carry(id: string, on: boolean): KResult {
    const rel = this.k.relics;
    if (!rel.owned.includes(id)) return fail('You do not have it.');
    if (!on) rel.carried = rel.carried.filter((x) => x !== id);
    else if (!rel.carried.includes(id)) {
      if (rel.carried.length >= RELIC_RULES.carry) return fail(`You can carry ${RELIC_RULES.carry}.`);
      rel.carried.push(id);
    }
    this.changed('relic');
    return { ok: true };
  }

  sulking(id: string): boolean {
    return (this.k.relics.mood[id] ?? 0) <= RELIC_RULES.sulkAt;
  }

  /** The style of the fight just ended, as the relics see it. */
  traits(b: Battle): Trait[] {
    const out: Trait[] = [];
    if (b.tally.spared.length) out.push('mercy');
    if (b.tally.kills.length >= 3) out.push('violence');
    if (b.tally.stolen.length) out.push('theft');
    if (b.outcome === 'fled') out.push('flight');
    if (b.tally.kills.some((x) => x.tier === 'boss' || x.tier === 'worldBoss')) out.push('boss');
    if (b.tally.talked.length) out.push('talk');
    if (b.tally.parts.length) out.push('parts');
    return out;
  }

  /** After a fight: relics approve and bristle, and sometimes argue. */
  afterBattle(b: Battle): void {
    const traits = this.traits(b);
    const rel = this.k.relics;
    for (const id of rel.carried) {
      const r = TALKING_RELICS.find((x) => x.id === id)!;
      const was = this.sulking(id);
      let d = 0;
      if (traits.includes(r.likes)) d += RELIC_RULES.perBattle;
      if (traits.includes(r.dislikes)) d -= RELIC_RULES.perBattle;
      rel.mood[id] = Math.max(-8, Math.min(8, (rel.mood[id] ?? 0) + d));
      if (!was && this.sulking(id)) this.note(`${r.name} goes silent. It does not like how you have been carrying on (${TRAIT_TEXT[r.dislikes]}).`, 'warning');
      else if (was && !this.sulking(id)) this.note(`${r.name} grudgingly speaks again.`, 'info');
    }
    const rng = new Rng(hash(`argue:${this.s.state.clock.day}:${rel.carried.join()}`));
    for (const a of rel.carried) {
      for (const c of rel.carried) {
        const ra = TALKING_RELICS.find((x) => x.id === a)!;
        const rc = TALKING_RELICS.find((x) => x.id === c)!;
        if (a < c && (ra.likes === rc.dislikes || rc.likes === ra.dislikes) && traits.length && rng.chance(RELIC_RULES.argueChance)) {
          this.note(`${ra.name} and ${rc.name} argue about ${TRAIT_TEXT[ra.likes === rc.dislikes ? ra.likes : rc.likes]}.`, 'info');
        }
      }
    }
    this.awaken(b);
    for (const id of [...b.tally.talked, ...b.tally.spared]) {
      if (id.startsWith('choir-defector-') && !this.k.defectors.includes(id)) {
        this.k.defectors.push(id);
        this.note(`${content.enemies.get(id).name} walks out of the Choir, and will tell you what they know.`, 'quest');
      }
    }
    this.s.wonders.refresh();
  }

  // ------------------------------------------------------------------ 143: Relic Awakening

  private styleCount(b: Battle, style: string): number {
    const t = b.tally;
    switch (style) {
      case 'parts': return t.parts.length;
      case 'spare': return t.spared.length + t.talked.length;
      case 'crits': return Math.min(6, t.partyCrits);
      case 'interrupts': return t.interrupts;
      case 'heals': return Math.min(6, t.partyHeals);
      case 'steals': return t.stolen.length;
      case 'kills': return Math.min(6, t.kills.length);
      case 'lore': return Object.values(t.generalUses).reduce((n, v) => n + v, 0) > 0 ? 2 : 0;
      case 'oaths': return t.oathsBroken === 0 ? 1 : 0;
      default: return 0;
    }
  }

  /** God-aligned living items grow when you fight in their god’s style. */
  awaken(b: Battle): void {
    for (const [, item] of Object.entries(this.s.player.equipment)) {
      if (!item || item.livingXp === undefined || !item.uniqueId) continue;
      const al = ALIGNED[item.uniqueId];
      if (!al) continue;
      const n = Math.min(AWAKEN.perBattle, this.styleCount(b, al.style) * AWAKEN.perEvent);
      if (n <= 0) continue;
      const before = item.livingXp;
      item.livingXp += n;
      const def = content.uniques.find(item.uniqueId);
      const woke = def?.living?.stages.find((st) => before < st.xp && item.livingXp! >= st.xp);
      if (woke) this.note(`${def!.name} awakens (${cap(al.god)}’s way): ${woke.text}.`, 'loot');
    }
  }

  // ------------------------------------------------------------------ 144: Legend Rumors

  /** What a tavern says of a legendary you have not found: where to look, and what it looks like. */
  rumorOf(id: string): string {
    const u = content.uniques.get(id);
    const zone = content.zones.all().filter((z) => !z.off && !z.ngPlus).sort((a, b) => Math.abs((a.levels[0] + a.levels[1]) / 2 - u.level) - Math.abs((b.levels[0] + b.levels[1]) / 2 - u.level))[0];
    const kind = u.baseId.replace(/-t\d+$/, '').replace(/-/g, ' ');
    const verbs = ['They say a', 'A drover swears he saw a', 'An old soldier told me of a', 'My cousin’s cousin once held a'];
    const v = verbs[hash(id) % verbs.length];
    return `${v} ${kind} of ${u.rarity} make, “${(u.lore ?? 'a thing with a long memory').split(/[.;]/)[0]}”, turns up in the stories around ${zone?.name ?? 'the road'}.`;
  }

  rumors(): { id: string; text: string }[] {
    const town = this.s.world.inTown();
    if (!town) return [];
    const found = new Set(this.s.player.codexUniques ?? []);
    const list = content.uniques.all().filter((u) => u.rarity === 'legendary' && !u.noDrop && !found.has(u.id));
    const week = Math.floor(this.s.state.clock.day / 7);
    const rng = new Rng(hash(`rumors:${town}:${week}`));
    return rng.shuffle(list).slice(0, 3).map((u) => ({ id: u.id, text: this.rumorOf(u.id) }));
  }

  // ------------------------------------------------------------------ 145: Pet Talents

  petTalent(): Talent | undefined {
    const pet = this.s.player.stable.pet;
    return pet ? (PET_TALENT[pet] ?? 'sniff') : undefined;
  }

  /** Nearest secret on this map you have not found, as a heading and a distance. */
  nearestSecret(): string | undefined {
    const w = this.s.state.world;
    const map = mapFor(w.position.map);
    let best: { d: number; x: number; y: number } | undefined;
    for (const e of map.entities) {
      if (e.kind !== 'secret' || !e.secret || this.s.state.flags[secretFlag(e.secret)]) continue;
      const d = Math.abs(e.x - w.position.x) + Math.abs(e.y - w.position.y);
      if (!best || d < best.d) best = { d, x: e.x, y: e.y };
    }
    if (!best) return undefined;
    const dx = best.x - w.position.x;
    const dy = best.y - w.position.y;
    const dir = `${dy < -1 ? 'north' : dy > 1 ? 'south' : ''}${dx < -1 ? 'west' : dx > 1 ? 'east' : ''}` || 'right here';
    return `${dir}, about ${best.d} steps`;
  }

  usePet(): KResult {
    const t = this.petTalent();
    if (!t) return fail('You have no pet with you.');
    const day = this.s.state.clock.day;
    switch (t) {
      case 'sniff': {
        const r = this.nearestSecret();
        return { ok: true, text: r ? `Your ${this.petName()} sniffs the air: something hidden lies ${r}.` : `Your ${this.petName()} finds nothing left to sniff out here.` };
      }
      case 'scout':
        this.s.world.revealAround(9);
        return { ok: true, text: `Your ${this.petName()} flits ahead and the map opens around you.` };
      case 'track': {
        const seen = this.s.player.bestiary;
        const z = content.zones.all().find((zone) => !zone.off && !zone.ngPlus && zone.roaming.some((g) => g.enemies.some((e) => !seen[e.enemyId])));
        const foe = z?.roaming.flatMap((g) => g.enemies).find((e) => !seen[e.enemyId]);
        return { ok: true, text: z && foe ? `Your ${this.petName()} picks up a trail: ${content.enemies.get(foe.enemyId).name}, in ${z.name}.` : 'Your pet has met every trail there is.' };
      }
      case 'forage': {
        if (this.k.forage === day) return fail('It has already foraged today.');
        this.k.forage = day;
        const gold = PET.forageGoldPerLevel * this.s.player.level;
        this.s.addGold(gold, 'forage');
        return { ok: true, text: `Your ${this.petName()} turns up ${gold} gold in the leaf-litter.` };
      }
      default:
        return { ok: true, text: `${TALENTS[t].name}: ${TALENTS[t].text}` };
    }
  }

  petName(): string {
    const id = this.s.player.stable.pet;
    return id ? content.pets.get(id).name : 'pet';
  }

  // ------------------------------------------------------------------ 146: Hearth Meals

  taste(companionId: string): { favorite: string; hated: string } {
    const h = hash(`taste:${companionId}`);
    const favorite = DISHES[h % DISHES.length]!;
    const hated = DISHES.filter((d) => d.taste !== favorite.taste)[(h >>> 5) % DISHES.filter((d) => d.taste !== favorite.taste).length]!;
    return { favorite: favorite.id, hated: hated.id };
  }

  /** Cook for the camp: companions’ approval and the party’s morale. One meal a day. */
  cook(dishId: string): KResult {
    const dish = DISHES.find((d) => d.id === dishId);
    if (!dish) return fail('No such dish.');
    if (!this.s.world.inTown()) return fail('A meal needs a fire: cook in a town, at camp.');
    if (this.k.meals.day === this.s.state.clock.day) return fail('You have already cooked today.');
    const cost = dish.costPerLevel * this.s.player.level;
    if (!this.s.spendGold(cost, 'meal')) return fail(`The ingredients cost ${cost} gold.`);
    this.k.meals.day = this.s.state.clock.day;
    this.k.meals.count++;
    const lines: string[] = [];
    for (const c of this.s.party.recruited()) {
      const t = this.taste(c.id);
      const d = t.favorite === dishId ? MEALS.favorite : t.hated === dishId ? MEALS.hated : MEALS.liked;
      this.s.party.adjust(c.id, d, true);
      lines.push(`${content.companions.get(c.id).name}: ${d >= MEALS.favorite ? 'their favorite!' : d < 0 ? 'their least favorite…' : 'good.'}`);
    }
    this.s.fellowship.lift(MEALS.morale, `${dish.name} at the fire`);
    this.changed('meal');
    return { ok: true, text: `${dish.name}: ${dish.text} ${lines.join(' ')}` };
  }

  // ------------------------------------------------------------------ 147: Named Legendaries

  private give(uniqueId: string): void {
    const item = generateGear({ rng: this.s.rng, itemLevel: content.uniques.get(uniqueId).level, newUid: () => this.s.newUid() }, { uniqueId });
    this.s.items.receiveLoot([{ ...item, identified: true }], 0);
  }

  hammerNeed(step: number): boolean {
    const need = HAMMER_STEPS[step]?.need;
    const st = this.s.state.stats;
    if (need === 'worldboss') return st.worldBossesKilled > 0;
    if (need === 'boss') return st.bossesKilled > 0;
    return true;
  }

  /** The six-step forging of Thalor’s Unfinished Hammer; each step grows it. */
  forgeHammer(): KResult {
    const k = this.k;
    const step = k.hammer;
    if (step >= HAMMER_STEPS.length) return fail('The hammer is finished.');
    const s = HAMMER_STEPS[step]!;
    if (step === 3 && this.s.player.level < 25) return fail('Come back at level 25.');
    if (!this.hammerNeed(step)) return fail(s.need === 'worldboss' ? 'It needs a world boss’s blood.' : 'It needs a boss’s fire.');
    const cost = s.cost * this.s.player.level;
    if (!this.s.spendGold(cost, 'hammer')) return fail(`This step costs ${cost} gold.`);
    k.hammer++;
    if (k.hammer === 1) this.give(HAMMER_ID);
    else {
      for (const [, it] of Object.entries(this.s.player.equipment)) if (it?.uniqueId === HAMMER_ID && it.livingXp !== undefined) it.livingXp = Math.max(it.livingXp, (k.hammer - 1) * 10);
      for (const it of this.s.state.inventory.slots) if (it?.uniqueId === HAMMER_ID && it.livingXp !== undefined) it.livingXp = Math.max(it.livingXp, (k.hammer - 1) * 10);
    }
    this.changed('hammer');
    return { ok: true, text: `Step ${k.hammer} of 6: ${s.text}` };
  }

  addWick(source: string): boolean {
    if (this.k.wicks.includes(source)) return false;
    this.k.wicks.push(source);
    if (this.k.wicks.length % WICKS.perPassive === 0) this.changed('wick');
    return true;
  }

  /** Add a light source to the Lantern: a lit shrine, a Lanternmarch lamp, a candle. */
  kindle(name: string): KResult {
    if (!this.worn(LANTERN_ID)) return fail('The Lantern must be worn to gather wicks.');
    return this.addWick(name) ? { ok: true, text: `A wick is added to the Lantern (${this.k.wicks.length}).` } : fail('It has that light already.');
  }

  compass(): KResult {
    if (!this.worn(COMPASS_ID)) return fail('Wear the Mapless Compass.');
    const r = this.nearestSecret();
    return { ok: true, text: r ? `The needle swings: ${r}.` : 'The needle spins idly. Nothing here is left unfound.' };
  }

  quietCrown(): boolean {
    return this.worn(CROWN_ID);
  }
  coatWorn(): boolean {
    return this.worn(COAT_ID);
  }

  // ------------------------------------------------------------------ 148: Godforge Relics

  forgeable(god: string): boolean {
    return (this.s.player.bestiary[`aspect-${god}`] ?? 0) > 0 && !this.k.forged.includes(god);
  }

  forge(god: string): KResult {
    const g = GODFORGE.find((x) => x.god === god);
    if (!g) return fail('No such god.');
    if (this.k.forged.includes(god)) return fail('Already forged.');
    if (!((this.s.player.bestiary[`aspect-${god}`] ?? 0) > 0)) return fail(`You have not slain ${cap(god)}’s aspect.`);
    const cost = FORGE.goldPerLevel * this.s.player.level;
    if (!this.s.spendGold(cost, 'godforge')) return fail(`The forging costs ${cost} gold.`);
    this.k.forged.push(god);
    this.give(g.id);
    this.changed('godforge');
    return { ok: true, text: `${g.name}. Its last words: ${g.last}` };
  }

}
