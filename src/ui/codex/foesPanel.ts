import { GREAT_FOES } from '../../data/greatFoes';
import { content } from '../../data';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import type { RealmView } from './realmPanel';

/** Items 113-120: the great foes. Seek them in the region where they lurk. */
export function foesPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const f = s.foes.f;
  const rows = GREAT_FOES.map((g) => {
    const def = content.enemies.get(g.enemy);
    const done = f.defeated[g.id] !== undefined;
    const b = el('button', { type: 'button' }, done ? 'Face again' : 'Seek them out') as HTMLButtonElement;
    b.addEventListener('click', () => {
      const r = s.foes.seek(g.id);
      open.outcome = r.ok ? '' : r.reason;
      rerender();
    });
    return el('div', { class: 'row wrap small' }, el('b', {}, `${def.name} (level ${def.level})`), done ? ` ✓ ${g.title}: ${g.boonText} ` : ` ${g.hint} `, b);
  });
  return el('div', {}, el('p', { class: 'dim small' }, 'Eight named terrors with a trick each. The first victory over each gives gold, a title and a permanent boon.'), ...rows, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
