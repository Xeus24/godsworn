import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';

/** A piece of furniture for one room of the house. Owned pieces add a small bonus; each room holds only so many. */
export interface FurnitureDef {
  id: string;
  name: string;
  room: string;
  price: number;
  description: string;
  modifiers: ModifierSpec[];
}

type Theme = [StatId, number, 'p'?];

/** Per room: twenty names, and the bonuses they cycle through. */
const ROOMS: Record<string, { names: string[]; themes: Theme[] }> = {
  bedroom: {
    names: ['Feather Bed', 'Patchwork Quilt', 'Cedar Wardrobe', 'Bedside Candle', 'Warming Pan', 'Woven Rug', 'Lavender Pillow', 'Oak Chest', 'Dream Catcher', 'Window Seat', 'Down Comforter', 'Night Table', 'Brass Lamp', 'Sleeping Cat Cushion', 'Moonlit Curtains', 'Carved Headboard', 'Trundle Bed', 'Silk Canopy', 'Hearth Slippers', 'Lullaby Music Box'],
    themes: [['hpRegen', 1], ['maxHp', 1, 'p'], ['statusResist', 2], ['mpRegen', 1]],
  },
  forge: {
    names: ['Iron Anvil', 'Quenching Trough', 'Bellows', 'Tong Rack', 'Hammer Wall', 'Coal Bin', 'Grindstone', 'Bench Vise', 'Apprentice’s Stool', 'Smith’s Apron', 'Brass Gauge', 'Ingot Mold Set', 'Heat Lamp', 'Slag Bucket', 'Chimney Hood', 'Tuyere Pipes', 'Swage Block', 'Maker’s Mark Plaque', 'Cooling Rack', 'Forge-Cat’s Bed'],
    themes: [['defense', 1, 'p'], ['physicalAttack', 1, 'p'], ['fireResist', 2], ['armor', 2]],
  },
  'alchemy-lab': {
    names: ['Distilling Coil', 'Glass Alembic', 'Herb Drying Rack', 'Mortar and Pestle', 'Reagent Shelf', 'Copper Cauldron', 'Bubbling Retort', 'Spice Cabinet', 'Scale and Weights', 'Label Press', 'Bottle Wall', 'Ceramic Jars', 'Steam Vent', 'Sample Case', 'Stirring Rods', 'Recipe Lectern', 'Tincture Press', 'Funnel Set', 'Apothecary Drawers', 'Cat-Proof Cabinet'],
    themes: [['healingPower', 1], ['maxMp', 1, 'p'], ['statusChance', 1], ['natureDamage', 1]],
  },
  'shrine-room': {
    names: ['Prayer Mat', 'Incense Burner', 'Carved Altar', 'Votive Candles', 'Offering Bowl', 'Holy Symbol', 'Chime Set', 'Pilgrim’s Staff Rack', 'Stained Window', 'Scripture Stand', 'Kneeling Bench', 'Bell Cord', 'Reliquary Niche', 'Silk Banner', 'Water Basin', 'Saints’ Icons', 'Pillar Candle', 'Sunstone Dish', 'Quiet Fountain', 'Gilded Tablet'],
    themes: [['favorGain', 1], ['blessingPower', 2], ['holyResist', 2], ['divinePower', 1, 'p']],
  },
  'trophy-room': {
    names: ['Mounted Antlers', 'Boss Skull Plinth', 'Banner Rack', 'Display Shield', 'Crossed Swords', 'Glass Case', 'Hero’s Portrait', 'Victory Wreath', 'Map Table', 'Hunter’s Rug', 'Trophy Ledger', 'Laurel Crown Stand', 'Tapestry of Deeds', 'Dragon Scale Mount', 'Medal Frame', 'Spoils Chest', 'Standard Pole', 'Mantel Clock', 'Hall of Names', 'Stuffed Griffon'],
    themes: [['damageBonus', 1], ['critDamage', 3], ['xpGain', 2], ['accuracy', 2]],
  },
  vault: {
    names: ['Iron Strongbox', 'Coin Scale', 'Ledger Desk', 'Gem Tray', 'Locked Cabinet', 'Counting Table', 'Trap Mechanism', 'Wax Seal Press', 'Velvet Display', 'Safe Door', 'Brass Padlocks', 'Coin Rolls Rack', 'Hidden Drawer', 'Abacus', 'Lantern Sconce', 'Deed Box', 'Treasure Map Case', 'Mint Press', 'Guard’s Stool', 'Gilded Cat Statue'],
    themes: [['goldFind', 2], ['magicFind', 2], ['barter', 1], ['luk', 1]],
  },
};

export const FURNITURE: FurnitureDef[] = Object.entries(ROOMS).flatMap(([room, { names, themes }]) =>
  names.map((name, i): FurnitureDef => {
    const [stat, base, p] = themes[i % themes.length] as Theme;
    const value = base * (1 + Math.floor(i / themes.length) * 0.5);
    return {
      id: `${room}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`,
      name, room, price: 150 + i * 90,
      description: `${value >= 0 ? '+' : ''}${value}${p || /Resist|Damage|Find|Gain|Chance|Power/.test(stat) ? '%' : ''} ${stat.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
      modifiers: [{ stat, type: p ? 'percent' : 'flat', value }],
    };
  }),
);

/** Pieces a room holds: three, plus three per level of the room. */
export const furnitureCap = (roomLevel: number): number => 3 + 3 * roomLevel;
