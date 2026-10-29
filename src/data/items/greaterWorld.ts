import type { ConsumableDef } from '../../engine/items/types';

const meter = (id: string, name: string, level: number, value: number, description: string, m: string, amount: number): ConsumableDef => ({
  id, name, category: 'consumable', kind: 'elixir', usableIn: 'field', level, value, stack: 99, description, action: { kind: 'meter', meter: m, amount },
});

/** Relief for the regional meters (see data/world/mechanics.ts). */
export const WORLD_CONSUMABLES: ConsumableDef[] = [
  meter('compass-charm', 'Compass Charm', 5, 40, 'Points the right way: eases 70 Bearings lost in the Whisperwood.', 'bearings', 70),
  meter('torch', 'Torch', 10, 25, 'Pushes back the dark: -60 Darkness in the Sunken Caves.', 'darkness', 60),
  meter('canteen', 'Canteen', 20, 45, 'Cool and clean: -70 Heat in the Ashen Desert.', 'heat', 70),
  meter('hot-cider', 'Hot Cider', 28, 55, 'Spiced and steaming: -70 Cold in the Frostspire.', 'cold', 70),
  meter('safety-lamp', 'Safety Lamp', 38, 80, 'A lamp that burns blue in bad air and clears it: -70 Bad air in Khazrum.', 'badair', 70),
  meter('glow-lantern', 'Glow Lantern', 24, 55, 'A lamp that does not gutter: -60 Gloom in the Gloamwood.', 'gloom', 60),
  meter('glass-lens', 'Glass Lens', 36, 70, 'Looks through lies: -70 Mirage on the Saltglass Flats.', 'mirage', 70),
  meter('air-pearl', 'Air Pearl', 46, 95, 'A pearl that holds a breath: -70 Pressure in Merrowdeep.', 'pressure', 70),
  meter('grave-candle', 'Grave Candle', 30, 60, 'A candle that burns for the dead: -70 Fading in the Hollow Barrows.', 'fading', 70),
  meter('breath-tonic', 'Breath Tonic', 52, 110, 'Fills the lungs with warmth: -70 Thin air in Skyreach.', 'thinair', 70),
  meter('ward-salt', 'Ward Salt', 50, 120, 'A pinch against the Unwritten: -60 Corruption in the Dark Citadel.', 'corruption', 60),
];
