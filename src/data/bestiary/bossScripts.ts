import type { EffectSpec } from '../../engine/effects/types';
import type { BossPhaseDef, BossScriptDef, BossTelegraphDef } from '../../engine/combat/types';
import type { SkillDef } from '../../engine/skills/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';

const enemy = (s: Omit<SkillDef, 'source' | 'maxRank' | 'cost' | 'cooldown'>): SkillDef => ({ maxRank: 5, cost: {}, cooldown: 0, ...s, source: 'enemy' });
const st = (status: string, duration: number, chance?: number): EffectSpec => ({ kind: 'applyStatus', status, duration, ...(chance !== undefined ? { chance } : {}) });

/**
 * Telegraphed boss attacks: about twice as strong as a boss's ordinary
 * skills, because the party sees them coming a turn ahead.
 */
export const BOSS_SKILLS: SkillDef[] = [
  enemy({ id: 'crushing-blow', name: 'Crushing Blow', description: 'A colossal blow on one target.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', stagger: 3, damage: { stat: 'physicalAttack', multiplier: 2.55, perRank: 0.15 }, effects: [st('stun', 1, 50)] }),
  enemy({ id: 'earthshatter', name: 'Earthshatter', description: 'Splits the ground under the whole party.', tags: ['Attack', 'Physical', 'AoE'], element: 'physical', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 1.44, perRank: 0.1 }, effects: [st('stun', 1, 30)] }),
  enemy({ id: 'broadside', name: 'Broadside', description: 'Every gun fires at once.', tags: ['Attack', 'Ranged', 'Physical', 'AoE'], element: 'physical', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 1.53, perRank: 0.1 } }),
  enemy({ id: 'piercing-volley', name: 'Piercing Volley', description: 'Arrows through the whole party.', tags: ['Attack', 'Ranged', 'Physical', 'AoE'], element: 'physical', targeting: 'allEnemies', damage: { stat: 'physicalAttack', multiplier: 1.27, perRank: 0.1 }, effects: [st('bleed', 2, 50)] }),
  enemy({ id: 'inferno', name: 'Inferno', description: 'A firestorm over the whole party.', tags: ['Spell', 'Fire', 'AoE'], element: 'fire', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.53, perRank: 0.1 }, effects: [st('burn', 3)] }),
  enemy({ id: 'glacial-tomb', name: 'Glacial Tomb', description: 'Ice closes over the whole party.', tags: ['Spell', 'Ice', 'AoE'], element: 'ice', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.36, perRank: 0.1 }, effects: [st('freeze', 1, 35)] }),
  enemy({ id: 'tidal-wave', name: 'Tidal Wave', description: 'A wall of black water.', tags: ['Spell', 'Ice', 'AoE'], element: 'ice', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.44, perRank: 0.1 }, effects: [st('wet', 3), st('slow', 2)] }),
  enemy({ id: 'thunderstorm', name: 'Thunderstorm', description: 'Lightning falls on everyone.', tags: ['Spell', 'Lightning', 'AoE'], element: 'lightning', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.53, perRank: 0.1 }, effects: [st('stun', 1, 25)] }),
  enemy({ id: 'blight-bloom', name: 'Blight Bloom', description: 'Poison flowers burst open around the party.', tags: ['Spell', 'Nature', 'Poison', 'AoE'], element: 'nature', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.1, perRank: 0.08 }, effects: [{ kind: 'applyStatus', status: 'poison', duration: 3, stacks: 2 }] }),
  enemy({ id: 'grave-toll', name: 'Grave Toll', description: 'A bell only the dead should hear.', tags: ['Spell', 'Shadow', 'AoE'], element: 'shadow', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.36, perRank: 0.1 }, effects: [st('weaken', 2)] }),
  enemy({ id: 'shard-storm', name: 'Shard Storm', description: 'A storm of razor crystal.', tags: ['Spell', 'Arcane', 'AoE'], element: 'arcane', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.44, perRank: 0.1 }, effects: [st('bleed', 2, 40)] }),
  enemy({ id: 'doom-mark', name: 'Doom Mark', description: 'A killing curse on one target.', tags: ['Spell', 'Shadow', 'Curse'], element: 'shadow', targeting: 'enemy', damage: { stat: 'magicAttack', multiplier: 2.72, perRank: 0.15 }, effects: [st('curse', 3)] }),
  enemy({ id: 'final-judgment', name: 'Final Judgment', description: 'Ten gods pass sentence at once.', tags: ['Spell', 'Holy', 'AoE'], element: 'holy', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.6, perRank: 0.1 }, effects: [st('weaken', 2)] }),
  enemy({ id: 'unmaking', name: 'Unmaking', description: 'Reality comes apart around the party.', tags: ['Spell', 'Void', 'AoE'], element: 'void', targeting: 'allEnemies', damage: { stat: 'magicAttack', multiplier: 1.61, perRank: 0.1 }, effects: [st('vulnerable', 2)] }),
];

// ---------------------------------------------------------------- helpers

/** The last fights of the main story enrage later, so slow, steady heroes (healers, summoners) can still finish them. */
const STORY_FINALE_ENRAGE = 75;
const tel = (skillId: string, every: number, warning: string, fromPhase?: number): BossTelegraphDef => ({ skillId, every, warning, ...(fromPhase !== undefined ? { fromPhase } : {}) });
const phase = (hpPct: number, name: string, text: string, rest: Omit<BossPhaseDef, 'hpPct' | 'name' | 'text'> = {}): BossPhaseDef => ({ hpPct, name, text, ...rest });
const dmg = (value: number): ModifierSpec => ({ stat: 'damageBonus', type: 'flat', value });
const speed = (value: number): ModifierSpec => ({ stat: 'speed', type: 'more', value });
const armor = (value: number): ModifierSpec => ({ stat: 'defense', type: 'percent', value });
const heal = (percentMaxHp: number): EffectSpec => ({ kind: 'heal', percentMaxHp, target: 'self' });
const shield = (percentMaxHp: number): EffectSpec => ({ kind: 'shield', percentMaxHp, target: 'self' });

/** Scripts for the dungeon, world and story bosses. */
export const BOSS_SCRIPTS: BossScriptDef[] = [
  // ---------------- Dungeon bosses ----------------
  { id: 'goblin-king', phases: [phase(50, 'Call the Warband', 'The Goblin King bangs his pot-lid crown: “LADS! TO ME!”', { adds: ['goblin-cutthroat'] })], telegraphs: [tel('crushing-blow', 4, 'The Goblin King raises his oversized club over his head…')] },
  { id: 'broodmother', phases: [phase(60, 'The Clutch Hatches', 'An egg sac splits along the wall.', { adds: ['forest-spider'] }), phase(30, 'Frenzy', 'The Broodmother skitters faster, mad with hunger.', { modifiers: [speed(15)] })], telegraphs: [tel('blight-bloom', 5, 'The Broodmother swells with venom…')] },
  { id: 'bone-lord', phases: [phase(66, 'Rise', 'The Bone Lord lifts a hand, and the floor gives up its dead.', { adds: ['skeleton-soldier', 'skeleton-soldier'] }), phase(33, 'Death’s Embrace', 'Shadow pours into the cracks in his bones.', { modifiers: [dmg(25)], effects: [heal(12)] })], telegraphs: [tel('grave-toll', 4, 'The Bone Lord reaches for a bell of black iron…')] },
  { id: 'tide-hag', phases: [phase(50, 'The Drowned Answer', 'The Tide Hag sings, and the drowned climb out of the water.', { adds: ['drowned-sailor', 'drowned-sailor'] })], telegraphs: [tel('tidal-wave', 4, 'The water around the Tide Hag begins to rise…')] },
  { id: 'sun-king', phases: [phase(50, 'The Sun Sets', 'The Sun-King’s gold turns black. A servant shambles from its tomb.', { modifiers: [dmg(20)], effects: [shield(15)], adds: ['mummy'] })], telegraphs: [tel('doom-mark', 4, 'The Sun-King points a withered finger at you…')] },
  { id: 'frost-queen', phases: [phase(60, 'Court of Ice', 'The Frost Queen summons her guard.', { adds: ['ice-elemental'] }), phase(30, 'Absolute Zero', 'The air itself begins to freeze.', { modifiers: [dmg(15)] })], telegraphs: [tel('glacial-tomb', 4, 'Frost spreads from the Frost Queen’s feet toward you…')] },
  { id: 'pirate-captain', phases: [phase(50, 'All Hands!', 'The Captain whistles, and two corsairs swing down from the rigging.', { adds: ['corsair', 'corsair'] })], telegraphs: [tel('broadside', 4, '“Run out the guns!” The cannons swing toward you…')] },
  { id: 'leviathan-spawn', phases: [phase(50, 'Surfacing', 'The Leviathan Spawn rises fully out of the water.', { modifiers: [dmg(25), armor(-20)] })], telegraphs: [tel('tidal-wave', 4, 'The Leviathan Spawn dives… the water bulges…')] },
  { id: 'magma-titan', phases: [phase(66, 'Eruption', 'Magma spills from the Titan’s cracks and takes shape.', { adds: ['magma-elemental'] }), phase(33, 'Molten Core', 'The Titan’s shell falls away. Its core burns white.', { modifiers: [dmg(20), armor(-30)] })], telegraphs: [tel('inferno', 5, 'The Magma Titan’s core glows brighter and brighter…')] },
  { id: 'void-commander', phases: [phase(66, 'Reinforcements', 'The Void Commander calls a knight through the rift.', { adds: ['void-knight'] }), phase(33, 'No Retreat', 'The rift tears wider behind him. There is nowhere left to fall back to.', { modifiers: [dmg(20)] })], telegraphs: [tel('unmaking', 5, 'The Void Commander raises his blade, and the light bends toward it…')] , enrageTurns: STORY_FINALE_ENRAGE },

  // ---------------- World bosses ----------------
  { id: 'bramblehorn', phases: [phase(50, 'Stampede', 'Bramblehorn paws the ground and lowers its antlers.', { modifiers: [dmg(10)] })], telegraphs: [tel('earthshatter', 6, 'Bramblehorn rears up on its hind legs…')] },
  { id: 'gnarlroot', phases: [phase(50, 'The Grove Wakes', 'A sapling tears its roots free to defend the elder.', { adds: ['treant-sapling'] })], telegraphs: [tel('blight-bloom', 6, 'Black flowers open along Gnarlroot’s branches…')] },
  { id: 'abyssal-crab', phases: [phase(50, 'Shell Cracks', 'The shell splits. What is inside is angrier.', { modifiers: [armor(-30), dmg(30)] })], telegraphs: [tel('crushing-blow', 6, 'The Abyssal Crab opens its great claw wide…')] },
  { id: 'sandworm', phases: [phase(60, 'Nest', 'A giant scorpion bursts out of the sand where the worm surfaced.', { adds: ['sand-scorpion'] })], telegraphs: [tel('earthshatter', 6, 'The sand begins to sink beneath you…')] },
  { id: 'frost-wyrm', phases: [phase(50, 'Wings Unfurled', 'The Frost Wyrm takes to the air.', { modifiers: [dmg(15)] })], telegraphs: [tel('glacial-tomb', 6, 'The Frost Wyrm draws a long, freezing breath…')] },
  { id: 'storm-roc', phases: [phase(50, 'Eye of the Storm', 'The Storm Roc climbs into the clouds and dives.', { modifiers: [speed(15)] })], telegraphs: [tel('thunderstorm', 6, 'Clouds gather around the Storm Roc’s wings…')] },
  { id: 'ember-matriarch', phases: [phase(30, 'Ashfall', 'Ash falls like snow. The Matriarch burns hotter.', { modifiers: [dmg(25)] })], telegraphs: [tel('inferno', 6, 'Fire gathers in the Ember Matriarch’s throat…')] },
  { id: 'unwritten-herald', phases: [phase(50, 'Erasing', 'The Herald unwrites the air around it, and its words grow sharper.', { modifiers: [dmg(20)] })], telegraphs: [tel('unmaking', 6, 'The Herald begins to read your name aloud…')] },

  // ---------------- Story bosses ----------------
  { id: 'deacon-mott', phases: [phase(50, 'Unanswered Prayer', '“Still nothing? Then I will answer myself.” Mott’s wounds knit with shadow.', { effects: [heal(15)] })], telegraphs: [tel('doom-mark', 5, 'Mott begins a prayer to no god at all…')] },
  { id: 'varn-the-hollow', phases: [phase(50, 'The Pack', 'Varn whistles, and another wolf comes out of the trees.', { adds: ['dire-wolf'] })], telegraphs: [tel('piercing-volley', 4, 'Varn nocks three arrows at once…')] },
  { id: 'shard-warden', phases: [phase(50, 'Fracture', 'A shard breaks off the Warden and stands up on its own.', { adds: ['crystal-golem'] })], telegraphs: [tel('shard-storm', 4, 'The Shard-Warden’s crystals begin to hum…')] },
  { id: 'captain-idris', phases: [phase(50, 'Paid in Full', '“Earn your coin, boys!” A raider rushes in.', { adds: ['desert-raider'], modifiers: [dmg(15)] })], telegraphs: [tel('crushing-blow', 4, 'Idris crosses her sabres and steps in close…')] },
  { id: 'wight-of-orren', phases: [phase(60, 'The Saint Remembers', 'For a moment the Wight hesitates. Then it remembers what it has become.', { effects: [shield(15)] }), phase(30, 'Last Rites', 'The Wight speaks the last rites, over you.', { modifiers: [dmg(25)] })], telegraphs: [tel('grave-toll', 4, 'The Wight lifts the bell of Saint Orren’s chapel…')] },
  { id: 'admiral-vey', phases: [phase(50, 'Boarders Away', 'Vey’s crew comes over the rail.', { adds: ['corsair'] })], telegraphs: [tel('thunderstorm', 4, 'Vey raises her axe to the sky, and the storm answers…')] },
  { id: 'severance-engine', phases: [phase(66, 'Overclock', 'The Engine’s gears spin faster than they were ever meant to.', { modifiers: [speed(25)] }), phase(33, 'Breach', 'A seam in the Engine opens onto nothing. Something crawls out.', { adds: ['void-wraith'], modifiers: [dmg(20)] })], telegraphs: [tel('unmaking', 5, 'The Severance Engine winds up to cut you loose from everything…')] , enrageTurns: STORY_FINALE_ENRAGE },
  { id: 'seryth', phases: [phase(70, 'Oathbreaker', '“Every god I ever served lied to me.” Seryth’s blade burns black.', { modifiers: [dmg(20)] }), phase(35, 'What Answered', 'Something behind Seryth’s eyes looks out at you. His knight rises again.', { adds: ['hollow-knight'], modifiers: [speed(15)] })], telegraphs: [tel('doom-mark', 5, 'Seryth points his sword at your heart…'), tel('unmaking', 6, 'The void gathers around Seryth like a cloak…', 1)] , enrageTurns: STORY_FINALE_ENRAGE },
  { id: 'shadow-of-the-unwritten', phases: [phase(66, 'The Margins', 'Wraiths step out of the blank spaces around you.', { adds: ['void-wraith'] }), phase(33, 'Erasure', 'The Shadow begins to erase the room, and you in it.', { modifiers: [dmg(30)] })], telegraphs: [tel('unmaking', 5, 'The Shadow opens like a book with no words…')] , enrageTurns: STORY_FINALE_ENRAGE },
  { id: 'korga-rival', phases: [phase(50, 'Blood Up', 'Korga grins through the blood. “NOW we fight.”', { modifiers: [dmg(25)] })], telegraphs: [tel('crushing-blow', 4, 'Korga hefts her greataxe two-handed…')] },
  { id: 'legion-champion', phases: [phase(50, 'The Crowd Roars', 'The arena roars for its champion.', { modifiers: [speed(15), dmg(15)] })], telegraphs: [tel('crushing-blow', 4, 'The Legion Champion sets his feet for the killing blow…')] },
  { id: 'bone-priest', phases: [phase(50, 'Unholy Rite', 'The Bone Priest finishes a rite, and the dead rise to serve.', { adds: ['skeleton-soldier'] })], telegraphs: [tel('grave-toll', 5, 'The Bone Priest rings a bone chime…')] },
  { id: 'warchief-gorza', phases: [phase(50, 'Warband', '“You think I came alone?”', { adds: ['desert-raider'], modifiers: [dmg(15)] })], telegraphs: [tel('earthshatter', 4, 'Gorza lifts Skullsplitter high above his head…')] },
  { id: 'unwritten-page', phases: [phase(50, 'Blank Verse', 'The Page turns, and its words grow sharper.', { modifiers: [dmg(25)] })], telegraphs: [tel('shard-storm', 4, 'The Page’s words lift off it and point at you…')] },
  { id: 'drowned-choir', phases: [phase(50, 'Second Verse', 'The Choir sings louder, and a sailor climbs out of the deep.', { adds: ['drowned-sailor'] })], telegraphs: [tel('tidal-wave', 4, 'The Drowned Choir draws breath for the chorus…')] },

  // ---------------- Aspects (Trials of Apostleship) ----------------
  // Gods' Aspects are long, careful fights; they enrage late.
  ...['solenne', 'morrath', 'kael', 'ysolde', 'vex', 'thalor', 'nymira', 'aurelis', 'hesha', 'grimvald'].map((god): BossScriptDef => ({ id: `aspect-${god}`, phases: [], telegraphs: [], enrageTurns: 80, enrageText: 'The Aspect’s patience ends. Its full divinity bears down on you.' })),
  // ---------------- Twilight of the Gods ----------------
  { id: 'the-nameless-one', phases: [phase(66, 'The Blank Page', 'The Nameless One turns a page that is not there. False heralds step out of it.', { adds: ['false-herald'] }), phase(33, 'Unwriting', 'It begins to erase you, letter by letter.', { modifiers: [dmg(25)] })], telegraphs: [tel('unmaking', 5, 'The Nameless One opens its hands, and the world between them goes blank…'), tel('doom-mark', 5, 'It reads your name aloud, slowly…', 1)], enrageText: 'The Nameless One stops pretending to be patient.' },
  { id: 'the-last-light', phases: [phase(60, 'Ten Voices', 'The Last Light splits into ten voices, all of them furious.', { modifiers: [speed(15)] }), phase(30, 'Last Rites', 'The pantheon throws everything it has left at you.', { modifiers: [dmg(25)], effects: [shield(15)] })], telegraphs: [tel('final-judgment', 4, 'The Last Light raises ten hands in judgment…')] },
];
