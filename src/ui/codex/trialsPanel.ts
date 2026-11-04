import { content } from '../../data';
import { DIVING, FEARS, HUNTS, ISLANDS, QUARRIES, SKY, TILTS, TOURNAMENT, WRECKS, type Tilt } from '../../data/trials';
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

/** Items 43, 54, 55, 56 and 57: tournaments, dreams, hunts, wrecks and the Sky Islands. */
export function trialsPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const t = s.trials.t;
  const tour = s.trials.tournamentOpen();
  const tournament = section(`Duel Tournaments (${t.tournament.champion.length} won, ${t.tournament.rounds} rounds)`,
    el('p', { class: 'dim small' }, `Once a year, on the festival of the Hundred Duels, eight rival heroes meet in a bracket of ${TOURNAMENT.rounds} rounds. Win it for the title and a purse.`),
    act('Enter the bracket', () => s.trials.enterTournament(), open, rerender, !tour.ok), tour.ok ? '' : el('span', { class: 'dim small' }, ` ${(tour as { reason: string }).reason}`));
  const recruited = new Set(s.trials.recruited());
  const dreams = section(`Dreamscape Dungeons (${Object.values(t.dreams).filter((n) => n > 0).length} of ${FEARS.length})`,
    el('p', { class: 'dim small' }, 'Enter a companion’s worst dream in a town’s inn: four fights of what they fear. Beating it brings them peace, approval and a little more resolve for you.'),
    ...FEARS.map((f) => el('div', { class: 'row wrap small' }, el('b', {}, content.companions.get(f.companion).name), ` ${f.fear}: ${f.text} `, act((t.dreams[f.companion] ?? 0) > 0 ? 'Again' : 'Enter', () => s.trials.enterDream(f.companion), open, rerender, !recruited.has(f.companion)))));
  const moon = s.trials.bloodMoon();
  const hunts = section(`Moon-Blood Hunts (${Object.values(t.hunts).filter((n) => n > 0).length} of ${QUARRIES.length})`,
    el('p', { class: 'dim small' }, `Twelve quarries walk only under a Blood Moon (level ${HUNTS.minLevel}+). ${moon ? 'The moon is red.' : 'The moon is not red.'}`),
    ...QUARRIES.map((q) => el('div', { class: 'row wrap small' }, el('b', {}, q.name), ` ${q.text} (${t.hunts[q.id] ?? 0}) `, act('Hunt', () => s.trials.startHunt(q.id), open, rerender, !moon))));
  const d = t.dives.active;
  const here = s.trials.wrecksHere();
  const diving = section(`Shipwreck Diving (${Object.values(t.dives.best).filter((n) => n > 0).length} of ${WRECKS.length})`,
    el('p', { class: 'dim small' }, `Dive on wrecks off the regions you visit (level ${DIVING.minLevel}+). You have ${DIVING.air} breaths: shallow searches are safe and small, deep ones cost two and risk the haul.`),
    ...(d ? [el('p', { class: 'small' }, `${WRECKS.find((w) => w.id === d.wreck)!.name}: ${d.air} breaths, haul ${d.haul} gold.`), ...d.log.slice(-3).map((l) => el('p', { class: 'dim small' }, l)), el('div', { class: 'row wrap' }, act('Search the shallows', () => s.trials.diveStep('shallow'), open, rerender), act('Search the hold (2 breaths)', () => s.trials.diveStep('deep'), open, rerender), act('Surface', () => s.trials.diveStep('surface'), open, rerender))] : here.length ? here.map((w) => el('div', { class: 'row wrap small' }, el('b', {}, w.name), ` ${w.text} best ${t.dives.best[w.id] ?? 0} `, act('Dive', () => s.trials.startDive(w.id), open, rerender))) : [el('p', { class: 'dim small' }, 'No wreck lies off this region.')]));
  const seq = (open.tilts ??= []);
  const sky = section(`Sky Islands (${ISLANDS.filter((i) => t.islands[i.id]?.solved).length} of ${ISLANDS.length})`,
    el('p', { class: 'dim small' }, s.trials.skyOpen() ? `Each island leans through ${SKY.steps} tilts; choose the sequence. Every failure reveals one more step.` : 'Only an airship can reach the Sky Islands.'),
    el('div', { class: 'row wrap' }, ...TILTS.map((x) => act(x, () => { if (seq.length < SKY.steps) seq.push(x); }, open, rerender)), act('Clear', () => { open.tilts = []; }, open, rerender), el('span', { class: 'small' }, `Chosen: ${seq.join(' → ') || 'none'}`)),
    ...ISLANDS.map((i) => el('div', { class: 'small' }, el('b', {}, i.name), ` (level ${i.minLevel}) ${i.text} `, t.islands[i.id]?.solved ? '✓' : [...s.trials.hint(i.id)].join(' '), t.islands[i.id]?.solved ? '' : act('Land', () => { const r = s.trials.tryIsland(i.id, seq as Tilt[]); if (r.ok) open.tilts = []; return r; }, open, rerender, !s.trials.skyOpen() || seq.length !== SKY.steps))));
  return el('div', {}, tournament, dreams, hunts, diving, sky, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
