import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { TECHNIQUE_COMBAT, TECHNIQUE_GENERAL, TECHNIQUE_ORDER } from '../src/data/general/techniques';
import { EXTRA_SPEC_BRANCHES } from '../src/data/trees/specsExtra';
import { Rng } from '../src/engine/core/rng';
import { canUseSkill } from '../src/engine/combat/skills';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { generalCombatSkills } from '../src/engine/skills/general';
import { GameSession } from '../src/engine/state/gameState';
import { specializationsFor } from '../src/engine/skills/specs';
import { makeHero } from './helpers';

const normalEnc = () => content.encounters.all().find((e) => !e.isBoss && e.level >= 10 && e.level <= 14)!;

describe('Battle Techniques (212)', () => {
  it('has 24 techniques, each a Technique-tagged general skill that costs Tactic Dice', () => {
    expect(TECHNIQUE_COMBAT).toHaveLength(24);
    expect(TECHNIQUE_GENERAL).toHaveLength(24);
    expect(new Set(TECHNIQUE_ORDER).size).toBe(24);
    for (const t of TECHNIQUE_COMBAT) {
      expect(t.tags).toContain('Technique');
      expect(t.cost.tactic).toBeGreaterThan(0);
    }
  });

  it('martial heroes learn four at the start, more with levels, and need no General slot', () => {
    const s = GameSession.newGame(5, makeHero({ classId: 'warrior' }));
    expect(generalCombatSkills(s.player).filter((g) => g.generalId.startsWith('tech-')).length).toBe(s.techniques.known(1));
    s.player.level = 30;
    s.bus.emit('levelUp', { characterId: s.player.id, level: 30 });
    expect(generalCombatSkills(s.player).filter((g) => g.generalId.startsWith('tech-')).length).toBe(14);
    const mage = GameSession.newGame(5, makeHero({ classId: 'mage' }));
    expect(generalCombatSkills(mage.player).some((g) => g.generalId.startsWith('tech-'))).toBe(false);
  });

  it('Tactic Dice are held per fight, spent by techniques, and refilled by kills', () => {
    const hero = benchmarkHero('warrior', 12);
    const b = createEncounterBattle(hero, normalEnc(), { rng: new Rng(2), level: 12 });
    startBattle(b);
    const me = b.alive('party')[0]!;
    expect(me.tacticMax).toBe(4);
    expect(me.tactic).toBe(4);
    const cleave = content.skills.get('g-tech-cleave');
    expect(canUseSkill(b, me, cleave).ok).toBe(true);
    me.tactic = 1;
    expect(canUseSkill(b, me, cleave).ok).toBe(false);
    const mage = benchmarkHero('mage', 12);
    const b2 = createEncounterBattle(mage, normalEnc(), { rng: new Rng(2), level: 12 });
    startBattle(b2);
    expect(b2.alive('party')[0]!.tacticMax).toBeUndefined();
  });
});

describe('Extra specializations (217)', () => {
  it('each of the eight original classes has a fourth specialization with a 12-node branch and its own ultimate', () => {
    expect(Object.keys(EXTRA_SPEC_BRANCHES).sort()).toEqual(['bard', 'cleric', 'mage', 'monk', 'necromancer', 'ranger', 'rogue', 'warrior']);
    for (const cls of Object.keys(EXTRA_SPEC_BRANCHES)) {
      const specs = specializationsFor(cls);
      expect(specs).toHaveLength(4);
      const extra = specs[3]!;
      expect(content.skills.get(extra.ultimate).ultimate).toBe(true);
      expect(extra.ultimate).not.toBe(content.classes.get(cls).ultimate);
    }
  });
});
