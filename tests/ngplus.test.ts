import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { NG_PLUS } from '../src/data/ngPlus';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { Rng } from '../src/engine/core/rng';
import { canStartNgPlus, ngThreat, startNgPlus, worldLevel } from '../src/engine/ngplus/ngplus';
import { questXp } from '../src/engine/quests/quests';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const newSession = (): GameSession => GameSession.newGame(11, makeHero());
const finish = (s: GameSession): void => {
  s.quests.reachEnding('godsworn');
};

describe('New Game+ levels', () => {
  it('stretch the world over levels 60-80 and leave higher levels alone', () => {
    expect(worldLevel(5, 0)).toBe(5);
    expect(worldLevel(1, 1)).toBe(NG_PLUS.levelFrom);
    expect(worldLevel(59, 1)).toBeLessThanOrEqual(NG_PLUS.levelTo);
    expect(worldLevel(30, 1)).toBeGreaterThan(worldLevel(20, 1));
    expect(worldLevel(70, 3)).toBe(70);
  });

  it('add threat from the second tier on', () => {
    expect(ngThreat(1)).toBe(0);
    expect(ngThreat(3)).toBe(2 * NG_PLUS.threatPerTier);
  });

  it('raise enemies in battle', () => {
    const hero = makeHero();
    const plain = createEncounterBattle(hero, content.encounters.get('slime-puddle'), { rng: new Rng(1) });
    const ng = createEncounterBattle(hero, content.encounters.get('slime-puddle'), { rng: new Rng(1), ngPlus: 2 });
    const a = plain.combatants.find((x) => x.side === 'enemy');
    const b = ng.combatants.find((x) => x.side === 'enemy');
    expect(b?.level).toBeGreaterThanOrEqual(NG_PLUS.levelFrom);
    expect(b?.statInput.modifiers.some((m) => m.source === 'ngPlus')).toBe(true);
    expect((b?.maxHp ?? 0) > (a?.maxHp ?? 0)).toBe(true);
  });

  it('raise quest rewards', () => {
    const q = content.quests.get('main-1');
    expect(questXp(q, 1)).toBeGreaterThan(questXp(q, 0));
  });
});

describe('starting New Game+', () => {
  it('needs an ending', () => {
    const s = newSession();
    expect(canStartNgPlus(s).ok).toBe(false);
    finish(s);
    expect(canStartNgPlus(s)).toEqual({ ok: true, tier: 1 });
  });

  it('keeps the hero and their things, and resets the story and the world', () => {
    const s = newSession();
    s.grantXp(500_000, true);
    s.addGold(1234, 'test');
    s.party.recruit('korga');
    s.state.world.lore.push('lore-first-oath');
    s.state.world.waypoints.push('meadowlands');
    s.state.achievements['first-blood'] = 1;
    s.setFlag('mercy', 2);
    s.setFlag('legacy:kept', true);
    s.state.clock.day = 40;
    const level = s.player.level;
    const gold = s.state.gold;
    finish(s);
    expect(startNgPlus(s).ok).toBe(true);
    expect(s.state.ngPlus).toBe(1);
    expect(s.state.levelCap).toBe(90);
    expect(s.player.level).toBe(level);
    expect(s.state.gold).toBe(gold);
    expect(s.state.party.companions.korga).toBeDefined();
    expect(s.state.achievements['first-blood']).toBe(1);
    expect(s.state.world.lore).toContain('lore-first-oath');
    expect(s.state.world.waypoints).not.toContain('meadowlands');
    expect(s.state.quests.ending).toBeUndefined();
    expect(s.state.legacy.endings).toEqual(['godsworn']);
    expect(s.state.flags.mercy).toBeUndefined();
    expect(s.state.flags['legacy:kept']).toBe(true);
    expect(s.state.clock.day).toBe(1);
    // The story begins again, and Korga's recruitment is not asked of you twice.
    expect(s.state.quests.active['main-1']).toBeDefined();
    expect(s.state.quests.completed[content.companions.get('korga').recruitQuest]).toBe(1);
  });

  it('stops at the last tier', () => {
    const s = newSession();
    s.state.ngPlus = NG_PLUS.maxTier;
    finish(s);
    expect(canStartNgPlus(s).ok).toBe(false);
  });
});
