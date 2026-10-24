import type { LoreDef } from '../../engine/world/types';

/** Lore pages: two per zone, one in plain sight and one behind a cracked wall. */
export const LORE: LoreDef[] = [
  { id: 'lore-first-oath', zone: 'meadowlands', title: 'The First Oath', text: 'Before kings, before roads, the first mortal knelt in a field like this one and swore to a god. The god swore back. That is the part the priests leave out.' },
  { id: 'lore-brightwater', zone: 'meadowlands', title: 'Brightwater Ledger', text: 'Bought: one goat. Sold: one goat, slightly used. Note to self: stop letting adventurers borrow the goat.' },
  { id: 'lore-whisper', zone: 'whisperwood', title: 'What the Trees Say', text: 'If you sleep under the old oaks you hear them talking. Mostly about weather. Sometimes about you.' },
  { id: 'lore-old-battle', zone: 'whisperwood', title: 'Orders, Never Sent', text: 'Hold the line until the sun comes up. If the sun does not come up, hold it anyway. — General Ardath, the night before the crypt was sealed.' },
  { id: 'lore-sunken', zone: 'sunken-caves', title: 'Ship’s Log, Undated', text: 'We sailed into the cave to escape the storm. The cave was very large. The cave was not a cave.' },
  { id: 'lore-crystal', zone: 'sunken-caves', title: 'On Singing Crystal', text: 'The crystals of the Sunken Caves hum when struck. Struck hard enough, they hum back at you, and they are very large.' },
  { id: 'lore-sun-king', zone: 'ashen-desert', title: 'Decree of the Sun-King', text: 'I shall not die. I have forbidden it. My priests assure me the gods agree. (They did not.)' },
  { id: 'lore-sandhaven', zone: 'ashen-desert', title: 'Caravan Rules', text: 'Rule one: water first. Rule two: never follow a mirage. Rule three: if the mirage follows you, run.' },
  { id: 'lore-giants', zone: 'frostspire', title: 'The Giants’ Spire', text: 'The giants built the Spire to reach the gods. When they got there, the gods were out.' },
  { id: 'lore-spire', zone: 'frostspire', title: 'A Scholar’s Last Note', text: 'The Queen’s palace is not made of ice. The ice is made of the palace. I must go back and check.' },
  { id: 'lore-saltmere', zone: 'stormcoast', title: 'Saltmere Harbor Notice', text: 'Smuggling is illegal in Saltmere. Smuggling is also the third largest industry in Saltmere. Please be discreet.' },
  { id: 'lore-leviathan', zone: 'stormcoast', title: 'The Leviathan’s Manifest', text: 'Cargo: one egg, very large, very warm. Destination: anywhere far from here. Handle gently.' },
  { id: 'lore-rift', zone: 'volcanic-rift', title: 'When the World Split', text: 'Two gods argued over who made the mountains. They settled it the way gods do, and the Rift is what was left.' },
  { id: 'lore-forge-gods', zone: 'volcanic-rift', title: 'The Fallen Smiths', text: 'They forged weapons for the gods and asked for one thing in return: to be remembered. This page is all that remembers them.' },
  { id: 'lore-citadel', zone: 'dark-citadel', title: 'Who Built the Citadel?', text: 'Nobody built the Citadel. One morning it was there, and every map in the world had always shown it.' },
  { id: 'lore-unwritten', zone: 'dark-citadel', title: 'The Unwritten', text: 'There was a god before the gods, and they wrote it out of the world. It has been reading over their shoulders ever since.' },
];
