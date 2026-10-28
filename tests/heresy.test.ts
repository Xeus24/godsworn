import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { APOSTLESHIP } from '../src/data/devotion';
import { HERESY } from '../src/data/heresy';
import type { Combatant } from '../src/engine/combat/types';
import { applyDivineCombat } from '../src/engine/gods/combat';
import { availablePoints } from '../src/engine/skills/tree';
import { ownsTree } from '../src/engine/skills/treeOwners';
import { characterStats } from '../src/engine/character/stats';
import { shopStock } from '../src/engine/economy/shops';
import { applyFavor, favorOf, rivalsOf, setRelation } from '../src/engine/gods/devotion';
import { heresyTier } from '../src/engine/gods/heresy';
import { poolCandidates } from '../src/engine/items/loot';
import { canLearnGeneral } from '../src/engine/skills/general';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { Rng } from '../src/engine/core/rng';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const newSession = (): GameSession => GameSession.newGame(5, makeHero());

describe('heresy', () => {
  it('costs favor with every god and climbs through tiers', () => {
    const s = newSession();
    s.devotion.apply({ solenne: 50, kael: 50 }, 'test', true, true);
    const before = favorOf(s.player, 'solenne');
    s.devotion.addHeresy(HERESY.tiers[1]?.min as number, 'test');
    expect(heresyTier(s.player)).toBe(1);
    expect(favorOf(s.player, 'solenne')).toBeLessThan(before);
    expect(favorOf(s.player, 'kael')).toBeLessThan(50);
    expect(s.player.devotion.favor.nameless ?? 0).toBe(0);
  });

  it('grants void power by tier', () => {
    const s = newSession();
    const plain = characterStats(s.player).voidDamage;
    s.devotion.addHeresy(HERESY.tiers[2]?.min as number, 'test');
    expect(characterStats(s.player).voidDamage).toBeGreaterThan(plain);
  });

  it('gates forbidden skills', () => {
    const s = newSession();
    s.grantXp(5_000_000, true);
    expect(canLearnGeneral(s.player, 'forbidden-void-pact').ok).toBe(false);
    s.devotion.addHeresy(HERESY.tiers[0]?.min as number, 'test');
    expect(canLearnGeneral(s.player, 'forbidden-void-pact').ok).toBe(true);
    expect(canLearnGeneral(s.player, 'forbidden-blasphemy').ok).toBe(false);
  });

  it('keeps forbidden goods out of loot and in the Black Market for heretics', () => {
    expect(poolCandidates('book', 80, content).some((b) => b.forbidden !== undefined)).toBe(false);
    expect(poolCandidates('consumable', 80, content).some((b) => b.forbidden !== undefined)).toBe(false);
    const s = newSession();
    s.grantXp(5_000_000, true);
    const market = content.shops.get('black-market');
    const forbiddenIn = (): number => shopStock(market, 'saltmere', 1, s.player, 1).filter((l) => content.items.get(l.item.baseId).forbidden !== undefined).length;
    expect(forbiddenIn()).toBe(0);
    s.devotion.addHeresy(HERESY.tiers[2]?.min as number, 'test');
    expect(forbiddenIn()).toBeGreaterThan(0);
  });

  it('is forgiven at a temple, for gold', () => {
    const s = newSession();
    s.devotion.addHeresy(50, 'test');
    expect(s.world.inTown()).toBeDefined();
    s.addGold(1_000_000, 'test');
    expect(s.devotion.atone().ok).toBe(true);
    expect(s.player.devotion.heresy).toBe(0);
  });
});

describe('pantheon politics', () => {
  it('make and end rivalries', () => {
    const hero = makeHero();
    expect(rivalsOf(hero, 'solenne')).toContain('morrath');
    setRelation(hero, 'morrath', 'solenne', 'peace');
    expect(rivalsOf(hero, 'solenne')).not.toContain('morrath');
    setRelation(hero, 'solenne', 'vex', 'rival');
    expect(rivalsOf(hero, 'vex')).toContain('solenne');
    applyFavor(hero, { solenne: 40 }, 0, true);
    expect(favorOf(hero, 'vex')).toBeLessThan(0);
    expect(favorOf(hero, 'morrath')).toBe(0);
  });
});

describe('the Defender path', () => {
  const exalt = (s: GameSession, god: string): void => {
    s.player.devotion.favor[god] = 1100;
    s.player.devotion.trialStage[god] = 3;
  };
  const apostleOf = (s: GameSession, god: string): void => {
    exalt(s, god);
    s.player.devotion.apostle = { god, level: s.player.level, edictsDone: 0, neglected: false };
  };

  it('opens in NG+3 for an Apostle, for a non-rival god whose trial is done', () => {
    const s = newSession();
    apostleOf(s, 'solenne');
    exalt(s, 'kael');
    exalt(s, 'morrath');
    expect(s.devotion.defend('kael').ok).toBe(false);
    s.state.ngPlus = 3;
    expect(s.devotion.defend('morrath').ok).toBe(false);
    expect(s.devotion.defend('kael').ok).toBe(true);
    expect(s.player.devotion.defender).toBe('kael');
    expect(s.player.devotion.slotted).toContain('kael-divine');
    expect(s.player.devotion.titles).toContain('Defender of Kael');
  });

  it('ends with Apostleship', () => {
    const s = newSession();
    s.state.ngPlus = 3;
    apostleOf(s, 'solenne');
    exalt(s, 'kael');
    s.devotion.defend('kael');
    s.devotion.renounce();
    expect(s.player.devotion.defender).toBeUndefined();
    expect(s.player.devotion.slotted).not.toContain('kael-divine');
  });
});

describe('apostle followers', () => {
  it('answer an Apostle’s call and fight beside them, with partial party scaling', () => {
    const s = newSession();
    expect(s.devotion.callFollower(true).ok).toBe(false);
    s.player.devotion.apostle = { god: 'kael', level: 1, edictsDone: 0, neglected: false };
    s.devotion.callFollower(true);
    const follower = s.devotion.follower();
    expect(follower).toBe('follower-kael');
    const solo = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: new Rng(1) });
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: new Rng(1), guests: [{ id: 'follower', enemyId: follower as string, ally: true }] });
    expect(b.combatants.find((x) => x.id === 'follower')?.side).toBe('party');
    const hp = (x: typeof b) => x.combatants.find((c) => c.side === 'enemy')?.maxHp ?? 0;
    expect(hp(b)).toBeGreaterThan(hp(solo));
    s.devotion.callFollower(false);
    expect(s.devotion.follower()).toBeUndefined();
  });

  it('gives the Defender the second god\'s full apostle tree and Avatar', () => {
    const s = newSession();
    s.state.ngPlus = 3;
    s.player.level = 50;
    for (const g of ['solenne', 'kael']) {
      s.player.devotion.favor[g] = 1100;
      s.player.devotion.trialStage[g] = 3;
    }
    s.player.devotion.apostle = { god: 'solenne', level: s.player.level, edictsDone: 0, neglected: false };
    expect(ownsTree(s.player, 'apostle-kael')).toBe(false);
    s.devotion.defend('kael');
    expect(ownsTree(s.player, 'apostle-kael')).toBe(true);
    expect(availablePoints(s.player, 'apostle-kael')).toBe(APOSTLESHIP.basePoints);
    s.player.level = 55;
    expect(availablePoints(s.player, 'apostle-kael')).toBe(APOSTLESHIP.basePoints + 5);
    const x = { avatarSkill: undefined as string | undefined, avatarSkill2: undefined as string | undefined } as Combatant;
    applyDivineCombat(x, s.player, 20);
    expect(x.avatarSkill).toBe(content.apostles.get('solenne').avatar);
    expect(x.avatarSkill2).toBe(content.apostles.get('kael').avatar);
  });
});
