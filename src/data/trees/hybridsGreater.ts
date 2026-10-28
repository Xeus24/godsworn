import type { EffectSpec } from '../../engine/effects/types';
import type { SkillDef } from '../../engine/skills/types';
import type { Element, StatId } from '../../engine/stats/types';
import { flat, pct, type BranchSpec, type MinorSpec, type ModSpec, type PassiveSpec } from './builder';

type Atk = 'physicalAttack' | 'magicAttack' | 'divinePower';
type Mod = [name: string, stat: StatId, value: number, percent?: 'p'];
type Pass = [name: string, text: string, stat: StatId, value: number, percent?: 'p'];

/** The second skill: a party buff, a self shield, an area attack, a heal, a haste or a summon. */
type Second =
  | { name: string; kind: 'party'; flavor: string; damage: number; defense: number }
  | { name: string; kind: 'self'; flavor: string; shield: number; damage: number }
  | { name: string; kind: 'aoe'; flavor: string; mult: number; status: string }
  | { name: string; kind: 'heal'; flavor: string; heal: number }
  | { name: string; kind: 'haste'; flavor: string; status: 'haste' | 'stealth' }
  | { name: string; kind: 'summon'; flavor: string; summon: string };

interface HybridSpec {
  id: string;
  name: string;
  color: string;
  description: string;
  el: Element;
  atk: Atk;
  /** Strike: name, flavor, multiplier, status, duration, chance. */
  a: [name: string, flavor: string, mult: number, status: string, duration: number, chance: number];
  b: Second;
  /** Names of the four skill modifiers (A status, A power, B cooldown, B bonus) and A's added status. */
  mods: [string, string, string, string];
  modStatus: string;
  minors: [Mod, Mod, Mod, Mod];
  notables: [Pass, Pass];
  choice: [Pass, Pass];
  keystone: Pass;
  capstone: [name: string, ...mods: [StatId, number, 'p'?][]];
}

const D = 'damageBonus' as const;
const D_STAT = D;
const slug = (s: string): string => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);
const ATK_NAME: Record<Atk, string> = { physicalAttack: 'ATK', magicAttack: 'MAG', divinePower: 'Divine Power' };
const stat = (m: [StatId, number, 'p'?]) => (m[2] ? pct(m[0], m[1]) : flat(m[0], m[1]));
const minor = (m: Mod): MinorSpec => ({ name: m[0], mods: [m[3] ? pct(m[1], m[2]) : flat(m[1], m[2])] });
const passive = (p: Pass): PassiveSpec => ({ name: p[0], text: p[1], mods: [p[4] ? pct(p[2], p[3]) : flat(p[2], p[3])] });

const PENALTY: Record<string, [StatId, 'p'?]> = { 'max HP': ['maxHp', 'p'], 'max MP': ['maxMp', 'p'], defense: ['defense', 'p'], speed: ['speed', 'p'], damage: [D_STAT], 'healing power': ['healingPower'] };

/** A keystone's text names its price ("-15% max HP"); the price is applied as a real modifier. */
function keystoneOf(p: Pass): PassiveSpec {
  const base = passive(p);
  const m = /, -(\d+)% (max HP|max MP|defense|speed|damage|healing power)\.$/.exec(p[1]);
  if (!m) return base;
  const [stat, kind] = PENALTY[m[2]!]!;
  return { ...base, mods: [...(base.mods ?? []), kind ? pct(stat, -Number(m[1])) : flat(stat, -Number(m[1]))] };
}

const st = (status: string, duration: number, chance?: number): EffectSpec => ({ kind: 'applyStatus', status, duration, ...(chance ? { chance } : {}) });
const buff = (id: string, duration: number, modifiers: { stat: StatId; type: 'flat' | 'percent' | 'more'; value: number }[], target: 'self' | 'allAllies'): EffectSpec => ({ kind: 'buff', id, duration, modifiers, target });

function skillsOf(h: HybridSpec): SkillDef[] {
  const [aName, aFlavor, mult, status, dur, chance] = h.a;
  const element = cap(h.el);
  const strike: SkillDef = {
    id: slug(aName), name: aName, source: 'hybrid', maxRank: 5,
    description: `${aFlavor} for ${Math.round(mult * 100)}% ${ATK_NAME[h.atk]} ${h.el} damage; ${cap(status)} (${chance}%).`,
    tags: ['Attack', 'Melee', element as never], element: h.el, targeting: 'enemy', cost: { mp: 8 }, cooldown: 1,
    damage: { stat: h.atk, multiplier: mult, perRank: 0.1 },
    effects: [st(status, dur, chance)],
  };
  const b = h.b;
  const common = { id: slug(b.name), name: b.name, source: 'hybrid' as const, maxRank: 5, element: h.el };
  let second: SkillDef;
  switch (b.kind) {
    case 'party':
      second = { ...common, description: `${b.flavor} The party gains +${b.damage}% damage and +${b.defense}% defense for 3 turns.`, tags: ['Buff', 'AoE', element as never], targeting: 'allAllies', cost: { mp: 14 }, cooldown: 5, effects: [buff(`${common.id}-buff`, 3, [{ stat: 'damageBonus', type: 'flat', value: b.damage }, { stat: 'defense', type: 'percent', value: b.defense }], 'allAllies')] };
      break;
    case 'self':
      second = { ...common, description: `${b.flavor} Shield yourself for ${b.shield}% of max HP and gain +${b.damage}% damage for 2 turns.`, tags: ['Buff', 'Defensive', element as never], targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [{ kind: 'shield', percentMaxHp: b.shield }, buff(`${common.id}-buff`, 2, [{ stat: 'damageBonus', type: 'flat', value: b.damage }], 'self')] };
      break;
    case 'aoe':
      second = { ...common, description: `${b.flavor} ${Math.round(b.mult * 100)}% ${ATK_NAME[h.atk]} ${h.el} damage to every enemy; ${cap(b.status)} for 2 turns.`, tags: ['Attack', 'AoE', element as never], targeting: 'allEnemies', cost: { mp: 16 }, cooldown: 4, damage: { stat: h.atk, multiplier: b.mult, perRank: 0.07 }, effects: [st(b.status, 2)] };
      break;
    case 'heal':
      second = { ...common, description: `${b.flavor} Heal the party for ${b.heal}% of max HP and Regenerate for 3 turns.`, tags: ['Heal', 'AoE', element as never], targeting: 'allAllies', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'heal', percentMaxHp: b.heal, target: 'allAllies' }, st('regen', 3)] };
      break;
    case 'haste':
      second = { ...common, description: `${b.flavor} Gain ${cap(b.status)} for 2 turns and shield yourself for 8% of max HP.`, tags: ['Buff', element as never], targeting: 'self', cost: { mp: 10 }, cooldown: 4, effects: [st(b.status, 2), { kind: 'shield', percentMaxHp: 8 }] };
      break;
    case 'summon':
      second = { ...common, description: `${b.flavor} A summoned ally fights beside you.`, tags: ['Summon', element as never], targeting: 'self', cost: { mp: 14 }, cooldown: 5, effects: [{ kind: 'summon', summonId: b.summon }] };
      break;
  }
  return [strike, second];
}

function branchOf(h: HybridSpec): BranchSpec {
  const a = slug(h.a[0]);
  const b = slug(h.b.name);
  const aMods: [ModSpec, ModSpec] = [
    { name: h.mods[0], patch: { description: `${h.a[0]} also inflicts ${cap(h.modStatus)}.`, addEffects: [st(h.modStatus, 2)] } },
    { name: h.mods[1], patch: { description: '+25% damage, +30% MP cost.', powerMult: 1.25, costMult: 1.3 } },
  ];
  const bMods: [ModSpec, ModSpec] = [
    { name: h.mods[2], patch: { description: `${h.b.name} recovers a turn sooner.`, cooldownDelta: -1 } },
    { name: h.mods[3], patch: { description: `${h.b.name} also shields you for 10% of max HP.`, addEffects: [{ kind: 'shield', percentMaxHp: 10 }] } },
  ];
  return {
    id: h.id, name: h.name, color: h.color, description: h.description,
    a: { skill: a }, aMods, b: { skill: b }, bMods,
    minors: h.minors.map(minor) as [MinorSpec, MinorSpec, MinorSpec, MinorSpec],
    notables: h.notables.map(passive) as [PassiveSpec, PassiveSpec],
    choice: h.choice.map(passive) as [PassiveSpec, PassiveSpec],
    keystone: keystoneOf(h.keystone),
    capstone: { name: h.capstone[0], mods: (h.capstone.slice(1) as [StatId, number, 'p'?][]).map(stat) },
  };
}


export const GREATER_HYBRID_SPECS: HybridSpec[] = [
  { id: 'dread-knight', name: 'Dread Knight', color: '#5a4a7a', description: 'An oath sworn to the dead: iron, rot and loyalty.', el: 'shadow', atk: 'physicalAttack',
    a: ['Grave Lance', 'A lance of grave-iron', 1.6, 'fear', 2, 35], b: { name: 'Oath of the Dead', kind: 'summon', flavor: 'The fallen kneel to their knight.', summon: 'skeleton-warrior' },
    mods: ['Cold Iron', 'Heavy Lance', 'Short Vigil', 'Dead Man’s Plate'], modStatus: 'weaken',
    minors: [['Grave Mail', 'defense', 3, 'p'], ['Rotted Resolve', 'statusResist', 4], ['Dread Strength', 'physicalAttack', 3], ['Deathless Vigor', 'maxHp', 3, 'p']],
    notables: [['Terror Banner', '+12% shadow damage.', 'shadowDamage', 12], ['Hollow Valor', 'Take 6% less damage.', 'damageTaken', -6]],
    choice: [['Black Oath', '+15% damage.', D, 15], ['Pale Shield', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Knight of Ashes', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Lord of the Last Charge', [D, 10] as never, ['physicalAttack', 10, 'p']] as never },
  { id: 'herbal-witch', name: 'Herbal Witch', color: '#6aa84a', description: 'Every bloom has two uses; she knows both.', el: 'nature', atk: 'magicAttack',
    a: ['Venom Bloom', 'A blossom that bursts in a poison cloud', 1.5, 'poison', 3, 60], b: { name: 'Restorative Brew', kind: 'heal', flavor: 'A steaming cup passed down the line.', heal: 14 },
    mods: ['Nightshade', 'Overgrown', 'Quick Steep', 'Hedge Ward'], modStatus: 'weaken',
    minors: [['Pressed Petals', 'natureDamage', 3], ['Mortar and Pestle', 'healingPower', 3], ['Green Fingers', 'magicAttack', 3], ['Hedge Wisdom', 'mpRegen', 1]],
    notables: [['Poison and Cure', '+12% nature damage.', 'natureDamage', 12], ['Kitchen Garden', '+10% healing power.', 'healingPower', 10]],
    choice: [['Bitter Herbs', '+15% damage.', D, 15], ['Sweet Herbs', '+12% healing power.', 'healingPower', 12]],
    keystone: ['Dose Makes the Poison', 'Keystone: +25% damage, -20% healing power.', D, 25], capstone: ['Witch of the Hedgerow', ['natureDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'timeblade', name: 'Timeblade', color: '#7ad8c8', description: 'A knife that arrives a heartbeat before the wielder.', el: 'arcane', atk: 'physicalAttack',
    a: ['Hourglass Cut', 'A cut that lands before it is swung', 1.5, 'slow', 2, 50], b: { name: 'Borrowed Seconds', kind: 'haste', flavor: 'Steal a few seconds from the next minute.', status: 'haste' },
    mods: ['Sand in the Wound', 'Long Second', 'Skipped Beat', 'Stopped Clock'], modStatus: 'vulnerable',
    minors: [['Quick Hands', 'speed', 2], ['Sharp Hour', 'critChance', 1], ['Spare Minutes', 'cooldownReduction', 2], ['Dust of Ages', 'arcaneDamage', 3]],
    notables: [['Ahead of the Blade', '+10% speed.', 'speed', 10, 'p'], ['Second Strike', '+12% crit damage.', 'critDamage', 12]],
    choice: [['Late Hour', '+15% damage.', D, 15], ['Early Hour', '+10% dodge.', 'dodge', 10]],
    keystone: ['One Minute Ago', 'Keystone: +20% damage, -10% max HP.', D, 20], capstone: ['Master of Moments', [D, 10], ['speed', 10, 'p']] as never },
  { id: 'muse', name: 'Muse', color: '#e8689a', description: 'The room belongs to whoever it cannot look away from.', el: 'arcane', atk: 'magicAttack',
    a: ['Dazzling Refrain', 'A phrase that turns every head', 1.4, 'charm', 1, 30], b: { name: 'Inspiring Encore', kind: 'party', flavor: 'The crowd roars for more.', damage: 14, defense: 8 },
    mods: ['Standing Ovation', 'Fortissimo', 'Short Interval', 'Curtain Call'], modStatus: 'weaken',
    minors: [['Stage Voice', 'cha', 2], ['Applause', 'magicAttack', 3], ['Grace Notes', 'dodge', 2], ['Rehearsed', 'cooldownReduction', 2]],
    notables: [['Perfect Pitch', '+10% crit chance.', 'critChance', 10], ['Fan Club', '+12% arcane damage.', 'arcaneDamage', 12]],
    choice: [['Solo', '+15% damage.', D, 15], ['Ensemble', '+10% max HP.', 'maxHp', 10, 'p']],
    keystone: ['Center Stage', 'Keystone: +25% damage, -10% defense.', D, 25], capstone: ['The Muse', ['arcaneDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'glyphmaster', name: 'Glyphmaster', color: '#8a7aff', description: 'Spells written once, read forever.', el: 'arcane', atk: 'magicAttack',
    a: ['Glyph Burst', 'A glyph that detonates on being read', 1.6, 'vulnerable', 2, 40], b: { name: 'Warding Script', kind: 'self', flavor: 'Draw a circle and stand in it.', shield: 18, damage: 15 },
    mods: ['Brightlines', 'Bold Hand', 'Shorthand', 'Double Seal'], modStatus: 'silence',
    minors: [['Fine Nib', 'magicAttack', 3], ['Dry Ink', 'mpRegen', 1], ['Steady Hand', 'accuracy', 2], ['Margin Notes', 'maxMp', 3, 'p']],
    notables: [['Runic Syntax', '+12% arcane damage.', 'arcaneDamage', 12], ['Indelible', '+10% status chance.', 'statusChance', 10]],
    choice: [['Bold Strokes', '+15% damage.', D, 15], ['Fine Strokes', '+10% cooldown reduction.', 'cooldownReduction', 10]],
    keystone: ['Written in Stone', 'Keystone: +25% damage, -15% max MP.', D, 25], capstone: ['Master of Glyphs', ['arcaneDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'grand-inquisitor', name: 'Grand Inquisitor', color: '#f0e0a0', description: 'Faith as a verdict, and a hunter to carry it out.', el: 'holy', atk: 'divinePower',
    a: ['Verdict Flame', 'A sentence read in fire', 1.5, 'burn', 3, 50], b: { name: 'Hunt the Heretic', kind: 'aoe', flavor: 'Every sinner is named.', mult: 0.85, status: 'weaken' },
    mods: ['Penance', 'Zeal', 'Swift Judgment', 'Questioning'], modStatus: 'curse',
    minors: [['Litany', 'divinePower', 3], ['Iron Faith', 'statusResist', 4], ['Silver Seal', 'holyDamage', 3], ['Vigil', 'maxHp', 3, 'p']],
    notables: [['Unforgiving', '+12% holy damage.', 'holyDamage', 12], ['Witness', '+10% divine power.', 'divinePower', 10, 'p']],
    choice: [['Righteous Fire', '+15% damage.', D, 15], ['Righteous Calm', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Court of One', 'Keystone: +25% damage, -15% healing power.', D, 25], capstone: ['Grand Inquisitor', ['holyDamage', 12], ['divinePower', 10, 'p']] as never },
  { id: 'mountainbreaker', name: 'Mountainbreaker', color: '#9a7a4a', description: 'A fault line with a battle cry.', el: 'physical', atk: 'physicalAttack',
    a: ['Fault Line Cleave', 'A blow that splits the ground', 1.7, 'stun', 1, 25], b: { name: 'Bedrock Stance', kind: 'self', flavor: 'Plant both feet and become the hill.', shield: 22, damage: 15 },
    mods: ['Landslide', 'Quake Weight', 'Settled Stance', 'Stone Skin'], modStatus: 'slow',
    minors: [['Rockbreaker', 'physicalAttack', 3], ['Mountain Body', 'maxHp', 3, 'p'], ['Grit', 'defense', 3, 'p'], ['Strong Back', 'str', 2]],
    notables: [['Tremor', '+12% physical damage.', 'physicalDamage', 12], ['Immovable', 'Take 6% less damage.', 'damageTaken', -6]],
    choice: [['Avalanche', '+15% damage.', D, 15], ['Granite Will', '+15% status resist.', 'statusResist', 15]],
    keystone: ['Heart of the Mountain', 'Keystone: +20% max HP, -10% speed.', 'maxHp', 20, 'p'], capstone: ['Mountainbreaker', ['physicalDamage', 12], ['physicalAttack', 10, 'p']] as never },
  { id: 'golem-master', name: 'Golem Master', color: '#8a8a9a', description: 'Why fight when you can build someone to?', el: 'physical', atk: 'magicAttack',
    a: ['Piston Barrage', 'A volley from a hissing arm', 1.5, 'stun', 1, 20], b: { name: 'Animate Construct', kind: 'summon', flavor: 'Bolts, plates and a spark.', summon: 'stone-golem' },
    mods: ['Pressure Burst', 'Overclocked', 'Spare Parts', 'Riveted Plates'], modStatus: 'slow',
    minors: [['Workshop Air', 'magicAttack', 3], ['Tool Belt', 'cooldownReduction', 2], ['Heavy Plating', 'defense', 3, 'p'], ['Oil Can', 'mpRegen', 1]],
    notables: [['Reinforced Frame', '+12% max HP.', 'maxHp', 12, 'p'], ['Master Builder', '+12% damage.', D, 12]],
    choice: [['Heavy Chassis', '+15% max HP.', 'maxHp', 15, 'p'], ['Light Chassis', '+10% speed.', 'speed', 10, 'p']],
    keystone: ['Ghost in the Gears', 'Keystone: +25% damage, -15% defense.', D, 25], capstone: ['Golem Master', [D, 10], ['magicAttack', 10, 'p']] as never },
  { id: 'crusader', name: 'Crusader', color: '#e8d070', description: 'A knight with a cause and the faith to keep it.', el: 'holy', atk: 'divinePower',
    a: ['Radiant Charge', 'A blazing lancer’s charge', 1.6, 'blind', 2, 35], b: { name: 'Bulwark of Faith', kind: 'party', flavor: 'A wall of light behind your shield.', damage: 10, defense: 14 },
    mods: ['Sunburst', 'Holy Momentum', 'Rallying Cry', 'Shield of Dawn'], modStatus: 'weaken',
    minors: [['Blessed Steel', 'physicalAttack', 3], ['Tabard', 'defense', 3, 'p'], ['Devotion', 'divinePower', 3], ['Plain Faith', 'maxHp', 3, 'p']],
    notables: [['Holy War', '+12% holy damage.', 'holyDamage', 12], ['Banner of Light', 'Allies take 4% less damage.', 'damageTaken', -4]],
    choice: [['Crusade', '+15% damage.', D, 15], ['Pilgrimage', '+12% max HP.', 'maxHp', 12, 'p']],
    keystone: ['Deus Vult', 'Keystone: +25% damage, -10% defense.', D, 25], capstone: ['Lord Crusader', ['holyDamage', 12], ['divinePower', 10, 'p']] as never },
  { id: 'rune-knight', name: 'Rune Knight', color: '#5a8ac8', description: 'Armor etched with sentences that bite back.', el: 'arcane', atk: 'physicalAttack',
    a: ['Runic Strike', 'A blow that leaves a glowing word', 1.5, 'weaken', 2, 45], b: { name: 'Runeplate', kind: 'self', flavor: 'Every plate flares with a ward.', shield: 20, damage: 18 },
    mods: ['Branded', 'Etched Deep', 'Quick Etching', 'Warding Sigil'], modStatus: 'vulnerable',
    minors: [['Runed Gauntlet', 'physicalAttack', 3], ['Etched Plate', 'defense', 3, 'p'], ['Spare Charge', 'maxMp', 3, 'p'], ['Cold Steel', 'arcaneDamage', 3]],
    notables: [['Living Armor', 'Take 6% less damage.', 'damageTaken', -6], ['Rune of Power', '+12% arcane damage.', 'arcaneDamage', 12]],
    choice: [['Heavy Runes', '+15% damage.', D, 15], ['Fine Runes', '+10% cooldown reduction.', 'cooldownReduction', 10]],
    keystone: ['Armor of Sentences', 'Keystone: +20% defense, -15% damage.', 'defense', 20, 'p'], capstone: ['Rune Knight', ['arcaneDamage', 12], ['physicalAttack', 10, 'p']] as never },
  { id: 'thornstalker', name: 'Thornstalker', color: '#4a7a3a', description: 'The forest’s patience, with an edge.', el: 'nature', atk: 'physicalAttack',
    a: ['Thornshot', 'A barbed shot from the undergrowth', 1.5, 'bleed', 3, 55], b: { name: 'Hide in the Hedge', kind: 'haste', flavor: 'Fold into the brambles.', status: 'stealth' },
    mods: ['Barbed', 'Heavy Draw', 'Soft Step', 'Bramble Cloak'], modStatus: 'slow',
    minors: [['Keen Eye', 'accuracy', 2], ['Bramble Hide', 'defense', 3, 'p'], ['Quiet Feet', 'dodge', 2], ['Wild Heart', 'maxHp', 3, 'p']],
    notables: [['Snare Craft', '+12% nature damage.', 'natureDamage', 12], ['Ambusher', '+10% crit chance.', 'critChance', 10]],
    choice: [['Predator', '+15% damage.', D, 15], ['Prey', '+10% dodge.', 'dodge', 10]],
    keystone: ['Rooted Hunter', 'Keystone: +25% damage, -10% speed.', D, 25], capstone: ['Thornstalker', ['natureDamage', 12], ['physicalAttack', 10, 'p']] as never },
  { id: 'greenseer', name: 'Greenseer', color: '#7ad88a', description: 'Reads the spirits in the roots and answers them.', el: 'nature', atk: 'magicAttack',
    a: ['Spirit Bloom', 'A bloom that remembers old wars', 1.4, 'slow', 2, 45], b: { name: 'Seer’s Blessing', kind: 'heal', flavor: 'The roots sing, and wounds close.', heal: 16 },
    mods: ['Old Thorns', 'Wild Growth', 'Quick Vision', 'Barkskin'], modStatus: 'weaken',
    minors: [['Root Sight', 'magicAttack', 3], ['Leaf Whisper', 'mpRegen', 1], ['Moss Bed', 'healingPower', 3], ['Seed Pouch', 'maxMp', 3, 'p']],
    notables: [['Ancestral Green', '+12% nature damage.', 'natureDamage', 12], ['Deep Roots', '+10% healing power.', 'healingPower', 10]],
    choice: [['Wild Vision', '+15% damage.', D, 15], ['Calm Vision', '+12% healing power.', 'healingPower', 12]],
    keystone: ['One With the Grove', 'Keystone: +20% healing power, -15% damage.', 'healingPower', 20], capstone: ['Greenseer', ['natureDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'dark-magus', name: 'Dark Magus', color: '#6a3a8a', description: 'A scholar who read the forbidden footnote.', el: 'shadow', atk: 'magicAttack',
    a: ['Hexbolt', 'A bolt wrapped in a bargain', 1.7, 'curse', 3, 40], b: { name: 'Pact Shield', kind: 'self', flavor: 'The patron’s hand closes round you.', shield: 20, damage: 18 },
    mods: ['Bad Omen', 'Greater Bargain', 'Short Contract', 'Hollow Ward'], modStatus: 'weaken',
    minors: [['Forbidden Index', 'magicAttack', 3], ['Pact Ink', 'shadowDamage', 3], ['Cold Study', 'maxMp', 3, 'p'], ['Wary Mind', 'statusResist', 4]],
    notables: [['Patron’s Gift', '+12% shadow damage.', 'shadowDamage', 12], ['Footnote', '+10% crit chance.', 'critChance', 10]],
    choice: [['Greater Pact', '+15% damage.', D, 15], ['Lesser Pact', '+10% max HP.', 'maxHp', 10, 'p']],
    keystone: ['Debt Called', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Dark Magus', ['shadowDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'hexblade', name: 'Hexblade', color: '#8a3a6a', description: 'A curse you can feel in the edge.', el: 'shadow', atk: 'physicalAttack',
    a: ['Cursed Stab', 'A stab that carries a grudge', 1.6, 'curse', 3, 45], b: { name: 'Shadow Pact', kind: 'haste', flavor: 'The dark lends you a step.', status: 'haste' },
    mods: ['Festering Edge', 'Bitter Edge', 'Quick Bargain', 'Dark Mantle'], modStatus: 'bleed',
    minors: [['Wicked Edge', 'physicalAttack', 3], ['Dark Reflex', 'dodge', 2], ['Pact Mark', 'shadowDamage', 3], ['Cold Blood', 'critChance', 1]],
    notables: [['Grudge', '+12% shadow damage.', 'shadowDamage', 12], ['Edge of Night', '+12% crit damage.', 'critDamage', 12]],
    choice: [['Hexed Steel', '+15% damage.', D, 15], ['Hexed Skin', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['All or Nothing', 'Keystone: +25% damage, -15% defense.', D, 25], capstone: ['Hexblade', ['shadowDamage', 12], ['physicalAttack', 10, 'p']] as never },
  { id: 'soulbinder', name: 'Soulbinder', color: '#6a7ac8', description: 'Souls are cheap, and a little lonely.', el: 'shadow', atk: 'magicAttack',
    a: ['Soul Lash', 'A lash of bound spirit', 1.5, 'weaken', 2, 50], b: { name: 'Bind Soul', kind: 'summon', flavor: 'A spirit takes a body of bone.', summon: 'bone-golem' },
    mods: ['Frayed', 'Tight Knot', 'Quick Binding', 'Soul Ward'], modStatus: 'curse',
    minors: [['Lantern Soul', 'magicAttack', 3], ['Binding Thread', 'shadowDamage', 3], ['Spare Spirit', 'maxMp', 3, 'p'], ['Cold Comfort', 'statusResist', 4]],
    notables: [['Chorus of the Bound', '+12% damage.', D, 12], ['Soul Harvest', 'Heal 4% max HP on kills.', 'lifesteal', 4]],
    choice: [['Strong Binding', '+15% max HP.', 'maxHp', 15, 'p'], ['Light Binding', '+10% cooldown reduction.', 'cooldownReduction', 10]],
    keystone: ['Never Alone', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Soulbinder', ['shadowDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'spirit-lord', name: 'Spirit Lord', color: '#5ad8b8', description: 'A shaman’s ancestors and a summoner’s company.', el: 'nature', atk: 'magicAttack',
    a: ['Ancestral Strike', 'A blow from a hundred hands', 1.5, 'slow', 2, 45], b: { name: 'Call the Ancestors', kind: 'summon', flavor: 'The stag of the old kings answers.', summon: 'spirit-stag' },
    mods: ['Ancient Grudge', 'Many Hands', 'Short Rite', 'Elder Ward'], modStatus: 'weaken',
    minors: [['Ancestral Voice', 'magicAttack', 3], ['Totem Craft', 'maxHp', 3, 'p'], ['Spirit Sight', 'accuracy', 2], ['Offering', 'mpRegen', 1]],
    notables: [['Lineage', '+12% nature damage.', 'natureDamage', 12], ['Kinship', '+10% max HP.', 'maxHp', 10, 'p']],
    choice: [['Fierce Spirits', '+15% damage.', D, 15], ['Kind Spirits', '+12% healing power.', 'healingPower', 12]],
    keystone: ['Clan of the Dead', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Spirit Lord', ['natureDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'venomancer', name: 'Venomancer', color: '#8ad84a', description: 'Every blade was a vial first.', el: 'nature', atk: 'physicalAttack',
    a: ['Viper Fang', 'A cut with a drop on the edge', 1.5, 'poison', 3, 60], b: { name: 'Smoke and Vials', kind: 'haste', flavor: 'A pop, a puff, and you are not there.', status: 'stealth' },
    mods: ['Double Dose', 'Concentrate', 'Fast Vial', 'Antidote'], modStatus: 'weaken',
    minors: [['Fine Poison', 'natureDamage', 3], ['Quick Fingers', 'speed', 2], ['Bitter Tongue', 'statusChance', 3], ['Thick Gloves', 'defense', 3, 'p']],
    notables: [['Tolerance', '+15% status resist.', 'statusResist', 15], ['Lethal Dose', '+12% damage.', D, 12]],
    choice: [['Slow Venom', '+15% status chance.', 'statusChance', 15], ['Fast Venom', '+15% damage.', D, 15]],
    keystone: ['Walking Toxin', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Venomancer', ['natureDamage', 12], ['physicalAttack', 10, 'p']] as never },
  { id: 'transmuter', name: 'Transmuter', color: '#d8a83a', description: 'Lead into gold, ice into fire, doubt into certainty.', el: 'fire', atk: 'magicAttack',
    a: ['Transmuted Flame', 'A fire that was a frost a moment ago', 1.6, 'burn', 3, 55], b: { name: 'Philosopher’s Gift', kind: 'party', flavor: 'A pinch of the great work, shared.', damage: 14, defense: 8 },
    mods: ['Gold Fever', 'Grand Work', 'Quick Reaction', 'Inert Shell'], modStatus: 'vulnerable',
    minors: [['Crucible', 'fireDamage', 3], ['Careful Measure', 'magicAttack', 3], ['Stirring', 'mpRegen', 1], ['Glass Hands', 'cooldownReduction', 2]],
    notables: [['Catalyst', '+12% fire damage.', 'fireDamage', 12], ['Lead to Gold', '+10% gold find.', 'goldFind', 10]],
    choice: [['Volatile', '+15% damage.', D, 15], ['Stable', '+12% max HP.', 'maxHp', 12, 'p']],
    keystone: ['Great Work', 'Keystone: +25% damage, -15% defense.', D, 25], capstone: ['Transmuter', ['fireDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'ghostfist', name: 'Ghostfist', color: '#a8d8e8', description: 'A spirit walks the palm; the foe feels the weight.', el: 'physical', atk: 'physicalAttack',
    a: ['Ghost Palm', 'A palm that arrives from the other side', 1.5, 'weaken', 2, 45], b: { name: 'Ancestral Calm', kind: 'self', flavor: 'The ancestors hold your shoulders.', shield: 18, damage: 12 },
    mods: ['Chill Touch', 'Weighted Palm', 'Quick Breath', 'Veil of Elders'], modStatus: 'slow',
    minors: [['Still Mind', 'statusResist', 4], ['Spirit Step', 'dodge', 2], ['Iron Palm', 'physicalAttack', 3], ['Lantern Breath', 'maxHp', 3, 'p']],
    notables: [['Between Worlds', '+10% dodge.', 'dodge', 10], ['Palm of the Dead', '+12% damage.', D, 12]],
    choice: [['Open Hand', '+15% damage.', D, 15], ['Closed Hand', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Half a Ghost', 'Keystone: +15% dodge, -15% max HP.', 'dodge', 15], capstone: ['Ghostfist', [D, 10], ['physicalAttack', 10, 'p']] as never },
  { id: 'metronome', name: 'Metronome', color: '#b8d0f0', description: 'Everything is a beat; she moves it.', el: 'arcane', atk: 'magicAttack',
    a: ['Syncopated Strike', 'A hit on the off-beat', 1.4, 'slow', 2, 50], b: { name: 'Perfect Tempo', kind: 'party', flavor: 'The whole party falls in step.', damage: 12, defense: 6 },
    mods: ['Off the Beat', 'Crescendo', 'Rest Bar', 'Steady Count'], modStatus: 'vulnerable',
    minors: [['Counting', 'cooldownReduction', 2], ['Click Track', 'speed', 2], ['Pendulum', 'magicAttack', 3], ['Held Note', 'maxMp', 3, 'p']],
    notables: [['In Time', '+10% cooldown reduction.', 'cooldownReduction', 10], ['Downbeat', '+12% damage.', D, 12]],
    choice: [['Allegro', '+10% speed.', 'speed', 10, 'p'], ['Adagio', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Never Late', 'Keystone: +20% speed, -15% damage.', 'speed', 20, 'p'], capstone: ['Metronome', ['arcaneDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'gadgeteer', name: 'Gadgeteer', color: '#d8b84a', description: 'A coat of pockets and a pocket for every problem.', el: 'physical', atk: 'physicalAttack',
    a: ['Trick Shot', 'A spring-loaded surprise', 1.5, 'blind', 2, 40], b: { name: 'Tangle Wire', kind: 'aoe', flavor: 'Trip wire across the room.', mult: 0.8, status: 'slow' },
    mods: ['Flash Powder', 'Overwound', 'Quick Draw', 'Padded Lining'], modStatus: 'slow',
    minors: [['Spare Springs', 'physicalAttack', 3], ['Deft Hands', 'dex', 2], ['Pocket Space', 'cooldownReduction', 2], ['Tinker’s Eye', 'accuracy', 2]],
    notables: [['Contraption', '+12% damage.', D, 12], ['Hidden Pockets', '+10% gold find.', 'goldFind', 10]],
    choice: [['Overclock', '+15% damage.', D, 15], ['Safety Catch', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Beta Test', 'Keystone: +25% damage, -15% defense.', D, 25], capstone: ['Gadgeteer', [D, 10], ['physicalAttack', 10, 'p']] as never },
  { id: 'ironclad', name: 'Ironclad', color: '#7a7a8a', description: 'A walking siege engine with a pressure gauge.', el: 'physical', atk: 'physicalAttack',
    a: ['Piston Slam', 'A steam-driven hammer blow', 1.7, 'stun', 1, 25], b: { name: 'Steam Armor', kind: 'self', flavor: 'Vent the boiler and brace.', shield: 22, damage: 15 },
    mods: ['Boiler Burst', 'Full Pressure', 'Quick Vent', 'Riveted Skin'], modStatus: 'weaken',
    minors: [['Iron Plate', 'defense', 3, 'p'], ['Piston Arms', 'physicalAttack', 3], ['Coal Furnace', 'maxHp', 3, 'p'], ['Soot', 'statusResist', 4]],
    notables: [['Heavy Frame', 'Take 6% less damage.', 'damageTaken', -6], ['Siege Mode', '+12% damage.', D, 12]],
    choice: [['Overpressure', '+15% damage.', D, 15], ['Pressure Valve', '+12% max HP.', 'maxHp', 12, 'p']],
    keystone: ['Walking Fortress', 'Keystone: +25% defense, -10% speed.', 'defense', 25, 'p'], capstone: ['Ironclad', [D, 10], ['physicalAttack', 10, 'p']] as never },
  { id: 'windstep-master', name: 'Windstep Master', color: '#9ad8d8', description: 'Footwork that is also a fist.', el: 'physical', atk: 'physicalAttack',
    a: ['Gale Kick', 'A kick on a passing wind', 1.5, 'slow', 2, 50], b: { name: 'Flowing Guard', kind: 'self', flavor: 'Bend like reeds.', shield: 14, damage: 16 },
    mods: ['Cutting Wind', 'Spinning Heel', 'Quick Step', 'Reed Stance'], modStatus: 'weaken',
    minors: [['Light Feet', 'speed', 2], ['Open Palm', 'physicalAttack', 3], ['Sway', 'dodge', 2], ['Breath Control', 'maxHp', 3, 'p']],
    notables: [['Flowing Form', '+10% dodge.', 'dodge', 10], ['Four Winds', '+12% damage.', D, 12]],
    choice: [['Cyclone', '+15% damage.', D, 15], ['Stillness', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Never Where You Hit', 'Keystone: +15% dodge, -10% max HP.', 'dodge', 15], capstone: ['Windstep Master', [D, 10], ['physicalAttack', 10, 'p']] as never },
  { id: 'silkblade', name: 'Silkblade', color: '#c85a8a', description: 'A ribbon that is also a razor.', el: 'shadow', atk: 'physicalAttack',
    a: ['Silken Cut', 'A ribbon drawn through the guard', 1.5, 'bleed', 3, 55], b: { name: 'Veil of Silk', kind: 'haste', flavor: 'The ribbons close round you.', status: 'stealth' },
    mods: ['Razor Thread', 'Long Pull', 'Quick Twirl', 'Second Veil'], modStatus: 'slow',
    minors: [['Fine Silk', 'dex', 2], ['Sharp Thread', 'physicalAttack', 3], ['Sway', 'dodge', 2], ['Hidden Hem', 'critChance', 1]],
    notables: [['Dance of Edges', '+12% crit damage.', 'critDamage', 12], ['Slip Away', '+10% dodge.', 'dodge', 10]],
    choice: [['Cut Deep', '+15% damage.', D, 15], ['Cut Clean', '+8% crit chance.', 'critChance', 8]],
    keystone: ['Thread Through Needle', 'Keystone: +25% crit damage, -10% max HP.', 'critDamage', 25], capstone: ['Silkblade', [D, 10], ['physicalAttack', 10, 'p']] as never },
  { id: 'lorekeeper', name: 'Lorekeeper', color: '#c8a85a', description: 'The saga that fights back.', el: 'arcane', atk: 'magicAttack',
    a: ['Inked Verse', 'A verse that bites the page and the foe', 1.4, 'silence', 2, 40], b: { name: 'Saga of Heroes', kind: 'party', flavor: 'A story the party can hear itself in.', damage: 14, defense: 8 },
    mods: ['Footnote', 'Epic Meter', 'Short Stanza', 'Binding'], modStatus: 'weaken',
    minors: [['Fountain Pen', 'magicAttack', 3], ['Rhymes', 'cha', 2], ['Archive', 'maxMp', 3, 'p'], ['Index', 'cooldownReduction', 2]],
    notables: [['Oral Tradition', '+12% arcane damage.', 'arcaneDamage', 12], ['Marginalia', '+10% status chance.', 'statusChance', 10]],
    choice: [['Epic', '+15% damage.', D, 15], ['Lyric', '+10% cooldown reduction.', 'cooldownReduction', 10]],
    keystone: ['The Last Page', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Lorekeeper', ['arcaneDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'bounty-hunter', name: 'Bounty Hunter', color: '#a8883a', description: 'A name on a poster and silver in the quiver.', el: 'physical', atk: 'physicalAttack',
    a: ['Marked Shot', 'A shot at a name on the list', 1.6, 'vulnerable', 2, 45], b: { name: 'Posted Warrant', kind: 'aoe', flavor: 'Every face on the board, at once.', mult: 0.85, status: 'weaken' },
    mods: ['Dead or Alive', 'Heavy Bolt', 'Quick Reload', 'Iron Collar'], modStatus: 'bleed',
    minors: [['Long Barrel', 'physicalAttack', 3], ['Trail Sense', 'accuracy', 2], ['Rope and Cuffs', 'statusChance', 3], ['Thick Coat', 'defense', 3, 'p']],
    notables: [['Reward Money', '+10% gold find.', 'goldFind', 10], ['Dead Eye', '+10% crit chance.', 'critChance', 10]],
    choice: [['Patient', '+15% damage.', D, 15], ['Quick', '+10% speed.', 'speed', 10, 'p']],
    keystone: ['Always Gets Their Man', 'Keystone: +25% damage, -10% defense.', D, 25], capstone: ['Bounty Hunter', [D, 10], ['physicalAttack', 10, 'p']] as never },
  // God-hybrids: a specialization plus Apostleship, like the Sun Knight.
  { id: 'glorybound', name: 'Glorybound', color: '#d84a2a', description: 'A Warlord sworn as Kael’s Apostle: a name that wins wars before the battle.', el: 'physical', atk: 'physicalAttack',
    a: ['Glory’s Edge', 'A stroke made for the songs', 1.7, 'weaken', 2, 50], b: { name: 'Kael’s Roll Call', kind: 'party', flavor: 'Every name is read aloud.', damage: 16, defense: 8 },
    mods: ['Famous Blow', 'Epic Cleave', 'Short Muster', 'Laurel Plate'], modStatus: 'vulnerable',
    minors: [['War Story', 'physicalAttack', 3], ['Battle Scar', 'maxHp', 3, 'p'], ['Trophy', 'defense', 3, 'p'], ['Loud Voice', 'cha', 2]],
    notables: [['Songs Will Be Sung', '+12% damage.', D, 12], ['Fearless', '+15% status resist.', 'statusResist', 15]],
    choice: [['To the Last', '+15% damage.', D, 15], ['Hold the Line', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Immortal Name', 'Keystone: +25% damage, -10% defense.', D, 25], capstone: ['Glorybound', [D, 10], ['physicalAttack', 10, 'p']] as never },
  { id: 'endbringer', name: 'Endbringer', color: '#4a3a5a', description: 'A Lich sworn as Morrath’s Apostle: the last word of every sentence.', el: 'shadow', atk: 'magicAttack',
    a: ['Final Word', 'A syllable that ends things', 1.7, 'curse', 3, 45], b: { name: 'Reaper’s Reckoning', kind: 'aoe', flavor: 'Every ledger settled.', mult: 0.9, status: 'weaken' },
    mods: ['Last Breath', 'Heavy Silence', 'Short Eulogy', 'Shroud'], modStatus: 'vulnerable',
    minors: [['Grave Index', 'magicAttack', 3], ['Pale Light', 'shadowDamage', 3], ['Cold Lungs', 'maxMp', 3, 'p'], ['Quiet Grief', 'statusResist', 4]],
    notables: [['Inevitable', '+12% shadow damage.', 'shadowDamage', 12], ['Last Rites', '+12% damage.', D, 12]],
    choice: [['Dust to Dust', '+15% damage.', D, 15], ['Rest in Peace', '+12% defense.', 'defense', 12, 'p']],
    keystone: ['Nothing Follows', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Endbringer', ['shadowDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'verdant-hunter', name: 'Verdant Hunter', color: '#5aa84a', description: 'A Beastmaster sworn as Ysolde’s Apostle: the forest’s chosen quarry hunter.', el: 'nature', atk: 'physicalAttack',
    a: ['Hunt’s Arrow', 'An arrow the forest guides', 1.6, 'bleed', 3, 55], b: { name: 'Call of the Hunt', kind: 'summon', flavor: 'The pack comes at a whistle.', summon: 'wolf-companion' },
    mods: ['Wild Barb', 'Full Draw', 'Fast Whistle', 'Leaf Mantle'], modStatus: 'slow',
    minors: [['Pack Sense', 'accuracy', 2], ['Wild Hide', 'defense', 3, 'p'], ['Deep Woods', 'natureDamage', 3], ['Swift Feet', 'speed', 2]],
    notables: [['Ysolde’s Gaze', '+12% nature damage.', 'natureDamage', 12], ['Pack Leader', '+12% damage.', D, 12]],
    choice: [['Apex', '+15% damage.', D, 15], ['Warden', '+12% max HP.', 'maxHp', 12, 'p']],
    keystone: ['Lone Wolf', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Verdant Hunter', ['natureDamage', 12], ['physicalAttack', 10, 'p']] as never },
  { id: 'loremaster', name: 'Loremaster', color: '#6a8ae8', description: 'A Stormcaller sworn as Aurelis’ Apostle: knowledge that crackles.', el: 'lightning', atk: 'magicAttack',
    a: ['Index of Ruin', 'A page torn out and thrown', 1.7, 'vulnerable', 2, 45], b: { name: 'Archive of Spells', kind: 'party', flavor: 'A shelf of answers, shared.', damage: 14, defense: 6 },
    mods: ['Cross-Reference', 'Thick Volume', 'Quick Lookup', 'Reading Room'], modStatus: 'silence',
    minors: [['Library Card', 'magicAttack', 3], ['Static Quill', 'lightningDamage', 3], ['Deep Stacks', 'maxMp', 3, 'p'], ['Quiet Study', 'cooldownReduction', 2]],
    notables: [['Footnoted', '+12% lightning damage.', 'lightningDamage', 12], ['Photographic', '+10% crit chance.', 'critChance', 10]],
    choice: [['Primary Source', '+15% damage.', D, 15], ['Secondary Source', '+10% cooldown reduction.', 'cooldownReduction', 10]],
    keystone: ['Forbidden Section', 'Keystone: +25% damage, -15% max HP.', D, 25], capstone: ['Loremaster', ['lightningDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'fortunes-fool', name: 'Fortune’s Fool', color: '#d8683a', description: 'A Trickster sworn as Vex’s Apostle: a lucky joke at the right moment.', el: 'arcane', atk: 'magicAttack',
    a: ['Loaded Lyric', 'A verse with a weighted die in it', 1.5, 'charm', 1, 35], b: { name: 'Lucky Break', kind: 'party', flavor: 'The dice fall your way.', damage: 14, defense: 8 },
    mods: ['Double or Nothing', 'High Roller', 'Quick Shuffle', 'Rigged Table'], modStatus: 'weaken',
    minors: [['Lucky Coin', 'luk', 2], ['Quick Wit', 'magicAttack', 3], ['Sleight', 'dodge', 2], ['Sly Smile', 'critChance', 1]],
    notables: [['Vex’s Wink', '+12% crit damage.', 'critDamage', 12], ['Fool’s Luck', '+10% dodge.', 'dodge', 10]],
    choice: [['All In', '+15% damage.', D, 15], ['Fold', '+12% max HP.', 'maxHp', 12, 'p']],
    keystone: ['Snake Eyes', 'Keystone: +20% crit chance, -15% max HP.', 'critChance', 20], capstone: ['Fortune’s Fool', ['arcaneDamage', 12], ['magicAttack', 10, 'p']] as never },
  { id: 'tempest-prophet', name: 'Tempest Prophet', color: '#3a8ac8', description: 'A Stormshaman sworn as Nymira’s Apostle: the sea speaks through lightning.', el: 'lightning', atk: 'magicAttack',
    a: ['Tidecall Bolt', 'A bolt that smells of salt', 1.6, 'slow', 2, 45], b: { name: 'Storm’s Favor', kind: 'party', flavor: 'The waves lift everyone.', damage: 14, defense: 8 },
    mods: ['Brine', 'Thunderhead', 'Quick Swell', 'Squall Ward'], modStatus: 'weaken',
    minors: [['Salt Wind', 'magicAttack', 3], ['Wet Slate', 'lightningDamage', 3], ['Deep Currents', 'maxMp', 3, 'p'], ['Weathered', 'statusResist', 4]],
    notables: [['Nymira’s Voice', '+12% lightning damage.', 'lightningDamage', 12], ['Rogue Wave', '+12% damage.', D, 12]],
    choice: [['Tempest', '+15% damage.', D, 15], ['Calm Seas', '+12% healing power.', 'healingPower', 12]],
    keystone: ['Eye of the Storm', 'Keystone: +25% damage, -15% defense.', D, 25], capstone: ['Tempest Prophet', ['lightningDamage', 12], ['magicAttack', 10, 'p']] as never },
];

export const GREATER_HYBRID_SKILLS: SkillDef[] = GREATER_HYBRID_SPECS.flatMap(skillsOf);
export const GREATER_HYBRID_BRANCHES: Record<string, BranchSpec> = Object.fromEntries(GREATER_HYBRID_SPECS.map((h) => [h.id, branchOf(h)]));
