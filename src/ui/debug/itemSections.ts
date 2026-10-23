import { content } from '../../data';
import { characterStats } from '../../engine/character/stats';
import { createItem, generateGear } from '../../engine/items/generate';
import { rollLoot } from '../../engine/items/loot';
import { itemName } from '../../engine/items/naming';
import { RARITIES, type RarityId } from '../../engine/items/types';
import { repairItem, wearItemPercent } from '../../engine/items/upkeep';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import { debugButton, type DebugPanel } from './debugPanel';

const noGame = (): HTMLElement => el('p', { class: 'dim' }, 'Start a game first.');

function select(options: [string, string][], value: string): HTMLSelectElement {
  const s = el('select', {});
  for (const [v, label] of options) {
    const o = el('option', { value: v }, label);
    if (v === value) o.selected = true;
    s.append(o);
  }
  return s;
}

/** Item cheats: spawn gear of any rarity, specific uniques, loot rolls, durability. */
export function registerItemSections(panel: DebugPanel, getSession: () => GameSession | undefined): void {
  const state = { rarity: 'legendary', category: 'any', level: '30', unique: '', table: 'boss', tier: 'boss' };

  panel.addSection({
    title: 'Items',
    render: (refresh, log) => {
      const s = getSession();
      if (!s) return noGame();
      const ctx = () => ({
        rng: s.rng,
        itemLevel: Math.max(1, Math.min(80, Math.floor(Number(state.level)) || 1)),
        newUid: () => s.newUid(),
        magicFind: characterStats(s.player).magicFind,
        ngPlus: s.state.ngPlus,
        sourceTier: state.tier,
        favorClassId: s.player.classes[0]?.classId,
      });

      const rarity = select(RARITIES.map((r): [string, string] => [r, content.rarities.get(r).name]), state.rarity);
      rarity.addEventListener('change', () => (state.rarity = rarity.value));
      const category = select([['any', 'any type'], ['weapon', 'weapon'], ['armor', 'armor'], ['accessory', 'accessory']], state.category);
      category.addEventListener('change', () => (state.category = category.value));
      const level = el('input', { type: 'number', class: 'num', min: '1', max: '80', value: state.level, 'aria-label': 'Item level' });
      level.addEventListener('change', () => (state.level = level.value));

      const uniques = select(
        [['', '(pick a unique)'], ...content.uniques.all().map((u): [string, string] => [u.id, `${u.name} (${u.rarity})`])],
        state.unique,
      );
      uniques.addEventListener('change', () => (state.unique = uniques.value));

      const table = select(content.lootTables.all().map((t): [string, string] => [t.id, t.id]), state.table);
      table.addEventListener('change', () => (state.table = table.value));
      const tier = select(content.sourceTiers.all().map((t): [string, string] => [t.id, t.name]), state.tier);
      tier.addEventListener('change', () => (state.tier = tier.value));

      const give = (fn: () => void) => () => {
        fn();
        refresh();
      };

      return el(
        'div',
        {},
        el('div', { class: 'row' }, rarity, category, el('span', { class: 'dim' }, 'iLvl'), level),
        el(
          'div',
          { class: 'row' },
          debugButton('Give gear', give(() => {
            const item = generateGear(ctx(), {
              rarity: state.rarity as RarityId,
              ...(state.category !== 'any' ? { categories: [state.category as 'weapon'] } : {}),
            });
            s.items.give(item);
            log(`gave ${itemName(item)} [${item.rarity}]`);
          })),
          debugButton('Give 10 random', give(() => {
            for (let i = 0; i < 10; i++) s.items.give(generateGear(ctx()));
            log('gave 10 random items');
          })),
        ),
        el('div', { class: 'row' }, uniques, debugButton('Give unique', give(() => {
          if (!state.unique) return;
          const item = generateGear(ctx(), { uniqueId: state.unique });
          s.items.give(item);
          log(`gave ${itemName(item)}`);
        }))),
        el(
          'div',
          { class: 'row' },
          debugButton('Gems + runes', give(() => {
            for (const id of ['ruby-3', 'sapphire-3', 'diamond-2', 'rune-ash', 'rune-ember', 'rune-stone', 'rune-frost', 'rune-gale']) {
              s.items.give(createItem(id, 2, () => s.newUid(), content), false);
            }
            log('gave gems and runes');
          })),
          debugButton('Consumables', give(() => {
            for (const id of ['health-potion-greater', 'mana-potion-greater', 'scroll-of-identify', 'elixir-of-might', 'hearty-stew', 'tome-of-insight', 'travelers-pack', 'fire-bomb']) {
              s.items.give(createItem(id, 5, () => s.newUid(), content), false);
            }
            log('gave consumables');
          })),
        ),
        el('div', { class: 'row' }, table, tier, debugButton('Roll loot', give(() => {
          const loot = rollLoot(state.table, { ...ctx(), goldFind: characterStats(s.player).goldFind });
          const { kept, salvaged } = s.items.receiveLoot(loot.items, loot.gold);
          log(`loot: ${kept.map((i) => itemName(i)).join(', ') || 'nothing'}; ${loot.gold} gold; ${salvaged} salvaged`);
        }))),
        el(
          'div',
          { class: 'row' },
          debugButton('Wear gear 50%', give(() => {
            for (const it of Object.values(s.player.equipment)) if (it) wearItemPercent(it, 0.5);
            s.bus.emit('stateChanged', { reason: 'debug' });
          })),
          debugButton('Repair all', give(() => {
            for (const it of Object.values(s.player.equipment)) if (it) repairItem(it);
            s.bus.emit('stateChanged', { reason: 'debug' });
          })),
        ),
      );
    },
  });
}
