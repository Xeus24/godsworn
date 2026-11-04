import { content } from '../../data';
import { LETTER_KINDS, MOODS, MOOD_POWER, MORALE, OATH_STAGES, WOUNDS } from '../../data/fellowship';
import { DIVINE_SEASONS } from '../../data/pilgrimage';
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

/** Items 68, 69, 75, 84, 85 and 86: moods, the mailbox, companion oaths, morale, wounds and the journal. */
export function fellowshipPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const fw = s.fellowship;
  const f = fw.f;
  const moods = section(`Divine Moods (blessings ${fw.moodPower() >= 0 ? '+' : ''}${fw.moodPower()}%)`,
    el('p', { class: 'dim small' }, 'Each god’s mood moves with your standing, the season, the Pantheon’s feuds and your oaths. It shifts blessing strength by up to ±20%.'),
    el('div', { class: 'row wrap small' }, ...DIVINE_SEASONS.map((d) => { const i = fw.moodIndex(d.god); return el('span', { class: 'chip', title: `${MOOD_POWER[i]}% blessing power` }, `${content.gods.get(d.god).name}: ${MOODS[i]}`); })));
  const unread = f.letters.filter((l) => !l.read).length;
  const mail = section(`Camp Mailbox (${f.letters.length}, ${unread} unread)`,
    el('p', { class: 'dim small' }, `Gods write when you reach a milestone with them: ${LETTER_KINDS.join(', ')}. In the Twilight arc the letters fray.`),
    ...(f.letters.length ? [...f.letters].reverse().map((l) => el('div', { class: 'small' }, el('b', {}, `${content.gods.get(l.god).name}${l.read ? '' : ' (new)'}`), ` ${fw.letterText(l.god, l.kind)} `, l.read ? '' : act('Mark read', () => fw.read(l.id), open, rerender))) : [el('p', { class: 'dim small' }, 'No letters yet.')]));
  const comps = Object.values(s.state.party.companions);
  const oaths = section('Companion Oaths',
    el('p', { class: 'dim small' }, 'Each companion is sworn to a god. When that god’s mood sours, they doubt, argue, and may leave for a few days.'),
    ...comps.map((c) => { const def = content.companions.get(c.id); const st = f.oaths[c.id]; return el('div', { class: 'small' }, `${def.name} (${content.gods.get(def.god).name}, ${fw.mood(def.god)}): ${st && st.stage > 0 ? OATH_STAGES[st.stage - 1]!.label : 'steady'}${st?.returns ? ` — away till day ${st.returns}` : ''}`); }),
    ...(comps.length ? [] : [el('p', { class: 'dim small' }, 'No companions yet.')]));
  const morale = section(`Party Morale: ${Math.round(f.morale)} (${fw.moraleBand()})`,
    el('div', { class: 'meter' }, el('div', { class: 'fill', style: `width:${Math.round(f.morale)}%` })),
    el('p', { class: 'dim small' }, `Victories and festivals raise it; defeats, fleeing and grim news drain it. Above ${MORALE.high}: +5% damage and XP. Below ${MORALE.low}: −5% damage; below ${MORALE.broken}: worse, and the banter turns sour.`));
  const wounds = section(`Lingering Wounds (${f.wounds.length})`,
    el('p', { class: 'dim small' }, 'A bad defeat can leave a wound. Rest heals it in three days; a temple or herbalist heals it now, for gold.'),
    ...f.wounds.map((w) => { const d = WOUNDS.find((x) => x.id === w.id)!; return el('div', { class: 'row wrap small' }, el('b', {}, d.name), ` ${d.text} (heals by day ${w.until}) `, act('Temple', () => fw.heal(w.id, 'temple'), open, rerender), act('Herbalist', () => fw.heal(w.id, 'herbalist'), open, rerender)); }),
    ...(f.wounds.length ? [] : [el('p', { class: 'dim small' }, 'None.')]));
  const journal = section(`The Godsworn Journal (${f.journal.length})`,
    ...f.journal.slice(0, 30).map((j) => el('p', { class: 'small' }, el('span', { class: 'dim' }, `Day ${j.day}: `), j.text)),
    ...(f.journal.length ? [] : [el('p', { class: 'dim small' }, 'Nothing written yet.')]));
  return el('div', {}, moods, mail, oaths, morale, wounds, journal, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
