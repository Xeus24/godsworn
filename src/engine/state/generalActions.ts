import { content } from '../../data';
import { clampVitals, restoreFull } from '../character/stats';
import type { TimedBuff } from '../character/types';
import { createItem } from '../items/generate';
import { takeQuantity } from '../items/inventory';
import type { ItemInstance } from '../items/types';
import type { Battle } from '../combat/battle';
import {
  bookSkill,
  canLearnGeneral,
  ensureGeneralSlots,
  generalSlotCount,
  learnGeneral,
  setGeneralSlot,
  studyTerms,
  trainGeneral,
  utilityChance,
  utilityRank,
  type GeneralResult,
} from '../skills/general';
import { chooseSpec, specChangeCost, type SpecResult } from '../skills/specs';
import type { GameSession } from './gameState';

/** Hours a rest at camp takes before Camping. */
export const REST_HOURS = 8;
/** Camping shortens a rest by this many minutes per rank. */
export const CAMPING_MINUTES_PER_RANK = 30;
/** Well Rested lasts this many battles. */
export const WELL_RESTED_BATTLES = 3;

const fail = (reason: string): GeneralResult => ({ ok: false, reason });

/** General skills, books, the Library, specializations and resting on a running game. */
export class GeneralActions {
  constructor(private readonly s: GameSession) {}

  private done<T extends { ok: boolean }>(result: T, reason: string): T {
    if (result.ok) {
      clampVitals(this.s.player);
      this.s.bus.emit('stateChanged', { reason });
    }
    return result;
  }

  private bookAt(index: number): ItemInstance | undefined {
    const item = this.s.state.inventory.slots[index] ?? undefined;
    return item && bookSkill(item.baseId) ? item : undefined;
  }

  /** Reads (consumes) the book at an inventory slot: learn its skill or gain a rank. */
  readBook(index: number): GeneralResult {
    const book = this.bookAt(index);
    const skill = book ? bookSkill(book.baseId) : undefined;
    if (!book || !skill) return fail('That is not a skillbook.');
    const result = learnGeneral(this.s.player, skill.id);
    if (!result.ok) return result;
    takeQuantity(this.s.state.inventory, book.baseId, 1);
    this.s.bus.emit('toast', { kind: 'level', text: result.message });
    this.s.devotion.deed('bookRead');
    return this.done(result, 'general');
  }

  /** Library: pay gold and spend days studying a book you own, without consuming it. */
  study(index: number): GeneralResult {
    if (!this.s.world.inTown()) return fail('Libraries are in towns.');
    const book = this.bookAt(index);
    const skill = book ? bookSkill(book.baseId) : undefined;
    if (!book || !skill) return fail('That is not a skillbook.');
    const check = canLearnGeneral(this.s.player, skill.id);
    if (!check.ok) return check;
    const terms = studyTerms(book.baseId);
    if (!this.s.spendGold(terms.gold, 'library')) return fail(`Studying costs ${terms.gold} gold.`);
    this.s.advanceTime(terms.days * 24 * 60);
    const result = learnGeneral(this.s.player, skill.id);
    if (result.ok) {
      this.s.bus.emit('toast', { kind: 'level', text: `After ${terms.days} day${terms.days > 1 ? 's' : ''} in the Library: ${result.message}` });
      this.s.devotion.deed('bookRead');
    }
    return this.done(result, 'general');
  }

  setSlot(slot: number, id: string | null): GeneralResult {
    return this.done(setGeneralSlot(this.s.player, slot, id), 'general');
  }

  /** First choice is free; changing costs 100 gold per level and refunds the old branch. */
  chooseSpec(classId: string, specId: string): SpecResult {
    const p = this.s.player;
    const changing = p.classes.find((c) => c.classId === classId)?.specialization !== undefined;
    const cost = changing ? specChangeCost(p) : 0;
    if (this.s.state.gold < cost) return { ok: false, reason: `Changing specialization costs ${cost} gold.` };
    const result = chooseSpec(p, classId, specId);
    if (!result.ok) return result;
    if (cost > 0) this.s.spendGold(cost, 'specialization');
    this.s.bus.emit('toast', { kind: 'level', text: `Specialization: ${content.specializations.get(specId).name}` });
    return this.done(result, 'spec');
  }

  /** Minutes a rest takes with the character's Camping rank. */
  restMinutes(): number {
    return REST_HOURS * 60 - CAMPING_MINUTES_PER_RANK * utilityRank(this.s.player, 'camping');
  }

  /** Rest at camp: full HP/MP; Camping also grants Well Rested. */
  rest(): void {
    const p = this.s.player;
    restoreFull(p);
    this.s.party.restoreAll();
    this.s.advanceTime(this.restMinutes());
    const camping = utilityRank(p, 'camping');
    if (camping > 0) {
      const buff: TimedBuff = {
        id: 'well-rested',
        name: 'Well Rested',
        modifiers: [{ stat: 'damageBonus', type: 'flat', value: camping }],
        battlesLeft: WELL_RESTED_BATTLES,
      };
      p.timedBuffs = [...p.timedBuffs.filter((b) => b.id !== buff.id), buff];
    }
    this.s.bus.emit('toast', { kind: 'info', text: camping > 0 ? `You rest by the fire and wake Well Rested (+${camping}% damage for ${WELL_RESTED_BATTLES} battles).` : 'You rest by the fire and wake refreshed.' });
    this.s.devotion.onRest();
    this.s.bus.emit('stateChanged', { reason: 'rest' });
  }

  /** Grows the slot list after a level-up; returns how many slots were added. */
  growSlots(): number {
    const p = this.s.player;
    const before = p.generalSlots.length;
    ensureGeneralSlots(p);
    return Math.max(0, generalSlotCount(p) - before);
  }

  /**
   * After a battle: general combat skills train by use; slotted passive and
   * utility skills train by 1 per victory. Returns [skill id, new rank] pairs.
   */
  trainAfterBattle(b: Battle): [string, number][] {
    const p = this.s.player;
    const gains = new Map<string, number>(Object.entries(b.tally.generalUses));
    if (b.outcome === 'victory') {
      for (const id of p.generalSlots) {
        const def = id ? content.generalSkills.find(id) : undefined;
        if (def && !def.combatSkill) gains.set(def.id, (gains.get(def.id) ?? 0) + 1);
      }
    }
    const ups: [string, number][] = [];
    for (const [id, xp] of gains) {
      const rank = trainGeneral(p, id, xp);
      if (rank !== undefined) {
        ups.push([id, rank]);
        this.s.bus.emit('toast', { kind: 'level', text: `${content.generalSkills.get(id).name} trained to rank ${rank}.` });
      }
    }
    return ups;
  }

  /** Foraging (herbs) and Scavenging (other materials) after a victory. */
  fieldFinds(itemLevel: number): ItemInstance[] {
    const p = this.s.player;
    const tier = Math.max(1, Math.ceil(itemLevel / 12));
    const out: ItemInstance[] = [];
    const find = (herb: boolean): void => {
      const pool = content.items.filter((b) => b.category === 'material' && b.tier <= tier && (b.kind === 'herb') === herb && b.kind !== 'essence');
      if (pool.length === 0) return;
      const base = this.s.rng.pick(pool);
      out.push(createItem(base.id, this.s.rng.int(1, 2), () => this.s.newUid()));
    };
    if (this.s.rng.chance(utilityChance(p, 'foraging'))) find(true);
    if (this.s.rng.chance(utilityChance(p, 'scavenging'))) find(false);
    return out;
  }
}
