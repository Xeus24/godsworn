import { content } from '../../data';
import { DEVOTION } from '../../data/devotion';
import { characterBaseStats, characterStats, clampVitals } from '../character/stats';
import type { Battle } from '../combat/battle';
import { createItem } from '../items/generate';
import { canAdd, addItem } from '../items/inventory';
import { itemValue } from '../items/itemStats';
import { baseOf } from '../items/lookup';
import { equippedItems } from '../items/equipment';
import {
  blessingScale,
  canReceiveMinor,
  chooseOffer,
  grantMinor,
  refreshOffers,
  slotBlessing,
  unslotBlessing,
  type BlessingResult,
} from '../gods/blessings';
import {
  applyFavor,
  atLeast,
  discover,
  favorOf,
  goldOfferingFavor,
  itemOfferingFavor,
  judgeDeeds,
  tierFor,
  tierIndex,
  tierName,
  type DeedOccurrence,
  type FavorChange,
} from '../gods/devotion';
import { punisherGod, rollPunisher } from '../gods/punishers';
import type { DeedEvent } from '../gods/types';
import type { GameSession } from './gameState';

export type DevotionResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): DevotionResult => ({ ok: false, reason });

/** Favor, prayer, offerings, blessings and the gods' verdict after each battle. */
export class DevotionActions {
  constructor(private readonly s: GameSession) {}

  private get p() {
    return this.s.player;
  }

  private changed(reason: string): void {
    clampVitals(this.p);
    this.s.bus.emit('stateChanged', { reason });
  }

  /**
   * Applies favor deltas (gains x Favor Gain, rivals pay their share),
   * announces tier changes and new blessing offers, and returns the changes.
   */
  apply(deltas: Record<string, number>, reason: string, raw = false, quiet = false): FavorChange[] {
    const changes = applyFavor(this.p, deltas, characterStats(this.p).favorGain, raw);
    for (const ch of changes) {
      this.s.bus.emit('favorChanged', { god: ch.god, previous: ch.before, current: ch.after, reason });
      const before = tierFor(ch.before);
      const after = tierFor(ch.after);
      if (before !== after) {
        const name = content.gods.get(ch.god).name;
        const up = tierIndex(after) > tierIndex(before);
        this.s.bus.emit('toast', { kind: up ? 'favor' : 'warning', text: after === 'hated' ? `${name} now HATES you. Beware the divine punisher.` : `${name}: ${tierName(after)}` });
      }
    }
    if (!quiet && changes.length > 0) {
      const text = changes.map((ch) => `${content.gods.get(ch.god).name} ${ch.after > ch.before ? '+' : ''}${Math.round((ch.after - ch.before) * 10) / 10}`).join(' · ');
      this.s.bus.emit('toast', { kind: 'favor', text: `Favor: ${text}` });
    }
    for (const god of refreshOffers(this.p, this.s.rng)) {
      this.s.bus.emit('toast', { kind: 'blessing', text: `${content.gods.get(god).name} offers you a blessing. Visit the Pantheon to choose.` });
    }
    if (changes.length > 0) this.changed('favor');
    return changes;
  }

  /** Judges a batch of deeds and applies the result. */
  deeds(occurrences: readonly DeedOccurrence[], reason: string, quiet = false): FavorChange[] {
    const { deltas, discovered } = judgeDeeds(occurrences);
    discover(this.p, discovered);
    return this.apply(deltas, reason, false, quiet);
  }

  deed(event: DeedEvent, count = 1): FavorChange[] {
    return this.deeds([{ event, count }], event);
  }

  setPatron(god: string | undefined): DevotionResult {
    if (god !== undefined && !atLeast(this.p, god, DEVOTION.prayerTier)) return fail(`${content.gods.get(god).name} must at least acknowledge you.`);
    if (god === undefined) delete this.p.devotion.patron;
    else this.p.devotion.patron = god;
    this.changed('patron');
    return { ok: true };
  }

  /** Shrine prayer: once per in-game day per god, takes half an hour. */
  prayAtShrine(god: string): DevotionResult {
    const day = this.s.state.clock.day;
    if (this.p.devotion.lastPrayer[god] === day) return fail('You have already prayed to this god today.');
    if (tierFor(favorOf(this.p, god)) === 'hated') return fail(`${content.gods.get(god).name} does not hear you.`);
    this.p.devotion.lastPrayer[god] = day;
    this.s.advanceTime(30);
    this.apply({ [god]: DEVOTION.shrinePrayerFavor }, 'prayer');
    return { ok: true };
  }

  offerGold(god: string, gold: number): DevotionResult {
    const amount = Math.floor(gold);
    if (amount <= 0) return fail('Offer some gold.');
    if (!this.s.spendGold(amount, 'offering')) return fail('Not enough gold.');
    this.apply({ [god]: goldOfferingFavor(god, amount) }, 'offering');
    return { ok: true };
  }

  /** Offers one of the item in an inventory slot. */
  offerItem(god: string, index: number): DevotionResult {
    const item = this.s.state.inventory.slots[index];
    if (!item) return fail('Nothing to offer.');
    const favor = itemOfferingFavor(god, item.baseId, itemValue(item));
    if (favor <= 0) return fail('That is worth nothing to a god.');
    item.quantity--;
    if (item.quantity <= 0) this.s.state.inventory.slots[index] = null;
    this.apply({ [god]: favor }, 'offering');
    return { ok: true };
  }

  /** Spends favor on a minor blessing (a timed buff, scaled by Blessing Power). */
  receiveMinor(id: string): BlessingResult {
    const check = canReceiveMinor(this.p, id);
    if (!check.ok) return check;
    const b = content.blessings.get(id);
    this.apply({ [b.god]: -(b.favorCost ?? 0) }, 'blessing', true, true);
    grantMinor(this.p, id, blessingScale(characterBaseStats(this.p)));
    this.s.bus.emit('blessingGranted', { god: b.god, blessingId: id });
    this.s.bus.emit('toast', { kind: 'blessing', text: `${b.name}: ${b.description} (${b.battles} battles)` });
    this.changed('blessing');
    return { ok: true };
  }

  chooseOffer(god: string, id: string): BlessingResult {
    const result = chooseOffer(this.p, god, id);
    if (result.ok) {
      this.s.bus.emit('blessingGranted', { god, blessingId: id });
      this.s.bus.emit('toast', { kind: 'blessing', text: `Blessing received: ${content.blessings.get(id).name}` });
      this.changed('blessing');
    }
    return result;
  }

  slot(id: string): BlessingResult {
    const result = slotBlessing(this.p, id);
    if (result.ok) this.changed('blessing');
    return result;
  }

  unslot(id: string): BlessingResult {
    const result = unslotBlessing(this.p, id);
    if (result.ok) this.changed('blessing');
    return result;
  }

  /** Buys the god's Divine scripture (skillbook) with favor. */
  buyScripture(god: string): DevotionResult {
    const skill = content.generalSkills.all().find((g) => g.god === god);
    if (!skill) return fail('This god keeps no scripture.');
    if (!atLeast(this.p, god, DEVOTION.scriptureTier)) return fail(`Requires ${tierName(DEVOTION.scriptureTier)} devotion.`);
    if (favorOf(this.p, god) < DEVOTION.scriptureCost) return fail(`Costs ${DEVOTION.scriptureCost} favor.`);
    const book = createItem(`book-${skill.id}`, 1, () => this.s.newUid());
    if (!canAdd(this.s.state.inventory, book)) return fail('Your bags are full.');
    addItem(this.s.state.inventory, book);
    this.apply({ [god]: -DEVOTION.scriptureCost }, 'scripture', true, true);
    this.s.bus.emit('toast', { kind: 'loot', text: `Received ${baseOf(book).name}.` });
    this.changed('scripture');
    return { ok: true };
  }

  /** Resting recharges Divine Intervention (and some gods have opinions about rest). */
  onRest(): void {
    this.p.devotion.interventionReady = true;
    this.deed('rest');
  }

  /** Rolls whether a hated god's punisher joins the next fight. */
  punisherForFight(): string | undefined {
    return rollPunisher(this.p, this.s.rng);
  }

  /**
   * After a battle: what every god thinks of it (kills, crits, skills,
   * fleeing...), prayer costs, equipped Divine items, penance for beaten
   * punishers, and the spent Divine Intervention.
   */
  settle(b: Battle, gold: number, brokenItems: number): FavorChange[] {
    const t = b.tally;
    const occ: DeedOccurrence[] = [];
    const time = b.timeOfDay;
    if (b.outcome === 'victory') occ.push({ event: 'battleWon', timeOfDay: time });
    else if (b.outcome === 'defeat') occ.push({ event: 'battleLost', timeOfDay: time });
    else if (b.outcome === 'fled') occ.push({ event: 'battleFled', timeOfDay: time });
    for (const k of t.kills) occ.push({ event: 'kill', enemyTypes: k.types, tier: k.tier, ...(k.element ? { element: k.element } : {}) });
    if (t.partyCrits) occ.push({ event: 'crit', count: t.partyCrits });
    if (t.partyHeals) occ.push({ event: 'heal', count: t.partyHeals });
    if (t.summons) occ.push({ event: 'summon', count: t.summons });
    for (const [tag, n] of Object.entries(t.tagUses)) occ.push({ event: 'skillTag', tag, count: n });
    if (gold >= 100) occ.push({ event: 'goldLooted', count: Math.floor(gold / 100) });
    if (t.goldFound > 0) occ.push({ event: 'goldStolen', count: Math.ceil(t.goldFound / 10) });
    if (brokenItems > 0) occ.push({ event: 'itemBroken', count: brokenItems });

    const { deltas, discovered } = judgeDeeds(occ);
    discover(this.p, discovered);
    const add = (god: string, amount: number): void => {
      deltas[god] = (deltas[god] ?? 0) + amount;
    };
    for (const f of t.favor) add(f.god, f.amount);
    for (const [, item] of equippedItems(this.p)) {
      const god = content.uniques.find(item.uniqueId ?? '')?.requirements?.favor?.god;
      if (god) add(god, DEVOTION.divineItemFavorPerBattle);
    }
    const changes = this.apply(deltas, 'battle');
    // Penance: beating a punisher lifts its god out of Hatred.
    for (const k of t.kills) {
      const god = punisherGod(k.enemyId);
      if (god) changes.push(...this.apply({ [god]: DEVOTION.penanceFavor }, 'penance', true));
    }
    if (t.intervention) this.p.devotion.interventionReady = false;
    return changes;
  }
}
