import { BOONS, BREATHER, NOD_MAX } from '../../data/tabletop';
import type { GameSession } from '../../engine/state/gameState';
import { foldPanel } from '../components/fold';
import { el } from '../screen';

/** The Tabletop Rules panel (Section I-6): Nods, Boons, the Breather. Folded; shown only when the mode is on. */
export function tabletopPanel(s: GameSession, render: () => void): HTMLElement[] {
  const tt = s.tabletop;
  if (!tt.on) return [];
  const p = s.player;
  const pending = tt.boonsPending;
  const note = (text: string): void => {
    s.bus.emit('toast', { kind: 'info', text });
    render();
  };
  const themes = [...new Set(BOONS.map((b) => b.id.split('-')[1] as string))];
  const boons = pending > 0
    ? [
        el('p', { class: 'small' }, `${pending} Boon${pending > 1 ? 's' : ''} to take: pick one, or take 2 stat points instead.`),
        ...(() => {
          const out: HTMLElement[] = [];
          const stat = el('button', {}, '+2 stat points instead');
          stat.addEventListener('click', () => {
            const r = tt.takeStatPoints();
            note(r.ok ? r.text : r.reason);
          });
          out.push(stat);
          for (const th of themes) {
            const mine = BOONS.filter((b) => b.id.split('-')[1] === th);
            out.push(
              el('details', { class: 'small' }, el('summary', {}, `${mine[0]?.name.split(':')[0]}`),
                ...mine.map((b) => {
                  const btn = el('button', { title: b.text }, `${b.name.split(': ')[1]}: ${b.text}`) as HTMLButtonElement;
                  btn.disabled = p.boons?.includes(b.id) ?? false;
                  btn.addEventListener('click', () => {
                    const r = tt.takeBoon(b.id);
                    note(r.ok ? r.text : r.reason);
                  });
                  return btn;
                })),
            );
          }
          return out;
        })(),
      ]
    : [el('p', { class: 'dim small' }, 'No Boon waiting: one comes at every fourth level.')];
  const breather = el('button', {}, `Take a Breather (${tt.breathersLeft} left today)`) as HTMLButtonElement;
  breather.disabled = tt.breathersLeft <= 0;
  breather.addEventListener('click', () => {
    const r = tt.breather();
    note(r.ok ? r.text : r.reason);
  });
  return [
    foldPanel(
      el('section', { class: 'panel' },
        el('h3', {}, 'Tabletop Rules'),
        el('p', { class: 'small' }, `God’s Nod: ${tt.nods}/${NOD_MAX}. Acting on your Ideal, Bond or Flaw earns one; spend it to roll a failed check again. Passive Perception ${tt.passivePerception}.`),
        el('p', { class: 'dim small' }, `A Breather returns ${BREATHER.hpPct}% HP and MP (${BREATHER.perDay} a day); a Night’s Rest at camp or an inn restores everything.`),
        breather,
        el('h4', {}, 'Boons'),
        el('p', { class: 'dim small' }, `Taken: ${(p.boons ?? []).map((id) => BOONS.find((b) => b.id === id)?.name ?? id).join(', ') || 'none'}.`),
        ...boons),
      `${pending > 0 ? `${pending} Boon${pending > 1 ? 's' : ''} · ` : ''}${tt.nods} Nod${tt.nods === 1 ? '' : 's'}`,
    ),
  ];
}
