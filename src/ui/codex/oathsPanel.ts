import { CIPHER, FORSWORN, KING_LINES, LINEAGE_PAGES, LINEAGE_ZONES, OATHCRAFT, SCARS, VOW_CONDITIONS, VOW_REWARDS } from '../../data/oaths';
import { content } from '../../data';
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
const section = (title: string, ...body: (HTMLElement | string)[]): HTMLElement => el('details', { open: '' }, el('summary', {}, title), ...body);

/** Items 61-65 and 67: Caerith, the Lineage, the Cipher, Oathcraft and the Forsworn Path. */
export function oathsPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const o = s.oaths.o;
  const frags = s.oaths.fragments();
  const caerith = section(`Caerith the Unremembered (${frags.filter((f) => f.open).length} of ${frags.length})`,
    el('p', { class: 'dim small' }, 'A god of Oaths, taken out of every record. What is known of her opens as you find the pages of the Unsworn King’s oath, read the cipher, set the Orrery right, walk the Sundered Hours, and listen to the Echoes and the Chronicle.'),
    ...frags.map((f) => f.open ? el('p', { class: 'small' }, el('b', {}, f.frag.title), ` ${f.frag.text}`) : el('p', { class: 'dim small' }, `??? (${f.have}/${f.frag.need} ${f.frag.source})`)));
  const pages = s.oaths.pagesFound();
  const lineage = section(`The Unsworn Lineage (${pages.length} of ${LINEAGE_PAGES.length} pages)`,
    el('p', { class: 'dim small' }, 'Sixteen pages of the Unsworn King’s broken oath lie in sixteen regions, each with the second puzzle chest there. Reading them changes what he says.'),
    ...pages.map((p) => el('p', { class: 'small' }, `${content.zones.get(p.zone).name}: “${p.text}”`)),
    el('h4', {}, 'His words'),
    ...(s.oaths.kingLines().length ? s.oaths.kingLines().map((l) => el('p', { class: 'small' }, l)) : [el('p', { class: 'dim small' }, `Nothing yet (${KING_LINES.length} lines wait).`)]),
    el('p', { class: 'dim small' }, `Regions with a page: ${LINEAGE_ZONES.map((z) => content.zones.get(z).name).join(', ')}.`));
  const cipher = section(`The Unsworn Cipher (${s.oaths.cipherSymbols()} of ${CIPHER.symbols})`,
    el('p', { class: 'dim small' }, 'One symbol is hidden in each secret you find. Whole, the cipher points to Caerith’s resting place, opens a hidden birth sign for new heroes, and is needed for the Unsworn Ending.'),
    el('p', { class: 'small' }, o.cipher ? 'The cipher is whole. It ends at a door in the Hollow Barrows with no handle.' : 'It is not yet whole.'));

  const cond = (open.vowCond ??= VOW_CONDITIONS[0]!.id);
  const reward = (open.vowReward ??= VOW_REWARDS[0]!.id);
  const pick = <T extends { id: string }>(items: T[], value: string, label: (t: T) => string, set: (v: string) => void, aria: string): HTMLSelectElement => {
    const sel = el('select', { 'aria-label': aria }) as HTMLSelectElement;
    for (const it of items) sel.append(el('option', { value: it.id }, label(it)));
    sel.value = value;
    sel.addEventListener('change', () => { set(sel.value); rerender(); });
    return sel;
  };
  const standing = o.vows.filter((v) => v.status === 'standing');
  const oathcraft = section(`Oathcraft (${o.kept} kept, ${o.broken} broken)`,
    el('p', { class: 'dim small' }, `Write your own vow from a condition and a reward (up to ${OATHCRAFT.max} at once). Keep it to the end of a stretch of the story for an Oath Title; break it and you take a Scar.`),
    ...standing.map((v) => el('div', { class: 'row wrap small' }, `${VOW_CONDITIONS.find((c) => c.id === v.cond)!.text} (${VOW_REWARDS.find((r) => r.id === v.reward)!.text})`, act('Put it down', () => s.oaths.forget(v.id), open, rerender))),
    el('div', { class: 'row wrap' }, pick(VOW_CONDITIONS, cond, (c) => c.text, (v) => (open.vowCond = v), 'Vow'), pick(VOW_REWARDS, reward, (r) => r.text, (v) => (open.vowReward = v), 'Reward'), act('Swear', () => s.oaths.swear(cond, reward), open, rerender)));

  const scars = section(`The Forsworn Path (${o.scars.length} of ${SCARS.length} Scars${s.oaths.forsworn() ? ', Forsworn' : ''})`,
    el('p', { class: 'dim small' }, `Breaking a vow, abandoning a god or driving a companion away leaves a Scar. At ${FORSWORN.scars} you are Forsworn: the gods of light will not hear you. Each Scar is a small cost and a Rite: ready one before a fight for a battle’s worth of strength.`),
    ...o.scars.map((id) => { const sc = SCARS.find((x) => x.id === id)!; return el('div', { class: 'row wrap small' }, el('b', {}, sc.name), ` ${sc.text} `, act(o.ready === id ? `Readied: ${sc.rite.name}` : `Ready ${sc.rite.name}`, () => s.oaths.ready(o.ready === id ? undefined : id), open, rerender)); }),
    ...(o.scars.length ? [] : [el('p', { class: 'dim small' }, 'None.')]));
  return el('div', {}, caerith, lineage, cipher, oathcraft, scars, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
