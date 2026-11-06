import { content } from '../../data';
import { ARCANA_PERK, FORGE_ELEMENTS, INK_PRICE, RIDERS, SHAPES, forgeCost, maxForged } from '../../data/spellforge';
import { ARCANA, type Arcanum } from '../../data/tabletop';
import { HIRELING, HIRELINGS, KITS, KIT_TRAIN_PRICE } from '../../data/workshop';
import type { Element } from '../../engine/stats/types';
import type { GameSession } from '../../engine/state/gameState';
import { foldPanel } from '../components/fold';
import { el } from '../screen';

/** The Workbench (Section I-7c): the Spellforge, Kits and a Hireling, all folded inside one panel. */
export function workshopPanel(s: GameSession, render: () => void): HTMLElement[] {
  const w = s.workshop;
  const p = s.player;
  const note = (r: { ok: boolean; text?: string; reason?: string }): void => {
    s.bus.emit('toast', { kind: 'info', text: r.ok ? (r.text as string) : (r.reason as string) });
    render();
  };
  const btn = (label: string, title: string, fn: () => void, disabled = false): HTMLButtonElement => {
    const b = el('button', { title }, label) as HTMLButtonElement;
    b.disabled = disabled;
    b.addEventListener('click', fn);
    return b;
  };
  const select = (label: string, options: [string, string][]): HTMLSelectElement => {
    const sel = el('select', { 'aria-label': label }) as HTMLSelectElement;
    for (const [v, t] of options) sel.append(el('option', { value: v }, t));
    return sel;
  };

  // Spellforge
  const arc = select('Arcanum', ARCANA.map((a) => [a, `${a}: ${ARCANA_PERK[a].text}`]));
  const shape = select('Shape', SHAPES.map((x) => [x.id, `${x.name} (${x.text})`]));
  const elem = select('Element', FORGE_ELEMENTS.map((e) => [e, e]));
  const rider = select('Rider', RIDERS.map((r) => [r.id, `${r.name}: ${r.text}`]));
  const forged = w.forgedIds.map((id) => el('div', { class: 'small', title: content.skills.get(id).description }, `${content.skills.get(id).name} (Circle ${w.circleOf(id)}) `, btn('Unforge', 'Forget this spell', () => note(w.unforge(id)))));
  const forge = el('details', { class: 'small' }, el('summary', {}, `Spellforge (${w.forgedIds.length}/${maxForged(p.level)} forged, up to Circle ${w.circleCap})`),
    el('p', { class: 'dim small' }, `Spell-ink in pack: ${w.inkCount}. A spell costs ink and gold by Circle (Circle 3: ${forgeCost(3).ink} ink, ${forgeCost(3).gold} gold); from Circle 5 each cast burns one ink with the Tabletop Rules on.`),
    btn(`Buy 3 spell-ink (${INK_PRICE * 3} gold)`, 'In town only', () => note(w.buyInk(3))),
    el('div', {}, arc, shape, elem, rider,
      btn('Forge', 'In town only', () => note(w.forge(arc.value as Arcanum, shape.value, elem.value as Element, rider.value)))),
    ...forged);

  // Kits
  const kitRows = KITS.map((k) => {
    const own = w.owns(k.id);
    const prof = w.proficient(k.id);
    return el('div', { class: 'small', title: k.text }, el('b', {}, k.name), el('span', { class: 'dim' }, ` ${k.passive}${prof ? '' : ' (not proficient)'} `),
      own ? btn(`Work (${k.stat.toUpperCase()}): ${'gold' in k.makes ? 'coin' : k.makes.name}`, k.text, () => note(w.work(k.id))) : btn(`Buy ${k.price}g`, k.text, () => note(w.buyKit(k.id))),
      prof ? el('span', {}) : btn(`Train ${KIT_TRAIN_PRICE}g`, 'A day with a master', () => note(w.train(k.id))));
  });
  const kits = el('details', { class: 'small' }, el('summary', {}, `Kits (${KITS.filter((k) => w.owns(k.id)).length}/${KITS.length} owned)`), ...kitRows);

  // Hireling
  const h = w.hired;
  const hireBody = h
    ? [el('p', { class: 'small' }, `${h.def.name}, level ${h.level}, morale ${h.morale}. Wage ${w.wage(h.level)} gold a day. ${h.def.perk}.${h.morale < HIRELING.moraleLow ? ' Low spirits halve the help.' : ''}`), btn('Dismiss', 'Part on good terms', () => note(w.dismiss()))]
    : HIRELINGS.map((d) => el('div', { class: 'small', title: d.text }, el('b', {}, d.name), el('span', { class: 'dim' }, ` ${d.perk} `), btn(`Hire ${d.hire}g`, d.text, () => note(w.hire(d.id)))));
  const hire = el('details', { class: 'small' }, el('summary', {}, h ? `Retainer: ${h.def.name} (level ${h.level})` : 'Hirelings'), ...hireBody);

  // Holdings (item 221)
  const gr = s.grace;
  const holdRows = gr.mine().map((h) => {
    const lvl = gr.levelOf(h.classId);
    const why = gr.why(h.classId);
    const next = lvl < 3 ? h.costs[lvl] : undefined;
    return el('div', { class: 'small', title: h.text }, el('b', {}, h.name), el('span', { class: 'dim' }, ` level ${lvl}/3 · ${h.perk} `),
      lvl >= 3 ? el('span', { class: 'dim' }, 'complete') : btn(`${lvl === 0 ? 'Build' : 'Raise'} (${next ? `${next[0]}g ${next[1]}t ${next[2]}s` : ''})`, why ?? h.text, () => note(gr.build(h.classId)), why !== undefined));
  });
  const holds = el('details', { class: 'small' }, el('summary', {}, `Holdings in Emberfall (${gr.mine().reduce((n, h) => n + gr.levelOf(h.classId), 0)} levels)`), ...(holdRows.length ? holdRows : [el('p', { class: 'dim small' }, 'None of your classes has a hall here yet.')]));

  return [foldPanel(el('section', { class: 'panel' }, el('h3', {}, 'The Workbench'), forge, kits, hire, holds), `${w.forgedIds.length} forged · ${KITS.filter((k) => w.owns(k.id)).length} kits${h ? ` · ${h.def.name}` : ''}`)];
}
