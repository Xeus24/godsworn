import { content } from '../../data';
import { ARCANA_PERK, FORGE_ELEMENTS, INK, INK_PRICE, RIDERS, SHAPES, forgeCost, maxCircle, maxForged } from '../../data/spellforge';
import type { Arcanum } from '../../data/tabletop';
import { CLASS_KITS, DEFAULT_KITS, HIRELING, HIRELINGS, KITS, KIT_DC, KIT_TRAIN_PRICE, type HirelingDef, type KitDef } from '../../data/workshop';
import { createItem } from '../items/generate';
import { countOf, takeQuantity } from '../items/inventory';
import { createWorkshop, type WorkshopState } from '../realm/marvels';
import { circleOfRecipe, ensureForged, forgeId, parseForgeId } from '../skills/forge';
import type { ModifierSpec } from '../stats/modifiers';
import type { Element } from '../stats/types';
import { characterStats } from '../character/stats';
import { check, statMod } from '../tabletop/dice';
import type { GameSession } from './gameState';

export type WResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): WResult => ({ ok: false, reason });

/**
 * Section I-7c: Spellforging (218), Kits (219) and Hirelings (220). State: `realm.marvels.workshop`; forged spell ids live on
 * `character.forged` so battles can build them. Hireling and kit effects go out through `mods()`.
 */
export class WorkshopActions {
  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('timeChanged', (e) => this.payWages(e.day));
    bus.on('combatEnded', (e) => this.afterBattle(e.result));
    // Rebuild forged spells for a loaded save.
    for (const id of s.player.forged ?? []) ensureForged(id);
  }

  get t(): WorkshopState {
    const m = this.s.state.realm.marvels;
    if (!m.workshop) {
      m.workshop = createWorkshop();
      const cls = this.s.player.classes[0]?.classId ?? '';
      m.workshop.kits.prof = [...(CLASS_KITS[cls] ?? DEFAULT_KITS)];
    }
    return m.workshop;
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  private town(): string | undefined {
    return this.s.world.inTown();
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  // ------------------------------------------------------------------ 218: Spellforging

  get circleCap(): number {
    return maxCircle(this.s.player.level);
  }

  get forgedIds(): string[] {
    return this.s.player.forged ?? [];
  }

  get inkCount(): number {
    return countOf(this.s.state.inventory, INK.id);
  }

  buyInk(n: number): WResult {
    if (!this.town()) return fail('Spell-ink is sold in town.');
    if (!this.s.spendGold(INK_PRICE * n, 'spell-ink')) return fail(`${n} spell-ink costs ${INK_PRICE * n} gold.`);
    this.s.items.give(createItem(INK.id, n, () => this.s.newUid()), false);
    this.changed('forge');
    return { ok: true, text: `You buy ${n} spell-ink.` };
  }

  forge(arcanum: Arcanum, shapeId: string, element: Element, riderId: string): WResult {
    if (!this.town()) return fail('A spell is forged at a town’s workbench.');
    const shape = SHAPES.find((x) => x.id === shapeId);
    const rider = RIDERS.find((x) => x.id === riderId);
    if (!shape || !rider || !FORGE_ELEMENTS.includes(element) || !(arcanum in ARCANA_PERK)) return fail('That recipe is not in the book.');
    const id = forgeId(arcanum, shape.id, element, rider.id);
    const p = this.s.player;
    if ((p.forged ?? []).includes(id)) return fail('You have already forged that spell.');
    const circle = circleOfRecipe({ arcanum, shape, element, rider });
    if (circle > this.circleCap) return fail(`Circle ${circle} is beyond you: you may forge up to Circle ${this.circleCap}.`);
    if ((p.forged ?? []).length >= maxForged(p.level)) return fail(`You can keep ${maxForged(p.level)} forged spells; unforge one first.`);
    const cost = forgeCost(circle);
    if (countOf(this.s.state.inventory, INK.id) < cost.ink) return fail(`It needs ${cost.ink} spell-ink.`);
    if (!this.s.spendGold(cost.gold, 'spellforge')) return fail(`It costs ${cost.gold} gold.`);
    takeQuantity(this.s.state.inventory, INK.id, cost.ink);
    ensureForged(id);
    p.forged = [...(p.forged ?? []), id];
    this.changed('forge');
    return { ok: true, text: `You forge ${content.skills.get(id).name} (Circle ${circle}).` };
  }

  unforge(id: string): WResult {
    const p = this.s.player;
    if (!(p.forged ?? []).includes(id)) return fail('You have not forged that.');
    p.forged = (p.forged ?? []).filter((x) => x !== id);
    this.changed('forge');
    return { ok: true, text: 'The spell fades from your book.' };
  }

  circleOf(id: string): number {
    const r = parseForgeId(id);
    return r ? circleOfRecipe(r) : 0;
  }

  // ------------------------------------------------------------------ 219: Kits

  kit(id: string): KitDef {
    const k = KITS.find((x) => x.id === id);
    if (!k) throw new Error(`Unknown kit: ${id}`);
    return k;
  }

  owns(id: string): boolean {
    return this.t.kits.owned.includes(id);
  }

  proficient(id: string): boolean {
    return this.t.kits.prof.includes(id);
  }

  buyKit(id: string): WResult {
    const k = this.kit(id);
    if (!this.town()) return fail('Kits are sold in town.');
    if (this.owns(id)) return fail('You already carry that.');
    if (!this.s.spendGold(k.price, 'kit')) return fail(`${k.name} costs ${k.price} gold.`);
    this.t.kits.owned.push(id);
    this.changed('kit');
    return { ok: true, text: `You buy the ${k.name}.` };
  }

  /** Learn to use a kit properly: a day with a master, for gold. */
  train(id: string): WResult {
    const k = this.kit(id);
    if (!this.town()) return fail('Training is found in town.');
    if (this.proficient(id)) return fail('You already know it.');
    if (!this.s.spendGold(KIT_TRAIN_PRICE, 'kit training')) return fail(`Training costs ${KIT_TRAIN_PRICE} gold.`);
    this.t.kits.prof.push(id);
    this.s.advanceTime(4 * 60);
    this.changed('kit');
    return { ok: true, text: `You are now proficient with the ${k.name}.` };
  }

  /** A day’s work: a check on the kit’s stat (without proficiency it is harder). Once a day for each kit. */
  work(id: string): WResult {
    const k = this.kit(id);
    if (!this.owns(id)) return fail('You do not carry that kit.');
    if ((this.t.kits.used[id] ?? -1) === this.day) return fail('You have worked with it today.');
    const p = this.s.player;
    const mod = statMod(characterStats(p)[k.stat], p.level) + (this.proficient(id) ? 0 : -3);
    const r = check(this.s.rng, mod, KIT_DC);
    this.t.kits.used[id] = this.day;
    this.s.advanceTime(60);
    if (!r.success) return { ok: true, text: `The ${k.name} yields nothing today (${r.total} against ${KIT_DC}).` };
    const more = r.crit === 'nat20' ? 2 : 1;
    if ('gold' in k.makes) {
      const gold = k.makes.gold * p.level * more;
      this.s.addGold(gold, 'kit');
      return { ok: true, text: `You make ${k.makes.name}: ${gold} gold.` };
    }
    this.s.items.give(createItem(k.makes.itemId, more, () => this.s.newUid()), false);
    return { ok: true, text: `You make ${k.makes.name}${more > 1 ? ' (two, on a flawless day)' : ''}.` };
  }

  // ------------------------------------------------------------------ 220: Hirelings

  def(id: string): HirelingDef {
    const h = HIRELINGS.find((x) => x.id === id);
    if (!h) throw new Error(`Unknown hireling: ${id}`);
    return h;
  }

  get hired(): { def: HirelingDef; level: number; xp: number; morale: number } | undefined {
    const h = this.t.hire;
    return h ? { def: this.def(h.type), level: h.level, xp: h.xp, morale: h.morale } : undefined;
  }

  wage(level: number): number {
    return HIRELING.wageBase + HIRELING.wagePerLevel * level;
  }

  hire(id: string): WResult {
    const d = this.def(id);
    if (!this.town()) return fail('Hirelings are found in town.');
    if (this.t.hire) return fail('You already keep a retainer. Dismiss them first.');
    if (!this.s.spendGold(d.hire, 'hireling')) return fail(`Hiring a ${d.name} costs ${d.hire} gold.`);
    this.t.hire = { type: id, level: 1, xp: 0, morale: HIRELING.moraleStart, paidDay: this.day };
    this.changed('hireling');
    return { ok: true, text: `A ${d.name} joins you. Wages: ${this.wage(1)} gold a day.` };
  }

  dismiss(): WResult {
    const h = this.t.hire;
    if (!h) return fail('You keep no retainer.');
    this.t.gone.push(h.type);
    this.t.hire = undefined;
    this.changed('hireling');
    return { ok: true, text: 'You part on good terms.' };
  }

  /** Wages are paid each new day; if you cannot, they grumble, and at zero morale they leave. */
  private payWages(day: number): void {
    const h = this.t.hire;
    if (!h || day <= h.paidDay) return;
    const days = day - h.paidDay;
    h.paidDay = day;
    const owed = this.wage(h.level) * days;
    if (this.s.state.gold >= owed && this.s.spendGold(owed, 'wages')) return;
    h.morale -= HIRELING.moraleUnpaid * days;
    if (h.morale <= 0) {
      this.s.bus.emit('toast', { kind: 'warning', text: `Your ${this.def(h.type).name} walks off, unpaid.` });
      this.t.gone.push(h.type);
      this.t.hire = undefined;
    } else this.s.bus.emit('toast', { kind: 'warning', text: `Your ${this.def(h.type).name} is owed ${owed} gold and is not happy.` });
    this.changed('hireling');
  }

  private afterBattle(result: string): void {
    const h = this.t.hire;
    if (!h) return;
    if (result === 'victory') {
      h.morale = Math.min(100, h.morale + HIRELING.moraleWin);
      h.xp++;
      if (h.level < HIRELING.maxLevel && h.xp >= HIRELING.xpPerLevel * h.level) {
        h.xp = 0;
        h.level++;
        this.s.bus.emit('toast', { kind: 'info', text: `Your ${this.def(h.type).name} grows more capable (level ${h.level}).` });
      }
    } else if (result === 'defeat') h.morale = Math.max(1, h.morale - HIRELING.moraleLoss);
    this.changed('hireling');
  }

  /** The road wears a hero with a guide down more slowly (read by Weariness). */
  get marchStep(): number {
    return this.t.hire?.type === 'guide' ? HIRELING.guideMarch : 1;
  }

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const id of this.t.kits.owned) {
      if (this.proficient(id)) out.push(...this.kit(id).mods);
    }
    const h = this.t.hire;
    if (h) {
      const scale = h.level * (h.morale < HIRELING.moraleLow ? 0.5 : 1);
      for (const m of this.def(h.type).perLevel) out.push({ ...m, value: Math.round(m.value * scale * 100) / 100 });
    }
    return out;
  }
}
