import type { EncounterGroup, DungeonDef, ZoneDef, LoreDef } from '../../engine/world/types';
import type { EnemyTier } from '../../engine/combat/types';
import type { AreaDef, AreaTheme, PassDef } from '../world/areas';
import { foes, type FoeRow } from './foes';

/**
 * Expansion phase 19b: the six New Game+ regions, opened by passes from the late regions at certain tiers of New
 * Game+ (`ZoneDef.ngPlus`): the Celestial Realm and the Abyss at NG+1, the Shattered Timeline and the Drowned
 * Kingdom at NG+2, the Clockwork City and the Godforge at NG+3. Each has two dungeons, a world boss, seven new
 * enemies, three rare spawns, four side maps and a rule of its own.
 */

const grp = (weight: number, ids: string[], opts: Pick<EncounterGroup, 'time' | 'weather'> = {}): EncounterGroup => ({
  weight, ...opts,
  enemies: ids.map((raw) => {
    const back = raw.startsWith('^');
    const id = back ? raw.slice(1) : raw;
    const [tier, enemyId] = id.includes(':') ? (id.split(':') as [EnemyTier, string]) : [undefined, id];
    return { enemyId, ...(tier ? { tier } : {}), ...(back ? { row: 'back' as const } : {}) };
  }),
});
const elite = (id: string): string => `elite:${id}`;
const champions = (id: string, n = 2): string[] => Array.from({ length: n }, () => `champion:${id}`);
const roaming = (...rares: string[]): EncounterGroup[] => rares.map((r) => grp(1, [elite(r)]));

// ---------------------------------------------------------------- enemies

const NORMAL: FoeRow[] = [
  // Celestial Realm
  ['seraph-guard', 'Seraph Guard', 'humanoid', ['celestial', 'humanoid'], 78, 'tank', 'holy', ['shield-bash', 'war-cry'], 'Halo Blade', 'A winged sentry who has stood watch so long that it no longer remembers the door it guards.', '#e8e0c0', '#ffe888'],
  ['choir-cherub', 'Choir Cherub', 'wisp', ['celestial', 'spirit'], 79, 'caster', 'holy', ['mend-ally', 'dazzle'], 'Hymn of Brass', 'A small, loud, golden thing that is rather proud of its voice.', '#f0d890', '#ffffff'],
  ['star-hound', 'Star Hound', 'beast', ['celestial', 'beast'], 80, 'skirm', 'holy', ['savage-bite', 'pack-howl'], 'Comet Bite', 'A hound of pale fire. It trails sparks and a grudge.', '#c8d8f0', '#ffe8a0'],
  ['dawn-golem', 'Dawn Golem', 'golem', ['construct', 'celestial'], 81, 'tank', 'holy', ['crushing-blow', 'harden'], 'Sunrise Fist', 'Cut from the first sunrise and slow to set.', '#f0c880', '#fff0b0'],
  ['fallen-orator', 'Fallen Orator', 'humanoid', ['celestial', 'humanoid'], 82, 'caster', 'shadow', ['curse-of-ages', 'doom-mark'], 'Last Sermon', 'A herald who forgot how to end a sentence, and began, instead, to end a god.', '#8a8aa8', '#e0d0f8'],
  ['radiant-wyrm', 'Radiant Wyrm', 'serpent', ['dragon', 'celestial'], 83, 'brute', 'holy', ['constrict', 'flame-breath'], 'Gilded Coil', 'Scales like stained glass. It is very beautiful from far away.', '#e8d0a0', '#fff8d0'],
  ['halo-wraith', 'Halo Wraith', 'wisp', ['undead', 'celestial'], 84, 'caster', 'holy', ['wail', 'dazzle'], 'Ring of Light', 'A circle of light with nobody in it, tightening.', '#e8f0ff', '#ffffff'],
  // The Abyss
  ['abyssal-maw', 'Abyssal Maw', 'serpent', ['beast', 'void'], 80, 'brute', 'void', ['savage-bite', 'void-rend'], 'Gulp', 'A mouth with no face to be attached to.', '#1a1a3a', '#8a5ad8'],
  ['dread-shade', 'Dread Shade', 'undead', ['undead', 'void'], 81, 'caster', 'void', ['wail', 'doom-mark'], 'Cold Dread', 'It carries your worst afternoon on its back.', '#2a2a4a', '#a888e8'],
  ['null-knight', 'Null Knight', 'humanoid', ['humanoid', 'void'], 82, 'tank', 'void', ['shield-bash', 'void-rend'], 'Hollow Spear', 'Armor around nothing, polished by habit.', '#3a3a5a', '#c8b8f8'],
  ['lantern-leech', 'Lantern Leech', 'slime', ['beast', 'void'], 83, 'skirm', 'shadow', ['plague-bite', 'drown'], 'Drain', 'It lures with a light and feeds on the wanting.', '#3a2a4a', '#f0d890'],
  ['echo-hunter', 'Echo Hunter', 'beast', ['beast', 'spirit'], 84, 'skirm', 'void', ['dive-bomb', 'screech'], 'Echo Strike', 'It hunts by the sound of your fear and has excellent ears.', '#4a4a6a', '#d8d8f8'],
  ['black-tide', 'Black Tide', 'slime', ['elemental', 'void'], 85, 'brute', 'shadow', ['drown', 'crushing-swing'], 'Swell', 'A wave of ink that has learned to stand up.', '#0a0a1a', '#6a5aa8'],
  ['void-priest', 'Void Priest', 'humanoid', ['humanoid', 'void', 'cultist'], 86, 'caster', 'void', ['mend-ally', 'corruption-wave'], 'Silent Litany', 'He prays to the gap between the prayers.', '#2a1a4a', '#d8b8f8'],
  // The Shattered Timeline
  ['time-wisp', 'Time Wisp', 'wisp', ['spirit', 'arcane'], 78, 'caster', 'arcane', ['dazzle', 'crystal-shard'], 'Stray Second', 'A second that came loose and wandered off to find a minute.', '#a8d8f0', '#ffffff'],
  ['paradox-hound', 'Paradox Hound', 'beast', ['beast', 'arcane'], 80, 'skirm', 'arcane', ['savage-bite', 'pack-howl'], 'Both Bites', 'It bites you before it arrives. And again, after.', '#8aa8d8', '#f0f0ff'],
  ['hourglass-knight', 'Hourglass Knight', 'humanoid', ['humanoid', 'construct'], 82, 'tank', 'arcane', ['shield-bash', 'harden'], 'Sand Blade', 'Plate armor that keeps pouring out grains of the minute it is.', '#d8c898', '#fff0c0'],
  ['ruined-clockmaker', 'Ruined Clockmaker', 'humanoid', ['humanoid', 'arcane'], 84, 'caster', 'arcane', ['doom-mark', 'curse-of-ages'], 'Winding Hex', 'He keeps trying to wind a clock that is shaped like a bell.', '#a898a8', '#e0e8f8'],
  ['yesterday-wolf', 'Yesterday’s Wolf', 'beast', ['beast', 'spirit'], 85, 'brute', 'shadow', ['savage-bite', 'wail'], 'Old Fang', 'A wolf from a day that did not happen, and so is hungry for this one.', '#6a6a7a', '#c8d0e8'],
  ['fracture-wraith', 'Fracture Wraith', 'undead', ['undead', 'arcane'], 87, 'caster', 'arcane', ['wail', 'chain-lightning-e'], 'Split Moment', 'It is in two places at once, both of them behind you.', '#9aa8d8', '#ffffff'],
  ['tomorrow-golem', 'Tomorrow’s Golem', 'golem', ['construct', 'arcane'], 88, 'tank', 'arcane', ['crushing-blow', 'earthshatter'], 'Late Fist', 'It will arrive in a moment. It is already here.', '#b8b8d8', '#e8f0ff'],
  // The Drowned Kingdom
  ['drowned-hussar', 'Drowned Hussar', 'undead', ['undead', 'humanoid'], 76, 'brute', 'physical', ['cutlass-flurry', 'grave-chill'], 'Sea-Saber', 'His cavalry never learned that the charge was over.', '#4a6a7a', '#c8e0e8'],
  ['kelp-queen', 'Kelp Queen', 'plant', ['plant', 'humanoid'], 78, 'caster', 'nature', ['root-lash', 'constrict'], 'Green Embrace', 'She is mostly weed, and entirely a monarch.', '#2a5a3a', '#88e8a8'],
  ['crown-crab', 'Crown Crab', 'beast', ['beast'], 80, 'tank', 'physical', ['harden', 'crushing-blow'], 'Royal Claw', 'A crab wearing a drowned king’s crown. It will not give it back.', '#d86a4a', '#ffd8a0'],
  ['siren-consort', 'Siren Consort', 'humanoid', ['humanoid', 'water'], 82, 'caster', 'arcane', ['siren-song', 'drown'], 'Sorrow Aria', 'The queen’s favorite. She sings on, for the love of the audience.', '#4a8ab8', '#e0f0ff'],
  ['trident-guard', 'Trident Guard', 'humanoid', ['humanoid', 'water'], 83, 'tank', 'lightning', ['shield-bash', 'chain-lightning-e'], 'Storm Trident', 'He has been on duty for three thousand years. He is tired, and very sharp.', '#3a6a9a', '#d8e8ff'],
  ['leviathan-calf', 'Leviathan Calf', 'serpent', ['beast', 'water'], 85, 'brute', 'physical', ['constrict', 'drown'], 'Calf Coil', 'A calf of a very large thing. Its mother is never far.', '#2a4a7a', '#a8d0f0'],
  ['pearl-lich', 'Pearl Lich', 'undead', ['undead', 'humanoid'], 86, 'caster', 'ice', ['frost-breath', 'doom-mark'], 'Nacre Nova', 'A court wizard who bargained with the tide, and kept the pearl.', '#a8c8e8', '#ffffff'],
  // The Clockwork City
  ['brass-citizen', 'Brass Citizen', 'golem', ['construct', 'humanoid'], 80, 'skirm', 'physical', ['dirty-stab', 'war-cry'], 'Pocket Wrench', 'A resident of the city. Polite, until the whistle blows.', '#c89a4a', '#f8e0a0'],
  ['piston-giant', 'Piston Giant', 'golem', ['construct', 'giant'], 83, 'brute', 'physical', ['crushing-blow', 'tremor'], 'Piston Fall', 'Taller than a house and not yet finished.', '#8a6a4a', '#e8b868'],
  ['whistle-wraith', 'Whistle Wraith', 'wisp', ['spirit', 'construct'], 84, 'caster', 'lightning', ['screech', 'chain-lightning-e'], 'Shift Whistle', 'The ghost of an alarm, still calling the hour.', '#e8d8a8', '#ffffff'],
  ['lathe-spider', 'Lathe Spider', 'spider', ['construct', 'beast'], 85, 'skirm', 'physical', ['web-spit', 'venom-fang'], 'Spun Steel', 'It spins its web from cutting wire.', '#9a9aaa', '#e8e8f0'],
  ['regent-guard', 'Regent Guard', 'golem', ['construct'], 86, 'tank', 'physical', ['shield-bash', 'harden'], 'Gilded Halberd', 'The Regent’s own guard, greased every morning, never relieved.', '#d8b868', '#fff0b8'],
  ['arc-engine', 'Arc Engine', 'elemental', ['construct', 'elemental'], 88, 'caster', 'lightning', ['chain-lightning-e', 'crystal-shard'], 'Arc Burst', 'A turbine that wanted to be a storm.', '#6a8aba', '#d8f0ff'],
  ['grinder-drone', 'Grinder Drone', 'golem', ['construct'], 89, 'brute', 'physical', ['cleave', 'gore-charge'], 'Saw Charge', 'It cleans up. In its fashion.', '#7a7a8a', '#e0e0f0'],
  // The Godforge
  ['forge-seraph', 'Forge Seraph', 'humanoid', ['celestial', 'elemental'], 84, 'brute', 'fire', ['cleave', 'flame-breath'], 'Anvil-Wing', 'A seraph hammered half-finished and sent out to fight.', '#d86a2a', '#ffe08a'],
  ['godsteel-golem', 'Godsteel Golem', 'golem', ['construct', 'celestial'], 85, 'tank', 'fire', ['harden', 'crushing-blow'], 'Godsteel Fist', 'Forged of a metal that remembers being prayed to.', '#a8a8c8', '#ffd890'],
  ['spark-sprite', 'Spark Sprite', 'wisp', ['elemental'], 86, 'caster', 'fire', ['magma-burst', 'dazzle'], 'Divine Spark', 'A mote of godfire that thinks it is a star.', '#f09a3a', '#ffffff'],
  ['quench-hound', 'Quench Hound', 'beast', ['beast', 'elemental'], 87, 'skirm', 'ice', ['savage-bite', 'frost-breath'], 'Cold Snap', 'It cools whatever it bites, at once and permanently.', '#6a9aba', '#e0f0ff'],
  ['apprentice-of-flame', 'Apprentice of Flame', 'humanoid', ['humanoid', 'elemental'], 88, 'caster', 'fire', ['hellfire-bolt', 'flame-breath'], 'Wild Pour', 'A student of the Godforge who hurried the lesson.', '#c85a2a', '#ffd070'],
  ['slag-colossus', 'Slag Colossus', 'elemental', ['elemental', 'construct'], 89, 'tank', 'fire', ['earthshatter', 'magma-burst'], 'Slag Slam', 'A heap of discarded divinity, walking.', '#8a3a1a', '#ff9a3a'],
  ['hammer-saint', 'Hammer-Saint', 'humanoid', ['celestial', 'humanoid'], 90, 'brute', 'fire', ['crushing-blow', 'war-cry'], 'Sacred Hammer', 'The patron of those who fix things by hitting them.', '#c8a868', '#fff0c0'],
];

const RARES: FoeRow[] = [
  ['first-seraph', 'The First Seraph', 'humanoid', ['celestial'], 82, 'tank', 'holy', ['shield-bash', 'war-cry'], 'Dawn Edge', 'She was the first thing told to guard, and has never been told to stop.', '#f8f0d0', '#fff8c0'],
  ['lamb-of-gold', 'The Lamb of Gold', 'beast', ['celestial', 'beast'], 80, 'skirm', 'holy', ['savage-bite', 'mend-ally'], 'Gilded Kick', 'A small golden lamb with the confidence of a much larger animal.', '#f0e0a0', '#ffffff'],
  ['prism-choirmaster', 'The Prism Choirmaster', 'humanoid', ['celestial', 'humanoid'], 84, 'caster', 'holy', ['dazzle', 'chain-lightning-e'], 'Split Chord', 'Conducts thirty voices from one throat.', '#e8c8f0', '#ffffff'],
  ['the-listener', 'The Listener', 'humanoid', ['void', 'humanoid'], 83, 'caster', 'void', ['wail', 'doom-mark'], 'Attention', 'It stands at the edge of the Abyss. Do not say anything you mean.', '#2a2a4a', '#c8b8f8'],
  ['mother-of-lanterns', 'Mother of Lanterns', 'slime', ['beast', 'void'], 85, 'tank', 'shadow', ['drown', 'plague-bite'], 'Lure', 'She has a thousand lights on her back and a very small mouth.', '#3a2a4a', '#f8e0a0'],
  ['dread-king', 'The Dread King', 'undead', ['undead', 'void'], 87, 'brute', 'void', ['void-rend', 'grave-chill'], 'Hollow Crown', 'He rules nothing, and is extremely firm about it.', '#1a1a3a', '#a888e8'],
  ['the-second-before', 'The Second Before', 'wisp', ['spirit', 'arcane'], 84, 'skirm', 'arcane', ['dazzle', 'screech'], 'Too Soon', 'It always arrives the instant before it does.', '#c8e8f8', '#ffffff'],
  ['old-sandglass', 'Old Sandglass', 'golem', ['construct', 'arcane'], 86, 'tank', 'arcane', ['harden', 'crushing-blow'], 'Sand Fall', 'A glass giant, half empty, half full, entirely unwilling to discuss which.', '#e8d8a8', '#fff8d8'],
  ['the-might-have-been', 'The Might-Have-Been', 'undead', ['undead', 'spirit'], 88, 'caster', 'shadow', ['wail', 'curse-of-ages'], 'Regret', 'A knight who did not happen.', '#6a6a8a', '#d8d8f0'],
  ['admiral-brine', 'Admiral Brine', 'undead', ['undead', 'humanoid'], 80, 'brute', 'physical', ['cutlass-flurry', 'war-cry'], 'Drowned Cutlass', 'Commander of the sunken fleet. He keeps the ledger on the seabed.', '#4a6a7a', '#d8e8f0'],
  ['empress-of-weed', 'The Empress of Weed', 'plant', ['plant', 'humanoid'], 82, 'caster', 'nature', ['root-lash', 'spore-cloud'], 'Green Decree', 'She rules a kingdom in which nothing moves without her leave.', '#2a5a3a', '#a8f0b8'],
  ['the-court-jester', 'The Court Jester', 'humanoid', ['humanoid', 'water'], 85, 'skirm', 'arcane', ['dirty-stab', 'siren-song'], 'Last Laugh', 'The only one in the kingdom who tells the truth, and the only one who drowned laughing.', '#a8b8e8', '#fff8e0'],
  ['tinker-regent', 'The Tinker-Regent', 'golem', ['construct', 'humanoid'], 84, 'brute', 'physical', ['cleave', 'war-cry'], 'Regency Wrench', 'He rules because no one repealed the law that made him.', '#c8a868', '#fff0c0'],
  ['great-governor', 'The Great Governor', 'golem', ['construct'], 87, 'tank', 'lightning', ['harden', 'chain-lightning-e'], 'Governed Fist', 'It keeps the whole city from running too fast, and has never been thanked.', '#8a9aba', '#e0f0ff'],
  ['siren-of-the-whistle', 'Siren of the Whistle', 'wisp', ['spirit', 'construct'], 89, 'caster', 'lightning', ['screech', 'dazzle'], 'Seven O’Clock', 'She is the sound that ends the shift. Everyone dreads her, and everyone is relieved.', '#e0d8c0', '#ffffff'],
  ['smith-of-last-things', 'Smith of Last Things', 'humanoid', ['humanoid', 'celestial'], 88, 'brute', 'fire', ['crushing-blow', 'flame-breath'], 'Last Hammer', 'He makes only what cannot be made twice.', '#c85a2a', '#ffe090'],
  ['cinder-seraph', 'Cinder Seraph', 'humanoid', ['celestial', 'elemental'], 89, 'skirm', 'fire', ['flame-breath', 'dive-bomb'], 'Ash-Wing', 'A seraph whose halo burned down to a ring of soot.', '#6a3a2a', '#ffb870'],
  ['godfire-wyrm', 'The Godfire Wyrm', 'serpent', ['dragon', 'elemental'], 90, 'brute', 'fire', ['flame-breath', 'constrict'], 'Godfire Breath', 'A dragon that swallowed a god’s forge to keep it warm.', '#e86a2a', '#fff0b0'],
];

const BOSSES: FoeRow[] = [
  ['throne-warden', 'The Throne Warden', 'humanoid', ['celestial'], 83, 'tank', 'holy', ['shield-bash', 'harden', 'boss-enrage'], 'Warden’s Verdict', 'The Realm’s gatekeeper. His one rule is that no one passes. His second rule is also that.', '#f0e0b0', '#fff0c0'],
  ['voice-of-the-choir', 'The Voice of the Choir', 'wisp', ['celestial', 'spirit'], 86, 'caster', 'holy', ['dazzle', 'doom-mark', 'boss-enrage'], 'Final Chord', 'Thirty thousand voices, one of them out of tune on purpose.', '#e8e0f8', '#ffffff'],
  ['deep-sovereign', 'The Deep Sovereign', 'humanoid', ['void', 'humanoid'], 85, 'tank', 'void', ['void-rend', 'harden', 'boss-enrage'], 'Sovereign’s Silence', 'Lord of the Abyss. His subjects are the absences.', '#1a1a3a', '#a888e8'],
  ['the-drowned-hour', 'The Drowned Hour', 'spirit', ['spirit', 'void'], 88, 'caster', 'void', ['wail', 'drown', 'boss-enrage'], 'Last Tide', 'The hour at the bottom of the day, where nothing is awake.', '#2a2a4a', '#c8b8f8'],
  ['chronarch', 'The Chronarch', 'humanoid', ['humanoid', 'arcane'], 87, 'caster', 'arcane', ['doom-mark', 'crystal-shard', 'boss-enrage'], 'Edict of Hours', 'The tyrant of the broken calendar. He rules every day at once.', '#a8d8f0', '#ffffff'],
  ['the-unmade-moment', 'The Unmade Moment', 'wisp', ['spirit', 'arcane'], 89, 'caster', 'arcane', ['dazzle', 'curse-of-ages', 'boss-enrage'], 'Undoing', 'The instant that should have happened. It is cross about this.', '#d8e8f8', '#ffffff'],
  ['court-chamberlain', 'The Court Chamberlain', 'undead', ['undead', 'humanoid'], 83, 'tank', 'physical', ['shield-bash', 'war-cry', 'boss-enrage'], 'Staff of Office', 'He has announced every guest for three thousand years. There have been none.', '#4a6a7a', '#c8e0e8'],
  ['drowned-queen', 'The Drowned Queen', 'humanoid', ['humanoid', 'water'], 86, 'caster', 'arcane', ['siren-song', 'drown', 'boss-enrage'], 'Queen’s Lament', 'Her kingdom sank on the day of her coronation. She wears the crown all the same.', '#3a6a9a', '#e0f0ff'],
  ['master-assembler', 'The Master Assembler', 'golem', ['construct'], 86, 'brute', 'physical', ['cleave', 'harden', 'boss-enrage'], 'Assembly Line', 'It builds citizens faster than they can be named.', '#a88a4a', '#f0d890'],
  ['prime-regent', 'The Prime Regent', 'golem', ['construct', 'humanoid'], 89, 'tank', 'lightning', ['shield-bash', 'chain-lightning-e', 'boss-enrage'], 'Edict of Brass', 'The city’s ruler, and, it admits, its first mistake.', '#c8a868', '#fff0c0'],
  ['forgewright-ember', 'Forgewright Ember', 'humanoid', ['humanoid', 'elemental'], 88, 'caster', 'fire', ['hellfire-bolt', 'magma-burst', 'boss-enrage'], 'Pour', 'The Godforge’s last master smith. He hums while he burns.', '#d86a2a', '#ffe08a'],
  ['the-unfinished-god', 'The Unfinished God', 'spirit', ['celestial', 'construct'], 90, 'tank', 'fire', ['crushing-blow', 'flame-breath', 'boss-enrage'], 'First Blow', 'A god set aside before the last hammer-stroke. It would very much like one.', '#a8a8c8', '#ffd890'],
];

const WORLD_BOSSES: FoeRow[] = [
  ['arch-seraph-aurial', 'Arch-Seraph Aurial', 'humanoid', ['celestial'], 86, 'tank', 'holy', ['shield-bash', 'dazzle', 'earthshatter'], 'Judgement', 'The Realm’s first captain: he has judged everyone, and is waiting for someone to judge him back.', '#f8f0d0', '#fff8c0'],
  ['the-abyssal-mother', 'The Abyssal Mother', 'serpent', ['void', 'beast'], 88, 'tank', 'void', ['drown', 'void-rend', 'earthshatter'], 'Mother’s Embrace', 'She has been at the bottom of everything since before the bottom had a name.', '#1a1a3a', '#8a5ad8'],
  ['the-last-tick', 'The Last Tick', 'spirit', ['spirit', 'arcane'], 90, 'caster', 'arcane', ['doom-mark', 'crystal-shard', 'earthshatter'], 'Final Second', 'The last second of the last hour, afraid of what comes after.', '#c8e8f8', '#ffffff'],
  ['the-drowned-throne', 'The Drowned Throne', 'golem', ['construct', 'water'], 88, 'tank', 'lightning', ['crushing-blow', 'drown', 'earthshatter'], 'Throne Fall', 'A throne that learned to rule by itself. It has opinions on whoever sits.', '#4a6a9a', '#d8e8ff'],
  ['the-great-gear', 'The Great Gear', 'golem', ['construct', 'giant'], 90, 'tank', 'physical', ['crushing-blow', 'tremor', 'earthshatter'], 'First Turn', 'The first wheel of the city. If it stops, so does everything.', '#c89a4a', '#f8e0a0'],
  ['the-godforge-heart', 'Heart of the Godforge', 'elemental', ['celestial', 'elemental'], 90, 'tank', 'fire', ['flame-breath', 'earthshatter', 'magma-burst'], 'Godfire Pulse', 'The furnace where gods were made, still hot, and still hungry for something to shape.', '#e86a2a', '#fff0b0'],
];

export const BATCH4_ENEMIES = [
  ...foes(NORMAL),
  ...foes(RARES, 'elite'),
  ...foes(BOSSES, 'boss', 'boss'),
  ...foes(WORLD_BOSSES, 'worldBoss', 'worldBoss'),
];

// ---------------------------------------------------------------- zones

export const BATCH4_ZONES: ZoneDef[] = [
  {
    id: 'celestial-realm', name: 'The Celestial Realm', order: 21, tier: 10, off: true, ngPlus: 1, levels: [78, 86], biome: 'snow', mechanic: 'radiance',
    description: 'A realm above the sky, gold and white and slightly too bright, where the angels have been left on duty.',
    gather: { mining: ['starmetal-ore', 'adamant-ore'], herbalism: ['sunpetal', 'dreamleaf'], fishing: ['golden-trout'] },
    weather: [{ id: 'clear', weight: 5 }, { id: 'snow', weight: 1 }], encounterRate: 0.08,
    dungeons: ['halls-of-the-seraphim', 'choir-vault'], worldBoss: 'arch-seraph-aurial', shrines: ['solenne', 'aurelis', 'seraphel'],
    encounters: [grp(3, ['seraph-guard', 'seraph-guard', '^choir-cherub']), grp(3, ['star-hound', 'star-hound']), grp(3, ['dawn-golem', '^choir-cherub']), grp(2, ['radiant-wyrm', 'star-hound']), grp(2, ['fallen-orator', '^halo-wraith']), grp(2, ['halo-wraith', 'halo-wraith', 'seraph-guard'], { time: 'night' }), grp(1, ['radiant-wyrm', 'dawn-golem', '^fallen-orator'])],
    roaming: [...roaming('first-seraph', 'lamb-of-gold', 'prism-choirmaster'), grp(1, champions('seraph-guard', 3))],
    lore: ['lore-celestial-watch', 'lore-celestial-fall'],
  },
  {
    id: 'the-abyss', name: 'The Abyss', order: 22, tier: 10, off: true, ngPlus: 1, levels: [80, 88], biome: 'cave', mechanic: 'dread',
    description: 'The bottom beneath the bottom: a lightless drop that listens to you more attentively than you would like.',
    gather: { mining: ['starmetal-ore'], herbalism: ['dreamleaf', 'ghostcap'], fishing: ['glass-eel', 'ember-eel'] },
    weather: [{ id: 'fog', weight: 4 }, { id: 'clear', weight: 2 }, { id: 'blood-moon', weight: 1 }], encounterRate: 0.09,
    dungeons: ['listening-deep', 'lantern-trench'], worldBoss: 'the-abyssal-mother', shrines: ['morrath', 'mirrin', 'lyssara'],
    encounters: [grp(3, ['abyssal-maw', 'abyssal-maw']), grp(3, ['dread-shade', 'null-knight']), grp(3, ['lantern-leech', 'lantern-leech', '^dread-shade']), grp(2, ['echo-hunter', 'echo-hunter']), grp(2, ['black-tide', '^void-priest']), grp(2, ['void-priest', 'null-knight', 'null-knight'], { time: 'night' }), grp(1, ['black-tide', 'abyssal-maw', '^void-priest'])],
    roaming: [...roaming('the-listener', 'mother-of-lanterns', 'dread-king'), grp(1, champions('null-knight', 3))],
    lore: ['lore-abyss-listening', 'lore-abyss-lanterns'],
  },
  {
    id: 'shattered-timeline', name: 'The Shattered Timeline', order: 23, tier: 10, off: true, ngPlus: 2, levels: [78, 90], biome: 'citadel', mechanic: 'echoes',
    description: 'A landscape in splinters, where yesterday, today and the day that never came share a single road.',
    gather: { mining: ['starmetal-ore', 'silver-ore'], herbalism: ['dreamleaf', 'moonpetal'], fishing: ['golden-trout'] },
    weather: [{ id: 'fog', weight: 3 }, { id: 'clear', weight: 3 }, { id: 'storm', weight: 2 }], encounterRate: 0.08,
    dungeons: ['hall-of-hours', 'broken-calendar'], worldBoss: 'the-last-tick', shrines: ['mirrin', 'aurelis', 'vex'],
    encounters: [grp(3, ['time-wisp', 'time-wisp', '^ruined-clockmaker']), grp(3, ['paradox-hound', 'paradox-hound']), grp(3, ['hourglass-knight', '^time-wisp']), grp(2, ['yesterday-wolf', 'paradox-hound']), grp(2, ['fracture-wraith', '^ruined-clockmaker']), grp(2, ['tomorrow-golem', '^fracture-wraith'], { time: 'night' }), grp(1, ['hourglass-knight', 'yesterday-wolf', '^fracture-wraith'])],
    roaming: [...roaming('the-second-before', 'old-sandglass', 'the-might-have-been'), grp(1, champions('paradox-hound', 3))],
    lore: ['lore-timeline-split', 'lore-timeline-clocks'],
  },
  {
    id: 'drowned-kingdom', name: 'The Drowned Kingdom', order: 24, tier: 10, off: true, ngPlus: 2, levels: [76, 86], biome: 'coast', mechanic: 'undertow',
    description: 'A whole kingdom beneath the Merrow sea, still holding court: ministers, hussars and a queen who will not step down.',
    gather: { mining: ['adamant-ore'], herbalism: ['sea-salt', 'dreamleaf'], fishing: ['glass-eel', 'golden-trout', 'ember-eel'] },
    weather: [{ id: 'storm', weight: 3 }, { id: 'rain', weight: 3 }, { id: 'fog', weight: 2 }], encounterRate: 0.08,
    dungeons: ['throne-of-tides', 'sunken-armory'], worldBoss: 'the-drowned-throne', shrines: ['nymira', 'lyssara', 'grimvald'],
    encounters: [grp(3, ['drowned-hussar', 'drowned-hussar', '^siren-consort']), grp(3, ['crown-crab', 'kelp-queen']), grp(3, ['trident-guard', 'trident-guard']), grp(2, ['leviathan-calf', '^pearl-lich']), grp(2, ['siren-consort', 'drowned-hussar', '^pearl-lich']), grp(2, ['pearl-lich', 'trident-guard'], { time: 'night' }), grp(1, ['leviathan-calf', 'crown-crab', '^siren-consort'])],
    roaming: [...roaming('admiral-brine', 'empress-of-weed', 'the-court-jester'), grp(1, champions('drowned-hussar', 3))],
    lore: ['lore-drowned-court', 'lore-drowned-crown'],
  },
  {
    id: 'clockwork-city', name: 'The Clockwork City', order: 25, tier: 10, off: true, ngPlus: 3, levels: [80, 90], biome: 'citadel', mechanic: 'overclock',
    description: 'The city the Foundry dreamed: a metropolis of brass avenues and a million gears, running to a schedule no one wrote.',
    gather: { mining: ['adamant-ore', 'starmetal-ore'], herbalism: ['fireweed', 'sunpetal'], fishing: ['ember-eel'] },
    weather: [{ id: 'ashfall', weight: 3 }, { id: 'clear', weight: 3 }, { id: 'storm', weight: 2 }], encounterRate: 0.08,
    dungeons: ['the-great-works', 'regents-tower'], worldBoss: 'the-great-gear', shrines: ['ordrun', 'aurelis', 'thalor'],
    encounters: [grp(4, ['brass-citizen', 'brass-citizen', '^whistle-wraith']), grp(3, ['piston-giant', '^arc-engine']), grp(3, ['lathe-spider', 'lathe-spider']), grp(2, ['regent-guard', 'regent-guard', '^whistle-wraith']), grp(2, ['arc-engine', 'grinder-drone']), grp(2, ['grinder-drone', 'grinder-drone', 'brass-citizen'], { time: 'night' }), grp(1, ['piston-giant', 'regent-guard', '^arc-engine'])],
    roaming: [...roaming('tinker-regent', 'great-governor', 'siren-of-the-whistle'), grp(1, champions('brass-citizen', 3))],
    lore: ['lore-city-schedule', 'lore-city-regent'],
  },
  {
    id: 'the-godforge', name: 'The Godforge', order: 26, tier: 10, off: true, ngPlus: 3, levels: [84, 90], biome: 'volcanic', mechanic: 'godfire',
    description: 'The furnace at the root of the world, where gods were made, and where a few were left on the anvil.',
    gather: { mining: ['starmetal-ore', 'adamant-ore'], herbalism: ['fireweed', 'sunpetal'], fishing: ['ember-eel'] },
    weather: [{ id: 'ashfall', weight: 4 }, { id: 'heatwave', weight: 3 }, { id: 'clear', weight: 1 }], encounterRate: 0.08,
    dungeons: ['the-quenching-hall', 'unfinished-pantheon'], worldBoss: 'the-godforge-heart', shrines: ['thalor', 'kael', 'hesha'],
    encounters: [grp(3, ['forge-seraph', 'forge-seraph', '^spark-sprite']), grp(3, ['godsteel-golem', '^apprentice-of-flame']), grp(3, ['quench-hound', 'quench-hound']), grp(2, ['slag-colossus', '^spark-sprite']), grp(2, ['apprentice-of-flame', 'apprentice-of-flame', 'hammer-saint']), grp(2, ['hammer-saint', 'godsteel-golem'], { time: 'night' }), grp(1, ['slag-colossus', 'forge-seraph', '^apprentice-of-flame'])],
    roaming: [...roaming('smith-of-last-things', 'cinder-seraph', 'godfire-wyrm'), grp(1, champions('forge-seraph', 3))],
    lore: ['lore-forge-first', 'lore-forge-unfinished'],
  },
];

// ---------------------------------------------------------------- dungeons

const dg = (id: string, name: string, zone: string, level: number, biome: DungeonDef['biome'], rooms: number, puzzle: boolean, boss: string, description: string, gimmick: DungeonDef['gimmick'], hint: string, encounters: EncounterGroup[], hard = false): DungeonDef => ({ id, name, zone, level, biome, rooms, puzzle, boss, description, encounters, gimmick, hint, hard });

export const BATCH4_DUNGEONS: DungeonDef[] = [
  dg('halls-of-the-seraphim', 'The Halls of the Seraphim', 'celestial-realm', 82, 'dungeon', 7, true, 'throne-warden', 'Marble halls where every door is guarded by someone who has forgotten what for.', 'cycle', 'The gates swing open for twenty steps and shut for twenty.', [grp(3, ['seraph-guard', 'dawn-golem']), grp(2, ['choir-cherub', 'choir-cherub', 'seraph-guard']), grp(1, [elite('seraph-guard')])], true),
  dg('choir-vault', 'The Choir Vault', 'celestial-realm', 85, 'dungeon', 7, true, 'voice-of-the-choir', 'Under the cloud floor, the Realm’s vast choir sings the same hymn, forever, in a vault of golden pipes.', 'dark', 'The vault drowns out the torches with light. Bring Torches anyway.', [grp(3, ['choir-cherub', 'halo-wraith', 'halo-wraith']), grp(2, ['fallen-orator', 'radiant-wyrm']), grp(1, [elite('fallen-orator')])]),
  dg('listening-deep', 'The Listening Deep', 'the-abyss', 84, 'cave', 7, true, 'deep-sovereign', 'A cavern with a very good echo. Everything you say comes back later, and with additions.', 'dark', 'The deep eats torchlight faster than you can light it.', [grp(3, ['dread-shade', 'null-knight', 'null-knight']), grp(2, ['echo-hunter', 'echo-hunter']), grp(1, [elite('null-knight')])], true),
  dg('lantern-trench', 'The Lantern Trench', 'the-abyss', 87, 'cave', 7, true, 'the-drowned-hour', 'A trench hung with a thousand lanterns, each of them somebody’s last light.', 'flood', 'The trench floods on a slow count. Cross on the ebb.', [grp(3, ['lantern-leech', 'black-tide']), grp(2, ['void-priest', 'abyssal-maw']), grp(1, [elite('black-tide')])]),
  dg('hall-of-hours', 'The Hall of Hours', 'shattered-timeline', 84, 'dungeon', 7, true, 'chronarch', 'A hall of a thousand clocks, each showing a different hour of a different day.', 'cycle', 'The doors open and shut on a count that is never the same twice: twenty, twenty.', [grp(3, ['hourglass-knight', 'time-wisp', 'time-wisp']), grp(2, ['ruined-clockmaker', 'paradox-hound']), grp(1, [elite('hourglass-knight')])], true),
  dg('broken-calendar', 'The Broken Calendar', 'shattered-timeline', 88, 'dungeon', 7, true, 'the-unmade-moment', 'Seven halls, one for each day of a week that never finished.', 'dark', 'The days go out one by one. Torches buy you a few more.', [grp(3, ['fracture-wraith', 'yesterday-wolf']), grp(2, ['tomorrow-golem', 'paradox-hound']), grp(1, [elite('fracture-wraith')])]),
  dg('throne-of-tides', 'The Throne of Tides', 'drowned-kingdom', 82, 'dungeon', 7, true, 'court-chamberlain', 'The audience hall of the drowned court, where the Chamberlain still announces the guests.', 'flood', 'The hall floods with the tide. Wait on the dais.', [grp(3, ['drowned-hussar', 'trident-guard']), grp(2, ['kelp-queen', 'crown-crab']), grp(1, [elite('trident-guard')])]),
  dg('sunken-armory', 'The Sunken Armory', 'drowned-kingdom', 85, 'dungeon', 7, true, 'drowned-queen', 'The Queen’s armory, still orderly, with an honor guard at every rack.', 'cycle', 'The armory gates cycle with the tide-bell: twenty open, twenty shut.', [grp(3, ['trident-guard', 'siren-consort', 'drowned-hussar']), grp(2, ['pearl-lich', 'leviathan-calf']), grp(1, [elite('pearl-lich')])], true),
  dg('the-great-works', 'The Great Works', 'clockwork-city', 86, 'dungeon', 7, true, 'master-assembler', 'The vast factory at the city’s heart: every wall a conveyor, every floor a belt.', 'cycle', 'The belts reverse every twenty steps. Cross when they turn.', [grp(3, ['grinder-drone', 'brass-citizen', 'lathe-spider']), grp(2, ['piston-giant', 'arc-engine']), grp(1, [elite('piston-giant')])], true),
  dg('regents-tower', 'The Regent’s Tower', 'clockwork-city', 89, 'dungeon', 8, true, 'prime-regent', 'A spire of brass floors, each guarded by a regent’s servant, climbing to a throne that never turns.', 'dark', 'The tower’s lamps are off to save fuel. Torches, please.', [grp(3, ['regent-guard', 'regent-guard', 'whistle-wraith']), grp(2, ['arc-engine', 'grinder-drone']), grp(1, [elite('regent-guard')])]),
  dg('the-quenching-hall', 'The Quenching Hall', 'the-godforge', 88, 'volcanic', 7, true, 'forgewright-ember', 'A vast hall of cooling troughs, each full of a different sort of heat.', 'flood', 'The troughs fill and drain with the great bellows. Wait for the ebb.', [grp(3, ['quench-hound', 'forge-seraph']), grp(2, ['apprentice-of-flame', 'spark-sprite', 'spark-sprite']), grp(1, [elite('forge-seraph')])], true),
  dg('unfinished-pantheon', 'The Unfinished Pantheon', 'the-godforge', 90, 'dungeon', 8, true, 'the-unfinished-god', 'A gallery of gods set aside half-made: a hand with no arm, a face with no name, a throne with no seat.', 'dark', 'The gallery has no light but the sparks. Take Torches.', [grp(3, ['godsteel-golem', 'hammer-saint', 'slag-colossus']), grp(2, ['forge-seraph', 'apprentice-of-flame']), grp(1, [elite('hammer-saint')])], true),
];

// ---------------------------------------------------------------- areas, passes

type AreaRow = [id: string, name: string, zone: string, theme: AreaTheme, description: string, lore: string];
const AREA_ROWS: AreaRow[] = [
  ['golden-stair', 'The Golden Stair', 'celestial-realm', 'peak', 'A stair of gold with no top that anyone has seen.', 'The stair is real. The top is a matter of opinion.'],
  ['cloud-garden', 'The Cloud Garden', 'celestial-realm', 'grove', 'Silver flowers in banks of cloud, tended by someone who never sleeps.', 'The gardener left a note: “Do not pick the dawnflower. It is not yet ripe.”'],
  ['hymn-ruin', 'The Ruin of Hymns', 'celestial-realm', 'ruin', 'A fallen choir loft, still faintly ringing.', 'The ringing is the last note. It will not die.'],
  ['sunset-camp', 'The Sunset Camp', 'celestial-realm', 'camp', 'A camp of tired angels who have been on leave for three hundred years.', 'Their captain has stopped asking for orders.'],
  ['lampless-shore', 'The Lampless Shore', 'the-abyss', 'shore', 'A black beach of fine silt, and a tide that does not break.', 'No ship has ever landed here. A few have been invited.'],
  ['whisper-cave', 'The Whispering Cave', 'the-abyss', 'cave', 'A cave that repeats the last thing you said, to the wrong person.', 'The cave is fond of misunderstandings.'],
  ['sunken-observatory', 'The Sunken Observatory', 'the-abyss', 'ruin', 'A dome of glass at the bottom of everything, pointed up.', 'It is still watching for a star. Any star.'],
  ['mirror-reef', 'The Mirror Reef', 'the-abyss', 'grove', 'A reef of black glass, in which each coral is a different version of you.', 'The reef bows to the one it likes best.'],
  ['crack-in-noon', 'The Crack in Noon', 'shattered-timeline', 'peak', 'A ridge where the afternoon has split and the sun is in two places.', 'Stand in the middle and you are both early and late.'],
  ['dead-clocktower', 'The Dead Clocktower', 'shattered-timeline', 'ruin', 'A tower whose clock shows every hour at once.', 'Its bell has not rung in a day that exists.'],
  ['what-might-grove', 'The What-Might Grove', 'shattered-timeline', 'grove', 'Orchards of fruit that could have been, hanging on trees that were not planted.', 'The fruit tastes like the road not taken. Do not eat the second one.'],
  ['splinter-camp', 'The Splinter Camp', 'shattered-timeline', 'camp', 'A camp of refugees from tomorrow, sitting on their luggage.', 'They say there is nothing there. It is a long way to come to say so.'],
  ['courtiers-reef', 'The Courtiers’ Reef', 'drowned-kingdom', 'grove', 'Coral courtiers in rows, bowing to a throne that has gone.', 'They will bow to you if you stand still long enough.'],
  ['pearl-market', 'The Pearl Market', 'drowned-kingdom', 'camp', 'Stalls of pearls and nacre, kept by drowned merchants who have no concept of closing time.', 'The prices are in the currency of regret.'],
  ['kings-cistern', 'The King’s Cistern', 'drowned-kingdom', 'cave', 'A vaulted tank where the kingdom’s tears were kept.', 'It is nearly full.'],
  ['crown-wreck', 'The Crown Wreck', 'drowned-kingdom', 'ruin', 'The royal galleon, aground on its own reef.', 'The Queen would not leave the ship. It would not leave her.'],
  ['brass-avenue', 'Brass Avenue', 'clockwork-city', 'district', 'A boulevard of brass paving and gas-lamps that tick.', 'The pedestrians have never been late.'],
  ['gear-market', 'The Gear Market', 'clockwork-city', 'camp', 'Stalls of springs, wheels and mainsprings, sold by weight.', 'Every gear here was once somebody’s heart.'],
  ['boiler-park', 'Boiler Park', 'clockwork-city', 'grove', 'A park of copper trees that breathe steam.', 'The benches are warm, and not just from the sun.'],
  ['whistle-yard', 'The Whistle Yard', 'clockwork-city', 'ruin', 'A yard of silent whistles, each waiting to be blown.', 'When they are blown, the city changes shift. Nobody has blown them in a year.'],
  ['anvil-fields', 'The Anvil Fields', 'the-godforge', 'peak', 'A plain of anvils, cold, in rows, each one marked with a god’s name.', 'Some of the names were never spoken.'],
  ['quench-pool', 'The Quenching Pool', 'the-godforge', 'shore', 'A pool of slow-cooling light.', 'It is where gods rest after being made.'],
  ['ember-cathedral', 'The Ember Cathedral', 'the-godforge', 'ruin', 'A cathedral of glass and ember where the first prayers were smelted.', 'The congregation is made of ash. They sing well.'],
  ['hammer-hall', 'The Hammer Hall', 'the-godforge', 'camp', 'A hall of unclaimed hammers, each with a plaque and no name.', 'You can take one if you can lift it.'],
];

const AREA_BIOME: Record<string, AreaDef['biome']> = { 'celestial-realm': 'snow', 'the-abyss': 'cave', 'shattered-timeline': 'citadel', 'drowned-kingdom': 'coast', 'clockwork-city': 'citadel', 'the-godforge': 'volcanic' };
export const BATCH4_AREAS: AreaDef[] = AREA_ROWS.map(([id, name, zone, theme, description, lore]) => ({
  id, name, zone, theme, description, lore,
  biome: (theme === 'cave' ? 'cave' : AREA_BIOME[zone] ?? 'meadow') as AreaDef['biome'],
}));

export const BATCH4_PASSES: PassDef[] = [
  { id: 'stair-of-stars', name: 'The Stair of Stars', a: 'skyreach', b: 'celestial-realm' },
  { id: 'trench-gate', name: 'The Trench Gate', a: 'merrowdeep', b: 'the-abyss' },
  { id: 'cracked-hour', name: 'The Cracked Hour', a: 'dark-citadel', b: 'shattered-timeline' },
  { id: 'sunken-causeway', name: 'The Sunken Causeway', a: 'shattered-isles', b: 'drowned-kingdom' },
  { id: 'brass-lift', name: 'The Brass Lift', a: 'clockwork-foundry', b: 'clockwork-city' },
  { id: 'heart-stair', name: 'The Heart Stair', a: 'volcanic-rift', b: 'the-godforge' },
];

// ---------------------------------------------------------------- lore

const L = (id: string, zone: string, title: string, text: string): LoreDef => ({ id, zone, title, text });
export const BATCH4_LORE: LoreDef[] = [
  L('lore-celestial-watch', 'celestial-realm', 'The Long Watch', 'The Seraphim were told to guard the Realm until relieved. No one has relieved them. They have not asked who.'),
  L('lore-celestial-fall', 'celestial-realm', 'The Falling', 'An angel fell once, and the Realm closed over the hole in its floor like water. They do not speak of it. They polish the spot.'),
  L('lore-abyss-listening', 'the-abyss', 'What the Deep Hears', 'The Abyss is not silent. It is listening, and the sound it is listening for is you, finally agreeing with it.'),
  L('lore-abyss-lanterns', 'the-abyss', 'On the Lanterns', 'A lantern in the Trench is a last light. The one at the bottom is the first. It has never gone out, and nobody can reach it.'),
  L('lore-timeline-split', 'shattered-timeline', 'The Splitting', 'Time broke the day the gods fell silent. It did not break evenly. It broke where it hurt.'),
  L('lore-timeline-clocks', 'shattered-timeline', 'A Thousand Clocks', 'Every clock in the Hall of Hours is right. That is the trouble.'),
  L('lore-drowned-court', 'drowned-kingdom', 'The Court That Would Not Rise', 'The kingdom sank at the stroke of the coronation. The court has been seated ever since. The Queen has not yet said “rise”.'),
  L('lore-drowned-crown', 'drowned-kingdom', 'The Crown and the Crab', 'The crown was swallowed by the tide, and then by a crab. The crab is now the head of state. It has the necessary hands.'),
  L('lore-city-schedule', 'clockwork-city', 'The Schedule', 'The city runs to a schedule that nobody wrote. It was found, already written, on the first day. It has not been amended.'),
  L('lore-city-regent', 'clockwork-city', 'The Regent’s Confession', '“I was built to hold the throne until the king returned. The king did not return. I have been holding it ever since. It is heavier than it looks.”'),
  L('lore-forge-first', 'the-godforge', 'The First Strike', 'The first god was made with one blow of one hammer. The sound traveled the whole world, and some say it has not stopped.'),
  L('lore-forge-unfinished', 'the-godforge', 'The Unfinished', 'Some gods were never finished. They are not tragedies. They are potential, still warm, waiting for the next smith.'),
];

// ---------------------------------------------------------------- what the bosses say

export const BATCH4_BOSS_LINES: Record<string, [string, string, string]> = {
  'throne-warden': ['“None pass. None have passed. I was told to say it once more, in case.”', '“The gate must hold!”', '“Then it is open. Strange. I thought it would hurt more.”'],
  'voice-of-the-choir': ['Thirty thousand voices draw one breath. Then: “Welcome to the Final Chord.”', 'The choir splits into two keys. Both are furious.', 'The last note carries for a very long time, and then, kindly, stops.'],
  'deep-sovereign': ['“You came all this way to be heard. I have been listening. I hear nothing.”', '“SPEAK! SAY SOMETHING TRUE!”', '“…Yes. That. That was it.”'],
  'the-drowned-hour': ['The water goes still. The still water has a face.', 'The face lengthens, and the hour with it.', 'The tide turns. The hour is allowed, at last, to be over.'],
  chronarch: ['“Every day is mine. You have arrived on several. Choose one to lose.”', '“Time bends to me. It is bending now.”', '“The day… ends… as all days… do.”'],
  'the-unmade-moment': ['“I should have happened. I would have been wonderful. Why did no one let me?”', '“Undo it! Undo all of it!”', '“I have been, then. Even if only now. Even if only for you.”'],
  'court-chamberlain': ['“Announcing: a guest. At last. Please wait to be seated. It may be some time.”', '“The Queen is not receiving, but I am. Briefly. Violently.”', '“Announcing… nothing… for the first time.”'],
  'drowned-queen': ['“We have not been introduced. I am the Queen. Bow, or sink.”', '“MY KINGDOM IS MY FACE!”', '“Let it go under. Let it all go. I will get up now.”'],
  'master-assembler': ['“UNIT REQUIRED. UNIT BEING MANUFACTURED. YOU ARE A VALID INPUT.”', '“QUALITY CONTROL FAILURE. REBUILD.”', '“ORDER… FULFILLED. SHUTTING DOWN. THANK YOU.”'],
  'prime-regent': ['“I am the Regent, the Prime, the First. Sit, if you would like. It will not take long.”', '“THE THRONE IS NOT FOR SITTING!”', '“Take it. It is heavier than it looks. I could not put it down.”'],
  'forgewright-ember': ['“Welcome to the forge! I am hot, I am busy, and you are in my way.”', '“You will be pig-iron by morning!”', '“One last pour… let it cool… let it rest…”'],
  'the-unfinished-god': ['A face half-made turns toward you and tries to remember what it was going to say.', 'Its hands are the wrong size. It uses them anyway.', 'The last hammer-stroke lands. The god looks at its hands, and says: “Thank you.”'],
  'arch-seraph-aurial': ['“I have judged them all. I have never been judged. Do it. Please.”', '“YOU ARE FOUND LACKING!”', '“…Found. That is the word. I was lacking. Thank you for finding.”'],
  'the-abyssal-mother': ['The water rises as something very old and very patient opens an eye.', 'The dark closes around you like a gentle, enormous hand.', 'The Abyss lets out its breath. It had been holding it for ever.'],
  'the-last-tick': ['“I am the last second. After me there is nothing. Please be quick.”', '“AFTER ME THERE IS NO AFTER!”', '“Oh. There is an after. I had forgotten. Thank you.”'],
  'the-drowned-throne': ['The throne creaks and rises on its own legs. “Who sits? None. None. The throne sits you.”', 'Water pours off its arms in sheets.', 'The throne subsides into the silt, and is, at last, only a chair.'],
  'the-great-gear': ['The great wheel turns. Every smaller wheel in the city turns with it.', 'The gear begins to turn faster. The city shrieks.', 'The wheel stops. For the first time, the city is silent, and for the first time, the city is free.'],
  'the-godforge-heart': ['The furnace flares. Somewhere, something is asking to be shaped.', 'Godfire pours out of the vents in a flood of gold.', 'The forge banks to embers, quiet, bright, and, at last, content.'],
};
