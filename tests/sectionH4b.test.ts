import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { FAMILY_ENEMIES, GREAT_ENEMIES, GREAT_FOES, GODS9, NINEFOLD_GROUP } from '../src/data/greatFoes';
import { MERCY_FOES } from '../src/data/mercy';
import { POCKET_DUNGEONS } from '../src/data/pockets';
import { encounter } from '../src/data/story/helpers';
import { chooseAction } from '../src/engine/combat/ai';
import { applyDamage, dealDamage } from '../src/engine/combat/hits';
import { CLOCK_PATTERNS } from '../src/engine/combat/rules';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import type { Battle } from '../src/engine/combat/battle';
import type { Combatant } from '../src/engine/combat/types';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const start = (enemies: string[], opts: { weather?: string; level?: number } = {}) => {
  const s = GameSession.newGame(5, makeHero({ classId: 'warrior' }));
  s.player.level = opts.level ?? 40;
  s.state.gold = 100000;
  const b = createEncounterBattle(s.player, encounter('t', 'Test', 40, enemies, true), { rng: s.rng, purse: s.state.gold, ...(opts.weather ? { weather: opts.weather } : {}) });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  const foe = (id: string) => b.combatants.find((x) => x.enemyId === id) as Combatant;
  return { s, b, hero, foe };
};
const turn = (b: Battle, x: Combatant) => b.emit({ type: 'turn', actorId: x.id });

describe('content: eight great foes and six enemy families', () => {
  it('has the bosses, the nine heads, and three foes in each family', () => {
    for (const id of ['tithe-collector', 'mother-ninefold', 'cartographer-wyrm', 'the-understudy', 'saint-gallowmere', 'last-conductor', 'grudgebound-emperor', 'sir-remnant']) {
      expect(content.enemies.get(id).tier).toBe('boss');
      expect(content.bossScripts.find(id), id).toBeTruthy();
    }
    expect(GREAT_ENEMIES.filter((e) => e.id.startsWith('ninefold-head'))).toHaveLength(9);
    expect(NINEFOLD_GROUP).toHaveLength(10);
    expect(GREAT_FOES).toHaveLength(8);
    for (const fam of ['oathless', 'inkwraith', 'clocktide', 'saltghoul', 'lantern-moth', 'hollowed']) expect(FAMILY_ENEMIES.filter((e) => e.types.includes(fam)).length, fam).toBe(3);
    expect(content.bossScripts.get('saint-gallowmere').phases).toHaveLength(8);
    expect(MERCY_FOES['sir-remnant']).toBeTruthy();
  });

  it('the new dungeons are filled with the new families', () => {
    const used = new Set(POCKET_DUNGEONS.flatMap((d) => d.encounters.flatMap((g) => g.enemies.map((e) => e.enemyId))));
    for (const id of ['saltghoul', 'ink-blot', 'clocktide-sentry', 'oathless-soldier']) expect(used.has(id), id).toBe(true);
  });
});

describe('The Tithe-Collector (113)', () => {
  it('takes gold with each blow and returns it with 25% interest', () => {
    const { b, hero, foe } = start(['tithe-collector']);
    const boss = foe('tithe-collector');
    const before = b.purse;
    applyDamage(b, boss, hero, 10, { element: 'physical', crit: false });
    applyDamage(b, boss, hero, 10, { element: 'physical', crit: false });
    expect(b.rules.stolen).toBeGreaterThan(0);
    expect(b.purse).toBe(before - b.rules.stolen);
    expect(b.tally.spent).toBe(b.rules.stolen);
    applyDamage(b, hero, boss, 999999, { element: 'physical', crit: false });
    b.checkOutcome();
    expect(b.outcome).toBe('victory');
    expect(b.tally.goldFound).toBe(Math.round(b.rules.stolen * 1.25));
  });
});

describe('Mother Ninefold (114)', () => {
  it('her last phase follows the order her heads fall, and comes once', () => {
    const { b, hero, foe } = start(NINEFOLD_GROUP);
    const mother = foe('mother-ninefold');
    const order = [...GODS9];
    for (const g of order.slice(0, 8)) applyDamage(b, hero, foe(`ninefold-head-${g}`), 999999, { element: 'physical', crit: false });
    expect(b.rules.ninefold).toBe(false);
    expect(b.rules.heads).toHaveLength(8);
    applyDamage(b, hero, foe('ninefold-head-hesha'), 999999, { element: 'physical', crit: false });
    expect(b.rules.ninefold).toBe(true);
    expect(mother.alive).toBe(true);
  });

  it('also turns when she falls to 30% with heads still on', () => {
    const { b, hero, foe } = start(NINEFOLD_GROUP);
    const mother = foe('mother-ninefold');
    applyDamage(b, hero, mother, Math.round(mother.maxHp * 0.75), { element: 'physical', crit: false });
    expect(b.rules.ninefold).toBe(true);
  });
});

describe('The Cartographer Wyrm and the Understudy (115, 116)', () => {
  it('the Wyrm redraws the field every third turn', () => {
    const { b, foe } = start(['cartographer-wyrm']);
    const w = foe('cartographer-wyrm');
    const before = (b as any).buffer.length;
    turn(b, w); turn(b, w);
    expect((b as any).buffer.slice(before).some((e: any) => e.type === "log" && /redraws/.test(e.text))).toBe(false);
    turn(b, w);
    expect((b as any).buffer.slice(before).some((e: any) => e.type === "log" && /redraws/.test(e.text))).toBe(true);
  });

  it('the Understudy copies flourishes but not plain play', () => {
    const { b, hero, foe } = start(['the-understudy']);
    const u = foe('the-understudy');
    for (let i = 0; i < 3; i++) b.emit({ type: 'action', actorId: hero.id, label: 'Fireball', targets: [u.id] });
    expect(u.statInput.modifiers.filter((m) => m.source === 'rehearsed').length).toBe(2);
    for (let i = 0; i < 3; i++) b.emit({ type: 'action', actorId: hero.id, label: 'Attack', targets: [u.id] });
    expect(u.statInput.modifiers.some((m) => m.source === 'rehearsed')).toBe(false);
  });
});

describe('The Last Conductor (118)', () => {
  it('beats four to the bar, and dancers keep time against the downbeat', () => {
    const { b, hero, foe } = start(['last-conductor']);
    const c = foe('last-conductor');
    hero.resources.rhythm = 20;
    const before = c.stagger?.value ?? 0;
    for (let i = 0; i < 4; i++) turn(b, c);
    expect(b.rules.beat).toBe(0);
    expect(c.stagger!.value).toBeGreaterThan(before);
  });
});

describe('families (121-126)', () => {
  it('the Oathless shrug off holy damage', () => {
    const { b, hero, foe } = start(['oathless-soldier']);
    const o = foe('oathless-soldier');
    const hp = o.hp;
    dealDamage(b, hero, o, { element: 'holy', power: 500, canMiss: false });
    expect(hp - o.hp).toBeLessThan(5);
    const hp2 = o.hp;
    dealDamage(b, hero, o, { element: 'physical', power: 500, canMiss: false });
    expect(hp2 - o.hp).toBeGreaterThan(20);
  });

  it('Clocktide Automatons follow a pattern you can learn', () => {
    const { b, foe } = start(['clocktide-sentry']);
    const a = foe('clocktide-sentry');
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      const act = chooseAction(b, a);
      seen.push(act.kind === 'skill' ? act.skillId : act.kind);
      turn(b, a);
    }
    expect(seen.slice(0, 4)).toEqual(CLOCK_PATTERNS['clocktide-sentry']);
    expect(seen.slice(4)).toEqual(seen.slice(0, 4));
  });

  it('Saltghouls drink in the rain and swell', () => {
    const { b, foe } = start(['saltghoul'], { weather: 'rain' });
    const g = foe('saltghoul');
    turn(b, g);
    expect(g.statuses.some((s) => s.id === 'wet')).toBe(true);
    const dry = start(['saltghoul'], { weather: 'clear' });
    turn(dry.b, dry.foe('saltghoul'));
    expect(dry.foe('saltghoul').statuses.some((s) => s.id === 'wet')).toBe(false);
  });

  it('Lantern Moths blind you and drink your mana', () => {
    const { b, hero, foe } = start(['lantern-moth']);
    const m = foe('lantern-moth');
    hero.mp = hero.maxMp;
    let blinded = false;
    for (let i = 0; i < 12 && !blinded; i++) {
      applyDamage(b, m, hero, 5, { element: 'physical', crit: false });
      blinded = hero.statuses.some((s) => s.id === 'blind');
    }
    expect(hero.mp).toBeLessThan(hero.maxMp);
    expect(blinded).toBe(true);
  });

  it('Inkwraiths drink the glyphs you draw', () => {
    const { b, hero, foe } = start(['ink-blot']);
    const k = foe('ink-blot');
    k.hp = Math.round(k.maxHp / 2);
    const hp = k.hp;
    b.emit({ type: 'action', actorId: hero.id, label: 'Glyph of Warding', targets: [] });
    expect(k.hp).toBeGreaterThan(hp);
  });
});

describe('the Grudgebound Emperor (119) and the great-foe hunt', () => {
  it('needs three living Grudgebound, and is built from them', () => {
    const s = GameSession.newGame(5, makeHero());
    s.player.level = 40;
    expect(s.foes.seek('grudgebound-emperor').ok).toBe(false);
    const wolf = content.enemies.all().find((e) => e.tier === 'normal')!.id;
    for (let i = 0; i < 4; i++) s.state.realm.grudge.entries[`g${i}`] = { id: `g${i}`, name: `G${i}`, epithet: 'x', zone: 'meadowlands', enemyId: wolf, rank: i + 1, scars: i + 1, beat: 0, fled: 0, traits: [], cause: 'beat', born: 1 };
    expect(s.foes.court().map((g) => g.id)).toEqual(['g3', 'g2', 'g1']);
    expect(s.foes.seek('grudgebound-emperor').ok).toBe(true);
    expect((s.endgame as any).e.active.special).toEqual({ module: 'greatfoe', ref: 'grudgebound-emperor' });
    s.specials['greatfoe']!((s.endgame as any).e.active, true);
    expect(s.foes.f.defeated['grudgebound-emperor']).toBeDefined();
    expect(s.player.devotion.titles).toContain('Emperor of Nothing');
    expect(s.foes.mods().length).toBe(1);
  });

  it('the others are sought in their own region', () => {
    const s = GameSession.newGame(5, makeHero());
    s.player.level = 40;
    expect(s.foes.seek('tithe-collector').ok).toBe(false);
    Object.defineProperty(s.world, 'zone', { get: () => ({ id: 'aurelane' }) });
    expect(s.foes.seek('tithe-collector').ok).toBe(true);
  });
});
