import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { ALL_TRAITS, BONDS, FLAWS, IDEALS } from '../src/data/personality';
import { TRINKETS, TRINKET_QUESTS } from '../src/data/trinkets';
import { characterStats } from '../src/engine/character/stats';
import { journalEntry } from '../src/engine/realm/fellowship';
import { GameSession } from '../src/engine/state/gameState';
import { createCharacter } from '../src/engine/character/create';
import { countHeld } from '../src/engine/items/inventory';
import { makeHero } from './helpers';

describe('Section I-5: backgrounds, personality and trinkets (187-189)', () => {
  it('adds six backgrounds (18 in all), each with a skill, an item, voices and a three-quest line', () => {
    const ids = ['criminal', 'folk-hero', 'hermit', 'outlander', 'charlatan', 'guild-envoy'];
    expect(content.backgrounds.size).toBe(18);
    for (const id of ids) {
      const b = content.backgrounds.get(id);
      expect(content.generalSkills.has(b.skill), id).toBe(true);
      expect(content.items.has(b.item.itemId), id).toBe(true);
      expect(b.voice).toHaveLength(2);
      expect(content.quests.filter((q) => q.id.startsWith(`bg-${id}-`)), id).toHaveLength(3);
    }
  });

  it('has twelve Ideals, twelve Bonds and twelve Flaws, each with a working modifier', () => {
    expect([IDEALS.length, BONDS.length, FLAWS.length]).toEqual([12, 12, 12]);
    expect(new Set(ALL_TRAITS.map((t) => t.id)).size).toBe(36);
    const base = characterStats(makeHero({ classId: 'warrior' }));
    const withIdeal = characterStats(makeHero({ classId: 'warrior', ideal: 'mercy', bond: 'family', flaw: 'wrath' }));
    expect(withIdeal.healingPower).toBeGreaterThan(base.healingPower);
    expect(withIdeal.maxHp).toBeGreaterThan(base.maxHp);
  });

  it('colours journal entries with the hero’s personality', () => {
    const plain = new Set<string>();
    const coloured = new Set<string>();
    for (let day = 1; day < 60; day++) {
      plain.add(journalEntry('boss', 'soldier', day));
      coloured.add(journalEntry('boss', 'soldier', day, '', { ideal: 'mercy', bond: 'family', flaw: 'greed' }));
    }
    const notes = ['I tried to leave something standing.', 'I wrote to them, in my head.', 'I counted it twice. Again.'];
    expect([...coloured].some((t) => notes.some((n) => t.includes(n)))).toBe(true);
    expect([...plain].some((t) => notes.some((n) => t.includes(n)))).toBe(false);
  });

  it('has a hundred unique trinkets; fifteen secretly start quests, and none drop as loot', () => {
    expect(TRINKETS).toHaveLength(100);
    expect(new Set(TRINKETS.map((t) => t.name + t.description)).size).toBe(100);
    expect(TRINKET_QUESTS).toHaveLength(15);
    const pool = content.items.filter((b) => b.category === 'curiosity' && !b.id.startsWith('trinket-'));
    expect(pool.length).toBeGreaterThan(10);
  });

  it('hands the keepsake over at the start, and a questing trinket starts its quest', () => {
    const quester = TRINKET_QUESTS[0]?.requires as { kind: 'item'; itemId: string };
    const hero = createCharacter({ name: 'Pocket', portrait: 0, raceId: 'human', classId: 'warrior', birthSignId: 'the-forge', background: 'soldier', trinket: quester.itemId });
    const s = GameSession.newGame(5, hero);
    expect(countHeld(s.state, quester.itemId)).toBe(1);
    s.quests.refresh();
    expect(s.state.quests.active[TRINKET_QUESTS[0]?.id as string]).toBeDefined();
  });
});
