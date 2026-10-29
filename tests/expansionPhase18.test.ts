import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import type { Cond, QuestDef } from '../src/engine/quests/types';

const side = content.quests.filter((q) => q.kind === 'side');
const dialoguesOf = (q: QuestDef): string[] => q.stages.flatMap((s) => s.objectives.flatMap((o) => ('dialogue' in o && o.dialogue ? [o.dialogue] : [])));
const nodes = (id: string) => Object.values(content.dialogues.find(id)?.nodes ?? {});
const acts = (q: QuestDef) => dialoguesOf(q).flatMap((d) => nodes(d).flatMap((n) => (n.choices ?? []).flatMap((c) => (c.actions ?? []).map((a) => a.kind))));
const consequential = (q: QuestDef): boolean => dialoguesOf(q).some((d) => nodes(d).some((n) => (n.choices ?? []).filter((c) => !c.cond).length >= 2 && (n.choices ?? []).some((c) => (c.actions ?? []).some((a) => ['setFlag', 'rep', 'favor', 'approval'].includes(a.kind)))));
const plainKill = (q: QuestDef): boolean => q.stages.every((s) => s.objectives.every((o) => o.kind === 'kill'));
const prereqs = (c: Cond | undefined): string[] => (!c ? [] : c.kind === 'quest' ? [c.quest] : c.kind === 'all' || c.kind === 'any' ? c.conds.flatMap(prereqs) : []);
const chained = (q: QuestDef): boolean => prereqs(q.requires).some((id) => content.quests.find(id)?.kind === 'side' && content.quests.find(id)?.zone !== q.zone);

describe('side quests', () => {
  it('number 110 or more', () => {
    expect(side.length).toBeGreaterThanOrEqual(110);
  });

  it('30% have a consequential choice, 20% chain across regions and at most 15% are plain kill quests', () => {
    expect(side.filter(consequential).length / side.length).toBeGreaterThanOrEqual(0.3);
    expect(side.filter(chained).length / side.length).toBeGreaterThanOrEqual(0.2);
    expect(side.filter(plainKill).length / side.length).toBeLessThanOrEqual(0.15);
  });

  it('include investigation, stealth, race, escort and crafting jobs', () => {
    const mine = side.filter((q) => q.id.startsWith('sg-'));
    expect(mine).toHaveLength(36);
    const has = (f: (q: QuestDef) => boolean) => mine.filter(f).length;
    expect(has((q) => q.stages.some((s) => s.objectives.filter((o) => o.kind === 'visit').length >= 2)), 'investigation').toBeGreaterThanOrEqual(3);
    expect(has((q) => q.stages.some((s) => s.objectives.some((o) => o.kind === 'deed' && o.deed.event === 'goldStolen'))), 'stealth').toBeGreaterThanOrEqual(3);
    expect(has((q) => q.stages.some((s) => s.hours !== undefined && s.objectives.some((o) => o.kind === 'visit'))), 'race').toBeGreaterThanOrEqual(3);
    expect(has((q) => q.stages.some((s) => s.objectives.some((o) => o.kind === 'escort'))), 'escort').toBeGreaterThanOrEqual(3);
    expect(has((q) => q.stages.some((s) => s.objectives.some((o) => o.kind === 'deed' && o.deed.event === 'craft'))), 'crafting').toBeGreaterThanOrEqual(3);
    expect(acts(content.quests.get('sg-lamps-1'))).toContain('setFlag');
  });
});

describe('seven factions', () => {
  it('has the Lantern Concord and the Cog & Anvil Union, eight quests each, with halls', () => {
    expect(content.factions.all()).toHaveLength(7);
    for (const f of ['lantern-concord', 'cog-union']) {
      const quests = content.quests.filter((q) => q.kind === 'faction' && q.rewards.rep?.[f] !== undefined);
      expect(quests, f).toHaveLength(8);
      expect(content.towns.get(content.factions.get(f).hall).faction).toBe(f);
      expect(quests.at(-1)?.rewards.title, f).toBeTruthy();
    }
  });

  it('the reputation each quest asks for can be earned from the ones before', () => {
    for (const f of ['lantern-concord', 'cog-union']) {
      const quests = content.quests.filter((q) => q.kind === 'faction' && q.rewards.rep?.[f] !== undefined);
      let earned = 0;
      for (const q of quests) {
        const need = JSON.stringify(q.requires).match(/"kind":"rep","faction":"[a-z-]+","min":(\d+)/);
        if (need) expect(Number(need[1]), q.id).toBeLessThanOrEqual(earned);
        earned += q.rewards.rep?.[f] ?? 0;
      }
    }
  });
});
