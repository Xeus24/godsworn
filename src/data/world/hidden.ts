import type { LoreDef } from '../../engine/world/types';

/**
 * The world's secrets for the six hidden classes: clue pages tucked into the zones (read in the Codex),
 * and the four elder drakes, who only show themselves to a hero who has read their page.
 */
const crimson = (n: number, zone: string, title: string, text: string): LoreDef => ({ id: `crimson-page-${n}`, zone, title: `Crimson Page ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n - 1]}: ${title}`, text });

export const HIDDEN_LORE: LoreDef[] = [
  crimson(1, 'meadowlands', 'The Shape of a Pulse', 'Blood is not a liquid. It is a promise the body makes to itself, again and again, until it forgets how not to. (Six more pages. A library has a missing wing.)'),
  crimson(2, 'whisperwood', 'What the Roots Drink', 'The Wardens never asked why the old oaks were so red in autumn. They were told it was the light. It was the light, in a sense.'),
  crimson(3, 'sunken-caves', 'A Tide That Chose', 'Every drowned sailor in the grotto is missing exactly the same amount of blood. Someone is tidy. Someone is very tidy.'),
  crimson(4, 'ashen-desert', 'The Sun-King’s Physician', 'He did not die because the physicians bled him every dawn into a golden bowl. He died because someone drank the bowl.'),
  crimson(5, 'frostspire', 'Frost Does Not Spoil', 'The Queen kept her blood cold so it would never clot. The ice of her palace was never ice.'),
  crimson(6, 'stormcoast', 'Salt in the Wound', 'A sailor’s cut heals faster in seawater, they say. The sea is only being polite, and taking its share.'),
  crimson(7, 'volcanic-rift', 'The Forge That Wanted More', 'The fallen smiths quenched the blades in blood because water did not remember. The blades remembered everything.'),
  { id: 'lore-thief-primer', zone: 'sunken-caves', title: 'A Thief’s Primer', text: 'Rule one: take nothing that does not want to be taken. Rule two: everything wants to be taken. Rule three: the Hollow Hand keeps count, and counts to fifty before it speaks to anyone.' },
  { id: 'lore-sleepers-almanac', zone: 'whisperwood', title: 'The Sleeper’s Almanac', text: 'It is said that a sleeper who has lain down in every town’s inn has slept on every bed the world has to offer, and dreams in a language the waking cannot hear.' },
  { id: 'lore-wyrm-ember', zone: 'ashen-desert', title: 'Wyrm-Lore: Ember', text: 'The eldest of the Ember brood sleeps where the world split. It does not wake for knights. It wakes when someone has already beaten three of its siblings, and smells of it.' },
  { id: 'lore-wyrm-frost', zone: 'frostspire', title: 'Wyrm-Lore: Rime', text: 'Rime sleeps under the glacier. To wake it, simply walk on ice with a drake’s name on your tongue.' },
  { id: 'lore-wyrm-storm', zone: 'stormcoast', title: 'Wyrm-Lore: Tempest', text: 'The Tempest drake lives in the eye of the storm that never moves. Fishermen steer for it when they want to die quickly.' },
  { id: 'lore-wyrm-grave', zone: 'dark-citadel', title: 'Wyrm-Lore: Grave', text: 'The last of the four was never a drake. It was a king, who made a bargain. The citadel has a cellar where it keeps that bargain, folded small.' },
  { id: 'lore-playbill', zone: 'ashen-desert', title: 'A Playbill, Undated', text: 'THE CLOCKWORK THEATRE presents: THE LAST PUPPET, a play in five tableaux. No audience. No intermission. The management accepts no responsibility for the strings.' },
  { id: 'lore-riddle-crown', zone: 'dark-citadel', title: 'On the Riddle Crown', text: 'He who has never fallen may wear it. He who answers the three questions may keep it. He who does neither becomes the fourth question.' },
];

export interface SecretBoss {
  id: string;
  zone: string;
  enemy: string;
  /** Lore page the hero must have read before the lair shows. */
  requires: string;
}

export const SECRET_BOSSES: SecretBoss[] = [
  { id: 'ember-drake', zone: 'volcanic-rift', enemy: 'elder-drake-ember', requires: 'lore-wyrm-ember' },
  { id: 'frost-drake', zone: 'frostspire', enemy: 'elder-drake-rime', requires: 'lore-wyrm-frost' },
  { id: 'storm-drake', zone: 'stormcoast', enemy: 'elder-drake-tempest', requires: 'lore-wyrm-storm' },
  { id: 'grave-drake', zone: 'dark-citadel', enemy: 'elder-drake-grave', requires: 'lore-wyrm-grave' },
];
