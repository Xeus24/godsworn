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
import { BANTER } from '../../data/story/banter';
import { hashString } from '../core/rng';
import type { Conversation } from './conversation';
import type { GameSession } from './gameState';

/** Approval each camp scene needs. */
export const SCENE_APPROVAL = [45, 65, 85] as const;

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

  // ------------------------------------------------------------ camp

  /** The next banter line this companion has for you at your approval (they go through them in order). */
  private nextBanter(def: CompanionDef, comp: CompanionState): string {
    const lines = (BANTER[def.id] ?? []).filter((l) => l.min <= comp.approval);
    return lines.length ? (lines[comp.banter % lines.length]?.text ?? '').replaceAll('{hero}', this.s.player.name) : '';
  }

  /** A chat by the fire: one a day each. It warms them a little and gives a line of banter. */
  campTalk(id: string): Result & { line?: string } {
    const comp = this.get(id);
    if (!comp || comp.left) return fail('They are not with you.');
    const day = this.s.state.clock.day;
    if (comp.lastTalk === day) return fail('They have said all they had to say today.');
    const def = this.def(id);
    const line = this.nextBanter(def, comp);
    comp.lastTalk = day;
    comp.banter++;
    this.adjust(id, this.charm(1.5), true);
    this.changed('camp');
    return { ok: true, line };
  }

  /** Why the next camp scene is closed, or nothing if it is open. */
  sceneBlocked(id: string): string | undefined {
    const comp = this.get(id);
    const def = this.def(id);
    if (!comp || comp.left) return 'They are not with you.';
    if (!def.scenes) return 'They have no evenings to spare for this.';
    if (comp.scenes >= SCENE_APPROVAL.length) return 'You have shared everything there is to share.';
    const need = SCENE_APPROVAL[comp.scenes] ?? 100;
    if (comp.approval < need) return `They are not ready yet (${need} approval).`;
    return undefined;
  }

  /** An evening with a companion: the next camp scene. */
  campScene(id: string): Conversation | undefined {
    if (this.sceneBlocked(id) !== undefined) return undefined;
    const comp = this.get(id) as CompanionState;
    return this.s.quests.scene(id, `d-scene-${id}-${comp.scenes + 1}`);
  }

  finishScene(id: string): void {
    const comp = this.get(id);
    if (!comp) return;
    comp.scenes = Math.min(SCENE_APPROVAL.length, comp.scenes + 1);
    this.s.bus.emit('toast', { kind: 'quest', text: `${this.def(id).name}: a moment you will both remember.` });
    this.changed('scene');
  }

  /** Banter on the road: now and then, someone in the party says something. No dice are rolled, so it never moves a fight's luck. */
  ambientBanter(): void {
    const members = this.members();
    if (!members.length) return;
    const clock = this.s.state.clock;
    const slot = `${clock.day}:${Math.floor(clock.minute / 20)}`;
    if (slot === this.lastSlot) return;
    this.lastSlot = slot;
    const h = hashString(slot);
    if (h % 9 !== 0) return;
    const comp = members[(h >> 4) % members.length];
    if (!comp) return;
    const line = this.nextBanter(this.def(comp.id), comp);
    if (!line) return;
    comp.banter++;
    this.s.bus.emit('toast', { kind: 'info', text: `${this.def(comp.id).name}: “${line}”` });
  }

  private lastSlot = '';

  /** Companions who have reason to walk out (a line crossed, a betrayal) do so. */
  checkLeaves(): void {
    for (const comp of this.recruited()) {
      if (comp.left) continue;
      const def = this.def(comp.id);
      if (!this.s.quests.holds(def.leaves.cond)) continue;
      comp.left = true;
      comp.inParty = false;
      this.s.bus.emit('toast', { kind: 'warning', text: def.leaves.text });
      this.changed('left');
    }
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
