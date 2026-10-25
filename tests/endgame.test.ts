import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { RIFTS } from '../src/data/rifts';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { createItem } from '../src/engine/items/generate';
import { countOf } from '../src/engine/items/inventory';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';
import { characterStats } from '../src/engine/character/stats';
import { Rng } from '../src/engine/core/rng';

function hero60(): GameSession {
  const s = GameSession.newGame(31, makeHero());
  s.grantXp(5_000_000, true);
  return s;
}
/** Fights the run's next fight, won or lost at once. */
function fightNext(s: GameSession, win = true): void {
  const f = s.endgame.nextFight();
  if (!f) throw new Error('No fight');
  const b = createEncounterBattle(s.player, f.encounter, { rng: s.rng, level: f.level, enemyModifiers: f.enemyModifiers, partyModifiers: f.partyModifiers });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive(win ? 'enemy' : 'party')) applyDamage(b, hero, x, 9e9, { element: 'physical', crit: false });
  b.checkOutcome();
  settleBattle(s, b);
}

describe('Rifts', () => {
  it('need a level, a town, a Rift Map and the tier below cleared', () => {
    const low = GameSession.newGame(31, makeHero());
    expect(low.endgame.canOpenRift(1).ok).toBe(false);
    const s = hero60();
    expect(s.endgame.canOpenRift(1).ok).toBe(false);
    s.items.give(createItem('rift-map', 2, () => s.newUid()));
    expect(s.endgame.canOpenRift(1).ok).toBe(true);
    expect(s.endgame.canOpenRift(2).ok).toBe(false);
  });

  it('run waves and a Guardian, reward each, and open the next tier', () => {
    const s = hero60();
    s.items.give(createItem('rift-map', 1, () => s.newUid()));
    const gold = s.state.gold;
    expect(s.endgame.openRift(1).ok).toBe(true);
    expect(countOf(s.state.inventory, 'rift-map')).toBe(0);
    const run = s.endgame.active;
    expect(run?.fights).toHaveLength(RIFTS.waves + 1);
    expect(run?.fights.at(-1)?.encounter.isBoss).toBe(true);
    for (let i = 0; i <= RIFTS.waves; i++) fightNext(s);
    expect(s.endgame.active).toBeUndefined();
    expect(s.state.endgame.riftTier).toBe(1);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(s.endgame.maxRiftTier()).toBe(2);
  });

  it('end when you fall, and the map is spent', () => {
    const s = hero60();
    s.items.give(createItem('rift-map', 1, () => s.newUid()));
    s.endgame.openRift(1);
    fightNext(s);
    fightNext(s, false);
    expect(s.endgame.active).toBeUndefined();
    expect(s.state.endgame.riftTier).toBe(0);
  });

  it('roll more affixes at higher tiers, and they reach the battle', () => {
    const s = hero60();
    expect(s.endgame.affixCount(1)).toBe(0);
    expect(s.endgame.affixCount(RIFTS.maxTier)).toBe(RIFTS.affixTiers.length);
    s.state.endgame.riftTier = 19;
    s.items.give(createItem('rift-map', 1, () => s.newUid()));
    s.endgame.openRift(20);
    const f = s.endgame.nextFight();
    expect(s.endgame.active?.affixes).toHaveLength(3);
    const b = createEncounterBattle(s.player, f?.encounter ?? content.encounters.get('slime-puddle'), { rng: s.rng, level: f?.level, enemyModifiers: f?.enemyModifiers, partyModifiers: f?.partyModifiers });
    const mods = b.combatants.flatMap((x) => x.statInput.modifiers.filter((m) => m.source === 'rift'));
    expect(mods.length).toBeGreaterThan(0);
  });
});

describe('the Boss Rush', () => {
  it('fights every dungeon boss in a row and keeps your record', () => {
    const s = hero60();
    expect(s.endgame.startBossRush().ok).toBe(true);
    const n = s.endgame.active?.fights.length ?? 0;
    expect(n).toBe(content.dungeons.size);
    for (let i = 0; i < 3; i++) fightNext(s);
    fightNext(s, false);
    expect(s.state.endgame.bossRush.best).toBe(3);
    s.endgame.startBossRush();
    for (let i = 0; i < n; i++) fightNext(s);
    expect(s.state.endgame.bossRush.clears).toBe(1);
    expect(s.state.endgame.bossRush.best).toBe(n);
    expect(s.state.endgame.bossRush.bestTurns).toBeDefined();
  });

  it('can be abandoned', () => {
    const s = hero60();
    s.endgame.startBossRush();
    expect(s.endgame.abandon().ok).toBe(true);
    expect(s.endgame.active).toBeUndefined();
  });
});

describe('challenge modes', () => {
  const withChallenges = (...challenges: string[]): GameSession => GameSession.newGame(41, makeHero({ challenges }));

  it('Ironman: no buying, no fast travel', () => {
    const s = withChallenges('ironman');
    s.addGold(100000, 'test');
    expect(s.economy.buy('general', 0).ok).toBe(false);
    s.state.world.waypoints.push('whisperwood');
    expect(s.world.fastTravel('whisperwood')).toEqual({ ok: false, reason: 'Ironman: the waypoints will not carry you.' });
  });

  it('Lone Wolf: companions do not fight', () => {
    const s = withChallenges('lone-wolf');
    s.party.recruit('korga');
    expect(s.party.battleMembers()).toEqual([]);
  });

  it('Godless: favor only falls', () => {
    const s = withChallenges('godless');
    s.devotion.apply({ solenne: 50, kael: -10 }, 'test', true, true);
    expect(s.player.devotion.favor.solenne ?? 0).toBe(0);
    expect(s.player.devotion.favor.kael).toBeLessThan(0);
  });

  it('Glass Cannon and Nightmare change the hero and the enemies', () => {
    const plain = GameSession.newGame(41, makeHero());
    const glass = withChallenges('glass-cannon', 'nightmare');
    expect(characterStats(glass.player).maxHp).toBeLessThan(characterStats(plain.player).maxHp * 0.6);
    expect(characterStats(glass.player).magicFind).toBeGreaterThan(characterStats(plain.player).magicFind + 90);
    const hp = (s: GameSession) => createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: new Rng(1) }).combatants.find((x) => x.side === 'enemy')?.maxHp ?? 0;
    expect(hp(glass)).toBeGreaterThan(hp(plain) * 1.4);
  });
});

describe('pets and mounts', () => {
  it('pets come from achievements and add their bonus', () => {
    const s = GameSession.newGame(51, makeHero());
    const before = characterStats(s.player).goldFind;
    s.state.stats.goldEarned = 1000;
    s.achievements.check();
    expect(s.player.stable.pets).toContain('lucky-ferret');
    expect(s.player.stable.pet).toBe('lucky-ferret');
    expect(characterStats(s.player).goldFind).toBeGreaterThan(before);
    s.world.setPet(undefined);
    expect(characterStats(s.player).goldFind).toBe(before);
  });

  it('mounts are bought at stables (not by Ironmen) and make travel faster and safer', () => {
    const s = GameSession.newGame(51, makeHero());
    expect(s.world.buyMount('warhorse').ok).toBe(false);
    s.addGold(10000, 'test');
    expect(s.world.buyMount('warhorse').ok).toBe(true);
    expect(s.player.stable.mount).toBe('warhorse');
    expect(s.world.buyMount('spectral-stag').ok).toBe(false);
    const iron = GameSession.newGame(51, makeHero({ challenges: ['ironman'] }));
    iron.addGold(10000, 'test');
    expect(iron.world.buyMount('farm-pony').ok).toBe(false);
  });
});
