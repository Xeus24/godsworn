import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { canCraft, craftingDiscount, forgeRarity, gainProfessionXp, learnProfession, MAX_PROFESSIONS, professionLevel } from '../src/engine/economy/crafting';
import { addSocket, ascend, canAscend, maxSockets, raiseQuality, rerollAffix, upgrade, UPGRADE_CHANCE, upgradeChance } from '../src/engine/economy/enchanting';
import { buyDiscount, sellPrice, shopOpen, shopsIn, shopStock } from '../src/engine/economy/shops';
import { Rng } from '../src/engine/core/rng';
import { createItem, generateGear } from '../src/engine/items/generate';
import { addItem, countOf } from '../src/engine/items/inventory';
import { itemValue } from '../src/engine/items/itemStats';
import type { ItemInstance } from '../src/engine/items/types';
import { learnGeneral } from '../src/engine/skills/general';
import { GameSession } from '../src/engine/state/gameState';
import { applyRep } from '../src/engine/world/factions';
import { mapFor } from '../src/engine/world/mapgen';
import type { MapEntity } from '../src/engine/world/types';
import { passable } from '../src/engine/world/world';
import { makeHero } from './helpers';

const newSession = (seed = 1, opts: Parameters<typeof makeHero>[0] = {}) => GameSession.newGame(seed, makeHero(opts));
const gear = (rarity: 'rare' | 'legendary' = 'rare', seed = 1): ItemInstance => {
  const item = generateGear({ rng: new Rng(seed), itemLevel: 20, newUid: () => `g${seed}` }, { rarity, categories: ['weapon'] });
  item.identified = true;
  return item;
};
const give = (s: GameSession, id: string, qty: number): void => {
  addItem(s.state.inventory, createItem(id, qty, () => s.newUid()));
};

describe('shops', () => {
  it('every town has the core shops; some have a gambler, a black market or a faction quartermaster', () => {
    const ids = (t: string) => shopsIn(t).map((s) => s.id);
    for (const t of content.towns.ids()) for (const core of ['blacksmith', 'armorer', 'alchemist', 'general', 'magic', 'library', 'temple']) expect(ids(t)).toContain(core);
    expect(ids('saltmere')).toEqual(expect.arrayContaining(['gambler', 'black-market', 'faction']));
    expect(ids('brightwater')).not.toContain('gambler');
  });

  it('stock is the same all day and changes overnight', () => {
    const hero = makeHero();
    const shop = content.shops.get('blacksmith');
    const a = shopStock(shop, 'brightwater', 1, hero, 0).map((l) => l.item.baseId);
    expect(shopStock(shop, 'brightwater', 1, hero, 0).map((l) => l.item.baseId)).toEqual(a);
    expect(shopStock(shop, 'brightwater', 2, hero, 0).map((l) => l.item.baseId)).not.toEqual(a);
  });

  it('buying takes gold, gives the item and removes the line; selling pays a quarter, and you can buy it back', () => {
    const s = newSession();
    s.state.gold = 100000;
    const line = s.economy.stock('blacksmith')[0];
    if (!line) throw new Error('empty shop');
    const gold = s.state.gold;
    expect(s.economy.buy('blacksmith', line.line).ok).toBe(true);
    expect(s.state.gold).toBe(gold - line.price);
    expect(s.economy.stock('blacksmith').some((l) => l.line === line.line)).toBe(false);
    const index = s.state.inventory.slots.findIndex((i) => i?.baseId === line.item.baseId);
    const item = s.state.inventory.slots[index] as ItemInstance;
    const price = sellPrice(item, s.player);
    expect(price).toBe(Math.max(1, Math.floor(itemValue(item) * 0.25)));
    expect(s.economy.sell(index).ok).toBe(true);
    expect(s.state.economy.buyback[0]?.item.uid).toBe(item.uid);
    expect(s.economy.buyBack(0).ok).toBe(true);
    expect(s.state.inventory.slots.some((i) => i?.uid === item.uid)).toBe(true);
  });

  it('only in towns', () => {
    const s = newSession();
    s.state.world.position = { map: 'whisperwood', x: 5, y: 5 };
    expect(s.economy.stock('blacksmith')).toEqual([]);
    expect(s.economy.sell(0).ok).toBe(false);
  });

  it('sell all junk', () => {
    const s = newSession();
    const junk = createItem('slime-gel', 3, () => 'j');
    junk.junk = true;
    addItem(s.state.inventory, junk);
    const gold = s.state.gold;
    expect(s.economy.sellJunk().ok).toBe(true);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(countOf(s.state.inventory, 'slime-gel')).toBe(0);
  });

  it('Haggle, temple favor and faction rank give discounts', () => {
    const hero = makeHero();
    const temple = content.shops.get('temple');
    expect(buyDiscount(temple, 'brightwater', hero)).toBe(0);
    learnGeneral(hero, 'haggle');
    hero.generalSkills.haggle = { rank: 5, xp: 0 };
    expect(buyDiscount(temple, 'brightwater', hero)).toBeCloseTo(0.05);
    hero.devotion.favor.solenne = 600;
    expect(buyDiscount(temple, 'brightwater', hero)).toBeCloseTo(0.15);
    const faction = content.shops.get('faction');
    expect(shopOpen(faction, 'brightwater', hero, false).ok).toBe(false);
    applyRep(hero, { 'order-of-dawn': 800 });
    expect(shopOpen(faction, 'brightwater', hero, false).ok).toBe(true);
    expect(buyDiscount(faction, 'brightwater', hero)).toBeCloseTo(0.1);
  });

  it('the Black Market only trades at night', () => {
    const hero = makeHero();
    const bm = content.shops.get('black-market');
    expect(shopOpen(bm, 'saltmere', hero, false).ok).toBe(false);
    expect(shopOpen(bm, 'saltmere', hero, true).ok).toBe(true);
  });

  it('the Gambler sells unidentified gear of the chosen kind', () => {
    const s = newSession();
    s.state.world.position = (() => {
      const zone = mapFor('stormcoast');
      const gate = zone.entities.find((e) => e.kind === 'town') as MapEntity;
      return { map: 'stormcoast', x: gate.x, y: gate.y };
    })();
    s.state.gold = 10000;
    expect(s.economy.gamble('armor').ok).toBe(true);
    const item = s.state.inventory.slots.filter(Boolean).at(-1) as ItemInstance;
    expect(content.items.get(item.baseId).category).toBe('armor');
    expect(item.identified).toBe(false);
    expect(content.rarities.get(item.rarity).order).toBeGreaterThanOrEqual(content.rarities.get('uncommon').order);
  });

  it('repairs at the blacksmith', () => {
    const s = newSession();
    s.state.gold = 1000;
    const weapon = s.player.equipment.mainHand as ItemInstance;
    if (!weapon.durability) throw new Error('no durability');
    weapon.durability.current = 1;
    expect(s.economy.repairAllCost()).toBeGreaterThan(0);
    expect(s.economy.repairAll().ok).toBe(true);
    expect(weapon.durability.current).toBe(weapon.durability.max);
  });
});

describe('professions', () => {
  it('two crafting professions at a time, with starter recipes', () => {
    const hero = makeHero();
    expect(learnProfession(hero, 'alchemy').ok).toBe(true);
    expect(learnProfession(hero, 'cooking').ok).toBe(true);
    expect(learnProfession(hero, 'enchanting').ok).toBe(false);
    expect(Object.keys(hero.crafting.professions)).toHaveLength(MAX_PROFESSIONS);
    expect(hero.crafting.recipes).toContain('brew-health-minor');
    expect(hero.crafting.recipes).not.toContain('brew-health-lesser');
  });

  it('level up by crafting (10 XP x level)', () => {
    const hero = makeHero();
    learnProfession(hero, 'alchemy');
    expect(gainProfessionXp(hero, 'alchemy', 9)).toBeUndefined();
    expect(gainProfessionXp(hero, 'alchemy', 1)).toBe(2);
    expect(professionLevel(hero, 'alchemy')).toBe(2);
  });

  it('crafting takes the inputs and makes the output', () => {
    const s = newSession();
    s.economy.learnProfession('alchemy');
    const r = content.recipes.get('brew-health-minor');
    expect(canCraft(s.player, s.state.inventory, s.state.gold, r).ok).toBe(false);
    give(s, 'healroot', 2);
    const before = countOf(s.state.inventory, 'health-potion-minor');
    expect(s.economy.craft('brew-health-minor').ok).toBe(true);
    expect(countOf(s.state.inventory, 'healroot')).toBe(0);
    expect(countOf(s.state.inventory, 'health-potion-minor')).toBe(before + 2);
    expect(s.player.crafting.professions.alchemy?.xp).toBeGreaterThan(0);
  });

  it('recipe scrolls teach new recipes; level gates still apply', () => {
    const s = newSession();
    s.economy.learnProfession('alchemy');
    give(s, 'recipe-brew-health-lesser', 1);
    const index = s.state.inventory.slots.findIndex((i) => i?.baseId === 'recipe-brew-health-lesser');
    expect(s.economy.readRecipe(index).ok).toBe(true);
    expect(s.player.crafting.recipes).toContain('brew-health-lesser');
    give(s, 'healroot', 2);
    give(s, 'fireweed', 1);
    expect(canCraft(s.player, s.state.inventory, s.state.gold, content.recipes.get('brew-health-lesser')).ok).toBe(false);
    s.player.crafting.professions.alchemy = { level: 8, xp: 0 };
    expect(s.economy.craft('brew-health-lesser').ok).toBe(true);
  });

  it('blacksmiths forge gear of the chosen base, rarer with skill', () => {
    const s = newSession();
    s.economy.learnProfession('blacksmithing');
    give(s, 'iron-ore', 10);
    give(s, 'ashwood-plank', 2);
    give(s, 'faint-essence', 2);
    s.state.gold = 1000;
    expect(s.economy.craft('forge-weapon-1', 'sword-t1').ok).toBe(true);
    const made = s.state.inventory.slots.filter(Boolean).find((i) => i?.baseId === 'sword-t1' && i.rarity !== 'common');
    expect(made).toBeDefined();
    const rng = new Rng(3);
    const rolls = (lvl: number) => Array.from({ length: 400 }, () => forgeRarity(lvl, rng)).filter((r) => r === 'epic').length;
    expect(rolls(40)).toBeGreaterThan(rolls(1));
  });

  it('the Dwarf crafts for less; professions discount their services', () => {
    expect(craftingDiscount(makeHero({ raceId: 'dwarf' }))).toBeCloseTo(0.15);
    const hero = makeHero();
    learnProfession(hero, 'enchanting');
    hero.crafting.professions.enchanting = { level: 20, xp: 0 };
    expect(craftingDiscount(hero, 'enchanting')).toBeCloseTo(0.12);
  });

  it('gathering nodes give materials, train the skill and refill each day', () => {
    const s = newSession();
    const map = mapFor('meadowlands');
    const node = map.entities.find((e) => e.kind === 'node' && e.gather === 'herbalism') as MapEntity;
    const [dx, dy] = ([[0, 1], [0, -1], [1, 0], [-1, 0]] as const).find(([x, y]) => passable(s.state.world, map, node.x + x, node.y + y)) ?? [0, 1];
    s.state.world.position = { map: map.id, x: node.x + dx, y: node.y + dy };
    const r = s.world.step(-dx, -dy);
    expect(r.kind === 'moved' && r.message).toMatch(/Healroot|Manabloom/);
    expect(s.player.crafting.gathering.herbalism?.xp).toBe(1);
  });
});

describe('gear services', () => {
  it('upgrades always succeed up to +5, then the odds fall', () => {
    expect(UPGRADE_CHANCE.slice(0, 5).every((c) => c === 1)).toBe(true);
    expect(UPGRADE_CHANCE[14]).toBeLessThan(UPGRADE_CHANCE[9] as number);
    const hero = makeHero();
    const item = gear();
    const rng = new Rng(1);
    for (let i = 0; i < 5; i++) expect(upgrade(hero, item, rng)).toBe('success');
    expect(item.upgrade).toBe(5);
  });

  it('failure rates match the table; past +10 a failure drops a level', () => {
    const hero = makeHero();
    const rng = new Rng(7);
    let wins = 0;
    for (let i = 0; i < 2000; i++) {
      const item = gear();
      item.upgrade = 7;
      if (upgrade(hero, item, rng) === 'success') wins++;
    }
    expect(wins / 2000).toBeGreaterThan((UPGRADE_CHANCE[7] as number) - 0.05);
    expect(wins / 2000).toBeLessThan((UPGRADE_CHANCE[7] as number) + 0.05);
    const item = gear();
    item.upgrade = 14;
    let outcome = '';
    for (let i = 0; i < 50 && outcome !== 'downgrade'; i++) {
      item.upgrade = 14;
      outcome = upgrade(hero, item, rng);
    }
    expect(outcome).toBe('downgrade');
    expect(item.upgrade).toBe(13);
  });

  it('Enchanting improves the odds', () => {
    const hero = makeHero();
    const item = gear();
    item.upgrade = 9;
    const base = upgradeChance(hero, item);
    learnProfession(hero, 'enchanting');
    hero.crafting.professions.enchanting = { level: 30, xp: 0 };
    expect(upgradeChance(hero, item)).toBeCloseTo(base + 0.15);
  });

  it('rerolls change one affix, sockets and quality grow, corrupted items refuse', () => {
    const item = gear('rare', 4);
    const before = item.affixes.map((a) => a.id);
    rerollAffix(item, 0, new Rng(9));
    expect(item.affixes.map((a) => a.id).slice(1)).toEqual(before.slice(1));
    item.sockets = [];
    const max = maxSockets(item);
    for (let i = 0; i < max; i++) expect(addSocket(item).ok).toBe(true);
    expect(addSocket(item).ok).toBe(false);
    item.quality = 'damaged';
    raiseQuality(item);
    raiseQuality(item);
    raiseQuality(item);
    expect(item.quality).toBe('masterwork');
    expect(raiseQuality(item).ok).toBe(false);
    item.corruption = { boon: 'x', drawback: 'y' };
    expect(addSocket(item).ok).toBe(false);
  });

  it('ascension needs NG+ and a Legendary or Mythic', () => {
    const legendary = gear('legendary', 2);
    expect(canAscend(legendary, 0).ok).toBe(false);
    expect(canAscend(gear('rare', 2), 1).ok).toBe(false);
    expect(ascend(legendary, 1).ok).toBe(true);
    expect(legendary.rarity).toBe('ascended');
  });

  it('the session charges gold and materials for services', () => {
    const s = newSession();
    const loc = { where: 'equipment' as const, slot: 'mainHand' as const };
    s.state.gold = 0;
    expect(s.economy.upgrade(loc).ok).toBe(false);
    s.state.gold = 100000;
    give(s, 'faint-essence', 5);
    expect(s.economy.upgrade(loc).ok).toBe(true);
    expect(s.player.equipment.mainHand?.upgrade).toBe(1);
    expect(countOf(s.state.inventory, 'faint-essence')).toBe(4);
  });
});
