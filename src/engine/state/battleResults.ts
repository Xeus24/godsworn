import { content } from '../../data';
import { COMBAT } from '../../data/combat';
import { recordBattle } from '../bestiary/bestiary';
import { getDifficulty } from '../../data/difficulty';
import { killXp } from '../character/progression';
import { characterStats, restoreFull } from '../character/stats';
import type { Battle } from '../combat/battle';
import type { BattleOutcome } from '../combat/types';
import { equippedItems } from '../items/equipment';
import { countOf } from '../items/inventory';
import { gainGatheringXp, gatherYield, gatheringLevel } from '../economy/crafting';
import { SKINNING_LOOT } from '../../data/items/greaterEconomy';
import { createItem, generateGear } from '../items/generate';

/** Rarities that count as a special drop for bad-luck protection, and how many empty kills trigger the pity drop. */
const BAD_LUCK_RARITIES = ['legendary', 'set', 'mythic', 'relic', 'primordial', 'divine', 'ascended'];
export const BAD_LUCK_KILLS = 5;
import { rollLoot } from '../items/loot';
import { itemName } from '../items/naming';
import { recordDeed } from '../items/relics';
import { favorTiers } from '../gods/devotion';
import { utilityChance } from '../skills/general';
import { MASTERED_LEVEL, MAX_MASTERY, masteryLevel } from '../skills/mastery';
import type { ItemInstance } from '../items/types';
import { wearItem, wearItemPercent } from '../items/upkeep';
import { tickTimedBuffs } from '../items/use';
import type { FavorChange } from '../gods/devotion';
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
  /** Skills that reached a new mastery level: [skill id, new level]. */
  masteryUps: [string, number][];
  /** General skills that trained to a new rank: [general id, new rank]. */
  generalUps: [string, number][];
  /** A class or hybrid trial was won for the first time. */
  trialWon: boolean;
  /** Favor changes from the gods' verdict on the battle. */
  favor: FavorChange[];
  /** Hardcore death: the save is over. */
  permadeath: boolean;
}

const BOSS_TIERS = new Set(['miniboss', 'boss', 'worldBoss']);

/**
 * Applies a finished battle to the game: HP/MP carry over, XP, gold and
 * loot on victory, penalties on defeat, durability wear, timed buff ticks,
 * relic deeds, general skill training and lifetime stats. Emits the matching events.
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
    masteryUps: [],
    generalUps: [],
    trialWon: false,
    favor: [],
    permadeath: false,
  };
  const stats = s.state.stats;
  stats.highestHit = Math.max(stats.highestHit, b.tally.highestHit);

  if (hero) {
    p.hp = Math.max(0, hero.hp);
    p.mp = Math.max(0, hero.mp);
  }

  // Mastery counts every use, win or lose.
  for (const [skillId, uses] of Object.entries(b.tally.skillUses)) {
    const before = masteryLevel(p.mastery[skillId] ?? 0);
    p.mastery[skillId] = (p.mastery[skillId] ?? 0) + uses;
    const after = masteryLevel(p.mastery[skillId]);
    if (after > before) {
      rewards.masteryUps.push([skillId, after]);
      const name = content.skills.get(skillId).name;
      s.bus.emit('toast', { kind: 'level', text: after >= MAX_MASTERY ? `${name}: Grandmaster!` : after === MASTERED_LEVEL ? `${name} mastered!` : `${name}: mastery ${after}` });
    }
  }

  for (const id of b.tally.stolen) if (!p.stolen.includes(id)) p.stolen.push(id);
  rewards.generalUps = s.general.trainAfterBattle(b);

  for (const kill of b.tally.kills) {
    stats.kills++;
    if (kill.tier === 'elite') stats.elitesKilled++;
    if (kill.tier === 'champion') stats.championsKilled++;
    if (kill.tier === 'miniboss' || kill.tier === 'boss') stats.bossesKilled++;
    if (kill.tier === 'worldBoss') stats.worldBossesKilled++;
    if (kill.tier === 'punisher') stats.punishersKilled++;
    if (kill.enraged) stats.enragedKilled++;
    s.bus.emit('enemyKilled', { enemyId: kill.enemyId, tier: kill.tier });
  }
  stats.crits += b.tally.partyCrits;
  stats.interrupts += b.tally.interrupts;
  stats.consumablesUsed += Object.values(b.tally.itemsUsed).reduce((a, n) => a + n, 0);
  if (b.tally.intervention) stats.interventions++;
  const seen = b.combatants.flatMap((x) => (x.side === 'enemy' && x.enemyId ? [x.enemyId] : []));
  for (const news of recordBattle(p, seen, b.tally.kills.map((k) => k.enemyId))) s.bus.emit('toast', { kind: 'info', text: news });

  if (b.outcome === 'victory') {
    stats.battlesWon++;
    rewards.trialWon = s.multiclass.recordVictory(b.encounterId);
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
        favorTiers: favorTiers(p),
      });
      rewards.gold += loot.gold;
      rewards.items.push(...loot.items);
      if (kill.tier === 'boss' || kill.tier === 'worldBoss') {
        // Bad-luck protection: a boss that keeps giving nothing special eventually gives a Legendary.
        const special = loot.items.some((it) => BAD_LUCK_RARITIES.includes(it.rarity));
        const dry = ((p.badLuck ??= {})[kill.enemyId] ?? 0) + 1;
        if (special) delete p.badLuck[kill.enemyId];
        else if (dry >= BAD_LUCK_KILLS) {
          delete p.badLuck[kill.enemyId];
          rewards.items.push(generateGear({ rng: s.rng, itemLevel: kill.level, newUid: () => s.newUid(), magicFind: heroStats.magicFind, ngPlus: s.state.ngPlus, sourceTier: kill.tier }, { rarity: 'legendary' }));
          s.bus.emit('toast', { kind: 'loot', text: 'The boss yields a Legendary at last.' });
        } else p.badLuck[kill.enemyId] = dry;
      }
    }
    // Skinning: beasts leave hides and meat; practice improves the take.
    for (const kill of b.tally.kills) {
      if (!kill.types.includes('beast')) continue;
      const skill = gatheringLevel(p, 'skinning');
      if (!s.rng.chance(Math.min(0.9, 0.35 + 0.03 * skill))) continue;
      const pool = (SKINNING_LOOT.find((t) => kill.level <= t.maxLevel) ?? SKINNING_LOOT[SKINNING_LOOT.length - 1]!).items;
      rewards.items.push(createItem(s.rng.pick(pool), gatherYield(skill, s.rng), () => s.newUid()));
      const up = gainGatheringXp(p, 'skinning');
      if (up) s.bus.emit('toast', { kind: 'level', text: `Skinning reaches level ${up}.` });
    }
    for (const kill of b.tally.kills) {
      const book = content.enemies.get(kill.enemyId).teaches;
      const def = book ? content.items.find(book) : undefined;
      const taught = def?.category === 'book' ? def.teaches : undefined;
      if (book && taught && !p.generalSkills[taught] && countOf(s.state.inventory, book) === 0) rewards.items.push(createItem(book, 1, () => s.newUid()));
    }
    rewards.gold += b.tally.goldFound;
    const reward = getDifficulty(p.difficulty).reward;
    rewards.xp = Math.round(rewards.xp * reward.xp);
    rewards.gold = Math.round(rewards.gold * reward.gold);
    const topLevel = Math.max(p.level, ...b.tally.kills.map((k) => k.level));
    rewards.items.push(...s.general.fieldFinds(topLevel));
    const xpResult = s.grantXp(rewards.xp);
    rewards.levelsGained = xpResult.levels;
    const received = s.items.receiveLoot(rewards.items, rewards.gold);
    rewards.salvaged = received.salvaged;
    rewards.items = received.kept;

    // Living items grow: a victory is worth 1 experience, a boss 3 more.
    const bossKills = b.tally.kills.filter((k) => k.tier === 'boss' || k.tier === 'worldBoss').length;
    for (const [, item] of equippedItems(p)) {
      if (item.livingXp === undefined) continue;
      const before = item.livingXp;
      item.livingXp += 1 + 3 * bossKills;
      const def = content.uniques.find(item.uniqueId ?? '');
      const woke = def?.living?.stages.find((st) => before < st.xp && item.livingXp! >= st.xp);
      if (woke) s.bus.emit('toast', { kind: 'loot', text: `${def!.name} awakens: ${woke.text}` });
    }

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
    // Tinkering: each item may be spared this battle's wear.
    const tinker = utilityChance(p, 'tinkering');
    for (const [, item] of equippedItems(p)) {
      if (tinker > 0 && s.rng.chance(tinker)) continue;
      if (wearItem(item, COMBAT.wearPerBattle)) rewards.brokenItems.push(itemName(item));
    }
    rewards.expiredBuffs = tickTimedBuffs(p);
  }
  for (const name of rewards.brokenItems) s.bus.emit('toast', { kind: 'warning', text: `${name} broke! Repair it to restore its stats.` });
  for (const name of rewards.expiredBuffs) s.bus.emit('toast', { kind: 'info', text: `${name} wore off.` });

  if (!rewards.permadeath) rewards.favor = s.devotion.settle(b, rewards.gold, rewards.brokenItems.length);
  s.party.afterBattle(b);
  s.quests.afterBattle(b);
  s.endgame.afterBattle(b);

  s.bus.emit('combatEnded', { encounterId: b.encounterId, result: b.outcome === 'ongoing' ? 'fled' : b.outcome });
  s.bus.emit('stateChanged', { reason: 'battle' });
  s.checkSpirits();
  return rewards;
}
