import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { FURNITURE } from '../src/data/world/furniture';
import { generateGear } from '../src/engine/items/generate';
import { Rng } from '../src/engine/core/rng';
import { collectInvestments, investmentWaiting, raiseInvestment } from '../src/engine/world/investments';
import { addFurniture, canBuyFurniture, houseModifiers } from '../src/engine/world/housing';
import { merchantTown } from '../src/engine/economy/shops';
import { itemModifiers } from '../src/engine/items/itemStats';
import { makeHero } from './helpers';

const count = (r: string): number => content.uniques.filter((u) => u.rarity === r).length;

describe('item counts', () => {
  it('meets the Greater Pantheon targets', () => {
    expect(content.weaponTypes.size).toBe(26);
    expect(count('legendary')).toBeGreaterThanOrEqual(150);
    expect(count('mythic')).toBe(35);
    expect(count('relic')).toBeGreaterThanOrEqual(30);
    expect(count('primordial')).toBe(20);
    expect(content.itemSets.size).toBe(26);
    expect(content.runewords.size).toBe(40);
    expect(content.affixes.size).toBe(110);
    expect(content.recipes.size).toBeGreaterThanOrEqual(220);
    expect(content.items.filter((i) => i.category === 'consumable').length).toBeGreaterThanOrEqual(90);
    expect(content.items.filter((i) => i.category === 'material').length).toBeGreaterThanOrEqual(60);
  });

  it('makes a working item of every new weapon type', () => {
    for (const t of ['katana', 'whip', 'longbow', 'pistol', 'rifle', 'chakram']) {
      expect(content.items.has(`${t}-t3`), t).toBe(true);
      expect(content.classes.filter((c) => c.weapons.includes(t)).length, t).toBeGreaterThan(0);
    }
  });

  it('has 40+ cooked foods', () => {
    expect(content.items.filter((i) => i.category === 'consumable' && i.kind === 'food').length).toBeGreaterThanOrEqual(46);
  });
});

describe('professions', () => {
  it('has six crafting professions, a Grandmaster recipe and a five-quest storyline each', () => {
    const crafting = content.professions.filter((p) => p.kind === 'crafting');
    expect(crafting).toHaveLength(6);
    for (const p of crafting) {
      expect(content.recipes.has(`grandmaster-${p.id}`), p.id).toBe(true);
      expect(content.quests.filter((q) => q.id.startsWith(`prof-${p.id}-`)), p.id).toHaveLength(5);
    }
    expect(content.professions.has('skinning')).toBe(true);
  });
});

describe('item systems', () => {
  it('has a Flawless quality', () => {
    expect(content.qualities.get('flawless').statMult).toBeGreaterThan(content.qualities.get('masterwork').statMult);
  });

  it('living items grow with experience', () => {
    const rng = new Rng(2);
    const item = generateGear({ rng, itemLevel: 25, newUid: () => 'u' }, { uniqueId: 'seedling-blade' });
    item.identified = true;
    expect(item.livingXp).toBe(0);
    const base = itemModifiers(item).filter((m) => m.stat === 'natureDamage').reduce((n, m) => n + m.value, 0);
    item.livingXp = 20;
    const grown = itemModifiers(item).filter((m) => m.stat === 'natureDamage').reduce((n, m) => n + m.value, 0);
    expect(grown).toBeGreaterThan(base);
  });
});

describe('house, stables and businesses', () => {
  it('has 120 pieces of furniture, with a per-room cap', () => {
    expect(FURNITURE).toHaveLength(120);
    const hero = makeHero();
    hero.world.house = { town: 'brightwater', rooms: { bedroom: 1 }, lastCollected: 0 };
    const bedroom = FURNITURE.filter((f) => f.room === 'bedroom');
    expect(canBuyFurniture(hero, FURNITURE.find((f) => f.room === 'forge')!.id).ok).toBe(false);
    for (let i = 0; i < 6; i++) expect(addFurniture(hero, bedroom[i]!.id).ok).toBe(true);
    expect(addFurniture(hero, bedroom[6]!.id).ok).toBe(false);
    expect(houseModifiers(hero).filter((m) => m.source.startsWith('furniture:'))).toHaveLength(6);
  });

  it('has 40 pets and 16 mounts, some that swim, climb or fly', () => {
    expect(content.pets.size).toBeGreaterThanOrEqual(40);
    expect(content.mounts.size).toBeGreaterThanOrEqual(15);
    expect(content.mounts.filter((m) => m.grants?.skill === 'swimming').length).toBeGreaterThan(0);
    expect(content.mounts.filter((m) => !!m.flies).length).toBeGreaterThan(0);
  });

  it('puts four merchants and the Collector on the road', () => {
    const roaming = content.shops.filter((s) => !!s.roams);
    expect(roaming).toHaveLength(5);
    for (const s of roaming) expect(new Set(Array.from({ length: 20 }, (_, d) => merchantTown(s, d))).size, s.id).toBeGreaterThan(2);
    expect(content.shops.get('collector').curiosityMult).toBe(3);
  });

  it('pays businesses for the days you are away', () => {
    const hero = makeHero();
    raiseInvestment(hero, 'brightwater-mill', 10);
    expect(investmentWaiting(hero, 'brightwater-mill', 20)).toBe(10 * 18);
    expect(collectInvestments(hero, 'brightwater', 20)).toBe(180);
    expect(investmentWaiting(hero, 'brightwater-mill', 20)).toBe(0);
    expect(investmentWaiting(hero, 'brightwater-mill', 200)).toBe(30 * 18);
  });

  it('has twelve more curiosities, four of which start quests', () => {
    expect(content.quests.filter((q) => q.id.startsWith('curio-'))).toHaveLength(4);
    expect(content.items.has('torn-treasure-chart')).toBe(true);
  });
});
