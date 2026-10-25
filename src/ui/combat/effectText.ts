import { content } from '../../data';
import type { Battle } from '../../engine/combat/battle';
import type { Combatant } from '../../engine/combat/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import { trimNumber } from '../format';
import { el } from '../screen';

/** One buff or status on a unit, with what the UI needs to draw and explain it. */
export interface EffectView {
  kind: 'status' | 'buff';
  id: string;
  name: string;
  glyph: string;
  color: string;
  stacks: number;
  turns: number;
}

/** Every effect on a unit, statuses first, in the order they are drawn. */
export function effectsOf(x: Combatant): EffectView[] {
  const statuses = x.statuses.map((s): EffectView => {
    const def = content.statuses.get(s.id);
    return { kind: 'status', id: s.id, name: def.name, glyph: def.glyph, color: def.color, stacks: s.stacks, turns: s.turns };
  });
  const buffs = x.buffs.map((b): EffectView => ({ kind: 'buff', id: b.id, name: b.name, glyph: '+', color: '#6fdc8a', stacks: 1, turns: b.turns }));
  return [...statuses, ...buffs];
}

/** "+15% Damage Bonus", "-40% Damage Taken (more)": a modifier in words. */
export function modifierText(m: ModifierSpec, mult = 1): string {
  const info = content.stats.find(m.stat);
  const name = info?.name ?? m.stat;
  const v = m.value * mult;
  const sign = v > 0 ? '+' : '';
  const unit = info?.format === 'percent' ? '%' : '';
  switch (m.type) {
    case 'flat':
      return `${sign}${trimNumber(v)}${unit} ${name}`;
    case 'percent':
      return `${sign}${trimNumber(v)}% ${name}`;
    case 'more':
      return `${sign}${trimNumber(v)}% ${name} (multiplied)`;
    default:
      return `${name} set to ${trimNumber(v)}${unit}`;
  }
}

const row = (text: string, cls = ''): HTMLElement => el('div', { class: cls || 'tip-desc' }, text);

/** What a buff or status does right now, who applied it and how long it lasts. */
export function effectTooltip(b: Battle, x: Combatant, fx: EffectView): HTMLElement {
  const out: HTMLElement[] = [el('div', { class: 'tip-title', style: `color:${fx.color}` }, `${fx.name}${fx.stacks > 1 ? ` x${fx.stacks}` : ''}`)];
  if (fx.kind === 'status') {
    const def = content.statuses.get(fx.id);
    const inst = x.statuses.find((s) => s.id === fx.id);
    out.push(row(`${def.kind === 'buff' ? 'Beneficial' : 'Harmful'} effect. ${def.description}`));
    if (def.dot) out.push(row(`Each turn: ${def.dot.element} damage${def.dot.percentMaxHp ? ` plus ${def.dot.percentMaxHp}% of max HP` : ''}, per stack.`));
    if (def.hot) out.push(row(`Each turn: heals ${def.hot.percentMaxHp}% of max HP.`));
    if (def.skipTurn) out.push(row('The bearer loses its turn.'));
    if (def.skipChance) out.push(row(`${Math.round(def.skipChance * 100)}% chance to lose the turn.`));
    if (def.noSkills) out.push(row('Cannot use skills.'));
    if (def.charmed) out.push(row('Attacks its own side.'));
    for (const m of def.modifiers ?? []) out.push(row(modifierText(m, def.perStack ? fx.stacks : 1), 'tip-good'));
    if (def.stacking === 'stack') out.push(row(`Stacks up to ${def.maxStacks}; ${fx.stacks} now.`));
    if (inst) out.push(row(`Lasts ${inst.turns} more turn${inst.turns === 1 ? '' : 's'}.${b.get(inst.sourceId) ? ` Applied by ${b.get(inst.sourceId)?.name}.` : ''}`, 'dim small'));
  } else {
    const buff = x.buffs.find((bf) => bf.id === fx.id);
    if (!buff) return el('div', {}, ...out);
    out.push(row('Temporary bonus.'));
    for (const m of buff.modifiers) out.push(row(modifierText(m), 'tip-good'));
    if (buff.modifiers.length === 0) out.push(row('A lingering effect (see the skill that applied it).'));
    out.push(row(`${buff.turns > 0 ? `Lasts ${buff.turns} more turn${buff.turns === 1 ? '' : 's'}.` : 'Lasts for the whole battle.'}${b.get(buff.sourceId) ? ` From ${b.get(buff.sourceId)?.name}.` : ''}`, 'dim small'));
  }
  return el('div', {}, ...out);
}
