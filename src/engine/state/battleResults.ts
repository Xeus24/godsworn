import { content } from '../../data';
import { COMBAT } from '../../data/combat';
import { killXp } from '../character/progression';
import { characterStats, restoreFull } from '../character/stats';
import type { Battle } from '../combat/battle';
import type { BattleOutcome } from '../combat/types';
import { equippedItems } from '../items/equipment';
import { rollLoot } from '../items/loot';
import { itemName } from '../items/naming';
import { recordDeed } from '../items/relics';
import type { ItemInstance } from '../items/types';
import { wearItem, wearItemPercent } from '../items/upkeep';
import { tickTimedBuffs } from '../items/use';
import type { GameSession } from './gameState';

export interface BattleRewards {
  outcome: BattleOutcome;
  xp: number;
  gold: number;
  items: ItemInstance[];
  salvaged: number;
  levelsGained: number[];
  awakened: string[];
  brokenItems: string[];
  expiredBuffs: string[];
  goldLost: number;
  /** Hardcore death: the save is over. */
  permadeath: boolean;
}

const BOSS_TIERS = new Set(['miniboss', 'boss', 'worldBoss']);

/**
 * Applies a finished battle to the game: HP/MP carry over, XP, gold and
 * loot on victory, penalties on defeat, durability wear, timed buff ticks,
 * relic deeds and lifetime stats. Emits the matching events.
 */
export function settleBattle(s: GameSession, b: Battle): BattleRewards {
  const p = s.player;
  const hero = b.combatants.find((x) => x.kind === 'hero');
  const rewards: BattleRewards = {
    outcome: b.outcome,
    xp: 0,
    gold: 0,
    items: [],
    salvaged: 0,
    levelsGained: [],
    awakened: [],
    brokenItems: [],
    expiredBuffs: [],
    goldLost: 0,
    permadeath: false,
  };
  const stats = s.state.stats;
  stats.highestHit = Math.max(stats.highestHit, b.tally.highestHit);

  if (hero) {
    p.hp = Math.max(0, hero.hp);
    p.mp = Math.max(0, hero.mp);
  }

  for (const kill of b.tally.kills) {
    stats.kills++;
    s.bus.emit('enemyKilled', { enemyId: kill.enemyId, tier: kill.tier });
  }

  if (b.outcome === 'victory') {
    stats.battlesWon++;
    const heroStats = characterStats(p);
    for (const kill of b.tally.kills) {
      rewards.xp += killXp(kill.xp, kill.level, p.level);
      if (!kill.lootTable) continue;
      const loot = rollLoot(kill.lootTable, {
        rng: s.rng,
        itemLevel: kill.level,
        newUid: () => s.newUid(),
        magicFind: heroStats.magicFind,
        goldFind: heroStats.goldFind,
        ngPlus: s.state.ngPlus,
        sourceTier: kill.tier,
        favorClassId: p.classes[0]?.classId,
      });
      rewards.gold += loot.gold;
      rewards.items.push(...loot.items);
    }
    rewards.gold += b.tally.goldFound;
    const xpResult = s.grantXp(rewards.xp);
    rewards.levelsGained = xpResult.levels;
    const received = s.items.receiveLoot(rewards.items, rewards.gold);
    rewards.salvaged = received.salvaged;
    rewards.items = received.kept;

    // Relic deeds.
    const deed = (event: Parameters<typeof recordDeed>[1]): void => {
      const woke = recordDeed(p, event);
      if (woke) rewards.awakened.push(woke);
    };
    for (const kill of b.tally.kills) {
      deed({ event: BOSS_TIERS.has(kill.tier) ? 'bossKilled' : 'enemyKilled', enemyTypes: kill.types });
    }
    deed({ event: 'combatWon' });
    for (let i = 0; i < b.tally.partyCrits; i++) deed({ event: 'critLanded' });
    for (let i = 0; i < b.tally.partyHeals; i++) deed({ event: 'healed' });
    for (const id of rewards.awakened) {
      s.bus.emit('toast', { kind: 'loot', text: `${content.uniques.get(id).name} awakens!` });
    }
  } else if (b.outcome === 'defeat') {
    stats.battlesLost++;
    stats.deaths++;
    if (p.hardcore) {
      rewards.permadeath = true;
      s.state.gameOver = true;
      p.hp = 0;
    } else {
      rewards.goldLost = Math.floor(s.state.gold * COMBAT.defeatGoldLoss);
      if (rewards.goldLost > 0) s.addGold(-rewards.goldLost, 'defeat');
      for (const [, item] of equippedItems(p)) {
        if (wearItemPercent(item, COMBAT.defeatWearShare)) rewards.brokenItems.push(itemName(item));
      }
      // You wake up somewhere safe, patched up.
      restoreFull(p);
    }
  } else {
    stats.battlesFled++;
  }

  if (b.outcome !== 'defeat' || !p.hardcore) {
    for (const [, item] of equippedItems(p)) {
      if (wearItem(item, COMBAT.wearPerBattle)) rewards.brokenItems.push(itemName(item));
    }
    rewards.expiredBuffs = tickTimedBuffs(p);
  }
  for (const name of rewards.brokenItems) s.bus.emit('toast', { kind: 'warning', text: `${name} broke! Repair it to restore its stats.` });
  for (const name of rewards.expiredBuffs) s.bus.emit('toast', { kind: 'info', text: `${name} wore off.` });

  s.bus.emit('combatEnded', { encounterId: b.encounterId, result: b.outcome === 'ongoing' ? 'fled' : b.outcome });
  s.bus.emit('stateChanged', { reason: 'battle' });
  return rewards;
}
