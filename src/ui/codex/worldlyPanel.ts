import { content } from '../../data';
import { GOODS, RUMORS, TABLETS, TONGUES, WINGS } from '../../data/worldly';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import type { RealmView } from './realmPanel';

type R = { ok: boolean; reason?: string; text?: string };

function act(label: string, run: () => R | void, open: RealmView, rerender: () => void, disabled = false): HTMLButtonElement {
  const b = el('button', { type: 'button' }, label) as HTMLButtonElement;
  b.disabled = disabled;
  b.addEventListener('click', () => {
    const r = run();
    open.outcome = r ? (r.ok ? (r.text ?? '') : (r.reason ?? '')) : '';
    rerender();
  });
  return b;
}
const section = (title: string, ...body: (HTMLElement | string)[]): HTMLElement => el('details', {}, el('summary', {}, title), ...body);

/** Items 88, 89, 93, 94, 97 and 98: the almanac, rumors, trade, the museum, tablets and dreams. */
export function worldlyPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const w = s.worldly;
  const town = s.world.inTown();
  const alm = w.almanac();
  const almanac = section(`The Calendar of Vael (${alm.length} turns of fortune)`,
    el('p', { class: 'dim small' }, 'Years pass on top of the Wheel. Townspeople marry, retire, move away, have children and, in time, die.'),
    ...(alm.length ? alm.slice(0, 12).map((a) => el('p', { class: 'small' }, el('span', { class: 'dim' }, `Year ${a.year}: `), a.text)) : [el('p', { class: 'dim small' }, 'Nothing yet: the first year is quiet.')]));
  const tpl = (open.rumor ??= RUMORS[0]!.id);
  const sel = el('select', { 'aria-label': 'Rumor' }) as HTMLSelectElement;
  for (const r of RUMORS) sel.append(el('option', { value: r.id }, r.text.length > 70 ? `${r.text.slice(0, 68)}…` : r.text));
  sel.value = tpl;
  sel.addEventListener('change', () => { open.rumor = sel.value; rerender(); });
  const rumors = section(`The Rumor Mill (${s.state.realm.marvels.worldly?.rumors.length ?? 0} loose)`,
    el('p', { class: 'dim small' }, 'Plant a rumor with a Charisma roll. It moves from town to town, and by the fourth telling it has grown. Market rumors really do move prices.'),
    ...(s.state.realm.marvels.worldly?.rumors ?? []).map((r) => el('p', { class: 'small' }, `${w.text(r)} (${r.reached.length} towns)`)),
    el('div', { class: 'row wrap' }, sel, act('Plant it', () => w.plant(tpl), open, rerender, !town)));
  const trade = section(`Trade Winds (${w.held()}/${w.capacity()} in the hold, profit ${w.w.profit})`,
    el('p', { class: 'dim small' }, 'Every town pays its own price. Buy cheap, haul it (a ship or airship carries more) and sell dear.'),
    ...GOODS.map((g) => { const q = town ? w.quote(town, g.id) : 0; const have = w.w.cargo[g.id]?.qty ?? 0; return el('div', { class: 'row wrap small' }, el('b', {}, g.name), town ? ` here ${q} gold. ` : ' ', `held ${have} `, act('Buy 5', () => w.buyGood(g.id, 5), open, rerender, !town), act('Sell all', () => w.sellGood(g.id, have), open, rerender, !town || !have)); }));
  const museum = section(`The Grand Museum (${w.w.museum.claimed.length} of ${WINGS.length} wings)`,
    el('p', { class: 'dim small' }, `The Collector’s museum in ${content.towns.get('aurelane').name}. Fill a wing to claim its relic.`),
    ...WINGS.map((wg) => el('div', { class: 'row wrap small' }, el('b', {}, wg.name), ` ${w.progress(wg.id)}/${wg.target} · ${wg.text} `, w.w.museum.claimed.includes(wg.id) ? `✓ ${wg.relic.name}` : act(`Claim ${wg.relic.name}`, () => w.claim(wg.id), open, rerender, w.progress(wg.id) < wg.target))),
    ...w.donatable().slice(0, 12).map((d) => el('div', { class: 'row wrap small' }, d.name, act('Donate', () => w.donate(d.id), open, rerender))));
  const here = s.world.zone.id;
  const tablets = section(`Lost Tongues (${w.w.tablets.length} of ${TABLETS.length}; you read ${w.tongueTier() ? TONGUES[w.tongueTier() - 1] : 'none'})`,
    el('p', { class: 'dim small' }, 'Read Ancient Script opens four dialects, from Old Vaelic to the Godstongue. Each region has a tablet in one of them.'),
    ...TABLETS.map((t) => el('div', { class: 'row wrap small' }, `${content.zones.get(t.zone).name}: ${TONGUES[t.tier - 1]} `, w.w.tablets.includes(t.zone) ? '✓' : act('Read', () => w.decipher(t.zone), open, rerender, t.zone !== here))));
  const d = w.describe();
  const dreams = section(`Lyssara’s Dreams (${w.w.dreams} dreamed, ${w.w.shards} shards)`,
    d && !w.w.dream?.done ? el('div', {}, el('p', { class: 'small' }, d.text), act(d.kind === 'battle' ? 'Face it' : 'Take it to heart', () => w.resolveDream(), open, rerender)) : el('p', { class: 'dim small' }, 'Nothing lingers from last night.'));
  return el('div', {}, almanac, rumors, trade, museum, tablets, dreams, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
