import { hasRule } from '../character/challenges';
import { content } from '../../data';
import { characterStats, clampVitals, restoreFull } from '../character/stats';
import type { Battle } from '../combat/battle';
import type { DeedOccurrence } from '../gods/devotion';
import { equipFromInventory, unequipToInventory, type Result } from '../items/equipment';
import type { EquipSlot } from '../items/types';
import {
  APPROVAL,
  approvalName,
  chooseBond,
  clampApproval,
  companionExtras,
  createCompanion,
  favorApproval,
  judgeCompanion,
  levelCompanion,
  openBondTiers,
  type CompanionExtras,
} from '../party/party';
import type { CompanionDef, CompanionState, PartyState } from '../party/types';
import type { Character } from '../character/types';
import { autoSpendTree } from '../character/autoBuild';
import { allocate, refund, resetBuild } from '../skills/tree';
import type { GameSession } from './gameState';

const fail = (reason: string): Result => ({ ok: false, reason });

/** Gold per character level to win back a companion who left. */
export const AMENDS_GOLD_PER_LEVEL = 40;

/**
 * Companions on a running game: recruiting, the active party (up to three
 * beside you), approval (from deeds, favor and dialogue), bond perks, gear,
 * shared XP, and carrying HP in and out of battle.
 */
export class PartyActions {
  constructor(private readonly s: GameSession) {
    s.bus.on('favorChanged', ({ god, previous, current }) => this.onFavor(god, current - previous));
  }

  private get party(): PartyState {
    return this.s.state.party;
  }

  private changed(reason: string): void {
    this.s.bus.emit('stateChanged', { reason });
  }

  def(id: string): CompanionDef {
    return content.companions.get(id);
  }

  get(id: string): CompanionState | undefined {
    return this.party.companions[id];
  }

  /** Companions travelling with you (in the party or in reserve), not those who left. */
  recruited(): CompanionState[] {
    return Object.values(this.party.companions).filter((c) => !c.left);
  }

  members(): CompanionState[] {
    return this.recruited().filter((c) => c.inParty);
  }

  recruit(id: string): void {
    if (this.party.companions[id]) return;
    const def = this.def(id);
    const comp = createCompanion(def, this.s.player.level, () => this.s.newUid(), undefined, false);
    comp.inParty = this.members().length < APPROVAL.partySize;
    this.party.companions[id] = comp;
    this.s.bus.emit('toast', { kind: 'quest', text: `${def.name} joins you${comp.inParty ? '' : ' (in reserve: your party is full)'}.` });
    this.changed('recruit');
  }

  /** Spends one of a companion's tree points on a node (player-allocated trees). */
  allocateTree(id: string, nodeId: string): Result {
    const comp = this.get(id);
    if (!comp) return fail('They are not with you.');
    const r = allocate(comp.character, this.def(id).classId, nodeId);
    if (!r.ok) return fail(r.reason);
    this.changed('companionTree');
    return { ok: true };
  }

  refundTree(id: string, nodeId: string): Result {
    const comp = this.get(id);
    if (!comp) return fail('They are not with you.');
    const r = refund(comp.character, this.def(id).classId, nodeId);
    if (!r.ok) return fail(r.reason);
    this.changed('companionTree');
    return { ok: true };
  }

  /** Refunds every point so the tree can be rebuilt; free for companions. */
  resetTree(id: string): Result {
    const comp = this.get(id);
    if (!comp) return fail('They are not with you.');
    resetBuild(comp.character, this.def(id).classId);
    this.changed('companionTree');
    return { ok: true };
  }

  /** Turns automatic tree building on (spending every free point now) or off (the tree stays as it is). */
  setAutoTree(id: string, on: boolean): Result {
    const comp = this.get(id);
    if (!comp) return fail('They are not with you.');
    comp.autoTree = on;
    if (on) autoSpendTree(comp.character, this.def(id).classId);
    this.changed('companionTree');
    return { ok: true };
  }

  setInParty(id: string, on: boolean): Result {
    const comp = this.get(id);
    if (!comp || comp.left) return fail('They are not with you.');
    if (on && !comp.inParty && this.members().length >= APPROVAL.partySize) return fail(`At most ${APPROVAL.partySize} companions can fight beside you.`);
    comp.inParty = on;
    this.changed('party');
    return { ok: true };
  }

  /** Changes approval; announces it, opens bond tiers, and sends them away if it falls too low. */
  adjust(id: string, amount: number, quiet = false): void {
    const comp = this.get(id);
    if (!comp || comp.left || amount === 0) return;
    const def = this.def(id);
    const openBefore = openBondTiers(def, comp).length;
    const before = comp.approval;
    comp.approval = clampApproval(comp.approval + amount);
    const delta = Math.round((comp.approval - before) * 10) / 10;
    if (delta !== 0 && !quiet) this.s.bus.emit('toast', { kind: delta > 0 ? 'info' : 'warning', text: `${def.name} ${delta > 0 ? 'approves' : 'disapproves'} (${delta > 0 ? '+' : ''}${delta}).` });
    if (openBondTiers(def, comp).length > openBefore) this.s.bus.emit('toast', { kind: 'level', text: `${def.name}'s bond deepens: choose a perk on the Party screen.` });
    if (comp.approval <= APPROVAL.leave) {
      comp.left = true;
      comp.inParty = false;
      this.s.bus.emit('toast', { kind: 'warning', text: `${def.name} has had enough of you and leaves for ${content.towns.get(def.town).name}.` });
    }
    this.changed('approval');
  }

  /** Your Charisma makes companions warmer to what pleases them (+0.5% per point) and no harsher to what does not. */
  private charm(amount: number): number {
    return amount > 0 ? amount * (1 + characterStats(this.s.player).cha / 200) : amount;
  }

  /** Companions in the party judge what they saw (one batch per battle or action). */
  onDeeds(occurrences: readonly DeedOccurrence[]): void {
    for (const comp of this.members()) {
      const amount = this.charm(judgeCompanion(this.def(comp.id), occurrences));
      if (amount !== 0) this.adjust(comp.id, amount, Math.abs(amount) < 1);
    }
  }

  private onFavor(god: string, delta: number): void {
    for (const comp of this.members()) {
      const amount = this.charm(favorApproval(this.def(comp.id), god, delta));
      if (amount !== 0) this.adjust(comp.id, amount, Math.abs(amount) < 1);
    }
  }

  chooseBond(id: string, nodeId: string): Result {
    const comp = this.get(id);
    if (!comp) return fail('They are not with you.');
    const result = chooseBond(this.def(id), comp, nodeId);
    if (result.ok) this.changed('bond');
    return result;
  }

  grantOath(id: string): void {
    const comp = this.get(id);
    if (!comp || comp.oath) return;
    comp.oath = true;
    const def = this.def(id);
    this.s.bus.emit('toast', { kind: 'level', text: `${def.name} swears an oath to you: ${def.oath.name}.` });
    this.changed('oath');
  }

  amendsCost(): number {
    return AMENDS_GOLD_PER_LEVEL * this.s.player.level;
  }

  /** Wins back a companion who left: gold for the road and an apology. They return at Neutral. */
  makeAmends(id: string): Result {
    const comp = this.party.companions[id];
    if (!comp?.left) return fail('They have not left you.');
    if (this.s.world.inTown() !== this.def(id).town) return fail(`Find them in ${content.towns.get(this.def(id).town).name}.`);
    if (!this.s.spendGold(this.amendsCost(), 'amends')) return fail(`It will take ${this.amendsCost()} gold to make it right.`);
    comp.left = false;
    comp.approval = 0;
    comp.inParty = this.members().length < APPROVAL.partySize;
    this.s.bus.emit('toast', { kind: 'quest', text: `${this.def(id).name} gives you another chance.` });
    this.changed('amends');
    return { ok: true };
  }

  /** Everyone who has joined (even those who left) learns from what you do. */
  shareXp(amount: number): void {
    for (const comp of Object.values(this.party.companions)) {
      const levels = levelCompanion(comp, this.def(comp.id), amount, this.s.state.levelCap, () => this.s.newUid());
      if (levels.length > 0) restoreFull(comp.character);
    }
  }

  restoreAll(): void {
    for (const comp of Object.values(this.party.companions)) restoreFull(comp.character);
  }

  /** Characters and their bond perks for the next battle. */
  battleMembers(): { char: Character; extras: CompanionExtras }[] {
    if (hasRule(this.s.player, 'noCompanions')) return [];
    return this.members().map((comp) => ({ char: comp.character, extras: companionExtras(this.def(comp.id), comp) }));
  }

  /** HP and MP carry over (as a share of the maximum); the fallen get back up after a victory; a defeat sends everyone home patched up. */
  afterBattle(b: Battle): void {
    for (const comp of this.members()) {
      const x = b.combatants.find((c) => c.id === `companion:${comp.id}`);
      if (!x) continue;
      const char = comp.character;
      if (b.outcome === 'defeat') {
        restoreFull(char);
        continue;
      }
      const own = characterStats(char);
      char.hp = Math.max(x.alive ? 1 : 0, Math.round((x.hp / Math.max(1, x.maxHp)) * own.maxHp));
      char.mp = Math.max(0, Math.round((x.mp / Math.max(1, x.maxMp)) * own.maxMp));
      if (char.hp <= 0) char.hp = 1;
      clampVitals(char);
    }
  }

  equip(id: string, invIndex: number): Result {
    const comp = this.get(id);
    if (!comp) return fail('They are not with you.');
    const char = comp.character;
    const result = equipFromInventory(char, this.s.state.inventory, invIndex, characterStats(char));
    if (result.ok) {
      clampVitals(char);
      this.changed('companionGear');
    }
    return result;
  }

  unequip(id: string, slot: EquipSlot): Result {
    const comp = this.get(id);
    if (!comp) return fail('They are not with you.');
    const result = unequipToInventory(comp.character, this.s.state.inventory, slot);
    if (result.ok) {
      clampVitals(comp.character);
      this.changed('companionGear');
    }
    return result;
  }

  approvalLabel(id: string): string {
    const comp = this.get(id);
    return comp ? approvalName(comp.approval) : '';
  }
}
