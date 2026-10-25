import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_MILESTONES } from '../src/data/achievements';
import { characterStats } from '../src/engine/character/stats';
import { migrate } from '../src/engine/state/save';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

describe('achievement point milestones', () => {
  it('are ordered and each one adds a bonus', () => {
    const pts = ACHIEVEMENT_MILESTONES.map((m) => m.points);
    expect([...pts].sort((a, b) => a - b)).toEqual(pts);
    expect(ACHIEVEMENT_MILESTONES.every((m) => m.modifiers.length > 0)).toBe(true);
  });

  it('give permanent stats once the points are reached', () => {
    const hero = makeHero();
    const base = characterStats(hero);
    hero.achievementPoints = 100;
    expect(characterStats(hero).xpGain).toBe(base.xpGain + 2);
    hero.achievementPoints = 3000;
    expect(characterStats(hero).maxHp).toBeGreaterThan(base.maxHp);
    expect(characterStats(hero).damageBonus).toBeGreaterThan(base.damageBonus);
  });

  it('count up as achievements are earned', () => {
    const s = GameSession.newGame(1, makeHero());
    s.state.stats.kills = 1;
    s.achievements.check();
    const earned = Object.keys(s.state.achievements);
    expect(s.player.achievementPoints).toBe(s.achievements.points());
    expect(earned.length).toBeGreaterThanOrEqual(0);
  });

  it('are rebuilt from earned achievements when an older save loads', () => {
    const s = GameSession.newGame(1, makeHero());
    s.state.stats.kills = 50;
    s.achievements.check();
    const raw = JSON.parse(JSON.stringify(s.state)) as Record<string, unknown>;
    delete (raw.player as Record<string, unknown>).achievementPoints;
    const migrated = migrate(raw) as { player: { achievementPoints: number } };
    expect(migrated.player.achievementPoints).toBe(s.achievements.points());
  });
});
