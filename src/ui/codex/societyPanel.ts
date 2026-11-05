import { content } from '../../data';
import { CLASS_RIVAL, CONJUNCTION, FORGED, MODULES, ORIGIN_SCENES, RIVAL_APOSTLES, SAINT } from '../../data/society';
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

/** Items 70, 71, 76, 78, 80 and 81: apostles, saints, origin rivals, modules, conjunctions and class rivals. */
export function societyPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const o = s.society.o;
  const conj = section(`Conjunctions (${o.vigils.length} vigils kept)`,
    el('p', { class: 'dim small' }, `Your sign aligns on day ${s.society.conjunctionDayOfSeason()} of each season. On that day you are stronger (+15% damage, +10% XP); keep the vigil for gold and a share of the sign’s gifts, for good (up to ${CONJUNCTION.maxVigils}).`),
    el('p', { class: 'small' }, s.society.conjunctionToday() ? 'The stars are in line today.' : 'Not today.'),
    act('Keep the vigil', () => s.society.keepVigil(), open, rerender, !s.society.conjunctionToday()));
  const rival = s.society.rivalFor();
  const rivals = section(`Class Rival${rival ? `: ${rival.name}, ${rival.title}` : ''}`,
    el('p', { class: 'dim small' }, 'A rival of your own class turns up at levels 10, 25, 40 and 60. Beat them for gold; the one who waits in the Duel Tournament final is the same.'),
    rival ? el('p', { class: 'small' }, rival.line) : el('p', { class: 'dim small' }, 'Your class has no rival.'),
    ...CLASS_RIVAL.milestones.map((m) => el('div', { class: 'row wrap small' }, `Level ${m}: ${o.rivals[String(m)] ?? 'waiting'}`, act('Duel', () => s.society.duelRival(m), open, rerender, !rival || !s.society.rivalOpen().includes(m)))));
  const scene = s.society.originScene();
  const fig = s.society.figure();
  const origin = section(`Origin Rival${fig ? `: ${fig.name}` : ''} (${Object.keys(o.origin.handled).length} of ${ORIGIN_SCENES.length} met)`,
    el('p', { class: 'dim small' }, 'A figure from your past turns up once each stretch of the story. One of them may be the one who set you up.'),
    ...(scene ? [el('p', { class: 'small' }, scene.text), el('div', { class: 'row wrap' }, act('Confront them', () => s.society.respondOrigin('confront'), open, rerender), act('Forgive them', () => s.society.respondOrigin('forgive'), open, rerender), act('Walk on', () => s.society.respondOrigin('ignore'), open, rerender))] : [el('p', { class: 'dim small' }, 'No one is waiting for you now.')]));
  const c = o.apostles.contest;
  const apostles = section(`Rival Apostles (${o.apostles.allies.length} allies, ${o.apostles.enemies.length} enemies)`,
    el('p', { class: 'dim small' }, 'Each god has a rival Apostle who races you for a relic as the seasons turn. Race them, help them, or yield; your treatment decides whether they become a friend or a Grudgebound.'),
    ...(c ? [el('p', { class: 'small' }, `${RIVAL_APOSTLES[c.god]!.name} seeks ${RIVAL_APOSTLES[c.god]!.relic}.`), el('div', { class: 'row wrap' }, act('Race them', () => s.society.respondContest('race'), open, rerender), act('Help them', () => s.society.respondContest('help'), open, rerender), act('Yield', () => s.society.respondContest('yield'), open, rerender))] : []),
    ...Object.entries(RIVAL_APOSTLES).map(([g, r]) => el('div', { class: 'small' }, `${r.name} (${content.gods.get(g).name}): ${s.society.standing(g) >= 3 ? 'ally' : s.society.standing(g) <= -3 ? 'enemy' : `standing ${s.society.standing(g)}`}`)));
  const cands = s.society.candidates();
  const saints = section(`The Ninth Saint (${o.saints.length} of ${SAINT.max})`,
    el('p', { class: 'dim small' }, `Raise a fallen ancestor of your Sworn Bloodline to sainthood. Their blessing lives in the chapel of Emberfall (build it first).`),
    ...o.saints.map((x) => el('p', { class: 'small' }, `Saint ${x.name}, ${x.classId} (level ${x.level})`)),
    ...cands.map((a) => el('div', { class: 'row wrap small' }, `${a.name}, ${a.classId} (level ${a.level})`, act(`Raise (${SAINT.goldPerLevel * a.level} gold)`, () => s.society.raise(a.index), open, rerender))),
    ...(cands.length || o.saints.length ? [] : [el('p', { class: 'dim small' }, 'No ancestors yet.')]));
  const forged = s.society.forged();
  const fitted = o.modules.fitted;
  const modules = section(`Forged Modules${forged ? ` (${fitted.length}/${FORGED.slots} fitted)` : ''}`,
    el('p', { class: 'dim small' }, forged ? 'Build and improve modules at a tinker’s bench (up to level 3); fit four.' : 'Only the Forged carry body modules.'),
    ...(forged ? MODULES.map((mo) => el('div', { class: 'row wrap small' }, el('b', {}, `${mo.name}${o.modules.owned[mo.id] ? ` L${o.modules.owned[mo.id]}` : ''}`), ` ${mo.text} `, act(`Build (${s.society.moduleCost(mo.id)})`, () => s.society.buildModule(mo.id), open, rerender, (o.modules.owned[mo.id] ?? 0) >= FORGED.maxLevel), act(fitted.includes(mo.id) ? 'Unfit' : 'Fit', () => s.society.fit(mo.id, !fitted.includes(mo.id)), open, rerender, !o.modules.owned[mo.id]))) : []));
  return el('div', {}, conj, rivals, origin, apostles, saints, modules, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
