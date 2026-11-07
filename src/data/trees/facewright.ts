import type { GreaterClass } from '../greaterClass';
import type { StanceDef } from '../stances';
import type { EffectSpec } from '../../engine/effects/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, spec, stance, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const m = (stat: string, value: number, type: 'flat' | 'percent' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
/** Twelve Masks, each a full persona: its own stat set, its own basic attack and its own one-line voice. */
type Mask = [id: string, name: string, voice: string, mods: ModifierSpec[], mult: number, fx: EffectSpec[], skillText: string];
// prettier-ignore
const MASKS: Mask[] = [
  ['fool', 'the Fool', '“Oh, I never meant to hit you.”', [m('dodge', 15), m('luk', 3)], 1.1, [status('confuse', 1, { chance: 30 })], '+15 dodge and +3 LUK; basic attacks may Confuse'],
  ['sage', 'the Sage', '“Let me explain, as I strike.”', [m('magicAttack', 15, 'percent'), m('cooldownReduction', 8)], 1.0, [gain('persona', 4)], '+15% magic attack and 8% cooldown reduction'],
  ['hero', 'the Hero', '“Stand behind me. I mean it.”', [m('physicalAttack', 12, 'percent'), m('defense', 10, 'percent')], 1.2, [], '+12% physical attack and +10% defense'],
  ['knave', 'the Knave', '“Whose purse is this? Mine, now.”', [m('critChance', 12), m('goldFind', 10)], 1.15, [{ kind: 'gold', amount: 3 }], '+12% crit and +10% gold found; basic attacks lift 3 gold'],
  ['widow', 'the Widow', '“I have buried better.”', [m('shadowDamage', 15), m('statusChance', 10)], 1.1, [status('curse', 2, { chance: 30 })], '+15% shadow damage and +10% status chance'],
  ['hound', 'the Hound', '“Smell that? Fear.”', [m('speed', 15, 'percent'), m('accuracy', 10)], 1.2, [status('bleed', 2, { chance: 35 })], '+15% speed and +10 accuracy; basic attacks may Bleed'],
  ['lord', 'the Lord', '“Kneel. Do not be tiresome.”', [m('damageBonus', 12), m('statusResist', 10)], 1.2, [status('fear', 1, { chance: 25 })], '+12% damage and +10% status resist'],
  ['ghost', 'the Ghost', '“Did you feel that? No?”', [m('dodge', 20), m('damageTaken', -8, 'more')], 1.0, [status('stealth', 1, { chance: 20, target: 'self' })], '+20 dodge and 8% less damage taken'],
  ['saint', 'the Saint', '“Be at peace. Hold still.”', [m('healingPower', 15), m('holyDamage', 12)], 1.0, [healPct(3)], '+15% healing power and +12% holy damage; basic attacks heal 3%'],
  ['sinner', 'the Sinner', '“Do not look at the hands.”', [m('damageBonus', 15), m('defense', -8, 'percent')], 1.25, [status('burn', 2, { chance: 30 })], '+15% damage, 8% less defense; basic attacks may Burn'],
  ['muse', 'the Muse', '“Someone is watching. Let us be marvelous.”', [m('resourceGain', 15), m('speed', 8)], 1.1, [gain('persona', 6)], '+15% resource gain and +8 speed; basic attacks give 6 Persona'],
  ['tyrant', 'the Tyrant', '“Sit down. Everyone.”', [m('damageBonus', 18), m('maxHp', 10, 'percent')], 1.3, [status('slow', 1, { chance: 30 })], '+18% damage and +10% max HP; basic attacks may Slow'],
];
export const MASK_STANCES: StanceDef[] = MASKS.map(([id, name, voice, mods, mult, fx, text]) => ({ id: `mask-${id}`, name: `Mask of ${name}`, description: `${text}. ${voice}`, modifiers: mods, basicAttack: { multiplier: mult, effects: fx } }));
const don = (id: string, o: { spec?: boolean } = {}) => {
  const [mid, name, voice, , , , text] = MASKS.find((x) => x[0] === id) as Mask;
  const fn = o.spec ? spec : act;
  return fn(`don-${mid}`, `Mask of ${name}`, `Don the mask and strike for 120% ATK: ${text}. Gain 12 Persona. ${voice}`, { el: 'physical', to: 'enemy', tags: ['Attack', 'Melee', 'Physical', 'Stance'], cd: 2, dmg: ['p', 1.2, 0.09], fx: [stance(`mask-${mid}`), gain('persona', 12)] });
};
const X = ['Attack', 'Melee', 'Physical'] as const;
export const FACEWRIGHT_SKILLS = [
  don('fool'), don('sage'), don('hero'), don('knave'), don('widow'), don('hound'), don('lord'), don('ghost'), don('saint'), don('sinner'),
  don('muse', { spec: true }), don('tyrant', { spec: true }),
  spec('unmasking', 'The Unmasking', 'Spend 30 Persona: 320% ATK; the foe is Feared, Weakened and Vulnerable.', { el: 'physical', to: 'enemy', tags: [...X], cd: 4, res: ['persona', 30], dmg: ['p', 3.2, 0.22], fx: [status('fear', 2), status('weaken', 2), status('vulnerable', 2)] }),
  ult('grand-masquerade', 'The Grand Masquerade', 'Every face at once: 320% ATK to every enemy, all Confused and Feared; Persona fills.', { el: 'physical', to: 'allEnemies', tags: [...X, 'AoE'], dmg: ['p', 3.2, 0], fx: [status('confuse', 2, { target: 'allEnemies' }), status('fear', 2, { target: 'allEnemies' }), gain('persona', 100)] }),
  ult('final-bow-call', 'Curtain Call', 'Take the final bow: 300% ATK to every enemy; heal 20%.', { el: 'physical', to: 'allEnemies', tags: [...X, 'AoE'], dmg: ['p', 3.0, 0], fx: [healPct(20)] }),
  ult('rule-of-the-throne', 'Rule of the Throne', 'The Tyrant’s hour: 340% ATK to every enemy, all Slowed; +25% damage for you for 3 turns.', { el: 'physical', to: 'allEnemies', tags: [...X, 'AoE'], dmg: ['p', 3.4, 0], fx: [status('slow', 3, { target: 'allEnemies' }), buff('throne', 3, [{ stat: 'damageBonus', type: 'flat', value: 25 }])] }),
  ult('facewrights-final-face', 'The Facewright’s Final Face', 'The face behind the faces: 310% ATK to every enemy, heal 15% and +20% damage and crit for 3 turns.', { el: 'physical', to: 'allEnemies', tags: [...X, 'AoE'], dmg: ['p', 3.1, 0], fx: [healPct(15), buff('final-face', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }, { stat: 'critChance', type: 'flat', value: 10 }])] }),
];
const SK = FACEWRIGHT_SKILLS;
export const FACEWRIGHT_TREE = liteTree('facewright', SK, [
  { id: 'comic', name: 'The Comic Masks', color: '#e8c868', desc: 'The first face is a joke. The second is the one who told it.', a: 'don-fool', b: 'don-sage', stats: ['dodge', 'magicAttack', 'luk', 'int'], names: ['Painted Smile', 'Funny Walk', 'Quick Wit', 'Deep Pockets', 'Bell Cap', 'Wise Brow', 'Raised Eyebrow', 'Long Beard', 'Wisdom of Fools', 'Master of Comic Masks'] },
  { id: 'martial', name: 'The Martial Masks', color: '#c86a4a', desc: 'The brave face, and the one who is only pretending.', a: 'don-hero', b: 'don-knave', stats: ['physicalAttack', 'critChance', 'defense', 'str'], names: ['Plumed Helm', 'Gold Paint', 'Brave Chin', 'Square Jaw', 'Heroic Brow', 'Sly Grin', 'Fast Hands', 'Flashy Cape', 'Two Faces', 'Master of Martial Masks'] },
  { id: 'dark', name: 'The Dark Masks', color: '#6a3a6a', desc: 'The faces worn after the lamps go down.', a: 'don-widow', b: 'don-hound', stats: ['shadowDamage', 'speed', 'statusChance', 'accuracy'], names: ['Black Lace', 'Pale Powder', 'Long Veil', 'Sharp Eye', 'Mourning Face', 'Hunting Face', 'Deep Hood', 'Silent Step', 'Night Faces', 'Master of Dark Masks'] },
  { id: 'court', name: 'The Court Masks', color: '#a888d8', desc: 'The masks that give orders, and the ones that watch them.', a: 'don-lord', b: 'don-ghost', stats: ['damageBonus', 'dodge', 'statusResist', 'cha'], names: ['Gilded Rim', 'Crown Point', 'Velvet Lining', 'Cold Gaze', 'Lord’s Face', 'Ghost’s Face', 'Pale Hand', 'Thin Smile', 'Court Intrigue', 'Master of Court Masks'] },
  { id: 'faith', name: 'The Faithful Masks', color: '#e8e8c8', desc: 'The face of holy things, and the face that knows better.', a: 'don-saint', b: 'don-sinner', stats: ['holyDamage', 'healingPower', 'critChance', 'fai'], names: ['Halo Paint', 'Gentle Smile', 'Red Rouge', 'Raised Hand', 'Saint’s Face', 'Sinner’s Face', 'Pious Eyes', 'Wicked Grin', 'Faith and Sin', 'Master of Faithful Masks'] },
]);
export const FACEWRIGHT_SPECS = liteSpecs(SK, [
  { id: 'muse', name: 'Stage-Muse', color: '#e8a8d8', desc: 'Everyone is looking at you. You are, therefore, wonderful.', skill: 'don-muse', ult: 'final-bow-call', stats: ['resourceGain', 'speed', 'luk'], names: ['Footlights', 'Stage Whisper', 'Spotlight', 'Applause', 'Encore', 'Bouquet', 'Bow', 'Stage-Muse Ascendant'] },
  { id: 'tyrant', name: 'Mask-Tyrant', color: '#a83a3a', desc: 'You are only wearing it. That is the horror.', skill: 'don-tyrant', ult: 'rule-of-the-throne', stats: ['damageBonus', 'maxHp', 'physicalAttack'], names: ['Iron Crown', 'Heavy Mantle', 'Cold Order', 'Throne', 'Royal Decree', 'Sceptre', 'Dynasty', 'Mask-Tyrant Ascendant'] },
  { id: 'unmasker', name: 'Unmasker', color: '#8a8a8a', desc: 'Under every face is another face. You know where the seam is.', skill: 'unmasking', ult: 'grand-masquerade', stats: ['critChance', 'statusChance', 'accuracy'], names: ['Peeled Edge', 'Loose Seam', 'Lifted Veil', 'Sudden Reveal', 'Torn Mask', 'Naked Face', 'Last Layer', 'Unmasker Ascendant'] },
]);

export const FACEWRIGHT: GreaterClass = {
  def: {
    id: 'facewright', name: 'Facewright', tagline: 'You are whoever the room needs. Briefly.',
    description: 'A performer who wears one of twelve Masks, each a full persona with its own skills, voice and basic attack. Tied to the Masque Catacombs and the Masquerades.',
    playstyle: 'Don a Mask: each one changes your stats and basic attack. Persona builds from each change and spends on the Unmasking. Stage-Muse builds Persona, Mask-Tyrant rules, Unmasker rips faces off.',
    role: 'Melee / shapeshifter', difficulty: 3, color: '#d8a8d8',
    mechanic: { name: 'Persona and Masks', description: 'Donning a Mask is a stance: stats, basic attack and one line of dialogue. Persona builds when you change faces and spends on the Unmasking.' },
    trait: traitOf('A Face for Every Occasion', [['dodge', 6]], '+6 dodge', 'physicalAttack', 1.2),
    resource: 'persona',
    baseStats: { str: 3, dex: 7, int: 5, vit: 5, wis: 4, luk: 6, fai: 4, cha: 7 },
    growth: { str: 0.3, dex: 1.1, int: 0.8, vit: 0.8, wis: 0.6, luk: 0.9, fai: 0.5, cha: 1.1 },
    weapons: ['rapier', 'dagger', 'sword', 'instrument', 'wand'], armor: ['cloth', 'leather'],
    startingSkills: ['don-fool', 'don-hero'], ultimate: 'facewrights-final-face', defaultRow: 'front',
  },
  resource: { id: 'persona', name: 'Persona', max: 100, start: 10, decayPerTurn: 2, color: '#d8a8d8', description: 'Builds when you change Masks. The Unmasking spends it.', gains: { onBasicAttack: 4 } },
  skills: SK, tree: FACEWRIGHT_TREE, specs: FACEWRIGHT_SPECS,
  extras: { stances: MASK_STANCES },
  mentor: mentorOf('mentor-facewright', 'Maestro Veyl Dorrance', 'Has not shown the same face to the same person twice. Several people have noticed.', 'Painted Cane', ['#a86aa8', '#e8d8e8'], ['mentor-vanish', 'dirty-stab']),
  trial: { quote: 'Show me a face. No, not that one. The one you are afraid I would like.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles in three different Masks. A single face is a habit.' },
  mentorNpc: { name: 'Maestro Veyl Dorrance', race: 'elf', portrait: 0, color: '#a86aa8', greeting: '“Oh, do come in. Which of you is the real one? It does not matter. I will hire all of you.”' },
  kit: kitOf('rapier-t1', 'cloth-chest-t1', 'cloth-boots-t1'),
  art: emblem('ring', '#6a3a6a', '#d8a8d8'),
  questline: ['hesha', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['A Face in the Mirror', 'The Rival Troupe', 'The Warren Masque', 'The Mask That Would Not Come Off', 'The Final Face'], ['“Hesha loves a warm audience. Go to the shrine and try on your first face.”', '“A rival troupe has stolen your mask. Win it back on stage.”', '“Goblins hold a masque once a year. Attend, and be convincing.”', '“A mask will not come off. Persuade it.”', '“Every Facewright has a last face. Come, and I will show you yours.”'], '“Which one is yours?”', '“The one I am wearing.”', '“The one I would not wear.”', '“There was always only one.”', 'Keeper of the Final Face'],
  legendary: { id: 'the-thirteenth-mask', name: 'The Thirteenth Mask', rarity: 'legendary', baseId: 'rapier-t4', level: 25, requirements: { classes: ['facewright'] }, modifiers: [{ stat: 'dodge', type: 'flat', value: 6 }, { stat: 'damageBonus', type: 'flat', value: 8 }], triggers: [trg('thirteenth', 'onSkillCast', [gain('persona', 3)])], effectText: ['Each skill gives 3 Persona.'], lore: 'There are twelve masks. Nobody has ever been able to explain the other one.' },
};
