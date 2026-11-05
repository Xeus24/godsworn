import { content } from '../../data';
import { COUNCIL, DISTRICTS, HALLS, JAILBREAKS, LAWS, RAIDERS } from '../../data/civic';
import { OUTFITS } from '../../data/road';
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
const fname = (id: string): string => content.factions.get(id).name;

/** Items 90, 91, 92, 95 and 96: laws and crimes, disguises, the Crown Council, the Sundering and the sea and sky raiders. */
export function civicPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const c = s.civic.c;
  const town = s.world.inTown();
  const law = town ? s.civic.law(town) : undefined;
  const jail = c.jail;
  const cells = section(jail ? `The cells of ${content.towns.get(jail.town).name} (${jail.days} days)` : `Laws and Crimes (Wanted ${'★'.repeat(s.road.wantedLevel()) || 'none'}; ${c.arrests} arrests)`,
    el('p', { class: 'dim small' }, law ? `${content.towns.get(town!).name} is ruled by ${law.ruler}. ${law.legal.length ? `Legal here: ${law.legal.join(', ')}.` : 'Every crime is a crime here.'}` : 'Out on the road, the only law is whoever finds you.'),
    ...(jail
      ? [el('div', { class: 'row wrap' }, act(`Pay bail (${s.civic.bailCost()} gold)`, () => s.civic.payBail(), open, rerender), act('Serve the sentence', () => s.civic.serveTime(), open, rerender)),
        ...JAILBREAKS.map((j) => el('div', { class: 'row wrap small' }, el('b', {}, j.name), ` ${j.text} `, c.escapes.includes(j.id) ? '✓ ' : '', act('Try it', () => s.civic.escape(j.id), open, rerender)))]
      : [el('div', { class: 'row wrap' }, act('Pick a pocket', () => s.civic.pilfer(), open, rerender, !town), act(`Pay the fine (${s.road.fine()})`, () => s.road.payFine(), open, rerender, s.road.wantedLevel() < 1 || !town)),
        el('p', { class: 'dim small' }, `Ways out of the cells: ${JAILBREAKS.map((j) => `${j.name}${c.escapes.includes(j.id) ? ' ✓' : ''}`).join(', ')}.`)]));
  const worn = OUTFITS.find((x) => x.id === s.road.o.outfit);
  const disguises = section(`Disguises (${OUTFITS.length} outfits; wearing ${worn?.name ?? 'none'}; suspicion ${Math.round(s.road.townSuspicion())})`,
    el('p', { class: 'dim small' }, 'The right outfit walks past a faction’s guards. Any other has to be talked through, and a bad try is trespass.'),
    ...HALLS.map((h) => el('div', { class: 'row wrap small' }, el('b', {}, h.name), ` (${content.towns.get(h.town).name}, ${fname(h.faction)}) `, c.halls[h.faction] !== undefined ? '✓ ' : '', act('Slip in', () => s.civic.infiltrate(h.faction), open, rerender, town !== h.town || !s.civic.hallOpen(h.faction)))));
  const laws = s.civic.laws();
  const faction = (open.civicFaction ??= s.civic.factions()[0]!);
  const sel = el('select', { 'aria-label': 'Faction to back' }) as HTMLSelectElement;
  for (const f of s.civic.factions()) sel.append(el('option', { value: f }, fname(f)));
  sel.value = faction;
  sel.addEventListener('change', () => { open.civicFaction = sel.value; rerender(); });
  const inCap = town === 'aurelane';
  const council = section(`The Crown Council (ruled by ${fname(c.ruler)}; year ${c.year})`,
    el('p', { class: 'dim small' }, 'Each year the six districts of Aurelane vote. The faction with most seats writes five laws.'),
    ...LAWS.map((l, i) => el('p', { class: 'small' }, el('b', {}, `${l.name}: ${l.options[laws[i] ?? 1]!.name}. `), l.options[laws[i] ?? 1]!.text)),
    el('div', { class: 'row wrap' }, 'Back: ', sel),
    ...DISTRICTS.map((d) => {
      const top = s.civic.factions().map((f) => [f, s.civic.support(d.id, f)] as const).sort((a, b) => b[1] - a[1])[0]!;
      return el('div', { class: 'row wrap small' }, el('b', {}, d.name), ` ${d.text} Seat: ${c.seats[d.id] ? fname(c.seats[d.id]!) : 'none yet'}; leading: ${fname(top[0])} (${top[1]}). `,
        act('Canvass', () => s.civic.canvass(d.id, faction), open, rerender, !inCap), act('Call in a bond', () => s.civic.kindred(d.id, faction), open, rerender, !inCap), act(`Bribe (${s.civic.bribeCost()})`, () => s.civic.bribe(d.id, faction), open, rerender, !inCap));
    }),
    el('p', { class: 'dim small' }, `Canvassing needs Charisma; a Kindred Bond of rank ${COUNCIL.kindredRank} speaks for you; a bribe works and is a crime.`));
  const sd = c.sundering;
  const sundering = section(sd ? 'The Sundering (the Bell has rung)' : 'The Sundering',
    sd ? el('div', {}, ...Object.entries(sd.towns).map(([t, fate]) => el('div', { class: 'row wrap small' }, el('b', {}, content.towns.get(t).name), ` ${fate} `, fate === 'intact' ? '' : act(`Rebuild (${s.civic.rebuildCost(t)})`, () => s.civic.rebuild(t), open, rerender, town !== t)))) : el('p', { class: 'dim small' }, 'When the Sundering Bell rings, the Fortunes of every town and the businesses you built decide which stand, which are hurt and which fall.'));
  const raiders = section('Sea and Sky Grudgebound',
    ...RAIDERS.map((r) => {
      const st = s.civic.raider(r.id);
      return el('div', { class: 'row wrap small' }, el('b', {}, r.name), ` (${r.by}) `, st.slain !== undefined ? `slain. ${r.modText}` : `${st.scars} scars${st.hunting ? ', hunting you. ' : '. Defeats and flights at sea teach them your ship. '}`, st.slain === undefined ? act('Face them at the docks', () => s.civic.face(r.id), open, rerender, !st.hunting || town !== 'saltmere') : '');
    }));
  return el('div', {}, cells, disguises, council, sundering, raiders, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
