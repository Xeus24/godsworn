import { content } from '../../data';
import { DEFENSE, TOWERS, waveOf, CHOIR } from '../../data/defense';
import { N } from '../../engine/minigames/godsGambit';
import { legalMoves } from '../../engine/minigames/godsGambit';
import { testamentText, writeTestament } from '../../engine/realm/testament';
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
const GLYPH: Record<string, string> = { o: '♚', b: '♜', s: '♝', t: '♞', w: '▣', p: '✦' };

/** Items 41, 59 and 60: Shrine Defense, the Gods' Gambit and the Final Testament. */
export function gamesPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  // 41
  const run = s.games.run;
  const dd = s.state.realm.marvels.trials?.defense;
  const defense = section(`Shrine Defense (best wave ${dd?.best ?? 0}/${DEFENSE.waves})`,
    el('p', { class: 'dim small' }, `The Choir, the Unsworn King’s hymn-cult army, comes down the path in ${DEFENSE.waves} waves. Build towers in the six places beside it; ${DEFENSE.waves} waves held wins the shrine and the title.`),
    ...(run ? [
      el('p', { class: 'small' }, `Wave ${run.wave}: ${waveOf(run.wave).length} singers (${[...new Set(waveOf(run.wave))].map((id) => CHOIR[id]!.name).join(', ')}). Shrine ${run.shrine}/${DEFENSE.shrine}. Faith ${run.faith}.`),
      ...run.towers.map((t, i) => el('div', { class: 'row wrap small' }, `Place ${i + 1}: ${TOWERS.find((x) => x.id === t)?.name ?? 'empty'}`, ...(t ? [act('Clear', () => s.games.clearSlot(i), open, rerender)] : TOWERS.map((x) => act(`${x.name} (${x.cost})`, () => s.games.build(i, x.id), open, rerender, run.faith < x.cost))))),
      el('div', { class: 'row wrap' }, act('Sound the bell', () => s.games.sendWave(), open, rerender), act('Abandon', () => s.games.abandonDefense(), open, rerender)),
      ...run.log.slice(0, 4).map((l) => el('p', { class: 'dim small' }, l)),
    ] : [act('Defend a shrine', () => s.games.startDefense(), open, rerender)]));

  // 59
  const game = s.games.game;
  const sel = (open.cell ??= -1);
  const rec = s.games.record();
  const cells: HTMLElement[] = [];
  if (game) {
    const moves = legalMoves(game.board, 'you');
    for (let i = 0; i < N * N; i++) {
      const c = game.board[i] as string;
      const mine = c !== '.' && c === c.toUpperCase();
      const target = sel >= 0 && moves.some((m) => m.from === sel && m.to === i);
      const b = el('button', { type: 'button', class: `gambit-cell${mine ? ' mine' : c !== '.' ? ' theirs' : ''}${sel === i ? ' sel' : ''}${target ? ' target' : ''}`, 'aria-label': c === '.' ? `empty ${i}` : `${mine ? 'your' : 'their'} ${c.toLowerCase()}` }, c === '.' ? '' : (GLYPH[c.toLowerCase()] ?? c)) as HTMLButtonElement;
      b.addEventListener('click', () => {
        if (target) {
          const r = s.games.chessMove(sel, i);
          open.cell = -1;
          open.outcome = r.ok ? (r.text ?? '') : r.reason;
        } else open.cell = mine ? i : -1;
        rerender();
      });
      cells.push(b);
    }
  }
  const chess = section(`Pantheon Chess: the Gods’ Gambit (${Object.values(rec.wins).filter((n) => n > 0).length} of ${s.games.gods().length} gods beaten)`,
    el('p', { class: 'dim small' }, 'Six pieces a side on a six-by-six board; take the other Oath-keeper (♚). Blade ♜ slides, Spear ♝ goes one or two on a diagonal, Tide ♞ jumps like a knight, Wall ▣ steps one (the Spear cannot take it), Spark ✦ leaps two. Click a piece, then a square.'),
    ...(game ? [el('p', { class: 'small' }, `Against ${content.gods.get(game.god).name}. Move ${game.moves + 1}.`), el('div', { class: 'gambit-board', style: `display:grid;grid-template-columns:repeat(${N},2.4em);gap:2px` }, ...cells), act('Resign', () => s.games.resign(), open, rerender)] : [el('div', { class: 'row wrap' }, ...s.games.gods().map((g) => act(`${content.gods.get(g).name}${(rec.wins[g] ?? 0) > 0 ? ' ✓' : ''}`, () => s.games.startChess(g), open, rerender)))]),
    el('p', { class: 'dim small' }, `Record: ${Object.values(rec.wins).reduce((a, b) => a + b, 0)} wins, ${rec.losses} losses, ${rec.draws} draws.`));

  // 60
  const t = writeTestament(s);
  const copy = act('Copy the Testament', () => { void navigator.clipboard?.writeText(testamentText(s)); return { ok: true, text: 'Copied.' }; }, open, rerender);
  const testament = section('The Final Testament',
    el('p', { class: 'dim small' }, 'A history of this hero written from what you actually did, by Brother Quill. It changes as you play.'),
    el('h3', {}, t.title), el('p', { class: 'dim small' }, t.byline),
    ...t.chapters.flatMap((c) => [el('h4', {}, c.title), el('p', { class: 'small' }, c.text)]),
    copy);
  return el('div', {}, defense, chess, testament, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
