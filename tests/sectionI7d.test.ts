import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { HOLDINGS, HOLDING_QUESTS } from '../src/data/holdings';
import { MOUNTED } from '../src/data/mounted';
import { Rng } from '../src/engine/core/rng';
import { characterStats } from '../src/engine/character/stats';
import { canUseSkill } from '../src/engine/combat/skills';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (extra: Record<string, unknown> = {}) => {
  const s = GameSession.newGame(51, makeHero(extra));
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 30;
  s.addGold(200000, 'test');
  return s;
};
const normalEnc = () => content.encounters.all().find((e) => !e.isBoss && e.level >= 10 && e.level <= 14)!;

describe('Holdings (221)', () => {
  it('every class has a building and two upgrade quests that exist', () => {
    const ids = content.classes.all().map((c) => c.id);
    expect(HOLDINGS.map((h) => h.classId).sort()).toEqual([...ids].sort());
    expect(HOLDING_QUESTS).toHaveLength(HOLDINGS.length * 2);
    for (const q of HOLDING_QUESTS.slice(0, 6)) expect(content.quests.has(q.id)).toBe(true);
  });

  it('builds in Emberfall with gold and stores, needs a quest for levels 2 and 3, and gives perks', () => {
    const s = session({ classId: 'warrior' });
    const h = HOLDINGS.find((x) => x.classId === 'warrior')!;
    expect(s.grace.build('warrior').ok).toBe(false); // not in Emberfall
    (s.realm as any).inEmberfall = () => true;
    s.realm.village.timber = 500;
    s.realm.village.stone = 500;
    expect(s.grace.build('mage').ok).toBe(false); // not your class
    const phys = characterStats(s.player).physicalAttack;
    expect(s.grace.build('warrior').ok).toBe(true);
    expect(s.grace.levelOf('warrior')).toBe(1);
    expect(characterStats(s.player).physicalAttack).toBeGreaterThan(phys);
    expect(s.state.flags['holding-open:warrior:2']).toBe(true);
    expect(s.grace.build('warrior').ok).toBe(false); // the quest first
    s.setFlag('holding-done:warrior:2', true);
    expect(s.grace.build('warrior').ok).toBe(true);
    s.setFlag('holding-done:warrior:3', true);
    expect(s.grace.build('warrior').ok).toBe(true);
    expect(s.grace.build('warrior').ok).toBe(false);
    expect(h.name).toBeTruthy();
  });
});

describe('Divine Intervention (222)', () => {
  it('a weekly call: needs a patron, once a week, restores and blesses on success', () => {
    const s = session();
    expect(s.grace.callOnGod().ok).toBe(false); // no patron
    s.player.devotion.patron = 'solenne';
    s.state.clock.day = 20;
    let answered = false;
    for (let i = 0; i < 40 && !answered; i++) {
      s.grace.t.lastCall = -999;
      s.player.hp = 1;
      const r = s.grace.callOnGod();
      expect(r.ok).toBe(true);
      answered = s.player.timedBuffs.some((b) => b.id === 'divine-aid');
    }
    expect(answered).toBe(true);
    expect(characterStats(s.player).maxHp).toBeGreaterThan(0);
    expect(s.grace.callOnGod().ok).toBe(false); // spent for a week
    s.state.clock.day += 7;
    expect(s.grace.callReady).toBe(true);
  });

  it('the Last Prayer is offered once a playthrough to a hero with a patron', () => {
    const s = session();
    s.player.devotion.patron = 'solenne';
    s.grace.sync();
    expect(s.player.devotion.lastPrayerChance).toBeGreaterThan(29);
    const b = createEncounterBattle(s.player, normalEnc(), { rng: new Rng(2), level: 12 });
    const me = b.alive('party')[0]!;
    expect(me.lastPrayer?.used).toBe(false);
    s.player.devotion.lastPrayerUsed = true;
    s.grace.sync();
    expect(s.player.devotion.lastPrayerChance).toBeUndefined();
  });

  it('a fall with no Intervention left triggers the Last Prayer exactly once', () => {
    const hero = benchmarkHero('warrior', 12);
    hero.devotion.patron = 'solenne';
    hero.devotion.lastPrayerChance = 100;
    const b = createEncounterBattle(hero, normalEnc(), { rng: new Rng(2), level: 12 });
    startBattle(b);
    const me = b.alive('party')[0]!;
    const foe = b.alive('enemy')[0]!;
    me.intervention = undefined;
    applyDamage(b, foe, me, me.hp + 1000, { element: 'physical', crit: false });
    expect(me.alive).toBe(true);
    expect(b.tally.lastPrayer).toBe('solenne');
    expect(me.lastPrayer?.used).toBe(true);
    applyDamage(b, foe, me, me.hp + 1000, { element: 'physical', crit: false });
    expect(me.alive).toBe(false);
  });
});

describe('Mounted Combat (223)', () => {
  it('a hero with a mount rides into battle with charge and trample; a hard blow throws them once', () => {
    const hero = benchmarkHero('warrior', 12);
    hero.stable.mount = 'riding-horse';
    const b = createEncounterBattle(hero, normalEnc(), { rng: new Rng(4), level: 12 });
    startBattle(b);
    const me = b.alive('party')[0]!;
    expect(me.mounted).toBe(true);
    expect(me.hotbar).toContain('g-mount-charge');
    expect(me.buffs.some((x) => x.id === 'mounted')).toBe(true);
    const charge = content.skills.get('g-mount-charge');
    expect(canUseSkill(b, me, charge).ok).toBe(true);
    const foe = b.alive('enemy')[0]!;
    const before = me.hp;
    applyDamage(b, foe, me, Math.round(me.hp * 0.9), { element: 'physical', crit: false });
    expect(me.mounted).toBe(false);
    expect(before - me.hp).toBeLessThan(Math.round(before * 0.9) * (1 - MOUNTED.soakPct / 100) + 2);
    expect(canUseSkill(b, me, charge).ok).toBe(false);
    expect(me.buffs.some((x) => x.id === 'mounted')).toBe(false);
  });

  it('the Weeping Steppe slows a hero on foot and helps a rider', () => {
    const s = session();
    (s.pockets as any).here = () => 'weeping-steppe';
    const onFoot = s.pockets.mods().some((m) => m.stat === 'speed' && m.value < 0);
    s.player.stable.mount = 'riding-horse';
    const riding = s.pockets.mods().some((m) => m.stat === 'speed' && m.value > 0);
    expect(onFoot).toBe(true);
    expect(riding).toBe(true);
  });
});
