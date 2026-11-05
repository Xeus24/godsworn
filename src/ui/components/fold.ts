import { el } from '../screen';

/** Titles of folded panels the player has opened; kept across re-renders and screens. */
const opened = new Set<string>();

/**
 * Folds an existing panel (a section whose first child is an h3) down to one line:
 * the heading plus a short summary, with the rest shown when it is opened.
 */
export function foldPanel(section: HTMLElement, summary: string): HTMLElement {
  const heading = section.querySelector(':scope > h3');
  if (!heading) return section;
  const key = heading.textContent ?? '';
  const body = [...section.childNodes].filter((n) => n !== heading);
  const d = el('details', { class: 'fold-panel' }, el('summary', {}, el('b', {}, ...heading.childNodes), el('span', { class: 'dim small' }, ` ${summary}`)), ...body) as HTMLDetailsElement;
  d.open = opened.has(key);
  d.addEventListener('toggle', () => (d.open ? opened.add(key) : opened.delete(key)));
  section.replaceChildren(d);
  section.classList.add('folded');
  return section;
}
