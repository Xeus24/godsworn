import type { EncounterDef } from '../../engine/combat/types';
import type { Cond, DialogueDef, NpcDef, QuestDef } from '../../engine/quests/types';
import { flat, pct } from '../trees/builder';
import { buildCompanions, GREATER_DIALOGUES, GREATER_QUESTS, type BaseCompanion } from './companionsGreater';
import { ROMANCE_DIALOGUES } from './romance';
import { all, approve, at, check, choice, dialogue, encounter, escort, favor, fight, flag, gold, level, lines, mercy, near, rep, say, setFlag, stage, stat, talk } from './helpers';

/**
 * Six companions, one or two per town. Each follows a god (approving when
 * you earn its favor), has likes and dislikes, a bond tree of four tiers
 * (pick one of two perks at 20/40/60/80 approval) and an oath perk earned
 * by finishing their personal quest.
 */
const BASE_COMPANIONS: BaseCompanion[] = [
  {
    id: 'aldric', name: 'Brother Aldric', title: 'Priest of Solenne', raceId: 'human', classId: 'cleric', birthSignId: 'the-dawn', portrait: 1, god: 'solenne', town: 'brightwater', specialization: 'saint', startApproval: 20,
    bio: 'A young priest of Brightwater who still believes the gods are listening. He prays very loudly at people.',
    likes: [{ event: 'kill', enemyType: 'undead', amount: 1, cap: 4, text: 'Smiting the dead' }, { event: 'questDone', amount: 2, text: 'Helping people' }, { event: 'mercy', amount: 5, text: 'Mercy' }, { event: 'heal', amount: 0.3, cap: 2, text: 'Healing' }],
    dislikes: [{ event: 'summon', amount: -2, cap: -6, text: 'Raising the dead' }, { event: 'goldStolen', amount: -2, cap: -6, text: 'Stealing' }, { event: 'battleFled', amount: -1, text: 'Running from evil' }],
    bond: [
      { approval: 20, options: [{ id: 'aldric-steady', name: 'Steady Hands', description: '+15 Healing Power.', modifiers: [flat('healingPower', 15)] }, { id: 'aldric-sunlit', name: 'Sunlit Fury', description: '+12% Holy damage.', modifiers: [flat('holyDamage', 12)] }] },
      { approval: 40, options: [{ id: 'aldric-ward', name: 'Morning Ward', description: 'Every ally starts battle with a shield of 8% of max HP.', triggers: [{ id: 'aldric-ward', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 8, target: 'allAllies' }] }] }, { id: 'aldric-zeal', name: 'Zeal', description: '+8% max HP and +10 Status Resist.', modifiers: [pct('maxHp', 8), flat('statusResist', 10)] }] },
      { approval: 60, options: [{ id: 'aldric-prayer', name: 'Answered Prayer', description: 'Once per battle, below 30% HP: heal every ally for 20%.', triggers: [{ id: 'aldric-prayer', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'heal', percentMaxHp: 20, target: 'allAllies' }] }] }, { id: 'aldric-lance', name: 'Lance of Dawn', description: '+15% Divine Power and +10% Magic Attack.', modifiers: [pct('divinePower', 15), pct('magicAttack', 10)] }] },
      { approval: 80, options: [{ id: 'aldric-saint', name: 'Living Saint', description: '+20 Healing Power and +10% Ultimate Charge.', modifiers: [flat('healingPower', 20), flat('ultimateGain', 10)] }, { id: 'aldric-unbroken', name: 'Unbroken Faith', description: '+15% max HP and +10% defense.', modifiers: [pct('maxHp', 15), pct('defense', 10)] }] },
    ],
    oath: { id: 'aldric-oath', name: 'Lantern-Bearer', description: '+10% damage and +10 Holy resistance; heals the party 5% at the start of each turn of his.', modifiers: [flat('damageBonus', 10), flat('holyResist', 10)], triggers: [{ id: 'aldric-lantern', trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: 5, target: 'allAllies' }] }] },
    recruitQuest: 'main-1', personalQuest: 'aldric-lantern',
  },
  {
    id: 'fenn', name: 'Fenn Ashwhistle', title: 'Lone Hunter', raceId: 'beastkin', classId: 'ranger', birthSignId: 'the-banner', portrait: 2, god: 'ysolde', town: 'thornwick', specialization: 'beastmaster', startApproval: 15,
    bio: 'A beastkin hunter whose family was killed by poachers. Talks to her wolf more than to people, and the wolf talks back.',
    likes: [{ event: 'kill', enemyType: 'bandit', amount: 1, cap: 3, text: 'Hunting poachers and bandits' }, { event: 'skillTag', tag: 'Nature', amount: 0.3, cap: 2, text: 'Nature magic' }, { event: 'rest', amount: 1, text: 'Sleeping under the stars' }],
    dislikes: [{ event: 'salvage', amount: -1, cap: -3, text: 'Waste' }, { event: 'battleFled', amount: -1, text: 'Leaving the pack behind' }],
    bond: [
      { approval: 20, options: [{ id: 'fenn-eye', name: 'Hunter’s Eye', description: '+5% crit chance.', modifiers: [flat('critChance', 5)] }, { id: 'fenn-fleet', name: 'Fleet', description: '+6 dodge.', modifiers: [flat('dodge', 6)] }] },
      { approval: 40, options: [{ id: 'fenn-venom', name: 'Barbed Arrows', description: '+12% Nature damage and +10 Status Chance.', modifiers: [flat('natureDamage', 12), flat('statusChance', 10)] }, { id: 'fenn-pack', name: 'Pack Tactics', description: '+10% physical attack.', modifiers: [pct('physicalAttack', 10)] }] },
      { approval: 60, options: [{ id: 'fenn-first', name: 'First Shot', description: 'Acts sooner: +12% speed.', modifiers: [pct('speed', 12)] }, { id: 'fenn-kill', name: 'Clean Kill', description: 'Kills restore 8% of her HP.', triggers: [{ id: 'fenn-kill', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 8, target: 'self' }] }] }] },
      { approval: 80, options: [{ id: 'fenn-apex', name: 'Apex', description: '+20% crit damage and +5% crit chance.', modifiers: [flat('critDamage', 20), flat('critChance', 5)] }, { id: 'fenn-wild', name: 'Call of the Wild', description: '+10% damage and +8% max HP.', modifiers: [flat('damageBonus', 10), pct('maxHp', 8)] }] },
    ],
    oath: { id: 'fenn-oath', name: 'Last of the Pack', description: '+12% damage and +8% speed; her crits make the target Vulnerable.', modifiers: [flat('damageBonus', 12), pct('speed', 8)], triggers: [{ id: 'fenn-mark', trigger: 'onCrit', effects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2, target: 'target' }] }] },
    recruitQuest: 'fenn-recruit', personalQuest: 'fenn-pack',
  },
  {
    id: 'korga', name: 'Korga Ironhide', title: 'Sellsword', raceId: 'orc', classId: 'warrior', birthSignId: 'the-banner', portrait: 4, god: 'kael', town: 'sandhaven', specialization: 'berserker', startApproval: 10,
    bio: 'An orc sellsword who left her warband when it sold itself to the Unsworn. Fights to first blood. Probably.',
    likes: [{ event: 'battleWon', amount: 0.5, text: 'Winning' }, { event: 'kill', tiers: ['elite', 'champion', 'miniboss', 'boss', 'worldBoss'], amount: 2, cap: 6, text: 'Beating champions' }, { event: 'crit', amount: 0.2, cap: 2, text: 'Big hits' }],
    dislikes: [{ event: 'battleFled', amount: -5, text: 'Running' }, { event: 'mercy', amount: -2, text: 'Sparing enemies' }],
    bond: [
      { approval: 20, options: [{ id: 'korga-hide', name: 'Iron Hide', description: '+10% defense.', modifiers: [pct('defense', 10)] }, { id: 'korga-axe', name: 'Heavy Axe', description: '+10% physical attack.', modifiers: [pct('physicalAttack', 10)] }] },
      { approval: 40, options: [{ id: 'korga-taunt', name: 'Come Here', description: '+12% max HP; enemies hit her instead of the back row more often (front row, +defense).', modifiers: [pct('maxHp', 12), flat('defense', 10)] }, { id: 'korga-blood', name: 'Bloodlust', description: '+5% lifesteal.', modifiers: [flat('lifesteal', 5)] }] },
      { approval: 60, options: [{ id: 'korga-rage', name: 'Never Down', description: 'Once per battle, below 30% HP: heal 30% and go Berserk.', triggers: [{ id: 'korga-never-down', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'heal', percentMaxHp: 30, target: 'self' }, { kind: 'applyStatus', status: 'berserk', duration: 2, target: 'self' }] }] }, { id: 'korga-cleaver', name: 'Cleaver', description: '+15% crit damage and +3% crit chance.', modifiers: [flat('critDamage', 15), flat('critChance', 3)] }] },
      { approval: 80, options: [{ id: 'korga-warlord', name: 'Warlord’s Shout', description: 'Starts every battle Hasted, and the whole party with her.', triggers: [{ id: 'korga-shout', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'allAllies' }] }] }, { id: 'korga-titan', name: 'Titan', description: '+15% max HP and +10% damage.', modifiers: [pct('maxHp', 15), flat('damageBonus', 10)] }] },
    ],
    oath: { id: 'korga-oath', name: 'Blood-Sworn', description: '+15% damage and +10% defense; kills grant her a 10% shield.', modifiers: [flat('damageBonus', 15), pct('defense', 10)], triggers: [{ id: 'korga-sworn', trigger: 'onKill', effects: [{ kind: 'shield', percentMaxHp: 10, target: 'self' }] }] },
    recruitQuest: 'korga-recruit', personalQuest: 'korga-blood',
  },
  {
    id: 'ilyra', name: 'Ilyra Vael', title: 'Guild Mage', raceId: 'elf', classId: 'mage', birthSignId: 'the-tome', portrait: 3, god: 'aurelis', town: 'frosthold', specialization: 'chronomancer', startApproval: 10,
    bio: 'A brilliant, impatient elf of the Mages’ Guild who has been banned from three libraries and is proud of all three.',
    likes: [{ event: 'bookRead', amount: 4, text: 'Reading skillbooks' }, { event: 'identify', amount: 1, cap: 3, text: 'Identifying artifacts' }, { event: 'skillTag', tag: 'Spell', amount: 0.2, cap: 2, text: 'Spellcraft' }],
    dislikes: [{ event: 'salvage', amount: -1, cap: -3, text: 'Destroying enchanted things' }, { event: 'battleFled', amount: -1, text: 'Cowardice' }],
    bond: [
      { approval: 20, options: [{ id: 'ilyra-focus', name: 'Focus', description: '+10% Magic Attack.', modifiers: [pct('magicAttack', 10)] }, { id: 'ilyra-well', name: 'Deep Well', description: '+15% max MP and +3 MP regeneration.', modifiers: [pct('maxMp', 15), flat('mpRegen', 3)] }] },
      { approval: 40, options: [{ id: 'ilyra-frost', name: 'Frostweave', description: '+15% Ice damage.', modifiers: [flat('iceDamage', 15)] }, { id: 'ilyra-ember', name: 'Emberweave', description: '+15% Fire damage.', modifiers: [flat('fireDamage', 15)] }] },
      { approval: 60, options: [{ id: 'ilyra-haste', name: 'Borrowed Time', description: '+8% cooldown reduction.', modifiers: [flat('cooldownReduction', 8)] }, { id: 'ilyra-ward', name: 'Arcane Ward', description: 'Starts battle with a shield of 15% max HP.', triggers: [{ id: 'ilyra-ward', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 15, target: 'self' }] }] }] },
      { approval: 80, options: [{ id: 'ilyra-genius', name: 'Genius', description: '+15% Magic Attack and +10% Ultimate Charge.', modifiers: [pct('magicAttack', 15), flat('ultimateGain', 10)] }, { id: 'ilyra-archmage', name: 'Archmage', description: '+10% damage and +10 Status Chance.', modifiers: [flat('damageBonus', 10), flat('statusChance', 10)] }] },
    ],
    oath: { id: 'ilyra-oath', name: 'Margin Notes', description: '+12% damage and +8% cooldown reduction; her spells restore 3 MP when they crit.', modifiers: [flat('damageBonus', 12), flat('cooldownReduction', 8)], triggers: [{ id: 'ilyra-notes', trigger: 'onCrit', effects: [{ kind: 'restoreMp', amount: 3, target: 'self' }] }] },
    recruitQuest: 'ilyra-recruit', personalQuest: 'ilyra-shelf',
  },
  {
    id: 'sable', name: 'Sable', title: 'Thief', raceId: 'human', classId: 'rogue', birthSignId: 'the-coin', portrait: 7, god: 'vex', town: 'saltmere', specialization: 'swashbuckler', startApproval: 10,
    bio: 'A Saltmere thief with a fast tongue, faster hands and an enormous debt she insists is "mostly hypothetical".',
    likes: [{ event: 'goldStolen', amount: 3, cap: 6, text: 'Stealing' }, { event: 'goldLooted', amount: 0.5, cap: 2, text: 'Getting paid' }, { event: 'gamble', amount: 2, text: 'Gambling' }, { event: 'crit', amount: 0.2, cap: 2, text: 'Clean work' }],
    dislikes: [{ event: 'battleLost', amount: -3, text: 'Getting caught' }, { event: 'battleFled', amount: -0.5, text: 'Running without the loot' }],
    bond: [
      { approval: 20, options: [{ id: 'sable-light', name: 'Light Fingers', description: '+10% gold find.', modifiers: [flat('goldFind', 10)] }, { id: 'sable-quick', name: 'Quick', description: '+8 dodge.', modifiers: [flat('dodge', 8)] }] },
      { approval: 40, options: [{ id: 'sable-knife', name: 'The Knife Trick', description: '+6% crit chance.', modifiers: [flat('critChance', 6)] }, { id: 'sable-luck', name: 'Lucky Coin', description: '+10% magic find and +5% damage.', modifiers: [flat('magicFind', 10), flat('damageBonus', 5)] }] },
      { approval: 60, options: [{ id: 'sable-vanish', name: 'Vanishing Act', description: 'Starts every battle in Stealth.', triggers: [{ id: 'sable-vanish', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'stealth', duration: 1, target: 'self' }] }] }, { id: 'sable-poison', name: 'Poisoned Blades', description: '+12% Poison/Nature damage and +10 Status Chance.', modifiers: [flat('natureDamage', 12), flat('statusChance', 10)] }] },
      { approval: 80, options: [{ id: 'sable-ace', name: 'Ace Up the Sleeve', description: '+25% crit damage.', modifiers: [flat('critDamage', 25)] }, { id: 'sable-fortune', name: 'Fortune Favors', description: '+10% damage and +8% speed.', modifiers: [flat('damageBonus', 10), pct('speed', 8)] }] },
    ],
    oath: { id: 'sable-oath', name: 'Partner in Crime', description: '+12% damage, +15% gold find; her crits Blind the target.', modifiers: [flat('damageBonus', 12), flat('goldFind', 15)], triggers: [{ id: 'sable-blind', trigger: 'onCrit', chance: 50, effects: [{ kind: 'applyStatus', status: 'blind', duration: 1, target: 'target' }] }] },
    recruitQuest: 'sable-recruit', personalQuest: 'sable-job',
  },
  {
    id: 'marisol', name: 'Marisol Tidesong', title: 'Singer to the Drowned', raceId: 'nephilim', classId: 'bard', birthSignId: 'the-raven', portrait: 5, god: 'nymira', town: 'saltmere', specialization: 'skald', startApproval: 15,
    bio: 'A nephilim bard who sings to the drowned of the Stormcoast so they stay in the sea. Laughs like thunder, cries at weddings.',
    likes: [{ event: 'skillTag', tag: 'Lightning', amount: 0.3, cap: 2, text: 'Storm magic' }, { event: 'skillTag', tag: 'Song', amount: 0.3, cap: 2, text: 'Music' }, { event: 'rest', amount: 1, text: 'A quiet night' }, { event: 'questDone', amount: 1, text: 'Good deeds' }],
    dislikes: [{ event: 'summon', amount: -1, cap: -3, text: 'Waking the dead' }, { event: 'battleFled', amount: -1, text: 'Leaving people behind' }],
    bond: [
      { approval: 20, options: [{ id: 'marisol-voice', name: 'Carrying Voice', description: '+10% Magic Attack.', modifiers: [pct('magicAttack', 10)] }, { id: 'marisol-shanty', name: 'Sea Shanty', description: '+8% speed.', modifiers: [pct('speed', 8)] }] },
      { approval: 40, options: [{ id: 'marisol-storm', name: 'Storm Song', description: '+15% Lightning damage.', modifiers: [flat('lightningDamage', 15)] }, { id: 'marisol-calm', name: 'Calm Waters', description: '+12 Healing Power and +10 Status Resist.', modifiers: [flat('healingPower', 12), flat('statusResist', 10)] }] },
      { approval: 60, options: [{ id: 'marisol-chorus', name: 'Chorus', description: 'Every ally starts battle Regenerating.', triggers: [{ id: 'marisol-chorus', trigger: 'onCombatStart', effects: [{ kind: 'applyStatus', status: 'regen', duration: 3, target: 'allAllies' }] }] }, { id: 'marisol-tide', name: 'Rising Tide', description: '+15% Ultimate Charge.', modifiers: [flat('ultimateGain', 15)] }] },
      { approval: 80, options: [{ id: 'marisol-diva', name: 'Showstopper', description: '+10% damage and +10% Magic Attack.', modifiers: [flat('damageBonus', 10), pct('magicAttack', 10)] }, { id: 'marisol-anchor', name: 'Anchor', description: '+15% max HP and +10 Ice and Lightning resistance.', modifiers: [pct('maxHp', 15), flat('iceResist', 10), flat('lightningResist', 10)] }] },
    ],
    oath: { id: 'marisol-oath', name: 'Lullaby of the Deep', description: '+12% damage; starts every battle with a 10% shield on every ally.', modifiers: [flat('damageBonus', 12)], triggers: [{ id: 'marisol-lullaby', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 10, target: 'allAllies' }] }] },
    recruitQuest: 'marisol-recruit', personalQuest: 'marisol-lullaby',
  },
];

export const COMPANIONS = buildCompanions(BASE_COMPANIONS);

const GREETINGS: Record<string, string> = {
  aldric: '“Ah, {hero}. Solenne keep you. Have you eaten? You never eat.”',
  fenn: '“Hm.” The wolf at her side looks at you. Fenn looks at the wolf. “He says hello.”',
  korga: '“You again. Good. I was getting bored.”',
  ilyra: '“If this is about the library fines, I was never here.”',
  sable: '“Darling! You look rich. Are you rich? You look rich.”',
  marisol: '“Ho there, {hero}! The sea’s quiet today. Too quiet. Sing something?”',
  edrin: '“Good day. I am Sir Edrin. I have no lord, but I have a very good sword and a great deal of regret.”',
  thistle: '“Oh, hello! Have you eaten? You look like someone who has not. Sit. There is soup.”',
  thorne: '“Keep your hands where I can see them. It is not personal. It is procedure.”',
  hrafna: '“My grandmother says you are not as dull as you look. She says it kindly. Mostly.”',
  bexley: '“Don’t touch that! Or do! Actually, it’s probably stable. Probably.”',
  zeph: '“Darling! Are you here for the show? I have a show. There is always a show.”',
  kessa: '“Mind the ceiling. Not that it will fall. Mostly. I am an expert on ceilings.”',
  tick: '“Greeting. Query: is this a social call? I am practicing the concept.”',
};

/** Each companion's own NPC: met in their town, then spoken to from the Party screen. */
export const COMPANION_NPCS: NpcDef[] = COMPANIONS.map((c) => ({ id: c.id, name: c.name, title: c.title, town: c.town, place: 'people', race: c.raceId, portrait: c.portrait, color: '#c8a050', greeting: GREETINGS[c.id] ?? '“Well?”', companion: c.id }));

/** Personal quests open once a companion trusts you (30 approval) and you are near the quest's level. */
const PERSONAL_APPROVAL = 30;
const personal = (id: string, minLevel: number): Cond => all({ kind: 'companion', companion: id, state: 'recruited', minApproval: PERSONAL_APPROVAL }, level(minLevel));

export const COMPANION_ENCOUNTERS: EncounterDef[] = [
  encounter('q-alpha-hunt', 'The Alpha', 11, ['alpha-wolf', 'dire-wolf', 'dire-wolf'], true),
  encounter('q-bone-priest', 'The Bone Priest', 16, ['skeleton-soldier', 'skeleton-soldier', '^bone-priest'], true),
  encounter('q-poachers', 'Hask’s Poachers', 18, ['bandit-thug', 'bandit-thug', '^poacher-chief'], true),
  encounter('q-korga-duel', 'Korga Ironhide', 26, ['korga-rival'], true),
  encounter('q-gorza', 'Warchief Gorza', 36, ['hollow-knight', 'warchief-gorza', '^unsworn-oathburner'], true),
  { ...encounter('q-ice-witches', 'Book Thieves', 33, ['frost-giant', '^ice-witch', '^ice-witch']), threat: 10 },
  encounter('q-unwritten-page', 'The Unwritten Page', 40, ['^unwritten-page', '^ice-elemental'], true),
  { ...encounter('q-collectors', 'Debt Collectors', 41, ['corsair', 'corsair', '^corsair']), threat: 20 },
  encounter('q-vault', 'The Counting House Vault', 46, ['vault-guardian', 'vault-guardian'], true),
  encounter('q-drowned-choir', 'The Drowned Choir', 46, ['drowned-sailor', 'drowned-sailor', '^drowned-choir'], true),
  { ...encounter('q-shore-drowned', 'The Drowned Rise', 42, ['drowned-sailor', 'drowned-sailor', '^siren']), threat: 20 },
];

export const COMPANION_QUESTS: QuestDef[] = [
  ...GREATER_QUESTS,
  // ---------------- Aldric ----------------
  {
    id: 'aldric-lantern', name: 'The Lantern of Saint Ilse', kind: 'companion', level: 16, zone: 'whisperwood', giver: 'aldric', requires: personal('aldric', 14),
    summary: '“When I was a boy, a bone priest broke into our chapel and stole the Lantern of Saint Ilse. It has been in the Old Crypt ever since. I would like to bring it home.”',
    stages: [
      stage('crypt', 'Find the Bone Priest in the Old Crypt and take back the Lantern.', [fight('f', 'Defeat the Bone Priest', 'q-bone-priest', near('old-crypt', 'boss', undefined, 'The Bone Priest', { distance: 3 }))]),
      stage('lantern', 'The Lantern is yours. Decide with Aldric where it belongs.', [talk('t', 'Speak with Aldric about the Lantern', 'aldric', 'd-aldric-lantern')], { onComplete: [{ kind: 'oath', companion: 'aldric' }] }),
    ],
    rewards: { xp: 0.5, gold: 10, rep: { 'order-of-dawn': 150 } },
  },
  // ---------------- Fenn ----------------
  {
    id: 'fenn-recruit', name: 'The Lone Hunter', kind: 'companion', level: 11, zone: 'whisperwood', giver: 'fenn', requires: level(9),
    summary: '“There’s an alpha wolf east of here, hollowed out by whatever is eating the forest. I don’t hunt with people. But I could watch you try.”',
    stages: [
      stage('hunt', 'Hunt the hollowed alpha with Fenn.', [fight('f', 'Bring down the alpha', 'q-alpha-hunt', near('whisperwood', 'shrine', 'ysolde', 'The alpha’s den', { distance: 6 }))]),
      stage('back', 'Return to Fenn in Thornwick.', [talk('t', 'Speak with Fenn', 'fenn', 'd-fenn-recruit')], { onComplete: [{ kind: 'recruit', companion: 'fenn' }] }),
    ],
    rewards: { xp: 0.4, gold: 8 },
  },
  {
    id: 'fenn-pack', name: 'The Last of the Pack', kind: 'companion', level: 18, zone: 'whisperwood', giver: 'fenn', requires: personal('fenn', 16),
    summary: '“The poachers who killed my family. I found them. Hask and his crew, camped by the crypt road. Come with me.”',
    stages: [
      stage('poachers', 'Find Hask’s poachers on the crypt road.', [fight('f', 'Defeat Hask’s poachers', 'q-poachers', near('whisperwood', 'dungeon', 'spider-hollow', 'Poachers’ camp', { distance: 6 }))]),
      stage('hask', 'Hask is on his knees. Fenn has an arrow on the string.', [talk('t', 'Stand with Fenn', 'fenn', 'd-fenn-hask')], { onComplete: [{ kind: 'oath', companion: 'fenn' }] }),
    ],
    rewards: { xp: 0.5, gold: 10, rep: { wardens: 150 } },
  },
  // ---------------- Korga ----------------
  {
    id: 'korga-recruit', name: 'First Blood', kind: 'companion', level: 26, zone: 'ashen-desert', giver: 'korga', requires: level(24),
    summary: '“I don’t follow anyone I haven’t fought. Kael’s shrine, out in the sand. First blood. Unless you’re scared.”',
    stages: [
      stage('duel', 'Meet Korga at Kael’s shrine in the Ashen Desert.', [fight('f', 'Win the duel', 'q-korga-duel', near('ashen-desert', 'shrine', 'kael', 'Korga waits', { distance: 3 }))]),
      stage('back', 'Korga is laughing, bleeding, and waiting for you in Sandhaven.', [talk('t', 'Speak with Korga', 'korga', 'd-korga-recruit')], { onComplete: [{ kind: 'recruit', companion: 'korga' }] }),
    ],
    rewards: { xp: 0.4, gold: 10 },
  },
  {
    id: 'korga-blood', name: 'Blood Price', kind: 'companion', level: 36, zone: 'ashen-desert', giver: 'korga', requires: personal('korga', 34),
    summary: '“My old chief, Gorza, sold the warband to the Unsworn. He is camped by the eastern road with what’s left of them. I want him to look at me when it happens.”',
    stages: [
      stage('gorza', 'Find Warchief Gorza by the eastern road.', [fight('f', 'Defeat Warchief Gorza', 'q-gorza', at('ashen-desert', 'east', 'Gorza’s camp', { distance: 9 }))]),
      stage('verdict', 'Gorza is beaten. The warband is watching Korga.', [talk('t', 'Speak with Korga', 'korga', 'd-korga-gorza')], { onComplete: [{ kind: 'oath', companion: 'korga' }] }),
    ],
    rewards: { xp: 0.5, gold: 12, rep: { 'iron-legion': 200 } },
  },
  // ---------------- Ilyra ----------------
  {
    id: 'ilyra-recruit', name: 'Overdue', kind: 'companion', level: 33, zone: 'frostspire', giver: 'ilyra', requires: level(31),
    summary: '“Ice witches stole my spellbook. Well. Technically it is the Guild’s spellbook. Technically I borrowed it. Get it back and I will owe you, which I hate.”',
    stages: [
      stage('witches', 'The witches camp below the Ice Palace.', [fight('f', 'Recover Ilyra’s book', 'q-ice-witches', near('frostspire', 'dungeon', 'ice-palace', 'The witches’ camp', { distance: 6 }))]),
      stage('back', 'Bring the book back to Ilyra in Frosthold.', [talk('t', 'Speak with Ilyra', 'ilyra', 'd-ilyra-recruit')], { onComplete: [{ kind: 'recruit', companion: 'ilyra' }] }),
    ],
    rewards: { xp: 0.4, gold: 10 },
  },
  {
    id: 'ilyra-shelf', name: 'The Forbidden Shelf', kind: 'companion', level: 40, zone: 'frostspire', giver: 'ilyra', requires: personal('ilyra', 38),
    summary: '“There is a page in the Ice Palace that the Guild will not let anyone read. A page from before the gods. I would very much like to read it.”',
    stages: [
      stage('page', 'Find the forbidden page at the heart of the Ice Palace.', [fight('f', 'Subdue the Unwritten Page', 'q-unwritten-page', near('ice-palace', 'boss', undefined, 'The forbidden page', { distance: 3 }))]),
      stage('read', 'The page lies quiet in the snow. Ilyra reaches for it.', [talk('t', 'Speak with Ilyra', 'ilyra', 'd-ilyra-page')], { onComplete: [{ kind: 'oath', companion: 'ilyra' }] }),
    ],
    rewards: { xp: 0.5, gold: 12, rep: { 'mages-guild': 200 } },
  },
  // ---------------- Sable ----------------
  {
    id: 'sable-recruit', name: 'A Debt Between Thieves', kind: 'companion', level: 41, zone: 'stormcoast', giver: 'sable', requires: level(39),
    summary: '“I owe some people some money. They are on their way to explain how much. If you were standing next to me, they might explain it more politely.”',
    stages: [
      stage('debt', 'Sable’s creditors are coming. Settle it, one way or another.', [talk('t', 'Settle Sable’s debt', 'sable', 'd-sable-debt')], { next: [{ cond: flag('sable-debt', 'fight'), stage: 'collectors' }, { cond: flag('sable-debt'), stage: 'join' }] }),
      stage('collectors', 'The collectors are waiting by the harbor road.', [fight('f', 'Deal with the debt collectors', 'q-collectors', near('stormcoast', 'town', 'saltmere', 'Debt collectors', { distance: 6 }))]),
      stage('join', 'Sable is a free woman, more or less.', [talk('t', 'Speak with Sable', 'sable', 'd-sable-recruit')], { onComplete: [{ kind: 'recruit', companion: 'sable' }] }),
    ],
    rewards: { xp: 0.4, gold: 10 },
  },
  {
    id: 'sable-job', name: 'The Grimvald Job', kind: 'companion', level: 46, zone: 'stormcoast', giver: 'sable', requires: personal('sable', 44),
    summary: '“Grimvald’s Counting House keeps a vault under the cliffs. Golems, gold, the works. One job, darling. The big one.”',
    stages: [
      stage('vault', 'Break into the Counting House vault under the cliffs.', [fight('f', 'Get past the vault guardians', 'q-vault', near('stormcoast', 'shrine', 'grimvald', 'The vault door', { distance: 5 }))]),
      stage('split', 'The vault is open. Now, about the split.', [talk('t', 'Divide the take with Sable', 'sable', 'd-sable-split')], { onComplete: [{ kind: 'oath', companion: 'sable' }] }),
    ],
    rewards: { xp: 0.5, gold: 10 },
  },
  // ---------------- Marisol ----------------
  {
    id: 'marisol-recruit', name: 'A Song for the Drowned', kind: 'companion', level: 42, zone: 'stormcoast', giver: 'marisol', requires: level(40),
    summary: '“The drowned are restless by the Leviathan’s wreck. I need to sing to them, and I need someone to stop them eating me while I do.”',
    stages: [
      stage('walk', 'Escort Marisol to the shore by the wreck.', [escort('e', 'Bring Marisol safely to the shore', 'Marisol', 'guest-marisol', near('stormcoast', 'dungeon', 'leviathan-wreck', 'The singing shore', { distance: 4 }))]),
      stage('sing', 'The drowned rise as Marisol begins to sing.', [fight('f', 'Hold off the drowned', 'q-shore-drowned', near('stormcoast', 'dungeon', 'leviathan-wreck', 'The singing shore', { key: 'shore', distance: 4 })), talk('t', 'Listen to the song', 'marisol', 'd-marisol-recruit', near('stormcoast', 'dungeon', 'leviathan-wreck', 'Marisol', { key: 'shore', distance: 4 }))], { onComplete: [{ kind: 'recruit', companion: 'marisol' }] }),
    ],
    rewards: { xp: 0.4, gold: 10 },
  },
  {
    id: 'marisol-lullaby', name: 'The Leviathan’s Lullaby', kind: 'companion', level: 47, zone: 'stormcoast', giver: 'marisol', requires: personal('marisol', 45),
    summary: '“The sailors of the Leviathan are still in the wreck, singing the song that drowned them. I can finish it for them. Will you come?”',
    stages: [
      stage('choir', 'Face the Drowned Choir in the Wreck of the Leviathan.', [fight('f', 'Silence the Drowned Choir', 'q-drowned-choir', near('leviathan-wreck', 'boss', undefined, 'The Drowned Choir', { distance: 3 }))]),
      stage('song', 'The choir is silent. Marisol takes a breath.', [talk('t', 'Stand with Marisol', 'marisol', 'd-marisol-choir')], { onComplete: [{ kind: 'oath', companion: 'marisol' }] }),
    ],
    rewards: { xp: 0.5, gold: 12 },
  },
];

export const COMPANION_DIALOGUES: DialogueDef[] = [
  ...GREATER_DIALOGUES,
  ...ROMANCE_DIALOGUES,
  dialogue('d-aldric-lantern', {
    start: say('aldric', '“It’s smaller than I remembered.” He turns the Lantern over in his hands. It is cold. “It used to light the whole chapel.”', { next: 'n1' }),
    n1: say('aldric', '“The temple will want it back on the altar. That is where it belongs. Isn’t it?”', {
      choices: [
        choice('Return it to the temple. Let everyone see it.', 'temple', [favor('solenne', 40), approve('aldric', 6)]),
        choice('Keep it, Aldric. Light it yourself.', 'keep', [approve('aldric', 12)]),
      ],
    }),
    temple: say('aldric', '“Yes. Yes, you’re right.” He smiles. “And I’ll be the one to light it every morning. That will do.”'),
    keep: say('narrator', 'Aldric stares at the Lantern for a long moment. Then he whispers a prayer, and it lights, small and warm, in his hands. He does not say anything for a while. He does not need to.'),
  }),
  lines('d-fenn-recruit', [
    { speaker: 'fenn', text: '“You didn’t run. Most people run.”' },
    { speaker: 'fenn', text: '“The wolf likes you. That’s rare. Fine. I’ll come with you, for now. Don’t talk to me before breakfast.”' },
  ]),
  dialogue('d-fenn-hask', {
    start: say('fenn', '“He killed my mother. My brothers. Sold their pelts in Sandhaven.” Her hands are shaking. “Tell me what to do.”', {
      choices: [
        choice('It’s your choice, Fenn. It always was.', 'hers', [approve('fenn', 10)]),
        choice('Let him go. Don’t become him.', 'spare', [...mercy(), approve('fenn', 2)]),
        choice('Loose the arrow.', 'kill', [approve('fenn', 6), favor('ysolde', 20)]),
      ],
    }),
    hers: say('narrator', 'Fenn lowers the bow. “Run,” she tells Hask. “Run, and never stop.” He runs. She watches him go until he is gone. Then she sits down in the dirt with her wolf, and you sit with her.'),
    spare: say('fenn', '“…I don’t want to be him.” She lowers the bow. Hask scrambles away into the trees. “Thank you. I think.”'),
    kill: say('narrator', 'The arrow flies true. Fenn does not look away. When it is done, the wolf presses its head against her hand.'),
  }),
  lines('d-korga-recruit', [
    { speaker: 'korga', text: '“HA! First blood to you. Mine’s still coming out, look.” She seems delighted.' },
    { speaker: 'korga', text: '“Fine. I’ll follow you. If you start losing, I’ll leave. If you start running, I’ll kill you. Deal? Deal.”' },
  ]),
  dialogue('d-korga-gorza', {
    start: say('korga', '“Look at me, Gorza. Look at me.” The old warchief looks up. “You sold us. All of us. For a promise from a man with no oaths.”', {
      choices: [
        choice('Finish it, Korga.', 'kill', [approve('korga', 8), favor('kael', 20)]),
        choice('Exile him. Let him live with it.', 'exile', [...mercy(), approve('korga', -2)]),
        choice('The warband needs a chief. You, Korga.', 'chief', [approve('korga', 10), rep('iron-legion', 100)]),
      ],
    }),
    kill: say('narrator', 'Korga does it cleanly, and in Kael’s name. The warband bows its heads.'),
    exile: say('korga', '“Walk, then. Walk until the sand takes you.” Gorza walks. Korga spits. “Soft. You’re soft. I… respect it. A little.”'),
    chief: say('korga', '“Me?” The warband is already kneeling. Korga looks at them, then at you. “…Fine. But I’m still coming with you. They can wait. Chiefs are allowed to be late.”'),
  }),
  lines('d-ilyra-recruit', [
    { speaker: 'ilyra', text: '“My book! Oh, look, they dog-eared it. Animals.”' },
    { speaker: 'ilyra', text: '“Thank you. I mean that. I suppose I’m coming with you now: you clearly need a proper mage, and I need to be somewhere the librarians aren’t.”' },
  ]),
  dialogue('d-ilyra-page', {
    start: say('ilyra', '“It’s blank. It’s blank and it’s reading me. Oh, this is the best day of my life.”', {
      choices: [
        choice('Read it, Ilyra. Knowledge is never wrong.', 'read', [approve('ilyra', 10), setFlag('ilyra-read'), favor('aurelis', -10)]),
        choice('Burn it. Some pages should stay unwritten.', 'burn', [approve('ilyra', -4), favor('aurelis', 30), favor('solenne', 10)]),
      ],
    }),
    read: say('narrator', 'Ilyra reads. Her eyes go very wide, then very calm. “Oh,” she says softly. “Oh, that is how the gods were made.” She will not tell you any more. She smiles in her sleep for a week.'),
    burn: say('ilyra', '“…You’re right. I hate that you’re right.” She lights it herself. The ash falls upward. “Someday I’ll forgive you. Someday.”'),
  }),
  dialogue('d-sable-debt', {
    start: say('sable', '“Five hundred gold, give or take some interest, and a small amount of light arson. The collectors are on their way.”', {
      choices: [
        check({ kind: 'gold', min: 500 }, 'I’ll pay it. (500 gold)', 'paid', [gold(-500), setFlag('sable-debt', 'paid'), approve('sable', 4)]),
        check(stat('luk', 25), 'Let me roll dice with them for it.', 'dice', [setFlag('sable-debt', 'dice'), approve('sable', 8), { kind: 'deed', event: 'gamble' }]),
        choice('We’ll explain it to them with steel.', 'fight', [setFlag('sable-debt', 'fight')]),
        choice('[Leave] Let me think about it.', undefined, undefined, { leave: true }),
      ],
    }),
    paid: say('sable', '“You actually paid it. With money. I have never been so insulted and so grateful at the same time.”'),
    dice: say('narrator', 'You roll double sixes three times in a row. The collectors leave in silence. Sable stares at you with something like love.'),
    fight: say('sable', '“Oh, I like you.”'),
  }),
  lines('d-sable-recruit', [
    { speaker: 'sable', text: '“Debt-free. Me! I don’t know who I am any more.”' },
    { speaker: 'sable', text: '“I suppose I should repay you. Not with money, obviously. With my company. You’re welcome.”' },
  ]),
  dialogue('d-sable-split', {
    start: say('sable', '“Look at it all. Grimvald won’t even notice it’s gone. Well. He will. But he can’t prove anything.”', {
      choices: [
        choice('Half and half, partner.', 'half', [gold(3000), approve('sable', 8), favor('vex', 30), favor('grimvald', -30)]),
        choice('We give it back. This was a test, and we passed.', 'back', [approve('sable', -6), favor('grimvald', 40), rep('thieves-den', -100)]),
        choice('I’ll take all of it.', 'all', [gold(6000), approve('sable', -10), favor('vex', 15), favor('grimvald', -40)]),
      ],
    }),
    half: say('sable', '“Partners. I like the sound of that.”'),
    back: say('sable', '“You are the strangest thief I have ever met.” But she helps you carry it back, and she is smiling.'),
    all: say('sable', '“…Right. Well. I suppose I taught you too well.” She does not look at you for a day.'),
  }),
  lines('d-marisol-recruit', [
    { speaker: 'narrator', text: 'Marisol’s song rolls out over the water like a tide coming in. One by one, the drowned stop, and listen, and sink back beneath the waves.' },
    { speaker: 'marisol', text: '“There. They’ll sleep a while.” She laughs, loud as thunder. “You fight well for someone who can’t carry a tune. I’m coming with you. Somebody has to sing at your funeral, and it might as well be someone good.”' },
  ]),
  dialogue('d-marisol-choir', {
    start: say('marisol', '“They’re still singing. Under the water. The same song, the last one, over and over.”', {
      choices: [
        choice('Sing them to rest, Marisol.', 'rest', [approve('marisol', 10), favor('nymira', 30)]),
        choice('Let the sea keep them. It is theirs.', 'sea', [approve('marisol', 3), favor('morrath', 30)]),
      ],
    }),
    rest: say('narrator', 'Marisol sings the end of the song. The wreck creaks, settles, and is quiet for the first time in a hundred years.'),
    sea: say('marisol', '“…Yes. Maybe that’s kinder.” She hums, very softly, and the drowned sink down into the dark.'),
  }),
];
