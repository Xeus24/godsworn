import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { applyDamage } from '../src/engine/combat/hits';
import { startBattle } from '../src/engine/combat/turns';
import { Rng } from '../src/engine/core/rng';
import { generateGear } from '../src/engine/items/generate';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import type { Combatant } from '../src/engine/combat/types';
import { makeHero } from './helpers';

function sessionWithBattle(opts: { hardcore?: boolean; seed?: number } = {}) {
  const s = GameSession.newGame(opts.seed ?? 3, makeHero({ classId: 'warrior', hardcore: opts.hardcore }));
  const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng });
  startBattle(b);
  return { s, b };
}

const killAll = (b: ReturnType<typeof sessionWithBattle>['b'], side: 'enemy' | 'party'): void => {
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive(side)) applyDamage(b, hero, x, 999999, { element: 'physical', crit: false });
  b.checkOutcome();
};

describe('settleBattle', () => {
  it('victory grants XP, gold, loot and lifetime stats, and wears gear', () => {
    const { s, b } = sessionWithBattle();
    const gold = s.state.gold;
    const durability = s.player.equipment.mainHand?.durability?.current ?? 0;
    killAll(b, 'enemy');
    const r = settleBattle(s, b);
    expect(r.outcome).toBe('victory');
    expect(r.xp).toBeGreaterThan(0);
    expect(s.player.xp + s.player.level).toBeGreaterThan(1);
    expect(s.state.gold).toBeGreaterThanOrEqual(gold);
    expect(s.state.stats.kills).toBe(2);
    expect(s.state.stats.battlesWon).toBe(1);
    expect(s.player.equipment.mainHand?.durability?.current).toBe(durability - 1);
  });

  it('defeat costs 10% gold and durability, then restores the hero', () => {
    const { s, b } = sessionWithBattle();
    s.state.gold = 1000;
    killAll(b, 'party');
    const r = settleBattle(s, b);
    expect(r.outcome).toBe('defeat');
    expect(r.goldLost).toBe(100);
    expect(s.state.gold).toBe(900);
    expect(s.player.hp).toBeGreaterThan(0);
    expect(s.state.gameOver).toBe(false);
    expect(s.state.stats.deaths).toBe(1);
  });

  it('hardcore death ends the game', () => {
    const { s, b } = sessionWithBattle({ hardcore: true });
    killAll(b, 'party');
    const r = settleBattle(s, b);
    expect(r.permadeath).toBe(true);
    expect(s.state.gameOver).toBe(true);
  });

  it('HP carries over after a win', () => {
    const { s, b } = sessionWithBattle();
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    hero.hp = 7;
    killAll(b, 'enemy');
    settleBattle(s, b);
    expect(s.player.hp).toBe(7);
  });

  it('counts relic deeds', () => {
    const { s } = sessionWithBattle();
    const relic = { ...generateGear({ rng: new Rng(1), itemLevel: 20, newUid: () => s.newUid() }, { uniqueId: 'horn-of-kael' }), identified: true };
    s.player.equipment.relic = relic;
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng });
    startBattle(b);
    killAll(b, 'enemy');
    settleBattle(s, b);
    expect(relic.awakening?.progress).toBe(1);
  });

  it('a real auto battle settles cleanly', () => {
    const s = GameSession.newGame(9, makeHero({ classId: 'ranger' }));
    const b = createEncounterBattle(s.player, content.encounters.get('rat-nest'), { rng: s.rng });
    runAutoBattle(b);
    const r = settleBattle(s, b);
    expect(['victory', 'defeat', 'fled']).toContain(r.outcome);
  });
});
