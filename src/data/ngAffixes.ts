import type { ModifierSpec } from '../engine/stats/modifiers';
import { flat, more, pct } from './trees/builder';

/**
 * World affixes: each New Game+ tier adds two, chosen when the tier begins, and they stay for the rest of that
 * playthrough (so NG+3 carries six). Each twists every ordinary fight: the enemies, you, or both.
 */
export interface WorldAffixDef {
  id: string;
  name: string;
  description: string;
  enemy?: ModifierSpec[];
  party?: ModifierSpec[];
}

const a = (id: string, name: string, description: string, enemy?: ModifierSpec[], party?: ModifierSpec[]): WorldAffixDef => ({ id, name, description, ...(enemy ? { enemy } : {}), ...(party ? { party } : {}) });

export const WORLD_AFFIXES: WorldAffixDef[] = [
  // Elements: the enemies hit with it, and shrug it off
  a('scorched', 'Scorched Earth', 'Enemies deal 25% more Fire damage.', [flat('fireDamage', 25)]),
  a('frostbitten', 'Bitter Winter', 'Enemies deal 25% more Ice damage.', [flat('iceDamage', 25)]),
  a('stormcalled', 'Stormcalled', 'Enemies deal 25% more Lightning damage.', [flat('lightningDamage', 25)]),
  a('bloomrot', 'Bloomrot', 'Enemies deal 25% more Nature damage.', [flat('natureDamage', 25)]),
  a('hallowed-ground', 'Unhallowed Ground', 'Enemies deal 25% more Holy damage.', [flat('holyDamage', 25)]),
  a('long-shadows', 'Long Shadows', 'Enemies deal 25% more Shadow damage.', [flat('shadowDamage', 25)]),
  a('arcane-tide', 'Arcane Tide', 'Enemies deal 25% more Arcane damage.', [flat('arcaneDamage', 25)]),
  a('void-seep', 'Void Seep', 'Enemies deal 25% more Void damage.', [flat('voidDamage', 25)]),
  a('quaking', 'Quaking', 'Enemies deal 25% more Earth damage.', [flat('earthDamage', 25)]),
  a('iron-rain', 'Iron Rain', 'Enemies deal 15% more physical damage.', [pct('physicalAttack', 15)]),
  a('fireproofed', 'Fireproofed', 'Enemies resist Fire by 30.', [flat('fireResist', 30)]),
  a('thawless', 'Thawless', 'Enemies resist Ice by 30.', [flat('iceResist', 30)]),
  a('grounded', 'Grounded', 'Enemies resist Lightning by 30.', [flat('lightningResist', 30)]),
  a('warded-sky', 'Warded Sky', 'Enemies resist Holy and Shadow by 20.', [flat('holyResist', 20), flat('shadowResist', 20)]),
  a('hollow-armor', 'Hollow Armor', 'Enemies have 20% more defense.', [pct('defense', 20)]),
  // Enemy stats
  a('fat-of-the-land', 'Fat of the Land', 'Enemies have 20% more health.', [pct('maxHp', 20)]),
  a('quickened', 'Quickened', 'Enemies are 10% faster.', [pct('speed', 10)]),
  a('keen-eyed', 'Keen-Eyed', 'Enemies have +8% critical chance.', [flat('critChance', 8)]),
  a('mean-streak', 'Mean Streak', 'Enemies deal 30% more critical damage.', [flat('critDamage', 30)]),
  a('slippery', 'Slippery', 'Enemies have +8 dodge.', [flat('dodge', 8)]),
  a('stubborn', 'Stubborn', 'Enemies resist statuses: +20 Status Resist.', [flat('statusResist', 20)]),
  a('venom-in-the-air', 'Venom in the Air', 'Enemies have +20 Status Chance.', [flat('statusChance', 20)]),
  a('feeding-frenzy', 'Feeding Frenzy', 'Enemies heal for 5% of the damage they deal.', [flat('lifesteal', 5)]),
  a('regrowth', 'Regrowth', 'Enemies regenerate health every turn.', [flat('hpRegen', 3)]),
  a('piercing-light', 'Piercing', 'Enemy attacks pierce 15% of your shields.', [flat('shieldPierce', 15)]),
  // The party's burdens
  a('weary-bones', 'Weary Bones', 'Your party deals 8% less damage.', undefined, [more('damageBonus', -8)]),
  a('thin-air', 'Thin Air', 'Your party has 10% less maximum health.', undefined, [pct('maxHp', -10)]),
  a('dull-edges', 'Dull Edges', 'Your party has 10% less accuracy and 5% less critical chance.', undefined, [pct('accuracy', -10), flat('critChance', -5)]),
  a('slow-blood', 'Slow Blood', 'Your party heals 20% less.', undefined, [more('healingPower', -20), more('healingReceived', -20)]),
  a('brittle-wards', 'Brittle Wards', 'Your party takes 8% more damage.', undefined, [flat('damageTaken', 8)]),
  a('heavy-boots', 'Heavy Boots', 'Your party is 8% slower.', undefined, [pct('speed', -8)]),
  a('dry-wells', 'Dry Wells', 'Your party has 15% less maximum mana.', undefined, [pct('maxMp', -15)]),
  a('stingy-gods', 'Stingy Gods', 'Your party gains 20% less favor.', undefined, [more('favorGain', -20)]),
  a('slow-ultimates', 'Slow Fire', 'Your ultimate charges 15% slower.', undefined, [more('ultimateGain', -15)]),
  a('tight-purse', 'Tight Purses', 'Your party finds 15% less gold.', undefined, [more('goldFind', -15)]),
  // Mixed bargains
  a('glass-and-thorn', 'Glass and Thorn', 'Enemies deal 20% more damage and have 15% less health.', [more('damageBonus', 20), pct('maxHp', -15)]),
  a('slow-and-heavy', 'Slow and Heavy', 'Enemies are 15% slower and have 30% more health.', [pct('speed', -15), pct('maxHp', 30)]),
  a('hunter-moon', 'Hunter’s Moon', 'Enemies have +6% crit and your party has +6 dodge.', [flat('critChance', 6)], [flat('dodge', 6)]),
  a('open-wounds', 'Open Wounds', 'Everyone takes 10% more damage.', [flat('damageTaken', 10)], [flat('damageTaken', 10)]),
  a('war-of-attrition', 'War of Attrition', 'Enemies regenerate 2 health a turn, and so does your party.', [flat('hpRegen', 2)], [flat('hpRegen', 2)]),
  a('blood-price', 'Blood Price', 'Enemies steal 4% life, and your party steals 4%.', [flat('lifesteal', 4)], [flat('lifesteal', 4)]),
  a('rich-veins', 'Rich Veins', 'Enemies have 15% more health; your party finds 20% more gold and 10% more magic.', [pct('maxHp', 15)], [more('goldFind', 20), more('magicFind', 10)]),
  a('gods-are-watching', 'The Gods Are Watching', 'Enemies hit 10% harder; your party gains 25% more favor.', [more('damageBonus', 10)], [more('favorGain', 25)]),
  a('late-bloomers', 'Late Bloomers', 'Enemies are 10% slower; your party gains 15% more XP.', [pct('speed', -10)], [more('xpGain', 15)]),
];
