import type { ProfessionDef, RecipeDef } from '../../engine/economy/types';

export const PROFESSIONS: ProfessionDef[] = [
  { id: 'blacksmithing', name: 'Blacksmithing', kind: 'crafting', description: 'Forge weapons and armor from ore, hide and cloth. Raises item quality more cheaply.' },
  { id: 'alchemy', name: 'Alchemy', kind: 'crafting', description: 'Brew potions, elixirs and bombs from herbs.' },
  { id: 'cooking', name: 'Cooking', kind: 'crafting', description: 'Cook hearty food from fish, herbs and hunted game.' },
  { id: 'enchanting', name: 'Enchanting', kind: 'crafting', description: 'Better odds and prices on upgrades and affix rerolls; refine essences.' },
  { id: 'jewelcrafting', name: 'Jewelcrafting', kind: 'crafting', description: 'Cut gems into finer grades, make rings, amulets and earrings, and add sockets cheaply.' },
  { id: 'mining', name: 'Mining', kind: 'gathering', description: 'Work ore veins in the wild. Higher levels yield more.' },
  { id: 'herbalism', name: 'Herbalism', kind: 'gathering', description: 'Pick herbs from patches in the wild. Higher levels yield more.' },
  { id: 'fishing', name: 'Fishing', kind: 'gathering', description: 'Fish at fishing spots by the water. Higher levels yield more.' },
];

const r = (x: RecipeDef): RecipeDef => x;

const POTION_TIERS = [
  { size: 'minor', level: 1, herb: 'healroot', mana: 'manabloom', extra: undefined, xp: 5 },
  { size: 'lesser', level: 8, herb: 'healroot', mana: 'manabloom', extra: 'fireweed', xp: 8 },
  { size: 'greater', level: 18, herb: 'healroot', mana: 'manabloom', extra: 'frostleaf', xp: 12 },
  { size: 'major', level: 30, herb: 'healroot', mana: 'manabloom', extra: 'sunpetal', xp: 18 },
  { size: 'supreme', level: 42, herb: 'healroot', mana: 'manabloom', extra: 'dreamleaf', xp: 25 },
] as const;

const potions: RecipeDef[] = POTION_TIERS.flatMap((t, i): RecipeDef[] => {
  const inputs = (main: string) => [{ itemId: main, qty: 2 }, ...(t.extra ? [{ itemId: t.extra, qty: 1 }] : [])];
  const name = t.size[0]?.toUpperCase() + t.size.slice(1);
  return [
    r({ id: `brew-health-${t.size}`, name: `${name} Health Potion ×2`, profession: 'alchemy', level: t.level, inputs: inputs(t.herb), output: { kind: 'item', itemId: `health-potion-${t.size}`, qty: 2 }, xp: t.xp, ...(i === 0 ? { starter: true } : {}) }),
    r({ id: `brew-mana-${t.size}`, name: `${name} Mana Potion ×2`, profession: 'alchemy', level: t.level, inputs: inputs(t.mana), output: { kind: 'item', itemId: `mana-potion-${t.size}`, qty: 2 }, xp: t.xp, ...(i === 0 ? { starter: true } : {}) }),
  ];
});

const GEM_TYPES = ['ruby', 'sapphire', 'topaz', 'emerald', 'diamond', 'amethyst', 'onyx'];
const GEM_GRADES = ['Chipped', 'Flawed', 'Clear', 'Flawless', 'Perfect'];

/** Three gems of a grade cut into one of the next. */
const gemCutting: RecipeDef[] = GEM_TYPES.flatMap((type) =>
  [1, 2, 3, 4].map((grade) =>
    r({
      id: `cut-${type}-${grade + 1}`,
      name: `${GEM_GRADES[grade]} ${type[0]?.toUpperCase()}${type.slice(1)}`,
      profession: 'jewelcrafting',
      level: [1, 10, 22, 35][grade - 1] as number,
      inputs: [{ itemId: `${type}-${grade}`, qty: 3 }],
      gold: [20, 80, 250, 700][grade - 1] as number,
      output: { kind: 'item', itemId: `${type}-${grade + 1}`, qty: 1 },
      xp: [6, 10, 16, 24][grade - 1] as number,
      starter: grade === 1,
    }),
  ),
);

/** Forged gear by tier: the materials follow the tier, the item level follows the forge's tier. */
const FORGE_TIERS = [
  { tier: 1, level: 1, ore: 'iron-ore', hide: 'rough-hide', cloth: 'linen-scrap', essence: 'faint-essence', gold: 20 },
  { tier: 2, level: 8, ore: 'iron-ore', hide: 'rough-hide', cloth: 'linen-scrap', essence: 'faint-essence', gold: 60 },
  { tier: 3, level: 16, ore: 'mithril-ore', hide: 'thick-hide', cloth: 'silk-bolt', essence: 'lesser-essence', gold: 150 },
  { tier: 4, level: 26, ore: 'adamant-ore', hide: 'thick-hide', cloth: 'silk-bolt', essence: 'greater-essence', gold: 400 },
  { tier: 5, level: 36, ore: 'starmetal-ore', hide: 'drake-scale', cloth: 'moonsilk', essence: 'greater-essence', gold: 900 },
  { tier: 6, level: 46, ore: 'starmetal-ore', hide: 'drake-scale', cloth: 'moonsilk', essence: 'radiant-essence', gold: 2000 },
];

const forging: RecipeDef[] = FORGE_TIERS.flatMap((t): RecipeDef[] => [
  r({ id: `forge-weapon-${t.tier}`, name: `Forge a Weapon (tier ${t.tier})`, profession: 'blacksmithing', level: t.level, inputs: [{ itemId: t.ore, qty: 4 + t.tier }, { itemId: 'ashwood-plank', qty: 1 }, { itemId: t.essence, qty: 1 }], gold: t.gold, output: { kind: 'gear', category: 'weapon', tier: t.tier }, xp: 8 + t.tier * 4, starter: t.tier === 1 }),
  r({ id: `forge-armor-${t.tier}`, name: `Forge Armor (tier ${t.tier})`, profession: 'blacksmithing', level: t.level, inputs: [{ itemId: t.ore, qty: 2 + t.tier }, { itemId: t.hide, qty: 2 }, { itemId: t.cloth, qty: 2 }, { itemId: t.essence, qty: 1 }], gold: t.gold, output: { kind: 'gear', category: 'armor', tier: t.tier }, xp: 8 + t.tier * 4, starter: t.tier === 1 }),
  r({ id: `craft-jewelry-${t.tier}`, name: `Craft Jewelry (tier ${t.tier})`, profession: 'jewelcrafting', level: t.level, inputs: [{ itemId: t.ore, qty: 2 + t.tier }, { itemId: t.essence, qty: 2 }], gold: t.gold, output: { kind: 'gear', category: 'accessory', tier: t.tier }, xp: 8 + t.tier * 4, starter: t.tier === 1 }),
]);

const alchemyExtras: RecipeDef[] = [
  r({ id: 'brew-fire-bomb', name: 'Fire Bomb ×2', profession: 'alchemy', level: 3, inputs: [{ itemId: 'fireweed', qty: 2 }, { itemId: 'slime-gel', qty: 1 }], output: { kind: 'item', itemId: 'fire-bomb', qty: 2 }, xp: 6, starter: true }),
  r({ id: 'brew-frost-bomb', name: 'Frost Bomb ×2', profession: 'alchemy', level: 12, inputs: [{ itemId: 'frostleaf', qty: 2 }, { itemId: 'slime-gel', qty: 1 }], output: { kind: 'item', itemId: 'frost-bomb', qty: 2 }, xp: 10 }),
  r({ id: 'brew-holy-water', name: 'Holy Water ×2', profession: 'alchemy', level: 6, inputs: [{ itemId: 'healroot', qty: 1 }, { itemId: 'bone-dust', qty: 2 }], output: { kind: 'item', itemId: 'holy-water', qty: 2 }, xp: 8 }),
  r({ id: 'brew-oil-flask', name: 'Oil Flask ×2', profession: 'alchemy', level: 4, inputs: [{ itemId: 'fireweed', qty: 1 }, { itemId: 'beast-fang', qty: 1 }], output: { kind: 'item', itemId: 'oil-flask', qty: 2 }, xp: 6 }),
  r({ id: 'brew-cleansing-salts', name: 'Cleansing Salts', profession: 'alchemy', level: 10, inputs: [{ itemId: 'frostleaf', qty: 1 }, { itemId: 'faint-essence', qty: 2 }], output: { kind: 'item', itemId: 'cleansing-salts', qty: 1 }, xp: 10 }),
  r({ id: 'brew-elixir-of-might', name: 'Elixir of Might', profession: 'alchemy', level: 15, inputs: [{ itemId: 'fireweed', qty: 2 }, { itemId: 'lesser-essence', qty: 1 }], output: { kind: 'item', itemId: 'elixir-of-might', qty: 1 }, xp: 14 }),
  r({ id: 'brew-elixir-of-the-mind', name: 'Elixir of the Mind', profession: 'alchemy', level: 15, inputs: [{ itemId: 'manabloom', qty: 2 }, { itemId: 'lesser-essence', qty: 1 }], output: { kind: 'item', itemId: 'elixir-of-the-mind', qty: 1 }, xp: 14 }),
  r({ id: 'brew-elixir-of-iron', name: 'Elixir of Iron', profession: 'alchemy', level: 20, inputs: [{ itemId: 'frostleaf', qty: 2 }, { itemId: 'iron-ore', qty: 2 }, { itemId: 'lesser-essence', qty: 1 }], output: { kind: 'item', itemId: 'elixir-of-iron', qty: 1 }, xp: 16 }),
  r({ id: 'brew-elixir-of-fortune', name: 'Elixir of Fortune', profession: 'alchemy', level: 25, inputs: [{ itemId: 'sunpetal', qty: 1 }, { itemId: 'greater-essence', qty: 1 }], output: { kind: 'item', itemId: 'elixir-of-fortune', qty: 1 }, xp: 18 }),
  r({ id: 'brew-elixir-of-wisdom', name: 'Elixir of Wisdom', profession: 'alchemy', level: 25, inputs: [{ itemId: 'dreamleaf', qty: 1 }, { itemId: 'greater-essence', qty: 1 }], output: { kind: 'item', itemId: 'elixir-of-wisdom', qty: 1 }, xp: 18 }),
  r({ id: 'brew-phoenix-feather', name: 'Phoenix Feather', profession: 'alchemy', level: 35, inputs: [{ itemId: 'harpy-feather', qty: 2 }, { itemId: 'sunpetal', qty: 2 }, { itemId: 'radiant-essence', qty: 1 }], output: { kind: 'item', itemId: 'phoenix-feather', qty: 1 }, xp: 30 }),
];

const cooking: RecipeDef[] = [
  r({ id: 'cook-hearty-stew', name: 'Hearty Stew ×2', profession: 'cooking', level: 1, inputs: [{ itemId: 'beast-fang', qty: 1 }, { itemId: 'healroot', qty: 1 }], output: { kind: 'item', itemId: 'hearty-stew', qty: 2 }, xp: 5, starter: true }),
  r({ id: 'cook-honeyed-bread', name: 'Honeyed Bread ×2', profession: 'cooking', level: 3, inputs: [{ itemId: 'manabloom', qty: 2 }], output: { kind: 'item', itemId: 'honeyed-bread', qty: 2 }, xp: 6, starter: true }),
  r({ id: 'cook-spiced-fish', name: 'Spiced Fish ×2', profession: 'cooking', level: 8, inputs: [{ itemId: 'river-trout', qty: 2 }, { itemId: 'fireweed', qty: 1 }], output: { kind: 'item', itemId: 'spiced-fish', qty: 2 }, xp: 9 }),
  r({ id: 'cook-dragon-pepper-roast', name: 'Dragon-Pepper Roast', profession: 'cooking', level: 30, inputs: [{ itemId: 'ember-eel', qty: 1 }, { itemId: 'fireweed', qty: 2 }, { itemId: 'thick-hide', qty: 1 }], output: { kind: 'item', itemId: 'dragon-pepper-roast', qty: 1 }, xp: 22 }),
  r({ id: 'cook-silverfin-platter', name: 'Silverfin Platter ×2', profession: 'cooking', level: 18, inputs: [{ itemId: 'silverfin', qty: 2 }, { itemId: 'frostleaf', qty: 1 }], output: { kind: 'item', itemId: 'silverfin-platter', qty: 2 }, xp: 14 }),
  r({ id: 'cook-feast-of-heroes', name: 'Feast of Heroes', profession: 'cooking', level: 40, inputs: [{ itemId: 'ember-eel', qty: 2 }, { itemId: 'sunpetal', qty: 2 }, { itemId: 'dreamleaf', qty: 1 }], output: { kind: 'item', itemId: 'feast-of-heroes', qty: 1 }, xp: 30 }),
];

/** Three essences refine into one of the next grade. */
const ESSENCES = ['faint-essence', 'lesser-essence', 'greater-essence', 'radiant-essence', 'mythic-essence'];
const refining: RecipeDef[] = ESSENCES.slice(0, -1).map((e, i) =>
  r({
    id: `refine-${ESSENCES[i + 1]}`,
    name: `Refine ${(ESSENCES[i + 1] as string).split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')}`,
    profession: 'enchanting',
    level: [1, 12, 25, 40][i] as number,
    inputs: [{ itemId: e, qty: 3 }],
    gold: [10, 50, 200, 800][i] as number,
    output: { kind: 'item', itemId: ESSENCES[i + 1] as string, qty: 1 },
    xp: [5, 10, 18, 28][i] as number,
    starter: i === 0,
  }),
);
const enchantingExtras: RecipeDef[] = [
  r({ id: 'scribe-identify', name: 'Scroll of Identify ×2', profession: 'enchanting', level: 3, inputs: [{ itemId: 'faint-essence', qty: 1 }, { itemId: 'linen-scrap', qty: 1 }], output: { kind: 'item', itemId: 'scroll-of-identify', qty: 2 }, xp: 6, starter: true }),
  r({ id: 'scribe-escape', name: 'Scroll of Escape', profession: 'enchanting', level: 10, inputs: [{ itemId: 'lesser-essence', qty: 1 }, { itemId: 'linen-scrap', qty: 2 }], output: { kind: 'item', itemId: 'scroll-of-escape', qty: 1 }, xp: 10 }),
];

export const RECIPES: RecipeDef[] = [...potions, ...alchemyExtras, ...cooking, ...gemCutting, ...forging, ...refining, ...enchantingExtras];
