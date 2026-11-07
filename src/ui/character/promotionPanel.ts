import { content } from '../../data';
import { PROMOTION, promotionOf } from '../../data/promotions';
import type { GameSession } from '../../engine/state/gameState';
import { foldPanel } from '../components/fold';
import { el } from '../screen';

/** Class Promotions (Section K): one line per class you hold, and the trial button when it is ready. */
export function promotionPanel(s: GameSession, render: () => void): HTMLElement[] {
  const k = s.promotions;
  const rows = s.player.classes.map((c) => {
    const def = content.classes.get(c.classId);
    const tier = k.tierOf(c.classId);
    const title = k.titleOf(c.classId);
    const next = k.next(c.classId);
    const why = k.why(c.classId);
    const btns: HTMLElement[] = [];
    if (next) {
      const b = el('button', { title: why ?? `Fight your own Shade for the title ${next.title}.` }, `Trial of the ${next.title}`) as HTMLButtonElement;
      b.disabled = Boolean(why);
      b.addEventListener('click', () => {
        const r = k.begin(c.classId);
        s.bus.emit('toast', { kind: r.ok ? 'info' : 'warning', text: r.ok ? r.text : r.reason });
        render();
      });
      btns.push(b);
    }
    return el('div', { class: 'small' }, el('b', {}, def.name), ` ${title ?? 'base class'} (${PROMOTION.tierNames[tier] ?? 'Tier 1'}) `, ...(why && next ? [el('span', { class: 'dim' }, why)] : []), ...btns);
  });
  const best = Math.max(...s.player.classes.map((c) => k.tierOf(c.classId)));
  void promotionOf;
  return [foldPanel(el('section', { class: 'panel' }, el('h3', {}, 'Promotion'), el('p', { class: 'dim small' }, 'Tier 2 at class level 30 and Tier 3 at 60: beat your own Shade for a title, a stat boost, two skills and a new branch.'), ...rows), `Tier ${best}`)];
}
