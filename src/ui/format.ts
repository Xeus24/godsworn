import { content } from '../data';
import { powerAtRank, type SkillDef } from '../engine/skills/types';
import type { StatBreakdown } from '../engine/stats/modifiers';
import type { StatId } from '../engine/stats/types';
import { el } from './screen';

export function trimNumber(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

export function formatStat(stat: StatId, value: number): string {
  return content.stats.get(stat).format === 'percent' ? `${trimNumber(value)}%` : trimNumber(value);
}

/** Tooltip body showing how a stat was computed. */
export function statBreakdownTooltip(stat: StatId, b: StatBreakdown, final: number): HTMLElement {
  const info = content.stats.get(stat);
  const lines: HTMLElement[] = [
    el('div', { class: 'tip-title' }, `${info.name}: ${formatStat(stat, final)}`),
    el('div', { class: 'tip-desc' }, info.description),
  ];
  const row = (label: string, value: string): HTMLElement => el('div', { class: 'tip-row' }, el('span', {}, label), el('span', {}, value));
  lines.push(row('Base', trimNumber(Math.round(b.base * 100) / 100)));
  if (b.flat !== 0) lines.push(row('Flat', `${b.flat > 0 ? '+' : ''}${trimNumber(b.flat)}`));
  if (b.percent !== 0) lines.push(row('Increased', `${b.percent > 0 ? '+' : ''}${trimNumber(b.percent)}%`));
  if (b.more !== 1) lines.push(row('More', `x${trimNumber(Math.round(b.more * 1000) / 1000)}`));
  if (b.override !== undefined) lines.push(row('Set to', trimNumber(b.override)));
  const sources = [...new Set(b.sources.map((m) => m.source))];
  if (sources.length > 0) lines.push(el('div', { class: 'tip-sources' }, `From: ${sources.join(', ')}`));
  return el('div', {}, ...lines);
}

export function skillCostText(skill: SkillDef): string {
  const parts: string[] = [];
  if (skill.cost.mp) parts.push(`${skill.cost.mp} MP`);
  if (skill.cost.hpPct) parts.push(`${skill.cost.hpPct}% HP`);
  if (skill.cost.resource) parts.push(`${skill.cost.resource.amount} ${content.resources.get(skill.cost.resource.id).name}`);
  return parts.length > 0 ? parts.join(' + ') : 'Free';
}

const STAT_SHORT: Record<string, string> = { physicalAttack: 'ATK', magicAttack: 'MAG', divinePower: 'DIV' };

/** Compact skill card used in creation and character screens. */
export function skillCard(skill: SkillDef, rank = 1): HTMLElement {
  const meta: string[] = [skillCostText(skill)];
  if (skill.cooldown > 0) meta.push(`${skill.cooldown}-turn cooldown`);
  if (skill.damage) {
    const hits = skill.damage.hits && skill.damage.hits > 1 ? ` x${skill.damage.hits}` : '';
    meta.push(`${Math.round(powerAtRank(skill.damage, rank) * 100)}% ${STAT_SHORT[skill.damage.stat]}${hits}`);
  }
  if (skill.heal) meta.push(`Heals ${Math.round(powerAtRank(skill.heal, rank) * 100)}% ${STAT_SHORT[skill.heal.stat]}`);
  return el(
    'div',
    { class: 'skill-card' },
    el(
      'div',
      { class: 'skill-head' },
      el('span', { class: 'skill-name' }, skill.name),
      el('span', { class: 'skill-rank' }, skill.maxRank > 1 ? `Rank ${rank}/${skill.maxRank}` : ''),
    ),
    el('div', { class: 'skill-desc' }, skill.description),
    el('div', { class: 'skill-meta' }, meta.join(' · ')),
    el('div', { class: 'skill-tags' }, skill.tags.join(' · ')),
  );
}
