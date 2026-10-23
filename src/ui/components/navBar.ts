import { content } from '../../data';
import { characterStats } from '../../engine/character/stats';
import type { GameSession } from '../../engine/state/gameState';
import { drawPortrait } from '../art/portraits';
import { el } from '../screen';

/** Screen switches available from in-game screens. */
export interface Nav {
  title: () => void;
  character: () => void;
  inventory: () => void;
  skills: () => void;
  battle: () => void;
}

export type NavTab = 'character' | 'inventory' | 'skills' | 'battle';

function bar(fraction: number, cls: string, label: string): HTMLElement {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return el(
    'div',
    { class: `bar ${cls}`, role: 'progressbar', 'aria-valuenow': String(Math.round(pct)), 'aria-label': label },
    el('div', { class: 'bar-fill', style: `width:${pct}%` }),
    el('span', { class: 'bar-label' }, label),
  );
}

/** Top bar shared by in-game screens: hero, vitals, gold and screen tabs. */
export function navBar(session: GameSession, nav: Nav, active: NavTab, extra?: HTMLElement): HTMLElement {
  const p = session.player;
  const stats = characterStats(p);
  const portrait = el('canvas', { class: 'portrait-small pixel' });
  const primary = p.classes[0];
  drawPortrait(portrait, p.raceId, p.portrait, primary ? content.classes.get(primary.classId).color + '55' : undefined);

  const tab = (id: NavTab, label: string, run: () => void): HTMLElement => {
    const b = el('button', { class: `tab${active === id ? ' active' : ''}` }, label);
    b.addEventListener('click', run);
    return b;
  };
  const title = el('button', {}, 'Title');
  title.addEventListener('click', nav.title);

  return el(
    'header',
    { class: 'sheet-header' },
    portrait,
    el(
      'div',
      { class: 'sheet-ident' },
      el('div', { class: 'sheet-name' }, p.name, p.hardcore ? el('span', { class: 'badge danger' }, 'Hardcore') : ''),
      el('div', { class: 'dim' }, `Level ${p.level} ${content.races.get(p.raceId).name} ${p.classes.map((c) => content.classes.get(c.classId).name).join(' / ')}`),
      ...(extra ? [extra] : []),
    ),
    el(
      'div',
      { class: 'sheet-vitals' },
      bar(p.hp / Math.max(1, stats.maxHp), 'hp', `HP ${p.hp} / ${stats.maxHp}`),
      bar(p.mp / Math.max(1, stats.maxMp), 'mp', `MP ${p.mp} / ${stats.maxMp}`),
    ),
    el('div', { class: 'sheet-gold' }, `${session.state.gold} gold`),
    el('nav', { class: 'tabs' }, tab('character', 'Character (C)', nav.character), tab('inventory', 'Inventory (I)', nav.inventory), tab('skills', 'Skills (K)', nav.skills), tab('battle', 'Proving Grounds (G)', nav.battle)),
    title,
  );
}
