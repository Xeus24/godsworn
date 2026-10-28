import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { changeDifficulty, difficultyChoices } from '../src/engine/character/difficultyChange';
import { characterModifiers } from '../src/engine/character/stats';
import { equippedGearLook } from '../src/engine/items/equipment';
import { createItem } from '../src/engine/items/generate';
import { setDye, setFrame, setTransmog, skinsFor, syncAppearance } from '../src/engine/items/appearance';
import { GameSession, SAVE_VERSION } from '../src/engine/state/gameState';
import { deserialize, serialize } from '../src/engine/state/save';
import { grantMap, unownedMaps } from '../src/engine/world/treasure';
import { entityActive } from '../src/engine/world/world';
import { mapFor } from '../src/engine/world/mapgen';
import { Rng } from '../src/engine/core/rng';
import { makeHero } from './helpers';

describe('save version 18', () => {
  it('loads a v17 save with the new systems at defaults', () => {
    const s = GameSession.newGame(5, makeHero());
    const old = JSON.parse(serialize(s)) as { state: { meta: { version: number }; world: Record<string, unknown>; player: Record<string, unknown> } };
    old.state.meta.version = 17;
    delete old.state.world.treasureMaps;
    delete old.state.player.appearance;
    const r = deserialize(JSON.stringify(old));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.meta.version).toBe(SAVE_VERSION);
    expect(r.state.world.treasureMaps).toEqual([]);
    expect(r.state.player.appearance.frame).toBe('plain');
  });
});

describe('changing difficulty', () => {
  it('lets a normal hero move between tiers but never into or out of Impossible', () => {
    const hero = makeHero();
    expect(changeDifficulty(hero, 'hard').ok).toBe(true);
    expect(hero.difficulty).toBe('hard');
    expect(changeDifficulty(hero, 'impossible').ok).toBe(false);
    expect(difficultyChoices(hero)).not.toContain('impossible');
    const imp = makeHero({ difficulty: 'impossible' });
    expect(changeDifficulty(imp, 'easy').ok).toBe(false);
  });

  it('locks Hardcore heroes', () => {
    const hc = makeHero({ hardcore: true });
    expect(changeDifficulty(hc, 'easy').ok).toBe(false);
    expect(difficultyChoices(hc)).toEqual([]);
  });

  it('pauses difficulty-locked paragon bonuses below their tier', () => {
    const hero = makeHero({ difficulty: 'hard' });
    hero.paragon.ferocity = 10;
    const has = () => characterModifiers(hero).some((m) => m.source === 'paragon:ferocity');
    expect(has()).toBe(true);
    changeDifficulty(hero, 'easy');
    expect(has()).toBe(false);
  });
});

describe('appearance', () => {
  it('unlocks looks by owning armor, applies them to the doll and dyes them', () => {
    const hero = makeHero();
    const chest = createItem('plate-chest-t3', 1, () => 'u1');
    hero.equipment.chest = chest;
    const app = hero.appearance;
    syncAppearance(app, hero, [], {});
    expect(skinsFor(app, 'chest').length).toBeGreaterThan(0);
    expect(setTransmog(app, 'chest', 'cloth:9').ok).toBe(false);
    const owned = skinsFor(app, 'chest')[0];
    expect(owned).toBeDefined();
    expect(setTransmog(app, 'chest', owned?.id ?? '').ok).toBe(true);
    expect(setDye(app, 'chest', 'crimson').ok).toBe(false);
    expect(setDye(app, 'chest', 'rust').ok).toBe(true);
    expect(equippedGearLook(hero).chest?.dye).toBe(content.dyes.get('rust').color);
  });

  it('grants frames when their achievement is earned', () => {
    const hero = makeHero();
    expect(setFrame(hero.appearance, 'oath').ok).toBe(false);
    syncAppearance(hero.appearance, hero, [], { 'chapter-1': 1 });
    expect(setFrame(hero.appearance, 'oath').ok).toBe(true);
  });
});

describe('treasure maps', () => {
  it('has 50+ maps, each with a unique reward and a dig spot on its zone', () => {
    expect(content.treasures.size).toBeGreaterThanOrEqual(50);
    const items = new Set(content.treasures.all().map((t) => `treasure-${t.id}`));
    expect(items.size).toBe(content.treasures.size);
    for (const id of items) expect(content.items.has(id)).toBe(true);
    for (const z of content.zones.all()) {
      const digs = mapFor(z.id).entities.filter((e) => e.kind === 'dig').map((e) => e.ref);
      expect(digs.sort()).toEqual(content.treasures.filter((t) => t.zone === z.id).map((t) => t.id).sort());
    }
  });

  it('hides a dig spot until its map is held and digs up the prize once', () => {
    const s = GameSession.newGame(11, makeHero());
    const zone = 'meadowlands';
    const map = mapFor(zone);
    const spot = map.entities.find((e) => e.kind === 'dig');
    expect(spot).toBeDefined();
    if (!spot) return;
    expect(entityActive(s.state.world, map, spot, 1)).toBe(false);
    s.state.world.treasureMaps.push(spot.ref as string);
    expect(entityActive(s.state.world, map, spot, 1)).toBe(true);
    s.state.world.position = { map: zone, x: spot.x, y: spot.y };
    s.world.interact(spot);
    expect(s.state.inventory.slots.some((i) => i?.baseId === `treasure-${spot.ref}`)).toBe(true);
    expect(entityActive(s.state.world, map, spot, s.state.clock.day)).toBe(false);
  });

  it('grants each unowned map once', () => {
    const w = GameSession.newGame(2, makeHero()).state.world;
    const rng = new Rng(4);
    const n = unownedMaps(w, 'whisperwood').length;
    for (let i = 0; i < n; i++) expect(grantMap(w, 'whisperwood', rng)).toBeDefined();
    expect(grantMap(w, 'whisperwood', rng)).toBeUndefined();
  });
});

describe('companion skill trees', () => {
  it('start player-allocated, spend points on request and can switch to auto', () => {
    const s = GameSession.newGame(21, makeHero());
    s.grantXp(2_000_000, true);
    s.party.recruit('korga');
    const comp = s.state.party.companions.korga;
    expect(comp?.autoTree).toBe(false);
    const classId = content.companions.get('korga').classId;
    const spent = () => Object.values(comp?.character.trees[classId]?.builds[0]?.ranks ?? {}).reduce((a, b) => a + b, 0);
    expect(spent()).toBe(0);
    const tree = content.trees.get(classId);
    const first = tree.nodes.find((n) => n.tier === 1);
    expect(first).toBeDefined();
    expect(s.party.allocateTree('korga', first?.id ?? '').ok).toBe(true);
    expect(spent()).toBe(1);
    expect(s.party.refundTree('korga', first?.id ?? '').ok).toBe(true);
    s.party.setAutoTree('korga', true);
    expect(spent()).toBeGreaterThan(1);
    s.party.resetTree('korga');
    expect(spent()).toBe(0);
  });
});
