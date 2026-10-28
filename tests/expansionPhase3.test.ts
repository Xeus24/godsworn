import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { MASTERY_PERKS } from '../src/data/masteryPerks';
import { characterModifiers } from '../src/engine/character/stats';
import { MASTERY_THRESHOLDS, MAX_MASTERY, masteryMultiplier } from '../src/engine/skills/mastery';
import { exportBuild, importBuild } from '../src/engine/skills/buildCode';
import { canEvolve, evolveSkill } from '../src/engine/skills/evolution';
import { allocate, activeBuild, canAllocate, knownSkills, treeState } from '../src/engine/skills/tree';
import { BUILD_SLOTS } from '../src/engine/skills/treeTypes';
import { GameSession } from '../src/engine/state/gameState';
import { deserialize, serialize } from '../src/engine/state/save';
import { BASE_CLASS_IDS, makeHero } from './helpers';

describe('mastery to 10', () => {
  it('has ten levels, with Mastered at 5 and a smaller bonus afterwards', () => {
    expect(MASTERY_THRESHOLDS).toHaveLength(10);
    expect(MAX_MASTERY).toBe(10);
    const m5 = masteryMultiplier(300);
    const m10 = masteryMultiplier(2600);
    expect(m5).toBeCloseTo(1.15);
    expect(m10).toBeCloseTo(1.225);
  });

  it('every class has a different Grandmaster perk that turns on at mastery 10', () => {
    const hero = makeHero({ classId: 'rogue' });
    const base = characterModifiers(hero).filter((m) => m.source.startsWith('grandmaster:')).length;
    hero.mastery.backstab = 2600;
    const withPerk = characterModifiers(hero).filter((m) => m.source === 'grandmaster:rogue');
    expect(base).toBe(0);
    expect(withPerk.length).toBeGreaterThan(0);
    const names = new Set(BASE_CLASS_IDS.map((id) => JSON.stringify(MASTERY_PERKS[id]?.name)));
    expect(names.size).toBe(8);
  });
});

describe('hidden nodes', () => {
  it('every class has four, locked until their feat is met', () => {
    for (const id of BASE_CLASS_IDS) expect(content.trees.get(id).nodes.filter((n) => n.feat), id).toHaveLength(4);
    const hero = makeHero({ classId: 'warrior' });
    hero.classes[0]!.skillPoints = 10;
    const node = 'warrior.secrets.1';
    expect(canAllocate(hero, 'warrior', node).ok).toBe(false);
    hero.bestiary['goblin-king'] = 1;
    expect(canAllocate(hero, 'warrior', node).ok).toBe(true);
    expect(allocate(hero, 'warrior', node).ok).toBe(true);
  });
});

describe('skill evolutions', () => {
  it('has three per class and replaces the base skill once earned', () => {
    for (const id of BASE_CLASS_IDS) expect(content.evolutions.filter((e) => e.classId === id), id).toHaveLength(3);
    const hero = makeHero({ classId: 'mage' });
    expect(canEvolve(hero, {}, 'firebolt').ok).toBe(false);
    hero.mastery.firebolt = 2600;
    expect(canEvolve(hero, {}, 'firebolt').ok).toBe(false);
    const done = { 'cl-mage-3': 1 };
    expect(evolveSkill(hero, done, 'firebolt').ok).toBe(true);
    const ids = knownSkills(hero).map((s) => s.id);
    expect(ids).toContain('phoenix-bolt');
    expect(ids).not.toContain('firebolt');
    expect(hero.mastery['phoenix-bolt']).toBe(2600);
    expect(content.skills.get('phoenix-bolt').damage?.multiplier).toBeGreaterThan(content.skills.get('firebolt').damage?.multiplier ?? 0);
  });
});

describe('five builds and share codes', () => {
  it('start with five builds, and old saves with three are padded', () => {
    expect(BUILD_SLOTS).toBe(5);
    const s = GameSession.newGame(4, makeHero());
    treeState(s.player, 'warrior');
    const old = JSON.parse(serialize(s)) as { state: { player: { trees: Record<string, { builds: unknown[] }> } } };
    old.state.player.trees.warrior!.builds.length = 3;
    const r = deserialize(JSON.stringify(old));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.player.trees.warrior?.builds).toHaveLength(5);
  });

  it('exports a build and imports it into another hero of the same class', () => {
    const a = makeHero({ classId: 'warrior' });
    a.classes[0]!.skillPoints = 8;
    for (const id of ['warrior.fury.a', 'warrior.fury.m1', 'warrior.fury.a1']) allocate(a, 'warrior', id);
    const code = exportBuild(a, 'warrior');
    const b = makeHero({ classId: 'warrior' });
    b.classes[0]!.skillPoints = 8;
    expect(importBuild(b, 'warrior', code).ok).toBe(true);
    expect(activeBuild(b, 'warrior').ranks).toEqual(activeBuild(a, 'warrior').ranks);
    expect(importBuild(b, 'warrior', 'nonsense').ok).toBe(false);
    expect(importBuild(makeHero({ classId: 'mage' }), 'mage', code).ok).toBe(false);
  });
});

describe('class questlines', () => {
  it('gives each class five quests after its trial, and the last three teach evolutions', () => {
    for (const c of content.classes.all()) {
      const qs = content.quests.filter((q) => q.id.startsWith(`cl-${c.id}-`));
      expect(qs, c.id).toHaveLength(5);
      for (const e of content.evolutions.filter((x) => x.classId === c.id)) expect(content.quests.has(e.quest)).toBe(true);
    }
  });
});
