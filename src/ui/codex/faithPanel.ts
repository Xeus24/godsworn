import { content } from '../../data';
import { EXAM, GIFTS, PROPHECIES, SPARKS, WAGERS, WAGER_ODDS, hybridName } from '../../data/faith';
import { DIVINE_SEASONS } from '../../data/pilgrimage';
import { favorOf } from '../../engine/gods/devotion';
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

const section = (title: string, ...body: (HTMLElement | undefined)[]): HTMLElement => {
  const d = el('details', { open: '' }, el('summary', {}, title), ...body.filter((x): x is HTMLElement => !!x));
  return d;
};

/** Items 36, 39, 42, 48 and 52, in one tab. */
export function faithPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const f = s.faith.f;
  const god = (open.god ??= s.faith.wagerGods()[0] as string);
  const gods = s.faith.wagerGods();
  const pick = (value: string, set: (v: string) => void, label: string): HTMLSelectElement => {
    const sel = el('select', { 'aria-label': label }) as HTMLSelectElement;
    for (const g of gods) sel.append(el('option', { value: g }, content.gods.get(g).name));
    sel.value = value;
    sel.addEventListener('change', () => { set(sel.value); rerender(); });
    return sel;
  };

  // 36
  const wager = section(`Divine Wagers (${f.wins} won, ${f.losses} lost)`,
    el('p', { class: 'dim small' }, 'Stake favor on your next fight. Win and the god pays by their temper (Vex pays most); lose and they keep it.'),
    f.wager ? el('p', { class: 'small' }, `A wager of ${f.wager.stake} favor stands with ${content.gods.get(f.wager.god).name}.`) : undefined,
    el('div', { class: 'row wrap' }, pick(god, (v) => (open.god = v), 'God'), ...WAGERS.stakes.map((n) => act(`Stake ${n}`, () => s.faith.placeWager(god, n), open, rerender, !!f.wager || favorOf(s.player, god) < n)), el('span', { class: 'dim small' }, ` favor ${Math.floor(favorOf(s.player, god))}, pays ×${WAGER_ODDS[god]}`)));

  // 39
  const sparkRow = DIVINE_SEASONS.filter((d) => (f.sparks[d.god] ?? 0) > 0).map((d) => `${content.gods.get(d.god).name} ${f.sparks[d.god]}`).join(', ') || 'none yet';
  const a = (open.sparkA ??= DIVINE_SEASONS[0]!.god);
  const b = (open.sparkB ??= DIVINE_SEASONS[1]!.god);
  const spark = section(`Godspark Crafting (${f.hybrids.length} of ${SPARKS.max} burning)`,
    el('p', { class: 'dim small' }, `A spark is struck every ${SPARKS.every} favor. Fuse one spark from each of two gods into a hybrid blessing. Sparks: ${sparkRow}.`),
    ...f.hybrids.map((key) => { const [x, y] = key.split('+') as [string, string]; return el('div', { class: 'row wrap small' }, hybridName(x, y), act('Quench', () => s.faith.quench(key), open, rerender)); }),
    el('div', { class: 'row wrap' }, pick(a, (v) => (open.sparkA = v), 'First god'), pick(b, (v) => (open.sparkB = v), 'Second god'), act('Fuse', () => s.faith.fuse(a, b), open, rerender)));

  // 42
  const prophecy = section('Prophecy Scrolls',
    el('p', { class: 'dim small' }, 'A seer in any town sells scrolls. If it comes true in time, it pays three times what you paid.'),
    ...f.prophecies.filter((p) => p.state === 'open').map((p) => { const pr = s.faith.progress(p); return el('div', { class: 'small' }, `${PROPHECIES.find((x) => x.id === p.id)!.text} (${pr.have}/${pr.need}, by day ${p.deadline})`); }),
    el('h4', {}, 'On offer today'),
    ...s.faith.offered().map((p) => el('div', { class: 'row wrap small' }, act(`Buy (${p.cost} gold)`, () => s.faith.take(p.id), open, rerender), p.text)),
    el('p', { class: 'dim small' }, `Fulfilled: ${f.prophecies.filter((p) => p.state === 'true').length} · broken: ${f.prophecies.filter((p) => p.state === 'false').length}`));

  // 48
  const ex = (open.exam ??= { god: gods[0] as string, attempt: 0, answers: [] });
  const qs = s.faith.questions(ex.god, ex.attempt);
  const exam = section(`Divine Exams (${Object.values(f.exams).filter((n) => n >= EXAM.pass).length} of ${DIVINE_SEASONS.length} passed)`,
    el('p', { class: 'dim small' }, `Five questions on a god, from the Pantheon’s own lore. ${EXAM.pass} right passes (+${EXAM.favor} favor and gold, once).`),
    pick(ex.god, (v) => { ex.god = v; ex.answers = []; }, 'Exam god'),
    ...qs.map((q, i) => el('div', { class: 'small' }, `${i + 1}. ${q.text} `, ...q.options.map((o, j) => { const bt = el('button', { type: 'button', class: ex.answers[i] === j ? 'active' : '' }, o); bt.addEventListener('click', () => { ex.answers[i] = j; rerender(); }); return bt; }))),
    act('Hand it in', () => { const r = s.faith.sit(ex.god, ex.answers, ex.attempt); ex.attempt++; ex.answers = []; return r; }, open, rerender, ex.answers.filter((x) => x !== undefined).length < qs.length));

  // 52
  const town = s.world.inTown();
  const v = town ? s.faith.visitor(town) : undefined;
  const met = v ? f.met.includes(v.key) : false;
  const visitors = section('Gods in Disguise',
    el('p', { class: 'dim small' }, 'Now and then a god walks a town as a stranger. Offer the thing they love most for a boon; guess wrong and they leave unimpressed.'),
    !town ? el('p', { class: 'dim small' }, 'Go to a town.') : !v ? el('p', { class: 'small' }, 'No stranger is about today.') : met ? el('p', { class: 'small' }, 'You have met today’s stranger.') : el('div', {}, el('p', { class: 'small' }, `${v.guise[0]?.toUpperCase()}${v.guise.slice(1)} watches you from a doorway.`), el('div', { class: 'row wrap' }, ...GIFTS.map((g) => act(`Offer ${g}`, () => s.faith.offerGift(g), open, rerender)))),
    f.boon && f.boon.until >= s.state.clock.day ? el('p', { class: 'small' }, `A boon of ${content.gods.get(f.boon.god).name} lasts to day ${f.boon.until}.`) : undefined);

  return el('div', {}, wager, spark, prophecy, exam, visitors, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
