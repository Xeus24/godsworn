import { content } from '../../data';
import { getDifficulty } from '../../data/difficulty';
import { characterStats, primaryClassId } from '../../engine/character/stats';
import type { Character } from '../../engine/character/types';
import { PRIMARY_STATS, type StatId } from '../../engine/stats/types';
import { formatStat, skillCard } from '../format';
import { el } from '../screen';

const PREVIEW_DERIVED: StatId[] = [
  'maxHp',
  'maxMp',
  'physicalAttack',
  'magicAttack',
  'divinePower',
  'defense',
  'magicResist',
  'critChance',
  'dodge',
  'speed',
];

/** Everything a player needs to judge a build before confirming it. */
export function renderPreview(char: Character, hardcore: boolean): HTMLElement {
  const race = content.races.get(char.raceId);
  const cls = content.classes.get(primaryClassId(char));
  const sign = content.birthSigns.get(char.birthSignId);
  const god = content.gods.get(sign.god);
  const stats = characterStats(char);

  const statCell = (id: StatId): HTMLElement =>
    el('div', { class: 'stat-cell' }, el('span', {}, content.stats.get(id).short), el('b', {}, formatStat(id, stats[id])));

  const resource = cls.resource ? content.resources.get(cls.resource) : undefined;

  return el(
    'div',
    {},
    el('h2', {}, `${char.name}`),
    el('div', { class: 'preview-sub' }, `${race.name} ${cls.name}${hardcore ? ' · Hardcore' : ''}`),
    el('div', { class: 'preview-tagline', style: `color:${cls.color}` }, cls.tagline),
    difficultyPanel(char),
    el('h3', {}, 'Attributes'),
    el('div', { class: 'stat-grid' }, ...PRIMARY_STATS.map(statCell)),
    el('div', { class: 'stat-grid' }, ...PREVIEW_DERIVED.map(statCell)),
    el('h3', {}, 'Playstyle'),
    el('p', {}, cls.playstyle),
    el('p', {}, el('b', {}, `${cls.mechanic.name}: `), cls.mechanic.description),
    ...(cls.trait ? [el('p', {}, el('b', {}, `Trait, ${cls.trait.name}: `), cls.trait.description)] : []),
    resource ? el('p', { class: 'dim' }, `Resource: ${resource.name} (max ${resource.max}) · MP`) : el('p', { class: 'dim' }, 'Resource: MP'),
    el(
      'p',
      { class: 'dim' },
      `Weapons: ${cls.weapons.map((w) => content.weaponTypes.get(w).name).join(', ')}`,
    ),
    el('p', { class: 'dim' }, `Armor: ${cls.armor.map((a) => content.armorWeights.get(a).name).join(', ')}`),
    el('h3', {}, 'Starting Skills'),
    ...Object.keys(char.skills).map((id) => skillCard(content.skills.get(id))),
    el('h3', {}, `Racial Passive: ${race.passive.name}`),
    el('p', {}, race.passive.description),
    el('h3', {}, `${race.name} Lore`),
    el('p', { class: 'dim small' }, `Homeland: ${race.flavor.homeland}`),
    el('p', {}, race.flavor.lore),
    el('p', { class: 'dim' }, race.flavor.saying),
    el('h3', {}, sign.name),
    el('p', {}, el('span', { style: `color:${god.color}` }, `${god.name}, ${god.domain}. `), sign.description),
  );
}

const times = (n: number): string => `x${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, '')}`;

/** What the chosen difficulty does to enemies, to the hero and to rewards. */
function difficultyPanel(char: Character): HTMLElement {
  const d = getDifficulty(char.difficulty);
  const e = d.enemy;
  const bonuses = d.bonuses.map((m) => `${content.stats.get(m.stat).short} ${m.value > 0 ? '+' : ''}${m.value}${m.type === 'percent' ? '%' : ''}`);
  return el(
    'div',
    { class: 'difficulty-panel' },
    el('h3', { style: `color:${d.color}` }, `Difficulty: ${d.name}`),
    el('p', {}, d.blurb),
    el('p', { class: 'dim small' }, `Enemies: HP ${times(e.hp)}, damage ${times(e.damage)}, defense ${times(e.defense)}, speed ${times(e.speed)}, accuracy ${e.accuracy >= 0 ? '+' : ''}${e.accuracy}${e.levelBonus ? `, +${e.levelBonus} levels` : ''}`),
    el('p', { class: 'dim small' }, `Rewards: XP ${times(d.reward.xp)}, gold ${times(d.reward.gold)}, paragon XP ${times(d.reward.paragonXp)}${bonuses.length ? `. Permanent bonuses: ${bonuses.join(', ')}` : ''}`),
  );
}
