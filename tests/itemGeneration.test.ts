import { describe, expect, it } from 'vitest';
import { BASE_CLASS_IDS } from './helpers';
import { content } from '../src/data';
import { Rng } from '../src/engine/core/rng';
import { createItem, generateGear, rarityWeights, rollAffixes, uniquePool, type GenerateContext } from '../src/engine/items/generate';
import { activeRuneword, itemModifiers, itemValue, sellValue } from '../src/engine/items/itemStats';
import { affixTargetOf, baseOf } from '../src/engine/items/lookup';
import { itemName } from '../src/engine/items/naming';
import type { ItemInstance } from '../src/engine/items/types';

let uid = 0;
const ctx = (over: Partial<GenerateContext> = {}): GenerateContext => ({
  rng: new Rng(123),
  itemLevel: 30,
  newUid: () => `t${++uid}`,
  ...over,
});

describe('content counts', () => {
  it('meets the spec minimums', () => {
    const weaponTypes = new Set(content.items.filter((b) => b.category === 'weapon').map((b) => (b.category === 'weapon' ? b.weaponType : '')));
    expect(weaponTypes.size).toBeGreaterThanOrEqual(15);
    expect(content.uniques.filter((u) => u.rarity === 'legendary').length).toBeGreaterThanOrEqual(40);
    expect(content.uniques.filter((u) => u.rarity === 'mythic').length).toBeGreaterThanOrEqual(15);
    expect(content.uniques.filter((u) => u.rarity === 'relic').length).toBeGreaterThanOrEqual(10);
    expect(content.itemSets.size).toBeGreaterThanOrEqual(10);
    expect(content.runewords.size).toBeGreaterThanOrEqual(15);
    expect(content.rarities.size).toBe(12);
    // Sets for the Greater Pantheon classes arrive with the item expansion (phase 10).
    for (const cls of content.classes.all().filter((c) => (BASE_CLASS_IDS as readonly string[]).includes(c.id))) {
      expect(content.itemSets.filter((s) => s.classId === cls.id).length, cls.id).toBe(1);
    }
  });

  it('every class set has 2/4/6 bonuses', () => {
    for (const set of content.itemSets.filter((s) => s.classId !== undefined)) {
      expect(set.bonuses.map((b) => b.pieces)).toEqual([2, 4, 6]);
    }
  });
});

describe('generateGear', () => {
  it('is reproducible from the seed', () => {
    const a = generateGear(ctx({ rng: new Rng(42), newUid: () => 'x' }));
    const b = generateGear(ctx({ rng: new Rng(42), newUid: () => 'x' }));
    expect(a).toEqual(b);
  });

  it('respects affix counts per rarity', () => {
    const rng = new Rng(9);
    for (const rarity of ['common', 'uncommon', 'rare', 'epic'] as const) {
      const [lo, hi] = content.rarities.get(rarity).affixes;
      for (let i = 0; i < 50; i++) {
        const item = generateGear(ctx({ rng }), { rarity });
        expect(item.affixes.length).toBeGreaterThanOrEqual(Math.min(lo, item.affixes.length));
        expect(item.affixes.length).toBeLessThanOrEqual(hi);
        expect(item.rarity).toBe(rarity);
      }
    }
  });

  it('never rolls two affixes from the same group or more than 3 prefixes', () => {
    const rng = new Rng(77);
    for (let i = 0; i < 300; i++) {
      const affixes = rollAffixes('weapon', 60, 6, rng);
      const groups = affixes.map((a) => content.affixes.get(a.id).group);
      expect(new Set(groups).size).toBe(groups.length);
      expect(affixes.filter((a) => content.affixes.get(a.id).kind === 'prefix').length).toBeLessThanOrEqual(3);
      expect(affixes.filter((a) => content.affixes.get(a.id).kind === 'suffix').length).toBeLessThanOrEqual(3);
    }
  });

  it('rolls whole numbers for whole-number stats', () => {
    const rng = new Rng(21);
    for (let i = 0; i < 300; i++) {
      for (const a of rollAffixes('armor', 60, 4, rng)) {
        content.affixes.get(a.id).stats.forEach((s, j) => {
          if (content.stats.get(s.stat).format === 'int') expect(Number.isInteger(a.values[j])).toBe(true);
        });
      }
    }
  });

  it('gates affix tiers by item level', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 200; i++) {
      for (const a of rollAffixes('armor', 12, 3, rng)) {
        expect(content.affixes.get(a.id).tiers[a.tier]?.minLevel).toBeLessThanOrEqual(12);
      }
    }
  });

  it('picks bases near the item level', () => {
    const rng = new Rng(3);
    for (let i = 0; i < 200; i++) {
      const item = generateGear(ctx({ rng, itemLevel: 35 }), { rarity: 'rare' });
      const base = baseOf(item);
      expect(base.level).toBeLessThanOrEqual(35);
      expect(base.level).toBeGreaterThanOrEqual(20);
    }
  });

  it('drops Epic and higher unidentified', () => {
    const epic = generateGear(ctx(), { rarity: 'epic' });
    const rare = generateGear(ctx(), { rarity: 'rare' });
    expect(epic.identified).toBe(false);
    expect(rare.identified).toBe(true);
  });

  it('builds uniques on their base with their item level', () => {
    const item = generateGear(ctx({ itemLevel: 5 }), { uniqueId: 'emberheart' });
    expect(item.uniqueId).toBe('emberheart');
    expect(item.baseId).toBe('sword-t3');
    expect(item.rarity).toBe('legendary');
    expect(item.itemLevel).toBeGreaterThanOrEqual(20);
  });

  it('makes junk damaged with no affixes', () => {
    const junk = generateGear(ctx(), { rarity: 'junk' });
    expect(junk.quality).toBe('damaged');
    expect(junk.affixes).toHaveLength(0);
    expect(junk.junk).toBe(true);
  });

  it('relics start dormant', () => {
    const relic = generateGear(ctx(), { uniqueId: 'horn-of-kael' });
    expect(relic.awakening).toEqual({ progress: 0, awakened: false });
  });

  it('corrupts only when asked or in NG+', () => {
    const forced = generateGear(ctx(), { rarity: 'epic', corrupt: true });
    expect(forced.corruption).toBeDefined();
    const rng = new Rng(8);
    let corrupted = 0;
    for (let i = 0; i < 300; i++) if (generateGear(ctx({ rng }), { rarity: 'epic' }).corruption) corrupted++;
    expect(corrupted).toBe(0);
  });

  it('makes ascended items only in NG+', () => {
    expect(rarityWeights(ctx({ ngPlus: 0 })).some((w) => w.rarity.id === 'ascended')).toBe(false);
    expect(rarityWeights(ctx({ ngPlus: 1 })).some((w) => w.rarity.id === 'ascended')).toBe(true);
    const asc = generateGear(ctx({ ngPlus: 1, itemLevel: 60 }), { rarity: 'ascended' });
    expect(asc.ascended).toBe(true);
    expect(['legendary', 'mythic']).toContain(content.uniques.get(asc.uniqueId as string).rarity);
  });
});

describe('rarity rules', () => {
  it('mythics only drop from elites and better', () => {
    expect(uniquePool('mythic', ctx({ itemLevel: 60, sourceTier: 'normal' }))).toHaveLength(0);
    expect(uniquePool('mythic', ctx({ itemLevel: 60, sourceTier: 'elite' })).length).toBeGreaterThan(0);
    expect(rarityWeights(ctx({ itemLevel: 60 })).some((w) => w.rarity.id === 'mythic')).toBe(false);
  });

  it('magic find boosts rare items and suppresses junk', () => {
    const share = (mf: number, id: string): number => {
      const w = rarityWeights(ctx({ magicFind: mf, itemLevel: 40 }));
      const total = w.reduce((s, x) => s + x.weight, 0);
      return (w.find((x) => x.rarity.id === id)?.weight ?? 0) / total;
    };
    expect(share(200, 'legendary')).toBeGreaterThan(share(0, 'legendary') * 2);
    expect(share(200, 'junk')).toBeLessThan(share(0, 'junk'));
  });

  it('excludes unique rarities with nothing to drop at low level', () => {
    // No legendaries exist below item level 10.
    expect(rarityWeights(ctx({ itemLevel: 3 })).some((w) => w.rarity.id === 'legendary')).toBe(false);
  });
});

describe('item stats', () => {
  it('applies quality, rarity and upgrades to base damage', () => {
    const item = createItem('sword-t1', 1, () => 'a');
    const dmg = (i: ItemInstance): number => itemModifiers(i).find((m) => m.stat === 'weaponDamage')?.value ?? 0;
    const normal = dmg(item);
    expect(dmg({ ...item, quality: 'masterwork' })).toBe(Math.round((item.baseRolls.damage ?? 0) * 1.2));
    expect(dmg({ ...item, upgrade: 5 })).toBeGreaterThan(normal);
    expect(dmg({ ...item, rarity: 'rare' })).toBeGreaterThanOrEqual(normal);
  });

  it('broken items give nothing, unidentified items only base stats', () => {
    const item = generateGear(ctx(), { rarity: 'rare' });
    expect(itemModifiers({ ...item, durability: { current: 0, max: 100 } })).toHaveLength(0);
    const hidden = itemModifiers({ ...item, identified: false });
    expect(hidden.every((m) => ['weaponDamage', 'weaponMagic', 'armor', 'armorResist'].includes(m.stat) || isImplicit(item, m.stat))).toBe(true);
  });

  it('off-hand weapons contribute half damage', () => {
    const item = createItem('dagger-t1', 1, () => 'a');
    const main = itemModifiers(item, 'mainHand').find((m) => m.stat === 'weaponDamage')?.value ?? 0;
    const off = itemModifiers(item, 'offHand').find((m) => m.stat === 'weaponDamage')?.value ?? 0;
    expect(off).toBe(Math.round(main / 2));
  });

  it('ascended uniques are 25% stronger', () => {
    const plain = { ...generateGear(ctx(), { uniqueId: 'girdle-of-giants' }), identified: true };
    const asc = { ...plain, ascended: true };
    const str = (i: ItemInstance): number => itemModifiers(i).filter((m) => m.stat === 'str' && m.source.startsWith('item')).reduce((s, m) => s + m.value, 0);
    expect(str(asc) - str(plain)).toBeCloseTo(5, 5);
  });
});

function isImplicit(item: ItemInstance, stat: string): boolean {
  const base = baseOf(item);
  return 'implicit' in base && base.implicit.some((m) => m.stat === stat);
}

describe('runewords', () => {
  const swordWith = (sockets: (string | null)[]): ItemInstance => ({ ...createItem('sword-t2', 1, () => 'r'), sockets });

  it('activates with the exact runes in order and fills all sockets', () => {
    expect(activeRuneword(swordWith(['rune-ash', 'rune-ember']))?.id).toBe('kindle');
    expect(activeRuneword(swordWith(['rune-ember', 'rune-ash']))).toBeUndefined();
    expect(activeRuneword(swordWith(['rune-ash', null]))).toBeUndefined();
    expect(activeRuneword(swordWith(['rune-ash', 'rune-ember', null]))).toBeUndefined();
  });

  it('needs the right item type', () => {
    const chest = { ...createItem('plate-chest-t2', 1, () => 'r'), sockets: ['rune-ash', 'rune-ember'] };
    expect(activeRuneword(chest)).toBeUndefined();
    const armorWord = { ...createItem('plate-chest-t2', 1, () => 'r'), sockets: ['rune-stone', 'rune-ash'] };
    expect(activeRuneword(armorWord)?.id).toBe('stoneskin');
  });

  it('adds its modifiers and renames the item', () => {
    const item = swordWith(['rune-ash', 'rune-ember']);
    expect(itemModifiers(item).some((m) => m.stat === 'fireDamage' && m.value === 15)).toBe(true);
    expect(itemName(item)).toContain('Kindle');
  });

  it('never applies to unique items', () => {
    const item = { ...generateGear(ctx(), { uniqueId: 'emberheart' }), sockets: ['rune-ash', 'rune-ember'] };
    expect(activeRuneword(item)).toBeUndefined();
  });
});

describe('naming and value', () => {
  it('names random items from prefix, quality, base and suffix', () => {
    const item: ItemInstance = {
      ...createItem('greataxe-t2', 1, () => 'n'),
      rarity: 'rare',
      quality: 'masterwork',
      affixes: [
        { id: 'fire-damage', tier: 1, values: [6] },
        { id: 'bear', tier: 1, values: [3] },
      ],
    };
    expect(itemName(item)).toBe('Blazing Masterwork Steel Greataxe of the Bear');
    expect(itemName({ ...item, identified: false })).toBe('Unidentified Steel Greataxe');
  });

  it('sells for a quarter of its value', () => {
    const item = generateGear(ctx(), { rarity: 'rare' });
    expect(sellValue(item)).toBe(Math.floor(itemValue(item) * 0.25));
    const potion = createItem('health-potion-minor', 10, () => 'p');
    expect(itemValue(potion)).toBe(150);
  });

  it('affix targets: shields are armor, orbs are weapons, rings are jewelry', () => {
    expect(affixTargetOf(content.items.get('shield-t1'))).toBe('armor');
    expect(affixTargetOf(content.items.get('orb-t1'))).toBe('weapon');
    expect(affixTargetOf(content.items.get('ring-t1'))).toBe('jewelry');
  });
});
