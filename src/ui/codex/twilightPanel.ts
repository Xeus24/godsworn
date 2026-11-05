import { content } from '../../data';
import { ARCHIVE, DOMAINS, FADE, GOD_ZONES, PRAYERS, WAR } from '../../data/twilight';
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
const dim = (t: string): HTMLElement => el('p', { class: 'dim small' }, t);

/** Items 157-167: the Twilight, the Last Rites, the Unsworn Ending, the Flock, the Conclave, the War, the Archivist and the Finale. All folded. */
export function twilightPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const k = s.twilight;
  const t = k.t;
  const dying = k.gods().filter((g) => k.dying(g)).length;
  const rites = k.gods().filter((g) => t.rites[g]).length;
  const scars = section(`Twilight Scars (${k.ng() ? `${dying} dying` : 'New Game+ only'}; ${rites}/${k.gods().length} rites)`,
    dim('In New Game+ the gods fade. Festivals leave the Wheel, Kindred Bonds freeze and their towns decline. At fade 70 you may perform the Last Rites.'),
    ...k.gods().map((g) => {
      const rite = t.rites[g];
      return el('div', { class: 'row wrap small' }, el('b', {}, content.gods.get(g).name), ` (${content.zones.get(GOD_ZONES[g]!).name}) fade ${k.fade(g)}. ${k.scar(g)} `,
        rite ? `${rite}. ${t.slides[g]?.[1] ?? ''} ${rite === 'inherited' ? DOMAINS[g]![0] : ''}` : el('span', {}, act('Save', () => k.rite(g, 'saved'), open, rerender, !k.dying(g)), act('Inherit', () => k.rite(g, 'inherited'), open, rerender, !k.dying(g)), act('Release', () => k.rite(g, 'released'), open, rerender, !k.dying(g))),
        rite === 'inherited' ? act('Face their old enemy', () => k.domainTrial(g), open, rerender) : '');
    }),
    dim(`Stages: ${FADE.stages.map(([n, txt]) => `${n}: ${txt}`).join(' ')}`));
  const un = k.canUnsworn();
  const unsworn = section(`The Unsworn Ending (${t.unsworn.done ? 'walked' : un.ok ? 'open' : 'closed'})`,
    dim('Refuse every god. Needs Forsworn status, all sixteen Lineage pages and the whole Cipher.'),
    act(t.unsworn.step >= 3 ? 'Face the last refusal' : 'Walk the path', () => k.walkUnsworn(), open, rerender, !un.ok), un.ok ? '' : dim((un as { reason: string }).reason));
  const fl = t.flock;
  const flock = section(`Your Flock (${fl.on ? `${fl.followers} followers, ${fl.prayers.length} prayers` : 'New Game+ only'})`,
    dim('Followers send prayers. Answer them, or they drift away. Their tithes go to Emberfall.'),
    ...fl.prayers.map((p) => el('div', { class: 'row wrap small' }, PRAYERS.find((x) => x.id === p.id)!.text, ' ', act('Answer', () => k.answer(p.id), open, rerender))));
  const c = t.conclave;
  const conclave = section(`The Grudgebound Conclave (${k.conclaveOn() ? `${c.repelled} repelled` : 'not yet gathered'})`,
    dim('When five regions harbor living Grudgebound they march together, a town at a time. Defend the town or leave it to its Fortunes, Renown and companions.'),
    ...(c.active ? [el('div', { class: 'row wrap small' }, `${content.towns.get(c.active.town).name}: strength ${c.active.strength}, defense ${Math.round(k.defense(c.active.town))} `, act('Lead the defense', () => k.defend(), open, rerender), act('Leave it to the town', () => k.delegate(), open, rerender))] : []));
  const war = t.war.active;
  const wr = section(`War of the Wheel (${t.war.wins} won)`,
    dim('Three fronts; lead one each turn. Win two and hold two.'),
    ...(war ? [dim(war.fronts.map((f, i) => `${WAR.fronts[i]}: ${f.ours} / ${f.enemy}`).join(' · ')), el('div', { class: 'row wrap' }, ...[0, 1, 2].map((i) => act(`Lead front ${i + 1}`, () => k.warLead(i), open, rerender)))] : [act('Begin the war', () => k.warStart(), open, rerender)]));
  const qq = s.tales.archive();
  const answers = (open.archive ??= qq.map(() => 0));
  const arch = section(`Archivist’s Trials (best ${s.twilight.t.archive.best} of ${ARCHIVE.questions})`,
    dim('Brother Quill’s harder quiz. Rewards scale with accuracy.'),
    ...qq.map((q, i) => {
      const sel = el('select', { 'aria-label': q.q }) as HTMLSelectElement;
      q.options.forEach((o, n) => sel.append(el('option', { value: String(n) }, o)));
      sel.value = String(answers[i] ?? 0);
      sel.addEventListener('change', () => { answers[i] = Number(sel.value); });
      return el('div', { class: 'row wrap small' }, q.q, ' ', sel);
    }),
    act('Give your answers', () => s.tales.answerArchive(answers), open, rerender, !s.tales.quillHere()));
  const finale = section(`Sea and Sky Finale (${s.civic.finaleReady() ? 'ready' : 'waiting'})`, dim('When Harrow Thane and Vessa Gale are both at the height of their grudge, they sail together.'), act('Face them together', () => s.civic.finale(), open, rerender, !s.civic.finaleReady()));
  return el('div', {}, scars, unsworn, flock, conclave, wr, arch, finale, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
