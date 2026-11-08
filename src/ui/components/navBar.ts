import { challengeNames } from '../../engine/character/challenges';
import { getDifficulty } from '../../data/difficulty';
import { content } from '../../data';
import { characterStats } from '../../engine/character/stats';
import type { GameSession } from '../../engine/state/gameState';
import { drawPortrait } from '../art/portraits';
import { frameStyle } from '../character/appearancePanel';
import { el } from '../screen';
import { isRevealed } from '../../engine/guide/reveal';
import { nextStep } from '../../engine/guide/nextStep';
import { firstSteps } from '../../engine/guide/firstSteps';
import { settings } from '../settings';

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
  const portrait = el('canvas', { class: 'portrait-small pixel', style: frameStyle(p.appearance?.frame) });
  const primary = p.classes[0];
  drawPortrait(portrait, p.raceId, p.portrait, primary ? content.classes.get(primary.classId).color + '55' : undefined);

  // The tab the next first step is done on gets a pulsing outline (unless you are already there).
  const fs = firstSteps(session.state);
  const coachTab = fs.active ? fs.next?.place : undefined;
  const tab = (id: NavTab, label: string, run: () => void): HTMLElement => {
    const b = el('button', { class: `tab${active === id ? ' active' : ''}${coachTab === id && active !== id ? ' coach-pulse' : ''}` }, label);
    b.addEventListener('click', run);
    return b;
  };
  const identity = `Level ${p.level} ${content.races.get(p.raceId).name} ${[...p.classes.map((c) => content.classes.get(c.classId).name), ...p.hybrids.map((h) => content.hybrids.get(h).name)].join(' / ')}`;
  const title = el('button', {}, 'Menu (Esc)');
  title.addEventListener('click', nav.title);

  // Screens a new hero does not need yet stay hidden until their level (the open screen always shows).
  const state = session.state;
  const showAll = settings().showEverything;
  const shown = (key: 'tab:skills' | 'tab:general' | 'tab:pantheon' | 'tab:party', id: NavTab): boolean => active === id || isRevealed(state, key, showAll);
  const tabs = [
    tab('character', 'Character (C)', nav.character),
    tab('inventory', 'Inventory (I)', nav.inventory),
    shown('tab:skills', 'skills') ? tab('skills', 'Skills (K)', nav.skills) : null,
    shown('tab:general', 'general') ? tab('general', 'General (L)', nav.general) : null,
    shown('tab:pantheon', 'pantheon') ? tab('pantheon', 'Pantheon (P)', nav.pantheon) : null,
    tab('quests', 'Quests (J)', nav.quests),
    shown('tab:party', 'party') ? tab('party', 'Party (O)', nav.party) : null,
    tab('codex', 'Codex (B)', nav.codex),
    tab('world', 'World (G)', nav.world),
  ].filter((t): t is HTMLElement => t !== null);
  const hint = el('button', { class: 'hint-btn', title: 'Tells you one sensible next thing to do' }, 'Next?');
  hint.addEventListener('click', () => session.bus.emit('toast', { kind: 'info', text: nextStep(session) }));

  const header = el(
    'header',
    { class: 'sheet-header' },
    portrait,
    el(
      'div',
      { class: 'sheet-ident' },
      el('div', { class: 'sheet-name' }, p.name, p.title ? el('span', { class: 'sheet-title' }, p.title) : '', ...challengeNames(p).map((n) => el('span', { class: 'badge danger' }, n)), el('span', { class: 'badge', style: `color:${getDifficulty(p.difficulty).color}` }, getDifficulty(p.difficulty).name)),
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
    el('nav', { class: 'tabs' }, ...tabs),
    hint,
    title,
  );
  // Each screen gets its own accent hue (see `.sheet[data-screen]` in style.css); the sheet is the header's parent once it is placed.
  queueMicrotask(() => header.closest('.sheet')?.setAttribute('data-screen', active));
  return header;
}
