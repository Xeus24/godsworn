import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { ALIGNED, DISHES, GODFORGE, HAMMER_ID, NAMED_LEGENDS, PET_TALENT, TALKING_RELICS } from '../src/data/craft';
import { encounter } from '../src/data/story/helpers';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import { generateGear } from '../src/engine/items/generate';
import { GameSession } from '../src/engine/state/gameState';
import type { Combatant } from '../src/engine/combat/types';
import { makeHero } from './helpers';

const session = (zone = 'meadowlands', town: string | false = 'brightwater') => {
  const s = GameSession.newGame(31, makeHero());
  (s.world as any).inTown = () => town;
  Object.defineProperty(s.world, 'zone', { get: () => ({ id: zone }), configurable: true });
  s.player.level = 40;
  s.state.gold = 10000000;
  return s;
};
const wear = (s: GameSession, uniqueId: string, slot = 'mainHand') => {
  const item = { ...generateGear({ rng: s.rng, itemLevel: 30, newUid: () => s.newUid() }, { uniqueId }), identified: true };
  (s.player.equipment as any)[slot] = item;
  s.wonders.refresh();
  return item;
};
const fight = (s: GameSession, enemies: string[]) => {
  const b = createEncounterBattle(s.player, encounter('t', 'T', 30, enemies, true), { rng: s.rng, purse: 100 });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  return { b, hero, foe: b.combatants.find((x) => x.side === 'enemy') as Combatant };
};

describe('Talking Relics (142)', () => {
  it('ten relics found in their regions, carried three at a time, with moods that follow how you fight', () => {
    expect(TALKING_RELICS).toHaveLength(10);
    const s = session('meadowlands');
    expect(s.craft.take('tr-spoon').ok).toBe(true);
    expect(s.craft.take('tr-spoon').ok).toBe(false);
    expect(s.craft.take('tr-bell').ok).toBe(false);
    const before = s.craft.mods().length;
    const { b } = fight(s, ['meadow-wolf']);
    b.tally.kills.push(...Array.from({ length: 4 }, () => ({ enemyId: 'meadow-wolf', level: 1, tier: 'normal' as const, types: ['beast'], xp: 1 })));
    for (let i = 0; i < 5; i++) s.craft.afterBattle(b);
    expect(s.craft.sulking('tr-spoon')).toBe(true);
    expect(s.craft.mods().length).toBe(before - 1);
    b.tally.kills.length = 0;
    b.tally.spared.push('meadow-wolf');
    for (let i = 0; i < 8; i++) s.craft.afterBattle(b);
    expect(s.craft.sulking('tr-spoon')).toBe(false);
    for (const r of TALKING_RELICS.slice(1, 4)) {
      (s.world as any).zone;
      s.craft.k.relics.owned.push(r.id);
    }
    expect(s.craft.carry('tr-bell', true).ok).toBe(true);
    expect(s.craft.carry('tr-key', true).ok).toBe(true);
    expect(s.craft.carry('tr-shield', true).ok).toBe(false);
  });
});

describe('Relic Awakening (143)', () => {
  it('a god-aligned living item grows when you fight in its god’s style', () => {
    const s = session();
    const ring = wear(s, 'hearth-ring', 'ring1');
    expect(ALIGNED['hearth-ring']!.god).toBe('hesha');
    const { b } = fight(s, ['meadow-wolf']);
    const xp = ring.livingXp ?? 0;
    s.craft.afterBattle(b);
    expect(ring.livingXp ?? 0).toBe(xp);
    b.tally.spared.push('meadow-wolf');
    s.craft.afterBattle(b);
    expect(ring.livingXp!).toBeGreaterThan(xp);
  });
});

describe('Legend Rumors (144) and Pet Talents (145)', () => {
  it('a tavern speaks of three legendaries you have not found, a different three each week', () => {
    const s = session();
    const a = s.craft.rumors();
    expect(a).toHaveLength(3);
    expect(a[0]!.text.length).toBeGreaterThan(30);
    s.state.clock.day += 14;
    expect(s.craft.rumors().map((r) => r.id)).not.toEqual(a.map((r) => r.id));
    const out = session('meadowlands', false);
    expect(out.craft.rumors()).toHaveLength(0);
  });

  it('every pet has a talent, and the talents do something', () => {
    for (const p of content.pets.all()) expect(PET_TALENT[p.id], p.id).toBeTruthy();
    const s = session();
    expect(s.craft.usePet().ok).toBe(false);
    s.player.stable.pets.push('lucky-ferret');
    s.player.stable.pet = 'lucky-ferret';
    const g = s.state.gold;
    expect(s.craft.usePet().ok).toBe(true);
    expect(s.state.gold).toBeGreaterThan(g);
    expect(s.craft.usePet().ok).toBe(false);
    s.player.stable.pet = 'library-mouse';
    s.wonders.refresh();
    expect(s.craft.mods().some((m) => m.stat === 'barter')).toBe(true);
    s.player.stable.pet = 'barn-owl';
    expect(s.craft.usePet().ok).toBe(true);
  });
});

describe('Hearth Meals (146)', () => {
  it('a favorite dish delights, a hated one stings, and it can be cooked once a day', () => {
    const s = session();
    s.party.recruit('sable');
    s.party.get('sable')!.approval = 50;
    const t = s.craft.taste('sable');
    expect(t.favorite).not.toBe(t.hated);
    expect(s.craft.cook(t.favorite).ok).toBe(true);
    expect(s.party.get('sable')!.approval).toBeGreaterThan(54);
    expect(s.craft.cook(t.hated).ok).toBe(false);
    s.state.clock.day += 1;
    const a = s.party.get('sable')!.approval;
    s.craft.cook(t.hated);
    expect(s.party.get('sable')!.approval).toBeLessThan(a);
    expect(DISHES.length).toBe(12);
    const out = session('meadowlands', false);
    expect(out.craft.cook(DISHES[0]!.id).ok).toBe(false);
  });
});

describe('Named Legendaries (147)', () => {
  it('eight of them, in the game', () => {
    expect(NAMED_LEGENDS).toHaveLength(8);
    for (const u of NAMED_LEGENDS) expect(content.uniques.get(u.id).rarity).toBe('legendary');
  });

  it('Hesha’s Last Kindness cannot kill: it spares', () => {
    const s = session();
    wear(s, 'hesha-last-kindness');
    const { b, hero, foe } = fight(s, ['meadow-wolf']);
    expect(hero.flags).toContain('cannotKill');
    applyDamage(b, hero, foe, 99999, { element: 'physical', crit: false });
    expect(foe.alive).toBe(false);
    expect(b.tally.spared.length).toBe(1);
    expect(b.tally.kills.length).toBe(0);
  });

  it('Coat of Yesterday undoes the first big hit, once', () => {
    const s = session();
    wear(s, 'coat-of-yesterday', 'cloak');
    const { b, hero, foe } = fight(s, ['meadow-wolf']);
    expect(hero.flags).toContain('yesterday');
    const hp = hero.hp;
    applyDamage(b, foe, hero, Math.round(hero.maxHp * 0.3), { element: 'physical', crit: false });
    expect(hero.hp).toBe(hp);
    applyDamage(b, foe, hero, Math.round(hero.maxHp * 0.3), { element: 'physical', crit: false });
    expect(hero.hp).toBeLessThan(hp);
  });

  it('Choirbreaker silences singers', () => {
    const s = session();
    wear(s, 'choirbreaker');
    const { b, hero, foe } = fight(s, ['siren-chorister']);
    applyDamage(b, hero, foe, 3, { element: 'physical', crit: false });
    expect(foe.statuses.some((x) => x.id === 'silence')).toBe(true);
  });

  it('the Quiet Crown stops the gods’ voices in battle', () => {
    const s = session();
    wear(s, 'quiet-crown', 'head');
    const { hero } = fight(s, ['meadow-wolf']);
    expect(hero.flags).toContain('quietCrown');
    expect(s.craft.quietCrown()).toBe(true);
  });

  it('the Debtor’s Ring takes a tenth of your gold each day', () => {
    const s = session();
    wear(s, 'debtors-ring', 'ring1');
    s.state.gold = 1000;
    s.state.clock.day = 5;
    s.bus.emit('timeChanged', { day: 5, hour: 0 } as any);
    expect(s.state.gold).toBe(900);
    s.bus.emit('timeChanged', { day: 5, hour: 1 } as any);
    expect(s.state.gold).toBe(900);
  });

  it('the Lantern gathers a wick for each light, and a passive for every five', () => {
    const s = session();
    expect(s.craft.kindle('x').ok).toBe(false);
    wear(s, 'lantern-thousand-wicks', 'amulet');
    for (let i = 0; i < 10; i++) s.craft.kindle(`lamp-${i}`);
    expect(s.craft.kindle('lamp-1').ok).toBe(false);
    expect(s.craft.k.wicks).toHaveLength(10);
    expect(s.craft.mods()).toHaveLength(2);
  });

  it('Thalor’s Unfinished Hammer is finished in six steps, growing each time', () => {
    const s = session();
    s.state.stats.worldBossesKilled = 1;
    s.state.stats.bossesKilled = 1;
    expect(s.craft.forgeHammer().ok).toBe(true);
    const hammer = s.state.inventory.slots.find((i) => i?.uniqueId === HAMMER_ID)!;
    expect(hammer).toBeTruthy();
    for (let i = 0; i < 5; i++) expect(s.craft.forgeHammer().ok, `step ${i + 2}`).toBe(true);
    expect(s.craft.forgeHammer().ok).toBe(false);
    expect(hammer.livingXp).toBe(50);
  });
});

describe('Godforge Relics (148)', () => {
  it('forged from the gods you have slain, each carrying their last words', () => {
    expect(GODFORGE).toHaveLength(6);
    const s = session();
    expect(s.craft.forge('thalor').ok).toBe(false);
    s.player.bestiary['aspect-thalor'] = 1;
    expect(s.craft.forgeable('thalor')).toBe(true);
    const r = s.craft.forge('thalor');
    expect(r.ok && /Good metal/.test(r.text ?? '')).toBe(true);
    expect(s.craft.forge('thalor').ok).toBe(false);
    expect(s.state.inventory.slots.some((i) => i?.uniqueId === 'gf-thalor')).toBe(true);
  });
});
