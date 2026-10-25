import { content } from '../../data';
import type { Battle } from '../../engine/combat/battle';
import type { Combatant } from '../../engine/combat/types';
import { calculateStats } from '../../engine/stats/calculate';
import { ELEMENTS, PRIMARY_STATS, type StatId } from '../../engine/stats/types';
import { attachTooltip } from '../components/tooltip';
import { formatStat } from '../format';
import { el } from '../screen';
import { effectsOf, effectTooltip } from './effectText';

const KEY = 'godsworn:statsWindow';

/** Stat groups shown in the window; elements get their own table. */
const GROUPS: [string, StatId[]][] = [
  ['Attributes', [...PRIMARY_STATS]],
  ['Offense', ['physicalAttack', 'magicAttack', 'divinePower', 'critChance', 'critDamage', 'accuracy', 'damageBonus', 'lifesteal', 'statusChance', 'cooldownReduction', 'resourceGain', 'ultimateGain']],
  ['Defense', ['maxHp', 'maxMp', 'defense', 'magicResist', 'dodge', 'damageTaken', 'statusResist', 'hpRegen', 'mpRegen', 'healingReceived']],
  ['Utility', ['speed', 'healingPower', 'blessingPower', 'favorGain', 'xpGain', 'goldFind', 'magicFind']],
];

function loadPosition(): { x: number; y: number; w?: number; h?: number } {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { x?: number; y?: number; w?: number; h?: number };
    return { x: p.x ?? 24, y: p.y ?? 80, ...(p.w ? { w: p.w } : {}), ...(p.h ? { h: p.h } : {}) };
  } catch {
    return { x: 24, y: 80 };
  }
}

/**
 * A floating panel (drag it by the title, resize it from the corner) with
 * every stat of any unit in the fight, live: buffs, statuses and gear
 * included. Green numbers are above what the unit has outside combat,
 * red below. Position and size are remembered.
 */
export class StatsWindow {
  readonly element: HTMLElement;
  private readonly body = el('div', { class: 'sw-body' });
  private readonly tabs = el('div', { class: 'tabs sw-tabs' });
  private selected: string | undefined;

  constructor(private readonly battle: Battle, onClose: () => void) {
    const pos = loadPosition();
    const close = el('button', { class: 'tab tiny', 'aria-label': 'Close the stats window' }, '✕');
    close.addEventListener('click', onClose);
    const title = el('div', { class: 'sw-title' }, el('b', {}, 'Stats'), el('span', { class: 'dim small' }, ' drag to move'), close);
    this.element = el('div', { class: 'stats-window panel', role: 'dialog', 'aria-label': 'Stats window' }, title, this.tabs, this.body);
    this.element.style.left = `${pos.x}px`;
    this.element.style.top = `${pos.y}px`;
    if (pos.w) this.element.style.width = `${pos.w}px`;
    if (pos.h) this.element.style.height = `${pos.h}px`;
    this.enableDrag(title);
    new ResizeObserver(() => this.save()).observe(this.element);
    this.refresh();
  }

  private save(): void {
    try {
      const r = this.element.getBoundingClientRect();
      if (r.width > 0) localStorage.setItem(KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }));
    } catch {
      // Storage may be unavailable: the window just forgets where it was.
    }
  }

  private enableDrag(handle: HTMLElement): void {
    handle.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      const r = this.element.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      handle.setPointerCapture(e.pointerId);
      const move = (m: PointerEvent): void => {
        const x = Math.max(0, Math.min(window.innerWidth - 80, m.clientX - dx));
        const y = Math.max(0, Math.min(window.innerHeight - 40, m.clientY - dy));
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
      };
      const up = (): void => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        this.save();
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
    });
  }

  private units(): Combatant[] {
    return [...this.battle.combatants.filter((x) => x.side === 'party' && x.kind !== 'summon'), ...this.battle.combatants.filter((x) => x.side === 'enemy' && x.alive)];
  }

  /** Redraws from the battle's current state. */
  refresh(): void {
    const units = this.units();
    if (!units.some((u) => u.id === this.selected)) this.selected = units[0]?.id;
    this.tabs.replaceChildren(
      ...units.map((u) => {
        const b = el('button', { class: `tab${u.id === this.selected ? ' active' : ''}` }, u.name);
        b.addEventListener('click', () => {
          this.selected = u.id;
          this.refresh();
        });
        return b;
      }),
    );
    const x = units.find((u) => u.id === this.selected);
    if (!x) return;
    const now = this.battle.stats(x);
    const base = calculateStats(x.statInput);
    const row = (id: StatId): HTMLElement => {
      const info = content.stats.get(id);
      const delta = now[id] - base[id];
      const cell = el('div', { class: 'sw-stat' }, el('span', {}, info.name), el('b', { class: delta > 0.001 ? 'tip-good' : delta < -0.001 ? 'tip-bad' : '' }, formatStat(id, now[id])));
      attachTooltip(cell, () => `${info.description}${Math.abs(delta) > 0.001 ? ` In this fight: ${delta > 0 ? '+' : ''}${formatStat(id, Math.round(delta * 100) / 100)} from buffs and effects.` : ''}`);
      return cell;
    };
    const res = x.resourceId ? content.resources.get(x.resourceId) : undefined;
    const vitals = el(
      'div',
      { class: 'sw-vitals small' },
      el('div', {}, `${x.name} · level ${x.level}${x.stance ? ` · ${content.stances.get(x.stance).name}` : ''}`),
      el('div', {}, `HP ${x.hp}/${x.maxHp}${x.shield ? ` (+${x.shield} shield)` : ''} · MP ${x.mp}/${x.maxMp}`),
      ...(res ? [el('div', {}, `${res.name} ${Math.floor(x.resources[res.id] ?? 0)}/${res.max}`)] : []),
      el('div', {}, `Ultimate ${Math.floor(x.ultimate)}%${x.stagger ? ` · Stagger ${Math.floor(x.stagger.value)}/${Math.floor(x.stagger.max)}${x.stagger.brokenTurns > 0 ? ' (broken)' : ''}` : ''}`),
    );
    const fx = effectsOf(x);
    const effects = el(
      'div',
      { class: 'sw-effects' },
      el('h4', {}, `Effects (${fx.length})`),
      ...(fx.length ? fx.map((f) => {
        const chip = el('div', { class: 'sw-effect' }, el('span', { class: 'sw-glyph', style: `background:${f.color}` }, f.glyph), el('span', {}, `${f.name}${f.stacks > 1 ? ` x${f.stacks}` : ''}${f.turns > 0 ? ` (${f.turns}t)` : ''}`));
        attachTooltip(chip, () => effectTooltip(this.battle, x, f));
        return chip;
      }) : [el('div', { class: 'dim small' }, 'None')]),
    );
    const elems = el(
      'div',
      { class: 'sw-elements' },
      el('h4', {}, 'Elements (damage / resist)'),
      ...ELEMENTS.map((e) => {
        const dmg = content.stats.get(`${e}Damage`);
        const rs = content.stats.get(`${e}Resist`);
        const d = row(dmg.id);
        const r = row(rs.id);
        return el('div', { class: 'sw-elem-row' }, el('span', {}, e[0]?.toUpperCase() + e.slice(1)), d.lastElementChild ?? el('span'), r.lastElementChild ?? el('span'));
      }),
    );
    this.body.replaceChildren(vitals, effects, ...GROUPS.map(([name, ids]) => el('div', { class: 'sw-group' }, el('h4', {}, name), el('div', { class: 'sw-grid' }, ...ids.map(row)))), elems);
  }
}
