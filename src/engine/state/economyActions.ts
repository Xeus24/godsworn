import { hasRule } from '../character/challenges';
import { content } from '../../data';
import { clampVitals, characterStats } from '../character/stats';
import { canCraft, craft, FORGET_COST_PER_LEVEL, forgetProfession, gainProfessionXp, learnProfession, learnRecipe, professionLevel, recipeGold } from '../economy/crafting';
import { addSocket, ascend, ASCEND_COST, canAscend, canUpgrade, modifiable, qualityCost, raiseQuality, rerollAffix, rerollCost, socketCost, upgrade, upgradeCost, type ServiceCost } from '../economy/enchanting';
import { BUYBACK_SIZE, gamble, gamblePrice, GAMBLE_PRICE, sellPrice, shopOpen, shopsIn, shopStock } from '../economy/shops';
import type { CraftingProfession, StockLine } from '../economy/types';
import { equippedItems } from '../items/equipment';
import { addItem, canAdd, countHeld, takeHeld, takeQuantity } from '../items/inventory';
import { baseOf } from '../items/lookup';
import { itemName } from '../items/naming';
import type { ItemInstance } from '../items/types';
import { repairCost, repairItem } from '../items/upkeep';
import type { ItemLocation } from './itemActions';
import type { GameSession } from './gameState';

export type EconomyResult = { ok: true; message?: string } | { ok: false; reason: string };
const fail = (reason: string): EconomyResult => ({ ok: false, reason });

/** Shops, selling, repairs, gambling, crafting and gear services on a running game. */
export class EconomyActions {
  constructor(private readonly s: GameSession) {}

  private get p() {
    return this.s.player;
  }

  private changed(reason: string): void {
    clampVitals(this.p);
    this.s.bus.emit('stateChanged', { reason });
  }

  private town(): string | undefined {
    return this.s.world.inTown();
  }

  private night(): boolean {
    return this.s.timeOfDay === 'night';
  }

  /** Today's stock of a shop in the current town, minus what you already bought. */
  stock(shopId: string): (StockLine & { line: number })[] {
    const town = this.town();
    if (!town) return [];
    const shop = content.shops.get(shopId);
    const key = `${town}:${shopId}`;
    const day = this.s.state.clock.day;
    const bought = this.s.state.economy.bought[key];
    const taken = bought && bought.day === day ? bought.lines : [];
    return shopStock(shop, town, day, this.p, this.s.state.ngPlus).map((l, line) => ({ ...l, line })).filter((l) => !taken.includes(l.line));
  }

  shops() {
    const town = this.town();
    return town ? shopsIn(town).map((shop) => ({ shop, open: shopOpen(shop, town, this.p, this.night(), content, this.s.state.clock.day) })) : [];
  }

  buy(shopId: string, line: number): EconomyResult {
    if (hasRule(this.p, 'noShopping')) return fail('Ironman: no merchant will sell to you.');
    const town = this.town();
    if (!town) return fail('Shops are in towns.');
    const shop = content.shops.get(shopId);
    const open = shopOpen(shop, town, this.p, this.night(), content, this.s.state.clock.day);
    if (!open.ok) return open;
    const entry = this.stock(shopId).find((l) => l.line === line);
    if (!entry) return fail('Sold out.');
    const item: ItemInstance = { ...entry.item, uid: this.s.newUid() };
    if (!canAdd(this.s.state.inventory, item)) return fail('Your bags are full.');
    if (!this.s.spendGold(entry.price, 'shop')) return fail(`Costs ${entry.price} gold.`);
    addItem(this.s.state.inventory, item);
    const key = `${town}:${shopId}`;
    const day = this.s.state.clock.day;
    const bought = this.s.state.economy.bought[key];
    this.s.state.economy.bought[key] = { day, lines: [...(bought && bought.day === day ? bought.lines : []), line] };
    this.changed('buy');
    return { ok: true, message: `Bought ${itemName(item)}.` };
  }

  /** Sells an inventory slot (or the whole stack) to the market; it goes on the buyback list. */
  sell(index: number): EconomyResult {
    if (!this.town()) return fail('Shops are in towns.');
    const item = this.s.state.inventory.slots[index];
    if (!item) return fail('Nothing to sell.');
    if (content.items.get(item.baseId).category === 'quest') return fail('You need that for a quest.');
    if (item.locked) return fail('Unlock it first.');
    let price = sellPrice(item, this.p);
    // The Collector pays well for curiosities on the days they are in town.
    const town = this.town();
    const collector = town ? shopsIn(town).find((sh) => sh.curiosityMult && shopOpen(sh, town, this.p, this.night(), content, this.s.state.clock.day).ok) : undefined;
    if (collector?.curiosityMult && content.items.get(item.baseId).category === 'curiosity') price = Math.round(price * collector.curiosityMult);
    this.s.state.inventory.slots[index] = null;
    this.s.addGold(price, 'sell');
    this.s.state.economy.buyback = [{ item, price }, ...this.s.state.economy.buyback].slice(0, BUYBACK_SIZE);
    this.changed('sell');
    return { ok: true, message: `Sold ${itemName(item)} for ${price} gold.` };
  }

  /** Sells everything marked junk (and Junk-rarity gear). */
  sellJunk(): EconomyResult {
    if (!this.town()) return fail('Shops are in towns.');
    let total = 0;
    let count = 0;
    this.s.state.inventory.slots.forEach((item, i) => {
      if (!item || item.locked || !(item.junk || item.rarity === 'junk')) return;
      const r = this.sell(i);
      if (r.ok) {
        total += sellPrice(item, this.p);
        count++;
      }
    });
    if (count === 0) return fail('Nothing marked as junk.');
    return { ok: true, message: `Sold ${count} junk item${count > 1 ? 's' : ''} for ${total} gold.` };
  }

  buyBack(index: number): EconomyResult {
    if (hasRule(this.p, 'noShopping')) return fail('Ironman: no merchant will sell to you.');
    const entry = this.s.state.economy.buyback[index];
    if (!entry) return fail('Nothing there.');
    if (!canAdd(this.s.state.inventory, entry.item)) return fail('Your bags are full.');
    if (!this.s.spendGold(entry.price, 'buyback')) return fail(`Costs ${entry.price} gold.`);
    addItem(this.s.state.inventory, entry.item);
    this.s.state.economy.buyback.splice(index, 1);
    this.changed('buyback');
    return { ok: true };
  }

  /** Total to repair everything you wear. */
  repairAllCost(): number {
    return equippedItems(this.p).reduce((sum, [, item]) => sum + repairCost(item), 0);
  }

  repairAll(): EconomyResult {
    if (!this.town()) return fail('The blacksmith is in town.');
    const cost = this.repairAllCost();
    if (cost === 0) return fail('Nothing needs repair.');
    if (!this.s.spendGold(cost, 'repair')) return fail(`Repairs cost ${cost} gold.`);
    for (const [, item] of equippedItems(this.p)) repairItem(item);
    this.changed('repair');
    return { ok: true, message: `Repaired for ${cost} gold.` };
  }

  gamble(category: keyof typeof GAMBLE_PRICE): EconomyResult {
    if (hasRule(this.p, 'noShopping')) return fail('Ironman: no merchant will sell to you.');
    const town = this.town();
    if (!town || !shopsIn(town).some((s) => s.kind === 'gambler')) return fail('There is no gambler here.');
    const price = gamblePrice(category, this.p);
    const item = gamble(category, this.p, this.s.rng, () => this.s.newUid(), characterStats(this.p).magicFind, this.s.state.ngPlus);
    if (!canAdd(this.s.state.inventory, item)) return fail('Your bags are full.');
    if (!this.s.spendGold(price, 'gamble')) return fail(`Costs ${price} gold.`);
    addItem(this.s.state.inventory, item);
    this.s.devotion.deed('gamble');
    this.changed('gamble');
    return { ok: true, message: `You buy a mystery ${category}. Identify it to see what you got!` };
  }

  // ------------------------------------------------------------ professions and recipes

  learnProfession(id: CraftingProfession): EconomyResult {
    if (!this.town()) return fail('Find a trainer in town.');
    const r = learnProfession(this.p, id);
    if (r.ok) this.changed('profession');
    return r.ok ? { ok: true, message: `You take up ${content.professions.get(id).name}.` } : r;
  }

  forgetCost(id: CraftingProfession): number {
    return FORGET_COST_PER_LEVEL * professionLevel(this.p, id);
  }

  forgetProfession(id: CraftingProfession): EconomyResult {
    if (!this.town()) return fail('Find a trainer in town.');
    const cost = this.forgetCost(id);
    if (this.s.state.gold < cost) return fail(`Costs ${cost} gold.`);
    const r = forgetProfession(this.p, id);
    if (!r.ok) return r;
    this.s.spendGold(cost, 'profession');
    this.changed('profession');
    return { ok: true };
  }

  /** Reads a recipe scroll from the inventory. */
  readRecipe(index: number): EconomyResult {
    const item = this.s.state.inventory.slots[index];
    const base = item ? baseOf(item) : undefined;
    if (!item || base?.category !== 'recipe') return fail('That is not a recipe.');
    const r = learnRecipe(this.p, base.teaches);
    if (!r.ok) return r;
    takeQuantity(this.s.state.inventory, item.baseId, 1);
    this.s.bus.emit('toast', { kind: 'level', text: `Recipe learned: ${content.recipes.get(base.teaches).name}` });
    this.changed('recipe');
    return { ok: true };
  }

  craft(recipeId: string, baseId?: string): EconomyResult {
    const r = content.recipes.get(recipeId);
    const check = canCraft(this.p, this.s.state, this.s.state.gold, r);
    if (!check.ok) return check;
    const gold = recipeGold(this.p, r);
    const result = craft(this.p, this.s.state, r, this.s.rng, () => this.s.newUid(), baseId);
    if (!result.ok) return result;
    this.s.spendGold(gold, 'craft');
    const up = gainProfessionXp(this.p, r.profession, r.xp);
    if (up) this.s.bus.emit('toast', { kind: 'level', text: `${content.professions.get(r.profession).name} rises to ${up}.` });
    this.s.devotion.deed('craft');
    this.changed('craft');
    return { ok: true, message: `Made ${result.made.map((m) => `${m.quantity > 1 ? `${m.quantity}× ` : ''}${itemName(m)}`).join(', ')}.` };
  }

  // ------------------------------------------------------------ gear services (in town)

  private pay(cost: ServiceCost): EconomyResult {
    if (!this.town()) return fail('The workshop is in town.');
    for (const m of cost.materials) if (countHeld(this.s.state, m.itemId) < m.qty) return fail(`Needs ${m.qty} ${content.items.get(m.itemId).name}.`);
    if (!this.s.spendGold(cost.gold, 'workshop')) return fail(`Costs ${cost.gold} gold.`);
    for (const m of cost.materials) takeHeld(this.s.state, m.itemId, m.qty);
    return { ok: true };
  }

  upgrade(loc: ItemLocation): EconomyResult {
    const item = this.s.items.itemAt(loc);
    if (!item) return fail('Nothing there.');
    const check = canUpgrade(item);
    if (!check.ok) return check;
    const paid = this.pay(upgradeCost(this.p, item));
    if (!paid.ok) return paid;
    const outcome = upgrade(this.p, item, this.s.rng);
    gainProfessionXp(this.p, 'enchanting', 5);
    this.s.devotion.deed('socket');
    this.changed('upgrade');
    if (outcome === 'success') return { ok: true, message: `Success! ${itemName(item)} is now +${item.upgrade}.` };
    return { ok: true, message: outcome === 'downgrade' ? `The enchantment backfires: ${itemName(item)} drops to +${item.upgrade}.` : 'The enchantment fizzles. Nothing is lost but the materials.' };
  }

  reroll(loc: ItemLocation, affixIndex: number): EconomyResult {
    const item = this.s.items.itemAt(loc);
    if (!item) return fail('Nothing there.');
    const check = modifiable(item);
    if (!check.ok) return check;
    if (!item.affixes[affixIndex]) return fail('No such affix.');
    const paid = this.pay(rerollCost(this.p, item));
    if (!paid.ok) return paid;
    const r = rerollAffix(item, affixIndex, this.s.rng);
    if (!r.ok) return r;
    gainProfessionXp(this.p, 'enchanting', 4);
    this.changed('reroll');
    return { ok: true, message: 'The affix shifts into something new.' };
  }

  addSocket(loc: ItemLocation): EconomyResult {
    const item = this.s.items.itemAt(loc);
    if (!item) return fail('Nothing there.');
    const probe = { ...item, sockets: [...item.sockets] };
    const check = addSocket(probe);
    if (!check.ok) return check;
    const paid = this.pay(socketCost(this.p, item));
    if (!paid.ok) return paid;
    addSocket(item);
    gainProfessionXp(this.p, 'jewelcrafting', 6);
    this.changed('socket');
    return { ok: true, message: `${itemName(item)} gains a socket.` };
  }

  raiseQuality(loc: ItemLocation): EconomyResult {
    const item = this.s.items.itemAt(loc);
    if (!item) return fail('Nothing there.');
    const probe = { ...item };
    const check = raiseQuality(probe);
    if (!check.ok) return check;
    const paid = this.pay(qualityCost(this.p, item));
    if (!paid.ok) return paid;
    raiseQuality(item);
    gainProfessionXp(this.p, 'blacksmithing', 6);
    this.changed('quality');
    return { ok: true, message: `${itemName(item)} is now ${content.qualities.get(item.quality).name}.` };
  }

  ascend(loc: ItemLocation): EconomyResult {
    const item = this.s.items.itemAt(loc);
    if (!item) return fail('Nothing there.');
    const check = canAscend(item, this.s.state.ngPlus);
    if (!check.ok) return check;
    const paid = this.pay(ASCEND_COST);
    if (!paid.ok) return paid;
    ascend(item, this.s.state.ngPlus);
    this.changed('ascend');
    return { ok: true, message: `${itemName(item)} ascends!` };
  }
}
