import { content } from '../../data';
import { DIVINE_SEASONS, SEASONS, SPLITS, VEX_CODES } from '../../data/pilgrimage';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import type { RealmView } from './realmPanel';

const clock = (ms: number): string => {
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

function btn(label: string, run: () => void, disabled = false): HTMLButtonElement {
  const b = el('button', { type: 'button' }, label) as HTMLButtonElement;
  b.disabled = disabled;
  b.addEventListener('click', run);
  return b;
}

/** Item 29: which god is ascendant, what it does, and the pilgrimage checklist. */
export function seasonsPanel(s: GameSession): HTMLElement {
  const sn = s.pilgrimage.season;
  const tasks = s.pilgrimage.seasonProgress();
  return el('div', {},
    el('p', { class: 'dim small' }, `One god is ascendant for ${SEASONS.days} days at a time; all ${DIVINE_SEASONS.length} take their turn each year. Finish the checklist for gold and favor.`),
    el('h3', {}, `${sn.def.name}: ${content.gods.get(sn.def.god).name} (${sn.daysLeft} day${sn.daysLeft === 1 ? '' : 's'} left)`),
    el('p', { class: 'small' }, sn.def.text),
    el('h3', {}, 'Pilgrimage'),
    ...tasks.map((t) => el('div', { class: 'small' }, `${t.have >= t.count ? '✓' : '○'} ${t.text}: ${t.have} of ${t.count}`)),
    el('p', { class: 'dim small' }, `Pilgrimages completed: ${s.state.realm.pilgrimage.completed} of ${DIVINE_SEASONS.length}${s.state.realm.pilgrimage.season.paid ? ' · this one is paid' : ''}`),
    el('h3', {}, 'The cycle'),
    el('div', { class: 'small dim' }, DIVINE_SEASONS.map((d) => content.gods.get(d.god).name).join(' → ')));
}

/** Item 31: fifty fun rules. */
export function omensPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const on = new Set(s.pilgrimage.active());
  return el('div', {},
    el('p', { class: 'dim small' }, 'Omens are rules you choose for fun. Fair omens only make the world harder or stranger; any other switches achievements off while it is on.'),
    ...(s.pilgrimage.achievementsOff() ? [el('p', { class: 'small' }, 'Achievements are off for now.')] : []),
    ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []),
    el('div', {}, ...s.pilgrimage.omenDefs().map((d) => el('div', { class: 'row wrap small' },
      btn(`${on.has(d.id) ? '✓ ' : ''}${d.name}`, () => { const r = s.pilgrimage.toggleOmen(d.id); open.outcome = r.ok ? (r.text ?? '') : r.reason; rerender(); }),
      el('span', { class: 'dim' }, `${d.fair ? '[fair] ' : ''}${d.text}`)))));
}

/** Item 32: timer, splits, the 100% tracker and the Vex Codes. */
export function toolsPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const p = s.state.realm.pilgrimage;
  const input = el('input', { type: 'text', placeholder: 'A Vex Code', 'aria-label': 'Vex Code' }) as HTMLInputElement;
  return el('div', {},
    el('h3', {}, `Speedrun timer: ${clock(s.state.meta.playTimeMs)}`),
    ...SPLITS.map((sp) => el('div', { class: 'small' }, `${sp.name}: ${p.splits[sp.id] !== undefined ? clock(p.splits[sp.id] as number) : '—'}`)),
    el('h3', {}, `100% tracker: ${s.pilgrimage.completionPct()}%`),
    el('p', { class: 'dim small' }, 'The full list is under Codex > Completion.'),
    el('h3', {}, 'Vex Codes'),
    el('p', { class: 'dim small' }, s.pilgrimage.codesOpen() ? `Vex whispers ${VEX_CODES.length} codes. Using one switches achievements off for this save. Spent: ${p.codes.length}.` : 'Finish the story once and Vex will whisper to you.'),
    el('div', { class: 'row wrap' }, input, btn('Enter', () => { const r = s.pilgrimage.enterCode(input.value); open.outcome = r.ok ? (r.text ?? '') : r.reason; rerender(); }, !s.pilgrimage.codesOpen())),
    ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}

/** Item 34: every ending. */
export function fatesPanel(s: GameSession): HTMLElement {
  const fates = s.pilgrimage.fates();
  return el('div', {},
    el('p', { class: 'dim small' }, `${fates.filter((f) => f.reached).length} of ${fates.length} endings reached across all your playthroughs. One of them can be reached in the first ten minutes.`),
    ...fates.map((f) => el('div', { class: 'small' }, f.reached ? el('span', {}, el('b', {}, f.name), ` ✓`) : el('span', { class: 'dim' }, `??? ${f.hint}`))));
}
