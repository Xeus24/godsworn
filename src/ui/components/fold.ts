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

/**
 * Folds the heading groups of a flat panel: each h3 whose text has a summary in `summaries`
 * is wrapped with the siblings that follow it (up to the next heading) and folded.
 */
export function foldHeadings(container: HTMLElement, summaries: Record<string, string>): void {
  for (const h of [...container.querySelectorAll(':scope > h3')]) {
    const summary = summaries[h.textContent ?? ''];
    if (summary === undefined) continue;
    const group = el('div', {});
    let n: Node | null = h.nextSibling;
    while (n && !(n instanceof HTMLElement && /^H[23]$/.test(n.tagName))) {
      const next: Node | null = n.nextSibling;
      group.append(n);
      n = next;
    }
    h.replaceWith(group);
    group.prepend(h);
    foldPanel(group, summary);
  }
}
