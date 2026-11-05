import { content } from '../../data';
import { TALES } from '../../data/tales';
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

/** Items 127-139 and 141: the tales, the Temptation and Brother Quill. */
export function talesPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const k = s.tales;
  const tales = TALES.map((t) => {
    const st = k.progress(t.id);
    const done = st?.done !== undefined;
    const ready = k.startable(t.id);
    const step = k.step(t.id);
    const body: HTMLElement[] = [];
    if (!done && step && ready.ok) {
      body.push(el('p', { class: 'small' }, k.fill(t, step.text)));
      for (const { opt, index } of k.options(t.id)) {
        const cost = k.cost(opt);
        body.push(act(`${opt.l}${opt.chk ? ` [${opt.chk[0].toUpperCase()} ${opt.chk[1]}]` : ''}${cost ? ` (${cost} gold)` : ''}`, () => k.choose(t.id, index), open, rerender));
      }
    } else if (!done && !ready.ok) body.push(el('p', { class: 'dim small' }, ready.reason));
    for (const line of (st?.log ?? []).slice(0, 2)) body.push(el('p', { class: 'dim small' }, line));
    return section(`${t.name} (${t.no})${done ? ' ✓' : st ? ' …' : ''}`, el('p', { class: 'dim small' }, t.blurb), ...body);
  });
  const tempt = k.t.tempt;
  const temptBlock = section('The Temptation (127)',
    el('p', { class: 'dim small' }, 'The Unsworn King offers each companion freedom from their god. Approval, oath troubles and what you hold dear decide who gives in.'),
    ...(tempt
      ? Object.entries(tempt).map(([id, state]) => el('div', { class: 'row wrap small' }, el('b', {}, content.companions.get(id).name), ` ${state} `, state === 'fell' || state === 'wavering' ? el('span', {}, act('Win them back', () => k.winBack(id), open, rerender), act('With a gift', () => k.winBack(id, true), open, rerender)) : ''))
      : [act('Let the King speak to your companions', () => k.tempt(), open, rerender, !k.canTempt().ok), el('p', { class: 'dim small' }, k.canTempt().ok ? '' : (k.canTempt() as { reason: string }).reason)]));
  const here = k.quillHere();
  const quiz = k.quiz();
  const answers = (open.quill ??= quiz.map(() => 0));
  const quillBlock = section(`Brother Quill (138): in ${content.towns.get(k.quillTown()).name} this week`,
    el('p', { class: 'dim small' }, 'A wandering archivist who quizzes you on your own story. Right answers pay, and a perfect score is written in the Final Testament.'),
    ...quiz.map((q, i) => {
      const sel = el('select', { 'aria-label': q.q }) as HTMLSelectElement;
      q.options.forEach((opt, n) => sel.append(el('option', { value: String(n) }, opt)));
      sel.value = String(answers[i] ?? 0);
      sel.addEventListener('change', () => { answers[i] = Number(sel.value); });
      return el('div', { class: 'row wrap small' }, q.q, ' ', sel);
    }),
    act('Give your answers', () => k.answerQuiz(answers), open, rerender, !here));
  return el('div', {}, ...tales, temptBlock, quillBlock, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
