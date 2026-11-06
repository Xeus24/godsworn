import { ARCANA, ARCANA_TEXT, BOONS, BREATHER, DOWNTIME, NOD_MAX, RITES, type Downtime } from '../../data/tabletop';
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
  const rites = RITES.map((r) => {
    const b = el('button', { title: r.text }, `${r.name} (${r.minutes} min)`) as HTMLButtonElement;
    b.addEventListener('click', () => {
      const out = tt.rite(r.id);
      note(out.ok ? out.text : out.reason);
    });
    return el('div', {}, b, el('span', { class: 'dim small' }, ` ${r.text}`));
  });
  const bonds = tt.bonds();
  const bondRows = bonds.length
    ? bonds.map((x) => {
        const b = el('button', {}, x.bonded ? `Release ${x.name}` : `Bond ${x.name}`) as HTMLButtonElement;
        b.addEventListener('click', () => {
          const out = tt.toggleBond(x.uid);
          note(out.ok ? out.text : out.reason);
        });
        return el('div', {}, b, el('span', { class: 'dim small' }, x.bonded ? ' bonded' : ' unbonded: its powers sleep'));
      })
    : [el('p', { class: 'dim small' }, 'No magic items worn. At most three can be bonded at once.')];
  const book = tt.spellbook();
  const bookRows = ARCANA.map((a) => {
    const mine = book.filter((x) => x.arcanum === a);
    return el('p', { class: 'small', title: ARCANA_TEXT[a] }, el('b', {}, `${a}: `), mine.length ? mine.map((x) => `${x.name} (Circle ${x.circle})`).join(', ') : el('span', { class: 'dim' }, 'none'));
  });
  const days = el('select', { 'aria-label': 'Days' }) as HTMLSelectElement;
  for (let d = 1; d <= 7; d++) days.append(el('option', { value: String(d) }, `${d} day${d > 1 ? 's' : ''}`));
  const downtime = DOWNTIME.map((d) => {
    const b = el('button', { title: d.text }, d.name) as HTMLButtonElement;
    b.addEventListener('click', () => {
      const out = tt.downtime(d.id as Downtime, Number(days.value));
      note(out.ok ? out.text : out.reason);
    });
    return el('div', {}, b, el('span', { class: 'dim small' }, ` ${d.text}`));
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
        ...boons,
        el('details', { class: 'small' }, el('summary', {}, 'Rites (slow, free)'), ...rites),
        el('details', { class: 'small' }, el('summary', {}, `Bonding (${bonds.filter((x) => x.bonded).length}/3)`), ...bondRows),
        el('details', { class: 'small' }, el('summary', {}, 'Circles and the Eight Arcana'), ...bookRows),
        el('details', { class: 'small' }, el('summary', {}, 'Between-Acts Downtime (in town)'), days, ...downtime)),
      `${pending > 0 ? `${pending} Boon${pending > 1 ? 's' : ''} · ` : ''}${tt.nods} Nod${tt.nods === 1 ? '' : 's'}`,
    ),
  ];
}
