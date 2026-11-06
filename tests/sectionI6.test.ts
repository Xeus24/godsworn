import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BOONS, NOD_EVENTS } from '../src/data/tabletop';
import { ALL_TRAITS } from '../src/data/personality';
import { Rng } from '../src/engine/core/rng';
import { characterStats } from '../src/engine/character/stats';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { applyStatus } from '../src/engine/combat/statuses';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { check, combine, dcForMin, rollD20, statMod } from '../src/engine/tabletop/dice';
import { Conversation } from '../src/engine/state/conversation';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (tabletop: boolean, extra: Record<string, unknown> = {}) => {
  const s = GameSession.newGame(31, makeHero({ tabletop, ...extra }));
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 20;
  return s;
};

describe('Tabletop dice', () => {
  it('rolls d20s, keeping the higher when Favored and the lower when Forsaken', () => {
    for (let seed = 1; seed < 50; seed++) {
      const fav = rollD20(new Rng(seed), 'favored');
      const forsk = rollD20(new Rng(seed), 'forsaken');
      expect(fav.dice).toHaveLength(2);
      expect(fav.die).toBe(Math.max(...fav.dice));
      expect(forsk.die).toBe(Math.min(...forsk.dice));
      expect(fav.die).toBeGreaterThanOrEqual(forsk.die);
    }
    expect(combine(['favored', 'forsaken'])).toBe('normal');
    expect(combine(['favored'])).toBe('favored');
  });

  it('a natural 20 always succeeds and a natural 1 always fails', () => {
    let saw20 = false;
    let saw1 = false;
    for (let seed = 1; seed < 400; seed++) {
      const r = check(new Rng(seed), -50, 30);
      if (r.crit === 'nat20') { saw20 = true; expect(r.success).toBe(true); }
      if (r.crit === 'nat1') { saw1 = true; expect(r.success).toBe(false); }
      const easy = check(new Rng(seed), 50, 5);
      if (easy.crit === 'nat1') expect(easy.success).toBe(false);
    }
    expect(saw20 && saw1).toBe(true);
    expect(dcForMin(20)).toBe(15);
    expect(statMod(20, 8)).toBe(12);
  });
});

describe('the toggle (190) works in both modes', () => {
  it('is off by default and fixed on the character', () => {
    expect(makeHero().tabletop).toBeUndefined();
    expect(session(false).tabletop.on).toBe(false);
    expect(session(true).tabletop.on).toBe(true);
  });

  it('a stat-gated choice stays gated off, and becomes a Fate Die check on', () => {
    const find = () => {
      for (const d of content.dialogues.all()) {
        for (const n of Object.values(d.nodes)) {
          const ch = (n.choices ?? []).find((c) => c.cond?.kind === 'stat');
          if (ch) return { d, ch };
        }
      }
      throw new Error('no stat choice');
    };
    const { d, ch } = find();
    const npc = content.npcs.all()[0]!;
    for (const tt of [false, true]) {
      const s = session(tt);
      const conv = new Conversation(s, npc, undefined, d.id);
      // Walk to a node that has the choice: only if it is the start node, else just check the tag on whichever node holds it.
      const holder = Object.entries(d.nodes).find(([, n]) => (n.choices ?? []).includes(ch));
      expect(holder).toBeDefined();
      (conv as any).frame.node = holder![0];
      const view = conv.view();
      const row = view.choices.find((c) => c.label.includes(ch.text.slice(0, 12)));
      expect(row, `tabletop ${tt}`).toBeDefined();
      if (tt) {
        expect(row!.label).toContain('check, DC');
        expect(row!.enabled).toBe(true);
        conv.choose(view.choices.indexOf(row!));
        expect(conv.view().roll ?? s.state.realm.marvels.tabletop?.lastRoll).toBeDefined();
      } else expect(row!.label).not.toContain('check, DC');
    }
  });
});

describe('saves, Last Breath and rests (195, 198, 199)', () => {
  it('a hostile status is saved against with a stat roll when on, and the flat resist when off', () => {
    const enc = content.encounters.all().find((e) => e.level >= 10 && e.level <= 14)!;
    for (const tt of [false, true]) {
      const hero = benchmarkHero('warrior', 12);
      if (tt) hero.tabletop = true;
      const b = createEncounterBattle(hero, enc, { rng: new Rng(3), level: 12 });
      const foe = b.alive('enemy')[0]!;
      const me = b.alive('party')[0]!;
      for (let i = 0; i < 12; i++) applyStatus(b, foe, me, 'weaken', { duration: 2 });
      const lines = b.drain().filter((e) => e.type === 'log').map((e) => (e as { text: string }).text);
      expect(b.tabletop).toBe(tt);
      expect(lines.some((l) => l.includes('saves against'))).toBe(tt);
    }
  });

  it('Last Breath downs a hero instead of killing it, and Hardcore keeps permadeath', () => {
    const enc = content.encounters.all().find((e) => e.level >= 22 && e.level <= 26)!;
    const downedIn = (tt: boolean, hardcore: boolean): number => {
      let n = 0;
      for (let seed = 1; seed <= 25; seed++) {
        const hero = benchmarkHero('mage', 8);
        hero.tabletop = tt;
        hero.hardcore = hardcore;
        const b = createEncounterBattle(hero, enc, { rng: new Rng(seed), level: 24 });
        const events = runAutoBattle(b);
        if (events.some((e) => e.type === 'log' && e.text.includes('Last Breath'))) n++;
      }
      return n;
    };
    expect(downedIn(true, false)).toBeGreaterThan(0);
    expect(downedIn(false, false)).toBe(0);
    expect(downedIn(true, true)).toBe(0);
  });

  it('a Breather returns some health twice a day; the Night’s Rest resets it', () => {
    const s = session(true);
    const max = characterStats(s.player).maxHp;
    s.player.hp = 1;
    expect(s.tabletop.breather().ok).toBe(true);
    expect(s.player.hp).toBeGreaterThan(max * 0.3);
    expect(s.tabletop.breather().ok).toBe(true);
    expect(s.tabletop.breather().ok).toBe(false);
    s.tabletop.nightsRest();
    expect(s.tabletop.breathersLeft).toBe(2);
    expect(session(false).tabletop.breather().ok).toBe(false);
  });
});

describe('Boons and the God’s Nod (193, 194)', () => {
  it('has sixty Boons; a Boon or two stat points comes every four levels', () => {
    expect(BOONS).toHaveLength(60);
    expect(new Set(BOONS.map((b) => b.id)).size).toBe(60);
    const s = session(true);
    expect(s.tabletop.boonsPending).toBe(5);
    const before = characterStats(s.player).maxHp;
    expect(s.tabletop.takeBoon('boon-martial-4').ok).toBe(true);
    expect(characterStats(s.player).maxHp).toBeGreaterThan(before);
    const pts = s.player.attributePoints;
    expect(s.tabletop.takeStatPoints().ok).toBe(true);
    expect(s.player.attributePoints).toBe(pts + 2);
    expect(s.tabletop.boonsPending).toBe(3);
    expect(session(false).tabletop.boonsPending).toBe(0);
  });

  it('every Ideal, Bond and Flaw can earn a Nod, up to three, once a day each', () => {
    for (const t of ALL_TRAITS) expect(NOD_EVENTS[t.id], t.id).toBeDefined();
    const s = session(true, { ideal: 'glory', bond: 'rival', flaw: 'pride' });
    s.bus.emit('enemyKilled', { enemyId: 'x', tier: 'boss' });
    expect(s.tabletop.nods).toBe(3);
    s.bus.emit('enemyKilled', { enemyId: 'x', tier: 'boss' });
    expect(s.tabletop.nods).toBe(3);
    expect(s.tabletop.spendNod()).toBe(true);
    expect(s.tabletop.nods).toBe(2);
    const off = session(false, { ideal: 'glory' });
    off.bus.emit('enemyKilled', { enemyId: 'x', tier: 'boss' });
    expect(off.tabletop.nods).toBe(0);
  });
});
