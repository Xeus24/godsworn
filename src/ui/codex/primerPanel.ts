import { content } from '../../data';
import { evaluateLock } from '../../engine/locks/locks';
import type { GameSession } from '../../engine/state/gameState';
import { foldPanel } from '../components/fold';
import { el } from '../screen';

/**
 * Codex > Progress > Primer: the Wayfarer's Primer. Every system the hero has met, with what its mentor
 * taught, and a way to be walked through it again. Systems still ahead show only as a short count.
 */
export function primerPanel(session: GameSession): HTMLElement {
  const known = session.guide.known();
  const ahead = content.systems.all().filter((x) => !known.includes(x) && content.locks.get(x.lock).visibility !== 'hidden');
  const rows = known.map((sys) => {
    const again = el('button', { type: 'button' }, 'Walk me through it again');
    again.addEventListener('click', () => session.guide.replay(sys.id));
    const section = el(
      'section',
      { class: 'primer-entry' },
      el('h3', {}, sys.name),
      el('p', { class: 'small' }, sys.summary),
      el('ol', { class: 'small' }, ...sys.steps.map((st) => el('li', {}, st.text))),
      el('div', { class: 'row' }, el('span', { class: 'dim small' }, `Taught by ${sys.mentor}. `), again),
    );
    return foldPanel(section, session.guide.isSeen(sys.id) ? '' : '· new');
  });
  const soon = ahead.slice(0, 3).map((sys) => el('li', { class: 'dim small' }, `${sys.name}: ${content.locks.get(sys.lock).hint}`, ...progressText(session, sys.lock)));
  return el(
    'section',
    { class: 'panel' },
    el('h2', {}, 'The Wayfarer’s Primer'),
    el('p', { class: 'dim small' }, `What your mentors have taught you on the Road. ${known.length} of ${content.systems.all().length} known.`),
    el('div', { class: 'quest-list' }, ...rows),
    ...(soon.length ? [el('h3', {}, 'Still ahead'), el('ul', {}, ...soon)] : []),
  );
}

function progressText(session: GameSession, lock: string): string[] {
  const p = evaluateLock(session.state, lock).progress[0];
  return p ? [` (${p.have}/${p.need})`] : [];
}
