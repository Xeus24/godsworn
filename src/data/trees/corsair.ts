import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const S = ['Attack', 'Physical'] as const;
/** Crew points are the ship's hands: they grow with every victory, and pay for cannon fire, boarding and rallies. */
export const CORSAIR_SKILLS = [
  act('cutlass-flick', 'Cutlass Flick', 'A swift cut for 130% ATK. Gain 10 Crew.', { el: 'physical', to: 'enemy', tags: [...S, 'Melee', 'Builder'], dmg: ['p', 1.3, 0.1], gen: ['crew', 10] }),
  act('cannon-fire', 'Cannon Fire', 'Spend 20 Crew: a broadside of 200% ATK fire damage to every enemy.', { el: 'fire', to: 'allEnemies', tags: ['Attack', 'Fire', 'AoE', 'Ranged'], cd: 3, res: ['crew', 20], dmg: ['p', 2.0, 0.15] }),
  act('boarding-party', 'Boarding Party', 'Spend 25 Crew: five boarders strike at random enemies for 90% ATK each.', { el: 'physical', to: 'randomEnemies', tags: [...S, 'Melee', 'AoE'], cd: 3, res: ['crew', 25], dmg: ['p', 0.9, 0.07, 5] }),
  act('rally-the-crew', 'Rally the Crew', 'Spend 15 Crew: the party heals 10% of max HP and gains +10% damage for 3 turns.', { el: 'physical', to: 'allAllies', tags: ['Heal', 'Buff', 'Team', 'Shout'], cd: 4, res: ['crew', 15], fx: [healPct(10, 'allAllies'), buff('crew-rally', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies')] }),
  act('grapeshot', 'Grapeshot', 'Spend 15 Crew: 160% ATK to every enemy that also Blinds them for a turn.', { el: 'physical', to: 'allEnemies', tags: [...S, 'Ranged', 'AoE'], cd: 3, res: ['crew', 15], dmg: ['p', 1.6, 0.12], fx: [status('blind', 1, { target: 'allEnemies' })] }),
  act('pistol-shot', 'Pistol Shot', 'A shot for 140% ATK that cannot be dodged. Gain 8 Crew.', { el: 'physical', to: 'enemy', tags: [...S, 'Ranged', 'Projectile', 'Builder'], cd: 2, dmg: ['p', 1.4, 0.1], gen: ['crew', 8], crit: true }),
  act('hard-aport', 'Hard A-Port', 'Spend 10 Crew: +25% dodge and +15% speed for 2 turns as the ship comes about.', { el: 'physical', to: 'self', tags: ['Buff', 'Movement', 'Defensive'], cd: 3, res: ['crew', 10], fx: [buff('hard-aport', 2, [{ stat: 'dodge', type: 'flat', value: 25 }, { stat: 'speed', type: 'percent', value: 15 }])] }),
  act('storm-sails', 'Storm Sails', 'Spend 20 Crew: a lightning-struck gust: 180% ATK to every enemy and a 10% shield for you.', { el: 'lightning', to: 'allEnemies', tags: ['Attack', 'Lightning', 'AoE'], cd: 4, res: ['crew', 20], dmg: ['p', 1.8, 0.14], fx: [shieldPct(10)] }),
  act('dead-calm', 'Dead Calm', 'Spend 15 Crew: every enemy is Slowed for 2 turns and you gain +15% accuracy.', { el: 'physical', to: 'allEnemies', tags: ['Debuff', 'AoE'], cd: 3, res: ['crew', 15], fx: [status('slow', 2, { target: 'allEnemies' }), buff('dead-calm', 2, [{ stat: 'accuracy', type: 'flat', value: 15 }])] }),
  act('run-up-the-colors', 'Run Up the Colors', 'Fly the black: +15% crit for the party for 3 turns. Gain 12 Crew.', { el: 'physical', to: 'allAllies', tags: ['Buff', 'Team', 'Shout'], cd: 4, gen: ['crew', 12], fx: [buff('colors', 3, [{ stat: 'critChance', type: 'flat', value: 15 }], 'allAllies')] }),
  spec('privateers-letter', 'Privateer’s Letter', 'Spend 20 Crew: 240% ATK, and the foe pays: you find 40 gold and the target is Weakened.', { el: 'physical', to: 'enemy', tags: [...S, 'Melee'], cd: 3, res: ['crew', 20], dmg: ['p', 2.4, 0.18], fx: [status('weaken', 3), { kind: 'gold', amount: 40 }] }),
  spec('hurricane-broadside', 'Hurricane Broadside', 'Spend 30 Crew: 260% ATK lightning to every enemy; each is Slowed.', { el: 'lightning', to: 'allEnemies', tags: ['Attack', 'Lightning', 'AoE'], cd: 4, res: ['crew', 30], dmg: ['p', 2.6, 0.2], fx: [status('slow', 2, { target: 'allEnemies' })] }),
  spec('deadeye-shot', 'Deadeye Shot', 'Spend 25 Crew: 360% ATK that cannot miss and always crits.', { el: 'physical', to: 'enemy', tags: [...S, 'Ranged', 'Projectile'], cd: 3, res: ['crew', 25], dmg: ['p', 3.6, 0.25], crit: true }),
  ult('plunder-the-sea', 'Plunder the Sea', 'Everything left floating is yours: 300% ATK to every enemy and 100 gold; Crew fills.', { el: 'physical', to: 'allEnemies', tags: [...S, 'AoE'], dmg: ['p', 3.0, 0], fx: [{ kind: 'gold', amount: 100 }, gain('crew', 100)] }),
  ult('the-kraken-answers', 'The Kraken Answers', 'The deep takes sides: 340% ATK lightning to every enemy, all Slowed.', { el: 'lightning', to: 'allEnemies', tags: ['Attack', 'Lightning', 'AoE'], dmg: ['p', 3.4, 0], fx: [status('slow', 3, { target: 'allEnemies' })] }),
  ult('one-shot-one-ship', 'One Shot, One Ship', 'The last cannonball: 450% ATK to a single foe that cannot miss.', { el: 'physical', to: 'enemy', tags: [...S, 'Ranged'], dmg: ['p', 4.5, 0], crit: true }),
  ult('corsairs-reckoning', 'The Corsair’s Reckoning', 'The whole crew, all at once: 310% ATK to every enemy, the party heals 15% and gains +20% damage.', { el: 'physical', to: 'allEnemies', tags: [...S, 'AoE', 'Team'], dmg: ['p', 3.1, 0], fx: [healPct(15, 'allAllies'), buff('reckoning', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies')] }),
];
const SK = CORSAIR_SKILLS;
export const CORSAIR_TREE = liteTree('corsair', SK, [
  { id: 'blade', name: 'The Blade', color: '#c8c8d8', desc: 'The cutlass is the first answer.', a: 'cutlass-flick', b: 'pistol-shot', stats: ['physicalAttack', 'critChance', 'speed', 'dex'], names: ['Salt-Worn Grip', 'Quick Draw', 'Rolling Gait', 'Sea Legs', 'Swordsman’s Edge', 'Pistol Hand', 'Roll With It', 'Steady Deck', 'The Old Dance', 'Blade of the Black Flag'] },
  { id: 'guns', name: 'The Guns', color: '#d86a3a', desc: 'The second answer is considerably louder.', a: 'cannon-fire', b: 'grapeshot', stats: ['fireDamage', 'physicalAttack', 'damageBonus', 'str'], names: ['Good Powder', 'Dry Fuse', 'Hot Barrel', 'Strong Back', 'Heavy Ball', 'Wide Spread', 'Long Gun', 'Cannon Drill', 'Broadside', 'Master Gunner'] },
  { id: 'crew', name: 'The Crew', color: '#e8b858', desc: 'A ship is a hundred hands pretending to be one.', a: 'boarding-party', b: 'rally-the-crew', stats: ['resourceGain', 'maxHp', 'healingPower', 'cha'], names: ['Good Mess', 'Loyal Hands', 'Fair Share', 'Shanty', 'Boarding Axes', 'Rousing Song', 'Full Hold', 'Tight Ship', 'Every Hand on Deck', 'Captain of the Crew'] },
  { id: 'sail', name: 'The Sail', color: '#6aa8c8', desc: 'The wind is a weapon if you are patient.', a: 'hard-aport', b: 'storm-sails', stats: ['dodge', 'speed', 'lightningDamage', 'luk'], names: ['Fair Wind', 'Taut Line', 'Cold Spray', 'Quick Tack', 'Full Canvas', 'Gale Force', 'Storm Reader', 'Eye of the Storm', 'Ride the Weather', 'Stormcaptain’s Gale'] },
  { id: 'flag', name: 'The Colors', color: '#383838', desc: 'A good flag is half the fight.', a: 'run-up-the-colors', b: 'dead-calm', stats: ['critChance', 'statusChance', 'goldFind', 'cha'], names: ['Black Cloth', 'White Skull', 'Loud Drum', 'Bad Reputation', 'Struck Colors', 'Dead Calm', 'Fear of the Flag', 'Raised Voices', 'The Name Is Enough', 'Terror of the Sea'] },
]);
export const CORSAIR_SPECS = liteSpecs(SK, [
  { id: 'privateer', name: 'Privateer', color: '#e8b858', desc: 'It is not piracy. It is paperwork.', skill: 'privateers-letter', ult: 'plunder-the-sea', stats: ['goldFind', 'physicalAttack', 'critChance'], names: ['Fine Print', 'Letter of Marque', 'Fair Cut', 'Legal Plunder', 'Good Lawyer', 'Clean Papers', 'Royal Seal', 'Privateer Ascendant'] },
  { id: 'stormcaptain', name: 'Stormcaptain', color: '#6aa8c8', desc: 'The weather is on your side. It has not been told.', skill: 'hurricane-broadside', ult: 'the-kraken-answers', stats: ['lightningDamage', 'speed', 'maxHp'], names: ['Squall', 'Thunderhead', 'Lightning Rod', 'Gale Warning', 'Eye Wall', 'Storm Surge', 'Ship of Storms', 'Stormcaptain Ascendant'] },
  { id: 'deadeye', name: 'Deadeye', color: '#c8c8d8', desc: 'One shot. You have a lot of time before it.', skill: 'deadeye-shot', ult: 'one-shot-one-ship', stats: ['accuracy', 'critChance', 'physicalAttack'], names: ['Level Eye', 'Cold Hand', 'Long Look', 'Held Breath', 'Perfect Roll', 'Still Deck', 'Far Mark', 'Deadeye Ascendant'] },
]);

export const CORSAIR: GreaterClass = {
  def: {
    id: 'corsair', name: 'Corsair', tagline: 'Technically licensed. Practically weather.',
    description: 'A sea-raider who commands Crew points: cannon fire, boarding parties and rallies. At home on any deck, strongest in a naval battle.',
    playstyle: 'Cutlass and pistol build Crew. Spend it on broadsides, boarding parties and rallies. Privateer pays for itself, Stormcaptain brings the weather, Deadeye takes one shot.',
    role: 'Melee / ranged raider', difficulty: 2, color: '#6a8ac8',
    mechanic: { name: 'Crew', description: 'Strikes and kills build Crew. Cannon fire, boarding parties and rallies spend it.' },
    trait: traitOf('Sea Legs', [['goldFind', 10]], '+10% gold found', 'physicalAttack', 0.6),
    resource: 'crew',
    baseStats: { str: 6, dex: 8, int: 3, vit: 6, wis: 3, luk: 6, fai: 2, cha: 6 },
    growth: { str: 1.0, dex: 1.5, int: 0.3, vit: 0.9, wis: 0.3, luk: 0.8, fai: 0.2, cha: 0.8 },
    weapons: ['sword', 'rapier', 'axe', 'dagger', 'crossbow', 'throwing'], armor: ['leather', 'cloth'],
    startingSkills: ['cutlass-flick', 'cannon-fire'], ultimate: 'corsairs-reckoning', defaultRow: 'front',
  },
  resource: { id: 'crew', name: 'Crew', max: 100, start: 15, decayPerTurn: 1, color: '#6a9ad8', description: 'Builds with strikes and kills. Broadsides, boarding and rallies spend it.', gains: { onHitDealt: 3, onEnemyDeath: 5 } },
  skills: SK, tree: CORSAIR_TREE, specs: CORSAIR_SPECS,
  mentor: mentorOf('mentor-corsair', 'Captain Odalie Brack', 'Retired twice. The ship objected both times.', 'Boarding Cutlass', ['#4a6a9a', '#e8d8a8'], ['shield-bash', 'dirty-stab']),
  trial: { quote: 'No one lives on land who would rather be on a deck. Show me.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles with a crew behind you, and take what the sea owes you. Fairly.' },
  mentorNpc: { name: 'Captain Odalie Brack', race: 'human', portrait: 1, color: '#4a6a9a', greeting: '“Welcome aboard. The ship is a house. The house is on fire. Let’s go.”' },
  kit: kitOf('sword-t1', 'leather-chest-t1', 'leather-boots-t1'),
  art: emblem('wave', '#2a4a7a', '#6a9ad8'),
  questline: ['nymira', 'drowned-grotto', ['tide-hag', '^drowned-sailor'], ['bone-lord', 'restless-ghost', 'restless-ghost'], ['A Berth for the Night', 'The Ship in the Fog', 'The Drowned Hold', 'The Hag’s Toll', 'The Black Flag Raised'], ['“Nymira keeps the water. Go to her shrine and ask for a fair wind.”', '“A ship in the fog has no crew. Board her, and ask politely.”', '“A drowned hold has a cargo nobody wants to name. Name it.”', '“A hag demands a toll from every ship that passes. Pay it, or refuse.”', '“Every Corsair chooses a flag. Come, and I will tell you what yours should say.”'], '“What does your flag say?”', '“Fair play, at a price.”', '“Don’t ask.”', '“Whatever the crew wants.”', 'Keeper of the Black Flag'],
  legendary: { id: 'cutlass-of-the-black-tide', name: 'Cutlass of the Black Tide', rarity: 'legendary', baseId: 'sword-t4', level: 25, requirements: { classes: ['corsair'] }, modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 10 }, { stat: 'goldFind', type: 'flat', value: 12 }], triggers: [trg('black-tide', 'onKill', [gain('crew', 6)])], effectText: ['Kills give 6 Crew.'], lore: 'Every ship it took still has a berth for it.' },
};
