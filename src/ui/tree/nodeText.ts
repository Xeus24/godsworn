import { content } from '../../data';
import { MASTERED_LEVEL, MASTERY_THRESHOLDS, masteryLevel, masteryPowerBonus, MAX_MASTERY } from '../../engine/skills/mastery';
import type { TreeNodeDef } from '../../engine/skills/treeTypes';
import { skillCard } from '../format';
import { formatModifier } from '../items/itemText';
import { el } from '../screen';

export const KIND_LABEL: Record<TreeNodeDef['kind'], string> = {
  active: 'Active skill',
  modifier: 'Skill modifier',
  minor: 'Minor passive',
  notable: 'Notable passive',
  choice: 'Choice (pick one)',
  keystone: 'Keystone',
  capstone: 'Capstone',
};

/** Rich description of a node at its current rank and the next. */
export function describeNode(node: TreeNodeDef, rank: number, lockedReason?: string, mastery?: number): HTMLElement {
  const lines: HTMLElement[] = [
    el('div', { class: 'tip-title' }, node.name),
    el('div', { class: 'tip-desc' }, `${KIND_LABEL[node.kind]} · Tier ${node.tier} · Rank ${rank}/${node.maxRank}`),
  ];
  if (node.kind === 'active' && node.skill) {
    const skill = content.skills.get(node.skill);
    const current = Math.min(skill.maxRank, (node.starting ? 1 : 0) + rank);
    lines.push(skillCard(skill, Math.max(1, current)));
    const power = skill.damage ?? skill.heal;
    if (rank < node.maxRank && power && current >= 1) {
      lines.push(el('div', { class: 'tip-good' }, `Next rank: ${Math.round((power.multiplier + power.perRank * current) * 100)}% power`));
    }
    if (mastery !== undefined) {
      const lvl = masteryLevel(mastery);
      const next = MASTERY_THRESHOLDS[lvl];
      lines.push(el('div', { class: lvl >= MASTERED_LEVEL ? 'tip-unique' : 'tip-desc' }, lvl >= MAX_MASTERY ? `✦✦ Grandmaster (+${Math.round(masteryPowerBonus(lvl) * 1000) / 10}% power, class perk active)` : `${lvl >= MASTERED_LEVEL ? '✦ Mastered. ' : ''}Mastery ${lvl}/${MAX_MASTERY}: ${mastery}/${next} uses (+${Math.round(masteryPowerBonus(lvl) * 1000) / 10}% power)`));
    }
  }
  if (node.variant) {
    lines.push(el('div', { class: 'tip-unique' }, node.variant.patch.description));
    lines.push(el('div', { class: 'tip-desc' }, `Only one modifier per skill can be active; choose it in the details panel.`));
  }
  if (node.modifiers?.length) {
    const r = Math.max(1, rank);
    for (const m of node.modifiers) lines.push(el('div', { class: rank ? 'tip-affix' : 'tip-desc' }, formatModifier({ ...m, value: Math.round(m.value * r * 10) / 10 })));
    if (rank > 0 && rank < node.maxRank) {
      lines.push(el('div', { class: 'tip-good' }, `Next rank: ${node.modifiers.map((m) => formatModifier({ ...m, value: Math.round(m.value * (rank + 1) * 10) / 10 })).join(', ')}`));
    }
  }
  if (node.text) lines.push(el('div', { class: node.kind === 'keystone' ? 'tip-corrupt' : 'tip-unique' }, node.text));
  for (const f of node.flags ?? []) {
    const mech = content.mechanics.find(f);
    if (mech) lines.push(el('div', { class: 'tip-unique' }, mech.text));
    else if (f.startsWith('immune:')) lines.push(el('div', { class: 'tip-unique' }, `Immune to ${content.statuses.find(f.slice(7))?.name ?? f.slice(7)}`));
  }
  if (lockedReason) lines.push(el('div', { class: 'tip-bad' }, lockedReason));
  return el('div', { class: 'item-tip' }, ...lines);
}
