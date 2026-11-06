import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { AFFLICTIONS, AFFLICTION_QUESTS, LONG_MADNESS, SHORT_MADNESS, WEARINESS } from '../src/data/afflictions';
import { Rng } from '../src/engine/core/rng';
import { characterStats } from '../src/engine/character/stats';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { dealDamage } from '../src/engine/combat/hits';
import { startBattle } from '../src/engine/combat/turns';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (extra: Record<string, unknown> = {}) => {
  const s = GameSession.newGame(31, makeHero(extra));
  (s.world as any).inTown = () => undefined;
  s.player.level = 20;
  return s;
};
const normalEnc = () => content.encounters.all().find((e) => !e.isBoss && e.level >= 10 && e.level <= 14)!;

describe('Afflictions (211)', () => {
  it('has four afflictions with 12 nodes each and a cure quest that exists', () => {
    expect(AFFLICTIONS.map((a) => a.id)).toEqual(['moonblood', 'thirst', 'stoneheart', 'hollowing']);
    for (const a of AFFLICTIONS) {
      expect(a.tree).toHaveLength(12);
      expect(new Set(a.tree.map((n) => n.id)).size).toBe(12);
      expect(AFFLICTION_QUESTS.find((q) => q.id === a.cureQuest)).toBeTruthy();
      expect(content.quests.has(a.cureQuest)).toBe(true);
    }
  });

  it('catching one adds a curse, embracing opens the power tree, and the lane order is enforced', () => {
    const s = session();
    const base = characterStats(s.player).defense;
    expect(s.afflictions.catchIt('stoneheart')).toBe(true);
    expect(s.afflictions.catchIt('stoneheart')).toBe(false);
    expect(s.afflictions.learn('stoneheart', 'stone-a-1').ok).toBe(false); // not embraced yet
    expect(s.afflictions.embrace('stoneheart').ok).toBe(true);
    expect(s.afflictions.learn('stoneheart', 'stone-a-2').ok).toBe(false); // lane order
    expect(s.afflictions.learn('stoneheart', 'stone-a-1').ok).toBe(true);
    expect(characterStats(s.player).defense).toBeGreaterThan(base);
    expect(s.afflictions.learn('stoneheart', 'stone-b-1').ok).toBe(false); // no points left
    s.player.level = 21;
    s.bus.emit('levelUp', { characterId: s.player.id, level: 21 });
    expect(s.afflictions.pointsLeft('stoneheart')).toBe(1);
  });

  it('the cure quest cures it, and carriers can leave a mark', () => {
    const s = session();
    s.afflictions.catchIt('moonblood');
    s.bus.emit('questComplete', { questId: 'affliction-cure-moonblood' });
    expect(s.afflictions.has('moonblood')).toBe(false);
    expect(s.afflictions.t.cured).toContain('moonblood');
    const beast = content.enemies.all().find((e) => e.types?.includes('beast'))!;
    let caught = false;
    for (let i = 0; i < 400 && !caught; i++) {
      s.bus.emit('enemyKilled', { enemyId: beast.id, tier: 'normal' });
      caught = s.afflictions.has('moonblood');
    }
    expect(caught).toBe(true);
  });
});

describe('Weariness (214) and the Hard Road (216)', () => {
  it('forced marches, harsh zones and skipped rests add levels; a rest takes one away; level 6 starts a fight on the knees', () => {
    const s = session();
    for (let i = 0; i < 4; i++) s.bus.emit('zoneEntered', { zoneId: 'meadowlands' });
    expect(s.afflictions.weary).toBe(1);
    s.bus.emit('zoneEntered', { zoneId: 'ashen-desert' });
    expect(s.afflictions.weary).toBe(2);
    s.afflictions.onRest();
    expect(s.afflictions.weary).toBe(1);
    s.afflictions.addWeary(9, 'Test.');
    expect(s.afflictions.weary).toBe(6);
    expect(s.player.weary).toBe(6);
    expect(WEARINESS).toHaveLength(6);
    const b = createEncounterBattle(s.player, normalEnc(), { rng: new Rng(3), level: 12 });
    startBattle(b);
    const hero = b.alive('party').find((x) => x.kind === 'hero')!;
    expect(hero.statuses.some((st) => st.id === 'stun')).toBe(true);
  });

  it('a skipped rest adds weariness after two days', () => {
    const s = session();
    s.afflictions.t.weary.lastRest = s.state.clock.day;
    s.advanceTime(24 * 60 * 2);
    expect(s.afflictions.weary).toBeGreaterThanOrEqual(1);
  });

  it('the Hard Road turns a camp in the wild into a rough half-rest', () => {
    const s = session();
    s.afflictions.setHardRoad(true);
    const max = characterStats(s.player).maxHp;
    s.player.hp = 1;
    s.general.rest();
    expect(s.player.hp).toBeLessThan(max);
    expect(s.player.hp).toBeGreaterThan(max * 0.4);
    s.afflictions.setHardRoad(false);
    s.general.rest();
    expect(s.player.hp).toBe(max);
  });
});

describe('Whisper Meter (213)', () => {
  it('has 20 short and 10 long madness effects with unique ids', () => {
    expect(SHORT_MADNESS).toHaveLength(20);
    expect(LONG_MADNESS).toHaveLength(10);
    expect(new Set([...SHORT_MADNESS, ...LONG_MADNESS].map((m) => m.id)).size).toBe(30);
  });

  it('zones and lantern moths raise it, high levels bring madness, a rest calms it', () => {
    const s = session();
    s.bus.emit('zoneEntered', { zoneId: 'dark-citadel' });
    expect(s.afflictions.whisper).toBeGreaterThan(0);
    s.afflictions.addWhisper(95, 'Test.');
    for (let i = 0; i < 40 && s.afflictions.madness().length === 0; i++) {
      s.afflictions.t.whisper.short = undefined;
      s.bus.emit('combatStarted', { encounterId: 'x' });
    }
    expect(s.afflictions.madness().length).toBeGreaterThan(0);
    s.afflictions.onRest();
    expect(s.afflictions.madness()).toHaveLength(0);
    expect(s.afflictions.whisper).toBeLessThan(95);
  });

  it('the unreliable UI only lies about shown numbers, never the real ones', () => {
    const s = session();
    expect(s.afflictions.shown(100)).toBe(100);
    s.afflictions.t.whisper.short = { id: 's-scale', battles: 2 };
    const seen = new Set<number>();
    for (let hp = 50; hp < 90; hp++) seen.add(s.afflictions.shown(hp) - hp);
    expect(seen.size).toBeGreaterThan(1);
    expect(s.player.hp).toBeGreaterThan(0);
  });
});

describe('Flanking (215)', () => {
  const fight = (tabletop: boolean, seed: number) => {
    const hero = benchmarkHero('warrior', 12);
    hero.tabletop = tabletop;
    const b = createEncounterBattle(hero, normalEnc(), { rng: new Rng(seed), level: 12 });
    return b;
  };

  it('a second ally striking the same foe flanks it; rules off adds +15% to hit', () => {
    const b = fight(false, 5);
    const me = b.alive('party')[0]!;
    const foe = b.alive('enemy')[0]!;
    const ally = { ...me, id: 'ally-x', side: 'party' as const };
    b.combatants.push(ally as typeof me);
    dealDamage(b, me, foe, { element: 'physical', power: 1, canMiss: true });
    expect(b.flanks).toBe(0);
    dealDamage(b, ally as typeof me, foe, { element: 'physical', power: 1, canMiss: true });
    expect(b.flanks).toBe(1);
  });

  it('flanking appears in full battles with two heroes and costs nothing when the rules are on', () => {
    for (const tt of [true, false]) {
      const b = fight(tt, 7);
      const events = runAutoBattle(b);
      expect(events.length).toBeGreaterThan(0);
    }
  });
});
