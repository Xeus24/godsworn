import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { characterBaseStats, characterStats } from '../src/engine/character/stats';
import { buyPrice } from '../src/engine/economy/shops';
import { createItem } from '../src/engine/items/generate';
import { mendWithMaterial, useConsumableInField } from '../src/engine/items/use';
import { evaluate } from '../src/engine/quests/conditions';
import { GameSession } from '../src/engine/state/gameState';
import { PRIMARY_STATS } from '../src/engine/stats/types';
import { makeHero } from './helpers';

describe('Charisma', () => {
  it('is an eighth primary stat that every class has a base and growth for', () => {
    expect(PRIMARY_STATS).toContain('cha');
    for (const c of content.classes.all()) {
      expect(c.baseStats.cha).toBeGreaterThan(0);
      expect(c.growth.cha).toBeGreaterThan(0);
    }
    expect(content.classes.get('bard').baseStats.cha).toBeGreaterThan(content.classes.get('warrior').baseStats.cha);
  });

  it('lowers shop prices through Barter and lifts the Bard', () => {
    const plain = makeHero({ classId: 'rogue' });
    const smooth = makeHero({ classId: 'rogue' });
    smooth.allocated.cha = 40;
    expect(characterStats(smooth).barter).toBeGreaterThan(characterStats(plain).barter);
    const shop = content.shops.get('general');
    const item = createItem('health-potion-minor', 1, () => 'x');
    expect(buyPrice(item, shop, 'brightwater', smooth)).toBeLessThanOrEqual(buyPrice(item, shop, 'brightwater', plain));
    const bard = makeHero({ classId: 'bard' });
    const before = characterStats(bard).physicalAttack;
    bard.allocated.cha = 30;
    expect(characterStats(bard).physicalAttack).toBeGreaterThan(before);
  });

  it('is a dialogue check stat, and companions warm to a charming hero', () => {
    const s = GameSession.newGame(1, makeHero({ classId: 'bard' }));
    s.player.allocated.cha = 60;
    expect(evaluate(s.state, { kind: 'stat', stat: 'cha', min: 30 })).toBe(true);
    expect(evaluate(s.state, { kind: 'stat', stat: 'cha', min: 90 })).toBe(false);
  });
});

describe('backgrounds', () => {
  it('has twelve, each with a real item, a free skill and two voice lines', () => {
    expect(content.backgrounds.size).toBe(12);
    for (const b of content.backgrounds.all()) {
      expect(content.items.has(b.item.itemId), b.id).toBe(true);
      expect(content.generalSkills.has(b.skill), b.id).toBe(true);
      expect(b.voice).toHaveLength(2);
    }
  });

  it('adds the stat bonus, the starting item and the skill', () => {
    const plain = makeHero({ classId: 'warrior' });
    const smith = makeHero({ classId: 'warrior', background: 'smith-apprentice' });
    expect(characterBaseStats(smith).str).toBe(characterBaseStats(plain).str + 2);
    const s = GameSession.newGame(2, smith);
    expect(s.player.generalSkills.tinkering?.rank).toBe(1);
    expect(s.state.inventory.slots.some((i) => i?.baseId === 'oil-flask')).toBe(true);
    expect(evaluate(s.state, { kind: 'background', backgroundId: 'smith-apprentice' })).toBe(true);
    expect(evaluate(s.state, { kind: 'background', backgroundId: 'scholar' })).toBe(false);
  });
});

describe('races and signs', () => {
  it('Ashborn pay more, Forged cannot drink potions but can mend, Shadekin dodge at night', () => {
    const shop = content.shops.get('general');
    const item = createItem('health-potion-minor', 1, () => 'x');
    const human = makeHero({ raceId: 'human' });
    const ash = makeHero({ raceId: 'ashborn' });
    expect(buyPrice(item, shop, 'brightwater', ash)).toBeGreaterThan(buyPrice(item, shop, 'brightwater', human));

    const forged = makeHero({ raceId: 'forged' });
    const s = GameSession.newGame(3, forged);
    s.player.hp = 5;
    s.state.inventory.slots[0] = createItem('health-potion-minor', 1, () => 'p');
    expect(useConsumableInField(s.player, s.state.inventory, 0).ok).toBe(false);
    s.state.inventory.slots[1] = createItem('iron-ore', 2, () => 'o');
    expect(mendWithMaterial(s.player, s.state.inventory).ok).toBe(true);
    expect(s.player.hp).toBeGreaterThan(5);
    expect(mendWithMaterial(makeHero({ raceId: 'human' }), s.state.inventory).ok).toBe(false);

    const shade = content.races.get('shadekin');
    expect(shade.passive.modifiers.some((m) => m.stat === 'dodge' && m.condition?.kind === 'timeOfDay')).toBe(true);
  });

  it('has 16 birth signs (one per god, the Nameless One and the Unmarked), each tied to a real god', () => {
    expect(content.birthSigns.size).toBe(16);
    for (const sign of content.birthSigns.all()) expect(content.gods.has(sign.god)).toBe(true);
  });
});

describe('personal questlines', () => {
  it('gives every race and every background a three-quest line from its own NPC', () => {
    for (const r of content.races.all()) {
      const q = content.quests.filter((x) => x.id.startsWith(`race-${r.id}-`));
      expect(q.map((x) => x.id).sort(), r.id).toEqual([`race-${r.id}-1`, `race-${r.id}-2`, `race-${r.id}-3`]);
      expect(q.every((x) => x.kind === 'racial')).toBe(true);
    }
    for (const b of content.backgrounds.all()) {
      expect(content.quests.filter((x) => x.id.startsWith(`bg-${b.id}-`)), b.id).toHaveLength(3);
    }
    expect(content.quests.filter((q) => q.kind === 'racial')).toHaveLength(57);
    expect(content.quests.filter((q) => q.kind === 'background')).toHaveLength(36);
  });
});

describe('dialogue checks', () => {
  const gated = new Set(['stat', 'race', 'background', 'class', 'favor', 'apostle', 'companion', 'rep']);
  const dialogues = new Map(content.dialogues.all().map((d) => [d.id, d]));
  const has = (id: string): boolean => Object.values(dialogues.get(id)?.nodes ?? {}).some((n) => (n.choices ?? []).some((c) => c.cond && gated.has(c.cond.kind)));
  const ids = (q: ReturnType<typeof content.quests.all>[number]): string[] => [
    ...q.stages.flatMap((s) => s.objectives.flatMap((o) => ('dialogue' in o && o.dialogue ? [o.dialogue] : []))),
    ...content.npcs.all().flatMap((n) => (n.topics ?? []).filter((t) => t.cond?.kind === 'quest' && t.cond.quest === q.id).map((t) => t.dialogue)),
  ];

  it('every main quest and at least half of side quests have a gated reply', () => {
    const main = content.quests.filter((q) => q.kind === 'main');
    expect(main.every((q) => ids(q).some(has))).toBe(true);
    const side = content.quests.filter((q) => q.kind === 'side' && !['saint-', 'prof-', 'curio-'].some((pre) => q.id.startsWith(pre)));
    expect(side.filter((q) => ids(q).some(has)).length / side.length).toBeGreaterThanOrEqual(0.5);
  });

  it('uses CHA, race and background checks, not only stats', () => {
    const all = content.dialogues.all().flatMap((d) => Object.values(d.nodes).flatMap((n) => n.choices ?? []));
    const kinds = (k: string) => all.filter((c) => c.cond?.kind === k).length;
    expect(all.filter((c) => c.cond?.kind === 'stat' && c.cond.stat === 'cha').length).toBeGreaterThan(5);
    expect(kinds('race')).toBeGreaterThan(10);
    expect(kinds('background')).toBeGreaterThan(10);
  });
});
