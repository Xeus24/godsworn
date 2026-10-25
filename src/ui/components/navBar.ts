import { challengeNames } from '../../engine/character/challenges';
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
  general: () => void;
  pantheon: () => void;
  quests: () => void;
  party: () => void;
  codex: () => void;
  world: () => void;
}

export type NavTab = 'character' | 'inventory' | 'skills' | 'general' | 'pantheon' | 'quests' | 'party' | 'codex' | 'world';

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
  const identity = `Level ${p.level} ${content.races.get(p.raceId).name} ${[...p.classes.map((c) => content.classes.get(c.classId).name), ...p.hybrids.map((h) => content.hybrids.get(h).name)].join(' / ')}`;
  const title = el('button', {}, 'Title');
  title.addEventListener('click', nav.title);

  return el(
    'header',
    { class: 'sheet-header' },
    portrait,
    el(
      'div',
      { class: 'sheet-ident' },
      el('div', { class: 'sheet-name' }, p.name, p.title ? el('span', { class: 'sheet-title' }, p.title) : '', ...challengeNames(p).map((n) => el('span', { class: 'badge danger' }, n))),
      el('div', { class: 'dim', title: identity }, identity),
      ...(extra ? [extra] : []),
    ),
    el(
      'div',
      { class: 'sheet-vitals' },
      bar(p.hp / Math.max(1, stats.maxHp), 'hp', `HP ${p.hp} / ${stats.maxHp}`),
      bar(p.mp / Math.max(1, stats.maxMp), 'mp', `MP ${p.mp} / ${stats.maxMp}`),
    ),
    el('div', { class: 'sheet-gold' }, `${session.state.gold} gold`),
    el('nav', { class: 'tabs' }, tab('character', 'Character (C)', nav.character), tab('inventory', 'Inventory (I)', nav.inventory), tab('skills', 'Skills (K)', nav.skills), tab('general', 'General (L)', nav.general), tab('pantheon', 'Pantheon (P)', nav.pantheon), tab('quests', 'Quests (J)', nav.quests), tab('party', 'Party (O)', nav.party), tab('codex', 'Codex (B)', nav.codex), tab('world', 'World (G)', nav.world)),
    title,
  );
}
