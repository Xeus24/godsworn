import type { TriggeredEffect } from '../../engine/effects/types';
import type { BondNodeDef, BondTierDef, CompanionDef } from '../../engine/party/types';
import type { ActionDef, Cond, DialogueDef, ObjectiveDef, QuestDef } from '../../engine/quests/types';
import type { FavorDeed } from '../../engine/gods/types';
import { flat, pct } from '../trees/builder';
import { all, approve, at, choice, clear, dialogue, flag, kill, level, not, questDone, say, stage, talk, visit } from './helpers';

/**
 * Expansion phase 17: eight more companions (14 in all), each with a five-quest personal line, a loyalty skill, a
 * reason to walk out, and banter (see banter.ts). Six of them (Fenn, Ilyra, Sable, Marisol, Zeph and Thorne) have
 * friendship or romance scenes at the camp.
 */

export type BaseCompanion = Omit<CompanionDef, 'line' | 'loyalty' | 'leaves' | 'romance'>;

const comp = (id: string, minApproval: number): Cond => ({ kind: 'companion', companion: id, state: 'recruited', minApproval });
/** True while the companion is still with you and has not warmed to this approval. */
const cold = (id: string, below: number): Cond => not(comp(id, below));

// ---------------------------------------------------------------- deeds companions care about

const LIKE: Record<string, FavorDeed> = {
  undead: { event: 'kill', enemyType: 'undead', amount: 1, cap: 4, text: 'Putting the dead to rest' },
  beasts: { event: 'kill', enemyType: 'beast', amount: 0.5, cap: 2, text: 'Hunting beasts' },
  humanoid: { event: 'kill', enemyType: 'humanoid', amount: 0.5, cap: 2, text: 'Fighting raiders and cultists' },
  constructs: { event: 'kill', enemyType: 'construct', amount: 1, cap: 3, text: 'Breaking machines' },
  quests: { event: 'questDone', amount: 2, text: 'Finishing what you start' },
  mercy: { event: 'mercy', amount: 5, text: 'Mercy' },
  heal: { event: 'heal', amount: 0.3, cap: 2, text: 'Healing' },
  rest: { event: 'rest', amount: 1, text: 'A quiet night' },
  nature: { event: 'skillTag', tag: 'Nature', amount: 0.3, cap: 2, text: 'Nature magic' },
  fire: { event: 'skillTag', tag: 'Fire', amount: 0.3, cap: 2, text: 'Fire and fury' },
  gamble: { event: 'gamble', amount: 2, text: 'A gamble' },
  crit: { event: 'crit', amount: 0.2, cap: 2, text: 'Clean work' },
  gold: { event: 'goldLooted', amount: 0.5, cap: 2, text: 'Getting paid' },
};
const DISLIKE: Record<string, FavorDeed> = {
  summon: { event: 'summon', amount: -2, cap: -6, text: 'Raising the dead' },
  stolen: { event: 'goldStolen', amount: -2, cap: -6, text: 'Stealing' },
  fled: { event: 'battleFled', amount: -1, text: 'Running from a fight' },
  salvage: { event: 'salvage', amount: -1, cap: -3, text: 'Waste' },
  lost: { event: 'battleLost', amount: -2, text: 'Losing' },
};

// ---------------------------------------------------------------- perk shorthands

type Spec = [name: string, description: string, ...mods: ReturnType<typeof flat>[]];
const F = flat;
const P = pct;

function tiers(cid: string, specs: Spec[]): BondTierDef[] {
  const node = ([name, description, ...mods]: Spec): BondNodeDef => ({ id: `${cid}-${name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`, name, description, modifiers: mods });
  return [20, 40, 60, 80].map((approval, i) => ({ approval, options: [node(specs[i * 2] as Spec), node(specs[i * 2 + 1] as Spec)] as [BondNodeDef, BondNodeDef] }));
}

const trig = (id: string, trigger: TriggeredEffect['trigger'], effects: TriggeredEffect['effects'], extra: Partial<TriggeredEffect> = {}): TriggeredEffect => ({ id, trigger, effects, ...extra });

// ---------------------------------------------------------------- the eight

export const NEW_COMPANIONS: BaseCompanion[] = [
  {
    id: 'edrin', name: 'Sir Edrin Vale', title: 'Knight-Errant', raceId: 'human', classId: 'knight', birthSignId: 'the-banner', portrait: 6, god: 'solenne', town: 'aurelane', specialization: 'oathbound', startApproval: 10,
    bio: 'A former second-in-command of the Aurelane Watch who stood by at a hanging he knew was wrong, and has been a knight without a lord ever since.',
    likes: [LIKE.quests!, LIKE.mercy!, LIKE.humanoid!], dislikes: [DISLIKE.fled!, DISLIKE.stolen!],
    bond: tiers('edrin', [
      ['Shield Wall', '+12% defense.', P('defense', 12)], ['Resolute', '+10% max HP.', P('maxHp', 10)],
      ['Oathkeeper', '+10 Status Resist.', F('statusResist', 10)], ['Vigil', '+6% cooldown reduction.', F('cooldownReduction', 6)],
      ['Standard-Bearer', '+8% damage.', F('damageBonus', 8)], ['Plate and Prayer', '+12 Magic Resist.', F('magicResist', 12)],
      ['Last Man Standing', '+20% max HP.', P('maxHp', 20)], ['Honor Guard', '+15% defense and +5 Healing Power.', P('defense', 15), F('healingPower', 5)],
    ]),
    oath: { id: 'edrin-oath', name: 'Crest Restored', description: '+10% damage and +10% defense; he shields the party for 6% of max HP each turn he starts.', modifiers: [F('damageBonus', 10), P('defense', 10)], triggers: [trig('edrin-crest', 'onTurnStart', [{ kind: 'shield', percentMaxHp: 6, target: 'allAllies' }])] },
    recruitQuest: 'edrin-recruit', personalQuest: 'edrin-oath',
  },
  {
    id: 'thistle', name: 'Thistle Underbough', title: 'Fen Wanderer', raceId: 'hearthfolk', classId: 'druid', birthSignId: 'the-hearth', portrait: 5, god: 'lyssara', town: 'mirewick', specialization: 'wildheart', startApproval: 20,
    bio: 'A cheerful hearthfolk druid who walks the Moonfen with a pot on her back and a toad in her hat. She has never met a stranger she could not feed.',
    likes: [LIKE.nature!, LIKE.heal!, LIKE.rest!, LIKE.mercy!], dislikes: [DISLIKE.summon!, DISLIKE.salvage!],
    bond: tiers('thistle', [
      ['Good Soup', '+15 Healing Power.', F('healingPower', 15)], ['Green Thumb', '+12% Nature damage.', F('natureDamage', 12)],
      ['Thick Hide', '+10% max HP.', P('maxHp', 10)], ['Moonlit Step', '+6 dodge.', F('dodge', 6)],
      ['Bear Hug', '+12% physical attack.', P('physicalAttack', 12)], ['Owl Eyes', '+6% crit chance.', F('critChance', 6)],
      ['Evergreen', '+15% max HP.', P('maxHp', 15)], ['Wildheart', '+10% damage and +10 Status Resist.', F('damageBonus', 10), F('statusResist', 10)],
    ]),
    oath: { id: 'thistle-oath', name: 'Mother of Mayors', description: '+8% max HP and +10 Healing Power; she heals the party 4% at the start of each of her turns.', modifiers: [P('maxHp', 8), F('healingPower', 10)], triggers: [trig('thistle-brew', 'onTurnStart', [{ kind: 'heal', percentMaxHp: 4, target: 'allAllies' }])] },
    recruitQuest: 'thistle-recruit', personalQuest: 'thistle-oath',
  },
  {
    id: 'thorne', name: 'Thorne Valdis', title: 'Witch Hunter', raceId: 'human', classId: 'witchhunter', birthSignId: 'the-hollow', portrait: 3, god: 'hesha', town: 'lampfall', specialization: 'silverduelist', startApproval: 5,
    bio: 'An Order of Hesha hunter, sparing with words and silver. She has let exactly one witch go in her life and has never stopped counting the cost.',
    likes: [LIKE.undead!, LIKE.crit!, LIKE.quests!], dislikes: [DISLIKE.summon!, DISLIKE.stolen!],
    bond: tiers('thorne', [
      ['Silver Edge', '+8% physical attack.', P('physicalAttack', 8)], ['Cold Eyes', '+5% crit chance.', F('critChance', 5)],
      ['Warded', '+12 Magic Resist.', F('magicResist', 12)], ['Quick Draw', '+10% speed.', P('speed', 10)],
      ['Hex-Breaker', '+10 Status Resist.', F('statusResist', 10)], ['Hunter’s Mark', '+12% damage.', F('damageBonus', 12)],
      ['Silver Heart', '+20% crit damage.', F('critDamage', 20)], ['Lamp and Blade', '+10% max HP and +5% crit chance.', P('maxHp', 10), F('critChance', 5)],
    ]),
    oath: { id: 'thorne-oath', name: 'Hearth Over Hunt', description: '+12% damage and +10 Magic Resist; her crits mark the target Vulnerable.', modifiers: [F('damageBonus', 12), F('magicResist', 10)], triggers: [trig('thorne-mark', 'onCrit', [{ kind: 'applyStatus', status: 'vulnerable', duration: 2, target: 'target' }])] },
    recruitQuest: 'thorne-recruit', personalQuest: 'thorne-oath',
  },
  {
    id: 'hrafna', name: 'Hrafna Greystone', title: 'Ancestor-Speaker', raceId: 'orc', classId: 'shaman', birthSignId: 'the-antler', portrait: 4, god: 'thalor', town: 'briarhold', specialization: 'spiritwalker', startApproval: 10,
    bio: 'The last of an orc line that keeps its dead close. Her grandmother’s ghost lives in her left boot and has opinions about everything.',
    likes: [LIKE.undead!, LIKE.rest!, LIKE.quests!], dislikes: [DISLIKE.salvage!, DISLIKE.fled!],
    bond: tiers('hrafna', [
      ['Totem Carver', '+10% max MP.', P('maxMp', 10)], ['Spirit Ear', '+8% Magic Attack.', P('magicAttack', 8)],
      ['Ancestral Hide', '+10% max HP.', P('maxHp', 10)], ['Storm-Voice', '+12% Lightning damage.', F('lightningDamage', 12)],
      ['Grandmother’s Boot', '+10 Status Resist.', F('statusResist', 10)], ['Earth Pulse', '+12% Earth damage.', F('earthDamage', 12)],
      ['The Long Table', '+10% damage.', F('damageBonus', 10)], ['Voice of Many', '+15% Magic Attack and +8% cooldown reduction.', P('magicAttack', 15), F('cooldownReduction', 8)],
    ]),
    oath: { id: 'hrafna-oath', name: 'The Boot Speaks', description: '+12% damage and +8% max HP; when she kills, her allies gain +8% damage for a turn.', modifiers: [F('damageBonus', 12), P('maxHp', 8)], triggers: [trig('hrafna-voices', 'onKill', [{ kind: 'buff', id: 'hrafna-voices', modifiers: [F('damageBonus', 8)], duration: 2, target: 'allAllies' }])] },
    recruitQuest: 'hrafna-recruit', personalQuest: 'hrafna-oath',
  },
  {
    id: 'bexley', name: 'Bexley Marrow', title: 'Itinerant Alchemist', raceId: 'gnome', classId: 'alchemist', birthSignId: 'the-tome', portrait: 1, god: 'mirrin', town: 'lensfall', specialization: 'grenadier', startApproval: 15,
    bio: 'A gnome alchemist whose experiments are loud, colorful and, so far, survivable. She is working on a cure for regret and a recipe for stew.',
    likes: [LIKE.fire!, LIKE.heal!, LIKE.gamble!, LIKE.quests!], dislikes: [DISLIKE.salvage!, DISLIKE.lost!],
    bond: tiers('bexley', [
      ['Steady Hand', '+8% Magic Attack.', P('magicAttack', 8)], ['Reagent Pouch', '+12% max MP.', P('maxMp', 12)],
      ['Volatile', '+12% Fire damage.', F('fireDamage', 12)], ['Antidote', '+12 Status Resist.', F('statusResist', 12)],
      ['Quick Mixer', '+8% cooldown reduction.', F('cooldownReduction', 8)], ['Acid Splash', '+12% Nature damage.', F('natureDamage', 12)],
      ['Master Brewer', '+15% Healing Power and +8% damage.', F('healingPower', 15), F('damageBonus', 8)], ['Controlled Burn', '+15% Magic Attack.', P('magicAttack', 15)],
    ]),
    oath: { id: 'bexley-oath', name: 'The Cure for Regret', description: '+12% damage and +10 Healing Power; her flasks restore 3 MP to the party when they crit.', modifiers: [F('damageBonus', 12), F('healingPower', 10)], triggers: [trig('bexley-cure', 'onCrit', [{ kind: 'restoreMp', amount: 3, target: 'allAllies' }])] },
    recruitQuest: 'bexley-recruit', personalQuest: 'bexley-oath',
  },
  {
    id: 'zeph', name: 'Zephyra Lark', title: 'Wind-Dancer', raceId: 'fae', classId: 'dancer', birthSignId: 'the-raven', portrait: 0, god: 'seraphel', town: 'wrecksend', specialization: 'edgewhirl', startApproval: 15,
    bio: 'A half-fae dancer from a traveling troupe, forever one step from the exit. She dances because stopping is the one thing she cannot do.',
    likes: [LIKE.crit!, LIKE.gamble!, LIKE.rest!], dislikes: [DISLIKE.fled!, DISLIKE.summon!],
    bond: tiers('zeph', [
      ['Light Step', '+8 dodge.', F('dodge', 8)], ['Pirouette', '+8% speed.', P('speed', 8)],
      ['Ribbon Edge', '+6% crit chance.', F('critChance', 6)], ['Encore', '+10% Ultimate Charge.', F('ultimateGain', 10)],
      ['Wind in the Hair', '+10% speed.', P('speed', 10)], ['Veil of Silk', '+10 dodge.', F('dodge', 10)],
      ['Curtain Call', '+25% crit damage.', F('critDamage', 25)], ['Grand Jeté', '+12% damage and +6 dodge.', F('damageBonus', 12), F('dodge', 6)],
    ]),
    oath: { id: 'zeph-oath', name: 'The Last Encore', description: '+12% damage and +10% speed; a dodge hastens her for a turn.', modifiers: [F('damageBonus', 12), P('speed', 10)], triggers: [trig('zeph-encore', 'onDodge', [{ kind: 'buff', id: 'zeph-encore', modifiers: [P('speed', 15)], duration: 2, target: 'self' }])] },
    recruitQuest: 'zeph-recruit', personalQuest: 'zeph-oath',
  },
  {
    id: 'kessa', name: 'Kessa Dunmere', title: 'Stone-Singer', raceId: 'dwarf', classId: 'geomancer', birthSignId: 'the-forge', portrait: 2, god: 'ordrun', town: 'khazrum', specialization: 'crystalmancer', startApproval: 10,
    bio: 'A Fourth Clan dwarf who prefers sand to stone, to the despair of her relatives. She speaks to the ground the way other people talk to horses.',
    likes: [LIKE.constructs!, LIKE.quests!, LIKE.rest!], dislikes: [DISLIKE.fled!, DISLIKE.salvage!],
    bond: tiers('kessa', [
      ['Granite Skin', '+12% defense.', P('defense', 12)], ['Seam-Seeker', '+10% Earth damage.', F('earthDamage', 10)],
      ['Bedrock', '+12% max HP.', P('maxHp', 12)], ['Crystal Focus', '+8% Magic Attack.', P('magicAttack', 8)],
      ['Heavy Tread', '+10 Status Resist.', F('statusResist', 10)], ['Sand-Shaper', '+10 dodge.', F('dodge', 10)],
      ['Mountain’s Weight', '+15% Earth damage.', F('earthDamage', 15)], ['Foundation', '+15% max HP and +8% defense.', P('maxHp', 15), P('defense', 8)],
    ]),
    oath: { id: 'kessa-oath', name: 'Cornerstone', description: '+10% damage and +12% defense; she shields the party for 8% of max HP at the start of each battle.', modifiers: [F('damageBonus', 10), P('defense', 12)], triggers: [trig('kessa-corner', 'onCombatStart', [{ kind: 'shield', percentMaxHp: 8, target: 'allAllies' }])] },
    recruitQuest: 'kessa-recruit', personalQuest: 'kessa-oath',
  },
  {
    id: 'tick', name: 'Tick', title: 'Forged Artificer', raceId: 'forged', classId: 'artificer', birthSignId: 'the-forge', portrait: 7, god: 'aurelis', town: 'ratchet', specialization: 'engineer', startApproval: 10,
    bio: 'A Forged built to repair and taught to fight, still learning what a joke is. It keeps a spare gear for each of its friends, in case of sentiment.',
    likes: [LIKE.constructs!, LIKE.quests!, LIKE.crit!], dislikes: [DISLIKE.lost!, DISLIKE.salvage!],
    bond: tiers('tick', [
      ['Calibrated', '+6% crit chance.', F('critChance', 6)], ['Reinforced', '+10% defense.', P('defense', 10)],
      ['Overclocked', '+8% speed.', P('speed', 8)], ['Spare Parts', '+10% max HP.', P('maxHp', 10)],
      ['Targeting Array', '+12% physical attack.', P('physicalAttack', 12)], ['Heat Sink', '+10% Fire resistance.', F('fireResist', 10)],
      ['Perfect Tolerance', '+20% crit damage.', F('critDamage', 20)], ['Self-Repair', '+15% max HP and +8% cooldown reduction.', P('maxHp', 15), F('cooldownReduction', 8)],
    ]),
    oath: { id: 'tick-oath', name: 'A Name of My Own', description: '+12% damage and +8% speed; its crits knock the target Vulnerable.', modifiers: [F('damageBonus', 12), P('speed', 8)], triggers: [trig('tick-name', 'onCrit', [{ kind: 'applyStatus', status: 'vulnerable', duration: 2, target: 'target' }])] },
    recruitQuest: 'tick-recruit', personalQuest: 'tick-oath',
  },
];

// ---------------------------------------------------------------- loyalty, leaving and romance for all fourteen

interface Extra {
  loyalty: BondNodeDef;
  leaves: CompanionDef['leaves'];
  romance: boolean;
}

const loyal = (cid: string, name: string, description: string, t: TriggeredEffect): BondNodeDef => ({ id: `${cid}-loyalty`, name, description, triggers: [t] });

const EXTRA: Record<string, Extra> = {
  aldric: { romance: false, loyalty: loyal('aldric', 'Unwavering Light', 'Devoted: once per battle, below 30% HP, heals every ally for 25%.', trig('aldric-light', 'onLowHp', [{ kind: 'heal', percentMaxHp: 25, target: 'allAllies' }], { limitPerCombat: 1 })), leaves: { cond: flag('summit', 'sever'), text: 'Aldric cannot follow you into a sky without gods. He leaves for Brightwater, praying aloud as he goes.' } },
  fenn: { romance: true, loyalty: loyal('fenn', 'Wolf at My Back', 'Devoted: the whole party starts battle 10% faster for 3 turns.', trig('fenn-wolf', 'onCombatStart', [{ kind: 'buff', id: 'fenn-wolf', modifiers: [P('speed', 10)], duration: 3, target: 'allAllies' }])), leaves: { cond: all(flag('world-darkened'), cold('fenn', 20)), text: 'Fenn has seen the sky go dark and has not heard you speak of it. She and the wolf slip away in the night.' } },
  korga: { romance: false, loyalty: loyal('korga', 'Warband Roar', 'Devoted: once per battle, below 30% HP, she gains +30% damage for 3 turns.', trig('korga-roar', 'onLowHp', [{ kind: 'buff', id: 'korga-roar', modifiers: [F('damageBonus', 30)], duration: 3, target: 'self' }], { limitPerCombat: 1 })), leaves: { cond: all(flag('hobbes-spared'), cold('korga', 30)), text: 'Korga has no use for a leader who spares traitors. She is gone by morning, and she took the good axe.' } },
  ilyra: { romance: true, loyalty: loyal('ilyra', 'Margin of Error', 'Devoted: 15% chance on each cast to reduce all cooldowns by 1 turn.', trig('ilyra-margin', 'onSkillCast', [{ kind: 'reduceCooldowns', turns: 1 }], { chance: 15 })), leaves: { cond: all(flag('shard-destroyed'), cold('ilyra', 40)), text: 'Ilyra cannot forgive the shard’s destruction: knowledge, she says, is not yours to burn. She goes back to her library.' } },
  sable: { romance: true, loyalty: loyal('sable', 'Honor Among Thieves', 'Devoted: 30% chance on each kill to pocket 20 extra gold.', trig('sable-honor', 'onKill', [{ kind: 'gold', amount: 20 }], { chance: 30 })), leaves: { cond: all(flag('summit', 'obey'), cold('sable', 50)), text: 'Sable never signed up to uphold anyone’s oaths. She leaves a note on your pillow and a coin on the note.' } },
  marisol: { romance: true, loyalty: loyal('marisol', 'Encore', 'Devoted: the party starts each battle with 15 MP restored.', trig('marisol-encore', 'onCombatStart', [{ kind: 'restoreMp', amount: 15, target: 'allAllies' }])), leaves: { cond: all(flag('ferry-oar', 'refused'), cold('marisol', 40)), text: 'Marisol will not sing for a world that leaves the dead rowing. She takes the next ship to nowhere in particular.' } },
  edrin: { romance: false, loyalty: loyal('edrin', 'Shield of the Fallen', 'Devoted: 25% chance each turn to shield the party for 6% of max HP.', trig('edrin-shield', 'onTurnStart', [{ kind: 'shield', percentMaxHp: 6, target: 'allAllies' }], { chance: 25 })), leaves: { cond: all(flag('hobbes-spared'), cold('edrin', 35)), text: 'Edrin saw a man hanged once for less. He cannot stand beside someone who frees a traitor. He leaves his crest on the table.' } },
  thistle: { romance: false, loyalty: loyal('thistle', 'Evergreen', 'Devoted: heals every ally for 3% at the start of her turns.', trig('thistle-green', 'onTurnStart', [{ kind: 'heal', percentMaxHp: 3, target: 'allAllies' }])), leaves: { cond: all(flag('world-darkened'), cold('thistle', 25)), text: 'Thistle goes back to the fen. The moss, she says, still has things to say to her, and nobody else is listening.' } },
  bexley: { romance: false, loyalty: loyal('bexley', 'Volatile Mixture', 'Devoted: 15% chance on each hit to throw a flask for 25 Fire damage.', trig('bexley-flask', 'onHit', [{ kind: 'damage', element: 'fire', base: 25, target: 'target' }], { chance: 15 })), leaves: { cond: all(flag('shard-kept'), cold('bexley', 30)), text: 'Bexley will not travel with the Severance, however well it is sealed. She leaves a list of cautions, all underlined.' } },
  hrafna: { romance: false, loyalty: loyal('hrafna', 'Ancestral Chorus', 'Devoted: when she kills, the party gains +8% damage for 2 turns.', trig('hrafna-chorus', 'onKill', [{ kind: 'buff', id: 'hrafna-chorus', modifiers: [F('damageBonus', 8)], duration: 2, target: 'allAllies' }])), leaves: { cond: all(flag('summit', 'sever'), cold('hrafna', 40)), text: 'The ancestors will not follow a party that cuts the threads. Hrafna’s grandmother, in the boot, is very firm on this.' } },
  zeph: { romance: true, loyalty: loyal('zeph', 'Last Dance', 'Devoted: dodging makes her 15% faster for 2 turns.', trig('zeph-dance', 'onDodge', [{ kind: 'buff', id: 'zeph-dance', modifiers: [P('speed', 15)], duration: 2, target: 'self' }])), leaves: { cond: all(flag('temptation-faced'), cold('zeph', 40)), text: 'The voice at the fire offered Zeph a stage that never closes. She leaves before dawn, and on your pillow, a pressed flower, wilted.' } },
  thorne: { romance: true, loyalty: loyal('thorne', 'Silver Resolve', 'Devoted: 40% chance on each crit to mark the target Vulnerable.', trig('thorne-silver', 'onCrit', [{ kind: 'applyStatus', status: 'vulnerable', duration: 2, target: 'target' }], { chance: 40 })), leaves: { cond: all(flag('shard-kept'), cold('thorne', 50)), text: 'Thorne cannot hunt beside a thing she would burn. She leaves her pistols on the table, unloaded, as a courtesy.' } },
  kessa: { romance: false, loyalty: loyal('kessa', 'Bedrock', 'Devoted: the party starts each battle with a 5% shield.', trig('kessa-bedrock', 'onCombatStart', [{ kind: 'shield', percentMaxHp: 5, target: 'allAllies' }])), leaves: { cond: all(flag('world-darkened'), cold('kessa', 20)), text: 'Kessa heads back under the mountain. The earth is quiet, she says. Quieter than you.' } },
  tick: { romance: false, loyalty: loyal('tick', 'Failsafe', 'Devoted: once per battle, below 30% HP, restores 30% of its HP.', trig('tick-failsafe', 'onLowHp', [{ kind: 'heal', percentMaxHp: 30, target: 'self' }], { limitPerCombat: 1 })), leaves: { cond: all(flag('shard-kept'), cold('tick', 45)), text: 'The Severance hums in a frequency Tick cannot tune out. It leaves a note, and a spare gear, and does not look back.' } },
};

// ---------------------------------------------------------------- the quest lines

type Task =
  | { k: 'kill'; n: number; type: string; text: string }
  | { k: 'clear'; dungeon: string; text: string }
  | { k: 'visit'; where: 'west' | 'east'; label: string; text: string };

type Kind = 'recruit' | 'line' | 'oath';
interface Row {
  c: string;
  kind: Kind;
  n: number;
  name: string;
  zone: string;
  lvl: number;
  task: Task;
  offer: string;
  scene: string;
  a: [text: string, reply: string, approval: number];
  b: [text: string, reply: string, approval: number];
}

const idOf = (r: Row): string => (r.kind === 'recruit' ? `${r.c}-recruit` : r.kind === 'oath' ? (r.c === 'aldric' ? 'aldric-lantern' : `${r.c}-oath`) : `${r.c}-l${r.n}`);

function objective(r: Row): ObjectiveDef {
  const t = r.task;
  if (t.k === 'kill') return kill('t', t.text, t.n, { zone: r.zone, enemyType: t.type });
  if (t.k === 'clear') return clear('t', t.text, t.dungeon);
  return visit('t', t.text, at(r.zone, t.where, t.label, { key: `${r.c}-${r.kind}${r.n}`, distance: 4 }));
}

const tail = (r: Row): ActionDef[] => (r.kind === 'recruit' ? [{ kind: 'recruit', companion: r.c }] : r.kind === 'oath' ? [{ kind: 'oath', companion: r.c }] : []);

function questOf(r: Row): { quest: QuestDef; dialogue: DialogueDef } {
  const id = idOf(r);
  const prev = r.kind === 'line' && r.n > 1 ? `${r.c}-l${r.n - 1}` : undefined;
  const requires: Cond =
    r.kind === 'recruit' ? level(r.lvl - 2)
      : r.kind === 'oath' ? all(comp(r.c, 30), level(r.lvl - 2), questDone(`${r.c}-l3`))
        : all(comp(r.c, 10 + 5 * r.n), level(r.lvl - 2), ...(prev ? [questDone(prev)] : []));
  const dlg = `d-${id}`;
  return {
    quest: {
      id, name: r.name, kind: 'companion', level: r.lvl, zone: r.zone, giver: r.c, requires, summary: r.offer,
      stages: [
        stage('do', r.task.text, [objective(r)]),
        stage('talk', `Speak with ${r.c === 'tick' ? 'Tick' : 'them'}.`, [talk('t', 'Hear them out', r.c, dlg)], { onComplete: tail(r) }),
      ],
      rewards: { xp: r.kind === 'oath' ? 0.5 : 0.4, gold: Math.max(4, Math.round(r.lvl / 3)) },
    },
    dialogue: dialogue(dlg, {
      start: say(r.c, r.scene, { choices: [choice(r.a[0], 'a', [approve(r.c, r.a[2])]), choice(r.b[0], 'b', [approve(r.c, r.b[2])])] }),
      a: say(r.c, r.a[1]),
      b: say(r.c, r.b[1]),
    }),
  };
}

const K = (n: number, type: string, text: string): Task => ({ k: 'kill', n, type, text });

// prettier-ignore
const ROWS: Row[] = [
  // ---- Aldric (Brightwater and the road)
  { c: 'aldric', kind: 'line', n: 1, name: 'Candles for the Fallen', zone: 'whisperwood', lvl: 8, task: K(5, 'undead', 'Lay five restless dead to rest in the Whisperwood'), offer: '“The old battlefield has not been blessed in forty years. I would like to bless it. With company.”', scene: '“Forty years of unrest, and they were only waiting for someone to say a name.” He lights a candle. “Would you say one?”', a: ['Say a name with him.', '“Thank you.” He writes it in his book. It is a long book.', 6], b: ['Let him pray alone.', '“Of course. Solenne hears even the quiet ones.”', 2] },
  { c: 'aldric', kind: 'line', n: 2, name: 'The Hymn That Would Not Stop', zone: 'sunken-caves', lvl: 11, task: K(5, 'beast', 'Clear the cave-singers from the Sunken Caves'), offer: '“There is a hymn echoing in the caves, one I wrote at fourteen. It will not stop, and it is not good.”', scene: '“Eleven verses, no chorus. I wrote it for Mott. The caves have taken it and made it worse.” He winces. “Is it very bad?”', a: ['Tell him it is lovely.', '“Liar. I adore you.”', 5], b: ['Tell him the truth.', '“Ah. Yes. The seventh verse rhymes ‘wrath’ with ‘bath’. I knew it.”', 3] },
  { c: 'aldric', kind: 'line', n: 3, name: 'A Crisis of Faith', zone: 'ashen-desert', lvl: 14, task: K(6, 'humanoid', 'Drive off the cultists preaching doubt in the Ashen Desert'), offer: '“A cult is telling pilgrims the gods are not listening. I need to understand why it sounds so reasonable.”', scene: '“They are not wrong about the silence, {hero}. I have felt it. Some nights I cannot find her.” He sits in the sand. “What do I do when the light does not come?”', a: ['Light your own candle.', '“Yes.” He does. His hands shake. It stays lit.', 8], b: ['Wait with him.', '“…Thank you.” The sun comes up, a little late, and a little kind.', 6] },
  // ---- Fenn (the Whisperwood)
  { c: 'fenn', kind: 'line', n: 1, name: 'The Wolf Who Wasn’t Hers', zone: 'whisperwood', lvl: 12, task: K(5, 'beast', 'Drive off the wolves harrying her pack'), offer: '“A stray wolf has been following us. The wolf is upset about it. So am I.”', scene: '“He is thin, and he is scared, and he has chosen me.” She glances at you. “I do not want another one. I cannot lose another one.”', a: ['Let him stay.', '“…Fine. His name is Burr. Do not tell him I said it nicely.”', 7], b: ['Send him on.', '“Yes. You’re right. It’s kinder.” She does not look at you for a while.', -2] },
  { c: 'fenn', kind: 'line', n: 2, name: 'Mother’s Bow', zone: 'whisperwood', lvl: 14, task: K(6, 'humanoid', 'Recover her mother’s bow from the bandits who took it'), offer: '“The bandits took her bow. I want it back. I want to hold it once, and then I will decide what to do.”', scene: '“It is smaller than I remember. She was a small woman. She drew it like a giant.” Her fingers trace the grip. “Can I tell you something? I have never shot it.”', a: ['Shoot it with her.', 'She draws. The arrow flies true. She laughs, and then, very quietly, she cries.', 8], b: ['Let her keep it whole.', '“Yes.” She hangs it on her back. “Maybe someday.”', 5] },
  { c: 'fenn', kind: 'line', n: 3, name: 'Winter Count', zone: 'whisperwood', lvl: 16, task: K(6, 'beast', 'Protect the winter-hunters at the Heartwood from the hollowed beasts'), offer: '“The old hunters count the winters on a post. Mine has no marks. Come help me carve one.”', scene: '“Eleven winters, then. One for each year alone.” The knife is steady. “If I carve a twelfth, will you be here?”', a: ['I will.', '“…Good.” She carves it. It is the best mark on the post.', 8], b: ['I can’t promise.', '“No. I know.” She carves it anyway, and does not say the rest.', 2] },
  // ---- Korga (Ashen Desert)
  { c: 'korga', kind: 'line', n: 1, name: 'The Drunk Who Knew Gorza', zone: 'ashen-desert', lvl: 28, task: K(5, 'humanoid', 'Break up the raiders who drink at Gorza’s old camp'), offer: '“A man in Sandhaven says he knew Gorza. I will buy him a drink. Then I will ask him some questions.”', scene: '“He says Gorza cried when he sold us. I do not believe it. I want to.” She cracks her knuckles. “Do you ever want to believe something?”', a: ['Believe it.', '“…All right. Just for tonight.” She drinks. She does not break anything.', 6], b: ['Doubt it.', '“Yes. That’s my girl. Hard-headed.” She grins, but it is thin.', 3] },
  { c: 'korga', kind: 'line', n: 2, name: 'The Sand Before the Storm', zone: 'ashen-desert', lvl: 31, task: K(6, 'beast', 'Hunt the sand-drake nest that threatens the caravans'), offer: '“There is a drake that eats caravans. I have never killed a drake. I think I would like to.”', scene: '“Fear is only a loud friend,” she says, to herself, maybe. “I was afraid. I am afraid. I did it anyway.” She looks over. “Is that courage or stupidity?”', a: ['Both, and it works.', '“HA! Good answer.” She slaps your shoulder hard enough to hurt.', 6], b: ['Courage. Definitely.', '“Don’t flatter me. But thank you.”', 4] },
  { c: 'korga', kind: 'line', n: 3, name: 'A Warband’s Funeral', zone: 'ashen-desert', lvl: 34, task: K(7, 'undead', 'Lay the warband’s dead to rest in the dunes'), offer: '“The old warband is still out in the sand. I want to bury them properly. All of them.”', scene: '“Eighty graves. I knew every name.” She sets a stone on the last. “If I die, will you do this for me?”', a: ['Every name.', '“Good.” She nods, once. “Louder than that, though. Make them hear it.”', 8], b: ['You are not dying.', '“Ha. No. But thank you.” She smiles, for once, without teeth.', 5] },
  // ---- Ilyra (Frostspire)
  { c: 'ilyra', kind: 'line', n: 1, name: 'Overdue Notes', zone: 'frostspire', lvl: 34, task: K(5, 'undead', 'Retrieve her stolen notebooks from the wights of the Spire'), offer: '“The wights stole my notebooks, which would be fine, if they would not read them aloud.”', scene: '“They are reading my footnotes. In the wrong order. It reads like a confession.” She is pink to the ears. “Is it terrible? Be honest.”', a: ['They are marvelous.', '“You mean that. Oh, I could weep.”', 6], b: ['Fix the order.', '“Yes! Chapter four goes before chapter two. Obviously.”', 4] },
  { c: 'ilyra', kind: 'line', n: 2, name: 'The Library That Burned', zone: 'frostspire', lvl: 36, task: K(6, 'elemental', 'Defend the Guild’s outer library from frost elementals'), offer: '“The Guild’s outer library is under attack. A great many books will die. I will not allow it.”', scene: '“I could not save them all.” A scorched volume sits in her lap. “Do you ever feel you chose the wrong ones to save?”', a: ['You saved what you could.', '“…Thank you.” She presses the book to her chest.', 6], b: ['Choose the next ones better.', '“Yes. A plan. I like a plan.”', 4] },
  { c: 'ilyra', kind: 'line', n: 3, name: 'What the Guild Forbids', zone: 'frostspire', lvl: 38, task: K(6, 'humanoid', 'Hold off the Guild censors on the Spire road'), offer: '“The Guild wants to take me in. Not harshly. Politely. I would prefer to be taken somewhere else.”', scene: '“A hundred and four forbidden books, and ninety-nine read. If I finish, they will have to expel me.” She grins. “Help me finish?”', a: ['Read the last five.', '“Oh, you wonderful troublemaker.”', 7], b: ['Be careful, Ilyra.', '“I am. I am the most careful reckless person you know.”', 3] },
  // ---- Sable (Saltmere)
  { c: 'sable', kind: 'line', n: 1, name: 'A Cut of the Take', zone: 'stormcoast', lvl: 42, task: K(5, 'humanoid', 'Shake down the smugglers who owe Sable a cut'), offer: '“There is a little matter of a small percentage. I would like to collect. Politely.”', scene: '“It is not about the money,” she says, counting the money. “It is the principle. Do you know the principle?”', a: ['Honor among thieves.', '“Exactly. You understand me.” She tosses you a coin.', 6], b: ['It is about the money.', '“Obviously it’s about the money.” She laughs and pockets it.', 5] },
  { c: 'sable', kind: 'line', n: 2, name: 'The Locksmith’s Daughter', zone: 'stormcoast', lvl: 43, task: K(6, 'humanoid', 'Rescue the locksmith’s daughter from the harbor press-gang'), offer: '“Someone I used to know. Her father taught me to pick. She has been taken by the harbor gang.”', scene: '“She is eight. She picks locks with her teeth. I am so proud and so afraid.” Sable holds her tightly. “I am bad at this.”', a: ['You are good at this.', '“…Am I? Then I will do it again.” She kisses the child’s hair.', 8], b: ['Teach her the honest trade.', '“Yes. A shop. Bolts and keys. Something with a door she can open.”', 6] },
  { c: 'sable', kind: 'line', n: 3, name: 'The Jewel That Wasn’t', zone: 'stormcoast', lvl: 45, task: K(6, 'humanoid', 'Track down the fence who passed Sable a fake'), offer: '“I was cheated. Cheated! By a fence! There are standards.”', scene: '“Fifteen years in the trade, and I was had by a man in a hat.” She turns the fake in her fingers. “It’s a very good fake. I think I admire him.”', a: ['Steal it back.', '“Oh, now you’re speaking my language.”', 6], b: ['Let it go.', '“Hm. Growth. I hate it.” She smiles anyway.', 4] },
  // ---- Marisol (Saltmere)
  { c: 'marisol', kind: 'line', n: 1, name: 'The Tide Chorus', zone: 'stormcoast', lvl: 43, task: K(5, 'undead', 'Quiet the drowned singing off the Stormcoast'), offer: '“The drowned are singing a round. It is a very good round. It will drown us all.”', scene: '“Beautiful, isn’t it? It is a trap. It is also my favorite song.” She grins. “Join in on the third bar?”', a: ['Sing along.', 'You sing. You are terrible. The drowned, to their credit, politely flinch.', 6], b: ['Hum in the rests.', '“A harmony! You have an ear.”', 4] },
  { c: 'marisol', kind: 'line', n: 2, name: 'The Siren’s Request', zone: 'stormcoast', lvl: 44, task: K(6, 'humanoid', 'See a young siren safe from the harbor hunters'), offer: '“A young siren has asked me to teach her to sing like a person. I have never been so flattered.”', scene: '“She is too loud,” says Marisol, delighted. “She wants to know where the notes go when she stops.”', a: ['They go to the sea.', '“Yes.” The siren listens, wide-eyed.', 6], b: ['They go to the listener.', '“Yes! That’s it.” The siren hums, shy.', 6] },
  { c: 'marisol', kind: 'line', n: 3, name: 'A Song You Didn’t Write', zone: 'stormcoast', lvl: 46, task: K(6, 'beast', 'Drive the krakenspawn from the old shipwreck cove'), offer: '“Someone is singing my song. The wrong notes. Come and hear. It is making me furious and curious in equal measure.”', scene: '“It is a lullaby my mother wrote. I never taught it to anyone. How does a sea monster know it?”', a: ['Maybe your mother taught it.', 'Her breath catches. “…She sang to the water, in her last year.”', 8], b: ['Maybe the sea remembers.', '“It does,” she whispers. “It does. It kept her song.”', 7] },
  // ---- the new eight
  { c: 'edrin', kind: 'recruit', n: 0, name: 'A Knight Without a Lord', zone: 'aurelane', lvl: 24, task: K(6, 'humanoid', 'Break the press-gang harassing the Aurelane docks'), offer: '“I do not take commissions. I do, however, take notice when a gang takes children from the docks.”', scene: '“I was second in the Watch,” says the knight, helmet under his arm. “I stood at a hanging I knew was wrong. I would like to stand somewhere else now.”', a: ['Stand with us.', '“I will. If you will have me.”', 6], b: ['Prove it first.', '“Fair. Watch me.”', 3] },
  { c: 'edrin', kind: 'line', n: 1, name: 'The Hanged Man’s Widow', zone: 'aurelane', lvl: 25, task: K(5, 'humanoid', 'Carry the Watch’s apology to the widow in the Underbelly'), offer: '“The man they hanged had a wife. I never spoke to her. I would like to.”', scene: '“She did not forgive me. She poured me tea.” He holds the cup like a relic. “I do not know which is worse.”', a: ['Tea is a start.', '“Is it? Yes. Yes, I think it is.”', 6], b: ['Keep going.', '“I will. Every year. Until she says stop.”', 5] },
  { c: 'edrin', kind: 'line', n: 2, name: 'Dusk’s Saddle', zone: 'aurelane', lvl: 26, task: K(6, 'beast', 'Find and bury the knight’s old warhorse at the Aurelane commons'), offer: '“My horse died under me in the war. I never buried him. I carry his saddle. It is time.”', scene: '“Dusk was a coward and a delight.” He sets the saddle in the earth. “I think I loved him more than most men.”', a: ['Say a word for him.', '“Dusk. Good boy.” He steadies. “That will do.”', 7], b: ['Keep the saddle.', '“Yes. I think I can carry it lighter now.”', 4] },
  { c: 'edrin', kind: 'line', n: 3, name: 'The Crest in the Pocket', zone: 'aurelane', lvl: 28, task: K(6, 'humanoid', 'Stand the Gilded Gate against the Guild enforcers'), offer: '“Valeria has offered me my crest back. I told her I would answer after the Gate.”', scene: '“I do not deserve it.” He holds the crest. “But I would like to. Is that wrong?”', a: ['Wanting to deserve it is the start.', '“Then I shall start.” He pins it on.', 8], b: ['It is only a crest.', '“True. The man matters more.” He keeps it in his pocket.', 4] },
  { c: 'edrin', kind: 'oath', n: 0, name: 'Crest Restored', zone: 'aurelane', lvl: 29, task: K(7, 'humanoid', 'Break the hangman’s guild that still keeps the gallows'), offer: '“There is a hangman’s guild. It still keeps the gallows. I would like to end it, with you beside me.”', scene: '“The gallows come down tomorrow.” He looks at you. “I have been a knight without a lord for twenty years. If you would have me: I choose you.”', a: ['I accept your oath.', '“Then I am a knight again.” He kneels. It is a very small ceremony, and the finest you have attended.', 10], b: ['Choose yourself.', '“…Yes. That is truer.” He rises. “Then I will walk beside you, not behind.”', 8] },
  { c: 'thistle', kind: 'recruit', n: 0, name: 'The Toad Who Would Be Mayor', zone: 'moonfen', lvl: 17, task: { k: 'clear', dungeon: 'drowned-orchard', text: 'Clear the Drowned Orchard of what stole Thistle’s pot' }, offer: '“Someone took my pot. It had my whole day in it. And a toad, who was only visiting.”', scene: '“Oh! You found it! And the toad! You are marvelous.” She hugs the pot, then you. “May I walk with you? I would feed you.”', a: ['Gladly.', '“Splendid! Have a biscuit.”', 6], b: ['A short while.', '“Short is fine. Short is where friendships grow.”', 3] },
  { c: 'thistle', kind: 'line', n: 1, name: 'The Frog Funeral', zone: 'moonfen', lvl: 18, task: K(5, 'beast', 'Drive the bog-lurkers from the Frog Road'), offer: '“The frogs have lost one of their own. There will be a service. I will need an escort and a lot of flies.”', scene: '“Mayor was the best of toads,” she says, over a tiny grave. “He had an opinion about everything and was right about most.”', a: ['Say a few words.', 'You say a few words. A choir of frogs approves.', 6], b: ['Hold her hand.', 'She holds it back. The frogs sing.', 7] },
  { c: 'thistle', kind: 'line', n: 2, name: 'Moonpetal Season', zone: 'moonfen', lvl: 19, task: K(6, 'plant', 'Guard the moonpetal fields from the reed-hags'), offer: '“The moonpetals bloom once a year, and the hags want them for tea. I want them for soup.”', scene: '“Isn’t it lovely? Like little lamps.” She picks one. “The old rule: take one, leave three, say thank you.”', a: ['Say thank you.', 'You say it. The field seems to bow.', 6], b: ['Take two.', '“Hm. Don’t be greedy, dear.” She puts one back, gently.', -1] },
  { c: 'thistle', kind: 'line', n: 3, name: 'A Bear in the Kitchen', zone: 'moonfen', lvl: 20, task: K(6, 'beast', 'Corral the great bear that has wandered into Mirewick'), offer: '“There is a bear in the Warden’s kitchen. I would like to have a word. With the bear, not the Warden.”', scene: '“He was only hungry.” She feeds him honey. “Everyone is, if you listen to the right part.”', a: ['Feed him more.', '“Oh, you do understand.”', 7], b: ['Send him off.', '“Yes. Gently. With a pie.”', 5] },
  { c: 'thistle', kind: 'oath', n: 0, name: 'Mother of Mayors', zone: 'moonfen', lvl: 21, task: K(7, 'undead', 'Lay the Fen’s restless drowned to rest so the lanterns can be lit again'), offer: '“The Fen has been sad too long. I think it needs a feast. A feast for the living and the dead and the frogs.”', scene: '“Look at them, all together.” Lanterns, soup, frogs. “I belong to the woods and I belong to people. I thought I had to pick.”', a: ['You never had to.', '“No.” She laughs, a big wet laugh. “No, I never did.”', 9], b: ['Pick both.', '“Both. Yes. That’s the recipe.”', 8] },
  { c: 'thorne', kind: 'recruit', n: 0, name: 'A Witch Let Go', zone: 'gloamwood', lvl: 26, task: K(6, 'undead', 'Clear the hollow woodsmen from the Lamplighters’ Trail'), offer: '“I do not take company. I do, however, take tips about hexes. You have a hex on your boot.”', scene: '“I let one go,” says the hunter, pistols clean, face closed. “Once. I have been looking for a reason to be wrong ever since.”', a: ['Join us.', '“…For now. I make no promises about the rest.”', 5], b: ['Keep hunting.', '“Of course. That is the point.”', 2] },
  { c: 'thorne', kind: 'line', n: 1, name: 'The Sister’s Birthday Card', zone: 'gloamwood', lvl: 27, task: K(5, 'humanoid', 'Escort a warded letter through the Gloamwood'), offer: '“My sister sends me a card each year. I never answer. This year I will.”', scene: '“Thirty words. I have drafted four hundred.” She hands you the card. “Will you read it and tell me if I sound like a person?”', a: ['You sound like you.', '“That is the problem.” But she sends it.', 6], b: ['Cut the last line.', '“The last line is the point.” She leaves it in.', 3] },
  { c: 'thorne', kind: 'line', n: 2, name: 'The Cottage on the Hill', zone: 'gloamwood', lvl: 28, task: K(6, 'beast', 'Clear a witch’s abandoned cottage of the creatures that moved in'), offer: '“A cottage. A hearth. A hex long dead. I would like to see if it has anything left to say.”', scene: '“A kettle and two cups.” She turns one over. “She was expecting someone. It was not me. It never is.”', a: ['It could be you.', '“…Make the tea.” She sits. It is the first time you have seen her sit.', 7], b: ['Burn it.', '“Yes. Of course.” She does not light the match.', 1] },
  { c: 'thorne', kind: 'line', n: 3, name: 'Silver for Smiling', zone: 'gloamwood', lvl: 29, task: K(6, 'humanoid', 'Break the pact-cult that preys on the lamplighters'), offer: '“There is a pact-cult in the Trail. It smiles at children. I have never needed silver more.”', scene: '“I did not hesitate.” Her hands shake only now, after. “Is that good? Should I have hesitated?”', a: ['You did right.', '“…I would like that to be true.”', 6], b: ['It will cost you.', '“It always does.” She nods. “Thank you for not lying.”', 7] },
  { c: 'thorne', kind: 'oath', n: 0, name: 'Hearth Over Hunt', zone: 'gloamwood', lvl: 30, task: K(7, 'undead', 'Hold the Lampfall road against the pact-bound shades'), offer: '“I know where my sister lives. I have always known. I would like to go, if you will walk the road with me.”', scene: '“She is small, and gray, and she has a garden.” Thorne breathes. “I thought she would be larger.”', a: ['Go in.', '“Come with me.” You do. It is a long, awkward, wonderful tea.', 10], b: ['Wait outside.', '“Thank you.” She goes in alone. When she comes out, she is smiling.', 9] },
  { c: 'hrafna', kind: 'recruit', n: 0, name: 'The Boot Has Opinions', zone: 'thornreach', lvl: 28, task: K(6, 'humanoid', 'Drive the raiders off the spirit-grove at Briarhold'), offer: '“My grandmother’s ghost says you are about to be attacked. I say she is early, but she is rarely wrong.”', scene: '“The spirits like you,” says the orc, and kicks her left boot. “Quiet. They like you. I do not yet. But I will come.”', a: ['Welcome.', '“Hm. Fine.” The boot rattles approvingly.', 5], b: ['Prove it.', '“I will. Watch the earth.”', 3] },
  { c: 'hrafna', kind: 'line', n: 1, name: 'A Totem for the Road', zone: 'thornreach', lvl: 29, task: K(5, 'beast', 'Cut the spirit-wood from the Thornreach thicket'), offer: '“A good totem needs a good tree. The Thornreach has one. It also has thorns, raiders and a mood.”', scene: '“Carve it with me.” She hands you a knife. “Make it ugly. Ugly keeps the evil eye away.”', a: ['Carve something ugly.', 'You carve. It looks like a duck. Hrafna approves.', 5], b: ['Carve something kind.', 'She looks at it for a long moment. “…That will do.”', 6] },
  { c: 'hrafna', kind: 'line', n: 2, name: 'What the Dead Want', zone: 'thornreach', lvl: 31, task: K(6, 'undead', 'Lay the Thornreach’s unmourned dead to rest'), offer: '“They are not angry. They are unfinished. There is a difference. Come help me finish them.”', scene: '“They want to be told they are loved. Most people do.” She sets down a bowl. “Say a word?”', a: ['I am sorry.', '“Good. Short. They like short.”', 6], b: ['They are loved.', '“Yes.” The bowl is empty. The air feels lighter.', 7] },
  { c: 'hrafna', kind: 'line', n: 3, name: 'The Last Chief', zone: 'thornreach', lvl: 32, task: K(6, 'humanoid', 'Hold the old chief’s barrow against grave-robbers'), offer: '“My mother’s barrow. Raiders are digging. I would like them to have a stern conversation with the ground.”', scene: '“I was meant to be chief,” says Hrafna. “I chose the spirits instead. Do you think she minds?”', a: ['She is proud of you.', '“…The boot says she is. Hm. Convenient.”', 8], b: ['You can still lead.', '“Maybe. Maybe not.” She smiles. “Ask me later.”', 5] },
  { c: 'hrafna', kind: 'oath', n: 0, name: 'The Boot Speaks', zone: 'thornreach', lvl: 33, task: K(7, 'undead', 'Walk the ancestors’ road to the Thornmother’s hollow'), offer: '“My grandmother has something to say. She has said it for sixty years. Today, she wants an audience.”', scene: '“She says she is proud,” Hrafna says, hoarse. “She says she always was. She says my boots are a disgrace.”', a: ['Thank her.', '“She says you are welcome. She says you should eat more.”', 10], b: ['Ask her to stay.', '“She says: ‘I am the boot, child. Where else would I go?’”', 9] },
  { c: 'bexley', kind: 'recruit', n: 0, name: 'Probably Stable', zone: 'saltglass', lvl: 35, task: { k: 'clear', dungeon: 'prism-mines', text: 'Clear the Prism Mines of what is eating Bexley’s reagent stores' }, offer: '“Someone ate my reagents. Not stole. Ate. I have a theory. It involves a scorpion and bad judgment.”', scene: '“You did it! Look, only a little glowing!” She is covered in purple. “I would like to travel with you. I am extremely helpful and only occasionally on fire.”', a: ['Join us.', '“Hooray! Do not stand near that.”', 6], b: ['Stand back first.', '“Wise. Very wise. Here, wear goggles.”', 3] },
  { c: 'bexley', kind: 'line', n: 1, name: 'The Cure for Everything', zone: 'saltglass', lvl: 36, task: K(5, 'humanoid', 'Collect the quicksilver stolen by a rival apothecary'), offer: '“I have invented a cure for everything. It needs quicksilver, patience and an enemy.”', scene: '“Test number forty. It did not explode!” She stares at the vial. “It also did not cure anything. Is that a win?”', a: ['It is a win.', '“Then I will frame it.” She does not frame it.', 6], b: ['Try forty-one.', '“Yes! That’s the spirit.” Something pops.', 5] },
  { c: 'bexley', kind: 'line', n: 2, name: 'The Gnome Who Taught Me', zone: 'saltglass', lvl: 37, task: K(6, 'humanoid', 'Find her old master’s lab in the salt dunes'), offer: '“My master left me a lab in the dunes. He did not say where. I am extremely sure it is on fire.”', scene: '“He left me a letter,” says Bexley, voice small. “Four words. ‘Be kind. Label everything.’ I always thought he meant the jars.”', a: ['He meant you.', '“…Oh.” She reads it again.', 8], b: ['Label the jars.', '“I will. In pencil. Lightly.”', 4] },
  { c: 'bexley', kind: 'line', n: 3, name: 'A Fever in Lensfall', zone: 'saltglass', lvl: 38, task: K(6, 'beast', 'Clear the plague-rats from the Lensfall wells'), offer: '“Lensfall has a fever. I have a remedy. I have eleven remedies, in fact. None are tested.”', scene: '“Number six worked,” she says, shaking. “It worked on everyone but one. I did not save the baker.”', a: ['You saved everyone else.', '“I know. I know.” She hugs her knees.', 7], b: ['Make number twelve.', '“…Yes. I will. For the baker.”', 7] },
  { c: 'bexley', kind: 'oath', n: 0, name: 'The Cure for Regret', zone: 'saltglass', lvl: 40, task: K(7, 'humanoid', 'Secure the mirror-glass the cure needs from the Glass Cathedral road'), offer: '“I think I have finished it. The cure for regret. It is not a potion. I will need you to hold the flask.”', scene: '“It is water,” she says, laughing and weeping. “Water with a note. ‘Be kinder to yourself.’ I have been drinking it for years.”', a: ['Drink it with her.', 'You drink. It is only water. It tastes, somehow, like forgiveness.', 10], b: ['Write the note bigger.', '“Yes! Block letters!” She does.', 8] },
  { c: 'zeph', kind: 'recruit', n: 0, name: 'The Last Show on the Isles', zone: 'shattered-isles', lvl: 38, task: K(6, 'beast', 'Clear the reaver gulls from the Wreck’s End stage'), offer: '“I have a show tonight. The stage has gulls. The gulls have opinions. Help me, and I will dedicate a dance to you.”', scene: '“Curtain!” she cries, to the cheering dockside. “And you were wonderful. May I join your caravan? I travel light. Mostly ribbons.”', a: ['Join us.', '“Divine! I will pack my glitter.”', 6], b: ['One more show.', '“A flatterer! Very well.”', 3] },
  { c: 'zeph', kind: 'line', n: 1, name: 'The Troupe That Left', zone: 'shattered-isles', lvl: 39, task: K(5, 'humanoid', 'Free the stranded troupe-wagon from the Isle pirates'), offer: '“My old troupe is stranded on the Isles. They were my family. I left them in the night.”', scene: '“Hello, Mama.” A pause, long as a held note. “I know. I know I left. Can I stay for supper?”', a: ['I will wait outside.', '“Thank you.” She goes in. She stays three hours.', 6], b: ['Come in with her.', 'You do. It is a loud, warm, awkward supper.', 8] },
  { c: 'zeph', kind: 'line', n: 2, name: 'A Dance for the Wind', zone: 'shattered-isles', lvl: 41, task: K(6, 'elemental', 'Reach the Gale Stone through the storm-petrels'), offer: '“Seraphel asked once that I stop spinning. I want to give her a dance instead. A slow one.”', scene: '“It is very hard to be slow,” Zeph gasps. “Every part of me wants to run.”', a: ['Run, then.', '“Oh. Oh, that’s better.” She spins, and the wind answers.', 7], b: ['Try again, slower.', '“Again. Slower. Again.” By the fourth try, she weeps with joy.', 8] },
  { c: 'zeph', kind: 'line', n: 3, name: 'The Understudy', zone: 'shattered-isles', lvl: 42, task: K(6, 'humanoid', 'Guard her young understudy from the harbor bullies'), offer: '“A girl in the troupe wants my solo. I told her to take it. I am terrified.”', scene: '“She is better than I was,” says Zeph, smiling and crying. “How awful. How wonderful.”', a: ['You were wonderful.', '“Yes. I was.” She laughs, tears and all.', 7], b: ['You still are.', '“Flatterer.” But she tilts her chin up.', 6] },
  { c: 'zeph', kind: 'oath', n: 0, name: 'The Last Encore', zone: 'shattered-isles', lvl: 43, task: K(7, 'beast', 'Take the Wreck’s End stage back from the storm-spawn'), offer: '“I have one more dance. It is for no one. I want it to be for you.”', scene: '“Do not clap,” she says, mid-spin. “Do not clap until I stop. And if I never stop, promise you will tell me when I may.”', a: ['I will tell you.', 'She stops. She is crying and laughing. “Oh. Oh. That’s a dance.”', 10], b: ['Dance with her.', 'You do. You are terrible. It is perfect.', 9] },
  { c: 'kessa', kind: 'recruit', n: 0, name: 'A Sandstone Heart', zone: 'khazrum', lvl: 38, task: K(6, 'construct', 'Stop the rune guardians collapsing the Fourth Clan’s tunnel'), offer: '“The Fourth Clan’s tunnel is falling in. I could shore it up. I could also use help.”', scene: '“Well,” says Kessa, brushing dust off her beard. “That is a good arm. I would like to be near it, if you travel. I am excellent with ceilings.”', a: ['Join us.', '“Splendid. I’ll pack the chisel.”', 5], b: ['Mind the tunnel first.', '“Quite right. Hold this beam.”', 3] },
  { c: 'kessa', kind: 'line', n: 1, name: 'The Feud I Inherited', zone: 'khazrum', lvl: 39, task: K(5, 'humanoid', 'Break up the clan skirmish in the Dwarf Road tunnels'), offer: '“My cousin of the Fifth Clan wants to have it out. I would rather have it in.”', scene: '“Three hundred years of feud,” says Kessa, “and my uncle’s opinion of my cousin’s hat is the root cause.” She stares at it. “It really is a bad hat.”', a: ['End it with a laugh.', '“A laugh! Yes! The mountain has not heard one in years.”', 7], b: ['Talk to the Thane.', '“The Thane? Hm. Brave.”', 5] },
  { c: 'kessa', kind: 'line', n: 2, name: 'Sand in the Mortar', zone: 'khazrum', lvl: 41, task: K(6, 'construct', 'Hold the hall of statues against the Foundry’s stray constructs'), offer: '“I put sand in the mortar once. The clans were furious. The wall has held for forty years.”', scene: '“Soft things hold longer,” she says, patting the wall. “That is the lesson. Nobody will hear it.”', a: ['I hear it.', '“…Good.” She rests her forehead on the stone.', 7], b: ['Teach me.', '“Sit. Hold the trowel. Gently.”', 6] },
  { c: 'kessa', kind: 'line', n: 3, name: 'A Hall With No Quarrel', zone: 'khazrum', lvl: 42, task: K(6, 'undead', 'Clear the haunted Seventh Hall of the ancestors’ shades'), offer: '“I want to build a hall where no one fights. Stone by stone. The Seventh Hall has the best foundation.”', scene: '“Look at it,” she says. “Empty. Perfect. The first thing in three hundred years that nobody owns.”', a: ['Put your name on it.', '“No. Put everyone’s.” She carves them, all seven clans.', 8], b: ['Leave it empty.', '“Yes. A hall for nobody. A hall for anyone.”', 7] },
  { c: 'kessa', kind: 'oath', n: 0, name: 'Cornerstone', zone: 'khazrum', lvl: 43, task: K(7, 'construct', 'Set the first stone of the Peace Hall against the Stone Warden’s wrath'), offer: '“The first stone of the Peace Hall. I need a witness. I need a steady hand. I need you.”', scene: '“Now,” says Kessa, hands on the stone. “Say the word. The oldest word. ‘Stay.’”', a: ['Stay.', 'The stone settles. The mountain hums. Somewhere, a clan stops arguing.', 10], b: ['Stand.', 'The stone rises. The hall is built. It holds.', 9] },
  { c: 'tick', kind: 'recruit', n: 0, name: 'Query: Friendship', zone: 'clockwork-foundry', lvl: 49, task: K(6, 'construct', 'Shut down the rogue assemblers hunting the Forged in Ratchet'), offer: '“I am being hunted by the Foundry’s assemblers. They want me for parts. I would rather keep them.”', scene: '“Thank you,” says Tick, in a voice with a very slight whir. “I would like to follow you. Query: is this friendship? I am logging it as friendship.”', a: ['It is friendship.', '“Acknowledged. I will update my parameters.”', 6], b: ['It is a start.', '“A start. Logged. I like starts.”', 4] },
  { c: 'tick', kind: 'line', n: 1, name: 'Spare Gears', zone: 'clockwork-foundry', lvl: 50, task: K(5, 'construct', 'Salvage clean gears from the Assembly Halls'), offer: '“I would like to make you a gift. It requires eleven gears and a proper emotion.”', scene: '“A music box,” says Tick. “It plays one song. I composed it. It is eleven notes.” Click. “Do you like it? Query: do you like it?”', a: ['I love it.', '“Acknowledged. I am happy. I think. It feels like a small spring unwinding.”', 7], b: ['It is eleven notes.', '“Yes! Eleven! A good number.”', 5] },
  { c: 'tick', kind: 'line', n: 2, name: 'The Maker’s Workshop', zone: 'clockwork-foundry', lvl: 51, task: K(6, 'construct', 'Reach Pennywhistle’s old workshop through the Foundry’s guards'), offer: '“My maker’s workshop is in the Foundry’s oldest wing. I have never been. I would like to see it. Query: will you come?”', scene: '“There is a letter,” says Tick. “It is for me. It says: ‘Dear Tick. You were never a mistake.’ I have read it two hundred times.”', a: ['She was right.', '“Query: how do you know?” “I just do.” “Acknowledged.”', 8], b: ['Read it again.', '“Two hundred and one.” It does.', 7] },
  { c: 'tick', kind: 'line', n: 3, name: 'The Hum in the Bones', zone: 'clockwork-foundry', lvl: 52, task: K(6, 'construct', 'Keep the First Engine’s call from reaching Tick in the old signal tower'), offer: '“The Engine calls to me. It is not a command. It is a lullaby. I do not wish to answer.”', scene: '“I could stop,” says Tick. “I could return and be part of it. It would be simple.” A pause. “Query: should I?”', a: ['Stay with us.', '“Acknowledged. I choose. This is choosing.”', 9], b: ['It is your choice.', '“Yes. It is.” It does not move toward the Engine.', 8] },
  { c: 'tick', kind: 'oath', n: 0, name: 'A Name of My Own', zone: 'clockwork-foundry', lvl: 53, task: K(7, 'construct', 'Defend Ratchet’s foundling workshop from the First Engine’s drones'), offer: '“I would like a new name. Not Tick. A second name, for the part of me that is not a clock.”', scene: '“I have chosen,” says Tick. “If you do not mind. I would like to be called… Tock. Because a clock needs both.”', a: ['Tick and Tock.', '“Acknowledged. I am two things. It is wonderful.”', 10], b: ['Just Tick, still.', '“Tick is also acceptable. Thank you for allowing a choice.”', 8] },
];

const built = ROWS.map(questOf);
export const GREATER_QUESTS: QuestDef[] = built.map((b) => b.quest);
export const GREATER_DIALOGUES: DialogueDef[] = built.map((b) => b.dialogue);

/** The five quests of each companion's personal line, in order. */
const LINE_OF = (id: string, recruit: string, oath: string): string[] => [recruit, `${id}-l1`, `${id}-l2`, `${id}-l3`, oath];

/** The original six, given their new fields, plus the eight new companions. */
export function buildCompanions(base: BaseCompanion[]): CompanionDef[] {
  return [...base, ...NEW_COMPANIONS].map((c) => {
    const x = EXTRA[c.id];
    if (!x) throw new Error(`companion ${c.id} has no loyalty, leave condition or romance flag`);
    return { ...c, ...x, line: LINE_OF(c.id, c.recruitQuest, c.personalQuest) };
  });
}

