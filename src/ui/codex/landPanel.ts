import { content } from '../../data';
import { BAZAAR, BROKEN_RELICS, EXCAVATION, HEIRLOOM, RESTORATION } from '../../data/relicsLand';
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
const section = (title: string, ...body: (HTMLElement | undefined)[]): HTMLElement => el('details', { open: '' }, el('summary', {}, title), ...body.filter((x): x is HTMLElement => !!x));

/** Items 37, 38, 46, 53 and 58: heirlooms, the Bazaar, buried temples, broken relics and statues. */
export function landPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const r = s.relics.r;
  const heirlooms = section(`Cursed Heirlooms (${s.relics.heirlooms().filter((x) => x.lifted).length} lifted)`,
    el('p', { class: 'dim small' }, `They turn up as you grow. Carry one (up to ${HEIRLOOM.carry}) and its curse bites; finish its deed and it becomes a Legendary.`),
    ...(s.relics.heirlooms().length ? s.relics.heirlooms().map((x) => el('div', { class: 'small' },
      el('b', {}, x.def.name), ` ${x.lifted ? '(lifted)' : x.carried ? '(carried, cursed)' : ''} `, el('span', { class: 'dim' }, `${x.def.text} ${x.def.task.text} ${x.lifted ? '' : `(${x.have}/${x.def.task.count})`}`),
      x.lifted ? '' : act(x.carried ? 'Set down' : 'Carry', () => s.relics.carry(x.def.id, !x.carried), open, rerender))) : [el('p', { class: 'dim small' }, 'None yet.')]));
  const restoration = section(`Relic Restoration (${r.restored.length} of ${BROKEN_RELICS.length} whole)`,
    el('p', { class: 'dim small' }, `Shards fall from champions and bosses and out of buried temples. ${RESTORATION.shards} shards and gold mend a relic for good.`),
    ...BROKEN_RELICS.map((x) => el('div', { class: 'row wrap small' }, el('b', {}, x.name), r.restored.includes(x.id) ? ' (whole)' : ` ${r.shards[x.id] ?? 0}/${RESTORATION.shards}`, r.restored.includes(x.id) ? '' : act('Mend', () => s.relics.restore(x.id), open, rerender, (r.shards[x.id] ?? 0) < RESTORATION.shards))));
  const here = s.world.zone.id;
  const sites = s.relics.sites();
  const excavation = section(`Ruins Excavation (${r.temples.length} of ${sites.length} restored)`,
    el('p', { class: 'dim small' }, `Dig in a region: ${EXCAVATION.digs} digs (${EXCAVATION.digGold} gold and an hour each) bring a temple back, with favor, a permanent gift and maybe a shard.`),
    ...sites.map((x) => el('div', { class: 'row wrap small' }, x.name, r.temples.includes(x.id) ? ' ✓' : ` ${r.dug[x.id] ?? 0}/${EXCAVATION.digs}`, r.temples.includes(x.id) ? '' : act('Dig', () => s.relics.dig(x.id), open, rerender, x.zone !== here))));
  const zones = content.zones.all().filter((z) => !z.ngPlus);
  const statues = section(`Hero Statues (${r.statues.length})`,
    el('p', { class: 'dim small' }, 'Raise a statue in a town of a region. While you are anywhere in that region, it buffs you.'),
    ...zones.map((z) => el('div', { class: 'row wrap small' }, z.name, ` ${s.relics.statueBuff(z.id).name}`, r.statues.includes(z.id) ? ' ✓' : act(`Raise (${s.relics.statueCost(z.id)} gold)`, () => s.relics.raiseStatue(z.id), open, rerender, z.id !== here))));
  const stock = s.relics.bazaarStock();
  const bazaar = section('The Wandering Bazaar',
    el('p', { class: 'dim small' }, `A market that exists only in ${BAZAAR.weather}, on the open road, and is gone with the light.`),
    s.relics.bazaarOpen() ? el('div', {}, ...stock.map((g) => el('div', { class: 'row wrap small' }, g.name, act(r.bought.includes(g.key) ? 'Sold' : `Buy (${g.price})`, () => s.relics.buyBazaar(g.key), open, rerender, r.bought.includes(g.key))))) : el('p', { class: 'small' }, 'The fog is not in. Walk the road when it is.'));
  return el('div', {}, heirlooms, restoration, excavation, statues, bazaar, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
