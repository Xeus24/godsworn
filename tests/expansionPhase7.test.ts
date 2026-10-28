import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { skillOptions, teamSkillsFor } from '../src/engine/combat/skills';
import { startBattle } from '../src/engine/combat/turns';
import { canAddClass, classSlotCount, hybridTrialOpen } from '../src/engine/character/multiclass';
import { Rng } from '../src/engine/core/rng';
import { makeHero } from './helpers';

describe('forty-five hybrids', () => {
  it('has 45 hybrids: 13 old, 26 new pairings and 6 more god-hybrids', () => {
    expect(content.hybrids.size).toBe(45);
    expect(content.hybrids.all().filter((h) => h.requires?.apostleOf)).toHaveLength(7);
    expect(content.hybrids.all().filter((h) => h.classes.length === 2)).toHaveLength(12 + 26);
  });

  it('each new hybrid has a 16-node tree, two skills and a level 36 trial', () => {
    for (const h of content.hybrids.all().slice(13)) {
      const tree = content.trees.get(h.id);
      expect(tree.nodes, h.id).toHaveLength(16);
      expect(content.encounters.has(h.trial), h.id).toBe(true);
      expect(tree.nodes.filter((n) => n.kind === 'active'), h.id).toHaveLength(2);
      for (const id of h.classes) expect(content.classes.get(id).hidden, `${h.id} uses hidden ${id}`).toBeFalsy();
    }
  });

  it('keystones really carry their price', () => {
    const keystone = content.trees.get('dread-knight').nodes.find((n) => n.kind === 'keystone');
    expect(keystone?.modifiers?.some((m) => m.value < 0)).toBe(true);
  });

  it('a god-hybrid needs its specialization and Apostleship', () => {
    const c = makeHero({ classId: 'warrior' });
    c.classes[0]!.level = 30;
    expect(hybridTrialOpen(c, 'glorybound').ok).toBe(false);
  });
});

describe('team attacks', () => {
  it('has 32 dual techniques naming real partners', () => {
    const team = content.skills.all().filter((s) => s.team);
    expect(team).toHaveLength(32);
    for (const s of team) for (const p of s.team!) expect(content.classes.has(p) || content.companions.has(p), s.id).toBe(true);
  });

  function party(classes: string[]) {
    const chars = classes.map((id) => makeHero({ classId: id }));
    const units = chars.map((c, i) => createHero(c, i === 0 ? 'hero' : `companion:${['korga', 'ilyra', 'aldric'][i - 1]}`));
    units.slice(1).forEach((u) => (u.kind = 'companion'));
    const foe = createEnemy(content.enemies.get('goblin-cutthroat'), 'foe', 5);
    const b = new Battle({ party: units, enemies: [foe], rng: new Rng(4), encounterId: 't', canFlee: true });
    startBattle(b);
    return { b, units };
  }

  it('appears only while both partners stand together', () => {
    const { b, units } = party(['warrior', 'mage']);
    expect(teamSkillsFor(b, units[0]!).map((s) => s.name)).toContain('Spellsteel Volley');
    expect(skillOptions(b, units[0]!).some((o) => o.skill.team && o.check.ok)).toBe(true);
    units[1]!.alive = false;
    expect(teamSkillsFor(b, units[0]!)).toHaveLength(0);
  });

  it('is unavailable to a lone hero', () => {
    const { b, units } = party(['warrior']);
    expect(teamSkillsFor(b, units[0]!)).toHaveLength(0);
  });

  it('matches companions by id', () => {
    const { b, units } = party(['warrior', 'warrior']);
    expect(teamSkillsFor(b, units[1]!).some((s) => s.team?.includes('korga'))).toBe(false);
  });
});

describe('the base-game third class slot', () => {
  it('opens at level 45 after the errand, and still at NG+2', () => {
    const c = makeHero();
    c.level = 45;
    expect(classSlotCount(c, 0)).toBe(2);
    c.thirdSlot = true;
    expect(classSlotCount(c, 0)).toBe(3);
    c.thirdSlot = false;
    c.level = 40;
    expect(classSlotCount(c, 2)).toBe(3);
    c.level = 44;
    c.thirdSlot = true;
    expect(classSlotCount(c, 0)).toBe(2);
  });

  it('is offered by a quest with a real dialogue', () => {
    expect(content.quests.has('side-third-road')).toBe(true);
    expect(content.dialogues.has('d-third-road')).toBe(true);
    expect(canAddClass(makeHero(), 'mage', 0).ok).toBe(false);
  });
});
