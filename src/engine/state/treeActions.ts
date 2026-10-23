import { characterStats, clampVitals } from '../character/stats';
import { equipFromInventory } from '../items/equipment';
import { indexOfUid } from '../items/inventory';
import { EQUIP_SLOTS } from '../items/types';
import {
  activeBuild,
  allocate,
  refund,
  resetBuild,
  resetCost,
  setHotbarSlot,
  setVariant,
  switchBuild,
  treeState,
  type TreeResult,
} from '../skills/tree';
import type { GameSession } from './gameState';

/** Skill tree and build actions on a running game. */
export class TreeActions {
  constructor(private readonly s: GameSession) {}

  private done(result: TreeResult, reason: string): TreeResult {
    if (result.ok) {
      clampVitals(this.s.player);
      this.s.bus.emit('stateChanged', { reason });
    }
    return result;
  }

  allocate(classId: string, nodeId: string): TreeResult {
    return this.done(allocate(this.s.player, classId, nodeId), 'tree');
  }

  refund(classId: string, nodeId: string): TreeResult {
    return this.done(refund(this.s.player, classId, nodeId), 'tree');
  }

  /** Refunds the whole active build for gold (25 x level). */
  reset(classId: string): TreeResult {
    const cost = resetCost(this.s.player);
    if (Object.keys(activeBuild(this.s.player, classId).ranks).length === 0) return { ok: false, reason: 'Nothing to reset.' };
    if (!this.s.spendGold(cost, 'tree reset')) return { ok: false, reason: `Resetting costs ${cost} gold.` };
    resetBuild(this.s.player, classId);
    return this.done({ ok: true }, 'tree');
  }

  /** Switches builds for free, then equips the build's saved gear from your bags where possible. */
  switchBuild(classId: string, index: number): TreeResult {
    const result = switchBuild(this.s.player, classId, index);
    if (!result.ok) return result;
    const gear = activeBuild(this.s.player, classId).gear;
    if (gear) {
      for (const slot of EQUIP_SLOTS) {
        const uid = gear[slot];
        if (!uid || this.s.player.equipment[slot]?.uid === uid) continue;
        const index = indexOfUid(this.s.state.inventory, uid);
        if (index >= 0) equipFromInventory(this.s.player, this.s.state.inventory, index, characterStats(this.s.player), slot);
      }
    }
    return this.done({ ok: true }, 'build');
  }

  rename(classId: string, index: number, name: string): TreeResult {
    const build = treeState(this.s.player, classId).builds[index];
    const clean = name.trim().slice(0, 24);
    if (!build || !clean) return { ok: false, reason: 'Enter a name.' };
    build.name = clean;
    return this.done({ ok: true }, 'build');
  }

  /** Remembers the gear you are wearing as part of the active build. */
  saveGear(classId: string): TreeResult {
    const build = activeBuild(this.s.player, classId);
    build.gear = {};
    for (const slot of EQUIP_SLOTS) {
      const item = this.s.player.equipment[slot];
      if (item) build.gear[slot] = item.uid;
    }
    return this.done({ ok: true }, 'build');
  }

  setVariant(classId: string, skillId: string, nodeId: string | null): TreeResult {
    return this.done(setVariant(this.s.player, classId, skillId, nodeId), 'tree');
  }

  setHotbar(slot: number, skillId: string | null): TreeResult {
    return this.done(setHotbarSlot(this.s.player, slot, skillId), 'hotbar');
  }
}
