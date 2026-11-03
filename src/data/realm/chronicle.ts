/**
 * The Chronicle of Ages (Innovation Pack, item 3). Every new save the gods "remember" three hundred years of history that
 * was never written down: wars, heroes, lost artifacts, disasters and foundings. They are made fresh from these tables
 * (`engine/realm/chronicle.ts`) and tied to the real regions, so they turn up as ruins to explore, tales to hear and
 * commissions to take. Reconciliation R18: generated history never touches the fixed story, so none of the tables
 * may name the Unsworn King, Caerith or the Nameless One, or say that a god died.
 */
export const CHRONICLE_YEARS = 300;

export const ERAS = [
  { names: ['The Wandering Age', 'The Age of Roads', 'The Lantern Years'], blurb: 'People moved, settled and moved again, and every road was somebody’s.' },
  { names: ['The Oathkeeping Age', 'The Age of Sworn Hands', 'The Bell Age'], blurb: 'Vows were taken in public and kept in private, and the first temples grew rich.' },
  { names: ['The Crowned Years', 'The Years of Banners', 'The Long Quarrel'], blurb: 'Kings and councils grew, and where they met there was war.' },
  { names: ['The Quiet Decline', 'The Thinning', 'The Years of Closed Doors'], blurb: 'Wealth thinned and old halls emptied. People began to say that something was ending.' },
] as const;

export const GIVEN = [
  'Aldwyn', 'Brisa', 'Corrin', 'Dessa', 'Eadric', 'Fenwick', 'Galina', 'Hamar', 'Isolde', 'Jorrun',
  'Kestrel', 'Lothar', 'Merrin', 'Nessa', 'Oswin', 'Perrin', 'Quenna', 'Rhosyn', 'Sigmar', 'Talwyn',
  'Ulfric', 'Vesna', 'Wulfstan', 'Xandra', 'Yorick', 'Zelda', 'Alder', 'Bram', 'Cora', 'Dunstan',
  'Elspeth', 'Faramond', 'Gwendal', 'Hilde', 'Ivor', 'Jessamine', 'Kolbein', 'Liesl', 'Marcus', 'Nell',
  'Orla', 'Piers', 'Rowan', 'Sabine', 'Torvald', 'Una', 'Viggo', 'Wynne', 'Yvaine', 'Zephyra',
];
export const SURNAMES = [
  'Ashgrove', 'Blackwater', 'Coldharbor', 'Dunmere', 'Everard', 'Fairweather', 'Greymantle', 'Hollowell', 'Ironbridge', 'Kettleby',
  'Longfield', 'Marlowe', 'Northcott', 'Oakenshaw', 'Pennyworth', 'Redfern', 'Stonecrop', 'Thorne', 'Underhill', 'Valewood',
  'Whitlock', 'Yarrow', 'Brightmoor', 'Crowhurst', 'Dewfall', 'Emberly', 'Frostwick', 'Gallowglass', 'Harrowgate', 'Ivywell',
];
export const HOUSES = ['House Marrowick', 'the Order of the Open Hand', 'the Salt Concord', 'the Reed Kings', 'the Tin Guilds', 'the Lantern League', 'House Tolliver', 'the Free Companies of the Weir', 'the Vineyard Lords', 'the Sworn Ferrymen', 'the Cloth Council', 'the Hill Thanes'];
export const PLACE_HEAD = ['Hollow', 'Gilded', 'Weeping', 'Broken', 'Silent', 'Drowned', 'Burnt', 'Forgotten', 'Salt', 'Marrow', 'Thornwall', 'Greywater', 'Candle', 'Ember', 'Veil'];
export const PLACE_TAIL = ['Chapterhouse', 'Bridge', 'Granary', 'Watchtower', 'Abbey', 'Mill', 'Bastion', 'Orchard', 'Cistern', 'Court', 'Forum', 'Shrine', 'Armory', 'Ferry', 'Hall'];
export const ARTIFACT_NOUN = ['Crown', 'Lantern', 'Ledger', 'Chalice', 'Bell', 'Compass', 'Mantle', 'Horn', 'Mirror', 'Spear', 'Signet', 'Hourglass', 'Censer', 'Harp', 'Lamp'];
export const ARTIFACT_ADJ = ['Unsleeping', 'Ninth', 'Patient', 'Borrowed', 'Quiet', 'Greater', 'Mended', 'Open', 'Weeping', 'Last', 'Iron', 'Silver', 'Honest', 'Gentle', 'Thrice-Blessed'];
export const WAR_ADJ = ['Salt', 'Candle', 'Ledger', 'Orchard', 'Seven-Day', 'Bridge', 'Granary', 'Long Winter', 'Wine', 'Tithe'];
export const FOES = ['bandit-kings', 'a swarm of drowned sailors', 'a company of hollow knights', 'a plague of locusts', 'a pack of mad wolves', 'an old and hungry wyrm', 'a mutiny', 'a rival priesthood', 'a flood', 'the winter itself'];

/** Event templates by kind. Slots: {hero} {rival} {house} {house2} {place} {zone} {god} {artifact} {foe} {year}. */
export const TEMPLATES = {
  war: {
    title: ['The {warAdj} War', 'The War of the {place}', 'The {warAdj} Quarrel'],
    text: [
      'In {year} {house} and {house2} went to war over the {place}. It began as a matter of tolls. By the third winter it was a matter of names, and the last battle was fought on the steps of the {place} with the bells still ringing.',
      'The {warAdj} War ran for eleven years in the country around {zone}. {house} won, and was ruined by the winning; {house2} lost, and was remembered as the better of the two. The {place} was left standing, and empty.',
      '{hero} led {house} into the field at the {place}. {rival}, for {house2}, met them there. They say the field was too narrow for the numbers, and that both armies left it smaller.',
      'It was a short war, as wars go: nine days. {house} burned the {place} to deny it to {house2}, and {house2} burned the rest to deny it to the world. {god} was said to have looked away.',
    ],
  },
  hero: {
    title: ['{hero} of {zone}', 'The Oath of {hero}', '{hero} and the Last Road'],
    text: [
      '{hero}, sworn to {god}, walked from {zone} to the {place} carrying a lamp that would not go out. Nobody knows what was on the road. {hero} is said to have returned once, in the third year, and to have said only: “It is not as far as it looks.”',
      'In {year}, {hero} of {zone} took the Godsworn oath at a shrine of {god}. They held the road against {foe} for forty days. On the forty-first the road was empty and {hero} was not on it. A cairn stands there now, with a lamp on top.',
      '{hero} was a tax-collector before the oath, and a poor one. They took the vow of {god} in the rain and made a very good Godsworn. They are remembered at the {place} for a single act: they let the rival, {rival}, go.',
      '{hero} spent a lifetime looking for the {place}, and found it in {year}, and sat down in it, and did not leave. {god} is said to have sent them bread on the feast days. Nobody could say who baked it.',
    ],
  },
  artifact: {
    title: ['The {artifact}', 'The Loss of the {artifact}', 'The Forging of the {artifact}'],
    text: [
      'The {artifact} was made in {year} by {hero}, a smith in the service of {house}, as a gift to {god}. It was carried to the {place} and set on an altar. In the third year the altar was empty, and nobody had touched it.',
      'The {artifact} passed from hand to hand for a century: from {house} to {house2}, from {house2} to the Godsworn, from the Godsworn to a thief. In {year} it was last seen in the {place}, in the possession of someone who said they were only holding it for a friend.',
      '{rival} claimed that the {artifact} spoke. {hero} claimed that it did not. They agreed to settle the matter at the {place}, and neither of them returned. The {artifact} has been missing since, and so, it seems, has the argument.',
      'The {artifact} was buried with {hero} in {year}, at the {place}, with the instruction that it be dug up “when it is needed”. Three diggers have since looked for it. Each has reported that it is a great deal deeper than the grave.',
    ],
  },
  disaster: {
    title: ['The Great {foe}', 'The Year of {foe}', 'The Winter at {zone}'],
    text: [
      'In {year} {foe} came to {zone}. The {place} was lost, the granary with it. {god} was petitioned, and the answer, if it was an answer, was a long and thorough silence.',
      'There was a flood at {zone} in {year}, and a fire the year after, and in the third year nothing at all, which the survivors called the worst. The {place} was the only building still standing. It still is.',
      'A sickness went through {zone} in {year}. The Godsworn {hero} walked into the quarantine at the {place} and was not seen again. The sickness was gone by spring, and nobody was willing to say why.',
    ],
  },
  founding: {
    title: ['The Founding of the {place}', 'The Raising of the {place}', 'The Consecration of the {place}'],
    text: [
      'In {year}, {hero} laid the first stone of the {place} near {zone} and dedicated it to {god}. It was meant to last a hundred years. It lasted three hundred, and then it was a ruin, which is a longer thing than a building.',
      'The {place} was raised in {year} by {house}, with the help of {god}’s priests, as a place of shelter on the road to {zone}. It was used for a century, abandoned for a generation, and found again by people who thought they had discovered it.',
      'A schism split the priesthood of {god} in {year}. {hero} and {rival} each claimed the {place} for their half. The matter was settled in an afternoon, with a coin toss, and neither side ever fully forgave the coin.',
    ],
  },
} as const;
export type EventKind = keyof typeof TEMPLATES;

/** Words that must never appear in generated history (Reconciliation R18). */
export const RESERVED_WORDS = ['Unsworn', 'Caerith', 'Nameless', 'Godsworn King'];
