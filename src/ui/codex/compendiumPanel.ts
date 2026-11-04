import { content } from '../../data';
import { specializationsFor } from '../../engine/skills/specs';
import { el } from '../screen';

type Page = 'gods' | 'classes';
export interface CompendiumView {
  page: Page;
  pick?: string;
}

/** Codex > Compendium: what the Pantheon and the classes are, read-only. (The Pantheon and Skills screens are where you play with them.) */
export function compendiumPanel(rerender: () => void, view: CompendiumView): HTMLElement {
  const tabs = (['gods', 'classes'] as Page[]).map((p) => {
    const b = el('button', { type: 'button', class: view.page === p ? 'active' : '' }, p === 'gods' ? 'The gods' : 'The classes');
    b.addEventListener('click', () => {
      view.page = p;
      delete view.pick;
      rerender();
    });
    return b;
  });
  const names = view.page === 'gods' ? content.gods.all().map((g) => ({ id: g.id, name: g.name })) : content.classes.all().map((c) => ({ id: c.id, name: c.name }));
  const list = names.map((n) => {
    const b = el('button', { type: 'button', class: view.pick === n.id ? 'active' : '' }, n.name);
    b.addEventListener('click', () => {
      view.pick = n.id;
      rerender();
    });
    return b;
  });
  let page: HTMLElement | undefined;
  if (view.pick && view.page === 'gods') {
    const g = content.gods.get(view.pick);
    const p = content.pantheon.find(view.pick);
    page = el(
      'div',
      {},
      el('h3', {}, `${g.name}, ${g.epithet}`),
      el('p', { class: 'small' }, `${g.domain} · ${g.element} · favors ${g.favoredStats.join(', ')}`),
      ...(p
        ? [
            el('p', { class: 'small' }, p.personality),
            el('p', { class: 'small' }, `Allies: ${p.allies.map((a: string) => content.gods.find(a)?.name ?? a).join(', ') || 'none'} · Rivals: ${p.rivals.map((a: string) => content.gods.find(a)?.name ?? a).join(', ') || 'none'}`),
            el('p', { class: 'small' }, `Likes: ${p.likes.map((l) => l.text).join(', ')}.`),
            el('p', { class: 'small' }, `Dislikes: ${p.dislikes.map((l) => l.text).join(', ')}.`),
            el('p', { class: 'small dim' }, `Shrine: ${p.shrine}.`),
          ]
        : []),
    );
  } else if (view.pick) {
    const c = content.classes.get(view.pick);
    page = el(
      'div',
      {},
      el('h3', {}, `${c.name}: ${c.tagline}`),
      el('p', { class: 'small' }, c.description),
      el('p', { class: 'small' }, `Plays as: ${c.playstyle}`),
      ...(c.trait ? [el('p', { class: 'small' }, `Trait, ${c.trait.name}: ${c.trait.description}`)] : []),
      el('p', { class: 'small' }, `Resource: ${content.resources.find(c.resource ?? '')?.name ?? c.resource ?? 'none'}. Weapons: ${c.weapons.join(', ')}. Armor: ${c.armor.join(', ')}.`),
      el('p', { class: 'small' }, `Specializations: ${specializationsFor(c.id).map((s) => s.name).join(', ') || 'none'}.`),
    );
  }
  return el('section', { class: 'panel' }, el('h2', {}, 'Compendium'), el('div', { class: 'row' }, ...tabs), el('div', { class: 'row wrap' }, ...list), ...(page ? [page] : [el('p', { class: 'dim small' }, 'Pick one to read about it.')]));
}
