import { content } from '../../data';
import { CONVICTIONS } from '../../data/heart/convictions';
import { QUIRKS } from '../../data/heart/bloodline';
import type { Ancestor, Heir } from '../../engine/realm/types';
import { el, type Screen } from '../screen';

/** A Hardcore hero has fallen. Their family goes on, or does not. */
export class HeirScreen implements Screen {
  constructor(
    private readonly fallen: Ancestor,
    private readonly heir: Heir,
    private readonly take: () => void,
    private readonly end: () => void,
  ) {}

  mount(root: HTMLElement): void {
    const h = this.heir;
    const cls = content.classes.find(h.classId)?.name ?? h.classId;
    const take = el('button', { class: 'primary', type: 'button' }, `Take up the oath as ${h.name}`);
    take.addEventListener('click', this.take);
    const end = el('button', { type: 'button' }, 'Let the line end');
    end.addEventListener('click', this.end);
    root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        el(
          'section',
          { class: 'panel' },
          el('h2', {}, `${this.fallen.name} has fallen`),
          el('p', {}, `Level ${this.fallen.level} ${content.classes.find(this.fallen.classId)?.name ?? ''}, killed by ${this.fallen.by}. The legend is over, and the save with it. But the family goes on.`),
          el('h3', {}, `${h.name}, generation ${h.generation}`),
          el('p', { class: 'small' }, `A ${cls}, of the same line. They carry ${h.gold} gold${h.convictions.length ? `, the beliefs ${h.convictions.map((id) => CONVICTIONS.find((c) => c.id === id)?.name).join(' and ')}` : ''}${h.quirks.length ? `, the quirks ${h.quirks.map((q) => QUIRKS.find((x) => x.id === q)?.name).join(', ')}` : ''}${h.patron ? `, and the mark of ${content.gods.get(h.patron).name}` : ''}${h.skillPoints ? `, and ${h.skillPoints} skill point${h.skillPoints === 1 ? '' : 's'} learned at a parent’s knee` : ''}.`),
          el('div', { class: 'row' }, take, end),
        ),
      ),
    );
  }

  unmount(): void {
    // nothing to tear down
  }
}
