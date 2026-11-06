import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { JOURNAL_BASE, JOURNAL_VOICE, LETTERS, LETTER_KINDS, MOMENTS, MOODS, MORALE, WOUNDS } from '../src/data/fellowship';
import { DIVINE_SEASONS } from '../src/data/pilgrimage';
import { journalEntry, journalVariants } from '../src/engine/realm/fellowship';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(91, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 30;
  s.state.gold = 100000;
  return s;
};

describe('Divine Moods and Letters (items 68, 69)', () => {
  it('five moods rise with favor, ±20% on blessings; every god has six letters', () => {
    expect(MOODS).toHaveLength(5);
    const s = session();
    const before = s.fellowship.moodIndex('kael');
    s.devotion.apply({ kael: 400 }, 't', true, true);
    expect(s.fellowship.moodIndex('kael')).toBeGreaterThan(before);
    expect(Math.abs(s.fellowship.moodPower())).toBeLessThanOrEqual(20);
    for (const d of DIVINE_SEASONS) for (const k of LETTER_KINDS) expect((LETTERS[d.god] as Record<string, string>)[k], `${d.god} ${k}`).toBeTruthy();
  });
  it('letters arrive at milestones, and fray in the Twilight arc', () => {
    const s = session();
    s.devotion.apply({ kael: 600 }, 't', true, true);
    s.bus.emit('timeChanged', { day: s.state.clock.day + 1, hour: 1 });
    const mine = s.fellowship.f.letters.filter((l) => l.god === 'kael').map((l) => l.kind);
    expect(mine).toEqual(expect.arrayContaining(['welcome', 'favored', 'devoted']));
    const t = s.fellowship.letterText('kael', 'welcome');
    expect(t).not.toContain('…');
    s.state.ngPlus = 1;
    expect(s.fellowship.letterText('kael', 'welcome')).toContain('…');
  });
});

describe('Party Morale and Lingering Wounds (items 84, 85)', () => {
  it('victories lift morale, defeats drain it; extremes change your stats; 15 wounds heal with rest or gold', () => {
    const s = session();
    const start = s.fellowship.f.morale;
    for (let i = 0; i < 12; i++) s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    expect(s.fellowship.f.morale).toBeGreaterThan(start);
    expect(s.fellowship.moraleBand()).toBe('high');
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders' && m.stat === 'damageBonus' && m.value === 5)).toBe(true);
    for (let i = 0; i < 12; i++) s.bus.emit('combatEnded', { encounterId: 'x', result: 'defeat' });
    expect(s.fellowship.f.morale).toBeLessThan(MORALE.low);
    expect(WOUNDS).toHaveLength(15);
    expect(s.fellowship.f.wounds.length).toBeGreaterThan(0);
    expect(s.fellowship.f.wounds.length).toBeLessThanOrEqual(3);
    const id = s.fellowship.f.wounds[0]!.id;
    const gold = s.state.gold;
    expect(s.fellowship.heal(id, 'herbalist').ok).toBe(true);
    expect(s.state.gold).toBeLessThan(gold);
    s.bus.emit('timeChanged', { day: s.state.clock.day + 10, hour: 0 });
    expect(s.fellowship.f.wounds).toHaveLength(0);
  });
});

describe('Companion Oaths (item 75)', () => {
  it('a sour god makes a companion doubt, argue and leave for a few days, and they come back', () => {
    const s = session();
    s.party.recruit('aldric');
    s.state.party.companions['aldric']!.inParty = true;
    s.devotion.apply({ solenne: -300 }, 't', true, true);
    const comp = s.state.party.companions['aldric']!;
    let day = s.state.clock.day;
    for (let i = 0; i < 3; i++) {
      day += 4;
      s.state.clock.day = day;
      s.bus.emit('timeChanged', { day, hour: 1 });
    }
    expect(s.fellowship.f.oaths['aldric']!.stage).toBe(3);
    expect(comp.inParty).toBe(false);
    day += 6;
    s.state.clock.day = day;
    s.bus.emit('timeChanged', { day, hour: 1 });
    expect(comp.inParty).toBe(true);
  });
});

describe('The Godsworn Journal and class moments (items 86, 82)', () => {
  it('writes in the hero’s voice, with well over 120 possible entries; every class has two moments', () => {
    expect(Object.keys(JOURNAL_VOICE)).toHaveLength(18);
    for (const bg of content.backgrounds.all()) expect(JOURNAL_VOICE[bg.id], bg.id).toBeTruthy();
    expect(journalVariants()).toBeGreaterThan(120);
    expect(journalEntry('boss', 'sailor', 4)).toBe(journalEntry('boss', 'sailor', 4));
    expect(new Set(Array.from({ length: 40 }, (_, d) => journalEntry('boss', 'sailor', d))).size).toBeGreaterThan(10);
    expect(Object.keys(JOURNAL_BASE)).toHaveLength(10);
    expect(MOMENTS.length).toBeGreaterThanOrEqual(40);
    const classes = new Set(MOMENTS.map((m) => m.cls));
    expect(classes.size).toBe(20);
    for (const c of classes) expect(content.classes.find(c), c).toBeTruthy();
    const s = session();
    s.bus.emit('enemyKilled', { enemyId: 'x', tier: 'boss' });
    expect(s.fellowship.f.journal.length).toBe(1);
  });
});
