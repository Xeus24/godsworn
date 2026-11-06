import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { HIRELINGS, KITS } from '../src/data/workshop';
import { RIDERS, SHAPES, FORGE_ELEMENTS, maxCircle } from '../src/data/spellforge';
import { REAGENTS } from '../src/data/tabletop';
import { Rng } from '../src/engine/core/rng';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { characterStats } from '../src/engine/character/stats';
import { countOf } from '../src/engine/items/inventory';
import { createItem } from '../src/engine/items/generate';
import { circleOfRecipe, ensureForged, forgeId, parseForgeId } from '../src/engine/skills/forge';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (extra: Record<string, unknown> = {}) => {
  const s = GameSession.newGame(41, makeHero(extra));
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 20;
  s.addGold(100000, 'test');
  return s;
};
const normalEnc = () => content.encounters.all().find((e) => !e.isBoss && e.level >= 10 && e.level <= 14)!;

describe('Spellforging (218)', () => {
  it('a recipe round-trips through its id and builds a real spell', () => {
    const id = forgeId('Shaping', 'burst', 'fire', 'slow');
    const r = parseForgeId(id)!;
    expect(circleOfRecipe(r)).toBe(SHAPES.find((x) => x.id === 'burst')!.circle + RIDERS.find((x) => x.id === 'slow')!.circle);
    const sk = ensureForged(id)!;
    expect(sk.targeting).toBe('allEnemies');
    expect(sk.element).toBe('fire');
    expect(content.skills.get(id)).toBe(sk);
    expect(parseForgeId('forge:Nope:bolt:fire:plain')).toBeUndefined();
    expect(FORGE_ELEMENTS.length).toBe(9);
  });

  it('forging costs ink and gold, respects the Circle cap and the slot limit, and only works in town', () => {
    const s = session();
    expect(s.workshop.forge('Shaping', 'bolt', 'fire', 'plain').ok).toBe(false); // no ink
    expect(s.workshop.buyInk(10).ok).toBe(true);
    const before = s.state.gold;
    const r = s.workshop.forge('Shaping', 'bolt', 'fire', 'plain');
    expect(r.ok).toBe(true);
    expect(s.state.gold).toBeLessThan(before);
    expect(s.player.forged).toHaveLength(1);
    expect(s.workshop.forge('Shaping', 'bolt', 'fire', 'plain').ok).toBe(false); // twice
    s.player.level = 1;
    expect(maxCircle(1)).toBe(1);
    expect(s.workshop.forge('Shaping', 'nova', 'ice', 'plain').ok).toBe(false); // too high a Circle
    (s.world as any).inTown = () => undefined;
    expect(s.workshop.forge('Warding', 'ward', 'holy', 'plain').ok).toBe(false);
    expect(s.workshop.unforge(s.player.forged![0]!).ok).toBe(true);
  });

  it('a forged spell joins the hero in battle and a high Circle burns ink with the Tabletop Rules', () => {
    const s = session();
    s.workshop.buyInk(30);
    const id = forgeId('Ending', 'nova', 'arcane', 'stun');
    s.player.level = 40;
    expect(s.workshop.forge('Ending', 'nova', 'arcane', 'stun').ok).toBe(true);
    expect(REAGENTS[id]?.itemId).toBe('spell-ink');
    const hero = benchmarkHero('mage', 20);
    hero.forged = [id];
    const b = createEncounterBattle(hero, normalEnc(), { rng: new Rng(3), level: 12 });
    const me = b.alive('party')[0]!;
    expect(me.skills.some((x) => x.id === id)).toBe(true);
    expect(me.hotbar).toContain(id);
    expect(runAutoBattle(b).length).toBeGreaterThan(0);
  });
});

describe('Kits (219)', () => {
  it('has 12 kits with unique ids; heroes start proficient from their class', () => {
    expect(KITS).toHaveLength(12);
    expect(new Set(KITS.map((k) => k.id)).size).toBe(12);
    for (const k of KITS) if ('itemId' in k.makes) expect(content.items.find(k.makes.itemId), k.id).toBeTruthy();
    const s = session({ classId: 'rogue' });
    expect(s.workshop.proficient('thieves')).toBe(true);
    expect(s.workshop.proficient('smith')).toBe(false);
  });

  it('buying, training and working a kit: passives need proficiency and work is once a day', () => {
    const s = session({ classId: 'rogue' });
    const base = characterStats(s.player).dodge;
    expect(s.workshop.buyKit('thieves').ok).toBe(true);
    expect(s.workshop.buyKit('thieves').ok).toBe(false);
    expect(characterStats(s.player).dodge).toBeGreaterThan(base);
    expect(s.workshop.buyKit('smith').ok).toBe(true);
    const def = characterStats(s.player).defense;
    expect(s.workshop.train('smith').ok).toBe(true);
    expect(characterStats(s.player).defense).toBeGreaterThan(def);
    expect(s.workshop.work('herbalist').ok).toBe(false); // not owned
    s.workshop.buyKit('herbalist');
    s.workshop.train('herbalist');
    const first = s.workshop.work('herbalist');
    expect(first.ok).toBe(true);
    expect(s.workshop.work('herbalist').ok).toBe(false); // once a day
  });

  it('working kits eventually produces goods', () => {
    const s = session({ classId: 'cleric' });
    s.workshop.buyKit('herbalist');
    const before = countOf(s.state.inventory, 'health-potion-minor');
    for (let i = 0; i < 30; i++) {
      s.advanceTime(24 * 60);
      s.workshop.work('herbalist');
    }
    expect(countOf(s.state.inventory, 'health-potion-minor')).toBeGreaterThan(before);
    void createItem;
  });
});

describe('Hirelings (220)', () => {
  it('has six types; one retainer at a time; wages, morale, levels and the guide slow the road', () => {
    expect(HIRELINGS.map((h) => h.id)).toEqual(['porter', 'guard', 'guide', 'scholar', 'cook', 'scout']);
    const s = session();
    const def = characterStats(s.player).defense;
    expect(s.workshop.hire('guard').ok).toBe(true);
    expect(s.workshop.hire('porter').ok).toBe(false);
    expect(characterStats(s.player).defense).toBeGreaterThan(def);
    for (let i = 0; i < 5; i++) s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    expect(s.workshop.hired!.level).toBe(2);
    const gold = s.state.gold;
    s.advanceTime(24 * 60);
    expect(s.state.gold).toBeLessThan(gold);
    expect(s.workshop.dismiss().ok).toBe(true);
    s.workshop.hire('guide');
    expect(s.workshop.marchStep).toBe(0.5);
    for (let i = 0; i < 4; i++) s.bus.emit('zoneEntered', { zoneId: 'meadowlands' });
    expect(s.afflictions.weary).toBe(0);
  });

  it('a hireling you cannot pay loses heart and leaves', () => {
    const s = session();
    s.workshop.hire('scout');
    s.state.gold = 0;
    for (let i = 0; i < 5 && s.workshop.hired; i++) s.advanceTime(24 * 60);
    expect(s.workshop.hired).toBeUndefined();
  });
});
